/**
 * 🛍️ E24⑥ 商业闭环上架闸门（audit-e24g-stripe-commercial-gate）
 *
 * 病根（2026-10-07 军师开工令）：
 *   付费三件套（webhook 落库权益 / create-checkout 防重付 / 生成端点权益校验）
 *   只存在于**已废弃的 Vercel 函数** web/api/*.js；Railway 生产 server.js 里
 *   webhook 仅 `console.log` ⇒ 即便 Stripe 后台把回调指向本域，paid_plans 也写不进去；
 *   create-checkout 无 already_paid ⇒ 重复扣款；端点零权益校验 ⇒ 付费闸门纯前端。
 *
 * 本闸门两路取证：
 *   A. **行为级**：从 server.js / WealthReportPage.tsx 源码中抽取真实纯函数跑矩阵，
 *      实现与断言同源（不是字面量 grep —— 改逻辑必转红）。
 *   B. **结构级**：webhook 三要素（读 metadata / 合并 / PATCH+INSERT）、闸门位置
 *      （非流式必须在 Cache Hit **之前**；流式必须在 SSE header **之前**）、
 *      前端四处请求体绿道标记、按钮分档门控。
 *   C. **注入自测**：对源码做定向破坏（删 already_paid / 改闸门次序 / 摘 free_access /
 *      把年报按钮认成月报档）⇒ 对应判据必须报红。不做注入自测的闸门 = 零防线。
 *
 * 运行：node --test test/audit-e24g-stripe-commercial-gate.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SERVER_SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const PAGE_SRC = fs.readFileSync(path.join(ROOT, 'web/src/pages/WealthReportPage.tsx'), 'utf8');

// ── 工具：按花括号配平抽取源码片段 ──
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

// ── 从 server.js 抽取纯函数真源（含其依赖的时间助手 / 护栏内核）──
function extractServerPureFns(src) {
  const picks = [
    'function computeNextMonthStartUTC()',
    'function computeOneYearLaterUTC()',
    'function buildPlanPayload(plan)',
    'function planHasAccess(plans, target, now)',
    'function wealthIsGreenChannel(body)',
    'function wealthEntitledByType(plans, reportType, now)',
    'function requiredPlanFor(reportType)',
    // 🛍️ E24⑥② 算力护栏内核（周期死锁 / 每日熔断 / 配额递增 / 缓存分层）
    'function _mkDate(v)',
    'function startOfUTCMonth(d)',
    'function startOfNextUTCMonth(d)',
    'function startOfUTCDay(d)',
    'function startOfNextUTCDay(d)',
    'function sameUTCDay(a, b)',
    'function _daysInUTCMonth(year, month1)',
    'function solarReturnCycle(userBirthDate, now)',
    'function wealthPeriodLock(plans, reportType, userBirthDate, now)',
    'function wealthDailyRateLimit(plans, now)',
    'function starMonthlyQuotaRoll(plans, now)',
    'function wealthCounterDelta(plans, reportType, method, now, opts)',
    'function wealthSharedCacheSince(now)',
    'function wealthPeriodCacheSince(reportType, userBirthDate, now)',
    // 合婚域（与财富域对称）
    'function compatibilityEntitledByType(plans, reportType, now)',
    'function requiredPlanForCompat(reportType)',
    'function compatibilityPeriodLock(plans, reportType, userBirthDate, now)',
    'function compatibilityDailyRateLimit(plans, now)',
    'function compatibilityCounterDelta(plans, reportType, method, now, opts)',
  ];
  let code = '';
  // 数值常量也是「单一真源」的一部分，必须一并抽取（否则闸门读不到阈值）
  for (const re of [
    /const WEALTH_TEST_BIRTHDATE = '[^']*';/,
    /const WEALTH_DAILY_LIMIT = \d+;/,
    /const WEALTH_SHARED_CACHE_TTL_HOURS = \d+;/,
  ]) {
    const m = src.match(re);
    assert.ok(m, `server.js 缺少常量定义 ${re} —— 单一真源被删/改名，闸门无法取证`);
    code += m[0] + '\n';
  }
  for (const p of picks) {
    const idx = src.indexOf(p);
    assert.ok(idx !== -1, `server.js 缺少纯函数「${p}」—— 单一真源被删/改名，闸门无法取证`);
    const body = sliceBalanced(src, idx);
    assert.ok(body && body.length > 10, `抽不出「${p}」函数体`);
    code += src.slice(idx, idx + p.length) + ' ' + body + '\n';
  }
  const names = [
    'buildPlanPayload', 'planHasAccess', 'wealthIsGreenChannel', 'wealthEntitledByType', 'requiredPlanFor',
    'solarReturnCycle', 'wealthPeriodLock', 'wealthDailyRateLimit', 'starMonthlyQuotaRoll', 'wealthCounterDelta',
    'wealthSharedCacheSince', 'wealthPeriodCacheSince',
    'compatibilityEntitledByType', 'requiredPlanForCompat', 'compatibilityPeriodLock',
    'compatibilityDailyRateLimit', 'compatibilityCounterDelta',
  ];
  const make = new Function(`${code}\nreturn { ${names.join(', ')} };`);
  return make();
}

// ── 从 WealthReportPage.tsx 抽取前端分档函数（剥外层花括号，免类型剥离）──
function extractFrontendEntitlement(src) {
  const marker = 'export const wealthEntitledFor';
  const idx = src.indexOf(marker);
  assert.ok(idx !== -1, '前端缺少 wealthEntitledFor（按钮分档门控的单一真源）');
  const arrow = src.indexOf('=>', idx);
  const body = sliceBalanced(src, arrow);
  assert.ok(body && body.startsWith('{'), '抽不出 wealthEntitledFor 函数体');
  const inner = body.slice(1, -1);
  return new Function('type', 'paidPlans', 'freeAccess', inner);
}

const FNS = extractServerPureFns(SERVER_SRC);
const feEntitled = extractFrontendEntitlement(PAGE_SRC);

const DAY = 24 * 3600 * 1000;
const NOW = new Date('2026-10-07T02:00:00Z');
const FUTURE = new Date(NOW.getTime() + 30 * DAY).toISOString();
const PAST = new Date(NOW.getTime() - 30 * DAY).toISOString();

// ═══════════════════════════════════════════════════════════
// A. 行为级：paid_plans 片段构造
// ═══════════════════════════════════════════════════════════
test('A1 buildPlanPayload: 六档单次/月报/年报逐档对齐 Vercel 语义', () => {
  const expect = [
    ['compatibility_once', { compatibility_once: true }],
    ['wealth_once', { wealth_once: true }],
    ['compatibility_monthly_report', { compatibility_monthly_report: true }],
    ['wealth_monthly_report', { wealth_monthly_report: true }],
    ['compatibility_yearly_report', { compatibility_yearly_report: true }],
    ['wealth_yearly_report', { wealth_yearly_report: true }],
  ];
  for (const [plan, want] of expect) {
    assert.deepEqual(FNS.buildPlanPayload(plan), want, `plan=${plan} 片段不符`);
  }
});

test('A2 buildPlanPayload: 月卡/全通年卡必须带配额字段与重置/过期时间', () => {
  const star = FNS.buildPlanPayload('star_monthly_vip');
  assert.equal(star.star_monthly_vip, true);
  assert.equal(star.star_monthly_wealth_allowance, 5);
  assert.equal(star.star_monthly_wealth_used, 0);
  // 🛍️ E24⑥② 军师裁决 2：合婚配额与财富**完全对称**（5 次/月；线上 Vercel 时代落库值即为 5）
  assert.equal(star.star_monthly_compatibility_allowance, 5, '合婚月卡配额必须为 5（与财富对称）');
  assert.ok(!isNaN(new Date(star.star_monthly_resets_at).getTime()), '月卡重置时间必须是合法时间戳');

  const ap = FNS.buildPlanPayload('all_pass_yearly');
  assert.equal(ap.all_pass_yearly, true);
  assert.ok(!isNaN(new Date(ap.all_pass_expires_at).getTime()), '全通年卡必须写过期时间');
  assert.ok(new Date(ap.all_pass_expires_at) > new Date(), '过期时间必须晚于当前（+1 年）');
  // 🛍️ E24⑥②：年卡同样双轨对称（财富/合婚皆 5 次/月）
  assert.equal(ap.star_monthly_wealth_allowance, 5);
  assert.equal(ap.star_monthly_compatibility_allowance, 5, '年卡合婚配额也必须为 5（双轨合龙）');
});

test('A3 planHasAccess: 防重付判定（同档命中 / 年卡覆盖 / 过期失效 / 跨档不串 / 月卡不含 once）', () => {
  assert.equal(FNS.planHasAccess({ wealth_monthly_report: true }, 'wealth_monthly_report', NOW), true, '同档已购应拦下');
  assert.equal(FNS.planHasAccess({ all_pass_yearly: true, all_pass_expires_at: FUTURE }, 'wealth_yearly_report', NOW), true, '年卡有效期内应覆盖年报');
  assert.equal(FNS.planHasAccess({ all_pass_yearly: true, all_pass_expires_at: PAST }, 'wealth_yearly_report', NOW), false, '年卡过期不得再覆盖');
  // 🔴 军师裁决 1：月卡**绝不**覆盖 $4.99 先天报告（once 是永久落库资产，须单买或年卡）
  assert.equal(FNS.planHasAccess({ star_monthly_vip: true, star_monthly_wealth_used: 0, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, 'wealth_once', NOW), false, '月卡不得覆盖 once（$9.99 不能白拿 $4.99）');
  assert.equal(FNS.planHasAccess({ star_monthly_vip: true, star_monthly_wealth_used: 0, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, 'wealth_monthly_report', NOW), true, '月卡有余量应覆盖月报');
  assert.equal(FNS.planHasAccess({ star_monthly_vip: true, star_monthly_wealth_used: 0, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, 'wealth_yearly_report', NOW), true, '月卡有余量应覆盖年报（圣经 §2.1：年报免费生成 1 次）');
  assert.equal(FNS.planHasAccess({ star_monthly_vip: true, star_monthly_wealth_used: 5, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, 'wealth_monthly_report', NOW), false, '月卡余量用尽不得再覆盖');
  // 🔴 营收红线：$2.99 月报不得覆盖 $29.99 年报（反之亦然）
  assert.equal(FNS.planHasAccess({ wealth_monthly_report: true }, 'wealth_yearly_report', NOW), false, '月报档不得白拿年报');
  assert.equal(FNS.planHasAccess({ wealth_yearly_report: true }, 'wealth_monthly_report', NOW), false, '年报档不得白拿月报');
  // 合婚双轨对称
  assert.equal(FNS.planHasAccess({ star_monthly_vip: true, star_monthly_compatibility_used: 0, star_monthly_compatibility_allowance: 5 }, 'compatibility_monthly_report', NOW), true, '月卡应覆盖合婚月报');
  assert.equal(FNS.planHasAccess({ star_monthly_vip: true, star_monthly_compatibility_used: 0, star_monthly_compatibility_allowance: 5 }, 'compatibility_once', NOW), false, '月卡不得覆盖合婚 once');
});

test('A4 wealthIsGreenChannel: 绿色通道只认 free_access=1 与测试生日，形近值一律不认', () => {
  assert.equal(FNS.wealthIsGreenChannel({ free_access: 1 }), true);
  assert.equal(FNS.wealthIsGreenChannel({ free_access: true }), true);
  assert.equal(FNS.wealthIsGreenChannel({ freeAccess: 1 }), true);
  assert.equal(FNS.wealthIsGreenChannel({ birthDate: '1990-06-15' }), true, 'Vercel 时代测试生日白名单必须保留');
  assert.equal(FNS.wealthIsGreenChannel({ free_access: 0 }), false);
  assert.equal(FNS.wealthIsGreenChannel({ free_access: '1' }), false, '字符串 "1" 非白名单（严格 === ）');
  assert.equal(FNS.wealthIsGreenChannel({ free_access: 2 }), false);
  assert.equal(FNS.wealthIsGreenChannel({ birthDate: '1990-06-16' }), false, '测试生日不得模糊命中');
  assert.equal(FNS.wealthIsGreenChannel({}), false);
  assert.equal(FNS.wealthIsGreenChannel(null), false, '空 body 必须安全');
});

test('A5 wealthEntitledByType: 按产物分档矩阵（后端真源；月卡不含 once、含 yearly）', () => {
  const cases = [
    // [plans, once, monthly, yearly]
    [{}, false, false, false],
    [{ wealth_once: true }, true, false, false],
    [{ wealth_monthly_report: true }, false, true, false],
    [{ wealth_yearly_report: true }, false, false, true],
    [{ all_pass_yearly: true, all_pass_expires_at: FUTURE }, true, true, true],
    [{ all_pass_yearly: true, all_pass_expires_at: PAST }, false, false, false],
    // 🛍️ E24⑥② 军师裁决 1：月卡 = 月报 + 年报（各 1 次/周期），**绝不含 once**
    [{ star_monthly_vip: true, star_monthly_wealth_used: 1, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, false, true, true],
    [{ star_monthly_vip: true, star_monthly_wealth_used: 5, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, false, false, false],
    // 月卡 resets_at 已过期（Stripe 续订事件后端不处理）⇒ 不得整体失效，仅配额归零由 starMonthlyQuotaRoll 处理
    [{ star_monthly_vip: true, star_monthly_wealth_used: 0, star_monthly_wealth_allowance: 5, star_monthly_resets_at: PAST }, false, true, true],
  ];
  for (const [plans, once, monthly, yearly] of cases) {
    const label = JSON.stringify(plans);
    assert.equal(!!FNS.wealthEntitledByType(plans, 'once', NOW), once, `once @ ${label}`);
    assert.equal(!!FNS.wealthEntitledByType(plans, 'monthly', NOW), monthly, `monthly @ ${label}`);
    assert.equal(!!FNS.wealthEntitledByType(plans, 'yearly', NOW), yearly, `yearly @ ${label}`);
  }
  // 未知类型不得误放行
  assert.equal(FNS.wealthEntitledByType({ wealth_once: true }, 'oracle', NOW), null, '免费预告类型不受门禁');
});

test('A5b compatibilityEntitledByType: 合婚域与财富域**完全对称**', () => {
  const cases = [
    [{}, false, false, false],
    [{ compatibility_once: true }, true, false, false],
    [{ compatibility_monthly_report: true }, false, true, false],
    [{ compatibility_yearly_report: true }, false, false, true],
    [{ all_pass_yearly: true, all_pass_expires_at: FUTURE }, true, true, true],
    [{ star_monthly_vip: true, star_monthly_compatibility_used: 1, star_monthly_compatibility_allowance: 5 }, false, true, true],
    [{ star_monthly_vip: true, star_monthly_compatibility_used: 5, star_monthly_compatibility_allowance: 5 }, false, false, false],
  ];
  for (const [plans, once, monthly, yearly] of cases) {
    const label = JSON.stringify(plans);
    assert.equal(!!FNS.compatibilityEntitledByType(plans, 'once', NOW), once, `compat once @ ${label}`);
    assert.equal(!!FNS.compatibilityEntitledByType(plans, 'monthly', NOW), monthly, `compat monthly @ ${label}`);
    assert.equal(!!FNS.compatibilityEntitledByType(plans, 'yearly', NOW), yearly, `compat yearly @ ${label}`);
  }
  assert.equal(FNS.requiredPlanForCompat('yearly'), 'compatibility_yearly_report');
  assert.equal(FNS.requiredPlanForCompat('monthly'), 'compatibility_monthly_report');
  assert.equal(FNS.requiredPlanForCompat('once'), 'compatibility_once');
});

test('A6 前后端分档**同源一致性**：同一 paid_plans 矩阵两侧判定必须一致', () => {
  const matrix = [
    {},
    { wealth_once: true },
    { wealth_monthly_report: true },
    { wealth_yearly_report: true },
    { all_pass_yearly: true, all_pass_expires_at: FUTURE },
    { all_pass_yearly: true, all_pass_expires_at: PAST },
    { star_monthly_vip: true, star_monthly_wealth_used: 0, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE },
    { star_monthly_vip: true, star_monthly_wealth_used: 9, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE },
  ];
  // 前端用真实 Date.now()，此矩阵的过期/重置时间以「当前」为基准生成，避免时间漂移误报
  const nowMs = Date.now();
  const fut = new Date(nowMs + 30 * DAY).toISOString();
  const past = new Date(nowMs - 30 * DAY).toISOString();
  const m2 = matrix.map(p => {
    const q = { ...p };
    if ('all_pass_expires_at' in q) q.all_pass_expires_at = q.all_pass_expires_at === FUTURE ? fut : past;
    if ('star_monthly_resets_at' in q) q.star_monthly_resets_at = fut;
    return q;
  });
  for (const plans of m2) {
    for (const t of ['once', 'monthly', 'yearly']) {
      const back = !!FNS.wealthEntitledByType(plans, t, new Date());
      const front = !!feEntitled(t, plans, false);
      assert.equal(front, back, `分档漂移 @ type=${t} plans=${JSON.stringify(plans)}（前端=${front} 后端=${back}）`);
    }
  }
  // 绿色通道：前端必须全放行（与后端 free_access 同语义）
  assert.equal(feEntitled('yearly', {}, true), true, '前端绿色通道应放行全部档位');
});

test('A7 requiredPlanFor: 402 引导必须按产物出档（年报不得引导去买月报）', () => {
  assert.equal(FNS.requiredPlanFor('yearly'), 'wealth_yearly_report', '年报请求应引导购买年报档');
  assert.equal(FNS.requiredPlanFor('monthly'), 'wealth_monthly_report');
  assert.equal(FNS.requiredPlanFor('once'), 'wealth_once');
  // 缺省/未知产物回落月报档（免费预告 reportType='oracle' 不受门禁，取默认即可）
  assert.equal(FNS.requiredPlanFor('oracle'), 'wealth_monthly_report');
  assert.equal(FNS.requiredPlanFor(undefined), 'wealth_monthly_report');
  // 引导档必须真实存在于 SKU 表（防止写出不存在的档位）
  const mapBlock = SERVER_SRC.match(/const STRIPE_PRICE_MAP = \{[\s\S]*?\n\};/);
  assert.ok(mapBlock, 'server.js 缺少 STRIPE_PRICE_MAP');
  for (const t of ['yearly', 'monthly', 'once']) {
    const sku = FNS.requiredPlanFor(t);
    assert.ok(mapBlock[0].includes(`${sku}:`), `引导档 ${sku} 不在 STRIPE_PRICE_MAP 中 ⇒ 用户点了也买不到`);
  }
});

// ═══════════════════════════════════════════════════════════
// A8~A13 🛡️ E24⑥② 算力护栏内核（周期死锁 / Solar Return / 每日熔断 / 配额递增 / 缓存分层）
// ═══════════════════════════════════════════════════════════
test('A8 solarReturnCycle: 以主账户生日月-日为唯一轴心，跨生日边界正确换周期', () => {
  // 生日 6-15；2026-10-07 时点 ⇒ 周期 = 2026-06-15 → 2027-06-15
  const a = FNS.solarReturnCycle('1990-06-15', new Date('2026-10-07T02:00:00Z'));
  assert.equal(a.ok, true);
  assert.equal(a.cycleStart.toISOString(), '2026-06-15T00:00:00.000Z');
  assert.equal(a.cycleEnd.toISOString(), '2027-06-15T00:00:00.000Z');
  // 生日之前（2026-05-01）⇒ 仍处于上一周期
  const b = FNS.solarReturnCycle('1990-06-15', new Date('2026-05-01T02:00:00Z'));
  assert.equal(b.cycleStart.toISOString(), '2025-06-15T00:00:00.000Z');
  assert.equal(b.cycleEnd.toISOString(), '2026-06-15T00:00:00.000Z');
  // 生日当天即进入新周期（>= 语义）
  const c = FNS.solarReturnCycle('1990-06-15', new Date('2026-06-15T00:00:00Z'));
  assert.equal(c.cycleStart.toISOString(), '2026-06-15T00:00:00.000Z');
  // 🔴 圣经 §4：只吃 userBirthDate（主账户生日）⇒ 换测算对象不改周期
  // 2-29 生日在非闰年必须钳到月末，绝不造非法日期
  const d = FNS.solarReturnCycle('2000-02-29', new Date('2027-03-01T00:00:00Z'));
  assert.equal(d.ok, true);
  assert.equal(d.cycleStart.toISOString(), '2027-02-28T00:00:00.000Z', '2-29 在非闰年应钳到 2-28');
  // 无生日 / 非法 ⇒ 弃权（ok:false）而非误锁
  assert.equal(FNS.solarReturnCycle(null, NOW).ok, false);
  assert.equal(FNS.solarReturnCycle('not-a-date', NOW).ok, false);
  assert.equal(FNS.solarReturnCycle('1990-13-40', NOW).ok, false);
});

test('A9 wealthPeriodLock: 月报自然月 1 次 / 年报 Solar Return 周期 1 次（🔴 年卡不豁免）', () => {
  const now = new Date('2026-10-07T02:00:00Z');
  assert.equal(FNS.wealthPeriodLock({ monthly_wealth_report_generated_at: '2026-10-02T00:00:00Z' }, 'monthly', '1990-06-15', now).locked, true, '同月已生成必须锁');
  assert.equal(FNS.wealthPeriodLock({ monthly_wealth_report_generated_at: '2026-09-30T00:00:00Z' }, 'monthly', '1990-06-15', now).locked, false, '上月生成不得锁本月');
  const lk = FNS.wealthPeriodLock({ monthly_wealth_report_generated_at: '2026-10-02T00:00:00Z' }, 'monthly', '1990-06-15', now);
  assert.equal(lk.nextAvailable, '2026-11-01T00:00:00.000Z', '月报解锁时间必须是次月 1 日 00:00Z');
  assert.equal(FNS.wealthPeriodLock({ yearly_wealth_report_generated_at: '2026-08-01T00:00:00Z' }, 'yearly', '1990-06-15', now).locked, true, '本 Solar Return 周期已生成必须锁');
  assert.equal(FNS.wealthPeriodLock({ yearly_wealth_report_generated_at: '2026-03-01T00:00:00Z' }, 'yearly', '1990-06-15', now).locked, false, '上一周期生成不得锁本周期');
  // 🔴 军师裁决 3：年卡**不豁免**周期死锁（判定只吃时间戳，不看 all_pass_yearly）
  assert.equal(FNS.wealthPeriodLock({ all_pass_yearly: true, all_pass_expires_at: FUTURE, monthly_wealth_report_generated_at: '2026-10-02T00:00:00Z' }, 'monthly', '1990-06-15', now).locked, true, '年卡用户同样必须被周期死锁约束');
  assert.equal(FNS.wealthPeriodLock({ yearly_wealth_report_generated_at: '2026-08-01T00:00:00Z' }, 'yearly', null, now).locked, false, '无生日锚应弃权（不误锁）');
  assert.equal(FNS.wealthPeriodLock({ monthly_wealth_report_generated_at: '2026-10-02T00:00:00Z' }, 'once', '1990-06-15', now).locked, false, 'once 无周期限制（永久缓存）');
});

test('A10 wealthDailyRateLimit: 每日 10 次熔断（第 11 次起锁）且 once 用户天然豁免', () => {
  const now = new Date('2026-10-07T02:00:00Z');
  const today = '2026-10-07T00:00:00.000Z';
  assert.equal(FNS.wealthDailyRateLimit({ daily_wealth_call_count: 9, daily_wealth_call_resets_at: today }, now).limited, false, '第 10 次调用前不得锁');
  assert.equal(FNS.wealthDailyRateLimit({ daily_wealth_call_count: 10, daily_wealth_call_resets_at: today }, now).limited, true, '第 11 次必须锁');
  assert.equal(FNS.wealthDailyRateLimit({ daily_wealth_call_count: 99, daily_wealth_call_resets_at: '2026-10-06T00:00:00.000Z' }, now).limited, false, '非当日计数必须清零（跨日重置）');
  assert.equal(FNS.wealthDailyRateLimit({ wealth_once: true, daily_wealth_call_count: 99, daily_wealth_call_resets_at: today }, now).limited, false, 'once 用户走永久缓存=0 次 AI ⇒ 豁免');
  assert.equal(FNS.wealthDailyRateLimit({ daily_wealth_call_count: 10, daily_wealth_call_resets_at: today }, now).resetsAt, '2026-10-08T00:00:00.000Z', '429 必须给出次日 00:00Z 解锁时间');
  // 合婚域同构
  assert.equal(FNS.compatibilityDailyRateLimit({ daily_ai_call_count: 10, daily_ai_call_resets_at: today }, now).limited, true);
  assert.equal(FNS.compatibilityDailyRateLimit({ compatibility_once: true, daily_ai_call_count: 10, daily_ai_call_resets_at: today }, now).limited, false);
});

test('A11 wealthCounterDelta / starMonthlyQuotaRoll: 配额递增 + 自然月归零 + 时间戳', () => {
  const now = new Date('2026-10-07T02:00:00Z');
  const today = '2026-10-07T00:00:00.000Z';
  // 月卡配额：同月内 +1
  const d1 = FNS.wealthCounterDelta({ star_monthly_wealth_used: 2, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, 'monthly', 'star_monthly_vip', now, { withTimestamp: false });
  assert.equal(d1.star_monthly_wealth_used, 3, '月卡配额必须 +1（消费扣减）');
  assert.equal(d1.daily_wealth_call_count, 1, '当日首次必须置 1（跨日重置）');
  assert.equal(d1.daily_wealth_call_resets_at, today);
  // 跨自然月 ⇒ 先归零再 +1（否则次月永久 402）
  const d2 = FNS.wealthCounterDelta({ star_monthly_wealth_used: 5, star_monthly_wealth_allowance: 5, star_monthly_resets_at: PAST }, 'monthly', 'star_monthly_vip', now, { withTimestamp: false });
  assert.equal(d2.star_monthly_wealth_used, 1, '跨月必须归零后再扣');
  assert.ok(new Date(d2.star_monthly_resets_at) > now, '归零同时必须把 resets_at 前移到下月');
  // 非月卡方法不得触碰月卡配额键
  const d3 = FNS.wealthCounterDelta({ wealth_monthly_report: true }, 'monthly', 'wealth_monthly_report', now, { withTimestamp: false });
  assert.equal('star_monthly_wealth_used' in d3, false, '非月卡不得触碰月卡配额键');
  // 时间戳只在生成成功后写
  assert.equal(FNS.wealthCounterDelta({}, 'monthly', 'wealth_monthly_report', now, { withDaily: false, withQuota: false }).monthly_wealth_report_generated_at, now.toISOString());
  assert.equal(FNS.wealthCounterDelta({}, 'yearly', 'wealth_yearly_report', now, { withDaily: false, withQuota: false }).yearly_wealth_report_generated_at, now.toISOString());
  // 合婚域：独立计数键，绝不污染财富域
  const d6 = FNS.compatibilityCounterDelta({ star_monthly_compatibility_used: 1, star_monthly_resets_at: FUTURE }, 'monthly', 'star_monthly_vip', now, { withTimestamp: false });
  assert.equal(d6.star_monthly_compatibility_used, 2);
  assert.equal(d6.daily_ai_call_count, 1);
  assert.equal('daily_wealth_call_count' in d6, false, '合婚域不得污染财富域计数键');
  assert.equal('star_monthly_wealth_used' in d6, false, '合婚域不得污染财富域配额键');
});

test('A12 缓存分层：Tier A 共享 24h；Tier B 本周期（once = 永久）', () => {
  const now = new Date('2026-10-07T02:00:00Z');
  assert.equal(FNS.wealthSharedCacheSince(now), '2026-10-06T02:00:00.000Z', 'Tier A 必须是 24h 前');
  assert.equal(FNS.wealthPeriodCacheSince('once', '1990-06-15', now), null, 'once = 永久（不加时间过滤）');
  assert.equal(FNS.wealthPeriodCacheSince('monthly', '1990-06-15', now), '2026-10-01T00:00:00.000Z', 'monthly = 本自然月起点');
  assert.equal(FNS.wealthPeriodCacheSince('yearly', '1990-06-15', now), '2026-06-15T00:00:00.000Z', 'yearly = 本 Solar Return 周期起点');
});

test('A13 compatibilityPeriodLock: 合婚域周期死锁复用财富域周期数学（仅时间戳字段映射）', () => {
  const now = new Date('2026-10-07T02:00:00Z');
  assert.equal(FNS.compatibilityPeriodLock({ compatibility_monthly_report_generated_at: '2026-10-03T00:00:00Z' }, 'monthly', '1990-06-15', now).locked, true);
  assert.equal(FNS.compatibilityPeriodLock({ compatibility_yearly_report_generated_at: '2026-08-03T00:00:00Z' }, 'yearly', '1990-06-15', now).locked, true);
  assert.equal(FNS.compatibilityPeriodLock({ compatibility_monthly_report_generated_at: '2026-09-03T00:00:00Z' }, 'monthly', '1990-06-15', now).locked, false);
});

// ═══════════════════════════════════════════════════════════
// B. 结构级：三件套落位与闸门次序
// ═══════════════════════════════════════════════════════════
function checkStructure(serverSrc, pageSrc) {
  const fails = [];
  const need = (cond, msg) => { if (!cond) fails.push(msg); };

  // ── B1 webhook：读 metadata → 合并现有权益 → PATCH 优先 + INSERT 兜底 ──
  const hookIdx = serverSrc.indexOf("app.post('/api/webhook'");
  need(hookIdx !== -1, 'B1a: /api/webhook 路由缺失');
  const hookSeg = hookIdx === -1 ? '' : serverSrc.slice(hookIdx, hookIdx + 9000);
  need(hookSeg.includes('metadata.supabase_user_id') || hookSeg.includes('metadata && session.metadata.supabase_user_id'), 'B1b: webhook 未读取 metadata.supabase_user_id ⇒ 权益无从归属');
  need(/session\.metadata\s*&&\s*session\.metadata\.plan/.test(hookSeg) || hookSeg.includes('metadata.plan'), 'B1c: webhook 未读取 metadata.plan');
  need(hookSeg.includes('buildPlanPayload('), 'B1d: webhook 未调用 buildPlanPayload 构造权益片段');
  need(/Object\.assign\(\{\},\s*currentPlans/.test(hookSeg) || /\{\s*\.\.\.currentPlans/.test(hookSeg) || hookSeg.includes('...currentPlans'), 'B1e: webhook 未与现有权益合并（有覆盖无关字段风险）');
  need(hookSeg.includes('paid_plans: updatedPlans'), 'B1f: webhook 未写入 paid_plans ⇒ 付了钱也不解锁');
  need(/method:\s*'PATCH'/.test(hookSeg), 'B1g: webhook 缺 PATCH 写入');
  need(/method:\s*'POST'/.test(hookSeg), 'B1h: webhook 缺 INSERT 兜底（行不存在时）');
  need(hookSeg.includes('express.raw'), 'B1i: webhook 必须用 express.raw 保持原始 body 供验签');

  // ── B1j~l 验签 fail-closed（🔴 P0 营收洞）：配了密钥 ⇒ 必须验签，缺签名一律 400 ──
  //   反例形态：`if (webhookSecret && stripeSig) {...} else { JSON.parse(body) }`
  //   ⇒ 只要不带 stripe-signature 头，就绕过验签直接吃伪造 JSON 写权益（白拿 VIP）。
  need(/if\s*\(\s*webhookSecret\s*\)/.test(hookSeg),
    'B1j: webhook 验签必须为「已配置密钥即强制校验」的 if (webhookSecret) 形态');
  need(hookSeg.includes('Missing stripe-signature'),
    'B1k: 配了密钥却缺 stripe-signature 时必须 400 拒绝（否则可伪造 JSON 白拿权益）');
  need(!/webhookSecret\s*&&\s*stripeSig/.test(hookSeg),
    'B1l: 禁止 `webhookSecret && stripeSig` 形态 —— 密钥在但无签名会走 else 分支跳过验签（fail-open 漏洞）');

  // ── B1m~n 原始 body 保全（🔴 P0）：全局 body-parser 不得抢在 webhook 之前解析 ──
  //   若全局 `app.use(express.json())` 先跑，req.body 变 object，路由内 express.raw
  //   因 req._body 已置位而跳过 ⇒ constructEvent 必抛错 ⇒ **真实回调全部 400、权益永不落库**。
  need(/split\('\?'\)\[0\]\s*===\s*'\/api\/webhook'/.test(serverSrc)
    || serverSrc.includes("=== '/api/webhook') return next()"),
    'B1m: 全局 JSON 解析必须对 /api/webhook 豁免（否则原始 body 被吞，真实回调验签必失败、权益永不落库）');
  need(!/^\s*app\.use\(express\.json\(/m.test(serverSrc),
    'B1n: 不得存在裸的全局 app.use(express.json(...)) —— 它会先于 webhook 路由吞掉原始 body');

  // ── B2 create-checkout：登录校验 + 防重付 + metadata ──
  const coIdx = serverSrc.indexOf("app.post('/api/create-checkout'");
  need(coIdx !== -1, 'B2a: /api/create-checkout 路由缺失');
  const coSeg = coIdx === -1 ? '' : serverSrc.slice(coIdx, coIdx + 9000);
  need(coSeg.includes("status(401)"), 'B2b: create-checkout 缺未登录 401');
  need(/res\.status\(200\)\.json\(\{\s*already_paid:\s*true/.test(coSeg), 'B2c: create-checkout 缺 already_paid **JSON 返回**（防重付；仅日志文案不算）');
  need(coSeg.includes('planHasAccess('), 'B2d: create-checkout 未调用 planHasAccess 判定已购');
  need(/metadata:\s*\{\s*supabase_user_id:\s*userId,\s*plan\s*\}/.test(coSeg) || (coSeg.includes('metadata:') && coSeg.includes('supabase_user_id: userId') && coSeg.includes('plan,')), 'B2e: 建会话缺 metadata（webhook 的唯一钥匙）⇒ 必须补 { supabase_user_id, plan }');

  // ── B3 端点闸门 + 次序（非流式必须先于 Cache Hit；流式必须先于 SSE header）──
  const nonStreamIdx = serverSrc.indexOf("app.post('/api/wealth-oracle',");
  const streamIdx = serverSrc.indexOf("app.post('/api/wealth-oracle/stream'");
  need(nonStreamIdx !== -1 && streamIdx !== -1, 'B3a: 两个生成端点必须存在');
  const gateTag = 'WEALTH_PAID_REPORT_TYPES.has(reportType)';
  const g1 = serverSrc.indexOf(gateTag);
  const g2 = serverSrc.indexOf(gateTag, g1 + 1);
  need(g1 !== -1 && g2 !== -1, 'B3b: 权益闸门必须**两处**（非流式 + 流式），当前命中 ' + (g1 === -1 ? 0 : g2 === -1 ? 1 : 2) + ' 处');
  if (g1 !== -1 && nonStreamIdx !== -1 && streamIdx !== -1) {
    const nonStreamGate = serverSrc.indexOf(gateTag, nonStreamIdx);
    const cacheHit = serverSrc.indexOf('第一道拦截:Cache Hit', nonStreamIdx);
    need(nonStreamGate !== -1 && cacheHit !== -1 && nonStreamGate < cacheHit,
      'B3c: 非流式闸门必须早于 Cache Hit（否则无权益者可读走缓存里的付费正文）');
    const streamGate = serverSrc.indexOf(gateTag, streamIdx);
    const sseHeader = serverSrc.indexOf("res.setHeader('Content-Type', 'text/event-stream", streamIdx);
    need(streamGate !== -1 && sseHeader !== -1 && streamGate < sseHeader,
      'B3d: 流式闸门必须早于 SSE header（否则 402 会被塞进 200 管道里=假绿）');
    need(serverSrc.slice(streamGate, streamGate + 2500).includes("status(402)"), 'B3e: 流式闸门缺 402 JSON 返回');
    need(serverSrc.slice(nonStreamGate, nonStreamGate + 2500).includes("status(402)"), 'B3f: 非流式闸门缺 402 JSON 返回');
  }
  need(serverSrc.includes("ENTITLEMENT_REQUIRED"), 'B3g: 402 必须带 code=ENTITLEMENT_REQUIRED（前端靠它分流）');
  need(serverSrc.includes('wealthIsGreenChannel(body)') || serverSrc.includes('wealthIsGreenChannel(req.body)'), 'B3h: 绿色通道判定必须接入权益解析');
  const rpCount = (serverSrc.match(/requiredPlan:\s*requiredPlanFor\(reportType\)/g) || []).length;
  need(rpCount === 2, `B3i: 两处 402 的 requiredPlan 必须同源 requiredPlanFor(reportType)，实为 ${rpCount} 处`);
  need(!/requiredPlan:\s*'wealth_monthly_report'/.test(serverSrc), 'B3j: 禁止把 requiredPlan 硬编成月报档（年报用户会被误导买错档，付完仍打不开）');

  // ── B4 前端：四处请求体带绿道标记 + 流式带 Authorization + 按钮分档 ──
  const freeCount = (pageSrc.match(/free_access:\s*isGreenChannelRef\.current\s*\?\s*1\s*:\s*0/g) || []).length;
  need(freeCount === 4, `B4a: 前端请求体绿道标记须恰 4 处（loadWealthData/流式主请求/流式 fallback/旧非流式），实为 ${freeCount}`);
  need(pageSrc.includes("fetch('/api/wealth-oracle/stream'"), 'B4b: 流式主请求缺失');
  const streamFetchIdx = pageSrc.indexOf("fetch('/api/wealth-oracle/stream'");
  const streamSeg = pageSrc.slice(streamFetchIdx, streamFetchIdx + 900);
  need(streamSeg.includes('Authorization'), 'B4c: 流式主请求必须携带 Authorization（端点权益闸门靠它换 paid_plans）');
  need(pageSrc.includes("wealthEntitledFor('monthly', paidPlans"), 'B4d: 月报按钮未走分档门控');
  need(pageSrc.includes("wealthEntitledFor('yearly', paidPlans"), 'B4e: 年报按钮未走分档门控');
  need(!pageSrc.includes("paidPlans?.all_pass_yearly === true || new URLSearchParams"), 'B4f: 旧「仅认 all_pass_yearly」的按钮门控残留 ⇒ 单买月报/年报的用户没有生成入口');
  need(pageSrc.includes("res.status === 402"), 'B4g: 前端未处理流式 402（会把引导付费误报成「生成失败」）');

  // ── B8 金丝雀：剥注释不得吞掉代码（源级判据的公共地基）──
  //   实战教训（2026-10-07）：在注释里写 `web/api/*.js` 会留下 `/*`，
  //   而 V483/V490 系源级闸门是**先剥 `/* */` 再剥 `//`** ⇒ 该 `/*` 会与其后某个
  //   真实 `*/` 配对，静默吞掉中间 54KB 代码，导致 7 个源级判据集体假红
  //   （astroCalls 4→2、财富缓存键 3→2）。故此处用**同一条正则**做地基自检：
  //   剥注释后关键路由/函数锚点必须全部存活。
  //   ⚠️ 判据钉锚点存活，而非「注释里禁止出现 /*」（后者会误伤既有的无害形态）。
  const _stripped = serverSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const _anchors = [
    "app.get('/api/health'",
    "app.post('/api/create-checkout'",
    "app.post('/api/webhook'",
    "app.post('/api/wealth-oracle',",
    "app.post('/api/wealth-oracle/stream'",
    'function buildWealthMetaFull(',
    'function wealthEntitledByType(',
  ];
  for (const a of _anchors) {
    need(_stripped.includes(a),
      `B8a: 剥注释后锚点「${a}」消失 ⇒ 某处行注释含未配平 \`/*\`，把后续代码吞成注释（V483/V490 系闸门会集体假红）`);
  }

  // ── B9 v2 端点（**第三个**财富生成端点）权益闸门 + 护栏 ──
  //   病根：E24⑥ 的两道闸门只覆盖 /api/wealth-oracle 与 /stream ⇒ 任何人可直接打 v2 绕过付费墙烧 AI。
  const v2Idx = serverSrc.indexOf("app.post('/api/wealth-oracle/v2'");
  need(v2Idx !== -1, 'B9a: /api/wealth-oracle/v2 路由缺失');
  if (v2Idx !== -1) {
    const v2Gate = serverSrc.indexOf("resolveWealthEntitlement(req, 'yearly')", v2Idx);
    const v2Sse = serverSrc.indexOf("res.setHeader('Content-Type', 'text/event-stream')", v2Idx);
    need(v2Gate !== -1, 'B9b: v2 缺权益闸门（付费墙旁路 ⇒ 任何人可直烧 AI）');
    need(v2Gate !== -1 && v2Sse !== -1 && v2Gate < v2Sse, 'B9c: v2 闸门必须早于 SSE header（否则 402 被塞进 200 管道=假绿）');
    const v2Seg = v2Gate === -1 ? '' : serverSrc.slice(v2Gate, v2Gate + 3000);
    need(v2Seg.includes('status(402)'), 'B9d: v2 闸门缺 402 JSON 返回');
    need(v2Seg.includes('wealthPeriodLock('), 'B9e: v2 未接入周期死锁护栏');
    need(v2Seg.includes('wealthDailyRateLimit('), 'B9f: v2 未接入每日熔断护栏');
  }

  // ── B10 合婚端点（/api/ai-advisor）鉴权 + 权益 + 配额 ──
  //   病根：承载合婚月报/年报生成，却零鉴权、零权益、零配额 ⇒ 匿名 POST 直烧 AI token。
  const advIdx = serverSrc.indexOf("app.use('/api/ai-advisor'");
  need(advIdx !== -1, 'B10a: /api/ai-advisor 路由缺失');
  if (advIdx !== -1) {
    const advSeg = serverSrc.slice(advIdx, advIdx + 7000);
    need(advSeg.includes("resolveReportEntitlement(req, 'compatibility'"), 'B10b: 合婚端点缺 compatibility 域权益解析（匿名可烧 AI）');
    need(advSeg.includes('compatibilityPeriodLock('), 'B10c: 合婚端点缺周期死锁护栏');
    need(advSeg.includes('compatibilityDailyRateLimit('), 'B10d: 合婚端点缺每日熔断护栏');
    need(advSeg.includes('compatibilityCounterDelta('), 'B10e: 合婚端点缺配额递增落库');
    const entIdx = advSeg.indexOf("resolveReportEntitlement(req, 'compatibility'");
    const caiIdx = advSeg.indexOf('await callAI(');
    need(entIdx !== -1 && caiIdx !== -1 && entIdx < caiIdx, 'B10f: 合婚权益闸门必须早于 callAI（否则 AI 已烧完才拦）');
  }

  // ── B11 护栏次序铁律：必须在 Cache Hit **之后**（圣经 §2.1「期内反复查看走缓存」不得被 403 拦下）──
  const nsIdx = serverSrc.indexOf("app.post('/api/wealth-oracle',");
  const nsHit = serverSrc.indexOf('第一道拦截:Cache Hit', nsIdx);
  const nsLock = serverSrc.indexOf('wealthPeriodLock(_guardPlans', nsIdx);
  need(nsHit !== -1 && nsLock !== -1 && nsHit < nsLock,
    'B11a: 非流式周期死锁必须在 Cache Hit 之后（否则付了钱的用户期内重复查看会被 403 拦下）');
  const stIdx = serverSrc.indexOf("app.post('/api/wealth-oracle/stream'");
  const stHit = serverSrc.indexOf('第一道拦截:Cache Hit', stIdx);
  const stGuard = serverSrc.indexOf('_sendGuardFrame = (code, extra) =>', stIdx);
  const stLock = serverSrc.indexOf('wealthPeriodLock(_streamGuardPlans', stIdx);
  need(stHit !== -1 && stGuard !== -1 && stLock !== -1 && stHit < stGuard && stGuard < stLock,
    'B11b: 流式护栏必须在 Cache Hit 之后，且以 SSE 错误帧（_sendGuardFrame）下发 —— 该处管道已是 200，回 JSON 状态码即假绿');
  need(serverSrc.slice(stGuard, stGuard + 1800).includes('wealthGuardBody('),
    'B11c: 流式错误帧必须复用财富域文案真源 wealthGuardBody（否则前后端文案漂移）');

  // ── B12 缓存分层：两个主端点 HIT 必须双层（Tier A 共享 24h + Tier B 本周期）──
  const tierA = (serverSrc.match(/wealthSharedCacheSince\(new Date\(\)\)/g) || []).length;
  // ⚠️ 判据必须钉**调用点**（含 new Date()），不可只写 wealthPeriodCacheSince(reportType
  //   —— 函数**定义**同样匹配该前缀，会把 2 个调用点误数成 3（本闸门初版即踩此坑）。
  const tierB = (serverSrc.match(/wealthPeriodCacheSince\(reportType,[^\n]*new Date\(\)\)/g) || []).length;
  need(tierA === 2, `B12a: Tier A（共享 24h）必须两处端点各一，实为 ${tierA}`);
  need(tierB === 2, `B12b: Tier B（本人报告周期）必须两处端点各一，实为 ${tierB}`);

  // ── B13 前端：护栏错误码映射 + 流式帧按 code 本地化 ──
  need(pageSrc.includes('DAILY_WEALTH_RATE_LIMIT_EXCEEDED'), 'B13a: 前端未映射每日熔断错误码（会退化成英文原文/「生成失败」）');
  need(/MONTHLY_WEALTH_REPORT_QUOTA_EXHAUSTED:\s*'wealthReport\./.test(pageSrc), 'B13b: 前端未映射周期死锁错误码');
  need(pageSrc.includes('parsed.code'), 'B13c: 流式错误帧未读 code（护栏 403/429 会退化成后端中文原文）');

  return fails;
}

