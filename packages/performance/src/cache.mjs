import {createHash} from 'node:crypto';

export class BloomFilter {
  constructor(size = 1 << 18, hashes = 5) { this.size = size; this.hashes = hashes; this.bits = new Uint8Array(Math.ceil(size / 8)); }
  indexes(key) { return Array.from({length:this.hashes}, (_,i) => Number(BigInt(`0x${createHash('sha256').update(`${i}:${key}`).digest('hex').slice(0,12)}`) % BigInt(this.size))); }
  add(key) { for (const i of this.indexes(key)) this.bits[i >> 3] |= 1 << (i & 7); }
  has(key) { return this.indexes(key).every((i) => (this.bits[i >> 3] & (1 << (i & 7))) !== 0); }
}

export class MemoryCache {
  constructor() { this.items = new Map(); }
  async get(key) { const item=this.items.get(key); if(!item) return null; if(item.expiresAt<Date.now()){this.items.delete(key);return null} return item.value; }
  async set(key,value,ttlSeconds){this.items.set(key,{value,expiresAt:Date.now()+ttlSeconds*1000});}
  async del(key){this.items.delete(key);}
}

export class TieredCache {
  constructor({local = new MemoryCache(), remote = new MemoryCache(), bloom = new BloomFilter(), metrics}) { Object.assign(this,{local,remote,bloom,metrics}); }
  jitter(ttl) { return Math.max(1, Math.round(ttl * (0.85 + Math.random() * 0.3))); }
  async remember(key, loader, {ttl=60, nullTtl=10, known=false}={}) {
    const l1=await this.local.get(key); if(l1!==null){this.metrics?.inc('cache_hits_total',{tier:'l1'});return l1.__empty?null:l1}
    const l2=await this.remote.get(key); if(l2!==null){this.metrics?.inc('cache_hits_total',{tier:'l2'});await this.local.set(key,l2,this.jitter(Math.min(ttl,10)));return l2.__empty?null:l2}
    if (!known && this.bloom.has(`missing:${key}`)) { this.metrics?.inc('cache_negative_hits_total'); return null; }
    this.metrics?.inc('cache_misses_total'); const value=await loader();
    if(value==null){const empty={__empty:true};this.bloom.add(`missing:${key}`);await this.remote.set(key,empty,this.jitter(nullTtl));await this.local.set(key,empty,Math.min(nullTtl,5));return null}
    this.bloom.add(key);await this.remote.set(key,value,this.jitter(ttl));await this.local.set(key,value,this.jitter(Math.min(ttl,10)));return value;
  }
}
