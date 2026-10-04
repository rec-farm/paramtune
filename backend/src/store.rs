use crate::error::{ApiError, Result};
use redis::aio::ConnectionManager;
use serde_json::Value;
use tokio::sync::OnceCell;

pub struct Store {
    client: redis::Client,
    connection: OnceCell<ConnectionManager>,
}
impl Store {
    pub fn new(url: &str) -> std::result::Result<Self, redis::RedisError> {
        Ok(Self {
            client: redis::Client::open(url)?,
            connection: OnceCell::new(),
        })
    }
    async fn connection(&self) -> Result<ConnectionManager> {
        Ok(self
            .connection
            .get_or_try_init(|| async {
                self.client
                    .get_connection_manager_with_config(
                        redis::aio::ConnectionManagerConfig::new()
                            .set_number_of_retries(1)
                            .set_connection_timeout(std::time::Duration::from_secs(3))
                            .set_response_timeout(std::time::Duration::from_secs(5)),
                    )
                    .await
            })
            .await?
            .clone())
    }
    pub async fn latest(&self, key: &str) -> Result<Option<Value>> {
        let rows: Vec<String> = redis::cmd("ZREVRANGEBYSCORE")
            .arg(key)
            .arg("+inf")
            .arg("-inf")
            .arg("LIMIT")
            .arg(0)
            .arg(1)
            .query_async(&mut self.connection().await?)
            .await?;
        Ok(rows.first().and_then(|row| serde_json::from_str(row).ok()))
    }
    pub async fn platforms(&self) -> Result<Vec<Value>> {
        let mut connection = self.connection().await?;
        let mut cursor = 0u64;
        let mut keys = std::collections::BTreeSet::new();
        loop {
            let (next, batch): (u64, Vec<String>) = redis::cmd("SCAN")
                .arg(cursor)
                .arg("MATCH")
                .arg("platforms:*")
                .query_async(&mut connection)
                .await?;
            keys.extend(batch);
            cursor = next;
            if cursor == 0 {
                break;
            }
        }
        let mut platforms = Vec::new();
        for key in keys {
            if let Some(value) = self.latest(&key).await? {
                platforms.push(value);
            }
        }
        Ok(platforms)
    }
    pub async fn append(&self, key: &str, value: &Value) -> Result<()> {
        // Atomic append + trim; preserve the existing sorted-set JSON member format.
        let script = redis::Script::new(
            "redis.call('ZADD', KEYS[1], ARGV[1], ARGV[2]); local n = redis.call('ZCARD', KEYS[1]); if n > 200 then redis.call('ZREMRANGEBYRANK', KEYS[1], 0, n - 201) end; return 1",
        );
        let _: i32 = script
            .key(key)
            .arg(chrono::Utc::now().timestamp_millis())
            .arg(crate::json::stringify(value))
            .invoke_async(&mut self.connection().await?)
            .await?;
        Ok(())
    }
    pub async fn history(&self, key: &str, limit: usize) -> Result<Vec<Value>> {
        let rows: Vec<(String, f64)> = redis::cmd("ZREVRANGEBYSCORE")
            .arg(key)
            .arg("+inf")
            .arg("-inf")
            .arg("WITHSCORES")
            .arg("LIMIT")
            .arg(0)
            .arg(limit)
            .query_async(&mut self.connection().await?)
            .await?;
        Ok(rows
            .into_iter()
            .filter_map(|(raw, timestamp)| {
                let mut value: Value = serde_json::from_str(&raw).ok()?;
                value
                    .as_object_mut()?
                    .insert("timestamp".into(), Value::from(timestamp as i64));
                Some(value)
            })
            .collect())
    }
    pub async fn members(&self, key: &str) -> Result<Vec<String>> {
        Ok(redis::cmd("SMEMBERS")
            .arg(key)
            .query_async(&mut self.connection().await?)
            .await?)
    }
    pub async fn membership(&self, command: &str, key: &str, member: &str) -> Result<()> {
        let _: i32 = redis::cmd(command)
            .arg(key)
            .arg(member)
            .query_async(&mut self.connection().await?)
            .await?;
        Ok(())
    }
    pub async fn audit(&self, mut entry: Value) {
        entry["timestamp"] =
            Value::from(chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true));
        let result: Result<()> = async {
            let _: () = redis::pipe()
                .cmd("LPUSH")
                .arg("audit:log")
                .arg(entry.to_string())
                .ignore()
                .cmd("LTRIM")
                .arg("audit:log")
                .arg(0)
                .arg(999)
                .ignore()
                .query_async(&mut self.connection().await?)
                .await
                .map_err(ApiError::from)?;
            Ok(())
        }
        .await;
        if let Err(error) = result {
            tracing::error!(?error, "Audit logging failed after successful mutation");
        }
    }
}