test('B7 结构级三件套落位（真实源码必须 0 失败）', () => {
  const fails = checkStructure(SERVER_SRC, PAGE_SRC);
  assert.deepEqual(fails, [], '结构级判据失败:\n' + fails.join('\n'));
});

// ═══════════════════════════════════════════════════════════
// C. 注入自测：定向破坏 ⇒ 判据必须报红（不做 = 零防线）
// ═══════════════════════════════════════════════════════════
test('C1 注入：删掉 create-checkout 的 already_paid ⇒ B2c 必须报红', () => {
  const broken = SERVER_SRC.replace("return res.status(200).json({ already_paid: true, message: 'Already subscribed' });", '// 注入:删防重付');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B2c')), '删 already_paid 未报红 ⇒ 判据失效。fails=' + JSON.stringify(fails));
});

test('C2 注入：webhook 去掉 paid_plans 写入 ⇒ B1f 必须报红', () => {
  const broken = SERVER_SRC.replace(/\bpaid_plans:\s*updatedPlans,/g, '/* 注入:摘掉落库字段 */');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B1f')), '摘掉 paid_plans 未报红。fails=' + JSON.stringify(fails));
});

test('C3 注入：webhook 改为整体覆盖（不再合并）⇒ B1e 必须报红', () => {
  const broken = SERVER_SRC.replace('Object.assign({}, currentPlans, buildPlanPayload(plan))', 'buildPlanPayload(plan)');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B1e')), '取消合并未报红。fails=' + JSON.stringify(fails));
});

