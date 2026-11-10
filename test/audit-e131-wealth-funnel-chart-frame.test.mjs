/**
 * audit-e131-wealth-funnel-chart-frame.test.mjs —— E131 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E131-WEALTH-FUNNEL-AND-REPORT-FRAME（主公 2026-11-09）】：
 *   ①堵死付费墙短路（once 档按 birth+birthTime 盘坐标隔离，认领灵宠/旧权益禁串流）；
 *   ②$4.99 付讫即自动流式渲染金属框先天报告（免二次点击）；
 *   ③六语肃清付费墙「合婚/合盘」残留（军令钦定新文案，铁律 15）。
 * 断言组：
 *   E131-01 盘签名纯核行为（web/src/lib/wealthChartSig.mjs 可 import 真跑）：
 *           归一形态/畸形 fail-closed/名单双闸/全通判定/URL 提取（含 time 缺省 12:00）；
 *   E131-02 前后端同源镜像：server.js 内核四函数在位＋web 纯核同值同形
 *           ＋关键端点锚（entitlement 按盘闸/webhook 落名单/reset 清账/重购放行）；
 *   E131-03 付费墙短路根治（DoD-1）：WealthReportPage 整页门 AND 组合判定
 *           ＋e59 前缀锚兼容＋月报 402 回锁豁免＋import 三函数接线；
 *   E131-04 付讫即金属框直出（DoD-2）：E131-B 自动直出 effect（一次性闩）
 *           ＋reportLoading 三分支置 'wealth_once'＋金属框挂载判据＋按钮显隐排除；
 *   E131-05 六语零合婚字样（DoD-3）：WealthPaywall 六语扫描零残留
 *           ＋军令钦定新文案六语逐语在位；
 *   E131-06 沙盒付讫签名链路：complete 请求体可选 chart_sig＋收银台双回退签名源
 *           ＋session path/metadata 透传＋create-checkout body 带盘签名；
 *   S 链位自保：e131 入编（e130 后、e40-compat 前；全链 98→99 段）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）；
 *          段位断言只可「下界＋iCap===len-2」（VM 抽取式消费者铁律）。
 * 执行命令：node --test test/audit-e131-wealth-funnel-chart-frame.test.mjs
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
const PAYWALL = read('web/src/components/WealthPaywall.tsx');
const WEALTH_PAGE = read('web/src/pages/WealthReportPage.tsx');
const CASHIER = read('web/src/components/SandboxCashier.tsx');
const SB_CHECKOUT = read('web/src/lib/sandboxCheckout.mjs');
const SB_PAYMENT = read('lib/sandboxPayment.mjs');
const SIG_CORE = await import(pathToFileURL(join(ROOT, 'web/src/lib/wealthChartSig.mjs')));
const PKG = JSON.parse(read('package.json'));

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/* ═══════════ E131-01 盘签名纯核行为 ═══════════ */
test('E131-01 盘签名纯核：归一形态/畸形 fail-closed/名单双闸/全通/URL 提取', () => {
  // 归一形态（坐标 toFixed(4)；主公图 2 实弹盘）
  assert.equal(
    SIG_CORE.wealthChartSigOf('1976-12-03', '03:00', 30.7144, 111.2847, 'Asia/Shanghai'),
    '1976-12-03|03:00|30.7144|111.2847|Asia/Shanghai',
  );
  // 坐标数字串/浮点同形（唯一真源 toFixed(4)）
  assert.equal(SIG_CORE.wealthChartSigOf('1976-12-03', '03:00', '30.71440', 111.28471, 'Asia/Shanghai'),
    SIG_CORE.wealthChartSigOf('1976-12-03', '03:00', 30.7144, 111.2847, 'Asia/Shanghai'));
  // 畸形签名 ⇒ ''（fail-closed：绝不以残串铸进权益名单）
  assert.equal(SIG_CORE.normalizeWealthChartSig('not-a-sig'), '');
  assert.equal(SIG_CORE.normalizeWealthChartSig('1976-12-03|03:00|abc|111.28|Asia/Shanghai'), '');
  assert.equal(SIG_CORE.normalizeWealthChartSig(null), '');
  // 合法串重铸归一
  assert.equal(SIG_CORE.normalizeWealthChartSig('1976-12-03|03:00|30.7144|111.2847|Asia/Shanghai'),
    '1976-12-03|03:00|30.7144|111.2847|Asia/Shanghai');
  // 名单双闸（账号位+名单缺一不放行）
  const plans = { wealth_once: true, wealth_once_charts: ['1976-12-03|03:00|30.7144|111.2847|Asia/Shanghai'] };
  assert.equal(SIG_CORE.wealthOnceChartListed(plans, '1976-12-03|03:00|30.7144|111.2847|Asia/Shanghai'), true);
  assert.equal(SIG_CORE.wealthOnceChartListed(plans, '1988-06-15|12:00|13.7500|100.5000|Asia/Bangkok'), false, '新盘未付讫 ⇒ false（付费墙短路根治）');
  assert.equal(SIG_CORE.wealthOnceChartListed({ wealth_once: false, wealth_once_charts: ['x'] }, 'x'), false, '无账号位 ⇒ false');
  assert.equal(SIG_CORE.wealthOnceChartListed({ wealth_once: true }, 'sig'), false, '无名单 ⇒ false');
  assert.equal(SIG_CORE.wealthOnceChartListed(plans, ''), false, '空签名 ⇒ false');
  // 全通判定（年卡/月订任一在期）
  assert.equal(SIG_CORE.wealthAllPassActive({ all_pass_yearly: true }, 1e12), true);
  assert.equal(SIG_CORE.wealthAllPassActive({ all_pass_yearly: true, all_pass_expires_at: '2000-01-01' }, Date.now()), false, '年卡过期 ⇒ false');
  assert.equal(SIG_CORE.wealthAllPassActive({ all_pass_monthly: true, all_pass_monthly_expires_at: '2099-01-01' }, Date.now()), true);
  // URL 提取（完整参）
  assert.equal(SIG_CORE.wealthChartSigFromSearch('?birth=1976-12-03&birthTime=03:00&lat=30.7144&lon=111.2847&tz=Asia/Shanghai'),
    '1976-12-03|03:00|30.7144|111.2847|Asia/Shanghai');
  // time 缺省 12:00（与 WealthReportPage state 默认 V91 同源——防前后端签名错位死锁）
  assert.equal(SIG_CORE.wealthChartSigFromSearch('?birth=1976-12-03&lat=30.7144&lon=111.2847&tz=Asia/Shanghai'),
    '1976-12-03|12:00|30.7144|111.2847|Asia/Shanghai');
  // 缺 birth（/sandbox-pay 直达等非报告页上下文）⇒ ''（旧行为零变）
  assert.equal(SIG_CORE.wealthChartSigFromSearch('?plan=wealth_once&session=cs_sandbox_n1'), '');
  // 坐标缺省曼谷默认盘（与 state 默认同源）
  assert.equal(SIG_CORE.wealthChartSigFromSearch('?birth=1976-12-03&birthTime=03:00'),
    '1976-12-03|03:00|13.7500|100.5000|Asia/Bangkok');
});

