// 🤝 E155-刀一（主公军令 2026-11-25）：Resonance Code 缘分密码 · 纯逻辑核
//   零网络 / 零子进程 / 零 LLM / 零 DOM ⇒ node --test 直测。
//   职责：令牌工厂与校验 · 订单状态机（fail-closed 白名单）· 档案净化 ·
//         角色判定与隐私投影（第三方零泄漏）· 可注入 DB 适配（PostgREST / 内存假库）。
//   🔴 红线：invite_token 全局唯一且**仅可认领一次**；任何视图投影都不得向
//      非当事人透出 A/B 生辰、姓名、报告正文。

import { randomBytes } from 'node:crypto';

export const RESONANCE_PLAN = 'resonance';
export const RESONANCE_SCENES = Object.freeze(['romance', 'business', 'friendship']);
export const RESONANCE_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);
export const RESONANCE_PAYMENT = Object.freeze(['pending', 'paid']);
export const RESONANCE_REPORT_STATUS = Object.freeze([
  'awaiting_payment', 'awaiting_partner', 'generating', 'ready', 'failed',
]);
export const INVITE_TOKEN_RE = /^[A-Za-z0-9_-]{24}$/;
export const RESONANCE_TABLE = 'resonance_orders';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const PROFILE_KEYS = Object.freeze(['name', 'birthDate', 'birthTime', 'city', 'lat', 'lon', 'tz']);

/* ── 令牌 ── */
export function generateInviteToken(rng) {
  const r = typeof rng === 'function' ? rng : (n) => randomBytes(n);
  return Buffer.from(r(18)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** 归一：非字符串 / 长度或字符集不符 ⇒ ''（绝不「猜测性纠正」） */
export function normalizeInviteToken(raw) {
  return typeof raw === 'string' && INVITE_TOKEN_RE.test(raw) ? raw : '';
}

export function normalizeScene(raw) {
  return RESONANCE_SCENES.indexOf(String(raw == null ? '' : raw)) !== -1 ? String(raw) : '';
}

export function normalizeResonanceLocale(raw) {
  const v = String(raw == null ? '' : raw).toLowerCase().split('-')[0];
  return RESONANCE_LOCALES.indexOf(v) !== -1 ? v : '';
}

/* ── 档案净化：白名单式（先并后取，业务线字段一律穿透不了）── */
function validDate(s) {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]);
}

export function sanitizePersonProfile(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  const name = String(src.name == null ? '' : src.name).trim().slice(0, 40);
  if (name) out.name = name;
  const bd = String(src.birthDate == null ? '' : src.birthDate).trim();
  if (validDate(bd)) out.birthDate = bd;
  const bt = String(src.birthTime == null ? '' : src.birthTime).trim();
  out.birthTime = TIME_RE.test(bt) ? bt : '';          // '' ＝ 未知出生分钟（显式降级标记的真源）
  const city = String(src.city == null ? '' : src.city).trim().slice(0, 80);
  if (city) out.city = city;
  for (const k of ['lat', 'lon']) {
    const n = Number(src[k]);
    if (src[k] !== '' && src[k] != null && Number.isFinite(n)) out[k] = Math.round(n * 1000) / 1000;
  }
  const tz = String(src.tz == null ? '' : src.tz).trim().slice(0, 64);
  if (tz) out.tz = tz;
  return out;
}

/** 档案可用于建盘：生日必填；否则 null（绝不以残缺档案下单） */
export function personProfileComplete(p) {
  return !!(p && typeof p === 'object' && typeof p.birthDate === 'string' && validDate(p.birthDate));
}

