# 海外独立站构建模块

## 可运行流程

1. 登录后访问 `/admin/templates.html`，按类目或关键词检索 400 条模板目录。
2. 选择前 10 套完整模板之一，填写店铺名称和 slug 创建租户内店铺。
3. 编辑器支持新增、删除、HTML5 拖拽排序、撤销/重做、颜色/字体/Logo 调整和桌面/390px 手机预览。
4. 切换 en/es/ru/ja/de/fr/pt/ar，预览字典翻译；生产可在相同接口后接翻译引擎并保留人工审核状态。
5. 保存草稿后发布，服务端为八种语言逐一生成 `index.html`、共享响应式 CSS、`robots.txt` 和 `sitemap.xml`。
6. 发布结果通过 `/sites/{slug}/{locale}/` 访问；状态从 draft 变为 published，并保留发布版本信息。

## 模板资源口径

`packages/templates/src/catalog.mjs` 生成 400 条目录：8 类目，每条包含 id、name、category、thumbnail、响应式和语言能力。前 10 条包含完整 theme、SEO、social 与 sections JSON；其余 390 条是明确标注的目录占位，不冒充完整设计稿。

批量导入格式：

```json
{
  "version": "template-json-v1",
  "id": "vendor-template-001",
  "name": "Template name",
  "category": "家居",
  "theme": {"primary":"#17324d","accent":"#f5c86a","background":"#fff","font":"Inter","logo":"Brand"},
  "seo": {"title":"Title","description":"Description"},
  "sections": [{"id":"hero","type":"hero","props":{"title":"Headline"}}]
}
```

允许的 section type：hero、carousel、product-grid、video、image-text、form、payment、social、chat、footer。导入生产库前应执行 schema 校验、图片版权与恶意 URL 检查。

## SEO 与即时通讯

导出器生成 title、description、Open Graph、canonical、JSON-LD OnlineStore、viewport、robots 和 sitemap。WhatsApp 使用 `wa.me`，Messenger 使用 `m.me`，Skype 使用 URI scheme；`POST /api/webhooks/{whatsapp|messenger|skype}` 是无凭证环境的接收桩，只记录 mock 事件，不声称已通过平台审核。

`POST /api/shops/{id}/submit-sitemap` 返回 mock 提交任务；接入 Google Search Console API 凭证后才可作为真实提交证据。

## 尚未覆盖

400 套中只有 10 套为完整示例，其余按需求使用目录占位；真实支付、域名 DNS 自动校验、翻译供应商、社媒官方 OAuth 和物流承运商仍需外部账号。本阶段已提供自有域名 CNAME 指引接口、产品多图/多规格/多语言字段和订单 `pending → paid → fulfilled/refunded` 状态机，但未操作真实 DNS 或真实扣款。
