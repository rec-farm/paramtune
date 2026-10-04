//! Handstamp OIDC relying party and opaque, revocable Redis sessions.
use crate::{
    AppState,
    error::{ApiError, Result},
};
use axum::{
    Json,
    extract::{Request, State},
    http::{HeaderMap, Method, StatusCode},
    response::{IntoResponse, Redirect, Response},
};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use openidconnect::{
    AccessTokenHash, AuthorizationCode, ClientId, ClientSecret, CsrfToken, IssuerUrl, Nonce,
    OAuth2TokenResponse, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, Scope, TokenResponse,
    core::{CoreAuthenticationFlow, CoreClient, CoreProviderMetadata},
};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use std::env;
const SESSION_TTL: u64 = 604800;
const FLOW_TTL: u64 = 600;
fn setting(key: &str, default: &str) -> String {
    env::var(key)
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| default.into())
}
fn random() -> String {
    URL_SAFE_NO_PAD.encode(rand::random::<[u8; 32]>())
}
fn hash(value: &str) -> String {
    format!("{:x}", Sha256::digest(value.as_bytes()))
}
fn unauthorized() -> ApiError {
    ApiError(StatusCode::UNAUTHORIZED, "Unauthorized".into())
}
fn cookie_name(state: &AppState, flow: bool) -> &'static str {
    match (state.0.config.public_origin.starts_with("https://"), flow) {
        (true, false) => "__Host-paramtune-session",
        (true, true) => "__Host-paramtune-flow",
        (false, false) => "paramtune-session",
        (false, true) => "paramtune-flow",
    }
}
fn cookie(headers: &HeaderMap, name: &str) -> Option<String> {
    let values: Vec<_> = headers
        .get_all("cookie")
        .iter()
        .filter_map(|v| v.to_str().ok())
        .flat_map(|v| v.split(';'))
        .filter_map(|v| v.trim().split_once('='))
        .filter(|(key, _)| *key == name)
        .map(|(_, value)| value.to_owned())
        .collect();
    (values.len() == 1).then(|| values[0].clone())
}
fn set_cookie(state: &AppState, response: &mut Response, flow: bool, value: &str, ttl: u64) {
    let secure = if state.0.config.public_origin.starts_with("https://") {
        "; Secure"
    } else {
        ""
    };
    response.headers_mut().append(
        "set-cookie",
        format!(
            "{}={value}; Path=/; HttpOnly; SameSite=Lax; Max-Age={ttl}{secure}",
            cookie_name(state, flow)
        )
        .parse()
        .expect("ASCII cookie"),
    );
}
fn valid_token(value: &str) -> bool {
    value.len() == 43
        && value
            .bytes()
            .all(|v| v.is_ascii_alphanumeric() || v == b'-' || v == b'_')
}
fn safe_return(value: Option<&str>) -> &str {
    value
        .filter(|v| {
            v.starts_with('/')
                && !v.starts_with("//")
                && !v.contains(['\\', '\r', '\n'])
                && !v.starts_with("/api/")
        })
        .unwrap_or("/dashboard")
}
fn subject_key(issuer: &str, sub: &str) -> String {
    hash(&format!("{issuer}\n{sub}"))
}
async fn read(state: &AppState, key: &str) -> Result<Option<Value>> {
    let row: Option<String> = redis::cmd("GET")
        .arg(key)
        .query_async(
            &mut state
                .0
                .store
                .connection()
                .await
                .map_err(|_| ApiError::unavailable())?,
        )
        .await
        .map_err(|_| ApiError::unavailable())?;
    row.map(|v| serde_json::from_str(&v).map_err(|_| ApiError::unavailable()))
        .transpose()
}
async fn write(state: &AppState, key: &str, value: &Value, ttl: u64) -> Result<()> {
    let _: () = redis::cmd("SETEX")
        .arg(key)
        .arg(ttl)
        .arg(value.to_string())
        .query_async(
            &mut state
                .0
                .store
                .connection()
                .await
                .map_err(|_| ApiError::unavailable())?,
        )
        .await?;
    Ok(())
}
pub async fn session(state: &AppState, headers: &HeaderMap) -> Result<Value> {
    let token = cookie(headers, cookie_name(state, false))
        .filter(|v| valid_token(v))
        .ok_or_else(unauthorized)?;
    let row = read(state, &format!("auth:session:{}", hash(&token)))
        .await?
        .ok_or_else(unauthorized)?;
    let generation = read(
        state,
        &format!(
            "auth:generation:{}",
            row["subject"].as_str().ok_or_else(ApiError::unavailable)?
        ),
    )
    .await?
    .unwrap_or(json!(0));
    if generation != row["generation"] {
        return Err(unauthorized());
    }
    if !row["public"]["user"]["id"].is_string() || !row["public"]["session"].is_object() {
        return Err(ApiError::unavailable());
    }
    Ok(row["public"].clone())
}
async fn issue(
    state: &AppState,
    user: Value,
    subject: &str,
    id_token: &str,
    logout: Option<&str>,
) -> Result<Response> {
    let generation = read(state, &format!("auth:generation:{subject}"))
        .await?
        .unwrap_or(json!(0));
    let token = random();
    let now = chrono::Utc::now();
    let public = json!({"user":user,"session":{"id":hash(&token),"expiresAt":(now+chrono::Duration::seconds(SESSION_TTL as i64)).to_rfc3339()}});
    write(state,&format!("auth:session:{}",hash(&token)),&json!({"subject":subject,"generation":generation,"public":public,"id_token":id_token,"logout":logout}),SESSION_TTL).await?;
    let mut response = Json(json!({"ok":true})).into_response();
    set_cookie(state, &mut response, false, &token, SESSION_TTL);
    Ok(response)
}
async fn discovery(state: &AppState) -> Result<(CoreProviderMetadata, Value)> {
    let issuer = setting("OIDC_ISSUER", "");
    if issuer.is_empty() || setting("OIDC_CLIENT_ID", "").is_empty() {
        return Err(ApiError::missing("Handstamp is not configured"));
    }
    let url = url::Url::parse(&issuer).map_err(|_| ApiError::unavailable())?;
    if url.scheme() != "https" && state.0.config.production {
        return Err(ApiError::unavailable());
    }
    let metadata = CoreProviderMetadata::discover_async(
        IssuerUrl::new(issuer).map_err(|_| ApiError::unavailable())?,
        &state.0.client,
    )
    .await
    .map_err(|error| {
        tracing::error!(%error,"OIDC discovery failed");
        ApiError::unavailable()
    })?;
    let raw = state
        .0
        .client
        .get(format!(
            "{}/.well-known/openid-configuration",
            url.as_str().trim_end_matches('/')
        ))
        .send()
        .await
        .map_err(|_| ApiError::unavailable())?
        .error_for_status()
        .map_err(|_| ApiError::unavailable())?
        .json::<Value>()
        .await
        .map_err(|_| ApiError::unavailable())?;
    if state.0.config.production {
        for name in [
            "authorization_endpoint",
            "token_endpoint",
            "jwks_uri",
            "userinfo_endpoint",
            "end_session_endpoint",
        ] {
            if let Some(value) = raw[name].as_str()
                && url::Url::parse(value)
                    .map_err(|_| ApiError::unavailable())?
                    .scheme()
                    != "https"
            {
                return Err(ApiError::unavailable());
            }
        }
    }
    Ok((metadata, raw))
}
macro_rules! client {
    ($state:expr,$metadata:expr) => {
        CoreClient::from_provider_metadata(
            $metadata,
            ClientId::new(setting("OIDC_CLIENT_ID", "")),
            Some(ClientSecret::new(setting("OIDC_CLIENT_SECRET", ""))),
        )
        .set_redirect_uri(
            RedirectUrl::new(format!(
                "{}/api/auth/oauth2/callback/oidc",
                $state.0.config.public_origin
            ))
            .map_err(|_| ApiError::unavailable())?,
        )
    };
}
async fn start(state: &AppState, body: Value) -> Result<Response> {
    if body["provider"] != "oidc" {
        return Err(ApiError::bad("Only Handstamp sign-in is supported"));
    }
    let (metadata, _) = discovery(state).await?;
    let client = client!(state, metadata);
    let (challenge, verifier) = PkceCodeChallenge::new_random_sha256();
    let mut authorization = client
        .authorize_url(
            CoreAuthenticationFlow::AuthorizationCode,
            CsrfToken::new_random,
            Nonce::new_random,
        )
        .set_pkce_challenge(challenge);
    for scope in setting("OIDC_SCOPES", "openid profile email groups")
        .split_whitespace()
        .filter(|v| *v != "openid")
    {
        authorization = authorization.add_scope(Scope::new(scope.into()));
    }
    let (url, csrf, nonce) = authorization.url();
    let binding = random();
    write(state,&format!("auth:flow:{}",hash(csrf.secret())),&json!({"binding":hash(&binding),"nonce":nonce.secret(),"verifier":verifier.secret(),"returnTo":safe_return(body["callbackURL"].as_str())}),FLOW_TTL).await?;
    let mut response = Json(json!({"url":url.as_str(),"redirect":true})).into_response();
    set_cookie(state, &mut response, true, &binding, FLOW_TTL);
    Ok(response)
}
async fn callback(state: &AppState, request: Request) -> Result<Response> {
    let query: std::collections::HashMap<String, String> =
        url::form_urlencoded::parse(request.uri().query().unwrap_or("").as_bytes())
            .into_owned()
            .collect();
    let csrf = query
        .get("state")
        .ok_or_else(|| ApiError::bad("Missing login state"))?;
    let key = format!("auth:flow:{}", hash(csrf));
    let binding = cookie(request.headers(), cookie_name(state, true))
        .filter(|v| valid_token(v))
        .ok_or_else(|| ApiError::bad("Invalid login state"))?;
    // Check browser binding before consuming the single-use transaction.
    let flow = read(state, &key)
        .await?
        .ok_or_else(|| ApiError::bad("Expired login state"))?;
    if flow["binding"] != hash(&binding) {
        return Err(ApiError::bad("Invalid login state"));
    }
    let consumed: Option<String> = redis::cmd("GETDEL")
        .arg(&key)
        .query_async(
            &mut state
                .0
                .store
                .connection()
                .await
                .map_err(|_| ApiError::unavailable())?,
        )
        .await?;
    if consumed.is_none() {
        return Err(ApiError::bad("Login state already used"));
    }
    if query.contains_key("error") {
        return Ok(Redirect::to("/login?error=access_denied").into_response());
    }
    let (metadata, raw) = discovery(state).await?;
    let client = client!(state, metadata);
    let tokens = client
        .exchange_code(AuthorizationCode::new(
            query
                .get("code")
                .ok_or_else(|| ApiError::bad("Missing authorization code"))?
                .clone(),
        ))
        .map_err(|_| ApiError::unavailable())?
        .set_pkce_verifier(PkceCodeVerifier::new(
            flow["verifier"]
                .as_str()
                .ok_or_else(ApiError::unavailable)?
                .into(),
        ))
        .request_async(&state.0.client)
        .await
        .map_err(|_| unauthorized())?;
    let id_token = tokens.id_token().ok_or_else(unauthorized)?;
    let verifier = client.id_token_verifier();
    let claims = id_token
        .claims(
            &verifier,
            &Nonce::new(
                flow["nonce"]
                    .as_str()
                    .ok_or_else(ApiError::unavailable)?
                    .into(),
            ),
        )
        .map_err(|_| unauthorized())?;
    if let Some(expected) = claims.access_token_hash() {
        let actual = AccessTokenHash::from_token(
            tokens.access_token(),
            id_token.signing_alg().map_err(|_| unauthorized())?,
            id_token
                .signing_key(&verifier)
                .map_err(|_| unauthorized())?,
        )
        .map_err(|_| unauthorized())?;
        if actual != *expected {
            return Err(unauthorized());
        }
    }
    let sub = claims.subject().as_str();
    // Userinfo provides Handstamp's custom group claims. Its subject must match the verified ID token.
    let profile: Value = state
        .0
        .client
        .get(
            raw["userinfo_endpoint"]
                .as_str()
                .ok_or_else(ApiError::unavailable)?,
        )
        .bearer_auth(tokens.access_token().secret())
        .send()
        .await
        .map_err(|_| ApiError::unavailable())?
        .error_for_status()
        .map_err(|_| unauthorized())?
        .json()
        .await
        .map_err(|_| unauthorized())?;
    if profile["sub"] != sub {
        return Err(unauthorized());
    }
    let group = setting("OIDC_ADMIN_GROUP", "");
    let roles = &profile[setting("OIDC_ROLES_CLAIM", "groups")];
    let admin = !group.is_empty()
        && (roles
            .as_array()
            .is_some_and(|v| v.iter().any(|v| v == &group))
            || roles
                .as_str()
                .is_some_and(|v| v.split_whitespace().any(|v| v == group)));
    let subject = subject_key(&setting("OIDC_ISSUER", ""), sub);
    let user = json!({"id":subject,"name":profile["name"].as_str().or(profile["preferred_username"].as_str()).unwrap_or(""),"email":profile["email"].as_str().unwrap_or(""),"image":profile["picture"],"role":if admin {"admin"} else {"member"}});
    let mut response = issue(
        state,
        user,
        &subject,
        &id_token.to_string(),
        raw["end_session_endpoint"].as_str(),
    )
    .await?;
    *response.status_mut() = StatusCode::SEE_OTHER;
    response.headers_mut().insert(
        "location",
        safe_return(flow["returnTo"].as_str())
            .parse()
            .map_err(|_| ApiError::bad("Invalid return URL"))?,
    );
    set_cookie(state, &mut response, true, "", 0);
    Ok(response)
}
async fn sign_out(state: &AppState, headers: &HeaderMap) -> Result<Response> {
    let mut logout_url = None;
    if let Some(token) = cookie(headers, cookie_name(state, false)).filter(|v| valid_token(v)) {
        let key = format!("auth:session:{}", hash(&token));
        if let Some(row) = read(state, &key).await? {
            if let Some(endpoint) = row["logout"].as_str() {
                let mut url = url::Url::parse(endpoint).map_err(|_| ApiError::unavailable())?;
                url.query_pairs_mut()
                    .append_pair("id_token_hint", row["id_token"].as_str().unwrap_or(""))
                    .append_pair("client_id", &setting("OIDC_CLIENT_ID", ""))
                    .append_pair(
                        "post_logout_redirect_uri",
                        &format!("{}/", state.0.config.public_origin),
                    );
                logout_url = Some(url.to_string());
            }
            let _: u64 = redis::cmd("DEL")
                .arg(key)
                .query_async(
                    &mut state
                        .0
                        .store
                        .connection()
                        .await
                        .map_err(|_| ApiError::unavailable())?,
                )
                .await?;
        }
    }
    let mut response =
        Json(json!({"url":logout_url.unwrap_or_else(|| "/login".into())})).into_response();
    set_cookie(state, &mut response, false, "", 0);
    Ok(response)
}
async fn backchannel(state: &AppState, request: Request) -> Result<Response> {
    use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode, decode_header, jwk::JwkSet};
    let bytes = axum::body::to_bytes(request.into_body(), 16384)
        .await
        .map_err(|_| ApiError::bad("Invalid logout body"))?;
    let form: std::collections::HashMap<_, _> =
        url::form_urlencoded::parse(&bytes).into_owned().collect();
    let token = form
        .get("logout_token")
        .ok_or_else(|| ApiError::bad("Missing logout token"))?;
    let (metadata, _) = discovery(state).await?;
    let header = decode_header(token).map_err(|_| unauthorized())?;
    if !matches!(
        header.alg,
        Algorithm::RS256 | Algorithm::ES256 | Algorithm::EdDSA
    ) {
        return Err(unauthorized());
    }
    let keys: JwkSet = state
        .0
        .client
        .get(metadata.jwks_uri().as_str())
        .send()
        .await
        .map_err(|_| ApiError::unavailable())?
        .error_for_status()
        .map_err(|_| ApiError::unavailable())?
        .json()
        .await
        .map_err(|_| ApiError::unavailable())?;
    let key = keys
        .find(header.kid.as_deref().ok_or_else(unauthorized)?)
        .ok_or_else(unauthorized)?;
    let mut validation = Validation::new(header.alg);
    validation.set_issuer(&[setting("OIDC_ISSUER", "")]);
    validation.set_audience(&[setting("OIDC_CLIENT_ID", "")]);
    validation.set_required_spec_claims(&["iss", "aud", "iat", "jti"]);
    let claims = decode::<Value>(
        token,
        &DecodingKey::from_jwk(key).map_err(|_| unauthorized())?,
        &validation,
    )
    .map_err(|_| unauthorized())?
    .claims;
    let now = chrono::Utc::now().timestamp();
    let issued = claims["iat"].as_i64().ok_or_else(unauthorized)?;
    let subject = claims["sub"]
        .as_str()
        .filter(|v| !v.is_empty())
        .ok_or_else(unauthorized)?;
    let jti = claims["jti"]
        .as_str()
        .filter(|v| !v.is_empty())
        .ok_or_else(unauthorized)?;
    if issued < now - 300
        || issued > now + 30
        || claims.get("nonce").is_some()
        || !claims["events"]["http://schemas.openid.net/event/backchannel-logout"].is_object()
    {
        return Err(unauthorized());
    }
    // Atomic replay detection and subject-wide revocation, shared by every replica.
    let _: i64 = redis::Script::new("if redis.call('SET',KEYS[1],'1','EX',600,'NX') then return redis.call('INCR',KEYS[2]) else return 0 end")
        .key(format!("auth:logout:{}",hash(jti))).key(format!("auth:generation:{}",subject_key(&setting("OIDC_ISSUER",""),subject))).invoke_async(&mut state.0.store.connection().await.map_err(|_| ApiError::unavailable())?).await?;
    Ok(StatusCode::OK.into_response())
}
pub async fn handle(State(state): State<AppState>, request: Request) -> Result<Response> {
    let path = request.uri().path();
    match (request.method(),path) {
        (&Method::GET,"/api/auth/providers") => Ok(Json(json!({"oidc":if setting("OIDC_ISSUER","").is_empty() { Value::Null } else { json!({"label":setting("OIDC_DISPLAY_NAME","Handstamp")}) },"google":false,"development":!state.0.config.production})).into_response()),
        (&Method::GET,"/api/auth/get-session") => match session(&state,request.headers()).await { Ok(row) => Ok(Json(row).into_response()), Err(error) if error.0 == StatusCode::UNAUTHORIZED => Ok(Json(Value::Null).into_response()), Err(error) => Err(error) },
        (&Method::POST,"/api/auth/sign-in/social") => {
            let bytes = axum::body::to_bytes(request.into_body(),16384).await.map_err(|_| ApiError::bad("Invalid sign-in body"))?;
            start(&state,serde_json::from_slice(&bytes).map_err(|_| ApiError::bad("Invalid sign-in JSON"))?).await
        },
        (&Method::GET,"/api/auth/oauth2/callback/oidc" | "/api/auth/callback/oidc") => callback(&state,request).await,
        (&Method::POST,"/api/auth/sign-out") => sign_out(&state,request.headers()).await,
        (&Method::POST,"/api/auth/backchannel-logout") => backchannel(&state,request).await,
        (&Method::POST,"/api/auth/dev-login") if !state.0.config.production => issue(&state,json!({"id":"development","name":setting("DEV_USER_NAME","Developer"),"email":setting("DEV_USER_EMAIL","developer@paramtune.local"),"role":"admin","image":null}),"development","",None).await,
        _ => Err(ApiError::missing("Not found")),
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn return_paths_stay_local() {
        for value in [
            "//evil.example",
            "/\\evil.example",
            "https://evil.example",
            "/api/auth/sign-out",
            "/dashboard\r\nLocation: evil",
        ] {
            assert_eq!(safe_return(Some(value)), "/dashboard");
        }
        assert_eq!(
            safe_return(Some("/dashboard/platforms")),
            "/dashboard/platforms"
        );
    }
    #[test]
    fn ambiguous_cookies_are_rejected() {
        let mut headers = HeaderMap::new();
        headers.insert(
            "cookie",
            "paramtune-session=a; paramtune-session=b".parse().unwrap(),
        );
        assert_eq!(cookie(&headers, "paramtune-session"), None);
    }
}
