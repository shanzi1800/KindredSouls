import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const APP = read('web/src/App.tsx');
const PW = read('web/src/components/PaywallCard.tsx');
const PKG = JSON.parse(read('package.json'));

/**
 * E133-ROMANCE-PAYWALL-PARITY（主公军令 2026-11-10，四刀）
 * ══════════════════════════════════════════════════════════════════════
 * 刀一（孵化前置）：「为你孵化专属灵宠」嵌入姻缘付费墙「解锁你们的灵魂密码」
 *   卡正上方（与财富模块 E132 动线镜像）；未付费全卡上锁（E48 门禁）＋
 *   Toast 引导＋平滑滚动至 $4.99；E34 D5 白名单（须 c1 真实城市）。
 * 刀二（标牌肃清＋🔮左置）：付费卡上方孤立「✨ AI 深度洞察」标牌行退役；
 *   紫水晶球 🔮 左置并入 PaywallCard 主标题（🔮 解锁你们的灵魂密码）。
 * 刀三（宽度对齐）：付费卡容器 width 100%（退役 94%/maxWidth 380px 挤压）
 *   ＋宿主负边距抵消 .ai-insight 内边距 ⇒ 左右外沿与「重新测算」按钮齐平。
 * 刀四（付讫直出）：一次性姻缘深度报告暗金金属框（曜黑渐变＋钛金描边，
 *   与财富 SacredYearlyReportBox 同族）；金卡/灵宠认领/年鉴框外留存。
 * ══════════════════════════════════════════════════════════════════════
 */

/* ─── 定位付费墙分支（showPaywall || !sessionUnlocked ⇒ return 段） ─── */
const iPw = APP.indexOf('if (showPaywall || !sessionUnlocked) {');
const iNext = APP.indexOf('// Logged in — show button or result', iPw);
assert.ok(iPw > 0 && iNext > iPw, 'E133 前置：付费墙分支定位失败');
const PAYWALL_BRANCH = APP.slice(iPw, iNext);

/* ═══════════ E133-01 刀一：灵宠孵化前置（付费卡上方＋E48 锁链＋D5 白名单） ═══════════ */
test('E133-01 灵宠孵化前置：FamiliarPicker 先于 PaywallCard＋locked＋c1 门控＋拦截 Toast', () => {
  const iFam = PAYWALL_BRANCH.indexOf('<FamiliarPicker');
  const iPay = PAYWALL_BRANCH.indexOf('<PaywallCard');
  assert.ok(iFam !== -1, '付费墙分支缺 FamiliarPicker（刀一未落）');
  assert.ok(iPay !== -1, '付费墙分支缺 PaywallCard');
  assert.ok(iFam < iPay, `灵宠孵化须在付费卡正上方（iFam=${iFam}, iPay=${iPay}）`);

  // E48 门禁：未付费态恒上锁＋拦截回调
  const famBlock = PAYWALL_BRANCH.slice(iFam - 300, iFam + 600);
  assert.ok(famBlock.includes('locked={true}'), '姻缘灵宠选择器未付费态恒上锁（E48）');
  assert.ok(famBlock.includes('onLockedTap={handleFamiliarLockedTap}'), '拦截回调未接（Toast+滚动引导）');

  // E34 D5 白名单：须有真实出生城市（c1）才挂载
  assert.ok(PAYWALL_BRANCH.includes('{c1 && (') && PAYWALL_BRANCH.indexOf('{c1 && (') < iFam, 'c1 白名单门控缺失（禁伪造坐标）');

  // 出生真值透传（与报告尾 AdoptFamiliarCTA 同源 d1/t1/c1）
  assert.ok(famBlock.includes('birthDate={d1}'), '灵宠卡未传 d1');
  assert.ok(famBlock.includes('lat={c1.lat}') && famBlock.includes('lon={c1.lon}') && famBlock.includes('tz={c1.tz}'), '灵宠卡未传时空真值');

  // 拦截 Toast 状态机在位（5s 自动消隐）
  assert.ok(APP.includes('setFamiliarToast('), '拦截 Toast 状态机缺失');
  assert.ok(APP.includes("setTimeout(() => setFamiliarToast(null), 5000)"), 'Toast 5s 自动消隐缺失');

  // 单挂载防重：姻缘线 <FamiliarPicker 恰 1 处（防同屏双选择器）
  assert.equal((APP.match(/<FamiliarPicker/g) || []).length, 1, 'FamiliarPicker 姻缘单挂载');
});

