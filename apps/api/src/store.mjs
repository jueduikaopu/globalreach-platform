import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname} from 'node:path';
import {randomUUID} from 'node:crypto';

export class JsonStore {
  constructor(file) { this.file = file; this.state = {tenants: [], users: [], memberships: [], auditLogs: [], shops: [], products: [], orders: [], webhooks: [], insightFavorites: [], insightExports: [], quotaUsage: [], emailAccounts: [], emailCampaigns: [], emailMessages: [], emailEvents: [], emailSuppressions: [], emailAutomations: [], socialAccounts: [], socialPosts: [], socialMessages: [], socialReplies: [], socialAssets: []}; }
  async init() {
    try { this.state = JSON.parse(await readFile(this.file, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error;const legacy=this.file.replace('/创/','/%E5%88%9B/');try{this.state=JSON.parse(await readFile(legacy,'utf8'))}catch(legacyError){if(legacyError.code!=='ENOENT')throw legacyError}await this.persist(); }
    for(const key of ['tenants','users','memberships','auditLogs','shops','products','orders','webhooks','insightFavorites','insightExports','quotaUsage','emailAccounts','emailCampaigns','emailMessages','emailEvents','emailSuppressions','emailAutomations','socialAccounts','socialPosts','socialMessages','socialReplies','socialAssets'])this.state[key] ||= [];
  }
  async persist() { await mkdir(dirname(this.file), {recursive: true}); await writeFile(this.file, JSON.stringify(this.state, null, 2)); }
  findUserByEmail(email) { return this.state.users.find((u) => u.email === email.toLowerCase()); }
  async register({name, email, passwordHash, tenantName}) {
    const tenant = {id: randomUUID(), name: tenantName, slug: `tenant-${randomUUID().slice(0, 8)}`, createdAt: new Date().toISOString()};
    const user = {id: randomUUID(), name, email: email.toLowerCase(), passwordHash, createdAt: new Date().toISOString()};
    const membership = {id: randomUUID(), tenantId: tenant.id, userId: user.id, role: 'tenant_admin'};
    this.state.tenants.push(tenant); this.state.users.push(user); this.state.memberships.push(membership);
    await this.audit(tenant.id, user.id, 'auth.register', {email: user.email});
    return {tenant, user, membership};
  }
  membership(userId, tenantId) { return this.state.memberships.find((m) => m.userId === userId && m.tenantId === tenantId); }
  tenant(tenantId) { return this.state.tenants.find((t) => t.id === tenantId); }
  shops(tenantId) { return this.state.shops.filter((s)=>s.tenantId===tenantId); }
  shop(id,tenantId) { return this.state.shops.find((s)=>s.id===id&&s.tenantId===tenantId); }
  async createShop({tenantId,userId,name,slug,template}) { if(this.state.shops.some(s=>s.slug===slug))throw Object.assign(new Error('SLUG_EXISTS'),{status:409});const shop={id:randomUUID(),tenantId,name,slug,subdomain:`${slug}.shops.local`,customDomain:null,status:'draft',version:1,draft:structuredClone(template),published:null,createdAt:new Date().toISOString()};this.state.shops.push(shop);await this.audit(tenantId,userId,'shop.create',{shopId:shop.id,templateId:template.id});return shop; }
  async saveShop({shop,userId,draft}) { shop.draft=draft;shop.version++;shop.status='draft';shop.updatedAt=new Date().toISOString();await this.audit(shop.tenantId,userId,'theme.save',{shopId:shop.id,version:shop.version});return shop; }
  async publishShop({shop,userId,result}) { shop.published=structuredClone(shop.draft);shop.status='published';shop.publishedAt=new Date().toISOString();shop.publishResult=result;await this.audit(shop.tenantId,userId,'theme.publish',{shopId:shop.id,version:shop.version});return shop; }
  async bindDomain({shop,userId,domain}) { shop.customDomain=domain;shop.domainStatus='pending_dns';await this.audit(shop.tenantId,userId,'domain.bind',{shopId:shop.id,domain});return shop; }
  products(shopId,tenantId){return this.state.products.filter(p=>p.shopId===shopId&&p.tenantId===tenantId);}
  async createProduct({shop,userId,input}){const product={id:randomUUID(),tenantId:shop.tenantId,shopId:shop.id,sku:input.sku,title:input.title||{},description:input.description||{},images:input.images||[],variants:input.variants||[],priceMinor:Number(input.priceMinor||0),currency:input.currency||'USD',status:'draft',createdAt:new Date().toISOString()};this.state.products.push(product);await this.audit(shop.tenantId,userId,'product.create',{shopId:shop.id,productId:product.id});return product;}
  orders(shopId,tenantId){return this.state.orders.filter(o=>o.shopId===shopId&&o.tenantId===tenantId);}
  async createOrder({shop,userId,input}){const order={id:randomUUID(),tenantId:shop.tenantId,shopId:shop.id,orderNo:`GR-${Date.now()}`,status:'pending',items:input.items||[],shipping:input.shipping||{},totalMinor:Number(input.totalMinor||0),currency:input.currency||'USD',createdAt:new Date().toISOString()};this.state.orders.push(order);await this.audit(shop.tenantId,userId,'order.create',{orderId:order.id});return order;}
  async transitionOrder({order,userId,status}){const allowed={pending:['paid','cancelled'],paid:['fulfilled','refunded'],fulfilled:['refunded'],cancelled:[],refunded:[]};if(!allowed[order.status]?.includes(status))throw Object.assign(new Error('INVALID_ORDER_TRANSITION'),{status:409});order.status=status;order.updatedAt=new Date().toISOString();await this.audit(order.tenantId,userId,'order.transition',{orderId:order.id,status});return order;}
  consumeQuota({tenantId,userId,type,limit}){const day=new Date().toISOString().slice(0,10);let usage=this.state.quotaUsage.find(x=>x.tenantId===tenantId&&x.userId===userId&&x.type===type&&x.day===day);if(!usage){usage={tenantId,userId,type,day,count:0};this.state.quotaUsage.push(usage)}if(usage.count>=limit)throw Object.assign(new Error('QUOTA_EXCEEDED'),{status:429});usage.count++;return{used:usage.count,limit,remaining:limit-usage.count};}
  async audit(tenantId, actorId, action, metadata = {}) {
    this.state.auditLogs.push({id: randomUUID(), tenantId, actorId, action, metadata, createdAt: new Date().toISOString()});
    await this.persist();
  }
}
