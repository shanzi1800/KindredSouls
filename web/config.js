// ── KindredSouls Configuration ──
// This file contains non-sensitive configuration values.
// For sensitive keys, use Vercel Environment Variables.

/**
 * PROMPT_VERSION:
 * Increment this version whenever you update AI Prompt wording.
 * This ensures old cached insights are automatically invalidated.
 * Format: 'v1.0', 'v1.1', etc.
 */
export const PROMPT_VERSION = 'v1.0';

/**
 * CACHE_TTL_HOURS:
 * How long (in hours) should AI insights be cached in Supabase.
 * Default: 24 hours.
 */
export const CACHE_TTL_HOURS = 24;
