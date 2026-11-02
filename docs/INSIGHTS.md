# 全球商机洞察模块

## 数据边界

本地数据明确标记 `mock:true`，默认生成210个国家/地区、5000种产品、320家采购商和8000笔贸易记录，用于验证产品流程，不是商业海关数据覆盖证明。生产接入必须取得供应商授权及国家、字段、历史跨度、更新频率和再分发权清单。

```bash
COUNTRIES=210 PRODUCTS=5000 BUYERS=1000 TRADES=100000 npm run insights:generate
```

## 查询与分析

- `/api/insights/search` 支持 `keyword`、6位或前缀 `hsCode`、模糊 `company`，结果返回安全高亮、分页、采购额、采购权占比、频率、提单数和聚合维度。
- `/api/insights/buyers/{id}` 返回公司简介、地址、电话、网站、员工规模、类目、24个月趋势、贸易伙伴及提单。
- 生产OpenSearch映射位于 `infra/opensearch/insights-index.json`；产品名全文检索、HS keyword前缀和公司名text/asciifolding分别建模。
- ClickHouse表及采购商月度、国家产品月度物化视图位于 `infra/clickhouse/insights.sql`。

前端图表接口与ECharts数据结构兼容；当前零依赖版本使用本地SVG/HTML条形图，保证离线可演示。生产引入ECharts后只需替换 `charts.js` 渲染器，API数据无需改变。

## 导入与断点续跑

CSV首行须为字段名，支持RFC风格引号和双引号转义；JSON支持数组或 `{records:[]}`；NDJSON逐行读取。每批默认1000行，checkpoint记录sourceId、已读取行号、累计导入量和最后更新时间。

```bash
BATCH_SIZE=1000 npm run insights:import -- ./data/trades.csv customs-vendor-a
npm run insights:import -- ./data/trades.csv customs-vendor-a   # 从checkpoint继续
npm run insights:update                                       # 模拟增量供应商游标
```

生产定时配置示例在 `infra/cron/insights-update.cron`。多副本部署需用Redis或数据库advisory lock防止重复执行。导入后应通过Kafka批量写ClickHouse，并以CDC更新OpenSearch。

## 收藏、导出和配额

收藏按租户和用户隔离。默认每用户每天100次查询、20次导出；超额返回429。导出任务具备queued/processing/completed数据结构，本地小数据集同步生成后返回202，生产worker应异步处理并将CSV写入对象存储。

CSV使用UTF-8 BOM、CRLF、中文规范列名和RFC双引号转义，Excel可直接打开。导出记录只允许任务所属租户和用户下载。

## 验收入口

登录后访问 `/admin/insights.html`。推荐分别测试：关键词 `lithium`、HS编码 `850760`、公司名 `Global`；选择结果后执行批量收藏和导出，再进入采购商详情查看24个月趋势与提单。
