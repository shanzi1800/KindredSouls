/* ═══════════════════════════════════════════════════════════════════════════
 * Gate 45-A 闸门：沙盘（Sandbox）支付与权益派发闭环（后端线）
 *   A 支付模式真值（fail-safe）      B 签名与事件构造（Stripe 格式复刻）
 *   C 兑换券纯核（零 DDL 配置表）    D 服务端接线铁律（自环真打 / 禁直写 / 封仓段未改）
 *   E 前端分流契约                   F 段位守备（下界 ≥44 + iCap===len-2）
 *   G 注入反漂移（四项）
 *
 * 🔴 铁律：权益**只能**由真实 /api/webhook 收到支付成功事件后派发；
 *    本闸门首要使命即证明「沙盘段绝无第二条落库路径」。
 * ═══════════════════════════════════════════════════════════════════════════ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHmac } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SERVER = readFileSync(join(ROOT, 'server.js'), 'utf8');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const MODULE_PATH = join(ROOT, 'lib', 'sandboxPayment.mjs');
const MODULE_SRC = readFileSync(MODULE_PATH, 'utf8');

const M = await import(pathToFileURL(MODULE_PATH).href);

/* ── 段提取（与 24g 同范式：定长 9000 字符窗口，禁「到下一个 app.post」猜测）── */
function window9000(src, anchor) {
  const i = src.indexOf(anchor);
  return i === -1 ? '' : src.slice(i, i + 9000);
}
function between(src, from, to) {
  const a = src.indexOf(from);
  if (a === -1) return '';
  const b = src.indexOf(to, a);
  return b === -1 ? src.slice(a, a + 9000) : src.slice(a, b);
}

const SANDBOX_SEG = between(SERVER, '// ── 🧪 Gate 45-A：沙盘支付端点', '// ── /api/create-checkout ──');
const CO_SEG = window9000(SERVER, "app.post('/api/create-checkout'");
const HOOK_SEG = window9000(SERVER, "app.post('/api/webhook'");

const segs = String(PKG.scripts['test:astro']).split('&&').map((x) => x.trim()).filter(Boolean);
const iCap = segs.findIndex((s) => s.includes('e40-compat'));

// 派发函数本体（D5/G5 专用射程：排除合法的 Supabase HTTPS 调用）
const dispatchSegOf = (src) => between(src, 'async function _sandboxDispatch', "app.post('/api/sandbox/status'");

/* ── 断言谓词（主测与注入自测**同源**取用，防射程断层）── */
const hasSandboxGate = (seg) => (seg.match(/isSandboxPaymentMode\(process\.env\)/g) || []).length >= 3;
const sandboxWritesEntitlement = (seg) => seg.includes('paid_plans') || seg.includes('buildPlanPayload(');
const hasSelfPostDispatch = (seg) =>
  seg.includes('/api/webhook') && seg.includes('stripe-signature') && /method:\s*'POST'/.test(seg);
const modeUnknownStaysLive = (mod) => mod.resolvePaymentMode({ PAYMENT_MODE: 'nonsense' }) === 'live';

/* ── 变异模块加载器（写入独立临时文件 ⇒ 天然绕开 ESM 缓存）── */
const _tmpRoot = mkdtempSync(join(tmpdir(), 'ks-g45-'));
let _seq = 0;
async function loadMutated(mutate) {
  const src = mutate(MODULE_SRC);
  assert.notEqual(src, MODULE_SRC, '注入未命中锚点（锚点漂移，注入自测失效）');
  const p = join(_tmpRoot, 'mod' + (++_seq) + '.mjs');
  writeFileSync(p, src, 'utf8');
  return await import(pathToFileURL(p).href);
}

/* ═══════════ A 支付模式真值（fail-safe）═══════════ */

test('A1 缺省 / 空 env ⇒ live（沙盘绝不隐式开启）', () => {
  assert.equal(M.resolvePaymentMode(undefined), 'live');
  assert.equal(M.resolvePaymentMode({}), 'live');
  assert.equal(M.resolvePaymentMode({ PAYMENT_MODE: '' }), 'live');
  assert.equal(M.resolvePaymentMode({ PAYMENT_MODE: '   ' }), 'live');
});

