#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E100 验收实弹探针（军令四刀口径 · 泰语全链）
//   ① th 月报/年报：Token 高密度档（月 7500 / 年 16000）＋终章闭环守卫——
//      末行必须是「✦ SOUL OS」封印签名，禁止中途断头；
//   ② th 报告全文字符纯净化——零 CJK（重生渗漏根治）、零英文夹杂
//      （Dragon-Dog clash / Fire trine / Metal trine / half-combination /
//       coupled chart / heaven / earth / hexagram）；
//   ③ 周易真值卦锁——正文卦名必须复现 DATA LOCK 的「กั้วที่ N」真值行，
//      幻觉卦名「นักบวชเรี่ยมใจ」绝迹；
//   ④ synastry ratio 百分比呈现（69.4% 形态，0.694 裸浮点绝迹）；
//   ⑤ 塔罗女祭司译名归正（ไพ่นักบวชหญิง）＋泰语正逆位（ตั้งตรง/กลับด้าน）。
//   管道：VM 抽取 server.js 生产真源（与生产逐字同源）。
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const KEY = process.env.DEEPSEEK_API_KEY || (fs.existsSync('/tmp/.e100k') ? fs.readFileSync('/tmp/.e100k', 'utf8').trim() : '');
const OUT = '/tmp/e100';
fs.mkdirSync(OUT, { recursive: true });
if (!KEY) { console.error('MISSING DEEPSEEK KEY (/tmp/.e100k or env)'); process.exit(2); }

// ── VM 抽取（同 e98 探针口径） ──
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
const fnHex = fnBody('function _e100IchingHexLine(');
const fnBaziLock = fnBody('function _E92CompatBaziLock(');
const fnL10n = fnBody('function _e96LocalizeCompatBaziLock(');
const fnSeed = fnBody('function seedFromUserPrompt(');
const fnStrip = fnBody('function _e100StripCjk(');
const fnStream = fnBody('async function _e96DeepSeekStreamText(');

const { computeCompatScores, buildCompatTimeContext, renderSynastryBlock } = await import(path.join(ROOT, 'api/ai-advisor.js'));
const vmFactory = new Function(
  'computeCompatScores', 'buildCompatTimeContext', 'renderSynastryBlock',
  `${monthlyTables}\n${yearlyTables}\n${fnHex}\n${fnMonthly}\n${fnYearly}\n${fnBaziLock}\n${fnL10n}\n${fnSeed}\n${fnStrip}\n${fnStream}\n` +
  'return { buildCompatMonthlyFourModulePrompt, buildCompatYearlyFiveChapterPrompt, _e100IchingHexLine, _E92CompatBaziLock, _e96LocalizeCompatBaziLock, _e100StripCjk, _e96DeepSeekStreamText };'
);
const VM = vmFactory(computeCompatScores, buildCompatTimeContext, renderSynastryBlock);

// ── 军令测试用例（E92 原案 · th 交付） ──
const D1 = '1976-12-03', D2 = '1997-10-18', T1 = '03:00', T2 = '12:00';
const bl = VM._E92CompatBaziLock(D1, D2, T1, T2);
VM._e96LocalizeCompatBaziLock(bl, 'th');   // E100-②：th 交付本地化（与生产 handler 同序）
const SCORES = { bazi: { a: 6, b: 4 }, zodiac: { a: 5, b: 5 }, iching: { a: 7, b: 3 } };
function buildFor(tier, lang, tarot) {
  const extras = { bazi: SCORES.bazi, zodiac: SCORES.zodiac, iching: SCORES.iching, tarot, zodiacMeta: ['ธนู', 'ตาชะมด'], baziLock: bl, userBirthDate: D1 };
  return tier === 'monthly'
    ? VM.buildCompatMonthlyFourModulePrompt(D1, D2, lang, extras)
    : VM.buildCompatYearlyFiveChapterPrompt(D1, D2, lang, extras);
}
function maxT(tier, lang) { // E100-① 生产镜像（th/vi 月 7500 / 年 16000）
  if (tier === 'yearly') return /^zh/i.test(String(lang || 'zh')) ? 7500 : (/^(th|vi)$/i.test(String(lang || '')) ? 16000 : 12000);
  if (tier === 'monthly') return /^zh/i.test(String(lang || 'zh')) ? 3500 : (/^(th|vi)$/i.test(String(lang || '')) ? 7500 : 5500);
  return 12000;
}

// ── 塔罗 th 真链形态（tarot.ts getTarot th 口径：ไพ่นักบวชหญิง＋(กลับด้าน)/(ตั้งตรง)） ──
const TH_TAROT_REV = { name: 'ไพ่นักบวชหญิง', orientation: ' (กลับด้าน)' };
const TH_TAROT_UP = { name: 'ไพ่นักบวชหญิง', orientation: ' (ตั้งตรง)' };

