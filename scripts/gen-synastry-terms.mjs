#!/usr/bin/env node
/**
 * gen-synastry-terms.mjs — 合婚术语派生物生成器（Gate 39）
 * ────────────────────────────────────────────────────────────────────────
 * 真值源：astro/astro_terms_dict.json
 *   · domains.planetsShort ⇒ SYNASTRY_PLANETS（行星 chip 词干）
 *   · domains.aspectsShort ⇒ SYNASTRY_ASPECTS（五相位 chip 词干；Gate 40 拔除内联硬编码）
 * 产物  ：api/synastry-terms.generated.js
 *         web/api/synastry-terms.generated.js   ← 两份逐字节相同
 *
 * 为什么需要生成而非直接 import：
 *   api/ai-advisor.js 与 web/api/ai-advisor.js 为**逐字节镜像**（md5 铁律），
 *   但两者所处目录深度不同（`api/` vs `web/api/`），无法以相同的相对路径
 *   import 根适配层 astroTerms.js。故由本生成器把真值**内联**为一份常量文件，
 *   镜像各自 `import './synastry-terms.generated.js'`（同目录、逐字相同），
 *   两份生成物亦逐字节相同 ⇒ 镜像 md5 保持，且真值收敛至唯一字典。
 *
 * 槽位口径：SYNASTRY_I18N 的 planets/aspects 用于内联紧凑短语
 *   （`{a} มุม{asp} {b}` / `{a}{asp}{b} (orb {orb}°)`），属 chip 槽位，
 *   故取 domains.planetsShort / domains.aspectsShort（裸名系 / 短式），
 *   非 domains.planets / domains.aspects（labelCard 全称式）。
 *   🔴 本生成器只做「字典 → JS 常量」的**纯投影**（相位键统一小写），
 *      **不含任何排版逻辑**；词间内联间隔符由消费者按语种书写习惯施加，
 *      故 SYNASTRY_ASPECTS[lang].x === dict.domains.aspectsShort[X][lang] 恒等。
 *
 * 幂等：内容不变则不写盘（避免 git 脏）。重新生成：npm run gen:synastry-terms
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'astro', 'astro_terms_dict.json');
const OUTS = [
  join(ROOT, 'api', 'synastry-terms.generated.js'),
  join(ROOT, 'web', 'api', 'synastry-terms.generated.js'),
];

const dict = JSON.parse(readFileSync(SRC, 'utf8'));
const LANGS = dict.meta.langs;
const PLANETS = dict.domains.planetsShort;
const KEYS = Object.keys(PLANETS);
const ASPECTS = dict.domains.aspectsShort;
const ASPECT_KEYS = Object.keys(ASPECTS);

const blocks = LANGS.map((lang) => {
  const rows = KEYS.map((k) => `    ${JSON.stringify(k)}: ${JSON.stringify(PLANETS[k][lang])},`).join('\n');
  return `  ${lang}: {\n${rows}\n  },`;
}).join('\n');

// 相位键统一小写（与 SYNASTRY_I18N.aspects 既有键名 conjunction/sextile/… 对齐）
const aspectBlocks = LANGS.map((lang) => {
  const rows = ASPECT_KEYS.map((k) => `    ${JSON.stringify(k.toLowerCase())}: ${JSON.stringify(ASPECTS[k][lang])},`).join('\n');
  return `  ${lang}: {\n${rows}\n  },`;
}).join('\n');

const content = `/* eslint-disable */
/**
 * synastry-terms.generated.js — 合婚术语派生物（Gate 39 / Gate 40）
 *
 * ⚠️ 本文件由 scripts/gen-synastry-terms.mjs 自动生成，**禁止手工修改**。
 *    真值源：astro/astro_terms_dict.json（域 domains.planetsShort ↔ SYNASTRY_PLANETS
 *                                      ＋ domains.aspectsShort ↔ SYNASTRY_ASPECTS）
 *    任何手改都会被闸门一致性断言判定为失败；重新生成：npm run gen:synastry-terms
 *
 * 本文件在 api/ 与 web/api/ 两份镜像中**逐字节相同**（内联常量、零路径依赖），
 * 以确保 ai-advisor.js 镜像的 md5 铁律不被破坏。
 *
 * 🔴 纯投影：相位键为小写、值与字典逐字节相同；词间内联间隔符由消费者按语种施加。
 */
export const SYNASTRY_PLANETS = {
${blocks}
};

/** 合婚五相位 chip 词干（键小写；内联间隔符由消费者按语种书写习惯施加） */
export const SYNASTRY_ASPECTS = {
${aspectBlocks}
};

/** 术语字典版本（与 astro_terms_dict.json 同步） */
export const SYNASTRY_TERMS_VERSION = ${dict.version};
`;

let changed = false;
for (const OUT of OUTS) {
  const rel = OUT.slice(ROOT.length + 1);
  if (existsSync(OUT) && readFileSync(OUT, 'utf8') === content) {
    console.log(`[gen:synastry-terms] up-to-date — ${rel}`);
    continue;
  }
  writeFileSync(OUT, content, 'utf8');
  changed = true;
  console.log(`[gen:synastry-terms] generated — ${rel}`);
}
if (!changed) console.log('[gen:synastry-terms] all up-to-date');