/* ═══════════ E131-02 前后端同源镜像 ═══════════ */
test('E131-02 server 内核镜像在位：四函数＋按盘闸＋落名单＋清账＋重购放行', () => {
  // 服务器侧同源内核（与 web 纯核逐字镜像）
  assert.ok(server.includes('const WEALTH_CHART_SIG_MAX = 50;'), 'server WEALTH_CHART_SIG_MAX 在位（与 web 纯核同值 50）');
  assert.equal(SIG_CORE.WEALTH_CHART_SIG_MAX, 50, 'web 纯核同值 50');
  for (const fn of ['function wealthChartSigOf(', 'function normalizeWealthChartSig(', 'function wealthOnceChartListed(', 'function wealthAllPassActive(']) {
    assert.ok(server.includes(fn), `server ${fn} 在位`);
  }
  // entitlement 按盘闸（once 且账号位命中 ⇒ 必须名单内，否则 NO_ENTITLEMENT）
  assert.ok(server.includes("if (reportType === 'once' && method === 'wealth_once')"), 'resolveWealthEntitlement once 按盘闸');
  assert.ok(server.includes('wealthOnceChartListed(plans, _e131Sig)'), '验签用 wealthOnceChartListed');
  // webhook 落名单（并集去重+封顶）
  assert.ok(server.includes('_e131List.push(_e131ChartSig)'), 'webhook 名单 push');
  assert.ok(server.includes('updatedPlans.wealth_once_charts = _e131List.slice(-WEALTH_CHART_SIG_MAX)'), '名单封顶 slice(-50)');
  // reset-purchase 清账
  assert.ok(server.includes('delta.wealth_once_charts = []'), 'reset-purchase 清空名单');
  // create-checkout once 换盘重购放行
  assert.ok(server.includes('_e131OnceRebuy'), 'once 换盘重购放行分支');
  // sandbox/complete 收银台上送签名
  assert.ok(server.includes('normalizeWealthChartSig((req.body || {}).chart_sig)'), 'sandbox/complete 签名归一入体');
});

