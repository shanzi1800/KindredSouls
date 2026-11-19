/* ═══ 🌟 E145-刀六 ASTRAL-DISTILL-CORE（军令 2026-11-19）：L0-L2 记忆异步蒸馏核 ═══
 *
 * 军令原文：「落地 L0-L2 记忆异步蒸馏核」。
 * 分层口径（纯函数、零 i18n 扰动、零外部依赖——内部键恒英文工程记号）：
 *   L0 原始层：会话原始事件（role/text/ts，截长＋封顶——原始事实不解读）；
 *   L1 结构层：结构化事实（话题命中计数×五域＋轮次＋权益状态＋日首标志）；
 *   L2 偏好层：共情与推荐偏好权重（话题权重归一 0~1＋共情基线＋首席话题）。
 *
 * 铁律（对齐 E143/E144/E145 纯核形制）：
 *   - fail-closed：坏形状（非数组/零用户轮/空文本）⇒ null/[]——蒸馏绝不抛错上流；
 *   - 幂等纯函数：同输入恒同输出（无时钟/无随机——服务端 fire-and-forget 安全）；
 *   - mergeDistilledProfile：跨会话折叠（旧权重半衰 0.5＋新会话叠加，封顶 0.99）。
 * 挂点：server.js familiar/chat done 帧后 setImmediate 异步蒸馏（不阻塞出流）。 */

/** 话题关键词网（六语轻量网——includes 子串，大小写不敏感；命中面宁窄勿宽） */
export const DISTILL_TOPIC_RULES = Object.freeze([
  Object.freeze({
    topic: 'style',
    keywords: Object.freeze(['穿搭', '穿什么', '搭配', '衣服', 'outfit', 'wear', 'dress', 'style', 'ropa', 'vestir', 'tenue', "s'habiller", 'แต่งตัว', 'trang phục', 'mặc']),
  }),
  Object.freeze({
    topic: 'nourish',
    keywords: Object.freeze(['吃', '喝', '吃什么', '美食', '汤', 'food', 'eat', 'drink', 'meal', 'comida', 'comer', 'manger', 'อาหาร', 'đồ ăn', 'ăn']),
  }),
  Object.freeze({
    topic: 'wealth',
    keywords: Object.freeze(['财', '钱', '买', '花', '投资', '签', 'wealth', 'money', 'buy', 'spend', 'invest', 'sign', 'dinero', 'comprar', 'argent', 'riche', 'เงิน', 'ซื้อ', 'tiền', 'mua']),
  }),
  Object.freeze({
    topic: 'love',
    keywords: Object.freeze(['喜欢', '爱', '暧昧', 'TA', 'ta', 'love', 'crush', 'he ', 'she ', 'him', 'her', 'amor', 'aimer', 'cœur', 'รัก', 'เขา', 'yêu', 'anh ấy', 'cô ấy']),
  }),
  Object.freeze({
    topic: 'wellbeing',
    keywords: Object.freeze(['累', '睡', '压力', '心情', '失眠', 'tired', 'sleep', 'stress', 'mood', 'fatigu', 'sommeil', 'stress', 'cansado', 'เหนื่อย', 'นอน', 'mệt', 'ngủ', 'tâm trạng']),
  }),
]);

/** 共情基线情绪网（用户轮命中 ⇒ 共情权重抬升；宁窄勿宽） */
const EMPATHY_RULES = Object.freeze([
  '想你', '难过', '开心', '孤独', '累', 'miss you', 'sad', 'happy', 'lonely', 'tired',
  'manque', 'triste', 'heureux', 'solo', 'te extraño', 'triste', 'เครียด', 'คิดถึง', 'nhớ', 'buồn',
]);

const DISTILL_LANGS = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);
const L0_TEXT_CAP = 480;
const L0_EVENT_CAP = 60;

