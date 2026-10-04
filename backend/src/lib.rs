pub mod auth;
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
        let mut client = reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::none())
            .no_proxy()
            .timeout(Duration::from_secs(10));
        if let Ok(path) = std::env::var("OIDC_CA_CERT_FILE") {
            client =
                client.add_root_certificate(reqwest::Certificate::from_pem(&std::fs::read(path)?)?);
        }
        let client = client.build()?;
        Ok(Self(Arc::new(Inner {
            store: store::Store::new(redis_url)?,
            config,
            client,
            rates: Mutex::new(HashMap::new()),
        })))
    }
    pub async fn session(&self, headers: &HeaderMap) -> Result<Value> {
        auth::session(self, headers).await
    }
}
pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/healthz", get(health))
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
