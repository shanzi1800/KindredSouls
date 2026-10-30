/** E107 韦特塔罗真矢量图腾库类型声明（goldCardTotems.mjs —— goldCardChart.d.mts 先例） */
/** 22 张大阿卡纳 cardId 序（tarot.ts 同源 0~21） */
export const TOTEM_CARD_IDS: readonly number[];
/** 图腾 SVG 真源（130×130 线稿；未知 cardId ⇒ 世界牌兜底恒有图） */
export function goldCardTotemSvg(cardId: number | null | undefined): string;
/** data: URI 出口（零跨域——Canvas 绘制恒不 Tainted） */
export function goldCardTotemUri(cardId: number | null | undefined): string;
