const dialog=document.querySelector('#auth');const content=document.querySelector('#auth-content');
const field=(name,label,type='text')=>`<label>${label}</label><input required name="${name}" type="${type}" autocomplete="${name==='password'?'current-password':'on'}">`;
function render(mode){const register=mode==='register';content.innerHTML=`<form class="form"><h2>${register?'创建实训空间':'欢迎回来'}</h2><p>${register?'为学校或团队建立独立租户。':'登录你的 GlobalReach 工作台。'}</p>${register?field('name','姓名')+field('tenantName','学校 / 机构名称'):''}${field('email','工作邮箱','email')}${field('password','密码（至少 8 位）','password')}<p class="error" aria-live="polite"></p><button class="primary">${register?'注册并进入':'登录'}</button></form>`;dialog.showModal();
 content.querySelector('form').onsubmit=async(e)=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));const res=await fetch(`/api/auth/${mode}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const out=await res.json();if(!res.ok){content.querySelector('.error').textContent=out.error?.message||'请求失败';return}localStorage.setItem('gr_token',out.token);location.href='/admin';};}
document.querySelectorAll('[data-open]').forEach(x=>x.onclick=()=>render(x.dataset.open));

const vitals={page:location.pathname};
try{new PerformanceObserver((list)=>{const last=list.getEntries().at(-1);if(last)vitals.lcp=last.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch{}
try{new PerformanceObserver((list)=>{const e=list.getEntries().find(x=>x.interactionId);if(e)vitals.interaction=e.duration}).observe({type:'event',buffered:true,durationThreshold:40})}catch{}
addEventListener('load',()=>{const nav=performance.getEntriesByType('navigation')[0];vitals.ttfb=nav?.responseStart;setTimeout(()=>navigator.sendBeacon('/api/rum',new Blob([JSON.stringify(vitals)],{type:'application/json'})),1500)},{once:true});
