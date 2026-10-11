// 🛡️ Gate 45-A：沙盘（Sandbox）支付纯逻辑核
//   零网络 / 零子进程 / 零 LLM / 零 DOM（仅 node:crypto 做**确定性** HMAC）⇒ Node 直测。
//   设计目标：**契约 100% 仿真** —— 会话与事件严格对齐 Stripe Checkout Session /
//   `checkout.session.completed` 形状；签名采用 Stripe 的 `t=<ts>,v1=<hex>` 方案，
//   使**真实 /api/webhook** 零改动即可验签 ⇒ 沙盘与真金白银走**同一条**权益派发通路。
//
//   🔴 铁律：本模块**只构造事件与会话**，绝不写库、绝不直授权益；
//      权益一律由后端收到支付成功事件后派发（`buildPlanPayload` + 合并落库，唯一真源）。

import { createHmac } from 'node:crypto';

export const PAYMENT_MODE_LIVE = 'live';
export const PAYMENT_MODE_SANDBOX = 'sandbox';

export const SANDBOX_SESSION_PREFIX = 'cs_sandbox_';
export const SANDBOX_EVENT_PREFIX = 'evt_sandbox_';
export const SANDBOX_CUSTOMER_PREFIX = 'cus_sandbox_';

// 沙盘端点关闭时的回执码（fail-closed：缺省 live ⇒ 端点一律 404）
export const SANDBOX_DISABLED_STATUS = 404;