/* ═══════════ E133-02 刀二：标牌肃清＋🔮 左置主标题 ═══════════ */
test('E133-02 标牌肃清：付费墙分支零「AI 深度洞察」孤立标牌；🔮 左置并入 PaywallCard 主标题', () => {
  // 付费墙分支内孤立标牌行退役（TXT.aiTitle 零残留——AuthWall/解锁态标头不在本刀射程）
  assert.ok(!PAYWALL_BRANCH.includes('TXT.aiTitle'), '付费卡上方「AI 深度洞察」孤立标牌残留（刀二违令）');
  // 旧 🔮 徽章 div（radial 紫徽）零残留
  assert.ok(!PAYWALL_BRANCH.includes('radial-gradient(circle at 38% 38%'), '旧 🔮 徽章容器残留');

  // 🔮 左置：PaywallCard 主标题一体化（🔮 {c.title}）
  assert.ok(PW.includes('}>🔮 {c.title}</div>'), '主标题未并入 🔮 前缀（🔮 解锁你们的灵魂密码）');

  // TXT.aiTitle 词条本身留存（AuthWall/解锁态仍用——只清付费墙分支的孤立标牌行）
  assert.ok(APP.includes("aiTitle: { zh:'AI 深度洞察'"), 'TXT.aiTitle 字典误删（解锁态标头连带误伤）');
});

/* ═══════════ E133-03 刀三：付费卡容器宽度与「重新测算」两端齐平 ═══════════ */
test('E133-03 宽度对齐：PaywallCard width 100%（94%/maxWidth 380 退役）＋宿主负边距满格', () => {
  // 付费卡自身：width 100%（旧 94%＋maxWidth 380px 挤压退役）
  assert.ok(PW.includes("width: '100%',"), 'PaywallCard 未满格（width 100% 缺失）');
  assert.ok(!PW.includes("maxWidth: '380px'"), 'maxWidth 380px 挤压残留违令');
  assert.ok(!PW.includes("width: '94%'"), '94% 宽度残留违令');

  // 宿主：负边距抵消 .ai-insight 内边距（margin 0 -18px）⇒ 左右外沿与 .btn 全宽按钮齐平
  const iRel = PAYWALL_BRANCH.indexOf("ref={compatPaywallRef}");
  assert.ok(iRel > 0, '付费墙滚动落点 ref 缺失');
  const wrapSeg = PAYWALL_BRANCH.slice(iRel, iRel + 260);
  assert.ok(wrapSeg.includes("margin: '0 -18px 20px'"), '付费卡容器负边距满格缺失（宽度未对齐重新测算）');

  // 灵宠容器同款负边距（左右外沿同一直线）
  assert.ok(PAYWALL_BRANCH.includes("margin: '0 -18px 16px'"), '灵宠孵化容器负边距缺失（与付费卡错位）');

  // .btn 全宽基线仍在（App.css 重新测算按钮 width 100%）
  const css = read('web/src/App.css');
  assert.ok(/\.btn \{[^}]*width: 100%/.test(css), '.btn 全宽基线漂移（对齐基准丢失）');
});

