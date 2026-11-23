/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🆕 E149-刀二（主公军令 2026-11-20）：L1 记忆轻量「行动回访标记」纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定字段：last_micro_action = { emotion_key, action_summary,
 * created_date, followed_up: boolean }。
 * 写入规则：灵宠给出明确情绪微行动建议（server done 帧 microAction 随行）
 * ⇒ 异步静默写入本核（不阻塞主回复流式输出、不增加前端渲染负担）。
 * 防打扰死锁：每个 last_micro_action 最多触发 1 次次日/隔日回访
 * （followed_up 置 true 后归档）；超过 48 小时未回访自动过期——避免翻旧账。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；fail-closed 坏形状一律 null；
 *   localStorage 可为 null（隐私模式 fail-soft 全静默）。单槽结构——新微
 *   动作覆盖旧档（last_micro_action 语义：只记最近一次）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 存储键（按盘隔离——chartSig 口径与 ks_chat_session/ks_familiar_profile 同构） */
export function microActionKey(chartSig) {
  return `ks_micro_action_${String(chartSig || 'anon')}`;
}

/** E149-刀一 Plutchik 八情绪键集（与 server E149_EMOTION_KEYS 同源——两处同步改） */
export const MICRO_EMOTION_KEYS = Object.freeze([
  'joy', 'sadness', 'trust', 'disgust', 'fear', 'anger', 'surprise', 'anticipation',
]);

/** 48h 过期窗（毫秒） */
export const MICRO_ACTION_TTL_MS = 48 * 3600 * 1000;

/** 本地日键（YYYY-MM-DD——与 dailyChatSession.chatSessionDateKey 同语义） */
function _localDayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 形状守卫＋时效判定纯核（fail-closed）。
 * @param {unknown} v 原始档
 * @param {number} [nowTs] 注入时钟（闸门 fixture 必注入防时间炸弹）
 * @returns {{emotion_key: string, action_summary: string, created_date: string, followed_up: boolean}|null}
 */
export function guardMicroAction(v, nowTs) {
  if (!v || typeof v !== 'object') return null;
  const ek = typeof v.emotion_key === 'string' ? v.emotion_key.trim().toLowerCase() : '';
  const sm = typeof v.action_summary === 'string' ? v.action_summary.trim() : '';
  const cd = typeof v.created_date === 'string' ? v.created_date.trim() : '';
  if (!MICRO_EMOTION_KEYS.includes(ek)) return null;
  if (!sm || sm.length > 120 || /[\r\n]/.test(sm)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cd)) return null;
  const fu = v.followed_up;
  if (typeof fu !== 'boolean') return null;
  if (fu) return null; // 单次死锁：已回访永不二次追问（防翻旧账）
  const t = Date.parse(`${cd}T12:00:00Z`);
  if (!Number.isFinite(t)) return null;
  const now = Number.isFinite(Number(nowTs)) && Number(nowTs) > 0 ? Number(nowTs) : Date.now();
  if (now - t > MICRO_ACTION_TTL_MS) return null; // 48h 过期
  return { emotion_key: ek, action_summary: sm.slice(0, 120), created_date: cd, followed_up: false };
}

/**
 * 读 last_micro_action（48h 过期＋followed_up 死锁在核内判定）。
 * @param {Storage|null} ls localStorage（null ⇒ null fail-soft）
 * @param {string} chartSig 盘签名
 * @param {number} [nowTs] 注入时钟
 */
export function readMicroAction(ls, chartSig, nowTs) {
  if (!ls || typeof ls.getItem !== 'function') return null;
  try {
    const raw = ls.getItem(microActionKey(chartSig));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return guardMicroAction(parsed, nowTs);
  } catch { return null; }
}

/**
 * 异步静默写入（server done 帧 microAction 消费口；新档覆盖旧档单槽）。
 * @param {Storage|null} ls localStorage（null ⇒ false fail-soft）
 * @param {string} chartSig 盘签名
 * @param {{emotion_key?: unknown, action_summary?: unknown, created_date?: unknown}} microAction done 帧随行档
 * @param {number} [nowTs] 注入时钟
 * @returns {boolean} 是否落盘成功
 */
export function writeMicroAction(ls, chartSig, microAction, nowTs) {
  if (!ls || typeof ls.setItem !== 'function') return false;
  const guarded = guardMicroAction({
    emotion_key: microAction && microAction.emotion_key,
    action_summary: microAction && microAction.action_summary,
    created_date: microAction && microAction.created_date,
    followed_up: false,
  }, nowTs);
  if (!guarded) return false;
  try {
    ls.setItem(microActionKey(chartSig), JSON.stringify(guarded));
    return true;
  } catch { return false; }
}

/**
 * 回访归档（单次死锁写回——followed_up 置 true；坏档/隐私 ⇒ false fail-soft）。
 * P3 首句消费后调用一次；此后 readMicroAction 恒 null 直到新动作覆盖。
 * @param {Storage|null} ls localStorage
 * @param {string} chartSig 盘签名
 * @param {number} [nowTs] 注入时钟（同步同窗校验——超窗档直接清除不归档）
 */
export function markMicroActionFollowedUp(ls, chartSig, nowTs) {
  if (!ls || typeof ls.getItem !== 'function' || typeof ls.setItem !== 'function') return false;
  try {
    const key = microActionKey(chartSig);
    const raw = ls.getItem(key);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !MICRO_EMOTION_KEYS.includes(String(parsed.emotion_key))) {
      return false;
    }
    if (parsed.followed_up === true) return false; // 已归档 ⇒ 幂等 fail-soft（单次死锁）
    const cd = String(parsed.created_date || '');
    const t = /^\d{4}-\d{2}-\d{2}$/.test(cd) ? Date.parse(`${cd}T12:00:00Z`) : NaN;
    const now = Number.isFinite(Number(nowTs)) && Number(nowTs) > 0 ? Number(nowTs) : Date.now();
    if (!Number.isFinite(t) || now - t > MICRO_ACTION_TTL_MS) {
      ls.removeItem(key); // 超窗档直接清槽（过期语义：不再回访也不再留存）
      return false;
    }
    ls.setItem(key, JSON.stringify({ ...parsed, followed_up: true }));
    return true;
  } catch { return false; }
}

/** 当地今日键（供写入侧 created_date 口径——客户端本地时区） */
export function microActionTodayKey(nowTs) {
  return _localDayKey(Number.isFinite(Number(nowTs)) && Number(nowTs) > 0 ? Number(nowTs) : Date.now());
}