test('C4 注入：闸门被挪到 Cache Hit 之后 ⇒ B3c 必须报红（次序判据）', () => {
  // 实现：把「Cache Hit」标记搬到非流式闸门**之前**（等价于闸门后置），
  //   因为闸门块原本紧贴标记，直接搬块是空操作（曾踩坑：moved=false ⇒ 判据看似失效）。
  const cacheHitMarker = '    // ═══ 第一道拦截:Cache Hit（🛍️ E24⑥② 分层：Tier A 共享 24h → Tier B 本人报告周期）═══';
  const nonStreamIdx = SERVER_SRC.indexOf("app.post('/api/wealth-oracle',");
  const gateIdx = SERVER_SRC.indexOf('WEALTH_PAID_REPORT_TYPES.has(reportType)', nonStreamIdx);
  assert.ok(gateIdx !== -1, '找不到非流式闸门锚点');
  let broken = SERVER_SRC.replace(cacheHitMarker, ''); // 摘掉真实标记
  // 标记重插到闸门所在行之前 ⇒ 首个标记位 < 闸门位
  const gateIdx2 = broken.indexOf('WEALTH_PAID_REPORT_TYPES.has(reportType)', broken.indexOf("app.post('/api/wealth-oracle',"));
  const lineStart = broken.lastIndexOf('\n', gateIdx2) + 1;
  broken = broken.slice(0, lineStart) + cacheHitMarker + '\n' + broken.slice(lineStart);
  assert.notEqual(broken, SERVER_SRC, '注入未生效（标记/锚点被改？）');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B3c')), '闸门次序倒置未报红。fails=' + JSON.stringify(fails));
});

