/* eslint-disable */
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
  zh: {
    "Sun": "太阳",
    "Moon": "月亮",
    "Mercury": "水星",
    "Venus": "金星",
    "Mars": "火星",
    "Jupiter": "木星",
    "Saturn": "土星",
    "Uranus": "天王星",
    "Neptune": "海王星",
    "Pluto": "冥王星",
  },
  en: {
    "Sun": "Sun",
    "Moon": "Moon",
    "Mercury": "Mercury",
    "Venus": "Venus",
    "Mars": "Mars",
    "Jupiter": "Jupiter",
    "Saturn": "Saturn",
    "Uranus": "Uranus",
    "Neptune": "Neptune",
    "Pluto": "Pluto",
  },
  es: {
    "Sun": "Sol",
    "Moon": "Luna",
    "Mercury": "Mercurio",
    "Venus": "Venus",
    "Mars": "Marte",
    "Jupiter": "Júpiter",
    "Saturn": "Saturno",
    "Uranus": "Urano",
    "Neptune": "Neptuno",
    "Pluto": "Plutón",
  },
  fr: {
    "Sun": "Soleil",
    "Moon": "Lune",
    "Mercury": "Mercure",
    "Venus": "Vénus",
    "Mars": "Mars",
    "Jupiter": "Jupiter",
    "Saturn": "Saturne",
    "Uranus": "Uranus",
    "Neptune": "Neptune",
    "Pluto": "Pluton",
  },
  th: {
    "Sun": "อาทิตย์",
    "Moon": "จันทร์",
    "Mercury": "พุธ",
    "Venus": "ศุกร์",
    "Mars": "อังคาร",
    "Jupiter": "พฤหัสบดี",
    "Saturn": "เสาร์",
    "Uranus": "ยูเรนัส",
    "Neptune": "เนปจูน",
    "Pluto": "พลูโต",
  },
  vi: {
    "Sun": "Mặt Trời",
    "Moon": "Mặt Trăng",
    "Mercury": "Sao Thủy",
    "Venus": "Sao Kim",
    "Mars": "Sao Hỏa",
    "Jupiter": "Sao Mộc",
    "Saturn": "Sao Thổ",
    "Uranus": "Sao Thiên Vương",
    "Neptune": "Sao Hải Vương",
    "Pluto": "Sao Diêm Vương",
  },
};

/** 合婚五相位 chip 词干（键小写；内联间隔符由消费者按语种书写习惯施加） */
export const SYNASTRY_ASPECTS = {
  zh: {
    "conjunction": "合",
    "sextile": "六合",
    "square": "刑",
    "trine": "三合",
    "opposition": "冲",
  },
  en: {
    "conjunction": "conjunct",
    "sextile": "sextile",
    "square": "square",
    "trine": "trine",
    "opposition": "opposite",
  },
  es: {
    "conjunction": "conjunción",
    "sextile": "sextil",
    "square": "cuadratura",
    "trine": "trígono",
    "opposition": "oposición",
  },
  fr: {
    "conjunction": "conjonction",
    "sextile": "sextile",
    "square": "carré",
    "trine": "trigone",
    "opposition": "opposition",
  },
  th: {
    "conjunction": "ร่วม",
    "sextile": "หก",
    "square": "ฉาก",
    "trine": "ตรีโกณ",
    "opposition": "ตรงข้าม",
  },
  vi: {
    "conjunction": "hợp",
    "sextile": "lục hợp",
    "square": "vuông góc",
    "trine": "tam hợp",
    "opposition": "đối",
  },
};

/** 术语字典版本（与 astro_terms_dict.json 同步） */
export const SYNASTRY_TERMS_VERSION = 1;
