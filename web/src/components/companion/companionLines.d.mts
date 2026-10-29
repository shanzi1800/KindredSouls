/** E105 伴读台词引擎类型声明（companionLines.mjs —— coord-parse.d.ts 先例） */
export interface CompanionAstInput {
  cardId?: number | null;
  isReversed?: boolean;
  tarotName?: string;
  stage?: string;
}
export function pickCompanionLine(ast: CompanionAstInput, locale: string, anchorKind?: 'tarot' | 'bazi'): string;
export function companionAnchorLine(
  ast: { cardId?: number | null; isReversed?: boolean; tarotName?: string },
  locale: string,
  anchorKind?: 'tarot' | 'bazi',
): string;