test('C5 注入：前端年报按钮改成认月报档 ⇒ B6/A6 判定必须报红', () => {
  const broken = PAGE_SRC.replace("wealthEntitledFor('yearly', paidPlans", "wealthEntitledFor('monthly', paidPlans");
  const fails = checkStructure(SERVER_SRC, broken);
  assert.ok(fails.some(f => f.startsWith('B4e')), '年报按钮错档未报红。fails=' + JSON.stringify(fails));
});

test('C6 注入：摘掉前端一处请求体绿道标记 ⇒ B4a 必须报红', () => {
  const broken = PAGE_SRC.replace("          free_access: isGreenChannelRef.current ? 1 : 0, // 🛍️ E24⑥: 绿色通道标记(后端权益闸门放行)\n", '');
  assert.notEqual(broken, PAGE_SRC, '注入锚点未命中（注释被改？）—— 请同步更新注入锚点');
  const fails = checkStructure(SERVER_SRC, broken);
  assert.ok(fails.some(f => f.startsWith('B4a')), '绿道标记缺失未报红。fails=' + JSON.stringify(fails));
});

test('C8 注入：注释里塞未配平 `/*`（复刻 api/*.js 事故）⇒ B8a 金丝雀必须报红', () => {
  // 复刻真实事故：行注释写下 `web/api/*.js`，其 `/*` 会吞掉后续代码
  const broken = SERVER_SRC.replace('// ── Stripe Price ID 映射表 ──', '// ── 见 web/api/*.js 与 Stripe Price ID 映射表 ──');
  assert.notEqual(broken, SERVER_SRC, '注入锚点未命中（注释被改？请同步更新注入锚点）');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B8a')), '剥注释吞代码事故未被金丝雀拦下。fails=' + JSON.stringify(fails));
});

