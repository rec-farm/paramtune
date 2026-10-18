//! Agents through farmhand, the rec.farm MCP gateway. Off unless `GATEWAY_ISSUER` is set.
//!
//! For each tool call farmhand signs a one-minute assertion (farmhand's docs/ASSERTIONS.md): the
//! person as Handstamp knows them, their groups, the agent acting for them, and the scopes they
//! allowed. Paramtune turns it into the session that person would have after signing in, with the
//! role their groups give, and `auth::permissions` caps it by the scopes.
use crate::{
    AppState,
    auth::{role, setting, subject_key},
    error::{ApiError, Result},
};
use axum::http::{HeaderMap, StatusCode};
use jsonwebtoken::{
    Algorithm, DecodingKey, Validation, decode, decode_header,
    jwk::{Jwk, JwkSet},
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

const TYPE: &str = "farmhand-assertion+jwt";
const KEYS_MAX_AGE: Duration = Duration::from_secs(3600);
/// An unknown key ID refreshes the key set at most this often, so made-up IDs cannot make
/// Paramtune hammer farmhand.
const KEYS_MIN_REFRESH: Duration = Duration::from_secs(60);

/// farmhand's signing keys, from `<issuer>/.well-known/jwks.json`, cached.
#[derive(Default)]
pub struct Keys(Mutex<Option<(Instant, JwkSet)>>);
impl Keys {
    async fn find(&self, state: &AppState, issuer: &str, kid: &str) -> Result<Jwk> {
        let mut cache = self.0.lock().await;
        if let Some((fetched, keys)) = cache.as_ref() {
            if fetched.elapsed() < KEYS_MAX_AGE
                && let Some(key) = keys.find(kid)
            {
                return Ok(key.clone());
            }
            if fetched.elapsed() < KEYS_MIN_REFRESH {
                return Err(invalid());
            }
        }
        let keys: JwkSet = async {
            state
                .0
                .client
                .get(format!("{issuer}/.well-known/jwks.json"))
                .send()
                .await
                .ok()?
                .error_for_status()
                .ok()?
                .json()
                .await
                .ok()
        }
        .await
        .ok_or_else(|| {
            tracing::warn!("farmhand's signing keys could not be fetched");
            ApiError::unavailable()
        })?;
        let key = keys.find(kid).cloned();
        *cache = Some((Instant::now(), keys));
        key.ok_or_else(invalid)
    }
}

fn invalid() -> ApiError {
    ApiError(StatusCode::UNAUTHORIZED, "Invalid agent assertion".into())
}

fn issuer() -> Option<String> {
    Some(
        setting("GATEWAY_ISSUER", "")
            .trim_end_matches('/')
            .to_owned(),
    )
    .filter(|v| !v.is_empty())
}

/// A bearer token shaped like an assertion, when the gateway is on. API tokens (`ptk_…`) never
/// are.
pub fn is_assertion(token: &str) -> bool {
    issuer().is_some() && !token.starts_with("ptk_") && token.split('.').count() == 3
}

pub fn bearer(headers: &HeaderMap) -> Option<&str> {
    crate::tokens::bearer(headers).filter(|token| is_assertion(token))
}

#[derive(Deserialize)]
struct Claims {
    exp: i64,
    user: Person,
    scope: String,
    act: Actor,
}
#[derive(Deserialize)]
struct Person {
    iss: String,
    sub: String,
    email: Option<String>,
    name: Option<String>,
    #[serde(default)]
    groups: Vec<String>,
}
#[derive(Deserialize)]
struct Actor {
    name: String,
}

/// The session a verified assertion stands for.
pub async fn session(state: &AppState, token: &str) -> Result<Value> {
    let issuer = issuer().ok_or_else(invalid)?;
    let sign_in = setting("OIDC_ISSUER", "");
    if sign_in.is_empty() {
        return Err(invalid());
    }
    let header = decode_header(token).map_err(|_| invalid())?;
    if header.alg != Algorithm::EdDSA || header.typ.as_deref() != Some(TYPE) {
        return Err(invalid());
    }
    let kid = header.kid.ok_or_else(invalid)?;
    let key = state.0.gateway_keys.find(state, &issuer, &kid).await?;
    let key = DecodingKey::from_jwk(&key).map_err(|_| invalid())?;
    let mut validation = Validation::new(Algorithm::EdDSA);
    validation.set_issuer(&[&issuer]);
    validation.set_audience(&[&state.0.config.public_origin]);
    validation.set_required_spec_claims(&["iss", "aud", "exp"]);
    validation.leeway = 5;
    let claims = decode::<Claims>(token, &key, &validation)
        .map_err(|_| invalid())?
        .claims;
    from_claims(claims, &sign_in)
}

fn from_claims(claims: Claims, sign_in: &str) -> Result<Value> {
    if claims.user.iss.trim_end_matches('/') != sign_in.trim_end_matches('/') {
        return Err(ApiError(
            StatusCode::FORBIDDEN,
            "This agent acts for someone from another sign-in provider".into(),
        ));
    }
    let scopes: Vec<&str> = claims.scope.split_whitespace().collect();
    let write = scopes.contains(&"paramtune:write");
    if !write && !scopes.contains(&"paramtune:read") {
        return Err(ApiError(
            StatusCode::FORBIDDEN,
            "This agent has no access to Paramtune".into(),
        ));
    }
    let agent = claims.act.name.trim();
    if agent.is_empty() || agent.chars().count() > 100 || agent.chars().any(char::is_control) {
        return Err(invalid());
    }
    let groups = claims.user.groups;
    let expires = chrono::DateTime::from_timestamp(claims.exp, 0).ok_or_else(invalid)?;
    Ok(json!({
        "user": {
            "id": subject_key(sign_in, &claims.user.sub),
            "name": claims.user.name.unwrap_or_default(),
            "email": claims.user.email.unwrap_or_default(),
            "image": null,
            "role": role(&json!(groups)),
            "groups": groups,
        },
        "session": {"id": "agent", "expiresAt": expires.to_rfc3339()},
        "agent": {"name": agent, "write": write},
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::auth::permissions;
    fn claims(iss: &str, scope: &str, agent: &str) -> Claims {
        Claims {
            exp: 4102444800,
            user: Person {
                iss: iss.into(),
                sub: "ada".into(),
                email: Some("ada@example.com".into()),
                name: None,
                groups: vec![],
            },
            scope: scope.into(),
            act: Actor { name: agent.into() },
        }
    }
    #[test]
    fn scopes_cap_the_persons_role_and_management_stays_with_people() {
        let issuer = "https://id.example";
        // No group settings: every member may edit and manage, but an agent never manages.
        let session = from_claims(
            claims(issuer, "paramtune:read paramtune:write", "A"),
            issuer,
        );
        let session = session.unwrap();
        assert_eq!(session["user"]["id"], subject_key(issuer, "ada"));
        assert_eq!(session["agent"]["name"], "A");
        let p = permissions(&session);
        assert!(p.write && !p.manage);
        let read = from_claims(claims(issuer, "paramtune:read", "A"), issuer).unwrap();
        assert!(!permissions(&read).write);
        let other = from_claims(
            claims("https://evil.example", "paramtune:read", "A"),
            issuer,
        );
        assert_eq!(other.unwrap_err().0, StatusCode::FORBIDDEN);
        let none = from_claims(claims(issuer, "valtr:read", "A"), issuer);
        assert_eq!(none.unwrap_err().0, StatusCode::FORBIDDEN);
        let unnamed = from_claims(claims(issuer, "paramtune:read", " "), issuer);
        assert_eq!(unnamed.unwrap_err().0, StatusCode::UNAUTHORIZED);
    }
}
