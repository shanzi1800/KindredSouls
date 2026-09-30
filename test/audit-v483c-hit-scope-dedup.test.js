// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V483c 闸门：HIT 路径作用域自洽 + 年报月标题终局去重
//
// 事故 A（2026-09-30 线上实测，commit 5496700）:
//   `/api/wealth-oracle` 的缓存 HIT 分支里，`_hitAstro`(vi块) / `_hitAstroTh`(th块) /
//   `_hitAstro432`(en·es·zh块) 三个变量各自在**语言 if 块内**用 `let` 声明，却在块外
//   `const _hitMatrix = _hitAstro432 || _hitAstro || _hitAstroTh || null;` 处被读取
//   → 只要走进 HIT 分支（缓存文本 >2000 字）就**必然**抛 `ReferenceError: _hitAstro432 is not defined`
//   → 被下方 catch 吞掉（只打 `Cache check error`）→ `return res.json` 根本执行不到
//   → **HIT 路径整体失效**，每次请求都退化成 MISS 重新生成（LLM 费用 + 用户等待双输）。
//   ⚠️ 与 V482d 的「模块级函数隐式依赖调用者局部变量」同源：缓存/收尾路径必须自洽。
//
// 事故 B（同日）: 非流式 yearly 偶发返回「同一个月两条月标题」→ 12 个月 ×2 = 24 行标题。
//   V482b/c 的清算要求两条都含「星座+宫位」（hasCore）且签名相同/前缀关系 →
//   LLM 两条措辞差异稍大就整月漏判（线上实测 dropped=0）。故补全链最末的确定性兜底：
//   `dedupYearlyMonthTitles` —— 同一「YYYY年M月」只保留信息最全的一条。
//
// ⚠️ 判据设计纪律：
//   ① 结构判据必须精确到「声明所在块的直接层」，不用宽泛的静态扫描
//      （实测朴素的「块内声明 + 位置在后引用」扫描在 server.js 上有 87 处噪音，零可用性）；
//   ② 每条判据都必须配**注入缺陷自测**，确认会红；注入必须真的改变源码。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const serverSrc = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function walk(node, cb, parent = null) {
  if (!node || typeof node.type !== 'string') return;
  cb(node, parent);
  for (const k of Object.keys(node)) {
    if (k === 'type' || k === 'start' || k === 'end' || k === 'loc' || k === 'range') continue;
    const v = node[k];
    if (Array.isArray(v)) { for (const c of v) if (c && typeof c.type === 'string') walk(c, cb, node); }
    else if (v && typeof v.type === 'string') walk(v, cb, node);
  }
}

const HIT_VARS = ['_hitAstro', '_hitAstroTh', '_hitAstro432'];

// ── 判据 A: `_hitMatrix` 引用的三个宿主变量必须声明在其所在块的**直接层** ──
//     （块级 let 逃逸会让「块外引用」变成 ReferenceError —— 见事故 A）
function hitScopeOk(src) {
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });
  const parentOf = new Map();
  let target = null;
  walk(ast, (n, p) => { parentOf.set(n, p); if (n.type === 'VariableDeclarator' && n.id && n.id.name === '_hitMatrix') target = n; });
  if (!target) return { ok: false, reason: '未找到 `_hitMatrix` 声明（HIT 返回体已改动？）' };
  let node = target, hole = null;
  while (node) {
    if (node.type === 'BlockStatement') { hole = node; break; }
    node = parentOf.get(node);
  }
  if (!hole) return { ok: false, reason: '未找到 `_hitMatrix` 所在块' };
  const direct = new Set();
  for (const st of hole.body) {
    if (st.type === 'VariableDeclaration' && (st.kind === 'let' || st.kind === 'const')) {
      for (const d of st.declarations) if (d.id && d.id.type === 'Identifier') direct.add(d.id.name);
    }
  }
  const missing = HIT_VARS.filter((n) => !direct.has(n));
  return { ok: missing.length === 0, reason: missing.length ? ('逃逸到内层块的变量: ' + missing.join(', ')) : '', names: [...direct] };
}

// ── 判据 B(语义自证): 块内 let + 块外引用 ⇒ ReferenceError；提到同层 ⇒ 正常 ──
//     用来证明判据 A 的语义正确（不是"随手写个结构约束"）
function blockLetSemantics() {
  const oldForm = `let out; try { if (true) { let x = 1; } out = x || 2; } catch (e) { out = e.constructor.name + ': ' + e.message; } out;`;
  const newForm = `let x = null; let out; try { if (true) { x = 1; } out = x || 2; } catch (e) { out = 'THREW'; } out;`;
  return { oldThrows: vm.runInNewContext(oldForm), newThrows: vm.runInNewContext(newForm) };
}

