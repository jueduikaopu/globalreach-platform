export class TokenBucketLimiter {
  constructor({capacity=120, refillPerSecond=60, metrics}={}) { this.capacity=capacity;this.refillPerSecond=refillPerSecond;this.metrics=metrics;this.buckets=new Map(); }
  take(key, cost=1) { const now=Date.now();const old=this.buckets.get(key)||{tokens:this.capacity,at:now};const tokens=Math.min(this.capacity,old.tokens+(now-old.at)/1000*this.refillPerSecond);const allowed=tokens>=cost;this.buckets.set(key,{tokens:allowed?tokens-cost:tokens,at:now});if(!allowed)this.metrics?.inc('rate_limit_rejections_total');return {allowed,remaining:Math.floor(tokens)}; }
}

export class CircuitBreaker {
  constructor({failureThreshold=5, resetAfterMs=15000, timeoutMs=2000, metrics}={}) { Object.assign(this,{failureThreshold,resetAfterMs,timeoutMs,metrics});this.state='CLOSED';this.failures=0;this.openedAt=0; }
  async execute(operation) {
    if(this.state==='OPEN'){if(Date.now()-this.openedAt<this.resetAfterMs){this.metrics?.inc('circuit_rejections_total');throw Object.assign(new Error('CIRCUIT_OPEN'),{status:503})}this.state='HALF_OPEN'}
    let timer;try{const result=await Promise.race([operation(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('UPSTREAM_TIMEOUT')),this.timeoutMs)})]);clearTimeout(timer);this.failures=0;this.state='CLOSED';return result}
    catch(error){clearTimeout(timer);this.failures++;this.metrics?.inc('circuit_failures_total');if(this.failures>=this.failureThreshold){this.state='OPEN';this.openedAt=Date.now()}throw error}
  }
}