test('A2 显式 PAYMENT_MODE=sandbox（含大小写与首尾空格）⇒ sandbox', () => {
  assert.equal(M.resolvePaymentMode({ PAYMENT_MODE: 'sandbox' }), 'sandbox');
  assert.equal(M.resolvePaymentMode({ PAYMENT_MODE: '  SANDBOX ' }), 'sandbox');
  assert.equal(M.resolvePaymentMode({ PAYMENT_MODE: 'Sandbox' }), 'sandbox');
});

test('A3 未知取值一律回落 live（fail-safe：绝不放行 Payment 白名单外形态）', () => {
  for (const v of ['true', '1', 'yes', 'live', 'production', 'sand', 'SandBox_', 'null']) {
    assert.equal(M.resolvePaymentMode({ PAYMENT_MODE: v }), 'live', `PAYMENT_MODE=${v} 必须回落 live`);
  }
  assert.ok(modeUnknownStaysLive(M), '谓词射程：未知值必须为 live');
});

test('A4 isSandboxPaymentMode 与 resolvePaymentMode 严格同源 + 关闭码常量', () => {
  assert.equal(M.isSandboxPaymentMode({ PAYMENT_MODE: 'sandbox' }), true);
  assert.equal(M.isSandboxPaymentMode({}), false);
  assert.equal(M.isSandboxPaymentMode({ PAYMENT_MODE: 'nonsense' }), false);
  assert.equal(M.SANDBOX_DISABLED_STATUS, 404, '沙盘关闭必须 404（fail-closed 而非 200 空壳）');
});

/* ═══════════ B 签名与事件构造 ═══════════ */

const FIXED = { plan: 'compatibility_once', userId: 'u-12345678', email: 'a@b.c', secret: 'whsec_test', nonce: 'abc123', origin: 'https://kindredsouls.online' };
const NOW = new Date('2026-10-11T07:30:00.000Z');

test('B1 签名头严格复刻 Stripe 格式 t=<秒>,v1=<64 hex>', () => {
  const d = M.buildSignedSandboxDispatch({ ...FIXED, now: NOW });
  assert.match(d.header, /^t=\d{10},v1=[0-9a-f]{64}$/, '签名头格式不符 Stripe 方案');
});

test('B2 签名逐位可复算（独立 HMAC 复现，证明真实 webhook 可验签）', () => {
  const d = M.buildSignedSandboxDispatch({ ...FIXED, now: NOW });
  const expect = createHmac('sha256', FIXED.secret).update(d.tsSec + '.' + d.body, 'utf8').digest('hex');
  assert.equal(d.header, `t=${d.tsSec},v1=${expect}`, '签名与 Stripe 算法不一致 ⇒ constructEvent 必拒');
});

test('B3 换密钥 / 改 body ⇒ v1 必变（不可伪造、禁先签后改）', () => {
  const d = M.buildSignedSandboxDispatch({ ...FIXED, now: NOW });
  const sig = (body, secret) => M.buildStripeSignatureHeader(secret, body, d.tsSec);
  assert.notEqual(sig(d.body, FIXED.secret), sig(d.body, 'whsec_other'), '换密钥签名必须变');
  assert.notEqual(sig(d.body, FIXED.secret), sig(d.body + ' ', FIXED.secret), '改 body 签名必须变');
  assert.match(sig('', FIXED.secret), /^t=\d+,v1=[0-9a-f]{64}$/);
});

test('B4 事件形状对齐 checkout.session.completed（metadata 双钥 = 落库唯一钥匙）', () => {
  const d = M.buildSignedSandboxDispatch({ ...FIXED, now: NOW });
  const ev = JSON.parse(d.body);
  assert.equal(ev.type, 'checkout.session.completed');
  assert.equal(ev.data.object.object, 'checkout.session');
  assert.equal(ev.data.object.metadata.supabase_user_id, FIXED.userId);
  assert.equal(ev.data.object.metadata.plan, 'compatibility_once');
  assert.equal(ev.data.object.customer_details.email, FIXED.email);
  assert.equal(ev.data.object.status, 'complete');
  assert.equal(ev.data.object.payment_status, 'paid');
});

