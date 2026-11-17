/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E143-ASTRAL-MEMORY-BADGE（主公军令 2026-11-17）：显式记忆星光微标纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（模块一 1.2）：
 *   · 三触发＝首次捕获姓名（writeUserNameProfile 首落档）／首次调用 P1
 *     报告底牌（resolveCompanionGreetingAndQueue 命中 P1）／首次回应 P2
 *     今日情绪 ⇒ 对应回复气泡顶部渲染 11px 毛玻璃星光胶囊；
 *   · 频次约束：单次会话同一类型微标恰 1 次（会话去重集合随
 *     dailyChatSession 档走——badgeLog 白名单字段，E142.1 greetingMode
 *     同形制存/读同源净化）；
 *   · 后台 ks_astral_resonance_log 静默记互动停留时长与追问率（仅计数
 *     元数据，零正文、零 PII）——L2 共情策略自进化数据源。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；六语自容 L_ 字典
 *    （零 i18n 139 键扰动）；fail-closed：白名单外类型一律忽略。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 微标类型白名单（闭集——fail-closed） */
export const ASTRAL_BADGE_TYPES = Object.freeze(['name_first', 'p1_first', 'mood_first']);

/** 后台共振日志存储键（军令钦定；localStorage 白名单在册：E143 新增） */
export const ASTRAL_RESONANCE_LOG_KEY = 'ks_astral_resonance_log';

/** 共振日志环形上限（防 localStorage 膨胀） */
const RESONANCE_LOG_MAX = 50;

/* ═══════════ 六语自容字典（军令译表逐字＋心绪微标三列）═══════════
 * name_first＝姓名记忆微标｜p1_first＝星盘真值微标｜
 * mood_first＝心绪记忆微标（军令三触发之 P2；词条按军令风格自拟六语）。 */
export const L_ASTRAL_BADGES = Object.freeze({
  name_first: Object.freeze({
    zh: '✨ 已记住你的名字', en: '✨ Remembered name', fr: '✨ Prénom mémorisé',
    es: '✨ Nombre recordado', th: '✨ จดจำชื่อแล้ว', vi: '✨ Đã nhớ tên bạn',
  }),
  p1_first: Object.freeze({
    zh: '✨ 已关联本命星盘', en: '✨ Linked natal chart', fr: '✨ Thème astral lié',
    es: '✨ Carta natal unida', th: '✨ เชื่อมดวงชะตาแล้ว', vi: '✨ Đã nối bản đồ sao',
  }),
  mood_first: Object.freeze({
    zh: '✨ 已接住你的今日心绪', en: '✨ Held your feelings today', fr: '✨ Tes émotions du jour, reçues',
    es: '✨ Tus emociones de hoy, acogidas', th: '✨ รับรู้ความรู้สึกของเธอวันนี้แล้ว', vi: '✨ Đã đón nhận tâm sự hôm nay của bạn',
  }),
});

/* ═══════════ 微标判定（纯函数）═══════════ */

/** lang 白名单守卫（六语外 ⇒ en 兜底） */
function sanitizeLang(l) {
  return ['zh', 'en', 'fr', 'es', 'th', 'vi'].includes(String(l || '')) ? String(l) : 'en';
}

/** 微标词条（白名单外类型/lang ⇒ ''——fail-closed 绝不臆造） */
export function badgeLabel(type, lang) {
  if (!ASTRAL_BADGE_TYPES.includes(String(type || ''))) return '';
  const row = L_ASTRAL_BADGES[String(type)];
  return (row && row[sanitizeLang(lang)]) || '';
}

/**
 * 会话去重判定（单会话同类型恰 1 次）。
 * @param {string[]|null|undefined} badgeLog 会话档去重集合（dailyChatSession.badgeLog）
 * @param {string} type 白名单类型键
 * @returns {boolean} true＝本次应渲染（尚未记过）
 */
export function shouldShowBadge(badgeLog, type) {
  if (!ASTRAL_BADGE_TYPES.includes(String(type || ''))) return false;
  return !Array.isArray(badgeLog) || !badgeLog.includes(String(type));
}

