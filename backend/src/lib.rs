pub mod auth;
pub mod diff;
pub mod error;
pub mod gateway;
pub mod json;
mod routes;
pub mod schema;
mod security;
pub mod store;
pub mod tokens;

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
    sync::{Arc, Mutex, PoisonError},
    time::{Duration, Instant},
};
use tower::ServiceExt;
use tower_http::services::ServeDir;

pub struct Config {
    pub public_origin: String,
    pub cors_origin: String,
    pub production: bool,
    pub trust_proxy: bool,
    pub client_dir: String,
    /// Redis key prefix for shared rate-limit counters.
    pub rate_limit_prefix: String,
    /// Requests per client IP per 60 seconds on the API.
    pub rate_limit_api_max: u32,
    /// Sign-in requests per client IP per 15 minutes.
    pub rate_limit_auth_max: u32,
}
impl Default for Config {
    fn default() -> Self {
        Self {
            public_origin: "http://localhost:3000".into(),
            cors_origin: "http://localhost:3000".into(),
            production: true,
            trust_proxy: false,
            client_dir: "dist/client".into(),
            rate_limit_prefix: "ratelimit".into(),
            rate_limit_api_max: 100,
            rate_limit_auth_max: 10,
        }
    }
}
#[derive(Clone)]
pub struct AppState(pub Arc<Inner>);
pub struct Inner {
    pub store: store::Store,
    pub config: Config,
    pub client: reqwest::Client,
    /// Per-process limiter used only while the shared Redis limiter is unavailable.
    pub rates: Mutex<HashMap<String, (u32, Instant)>>,
    pub rate_backoff: Mutex<Option<Instant>>,
    pub oidc_ready_until: Mutex<Option<Instant>>,
    pub gateway_keys: gateway::Keys,
}
impl AppState {
    pub fn new(
        config: Config,
        redis_url: &str,
    ) -> std::result::Result<Self, Box<dyn std::error::Error>> {
        let mut client = reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .no_proxy()
            .timeout(Duration::from_secs(10));
        // Empty means unset, so Compose can pass the variable through unconditionally
        if let Some(path) = std::env::var("OIDC_CA_CERT_FILE")
            .ok()
            .filter(|p| !p.is_empty())
        {
            client =
                client.add_root_certificate(reqwest::Certificate::from_pem(&std::fs::read(path)?)?);
        }
        let client = client.build()?;
        Ok(Self(Arc::new(Inner {
            store: store::Store::new(redis_url)?,
            config,
            client,
            rates: Mutex::new(HashMap::new()),
            rate_backoff: Mutex::new(None),
            oidc_ready_until: Mutex::new(None),
            gateway_keys: Default::default(),
        })))
    }
    pub async fn session(&self, headers: &HeaderMap) -> Result<Value> {
        auth::session(self, headers).await
    }
}
pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(health))
        .route("/readyz", get(ready))
        .route("/api/auth/{*path}", any(auth::handle))
        .route("/api/auth", any(auth::handle))
        .nest("/api/_ui/v1", routes::dashboard())
        .merge(routes::legacy())
        .fallback(frontend)
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            security::middleware,
        ))
        .with_state(state)
}
async fn health(State(_state): State<AppState>) -> Response {
    axum::Json(json!({"ok":true,"backend":"rust"})).into_response()
}
/// Successful provider discovery is reused briefly so frequent probes do not hammer Handstamp.
const OIDC_READY_TTL: Duration = Duration::from_secs(30);
async fn oidc_ready(state: &AppState, issuer: &str) -> bool {
    let now = Instant::now();
    let cached = *state
        .0
        .oidc_ready_until
        .lock()
        .unwrap_or_else(PoisonError::into_inner);
    if cached.is_some_and(|until| until > now) {
        return true;
    }
    let issuer = issuer.trim_end_matches('/');
    let check = async {
        let url = url::Url::parse(issuer).ok()?;
        if url.scheme() != "https" && state.0.config.production {
            return None;
        }
        let document: Value = state
            .0
            .client
            .get(format!("{issuer}/.well-known/openid-configuration"))
            .timeout(Duration::from_secs(2))
            .send()
            .await
            .ok()?
            .error_for_status()
            .ok()?
            .json()
            .await
            .ok()?;
        Some(document["issuer"].as_str()?.trim_end_matches('/') == issuer)
    };
    let ready = check.await == Some(true);
    if ready {
        *state
            .0
            .oidc_ready_until
            .lock()
            .unwrap_or_else(PoisonError::into_inner) = Some(now + OIDC_READY_TTL);
    }
    ready
}
/// Readiness: Redis answers and, when configured, Handstamp discovery is reachable. Failures expose only the check name.
async fn ready(State(state): State<AppState>) -> Response {
    let issuer = std::env::var("OIDC_ISSUER").unwrap_or_default();
    let (redis, oidc) = tokio::join!(state.0.store.ping(Duration::from_secs(1)), async {
        (!issuer.is_empty()).then_some(oidc_ready(&state, &issuer).await)
    });
    let status = |ok: bool| if ok { "ok" } else { "unavailable" };
    let mut checks = serde_json::Map::new();
    checks.insert("redis".into(), status(redis).into());
    if let Some(oidc) = oidc {
        checks.insert("oidc".into(), status(oidc).into());
    }
    let ok = redis && oidc != Some(false);
    if !ok {
        tracing::warn!(?checks, "Readiness check failed");
    }
    (
        if ok {
            StatusCode::OK
        } else {
            StatusCode::SERVICE_UNAVAILABLE
        },
        [("cache-control", "no-store")],
        axum::Json(json!({"ok":ok,"checks":checks})),
    )
        .into_response()
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
