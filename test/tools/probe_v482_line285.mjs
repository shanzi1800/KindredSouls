// V482 定点探针: 生产端第 285 行「你的射手座月亮第9宫」在新代码下能否被纠?
// 用法: PATH=<swisseph venv>:$PATH node test/tools/probe_v482_line285.mjs
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
  'lockYearlyTransitSigns', '_v482SignAdjacent', '_v432FindHouse', '_v432AllSignWords', '_v432Signs',
  '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS', '_V432_EN2LOC',
  '_V432_ZH_NUM', '_V432_ES_ORD', '_V432_ES_ORD_FORMAT', '_v432Esc', '_v479IsMonthTitleLine',
  '_V482_FWD_BREAK', '_V482_FWD_CONJ', '_V482_TRANSIT_KEYS', '_V482_TVERB', '_V478_EN_MONTHS', '_V478_ORD_ZH',
  '_v444Signs', '_v444Esc', 'SUN_SIGN_EN'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { map.delete(n); } }
const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext([...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map(e => e[1]).join('\n\n')
  + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
const F = ctx.__exports;

const M = await getAstroMatrix('1999-12-15', '14:30', 69.6492, 18.9553, 'Europe/Oslo');
const prod = fs.readFileSync('/tmp/ks1999_v482_e2e.txt', 'utf8');
const line285 = prod.split('\n').find(l => l.includes('射手座月亮')) || '';
console.log('=== 生产端原句 ===');
console.log(line285);

const cases = [
  ['整行原文', line285],
  ['最小句', '你的射手座月亮第9宫赋予你灵性和远方的视野。'],
  ['带"在"变体', '你的射手座月亮在第9宫赋予你灵性和远方的视野。'],
  ['前句是太阳', '你的射手座太阳第6宫赋予你强大的学习和表达能力，你的射手座月亮第9宫赋予你灵性和远方的视野。'],
];
for (const [label, t] of cases) {
  console.log(`\n--- ${label} ---`);
  const a = F._v432LockNatal(t, 'zh', M);
  const b = F.applyTruthLocksEnEsZh(t, 'zh', M);
  console.log('  _v432LockNatal :', a);
  console.log('  applyTruthLocks:', b);
  console.log('  ❯ 残留「射手座月亮」:', /射手座月亮/.test(b), '| 含「双鱼座月亮」:', /双鱼座月亮/.test(b));
}
