// ═══════════════════════════════════════════════════════════════
// KINDREDSOULS WEALTH ORACLE - MULTI-LANGUAGE PROMPT LOADER
// Architecture: Independent Language Map
// ═══════════════════════════════════════════════════════════════

import { yearlySystemZH } from './yearlySystemZH';
import { yearlySystemEN } from './yearlySystemEN';
import { yearlySystemTH } from './yearlySystemTH';
// Future: import { yearlySystemVI } from './yearlySystemVI';
// Future: import { yearlySystemES } from './yearlySystemES';
// Future: import { yearlySystemFR } from './yearlySystemFR';

export type SupportedLocale = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

/**
 * Multi-Language System Prompt Map
 * Each language gets a 100% pure prompt with NO mixing
 */
const SYSTEM_PROMPT_MAP: Record<SupportedLocale, string> = {
  'zh': yearlySystemZH,
  'en': yearlySystemEN,
  // Fallback to English for languages not yet implemented
  'fr': yearlySystemEN,
  'es': yearlySystemEN,
  'th': yearlySystemTH,
  'vi': yearlySystemEN,
};

/**
 * Core Dispatcher: Returns pure language-specific System Prompt
 * @param locale Language code from frontend ('zh', 'en', 'th', etc.)
 * @returns 100% pure language System Prompt
 */
export function getSystemPromptByLocale(locale: string): string {
  const normalizedLocale = locale.toLowerCase().split('-')[0] as SupportedLocale;

  // Defense: Unknown locale falls back to English (global baseline)
  if (!SYSTEM_PROMPT_MAP[normalizedLocale]) {
    console.warn(`[Locale Warning] Unsupported locale: ${locale}. Falling back to 'en'.`);
    return SYSTEM_PROMPT_MAP['en'];
  }

  // Log for debugging
  console.log(`[Locale] Using pure ${normalizedLocale.toUpperCase()} system prompt`);

  return SYSTEM_PROMPT_MAP[normalizedLocale];
}

/**
 * Check if a locale has native implementation (not English fallback)
 */
export function hasNativeLocale(locale: string): boolean {
  const supported = ['zh', 'en', 'th'];
  const normalizedLocale = locale.toLowerCase().split('-')[0];
  return supported.includes(normalizedLocale);
}
