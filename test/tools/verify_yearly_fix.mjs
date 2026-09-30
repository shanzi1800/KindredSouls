// V478 年报修复验证：跑「年报语义」清洗链，逐月比对标题 vs SwissEph 真值盘
// 用法: node test/tools/verify_yearly_fix.mjs /tmp/ks_raw.txt
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { getAstroMatrix } from '../../v69_client.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const fixture = process.argv[2] || '/tmp/ks_raw.txt';

const SEEDS = ['final_text_sanitizer', 'astro_phase_linter', 'natal_sun_linter', 'applyMonthLockSanitizer',
  'standardizeReport', 'applyV434Locks', 'lockNatalAnchorRole', 'lockTransitPlanetSigns',
  'applyTruthLocksEnEsZh', 'applyMoonWeekHardOverride', 'lockYearlyMonthTitles', '_v477Guard', '_v477CjkCount',
  '_v432Normalize', '_v432LockNatal', '_v432LockTransit', '_v433LockMoonWeek', 'v426EnforceNatalRetrograde'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { map.delete(n); } }
const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext(
  [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map(e => e[1]).join('\n\n')
  + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'),
  ctx,
);
const F = ctx.__exports;

const M = await getAstroMatrix('1989-08-15', '14:30', 69.6492, 18.9553, 'Europe/Oslo');
const asc = M?.meta?.rising_sign || 'Scorpio';
const sun = M?.meta?.sun_sign || 'Leo';
const ZH = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const EN2I = { Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5, Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11 };

// 应然：months[i] → 年份/月份/太阳星座/宫位（与 server.js lockedTitles 同算法，起始月=当前月 9 月）
const expect = M.months.map((m, i) => {
  const s = m.sun || (m.positions && m.positions.Sun) || {};
  const mi = 8 + i;
  return { y: 2026 + (mi >= 12 ? 1 : 0), mo: (mi % 12) + 1, sign: ZH[EN2I[s.sign]], house: Number(s.house) };
});

// ── 年报语义清洗链（V478: ⑦本命锚点锁、⑧流月锁、⑨c 流月锁 均已按 reportType 停用）──
const steps = [
  ['① final_text_sanitizer', (t) => F.final_text_sanitizer(t, asc, 'zh')],
  ['② astro_phase_linter', (t) => F.astro_phase_linter(t)],
  ['③ natal_sun_linter', (t) => F.natal_sun_linter(t, sun, asc)],
  ['④ applyMonthLockSanitizer', (t) => F.applyMonthLockSanitizer(t, M, null, null, 'zh')],
  ['⑤ standardizeReport', (t) => F.standardizeReport(t)],
  ['⑥ applyV434Locks', (t) => F.applyV434Locks(t, 'zh', M)],
  ['⑦ lockNatalAnchorRole(yearly→跳过)', (t) => F.lockNatalAnchorRole(t, 'zh', M, 'yearly')],
  ['⑧ lockTransitPlanetSigns(yearly→跳过)', (t) => F.lockTransitPlanetSigns(t, 'zh', M, 'yearly')],
  ['⑨ applyTruthLocksEnEsZh(yearly)', (t) => F.applyTruthLocksEnEsZh(t, 'zh', M, 'yearly')],
  ['⑩ applyMoonWeekHardOverride', (t) => F.applyMoonWeekHardOverride(t, 'zh', M)],
  ['⑪ lockYearlyMonthTitles(V478b)', (t) => F.lockYearlyMonthTitles(t, 'zh', M, 'yearly')],
];

let text = fs.readFileSync(fixture, 'utf8');
const before = text;
for (const [label, fn] of steps) {
  let out; try { out = fn(text); } catch (e) { console.log(`✗ ${label} 抛出: ${e.message}`); continue; }
  if (out !== text) console.log(`  → ${label}  len=${out.length} 座座=${(out.match(/座座/g) || []).length}`);
  text = out;
}

console.log('\n=== 逐月标题 vs 真值盘 ===');
const lines = text.split('\n');
let pass = 0;
for (const e of expect) {
  const prefix = `${e.y}年${e.mo}月`;
  const hits = lines.filter(l => /^#{1,6}\s/.test(l.trim()) && l.includes(prefix));
  const okSign = hits.some(l => l.includes(e.sign));
  const okHouse = hits.some(l => l.includes(`第${e.house}宫`) || l.includes(`第${['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'][e.house]}宫`));
  const head = (hits[0] || '(缺)').slice(0, 74);
  const bad = e.sign === '狮子座';
  console.log(`  ${okSign && okHouse ? '✅' : '❌'} ${prefix}  应然=${e.sign} 第${e.house}宫   实际: ${head}`);
  if (okSign && okHouse) pass++;
}
console.log(`\n月度标题真值命中: ${pass}/12`);
const bad2 = (text.match(/座座/g) || []).length;
console.log(`「座座」重字: ${bad2} 处`);
// 本命值污染检测：流年句被写成本命值（木星巨蟹/土星摩羯/冥王星天蝎 若出现在流年年份语境）
console.log(`\n原文 ${before.length} 字 → 终稿 ${text.length} 字`);
fs.writeFileSync('/tmp/ks_v478_out.txt', text);
console.log('终稿已写 /tmp/ks_v478_out.txt');
