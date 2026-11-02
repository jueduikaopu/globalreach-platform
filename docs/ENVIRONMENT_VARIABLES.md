# 环境变量清单

| 变量 | 必需 | 用途 | 示例/要求 |
|---|---|---|---|
| `PORT` | 否 | API 监听端口 | `4100` |
| `APP_ORIGIN` | 是 | 绝对链接、追踪和站点 canonical | `https://app.example.com` |
| `JWT_SECRET` | 是 | JWT HMAC 密钥 | 密钥管理系统生成，≥32 随机字节 |
| `DATA_FILE` | 仅本地 | JSON 演示存储 | 生产禁止使用 |
| `DATABASE_URL` | 是 | PostgreSQL TLS 连接 | 凭证只存 Secret Manager |
| `REDIS_URL` | 是 | 缓存、限流、会话辅助 | TLS，Cluster/Sentinel |
| `KAFKA_BROKERS` | 是 | 跨模块事件与异步任务 | 逗号分隔，SASL/TLS |
| `CLICKHOUSE_URL` | 是 | 分析数据 | 仅私网访问 |
| `OPENSEARCH_URL` | 是 | 商机全文检索 | SigV4 或专用凭证 |
| `S3_ENDPOINT` / `S3_BUCKET` | 是 | 站点、媒体、归档和导出 | 开启版本控制与加密 |
| `CDN_BASE_URL` | 是 | 静态资源与发布站点 | HTTPS |
| `SMTP_*` / `DKIM_*` | 发信必需 | 发信池与 DKIM | 不写入仓库 |
| `FACEBOOK_*` / `LINKEDIN_*` / `YOUTUBE_*` | 社媒必需 | OAuth 客户端与回调 | 回调域名需备案 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | 推荐 | 分布式追踪 | 内网 Collector |
| `LOG_LEVEL` | 否 | 日志级别 | 生产 `info` |

所有 Secret 均应支持轮换与最小权限；浏览器端只允许公开配置。生产启动应在缺失 `JWT_SECRET`、数据库或对象存储配置时直接失败，不得回退到本地默认值。