test('B5 email 回落链：无 email ⇒ 取 session.customer_email；仍缺 ⇒ null（绝不臆造）', () => {
  const s = M.buildSandboxSession({ plan: 'wealth_once', userId: 'u1', email: 'x@y.z', origin: 'https://k.io', nonce: 'n1' });
  assert.equal(s.url, 'https://k.io/sandbox-pay?plan=wealth_once&session=cs_sandbox_n1');
  const evA = M.buildCheckoutCompletedEvent({ session: s, plan: 'wealth_once', userId: 'u1', now: NOW });
  assert.equal(evA.data.object.customer_details.email, 'x@y.z');
  const s2 = M.buildSandboxSession({ plan: 'wealth_once', userId: 'u1', email: null, origin: 'https://k.io', nonce: 'n2' });
  const evB = M.buildCheckoutCompletedEvent({ session: s2, plan: 'wealth_once', userId: 'u1', now: NOW });
  assert.equal(evB.data.object.customer_details.email, null);
  assert.equal(evB.data.object.customer_email, null);
});

test('B6 body 与签名同字节 + 事件 created 为秒级（同 tsSec，过 Stripe ~300s 容差）', () => {
  const d = M.buildSignedSandboxDispatch({ ...FIXED, now: NOW });
  const ev = JSON.parse(d.body);
  assert.equal(ev.created, d.tsSec, 'created 必须等于签名时间戳（秒级）');
  assert.equal(d.tsSec, Math.floor(NOW.getTime() / 1000));
  assert.equal(ev.id, 'evt_sandbox_' + 'cs_sandbox_abc123'.replace('cs_sandbox_', ''), '事件 id 应与会话 id 同源派生');
});

/* ═══════════ C 兑换券纯核（零 DDL 配置表）═══════════ */

test('C1 券码归一：trim + 大写；非字符串 ⇒ 空串（绝不臆造）', () => {
  assert.equal(M.normalizeVoucherCode('  ks-demo-compat '), 'KS-DEMO-COMPAT');
  assert.equal(M.normalizeVoucherCode(null), '');
  assert.equal(M.normalizeVoucherCode(123), '');
  assert.equal(M.normalizeVoucherCode(undefined), '');
});

test('C2 命中真值：种子券兑现出正确 SKU', () => {
  const table = M.resolveVoucherTable({});
  const r = M.resolveVoucher('ks-demo-compat', table, NOW);
  assert.deepEqual(r, { ok: true, code: 'KS-DEMO-COMPAT', plan: 'compatibility_once' });
  assert.equal(M.resolveVoucher('KS-DEMO-WEALTH', table, NOW).plan, 'wealth_once');
  assert.equal(M.resolveVoucher('KS-DEMO-PASS', table, NOW).plan, 'all_pass_yearly');
});

test('C3 空码 / 未知码 ⇒ 明确拒因（fail-closed，不猜测）', () => {
  const table = M.resolveVoucherTable({});
  assert.deepEqual(M.resolveVoucher('', table, NOW), { ok: false, reason: 'empty' });
  assert.deepEqual(M.resolveVoucher(null, table, NOW), { ok: false, reason: 'empty' });
  assert.deepEqual(M.resolveVoucher('KS-NOT-EXIST', table, NOW), { ok: false, reason: 'unknown' });
});

test('C4 过期券 ⇒ expired（到期时刻即失效，边界 <=）', () => {
  const table = { 'KS-OLD': { plan: 'wealth_once', expiresAt: '2026-01-01T00:00:00.000Z' } };
  assert.deepEqual(M.resolveVoucher('KS-OLD', table, NOW), { ok: false, reason: 'expired' });
  const atEdge = { 'KS-EDGE': { plan: 'wealth_once', expiresAt: '2026-10-11T07:30:00.000Z' } };
  assert.equal(M.resolveVoucher('KS-EDGE', atEdge, NOW).ok, false, '到期当刻即失效');
  const future = { 'KS-NEW': { plan: 'wealth_once', expiresAt: '2027-01-01T00:00:00.000Z' } };
  assert.equal(M.resolveVoucher('KS-NEW', future, NOW).ok, true);
});

test('C5 显式停用券 ⇒ inactive（优先于过期判定）', () => {
  const table = { 'KS-OFF': { plan: 'wealth_once', active: false } };
  assert.deepEqual(M.resolveVoucher('KS-OFF', table, NOW), { ok: false, reason: 'inactive' });
});

