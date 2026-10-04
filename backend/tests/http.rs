use axum::{
    Router,
    body::Body,
    http::{Request, StatusCode},
    response::IntoResponse,
    routing::get,
};
use paramtune_api::{AppState, Config, router};
use serde_json::json;
use tower::ServiceExt;

fn state(auth_url: String) -> (AppState, tempfile::TempDir) {
    // CI runs Rust tests before Vite builds the production assets.
    let client_dir = tempfile::tempdir().unwrap();
    std::fs::write(
        client_dir.path().join("app.html"),
        "<!doctype html><html></html>",
    )
    .unwrap();
    let state = AppState::new(
        Config {
            auth_url,
            public_origin: "https://paramtune.example".into(),
            cors_origin: "https://paramtune.example".into(),
            production: true,
            trust_proxy: false,
            client_dir: client_dir.path().to_str().unwrap().into(),
        },
        "redis://127.0.0.1:1/15",
    )
    .unwrap();
    (state, client_dir)
}
async fn auth() -> (String, tokio::task::JoinHandle<()>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let task = tokio::spawn(async move {
        axum::serve(
            listener,
            Router::new()
                .route("/healthz", get(|| async { axum::Json(json!({"ok":true})) }))
                .route(
                    "/_internal/session",
                    get(|headers: axum::http::HeaderMap| async move {
                        axum::Json(if headers.contains_key("cookie") {
                            json!({"user":{"id":"fake"}})
                        } else {
                            serde_json::Value::Null
                        })
                    }),
                )
                .route(
                    "/api/auth/cookies",
                    get(|| async {
                        let mut response = "cookies".into_response();
                        response
                            .headers_mut()
                            .append("set-cookie", "a=1; HttpOnly".parse().unwrap());
                        response
                            .headers_mut()
                            .append("set-cookie", "b=2; HttpOnly".parse().unwrap());
                        response
                    }),
                ),
        )
        .await
        .unwrap();
    });
    (format!("http://{address}"), task)
}
#[tokio::test]
async fn session_failures_never_authorize_and_auth_cookies_survive() {
    let (url, task) = auth().await;
    let (state, _client_dir) = state(url);
    let app = router(state);
    let request = Request::builder()
        .uri("/api/schemas")
        .header("x-user-id", "forged")
        .body(Body::empty())
        .unwrap();
    let response = app.clone().oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    assert_eq!(response.headers()["cache-control"], "no-store");
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/auth/cookies")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.headers().get_all("set-cookie").iter().count(), 2);
    assert_eq!(
        response.headers()["content-type"],
        "text/plain; charset=utf-8"
    );
    let malformed = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/schemas")
                .header("cookie", "bad")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(malformed.status(), StatusCode::SERVICE_UNAVAILABLE);
    for path in [
        "/_internal/session",
        "/api/auth/%2e%2e/%2e%2e/_internal/session",
    ] {
        let response = app
            .clone()
            .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }
    task.abort();
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/schemas")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
}
#[tokio::test]
async fn security_and_rate_limits_precede_domain_operations() {
    let (url, task) = auth().await;
    let (state, _client_dir) = state(url);
    let app = router(state);
    for (header, value, expected) in [
        ("origin", "https://evil.example", 403),
        ("sec-fetch-site", "cross-site", 403),
        ("content-type", "text/plain", 415),
    ] {
        let request = Request::builder()
            .method("POST")
            .uri("/api/_ui/v1/platforms")
            .header(header, value)
            .body(Body::from("{}"))
            .unwrap();
        assert_eq!(
            app.clone()
                .oneshot(request)
                .await
                .unwrap()
                .status()
                .as_u16(),
            expected
        );
    }
    for _ in 0..10 {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/auth/sign-in/email")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_ne!(response.status(), StatusCode::TOO_MANY_REQUESTS);
    }
    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/auth/sign-in/email")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);
    assert!(response.headers().contains_key("retry-after"));
    task.abort();
}
#[test]
fn auth_service_cannot_be_an_external_url() {
    assert!(
        AppState::new(
            Config {
                auth_url: "https://example.com".into(),
                public_origin: "https://paramtune.example".into(),
                cors_origin: "*".into(),
                production: true,
                trust_proxy: false,
                client_dir: "dist/client".into()
            },
            "redis://127.0.0.1/15"
        )
        .is_err()
    );
}
