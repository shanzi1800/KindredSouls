// ═══════════════════════════════════════════════════════════════════
// V483c 探针: 定位「非流式 yearly 产物 24 行重复月标题」的产生环节
// 用法: node test/tools/probe_v483c_dupchain.mjs [文本文件]
//   默认读 /tmp/ks_sync_v482e.txt (verify_v482e_sync.mjs 落盘的线上非流式年报)
//
// 背景(2026-09-30 线上实测, commit 5496700):
//   非流式 MISS 路径日志: [V478b] 重写 1 行 | 去重 0 行 / [V480] 月标题 12 / [V482] 修正 11 处
//   → 三步都只看到 12 行标题, 但最终 report 里是 24 行(每月 2 条逐字相同)。
//   本探针把收尾链四函数抽到 vm 沙箱(零 python/swisseph 依赖), 分别对
//     P  = 线上产物原文(24 行标题)
//     P12= 去掉重复行后的 12 行版本
//   逐步施加, 打印每步的行标题数/总行数 → 谁把 12 变成 24 谁就是真凶。
// ═══════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

const SEEDS = [
  'lockYearlyMonthTitles', 'normalizeYearlyMarkup', 'lockYearlyTransitSigns', 'cleanYearlyTimeline',
  '_v483bMonthYM', '_v479IsMonthTitleLine',
  '_V480_SEP', '_V480_EN_MON', '_V480_ES_MON', '_V480_CHAP_KW', '_V480_DECOR', '_V480_DECOR_TAIL',
  '_V482_TRANSIT_KEYS', '_V482_TVERB', '_V478_EN_MONTHS', '_V478_ORD_ZH',
  '_V482B_TITLE_LEAD', '_V482B_TITLE_HOUSE', '_V482B_SUN_WORD',
  '_v444Signs', '_v444Esc', '_v432AllSignWords', '_V432_NAME', 'SUN_SIGN_EN',
];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { map.delete(n); } }
const ctx = {
  getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout,
  setInterval, clearInterval, Buffer, process, __exports: {},
};
vm.createContext(ctx);
vm.runInContext(
  [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map((e) => e[1]).join('\n\n')
  + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'),
  ctx
);
const F = ctx.__exports;
for (const n of ['lockYearlyMonthTitles', 'normalizeYearlyMarkup', 'lockYearlyTransitSigns', 'cleanYearlyTimeline']) {
  if (typeof F[n] !== 'function') { console.error('沙箱抽取失败:', n); process.exit(1); }
}

const file = process.argv[2] || '/tmp/ks_sync_v482e.txt';
if (!fs.existsSync(file)) { console.error('缺少线上产物:', file); process.exit(1); }
const P = fs.readFileSync(file, 'utf8');

const isTitle = (l) => /^\s*#{1,6}\s/.test(l) && /\d{4}年\d{1,2}月/.test(l);
const stats = (t) => ({ titles: t.split('\n').filter(isTitle).length, lines: t.split('\n').length, chars: t.length });

// P12: 去掉逐字重复的月标题行(保留首次出现)
const seen = new Set();
const P12 = P.split('\n').filter((l) => {
  if (!isTitle(l)) return true;
  const sig = l.trim();
  if (seen.has(sig)) return false;
  seen.add(sig);
  return true;
}).join('\n');

// 财年假矩阵(month_key = 2026-07 … 2027-06), 零 python 依赖
const EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const months = Array.from({ length: 12 }, (_, i) => {
  const mo = ((6 + i) % 12) + 1;
  const y = mo >= 7 ? 2026 : 2027;
  return { month_key: `${y}-${String(mo).padStart(2, '0')}`, sun: { sign: EN[i], house: i + 1 } };
});
const M = { months, meta: {} };

const CHAIN = [
  ['lockYearlyMonthTitles', (t) => F.lockYearlyMonthTitles(t, 'zh', M, 'yearly')],
  ['normalizeYearlyMarkup', (t) => F.normalizeYearlyMarkup(t, 'zh', 'yearly')],
  ['lockYearlyTransitSigns', (t) => F.lockYearlyTransitSigns(t, 'zh', M, 'yearly')],
  ['cleanYearlyTimeline', (t) => F.cleanYearlyTimeline(t, 'zh')],
];

function runChain(label, text) {
  console.log(`\n════ ${label} ════`);
  let cur = text;
  let s = stats(cur);
  console.log(`  输入             : 标题 ${s.titles} | 行 ${s.lines} | 字符 ${s.chars}`);
  for (const [name, fn] of CHAIN) {
    cur = fn(cur);
    s = stats(cur);
    console.log(`  → ${name.padEnd(24)}: 标题 ${s.titles} | 行 ${s.lines} | 字符 ${s.chars}`);
  }
  return cur;
}

const rP = runChain('P  = 线上产物原文(24 行标题)', P);
console.log('\n↑ 注意上方 [V478b]/[V480]/[V482] 日志的输出, 与线上日志逐字对比');
const r12 = runChain('P12 = 去重后的 12 行版本', P12);

const sP = stats(rP), s12 = stats(r12);
console.log('\n════ 结论 ════');
console.log(`  P  跑完链: 标题 ${sP.titles} (期望 12 → 若 ${sP.titles} 说明有函数在「复制标题」)`);
console.log(`  P12 跑完链: 标题 ${s12.titles} (期望 12)`);
if (s12.titles > 12) console.log('  ❌ 真凶在上面某一步: 12 行被放大');
else if (sP.titles === 12) console.log('  ✅ 本地码对 24 行产物能压到 12 行 → 线上那次链的「输入」不是这份产物');
else console.log('  ⚠️ 需人工判读');

fs.writeFileSync('/tmp/ks_v483c_P_chain.txt', rP);
fs.writeFileSync('/tmp/ks_v483c_P12_chain.txt', r12);
