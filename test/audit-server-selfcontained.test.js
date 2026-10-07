// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V482d: 后端「模块级函数自洽性」闸门
//
// 事故(2026-09-30 线上实测):
//   `/api/wealth-oracle`(非流式 / 前端 free_access fallback 路径) yearly MISS **直接 500**:
//     {"success":false,"error":"AI generation failed: lang is not defined"}
//   根因: `cleanYearlyTimeline` 是**模块级**函数, 签名却只有 `(text)`, 函数体里却用 `lang`
//   (`if (lang === 'es' || …)`) → JS 词法作用域看不到调用者的局部 `lang` →
//   **只要被调用就必抛 ReferenceError**。流式端点从不调它, 所以长期隐形。
//   同类第二处: `buildWealthOncePrompt` 里 `sunSign = zodiacSigns[0]` —— `zodiacSigns`
//   **全文件不存在**(自由变量), 任何日期区间都没命中时就崩掉 prompt 构造。
//
// 本闸门锁两件事:
//   ① 静态: 需要上下文的收尾函数必须**显式收形参**(不得隐式依赖调用者局部变量),
//           且调用点必须把实参传全。
//   ② 行为: 收尾/清洗函数家族必须能在**只有自身闭包**的 vm 沙箱里直接跑通
//           (跑不通 = 依赖了调用者局部变量 = 迟早线上 ReferenceError)。
//   全部判据配【注入缺陷自测】证明会红。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { indexDecls, closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
const DECLS = indexDecls(src);
// ⚠️ 一律用 indexDecls 取函数切片(带正则字面量识别), 不用朴素大括号配平 ——
//   后者会被正则字符类里的 ASCII 引号带偏(见 V482c 踩坑)。
function fnSrc(name, source = src) {
  const d = source === src ? DECLS : indexDecls(source);
  const code = d.get(name);
  assert.ok(code, `未找到函数 ${name}`);
  return code;
}

const EXTERNALS = ['console', 'getSignToHouseMap', 'SIGN_ORDER_ZH'];

/** 剥注释(判据只看代码, 否则解释性注释里的旧写法会假红) */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/[^\n]*$/gm, ' ').replace(/([^:])\/\/[^\n]*/g, '$1 ');
}

/** 在「只有自身闭包」的沙箱里取出函数(不给任何调用者局部变量) */
function sandboxFn(name, source = src) {
  const { map } = closureDecls(source, [name], EXTERNALS);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(
    [...map.values()].join('\n\n')
    + `\n__exports.f = typeof ${name} !== 'undefined' ? ${name} : undefined;`,
    ctx,
  );
  return ctx.__exports.f;
}

// ── ① 静态: 需要 lang 的函数必须显式收形参 ──
test('① cleanYearlyTimeline 必须显式收 `lang` 形参(模块级函数看不到调用者局部变量)', () => {
  const code = fnSrc('cleanYearlyTimeline');
  const header = code.slice(0, code.indexOf('{'));
  assert.ok(/\blang\b/.test(header), 'cleanYearlyTimeline 缺少 lang 形参 —— 函数体里却在用 lang, 必抛 ReferenceError');
  assert.ok(/\(\s*text\s*,\s*lang\s*\)/.test(header), '形参表应形如 (text, lang): ' + header.trim());
});

test('② cleanYearlyTimeline 的每个调用点都必须把 lang 传进去', () => {
  const sites = (src.match(/[^\n]*\bcleanYearlyTimeline\s*\([^\n]*/g) || [])
    .filter((l) => !/function\s+cleanYearlyTimeline/.test(l));
  assert.ok(sites.length >= 1, '未找到 cleanYearlyTimeline 调用点');
  const bad = sites.filter((l) => !/cleanYearlyTimeline\s*\([^)]*,[^)]*\)/.test(l));
  assert.strictEqual(bad.length, 0, '有调用点漏传 lang:\n  ' + bad.join('\n  '));
});

// ── ③ 行为: 收尾/清洗函数家族必须在沙箱里自洽可调用 ──
//   这份清单 = server.js 里「纯收尾」函数; 只要有一个依赖了调用者局部变量, 沙箱里必抛。
const FAMILY = [
  'cleanYearlyTimeline', 'forceSpaceHouseSanitizer', 'normalizeReportTags', 'cleanGarbageCharacters',
  'fixSectionBrackets', 'normalizeYearlyMarkup', 'standardizeReport', 'fixMoonHouseParens', '_v477CjkCount',
];
test('③ 收尾函数家族必须能在沙箱里自洽调用(不得依赖调用者局部变量)', () => {
  const fixture = '# 标题\n正文一句。';
  const problems = [];
  for (const name of FAMILY) {
    let f;
    try { f = sandboxFn(name); } catch (e) { problems.push(`${name}: 闭包抽取/求值失败 ${e.message}`); continue; }
    if (typeof f !== 'function') { problems.push(`${name}: 未取到函数`); continue; }
    try { f(fixture, 'zh'); } catch (e) { problems.push(`${name}: 调用抛 ${e.constructor.name}: ${e.message}`); }
  }
  assert.deepStrictEqual(problems, [], '收尾函数依赖了作用域外的变量(线上会 ReferenceError):\n  ' + problems.join('\n  '));
});

// ── ④ 行为: cleanYearlyTimeline 的 lang 分支必须真的生效 ──
test('④ cleanYearlyTimeline 语言分支生效(es 全角括号转半角 / zh 不动) + 幂等', () => {
  const f = sandboxFn('cleanYearlyTimeline');
  const es = f('（Plutón 第8宫）', 'es');
  assert.ok(!/（/.test(es), 'es 路径未把全角左括号转半角: ' + es);
  const zh = f('（Plutón 第8宫）', 'zh');
  assert.strictEqual(zh, '（Plutón 第8宫）', 'zh 路径不该动全角括号');
  assert.strictEqual(f(zh, 'zh'), zh, '非幂等: 二次调用有变化');
});

