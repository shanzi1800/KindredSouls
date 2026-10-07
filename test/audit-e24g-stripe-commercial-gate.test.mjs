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

// ── 从 server.js 抽取 4 个纯函数（含其依赖的时间助手）──
function extractServerPureFns(src) {
  const picks = [
    'function computeNextMonthStartUTC()',
    'function computeOneYearLaterUTC()',
    'function buildPlanPayload(plan)',
    'function planHasAccess(plans, target, now)',
    'function wealthIsGreenChannel(body)',
    'function wealthEntitledByType(plans, reportType, now)',
  ];
  let code = '';
  // 测试白名单常量也是「单一真源」的一部分，必须一并抽取（否则闸门读不到值）
  const testBirthdateConst = src.match(/const WEALTH_TEST_BIRTHDATE = '[^']*';/);
  assert.ok(testBirthdateConst, 'server.js 缺少 WEALTH_TEST_BIRTHDATE 常量定义');
  code += testBirthdateConst[0] + '\n';
  for (const p of picks) {
    const idx = src.indexOf(p);
    assert.ok(idx !== -1, `server.js 缺少纯函数「${p}」—— 单一真源被删/改名，闸门无法取证`);
    const body = sliceBalanced(src, idx);
    assert.ok(body && body.length > 10, `抽不出「${p}」函数体`);
    code += src.slice(idx, idx + p.length) + ' ' + body + '\n';
  }
  const names = ['buildPlanPayload', 'planHasAccess', 'wealthIsGreenChannel', 'wealthEntitledByType'];
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
  assert.equal(star.star_monthly_compatibility_allowance, 1);
  assert.ok(!isNaN(new Date(star.star_monthly_resets_at).getTime()), '月卡重置时间必须是合法时间戳');

  const ap = FNS.buildPlanPayload('all_pass_yearly');
  assert.equal(ap.all_pass_yearly, true);
  assert.ok(!isNaN(new Date(ap.all_pass_expires_at).getTime()), '全通年卡必须写过期时间');
  assert.ok(new Date(ap.all_pass_expires_at) > new Date(), '过期时间必须晚于当前（+1 年）');
});

test('A3 planHasAccess: 防重付判定（同档命中 / 年卡覆盖 / 过期失效 / 跨档不串）', () => {
  assert.equal(FNS.planHasAccess({ wealth_monthly_report: true }, 'wealth_monthly_report', NOW), true, '同档已购应拦下');
  assert.equal(FNS.planHasAccess({ all_pass_yearly: true, all_pass_expires_at: FUTURE }, 'wealth_yearly_report', NOW), true, '年卡有效期内应覆盖年报');
  assert.equal(FNS.planHasAccess({ all_pass_yearly: true, all_pass_expires_at: PAST }, 'wealth_yearly_report', NOW), false, '年卡过期不得再覆盖');
  assert.equal(FNS.planHasAccess({ star_monthly_vip: true, star_monthly_wealth_used: 0, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, 'wealth_once', NOW), true, '月卡有余量应覆盖单次');
  assert.equal(FNS.planHasAccess({ star_monthly_vip: true, star_monthly_wealth_used: 5, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, 'wealth_once', NOW), false, '月卡余量用尽不得再覆盖');
  // 🔴 营收红线：$2.99 月报不得覆盖 $29.99 年报（反之亦然）
  assert.equal(FNS.planHasAccess({ wealth_monthly_report: true }, 'wealth_yearly_report', NOW), false, '月报档不得白拿年报');
  assert.equal(FNS.planHasAccess({ wealth_yearly_report: true }, 'wealth_monthly_report', NOW), false, '年报档不得白拿月报');
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

test('A5 wealthEntitledByType: 按产物分档矩阵（后端真源）', () => {
  const cases = [
    // [plans, once, monthly, yearly]
    [{}, false, false, false],
    [{ wealth_once: true }, true, false, false],
    [{ wealth_monthly_report: true }, false, true, false],
    [{ wealth_yearly_report: true }, false, false, true],
    [{ all_pass_yearly: true, all_pass_expires_at: FUTURE }, true, true, true],
    [{ all_pass_yearly: true, all_pass_expires_at: PAST }, false, false, false],
    [{ star_monthly_vip: true, star_monthly_wealth_used: 1, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, true, true, false],
    [{ star_monthly_vip: true, star_monthly_wealth_used: 5, star_monthly_wealth_allowance: 5, star_monthly_resets_at: FUTURE }, false, false, false],
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
  const cacheHitMarker = '    // ═══ 第一道拦截:Cache Hit ═══';
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
