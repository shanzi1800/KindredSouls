/** E105 金句库类型声明（goldCardQuotes.mjs —— coord-parse.d.ts 先例） */
export interface GoldCardQuoteEntry {
  cardId?: number;
  isReversed?: boolean;
  fallback?: boolean;
  theme: Record<string, string>;
  quote: Record<string, string>;
}
export const GOLD_CARD_QUOTES: Record<'emperor' | 'high_priestess' | 'fire_trine', GoldCardQuoteEntry>;
export interface PickedQuote {
  key: string;
  theme: string;
  quote: string;
}
export function pickGoldCardQuote(cardId: number | null, isReversed: boolean, locale: string): PickedQuote;
