// 生产端真值核查：dump 年报全部「标题行」+ 含「太阳/本命」的行，用于比对 12 月标题措辞一致性
// 用法: node test/tools/probe_prod_titles.mjs [birthDate] [lat] [lon] [tz] [lang]
const birthDate = process.argv[2] || '1989-08-15';
const lat = process.argv[3] || '69.6492';
const lon = process.argv[4] || '18.9553';
const tz = process.argv[5] || 'Europe/Oslo';
const lang = process.argv[6] || 'zh';

// 先清缓存（否则命中旧稿）
try {
  const cr = await fetch(`https://kindredsouls.online/api/clear-cache/${birthDate}/${lang}/yearly`);
  console.log('clear-cache:', cr.status, await cr.text().catch(() => ''));
} catch (e) { console.log('clear-cache 失败(忽略):', e.message); }

const body = { birthDate, birthTime: '14:30', lat, lon, tz, lang, reportType: 'yearly', nocache: true };
const t0 = Date.now();
const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ free_access: 1, ...(body) }),
});
console.log('HTTP', res.status, res.headers.get('content-type'));

let buf = '', full = '', sanitized = '', chunks = 0, firstChunkMs = null;
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
      if (p.text) {
        chunks++;
        if (firstChunkMs === null) firstChunkMs = Date.now() - t0;
        if (full && p.text.startsWith(full)) full = p.text; else full += p.text;
      }
      if (p.sanitized) sanitized = p.sanitized;
      if (p.fixed && !sanitized) sanitized = p.fixed;
    } catch { /* ignore */ }
  }
}
const totalMs = Date.now() - t0;
const txt = sanitized || full;
console.log(`\n首块 ${firstChunkMs}ms | 总 ${totalMs}ms | 事件 ${chunks} | 终稿长度 ${txt.length}`);
console.log(`座座 出现次数: ${(txt.match(/座座/g) || []).length}`);

console.log('\n===== 全部标题行(#开头) =====');
for (const ln of txt.split('\n')) {
  const s = ln.trim();
  if (/^#{1,6}\s/.test(s)) console.log(s);
}
console.log('\n===== 含「太阳」的行 =====');
for (const ln of txt.split('\n')) {
  if (ln.includes('太阳')) console.log('| ' + ln.trim().slice(0, 120));
}
console.log('\n===== 含「本命」的行(前 20) =====');
let n = 0;
for (const ln of txt.split('\n')) {
  if (ln.includes('本命') && n++ < 20) console.log('| ' + ln.trim().slice(0, 120));
}
console.log(`\n本命 总出现次数: ${(txt.match(/本命/g) || []).length}`);
