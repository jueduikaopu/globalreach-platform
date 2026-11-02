# 性能、容量与基础设施运行手册

## CDN 与缓存

`infra/cdn-cache-policy.yaml` 可映射到 CloudFront/Cloudflare/阿里云 CDN：内容哈希静态资产缓存一年，公开 HTML 边缘缓存 5 分钟并允许 24 小时 stale-while-revalidate；鉴权接口禁止缓存。API 内部 `TieredCache` 实现 L1/L2、随机 TTL、空值缓存和布隆过滤器。本地 L2 为内存适配器，生产替换为 Redis Cluster 适配器；缓存仅存可重建数据。

限流按认证接口和公开接口分池；生产在 CDN/WAF、网关、应用三层执行。`CircuitBreaker` 提供超时、失败阈值、OPEN/HALF_OPEN/CLOSED 状态，可包装邮件、社媒、海关等外部调用。

## 启动基础设施

```bash
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml ps
```

包含 Nginx、可横向扩展 API、Redis、PostgreSQL、ClickHouse、MinIO 和 Prometheus。Compose 用于开发/单机验收，不等于多可用区。生产应使用托管多 AZ PostgreSQL/Redis/Kafka/对象存储，或在 Kubernetes 跨 3 个 AZ 部署。

水平扩容：

```bash
docker compose -f infra/docker-compose.yml up -d --scale api=3
```

API 不保存会话状态，Nginx 服务发现并分流。生产 HPA 以 CPU 60%、内存 70% 或 P95 延迟 200ms 为触发器；数据库先扩只读副本，再按 tenant_id 分片；ClickHouse 使用 `schema_clustered.sql` 增加 shard/replica 后执行分布式 DDL。

## 数据分层

事件按 5–20MB 或 5 秒批量写 Kafka，再由消费者批量 INSERT ClickHouse；表按月分区、租户和时间排序，7 天迁温层、30 天归档对象存储。归档采用 NDJSON + gzip，键格式为 `year=/month=/day=/hour=`，上传成功校验后方可删除热层分区。

```bash
node scripts/archive-events.mjs ./events.ndjson /mnt/object-store
node scripts/storage-capacity.mjs 100 10 3
```

容量公式严格采用 `当前用量 × 1.2 + 日增 × 365 × 3`。脚本超过 1.8 倍当前容量时返回退出码 2，供监控系统告警。对象存储配置 30 天转低频、180 天转归档；保留/删除期须由合同与合规策略确认。

## 高可用、备份与 RTO

生产：应用跨 3 AZ、PostgreSQL 同城同步主备加跨区异步灾备、Redis/Kafka/ClickHouse 多副本，对象存储版本控制和跨区复制。PostgreSQL 每周全量 `pg_basebackup`、WAL 连续归档、每日恢复校验；建议 OLTP RPO≤5 分钟。

安全的报告模板演练：

```bash
npm run rto-drill
RTO_EXECUTE=1 npm run rto-drill
```

第二条会对 Compose PostgreSQL 生成备份并验证恢复清单；不会自动删除或覆盖数据库。真正主备提升使用 `REPLICA_CONTAINER=... ./scripts/postgres-promote.sh`，必须先确认复制延迟、应用连接切换和回切方案。生产每月组件切换、每季度全恢复、每半年区域级演练。

## 指标与追踪

- `/api/health`：进程、存储和熔断器状态。
- `/metrics`：Prometheus counters/histograms，包括 HTTP 延迟、缓存命中、限流和熔断。
- 浏览器用 `PerformanceObserver` 上报 LCP、TTFB 与交互耗时到 `/api/rum`。
- JSON 日志包含 request_id、状态和耗时，并对 token/password/secret 脱敏。
- 生产可接 OpenTelemetry SDK，将 W3C `traceparent` 贯穿网关、API、Kafka consumer、ClickHouse 与外部 API；当前零依赖脚手架未绑定具体 collector。

## 压测口径

```bash
REQUESTS=5000 CONCURRENCY=100 node scripts/load-test.mjs
```

60 万 PV/日平均 6.94 PV/s；峰值小时占 20% 并乘 4 倍突发为 133.3 页面 RPS；按每 PV 3 个动态请求，API 目标约 400 RPS，验收取 500 RPS。本地回环结果只能验证代码路径，生产仍须从目标地区经 CDN 执行 60 分钟稳态和 2 倍尖峰压测。
