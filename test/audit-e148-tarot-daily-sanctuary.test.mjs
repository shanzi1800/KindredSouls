/**
 * audit-e148-tarot-daily-sanctuary.test.mjs —— E148 六刀军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E148（主公 2026-11-19 终局裁决令）六刀】：
 *   刀一 isToday 当日校验——P1 今日新牌才承接（隔日静默；P2 情绪/P3 老友照常）；
 *   刀二 compatibility_once_charts 双盘组合签名名单（E131 对称；封顶 50；老用户
 *        名单空＋位 true ⇒ 首访懒回填，绝不 already_paid 误挡已购老用户）；
 *   刀三 tarot_daily_once $1.99（env STRIPE_PRICE_TAROT_DAILY 未配 ⇒ PENDING
 *        优雅 400 不崩溃；会员日限按组合计：年卡 3/月订 2/双引擎 2；同盘当日
 *        复读零计数；全局 10/日熔断 429；端点注册 Gate 45-A 窗外=create-checkout 后）；
 *   刀四 对话舱纯文字指路（钦定权益名词：月度星轨长卷/年度宿命年鉴/星际会员畅享
 *        ＋「在首页『开始测算』中开启/查看」；E130 字面级零违例——「解锁」全清洗）；
 *   刀五 本闸门＋链位 115→116（node-only 114→115）；
 *   刀六 部署交割（双证/双视口——不在本闸门射程，物证见日档）。
 * 断言组：
 *   锁1 刀一 isToday 行为（模块实跑：p1queue 当日承接/隔日静默/fail-closed）；
 *   锁2 刀二 compat 名单（server 面：归一/查名单/懒回填/换盘重购/reset 清场）；
 *   锁3 刀三 tarot 配额核（VM 实跑 18 形态）＋server/前端面（SKU/端点/重购/
 *        PENDING/webhook 落名单/双挂载/沙盒价与词条）；
 *   锁4 刀四 字面级零违例（P1 六语词典＋E112 内句＋whisper 钦定三词与指路句）；
 *   锁5 链位自保（e148 紧居 e147 后、e40-compat 前；全链 116＋node-only 115＋
 *        python 恒总链尾）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）；
 *          纯核 now 全注入（铁律 19：禁绝对日期断真钟）；VM 抽取常量内联函数体。
 * 执行命令：node --test test/audit-e148-tarot-daily-sanctuary.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const server = read('server.js');
const TQ_SRC = read('web/src/lib/companionTopicQueue.mjs');
const APP = read('web/src/App.tsx');
const CARD = read('web/src/components/TarotDailyCard.tsx');
const SANDBOX = read('web/src/lib/sandboxCheckout.mjs');
const DICT = read('astro/astro_terms_dict.json');
const PKG = JSON.parse(read('package.json'));

/* 注入时钟（铁律 19——禁绝对日期断真钟；全消费点统一注入） */
const NOW = Date.parse('2026-11-20T04:30:00.000Z');
const DAY = '2026-11-20';
const SIG = '1990-05-06|12:00|31.2304|121.4737|Asia/Shanghai';
const SIG2 = '1988-11-25|08:30|39.9042|116.4074|Asia/Shanghai';

/* ═══ VM 抽取：E148-刀三纯核（TAROT_DAILY_* 常量 → tarotNames 惰性加载前）═══ */
const coreStart = server.indexOf('const TAROT_DAILY_ONCE_SIG_MAX');
const coreEnd = server.indexOf('let _e148TarotNamesMod');
const coreBody = server.slice(coreStart, coreEnd);
const VM = new Function(
  '_mkDate',
  coreBody + '\nreturn { tarotDailyDayKey, tarotDailyOnceChartListed, tarotDailyMemberLimit, tarotDailyLogEntries, tarotDailyEntitlement, tarotDailyLogAppend, tarotDailyDraw };',
)((v) => (v instanceof Date ? v : new Date(v)));

/* ═══ 模块实跑：companionTopicQueue（刀一） ═══ */
const TQ = await import(pathToFileURL(join(ROOT, 'web/src/lib/companionTopicQueue.mjs')).href);

