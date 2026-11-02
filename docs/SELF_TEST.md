# 自测结果与缺口

## 已验证

- `npm test`：注册、登录、错误密码、受保护 `/api/me`、租户身份返回。
- `npm run check`：monorepo 必备文件、8+ locale、核心 Schema 表、预渲染 HTML、架构与容量文档。
- `npm run build`：复制预渲染静态产物到 `dist/web`、`dist/admin`，可由任意静态服务器/CDN 承载。
- 安全响应头、结构化日志、统一 JSON 错误、密码 scrypt 哈希、JWT 验证与审计记录已在本地脚手架实现。
- 缓存穿透/空值、令牌桶限流、熔断、Prometheus 输出、gzip 分区归档组件测试全部通过。
- `npm run rto-drill` 已生成 dry-run 演练记录；不会把 dry-run 视为生产 RTO 达标。
- 本机压测结果见 `docs/PERFORMANCE_REPORT.md`。

## 尚未实现/不能声称已达标

- 未部署 PostgreSQL/Redis/Kafka/ClickHouse/OpenSearch/S3/CDN 与多可用区；本地运行使用 JSON 文件持久化，原因是交付环境无生产云资源。
- 未接真实海关、邮件、社媒和支付；需要商业授权、OAuth 审批、域名与合规口径。
- 未执行目标云 500 RPS、10TB/日数据管道、区域故障恢复实测；原因是需要目标云账号、网络、数据集和费用预算。
- 前端为预渲染 HTML 初始化版本，不是完整 Next.js 商业编辑器；它证明静态部署边界与鉴权闭环，不代表全部业务模块完成。
- RTO 60/120 分钟为设计目标，只有在生产环境完成演练并留存报告后才能视为通过。
- 当前环境未安装 Docker，因而 `docker compose config/up` 未实跑；Compose YAML 已交付，镜像拉取、容器健康和横向扩容需在有 Docker 的环境复验。
- 更新后的登录 P95 压测场景已进入脚本，但本轮端口执行授权额度耗尽，只有此前功能测试中的约 19ms 单次记录，不能宣称为登录 P95。
