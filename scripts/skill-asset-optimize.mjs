#!/usr/bin/env node
/**
 * skill-asset-optimize.mjs —— 视觉资产精修管线（E80）
 * ═══════════════════════════════════════════════════════════════════════════
 * 主公军令（2026-10-21）③：新灵宠/盲盒素材入库前，自动「去透明杂边 → 边缘羽化
 *   → 裁切留白 → 压成超轻 .webp（≤80KB）」，保证海外手机首屏不白屏。
 *
 * 用法：
 *   node scripts/skill-asset-optimize.mjs                        # 处理 web/src/assets/*.webp|png
 *   node scripts/skill-asset-optimize.mjs a.png b.png --out dir
 *   node scripts/skill-asset-optimize.mjs --check                # 只体检体积，不写文件
 *   node scripts/skill-asset-optimize.mjs --max-kb 80 --width 900 --feather 0.6
 *
 * 退出码：0 全部达标；1 有超预算；2 崩溃（sharp 未安装等）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PW_HOME = process.env.KS_PW_HOME || '/Users/apple/.workbuddy/binaries/node/workspace';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d = '') => { const i = argv.indexOf(n); return i > -1 ? (argv[i + 1] || d) : d; };

const CHECK_ONLY = flag('--check');
const MAX_KB = Number(opt('--max-kb', '80'));
const MAX_W = Number(opt('--width', '900'));
const FEATHER = Number(opt('--feather', '0.6'));
const OUT_DIR = opt('--out', path.join(REPO, 'web', 'src', 'assets', 'optimized'));

function loadSharp() {
  const bases = [import.meta.url, pathToFileURL(path.join(PW_HOME, 'package.json')).href];
  for (const b of bases) { try { return createRequire(b)('sharp'); } catch (_) { /* next */ } }
  throw new Error(`sharp 未安装。安装：cd ${PW_HOME} && npm i sharp`);
}

function human(kb) { return `${kb.toFixed(1)}KB`; }

(async () => {
  const sharp = loadSharp();
  const files = argv.filter((a) => !a.startsWith('--') && fs.existsSync(a)).map((p) => path.resolve(p));
  const globbed = files.length ? files : fs.readdirSync(path.join(REPO, 'web', 'src', 'assets'))
    .filter((f) => /\.(webp|png|jpe?g)$/i.test(f))
    .map((f) => path.join(REPO, 'web', 'src', 'assets', f));
  if (!globbed.length) { console.error('未找到输入素材'); process.exit(2); }
  if (!CHECK_ONLY) fs.mkdirSync(OUT_DIR, { recursive: true });

  const rows = [];
  let over = 0;
  for (const src of globbed) {
    const buf = fs.readFileSync(src);
    const beforeKB = buf.length / 1024;
    const meta = await sharp(buf).metadata();
    // ① trim：按四角像素判透明/纯色边，裁掉多余留白（阈值放宽防误裁浅色羽边）
    // 🧯 E80 血训：`sharp(buf).trim().metadata()` 返回的是**源图**元数据，裁切尺寸拿不到
    //    ⇒ 必须 toBuffer({resolveWithObject:true}) 取真实 info.width/height，否则报表尺寸列是假数。
    const tr = await sharp(buf).trim({ threshold: 12 }).toBuffer({ resolveWithObject: true });
    let base = tr.data;
    const tw = tr.info.width, th = tr.info.height;
    const hasAlpha = !!tr.info.hasAlpha || !!meta.hasAlpha;
    // ② 边缘羽化：只对 alpha 做极轻高斯，消除抠图硬边（不动机身像素）
    if (hasAlpha && FEATHER > 0) {
      const alpha = await sharp(base).extractChannel('alpha').blur(FEATHER).toBuffer();
      base = await sharp(base).removeAlpha().joinChannel(alpha).toBuffer();
    }
    // ③ 尺寸上限（禁放大）→ ④ 质量阶梯压到预算内
    let out = null; let q = 82;
    while (q >= 60) {
      out = await sharp(base).resize({ width: MAX_W, withoutEnlargement: true }).webp({ quality: q, effort: 5, smartSubsample: true }).toBuffer();
      if (out.length / 1024 <= MAX_KB) break;
      q -= 4;
    }
    const afterKB = out.length / 1024;
    const outMeta = await sharp(out).metadata();
    if (afterKB > MAX_KB) over++;
    const dest = path.join(OUT_DIR, `${path.basename(src, path.extname(src))}.webp`);
    if (!CHECK_ONLY) fs.writeFileSync(dest, out);
    rows.push({
      file: path.relative(REPO, src), beforeKB: +beforeKB.toFixed(1), afterKB: +afterKB.toFixed(1),
      savedPct: Math.round((1 - afterKB / beforeKB) * 100), q,
      dims: `${meta.width}×${meta.height} → ${outMeta.width}×${outMeta.height}（裁切 ${tw}×${th}）`,
      out: CHECK_ONLY ? '(check only)' : path.relative(REPO, dest),
    });
  }

  const w = (s, n) => String(s).padEnd(n);
  console.log(`\n${w('素材', 34)}${w('原体积', 10)}${w('优化后', 10)}${w('节省', 8)}${w('q', 4)}尺寸`);
  for (const r of rows) console.log(w(r.file, 34) + w(human(r.beforeKB), 10) + w(human(r.afterKB), 10) + w(r.savedPct + '%', 8) + w(r.q, 4) + r.dims);
  console.log(`\n预算 ${MAX_KB}KB / 最大宽 ${MAX_W}px / 羽化 ${FEATHER}px${CHECK_ONLY ? ' / 体检模式（未写文件）' : ` / 输出 ${path.relative(REPO, OUT_DIR)}`}`);
  console.log(over ? `❌ ${over} 个素材超预算` : '✅ 全部达标');
  process.exit(over ? 1 : 0);
})().catch((e) => { console.error('💥 资产管线崩溃：', e.message); process.exit(2); });
