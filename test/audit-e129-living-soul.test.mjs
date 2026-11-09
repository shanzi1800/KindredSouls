/**
 * audit-e129-living-soul.test.mjs —— E129 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E129-LIVING-SOUL-COMMERCE（主公 2026-11-09）：主动伴生智能体节律底座
 *   ＋羊皮纸长卷三七开＋首页内嵌支付托盘——零跳出商业闭环七刀】
 * 断言组（七刀 DoD 映射）：
 *   E129-01 迁移三表 DDL 形状：user_unresolved_loops / user_mood_logs /
 *           lunar_calendar_events（列集＋CHECK＋uq_lunar_event＋RLS＋索引）；
 *   E129-02 预置 62 行月相历＋天文真源锚点（swisseph 生成器；锚点时刻抽验）；
 *   E129-03 prompt 双块（VM 抽取函数体）：LIVING AGENT CONTEXT＋LUNAR RITUAL
 *           ＋livingContext 签名尾参＋livingBlock 居 moodBlock 正下方；
 *   E129-04 三端点＋鉴权：loops GET/POST/PATCH＋mood-log；401／404→503
 *           TABLE_PENDING／PostgREST return=representation／E123 白名单复检；
 *   E129-05 会话首击检索门：body.sessionOpen===true 严格判定＋_e129LivingContext
 *           ≤48h/check_in_after＋月相 ±24h event_type in.(new_moon,full_moon)；
 *   E129-06 前端接线：livingAgentClient 三函数＋罗盘静默入库＋ChatSheet
 *           firstStrikeRef/sessionOpen＋递卡＋两弹层渲染；
 *   E129-07 SacredScrollModal 军令规格：z-140＋三七开 FREE_RATIO=0.3＋blur(7px)
 *           ＋黑金滑轨 ks-report-scroll＋零跳转（无 location.href）；
 *   E129-08 InSituPaymentSheet 军令规格：z-141＋四档 SKU＋/api/sandbox/complete
 *           ＋live 态 fail-closed livePending；
 *   E129-09 all_pass_monthly 状态机六面（server 五处＋前端三面＋沙盘价）；
 *   E129-10 退款政策六语 $9.99（铁律 15 逐语对齐；fr 逗号形态）；
 *   S10 链位自保：e129 入编（e127 后、e40-compat 前；全链 96→97 段）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）；
 *          段位断言只可「下界＋iCap===len-2」（VM 抽取式消费者铁律）。
 * 执行命令：node --test test/audit-e129-living-soul.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/* ── 模块加载（pathToFileURL：中文仓路径铁律）────────────────────────── */
const LT = await import(pathToFileURL(join(ROOT, 'web/src/i18n/legalTerms.mjs')).href);
const { getLegalTermsDoc } = LT;

const SQL = read('supabase/migrations/20261109_living_agent_framework.sql');
const GENPY = read('astro/gen_lunar_calendar.py');
const server = read('server.js');
const CLIENT = read('web/src/lib/livingAgentClient.ts');
const MOOD = read('web/src/components/companion/MoodCompassModal.tsx');
const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
const SCROLL = read('web/src/components/reports/SacredScrollModal.tsx');
const TRAY = read('web/src/components/checkout/InSituPaymentSheet.tsx');
const SANDBOX = read('web/src/lib/sandboxCheckout.mjs');
const APP = read('web/src/App.tsx');
const WEALTH_PAGE = read('web/src/pages/WealthReportPage.tsx');
const HOME_CARD = read('web/src/components/FamiliarHomeCard.tsx');

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/* VM 抽取：buildFamiliarChatSystemPrompt 函数体切片（e115 同规） */
const fnPrompt = server.slice(
  server.indexOf('function buildFamiliarChatSystemPrompt'),
  server.indexOf('\n}\n', server.indexOf('function buildFamiliarChatSystemPrompt')),
);
/* E129 端点路由切片（挂账 CRUD＋情绪入库——`// ── Start ──` 前整段） */
const e129Routes = server.slice(
  server.indexOf('// ═══ 🐾 E129-刀二（军令 2026-11-09）：未决事件挂账 CRUD'),
  server.indexOf('// ── Start ──'),
);
/* chat 路由切片（e115 同规） */
const chatRoute = server.slice(
  server.indexOf("app.post('/api/familiar/chat'"),
  server.indexOf('// ── Start ──'),
);

