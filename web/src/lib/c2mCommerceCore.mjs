/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E145-刀五 C2M-COMMERCE-CORE（军令 2026-11-19）：对话式直购预埋纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（预埋——注册用户满 10 万后开通，默认休眠）：
 *   · 状态机：browse → match → confirm → order → fulfilled（dormant 态下
 *     一切入口 null 锁死——未达门槛普通用户零开放零下单）；
 *   · 五行/能量匹配钩子：本命盘五行与商品五行亲和度评分（相生＞比和＞相克）；
 *   · 零库存一件代发数据结构：商品/订单骨架（supplier 转发载荷——本地零
 *     库存零物流，发货全链由供应商件承接）；
 *   · 门控：registeredUsers >= 100000 或显式总控开关（masterSwitch）任一
 *     满足 ⇒ 'open'；否则 'dormant'（fail-closed）。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络/零组件挂载——本预埋不得向
 *    普通用户暴露任何下单入口）；单测覆盖门控锁死与状态机全迁跃。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** C2M 门槛（军令钦定：注册用户满 10 万） */
export const C2M_USER_THRESHOLD = 100000;

/** 状态机状态闭集（dormant 休眠态为预埋默认） */
export const C2M_STATES = Object.freeze(['dormant', 'browse', 'match', 'confirm', 'order', 'fulfilled']);

/** 合法迁跃表（状态机白名单——非法迁跃一律拒绝 fail-closed） */
const C2M_TRANSITIONS = Object.freeze({
  dormant: Object.freeze([]),                 // 休眠态零迁跃（入口锁死）
  browse: Object.freeze(['match']),
  match: Object.freeze(['confirm', 'browse']),
  confirm: Object.freeze(['order', 'match']),
  order: Object.freeze(['fulfilled', 'confirm']),
  fulfilled: Object.freeze([]),
});

/**
 * C2M 门控判定（军令钦定：注册用户 ≥100000 或显式总控开关）
 * @param {{registeredUsers?: number, masterSwitch?: boolean}} ctx
 * @returns {'dormant'|'open'} 未达门槛 ⇒ 'dormant'（fail-closed）
 */
export function c2mGateStatus(ctx) {
  const c = (ctx && typeof ctx === 'object') ? ctx : {};
  // 运维总闸 kill-switch 恒优先：显式关闭 ⇒ 休眠（fail-closed；满 10 万亦锁死）
  if (c.masterSwitch === false) return 'dormant';
  const users = Number(c.registeredUsers);
  const usersOk = Number.isFinite(users) && users >= C2M_USER_THRESHOLD;
  if (usersOk || c.masterSwitch === true) return 'open';
  return 'dormant';
}

/**
 * 状态机迁跃（白名单表驱动；dormant/非法迁跃 ⇒ null fail-closed）
 * @param {string} from 当前态
 * @param {string} to 目标态
 * @returns {string|null} 合法 ⇒ to；否则 null
 */
export function c2mTransition(from, to) {
  const f = String(from || '');
  const t = String(to || '');
  const row = C2M_TRANSITIONS[f];
  if (!row || !row.includes(t)) return null;
  return t;
}

/* ═══ 五行匹配钩子 ═══ */

/** 五行闭集 */
const ELEMENTS = Object.freeze(['wood', 'fire', 'earth', 'metal', 'water']);

/** 五行相生环（木→火→土→金→水→木）＋相克对（木克土/土克水/水克火/火克金/金克木） */
const GENERATIVE = Object.freeze({ wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' });
const OVERCOMING = Object.freeze({ wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' });

/**
 * 五行亲和度评分（本命盘主五行 × 商品调性五行）
 * 相生（盘生商品/商品生盘）⇒ 90；比和 ⇒ 70；相克 ⇒ 40；非法输入 ⇒ 0（fail-closed）
 * @param {string} chartElement 本命盘主五行
 * @param {string} productElement 商品调性五行
 * @returns {number} 0-100
 */
export function elementMatchScore(chartElement, productElement) {
  const a = String(chartElement || '');
  const b = String(productElement || '');
  if (!ELEMENTS.includes(a) || !ELEMENTS.includes(b)) return 0;
  if (a === b) return 70;                                     // 比和
  if (GENERATIVE[a] === b || GENERATIVE[b] === a) return 90;  // 相生
  if (OVERCOMING[a] === b || OVERCOMING[b] === a) return 40;  // 相克
  return 50;                                                  // 中性兜底
}

/** 匹配阈值（≥75 视为高亲和——「开运与疗愈」推荐候选） */
export const C2M_MATCH_THRESHOLD = 75;

/**
 * 五行匹配钩子（门控 open＋高亲和 ⇒ 候选商品引用；否则 null 锁死）
 * @param {{registeredUsers?: number, masterSwitch?: boolean}} gateCtx
 * @param {string} chartElement
 * @param {Array<{productId: string, element: string}>} catalog 商品目录（调性五行）
 * @returns {Array<{productId: string, score: number}>|null}
 */
export function c2mElementMatches(gateCtx, chartElement, catalog) {
  if (c2mGateStatus(gateCtx) !== 'open') return null; // 休眠 ⇒ 零候选（入口锁死）
  if (!Array.isArray(catalog) || !catalog.length) return null;
  const hits = catalog
    .filter((it) => it && typeof it === 'object' && typeof it.productId === 'string' && it.productId)
    .map((it) => ({ productId: it.productId, score: elementMatchScore(chartElement, it.element) }))
    .filter((r) => r.score >= C2M_MATCH_THRESHOLD)
    .sort((x, y) => y.score - x.score)
    .slice(0, 5);
  return hits.length ? hits : null;
}

/* ═══ 零库存一件代发数据结构（骨架）═══ */

/**
 * 一件代发订单骨架构造（零库存：本地不落库存，发货载荷全链转供应商）
 * @param {{productId: string, sku: string, userId: string, chartElement?: string,
 *   productElement?: string, supplierRef?: string, addressRef?: string}} o
 * @returns {object|null} 坏形状 ⇒ null（fail-closed）；状态恒 'order' 骨架态
 */
export function buildC2MDropshipOrder(o) {
  const d = (o && typeof o === 'object') ? o : null;
  if (!d) return null;
  const productId = String(d.productId || '').trim();
  const sku = String(d.sku || '').trim();
  const userId = String(d.userId || '').trim();
  if (!productId || !sku || !userId) return null;
  return {
    type: 'c2m_dropship',
    state: 'order', // 状态机骨架态（confirm ⇒ order 之后）
    productId,
    sku,
    userId,
    matchScore: elementMatchScore(d.chartElement, d.productElement) || null,
    supplier: {
      ref: String(d.supplierRef || '').trim() || null, // 供应商转发引用（一件代发）
      payload: { productId, sku },                     // 转发载荷（本地零库存）
    },
    fulfillment: 'dropship',  // 零库存一件代发（本地不发货）
    addressRef: String(d.addressRef || '').trim() || null,
    createdAt: new Date().toISOString(),
  };
}
