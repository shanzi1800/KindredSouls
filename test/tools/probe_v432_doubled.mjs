// 聚焦探针: 复现 _v432LockTransit 的「座座」重字注入
// 用法: node test/tools/probe_v432_doubled.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { getAstroMatrix } from '../../v69_client.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

const SEEDS = ['_v432LockTransit', '_v432PatchZone', '_v432FindHouse', '_v432Signs', '_v432Truth',
  '_v432AllSignWords', '_v432TransitClause', '_v432IngressDay', '_v432Esc', '_v432Normalize',
  '_V432_CFG', '_EN2ZIDX', 'SIGN_ORDER_ZH', 'getSignToHouseMap'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) {
  try { new vm.Script(map.get(n)); } catch (e) { dropped.push(n + ': ' + e.message.slice(0, 40)); map.delete(n); }
}
const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext(
  [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map(e => e[1]).join('\n\n')
  + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'),
  ctx,
);
const F = ctx.__exports;
console.log('缺失:', SEEDS.filter(n => ctx[n] === undefined && F[n] === undefined).join(', ') || '无', '| 剔除:', dropped.join(' | ') || '无');

const M = await getAstroMatrix('1989-08-15', '14:30', 69.6492, 18.9553, 'Europe/Oslo');

// 打印真值（每月太阳/各行星）
try {
  const truth = F._v432Truth('zh', M, 'transit');
  console.log('transit truth:', JSON.stringify(truth));
} catch (e) { console.log('truth 取值失败:', e.message); }

const CASES = [
  '# 2027年5月：太阳在狮子座第7宫 · 合作共赢',
  '# 火元素：白羊座第10宫的事业加冕',
  '**以木星白羊座第十宫的扩张能量为主轴，以土星摩羯座第六宫的纪律要求为底线，以冥王星水瓶座第四宫的深度转化为根基。**',
  '2027年5月，太阳进入狮子座第7宫，合作契机浮现。',
];

for (const c of CASES) {
  let out;
  try { out = F._v432LockTransit(c, 'zh', M); } catch (e) { out = 'THROW: ' + e.message; }
  console.log('\nIN : ' + c);
  console.log('OUT: ' + out);
  if (out !== c) console.log('  ⚠️ 变化');
}
