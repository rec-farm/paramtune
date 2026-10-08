//! Read-only API tokens for services and CI jobs that consume resolved configuration.
//! Only a SHA-256 of each token is stored; the plaintext is shown once, at creation.
use crate::{
    AppState,
    auth::{hash, random},
    error::{ApiError, Result},
};
use axum::http::{HeaderMap, StatusCode};
use redis::aio::ConnectionManager;
use serde_json::{Value, json};

const PREFIX: &str = "ptk_";
const INDEX: &str = "auth:tokens";
const LIMIT: usize = 100;

fn record_key(digest: &str) -> String {
    format!("auth:token:{digest}")
}
fn used_key(id: &str) -> String {
    format!("auth:token-used:{id}")
}
async fn connection(state: &AppState) -> Result<ConnectionManager> {
    state
        .0
        .store
        .connection()
        .await
        .map_err(|_| ApiError::unavailable())
}
fn unauthorized() -> ApiError {
    ApiError(StatusCode::UNAUTHORIZED, "Invalid API token".into())
}
/// The bearer token from `Authorization`, if the request carries one.
pub fn bearer(headers: &HeaderMap) -> Option<&str> {
    headers
        .get("authorization")?
        .to_str()
        .ok()?
        .strip_prefix("Bearer ")
        .map(str::trim)
}
fn well_formed(token: &str) -> bool {
    token.strip_prefix(PREFIX).is_some_and(|rest| {
        rest.len() == 43
            && rest
                .bytes()
                .all(|v| v.is_ascii_alphanumeric() || v == b'-' || v == b'_')
    })
}
/// Platforms a token may read; `None` means every platform.
pub struct Grant(Option<Vec<String>>);
impl Grant {
    pub fn allows(&self, platform: &str) -> bool {
        self.0
            .as_ref()
            .is_none_or(|platforms| platforms.iter().any(|p| p == platform))
    }
}
pub async fn authenticate(state: &AppState, token: &str) -> Result<Grant> {
    if !well_formed(token) {
        return Err(unauthorized());
    }
    let mut connection = connection(state).await?;
    let row: Option<String> = redis::cmd("GET")
        .arg(record_key(&hash(token)))
        .query_async(&mut connection)
        .await
        .map_err(|_| ApiError::unavailable())?;
    let record: Value = row
        .and_then(|row| serde_json::from_str(&row).ok())
        .ok_or_else(unauthorized)?;
    if let Some(id) = record["id"].as_str() {
        // Best effort: a failed usage stamp must not reject a valid token.
        let _: std::result::Result<(), _> = redis::cmd("SET")
            .arg(used_key(id))
            .arg(chrono::Utc::now().timestamp_millis())
            .query_async(&mut connection)
            .await;
    }
    Ok(Grant(record["platforms"].as_array().map(|platforms| {
        platforms
            .iter()
            .filter_map(|p| p.as_str().map(str::to_owned))
            .collect()
    })))
}
pub async fn list(state: &AppState) -> Result<Vec<Value>> {
    let mut connection = connection(state).await?;
    let index: Vec<(String, String)> = redis::cmd("HGETALL")
        .arg(INDEX)
        .query_async(&mut connection)
        .await?;
    if index.is_empty() {
        return Ok(Vec::new());
    }
    let mut pipe = redis::pipe();
    for (id, digest) in &index {
        pipe.cmd("GET").arg(record_key(digest));
        pipe.cmd("GET").arg(used_key(id));
    }
    let rows: Vec<Option<String>> = pipe.query_async(&mut connection).await?;
    let mut tokens: Vec<Value> = rows
        .chunks(2)
        .filter_map(|pair| {
            let mut record: Value = serde_json::from_str(pair[0].as_deref()?).ok()?;
            if let Some(used) = pair[1].as_deref().and_then(|v| v.parse::<i64>().ok()) {
                record["lastUsedAt"] = Value::from(used);
            }
            Some(record)
        })
        .collect();
    tokens.sort_by_key(|t| std::cmp::Reverse(t["createdAt"].as_i64().unwrap_or_default()));
    Ok(tokens)
}
/// Creates a token from `{ name, platforms? }` and returns its record plus the one-time plaintext.
pub async fn create(state: &AppState, session: &Value, data: &Value) -> Result<Value> {
    let name = data["name"]
        .as_str()
        .map(str::trim)
        .filter(|n| !n.is_empty() && n.chars().count() <= 64)
        .ok_or_else(|| ApiError::bad("Token name must be 1-64 characters"))?;
    let platforms = match &data["platforms"] {
        Value::Null => Value::Null,
        Value::Array(values) if !values.is_empty() => {
            let mut platforms = Vec::new();
            for value in values {
                let platform = super::routes::platform_name(value)?;
                if !platforms.contains(&platform) {
                    platforms.push(platform);
                }
            }
            Value::from(platforms)
        }
        _ => {
            return Err(ApiError::bad(
                "Token platforms must be a non-empty array of platform names, or omitted for all",
            ));
        }
    };
    let mut connection = connection(state).await?;
    let count: usize = redis::cmd("HLEN")
        .arg(INDEX)
        .query_async(&mut connection)
        .await?;
    if count >= LIMIT {
        return Err(ApiError::bad(format!(
            "Revoke an existing token first; at most {LIMIT} tokens are allowed"
        )));
    }
    let token = format!("{PREFIX}{}", random());
    let digest = hash(&token);
    let id = digest[..16].to_owned();
    let user = &session["user"];
    let record = json!({
        "id": id,
        "name": name,
        "platforms": platforms,
        "hint": &token[token.len() - 4..],
        "createdAt": chrono::Utc::now().timestamp_millis(),
        "createdBy": {"id": user["id"], "name": user["name"]},
    });
    let _: () = redis::pipe()
        .atomic()
        .cmd("SET")
        .arg(record_key(&digest))
        .arg(record.to_string())
        .ignore()
        .cmd("HSET")
        .arg(INDEX)
        .arg(&id)
        .arg(&digest)
        .ignore()
        .query_async(&mut connection)
        .await?;
    audit(state, session, "create", &id, name).await;
    Ok(json!({"token": token, "record": record}))
}
pub async fn revoke(state: &AppState, session: &Value, id: &str) -> Result<()> {
    let mut connection = connection(state).await?;
    let digest: Option<String> = redis::cmd("HGET")
        .arg(INDEX)
        .arg(id)
        .query_async(&mut connection)
        .await?;
    let digest = digest.ok_or_else(|| ApiError::missing("Token not found"))?;
    let name: Option<String> = redis::cmd("GET")
        .arg(record_key(&digest))
        .query_async(&mut connection)
        .await?;
    let _: () = redis::pipe()
        .atomic()
        .cmd("DEL")
        .arg(record_key(&digest))
        .arg(used_key(id))
        .ignore()
        .cmd("HDEL")
        .arg(INDEX)
        .arg(id)
        .ignore()
        .query_async(&mut connection)
        .await?;
    let name = name
        .and_then(|row| serde_json::from_str::<Value>(&row).ok())
        .and_then(|row| row["name"].as_str().map(str::to_owned))
        .unwrap_or_default();
    audit(state, session, "revoke", id, &name).await;
    Ok(())
}
async fn audit(state: &AppState, session: &Value, action: &str, id: &str, name: &str) {
    state
        .0
        .store
        .audit(json!({"action":action,"token":{"id":id,"name":name},"userId":session["user"]["id"],"userEmail":session["user"]["email"]}))
        .await;
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn only_prefixed_random_tokens_are_well_formed() {
        assert!(well_formed(&format!("{PREFIX}{}", random())));
        assert!(!well_formed(&random()));
        assert!(!well_formed(&format!("{PREFIX}{}", "a".repeat(42))));
        assert!(!well_formed(&format!("{PREFIX}{}!", "a".repeat(42))));
    }
    #[test]
    fn grants_scope_platforms() {
        assert!(Grant(None).allows("ios"));
        let grant = Grant(Some(vec!["ios".into()]));
        assert!(grant.allows("ios"));
        assert!(!grant.allows("web"));
    }
    #[test]
    fn bearer_reads_authorization() {
        let mut headers = HeaderMap::new();
        assert_eq!(bearer(&headers), None);
        headers.insert("authorization", "Bearer ptk_x".parse().unwrap());
        assert_eq!(bearer(&headers), Some("ptk_x"));
        headers.insert("authorization", "Basic abc".parse().unwrap());
        assert_eq!(bearer(&headers), None);
    }
}
