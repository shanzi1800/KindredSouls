// 抓 SSE 原始帧 + 统计字段长度（定位「最终全文」到底在哪个键）
import fs from 'node:fs';
const dec = new TextDecoder('utf-8');
const body = JSON.stringify({ birthDate: '1997-10-18', birthTime: '14:30', lat: '69.6492', lon: '18.9553', tz: 'Europe/Oslo', lang: 'zh', reportType: 'yearly', nocache: true });
const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(600000),
});
let raw = '';
for await (const v of res.body) raw += dec.decode(v, { stream: true });
fs.writeFileSync('/tmp/ks1997_v486_raw.txt', raw);
const types = {}, maxLen = {}, samples = {};
for (const line of raw.split('\n')) {
  const t = line.trim(); if (!t.startsWith('data:')) continue;
  const p = t.slice(5).trim(); if (!p || p === '[DONE]') continue;
  let d; try { d = JSON.parse(p); } catch { continue; }
  const ty = d.type || '(none)';
  types[ty] = (types[ty] || 0) + 1;
  for (const k of Object.keys(d)) {
    if (typeof d[k] === 'string') {
      if (!maxLen[k] || d[k].length > maxLen[k]) { maxLen[k] = d[k].length; samples[k] = d[k].slice(0, 60); }
    }
  }
}
console.log('raw SSE 字符数:', raw.length);
console.log('事件类型:', JSON.stringify(types));
console.log('各字符串字段最大长度:', JSON.stringify(maxLen));
console.log('样例:');
for (const k of Object.keys(maxLen)) console.log(`  ${k} (max ${maxLen[k]}): ${samples[k].replace(/\n/g, '⏎')}`);