test('C9 注入：验签退回 fail-open（密钥在但缺签名时跳过）⇒ B1j/B1l 必须报红', () => {
  // 复刻真实漏洞形态：把 `if (webhookSecret)` 退化成 `if (webhookSecret && stripeSig)`
  const broken = SERVER_SRC.replace('if (webhookSecret) {', 'if (webhookSecret && stripeSig) {');
  assert.notEqual(broken, SERVER_SRC, '注入锚点未命中（验签分支被改？请同步更新注入锚点）');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B1j') || f.startsWith('B1l')),
    'fail-open 验签回归未被拦下 ⇒ 判据失效。fails=' + JSON.stringify(fails));
});

test('C10 注入：全局 body-parser 抢在 webhook 前解析 ⇒ B1n 必须报红', () => {
  // 复刻真实缺陷形态：恢复裸的全局 app.use(express.json(...))
  const broken = SERVER_SRC.replace(
    "const _globalJsonParser = express.json({ limit: '10mb' });",
    "app.use(express.json({ limit: '10mb' }));\nconst _globalJsonParser = express.json({ limit: '10mb' });"
  );
  assert.notEqual(broken, SERVER_SRC, '注入锚点未命中（全局解析器写法被改？请同步更新注入锚点）');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B1n')),
    '全局 body-parser 抢先解析未被拦下 ⇒ 真实回调会 400。fails=' + JSON.stringify(fails));
});

