// ═══════════════════════════════════════════════════════════════════
// V483b 探针: 用【线上真实产物】验证「月标题月份号」是否被锁回财年窗口
// 用法: node test/tools/probe_v483b_monthshift.mjs [文本文件]
//   默认读 /tmp/ks1999_v482_e2e.txt (verify_v482_e2e.mjs 落盘的线上年报)
//
// 背景(2026-09-30 线上实测, 提交 abb0518 部署后):
//   判据②「逐月流年行星星座零矛盾」✅ 而判据⑦「正文 12 个月 == 财年窗口」❌
//   → 正文数据是财年 7 月起、标题月份号却仍是 9 月起（LLM 照抄了按「当前月 + i」
//     生成的提示词硬锁表）。本探针用**财年 month_key 假矩阵**复算同一份产物:
//     · 修复前: 标题月份保持 2026-09 ~ 2027-08（错位 2 个月）
//     · 修复后: 必须被改写成 2026-07 ~ 2027-06，且幂等
//   同时覆盖「同月双标题」形态（线上真实产物是 24 行 → 去重 12 行 → 再锁月份号）。
// ═══════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const SEEDS = ['lockYearlyMonthTitles', '_v483bMonthYM', '_v479IsMonthTitleLine', '_v482SignAdjacent',
  '_v432Clause', '_v432LockNatal', '_v432AdjudicateDescriptors', '_v432Normalize', '_v432Truth', '_v432TruthMatch',
  '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse', '_v432AllSignWords', '_v432Signs',
  '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS', '_V432_EN2LOC', '_v432Esc',
  '_V482_FWD_BREAK', '_V482_FWD_CONJ', '_V482_TRANSIT_KEYS', '_V482_TVERB', '_V478_EN_MONTHS', 'SUN_SIGN_EN',
  '_v444Signs', '_v444Esc', '_V482B_TITLE_LEAD', '_V482B_TITLE_HOUSE', '_V482B_SUN_WORD'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { map.delete(n); } }
const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext([...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map((e) => e[1]).join('\n\n')
  + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
const F = ctx.__exports;

const file = process.argv[2] || '/tmp/ks1999_v482_e2e.txt';
if (!fs.existsSync(file)) { console.error('缺少线上产物:', file, '— 先跑 verify_v482_e2e.mjs'); process.exit(1); }
const text = fs.readFileSync(file, 'utf8');

const EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
// 财年窗口假矩阵: month_key = 2026-07 … 2027-06 (与 V483 真实窗口同构, 零 python 依赖)
const months = Array.from({ length: 12 }, (_, i) => {
  const mo = ((6 + i) % 12) + 1;
  const y = mo >= 7 ? 2026 : 2027;
  return { month_key: `${y}-${String(mo).padStart(2, '0')}`, sun: { sign: EN[i], house: i + 1 } };
});
const M = { months, meta: {} };
const WANT = months.map((m) => m.month_key.replace(/^(\d{4})-(\d{2})$/, (s, y, mm) => `${y}-${Number(mm)}`));

const titleKeys = (t) => t.split('\n').filter((l) => /^\s*#{1,6}\s/.test(l) && /\d{4}年\d{1,2}月/.test(l))
  .map((l) => { const m = l.match(/(\d{4})年(\d{1,2})月/); return m ? `${m[1]}-${Number(m[2])}` : null; }).filter(Boolean);

const before = titleKeys(text);
const out = F.lockYearlyMonthTitles(text, 'zh', M, 'yearly');
const after = titleKeys(out);
const again = F.lockYearlyMonthTitles(out, 'zh', M, 'yearly');

console.log(`输入(线上真实产物): ${before.length} 行标题 | ${before[0] || '?'} ~ ${before[before.length - 1] || '?'}`);
console.log(`锁后:              ${after.length} 行标题 | ${after[0] || '?'} ~ ${after[after.length - 1] || '?'}`);
for (let i = 0; i < Math.min(after.length, 12); i++) if (before[i] !== after[i]) console.log(`   [${i}] ${before[i]} → ${after[i]}`);

const okLen = after.length === 12;
const okWin = after.join(',') === WANT.join(',');
const okIdem = again === out;
console.log(`\n① 恰好 12 行:        ${okLen ? '✅' : '❌'}`);
console.log(`② 月份号 == 财年窗口: ${okWin ? '✅' : '❌ 实得 ' + after.join(',')}`);
console.log(`③ 幂等(零 diff):     ${okIdem ? '✅' : '❌'}`);
fs.writeFileSync('/tmp/ks1999_v483b_fixed.txt', out);
console.log('\n锁后全文 → /tmp/ks1999_v483b_fixed.txt');
process.exit(okLen && okWin && okIdem ? 0 : 1);
