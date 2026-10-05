use serde_json::{Value, json};
use std::collections::BTreeSet;
fn keys(value: &Value, prefix: &str, found: &mut BTreeSet<String>) {
    if let Some(map) = value.as_object() {
        for (key, value) in map {
            let path = if prefix.is_empty() {
                key.clone()
            } else {
                format!("{prefix}.{key}")
            };
            found.insert(path.clone());
            keys(value, &path, found);
        }
    }
}
fn at<'a>(value: &'a Value, path: &str) -> Option<&'a Value> {
    path.split('.').try_fold(value, |v, key| v.get(key))
}
fn kind(value: Option<&Value>) -> &'static str {
    match value {
        None => "undefined",
        Some(Value::Null) => "null",
        Some(Value::Bool(_)) => "boolean",
        Some(Value::Number(_)) => "number",
        Some(Value::String(_)) => "string",
        Some(Value::Array(_)) => "array",
        Some(Value::Object(_)) => "object",
    }
}
fn equal(a: Option<&Value>, b: Option<&Value>) -> bool {
    match (a, b) {
        (Some(Value::Number(a)), Some(Value::Number(b))) => a.as_f64() == b.as_f64(),
        (Some(Value::Object(a)), Some(Value::Object(b))) => {
            a.len() == b.len() && a.iter().all(|(k, v)| equal(Some(v), b.get(k)))
        }
        (Some(Value::Array(a)), Some(Value::Array(b))) => {
            a.len() == b.len() && a.iter().zip(b).all(|(a, b)| equal(Some(a), Some(b)))
        }
        _ => a == b,
    }
}
pub fn compare(previous: &Value, current: &Value) -> Value {
    let mut old = BTreeSet::new();
    let mut new = BTreeSet::new();
    keys(previous, "", &mut old);
    keys(current, "", &mut new);
    let mut changes = Vec::new();
    for path in new.difference(&old) {
        let mut change = json!({"path":path,"type":"added"});
        if let Some(value) = at(current, path) {
            change["newValue"] = value.clone();
        }
        changes.push(change);
    }
    for path in old.difference(&new) {
        let mut change = json!({"path":path,"type":"removed"});
        if let Some(value) = at(previous, path) {
            change["oldValue"] = value.clone();
        }
        changes.push(change);
    }
    for path in new.intersection(&old) {
        let a = at(previous, path);
        let b = at(current, path);
        if !equal(a, b) {
            let mut change = json!({"path":path,"type":"modified"});
            if let Some(a) = a {
                change["oldValue"] = a.clone();
            }
            if let Some(b) = b {
                change["newValue"] = b.clone();
            }
            if kind(a) != kind(b) {
                change["typeChange"] = json!({"from":kind(a),"to":kind(b)});
            }
            changes.push(change);
        }
    }
    let of_type = |kind: &str| -> Vec<&Value> {
        changes
            .iter()
            .filter(|change| change["type"] == kind)
            .collect()
    };
    let (added, removed, modified) = (of_type("added"), of_type("removed"), of_type("modified"));
    json!({
        "changes": changes,
        "summary": {
            "added": added.len(),
            "removed": removed.len(),
            "modified": modified.len(),
            "unchanged": 0,
            "total": changes.len(),
        },
        "byType": {"added": added, "removed": removed, "modified": modified, "unchanged": []},
    })
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn direction_types_and_key_order() {
        let result = compare(
            &json!({"removed":1,"nested":{"x":1,"y":2},"type":null}),
            &json!({"added":2,"nested":{"y":2,"x":1},"type":[]}),
        );
        assert_eq!(
            result["summary"],
            json!({"added":1,"removed":1,"modified":1,"unchanged":0,"total":3})
        );
        assert_eq!(
            result["byType"]["modified"][0]["typeChange"],
            json!({"from":"null","to":"array"})
        );
    }

    #[test]
    fn groups_changes_by_type_and_identical_input_is_empty() {
        let result = compare(&json!({"a":1,"b":2}), &json!({"a":3,"c":4}));
        assert_eq!(result["byType"]["added"][0]["path"], "c");
        assert_eq!(result["byType"]["removed"][0]["path"], "b");
        assert_eq!(result["byType"]["modified"][0]["path"], "a");
        assert_eq!(result["byType"]["unchanged"], json!([]));

        let same = compare(&json!({"a":{"b":1}}), &json!({"a":{"b":1}}));
        assert_eq!(same["changes"], json!([]));
        assert_eq!(same["summary"]["total"], 0);
    }
}
