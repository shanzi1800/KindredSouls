// 🤝 E155-刀四（主公军令 2026-11-25）：Resonance Code 前端纯逻辑核
//   路由解析 / 邀请令牌提取 / 建单与认领意图持久化（登录整页重定向后续跑）/ API 客户端 / 结算分流。
//   🔴 移动端严禁 window.open —— OAuth 与 Stripe 一律整页重定向，意图存 localStorage。
//   零 DOM 依赖（除显式传入的 storage/fetch）⇒ node --test 直测。

import { resolveCheckoutRoute } from './sandboxCheckout.mjs';
import { normalizeInviteToken } from '../../../lib/resonance/resonanceCore.mjs';

export const RESONANCE_PATH = '/resonance';
export const INVITE_PATH_PREFIX = '/invite/';
export const RESONANCE_INTENT_KEY = 'ks_resonance_intent';
export const RESONANCE_PLAN = 'resonance';

/** /resonance 或 /invite/:token ⇒ {kind, token}；其余 ⇒ null */
export function parseResonancePath(pathname) {
  const p = String(pathname || '').replace(/\/+$/, '') || '/';
  if (p === RESONANCE_PATH) return { kind: 'resonance' };
  if (p.startsWith(INVITE_PATH_PREFIX)) {
    const token = normalizeInviteToken(p.slice(INVITE_PATH_PREFIX.length));
    return token ? { kind: 'invite', token } : { kind: 'invite', token: '' };
  }
  return null;
}

export function resonanceTokenFromSearch(search) {
  const raw = typeof search === 'string' && search.startsWith('?') ? search.slice(1) : String(search || '');
  try { return normalizeInviteToken(new URLSearchParams(raw).get('resonance_token')); } catch (e) { return ''; }
}

export function resonanceInviteUrl(origin, token) {
  return `${String(origin || '').replace(/\/+$/, '')}${INVITE_PATH_PREFIX}${normalizeInviteToken(token)}`;
}

export function resonanceSuccessPath(token) {
  return `${INVITE_PATH_PREFIX}${normalizeInviteToken(token)}?payment=success`;
}

/* ── 意图持久化（形状校验；畸形 ⇒ null 绝不臆造）── */
function cleanPerson(p) {
  const src = p && typeof p === 'object' && !Array.isArray(p) ? p : null;
  if (!src || typeof src.birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(src.birthDate)) return null;
  const out = { birthDate: src.birthDate, birthTime: typeof src.birthTime === 'string' ? src.birthTime : '' };
  if (typeof src.name === 'string' && src.name.trim()) out.name = src.name.trim().slice(0, 40);
  if (typeof src.city === 'string' && src.city.trim()) out.city = src.city.trim().slice(0, 80);
  for (const k of ['lat', 'lon']) if (Number.isFinite(Number(src[k]))) out[k] = Number(src[k]);
  if (typeof src.tz === 'string' && src.tz.trim()) out.tz = src.tz.trim().slice(0, 64);
  return out;
}

export function validateResonanceIntent(raw) {
  const it = raw && typeof raw === 'object' ? raw : null;
  if (!it) return null;
  if (typeof it.token === 'string') {
    const token = normalizeInviteToken(it.token);
    return token ? { token, purpose: 'view' } : null;
  }
  if (['romance', 'business', 'friendship'].indexOf(it.scene) === -1) return null;
  const personA = cleanPerson(it.personA);
  if (!personA) return null;
  const out = { purpose: 'create', scene: it.scene, mode: it.mode === 'known' ? 'known' : 'invite', locale: it.locale, personA };
  const b = cleanPerson(it.personB);
  if (out.mode === 'known') { if (!b) return null; out.personB = b; }
  return out;
}

export function saveResonanceIntent(intent, storage) {
  const v = validateResonanceIntent(intent);
  if (!v) return false;
  (storage || localStorage).setItem(RESONANCE_INTENT_KEY, JSON.stringify(v));
  return true;
}

export function takeResonanceIntent(storage) {
  const s = storage || localStorage;
  let raw = null;
  try { raw = JSON.parse(s.getItem(RESONANCE_INTENT_KEY) || 'null'); } catch (e) { raw = null; }
  return { intent: validateResonanceIntent(raw), clear: () => s.removeItem(RESONANCE_INTENT_KEY) };
}

/* ── API 客户端（Bearer = Supabase access token；零弹窗）── */
export function createResonanceApi(fetchImpl, getToken) {
  const call = async (path, init) => {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, (init && init.headers) || {});
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetchImpl(path, Object.assign({}, init, { headers }));
    const data = await r.json().catch(() => ({}));
    return { status: r.status, ok: r.ok, data };
  };
  return {
    // E155 热修：令牌不合法（归一化后为空）⇒ 不发请求、直接判未找到。
    // 否则会请求空路径 /api/resonance/invite/，凡把未知路径回退成 200 的环境都会把它变成「通用信封」。
    envelope: (token) => {
      const t = normalizeInviteToken(token);
      return t ? call(`/api/resonance/invite/${t}`) : Promise.resolve({ status: 404, ok: false, data: { error: 'not_found' } });
    },
    order: (body) => call('/api/resonance/order', { method: 'POST', body: JSON.stringify(body) }),
    view: (token) => call(`/api/resonance/order/${normalizeInviteToken(token)}`),
    claim: (token, personB) => call('/api/resonance/claim', { method: 'POST', body: JSON.stringify({ token, personB: personB || undefined }) }),
    checkout: (body) => call('/api/create-checkout', { method: 'POST', body: JSON.stringify(body) }),
  };
}

/** 结算路由：复用唯一入口（already_paid / sandbox / redirect / error） */
export function resolveResonanceCheckout(data, origin) {
  return resolveCheckoutRoute(data, origin);
}

/** 个人档案可提交性：生日必填；填了时间须有城市坐标（否则上升不可建） */
export function personSubmittable(p) {
  const v = cleanPerson(p);
  if (!v) return { ok: false, reason: 'birthDate' };
  if (v.birthTime && !Number.isFinite(v.lat) && !v.tz) return { ok: false, reason: 'time_city' };
  return { ok: true, person: v };
}
