import {createGzip} from 'node:zlib';import {createReadStream,createWriteStream} from 'node:fs';import {mkdir,rename,stat} from 'node:fs/promises';import {dirname,join} from 'node:path';import {pipeline} from 'node:stream/promises';

export const partitionKey=(date=new Date())=>`year=${date.getUTCFullYear()}/month=${String(date.getUTCMonth()+1).padStart(2,'0')}/day=${String(date.getUTCDate()).padStart(2,'0')}/hour=${String(date.getUTCHours()).padStart(2,'0')}`;
export async function archivePartition({sourceFile,bucketDirectory,namespace='events',date=new Date()}){
  const target=join(bucketDirectory,namespace,partitionKey(date),`${Date.now()}.ndjson.gz`);await mkdir(dirname(target),{recursive:true});const temporary=`${target}.partial`;
  await pipeline(createReadStream(sourceFile),createGzip({level:6}),createWriteStream(temporary));await rename(temporary,target);const info=await stat(target);return {target,bytes:info.size,contentEncoding:'gzip',storageClass:'warm'};
}
export function capacityProjection({currentBytes,dailyGrowthBytes,years=3,reserveRatio=.2}){const projected=currentBytes*(1+reserveRatio)+dailyGrowthBytes*365*years;return {projectedBytes:projected,alert:currentBytes>0&&projected/currentBytes>=1.8};}
