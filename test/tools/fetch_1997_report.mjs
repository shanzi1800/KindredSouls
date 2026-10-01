// 抓取 1997-10-18 盘的线上年报全文（供 V485 质检用）
import fs from 'node:fs';
const birthDate = '1997-10-18', birthTime = '14:30', lat = '69.6492', lon = '18.9553', tz = 'Europe/Oslo', lang = 'zh';
console.log('→ 请求非流式 /api/wealth-oracle (yearly, nocache)...');
const t0 = Date.now();
const res = await fetch('https://kindredsouls.online/api/wealth-oracle', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ birthDate, birthTime, lat, lon, tz, lang, reportType: 'yearly', nocache: true }),
  signal: AbortSignal.timeout(600000),
});
const body = await res.text();
console.log(`← HTTP ${res.status} · ${((Date.now() - t0) / 1000).toFixed(0)}s · ${body.length}B`);
let d;
try { d = JSON.parse(body); } catch { console.log('非 JSON:', body.slice(0, 300)); process.exit(1); }
const report = d.report || '';
fs.writeFileSync('/tmp/ks1997_full.txt', report);
console.log(`report ${report.length} 字 → /tmp/ks1997_full.txt · success=${d.success} cached=${d.cached}`);
