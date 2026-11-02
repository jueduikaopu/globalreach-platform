import {archivePartition} from '../apps/api/src/archive.mjs';
const [sourceFile,bucketDirectory]=process.argv.slice(2);if(!sourceFile||!bucketDirectory)throw new Error('Usage: node scripts/archive-events.mjs <events.ndjson> <object-store-directory>');
console.log(JSON.stringify(await archivePartition({sourceFile,bucketDirectory}),null,2));
