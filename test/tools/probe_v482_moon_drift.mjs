// V482 定位探针：年报正文「射手座月亮」本命星座漂移 —— 锁为何没纠？
// 用法: node test/tools/probe_v482_moon_drift.mjs
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
  '_v432TransitClause', 'lockNatalAnchorRole', 'lockTransitPlanetSigns', 'lockYearlyMonthTitles',
  '_v444Signs', '_v444Esc', 'SUN_SIGN_EN'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
for (const n of [...map.keys()]) {
  try { new vm.Script(map.get(n)); } catch (e) { map.delete(n); }
}
const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext(
  [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map(e => e[1]).join('\n\n')
  + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'),
  ctx,
);
const F = ctx.__exports;

const M = await getAstroMatrix('1999-12-15', '14:30', 69.6492, 18.9553, 'Europe/Oslo');
const ch = M?.meta?.computed_houses || {};
console.log('=== 真值盘 (1999-12-15 特罗姆瑟) ===');
console.log('太阳:', ch.Sun?.sign, '第' + ch.Sun?.house + '宫',
  '| 月亮:', ch.Moon?.sign, '第' + ch.Moon?.house + '宫',
  '| 上升:', M?.meta?.rising_sign);
console.log('木星:', ch.Jupiter?.sign, '第' + ch.Jupiter?.house + '宫', ch.Jupiter?.retrograde ? '(逆行)' : '',
  '| 土星:', ch.Saturn?.sign, '第' + ch.Saturn?.house + '宫', ch.Saturn?.retrograde ? '(逆行)' : '',
  '| 冥王星:', ch.Pluto?.sign, '第' + ch.Pluto?.house + '宫');

// 报告原文（军师抓到的漂移段）
const DRIFT = '你的本命盘是一幅关于服务与超越的精密蓝图：射手座太阳在第6宫赋予你通过日常工作、技能精进与身体力行的服务来寻找生命意义的驱力；射手座月亮在第9宫让你在信仰、远行与高等智慧的海洋中汲取情感滋养；而巨蟹座上升则为你披上了一层温柔、保护性极强的外壳。';
// 对照组：同一句但带显式「本命」定语（锁应当能纠）
const WITH_MARK = '你的本命盘是一幅关于服务与超越的精密蓝图：本命射手座太阳在第6宫赋予你驱力；本命射手座月亮在第9宫让你在信仰中汲取情感滋养；而巨蟹座上升则为你披上外壳。';

const show = (label, out) => {
  console.log(`\n--- ${label} ---`);
  console.log(out);
  console.log('   ❯ 含「射手座月亮」:', out.includes('射手座月亮'),
    '| 含「双鱼座月亮」:', out.includes('双鱼座月亮'));
};

for (const [caseLabel, text] of [['A. 原文（无本命定语）', DRIFT], ['B. 对照（带本命定语）', WITH_MARK]]) {
  console.log(`\n========== ${caseLabel} ==========`);
  let t = text;
  show('输入', t);
  for (const [label, fn] of [
    ['_v432LockNatal', (x) => F._v432LockNatal(x, 'zh', M)],
    ['applyTruthLocksEnEsZh(yearly)', (x) => F.applyTruthLocksEnEsZh(x, 'zh', M, 'yearly')],
    ['lockNatalAnchorRole', (x) => F.lockNatalAnchorRole(x, 'zh', M, 'yearly')],
  ]) {
    try { const out = fn(t); show(label, out); t = out; } catch (e) { console.log(`✗ ${label} 抛出: ${e.message}`); }
  }
}
