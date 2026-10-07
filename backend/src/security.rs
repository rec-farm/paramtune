use crate::{AppState, error::ApiError};
use axum::{
    extract::{ConnectInfo, Request, State},
    http::{HeaderValue, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::PoisonError,
    time::{Duration, Instant},
};
fn header(request: &Request, name: &str) -> Option<String> {
    request
        .headers()
        .get(name)
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned)
}
pub(crate) fn client_ip(state: &AppState, request: &Request) -> String {
    if state.0.config.trust_proxy {
        header(request, "x-forwarded-for")
            .and_then(|v| v.split(',').next().map(|v| v.trim().to_owned()))
            .or_else(|| header(request, "x-real-ip"))
            .unwrap_or("unknown".into())
    } else {
        request
            .extensions()
            .get::<ConnectInfo<SocketAddr>>()
            .map(|v| v.0.ip().to_string())
            .unwrap_or("local".into())
    }
}
pub async fn middleware(State(state): State<AppState>, request: Request, next: Next) -> Response {
    let path = request.uri().path().to_owned();
    let api = path.starts_with("/api/");
    let origin = header(&request, "origin");
    let response = if api {
        protect(&state, request, next).await
    } else {
        next.run(request).await
    };
    decorate(&state, response, api, origin.as_deref(), &path)
}
/// Counts one request for `key`; returns seconds to wait once `max` is exceeded within `window`.
fn rate_limit_retry(
    rates: &mut HashMap<String, (u32, Instant)>,
    key: String,
    max: u32,
    window: Duration,
    now: Instant,
) -> Option<u64> {
    rates.retain(|_, (_, deadline)| *deadline > now);
    let (count, deadline) = rates.entry(key).or_insert((0, now + window));
    *count += 1;
    (*count > max).then(|| deadline.duration_since(now).as_secs() + 1)
}
async fn protect(state: &AppState, request: Request, next: Next) -> Response {
    let path = request.uri().path();
    if path == "/api/auth/backchannel-logout" {
        return next.run(request).await;
    }
    let ip = client_ip(state, &request);
    let auth = path.strip_prefix("/api/auth/").is_some_and(|tail| {
        matches!(
            tail.split('/').next(),
            Some("sign-in" | "sign-up" | "callback" | "oauth2" | "dev-login")
        )
    });
    let (max, window) = if auth {
        (10, Duration::from_secs(900))
    } else {
        (100, Duration::from_secs(60))
    };
    let now = Instant::now();
    let retry = {
        // A panic elsewhere must not poison the limiter and fail every later request.
        let mut rates = state.0.rates.lock().unwrap_or_else(PoisonError::into_inner);
        let key = format!("{}:{ip}", if auth { "auth" } else { "api" });
        rate_limit_retry(&mut rates, key, max, window, now)
    };
    if let Some(retry) = retry {
        let mut response =
            ApiError(StatusCode::TOO_MANY_REQUESTS, "Too many requests".into()).into_response();
        response
            .headers_mut()
            .insert("retry-after", HeaderValue::from(retry));
        return response;
    }
    if request.method() == "OPTIONS" {
        return StatusCode::NO_CONTENT.into_response();
    }
    let callback = path
        .strip_prefix("/api/auth/callback/")
        .or_else(|| path.strip_prefix("/api/auth/oauth2/callback/"))
        .is_some_and(|tail| !tail.is_empty() && !tail.contains('/'));
    if request.method() != "GET" && request.method() != "HEAD" && !callback {
        if header(&request, "origin").is_some_and(|v| v != state.0.config.public_origin) {
            return ApiError(StatusCode::FORBIDDEN, "Untrusted request origin".into())
                .into_response();
        }
        if header(&request, "sec-fetch-site").as_deref() == Some("cross-site") {
            return ApiError(StatusCode::FORBIDDEN, "Cross-site mutation rejected".into())
                .into_response();
        }
        if !path.starts_with("/api/auth/")
            && !header(&request, "content-type").is_some_and(|v| {
                v.split(';').next().unwrap_or_default().trim() == "application/json"
            })
        {
            return ApiError(
                StatusCode::UNSUPPORTED_MEDIA_TYPE,
                "Content-Type must be application/json".into(),
            )
            .into_response();
        }
    }
    next.run(request).await
}
fn decorate(
    state: &AppState,
    mut response: Response,
    api: bool,
    origin: Option<&str>,
    path: &str,
) -> Response {
    let headers = response.headers_mut();
    for (name, value) in [
        ("x-content-type-options", "nosniff"),
        ("referrer-policy", "strict-origin-when-cross-origin"),
        ("x-frame-options", "SAMEORIGIN"),
    ] {
        headers.insert(name, HeaderValue::from_static(value));
    }
    if state.0.config.production {
        headers.insert(
            "strict-transport-security",
            HeaderValue::from_static("max-age=63072000; includeSubDomains; preload"),
        );
    }
    if api {
        let allowed = &state.0.config.cors_origin;
        let value = if allowed == "*" {
            "*"
        } else if origin == Some(allowed.as_str()) {
            allowed
        } else {
            "null"
        };
        headers.insert(
            "access-control-allow-origin",
            HeaderValue::from_str(value).unwrap_or(HeaderValue::from_static("null")),
        );
        headers.append("vary", HeaderValue::from_static("Origin"));
        for (name, value) in [
            (
                "access-control-allow-methods",
                "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            ),
            (
                "access-control-allow-headers",
                "Content-Type, Authorization",
            ),
            ("access-control-expose-headers", "Retry-After"),
            ("access-control-max-age", "86400"),
            ("cache-control", "no-store"),
        ] {
            headers.insert(name, HeaderValue::from_static(value));
        }
        if state.0.config.production {
            headers.insert("content-security-policy",HeaderValue::from_static("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'"));
        }
    } else if path == "/dashboard" || path.starts_with("/dashboard/") {
        headers.insert("cache-control", HeaderValue::from_static("no-store"));
    } else if path.starts_with("/assets/") && response.status().is_success() {
        response.headers_mut().insert(
            "cache-control",
            HeaderValue::from_static("public, max-age=31536000, immutable"),
        );
    }
    response
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn limits_per_key_and_resets_after_window() {
        let mut rates = HashMap::new();
        let window = Duration::from_secs(60);
        let now = Instant::now();
        for _ in 0..2 {
            assert_eq!(
                rate_limit_retry(&mut rates, "a".into(), 2, window, now),
                None
            );
        }
        assert_eq!(
            rate_limit_retry(&mut rates, "a".into(), 2, window, now),
            Some(61)
        );
        assert_eq!(
            rate_limit_retry(&mut rates, "b".into(), 2, window, now),
            None
        );
        let later = now + window;
        assert_eq!(
            rate_limit_retry(&mut rates, "a".into(), 2, window, later),
            None
        );
    }
}
