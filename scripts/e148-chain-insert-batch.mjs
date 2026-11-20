/* E148-刀五：插链（e147 段后）＋计数批刷（115→116 绝对数 / node-only 114→115）
 * 铁律 4：纯字符串精确替换（勿用正则）；批刷后独立复核目标值形态（只看值参不看消息串）。 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const fs = { readFileSync, writeFileSync, readdirSync };
const path = { join, dirname: (p) => dirname(p) };
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ── ① package.json 插链（e147 后、e40-compat 前）── */
const PKG_PATH = join(ROOT, 'package.json');
const pkgRaw = fs.readFileSync(PKG_PATH, 'utf8');
const ANCHOR = 'node --test test/audit-e147-seasonal-guard.test.mjs';
const INSERT = ' && node --test test/audit-e148-tarot-daily-sanctuary.test.mjs';
if (!pkgRaw.includes(INSERT.trim())) {
  const i = pkgRaw.indexOf(ANCHOR);
  if (i === -1) throw new Error('e147 锚缺失');
  const next = pkgRaw.indexOf(ANCHOR, i + ANCHOR.length);
  if (next !== -1) throw new Error('e147 锚非唯一');
  const out = pkgRaw.slice(0, i + ANCHOR.length) + INSERT + pkgRaw.slice(i + ANCHOR.length);
  fs.writeFileSync(PKG_PATH, out);
  console.log('① 插链完成：e148 段紧随 e147 后');
} else {
  console.log('① e148 段已在链上（幂等跳过）');
}

/* ── ② 计数批刷：绝对数 115→116（值参形态四族）── */
const TEST_DIR = join(ROOT, 'test');
const files = fs.readdirSync(TEST_DIR).filter((f) => /\.test\.mjs$/.test(f));
const ABS_FORMS = [
  ['parts.length, 115,', 'parts.length, 116,'],
  ['segs.length, 115,', 'segs.length, 116,'],
  ['all.length, 115,', 'all.length, 116,'],
  ['chain.length, 115,', 'chain.length, 116,'],
];
const NODE_FORMS = [
  ['segs.length, 114,', 'segs.length, 115,'],      // e140（node --test 段口径）
  ['nodeOnly.length, 114,', 'nodeOnly.length, 115,'], // e141/e144/e145/e146/e147
];
let absHits = 0, nodeHits = 0;
const touched = [];
for (const f of files) {
  const p = join(TEST_DIR, f);
  let s = fs.readFileSync(p, 'utf8');
  let changed = false;
  for (const [from, to] of ABS_FORMS) {
    const n = s.split(from).length - 1;
    if (n > 0) { s = s.split(from).join(to); absHits += n; changed = true; }
  }
  for (const [from, to] of NODE_FORMS) {
    const n = s.split(from).length - 1;
    if (n > 0) { s = s.split(from).join(to); nodeHits += n; changed = true; }
  }
  if (changed) { fs.writeFileSync(p, s); touched.push(f); }
}
console.log(`② 批刷完成：绝对数 115→116 共 ${absHits} 处；node-only 114→115 共 ${nodeHits} 处`);
console.log('   触及文件:', touched.join(', '));
