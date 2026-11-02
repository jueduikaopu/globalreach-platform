# 端到端联调与验收报告

日期：2026-11-02；环境：macOS 本机回环 `127.0.0.1:4100`、Node v22.22.2、纯 Mock 数据。命令：`npm run e2e`。

## 7 条链路结果

| # | 场景 | 关键证据 | 结果 |
|---|---|---|---|
| 1 | 学生注册 → 加入团队 → 领取账号 | 加入“远航一队”，YouTube 账号申请状态 `approved` | PASS |
| 2 | 8 语言独立站发布 | 8 个 locale URL，sitemap 含 8 个 `<url>` | PASS |
| 3 | HS 6109 商机 | 命中 2 家，收藏 2 家，CSV 2 行且中文表头正确 | PASS |
| 4 | 自动化开发信 | Mock 接受 2 封，自动化规则命中 1 条 | PASS |
| 5 | Facebook/YouTube 分发 | 两个平台均 `published`，聚合收件箱 4 条互动 | PASS |
| 6 | CRM | 重复询盘自动归并、负责人存在、流转至谈判、4 条超期客户进入公海 | PASS |
| 7 | “HS6109 选品报告”工单 | 95 分验收，生成 ¥1,200 `pending_semester_settlement` 奖金 | PASS |

本次运行总计 7/7 PASS。脚本每次生成独立租户与 ID，可重复运行且不会依赖上次结果。

## 性能

命令：`REQUESTS=2000 CONCURRENCY=50 npm run load-test`。

| 路径 | P95 | P99 | RPS | 错误 | 指标 |
|---|---:|---:|---:|---:|---|
| 首页 | 8.1ms | 18.1ms | 8,831.0 | 0 | ≤1.5s，达标 |
| 缓存首页 API | 5.6ms | 7.8ms | 14,828.3 | 0 | ≤1.5s，达标 |
| 注册 | 28.0ms | - | 串行 20 次 | 0 | P95≤3s，达标 |
| 登录 | 19.9ms | - | 串行 20 次 | 0 | P95≤3s，达标 |

容量口径：60 万 PV/日，峰值小时占 20%，再乘 4 倍突发，公开页面目标 133.3 RPS；按每 PV 3 个动态请求估算 API 目标 400 RPS。本机结果只证明应用代码路径，生产上线前仍需从目标海外区域经 CDN/WAF 进行 60 分钟稳态与 2 倍尖峰测试。

## 安全基线

`npm run security-scan` 结果 6/6 PASS：无令牌 POST 与篡改 JWT 均返回 401；恶意 HTML 在普通 HTML 与 JSON-LD 中安全编码；SQL 注入载荷作为普通字符串处理；跨租户 IDOR 返回 404；CSP、`X-Frame-Options: DENY`、`X-Content-Type-Options: nosniff` 均存在。该结果是基础自动化扫描，不等同第三方渗透测试或等保测评。

## 截图入口

可视化验收页：`/admin/acceptance.html`。实训终态页：`/admin/training.html`；静态站与 sitemap 的具体 URL 每次运行打印在 E2E JSON 日志中。
