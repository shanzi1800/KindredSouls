/** E105 金卡排版引擎类型声明（goldCardLayout.mjs —— coord-parse.d.ts 先例） */
export interface GoldCardLayoutLocalesEntry {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}
export interface GoldCardLayoutSchema {
  canvasWidth: number;
  canvasHeight: number;
  safeZoneWidth: number;
  centerX: number;
  maxLines: number;
  exportPixelRatio: number;
  locales: Record<string, GoldCardLayoutLocalesEntry>;
}
export const GOLD_CARD_LAYOUT: GoldCardLayoutSchema;
export interface GoldCardTitleEntry {
  primary: string;
  sub: string;
}
export const GOLD_CARD_TITLES: Record<string, GoldCardTitleEntry>;
export const TITLE_FONT: Record<string, number>;
export function tokenizeForWrap(
  text: string,
  locale: string,
  segmenter?: { segment(s: string): Iterable<{ segment: string }> },
): string[];
export interface WrapResult {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  scaled: boolean;
}
export function wrapCardText(
  text: string,
  locale: string,
  measure: (text: string, fontSize: number) => number,
  opts?: {
    fontSize?: number;
    lineHeight?: number;
    maxLines?: number;
    maxWidth?: number;
    minFontSize?: number;
    letterSpacing?: number;
    segmenter?: { segment(s: string): Iterable<{ segment: string }> };
  },
): WrapResult;
export function chartHash(seed: string | number | null | undefined): string;
