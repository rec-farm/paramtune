use crate::{
    AppState,
    auth::{require_manage, require_platform_write, require_write},
    diff,
    error::{ApiError, Result},
    schema, tokens,
};
use axum::{
    Json, Router,
    extract::{Request, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::any,
};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};

pub fn dashboard() -> Router<AppState> {
    Router::new().route("/", any(ui)).route("/{*path}", any(ui))
}
pub fn legacy() -> Router<AppState> {
    Router::new().route("/api/{*path}", any(public_api))
}
fn valid_name(value: &str, version: bool) -> bool {
    !value.is_empty()
        && value.len() <= 128
        && value.bytes().all(|b| {
            b.is_ascii_alphanumeric()
                || b == b'.'
                || b == b'-'
                || b == if version { b'+' } else { b'_' }
        })
}
fn name(value: &Value, version: bool) -> Result<String> {
    value
        .as_str()
        .filter(|v| valid_name(v, version))
        .map(str::to_owned)
        .ok_or_else(|| {
            ApiError::bad(format!(
                "Invalid {} name",
                if version { "version" } else { "platform" }
            ))
        })
}
pub(crate) fn platform_name(value: &Value) -> Result<String> {
    name(value, false)
}
fn semver(value: &str) -> bool {
    // node-semver's Rust parser is lenient about leading zeroes. Writes must
    // match npm's strict semver.valid, while retaining its optional v prefix.
    if !valid_name(value, true) {
        return false;
    }
    let value = value.strip_prefix('v').unwrap_or(value);
    let mut build_parts = value.split('+');
    let version = build_parts.next().unwrap_or_default();
    if let Some(build) = build_parts.next()
        && (build_parts.next().is_some() || !identifiers(build, false))
    {
        return false;
    }
    let (core, prerelease) = version
        .split_once('-')
        .map_or((version, None), |(core, pre)| (core, Some(pre)));
    if prerelease.is_some_and(|pre| !identifiers(pre, true)) {
        return false;
    }
    let parts: Vec<_> = core.split('.').collect();
    parts.len() == 3
        && parts.iter().all(|part| {
            !part.is_empty()
                && part.bytes().all(|b| b.is_ascii_digit())
                && !(part.len() > 1 && part.starts_with('0'))
                && part
                    .parse::<u64>()
                    .is_ok_and(|number| number <= 9_007_199_254_740_991)
        })
}
fn identifiers(value: &str, prerelease: bool) -> bool {
    value.split('.').all(|part| {
        !part.is_empty()
            && part.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
            && !(prerelease
                && part.len() > 1
                && part.starts_with('0')
                && part.bytes().all(|b| b.is_ascii_digit()))
    })
}

fn legacy_name(value: &str, version: bool) -> Result<()> {
    let label = if version {
        "version name"
    } else {
        "platform name"
    };
    if value.is_empty() || value.len() > 128 {
        return Err(ApiError::bad(format!(
            "Invalid {label}: must be 1-128 characters"
        )));
    }
    if !valid_name(value, version) {
        return Err(ApiError::bad(if version {
            "Invalid version name: only alphanumeric characters, dots, hyphens, and plus signs are allowed"
        } else {
            "Invalid platform name: only alphanumeric characters, underscores, hyphens, and dots are allowed"
        }));
    }
    Ok(())
}
fn javascript_string(value: &Value) -> String {
    match value {
        Value::String(value) => value.clone(),
        Value::Array(values) => values
            .iter()
            .map(|v| {
                if v.is_null() {
                    String::new()
                } else {
                    javascript_string(v)
                }
            })
            .collect::<Vec<_>>()
            .join(","),
        Value::Object(_) => "[object Object]".into(),
        _ => crate::json::stringify(value),
    }
}
fn segments(path: &str) -> Result<Vec<String>> {
    path.split('/')
        .filter(|v| !v.is_empty())
        .map(|raw| {
            for (index, byte) in raw.bytes().enumerate() {
                if byte == b'%'
                    && !raw
                        .as_bytes()
                        .get(index + 1..index + 3)
                        .is_some_and(|v| v.iter().all(u8::is_ascii_hexdigit))
                {
                    return Err(ApiError::bad("Malformed percent-encoding"));
                }
            }
            percent_encoding::percent_decode_str(raw)
                .decode_utf8()
                .map(|s| s.into_owned())
                .map_err(|_| ApiError::bad("Malformed percent-encoding"))
        })
        .collect()
}
async fn parse_body(request: Request) -> Result<Value> {
    let bytes = axum::body::to_bytes(request.into_body(), 1024 * 1024)
        .await
        .map_err(|_| {
            ApiError(
                StatusCode::PAYLOAD_TOO_LARGE,
                "Request body exceeds 1 MiB".into(),
            )
        })?;
    Ok(serde_json::from_slice::<Value>(&bytes).unwrap_or(Value::Null))
}
async fn body(request: Request, message: &str) -> Result<Value> {
    let value = parse_body(request).await?;
    if value.is_object() {
        Ok(value)
    } else {
        Err(ApiError::bad(message))
    }
}
fn content(data: &Value) -> Result<Value> {
    data.get("content")
        .filter(|v| v.is_object())
        .cloned()
        .ok_or_else(|| ApiError::bad("Schema content must be a JSON object"))
}
fn ok(created: bool) -> Response {
    (
        if created {
            StatusCode::CREATED
        } else {
            StatusCode::OK
        },
        Json(json!({"ok":true})),
    )
        .into_response()
}
fn method() -> ApiError {
    ApiError(StatusCode::METHOD_NOT_ALLOWED, "Method not allowed".into())
}
fn platform_kind(data: &Value) -> Result<Option<&str>> {
    match data.get("kind") {
        None => Ok(None),
        Some(Value::String(kind))
            if matches!(
                kind.as_str(),
                "ios" | "android" | "web" | "service" | "custom"
            ) =>
        {
            Ok(Some(kind))
        }
        Some(_) => Err(ApiError::bad(
            "Invalid platform kind: use ios, android, web, service, or custom",
        )),
    }
}

