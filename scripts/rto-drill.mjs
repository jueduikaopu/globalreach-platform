import {mkdir,writeFile} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import {dirname,resolve} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');const reportDir=resolve(root,'reports/rto');await mkdir(reportDir,{recursive:true});
const execute=process.env.RTO_EXECUTE==='1';const stamp=new Date().toISOString().replaceAll(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');const started=Date.now();let health='dry-run',backup='dry-run',restore='dry-run';
const compose=process.env.COMPOSE_FILE||resolve(root,'infra/docker-compose.yml');
function run(args){const r=spawnSync('docker',['compose','-f',compose,'exec','-T','postgres',...args],{stdio:'inherit'});if(r.status!==0)throw new Error(`docker compose command failed: ${args[0]}`)}
if(execute){run(['pg_isready','-U','globalreach','-d','globalreach']);health='passed';run(['pg_dump','-U','globalreach','-d','globalreach','-Fc','-f','/tmp/rto.dump']);backup='passed';run(['pg_restore','-U','globalreach','-d','globalreach','--list','/tmp/rto.dump']);restore='validated'}
const elapsed=((Date.now()-started)/1000).toFixed(1);const report=`# GlobalReach RTO 演练记录

- 演练时间（UTC）：${stamp}
- 模式：${execute?'execute':'dry-run'}
- 数据库健康检查：${health}
- 备份生成：${backup}
- 恢复清单校验：${restore}
- 实测用时：${elapsed}s
- 服务 RTO 目标：≤60min
- 核心系统重大故障 RTO 目标：≤120min
- 结论：${execute?'本地组件演练完成；生产仍需跨可用区切换和数据一致性验证':'模板与命令链可执行；未对运行中数据库实施切换'}

## 人工记录

- 故障注入：
- 告警时间：
- 宣告时间：
- 切换/恢复时间：
- 数据一致性抽检：
- 回切结果：
- 问题与整改负责人：
`;
const path=resolve(reportDir,`rto-drill-${stamp}.md`);await writeFile(path,report);console.log(path);