/* ═══════════ 锁1 刀一：isToday 当日硬门（模块实跑） ═══════════ */
test('E148-锁1a isRecentReportToday 纯核：当日 true／隔日与坏形状 fail-closed', () => {
  assert.equal(TQ.isRecentReportToday({ category: 'love', tier: 'core', unlockedAt: NOW }, NOW), true, '当日 ⇒ true');
  assert.equal(TQ.isRecentReportToday({ category: 'love', tier: 'core', unlockedAt: NOW - 26 * 3600 * 1000 }, NOW), false, '隔日（26h 前）⇒ false');
  assert.equal(TQ.isRecentReportToday({ category: 'love', tier: 'core' }, NOW), false, '无 unlockedAt ⇒ false');
  assert.equal(TQ.isRecentReportToday(null, NOW), false, 'null ⇒ false');
  assert.equal(TQ.isRecentReportToday({ category: 'love', tier: 'core', unlockedAt: 'bad' }, NOW), false, '坏时间戳 ⇒ false');
  assert.equal(TQ.isRecentReportToday({ category: 'love', tier: 'core', unlockedAt: -1 }, NOW), false, '负时间戳 ⇒ false');
});

test('E148-锁1b p1queue 当日承接：今日新牌 firstLine 落 P1 词典且零「解锁」字眼', () => {
  const out = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'love', tier: 'core', unlockedAt: NOW },
    activeMood: null, lang: 'zh', now: NOW,
  });
  assert.ok(out && out.p1Key === 'love_core', '当日 love/core ⇒ p1Key=love_core');
  assert.ok(out.queue.includes('love_core'), 'P1 话题入队');
  assert.ok(out.firstLine.includes('开启'), '首句含「开启」（军令钦定动词）');
  assert.ok(!out.firstLine.includes('解锁'), '首句零「解锁」（E130 字面级）');
  const outEn = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'wealth', tier: 'annual', unlockedAt: NOW },
    activeMood: null, lang: 'en', now: NOW,
  });
  assert.ok(outEn && outEn.p1Key === 'wealth_yearly', 'wealth/annual 归一 yearly ⇒ P1 承接');
});

test('E148-锁1c 隔日静默：昨日报告 ⇒ P1 整体丢失（P2 单发照常／无 P2 ⇒ null 兜底链）', () => {
  const p2 = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'love', tier: 'core', unlockedAt: NOW - 26 * 3600 * 1000 },
    activeMood: 'melancholy', lang: 'zh', now: NOW,
  });
  assert.ok(p2 && p2.p1Key === null, '隔日 ⇒ p1Key=null（P1 静默）');
  assert.deepEqual(p2.queue, ['mood:melancholy'], 'P2 今日情绪单发照常');
  const none = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'love', tier: 'core', unlockedAt: NOW - 26 * 3600 * 1000 },
    activeMood: null, lang: 'zh', now: NOW,
  });
  assert.equal(none, null, '隔日无情绪 ⇒ null（回退 P3 纯净老友问候链）');
});

test('E148-锁1d 源面：isToday 硬门接线在合成器内（双保险与 sheet 分支拆除）', () => {
  assert.ok(TQ_SRC.includes('const p1Key = isRecentReportToday(recentReport, now) ? normalizeReportKey(recentReport) : null;'), '合成器 isToday 硬门在位');
  assert.ok(TQ_SRC.includes('export function isRecentReportToday('), 'isRecentReportToday 导出（闸门可注入）');
});

/* ═══════════ 锁2 刀二：compatibility_once_charts 名单（server 面） ═══════════ */
test('E148-锁2a 组合签名归一＋查名单：sorted 双盘块＋once 位双闸 fail-closed', () => {
  assert.ok(server.includes('function normalizeCompatComboSig('), '归一函数在位');
  assert.ok(server.includes('function compatOnceComboListed('), '查名单函数在位');
  assert.ok(server.includes('compatibility_once_charts: list.slice(-COMPAT_COMBO_SIG_MAX)'), '名单封顶 slice（E131 对称）');
  assert.ok(server.includes("comboSig, // 💳 E148-刀二: 双盘组合签名随沙盘会话"), '沙盘会话携 comboSig（落名单唯一钥匙）');
});

test('E148-锁2b 老用户懒回填：名单空＋位 true ⇒ 首访锚定（best-effort 不阻断）', () => {
  assert.ok(server.includes('async function _e148BackfillCompatCombo('), '懒回填函数在位');
  assert.ok(server.includes("'Prefer': 'return=representation'"), 'PATCH 带 Prefer（PostgREST 铁律）');
  assert.ok(server.includes('_e148Backfilled'), '读取侧回填接线在位（报告路 lazy 路径）');
});

