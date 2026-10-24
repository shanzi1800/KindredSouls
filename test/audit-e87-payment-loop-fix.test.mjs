// ═══════════════════════════════════════════════════════════════════════
// E87（主公军令 2026-10-25）：五处线上实测缺陷根治 —— 闸门
// ═══════════════════════════════════════════════════════════════════════
// 看守对象（军令五条铁律）：
//   ① 塔罗解读文字亮度统一：暗淡透明度样式彻底退役，绑定与姻缘正文完全一致的
//      文本亮度令牌（--ks-text-secondary 单源）。
//   ② 姻缘月报（$2.99）支付链路：严禁未付直调生成接口——账号级权益旁路退役，
//      点击一律先呼沙盒收银台，付讫回调成功后才触发月报流式生成（年报同令）。
//   ③ 年报（$29.99）支付后黑屏根治：沙盒付讫回场（无 URL payment=success）纳入
//      冷启动恢复信号；ks_paid_report_type 分诊到对应报告自动生成链。
//   ④ 认领灵宠串台纠偏：彻底根除 /wealth/report 跳转劫持——App 通用 backUrl
//      盲跳退役＋认领清理劫持源＋callback 纯登录回 '/'。
//   ⑤ 首页健壮性：陈年 ks_oauth_back_url 劫持源纯冷启动即清（JSON.parse 全仓
//      已有 try-catch 守卫，闸门看守劫持根因）。
// 链位军规：e86 < e87 < e40-compat(len-2) < python(链尾)。
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');

/* ─── ① 塔罗解读文字亮度统一（令牌单源） ─── */

test('E87-①-1 塔罗解读行暗淡透明度退役＋令牌类挂载', () => {
  const app = read('web/src/App.tsx');
  // 退役：行内 opacity:0.85 压暗样式禁回流
  assert.ok(!app.includes('opacity: 0.85, fontSize'), '塔罗解读行内压暗样式残留违令');
  // 挂载：.ks-tarot-line 类（与正文同亮度令牌）
  assert.ok(app.includes('className="ks-tarot-line"'), '塔罗解读行未挂令牌类');
});

test('E87-①-2 .ks-tarot-line 令牌铸成（与姻缘正文同源亮度）', () => {
  const css = read('web/src/App.css');
  const m = css.match(/\.ks-tarot-line\s*\{[^}]*\}/);
  assert.ok(m, '.ks-tarot-line 规则缺失');
  // 🔴 E88-③（主公军令 2026-10-26）语义演进：亮度令牌升级为主文令牌
  //   --ks-text-primary（≈15.9:1，与一次性报告正文完全同源）＋ opacity:1 强制
  //   ＋ line-height 1.7（旧 --ks-text-secondary 次文令牌退役）。
  assert.ok(m[0].includes('var(--ks-text-primary, rgba(245, 245, 247, 0.95))'), '塔罗解读行未绑定主文亮度令牌（E88-③）');
  assert.ok(m[0].includes('opacity: 1 !important'), '塔罗解读行 opacity 强制缺失（压暗残留违令）');
  assert.ok(/line-height:\s*1\.7/.test(m[0]), '塔罗解读行行距未按 E88-③ 军令对齐（1.7）');
  assert.ok(/font-size:\s*13px/.test(m[0]), '塔罗解读行字号未对齐正文（13px）');
});

/* ─── ② 月报/年报未付严禁直调生成接口（购买先行） ─── */

test('E87-②-1 年鉴按钮账号权益旁路退役（点击恒走购买链）', () => {
  const app = read('web/src/App.tsx');
  const iAlm = app.indexOf('🎂 {lang');
  const iSignOut = app.indexOf('{TXT.signOut[lang] || TXT.signOut.en}', iAlm);
  assert.ok(iAlm > 0 && iSignOut > iAlm, '年鉴渲染区定位失败');
  const seg = app.slice(iAlm, iSignOut);
  // 旁路退役：账号级权益判定（owned/paidPlansLocal 读取）禁回流
  assert.ok(!seg.includes('paidPlansLocal.'), '年鉴按钮账号权益旁路残留违令');
  assert.ok(!/\bowned\b/.test(seg), '年鉴按钮 owned 旁路残留违令');
  // 点击恒走购买链（两按钮各自映射正确 plan）
  assert.ok(seg.includes("handlePurchase('compatibility_monthly_report')"), '月报按钮未走购买链');
  assert.ok(seg.includes("handlePurchase('compatibility_yearly_report')"), '年报按钮未走购买链');
});

test('E87-②-2 年鉴渲染区禁直调生成接口（沙盒先行铁律）', () => {
  const app = read('web/src/App.tsx');
  const iAlm = app.indexOf('🎂 {lang');
  const iSignOut = app.indexOf('{TXT.signOut[lang] || TXT.signOut.en}', iAlm);
  const seg = app.slice(iAlm, iSignOut);
  // 渲染区内严禁出现生成直调（军令：未付前严禁调生成接口）
  assert.ok(!seg.includes("generateReport('monthly')"), '月报渲染区直调生成接口违令');
  assert.ok(!seg.includes("generateReport('yearly')"), '年报渲染区直调生成接口违令');
});

