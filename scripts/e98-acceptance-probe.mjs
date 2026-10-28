#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E98 验收实弹探针（军令四刀口径 · 法语全链）
//   ① fr 年报：年龄差真值 21 ans（根治 douze ans 地支 12 循环幻觉）；
//   ② fr 年报/月报：生肖字典纯化——正文零英文 Ox、零 CJK、零英文 trine；
//   ③ fr 塔罗正逆位新词形：La Lune (Inversée) 阴性形态在正文如实呈现，
//      正位新词 (À l'endroit) 不被 AI 改写为旧词 (Droit)；
//   管道：VM 抽取 server.js 生产真源（与生产逐字同源）：
//      _E92CompatBaziLock × _e96LocalizeCompatBaziLock(bl,'fr')
//      × buildCompatMonthlyFourModulePrompt × buildCompatYearlyFiveChapterPrompt
//      × _e96DeepSeekStreamText（真流式）
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const KEY = process.env.DEEPSEEK_API_KEY || fs.readFileSync('/tmp/.e98k', 'utf8').trim();
const OUT = '/tmp/e98';
fs.mkdirSync(OUT, { recursive: true });

// ── VM 抽取（同 e94/e95/e96 探针口径） ──
function sliceFrom(anchor, endMarker) {
  const i = SERVER.indexOf(anchor);
  if (i === -1) throw new Error(`anchor missing: ${anchor}`);
  const j = SERVER.indexOf(endMarker, i);
  if (j === -1) throw new Error(`end marker missing after ${anchor}`);
  return SERVER.slice(i, j);
}
function fnBody(anchor) {
  const i = SERVER.indexOf(anchor);
  if (i === -1) throw new Error(`fn anchor missing: ${anchor}`);
  let depth = 0, started = false;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) return SERVER.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}
const monthlyTables = sliceFrom('const _E89_MONTHLY_LANG_LOCK', '\n\n// ═══');
const yearlyTables = sliceFrom('const _E88_YEARLY_LANG_LOCK', '\n\n// ═══');
const fnMonthly = fnBody('function buildCompatMonthlyFourModulePrompt(');
const fnYearly = fnBody('function buildCompatYearlyFiveChapterPrompt(');
const fnBaziLock = fnBody('function _E92CompatBaziLock(');
const fnL10n = fnBody('function _e96LocalizeCompatBaziLock(');
const fnSeed = fnBody('function seedFromUserPrompt(');
const fnStream = fnBody('async function _e96DeepSeekStreamText(');

const { computeCompatScores, buildCompatTimeContext, renderSynastryBlock } = await import(path.join(ROOT, 'api/ai-advisor.js'));
const vmFactory = new Function(
  'computeCompatScores', 'buildCompatTimeContext', 'renderSynastryBlock',
  `${monthlyTables}\n${yearlyTables}\n${fnMonthly}\n${fnYearly}\n${fnBaziLock}\n${fnL10n}\n${fnSeed}\n${fnStream}\n` +
  'return { buildCompatMonthlyFourModulePrompt, buildCompatYearlyFiveChapterPrompt, _E92CompatBaziLock, _e96LocalizeCompatBaziLock, _e96DeepSeekStreamText };'
);
const VM = vmFactory(computeCompatScores, buildCompatTimeContext, renderSynastryBlock);

// ── 军令测试用例（E92 原案 · fr 交付） ──
const D1 = '1976-12-03', D2 = '1997-10-18', T1 = '03:00', T2 = '12:00';
const bl = VM._E92CompatBaziLock(D1, D2, T1, T2);
VM._e96LocalizeCompatBaziLock(bl, 'fr');   // E98-③：fr 交付本地化（与生产 handler 同序）
const SCORES = { bazi: { a: 6, b: 4 }, zodiac: { a: 5, b: 5 }, iching: { a: 7, b: 3 } };
function buildFor(tier, lang, tarot) {
  const extras = { bazi: SCORES.bazi, zodiac: SCORES.zodiac, iching: SCORES.iching, tarot, zodiacMeta: ['Sagittaire', 'Balance'], baziLock: bl, userBirthDate: D1 };
  return tier === 'monthly'
    ? VM.buildCompatMonthlyFourModulePrompt(D1, D2, lang, extras)
    : VM.buildCompatYearlyFiveChapterPrompt(D1, D2, lang, extras);
}
function maxT(tier, lang) { // E97-① 生产镜像（fr 月 5500 / 年 12000）
  if (tier === 'yearly') return /^zh/i.test(String(lang || 'zh')) ? 7500 : 12000;
  if (tier === 'monthly') return /^zh/i.test(String(lang || 'zh')) ? 3500 : 5500;
  return 12000;
}

