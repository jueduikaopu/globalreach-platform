CREATE DATABASE IF NOT EXISTS globalreach ON CLUSTER globalreach_cluster;
CREATE TABLE IF NOT EXISTS globalreach.events_local ON CLUSTER globalreach_cluster (
  event_date Date MATERIALIZED toDate(event_time), event_time DateTime64(3,'UTC'), tenant_id UUID,
  event_name LowCardinality(String), user_id Nullable(UUID), session_id String, path String,
  properties String CODEC(ZSTD(3)), ingested_at DateTime DEFAULT now()
) ENGINE=ReplicatedMergeTree('/clickhouse/tables/{shard}/events','{replica}')
PARTITION BY toYYYYMM(event_date) ORDER BY (tenant_id,event_date,event_name,event_time)
TTL event_date + INTERVAL 7 DAY TO VOLUME 'warm', event_date + INTERVAL 30 DAY DELETE;
CREATE TABLE IF NOT EXISTS globalreach.events ON CLUSTER globalreach_cluster AS globalreach.events_local
ENGINE=Distributed(globalreach_cluster,globalreach,events_local,cityHash64(tenant_id));
