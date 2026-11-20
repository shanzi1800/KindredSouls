/* E148-刀五：链位深偏移对账重写（`X.length - N` 尾锚形态——E147 血训同型）
 * 铁律 4：纯字符串精确替换；批刷后独立复核目标值形态（只看值参不看消息串）。 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const chain = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts['test:astro'];
const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
const LEN = segs.length;

/* 行内可识别的段标识 → 实际链位（audit-eXXX 全名或 includes('eXXX') 裸名两种形态） */
const segIndex = (token) => {
  const m = /audit-(e\d+[a-z0-9-]*?)-?[.\s]/.exec(token) || /audit-(e\d+[a-z0-9-]*)/.exec(token)
    || /includes\('(e\d+[a-z0-9-]*)'\)/.exec(token);
  if (!m) return -1;
  const name = m[1];
  return segs.findIndex((s) => s.includes('audit-' + name));
};

const files = readdirSync(join(ROOT, 'test')).filter((f) => /\.test\.mjs$/.test(f));
let total = 0;
const touched = [];
for (const f of files) {
  const p = join(ROOT, 'test', f);
  const src = readFileSync(p, 'utf8');
  const lines = src.split('\n');
  let changed = false;
  lines.forEach((line, i) => {
    // 形态：parts[parts.length - 36] / segs[segs.length - 12] / all[all.length - 3] ...
    const re = /(\w+)\[\1\.length - (\d+)\]/g;
    let m;
    while ((m = re.exec(line)) !== null) {
      const oldN = Number(m[2]);
      const idx = segIndex(line);
      if (idx === -1 || idx >= LEN - 2) continue; // 解析不出段名或尾锚自稳（len-1/len-2）⇒ 不动
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
  if (changed) { writeFileSync(p, lines.join('\n')); touched.push(f); }
}
console.log(`对账重写完成：${total} 处（链长 ${LEN}）`);
console.log('触及文件:', touched.join(', ') || '(无)');
