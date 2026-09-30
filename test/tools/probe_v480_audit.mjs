// V480 三合一真值探针：① 标题层级混用 ② 英文词泄漏 ③ 头部 emoji 漂移
// 用法: node test/tools/probe_v480_audit.mjs [lang] [birthDate] [lat] [lon] [tz]
// 产出: 终稿落盘 /tmp/ks_prod_<lang>.txt（供 web 侧解析器直跑）
import fs from 'node:fs';

const lang = process.argv[2] || 'zh';
const birthDate = process.argv[3] || '1989-08-15';
const lat = process.argv[4] || '69.6492';
const lon = process.argv[5] || '18.9553';
const tz = process.argv[6] || 'Europe/Oslo';

try {
  const cr = await fetch(`https://kindredsouls.online/api/clear-cache/${birthDate}/${lang}/yearly`);
  console.log('clear-cache:', cr.status);
} catch (e) { console.log('clear-cache 失败(忽略):', e.message); }

const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ birthDate, birthTime: '14:30', lat, lon, tz, lang, reportType: 'yearly', nocache: true }),
});
let buf = '', full = '', sanitized = '';
const decoder = new TextDecoder();
for await (const value of res.body) {
  buf += decoder.decode(value, { stream: true });
  const lines = buf.split('\n');
  buf = lines.pop() || '';
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('data: ')) continue;
    const d = t.slice(6).trim();
    if (d === '[DONE]') continue;
    try {
      const p = JSON.parse(d);
      if (p.text) { if (full && p.text.startsWith(full)) full = p.text; else full += p.text; }
      if (p.sanitized) sanitized = p.sanitized;
      if (p.fixed && !sanitized) sanitized = p.fixed;
    } catch { /* ignore */ }
  }
}
const txt = sanitized || full;
fs.writeFileSync(`/tmp/ks_prod_${lang}.txt`, txt);
const lines = txt.split('\n');
console.log(`\n终稿 ${txt.length} 字 · lang=${lang} · 落盘 /tmp/ks_prod_${lang}.txt`);

// ── ① 标题层级直方图 + 全部标题行 ──
console.log('\n===== ① 标题层级直方图 =====');
const hist = {};
for (const ln of lines) {
  const m = ln.match(/^\s*(#{1,6})\s/);
  if (m) hist[m[1].length] = (hist[m[1].length] || 0) + 1;
}
console.log(JSON.stringify(hist), '（key = # 的个数）');
console.log('--- 全部标题行（含行首引用符）---');
for (const ln of lines) {
  if (/^\s*>?\s*#{1,6}\s/.test(ln)) console.log(ln.slice(0, 100));
}

// ── ② 拉丁字母 token 泄漏 ──
console.log('\n===== ② 拉丁字母 token 频次（≥2 字母）=====');
const freq = {};
for (const m of txt.matchAll(/[A-Za-z][A-Za-z'’\-]{1,}/g)) {
  const w = m[0];
  freq[w] = (freq[w] || 0) + 1;
}
const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30);
console.log(top.map(([w, n]) => `${w}×${n}`).join('  '));
console.log('--- 含拉丁词的行（前 12）---');
let n2 = 0;
for (const ln of lines) {
  if (/[A-Za-z]{2,}/.test(ln) && n2++ < 12) console.log('| ' + ln.trim().slice(0, 110));
}

// ── ③ 头部前 16 行（含不可见字符可视化）──
console.log('\n===== ③ 头部前 16 行 =====');
lines.slice(0, 16).forEach((ln, i) => {
  const vis = ln.replace(/\uFEFF/g, '<BOM>');
  console.log(`${String(i + 1).padStart(2)}| ${vis.slice(0, 110)}`);
});
const EMOJI_DROP = ['◇', '◆', '✦', '📅', '📊', '📕', '📌', '🔮'];
console.log('\n前端会剥除的符号出现次数:', EMOJI_DROP.map((e) => `${e}=${(txt.split(e).length - 1)}`).join(' '));
