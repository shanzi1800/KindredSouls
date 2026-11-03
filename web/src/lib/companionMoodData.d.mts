/** E120 五维情绪罗盘数据真源＋语调铁律守卫类型声明（companionMoodData.mjs） */
export interface MoodOptionRow {
  archetype: 'radiant' | 'longing' | 'melancholy' | 'agitated' | 'grateful';
  element: 'fire' | 'water' | 'metal' | 'wood' | 'earth';
  icon: string;
  label: Record<string, string>;
  description: Record<string, string>;
}
export interface AstroMoodAttributionRow {
  transitSummary: string;
  energyAspect: string;
  companionComfort: string;
  actionableAdvice: string;
}
export const POSITIVE_ACTION_WORDS: readonly string[];
export const BANNED_PANIC_WORDS: readonly string[];
export const MOOD_LOCALES: readonly string[];
export const MOOD_ARCHETYPES: readonly MoodOptionRow[];
export const MOOD_ATTRIBUTIONS: Readonly<
  Record<'radiant' | 'longing' | 'melancholy' | 'agitated' | 'grateful',
    Readonly<Record<'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi', AstroMoodAttributionRow>>>
>;
export function toneGuard(text: string, locale?: string): {
  positive: boolean;
  bannedHit: string | null;
  actionWord: string | null;
};
export function moodAttribution(
  archetype: string,
  locale: string
): AstroMoodAttributionRow | null;