test('C11 注入：把 402 的 requiredPlan 硬编成月报档 ⇒ B3i/B3j 必须报红', () => {
  const broken = SERVER_SRC.replace(
    "requiredPlan: requiredPlanFor(reportType),",
    "requiredPlan: 'wealth_monthly_report',"
  );
  assert.notEqual(broken, SERVER_SRC, '注入锚点未命中（402 返回体被改？请同步更新注入锚点）');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B3i') || f.startsWith('B3j')),
    'hardcode 档位回归未被拦下 ⇒ 判据失效。fails=' + JSON.stringify(fails));
});

test('C7 注入：后端分档为「任一档放行」（营收漏洞回归）⇒ A5 必须报红', () => {
  const brokenFn = `function wealthEntitledByType(plans, reportType, now) {
    const p = plans || {};
    if (p.wealth_once === true || p.wealth_monthly_report === true || p.wealth_yearly_report === true) return 'any';
    return null;
  }`;
  const broken = SERVER_SRC.replace(/function wealthEntitledByType\(plans, reportType, now\) \{[\s\S]*?\n\}/, brokenFn);
  assert.notEqual(broken, SERVER_SRC, '注入未生效');
  const fns = extractServerPureFns(broken);
  // 宽判 ⇒ $4.99 用户可白拿年报：yearly 必须被判为「无权益」才正确
  const leaked = fns.wealthEntitledByType({ wealth_once: true }, 'yearly', NOW);
  assert.ok(leaked, '注入后的宽判应确实放行年报（用于证明判据有效）');
  assert.throws(() => {
    assert.equal(!!fns.wealthEntitledByType({ wealth_once: true }, 'yearly', NOW), false, '宽判漏洞必须被 A5 拦下');
  }, /宽判漏洞必须被 A5 拦下/);
});

