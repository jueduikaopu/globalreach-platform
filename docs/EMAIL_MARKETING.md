# 智能邮件营销

## 可运行链路

管理端 `/admin/email.html` 支持六类模板、拖拽/排序、撤销重做、HTML 源码、移动预览、收件人、时区与定时字段。无真实凭证时，发送器以 Mock 模式记录每位收件人的接受事件；可模拟打开并实时刷新报告。追踪端点为 `/t/o/:messageId.gif`、`/t/c/:messageId?u=` 和 `/unsubscribe/:token`。

邮箱账户提供 Gmail、Outlook、Yahoo 与自定义服务商预设，覆盖 SMTP、IMAP、POP3 以及 OAuth/App 密码入口。凭据不得写入业务库，库内仅保存 Secret Manager 引用。当前 Mock 不会连接真实收件箱；接入生产环境时由 provider adapter 使用同一账户配置实现长连接池、指数退避和 IMAP 增量游标。

## 送达指标口径

- 97% 是目标“接收服务器接受率”：accepted / attempted，排除已退订、硬退信和投诉抑制地址；它不是“进入主收件箱”的无条件承诺。
- 3 秒是 API 提交/队列接受 P95 目标；最终到达由收件服务商队列、域名/IP 信誉和策略决定。
- 每次生产启用前必须验证 SPF、DKIM、DMARC；新 IP 按日逐步放量，硬退信、投诉、退订立即进入 suppression list。
- 退信与投诉端点：`POST /api/email/webhooks/bounce`、`POST /api/email/webhooks/complaint`。生产必须验证服务商签名。

## 自检与正式接入清单

运行 `npm run email:check -- example.com`。脚本查询 SPF/DMARC；DKIM 需要实际 selector，默认保持 `requires_selector`，不会伪报通过。

1. SPF 仅允许授权发信源，避免多条 SPF。
2. DKIM 使用 2048 位密钥并配置轮换；把 selector 接入检查器。
3. DMARC 先 `p=none` 观察，再提升到 quarantine/reject，并配置 rua 报告。
4. 验证自定义 Return-Path、List-Unsubscribe 和一键退订。
5. 配置退信/投诉 Webhook 签名、重放保护和告警。
6. 按服务商分别限频；429/4xx 指数退避，5xx/硬退信不盲目重试。
7. 新 IP/域名预热；监控投诉率、硬退信率、接受延迟与各 ISP 接受率。
8. OAuth token/App 密码写 Secret Manager，日志脱敏，最小权限访问 IMAP/SMTP。

## 自动化

规则支持新询盘、弃单、生日和新品事件，按客户标签、IANA 时区与发送小时匹配。`POST /api/email/automations/run` 可用测试事件验证命中；`POST /api/email/worker/run` 执行当前租户已到期的定时活动。生产调度器应按分钟调用 worker 或消费 Kafka，并利用 campaign id + recipient 做幂等键。