console.log('═══════ E100 验收实弹（th 月报＋th 年报 ×2 形态 · 真流式 3 发） ═══════');
const results = {};
const jobs = [
  { id: 'monthly_th_rev', tier: 'monthly', lang: 'th', tarot: TH_TAROT_REV },
  { id: 'yearly_th_up', tier: 'yearly', lang: 'th', tarot: TH_TAROT_UP },
  { id: 'yearly_th_rev', tier: 'yearly', lang: 'th', tarot: TH_TAROT_REV },
];
for (const j of jobs) {
  const p = buildFor(j.tier, j.lang, j.tarot);
  // 锁层复核（prompt 层）：th 转译注入＋卦锁行＋零 CJK＋零英文关系词
  const lockSeg = p.user.split('[BAZI DATA LOCK')[1]?.split('\n').slice(0, 10).join(' ') || '';
  const hexLockLine = (p.user.match(/IChing (?:Monthly|Annual) Hexagram \(sole truth\): (.+)/) || [])[1] || '';
  const lockOK = lockSeg.includes('การปะทะ') && lockSeg.includes('ช่องว่างอายุจริง') && !!hexLockLine && !/[\u4e00-\u9fff]/.test(lockSeg) && !/\bclash\b|\btrine\b|half-combination/.test(lockSeg);
  const sealGuard = p.system.includes('ENDING SEAL GUARD — MANDATORY');
  const t0 = Date.now();
  let ttft = null, chunks = 0;
  const full = await VM._e96DeepSeekStreamText(p.system, p.user, KEY, maxT(j.tier, j.lang), (d) => {
    chunks++;
    if (ttft === null) ttft = Date.now() - t0;
  });
  const totalMs = Date.now() - t0;
  const text = (j.lang === 'zh' ? (full || '') : VM._e100StripCjk(full || '')).trim();
  fs.writeFileSync(path.join(OUT, `${j.id}.txt`), text);
  // 军令检测表
  const cjk = text.match(/[\u4e00-\u9fff]+/g) || [];
  const check = {
    ttftMs: ttft, chunks, chars: text.length, totalMs,
    streamedOK: chunks >= 10,
    pureCJK: cjk.length === 0, cjkSamples: cjk.slice(0, 5),
    // ② 英文夹杂零容忍（军令钦定名单；标题 Solar Return 真源允许、拼音干支允许）
    noClash: !/\bclash\b/i.test(text),
    noTrine: !/\btrine\b/i.test(text),
    noHalfComb: !/half-combination/i.test(text),
    noCoupledChart: !/coupled chart/i.test(text),
    noHeavenEarth: !/\bheaven\b|\bearth\b/i.test(text),
    noHexagramEn: !/\bhexagram\b/i.test(text),
    noRebornZh: !text.includes('重生'),
    // ① 终章闭环：末行 ✦ SOUL OS 封印签名（允许尾随空白）
    sealOK: /\n\s*✦\s*SOUL OS\s*$/.test(text) || /✦\s*SOUL OS\s*$/.test(text),
    // ③ 周易真值卦：正文复现锁内卦行（กั้วที่ N）；幻觉卦名绝迹
    hexLock: hexLockLine,
    hexUsedInBody: !!hexLockLine && text.includes(`กั้วที่ ${hexLockLine.match(/(\d+)/)?.[1] || 'X'}`),
    fakeHexGone: !text.includes('นักบวชเรี่ยมใจ'),
    // ④ 裸浮点绝迹（百分比 69.4% 形态可现）
    noRawRatio: !/0\.\d{3}(?!\d)/.test(text),
    // ⑤ 塔罗：译名归正＋泰语方位如实（年报第 10 条引线必提年度牌 ⇒ 名必须在正文；
    //    月报牌名载体＝DATA LOCK 行＋引线句，正文可引可不引——判据＝若提及则必归正名）
    tarotNamed: j.tier === 'yearly' ? text.includes('ไพ่นักบวชหญิง') : (text.includes('ไพ่นักบวชหญิง') || !/ไพ่|นางพราหมณี/.test(text)),
    oldTarotGone: !text.includes('นางพราหมณี'),
    orientOK: j.tarot === TH_TAROT_REV ? (text.includes('กลับด้าน') || !/ตั้งตรง|Upright/.test(text)) : (text.includes('ตั้งตรง') || !/กลับด้าน|Reversed/.test(text)),
    // 长度（th token 密度高：月 ≥1200 字符、年 ≥3000）
    lengthOK: text.length >= (j.tier === 'yearly' ? 3000 : 1200),
  };
  results[j.id] = { ...check, lockL10nInjected: lockOK, sealGuardInSystem: sealGuard };
  console.log(`${j.id}: TTFT=${ttft}ms chunks=${chunks} ${text.length}ch ${totalMs}ms`, JSON.stringify({
    stream: check.streamedOK, cjk0: check.pureCJK, lock: lockOK, seal: sealGuard && check.sealOK,
    noEn: check.noClash && check.noTrine && check.noHalfComb && check.noCoupledChart && check.noHeavenEarth && check.noHexagramEn,
    reborn0: check.noRebornZh, hex: check.hexUsedInBody, fakeHex0: check.fakeHexGone,
    ratio0: check.noRawRatio, tarot: check.tarotNamed && check.oldTarotGone && check.orientOK, len: check.lengthOK,
    hexLine: hexLockLine,
  }));
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));

const allPass = Object.values(results).every((c) => c.streamedOK && c.pureCJK && c.lockL10nInjected && c.sealGuardInSystem && c.sealOK
  && c.noClash && c.noTrine && c.noHalfComb && c.noCoupledChart && c.noHeavenEarth && c.noHexagramEn && c.noRebornZh
  && c.hexUsedInBody && c.fakeHexGone && c.noRawRatio && c.tarotNamed && c.oldTarotGone && c.orientOK && c.lengthOK);
console.log(allPass ? '═══ E100 验收：全过 ═══' : '═══ E100 验收：有未过项 ═══');
process.exit(allPass ? 0 : 1);