// ═══════════════════════════════════════════════════════════
// C12~C17 注入自测（E24⑥② 新增判据必须全部有牙）
// ═══════════════════════════════════════════════════════════
const GUARD_NOW = new Date('2026-10-07T02:00:00Z');
const GUARD_TODAY = '2026-10-07T00:00:00.000Z';

test('C12 注入：月卡配额覆盖 once（$9.99 白拿 $4.99 回归）⇒ A5 必须报红', () => {
  const broken = SERVER_SRC.replace(
    "    if (p.wealth_once === true) return 'wealth_once';",
    "    if (p.wealth_once === true || starQuotaOk) return 'wealth_once';"
  );
  assert.notEqual(broken, SERVER_SRC, '注入锚点未命中（once 分支被改？请同步更新锚点）');
  const fns = extractServerPureFns(broken);
  const plans = { star_monthly_vip: true, star_monthly_wealth_used: 0, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE };
  assert.equal(!!fns.wealthEntitledByType(plans, 'once', NOW), true, '注入必须确实放行 once（证明判据有牙）');
  assert.throws(() => {
    assert.equal(!!fns.wealthEntitledByType(plans, 'once', NOW), false, '月卡不得覆盖 once');
  }, /月卡不得覆盖 once/);
});

test('C13 注入：年卡豁免周期死锁 ⇒ A9 必须报红', () => {
  const broken = SERVER_SRC.replace(
    'function wealthPeriodLock(plans, reportType, userBirthDate, now) {',
    'function wealthPeriodLock(plans, reportType, userBirthDate, now) {\n  if ((plans || {}).all_pass_yearly === true) return { locked: false, nextAvailable: null };'
  );
  assert.notEqual(broken, SERVER_SRC, '注入锚点未命中（wealthPeriodLock 签名被改？）');
  const fns = extractServerPureFns(broken);
  const plans = { all_pass_yearly: true, all_pass_expires_at: FUTURE, monthly_wealth_report_generated_at: '2026-10-02T00:00:00Z' };
  assert.equal(fns.wealthPeriodLock(plans, 'monthly', '1990-06-15', GUARD_NOW).locked, false, '注入必须确实豁免年卡（证明判据有牙）');
  assert.throws(() => {
    assert.equal(fns.wealthPeriodLock(plans, 'monthly', '1990-06-15', GUARD_NOW).locked, true, '年卡不得豁免周期死锁');
  }, /年卡不得豁免周期死锁/);
});

