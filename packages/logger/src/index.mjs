const redact = (value) => JSON.parse(JSON.stringify(value, (key, item) =>
  /password|token|secret|authorization/i.test(key) ? '[REDACTED]' : item));
export function log(level, message, context = {}) {
  const rank={debug:10,info:20,warn:30,error:40};if((rank[level]||20)<(rank[process.env.LOG_LEVEL]||20))return;
  process.stdout.write(`${JSON.stringify({timestamp: new Date().toISOString(), level, message, ...redact(context)})}\n`);
}
