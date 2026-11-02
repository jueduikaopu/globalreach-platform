import {createHmac, randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';

const b64 = (value) => Buffer.from(value).toString('base64url');
export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(':');
  const actual = scryptSync(password, salt, 64);
  const target = Buffer.from(expected, 'hex');
  return actual.length === target.length && timingSafeEqual(actual, target);
}
export function signToken(payload, secret, ttlSeconds = 3600) {
  const header = b64(JSON.stringify({alg: 'HS256', typ: 'JWT'}));
  const body = b64(JSON.stringify({...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds}));
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}
export function verifyToken(token, secret) {
  const [header, body, signature] = String(token || '').split('.');
  if (!header || !body || !signature) throw new Error('INVALID_TOKEN');
  const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('INVALID_TOKEN');
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (payload.exp < Date.now() / 1000) throw new Error('TOKEN_EXPIRED');
  return payload;
}
export function can(role, permission) {
  const grants = {
    platform_admin: ['*'], tenant_admin: ['tenant:read', 'tenant:write', 'member:write', 'store:write'],
    teacher: ['tenant:read', 'training:write', 'ticket:write'], student: ['tenant:read', 'store:write'],
    crm_manager: ['tenant:read', 'crm:read_all', 'crm:write'], sales: ['tenant:read', 'crm:read_own', 'crm:write'],
    operator: ['tenant:read', 'store:write', 'crm:read_own', 'crm:write'], viewer: ['tenant:read']
  };
  return grants[role]?.includes('*') || grants[role]?.includes(permission);
}