/* ─── ③ 年报支付后黑屏根治＋付讫报告自动生成链 ─── */

test('E87-③-1 沙盒付讫回场落报告路由标记（onGranted 分诊源）', () => {
  const app = read('web/src/App.tsx');
  const iHpt = app.indexOf('const handlePurchaseWithToken = async');
  const seg = app.slice(iHpt, iHpt + 2600);
  assert.ok(iHpt > 0, 'handlePurchaseWithToken 定位失败');
  // onGranted 沙盒授予：月报/年报 ⇒ ks_paid_report_type 路由标记
  assert.ok(seg.includes("sessionStorage.setItem('ks_paid_report_type', 'monthly')"), 'onGranted 未落月报路由标记');
  assert.ok(seg.includes("sessionStorage.setItem('ks_paid_report_type', 'yearly')"), 'onGranted 未落年报路由标记');
});

test('E87-③-2 paid 分支月报/年报同享会话解锁＋自动生成承接', () => {
  const app = read('web/src/App.tsx');
  const iPaid = app.indexOf("} else if (route.kind === 'paid') {");
  assert.ok(iPaid > 0, 'paid 分支缺失');
  const seg = app.slice(iPaid, iPaid + 2600);
  // 🔴 E88-①（主公军令 2026-10-26）语义演进：paid 分支月报/年报 ⇒ **无条件弹沙盒
  //    收银台**（openSandboxCashier 就地唤起，用户确认付款才走 onGranted 生成链）；
  //    once 沿用 E86 当次会话解锁。三档不得静默吞噬。
  assert.ok(seg.includes("plan === 'compatibility_monthly_report'"), 'paid 分支未认月报（静默吞噬违令）');
  assert.ok(seg.includes("plan === 'compatibility_yearly_report'"), 'paid 分支未认年报（静默吞噬违令）');
  assert.ok(seg.includes('openSandboxCashier({'), 'paid 分支未就地弹沙盒收银台（E88-① 军令）');
  // 沙盒确认后承接：onGranted 落支付成功信号＋报告路由标记＋reload
  assert.ok(seg.includes("sessionStorage.setItem('ks_payment_success', '1')"), 'paid 分支未落支付成功信号');
  assert.ok(seg.includes("sessionStorage.setItem('ks_paid_report_type', 'monthly')"), 'paid 分支 onGranted 未落月报路由标记');
  assert.ok(seg.includes('window.location.reload()'), 'paid 分支未刷新承接');
  // E86 once 语义保持（else 支路）
  assert.ok(seg.includes("plan === 'compatibility_once'"), 'paid 分支 once 语义丢失');
  // 静默分支退役：paid 分支内不得再有无动作 console.log 收口
  assert.ok(!seg.includes('Already covered by existing plan, skipping checkout'), 'paid 分支静默吞噬残留违令');
});

test('E87-③-3 冷启动黑屏根治：沙盒付讫会话信号纳入恢复判定', () => {
  const app = read('web/src/App.tsx');
  // 主病灶：沙盒付讫 reload 只有会话标志（URL 无 payment=success）⇒ 旧判定走
  // 纯冷启动分支清 ks_result 且不恢复 result ⇒ /result 零渲染＝黑屏。
  assert.ok(
    app.includes("|| sessionStorage.getItem('ks_payment_success') === '1';"),
    '冷启动恢复判定未纳入沙盒付讫会话信号（黑屏未根治）'
  );
});

test('E87-③-4 付讫报告自动生成全链接线（分诊→信号→消费）', () => {
  const app = read('web/src/App.tsx');
  // ResultPage 分诊：ks_paid_report_type 在场 ⇒ 报告触发；否则 once 洞察链（E84 保持）
  const iTriage = app.indexOf("const paidType = sessionStorage.getItem('ks_paid_report_type');");
  assert.ok(iTriage > 0, 'ResultPage 付讫分诊缺失');
  const triageSeg = app.slice(iTriage, iTriage + 600);
  assert.ok(triageSeg.includes("setPendingReportTrigger && setPendingReportTrigger(paidType)"), '分诊未路由到报告自动生成信号');
  assert.ok(triageSeg.includes('setPendingInsightTrigger && setPendingInsightTrigger(true)'), 'once 洞察自动链丢失');
  // AIInsightBlock 消费：会话解锁＋once 洞察复活＋对应报告自动生成（消费即清）
  assert.ok(app.includes('pendingReportTrigger?: ' + "'monthly' | 'yearly' | null"), 'AIInsightBlock 报告信号 prop 契约缺失');
  const iConsume = app.indexOf('generateReport(pendingReportTrigger)');
  assert.ok(iConsume > 0, '报告自动生成消费效应缺失');
  const consumeSeg = app.slice(Math.max(0, iConsume - 700), iConsume + 200);
  assert.ok(consumeSeg.includes("sessionStorage.setItem('ks_compat_session_unlocked', '1')"), '消费效应未落会话解锁');
  assert.ok(consumeSeg.includes('onReportConsumed'), '消费效应无清零回调（重触风险）');
  // ResultPage 渲染链把信号下传 AIInsightBlock
  assert.ok(app.includes('pendingReportTrigger={pendingReportTrigger}'), 'ResultPage 未下传报告信号');
});