/**
 * L0 原始层：会话事件归一（截长＋封顶 60 条——尾部最近优先）。
 * @param {Array<{role: string, content?: string, text?: string, ts?: number}>} turns
 * @returns {Array<{role: 'user'|'assistant', text: string, ts: number|null}>} fail-closed []
 */
export function distillL0Events(turns) {
  if (!Array.isArray(turns)) return [];
  const out = [];
  for (const t of turns) {
    if (!t || typeof t !== 'object') continue;
    const role = (t.role === 'user' || t.role === 'assistant') ? t.role : null;
    const text = String(t.content || t.text || '').trim().slice(0, L0_TEXT_CAP);
    if (!role || !text) continue;
    const ts = Number.isFinite(Number(t.ts)) && Number(t.ts) > 0 ? Math.floor(Number(t.ts)) : null;
    out.push(Object.freeze({ role, text, ts }));
  }
  return (out.length > L0_EVENT_CAP) ? out.slice(out.length - L0_EVENT_CAP) : out;
}

/** 话题命中计数（大小写不敏感 includes；宁窄勿宽——零命中为合法形态） */
function countTopics(events) {
  const counts = { style: 0, nourish: 0, wealth: 0, love: 0, wellbeing: 0 };
  for (const ev of events) {
    const low = ev.text.toLowerCase();
    for (const rule of DISTILL_TOPIC_RULES) {
      for (const kw of rule.keywords) {
        if (low.includes(String(kw).toLowerCase())) { counts[rule.topic] += 1; break; }
      }
    }
  }
  return counts;
}

/**
 * L1 结构层：结构化事实（话题计数＋轮次＋权益状态＋日首标志）。
 * @param {Array} l0 归一后事件（distillL0Events 出参）
 * @param {{lang?: string, mode?: string, dayFirst?: boolean,
 *   entitlement?: {romance: boolean, wealth: boolean, basis?: string}|null}} ctx
 * @returns {{version: 'e145', topics: object, turnCount: number, userTurnCount: number,
 *   lang: string, mode: string, dayFirst: boolean, entitlement: object|null, ts: number}}
 */
export function distillL1Facts(l0, ctx) {
  const events = Array.isArray(l0) ? l0 : [];
  const c = (ctx && typeof ctx === 'object') ? ctx : {};
  const topics = countTopics(events);
  const userTurnCount = events.filter((e) => e.role === 'user').length;
  const lang = DISTILL_LANGS.includes(String(c.lang)) ? String(c.lang) : 'en';
  const mode = String(c.mode || '').slice(0, 24) || 'unknown';
  const dayFirst = c.dayFirst === true;
  const ent = (c.entitlement && typeof c.entitlement === 'object')
    ? {
      romance: c.entitlement.romance === true,
      wealth: c.entitlement.wealth === true,
      basis: String(c.entitlement.basis || 'none').slice(0, 40),
    }
    : null;
  return {
    version: 'e145',
    topics,
    turnCount: events.length,
    userTurnCount,
    lang,
    mode,
    dayFirst,
    entitlement: ent,
    ts: Number.isFinite(Number(c.ts)) ? Math.floor(Number(c.ts)) : 0,
  };
}

/**
 * L2 偏好层：共情与推荐偏好权重（话题权重归一 0~1＋共情基线＋首席话题）。
 * @param {{topics: object, userTurnCount: number, turnCount: number, ts: number}} l1
 * @returns {{weights: {style: number, nourish: number, wealth: number, love: number,
 *   wellbeing: number}, empathy: number, topTopic: string|null, topWeight: number}}
 */
export function distillL2Weights(l1) {
  const w = { style: 0, nourish: 0, wealth: 0, love: 0, wellbeing: 0 };
  if (!l1 || typeof l1 !== 'object') return { weights: w, empathy: 0, topTopic: null, topWeight: 0 };
  const denom = Math.max(1, Number(l1.userTurnCount) || 0);
  const round2 = (n) => Math.round(Math.min(0.99, Math.max(0, n)) * 100) / 100;
  let topTopic = null; let topWeight = 0;
  for (const k of Object.keys(w)) {
    w[k] = round2((Number(l1.topics && l1.topics[k]) || 0) / denom);
    if (w[k] > topWeight) { topWeight = w[k]; topTopic = k; }
  }
  const empathy = round2(Math.min(1, (Number(l1.turnCount) || 0) / 12));
  return { weights: w, empathy, topTopic, topWeight };
}