// ── 塔罗 fr 真链形态（tarot.ts getTarot fr 口径：La Lune 阴性逆位 (Inversée)；正位 (À l'endroit)） ──
const FR_TAROT_REV = { name: 'La Lune', orientation: ' (Inversée)' };
const FR_TAROT_UP = { name: "L'Étoile", orientation: " (À l'endroit)" };

console.log('═══════ E98 验收实弹（fr 年报 ×2 形态＋fr 月报 · 真流式 3 发） ═══════');
const results = {};
const jobs = [
  { id: 'yearly_fr_rev', tier: 'yearly', lang: 'fr', tarot: FR_TAROT_REV },
  { id: 'yearly_fr_up', tier: 'yearly', lang: 'fr', tarot: FR_TAROT_UP },
  { id: 'monthly_fr_rev', tier: 'monthly', lang: 'fr', tarot: FR_TAROT_REV },
];
for (const j of jobs) {
  const p = buildFor(j.tier, j.lang, j.tarot);
  // 锁层复核（prompt 层）：fr 转译注入＋年龄差真值行＋零 Ox
  const lockSeg = p.user.split('[BAZI DATA LOCK')[1]?.split('\n').slice(0, 8).join(' ') || '';
  const lockOK = lockSeg.includes('Bœuf') && lockSeg.includes('21 ans séparent A et B') && !/\bOx\b/.test(lockSeg) && !/[\u4e00-\u9fff]/.test(lockSeg);
  const t0 = Date.now();
  let ttft = null, chunks = 0;
  const full = await VM._e96DeepSeekStreamText(p.system, p.user, KEY, maxT(j.tier, j.lang), (d) => {
    chunks++;
    if (ttft === null) ttft = Date.now() - t0;
  });
  const totalMs = Date.now() - t0;
  const text = (full || '').trim();
  fs.writeFileSync(path.join(OUT, `${j.id}.txt`), text);
  // 军令检测表
  const cjk = text.match(/[\u4e00-\u9fff]+/g) || [];
  const low = text.toLowerCase();
  const check = {
    ttftMs: ttft, chunks, chars: text.length, totalMs,
    streamedOK: chunks >= 10,
    pureOK: cjk.length === 0, cjkSamples: cjk.slice(0, 5),
    lockL10nInjected: lockOK,
    // ① 年龄差：21 ans 真值在正文（含法语文字数字 vingt-et-un ans）；douze ans 幻觉不复发
    ageGapOK: /((vingt[- ]et[- ]un)|21)\s*ans/i.test(text),
    douzeRelapse: /\b(douze|dix)\s*ans\b/i.test(text),
    // ② 生肖纯化：零英文 Ox（l'Ox 渗漏根治）；零英文 trine（fr 应 trigone）
    noOx: !/\bOx\b/.test(text) && !/l'Ox/i.test(text),
    noTrine: !/\btrine\b/.test(text),
    // ③ 塔罗方位新词形：逆位牌 La Lune 须阴性 Inversée 呈现；正位牌 L'Étoile 须 À l'endroit/正位语义（不得误写 inversé）
    tarotRevFeminine: j.tarot === FR_TAROT_REV ? /inversée/i.test(text) : true,
    tarotUprightKept: j.tarot === FR_TAROT_UP ? (!/inversé/i.test(text) && (/à l'endroit/i.test(text) || /endroit/i.test(text))) : true,
    lengthOK: text.length >= (j.tier === 'yearly' ? 3000 : 1500),
  };
  results[j.id] = check;
  console.log(`${j.id}: TTFT=${ttft}ms chunks=${chunks} ${text.length}ch ${totalMs}ms`, JSON.stringify({ streamed: check.streamedOK, pure: check.pureOK, lock: check.lockL10nInjected, age21: check.ageGapOK, douzeRelapse: check.douzeRelapse, noOx: check.noOx, noTrine: check.noTrine, revFem: check.tarotRevFeminine, upKept: check.tarotUprightKept, len: check.lengthOK }));
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));

const allPass = Object.values(results).every((c) => c.streamedOK && c.pureOK && c.lockL10nInjected && c.ageGapOK && !c.douzeRelapse && c.noOx && c.noTrine && c.tarotRevFeminine && c.tarotUprightKept && c.lengthOK);
console.log(allPass ? '═══ E98 验收：全过 ═══' : '═══ E98 验收：有未过项 ═══');
process.exit(allPass ? 0 : 1);
