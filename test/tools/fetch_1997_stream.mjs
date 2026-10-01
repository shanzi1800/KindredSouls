// 抓取 1997-10-18 盘的线上年报【流式】全文（模拟前端 free_access 路径）
import fs from 'node:fs';
const birthDate = '1997-10-18', birthTime = '14:30', lat = '69.6492', lon = '18.9553', tz = 'Europe/Oslo', lang = 'zh';
const dec = new TextDecoder('utf-8');
console.log('→ 请求流式 /api/wealth-oracle/stream (yearly, nocache)...');
const t0 = Date.now();
const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ birthDate, birthTime, lat, lon, tz, lang, reportType: 'yearly', nocache: true }),
  signal: AbortSignal.timeout(600000),
});
let raw = '';
for await (const v of res.body) raw += dec.decode(v, { stream: true });
fs.writeFileSync('/tmp/ks1997_stream_raw.txt', raw);
console.log(`← ${((Date.now() - t0) / 1000).toFixed(0)}s · raw ${raw.length} 字`);

// 解析 SSE：取最大文本帧（sanitized / done）
let best = '', types = {};
for (const line of raw.split('\n')) {
  const t = line.trim();
  if (!t.startsWith('data:')) continue;
  const p = t.slice(5).trim();
  if (!p || p === '[DONE]') continue;
  let d; try { d = JSON.parse(p); } catch { continue; }
  types[d.type || '(none)'] = (types[d.type || '(none)'] || 0) + 1;
  for (const k of ['text', 'content', 'full', 'report', 'sanitized', 'accumulated']) {
    const v = d[k]; if (typeof v === 'string' && v.length > best.length) best = v;
  }
}
console.log('事件类型:', JSON.stringify(types));
fs.writeFileSync('/tmp/ks1997_stream_final.txt', best);
console.log(`final ${best.length} 字 → /tmp/ks1997_stream_final.txt`);
