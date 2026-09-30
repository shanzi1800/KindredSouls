// V479 定位探针：年报「月标题行」为何被补「本命」前缀
// 用法: node test/tools/probe_v479_natal_prefix.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { getAstroMatrix } from '../../v69_client.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

const SEEDS = ['applyTruthLocksEnEsZh', '_v432Normalize', '_v432LockNatal', '_v432LockTransit',
  '_v432AdjudicateDescriptors', '_v433LockMoonWeek', 'applyV434Locks', 'v426EnforceNatalRetrograde',
  '_v432Truth', '_v432TruthMatch', '_v432SlotOf', '_v432Clause', '_v432ClaimOf', '_v432PatchZone',
  'lockNatalAnchorRole', 'lockYearlyMonthTitles', '_v444Signs', '_v444Esc', 'SUN_SIGN_EN'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) {
  try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}: ${e.message.slice(0, 50)}`); map.delete(n); }
}
console.log(`已提取 ${map.size} 个声明${dropped.length ? `; 剔除 ${dropped.length} → ${dropped.join(' | ')}` : ''}`);
console.log(`缺失: ${SEEDS.filter(n => !map.has(n)).join(', ') || '无'}`);

const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext(
  [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map(e => e[1]).join('\n\n')
  + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'),
  ctx,
);
const F = ctx.__exports;

const M = await getAstroMatrix('1989-08-15', '14:30', 69.6492, 18.9553, 'Europe/Oslo');
console.log('本命太阳:', M?.meta?.sun_sign, '| asc:', M?.meta?.rising_sign);
const SIGNS_ZH = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const EN_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
console.log('months[i] 流月太阳:');
for (let i = 0; i < 12; i++) {
  const s = M?.months?.[i]?.sun;
  const d = new Date(Date.UTC(2026, 8 + i, 1));
  console.log(`  i=${i} ${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月 → ${s ? SIGNS_ZH[EN_SIGNS.indexOf(s.sign)] + ' 第' + s.house + '宫' : '(null)'}`);
}

// 模拟年报里 12 个月标题行（真实措辞；8 月=流月太阳狮子座第10宫，恰与本命太阳同值，是唯一被误补的那条）
const MK = (i) => { const d = new Date(Date.UTC(2026, 8 + i, 1)); return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月`; };
const ZH_OF = (i) => { const s = M?.months?.[i]?.sun; return s ? SIGNS_ZH[EN_SIGNS.indexOf(s.sign)] + ' 第' + s.house + '宫' : '?'; };
const tail = ['幕后布局', '王者归来', '财帛涌动', '沟通为王', '根基重塑', '创意涌动', '纪律为王', '合作共赢', '偏财涌动', '远方来财', '王者加冕', '收官'];
const lines = [];
for (let i = 0; i < 12; i++) lines.push(`### ${MK(i)}: 太阳${ZH_OF(i)} · ${tail[i]}`);
// 额外构造一行「LLM 原稿自带本命前缀」的行, 验证 lockYearlyMonthTitles 的兜底剥离
const withPrefix = lines.slice();
withPrefix[3] = withPrefix[3].replace('太阳', '你的太阳');

const show = (label, out) => {
  console.log(`\n--- ${label} ---`);
  for (const ln of out.split('\n')) console.log(ln + (ln.includes('本命') ? '   ← 含本命' : ''));
};

let t = lines.join('\n');
for (const [label, fn] of [
  ['_v432AdjudicateDescriptors(12行原稿)', (x) => F._v432AdjudicateDescriptors(x, 'zh', M)],
  ['_v432LockNatal', (x) => F._v432LockNatal(x, 'zh', M)],
  ['applyTruthLocksEnEsZh(yearly)', (x) => F.applyTruthLocksEnEsZh(x, 'zh', M, 'yearly')],
  ['lockYearlyMonthTitles', (x) => F.lockYearlyMonthTitles(x, 'zh', M, 'yearly')],
]) {
  try { const out = fn(t); show(label, out); t = out; } catch (e) { console.log(`✗ ${label} 抛出: ${e.message}`); }
}
console.log('\n===== 兜底剥离验证（原稿自带「你的太阳」前缀）=====');
try {
  const out = F.lockYearlyMonthTitles(withPrefix.join('\n'), 'zh', M, 'yearly');
  console.log(out.split('\n')[3]);
} catch (e) { console.log('✗ ' + e.message); }
