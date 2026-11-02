import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
const port=4300+Math.floor(Math.random()*500);process.env.PORT=String(port);process.env.DATA_FILE=join(await mkdtemp(join(tmpdir(),'globalreach-')),'db.json');process.env.JWT_SECRET='test-secret-at-least-32-characters-long';
const {server}=await import('../apps/api/src/server.mjs');const base=`http://127.0.0.1:${port}`;
async function post(path,data){return fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)})}
test('health, register, login and tenant-bound me',async(t)=>{t.after(()=>server.close());let r=await fetch(base+'/api/health');assert.equal(r.status,200);
 const identity={name:'测试管理员',tenantName:'示范院校',email:'admin@example.edu',password:'SafePass123!'};r=await post('/api/auth/register',identity);assert.equal(r.status,201);const registered=await r.json();assert.equal(registered.role,'tenant_admin');assert.ok(registered.token);
 r=await post('/api/auth/login',{email:identity.email,password:'wrong-password'});assert.equal(r.status,401);
 r=await post('/api/auth/login',{email:identity.email,password:identity.password});assert.equal(r.status,200);const logged=await r.json();
 r=await fetch(base+'/api/me',{headers:{authorization:`Bearer ${logged.token}`}});assert.equal(r.status,200);const me=await r.json();assert.equal(me.tenant.name,'示范院校');assert.equal(me.user.email,identity.email);
 r=await fetch(base+'/api/me');assert.equal(r.status,401);});
