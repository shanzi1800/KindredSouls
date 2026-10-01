// V488d 前置：多批「审计探针命中」的噪声带分析（解决「单批无分辨力」问题）
//
// 用法: node test/tools/analyze_probe_noise.mjs <批次目录=标签> [<目录=标签> ...]
//   例: node test/tools/analyze_probe_noise.mjs /tmp/v489sample=v500 /tmp/v489sample2=v501 \
//                                              /tmp/v489noise_b1=v501-b1 /tmp/v489noise_b2=v501-b2
//
// 背景（军师的工程纪律）:
//   单批 20 盘的命中数没有分辨力 —— 告警是**离散小计数**，泊松 SE≈√N。
//   20 盘合计 10~11 处时 SE≈3.3~4.6 ⇒ 差 1~2 处仅 0.2~0.4σ，属噪声。
//   「命中盘随机替换」（旧盘归零 + 新盘出现）更符合随机换盘假说，而非定向改善。
//   ⇒ 结论必须建立在**多批同版本**的分布带上，而不是两批之差。
//
// 输出:
//   ① 逐批明细（有效盘 / 二级 / 三级 / 合计 / 命中盘数 / 命中盘名单）
//   ② 分组统计（按标签: 均值、样本标准差、极差、最小值~最大值）
//   ③ 「改动真有效」的判定口径: 新标签的 max ≤ 旧标签的 min，才算脱离噪声带
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!args.length) {
  console.error('用法: node test/tools/analyze_probe_noise.mjs <目录=标签> [<目录=标签> ...]');
  process.exit(2);
}

const batches = [];
for (const a of args) {
  const [dir, label] = a.includes('=') ? a.split('=') : [a, path.basename(a)];
  let rows;
  try { rows = JSON.parse(fs.readFileSync(path.join(dir, 'results.json'), 'utf8')); }
  catch (e) { console.error(`⚠️ 跳过 ${dir}: ${e.message}`); continue; }
  const valid = rows.filter((r) => r.httpStatus === 200 && r.chars > 5000);
  const w2 = valid.reduce((s, r) => s + ((r.audit && r.audit.warn2) || 0), 0);
  const w3 = valid.reduce((s, r) => s + ((r.audit && r.audit.warn3) || 0), 0);
  const fx = valid.reduce((s, r) => s + ((r.audit && r.audit.fixed) || 0), 0);
  const hit = valid.filter((r) => r.audit && (r.audit.warn2 + r.audit.warn3) > 0);
  const missMonth = valid.filter((r) => r.headsSun !== 12 || r.months !== 12);
  batches.push({
    label, dir, n: valid.length, w2, w3, total: w2 + w3, fx,
    hitPlates: hit.length, hitNames: hit.map((r) => `${r.name}(${r.audit.warn2}+${r.audit.warn3})`),
    done: valid.every((r) => r.hasDone), missMonth: missMonth.length,
    chars: valid.map((r) => r.chars),
  });
}

// ── ① 逐批明细 ──
console.log('='.repeat(118));
console.log('① 逐批明细（探针 = V488 审计, 只检不改）');
console.log('批次'.padEnd(14) + '有效盘  二级  三级  合计   命中盘  命中盘名单');
for (const b of batches) {
  console.log(`${b.label.padEnd(14)}${String(b.n).padStart(4)}  ${String(b.w2).padStart(4)}  ${String(b.w3).padStart(4)}  `
    + `${String(b.total).padStart(4)}   ${String(b.hitPlates).padStart(4)}/${b.n}   ${b.hitNames.join(' ') || '—'}`);
}

// ── ② 分组统计 ──
console.log('\n' + '='.repeat(118));
console.log('② 按标签分组（同标签多批 ⇒ 该版本的 run-to-run 噪声带）');
const groups = new Map();
for (const b of batches) {
  if (!groups.has(b.label)) groups.set(b.label, []);
  groups.get(b.label).push(b);
}
const stat = (xs) => {
  if (!xs.length) return null;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = xs.length > 1
    ? Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)) : 0;
  return { m, sd, min: Math.min(...xs), max: Math.max(...xs), n: xs.length };
};
console.log('标签'.padEnd(14) + '批数  合计(均值±SD)        极差     命中盘数(均值)  缺月   [DONE]');
for (const [label, bs] of groups) {
  const s = stat(bs.map((b) => b.total));
  const sh = stat(bs.map((b) => b.hitPlates));
  console.log(`${label.padEnd(14)}${String(bs.length).padStart(4)}  `
    + `${s.m.toFixed(1)} ± ${s.sd.toFixed(1)}`.padEnd(22)
    + `${s.min}~${s.max}`.padEnd(9)
    + `  ${sh.m.toFixed(1)}/${bs[0].n}`.padEnd(16)
    + `  ${bs.reduce((a, b) => a + b.missMonth, 0)}     ${bs.every((b) => b.done) ? 'Y' : 'N'}`);
}

// ── ③ 分辨力判定 ──
console.log('\n' + '='.repeat(118));
console.log('③ 判定口径（避免拿两批之差当结论）');
const labels = [...groups.keys()];
for (let i = 0; i < labels.length; i++) {
  for (let j = i + 1; j < labels.length; j++) {
    const A = groups.get(labels[i]).map((b) => b.total);
    const B = groups.get(labels[j]).map((b) => b.total);
    const sa = stat(A), sb = stat(B);
    const se = Math.sqrt(sa.m + sb.m);                      // 两组小计数之差的标准误（泊松近似）
    const d = sb.m - sa.m;
    // ⚠️ 自校验发现的坑: 单批时 max===min, 会假报「分布带不重叠」⇒ 必须要求两组各 ≥2 批
    const enough = groups.get(labels[i]).length >= 2 && groups.get(labels[j]).length >= 2;
    const sep = !enough ? '⚠️ 单批无法判分布带（需同版本 ≥2 批）'
      : ((sa.max <= sb.min || sb.max <= sa.min) ? '✅ 分布带不重叠' : '❌ 分布带重叠 ⇒ 无分辨力');
    console.log(`${labels[i]} (${A.join(',')}) vs ${labels[j]} (${B.join(',')}): 差 ${d >= 0 ? '+' : ''}${d.toFixed(1)}`
      + ` · 差的标准误≈${se.toFixed(1)} ⇒ ${Math.abs(se) ? (Math.abs(d) / se).toFixed(2) : '∞'}σ ｜ ${sep}`);
  }
}
const anyMulti = [...groups.values()].some((bs) => bs.length > 1);
if (!anyMulti) console.log('⚠️ 任一标签只有 1 批 ⇒ 无法计算 run-to-run 噪声带（至少需要同版本 2 批）');
