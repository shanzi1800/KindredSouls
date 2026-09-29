#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 * 年报渲染块「存活守卫」· V474
 * ═══════════════════════════════════════════════════════════════════════
 * 背景 (V473 幽灵 Bug 复盘):
 *
 *   数月前有人为了「让编译通过」,用 {/* ... *​/} 把整整 140 行年报渲染块
 *   一刀切注释掉。JSX 注释里的代码会被 tsc 直接丢弃 ——
 *   编译全绿、构建全绿、后端 API 全绿,
 *   线上却「一个字都出不来」:后端几万字正文被压缩器当死代码剔除。
 *
 *   → 编译通过 ≠ 功能存在。本脚本用 TypeScript AST 只做一件事:
 *     证明「年报渲染块」是【活代码】,而不是被注释掉的尸体。
 *
 * 为什么用 AST 而不是 grep?
 *   AST 里只有活代码。如果一个标识能出现在 AST 中,
 *   它在数学上就不可能处于注释/字符串里 —— 这是最硬的存活证明。
 *
 * 检查项:
 *   G1  yearly-pending 稳定 key 存在于活代码字符串字面量
 *   G2  SacredYearlyReportBox 在活 JSX 中被实际使用(不是只 import)
 *   G3  parseYearlyReport / cleanYearlyTimeline 从解析模块导入且被调用
 *   G4  解析模块保持零 React / 零 DOM 依赖(保证可单测)
 *   G5  没有超长 JSX 注释块(默认 >40 行即报警,防「整段一刀切注释」复发)
 *
 * 退出码: 0 = 全绿; 1 = 年报渲染链有断裂风险。
 * ═══════════════════════════════════════════════════════════════════════
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// KS_GUARD_PAGE 可覆盖被检查的页面文件 —— 供 CI / 闸门自测喂 fixture 用
const PAGE = process.env.KS_GUARD_PAGE
  ? path.resolve(process.env.KS_GUARD_PAGE)
  : path.join(WEB_ROOT, 'src/pages/WealthReportPage.tsx');
const PARSER = path.join(WEB_ROOT, 'src/lib/yearly-report-parser.ts');
const PARSER_SPEC = '../lib/yearly-report-parser';
const MAX_JSX_COMMENT_LINES = 40;

const rel = (p) => path.relative(WEB_ROOT, p);
const failures = [];
const notes = [];

function parse(file) {
  const text = fs.readFileSync(file, 'utf8');
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
}

const pageSf = parse(PAGE);

function lineOf(sf, node) {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

// ── 收集:活代码中的字符串字面量 / JSX 标签 / 导入 / 调用 ──────────────
const stringLiterals = new Set();
const jsxTagNames = new Set();
const calledNames = new Set();
const imports = []; // { spec, names:Set }
const jsxComments = []; // { startLine, endLine, span }

(function walk(node) {
  if (ts.isStringLiteral(node) || node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
    stringLiterals.add(node.text);
  }
  if (node.kind === ts.SyntaxKind.JsxSelfClosingElement || node.kind === ts.SyntaxKind.JsxOpeningElement) {
    const tag = node.tagName;
    if (tag && ts.isIdentifier(tag)) jsxTagNames.add(tag.text);
    if (tag && ts.isPropertyAccessExpression(tag)) jsxTagNames.add(tag.getText(pageSf));
  }
  if (ts.isCallExpression(node) && node.expression) {
    if (ts.isIdentifier(node.expression)) calledNames.add(node.expression.text);
    else if (ts.isPropertyAccessExpression(node.expression)) calledNames.add(node.expression.name.text);
  }
  if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
    const names = new Set();
    const clause = node.importClause;
    if (clause) {
      // 默认导入: import Foo from '...'
      if (clause.name) names.add(clause.name.text);
      const bindings = clause.namedBindings;
      // 具名导入: import { a, b as c } from '...'
      if (bindings && ts.isNamedImports(bindings)) {
        for (const el of bindings.elements) names.add((el.propertyName ?? el.name).text);
      }
      // 命名空间导入: import * as ns from '...'
      if (bindings && ts.isNamespaceImport(bindings)) names.add(bindings.name.text);
    }
    imports.push({ spec: node.moduleSpecifier.text, names });
  }
  // JSX 注释 = JsxExpression 且文本以 {/* 开头(TS6 起 isJsxExpressionContainer 已改名)
  if (ts.isJsxExpression(node) && /^\{\s*\/\*/.test(node.getText(pageSf))) {
    const startLine = lineOf(pageSf, node);
    const endLine = pageSf.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
    jsxComments.push({ startLine, endLine, span: endLine - startLine + 1 });
  }
  ts.forEachChild(node, walk);
})(pageSf);

