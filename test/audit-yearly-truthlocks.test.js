// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V478: 年报真值锁「作用域护栏」回归闸门
// 事故背景: 2026-09-30 大叔复测 1989-08-15 奥斯陆盘年报 ——
//   「文字内容框架结构和排版都不对」+ 月份标题宫位乱跳 + 「座座」重字。
// 根因: 月报时代的三把真值锁被无差别套用到年报(12 个月跨度)上——
//   ① lockNatalAnchorRole(V444/V453): _v453Poss 在 zh/th/vi 是【可选】占有词
//      → 流年句「木星在狮子座第十宫」被强制改写为【本命】值「木星巨蟹座」
//      (实测单刀改坏 71 行, 全是"对的改错"; LLM 原稿与 SwissEph 流年真值逐字吻合)
//   ② _v432LockTransit(V432): _v432Truth(...,'transit') 只锚 months[0](首月快照)
//      → 12 个月流年真值全被改写成首月值, 并注入 28 处「座座」
//   ③ 而 lockTransitPlanetSigns(V445) 早已有 V472-guard 年报护栏 —— 护栏漏挂了两处。
// 本测试: 源码级结构断言 + 调用点全覆盖断言 + 【注入缺陷自测】。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

/** 取函数体(按大括号配平，跳过字符串/注释里的花括号) */
function fnBody(name) {
  const at = src.indexOf(`function ${name}(`);
  assert.ok(at > 0, `未找到函数 ${name}`);
  const open = src.indexOf('{', at);
  let d = 0, i = open, inS = null, inC = null;
  for (; i < src.length; i++) {
    const c = src[i], p = src[i - 1];
    if (inC) { if (c === '\n') inC = null; continue; }
    if (inS) { if (c === '\\') { i++; continue; } if (c === inS) inS = null; continue; }
    if (c === '/' && src[i + 1] === '/') { inC = 1; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i); i = e + 1; continue; }
    if (c === '"' || c === "'" || c === '`') { inS = c; continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) break; }
  }
  return src.slice(at, i + 1);
}

/** 全部调用点(排除定义行) */
function callSites(name) {
  const re = new RegExp(name + '\\(', 'g');
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    const lineStart = src.lastIndexOf('\n', m.index) + 1;
    const line = src.slice(lineStart, src.indexOf('\n', m.index));
    if (/^\s*(async\s+)?function\s/.test(line)) continue;   // 定义行
    out.push(line.trim());
  }
  return out;
}

