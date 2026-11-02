import {cp, mkdir, rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url);const dist=new URL('../dist/',import.meta.url);
await rm(dist,{recursive:true,force:true});await mkdir(dist,{recursive:true});
await cp(new URL('apps/web/public/',root),new URL('web/',dist),{recursive:true});
await cp(new URL('apps/admin/public/',root),new URL('admin/',dist),{recursive:true});
console.log('Built pre-rendered static assets: dist/web and dist/admin');
