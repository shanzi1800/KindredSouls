#!/usr/bin/env node
/**
 * gen-astro-terms.mjs — 从唯一真值源生成前端派生物（Gate 39）
 * ────────────────────────────────────────────────────────────────────────
 * 真值源：astro/astro_terms_dict.json
 * 产物  ：web/src/lib/algos/astroTerms.generated.ts（TS 常量，前端零平台风险消费）
 *
 * 为什么需要生成而非直接 import JSON：
 *   web/tsconfig.app.json 的 include 仅 ["src"] 且未开 resolveJsonModule，
 *   跨目录 import 根 JSON 会触碰 tsc/rootDir 边界；生成 .ts 常量则完全落在 src 内，
 *   tsc / vite 零风险。同时 Gate 39 会断言「生成物 == 字典派生值」，单一真值由机器强制。
 *
 * 幂等：内容不变则不写盘（避免 git 脏）。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const SRC = join(ROOT, 'astro', 'astro_terms_dict.json');
const OUT = join(__dirname, '..', 'src', 'lib', 'algos', 'astroTerms.generated.ts');

const raw = readFileSync(SRC, 'utf8');
const dict = JSON.parse(raw);

const langUnion = dict.meta.langs.map((l) => `'${l}'`).join(' | ');
const langArr = dict.meta.langs.map((l) => `'${l}'`).join(', ');
const lockedArr = dict.meta.lockedLangs.map((l) => `'${l}'`).join(', ');
const extendedArr = dict.meta.extendedLangs.map((l) => `'${l}'`).join(', ');

const content = `/* eslint-disable */
/**
 * astroTerms.generated.ts — 前端多语言术语派生物（Gate 39）
 *
 * ⚠️ 本文件由 web/scripts/gen-astro-terms.mjs 自动生成，**禁止手工修改**。
 *    真值源：astro/astro_terms_dict.json
 *    任何手改都会被 Gate 39 一致性断言判定为失败；重新生成：npm run gen:terms
 *
 * 术语口径：凡前端渲染 / 提示词填充涉及行星、星座、相位、元素、三态、学说词汇，
 * 一律经本文件按 key 硬查，禁止自由机翻直达专业术语。
 */

export type TermLang = ${langUnion};

export const TERM_LANGS: readonly TermLang[] = [${langArr}] as const;
/** 一级核心红线语种（阻塞级） */
export const TERM_LOCKED_LANGS: readonly TermLang[] = [${lockedArr}] as const;
/** 加固守备语种（告警级） */
export const TERM_EXTENDED_LANGS: readonly TermLang[] = [${extendedArr}] as const;

export type TermEntry = Record<TermLang, string>;

export interface AstroTermsDict {
  version: number;
  langs: TermLang[];
  lockedLangs: TermLang[];
  extendedLangs: TermLang[];
  domains: Record<string, Record<string, TermEntry>>;
  slots: {
    budgets: Record<string, { maxGraphemes: number; note: string }>;
    assignment: Record<string, string>;
  };
  reviewPending: { keys: string[]; langs: TermLang[] };
  legacyConflicts: { entries: { id: string; verdict: string }[] };
}

export const ASTRO_TERMS = ${JSON.stringify(dict, null, 2)} as unknown as AstroTermsDict;

export const TERM_DICT_VERSION = ${dict.version};

/** 按 key 硬查术语（域 → 条目 → 语种）；未命中返回 undefined，绝不回退机翻。 */
export function termOf(domain: string, key: string, lang: TermLang): string | undefined {
  return ASTRO_TERMS.domains[domain]?.[key]?.[lang];
}
`;

if (existsSync(OUT) && readFileSync(OUT, 'utf8') === content) {
  console.log('[gen:terms] up-to-date — web/src/lib/algos/astroTerms.generated.ts');
  process.exit(0);
}

writeFileSync(OUT, content, 'utf8');
console.log('[gen:terms] generated — web/src/lib/algos/astroTerms.generated.ts');
