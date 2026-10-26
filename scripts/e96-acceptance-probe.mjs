#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E96 验收实弹探针（军令三条口径）
//   ① 真流式 TTFT：en 月报/年报经 _e96DeepSeekStreamText（VM 抽取生产真源）
//      stream:true 真弹，首 delta 到达 < 2s（军令「2 秒内首字吐出」）；
//   ② 流式完整性：增量 chunk 数量充分（逐字流而非全文一帧）＋终文长度下界；
//   ③ 外语正文零汉字：en 月报/年报全文 CJK 扫描＝0（军令「无一处汉字残留」）。
//   管道：VM 抽取 server.js 生产函数（与生产逐字同源）：
//      _E92CompatBaziLock × _e96LocalizeCompatBaziLock（本地化链）
//      buildCompatMonthlyFourModulePrompt × buildCompatYearlyFiveChapterPrompt
//      seedFromUserPrompt × _e96DeepSeekStreamText（流式链）
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const KEY = process.env.DEEPSEEK_API_KEY || fs.readFileSync('/tmp/.e96k', 'utf8').trim();
const OUT = '/tmp/e96';
fs.mkdirSync(OUT, { recursive: true });

// ── VM 抽取（同 e94/e95 探针口径） ──
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
  for (let j = SERVER.indexOf('{', i); j < src_end(SERVER, i); j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) return SERVER.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}
function src_end() { return SERVER.length; }
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
  'return { buildCompatMonthlyFourModulePrompt, buildCompatYearlyFiveChapterPrompt, _E92CompatBaziLock, _e96LocalizeCompatBaziLock, seedFromUserPrompt, _e96DeepSeekStreamText };'
);
const VM = vmFactory(computeCompatScores, buildCompatTimeContext, renderSynastryBlock);

// ── 军令测试用例（E92 原案：盘中有真实刑冲） ──
const D1 = '1976-12-03', D2 = '1997-10-18', T1 = '03:00', T2 = '12:00';
const bl = VM._E92CompatBaziLock(D1, D2, T1, T2);
VM._e96LocalizeCompatBaziLock(bl);   // E96-③：en 交付本地化（与生产 handler 同序）
const SCORES = { bazi: { a: 6, b: 4 }, zodiac: { a: 5, b: 5 }, iching: { a: 7, b: 3 } };
function buildFor(tier, lang) {
  const extras = { bazi: SCORES.bazi, zodiac: SCORES.zodiac, iching: SCORES.iching, tarot: { name: 'The Star (reversed)', orientation: 'reversed' }, zodiacMeta: ['Sagittarius', 'Libra'], baziLock: bl, userBirthDate: D1 };
  return tier === 'monthly'
    ? VM.buildCompatMonthlyFourModulePrompt(D1, D2, lang, extras)
    : VM.buildCompatYearlyFiveChapterPrompt(D1, D2, lang, extras);
}
function maxT(tier, lang) { // E94-② 生产镜像
  if (tier === 'yearly') return /^zh/i.test(String(lang || 'zh')) ? 7500 : 12000;
  if (tier === 'monthly') return 3000;
  return 12000;
}

// ── 流式真弹（生产同款：_e96DeepSeekStreamText VM 实跑） ──
console.log('═══════ E96 验收实弹（en 月报/年报 · 真流式 2 发） ═══════');
const results = {};
for (const j of [{ tier: 'monthly', lang: 'en' }, { tier: 'yearly', lang: 'en' }]) {
  const p = buildFor(j.tier, j.lang);
  // 锁本地化注入复核（prompt 层）
  const lockL10n = p.user.includes('Chen-Xu (Dragon-Dog) clash') && !/亥|巳|丑|辰|酉/.test(p.user.split('[BAZI DATA LOCK')[1]?.split('\n')[0] || '');
  const t0 = Date.now();
  let ttft = null, chunks = 0, firstLen = 0;
  const full = await VM._e96DeepSeekStreamText(p.system, p.user, KEY, maxT(j.tier, j.lang), (d) => {
    chunks++;
    if (ttft === null) { ttft = Date.now() - t0; firstLen = d.length; }
  });
  const totalMs = Date.now() - t0;
  const text = (full || '').trim();
  fs.writeFileSync(path.join(OUT, `${j.tier}_${j.lang}.txt`), text);
  // ③ 军令零汉字扫描（正文全文 CJK——排除塔罗卡名等合法场景：en 报告应零 CJK）
  const cjk = text.match(/[\u4e00-\u9fff]+/g) || [];
  const check = {
    ttftMs: ttft, chunks, chars: text.length, totalMs,
    ttftOK: ttft !== null && ttft < 2000,
    streamedOK: chunks >= 10,             // 逐 delta 流（非全文一帧）
    cjkCount: cjk.length, cjkSamples: cjk.slice(0, 8),
    pureOK: cjk.length === 0,             // 军令「无一处汉字残留」
    lockL10nInjected: lockL10n,
    lengthOK: text.length >= (j.tier === 'yearly' ? 3000 : 1500),
  };
  results[`${j.tier}_${j.lang}`] = check;
  console.log(`${j.tier}(en): TTFT=${ttft}ms chunks=${chunks} ${text.length}ch ${totalMs}ms`, JSON.stringify({ ttftOK: check.ttftOK, streamedOK: check.streamedOK, pureOK: check.pureOK, cjk: cjk.slice(0, 5), lockL10n: check.lockL10nInjected, lengthOK: check.lengthOK }));
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));

const allPass = Object.values(results).every((c) => c.ttftOK && c.streamedOK && c.pureOK && c.lockL10nInjected && c.lengthOK);
console.log(allPass ? '═══ E96 验收：全过 ═══' : '═══ E96 验收：有未过项 ═══');
process.exit(allPass ? 0 : 1);