/* ─── ④ 认领灵宠串台纠偏（/wealth/report 劫持根除） ─── */

test('E87-④-1 App 冷启动通用 backUrl 盲跳退役（劫持总闸）', () => {
  const app = read('web/src/App.tsx');
  const iEffect = app.indexOf('const paymentSuccess = new URLSearchParams(window.location.search).get(\'payment\')');
  assert.ok(iEffect > 0, '冷启动恢复效应定位失败');
  const seg = app.slice(iEffect, iEffect + 3200);
  // 通用盲跳分支物理退役：无 pendingPlan 的 backUrl 一律不得整页跳转
  assert.ok(!seg.includes('} else if (backUrl) {'), '通用 backUrl 盲跳分支残留违令（劫持死循环根因）');
  // 合法通道保留：财富购买意图（intent=checkout 全参续跑）
  assert.ok(seg.includes("wealthPlans.includes(pendingPlan || '')"), '财富购买意图回跳通道丢失');
  // 纯冷启动清陈年劫持源（else 分支逐字定位）
  const iPlain = app.indexOf("} else if (!isOAuthCallback && !justLoggedIn && !paymentSuccess) {", iEffect);
  assert.ok(iPlain > 0, '纯冷启动分支定位失败');
  assert.ok(app.slice(iPlain, iPlain + 400).includes("localStorage.removeItem('ks_oauth_back_url')"), '纯冷启动未清陈年回跳劫持源');
});

test('E87-④-2 callback 纯登录一律回首页（backUrl 仅财富意图且用后即清）', () => {
  const cb = read('web/public/auth/callback.html');
  // 回跳收口：backUrl 仅在 pendingPlan ∈ 财富档时生效
  assert.ok(cb.includes("WEALTH_PLANS.indexOf(pendingPlan) !== -1"), 'callback 未限定 backUrl 只服务财富购买意图');
  assert.ok(cb.includes("let target = '/'"), 'callback 纯登录未回首页');
  // 用后即清（绝不滞留成陈年劫持源）
  const iTarget = cb.indexOf("let target = '/';");
  const seg = cb.slice(iTarget, iTarget + 900);
  assert.ok(seg.includes("localStorage.removeItem('ks_oauth_back_url')"), 'callback 用后未清 backUrl（劫持源滞留）');
});

test('E87-④-3 认领灵宠清理链（消费终局清劫持源，回首页零污染）', () => {
  const cta = read('web/src/components/AdoptFamiliarCTA.tsx');
  const iClean = cta.indexOf("sessionStorage.setItem('ks_open_familiar_chat', '1')");
  assert.ok(iClean > 0, '认领清理链定位失败');
  const seg = cta.slice(iClean, iClean + 900);
  assert.ok(seg.includes("localStorage.removeItem('ks_oauth_back_url')"), '认领未清回跳劫持源（串台死循环根因）');
  assert.ok(seg.includes("localStorage.removeItem('ks_pending_checkout_plan')"), '认领未清续跑意图源');
  // 认领后回首页链保持（E85-④ 契约不回归）
  const iHome = cta.indexOf("window.location.href = '/'", iClean);
  assert.ok(iHome > 0, '认领后回首页链丢失');
});

/* ─── ⑤ 首页健壮性（JSON.parse 无保护解析零容忍） ─── */

test('E87-⑤-1 全仓 localStorage/sessionStorage 解析守卫（无裸 JSON.parse）', () => {
  // App 冷启动两条解析路径均在 try-catch 内（坏档丢弃不炸树）
  const app = read('web/src/App.tsx');
  for (const anchor of ['JSON.parse(saved)', 'JSON.parse(savedResult)']) {
    const i = app.indexOf(anchor);
    assert.ok(i > 0, `解析点缺失：${anchor}`);
    // 向前扫 300 字符内必须有 try 兜底开区
    const before = app.slice(Math.max(0, i - 300), i);
    assert.ok(before.includes('try'), `解析点无 try 守卫：${anchor}`);
  }
  const cta = read('web/src/components/AdoptFamiliarCTA.tsx');
  const iCta = cta.indexOf('JSON.parse(raw)');
  assert.ok(iCta > 0, '灵宠档解析点缺失');
  assert.ok(cta.slice(Math.max(0, iCta - 300), iCta).includes('try'), '灵宠档解析无守卫');
});
