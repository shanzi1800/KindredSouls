/**
 * compatSceneEntitlement.mjs — 🤝 E159-刀一（主公军令 2026-11-27）：缘分密码三场景权益纯逻辑核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令口径：撤销「一次付费通开三场景」——权益与报告按 (双人盘签名 + scene) 物理隔离；
 *   切场景：未解锁 ⇒ 该场景专属付费墙＋锁该场景今日塔罗，绝不串用其他场景报告；
 *           已解锁 ⇒ 只还原该场景自己的报告与折叠态。
 *
 * 职责边界（纯逻辑核纪律）：零网络 / 零 DOM / 零 React —— storage 由调用方注入（测试可 mock）。
 *   · 会话级解锁真源（与 E85-① `ks_compat_session_unlocked` 契约兼容）：
 *       - 情爱：沿用 E85 键 '1'（存量脚本/闸门逐字节兼容）；
 *       - 三场景：`ks_compat_session_unlocked_scenes`（JSON 场景数组），情爱解锁时两键同写。
 *   · 付讫时的购买场景：`ks_e159_purchase_scene`（reload 后按「当时买的场景」落解锁，绝不落错）。
 *   · 月/年报归档槽位：`ks_e158_report_archive_e159_<scene>`（每场景一槽；情爱仍镜像写 E158 旧键）。
 *   · 账号级权益（服务端 paid_plans 镜像判定，与服务端 compatSceneListed 同口径）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const COMPAT_SCENES = Object.freeze(['romance', 'business', 'friendship']);

/** 场景白名单（非法/缺省 ⇒ 情爱；绝不回显原始入参） */
export function normalizePairScene(raw) {
  return raw === 'business' || raw === 'friendship' ? raw : 'romance';
}

/* ── 会话级键名（测试锚点） ── */
export const ROMANCE_UNLOCK_KEY = 'ks_compat_session_unlocked';
export const SESSION_SCENES_KEY = 'ks_compat_session_unlocked_scenes';
export const PURCHASE_SCENE_KEY = 'ks_e159_purchase_scene';
export const ARCHIVE_SLOT_PREFIX = 'ks_e158_report_archive_e159_';

/** 账号级场景名单键（与服务端 webhook 落库键逐字同源） */
export const COMPAT_SCENE_PLAN_LISTS = Object.freeze({
  monthly: 'compatibility_monthly_scenes',
  yearly: 'compatibility_yearly_scenes',
});

function _get(store, key) {
  try { return store && typeof store.getItem === 'function' ? store.getItem(key) : null; } catch { return null; }
}
function _set(store, key, val) {
  try { if (store && typeof store.setItem === 'function') store.setItem(key, val); return true; } catch { return false; }
}
function _del(store, key) {
  try { if (store && typeof store.removeItem === 'function') store.removeItem(key); } catch { /* iOS 无痕/写满 ⇒ fail-soft */ }
}

/** 已解锁场景数组（情爱：E85 旧键 '1' 或新数组含 romance） */
export function readSessionScenes(store) {
  const out = [];
  try {
    const raw = JSON.parse(String(_get(store, SESSION_SCENES_KEY) || '[]'));
    if (Array.isArray(raw)) for (const s of raw) { const n = normalizePairScene(s); if (n === s && !out.includes(s)) out.push(s); }
  } catch { /* 坏档 ⇒ 仅凭 E85 旧键 */ }
  if (_get(store, ROMANCE_UNLOCK_KEY) === '1' && !out.includes('romance')) out.push('romance');
  return out;
}

/** 该场景本会话是否已解锁（坏档/无档 ⇒ false fail-closed） */
export function sessionSceneUnlocked(store, scene) {
  return readSessionScenes(store).includes(normalizePairScene(scene));
}

/**
 * 标记该场景本会话已解锁。真源＝场景数组键（情爱解锁时同写 E85 旧键，兼容既有契约）。
 * 🔴 严格口径：情爱旧键 '1' 不计入数组来源——App.tsx 两处闸门锁定的旧字面会在 once 付讫时无条件写
 *    'ks_compat_session_unlocked'='1'（商道/挚友付讫亦然）；此处若该购买场景非情爱且数组内无情爱 ⇒ 撤回旧键，
 *    保证「一次付费只解锁购买的那个场景」（情爱确已解锁 ⇒ 数组内已有 romance，旧键保留）。
 */
export function markSessionSceneUnlocked(store, scene) {
  const sc = normalizePairScene(scene);
  const list = [];
  try {
    const raw = JSON.parse(String(_get(store, SESSION_SCENES_KEY) || '[]'));
    if (Array.isArray(raw)) for (const s of raw) { const n = normalizePairScene(s); if (n === s && !list.includes(s)) list.push(s); }
  } catch { /* 坏档 ⇒ 重建 */ }
  const list2 = list.filter((s) => s !== sc);
  list2.push(sc);
  _set(store, SESSION_SCENES_KEY, JSON.stringify(list2));
  if (sc === 'romance') _set(store, ROMANCE_UNLOCK_KEY, '1');
  else if (!list2.includes('romance')) _del(store, ROMANCE_UNLOCK_KEY);
  return true;
}