test('C6 券表解析：坏配置 ⇒ null（不炸不放宽）／env 覆盖优先／缺 plan 条目剔除', () => {
  assert.equal(M.parseVoucherTable('{not json'), null);
  assert.equal(M.parseVoucherTable('[]'), null);
  assert.equal(M.parseVoucherTable('{"A":{"plan":""}}'), null, '无有效条目 ⇒ null');
  const ok = M.parseVoucherTable('{"ks-x":{"plan":"wealth_once"},"ks-bad":{},"ks-y":{"plan":"compatibility_once","active":false}}');
  assert.deepEqual(Object.keys(ok).sort(), ['KS-X', 'KS-Y']);
  assert.equal(ok['KS-Y'].active, false);
  // env 覆盖优先于种子券
  const covered = M.resolveVoucherTable({ SANDBOX_VOUCHER_TABLE: '{"ks-only":{"plan":"wealth_once"}}' });
  assert.deepEqual(Object.keys(covered), ['KS-ONLY']);
  // 坏 env ⇒ 回落种子券
  assert.deepEqual(Object.keys(M.resolveVoucherTable({ SANDBOX_VOUCHER_TABLE: 'garbage' })).sort(), Object.keys(M.SEED_VOUCHERS).sort());
});

/* ═══════════ D 服务端接线铁律 ═══════════ */

test('D1 三个沙盘端点齐备，且**各自**带模式闸门（缺省 live ⇒ 一律 404）', () => {
  for (const p of ['/api/sandbox/status', '/api/sandbox/complete', '/api/sandbox/redeem']) {
    assert.ok(SANDBOX_SEG.includes(`app.post('${p}'`) || SANDBOX_SEG.includes(`app.post("${p}"`), `缺端点 ${p}`);
  }
  assert.ok(SANDBOX_SEG.includes('SANDBOX_DISABLED_STATUS'), '关闭码必须来自纯核常量（单一真源）');
  assert.ok(hasSandboxGate(SANDBOX_SEG), '模式闸门计数不足（3 端点各一 ⇒ ≥3）');
});

test('D2 create-checkout 沙盘分支：位于防线内、且**晚于**防重付与登录校验', () => {
  const iBranch = CO_SEG.indexOf('isSandboxPaymentMode(process.env)');
  const iPaid = CO_SEG.indexOf('planHasAccess(');
  const i401 = CO_SEG.indexOf('status(401)');
  const iStripe = CO_SEG.indexOf("await import('stripe')");
  assert.ok(iBranch !== -1, '沙盘分支缺失');
  assert.ok(i401 !== -1 && i401 < iBranch, '登录校验必须先于沙盘分支');
  assert.ok(iPaid !== -1 && iPaid < iBranch, '防重付（already_paid）必须先于沙盘分支');
  assert.ok(iStripe !== -1 && iBranch < iStripe, '沙盘分支必须在 Stripe 导入之前（否则真金白银路径被绕）');
});

test('D3 沙盘分支以 env 模式闸门控制（禁恒真 / 禁硬编码开发开关）', () => {
  const i = CO_SEG.indexOf('isSandboxPaymentMode(process.env)');
  // 从 `if (` 起始处切窗（须含 if 关键字本身，否则正则必然失配）
  const from = Math.max(0, CO_SEG.lastIndexOf('if', i));
  const seg = CO_SEG.slice(from, from + 1200);
  assert.ok(/if\s*\(\s*isSandboxPaymentMode\(process\.env\)\s*\)/.test(seg), '分支必须由 if 包裹');
  assert.ok(!/if\s*\(\s*true\s*\)/.test(seg), '禁恒真');
  assert.ok(!/process\.env\.NODE_ENV\s*!==\s*'production'/.test(seg), '禁以 NODE_ENV 充当支付开关');
});

test('D4 【禁直写】沙盘段绝无第二条落库路径（唯一真源 = 真实 webhook）', () => {
  assert.ok(!sandboxWritesEntitlement(SANDBOX_SEG), '沙盘段不得出现 paid_plans / buildPlanPayload( ⇒ 禁止旁路授予权益');
});