test('E148-锁2c 换盘重购：名单非空且新组合不在名单 ⇒ 合法新单（三条件军令形）', () => {
  assert.ok(server.includes('const _e148CompatOnceRebuy = plan === \'compatibility_once\' && comboSig'), 'rebuy 判定在位');
  assert.ok(/_e148CompatOnceRebuy = plan === 'compatibility_once' && comboSig\s*\n?\s*&& \(Array\.isArray\(paidPlans\.compatibility_once_charts\) \? paidPlans\.compatibility_once_charts\.length : 0\) > 0/.test(server), '名单非空条件（空名单＝already_paid 挡死不误放行）');
  assert.ok(server.includes('if (!_e131OnceRebuy && !_e148CompatOnceRebuy && !_e148TarotOnceRebuy) {'), '三族 rebuy 汇流判定');
  assert.ok(server.includes('delta.compatibility_once_charts = [];'), 'reset 清场（对称形制）');
});

/* ═══════════ 锁3 刀三：tarot 配额核（VM 实跑）＋server/前端面 ═══════════ */
test('E148-锁3a 纯核 SKU 常量：封顶 50／全局 10／会员日限三档（年3 月2 双引擎2）', () => {
  assert.ok(coreBody.includes('const TAROT_DAILY_ONCE_SIG_MAX = 50;'), '名单封顶 50');
  assert.ok(coreBody.includes('const TAROT_DAILY_GLOBAL_CAP = 10;'), '全局熔断 10/日');
  assert.ok(coreBody.includes('const TAROT_MEMBER_DAILY_COMBOS = { all_pass_yearly: 3, all_pass_monthly: 2, star_monthly_vip: 2 };'), '会员日限三档（军令钦定）');
});

test('E148-锁3b once 名单分支：新盘 200/ONCE_NEW；同盘当日复读 CACHED；隔日翻篇', () => {
  const plans = { tarot_daily_once: true, tarot_daily_once_charts: [SIG] };
  const entNew = VM.tarotDailyEntitlement(plans, SIG, NOW);
  assert.equal(entNew.ok && entNew.reason, 'ONCE_NEW', '名单内盘 ⇒ ONCE_NEW');
  const log = VM.tarotDailyLogAppend(plans, SIG, DAY);
  const entCached = VM.tarotDailyEntitlement(Object.assign({}, plans, { tarot_daily_combo_log: log }), SIG, NOW);
  assert.equal(entCached.cached, true, '当日重复查看 ⇒ cached 复读（零计数零落库）');
  // 隔日翻篇：旧日日志不计数（UTC 日翻转旧条目自然出局）
  const entNextDay = VM.tarotDailyEntitlement(
    Object.assign({}, plans, { tarot_daily_combo_log: [{ d: '2026-11-19', s: SIG }] }),
    SIG, Date.parse('2026-11-20T04:30:00.000Z'),
  );
  assert.equal(entNextDay.reason, 'ONCE_NEW', '隔日 ⇒ 旧日日志出局重新生成');
  // 名单外新盘（合法换盘重购后未落库前）⇒ 402 fail-closed
  const ent402 = VM.tarotDailyEntitlement(plans, SIG2, NOW);
  assert.equal(ent402.ok === false && ent402.status, 402, '未落名单新盘 ⇒ 402 NO_ENTITLEMENT');
});

test('E148-锁3c 会员分支：日限按组合计＋同盘去重；403 拒因带配额回显', () => {
  const y = { all_pass_yearly: true };
  assert.equal(VM.tarotDailyMemberLimit(y, NOW), 3, '全通年卡 3 组合/天');
  assert.equal(VM.tarotDailyMemberLimit({ all_pass_monthly: true }, NOW), 2, '全通月订 2 组合/天');
  assert.equal(VM.tarotDailyMemberLimit({ star_monthly_vip: true }, NOW), 2, '双引擎月卡 2 组合/天');
  assert.equal(VM.tarotDailyMemberLimit({}, NOW), 0, '无权益 ⇒ 0（402 路径）');
  assert.equal(VM.tarotDailyMemberLimit({ all_pass_monthly: true, all_pass_monthly_expires_at: '2026-11-01T00:00:00Z' }, NOW), 0, '月订过期 ⇒ 0（expires_at 失效判）');
  const log = [{ d: DAY, s: SIG }, { d: DAY, s: SIG2 }];
  const ent403 = VM.tarotDailyEntitlement({ all_pass_monthly: true, tarot_daily_combo_log: log }, '1990-05-06|12:00|0|0|UTC', NOW);
  assert.equal(ent403.status, 403, '月订已用 2 组合 ⇒ 403 MEMBER_DAILY_COMBO_LIMIT');
  assert.equal(ent403.memberUsed, 2, '403 拒因带 memberUsed 回显');
  // 同组合每日限 1 次：第二次 ⇒ cached 复读不占日限
  const entCached = VM.tarotDailyEntitlement({ all_pass_yearly: true, tarot_daily_combo_log: [{ d: DAY, s: SIG }] }, SIG, NOW);
  assert.equal(entCached.cached, true, '同盘当日复读 ⇒ MEMBER_CACHED');
});

