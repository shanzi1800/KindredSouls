#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E99（主公军令 2026-10-28）：拔除 $4.99 强制登录拦截、全量锁定
//    沙盘模拟付款链路（内测「零阻力沙盘模式」）
//   ① 服务端权益闸门 NO_TOKEN 沙盒豁免——sandbox_anonymous 放行
//      （绿道同构：userId=null ⇒ Gate41 MISS、落库/计数/时间戳全守卫跳过；
//       INVALID_TOKEN 不豁免——陈旧凭证绝不放行；live fail-closed 逐字不变）
//   ② /api/sandbox/complete 无 Bearer 匿名回执——本地签发语义
//      （无 userId ⇒ 无权益可落库 ⇒ granted:true 纯回执；带 token 链逐字不变）
//   ③ 前端 handlePurchase 沙盒直通——未登录绝不弹 AuthWall，三档统一
//      openSandboxCashier（/api/sandbox/status 探测；探测失败/非沙盒 ⇒
//      旧 OAuth 登录墙链逐字保留 fail-safe）
//   ④ generateReport 无 token 沙盒直发——沙盒态匿名调 /api/ai-advisor
//      （服务端 ① 豁免接管；非沙盒 ⇒ 旧 'No session' throw 语义不变）
//   ⑤ 军令军规耦合面：三档 onGranted 落 per-session 临时权益标志
//      （once=ks_compat_session_unlocked / 月=ks_paid_report_type=monthly /
//       年=yearly）＋ ResultPage 付讫分诊自动生成链与登录态解耦
// 判据口径：源级断言（锚点逐字取真源码）＋行为级 VM 实跑（沙盒豁免分支）。
// ═══════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const APP = fs.readFileSync(path.join(ROOT, 'web/src/App.tsx'), 'utf8');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/* ═══════════════════ ① 服务端权益闸门沙盒豁免 ═══════════════════ */

test('E99-①-1 resolveReportEntitlement NO_TOKEN 沙盒豁免存在（sandbox_anonymous）', () => {
  assert.ok(SERVER.includes("if (isSandboxPaymentMode(process.env)) {\n      console.log('[E99] sandbox mode => compat entitlement anonymous bypass (no token, type=' + reportType + ')');"), '沙盒匿名豁免分支缺失');
  assert.ok(SERVER.includes("return { ok: true, method: 'sandbox_anonymous' };"), 'sandbox_anonymous 回执缺失');
});

test('E99-①-2 行为级：NO_TOKEN 沙盒态放行 / live 态闭合（VM 实跑豁免分支）', async () => {
  // VM 抽取 resolveReportEntitlement 全函数体（花括号配平）
  const i = SERVER.indexOf('async function resolveReportEntitlement(req, domain, reportType) {');
  assert.ok(i !== -1, 'resolveReportEntitlement 函数缺失');
  let depth = 0, started = false, end = -1;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) { end = j; break; } }
  }
  assert.ok(end !== -1, 'fn body unbalanced');
  const body = SERVER.slice(i, end + 1);
  // 剥离 await（NO_TOKEN 短路路径零副作用，可同步模拟）；词法作用域注入外部符号 stub
  const resolveWealthEntitlement = async () => ({ ok: true });
  const wealthGreenChannelAuthorized = () => false;
  const isSandboxPaymentMode = (env) => !!(env && env.PAYMENT_MODE === 'sandbox');
  const safeFetch = async () => ({ ok: true, json: async () => ({ id: 'u1', paid_plans: {} }) });
  const fn = eval('(' + body.replace(/await /g, '') + ')');
  const savedSbUrl = process.env.SUPABASE_URL, savedSbKey = process.env.SUPABASE_SERVICE_KEY, savedMode = process.env.PAYMENT_MODE;
  try {
    process.env.SUPABASE_URL = 'x';
    process.env.SUPABASE_SERVICE_KEY = 'y';
    const sbReq = { headers: {} };
    // NO_TOKEN + 沙盒 ⇒ 放行（E99 军令核心判据）
    process.env.PAYMENT_MODE = 'sandbox';
    const r1 = await fn(sbReq, 'compatibility', 'once');
    assert.strictEqual(r1.ok, true, '沙盒态 NO_TOKEN 必须放行（零阻力军令）');
    assert.strictEqual(r1.method, 'sandbox_anonymous', '放行方法名必须是 sandbox_anonymous');
    assert.strictEqual(r1.userId, undefined, '匿名放行不得携带 userId（绿道同构，落库全守卫跳过）');
    // NO_TOKEN + live ⇒ 旧 fail-closed 语义逐字不变
    process.env.PAYMENT_MODE = 'live';
    const r2 = await fn(sbReq, 'compatibility', 'once');
    assert.strictEqual(r2.ok, false, 'live 态 NO_TOKEN 必须 fail-closed（商业铁律不动）');
    assert.strictEqual(r2.reason, 'NO_TOKEN', 'live 态旧 reason 语义必须保持');
  } finally {
    process.env.SUPABASE_URL = savedSbUrl;
    process.env.SUPABASE_SERVICE_KEY = savedSbKey;
    if (savedMode === undefined) delete process.env.PAYMENT_MODE; else process.env.PAYMENT_MODE = savedMode;
  }
});

/* ═══════════════════ ② sandbox/complete 匿名回执 ═══════════════════ */

