/** E106 金卡干支矩阵/格局徽记/六爻卦名 纯函数核类型声明（goldCardChart.mjs —— goldCardLayout.d.mts 先例） */
export interface CardPillars {
  a: [string, string][];
  b: [string, string][];
}
export interface PillarRows {
  labelA: string;
  rowA: string;
  labelB: string;
  rowB: string;
}
export interface CardTrine {
  key: 'fire' | 'metal' | 'water' | 'wood' | 'none';
  badge: string;
}
export interface IchingHeadline {
  ordinal: string;
  name: string;
  upper: string;
  lower: string;
}
export function computeCardPillars(d1: string, d2: string): CardPillars | null;
export function formatPillarRows(locale: string, pillars: CardPillars): PillarRows;
export function deriveCardTrine(locale: string, pillars: CardPillars): CardTrine;
export function parseIchingHeadline(detail: string | null | undefined): IchingHeadline | null;
export function composeHexCardLabel(locale: string, headline: IchingHeadline): string;
export function hexLinePattern(lower: string, upper: string): number[] | null;
