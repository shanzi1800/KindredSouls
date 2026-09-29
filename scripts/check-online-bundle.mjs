#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════
 * 线上 Bundle 关键标识抽检 · V474 —— 封仓 CheckList 硬闸
 * ═══════════════════════════════════════════════════════════════════════
 * 为什么需要?  (V473 复盘)
 *
 *   后端 API 返回 DONE ≠ 前端 DOM 挂载成功。
 *   V473 那次,后端几万字正文全绿,线上页面却一个字都不出 ——
 *   因为前端产物里那段渲染代码压根不存在(被 JSX 注释后又被压缩器剔除)。
 *
 *   所以封仓不能只看接口,必须直接爬到【线上真实产物】里,
 *   抽检核心组件标识是否真的在。
 *
 * 用法:
 *   node scripts/check-online-bundle.mjs
 *   KS_SITE=https://kindredsouls.online node scripts/check-online-bundle.mjs
 *
 * 退出码: 0 = 线上产物完整; 1 = 标识缺失/命中禁用标识(禁止封仓)。
 * ═══════════════════════════════════════════════════════════════════════
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.env.KS_SITE || 'https://kindredsouls.online';
const LOCAL_DIST = path.join(REPO_ROOT, 'web/dist/assets');

/**
 * 封仓抽检清单 —— 每次大版本封仓前请同步维护。
 *  min:  线上产物中该标识至少出现几次
 *  why:  这个标识代表什么用户可见能力
 */
const REQUIRED_MARKERS = [
  { key: 'yearly-pending', min: 1, why: '年报渲染块稳定 key(被注释掉时该标识会整体消失)' },
  { key: 'SacredYearlyReportBox', min: 2, why: '年报主渲染组件(定义 + 使用)' },
  { key: '12 个月', min: 1, why: '年报「12个月矩阵」区块文案' },
];

/**
 * 禁用标识 —— 命中即判定线上产物带病,禁止封仓。
 */
const FORBIDDEN_MARKERS = [
  {
    key: '(([^)',
    why: 'V474 地雷正则残留:new RegExp("(([^)\\n]*?)(\\s*)(?=\\n|$)") 运行时必抛 Unterminated group',
  },
];

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

async function fetchText(url, label) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${label} 请求失败: HTTP ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

function findLocalBundle() {
  if (!fs.existsSync(LOCAL_DIST)) return null;
  const files = fs
    .readdirSync(LOCAL_DIST)
    .filter((f) => /^index-.*\.js$/.test(f))
    .sort();
  if (files.length === 0) return null;
  return path.join(LOCAL_DIST, files[files.length - 1]);
}

async function main() {
  console.log('[bundle-gate] 站点:', SITE);
  const started = Date.now();

  // 1. 首页 -> 定位线上产物名
  const htmlBuf = await fetchText(SITE + '/', 'index.html');
  const html = htmlBuf.toString('utf8');
  const m = html.match(/\/assets\/(index-[A-Za-z0-9_-]+\.(?:js))/);
  if (!m) {
    console.error('[bundle-gate] ❌ 首页里找不到 /assets/index-*.js 引用,无法抽检。');
    process.exit(1);
  }
  const bundleName = m[1];
  const bundleUrl = `${SITE}/assets/${bundleName}`;
  console.log('[bundle-gate] 线上产物:', bundleName);

  // 2. 拉线上产物本体
  const bundleBuf = await fetchText(bundleUrl, 'bundle');
  const bundle = bundleBuf.toString('utf8');
  const onlineHash = md5(bundleBuf);
  console.log(
    `[bundle-gate] 大小 ${(bundleBuf.length / 1024).toFixed(1)} kB · md5 ${onlineHash}`,
  );

  const failures = [];

  // 3. 必需标识抽检
  console.log('[bundle-gate] ── 必需标识 ──');
  for (const mk of REQUIRED_MARKERS) {
    const n = countOccurrences(bundle, mk.key);
    const ok = n >= mk.min;
    console.log(`   ${ok ? '✅' : '❌'} ${mk.key.padEnd(24)} 命中 ${n} 次 (需 ≥${mk.min}) — ${mk.why}`);
    if (!ok) failures.push(`必需标识缺失: ${mk.key} (命中 ${n}, 需 ≥${mk.min}) — ${mk.why}`);
  }

  // 4. 禁用标识抽检
  console.log('[bundle-gate] ── 禁用标识 ──');
  for (const mk of FORBIDDEN_MARKERS) {
    const n = countOccurrences(bundle, mk.key);
    const ok = n === 0;
    console.log(`   ${ok ? '✅' : '❌'} ${mk.key.padEnd(24)} 命中 ${n} 次 (需 =0) — ${mk.why}`);
    if (!ok) failures.push(`命中禁用标识: ${mk.key} (${n} 次) — ${mk.why}`);
  }

  // 5. 与本地构建产物比对(证明线上 = 本次构建)
  console.log('[bundle-gate] ── 本地构建比对 ──');
  const localFile = findLocalBundle();
  if (!localFile) {
    console.log('   ⚠️ 未找到本地 web/dist/assets/index-*.js,跳过一致性比对(请先 npm run build)。');
  } else {
    const localBuf = fs.readFileSync(localFile);
    const localName = path.basename(localFile);
    const localHash = md5(localBuf);
    console.log(`   本地产物: ${localName} · md5 ${localHash}`);
    if (localName === bundleName && localHash === onlineHash) {
      console.log('   ✅ 字节级完全一致:线上产物 === 本地本次构建产物。');
    } else if (localName !== bundleName) {
      console.log(`   ⚠️ 文件名不一致(线上 ${bundleName} / 本地 ${localName}) —— 线上可能尚未部署本次构建。`);
    } else {
      console.log('   ⚠️ 文件名相同但内容 md5 不同 —— 异常,请复查部署方式。');
    }
  }

  const cost = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`[bundle-gate] 耗时 ${cost}s`);

  if (failures.length > 0) {
    console.error('\n[bundle-gate] ❌ 抽检未通过,禁止封仓:');
    for (const f of failures) console.error('   · ' + f);
    process.exit(1);
  }
  console.log('\n[bundle-gate] ✅ 线上产物抽检通过,关键标识齐备、无禁用标识。');
}

main().catch((err) => {
  console.error('[bundle-gate] ❌ 执行异常:', err.message);
  process.exit(1);
});
