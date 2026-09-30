// V480 验证探针：用真实产物跑 normalizeYearlyMarkup，落盘供前端解析器复验
// 用法: node test/tools/probe_v480_normalize.mjs [/tmp/ks_prod_zh.txt] [lang]
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const file = process.argv[2] || '/tmp/ks_prod_zh.txt';
const lang = process.argv[3] || 'zh';

const SEEDS = ['normalizeYearlyMarkup'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) {
  try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}: ${e.message.slice(0, 60)}`); map.delete(n); }
}
console.log(`已提取 ${map.size} 个声明${dropped.length ? `; 剔除 ${dropped.length} → ${dropped.join(' | ')}` : ''}`);
console.log(`缺失: ${SEEDS.filter((n) => !map.has(n)).join(', ') || '无'}`);

const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext(
  [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map((e) => e[1]).join('\n\n')
  + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'),
  ctx,
);
const F = ctx.__exports;

const raw = fs.readFileSync(file, 'utf8');
const out = F.normalizeYearlyMarkup(raw, lang, 'yearly');
const outFile = file.replace(/\.txt$/, `_norm_${lang}.txt`);
fs.writeFileSync(outFile, out);
console.log(`\n${file} ${raw.length} 字 → ${outFile} ${out.length} 字`);

console.log('\n===== 归一后标题行 =====');
for (const ln of out.split('\n')) {
  if (/^\s*>?\s*#{1,6}\s/.test(ln)) console.log(ln.slice(0, 100));
}
console.log('\n===== 归一后前 10 行 =====');
out.split('\n').slice(0, 10).forEach((ln, i) => console.log(`${String(i + 1).padStart(2)}| ${ln.slice(0, 100)}`));
console.log('\n拉丁词残留:', [...new Set((out.match(/[A-Za-z]{2,}/g) || []))].join(' '));
console.log('幂等检查:', F.normalizeYearlyMarkup(out, lang, 'yearly') === out ? '✅ 幂等' : '❌ 非幂等');
console.log('月报护栏:', F.normalizeYearlyMarkup(raw, lang, 'monthly') === raw ? '✅ 原样返回' : '❌ 被污染');
