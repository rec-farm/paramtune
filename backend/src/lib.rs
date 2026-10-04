pub mod diff;
pub mod error;
pub mod json;
mod routes;
pub mod schema;
mod security;
pub mod store;

use axum::{
    Router,
    body::Body,
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{any, get},
};
use error::{ApiError, Result};
use serde_json::{Value, json};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use tower::ServiceExt;
use tower_http::services::ServeDir;

pub struct Config {
    pub auth_url: String,
    pub public_origin: String,
    pub cors_origin: String,
    pub production: bool,
    pub trust_proxy: bool,
    pub client_dir: String,
}
#[derive(Clone)]
pub struct AppState(pub Arc<Inner>);
pub struct Inner {
    pub store: store::Store,
    pub config: Config,
    pub client: reqwest::Client,
    pub rates: Mutex<HashMap<String, (u32, Instant)>>,
}
impl AppState {
    pub fn new(
        config: Config,
        redis_url: &str,
    ) -> std::result::Result<Self, Box<dyn std::error::Error>> {
        // Auth traffic is never redirected to external destinations or sent via an environment proxy.
        let auth = url::Url::parse(&config.auth_url)?;
        if auth.scheme() != "http"
            || !matches!(auth.host_str(), Some("127.0.0.1" | "[::1]"))
            || auth.path() != "/"
            || auth.query().is_some()
            || auth.fragment().is_some()
            || !auth.username().is_empty()
            || auth.password().is_some()
        {
            return Err("AUTH_SERVICE_URL must be an HTTP loopback origin".into());
        }
        let client = reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .no_proxy()
            .timeout(Duration::from_secs(10))
            .build()?;
        Ok(Self(Arc::new(Inner {
            store: store::Store::new(redis_url)?,
            config,
            client,
            rates: Mutex::new(HashMap::new()),
        })))
    }
    pub async fn session(&self, headers: &HeaderMap) -> Result<Value> {
        let mut request = self.0.client.get(format!(
            "{}/_internal/session",
            self.0.config.auth_url.trim_end_matches('/')
        ));
        if let Some(cookie) = headers.get("cookie") {
            request = request.header("cookie", cookie);
        }
        let response = request.send().await.map_err(|_| ApiError::unavailable())?;
        if !response.status().is_success() {
            return Err(ApiError::unavailable());
        }
        let session: Value = response.json().await.map_err(|_| ApiError::unavailable())?;
        if session.is_null() {
            return Err(ApiError(StatusCode::UNAUTHORIZED, "Unauthorized".into()));
        }
        if !session["user"]["id"].is_string() || !session["session"].is_object() {
            return Err(ApiError::unavailable());
        }
        Ok(session)
    }
}
pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(health))
        .route("/api/auth/{*path}", any(auth_proxy))
        .route("/api/auth", any(auth_proxy))
        .nest("/api/_ui/v1", routes::dashboard())
        .merge(routes::legacy())
        .fallback(frontend)
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            security::middleware,
        ))
        .with_state(state)
}
async fn health(State(state): State<AppState>) -> Response {
    match state
        .0
        .client
        .get(format!(
            "{}/healthz",
            state.0.config.auth_url.trim_end_matches('/')
        ))
        .send()
        .await
    {
        Ok(response) if response.status().is_success() => {
            axum::Json(json!({"ok":true,"backend":"rust"})).into_response()
        }
        _ => ApiError::unavailable().into_response(),
    }
}
fn hop_headers(headers: &HeaderMap) -> Vec<String> {
    let mut names = vec![
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
        "host",
        "content-length",
    ]
    .into_iter()
    .map(str::to_owned)
    .collect::<Vec<_>>();
    for value in headers.get_all("connection") {
        if let Ok(value) = value.to_str() {
            names.extend(
                value
                    .split(',')
                    .map(|name| name.trim().to_ascii_lowercase()),
            );
        }
    }
    names
}
async fn auth_proxy(State(state): State<AppState>, request: Request) -> Result<Response> {
    let uri = request
        .uri()
        .path_and_query()
        .map(|v| v.as_str())
        .unwrap_or("/")
        .to_owned();
    let upstream = url::Url::parse(&format!(
        "{}{}",
        state.0.config.auth_url.trim_end_matches('/'),
        uri
    ))
    .map_err(|_| ApiError::bad("Invalid auth request URL"))?;
    // URL normalization must not move a public request into private auth routes.
    if upstream.path() != "/api/auth" && !upstream.path().starts_with("/api/auth/") {
        return Err(ApiError::missing("Not found"));
    }
    let ip = security::client_ip(&state, &request);
    let (parts, body) = request.into_parts();
    let body = axum::body::to_bytes(body, 1024 * 1024).await.map_err(|_| {
        ApiError(
            StatusCode::PAYLOAD_TOO_LARGE,
            "Request body exceeds 1 MiB".into(),
        )
    })?;
    let excluded = hop_headers(&parts.headers);
    let mut forwarded = HeaderMap::new();
    for (name, value) in &parts.headers {
        if !excluded.contains(&name.as_str().to_owned())
            && !name.as_str().starts_with("x-forwarded-")
            && name != "x-real-ip"
            && name != "x-paramtune-client-ip"
        {
            forwarded.append(name.clone(), value.clone());
        }
    }
    let response = state
        .0
        .client
        .request(parts.method, upstream)
        .headers(forwarded)
        .header("content-length", body.len())
        .header("x-paramtune-client-ip", ip)
        .body(body)
        .send()
        .await
        .map_err(|_| ApiError::unavailable())?;
    let status = response.status();
    let headers = response.headers().clone();
    let excluded = hop_headers(&headers);
    let body = response
        .bytes()
        .await
        .map_err(|_| ApiError::unavailable())?;
    let mut result = Response::new(Body::from(body));
    *result.status_mut() = status;
    for (name, value) in &headers {
        if !excluded.contains(&name.as_str().to_owned()) {
            result.headers_mut().append(name.clone(), value.clone());
        }
    }
    Ok(result)
}
async fn frontend(State(state): State<AppState>, request: Request) -> Response {
    let path = request.uri().path().to_owned();
    if path == "/api" || path.starts_with("/api/") {
        return ApiError::missing("Not found").into_response();
    }
    if !state.0.config.production {
        return ApiError::missing("Not found").into_response();
    }
    if request.method() != "GET" && request.method() != "HEAD" {
        return StatusCode::METHOD_NOT_ALLOWED.into_response();
    }
    let dashboard = path == "/dashboard" || path.starts_with("/dashboard/");
    if dashboard && let Err(error) = state.session(request.headers()).await {
        if error.0 != StatusCode::UNAUTHORIZED {
            return error.into_response();
        }
        let destination = request
            .uri()
            .path_and_query()
            .map(|v| v.as_str())
            .unwrap_or(&path);
        let encoded: String =
            url::form_urlencoded::byte_serialize(destination.as_bytes()).collect();
        return axum::response::Redirect::to(&format!("/login?returnTo={encoded}")).into_response();
    }
    let head = request.method() == "HEAD";
    let mut static_response = ServeDir::new(&state.0.config.client_dir)
        .oneshot(request)
        .await
        .unwrap()
        .into_response();
    if static_response.status() != StatusCode::NOT_FOUND {
        return static_response;
    }
    let known =
        path == "/login" || (dashboard && path.trim_end_matches('/').split('/').count() <= 4);
    let last = path.rsplit('/').next().unwrap_or_default();
    if last.contains('.') && !dashboard {
        return static_response;
    }
    match tokio::fs::read(format!("{}/app.html", state.0.config.client_dir)).await {
        Ok(html) => {
            static_response = (
                if known {
                    StatusCode::OK
                } else {
                    StatusCode::NOT_FOUND
                },
                [("content-type", "text/html; charset=utf-8")],
                if head {
                    Body::empty()
                } else {
                    Body::from(html)
                },
            )
                .into_response();
            static_response
        }
        Err(error) => {
            tracing::error!(%error,"Frontend shell unavailable");
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}
