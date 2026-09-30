// V482 临时探针: 删掉 _v432AdjudicateDescriptors B 类 _v482SignAdjacent 豁免后, 实际产出什么?
// 用法: node test/tools/probe_v482_injectB.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

const SEEDS = ['lockYearlyTransitSigns', 'lockYearlyMonthTitles', '_v482SignAdjacent', '_v432Clause',
  '_v432LockNatal', '_v432AdjudicateDescriptors', 'applyTruthLocksEnEsZh', '_v432Normalize', '_v432Truth',
  '_v432TruthMatch', '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse', '_v432AllSignWords',
  '_v432Signs', '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS', '_V432_EN2LOC',
  '_V432_ZH_NUM', '_V432_ES_ORD', '_V432_ES_ORD_FORMAT', '_v432Esc', '_v479IsMonthTitleLine', '_v432LockTransit',
  '_v433LockMoonWeek', 'applyV434Locks', 'v426EnforceNatalRetrograde', '_v444Signs', '_v444Esc',
  '_V482_FWD_BREAK', '_V482_FWD_CONJ', '_V482_TRANSIT_KEYS', '_V482_TVERB', '_V478_ORD_ZH', '_V478_EN_MONTHS',
  'forceSpaceHouseSanitizer', 'SUN_SIGN_EN'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);

function build(hack) {
  const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map(e => (hack && hack[e[0]] ? hack[e[0]] : e[1])).join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}

const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const CH = {
  Sun: { sign: 'Sagittarius', house: 6 }, Moon: { sign: 'Pisces', house: 9 }, Mercury: { sign: 'Sagittarius', house: 6 },
  Venus: { sign: 'Scorpio', house: 5 }, Mars: { sign: 'Aquarius', house: 8 }, Jupiter: { sign: 'Aries', house: 10, retrograde: true },
  Saturn: { sign: 'Taurus', house: 11, retrograde: true }, Uranus: { sign: 'Aquarius', house: 8 }, Neptune: { sign: 'Aquarius', house: 8 },
  Pluto: { sign: 'Sagittarius', house: 6 },
};
const months = Array.from({ length: 12 }, (_, i) => ({
  sun: { sign: SIGNS_EN[(5 + i) % 12], house: (i % 12) + 1 },
  mars: { sign: 'Cancer', house: 1 }, uranus: { sign: 'Gemini', house: 12 },
  jupiter: { sign: 'Leo', house: 2 }, saturn: { sign: 'Aries', house: 10 }, pluto: { sign: 'Aquarius', house: 8 },
  mercury: { sign: 'Sagittarius', house: 6 }, venus: { sign: 'Libra', house: 4 },
}));
months[2].mars = { sign: 'Leo', house: 2 };
months[2].sun = { sign: 'Scorpio', house: 5 };
months[6].sun = { sign: 'Pisces', house: 9 };
const M = { months, meta: { computed_houses: CH, sun_sign: 'Sagittarius', rising_sign: 'Cancer' } };

const CASES = [
  ['①漂移句(claim≠truth): 射手座月亮', '你的本命盘是一幅蓝图：射手座太阳在第6宫赋予你驱力；射手座月亮在第9宫让你汲取滋养。'],
  ['②真值句(claim=truth): 双鱼座月亮', '你的本命盘是一幅蓝图：射手座太阳在第6宫赋予你驱力；双鱼座月亮在第9宫让你汲取滋养。'],
  ['③最小真值句: 双鱼座月亮', '你的双鱼座月亮在第9宫让你汲取情感滋养。'],
];

const fnSrc = map.get('_v432AdjudicateDescriptors');
const degradedFn = fnSrc.replace(/\s*&&\s*!_v482SignAdjacent\(text,\s*lang,\s*m\.index\)/, '');
console.log('注入是否生效:', degradedFn !== fnSrc);
const clean = build({});
const G = build({ _v432AdjudicateDescriptors: degradedFn });

for (const [label, t] of CASES) {
  console.log(`\n========== ${label} ==========`);
  const a = clean._v432LockNatal(t, 'zh', M);
  const b = G._v432LockNatal(t, 'zh', M);
  console.log('  干净:', a);
  console.log('  注入:', b);
  console.log('  ❯ 注入后含「本命月亮」:', /本命月亮/.test(b), '| 干净含:', /本命月亮/.test(a));
}
