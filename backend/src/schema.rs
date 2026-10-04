use crate::{
    error::{ApiError, Result},
    store::Store,
};
use node_semver::{Range, Version};
use serde_json::{Value, json};
use std::{collections::HashSet, future::Future, pin::Pin};

pub fn key(platform: &str, version: &str) -> String {
    format!("schemas:{platform}:{version}")
}
pub fn dependencies(content: &Value) -> Vec<String> {
    fn walk(value: &Value, found: &mut Vec<String>) {
        match value {
            Value::Object(map) => {
                for (key, value) in map {
                    if key == "@extends"
                        && let Some(reference) = value.as_str()
                    {
                        if !found.iter().any(|v| v == reference) {
                            found.push(reference.into());
                        }
                        continue;
                    }
                    walk(value, found);
                }
            }
            Value::Array(items) => {
                for item in items {
                    walk(item, found);
                }
            }
            _ => (),
        }
    }
    let mut found = Vec::new();
    walk(content, &mut found);
    found
}
pub fn resolve(reference: &str, platforms: &[Value]) -> Result<(String, String)> {
    let mut parts = reference.split('/');
    let platform = parts.next().unwrap_or_default();
    let requested = parts.next().filter(|v| !v.is_empty()).unwrap_or("latest");
    let data = platforms
        .iter()
        .find(|p| p["name"] == platform)
        .ok_or_else(|| ApiError::bad(format!("Platform \"{platform}\" not found")))?;
    let versions: Vec<&str> = data["versions"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
        .collect();
    let chosen = if requested == "latest" || requested.contains(['~', '^', '*', '>', '<', '=', '|'])
    {
        let range = if requested == "latest" {
            None
        } else {
            requested.parse::<Range>().ok()
        };
        versions
            .iter()
            // max_by returns the last equal item. Reverse to retain npm's first
            // occurrence when versions differ only in build metadata.
            .rev()
            .filter_map(|raw| {
                let version = raw.parse::<Version>().ok()?;
                if requested != "latest" && !range.as_ref().is_some_and(|r| version.satisfies(r)) {
                    return None;
                }
                Some((*raw, version))
            })
            .max_by(|a, b| a.1.cmp(&b.1))
            .map(|(raw, _)| raw)
    } else {
        versions.into_iter().find(|v| *v == requested)
    };
    Ok((
        platform.into(),
        chosen
            .ok_or_else(|| {
                ApiError::bad(format!(
                    "No version found for {platform} satisfying \"{requested}\""
                ))
            })?
            .into(),
    ))
}
pub fn merge(mut base: Value, overrides: Value) -> Value {
    if let (Some(base), Some(overrides)) = (base.as_object_mut(), overrides.as_object()) {
        for (key, value) in overrides {
            if key == "@extends" {
                continue;
            }
            let next = match base.get(key) {
                Some(existing) if existing.is_object() && value.is_object() => {
                    merge(existing.clone(), value.clone())
                }
                _ => value.clone(),
            };
            base.insert(key.clone(), next);
        }
    }
    base
}
fn process<'a>(
    store: &'a Store,
    node: Value,
    visited: HashSet<String>,
    platforms: &'a [Value],
    depth: usize,
) -> Pin<Box<dyn Future<Output = Result<Value>> + Send + 'a>> {
    Box::pin(async move {
        if depth > 128 {
            return Err(ApiError::bad("Schema composition exceeds maximum depth"));
        }
        match node {
            Value::Array(items) => {
                let mut output = Vec::new();
                for item in items {
                    output.push(process(store, item, visited.clone(), platforms, depth + 1).await?);
                }
                Ok(Value::Array(output))
            }
            Value::Object(mut map) => {
                if let Some(reference) = map
                    .get("@extends")
                    .and_then(Value::as_str)
                    .map(str::to_owned)
                {
                    let (platform, version) = resolve(&reference, platforms)?;
                    let id = format!("{platform}/{version}");
                    let mut child = visited;
                    if !child.insert(id.clone()) {
                        return Err(ApiError::bad(format!(
                            "Circular dependency detected at {id}"
                        )));
                    }
                    let base = store
                        .latest(&key(&platform, &version))
                        .await?
                        .and_then(|v| v.get("content").cloned())
                        .unwrap_or(json!({}));
                    let base = process(store, base, child.clone(), platforms, depth + 1).await?;
                    map.shift_remove("@extends");
                    let overrides =
                        process(store, Value::Object(map), child, platforms, depth + 1).await?;
                    Ok(merge(base, overrides))
                } else {
                    for value in map.values_mut() {
                        *value =
                            process(store, value.clone(), visited.clone(), platforms, depth + 1)
                                .await?;
                    }
                    Ok(Value::Object(map))
                }
            }
            other => Ok(other),
        }
    })
}
pub async fn validate(store: &Store, content: &Value) -> Result<Value> {
    let platforms = store.platforms().await?;
    let errors: Vec<String> = dependencies(content)
        .iter()
        .filter_map(|reference| resolve(reference, &platforms).err().map(|e| e.1))
        .collect();
    Ok(json!({"valid": errors.is_empty(), "errors": errors}))
}
pub async fn save(
    store: &Store,
    platform: &str,
    version: &str,
    content: Value,
    author: Value,
) -> Result<()> {
    let platforms = store.platforms().await?;
    let mut visited = HashSet::new();
    save_tree(
        store,
        platform.into(),
        version.into(),
        content,
        author,
        &platforms,
        &mut visited,
    )
    .await
}
fn save_tree<'a>(
    store: &'a Store,
    platform: String,
    version: String,
    content: Value,
    author: Value,
    platforms: &'a [Value],
    visited: &'a mut HashSet<String>,
) -> Pin<Box<dyn Future<Output = Result<()>> + Send + 'a>> {
    Box::pin(async move {
        let id = format!("{platform}/{version}");
        visited.insert(id.clone());
        let previous = store
            .latest(&key(&platform, &version))
            .await?
            .unwrap_or(json!({}));
        let deps = dependencies(&content);
        let resolved = deps
            .iter()
            .map(|reference| resolve(reference, platforms))
            .collect::<Result<Vec<_>>>()?;
        let output = process(store, content.clone(), HashSet::new(), platforms, 0).await?;
        let mut value = json!({"dependencies": deps, "content": content, "output": output});
        if !author.is_null() {
            value["author"] = author;
        }
        store.append(&key(&platform, &version), &value).await?;
        for (p, v) in resolved {
            store
                .membership("SADD", &format!("schemas:dependents:{p}:{v}"), &id)
                .await?;
        }
        for old in dependencies(&previous["content"]) {
            if !deps.contains(&old)
                && let Ok((p, v)) = resolve(&old, platforms)
            {
                store
                    .membership("SREM", &format!("schemas:dependents:{p}:{v}"), &id)
                    .await?;
            }
        }
        // The source write has committed. Dependent failures must not fail it.
        let cascade: Result<()> = async {
            for dependent in store
                .members(&format!("schemas:dependents:{platform}:{version}"))
                .await?
            {
                if !visited.insert(dependent.clone()) {
                    continue;
                }
                if let Some((p, v)) = dependent.split_once('/')
                    && let Some(latest) = store.latest(&key(p, v)).await?
                    && latest["content"].is_object()
                {
                    save_tree(
                        store,
                        p.into(),
                        v.into(),
                        latest["content"].clone(),
                        latest["author"].clone(),
                        platforms,
                        visited,
                    )
                    .await?;
                }
            }
            Ok(())
        }
        .await;
        if let Err(error) = cascade {
            tracing::error!(?error, %id, "Dependent cascade failed after source write");
        }
        Ok(())
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn npm_ranges_and_original_version_names() {
        let platforms = vec![
            json!({"name":"base","versions":["1.0.0","1.9.0+build.5","2.0.0","2.1.0-beta.1"]}),
        ];
        for (reference, expected) in [
            ("base/^1.0.0", "1.9.0+build.5"),
            ("base/~1.0", "1.0.0"),
            ("base/>=1 <2 || =2.0.0", "2.0.0"),
            ("base/*", "2.0.0"),
            ("base", "2.1.0-beta.1"),
        ] {
            assert_eq!(resolve(reference, &platforms).unwrap().1, expected);
        }
        assert!(resolve("missing", &platforms).is_err());
        assert!(resolve("base/^3", &platforms).is_err());
        let ties = vec![json!({"name":"base","versions":["v1.2.3+first","1.2.3+second"]})];
        assert_eq!(resolve("base/latest", &ties).unwrap().1, "v1.2.3+first");
        assert_eq!(resolve("base/^1", &ties).unwrap().1, "v1.2.3+first");
    }
    #[test]
    fn nested_arrays_dependencies_and_merge() {
        let content = json!({"@extends":"a", "list":[{"@extends":"b"},{"@extends":"a"}]});
        assert_eq!(dependencies(&content), vec!["a", "b"]);
        assert_eq!(
            merge(
                json!({"nested":{"a":1,"b":2},"list":[1]}),
                json!({"nested":{"b":3},"list":[2]})
            ),
            json!({"nested":{"a":1,"b":3},"list":[2]})
        );
    }
}
