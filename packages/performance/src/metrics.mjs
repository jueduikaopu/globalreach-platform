const labelString=(labels={})=>Object.keys(labels).length?`{${Object.entries(labels).map(([k,v])=>`${k}="${String(v).replaceAll('"','\\"')}"`).join(',')}}`:'';
export class Metrics {
  constructor(){this.counters=new Map();this.histograms=new Map();}
  inc(name,labels={},value=1){const key=`${name}${labelString(labels)}`;this.counters.set(key,(this.counters.get(key)||0)+value);}
  observe(name,value,labels={}){const key=`${name}${labelString(labels)}`;const h=this.histograms.get(key)||{count:0,sum:0,buckets:[0,0,0,0,0]};h.count++;h.sum+=value;[.05,.1,.3,1,3].forEach((b,i)=>{if(value<=b)h.buckets[i]++});this.histograms.set(key,h);}
  render(){const lines=['# GlobalReach Prometheus metrics'];for(const [k,v] of this.counters)lines.push(`${k} ${v}`);for(const [k,h] of this.histograms){const match=k.match(/^([^\{]+)(.*)$/);const [,name,labels]=match;[.05,.1,.3,1,3].forEach((b,i)=>lines.push(`${name}_bucket${labels?labels.slice(0,-1)+`,le="${b}"}`:`{le="${b}"}`} ${h.buckets[i]}`));lines.push(`${name}_count${labels} ${h.count}`,`${name}_sum${labels} ${h.sum}`)}return lines.join('\n')+'\n';}
}