// ── ⑤ 静态: prompt 构造器不得引用不存在的标识符 ──
// 🛡️ E25/P0（2026-10-07 军师开工令）：原 V482d 判据（「兜底必须用同函数内 zodiacRanges」）**已被取代**——
//   手写星座日期表 `zodiacRanges` 整体废除（其临界日 6/21、10/23、11/22 与 getNatalSunSign 打架
//   ⇒ 先天报告与月报/年报太阳星座互相矛盾）。太阳星座统一走 getNatalSunSign 单一真源。
test('⑤ buildWealthOncePrompt 星座必须走 getNatalSunSign 单一真源, 不得再有手写星座表', () => {
  const code = stripComments(fnSrc('buildWealthOncePrompt'));
  assert.ok(!/\bzodiacSigns\b/.test(code), '出现自由变量 zodiacSigns(该标识符全文件不存在) → 兜底触发即 ReferenceError');
  assert.ok(!/\bzodiacRanges\b/.test(code), '手写星座表 zodiacRanges 未废除（E25/P0 要求统一 getNatalSunSign）');
  assert.ok(/getNatalSunSign\s*\(/.test(code), '未调用 getNatalSunSign —— 太阳星座非单一真源');
  assert.ok(/buildNatalAnchors\s*\(/.test(code), '未摄入 buildNatalAnchors 本命真值块（E25/P0 真值归位）');
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】抹掉 cleanYearlyTimeline 的 lang 形参 → ①③ 必须红', () => {
  const degraded = src.replace('function cleanYearlyTimeline(text, lang) {', 'function cleanYearlyTimeline(text) {');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到函数签名)');
  // ① 静态
  const header = fnSrc('cleanYearlyTimeline', degraded);
  assert.ok(!/\(\s*text\s*,\s*lang\s*\)/.test(header.slice(0, header.indexOf('{'))), '闸门失效: 形参缺失未被识别');
  // ③ 行为
  const f = sandboxFn('cleanYearlyTimeline', degraded);
  let threw = null;
  try { f('（x）', 'es'); } catch (e) { threw = e.message; }
  assert.ok(threw && /lang is not defined/.test(threw), '闸门失效: 形参缺失后沙箱调用未抛 ReferenceError(实得 ' + threw + ')');
});

test('【注入缺陷自测】调用点漏传 lang → ② 必须红', () => {
  const degraded = src.replace(
    /cleanYearlyTimeline\(reportContent,\s*lang\)/,
    'cleanYearlyTimeline(reportContent)',
  );
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到调用点)');
  const sites = (degraded.match(/[^\n]*\bcleanYearlyTimeline\s*\([^\n]*/g) || [])
    .filter((l) => !/function\s+cleanYearlyTimeline/.test(l));
  const bad = sites.filter((l) => !/cleanYearlyTimeline\s*\([^)]*,[^)]*\)/.test(l));
  assert.ok(bad.length > 0, '闸门失效: 漏传 lang 的调用点未被识别');
});

test('【注入缺陷自测】把 lang 分支关掉 → ④ 必须红(行为级)', () => {
  const degraded = src.replace(
    "if (lang === 'es' || lang === 'en' || lang === 'fr' || lang === 'th' || lang === 'vi') {",
    "if (false) {",
  );
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到 lang 分支)');
  const f = sandboxFn('cleanYearlyTimeline', degraded);
  assert.ok(/（/.test(f('（Plutón 第8宫）', 'es')), '闸门失效: 语言分支被关后 es 仍转换了全角括号(判据④ 未红)');
});

test('【注入缺陷自测】把 once 构造器的星座真源/真值块改回缺陷态 → ⑤ 必须红', () => {
  const ANCHOR = 'const _sunIdx = getNatalSunSign(birthDate);';
  // ① 塞回手写星座表（E25/P0 废除物）
  const degraded1 = src.replace(ANCHOR, "const zodiacRanges = [{ name: 'x' }];\n  " + ANCHOR);
  assert.notStrictEqual(degraded1, src, '未成功注入缺陷(未匹配到正源锚点)');
  assert.ok(/\bzodiacRanges\b/.test(stripComments(fnSrc('buildWealthOncePrompt', degraded1))),
    '闸门失效: 手写星座表回退未被识别');

  // ② 彻底不调 getNatalSunSign（退化为自由变量）
  const degraded2 = src.replace(ANCHOR, 'const _sunIdx = zodiacSigns[0];');
  assert.notStrictEqual(degraded2, src, '未成功注入缺陷(未匹配到正源锚点)');
  const code2 = stripComments(fnSrc('buildWealthOncePrompt', degraded2));
  assert.ok(!/getNatalSunSign\s*\(/.test(code2) && /\bzodiacSigns\b/.test(code2),
    '闸门失效: 星座真源缺失未被识别');

  // ③ 抹掉 buildNatalAnchors 摄入（真值飞地复发）
  const degraded3 = src.replace(
    "const natalAnchors = astroMatrix ? buildNatalAnchors(astroMatrix) : '';",
    "const natalAnchors = '';",
  );
  assert.notStrictEqual(degraded3, src, '未成功注入缺陷(未匹配到真值块锚点)');
  assert.ok(!/buildNatalAnchors\s*\(/.test(stripComments(fnSrc('buildWealthOncePrompt', degraded3))),
    '闸门失效: 本命真值块缺失未被识别');
});
