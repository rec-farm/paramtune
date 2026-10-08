use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use paramtune_api::{AppState, Config, router};
use tower::ServiceExt;

fn state() -> (AppState, tempfile::TempDir) {
    state_with(UNREACHABLE_REDIS, Config::default())
}
const UNREACHABLE_REDIS: &str = "redis://127.0.0.1:1/15";
fn state_with(redis_url: &str, config: Config) -> (AppState, tempfile::TempDir) {
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
            client_dir: client_dir.path().to_str().unwrap().into(),
            ..config
        },
        redis_url,
    )
    .unwrap();
    (state, client_dir)
}
fn test_redis() -> String {
    std::env::var("E2E_REDIS_URL").unwrap_or("redis://127.0.0.1:6379/15".into())
}
fn shared(rate_limit_prefix: &str) -> Config {
    Config {
        rate_limit_prefix: rate_limit_prefix.into(),
        ..Config::default()
    }
}
fn unique_prefix() -> String {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("ratelimit:test-{}-{nanos}", std::process::id())
}
async fn json(response: axum::response::Response) -> serde_json::Value {
    use http_body_util::BodyExt;
    serde_json::from_slice(&response.into_body().collect().await.unwrap().to_bytes()).unwrap()
}
fn get(path: &str) -> Request<Body> {
    Request::builder().uri(path).body(Body::empty()).unwrap()
}
#[tokio::test]
async fn readiness_reports_redis_outage_without_details() {
    let (state, _client_dir) = state();
    let app = router(state);
    let response = app.clone().oneshot(get("/healthz")).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let response = app.oneshot(get("/readyz")).await.unwrap();
    assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(response.headers()["cache-control"], "no-store");
    let body = json(response).await;
    assert_eq!(body["ok"], false);
    assert_eq!(body["checks"]["redis"], "unavailable");
    assert!(!body.to_string().contains("127.0.0.1"));
}
#[tokio::test]
async fn readiness_succeeds_with_redis() {
    let (state, _client_dir) = state_with(&test_redis(), shared(&unique_prefix()));
    let response = router(state).oneshot(get("/readyz")).await.unwrap();
    let configured = std::env::var("OIDC_ISSUER").is_ok_and(|v| !v.is_empty());
    let status = response.status();
    let body = json(response).await;
    assert_eq!(body["checks"]["redis"], "ok");
    if !configured {
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body, serde_json::json!({"ok":true,"checks":{"redis":"ok"}}));
    }
}
#[tokio::test]
async fn replicas_share_rate_limits_through_redis() {
    let prefix = unique_prefix();
    let (first, _first_dir) = state_with(&test_redis(), shared(&prefix));
    let (second, _second_dir) = state_with(&test_redis(), shared(&prefix));
    let replicas = [router(first.clone()), router(second)];
    for index in 0..10 {
        let response = replicas[index % 2]
            .clone()
            .oneshot(get("/api/auth/sign-in/email"))
            .await
            .unwrap();
        assert_ne!(response.status(), StatusCode::TOO_MANY_REQUESTS);
    }
    let response = replicas[0]
        .clone()
        .oneshot(get("/api/auth/sign-in/email"))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);
    let retry: u64 = response.headers()["retry-after"]
        .to_str()
        .unwrap()
        .parse()
        .unwrap();
    assert!((1..=900).contains(&retry));
    // The other bucket keeps its own allowance.
    let response = replicas[1]
        .clone()
        .oneshot(get("/api/schemas"))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let (count, remaining) = first
        .0
        .store
        .hit(
            &format!("{prefix}:auth:local"),
            std::time::Duration::from_secs(900),
        )
        .await
        .unwrap();
    assert_eq!(count, 12);
    assert!(remaining > 0 && remaining <= 900_000);
    let mut connection = redis::Client::open(test_redis())
        .unwrap()
        .get_multiplexed_async_connection()
        .await
        .unwrap();
    let _: () = redis::cmd("DEL")
        .arg(format!("{prefix}:auth:local"))
        .arg(format!("{prefix}:api:local"))
        .query_async(&mut connection)
        .await
        .unwrap();
}
#[tokio::test]
async fn redis_outage_falls_back_to_fast_local_limits() {
    let (state, _client_dir) = state_with(
        UNREACHABLE_REDIS,
        Config {
            rate_limit_api_max: 20,
            ..Config::default()
        },
    );
    let app = router(state);
    let started = std::time::Instant::now();
    for _ in 0..20 {
        let response = app.clone().oneshot(get("/api/schemas")).await.unwrap();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }
    let response = app.oneshot(get("/api/schemas")).await.unwrap();
    assert_eq!(response.status(), StatusCode::TOO_MANY_REQUESTS);
    // One bounded Redis attempt, then backoff: an outage must not add seconds per request.
    assert!(started.elapsed() < std::time::Duration::from_secs(2));
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