/* ═══════════ E131-03 付费墙短路根治（DoD-1） ═══════════ */
test('E131-03 未付费新盘必现付费墙：整页门 AND 组合判定（e59 锚兼容）', () => {
  // import 三函数接线
  assert.ok(WEALTH_PAGE.includes("import { wealthChartSigFromSearch, wealthOnceChartListed, wealthAllPassActive } from '../lib/wealthChartSig.mjs'"),
    'WealthReportPage 接入盘签名纯核三函数');
  // 整页门组合判定（e59 前缀锚保留 + AND 叠加第二闸）
  assert.ok(WEALTH_PAGE.includes("const isWealthPaid = wealthEntitledFor('once', rawPlans, _upgradeGreen)"),
    'e59 直取同源纯函数前缀锚在位');
  assert.ok(WEALTH_PAGE.includes('wealthOnceChartListed(rawPlans, _e131Sig) || wealthAllPassActive(rawPlans))'),
    'AND 组合第二闸：盘名单 ∪ 有效全通（未付费新盘必停付费墙）');
  // 付讫真值闩（checkPaidStatus 命中即置）
  assert.ok(WEALTH_PAGE.includes('if (isWealthPaid) onceChartUnlockedRef.current = true;'), '按盘真值闩置位');
  // 月报 402 回锁豁免（once 已付讫/全通 ⇒ 绝不连带锁死整页）
  assert.ok(WEALTH_PAGE.includes('if (!isFreeAccess && !onceChartUnlockedRef.current)'), '402 回锁豁免按盘真值闩');
  // applyWealthGrant 付讫即置闩
  assert.ok(WEALTH_PAGE.includes('onceChartUnlockedRef.current = true;'), '付讫即置真值闩（applyWealthGrant）');
});

/* ═══════════ E131-04 付讫即金属框直出（DoD-2） ═══════════ */
test('E131-04 付讫自动直出：E131-B effect＋loading 三分支＋金属框挂载判据＋按钮显隐', () => {
  // 自动直出 effect（一次性闩）
  assert.ok(WEALTH_PAGE.includes('onceAutoGenRef.current = true;'), '一次性闩置位');
  assert.ok(/onceAutoGenRef\.current = true;\s*\n\s*generateWealthReport\('once'\);/.test(WEALTH_PAGE), '闩后自动发起 once 生成');
  assert.ok(WEALTH_PAGE.includes('if (isGreenChannelRef.current) return;'), '绿道豁免（E130 纯净态行为零变）');
  // loading 三分支（once 置 'wealth_once'——金属框挂载判据由此点亮）
  assert.ok(WEALTH_PAGE.includes("(type === 'once' ? 'wealth_once' : 'wealth_yearly')"), 'reportLoading 三分支');
  // 金属框挂载判据
  assert.ok(WEALTH_PAGE.includes("reportLoading === 'wealth_once'"), '金属框挂载判据 reportLoading===wealth_once');
  // 按钮显隐排除 once 生成中
  assert.ok(WEALTH_PAGE.includes("reportLoading !== 'wealth_once'"), '生成 AI 洞察按钮 once 生成中隐藏');
  // applyWealthGrant 旧自动生成分支留存（沙盒 granted 无参回调 ⇒ effect 接管，分支作兜底）
  assert.ok(WEALTH_PAGE.includes("if (plan === 'wealth_once')"), 'plan===wealth_once 兜底分支在位');
});

/* ═══════════ E131-05 六语零合婚字样（DoD-3，铁律 15） ═══════════ */
test('E131-05 六语肃清：付费墙零合婚/合盘字样＋军令钦定新文案六语逐语在位', () => {
  // 六语残留扫描（真零命中——含注释须谨慎：只扫 I18N 字符串面，先剥离注释行）
  const paywallNoComments = PAYWALL.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const FORBIDDEN = ['合婚', '合盘', 'compatibility', 'compatibilidad', 'compatibilité', 'ความเข้ากันได้', 'tương hợp', 'synastry', 'Synastry'];
  for (const tok of FORBIDDEN) {
    assert.ok(!paywallNoComments.includes(tok), `WealthPaywall 零「${tok}」残留`);
  }
  // 军令钦定新文案：monthlyDesc 六语（核心锚：双模块洞察+月度财运预警）
  const MD_ANCHOR = {
    zh: '解锁全部月度报告 · 姻缘与财富双模块 AI 深度洞察 · 锁定流月财运预警',
    en: 'Unlock all monthly reports · AI deep insights for both love & wealth modules · Monthly fortune alerts',
    es: 'Desbloquea todos los informes mensuales',
    fr: 'Débloque tous les rapports mensuels',
    th: 'ปลดล็อกรายงานรายเดือนทั้งหมด',
    vi: 'Mở khóa tất cả báo cáo hàng tháng',
  };
  // 军令钦定新文案：unlock（$99.99 年卡描述）六语
  const UL_ANCHOR = {
    zh: '解锁全年全部报告（含姻缘/财富双模块月报与年报）· 专属灵宠全长程陪伴特权',
    en: 'All yearly reports (love & wealth, monthly & yearly) · Dedicated familiar full-journey companionship',
    es: 'Desbloquea todos los informes del año',
    fr: 'mensuels et annuels) · Compagnie dédiée de votre familier sur tout le parcours',
    th: 'ปลดล็อกรายงานทั้งปี',
    vi: 'Mở khóa toàn bộ báo cáo cả năm',
  };
  for (const lang of LANGS) {
    assert.ok(PAYWALL.includes(MD_ANCHOR[lang]), `I18N[${lang}] monthlyDesc 军令新文案在位`);
    assert.ok(PAYWALL.includes(UL_ANCHOR[lang]), `I18N[${lang}] unlock 军令新文案在位`);
  }
});