test('C14 注入：每日熔断阈值被拉高（护栏失效）⇒ A10 必须报红', () => {
  const broken = SERVER_SRC.replace('const WEALTH_DAILY_LIMIT = 10;', 'const WEALTH_DAILY_LIMIT = 1000000000;');
  assert.notEqual(broken, SERVER_SRC, '注入锚点未命中（WEALTH_DAILY_LIMIT 被改？）');
  const fns = extractServerPureFns(broken);
  const plans = { daily_wealth_call_count: 10, daily_wealth_call_resets_at: GUARD_TODAY };
  assert.equal(fns.wealthDailyRateLimit(plans, GUARD_NOW).limited, false, '注入后第 11 次不再受限（证明判据有牙）');
  assert.throws(() => {
    assert.equal(fns.wealthDailyRateLimit(plans, GUARD_NOW).limited, true, '第 11 次必须锁');
  }, /第 11 次必须锁/);
});

test('C15 注入：月卡配额跨月不归零（次月永久 402）⇒ A11 必须报红', () => {
  const broken = SERVER_SRC.replace(
    'function starMonthlyQuotaRoll(plans, now) {',
    'function starMonthlyQuotaRoll(plans, now) {\n  return { rolled: false, delta: {} };'
  );
  assert.notEqual(broken, SERVER_SRC, '注入锚点未命中（starMonthlyQuotaRoll 被改？）');
  const fns = extractServerPureFns(broken);
  const plans = { star_monthly_wealth_used: 5, star_monthly_wealth_allowance: 5, star_monthly_resets_at: PAST };
  const d = fns.wealthCounterDelta(plans, 'monthly', 'star_monthly_vip', GUARD_NOW, { withTimestamp: false });
  assert.equal(d.star_monthly_wealth_used, 6, '注入后跨月不归零（证明判据有牙）');
  assert.throws(() => {
    assert.equal(d.star_monthly_wealth_used, 1, '跨月必须归零后再扣');
  }, /跨月必须归零后再扣/);
});

test('C16 注入：摘掉 v2 权益闸门（付费墙旁路回归）⇒ B9b 必须报红', () => {
  const broken = SERVER_SRC.replace(
    "const _v2Ent = await resolveWealthEntitlement(req, 'yearly');",
    "const _v2Ent = { ok: true, method: 'green_channel' };"
  );
  assert.notEqual(broken, SERVER_SRC, '注入锚点未命中（v2 闸门被改？请同步更新锚点）');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B9b')), 'v2 闸门缺失未报红 ⇒ 付费墙旁路回归。fails=' + JSON.stringify(fails));
});

test('C17 注入：合婚闸门挪到 callAI 之后（先烧后拦）⇒ B10f 必须报红', () => {
  const advIdx = SERVER_SRC.indexOf("app.use('/api/ai-advisor'");
  assert.ok(advIdx !== -1, '找不到合婚端点');
  const seg = SERVER_SRC.slice(advIdx, advIdx + 7000);
  const rel = seg.indexOf('await callAI(');
  assert.ok(rel !== -1, '找不到合婚端点内的 callAI 锚点');
  const abs = advIdx + rel;
  const broken = SERVER_SRC.slice(0, abs) + 'await __DISABLED_CALLAI__(' + SERVER_SRC.slice(abs + 'await callAI('.length);
  assert.notEqual(broken, SERVER_SRC, '注入未生效');
  const fails = checkStructure(broken, PAGE_SRC);
  assert.ok(fails.some(f => f.startsWith('B10f')), '合婚闸门次序倒置未报红。fails=' + JSON.stringify(fails));
});

test('C18 注入：前端摘掉护栏错误码映射与流内 code 解析 ⇒ B13 必须报红', () => {
  const broken = PAGE_SRC
    .replace('DAILY_WEALTH_RATE_LIMIT_EXCEEDED: ', 'DAILY_WEALTH_RATE_LIMIT_DISABLED: ')
    .replace("const _gcode = parsed.code || '';", "const _gcode = '';");
  assert.notEqual(broken, PAGE_SRC, '注入锚点未命中（前端错误码映射被改？请同步更新锚点）');
  const fails = checkStructure(SERVER_SRC, broken);
  assert.ok(fails.some(f => f.startsWith('B13')), '前端错误码映射缺失未报红。fails=' + JSON.stringify(fails));
});