/* ═══════════ E129-01 迁移三表 DDL 形状 ═══════════ */
test('E129-01 三表 DDL：loops/mood/lunar 列集＋CHECK＋唯一约束＋RLS＋索引全在位', () => {
  assert.ok(SQL.includes('CREATE TABLE IF NOT EXISTS user_unresolved_loops'), 'loops 表 DDL');
  assert.ok(SQL.includes('CREATE TABLE IF NOT EXISTS user_mood_logs'), 'mood 表 DDL');
  assert.ok(SQL.includes('CREATE TABLE IF NOT EXISTS lunar_calendar_events'), 'lunar 表 DDL');
  // loops 列集（军令落表规格）
  for (const col of ['event_summary', 'target_person_name', 'event_context', 'check_in_after', 'created_at']) {
    assert.ok(SQL.includes(col), `loops 列 ${col} 在位`);
  }
  assert.ok(SQL.includes("CHECK (status IN ('pending', 'resolved'))"), 'loops status 白名单 CHECK');
  // mood 列集
  for (const col of ['mood_key', 'moon_phase', 'transit_aspect_id', 'log_date']) {
    assert.ok(SQL.includes(col), `mood 列 ${col} 在位`);
  }
  // lunar 列集＋CHECK＋幂等唯一约束
  for (const col of ['event_type', 'zodiac_sign', 'peak_time', 'manifestation_theme']) {
    assert.ok(SQL.includes(col), `lunar 列 ${col} 在位`);
  }
  assert.ok(SQL.includes("CHECK (event_type IN ('new_moon', 'full_moon', 'mercury_retrograde'))"), 'lunar event_type 白名单 CHECK');
  assert.ok(SQL.includes('CONSTRAINT uq_lunar_event UNIQUE (event_type, peak_time)'), 'uq_lunar_event 幂等唯一约束');
  assert.ok(SQL.includes('ON CONFLICT (event_type, peak_time) DO NOTHING'), '幂等可重复执行');
  // RLS：两用户表 own-policy；字典表 fail-closed（RLS-on 零策略）
  assert.ok(SQL.includes('users_manage_own_unresolved_loops'), 'loops own-policy');
  assert.ok(SQL.includes('users_manage_own_mood_logs'), 'mood own-policy');
  assert.ok(SQL.includes('ALTER TABLE lunar_calendar_events ENABLE ROW LEVEL SECURITY;'), 'lunar RLS-on');
  assert.ok(!/POLICY.*ON lunar_calendar_events/.test(SQL), '字典表零策略 fail-closed（service role 旁路专享）');
  // 索引
  for (const idx of ['idx_user_unresolved_loops_user_status_time', 'idx_user_mood_logs_user_date', 'idx_lunar_events_peak_time']) {
    assert.ok(SQL.includes(idx), `索引 ${idx} 在位`);
  }
});