// ── G1: yearly-pending 存活 ──────────────────────────────────────────
const hasYearlyKey = [...stringLiterals].some((s) => s.includes('yearly-pending'));
if (!hasYearlyKey) {
  failures.push(
    `G1 ${rel(PAGE)} 的活代码中找不到字符串 'yearly-pending' —— 年报渲染块的 key 锚点消失了,极可能整段被注释/删除。`,
  );
} else {
  notes.push("G1 'yearly-pending' 存在于活代码 ✅");
}

// ── G2: SacredYearlyReportBox 真的被渲染 ─────────────────────────────
const hasBoxImport = imports.some((i) => i.names.has('SacredYearlyReportBox'));
const hasBoxRender = jsxTagNames.has('SacredYearlyReportBox');
if (!hasBoxImport) {
  failures.push(`G2 ${rel(PAGE)} 未 import SacredYearlyReportBox —— 年报主组件引用被移除。`);
} else if (!hasBoxRender) {
  failures.push(
    `G2 已 import SacredYearlyReportBox 但从未在活 JSX 中渲染它 —— 典型的「渲染块被注释掉」症状。`,
  );
} else {
  notes.push('G2 SacredYearlyReportBox 在活 JSX 中被渲染 ✅');
}

// ── G3: 解析层被真正调用 ─────────────────────────────────────────────
const parserImport = imports.find((i) => i.spec === PARSER_SPEC);
for (const fn of ['parseYearlyReport', 'cleanYearlyTimeline']) {
  if (!parserImport || !parserImport.names.has(fn)) {
    failures.push(`G3 ${rel(PAGE)} 未从 ${PARSER_SPEC} 导入 ${fn}()。`);
  } else if (!calledNames.has(fn)) {
    failures.push(`G3 ${fn}() 已导入但从未被调用 —— 年报解析链断裂。`);
  } else {
    notes.push(`G3 ${fn}() 已导入且被调用 ✅`);
  }
}

// ── G4: 解析模块零 React 依赖 ────────────────────────────────────────
const parserText = fs.readFileSync(PARSER, 'utf8');
const parserSf = parse(PARSER);
const reactImports = [];
(function walkParser(node) {
  if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
    const spec = node.moduleSpecifier.text;
    if (spec === 'react' || spec.startsWith('react/') || spec.startsWith('react-dom')) reactImports.push(spec);
  }
  ts.forEachChild(node, walkParser);
})(parserSf);
const domRefs = /\b(document|window|localStorage)\b/.test(parserText);
if (reactImports.length > 0) {
  failures.push(`G4 ${rel(PARSER)} 引入了 React(${reactImports.join(', ')}) —— 会破坏 Node 原生单测的零依赖前提。`);
} else if (domRefs) {
  failures.push(`G4 ${rel(PARSER)} 出现 DOM 全局(document/window/localStorage) —— 同上,会破坏可单测性。`);
} else {
  notes.push('G4 解析层保持零 React / 零 DOM 依赖 ✅');
}

// ── G5: 超长 JSX 注释块 ──────────────────────────────────────────────
const bigComments = jsxComments.filter((c) => c.span > MAX_JSX_COMMENT_LINES);
if (bigComments.length > 0) {
  failures.push(
    `G5 ${rel(PAGE)} 存在 ${bigComments.length} 个超过 ${MAX_JSX_COMMENT_LINES} 行的 JSX 注释块 —— 请确认里面没有活功能:\n` +
      bigComments.map((c) => `       第 ${c.startLine}-${c.endLine} 行 (${c.span} 行)`).join('\n'),
  );
} else {
  notes.push(`G5 JSX 注释块共 ${jsxComments.length} 个,最大 ${jsxComments.reduce((m, c) => Math.max(m, c.span), 0)} 行,未超阈值 ✅`);
}

// ── 输出 ─────────────────────────────────────────────────────────────
console.log('[render-gate] 年报渲染块存活守卫 (AST 级)');
for (const n of notes) console.log('   ', n);

if (failures.length > 0) {
  console.error('\n[render-gate] ❌ 年报渲染链存在断裂风险:');
  for (const f of failures) console.error('   · ' + f);
  console.error('\n[render-gate] 提醒:编译通过 ≠ 功能存在。请先修复以上项,再进入封仓流程。');
  process.exit(1);
}

console.log('[render-gate] ✅ 年报渲染链完整,未被注释/掏空。');
