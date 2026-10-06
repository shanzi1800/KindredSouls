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

// ② 旧版本前缀（入参契约/输出链变更前的产物，其 tz 未经 V490 校验、其坐标未经 V490b 校验）
const STALE_VERSION_PATTERNS = [
  'wealth:v504:*',
  'wealth:v505:*',        // 🛡️ V490b: 键曾由**未校验坐标**经 Number(lat||13.75) 派生（含 null→0.0000 的洗白面）
  'wealth:v505-v2:*',
  'wealth:v506:*',        // 🛡️ V492/D1: v506 全量作废（含年报 :yearly 形态——实测线上毒缓存正是 wealth:v506:...:en:yearly）
  'wealth:v506-v2:*',
  'wealth:v507:*',        // 🛡️ V492b/E9: v507 全量作废（第 1 章前导段本命错乱缓存随 bump 洗净）
  'wealth:v507-v2:*',
  'wealth:v508:*',        // 🛡️ E10/R9: v508 全量作废（裸序数/轴点锁变更；表当时为空——CRITIC 曾拦截带伤稿未入库）
  'wealth:v508-v2:*',
  'wealth:v509:*',        // 🛡️ E11/R10: v509 全量作废（CRITIC 判据精准化，误报根治后首次可走 normal 路径）
  'wealth:v509-v2:*',
  'wealth:v510:*',        // 🛡️ E12/R11: v510 全量作废（全章物主本命真值锁 + 畸形宫位形态归一 + LLM 自纠 artifact 剥离）
  'wealth:v510-v2:*',
  'wealth:v511:*',        // 🛡️ E13/R11d: v511 全量作废（英文拼写式序数宫位盲区 + HIT 路径前导锁缺失，第 1 章本命宫位可错配）
  'wealth:v511-v2:*',
  'wealth:v512:*',        // 🛡️ E15/R11f: v512 全量作废（vi/th 非流式 HIT 因 const stdCached 重赋值崩溃丢缓存 + es/fr 章名口径矛盾拒入库 + es/fr 阴性序数缩写形态盲区 + hits 区间相交串长错位 artifact）
  'wealth:v512-v2:*',
  'wealth:v513:*',        // 🛡️ E16/R11g: v513 全量作废（es/fr/th/vi 月标题逐月真值锁**静默失效** ⇒ 12 盘实测 54 处标题星座/宫位错项 + th 行星/宫位词拼写非正字 + house_linter 英文月锚点对 es/fr 仅部分命中致跨月串段）
  'wealth:v513-v2:*',
  'wealth:v514:*',        // 🛡️ E16/R11h: v514 全量作废（`_v516MonthHeadKey` vi 前缀碰撞 ⇒ 10/11/12 月折叠同 key ⇒ dedupYearlyMonthTitles 静默**删除** 11、12 月标题；vi 写回强制 Năm 致空转；英文 `N House` 残渣仅 es 归一，fr/th/vi 全盲）
  'wealth:v514-v2:*',
  'wealth:v515:*',        // 🛡️ E16/R11i: v515 全量作废（HIT th 链 natal 锁污染月标题 + 宫位子串误判 + 年报误用 months[0] 口径 transit 锁）
  'wealth:v515-v2:*',
  'wealth:v516:*',        // 🛡️ E17/R11j: v516 全量作废（年报「上升锚点」零守卫 ⇒ 同一篇出现 3 个不同上升星座；裸本命句「月亮在金牛座第十二宫」宫位错配；头部高纬告知与尾部落款混入正文）
  'wealth:v516-v2:*',
  'wealth:v517:*',        // 🛡️ E18/R11k: v517 全量作废（HIT 链二次施加非幂等 ⇒ HIT 响应 ≠ 库内文本（12 盘 5 盘劣化，`Sagittarius…— Sun, Moon,` 被抠成 `SagittLeo…—Moon,`）+ E17 裸本命锁把 12 个月标题星座反写回 natal Sun + `standardizeReport` 非幂等再插换行；HIT 侧收拢为「命中即终局」）
  'wealth:v517-v2:*',
  'wealth:v518:*',        // 🛡️ E19/R11l: v518 全量作废（V482 流年锁段尾守卫只认 `## ` 二级 ⇒ en `### Chapter` 三级章节被末月段吞入, 本命句被按流年改写后连锁炸掉下游本命锁门控, `Saturn in Aquarius in your 4th House`(真值 H2) 错值终局落库；守卫升级为任意级别非月标题终止 + 本命星座豁免）
  'wealth:v518-v2:*',
  'wealth:v519:*',        // 🛡️ E19/R11m: v519 全量作废（链中段真值锁在「句窗含年份/月份词」时弃权、而残渣随后被清掉 ⇒ 物主本命句残差漏纠、CRITIC 判据12 余警 5 处；治法=全部清洗/去重后追加「真值锁最终话语权」末道；另判据8 守卫扩外行星 冥王星/海王星/天王星）
  'wealth:v519-v2:*',
  'wealth:v520:*',        // 🛡️ E20/R11n: v520 全量作废（① 新增 stripYearlyElementCoordLeak 元素归纳段流年坐标剪枝锁（V488d 契约确定性落地，s7 zh 判据9 真阳性）② V517 轴点锁补「X座上升」后置形态（s1 zh「天秤座上升」错值实证）③ CRITIC 判据12 多声称连句防伪影）
  'wealth:v520-v2:*',
  'wealth:v521:*',        // 🛡️ E21/R11o: v521 全量作废（新增 stripHouseSemanticLabelMismatch 宫位语义标签契约锁（保数字、剪错配标签；1993 盘「12th House of Partnership」实证）+ CRITIC 判据14 宫位语义标签错配守卫）
  'wealth:v521-v2:*',
  'wealth:v522:*',        // 🛡️ E22/R11p: v522 全量作废（宫位语义标签契约锁「链末收口」：E19/R11m 链末真值锁 _v432LockLeadingNatal 把 natal 行星真值误绑到同句流年子句宫号上 ⇒ 数字被改、标签原地不动 ⇒ `10th House of Partnership`；E21 锁挂在真值锁之前故拦不住 ⇒ 在所有清理/真值收口之后再施加一次标签锁）
  'wealth:v522-v2:*',
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
