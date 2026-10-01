// 从 server.js 抽取顶层声明切片（能正确跳过字符串/模板/注释/正则中的括号）
// 供 harness_*.mjs 做离线逐刀复现用。
import fs from 'node:fs';

/** 从 pos 处的开括号开始，返回配平的结束下标(闭括号位置+1)。跳过字符串/模板/注释/正则 */
export function matchBracket(s, openPos) {
  const open = s[openPos];
  const close = open === '{' ? '}' : open === '(' ? ')' : ']';
  let depth = 0;
  for (let i = openPos; i < s.length; i++) {
    const c = s[i];
    // 行注释
    if (c === '/' && s[i + 1] === '/') { const nl = s.indexOf('\n', i); i = nl < 0 ? s.length : nl; continue; }
    // 块注释
    if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 1; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      for (i++; i < s.length; i++) {
        if (s[i] === '\\') { i++; continue; }
        if (q === '`' && s[i] === '$' && s[i + 1] === '{') { i = matchBracket(s, i + 1) - 1; continue; }
        if (s[i] === q) break;
      }
      continue;
    }
    // 正则字面量: 仅在前一个有效 token 是运算符/括号/逗号/关键字时判定为除法还是正则
    if (c === '/') {
      const prev = s.slice(Math.max(0, i - 40), i).match(/([A-Za-z0-9_$)\]])\s*$/);
      if (!prev) { // 视为正则字面量
        for (i++; i < s.length; i++) {
          if (s[i] === '\\') { i++; continue; }
          if (s[i] === '[') { while (i < s.length && s[i] !== ']') { if (s[i] === '\\') i++; i++; } continue; }
          if (s[i] === '/') break;
        }
        continue;
      }
      continue;
    }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return i + 1; }
  }
  return s.length;
}

/** 抽取顶层 function / const|let|var 声明: Map<name, sourceSlice> */
export function indexDecls(s) {
  const decls = new Map();
  let m;
  const fnRe = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;
  while ((m = fnRe.exec(s))) {
    const start = m.index;
    // 🛡️ V483d: 先配平**参数括号**再找 body 大括号 —— 否则默认参数里的 `= {}` 会被误当 body 起点,
    //   切片截断成 `async function f(x = {})`(safeFetch 首当其冲)。
    const pi = fnRe.lastIndex - 1; // fnRe 吃掉了函数名后的 `(`
    if (pi < 0 || s[pi] !== '(') continue;
    const closeParams = matchBracket(s, pi);
    const bi = s.indexOf('{', closeParams);
    if (bi < 0) continue;
    decls.set(m[1], s.slice(start, matchBracket(s, bi)));
  }
  const varRe = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm;
  while ((m = varRe.exec(s))) {
    const start = m.index;
    let i = varRe.lastIndex;
    // 跳到语句结束: 顶层(不在任何括号内)的分号或换行
    const scanEnd = (from) => {
      let d = 0;
      for (let j = from; j < s.length; j++) {
        const c = s[j];
        if (c === '/' && s[j + 1] === '/') { const nl = s.indexOf('\n', j); j = nl < 0 ? s.length : nl; continue; }
        if (c === '/' && s[j + 1] === '*') { const e = s.indexOf('*/', j + 2); j = e < 0 ? s.length : e + 1; continue; }
        if (c === '"' || c === "'" || c === '`') {
          const q = c;
          for (j++; j < s.length; j++) {
            if (s[j] === '\\') { j++; continue; }
            if (q === '`' && s[j] === '$' && s[j + 1] === '{') { j = matchBracket(s, j + 1) - 1; continue; }
            if (s[j] === q) break;
          }
          continue;
        }
        if (c === '{' || c === '(' || c === '[') { j = matchBracket(s, j) - 1; continue; }
        if (c === ';') return j + 1;
        if (c === '\n') {
          const rest = s.slice(j + 1, j + 240);
          if (/^\s*(?:\?|:|&&|\|\||\+|\.|\]|\)|,)/.test(rest)) continue;
          return j;
        }
      }
      return s.length;
    };
    const end = scanEnd(i);
    if (!decls.has(m[1])) decls.set(m[1], s.slice(start, end));
  }
  return decls;
}

/** 按 seed 名称做传递闭包, 并按源码顺序返回切片 */
export function closureDecls(src, seeds, external = []) {
  const decls = indexDecls(src);
  const EXT = new Set(['console', 'JSON', 'Math', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'RegExp',
    'Set', 'Map', 'WeakMap', 'Promise', 'Error', 'TypeError', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
    'encodeURIComponent', 'decodeURIComponent', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
    'undefined', 'NaN', 'Infinity', 'process', 'Buffer', 'fetch', 'URL', 'URLSearchParams', 'structuredClone',
    'Symbol', 'Intl', 'BigInt', 'Function', 'Reflect', 'Proxy', 'globalThis', 'AbortController', 'TextEncoder',
    'TextDecoder', 'Uint8Array', 'require', 'module', 'exports', 'import', 'meta', ...external]);
  const picked = new Map();
  const queue = [...seeds];
  while (queue.length) {
    const name = queue.shift();
    if (picked.has(name) || EXT.has(name)) continue;
    const body = decls.get(name);
    if (!body) continue;
    picked.set(name, body);
    for (const id of body.match(/\b[A-Za-z_$][\w$]*\b/g) || []) if (!picked.has(id) && decls.has(id)) queue.push(id);
  }
  const ordered = [...picked.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]));
  return { map: new Map(ordered), source: ordered.map(e => e[1]).join('\n\n'), names: ordered.map(e => e[0]) };
}

export function readServer(root) {
  return fs.readFileSync(new URL('../../server.js', import.meta.url), 'utf8');
}