/* ── 订单行归一（DB 行 → 域对象；畸形 ⇒ null）── */
export function normalizeOrderRow(row) {
  if (!row || typeof row !== 'object') return null;
  const token = normalizeInviteToken(row.invite_token);
  const scene = normalizeScene(row.scene);
  const payment = RESONANCE_PAYMENT.indexOf(row.payment_status) !== -1 ? row.payment_status : '';
  const status = RESONANCE_REPORT_STATUS.indexOf(row.report_status) !== -1 ? row.report_status : '';
  if (!token || !scene || !payment || !status || !row.payer_user_id) return null;
  const a = sanitizePersonProfile(row.person_a_profile);
  const bRaw = row.person_b_profile;
  return {
    id: String(row.id || ''),
    inviteToken: token,
    scene,
    locale: normalizeResonanceLocale(row.locale) || 'zh',
    payerUserId: String(row.payer_user_id),
    claimedByUserId: row.claimed_by_user_id ? String(row.claimed_by_user_id) : null,
    personA: a,
    personB: (bRaw && typeof bRaw === 'object') ? sanitizePersonProfile(bRaw) : null,
    paymentStatus: payment,
    reportStatus: status,
    reportA: row.report_a_json && typeof row.report_a_json === 'object' ? row.report_a_json : null,
    reportB: row.report_b_json && typeof row.report_b_json === 'object' ? row.report_b_json : null,
    claimedAt: row.claimed_at || null,
    createdAt: row.created_at || null,
  };
}

/* ── 状态机（白名单；非法跃迁一律 false ⇒ fail-closed）── */
const TRANSITIONS = Object.freeze({
  awaiting_payment: Object.freeze(['awaiting_payment', 'awaiting_partner', 'generating', 'ready', 'failed']),
  awaiting_partner: Object.freeze(['generating', 'failed']),
  generating: Object.freeze(['ready', 'failed', 'generating']),
  ready: Object.freeze([]),
  failed: Object.freeze(['generating']),
});

export function canTransitionReport(from, to) {
  return Object.prototype.hasOwnProperty.call(TRANSITIONS, String(from))
    && TRANSITIONS[from].indexOf(String(to)) !== -1;
}

/** 付款落定后的目标态：B 档案已在（路径 1）⇒ generating；B 待自填（路径 2）⇒ awaiting_partner */
export function reportStatusAfterPayment(order) {
  return personProfileComplete(order && order.personB) ? 'generating' : 'awaiting_partner';
}

/* ── 角色判定 ── */
export function resolveResonanceRole(order, userId) {
  const uid = String(userId == null ? '' : userId);
  if (!order || !uid) return 'anonymous';
  if (uid === order.payerUserId) return 'payer';
  if (order.claimedByUserId && uid === order.claimedByUserId) return 'claimant';
  if (order.claimedByUserId) return 'third_party';
  return 'invitee';
}

/* ── 隐私投影 ── */
function pickSign(truthSide) {
  return truthSide && typeof truthSide.sunSign === 'string' ? truthSide.sunSign : null;
}

/** 受邀函（**免登录**可见）：只有场景与可领状态 —— 零姓名零生辰零报告 */
export function projectInviteEnvelope(order) {
  if (!order) return { found: false };
  return {
    found: true,
    scene: order.scene,
    locale: order.locale,
    claimable: !order.claimedByUserId,
    paid: order.paymentStatus === 'paid',
  };
}

