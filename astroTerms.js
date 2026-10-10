/**
 * astroTerms.js — 多语言命理术语「唯一真值」Node 侧适配层（Gate 39）
 * ─────────────────────────────────────────────────────────────────────────
 * 真值源：astro/astro_terms_dict.json（全系统唯一绝对真值表）
 *
 * 本文件只做「有序数组 / 语言映射」的形状转换，**绝不内联任何独立术语字面量**。
 * 任何 Node 侧消费者（lexicon.js / server.js / api/ai-advisor.js / v69_client.js）
 * 都必须经由本文件（或直接读同一 JSON）取词，禁止再硬编码行星/星座/相位等专业术语。
 *
 * 枚举顺序全部由字典键序推导（JSON 对象保序）—— 本文件不含任何手写术语键表。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const DICT = require('./astro/astro_terms_dict.json');

/** 12 星座英文键（黄道序，Aries → Pisces）—— 由字典键序推导 */
export const SIGN_KEYS = Object.keys(DICT.domains.signs);
/** 10 行星英文键（日 → 冥）—— 由字典键序推导 */
export const PLANET_KEYS = Object.keys(DICT.domains.planets);
/** 5 主要相位英文键 —— 由字典键序推导 */
export const ASPECT_KEYS = Object.keys(DICT.domains.aspects);

/** 取某域某语的有序值数组 */
export function termArray(domain, lang) {
  const dom = DICT.domains[domain];
  if (!dom) throw new Error(`astroTerms: 未知域 "${domain}"`);
  return Object.values(dom).map((entry) => entry[lang]);
}

/** 取某域某语的「英文键 → 本地名」映射 */
export function termMap(domain, lang) {
  const dom = DICT.domains[domain];
  if (!dom) throw new Error(`astroTerms: 未知域 "${domain}"`);
  return Object.fromEntries(Object.entries(dom).map(([k, entry]) => [k, entry[lang]]));
}

// ── 星座：6 语有序表 ────────────────────────────────────────────────────────
// 完整式 = signs（labelCard 槽位）；泰语紧凑式 = signsShort（月名族短名，与
// server.js 的 _V516_TH_SIGN_EXCL 字形耦合）—— 见字典 legacyConflicts 登记。
export const SUN_SIGN_EN = termArray('signs', 'en');
export const SUN_SIGN_ES = termArray('signs', 'es');
export const SUN_SIGN_FR = termArray('signs', 'fr');
export const SUN_SIGN_ZH = termArray('signs', 'zh');
export const SUN_SIGN_VI = termArray('signs', 'vi');
export const SUN_SIGN_TH = termArray('signsShort', 'th'); // 泰语裸名（เมษ…），下游自拼 ราศี
export const SUN_SIGN_TH_FULL = termArray('signs', 'th'); // 泰语完整式（ราศีเมษ…）

/** 语言 → 星座有序表（含 th 裸名语义，供 LMAP 系消费者直接取用） */
export const SUN_SIGNS = {
  en: SUN_SIGN_EN,
  es: SUN_SIGN_ES,
  fr: SUN_SIGN_FR,
  zh: SUN_SIGN_ZH,
  vi: SUN_SIGN_VI,
  th: SUN_SIGN_TH,
};

// ── 行星：语言 → { 英文键: 本地名 } ────────────────────────────────────────
export const PLANETS = {
  en: termMap('planets', 'en'),
  zh: termMap('planets', 'zh'),
  es: termMap('planets', 'es'),
  fr: termMap('planets', 'fr'),
  th: termMap('planets', 'th'),
  vi: termMap('planets', 'vi'),
};

// ── 相位：语言 → { 英文键: 本地名 } ────────────────────────────────────────
export const ASPECTS = {
  zh: termMap('aspects', 'zh'),
  en: termMap('aspects', 'en'),
  es: termMap('aspects', 'es'),
  fr: termMap('aspects', 'fr'),
  th: termMap('aspects', 'th'),
  vi: termMap('aspects', 'vi'),
};

// ── 元素 / 三态：语言 → { 英文键: 本地名 } ─────────────────────────────────
export const ELEMENTS = {
  zh: termMap('elements', 'zh'),
  en: termMap('elements', 'en'),
  es: termMap('elements', 'es'),
  fr: termMap('elements', 'fr'),
  th: termMap('elements', 'th'),
  vi: termMap('elements', 'vi'),
};
export const MODES = {
  zh: termMap('modes', 'zh'),
  en: termMap('modes', 'en'),
  es: termMap('modes', 'es'),
  fr: termMap('modes', 'fr'),
  th: termMap('modes', 'th'),
  vi: termMap('modes', 'vi'),
};

/** 原始字典（只读；供需要全量域数据的消费者使用） */
export { DICT as TERMS_DICT };
export const TERMS_VERSION = DICT.version;
