// 年报「收尾清洗链」离线逐刀复现 —— 定位排版/真值被改坏的元凶
// 用法: node test/tools/harness_yearly_tail.mjs /tmp/ks_raw.txt
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { getAstroMatrix } from '../../v69_client.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const fixturePath = process.argv[2] || '/tmp/ks_raw.txt';

const SEEDS = ['final_text_sanitizer', 'astro_phase_linter', 'natal_sun_linter', 'applyMonthLockSanitizer',
  'standardizeReport', 'applyV434Locks', 'lockNatalAnchorRole', 'lockTransitPlanetSigns',
  'applyTruthLocksEnEsZh', 'applyMoonWeekHardOverride', '_v477Guard', '_v477CjkCount',
  // V432 内部子步骤（用于把 applyTruthLocksEnEsZh 拆开定位）
  '_v432Normalize', '_v432LockNatal', '_v432LockTransit', '_v433LockMoonWeek', 'v426EnforceNatalRetrograde'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) {
  try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}: ${e.message.slice(0, 40)}`); map.delete(n); }
}
console.log(`已提取 ${map.size} 个声明${dropped.length ? `; 剔除语法不完整 ${dropped.length} 个 → ${dropped.join(' | ')}` : ''}`);
console.log(`缺失(未提取到): ${SEEDS.filter(n => !map.has(n)).join(', ') || '无'}`);

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

let text = fs.readFileSync(fixturePath, 'utf8');
const SIGNS = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const sig = (s) => SIGNS.map(z => [z, s.split(z).length - 1]).filter(([, n]) => n).map(([z, n]) => `${z}:${n}`).join(' ');
const stat = (s) => `len=${s.length} 座座=${(s.match(/座座/g) || []).length} ####=${(s.match(/^#{4}\s/gm) || []).length} #=${(s.match(/^#\s/gm) || []).length} 第十一宫=${(s.match(/第十一宫/g) || []).length} 第11宫=${(s.match(/第11宫/g) || []).length}`;

const steps = [
  ['① final_text_sanitizer', (t) => F.final_text_sanitizer(t, asc, 'zh')],
  ['② astro_phase_linter', (t) => F.astro_phase_linter(t)],
  ['③ natal_sun_linter', (t) => F.natal_sun_linter(t, sun, asc)],
  ['④ applyMonthLockSanitizer', (t) => F.applyMonthLockSanitizer(t, M, null, null, 'zh')],
  ['⑤ standardizeReport', (t) => F.standardizeReport(t)],
  ['⑥ applyV434Locks', (t) => F.applyV434Locks(t, 'zh', M)],
  ['⑦ lockNatalAnchorRole', (t) => F.lockNatalAnchorRole(t, 'zh', M)],
  ['⑧ lockTransitPlanetSigns', (t) => F.lockTransitPlanetSigns(t, 'zh', M, 'yearly')],
  ['⑨a _v432Normalize', (t) => F._v432Normalize(t, 'zh')],
  ['⑨b _v432LockNatal', (t) => F._v432LockNatal(t, 'zh', M)],
  ['⑨c _v432LockTransit', (t) => F._v432LockTransit(t, 'zh', M)],
  ['⑨d _v433LockMoonWeek', (t) => F._v433LockMoonWeek(t, 'zh', M)],
  ['⑨e v426EnforceNatalRetrograde', (t) => F.v426EnforceNatalRetrograde(t, 'zh', M)],
  ['⑩ applyMoonWeekHardOverride', (t) => F.applyMoonWeekHardOverride(t, 'zh', M)],
];

console.log(`\n原文: ${text.length} 字`);
console.log('\n=== 逐刀效果 ===');
console.log(`  原始  ${stat(text)}`);
for (const [label, fn] of steps) {
  let out;
  try { out = fn(text); } catch (e) { console.log(`  ✗ ${label} 抛出: ${e.message}`); continue; }
  if (out === text) { console.log(`  = ${label} 无变化`); continue; }
  const before = text;
  console.log(`  → ${label}  ${stat(out)}`);
  const s0 = sig(before), s1 = sig(out);
  if (s0 !== s1) console.log(`      星座: ${s0}\n          → ${s1}`);
  for (const pat of [/座座/g, /第11宫/g, /第十一宫/g]) {
    const n0 = (before.match(pat) || []).length, n1 = (out.match(pat) || []).length;
    if (n1 > n0) { const ex = out.split('\n').find(l => pat.test(l)) || ''; console.log(`      ⚠️ ${pat.source} ${n0}→${n1} 例: ${ex.slice(0, 96)}`); }
  }
  // 🔍 座座注入前后精确对照（V478c 排查用）
  if (/座座/.test(out) && !/座座/.test(before)) {
    const ls0 = before.split('\n'), ls1 = out.split('\n');
    let shown = 0;
    for (let i = 0; i < ls1.length && shown < 4; i++) {
      if (/座座/.test(ls1[i]) && !/座座/.test(ls0[i] || '')) {
        console.log(`      🔴 L${i + 1} BEFORE: ${(ls0[i] || '').slice(0, 140)}`);
        console.log(`      🔴 L${i + 1} AFTER : ${ls1[i].slice(0, 140)}`);
        const k = ls1[i].indexOf('座座');
        console.log(`      🔴 座座处上下文: ...${ls1[i].slice(Math.max(0, k - 30), k + 30)}...`);
        shown++;
      }
    }
  }
  fs.writeFileSync(`/tmp/ks_step_${label.slice(0, 2)}.txt`, out);
  text = out;
}
fs.writeFileSync('/tmp/ks_tail_out.txt', text);
console.log('\n全链结果已写 /tmp/ks_tail_out.txt');
