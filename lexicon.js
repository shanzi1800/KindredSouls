/**
 * lexicon.js — 占星专有名词多语言映射表（Gate 39 · 消费者归正版）
 * 纯 JavaScript（无 TypeScript 语法），用于 server.js 的行星/星座名本地化。
 *
 * ⚠️ 归正说明（E41+ 第二阶段）：
 *   本文件**不再持有任何独立术语字面量**。星座名一律从唯一真值源
 *   astro/astro_terms_dict.json 派生（经 astroTerms.js 适配层）。
 *   语义保持完全向后兼容：LEXICON[lang].signs[SignKey] = 该语种名。
 *     · 泰语取「紧凑式 signsShort」（裸名 เมษ/สิงห์…）—— 因下游 server.js
 *       自行拼 `ราศี` 前缀（见 V80 / V100g 泰语宫位注入），故须为裸名。
 *     · 其余五语取「完整式 signs」。
 *   宫位（houses）不在 Gate 39 射程内，保持既有本地化表（TH 仍用 เรือน，
 *   server.js 运行时另有 ภพ 覆盖，属既存设计，未纳入本次归正）。
 */
import { TERMS_DICT } from './astroTerms.js';

const __signs = TERMS_DICT.domains.signs;
const __signsShort = TERMS_DICT.domains.signsShort;

// ── 星座名（由字典派生：zh/en/es/fr/vi 取完整式，th 取紧凑式裸名）────────────
const SIGNS = Object.fromEntries(
  Object.keys(__signs).map((key) => [
    key,
    {
      zh: __signs[key].zh,
      en: __signs[key].en,
      es: __signs[key].es,
      fr: __signs[key].fr,
      th: __signsShort[key].th,
      vi: __signs[key].vi,
    },
  ])
);

// ── 宫位名 ──────────────────────────────────────────────────────────────────
const HOUSES_ZH = {
  1:'第一宫', 2:'第二宫', 3:'第三宫', 4:'第四宫',
  5:'第五宫', 6:'第六宫', 7:'第七宫', 8:'第八宫',
  9:'第九宫', 10:'第十宫', 11:'第十一宫', 12:'第十二宫',
};
const HOUSES_VI = {
  1:'Nhà 1', 2:'Nhà 2', 3:'Nhà 3', 4:'Nhà 4',
  5:'Nhà 5', 6:'Nhà 6', 7:'Nhà 7', 8:'Nhà 8',
  9:'Nhà 9', 10:'Nhà 10', 11:'Nhà 11', 12:'Nhà 12',
};
const HOUSES_TH = {
  1:'เรือนที่ 1', 2:'เรือนที่ 2', 3:'เรือนที่ 3', 4:'เรือนที่ 4',
  5:'เรือนที่ 5', 6:'เรือนที่ 6', 7:'เรือนที่ 7', 8:'เรือนที่ 8',
  9:'เรือนที่ 9', 10:'เรือนที่ 10', 11:'เรือนที่ 11', 12:'เรือนที่ 12',
};
const HOUSES_ES = {
  1:'Casa 1', 2:'Casa 2', 3:'Casa 3', 4:'Casa 4',
  5:'Casa 5', 6:'Casa 6', 7:'Casa 7', 8:'Casa 8',
  9:'Casa 9', 10:'Casa 10', 11:'Casa 11', 12:'Casa 12',
};
const HOUSES_FR = {
  1:'Maison 1', 2:'Maison 2', 3:'Maison 3', 4:'Maison 4',
  5:'Maison 5', 6:'Maison 6', 7:'Maison 7', 8:'Maison 8',
  9:'Maison 9', 10:'Maison 10', 11:'Maison 11', 12:'Maison 12',
};
const HOUSES_EN = {
  1:'House 1', 2:'House 2', 3:'House 3', 4:'House 4',
  5:'House 5', 6:'House 6', 7:'House 7', 8:'House 8',
  9:'House 9', 10:'House 10', 11:'House 11', 12:'House 12',
};

// ── 整体导出 ────────────────────────────────────────────────────────────────
export const LEXICON = {
  en: { signs: SIGNS, houses: HOUSES_EN },
  zh: { signs: SIGNS, houses: HOUSES_ZH },
  es: { signs: SIGNS, houses: HOUSES_ES },
  fr: { signs: SIGNS, houses: HOUSES_FR },
  th: { signs: SIGNS, houses: HOUSES_TH },
  vi: { signs: SIGNS, houses: HOUSES_VI },
};
