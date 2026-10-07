// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E25/P0「跨报告一致性与真值归位」闸门（2026-10-07 军师开工令）
//
// 三个靶点（全部由源码 + vm 实证锁定，非推测）：
//
// 靶点一 · 真值飞地：
//   $4.99 先天报告构造器 `buildWealthOncePrompt` 原来只吃 birthDate，用手写星座日期表
//   推太阳星座，却要求 LLM 写「本命第2/8/10宫深挖 + 土星/冥王相位」——
//   而调用侧 `if (reportType !== 'once')` 让它拿到 `astroMatrix = null` ⇒ 无数据硬推 = 幻觉。
//
// 靶点二 · 太阳星座双源打架：
//   手写表临界日与 `getNatalSunSign` 不一致（6/21 双子↔巨蟹、10/23 天秤↔天蝎、
//   11/22 天蝎↔射手）⇒ 同一用户「先天报告」与「月报/年报」太阳星座互相矛盾。
//
// 靶点三 · 双通道产物分叉（最重）：
//   流式端点 `/api/wealth-oracle/stream` 原**无条件**调用 `buildWealthReportPrompt`，
//   而该函数内只有 monthly / (else = yearly) 两个分支 ⇒ `reportType='once'` 落进
//   **年报骨架（五章 / 财年窗口）**：用户花 $4.99 买到的是 $29.99 年报。
//   （vm 实证：`buildWealthReportPrompt(…,'once')` 的 system/user 与 `'yearly'` 逐字节同构）
//
// 判据：
//   A 静态（三处源码取证：非流式隔离 / 流式分流 / 构造器真值）
//   B 行为（vm 直调构造器：三轴骨架 + 本命真值块注入 + 临界日回归）
//   C 守卫分区（once 不得注入「第五章空间铁律 / 第二章风控分配表」）
//   D 注入缺陷自测（证明每条判据都会红）
// ═══════════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { indexDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

/** 剥注释：判据只看代码（否则解释性注释里的旧写法/旧代码引用会假红） */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/[^\n]*$/gm, ' ').replace(/([^:])\/\/[^\n]*/g, '$1 ');
}
const CODE = stripComments(src);

function fnSrc(name, source = src) {
  const d = source === src ? indexDecls(src) : indexDecls(source);
  const code = d.get(name);
  assert.ok(code, `未找到函数 ${name}`);
  return code;
}

// ═══════════════════════════════ A 静态 ═══════════════════════════════

