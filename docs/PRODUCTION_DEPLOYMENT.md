# 生产部署手册

## 上线前置

1. 准备三个可用区的 Kubernetes 或等价容器平台、托管 PostgreSQL 主备、Redis Cluster、Kafka、ClickHouse、OpenSearch、S3 对象存储和 CDN/WAF。
2. 域名、TLS、邮件发信域名 SPF/DKIM/DMARC、社媒 OAuth 应用及海关数据商业授权全部完成审批。
3. 在密钥管理系统创建生产变量；严禁复制 `.env`、Mock 密钥或 `.data` 到镜像。
4. 数据库执行 `apps/api/db/migrations/001_init.sql` 至 `007_training_support.sql`，先预生产验证再生产变更。

## 构建与发布

```bash
npm ci
npm test
npm run check
npm run build
docker build -t registry.example.com/globalreach-api:$GIT_SHA .
docker push registry.example.com/globalreach-api:$GIT_SHA
kubectl set image deployment/globalreach-api api=registry.example.com/globalreach-api:$GIT_SHA
kubectl rollout status deployment/globalreach-api --timeout=10m
curl -fsS https://api.example.com/api/health
```

前端 `dist/web` 和 `dist/admin` 上传对象存储并由 CDN 分发；发布站点 `/sites/*` 使用独立桶与版本控制。API 至少 3 副本跨 AZ，无本地会话状态；HPA 建议 CPU 60%、内存 70% 或 P95 200ms 触发。先 5% 金丝雀 15 分钟，再 25%、50%、100%；错误率、P95 或业务成功率越阈值立即回滚上一镜像。

## 数据与容灾

- PostgreSQL：同城同步主备、跨区异步副本；每周全量、WAL 连续归档、每日恢复校验。
- Redis/Kafka/ClickHouse：至少 3 节点并跨 AZ；Kafka 关键 Topic 副本 3、`min.insync.replicas=2`。
- S3：版本控制、对象锁（审计/结算资料）、跨区复制；CDN 回源使用私有身份。
- 每月组件切换、每季度全恢复、每半年区域级演练；重大故障按 `docs/INFRASTRUCTURE.md` 的 60/120 分钟 RTO 执行。

## 上线检查与回滚

```bash
TARGET_URL=https://staging.example.com npm run e2e
TARGET_URL=https://staging.example.com npm run security-scan
TARGET_URL=https://staging.example.com REQUESTS=5000 CONCURRENCY=100 npm run load-test
```

检查健康、指标、日志脱敏、队列积压、备份、告警、配额、域名、8 语言页面、sitemap。回滚只切换应用镜像；数据库迁移必须使用向前兼容的 expand/migrate/contract，禁止在同一发布中直接删除旧列。
