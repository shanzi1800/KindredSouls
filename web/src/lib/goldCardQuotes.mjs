/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌟 E105（主公军令 2026-10-30 刀二）：命盘金卡金句库与提取决策树（纯函数 · 离线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 金句提取优先级决策树（导出瞬间 100% 确定性、零异步 LLM）：
 *   触发导出 → 检查报告核心塔罗牌 →
 *     ├─ 命中主牌正位（emperor=4 / high_priestess=2）→ 塔罗年度启示金句
 *     └─ 未命中或数据缺失 → 八字三合/五行共鸣金句（fire_trine 兜底）
 *   → 注入 metaphysicsTruthTable 口径（cardId 与 E104 tarot 域 parity 锁定）
 *   → 字数断言与 Canvas 折行排版（goldCardLayout.mjs）
 * 🔴 金句文本＝军令钦定六语逐字（闸门 ③-1 零漂移断言锁定，禁改动）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 原型 A：皇帝 · 正位（The Emperor · Upright）—— 守护与秩序 */
/** 原型 B：女祭司 · 正位（The High Priestess · Upright）—— 洞察与沉淀 */
/** 原型 C：八字寅午戌三合火局（Fire Trine Fallback）—— 炽热与共生 */

export const GOLD_CARD_QUOTES = Object.freeze({
  emperor: Object.freeze({
    cardId: 4,
    isReversed: false,
    theme: Object.freeze({
      zh: "守护与秩序", en: "Guardian of Order", fr: "Gardien de l'Ordre",
      es: "Guardián del Orden", th: "ผู้พิทักษ์แห่งระเบียบ", vi: "Người Giữ Trật Tự",
    }),
    quote: Object.freeze({
      zh: "爱不是束缚的利爪，而是坚固的城堡，在护佑中予你自由呼吸的苍穹。",
      en: "Love is not a cage of control, but a fortress of grace where souls breathe freely.",
      fr: "« L'amour n'est point une forteresse de contrôle, mais un sanctuaire de paix. »",
      es: "El amor no es una jaula de dominio, sino un castillo sagrado que da libertad.",
      th: "ความรักไม่ใช่กรงเล็บแห่งการควบคุม แต่เป็นปราสาทที่ให้ที่พักพิงอย่างเสรี",
      vi: "Tình yêu không phải xiềng xích kiểm soát, mà là thành trì dung dưỡng tự do.",
    }),
  }),
  high_priestess: Object.freeze({
    cardId: 2,
    isReversed: false,
    theme: Object.freeze({
      zh: "洞察与沉淀", en: "Keeper of Insight", fr: "Gardienne de l'Intuition",
      es: "Guardiana de la Intuición", th: "ผู้รู้แจ้งแห่งนิ่งนวล", vi: "Người Giữ Trực Giác",
    }),
    quote: Object.freeze({
      zh: "静默的直觉胜过万千喧嚣，宇宙在无声处为你校准命运罗盘。",
      en: "Stillness holds more wisdom than noise; the cosmos realigns your compass in silence.",
      fr: "« L'intuition silencieuse dépasse le bruit du monde ; l'univers vous guide en paix. »",
      es: "La intuición serena supera el ruido; el cosmos calibra tu brújula en silencio.",
      th: "เสียงกระซิบจากภายในเปี่ยมปัญญายิ่งกว่าเสียงรบกวน จักรวาลกำลังนำทางคุณอย่างสงบ",
      vi: "Trực giác tĩnh lặng sâu sắc hơn vạn lời ồn ã; vũ trụ đang âm thầm dẫn lối tâm hồn.",
    }),
  }),
  fire_trine: Object.freeze({
    fallback: true,
    theme: Object.freeze({
      zh: "炽热与共生", en: "Flame of Synergy", fr: "Flamme de Synergie",
      es: "Llama de Sinergia", th: "เปลวไฟแห่งการหลอมรวม", vi: "Ngọn Lửa Cộng Sinh",
    }),
    quote: Object.freeze({
      zh: "命带烈焰星火，差异非隔阂之墙，皆是点亮彼此生命的金石。",
      en: "Flames united across the stars; differences are not walls, but bridges of light.",
      fr: "« Des flammes unies par le destin ; les différences ne sont que des ponts de lumière. »",
      es: "Llamas unidas por el destino; las diferencias no son muros, sino puentes de luz.",
      th: "เปลวไฟแห่งโชคชะตาหลอมรวม ความต่างไม่ใช่กำแพงแต่คือสะพานที่ทอดหากัน",
      vi: "Ngọn lửa duyên định tương phùng; dị biệt không phải bức tường, mà là nhịp cầu ánh sáng.",
    }),
  }),
});

/**
 * 金句提取决策树（塔罗主牌命中 → 八字三合火局兜底）。
 * @param {number|null} cardId 报告核心塔罗牌 id（tarot.ts 真源口径）
 * @param {boolean} isReversed 逆位标记
 * @param {string} locale 六语码
 * @returns {{key: string, theme: string, quote: string}} 确定性出参（零异步）
 */
export function pickGoldCardQuote(cardId, isReversed, locale) {
  const l = GOLD_CARD_QUOTES.emperor.quote[locale] ? locale : "en";
  let entry = null;
  if (cardId != null && !isReversed) {
    if (cardId === GOLD_CARD_QUOTES.emperor.cardId) entry = GOLD_CARD_QUOTES.emperor;
    else if (cardId === GOLD_CARD_QUOTES.high_priestess.cardId) entry = GOLD_CARD_QUOTES.high_priestess;
  }
  if (!entry) entry = GOLD_CARD_QUOTES.fire_trine;
  return {
    key: entry === GOLD_CARD_QUOTES.fire_trine ? "fire_trine"
      : (entry === GOLD_CARD_QUOTES.emperor ? "emperor" : "high_priestess"),
    theme: entry.theme[l],
    quote: entry.quote[l],
  };
}
