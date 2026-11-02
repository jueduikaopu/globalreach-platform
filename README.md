# GlobalReach Platform

跨境电商独立站 SaaS + 院校创新创业实训支撑系统的生产级架构基线与可运行脚手架。当前版本实现注册、登录、租户隔离、RBAC 基础、健康检查、统一错误、结构化日志、审计记录及可静态部署的预渲染首页；未把外部 Mock 或设计目标冒充生产达标。

## 一键启动

要求 Node.js 20+，无需安装依赖：

```bash
cd /Users/harry/Documents/ChatGPT/创/sites/globalreach-platform
./scripts/dev.sh
```

打开 `http://localhost:4100`，注册后进入 `http://localhost:4100/admin`。开发数据写入 `.data/dev-db.json`。

## 自测与静态构建

```bash
npm test
npm run check
npm run build
```

构建结果位于 `dist/web` 和 `dist/admin`。首页是预渲染 HTML，可直接部署到 CDN/对象存储；生产版建议迁移为 Next.js SSG/ISR，页面契约保持不变。

## 页面完成后发布到 GitHub

仓库级交付规则见 `AGENTS.md`。页面通过验证后运行：

```bash
npm run ship -- "feat: describe the completed page"
```

该命令依次执行测试、交付物检查、暂存、提交并推送到 `origin/main`；工作区无变更时不会创建空提交。提交前仍应检查 `git status --short`，避免混入无关文件。

## 仓库结构

```text
apps/
  web/             预渲染官网/店铺前端基线
  admin/           院校与 SaaS 管理台
  api/             HTTP API、数据库迁移
packages/
  auth/            密码、JWT、RBAC
  config/          环境配置、locale/currency
  logger/          结构化日志与敏感字段脱敏
docs/              架构、容量压测、自测与缺口
scripts/           一键启动、构建、交付检查
tests/             API 端到端测试
```

## 环境变量

复制 `.env.example` 并由部署系统注入。脚手架直接读取 shell 环境，不自动加载 `.env`；生产 secrets 必须进入 Secret Manager。

| 变量 | 用途 | 本地默认 |
|---|---|---|
| `PORT` | HTTP 端口 | `4100` |
| `APP_ORIGIN` | 应用源地址 | `http://localhost:4100` |
| `JWT_SECRET` | 本地 JWT 签名密钥 | 仅开发默认值 |
| `DATA_FILE` | 本地 JSON 数据文件 | `.data/dev-db.json` |
| `DATABASE_URL` | PostgreSQL | 无生产默认 |
| `REDIS_URL` | Redis | 无生产默认 |
| `KAFKA_BROKERS` | Kafka broker | 无生产默认 |
| `S3_ENDPOINT/S3_BUCKET` | 对象存储 | 无生产默认 |
| `OPENSEARCH_URL` | 搜索 | 无生产默认 |
| `CLICKHOUSE_URL` | 分析库 | 无生产默认 |

## 数据库迁移

核心 Schema 位于 `apps/api/db/migrations/001_init.sql`，包含用户/租户、店铺、模板、产品、订单、询盘、客户、邮件任务、社媒账号、海关查询、工单、实训项目、培训计划、奖金与审计表。

生产执行示例：

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/api/db/migrations/001_init.sql
```

注意：迁移使用 `citext`，生产库需预先允许该扩展；应用取得连接后必须在事务内执行 `SET LOCAL app.tenant_id = '<uuid>'`，RLS 与应用层校验共同生效。

## 设计文档

- [总体架构、选型、性能、容量、容灾、安全、i18n](docs/ARCHITECTURE.md)
- [60 万 PV 压测与扩容路径](docs/LOAD_TEST.md)
- [自测结果和未实现项](docs/SELF_TEST.md)
- [性能、容量、缓存、归档、扩容与 RTO 运行手册](docs/INFRASTRUCTURE.md)
- [本地性能测试结果与限制](docs/PERFORMANCE_REPORT.md)
- [海外独立站构建、模板导入、编辑器和 SEO](docs/SITE_BUILDER.md)
- [全球商机洞察、海关数据接入、检索与导出](docs/INSIGHTS.md)
- [社交媒体营销、官方 API 适配边界与 Mock 验收](docs/SOCIAL_MARKETING.md)

## 性能与基础设施命令

```bash
npm run load-test
npm run rto-drill
node scripts/storage-capacity.mjs 100 10 3
docker compose -f infra/docker-compose.yml up -d
docker compose -f infra/docker-compose.yml up -d --scale api=3
```

`npm run rto-drill` 默认安全地生成 dry-run 演练报告；Compose 已运行时使用 `RTO_EXECUTE=1 npm run rto-drill` 执行健康、备份和恢复清单验证。
