use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

#[derive(Debug)]
pub struct ApiError(pub StatusCode, pub String);
pub type Result<T> = std::result::Result<T, ApiError>;
impl ApiError {
    pub fn bad(message: impl Into<String>) -> Self {
        Self(StatusCode::BAD_REQUEST, message.into())
    }
    pub fn missing(message: &str) -> Self {
        Self(StatusCode::NOT_FOUND, message.into())
    }
    pub fn unavailable() -> Self {
        Self(
            StatusCode::SERVICE_UNAVAILABLE,
            "Authentication service unavailable".into(),
        )
    }
}
impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.0, Json(json!({"error": self.1}))).into_response()
    }
}
impl From<redis::RedisError> for ApiError {
    fn from(error: redis::RedisError) -> Self {
        tracing::error!(%error, "Redis operation failed");
        Self(
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal Server Error".into(),
        )
    }
}
