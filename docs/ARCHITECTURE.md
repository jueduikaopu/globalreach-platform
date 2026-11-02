# 技术方案与工程规划

## 1. 总体架构

```text
Browser / Search Bot
  ├─ Storefront: Next.js SSR + SSG/ISR (HTML 预生成、多语言 SEO)
  └─ Admin: React SPA
        ↓
Global CDN → WAF/DDoS → API Gateway (TLS, rate limit, request ID)
        ↓
  Auth/Tenant | Site/Product/Order | Insight | Campaign | Social | CRM | Training/Ticket
        ↓                         ↘ Kafka → async workers → Email/Social/Search/ETL
PostgreSQL (OLTP, RLS)  Redis       ClickHouse (events)  OpenSearch (search)
        ↓                              ↓                    ↓
WAL archive / backup            S3-compatible object storage ← media pipeline
        ↓
Multi-AZ primary/standby + cross-region recovery copy

OpenTelemetry → metrics/logs/traces → alerting/on-call/audit archive
```

## 2. 选型及理由

- 前端：Next.js + React。店铺页以 SSG/ISR 为主、SSR 为辅，兼顾首屏、SEO 和个性化；管理端可用 React SPA。本脚手架用预渲染 HTML 演示部署边界，生产升级不改变 API 契约。
- 后端：TypeScript + Fastify/NestJS。类型共享、生态成熟；Fastify 低开销，NestJS 适合团队模块化。初始化脚手架为无依赖 Node HTTP，确保本地一键可跑；生产阶段替换 transport。
- PostgreSQL：订单、租户、权限等强事务数据，RLS 叠加应用层 tenant_id 校验。PgBouncer 连接池；只读副本承担报表。
- ClickHouse：PV、行为事件、投放和批量分析，按日期与租户分区；避免把 10TB/日写入 OLTP。
- Redis：会话撤销、热点对象、限流、短期查询结果，采用 cache-aside 和带抖动 TTL。
- OpenSearch：产品、客户、商机全文检索与聚合；Kafka CDC 异步更新，不作为事实源。
- Kafka：10TB/日数据管道、事件回放和消费解耦；RabbitMQ 可仅用于低吞吐、强路由工单任务。
- S3 兼容对象存储 + CDN：媒体、导出、原始数据和归档；版本控制、生命周期与跨区复制。

## 3. 性能目标与方案

- 首页/工具页：全球 CDN、Brotli、HTTP/2/3、关键 CSS、字体子集、图片 AVIF/WebP、`srcset` 与懒加载；首页静态 HTML 预生成，边缘命中目标 ≥95%。
- 缓存分层：浏览器/CDN → 网关响应缓存 → Redis → 数据库；事件驱动失效，TTL 加随机抖动防雪崩，空值短 TTL 防穿透。
- API：读接口 ETag、游标分页；令牌桶限流按 IP/租户/用户三级执行；写接口幂等键；P95 核心交互预算 300ms 服务端、3 秒端到端。
- 数据库：索引审计、慢 SQL 门槛、读写分离；优先按 tenant_id 哈希分片，大租户可独立库。禁止跨分片在线 join。
- 媒体处理异步化，上传直传 S3；邮件、社媒发布、导出、搜索索引、ETL 均通过 Kafka worker。

## 4. 容量与容灾

### 60 万 PV/日

- 平均 `600,000 / 86,400 = 6.94 PV/s`。
- 假设 20% PV 集中在峰值小时：`120,000 / 3,600 = 33.3 PV/s`。
- 每 PV 产生 3 次动态 API 请求、再乘 4 倍瞬时突发：约 `400 API RPS`；压测按 500 RPS、P95 < 300ms、错误率 < 0.1% 验证。
- 90% 静态资源由 CDN 命中。初始每 AZ 3 个 2 vCPU/4GB 应用实例（3 AZ 共 9 个），单实例保守验收 100 RPS；CPU 60% 或 P95 200ms 持续 5 分钟自动扩容，最大 30 个。

### 10TB/日数据增量

原始数据三年与 20% 冗余：`10TB × 365 × 3 × 1.2 = 13.14PB`。这尚未包括副本、索引、备份；若对象存储跨区两副本，物理预算可达约 26.28PB。投产前必须冻结：10TB 是压缩前/后、原始/净新增、保留期、删除规则和副本口径。

建议分层：7 天热层约 70TB（ClickHouse，压缩与 2 副本另算）；23 天温层约 230TB；30 天后进入对象存储冷层并按数据合规保留。容量告警在 60/70/80%，80% 前完成扩分片；任何时点 `可用容量 ≥ 未来扩容交付周期内增长量 + 当前已用量的20%`。

### 高可用与恢复

- 3 可用区无状态部署；PostgreSQL 同区域同步主备 + 自动故障转移，跨区域异步副本；Redis Cluster、Kafka 3+ broker、对象存储跨区复制。
- 服务故障：5 分钟检测、15 分钟自动/人工切换、20 分钟验证、20 分钟余量，满足 RTO≤60 分钟。
- 核心重大故障：15 分钟定级、45 分钟恢复/提升灾备、30 分钟一致性验证、30 分钟业务放行，满足 RTO≤120 分钟。
- 建议 RPO：OLTP ≤5 分钟、对象/事件 ≤15 分钟。WAL 连续归档；每日增量、每周全量、季度跨区恢复演练。每月组件切换、每季度全链路恢复、每半年区域级演练并保存证据。

## 5. 安全基线

- WAF 与安全响应头；依 OWASP Top 10 做 SAST/DAST、依赖与镜像扫描。
- OAuth 2.1/OIDC；短期 access token + 可撤销 refresh token；MFA 用于管理员。脚手架使用 HS256 演示，生产使用 KMS 托管非对称密钥、轮换与 `kid`。
- Cookie 场景使用 SameSite + HttpOnly + Secure 和 CSRF token；严格 CSP、输出编码、参数化 SQL、输入 schema 校验。
- TLS 1.2+；数据库/对象存储使用 KMS 静态加密；第三方 token 仅存 Secret Manager 引用。
- 每次请求附 request_id；权限变更、导出、登录、奖金审批写入不可变审计日志并归档。

## 6. i18n、多币种、多时区

原生 locale：英语、西班牙语、俄语、日语、德语、法语、葡萄牙语、阿拉伯语及简体中文；URL 使用 `/en/...`，`hreflang` 与 locale sitemap，阿拉伯语支持 RTL。文案 ICU MessageFormat，内容 JSONB 按 locale 存储并设回退链。

金额一律以最小货币单位整数 + ISO 4217 币种保存；订单锁定下单时汇率及税费快照，展示使用 `Intl.NumberFormat`。时间统一 UTC 存储，租户/店铺/用户分别保存 IANA timezone，计划任务记录原时区和 DST 处理策略。

## 7. 工程阶段

1. 第 1–2 周：契约、租户/身份/RBAC/审计、CI 与可观测性；冻结验收口径。
2. 第 3–6 周：店铺/产品/询盘/CRM/实训核心闭环，PostgreSQL/Redis 与对象存储。
3. 第 7–10 周：数据、邮件、社媒合法供应商接入；Kafka/ClickHouse/OpenSearch。
4. 第 11–14 周：多语言、性能、安全、容灾演练与试点院校。
5. 第 15–18 周：压测整改、培训、试运行、验收证据包。外部 API 审批和 10TB 口径未冻结会改变排期。
