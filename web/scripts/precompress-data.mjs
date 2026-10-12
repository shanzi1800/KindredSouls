#!/usr/bin/env node
/**
 * E42+ 45-D2 先锋战：静态大资产预压缩（cities.json 6.9MB 裸传根治）
 *
 * 病根（2026-10-12 实兵演习实测）：
 *   /data/cities.json 6.94MB **明文裸传**，无 `content-encoding`，且 `cache-control: public, max-age=0`
 *   ⇒ 连缓存都没有 ⇒ 弱网下城市检索首可用延迟实测 31~56s（首屏输入第一体验被毁）。
 *
 * 治法（双管齐下）：
 *   ① 构建期预压缩：产出 `.br`（brotli q11）与 `.gz`（gzip l9）兄弟文件，随 dist 提交；
 *   ② 服务端按 `Accept-Encoding` 择优下发 + `immutable` 强缓存（见 server.js 预压缩静态层）。
 *
 * 🔴 铁律：
 *   - **禁止容器内 rebuild（V318）** ⇒ 本脚本只在**本地构建期**跑，产物随 `web/dist` 入库。
 *   - 产物落在 `web/public/data/` —— vite build 会把 `publicDir` 逐字复刻到 `dist`
 *     （⇒ 避免「只改 dist、public 源头没改」的 V41 型静默回退）。
 *   - 源文件缺失 ⇒ **跳过并不报错**（本地/CI 无该资产时不得阻断构建）。
 *   - 幂等：产物 mtime 晚于源 ⇒ 跳过（省构建时间）；`--force` 强制重压。
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

// ⚠️ 仓库根路径含中文（KindredSouls开发工作日志）⇒ 必须用 fileURLToPath 解码，
//    直接取 `new URL(import.meta.url).pathname` 会拿到百分号编码路径 ⇒ 全部 TARGETS 误判「不存在」。
const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FORCE = process.argv.includes('--force');

// 目标清单：绝对路径（相对 web/）。新增条目必须同步服务端 PRECOMPRESS_EXTS 射程。
const TARGETS = ['public/data/cities.json'];

const BROTLI_OPTS = {
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
  },
};

const kb = (n) => (n / 1024).toFixed(1) + 'KB';
const mb = (n) => (n / 1024 / 1024).toFixed(2) + 'MB';
const human = (n) => (n >= 1024 * 1024 ? mb(n) : kb(n));

function fresh(srcPath, outPath) {
  if (FORCE) return false;
  if (!fs.existsSync(outPath)) return false;
  try {
    return fs.statSync(outPath).mtimeMs >= fs.statSync(srcPath).mtimeMs
      && fs.statSync(outPath).size > 0;
  } catch { return false; }
}

let totalSrc = 0, totalOut = 0, done = 0, skipped = 0;

for (const rel of TARGETS) {
  const src = path.join(WEB_DIR, rel);
  if (!fs.existsSync(src)) {
    console.log(`[precompress] ⏭  ${rel} 不存在，跳过（不阻断构建）`);
    skipped++;
    continue;
  }
  const raw = fs.readFileSync(src);
  totalSrc += raw.length;

  const outs = [
    { ext: '.br', enc: 'brotli', run: () => zlib.brotliCompressSync(raw, BROTLI_OPTS) },
    { ext: '.gz', enc: 'gzip', run: () => zlib.gzipSync(raw, { level: 9 }) },
  ];

  for (const o of outs) {
    const outPath = src + o.ext;
    if (fresh(src, outPath)) {
      const sz = fs.statSync(outPath).size;
      totalOut += sz;
      console.log(`[precompress] ✓  ${rel}${o.ext} 已是最新（${human(sz)}）`);
      continue;
    }
    const t0 = Date.now();
    const buf = o.run();
    fs.writeFileSync(outPath, buf);
    totalOut += buf.length;
    done++;
    console.log(
      `[precompress] ✎  ${rel} → ${o.ext}  ${human(raw.length)} → ${human(buf.length)}` +
      `（${(100 - (buf.length / raw.length) * 100).toFixed(1)}% 缩减，${Date.now() - t0}ms，${o.enc}）`
    );
  }
}

console.log(
  `[precompress] 完成：重压 ${done} 个 / 跳过 ${skipped} 项；` +
  `源 ${human(totalSrc)}，产物合计 ${human(totalOut)}`
);
