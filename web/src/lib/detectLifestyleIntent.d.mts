/** E124 生活方式意图探测网类型声明（detectLifestyleIntent.mjs） */
export interface LifestyleIntentHit { type: 'style' | 'roadtrip'; keyword: string; }
export const LIFESTYLE_INTENT_RULES: readonly { type: string; keywords: readonly string[] }[];
export function detectLifestyleIntent(text: string): LifestyleIntentHit | null;