/* ═══════════ E131-06 沙盒付讫签名链路 ═══════════ */
test('E131-06 沙盒签名链：complete 可选 chart_sig＋收银台双回退＋session path/metadata 透传＋create-checkout 带盘', async () => {
  // complete 请求体可选签名（缺省旧形态逐字不变——gate45b deepEqual 契约零扰）
  assert.ok(SB_CHECKOUT.includes('export function buildSandboxCompleteRequest(plan, chartSig)'), '双参签名');
  const M = await import(pathToFileURL(join(ROOT, 'web/src/lib/sandboxCheckout.mjs')));
  assert.deepEqual(M.buildSandboxCompleteRequest('wealth_once'),
    { path: '/api/sandbox/complete', method: 'POST', body: { plan: 'wealth_once' } }, '单参旧形态零变（gate45b 契约）');
  assert.deepEqual(M.buildSandboxCompleteRequest('wealth_once', '1976-12-03|03:00|30.7144|111.2847|Asia/Shanghai'),
    { path: '/api/sandbox/complete', method: 'POST', body: { plan: 'wealth_once', chart_sig: '1976-12-03|03:00|30.7144|111.2847|Asia/Shanghai' } }, '带签名新形态');
  // 收银台双回退签名源（页面 URL 优先；/sandbox-pay 直达从 req.url query 提取）
  assert.ok(CASHIER.includes("wealthChartSigFromSearch(window.location.search)"), '签名源①：页面 URL');
  assert.ok(CASHIER.includes("wealthChartSigFromSearch(((req.url || '').split('?')[1]) || '')"), '签名源②：收银台 url query 兜底');
  // 后端沙盘 session：path 追加 chart_sig（直达兜底链）＋metadata 三钥形态
  assert.ok(SB_PAYMENT.includes("'&chart_sig=' + encodeURIComponent(chartSig)"), 'path 追加 chart_sig');
  assert.ok(SB_PAYMENT.includes('metadata: chartSig ? { supabase_user_id: userId, plan, chart_sig: chartSig }'), 'metadata 三钥形态（缺省双钥零变）');
  // 前端 create-checkout 请求体带盘签名
  assert.ok(WEALTH_PAGE.includes('chart_sig: wealthChartSigFromSearch(window.location.search) || undefined'), 'handlePurchase 上送盘签名');
});

/* ═══════════ S 链位自保 ═══════════ */
test('E131-S 链位自保：e131 入编（e130 后、e40-compat 前；全链 98→99 段）', () => {
  const chain = PKG.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.ok(segs.length >= 100, `链段下界 100（实际 ${segs.length}）`);
  const iE131 = segs.findIndex((s) => s.includes('audit-e131-wealth-funnel-chart-frame'));
  const iE130 = segs.findIndex((s) => s.includes('audit-e130-sanctuary-restore'));
  const iCompat = segs.findIndex((s) => s.includes('e40-compat'));
  const iPython = segs.length - 1;
  assert.ok(iE130 >= 0 && iE131 === iE130 + 1, `e131 紧随 e130（iE130=${iE130}, iE131=${iE131}）`);
  assert.ok(iE131 < iCompat, 'e131 居 e40-compat 前');
  assert.ok(iCompat === segs.length - 2, `e40-compat 恒 len-2（iCompat=${iCompat}, len=${segs.length}）`);
  assert.ok(segs[iPython].includes('.py') || segs[iPython].includes('python'), 'python 恒链尾');
});
