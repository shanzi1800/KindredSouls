// 通用年报抓取（流式），用于跨盘真值取证
// 用法: node test/tools/fetch_yearly_stream.mjs <outFile> <birth> <time> <lat> <lon> <tz> [top|noguru]
import fs from 'node:fs';

const [out, birthDate, birthTime, lat, lon, tz] = process.argv.slice(2);
if (!out) { console.error('用法: node fetch_yearly_stream.mjs <outFile> <birth> <time> <lat> <lon> <tz>'); process.exit(1); }

const dec = new TextDecoder('utf-8');
console.log(`→ 请求 ${birthDate} ${birthTime} @ ${lat},${lon} ${tz}`);
const t0 = Date.now();
const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ birthDate, birthTime, lat, lon, tz, lang: 'zh', reportType: 'yearly', nocache: true }),
  signal: AbortSignal.timeout(900000),
});
console.log(`← HTTP ${res.status} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);

let raw = '';
for await (const v of res.body) raw += dec.decode(v, { stream: true });
fs.writeFileSync(out + '.raw', raw);

let best = '';
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t.startsWith('data:')) continue;
  const p = t.slice(5).trim();
  if (!p || p === '[DONE]') continue;
  let d; try { d = JSON.parse(p); } catch { continue; }
  for (const k of ['sanitized', 'text', 'content', 'full', 'report', 'cleaned', 'accumulated']) {
    const v = d[k];
    if (typeof v === 'string' && v.length > best.length) best = v;
  }
}
fs.writeFileSync(out, best);
console.log(`产物 ${best.length} 字 → ${out}`);
console.log(`月标题 ${(best.match(/^#{1,6}\s*\d{4}年\d{1,2}月/gm) || []).length} 条`);
