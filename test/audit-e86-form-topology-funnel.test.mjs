// ═══════════════════════════════════════════════════════════════════════
// E86（主公军令 2026-10-24）：表单拓扑重构＋全局黑金滚动槽＋付费墙链路修复 —— 闸门
// ═══════════════════════════════════════════════════════════════════════
// 看守对象（军令四条铁律）：
//   ① 表单拓扑对调：双星卡折叠区 DOM 顺序统一「生日 → 出生城市 → 出生时间」
//      （城市下拉展开只覆盖本卡时间框，不再跨卡遮挡 TA 卡与主行动按钮）。
//   ② 全局黑金滚动槽：.celestial-scrollbar（军令给定 CSS 逐字规格）统领
//      姻缘＋财富所有城市联想下拉容器，原生灰白滚动槽零残留。
//   ③ 付费墙链路修复：already_paid 静默吞噬根治（compatibility_once 视作
//      当次会话解锁＋复用全自动揭晓链）；AuthWall 分支前置（未登录点击
//      「立即解锁」不再被 !sessionUnlocked 顶死）；点击即刻 loading；
//      档位对齐 E85 军令（$2.99/月 姻缘月报、$29.99/年 姻缘年报，
//      $9.99/star_monthly_vip 与 $99.99/all_pass_yearly 旧档文案退役）。
// 链位军规：e85 < e86 < e40-compat(len-2) < python(链尾)。
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');

/* ─── ① 表单拓扑对调（城市在上、时间在下） ─── */

test('E86-①-1 双星卡折叠区 DOM 顺序：城市在上、时间在下', () => {
  const app = read('web/src/App.tsx');
  // 双卡（fold1/fold2）各验：CitySearchInput 在 TimeInput 之前
  for (const marker of ['onSelect={setC1}', 'onSelect={setC2}']) {
    const iCity = app.indexOf(marker);
    assert.ok(iCity > 0, `城市输入缺失：${marker}`);
    // 向前找本卡折叠区内最近的 TimeInput 锚（setT1/setT2 渲染行）
    const timeAnchor = marker.includes('setC1') ? '<TimeInput value={t1}' : '<TimeInput value={t2}';
    const iTime = app.indexOf(timeAnchor);
    assert.ok(iTime > 0, `时间输入缺失：${timeAnchor}`);
    assert.ok(iCity < iTime, `折叠区顺序违令：出生城市须在出生时间之前（${marker}）`);
  }
});

test('E86-①-2 下拉浮层防遮挡防线（absolute + z-index + 落定放行）', () => {
  const csi = read('web/src/components/CitySearchInput.tsx');
  // 下拉浮层 absolute + zIndex（军令要求 z-index:50 起步；1000 更高同样合规）
  const drop = csi.slice(csi.indexOf('className="celestial-scrollbar"'));
  assert.ok(drop.length > 100, '下拉浮层定位失败');
  const seg = csi.slice(csi.indexOf('{/* 搜索结果下拉 */}'), csi.indexOf('{results.map('));
  assert.ok(/position:\s*'absolute'/.test(seg), '下拉浮层非 absolute 定位');
  assert.ok(/zIndex:\s*1000/.test(seg), '下拉浮层 z-index 缺失（遮挡隐患）');
  // 外层折叠卡：展开落定后 overflow:visible（E71/E84 祖先裁切链防线，不得回退）
  const css = read('web/src/App.css');
  assert.ok(/\.ks-fold\[data-settled='true'\]\s*>\s*\.ks-fold-inner\s*\{[^}]*overflow:\s*visible/.test(css), '折叠落定放行规则缺失（下拉会被裁切）');
});

/* ─── ② 全局黑金滚动槽（.celestial-scrollbar 军令给定规格） ─── */

test('E86-②-1 .celestial-scrollbar 令牌铸成（军令 CSS 逐字规格）', () => {
  const css = read('web/src/styles/celestial-tokens.css');
  assert.ok(css.includes('.celestial-scrollbar'), '滚动槽类缺失');
  // 细长胶囊轨道 5px + 深黑半透 + 金渐变滑块 + 悬停鎏金（军令规格四要素）
  assert.ok(/\.celestial-scrollbar::-webkit-scrollbar\s*\{[^}]*width:\s*5px/s.test(css), '滚动槽宽度非 5px 军令规格');
  assert.ok(/scrollbar-width:\s*thin/.test(css), 'Firefox thin 规格缺失');
  assert.ok(/linear-gradient\(180deg, rgba\(212, 175, 55, 0\.6\), rgba\(180, 140, 30, 0\.35\)\)/.test(css), '金渐变滑块规格漂移');
  assert.ok(/border-radius:\s*999px/.test(css), '胶囊圆角规格缺失');
  assert.ok(/scrollbar-color:\s*rgba\(212, 175, 55, 0\.45\) rgba\(15, 13, 25, 0\.6\)/.test(css), 'Firefox 滑轨双色规格漂移');
});

test('E86-②-2 城市下拉容器全挂 .celestial-scrollbar（姻缘＋财富共用组件单源）', () => {
  const csi = read('web/src/components/CitySearchInput.tsx');
  const seg = csi.slice(csi.indexOf('{/* 搜索结果下拉 */}'), csi.indexOf('{results.map('));
  assert.ok(seg.includes('className="celestial-scrollbar"'), '城市下拉容器未挂黑金滚动槽类');
  // 财富模块走同一 CitySearchInput 组件（WealthPage.tsx 引用）⇒ 单源全覆盖
  const wealth = read('web/src/pages/WealthPage.tsx');
  assert.ok(wealth.includes('CitySearchInput'), '财富模块城市选择器未走共用组件（单源断裂）');
});

