// ═══════════════════════════════════════════════════════════════════════
// E85（主公军令 2026-10-24）：姻缘密码商业漏斗与状态机专项修正 —— 闸门
// ═══════════════════════════════════════════════════════════════════════
// 看守对象（军令四条铁律）：
//   ① 必现 $4.99 付费墙（per-session）：新测算/重新测算重置当次解锁状态 unpaid；
//      未付前 /result 100% 呈现 PaywallCard；废除未付费孤立「生成 AI 洞察」按钮；
//      当次付款返回自动流式揭晓 AI 洞察＋塔罗（账号级旧权益不得跨次白送）。
//   ② 宇宙生日年鉴按钮改名＋永久带金额：六语统一「解锁姻缘月报 $2.99 /
//      解锁姻缘年报 $29.99」；取消「(已解锁)」覆盖态。
//   ③ 彻底铲除「合盘」板块：SynastryProgress / CompatReportCanvas 渲染链零残留；
//      付费揭晓区纯净结构＝【AI 深度洞察＋实时塔罗】→【🐾 认领灵宠卡】→【🎂 年鉴】。
//   ④ 认领灵宠后必回星空首页：认领完成清 resultData/step/viewMode ＋整页导航 /。
// 链位军规：e84 < e85 < e40-compat(len-2) < python(链尾)。
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');

/* ─── ① per-session $4.99 付费墙 ─── */

