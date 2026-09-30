// 离线复现：把 server.js 流式五连刀提取出来，对干净夹具逐刀测 CJK 存活率
// 用法: node test/tools/harness_chain.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

// ── 顶层声明索引 ──
function indexDecls(s) {
  const decls = new Map(); // name -> source slice
  // function 声明
  const fnRe = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  let m;
  while ((m = fnRe.exec(s))) {
    const start = m.index;
    const braceIdx = s.indexOf('{', fnRe.lastIndex);
    if (braceIdx < 0) continue;
    let i = braceIdx, depth = 0, j = i;
    for (; j < s.length; j++) {
      if (s[j] === '{') depth++;
      else if (s[j] === '}') { depth--; if (depth === 0) break; }
    }
    decls.set(m[1], s.slice(start, j + 1));
  }
  // const/let/var 顶层声明（按行起点匹配，括号/花括号配平到语句结束）
  const varRe = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm;
  while ((m = varRe.exec(s))) {
    const start = m.index;
    let i = varRe.lastIndex, depth = 0, j = i;
    for (; j < s.length; j++) {
      const c = s[j];
      if (c === '{' || c === '(' || c === '[') depth++;
      else if (c === '}' || c === ')' || c === ']') { depth--; if (depth < 0) break; }
      else if (c === ';' && depth === 0) { j++; break; }
      else if (c === '\n' && depth === 0) {
        // 无分号风格：看下一行是否以运算符/续行开头
        const rest = s.slice(j + 1, j + 200);
        if (/^\s*(?:\?|:|&&|\|\||\+|\.|\]|\))/.test(rest)) continue;
        break;
      }
    }
    if (!decls.has(m[1])) decls.set(m[1], s.slice(start, Math.min(j + 1, start + 20000)));
  }
  return decls;
}

const decls = indexDecls(src);
const IDENT_RE = /\b[A-Za-z_$][\w$]*\b/g;

function closureFrom(seeds) {
  const picked = new Map();
  const queue = [...seeds];
  // 已知外部提供的名称，不需要内部提取
  const EXTERNAL = new Set(['getSignToHouseMap', 'SIGN_ORDER_ZH', 'console', 'JSON', 'Math', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Set', 'Map', 'Promise', 'Error', 'parseInt', 'parseFloat', 'isNaN', 'encodeURIComponent', 'decodeURIComponent', 'setTimeout', 'clearTimeout', 'undefined', 'null', 'true', 'false', 'require', 'process', 'Buffer', 'fetch', 'URL', 'structuredClone', 'Symbol', 'Intl', 'BigInt']);
  while (queue.length) {
    const name = queue.shift();
    if (picked.has(name) || EXTERNAL.has(name)) continue;
    const body = decls.get(name);
    if (!body) continue; // 未找到 = 外部/未定义，交给 vm 运行时报错暴露
    picked.set(name, body);
    for (const id of body.match(IDENT_RE) || []) {
      if (!picked.has(id) && decls.has(id)) queue.push(id);
    }
  }
  return picked;
}

function buildContext(seeds) {
  const picked = closureFrom(seeds);
  const ctx = {
    getSignToHouseMap, SIGN_ORDER_ZH, console,
    setTimeout, clearTimeout, Buffer, process,
    __exports: {},
  };
  vm.createContext(ctx);
  const code = [...picked.values()].join('\n\n') + '\n' + seeds.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n');
  vm.runInContext(code, ctx);
  return { ctx, picked };
}

let picked, ctx;
try {
  ({ ctx, picked } = buildContext([
    'final_text_sanitizer', 'astro_phase_linter', 'natal_sun_linter',
    'house_linter', 'applyMonthLockSanitizer', 'stripLoneSurrogates',
  ]));
} catch (e) {
  console.error('提取失败:', e.message);
  // 打印 vm 报错行附近代码便于修
  process.exit(1);
}

console.log(`已提取 ${picked.size} 个顶层声明: ${[...picked.keys()].join(', ')}`);

const F = ctx.__exports;
for (const n of ['final_text_sanitizer', 'astro_phase_linter', 'natal_sun_linter', 'house_linter', 'applyMonthLockSanitizer']) {
  if (typeof F[n] !== 'function') console.warn(`⚠️ ${n} 未取到 (type=${typeof F[n]})`);
}

// ── 夹具 + astroMatrix 桩 ──
const fixture = fs.readFileSync(path.join(ROOT, 'test/fixtures/yearly-zh-clean-sample.txt'), 'utf8');
const cjk = (s) => (s.match(/[\u4e00-\u9fff]/g) || []).length;

// astroMatrix 桩：months 用真实星盘结构的最小版本（12 个月，太阳各星座）
const ZS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const months = ZS.map((s, i) => ({ sun: { sign: s, house: (i % 12) + 1 }, sign: s, house: (i % 12) + 1 }));
const astroMatrix = { meta: { rising_sign: 'Sagittarius' }, months, computed_houses: {} };

console.log(`\n夹具 CJK = ${cjk(fixture)}`);

const steps = [
  ['final_text_sanitizer(text, Sagittarius, zh)', (t) => F.final_text_sanitizer(t, 'Sagittarius', 'zh')],
  ['astro_phase_linter', (t) => F.astro_phase_linter(t)],
  ['natal_sun_linter(text, Leo, Sagittarius)', (t) => F.natal_sun_linter(t, 'Leo', 'Sagittarius')],
  ['house_linter(text, astroMatrix)', (t) => F.house_linter(t, astroMatrix)],
  ['applyMonthLockSanitizer(text, astroMatrix, null, null, zh)', (t) => F.applyMonthLockSanitizer(t, astroMatrix, null, null, 'zh')],
];

let t = fixture;
for (const [label, fn] of steps) {
  let out;
  try {
    out = fn(t);
  } catch (e) {
    console.log(`  ✗ ${label} 抛出: ${e.message}`);
    continue;
  }
  const before = cjk(t), after = cjk(out);
  const flag = after >= before * 0.98 ? '✅' : '🔴 吃字!';
  console.log(`  ${flag} ${label}: CJK ${before} → ${after} (${(after / before * 100).toFixed(1)}%)`);
  t = out;
}
console.log(`\n全链后 CJK = ${cjk(t)} / 原始 ${cjk(fixture)} (${(cjk(t) / cjk(fixture) * 100).toFixed(1)}%)`);
console.log('\n前 300 字:', t.slice(0, 300));