const hasYearlyGuard = (body) => /if\s*\(\s*reportType\s*===\s*'yearly'\s*\)\s*return\s+text\s*;/.test(body);
const transitLockGatedByYearly = (body) => /if\s*\(\s*reportType\s*!==\s*'yearly'\s*\)\s*out\s*=\s*_v432LockTransit\(/.test(body);

test('① lockNatalAnchorRole 必须有 reportType 入参 + 年报早退护栏', () => {
  assert.ok(/function\s+lockNatalAnchorRole\s*\(\s*text\s*,\s*lang\s*,\s*astroMatrix\s*,\s*reportType\s*\)/.test(src),
    'lockNatalAnchorRole 缺少 reportType 形参 —— 护栏无法生效');
  assert.ok(hasYearlyGuard(fnBody('lockNatalAnchorRole')),
    "lockNatalAnchorRole 缺少 `if (reportType === 'yearly') return text;` —— 会把流年真值改成本命值");
});

test('② applyTruthLocksEnEsZh 的流月锁必须按 reportType 分yearly 停用', () => {
  // 🛡️ E13/R11d-4: 签名补第 5 参 opts（HIT 路径 skipAdjudicate 幂等）——断言随签名同步
  assert.ok(/function\s+applyTruthLocksEnEsZh\s*\(\s*text\s*,\s*lang\s*,\s*astroMatrix\s*,\s*reportType\s*[,)]/.test(src),
    'applyTruthLocksEnEsZh 缺少 reportType 形参');
  assert.ok(transitLockGatedByYearly(fnBody('applyTruthLocksEnEsZh')),
    '_v432LockTransit 未被 reportType 护栏包住 —— 年报 12 个月流年真值会被改写成首月快照(from months[0])');
});

test('③ 三个受护栏保护的锁的全部调用点必须传 reportType(否则护栏形同虚设)', () => {
  for (const n of ['lockNatalAnchorRole', 'applyTruthLocksEnEsZh']) {
    const sites = callSites(n);
    assert.ok(sites.length >= 3, `${n} 调用点异常少: ${sites.length}`);
    const missing = sites.filter(l => !/reportType/.test(l));
    assert.strictEqual(missing.length, 0,
      `${n} 有 ${missing.length} 个调用点漏传 reportType:\n  ` + missing.join('\n  '));
  }
  // lockTransitPlanetSigns(V445) 的 V472-guard 是同类范式，调用点也应带着
  const v445 = callSites('lockTransitPlanetSigns').filter(l => !/reportType/.test(l));
  assert.strictEqual(v445.length, 0, 'lockTransitPlanetSigns 有调用点漏传 reportType(V472-guard 失效)');
});

test('④ 同类范式一致性: V445(V472-guard) 与本轮两处护栏必须并存', () => {
  assert.ok(hasYearlyGuard(fnBody('lockTransitPlanetSigns')), 'V472-guard 被删除');
  assert.ok(hasYearlyGuard(fnBody('lockNatalAnchorRole')), 'V478 本命锚点锁护栏缺失');
  assert.ok(transitLockGatedByYearly(fnBody('applyTruthLocksEnEsZh')), 'V478 流月锁护栏缺失');
});

// ── V478b: 12 个月标题逐月真值锁 ──
const fnBodyOf = (name) => fnBody(name);
test('⑤ lockYearlyMonthTitles(12 月逐月真值锁) 必须存在 + reportType 护栏 + 以 months[] 取真值', () => {
  assert.ok(/function\s+lockYearlyMonthTitles\s*\(/.test(src), '未找到 lockYearlyMonthTitles（框架在案的「12 月逐月真值锁」欠账未落地）');
  const b = fnBodyOf('lockYearlyMonthTitles');
  assert.ok(/if\s*\(\s*reportType\s*!==\s*'yearly'\s*\)\s*return\s+text\s*;/.test(b),
    '缺少 reportType 护栏 —— 会污染月报');
  assert.ok(/months\.length\s*<\s*12/.test(b), '缺少 months.length>=12 前置校验');
  assert.ok(/months\[idx\]/.test(b), 'title 锁未按 months[idx] 逐月取真值(而是像旧锁那样只取首月)');
  assert.ok(/SUN_SIGN_EN\.indexOf/.test(b), '未做 EN→本地化星座映射');
});

test('⑥ 月标题锁必须挂在全部年报收尾路径末端(至少 4 处)', () => {
  const sites = callSites('lockYearlyMonthTitles');
  assert.ok(sites.length >= 4, `lockYearlyMonthTitles 调用点不足(仅 ${sites.length} 处)，部分年报路径会漏锁:\n  ` + sites.join('\n  '));
  const missing = sites.filter(l => !/reportType/.test(l));
  assert.strictEqual(missing.length, 0, 'lockYearlyMonthTitles 有调用点漏传 reportType');
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】删掉本命锚点锁护栏 → 判据① 必须红', () => {
  const degraded = fnBody('lockNatalAnchorRole').replace(/if\s*\(\s*reportType\s*===\s*'yearly'\s*\)\s*return\s+text\s*;/, '');
  assert.strictEqual(hasYearlyGuard(degraded), false, '闸门失效: 护栏缺失未被识别');
});

test('【注入缺陷自测】把流月锁护栏还原为无条件调用 → 判据② 必须红', () => {
  const degraded = fnBody('applyTruthLocksEnEsZh')
    .replace(/if\s*\(\s*reportType\s*!==\s*'yearly'\s*\)\s*out\s*=\s*_v432LockTransit\([^;]*;/, 'out = _v432LockTransit(out, lang, astroMatrix);');
  assert.strictEqual(transitLockGatedByYearly(degraded), false, '闸门失效: 流月锁未按年报停用未被识别');
});

test('【注入缺陷自测】调用点漏传 reportType → 判据③ 必须红', () => {
  const degradedSrc = src.replace(
    /lockNatalAnchorRole\(reportContent, lang, astroMatrix, reportType\)/,
    'lockNatalAnchorRole(reportContent, lang, astroMatrix)',
  );
  const fakeSites = degradedSrc.match(/[^\n]*lockNatalAnchorRole\([^\n]*/g) || [];
  const missing = fakeSites.filter(l => !/function\s/.test(l) && !/reportType/.test(l));
  assert.ok(missing.length > 0, '闸门失效: 漏传 reportType 的调用点未被识别');
});

test('【注入缺陷自测】把 12 月标题锁退化成「只取首月」→ 判据⑤ 必须红', () => {
  const degraded = fnBody('lockYearlyMonthTitles').replace(/months\[idx\]/, 'months[0]');
  assert.ok(!/months\[idx\]/.test(degraded), '闸门失效: 只取首月的退化未被识别');
});

test('【注入缺陷自测】删掉一处月标题锁调用点 → 判据⑥ 必须红', () => {
  // 🛡️ E16/R11i: 相对基线断言（E16 在 HIT th 链新增第 5 调用点后, 硬编码 <4 会失真）
  const callLines = (s) => (s.match(/[^\n]*lockYearlyMonthTitles\([^\n]*/g) || [])
    .filter(l => !/function\s+lockYearlyMonthTitles/.test(l));
  const base = callLines(src).length;
  assert.ok(base >= 4, '基线调用点不足: ' + base);
  const degradedSrc = src.replace(/^[^\n]*lockYearlyMonthTitles\(reportContent[^\n]*\n/m, '');
  assert.ok(callLines(degradedSrc).length < base,
    '闸门失效: 调用点缺失未被识别, 剩余=' + callLines(degradedSrc).length + '/基线=' + base);
});

// ── V478c: 「座座」重字防护（V432 流月锁窗口边界切断修复）──
// 根因: _v432LockTransit 的 fwd/bwd 窗口按 90 字硬截断, 可能切在「X座」中间 →
//   窗内只剩【简称】(如「巨蟹」), 被替换成全称新值(如「白羊座」)后, 窗口外的那个「座」残留 → 「白羊座座」。
const hasEatDupSign = (b) => /result\.replace\(\/座座\/g\s*,\s*'座'\)/.test(b);
test('⑦ _v432LockTransit 必须有「窗口切断吃座」守卫 + 兜底(防座座重字)', () => {
  const b = fnBody('_v432LockTransit');
  assert.ok(/patch\.text\.endsWith\('座'\)\s*&&\s*result\[tailStart\]\s*===\s*'座'/.test(b),
    '缺少 Common Tail 吃座守卫 —— 窗口切断「X座」时会残留「座」→「白羊座座」');
  assert.ok(/target\.endsWith\('座'\)\s*&&\s*text\[abs\s*\+\s*wLen\]\s*===\s*'座'/.test(b),
    '缺少 ingress 分支吃座守卫');
  assert.ok(hasEatDupSign(b), '缺少「座座→座」兜底清洗');
});

test('【注入缺陷自测】删掉「座座」兜底 → 判据⑦ 必须红', () => {
  const degraded = fnBody('_v432LockTransit')
    .replace(/if\s*\(lang === 'zh'\)\s*result = result\.replace\(\/座座\/g, '座'\);/, '');
  assert.strictEqual(hasEatDupSign(degraded), false, '闸门失效: 兜底被删未被识别');
});

test('【注入缺陷自测】删掉 Common Tail 吃座守卫 → 判据⑦ 必须红', () => {
  const degraded = fnBody('_v432LockTransit').replace(/if\s*\(lang === 'zh' && patch\.text\.endsWith\('座'\)[^\n]*/, '');
  assert.ok(!/patch\.text\.endsWith\('座'\)/.test(degraded), '闸门失效: 吃座守卫被删未被识别');
});