test('D5 【自环真打】沙盘段以 POST + stripe-signature 打回真实 /api/webhook', () => {
  assert.ok(hasSelfPostDispatch(SANDBOX_SEG), '派发必须走真实 webhook 署名 POST');
  assert.ok(SANDBOX_SEG.includes('127.0.0.1'), '必须走本机回环（同进程同通路）');
  assert.ok(SANDBOX_SEG.includes('STRIPE_WEBHOOK_SECRET'), '缺验签密钥必须 fail-closed（不得跳过验签）');
  // 🔴 血训锁定（射程＝派发函数本体）：safeFetch 是 https.request 硬编码 ⇒ 打 http 回环必抛
  //    EPROTO packet length too long；故派发段禁 safeFetch，必用可走 http 的客户端 + 超时。
  const dseg = dispatchSegOf(SANDBOX_SEG);
  assert.ok(dseg.includes('/api/webhook'), '派发段锚点漂移（_sandboxDispatch 未命中）');
  assert.ok(!dseg.includes('safeFetch('), '禁用 https-only 的 safeFetch 做回环自打（实测 EPROTO 必失败）');
  assert.ok(dseg.includes('fetch('), '回环自打必须用可走 http 的客户端');
  assert.ok(dseg.includes('AbortSignal.timeout('), '回环自打必须带超时（防自环悬挂拖死端点）');
  // 🔴 血训锁定：漏传验签密钥 ⇒ 空密钥签名 ⇒ 真实 webhook 必拒（实测 "No signatures found matching..."）
  const callIdx = dseg.indexOf('buildSignedSandboxDispatch(');
  assert.ok(callIdx !== -1, '派发段缺 buildSignedSandboxDispatch 调用');
  assert.ok(/\bsecret\b/.test(dseg.slice(callIdx, callIdx + 320)), '构造签名事件必须显式传入验签密钥（漏传 ⇒ 空密钥 ⇒ 必被拒签）');
});

test('D6 封仓段字节级未改：webhook 三要素仍在、402 哨兵守恒', () => {
  for (const k of ['metadata.supabase_user_id', 'buildPlanPayload(', 'paid_plans: updatedPlans',
    "method: 'PATCH'", "method: 'POST'", 'express.raw', 'Missing stripe-signature']) {
    assert.ok(HOOK_SEG.includes(k), `封仓断言要素丢失：${k}`);
  }
  assert.match(HOOK_SEG, /if\s*\(\s*webhookSecret\s*\)/, 'fail-closed 验签形态丢失');
  assert.ok(!/webhookSecret\s*&&\s*stripeSig/.test(HOOK_SEG), 'fail-open 形态出现');
  const n402 = (SERVER.match(/ENTITLEMENT_REQUIRED/g) || []).length;
  assert.equal(n402, 4, '402 哨兵位点被改动（应为 4 处，寸步未松）');
});

/* ═══════════ E 前端分流契约（45-A 零前端改动，但须给 45-B 留确定接口）═══════════ */

test('E1 沙盘回执带 sandbox 标记（供前端识别并改道收银台）', () => {
  assert.match(CO_SEG, /sandbox:\s*true/, 'create-checkout 沙盘回执缺 sandbox 标记 ⇒ 前端无从分流');
  assert.ok(SANDBOX_SEG.includes('sandbox: true'), '沙盘端点回执须自述 sandbox');
});

test('E2 收银台 URL 必为同源相对路径（禁外部域，防钓鱼跳转）', () => {
  const s = M.buildSandboxSession({ plan: 'wealth_once', userId: 'u1', origin: 'https://kindredsouls.online', nonce: 'n9' });
  assert.ok(s.path.startsWith('/sandbox-pay?'), 'path 必须以 /sandbox-pay 起');
  const u = new URL(s.url);
  assert.equal(u.origin, 'https://kindredsouls.online', 'URL 必须同源');
  assert.equal(u.pathname, '/sandbox-pay');
  assert.equal(u.searchParams.get('session'), s.id, 'session 必须回传（45-B 核销用）');
  const evil = M.buildSandboxSession({ plan: 'wealth_once', userId: 'u1', origin: 'https://evil.example', nonce: 'n10' });
  assert.equal(new URL(evil.url).pathname, '/sandbox-pay', 'origin 只影响同源前缀，路径恒定');
});

/* ═══════════ F 段位守备（下界 + 相对位置）═══════════ */