/* ─── ③ 付费墙 $4.99 链路修复＋档位对齐 ─── */

test('E86-③-1 already_paid 静默吞噬根治（点击必响应）', () => {
  const app = read('web/src/App.tsx');
  const iPaid = app.indexOf("} else if (route.kind === 'paid') {");
  assert.ok(iPaid > 0, 'paid 分支缺失');
  const seg = app.slice(iPaid, iPaid + 900);
  // compatibility_once ⇒ 当次会话解锁＋复用全自动揭晓链（点击必有下文）
  assert.ok(seg.includes("plan === 'compatibility_once'"), 'paid 分支未认 compatibility_once（静默吞噬违令）');
  assert.ok(seg.includes("sessionStorage.setItem('ks_payment_success', '1')"), 'paid 分支未复用支付成功自动链');
  assert.ok(seg.includes("sessionStorage.setItem('ks_compat_session_unlocked', '1')"), 'paid 分支未落 per-session 解锁标志');
  assert.ok(seg.includes('window.location.reload()'), 'paid 分支未刷新承接');
});

test('E86-③-2 AuthWall 分支前置（未登录点击「立即解锁」不再被吞）', () => {
  const app = read('web/src/App.tsx');
  const iAuth = app.indexOf('if (showAuthWall && insight === null) {');
  const iWall = app.indexOf('if (showPaywall || !sessionUnlocked) {');
  assert.ok(iAuth > 0 && iWall > 0, '两分支定位失败');
  assert.ok(iAuth < iWall, 'AuthWall 须在付费墙分支之前（未登录点击被吞违令）');
});

test('E86-③-3 点击「立即解锁」即刻加载态（无 window.open）', () => {
  const app = read('web/src/App.tsx');
  const iHp = app.indexOf('const handlePurchase = (plan: string) => {');
  const seg = app.slice(iHp, iHp + 700);
  assert.ok(seg.includes('setLoading(true)'), '点击未即刻触发加载态');
  // 军令铁律：异步后禁 window.open —— 全链 window.location.href 全页定向
  assert.ok(!app.includes('window.open('), 'window.open 残留违令（移动端拦截风险）');
});

test('E86-③-4 付费墙档位对齐 E85 军令（$2.99/$29.99；旧档退役）', () => {
  const pw = read('web/src/components/PaywallCard.tsx');
  // 月报档：plan 映射 compatibility_monthly_report + 文案带 $2.99
  assert.ok(pw.includes("onPurchase('compatibility_monthly_report')"), '月报档 plan 未映射 compatibility_monthly_report');
  assert.ok(pw.includes("onPurchase('compatibility_yearly_report')"), '年报档 plan 未映射 compatibility_yearly_report');
  assert.ok(pw.includes('monthlyBtn'), '月报档统一文案键缺失');
  assert.ok(pw.includes('yearlyBtn'), '年报档统一文案键缺失');
  // 六语金额全覆盖
  const moneyCount = (pw.match(/\$2\.99/g) || []).length;
  const yearCount = (pw.match(/\$29\.99/g) || []).length;
  assert.ok(moneyCount >= 6, `六语月报 $2.99 未全覆盖（实得 ${moneyCount}）`);
  assert.ok(yearCount >= 6, `六语年报 $29.99 未全覆盖（实得 ${yearCount}）`);
  // 旧档文案/旧 plan 禁回流
  for (const banned of ['star_monthly_vip', 'all_pass_yearly', '$9.99', '$99.99', 'yearlyPrice', 'subscription:']) {
    assert.ok(!pw.includes(banned), `付费墙旧档残留违令：${banned}`);
  }
});

test('E86-③-5 付费墙三档链完整性（后端档位映射已备，零后端改动）', () => {
  const server = read('server.js');
  const map = server.slice(server.indexOf('const STRIPE_PRICE_MAP = {'), server.indexOf('const STRIPE_PRICE_MAP = {') + 700);
  assert.ok(map.includes("compatibility_once:"), '后端缺 $4.99 档');
  assert.ok(map.includes('compatibility_monthly_report:'), '后端缺 $2.99 档');
  assert.ok(map.includes('compatibility_yearly_report:'), '后端缺 $29.99 档');
});

/* ─── 链位军规 ─── */

test('E86-⑩ 链位：e85 < e86 < e40-compat(len-2) < python(链尾)', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split('&&').map(s => s.trim());
  const iE85 = segs.findIndex(s => s.includes('audit-e85-compat-funnel'));
  const iE86 = segs.findIndex(s => s.includes('audit-e86-form-topology-funnel'));
  const iE40 = segs.findIndex(s => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.ok(iE85 >= 0, 'E85 闸门不在链上');
  assert.ok(iE86 === iE85 + 1, `E86 须紧跟 e85 之后（实得 ${iE86}/${iE85}）`);
  assert.ok(iE40 === segs.length - 2, `e40-compat 须恒为 len-2（实为 ${iE40}/${segs.length - 1}）`);
  assert.ok(segs[segs.length - 1].includes('python3'), 'python 段须恒为链尾');
});
