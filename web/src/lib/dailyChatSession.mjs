/**
 * dailyChatSession.mjs —— 对话舱按日会话固化核（E113-刀三/刀四 · 主公军令 2026-11-01）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定：对话记录按自然日 24:00 固化（根治「关舱重开丢历史＋首语复读」）：
 *   缓存键  ks_chat_session_${chartSig}_${YYYY-MM-DD}
 *   形状    DailyChatSession {
 *             chartSig: string,
 *             dateStr: string,          // YYYY-MM-DD（本地自然日口径）
 *             expireAt: number,         // 当日 23:59:59.999 毫秒时间戳
 *             messages: Array<{ id: string,
 *               sender: 'user' | 'familiar', text: string, timestamp: number }>,
 *           }
 * 生命周期（军令钦定三则）：
 *   ① 消息变更实时写入 localStorage；
 *   ② 重新打开对话框先查未过期会话——存在且 messages.length > 0 ⇒ 直接复原
 *      全部聊天历史，禁止重复追加首句开场白；
 *   ③ now > expireAt（跨当日 24:00）⇒ 缓存失效自动清理。
 * 伴生（刀四）：ks_familiar_lastchat_day 本地日标记——跨自然日判定真源
 *   （lastChatDay < today 且无当日新解锁报告 ⇒ 首语流转今日幸运锦囊问候）。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络；storage 注入可单测）；
 *    静态字面量键名；坏档/隐私模式/写满额一律 fail-soft（绝不阻断对话流）。
 */

export const LASTCHAT_DAY_KEY = 'ks_familiar_lastchat_day';

const MAX_MSGS = 200;   // 写入条数上限（防 localStorage 无限膨胀）
const MAX_TEXT = 4000;  // 单条文本截断护栏（长流式回复）

/** 军令钦定键名：ks_chat_session_${chartSig}_${YYYY-MM-DD} */
export function chatSessionKey(chartSig, dateStr) {
  return `ks_chat_session_${String(chartSig || 'anon')}_${String(dateStr || '')}`;
}

/** 本地日期键 YYYY-MM-DD（与 familiarHome.localDateKey 同口径——军令「自然日」语义） */
export function chatSessionDateKey(d = new Date()) {
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const day = dt.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 当日 23:59:59.999 毫秒时间戳（本地自然日 24:00 为界——军令钦定 expireAt 真值） */
export function dayEndTimestamp(d = new Date()) {
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return 0;
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 999).getTime();
}

/** 形状守卫：单条消息合法（sender 军令钦定 'user' | 'familiar' 口径） */
function isMsgShape(m) {
  return !!(m && typeof m === 'object'
    && typeof m.id === 'string' && m.id.length > 0
    && typeof m.text === 'string'
    && (m.sender === 'user' || m.sender === 'familiar')
    && Number.isFinite(Number(m.timestamp)));
}

/**
 * 读档（开舱时）——无档/坏档/键值不匹配/已过期（now > expireAt 自动清理）⇒ null。
 * @param {Storage|null} store localStorage 注入
 * @param {string} chartSig 星盘签名（会话缓存键真源）
 * @param {string} dateStr 今日本地日期键 YYYY-MM-DD
 * @param {number} now 当前毫秒时间戳（可注入模拟跨日）
 */
export function loadDailyChatSession(store, chartSig, dateStr, now = Date.now()) {
  try {
    if (!store || typeof store.getItem !== 'function') return null;
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
    const key = chatSessionKey(chartSig, dateStr);
    const raw = store.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    const ok = v && typeof v === 'object'
      && String(v.chartSig || '') === String(chartSig || '')
      && String(v.dateStr || '') === dateStr
      && Number.isFinite(Number(v.expireAt))
      && Array.isArray(v.messages);
    if (!ok) { store.removeItem(key); return null; }        // 坏档 ⇒ 即弃即清
    if (Number(v.expireAt) < now) { store.removeItem(key); return null; } // 军令③：过期失效清理
    return {
      chartSig: String(v.chartSig),
      dateStr: String(v.dateStr),
      expireAt: Number(v.expireAt),
      messages: v.messages.filter(isMsgShape),
    };
  } catch {
    return null; // 坏 JSON/隐私模式 ⇒ 视同无档（fail-soft）
  }
}

/**
 * 写档（消息变更实时写入；组件 role 'user'|'assistant' → 军令 sender 口径转换）。
 * 空文本消息（流式空壳占位）不落档；写入顺带维护跨日判定标记 lastChatDay。
 */
export function saveDailyChatSession(store, chartSig, dateStr, msgs) {
  try {
    if (!store || typeof store.setItem !== 'function') return false;
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    if (!Array.isArray(msgs)) return false;
    const norm = [];
    for (const m of msgs) {
      if (!m || typeof m !== 'object') continue;
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      if (typeof m.text !== 'string' || !m.text) continue;   // 流式空壳不落档
      norm.push({
        id: String(m.id || ''),
        sender: m.role === 'user' ? 'user' : 'familiar',     // 军令钦定 sender 口径
        text: String(m.text).slice(0, MAX_TEXT),
        timestamp: Number.isFinite(Number(m.timestamp)) ? Number(m.timestamp) : Date.now(),
      });
    }
    const sess = {
      chartSig: String(chartSig || 'anon'),
      dateStr: String(dateStr),
      expireAt: dayEndTimestamp(),
      messages: norm.slice(-MAX_MSGS),
    };
    store.setItem(chatSessionKey(chartSig, dateStr), JSON.stringify(sess));
    // 🏆 E113-刀四：跨日判定真源（昨聊过、今无新解锁 ⇒ 首语流转锦囊问候）
    store.setItem(LASTCHAT_DAY_KEY, String(dateStr));
    return true;
  } catch {
    return false; // iOS 无痕/写满额 ⇒ 静默降级（对话流绝不因此中断）
  }
}

/** 读跨日标记（无档/坏格式 ⇒ ''；返回 YYYY-MM-DD） */
export function readLastChatDay(store) {
  try {
    const v = (store && typeof store.getItem === 'function') ? store.getItem(LASTCHAT_DAY_KEY) : null;
    return (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? v : '';
  } catch {
    return '';
  }
}

/** 复原转换：军令 sender 口径 → 组件 role 口径（ChatMsg 形状） */
export function sessionToChatMsgs(sess) {
  if (!sess || !Array.isArray(sess.messages)) return [];
  return sess.messages.map((m) => ({
    id: String(m.id),
    role: m.sender === 'user' ? 'user' : 'assistant',
    text: String(m.text),
  }));
}
