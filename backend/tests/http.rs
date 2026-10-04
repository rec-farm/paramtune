use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use paramtune_api::{AppState, Config, router};
use tower::ServiceExt;

fn state() -> (AppState, tempfile::TempDir) {
    // CI runs Rust tests before Vite builds the production assets.
    let client_dir = tempfile::tempdir().unwrap();
    std::fs::write(
        client_dir.path().join("app.html"),
        "<!doctype html><html></html>",
    )
    .unwrap();
    let state = AppState::new(
        Config {
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
#[tokio::test]
async fn sessions_fail_closed_and_production_disables_dev_login() {
    let (state, _client_dir) = state();
    let app = router(state);
    for cookie in [
        None,
        Some("untrusted-session=forged"),
        Some("__Host-paramtune-session=invalid"),
    ] {
        let mut request = Request::builder().uri("/api/schemas");
        if let Some(cookie) = cookie {
            request = request.header("cookie", cookie);
        }
        let response = app
            .clone()
            .oneshot(request.body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(response.headers()["cache-control"], "no-store");
    }
    // A correctly shaped but unknown session must consult Redis, whose outage never grants access.
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/schemas")
                .header(
                    "cookie",
                    format!("__Host-paramtune-session={}", "a".repeat(43)),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/auth/dev-login")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    for path in [
        "/api/auth/cookies",
        "/api/auth/%2e%2e/%2e%2e/_internal/session",
    ] {
        let response = app
            .clone()
            .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }
}
#[tokio::test]
async fn security_and_rate_limits_precede_domain_operations() {
    let (state, _client_dir) = state();
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
}
