/* E151-刀四：插链（e150 段后）＋计数批刷（118→119 绝对数 / node-only 117→118）
 *          ＋链位深偏移对账重写（X.length - N 尾锚——e150 同型）
 * 铁律 4：纯字符串精确替换（勿用正则）；批刷后独立复核目标值形态（只看值参不看消息串）。 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(p, 'utf8');
const write = (p, s) => writeFileSync(p, s);

/* ── ① package.json 插链（e150 后、e40-compat 前）── */
const PKG_PATH = join(ROOT, 'package.json');
const pkgRaw = read(PKG_PATH);
const ANCHOR = 'node --test test/audit-e150-refresh-amnesia-gate.test.mjs';
const INSERT = ' && node --test test/audit-e151-luxe-rebrand.test.mjs';
if (!pkgRaw.includes(INSERT.trim())) {
  const i = pkgRaw.indexOf(ANCHOR);
  if (i === -1) throw new Error('e150 锚缺失');
  const next = pkgRaw.indexOf(ANCHOR, i + ANCHOR.length);
  if (next !== -1) throw new Error('e150 锚非唯一');
  write(PKG_PATH, pkgRaw.slice(0, i + ANCHOR.length) + INSERT + pkgRaw.slice(i + ANCHOR.length));
  console.log('① 插链完成：e151 段紧随 e150 后');
} else {
  console.log('① e151 段已在链上（幂等跳过）');
}

/* ── ② 计数批刷：绝对数 118→119 ＋ node-only 117→118（值参形态族）── */
const TEST_DIR = join(ROOT, 'test');
const files = readdirSync(TEST_DIR).filter((f) => /\.test\.mjs$/.test(f));
const ABS_FORMS = [
  ['parts.length, 118,', 'parts.length, 119,'],
  ['segs.length, 118,', 'segs.length, 119,'],
  ['all.length, 118,', 'all.length, 119,'],
  ['chain.length, 118,', 'chain.length, 119,'],
];
const NODE_FORMS = [
  ['segs.length, 117,', 'segs.length, 118,'],
  ['nodeOnly.length, 117,', 'nodeOnly.length, 118,'],
];
let absHits = 0, nodeHits = 0;
const touched = [];
for (const f of files) {
  const p = join(TEST_DIR, f);
  let s = read(p);
  let changed = false;
  for (const [from, to] of ABS_FORMS) {
    const n = s.split(from).length - 1;
    if (n > 0) { s = s.split(from).join(to); absHits += n; changed = true; }
  }
  for (const [from, to] of NODE_FORMS) {
    const n = s.split(from).length - 1;
    if (n > 0) { s = s.split(from).join(to); nodeHits += n; changed = true; }
  }
  if (changed) { write(p, s); touched.push(f); }
}
console.log(`② 批刷完成：绝对数 118→119 共 ${absHits} 处；node-only 117→118 共 ${nodeHits} 处`);
console.log('   触及文件:', touched.join(', ') || '(无)');

/* ── ③ 链位深偏移对账重写（按实际链位重算 N 值——e151 插入点之后整体 +1）── */
const chain = JSON.parse(read(PKG_PATH)).scripts['test:astro'];
const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
const LEN = segs.length;
const segIndex = (token) => {
  const m = /audit-(e\d+[a-z0-9-]*?)-?[.\s]/.exec(token) || /audit-(e\d+[a-z0-9-]*)/.exec(token)
    || /includes\('(e\d+[a-z0-9-]*)'\)/.exec(token);
  if (!m) return -1;
  return segs.findIndex((s) => s.includes('audit-' + m[1]));
};
let total = 0;
const touched2 = [];
for (const f of files) {
  const p = join(TEST_DIR, f);
  const src = read(p);
  const lines = src.split('\n');
  let changed = false;
  lines.forEach((line, i) => {
    const re = /(\w+)\[\1\.length - (\d+)\]/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      const oldN = Number(m[2]);
      const idx = segIndex(line);
      if (idx === -1 || idx >= LEN - 2) continue; // 解析不出段名或尾锚自稳 ⇒ 不动
      const newN = LEN - idx;
      if (newN !== oldN) {
        const oldLit = `${m[1]}[${m[1]}.length - ${oldN}]`;
        const newLit = `${m[1]}[${m[1]}.length - ${newN}]`;
        lines[i] = lines[i].split(oldLit).join(newLit);
        console.log(`${f}:${i + 1}: ${oldLit} → ${newLit}`);
        total += 1;
        changed = true;
      }
    }
  });
  if (changed) { write(p, lines.join('\n')); touched2.push(f); }
}
console.log(`③ 深偏移对账重写完成：${total} 处（链长 ${LEN}）`);
console.log('触及文件:', touched2.join(', ') || '(无)');
