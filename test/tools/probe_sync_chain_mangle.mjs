// 逐函数复现同步路径收尾链, 定位「月标题被碾碎」的真凶
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(ROOT + '/server.js', 'utf8');
const input = fs.readFileSync(process.argv[2] || '/tmp/ks_run3.txt', 'utf8');
const { getSignToHouseMap, SIGN_ORDER_ZH } = await import(ROOT + '/astro-truth.js');

const ctxBase = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process };
function load(name) {
  const { map } = closureDecls(src, [name], ['console', 'getSignToHouseMap', 'SIGN_ORDER_ZH']);
  const ctx = { ...ctxBase, getSignToHouseMap, SIGN_ORDER_ZH, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext([...map.values()].join('\n\n') + `\n__exports.f = typeof ${name} !== 'undefined' ? ${name} : undefined;`, ctx);
  return ctx.__exports.f;
}

const heads = (t) => t.split('\n').filter((l) => /^\s*#{1,6}\s/.test(l) && /\d{4}年\d{1,2}月/.test(l));
const bad = (t) => heads(t).filter((l) => !/^#{1,6}\s\d{4}年\d{1,2}月/.test(l));

let text = input;
console.log(`输入文件: ${process.argv[2] || '/tmp/ks_run3.txt'}  (${input.length} 字)`);
console.log(`  月标题行 ${heads(text).length} 行, 异常形态 ${bad(text).length} 行\n`);

const CHAIN = [
  ['final_text_sanitizer', (f) => f(text, null, 'zh')],
  ['astro_phase_linter', (f) => f(text, null)],
  ['natal_sun_linter', (f) => f(text, '射手座', null)],
  ['house_linter', (f) => f(text, null)],
  ['cleanConsumerTrapAndBrackets', (f) => f(text)],
  ['cleanYearlyTimeline', (f) => f(text, 'zh')],
];

for (const [name, call] of CHAIN) {
  let f;
  try { f = load(name); } catch (e) { console.log(`${name.padEnd(30)} 抽取失败: ${e.message}`); continue; }
  if (typeof f !== 'function') { console.log(`${name.padEnd(30)} 未取到函数(可能是 const 声明或需参数)`); continue; }
  let out;
  try { out = call(f); } catch (e) { console.log(`${name.padEnd(30)} 调用抛: ${e.message}`); continue; }
  const b = bad(out);
  console.log(`${name.padEnd(30)} 月标题 ${String(heads(out).length).padStart(2)} 行, 异常 ${b.length} 行${b.length ? '  ← 真凶候选' : ''}`);
  for (const x of b.slice(0, 3)) console.log('        ' + x.trim().slice(0, 100));
}
