/**
 * 💎 E59 商业阶梯漏斗门禁闸门（audit-e59-commercial-ladder）
 *
 * 主公雷霆军令（2026-10-16）原文要点：
 *   ① 【权益严格按 SKU 解耦 · 严禁一次付费全盘通放】
 *      wealth_once ($4.99) → 仅「先天财富基础长卷」＋「灵宠初次认领资格」
 *      wealth_monthly_report ($2.99) → 专属流月报告权益
 *      wealth_yearly_report ($29.99) → 专属年度报告 / 宇宙生日年鉴权益
 *      杜绝全免绿道：购买 $4.99 后**绝不允许**自动解锁月报和年报。
 *   ② 【阶梯付费墙落地（灵宠认领后承接区）】
 *      年鉴区块两枚按钮 ⇒ 各弹**本档专属**付费墙；支付完成前严禁展示对应长卷。
 *   ③ 【沙箱一键模拟闭环】两枚付费弹窗内各配「一键模拟支付 $2.99 / $29.99」。
 *   ④ 【重置联动】`💳 重置购买态`（/$ 或 ?reset=1）须一键清空 4.99 / 2.99 / 29.99。
 *
 * 病根（本闸门锁死的历史缺陷）：
 *   WealthReportPage.checkPaidStatus 内 `isWealthPaid` 曾**宽判任一财富档**即
 *   `setIsUnlocked(true)` ⇒ 买 $4.99 的人被连带放行 $2.99 月报 + $29.99 年报
 *   （阶梯收费形同虚设 = 直营收入窟窿）；反之单买 $2.99/$29.99 亦误开整页。
 *
 * 两路取证：
 *   A. **行为级**：抽取 server.js::wealthEntitledByType 与前端 wealthEntitledFor 真源码跑矩阵，
 *      前后端同源同档（改逻辑必转红，不是字面量 grep）。
 *   B. **结构级**：整页门收窄 / 内容二次闸门 / 升阶付费墙组件契约 / 沙箱按键 / 重置联动 / 段位。
 *   C. **注入自测**：定向破坏（把 once 门改回宽判 / 摘掉内容闸门 / 掏空沙箱按键）⇒ 判据必红。
 *
 * 运行：node --test test/audit-e59-commercial-ladder.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const SERVER_SRC = read('server.js');
const PAGE_SRC = read('web/src/pages/WealthReportPage.tsx');
const UPGRADE_SRC = read('web/src/components/WealthUpgradePaywall.tsx');
const CASHIER_SRC = read('web/src/components/SandboxCashier.tsx');
const MODULE_PATH = path.join(ROOT, 'web/src/lib/sandboxCheckout.mjs');
const MODULE_SRC = fs.readFileSync(MODULE_PATH, 'utf8');
const PKG = JSON.parse(read('package.json'));

/* ── 按花括号配平抽取源码片段（与 e24g 同法）── */
function sliceBalanced(src, startIdx, openCh = '{', closeCh = '}') {
  const start = src.indexOf(openCh, startIdx);
  if (start === -1) return null;
  let depth = 0, inStr = null;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === '\\') { i++; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === openCh) depth++;
    else if (ch === closeCh) { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

/* ── 真值抽取：后端财富分档纯函数 ── */
function extractServerEntitled(src) {
  const p = 'function wealthEntitledByType(plans, reportType, now)';
  const idx = src.indexOf(p);
  assert.ok(idx !== -1, 'server.js 缺少 wealthEntitledByType —— 单一真源被删/改名');
  const body = sliceBalanced(src, idx);
  assert.ok(body && body.length > 10, '抽不出 wealthEntitledByType 函数体');
  return new Function('plans', 'reportType', 'now', body.slice(body.indexOf('{') + 1, -1));
}

/* ── 真值抽取：前端分档纯函数 ── */
function extractFrontendEntitled(src) {
  const marker = 'export const wealthEntitledFor';
  const idx = src.indexOf(marker);
  assert.ok(idx !== -1, '前端缺少 wealthEntitledFor（按钮分档门控的单一真源）');
  const arrow = src.indexOf('=>', idx);
  const body = sliceBalanced(src, arrow);
  assert.ok(body && body.startsWith('{'), '抽不出 wealthEntitledFor 函数体');
  return new Function('type', 'paidPlans', 'freeAccess', body.slice(1, -1));
}

const srvEntitled = extractServerEntitled(SERVER_SRC);
const feEntitled = extractFrontendEntitled(PAGE_SRC);

/* ── 判据（主测与注入自测**同源**取用）── */

/** 【军令①核心】整页门只认 $4.99 先天档 —— 购买月报/年报**绝不**连带解锁整页 */
const pageGateIsOnceOnly = (src) => src.includes("wealthEntitledFor('once', rawPlans")
  && !/planMap\.wealth_(monthly|yearly)_report/.test(src)
  && !/planMap\.star_monthly_vip/.test(src);

/** 【军令②核心】月报/年报长卷的**二次内容闸门**（支付完成前严禁展示）
 *  ⚠️ 权益闸门**后置**于 loading 子句 —— 前置会破坏 e24f 的画布主权门控锚点（C1/C2）。 */
const contentIsEntitlementGated = (src) => src.includes("(reportLoading === 'wealth_monthly' || monthlyCardsReady) && _entMonthly")
  && src.includes("(reportLoading === 'wealth_yearly' || yearlyCardsReady) && _entYearly")
  && src.includes("wealthEntitledFor('monthly', paidPlans")
  && src.includes("wealthEntitledFor('yearly', paidPlans");

/** 【军令③核心】沙箱一键模拟闭环 —— 升阶弹窗须走纯核构造/判真值/带 SKU 金额 */
const sandboxClosureWired = (src) => src.includes('buildSandboxCompleteRequest(')
  && src.includes('describeSandboxOutcome(')
  && src.includes('sandboxPlanPrice(upgradePlan)')
  && src.includes('onSandboxPay={runUpgradeSandboxPay}');

/* ── 段位 ── */
const segs = String(PKG.scripts['test:astro']).split('&&').map((x) => x.trim()).filter(Boolean);
const iCap = segs.findIndex((s) => s.includes('e40-compat'));
const iE59 = segs.findIndex((s) => s.includes('audit-e59-commercial-ladder'));

/* ═══════════ A 行为级：前后端分档矩阵**同源同档** ═══════════ */

test('A1 【军令①铁证】买 $4.99 只开 once，**月报/年报一律不放行**（前后端双侧）', () => {
  const NOW = new Date('2026-10-16T02:00:00Z');
  const plans = { wealth_once: true };
  assert.equal(!!srvEntitled(plans, 'once', NOW), true, '后端：$4.99 应放行 once');
  assert.equal(!!srvEntitled(plans, 'monthly', NOW), false, '后端：$4.99 绝不放行 $2.99 月报（阶梯被穿透）');
  assert.equal(!!srvEntitled(plans, 'yearly', NOW), false, '后端：$4.99 绝不放行 $29.99 年报（阶梯被穿透）');
  assert.equal(feEntitled('once', plans, false), true, '前端：$4.99 应放行 once');
  assert.equal(feEntitled('monthly', plans, false), false, '前端：$4.99 绝不放行 $2.99 月报');
  assert.equal(feEntitled('yearly', plans, false), false, '前端：$4.99 绝不放行 $29.99 年报');
});

test('A2 单买月报/年报**不得**反向解锁 once（SKU 严格解耦）', () => {
  const NOW = new Date('2026-10-16T02:00:00Z');
  for (const plans of [{ wealth_monthly_report: true }, { wealth_yearly_report: true }]) {
    assert.equal(!!srvEntitled(plans, 'once', NOW), false, `后端 once 被 ${JSON.stringify(plans)} 越权解锁`);
    assert.equal(feEntitled('once', plans, false), false, `前端 once 被 ${JSON.stringify(plans)} 越权解锁`);
  }
  // 月报档不得白拿年报（反之亦然）—— $2.99 不得当 $29.99 使
  assert.equal(!!srvEntitled({ wealth_monthly_report: true }, 'yearly', NOW), false, '后端：$2.99 不得白拿 $29.99');
  assert.equal(feEntitled('yearly', { wealth_monthly_report: true }, false), false, '前端：$2.99 不得白拿 $29.99');
  assert.equal(!!srvEntitled({ wealth_yearly_report: true }, 'monthly', NOW), false, '后端：$29.99 不得白拿 $2.99');
  assert.equal(feEntitled('monthly', { wealth_yearly_report: true }, false), false, '前端：$29.99 不得白拿 $2.99');
});

test('A3 月卡配额**不覆盖** once；全通年卡三档全开；前后端逐档同源', () => {
  const NOW = new Date('2026-10-16T02:00:00Z');
  const FUTURE = new Date(NOW.getTime() + 30 * 86400000).toISOString();
  const PAST = new Date(NOW.getTime() - 30 * 86400000).toISOString();
  const matrix = [
    [{}, false, false, false],
    [{ wealth_once: true }, true, false, false],
    [{ wealth_monthly_report: true }, false, true, false],
    [{ wealth_yearly_report: true }, false, false, true],
    [{ all_pass_yearly: true, all_pass_expires_at: FUTURE }, true, true, true],
    [{ all_pass_yearly: true, all_pass_expires_at: PAST }, false, false, false],
    [{ star_monthly_vip: true, star_monthly_wealth_used: 0, star_monthly_wealth_allowance: 5 }, false, true, true],
    [{ star_monthly_vip: true, star_monthly_wealth_used: 5, star_monthly_wealth_allowance: 5 }, false, false, false],
  ];
  for (const [plans, once, monthly, yearly] of matrix) {
    const label = JSON.stringify(plans);
    assert.equal(!!srvEntitled(plans, 'once', NOW), once, `后端 once @ ${label}`);
    assert.equal(!!srvEntitled(plans, 'monthly', NOW), monthly, `后端 monthly @ ${label}`);
    assert.equal(!!srvEntitled(plans, 'yearly', NOW), yearly, `后端 yearly @ ${label}`);
    assert.equal(feEntitled('once', plans, false), once, `前端 once @ ${label}`);
    assert.equal(feEntitled('monthly', plans, false), monthly, `前端 monthly @ ${label}`);
    assert.equal(feEntitled('yearly', plans, false), yearly, `前端 yearly @ ${label}`);
  }
  // 绿道（free_access=1）仍是特权通道：三档全放行
  assert.equal(feEntitled('once', {}, true), true);
  assert.equal(feEntitled('monthly', {}, true), true);
  assert.equal(feEntitled('yearly', {}, true), true);
});

/* ═══════════ B 结构级：整页门收窄 · 内容闸门 · 升阶弹窗 · 沙箱 · 重置 ═══════════ */

test('B1 【军令①】整页门收窄为 once 档，宽判真凶（planMap 宽谓词）彻底清除', () => {
  assert.ok(pageGateIsOnceOnly(PAGE_SRC), '整页门未收窄为 wealthEntitledFor(\'once\')，或宽判残留');
  assert.ok(/const isWealthPaid = wealthEntitledFor\('once', rawPlans/.test(PAGE_SRC),
    'isWealthPaid 必须直取同源纯函数（禁手写档位判定）');
  // 三个历史宽判分支不得回流
  for (const bad of ["if (planMap.wealth_yearly_report === true) return true;",
    "if (planMap.wealth_monthly_report === true) return true;",
    'planMap.star_monthly_vip']) {
    assert.ok(!PAGE_SRC.includes(bad), `宽判残留 ⇒ 阶梯收费被穿透：${bad}`);
  }
});

test('B2 【军令②】月报/年报长卷渲染处**二次独立闸门**（支付完成前严禁展示）', () => {
  assert.ok(contentIsEntitlementGated(PAGE_SRC), '长卷渲染未挂 _entMonthly/_entYearly 二次闸门');
  assert.ok(/const _entMonthly = _upgradeEnt\('monthly'\)/.test(PAGE_SRC), '缺 _entMonthly 二次闸门');
  assert.ok(/const _entYearly = _upgradeEnt\('yearly'\)/.test(PAGE_SRC), '缺 _entYearly 二次闸门');
  assert.ok(/const _upgradeEnt = \(type: 'once' \| 'monthly' \| 'yearly'\) => wealthEntitledFor\(type, paidPlans, _renderGreen\)/.test(PAGE_SRC),
    '二次闸门未走同源纯函数 wealthEntitledFor（禁另起炉灶）');
  // 🔴 锚点守恒：`wealthEntitledFor('yearly', paidPlans` 全文件**唯一**
  //   —— 仓内 e24g 闸门 C5 的注入自测（String.replace 只换首处）以此为前提，
  //     多写一处会让该注入自测静默失效（判据看似全绿、实则零防线）。
  assert.equal((PAGE_SRC.match(/wealthEntitledFor\('yearly', paidPlans/g) || []).length, 1,
    "wealthEntitledFor('yearly', paidPlans 出现多次 ⇒ e24g C5 注入自测锚点失效");
  assert.equal((PAGE_SRC.match(/wealthEntitledFor\('monthly', paidPlans/g) || []).length, 1,
    "wealthEntitledFor('monthly', paidPlans 出现多次 ⇒ e24g B4d 语义被稀释");
});

test('B3 【军令②】年鉴两枚按钮 ⇒ 各弹**本档专属**升阶付费墙（禁直调 handlePurchase）', () => {
  assert.ok(PAGE_SRC.includes("openUpgradePaywall('wealth_monthly_report')"), '$2.99 按钮未开升阶付费墙');
  assert.ok(PAGE_SRC.includes("openUpgradePaywall('wealth_yearly_report')"), '$29.99 按钮未开升阶付费墙');
  assert.ok(PAGE_SRC.includes('data-testid="wealth-upgrade-open-monthly"'), '缺月报升阶入口 testid');
  assert.ok(PAGE_SRC.includes('data-testid="wealth-upgrade-open-yearly"'), '缺年报升阶入口 testid');
  assert.ok(!PAGE_SRC.includes("onClick={() => handlePurchase('wealth_monthly_report')}"),
    '月报按钮仍直调 handlePurchase（绕过专属付费墙）');
  assert.ok(!PAGE_SRC.includes("onClick={() => handlePurchase('wealth_yearly_report')}"),
    '年报按钮仍直调 handlePurchase（绕过专属付费墙）');
  // 弹窗必须真挂载，且把 plan / 沙箱态 / 金额 / 两个回调全数接线
  assert.ok(PAGE_SRC.includes('<WealthUpgradePaywall'), '升阶付费墙组件未挂载');
  for (const wire of ['plan={upgradePlan}', 'sandboxMode={sandboxMode}', 'busy={upgradeBusy}',
    'onPurchase={handleUpgradeLivePurchase}', 'onSandboxPay={runUpgradeSandboxPay}',
    'onClose={() => setUpgradePlan(null)}']) {
    assert.ok(PAGE_SRC.includes(wire), `升阶付费墙接线缺失：${wire}`);
  }
});

test('B4 升阶付费墙组件契约：单一 CTA 双模 + 四种 testid 常量真值 + 只收意图', () => {
  for (const c of ['UPGRADE_PAYWALL_TESTID', 'UPGRADE_LIVE_BTN_TESTID',
    'UPGRADE_SANDBOX_BTN_TESTID', 'UPGRADE_CLOSE_BTN_TESTID']) {
    assert.ok(new RegExp(`export const ${c} = '[^']+';`).test(UPGRADE_SRC), `缺常量 ${c}`);
  }
  // 弹窗容器 / 关闭键：常量直挂
  for (const c of ['UPGRADE_PAYWALL_TESTID', 'UPGRADE_CLOSE_BTN_TESTID']) {
    assert.ok(new RegExp(`data-testid=\\{${c}\\}`).test(UPGRADE_SRC), `组件未挂 testid 常量 ${c}`);
  }
  // 主 CTA：同一按钮按沙箱态切换两种 testid（**禁**渲染两枚按钮 ⇒ 沙箱里不得有第二个外跳入口）
  assert.ok(/data-testid=\{sandboxMode \? UPGRADE_SANDBOX_BTN_TESTID : UPGRADE_LIVE_BTN_TESTID\}/.test(UPGRADE_SRC),
    '主 CTA 未按沙箱态切换 testid（单按钮双模契约被破）');
  assert.equal((UPGRADE_SRC.match(/<button/g) || []).length, 2, '弹窗内按钮须恰为 2 枚（主 CTA + 关闭）');
  assert.ok(UPGRADE_SRC.includes('sandboxMode ? UPGRADE_SANDBOX_BTN_TESTID : UPGRADE_LIVE_BTN_TESTID'),
    '主 CTA 未按沙箱态切换（单按钮双模契约被破）');
  assert.ok(UPGRADE_SRC.includes('if (sandboxMode) onSandboxPay(plan);'), '沙箱态未走 onSandboxPay');
  assert.ok(UPGRADE_SRC.includes('else onPurchase(plan);'), '实时态未走 onPurchase');
  assert.ok(UPGRADE_SRC.includes("t('wealthReport.upgradeTitle')"), '缺升阶标题取词');
  assert.ok(UPGRADE_SRC.includes("t('wealthReport.upgradeCta')"), '缺实时 CTA 取词');
  assert.ok(UPGRADE_SRC.includes("'wealthReport.upgradeMonthlyDesc'") && UPGRADE_SRC.includes("'wealthReport.upgradeYearlyDesc'"),
    '缺两档权益说明取词');
  assert.ok(UPGRADE_SRC.includes("'wealthReport.sandboxPayMonthly'") && UPGRADE_SRC.includes("'wealthReport.sandboxPayYearly'"),
    '缺沙箱两档模拟支付按键取词（军令③）');
  // 纯展示组件铁律：零网络 / 零存储 / 零权益判定（⚠️ 禁词扫描须先剥注释 —— 说明文字里必然提到这些词）
  const codeOnly = UPGRADE_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  for (const ban of ['fetch(', 'localStorage', 'sessionStorage', 'supabase', 'wealthEntitledFor']) {
    assert.ok(!codeOnly.includes(ban), `升阶付费墙组件混入副作用/判定：${ban}（应只回传意图）`);
  }
  // 零硬编码自然语言（剥注释后不得出现汉字）
  assert.ok(!/[\u4e00-\u9fff]/.test(codeOnly), '升阶付费墙组件内出现硬编码中文（非中文用户会看到中文）');
});

test('B5 【军令③】沙箱一键模拟闭环：纯核构造 + 真值判定 + SKU 金额 + 不臆造开通', async () => {
  assert.ok(sandboxClosureWired(PAGE_SRC), '升阶沙箱闭环接线不全（构造/判定/金额/回调）');
  assert.ok(PAGE_SRC.includes('if (out.granted)'), '未按 describeSandboxOutcome 的 granted 真值分流');
  assert.ok(PAGE_SRC.includes("out.reason || ''"), '未如实回显拒因（会静默失败）');
  // 金额映射行为级真值（与 server.js::STRIPE_PRICE_MAP 同集）
  const M = await import(new URL('../web/src/lib/sandboxCheckout.mjs', import.meta.url).href);
  assert.equal(M.sandboxPlanPrice('wealth_once'), '$4.99');
  assert.equal(M.sandboxPlanPrice('wealth_monthly_report'), '$2.99');
  assert.equal(M.sandboxPlanPrice('wealth_yearly_report'), '$29.99');
  assert.equal(M.sandboxPlanPrice('all_pass_yearly'), '$99.99');
  assert.equal(M.sandboxPlanPrice('unknown_sku_xyz'), '', '未知 SKU 必须返回空串（绝不臆造价格）');
  assert.equal(M.sandboxPlanPrice(null), '');
  assert.ok(Object.isFrozen(M.SANDBOX_PLAN_PRICE), '金额表必须冻结（防运行期改写）');
  // 月报/年报须有**专属**标签词条（否则收银台把 $2.99 显示成「会员权益」）
  assert.equal(M.planTerm(JSON.parse(read('astro/astro_terms_dict.json')), 'wealth_monthly_report', 'zh').key, 'SandboxPlanMonthly');
  assert.equal(M.planTerm(JSON.parse(read('astro/astro_terms_dict.json')), 'wealth_yearly_report', 'zh').key, 'SandboxPlanYearly');
  // 收银台按钮带 SKU 标价（$4.99 基础档验收亦需可辨）
  assert.ok(CASHIER_SRC.includes('sandboxPlanPrice(req.plan)'), '沙箱收银台支付按钮未带 SKU 金额');
});

test('B6 【军令④】重置联动：?reset=1 触发端点，且端点一键清空 4.99/2.99/29.99 三项权益', () => {
  assert.ok(PAGE_SRC.includes("'/api/sandbox/reset-purchase'"), '前端未接入沙箱购买态重置端点');
  const idx = SERVER_SRC.indexOf("app.post('/api/sandbox/reset-purchase'");
  assert.ok(idx !== -1, '后端缺 /api/sandbox/reset-purchase 端点');
  const seg = SERVER_SRC.slice(idx, idx + 1400);
  for (const sku of ["'wealth_once'", "'wealth_monthly_report'", "'wealth_yearly_report'"]) {
    assert.ok(seg.includes(sku), `重置端点未清空 ${sku}（主公无法从 4.99 重测到 29.99）`);
  }
  assert.ok(seg.includes('isSandboxPaymentMode(process.env)'), '重置端点缺沙箱闸门（fail-closed）');
});

test('B7 i18n：升阶付费墙六键在 6 语种全部就位', () => {
  const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];
  const keys = ['upgradeTitle', 'upgradeMonthlyDesc', 'upgradeYearlyDesc', 'upgradeCta',
    'sandboxPayMonthly', 'sandboxPayYearly'];
  for (const l of LANGS) {
    const j = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    for (const k of keys) {
      const v = j.wealthReport && j.wealthReport[k];
      assert.equal(typeof v, 'string', `${l}.json 缺 wealthReport.${k}`);
      assert.ok(v.trim().length > 0, `${l}.json wealthReport.${k} 为空串`);
    }
    assert.ok(j.wealthReport.sandboxPayMonthly.includes('$2.99'), `${l} 沙箱月报按键未带 $2.99`);
    assert.ok(j.wealthReport.sandboxPayYearly.includes('$29.99'), `${l} 沙箱年报按键未带 $29.99`);
  }
});

/* ═══════════ C 段位守备 ═══════════ */

test('C1 段位：Gate E59 已入编且居收口位之前（下界 ≥53，iCap === len-2）', () => {
  assert.ok(segs.length >= 53, `段数 ${segs.length} < 53（E59 未入编）`);
  assert.ok(iCap !== -1, '收口位 e40-compat 缺失');
  assert.equal(iCap, segs.length - 2, '收口位必须紧邻链尾 python');
  assert.ok(iE59 !== -1, 'Gate E59 未入编 test:astro');
  assert.ok(iE59 < iCap, 'Gate E59 必须插在收口位之前');
  assert.ok(segs[segs.length - 1].includes('python'), '链尾必须是 python 段');
  const iG45B = segs.findIndex((s) => s.includes('audit-e41plus-gate45b-sandbox-cashier.test.mjs'));
  assert.ok(iG45B !== -1 && iG45B < iE59, 'Gate E59 应接在 45-B 之后（前端收银台先行）');
});

/* ═══════════ D 注入反漂移（判据对篡改必红）═══════════ */

test('D1 注入：整页门改回「任一财富档」宽判 ⇒ B1 判据必红（阶梯穿透）', () => {
  const bad = PAGE_SRC.replace(
    "const isWealthPaid = wealthEntitledFor('once', rawPlans, _upgradeGreen);",
    "const isWealthPaid = (() => { if (planMap.wealth_monthly_report === true) return true; if (planMap.wealth_yearly_report === true) return true; return false; })();",
  );
  assert.notEqual(bad, PAGE_SRC, 'D1 注入锚点漂移');
  assert.equal(pageGateIsOnceOnly(bad), false, 'B1 判据必须能识破宽判回流');
});

test('D2 注入：摘掉月报长卷的 _entMonthly 二次闸门 ⇒ B2 判据必红', () => {
  const bad = PAGE_SRC.replace("(reportLoading === 'wealth_monthly' || monthlyCardsReady) && _entMonthly &&", "(reportLoading === 'wealth_monthly' || monthlyCardsReady) &&");
  assert.notEqual(bad, PAGE_SRC, 'D2 注入锚点漂移');
  assert.equal(contentIsEntitlementGated(bad), false, 'B2 判据必须能识破内容闸门被摘');
});

test('D3 注入：沙箱闭环断链（不判 granted 真值）⇒ B5 判据必红', () => {
  const bad = PAGE_SRC.replace('describeSandboxOutcome(', '((x) => ({ granted: true }))(');
  assert.notEqual(bad, PAGE_SRC, 'D3 注入锚点漂移');
  assert.equal(sandboxClosureWired(bad), false, 'B5 判据必须能识破「自造已开通」');
});

test('D4 注入：模块金额表被改写（未知 SKU 臆造价格）⇒ B5 行为判据必红', async () => {
  const mutated = MODULE_SRC.replace(
    "  return Object.prototype.hasOwnProperty.call(SANDBOX_PLAN_PRICE, k) ? SANDBOX_PLAN_PRICE[k] : '';",
    "  return SANDBOX_PLAN_PRICE[k] || '$9.99';",
  );
  assert.notEqual(mutated, MODULE_SRC, 'D4 注入锚点漂移');
  const p = path.join(fs.mkdtempSync(path.join((await import('node:os')).tmpdir(), 'ks-e59-')), 'mod.mjs');
  fs.writeFileSync(p, mutated, 'utf8');
  const mm = await import(new URL(`file://${p}`).href);
  // 射程自证：真源对未知 SKU 必须返回空串
  const M = await import(new URL('../web/src/lib/sandboxCheckout.mjs', import.meta.url).href);
  assert.equal(M.sandboxPlanPrice('unknown_sku_xyz'), '', '真源对未知 SKU 必须返回空串（射程自证）');
  assert.equal(mm.sandboxPlanPrice('unknown_sku_xyz'), '$9.99', 'B5 判据必须能识破「未知 SKU 被臆造价格」');
});

test('D5 射程自证：主测与注入同源取用，禁射程断层', () => {
  assert.ok(pageGateIsOnceOnly(PAGE_SRC), 'B1 判据射程失效');
  assert.ok(contentIsEntitlementGated(PAGE_SRC), 'B2 判据射程失效');
  assert.ok(sandboxClosureWired(PAGE_SRC), 'B5 判据射程失效');
});

test('E72 【移动端支付阻塞根治】OAuth 禁弹窗全量重定向（Login-then-Checkout）', () => {
  const page = read('web/src/pages/WealthReportPage.tsx');
  // ① 弹窗式 OAuth 已根除：脚本开窗与「允许弹窗」死路告警一个不留（含注释字面量一并清理）
  assert.ok(!/window\.open\s*\(/.test(page), 'E72 WealthReportPage 仍残留脚本开窗（移动端必被拦）');
  assert.ok(!/允许浏览器弹窗/.test(page), 'E72 弹窗告警死路文案未拔除');
  assert.ok(!/popup\.close\(\)/.test(page), 'E72 弹窗引用残留');
  // ② 重定向模式在位：SDK 整页跳 Google（缺省 skipBrowserRedirect=false 即导航），意图先落库
  assert.ok(page.includes('E72 整页重定向 OAuth'), 'E72 缺重定向实现标记');
  assert.ok(page.includes("redirectTo: window.location.origin + '/auth/callback'"), 'E72 缺回调 redirectTo');
  assert.ok(/ks_pending_checkout_plan/.test(page) && /ks_oauth_back_url/.test(page), 'E72 登录意图未先落 localStorage');
  // ③ 回调页双模收口：顶层页签（重定向模式）跳回现场＋intent=checkout 自动续跑收银台
  const cb = read('web/public/auth/callback.html');
  assert.ok(cb.includes('E72') && cb.includes('window.close()'), 'E72 回调页缺双模收口');
  assert.ok(cb.includes("ks_oauth_back_url") && cb.includes("intent=checkout&plan="), 'E72 回调页缺回跳现场续跑');
  assert.ok(cb.includes('window.location.replace'), 'E72 回调页须 replace 跳回（防回退死循环）');
});

test('E73 【登录方式选择门】未登录购买绝不静默失败（Google 12s 超时兜底＋邮箱验证码页内通道）', () => {
  const gate = read('web/src/components/WealthLoginGate.tsx');
  // ① 邮箱验证码通道在位：signInWithOtp → verifyOtp 全程留在页内（国内可用，不依赖 Google）
  assert.ok(gate.includes('signInWithOtp'), 'E73 缺 signInWithOtp 发码');
  assert.ok(gate.includes("verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })"), 'E73 缺 verifyOtp 换 session');
  assert.ok(gate.includes('shouldCreateUser: true'), 'E73 OTP 未允许新用户注册');
  assert.ok(gate.includes('onEmailVerified(s.access_token)'), 'E73 验证通过未回传 token 续跑收银台');
  // ② 绝不静默失败：双通道全部 12s 超时兜底 + 显式错误呈现
  assert.ok(gate.includes('_gateTimeout'), 'E73 缺超时包装器');
  assert.ok((gate.match(/12000/g) || []).length >= 2, 'E73 发码/验证须各带 12s 超时');
  assert.ok(gate.includes("googleErr === 'timeout' ? t.timeout : googleErr"), 'E73 Google 超时提示未接门内六语文案');
  assert.ok(gate.includes("noSession"), 'E73 缺无 session 兜底文案');
  // ③ 六语文案齐备（zh/en/es/fr/th/vi 各含关键键）
  for (const k of ['title', 'google', 'email', 'send', 'codePh', 'verify', 'timeout']) {
    assert.ok((gate.match(new RegExp(`^ {4}${k}:`, 'gm')) || []).length === 6, `E73 i18n 键 ${k} 须六语齐备`);
  }
  // ④ 页面接线：未登录购买 ⇒ 弹门而非直接跳 Google；E72 重定向链路保留且带 12s race
  const page = read('web/src/pages/WealthReportPage.tsx');
  assert.ok(page.includes('setLoginGatePlan(plan)'), 'E73 未登录购买未接入登录门');
  assert.ok(page.includes('startGoogleRedirect'), 'E73 缺 Google 重定向启动器');
  assert.ok(page.includes("Promise.race([oauth, new Promise<'timeout'>"), 'E73 Google 通道缺 12s race 超时');
  assert.ok(page.includes('<WealthLoginGate'), 'E73 登录门未渲染');
  assert.ok(page.includes('E72 整页重定向 OAuth'), 'E73 拆分后 E72 标记丢失');
  assert.ok(page.includes("redirectTo: window.location.origin + '/auth/callback'"), 'E73 拆分后 E72 redirectTo 丢失');
  assert.ok(!/window\.open\s*\(/.test(page), 'E73 禁止回潮弹窗式 OAuth');
});

test('E74 【手机报告排版对齐】正文两端对齐＋左右内边距对称（滑轨维持 V257 原生 PC-only）', () => {
  const box = read('web/src/components/SacredYearlyReportBox.tsx');
  // ① 正文行两端对齐：左对齐中文换行右端参差 ⇒ 主公实测「右侧不均、左侧均」
  assert.ok(/data-line-type="text"[\s\S]{0,500}textAlign:\s*'justify'/.test(box), 'E74 正文行缺 textAlign:justify');
  // ② 内边距对称：框padding20 − marginRight外扩8 + paddingRight8 ⇒ 手机左右各 20px
  assert.ok(/paddingRight:\s*'8px'/.test(box), 'E74 容器 paddingRight 应为 8px（10px 时右距 22≠左 20）');
  // ③ 滑轨维持 V257 原生方案（PC 渲染、iOS overlay 不渲染＝主公接受形态），禁自绘回潮
  assert.ok(/\.dark-scrollbar::-webkit-scrollbar \{ width: 5px/.test(box), 'E74 V257 原生滑轨被改动');
  assert.ok(!/thumbRef|updateThumb/.test(box), 'E74 禁自绘滑轨逻辑残留');
  assert.ok(!/display:\s*none.*webkit-scrollbar|scrollbar-width:\s*none/.test(box), 'E74 禁隐藏原生滑轨');
  // ④ 年鉴双按钮 flex 排版（PC 并排 / 窄屏堆叠，同一规则）
  const page = read('web/src/pages/WealthReportPage.tsx');
  assert.ok(/display:\s*'flex',\s*flexWrap:\s*'wrap',\s*gap:\s*'8px',\s*justifyContent:\s*'center'/.test(page), 'E74 年鉴双按钮缺 flex 容器');
});