// ── 判据 C: dedupYearlyMonthTitles 行为沙箱（零外部依赖） ──
function dedupSandbox(source = serverSrc) {
  const { map } = closureDecls(source, ['dedupYearlyMonthTitles']);
  if (!map.has('dedupYearlyMonthTitles')) return null;
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext([...map.values()].join('\n\n')
    + '\n__exports.dedupYearlyMonthTitles = typeof dedupYearlyMonthTitles !== "undefined" ? dedupYearlyMonthTitles : undefined;', ctx);
  return ctx.__exports;
}

const SIGNS = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
/** 构造「同月两条标题」脏文本（模拟线上 24 行产物） */
function dirty24() {
  const lines = ['## 第二章：365天月度收入矩阵', ''];
  for (let i = 0; i < 12; i++) {
    const mo = ((6 + i) % 12) + 1;
    const y = mo >= 7 ? 2026 : 2027;
    const t = `### ${y}年${mo}月: 太阳${SIGNS[i]} 第${i + 1}宫 · 主题${i}`;
    lines.push(t, '', t, '', `* 本月正文第 ${i + 1} 段（必须零丢失）`, '', '---', '');
  }
  return lines.join('\n');
}
/** 干净 12 行 + 一个含年份区间的章节子标题（不得被误删） */
function clean12() {
  const lines = ['## 第二章：365天月度收入矩阵', ''];
  for (let i = 0; i < 12; i++) {
    const mo = ((6 + i) % 12) + 1;
    const y = mo >= 7 ? 2026 : 2027;
    lines.push(`### ${y}年${mo}月: 太阳${SIGNS[i]} 第${i + 1}宫 · 主题${i}`, '', `* 正文 ${i + 1}`, '', '---', '');
  }
  lines.push('## 第三章：命运事业路径与主权轨道', '', '### 2026-2027年的职业跃迁窗口', '', '正文内容', '');
  return lines.join('\n');
}
const titleCount = (t) => t.split('\n').filter((l) => /^\s*#{1,6}\s/.test(l) && /^\s*#{1,6}\s*\d{4}\s*年\s*\d{1,2}\s*月/.test(l)).length;

function dedupOk(F) {
  const d = dirty24();
  const out = F.dedupYearlyMonthTitles(d, 'zh', 'yearly');
  if (titleCount(d) !== 24) return false;                 // 前置: 输入确实是 24 行
  if (titleCount(out) !== 12) return false;               // 主判据: 压到 12 行
  for (let i = 1; i <= 12; i++) if (!out.includes(`本月正文第 ${i} 段（必须零丢失）`)) return false;   // 正文零丢失
  const again = F.dedupYearlyMonthTitles(out, 'zh', 'yearly');
  if (again !== out) return false;                        // 幂等
  const clean = clean12();
  if (F.dedupYearlyMonthTitles(clean, 'zh', 'yearly') !== clean) return false;   // 干净输入零 diff
  const outClean = F.dedupYearlyMonthTitles(clean, 'zh', 'yearly');
  if (!outClean.includes('### 2026-2027年的职业跃迁窗口')) return false;          // 年份区间子标题不得被误删
  if (titleCount(outClean) !== 12) return false;
  const monthly = dirty24();
  if (F.dedupYearlyMonthTitles(monthly, 'zh', 'monthly') !== monthly) return false;   // 月报零影响
  return true;
}

// ── 判据 D: 接线与版本 ──
function wiringOk(src) {
  const code = stripComments(src);
  const calls = (code.match(/dedupYearlyMonthTitles\(/g) || []).length;
  if (calls < 4) return false;                                  // 1 定义 + ≥3 调用点
  if (!/reportContent = dedupYearlyMonthTitles\(reportContent, lang, reportType\)/.test(code)) return false;   // 非流式
  if (!/cleanedText = dedupYearlyMonthTitles\(cleanedText, lang, reportType\)/.test(code)) return false;       // 流式落库前
  if (!/streamText = dedupYearlyMonthTitles\(streamText, lang, reportType\)/.test(code)) return false;          // 流式 HIT
  if (!/wealth:v490:/.test(code)) return false;                 // 缓存 bump
  if ((code.match(/nocache === true/g) || []).length < 2) return false;   // 非流式 + 流式都支持 nocache
  if (!/reportType !== 'oracle' && !noCache/.test(code)) return false;    // 非流式 HIT 守卫
  if (!/if \(SB_URL && SB_KEY && !noCache\)/.test(code)) return false;    // 流式 HIT 守卫
  return true;
}

// ═══════════════════════════ 主判据 ═══════════════════════════

test('【判据 A】HIT 路径: _hitAstro / _hitAstroTh / _hitAstro432 必须声明在同一块的直接层', () => {
  const r = hitScopeOk(serverSrc);
  assert.ok(r.ok, r.reason + '（块级 let 逃逸 → 命中 HIT 分支必抛 ReferenceError）');
});

test('【判据 B】语义自证: 块内 let + 块外引用确实抛 ReferenceError', () => {
  const { oldThrows, newThrows } = blockLetSemantics();
  assert.match(String(oldThrows), /^ReferenceError/, '旧形态必须抛 ReferenceError，实得: ' + oldThrows);
  assert.strictEqual(newThrows, 1, '新形态（声明提到同层）必须正常求值');
});

test('【判据 C】dedupYearlyMonthTitles: 24 行 → 12 行且正文零丢失、幂等、不误删区间子标题、月报零影响', () => {
  const F = dedupSandbox();
  assert.ok(F && typeof F.dedupYearlyMonthTitles === 'function', '未能抽取 dedupYearlyMonthTitles');
  assert.ok(dedupOk(F));
});

test('【判据 D】接线: 三条收尾链末端均挂 dedup + 缓存 v490 + nocache 生效', () => {
  assert.ok(wiringOk(serverSrc));
});

// ═══════════════════════════ 注入缺陷自测 ═══════════════════════════

test('【注入缺陷自测】把三连雷声明退回各自的语言 if 块内 → 判据 A 必须红', () => {
  let degraded = serverSrc.replace(
    "          let _hitAstro = null;\n          let _hitAstroTh = null;\n          let _hitAstro432 = null;\n          if (lang === 'vi') {",
    "          if (lang === 'vi') {"
  );
  degraded = degraded.replace(
    "          if (lang === 'vi') {\n            try { _hitAstro = await getAstroMatrix(",
    "          if (lang === 'vi') {\n            let _hitAstro = null;\n            try { _hitAstro = await getAstroMatrix("
  );
  degraded = degraded.replace(
    "          if (lang === 'th') {\n            try { _hitAstroTh = await getAstroMatrix(",
    "          if (lang === 'th') {\n            let _hitAstroTh = null;\n            try { _hitAstroTh = await getAstroMatrix("
  );
  degraded = degraded.replace(
    "          if (_V432_LANGS.includes(lang)) {\n            try { _hitAstro432 = await getAstroMatrix(",
    "          if (_V432_LANGS.includes(lang)) {\n            let _hitAstro432 = null;\n            try { _hitAstro432 = await getAstroMatrix("
  );
  assert.notStrictEqual(degraded, serverSrc, '注入必须真的改变源码');
  const r = hitScopeOk(degraded);
  assert.strictEqual(r.ok, false, '退回块内 let 后判据 A 必须红，实得: ok=' + r.ok);
});

test('【注入缺陷自测】禁用 dedup 内部清算 → 判据 C 必须红', () => {
  const degraded = serverSrc.replace('  if (!drop.size) return text;\n  for (const r of drop) lines[r] = \'\';',
    '  if (true) return text;\n  for (const r of drop) lines[r] = \'\';');
  assert.notStrictEqual(degraded, serverSrc, '注入必须真的改变源码');
  const F = dedupSandbox(degraded);
  assert.ok(F && typeof F.dedupYearlyMonthTitles === 'function');
  assert.strictEqual(dedupOk(F), false, '禁用清算后判据 C 必须红');
});

test('【注入缺陷自测】摘掉非流式收尾链的 dedup 调用 → 判据 D 必须红', () => {
  const degraded = serverSrc.replace(
    'reportContent = dedupYearlyMonthTitles(reportContent, lang, reportType);',
    'reportContent = reportContent;'
  );
  assert.notStrictEqual(degraded, serverSrc, '注入必须真的改变源码');
  assert.strictEqual(wiringOk(degraded), false, '摘掉调用点后判据 D 必须红');
});

test('【注入缺陷自测】缓存 key 退回 v489 → 判据 D 必须红', () => {
  const degraded = serverSrc.replace(/wealth:v490:/g, 'wealth:v489:');
  assert.notStrictEqual(degraded, serverSrc, '注入必须真的改变源码');
  assert.strictEqual(wiringOk(degraded), false, '缓存未 bump 时判据 D 必须红');
});