async fn platform(state: &AppState, platform: &str) -> Result<Value> {
    state
        .0
        .store
        .latest(&format!("platforms:{platform}"))
        .await?
        .ok_or_else(|| ApiError::missing("Platform not found"))
}
async fn exists(state: &AppState, p: &str, v: &str) -> Result<()> {
    if !state
        .0
        .store
        .latest(&format!("platforms:{p}"))
        .await?
        .is_some_and(|data| {
            data["versions"]
                .as_array()
                .is_some_and(|versions| versions.iter().any(|version| version == v))
        })
    {
        return Err(ApiError::missing("Version not found"));
    }
    Ok(())
}
/// Refuses to delete versions that other platforms' schemas still extend.
async fn in_use(state: &AppState, p: &str, versions: &[String]) -> Result<()> {
    let dependents = schema::blocking_dependents(&state.0.store, p, versions).await?;
    if dependents.is_empty() {
        return Ok(());
    }
    Err(ApiError(
        StatusCode::CONFLICT,
        format!(
            "Still extended by {}. Remove those @extends references first.",
            dependents.join(", ")
        ),
    ))
}
async fn audit(state: &AppState, session: &Value, action: &str, p: &str, v: Option<&str>) {
    let mut entry = json!({"action":action,"platform":p,"userId":session["user"]["id"],"userEmail":session["user"]["email"]});
    if let Some(v) = v {
        entry["version"] = Value::from(v);
    }
    state.0.store.audit(entry).await;
}
async fn add_version(
    state: &AppState,
    p: &str,
    v: &str,
    session: &Value,
    dashboard: bool,
) -> Result<Response> {
    if !semver(v) {
        return Err(ApiError::bad(format!(
            "Invalid version \"{v}\": must be a valid semantic version (e.g. 1.2.3)"
        )));
    }
    let mut data = match platform(state, p).await {
        Err(error) if dashboard && error.0 == StatusCode::NOT_FOUND => {
            return Err(ApiError::bad(format!("Platform \"{p}\" not found")));
        }
        other => other?,
    };
    let versions = data["versions"]
        .as_array_mut()
        .ok_or_else(|| ApiError::bad("Invalid stored platform versions"))?;
    if !versions.iter().any(|version| version == v) {
        versions.push(Value::from(v));
    }
    state
        .0
        .store
        .append(&format!("platforms:{p}"), &data)
        .await?;
    audit(state, session, "create", p, Some(v)).await;
    Ok(ok(true))
}
async fn ui(State(state): State<AppState>, request: Request) -> Result<Response> {
    let session = state.session(request.headers()).await?;
    let path = segments(request.uri().path())?;
    // Axum nest strips /api/_ui/v1 from the request URI.
    let path: Vec<&str> = path.iter().map(String::as_str).collect();
    let method_name = request.method().as_str().to_owned();
    match path.as_slice() {
        ["tokens", ..] => require_manage(&session)?,
        _ if method_name == "DELETE" => require_manage(&session)?,
        // Validation and comparison are reads that happen to POST a body.
        ["validate"] | ["compare"] => {}
        _ if !matches!(method_name.as_str(), "GET" | "HEAD") => require_write(&session)?,
        _ => {}
    }
    // Writes inside a platform also need that platform's editor group, when it has one.
    if let ["platforms", p, ..] = path.as_slice()
        && !matches!(method_name.as_str(), "GET" | "HEAD")
    {
        require_platform_write(&session, p)?;
    }
    match path.as_slice() {
        ["overview"] if method_name == "GET" || method_name == "HEAD" => {
            let platforms = state.0.store.platforms().await?;
            let pairs: Vec<(&str, &str)> = platforms
                .iter()
                .flat_map(|platform| {
                    let p = platform["name"].as_str().unwrap_or_default();
                    platform["versions"]
                        .as_array()
                        .into_iter()
                        .flatten()
                        .map(move |version| (p, version.as_str().unwrap_or_default()))
                })
                .collect();
            let keys: Vec<String> = pairs.iter().map(|(p, v)| schema::key(p, v)).collect();
            // One pipelined read instead of a round trip per version; a failed read
            // degrades to an overview without statuses rather than an error page.
            let (statuses, failed) = match state.0.store.latest_many(&keys).await {
                Ok(latest) => (
                    pairs
                        .iter()
                        .zip(latest)
                        .map(|((p, v), latest)| {
                            let mut status = json!({"platform":p,"version":v,"hasContent":latest.as_ref().and_then(|s| s["content"].as_object()).is_some_and(|c| !c.is_empty())});
                            if let Some(latest) = latest {
                                status["savedAt"] = latest["timestamp"].clone();
                                if latest["author"]["name"].is_string() {
                                    status["author"] = latest["author"]["name"].clone();
                                }
                            }
                            status
                        })
                        .collect(),
                    0,
                ),
                Err(_) => (Vec::new(), pairs.len()),
            };
            Ok(
                Json(json!({"platforms":platforms,"statuses":statuses,"failed":failed}))
                    .into_response(),
            )
        }
        ["platforms"] if method_name == "POST" => {
            let data = body(request, "Body must be a JSON object").await?;
            let p = name(
                &Value::from(data["name"].as_str().unwrap_or_default().trim()),
                false,
            )?;
            require_platform_write(&session, &p)?;
            if state
                .0
                .store
                .latest(&format!("platforms:{p}"))
                .await?
                .is_some()
            {
                return Err(ApiError(
                    StatusCode::CONFLICT,
                    "Platform already exists".into(),
                ));
            }
            let mut record = json!({"name":p,"versions":[]});
            if let Some(kind) = platform_kind(&data)? {
                record["kind"] = Value::from(kind);
            }
            state
                .0
                .store
                .append(&format!("platforms:{p}"), &record)
                .await?;
            audit(&state, &session, "create", &p, None).await;
            Ok(ok(true))
        }
        ["platforms", p] if method_name == "DELETE" => {
            let p = name(&Value::from(*p), false)?;
            let record = platform(&state, &p).await?;
            let versions: Vec<String> = record["versions"]
                .as_array()
                .into_iter()
                .flatten()
                .filter_map(|v| v.as_str().map(str::to_owned))
                .collect();
            in_use(&state, &p, &versions).await?;
            schema::remove(&state.0.store, &p, &versions).await?;
            state.0.store.delete(&[format!("platforms:{p}")]).await?;
            audit(&state, &session, "delete", &p, None).await;
            Ok(ok(false))
        }
        ["platforms", p, "versions", v] if method_name == "DELETE" => {
            let p = name(&Value::from(*p), false)?;
            let v = name(&Value::from(*v), true)?;
            exists(&state, &p, &v).await?;
            let versions = [v.clone()];
            in_use(&state, &p, &versions).await?;
            let mut record = platform(&state, &p).await?;
            if let Some(list) = record["versions"].as_array_mut() {
                list.retain(|version| version != v.as_str());
            }
            state
                .0
                .store
                .append(&format!("platforms:{p}"), &record)
                .await?;
            schema::remove(&state.0.store, &p, &versions).await?;
            audit(&state, &session, "delete", &p, Some(&v)).await;
            Ok(ok(false))
        }
        ["platforms", p, "versions"] if method_name == "POST" => {
            let p = name(&Value::from(*p), false)?;
            let data = body(request, "Body must be a JSON object").await?;
            let v = name(&data["version"], true)?;
            add_version(&state, &p, &v, &session, true).await
        }
        ["platforms", p, "versions", v, "schema"]
            if matches!(method_name.as_str(), "GET" | "HEAD" | "PUT") =>
        {
            let p = name(&Value::from(*p), false)?;
            let v = name(&Value::from(*v), true)?;
            if method_name == "PUT" {
                let data = body(request, "Body must be a JSON object").await?;
                exists(&state, &p, &v).await?;
                let user = &session["user"];
                let mut author = json!({"id":user["id"],"name":user["name"].as_str().filter(|n| !n.is_empty()).unwrap_or("Unknown")});
                if let Some(image) = user["image"].as_str().filter(|v| !v.is_empty()) {
                    author["image"] = Value::from(image);
                }
                schema::save(&state.0.store, &p, &v, content(&data)?, author).await?;
                audit(&state, &session, "update", &p, Some(&v)).await;
                Ok(ok(false))
            } else {
                exists(&state, &p, &v).await?;
                let schema = state
                    .0
                    .store
                    .latest(&schema::key(&p, &v))
                    .await?
                    .unwrap_or(json!({}));
                let history = state.0.store.history(&schema::key(&p, &v), 50).await?;
                let content = schema.get("content").cloned().unwrap_or(json!({}));
                let hash = format!(
                    "{:x}",
                    Sha256::digest(crate::json::stringify(&content).as_bytes())
                );
                Ok(
                    Json(json!({"schema":schema,"history":history,"contentHash":hash}))
                        .into_response(),
                )
            }
        }
        ["tokens"] if method_name == "GET" || method_name == "HEAD" => {
            Ok(Json(tokens::list(&state).await?).into_response())
        }
        ["tokens"] if method_name == "POST" => {
            let data = body(request, "Body must be a JSON object").await?;
            Ok((
                StatusCode::CREATED,
                Json(tokens::create(&state, &session, &data).await?),
            )
                .into_response())
        }
        ["tokens", id] if method_name == "DELETE" => {
            tokens::revoke(&state, &session, id).await?;
            Ok(ok(false))
        }
        ["validate"] if method_name == "POST" => {
            let data = body(request, "Body must be a JSON object").await?;
            Ok(Json(schema::validate(&state.0.store, &content(&data)?).await?).into_response())
        }
        ["compare"] if method_name == "POST" => {
            let data = body(request, "Body must be a JSON object").await?;
            let pa = name(&data["platformA"], false)?;
            let va = name(&data["versionA"], true)?;
            let pb = name(&data["platformB"], false)?;
            let vb = name(&data["versionB"], true)?;
            let a = state
                .0
                .store
                .latest(&schema::key(&pa, &va))
                .await?
                .and_then(|s| s.get("content").cloned())
                .unwrap_or(json!({}));
            let b = state
                .0
                .store
                .latest(&schema::key(&pb, &vb))
                .await?
                .and_then(|s| s.get("content").cloned())
                .unwrap_or(json!({}));
            Ok(Json(
                json!({"diffResult":diff::compare(&a,&b),"schemaAContent":a,"schemaBContent":b}),
            )
            .into_response())
        }
        ["overview"]
        | ["platforms"]
        | ["platforms", _]
        | ["platforms", _, "versions"]
        | ["platforms", _, "versions", _]
        | ["platforms", _, "versions", _, "schema"]
        | ["tokens"]
        | ["tokens", _]
        | ["validate"]
        | ["compare"] => Err(ApiError::missing("Not found")),
        _ => Err(ApiError::missing("Not found")),
    }
}
async fn public_api(State(state): State<AppState>, request: Request) -> Result<Response> {
    let raw = request.uri().path().trim_start_matches("/api/");
    let raw_count = raw.split('/').count();
    if raw.starts_with("_ui/v1") || raw_count > 2 {
        return Err(ApiError::missing("Not found"));
    }
    let method_name = request.method().as_str().to_owned();
    let is_schemas = raw == "schemas";
    let versions = raw.ends_with("/versions");
    let writable = !is_schemas && (raw_count == 1 || versions);
    if !(matches!(method_name.as_str(), "GET" | "HEAD") || method_name == "POST" && writable) {
        return Err(method());
    }
    // Services read with a bearer API token; people use their session for reads and writes.
    let grant = match tokens::bearer(request.headers()) {
        Some(token) => Some(tokens::authenticate(&state, token).await?),
        None => None,
    };
    if grant.is_some() && method_name == "POST" {
        return Err(ApiError(
            StatusCode::FORBIDDEN,
            "API tokens are read-only".into(),
        ));
    }
    let session = match grant {
        Some(_) => Value::Null,
        None => state.session(request.headers()).await?,
    };
    let path = segments(request.uri().path()).map_err(|_| {
        let platform_raw = raw.split('/').next().unwrap_or_default();
        let label = if segments(platform_raw).is_err() {
            "platform name"
        } else {
            "version name"
        };
        ApiError::bad(format!("Invalid {label}: malformed percent-encoding"))
    })?;
    let p = path.get(1).map(String::as_str).unwrap_or_default();
    if is_schemas {
        let mut platforms = state.0.store.platforms().await?;
        if let Some(grant) = &grant {
            platforms
                .retain(|platform| grant.allows(platform["name"].as_str().unwrap_or_default()));
        }
        return Ok(Json(platforms).into_response());
    }
    legacy_name(p, false)?;
    if method_name == "POST" {
        require_platform_write(&session, p)?;
    }
    if grant.as_ref().is_some_and(|grant| !grant.allows(p)) {
        // Out-of-scope platforms look absent, so a token can't probe for names.
        return Err(ApiError::missing("Platform not found"));
    }
    if method_name == "POST" {
        let data = parse_body(request).await?;
        if !versions && !data.is_object() && !data.is_array() {
            return Err(ApiError::bad("Invalid JSON body"));
        }
        if versions {
            let value = &data["version"];
            if value.is_null() || value == "" || value == false || value == 0 {
                return Err(ApiError::bad("Missing \"version\" in body"));
            }
            let v = value.as_str().filter(|v| semver(v)).ok_or_else(|| {
                ApiError::bad(format!(
                    "Invalid version \"{}\": must be a valid semantic version (e.g. 1.2.3)",
                    javascript_string(value)
                ))
            })?;
            return add_version(&state, p, v, &session, false).await;
        }
        let input = data
            .get("versions")
            .ok_or_else(|| ApiError::bad("Missing \"versions\" in body"))?;
        let versions = input
            .as_array()
            .filter(|vs| vs.iter().all(|v| v.as_str().is_some_and(semver)))
            .ok_or_else(|| {
                ApiError::bad(
                    "Invalid \"versions\": must be an array of valid semantic version strings",
                )
            })?;
        let mut deduped = Vec::new();
        for v in versions {
            if !deduped.contains(v) {
                deduped.push(v.clone());
            }
        }
        let mut record = state
            .0
            .store
            .latest(&format!("platforms:{p}"))
            .await?
            .unwrap_or_else(|| json!({"name":p}));
        // Replacing the list can drop versions, which is a delete: it needs the same
        // permission and dependency check, and must not leave history to resurface.
        let removed: Vec<String> = record["versions"]
            .as_array()
            .into_iter()
            .flatten()
            .filter(|existing| !deduped.contains(existing))
            .filter_map(|existing| existing.as_str().map(str::to_owned))
            .collect();
        if !removed.is_empty() {
            require_manage(&session)?;
            in_use(&state, p, &removed).await?;
        }
        record["versions"] = Value::from(deduped);
        if let Some(kind) = platform_kind(&data)? {
            record["kind"] = Value::from(kind);
        }
        state
            .0
            .store
            .append(&format!("platforms:{p}"), &record)
            .await?;
        if !removed.is_empty() {
            schema::remove(&state.0.store, p, &removed).await?;
            for v in &removed {
                audit(&state, &session, "delete", p, Some(v)).await;
            }
        }
        audit(&state, &session, "update", p, None).await;
        Ok(ok(true))
    } else if versions {
        Ok(Json(platform(&state, p).await?["versions"].clone()).into_response())
    } else if let Some(v) = path.get(2) {
        legacy_name(v, true)?;
        let record = state
            .0
            .store
            .latest(&schema::key(p, v))
            .await?
            .ok_or_else(|| ApiError::missing("Version not found"))?;
        // The resolved output embeds every platform it extends, so a scoped token
        // must cover all of them, as recorded when the output was computed.
        if let Some(grant) = &grant
            && !schema::stored_sources(p, &record)
                .is_some_and(|sources| sources.iter().all(|source| grant.allows(source)))
        {
            return Err(ApiError(
                StatusCode::FORBIDDEN,
                "This schema extends platforms outside this token's scope".into(),
            ));
        }
        Ok(Json(record).into_response())
    } else {
        Ok(Json(platform(&state, p).await?).into_response())
    }
}

#[cfg(test)]
mod tests {
    use super::semver;
    #[test]
    fn writes_use_strict_npm_versions() {
        for value in [
            "1.2.3",
            "v1.2.3",
            "1.2.3-beta.1",
            "1.2.3+0001.01",
            "1.2.3-9007199254740992",
        ] {
            assert!(semver(value), "{value}");
        }
        for value in [
            "01.2.3",
            "1.2.3-01",
            "1.2.3-beta.01",
            "V1.2.3",
            "9007199254740992.1.2",
            "1.2",
            "latest",
            "1.2.3+",
        ] {
            assert!(!semver(value), "{value}");
        }
    }
}