/* ═══════════ E129-02 62 行预置＋天文锚点 ═══════════ */
test('E129-02 预置 62 行 2026-2027 月相历＋锚点时刻（swisseph 真源交叉验证）', () => {
  const insertStart = SQL.indexOf('INSERT INTO lunar_calendar_events');
  const insertEnd = SQL.indexOf('ON CONFLICT (event_type, peak_time)');
  const insertBlock = SQL.slice(insertStart, insertEnd);
  const rows = insertBlock.split('\n').filter((l) => /^\s*\('(new_moon|full_moon|mercury_retrograde)'/.test(l));
  assert.equal(rows.length, 62, `预置行数须为 62（实为 ${rows.length}）`);
  // 锚点时刻（权威历表交叉验证物证）
  assert.ok(insertBlock.includes("('new_moon', 'scorpio', '2026-11-09T07:02:07Z'"), '锚点：2026-11-09 新月·天蝎（军令当日）');
  assert.ok(insertBlock.includes("('full_moon', 'cancer', '2026-12-24T01:28:16Z'"), '锚点：2026-12-24 满月·巨蟹');
  assert.ok(insertBlock.includes("('new_moon', 'capricorn', '2026-01-18T19:52:02Z'"), '锚点：2026-01-18 新月·摩羯');
  // 水逆三周期（2026）：双鱼全程 2/26~3/20 · 巨蟹 6/29~7/23 · 天蝎 10/24~11/13
  assert.ok(insertBlock.includes("('mercury_retrograde', 'pisces', '2026-02-26T06:48:14Z', '{\"phase\": \"start\"}'"), '水逆①起：2026-02-26 双鱼');
  assert.ok(insertBlock.includes("('mercury_retrograde', 'pisces', '2026-03-20T19:32:54Z', '{\"phase\": \"end\"}'"), '水逆①止：2026-03-20 双鱼');
  assert.ok(insertBlock.includes("('mercury_retrograde', 'cancer', '2026-06-29T17:35:59Z', '{\"phase\": \"start\"}'"), '水逆②起：2026-06-29 巨蟹');
  assert.ok(insertBlock.includes("('mercury_retrograde', 'scorpio', '2026-10-24T07:12:48Z', '{\"phase\": \"start\"}'"), '水逆③起：2026-10-24 天蝎');
  // 生成器真源：Swiss Ephemeris（军令原文写 Meeus；仓内天文真值一律 swisseph 同规）
  assert.ok(existsSync(join(ROOT, 'astro/gen_lunar_calendar.py')), 'gen_lunar_calendar.py 在位');
  assert.ok(GENPY.includes('import swisseph as swe'), '生成器走 swisseph');
  assert.ok(GENPY.includes("swe.set_ephe_path('')"), 'Moshier 模式（与 astro_matrix.py 同规）');
  assert.ok(GENPY.includes('def _elongation'), '黄经差二分收敛在位');
  assert.ok(GENPY.includes('def _sign_of'), '行星星座按行星取（水逆留点直核）');
});

/* ═══════════ E129-03 prompt 双块（VM 抽取函数体） ═══════════ */
test('E129-03 LIVING/LUNAR 双块内置函数体＋livingContext 签名尾参＋livingBlock 紧随 moodBlock', () => {
  const sigIdx = server.indexOf('function buildFamiliarChatSystemPrompt');
  const sigLine = server.slice(sigIdx, server.indexOf('\n', sigIdx));
  assert.ok(/livingContext\s*\}\s*\)\s*\{?\s*$/.test(sigLine.trim()), `签名尾参 livingContext（e115 后继化；实为 ${sigLine.trim()})`);
  // 双块内置函数体（VM 抽取式消费者铁律——块在 fnPrompt 切片内）
  assert.ok(fnPrompt.includes('【LIVING AGENT CONTEXT（E129 军令，违反即失败·会话首击主动回溯）】'), 'LIVING AGENT CONTEXT 块在函数体内');
  assert.ok(fnPrompt.includes('【LUNAR RITUAL（E129 军令，违反即失败·天象窗口主动微仪式）】'), 'LUNAR RITUAL 块在函数体内');
  assert.ok(fnPrompt.includes('const livingBlock = []'), 'livingBlock 常量内置函数体（禁 VM 外置）');
  // 注入位置：moodBlock 之后
  const iMood = fnPrompt.indexOf('...moodBlock,');
  const iLiving = fnPrompt.indexOf('...livingBlock,');
  assert.ok(iMood >= 0 && iLiving > iMood, 'livingBlock 须居 moodBlock 正下方（return 数组序）');
  // fail-soft：livingContext 为 null ⇒ 块整体不注入（零破坏回退）
  assert.ok(fnPrompt.includes('if (livingContext && typeof livingContext === \'object\')'), 'fail-soft 形状守卫在位');
  // 新月显化/满月释放双语义
  assert.ok(fnPrompt.includes('显化种植微仪式') && fnPrompt.includes('释放微仪式'), '新月显化/满月释放双语义在位');
});