/* ═══════════ E133-04 刀四：付讫金属框＋履约闭环留存 ═══════════ */
test('E133-04 一次性姻缘深度报告金属框：曜黑渐变＋钛金描边；框外三模块顺序零变', () => {
  const iFrame = APP.indexOf('compat-once-metal-frame');
  assert.ok(iFrame > 0, '金属框挂载缺失（data-testid=compat-once-metal-frame）');
  const frameSeg = APP.slice(iFrame - 200, iFrame + 700);
  assert.ok(frameSeg.includes("linear-gradient(170deg, #0e1028 0%, #0a0c1e 40%, #0D0D1A 100%)"), '金属框曜黑渐变缺失（与财富质感不同族）');
  assert.ok(frameSeg.includes('border: \'2px solid rgba(212,175,55,0.45)\''), '金属框钛金描边缺失');

  // 框内＝洞察全文＋塔罗；框外＝金卡导出→灵宠认领→年鉴（E85 纯净结构顺序零变）
  const iTarot = APP.indexOf('ks-tarot-frame', iFrame);
  const iClose = APP.indexOf('end 💎 E133 刀四', iFrame);
  assert.ok(iTarot > iFrame && iClose > iTarot, '塔罗卡未在金属框内');
  const iGold = APP.indexOf('<GoldCardExporter', iFrame);
  const iAdopt = APP.indexOf('<AdoptFamiliarCTA', iFrame);
  const iAlm = APP.indexOf('L_ALMANAC_BTN[lang]', iFrame);
  assert.ok(iGold > iClose, '金卡导出须在金属框外');
  assert.ok(iAdopt > iGold, '灵宠认领须在金卡导出后（E85 顺序铁律）');
  assert.ok(iAlm > iAdopt, '年鉴须在灵宠认领后（E85 顺序铁律）');

  // 重新测算（back-btn）在页尾留存
  const pageSeg = APP.slice(APP.indexOf('function ResultPage'));
  assert.ok(pageSeg.includes("className=\"btn btn-secondary\""), '「重新测算」底部按钮缺失');
});

/* ═══════════ E133-05 拦截 Toast 六语自容对齐（铁律 15） ═══════════ */
test('E133-05 灵宠拦截 Toast 六语自容字典：逐语对齐＋金额口径（fr/es 逗号形态）', () => {
  const iDict = APP.indexOf('const L_FAMILIAR_LOCK_TOAST');
  assert.ok(iDict > 0, 'L_FAMILIAR_LOCK_TOAST 六语字典缺失');
  const dictSeg = APP.slice(iDict, APP.indexOf('};', iDict));
  for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    assert.ok(new RegExp(`${lang}:\\s*'`).test(dictSeg), `Toast 字典缺 ${lang} 语`);
  }
  // 金额逐语在位（点号/逗号合计计权——fr/es 欧洲逗号、fr 后置货币符）
  const money = (dictSeg.match(/\$4[.,]99|4[.,]99\s\$/g) || []).length;
  assert.ok(money >= 6, `六语 $4.99 金额未全覆盖（实得 ${money}）`);
  // 财富线 needUnlock 禁跨线复用（文案语境隔离）
  assert.ok(!APP.slice(iPw, iNext).includes('familiar.needUnlock'), '姻缘线误复用财富线 needUnlock 文案');
});

/* ═══════════ S 链位自保 ═══════════ */
test('E133-S 链位自保：e133 入编（e132 后、e40-compat 前；全链 100→101 段）', () => {
  const chain = PKG.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.ok(segs.length >= 101, `链段下界 101（实际 ${segs.length}）`);
  const iE133 = segs.findIndex((s) => s.includes('audit-e133-romance-paywall-parity'));
  const iE132 = segs.findIndex((s) => s.includes('audit-e132-paywall-dedupe-familiar-swap'));
  const iCompat = segs.findIndex((s) => s.includes('e40-compat'));
  assert.ok(iE132 >= 0 && iE133 === iE132 + 1, `e133 紧随 e132（iE132=${iE132}, iE133=${iE133}）`);
  assert.ok(iCompat === segs.length - 2, `e40-compat 恒 len-2（实际 iCompat=${iCompat}, len=${segs.length}）`);
  assert.ok(segs[segs.length - 1].includes('python3'), 'python 段须恒为链尾');
});
