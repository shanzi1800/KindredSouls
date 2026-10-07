// V478 生产端真值核查：fresh 拉一次年报，逐月比对 SwissEph 真值盘
import fs from 'node:fs';
import { getAstroMatrix } from '../../v69_client.js';

const body = { birthDate: '1989-08-15', birthTime: '14:30', lat: '69.6492', lon: '18.9553', tz: 'Europe/Oslo', lang: 'zh', reportType: 'yearly' };
const t0 = Date.now();
const r = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ free_access: 1, ...(body) }),
});
if (!r.ok) { console.error('HTTP', r.status); process.exit(1); }
let buf = '', full = '', san = '', n = 0, firstAt = 0;
const dec = new TextDecoder();
for await (const v of r.body) {
  buf += dec.decode(v, { stream: true });
  const ls = buf.split('\n'); buf = ls.pop() || '';
  for (const l of ls) {
    const t = l.trim();
    if (!t.startsWith('data: ')) continue;
    const d = t.slice(6).trim();
    if (d === '[DONE]') continue;
    try {
      const p = JSON.parse(d); n++;
      if (!firstAt) firstAt = Date.now() - t0;
      if (p.text) { if (full && p.text.startsWith(full)) full = p.text; else if (!full.startsWith(p.text)) full += p.text; }
      if (p.sanitized) san = p.sanitized;
    } catch { }
  }
}
const txt = san || full;
fs.writeFileSync('/tmp/ks_v478_prod.txt', txt);
console.log(`耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s | 首块 ${(firstAt / 1000).toFixed(1)}s | 事件 ${n} | 长度 ${txt.length} | 来源: ${san ? 'sanitized' : '流式'}`);
console.log(`「座座」重字: ${(txt.match(/座座/g) || []).length} 处`);

const M = await getAstroMatrix('1989-08-15', '14:30', 69.6492, 18.9553, 'Europe/Oslo');
const ZH = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const EN2I = { Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5, Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11 };
const NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const lines = txt.split('\n');
let pass = 0;
console.log('\n=== 逐月标题 vs SwissEph 真值盘 ===');
M.months.forEach((m, i) => {
  const s = m.sun || (m.positions && m.positions.Sun) || {};
  const mi = 8 + i;
  const y = 2026 + (mi >= 12 ? 1 : 0), mo = (mi % 12) + 1;
  const sign = ZH[EN2I[s.sign]], house = Number(s.house);
  const hits = lines.filter(l => l.trim().startsWith('#') && l.includes(`${y}年${mo}月`));
  const okS = hits.some(l => l.includes(sign));
  const okH = hits.some(l => l.includes(`第${house}宫`) || l.includes(`第${NUM[house]}宫`));
  if (okS && okH) pass++;
  console.log(`  ${okS && okH ? '✅' : '❌'} ${y}年${mo}月 应然=${sign} 第${house}宫  →  ${(hits[0] || '(无标题行)').trim().slice(0, 72)}`);
});
console.log(`\n月度标题真值命中: ${pass}/12`);

console.log('\n=== 流年真值 vs 本命值污染 ===');
for (const p of ['木星狮子座', '木星巨蟹座', '土星白羊座', '土星摩羯座', '冥王星水瓶座', '冥王星天蝎座', '太阳在天秤座', '太阳在狮子座']) {
  const c = txt.split(p).length - 1;
  console.log(`  ${p} : ${c} 次`);
}