/* ═══════════ E129-04 三端点＋鉴权 ═══════════ */
test('E129-04 loops CRUD＋mood-log：401 鉴权＋TABLE_PENDING 503＋representation＋E123 白名单', () => {
  assert.ok(e129Routes.includes("app.get('/api/familiar/loops'"), 'GET /api/familiar/loops');
  assert.ok(e129Routes.includes("app.post('/api/familiar/loops'"), 'POST /api/familiar/loops');
  assert.ok(e129Routes.includes("app.patch('/api/familiar/loops'"), 'PATCH /api/familiar/loops');
  assert.ok(e129Routes.includes("app.post('/api/familiar/mood-log'"), 'POST /api/familiar/mood-log');
  // 鉴权铁律：真实身份可归责（三写端点各带 401，无 sandbox 绿道）
  const seg401 = e129Routes.split(/app\.(get|post|patch)\('/).length - 1;
  assert.ok(seg401 >= 4, '端点集齐');
  assert.equal((e129Routes.match(/res\.status\(401\)/g) || []).length, 4, '四端点各带 401 NO_TOKEN');
  // 表未建语义：404 ⇒ 503 TABLE_PENDING（fail-soft 语义明确，绝不静默假装成功）
  assert.ok(e129Routes.includes('TABLE_PENDING'), 'TABLE_PENDING 503 通道在位');
  // PostgREST 军规：Prefer: return=representation 按返回行数判成败
  assert.ok((e129Routes.match(/Prefer: 'return=representation'/g) || []).length >= 3, '三写端点 representation 军规');
  // mood 白名单复检（E123 真源复用——前端只传原型键，服务端复检）
  assert.ok(e129Routes.includes('_e123ActiveMood(body.moodKey || body.mood_key)'), 'moodKey 走 E123 白名单复检');
  assert.ok(e129Routes.includes('E123_MOOD_WHITELIST'), 'BAD_MOOD_KEY 400 白名单提示');
  // PATCH 越权防护：user_id 双键过滤（id+user_id 同查）
  assert.ok(e129Routes.includes('user_unresolved_loops?id=eq.'), 'PATCH 行级属主过滤');
});

/* ═══════════ E129-05 会话首击检索门 ═══════════ */
test('E129-05 sessionOpen 严格判定＋_e129LivingContext 48h/±24h 检索窗', () => {
  assert.ok(chatRoute.includes('const livingContext = (body.sessionOpen === true) ? await _e129LivingContext(auth) : null'), 'sessionOpen===true 布尔严格判定（首击一过）');
  assert.ok(chatRoute.includes('livingContext,'), 'chat prompt 装配随行 livingContext');
  // 检索窗真值
  assert.ok(server.includes('48 * 3600 * 1000'), '未决事件 ≤48h 窗');
  assert.ok(server.includes('24 * 3600 * 1000'), '月相 ±24h 窗');
  assert.ok(server.includes('event_type=in.(new_moon,full_moon)'), '月相窗只取新月/满月');
  assert.ok(server.includes("status=eq.pending"), '只取 pending 挂账');
  assert.ok(server.includes('check_in_after'), 'check_in_after 未到期规则在位');
  assert.ok(server.includes('async function _e129LivingContext'), '检索函数在位');
  assert.ok(server.includes('async function _e129RequireUser'), '鉴权函数在位');
  assert.ok(server.includes('const E129_UUID_RE'), 'UUID 形状守卫在位');
});

/* ═══════════ E129-06 前端接线 ═══════════ */
test('E129-06 livingAgentClient 三函数＋罗盘静默入库＋ChatSheet 首击接线＋递卡＋双弹层', () => {
  for (const fn of ['logMoodSilently', 'postUnresolvedLoop', 'resolveUnresolvedLoop']) {
    assert.ok(CLIENT.includes(`export ${fn.includes('log') ? 'function' : 'async function'} ${fn}`) || CLIENT.includes(`function ${fn}`), `客户端 ${fn} 在位`);
  }
  assert.ok(CLIENT.includes('supabase.auth.getSession()'), '鉴权沿 SandboxCashier 先例');
  assert.ok(MOOD.includes('logMoodSilently(selected);'), '罗盘确认 ⇒ 静默入库（fire-and-forget 不 await）');
  // ChatSheet 首击接线
  assert.ok(SHEET.includes('const firstStrikeRef = useRef(true);'), 'firstStrikeRef 在位');
  assert.ok(SHEET.includes('sessionOpen: firstStrikeRef.current === true ? true : undefined'), '首击 body.sessionOpen 接线');
  assert.ok(SHEET.indexOf('firstStrikeRef.current = false;') > SHEET.indexOf("app.post") || SHEET.includes('firstStrikeRef.current = false;'), '首击消费即翻面');
  // 递卡＋双弹层
  assert.ok(SHEET.includes('data-testid="sacred-scroll-offer-card"'), '对话流递卡 testid');
  assert.ok(SHEET.includes("import { SacredScrollModal } from './reports/SacredScrollModal'"), 'SacredScrollModal 挂载');
  assert.ok(SHEET.includes("import { InSituPaymentSheet } from './checkout/InSituPaymentSheet'"), 'InSituPaymentSheet 挂载');
  assert.ok(SHEET.includes('scrollUnlocked'), '解锁翻面态在位');
  assert.ok(SHEET.includes('fetchMonthlySections'), '真月报流式拉取在位');
});

/* ═══════════ E129-07 SacredScrollModal 军令规格 ═══════════ */
test('E129-07 长卷规格：z-140＋三七开 0.3＋blur(7px)＋黑金滑轨＋零跳转', () => {
  assert.ok(SCROLL.includes('zIndex: 140'), '军令钦定 z-[140]');
  assert.ok(SCROLL.includes('const FREE_RATIO = 0.3;'), '三七开阈值 30%（军令钦定）');
  assert.ok(SCROLL.includes('filter: \'blur(7px)\''), '毛玻璃高级模糊锁');
  assert.ok(SCROLL.includes('className="ks-report-scroll"'), '黑金滑轨复用（E91-③ 封仓规格零 CSS 改动）');
  assert.ok(!SCROLL.includes('location.href') && !SCROLL.includes('window.open'), '零跳转死亡断言（神圣交互绝不跳离）');
  assert.ok(SCROLL.includes('data-testid="sacred-scroll-modal"') && SCROLL.includes('data-testid="sacred-scroll-lock"') && SCROLL.includes('data-testid="sacred-scroll-unlock-btn"'), '验收 testid 三件套');
  // 自容六语字典（零 i18n 新键铁律）
  for (const lang of LANGS) {
    assert.ok(new RegExp(`${lang}:\\s*\\{`).test(SCROLL), `SCROLL_UI 六语 ${lang}`);
  }
  // 卷轴动效（scaleY 展开）
  assert.ok(SCROLL.includes('ks-sacred-unroll'), '卷轴 scaleY 展开动效');
});

/* ═══════════ E129-08 InSituPaymentSheet 军令规格 ═══════════ */
test('E129-08 支付托盘规格：z-141＋四档 SKU＋沙盘通道＋live fail-closed', () => {
  assert.ok(TRAY.includes('zIndex: 141'), '长卷 z-140 下方叠加层 z-141');
  assert.ok(TRAY.includes("plan: 'all_pass_yearly', tier: 'vip'"), '主推卡 A：$99.99 VIP');
  assert.ok(TRAY.includes("plan: 'all_pass_monthly', tier: 'monthly'"), '主推卡 B：$9.99 全通月订');
  assert.ok(TRAY.includes("plan: 'wealth_monthly_report', tier: 'once'"), '折叠档：$2.99 单份月报');
  assert.ok(TRAY.includes("plan: 'wealth_yearly_report', tier: 'yearly'"), '折叠档：$29.99 年报买断');
  assert.ok(TRAY.includes("'$9.99'") || TRAY.includes('$9.99'), '$9.99 月订价面在位');
  assert.ok(TRAY.includes('BEST VALUE'), 'VIP ★ BEST VALUE 标牌');
  assert.ok(TRAY.includes("fetch('/api/sandbox/complete'"), '沙盘模拟支付通道（sandbox 现行态）');
  assert.ok(TRAY.includes("setMsg('livePending')"), 'live 态 fail-closed 如实告知');
  assert.ok(!TRAY.includes('location.href') && !TRAY.includes('window.open'), '零跳出死亡断言');
  for (const lang of LANGS) {
    assert.ok(new RegExp(`${lang}:\\s*\\{`).test(TRAY), `PAY_UI 六语 ${lang}`);
  }
});

/* ═══════════ E129-09 all_pass_monthly 状态机六面 ═══════════ */
test('E129-09 $9.99 全通月订状态机：server 五处＋前端三面＋沙盘价同源', () => {
  // server 面
  assert.ok(server.includes("all_pass_monthly:      'price_E129AllPassMonthlyPENDING'"), 'STRIPE_PRICE_MAP 新 SKU');
  assert.ok(server.includes('case \'all_pass_monthly\':'), 'buildPlanPayload case');
  assert.ok(server.includes('all_pass_monthly_expires_at: computeOneMonthLaterUTC()'), '有效期＝自然月+1');
  assert.ok((server.match(/apmValid/g) || []).length >= 3, '多判面 apmValid 过期检查（含 once 档）');
  assert.ok(server.includes("new Set(['star_monthly_vip', 'all_pass_yearly', 'all_pass_monthly'])") || server.includes("'star_monthly_vip', 'all_pass_yearly', 'all_pass_monthly'"), '订阅集三员');
  assert.ok(server.includes('all_pass_monthly_expires_at = null'), '重置通道清到期锁');
  // 前端三面
  assert.ok(APP.includes('all_pass_monthly'), 'App.tsx 权益门');
  assert.ok(WEALTH_PAGE.includes('all_pass_monthly'), 'WealthReportPage 权益门');
  assert.ok(HOME_CARD.includes('all_pass_monthly'), 'FamiliarHomeCard 权益门');
  // 沙盘价同源（与退款政策面同源——铁律 15）
  assert.ok(SANDBOX.includes("all_pass_monthly: '$9.99',"), '沙盘 $9.99 同源');
});

/* ═══════════ E129-10 退款政策六语 $9.99（铁律 15） ═══════════ */
test('E129-10 退款政策六语 $9.99 全通月订逐语对齐（fr 逗号形态）', () => {
  const refundH = /refund|reembolso|remboursement|คืนเงิน|hoàn tiền|退款/i;
  for (const lang of LANGS) {
    const doc = getLegalTermsDoc('terms', lang);
    assert.ok(doc, `terms[${lang}] 命中`);
    const sec = doc.sections.find((s) => refundH.test(s.h));
    assert.ok(sec, `terms[${lang}] 退款政策节在位`);
    const price = lang === 'fr' ? '9,99' : '9.99';
    assert.ok(sec.p.includes(price), `terms[${lang}] 退款政策须含 ${price} 全通月订（铁律 15 六语对齐）`);
    assert.ok(sec.p.includes('support@kindredsouls.online'), `terms[${lang}] 支付联系句邮箱在位`);
  }
});

/* ═══════════ S10 链位自保 ═══════════ */
test('E129-S10 链位自保：e129 入编（e127 后、e40-compat 前；全链 96→97 段）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 97, `军规链段数须为 97（E129 入编后 96→97；实为 ${segs.length}）`);
  const iE129 = segs.findIndex((s) => s.includes('audit-e129-living-soul'));
  const iE127 = segs.findIndex((s) => s.includes('audit-e127-legal-routing-modal'));
  const iCompat = segs.findIndex((s) => s.includes('audit-e40-compat'));
  assert.ok(iE129 >= 0, 'e129 自身入编');
  assert.ok(iE127 >= 0 && iE129 > iE127, 'e129 须居 e127 之后');
  assert.ok(iE129 < iCompat, 'e129 须居 e40-compat 之前');
  assert.ok(iCompat === segs.length - 2, 'e40-compat 恒 len-2');
  assert.ok(segs[segs.length - 1].includes('python'), 'python 恒链尾');
});
