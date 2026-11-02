import {capacityProjection} from '../apps/api/src/archive.mjs';
const currentTb=Number(process.argv[2]||0),dailyTb=Number(process.argv[3]||10),years=Number(process.argv[4]||3);const TB=1e12;
const r=capacityProjection({currentBytes:currentTb*TB,dailyGrowthBytes:dailyTb*TB,years});const requiredTb=r.projectedBytes/TB;
console.log(JSON.stringify({currentTb,dailyGrowthTb:dailyTb,years,reserveRatio:.2,requiredTb,warning:requiredTb>currentTb*1.8},null,2));
if(currentTb && requiredTb>currentTb*1.8)process.exitCode=2;