/**
 * 全管线：L0 → L1 → L2 一次蒸馏（服务端 fire-and-forget 消费）。
 * @param {Array} turns 原始会话轮（role/content/text/ts）
 * @param {{lang?: string, mode?: string, dayFirst?: boolean, entitlement?: object|null, ts?: number}} ctx
 * @returns {{l0: Array, l1: object, l2: object, version: 'e145'}|null}
 *   fail-closed：零事件或零用户轮 ⇒ null（蒸馏不上流不抛错）
 */
export function distillSession(turns, ctx) {
  const l0 = distillL0Events(turns);
  if (!l0.length || !l0.some((e) => e.role === 'user')) return null;
  const c = (ctx && typeof ctx === 'object') ? ctx : {};
  const l1 = distillL1Facts(l0, { ...c, ts: c.ts });
  const l2 = distillL2Weights(l1);
  return { l0, l1, l2, version: 'e145' };
}

/**
 * 跨会话折叠：旧画像半衰 0.5 ＋ 本会话叠加（封顶 0.99；首席话题重算）。
 * @param {{l2?: object, sessions?: number}|null} prev 旧画像（坏形状 ⇒ 视同新建）
 * @param {{l2: object}} cur 本会话蒸馏出参（distillSession.l2）
 * @returns {{l2: object, sessions: number, updatedAt: number}}
 */
export function mergeDistilledProfile(prev, cur) {
  const curL2 = (cur && cur.l2 && typeof cur.l2 === 'object') ? cur.l2 : null;
  if (!curL2) return prev || { l2: { weights: { style: 0, nourish: 0, wealth: 0, love: 0, wellbeing: 0 }, empathy: 0, topTopic: null, topWeight: 0 }, sessions: 0, updatedAt: 0 };
  const oldL2 = (prev && prev.l2 && typeof prev.l2 === 'object') ? prev.l2 : null;
  const oldW = (oldL2 && oldL2.weights) || { style: 0, nourish: 0, wealth: 0, love: 0, wellbeing: 0 };
  const newW = curL2.weights || { style: 0, nourish: 0, wealth: 0, love: 0, wellbeing: 0 };
  const round2 = (n) => Math.round(Math.min(0.99, Math.max(0, n)) * 100) / 100;
  const weights = {};
  let topTopic = null; let topWeight = 0;
  for (const k of ['style', 'nourish', 'wealth', 'love', 'wellbeing']) {
    weights[k] = round2((Number(oldW[k]) || 0) * 0.5 + (Number(newW[k]) || 0));
    if (weights[k] > topWeight) { topWeight = weights[k]; topTopic = k; }
  }
  const empathy = round2((Number(oldL2 && oldL2.empathy) || 0) * 0.5 + (Number(curL2.empathy) || 0));
  return {
    l2: { weights, empathy, topTopic, topWeight },
    sessions: (Number(prev && prev.sessions) || 0) + 1,
    updatedAt: Number.isFinite(Number(cur && cur.ts)) ? Math.floor(Number(cur.ts)) : 0,
  };
}

/** 日志安全摘要（内部英文工程记号——不落用户原文，隐私零泄露） */
export function distillProfileSummary(d) {
  if (!d || !d.l2) return 'distill:none';
  const w = d.l2.weights || {};
  const wl = Object.keys(w).map((k) => `${k}=${w[k]}`).join(',');
  return `sessions=${d.sessions || 0} top=${d.l2.topTopic || 'none'}@${d.l2.topWeight || 0} empathy=${d.l2.empathy || 0} [${wl}]`;
}