function toMs(now) {
  if (now == null) return Date.now();
  if (now instanceof Date) return now.getTime();
  if (typeof now === 'number' && Number.isFinite(now)) return now;
  const parsed = Date.parse(String(now));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

// 支付模式：**只有**显式 `PAYMENT_MODE=sandbox` 才开沙盘；缺省/未知一律 live（fail-safe，绝不误放行）
export function resolvePaymentMode(env) {
  const raw = String((env && env.PAYMENT_MODE) || '').trim().toLowerCase();
  return raw === PAYMENT_MODE_SANDBOX ? PAYMENT_MODE_SANDBOX : PAYMENT_MODE_LIVE;
}

export function isSandboxPaymentMode(env) {
  return resolvePaymentMode(env) === PAYMENT_MODE_SANDBOX;
}

// 券码归一：非字符串 ⇒ ''（绝不臆造券码）
export function normalizeVoucherCode(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().toUpperCase();
}

// 内置种子券（**仅沙盘模式生效**；env 券表可覆盖）
export const SEED_VOUCHERS = {
  'KS-DEMO-WEALTH': { plan: 'wealth_once' },
  'KS-DEMO-COMPAT': { plan: 'compatibility_once' },
  'KS-DEMO-PASS': { plan: 'all_pass_yearly' },
};

// 券表解析（env SANDBOX_VOUCHER_TABLE = JSON）：坏配置/空表 ⇒ null
//   🔴 fail-closed：解析失败**不抛错也不放宽**，由 resolveVoucherTable 回落种子券
export function parseVoucherTable(raw) {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  let obj;
  try { obj = JSON.parse(raw); } catch (e) { return null; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const out = {};
  let n = 0;
  for (const k of Object.keys(obj)) {
    const code = normalizeVoucherCode(k);
    const v = obj[k];
    if (!code || !v || typeof v !== 'object' || Array.isArray(v)) continue;
    if (typeof v.plan !== 'string' || v.plan.trim() === '') continue;
    const row = { plan: v.plan.trim() };
    if (v.expiresAt != null) row.expiresAt = String(v.expiresAt);
    if (v.active === false) row.active = false;
    out[code] = row;
    n++;
  }
  return n > 0 ? out : null;
}

// 券表来源：env 优先，缺省回落内置种子券（**零 DDL** 承载）
export function resolveVoucherTable(env) {
  const parsed = parseVoucherTable(env && env.SANDBOX_VOUCHER_TABLE);
  return parsed || Object.assign({}, SEED_VOUCHERS);
}

// 券兑现：四态拒（empty / unknown / inactive / expired）+ 真值命中
export function resolveVoucher(rawCode, table, now) {
  const code = normalizeVoucherCode(rawCode);
  if (!code) return { ok: false, reason: 'empty' };
  const t = (table && typeof table === 'object' && !Array.isArray(table)) ? table : {};
  const hit = t[code];
  if (!hit || typeof hit.plan !== 'string' || hit.plan.trim() === '') return { ok: false, reason: 'unknown' };
  if (hit.active === false) return { ok: false, reason: 'inactive' };
  if (hit.expiresAt) {
    const ex = Date.parse(String(hit.expiresAt));
    if (Number.isFinite(ex) && ex <= toMs(now)) return { ok: false, reason: 'expired' };
  }
  return { ok: true, code, plan: hit.plan.trim() };
}

// ── 会话 / 事件构造（形状严格对齐 Stripe）──

export function sandboxSessionId(nonce) {
  const s = String(nonce == null ? '' : nonce).replace(/[^A-Za-z0-9]/g, '');
  return SANDBOX_SESSION_PREFIX + (s || 'demo');
}

export function buildSandboxSession(input) {
  const it = input || {};
  const plan = String(it.plan || '');
  const userId = String(it.userId || '');
  const origin = String(it.origin || 'https://kindredsouls.online').replace(/\/+$/, '');
  const id = it.sessionId || sandboxSessionId(it.nonce);
  const path = '/sandbox-pay?plan=' + encodeURIComponent(plan) + '&session=' + encodeURIComponent(id);
  return {
    id,
    object: 'checkout.session',
    mode: it.mode === 'subscription' ? 'subscription' : 'payment',
    status: 'open',
    payment_status: 'unpaid',
    customer: SANDBOX_CUSTOMER_PREFIX + userId.slice(0, 8),
    customer_email: it.email || null,
    amount_total: null,
    currency: 'usd',
    metadata: { supabase_user_id: userId, plan },
    // 🔴 同源相对路径（45-B 收银台路由）—— 不接受外部域
    path,
    url: origin + path,
    sandbox: true,
  };
}

// `checkout.session.completed` 事件（webhook 落库所需的全部字段）
export function buildCheckoutCompletedEvent(input) {
  const it = input || {};
  const session = it.session || {};
  const meta = session.metadata || {};
  const plan = String(it.plan != null ? it.plan : (meta.plan || ''));
  const userId = String(it.userId != null ? it.userId : (meta.supabase_user_id || ''));
  const email = (it.email != null && it.email !== '') ? it.email : (session.customer_email || null);
  const created = Math.floor(toMs(it.now) / 1000);
  return {
    id: it.eventId || (SANDBOX_EVENT_PREFIX + String(session.id || 'demo').replace(SANDBOX_SESSION_PREFIX, '')),
    object: 'event',
    api_version: '2024-06-20',
    created,
    livemode: false,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: session.id || null,
        object: 'checkout.session',
        mode: session.mode || 'payment',
        status: 'complete',
        payment_status: 'paid',
        customer: session.customer || null,
        subscription: null,
        customer_email: email || null,
        customer_details: { email: email || null },
        amount_total: session.amount_total != null ? session.amount_total : null,
        currency: session.currency || 'usd',
        metadata: { supabase_user_id: userId, plan },
      },
    },
  };
}

// Stripe 签名方案复刻：`t=<秒级时间戳>,v1=HMAC-SHA256(secret, `${t}.${body}`)`
//   ⇒ 真实 webhook 的 `stripe.webhooks.constructEvent` 可直接验签（同容差 ~300s）
export function buildStripeSignatureHeader(secret, body, timestampSec) {
  const n = Math.floor(Number(timestampSec));
  const t = Number.isFinite(n) && n > 0 ? n : 0;
  const v1 = createHmac('sha256', String(secret == null ? '' : secret))
    .update(`${t}.${body}`, 'utf8')
    .digest('hex');
  return `t=${t},v1=${v1}`;
}

// 单一入口：会话 + 事件 + 序列化 body + 签名头（**body 与签名同字节**，防先签后改）
export function buildSignedSandboxDispatch(input) {
  const it = input || {};
  const session = it.session || buildSandboxSession(it);
  const event = buildCheckoutCompletedEvent({
    session,
    plan: it.plan,
    userId: it.userId,
    email: it.email,
    now: it.now,
    eventId: it.eventId,
  });
  const body = JSON.stringify(event);
  const tsSec = Math.floor(toMs(it.now) / 1000);
  const header = buildStripeSignatureHeader(it.secret, body, tsSec);
  return { session, event, body, header, tsSec };
}
