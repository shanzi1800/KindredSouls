/**
 * sandboxCheckout.mjs — 沙盘收银台前端纯逻辑核（Gate 45-B · E42+ 首战后端线的前端承接）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军师令（45-B）：create-checkout 回执 `sandbox:true` ⇒ **前端截断外链跳转**，
 *   就地唤起 SandboxCashier 模态；模态内两枚极速操作点：
 *     ① 一键模拟付款 ⇒ POST /api/sandbox/complete（直通后端自环 Webhook 派发权益）
 *     ② 特权券兑换   ⇒ POST /api/sandbox/redeem
 *   报告交付后再承接「灵宠认领」CTA（严守 E34 D5 铁律）。
 *
 * 🔴 三条纪律（与全仓铁律同源）：
 *   ① **截断优先**：沙盘回执绝不跳外链 —— 且沙盘 URL 必须同源（`/sandbox-pay`），
 *      否则一律判 error（禁 `//evil.com` 协议相对绕行 / 禁外部域，防钓鱼）；
 *   ② **零伪造**：出参只据服务端真值判定（granted / reason 闭集），缺真值 ⇒ 明确 failed，
 *      绝不臆造「已开通」；取词一律经字典（sandbox / familiar 域），禁机翻硬编码；
 *   ③ **E34 D5 白名单**：灵宠领养入参**只许**出生时空 + 关系模式六键，
 *      任何业务线字段（报告正文 / 合盘分数 / 财富评语 / 权益）**在构造层即被剔除**，
 *      绝不靠调用方自觉。
 *
 * 🔴 纯逻辑核：零网络 / 零 DOM / 零 LLM（仅模块级开合总线，供任意调用点唤起全局模态）。
 *    字典由调用方**注入** ⇒ Node 可直接 import 本模块单测。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ── 测试锚点（与组件同源，闸门据此锁定契约）── */
export const SANDBOX_CASHIER_TESTID = 'sandbox-cashier';
export const SANDBOX_PAY_BTN_TESTID = 'sandbox-pay-btn';
export const SANDBOX_CODE_INPUT_TESTID = 'sandbox-voucher-input';
export const SANDBOX_REDEEM_BTN_TESTID = 'sandbox-redeem-btn';
export const SANDBOX_STATUS_TESTID = 'sandbox-status';
export const SANDBOX_WATERMARK_TESTID = 'sandbox-watermark';
export const ADOPT_CTA_TESTID = 'adopt-familiar-cta';

/* ── 路由 / 端点（同源相对路径，禁外部域）── */
export const SANDBOX_PAY_PATH = '/sandbox-pay';
export const SANDBOX_COMPLETE_PATH = '/api/sandbox/complete';
export const SANDBOX_REDEEM_PATH = '/api/sandbox/redeem';
export const FAMILIAR_ADOPT_PATH = '/api/familiar/adopt';

/* ── 券码输入边界 ── */
export const VOUCHER_MIN_LEN = 3;
export const VOUCHER_MAX_LEN = 32;
const VOUCHER_RE = /^[A-Z0-9][A-Z0-9-]*$/;

/* ── SKU ⇒ 字典词条键（双 SKU 标识；未知 SKU 走 Other，绝不臆造商品名）── */
export const SANDBOX_PLAN_TERM_KEYS = Object.freeze({
  wealth_once: 'SandboxPlanWealth',
  compatibility_once: 'SandboxPlanCompat',
  star_monthly_vip: 'SandboxPlanOther',
  all_pass_yearly: 'SandboxPlanOther',
});

/* ═══════════ 一 · 分流：沙盘回执就地改道（截断外链）═══════════ */

/** 沙盘回执识别：**唯一**判据 = 服务端显式 `sandbox:true` */
export function isSandboxResponse(data) {
  return !!data && typeof data === 'object' && data.sandbox === true;
}