test('E99-②-1 /api/sandbox/complete 无 Bearer 匿名本地签发回执', () => {
  // 匿名旁路必须位于 _sandboxResolveUser 之前（无 token 短路，不触用户解析）
  const anonAnchor = "const _e99Hdr = String(req.headers.authorization || '');";
  const ai = SERVER.indexOf(anonAnchor);
  assert.ok(ai !== -1, 'sandbox/complete 匿名探测缺失');
  const resolveI = SERVER.indexOf('app.post(\'/api/sandbox/complete\'');
  const resolveUserI = SERVER.indexOf('const who = await _sandboxResolveUser(req);', resolveI);
  assert.ok(resolveUserI > ai && ai > resolveI, '匿名旁路必须先于用户解析（短路语义）');
  // 匿名回执：granted:true + anonymous:true（本地签发语义——军令原文）
  assert.ok(SERVER.includes('return res.json({ ok: true, sandbox: true, anonymous: true, plan: planAnon, sessionId: null, granted: true, webhook: { received: true, anonymous: true } });'), '匿名 granted 回执缺失');
  // 匿名分支仍守 Unknown plan 400（闸门纪律不旁路）
  assert.ok(SERVER.includes('if (!STRIPE_PRICE_MAP[planAnon]) return res.status(400).json({ error: \'Unknown plan: \' + rawPlanAnon });'), '匿名分支 Unknown plan 守卫缺失');
});

/* ═══════════════════ ③ 前端 handlePurchase 沙盒直通 ═══════════════════ */

test('E99-③-1 handlePurchase 未登录沙盒直通（绝不弹 AuthWall）', () => {
  // 沙盒探测（免 token 端点）
  assert.ok(APP.includes("fetch('/api/sandbox/status', { method: 'POST' })"), '沙盒态探测缺失');
  assert.ok(APP.includes("if (st && st.sandbox === true) {"), '沙盒态判定缺失');
  // 直通沙盘收银台（E88 空 sessionId 唤起同款合法性）
  assert.ok(APP.includes("console.log('[KindredSouls] 🧪 E99 sandbox zero-friction — cashier opened anonymously:', plan);"), '沙盒直通日志缺失');
});

test('E99-③-2 live/探测失败 ⇒ 旧登录墙链逐字保留（fail-safe）', () => {
  // 旧链四件套收敛在 _e99LegacyWall（OAuth 意图链 E72 铁律不动）
  assert.ok(APP.includes('const _e99LegacyWall = () => {'), '旧登录墙收敛函数缺失');
  assert.ok(APP.includes("localStorage.setItem('ks_pending_checkout_plan', plan);"), 'OAuth 意图存储缺失（E72）');
  assert.ok(APP.includes('setShowAuthWall(true);'), '登录墙上屏缺失（live 模式）');
  // 探测失败回退旧链（绝不静默失败）
  assert.ok(APP.includes('.catch(() => {\n            // 探测失败 ⇒ fail-safe 回退旧登录墙链（绝不静默失败）\n            _e99LegacyWall();'), '探测失败回退缺失');
});

test('E99-③-3 三档 onGranted 落 per-session 临时权益（本地签发军令原文）', () => {
  // once ⇒ per-session 解锁（E85-① 语义复用）
  assert.ok(APP.includes("if (plan === 'compatibility_once') sessionStorage.setItem('ks_compat_session_unlocked', '1');"), 'once 档临时权益缺失');
  // 月/年 ⇒ 报告路由标记（E87-③ 分诊语义复用）
  assert.ok(APP.includes("else if (plan === 'compatibility_monthly_report') sessionStorage.setItem('ks_paid_report_type', 'monthly');"), '月报档临时权益缺失');
  assert.ok(APP.includes("else if (plan === 'compatibility_yearly_report') sessionStorage.setItem('ks_paid_report_type', 'yearly');"), '年报档临时权益缺失');
});

/* ═══════════════════ ④ generateReport 无 token 沙盒直发 ═══════════════════ */

test('E99-④-1 generateReport 无 token 沙盒探测直发（旧 throw 后继化）', () => {
  // 旧字面量 'No session' throw 必须后继化（E88 铁律：定长字面量断言须随结构演进）
  assert.ok(!APP.includes("if (!token) throw new Error('No session');"), '旧 throw 字面量必须退役（E99 后继化）');
  assert.ok(APP.includes('if (!_e99Sandbox) throw new Error(\'No session\');'), '非沙盒旧语义 throw 缺失（live 兜底）');
  assert.ok(APP.includes('const _e99St = await fetch(\'/api/sandbox/status\', { method: \'POST\' }).then((r) => r.json());'), 'generateReport 沙盒探测缺失');
  assert.ok(APP.includes("console.log('[generateReport] 🧪 E99 sandbox anonymous generation:', type);"), '匿名生成日志缺失');
  // 无 token ⇒ 不带 Authorization（triggerInsight 同构）
  assert.ok(APP.includes("headers: token\n          ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }\n          : { 'Content-Type': 'application/json' },"), '条件式 Authorization 头缺失');
});

/* ═══════════════════ ⑤ 军规链位 ═══════════════════ */

test('E99-⑤-1 test:astro 链位：e99 段入编＋链计数下界', () => {
  const astro = PKG.scripts['test:astro'] || '';
  assert.ok(astro.includes('audit-e99-sandbox-zero-friction'), 'e99 测试段未入编');
  const parts = astro.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.ok(parts.length >= 75, `链长度下界 75（实际 ${parts.length}）`);
});
