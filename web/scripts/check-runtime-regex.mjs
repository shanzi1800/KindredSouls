#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 * 运行时正则体检 · V474
 * ═══════════════════════════════════════════════════════════════════════
 * 为什么需要这个脚本?
 *
 *   tsc 只能校验「正则字面量」:  /(abc/
 *   它【看不见】字符串拼出来的正则:  new RegExp('(' + X + ')')
 *
 *   于是产生了一类极隐蔽的幽灵 Bug —— 编译期全绿、打包无警告、
 *   一旦运行到那一行就抛 SyntaxError: Unterminated group,
 *   把整条渲染链拦腰打断。
 *
 *   V473 修掉的是 15 处「正则字面量」的坏括号;
 *   V474 才发现真正打断年报渲染的是字符串构造的正则:
 *     web/src/lib/yearly-report-parser.ts 里
 *     new RegExp('(([^)\n]*?)(\s*)(?=\n|$)')  ← 少一个右括号,运行时必抛
 *
 * 本脚本用 TypeScript AST 精确定位所有 RegExp 构造点,并且:
 *   · 只对「纯字符串字面量(可用 + 折叠)」的 pattern 做静态校验,
 *     含变量的动态拼接一律跳过(不误报);
 *   · 折叠后真的 new RegExp(pattern, flags) 一次,复现运行时行为。
 *
 * 退出码: 0 = 全绿; 1 = 存在运行时会抛异常的正则构造点。
 * ═══════════════════════════════════════════════════════════════════════
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(WEB_ROOT, 'src');
const SKIP = /node_modules|\.git|dist|__pycache__|\.backup|\.bak/;
const EXTS = /\.(ts|tsx|js|mjs|cjs)$/;

function collect(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (SKIP.test(full)) continue;
    if (entry.isDirectory()) collect(full, acc);
    else if (EXTS.test(entry.name)) acc.push(full);
  }
  return acc;
}

function scriptKindOf(file) {
  if (file.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (file.endsWith('.ts')) return ts.ScriptKind.TS;
  if (file.endsWith('.mjs')) return ts.ScriptKind.JS;
  return ts.ScriptKind.JS;
}

/**
 * 尝试把表达式折叠成一个字符串字面量。折叠不了(含变量/模板插值)返回 null。
 * 只有能折叠的才做校验 —— 这是避免误报的关键。
 */
function foldString(node) {
  if (!node) return null;
  const k = node.kind;
  if (k === ts.SyntaxKind.StringLiteral) return node.text;
  if (k === ts.SyntaxKind.NoSubstitutionTemplateLiteral) return node.text;
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const l = foldString(node.left);
    const r = foldString(node.right);
    if (l === null || r === null) return null;
    return l + r;
  }
  return null;
}

function isRegExpCtor(node) {
  const isNew = ts.isNewExpression(node);
  const isCall = ts.isCallExpression(node);
  if (!isNew && !isCall) return false;
  const callee = node.expression;
  if (!callee) return false;
  if (ts.isIdentifier(callee) && callee.text === 'RegExp') return true;
  if (ts.isPropertyAccessExpression(callee) && callee.name && callee.name.text === 'RegExp') return true;
  return false;
}

const files = collect(SRC_DIR);
const sites = [];
const invalid = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKindOf(file));

  const walk = (node) => {
    if (isRegExpCtor(node)) {
      const args = node.arguments || [];
      const pattern = foldString(args[0]);
      const flags = foldString(args[1]) ?? '';
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      const rel = path.relative(WEB_ROOT, file);

      if (pattern === null) {
        sites.push({ rel, line, kind: 'dynamic-skip' });
      } else {
        let error = null;
        try {
          new RegExp(pattern, flags);
        } catch (e) {
          error = e.message;
        }
        sites.push({ rel, line, kind: error ? 'INVALID' : 'ok', pattern, flags, error });
        if (error) invalid.push({ rel, line, pattern, flags, error });
      }
    }
    ts.forEachChild(node, walk);
  };
  walk(sf);
}

const okCount = sites.filter((s) => s.kind === 'ok').length;
const dynamicCount = sites.filter((s) => s.kind === 'dynamic-skip').length;

console.log('[regex-gate] 扫描文件数:', files.length);
console.log('[regex-gate] RegExp 构造点:', sites.length,
  `(静态可校验 ${okCount} · 动态拼接跳过 ${dynamicCount} · 非法 ${invalid.length})`);

if (dynamicCount > 0) {
  console.log('[regex-gate] 以下动态拼接点无法静态校验(仅提示):');
  for (const s of sites.filter((x) => x.kind === 'dynamic-skip')) {
    console.log(`   · ${s.rel}:${s.line}`);
  }
}

if (invalid.length > 0) {
  console.error('\n[regex-gate] ❌ 发现运行时会抛异常的正则构造点 —— 编译期看不见,运行时必崩:');
  for (const s of invalid) {
    console.error(`   · ${s.rel}:${s.line}`);
    console.error(`     pattern = ${JSON.stringify(s.pattern)}   flags = ${JSON.stringify(s.flags)}`);
    console.error(`     error   = ${s.error}`);
  }
  console.error('\n[regex-gate] 修法:改正则本体,或改用字符串操作替代;禁止留残缺括号。');
  process.exit(1);
}

console.log('[regex-gate] ✅ 运行时可构造性体检通过,无地雷。');