/**
 * 沙盘 URL 同源判定（**必须**传入当前页面 origin，缺则拒绝一切绝对 URL —— fail-closed）。
 *   ① 相对路径：必须恰为 `/sandbox-pay`，且**不得**为协议相对 `//host`（可指向外域）；
 *   ② 绝对 URL：pathname 须为 /sandbox-pay，且其 origin 必须与 currentOrigin **严格相等**。
 * 其余一律 false ⇒ 上层判 error，绝不跳转。
 */
export function sandboxUrlIsSameOrigin(url, currentOrigin) {
  if (typeof url !== 'string' || url === '') return false;
  if (url.startsWith('/')) {
    if (url.startsWith('//')) return false; // 协议相对 ⇒ 可指向外域，一律拒
    return url.split('?')[0] === SANDBOX_PAY_PATH;
  }
  let u;
  try { u = new URL(url); } catch (_) { return false; }
  if (u.pathname !== SANDBOX_PAY_PATH) return false;
  // 🔴 缺当前源 ⇒ 无法核实 ⇒ 一律拒（绝不放行「看着像自己」的外部 URL）
  const co = (typeof currentOrigin === 'string') ? currentOrigin.trim() : '';
  if (co === '') return false;
  let base;
  try { base = new URL(co); } catch (_) { return false; }
  return u.origin === base.origin;
}

/**
 * 结算回执路由判定（**唯一入口**，App / WealthReportPage 共用）。
 * 次序铁律：already_paid 优先（已拥有者不必再付）→ sandbox（截断外链）→ url（真金白银外跳）→ error。
 * @param data 服务端回执
 * @param currentOrigin 当前页面 origin（`window.location.origin`）—— 沙盘绝对 URL 的同源核对基准
 */
export function resolveCheckoutRoute(data, currentOrigin) {
  if (!data || typeof data !== 'object') return { kind: 'error', reason: 'empty' };
  const plan = typeof data.plan === 'string' ? data.plan : '';
  if (data.already_paid === true) return { kind: 'paid', plan };
  if (isSandboxResponse(data)) {
    // 🔴 沙盘回执必须同源 —— 否则宁可报错也不跳转（杜绝钓鱼改道）
    if (!sandboxUrlIsSameOrigin(data.url, currentOrigin)) return { kind: 'error', reason: 'bad_sandbox_url' };
    return {
      kind: 'sandbox',
      plan,
      sessionId: typeof data.sessionId === 'string' ? data.sessionId : '',
      url: data.url,
    };
  }
  if (typeof data.url === 'string' && data.url !== '') return { kind: 'redirect', url: data.url };
  return { kind: 'error', reason: 'no_url' };
}

/* ═══════════ 二 · 请求构造（收银台两枚操作点）═══════════ */

/** 券码归一：trim + 大写；非字符串 ⇒ ''（与后端 normalizeVoucherCode 同源口径） */
export function normalizeVoucherInput(raw) {
  return typeof raw === 'string' ? raw.trim().toUpperCase() : '';
}

/** 券码可提交性（空/过短/过长/含非法字符 ⇒ false；不做「猜测性纠正」） */
export function isVoucherSubmittable(raw) {
  const c = normalizeVoucherInput(raw);
  return c.length >= VOUCHER_MIN_LEN && c.length <= VOUCHER_MAX_LEN && VOUCHER_RE.test(c);
}

export function buildSandboxCompleteRequest(plan) {
  return { path: SANDBOX_COMPLETE_PATH, method: 'POST', body: { plan: String(plan == null ? '' : plan) } };
}

export function buildSandboxRedeemRequest(code) {
  return { path: SANDBOX_REDEEM_PATH, method: 'POST', body: { code: normalizeVoucherInput(code) } };
}

/**
 * 解析 /sandbox-pay 的查询串（同源直达路由兜底用）。
 * 缺 plan / 缺 session ⇒ 空串（**绝不臆造** plan），由页面如实提示。
 */
export function decodeSandboxPaySearch(search) {
  const raw = (typeof search === 'string' && search.startsWith('?')) ? search.slice(1) : String(search || '');
  let params;
  try { params = new URLSearchParams(raw); } catch (_) { params = new URLSearchParams(''); }
  return {
    plan: params.get('plan') || '',
    sessionId: params.get('session') || '',
  };
}

