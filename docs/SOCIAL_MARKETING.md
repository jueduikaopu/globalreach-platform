# 社交媒体营销

管理端入口为 `/admin/social.html`。本地演示使用 Mock OAuth 和官方 API 适配器契约，不会访问或声称已连接真实 Facebook、LinkedIn、YouTube 账号。

## 可运行流程

1. 绑定三平台 Mock 账号，数据库仅保存 `tokenRef`；生产凭据必须放入 Secret Manager。
2. 工作台可多选账号、输入文案和媒体 URL、生成八语言翻译预览、立即或定时发布。
3. 每个 `postId + accountId` 生成幂等键；`POST /api/social/worker/run` 执行到期任务和重试。
4. 聚合收件箱由 API 桩生成评论与私信，可按平台过滤并回复文字、图片或视频 URL。
5. 日历内置情人节、Prime Day、感恩节、黑五、圣诞节，可按月份筛选并生成草稿。
6. 素材库记录图片、视频、文案和提示词；AI 文案目前是明确标注的占位实现。

## 生产接入边界

- Facebook 使用 Graph API；LinkedIn 使用 OAuth2 与 Marketing API；YouTube 使用 Google OAuth2 与 YouTube Data API。
- OAuth `state`、PKCE、回调域名、token 加密轮换、Webhook 签名与重放保护必须在生产启用。
- 平台能力和审核政策会上线前重新核对；Mock 成功不代表真实平台已授权。
