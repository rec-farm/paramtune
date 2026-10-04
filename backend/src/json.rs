//! Match JSON.stringify's numeric formatting and object enumeration for existing
//! Redis sorted-set members and content hashes. Key order is part of member identity.
use serde_json::Value;
pub fn stringify(value: &Value) -> String {
    match value {
        Value::Number(number) => ryu_js::Buffer::new()
            .format(number.as_f64().unwrap())
            .to_owned(),
        Value::Array(items) => format!(
            "[{}]",
            items.iter().map(stringify).collect::<Vec<_>>().join(",")
        ),
        Value::Object(map) => {
            fn index(key: &str) -> Option<u32> {
                key.parse::<u32>()
                    .ok()
                    .filter(|n| *n != u32::MAX && n.to_string() == key)
            }
            let mut numeric: Vec<_> = map
                .keys()
                .filter_map(|key| index(key).map(|n| (n, key)))
                .collect();
            numeric.sort_by_key(|(n, _)| *n);
            let keys = numeric
                .into_iter()
                .map(|(_, key)| key)
                .chain(map.keys().filter(|key| index(key).is_none()));
            format!(
                "{{{}}}",
                keys.map(|key| format!(
                    "{}:{}",
                    serde_json::to_string(key).unwrap(),
                    stringify(&map[key])
                ))
                .collect::<Vec<_>>()
                .join(",")
            )
        }
        other => other.to_string(),
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn javascript_number_and_index_serialization() {
        let value: Value = serde_json::from_str(
            r#"{"10":1.0,"2":-0.0,"first":1e-7,"second":1e20,"third":1e21,"01":4}"#,
        )
        .unwrap();
        assert_eq!(
            stringify(&value),
            r#"{"2":0,"10":1,"first":1e-7,"second":100000000000000000000,"third":1e+21,"01":4}"#
        );
    }
}