/* ═══════════ 三 · 结果判定（零伪造）═══════════ */

/** 后端四态拒因闭集 + 不可售（reason 直出，不得改写） */
export const VOUCHER_REJECT_REASONS = Object.freeze([
  'empty', 'unknown', 'inactive', 'expired', 'plan_not_sellable',
]);

const REJECT_MESSAGE_KEY = Object.freeze({
  empty: 'SandboxNoCode',
  unknown: 'SandboxBadCode',
  inactive: 'SandboxCodeOff',
  expired: 'SandboxCodeOld',
  plan_not_sellable: 'SandboxUnsellable',
});

/** 拒因 ⇒ 字典词条键；未登记 ⇒ null（绝不臆造文案键） */
export function rejectReasonKey(reason) {
  return Object.prototype.hasOwnProperty.call(REJECT_MESSAGE_KEY, reason) ? REJECT_MESSAGE_KEY[reason] : null;
}

/**
 * 判定沙盘操作结果。**只有**服务端 `ok:true && granted:true` 才算开通；
 * 其余一律 granted:false，并给出确定的文案键（供收银台展示，绝不静默）。
 */
export function describeSandboxOutcome(data) {
  const d = (data && typeof data === 'object') ? data : {};
  const plan = typeof d.plan === 'string' ? d.plan : '';
  if (d.ok === true) {
    const granted = d.granted === true;
    return {
      ok: true,
      granted,
      plan,
      reason: granted ? null : 'not_granted',
      messageKey: granted ? 'SandboxGranted' : 'SandboxFailed',
    };
  }
  const reason = typeof d.reason === 'string' && d.reason !== ''
    ? d.reason
    : (typeof d.error === 'string' && d.error !== '' ? d.error : 'failed');
  return {
    ok: false,
    granted: false,
    plan,
    reason,
    messageKey: rejectReasonKey(reason) || 'SandboxFailed',
  };
}

/* ═══════════ 四 · E34 D5 红线：灵宠领养入参白名单 ═══════════ */

/**
 * 唯一许可字段（出生时空 + 关系模式）。顺序即契约 —— 闸门按序比对。
 * 🔴 该清单**只许**出生真值，任何业务线字段都不得进入。
 */
export const FAMILIAR_ADOPT_FIELDS = Object.freeze([
  'birthDate', 'birthTime', 'lat', 'lon', 'tz', 'relationMode',
]);

/** 业务线禁传字段（防御清单 —— 若被调用方误并，本核在构造层剔除） */
export const FAMILIAR_FORBIDDEN_FIELDS = Object.freeze([
  'insight', 'reportText', 'report', 'payload', 'score', 'scores', 'overall', 'dimensions',
  'wealthComment', 'wealth', 'commentary', 'compatibility', 'synastry', 'paid_plans',
  'plan', 'entitlement', 'reportType', 'free_access', 'houseOverlay', 'truth', 'sections',
]);

/**
 * 构造灵宠领养请求体 —— **白名单式**：先并，再**只取**六键。
 * ⇒ 即便调用方传入报告全文 / 合盘分数，也无法穿透（不做「黑名单过滤」的漏网假设）。
 */
export function buildFamiliarAdoptPayload(birth, relationMode) {
  const b = (birth && typeof birth === 'object' && !Array.isArray(birth)) ? birth : {};
  const src = Object.assign({}, b, { relationMode });
  const out = {};
  for (const k of FAMILIAR_ADOPT_FIELDS) out[k] = src[k];
  return out;
}

/** 请求体洁净度自检（供组件/闸门双重把关） */
export function isCleanFamiliarAdoptPayload(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) return false;
  const keys = Object.keys(p);
  if (keys.length !== FAMILIAR_ADOPT_FIELDS.length) return false;
  for (const k of FAMILIAR_ADOPT_FIELDS) if (!keys.includes(k)) return false;
  for (const bad of FAMILIAR_FORBIDDEN_FIELDS) if (keys.includes(bad)) return false;
  return true;
}