/** 当事人视图：按角色裁剪；非当事人只拿 envelope（绝不透出 A/B 任何隐私） */
export function projectOrderView(order, userId) {
  const role = resolveResonanceRole(order, userId);
  if (role !== 'payer' && role !== 'claimant') {
    // 受邀人（未认领、已登录）：额外告知「对方是否已代填生辰」（仅布尔，零隐私）⇒ 免填直接领取
    return role === 'invitee'
      ? Object.assign(projectInviteEnvelope(order), { role, partnerPrefilled: personProfileComplete(order.personB) })
      : Object.assign(projectInviteEnvelope(order), { role });
  }
  const own = role === 'payer' ? order.personA : order.personB;
  const report = role === 'payer' ? order.reportA : order.reportB;
  const base = {
    found: true,
    role,
    scene: order.scene,
    locale: order.locale,
    paymentStatus: order.paymentStatus,
    reportStatus: order.reportStatus,
    inviteToken: order.inviteToken,
    claimed: !!order.claimedByUserId,
    self: own,
    report: order.reportStatus === 'ready' ? report : null,   // 仅 ready 态下发（generating/failed 零正文）
  };
  if (role === 'payer') {
    // 付款人：知 B 是否已填档案（姓名可见 —— 是 A 自己填的或 B 愿意给出的称呼）
    base.partnerName = order.personB && order.personB.name ? order.personB.name : null;
    base.partnerFilled = personProfileComplete(order.personB);
    base.selfSunSign = pickSign(order.reportA && order.reportA.truth && order.reportA.truth.a);
    base.partnerSunSign = pickSign(order.reportB && order.reportB.truth && order.reportB.truth.b);
  } else {
    base.partnerName = order.personA.name || null;
    base.selfSunSign = pickSign(order.reportB && order.reportB.truth && order.reportB.truth.b);
    base.partnerSunSign = pickSign(order.reportA && order.reportA.truth && order.reportA.truth.a);
  }
  return base;
}

/* ═════════════ DB 适配层（依赖注入：fetch 可换 ⇒ 内存假库直测）═════════════ */

function headers(key, prefer) {
  const h = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  if (prefer) h.Prefer = prefer;
  return h;
}

/**
 * PostgREST 适配。fetchImpl 缺省 globalThis.fetch（服务端沿用 safeFetch 语义由调用方注入）。
 *   get/env 延迟读取 ⇒ 测试注入假 env。
 */
export function createPostgrestResonanceDb(deps) {
  const d = deps || {};
  const envOf = d.env || (() => process.env);
  const fetchImpl = d.fetch || ((...a) => globalThis.fetch(...a));
  const base = () => {
    const env = envOf() || {};
    return { url: env.SUPABASE_URL, key: env.SUPABASE_SERVICE_KEY };
  };
  const call = async (path, init) => {
    const { url, key } = base();
    if (!url || !key) return { ok: false, status: 0, json: async () => null };
    const r = await fetchImpl(`${url}/rest/v1/${RESONANCE_TABLE}${path}`, Object.assign({},
      init, { headers: headers(key, init && init.prefer) }));
    return { ok: r.ok, status: r.status, json: async () => r.json() };
  };
  const q = (s) => `eq.${encodeURIComponent(s)}`;

  return {
    kind: 'postgrest',
    async insert(row) {
      const r = await call('', { method: 'POST', prefer: 'return=representation', body: JSON.stringify(row) });
      const rows = r.ok ? await r.json().catch(() => []) : [];
      return Array.isArray(rows) && rows[0] ? normalizeOrderRow(rows[0]) : null;
    },
    async getByToken(token) {
      const t = normalizeInviteToken(token);
      if (!t) return null;
      const r = await call(`?invite_token=${q(t)}&limit=1`, { method: 'GET' });
      const rows = r.ok ? await r.json().catch(() => []) : [];
      return Array.isArray(rows) && rows[0] ? normalizeOrderRow(rows[0]) : null;
    },
    /** 认领：条件 PATCH（claimed_by 为空才写）⇒ 以回表行数判成败（0 行 ＝ 已被领/不存在）*/
    async claim(token, userId, profileB) {
      const t = normalizeInviteToken(token);
      if (!t) return { ok: false, reason: 'bad_token' };
      const r = await call(`?invite_token=${q(t)}&claimed_by_user_id=is.null`, {
        method: 'PATCH', prefer: 'return=representation',
        body: JSON.stringify({ claimed_by_user_id: userId, claimed_at: new Date().toISOString(), person_b_profile: profileB }),
      });
      const rows = r.ok ? await r.json().catch(() => []) : [];
      return Array.isArray(rows) && rows[0] ? { ok: true, order: normalizeOrderRow(rows[0]) } : { ok: false, reason: 'already_claimed' };
    },
    /** 置已付：条件 PATCH（pending 才写）⇒ 订单级幂等锁（重放 webhook 恒 0 行）*/
    async markPaid(token) {
      const t = normalizeInviteToken(token);
      if (!t) return { ok: false, reason: 'bad_token' };
      const r = await call(`?invite_token=${q(t)}&payment_status=eq.pending`, {
        method: 'PATCH', prefer: 'return=representation', body: JSON.stringify({ payment_status: 'paid' }),
      });
      const rows = r.ok ? await r.json().catch(() => []) : [];
      return Array.isArray(rows) && rows[0] ? { ok: true, changed: true, order: normalizeOrderRow(rows[0]) } : { ok: false, reason: 'not_pending' };
    },
    /** 报告落库：条件 PATCH（from 态才写 to 态 ⇒ 并发生成只留一份）*/
    async setReportStatus(token, from, to, patch) {
      const t = normalizeInviteToken(token);
      if (!t || !canTransitionReport(from, to)) return { ok: false, reason: 'bad_transition' };
      const r = await call(`?invite_token=${q(t)}&report_status=${q(from)}`, {
        method: 'PATCH', prefer: 'return=representation',
        body: JSON.stringify(Object.assign({ report_status: to }, patch || {})),
      });
      const rows = r.ok ? await r.json().catch(() => []) : [];
      return Array.isArray(rows) && rows[0] ? { ok: true, order: normalizeOrderRow(rows[0]) } : { ok: false, reason: 'conflict' };
    },
  };
}

