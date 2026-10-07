// ═══════════════════════════════════════════════════════════════════
// V482e 线上复验: 非流式 /api/wealth-oracle(yearly) 返回的正文必须
//   ① 恰好 12 条规范月标题 `### YYYY年M月: 太阳X座 第N宫`
//   ② 每条标题的星座+宫位 == SwissEph 真值(逐月比对)
//   ③ 零碾碎残渣(`年undefined月` / `月:20xx` / `年20xx月:`)
//   ④ 不得再报 `lang is not defined`
// 用法: PATH=<swisseph venv>:$PATH node test/tools/verify_v482e_sync.mjs
// ═══════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import { getAstroMatrix } from '../../v69_client.js';

const birthDate = '1999-12-15', birthTime = '14:30', lat = '69.6492', lon = '18.9553', tz = 'Europe/Oslo', lang = 'zh';

console.log('→ 请求非流式 /api/wealth-oracle (yearly, nocache)...');
const t0 = Date.now();
const res = await fetch('https://kindredsouls.online/api/wealth-oracle', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ free_access: 1, ...({ birthDate, birthTime, lat, lon, tz, lang, reportType: 'yearly', nocache: true }) }),
  signal: AbortSignal.timeout(420000),
});
const txtBody = await res.text();
console.log(`← HTTP ${res.status} · ${((Date.now() - t0) / 1000).toFixed(0)}s · ${txtBody.length}B`);
let d;
try { d = JSON.parse(txtBody); } catch { console.log('非 JSON 响应:', txtBody.slice(0, 300)); process.exit(1); }

const fail = [];
const ok = (c, m) => { console.log(`  ${c ? '✅' : '❌'} ${m}`); if (!c) fail.push(m); };

console.log('\n=== 判据④ 不得再出现 lang is not defined ===');
// ⚠️ 断言文案必须写成「期望态」（ok() 在条件成立时打 ✅）—— 旧文案写成缺陷态会读成「✅ 仍报错」，误导判读。
ok(!/lang is not defined/.test(JSON.stringify(d)), '响应中不再出现 `lang is not defined`' +
  (d && d.success === false ? '（当前仍报错: ' + JSON.stringify(d).slice(0, 160) + '）' : ''));
ok(d && d.success === true, `接口 success 必须为 true, 实得 ${d && d.success}`);
ok(d && typeof d.report === 'string' && d.report.length > 2000, `report 正文长度必须 >2000, 实得 ${(d && d.report || '').length}`);

const report = d.report || '';
fs.writeFileSync('/tmp/ks_sync_v482e.txt', report);
console.log(`正文长度 ${report.length} 字 → /tmp/ks_sync_v482e.txt`);

console.log('\n=== 判据③ 零碾碎残渣 ===');
ok(!/年undefined月/.test(report), '不得出现 `年undefined月` 残渣');
ok(!/月:20\d{2}/.test(report), '不得出现 `月:20xx` 碾碎形态');
ok(!/年20\d{2}月:/.test(report), '不得出现 `年20xx月:` 碾碎形态');

console.log('\n=== 判据① 恰好 12 条规范月标题 ===');
const titleRe = /^###\s*(\d{4})年(\d{1,2})月:\s*太阳(.+?)座\s*第(\d+)宫/m;
const titles = report.split('\n').filter((l) => titleRe.test(l));
ok(titles.length === 12, `规范月标题应为 12 条, 实得 ${titles.length}`);
for (const t of titles) console.log('   ' + t.trim());

console.log('\n=== 判据② 逐月星座/宫位 == SwissEph 真值 ===');
const M = await getAstroMatrix(birthDate, birthTime, +lat, +lon, tz, { reportType: 'yearly' });   // 🛡️ V483: 年报走财年窗口
const months = (M && M.months) || [];
const EN2ZH = { Aries: '白羊', Taurus: '金牛', Gemini: '双子', Cancer: '巨蟹', Leo: '狮子', Virgo: '处女', Libra: '天秤', Scorpio: '天蝎', Sagittarius: '射手', Capricorn: '摩羯', Aquarius: '水瓶', Pisces: '双鱼' };
const truth = new Map();
for (const m of months) {
  const sun = m.sun || (m.positions && m.positions.Sun);
  if (!sun || !sun.sign) continue;
  const key = `${m.year || m.month_key?.slice(0, 4)}-${Number(m.month ?? m.month_key?.slice(5))}`;
  truth.set(key, { sign: EN2ZH[sun.sign] || sun.sign, house: Number(sun.house) || 0 });
}
let mism = 0;
for (const t of titles) {
  const m = t.match(titleRe);
  const key = `${m[1]}-${Number(m[2])}`;
  const tr = truth.get(key);
  if (!tr) { console.log(`   ⚠️ ${key} 真值缺失`); mism++; continue; }
  const good = m[3] === tr.sign && Number(m[4]) === tr.house;
  if (!good) { mism++; console.log(`   ❌ ${key}: 文中 太阳${m[3]}座第${m[4]}宫 vs 真值 太阳${tr.sign}座第${tr.house}宫`); }
}
ok(mism === 0, `逐月星座/宫位必须与 SwissEph 真值零矛盾, 实得 ${mism} 处`);

console.log('\n' + '='.repeat(60));
if (fail.length) { console.log('❌ V482e 线上复验未过:'); fail.forEach((f) => console.log('   - ' + f)); process.exit(1); }
console.log('✅ V482e 线上复验: 非流式 yearly 产物干净且逐月真值全对');