/**
 * 出生坐标「真实可用」判定：URL 必须**显式**携带成对且值域合法的 lat/lon。
 * 🔴 用途：灵宠认领 CTA 的挂载闸门 —— 禁以默认盘坐标（曼谷 13.75/100.5）冒充真实出生地
 *    （E34「严禁静默退曼谷」同源纪律）。
 */
export function hasExplicitBirthCoords(search) {
  const raw = (typeof search === 'string' && search.startsWith('?')) ? search.slice(1) : String(search || '');
  let p;
  try { p = new URLSearchParams(raw); } catch (_) { return false; }
  if (p.get('lat') === null || p.get('lon') === null) return false;
  const lat = Number(p.get('lat'));
  const lon = Number(p.get('lon'));
  return Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -90 && lat <= 90
    && lon >= -180 && lon <= 180;
}

/* ═══════════ 五 · 字典取词（唯一入口 · 缺键即 null，禁机翻兜底）═══════════ */
/** 按 域→键→语种 硬查字典；缺域/缺键/空值/非法语种回落 zh；仍缺 ⇒ null */
export function dictTerm(dict, domain, key, lang) {
  const dom = dict && dict.domains && dict.domains[domain];
  if (!dom || !dom[key]) return null;
  const langs = (dict.meta && Array.isArray(dict.meta.langs)) ? dict.meta.langs : null;
  const L = (langs && !langs.includes(lang)) ? 'zh' : lang;
  const label = dom[key][L];
  if (typeof label !== 'string' || label === '') return null;
  const slot = (dict.slots && dict.slots.assignment && dict.slots.assignment[domain]) || 'chip';
  return { domain, key, label, slot };
}

/** SKU 标签取词：已知 SKU 走专属词条，其余走 Other（绝不臆造商品名） */
export function planTerm(dict, plan, lang) {
  const key = SANDBOX_PLAN_TERM_KEYS[plan] || 'SandboxPlanOther';
  return dictTerm(dict, 'sandbox', key, lang);
}

/* ═══════════ 六 · 开合总线（全局模态 · 任意调用点可唤起）═══════════ */

const _subs = new Set();
let _current = null;

function _emit() {
  for (const fn of [..._subs]) {
    try { fn(_current); } catch (_) { /* 单个订阅者异常不得阻断其余（零级联） */ }
  }
}

/** 订阅（返回退订函数）；非法入参 ⇒ 空退订（绝不做静默空指针） */
export function subscribeSandboxCashier(fn) {
  if (typeof fn !== 'function') return () => {};
  _subs.add(fn);
  return () => { _subs.delete(fn); };
}

/** 唤起收银台；缺 plan ⇒ null（不弹空壳） */
export function openSandboxCashier(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const plan = String(payload.plan || '');
  if (!plan) return null;
  _current = {
    plan,
    sessionId: String(payload.sessionId || ''),
    url: String(payload.url || ''),
    lang: (typeof payload.lang === 'string' && payload.lang !== '') ? payload.lang : null,
    onGranted: (typeof payload.onGranted === 'function') ? payload.onGranted : null,
    onClose: (typeof payload.onClose === 'function') ? payload.onClose : null,
  };
  _emit();
  return _current;
}

export function closeSandboxCashier() {
  const prev = _current;
  _current = null;
  _emit();
  return prev;
}

export function getSandboxCashier() {
  return _current;
}

/**
 * 分流 + 就地唤起（App / WealthReportPage **唯一**调用点）。
 * 回执为沙盘 ⇒ 立即唤收银台并**截断跳转**；其余 kind 由调用方自行处置。
 */
export function dispatchCheckoutRoute(data, hooks) {
  const h = (hooks && typeof hooks === 'object') ? hooks : {};
  const route = resolveCheckoutRoute(data, h.origin);
  if (route.kind === 'sandbox') {
    openSandboxCashier({
      plan: route.plan,
      sessionId: route.sessionId,
      url: route.url,
      lang: h.lang,
      onGranted: h.onGranted,
      onClose: h.onClose,
    });
  }
  return route;
}