/** 内存假库（单测 / 建表前本地验收）：语义与 PostgREST 适配逐条对齐（条件 PATCH 以谓词实现）*/
export function createMemoryResonanceDb() {
  const rows = [];
  const lock = (pred, patch) => {
    const hit = rows.find(pred);
    if (!hit) return null;
    Object.assign(hit, patch, { updated_at: new Date().toISOString() });
    return normalizeOrderRow(hit);
  };
  const byToken = (t) => (r) => r.invite_token === t;
  return {
    kind: 'memory',
    _rows: rows,
    async insert(row) {
      if (rows.some((r) => r.invite_token === row.invite_token)) return null;
      const full = Object.assign({ id: `mem-${rows.length + 1}`, claimed_at: null, report_a_json: null, report_b_json: null,
        person_b_profile: null, created_at: new Date().toISOString() }, row);
      rows.push(full);
      return normalizeOrderRow(full);
    },
    async getByToken(token) {
      const t = normalizeInviteToken(token);
      const hit = rows.find(byToken(t));
      return hit ? normalizeOrderRow(hit) : null;
    },
    async claim(token, userId, profileB) {
      const t = normalizeInviteToken(token);
      if (!t) return { ok: false, reason: 'bad_token' };
      const o = lock((r) => r.invite_token === t && r.claimed_by_user_id == null,
        { claimed_by_user_id: userId, claimed_at: new Date().toISOString(), person_b_profile: profileB });
      return o ? { ok: true, order: o } : { ok: false, reason: 'already_claimed' };
    },
    async markPaid(token) {
      const t = normalizeInviteToken(token);
      if (!t) return { ok: false, reason: 'bad_token' };
      const o = lock((r) => r.invite_token === t && r.payment_status === 'pending', { payment_status: 'paid' });
      return o ? { ok: true, changed: true, order: o } : { ok: false, reason: 'not_pending' };
    },
    async setReportStatus(token, from, to, patch) {
      const t = normalizeInviteToken(token);
      if (!t || !canTransitionReport(from, to)) return { ok: false, reason: 'bad_transition' };
      const o = lock((r) => r.invite_token === t && r.report_status === from, Object.assign({ report_status: to }, patch || {}));
      return o ? { ok: true, order: o } : { ok: false, reason: 'conflict' };
    },
  };
}