test('E148-锁3d 全局熔断优先序：429 先于 403（服务端自保闸）；cached 穿透熔断', () => {
  const ten = [];
  for (let i = 0; i < 9; i++) ten.push({ d: DAY, s: '1990-0' + (i % 9 + 1) + '-0' + (i % 9 + 1) + '|12:00|1|2|UTC' });
  ten.push({ d: DAY, s: SIG }); // 第 10 条＝本盘（当日已生成：复读穿透熔断）
  const ent429 = VM.tarotDailyEntitlement({ all_pass_monthly: true, tarot_daily_combo_log: ten }, SIG2, NOW);
  assert.equal(ent429.status, 429, '全局 10/日满且新盘未生成 ⇒ 429（先于会员 403 日限）');
  const entCached429 = VM.tarotDailyEntitlement({ tarot_daily_once: true, tarot_daily_once_charts: [SIG], tarot_daily_combo_log: ten }, SIG, NOW);
  assert.equal(entCached429.ok, true, 'once 名单盘当日已生成 ⇒ 复读穿透 429（零生成零计数）');
  assert.equal(entCached429.cached, true, '穿透形态＝ONCE_CACHED');
  const ent400 = VM.tarotDailyEntitlement({ all_pass_yearly: true }, '', NOW);
  assert.equal(ent400.status, 400, '空签名 ⇒ 400 NO_CHART_SIG');
});

