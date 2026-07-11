// ═══════════════════════════════════════════════════════════════
// KINDREDSOULS WEALTH ORACLE - MULTI-LANGUAGE PROMPT LOADER
// Architecture: Independent Language Map (ESM Compatible)
// ═══════════════════════════════════════════════════════════════

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load language-specific prompts
const yearlySystemZH = readFileSync(join(__dirname, 'yearlySystemZH.txt'), 'utf-8');
const yearlySystemEN = readFileSync(join(__dirname, 'yearlySystemEN.txt'), 'utf-8');

/**
 * Multi-Language System Prompt Map
 * Each language gets a 100% pure prompt with NO mixing
 */
export const SYSTEM_PROMPT_MAP = {
  'zh': yearlySystemZH,
  'en': yearlySystemEN,
  // Fallback to English for languages not yet implemented
  'fr': yearlySystemEN,
  'es': yearlySystemEN,
  'th': yearlySystemEN,
  'vi': yearlySystemEN,
};

/**
 * Core Dispatcher: Returns pure language-specific System Prompt
 * @param {string} locale - Language code from frontend ('zh', 'en', 'th', etc.)
 * @returns {string} 100% pure language System Prompt
 */
export function getSystemPromptByLocale(locale) {
  const normalizedLocale = (locale || 'en').toLowerCase().split('-')[0];

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
export function hasNativeLocale(locale) {
  const supported = ['zh', 'en'];
  const normalizedLocale = (locale || '').toLowerCase().split('-')[0];
  return supported.includes(normalizedLocale);
}