/**
 * 记入会话去重集合（返回新数组——坏形状归空重建；上限 3 条恰好覆盖白名单）。
 * 复刻回写由调用方随 dailyChatSession 档 saveDailyChatSession 落键。
 */
export function recordBadge(badgeLog, type) {
  if (!ASTRAL_BADGE_TYPES.includes(String(type || ''))) {
    return Array.isArray(badgeLog) ? badgeLog.slice() : [];
  }
  const base = Array.isArray(badgeLog) ? badgeLog.filter((x) => ASTRAL_BADGE_TYPES.includes(x)) : [];
  if (base.includes(String(type))) return base;
  base.push(String(type));
  return base.slice(0, ASTRAL_BADGE_TYPES.length);
}

/** 会话档 badgeLog 字段净化（存/读同源——E142.1 sanitizeHelloMode 同形制） */
export function sanitizeBadgeLog(v) {
  if (!Array.isArray(v)) return undefined;
  const clean = v.filter((x) => typeof x === 'string' && ASTRAL_BADGE_TYPES.includes(x));
  return clean.length ? clean.slice(0, ASTRAL_BADGE_TYPES.length) : undefined;
}

/* ═══════════ 后台共振日志（零正文零 PII——仅计数元数据）═══════════ */

/**
 * 追加共振日志条目（环形 50 条；坏 store 静默 false）。
 * 条目形状（全部可选计数元数据，严禁正文/姓名/任何 PII）：
 *   { kind: 'chat_round' | 'badge' | 'bond', ts: number,
 *     dwellMs?: number,   // 互动停留时长（毫秒）
 *     followUp?: boolean } // 本轮是否为追问（非首击）
 */
export function appendResonanceLog(store, entry) {
  try {
    if (!store || typeof store.setItem !== 'function') return false;
    const KINDS = ['chat_round', 'badge', 'bond'];
    const e = (entry && typeof entry === 'object') ? entry : null;
    if (!e || !KINDS.includes(String(e.kind || ''))) return false;
    let arr = [];
    try {
      const raw = store.getItem(ASTRAL_RESONANCE_LOG_KEY);
      const v = raw ? JSON.parse(raw) : null;
      if (Array.isArray(v)) arr = v.filter((x) => x && typeof x === 'object' && KINDS.includes(String(x.kind || '')));
    } catch { /* 坏档归零重建 */ }
    arr.push({
      kind: String(e.kind),
      ts: Number.isFinite(Number(e.ts)) ? Number(e.ts) : Date.now(),
      ...(Number.isFinite(Number(e.dwellMs)) ? { dwellMs: Number(e.dwellMs) } : {}),
      ...(typeof e.followUp === 'boolean' ? { followUp: e.followUp } : {}),
    });
    store.setItem(ASTRAL_RESONANCE_LOG_KEY, JSON.stringify(arr.slice(-RESONANCE_LOG_MAX)));
    return true;
  } catch {
    return false; // 隐私模式/写满额 ⇒ 静默降级（对话流绝不因此中断）
  }
}

/** 共振日志统计（追问率＝followUp 命中占比；无档 ⇒ 零态） */
export function readResonanceLogStats(store) {
  try {
    if (!store || typeof store.getItem !== 'function') return { rounds: 0, followUps: 0, followUpRate: 0 };
    const raw = store.getItem(ASTRAL_RESONANCE_LOG_KEY);
    const v = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(v)) return { rounds: 0, followUps: 0, followUpRate: 0 };
    const rounds = v.filter((x) => x && x.kind === 'chat_round');
    const followUps = rounds.filter((x) => x.followUp === true).length;
    return {
      rounds: rounds.length,
      followUps,
      followUpRate: rounds.length ? Math.round((followUps / rounds.length) * 100) / 100 : 0,
    };
  } catch {
    return { rounds: 0, followUps: 0, followUpRate: 0 };
  }
}
