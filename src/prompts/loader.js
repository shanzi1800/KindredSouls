// ═══════════════════════════════════════════════════════════════
// KINDREDSOULS WEALTH ORACLE - MULTI-LANGUAGE PROMPT LOADER
// Architecture: Independent Language Map (ESM Compatible)
//
// ⚠️⚠️ 提示词唯一真源 = 本目录下的 *.txt 文件 ⚠️⚠️
//   - 运行时由本文件 readFileSync 直接读取 .txt;
//   - 必须改 .txt 才生效, 改其它任何形式的副本都不会影响线上;
//   - (V487 P0 技术债清理) 原来的 yearlySystemZH/EN/TH.ts + index.ts 是与 .txt
//     并行维护的孪生漂移源(比 .txt 还大 2.5KB), 全仓零引用、且会让人误以为
//     "改了 .ts 就生效了" —— 已整体删除。历史版本可从 git 记录取回。
//   - 新增语言: 建 yearlySystemXX.txt 并加进下方 SYSTEM_PROMPT_MAP 即可。
// ═══════════════════════════════════════════════════════════════

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load language-specific prompts
const yearlySystemZH = readFileSync(join(__dirname, 'yearlySystemZH.txt'), 'utf-8');
const yearlySystemEN = readFileSync(join(__dirname, 'yearlySystemEN.txt'), 'utf-8');
const yearlySystemTH = readFileSync(join(__dirname, 'yearlySystemTH.txt'), 'utf-8');

/**
 * Multi-Language System Prompt Map
 * Each language gets a 100% pure prompt with NO mixing
 */
export const SYSTEM_PROMPT_MAP = {
  'zh': yearlySystemZH,
  'en': yearlySystemEN,
  'th': yearlySystemTH,
  // Fallback to English for languages not yet implemented
  'fr': yearlySystemEN,
  'es': yearlySystemEN,
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
export const supportedNativeLocales = ['zh', 'en', 'th'];
export function hasNativeLocale(locale) {
  const normalizedLocale = (locale || '').toLowerCase().split('-')[0];
  return supportedNativeLocales.includes(normalizedLocale);
}
