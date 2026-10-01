#!/usr/bin/env node
/**
 * 🛡️ V490 毒缓存清理（运维脚本，需手动执行）
 *
 * ── 为什么需要 ──────────────────────────────────────────────────────────────
 *   V490 之前，时区拼写错（如 `America/Agentina/Ushuaia`）会被 Python **静默退 UTC**
 *   并照常生成报告 ⇒ 这些**基于错误时区算出的报告正文**已写入 `ai_insights_cache`，
 *   缓存键里带着**原始错误 tz**。仅靠 bump 到 `wealth:v505:` 虽已让它们「查不到」，
 *   但若历史键格式被别处复用/扫到，仍可能复活 —— 本脚本做一次彻底清除。
 *
 * ── 用法 ───────────────────────────────────────────────────────────────────
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/purge-tz-poison-cache.mjs [--dry-run]
 *
 *   --dry-run  只列出将被删除的键，不真删（**建议先跑一次**）
 *
 * ── 清哪些 ─────────────────────────────────────────────────────────────────
 *   ① 缓存键含已知错误时区拼写的（Agentina 等）—— 这些正文本身基于错盘
 *   ② 旧版本前缀 `wealth:v504:` —— 输出链变更前的产物（时区未经 V490 校验）
 *   ⚠️ 不清理 `wealth:v505:`（V490 后的干净产物）。
 */

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
const DRY = process.argv.includes('--dry-run');

if (!SB_URL || !SB_KEY) {
  console.error('[purge] 缺少 SUPABASE_URL / SUPABASE_SERVICE_KEY 环境变量');
  process.exit(1);
}

// ① 已知「拼写错 ⇒ 静默退 UTC」的毒键特征
const POISON_TZ_PATTERNS = [
  'wealth:*Agentina*',            // 🔴 本次立项起因
  'wealth:*Argentina/Ushuaia*',   // 安全：也一并清（旧键可能存的是未规范化的写法）
];

// ② 旧版本前缀（输出链变更前，时区未经 V490 校验）
const STALE_VERSION_PATTERNS = [
  'wealth:v504:*',
  'wealth:v116-v2:*',
];

async function listKeys(pattern) {
  const url = `${SB_URL}/rest/v1/ai_insights_cache?cache_key=like.${encodeURIComponent(pattern)}&select=cache_key&limit=1000`;
  const r = await fetch(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!r.ok) throw new Error(`list failed ${r.status}: ${await r.text()}`);
  return (await r.json()).map((x) => x.cache_key);
}

async function delKeys(keys) {
  if (!keys.length) return 0;
  let n = 0;
  // 分批，避免 URL 过长
  for (let i = 0; i < keys.length; i += 50) {
    const batch = keys.slice(i, i + 50);
    const inList = batch.map((k) => encodeURIComponent(k)).join(',');
    const url = `${SB_URL}/rest/v1/ai_insights_cache?cache_key=in.(${inList})`;
    const r = await fetch(url, { method: 'DELETE', headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    if (!r.ok) throw new Error(`delete failed ${r.status}: ${await r.text()}`);
    n += batch.length;
  }
  return n;
}

const allPatterns = [...POISON_TZ_PATTERNS, ...STALE_VERSION_PATTERNS];
let totalFound = 0, totalDeleted = 0;

for (const p of allPatterns) {
  try {
    const keys = await listKeys(p);
    totalFound += keys.length;
    console.log(`[purge] pattern=${p} → 命中 ${keys.length} 条`);
    keys.slice(0, 5).forEach((k) => console.log(`        · ${k}`));
    if (keys.length > 5) console.log(`        · ... 另外 ${keys.length - 5} 条`);
    if (!DRY && keys.length) {
      const n = await delKeys(keys);
      totalDeleted += n;
      console.log(`        ✅ 已删除 ${n} 条`);
    }
  } catch (e) {
    console.error(`[purge] pattern=${p} 处理失败: ${e.message}`);
  }
}

console.log(`\n[purge] ${DRY ? '(dry-run) 将删除' : '已删除'} ${DRY ? totalFound : totalDeleted} 条 / 命中 ${totalFound} 条`);
if (DRY) console.log('[purge] 确认无误后去掉 --dry-run 重新执行');
