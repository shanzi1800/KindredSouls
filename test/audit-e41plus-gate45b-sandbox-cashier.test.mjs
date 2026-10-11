/* ═══════════════════════════════════════════════════════════════════════════
 * Gate 45-B 闸门：沙盘收银台前端线（截断分流 · 收银台 · 灵宠认领 CTA）
 *   A 分流真值（沙盘截断外链 · 同源防钓鱼 · already_paid 次序）
 *   B 请求构造（双 SKU 端点 + 券码归一/可提交性 + /sandbox-pay 直达解析）
 *   C 结果判定（零伪造 · 拒因闭集 ⇒ 字典文案键）
 *   D 【E34 D5 红线】灵宠领养入参白名单（只出六键 · 业务线字段构造层物理剔除）
 *   E 前端接线（收银台契约 + 截断次序 + 报告尾挂载 + 字典域齐备）
 *   F 段位守备（下界 ≥45 + iCap===len-2）
 *   G 注入反漂移（判据对篡改必红）
 *
 * 🔴 本闸门首要使命①：证明「沙盘回执绝不被跳成外链」（截断 + 同源）。
 * 🔴 本闸门首要使命②：证明「灵宠领养绝不夹带业务线字段」（白名单而非黑名单）。
 *
 * 纯 Node 运行（无 DOM / 无网络 / 无 LLM）。
 * ═══════════════════════════════════════════════════════════════════════════ */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DICT = JSON.parse(readFileSync(join(ROOT, 'astro', 'astro_terms_dict.json'), 'utf8'));
const LANGS = DICT.meta.langs;
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const readSrc = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const MODULE_PATH = join(ROOT, 'web/src/lib/sandboxCheckout.mjs');
const MODULE_SRC = readFileSync(MODULE_PATH, 'utf8');
const M = await import(pathToFileURL(MODULE_PATH).href);

const APP_SRC = readSrc('web/src/App.tsx');
const WEALTH_SRC = readSrc('web/src/pages/WealthReportPage.tsx');
const CASHIER_SRC = readSrc('web/src/components/SandboxCashier.tsx');
const ADOPT_SRC = readSrc('web/src/components/AdoptFamiliarCTA.tsx');
const SERVER_SRC = readSrc('server.js');

/* ── 段位 ── */
const segs = String(PKG.scripts['test:astro']).split('&&').map((x) => x.trim()).filter(Boolean);
const iCap = segs.findIndex((s) => s.includes('e40-compat'));

/* ── 判据（主测与注入自测**同源**取用）── */
const SELF_ORIGIN = 'https://kindredsouls.online';
const sandboxRouteIsSandbox = (mod) => mod.resolveCheckoutRoute({
  sandbox: true, plan: 'wealth_once', sessionId: 'cs_sandbox_1',
  url: '/sandbox-pay?plan=wealth_once&session=cs_sandbox_1',
}, SELF_ORIGIN).kind === 'sandbox';
const rejectsForeignSandboxUrl = (mod) =>
  mod.resolveCheckoutRoute({ sandbox: true, url: '//evil.example/sandbox-pay' }, SELF_ORIGIN).kind === 'error'
  && mod.resolveCheckoutRoute({ sandbox: true, url: 'https://evil.example/sandbox-pay?x=1' }, SELF_ORIGIN).kind === 'error';
const adoptDropsExtras = (mod) => {
  const out = mod.buildFamiliarAdoptPayload(
    { birthDate: '1990-01-01', birthTime: '12:00', lat: 1, lon: 2, tz: 'UTC', insight: 'LEAK', score: 88, paid_plans: { x: 1 }, reportText: 'LEAK' },
    'buddy',
  );
  return Object.keys(out).length === mod.FAMILIAR_ADOPT_FIELDS.length
    && !('insight' in out) && !('score' in out) && !('paid_plans' in out) && !('reportText' in out);
};
/**
 * 前端截断判据（三条铁律同时成立）：
 *   ① 走纯核 dispatchCheckoutRoute；② 裸跳 `data.url` 形态已消除；
 *   ③ 外跳赋值必在 `redirect` 分支内，且 `sandbox` 分支体内**零跳转**（location.href/assign/replace/window.open）。
 */
