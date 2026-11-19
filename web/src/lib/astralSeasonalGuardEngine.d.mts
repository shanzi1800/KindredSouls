/**
 * E147-SEASONAL-GUARD-ENGINE 类型声明（军令 2026-11-19：餐饮零地名＋着装三维硬锁）
 * 纯逻辑核（零 DOM/零 i18n）；消费方＝server.js chat 路由 IIFE 后缀拼接＋emitDelta 清洗链。
 */
export const E147_LOCALES: string[];
export const CLIMATE_ZONES: string[];
export const AGE_TIERS: string[];
export const FOOD_REGION_PREFIXES: string[];
export const LOCATION_HINT_DICT: Record<string, string[]>;
export const COUNTRY_CLIMATE: Record<string, string[]>;
export const TZ_CLIMATE: Record<string, string[]>;
export const COLD_FABRIC_SWAPS: Array<{ find: string; swap: string }>;
export const L_CLIMATE_TRUTH: Record<string, Record<string, string>>;
export const L_AGE_TIER: Record<string, Record<string, string>>;

export function washFoodRegionPrefix(text: string): string;
export function detectLocationClimateHint(text: string): 'south' | 'tropical' | null;
export function resolveCurrentClimate(raw?: {
  locationText?: string | null;
  countryHeader?: string | null;
  timezone?: string | null;
}): { climate: 'north' | 'south' | 'tropical' | null; source: 'L1-city' | 'L2-country' | 'L3-timezone' | null };
export function climateSeasonOverride(climate: string | null | undefined): {
  geoZoneOverride: string | null;
  seasonModeOverride: string | null;
};
export function ageTierOf(birthDateISO: string | null | undefined, currentYear: number): 'youth' | 'prime' | 'mature' | null;
export function guardSeasonalFabric(text: string, coldClimate: boolean): string;
export function washE147Outbound(text: string, coldClimate: boolean): string;

export interface E147GuardCtx {
  focus?: 'food' | 'outfit' | null;
  climate?: string | null;
  ageTier?: string | null;
}
export function buildE147GuardBlock(lang: string, ctx?: E147GuardCtx): string;
