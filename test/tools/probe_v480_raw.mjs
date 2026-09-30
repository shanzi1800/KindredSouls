// 对比「原始流 text」vs「终稿 sanitized」，定位 `# ` 空行注入点
import fs from 'node:fs';
const lang = process.argv[2] || 'zh';
const birthDate = process.argv[3] || '1989-08-15';
try { await fetch(`https://kindredsouls.online/api/clear-cache/${birthDate}/${lang}/yearly`); } catch {}

const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ birthDate, birthTime: '14:30', lat: '69.6492', lon: '18.9553', tz: 'Europe/Oslo', lang, reportType: 'yearly', nocache: true }),
});
let buf = '', raw = '', san = '';
const dec = new TextDecoder();
for await (const v of res.body) {
  buf += dec.decode(v, { stream: true });
  const ls = buf.split('\n'); buf = ls.pop() || '';
  for (const line of ls) {
    const t = line.trim(); if (!t.startsWith('data: ')) continue;
    const d = t.slice(6).trim(); if (d === '[DONE]') continue;
    try { const p = JSON.parse(d);
      if (p.text) raw = (raw && p.text.startsWith(raw)) ? p.text : raw + p.text;
      if (p.sanitized) san = p.sanitized; if (p.fixed && !san) san = p.fixed;
    } catch {}
  }
}
fs.writeFileSync(`/tmp/ks_raw_${lang}.txt`, raw);
fs.writeFileSync(`/tmp/ks_san_${lang}.txt`, san || raw);
const rawLines = raw.split('\n'), sanLines = (san || raw).split('\n');
console.log(`raw=${raw.length}字 ${rawLines.length}行 | san=${(san||raw).length}字 ${sanLines.length}行`);
const cnt = (arr, re) => arr.filter(l => re.test(l)).length;
console.log('raw  # 空行(^# *$):', cnt(rawLines, /^\s*#\s*$/));
console.log('san  # 空行(^# *$):', cnt(sanLines, /^\s*#\s*$/));
console.log('\n--- raw 前 60 行中所有含 # 的行 ---');
rawLines.slice(0, 200).forEach((l, i) => { if (/^\s*>?\s*#/.test(l)) console.log(String(i).padStart(3), JSON.stringify(l.slice(0, 90))); });
