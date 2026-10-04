use paramtune_api::{AppState, Config, router};
use std::env;
fn setting(name: &str, default: &str) -> String {
    env::var(name)
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| default.into())
}
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(setting("RUST_LOG", "paramtune_api=info"))
        .init();
    let production = setting("NODE_ENV", "production") != "development";
    let origin = env::var("PUBLIC_ORIGIN")
        .or_else(|_| env::var("BETTER_AUTH_URL"))
        .or_else(|_| env::var("BETTER_AUTH_BASE_URL"))
        .or_else(|_| env::var("PORTLESS_URL"))
        .unwrap_or_else(|_| "http://localhost:3000".into());
    let origin = url::Url::parse(&origin)?.origin().ascii_serialization();
    let config = Config {
        public_origin: origin.clone(),
        cors_origin: setting("CORS_ORIGIN", &origin),
        production,
        trust_proxy: setting("TRUST_PROXY", "false") == "true",
        client_dir: setting("CLIENT_DIR", "dist/client"),
    };
    let redis_url = match env::var("REDIS_URL").ok().filter(|v| !v.is_empty()) {
        Some(url) => url,
        None => {
            let mut url = url::Url::parse(&format!(
                "redis://{}:{}/{}",
                setting("REDIS_HOST", "127.0.0.1"),
                setting("REDIS_PORT", "6379"),
                setting("REDIS_DB", "2")
            ))?;
            if let Ok(password) = env::var("REDIS_PASSWORD")
                && !password.is_empty()
            {
                url.set_password(Some(&password))
                    .map_err(|_| "Invalid Redis password")?;
            }
            url.into()
        }
    };
    let state = AppState::new(config, &redis_url)?;
    let listener = tokio::net::TcpListener::bind(format!(
        "{}:{}",
        setting("HOST", "0.0.0.0"),
        setting("PORT", "3000")
    ))
    .await?;
    tracing::info!(address = %listener.local_addr()?, "ParamTune Rust API listening");
    axum::serve(
        listener,
        router(state).into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .with_graceful_shutdown(async {
        #[cfg(unix)]
        {
            let mut terminate =
                tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                    .expect("signal handler");
            tokio::select! { _ = tokio::signal::ctrl_c() => (), _ = terminate.recv() => () }
        }
        #[cfg(not(unix))]
        {
            let _ = tokio::signal::ctrl_c().await;
        }
    })
    .await?;
    Ok(())
}
