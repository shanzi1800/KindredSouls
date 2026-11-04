/** E123 情绪记忆贯通核类型声明（companionMoodGreetings.mjs） */
export const ACTIVE_MOOD_KEY: string;
export const ACTIVE_MOOD_TTL_MS: number;
export const ACTIVE_MOOD_WHITELIST: readonly string[];
export const COMPANION_MOOD_GREETINGS: Readonly<
  Record<string, Readonly<Record<string, string>>>
>;
export function writeActiveMood(ss: Storage | null, mood: string): boolean;
export function readActiveMood(ss: Storage | null, now?: Date): string | null;
export function moodGreetingLine(mood: string, lang: string): string | null;