test('A1 非流式端点已取消 once 隔离（先天报告同样摄入 SwissEph astroMatrix）', () => {
  assert.ok(!/if\s*\(\s*reportType\s*!==\s*'once'\s*\)\s*\{/.test(CODE),
    '仍存在 `if (reportType !== \'once\')` 隔离 ⇒ 先天报告 astroMatrix=null ⇒ 2/8/10 宫纯幻觉');
  // 正向：once 分支必须把 astroMatrix 交给构造器
  assert.ok(/buildWealthOncePrompt\s*\(\s*birthDate\s*,\s*lang\s*,\s*astroMatrix\s*\)/.test(CODE),
    '非流式 once 分支未把 astroMatrix 传入 buildWealthOncePrompt');
});

test('A2 流式端点按 reportType 分流：once 必须走 buildWealthOncePrompt（双通道同源）', () => {
  // 流式端点的 prompt 构造必须是三元分流，且 once 分支为专属构造器
  assert.ok(
    /reportType\s*===\s*'once'\s*\?\s*buildWealthOncePrompt\s*\(\s*birthDate\s*,\s*lang\s*,\s*astroMatrix\s*\)/.test(CODE),
    '流式端点未把 once 分流到 buildWealthOncePrompt ⇒ once 落进 buildWealthReportPrompt 的年报骨架（$4.99 交付 $29.99）',
  );
  // 两通道各一处 once 构造调用（非流式分支 + 流式三元）——计数须扣除函数定义行
  const calls = (CODE.match(/buildWealthOncePrompt\s*\(/g) || []).length
    - (CODE.match(/function\s+buildWealthOncePrompt\s*\(/g) || []).length;
  assert.ok(calls >= 2, `buildWealthOncePrompt 调用点应 ≥2（非流式 + 流式），实际 ${calls}`);
});

test('A3 buildWealthOncePrompt 真值归位：getNatalSunSign 单一真源 + buildNatalAnchors 真值块 + 无手写星座表', () => {
  const body = stripComments(fnSrc('buildWealthOncePrompt'));
  assert.ok(/getNatalSunSign\s*\(/.test(body), '未调用 getNatalSunSign（太阳星座非单一真源）');
  assert.ok(/buildNatalAnchors\s*\(/.test(body), '未摄入 buildNatalAnchors 本命真值块');
  assert.ok(!/\bzodiacRanges\b/.test(body), '手写星座表 zodiacRanges 未废除');
  assert.ok(!/\bzodiacSigns\b/.test(body), '仍存在自由变量 zodiacSigns');
});

// ═══════════════════════════════ C 守卫分区 ═══════════════════════════════

test('C1 共享守卫对 once 分区：不得注入「第五章空间铁律 / 第二章风控分配表」', () => {
  const guard = stripComments(fnSrc('applyWealthReportPromptGuards'));
  assert.ok(/reportType\s*!==\s*'once'/.test(guard),
    '守卫未对 once 剥离「第五章 空间财富对齐铁律」⇒ 会把三轴报告带向五章骨架');
  assert.ok(/reportType\s*===\s*'once'/.test(guard),
    '守卫未为 once 提供专属（无第二章分配表）的星体真值铁律分支');
  // 月报/年报仍必须拿到完整块（不得误伤）
  assert.ok(guard.includes('空间财富对齐硬性铁律'), '月报/年报的 zh 空间铁律块被误删');
  assert.ok(guard.includes('第二章 风控主线分配表'), '月报/年报的第二章分配表被误删');
});

// ═══════════════════════════════ B 行为级 ═══════════════════════════════

/** 在 vm 里装配 once 构造器（真源函数 + 真太阳数组；buildNatalAnchors 用可辨标记桩） */
function buildOnceSandbox(source = src) {
  const d = indexDecls(source);
  const sunArrays = {};
  for (const k of ['SUN_SIGN_EN', 'SUN_SIGN_ZH', 'SUN_SIGN_VI', 'SUN_SIGN_TH', 'SUN_SIGN_ES', 'SUN_SIGN_FR']) {
    const m = new RegExp(`const\\s+${k}\\s*=\\s*(\\[[^\\]]*\\]);`).exec(source);
    if (m) sunArrays[k] = m[1];
  }
  const prelude = Object.entries(sunArrays).map(([k, v]) => `const ${k} = ${v};`).join('\n');
  const ctx = vm.createContext({
    console: { log() {}, warn() {}, error() {} },
    buildNatalAnchors: (m) => `[ANCHORS natalSun=${m?.meta?.sun_sign || '?'} SatH=${m?.meta?.saturn_house || '?'}]`,
    __once: null, __sun: null,
  });
  vm.runInContext(
    prelude + '\n' + d.get('getNatalSunSign') + '\n' + d.get('buildWealthOncePrompt') +
    '\nglobalThis.__once = buildWealthOncePrompt; globalThis.__sun = getNatalSunSign;',
    ctx,
  );
  return ctx;
}

test('B1 行为级：once 构造器产出「三轴」骨架，且注入本命真值块 + 语言锁', () => {
  const ctx = buildOnceSandbox();
  const out = ctx.__once('1990-06-21', 'zh', { meta: { sun_sign: 'Cancer', saturn_house: 8 } });
  assert.ok(out && typeof out.system === 'string' && typeof out.user === 'string', 'once 构造器未返回 {system,user}');
  assert.ok(/三轴聚焦/.test(out.system), 'once system 缺「三轴聚焦」骨架');
  assert.ok(/第2\/8\/10宫/.test(out.system), 'once system 缺第一轴（2/8/10 宫）规格');
  assert.ok(out.user.includes('[ANCHORS natalSun=Cancer SatH=8]'), 'once user 未注入 buildNatalAnchors 真值块');
  assert.ok(/真值铁律/.test(out.user), 'once user 缺真值铁律/语言锁指令');
  // 非 zh 语种同样注入
  const en = ctx.__once('1990-06-21', 'en', { meta: { sun_sign: 'Cancer' } });
  assert.ok(en.user.includes('[ANCHORS'), 'en once user 未注入真值块');
});

test('B2 临界日回归：once 太阳星座必须与 getNatalSunSign（月报/年报同源）完全一致', () => {
  const ctx = buildOnceSandbox();
  const ZH = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
  // 三大历史临界日（手写表曾与真源打架）
  for (const [date, oldWrong] of [['1990-06-21', '双子座'], ['1990-10-23', '天秤座'], ['1990-11-22', '天蝎座']]) {
    const idx = ctx.__sun(date);
    const expect = ZH[idx];
    const out = ctx.__once(date, 'zh', { meta: { sun_sign: 'X' } });
    const line = (out.user.match(/本命太阳：(\S+)/) || [])[1];
    assert.strictEqual(line, expect, `${date} once 太阳星座=${line}，应与 getNatalSunSign 同源的 ${expect} 一致`);
    assert.notStrictEqual(expect, oldWrong, `${date} 真源应与手写表旧值 ${oldWrong} 不同（本用例即回归靶心）`);
  }
});

test('B3 行为级（对照）：buildWealthReportPrompt 对 once 无分支 ⇒ 与 yearly 同构（证明「流式必须分流」）', () => {
  const rep = fnSrc('buildWealthReportPrompt');
  // 该函数内**只有** monthly 一个 reportType 分支；once 必然落进 else(=yearly)
  const monthlyGuards = (rep.match(/if\s*\(\s*reportType\s*===\s*'monthly'\s*\)/g) || []).length;
  const onceGuards = (rep.match(/reportType\s*===\s*'once'/g) || []).length;
  assert.ok(monthlyGuards >= 1, 'buildWealthReportPrompt 未见 monthly 分支（前提失效，须复核本闸门）');
  assert.strictEqual(onceGuards, 0,
    'buildWealthReportPrompt 竟已有 once 分支 —— 若属实须复核 A2（流式分流）是否仍然必要');
});

// ═══════════════════════════ D 注入缺陷自测 ═══════════════════════════

test('【注入缺陷自测】撤销流式分流（once 改回单一构造器）→ A2 必须红', () => {
  const degraded = src.replace(
    "const prompt = reportType === 'once'\n      ? buildWealthOncePrompt(birthDate, lang, astroMatrix)\n      : buildWealthReportPrompt(birthDate, lang, reportType, {",
    'const prompt = buildWealthReportPrompt(birthDate, lang, reportType, {',
  );
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到流式分流三元)');
  const code = stripComments(degraded);
  assert.ok(!/reportType\s*===\s*'once'\s*\?\s*buildWealthOncePrompt/.test(code),
    '闸门失效: 撤销分流后 A2 判据仍通过');
  const calls = (code.match(/buildWealthOncePrompt\s*\(/g) || []).length
    - (code.match(/function\s+buildWealthOncePrompt\s*\(/g) || []).length;
  assert.ok(calls < 2, `闸门失效: 撤销分流后调用点计数未下降（实得 ${calls}）`);
});

test('【注入缺陷自测】恢复 once 隔离 → A1 必须红', () => {
  const degraded = src.replace(
    '      try {\n        astroMatrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz, { reportType });',
    "      if (reportType !== 'once') {\n      try {\n        astroMatrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz, { reportType });",
  );
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到 astroMatrix 获取锚点)');
  assert.ok(/if\s*\(\s*reportType\s*!==\s*'once'\s*\)\s*\{/.test(stripComments(degraded)),
    '闸门失效: 恢复隔离后 A1 判据未红');
});

test('【注入缺陷自测】守卫取消 once 分区 → C1 必须红', () => {
  const degraded = src.replace("if (lang === 'zh' && reportType !== 'once') {", "if (lang === 'zh') {");
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到守卫 once 分区锚点)');
  assert.ok(!/reportType\s*!==\s*'once'/.test(stripComments(fnSrc('applyWealthReportPromptGuards', degraded)))
    || !/reportType\s*===\s*'once'/.test(stripComments(fnSrc('applyWealthReportPromptGuards', degraded))),
    '闸门失效: 守卫 once 分区被撤销后 C1 判据未红');
});

test('【注入缺陷自测】once 星座真源退回手写常量 → B2 必须红（临界日穿帮复现）', () => {
  const degraded = src.replace('const _sunIdx = getNatalSunSign(birthDate);', 'const _sunIdx = 2; // 双子座（手写表旧口径）');
  assert.notStrictEqual(degraded, src, '未成功注入缺陷(未匹配到星座真源锚点)');
  const ctx = buildOnceSandbox(degraded);
  const line621 = (ctx.__once('1990-06-21', 'zh', { meta: {} }).user.match(/本命太阳：(\S+)/) || [])[1];
  assert.strictEqual(line621, '双子座', '闸门失效: 手写口径回退后 6/21 应显示双子座（证明 B2 判据射程覆盖临界日）');
  const true621 = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'][ctx.__sun('1990-06-21')];
  assert.notStrictEqual(line621, true621, '闸门失效: 缺陷态与真源竟然同值，用例无鉴别力');
});