/** 新测算 / 重置沙盒演练 ⇒ 三键全清（付费墙全数恢复） */
export function clearSessionScenes(store) {
  _del(store, ROMANCE_UNLOCK_KEY);
  _del(store, SESSION_SCENES_KEY);
  _del(store, PURCHASE_SCENE_KEY);
}

/** 记下「本次购买所属场景」（付讫回场按此落解锁；跨 reload 存续） */
export function rememberPurchaseScene(store, scene) {
  _set(store, PURCHASE_SCENE_KEY, normalizePairScene(scene));
}

/** 读购买场景（无档/坏档 ⇒ null ⇒ 调用方回落当前场景） */
export function readPurchaseScene(store) {
  const v = _get(store, PURCHASE_SCENE_KEY);
  return v === 'business' || v === 'friendship' || v === 'romance' ? v : null;
}

/** 月/年报归档槽位键（每场景一槽） */
export function sceneArchiveKey(scene) {
  return ARCHIVE_SLOT_PREFIX + normalizePairScene(scene);
}

/** 读该场景归档槽位（坏档 ⇒ null） */
export function readSceneArchive(store, scene) {
  try {
    const a = JSON.parse(String(_get(store, sceneArchiveKey(scene)) || 'null'));
    return a && typeof a === 'object' ? a : null;
  } catch { return null; }
}

/** 写该场景归档槽位（槽内自带 scene 字段，读侧二次核对） */
export function writeSceneArchive(store, a) {
  const sc = normalizePairScene(a && a.scene);
  return _set(store, sceneArchiveKey(sc), JSON.stringify(Object.assign({}, a, { scene: sc })));
}

/* ── 账号级权益（paid_plans 镜像判定；与服务端 compatSceneListed / compatKeyFor 同口径） ── */
function _validAt(v, ts) { return !!v && ts < new Date(v).getTime(); }

/** 全通（年卡/月订）有效期 ⇒ 不受场景限制 */
export function allPassActive(plans, now) {
  const p = plans || {};
  const ts = now instanceof Date ? now.getTime() : Date.now();
  if (p.all_pass_yearly === true && (!p.all_pass_expires_at || _validAt(p.all_pass_expires_at, ts))) return true;
  if (p.all_pass_monthly === true && (!p.all_pass_monthly_expires_at || _validAt(p.all_pass_monthly_expires_at, ts))) return true;
  return false;
}

/** 服务端同款：情爱＝裸签名；商道/挚友＝「签名#场景」 */
export function compatEntitlementKey(sig, scene) {
  if (!sig) return sig;
  const sc = normalizePairScene(scene);
  return sc === 'romance' ? sig : sig + '#' + sc;
}

/** 场景名单判定（情爱：名单含 romance 或名单空＝旧账号布尔位；其余：逐字命中） */
export function scenePlanListed(plans, listKey, scene) {
  const list = plans && Array.isArray(plans[listKey]) ? plans[listKey] : [];
  const sc = normalizePairScene(scene);
  if (sc === 'romance') return list.includes('romance') || list.length === 0;
  return list.includes(sc);
}

/**
 * 账号级场景权益判定（once / monthly / yearly）。
 * @param {object} plans   paid_plans
 * @param {'once'|'monthly'|'yearly'} kind
 * @param {string} scene
 * @param {{comboSig?: string, now?: Date}} [ctx]  once 档须携双盘组合签名
 */
export function accountSceneEntitled(plans, kind, scene, ctx) {
  const p = plans || {};
  const now = (ctx && ctx.now) || new Date();
  if (allPassActive(p, now)) return true;
  const sc = normalizePairScene(scene);
  if (kind === 'once') {
    if (p.compatibility_once !== true) return false;
    const sig = (ctx && ctx.comboSig) || '';
    if (!sig) return false;
    const list = Array.isArray(p.compatibility_once_charts) ? p.compatibility_once_charts : [];
    if (list.length === 0) return sc === 'romance'; // 旧账号位 true 名单空 ⇒ 仅覆盖情爱
    return list.includes(compatEntitlementKey(sig, sc));
  }
  if (kind === 'monthly') {
    if (p.compatibility_monthly_report === true && scenePlanListed(p, COMPAT_SCENE_PLAN_LISTS.monthly, sc)) return true;
  } else if (kind === 'yearly') {
    if (p.compatibility_yearly_report === true && scenePlanListed(p, COMPAT_SCENE_PLAN_LISTS.yearly, sc)) return true;
  }
  const svOk = p.star_monthly_vip === true
    && (Number(p.star_monthly_compatibility_used) || 0) < (Number(p.star_monthly_compatibility_allowance) || 0);
  return svOk;
}
