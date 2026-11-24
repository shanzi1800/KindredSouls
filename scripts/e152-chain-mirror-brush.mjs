/**
 * e152-chain-mirror-brush.mjs —— E152 插链（119→120）镜像锚全目录批刷
 * 铁律 3：批刷一律落 JS 文件执行（纯字符串精确替换，非正则）。
 * 刷则（值参，消息串不动——批刷复核只看值参不看消息串）：
 *   R1 segs.length 119→120（segs=全段的闸门）
 *   R2 all.length   119→120
 *   R3 nodeOnly.length 118→119
 *   R4 segs.length  118→119（segs=node 段的闸门，如 e140）
 *   E1~E7 尾位锚整体 +1 位移（e104~e110 距链尾偏移；e152 插在 e40-compat 之前）
 * 运行：node scripts/e152-chain-mirror-brush.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'test');

const RULES = [
  ['R1 segs,119→120', 'assert.equal(segs.length, 119', 'assert.equal(segs.length, 120'],
  ['R2 all,119→120', 'assert.equal(all.length, 119', 'assert.equal(all.length, 120'],
  ['R3 nodeOnly,118→119', 'assert.equal(nodeOnly.length, 118', 'assert.equal(nodeOnly.length, 119'],
  ['R4 segs,118→119', 'assert.equal(segs.length, 118', 'assert.equal(segs.length, 119'],
  ['E1 e104 len-43→-44', "segs[segs.length - 43].includes('audit-e104')", "segs[segs.length - 44].includes('audit-e104')"],
  ['E2 e105 len-42→-43', "segs[segs.length - 42].includes('audit-e105')", "segs[segs.length - 43].includes('audit-e105')"],
  ['E3 e106 len-41→-42', "segs[segs.length - 41].includes('audit-e106')", "segs[segs.length - 42].includes('audit-e106')"],
  ['E4 e107 len-40→-41', "segs[segs.length - 40].includes('audit-e107')", "segs[segs.length - 41].includes('audit-e107')"],
  ['E5 e108 len-39→-40', "segs[segs.length - 39].includes('audit-e108')", "segs[segs.length - 40].includes('audit-e108')"],
  ['E6 e109 len-38→-39', "segs[segs.length - 38].includes('audit-e109')", "segs[segs.length - 39].includes('audit-e109')"],
  ['E7 e110 len-37→-38', "segs[segs.length - 37].includes('audit-e110')", "segs[segs.length - 38].includes('audit-e110')"],
];

const totals = new Map(RULES.map(([n]) => [n, 0]));
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.test.mjs')).sort();
for (const f of files) {
  const fp = path.join(DIR, f);
  let s = fs.readFileSync(fp, 'utf8');
  let touched = 0;
  for (const [name, from, to] of RULES) {
    const n = s.split(from).length - 1;
    if (n > 0) { s = s.split(from).join(to); totals.set(name, totals.get(name) + n); touched += n; }
  }
  if (touched > 0) {
    fs.writeFileSync(fp, s);
    console.log(`  ${f}: ${touched} 处`);
  }
}
console.log('\n═══ 批刷汇总（值参）═══');
let sum = 0;
for (const [name, n] of totals) { console.log(`${name}: ${n}`); sum += n; }
console.log(`合计: ${sum} 处`);
