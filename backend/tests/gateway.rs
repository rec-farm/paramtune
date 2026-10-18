//! Agents acting for people through farmhand: signed assertions against a mock key set and the
//! test Redis (`E2E_REDIS_URL`, default `redis://127.0.0.1:6379/15`). Settings are process-wide
//! environment variables, so everything runs in one test.
use axum::{
    Json, Router,
    body::Body,
    http::{Request, StatusCode},
    routing::get,
};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use ed25519_dalek::{SigningKey, pkcs8::EncodePrivateKey};
use http_body_util::BodyExt;
use jsonwebtoken::{Algorithm, EncodingKey, Header, encode};
use paramtune_api::{AppState, Config, router};
use serde_json::{Value, json};
use tower::ServiceExt;

const ORIGIN: &str = "https://paramtune.example";

async fn call(
    app: &Router,
    method: &str,
    path: &str,
    token: &str,
    body: Option<Value>,
) -> (StatusCode, Value) {
    let mut request = Request::builder()
        .method(method)
        .uri(path)
        .header("authorization", format!("Bearer {token}"));
    let body = match body {
        Some(value) => {
            request = request.header("content-type", "application/json");
            Body::from(value.to_string())
        }
        None => Body::empty(),
    };
    let response = app
        .clone()
        .oneshot(request.body(body).unwrap())
        .await
        .unwrap();
    let status = response.status();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (
        status,
        serde_json::from_slice(&bytes).unwrap_or(Value::Null),
    )
}

