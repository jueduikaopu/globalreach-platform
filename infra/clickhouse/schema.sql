CREATE DATABASE IF NOT EXISTS globalreach;
CREATE TABLE IF NOT EXISTS globalreach.events_local (
  event_date Date MATERIALIZED toDate(event_time), event_time DateTime64(3, 'UTC'),
  tenant_id UUID, event_name LowCardinality(String), user_id Nullable(UUID), session_id String,
  path String, properties String, ingested_at DateTime DEFAULT now()
) ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date) ORDER BY (tenant_id,event_date,event_name,event_time)
TTL event_date + INTERVAL 7 DAY TO VOLUME 'warm', event_date + INTERVAL 30 DAY DELETE
SETTINGS index_granularity=8192;
