/* E155：插链（e153 段后、e40-compat 前）＋计数批刷（121→122 绝对数 / node-only 120→121）
 *      ＋链位深偏移对账重写（X[X.length - N] 尾锚——e151 同型）
 * 铁律 3/4：纯字符串精确替换（勿用正则）；幂等；批刷后独立复核目标值形态（只看值参不看消息串）。 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(p, 'utf8');
const write = (p, s) => writeFileSync(p, s);

/* ── ① package.json 插链 ── */
const PKG_PATH = join(ROOT, 'package.json');
const pkgRaw = read(PKG_PATH);
const ANCHOR = 'node --test test/audit-e153-multilang-purge.test.mjs';
const INSERT = ' && node --test test/audit-e155-resonance-code.test.mjs';
if (!pkgRaw.includes(INSERT.trim())) {
  const i = pkgRaw.indexOf(ANCHOR);
  if (i === -1) throw new Error('e153 锚缺失');
  if (pkgRaw.indexOf(ANCHOR, i + ANCHOR.length) !== -1) throw new Error('e153 锚非唯一');
  write(PKG_PATH, pkgRaw.slice(0, i + ANCHOR.length) + INSERT + pkgRaw.slice(i + ANCHOR.length));
  console.log('① 插链完成：e155 段紧随 e153 后');
} else {
  console.log('① e155 段已在链上（幂等跳过）');
}

/* ── ② 计数批刷：绝对数 121→122 ＋ node-only 120→121（只改值参，不碰消息串）── */
const TEST_DIR = join(ROOT, 'test');
const files = readdirSync(TEST_DIR).filter((f) => /\.test\.mjs$/.test(f));
const ABS_FORMS = ['parts', 'segs', 'all', 'chain'].map((v) => [`${v}.length, 121,`, `${v}.length, 122,`]);
const NODE_FORMS = ['segs', 'nodeOnly'].map((v) => [`${v}.length, 120,`, `${v}.length, 121,`]);
let absHits = 0, nodeHits = 0;
const touched = [];
for (const f of files) {
  if (f === 'audit-e155-resonance-code.test.mjs') continue;
  const p = join(TEST_DIR, f);
  let s = read(p);
  let changed = false;
  for (const [from, to] of ABS_FORMS) { const n = s.split(from).length - 1; if (n > 0) { s = s.split(from).join(to); absHits += n; changed = true; } }
  for (const [from, to] of NODE_FORMS) { const n = s.split(from).length - 1; if (n > 0) { s = s.split(from).join(to); nodeHits += n; changed = true; } }
  if (changed) { write(p, s); touched.push(f); }
}
console.log(`② 批刷完成：绝对数 121→122 共 ${absHits} 处；node-only 120→121 共 ${nodeHits} 处`);
console.log('   触及文件数:', touched.length);

/* ── ③ 链位深偏移对账重写（按实际链位重算 N 值——e155 插入点之后整体 +1）── */
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
  if (f === 'audit-e155-resonance-code.test.mjs') continue;
  const p = join(TEST_DIR, f);
  const lines = read(p).split('\n');
  let changed = false;
  lines.forEach((line, i) => {
    const re = /(\w+)\[\1\.length - (\d+)\]/g;
    let m;
    const idx = segIndex(line);
    if (idx === -1 || idx >= LEN - 2) return;
    const newN = LEN - idx;
    while ((m = re.exec(line)) !== null) {
      const oldN = Number(m[2]);
      if (newN === oldN) continue;
      const oldLit = `${m[1]}[${m[1]}.length - ${oldN}]`;
      const newLit = `${m[1]}[${m[1]}.length - ${newN}]`;
      lines[i] = lines[i].split(oldLit).join(newLit);
      console.log(`${f}:${i + 1}: ${oldLit} → ${newLit}`);
      total += 1;
      changed = true;
    }
  });
  if (changed) { write(p, lines.join('\n')); touched2.push(f); }
}
console.log(`③ 深偏移对账重写完成：${total} 处（链长 ${LEN}）`);
console.log('触及文件数:', touched2.length);
