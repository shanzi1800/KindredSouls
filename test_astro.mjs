import { getAstroMatrix, buildFactSheet } from '/Users/apple/Desktop/kindredsouls开发工作日志/KindredSouls源代码/v69_client.js';

const matrix = await getAstroMatrix('1990-06-15', '14:30', 13.75, 100.5, 'Asia/Bangkok');
console.log('=== meta keys ===');
console.log('house_system_used:', matrix.meta.house_system_used);
console.log('house_system(meta):', matrix.meta.house_system);
console.log('natal_moon:', JSON.stringify(matrix.meta.natal_moon));
console.log('ascendant:', JSON.stringify(matrix.meta.ascendant));
console.log('midheaven:', JSON.stringify(matrix.meta.midheaven));
console.log('has house_cusps_full:', !!matrix.meta.house_cusps_full);
console.log('moon_ingress len:', matrix.meta.moon_ingress?.length);
console.log('moon_ingress Scorpio:', JSON.stringify((matrix.meta.moon_ingress||[]).filter(x=>x.to_sign==='Scorpio')));
console.log('first month Moon house:', matrix.months[0].moon?.house, '(should be Placidus-based)');

const fs = buildFactSheet(matrix, 'en');
console.log('\n=== FACT_SHEET contains NATAL CHART ANCHORS? ===', fs.includes('[NATAL CHART ANCHORS'));
console.log('=== FACT_SHEET contains Natal Moon line? ===', /Your Natal Moon:/.test(fs));
console.log('=== FACT_SHEET House Mapping line ===', fs.split('\n').find(l=>l.includes('House Mapping')));
console.log('=== FACT_SHEET House System line ===', fs.split('\n').find(l=>l.includes('House System:')));
console.log('\n=== NATAL CHART ANCHORS block ===');
console.log(fs.split('[NATAL CHART ANCHORS')[1]?.split(']')[1]?.split('── Monthly')[0]?.trim());
console.log('\n=== House Mapping block ===');
const hm = fs.split('House Mapping (')[1]?.split(') ──')[1]?.trim();
console.log(hm);
