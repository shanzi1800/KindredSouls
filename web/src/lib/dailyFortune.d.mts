/** 今日命理赋能真值核类型声明（dailyFortune.mjs——E54-2 真源；E120-CHAIN 补声明供类型化导入） */
export const FORTUNE_LANGS: readonly string[];
export function normalizeFortuneLang(lang: string): string;
export const ELEMENT_DIRECTIONS: Readonly<Record<string, readonly string[]>>;
export const SUN_ELEMENT: Readonly<Record<string, string>>;
export function dailySeed(d?: Date): number;
export function fortuneDateKey(d?: Date): string;
export function simpleHash(seed: number, max: number): number;
export function sunElement(sunSign: string): string;
export function directionPool(sunSign: string): Array<{ key: string; [k: string]: string }>;
export interface DailyFortuneResult {
  dateKey: string;
  luckyNumber: number;
  color: { hex: string; name: string };
  flower: { emoji: string; name: string; meaning: string };
  direction: { key: string; name: string };
  element: string;
  vibe: string;
}
export function dailyFortune(opts: { lang?: string; sunSign?: string; date?: Date }): DailyFortuneResult;