test('E85-①-1 新测算重置当次解锁状态（per-session unpaid）', () => {
  const app = read('web/src/App.tsx');
  // handleCalculate：每次新测算强制清 per-session 解锁标记
  const iCalc = app.indexOf('const handleCalculate = (d1: string, d2: string, tt: CompatTimeTruth) => {');
  assert.ok(iCalc > 0, 'handleCalculate 缺失');
  const calcSeg = app.slice(iCalc, iCalc + 900);
  assert.ok(calcSeg.includes("sessionStorage.removeItem('ks_compat_session_unlocked')"), '新测算未重置 per-session 解锁状态（付费墙可被跨次白送）');
  // AIInsightBlock：sessionUnlocked 初值读 sessionStorage（支付成功 reload 后存续）
  assert.ok(/useState<boolean>\(\(\) => \{[\s\S]{0,120}sessionStorage\.getItem\('ks_compat_session_unlocked'\) === '1'/.test(app), 'per-session 解锁初值未读 sessionStorage');
});

test('E85-①-2 未付费 100% 必现付费墙（账号旧权益不得短路）', () => {
  const app = read('web/src/App.tsx');
  // 付费墙渲染条件 = showPaywall || !sessionUnlocked（paidStatus=true 账号残留也被拦）
  assert.ok(/if \(showPaywall \|\| !sessionUnlocked\) \{/.test(app), '付费墙未挂 per-session 门控（跳过付费墙直接出报告违令）');
  // 孤立「生成 AI 洞察」按钮废除：须 sessionUnlocked 门控（仅当次已解锁的重试入口）
  const iGen = app.indexOf('{sessionUnlocked && !insight && !loading && !error && (');
  assert.ok(iGen > 0, '生成 AI 洞察按钮未挂 sessionUnlocked 门控（未付费孤立按钮违令）');
  // 兜底反证：未门控的旧形态禁回流
  assert.ok(!app.includes('{!insight && !loading && !error && ('), '未门控孤立生成按钮回流违令');
});

test('E85-①-3 当次付款返回自动揭晓（解锁＋自动流式）', () => {
  const app = read('web/src/App.tsx');
  const seg = app.slice(app.indexOf('if (pendingInsightTrigger) {'), app.indexOf('if (pendingInsightTrigger) {') + 420);
  assert.ok(seg.includes("sessionStorage.setItem('ks_compat_session_unlocked', '1')"), '支付返回未落 per-session 解锁标志');
  assert.ok(seg.includes('setSessionUnlocked(true)'), '支付返回未解锁当次会话');
  assert.ok(seg.includes('triggerInsight()'), '支付返回未自动流式揭晓 AI 洞察＋塔罗');
});

/* ─── ② 年鉴按钮六语统一＋永久带金额 ─── */

test('E85-②-1 年鉴六语统一词条（军令原文给定，永久带金额）', () => {
  const app = read('web/src/App.tsx');
  const dict = app.slice(app.indexOf('const L_ALMANAC_BTN'), app.indexOf('function AIInsightBlock'));
  assert.ok(dict.length > 300, 'L_ALMANAC_BTN 六语字典缺失');
  // 六语全在（zh/en/fr/es/th/vi 各含月报＋年报双词条）
  for (const k of ['zh:', 'en:', 'fr:', 'es:', 'th:', 'vi:']) {
    assert.ok(dict.includes(k), `年鉴字典缺 ${k}`);
  }
  // 军令给定锚点抽检（zh 全锁＋en/th 抽检）
  assert.ok(dict.includes("'📅 解锁姻缘月报 $2.99'"), 'zh 月报词条漂移违令');
  assert.ok(dict.includes("'👑 解锁姻缘年报 $29.99'"), 'zh 年报词条漂移违令');
  assert.ok(dict.includes('Unlock Monthly Love Report $2.99'), 'en 月报词条漂移违令');
  assert.ok(dict.includes('Unlock Annual Love Report $29.99'), 'en 年报词条漂移违令');
  assert.ok(dict.includes('ปลดล็อกรายงานดวงความรักรายเดือน $2.99'), 'th 月报词条漂移违令');
  // 金额永久呈现：12 键全带 $2.99 / $29.99
  const moneyCount = (dict.match(/\$2\.99/g) || []).length;
  const yearCount = (dict.match(/\$29\.99/g) || []).length;
  assert.ok(moneyCount >= 6 && yearCount >= 6, '六语月报/年报金额未全覆盖');
});

test('E85-②-2 「(已解锁)」覆盖态退役＋按钮统一待解锁购买样式', () => {
  const app = read('web/src/App.tsx');
  // 审计口径＝年鉴渲染区（{insight && ( 年鉴卡到 signOut 按钮段）的**按钮文案**，
  // 注释与状态变量名（sessionUnlocked）不在射程（军令禁现的是按钮覆盖态文案）。
  const iAlmRender = app.indexOf('🎂 {lang');
  const iSignOut = app.indexOf('{TXT.signOut[lang] || TXT.signOut.en}', iAlmRender);
  assert.ok(iAlmRender > 0 && iSignOut > iAlmRender, '年鉴渲染区定位失败');
  const renderSeg = app.slice(iAlmRender, iSignOut);
  for (const banned of ['生成情感月报', '生成情感年报', '已解锁', 'Unlocked', 'VIP 尊享', 'VIP free access', '解锁情感月报', '解锁年度报告']) {
    assert.ok(!renderSeg.includes(banned), `年鉴按钮「${banned}」覆盖态残留违令`);
  }
  // 按钮渲染恒取 L_ALMANAC_BTN（无权益分支文案切换）
  assert.ok((app.match(/L_ALMANAC_BTN\[lang\] \|\| L_ALMANAC_BTN\.en\)\.monthly/g) || []).length >= 1, '月报按钮未走统一词条');
  assert.ok((app.match(/L_ALMANAC_BTN\[lang\] \|\| L_ALMANAC_BTN\.en\)\.yearly/g) || []).length >= 1, '年报按钮未走统一词条');
});

/* ─── ③ 合盘板块零残留 ─── */

test('E85-③-1 合盘渲染链零残留（DOM 一根像素不留）', () => {
  const app = read('web/src/App.tsx');
  for (const banned of ['<CompatReportCanvas', '<SynastryProgress', 'reportPayload', 'reportHouseOverlay', 'reportDelivery', "generateReport('once')", 'autoReportLockRef', 'loadHouseOverlay', 'saveHouseOverlay', 'isCompatReportPayload']) {
    assert.ok(!app.includes(banned), `App 合盘渲染链残留违令：${banned}`);
  }
});

test('E85-③-2 付费揭晓区纯净结构：洞察塔罗 → 灵宠卡 → 年鉴（顺序铁律）', () => {
  const app = read('web/src/App.tsx');
  const iTarot = app.indexOf('tarotCard && (');
  const iAdopt = app.indexOf('{insight && c1 && (');
  const iAlm = app.indexOf('L_ALMANAC_BTN[lang]');
  assert.ok(iTarot > 0 && iAdopt > iTarot, '灵宠卡未置于 AI 洞察＋塔罗之后');
  assert.ok(iAlm > iAdopt, '年鉴未置于灵宠卡之后（军令纯净结构顺序违令）');
  // 灵宠卡挂载条件：洞察在场＋真实出生城市（E34 D5 白名单纪律不变）
  const adoptSeg = app.slice(iAdopt, iAdopt + 700);
  assert.ok(adoptSeg.includes('<AdoptFamiliarCTA'), '灵宠卡组件未挂载');
  assert.ok(adoptSeg.includes('birthDate={d1}'), '灵宠卡未传出生真值');
});

/* ─── ④ 认领灵宠后必回星空首页 ─── */

test('E85-④-1 认领完成回调绑定（组件级默认：清 result 状态＋整页回首页）', () => {
  const cta = read('web/src/components/AdoptFamiliarCTA.tsx');
  // onAdopted prop 契约
  assert.ok(cta.includes('onAdopted?: () => void;'), 'E85 缺 onAdopted 回调契约');
  // adopt 成功后触发链
  const iAdopt = cta.indexOf('setPersisted(!!data.persisted);');
  const seg = cta.slice(iAdopt, iAdopt + 1200);
  assert.ok(seg.includes("sessionStorage.setItem('ks_open_familiar_chat', '1')"), '认领后未落对话舱意图标记');
  assert.ok(seg.includes("localStorage.removeItem('ks_result')"), '认领后未清 ks_result（旧报告页会复活）');
  assert.ok(seg.includes("sessionStorage.removeItem('ks_result')"), '认领后未清 sessionStorage 结果副本');
  assert.ok(seg.includes("sessionStorage.removeItem('ks_compat_session_unlocked')"), '认领后未清 per-session 解锁标记');
  assert.ok(seg.includes('if (onAdopted)'), '认领后未绑定宿主回调');
  assert.ok(seg.includes("window.location.href = '/'"), '认领后未整页导航回星空首页');
});

test('E85-④-2 认领带路按钮仍守 E52 直达纪律（禁 history.back）', () => {
  const cta = read('web/src/components/AdoptFamiliarCTA.tsx');
  const iLead = cta.indexOf('data-testid="adopt-lead-home"');
  const seg = cta.slice(iLead, iLead + 900);
  assert.ok(seg.includes("sessionStorage.setItem('ks_open_familiar_chat', '1')"), '带路按钮未落对话舱意图标记（E76）');
  assert.ok(!seg.includes('history.back'), '带路按钮 history.back 回流违令（E52 铁令）');
});

/* ─── 段位入编 ─── */

test('E85-⑤ 段位入编：e85 居 e84 之后、e40-compat(len-2) 之前', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split('&&').map((s) => s.trim());
  const iE85 = segs.findIndex((s) => s.includes('audit-e85-compat-funnel'));
  const iE84 = segs.findIndex((s) => s.includes('audit-e84-compat-black-gold'));
  const iE40 = segs.findIndex((s) => s.includes('e40-compat'));
  assert.ok(iE85 > 0, 'E85 闸门未入编 test:astro');
  assert.ok(iE84 > 0 && iE85 > iE84, 'E85 须位于 e84 之后');
  assert.ok(iE40 === segs.length - 2, `e40-compat 须恒为 len-2（实为 ${iE40}/${segs.length - 1}）`);
  assert.ok(segs.length >= 63, `段数下界 63（62 + E85），实为 ${segs.length}`);
});