const checkoutIsTruncated = (src) => {
  if (!src.includes('dispatchCheckoutRoute(')) return false;
  if (src.includes('window.location.href = data.url')) return false;
  const iRedirect = src.indexOf("route.kind === 'redirect'");
  const iHref = src.indexOf('window.location.href = route.url');
  const iSandbox = src.indexOf("route.kind === 'sandbox'");
  if (iRedirect === -1 || iHref === -1 || iSandbox === -1) return false;
  if (!(iRedirect < iHref)) return false;                       // 外跳必须在 redirect 分支内
  const body = src.slice(iSandbox, iSandbox + 260);             // sandbox 分支体
  return !/location\.(href|assign|replace)\s*=|window\.open\(/.test(body);
};
/** E34 D5 组件侧判据：禁业务线字段标识符出现在灵宠认领组件真值区 */
const ADOPT_BANNED = ['insight', 'reportText', 'wealthComment', 'paid_plans', 'entitlement', 'reportType', 'free_access', 'houseOverlay', 'synastry'];
const adoptSourceIsClean = (src) => ADOPT_BANNED.every((w) => !src.includes(w));

/* ── 变异模块加载器（写独立临时文件 ⇒ 天然绕开 ESM 缓存）── */
const _tmpRoot = mkdtempSync(join(tmpdir(), 'ks-g45b-'));
let _seq = 0;
async function loadMutated(mutate) {
  const src = mutate(MODULE_SRC);
  assert.notEqual(src, MODULE_SRC, '注入未命中锚点（锚点漂移，注入自测失效）');
  const p = join(_tmpRoot, 'mod' + (++_seq) + '.mjs');
  writeFileSync(p, src, 'utf8');
  return await import(pathToFileURL(p).href);
}

/* ═══════════ A 分流真值（截断 · 同源 · 次序）═══════════ */

test('A1 沙盘回执 ⇒ kind=sandbox（就地改道，不跳外链）', () => {
  const r = M.resolveCheckoutRoute({
    sandbox: true, plan: 'wealth_once', sessionId: 'cs_sandbox_1',
    url: '/sandbox-pay?plan=wealth_once&session=cs_sandbox_1',
  });
  assert.equal(r.kind, 'sandbox');
  assert.equal(r.plan, 'wealth_once');
  assert.equal(r.sessionId, 'cs_sandbox_1');
  assert.ok(sandboxRouteIsSandbox(M), '判据射程：沙盘回执必须判 sandbox');
});

test('A2 【防钓鱼】沙盘 URL 非同源 ⇒ 一律 error，绝不跳转', () => {
  for (const evil of [
    '//evil.example/sandbox-pay',
    'https://evil.example/sandbox-pay?plan=x',
    'https://kindredsouls.online.evil.example/sandbox-pay',
    'https://evil.example/steal',
    '/other-path',
    '',
  ]) {
    const r = M.resolveCheckoutRoute({ sandbox: true, plan: 'wealth_once', url: evil }, SELF_ORIGIN);
    assert.equal(r.kind, 'error', `非法沙盘 URL 未拒：${evil}`);
    assert.equal(r.reason, 'bad_sandbox_url');
  }
  // 同源绝对 URL（pathname 恰为 /sandbox-pay 且 origin 严格一致）合法
  assert.equal(M.resolveCheckoutRoute({ sandbox: true, url: SELF_ORIGIN + '/sandbox-pay?a=1' }, SELF_ORIGIN).kind, 'sandbox');
  assert.equal(M.resolveCheckoutRoute({ sandbox: true, url: SELF_ORIGIN + '/sandbox-pay?b=2' }, SELF_ORIGIN + '/' ).kind, 'sandbox', '带尾斜杠的当前源亦应等价');
  // 🔴 缺当前源 ⇒ 无法核实 ⇒ 一律拒（fail-closed，绝不放行「看着像自己」的外部 URL）
  assert.equal(M.resolveCheckoutRoute({ sandbox: true, url: SELF_ORIGIN + '/sandbox-pay' }).kind, 'error');
  assert.equal(M.resolveCheckoutRoute({ sandbox: true, url: SELF_ORIGIN + '/sandbox-pay' }, '').kind, 'error');
  assert.equal(M.sandboxUrlIsSameOrigin(SELF_ORIGIN + '/sandbox-pay', undefined), false);
  assert.ok(rejectsForeignSandboxUrl(M), '判据射程：外部域必须被拒');
});

test('A3 次序铁律：already_paid 优先；url ⇒ redirect；空/畸形 ⇒ error', () => {
  assert.equal(M.resolveCheckoutRoute({ already_paid: true, plan: 'wealth_once' }).kind, 'paid');
  // 已拥有者即便回执也带 sandbox 标记，也**不得**再开收银台（免得重复付费）
  assert.equal(M.resolveCheckoutRoute({ already_paid: true, sandbox: true, url: '/sandbox-pay' }).kind, 'paid');
  const r = M.resolveCheckoutRoute({ url: 'https://checkout.stripe.com/c/pay/abc' });
  assert.equal(r.kind, 'redirect');
  assert.equal(r.url, 'https://checkout.stripe.com/c/pay/abc');
  for (const bad of [null, undefined, 'x', 42, {}]) {
    assert.equal(M.resolveCheckoutRoute(bad).kind, 'error');
  }
  assert.equal(M.resolveCheckoutRoute({}).reason, 'no_url');
});

test('A4 沙盘回执 ⇒ 总线就地唤起收银台；非法回执 ≠ 唤起（零空壳）', () => {
  M.closeSandboxCashier();
  const route = M.dispatchCheckoutRoute({ sandbox: true, plan: 'wealth_once', sessionId: 'cs_sandbox_1', url: '/sandbox-pay?plan=wealth_once&session=cs_sandbox_1' });
  assert.equal(route.kind, 'sandbox');
  const cur = M.getSandboxCashier();
  assert.ok(cur, '总线未唤起收银台 ⇒ 用户被截断后无出口');
  assert.equal(cur.plan, 'wealth_once');
  assert.equal(cur.sessionId, 'cs_sandbox_1');
  M.closeSandboxCashier();
  assert.equal(M.getSandboxCashier(), null, '关闭后必须复位');

  // 真金白银回执 / 非法沙盘回执 ⇒ 绝不误开
  M.closeSandboxCashier();
  assert.equal(M.dispatchCheckoutRoute({ url: 'https://checkout.stripe.com/c/pay/x' }).kind, 'redirect');
  assert.equal(M.getSandboxCashier(), null, '非沙盘回执不得唤起收银台');
  assert.equal(M.dispatchCheckoutRoute({ sandbox: true, url: 'https://evil.example/sandbox-pay' }).kind, 'error');
  assert.equal(M.getSandboxCashier(), null, '非法沙盘 URL 不得唤起收银台');

  // 缺 plan ⇒ 拒绝唤起（不弹空壳模态）
  assert.equal(M.openSandboxCashier({ sessionId: 'x' }), null);
  assert.equal(M.openSandboxCashier(null), null);
  assert.equal(M.getSandboxCashier(), null);
});

/* ═══════════ B 请求构造 ═══════════ */

test('B1 双 SKU 端点形态：与后端 app.post 路径逐字同源', () => {
  assert.deepEqual(M.buildSandboxCompleteRequest('wealth_once'), {
    path: '/api/sandbox/complete', method: 'POST', body: { plan: 'wealth_once' },
  });
  assert.deepEqual(M.buildSandboxRedeemRequest(' ks-demo-pass '), {
    path: '/api/sandbox/redeem', method: 'POST', body: { code: 'KS-DEMO-PASS' },
  });
  for (const p of [M.SANDBOX_COMPLETE_PATH, M.SANDBOX_REDEEM_PATH]) {
    assert.ok(SERVER_SRC.includes(`app.post('${p}'`), `后端未注册端点：${p}`);
  }
  assert.equal(M.FAMILIAR_ADOPT_PATH, '/api/familiar/adopt');
  assert.ok(SERVER_SRC.includes(`app.post('${M.FAMILIAR_ADOPT_PATH}'`), '后端未注册灵宠领养端点');
});

test('B2 券码归一：trim + 大写；非字符串 ⇒ 空串（绝不臆造）', () => {
  assert.equal(M.normalizeVoucherInput('  ks-demo-compat '), 'KS-DEMO-COMPAT');
  assert.equal(M.normalizeVoucherInput(null), '');
  assert.equal(M.normalizeVoucherInput(undefined), '');
  assert.equal(M.normalizeVoucherInput(123), '');
  assert.equal(M.normalizeVoucherInput({}), '');
});

test('B3 券码可提交性边界（空/过短/过长/含空格 ⇒ 拒，不做猜测性纠正）', () => {
  assert.equal(M.isVoucherSubmittable(''), false);
  assert.equal(M.isVoucherSubmittable('AB'), false);
  assert.equal(M.isVoucherSubmittable('ABC'), true);
  assert.equal(M.isVoucherSubmittable('ks-demo-pass'), true);
  assert.equal(M.isVoucherSubmittable('KS DEMO'), false);
  assert.equal(M.isVoucherSubmittable('A'.repeat(32)), true);
  assert.equal(M.isVoucherSubmittable('A'.repeat(33)), false);
  assert.equal(M.isVoucherSubmittable('-ABC'), false, '首字符不得为连字符');
});

test('B4 /sandbox-pay 直达解析：plan/session 取值，缺参 ⇒ 空串', () => {
  assert.deepEqual(M.decodeSandboxPaySearch('?plan=wealth_once&session=cs_sandbox_n1'),
    { plan: 'wealth_once', sessionId: 'cs_sandbox_n1' });
  assert.deepEqual(M.decodeSandboxPaySearch('plan=x'), { plan: 'x', sessionId: '' });
  assert.deepEqual(M.decodeSandboxPaySearch(''), { plan: '', sessionId: '' });
  assert.deepEqual(M.decodeSandboxPaySearch(null), { plan: '', sessionId: '' });
});

test('B5 同源路径常量与后端 buildSandboxSession 出参一致', async () => {
  const SB = await import(pathToFileURL(join(ROOT, 'lib/sandboxPayment.mjs')).href);
  const s = SB.buildSandboxSession({ plan: 'wealth_once', userId: 'u1', origin: 'https://kindredsouls.online', nonce: 'n1' });
  assert.ok(s.path.startsWith(M.SANDBOX_PAY_PATH + '?'), `后端收银台路径 ${s.path} 与前端常量 ${M.SANDBOX_PAY_PATH} 不同源`);
  assert.equal(M.sandboxUrlIsSameOrigin(s.path), true, '后端下发的同源 path 必须被前端接受');
});

/* ═══════════ C 结果判定（零伪造）═══════════ */

test('C1 granted 真值：仅 ok:true 且 granted:true 才算开通', () => {
  const o = M.describeSandboxOutcome({ ok: true, granted: true, plan: 'wealth_once', sessionId: 'cs_sandbox_1' });
  assert.equal(o.ok, true);
  assert.equal(o.granted, true);
  assert.equal(o.plan, 'wealth_once');
  assert.equal(o.messageKey, 'SandboxGranted');
  assert.equal(o.reason, null);
});

test('C2 ok 但未 granted ⇒ 如实不报开通（绝不伪报）', () => {
  const o = M.describeSandboxOutcome({ ok: true, granted: false, plan: 'wealth_once' });
  assert.equal(o.granted, false, 'granted:false 被伪报为开通 ⇒ 严重');
  assert.equal(o.messageKey, 'SandboxFailed');
});

test('C3 拒因闭集 ⇒ 字典文案键；且与后端真值核逐态同源', async () => {
  const map = {
    empty: 'SandboxNoCode',
    unknown: 'SandboxBadCode',
    inactive: 'SandboxCodeOff',
    expired: 'SandboxCodeOld',
    plan_not_sellable: 'SandboxUnsellable',
  };
  for (const [reason, key] of Object.entries(map)) {
    assert.equal(M.rejectReasonKey(reason), key, `${reason} 文案键不符`);
    const o = M.describeSandboxOutcome({ ok: false, reason });
    assert.equal(o.granted, false);
    assert.equal(o.messageKey, key);
    assert.ok(DICT.domains.sandbox[key], `字典缺词条 ${key}`);
  }
  assert.equal(M.rejectReasonKey('never_registered'), null, '未登记拒因必须返回 null');
  assert.equal(M.describeSandboxOutcome({ ok: false, reason: 'weird' }).messageKey, 'SandboxFailed');
  assert.deepEqual([...M.VOUCHER_REJECT_REASONS].sort(),
    ['empty', 'expired', 'inactive', 'plan_not_sellable', 'unknown']);

  // 🔴 四态拒因与后端纯核**逐态同源**（取真值核跑，禁源码文本猜测）
  const SB = await import(pathToFileURL(join(ROOT, 'lib/sandboxPayment.mjs')).href);
  const table = SB.resolveVoucherTable({});
  const NOW = new Date('2026-10-11T07:30:00.000Z');
  assert.equal(SB.resolveVoucher('', table, NOW).reason, 'empty');
  assert.equal(SB.resolveVoucher('KS-NOPE', table, NOW).reason, 'unknown');
  assert.equal(SB.resolveVoucher('KS-OFF', { 'KS-OFF': { plan: 'wealth_once', active: false } }, NOW).reason, 'inactive');
  assert.equal(SB.resolveVoucher('KS-OLD', { 'KS-OLD': { plan: 'wealth_once', expiresAt: '2000-01-01T00:00:00Z' } }, NOW).reason, 'expired');
  for (const r of ['empty', 'unknown', 'inactive', 'expired']) {
    assert.ok(M.VOUCHER_REJECT_REASONS.includes(r), `后端拒因 ${r} 未登记前端闭集`);
    assert.ok(M.rejectReasonKey(r), `后端拒因 ${r} 缺字典文案键`);
  }
});

test('C4 畸形入参不抛错且如实判失败（零级联崩溃）', () => {
  for (const bad of [null, undefined, 'x', 1, []]) {
    const o = M.describeSandboxOutcome(bad);
    assert.equal(o.ok, false);
    assert.equal(o.granted, false);
    assert.equal(o.messageKey, 'SandboxFailed');
  }
});

/* ═══════════ D 【E34 D5】灵宠领养入参白名单 ═══════════ */

test('D1 白名单字段冻结且顺序即契约（出生时空 + 关系模式，六键）', () => {
  assert.deepEqual([...M.FAMILIAR_ADOPT_FIELDS],
    ['birthDate', 'birthTime', 'lat', 'lon', 'tz', 'relationMode']);
  assert.ok(Object.isFrozen(M.FAMILIAR_ADOPT_FIELDS), '字段白名单必须冻结（防运行期扩张）');
  const out = M.buildFamiliarAdoptPayload(
    { birthDate: '1990-01-01', birthTime: '12:00', lat: 31.2, lon: 121.5, tz: 'Asia/Shanghai' }, 'buddy');
  assert.deepEqual(Object.keys(out), [...M.FAMILIAR_ADOPT_FIELDS], '键集/键序必须与白名单逐字一致');
  assert.equal(out.relationMode, 'buddy');
});

test('D2 【核心】业务线字段在**构造层**被剔除（白名单，而非黑名单漏网）', () => {
  const dirty = {
    birthDate: '1990-01-01', birthTime: '12:00', lat: 1, lon: 2, tz: 'UTC',
    insight: '合盘报告全文', reportText: '财富评语', score: 88, overall: 91, dimensions: { a: 1 },
    wealthComment: 'x', paid_plans: { wealth_once: true }, plan: 'wealth_once',
    entitlement: 'vip', reportType: 'once', free_access: '1', houseOverlay: {}, truth: {},
    compatibility: {}, synastry: {}, sections: [], payload: {},
  };
  const out = M.buildFamiliarAdoptPayload(dirty, 'girlfriend');
  assert.deepEqual(Object.keys(out), [...M.FAMILIAR_ADOPT_FIELDS], '输出键集必须恒为六键');
  for (const bad of M.FAMILIAR_FORBIDDEN_FIELDS) {
    assert.ok(!(bad in out), `业务线字段穿透白名单：${bad}`);
  }
  assert.ok(adoptDropsExtras(M), '判据射程：夹带字段必须被剔除');
});

test('D3 洁净度自检：洁净体 true / 多键体 false / 畸形 false', () => {
  assert.equal(M.isCleanFamiliarAdoptPayload(M.buildFamiliarAdoptPayload({ birthDate: 'x' }, 'buddy')), true);
  assert.equal(M.isCleanFamiliarAdoptPayload({ birthDate: 'x', insight: 'y' }), false);
  assert.equal(M.isCleanFamiliarAdoptPayload({ birthDate: 'x' }), false, '缺键 ⇒ 不洁净');
  assert.equal(M.isCleanFamiliarAdoptPayload(null), false);
  assert.equal(M.isCleanFamiliarAdoptPayload([]), false);
});

test('D4 报告尾 CTA 组件：经白名单构造 + 自检 + 单一真源关系卡，且零业务线标识符', () => {
  assert.ok(ADOPT_SRC.includes('buildFamiliarAdoptPayload('), 'CTA 必须经白名单构造（禁手拼请求体）');
  assert.ok(ADOPT_SRC.includes('isCleanFamiliarAdoptPayload('), 'CTA 必须做洁净度自检（fail-closed）');
  assert.ok(ADOPT_SRC.includes('FAMILIAR_ADOPT_PATH'), 'CTA 端点必须取纯核常量（单一真源）');
  assert.ok(/from\s+['"]\.\/FamiliarPicker['"]/.test(ADOPT_SRC), '关系卡必须复用 FamiliarPicker 的 RELATION_CARDS（禁复制四态）');
  assert.ok(ADOPT_SRC.includes('RELATION_CARDS'), '未引用 RELATION_CARDS');
  assert.ok(adoptSourceIsClean(ADOPT_SRC), `CTA 真值区出现业务线标识符：${ADOPT_BANNED.filter((w) => ADOPT_SRC.includes(w)).join(', ')}`);
});

test('D5 报告尾挂载点齐备（财富板 + 合盘板），且既有付费墙漏斗寸步未动', () => {
  assert.ok(WEALTH_SRC.includes('<AdoptFamiliarCTA'), '财富报告页未挂载报告尾 CTA');
  assert.ok(APP_SRC.includes('<AdoptFamiliarCTA'), '合盘画布尾未挂载报告尾 CTA');
  assert.ok(/isUnlocked\s*&&\s*reportData\s*&&\s*hasExplicitBirthCoords\(/.test(WEALTH_SRC),
    '财富板 CTA 必须「解锁后 + URL 显式携带真实坐标」双闸（禁默认盘坐标冒充）');
  assert.ok(WEALTH_SRC.includes('<FamiliarPicker'), '既有付费墙灵宠漏斗被删除');
  assert.ok(/!isUnlocked\s*&&\s*showPaywall/.test(WEALTH_SRC),
    '既有漏斗条件（!isUnlocked && showPaywall）被改动');
  // 坐标真值判定：显式成对 + 值域合法
  assert.equal(M.hasExplicitBirthCoords('?lat=31.2&lon=121.5'), true);
  assert.equal(M.hasExplicitBirthCoords('?lat=31.2'), false);
  assert.equal(M.hasExplicitBirthCoords('?lat=999&lon=0'), false);
  assert.equal(M.hasExplicitBirthCoords('?lat=0&lon=0'), true, '0,0 属合法坐标（本函数只管合法性，不判「是否默认盘」）');
  assert.equal(M.hasExplicitBirthCoords(''), false);
});

/* ═══════════ E 前端接线 ═══════════ */

test('E1 收银台组件契约：testid 常量真值 + 逐个挂载 + 订阅总线 + 双操作点', () => {
  // ① 常量真值（唯一真源 —— 组件引用常量，闸门锁常量值）
  assert.equal(M.SANDBOX_CASHIER_TESTID, 'sandbox-cashier');
  assert.equal(M.SANDBOX_WATERMARK_TESTID, 'sandbox-watermark');
  assert.equal(M.SANDBOX_PAY_BTN_TESTID, 'sandbox-pay-btn');
  assert.equal(M.SANDBOX_CODE_INPUT_TESTID, 'sandbox-voucher-input');
  assert.equal(M.SANDBOX_REDEEM_BTN_TESTID, 'sandbox-redeem-btn');
  assert.equal(M.SANDBOX_STATUS_TESTID, 'sandbox-status');
  assert.equal(M.ADOPT_CTA_TESTID, 'adopt-familiar-cta');
  // ② 组件必须把每个常量**真实挂到** data-testid 上（禁定义了不用）
  for (const c of ['SANDBOX_CASHIER_TESTID', 'SANDBOX_WATERMARK_TESTID', 'SANDBOX_PAY_BTN_TESTID',
    'SANDBOX_CODE_INPUT_TESTID', 'SANDBOX_REDEEM_BTN_TESTID', 'SANDBOX_STATUS_TESTID']) {
    assert.ok(new RegExp(`data-testid=\\{${c}\\}`).test(CASHIER_SRC), `收银台未挂 testid 常量：${c}`);
  }
  assert.ok(new RegExp('data-testid=\\{ADOPT_CTA_TESTID\\}').test(ADOPT_SRC), 'CTA 未挂 adopt-familiar-cta');
  // ③ 行为接线
  assert.ok(CASHIER_SRC.includes('subscribeSandboxCashier('), '收银台未订阅总线（无法被唤起）');
  assert.ok(CASHIER_SRC.includes('getSandboxCashier('), '收银台未读总线初值（首帧可能漏弹）');
  assert.ok(CASHIER_SRC.includes('buildSandboxCompleteRequest('), '缺「一键模拟付款」请求构造');
  assert.ok(CASHIER_SRC.includes('buildSandboxRedeemRequest('), '缺「特权券兑换」请求构造');
  assert.ok(CASHIER_SRC.includes('describeSandboxOutcome('), '结果判定未走纯核（禁自造 granted）');
  assert.ok(!/setMsg\(\s*\{[^}]*granted:\s*true/.test(CASHIER_SRC), '组件内硬编码 granted:true 属伪造');
});

test('E2 【截断铁律】App 支付 helper 走纯核分流，且 sandbox 分支体内零跳转', () => {
  const i = APP_SRC.indexOf('const handlePurchaseWithToken');
  assert.ok(i !== -1, '未找到 handlePurchaseWithToken');
  const seg = APP_SRC.slice(i, i + 2400);
  assert.ok(seg.includes('dispatchCheckoutRoute('), '支付 helper 未走纯核分流');
  assert.ok(seg.includes('window.location.origin'), '未把当前源交给同源核对（绝对沙盘 URL 将无从判真伪）');
  assert.ok(seg.includes("route.kind === 'redirect'"), '缺 redirect 分支');
  assert.ok(seg.includes("route.kind === 'sandbox'"), '缺 sandbox 截断分支');
  // 外跳赋值必须落在 redirect 分支内（先判 redirect，再赋值）
  const iRedirect = seg.indexOf("route.kind === 'redirect'");
  const iHref = seg.indexOf('window.location.href = route.url');
  const iSandbox = seg.indexOf("route.kind === 'sandbox'");
  assert.ok(iHref !== -1, 'redirect 分支内缺外跳赋值');
  assert.ok(iRedirect < iHref, '外跳赋值必须位于 redirect 分支内');
  // 🔴 沙盘分支体内**零跳转**
  const sandboxBody = seg.slice(iSandbox, iSandbox + 280);
  assert.ok(!/location\.(href|assign|replace)\s*=|window\.open\(/.test(sandboxBody), 'sandbox 分支内出现跳转（截断被架空）');
  assert.ok(!seg.includes('window.location.href = data.url'), '裸跳 data.url 形态必须已消除');
  assert.ok(checkoutIsTruncated(APP_SRC), '判据射程：截断形态必须被识别');
});

test('E3 App 根挂载收银台 + /sandbox-pay 同源直达路由', () => {
  assert.ok(APP_SRC.includes('<SandboxCashier'), 'App 未挂载全局收银台');
  assert.ok(APP_SRC.includes('SANDBOX_PAY_PATH'), 'App 未接入 /sandbox-pay 路由');
  assert.ok(APP_SRC.includes('<SandboxPayPage'), 'App 未挂载 /sandbox-pay 页面');
  const PAY_SRC = readSrc('web/src/pages/SandboxPayPage.tsx');
  assert.ok(PAY_SRC.includes('openSandboxCashier('), '直达页未唤起收银台');
  assert.ok(PAY_SRC.includes('decodeSandboxPaySearch('), '直达页未用纯核解析（禁自造解析）');
  assert.ok(PAY_SRC.includes('sandbox-pay-page'), '直达页缺 testid');
});

test('E4 财富报告页：裸跳已消除，走纯核分流且 granted 复用解锁通路', () => {
  assert.ok(WEALTH_SRC.includes('dispatchCheckoutRoute('), '财富页未走纯核分流');
  assert.ok(!WEALTH_SRC.includes('window.location.href = data.url'), '财富页残留裸跳 data.url');
  assert.ok(WEALTH_SRC.includes("route.kind === 'redirect'") && WEALTH_SRC.includes("route.kind === 'sandbox'"),
    '财富页缺 redirect/sandbox 双分支');
  assert.ok(/const applyWealthGrant\s*=\s*\(\)/.test(WEALTH_SRC), '缺共用解锁通路（already_paid 与 granted 必须同源）');
  assert.ok(/applyWealthGrant\(\)/.test(WEALTH_SRC), 'granted 未复用解锁通路');
  assert.ok(checkoutIsTruncated(WEALTH_SRC), '判据射程：财富页截断形态必须被识别');
});

test('E5 字典 sandbox 域齐备（六语 · 归属 labelCard），且组件用键全部在域内', () => {
  const dom = DICT.domains.sandbox;
  assert.ok(dom, '字典缺 sandbox 域');
  assert.ok(Object.keys(dom).length >= 18, `sandbox 域条目不足（实为 ${Object.keys(dom).length}）`);
  for (const k of Object.keys(dom)) {
    for (const lang of LANGS) {
      const v = dom[k][lang];
      assert.equal(typeof v, 'string', `sandbox.${k}.${lang} 缺失`);
      assert.ok(v.trim().length > 0, `sandbox.${k}.${lang} 空值`);
    }
  }
  assert.equal(DICT.slots.assignment.sandbox, 'labelCard', 'sandbox 域槽位归属必须声明');

  // 组件字面量用键 ⇒ 必须存在于域内（防「组件写了字典没登记」的静默空文案）
  const used = [...CASHIER_SRC.matchAll(/\bterm\(\s*'([A-Za-z0-9_]+)'\s*\)/g)].map((m) => m[1]);
  assert.ok(used.length >= 6, `收银台字面量取词过少（实为 ${used.length}）`);
  for (const k of used) assert.ok(dom[k], `收银台取词 ${k} 未登记字典`);
  // 纯核内登记的文案键亦须在域内
  for (const k of ['SandboxGranted', 'SandboxFailed', 'SandboxNoCode', 'SandboxBadCode',
    'SandboxCodeOff', 'SandboxCodeOld', 'SandboxUnsellable']) {
    assert.ok(dom[k], `纯核文案键 ${k} 未登记字典`);
  }
  for (const k of Object.values(M.SANDBOX_PLAN_TERM_KEYS)) {
    assert.ok(dom[k], `SKU 标签键 ${k} 未登记字典`);
  }
  assert.equal(M.planTerm(DICT, 'wealth_once', 'zh').key, 'SandboxPlanWealth');
  assert.equal(M.planTerm(DICT, 'unknown_sku_xyz', 'zh').key, 'SandboxPlanOther', '未知 SKU 必须回落 Other（禁臆造商品名）');
});

test('E6 CTA 取词在 familiar 域齐备（不复用 sandbox 域；语义归属正确）', () => {
  for (const k of ['AdoptTitle', 'AdoptDesc', 'AdoptCta', 'AdoptDone']) {
    assert.ok(DICT.domains.familiar[k], `familiar.${k} 未登记`);
    assert.ok(ADOPT_SRC.includes(`'${k}'`), `CTA 未引用 familiar.${k}`);
    for (const lang of LANGS) assert.ok(DICT.domains.familiar[k][lang].trim().length > 0, `familiar.${k}.${lang} 空`);
  }
  assert.equal(M.dictTerm(DICT, 'familiar', 'AdoptTitle', 'zh').label, DICT.domains.familiar.AdoptTitle.zh);
  assert.equal(M.dictTerm(DICT, 'nope', 'AdoptTitle', 'zh'), null, '缺域必须返回 null（禁机翻兜底）');
  assert.equal(M.dictTerm(DICT, 'familiar', 'NopeKey', 'zh'), null);
});

test('E7 依赖固化：stripe 已钉入 dependencies 且 Dockerfile 不再动态安装', () => {
  assert.equal(PKG.dependencies.stripe, '23.0.0', 'stripe 未钉死版本');
  // 🔴 禁词扫描只扫**真值块**（剔除 Dockerfile 注释 —— 说明文字里必然提到旧写法）
  const docker = readSrc('Dockerfile').replace(/^[ \t]*#.*$/gm, ' ');
  assert.ok(!/npm\s+install[^\n]*\bstripe\b/.test(docker),
    'Dockerfile 仍在动态安装 stripe（无版本 ⇒ 每次构建可能换版本）');
  assert.ok(/^RUN npm install\s*$/m.test(docker), 'Dockerfile 依赖安装段形态变更（须复查锁文件是否被使用）');
  const lock = JSON.parse(readSrc('package-lock.json'));
  assert.equal(lock.packages['node_modules/stripe'].version, '23.0.0', '锁文件未锁定 stripe 版本');
  assert.equal(lock.packages[''].dependencies.stripe, '23.0.0', '锁文件根依赖未登记 stripe');
  // 后端确实动态 import 'stripe'（钉版本的必要性来源）
  assert.ok(/import\('stripe'\)/.test(SERVER_SRC), '后端未使用 stripe 包（依赖钉版失去意义？形态变更须复查）');
});

/* ═══════════ F 段位守备（下界 + 相对位置）═══════════ */

test('F1 段位：Gate 45-B 已入编且居收口位之前（下界 ≥45，iCap === len-2）', () => {
  assert.ok(segs.length >= 45, `段数 ${segs.length} < 45`);
  assert.ok(iCap !== -1, '收口位 e40-compat 缺失');
  assert.equal(iCap, segs.length - 2, '收口位必须紧邻链尾 python');
  const iG45B = segs.findIndex((s) => s.includes('audit-e41plus-gate45b-sandbox-cashier.test.mjs'));
  assert.ok(iG45B !== -1, 'Gate 45-B 未入编 test:astro');
  assert.ok(iG45B < iCap, 'Gate 45-B 必须插在收口位之前');
  const iG45A = segs.findIndex((s) => s.includes('audit-e41plus-gate45-sandbox-payment.test.mjs'));
  assert.ok(iG45A !== -1 && iG45A < iG45B, 'Gate 45-A 必须先于 45-B（后端先行）');
  assert.ok(segs[segs.length - 1].includes('python'), '链尾必须是 python 段');
});

/* ═══════════ G 注入反漂移 ═══════════ */

test('G1 注入：分流无视 sandbox 标记 ⇒ A1 判据必红', async () => {
  const mm = await loadMutated((s) => s.replace('  if (isSandboxResponse(data)) {', '  if (false) {'));
  assert.equal(sandboxRouteIsSandbox(mm), false, 'A1 判据必须能识破「沙盘被当外链跳」');
});

test('G2 注入：同源校验恒真 ⇒ A2 判据必红（钓鱼改道）', async () => {
  const mm = await loadMutated((s) => s
    .replace("    if (url.startsWith('//')) return false; // 协议相对 ⇒ 可指向外域，一律拒\n    return url.split('?')[0] === SANDBOX_PAY_PATH;", '    return true;')
    .replace("  if (co === '') return false;", '  // injected: origin check disabled'));
  assert.equal(rejectsForeignSandboxUrl(mm), false, 'A2 判据必须能识破同源校验被架空');
});

test('G3 注入：白名单改为直通原对象 ⇒ D2 判据必红（业务线字段外泄）', async () => {
  const mm = await loadMutated((s) => s.replace(
    '  const out = {};\n  for (const k of FAMILIAR_ADOPT_FIELDS) out[k] = src[k];\n  return out;',
    '  return src;'));
  assert.equal(adoptDropsExtras(mm), false, 'D2 判据必须能识破「黑名单/直通」式构造');
});

test('G4 注入：支付 helper 去掉 sandbox 截断分支 ⇒ E2 判据必红', () => {
  const bad = APP_SRC.replace("} else if (route.kind === 'sandbox') {", '} else if (false) {');
  assert.notEqual(bad, APP_SRC, 'G4 注入锚点漂移');
  assert.equal(checkoutIsTruncated(bad), false, 'E2 判据必须能识破截断分支被移除');
});

test('G5 注入：CTA 真值区夹带业务线字段 ⇒ D4 判据必红', () => {
  const bad = ADOPT_SRC + "\nconst _leak = { insight: 'x', reportText: 'y', paid_plans: {} };\n";
  assert.equal(adoptSourceIsClean(bad), false, 'D4 判据必须能识破业务线字段夹带');
});

test('G6 注入：判据射程自证（主测与注入同源取用，禁射程断层）', () => {
  assert.ok(sandboxRouteIsSandbox(M), 'G1 判据射程失效');
  assert.ok(rejectsForeignSandboxUrl(M), 'G2 判据射程失效');
  assert.ok(adoptDropsExtras(M), 'G3 判据射程失效');
  assert.ok(checkoutIsTruncated(APP_SRC) && checkoutIsTruncated(WEALTH_SRC), 'G4 判据射程失效');
  assert.ok(adoptSourceIsClean(ADOPT_SRC), 'G5 判据射程失效');
});