test('F1 段位：Gate 45 已入编且插在收口位之前（下界 ≥44，iCap === len-2）', () => {
  assert.ok(segs.length >= 44, `段数 ${segs.length} < 44`);
  assert.ok(iCap !== -1, '收口位 e40-compat 缺失');
  assert.equal(iCap, segs.length - 2, '收口位必须紧邻链尾 python');
  const iG45 = segs.findIndex((s) => s.includes('audit-e41plus-gate45-sandbox-payment.test.mjs'));
  assert.ok(iG45 !== -1, 'Gate 45 未入编 test:astro');
  assert.ok(iG45 < iCap, 'Gate 45 必须插在收口位之前');
  assert.ok(segs[segs.length - 1].includes('python'), '链尾必须是 python 段');
});

/* ═══════════ G 注入反漂移 ═══════════ */

test('G1 注入：未知取值也判 sandbox ⇒ A3 判据必红', async () => {
  const mm = await loadMutated((s) => s.replace(
    "return raw === PAYMENT_MODE_SANDBOX ? PAYMENT_MODE_SANDBOX : PAYMENT_MODE_LIVE;",
    "return PAYMENT_MODE_SANDBOX;"));
  assert.equal(mm.resolvePaymentMode({ PAYMENT_MODE: 'nonsense' }), 'sandbox', '注入后应误开沙盘（证明 A3 有射程）');
  assert.equal(modeUnknownStaysLive(mm), false, 'A3 谓词必须能识破该注入');
});

test('G2 注入：签名忽略密钥 ⇒ B2 判据必红', async () => {
  const mm = await loadMutated((s) => s.replace(
    "const v1 = createHmac('sha256', String(secret == null ? '' : secret))",
    "const v1 = createHmac('sha256', 'FIXED')"));
  const d = mm.buildSignedSandboxDispatch({ ...FIXED, now: NOW });
  const expect = createHmac('sha256', FIXED.secret).update(d.tsSec + '.' + d.body, 'utf8').digest('hex');
  assert.notEqual(d.header, `t=${d.tsSec},v1=${expect}`, 'B2 判据必须能识破忽略密钥的签名');
});

test('G3 注入：沙盘段直写权益 ⇒ D4 判据必红', () => {
  const bad = SERVER.replace(
    "    const out = await _sandboxDispatch(req, plan, who.userId, who.email);",
    "    const _leak = { paid_plans: {} };\n    const out = await _sandboxDispatch(req, plan, who.userId, who.email);");
  const badSeg = between(bad, '// ── 🧪 Gate 45-A：沙盘支付端点', '// ── /api/create-checkout ──');
  assert.ok(sandboxWritesEntitlement(badSeg), 'D4 必须能识破沙盘段直写 paid_plans');
});

test('G4 注入：沙盘端点失去模式闸门 ⇒ D1 判据必红', () => {
  const bad = SERVER.replace(
    "app.post('/api/sandbox/complete', async (req, res) => {\n  // 🔴 沙盘闸门：缺省 live ⇒ 端点视为不存在（fail-closed）\n  if (!isSandboxPaymentMode(process.env)) return res.status(SANDBOX_DISABLED_STATUS).json({ error: 'Not found' });",
    "app.post('/api/sandbox/complete', async (req, res) => {");
  assert.notEqual(bad, SERVER, 'G4 注入锚点漂移');
  const badSeg = between(bad, '// ── 🧪 Gate 45-A：沙盘支付端点', '// ── /api/create-checkout ──');
  assert.equal(hasSandboxGate(badSeg), false, 'D1 必须能识破缺失模式闸门的端点');
});

test('G5 注入：回环自打改用 safeFetch ⇒ D5 判据必红（EPROTO 血训）', () => {
  const bad = SERVER.replace('const r = await fetch(`http://127.0.0.1:', 'const r = await safeFetch(`http://127.0.0.1:');
  assert.notEqual(bad, SERVER, 'G5 注入锚点漂移');
  const badSeg = dispatchSegOf(bad);
  assert.ok(badSeg.includes('/api/webhook'), 'G5 注入段锚点漂移');
  assert.ok(badSeg.includes('safeFetch('), 'D5 必须能识破 https-only 客户端（否则线上必 EPROTO）');
});
