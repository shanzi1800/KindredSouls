/** E114-刀一 22 张大阿卡纳六语牌名单源类型声明（tarotNames.mjs —— goldCardTotems.d.mts 先例） */
export interface TarotNameRow { id: number; name: Record<string, string>; }
export const TAROT_CARD_NAMES: readonly TarotNameRow[];
/** 按 id 查六语牌名（fail-closed：非法 id/语言 ⇒ null，绝不臆造具体牌名） */
export function tarotCardName(id: number | null | undefined, lang: string): string | null;
