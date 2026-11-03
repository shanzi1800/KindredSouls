/** E120 伴生状态机 FSM v2.0 意图代写触发器类型声明（companionScribeTrigger.mjs） */
export interface ScribeIntentHit { type: string; keyword: string; }
export const SCRIBE_INTENT_REGEX: RegExp;
export const SCRIBE_INTENT_RULES: readonly { type: string; keywords: readonly string[] }[];
export const AMULET_DISPLAY_NAMES: Readonly<Record<string, Readonly<Record<string, string>>>>;
export function detectScribeIntent(text: string): ScribeIntentHit | null;
export function scribeSuggestionLine(amuletName: string, companionName?: string): string;
