/**
 * E146-FOUR-FOLD-REC-ENGINE 类型声明（军令 2026-11-19：四维校准吃喝穿搭推荐）
 * 纯逻辑核（零 DOM/零 i18n）；消费方＝server.js chat 路由 IIFE 后缀拼接。
 */
export const FOURFOLD_LOCALES: string[];
export const SEASONAL_TONES: string[];
export const NATAL_TONES: string[];
export const FOURFOLD_SLOTS: string[];
export const REC_FOCUS: string[];

export interface FourFoldTerms {
  title: Record<string, string>;
  seasonal: Record<string, string>;
  nourish: Record<string, string>;
  aura: Record<string, string>;
}
export const L_FOURFOLD_TERMS: FourFoldTerms;
export const L_SEASONAL_TONE: Record<string, Record<string, string>>;
export const L_NATAL_TONE: Record<string, Record<string, string>>;
export const L_SLOT_FOCUS: Record<string, Record<string, string>>;

export function seasonalToneOf(mode: string): string | null;
export function natalToneOf(
  element: string | null | undefined,
  moonElement: string | null | undefined,
): 'cooling' | 'warming' | 'soothing' | 'steady';
export function fourFoldSlotOf(hour: number): 'morning' | 'afternoon' | 'duskNight' | 'lateNight';
export function resolveRecFocus(
  intent: string | null | undefined,
  dayFirst: boolean | undefined,
): 'food' | 'outfit' | null;
export function detectFourFoldIntent(text: string, lang: string): string | null;

export interface FourFoldCtx {
  dateISO?: string;
  hour?: number;
  intent?: string | null;
  dayFirst?: boolean;
  seasonMode?: string;
  natalElement?: string;
  moonElement?: string | null;
}
export function buildFourFoldPromptBlock(lang: string, ctx?: FourFoldCtx): string;

export interface FourFoldTruthRaw {
  timestamp?: number;
  geoZone?: string | null;
  natalSigns?: string[];
  moonSign?: string | null;
}
export function resolveFourFoldTruth(raw?: FourFoldTruthRaw): {
  seasonMode: string;
  natalElement: string;
  moonElement: string | null;
};