#[tokio::test]
async fn agents_act_with_their_persons_role_capped_by_scope() {
    let key = SigningKey::from_bytes(&[7; 32]);
    let jwks = json!({"keys":[{"kty":"OKP","crv":"Ed25519","alg":"EdDSA","kid":"k1",
        "x":URL_SAFE_NO_PAD.encode(key.verifying_key().as_bytes())}]});
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let issuer = format!("http://{}", listener.local_addr().unwrap());
    let farmhand = Router::new().route(
        "/.well-known/jwks.json",
        get(move || async move { Json(jwks) }),
    );
    tokio::spawn(async move { axum::serve(listener, farmhand).await.unwrap() });
    // SAFETY: this test binary has a single test, so nothing reads the environment concurrently.
    unsafe {
        std::env::set_var("GATEWAY_ISSUER", &issuer);
        std::env::set_var("OIDC_ISSUER", "https://id.example");
        std::env::set_var("OIDC_ADMIN_GROUP", "paramtune-admin");
        std::env::set_var("OIDC_EDITOR_GROUP", "paramtune-editor");
    }
    let claims = |sub: &str, groups: &[&str], scope: &str| {
        let now = chrono::Utc::now().timestamp();
        json!({"iss":issuer,"aud":ORIGIN,"iat":now,"exp":now+60,"jti":sub,
            "user":{"iss":"https://id.example","sub":sub,"email":format!("{sub}@example.com"),"groups":groups},
            "scope":scope,"act":{"sub":"https://claude.ai/client","name":"Claude Code"},"actor_type":"person"})
    };
    let sign = |claims: &Value, typ: &str| {
        let mut header = Header::new(Algorithm::EdDSA);
        header.kid = Some("k1".into());
        header.typ = Some(typ.into());
        let der = key.to_pkcs8_der().unwrap();
        encode(&header, claims, &EncodingKey::from_ed_der(der.as_bytes())).unwrap()
    };
    let assertion = |sub: &str, groups: &[&str], scope: &str| {
        sign(&claims(sub, groups, scope), "farmhand-assertion+jwt")
    };

    let client_dir = tempfile::tempdir().unwrap();
    std::fs::write(client_dir.path().join("app.html"), "<!doctype html>").unwrap();
    let redis = std::env::var("E2E_REDIS_URL").unwrap_or("redis://127.0.0.1:6379/15".into());
    let state = AppState::new(
        Config {
            public_origin: ORIGIN.into(),
            cors_origin: ORIGIN.into(),
            client_dir: client_dir.path().to_str().unwrap().into(),
            ..Config::default()
        },
        &redis,
    )
    .unwrap();
    let app = router(state);
    let platform = format!(
        "agent-test-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );
    let ui = "/api/_ui/v1";

    // Reading needs paramtune:read; writing needs paramtune:write and the person's editor role.
    let read = assertion("ada", &["paramtune-editor"], "paramtune:read");
    let (status, body) = call(&app, "GET", &format!("{ui}/overview"), &read, None).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    let create = json!({"name": platform});
    let (status, _) = call(
        &app,
        "POST",
        &format!("{ui}/platforms"),
        &read,
        Some(create.clone()),
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let member = assertion("bob", &[], "paramtune:read paramtune:write");
    let (status, _) = call(
        &app,
        "POST",
        &format!("{ui}/platforms"),
        &member,
        Some(create.clone()),
    )
    .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let write = assertion(
        "ada",
        &["paramtune-editor"],
        "paramtune:read paramtune:write",
    );
    let (status, body) = call(
        &app,
        "POST",
        &format!("{ui}/platforms"),
        &write,
        Some(create),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let versions = format!("{ui}/platforms/{platform}/versions");
    let (status, body) = call(
        &app,
        "POST",
        &versions,
        &write,
        Some(json!({"version":"1.0.0"})),
    )
    .await;
    assert!(status.is_success(), "{status} {body}");
    let schema = format!("{versions}/1.0.0/schema");
    let content = json!({"content":{"timeout":{"type":"number","default":30}}});
    let (status, body) = call(&app, "PUT", &schema, &write, Some(content)).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    let (status, body) = call(&app, "GET", &schema, &read, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["schema"]["author"]["agent"], "Claude Code", "{body}");

    // Even an administrator's agent never deletes, publishes or manages API tokens.
    let admin = assertion(
        "grace",
        &["paramtune-admin"],
        "paramtune:read paramtune:write",
    );
    for (method, path, body) in [
        (
            "DELETE",
            format!("{ui}/platforms/{platform}"),
            Some(json!({})),
        ),
        (
            "PATCH",
            format!("{ui}/platforms/{platform}"),
            Some(json!({"public":true})),
        ),
        ("GET", format!("{ui}/tokens"), None),
        ("POST", format!("{ui}/tokens"), Some(json!({"name":"x"}))),
    ] {
        let (status, _) = call(&app, method, &path, &admin, body).await;
        assert_eq!(status, StatusCode::FORBIDDEN, "{method} {path}");
    }

    // Assertions that don't check out.
    let mut wrong_audience = claims("ada", &[], "paramtune:read");
    wrong_audience["aud"] = json!("https://other.example");
    let mut other_provider = claims("ada", &[], "paramtune:read");
    other_provider["user"]["iss"] = json!("https://other-id.example");
    for (token, expected) in [
        (
            sign(&wrong_audience, "farmhand-assertion+jwt"),
            StatusCode::UNAUTHORIZED,
        ),
        (
            sign(&claims("ada", &[], "paramtune:read"), "JWT"),
            StatusCode::UNAUTHORIZED,
        ),
        (
            sign(&other_provider, "farmhand-assertion+jwt"),
            StatusCode::FORBIDDEN,
        ),
        (assertion("ada", &[], "valtr:read"), StatusCode::FORBIDDEN),
    ] {
        let (status, body) = call(&app, "GET", &format!("{ui}/overview"), &token, None).await;
        assert_eq!(status, expected, "{body}");
    }

    // Clean up as a person would: a signed-in administrator through the dev login is off in
    // production, so remove the keys directly.
    let client = redis::Client::open(redis.as_str()).unwrap();
    let mut connection = client.get_multiplexed_async_connection().await.unwrap();
    let keys: Vec<String> = redis::cmd("KEYS")
        .arg(format!("*{platform}*"))
        .query_async(&mut connection)
        .await
        .unwrap();
    if !keys.is_empty() {
        let _: () = redis::cmd("DEL")
            .arg(keys)
            .query_async(&mut connection)
            .await
            .unwrap();
    }
}