test('E148-锁3e 抽牌同律同牌：tarotDailyDraw 与 E107 公式逐字节同源（hash %22＋逆位奇偶）', () => {
  const draw = VM.tarotDailyDraw('1990-05-06', DAY);
  assert.ok(draw && Number.isInteger(draw.id) && draw.id >= 0 && draw.id < 22, '牌号 ∈ [0,22)');
  // 军令钦定公式（与 _e107DailyTarotFor 同串 `bd|dayKey` 五位散列）
  for (const bd of ['1990-05-06', '1988-11-25', '2000-01-01', '1975-08-14']) {
    const str = `${bd}|${DAY}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
    const expected = { id: Math.abs(hash) % 22, reversed: Math.floor(Math.abs(hash) / 22) % 2 === 1 };
    const got = VM.tarotDailyDraw(bd, DAY);
    assert.deepEqual(got, expected, `同律同牌 bd=${bd}（E109 隐士幽灵防复发）`);
  }
  assert.equal(VM.tarotDailyDraw('', DAY), null, '缺生日 ⇒ null（绝不臆造）');
  assert.equal(VM.tarotDailyDraw('1990-05-06', 'bad'), null, '坏 dayKey ⇒ null');
});

test('E148-锁3f 当日日志：同盘去重＋旧日条目物理清场（jsonb 不膨胀）', () => {
  const plans = { tarot_daily_combo_log: [{ d: '2026-11-18', s: SIG }, { d: DAY, s: SIG2 }] };
  const out = VM.tarotDailyLogAppend(plans, SIG, DAY);
  assert.equal(out.length, 2, '旧日条目出局＋当日追加（不膨胀）');
  assert.ok(out.every((e) => e.d === DAY), '回写后只含当日条目');
  const again = VM.tarotDailyLogAppend({ tarot_daily_combo_log: out }, SIG, DAY);
  assert.equal(again.length, 2, '同盘二次回写 ⇒ 去重不增条目');
});

test('E148-锁3g server 面：SKU 键（env||PENDING）＋once 族布尔口径＋PENDING 友好 400', () => {
  assert.ok(server.includes("tarot_daily_once:      process.env.STRIPE_PRICE_TAROT_DAILY || 'price_E148TarotDailyPENDING',"), 'STRIPE_PRICE_MAP 第 10 键（env 未配优雅降级）');
  assert.ok(server.includes("case 'tarot_daily_once':"), 'buildPlanPayload case');
  assert.ok(server.includes("if (target === 'compatibility_once' || target === 'wealth_once' || target === 'tarot_daily_once') {"), 'planHasAccess once 族扩档（防重付布尔口径）');
  assert.ok(server.includes("Tarot daily pricing is not configured yet. Please try again later."), 'PENDING 友好 400 文案');
  // PENDING 400 须在沙盒分支 return 之后（live-only；不引第二个 isSandboxPaymentMode 字面量）
  const cc = server.indexOf("app.post('/api/create-checkout'");
  const iSandbox = server.indexOf('if (isSandboxPaymentMode(process.env)) {', cc);
  const iPend = server.indexOf("Tarot daily pricing is not configured", cc);
  assert.ok(iSandbox !== -1 && iPend > iSandbox, 'PENDING 400 居沙盒分支后（Gate 45-D2 首锚不动）');
});

test('E148-锁3h 端点面：/api/tarot/daily 注册 Gate 45-A 窗外（create-checkout 后）＋fail-closed 三闸', () => {
  const cc = server.indexOf("app.post('/api/create-checkout'");
  const td = server.indexOf("app.post('/api/tarot/daily'");
  assert.ok(td > cc, '端点注册在 create-checkout 之后（禁落 Gate 45-A 窗）');
  const ep = server.slice(td, server.indexOf('}));', td));
  assert.ok(ep.includes('return res.status(401).json({ error: \'Not authenticated\' })'), '空 Bearer ⇒ 401');
  assert.ok(ep.includes('→ fail-closed'), '读 paid_plans 失败 ⇒ 空权益挡墙');
  assert.ok(ep.includes('return res.status(400).json({ error: \'INVALID_CHART\' })'), '坏盘 ⇒ 400 INVALID_CHART');
  assert.ok(ep.includes("'Prefer': 'return=representation'"), '日志 PATCH 带 Prefer');
  assert.ok(ep.includes('if (!ent.cached) {'), '仅新生成落日志（复读零落库）');
  assert.ok(ep.includes('[E148] tarot daily'), '服务端日志锚（deny/serve 双行）');
});

test('E148-锁3i webhook 落名单：tarot_daily_once_charts push＋封顶 50（E131 同律）', () => {
  assert.ok(server.includes('if (_e148tList.indexOf(_e131ChartSig) === -1) _e148tList.push(_e131ChartSig);'), '名单去重 push');
  assert.ok(server.includes('updatedPlans.tarot_daily_once_charts = _e148tList.slice(-TAROT_DAILY_ONCE_SIG_MAX);'), '封顶 50 落库');
  assert.ok(server.includes("delta.tarot_daily_once_charts = [];"), 'reset 名单清场');
  assert.ok(server.includes('delta.tarot_daily_combo_log = [];'), 'reset 日志清场（重测日限/熔断口径）');
});

test('E148-锁3j 前端面：TarotDailyCard 双挂载＋铸签镜像通道＋沙盒价与词条', () => {
  assert.equal((APP.match(/<TarotDailyCard/g) || []).length, 2, '双挂载（付费墙分支＋解锁分支）');
  assert.ok(CARD.includes('data-testid="tarot-daily-card"') && CARD.includes('data-testid="tarot-daily-buy"'), '双 testid 在位');
  // 铸签数据通道（模块级镜像——handlePurchaseWithToken 为模块级助手无法闭包 InputPage 状态）
  assert.ok(APP.includes('const _e148LastForm:'), '模块级镜像 holder 在位');
  assert.ok(APP.includes('_e148LastForm.d1 = d1; _e148LastForm.d2 = d2;'), 'InputPage 提交时镜像写入');
  assert.ok(APP.includes("plan === 'tarot_daily_once'"), 'App 购买分支');
  assert.ok(APP.includes("wealthChartSigOf(f.d1, f.t1 || '12:00', f.c1.lat, f.c1.lon, f.c1.tz)"), 'App 购买分支铸签（镜像值＝time 缺省 12:00 前后端同形）');
  assert.ok(APP.includes('compatComboSigOf(_e148LastForm.d1, _e148LastForm.d2, _e148LastForm.t1, _e148LastForm.t2, _e148LastForm.c1, _e148LastForm.c2)'), 'App compat 购买分支铸签（双盘组合镜像）');
  // 签名单源铁律：Card 查看请求同一表达式族（镜像值即该卡 props 真源——防付讫后 402 死锁）
  assert.ok(CARD.includes("wealthChartSigOf(birthDate, birthTime || '12:00', lat, lon, tz)"), 'Card 查看同表达式（单源铁律）');
  assert.ok(CARD.includes("onPurchase('tarot_daily_once')"), '买按钮接线 onPurchase');
  assert.ok(SANDBOX.includes("tarot_daily_once: '$1.99'"), '沙盒价 $1.99（冻结表）');
  assert.ok(SANDBOX.includes("tarot_daily_once: 'SandboxPlanTarotDaily'"), '沙盒词条键');
  assert.ok(DICT.includes('SandboxPlanTarotDaily'), 'terms dict 六语词条');
});

/* ═══════════ 锁4 刀四：字面级零违例（对话舱纯文字指路） ═══════════ */
test('E148-锁4a P1 六语词典零「解锁」族字眼（zh/en/fr/es/th/vi 全扫）', () => {
  const dict = TQ_SRC.slice(TQ_SRC.indexOf('const P1_GREETING_LINES'), TQ_SRC.indexOf('const P2_MOOD_BRIDGES'));
  const banned = ['解锁', 'unlocked', 'unlock', 'déverrouill', 'desbloqueaste', 'ปลดล็อก', 'mở khóa'];
  for (const w of banned) {
    assert.ok(!dict.includes(w), `P1 词典违例字眼「${w}」（军令：→ 开启/查看）`);
  }
  assert.ok(dict.includes('你开启的那份'), 'zh 首句钦定动词「开启」');
});

test('E148-锁4b whisper 钦定权益名词＋指路句（E130 含蓄点拨唯一词汇表）', () => {
  const fnPrompt = server.slice(
    server.indexOf('function buildFamiliarChatSystemPrompt'),
    server.indexOf('\n}\n', server.indexOf('function buildFamiliarChatSystemPrompt')),
  );
  assert.ok(fnPrompt.includes('【SUBTLE WHISPER（E130 军令'), 'whisper 块在位');
  for (const noun of ['月度星轨长卷', '年度宿命年鉴', '星际会员畅享']) {
    assert.ok(fnPrompt.includes(noun), `钦定权益名词「${noun}」缺失`);
  }
  assert.ok(fnPrompt.includes('在首页『开始测算』中开启'), '指路句「开启」形态缺失');
  assert.ok(fnPrompt.includes('在首页『开始测算』中查看'), '指路句「查看」形态缺失');
  assert.ok(fnPrompt.includes('绝不出现任何价格、金额'), 'E130 零价格红线原句保持');
});

test('E148-锁4c E112 层内句清洗：「主人刚刚开启了」＋旧「解锁了」零残留', () => {
  assert.ok(server.includes('主人刚刚开启了「'), 'E112 第五层内句钦定动词');
  assert.ok(!server.includes('主人刚刚解锁了「'), '旧内句零残留（字面级）');
});

/* ═══════════ 锁5 链位自保 ═══════════ */
test('E148-锁5 链位：e148 紧居 e147 后、e40-compat 前；全链 116＋node-only 115＋python 恒尾', () => {
  const chain = PKG.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 118, `链总段必须为 116（实际 ${segs.length}）`);
  const iE148 = segs.findIndex((s) => s.includes('audit-e148-tarot-daily-sanctuary'));
  const iE147 = segs.findIndex((s) => s.includes('audit-e147-seasonal-guard'));
  const iCompat = segs.findIndex((s) => s.includes('e40-compat'));
  const nodeOnly = segs.filter((s) => !/python/i.test(s));
  assert.ok(iE147 >= 0 && iE148 === iE147 + 1, `e148 紧居 e147 后（iE147=${iE147}, iE148=${iE148}）`);
  assert.ok(iE148 < iCompat, 'e148 居 e40-compat 前');
  assert.equal(nodeOnly.length, 117, `node-only 段必须为 115（实际 ${nodeOnly.length}）`);
  assert.ok(iCompat === segs.length - 2, `e40-compat 恒 len-2（iCompat=${iCompat}, len=${segs.length}）`);
  assert.ok(segs[segs.length - 1].includes('.py') || segs[segs.length - 1].includes('python'), 'python 恒链尾');
});
