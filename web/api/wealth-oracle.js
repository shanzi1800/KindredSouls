// VERCEL_REDEPLOY_TRIGGER_1782355647180
// Force Node.js 20 runtime (avoid Edge API mismatch)
export const runtime = 'nodejs20.x';

// ── Supabase client (for insight cache) ──
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ── Config (prompt version control) ──
import { PROMPT_VERSION } from '../config.js';

// src/lib/algos/bazi.ts
var TIANGAN = ["\u7532", "\u4E59", "\u4E19", "\u4E01", "\u620A", "\u5DF1", "\u5E9A", "\u8F9B", "\u58EC", "\u7678"];
var DIZHI = ["\u5B50", "\u4E11", "\u5BC5", "\u536F", "\u8FB0", "\u5DF3", "\u5348", "\u672A", "\u7533", "\u9149", "\u620C", "\u4EA5"];
var TG_WUXING = {
  "\u7532": "\u6728",
  "\u4E59": "\u6728",
  "\u4E19": "\u706B",
  "\u4E01": "\u706B",
  "\u620A": "\u571F",
  "\u5DF1": "\u571F",
  "\u5E9A": "\u91D1",
  "\u8F9B": "\u91D1",
  "\u58EC": "\u6C34",
  "\u7678": "\u6C34"
};
var DZ_WUXING = {
  "\u5B50": "\u6C34",
  "\u4E11": "\u571F",
  "\u5BC5": "\u6728",
  "\u536F": "\u6728",
  "\u8FB0": "\u571F",
  "\u5DF3": "\u706B",
  "\u5348": "\u706B",
  "\u672A": "\u571F",
  "\u7533": "\u91D1",
  "\u9149": "\u91D1",
  "\u620C": "\u571F",
  "\u4EA5": "\u6C34"
};
function yearTianGan(year) {
  const idx = (year - 4) % 10;
  return TIANGAN[(idx + 10) % 10];
}
function yearDiZhi(year) {
  const idx = (year - 4) % 12;
  return DIZHI[(idx + 12) % 12];
}
function monthDiZhi(month) {
  const idx = (month + 1) % 12;
  return DIZHI[idx];
}
function monthTianGan(yearTG, monthDZ) {
  const startMap = {
    "\u7532": 0,
    "\u5DF1": 0,
    // 甲己之年丙作首
    "\u4E59": 2,
    "\u5E9A": 2,
    // 乙庚之岁戊为头
    "\u4E19": 4,
    "\u8F9B": 4,
    // 丙辛必定寻庚起
    "\u4E01": 6,
    "\u58EC": 6,
    // 丁壬壬位顺行流
    "\u620A": 8,
    "\u7678": 8
    // 戊癸之年何方觅，甲寅之上好追求
  };
  const monthIdx = DIZHI.indexOf(monthDZ);
  const startIdx = startMap[yearTG] ?? 0;
  return TIANGAN[(startIdx + monthIdx) % 10];
}
function dayStemBranch(year, month, day) {
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1e3 * 60 * 60 * 24));
  const stemIdx = (diffDays % 10 + 10) % 10;
  const branchIdx = (diffDays % 12 + 12) % 12;
  return [TIANGAN[stemIdx], DIZHI[branchIdx]];
}
function paipan(info) {
  const yTG = yearTianGan(info.year);
  const yDZ = yearDiZhi(info.year);
  const mDZ = monthDiZhi(info.month);
  const mTG = monthTianGan(yTG, mDZ);
  const [dTG, dDZ] = dayStemBranch(info.year, info.month, info.day);
  return {
    year: [yTG, yDZ],
    month: [mTG, mDZ],
    day: [dTG, dDZ],
    dayMaster: dTG,
    dayPillar: `${dTG}${dDZ}`
  };
}
function getIndividualBaZiProfile(birthInfo) {
  const sz = paipan(birthInfo);
  const wuxingElements = [
    TG_WUXING[sz.year[0]],
    DZ_WUXING[sz.year[1]],
    TG_WUXING[sz.month[0]],
    DZ_WUXING[sz.month[1]],
    TG_WUXING[sz.day[0]],
    DZ_WUXING[sz.day[1]]
  ];
  const wx = { "\u6728": 0, "\u706B": 0, "\u571F": 0, "\u91D1": 0, "\u6C34": 0 };
  for (const w of wuxingElements) wx[w] = (wx[w] || 0) + 1;
  return {
    sizhu: sz,
    wuxing: wx,
    dayMasterWuxing: TG_WUXING[sz.dayMaster],
    meta: [`DAY_MASTER_${sz.dayMaster}`, `DM_ELEMENT_${TG_WUXING[sz.dayMaster]}`]
  };
}

// src/lib/algos/zodiac.ts
var SIGN_ELEMENT = {
  "\u767D\u7F8A\u5EA7": "\u706B",
  "\u72EE\u5B50\u5EA7": "\u706B",
  "\u5C04\u624B\u5EA7": "\u706B",
  "\u91D1\u725B\u5EA7": "\u571F",
  "\u5904\u5973\u5EA7": "\u571F",
  "\u6469\u7FAF\u5EA7": "\u571F",
  "\u53CC\u5B50\u5EA7": "\u98CE",
  "\u5929\u79E4\u5EA7": "\u98CE",
  "\u6C34\u74F6\u5EA7": "\u98CE",
  "\u5DE8\u87F9\u5EA7": "\u6C34",
  "\u5929\u874E\u5EA7": "\u6C34",
  "\u53CC\u9C7C\u5EA7": "\u6C34"
};
var SIGN_MODE = {
  "\u767D\u7F8A\u5EA7": "\u57FA\u672C",
  "\u5DE8\u87F9\u5EA7": "\u57FA\u672C",
  "\u5929\u79E4\u5EA7": "\u57FA\u672C",
  "\u6469\u7FAF\u5EA7": "\u57FA\u672C",
  "\u91D1\u725B\u5EA7": "\u56FA\u5B9A",
  "\u72EE\u5B50\u5EA7": "\u56FA\u5B9A",
  "\u5929\u874E\u5EA7": "\u56FA\u5B9A",
  "\u6C34\u74F6\u5EA7": "\u56FA\u5B9A",
  "\u53CC\u5B50\u5EA7": "\u53D8\u52A8",
  "\u5C04\u624B\u5EA7": "\u53D8\u52A8",
  "\u53CC\u9C7C\u5EA7": "\u53D8\u52A8",
  "\u5904\u5973\u5EA7": "\u53D8\u52A8"
};
var SIGN_RULER = {
  "\u767D\u7F8A\u5EA7": "\u706B\u661F",
  "\u91D1\u725B\u5EA7": "\u91D1\u661F",
  "\u53CC\u5B50\u5EA7": "\u6C34\u661F",
  "\u5DE8\u87F9\u5EA7": "\u6708\u4EAE",
  "\u72EE\u5B50\u5EA7": "\u592A\u9633",
  "\u5904\u5973\u5EA7": "\u6C34\u661F",
  "\u5929\u79E4\u5EA7": "\u91D1\u661F",
  "\u5929\u874E\u5EA7": "\u51A5\u738B\u661F",
  "\u5C04\u624B\u5EA7": "\u6728\u661F",
  "\u6469\u7FAF\u5EA7": "\u571F\u661F",
  "\u6C34\u74F6\u5EA7": "\u5929\u738B\u661F",
  "\u53CC\u9C7C\u5EA7": "\u6D77\u738B\u661F"
};
var ZODIAC_DATES = [
  { month: 1, day: 19, sign: "\u6469\u7FAF\u5EA7" },
  { month: 1, day: 31, sign: "\u6C34\u74F6\u5EA7" },
  { month: 2, day: 18, sign: "\u6C34\u74F6\u5EA7" },
  { month: 2, day: 29, sign: "\u53CC\u9C7C\u5EA7" },
  { month: 3, day: 20, sign: "\u53CC\u9C7C\u5EA7" },
  { month: 3, day: 31, sign: "\u767D\u7F8A\u5EA7" },
  { month: 4, day: 19, sign: "\u767D\u7F8A\u5EA7" },
  { month: 4, day: 30, sign: "\u91D1\u725B\u5EA7" },
  { month: 5, day: 20, sign: "\u91D1\u725B\u5EA7" },
  { month: 5, day: 31, sign: "\u53CC\u5B50\u5EA7" },
  { month: 6, day: 21, sign: "\u53CC\u5B50\u5EA7" },
  { month: 6, day: 30, sign: "\u5DE8\u87F9\u5EA7" },
  { month: 7, day: 22, sign: "\u5DE8\u87F9\u5EA7" },
  { month: 7, day: 31, sign: "\u72EE\u5B50\u5EA7" },
  { month: 8, day: 22, sign: "\u72EE\u5B50\u5EA7" },
  { month: 8, day: 31, sign: "\u5904\u5973\u5EA7" },
  { month: 9, day: 22, sign: "\u5904\u5973\u5EA7" },
  { month: 9, day: 30, sign: "\u5929\u79E4\u5EA7" },
  { month: 10, day: 23, sign: "\u5929\u79E4\u5EA7" },
  { month: 10, day: 31, sign: "\u5929\u874E\u5EA7" },
  { month: 11, day: 21, sign: "\u5929\u874E\u5EA7" },
  { month: 11, day: 30, sign: "\u5C04\u624B\u5EA7" },
  { month: 12, day: 21, sign: "\u5C04\u624B\u5EA7" },
  { month: 12, day: 31, sign: "\u6469\u7FAF\u5EA7" }
];
function getIndividualZodiacProfile(birthInfo, lang = "zh") {
  const sign = getZodiac(birthInfo.month, birthInfo.day);
  const signName = t(ZODIAC_NAMES[sign], lang);
  return {
    sunSign: signName,
    sunSignElement: t(ELEMENT_NAMES[SIGN_ELEMENT[sign]], lang),
    sunSignMode: t(MODE_NAMES[SIGN_MODE[sign]], lang),
    sunSignRuler: t(RULER_NAMES[SIGN_RULER[sign]], lang),
    moonSign: signName,
    // 简化版：无精确时间暂用太阳座代替
    meta: [`SUN_SIGN_${sign}`, `SUN_ELEMENT_${SIGN_ELEMENT[sign]}`, `SUN_MODE_${SIGN_MODE[sign]}`]
  };
}
function getZodiac(month, day) {
  for (const range of ZODIAC_DATES) {
    if (month === range.month && day <= range.day) return range.sign;
  }
  return "\u6469\u7FAF\u5EA7";
}
function t(dict, lang) {
  return dict[lang] || dict["en"];
}
var ZODIAC_NAMES = {
  "\u767D\u7F8A\u5EA7": { zh: "\u767D\u7F8A\u5EA7", en: "Aries", es: "Aries", fr: "B\xE9lier", th: "\u0E40\u0E21\u0E29", vi: "B\u1EA1ch D\u01B0\u01A1ng" },
  "\u91D1\u725B\u5EA7": { zh: "\u91D1\u725B\u5EA7", en: "Taurus", es: "Tauro", fr: "Taureau", th: "\u0E1E\u0E24\u0E29\u0E20", vi: "Kim Ng\u01B0u" },
  "\u53CC\u5B50\u5EA7": { zh: "\u53CC\u5B50\u5EA7", en: "Gemini", es: "G\xE9minis", fr: "G\xE9meaux", th: "\u0E40\u0E21\u0E16\u0E38\u0E19", vi: "Song T\u1EED" },
  "\u5DE8\u87F9\u5EA7": { zh: "\u5DE8\u87F9\u5EA7", en: "Cancer", es: "C\xE1ncer", fr: "Cancer", th: "\u0E01\u0E23\u0E01\u0E0E", vi: "C\u1EF1 Gi\u1EA3i" },
  "\u72EE\u5B50\u5EA7": { zh: "\u72EE\u5B50\u5EA7", en: "Leo", es: "Leo", fr: "Lion", th: "\u0E2A\u0E34\u0E07\u0E2B\u0E4C", vi: "S\u01B0 T\u1EED" },
  "\u5904\u5973\u5EA7": { zh: "\u5904\u5973\u5EA7", en: "Virgo", es: "Virgo", fr: "Vierge", th: "\u0E01\u0E31\u0E19\u0E22\u0E4C", vi: "X\u1EED N\u1EEF" },
  "\u5929\u79E4\u5EA7": { zh: "\u5929\u79E4\u5EA7", en: "Libra", es: "Libra", fr: "Balance", th: "\u0E15\u0E38\u0E25\u0E22\u0E4C", vi: "Thi\xEAn B\xECnh" },
  "\u5929\u874E\u5EA7": { zh: "\u5929\u874E\u5EA7", en: "Scorpio", es: "Escorpio", fr: "Scorpion", th: "\u0E1E\u0E34\u0E08\u0E34\u0E01", vi: "B\u1ECD C\u1EA1p" },
  "\u5C04\u624B\u5EA7": { zh: "\u5C04\u624B\u5EA7", en: "Sagittarius", es: "Sagitario", fr: "Sagittaire", th: "\u0E18\u0E19\u0E39", vi: "Nh\xE2n M\xE3" },
  "\u6469\u7FAF\u5EA7": { zh: "\u6469\u7FAF\u5EA7", en: "Capricorn", es: "Capricornio", fr: "Capricorne", th: "\u0E21\u0E31\u0E07\u0E01\u0E23", vi: "Ma K\u1EBFt" },
  "\u6C34\u74F6\u5EA7": { zh: "\u6C34\u74F6\u5EA7", en: "Aquarius", es: "Acuario", fr: "Verseau", th: "\u0E01\u0E38\u0E21\u0E20\u0E4C", vi: "B\u1EA3o B\xECnh" },
  "\u53CC\u9C7C\u5EA7": { zh: "\u53CC\u9C7C\u5EA7", en: "Pisces", es: "Piscis", fr: "Poissons", th: "\u0E21\u0E35\u0E19", vi: "Song Ng\u01B0" }
};
var ELEMENT_NAMES = {
  "\u706B": { zh: "\u706B\u8C61", en: "Fire", es: "Fuego", fr: "Feu", th: "\u0E18\u0E32\u0E15\u0E38\u0E44\u0E1F", vi: "H\u1ECFa" },
  "\u571F": { zh: "\u571F\u8C61", en: "Earth", es: "Tierra", fr: "Terre", th: "\u0E18\u0E32\u0E15\u0E38\u0E14\u0E34\u0E19", vi: "Th\u1ED5" },
  "\u98CE": { zh: "\u98CE\u8C61", en: "Air", es: "Aire", fr: "Air", th: "\u0E18\u0E32\u0E15\u0E38\u0E25\u0E21", vi: "Phong" },
  "\u6C34": { zh: "\u6C34\u8C61", en: "Water", es: "Agua", fr: "Eau", th: "\u0E18\u0E32\u0E15\u0E38\u0E19\u0E49\u0E33", vi: "Th\u1EE7y" }
};
var MODE_NAMES = {
  "\u57FA\u672C": { zh: "\u57FA\u672C\u5BAB", en: "Cardinal", es: "Cardinal", fr: "Cardinal", th: "\u0E23\u0E32\u0E28\u0E35\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19", vi: "Cung Th\u1ED1ng L\u0129nh" },
  "\u56FA\u5B9A": { zh: "\u56FA\u5B9A\u5BAB", en: "Fixed", es: "Fijo", fr: "Fixe", th: "\u0E23\u0E32\u0E28\u0E35\u0E04\u0E07\u0E17\u0E35\u0E48", vi: "C\u1ED1 \u0110\u1ECBnh" },
  "\u53D8\u52A8": { zh: "\u53D8\u52A8\u5BAB", en: "Mutable", es: "Mutable", fr: "Mutable", th: "\u0E23\u0E32\u0E28\u0E35\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07", vi: "Cung Linh Ho\u1EA1t" }
};
var RULER_NAMES = {
  "\u706B\u661F": { zh: "\u706B\u661F", en: "Mars", es: "Marte", fr: "Mars", th: "\u0E14\u0E32\u0E27\u0E2D\u0E31\u0E07\u0E04\u0E32\u0E23", vi: "Sao H\u1ECFa" },
  "\u91D1\u661F": { zh: "\u91D1\u661F", en: "Venus", es: "Venus", fr: "V\xE9nus", th: "\u0E14\u0E32\u0E27\u0E28\u0E38\u0E01\u0E23\u0E4C", vi: "Sao Kim" },
  "\u6C34\u661F": { zh: "\u6C34\u661F", en: "Mercury", es: "Mercurio", fr: "Mercure", th: "\u0E14\u0E32\u0E27\u0E1E\u0E38\u0E18", vi: "Sao Th\u1EE7y" },
  "\u6708\u4EAE": { zh: "\u6708\u4EAE", en: "Moon", es: "Luna", fr: "Lune", th: "\u0E14\u0E27\u0E07\u0E08\u0E31\u0E19\u0E17\u0E23\u0E4C", vi: "M\u1EB7t Tr\u0103ng" },
  "\u592A\u9633": { zh: "\u592A\u9633", en: "Sun", es: "Sol", fr: "Soleil", th: "\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C", vi: "M\u1EB7t Tr\u1EDDi" },
  "\u6728\u661F": { zh: "\u6728\u661F", en: "Jupiter", es: "J\xFApiter", fr: "Jupiter", th: "\u0E14\u0E32\u0E27\u0E1E\u0E24\u0E2B\u0E31\u0E2A\u0E1A\u0E14\u0E35", vi: "Sao M\u1ED9c" },
  "\u571F\u661F": { zh: "\u571F\u661F", en: "Saturn", es: "Saturno", fr: "Saturne", th: "\u0E14\u0E32\u0E27\u0E40\u0E2A\u0E32\u0E23\u0E4C", vi: "Sao Th\u1ED5" },
  "\u5929\u738B\u661F": { zh: "\u5929\u738B\u661F", en: "Uranus", es: "Urano", fr: "Uranus", th: "\u0E14\u0E32\u0E27\u0E22\u0E39\u0E40\u0E23\u0E19\u0E31\u0E2A", vi: "Sao Thi\xEAn V\u01B0\u01A1ng" },
  "\u6D77\u738B\u661F": { zh: "\u6D77\u738B\u661F", en: "Neptune", es: "Neptuno", fr: "Neptune", th: "\u0E14\u0E32\u0E27\u0E40\u0E19\u0E1B\u0E08\u0E39\u0E19", vi: "Sao H\u1EA3i V\u01B0\u01A1ng" },
  "\u51A5\u738B\u661F": { zh: "\u51A5\u738B\u661F", en: "Pluto", es: "Plut\xF3n", fr: "Pluton", th: "\u0E14\u0E32\u0E27\u0E1E\u0E25\u0E39\u0E42\u0E15", vi: "Sao Di\xEAm V\u01B0\u01A1ng" }
};

// src/lib/algos/iching-judgment-vi-override.ts
var ICHING_JUDGMENT_VI_OVERRIDE = {
  // ── 已校对（按发现顺序填入）──
  /** 第37卦 风火家人：原"Lợn và cá"→家道和顺 */
  37: "Gia \u0111\u1EA1o h\xF2a thu\u1EADn \u2014 c\xE1t t\u01B0\u1EDDng, l\u1EE3i l\u1ED9c hanh th\xF4ng",
  /** 第61卦 风泽中孚：原"Lợn và cá"→诚心合道 */
  61: "Th\xE0nh t\xE2m hi\u1EC7p \u0111\u1EA1o \u2014 \u0111\u1EA1i c\xE1t, v\u1EA1n s\u1EF1 hanh th\xF4ng",
  /** 第46卦 地风升：原"Sâng"(拼音杂交)→Thăng(正确汉越) */
  46: "T\u1EEBng b\u01B0\u1EDBc \u0111i l\xEAn \u2014 thu\u1EADn bu\u1ED3m xu\xF4i gi\xF3, g\u1EB7p g\u1EE1 qu\xFD nh\xE2n",
  /** 第6卦 天水讼：原"Có phước bị ngăn trở"(机翻)→精校版 */
  6: "B\u1EA5t \u0111\u1ED3ng \xFD ki\u1EBFn \u2014 d\u1EC5 sinh tranh ch\u1EA5p, c\u1EA7n nh\u01B0\u1EDDng nh\u1ECBn \u0111\u1EC3 v\u1EB9n to\xE0n"
  // ── 待校对（逐步添加）──
  // 1: "",
  // 2: "",
  // ...
};
var iching_judgment_vi_override_default = ICHING_JUDGMENT_VI_OVERRIDE;

// src/lib/algos/iching-judgment-th-override.ts
var ICHING_JUDGMENT_TH_OVERRIDE = {
  23: "\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35\u0E17\u0E35\u0E48\u0E08\u0E30\u0E01\u0E49\u0E32\u0E27\u0E44\u0E1B\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32 \u2014 \u0E23\u0E32\u0E01\u0E10\u0E32\u0E19\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E31\u0E48\u0E19\u0E04\u0E25\u0E2D\u0E19 \u0E04\u0E27\u0E23\u0E19\u0E34\u0E48\u0E07\u0E2A\u0E07\u0E1A\u0E41\u0E25\u0E30\u0E1B\u0E01\u0E1B\u0E49\u0E2D\u0E07\u0E15\u0E19\u0E40\u0E2D\u0E07",
  16: "\u0E42\u0E0A\u0E04\u0E14\u0E35\u0E21\u0E32\u0E01 \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07\u0E01\u0E32\u0E23\u0E40\u0E1E\u0E25\u0E34\u0E14\u0E40\u0E1E\u0E25\u0E34\u0E19\u0E08\u0E19\u0E25\u0E37\u0E21\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02\u0E17\u0E35\u0E48\u0E02\u0E32\u0E14\u0E2A\u0E15\u0E34\u0E2D\u0E32\u0E08\u0E19\u0E33\u0E21\u0E32\u0E0B\u0E36\u0E48\u0E07\u0E01\u0E32\u0E23\u0E2A\u0E39\u0E0D\u0E40\u0E2A\u0E35\u0E22",
  37: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u2014 \u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E23\u0E31\u0E27\u0E2D\u0E1A\u0E2D\u0E38\u0E48\u0E19 \u0E01\u0E32\u0E23\u0E40\u0E04\u0E32\u0E23\u0E1E\u0E1A\u0E17\u0E1A\u0E32\u0E17\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E08\u0E30\u0E19\u0E33\u0E1E\u0E32\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E07\u0E1A\u0E2A\u0E38\u0E02\u0E21\u0E32\u0E2A\u0E39\u0E48\u0E1A\u0E49\u0E32\u0E19",
  42: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u2014 \u0E2A\u0E48\u0E07\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E41\u0E25\u0E30\u0E40\u0E15\u0E34\u0E1A\u0E42\u0E15\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19 \u0E19\u0E33\u0E1E\u0E32\u0E42\u0E0A\u0E04\u0E04\u0E25\u0E32\u0E20\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02\u0E21\u0E32\u0E43\u0E2B\u0E49\u0E41\u0E01\u0E48\u0E01\u0E31\u0E19",
  50: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u2014 \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E1A\u0E43\u0E2B\u0E21\u0E48 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E21\u0E35\u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07 \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E08\u0E30\u0E01\u0E49\u0E32\u0E27\u0E2B\u0E19\u0E49\u0E32",
  61: "\u0E42\u0E0A\u0E04\u0E14\u0E35\u0E21\u0E32\u0E01 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E43\u0E08\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08\u0E04\u0E37\u0E2D\u0E01\u0E38\u0E0D\u0E41\u0E08\u0E2A\u0E39\u0E48\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08"
};
var iching_judgment_th_override_default = ICHING_JUDGMENT_TH_OVERRIDE;

// src/lib/algos/iching.ts
function getHexField(hex, field, lang) {
  if (lang === "zh") {
    if (field === "name") return hex.name;
    if (field === "nature") return hex.nature;
    if (field === "judgment") return hex.judgment;
    return hex.relationshipMeaning;
  }
  if (field === "judgment") {
    const hexNum = Object.keys(HEXAGRAMS).find((key2) => HEXAGRAMS[Number(key2)] === hex);
    if (hexNum) {
      if (lang === "th" && iching_judgment_th_override_default[Number(hexNum)]) {
        return iching_judgment_th_override_default[Number(hexNum)];
      }
      if (lang === "vi" && iching_judgment_vi_override_default[Number(hexNum)]) {
        return iching_judgment_vi_override_default[Number(hexNum)];
      }
    }
  }
  const suffixMap = { en: "En", es: "Es", fr: "Fr", th: "Th", vi: "Vi" };
  const suffix = suffixMap[lang] || "En";
  const key = field === "relationshipMeaning" ? "relationshipMeaning" + suffix : field + suffix.charAt(0).toUpperCase() + suffix.slice(1);
  if (hex[key]) return hex[key];
  const enKey = field === "relationshipMeaning" ? "relationshipMeaningEn" : field + "En";
  return hex[enKey] || hex[field] || "";
}
var HEXAGRAMS = {
  1: {
    name: "\u4E7E\u4E3A\u5929",
    nameEn: "The Creative / Heaven",
    nameEs: "Lo Creativo / El Cielo",
    nameFr: "Le Cr\xE9atif / Le Ciel",
    nameTh: "\u0E09\u0E35\u0E22\u0E19 (\u0E1F\u0E49\u0E32)",
    nameVi: "C\xE0n Vi Thi\xEAn",
    symbol: "\u2630\u2630",
    nature: "\u521A\u5065",
    natureEn: "Strong & Vigorous",
    natureTh: "\u0E40\u0E02\u0E49\u0E21\u0E41\u0E02\u0E47\u0E07\u0E41\u0E25\u0E30\u0E21\u0E35\u0E1E\u0E25\u0E31\u0E07",
    natureVi: "M\u1EA1nh m\u1EBD v\xE0 ki\xEAn c\u01B0\u1EDDng",
    natureEs: "Fuerza / Vigor",
    natureFr: "Force / Vigueur",
    judgment: "\u5143\u4EA8\u5229\u8D1E",
    judgmentEn: "Success. The noble person has a successful conclusion.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E1C\u0E39\u0E49\u0E2A\u0E39\u0E07\u0E28\u0E31\u0E01\u0E14\u0E34\u0E4C\u0E08\u0E30\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E1C\u0E25\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
    judgmentVi: "Nguy\xEAn hanh l\u1EE3i ch\xEDnh, ki\xEAn tr\xEC h\u01B0\u1EDFng ph\u01B0\u1EDBc.",
    relationshipMeaning: "\u5927\u5409\u3002\u5145\u6EE1\u6D3B\u529B\u4E0E\u6FC0\u60C5\uFF0C\u5F7C\u6B64\u5438\u5F15\u529B\u5F3A\uFF0C\u4F46\u9700\u9632\u521A\u610E\u81EA\u7528\u5BFC\u81F4\u4E89\u6267\uFF0C\u5B9C\u591A\u5305\u5BB9\u3002",
    relationshipMeaningEn: "Highly auspicious. Full of energy and passion with strong attraction. Avoid stubbornness to prevent conflicts; mutual tolerance is key.",
    relationshipMeaningTh: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E21\u0E35\u0E1E\u0E25\u0E31\u0E07\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E14\u0E36\u0E07\u0E14\u0E39\u0E14\u0E43\u0E08\u0E2A\u0E39\u0E07 \u0E2B\u0E25\u0E35\u0E01\u0E40\u0E25\u0E35\u0E48\u0E22\u0E07\u0E04\u0E27\u0E32\u0E21\u0E14\u0E37\u0E49\u0E2D\u0E23\u0E31\u0E49\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1B\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E19\u0E01\u0E32\u0E23\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07 \u0E04\u0E27\u0E23\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E30\u0E1C\u0E48\u0E2D\u0E19\u0E1B\u0E23\u0E19\u0E43\u0E2B\u0E49\u0E01\u0E31\u0E19",
    relationshipMeaningVi: "\u0110\u1EA1i c\xE1t. \u0110\u1EA7y n\u0103ng l\u01B0\u1EE3ng v\xE0 \u0111am m\xEA, s\u1EE9c h\xFAt \u0111\xF4i b\xEAn m\u1EA1nh m\u1EBD. C\u1EA7n ph\xF2ng t\u1EF1 cao t\u1EF1 \u0111\u1EA1i d\u1EABn \u0111\u1EBFn tranh ch\u1EA5p, n\xEAn bao dung l\u1EABn nhau.",
    category: "\u5927\u5409",
    scoreRange: [85, 96]
  },
  2: {
    name: "\u5764\u4E3A\u5730",
    nameEn: "The Receptive / Earth",
    nameEs: "Lo Receptivo / La Tierra",
    nameFr: "Le R\xE9ceptif / La Terre",
    nameTh: "\u0E04\u0E38\u0E19 (\u0E14\u0E34\u0E19)",
    nameVi: "Kh\xF4n Vi \u0110\u1ECBa",
    symbol: "\u2637\u2637",
    nature: "\u67D4\u987A",
    natureEn: "Yielding & Receptive",
    natureTh: "\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E41\u0E25\u0E30\u0E2D\u0E48\u0E2D\u0E19\u0E19\u0E49\u0E2D\u0E21",
    natureVi: "M\u1EC1m m\u1ECFng v\xE0 bao dung",
    natureEs: "Docilidad / Sumisi\xF3n",
    natureFr: "Docilit\xE9 / Soumission",
    judgment: "\u5143\u4EA8\uFF0C\u5229\u725D\u9A6C\u4E4B\u8D1E",
    judgmentEn: "Supreme success. Furthering through perseverance. No blame.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48 \u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E15\u0E48\u0E2D\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E14\u0E17\u0E19 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E34\u0E14",
    judgmentVi: "Nguy\xEAn hanh, l\u1EE3i v\u1EC1 s\u1EF1 thu\u1EADn theo \u0111\u1EE9c h\xE0nh.",
    relationshipMeaning: "\u5409\u3002\u6027\u683C\u4E92\u8865\uFF0C\u5173\u7CFB\u5305\u5BB9\u7A33\u5B9A\uFF0C\u7EC6\u6C34\u957F\u6D41\u3002\u5973\u65B9\u4E3B\u987A\uFF0C\u7537\u65B9\u4E3B\u62A4\uFF0C\u611F\u60C5\u80FD\u5F00\u82B1\u7ED3\u679C\u3002",
    relationshipMeaningEn: "Auspicious. Complementary personalities bring stability and tolerance. A gentle and protective bond that leads to a fruitful marriage.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E19\u0E34\u0E2A\u0E31\u0E22\u0E40\u0E01\u0E37\u0E49\u0E2D\u0E01\u0E39\u0E25\u0E01\u0E31\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E41\u0E25\u0E30\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E43\u0E19\u0E15\u0E31\u0E27\u0E15\u0E19\u0E02\u0E2D\u0E07\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E31\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E17\u0E35\u0E48\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19\u0E41\u0E25\u0E30\u0E14\u0E39\u0E41\u0E25\u0E01\u0E31\u0E19\u0E08\u0E30\u0E19\u0E33\u0E44\u0E1B\u0E2A\u0E39\u0E48\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
    relationshipMeaningVi: "C\xE1t. T\xEDnh c\xE1ch b\xF9 tr\u1EEB, quan h\u1EC7 bao dung \u1ED5n \u0111\u1ECBnh, b\u1EC1n v\u1EEFng l\xE2u d\xE0i. N\u1EEF thu\u1EADn theo, nam che ch\u1EDF, t\xECnh c\u1EA3m s\u1EBD \u0111\u01A1m hoa k\u1EBFt tr\xE1i.",
    category: "\u5927\u5409",
    scoreRange: [82, 94]
  },
  3: {
    name: "\u6C34\u96F7\u5C6F",
    nameEn: "Difficulty at the Beginning",
    nameEs: "La Dificultad Inicial",
    nameFr: "La Difficult\xE9 Initiale",
    nameTh: "\u0E17\u0E38\u0E19 (\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E01\u0E25\u0E33\u0E1A\u0E32\u0E01\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19)",
    nameVi: "Thu\u1EF7 L\xF4i Tru\xE2n",
    symbol: "\u2635\u2633",
    nature: "\u521D\u751F",
    natureEn: "Beginning of Life",
    natureTh: "\u0E08\u0E38\u0E14\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E0A\u0E35\u0E27\u0E34\u0E15",
    natureVi: "Kh\u1EDFi \u0111\u1EA7u c\u1EE7a s\u1EF1 s\u1ED1ng",
    natureEs: "Nacimiento / Brote inicial",
    natureFr: "Commencement / Bourgeonnement",
    judgment: "\u5143\u4EA8\u5229\u8D1E\uFF0C\u52FF\u7528\u6709\u6538\u5F80",
    judgmentEn: "Great success. Advantageous to cross the great river.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35\u0E17\u0E35\u0E48\u0E08\u0E30\u0E02\u0E49\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E43\u0E2B\u0E0D\u0E48",
    judgmentVi: "Nguy\xEAn hanh l\u1EE3i ch\xEDnh, ch\u01B0a th\u1EDDi h\xE0nh \u0111\u1ED9ng.",
    relationshipMeaning: "\u5E73\u3002\u521B\u4E1A\u6216\u611F\u60C5\u521D\u671F\u5145\u6EE1\u6CE2\u6298\u4E0E\u963B\u788D\uFF0C\u4E0D\u53EF\u64CD\u4E4B\u8FC7\u6025\uFF0C\u9700\u8010\u5FC3\u57F9\u690D\u611F\u60C5\uFF0C\u9759\u5F85\u8F6C\u673A\u3002",
    relationshipMeaningEn: "Neutral. Initial stages are full of twists and obstacles. Do not rush; build the relationship with patience and wait for the turning point.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E0A\u0E48\u0E27\u0E07\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E31\u0E19\u0E1C\u0E27\u0E19 \u0E44\u0E21\u0E48\u0E04\u0E27\u0E23\u0E23\u0E35\u0E1A\u0E23\u0E49\u0E2D\u0E19 \u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E32\u0E28\u0E31\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E14\u0E17\u0E19\u0E41\u0E25\u0E30\u0E23\u0E2D\u0E04\u0E2D\u0E22\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E30\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E14\u0E35",
    relationshipMeaningVi: "B\xECnh. Giai \u0111o\u1EA1n \u0111\u1EA7u nhi\u1EC1u s\xF3ng gi\xF3 v\xE0 tr\u1EDF ng\u1EA1i, kh\xF4ng \u0111\u01B0\u1EE3c n\xF4n n\xF3ng, c\u1EA7n ki\xEAn nh\u1EABn b\u1ED3i \u0111\u1EAFp t\xECnh c\u1EA3m, ch\u1EDD \u0111\u1EE3i th\u1EDDi c\u01A1 chuy\u1EC3n bi\u1EBFn.",
    category: "\u4E2D",
    scoreRange: [58, 72]
  },
  4: {
    name: "\u5C71\u6C34\u8499",
    nameEn: "Youthful Folly",
    nameEs: "La Necedad Juvenil / La Inmadurez",
    nameFr: "La Folie Juv\xE9nile / L'Obscurit\xE9",
    nameTh: "\u0E40\u0E2B\u0E21\u0E34\u0E07 (\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E25\u0E32\u0E02\u0E2D\u0E07\u0E40\u0E22\u0E32\u0E27\u0E4C\u0E27\u0E31\u0E22)",
    nameVi: "S\u01A1n Thu\u1EF7 M\xF4ng",
    symbol: "\u2636\u2633",
    nature: "\u542F\u8499",
    natureEn: "Unaware & Naive",
    natureTh: "\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E41\u0E25\u0E30\u0E44\u0E23\u0E49\u0E40\u0E14\u0E35\u0E22\u0E07\u0E2A\u0E32",
    natureVi: "Ng\u01A1 ng\xE1c v\xE0 ng\xE2y th\u01A1",
    natureEs: "Iluminaci\xF3n / Iniciaci\xF3n",
    natureFr: "\xC9veil / Initiation",
    judgment: "\u4EA8\u3002\u532A\u6211\u6C42\u7AE5\u8499\uFF0C\u7AE5\u8499\u6C42\u6211",
    judgmentEn: "Washing hands but not yet offering. Sincere devotion, solemnity.",
    judgmentTh: "\u0E25\u0E49\u0E32\u0E07\u0E21\u0E37\u0E2D\u0E41\u0E25\u0E49\u0E27\u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E27\u0E32\u0E22 \u0E08\u0E07\u0E2D\u0E38\u0E17\u0E34\u0E28\u0E14\u0E49\u0E27\u0E22\u0E43\u0E08\u0E08\u0E23\u0E34\u0E07 \u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E40\u0E04\u0E32\u0E23\u0E1E",
    judgmentVi: "Hanh th\xF4ng, k\u1EBB ngu mu\u1ED9i t\u1EF1 t\xECm \u0111\u1EBFn ta.",
    relationshipMeaning: "\u51F6\u3002\u6C9F\u901A\u4E0D\u7545\uFF0C\u5145\u6EE1\u8BEF\u89E3\u4E0E\u8FF7\u832B\uFF0C\u4E00\u65B9\u53EF\u80FD\u8F83\u4E3A\u5E7C\u7A1A\u6216\u9690\u7792\u771F\u76F8\u3002\u5B9C\u5766\u8BDA\u76F8\u5F85\uFF0C\u5BFB\u6C42\u957F\u8F88\u6307\u5F15\u3002",
    relationshipMeaningEn: "Inauspicious. Poor communication leading to misunderstandings. One party may be immature or hiding the truth. Be honest and seek elders guidance.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E01\u0E32\u0E23\u0E2A\u0E37\u0E48\u0E2D\u0E2A\u0E32\u0E23\u0E44\u0E21\u0E48\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E01\u0E31\u0E19 \u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E1C\u0E34\u0E14 \u0E1D\u0E48\u0E32\u0E22\u0E43\u0E14\u0E1D\u0E48\u0E32\u0E22\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E2D\u0E32\u0E08\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E42\u0E15\u0E1E\u0E2D \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E08\u0E04\u0E38\u0E22\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E02\u0E2D\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E08\u0E32\u0E01\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E0D\u0E48",
    relationshipMeaningVi: "Hung. S\u1EF1 th\u1EA5u hi\u1EC3u ch\u01B0a th\xF4ng su\u1ED1t, \u0111\u1EA7y hi\u1EC3u l\u1EA7m v\xE0 m\u01A1 h\u1ED3, m\u1ED9t b\xEAn c\xF3 th\u1EC3 kh\xE1 non n\u1EDBt ho\u1EB7c che gi\u1EA5u s\u1EF1 th\u1EADt. N\xEAn th\xE0nh th\u1EADt v\xE0 xin l\u1EDDi khuy\xEAn t\u1EEB ng\u01B0\u1EDDi l\u1EDBn.",
    category: "\u4E2D",
    scoreRange: [60, 74]
  },
  5: {
    name: "\u6C34\u5929\u9700",
    nameEn: "Waiting (Nourishment)",
    nameEs: "La Espera",
    nameFr: "L'Attente",
    nameTh: "\u0E0B\u0E27\u0E35 (\u0E01\u0E32\u0E23\u0E23\u0E2D\u0E04\u0E2D\u0E22)",
    nameVi: "Thu\u1EF7 Thi\xEAn Nhu",
    symbol: "\u2635\u2630",
    nature: "\u7B49\u5F85",
    natureEn: "Patient Waiting",
    natureTh: "\u0E23\u0E2D\u0E04\u0E2D\u0E22\u0E2D\u0E14\u0E17\u0E19",
    natureVi: "Ch\u1EDD \u0111\u1EE3i ki\xEAn nh\u1EABn",
    natureEs: "Espera",
    natureFr: "Attente",
    judgment: "\u6709\u5B5A\uFF0C\u5149\u4EA8\u8D1E\u5409",
    judgmentEn: "Success. Advantageous for litigation.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35\u0E43\u0E19\u0E01\u0E32\u0E23\u0E1F\u0E49\u0E2D\u0E07\u0E23\u0E49\u0E2D\u0E07",
    judgmentVi: "C\xF3 ph\u01B0\u1EDBc, quang minh hanh th\xF4ng, ki\xEAn tr\xEC c\xE1t t\u01B0\u1EDDng.",
    relationshipMeaning: "\u5E73\u3002\u65F6\u673A\u672A\u5230\uFF0C\u4E0D\u53EF\u5F3A\u6C42\u3002\u611F\u60C5\u9700\u7ECF\u5386\u65F6\u95F4\u7684\u8003\u9A8C\uFF0C\u4FDD\u6301\u5B9A\u529B\uFF0C\u987A\u5176\u81EA\u7136\uFF0C\u7EC8\u6709\u5149\u660E\u7ED3\u679C\u3002",
    relationshipMeaningEn: "Neutral. The time is not ripe yet; do not force it. The relationship needs to stand the test of time. Be patient, and a bright outcome will follow.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E08\u0E31\u0E07\u0E2B\u0E27\u0E30\u0E40\u0E27\u0E25\u0E32\u0E22\u0E31\u0E07\u0E21\u0E32\u0E44\u0E21\u0E48\u0E16\u0E36\u0E07 \u0E44\u0E21\u0E48\u0E04\u0E27\u0E23\u0E1D\u0E37\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E1C\u0E48\u0E32\u0E19\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E2A\u0E39\u0E08\u0E19\u0E4C\u0E14\u0E49\u0E27\u0E22\u0E40\u0E27\u0E25\u0E32 \u0E08\u0E07\u0E23\u0E31\u0E01\u0E29\u0E32\u0E04\u0E27\u0E32\u0E21\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E2A\u0E21\u0E2B\u0E27\u0E31\u0E07\u0E43\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14",
    relationshipMeaningVi: "B\xECnh. Th\u1EDDi c\u01A1 ch\u01B0a \u0111\u1EBFn, kh\xF4ng th\u1EC3 khi\xEAn c\u01B0\u1EE1ng. T\xECnh c\u1EA3m c\u1EA7n tr\u1EA3i qua th\u1EED th\xE1ch c\u1EE7a th\u1EDDi gian, gi\u1EEF v\u1EEFng \u0111\u1ECBnh l\u1EF1c, thu\u1EADn theo t\u1EF1 nhi\xEAn s\u1EBD c\xF3 k\u1EBFt qu\u1EA3 t\u1ED1t \u0111\u1EB9p.",
    category: "\u5409",
    scoreRange: [70, 82]
  },
  6: {
    name: "\u5929\u6C34\u8BBC",
    nameEn: "Conflict",
    nameEs: "El Conflicto / El Pleito",
    nameFr: "Le Conflit / Le Litige",
    nameTh: "\u0E0B\u0E48\u0E07 (\u0E01\u0E32\u0E23\u0E42\u0E15\u0E49\u0E40\u0E16\u0E35\u0E22\u0E07)",
    nameVi: "Thi\xEAn Thu\u1EF7 T\u1EE5ng",
    symbol: "\u2630\u2635",
    nature: "\u4E89\u8FA9",
    natureEn: "Conflict & Dispute",
    natureTh: "\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E41\u0E25\u0E30\u0E1E\u0E34\u0E1E\u0E32\u0E17",
    natureVi: "Xung \u0111\u1ED9t v\xE0 tranh c\xE3i",
    natureEs: "Disputa / Litigio",
    natureFr: "Dispute / Contestation",
    judgment: "\u6709\u5B5A\u7A92\u60D5\uFF0C\u4E2D\u5409",
    judgmentEn: "Success. Minor advantages in movement.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E44\u0E14\u0E49\u0E40\u0E1B\u0E23\u0E35\u0E22\u0E1A\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22\u0E43\u0E19\u0E01\u0E32\u0E23\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E27",
    judgmentVi: "C\xF3 ph\u01B0\u1EDBc b\u1ECB ng\u0103n tr\u1EDF, trung gian c\xE1t t\u01B0\u1EDDng.",
    relationshipMeaning: "\u51F6\u3002\u610F\u89C1\u4E25\u91CD\u4E0D\u5408\uFF0C\u53E3\u820C\u4E89\u5435\u4E0D\u65AD\uFF0C\u751A\u81F3\u6709\u5206\u79BB\u4E4B\u5FE7\u3002\u5404\u4E0D\u76F8\u8BA9\u53EA\u4F1A\u6D41\u5411\u4E24\u8D25\u4FF1\u4F24\uFF0C\u5B9C\u9000\u8BA9\u548C\u89E3\u3002",
    relationshipMeaningEn: "Inauspicious. Severe disagreement and constant arguments, risking separation. Stubbornness leads to mutual ruin; compromise and withdrawal are advised.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E2B\u0E47\u0E19\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E01\u0E31\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E23\u0E38\u0E19\u0E41\u0E23\u0E07 \u0E21\u0E35\u0E1B\u0E32\u0E01\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E44\u0E21\u0E48\u0E40\u0E27\u0E49\u0E19\u0E41\u0E15\u0E48\u0E25\u0E30\u0E27\u0E31\u0E19 \u0E2B\u0E32\u0E01\u0E44\u0E21\u0E48\u0E22\u0E2D\u0E21\u0E25\u0E14\u0E23\u0E32\u0E27\u0E32\u0E28\u0E2D\u0E01\u0E08\u0E30\u0E19\u0E33\u0E44\u0E1B\u0E2A\u0E39\u0E48\u0E04\u0E27\u0E32\u0E21\u0E41\u0E15\u0E01\u0E2B\u0E31\u0E01 \u0E04\u0E27\u0E23\u0E1B\u0E23\u0E30\u0E19\u0E35\u0E1B\u0E23\u0E30\u0E19\u0E2D\u0E21",
    relationshipMeaningVi: "Hung. \xDD ki\u1EBFn b\u1EA5t \u0111\u1ED3ng s\xE2u s\u1EAFc, kh\u1EA9u thi\u1EC7t tranh c\xE3i kh\xF4ng ng\u1EEBng, th\u1EADm ch\xED c\xF3 nguy c\u01A1 chia ly. Kh\xF4ng ai nh\u01B0\u1EDDng ai s\u1EBD d\u1EABn \u0111\u1EBFn l\u01B0\u1EE1ng b\u1EA1i c\xE2u th\u01B0\u01A1ng, n\xEAn l\xF9i b\u01B0\u1EDBc h\xF2a gi\u1EA3i.",
    category: "\u5C0F\u51F6",
    scoreRange: [48, 62]
  },
  7: {
    name: "\u5730\u6C34\u5E08",
    nameEn: "The Army",
    nameEs: "El Ej\xE9rcito",
    nameFr: "L'Arm\xE9e",
    nameTh: "\u0E0B\u0E37\u0E2D (\u0E01\u0E2D\u0E07\u0E17\u0E31\u0E1E)",
    nameVi: "\u0110\u1ECBa Thu\u1EF7 S\u01B0",
    symbol: "\u2637\u2635",
    nature: "\u7EDF\u9886",
    natureEn: "Disciplined Force",
    natureTh: "\u0E01\u0E2D\u0E07\u0E01\u0E33\u0E25\u0E31\u0E07\u0E21\u0E35\u0E27\u0E34\u0E19\u0E31\u0E22",
    natureVi: "L\u1EF1c l\u01B0\u1EE3ng k\u1EF7 lu\u1EADt",
    natureEs: "Mando / Liderazgo",
    natureFr: "Commandement / Direction",
    judgment: "\u8D1E\u4E08\u4EBA\u5409\u65E0\u548E",
    judgmentEn: "Advantageous to persevere. Not eating at home - good fortune.",
    judgmentTh: "\u0E2D\u0E14\u0E17\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E44\u0E21\u0E48\u0E01\u0E34\u0E19\u0E02\u0E49\u0E32\u0E27\u0E17\u0E35\u0E48\u0E1A\u0E49\u0E32\u0E19\u2014\u0E42\u0E0A\u0E04\u0E14\u0E35",
    judgmentVi: "Ki\xEAn tr\xEC theo \u0111\u1EE9c l\u1EDBn, c\xE1t t\u01B0\u1EDDng kh\xF4ng l\u1ED7i.",
    relationshipMeaning: "\u5E73\u3002\u611F\u60C5\u5E26\u6709\u5F3A\u70C8\u7684\u63A7\u5236\u6B32\u6216\u7ADE\u4E89\u8272\u5F69\uFF0C\u9700\u8981\u4E25\u683C\u7684\u81EA\u6211\u7EA6\u675F\u3002\u4E3B\u5BFC\u8005\u9700\u4EE5\u5FB7\u670D\u4EBA\uFF0C\u907F\u514D\u6D41\u4E8E\u51B7\u6218\u3002",
    relationshipMeaningEn: "Neutral. Relationship involves strong control or competition, requiring self-discipline. The dominant partner must lead with virtue to avoid cold wars.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E41\u0E02\u0E48\u0E07\u0E02\u0E31\u0E19\u0E2A\u0E39\u0E07 \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E27\u0E34\u0E19\u0E31\u0E22\u0E43\u0E19\u0E15\u0E19\u0E40\u0E2D\u0E07 \u0E1D\u0E48\u0E32\u0E22\u0E17\u0E35\u0E48\u0E19\u0E33\u0E04\u0E27\u0E23\u0E43\u0E0A\u0E49\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E2D\u0E33\u0E19\u0E32\u0E08",
    relationshipMeaningVi: "B\xECnh. T\xECnh c\u1EA3m mang t\xEDnh ki\u1EC3m so\xE1t ho\u1EB7c c\u1EA1nh tranh m\u1EA1nh m\u1EBD, c\u1EA7n t\u1EF1 k\u1EF7 lu\u1EADt nghi\xEAm ng\u1EB7t. Ng\u01B0\u1EDDi l\xE0m ch\u1EE7 c\u1EA7n ph\u1EE5c ch\xFAng b\u1EB1ng \u0111\u1EE9c, tr\xE1nh r\u01A1i v\xE0o chi\u1EBFn tranh l\u1EA1nh.",
    category: "\u4E2D",
    scoreRange: [56, 70]
  },
  8: {
    name: "\u6C34\u5730\u6BD4",
    nameEn: "Holding Together",
    nameEs: "La Uni\xF3n / La Solidaridad",
    nameFr: "L'Union / La Solidarit\xE9",
    nameTh: "\u0E1B\u0E35\u0E48 (\u0E01\u0E32\u0E23\u0E40\u0E04\u0E35\u0E22\u0E07\u0E04\u0E39\u0E48)",
    nameVi: "Thu\u1EF7 \u0110\u1ECBa T\u1EF7",
    symbol: "\u2635\u2637",
    nature: "\u4EB2\u8F85",
    natureEn: "Close Support",
    natureTh: "\u0E2A\u0E19\u0E31\u0E1A\u0E2A\u0E19\u0E38\u0E19\u0E43\u0E01\u0E25\u0E49\u0E0A\u0E34\u0E14",
    natureVi: "H\u1ED7 tr\u1EE3 g\u1EA7n g\u0169i",
    natureEs: "Afinidad / Apoyo mutuo",
    natureFr: "Affinit\xE9 / Entraide",
    judgment: "\u5409\u3002\u539F\u7B6E\u5143\u6C38\u8D1E\u65E0\u548E",
    judgmentEn: "Divination auspicious. Observe the jaws, provide for yourself.",
    judgmentTh: "\u0E17\u0E33\u0E19\u0E32\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25 \u0E2A\u0E31\u0E07\u0E40\u0E01\u0E15\u0E40\u0E02\u0E35\u0E49\u0E22\u0E27 \u0E40\u0E15\u0E23\u0E35\u0E22\u0E21\u0E1E\u0E2D\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E15\u0E19",
    judgmentVi: "Nguy\xEAn th\u1EED nguy\xEAn v\u0129nh ki\xEAn, kh\xF4ng l\u1ED7i.",
    relationshipMeaning: "\u5409\u3002\u4EB2\u5BC6\u65E0\u95F4\uFF0C\u76F8\u4EB2\u76F8\u7231\uFF0C\u4E92\u4F9D\u4E92\u9760\u3002\u5355\u8EAB\u8005\u6613\u9047\u826F\u7F18\uFF0C\u604B\u7231\u8005\u5229\u4E8E\u8C08\u5A5A\u8BBA\u5AC1\uFF0C\u662F\u4E00\u6BB5\u548C\u4E50\u878D\u878D\u7684\u5173\u7CFB\u3002",
    relationshipMeaningEn: "Auspicious. Close and affectionate, relying mutually on each other. Singles find good matches; couples will find it ideal for marriage discussion.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E43\u0E01\u0E25\u0E49\u0E0A\u0E34\u0E14 \u0E2A\u0E19\u0E34\u0E17\u0E2A\u0E19\u0E21\u0E41\u0E25\u0E30\u0E1E\u0E36\u0E48\u0E07\u0E1E\u0E32\u0E2D\u0E32\u0E28\u0E31\u0E22\u0E01\u0E31\u0E19 \u0E04\u0E19\u0E42\u0E2A\u0E14\u0E21\u0E35\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E1E\u0E1A\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E04\u0E39\u0E48 \u0E04\u0E19\u0E21\u0E35\u0E04\u0E39\u0E48\u0E40\u0E2B\u0E21\u0E32\u0E30\u0E41\u0E01\u0E48\u0E01\u0E32\u0E23\u0E40\u0E08\u0E23\u0E08\u0E32\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19\u0E41\u0E25\u0E30\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E23\u0E31\u0E27",
    relationshipMeaningVi: "C\xE1t. Th\xE2n m\u1EADt kh\u0103ng kh\xEDt, t\u01B0\u01A1ng th\xE2n t\u01B0\u01A1ng \xE1i, n\u01B0\u01A1ng t\u1EF1a l\u1EABn nhau. Ng\u01B0\u1EDDi \u0111\u1ED9c th\xE2n d\u1EC5 g\u1EB7p l\u01B0\u01A1ng duy\xEAn, ng\u01B0\u1EDDi \u0111ang y\xEAu l\u1EE3i cho vi\u1EC7c b\xE0n t\xEDnh h\xF4n nh\xE2n.",
    category: "\u5409",
    scoreRange: [76, 88]
  },
  9: {
    name: "\u98CE\u5929\u5C0F\u755C",
    nameEn: "Small Taming",
    nameEs: "La Fuerza Domesticadora de lo Peque\xF1o",
    nameFr: "Le Pouvoir d'Apprivoisement du Petit",
    nameTh: "\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E39\u0E48 (\u0E01\u0E32\u0E23\u0E2A\u0E30\u0E2A\u0E21\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22)",
    nameVi: "Phong Thi\xEAn Ti\u1EC3u S\xFAc",
    symbol: "\u2634\u2630",
    nature: "\u84C4\u517B",
    natureEn: "Nourishing Accumulation",
    natureTh: "\u0E2A\u0E30\u0E2A\u0E21\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E14\u0E39",
    natureVi: "T\xEDch l\u0169y nu\xF4i d\u01B0\u1EE1ng",
    natureEs: "Acumulaci\xF3n Menor / Crianza",
    natureFr: "Accumulation Mineure / \xC9levage",
    judgment: "\u4EA8\u3002\u5BC6\u4E91\u4E0D\u96E8",
    judgmentEn: "The ridgepole sags. Advantageous to move. Success.",
    judgmentTh: "\u0E04\u0E32\u0E19\u0E1A\u0E49\u0E32\u0E19\u0E17\u0E23\u0E38\u0E14 \u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E27\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
    judgmentVi: "Hanh th\xF4ng, m\xE2y \u0111\u1EB7c ch\u01B0a h\u1EA1 m\u01B0a.",
    relationshipMeaning: "\u5E73\u3002\u611F\u60C5\u867D\u6709\u5FAE\u5C0F\u8FDB\u5C55\uFF0C\u4F46\u963B\u529B\u72B9\u5B58\uFF0C\u5E38\u56E0\u751F\u6D3B\u7410\u4E8B\u4EA7\u751F\u6469\u64E6\u3002\u4E0D\u53EF\u6025\u4E8E\u6C42\u6210\uFF0C\u9700\u8010\u5FC3\u79EF\u7D2F\u611F\u60C5\u3002",
    relationshipMeaningEn: "Neutral. Slight progress but resistance remains. Friction often arises from trivial matters. Do not rush; build affection gradually.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E04\u0E37\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22\u0E41\u0E15\u0E48\u0E22\u0E31\u0E07\u0E21\u0E35\u0E41\u0E23\u0E07\u0E15\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E01\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E14\u0E49\u0E27\u0E22\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E25\u0E47\u0E01\u0E46 \u0E19\u0E49\u0E2D\u0E22\u0E46 \u0E43\u0E19\u0E0A\u0E35\u0E27\u0E34\u0E15\u0E1B\u0E23\u0E30\u0E08\u0E33\u0E27\u0E31\u0E19 \u0E2D\u0E22\u0E48\u0E32\u0E43\u0E08\u0E23\u0E49\u0E2D\u0E19 \u0E15\u0E49\u0E2D\u0E07\u0E04\u0E48\u0E2D\u0E22\u0E46 \u0E2A\u0E30\u0E2A\u0E21\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E17\u0E35\u0E48\u0E14\u0E35\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E19",
    relationshipMeaningVi: "B\xECnh. T\xECnh c\u1EA3m tuy c\xF3 ti\u1EBFn tri\u1EC3n nh\u1ECF nh\u01B0ng tr\u1EDF ng\u1EA1i v\u1EABn c\xF2n, th\u01B0\u1EDDng v\xEC chuy\u1EC7n v\u1EB7t v\xE3nh m\xE0 ma s\xE1t. Kh\xF4ng \u0111\u01B0\u1EE3c n\xF4n n\xF3ng th\xE0nh c\xF4ng, c\u1EA7n ki\xEAn nh\u1EABn t\xEDch l\u0169y t\xECnh c\u1EA3m.",
    category: "\u4E2D",
    scoreRange: [62, 75]
  },
  10: {
    name: "\u5929\u6CFD\u5C65",
    nameEn: "Treading (Conduct)",
    nameEs: "El Pisar / La Conducta",
    nameFr: "Le Pas / La Conduite",
    nameTh: "\u0E25\u0E39\u0E48 (\u0E01\u0E32\u0E23\u0E22\u0E48\u0E32\u0E07\u0E01\u0E49\u0E32\u0E27\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E23\u0E30\u0E21\u0E31\u0E14\u0E23\u0E30\u0E27\u0E31\u0E07)",
    nameVi: "Thi\xEAn Tr\u1EA1ch L\xFD",
    symbol: "\u2630\u2631",
    nature: "\u8DF5\u884C",
    natureEn: "Practice & Action",
    natureTh: "\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E41\u0E25\u0E30\u0E25\u0E07\u0E21\u0E37\u0E2D",
    natureVi: "Th\u1EF1c h\xE0nh v\xE0 h\xE0nh \u0111\u1ED9ng",
    natureEs: "Pr\xE1ctica / Ejecuci\xF3n",
    natureFr: "Pratique / Mettre en \u0153uvre",
    judgment: "\u5C65\u864E\u5C3E\uFF0C\u4E0D\u54A5\u4EBA\u4EA8",
    judgmentEn: "Advantageous to persevere. Success.",
    judgmentTh: "\u0E2D\u0E14\u0E17\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
    judgmentVi: "\u0110\u1EA1p \u0111u\xF4i h\u1ED5, h\u1ED5 kh\xF4ng c\u1EAFn, hanh th\xF4ng.",
    relationshipMeaning: "\u5E73\u3002\u6B65\u6B65\u60CA\u5FC3\uFF0C\u5173\u7CFB\u4E2D\u5B58\u5728\u4E00\u5B9A\u9636\u5C42\u611F\u6216\u538B\u529B\u3002\u5FC5\u987B\u76F8\u656C\u5982\u5BBE\uFF0C\u9075\u5B88\u793C\u8282\uFF0C\u8C28\u8A00\u614E\u884C\u65B9\u80FD\u76F8\u5B89\u65E0\u4E8B\u3002",
    relationshipMeaningEn: "Neutral. Walking on thin ice; the relationship has underlying pressure or inequality. Respecting boundaries and acting cautiously ensure harmony.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E01\u0E14\u0E14\u0E31\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2B\u0E25\u0E37\u0E48\u0E2D\u0E21\u0E25\u0E49\u0E33 \u0E15\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E01\u0E35\u0E22\u0E23\u0E15\u0E34\u0E0B\u0E36\u0E48\u0E07\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E31\u0E19 \u0E23\u0E31\u0E01\u0E29\u0E32\u0E21\u0E32\u0E23\u0E22\u0E32\u0E17\u0E41\u0E25\u0E30\u0E23\u0E30\u0E27\u0E31\u0E07\u0E04\u0E33\u0E1E\u0E39\u0E14\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1B\u0E23\u0E30\u0E04\u0E2D\u0E07\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E07\u0E1A\u0E2A\u0E38\u0E02",
    relationshipMeaningVi: "B\xECnh. Nh\u01B0 \u0111i tr\xEAn b\u0103ng m\u1ECFng, quan h\u1EC7 c\xF3 \xE1p l\u1EF1c ho\u1EB7c c\u1EA3m gi\xE1c th\u1EE9 b\u1EADc. Ph\u1EA3i t\u01B0\u01A1ng k\xEDnh nh\u01B0 t\xE2n, tu\xE2n th\u1EE7 l\u1EC5 ti\u1EBFt, c\u1EA9n ng\xF4n th\u1EADn h\xE0nh m\u1EDBi c\xF3 th\u1EC3 b\xECnh an v\xF4 s\u1EF1.",
    category: "\u5409",
    scoreRange: [68, 80]
  },
  11: {
    name: "\u5730\u5929\u6CF0",
    nameEn: "Peace",
    nameEs: "La Paz / La Armon\xEDa",
    nameFr: "La Paix / La Prosp\xE9rit\xE9",
    nameTh: "\u0E44\u0E17\u0E49 (\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E07\u0E1A\u0E2A\u0E38\u0E02)",
    nameVi: "\u0110\u1ECBa Thi\xEAn Th\xE1i",
    symbol: "\u2637\u2630",
    nature: "\u901A\u6CF0",
    natureEn: "Harmonious Flow",
    natureTh: "\u0E44\u0E2B\u0E25\u0E23\u0E37\u0E48\u0E19\u0E41\u0E25\u0E30\u0E01\u0E25\u0E21\u0E01\u0E25\u0E37\u0E19",
    natureVi: "H\xE0i h\xF2a v\xE0 thu\u1EADn l\u1EE3i",
    natureEs: "Fluidez / Prosperidad",
    natureFr: "Harmonie / Fluidit\xE9",
    judgment: "\u5C0F\u5F80\u5927\u6765\u5409\u4EA8",
    judgmentEn: "Success, prosperity, perseverance. Marrying a maiden is auspicious.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E23\u0E38\u0E48\u0E07\u0E40\u0E23\u0E37\u0E2D\u0E07 \u0E2D\u0E14\u0E17\u0E19 \u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19\u0E2B\u0E0D\u0E34\u0E07\u0E2A\u0E32\u0E27\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25",
    judgmentVi: "Ti\u1EC3u t\u1EF1 \u0111\u1EA1i lai, c\xE1t t\u01B0\u1EDDng hanh th\xF4ng.",
    relationshipMeaning: "\u5927\u5409\u3002\u9634\u9633\u4EA4\u6CF0\uFF0C\u6C9F\u901A\u987A\u7545\uFF0C\u5F7C\u6B64\u5FC3\u610F\u76F8\u901A\u3002\u611F\u60C5\u751C\u871C\u878D\u6D3D\uFF0C\u6781\u4E3A\u5229\u4E8E\u8BA2\u5A5A\u3001\u7ED3\u5A5A\u7B49\u559C\u4E8B\u3002",
    relationshipMeaningEn: "Highly auspicious. Perfect harmony and smooth communication; hearts are aligned. Sweet and harmonious relationship, ideal for engagement or marriage.",
    relationshipMeaningTh: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E2B\u0E22\u0E34\u0E19\u0E2B\u0E22\u0E32\u0E07\u0E2A\u0E21\u0E14\u0E38\u0E25 \u0E2A\u0E37\u0E48\u0E2D\u0E2A\u0E32\u0E23\u0E23\u0E32\u0E1A\u0E23\u0E37\u0E48\u0E19\u0E41\u0E25\u0E30\u0E43\u0E08\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E2B\u0E27\u0E32\u0E19\u0E0A\u0E37\u0E48\u0E19\u0E41\u0E25\u0E30\u0E25\u0E07\u0E15\u0E31\u0E27 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E21\u0E32\u0E01\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2B\u0E21\u0E31\u0E49\u0E19\u0E2B\u0E21\u0E32\u0E22\u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19",
    relationshipMeaningVi: "\u0110\u1EA1i c\xE1t. \xC2m d\u01B0\u01A1ng giao h\xF2a, giao ti\u1EBFp th\xF4ng su\u1ED1t, t\xE2m \xFD t\u01B0\u01A1ng th\xF4ng. T\xECnh c\u1EA3m ng\u1ECDt ng\xE0o h\xF2a h\u1EE3p, c\u1EF1c k\u1EF3 c\xF3 l\u1EE3i cho vi\u1EC7c \u0111\xEDnh h\xF4n, k\u1EBFt h\xF4n.",
    category: "\u5927\u5409",
    scoreRange: [88, 97]
  },
  12: {
    name: "\u5929\u5730\u5426",
    nameEn: "Standstill (Stagnation)",
    nameEs: "El Estancamiento / La Obstrucci\xF3n",
    nameFr: "La Stagnation / L'Obstruction",
    nameTh: "\u0E1C\u0E35\u0E48 (\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E22\u0E38\u0E14\u0E0A\u0E30\u0E07\u0E31\u0E01)",
    nameVi: "Thi\xEAn \u0110\u1ECBa B\u0129",
    symbol: "\u2630\u2637",
    nature: "\u95ED\u585E",
    natureEn: "Blocked & Stagnant",
    natureTh: "\u0E15\u0E31\u0E19\u0E41\u0E25\u0E30\u0E0B\u0E1A\u0E40\u0E0B\u0E32",
    natureVi: "B\u1EBF t\u1EAFc v\xE0 tr\xEC tr\u1EC7",
    natureEs: "Bloqueo / Clausura",
    natureFr: "Blocage / Fermeture",
    judgment: "\u5426\u4E4B\u532A\u4EBA\uFF0C\u4E0D\u5229\u541B\u5B50\u8D1E",
    judgmentEn: "Success, no blame. Advantageous to persevere.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E34\u0E14 \u0E2D\u0E14\u0E17\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "B\u0129 v\u1EDBi ng\u01B0\u1EDDi phi nh\xE2n, b\u1EA5t l\u1EE3i cho qu\xE2n t\u1EED ki\xEAn tr\xEC.",
    relationshipMeaning: "\u51F6\u3002\u6C9F\u901A\u95ED\u585E\uFF0C\u51B7\u6218\u5BF9\u7ACB\uFF0C\u60F3\u6CD5\u80CC\u9053\u800C\u9A70\u3002\u611F\u60C5\u9677\u5165\u50F5\u5C40\uFF0C\u82E5\u4E0D\u79EF\u6781\u6253\u7834\u9694\u9602\uFF0C\u6050\u9762\u4E34\u5206\u624B\u3002",
    relationshipMeaningEn: "Inauspicious. Blocked communication, cold war, and divergent goals. The relationship is stagnant; without breaking the barrier, break-up is likely.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E01\u0E32\u0E23\u0E2A\u0E37\u0E48\u0E2D\u0E2A\u0E32\u0E23\u0E1B\u0E34\u0E14\u0E15\u0E32\u0E22 \u0E40\u0E01\u0E34\u0E14\u0E2A\u0E07\u0E04\u0E23\u0E32\u0E21\u0E40\u0E22\u0E47\u0E19\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E2B\u0E47\u0E19\u0E2A\u0E27\u0E19\u0E17\u0E32\u0E07\u0E01\u0E31\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E2B\u0E22\u0E38\u0E14\u0E0A\u0E30\u0E07\u0E31\u0E01 \u0E2B\u0E32\u0E01\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E08\u0E41\u0E01\u0E49\u0E44\u0E02\u0E2D\u0E32\u0E08\u0E15\u0E49\u0E2D\u0E07\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E01\u0E31\u0E19",
    relationshipMeaningVi: "Hung. S\u1EF1 th\u1EA5u hi\u1EC3u b\u1EBF t\u1EAFc, chi\u1EBFn tranh l\u1EA1nh \u0111\u1ED1i l\u1EADp, suy ngh\u0129 \u0111i ng\u01B0\u1EE3c l\u1EA1i nhau. T\xECnh c\u1EA3m r\u01A1i v\xE0o b\u1EBF t\u1EAFc, n\u1EBFu kh\xF4ng t\xEDch c\u1EF1c ph\xE1 v\u1EE1 r\xE0o c\u1EA3n s\u1EBD d\u1EC5 \u0111\u1ED1i m\u1EB7t v\u1EDBi chia tay.",
    category: "\u5C0F\u51F6",
    scoreRange: [45, 58]
  },
  13: {
    name: "\u5929\u706B\u540C\u4EBA",
    nameEn: "Fellowship with Men",
    nameEs: "La Comunidad con los Hombres",
    nameFr: "La Communaut\xE9 / L'Union des Hommes",
    nameTh: "\u0E16\u0E07\u0E40\u0E2B\u0E23\u0E34\u0E19 (\u0E21\u0E34\u0E15\u0E23\u0E2A\u0E2B\u0E32\u0E22)",
    nameVi: "Thi\xEAn H\u1ECFa \u0110\u1ED3ng Nh\xE2n",
    symbol: "\u2630\u2632",
    nature: "\u805A\u5408",
    natureEn: "Gathering Together",
    natureTh: "\u0E23\u0E27\u0E21\u0E15\u0E31\u0E27\u0E40\u0E02\u0E49\u0E32\u0E14\u0E49\u0E27\u0E22\u0E01\u0E31\u0E19",
    natureVi: "T\u1EE5 h\u1ED9i c\xF9ng nhau",
    natureEs: "Reuni\xF3n / Convergencia",
    natureFr: "Rassemblement / Convergence",
    judgment: "\u540C\u4EBA\u4E8E\u91CE\u4EA8",
    judgmentEn: "Success. Minor advantages in firmness.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E23\u0E35\u0E22\u0E1A\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22",
    judgmentVi: "\u0110\u1ED3ng nh\xE2n t\u1EA1i d\xE3, hanh th\xF4ng.",
    relationshipMeaning: "\u5409\u3002\u5FD7\u540C\u9053\u5408\uFF0C\u65E2\u662F\u7231\u4EBA\u53C8\u662F\u77E5\u5DF1\uFF0C\u62E5\u6709\u5171\u540C\u7684\u76EE\u6807\u4E0E\u5708\u5B50\u3002\u516C\u5F00\u604B\u60C5\u80FD\u83B7\u5F97\u5927\u4F17\u7684\u795D\u798F\u3002",
    relationshipMeaningEn: "Auspicious. Like-minded partners who are both lovers and soulmates. Sharing common goals and social circles; opening the relationship brings public blessings.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E40\u0E1B\u0E47\u0E19\u0E17\u0E31\u0E49\u0E07\u0E04\u0E19\u0E23\u0E31\u0E01\u0E41\u0E25\u0E30\u0E21\u0E34\u0E15\u0E23\u0E41\u0E17\u0E49\u0E17\u0E35\u0E48\u0E21\u0E35\u0E2D\u0E38\u0E14\u0E21\u0E01\u0E32\u0E23\u0E13\u0E4C\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19 \u0E21\u0E35\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E41\u0E25\u0E30\u0E2A\u0E31\u0E07\u0E04\u0E21\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19 \u0E01\u0E32\u0E23\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E1C\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E08\u0E30\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E22\u0E34\u0E19\u0E14\u0E35\u0E08\u0E32\u0E01\u0E23\u0E2D\u0E1A\u0E02\u0E49\u0E32\u0E07",
    relationshipMeaningVi: "C\xE1t. Ch\xED \u0111\u1ED3ng \u0111\u1EA1o h\u1EE3p, v\u1EEBa l\xE0 ng\u01B0\u1EDDi y\xEAu v\u1EEBa l\xE0 tri k\u1EF7, c\xF3 chung m\u1EE5c ti\xEAu v\xE0 v\xF2ng b\u1EA1n b\xE8. C\xF4ng khai t\xECnh c\u1EA3m s\u1EBD nh\u1EADn \u0111\u01B0\u1EE3c s\u1EF1 ch\xFAc ph\xFAc c\u1EE7a m\u1ECDi ng\u01B0\u1EDDi.",
    category: "\u5409",
    scoreRange: [78, 90]
  },
  14: {
    name: "\u706B\u5929\u5927\u6709",
    nameEn: "Great Possession",
    nameEs: "La Gran Posesi\xF3n / La Abundancia",
    nameFr: "Le Grand Avoir / La Grande Possession",
    nameTh: "\u0E15\u0E49\u0E32\u0E42\u0E2B\u0E22\u0E48\u0E27 (\u0E04\u0E27\u0E32\u0E21\u0E21\u0E31\u0E48\u0E07\u0E04\u0E31\u0E48\u0E07\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48)",
    nameVi: "H\u1ECFa Thi\xEAn \u0110\u1EA1i H\u1EEFu",
    symbol: "\u2632\u2630",
    nature: "\u4E30\u76DB",
    natureEn: "Full Abundance",
    natureTh: "\u0E40\u0E15\u0E47\u0E21\u0E40\u0E1B\u0E35\u0E48\u0E22\u0E21\u0E44\u0E1E\u0E28\u0E32\u0E25",
    natureVi: "Tr\xE0n \u0111\u1EA7y d\u1ED3i d\xE0o",
    natureEs: "Abundancia / Plenitud",
    natureFr: "Abondance / Pl\xE9nitude",
    judgment: "\u5143\u4EA8",
    judgmentEn: "Advantageous to persevere.",
    judgmentTh: "\u0E2D\u0E14\u0E17\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Nguy\xEAn hanh, \u0111\u1EA1i h\u1EEFu v\u1EA1n v\u1EADt.",
    relationshipMeaning: "\u5927\u5409\u3002\u611F\u60C5\u4E30\u5BCC\u4E14\u7269\u8D28\u57FA\u7840\u96C4\u539A\uFF0C\u5F7C\u6B64\u76F8\u5904\u878D\u6D3D\uFF0C\u5145\u6EE1\u6B63\u80FD\u91CF\u3002\u6B64\u65F6\u5229\u4E8E\u5171\u7B51\u672A\u6765\uFF0C\u8D70\u5411\u7F8E\u6EE1\u5A5A\u59FB\u3002",
    relationshipMeaningEn: "Highly auspicious. Rich affection backed by a strong material foundation. Mutual positive energy leads to a happy, prosperous future and marriage.",
    relationshipMeaningTh: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E40\u0E2B\u0E25\u0E37\u0E2D\u0E07\u0E2B\u0E27\u0E32\u0E19\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E10\u0E32\u0E19\u0E30\u0E17\u0E35\u0E48\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07 \u0E17\u0E31\u0E49\u0E07\u0E2A\u0E2D\u0E07\u0E1D\u0E48\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E14\u0E35\u0E41\u0E25\u0E30\u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E1E\u0E25\u0E31\u0E07\u0E1A\u0E27\u0E01 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E41\u0E01\u0E48\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2D\u0E19\u0E32\u0E04\u0E15\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19\u0E2A\u0E39\u0E48\u0E01\u0E32\u0E23\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19",
    relationshipMeaningVi: "\u0110\u1EA1i c\xE1t. T\xECnh c\u1EA3m phong ph\xFA l\u1EA1i c\xF3 n\u1EC1n t\u1EA3ng v\u1EADt ch\u1EA5t v\u1EEFng ch\u1EAFc, \u0111\xF4i b\xEAn chung s\u1ED1ng h\xF2a h\u1EE3p, \u0111\u1EA7y n\u0103ng l\u01B0\u1EE3ng t\xEDch c\u1EF1c. L\u1EE3i cho vi\u1EC7c c\xF9ng x\xE2y t\u01B0\u01A1ng lai, h\u01B0\u1EDBng t\u1EDBi h\xF4n nh\xE2n vi\xEAn m\xE3n.",
    category: "\u5927\u5409",
    scoreRange: [84, 95]
  },
  15: {
    name: "\u5730\u5C71\u8C26",
    nameEn: "Modesty",
    nameEs: "La Modestia",
    nameFr: "La Modestie",
    nameTh: "\u0E40\u0E0A\u0E35\u0E22\u0E19 (\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E48\u0E2D\u0E19\u0E19\u0E49\u0E2D\u0E21\u0E16\u0E48\u0E2D\u0E21\u0E15\u0E19)",
    nameVi: "\u0110\u1ECBa S\u01A1n Khi\xEAm",
    symbol: "\u2637\u2636",
    nature: "\u8C26\u900A",
    natureEn: "Humble Modesty",
    natureTh: "\u0E16\u0E48\u0E2D\u0E21\u0E15\u0E19\u0E41\u0E25\u0E30\u0E2A\u0E21\u0E16\u0E30",
    natureVi: "Khi\xEAm t\u1ED1n v\xE0 nh\xFAn nh\u01B0\u1EDDng",
    natureEs: "Humildad / Modestia",
    natureFr: "Humilit\xE9 / Modestie",
    judgment: "\u4EA8\u541B\u5B50\u6709\u7EC8",
    judgmentEn: "The prosperous lord uses gift horses, multiplying them.",
    judgmentTh: "\u0E17\u0E48\u0E32\u0E19\u0E40\u0E08\u0E49\u0E32\u0E1C\u0E39\u0E49\u0E23\u0E38\u0E48\u0E07\u0E40\u0E23\u0E37\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E21\u0E49\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E02\u0E27\u0E31\u0E0D \u0E04\u0E39\u0E13\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E02\u0E36\u0E49\u0E19",
    judgmentVi: "Hanh th\xF4ng, qu\xE2n t\u1EED c\xF3 th\u1EE7y chung.",
    relationshipMeaning: "\u5409\u3002\u76F8\u5904\u7F3A\u4E4F\u6FC0\u60C5\u4F46\u6781\u4E3A\u5B89\u5168\u7A33\u56FA\u3002\u5F7C\u6B64\u61C2\u5F97\u4F4E\u5934\u4E0E\u9000\u8BA9\uFF0C\u76F8\u656C\u5982\u5BBE\uFF0C\u80FD\u591F\u5E73\u5E73\u5B89\u5B89\u8D70\u5230\u6700\u540E\u3002",
    relationshipMeaningEn: "Auspicious. Lacks wild passion but offers extreme safety and stability. Mutual humility and compromise ensure a peaceful, lifelong journey together.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E41\u0E21\u0E49\u0E08\u0E30\u0E02\u0E32\u0E14\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E27\u0E37\u0E2D\u0E2B\u0E27\u0E32\u0E41\u0E15\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E41\u0E25\u0E30\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22\u0E2A\u0E39\u0E07 \u0E15\u0E48\u0E32\u0E07\u0E1D\u0E48\u0E32\u0E22\u0E15\u0E48\u0E32\u0E07\u0E23\u0E39\u0E49\u0E08\u0E31\u0E01\u0E22\u0E2D\u0E21\u0E41\u0E25\u0E30\u0E43\u0E2B\u0E49\u0E2D\u0E20\u0E31\u0E22\u0E01\u0E31\u0E19 \u0E08\u0E30\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1B\u0E23\u0E30\u0E04\u0E2D\u0E07\u0E04\u0E39\u0E48\u0E01\u0E31\u0E19\u0E44\u0E1B\u0E44\u0E14\u0E49\u0E22\u0E32\u0E27\u0E19\u0E32\u0E19",
    relationshipMeaningVi: "C\xE1t. Chung s\u1ED1ng thi\u1EBFu \u0111i s\u1EF1 cu\u1ED3ng nhi\u1EC7t nh\u01B0ng c\u1EF1c k\u1EF3 an to\xE0n v\xE0 v\u1EEFng ch\u1EAFc. \u0110\xF4i b\xEAn bi\u1EBFt nh\u01B0\u1EDDng nh\u1ECBn v\xE0 c\xFAi \u0111\u1EA7u, t\u01B0\u01A1ng k\xEDnh nh\u01B0 t\xE2n, c\xF3 th\u1EC3 b\xECnh an \u0111i \u0111\u1EBFn cu\u1ED1i con \u0111\u01B0\u1EDDng.",
    category: "\u5409",
    scoreRange: [77, 89]
  },
  16: {
    name: "\u96F7\u5730\u8C6B",
    nameEn: "Enthusiasm",
    nameEs: "El Entusiasmo",
    nameFr: "L'Enthousiasme",
    nameTh: "\u0E2D\u0E27\u0E35\u0E49 (\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02\u0E2A\u0E33\u0E23\u0E32\u0E0D)",
    nameVi: "L\xF4i \u0110\u1ECBa D\u1EF1",
    symbol: "\u2633\u2637",
    nature: "\u5B89\u4E50",
    natureEn: "Peace & Joy",
    natureTh: "\u0E2A\u0E07\u0E1A\u0E41\u0E25\u0E30\u0E23\u0E37\u0E48\u0E19\u0E40\u0E23\u0E34\u0E07",
    natureVi: "B\xECnh an v\xE0 vui v\u1EBB",
    natureEs: "Alegr\xEDa / Bienestar",
    natureFr: "Joie / Qui\xE9tude",
    judgment: "\u5229\u5EFA\u4FAF\u884C\u5E08",
    judgmentEn: "Great good fortune. Success.",
    judgmentTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35\u0E21\u0E32\u0E01 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
    judgmentVi: "L\u1EE3i ki\u1EBFn h\u1EA7u, h\xE0nh s\u01B0.",
    relationshipMeaning: "\u5409\u3002\u5FEB\u4E50\u3001\u5145\u6EE1\u60C5\u8C03\u4E0E\u6B22\u6109\u7684\u604B\u7231\u5173\u7CFB\u3002\u4F46\u9700\u6CE8\u610F\u6D41\u4E8E\u4EAB\u4E50\u800C\u5FFD\u89C6\u73B0\u5B9E\u95EE\u9898\uFF0C\u907F\u514D\u865A\u8363\u4E0E\u559C\u65B0\u538C\u65E7\u3002",
    relationshipMeaningEn: "Auspicious. A joyful, romantic, and pleasurable relationship. However, beware of overindulgence in pleasure while ignoring practical realities and vanity.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02 \u0E04\u0E27\u0E32\u0E21\u0E42\u0E23\u0E41\u0E21\u0E19\u0E15\u0E34\u0E01\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E19\u0E38\u0E01\u0E2A\u0E19\u0E32\u0E19 \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07\u0E01\u0E32\u0E23\u0E40\u0E1E\u0E25\u0E34\u0E14\u0E40\u0E1E\u0E25\u0E34\u0E19\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02\u0E08\u0E19\u0E25\u0E30\u0E40\u0E25\u0E22\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A",
    relationshipMeaningVi: "C\xE1t. M\u1ED1i quan h\u1EC7 vui v\u1EBB, \u0111\u1EA7y t\xECnh \u0111i\u1EC7u v\xE0 hoan h\u1EF7. Nh\u01B0ng c\u1EA7n ch\xFA \xFD tr\xE1nh sa \u0111\xE0 v\xE0o h\u01B0\u1EDFng l\u1EA1c m\xE0 b\u1ECF qua v\u1EA5n \u0111\u1EC1 th\u1EF1c t\u1EBF, tr\xE1nh h\u01B0 vinh v\xE0 c\u1EA3 th\xE8m ch\xF3ng ch\xE1n.",
    category: "\u5409",
    scoreRange: [73, 85]
  },
  17: {
    name: "\u6CFD\u96F7\u968F",
    nameEn: "Following",
    nameEs: "El Seguimiento",
    nameFr: "La Suite",
    nameTh: "\u0E2A\u0E38\u0E22 (\u0E01\u0E32\u0E23\u0E04\u0E25\u0E49\u0E2D\u0E22\u0E15\u0E32\u0E21)",
    nameVi: "Tr\u1EA1ch L\xF4i T\xF9y",
    symbol: "\u2631\u2633",
    nature: "\u8FFD\u968F",
    natureEn: "Following",
    natureTh: "\u0E15\u0E32\u0E21\u0E41\u0E25\u0E30\u0E25\u0E33\u0E40\u0E25\u0E34\u0E07",
    natureVi: "Tu\xE2n theo",
    natureEs: "Seguir / Acompa\xF1ar",
    natureFr: "Suivre / Accompagner",
    judgment: "\u5143\u4EA8\u5229\u8D1E\u65E0\u548E",
    judgmentEn: "Minor affairs auspicious.",
    judgmentTh: "\u0E01\u0E34\u0E08\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25",
    judgmentVi: "Nguy\xEAn hanh l\u1EE3i ch\xEDnh ki\xEAn tr\xEC, kh\xF4ng l\u1ED7i.",
    relationshipMeaning: "\u5409\u3002\u987A\u5176\u81EA\u7136\uFF0C\u968F\u7F18\u800C\u5B89\u3002\u5F7C\u6B64\u80FD\u4E92\u76F8\u8FC1\u5C31\uFF0C\u592B\u5531\u5987\u968F\uFF0C\u611F\u60C5\u53D1\u5C55\u987A\u5229\u3002",
    relationshipMeaningEn: "Auspicious. Go with the flow and adapt to circumstances. Mutual accommodation and harmony lead to smooth relationship development.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E43\u0E2B\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E44\u0E1B\u0E15\u0E32\u0E21\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E15\u0E32\u0E21\u0E2A\u0E16\u0E32\u0E19\u0E01\u0E32\u0E23\u0E13\u0E4C \u0E15\u0E48\u0E32\u0E07\u0E1D\u0E48\u0E32\u0E22\u0E15\u0E48\u0E32\u0E07\u0E22\u0E2D\u0E21\u0E2D\u0E48\u0E2D\u0E19\u0E02\u0E49\u0E2D\u0E43\u0E2B\u0E49\u0E01\u0E31\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E44\u0E1B\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E23\u0E32\u0E1A\u0E23\u0E37\u0E48\u0E19",
    relationshipMeaningVi: "C\xE1t. Thu\u1EADn theo t\u1EF1 nhi\xEAn, t\xF9y duy\xEAn m\xE0 an. \u0110\xF4i b\xEAn bi\u1EBFt nh\u01B0\u1EDDng nh\u1ECBn, phu x\u01B0\u1EDBng ph\u1EE5 t\xF9y, t\xECnh c\u1EA3m ph\xE1t tri\u1EC3n thu\u1EADn l\u1EE3i.",
    category: "\u5927\u5409",
    scoreRange: [83, 94]
  },
  18: {
    name: "\u5C71\u98CE\u86CA",
    nameEn: "Work on the Decayed",
    nameEs: "El Trabajo sobre lo Corrompido",
    nameFr: "Le Travail sur ce qui est Corrompu",
    nameTh: "\u0E01\u0E39\u0E48 (\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E37\u0E48\u0E2D\u0E21\u0E16\u0E2D\u0E22)",
    nameVi: "S\u01A1n Phong C\u1ED5",
    symbol: "\u2636\u2634",
    nature: "\u8D25\u574F",
    natureEn: "Decay & Renewal",
    natureTh: "\u0E40\u0E19\u0E48\u0E32\u0E40\u0E1F\u0E30\u0E41\u0E25\u0E30\u0E1F\u0E37\u0E49\u0E19\u0E1F\u0E39",
    natureVi: "Suy \u0111\u1ED3i v\xE0 canh t\xE2n",
    natureEs: "Corrupci\xF3n / Deterioro",
    natureFr: "Corruption / D\xE9gradation",
    judgment: "\u5143\u4EA8\uFF0C\u5229\u6D89\u5927\u5DDD",
    judgmentEn: "Advantageous southwest, not advantageous northeast.",
    judgmentTh: "\u0E44\u0E1B\u0E17\u0E32\u0E07\u0E15\u0E30\u0E27\u0E31\u0E19\u0E15\u0E01\u0E40\u0E09\u0E35\u0E22\u0E07\u0E43\u0E15\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E44\u0E1B\u0E17\u0E32\u0E07\u0E15\u0E30\u0E27\u0E31\u0E19\u0E2D\u0E2D\u0E01\u0E40\u0E09\u0E35\u0E22\u0E07\u0E40\u0E2B\u0E19\u0E37\u0E2D\u0E44\u0E21\u0E48\u0E14\u0E35",
    judgmentVi: "Nguy\xEAn hanh, l\u1EE3i v\u01B0\u1EE3t s\xF4ng l\u1EDBn.",
    relationshipMeaning: "\u51F6\u3002\u5173\u7CFB\u79EF\u5F0A\u5DF2\u6DF1\uFF0C\u6709\u9690\u7792\u3001\u6B3A\u9A97\u6216\u524D\u4EFB\u7EA0\u7F20\u7684\u95EE\u9898\u3002\u5FC5\u987B\u5927\u5200\u9614\u65A7\u65A9\u65AD\u4E71\u9EBB\uFF0C\u91CD\u65B0\u6574\u987F\u65B9\u6709\u751F\u673A\u3002",
    relationshipMeaningEn: "Inauspicious. Deep-seated issues, concealment, deception, or past relationship baggage. Drastic changes and rectification are needed to revive it.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E40\u0E23\u0E37\u0E49\u0E2D\u0E23\u0E31\u0E07\u0E2A\u0E30\u0E2A\u0E21\u0E21\u0E32\u0E19\u0E32\u0E19 \u0E21\u0E35\u0E01\u0E32\u0E23\u0E1B\u0E01\u0E1B\u0E34\u0E14 \u0E2B\u0E25\u0E2D\u0E01\u0E25\u0E27\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E31\u0E01\u0E2A\u0E32\u0E21\u0E40\u0E2A\u0E49\u0E32 \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E14\u0E47\u0E14\u0E02\u0E32\u0E14\u0E43\u0E19\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E31\u0E1A\u0E1B\u0E23\u0E38\u0E07\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E08\u0E36\u0E07\u0E08\u0E30\u0E44\u0E1B\u0E15\u0E48\u0E2D\u0E44\u0E14\u0E49",
    relationshipMeaningVi: "Hung. Quan h\u1EC7 t\xEDch t\u1EE5 nhi\u1EC1u t\u1EC7 n\u1EA1n \u0111\xE3 l\xE2u, c\xF3 s\u1EF1 gi\u1EA5u gi\u1EBFm, l\u1EEBa d\u1ED1i ho\u1EB7c v\u01B0\u1EDBng m\u1EAFc v\u1EDBi ng\u01B0\u1EDDi c\u0169. Ph\u1EA3i quy\u1EBFt t\xE2m tri\u1EC7t \u0111\u1EC3 ch\u1EA5n ch\u1EC9nh m\u1EDBi mong c\xF3 sinh c\u01A1.",
    category: "\u4E2D",
    scoreRange: [54, 68]
  },
  19: {
    name: "\u5730\u6CFD\u4E34",
    nameEn: "Approach",
    nameEs: "La Aproximaci\xF3n",
    nameFr: "L'Approche",
    nameTh: "\u0E2B\u0E25\u0E34\u0E19 (\u0E01\u0E32\u0E23\u0E22\u0E48\u0E32\u0E07\u0E01\u0E23\u0E32\u0E22\u0E40\u0E02\u0E49\u0E32\u0E21\u0E32)",
    nameVi: "\u0110\u1ECBa Tr\u1EA1ch L\xE2m",
    symbol: "\u2637\u2631",
    nature: "\u4E34\u4E0B",
    natureEn: "Approaching from Below",
    natureTh: "\u0E40\u0E02\u0E49\u0E32\u0E43\u0E01\u0E25\u0E49\u0E08\u0E32\u0E01\u0E14\u0E49\u0E32\u0E19\u0E25\u0E48\u0E32\u0E07",
    natureVi: "Ti\u1EBFn \u0111\u1EBFn t\u1EEB d\u01B0\u1EDBi",
    natureEs: "Acercamiento / Presidir",
    natureFr: "Approcher / Pr\xE9sider",
    judgment: "\u5143\u4EA8\u5229\u8D1E",
    judgmentEn: "Sincere. Great good fortune, no blame.",
    judgmentTh: "\u0E08\u0E23\u0E34\u0E07\u0E43\u0E08 \u0E42\u0E0A\u0E04\u0E14\u0E35\u0E21\u0E32\u0E01 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E34\u0E14",
    judgmentVi: "Nguy\xEAn hanh l\u1EE3i ch\xEDnh ki\xEAn tr\xEC.",
    relationshipMeaning: "\u5409\u3002\u8FD0\u52BF\u6E10\u5165\u4F73\u5883\uFF0C\u611F\u60C5\u8FCE\u6765\u65B0\u8F6C\u673A\u6216\u8FFD\u6C42\u8005\u3002\u5F7C\u6B64\u79EF\u6781\u4E92\u52A8\uFF0C\u5145\u6EE1\u671F\u76FC\u3002\u4F46\u9700\u9632\u70ED\u60C5\u8FC7\u540E\u9762\u4E34\u540E\u52B2\u4E0D\u8DB3\u3002",
    relationshipMeaningEn: "Auspicious. Fortunes are improving; relationship welcomes new turns or suitors. Active interaction and high expectations. Beware of a post-passion slump.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E14\u0E27\u0E07\u0E0A\u0E30\u0E15\u0E32\u0E40\u0E23\u0E34\u0E48\u0E21\u0E14\u0E35\u0E02\u0E36\u0E49\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E21\u0E35\u0E42\u0E2D\u0E01\u0E32\u0E2A\u0E43\u0E2B\u0E21\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E21\u0E35\u0E04\u0E19\u0E21\u0E32\u0E02\u0E32\u0E22\u0E02\u0E19\u0E21\u0E08\u0E35\u0E1A \u0E21\u0E35\u0E1B\u0E0F\u0E34\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E17\u0E35\u0E48\u0E14\u0E35\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E19 \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07\u0E04\u0E27\u0E32\u0E21\u0E40\u0E09\u0E37\u0E48\u0E2D\u0E22\u0E0A\u0E32\u0E2B\u0E25\u0E31\u0E07\u0E08\u0E32\u0E01\u0E2B\u0E21\u0E14\u0E0A\u0E48\u0E27\u0E07\u0E42\u0E1B\u0E23\u0E42\u0E21\u0E0A\u0E31\u0E48\u0E19",
    relationshipMeaningVi: "C\xE1t. V\u1EADn th\u1EBF d\u1EA7n v\xE0o c\u1EA3nh \u0111\u1EB9p, t\xECnh c\u1EA3m \u0111\xF3n nh\u1EADn chuy\u1EC3n bi\u1EBFn m\u1EDBi ho\u1EB7c c\xF3 ng\u01B0\u1EDDi theo \u0111u\u1ED5i. \u0110\xF4i b\xEAn t\u01B0\u01A1ng t\xE1c t\xEDch c\u1EF1c, \u0111\u1EA7y mong \u0111\u1EE3i. C\u1EA7n ph\xF2ng sau khi h\u1EBFt nhi\u1EC7t t\xECnh s\u1EBD b\u1ECB h\u1EE5t h\u01A1i.",
    category: "\u5409",
    scoreRange: [74, 86]
  },
  20: {
    name: "\u98CE\u5730\u89C2",
    nameEn: "Contemplation",
    nameEs: "La Contemplaci\xF3n",
    nameFr: "La Contemplation",
    nameTh: "\u0E01\u0E27\u0E32\u0E19 (\u0E01\u0E32\u0E23\u0E40\u0E1E\u0E48\u0E07\u0E1E\u0E34\u0E19\u0E34\u0E08)",
    nameVi: "Phong \u0110\u1ECBa Qu\xE1n",
    symbol: "\u2634\u2637",
    nature: "\u89C2\u5BDF",
    natureEn: "Contemplative View",
    natureTh: "\u0E21\u0E2D\u0E07\u0E14\u0E49\u0E27\u0E22\u0E2A\u0E15\u0E34",
    natureVi: "Quan s\xE1t s\xE2u s\u1EAFc",
    natureEs: "Observaci\xF3n / Mirada",
    natureFr: "Observation / Regard",
    judgment: "\u76E5\u800C\u4E0D\u8350\u6709\u5B5A\u9852\u82E5",
    judgmentEn: "Advantageous to move, advantageous to cross the great river.",
    judgmentTh: "\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E27\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E02\u0E49\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E43\u0E2B\u0E0D\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Ho\xE0n nhi\xEAn ch\xED nh\u01B0, h\u1EEFu ph\u01B0\u1EDBc uy nghi.",
    relationshipMeaning: "\u5E73\u3002\u611F\u60C5\u5904\u4E8E\u89C2\u5BDF\u671F\uFF0C\u6D41\u4E8E\u7CBE\u795E\u4EA4\u6D41\uFF0C\u7F3A\u4E4F\u5B9E\u8D28\u884C\u52A8\u3002\u5F7C\u6B64\u90FD\u5728\u8861\u91CF\u4E0E\u5BA1\u89C6\uFF0C\u5B9C\u591A\u5C55\u73B0\u8BDA\u610F\u800C\u975E\u6B62\u6B65\u4E0D\u524D\u3002",
    relationshipMeaningEn: "Neutral. Observation phase; heavily reliant on mental/spiritual exchange with lack of real action. Both are evaluating; show sincerity rather than hesitating.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E2A\u0E31\u0E07\u0E40\u0E01\u0E15\u0E01\u0E32\u0E23\u0E13\u0E4C \u0E40\u0E19\u0E49\u0E19\u0E01\u0E32\u0E23\u0E41\u0E25\u0E01\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E17\u0E32\u0E07\u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E41\u0E15\u0E48\u0E02\u0E32\u0E14\u0E01\u0E32\u0E23\u0E25\u0E07\u0E21\u0E37\u0E2D\u0E17\u0E33 \u0E15\u0E48\u0E32\u0E07\u0E1D\u0E48\u0E32\u0E22\u0E15\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E21\u0E34\u0E19\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E31\u0E19 \u0E04\u0E27\u0E23\u0E41\u0E2A\u0E14\u0E07\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E43\u0E08\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E25\u0E31\u0E07\u0E40\u0E25",
    relationshipMeaningVi: "B\xECnh. T\xECnh c\u1EA3m \u0111ang trong giai \u0111o\u1EA1n quan s\xE1t, thi\xEAn v\u1EC1 giao l\u01B0u tinh th\u1EA7n, thi\u1EBFu h\xE0nh \u0111\u1ED9ng th\u1EF1c t\u1EBF. \u0110\xF4i b\xEAn \u0111\u1EC1u \u0111ang c\xE2n nh\u1EAFc v\xE0 xem x\xE9t, n\xEAn th\u1EC3 hi\u1EC7n th\xE0nh \xFD thay v\xEC \u0111\u1EE9ng im b\u1EA5t \u0111\u1ED9ng.",
    category: "\u4E2D",
    scoreRange: [61, 75]
  },
  21: {
    name: "\u706B\u96F7\u566C\u55D1",
    nameEn: "Biting Through",
    nameEs: "Morder el Obst\xE1culo",
    nameFr: "Mordre au Travers",
    nameTh: "\u0E0B\u0E37\u0E48\u0E2D\u0E40\u0E04\u0E48\u0E2D (\u0E01\u0E32\u0E23\u0E02\u0E1A\u0E40\u0E04\u0E35\u0E49\u0E22\u0E27\u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04)",
    nameVi: "H\u1ECFa L\xF4i Ph\u1EC7 H\u1EA1p",
    symbol: "\u2632\u2633",
    nature: "\u54AC\u5408",
    natureEn: "Decisive Action",
    natureTh: "\u0E25\u0E07\u0E21\u0E37\u0E2D\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E47\u0E14\u0E02\u0E32\u0E14",
    natureVi: "H\xE0nh \u0111\u1ED9ng quy\u1EBFt \u0111o\xE1n",
    natureEs: "Mordedura / Enganche",
    natureFr: "Morsure / Enclenchement",
    judgment: "\u4EA8\u5229\u7528\u72F1",
    judgmentEn: "Proclaimed in the king's court. Crying out, danger.",
    judgmentTh: "\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28 \u0E13 \u0E23\u0E32\u0E0A\u0E2A\u0E33\u0E19\u0E31\u0E01 \u0E23\u0E49\u0E2D\u0E07\u0E42\u0E2B\u0E48 \u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22",
    judgmentVi: "Hanh th\xF4ng, l\u1EE3i cho vi\u1EC7c x\xE9t x\u1EED.",
    relationshipMeaning: "\u51F6\u3002\u969C\u788D\u91CD\u91CD\uFF0C\u77DB\u76FE\u5C16\u9510\uFF0C\u5E38\u6709\u6FC0\u70C8\u4E89\u5435\u751A\u81F3\u5916\u754C\u963B\u529B\u3002\u5FC5\u987B\u50CF\u54AC\u788E\u786C\u7269\u4E00\u822C\u521A\u51B3\u679C\u65AD\uFF0C\u6392\u9664\u5E72\u6270\u3002",
    relationshipMeaningEn: "Inauspicious. Numerous obstacles and sharp conflicts, often with fierce arguments or external resistance. Must act resolutely to break through barriers.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04\u0E02\u0E27\u0E32\u0E01\u0E2B\u0E19\u0E32\u0E21\u0E21\u0E32\u0E01\u0E21\u0E32\u0E22 \u0E04\u0E27\u0E32\u0E21\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E23\u0E38\u0E19\u0E41\u0E23\u0E07 \u0E21\u0E35\u0E1B\u0E32\u0E01\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E23\u0E07\u0E15\u0E49\u0E32\u0E19\u0E08\u0E32\u0E01\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01 \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E14\u0E47\u0E14\u0E02\u0E32\u0E14\u0E41\u0E25\u0E30\u0E2B\u0E19\u0E31\u0E01\u0E41\u0E19\u0E48\u0E19\u0E43\u0E19\u0E01\u0E32\u0E23\u0E17\u0E25\u0E32\u0E22\u0E01\u0E33\u0E41\u0E1E\u0E07\u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19",
    relationshipMeaningVi: "Hung. Tr\u1EDF ng\u1EA1i b\u1EE7a v\xE2y, m\xE2u thu\u1EABn gay g\u1EAFt, th\u01B0\u1EDDng c\xF3 tranh c\xE3i k\u1ECBch li\u1EC7t ho\u1EB7c l\u1EF1c c\u1EA3n t\u1EEB b\xEAn ngo\xE0i. Ph\u1EA3i ki\xEAn quy\u1EBFt qu\u1EA3 \u0111o\u1EA1n nh\u01B0 c\u1EAFn v\u1EE1 v\u1EADt c\u1EE9ng \u0111\u1EC3 g\u1EA1t b\u1ECF c\u1EA3n tr\u1EDF.",
    category: "\u4E2D",
    scoreRange: [59, 73]
  },
  22: {
    name: "\u5C71\u706B\u8D32",
    nameEn: "Grace",
    nameEs: "La Gracia / La Elegancia",
    nameFr: "La Gr\xE2ce / L'\xC9l\xE9gance",
    nameTh: "\u0E1B\u0E35\u0E49 (\u0E04\u0E27\u0E32\u0E21\u0E07\u0E14\u0E07\u0E32\u0E21\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01)",
    nameVi: "S\u01A1n H\u1ECFa B\xED",
    symbol: "\u2636\u2632",
    nature: "\u6587\u9970",
    natureEn: "Elegant Grace",
    natureTh: "\u0E07\u0E14\u0E07\u0E32\u0E21\u0E41\u0E25\u0E30\u0E2A\u0E07\u0E48\u0E32",
    natureVi: "Thanh l\u1ECBch v\xE0 duy\xEAn d\xE1ng",
    natureEs: "Adorno / Ornamentaci\xF3n",
    natureFr: "Ornement / Embellissement",
    judgment: "\u4EA8\u3002\u5C0F\u5229\u6709\u6538\u5F80",
    judgmentEn: "Smooth progress. Small actions bring benefit.",
    judgmentTh: "\u0E23\u0E32\u0E1A\u0E23\u0E37\u0E48\u0E19 \u0E01\u0E32\u0E23\u0E01\u0E23\u0E30\u0E17\u0E33\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E07\u0E01\u0E47\u0E19\u0E33\u0E21\u0E32\u0E0B\u0E36\u0E48\u0E07\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Hanh th\xF4ng, l\u1EE3i nh\u1ECF c\xF3 th\u1EC3 ti\u1EBFn.",
    relationshipMeaning: "\u5E73\u3002\u91CD\u5916\u8868\u3001\u8F7B\u5B9E\u8D28\uFF0C\u611F\u60C5\u8868\u9762\u770B\u4F3C\u5149\u9C9C\u534E\u4E3D\uFF0C\u5B9E\u5219\u6D41\u4E8E\u5F62\u5F0F\u6216\u7F3A\u4E4F\u6DF1\u5EA6\u3002\u5B9C\u5766\u8BDA\u52A1\u5B9E\uFF0C\u8FFD\u6C42\u5185\u5FC3\u7684\u5951\u5408\u3002",
    relationshipMeaningEn: "Neutral. Focuses on appearance over substance. The relationship looks glamorous but lacks depth or authenticity. Be realistic and seek true inner connection.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E40\u0E19\u0E49\u0E19\u0E20\u0E32\u0E1E\u0E25\u0E31\u0E01\u0E29\u0E13\u0E4C\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E14\u0E39\u0E2A\u0E27\u0E22\u0E2B\u0E23\u0E39\u0E41\u0E15\u0E48\u0E02\u0E32\u0E14\u0E04\u0E27\u0E32\u0E21\u0E25\u0E36\u0E01\u0E0B\u0E36\u0E49\u0E07 \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E08\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E41\u0E17\u0E49\u0E41\u0E25\u0E30\u0E41\u0E2A\u0E27\u0E07\u0E2B\u0E32\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E39\u0E01\u0E1E\u0E31\u0E19\u0E17\u0E32\u0E07\u0E43\u0E08\u0E17\u0E35\u0E48\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07",
    relationshipMeaningVi: "B\xECnh. Tr\u1ECDng v\u1EBB b\u1EC1 ngo\xE0i, nh\u1EB9 b\u1EA3n ch\u1EA5t, t\xECnh c\u1EA3m b\u1EC1 ngo\xE0i tr\xF4ng c\xF3 v\u1EBB h\xE0o nho\xE1ng nh\u01B0ng th\u1EF1c ch\u1EA5t ch\u1EC9 l\xE0 h\xECnh th\u1EE9c ho\u1EB7c thi\u1EBFu chi\u1EC1u s\xE2u. N\xEAn th\xE0nh th\u1EADt th\u1EF1c t\u1EBF, theo \u0111u\u1ED5i s\u1EF1 h\xF2a h\u1EE3p n\u1ED9i t\xE2m.",
    category: "\u4E2D",
    scoreRange: [64, 78]
  },
  23: {
    name: "\u5C71\u5730\u5265",
    nameEn: "Splitting Apart",
    nameEs: "La Desintegraci\xF3n / El Desgarramiento",
    nameFr: "L'\xC9clatement / L'\xC9corchage",
    nameTh: "\u0E42\u0E1B\u0E4B (\u0E01\u0E32\u0E23\u0E25\u0E2D\u0E01\u0E25\u0E48\u0E2D\u0E19)",
    nameVi: "S\u01A1n \u0110\u1ECBa B\xE1c",
    symbol: "\u2636\u2637",
    nature: "\u5265\u843D",
    natureEn: "Peeling Away",
    natureTh: "\u0E25\u0E2D\u0E01\u0E2D\u0E2D\u0E01\u0E17\u0E35\u0E25\u0E30\u0E0A\u0E31\u0E49\u0E19",
    natureVi: "B\xF3c tr\u1EA7n d\u1EA7n d\u1EA7n",
    natureEs: "Desprendimiento / Desgaste",
    natureFr: "Effritement / D\xE9tachement",
    judgment: "\u4E0D\u5229\u6709\u6538\u5F80",
    judgmentEn: "Not advantageous to go forward. Foundations are crumbling.",
    judgmentTh: "\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35\u0E17\u0E35\u0E48\u0E08\u0E30\u0E01\u0E49\u0E32\u0E27\u0E44\u0E1B\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32 \u0E23\u0E32\u0E01\u0E10\u0E32\u0E19\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2A\u0E31\u0E48\u0E19\u0E04\u0E25\u0E2D\u0E19",
    judgmentVi: "B\u1EA5t l\u1EE3i \u0111\u1EC3 ti\u1EBFn l\xEAn, n\u1EC1n t\u1EA3ng \u0111ang lung lay.",
    relationshipMeaning: "\u5927\u51F6\u3002\u57FA\u7840\u52A8\u6447\uFF0C\u611F\u60C5\u9762\u4E34\u5206\u5D29\u79BB\u6790\u3001\u80CC\u53DB\u6216\u5C0F\u4EBA\u7834\u574F\u3002\u4E0D\u5B9C\u76F2\u76EE\u633D\u7559\uFF0C\u6B64\u65F6\u9759\u5B88\u3001\u4FDD\u62A4\u81EA\u5DF1\u624D\u662F\u4E0A\u7B56\u3002",
    relationshipMeaningEn: "Highly inauspicious. Foundations are shaken; relationship faces disintegration, betrayal, or sabotage by backstabbers. Do not force it; keeping quiet and self-preservation is best.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E22\u0E34\u0E48\u0E07 \u0E23\u0E32\u0E01\u0E10\u0E32\u0E19\u0E2A\u0E31\u0E48\u0E19\u0E04\u0E25\u0E2D\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07\u0E15\u0E48\u0E2D\u0E01\u0E32\u0E23\u0E41\u0E15\u0E01\u0E2B\u0E31\u0E01 \u0E01\u0E32\u0E23\u0E17\u0E23\u0E22\u0E28 \u0E2B\u0E23\u0E37\u0E2D\u0E16\u0E39\u0E01\u0E22\u0E38\u0E41\u0E22\u0E07 \u0E44\u0E21\u0E48\u0E04\u0E27\u0E23\u0E23\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49\u0E42\u0E14\u0E22\u0E44\u0E23\u0E49\u0E2A\u0E15\u0E34 \u0E01\u0E32\u0E23\u0E19\u0E34\u0E48\u0E07\u0E2A\u0E07\u0E1A\u0E41\u0E25\u0E30\u0E1B\u0E01\u0E1B\u0E49\u0E2D\u0E07\u0E15\u0E19\u0E40\u0E2D\u0E07\u0E04\u0E37\u0E2D\u0E17\u0E32\u0E07\u0E2D\u0E2D\u0E01\u0E17\u0E35\u0E48\u0E14\u0E35\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14",
    relationshipMeaningVi: "\u0110\u1EA1i hung. N\u1EC1n t\u1EA3ng lung lay, t\xECnh c\u1EA3m \u0111\u1ED1i m\u1EB7t v\u1EDBi tan v\u1EE1, ph\u1EA3n b\u1ED9i ho\u1EB7c ti\u1EC3u nh\xE2n ph\xE1 ho\u1EA1i. Kh\xF4ng n\xEAn m\xF9 qu\xE1ng n\xEDu k\xE9o, l\xFAc n\xE0y gi\u1EEF m\xECnh, b\u1EA3o v\u1EC7 b\u1EA3n th\xE2n m\u1EDBi l\xE0 th\u01B0\u1EE3ng s\xE1ch.",
    category: "\u5F85\u53D8",
    scoreRange: [42, 56]
  },
  24: {
    name: "\u5730\u96F7\u590D",
    nameEn: "Return",
    nameEs: "El Retorno / El Renacimiento",
    nameFr: "Le Retour",
    nameTh: "\u0E1F\u0E39\u0E48 (\u0E01\u0E32\u0E23\u0E2B\u0E27\u0E19\u0E04\u0E37\u0E19)",
    nameVi: "\u0110\u1ECBa L\xF4i Ph\u1EE5c",
    symbol: "\u2637\u2633",
    nature: "\u590D\u5F52",
    natureEn: "Return & Recovery",
    natureTh: "\u0E01\u0E25\u0E31\u0E1A\u0E04\u0E37\u0E19\u0E41\u0E25\u0E30\u0E1F\u0E37\u0E49\u0E19\u0E15\u0E31\u0E27",
    natureVi: "Quay l\u1EA1i v\xE0 ph\u1EE5c h\u1ED3i",
    natureEs: "Retorno / Regreso",
    natureFr: "Retour / Renouveau",
    judgment: "\u4EA8\u3002\u51FA\u5165\u65E0\u75BE",
    judgmentEn: "Great success. Advantageous to see the great person.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1E\u0E1A\u0E1C\u0E39\u0E49\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48",
    judgmentVi: "Hanh th\xF4ng, xu\u1EA5t nh\u1EADp v\xF4 t\u1EADt.",
    relationshipMeaning: "\u5409\u3002\u5931\u53BB\u7684\u611F\u60C5\u6709\u671B\u5931\u800C\u590D\u5F97\uFF0C\u7834\u955C\u91CD\u5706\u3002\u662F\u4E00\u4E2A\u4F11\u517B\u751F\u606F\u3001\u91CD\u65B0\u5F00\u59CB\u7684\u826F\u673A\uFF0C\u8FC7\u53BB\u7684\u95EE\u9898\u5C06\u9010\u6E10\u89E3\u51B3\u3002",
    relationshipMeaningEn: "Auspicious. Lost love has a chance to return; reconciliation is possible. A great opportunity for a fresh start as past issues gradually resolve.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E17\u0E35\u0E48\u0E2A\u0E39\u0E0D\u0E40\u0E2A\u0E35\u0E22\u0E44\u0E1B\u0E21\u0E35\u0E40\u0E01\u0E13\u0E11\u0E4C\u0E44\u0E14\u0E49\u0E2B\u0E27\u0E19\u0E04\u0E37\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E16\u0E48\u0E32\u0E19\u0E44\u0E1F\u0E40\u0E01\u0E48\u0E32\u0E04\u0E38 \u0E40\u0E1B\u0E47\u0E19\u0E42\u0E2D\u0E01\u0E32\u0E2A\u0E14\u0E35\u0E43\u0E19\u0E01\u0E32\u0E23\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E43\u0E2B\u0E21\u0E48 \u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E43\u0E19\u0E2D\u0E14\u0E35\u0E15\u0E08\u0E30\u0E04\u0E48\u0E2D\u0E22\u0E46 \u0E04\u0E25\u0E35\u0E48\u0E04\u0E25\u0E32\u0E22\u0E44\u0E1B\u0E43\u0E19\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E14\u0E35",
    relationshipMeaningVi: "C\xE1t. T\xECnh c\u1EA3m \u0111\xE3 m\u1EA5t c\xF3 hy v\u1ECDng t\xECm l\u1EA1i \u0111\u01B0\u1EE3c, g\u01B0\u01A1ng v\u1EE1 l\u1EA1i l\xE0nh. L\xE0 c\u01A1 h\u1ED9i t\u1ED1t \u0111\u1EC3 d\u01B0\u1EE1ng s\u1EE9c v\xE0 b\u1EAFt \u0111\u1EA7u l\u1EA1i, nh\u1EEFng v\u1EA5n \u0111\u1EC1 trong qu\xE1 kh\u1EE9 s\u1EBD d\u1EA7n \u0111\u01B0\u1EE3c gi\u1EA3i quy\u1EBFt.",
    category: "\u5409",
    scoreRange: [72, 84]
  },
  25: {
    name: "\u5929\u96F7\u65E0\u5984",
    nameEn: "Innocence",
    nameEs: "La Inocencia / Lo Inesperado",
    nameFr: "L'Innocence / L'Impr\xE9vu",
    nameTh: "\u0E2D\u0E39\u0E4B\u0E27\u0E31\u0E48\u0E07 (\u0E04\u0E27\u0E32\u0E21\u0E1A\u0E23\u0E34\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E4C)",
    nameVi: "Thi\xEAn L\xF4i V\xF4 V\u1ECDng",
    symbol: "\u2630\u2633",
    nature: "\u65E0\u5984",
    natureEn: "Spontaneous Integrity",
    natureTh: "\u0E0B\u0E37\u0E48\u0E2D\u0E15\u0E23\u0E07\u0E42\u0E14\u0E22\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34",
    natureVi: "Ch\xEDnh tr\u1EF1c t\u1EF1 nhi\xEAn",
    natureEs: "Sin falsedad / Autenticidad",
    natureFr: "Sans fausset\xE9 / Authenticit\xE9",
    judgment: "\u5143\u4EA8\u5229\u8D1E",
    judgmentEn: "Success, firmness. The great person - auspicious, no blame.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E21\u0E31\u0E48\u0E19\u0E04\u0E07 \u0E1C\u0E39\u0E49\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48\u2014\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E34\u0E14",
    judgmentVi: "Nguy\xEAn hanh l\u1EE3i ch\xEDnh ki\xEAn tr\xEC.",
    relationshipMeaning: "\u5E73\u3002\u611F\u60C5\u5B9C\u987A\u5E94\u81EA\u7136\uFF0C\u4FDD\u6301\u7EAF\u7CB9\uFF0C\u4E0D\u53EF\u5FC3\u5B58\u6295\u673A\u6216\u5F3A\u6C42\u5984\u52A8\u3002\u5E38\u6709\u7A81\u5982\u5176\u6765\u7684\u610F\u5916\u4E8B\u4EF6\u6253\u4E71\u8BA1\u5212\uFF0C\u5B9C\u6C89\u7740\u5E94\u5BF9\u3002",
    relationshipMeaningEn: "Neutral. Keep the relationship pure and natural; avoid opportunism or forced actions. Unexpected events may disrupt plans; stay calm.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E04\u0E27\u0E23\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E43\u0E2B\u0E49\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E44\u0E1B\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E1A\u0E23\u0E34\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E4C\u0E15\u0E32\u0E21\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34 \u0E2D\u0E22\u0E48\u0E32\u0E04\u0E32\u0E14\u0E2B\u0E27\u0E31\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E1D\u0E37\u0E19\u0E08\u0E19\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B \u0E21\u0E31\u0E01\u0E21\u0E35\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E04\u0E32\u0E14\u0E1D\u0E31\u0E19\u0E40\u0E02\u0E49\u0E32\u0E21\u0E32\u0E41\u0E17\u0E23\u0E01\u0E41\u0E0B\u0E07 \u0E15\u0E49\u0E2D\u0E07\u0E15\u0E31\u0E49\u0E07\u0E2A\u0E15\u0E34\u0E43\u0E2B\u0E49\u0E14\u0E35",
    relationshipMeaningVi: "B\xECnh. T\xECnh c\u1EA3m n\xEAn thu\u1EADn theo t\u1EF1 nhi\xEAn, gi\u1EEF s\u1EF1 thu\u1EA7n khi\u1EBFt, kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EA7u c\u01A1 hay khi\xEAn c\u01B0\u1EE1ng h\xE0nh \u0111\u1ED9ng v\xF4 v\u1ECDng. Th\u01B0\u1EDDng c\xF3 s\u1EF1 c\u1ED1 b\u1EA5t ng\u1EDD l\xE0m x\xE1o tr\u1ED9n k\u1EBF ho\u1EA1ch, n\xEAn b\xECnh t\u0129nh \u1EE9ng ph\xF3.",
    category: "\u5409",
    scoreRange: [75, 87]
  },
  26: {
    name: "\u5C71\u5929\u5927\u755C",
    nameEn: "Great Taming",
    nameEs: "La Gran Fuerza Domesticadora",
    nameFr: "Le Grand Pouvoir d'Apprivoisement",
    nameTh: "\u0E15\u0E49\u0E32\u0E0A\u0E39\u0E48 (\u0E01\u0E32\u0E23\u0E2A\u0E30\u0E2A\u0E21\u0E04\u0E23\u0E31\u0E49\u0E07\u0E43\u0E2B\u0E0D\u0E48)",
    nameVi: "S\u01A1n Thi\xEAn \u0110\u1EA1i S\xFAc",
    symbol: "\u2636\u2630",
    nature: "\u79EF\u84C4",
    natureEn: "Accumulation",
    natureTh: "\u0E2A\u0E30\u0E2A\u0E21\u0E44\u0E27\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E22\u0E34\u0E48\u0E07",
    natureVi: "T\xEDch l\u0169y l\u1EDBn lao",
    natureEs: "Gran Acumulaci\xF3n / Reserva",
    natureFr: "Grande Accumulation / R\xE9serve",
    judgment: "\u5229\u8D1E\u3002\u4E0D\u5BB6\u98DF\u5409",
    judgmentEn: "On the si day, trust is established. Supreme success, advantageous, perseverance.",
    judgmentTh: "\u0E27\u0E31\u0E19\u0E28\u0E23\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08\u0E2A\u0E16\u0E32\u0E1B\u0E19\u0E32 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E2D\u0E14\u0E17\u0E19",
    judgmentVi: "Ki\xEAn tr\xEC l\u1EE3i, b\u1EA5t gia th\u1EF1c c\xE1t.",
    relationshipMeaning: "\u5409\u3002\u611F\u60C5\u57FA\u7840\u6DF1\u539A\uFF0C\u80FD\u91CF\u4E0E\u4FE1\u4EFB\u4E0D\u65AD\u79EF\u7D2F\u3002\u5229\u4E8E\u957F\u671F\u89C4\u5212\u53CA\u89C1\u5BB6\u957F\u3002\u867D\u7136\u5F53\u524D\u7565\u6709\u514B\u5236\u6216\u7B49\u5F85\uFF0C\u4F46\u524D\u9014\u5149\u660E\u3002",
    relationshipMeaningEn: "Auspicious. Deep foundation with accumulating trust and energy. Favorable for long-term planning and meeting parents. Even with temporary restraint, the future is bright.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E23\u0E32\u0E01\u0E10\u0E32\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E41\u0E19\u0E48\u0E19\u0E2B\u0E19\u0E32 \u0E04\u0E27\u0E32\u0E21\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E08\u0E2A\u0E30\u0E2A\u0E21\u0E21\u0E32\u0E01\u0E02\u0E36\u0E49\u0E19 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E41\u0E01\u0E48\u0E01\u0E32\u0E23\u0E27\u0E32\u0E07\u0E41\u0E1C\u0E19\u0E23\u0E30\u0E22\u0E30\u0E22\u0E32\u0E27\u0E2B\u0E23\u0E37\u0E2D\u0E1E\u0E32\u0E44\u0E1B\u0E1E\u0E1A\u0E1C\u0E39\u0E49\u0E43\u0E2B\u0E0D\u0E48 \u0E41\u0E21\u0E49\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E14\u0E17\u0E19\u0E23\u0E2D\u0E04\u0E2D\u0E22\u0E41\u0E15\u0E48 \u0E2D\u0E19\u0E32\u0E04\u0E15\u0E23\u0E38\u0E48\u0E07\u0E42\u0E23\u0E08\u0E19\u0E4C\u0E41\u0E19\u0E48\u0E19\u0E2D\u0E19",
    relationshipMeaningVi: "C\xE1t. N\u1EC1n t\u1EA3ng t\xECnh c\u1EA3m s\xE2u s\u1EAFc, n\u0103ng l\u01B0\u1EE3ng v\xE0 s\u1EF1 tin t\u01B0\u1EDFng kh\xF4ng ng\u1EEBng t\xEDch l\u0169y. C\xF3 l\u1EE3i cho quy ho\u1EA1ch l\xE2u d\xE0i v\xE0 ra m\u1EAFt gia \u0111\xECnh. Tuy hi\u1EC7n t\u1EA1i c\xF3 ch\xFAt k\xECm n\xE9n ho\u1EB7c ch\u1EDD \u0111\u1EE3i, nh\u01B0ng ti\u1EC1n \u0111\u1ED3 t\u01B0\u01A1i s\xE1ng.",
    category: "\u5409",
    scoreRange: [76, 88]
  },
  27: {
    name: "\u5C71\u96F7\u9890",
    nameEn: "Nourishment (The Corners of the Mouth)",
    nameEs: "Las Comisuras de la Boca / La Nutrici\xF3n",
    nameFr: "Les Coins de la Bouche / La Nutrition",
    nameTh: "\u0E2D\u0E35\u0E4B (\u0E01\u0E32\u0E23\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E14\u0E39\u0E1F\u0E39\u0E21\u0E1F\u0E31\u0E01)",
    nameVi: "S\u01A1n L\xF4i Di",
    symbol: "\u2636\u2633",
    nature: "\u9890\u517B",
    natureEn: "Nourishment & Care",
    natureTh: "\u0E1A\u0E33\u0E23\u0E38\u0E07\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E14\u0E39",
    natureVi: "Nu\xF4i d\u01B0\u1EE1ng v\xE0 ch\u0103m s\xF3c",
    natureEs: "Nutrici\xF3n / Sustento",
    natureFr: "Nourriture / Entretien",
    judgment: "\u8D1E\u5409\u3002\u89C2\u9890\u81EA\u6C42\u53E3\u5B9E",
    judgmentEn: "Success. Fear brings blessing.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E04\u0E27\u0E32\u0E21\u0E40\u0E01\u0E23\u0E07\u0E01\u0E25\u0E49\u0E32\u0E19\u0E33\u0E21\u0E32\u0E0B\u0E36\u0E48\u0E07\u0E1E\u0E23",
    judgmentVi: "Ki\xEAn tr\xEC c\xE1t t\u01B0\u1EDDng, quan d\u0129 t\u1EF1 c\u1EA7u kh\u1EA9u th\u1EF1c.",
    relationshipMeaning: "\u5E73\u3002\u6CE8\u91CD\u8A00\u8BED\u6C9F\u901A\u4E0E\u751F\u6D3B\u7167\u6599\u3002\u7978\u4ECE\u53E3\u51FA\uFF0C\u9700\u9632\u53E3\u820C\u6469\u64E6\u3002\u591A\u5173\u5FC3\u5F7C\u6B64\u7684\u8EAB\u5FC3\u5065\u5EB7\u4E0E\u7CBE\u795E\u6ECB\u517B\uFF0C\u611F\u60C5\u65B9\u80FD\u957F\u4E45\u3002",
    relationshipMeaningEn: "Neutral. Focus on verbal communication and mutual care. Guard against sharp words causing friction. Nurture each others physical and mental well-being for longevity.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E40\u0E19\u0E49\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E37\u0E48\u0E2D\u0E2A\u0E32\u0E23\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E14\u0E39\u0E41\u0E25\u0E40\u0E2D\u0E32\u0E43\u0E08\u0E43\u0E2A\u0E48\u0E0A\u0E35\u0E27\u0E34\u0E15\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E22\u0E39\u0E48 \u0E23\u0E30\u0E27\u0E31\u0E07\u0E04\u0E33\u0E1E\u0E39\u0E14\u0E17\u0E35\u0E48\u0E2D\u0E32\u0E08\u0E1A\u0E32\u0E14\u0E2B\u0E21\u0E32\u0E07\u0E19\u0E49\u0E33\u0E43\u0E08 \u0E04\u0E27\u0E23\u0E40\u0E15\u0E34\u0E21\u0E40\u0E15\u0E47\u0E21\u0E1E\u0E25\u0E31\u0E07\u0E01\u0E32\u0E22\u0E41\u0E25\u0E30\u0E43\u0E08\u0E43\u0E2B\u0E49\u0E01\u0E31\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E08\u0E36\u0E07\u0E08\u0E30\u0E22\u0E31\u0E48\u0E07\u0E22\u0E37\u0E19",
    relationshipMeaningVi: "B\xECnh. Ch\xFA tr\u1ECDng giao ti\u1EBFp ng\xF4n t\u1EEB v\xE0 ch\u0103m s\xF3c cu\u1ED9c s\u1ED1ng. H\u1ECDa t\u1EEB mi\u1EC7ng m\xE0 ra, c\u1EA7n ph\xF2ng ma s\xE1t kh\u1EA9u thi\u1EC7t. Quan t\xE2m nhi\u1EC1u h\u01A1n \u0111\u1EBFn s\u1EE9c kh\u1ECFe th\u1EC3 ch\u1EA5t l\u1EABn tinh th\u1EA7n c\u1EE7a nhau th\xEC t\xECnh c\u1EA3m m\u1EDBi b\u1EC1n l\xE2u.",
    category: "\u4E2D",
    scoreRange: [63, 77]
  },
  28: {
    name: "\u6CFD\u98CE\u5927\u8FC7",
    nameEn: "Great Exceeding",
    nameEs: "El Gran Exceso",
    nameFr: "Le Grand Exc\xE8s",
    nameTh: "\u0E15\u0E49\u0E32\u0E01\u0E31\u0E49\u0E27 (\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E01\u0E23\u0E31\u0E1A\u0E2B\u0E19\u0E31\u0E01\u0E2B\u0E19\u0E48\u0E27\u0E07)",
    nameVi: "Tr\u1EA1ch Phong \u0110\u1EA1i Qu\xE1",
    symbol: "\u2631\u2634",
    nature: "\u8FC7\u751A",
    natureEn: "Excessive",
    natureTh: "\u0E40\u0E01\u0E34\u0E19\u0E1E\u0E2D\u0E14\u0E35",
    natureVi: "Qu\xE1 m\u1EE9c",
    natureEs: "Exceso / Demas\xEDa",
    natureFr: "Exc\xE8s / D\xE9passer la mesure",
    judgment: "\u680B\u6861\u5229\u6709\u6538\u5F80\u4EA8",
    judgmentEn: "Keeping his back still, he does not obtain his body.",
    judgmentTh: "\u0E19\u0E34\u0E48\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E27",
    judgmentVi: "\u0110\u1ED1ng ki\u1EC1u, l\u1EE3i h\u1EEFu duy ti\u1EBFn hanh.",
    relationshipMeaning: "\u51F6\u3002\u538B\u529B\u8FC7\u5927\uFF0C\u5173\u7CFB\u5931\u8861\uFF0C\u9762\u4E34\u6C89\u91CD\u7684\u73B0\u5B9E\u8D1F\u62C5\u6216\u611F\u60C5\u5371\u673A\uFF08\u5982\u680B\u6881\u5F2F\u66F2\uFF09\u3002\u65E0\u6CD5\u627F\u53D7\u65F6\u9700\u679C\u65AD\u5BFB\u627E\u7A81\u7834\u53E3\u3002",
    relationshipMeaningEn: "Inauspicious. Excessive pressure and imbalance; facing heavy practical burdens or crisis (like a sagging ridgepole). Find a breakthrough before it collapses.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E01\u0E14\u0E14\u0E31\u0E19\u0E2A\u0E39\u0E07\u0E21\u0E32\u0E01 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E40\u0E2A\u0E35\u0E22\u0E2A\u0E21\u0E14\u0E38\u0E25 \u0E41\u0E1A\u0E01\u0E23\u0E31\u0E1A\u0E20\u0E32\u0E23\u0E30\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E23\u0E34\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E27\u0E34\u0E01\u0E24\u0E15\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E17\u0E35\u0E48\u0E2B\u0E19\u0E31\u0E01\u0E2B\u0E19\u0E48\u0E27\u0E07\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B \u0E15\u0E49\u0E2D\u0E07\u0E2B\u0E32\u0E17\u0E32\u0E07\u0E2D\u0E2D\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E23\u0E48\u0E07\u0E14\u0E48\u0E27\u0E19\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E30\u0E1E\u0E31\u0E07\u0E17\u0E25\u0E32\u0E22",
    relationshipMeaningVi: "Hung. \xC1p l\u1EF1c qu\xE1 l\u1EDBn, quan h\u1EC7 m\u1EA5t c\xE2n b\u1EB1ng, \u0111\u1ED1i m\u1EB7t v\u1EDBi g\xE1nh n\u1EB7ng th\u1EF1c t\u1EBF n\u1EB7ng n\u1EC1 ho\u1EB7c nguy c\u01A1 t\xECnh c\u1EA3m (nh\u01B0 k\xE8o c\u1ED9t cong v\u1EB9o). Khi kh\xF4ng th\u1EC3 ch\u1ECBu \u0111\u1EF1ng c\u1EA7n qu\u1EA3 \u0111o\xE1n t\xECm l\u1ED1i tho\xE1t.",
    category: "\u5F85\u53D8",
    scoreRange: [50, 66]
  },
  29: {
    name: "\u574E\u4E3A\u6C34",
    nameEn: "The Abysmal (Water)",
    nameEs: "Lo Abismal / El Agua",
    nameFr: "L'Insondable / L'Eau",
    nameTh: "\u0E02\u0E48\u0E32\u0E19 (\u0E2B\u0E49\u0E27\u0E07\u0E19\u0E49\u0E33\u0E25\u0E36\u0E01)",
    nameVi: "Kh\u1EA3m Vi Th\u1EE7y",
    symbol: "\u2635\u2635",
    nature: "\u9677\u9669",
    natureEn: "Falling into Danger",
    natureTh: "\u0E15\u0E01\u0E2A\u0E39\u0E48\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22",
    natureVi: "R\u01A1i v\xE0o nguy hi\u1EC3m",
    natureEs: "Peligro / Inmersi\xF3n",
    natureFr: "Danger / Immersion",
    judgment: "\u4E60\u574E\u6709\u5B5A\u7EF4\u5FC3\u4EA8",
    judgmentEn: "Double danger \u2014 maintain sincerity of heart, and the way opens.",
    judgmentTh: "\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22\u0E0B\u0E49\u0E2D\u0E19\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22 \u2014 \u0E23\u0E31\u0E01\u0E29\u0E32\u0E04\u0E27\u0E32\u0E21\u0E0B\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E15\u0E22\u0E4C\u0E43\u0E19\u0E08\u0E34\u0E15\u0E43\u0E08 \u0E17\u0E32\u0E07\u0E08\u0E30\u0E40\u0E1B\u0E34\u0E14\u0E01\u0E27\u0E49\u0E32\u0E07",
    judgmentVi: "T\u1EADp kh\u1EA3m h\u1EEFu ph\u01B0\u1EDBc duy t\xE2m hanh.",
    relationshipMeaning: "\u5927\u51F6\u3002\u91CD\u91CD\u9669\u9677\uFF0C\u5371\u673A\u56DB\u4F0F\u3002\u611F\u60C5\u5145\u65A5\u7740\u731C\u5FCC\u3001\u4E0D\u5B89\u6216\u9677\u5165\u65E0\u6CD5\u81EA\u62D4\u7684\u56F0\u5883\u3002\u9700\u4FDD\u6301\u5185\u5FC3\u8BDA\u4FE1\uFF0C\u8C28\u614E\u884C\u4E8B\uFF0C\u5207\u52FF\u94E4\u800C\u8D70\u9669\u3002",
    relationshipMeaningEn: "Highly inauspicious. Surrounded by dangers and crises. Relationship is full of suspicion, insecurity, or inescapable dilemmas. Maintain integrity and act with caution.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E22\u0E34\u0E48\u0E07 \u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E20\u0E22\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22\u0E41\u0E25\u0E30\u0E27\u0E34\u0E01\u0E24\u0E15\u0E0B\u0E49\u0E33\u0E0B\u0E49\u0E2D\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E21\u0E35\u0E41\u0E15\u0E48\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E27\u0E32\u0E14\u0E23\u0E30\u0E41\u0E27\u0E07 \u0E44\u0E21\u0E48\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07 \u0E2B\u0E23\u0E37\u0E2D\u0E15\u0E34\u0E14\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2B\u0E25\u0E38\u0E21\u0E1E\u0E23\u0E32\u0E07 \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E2A\u0E15\u0E34\u0E41\u0E25\u0E30\u0E0B\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E15\u0E22\u0E4C \u0E2D\u0E22\u0E48\u0E32\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07\u0E17\u0E33\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E1C\u0E34\u0E14",
    relationshipMeaningVi: "\u0110\u1EA1i hung. Hi\u1EC3m h\u1ECDa tr\xF9ng tr\xF9ng, nguy c\u01A1 b\u1EE7a v\xE2y. T\xECnh c\u1EA3m tr\xE0n ng\u1EADp nghi k\u1EF5, b\u1EA5t an ho\u1EB7c r\u01A1i v\xE0o kh\u1ED1n c\u1EA3nh kh\xF4ng th\u1EC3 t\u1EF1 tho\xE1t ra. C\u1EA7n gi\u1EEF v\u1EEFng l\xF2ng th\xE0nh, c\u1EA9n tr\u1ECDng h\xE0nh s\u1EF1, tuy\u1EC7t \u0111\u1ED1i kh\xF4ng li\u1EC1u l\u0129nh.",
    category: "\u4E2D",
    scoreRange: [55, 69]
  },
  30: {
    name: "\u79BB\u4E3A\u706B",
    nameEn: "The Clinging (Fire)",
    nameEs: "Lo Adherente / El Fuego",
    nameFr: "L'Attachement / Le Feu",
    nameTh: "\u0E2B\u0E25\u0E35 (\u0E40\u0E1B\u0E25\u0E27\u0E44\u0E1F)",
    nameVi: "Ly Vi H\u1ECFa",
    symbol: "\u2632\u2632",
    nature: "\u9644\u4E3D",
    natureEn: "Attachment & Adherence",
    natureTh: "\u0E22\u0E36\u0E14\u0E16\u0E37\u0E2D\u0E41\u0E25\u0E30\u0E1C\u0E39\u0E01\u0E1E\u0E31\u0E19",
    natureVi: "B\xE1m v\xEDu v\xE0 g\u1EAFn b\xF3",
    natureEs: "Adhesi\xF3n / Resplandor",
    natureFr: "Adh\xE9sion / \xC9clat",
    judgment: "\u5229\u8D1E\u4EA8",
    judgmentEn: "Advancing - misfortune. Nothing advantageous.",
    judgmentTh: "\u0E01\u0E49\u0E32\u0E27\u0E44\u0E1B\u2014\u0E2D\u0E31\u0E1B\u0E21\u0E07\u0E04\u0E25 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E48\u0E07\u0E43\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Ki\xEAn tr\xEC hanh th\xF4ng.",
    relationshipMeaning: "\u5409\u3002\u70ED\u60C5\u4F3C\u706B\uFF0C\u5145\u6EE1\u5149\u660E\u4E0E\u5E0C\u671B\uFF0C\u5F7C\u6B64\u4F9D\u9644\u3002\u4F46\u706B\u52BF\u8FC7\u65FA\u6613\u5BFC\u81F4\u813E\u6C14\u66B4\u8E81\u3001\u7F3A\u4E4F\u8010\u6027\uFF0C\u9700\u4FDD\u6301\u5916\u660E\u5185\u67D4\uFF0C\u6587\u660E\u76F8\u5F85\u3002",
    relationshipMeaningEn: "Auspicious. Passionate like fire, full of light and hope, clinging to each other. However, excessive fire leads to hot tempers and impatience; remain gentle inside.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E23\u0E49\u0E2D\u0E19\u0E41\u0E23\u0E07\u0E14\u0E31\u0E48\u0E07\u0E44\u0E1F \u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E27\u0E31\u0E07\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E1E\u0E36\u0E48\u0E07\u0E1E\u0E32\u0E2D\u0E32\u0E28\u0E31\u0E22\u0E01\u0E31\u0E19 \u0E41\u0E15\u0E48\u0E44\u0E1F\u0E17\u0E35\u0E48\u0E41\u0E23\u0E07\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B\u0E2D\u0E32\u0E08\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E43\u0E08\u0E23\u0E49\u0E2D\u0E19\u0E41\u0E25\u0E30\u0E02\u0E32\u0E14\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E14\u0E17\u0E19 \u0E04\u0E27\u0E23\u0E1B\u0E23\u0E30\u0E04\u0E2D\u0E07\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19",
    relationshipMeaningVi: "C\xE1t. Nhi\u1EC7t t\xECnh nh\u01B0 l\u1EEDa, \u0111\u1EA7y quang minh v\xE0 hy v\u1ECDng, n\u01B0\u01A1ng t\u1EF1a l\u1EABn nhau. Nh\u01B0ng l\u1EEDa qu\xE1 v\u01B0\u1EE3ng d\u1EC5 d\u1EABn \u0111\u1EBFn t\xEDnh kh\xED b\u1EA1o t\xE1o, thi\u1EBFu ki\xEAn nh\u1EABn, c\u1EA7n gi\u1EEF ngo\xE0i s\xE1ng trong nhu, \u0111\u1ED1i x\u1EED v\u0103n minh.",
    category: "\u5409",
    scoreRange: [77, 89]
  },
  31: {
    name: "\u6CFD\u5C71\u54B8",
    nameEn: "Influence (Wooing)",
    nameEs: "La Influencia / El Cortejo",
    nameFr: "L'Influence / L'Attraction",
    nameTh: "\u0E40\u0E2A\u0E35\u0E22\u0E19 (\u0E41\u0E23\u0E07\u0E14\u0E36\u0E07\u0E14\u0E39\u0E14\u0E43\u0E08)",
    nameVi: "Tr\u1EA1ch S\u01A1n H\xE0m",
    symbol: "\u2631\u2636",
    nature: "\u611F\u5E94",
    natureEn: "Mutual Response",
    natureTh: "\u0E15\u0E2D\u0E1A\u0E2A\u0E19\u0E2D\u0E07\u0E0B\u0E36\u0E48\u0E07\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E31\u0E19",
    natureVi: "T\u01B0\u01A1ng \u1EE9ng l\u1EABn nhau",
    natureEs: "Resonancia / Atracci\xF3n mutua",
    natureFr: "R\xE9sonance / Influence mutuelle",
    judgment: "\u4EA8\u5229\u8D1E\u53D6\u5973\u5409",
    judgmentEn: "Success. The king need not worry. It is fitting at noon.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E01\u0E29\u0E31\u0E15\u0E23\u0E34\u0E22\u0E4C\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E07\u0E27\u0E25 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07\u0E27\u0E31\u0E19",
    judgmentVi: "Nguy\xEAn hanh l\u1EE3i ch\xEDnh, th\u1EA5t n\u1EEF c\xE1t.",
    relationshipMeaning: "\u5927\u5409\u3002\u5C11\u7537\u5C11\u5973\u5FC3\u7075\u611F\u5E94\uFF0C\u7B2C\u4E00\u5370\u8C61\u6781\u4F73\uFF0C\u5F7C\u6B64\u6DF1\u6DF1\u5438\u5F15\uFF0C\u5145\u6EE1\u6D6A\u6F2B\u60C5\u8C03\u3002\u6781\u5176\u5229\u4E8E\u604B\u7231\u53D1\u5C55\uFF0C\u4E24\u60C5\u76F8\u60A6\u3002",
    relationshipMeaningEn: "Highly auspicious. Telepathic connection and excellent first impression. Deep mutual attraction, highly romantic, perfect for dating and mutual affection.",
    relationshipMeaningTh: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E43\u0E08\u0E15\u0E23\u0E07\u0E01\u0E31\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E23\u0E38\u0E19\u0E41\u0E23\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E17\u0E31\u0E1A\u0E43\u0E08\u0E41\u0E23\u0E01\u0E1E\u0E1A\u0E14\u0E35\u0E40\u0E22\u0E35\u0E48\u0E22\u0E21 \u0E14\u0E36\u0E07\u0E14\u0E39\u0E14\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E31\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E36\u0E01\u0E0B\u0E36\u0E49\u0E07 \u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E42\u0E23\u0E41\u0E21\u0E19\u0E15\u0E34\u0E01\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E21\u0E2B\u0E27\u0E31\u0E07\u0E43\u0E19\u0E23\u0E31\u0E01",
    relationshipMeaningVi: "\u0110\u1EA1i c\xE1t. Trai t\xE0i g\xE1i s\u1EAFc t\xE2m linh t\u01B0\u01A1ng th\xF4ng, \u1EA5n t\u01B0\u1EE3ng \u0111\u1EA7u ti\xEAn c\u1EF1c t\u1ED1t, \u0111\xF4i b\xEAn thu h\xFAt s\xE2u s\u1EAFc, tr\xE0n ng\u1EADp t\xECnh \u0111i\u1EC7u l\xE3ng m\u1EA1n. C\u1EF1c k\u1EF3 c\xF3 l\u1EE3i cho ph\xE1t tri\u1EC3n t\xECnh c\u1EA3m, hai b\xEAn t\xECnh nguy\u1EC7n.",
    category: "\u5927\u5409",
    scoreRange: [86, 97]
  },
  32: {
    name: "\u96F7\u98CE\u6052",
    nameEn: "Duration (Perseverance)",
    nameEs: "La Duraci\xF3n / La Constancia",
    nameFr: "La Dur\xE9e / La Constance",
    nameTh: "\u0E40\u0E2B\u0E34\u0E07 (\u0E04\u0E27\u0E32\u0E21\u0E22\u0E31\u0E48\u0E07\u0E22\u0E37\u0E19\u0E04\u0E07\u0E21\u0E31\u0E48\u0E19)",
    nameVi: "L\xF4i Phong H\u1EB1ng",
    symbol: "\u2633\u2634",
    nature: "\u6052\u4E45",
    natureEn: "Enduring",
    natureTh: "\u0E22\u0E31\u0E48\u0E07\u0E22\u0E37\u0E19\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07",
    natureVi: "B\u1EC1n b\u1EC9 tr\u01B0\u1EDDng t\u1ED3n",
    natureEs: "Permanencia / Eternidad",
    natureFr: "Permanence / \xC9ternit\xE9",
    judgment: "\u4EA8\u65E0\u548E\u5229\u8D1E",
    judgmentEn: "Minor success. The traveler - firmness, auspicious.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22 \u0E1C\u0E39\u0E49\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u2014\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07 \u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25",
    judgmentVi: "Hanh th\xF4ng v\xF4 l\u1ED7i, ki\xEAn tr\xEC l\u1EE3i.",
    relationshipMeaning: "\u5409\u3002\u6052\u4E45\u7A33\u5B9A\uFF0C\u7EC6\u6C34\u957F\u6D41\u3002\u867D\u7136\u7F3A\u4E4F\u65B0\u9C9C\u611F\uFF0C\u4F46\u5173\u7CFB\u575A\u5982\u78D0\u77F3\uFF0C\u5229\u4E8E\u7F14\u7ED3\u826F\u7F18\u3001\u767D\u5934\u5055\u8001\u3002\u8D35\u5728\u575A\u6301\u521D\u5FC3\u3002",
    relationshipMeaningEn: "Auspicious. Long-lasting and stable, a slow-burning bond. Though lacking novelty, the relationship is rock-solid, favorable for marriage and lifelong commitment. Key is maintaining the initial intent.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E22\u0E32\u0E27\u0E19\u0E32\u0E19 \u0E23\u0E31\u0E01\u0E41\u0E17\u0E49\u0E14\u0E39\u0E41\u0E25\u0E44\u0E14\u0E49 \u0E41\u0E21\u0E49\u0E08\u0E30\u0E02\u0E32\u0E14\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1B\u0E25\u0E01\u0E43\u0E2B\u0E21\u0E48\u0E41\u0E15\u0E48\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E2B\u0E19\u0E31\u0E01\u0E41\u0E19\u0E48\u0E19\u0E14\u0E31\u0E48\u0E07\u0E2B\u0E34\u0E19\u0E1C\u0E32 \u0E14\u0E35\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19 \u0E04\u0E35\u0E22\u0E4C\u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E04\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32\u0E1B\u0E13\u0E34\u0E18\u0E32\u0E19\u0E41\u0E23\u0E01\u0E40\u0E23\u0E34\u0E48\u0E21",
    relationshipMeaningVi: "C\xE1t. H\u1EB1ng c\u1EEDu \u1ED5n \u0111\u1ECBnh, b\u1EC1n v\u1EEFng l\xE2u d\xE0i. Tuy thi\u1EBFu \u0111i c\u1EA3m gi\xE1c t\u01B0\u01A1i m\u1EDBi nh\u01B0ng quan h\u1EC7 v\u1EEFng nh\u01B0 b\xE0n th\u1EA1ch, l\u1EE3i cho vi\u1EC7c k\u1EBFt t\xF3c se duy\xEAn, b\u1EA1c \u0111\u1EA7u giai l\xE3o. Qu\xFD \u1EDF ch\u1ED7 ki\xEAn tr\xEC t\xE2m nguy\u1EC7n ban \u0111\u1EA7u.",
    category: "\u5927\u5409",
    scoreRange: [84, 95]
  },
  33: {
    name: "\u5929\u5C71\u9041",
    nameEn: "Retreat",
    nameEs: "La Retirada",
    nameFr: "La Retraite",
    nameTh: "\u0E15\u0E38\u0E49\u0E19 (\u0E01\u0E32\u0E23\u0E1B\u0E25\u0E35\u0E01\u0E15\u0E31\u0E27)",
    nameVi: "Thi\xEAn S\u01A1n \u0110\u1ED9n",
    symbol: "\u2630\u2636",
    nature: "\u9000\u907F",
    natureEn: "Retreat & Avoidance",
    natureTh: "\u0E16\u0E2D\u0E22\u0E2B\u0E19\u0E35\u0E41\u0E25\u0E30\u0E2B\u0E25\u0E35\u0E01\u0E40\u0E25\u0E35\u0E48\u0E22\u0E07",
    natureVi: "R\xFAt lui v\xE0 l\xE1nh tr\xE1nh",
    natureEs: "Retirada / Evasi\xF3n",
    natureFr: "Retraite / \xC9vasion",
    judgment: "\u4EA8\u5C0F\u5229\u8D1E",
    judgmentEn: "Minor success. Advantageous to move.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22 \u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E44\u0E2B\u0E27\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Hanh th\xF4ng, ti\u1EC3u l\u1EE3i ki\xEAn tr\xEC.",
    relationshipMeaning: "\u51F6\u3002\u8FD0\u52BF\u8870\u9000\uFF0C\u5371\u673A\u6E10\u663E\u3002\u6B64\u65F6\u4E0D\u5B9C\u76F2\u76EE\u8FDB\u653B\u6216\u5F3A\u6C42\u5728\u4E00\u8D77\uFF0C\u9002\u5F53\u62C9\u5F00\u8DDD\u79BB\u3001\u4EE5\u9000\u4E3A\u8FDB\uFF0C\u4FDD\u6301\u51B7\u9759\u624D\u662F\u4FDD\u62A4\u611F\u60C5\u7684\u826F\u7B56\u3002",
    relationshipMeaningEn: "Inauspicious. Declining fortune with emerging crises. Do not force intimacy; taking a step back and keeping a strategic distance is best.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E14\u0E27\u0E07\u0E0A\u0E30\u0E15\u0E32\u0E16\u0E14\u0E16\u0E2D\u0E22\u0E41\u0E25\u0E30\u0E40\u0E23\u0E34\u0E48\u0E21\u0E21\u0E35\u0E27\u0E34\u0E01\u0E24\u0E15 \u0E44\u0E21\u0E48\u0E04\u0E27\u0E23\u0E1D\u0E37\u0E19\u0E14\u0E36\u0E07\u0E14\u0E31\u0E19\u0E14\u0E36\u0E07\u0E0A\u0E34\u0E14\u0E43\u0E01\u0E25\u0E49 \u0E01\u0E32\u0E23\u0E40\u0E27\u0E49\u0E19\u0E23\u0E30\u0E22\u0E30\u0E2B\u0E48\u0E32\u0E07\u0E41\u0E25\u0E30\u0E16\u0E2D\u0E22\u0E2D\u0E2D\u0E01\u0E21\u0E32\u0E15\u0E31\u0E49\u0E07\u0E2B\u0E25\u0E31\u0E01\u0E04\u0E37\u0E2D\u0E17\u0E32\u0E07\u0E2D\u0E2D\u0E01\u0E17\u0E35\u0E48\u0E14\u0E35\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14",
    relationshipMeaningVi: "Hung. V\u1EADn th\u1EBF suy tho\xE1i, nguy c\u01A1 d\u1EA7n l\u1ED9 di\u1EC7n. L\xFAc n\xE0y kh\xF4ng n\xEAn m\xF9 qu\xE1ng t\u1EA5n c\xF4ng hay khi\xEAn c\u01B0\u1EE1ng b\xEAn nhau, t\u1EA1m th\u1EDDi gi\u1EEF kho\u1EA3ng c\xE1ch, l\u1EA5y lui l\xE0m ti\u1EBFn m\u1EDBi l\xE0 th\u01B0\u1EE3ng s\xE1ch.",
    category: "\u4E2D",
    scoreRange: [58, 72]
  },
  34: {
    name: "\u96F7\u5929\u5927\u58EE",
    nameEn: "Great Power (Strength)",
    nameEs: "El Poder de lo Grande",
    nameFr: "La Puissance du Grand",
    nameTh: "\u0E15\u0E49\u0E32\u0E08\u0E49\u0E32\u0E07 (\u0E04\u0E27\u0E32\u0E21\u0E41\u0E02\u0E47\u0E07\u0E41\u0E01\u0E23\u0E48\u0E07\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48)",
    nameVi: "L\xF4i Thi\xEAn \u0110\u1EA1i Tr\xE1ng",
    symbol: "\u2633\u2630",
    nature: "\u58EE\u76DB",
    natureEn: "Flourishing Power",
    natureTh: "\u0E1E\u0E25\u0E31\u0E07\u0E40\u0E08\u0E23\u0E34\u0E0D\u0E23\u0E38\u0E48\u0E07\u0E40\u0E23\u0E37\u0E2D\u0E07",
    natureVi: "S\u1EE9c m\u1EA1nh h\u01B0ng th\u1ECBnh",
    natureEs: "Vigor / Esplendor",
    natureFr: "Puissance / Vigueur",
    judgment: "\u5229\u8D1E",
    judgmentEn: "Success, advantageous, firm.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E21\u0E31\u0E48\u0E19\u0E04\u0E07",
    judgmentVi: "L\u1EE3i ki\xEAn tr\xEC.",
    relationshipMeaning: "\u5409\u3002\u58F0\u52BF\u6D69\u5927\uFF0C\u5145\u6EE1\u529B\u91CF\u4E0E\u51B2\u52B2\u3002\u4F46\u9700\u6CE8\u610F\u5927\u58EE\u5229\u8D1E\uFF0C\u5207\u5FCC\u8FC7\u5EA6\u5F3A\u52BF\u3001\u4EFB\u6027\u51B2\u52A8\u6216\u5BF9\u4F34\u4FA3\u65BD\u52A0\u538B\u529B\uFF0C\u67D4\u548C\u76F8\u5904\u65B9\u80FD\u6301\u4E45\u3002",
    relationshipMeaningEn: "Auspicious. Powerful and full of momentum. However, avoid being overly dominant or impulsive; softening your approach ensures longevity.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E21\u0E35\u0E1E\u0E25\u0E31\u0E07\u0E41\u0E25\u0E30\u0E41\u0E23\u0E07\u0E02\u0E31\u0E1A\u0E40\u0E04\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E2A\u0E39\u0E07\u0E21\u0E32\u0E01 \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E17\u0E33\u0E15\u0E31\u0E27\u0E40\u0E1B\u0E47\u0E19\u0E43\u0E2B\u0E0D\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E43\u0E0A\u0E49\u0E2D\u0E32\u0E23\u0E21\u0E13\u0E4C\u0E02\u0E48\u0E21\u0E04\u0E19\u0E23\u0E31\u0E01 \u0E04\u0E27\u0E32\u0E21\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19\u0E08\u0E30\u0E0A\u0E48\u0E27\u0E22\u0E43\u0E2B\u0E49\u0E23\u0E31\u0E01\u0E22\u0E31\u0E48\u0E07\u0E22\u0E37\u0E19",
    relationshipMeaningVi: "C\xE1t. Thanh th\u1EBF vang d\u1ED9i, \u0111\u1EA7y s\u1EE9c m\u1EA1nh v\xE0 xung l\u1EF1c. Nh\u01B0ng c\u1EA7n ch\xFA \xFD tr\xE1nh qu\xE1 m\u1EE9c m\u1EA1nh m\u1EBD, t\xF9y h\u1EE9ng b\u1ED1c \u0111\u1ED3ng ho\u1EB7c g\xE2y \xE1p l\u1EF1c cho ng\u01B0\u1EDDi \u1EA5y, d\u1ECBu d\xE0ng m\u1EDBi c\xF3 th\u1EC3 b\u1EC1n l\xE2u.",
    category: "\u5409",
    scoreRange: [74, 86]
  },
  35: {
    name: "\u706B\u5730\u664B",
    nameEn: "Progress",
    nameEs: "El Progreso",
    nameFr: "Le Progr\xE8s",
    nameTh: "\u0E08\u0E34\u0E49\u0E19 (\u0E04\u0E27\u0E32\u0E21\u0E01\u0E49\u0E32\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E42\u0E0A\u0E15\u0E34\u0E0A\u0E48\u0E27\u0E07)",
    nameVi: "H\u1ECFa \u0110\u1ECBa T\u1EA5n",
    symbol: "\u2632\u2637",
    nature: "\u664B\u5347",
    natureEn: "Advancement",
    natureTh: "\u0E01\u0E49\u0E32\u0E27\u0E2B\u0E19\u0E49\u0E32",
    natureVi: "Ti\u1EBFn l\xEAn",
    natureEs: "Ascenso / Avance",
    natureFr: "Ascension / Avancement",
    judgment: "\u5EB7\u4FAF\u7528\u9521\u9A6C\u8543\u5EB6",
    judgmentEn: "The king arrives at the temple. Advantageous to cross the great river.",
    judgmentTh: "\u0E01\u0E29\u0E31\u0E15\u0E23\u0E34\u0E22\u0E4C\u0E40\u0E2A\u0E14\u0E47\u0E08\u0E16\u0E36\u0E07\u0E27\u0E31\u0E14 \u0E02\u0E49\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E43\u0E2B\u0E0D\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "H\u01B0ng h\u1EA7u chi d\u1EE5ng t\xEDch m\xE3 ph\u1ED3n th\u1EE9.",
    relationshipMeaning: "\u5927\u5409\u3002\u5982\u65E5\u4E2D\u5929\uFF0C\u611F\u60C5\u8FD0\u52BF\u8282\u8282\u6500\u5347\u3002\u5F7C\u6B64\u5438\u5F15\u529B\u500D\u589E\uFF0C\u6C9F\u901A\u987A\u7545\u4E14\u5145\u6EE1\u6B63\u80FD\u91CF\uFF0C\u975E\u5E38\u9002\u5408\u516C\u5F00\u5173\u7CFB\u3001\u8C08\u5A5A\u8BBA\u5AC1\u6216\u5171\u540C\u521B\u4E1A\u3002",
    relationshipMeaningEn: "Highly auspicious. Rapid progress like the rising sun. Mutual attraction peaks with positive energy; perfect for making the relationship public or planning marriage.",
    relationshipMeaningTh: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E23\u0E38\u0E48\u0E07\u0E42\u0E23\u0E08\u0E19\u0E4C\u0E14\u0E31\u0E48\u0E07\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E22\u0E32\u0E21\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07\u0E27\u0E31\u0E19 \u0E15\u0E48\u0E32\u0E07\u0E1D\u0E48\u0E32\u0E22\u0E15\u0E48\u0E32\u0E07\u0E14\u0E36\u0E07\u0E14\u0E39\u0E14\u0E01\u0E31\u0E19 \u0E21\u0E35\u0E1E\u0E25\u0E31\u0E07\u0E1A\u0E27\u0E01 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E38\u0E22\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19",
    relationshipMeaningVi: "\u0110\u1EA1i c\xE1t. Nh\u01B0 m\u1EB7t tr\u1EDDi ban tr\u01B0a, v\u1EADn tr\xECnh t\xECnh c\u1EA3m th\u0103ng ti\u1EBFn kh\xF4ng ng\u1EEBng. S\u1EE9c h\xFAt \u0111\xF4i b\xEAn t\u0103ng v\u1ECDt, giao ti\u1EBFp th\xF4ng su\u1ED1t, r\u1EA5t th\xEDch h\u1EE3p c\xF4ng khai quan h\u1EC7 ho\u1EB7c t\xEDnh chuy\u1EC7n tr\u0103m n\u0103m.",
    category: "\u5409",
    scoreRange: [73, 85]
  },
  36: {
    name: "\u5730\u706B\u660E\u5937",
    nameEn: "Darkening of the Light",
    nameEs: "El Oscurecimiento de la Luz",
    nameFr: "L'Obscurcissement de la Lumi\xE8re",
    nameTh: "\u0E2B\u0E21\u0E34\u0E07\u0E2D\u0E35\u0E4B (\u0E41\u0E2A\u0E07\u0E2A\u0E27\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E1A\u0E14\u0E1A\u0E31\u0E07)",
    nameVi: "\u0110\u1ECBa H\u1ECFa Minh Di",
    symbol: "\u2637\u2632",
    nature: "\u635F\u4F24",
    natureEn: "Harm & Injury",
    natureTh: "\u0E40\u0E1A\u0E35\u0E22\u0E14\u0E40\u0E1A\u0E35\u0E22\u0E19\u0E41\u0E25\u0E30\u0E1A\u0E32\u0E14\u0E40\u0E08\u0E47\u0E1A",
    natureVi: "T\u1ED5n th\u01B0\u01A1ng v\xE0 h\u1EA1i",
    natureEs: "Herida / Da\xF1o",
    natureFr: "Blessure / Dommage",
    judgment: "\u5229\u8270\u8D1E",
    judgmentEn: "Success. Bitter limitation. One must not persevere.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E02\u0E49\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14\u0E02\u0E21\u0E02\u0E37\u0E48\u0E19 \u0E44\u0E21\u0E48\u0E04\u0E27\u0E23\u0E2D\u0E14\u0E17\u0E19\u0E15\u0E48\u0E2D\u0E44\u0E1B",
    judgmentVi: "L\u1EE3i gian nan ki\xEAn tr\xEC.",
    relationshipMeaning: "\u51F6\u3002\u5149\u660E\u53D7\u635F\uFF0C\u611F\u60C5\u8FDB\u5165\u6666\u6697\u671F\u3002\u5145\u6EE1\u8BEF\u89E3\u3001\u4F24\u5BB3\u6216\u5185\u5FC3\u75DB\u82E6\u3002\u6B64\u65F6\u5B9C\u655B\u85CF\u950B\u8292\uFF0C\u9690\u5FCD\u5305\u5BB9\uFF0C\u5207\u52FF\u5728\u60C5\u7EEA\u5931\u63A7\u65F6\u505A\u91CD\u5927\u51B3\u5B9A\u3002",
    relationshipMeaningEn: "Inauspicious. Darkness prevails; relationship enters a gloomy phase filled with misunderstandings and pain. Keep a low profile and avoid impulsive decisions.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E15\u0E01\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E21\u0E37\u0E14\u0E21\u0E19 \u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E1C\u0E34\u0E14\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E27\u0E14 \u0E04\u0E27\u0E23\u0E40\u0E01\u0E47\u0E1A\u0E0B\u0E48\u0E2D\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E41\u0E25\u0E30\u0E2D\u0E14\u0E17\u0E19\u0E44\u0E27\u0E49 \u0E2D\u0E22\u0E48\u0E32\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E43\u0E08\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E0D\u0E48\u0E22\u0E32\u0E21\u0E2D\u0E32\u0E23\u0E21\u0E13\u0E4C\u0E0A\u0E31\u0E48\u0E27\u0E27\u0E39\u0E1A",
    relationshipMeaningVi: "Hung. \xC1nh s\xE1ng b\u1ECB t\u1ED5n h\u1EA1i, t\xECnh c\u1EA3m r\u01A1i v\xE0o giai \u0111o\u1EA1n t\u0103m t\u1ED1i. \u0110\u1EA7y r\u1EABy hi\u1EC3u l\u1EA7m, t\u1ED5n th\u01B0\u01A1ng ho\u1EB7c \u0111au kh\u1ED5 n\u1ED9i t\xE2m. L\xFAc n\xE0y n\xEAn thu m\xECnh nh\u1EABn nh\u1ECBn, tr\xE1nh quy\u1EBFt \u0111\u1ECBnh khi k\xEDch \u0111\u1ED9ng.",
    category: "\u5C0F\u51F6",
    scoreRange: [47, 61]
  },
  37: {
    name: "\u706B\u98CE\u9F0E",
    nameEn: "The Cauldron",
    nameEs: "El Clan / La Familia",
    nameFr: "Le Clan / La Famille",
    nameTh: "\u0E40\u0E08\u0E35\u0E22\u0E40\u0E2B\u0E23\u0E34\u0E19 (\u0E04\u0E19\u0E43\u0E19\u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E23\u0E31\u0E27)",
    nameVi: "Phong H\u1ECFa Gia Nh\xE2n",
    symbol: "\u2632\u2634",
    nature: "\u9F0E\u65B0",
    natureEn: "Establishing New Order",
    natureTh: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E1A\u0E43\u0E2B\u0E21\u0E48",
    natureVi: "Thi\u1EBFt l\u1EADp tr\u1EADt t\u1EF1 m\u1EDBi",
    natureEs: "Esp\xEDritu Familiar / Interior",
    natureFr: "Esprit de Famille / Int\xE9rieur",
    judgment: "\u5143\u5409\u4EA8",
    judgmentEn: "Pig and fish. Auspicious. Advantageous to cross the great river.",
    judgmentTh: "\u0E2B\u0E21\u0E39\u0E41\u0E25\u0E30\u0E1B\u0E25\u0E32 \u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25 \u0E02\u0E49\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E43\u0E2B\u0E0D\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Nguy\xEAn c\xE1t hanh th\xF4ng.",
    relationshipMeaning: "\u5409\u3002\u5145\u6EE1\u6E29\u99A8\u3001\u8D23\u4EFB\u4E0E\u966A\u4F34\u7684\u5173\u7CFB\u3002\u5F7C\u6B64\u5404\u53F8\u5176\u804C\uFF0C\u76F8\u5904\u878D\u6D3D\uFF0C\u6781\u5177\u5BB6\u5EAD\u5F52\u5C5E\u611F\u3002\u5229\u4E8E\u540C\u5C45\u3001\u89C1\u5BB6\u957F\u53CA\u7EC4\u5EFA\u5BB6\u5EAD\u3002",
    relationshipMeaningEn: "Auspicious. Filled with warmth, responsibility, and companionship. Both parties play their roles well with a strong sense of home. Great for moving in together.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E2D\u0E1A\u0E2D\u0E38\u0E48\u0E19 \u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A\u0E41\u0E25\u0E30\u0E14\u0E39\u0E41\u0E25\u0E01\u0E31\u0E19\u0E14\u0E31\u0E48\u0E07\u0E04\u0E19\u0E43\u0E19\u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E23\u0E31\u0E27 \u0E2D\u0E22\u0E39\u0E48\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E14\u0E35 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E43\u0E0A\u0E49\u0E0A\u0E35\u0E27\u0E34\u0E15\u0E04\u0E39\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2D\u0E19\u0E32\u0E04\u0E15\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19",
    relationshipMeaningVi: "C\xE1t. M\u1ED1i quan h\u1EC7 \u0111\u1EA7y \u1EA5m \xE1p, tr\xE1ch nhi\u1EC7m v\xE0 s\u1EF1 \u0111\u1ED3ng h\xE0nh. \u0110\xF4i b\xEAn \u0111\u1EC1u l\xE0m t\u1ED1t b\u1ED5n ph\u1EADn, chung s\u1ED1ng h\xF2a h\u1EE3p, mang l\u1EA1i c\u1EA3m gi\xE1c gia \u0111\xECnh. L\u1EE3i cho vi\u1EC7c chung s\u1ED1ng ho\u1EB7c k\u1EBFt h\xF4n.",
    category: "\u5409",
    scoreRange: [75, 87]
  },
  38: {
    name: "\u706B\u6CFD\u777D",
    nameEn: "Opposition (Divergence)",
    nameEs: "La Oposici\xF3n / El Antagonismo",
    nameFr: "L'Opposition / L'Ali\xE9nation",
    nameTh: "\u0E40\u0E04\u0E48\u0E27\u0E22 (\u0E04\u0E27\u0E32\u0E21\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E40\u0E2B\u0E34\u0E19\u0E2B\u0E48\u0E32\u0E07)",
    nameVi: "H\u1ECFa Tr\u1EA1ch Khu\xEA",
    symbol: "\u2632\u2631",
    nature: "\u80CC\u79BB",
    natureEn: "Separation",
    natureTh: "\u0E41\u0E22\u0E01\u0E08\u0E32\u0E01\u0E01\u0E31\u0E19",
    natureVi: "S\u1EF1 chia l\xECa",
    natureEs: "Divergencia / Separaci\xF3n",
    natureFr: "Divergence / S\xE9paration",
    judgment: "\u5C0F\u4E8B\u5409",
    judgmentEn: "Success, advantageous, firm. Can do small things, cannot do great things.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E21\u0E31\u0E48\u0E19\u0E04\u0E07 \u0E17\u0E33\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E25\u0E47\u0E01\u0E44\u0E14\u0E49 \u0E17\u0E33\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E0D\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49",
    judgmentVi: "Ti\u1EC3u s\u1EF1 c\xE1t.",
    relationshipMeaning: "\u51F6\u3002\u4EBA\u5FC3\u80CC\u79BB\uFF0C\u540C\u5E8A\u5F02\u68A6\u3002\u56E0\u6027\u683C\u3001\u4EF7\u503C\u89C2\u5DEE\u5F02\u5BFC\u81F4\u9891\u7E41\u6469\u64E6\uFF0C\u96BE\u4EE5\u8FBE\u6210\u5171\u8BC6\u3002\u5C0F\u4E8B\u5C1A\u53EF\uFF0C\u5927\u4E8B\u4E0D\u5B9C\uFF0C\u9700\u5BFB\u627E\u6C42\u540C\u5B58\u5F02\u7684\u652F\u70B9\u3002",
    relationshipMeaningEn: "Inauspicious. Divergent paths and emotional distance. Frequent friction due to differing values. Seek common ground while respecting differences.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E2A\u0E27\u0E19\u0E17\u0E32\u0E07\u0E01\u0E31\u0E19 \u0E21\u0E2D\u0E07\u0E04\u0E19\u0E25\u0E30\u0E21\u0E38\u0E21 \u0E40\u0E01\u0E34\u0E14\u0E01\u0E32\u0E23\u0E01\u0E23\u0E30\u0E17\u0E1A\u0E01\u0E23\u0E30\u0E17\u0E31\u0E48\u0E07\u0E08\u0E32\u0E01\u0E17\u0E31\u0E28\u0E19\u0E04\u0E15\u0E34\u0E17\u0E35\u0E48\u0E15\u0E48\u0E32\u0E07\u0E01\u0E31\u0E19\u0E1A\u0E48\u0E2D\u0E22\u0E04\u0E23\u0E31\u0E49\u0E07 \u0E15\u0E49\u0E2D\u0E07\u0E2B\u0E32\u0E08\u0E38\u0E14\u0E15\u0E23\u0E07\u0E01\u0E25\u0E32\u0E07\u0E41\u0E25\u0E30\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E15\u0E48\u0E32\u0E07\u0E43\u0E2B\u0E49\u0E44\u0E14\u0E49",
    relationshipMeaningVi: "Hung. \u0110\u1ED3ng s\xE0ng d\u1ECB m\u1ED9ng, l\xF2ng ng\u01B0\u1EDDi xa c\xE1ch. Do t\xEDnh c\xE1ch, quan \u0111i\u1EC3m s\u1ED1ng kh\xE1c bi\u1EC7t d\u1EABn \u0111\u1EBFn ma s\xE1t th\u01B0\u1EDDng xuy\xEAn, kh\xF3 \u0111\u1EA1t \u0111\u1ED3ng thu\u1EADn. C\u1EA7n t\xECm \u0111i\u1EC3m chung, g\u1EA1t b\u1ECF b\u1EA5t \u0111\u1ED3ng.",
    category: "\u4E2D",
    scoreRange: [56, 70]
  },
  39: {
    name: "\u6C34\u5C71\u8E47",
    nameEn: "Obstruction",
    nameEs: "La Obstrucci\xF3n / El Impedimento",
    nameFr: "L'Obstruction / L'Entrave",
    nameTh: "\u0E40\u0E08\u0E35\u0E48\u0E22\u0E19 (\u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04\u0E02\u0E27\u0E32\u0E01\u0E2B\u0E19\u0E32\u0E21)",
    nameVi: "Th\u1EE7y S\u01A1n Ki\u1EC3n",
    symbol: "\u2635\u2636",
    nature: "\u8DDB\u96BE",
    natureEn: "Difficulty & Limping",
    natureTh: "\u0E25\u0E33\u0E1A\u0E32\u0E01\u0E41\u0E25\u0E30\u0E01\u0E30\u0E40\u0E1C\u0E25\u0E01",
    natureVi: "Kh\xF3 kh\u0103n v\xE0 kh\u1EADp khi\u1EC5ng",
    natureEs: "Dificultad / Cojera",
    natureFr: "Difficult\xE9 / Boitement",
    judgment: "\u5229\u897F\u5357\u4E0D\u5229\u4E1C\u5317",
    judgmentEn: "Success. The little fox has almost crossed, wets its tail.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E2A\u0E38\u0E19\u0E31\u0E02\u0E08\u0E34\u0E49\u0E07\u0E08\u0E2D\u0E01\u0E19\u0E49\u0E2D\u0E22\u0E02\u0E49\u0E32\u0E21\u0E43\u0E01\u0E25\u0E49\u0E08\u0E30\u0E16\u0E36\u0E07 \u0E2B\u0E32\u0E07\u0E40\u0E1B\u0E35\u0E22\u0E01",
    judgmentVi: "L\u1EE3i \u0111\xF4ng nam, b\u1EA5t l\u1EE3i \u0111\xF4ng b\u1EAFc.",
    relationshipMeaning: "\u51F6\u3002\u524D\u8DEF\u9669\u963B\uFF0C\u4E3E\u6B65\u7EF4\u8270\u3002\u611F\u60C5\u9762\u4E34\u4E25\u91CD\u7684\u73B0\u5B9E\u963B\u529B\uFF08\u5982\u7ECF\u6D4E\u3001\u5730\u57DF\u6216\u5BB6\u5EAD\u53CD\u5BF9\uFF09\uFF0C\u5F3A\u884C\u63A8\u8FDB\u53EA\u4F1A\u78B0\u58C1\uFF0C\u5B9C\u53CD\u6C42\u8BF8\u5DF1\uFF0C\u5BFB\u6C42\u5916\u63F4\u3002",
    relationshipMeaningEn: "Inauspicious. Hardships ahead; relationship faces severe practical obstacles (finance, long distance, or family disapproval). Stop and review your options.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E2B\u0E19\u0E17\u0E32\u0E07\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E21\u0E35\u0E41\u0E15\u0E48\u0E2A\u0E34\u0E48\u0E07\u0E01\u0E35\u0E14\u0E02\u0E27\u0E32\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E40\u0E08\u0E2D\u0E41\u0E23\u0E07\u0E15\u0E49\u0E32\u0E19\u0E08\u0E32\u0E01\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07 (\u0E40\u0E0A\u0E48\u0E19 \u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E23\u0E31\u0E27\u0E44\u0E21\u0E48\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A \u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E30\u0E22\u0E30\u0E17\u0E32\u0E07) \u0E04\u0E27\u0E23\u0E2B\u0E22\u0E38\u0E14\u0E17\u0E1A\u0E17\u0E27\u0E19\u0E41\u0E25\u0E30\u0E2B\u0E32\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E36\u0E01\u0E29\u0E32",
    relationshipMeaningVi: "Hung. \u0110\u01B0\u1EDDng \u0111i hi\u1EC3m tr\u1EDF, b\u01B0\u1EDBc \u0111i gian nan. T\xECnh c\u1EA3m \u0111\u1ED1i m\u1EB7t v\u1EDBi tr\u1EDF l\u1EF1c th\u1EF1c t\u1EBF nghi\xEAm tr\u1ECDng (kinh t\u1EBF, \u0111\u1ECBa l\xFD ho\u1EB7c gia \u0111\xECnh ph\u1EA3n \u0111\u1ED1i), c\u1ED1 ch\u1EA5p ch\u1EC9 r\u01B0\u1EDBc l\u1EA5y th\u1EA5t b\u1EA1i.",
    category: "\u5C0F\u51F6",
    scoreRange: [49, 63]
  },
  40: {
    name: "\u96F7\u6C34\u89E3",
    nameEn: "Deliverance (Resolution)",
    nameEs: "La Liberaci\xF3n",
    nameFr: "La Lib\xE9ration",
    nameTh: "\u0E40\u0E08\u0E35\u0E48\u0E22 (\u0E01\u0E32\u0E23\u0E04\u0E25\u0E35\u0E48\u0E04\u0E25\u0E32\u0E22)",
    nameVi: "L\xF4i Th\u1EE7y Gi\u1EA3i",
    symbol: "\u2633\u2635",
    nature: "\u5316\u89E3",
    natureEn: "Dissolution",
    natureTh: "\u0E04\u0E25\u0E35\u0E48\u0E04\u0E25\u0E32\u0E22",
    natureVi: "Gi\u1EA3i t\u1ECFa",
    natureEs: "Disoluci\xF3n / Alivio",
    natureFr: "R\xE9solution / Dissolution",
    judgment: "\u5229\u897F\u5357",
    judgmentEn: "Favorable in the southwest.",
    judgmentTh: "\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35\u0E17\u0E32\u0E07\u0E15\u0E30\u0E27\u0E31\u0E19\u0E15\u0E01\u0E40\u0E09\u0E35\u0E22\u0E07\u0E43\u0E15\u0E49",
    judgmentVi: "L\u1EE3i \u0111\xF4ng nam.",
    relationshipMeaning: "\u5409\u3002\u52AB\u540E\u4F59\u751F\uFF0C\u8BEF\u4F1A\u51B0\u91CA\u3002\u8FC7\u53BB\u7684\u77DB\u76FE\u3001\u51B7\u6218\u6216\u5371\u673A\u5C06\u8FCE\u6765\u8F6C\u673A\u5E76\u83B7\u5F97\u89E3\u51B3\u3002\u5B9C\u628A\u63E1\u65F6\u673A\u65E2\u5F80\u4E0D\u548E\uFF0C\u8BA9\u5173\u7CFB\u91CD\u65B0\u51FA\u53D1\u3002",
    relationshipMeaningEn: "Auspicious. Misunderstandings dissolve and crises recede. A perfect timing to forgive, forget, and let the relationship move forward smoothly.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E27\u0E34\u0E01\u0E24\u0E15\u0E04\u0E25\u0E35\u0E48\u0E04\u0E25\u0E32\u0E22 \u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E1C\u0E34\u0E14\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02 \u0E04\u0E27\u0E32\u0E21\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E07\u0E04\u0E23\u0E32\u0E21\u0E40\u0E22\u0E47\u0E19\u0E43\u0E19\u0E2D\u0E14\u0E35\u0E15\u0E08\u0E30\u0E2A\u0E34\u0E49\u0E19\u0E2A\u0E38\u0E14\u0E25\u0E07 \u0E04\u0E27\u0E23\u0E43\u0E2B\u0E49\u0E2D\u0E20\u0E31\u0E22\u0E41\u0E25\u0E30\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19",
    relationshipMeaningVi: "C\xE1t. Tai qua n\u1EA1n kh\u1ECFi, b\u0103ng tan hi\u1EC3u l\u1EA7m. Nh\u1EEFng m\xE2u thu\u1EABn, chi\u1EBFn tranh l\u1EA1nh hay nguy c\u01A1 tr\u01B0\u1EDBc \u0111\xE2y s\u1EBD \u0111\u01B0\u1EE3c gi\u1EA3i quy\u1EBFt. N\xEAn n\u1EAFm b\u1EAFt th\u1EDDi c\u01A1, kh\xF4ng l\u01B0\u1EDDng g\u1EA1t qu\xE1 kh\u1EE9 \u0111\u1EC3 l\xE0m l\u1EA1i t\u1EEB \u0111\u1EA7u.",
    category: "\u5409",
    scoreRange: [71, 83]
  },
  41: {
    name: "\u5C71\u6CFD\u635F",
    nameEn: "Decrease",
    nameEs: "La Disminuci\xF3n",
    nameFr: "La Diminution",
    nameTh: "\u0E2A\u0E38\u0E48\u0E19 (\u0E01\u0E32\u0E23\u0E40\u0E2A\u0E35\u0E22\u0E2A\u0E25\u0E30)",
    nameVi: "S\u01A1n Tr\u1EA1ch T\u1ED5n",
    symbol: "\u2636\u2631",
    nature: "\u51CF\u635F",
    natureEn: "Reduction & Restraint",
    natureTh: "\u0E25\u0E14\u0E25\u0E07\u0E41\u0E25\u0E30\u0E02\u0E48\u0E21\u0E44\u0E27\u0E49",
    natureVi: "Gi\u1EA3m b\u1EDBt v\xE0 ki\u1EC1m ch\u1EBF",
    natureEs: "Reducci\xF3n / P\xE9rdida",
    natureFr: "R\xE9duction / Perte",
    judgment: "\u6709\u5B5A\u5143\u5409\u65E0\u548E",
    judgmentEn: "Sincere, great success, no blame.",
    judgmentTh: "\u0E08\u0E23\u0E34\u0E07\u0E43\u0E08 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E34\u0E14",
    judgmentVi: "H\u1EEFu ph\u01B0\u1EDBc nguy\xEAn c\xE1t v\xF4 l\u1ED7i.",
    relationshipMeaning: "\u5E73\u3002\u611F\u60C5\u9700\u8981\u4E00\u65B9\u505A\u51FA\u7269\u8D28\u3001\u7CBE\u529B\u6216\u60C5\u7EEA\u4E0A\u7684\u727A\u7272\u4E0E\u5949\u732E\u3002\u635F\u5DF1\u5229\u4EBA\uFF0C\u867D\u7136\u6682\u65F6\u611F\u5230\u5403\u529B\uFF0C\u4F46\u53EA\u8981\u51FA\u4E8E\u771F\u5FC3\uFF0C\u957F\u8FDC\u6765\u770B\u53CD\u80FD\u6362\u6765\u7A33\u56FA\u3002",
    relationshipMeaningEn: "Neutral. Requires sacrifice of material, energy, or emotion from one party. Though demanding now, sincere devotion will yield long-term stability.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E1D\u0E48\u0E32\u0E22\u0E43\u0E14\u0E1D\u0E48\u0E32\u0E22\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E22\u0E2D\u0E21\u0E40\u0E2A\u0E35\u0E22\u0E2A\u0E25\u0E30\u0E17\u0E23\u0E31\u0E1E\u0E22\u0E4C\u0E2A\u0E34\u0E19 \u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E2D\u0E32\u0E23\u0E21\u0E13\u0E4C\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E2D\u0E35\u0E01\u0E1D\u0E48\u0E32\u0E22 \u0E41\u0E21\u0E49\u0E08\u0E30\u0E40\u0E2B\u0E19\u0E37\u0E48\u0E2D\u0E22\u0E43\u0E19\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49 \u0E41\u0E15\u0E48\u0E2B\u0E32\u0E01\u0E17\u0E33\u0E14\u0E49\u0E27\u0E22\u0E43\u0E08\u0E08\u0E23\u0E34\u0E07\u0E08\u0E30\u0E2A\u0E48\u0E07\u0E1C\u0E25\u0E14\u0E35\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30\u0E22\u0E32\u0E27",
    relationshipMeaningVi: "B\xECnh. T\xECnh c\u1EA3m \u0111\xF2i h\u1ECFi m\u1ED9t b\xEAn ph\u1EA3i hy sinh, c\u1ED1ng hi\u1EBFn v\u1EC1 v\u1EADt ch\u1EA5t, tinh th\u1EA7n ho\u1EB7c c\u1EA3m x\xFAc. T\u1ED5n m\xECnh l\u1EE3i ng\u01B0\u1EDDi, tuy t\u1EA1m th\u1EDDi v\u1EA5t v\u1EA3 nh\u01B0ng n\u1EBFu ch\xE2n th\xE0nh s\u1EBD \u0111\u1ED5i l\u1EA1i s\u1EF1 b\u1EC1n v\u1EEFng.",
    category: "\u4E2D",
    scoreRange: [62, 76]
  },
  42: {
    name: "\u98CE\u96F7\u76CA",
    nameEn: "Increase",
    nameEs: "El Aumento",
    nameFr: "L'Augmentation",
    nameTh: "\u0E2D\u0E35\u0E49 (\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1E\u0E39\u0E19)",
    nameVi: "Phong L\xF4i \xCDch",
    symbol: "\u2634\u2633",
    nature: "\u589E\u76CA",
    natureEn: "Growth & Increase",
    natureTh: "\u0E40\u0E08\u0E23\u0E34\u0E0D\u0E40\u0E15\u0E34\u0E1A\u0E42\u0E15\u0E41\u0E25\u0E30\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E1E\u0E39\u0E19",
    natureVi: "T\u0103ng tr\u01B0\u1EDFng v\xE0 gia t\u0103ng",
    natureEs: "Ganancia / Beneficio",
    natureFr: "Gain / Enrichissement",
    judgment: "\u5229\u6709\u6538\u5F80\u5229\u6D89\u5927\u5DDD",
    judgmentEn: "Advantageous to go forward, advantageous to cross the great river.",
    judgmentTh: "\u0E44\u0E1B\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E02\u0E49\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E43\u0E2B\u0E0D\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "L\u1EE3i h\u1EEFu duy ti\u1EBFn, l\u1EE3i tham s\xF4ng l\u1EDBn.",
    relationshipMeaning: "\u5927\u5409\u3002\u76F8\u8F85\u76F8\u6210\uFF0C\u5171\u540C\u6210\u957F\u3002\u5F7C\u6B64\u5728\u7CBE\u795E\u4E0E\u7269\u8D28\u4E0A\u90FD\u80FD\u5E26\u7ED9\u5BF9\u65B9\u597D\u8FD0\uFF0C\u5173\u7CFB\u6781\u5177\u5EFA\u8BBE\u6027\u3002\u662F\u643A\u624B\u5171\u521B\u672A\u6765\u3001\u8BA2\u5A5A\u7ED3\u5A5A\u7684\u7EDD\u4F73\u65F6\u673A\u3002",
    relationshipMeaningEn: "Highly auspicious. Mutual growth and support. Both partners bring good fortune and constructiveness to each others lives. Excellent time for marriage.",
    relationshipMeaningTh: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E2A\u0E48\u0E07\u0E40\u0E2A\u0E23\u0E34\u0E21\u0E41\u0E25\u0E30\u0E40\u0E15\u0E34\u0E1A\u0E42\u0E15\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19 \u0E19\u0E33\u0E1E\u0E32\u0E42\u0E0A\u0E04\u0E04\u0E25\u0E32\u0E20\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02\u0E21\u0E32\u0E43\u0E2B\u0E49\u0E41\u0E01\u0E48\u0E01\u0E31\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E01\u0E49\u0E32\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E21\u0E32\u0E01 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E41\u0E01\u0E48\u0E01\u0E32\u0E23\u0E08\u0E31\u0E14\u0E07\u0E32\u0E19\u0E21\u0E07\u0E04\u0E25\u0E2B\u0E21\u0E31\u0E49\u0E19\u0E2B\u0E21\u0E32\u0E22",
    relationshipMeaningVi: "\u0110\u1EA1i c\xE1t. T\u01B0\u01A1ng ph\u1EE5 t\u01B0\u01A1ng th\xE0nh, c\xF9ng nhau tr\u01B0\u1EDFng th\xE0nh. \u0110\xF4i b\xEAn \u0111em l\u1EA1i v\u1EADn may cho nhau c\u1EA3 v\u1EC1 tinh th\u1EA7n l\u1EABn v\u1EADt ch\u1EA5t. L\xE0 th\u1EDDi c\u01A1 tuy\u1EC7t v\u1EDDi \u0111\u1EC3 h\u01B0\u1EDBng t\u1EDBi h\xF4n nh\xE2n vi\xEAn m\xE3n.",
    category: "\u5409",
    scoreRange: [79, 91]
  },
  43: {
    name: "\u6CFD\u5929\u592C",
    nameEn: "Breakthrough",
    nameEs: "La Irrupci\xF3n / La Resoluci\xF3n",
    nameFr: "La Perc\xE9e / La R\xE9solution",
    nameTh: "\u0E44\u0E01\u0E49\u0E27 (\u0E01\u0E32\u0E23\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E43\u0E08\u0E40\u0E14\u0E47\u0E14\u0E02\u0E32\u0E14)",
    nameVi: "Tr\u1EA1ch Thi\xEAn Qu\xE1i",
    symbol: "\u2631\u2630",
    nature: "\u51B3\u65AD",
    natureEn: "Decisive Action",
    natureTh: "\u0E25\u0E07\u0E21\u0E37\u0E2D\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E47\u0E14\u0E02\u0E32\u0E14",
    natureVi: "H\xE0nh \u0111\u1ED9ng quy\u1EBFt \u0111o\xE1n",
    natureEs: "Decisi\xF3n / Determinaci\xF3n",
    natureFr: "D\xE9cision / Trancher",
    judgment: "\u626C\u4E8E\u738B\u5EAD\u53F7\u5389",
    judgmentEn: "Proclaimed in the king's court \u2014 crying out, danger.",
    judgmentTh: "\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28 \u0E13 \u0E23\u0E32\u0E0A\u0E2A\u0E33\u0E19\u0E31\u0E01 \u2014 \u0E23\u0E49\u0E2D\u0E07\u0E42\u0E2B\u0E48 \u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22",
    judgmentVi: "D\u01B0\u01A1ng vu v\u01B0\u01A1ng \u0111\xECnh, hi\u1EC7u l\u1EC7 li\u1EC5u.",
    relationshipMeaning: "\u5E73\u3002\u9762\u4E34\u91CD\u5927\u6289\u62E9\u6216\u644A\u724C\u65F6\u523B\uFF0C\u77DB\u76FE\u5DF2\u5230\u4E0D\u5F97\u4E0D\u89E3\u51B3\u7684\u4E34\u754C\u70B9\u3002\u51B3\u65AD\u9700\u679C\u65AD\u4E14\u6709\u667A\u6167\uFF0C\u5207\u5FCC\u610F\u6C14\u7528\u4E8B\uFF0C\u8981\u7528\u5149\u660E\u6B63\u5927\u7684\u65B9\u5F0F\u89E3\u51B3\u3002",
    relationshipMeaningEn: "Neutral. Time for a major decision or showdown. Issues have reached a boiling point; resolve them resolutely and righteously rather than emotionally.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E16\u0E36\u0E07\u0E40\u0E27\u0E25\u0E32\u0E15\u0E49\u0E2D\u0E07\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E43\u0E08\u0E04\u0E23\u0E31\u0E49\u0E07\u0E43\u0E2B\u0E0D\u0E48\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1B\u0E34\u0E14\u0E2D\u0E01\u0E04\u0E38\u0E22 \u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E16\u0E36\u0E07\u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2A\u0E30\u0E2A\u0E32\u0E07 \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E14\u0E47\u0E14\u0E02\u0E32\u0E14\u0E41\u0E25\u0E30\u0E43\u0E0A\u0E49\u0E2A\u0E15\u0E34 \u0E2D\u0E22\u0E48\u0E32\u0E43\u0E0A\u0E49\u0E2D\u0E32\u0E23\u0E21\u0E13\u0E4C\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E1B\u0E31\u0E0D\u0E2B\u0E32",
    relationshipMeaningVi: "B\xECnh. \u0110\u1ED1i m\u1EB7t v\u1EDBi l\u1EF1a ch\u1ECDn l\u1EDBn ho\u1EB7c th\u1EDDi kh\u1EAFc ng\u1EEDa b\xE0i, m\xE2u thu\u1EABn \u0111\xE3 \u0111\u1EBFn \u0111i\u1EC3m t\u1EDBi h\u1EA1n ph\u1EA3i gi\u1EA3i quy\u1EBFt. C\u1EA7n qu\u1EA3 quy\u1EBFt v\xE0 kh\xF4n ngoan, tr\xE1nh h\xE0nh x\u1EED theo c\u1EA3m t\xEDnh.",
    category: "\u5F85\u53D8",
    scoreRange: [51, 65]
  },
  44: {
    name: "\u5929\u98CE\u59E4",
    nameEn: "Coming to Meet",
    nameEs: "Encantamiento / El Encuentro",
    nameFr: "La Rencontre",
    nameTh: "\u0E42\u0E01\u0E49\u0E27 (\u0E01\u0E32\u0E23\u0E1E\u0E1A\u0E40\u0E08\u0E2D\u0E42\u0E14\u0E22\u0E1A\u0E31\u0E07\u0E40\u0E2D\u0E34\u0E0D)",
    nameVi: "Thi\xEAn Phong C\u1EA5u",
    symbol: "\u2630\u2634",
    nature: "\u9082\u9005",
    natureEn: "Unexpected Encounter",
    natureTh: "\u0E1E\u0E1A\u0E01\u0E31\u0E19\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E04\u0E32\u0E14\u0E1D\u0E31\u0E19",
    natureVi: "G\u1EB7p g\u1EE1 b\u1EA5t ng\u1EDD",
    natureEs: "Encuentro Fortuito",
    natureFr: "Rencontre Fortuite",
    judgment: "\u5973\u58EE\u52FF\u7528\u53D6\u5973",
    judgmentEn: "The maiden is powerful \u2014 do not marry a maiden.",
    judgmentTh: "\u0E2B\u0E0D\u0E34\u0E07\u0E2A\u0E32\u0E27\u0E21\u0E35\u0E2D\u0E33\u0E19\u0E32\u0E08 \u2014 \u0E2D\u0E22\u0E48\u0E32\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19\u0E01\u0E31\u0E1A\u0E2B\u0E0D\u0E34\u0E07\u0E2A\u0E32\u0E27",
    judgmentVi: "N\u1EEF tr\xE1ng v\u1EADt d\u1EE5ng th\u1EA5t n\u1EEF.",
    relationshipMeaning: "\u51F6\u3002\u9082\u9005\u4E4B\u4E2D\u6697\u85CF\u5371\u673A\uFF0C\u591A\u5C5E\u8273\u9047\u6216\u6843\u82B1\u52AB\u3002\u4E00\u65B9\u53EF\u80FD\u5E26\u6709\u5F3A\u70C8\u7684\u63A7\u5236\u6B32\u6216\u4E0D\u53EF\u544A\u4EBA\u7684\u76EE\u7684\uFF0C\u5973\u5F3A\u7537\u5F31\uFF0C\u611F\u60C5\u96BE\u4EE5\u957F\u4E45\u7EF4\u7CFB\u3002",
    relationshipMeaningEn: "Inauspicious. A chance encounter hiding potential hazards or infidelity. One party may be overly dominant or deceitful; difficult for long-term commitment.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E01\u0E32\u0E23\u0E1E\u0E1A\u0E40\u0E08\u0E2D\u0E17\u0E35\u0E48\u0E41\u0E1D\u0E07\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E27\u0E34\u0E01\u0E24\u0E15\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E31\u0E01\u0E2A\u0E32\u0E21\u0E40\u0E2A\u0E49\u0E32 \u0E1D\u0E48\u0E32\u0E22\u0E43\u0E14\u0E1D\u0E48\u0E32\u0E22\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E2D\u0E32\u0E08\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E2A\u0E39\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E21\u0E35\u0E40\u0E08\u0E15\u0E19\u0E32\u0E0B\u0E48\u0E2D\u0E19\u0E40\u0E23\u0E49\u0E19 \u0E22\u0E32\u0E01\u0E17\u0E35\u0E48\u0E08\u0E30\u0E04\u0E1A\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E22\u0E32\u0E27\u0E19\u0E32\u0E19",
    relationshipMeaningVi: "Hung. T\xECnh c\u1EDD g\u1EB7p g\u1EE1 nh\u01B0ng \u1EA9n t\xE0ng nguy c\u01A1, d\u1EC5 l\xE0 \u0111\xE0o hoa s\xE1t. M\u1ED9t b\xEAn c\xF3 th\u1EC3 c\xF3 ham mu\u1ED1n ki\u1EC3m so\xE1t m\u1EA1nh m\u1EBD ho\u1EB7c m\u1EE5c \u0111\xEDch kh\xF3 n\xF3i, t\xECnh c\u1EA3m kh\xF3 duy tr\xEC l\xE2u d\xE0i n\u1EBFu thi\u1EBFu \u0111i s\u1EF1 th\u1EA5u hi\u1EC3u ch\xE2n th\xE0nh.",
    category: "\u4E2D",
    scoreRange: [65, 79]
  },
  45: {
    name: "\u6CFD\u5730\u8403",
    nameEn: "Gathering Together",
    nameEs: "La Reuni\xF3n / La Colecci\xF3n",
    nameFr: "Le Rassemblement / La Collection",
    nameTh: "\u0E09\u0E38\u0E48\u0E22 (\u0E01\u0E32\u0E23\u0E23\u0E27\u0E21\u0E15\u0E31\u0E27)",
    nameVi: "Tr\u1EA1ch \u0110\u1ECBa T\u1EE5y",
    symbol: "\u2631\u2637",
    nature: "\u805A\u96C6",
    natureEn: "Gathering Together",
    natureTh: "\u0E23\u0E27\u0E21\u0E15\u0E31\u0E27\u0E40\u0E02\u0E49\u0E32\u0E14\u0E49\u0E27\u0E22\u0E01\u0E31\u0E19",
    natureVi: "T\u1EE5 h\u1ED9i c\xF9ng nhau",
    natureEs: "Congregaci\xF3n / Uni\xF3n",
    natureFr: "R\xE9union / Convergence",
    judgment: "\u738B\u5047\u6709\u5E99\u4EA8",
    judgmentEn: "The king arrives at the temple \u2014 success.",
    judgmentTh: "\u0E01\u0E29\u0E31\u0E15\u0E23\u0E34\u0E22\u0E4C\u0E40\u0E2A\u0E14\u0E47\u0E08\u0E16\u0E36\u0E07\u0E27\u0E31\u0E14 \u2014 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
    judgmentVi: "V\u01B0\u01A1ng gi\u1EA3 h\u1EEFu mi\u1EBFu, hanh.",
    relationshipMeaning: "\u5409\u3002\u7FA4\u82F1\u835F\u8403\uFF0C\u611F\u60C5\u751F\u6D3B\u4E30\u5BCC\u7CBE\u5F69\u3002\u5F7C\u6B64\u5708\u5B50\u878D\u5408\uFF0C\u80FD\u5F97\u5230\u53CC\u65B9\u4EB2\u53CB\u7684\u5927\u529B\u652F\u6301\u3002\u604B\u7231\u8005\u5173\u7CFB\u8FDB\u4E00\u6B65\u5347\u534E\uFF0C\u5229\u4E8E\u805A\u4F1A\u4E0E\u516C\u5F00\u3002",
    relationshipMeaningEn: "Auspicious. Social circles merge beautifully; relationship receives strong support from family and friends. Great for social gatherings and formalizing ties.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E2A\u0E31\u0E07\u0E04\u0E21\u0E02\u0E2D\u0E07\u0E17\u0E31\u0E49\u0E07\u0E04\u0E39\u0E48\u0E2B\u0E25\u0E2D\u0E21\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E14\u0E35 \u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E2A\u0E19\u0E31\u0E1A\u0E2A\u0E19\u0E38\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E49\u0E19\u0E2B\u0E25\u0E32\u0E21\u0E08\u0E32\u0E01\u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E23\u0E31\u0E27\u0E41\u0E25\u0E30\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E19\u0E1D\u0E39\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E1E\u0E31\u0E12\u0E19\u0E32\u0E02\u0E36\u0E49\u0E19\u0E2D\u0E35\u0E01\u0E02\u0E31\u0E49\u0E19",
    relationshipMeaningVi: "C\xE1t. V\xF2ng b\u1EA1n b\xE8 \u0111\xF4i b\xEAn h\xF2a nh\u1EADp, nh\u1EADn \u0111\u01B0\u1EE3c s\u1EF1 \u1EE7ng h\u1ED9 m\u1EA1nh m\u1EBD t\u1EEB ng\u01B0\u1EDDi th\xE2n, b\u1EA1n b\xE8. Ng\u01B0\u1EDDi \u0111ang y\xEAu t\xECnh c\u1EA3m c\xE0ng th\xEAm th\u0103ng hoa, l\u1EE3i cho t\u1EE5 h\u1ECDp v\xE0 c\xF4ng khai.",
    category: "\u5409",
    scoreRange: [74, 86]
  },
  46: {
    name: "\u5730\u98CE\u5347",
    nameEn: "Pushing Upward",
    nameEs: "El Ascenso",
    nameFr: "La Pouss\xE9e Vers le Haut",
    nameTh: "\u0E40\u0E0B\u0E34\u0E07 (\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E48\u0E2D\u0E19\u0E02\u0E31\u0E49\u0E19)",
    nameVi: "\u0110\u1ECBa Phong Th\u0103ng",
    symbol: "\u2637\u2634",
    nature: "\u4E0A\u5347",
    natureEn: "Rising Upward",
    natureTh: "\u0E02\u0E36\u0E49\u0E19\u0E2A\u0E39\u0E48\u0E40\u0E1A\u0E37\u0E49\u0E2D\u0E07\u0E1A\u0E19",
    natureVi: "V\u01B0\u01A1n l\xEAn",
    natureEs: "Elevaci\xF3n / Surgimiento",
    natureFr: "\xC9l\xE9vation / Ascension",
    judgment: "\u5143\u4EA8\u7528\u89C1\u5927\u4EBA",
    judgmentEn: "Great success \u2014 advantageous to see the great person.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48 \u2014 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1E\u0E1A\u0E1C\u0E39\u0E49\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48",
    judgmentVi: "Nguy\xEAn hanh, d\u1EE5ng ki\u1EBFn \u0111\u1EA1i nh\xE2n.",
    relationshipMeaning: "\u5409\u3002\u7A33\u6B65\u4E0A\u5347\uFF0C\u987A\u98CE\u987A\u6C34\u3002\u611F\u60C5\u57FA\u7840\u5728\u65E5\u5E38\u966A\u4F34\u4E2D\u4E0D\u65AD\u52A0\u56FA\uFF0C\u7531\u6D45\u5165\u6DF1\u3002\u53EA\u8981\u575A\u6301\u6B63\u9053\u3001\u811A\u8E0F\u5B9E\u5730\uFF0C\u611F\u60C5\u5B9A\u80FD\u8D70\u5411\u5706\u6EE1\u3002",
    relationshipMeaningEn: "Auspicious. Steady upward progress. The bond strengthens through daily companionship, growing from shallow to deep. Stay grounded for a blissful ending.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E1E\u0E31\u0E12\u0E19\u0E32\u0E02\u0E36\u0E49\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E41\u0E25\u0E30\u0E23\u0E32\u0E1A\u0E23\u0E37\u0E48\u0E19 \u0E1C\u0E39\u0E01\u0E1E\u0E31\u0E19\u0E01\u0E31\u0E19\u0E25\u0E36\u0E01\u0E0B\u0E36\u0E49\u0E07\u0E02\u0E36\u0E49\u0E19\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E22\u0E46 \u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E14\u0E39\u0E41\u0E25\u0E01\u0E31\u0E19\u0E43\u0E19\u0E17\u0E38\u0E01\u0E27\u0E31\u0E19 \u0E2B\u0E32\u0E01\u0E0B\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E15\u0E22\u0E4C\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E19\u0E08\u0E30\u0E2A\u0E21\u0E2B\u0E27\u0E31\u0E07\u0E41\u0E19\u0E48\u0E19\u0E2D\u0E19",
    relationshipMeaningVi: "C\xE1t. V\u1EEFng b\u01B0\u1EDBc \u0111i l\xEAn, thu\u1EADn bu\u1ED3m xu\xF4i gi\xF3. N\u1EC1n t\u1EA3ng t\xECnh c\u1EA3m \u0111\u01B0\u1EE3c c\u1EE7ng c\u1ED1 qua s\u1EF1 \u0111\u1ED3ng h\xE0nh m\u1ED7i ng\xE0y, t\u1EEB n\xF4ng \u0111\u1EBFn s\xE2u. Ch\u1EC9 c\u1EA7n ki\xEAn tr\xEC ch\xEDnh \u0111\u1EA1o, t\xECnh c\u1EA3m s\u1EBD vi\xEAn m\xE3n.",
    category: "\u5409",
    scoreRange: [76, 88]
  },
  47: {
    name: "\u6CFD\u6C34\u56F0",
    nameEn: "Oppression",
    nameEs: "La Opresi\xF3n / El Agotamiento",
    nameFr: "L'Oppression / L'\xC9puisement",
    nameTh: "\u0E04\u0E27\u0E34\u0E48\u0E19 (\u0E04\u0E27\u0E32\u0E21\u0E22\u0E32\u0E01\u0E25\u0E33\u0E1A\u0E32\u0E01)",
    nameVi: "Tr\u1EA1ch Th\u1EE7y Kh\u1ED1n",
    symbol: "\u2631\u2635",
    nature: "\u56F0\u987F",
    natureEn: "Hardship & Constraint",
    natureTh: "\u0E25\u0E33\u0E1A\u0E32\u0E01\u0E41\u0E25\u0E30\u0E16\u0E39\u0E01\u0E08\u0E33\u0E01\u0E31\u0E14",
    natureVi: "Kh\xF3 kh\u0103n v\xE0 tr\xF3i bu\u1ED9c",
    natureEs: "Aflicci\xF3n / Estancamiento",
    natureFr: "D\xE9tresse / \xC9puisement",
    judgment: "\u4EA8\u8D1E\u5927\u4EBA\u5409\u65E0\u548E",
    judgmentEn: "Success, perseverance \u2014 the great person, auspicious, no blame.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E2D\u0E14\u0E17\u0E19 \u2014 \u0E1C\u0E39\u0E49\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48 \u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E34\u0E14",
    judgmentVi: "Hanh ki\xEAn tr\xEC, \u0111\u1EA1i nh\xE2n c\xE1t v\xF4 l\u1ED7i.",
    relationshipMeaning: "\u5927\u51F6\u3002\u8EAB\u9677\u7EDD\u5883\uFF0C\u4E3E\u6B65\u7EF4\u8270\u3002\u611F\u60C5\u56E0\u7ECF\u6D4E\u62EE\u636E\u3001\u8A00\u8BED\u8BEF\u89E3\u6216\u5916\u754C\u538B\u8FEB\u800C\u9677\u5165\u6781\u5EA6\u75DB\u82E6\u4E0E\u532E\u4E4F\u4E4B\u4E2D\u3002\u6B64\u65F6\u8003\u9A8C\u7684\u662F\u5F7C\u6B64\u80FD\u5426\u540C\u7518\u5171\u82E6\u3002",
    relationshipMeaningEn: "Highly inauspicious. Trapped in a desperate dilemma. Relationship suffers from financial strain, verbal blocks, or heavy oppression. Tests your loyalty.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E22\u0E34\u0E48\u0E07 \u0E15\u0E01\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E2A\u0E16\u0E32\u0E19\u0E01\u0E32\u0E23\u0E13\u0E4C\u0E17\u0E35\u0E48\u0E22\u0E32\u0E01\u0E25\u0E33\u0E1A\u0E32\u0E01 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E16\u0E39\u0E01\u0E01\u0E14\u0E14\u0E31\u0E19\u0E08\u0E32\u0E01\u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E40\u0E07\u0E34\u0E19\u0E17\u0E2D\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E44\u0E21\u0E48\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E01\u0E31\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E23\u0E38\u0E19\u0E41\u0E23\u0E07 \u0E40\u0E1B\u0E47\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E1E\u0E34\u0E2A\u0E39\u0E08\u0E19\u0E4C\u0E23\u0E31\u0E01\u0E41\u0E17\u0E49\u0E27\u0E48\u0E32\u0E08\u0E30\u0E23\u0E48\u0E27\u0E21\u0E17\u0E38\u0E01\u0E02\u0E4C\u0E23\u0E48\u0E27\u0E21\u0E2A\u0E38\u0E02\u0E44\u0E14\u0E49\u0E44\u0E2B\u0E21",
    relationshipMeaningVi: "\u0110\u1EA1i hung. R\u01A1i v\xE0o tuy\u1EC7t c\u1EA3nh, kh\u1ED1n \u0111\u1ED1n tr\u0103m b\u1EC1. T\xECnh c\u1EA3m v\xEC kinh t\u1EBF eo h\u1EB9p, ng\xF4n t\u1EEB b\u1EA5t \u0111\u1ED3ng ho\u1EB7c \xE1p l\u1EF1c b\xEAn ngo\xE0i m\xE0 r\u01A1i v\xE0o \u0111au kh\u1ED5 c\xF9ng c\u1EF1c. Th\u1EED th\xE1ch l\xF2ng \u0111\u1ED3ng cam c\u1ED9ng kh\u1ED5.",
    category: "\u5C0F\u51F6",
    scoreRange: [46, 60]
  },
  48: {
    name: "\u6C34\u98CE\u4E95",
    nameEn: "The Well",
    nameEs: "El Pozo de Agua",
    nameFr: "Le Puits",
    nameTh: "\u0E08\u0E34\u0E48\u0E07 (\u0E1A\u0E48\u0E2D\u0E19\u0E49\u0E33)",
    nameVi: "Th\u1EE7y Phong T\u1EC9nh",
    symbol: "\u2635\u2634",
    nature: "\u4E95\u517B",
    natureEn: "Well Nourishment",
    natureTh: "\u0E1A\u0E48\u0E2D\u0E19\u0E49\u0E33\u0E40\u0E25\u0E35\u0E49\u0E22\u0E07\u0E0A\u0E35\u0E27\u0E34\u0E15",
    natureVi: "Gi\u1EBFng nu\xF4i d\u01B0\u1EE1ng",
    natureEs: "Sustento del pozo / Cuidado",
    natureFr: "Abreuvoir / Entretien",
    judgment: "\u6539\u9091\u4E0D\u6539\u4E95",
    judgmentEn: "Change the town but not the well. Core values remain constant.",
    judgmentTh: "\u0E22\u0E49\u0E32\u0E22\u0E40\u0E21\u0E37\u0E2D\u0E07\u0E44\u0E14\u0E49\u0E41\u0E15\u0E48\u0E2D\u0E22\u0E48\u0E32\u0E22\u0E49\u0E32\u0E22\u0E1A\u0E48\u0E2D \u0E04\u0E48\u0E32\u0E2B\u0E25\u0E31\u0E01\u0E22\u0E31\u0E07\u0E04\u0E07\u0E2D\u0E22\u0E39\u0E48",
    judgmentVi: "C\u1EA3i \u1EA5p b\u1EA5t c\u1EA3i t\u1EC9nh.",
    relationshipMeaning: "\u5E73\u3002\u611F\u60C5\u8FDB\u5165\u5E73\u6DE1\u671F\uFF0C\u5982\u4E95\u6C34\u822C\u6052\u4E45\u5374\u7F3A\u4E4F\u6CE2\u6F9C\u3002\u5F7C\u6B64\u9700\u6DF1\u5165\u6316\u6398\u5185\u5FC3\u7684\u60C5\u611F\u9700\u6C42\uFF0C\u4E0D\u65AD\u5F80\u5173\u7CFB\u91CC\u6CE8\u5165\u65B0\u9C9C\u517B\u5206\uFF0C\u65B9\u80FD\u907F\u514D\u67AF\u7AED\u3002",
    relationshipMeaningEn: "Neutral. Relationship enters a dull phase; steady like a well but lacks excitement. Actively nurture and refresh the bond to prevent emotional exhaustion.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E21\u0E32\u0E16\u0E36\u0E07\u0E08\u0E38\u0E14\u0E17\u0E35\u0E48\u0E23\u0E32\u0E1A\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E14\u0E31\u0E48\u0E07\u0E1A\u0E48\u0E2D\u0E19\u0E49\u0E33\u0E17\u0E35\u0E48\u0E19\u0E34\u0E48\u0E07\u0E2A\u0E07\u0E1A\u0E41\u0E15\u0E48\u0E02\u0E32\u0E14\u0E04\u0E27\u0E32\u0E21\u0E15\u0E37\u0E48\u0E19\u0E40\u0E15\u0E49\u0E19 \u0E15\u0E49\u0E2D\u0E07\u0E2B\u0E21\u0E31\u0E48\u0E19\u0E40\u0E15\u0E34\u0E21\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E27\u0E32\u0E19\u0E41\u0E25\u0E30\u0E14\u0E39\u0E41\u0E25\u0E43\u0E08\u0E01\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E44\u0E21\u0E48\u0E43\u0E2B\u0E49\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E41\u0E2B\u0E49\u0E07\u0E41\u0E25\u0E49\u0E07",
    relationshipMeaningVi: "B\xECnh. T\xECnh c\u1EA3m b\u01B0\u1EDBc v\xE0o giai \u0111o\u1EA1n b\xECnh l\u1EB7ng, nh\u01B0 n\u01B0\u1EDBc gi\u1EBFng h\u1EB1ng c\u1EEDu nh\u01B0ng thi\u1EBFu \u0111i s\xF3ng g\u1EE3n. \u0110\xF4i b\xEAn c\u1EA7n \u0111\xE0o s\xE2u nhu c\u1EA7u c\u1EA3m x\xFAc c\u1EE7a nhau, li\xEAn t\u1EE5c b\u1ED5 sung d\u01B0\u1EE1ng ch\u1EA5t m\u1EDBi tr\xE1nh c\u1EA1n ki\u1EC7t.",
    category: "\u5409",
    scoreRange: [73, 85]
  },
  49: {
    name: "\u6CFD\u706B\u9769",
    nameEn: "Revolution",
    nameEs: "La Revoluci\xF3n / Mudanza",
    nameFr: "La R\xE9volution / La Mue",
    nameTh: "\u0E40\u0E01\u0E49\u0E2D (\u0E01\u0E32\u0E23\u0E1B\u0E0F\u0E34\u0E27\u0E31\u0E15\u0E34\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07)",
    nameVi: "Tr\u1EA1ch H\u1ECFa C\xE1ch",
    symbol: "\u2631\u2632",
    nature: "\u53D8\u9769",
    natureEn: "Radical Change",
    natureTh: "\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E23\u0E38\u0E19\u0E41\u0E23\u0E07",
    natureVi: "Thay \u0111\u1ED5i tri\u1EC7t \u0111\u1EC3",
    natureEs: "Transformaci\xF3n / Revoluci\xF3n",
    natureFr: "Transformation / R\xE9volution",
    judgment: "\u5DF3\u65E5\u4E43\u5B5A\u5143\u4EA8\u5229\u8D1E",
    judgmentEn: "On the si day, trust is established \u2014 supreme success, advantageous, perseverance.",
    judgmentTh: "\u0E27\u0E31\u0E19\u0E28\u0E23\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08\u0E2A\u0E16\u0E32\u0E1B\u0E19\u0E32 \u2014 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E22\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E0D\u0E48 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E2D\u0E14\u0E17\u0E19",
    judgmentVi: "T\u1ECB nh\u1EADt n\xE3i ph\u01B0\u1EDBc, nguy\xEAn hanh l\u1EE3i ki\xEAn tr\xEC.",
    relationshipMeaning: "\u5409\u3002\u987A\u5E94\u65F6\u52BF\uFF0C\u6D17\u5FC3\u9769\u9762\u3002\u611F\u60C5\u5C06\u8FCE\u6765\u5F7B\u5E95\u7684\u8F6C\u53D8\uFF08\u5982\u6539\u53D8\u76F8\u5904\u6A21\u5F0F\u3001\u544A\u522B\u8FC7\u53BB\u751A\u81F3\u65E7\u60C5\u6362\u65B0\u989C\uFF09\u3002\u987A\u5E94\u53D8\u5316\u3001\u6452\u5F03\u65E7\u4E60\u65B9\u5927\u5409\u3002",
    relationshipMeaningEn: "Auspicious. Adapt to changes and renew yourself. The relationship faces a thorough transformation (e.g., changing patterns or leaving the past behind). Embrace the change.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E16\u0E36\u0E07\u0E40\u0E27\u0E25\u0E32\u0E1B\u0E0F\u0E34\u0E27\u0E31\u0E15\u0E34\u0E41\u0E25\u0E30\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E44\u0E1B\u0E2A\u0E39\u0E48\u0E2A\u0E34\u0E48\u0E07\u0E43\u0E2B\u0E21\u0E48 \u0E1B\u0E23\u0E31\u0E1A\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E1E\u0E24\u0E15\u0E34\u0E01\u0E23\u0E23\u0E21\u0E40\u0E14\u0E34\u0E21\u0E46 \u0E41\u0E25\u0E49\u0E27\u0E08\u0E30\u0E40\u0E01\u0E34\u0E14\u0E1C\u0E25\u0E14\u0E35\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E04\u0E32\u0E14\u0E44\u0E21\u0E48\u0E16\u0E36\u0E07",
    relationshipMeaningVi: "C\xE1t. Thu\u1EADn theo th\u1EDDi th\u1EBF, c\u1EA3i c\xE1ch \u0111\u1ED5i m\u1EDBi. T\xECnh c\u1EA3m s\u1EBD \u0111\xF3n nh\u1EADn s\u1EF1 chuy\u1EC3n bi\u1EBFn tri\u1EC7t \u0111\u1EC3 (nh\u01B0 thay \u0111\u1ED5i c\xE1ch \u1EE9ng x\u1EED, t\u1EEB bi\u1EC7t qu\xE1 kh\u1EE9). Thu\u1EADn theo bi\u1EBFn \u0111\u1ED5i m\u1EDBi \u0111\u1EA1i c\xE1t.",
    category: "\u4E2D",
    scoreRange: [61, 75]
  },
  50: {
    name: "\u706B\u98CE\u9F0E",
    nameEn: "The Cauldron",
    nameEs: "El Caldero",
    nameFr: "Le Chaudron",
    nameTh: "\u0E15\u0E34\u0E48\u0E07 (\u0E2B\u0E21\u0E49\u0E2D\u0E2A\u0E32\u0E21\u0E02\u0E32\u0E40\u0E1E\u0E23\u0E35\u0E22\u0E1A\u0E1E\u0E23\u0E49\u0E2D\u0E21)",
    nameVi: "H\u1ECFa Phong \u0110\u1EC9nh",
    symbol: "\u2632\u2634",
    nature: "\u9F0E\u65B0",
    natureEn: "Establishing New Order",
    natureTh: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E1A\u0E43\u0E2B\u0E21\u0E48",
    natureVi: "Thi\u1EBFt l\u1EADp tr\u1EADt t\u1EF1 m\u1EDBi",
    natureEs: "Renovaci\xF3n / Refundaci\xF3n",
    natureFr: "Renouveau / Refondation",
    judgment: "\u5143\u5409\u4EA8",
    judgmentEn: "Supreme auspiciousness, success.",
    judgmentTh: "\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
    judgmentVi: "Nguy\xEAn c\xE1t hanh th\xF4ng.",
    relationshipMeaning: "\u5927\u5409\u3002\u4E09\u8DB3\u9F0E\u7ACB\uFF0C\u7A33\u5982\u6CF0\u5C71\u3002\u611F\u60C5\u4E0D\u4EC5\u7A33\u56FA\uFF0C\u800C\u4E14\u80FD\u4E92\u76F8\u6210\u5C31\uFF0C\u7269\u8D28\u4E0E\u7CBE\u795E\u53CC\u4E30\u6536\u3002\u6781\u5229\u4E8E\u786E\u7ACB\u5173\u7CFB\u6216\u6B65\u5165\u5A5A\u59FB\u6BBF\u5802\u3002",
    relationshipMeaningEn: "Highly auspicious. Exceptionally stable and supportive. Both parties achieve mutual success, flourishing materially and spiritually. Ideal for marriage.",
    relationshipMeaningTh: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E14\u0E31\u0E48\u0E07\u0E2B\u0E21\u0E49\u0E2D\u0E2A\u0E32\u0E21\u0E02\u0E32 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E40\u0E01\u0E37\u0E49\u0E2D\u0E2B\u0E19\u0E38\u0E19\u0E01\u0E31\u0E19\u0E43\u0E2B\u0E49\u0E40\u0E08\u0E23\u0E34\u0E0D\u0E23\u0E38\u0E48\u0E07\u0E40\u0E23\u0E37\u0E2D\u0E07 \u0E17\u0E31\u0E49\u0E07\u0E10\u0E32\u0E19\u0E30\u0E41\u0E25\u0E30\u0E08\u0E34\u0E15\u0E43\u0E08 \u0E14\u0E35\u0E40\u0E25\u0E34\u0E28\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E04\u0E23\u0E2D\u0E1A\u0E04\u0E23\u0E31\u0E27",
    relationshipMeaningVi: "\u0110\u1EA1i c\xE1t. Tam t\xFAc \u0111\u1EC9nh l\u1EADp, v\u1EEFng nh\u01B0 Th\xE1i S\u01A1n. T\xECnh c\u1EA3m kh\xF4ng ch\u1EC9 v\u1EEFng ch\u1EAFc m\xE0 c\xF2n t\u01B0\u01A1ng tr\u1EE3 l\u1EABn nhau c\xF9ng th\xE0nh c\xF4ng, v\u1EADt ch\u1EA5t l\u1EABn tinh th\u1EA7n \u0111\u1EC1u m\u1EF9 m\xE3n. C\u1EF1c l\u1EE3i cho k\u1EBFt h\xF4n.",
    category: "\u5409",
    scoreRange: [75, 87]
  },
  51: {
    name: "\u9707\u4E3A\u96F7",
    nameEn: "The Arousing (Thunder)",
    nameEs: "Lo Conmocionante / El Trueno",
    nameFr: "L'\xC9veilleur / Le Tonnerre",
    nameTh: "\u0E40\u0E08\u0E34\u0E49\u0E19 (\u0E2A\u0E32\u0E22\u0E1F\u0E49\u0E32\u0E01\u0E36\u0E01\u0E01\u0E49\u0E2D\u0E07)",
    nameVi: "Ch\u1EA5n Vi L\xF4i",
    symbol: "\u2633\u2633",
    nature: "\u9707\u52A8",
    natureEn: "Quaking & Shaking",
    natureTh: "\u0E2A\u0E31\u0E48\u0E19\u0E2A\u0E30\u0E40\u0E17\u0E37\u0E2D\u0E19",
    natureVi: "Rung chuy\u1EC3n d\u1EEF d\u1ED9i",
    natureEs: "Sacudida / Conmoci\xF3n",
    natureFr: "Secousse / \xC9branlement",
    judgment: "\u4EA8\u6050\u81F4\u798F",
    judgmentEn: "Success \u2014 fear brings blessing.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E40\u0E01\u0E23\u0E07\u0E01\u0E25\u0E49\u0E32\u0E19\u0E33\u0E21\u0E32\u0E0B\u0E36\u0E48\u0E07\u0E1E\u0E23",
    judgmentVi: "Hanh, kh\u1EE7ng tri\u1EC1u ph\u01B0\u1EDBc.",
    relationshipMeaning: "\u5E73\u3002\u60CA\u5929\u52A8\u5730\uFF0C\u7A81\u751F\u6CE2\u6F9C\u3002\u611F\u60C5\u4E2D\u5E38\u6709\u7A81\u53D1\u6027\u7684\u4E89\u5435\u3001\u9707\u60CA\u4E8B\u4EF6\u6216\u5916\u754C\u51B2\u51FB\u3002\u867D\u4EE4\u4EBA\u60CA\u6050\uFF0C\u4F46\u53EA\u8981\u4FDD\u6301\u9547\u5B9A\uFF0C\u53CD\u80FD\u9707\u9192\u8FF7\u5C40\uFF0C\u5E26\u6765\u8F6C\u673A\u3002",
    relationshipMeaningEn: "Neutral. Sudden shocks and unexpected waves. Intense arguments or external shocks may alarm you, but staying calm can awaken the relationship and bring a turning point.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E21\u0E35\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E15\u0E37\u0E48\u0E19\u0E40\u0E15\u0E49\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E1B\u0E32\u0E01\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E40\u0E02\u0E49\u0E32\u0E21\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E30\u0E17\u0E31\u0E19\u0E2B\u0E31\u0E19\u0E14\u0E31\u0E48\u0E07\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E1F\u0E49\u0E32\u0E1C\u0E48\u0E32 \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E15\u0E37\u0E48\u0E19\u0E15\u0E23\u0E30\u0E2B\u0E19\u0E01 \u0E2B\u0E32\u0E01\u0E21\u0E35\u0E2A\u0E15\u0E34\u0E08\u0E30\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1C\u0E48\u0E32\u0E19\u0E1E\u0E49\u0E19\u0E41\u0E25\u0E30\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E01\u0E31\u0E19\u0E21\u0E32\u0E01\u0E02\u0E36\u0E49\u0E19",
    relationshipMeaningVi: "B\xECnh. Kinh thi\xEAn \u0111\u1ED9ng \u0111\u1ECBa, \u0111\u1ED9t ng\u1ED9t n\u1ED5i s\xF3ng. T\xECnh c\u1EA3m th\u01B0\u1EDDng c\xF3 tranh c\xE3i b\u1ED9t ph\xE1t, s\u1EF1 c\u1ED1 g\xE2y s\u1ED1c ho\u1EB7c xung k\xEDch t\u1EEB b\xEAn ngo\xE0i. Ch\u1EC9 c\u1EA7n b\xECnh t\u0129nh, ng\u01B0\u1EE3c l\u1EA1i s\u1EBD t\u1EC9nh ng\u1ED9 v\xE0 mang l\u1EA1i chuy\u1EC3n bi\u1EBFn.",
    category: "\u4E2D",
    scoreRange: [60, 74]
  },
  52: {
    name: "\u826E\u4E3A\u5C71",
    nameEn: "Keeping Still (Mountain)",
    nameEs: "El Aquietamiento / La Monta\xF1a",
    nameFr: "L'Immobilisation / La Montagne",
    nameTh: "\u0E40\u0E01\u0E34\u0E49\u0E19 (\u0E02\u0E38\u0E19\u0E40\u0E02\u0E32\u0E17\u0E35\u0E48\u0E19\u0E34\u0E48\u0E07\u0E2A\u0E07\u0E1A)",
    nameVi: "C\u1EA5n Vi S\u01A1n",
    symbol: "\u2636\u2636",
    nature: "\u505C\u6B62",
    natureEn: "Cessation",
    natureTh: "\u0E2B\u0E22\u0E38\u0E14\u0E19\u0E34\u0E48\u0E07",
    natureVi: "Ng\u1EEBng l\u1EA1i",
    natureEs: "Detenci\xF3n / Inmovilidad",
    natureFr: "Arr\xEAt / Immobilit\xE9",
    judgment: "\u826E\u5176\u80CC\u4E0D\u83B7\u5176\u8EAB",
    judgmentEn: "Keeping his back still, he does not obtain his body.",
    judgmentTh: "\u0E19\u0E34\u0E48\u0E07\u0E2B\u0E25\u0E31\u0E07\u0E2D\u0E22\u0E39\u0E48 \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E27",
    judgmentVi: "C\u1EA5n k\u1EF3 b\u1ED1i, b\u1EA5t ho\u1EA1t k\u1EF3 th\xE2n.",
    relationshipMeaning: "\u5E73\u3002\u52A8\u8F84\u5F97\u548E\uFF0C\u65F6\u6B62\u5219\u6B62\u3002\u611F\u60C5\u8FDB\u5165\u505C\u6EDE\u4E0D\u524D\u7684\u51B7\u6DE1\u671F\uFF0C\u5F7C\u6B64\u5B58\u5728\u9694\u9602\uFF0C\u6C9F\u901A\u56F0\u96BE\u3002\u6B64\u65F6\u4E0D\u5B9C\u5F3A\u6C42\u63A8\u8FDB\uFF0C\u9759\u6B62\u601D\u8003\u3001\u5404\u7559\u7A7A\u95F4\u624D\u662F\u4E0A\u7B56\u3002",
    relationshipMeaningEn: "Neutral. Stagnation and emotional distance. Communication is difficult; do not force progress. Internal reflection and giving each other space is the best strategy.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27\u0E19\u0E34\u0E48\u0E07\u0E2A\u0E19\u0E34\u0E17\u0E41\u0E25\u0E30\u0E40\u0E2B\u0E34\u0E19\u0E2B\u0E48\u0E32\u0E07\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E21\u0E35\u0E20\u0E39\u0E40\u0E02\u0E32\u0E01\u0E31\u0E49\u0E19 \u0E44\u0E21\u0E48\u0E04\u0E27\u0E23\u0E01\u0E14\u0E14\u0E31\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E1D\u0E37\u0E19\u0E40\u0E14\u0E34\u0E19\u0E2B\u0E19\u0E49\u0E32 \u0E04\u0E27\u0E23\u0E43\u0E2B\u0E49\u0E40\u0E27\u0E25\u0E32\u0E41\u0E25\u0E30\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E41\u0E01\u0E48\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E31\u0E19",
    relationshipMeaningVi: "B\xECnh. \u0110\u1ED9ng th\xEC d\u1EC5 l\u1ED7i, n\xEAn d\u1EEBng th\xEC d\u1EEBng. T\xECnh c\u1EA3m b\u01B0\u1EDBc v\xE0o giai \u0111o\u1EA1n tr\xEC tr\u1EC7 l\u1EA1nh nh\u1EA1t, \u0111\xF4i b\xEAn c\xF3 r\xE0o c\u1EA3n, giao ti\u1EBFp kh\xF3 kh\u0103n. L\xFAc n\xE0y kh\xF4ng n\xEAn khi\xEAn c\u01B0\u1EE1ng, gi\u1EEF kh\xF4ng gian ri\xEAng m\u1EDBi l\xE0 th\u01B0\u1EE3ng s\xE1ch.",
    category: "\u4E2D",
    scoreRange: [63, 77]
  },
  53: {
    name: "\u98CE\u5C71\u6E10",
    nameEn: "Gradual Progress",
    nameEs: "El Progreso Gradual",
    nameFr: "Le Progr\xE8s Graduel",
    nameTh: "\u0E40\u0E08\u0E35\u0E49\u0E22\u0E19 (\u0E01\u0E32\u0E23\u0E1E\u0E31\u0E12\u0E19\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E04\u0E48\u0E2D\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E48\u0E2D\u0E22\u0E44\u0E1B)",
    nameVi: "Phong S\u01A1n Ti\u1EC7m",
    symbol: "\u2634\u2636",
    nature: "\u6E10\u8FDB",
    natureEn: "Gradual Advance",
    natureTh: "\u0E01\u0E49\u0E32\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E25\u0E30\u0E01\u0E49\u0E32\u0E27",
    natureVi: "Ti\u1EBFn d\u1EA7n t\u1EEBng b\u01B0\u1EDBc",
    natureEs: "Graduaci\xF3n / Avance paulatino",
    natureFr: "Gradation / Progression lente",
    judgment: "\u5973\u5F52\u5409\u5229\u8D1E",
    judgmentEn: "The maiden returns \u2014 auspicious, advantageous to persevere.",
    judgmentTh: "\u0E2B\u0E0D\u0E34\u0E07\u0E2A\u0E32\u0E27\u0E01\u0E25\u0E31\u0E1A\u0E04\u0E37\u0E19 \u2014 \u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25 \u0E2D\u0E14\u0E17\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Ti\u1EBFn tri\u1EC3n tu\u1EA7n t\u1EF1 \u2014 h\xF4n nh\xE2n c\xE1t t\u01B0\u1EDDng, b\u1EC1n v\u1EEFng l\xE2u d\xE0i.",
    relationshipMeaning: "\u5927\u5409\u3002\u5FAA\u5E8F\u6E10\u8FDB\uFF0C\u7EC6\u6C34\u957F\u6D41\u3002\u5982\u540C\u9E3F\u96C1\u98DE\u7FD4\u6709\u5E8F\uFF0C\u611F\u60C5\u53D1\u5C55\u5B8C\u5168\u7B26\u5408\u4F20\u7EDF\u793C\u8282\uFF0C\u6B65\u6B65\u624E\u5B9E\u3002\u662F\u4E00\u6BB5\u80FD\u767D\u5934\u5055\u8001\u3001\u987A\u7406\u6210\u7AE0\u7684\u826F\u7F18\u3002",
    relationshipMeaningEn: "Highly auspicious. Gradual and steady progress. The relationship develops naturally and orderly, following traditions perfectly. Leads to a solid, lifelong marriage.",
    relationshipMeaningTh: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E01\u0E49\u0E32\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E31\u0E49\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E2D\u0E19\u0E41\u0E25\u0E30\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07 \u0E44\u0E21\u0E48\u0E2B\u0E27\u0E37\u0E2D\u0E2B\u0E27\u0E32\u0E41\u0E15\u0E48\u0E22\u0E31\u0E48\u0E07\u0E22\u0E37\u0E19\u0E15\u0E32\u0E21\u0E1B\u0E23\u0E30\u0E40\u0E1E\u0E13\u0E35\u0E2D\u0E31\u0E19\u0E14\u0E35\u0E07\u0E32\u0E21 \u0E40\u0E1B\u0E47\u0E19\u0E04\u0E39\u0E48\u0E41\u0E17\u0E49\u0E17\u0E35\u0E48\u0E08\u0E30\u0E44\u0E14\u0E49\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19\u0E41\u0E25\u0E30\u0E2D\u0E22\u0E39\u0E48\u0E14\u0E49\u0E27\u0E22\u0E01\u0E31\u0E19\u0E08\u0E19\u0E41\u0E01\u0E48\u0E40\u0E12\u0E48\u0E32",
    relationshipMeaningVi: "\u0110\u1EA1i c\xE1t. Ti\u1EBFn tri\u1EC3n tu\u1EA7n t\u1EF1, b\u1EC1n v\u1EEFng l\xE2u d\xE0i. T\xECnh c\u1EA3m ph\xE1t tri\u1EC3n ho\xE0n to\xE0n ph\xF9 h\u1EE3p v\u1EDBi l\u1EC5 ti\u1EBFt, t\u1EEBng b\u01B0\u1EDBc v\u1EEFng ch\u1EAFc. L\xE0 l\u01B0\u01A1ng duy\xEAn thu\u1EADn l\xFD th\xE0nh ch\u01B0\u01A1ng, b\u1EA1c \u0111\u1EA7u giai l\xE3o.",
    category: "\u5409",
    scoreRange: [72, 84]
  },
  54: {
    name: "\u96F7\u6CFD\u5F52\u59B9",
    nameEn: "The Marrying Maiden",
    nameEs: "La Doncella que se Casa",
    nameFr: "La Jeune Fille qui se Marie",
    nameTh: "\u0E01\u0E38\u0E22\u0E40\u0E21\u0E48\u0E22 (\u0E2B\u0E0D\u0E34\u0E07\u0E2A\u0E32\u0E27\u0E2D\u0E2D\u0E01\u0E40\u0E23\u0E37\u0E2D\u0E19/\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E17\u0E35\u0E48\u0E1C\u0E34\u0E14\u0E02\u0E31\u0E49\u0E19\u0E15\u0E2D\u0E19)",
    nameVi: "L\xF4i Tr\u1EA1ch Quy Mu\u1ED9i",
    symbol: "\u2633\u2631",
    nature: "\u5F52\u968F",
    natureEn: "Returning & Following",
    natureTh: "\u0E01\u0E25\u0E31\u0E1A\u0E04\u0E37\u0E19\u0E41\u0E25\u0E30\u0E15\u0E32\u0E21",
    natureVi: "Quay v\u1EC1 v\xE0 theo sau",
    natureEs: "Alianza / S\xE9quito",
    natureFr: "Alliance / Soumission",
    judgment: "\u5F81\u51F6\u65E0\u6538\u5229",
    judgmentEn: "Advancing \u2014 misfortune, nothing advantageous.",
    judgmentTh: "\u0E01\u0E49\u0E32\u0E27\u0E44\u0E1B \u2014 \u0E2D\u0E31\u0E1B\u0E21\u0E07\u0E04\u0E25 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E34\u0E48\u0E07\u0E43\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Chinh hung v\xF4 duy l\u1EE3i.",
    relationshipMeaning: "\u9700\u8981\u5BA1\u89C6\u5173\u7CFB\u7684\u6839\u57FA\u662F\u5426\u7262\u56FA\uFF0C\u4E0D\u5B9C\u5192\u8FDB",
    relationshipMeaningEn: "A time of meaningful connection: like a shared journey \u2014 rich experiences but needs direction.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E1C\u0E34\u0E14\u0E17\u0E35\u0E48\u0E1C\u0E34\u0E14\u0E17\u0E32\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E35\u0E1A\u0E23\u0E49\u0E2D\u0E19\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B \u0E21\u0E31\u0E01\u0E40\u0E01\u0E34\u0E14\u0E08\u0E32\u0E01\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E25\u0E07\u0E43\u0E2B\u0E25\u0E0A\u0E31\u0E48\u0E27\u0E27\u0E39\u0E1A\u0E2B\u0E23\u0E37\u0E2D\u0E21\u0E35\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E17\u0E35\u0E48\u0E0B\u0E31\u0E1A\u0E0B\u0E49\u0E2D\u0E19 (\u0E21\u0E37\u0E2D\u0E17\u0E35\u0E48\u0E2A\u0E32\u0E21) \u0E02\u0E32\u0E14\u0E23\u0E32\u0E01\u0E10\u0E32\u0E19\u0E17\u0E35\u0E48\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E43\u0E19\u0E23\u0E30\u0E22\u0E30\u0E22\u0E32\u0E27",
    relationshipMeaningVi: "Hung. V\u1ECB tr\xED kh\xF4ng ch\xEDnh, d\u1EC5 theo c\u1EA3m t\xEDnh. T\xECnh c\u1EA3m nhi\u1EC1u ph\u1EA7n m\xF9 qu\xE1ng ho\u1EB7c mang s\u1EAFc th\xE1i kh\xF4ng ch\xEDnh th\u1EE9c (nh\u01B0 ng\u01B0\u1EDDi th\u1EE9 ba, c\u01B0\u1EDBi ch\u1EA1y b\u1EA7u). Thi\u1EBFu n\u1EC1n t\u1EA3ng l\xE2u d\xE0i, ph\xF2ng \u0111\u1EA7u c\xE1t \u0111u\xF4i hung.",
    category: "\u5F85\u53D8",
    scoreRange: [52, 66]
  },
  55: {
    name: "\u96F7\u4E30",
    nameEn: "Abundance",
    nameEs: "La Abundancia / La Plenitud",
    nameFr: "L'Abondance / La Pl\xE9nitude",
    nameTh: "\u0E40\u0E1F\u0E34\u0E07 (\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E38\u0E14\u0E21\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E16\u0E36\u0E07\u0E02\u0E35\u0E14\u0E2A\u0E38\u0E14)",
    nameVi: "L\xF4i H\u1ECFa Phong",
    symbol: "\u2633\u2632",
    nature: "\u4E30\u76DB",
    natureEn: "Full Abundance",
    natureTh: "\u0E40\u0E15\u0E47\u0E21\u0E40\u0E1B\u0E35\u0E48\u0E22\u0E21\u0E44\u0E1E\u0E28\u0E32\u0E25",
    natureVi: "Tr\xE0n \u0111\u1EA7y d\u1ED3i d\xE0o",
    natureEs: "Abundancia / Grandeza",
    natureFr: "Abondance / Grandeur",
    judgment: "\u4EA8\u738B\u52FF\u5FE7\u5B9C\u65E5\u4E2D",
    judgmentEn: "Success \u2014 the king need not worry, it is fitting at noon.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E01\u0E29\u0E31\u0E15\u0E23\u0E34\u0E22\u0E4C\u0E44\u0E21\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E07\u0E27\u0E25 \u0E40\u0E2B\u0E21\u0E32\u0E30\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E40\u0E17\u0E35\u0E48\u0E22\u0E07\u0E27\u0E31\u0E19",
    judgmentVi: "Hanh, v\u01B0\u01A1ng v\u1EADt \u01B0u, nghi trung nh\u1EADt.",
    relationshipMeaning: "\u5173\u7CFB\u5982\u65E5\u4E2D\u5929\uFF0C\u4F46\u8981\u4FDD\u6301\u6E05\u9192\u4E0D\u8981\u5F97\u610F\u5FD8\u5F62",
    relationshipMeaningEn: "A time of meaningful connection: like a shared journey \u2014 rich experiences but needs direction.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E2B\u0E27\u0E32\u0E19\u0E0A\u0E37\u0E48\u0E19\u0E16\u0E36\u0E07\u0E02\u0E35\u0E14\u0E2A\u0E38\u0E14\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E35\u0E48\u0E2D\u0E34\u0E08\u0E09\u0E32\u0E02\u0E2D\u0E07\u0E43\u0E04\u0E23\u0E46 \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07\u0E27\u0E48\u0E32\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E02\u0E36\u0E49\u0E19\u0E16\u0E36\u0E07\u0E08\u0E38\u0E14\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E41\u0E25\u0E49\u0E27\u0E2D\u0E32\u0E08\u0E16\u0E14\u0E16\u0E2D\u0E22 \u0E04\u0E27\u0E23\u0E1B\u0E23\u0E30\u0E04\u0E2D\u0E07\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E43\u0E2B\u0E49\u0E2A\u0E21\u0E48\u0E33\u0E40\u0E2A\u0E21\u0E2D",
    relationshipMeaningVi: "C\xE1t. Th\u1ECBnh \u0111\u1EA1i phong m\xE3n, quang huy x\xE1n l\u1EA1n. T\xECnh c\u1EA3m \u0111ang \u1EDF giai \u0111o\u1EA1n n\u1ED3ng nhi\u1EC7t \u0111\u1EC9nh cao, khi\u1EBFn ng\u01B0\u1EDDi ng\u01B0\u1EE1ng m\u1ED9. Nh\u01B0ng v\u1EADt c\u1EF1c t\u1EA5t ph\u1EA3n, c\u1EA7n ph\xF2ng th\u1ECBnh c\u1EF1c sinh suy.",
    category: "\u5409",
    scoreRange: [78, 90]
  },
  56: {
    name: "\u706B\u5C71\u65C5",
    nameEn: "The Wanderer",
    nameEs: "El Andariego / El Viajero",
    nameFr: "Le Voyageur",
    nameTh: "\u0E25\u0E27\u0E35\u0E48 (\u0E1C\u0E39\u0E49\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E2D\u0E49\u0E32\u0E07\u0E27\u0E49\u0E32\u0E07)",
    nameVi: "H\u1ECFa S\u01A1n L\u1EEF",
    symbol: "\u2636\u2632",
    nature: "\u65C5\u884C",
    natureEn: "Wandering",
    natureTh: "\u0E1E\u0E40\u0E19\u0E08\u0E23",
    natureVi: "L\u01B0u l\u1EA1c",
    natureEs: "Viaje / Erranza",
    natureFr: "Voyage / Errance",
    judgment: "\u5C0F\u4EA8\u65C5\u8D1E\u5409",
    judgmentEn: "Small success \u2014 the traveler, perseverance, auspicious.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22 \u2014 \u0E1C\u0E39\u0E49\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07 \u0E2D\u0E14\u0E17\u0E19 \u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25",
    judgmentVi: "Ti\u1EC3u hanh, l\u1EEF ki\xEAn tr\xEC c\xE1t.",
    relationshipMeaning: "\u50CF\u4E00\u6BB5\u5171\u540C\u7684\u65C5\u7A0B\uFF0C\u4F53\u9A8C\u4E30\u5BCC\u4F46\u9700\u8981\u65B9\u5411\u611F",
    relationshipMeaningEn: "A time of meaningful connection: Like a shared journey\u2014rich experiences but needs direction.",
    relationshipMeaningTh: "\u0E44\u0E21\u0E48\u0E14\u0E35 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E44\u0E21\u0E48\u0E41\u0E19\u0E48\u0E19\u0E2D\u0E19\u0E41\u0E25\u0E30\u0E1C\u0E31\u0E19\u0E1C\u0E27\u0E19 \u0E21\u0E31\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E23\u0E30\u0E22\u0E30\u0E44\u0E01\u0E25\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E1B\u0E47\u0E19\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E17\u0E32\u0E07\u0E1C\u0E48\u0E32\u0E19\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E22\u0E32\u0E01\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1B\u0E31\u0E01\u0E2B\u0E25\u0E31\u0E01\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2D\u0E19\u0E32\u0E04\u0E15 \u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19 \u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E2D\u0E49\u0E32\u0E07\u0E27\u0E49\u0E32\u0E07",
    relationshipMeaningVi: "Hung. Phi\xEAu b\u1EA1t b\u1EA5t \u0111\u1ECBnh, ki\u1EBFp s\u1ED1ng tha h\u01B0\u01A1ng. T\xECnh c\u1EA3m thi\u1EBFu \u0111i t\xEDnh \u1ED5n \u0111\u1ECBnh, d\u1EC5 l\xE0 y\xEAu xa, b\xF4n ba th\u01B0\u1EDDng xuy\xEAn ho\u1EB7c duy\xEAn ph\u1EADn ng\u1EAFn ng\u1EE7i. Kh\xF3 m\xE0 c\u1EAFm r\u1EC5 s\xE2u b\u1EC1n.",
    category: "\u4E2D",
    scoreRange: [64, 78]
  },
  57: {
    name: "\u5DFD\u4E3A\u98CE",
    nameEn: "The Gentle (Wind)",
    nameEs: "Lo Suave / El Viento",
    nameFr: "Le Doux / Le Vent",
    nameTh: "\u0E0B\u0E27\u0E35\u0E48\u0E19 (\u0E2A\u0E32\u0E22\u0E25\u0E21\u0E17\u0E35\u0E48\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19\u0E41\u0E15\u0E48\u0E41\u0E17\u0E23\u0E01\u0E0B\u0E36\u0E21)",
    nameVi: "T\u1ED1n Vi Phong",
    symbol: "\u2634\u2634",
    nature: "\u987A\u5165",
    natureEn: "Gentle Penetration",
    natureTh: "\u0E0B\u0E2D\u0E01\u0E0B\u0E19\u0E2A\u0E07\u0E48\u0E32\u0E23\u0E32\u0E1A",
    natureVi: "Th\xE2m nh\u1EADp nh\u1EB9 nh\xE0ng",
    natureEs: "Penetraci\xF3n / Flexibilidad",
    natureFr: "P\xE9n\xE9tration / Souplesse",
    judgment: "\u5C0F\u4EA8\u5229\u6709\u6538\u5F80",
    judgmentEn: "Small success, advantageous to have somewhere to go.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35\u0E17\u0E35\u0E48\u0E08\u0E30\u0E21\u0E35\u0E17\u0E35\u0E48\u0E44\u0E1B",
    judgmentVi: "Ti\u1EC3u hanh l\u1EE3i h\u1EEFu duy ti\u1EBFn.",
    relationshipMeaning: "\u7075\u6D3B\u9002\u5E94\u7684\u5173\u7CFB\uFF0C\u968F\u98CE\u800C\u52A8\u987A\u52BF\u800C\u4E3A",
    relationshipMeaningEn: "A time of meaningful connection: gentle influence, go with the flow together.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E40\u0E1B\u0E47\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E17\u0E35\u0E48\u0E0B\u0E36\u0E21\u0E25\u0E36\u0E01\u0E41\u0E25\u0E30\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19\u0E14\u0E31\u0E48\u0E07\u0E2A\u0E32\u0E22\u0E25\u0E21 \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07\u0E04\u0E27\u0E32\u0E21\u0E42\u0E25\u0E40\u0E25 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E08\u0E38\u0E14\u0E22\u0E37\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E22\u0E2D\u0E21\u0E43\u0E2B\u0E49\u0E04\u0E19\u0E23\u0E2D\u0E1A\u0E02\u0E49\u0E32\u0E07\u0E40\u0E1B\u0E48\u0E32\u0E2B\u0E39\u0E08\u0E19\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E2A\u0E31\u0E48\u0E19\u0E04\u0E25\u0E2D\u0E19",
    relationshipMeaningVi: "B\xECnh. Thu\u1EADn phong ti\u1EC1m nh\u1EADp, nhu thu\u1EADn th\u1EA9m th\u1EA5u. T\xECnh c\u1EA3m thi\u1EBFu \u0111i \u0111am m\xEA kinh thi\xEAn \u0111\u1ED9ng \u0111\u1ECBa m\xE0 l\xE0 s\u1EF1 \u1EA3nh h\u01B0\u1EDFng ng\u1EA7m. C\u1EA7n ph\xF2ng thi\u1EBFu ch\xEDnh ki\u1EBFn, do d\u1EF1 khi\u1EBFn quan h\u1EC7 lung lay.",
    category: "\u4E2D",
    scoreRange: [66, 80]
  },
  58: {
    name: "\u5151\u4E3A\u6CFD",
    nameEn: "The Joyous (Lake)",
    nameEs: "Lo Sereno / El Lago",
    nameFr: "Le Joyeux / Le Lac",
    nameTh: "\u0E15\u0E38\u0E49\u0E22 (\u0E17\u0E30\u0E40\u0E25\u0E2A\u0E32\u0E1A\u0E41\u0E2B\u0E48\u0E07\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1A\u0E34\u0E01\u0E1A\u0E32\u0E19)",
    nameVi: "\u0110o\xE0i Vi Tr\u1EA1ch",
    symbol: "\u2631\u2631",
    nature: "\u559C\u60A6",
    natureEn: "Joyful Communication",
    natureTh: "\u0E2A\u0E37\u0E48\u0E2D\u0E2A\u0E32\u0E23\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E22\u0E34\u0E19\u0E14\u0E35",
    natureVi: "S\u1EF1 th\u1EA5u hi\u1EC3u vui v\u1EBB",
    natureEs: "Alegr\xEDa / Regocijo",
    natureFr: "Joie / Plaisir",
    judgment: "\u4EA8\u5229\u8D1E",
    judgmentEn: "Success, advantageous, perseverance.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E2D\u0E14\u0E17\u0E19",
    judgmentVi: "Nguy\xEAn hanh ki\xEAn tr\xEC.",
    relationshipMeaning: "\u6109\u60A6\u5FEB\u4E50\u7684\u5173\u7CFB\uFF0C\u6C9F\u901A\u987A\u7545\u7B11\u58F0\u591A",
    relationshipMeaningEn: "A time of meaningful connection: joyful communication, laughter flows naturally.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02 \u0E40\u0E2A\u0E35\u0E22\u0E07\u0E2B\u0E31\u0E27\u0E40\u0E23\u0E32\u0E30 \u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E14\u0E35 \u0E21\u0E35\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E04\u0E38\u0E22\u0E01\u0E31\u0E19\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E08\u0E1A \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07\u0E01\u0E32\u0E23\u0E1E\u0E39\u0E14\u0E40\u0E2D\u0E32\u0E43\u0E08\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E1C\u0E25\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E0A\u0E19\u0E4C\u0E2A\u0E31\u0E49\u0E19\u0E46 \u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E17\u0E35\u0E48\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07",
    relationshipMeaningVi: "C\xE1t. H\xF2a l\u1EA1c dung dung, ng\u1EADp tr\xE0n ti\u1EBFng c\u01B0\u1EDDi. \u0110\xF4i b\xEAn chung s\u1ED1ng vui v\u1EBB, t\u01B0\u01A1ng t\xE1c ng\u1ECDt ng\xE0o v\xE0 n\xF3i kh\xF4ng h\u1EBFt chuy\u1EC7n. L\u1EE3i cho h\u1EB9n h\xF2, nh\u01B0ng ph\xF2ng l\u01B0u t\u1EA1i \u0111\u1EA7u m\xF4i ch\xF3t l\u01B0\u1EE1i.",
    category: "\u5409",
    scoreRange: [80, 92]
  },
  59: {
    name: "\u98CE\u6C34\u6DA3",
    nameEn: "Dispersion",
    nameEs: "La Disoluci\xF3n / La Dispersi\xF3n",
    nameFr: "La Dissipation / La Dispersion",
    nameTh: "\u0E2E\u0E27\u0E48\u0E32\u0E19 (\u0E01\u0E32\u0E23\u0E01\u0E23\u0E30\u0E08\u0E31\u0E14\u0E01\u0E23\u0E30\u0E08\u0E32\u0E22/\u0E01\u0E32\u0E23\u0E04\u0E25\u0E35\u0E48\u0E04\u0E25\u0E32\u0E22)",
    nameVi: "Phong Th\u1EE7y Ho\xE1n",
    symbol: "\u2634\u2635",
    nature: "\u6DA3\u6563",
    natureEn: "Dissolving Boundaries",
    natureTh: "\u0E25\u0E30\u0E25\u0E32\u0E22\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15",
    natureVi: "H\xF2a tan ranh gi\u1EDBi",
    natureEs: "Dispersi\xF3n",
    natureFr: "Dispersion",
    judgment: "\u738B\u5047\u6709\u5E99\u5229\u6D89\u5927\u5DDD",
    judgmentEn: "The king arrives at the temple \u2014 advantageous to cross the great river.",
    judgmentTh: "\u0E01\u0E29\u0E31\u0E15\u0E23\u0E34\u0E22\u0E4C\u0E40\u0E2A\u0E14\u0E47\u0E08\u0E16\u0E36\u0E07\u0E27\u0E31\u0E14 \u2014 \u0E02\u0E49\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E43\u0E2B\u0E0D\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "V\u01B0\u01A1ng gi\u1EA3 h\u1EEFu mi\u1EBFu, l\u1EE3i tham s\xF4ng l\u1EDBn.",
    relationshipMeaning: "\u6709\u4E9B\u758F\u79BB\u611F\uFF0C\u9700\u8981\u91CD\u65B0\u51DD\u805A\u60C5\u611F",
    relationshipMeaningEn: "A time of meaningful connection: dispersing boundaries, finding new closeness.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E40\u0E23\u0E34\u0E48\u0E21\u0E2B\u0E48\u0E32\u0E07\u0E40\u0E2B\u0E34\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E40\u0E01\u0E34\u0E14\u0E04\u0E27\u0E32\u0E21\u0E44\u0E21\u0E48\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E01\u0E31\u0E19 \u0E41\u0E15\u0E48\u0E2D\u0E35\u0E01\u0E19\u0E31\u0E22\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E2B\u0E32\u0E01\u0E23\u0E35\u0E1A\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E08\u0E2A\u0E30\u0E2A\u0E32\u0E07 \u0E08\u0E30\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2A\u0E25\u0E32\u0E22\u0E04\u0E27\u0E32\u0E21\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E43\u0E19\u0E2D\u0E14\u0E35\u0E15\u0E41\u0E25\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E23\u0E31\u0E01\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49",
    relationshipMeaningVi: "B\xECnh. Gi\xF3 th\u1ED5i n\u01B0\u1EDBc tan, l\xF2ng ng\u01B0\u1EDDi ly t\xE1n. T\xECnh c\u1EA3m xu\u1EA5t hi\u1EC7n s\u01A1 ly, l\u1EA1nh nh\u1EA1t ho\u1EB7c kh\u1EE7ng ho\u1EA3ng l\xF2ng tin. N\u1EBFu ch\u1EE7 \u0111\u1ED9ng ph\xE1 v\u1EE1 b\u1EBF t\u1EAFc, h\xF3a gi\u1EA3i b\u0103ng gi\xE1 s\u1EBD \u0111\xF3n nh\u1EADn t\xE1i sinh.",
    category: "\u4E2D",
    scoreRange: [57, 71]
  },
  60: {
    name: "\u6C34\u6CFD\u8282",
    nameEn: "Limitation",
    nameEs: "La Restricci\xF3n / La Medida",
    nameFr: "La Limitation / La Mesure",
    nameTh: "\u0E40\u0E08\u0E35\u0E4B\u0E22 (\u0E01\u0E32\u0E23\u0E08\u0E33\u0E01\u0E31\u0E14/\u0E01\u0E32\u0E23\u0E21\u0E35\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15)",
    nameVi: "Th\u1EE7y Tr\u1EA1ch Ti\u1EBFt",
    symbol: "\u2635\u2631",
    nature: "\u8282\u5236",
    natureEn: "Measured Limitation",
    natureTh: "\u0E08\u0E33\u0E01\u0E31\u0E14\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E27\u0E31\u0E14\u0E44\u0E14\u0E49",
    natureVi: "H\u1EA1n ch\u1EBF v\u1EEBa ph\u1EA3i",
    natureEs: "Moderaci\xF3n / Control",
    natureFr: "Mod\xE9ration / Retenue",
    judgment: "\u4EA8\u82E6\u8282\u4E0D\u53EF\u8D1E",
    judgmentEn: "Success \u2014 bitter restraint, not advantageous to persevere.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E02\u0E49\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14\u0E02\u0E21\u0E02\u0E37\u0E48\u0E19 \u0E2D\u0E14\u0E17\u0E19\u0E44\u0E21\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Hanh, kh\u1ED5 ti\u1EBFt b\u1EA5t kh\u1EA3 ki\xEAn.",
    relationshipMeaning: "\u9002\u5EA6\u7684\u514B\u5236\u548C\u8FB9\u754C\u611F\u5BF9\u5173\u7CFB\u6709\u76CA",
    relationshipMeaningEn: "A time of meaningful connection: healthy boundaries make love stronger.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E19\u0E1E\u0E37\u0E49\u0E19\u0E10\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E04\u0E27\u0E32\u0E21\u0E1E\u0E2D\u0E14\u0E35 \u0E21\u0E35\u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15\u0E41\u0E25\u0E30\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E1A\u0E27\u0E34\u0E19\u0E31\u0E22 (\u0E40\u0E0A\u0E48\u0E19 \u0E01\u0E32\u0E23\u0E04\u0E38\u0E21\u0E07\u0E1A\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19) \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E15\u0E36\u0E07\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B\u0E08\u0E19\u0E2D\u0E35\u0E01\u0E1D\u0E48\u0E32\u0E22\u0E2D\u0E36\u0E14\u0E2D\u0E31\u0E14",
    relationshipMeaningVi: "B\xECnh. Ti\u1EBFt ch\u1EBF c\xF3 \u0111\u1ED9, t\u01B0\u01A1ng an v\xF4 s\u1EF1. Chung s\u1ED1ng c\u1EA7n tu\xE2n th\u1EE7 quy c\u1EE7, ki\u1EC1m ch\u1EBF ham mu\u1ED1n ho\u1EB7c ch\xFA \xFD ng\xE2n s\xE1ch th\u1EF1c t\u1EBF. Kh\u1EAFc kh\u1ED5 qu\xE1 s\u1EBD g\xE2y ng\u1ED9t ng\u1EA1t, n\xEAn linh ho\u1EA1t.",
    category: "\u4E2D",
    scoreRange: [65, 79]
  },
  61: {
    name: "\u98CE\u6CFD\u4E2D\u5B5A",
    nameEn: "Inner Truth",
    nameEs: "Verdad Interior",
    nameFr: "La V\xE9rit\xE9 Int\xE9rieure",
    nameTh: "\u0E08\u0E07\u0E1F\u0E39 (\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E43\u0E08\u0E2D\u0E31\u0E19\u0E1A\u0E23\u0E34\u0E2A\u0E38\u0E17\u0E18\u0E34\u0E4C)",
    nameVi: "Phong Tr\u1EA1ch Trung Phu",
    symbol: "\u2634\u2631",
    nature: "\u8BDA\u4FE1",
    natureEn: "Sincere Faithfulness",
    natureTh: "\u0E0B\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E15\u0E22\u0E4C\u0E08\u0E23\u0E34\u0E07\u0E43\u0E08",
    natureVi: "Ch\xE2n th\xE0nh v\xE0 trung t\xEDn",
    natureEs: "Sinceridad / Buena fe",
    natureFr: "Sinc\xE9rit\xE9 / Bonne foi",
    judgment: "\u8C5A\u9C7C\u5409\u5229\u6D89\u5927\u5DDD",
    judgmentEn: "Pig and fish \u2014 auspicious, advantageous to cross the great river.",
    judgmentTh: "\u0E2B\u0E21\u0E39\u0E41\u0E25\u0E30\u0E1B\u0E25\u0E32 \u2014 \u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25 \u0E02\u0E49\u0E32\u0E21\u0E41\u0E21\u0E48\u0E19\u0E49\u0E33\u0E43\u0E2B\u0E0D\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "\u0110\u1ED3n ng\u01B0 ng\u1ECDc l\u1EE3i tham s\xF4ng l\u1EDBn.",
    relationshipMeaning: "\u4FE1\u4EFB\u662F\u8FD9\u6BB5\u5173\u7CFB\u7684\u57FA\u77F3\uFF0C\u771F\u8BDA\u76F8\u5F85\u65E0\u5F80\u4E0D\u5229",
    relationshipMeaningEn: "A time of meaningful connection: Trust is the cornerstone of this relationship. Sincere treatment brings success.",
    relationshipMeaningTh: "\u0E40\u0E1B\u0E47\u0E19\u0E21\u0E07\u0E04\u0E25\u0E22\u0E34\u0E48\u0E07 \u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E0B\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E15\u0E22\u0E4C\u0E41\u0E25\u0E30\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E08\u0E01\u0E31\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07 \u0E40\u0E1B\u0E47\u0E19\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E04\u0E39\u0E48\u0E17\u0E32\u0E07\u0E08\u0E34\u0E15\u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13 (Soulmate) \u0E17\u0E35\u0E48\u0E40\u0E1B\u0E34\u0E14\u0E43\u0E08\u0E04\u0E38\u0E22\u0E01\u0E31\u0E19\u0E44\u0E14\u0E49\u0E17\u0E38\u0E01\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07 \u0E23\u0E31\u0E01\u0E2A\u0E21\u0E2B\u0E27\u0E31\u0E07\u0E41\u0E25\u0E30\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14",
    relationshipMeaningVi: "\u0110\u1EA1i c\xE1t. Th\xE0nh t\xEDn t\u1EEB t\xE2m, t\xE2m c\xF3 linh t\xEA. \u0110\xF4i b\xEAn th\xE0nh th\u1EADt \u0111\u1ED1i \u0111\xE3i, kh\xF4ng ch\xFAt nghi k\u1EF5, \u0111\u1EA1t \u0111\u1EBFn chi\u1EC1u s\xE2u h\xF2a h\u1EE3p tinh th\u1EA7n (linh h\u1ED3n b\u1EA1n l\u1EEF). D\xF9ng ch\xE2n t\xE2m n\xE0y t\u01B0\u01A1ng th\u1EE7 s\u1EBD vi\xEAn m\xE3n.",
    category: "\u5409",
    scoreRange: [81, 93]
  },
  62: {
    name: "\u96F7\u5C71\u5C0F\u8FC7",
    nameEn: "Small Excess",
    nameEs: "Peque\xF1o Exceso",
    nameFr: "Le Petit Exc\xE8s",
    nameTh: "\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E31\u0E48\u0E27 (\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22/\u0E04\u0E27\u0E23\u8C26\u0E19\u0E49\u0E2D\u0E21)",
    nameVi: "L\xF4i S\u01A1n Ti\u1EC3u Qu\xE1",
    symbol: "\u2633\u2636",
    nature: "\u5C0F\u8FC7",
    natureEn: "Minor Exceeding",
    natureTh: "\u0E40\u0E01\u0E34\u0E19\u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22",
    natureVi: "V\u01B0\u1EE3t qu\xE1 nh\u1ECF",
    natureEs: "Peque\xF1o Exceso",
    natureFr: "Petit Exc\xE8s",
    judgment: "\u4EA8\u5229\u8D1E\u53EF\u5C0F\u4E8B\u4E0D\u53EF\u5927\u4E8B",
    judgmentEn: "Success, advantageous, perseverance \u2014 can do small things, cannot do great things.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35 \u0E2D\u0E14\u0E17\u0E19 \u2014 \u0E17\u0E33\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E25\u0E47\u0E01\u0E44\u0E14\u0E49 \u0E17\u0E33\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E43\u0E2B\u0E0D\u0E48\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49",
    judgmentVi: "Nguy\xEAn hanh l\u1EE3i ki\xEAn tr\xEC, kh\u1EA3 ti\u1EC3u s\u1EF1, b\u1EA5t kh\u1EA3 \u0111\u1EA1i s\u1EF1.",
    relationshipMeaning: "\u5C0F\u4E8B\u4E0A\u9ED8\u5951\u5341\u8DB3\uFF0C\u5927\u4E8B\u4E0A\u8FD8\u9700\u66F4\u591A\u78E8\u5408",
    relationshipMeaningEn: "A time of meaningful connection: small excesses are okay, don't sweat the small stuff.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E21\u0E35\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E1C\u0E34\u0E14\u0E43\u0E08\u0E01\u0E31\u0E19\u0E14\u0E49\u0E27\u0E22\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E25\u0E47\u0E01\u0E46 \u0E19\u0E49\u0E2D\u0E22\u0E46 \u0E1A\u0E48\u0E2D\u0E22\u0E04\u0E23\u0E31\u0E49\u0E07 \u0E44\u0E21\u0E48\u0E04\u0E27\u0E23\u0E40\u0E2D\u0E32\u0E0A\u0E19\u0E30\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E32\u0E14\u0E2B\u0E27\u0E31\u0E07\u0E2A\u0E39\u0E07\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B \u0E01\u0E32\u0E23\u0E22\u0E2D\u0E21\u0E2D\u0E48\u0E2D\u0E19\u0E02\u0E49\u0E2D\u0E41\u0E25\u0E30\u0E43\u0E2A\u0E48\u0E43\u0E08\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E40\u0E25\u0E47\u0E01\u0E46 \u0E43\u0E19\u0E1A\u0E49\u0E32\u0E19\u0E08\u0E30\u0E1B\u0E23\u0E30\u0E04\u0E2D\u0E07\u0E23\u0E31\u0E01\u0E44\u0E14\u0E49",
    relationshipMeaningVi: "B\xECnh. C\xF3 l\u1ED7i nh\u1ECF, n\xEAn d\u01B0\u1EDBi kh\xF4ng n\xEAn tr\xEAn. T\xECnh c\u1EA3m th\u01B0\u1EDDng ma s\xE1t v\xEC chuy\u1EC7n l\xF4ng g\xE0 v\u1ECF t\u1ECFi, l\xFAc n\xE0y k\u1EF5 nh\u1EA5t tranh c\u01B0\u1EDDng hi\u1EBFu th\u1EAFng, gi\u1EEF khi\xEAm t\u1ED1n, ch\u0103m ch\xFAt vi\u1EC7c nh\u1ECF s\u1EBD b\xECnh an.",
    category: "\u4E2D",
    scoreRange: [62, 76]
  },
  63: {
    name: "\u6C34\u706B\u65E2\u6D4E",
    nameEn: "After Completion",
    nameEs: "Despu\xE9s de la Realizaci\xF3n",
    nameFr: "Apr\xE8s l'Accomplissement",
    nameTh: "\u0E08\u0E35\u0E49\u0E08\u0E35\u0E49 (\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19)",
    nameVi: "Th\u1EE7y H\u1ECFa K\xFD T\u1EBF",
    symbol: "\u2635\u2632",
    nature: "\u65E2\u6D4E",
    natureEn: "Already Fulfilled",
    natureTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08\u0E41\u0E25\u0E49\u0E27",
    natureVi: "\u0110\xE3 th\xE0nh t\u1EF1u",
    natureEs: "Realizaci\xF3n / Logro total",
    natureFr: "Accomplissement / Harmonie",
    judgment: "\u4EA8\u5C0F\u5229\u8D1E",
    judgmentEn: "Success, small, advantageous to persevere.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E40\u0E25\u0E47\u0E01\u0E19\u0E49\u0E2D\u0E22 \u0E2D\u0E14\u0E17\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E1C\u0E25\u0E14\u0E35",
    judgmentVi: "Hanh ti\u1EC3u, ki\xEAn tr\xEC l\u1EE3i.",
    relationshipMeaning: "\u6C34\u706B\u65E2\u6D4E\uFF0C\u9634\u9633\u8C03\u548C\uFF0C\u4E07\u4E8B\u4FF1\u5907\u7684\u5706\u6EE1\u72B6\u6001",
    relationshipMeaningEn: "A time of meaningful connection: water and fire in balance \u2014 a fulfilled and complete bond.",
    relationshipMeaningTh: "\u0E42\u0E0A\u0E04\u0E14\u0E35 \u0E2A\u0E21\u0E2B\u0E27\u0E31\u0E07\u0E17\u0E38\u0E01\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E23 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E1A\u0E23\u0E23\u0E25\u0E38\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07\u0E44\u0E27\u0E49 (\u0E40\u0E0A\u0E48\u0E19 \u0E44\u0E14\u0E49\u0E41\u0E15\u0E48\u0E07\u0E07\u0E32\u0E19) \u0E41\u0E15\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E30\u0E27\u0E31\u0E07\u0E04\u0E27\u0E32\u0E21\u0E40\u0E09\u0E37\u0E48\u0E2D\u0E22\u0E0A\u0E32\u0E2B\u0E25\u0E31\u0E07\u0E08\u0E32\u0E01\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u0E04\u0E27\u0E23\u0E40\u0E15\u0E34\u0E21\u0E04\u0E27\u0E32\u0E21\u0E43\u0E2A\u0E48\u0E43\u0E08\u0E43\u0E2B\u0E49\u0E01\u0E31\u0E19\u0E40\u0E2A\u0E21\u0E2D",
    relationshipMeaningVi: "C\xE1t. C\xF4ng \u0111\u1EE9c vi\xEAn m\xE3n, th\u1EE7y h\u1ECFa t\u01B0\u01A1ng t\u1EBF. T\xECnh c\u1EA3m \u0111\u1EA1t \u0111\u01B0\u1EE3c m\u1EE5c ti\xEAu l\xFD t\u01B0\u1EDFng (nh\u01B0 thu\u1EADn l\u1EE3i k\u1EBFt h\xF4n). Nh\u01B0ng ph\xF2ng \u0111\u1EA7u c\xE1t \u0111u\xF4i lo\u1EA1n, sau th\xE0nh c\xF4ng d\u1EC5 sinh l\u01B0\u1EDDi bi\u1EBFng.",
    category: "\u5927\u5409",
    scoreRange: [87, 98]
  },
  64: {
    name: "\u706B\u6C34\u672A\u6D4E",
    nameEn: "Before Completion",
    nameEs: "Antes de la Realizaci\xF3n",
    nameFr: "Avant l'Accomplissement",
    nameTh: "\u0E40\u0E27\u0E22\u0E08\u0E35\u0E49 (\u0E01\u0E48\u0E2D\u0E19\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08/\u0E2D\u0E19\u0E32\u0E04\u0E15\u0E20\u0E32\u0E04\u0E22\u0E4C)",
    nameVi: "H\u1ECFa Th\u1EE7y V\u1ECB T\u1EBF",
    symbol: "\u2632\u2635",
    nature: "\u672A\u6D4E",
    natureEn: "Not Yet Fulfilled",
    natureTh: "\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08",
    natureVi: "Ch\u01B0a th\xE0nh t\u1EF1u",
    natureEs: "Inconcluso / Potencial",
    natureFr: "Inaccompli / Potentiel",
    judgment: "\u4EA8\u5C0F\u72D0\u6C54\u6D4E\u6FE1\u5176\u5C3E",
    judgmentEn: "Success \u2014 the little fox has almost crossed, wets its tail.",
    judgmentTh: "\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E2A\u0E38\u0E19\u0E31\u0E02\u0E08\u0E34\u0E49\u0E07\u0E08\u0E2D\u0E01\u0E19\u0E49\u0E2D\u0E22\u0E02\u0E49\u0E32\u0E21\u0E43\u0E01\u0E25\u0E49\u0E08\u0E30\u0E16\u0E36\u0E07 \u0E2B\u0E32\u0E07\u0E40\u0E1B\u0E35\u0E22\u0E01",
    judgmentVi: "Hanh ti\u1EC3u h\u1ED3 ly ng\u1EADt t\u1EBF, nhu k\u1EF3 v\u0129.",
    relationshipMeaning: "\u65C5\u7A0B\u5C1A\u672A\u7ED3\u675F\uFF0C\u672A\u5B8C\u6210\u610F\u5473\u7740\u8FD8\u6709\u65E0\u9650\u53EF\u80FD",
    relationshipMeaningEn: "A time of meaningful connection: not yet fulfilled \u2014 the story is still being written, and that's exciting.",
    relationshipMeaningTh: "\u0E1B\u0E32\u0E19\u0E01\u0E25\u0E32\u0E07 \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E1E\u0E22\u0E32\u0E22\u0E32\u0E21\u0E01\u0E48\u0E2D\u0E19\u0E16\u0E36\u0E07\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22 \u0E41\u0E21\u0E49\u0E15\u0E2D\u0E19\u0E19\u0E35\u0E49\u0E08\u0E30\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 (\u0E40\u0E0A\u0E48\u0E19 \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E14\u0E39\u0E43\u0E08) \u0E41\u0E15\u0E48\u0E21\u0E35\u0E2D\u0E19\u0E32\u0E04\u0E15\u0E17\u0E35\u0E48\u0E2A\u0E14\u0E43\u0E2A\u0E2D\u0E22\u0E39\u0E48\u0E2B\u0E32\u0E01\u0E44\u0E21\u0E48\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E1E\u0E22\u0E32\u0E22\u0E32\u0E21",
    relationshipMeaningVi: "B\xECnh. B\xF3ng t\u1ED1i tr\u01B0\u1EDBc b\xECnh minh, t\u01B0\u01A1ng lai tr\xE0n ng\u1EADp kh\u1EA3 n\u0103ng v\xF4 h\u1EA1n. Tuy hi\u1EC7n t\u1EA1i ch\u01B0a \u0111\u1EA1t tr\u1EA1ng th\xE1i ho\xE0n m\u1EF9 (\u0111ang theo \u0111u\u1ED5i/y\xEAu xa), ch\u1EC9 c\u1EA7n ki\xEAn tr\xEC s\u1EBD l\u1ED9i n\u01B0\u1EDBc th\xE0nh c\xF4ng.",
    category: "\u4E2D",
    scoreRange: [67, 81]
  }
};
function getIndividualIChingProfile(birthInfo, lang = "zh") {
  const upperGuaNum = ((birthInfo.year + birthInfo.month) % 8 + 8) % 8;
  const lowerGuaNum = ((birthInfo.month + birthInfo.day) % 8 + 8) % 8;
  const hexIndex = (upperGuaNum * 8 + lowerGuaNum) % 64 + 1;
  const totalSum = birthInfo.year + birthInfo.month + birthInfo.day;
  const changingLine = totalSum % 6 + 1;
  const hex = HEXAGRAMS[hexIndex] || HEXAGRAMS[23];
  const transformedIdx = (hexIndex + changingLine) % 64 + 1;
  const transformedHex = transformedIdx !== hexIndex ? HEXAGRAMS[transformedIdx] : null;
  const meta = [`HEXAGRAM_${hexIndex}`];
  if (changingLine > 0) meta.push(`CHANGING_LINE_${changingLine}`);
  return {
    hexNum: hexIndex,
    hexName: getHexField(hex, "name", lang),
    hexNature: getHexField(hex, "nature", lang),
    hexSymbol: hex.symbol || "",
    hexJudgment: getHexField(hex, "judgment", lang),
    changingLine,
    transformedHexNum: transformedHex ? transformedIdx : null,
    transformedHexName: transformedHex ? getHexField(transformedHex, "name", lang) : null,
    meta
  };
}

// src/lib/algos/i18n.ts
var SUPPORTED = ["zh", "en", "es", "fr", "th", "vi"];
function normalizeLang(raw) {
  const base = raw.split("-")[0];
  return SUPPORTED.includes(base) ? base : "en";
}

// src/lib/algos/index.ts
function getIndividualData(birthInfo, lang) {
  const algLang = normalizeLang(lang || "zh");
  const bazi = getIndividualBaZiProfile(birthInfo);
  const zodiac = getIndividualZodiacProfile(birthInfo, algLang);
  const iching = getIndividualIChingProfile(birthInfo, algLang);

  // ── Translate bazi fields for non-zh langs ──
  const WX_TR = {
    en: {'木':'Wood','火':'Fire','土':'Earth','金':'Metal','水':'Water'},
    es: {'木':'Madera','火':'Fuego','土':'Tierra','金':'Metal','水':'Agua'},
    fr: {'木':'Bois','火':'Feu','土':'Terre','金':'Métal','水':'Eau'},
    th: {'木':'ไม้','火':'ไฟ','土':'ดิน','金':'โลหะ','水':'น้ำ'},
    vi: {'木':'Mộc','火':'Hỏa','土':'Thổ','金':'Kim','水':'Thủy'}
  };
  const TG_TR = {
    en: {'甲':'Wood','乙':'Wood','丙':'Fire','丁':'Fire','戊':'Earth','己':'Earth','庚':'Metal','辛':'Metal','壬':'Water','癸':'Water'},
    es: {'甲':'Madera','乙':'Madera','丙':'Fuego','丁':'Fuego','戊':'Tierra','己':'Tierra','庚':'Metal','辛':'Metal','壬':'Agua','癸':'Agua'},
    fr: {'甲':'Bois','乙':'Bois','丙':'Feu','丁':'Feu','戊':'Terre','己':'Terre','庚':'Métal','辛':'Métal','壬':'Eau','癸':'Eau'},
    th: {'甲':'ไม้','乙':'ไม้','丙':'ไฟ','丁':'ไฟ','戊':'ดิน','己':'ดิน','庚':'โลหะ','辛':'โลหะ','壬':'น้ำ','癸':'น้ำ'},
    vi: {'甲':'Mộc','乙':'Mộc','丙':'Hỏa','丁':'Hỏa','戊':'Thổ','己':'Thổ','庚':'Kim','辛':'Kim','壬':'Thủy','癸':'Thủy'}
  };
  const DZ_TR = {
    en: {'子':'Rat','丑':'Ox','寅':'Tiger','卯':'Rabbit','辰':'Dragon','巳':'Snake','午':'Horse','未':'Goat','申':'Monkey','酉':'Rooster','戌':'Dog','亥':'Pig'},
    es: {'子':'Rata','丑':'Buey','寅':'Tigre','卯':'Conejo','辰':'Dragón','巳':'Serpiente','午':'Caballo','未':'Cabra','申':'Mono','酉':'Gallo','戌':'Perro','亥':'Cerdo'},
    fr: {'子':'Rat','丑':'Bœuf','寅':'Tigre','卯':'Lapin','辰':'Dragon','巳':'Serpent','午':'Cheval','未':'Chèvre','申':'Singe','酉':'Coq','戌':'Chien','亥':'Cochon'},
    th: {'子':'หนู','丑':'วัว','寅':'เสือ','卯':'กระต่าย','辰':'มังกร','巳':'งู','午':'ม้า','未':'แพะ','申':'ลิง','酉':'ไก่','戌':'หมา','亥':'หมู'},
    vi: {'子':'Tý','丑':'Sửu','寅':'Dần','卯':'Mão','辰':'Thìn','巳':'Tỵ','午':'Ngọ','未':'Mùi','申':'Thân','酉':'Dậu','戌':'Tuất','亥':'Hợi'}
  };
  const ORI_TR = {
    en: {'正位':'Upright','逆位':'Reversed'},
    es: {'正位':'Upright','逆位':'Reversed'},
    fr: {'正位':'Upright','逆位':'Reversed'},
    th: {'正位':'Upright','逆位':'Reversed'},
    vi: {'正位':'Upright','逆位':'Reversed'}
  };
  const LINE_TR = {zh:'爻动',en:'line moving',es:'línea móvil',fr:'ligne mobile',th:'เส้นเคลื่อน',vi:'đổi tua'};
  const LINE_SUFFIX = {1:'1st',2:'2nd',3:'3rd',4:'4th',5:'5th',6:'6th'};

  let baziOut = bazi;
  if (algLang !== 'zh') {
    const wtr = WX_TR[algLang] || WX_TR.en;
    const ttr = TG_TR[algLang] || TG_TR.en;
    const dtr = DZ_TR[algLang] || DZ_TR.en;
    const wxTranslated = {};
    for (const [k, v] of Object.entries(bazi.wuxing)) {
      wxTranslated[wtr[k] || k] = v;
    }
    const sz = bazi.sizhu;
    const translatePillar = (arr) => arr.map(c => ttr[c] || dtr[c] || c).join(' ');
    const dayPillarTranslated = `${ttr[sz.dayMaster] || sz.dayMaster} ${dtr[sz.day[1]] || sz.day[1]}`;
    baziOut = {
      ...bazi,
      sizhu: {
        ...sz,
        year: [ttr[sz.year[0]] || sz.year[0], dtr[sz.year[1]] || sz.year[1]],
        month: [ttr[sz.month[0]] || sz.month[0], dtr[sz.month[1]] || sz.month[1]],
        day: [ttr[sz.day[0]] || sz.day[0], dtr[sz.day[1]] || sz.day[1]],
        dayMaster: ttr[sz.dayMaster] || sz.dayMaster,
        dayPillar: dayPillarTranslated,
      },
      wuxing: wxTranslated,
      dayMasterWuxing: wtr[bazi.dayMasterWuxing] || bazi.dayMasterWuxing
    };
  }

  // ── Add changingLineDesc for iching ──
  let ichingOut = iching;
  if (iching.changingLine) {
    const lineNum = parseInt(iching.changingLine) || 0;
    const suffix = algLang === 'zh' ? `${iching.changingLine}爻动` : `${LINE_SUFFIX[lineNum] || iching.changingLine} ${LINE_TR[algLang] || LINE_TR.en}`;
    ichingOut = { ...iching, changingLineDesc: suffix };
  }

  return {
    birthInfo,
    bazi: baziOut,
    zodiac,
    iching: ichingOut,
    meta: [...bazi.meta, ...zodiac.meta, ...iching.meta]
  };
}

// src/lib/tarot.ts
var CARDS = [
  { id: 0, emoji: "\u{1F31F}", name: { zh: "\u611A\u4EBA", en: "The Fool", es: "El Loco", fr: "Le Fou", th: "\u0E04\u0E19\u0E42\u0E07\u0E48\u0E1B\u0E23\u0E30\u0E2B\u0E25\u0E32\u0E14", vi: "Ch\xE0ng Kh\u1EDD" }, meaning: {
    zh: "\u8E0F\u4E0A\u672A\u77E5\u65C5\u7A0B\u7684\u52C7\u6C14\uFF0C\u65B0\u53EF\u80FD\u7684\u5F00\u542F\u3002\u5728\u611F\u60C5\u4E2D\uFF0C\u8FD9\u610F\u5473\u7740\u613F\u610F\u4E3A\u7231\u5192\u9669\u3001\u653E\u4E0B\u7B97\u8BA1\u3001\u51ED\u76F4\u89C9\u524D\u884C\u2014\u2014\u54EA\u6015\u524D\u8DEF\u65E0\u4EBA\u8D70\u8FC7\u3002\u9006\u4F4D\u65F6\uFF0C\u8FD9\u5F20\u724C\u63D0\u9192\u4F60\uFF1A\u83AB\u8BA9\u6050\u60E7\u6D47\u706D\u5FC3\u4E2D\u90A3\u56E2\u65E0\u754F\u4E4B\u706B\uFF0C\u771F\u6B63\u7684\u4EB2\u5BC6\u9700\u8981\u4E00\u9897\u8D64\u5B50\u4E4B\u5FC3\u3002\u5F53\u4F60\u72B9\u8C6B\u662F\u5426\u8BE5\u8FC8\u51FA\u90A3\u4E00\u6B65\u65F6\uFF0C\u8BF7\u8BB0\u4F4F\uFF0C\u6BCF\u4E00\u6B21\u771F\u5FC3\u8DF3\u8DC3\u90FD\u503C\u5F97\u88AB\u5B87\u5B99\u63A5\u4F4F\u3002",
    en: "The courage to embark on an unknown journey \u2014 new possibilities await. In love, this means daring to leap without a safety net, trusting intuition over calculation. Reversed, it warns that fear is dampening your spark; true intimacy requires the heart of a child. When you hesitate at the edge, remember: every genuine leap of faith is worth taking.",
    es: "El valor para emprender un viaje desconocido \u2014 nuevas posibilidades le esperan. En el amor, esto significa atreverse a saltar sin red, confiando en la intuici\xF3n por encima del c\xE1lculo. Invertido, advierte que el miedo est\xE1 apagando tu chispa; la verdadera intimidad requiere un coraz\xF3n de ni\xF1o. Cuando dudas al borde, recuerda: cada salto genuino de fe vale la pena.",
    fr: "Le courage de partir vers l'inconnu \u2014 de nouvelles possibilit\xE9s vous attendent. En amour, cela signifie oser sauter sans filet, en faisant confiance \xE0 votre intuition plut\xF4t qu'au calcul. Invers\xE9, il avertit que la peur \xE9touffe votre flamme ; l'intimit\xE9 v\xE9ritable exige le c\u0153ur d'un enfant. Quand vous h\xE9sitez au bord, rappelez-vous : chaque saut de foi sinc\xE8re m\xE9rite d'\xEAtre fait.",
    th: "\u0E04\u0E27\u0E32\u0E21\u0E01\u0E25\u0E49\u0E32\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E01\u0E32\u0E23\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u0E41\u0E2B\u0E48\u0E07\u0E04\u0E27\u0E32\u0E21\u0E25\u0E36\u0E01\u0E25\u0E31\u0E1A \u2014 \u0E42\u0E2D\u0E01\u0E32\u0E2A\u0E43\u0E2B\u0E21\u0E48\u0E23\u0E2D\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E39\u0E48 \u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u0E19\u0E35\u0E48\u0E2B\u0E21\u0E32\u0E22\u0E16\u0E36\u0E07\u0E01\u0E32\u0E23\u0E01\u0E25\u0E49\u0E32\u0E01\u0E23\u0E30\u0E42\u0E14\u0E14\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E0A\u0E37\u0E2D\u0E01\u0E22\u0E36\u0E14 \u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08\u0E43\u0E19\u0E2A\u0E31\u0E0D\u0E0A\u0E32\u0E15\u0E0D\u0E32\u0E13\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E01\u0E32\u0E23\u0E04\u0E33\u0E19\u0E27\u0E13 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E27\u0E48\u0E32\u0E04\u0E27\u0E32\u0E21\u0E01\u0E25\u0E31\u0E27\u0E01\u0E33\u0E25\u0E31\u0E07\u0E14\u0E31\u0E1A\u0E44\u0E1F\u0E43\u0E19\u0E43\u0E08\u0E04\u0E38\u0E13 \u0E04\u0E27\u0E32\u0E21\u0E43\u0E01\u0E25\u0E49\u0E0A\u0E34\u0E14\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E31\u0E27\u0E43\u0E08\u0E02\u0E2D\u0E07\u0E40\u0E14\u0E47\u0E01 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E04\u0E38\u0E13\u0E25\u0E31\u0E07\u0E40\u0E25\u0E17\u0E35\u0E48\u0E02\u0E2D\u0E1A\u0E19\u0E31\u0E49\u0E19 \u0E08\u0E07\u0E08\u0E33\u0E44\u0E27\u0E49: \u0E01\u0E32\u0E23\u0E01\u0E23\u0E30\u0E42\u0E14\u0E14\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E25\u0E49\u0E27\u0E19\u0E21\u0E35\u0E04\u0E48\u0E32",
    vi: "Can \u0111\u1EA3m b\u01B0\u1EDBc v\xE0o h\xE0nh tr\xECnh ch\u01B0a bi\u1EBFt \u2014 nh\u1EEFng kh\u1EA3 n\u0103ng m\u1EDBi \u0111ang ch\u1EDD \u0111\u1EE3i b\u1EA1n. Trong t\xECnh y\xEAu, \u0111\xE2y l\xE0 l\u1EDDi nh\u1EAFc nh\u1EDF r\u1EB1ng \u0111\xF4i khi ta c\u1EA7n bu\xF4ng b\u1ECF t\xEDnh to\xE1n v\xE0 tin v\xE0o tr\u1EF1c gi\xE1c c\u1EE7a tr\xE1i tim, d\xE1m m\u1EA1o hi\u1EC3m v\xEC y\xEAu th\u01B0\u01A1ng d\xF9 ch\u01B0a ai t\u1EEBng \u0111i qua con \u0111\u01B0\u1EDDng \u1EA5y. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, n\u1ED7i s\u1EE3 h\xE3i \u0111ang ng\u0103n b\u1EA1n d\u1EA5n th\xE2n \u2014 tr\xEC ho\xE3n m\u1ED9t quy\u1EBFt \u0111\u1ECBnh quan tr\u1ECDng, \u0111\u1EC3 l\u1EE1 m\u1ED9t c\u01A1 h\u1ED9i v\xEC s\u1EE3 t\u1ED5n th\u01B0\u01A1ng. C\u1EA3 hai c\xF3 th\u1EC3 \u0111ang gi\u1EA3 v\u1EDD kh\xF4ng sao trong khi th\u1EF1c ra kh\xF4ng ai d\xE1m m\u1EDF l\xF2ng th\u1EADt. \u0110\u1EB1ng sau v\u1EBB ngo\xE0i l\xFD tr\xED l\xE0 m\u1ED9t ng\u01B0\u1EDDi \u0111ang r\u1EA5t s\u1EE3 b\u1ECB t\u1EEB ch\u1ED1i, c\xF2n ng\u01B0\u1EDDi kia th\xEC s\u1EE3 b\u1ECB r\xE0ng bu\u1ED9c. H\xE3y d\xE0nh m\u1ED9t bu\u1ED5i t\u1ED1i kh\xF4ng \u0111i\u1EC7n tho\u1EA1i, m\u1ED7i ng\u01B0\u1EDDi vi\u1EBFt ra \u0111i\u1EC1u s\u1EE3 nh\u1EA5t v\u1EC1 \u0111\u1ED1i ph\u01B0\u01A1ng \u2014 r\u1ED3i \u0111\u1ECDc to cho nhau nghe. C\u1EA3m gi\xE1c l\u1ED9 li\u1EC5u \u0111\xF3 s\u1EBD x\xF3a b\u1ECF m\u1ECDi b\u1EE9c t\u01B0\u1EDDng gi\u1EA3 t\u1EA1o."
  } },
  { id: 1, emoji: "\u{1F52E}", name: { zh: "\u9B54\u672F\u5E08", en: "The Magician", es: "El Mago", fr: "Le Bateleur", th: "\u0E19\u0E31\u0E01\u0E21\u0E32\u0E22\u0E01\u0E25", vi: "Nh\xE0 \u1EA2o Thu\u1EADt" }, meaning: {
    zh: "\u610F\u5FD7\u4E0E\u884C\u52A8\u529B\u89C9\u9192\uFF0C\u521B\u9020\u663E\u5316\u7684\u65F6\u523B\u3002\u4F60\u7684\u611F\u60C5\u4E2D\u51FA\u73B0\u8FD9\u5F20\u724C\uFF0C\u6697\u793A\u7740\u5C06\u5FC3\u610F\u5316\u4E3A\u73B0\u5B9E\u7684\u529B\u91CF\u6B63\u5728\u82CF\u9192\u2014\u2014\u4F60\u4EEC\u6709\u80FD\u529B\u5C06\u5173\u7CFB\u5851\u9020\u6210\u5FC3\u4E2D\u6240\u613F\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u9192\u4F60\u52FF\u8BA9\u624D\u534E\u6C89\u7761\uFF0C\u6562\u4E8E\u884C\u52A8\u624D\u662F\u7834\u89E3\u56F0\u5C40\u7684\u5173\u952E\u3002\u624B\u4E2D\u7684\u6BCF\u4E00\u5F20\u724C\u90FD\u662F\u4F60\u7684\u8D44\u6E90\uFF0C\u53EA\u770B\u4F60\u613F\u4E0D\u613F\u5C06\u5B83\u4EEC\u7FFB\u51FA\uFF0C\u5C06\u7231\u7684\u53EF\u80FD\u6027\u53D8\u4E3A\u4E0D\u53EF\u9006\u7684\u73B0\u5B9E\u3002",
    en: "Manifestation and creation \u2014 willpower awakened into action. When this card appears in your relationship, the power to shape your bond is awakening \u2014 you have everything needed to make it what you desire. Reversed, it warns against letting potential gather dust; bold action is the key to breaking deadlocks. Every tool is already in your hands \u2014 the question is whether you dare turn intention into irreversible reality.",
    es: "Manifestaci\xF3n y creaci\xF3n \u2014 la fuerza de voluntad se despierta en acci\xF3n. Cuando esta carta aparece en su relaci\xF3n, el poder de dar forma a su v\xEDnculo se est\xE1 despertando \u2014 tiene todo lo necesario para convertirlo en lo que desea. Invertido, advierte contra dejar que el potencial se acumule en polvo; la acci\xF3n audaz es la clave para romper los puntos muertos. Cada herramienta ya est\xE1 en sus manos \u2014 la pregunta es si se atreve a convertir la intenci\xF3n en realidad irreversible.",
    fr: "Manifestation et cr\xE9ation \u2014 la volont\xE9 s'\xE9veille en action. Quand cette carte appara\xEEt dans votre relation, le pouvoir de fa\xE7onner votre lien s'\xE9veille \u2014 vous avez tout ce qu'il faut pour en faire ce que vous d\xE9sirez. Invers\xE9, il avertit de ne pas laisser le potentiel s'ensabler ; l'action audacieuse est la cl\xE9 pour briser les blocages. Chaque outil est d\xE9j\xE0 entre vos mains \u2014 la question est de savoir si vous osez transformer l'intention en r\xE9alit\xE9 irr\xE9versible.",
    th: "\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2A\u0E23\u0E23\u0E04\u0E4C\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E41\u0E2A\u0E14\u0E07\u0E2D\u0E2D\u0E01 \u2014 \u0E1E\u0E25\u0E31\u0E07\u0E08\u0E34\u0E15\u0E15\u0E37\u0E48\u0E19\u0E02\u0E36\u0E49\u0E19\u0E2A\u0E39\u0E48\u0E01\u0E32\u0E23\u0E25\u0E07\u0E21\u0E37\u0E2D \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13 \u0E1E\u0E25\u0E31\u0E07\u0E43\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E2A\u0E23\u0E23\u0E04\u0E4C\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E39\u0E01\u0E1E\u0E31\u0E19\u0E01\u0E33\u0E25\u0E31\u0E07\u0E15\u0E37\u0E48\u0E19\u0E02\u0E36\u0E49\u0E19 \u2014 \u0E04\u0E38\u0E13\u0E21\u0E35\u0E17\u0E38\u0E01\u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E21\u0E31\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E1B\u0E23\u0E32\u0E23\u0E16\u0E19\u0E32 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E27\u0E48\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E43\u0E2B\u0E49\u0E28\u0E31\u0E01\u0E22\u0E20\u0E32\u0E1E\u0E08\u0E21\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E1D\u0E38\u0E48\u0E19 \u0E01\u0E32\u0E23\u0E25\u0E07\u0E21\u0E37\u0E2D\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E01\u0E25\u0E49\u0E32\u0E2B\u0E32\u0E0D\u0E04\u0E37\u0E2D\u0E01\u0E38\u0E0D\u0E41\u0E08\u0E43\u0E19\u0E01\u0E32\u0E23\u0E17\u0E25\u0E32\u0E22\u0E17\u0E32\u0E07\u0E15\u0E31\u0E19 \u0E17\u0E38\u0E01\u0E40\u0E04\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E21\u0E37\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E21\u0E37\u0E2D\u0E04\u0E38\u0E13\u0E41\u0E25\u0E49\u0E27 \u2014 \u0E04\u0E33\u0E16\u0E32\u0E21\u0E04\u0E37\u0E2D\u0E04\u0E38\u0E13\u0E01\u0E25\u0E49\u0E32\u0E08\u0E30\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E04\u0E27\u0E32\u0E21\u0E15\u0E31\u0E49\u0E07\u0E43\u0E08\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E2B\u0E22\u0E38\u0E14\u0E22\u0E31\u0E49\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48",
    vi: "Hi\u1EC7n th\u1EF1c h\xF3a v\xE0 s\xE1ng t\u1EA1o \u2014 \xFD ch\xED th\u1EE9c t\u1EC9nh th\xE0nh h\xE0nh \u0111\u1ED9ng. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y cho th\u1EA5y b\u1EA1n c\xF3 kh\u1EA3 n\u0103ng bi\u1EBFn \u01B0\u1EDBc m\u01A1 th\xE0nh hi\u1EC7n th\u1EF1c, d\xF9ng s\u1EF1 s\xE1ng t\u1EA1o v\xE0 \xFD ch\xED m\u1EA1nh m\u1EBD \u0111\u1EC3 ki\u1EBFn t\u1EA1o m\u1ED1i quan h\u1EC7 nh\u01B0 mong mu\u1ED1n. \u0110\u1EEBng ch\u1EDD \u0111\u1EE3i ph\xE9p m\xE0u t\u1EEB b\xEAn ngo\xE0i \u2014 ch\xEDnh b\u1EA1n l\xE0 ng\u01B0\u1EDDi c\u1EA7m b\xFAt vi\u1EBFt c\xE2u chuy\u1EC7n t\xECnh \u1EA5y. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, b\u1EA1n \u0111ang n\xF3i nhi\u1EC1u h\u01A1n l\xE0m \u2014 vi\u1EC7n l\xFD do 'ch\u01B0a s\u1EB5n s\xE0ng', h\u1EE9a h\u1EB9n m\xE0 kh\xF4ng th\u1EF1c hi\u1EC7n, khi\u1EBFn \u0111\u1ED1i ph\u01B0\u01A1ng c\u1EA3m th\u1EA5y b\u1ECB d\u1EABn d\u1EAFt. C\xF3 ng\u01B0\u1EDDi \u0111ang d\xF9ng l\u1EDDi n\xF3i hoa m\u1EF9 \u0111\u1EC3 che \u0111\u1EADy s\u1EF1 thi\u1EBFu cam k\u1EBFt, ng\u01B0\u1EDDi c\xF2n l\u1EA1i th\xEC hy v\u1ECDng r\u1ED3i th\u1EA5t v\u1ECDng l\u1EB7p \u0111i l\u1EB7p l\u1EA1i. \u0110\u1EEBng h\u1EE9a n\u1EEFa \u2014 h\xE3y l\xE0m m\u1ED9t vi\u1EC7c c\u1EE5 th\u1EC3 trong 24 gi\u1EDD t\u1EDBi. G\u1ECDi \u0111i\u1EC7n, \u0111\u1EB7t l\u1ECBch, mua v\xE9. H\xE0nh \u0111\u1ED9ng nh\u1ECF nh\u01B0ng th\u1EADt s\u1EBD ph\xE1 v\u1EE1 v\xF2ng l\u1EB7p kh\u1EA9u hi\u1EC7u."
  } },
  { id: 2, emoji: "\u{1F319}", name: { zh: "\u5973\u796D\u53F8", en: "The High Priestess", es: "La Sacerdotisa", fr: "La Papesse", th: "\u0E19\u0E32\u0E07\u0E1E\u0E23\u0E32\u0E2B\u0E21\u0E13\u0E35", vi: "N\u1EEF \u0110\u1EA1i T\u01B0 T\u1EBF" }, meaning: {
    zh: "\u76F4\u89C9\u4E0E\u79D8\u5BC6\uFF0C\u7B49\u5F85\u63ED\u6653\u7684\u7B54\u6848\u3002\u8FD9\u5F20\u724C\u6697\u793A\u4F60\u7684\u611F\u60C5\u6B63\u5904\u4E8E\u4E00\u4E2A\u9700\u8981\u4FE1\u4EFB\u76F4\u89C9\u7684\u9636\u6BB5\u2014\u2014\u6709\u4E9B\u4E8B\u60C5\u5C1A\u672A\u663E\u73B0\uFF0C\u4F46\u7B54\u6848\u65E9\u5DF2\u5B58\u5728\u4E8E\u5185\u5FC3\u6DF1\u5904\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u9192\u4F60\u503E\u542C\u5185\u5FC3\u7684\u58F0\u97F3\uFF0C\u52FF\u88AB\u8868\u8C61\u6240\u8FF7\u60D1\uFF0C\u771F\u76F8\u9700\u8981\u65F6\u95F4\u6162\u6162\u6D6E\u51FA\u6C34\u9762\u3002\u5728\u4EB2\u5BC6\u5173\u7CFB\u4E2D\uFF0C\u6C89\u9ED8\u6709\u65F6\u6BD4\u5343\u8A00\u4E07\u8BED\u66F4\u80FD\u4F20\u9012\u7075\u9B42\u7684\u5BC6\u7801\u2014\u2014\u5B66\u4F1A\u5728\u672A\u77E5\u4E2D\u5B89\u7136\u7B49\u5F85\u3002",
    en: "Intuition and mystery \u2014 the answer waits to be revealed. This card suggests your relationship is in a phase that demands trust in intuition \u2014 not everything is visible yet, but the answer already lives deep within. Reversed, it reminds you to listen to your inner voice and not be deceived by appearances; truth surfaces in its own time. In intimacy, silence sometimes speaks louder than a thousand words \u2014 learn to rest in the unknown.",
    es: "Intuici\xF3n y misterio \u2014 la respuesta espera ser revelada. Esta carta sugiere que su relaci\xF3n est\xE1 en una fase que exige confianza en la intuici\xF3n \u2014 no todo es visible a\xFAn, pero la respuesta ya vive en lo profundo. Invertida, le recuerda escuchar su voz interior y no dejarse enga\xF1ar por las apariencias; la verdad aflora a su debido tiempo. En la intimidad, el silencio a veces habla m\xE1s que mil palabras \u2014 aprenda a descansar en lo desconocido.",
    fr: "Intuition et myst\xE8re \u2014 la r\xE9ponse attend d'\xEAtre r\xE9v\xE9l\xE9e. Cette carte sugg\xE8re que votre relation traverse une phase exigeant confiance en l'intuition \u2014 tout n'est pas encore visible, mais la r\xE9ponse habite d\xE9j\xE0 au plus profond. Invers\xE9, elle vous rappelle d'\xE9couter votre voix int\xE9rieure et de ne pas vous laisser tromper par les apparences ; la v\xE9rit\xE9 \xE9merge en son temps. Dans l'intimit\xE9, le silence parle parfois plus fort que mille mots \u2014 apprenez \xE0 vous reposer dans l'inconnu.",
    th: "\u0E2A\u0E31\u0E0D\u0E0A\u0E32\u0E15\u0E0D\u0E32\u0E13\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E25\u0E31\u0E1A \u2014 \u0E04\u0E33\u0E15\u0E2D\u0E1A\u0E23\u0E2D\u0E43\u0E2B\u0E49\u0E16\u0E39\u0E01\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E1C\u0E22 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08\u0E43\u0E19\u0E2A\u0E31\u0E0D\u0E0A\u0E32\u0E15\u0E0D\u0E32\u0E13 \u2014 \u0E22\u0E31\u0E07\u0E21\u0E35\u0E2A\u0E34\u0E48\u0E07\u0E21\u0E32\u0E01\u0E21\u0E32\u0E22\u0E17\u0E35\u0E48\u0E21\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E2B\u0E47\u0E19 \u0E41\u0E15\u0E48\u0E04\u0E33\u0E15\u0E2D\u0E1A\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E14\u0E27\u0E07\u0E43\u0E08\u0E25\u0E36\u0E01\u0E46 \u0E41\u0E25\u0E49\u0E27 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E43\u0E2B\u0E49\u0E1F\u0E31\u0E07\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19\u0E41\u0E25\u0E30\u0E2D\u0E22\u0E48\u0E32\u0E2B\u0E25\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E20\u0E32\u0E1E\u0E25\u0E27\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E08\u0E30\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E40\u0E2D\u0E07\u0E43\u0E19\u0E40\u0E27\u0E25\u0E32\u0E02\u0E2D\u0E07\u0E21\u0E31\u0E19 \u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E43\u0E01\u0E25\u0E49\u0E0A\u0E34\u0E14 \u0E04\u0E27\u0E32\u0E21\u0E40\u0E07\u0E35\u0E22\u0E1A\u0E1A\u0E32\u0E07\u0E04\u0E23\u0E31\u0E49\u0E07\u0E1E\u0E39\u0E14\u0E44\u0E14\u0E49\u0E14\u0E35\u0E01\u0E27\u0E48\u0E32\u0E1E\u0E31\u0E19\u0E04\u0E33 \u2014 \u0E08\u0E07\u0E40\u0E23\u0E35\u0E22\u0E19\u0E23\u0E39\u0E49\u0E17\u0E35\u0E48\u0E08\u0E30\u0E2D\u0E22\u0E39\u0E48\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2A\u0E07\u0E1A",
    vi: "Tr\u1EF1c gi\xE1c v\xE0 b\xED \u1EA9n \u2014 c\xE2u tr\u1EA3 l\u1EDDi \u0111ang ch\u1EDD \u0111\u01B0\u1EE3c b\u1EADt m\xED. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y cho th\u1EA5y m\u1ED1i quan h\u1EC7 \u0111ang \u1EDF giai \u0111o\u1EA1n c\u1EA7n s\u1EF1 th\u1EA5u hi\u1EC3u s\xE2u s\u1EAFc, \u0111\xF4i khi c\u1EA7n l\u1EAFng nghe tr\u1EF1c gi\xE1c thay v\xEC v\u1ED9i v\xE0ng k\u1EBFt lu\u1EADn. Nh\u1EEFng g\xEC ch\u01B0a l\u1ED9 di\u1EC7n kh\xF4ng ph\u1EA3i l\xE0 kh\xF4ng t\u1ED3n t\u1EA1i \u2014 c\xE2u tr\u1EA3 l\u1EDDi \u0111\xE3 an ngh\u1EC9 s\xE2u trong l\xF2ng b\u1EA1n t\u1EEB l\xE2u r\u1ED3i. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, s\u1EF1 thi\u1EBFu minh b\u1EA1ch \u0111ang len l\u1ECFi v\xE0o m\u1ED1i quan h\u1EC7 \u2014 m\u1ED9t b\xEAn c\u1ED1 t\xECnh gi\u1EA5u \u0111i suy ngh\u0129 th\u1EADt, b\xEAn kia th\xEC nghi ng\u1EDD nh\u01B0ng kh\xF4ng d\xE1m h\u1ECFi. B\u1EA1n c\u1EA3m th\u1EA5y c\xF3 \u0111i\u1EC1u g\xEC \u0111\xF3 kh\xF4ng \u1ED5n nh\u01B0ng kh\xF4ng th\u1EC3 g\u1ECDi t\xEAn, n\xEAn ch\u1ECDn im l\u1EB7ng. S\u1EF1 im l\u1EB7ng \u0111\xF3 \u0111ang bi\u1EBFn th\xE0nh kho\u1EA3ng c\xE1ch ng\xE0y c\xE0ng l\u1EDBn. Tu\u1EA7n n\xE0y, ch\u1ECDn m\u1ED9t ch\u1EE7 \u0111\u1EC1 nh\u1EA1y c\u1EA3m nh\u1EA5t m\xE0 c\u1EA3 hai t\u1EEBng l\u1EA3ng tr\xE1nh v\xE0 n\xF3i ra. Kh\xF4ng ph\u1EA3i \u0111\u1EC3 tranh lu\u1EADn, ch\u1EC9 \u0111\u1EC3 x\xE1c nh\u1EADn r\u1EB1ng n\xF3 t\u1ED3n t\u1EA1i."
  } },
  { id: 3, emoji: "\u{1F33A}", name: { zh: "\u5973\u7687", en: "The Empress", es: "La Emperatriz", fr: "L'Imp\xE9ratrice", th: "\u0E08\u0E31\u0E01\u0E23\u0E1E\u0E23\u0E23\u0E14\u0E34\u0E19\u0E35", vi: "N\u1EEF Ho\xE0ng" }, meaning: {
    zh: "\u4E30\u76DB\u4E0E\u6ECB\u517B\uFF0C\u7231\u7684\u6E29\u67D4\u7EFD\u653E\u3002\u5728\u611F\u60C5\u4E2D\uFF0C\u8FD9\u5F20\u724C\u8C61\u5F81\u7740\u88AB\u7231\u73AF\u7ED5\u3001\u5B89\u5168\u611F\u5341\u8DB3\u7684\u72B6\u6001\u2014\u2014\u4F60\u4EEC\u7684\u5173\u7CFB\u6B63\u5728\u7ECF\u5386\u4E00\u4E2A\u81EA\u7136\u7684\u751F\u957F\u4E0E\u7EFD\u653E\u9636\u6BB5\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u9192\u4F60\u5173\u6CE8\u81EA\u5DF1\u7684\u60C5\u611F\u9700\u6C42\uFF0C\u52FF\u5FD8\u81EA\u6211\u6ECB\u517B\uFF0C\u53EA\u6709\u5148\u5B66\u4F1A\u7231\u81EA\u5DF1\uFF0C\u624D\u80FD\u66F4\u597D\u5730\u7231\u5BF9\u65B9\u3002\u7231\u5982\u82B1\u56ED\uFF0C\u9700\u8981\u6089\u5FC3\u6D47\u704C\u624D\u80FD\u957F\u51FA\u4E0D\u51CB\u7684\u82B1\u2014\u2014\u4F60\u65E2\u662F\u88AB\u7231\u6D47\u704C\u7684\u90A3\u6735\uFF0C\u4E5F\u662F\u63E1\u7740\u6C34\u58F6\u7684\u56ED\u4E01\u3002",
    en: "Abundance and nurturing \u2014 love blooms gently. This card symbolizes being wrapped in love and safety \u2014 your relationship is going through a phase of natural growth and flowering. Reversed, it reminds you to tend to your own emotional needs first; only by loving yourself can you truly love another. Love is a garden \u2014 it needs patient tending to bloom without fading. You are both the flower being watered and the hand that holds the watering can.",
    es: "Abundancia y cuidado \u2014 el amor florece suavemente. Esta carta simboliza estar envuelto en amor y seguridad \u2014 su relaci\xF3n atraviesa una fase de crecimiento natural y florecimiento. Invertida, le recuerda atender sus propias necesidades emocionales primero; solo am\xE1ndose a s\xED mismo puede amar verdaderamente a otro. El amor es un jard\xEDn que necesita cuidados pacientes para florecer sin marchitarse. Usted es tanto la flor regada como la mano que sostiene la regadera.",
    fr: "Abondance et tendresse \u2014 l'amour fleurit doucement. Cette carte symbolise l'amour et la s\xE9curit\xE9 qui vous enveloppent \u2014 votre relation traverse une phase de croissance et d'\xE9panouissement naturels. Invers\xE9, elle vous rappelle de prendre soin de vos propres besoins \xE9motionnels ; on ne peut vraiment aimer l'autre qu'en s'aimant soi-m\xEAme. L'amour est un jardin qui demande des soins patients pour fleurir sans se faner. Vous \xEAtes \xE0 la fois la fleur arros\xE9e et la main qui tient l'arrosoir.",
    th: "\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E38\u0E14\u0E21\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E40\u0E2D\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E17\u0E23 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E40\u0E1A\u0E48\u0E07\u0E1A\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E2A\u0E37\u0E48\u0E2D\u0E16\u0E36\u0E07\u0E01\u0E32\u0E23\u0E44\u0E14\u0E49\u0E25\u0E49\u0E2D\u0E21\u0E23\u0E2D\u0E1A\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E1B\u0E25\u0E2D\u0E14\u0E20\u0E31\u0E22 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1C\u0E48\u0E32\u0E19\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E15\u0E34\u0E1A\u0E42\u0E15\u0E41\u0E25\u0E30\u0E40\u0E1A\u0E48\u0E07\u0E1A\u0E32\u0E19\u0E15\u0E32\u0E21\u0E18\u0E23\u0E23\u0E21\u0E0A\u0E32\u0E15\u0E34 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E38\u0E13\u0E14\u0E39\u0E41\u0E25\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E17\u0E32\u0E07\u0E2D\u0E32\u0E23\u0E21\u0E13\u0E4C\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E01\u0E48\u0E2D\u0E19 \u0E40\u0E1E\u0E23\u0E32\u0E30\u0E15\u0E49\u0E2D\u0E07\u0E23\u0E31\u0E01\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E08\u0E23\u0E34\u0E07\u0E46 \u0E08\u0E36\u0E07\u0E08\u0E30\u0E23\u0E31\u0E01\u0E04\u0E19\u0E2D\u0E37\u0E48\u0E19\u0E44\u0E14\u0E49\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E27\u0E19\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E14\u0E39\u0E41\u0E25\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E14\u0E17\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E1C\u0E25\u0E34\u0E1A\u0E32\u0E19\u0E44\u0E21\u0E48\u0E42\u0E17\u0E23\u0E21 \u0E04\u0E38\u0E13\u0E17\u0E31\u0E49\u0E07\u0E14\u0E2D\u0E01\u0E44\u0E21\u0E49\u0E17\u0E35\u0E48\u0E16\u0E39\u0E01\u0E23\u0E14\u0E19\u0E49\u0E33\u0E41\u0E25\u0E30\u0E21\u0E37\u0E2D\u0E17\u0E35\u0E48\u0E16\u0E37\u0E2D\u0E01\u0E23\u0E27\u0E22\u0E23\u0E14\u0E19\u0E49\u0E33",
    vi: "Ph\u1ED3n vinh v\xE0 nu\xF4i d\u01B0\u1EE1ng \u2014 t\xECnh y\xEAu n\u1EDF r\u1ED9 nh\u1EB9 nh\xE0ng. \u0110\xE2y l\xE0 th\u1EDDi k\u1EF3 m\xE0 m\u1ED1i quan h\u1EC7 \u0111\u01B0\u1EE3c nu\xF4i d\u01B0\u1EE1ng b\u1EDFi s\u1EF1 ch\u0103m s\xF3c v\xE0 y\xEAu th\u01B0\u01A1ng, c\u1EA3 hai ng\u01B0\u1EDDi \u0111\u1EC1u c\u1EA3m th\u1EA5y \u0111\u01B0\u1EE3c b\u1EA3o v\u1EC7 v\xE0 an to\xE0n b\xEAn nhau. T\xECnh y\xEAu \u0111ang t\u1EF1 nhi\xEAn l\u1EDBn l\xEAn v\xE0 b\u1EEBng n\u1EDF, nh\u01B0 m\u1ED9t khu v\u01B0\u1EDDn \u0111\u01B0\u1EE3c t\u01B0\u1EDBi m\xE1t b\u1EDFi s\u1EF1 t\u1EADn t\xE2m. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, m\u1ED9t b\xEAn \u0111ang c\u1EA1n ki\u1EC7t v\xEC cho qu\xE1 nhi\u1EC1u \u2014 hy sinh s\u1EDF th\xEDch, b\u1EA1n b\xE8, s\u1EE9c kh\u1ECFe \u0111\u1EC3 'vun \u0111\u1EAFp' cho t\xECnh y\xEAu, trong khi \u0111\u1ED1i ph\u01B0\u01A1ng xem \u0111\xF3 l\xE0 \u0111i\u1EC1u hi\u1EC3n nhi\xEAn. Ng\u01B0\u1EDDi cho nhi\u1EC1u \xE2m th\u1EA7m o\xE1n, ng\u01B0\u1EDDi nh\u1EADn nhi\u1EC1u v\xF4 t\xECnh coi th\u01B0\u1EDDng. C\xE2n b\u1EB1ng kh\xF4ng ph\u1EA3i chia \u0111\u1EC1u 50-50 m\u1ED7i ng\xE0y, m\xE0 l\xE0 ai \u0111ang c\u1EA7n g\xEC v\xE0o l\xFAc n\xE0y. Tu\u1EA7n t\u1EDBi, ng\u01B0\u1EDDi hay cho h\xE3y t\u1EADp n\xF3i 'kh\xF4ng' m\u1ED9t l\u1EA7n, ng\u01B0\u1EDDi hay nh\u1EADn h\xE3y ch\u1EE7 \u0111\u1ED9ng l\xE0m \u0111i\u1EC1u g\xEC \u0111\xF3 kh\xF4ng ai y\xEAu c\u1EA7u."
  } },
  { id: 4, emoji: "\u{1F451}", name: { zh: "\u7687\u5E1D", en: "The Emperor", es: "El Emperador", fr: "L'Empereur", th: "\u0E08\u0E31\u0E01\u0E23\u0E1E\u0E23\u0E23\u0E14\u0E34", vi: "Ho\xE0ng \u0110\u1EBF" }, meaning: {
    zh: "\u79E9\u5E8F\u4E0E\u5B88\u62A4\uFF0C\u7A33\u7A33\u6258\u4F4F\u7684\u529B\u91CF\u3002\u8FD9\u5F20\u724C\u5728\u611F\u60C5\u4E2D\u51FA\u73B0\uFF0C\u610F\u5473\u7740\u4F60\u4EEC\u7684\u5173\u7CFB\u9700\u8981\u4E00\u4EFD\u6C89\u7A33\u4E0E\u53EF\u9760\u2014\u2014\u5B83\u610F\u5473\u7740\u8D23\u4EFB\u3001\u8FB9\u754C\u4E0E\u53EF\u4F9D\u8D56\u7684\u627F\u8BFA\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u9192\u4F60\u68C0\u89C6\u5173\u7CFB\u4E2D\u662F\u5426\u6709\u63A7\u5236\u6B32\u8FC7\u5F3A\u6216\u7F3A\u4E4F\u6C9F\u901A\u7684\u95EE\u9898\uFF0C\u5065\u5EB7\u7684\u5173\u7CFB\u9700\u8981\u67D4\u8F6F\u4E0E\u575A\u5B9A\u5E76\u5B58\u3002\u7231\u4E0D\u662F\u7262\u7B3C\uFF0C\u800C\u662F\u57CE\u5821\u2014\u2014\u5B83\u63D0\u4F9B\u5E87\u62A4\u7684\u540C\u65F6\uFF0C\u4E5F\u5141\u8BB8\u5BF9\u65B9\u81EA\u7531\u5730\u547C\u5438\u3002",
    en: "Order and protection \u2014 a steady, grounding force. In love, this card signals the need for stability and reliability \u2014 responsibility, boundaries, and dependable commitment. Reversed, it urges you to examine whether control or poor communication is eroding the bond; a healthy relationship blends firmness with softness. Love is not a cage but a castle \u2014 it shelters while still allowing the other to breathe freely.",
    es: "Orden y protecci\xF3n \u2014 una fuerza firme y estable. En el amor, esta carta se\xF1ala la necesidad de estabilidad y fiabilidad \u2014 responsabilidad, l\xEDmites y compromiso confiable. Invertido, le insta a examinar si el control o la mala comunicaci\xF3n est\xE1 erosionando el v\xEDnculo; una relaci\xF3n sana mezcla firmeza con suavidad. El amor no es una jaula sino un castillo \u2014 resguarda mientras permite que el otro respire libremente.",
    fr: "Ordre et protection \u2014 une force stable et rassurante. En amour, cette carte signale le besoin de stabilit\xE9 et de fiabilit\xE9 \u2014 responsabilit\xE9, limites et engagement fiable. Invers\xE9, elle vous invite \xE0 examiner si le contr\xF4le ou la mauvaise communication \xE9rode le lien ; une relation saine allie fermet\xE9 et douceur. L'amour n'est pas une cage mais un ch\xE2teau \u2014 il abrite tout en laissant l'autre respirer librement.",
    th: "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E1A\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E1B\u0E01\u0E1B\u0E49\u0E2D\u0E07 \u2014 \u0E1E\u0E25\u0E31\u0E07\u0E17\u0E35\u0E48\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07 \u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E04\u0E27\u0E32\u0E21\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E41\u0E25\u0E30\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E16\u0E37\u0E2D\u0E44\u0E14\u0E49 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A \u0E02\u0E2D\u0E1A\u0E40\u0E02\u0E15 \u0E41\u0E25\u0E30\u0E02\u0E49\u0E2D\u0E21\u0E31\u0E48\u0E19\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E17\u0E35\u0E48\u0E19\u0E48\u0E32\u0E44\u0E27\u0E49\u0E27\u0E32\u0E07\u0E43\u0E08 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E01\u0E23\u0E30\u0E15\u0E38\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E04\u0E38\u0E13\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E27\u0E48\u0E32\u0E01\u0E32\u0E23\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E2A\u0E37\u0E48\u0E2D\u0E2A\u0E32\u0E23\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E14\u0E35\u0E01\u0E33\u0E25\u0E31\u0E07\u0E17\u0E33\u0E25\u0E32\u0E22\u0E2A\u0E32\u0E22\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E17\u0E35\u0E48\u0E14\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E1C\u0E2A\u0E21\u0E1C\u0E2A\u0E32\u0E19\u0E04\u0E27\u0E32\u0E21\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E23\u0E07\u0E40\u0E25\u0E47\u0E1A\u0E41\u0E15\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E1B\u0E23\u0E32\u0E2A\u0E32\u0E17 \u2014 \u0E21\u0E31\u0E19\u0E43\u0E2B\u0E49\u0E17\u0E35\u0E48\u0E2B\u0E25\u0E1A\u0E20\u0E31\u0E22\u0E43\u0E19\u0E02\u0E13\u0E30\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E04\u0E07\u0E43\u0E2B\u0E49\u0E2D\u0E35\u0E01\u0E1D\u0E48\u0E32\u0E22\u0E2B\u0E32\u0E22\u0E43\u0E08\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E2A\u0E23\u0E35",
    vi: "Tr\u1EADt t\u1EF1 v\xE0 b\u1EA3o v\u1EC7 \u2014 m\u1ED9t s\u1EE9c m\u1EA1nh v\u1EEFng ch\xE3i. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y nh\u1EAFc nh\u1EDF v\u1EC1 t\u1EA7m quan tr\u1ECDng c\u1EE7a s\u1EF1 \u1ED5n \u0111\u1ECBnh v\xE0 tin c\u1EADy, b\u1EA1n \u0111ang c\u1EA7n ho\u1EB7c \u0111ang x\xE2y d\u1EF1ng m\u1ED9t n\u1EC1n t\u1EA3ng v\u1EEFng ch\u1EAFc cho m\u1ED1i quan h\u1EC7 b\u1EB1ng tr\xE1ch nhi\u1EC7m, ranh gi\u1EDBi v\xE0 cam k\u1EBFt \u0111\xE1ng tin c\u1EADy. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, s\u1EF1 ki\u1EC3m so\xE1t \u0111ang m\u1EB7c \xE1o 'quan t\xE2m' \u2014 ki\u1EC3m tra \u0111i\u1EC7n tho\u1EA1i, ch\u1EA5t v\u1EA5n l\u1ECBch tr\xECnh, quy\u1EBFt \u0111\u1ECBnh thay \u0111\u1ED1i ph\u01B0\u01A1ng. Ng\u01B0\u1EDDi b\u1ECB ki\u1EC3m so\xE1t c\u1EA3m th\u1EA5y ng\u1EA1t th\u1EDF nh\u01B0ng kh\xF4ng d\xE1m ph\u1EA3n kh\xE1ng v\xEC s\u1EE3 b\u1ECB n\xF3i l\xE0 v\xF4 \u01A1n. N\u1EBFu b\u1EA1n \u0111ang ki\u1EC3m so\xE1t: h\xE3y \u0111\u1EB7t c\xE2u h\u1ECFi '\u0111i\u1EC1u t\xF4i s\u1EE3 nh\u1EA5t l\xE0 g\xEC?' r\u1ED3i n\xF3i th\u1EB3ng n\u1ED7i s\u1EE3 \u0111\xF3 thay v\xEC ki\u1EC3m tra. N\u1EBFu b\u1EA1n b\u1ECB ki\u1EC3m so\xE1t: h\xE3y n\xF3i 'anh/em c\u1EA7n kh\xF4ng gian' v\xE0 gi\u1EEF l\u1EDDi b\u1EB1ng c\xE1ch kh\xF4ng l\u1EA9n tr\xE1nh."
  } },
  { id: 5, emoji: "\u26EA", name: { zh: "\u6559\u7687", en: "The Hierophant", es: "El Sumo Sacerdote", fr: "Le Pape", th: "\u0E1B\u0E23\u0E30\u0E21\u0E38\u0E02\u0E2A\u0E07\u0E06\u0E4C", vi: "Gi\xE1o Ho\xE0ng" }, meaning: {
    zh: "\u6307\u5F15\u4E0E\u4FE1\u5FF5\uFF0C\u7075\u9B42\u5C42\u9762\u7684\u5951\u5408\u3002\u8FD9\u5F20\u724C\u6697\u793A\u4F60\u4EEC\u7684\u611F\u60C5\u5EFA\u7ACB\u5728\u5171\u540C\u7684\u4EF7\u503C\u89C2\u4E0E\u7CBE\u795E\u8FFD\u6C42\u4E4B\u4E0A\u2014\u2014\u8FD9\u662F\u8D85\u8D8A\u8868\u9762\u7684\u6DF1\u5C42\u8FDE\u63A5\uFF0C\u9700\u8981\u53CC\u65B9\u5171\u540C\u6210\u957F\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u9192\u4F60\u53CD\u601D\u662F\u5426\u6709\u76F2\u4ECE\u5916\u754C\u6807\u51C6\u800C\u5FFD\u89C6\u5185\u5FC3\u771F\u5B9E\u58F0\u97F3\u7684\u60C5\u51B5\uFF0C\u771F\u6B63\u7684\u5951\u5408\u6765\u81EA\u7075\u9B42\u800C\u975E\u5F62\u5F0F\u3002\u4E0D\u5FC5\u4E3A\u4E86\u8FCE\u5408\u4E16\u754C\u7684\u671F\u5F85\u800C\u9609\u5272\u7231\u60C5\u6700\u771F\u5B9E\u7684\u6A21\u6837\u2014\u2014\u4F60\u4EEC\u7684\u4FE1\u4EF0\u53EA\u5728\u4F60\u4EEC\u4E24\u4EBA\u4E4B\u95F4\u6709\u6548\u3002",
    en: "Guidance and faith \u2014 souls aligned on a deeper level. This card suggests your bond rests on shared values and spiritual pursuits \u2014 a connection beyond the surface that calls for mutual growth. Reversed, it asks you to question whether you're blindly following external standards instead of honoring your own truth; real alignment comes from the soul, not from convention. You don't need to shrink your love to fit the world's expectations \u2014 your faith only needs to make sense between the two of you.",
    es: "Gu\xEDa y fe \u2014 las almas se alinean en un nivel m\xE1s profundo. Esta carta sugiere que su v\xEDnculo descansa en valores compartidos y b\xFAsquedas espirituales \u2014 una conexi\xF3n m\xE1s all\xE1 de la superficie que exige crecimiento mutuo. Invertido, le pide que cuestione si est\xE1 siguiendo ciegamente est\xE1ndares externos en lugar de honrar su verdad; la alineaci\xF3n real viene del alma, no de la convenci\xF3n. No necesita encoger su amor para encajar en las expectativas del mundo \u2014 su fe solo necesita tener sentido entre los dos.",
    fr: "Guidance et foi \u2014 les \xE2mes s'alignent au plus profond. Cette carte sugg\xE8re que votre lien repose sur des valeurs partag\xE9es et des qu\xEAtes spirituelles \u2014 une connexion au-del\xE0 de la surface qui appelle une croissance mutuelle. Invers\xE9, il vous demande si vous suivez aveugl\xE9ment des normes ext\xE9rieures au lieu d'honorer votre v\xE9rit\xE9 ; l'alignement r\xE9el vient de l'\xE2me, pas de la convention. Vous n'avez pas besoin de r\xE9duire votre amour pour qu'il s'adapte aux attentes du monde \u2014 votre foi n'a de sens qu'entre vous deux.",
    th: "\u0E01\u0E32\u0E23\u0E0A\u0E35\u0E49\u0E19\u0E33\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E28\u0E23\u0E31\u0E17\u0E18\u0E32 \u2014 \u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E42\u0E22\u0E07\u0E01\u0E31\u0E19\u0E43\u0E19\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E25\u0E36\u0E01 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E39\u0E01\u0E1E\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E15\u0E31\u0E49\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E19\u0E04\u0E48\u0E32\u0E19\u0E34\u0E22\u0E21\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E41\u0E2A\u0E27\u0E07\u0E2B\u0E32\u0E17\u0E32\u0E07\u0E08\u0E34\u0E15\u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19 \u2014 \u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E42\u0E22\u0E07\u0E17\u0E35\u0E48\u0E25\u0E36\u0E01\u0E01\u0E27\u0E48\u0E32\u0E1C\u0E34\u0E27\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E41\u0E25\u0E30\u0E40\u0E23\u0E35\u0E22\u0E01\u0E23\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E40\u0E15\u0E34\u0E1A\u0E42\u0E15\u0E14\u0E49\u0E27\u0E22\u0E01\u0E31\u0E19 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E16\u0E32\u0E21\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E01\u0E33\u0E25\u0E31\u0E07\u0E1B\u0E34\u0E14\u0E15\u0E32\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E32\u0E21\u0E21\u0E32\u0E15\u0E23\u0E10\u0E32\u0E19\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01\u0E41\u0E17\u0E19\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E04\u0E32\u0E23\u0E1E\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E02\u0E2D\u0E07\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E2D\u0E14\u0E04\u0E25\u0E49\u0E2D\u0E07\u0E08\u0E23\u0E34\u0E07\u0E21\u0E32\u0E08\u0E32\u0E01\u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E08\u0E32\u0E01\u0E18\u0E23\u0E23\u0E21\u0E40\u0E19\u0E35\u0E22\u0E21 \u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E49\u0E2D\u0E07\u0E22\u0E48\u0E2D\u0E02\u0E19\u0E32\u0E14\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E40\u0E02\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E04\u0E32\u0E14\u0E2B\u0E27\u0E31\u0E07\u0E02\u0E2D\u0E07\u0E42\u0E25\u0E01 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E28\u0E23\u0E31\u0E17\u0E18\u0E32\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E21\u0E32\u0E22\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E2A\u0E2D\u0E07\u0E04\u0E19\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19",
    vi: "D\u1EABn d\u1EAFt v\xE0 ni\u1EC1m tin \u2014 t\xE2m h\u1ED3n k\u1EBFt n\u1ED1i \u1EDF t\u1EA7ng s\xE2u h\u01A1n. \u0110\xE2y l\xE0 l\xE1 b\xE0i v\u1EC1 s\u1EF1 k\u1EBFt n\u1ED1i t\xE2m linh v\xE0 gi\xE1 tr\u1ECB chung, m\u1ED1i quan h\u1EC7 x\xE2y d\u1EF1ng tr\xEAn n\u1EC1n t\u1EA3ng ni\u1EC1m tin v\xE0 m\u1EE5c \u0111\xEDch chung \u2014 m\u1ED9t s\u1EE3i d\xE2y li\xEAn k\u1EBFt v\u01B0\u1EE3t xa b\u1EC1 m\u1EB7t, \u0111\xF2i h\u1ECFi c\u1EA3 hai c\xF9ng tr\u01B0\u1EDFng th\xE0nh. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, b\u1EA1n \u0111ang y\xEAu theo k\u1ECBch b\u1EA3n c\u1EE7a ng\u01B0\u1EDDi kh\xE1c \u2014 \xE1p l\u1EF1c 'tu\u1ED5i n\xE0y ph\u1EA3i c\u01B0\u1EDBi', 'b\u1EB1ng b\u1EA1n b\u1EB1ng b\xE8', bi\u1EBFn m\u1ED1i quan h\u1EC7 th\xE0nh m\xE0n tr\xECnh di\u1EC5n cho gia \u0111\xECnh v\xE0 x\xE3 h\u1ED9i xem. C\u1EA3 hai di\u1EC5n vai '\u0111\xF4i ho\xE0n h\u1EA3o' trong khi kh\xF4ng ai d\xE1m th\u1EEBa nh\u1EADn m\xECnh kh\xF4ng h\u1EA1nh ph\xFAc. D\xE0nh m\u1ED9t ng\xE0y cu\u1ED1i tu\u1EA7n kh\xF4ng c\xF3 \u0111i\u1EC7n tho\u1EA1i, kh\xF4ng \u0111\u0103ng m\u1EA1ng x\xE3 h\u1ED9i \u2014 ch\u1EC9 hai ng\u01B0\u1EDDi v\xE0 c\xE2u h\u1ECFi: 'N\u1EBFu kh\xF4ng ai bi\u1EBFt, ch\xFAng ta s\u1EBD nh\u01B0 th\u1EBF n\xE0o?' Vi\u1EBFt c\xE2u tr\u1EA3 l\u1EDDi ra r\u1ED3i b\u1EAFt \u0111\u1EA7u s\u1ED1ng t\u1EEB c\xE2u tr\u1EA3 l\u1EDDi \u0111\xF3."
  } },
  { id: 6, emoji: "\u{1F495}", name: { zh: "\u604B\u4EBA", en: "The Lovers", es: "Los Enamorados", fr: "Les Amoureux", th: "\u0E04\u0E39\u0E48\u0E23\u0E31\u0E01", vi: "T\xECnh Nh\xE2n" }, meaning: {
    zh: "\u6289\u62E9\u4E0E\u8BF1\u60D1\uFF0C\u5173\u7CFB\u6765\u5230\u5341\u5B57\u8DEF\u53E3\u3002\u8FD9\u5F20\u724C\u76F4\u6307\u611F\u60C5\u4E2D\u6700\u5173\u952E\u7684\u9009\u62E9\u65F6\u523B\u2014\u2014\u5B83\u610F\u5473\u7740\u4F60\u6B63\u9762\u4E34\u4E00\u4E2A\u5C06\u6DF1\u523B\u5F71\u54CD\u5173\u7CFB\u8D70\u5411\u7684\u51B3\u7B56\uFF0C\u9700\u8981\u5FE0\u4E8E\u5185\u5FC3\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u9192\u4F60\u83AB\u56E0\u4E00\u65F6\u8BF1\u60D1\u504F\u79BB\u672C\u5FC3\uFF0C\u771F\u7231\u5F80\u5F80\u9700\u8981\u7A7F\u8D8A\u8FF7\u96FE\u624D\u80FD\u770B\u6E05\uFF0C\u5BF9\u8BDD\u4E0E\u8BDA\u5B9E\u662F\u6B64\u523B\u6700\u91CD\u8981\u7684\u529F\u8BFE\u3002\u771F\u6B63\u7684\u7231\u4E0D\u662F\u6CA1\u6709\u5C94\u8DEF\uFF0C\u800C\u662F\u5728\u6BCF\u4E2A\u5C94\u8DEF\u53E3\u90FD\u9009\u62E9\u4E86\u540C\u4E00\u4E2A\u65B9\u5411\u3002",
    en: "A crossroads of choice \u2014 your relationship faces a pivotal decision. This card points to the most critical moment in love \u2014 you are facing a choice that will deeply shape where the relationship goes, and it demands loyalty to your heart. Reversed, it warns against letting fleeting temptation pull you off course; true love often requires navigating through fog before becoming clear. Real love isn't about having no detours \u2014 it's about choosing the same direction at every crossroad.",
    es: "Una encrucijada de elecci\xF3n \u2014 su relaci\xF3n enfrenta una decisi\xF3n crucial. Esta carta se\xF1ala el momento m\xE1s cr\xEDtico del amor \u2014 usted enfrenta una elecci\xF3n que moldear\xE1 profundamente el rumbo de la relaci\xF3n, y exige lealtad al coraz\xF3n. Invertido, advierte contra dejarse desviar por tentaciones pasajeras; el amor verdadero a menudo requiere atravesar la niebla antes de volverse claro. El amor real no se trata de no tener desv\xEDos \u2014 se trata de elegir la misma direcci\xF3n en cada encrucijada.",
    fr: "Un carrefour de choix \u2014 votre relation fait face \xE0 une d\xE9cision cruciale. Cette carte d\xE9signe le moment le plus critique de l'amour \u2014 vous faites face \xE0 un choix qui fa\xE7onnera profond\xE9ment l'avenir de la relation, et il exige loyaut\xE9 envers votre c\u0153ur. Invers\xE9, il avertit contre les tentations passag\xE8res ; l'amour v\xE9ritable demande souvent de traverser le brouillard avant de devenir clair. Le v\xE9ritable amour ne consiste pas \xE0 \xE9viter les d\xE9tours \u2014 c'est choisir la m\xEAme direction \xE0 chaque carrefour.",
    th: "\u0E17\u0E32\u0E07\u0E41\u0E22\u0E01\u0E41\u0E2B\u0E48\u0E07\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E40\u0E1C\u0E0A\u0E34\u0E0D\u0E01\u0E32\u0E23\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E43\u0E08\u0E2A\u0E33\u0E04\u0E31\u0E0D \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E0A\u0E35\u0E49\u0E44\u0E1B\u0E22\u0E31\u0E07\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E2A\u0E33\u0E04\u0E31\u0E0D\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u2014 \u0E04\u0E38\u0E13\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E1C\u0E0A\u0E34\u0E0D\u0E01\u0E31\u0E1A\u0E17\u0E32\u0E07\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E35\u0E48\u0E08\u0E30\u0E02\u0E36\u0E49\u0E19\u0E23\u0E39\u0E1B\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E02\u0E2D\u0E07\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E36\u0E01\u0E0B\u0E36\u0E49\u0E07 \u0E41\u0E25\u0E30\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E04\u0E27\u0E32\u0E21\u0E20\u0E31\u0E01\u0E14\u0E35\u0E15\u0E48\u0E2D\u0E2B\u0E31\u0E27\u0E43\u0E08 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E27\u0E48\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E43\u0E2B\u0E49\u0E01\u0E32\u0E23\u0E25\u0E48\u0E2D\u0E25\u0E27\u0E07\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27\u0E2B\u0E25\u0E2D\u0E01\u0E25\u0E48\u0E2D\u0E04\u0E38\u0E13 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E41\u0E17\u0E49\u0E21\u0E31\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E1C\u0E48\u0E32\u0E19\u0E2B\u0E21\u0E2D\u0E01\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E30\u0E40\u0E2B\u0E47\u0E19\u0E0A\u0E31\u0E14 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E17\u0E35\u0E48\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E21\u0E35\u0E17\u0E32\u0E07\u0E41\u0E22\u0E01 \u2014 \u0E41\u0E15\u0E48\u0E04\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E16\u0E36\u0E07\u0E17\u0E32\u0E07\u0E41\u0E22\u0E01",
    vi: "Ng\xE3 t\u01B0 c\u1EE7a s\u1EF1 l\u1EF1a ch\u1ECDn \u2014 m\u1ED1i quan h\u1EC7 \u0111\u1ED1i m\u1EB7t v\u1EDBi quy\u1EBFt \u0111\u1ECBnh quan tr\u1ECDng. \u0110\xE2y l\xE0 kho\u1EA3nh kh\u1EAFc \u0111\u1EC3 nh\xECn s\xE2u v\xE0o b\u1EA3n ch\u1EA5t c\u1EE7a m\u1ED1i quan h\u1EC7 v\xE0 ch\u1ECDn con \u0111\u01B0\u1EDDng ph\xF9 h\u1EE3p nh\u1EA5t v\u1EDBi l\xF2ng m\xECnh. Vi\u1EC7c n\xE0y \u0111\xF2i h\u1ECFi s\u1EF1 trung th\u1EF1c tuy\u1EC7t \u0111\u1ED1i v\u1EDBi b\u1EA3n th\xE2n l\u1EABn \u0111\u1ED1i ph\u01B0\u01A1ng, b\u1EDFi quy\u1EBFt \u0111\u1ECBnh b\u1EA1n \u0111\u01B0a ra s\u1EBD \u0111\u1ECBnh h\xECnh to\xE0n b\u1ED9 t\u01B0\u01A1ng lai c\u1EE7a t\xECnh y\xEAu. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, m\u1ED9t b\xEAn \u0111ang l\u01B0\u1EE1ng l\u1EF1 ho\u1EB7c c\xF3 ng\u01B0\u1EDDi th\u1EE9 ba trong c\xE2u chuy\u1EC7n \u2014 t\xECnh c\u1EA3m b\u1ECB chia \u0111\u1EC1u gi\u1EEFa 'n\xEAn' v\xE0 'mu\u1ED1n', kh\xF4ng d\xE1m ch\u1ECDn ai v\xEC s\u1EE3 m\u1EA5t c\u1EA3 hai. K\u1EBB l\u01B0\u1EE1ng l\u1EF1 t\u1EF1 huy\u1EC5n ho\u1EB7c m\xECnh 'c\u1EA7n th\xEAm th\u1EDDi gian', ng\u01B0\u1EDDi b\u1ECB b\u1ECF r\u01A1i th\xEC t\u1EF1 h\u1ECFi m\xECnh sai \u1EDF \u0111\xE2u. H\xE3y \u0111\u1EB7t cho nhau m\u1ED9t deadline: 7 ng\xE0y, m\u1ED7i ng\u01B0\u1EDDi t\u1EF1 h\u1ECFi 'kh\xF4ng c\xF3 ng\u01B0\u1EDDi kia, t\xF4i c\xF3 \u1ED5n kh\xF4ng?' \u2014 n\u1EBFu c\xE2u tr\u1EA3 l\u1EDDi l\xE0 'c\xF3', h\xE3y \u0111\u1EE7 can \u0111\u1EA3m \u0111\u1EC3 n\xF3i l\u1EDDi chia tay r\xF5 r\xE0ng thay v\xEC k\xE9o d\xE0i d\xE0y v\xF2."
  } },
  { id: 7, emoji: "\u{1F3DB}\uFE0F", name: { zh: "\u6218\u8F66", en: "The Chariot", es: "El Carro", fr: "Le Chariot", th: "\u0E23\u0E16\u0E28\u0E36\u0E01", vi: "C\u1ED7 Xe Chi\u1EBFn Th\u1EAFng" }, meaning: {
    zh: "\u610F\u5FD7\u4E0E\u5F81\u670D\uFF0C\u643A\u624B\u8DE8\u8D8A\u969C\u788D\u3002\u8FD9\u5F20\u724C\u8C61\u5F81\u7740\u575A\u5B9A\u7684\u51B3\u5FC3\u4E0E\u80DC\u5229\u2014\u2014\u4F60\u4EEC\u7684\u611F\u60C5\u6B63\u7ECF\u5386\u4E00\u4E2A\u9700\u8981\u5171\u540C\u52AA\u529B\u8DE8\u8D8A\u6311\u6218\u7684\u9636\u6BB5\uFF0C\u552F\u6709\u540C\u821F\u5171\u6D4E\u65B9\u80FD\u62B5\u8FBE\u5F7C\u5CB8\u3002\u9006\u4F4D\u65F6\uFF0C\u6697\u793A\u53EF\u80FD\u5B58\u5728\u65B9\u5411\u4E0D\u4E00\u81F4\u6216\u52A8\u529B\u5206\u6563\u7684\u95EE\u9898\uFF0C\u6C9F\u901A\u5F7C\u6B64\u7684\u76EE\u6807\u4E0E\u613F\u666F\u662F\u7834\u89E3\u4E4B\u9053\u3002\u7231\u662F\u4E00\u573A\u5E76\u80A9\u7684\u8FDC\u5F81\uFF0C\u53EA\u6709\u5F53\u4E24\u5339\u9A6C\u671D\u7740\u540C\u4E00\u4E2A\u65B9\u5411\u5954\u8DD1\uFF0C\u6218\u8F66\u624D\u80FD\u771F\u6B63\u75BE\u9A70\u3002",
    en: "Willpower and triumph \u2014 overcoming obstacles together. This card symbolizes unwavering determination \u2014 your relationship is navigating a phase that demands mutual effort to overcome challenges; only rowing together will get you to the other shore. Reversed, it hints at diverging directions or scattered momentum; aligning your goals and visions through honest dialogue is the remedy. Love is a side-by-side expedition \u2014 the chariot only races forward when both horses run in the same direction.",
    es: "Fuerza de voluntad y triunfo \u2014 superando obst\xE1culos juntos. Esta carta simboliza una determinaci\xF3n inquebrantable \u2014 su relaci\xF3n atraviesa una fase que exige esfuerzo mutuo para superar desaf\xEDos; solo remando juntos llegar\xE1n a la otra orilla. Invertido, sugiere direcciones divergentes o impulso disperso; alinear sus metas y visiones mediante un di\xE1logo honesto es el remedio. El amor es una expedici\xF3n hombro con hombro \u2014 el carro solo avanza cuando ambos caballos corren en la misma direcci\xF3n.",
    fr: "Volont\xE9 et triomphe \u2014 surmonter les obstacles ensemble. Cette carte symbolise une d\xE9termination in\xE9branlable \u2014 votre relation traverse une phase qui exige un effort mutuel pour surmonter les d\xE9fis ; seule la navigation conjointe vous m\xE8nera \xE0 l'autre rive. Invers\xE9, il sugg\xE8re des directions divergentes ou un \xE9lan dispers\xE9 ; aligner vos objectifs et visions par un dialogue honn\xEAte est le rem\xE8de. L'amour est une exp\xE9dition c\xF4te \xE0 c\xF4te \u2014 le char n'avance que quand les deux chevaux courent dans la m\xEAme direction.",
    th: "\u0E1E\u0E25\u0E31\u0E07\u0E08\u0E34\u0E15\u0E41\u0E25\u0E30\u0E0A\u0E31\u0E22\u0E0A\u0E19\u0E30 \u2014 \u0E40\u0E2D\u0E32\u0E0A\u0E19\u0E30\u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E01\u0E31\u0E19 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E2A\u0E37\u0E48\u0E2D\u0E16\u0E36\u0E07\u0E04\u0E27\u0E32\u0E21\u0E15\u0E31\u0E49\u0E07\u0E43\u0E08\u0E2D\u0E31\u0E19\u0E44\u0E21\u0E48\u0E2A\u0E31\u0E48\u0E19\u0E04\u0E25\u0E2D\u0E19 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E1C\u0E0A\u0E34\u0E0D\u0E01\u0E31\u0E1A\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E0A\u0E49\u0E04\u0E27\u0E32\u0E21\u0E1E\u0E22\u0E32\u0E22\u0E32\u0E21\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E2D\u0E32\u0E0A\u0E19\u0E30\u0E2D\u0E38\u0E1B\u0E2A\u0E23\u0E23\u0E04 \u0E01\u0E32\u0E23\u0E1E\u0E32\u0E22\u0E40\u0E23\u0E37\u0E2D\u0E14\u0E49\u0E27\u0E22\u0E01\u0E31\u0E19\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19\u0E08\u0E30\u0E1E\u0E32\u0E04\u0E38\u0E13\u0E16\u0E36\u0E07\u0E1D\u0E31\u0E48\u0E07\u0E42\u0E25\u0E01\u0E2D\u0E35\u0E01\u0E14\u0E49\u0E32\u0E19 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E16\u0E36\u0E07\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E41\u0E15\u0E01\u0E15\u0E48\u0E32\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E41\u0E23\u0E07\u0E02\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E01\u0E23\u0E30\u0E08\u0E32\u0E22 \u0E01\u0E32\u0E23\u0E1B\u0E23\u0E31\u0E1A\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E40\u0E1B\u0E49\u0E32\u0E2B\u0E21\u0E32\u0E22\u0E41\u0E25\u0E30\u0E27\u0E34\u0E2A\u0E31\u0E22\u0E17\u0E31\u0E28\u0E19\u0E4C\u0E1C\u0E48\u0E32\u0E19\u0E01\u0E32\u0E23\u0E2A\u0E37\u0E48\u0E2D\u0E2A\u0E32\u0E23\u0E15\u0E23\u0E07\u0E46 \u0E04\u0E37\u0E2D\u0E17\u0E32\u0E07\u0E41\u0E01\u0E49 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E32\u0E23\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u0E40\u0E04\u0E35\u0E22\u0E07\u0E02\u0E49\u0E32\u0E07\u0E01\u0E31\u0E19 \u2014 \u0E23\u0E16\u0E28\u0E36\u0E01\u0E08\u0E30\u0E27\u0E34\u0E48\u0E07\u0E44\u0E1B\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E44\u0E14\u0E49\u0E01\u0E47\u0E15\u0E48\u0E2D\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E17\u0E31\u0E49\u0E07\u0E2A\u0E2D\u0E07\u0E21\u0E49\u0E32\u0E27\u0E34\u0E48\u0E07\u0E43\u0E19\u0E17\u0E34\u0E28\u0E17\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E01\u0E31\u0E19",
    vi: "\xDD ch\xED v\xE0 th\u1EAFng l\u1EE3i \u2014 v\u01B0\u1EE3t qua ch\u01B0\u1EDBng ng\u1EA1i c\xF9ng nhau. Trong t\xECnh y\xEAu, \u0111\xE2y l\xE0 l\xE1 b\xE0i c\u1EE7a s\u1EF1 quy\u1EBFt t\xE2m v\xE0 \xFD ch\xED v\u01B0\u1EE3t kh\xF3, m\u1ED1i quan h\u1EC7 \u0111ang \u0111i qua giai \u0111o\u1EA1n \u0111\xF2i h\u1ECFi n\u1ED7 l\u1EF1c song song \u0111\u1EC3 v\u01B0\u1EE3t qua th\u1EED th\xE1ch \u2014 ch\u1EC9 c\xF3 c\xF9ng ch\xE8o m\u1ED9t thuy\u1EC1n m\u1EDBi \u0111\u1EBFn \u0111\u01B0\u1EE3c b\u1EDD b\xEAn kia. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, hai ng\u01B0\u1EDDi \u0111ang k\xE9o nhau v\u1EC1 hai ph\xEDa \u2014 m\u1ED9t ng\u01B0\u1EDDi mu\u1ED1n \u1ED5n \u0111\u1ECBnh, m\u1ED9t ng\u01B0\u1EDDi mu\u1ED1n t\u1EF1 do. M\u1ED7i cu\u1ED9c c\xE3i v\xE3 \u0111\u1EC1u xoay quanh c\xF9ng m\u1ED9t v\u1EA5n \u0111\u1EC1 nh\u01B0ng kh\xF4ng ai ch\u1ECBu nh\u01B0\u1EE3ng b\u1ED9. S\u1EF1 ph\xE2n t\xE1n n\u0103ng l\u01B0\u1EE3ng \u0111ang l\xE0m c\u1EA3 hai ki\u1EC7t s\u1EE9c. Tu\u1EA7n n\xE0y, ng\u1ED3i xu\u1ED1ng v\u1EBD hai c\u1ED9t: 'm\u1EE5c ti\xEAu 1 n\u0103m c\u1EE7a anh/em'. So s\xE1nh, t\xECm ra 3 \u0111i\u1EC3m chung v\xE0 1 \u0111i\u1EC3m kh\xE1c bi\u1EC7t l\u1EDBn nh\u1EA5t. Th\u01B0\u01A1ng l\u01B0\u1EE3ng \u0111i\u1EC3m kh\xE1c bi\u1EC7t \u0111\xF3 b\u1EB1ng c\xE1ch m\u1ED7i ng\u01B0\u1EDDi nh\u01B0\u1EDDng m\u1ED9t b\u01B0\u1EDBc \u2014 kh\xF4ng ph\u1EA3i th\u1ECFa hi\u1EC7p n\u1EEDa v\u1EDDi, m\xE0 l\xE0 thi\u1EBFt k\u1EBF m\u1ED9t con \u0111\u01B0\u1EDDng th\u1EE9 ba m\xE0 c\u1EA3 hai ch\u01B0a t\u1EEBng ngh\u0129 t\u1EDBi."
  } },
  { id: 8, emoji: "\u{1F4AA}", name: { zh: "\u529B\u91CF", en: "The Strength", es: "La Fuerza", fr: "La Force", th: "\u0E1E\u0E25\u0E30\u0E01\u0E33\u0E25\u0E31\u0E07", vi: "S\u1EE9c M\u1EA1nh" }, meaning: {
    zh: "\u5185\u5728\u52C7\u6C14\uFF0C\u67D4\u97E7\u5374\u4E0D\u53EF\u6218\u80DC\u3002\u8FD9\u5F20\u724C\u5728\u611F\u60C5\u4E2D\u7684\u51FA\u73B0\uFF0C\u662F\u5BF9\u4F60\u5185\u5FC3\u529B\u91CF\u7684\u80AF\u5B9A\u2014\u2014\u771F\u6B63\u7684\u5F3A\u5927\u4E0D\u662F\u575A\u786C\u5982\u94C1\uFF0C\u800C\u662F\u4EE5\u6E29\u67D4\u4E0E\u8010\u5FC3\u5316\u89E3\u51B2\u7A81\u3001\u4EE5\u97E7\u6027\u5B88\u62A4\u5173\u7CFB\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u9192\u4F60\u53EF\u80FD\u5FFD\u7565\u4E86\u5185\u5728\u7684\u58F0\u97F3\u6216\u538B\u6291\u4E86\u771F\u5B9E\u611F\u53D7\uFF0C\u67D4\u5F31\u80DC\u521A\u5F3A\uFF0C\u5B66\u4F1A\u793A\u5F31\u662F\u4E00\u79CD\u66F4\u9AD8\u7684\u52C7\u6C14\u3002\u6700\u6DF1\u6C89\u7684\u7231\uFF0C\u4E0D\u662F\u6218\u80DC\u5BF9\u65B9\uFF0C\u800C\u662F\u9A6F\u670D\u81EA\u5DF1\u5FC3\u4E2D\u7684\u731B\u517D\u3002",
    en: "Inner courage \u2014 gentle yet invincible. When this card appears in love, it affirms your inner strength \u2014 true power isn't hardness, but dissolving conflicts with gentleness and patience, protecting the bond with resilience. Reversed, it suggests you may be ignoring your inner voice or suppressing real feelings; softness conquers hardness, and learning to be vulnerable is a higher form of courage. The deepest love is not about conquering the other \u2014 it is about taming the wild beast within yourself.",
    es: "Coraje interior \u2014 suave pero invencible. Cuando esta carta aparece en el amor, afirma tu fuerza interior \u2014 el verdadero poder no es la dureza, sino disolver conflictos con gentileza y paciencia, protegiendo el v\xEDnculo con resiliencia. Invertido, sugiere que puedes estar ignorando tu voz interior o suprimiendo sentimientos reales; la suavidad conquista la dureza, y aprender a ser vulnerable es una forma superior de coraje. El amor m\xE1s profundo no se trata de conquistar al otro \u2014 se trata de domar la bestia salvaje dentro de ti.",
    fr: "Courage int\xE9rieur \u2014 doux mais invincible. Quand cette carte appara\xEEt en amour, elle affirme votre force int\xE9rieure \u2014 le vrai pouvoir n'est pas la duret\xE9, mais dissoudre les conflits avec douceur et patience, prot\xE9geant le lien avec r\xE9silience. Invers\xE9, il sugg\xE8re que vous ignorez peut-\xEAtre votre voix int\xE9rieure ou refoulez vos sentiments ; la douceur conquiert la duret\xE9, et apprendre la vuln\xE9rabilit\xE9 est une forme sup\xE9rieure de courage. L'amour le plus profond ne consiste pas \xE0 conqu\xE9rir l'autre \u2014 il s'agit d'apprivoiser la b\xEAte sauvage en vous-m\xEAme.",
    th: "\u0E04\u0E27\u0E32\u0E21\u0E01\u0E25\u0E49\u0E32\u0E20\u0E32\u0E22\u0E43\u0E19 \u2014 \u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19\u0E41\u0E15\u0E48\u0E44\u0E23\u0E49\u0E1E\u0E48\u0E32\u0E22 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u0E21\u0E31\u0E19\u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E1E\u0E25\u0E31\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13 \u2014 \u0E1E\u0E25\u0E31\u0E07\u0E17\u0E35\u0E48\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E04\u0E27\u0E32\u0E21\u0E41\u0E02\u0E47\u0E07\u0E01\u0E23\u0E30\u0E14\u0E49\u0E32\u0E07 \u0E41\u0E15\u0E48\u0E04\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E25\u0E30\u0E25\u0E32\u0E22\u0E04\u0E27\u0E32\u0E21\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E14\u0E17\u0E19 \u0E1B\u0E01\u0E1B\u0E49\u0E2D\u0E07\u0E04\u0E27\u0E32\u0E21\u0E1C\u0E39\u0E01\u0E1E\u0E31\u0E19\u0E14\u0E49\u0E27\u0E22\u0E04\u0E27\u0E32\u0E21\u0E22\u0E37\u0E14\u0E2B\u0E22\u0E38\u0E48\u0E19 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E2D\u0E32\u0E08\u0E40\u0E1E\u0E34\u0E01\u0E40\u0E09\u0E22\u0E15\u0E48\u0E2D\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19\u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E14\u0E17\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E23\u0E39\u0E49\u0E2A\u0E36\u0E01\u0E08\u0E23\u0E34\u0E07 \u0E04\u0E27\u0E32\u0E21\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19\u0E40\u0E2D\u0E32\u0E0A\u0E19\u0E30\u0E04\u0E27\u0E32\u0E21\u0E41\u0E02\u0E47\u0E07\u0E01\u0E23\u0E30\u0E14\u0E49\u0E32\u0E07 \u0E01\u0E32\u0E23\u0E40\u0E23\u0E35\u0E22\u0E19\u0E23\u0E39\u0E49\u0E17\u0E35\u0E48\u0E08\u0E30\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E1C\u0E22\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E23\u0E32\u0E30\u0E1A\u0E32\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E27\u0E32\u0E21\u0E01\u0E25\u0E49\u0E32\u0E43\u0E19\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E2A\u0E39\u0E07\u0E01\u0E27\u0E48\u0E32 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E17\u0E35\u0E48\u0E25\u0E36\u0E01\u0E0B\u0E36\u0E49\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E32\u0E23\u0E40\u0E2D\u0E32\u0E0A\u0E19\u0E30\u0E2D\u0E35\u0E01\u0E1D\u0E48\u0E32\u0E22 \u2014 \u0E41\u0E15\u0E48\u0E04\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E1B\u0E23\u0E32\u0E1A\u0E2A\u0E31\u0E15\u0E27\u0E4C\u0E23\u0E49\u0E32\u0E22\u0E43\u0E19\u0E43\u0E08\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07",
    vi: "Can \u0111\u1EA3m b\xEAn trong \u2014 d\u1ECBu d\xE0ng nh\u01B0ng b\u1EA5t kh\u1EA3 chi\u1EBFn b\u1EA1i. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y kh\u1EB3ng \u0111\u1ECBnh s\u1EE9c m\u1EA1nh n\u1ED9i t\xE2m c\u1EE7a b\u1EA1n \u2014 quy\u1EC1n l\u1EF1c \u0111\xEDch th\u1EF1c kh\xF4ng ph\u1EA3i s\u1EF1 c\u1EE9ng r\u1EAFn, m\xE0 l\xE0 h\xF3a gi\u1EA3i xung \u0111\u1ED9t b\u1EB1ng s\u1EF1 d\u1ECBu d\xE0ng v\xE0 ki\xEAn nh\u1EABn, b\u1EA3o v\u1EC7 m\u1ED1i quan h\u1EC7 b\u1EB1ng s\u1EF1 ki\xEAn c\u01B0\u1EDDng. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, b\u1EA1n \u0111ang gi\u1EA3 v\u1EDD m\u1EA1nh m\u1EBD \u2014 c\u1ED1 t\u1ECF ra '\u1ED5n' khi th\u1EF1c ra t\u1ED5n th\u01B0\u01A1ng, nh\u1ECBn nh\u1EE5c \u0111\u1EBFn m\u1EE9c n\u1ED5 tung v\xEC nh\u1EEFng chuy\u1EC7n nh\u1ECF nh\u1EB7t. Nu\u1ED1t c\u1EA3m x\xFAc l\xE0 con dao hai l\u01B0\u1EE1i: b\u1EA1n t\u01B0\u1EDFng m\xECnh \u0111ang b\u1EA3o v\u1EC7 h\xF2a kh\xED, nh\u01B0ng th\u1EF1c ra \u0111ang t\xEDch l\u0169y thu\u1ED1c s\xFAng. L\u1EA7n t\u1EDBi khi c\u1EA3m th\u1EA5y mu\u1ED1n 'nu\u1ED1t xu\u1ED1ng', h\xE3y n\xF3i m\u1ED9t c\xE2u: 'Anh/em \u0111ang bu\u1ED3n, nh\u01B0ng ch\u01B0a bi\u1EBFt n\xEAn n\xF3i th\u1EBF n\xE0o.' \u2014 c\xE2u n\xF3i \u0111\xF3 kh\xF4ng c\u1EA7n ho\xE0n h\u1EA3o, ch\u1EC9 c\u1EA7n th\u1EADt."
  } },
  { id: 9, emoji: "\u{1F56F}\uFE0F", name: { zh: "\u9690\u58EB", en: "The Hermit", es: "El Ermita\xF1o", fr: "L'Ermite", th: "\u0E19\u0E31\u0E01\u0E1A\u0E27\u0E0A\u0E40\u0E23\u0E35\u0E48\u0E22\u0E21\u0E43\u0E08", vi: "\u1EA8n S\u0129" }, meaning: {
    zh: "\u72EC\u5904\u4E0E\u5185\u89C2\uFF0C\u7B54\u6848\u5728\u5185\u5FC3\u6DF1\u5904\u3002\u8FD9\u5F20\u724C\u5728\u611F\u60C5\u4E2D\u51FA\u73B0\uFF0C\u4E0D\u662F\u5206\u79BB\u7684\u5F81\u5146\uFF0C\u800C\u662F\u63D0\u9192\u4F60\u4EEC\u9700\u8981\u4E2A\u4EBA\u7A7A\u95F4\u53BB\u601D\u8003\u3001\u6210\u957F\u4E0E\u81EA\u6211\u6574\u5408\u2014\u2014\u771F\u6B63\u7684\u4EB2\u5BC6\u9700\u8981\u5148\u4E0E\u81EA\u6211\u548C\u89E3\u3002\u9006\u4F4D\u65F6\uFF0C\u6697\u793A\u53EF\u80FD\u8FC7\u5EA6\u5C01\u95ED\u6216\u9003\u907F\u5173\u7CFB\u4E2D\u7684\u95EE\u9898\uFF0C\u6709\u65F6\u72EC\u81EA\u884C\u8D70\u662F\u4E3A\u4E86\u66F4\u597D\u5730\u76F8\u9047\u3002\u72EC\u5904\u4E0D\u662F\u5B64\u72EC\uFF0C\u800C\u662F\u7075\u9B42\u4E0E\u81EA\u5DF1\u8C08\u5224\u7684\u5BC6\u5BA4\u2014\u2014\u8D70\u51FA\u90A3\u6247\u95E8\u65F6\uFF0C\u4F60\u5C06\u5E26\u7740\u66F4\u6E05\u6670\u7684\u81EA\u5DF1\u56DE\u5230\u7231\u4E2D\u3002",
    en: "Solitude and introspection \u2014 the answer lies within. In love, this card isn't a sign of separation, but a reminder that you need personal space to think, grow, and integrate \u2014 true intimacy requires making peace with yourself first. Reversed, it suggests you may be isolating too much or avoiding relationship issues; sometimes walking alone is the path to a better reunion. Solitude is not loneliness \u2014 it is the private chamber where the soul negotiates with itself. When you step out, you return to love with a clearer self.",
    es: "Soledad e introspecci\xF3n \u2014 la respuesta est\xE1 dentro. En el amor, esta carta no es se\xF1al de separaci\xF3n, sino un recordatorio de que necesitas espacio personal para pensar, crecer e integrarte \u2014 la verdadera intimidad requiere hacer las paces contigo mismo primero. Invertido, sugiere que puedes estar aisl\xE1ndote demasiado o evitando los problemas de la relaci\xF3n; a veces caminar solo es el camino hacia una mejor reuni\xF3n. La soledad no es loneliness \u2014 es la c\xE1mara privada donde el alma negocia consigo misma. Cuando salgas, volver\xE1s al amor con un yo m\xE1s claro.",
    fr: "Solitude et introspection \u2014 la r\xE9ponse est en vous. En amour, cette carte n'est pas un signe de s\xE9paration, mais un rappel que vous avez besoin d'espace personnel pour penser, grandir et vous int\xE9grer ; l'intimit\xE9 v\xE9ritable exige d'abord de faire la paix avec soi-m\xEAme. Invers\xE9, il sugg\xE8re que vous vous isolez trop ou fuyez les probl\xE8mes de la relation ; parfois marcher seul est le chemin vers de meilleures retrouvailles. La solitude n'est pas l'isolement \u2014 c'est la chambre priv\xE9e o\xF9 l'\xE2me n\xE9gocie avec elle-m\xEAme. Quand vous en sortirez, vous reviendrez \xE0 l'amour avec un soi plus clair.",
    th: "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E07\u0E35\u0E22\u0E1A\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E2A\u0E33\u0E23\u0E27\u0E08\u0E20\u0E32\u0E22\u0E43\u0E19 \u2014 \u0E04\u0E33\u0E15\u0E2D\u0E1A\u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E43\u0E08 \u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E02\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E41\u0E22\u0E01\u0E17\u0E32\u0E07 \u0E41\u0E15\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E01\u0E32\u0E23\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E1E\u0E37\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E04\u0E34\u0E14 \u0E40\u0E15\u0E34\u0E1A\u0E42\u0E15 \u0E41\u0E25\u0E30\u0E23\u0E27\u0E1A\u0E23\u0E27\u0E21\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E43\u0E01\u0E25\u0E49\u0E0A\u0E34\u0E14\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E01\u0E32\u0E23\u0E04\u0E37\u0E19\u0E14\u0E35\u0E01\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E01\u0E48\u0E2D\u0E19 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E2D\u0E32\u0E08\u0E1B\u0E34\u0E14\u0E15\u0E31\u0E27\u0E21\u0E32\u0E01\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B\u0E2B\u0E23\u0E37\u0E2D\u0E2B\u0E19\u0E35\u0E1B\u0E31\u0E0D\u0E2B\u0E32\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C \u0E1A\u0E32\u0E07\u0E04\u0E23\u0E31\u0E49\u0E07\u0E01\u0E32\u0E23\u0E40\u0E14\u0E34\u0E19\u0E04\u0E19\u0E40\u0E14\u0E35\u0E22\u0E27\u0E04\u0E37\u0E2D\u0E17\u0E32\u0E07\u0E2A\u0E39\u0E48\u0E01\u0E32\u0E23\u0E1E\u0E1A\u0E01\u0E31\u0E19\u0E17\u0E35\u0E48\u0E14\u0E35\u0E01\u0E27\u0E48\u0E32 \u0E04\u0E27\u0E32\u0E21\u0E40\u0E07\u0E35\u0E22\u0E1A\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E04\u0E27\u0E32\u0E21\u0E42\u0E14\u0E14\u0E40\u0E14\u0E35\u0E48\u0E22\u0E27 \u2014 \u0E41\u0E15\u0E48\u0E04\u0E37\u0E2D\u0E2B\u0E49\u0E2D\u0E07\u0E25\u0E31\u0E1A\u0E17\u0E35\u0E48\u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13\u0E40\u0E08\u0E23\u0E08\u0E32\u0E01\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E04\u0E38\u0E13\u0E40\u0E14\u0E34\u0E19\u0E2D\u0E2D\u0E01\u0E44\u0E1B \u0E04\u0E38\u0E13\u0E08\u0E30\u0E01\u0E25\u0E31\u0E1A\u0E21\u0E32\u0E2B\u0E32\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E14\u0E49\u0E27\u0E22\u0E15\u0E31\u0E27\u0E15\u0E19\u0E17\u0E35\u0E48\u0E0A\u0E31\u0E14\u0E40\u0E08\u0E19\u0E02\u0E36\u0E49\u0E19",
    vi: "C\xF4 \u0111\u01A1n v\xE0 n\u1ED9i quan \u2014 c\xE2u tr\u1EA3 l\u1EDDi n\u1EB1m \u1EDF s\xE2u b\xEAn trong. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y kh\xF4ng ph\u1EA3i \u0111i\u1EC1m b\xE1o chia ly, m\xE0 l\xE0 l\u1EDDi nh\u1EAFc b\u1EA1n c\u1EA7n kh\xF4ng gian ri\xEAng \u0111\u1EC3 suy ngh\u0129, tr\u01B0\u1EDFng th\xE0nh v\xE0 ch\u1EEFa l\xE0nh \u2014 s\u1EF1 g\u1EA7n g\u0169i \u0111\xEDch th\u1EF1c c\u1EA7n tr\u01B0\u1EDBc h\u1EBFt h\xF2a gi\u1EA3i v\u1EDBi ch\xEDnh m\xECnh. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, b\u1EA1n \u0111ang d\xF9ng 'c\u1EA7n kh\xF4ng gian ri\xEAng' \u0111\u1EC3 tr\u1ED1n tr\xE1nh \u0111\u1ED1i di\u1EC7n \u2014 im l\u1EB7ng k\xE9o d\xE0i, l\u1EA3ng tr\xE1nh ch\u1EE7 \u0111\u1EC1 kh\xF3, khi \u0111\u1ED1i ph\u01B0\u01A1ng c\u1ED1 g\u1EAFng ti\u1EBFp c\u1EADn th\xEC d\u1EF1ng t\u01B0\u1EDDng. Ng\u01B0\u1EDDi thu m\xECnh t\u01B0\u1EDFng \u0111ang b\u1EA3o v\u1EC7 b\u1EA3n th\xE2n, nh\u01B0ng th\u1EF1c ra \u0111ang b\u1ECF \u0111\xF3i m\u1ED1i quan h\u1EC7. N\u1EBFu b\u1EA1n \u0111ang tr\u1ED1n: h\xE3y t\u1EF1 h\u1ECFi '\u0111i\u1EC1u g\xEC t\xF4i s\u1EE3 nh\u1EA5t n\u1EBFu n\xF3i ra?', vi\u1EBFt n\xF3 ra gi\u1EA5y r\u1ED3i \u0111\u01B0a cho \u0111\u1ED1i ph\u01B0\u01A1ng \u0111\u1ECDc \u2014 kh\xF4ng c\u1EA7n gi\u1EA3i th\xEDch, ch\u1EC9 c\u1EA7n \u0111\u1EC3 h\u1ECD \u0111\u1ECDc. N\u1EBFu \u0111\u1ED1i ph\u01B0\u01A1ng \u0111ang tr\u1ED1n: \u0111\u1EEBng \u0111u\u1ED5i theo, h\xE3y \u0111\u1EB7t m\u1ED9t t\u1EDD gi\u1EA5y tr\u1EAFng l\xEAn b\xE0n v\xE0 n\xF3i 'khi n\xE0o s\u1EB5n s\xE0ng, h\xE3y vi\u1EBFt cho anh/em.'"
  } },
  { id: 10, emoji: "\u2638\uFE0F", name: { zh: "\u547D\u8FD0\u4E4B\u8F6E", en: "Wheel of Fortune", es: "Rueda de la Fortuna", fr: "Roue de Fortune", th: "\u0E27\u0E07\u0E25\u0E49\u0E2D\u0E41\u0E2B\u0E48\u0E07\u0E42\u0E0A\u0E04\u0E0A\u0E30\u0E15\u0E32", vi: "B\xE1nh Xe S\u1ED1 Ph\u1EADn" }, meaning: {
    zh: "\u8F6C\u53D8\u4E0E\u5FAA\u73AF\uFF0C\u547D\u8FD0\u6B63\u5728\u8F6C\u52A8\u3002\u8FD9\u5F20\u724C\u5E26\u6765\u5B87\u5B99\u7EA7\u7684\u4FE1\u606F\uFF1A\u4F60\u4EEC\u7684\u5173\u7CFB\u6B63\u5904\u4E8E\u4E00\u4E2A\u5173\u952E\u7684\u8F6C\u6298\u70B9\u4E0A\uFF0C\u8FC7\u53BB\u7684\u79EF\u7D2F\u6B63\u5728\u8F6C\u5316\u4E3A\u65B0\u7684\u53EF\u80FD\uFF0C\u5E78\u8FD0\u7684\u5929\u5E73\u6B63\u5728\u5411\u4F60\u4EEC\u503E\u659C\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u9192\u4F60\u4E0D\u8981\u6297\u62D2\u6539\u53D8\uFF0C\u547D\u8FD0\u4E4B\u8F6E\u4ECE\u4E0D\u540E\u9000\uFF0C\u63A5\u7EB3\u5B83\u624D\u80FD\u987A\u52BF\u800C\u4E3A\uFF0C\u4E58\u98CE\u7834\u6D6A\u3002\u547D\u8FD0\u4E0D\u504F\u7231\u4EFB\u4F55\u4EBA\uFF0C\u4F46\u5B83\u7737\u987E\u90A3\u4E9B\u613F\u610F\u5728\u65CB\u8F6C\u4E2D\u4FDD\u6301\u4FE1\u5FF5\u7684\u7075\u9B42\u3002",
    en: "Transformation and cycles \u2014 destiny is turning in your favor. This card carries a cosmic message: your relationship is at a pivotal turning point, past efforts are transforming into new possibilities, and fortune's scales are tipping your way. Reversed, it reminds you not to resist change; the wheel of fortune never moves backward, and only by embracing it can you ride the current. Destiny favors no one \u2014 but it smiles on souls who keep faith while the wheel spins.",
    es: "Transformaci\xF3n y ciclos \u2014 el destino gira a su favor. Esta carta trae un mensaje c\xF3smico: su relaci\xF3n est\xE1 en un punto de inflexi\xF3n, los esfuerzos pasados se transforman en nuevas posibilidades, y la balanza de la fortuna se inclina hacia ustedes. Invertido, le recuerda no resistir al cambio; la rueda de la fortuna nunca retrocede, y solo abraz\xE1ndola podr\xE1 navegar la corriente. El destino no favorece a nadie \u2014 pero sonr\xEDe a las almas que mantienen la fe mientras la rueda gira.",
    fr: "Transformation et cycles \u2014 le destin tourne en votre faveur. Cette carte porte un message cosmique : votre relation est \xE0 un tournant d\xE9cisif, les efforts pass\xE9s se transforment en nouvelles possibilit\xE9s, et la balance de la fortune penche en votre faveur. Invers\xE9, il vous rappelle de ne pas r\xE9sister au changement ; la roue de la fortune ne recule jamais, et ce n'est qu'en l'embrassant que vous pourrez surfer sur le courant. Le destin ne favorise personne \u2014 mais il sourit aux \xE2mes qui gardent la foi pendant que la roue tourne.",
    th: "\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E41\u0E25\u0E30\u0E27\u0E31\u0E0F\u0E08\u0E31\u0E01\u0E23 \u2014 \u0E42\u0E0A\u0E04\u0E0A\u0E30\u0E15\u0E32\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2B\u0E21\u0E38\u0E19\u0E40\u0E02\u0E49\u0E32\u0E21\u0E32 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E19\u0E33\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E08\u0E32\u0E01\u0E08\u0E31\u0E01\u0E23\u0E27\u0E32\u0E25: \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E39\u0E48\u0E17\u0E35\u0E48\u0E08\u0E38\u0E14\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E2A\u0E33\u0E04\u0E31\u0E0D \u0E04\u0E27\u0E32\u0E21\u0E1E\u0E22\u0E32\u0E22\u0E32\u0E21\u0E43\u0E19\u0E2D\u0E14\u0E35\u0E15\u0E01\u0E33\u0E25\u0E31\u0E07\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E42\u0E2D\u0E01\u0E32\u0E2A\u0E43\u0E2B\u0E21\u0E48 \u0E41\u0E25\u0E30\u0E15\u0E32\u0E0A\u0E31\u0E48\u0E07\u0E41\u0E2B\u0E48\u0E07\u0E42\u0E0A\u0E04\u0E0A\u0E30\u0E15\u0E32\u0E40\u0E2D\u0E19\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E32\u0E04\u0E38\u0E13 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E27\u0E48\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E15\u0E48\u0E2D\u0E15\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07 \u0E27\u0E07\u0E25\u0E49\u0E2D\u0E41\u0E2B\u0E48\u0E07\u0E42\u0E0A\u0E04\u0E0A\u0E30\u0E15\u0E32\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E16\u0E2D\u0E22\u0E2B\u0E25\u0E31\u0E07 \u0E01\u0E32\u0E23\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E21\u0E31\u0E19\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19\u0E08\u0E30\u0E1E\u0E32\u0E04\u0E38\u0E13\u0E44\u0E1B\u0E01\u0E31\u0E1A\u0E01\u0E23\u0E30\u0E41\u0E2A \u0E42\u0E0A\u0E04\u0E0A\u0E30\u0E15\u0E32\u0E44\u0E21\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E02\u0E49\u0E32\u0E07\u0E43\u0E04\u0E23 \u2014 \u0E41\u0E15\u0E48\u0E21\u0E31\u0E19\u0E22\u0E34\u0E49\u0E21\u0E43\u0E2B\u0E49\u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E43\u0E19\u0E02\u0E13\u0E30\u0E17\u0E35\u0E48\u0E27\u0E07\u0E25\u0E49\u0E2D\u0E2B\u0E21\u0E38\u0E19",
    vi: "Bi\u1EBFn \u0111\u1ED5i v\xE0 chu k\u1EF3 \u2014 v\u1EADn m\u1EC7nh \u0111ang xoay chuy\u1EC3n \u0111\u1EBFn v\u1EDBi b\u1EA1n. L\xE1 b\xE0i n\xE0y mang th\xF4ng \u0111i\u1EC7p v\u0169 tr\u1EE5: m\u1ED1i quan h\u1EC7 \u0111ang \u1EDF b\u01B0\u1EDBc ngo\u1EB7t quan tr\u1ECDng, nh\u1EEFng n\u1ED7 l\u1EF1c qu\xE1 kh\u1EE9 \u0111ang bi\u1EBFn th\xE0nh kh\u1EA3 n\u0103ng m\u1EDBi, c\xE1n c\xE2n may m\u1EAFn \u0111ang nghi\xEAng v\u1EC1 ph\xEDa b\u1EA1n. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, b\u1EA1n \u0111ang c\u1ED1 n\xEDu k\xE9o m\u1ED9t \u0111i\u1EC1u \u0111\xE3 qua \u2014 gi\u1EEF l\u1EA1i th\xF3i quen c\u0169, k\u1EF7 ni\u1EC7m c\u0169, m\u1ED9t phi\xEAn b\u1EA3n c\u1EE7a \u0111\u1ED1i ph\u01B0\u01A1ng kh\xF4ng c\xF2n t\u1ED3n t\u1EA1i. C\u1ED1 g\u1EAFng gi\u1EEF nguy\xEAn tr\u1EA1ng th\xE1i ch\u1EC9 khi\u1EBFn m\u1ECDi th\u1EE9 tr\u1EDF n\xEAn t\u1ED3i t\u1EC7 h\u01A1n, gi\u1ED1ng nh\u01B0 c\u1ED1 ng\u0103n m\u1ED9t d\xF2ng s\xF4ng. H\xE3y ch\u1EA5p nh\u1EADn b\u1EB1ng h\xE0nh \u0111\u1ED9ng: ch\u1ECDn m\u1ED9t th\xF3i quen trong m\u1ED1i quan h\u1EC7 \u0111\xE3 tr\u1EDF n\xEAn nh\xE0m ch\xE1n v\xE0 thay \u0111\u1ED5i n\xF3. Thay v\xEC xem phim t\u1ED1i th\u1EE9 b\u1EA3y, h\xE3y \u0111i m\u1ED9t n\u01A1i ch\u01B0a t\u1EEBng \u0111\u1EBFn. L\xE0m m\u1EDBi nh\u1ECBp \u0111i\u1EC7u \u0111\u1EC3 b\u1EAFt k\u1ECBp v\xF2ng quay c\u1EE7a v\u1EADn m\u1EC7nh."
  } },
  { id: 11, emoji: "\u2696\uFE0F", name: { zh: "\u6B63\u4E49", en: "Justice", es: "La Justicia", fr: "La Justice", th: "\u0E04\u0E27\u0E32\u0E21\u0E22\u0E38\u0E15\u0E34\u0E18\u0E23\u0E23\u0E21", vi: "C\xF4ng L\xFD" }, meaning: {
    zh: "\u56E0\u679C\u4E0E\u5E73\u8861\uFF0C\u5B87\u5B99\u5728\u7CBE\u51C6\u56DE\u5E94\u3002\u8FD9\u5F20\u724C\u51FA\u73B0\u4E8E\u611F\u60C5\u4E2D\uFF0C\u662F\u5BF9\u4F60\u4EEC\u5173\u7CFB\u516C\u6B63\u6027\u7684\u5BA1\u89C6\u2014\u2014\u6BCF\u4E00\u4E2A\u9009\u62E9\u90FD\u6709\u56DE\u54CD\uFF0C\u4F60\u7684\u4ED8\u51FA\u4E0E\u6536\u83B7\u7EC8\u5C06\u8D8B\u4E8E\u5E73\u8861\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u793A\u4F60\u9700\u8981\u8BDA\u5B9E\u5730\u5BA1\u89C6\u5173\u7CFB\u4E2D\u662F\u5426\u5B58\u5728\u5931\u8861\u4E4B\u5904\uFF0C\u552F\u6709\u57FA\u4E8E\u771F\u76F8\u7684\u548C\u89E3\u624D\u80FD\u5E26\u6765\u6301\u4E45\u7684\u5B89\u5B81\u3002\u6B63\u4E49\u4E0D\u662F\u51B0\u51B7\u7684\u88C1\u51B3\uFF0C\u800C\u662F\u5B87\u5B99\u5728\u95EE\u4F60\uFF1A\u4F60\u662F\u5426\u613F\u610F\u5BF9\u771F\u76F8\u8D1F\u8D23\uFF1F",
    en: "Cause and balance \u2014 the universe responds with precision. In love, this card calls for an honest audit of your relationship \u2014 every choice has an echo, and what you give and receive will eventually find equilibrium. Reversed, it urges you to examine whether imbalance lives within the bond; only reconciliation grounded in truth can bring lasting peace. Justice is not cold verdict \u2014 it is the universe asking: are you willing to be accountable to the truth?",
    es: "Causa y equilibrio \u2014 el universo responde con precisi\xF3n. En el amor, esta carta pide una auditor\xEDa honesta de su relaci\xF3n \u2014 cada elecci\xF3n tiene un eco, y lo que dan y reciben eventualmente encontrar\xE1 equilibrio. Invertido, le insta a examinar si hay desequilibrio en el v\xEDnculo; solo la reconciliaci\xF3n basada en la verdad puede traer paz duradera. La justicia no es un veredicto fr\xEDo \u2014 es el universo preguntando: \xBFest\xE1s dispuesto a ser responsable ante la verdad?",
    fr: "Cause et \xE9quilibre \u2014 l'univers r\xE9pond avec pr\xE9cision. En amour, cette carte demande un audit honn\xEAte de votre relation \u2014 chaque choix a un \xE9cho, et ce que vous donnez et recevez finira par trouver son \xE9quilibre. Invers\xE9, il vous invite \xE0 examiner si un d\xE9s\xE9quilibre habite le lien ; seule la r\xE9conciliation fond\xE9e sur la v\xE9rit\xE9 peut apporter une paix durable. La justice n'est pas un verdict froid \u2014 c'est l'univers qui demande : \xEAtes-vous pr\xEAt \xE0 r\xE9pondre de la v\xE9rit\xE9 ?",
    th: "\u0E40\u0E2B\u0E15\u0E38\u0E41\u0E25\u0E30\u0E2A\u0E21\u0E14\u0E38\u0E25 \u2014 \u0E08\u0E31\u0E01\u0E23\u0E27\u0E32\u0E25\u0E15\u0E2D\u0E1A\u0E2A\u0E19\u0E2D\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E41\u0E21\u0E48\u0E19\u0E22\u0E33 \u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E40\u0E23\u0E35\u0E22\u0E01\u0E23\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E0B\u0E37\u0E48\u0E2D\u0E2A\u0E31\u0E15\u0E22\u0E4C \u2014 \u0E17\u0E38\u0E01\u0E01\u0E32\u0E23\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E21\u0E35\u0E40\u0E2A\u0E35\u0E22\u0E07\u0E2A\u0E30\u0E17\u0E49\u0E2D\u0E19 \u0E2A\u0E34\u0E48\u0E07\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E30\u0E23\u0E31\u0E1A\u0E08\u0E30\u0E1E\u0E1A\u0E08\u0E38\u0E14\u0E2A\u0E21\u0E14\u0E38\u0E25\u0E43\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E01\u0E23\u0E30\u0E15\u0E38\u0E49\u0E19\u0E43\u0E2B\u0E49\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E27\u0E48\u0E32\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E44\u0E21\u0E48\u0E2A\u0E21\u0E14\u0E38\u0E25\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48 \u0E04\u0E27\u0E32\u0E21\u0E1B\u0E23\u0E2D\u0E07\u0E14\u0E2D\u0E07\u0E17\u0E35\u0E48\u0E15\u0E31\u0E49\u0E07\u0E2D\u0E22\u0E39\u0E48\u0E1A\u0E19\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19\u0E08\u0E30\u0E19\u0E33\u0E2A\u0E31\u0E19\u0E15\u0E34\u0E21\u0E32\u0E44\u0E14\u0E49 \u0E04\u0E27\u0E32\u0E21\u0E22\u0E38\u0E15\u0E34\u0E18\u0E23\u0E23\u0E21\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E04\u0E33\u0E15\u0E31\u0E14\u0E2A\u0E34\u0E19\u0E17\u0E35\u0E48\u0E40\u0E22\u0E47\u0E19\u0E0A\u0E32 \u2014 \u0E41\u0E15\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E31\u0E01\u0E23\u0E27\u0E32\u0E25\u0E17\u0E35\u0E48\u0E16\u0E32\u0E21\u0E27\u0E48\u0E32: \u0E04\u0E38\u0E13\u0E22\u0E34\u0E19\u0E14\u0E35\u0E23\u0E31\u0E1A\u0E1C\u0E34\u0E14\u0E0A\u0E2D\u0E1A\u0E15\u0E48\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48",
    vi: "Nh\xE2n qu\u1EA3 v\xE0 c\xE2n b\u1EB1ng \u2014 v\u0169 tr\u1EE5 \u0111\xE1p tr\u1EA3 ch\xEDnh x\xE1c. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y k\xEAu g\u1ECDi m\u1ED9t cu\u1ED9c ki\u1EC3m to\xE1n trung th\u1EF1c v\u1EC1 m\u1ED1i quan h\u1EC7 \u2014 m\u1ECDi l\u1EF1a ch\u1ECDn \u0111\u1EC1u c\xF3 h\u1ED3i \xE2m, nh\u1EEFng g\xEC b\u1EA1n cho v\xE0 nh\u1EADn s\u1EBD t\xECm \u0111\u01B0\u1EE3c c\xE2n b\u1EB1ng. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, s\u1EF1 thi\u1EBFu c\xF4ng b\u1EB1ng \u0111ang \xE2m th\u1EA7m h\u1EE7y ho\u1EA1i n\u1EC1n t\u1EA3ng \u2014 m\u1ED9t b\xEAn lu\xF4n nh\u01B0\u1EDDng nh\u1ECBn, m\u1ED9t b\xEAn lu\xF4n th\u1EAFng. Ng\u01B0\u1EDDi thi\u1EC7t th\xF2i \u0111ang t\xEDch l\u0169y s\u1EF1 o\xE1n gi\u1EADn d\u01B0\u1EDBi l\u1EDBp m\u1EB7t n\u1EA1 'hy sinh v\xEC t\xECnh y\xEAu'. B\u1EC1 ngo\xE0i \xEAm \u0111\u1EB9p, b\xEAn trong b\u1EA5t m\xE3n. L\u1EA7n t\u1EDBi khi c\xF3 b\u1EA5t \u0111\u1ED3ng, \u0111\u1EEBng gi\u1EA3i quy\u1EBFt v\u1ED9i. H\xE3y ghi \xE2m l\u1EA1i (c\u1EA3 hai \u0111\u1ED3ng \xFD tr\u01B0\u1EDBc) cu\u1ED9c n\xF3i chuy\u1EC7n \u2014 r\u1ED3i c\xF9ng nghe l\u1EA1i. \u0110\u1EBFm ai n\xF3i nhi\u1EC1u h\u01A1n, ai c\u1EAFt l\u1EDDi ai, ai lu\xF4n c\xF3 ti\u1EBFng n\xF3i cu\u1ED1i c\xF9ng. Nh\xECn v\xE0o s\u1EF1 th\u1EADt \u0111\xF3 \u0111\u1EC3 \u0111i\u1EC1u ch\u1EC9nh."
  } },
  { id: 12, emoji: "\u{1F643}", name: { zh: "\u5012\u540A\u4EBA", en: "The Hanged Man", es: "El Colgado", fr: "Le Pendu", th: "\u0E04\u0E19\u0E41\u0E02\u0E27\u0E19\u0E2B\u0E31\u0E27", vi: "K\u1EBB Treo Ng\u01B0\u1EE3c" }, meaning: {
    zh: "\u653E\u4E0B\u4E0E\u81E3\u670D\uFF0C\u53E6\u4E00\u79CD\u89C6\u89D2\u7684\u667A\u6167\u3002\u8FD9\u5F20\u724C\u7684\u51FA\u73B0\uFF0C\u662F\u4F60\u4E0E\u5173\u7CFB\u90FD\u9700\u8981\u6362\u4E00\u79CD\u773C\u5149\u5BA1\u89C6\u7684\u65F6\u523B\u2014\u2014\u6709\u65F6\u5019\u6682\u505C\u4E0E\u81E3\u670D\uFF0C\u6BD4\u5F3A\u884C\u63A8\u8FDB\u66F4\u80FD\u5E26\u6765\u7A81\u7834\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u9192\u4F60\u53EF\u80FD\u8FC7\u4E8E\u6267\u7740\u4E8E\u67D0\u4E2A\u7ED3\u679C\uFF0C\u5B66\u4F1A\u653E\u4E0B\u6267\u5FF5\uFF0C\u53CD\u800C\u80FD\u8BA9\u7B54\u6848\u81EA\u52A8\u6D6E\u73B0\u3002\u60AC\u6302\u4E0D\u662F\u60E9\u7F5A\uFF0C\u800C\u662F\u5B87\u5B99\u5728\u4E3A\u4F60\u91CD\u88C5\u89C6\u89D2\u2014\u2014\u5F53\u4F60\u91CD\u65B0\u7AD9\u8D77\uFF0C\u4E16\u754C\u5DF2\u4E0D\u518D\u662F\u65E7\u65F6\u7684\u6A21\u6837\u3002",
    en: "Surrender and release \u2014 wisdom from a different perspective. This card signals a moment when you and your relationship need new eyes \u2014 sometimes pausing and surrendering brings more breakthrough than pushing forward. Reversed, it warns you may be clinging too tightly to a desired outcome; letting go of fixation allows the answer to surface on its own. Suspension is not punishment \u2014 it is the universe recalibrating your vision. When you rise again, the world will not look the same.",
    es: "Rendici\xF3n y liberaci\xF3n \u2014 sabidur\xEDa desde otra perspectiva. Esta carta se\xF1ala un momento en que usted y su relaci\xF3n necesitan nuevos ojos \u2014 a veces pausar y rendirse trae m\xE1s avance que empujar hacia adelante. Invertido, advierte que puede estar aferr\xE1ndose demasiado a un resultado deseado; soltar la fijaci\xF3n permite que la respuesta surja por s\xED sola. La suspensi\xF3n no es castigo \u2014 es el universo recalibrando su visi\xF3n. Cuando se levante de nuevo, el mundo no se ver\xE1 igual.",
    fr: "L\xE2cher-prise et abandon \u2014 sagesse d'une autre perspective. Cette carte signale un moment o\xF9 vous et votre relation avez besoin d'un regard neuf \u2014 parfois s'arr\xEAter et s'abandonner apporte plus de perc\xE9e que d'avancer de force. Invers\xE9, il avertit que vous vous accrochez trop \xE0 un r\xE9sultat escompt\xE9 ; l\xE2cher l'obsession permet \xE0 la r\xE9ponse d'\xE9merger d'elle-m\xEAme. La suspension n'est pas un ch\xE2timent \u2014 c'est l'univers qui recalibre votre vision. Quand vous vous rel\xE8verez, le monde n'aura plus la m\xEAme apparence.",
    th: "\u0E01\u0E32\u0E23\u0E22\u0E2D\u0E21\u0E41\u0E1E\u0E49\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E27\u0E32\u0E07 \u2014 \u0E20\u0E39\u0E21\u0E34\u0E1B\u0E31\u0E0D\u0E0D\u0E32\u0E08\u0E32\u0E01\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07\u0E43\u0E2B\u0E21\u0E48 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E15\u0E49\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E2A\u0E32\u0E22\u0E15\u0E32\u0E43\u0E2B\u0E21\u0E48 \u2014 \u0E1A\u0E32\u0E07\u0E04\u0E23\u0E31\u0E49\u0E07\u0E01\u0E32\u0E23\u0E2B\u0E22\u0E38\u0E14\u0E41\u0E25\u0E30\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E19\u0E33\u0E21\u0E32\u0E0B\u0E36\u0E48\u0E07\u0E04\u0E27\u0E32\u0E21\u0E01\u0E49\u0E32\u0E27\u0E2B\u0E19\u0E49\u0E32\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32\u0E01\u0E32\u0E23\u0E14\u0E31\u0E19\u0E15\u0E48\u0E2D\u0E44\u0E1B \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E2D\u0E32\u0E08\u0E22\u0E36\u0E14\u0E15\u0E34\u0E14\u0E01\u0E31\u0E1A\u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C\u0E21\u0E32\u0E01\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B \u0E01\u0E32\u0E23\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E27\u0E32\u0E07\u0E08\u0E30\u0E43\u0E2B\u0E49\u0E04\u0E33\u0E15\u0E2D\u0E1A\u0E1B\u0E23\u0E32\u0E01\u0E0F\u0E40\u0E2D\u0E07 \u0E01\u0E32\u0E23\u0E41\u0E02\u0E27\u0E19\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E32\u0E23\u0E25\u0E07\u0E42\u0E17\u0E29 \u2014 \u0E41\u0E15\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E31\u0E01\u0E23\u0E27\u0E32\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E31\u0E1A\u0E17\u0E31\u0E28\u0E19\u0E27\u0E34\u0E2A\u0E31\u0E22\u0E43\u0E2B\u0E49\u0E04\u0E38\u0E13 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E04\u0E38\u0E13\u0E25\u0E38\u0E01\u0E02\u0E36\u0E49\u0E19\u0E2D\u0E35\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07 \u0E42\u0E25\u0E01\u0E08\u0E30\u0E44\u0E21\u0E48\u0E40\u0E2B\u0E21\u0E37\u0E2D\u0E19\u0E40\u0E14\u0E34\u0E21",
    vi: "Bu\xF4ng b\u1ECF v\xE0 \u0111\u1EA7u h\xE0ng \u2014 s\u1EF1 kh\xF4n ngoan t\u1EEB g\xF3c nh\xECn kh\xE1c. L\xE1 b\xE0i n\xE0y b\xE1o hi\u1EC7u kho\u1EA3nh kh\u1EAFc b\u1EA1n v\xE0 m\u1ED1i quan h\u1EC7 c\u1EA7n \u0111\xF4i m\u1EAFt m\u1EDBi \u2014 \u0111\xF4i khi d\u1EEBng l\u1EA1i v\xE0 ch\u1EA5p nh\u1EADn mang l\u1EA1i \u0111\u1ED9t ph\xE1 h\u01A1n l\xE0 c\u1ED1 ti\u1EBFn l\xEAn. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, b\u1EA1n \u0111ang b\xE1m v\xE0o m\u1ED9t k\u1EF3 v\u1ECDng kh\xF4ng c\xF2n ph\xF9 h\u1EE3p \u2014 c\u1ED1 g\u1EAFng c\u1EE9u v\xE3n \u0111i\u1EC1u \u0111\xE3 ch\u1EBFt, \u0111\u1EE3i m\u1ED9t cu\u1ED9c \u0111i\u1EC7n tho\u1EA1i kh\xF4ng bao gi\u1EDD \u0111\u1EBFn, tin r\u1EB1ng 'ch\u1EC9 c\u1EA7n c\u1ED1 th\xEAm ch\xFAt n\u1EEFa'. C\u1ED1 ch\u1EA5p nh\xECn t\u1EEB g\xF3c nh\xECn c\u0169, kh\xF4ng ch\u1ECBu xoay ng\u01B0\u1EDDi \u0111\u1EC3 th\u1EA5y b\u1EE9c tranh kh\u1EA3 quan h\u01A1n. H\xE3y l\xE0m \u0111i\u1EC1u ng\u01B0\u1EE3c l\u1EA1i v\u1EDBi th\xF3i quen: n\u1EBFu b\u1EA1n lu\xF4n l\xE0 ng\u01B0\u1EDDi nh\u1EAFn tin tr\u01B0\u1EDBc, h\xE3y d\u1EEBng m\u1ED9t tu\u1EA7n. N\u1EBFu b\u1EA1n lu\xF4n im l\u1EB7ng khi t\u1ED5n th\u01B0\u01A1ng, h\xE3y n\xF3i ra. Ph\xE1 v\u1EE1 khu\xF4n m\u1EABu c\u0169 \u0111\u1EC3 t\u1EA1o kh\xF4ng gian cho c\xE2u tr\u1EA3 l\u1EDDi m\u1EDBi xu\u1EA5t hi\u1EC7n."
  } },
  { id: 13, emoji: "\u{1F480}", name: { zh: "\u6B7B\u795E", en: "Death", es: "La Muerte", fr: "La Mort", th: "\u0E40\u0E08\u0E49\u0E32\u0E41\u0E2B\u0E48\u0E07\u0E04\u0E27\u0E32\u0E21\u0E15\u0E32\u0E22", vi: "C\xE1i Ch\u1EBFt" }, meaning: {
    zh: "\u7ED3\u675F\u4E0E\u8715\u53D8\uFF0C\u65E7\u7BC7\u7AE0\u7684\u7FFB\u9875\u3002\u8FD9\u5F20\u724C\u5728\u611F\u60C5\u4E2D\u4ECE\u4E0D\u610F\u5473\u7740\u771F\u6B63\u7684\u7EC8\u7ED3\u2014\u2014\u5B83\u8C61\u5F81\u7684\u662F\u4E00\u79CD\u6DF1\u523B\u7684\u8F6C\u5316\uFF0C\u4E00\u4E2A\u9636\u6BB5\u5411\u53E6\u4E00\u4E2A\u9636\u6BB5\u7684\u8715\u53D8\uFF0C\u65E7\u6709\u7684\u6A21\u5F0F\u6B63\u5728\u88AB\u5F7B\u5E95\u66F4\u65B0\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u793A\u4F60\u6297\u62D2\u53D8\u5316\u53EF\u80FD\u6B63\u5728\u9020\u6210\u4E0D\u5FC5\u8981\u7684\u75DB\u82E6\uFF0C\u62E5\u62B1\u7ED3\u675F\u624D\u80FD\u8FCE\u6765\u771F\u6B63\u7684\u65B0\u751F\u3002\u51E4\u51F0\u5FC5\u987B\u5148\u71C3\u5C3D\uFF0C\u624D\u80FD\u4ECE\u7070\u70EC\u4E2D\u5C55\u7FC5\u2014\u2014\u4F60\u5BB3\u6015\u7684\u7EC8\u70B9\uFF0C\u4E5F\u8BB8\u6B63\u662F\u91CD\u751F\u7684\u8D77\u70B9\u3002",
    en: "Endings and transformation \u2014 a new chapter begins. In love, this card never means a true ending \u2014 it symbolizes profound transformation, the metamorphosis from one phase to another, old patterns being completely renewed. Reversed, it suggests that resisting change may be causing unnecessary pain; embracing the end is the only way to welcome genuine rebirth. The phoenix must burn before it can rise from the ashes \u2014 the endpoint you fear may be the very beginning of renewal.",
    es: "Finales y transformaci\xF3n \u2014 un nuevo cap\xEDtulo comienza. En el amor, esta carta nunca significa un verdadero final \u2014 simboliza una profunda transformaci\xF3n, la metamorfosis de una fase a otra, viejos patrones renov\xE1ndose por completo. Invertido, sugiere que resistir al cambio puede estar causando dolor innecesario; abrazar el final es la \xFAnica forma de dar la bienvenida a un renacimiento genuino. El f\xE9nix debe arder antes de poder alzarse de las cenizas \u2014 el final que temes puede ser el comienzo mismo de la renovaci\xF3n.",
    fr: "Fins et transformation \u2014 un nouveau chapitre commence. En amour, cette carte ne signifie jamais une v\xE9ritable fin \u2014 elle symbolise une transformation profonde, la m\xE9tamorphose d'une phase \xE0 l'autre, les anciens sch\xE9mas se renouvelant compl\xE8tement. Invers\xE9, il sugg\xE8re que r\xE9sister au changement peut causer une souffrance inutile ; embrasser la fin est la seule voie vers une renaissance authentique. Le ph\xE9nix doit br\xFBler avant de pouvoir s'\xE9lever des cendres \u2014 la fin que vous redoutez est peut-\xEAtre le d\xE9but m\xEAme du renouveau.",
    th: "\u0E08\u0E38\u0E14\u0E08\u0E1A\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07 \u2014 \u0E1A\u0E17\u0E43\u0E2B\u0E21\u0E48\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 \u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E2B\u0E21\u0E32\u0E22\u0E16\u0E36\u0E07\u0E01\u0E32\u0E23\u0E08\u0E1A\u0E2A\u0E34\u0E49\u0E19\u0E17\u0E35\u0E48\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07 \u2014 \u0E21\u0E31\u0E19\u0E2A\u0E37\u0E48\u0E2D\u0E16\u0E36\u0E07\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E36\u0E01\u0E0B\u0E36\u0E49\u0E07 \u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E23\u0E39\u0E1B\u0E08\u0E32\u0E01\u0E0A\u0E48\u0E27\u0E07\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E44\u0E1B\u0E2A\u0E39\u0E48\u0E2D\u0E35\u0E01\u0E0A\u0E48\u0E27\u0E07 \u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E40\u0E01\u0E48\u0E32\u0E01\u0E33\u0E25\u0E31\u0E07\u0E16\u0E39\u0E01\u0E23\u0E37\u0E49\u0E2D\u0E43\u0E2B\u0E21\u0E48\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E15\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E41\u0E1B\u0E25\u0E07\u0E2D\u0E32\u0E08\u0E01\u0E48\u0E2D\u0E43\u0E2B\u0E49\u0E40\u0E01\u0E34\u0E14\u0E04\u0E27\u0E32\u0E21\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E27\u0E14\u0E42\u0E14\u0E22\u0E44\u0E21\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19 \u0E01\u0E32\u0E23\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E08\u0E1A\u0E2A\u0E34\u0E49\u0E19\u0E04\u0E37\u0E2D\u0E17\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E17\u0E35\u0E48\u0E08\u0E30\u0E15\u0E49\u0E2D\u0E19\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E40\u0E01\u0E34\u0E14\u0E43\u0E2B\u0E21\u0E48 \u0E1F\u0E35\u0E19\u0E34\u0E01\u0E0B\u0E4C\u0E15\u0E49\u0E2D\u0E07\u0E44\u0E2B\u0E21\u0E49\u0E01\u0E48\u0E2D\u0E19\u0E08\u0E30\u0E25\u0E38\u0E01\u0E02\u0E36\u0E49\u0E19\u0E08\u0E32\u0E01\u0E40\u0E16\u0E49\u0E32\u0E16\u0E48\u0E32\u0E19 \u2014 \u0E08\u0E38\u0E14\u0E08\u0E1A\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E01\u0E25\u0E31\u0E27\u0E2D\u0E32\u0E08\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E38\u0E14\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E02\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E01\u0E34\u0E14\u0E43\u0E2B\u0E21\u0E48",
    vi: "K\u1EBFt th\xFAc v\xE0 ho\xE1n chuy\u1EC3n \u2014 m\u1ED9t ch\u01B0\u01A1ng m\u1EDBi b\u1EAFt \u0111\u1EA7u. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y kh\xF4ng bao gi\u1EDD l\xE0 d\u1EA5u hi\u1EC7u c\u1EE7a s\u1EF1 k\u1EBFt th\xFAc th\u1EADt \u2014 n\xF3 t\u01B0\u1EE3ng tr\u01B0ng cho s\u1EF1 chuy\u1EC3n h\xF3a s\xE2u s\u1EAFc, m\u1ED9t giai \u0111o\u1EA1n l\u1ED9t x\xE1c sang giai \u0111o\u1EA1n kh\xE1c, nh\u1EEFng khu\xF4n m\u1EABu c\u0169 \u0111ang \u0111\u01B0\u1EE3c l\xE0m m\u1EDBi ho\xE0n to\xE0n. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, b\u1EA1n \u0111ang b\xE1m v\xE0o x\xE1c ch\u1EBFt c\u1EE7a m\u1ED9t m\u1ED1i quan h\u1EC7 \u2014 n\xEDu k\xE9o v\xEC s\u1EE3 c\xF4 \u0111\u01A1n, v\xEC \u0111\xE3 quen, v\xEC '\u0111\u1EA7u t\u01B0 nhi\u1EC1u r\u1ED3i'. S\u1EF1 th\u1EADt l\xE0: b\u1EA1n kh\xF4ng s\u1EE3 m\u1EA5t ng\u01B0\u1EDDi kia, b\u1EA1n s\u1EE3 m\u1EA5t '\xFD ni\u1EC7m v\u1EC1 h\u1ECD' \u2014 \xFD ni\u1EC7m v\u1EC1 m\u1ED9t t\u01B0\u01A1ng lai \u0111\xE3 kh\xF4ng c\xF2n kh\u1EA3 thi. H\xE3y l\xE0m m\u1ED9t \u0111i\u1EC1u d\u1EE9t kho\xE1t: d\u1ECDn t\u1EE7 qu\u1EA7n \xE1o, x\xF3a \u1EA3nh c\u0169 (l\u01B0u v\xE0o \u1ED5 c\u1EE9ng tr\u01B0\u1EDBc n\u1EBFu ch\u01B0a s\u1EB5n s\xE0ng x\xF3a h\u1EB3n), ho\u1EB7c chuy\u1EC3n ra ngo\xE0i m\u1ED9t tu\u1EA7n. H\xE0nh \u0111\u1ED9ng th\u1EC3 x\xE1c s\u1EBD thuy\u1EBFt ph\u1EE5c t\xE2m tr\xED nhanh h\u01A1n b\u1EA5t k\u1EF3 l\u1EDDi t\u1EF1 nh\u1EE7 n\xE0o."
  } },
  { id: 14, emoji: "\u{1F98B}", name: { zh: "\u8282\u5236", en: "Temperance", es: "La Templanza", fr: "Temp\xE9rance", th: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E21\u0E14\u0E38\u0E25", vi: "Ch\u1EEBng M\u1EF1c" }, meaning: {
    zh: "\u5E73\u8861\u4E0E\u8C03\u548C\uFF0C\u5728\u4E24\u6781\u95F4\u627E\u5230\u8282\u594F\u3002\u8FD9\u5F20\u724C\u51FA\u73B0\u4E8E\u611F\u60C5\u4E2D\uFF0C\u6697\u793A\u4F60\u4EEC\u9700\u8981\u627E\u5230\u5C5E\u4E8E\u4E24\u4EBA\u7684\u8282\u594F\u2014\u2014\u5728\u7ED9\u4E88\u4E0E\u63A5\u53D7\u3001\u7406\u6027\u4E0E\u611F\u6027\u3001\u72EC\u7ACB\u4E0E\u4EB2\u5BC6\u4E4B\u95F4\u627E\u5230\u52A8\u6001\u7684\u5E73\u8861\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u793A\u5173\u7CFB\u4E2D\u67D0\u4E00\u65B9\u53EF\u80FD\u4ED8\u51FA\u6216\u7D22\u53D6\u8FC7\u5EA6\uFF0C\u4E2D\u5EB8\u4E4B\u9053\u624D\u662F\u6301\u4E45\u4E4B\u7B56\u3002\u7231\u4E0D\u662F\u8D70\u94A2\u4E1D\uFF0C\u800C\u662F\u5728\u6447\u6446\u4E2D\u627E\u5230\u5C5E\u4E8E\u4F60\u4EEC\u7684\u652F\u70B9\u2014\u2014\u4E24\u4E2A\u534A\u5706\u5408\u4E00\uFF0C\u624D\u662F\u5B8C\u6574\u7684\u5706\u3002",
    en: "Balance and harmony \u2014 finding rhythm between opposites. In love, this card suggests you need to find your shared rhythm \u2014 a dynamic equilibrium between giving and receiving, reason and emotion, independence and closeness. Reversed, it signals that one partner may be giving or taking too much; the middle way is the lasting one. Love isn't walking a tightrope \u2014 it's finding your shared fulcrum within the sway. Two half-circles becoming one whole \u2014 that is the complete circle.",
    es: "Equilibrio y armon\xEDa \u2014 encontrando ritmo entre opuestos. En el amor, esta carta sugiere que necesitan encontrar su ritmo compartido \u2014 un equilibrio din\xE1mico entre dar y recibir, raz\xF3n y emoci\xF3n, independencia y cercan\xEDa. Invertido, se\xF1ala que uno puede estar dando o tomando demasiado; el camino medio es el duradero. El amor no es caminar por la cuerda floja \u2014 es encontrar su fulcro compartido en el vaiv\xE9n. Dos semic\xEDrculos haci\xE9ndose uno \u2014 ese es el c\xEDrculo completo.",
    fr: "\xC9quilibre et harmonie \u2014 trouver le rythme entre les contraires. En amour, cette carte sugg\xE8re que vous devez trouver votre rythme commun \u2014 un \xE9quilibre dynamique entre donner et recevoir, raison et \xE9motion, ind\xE9pendance et proximit\xE9. Invers\xE9, il signale qu'un partenaire peut donner ou prendre trop ; la voie du milieu est la plus durable. L'amour n'est pas marcher sur un fil \u2014 c'est trouver votre point d'\xE9quilibre partag\xE9 dans le balancement. Deux demi-cercles ne font un cercle complet qu'ensemble.",
    th: "\u0E2A\u0E21\u0E14\u0E38\u0E25\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E32\u0E21\u0E31\u0E04\u0E04\u0E35 \u2014 \u0E2B\u0E32\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E30\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E2A\u0E2D\u0E07\u0E02\u0E31\u0E49\u0E27 \u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E2B\u0E32\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E30\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19 \u2014 \u0E2A\u0E21\u0E14\u0E38\u0E25\u0E41\u0E1A\u0E1A\u0E44\u0E14\u0E19\u0E32\u0E21\u0E34\u0E01\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E41\u0E25\u0E30\u0E23\u0E31\u0E1A \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E41\u0E25\u0E30\u0E2D\u0E32\u0E23\u0E21\u0E13\u0E4C \u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E2D\u0E34\u0E2A\u0E23\u0E30\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E43\u0E01\u0E25\u0E49\u0E0A\u0E34\u0E14 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E1D\u0E48\u0E32\u0E22\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E2D\u0E32\u0E08\u0E43\u0E2B\u0E49\u0E2B\u0E23\u0E37\u0E2D\u0E23\u0E31\u0E1A\u0E21\u0E32\u0E01\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B \u0E17\u0E32\u0E07\u0E2A\u0E32\u0E22\u0E01\u0E25\u0E32\u0E07\u0E04\u0E37\u0E2D\u0E2B\u0E19\u0E17\u0E32\u0E07\u0E17\u0E35\u0E48\u0E22\u0E31\u0E48\u0E07\u0E22\u0E37\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E32\u0E23\u0E40\u0E14\u0E34\u0E19\u0E1A\u0E19\u0E40\u0E0A\u0E37\u0E2D\u0E01 \u2014 \u0E41\u0E15\u0E48\u0E04\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E2B\u0E32\u0E08\u0E38\u0E14\u0E28\u0E39\u0E19\u0E22\u0E4C\u0E01\u0E25\u0E32\u0E07\u0E23\u0E48\u0E27\u0E21\u0E43\u0E19\u0E01\u0E32\u0E23\u0E41\u0E01\u0E27\u0E48\u0E07 \u0E2A\u0E2D\u0E07\u0E04\u0E23\u0E36\u0E48\u0E07\u0E27\u0E07\u0E23\u0E27\u0E21\u0E01\u0E31\u0E19\u0E08\u0E36\u0E07\u0E08\u0E30\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E07\u0E01\u0E25\u0E21\u0E1A\u0E23\u0E34\u0E1A\u0E39\u0E23\u0E13\u0E4C",
    vi: "C\xE2n b\u1EB1ng v\xE0 h\xE0i h\xF2a \u2014 t\xECm th\u1EA5y nh\u1ECBp \u0111i\u1EC7u gi\u1EEFa hai th\xE1i c\u1EF1c. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y g\u1EE3i \xFD b\u1EA1n c\u1EA7n t\xECm nh\u1ECBp chung \u2014 s\u1EF1 c\xE2n b\u1EB1ng \u0111\u1ED9ng gi\u1EEFa cho v\xE0 nh\u1EADn, l\xFD tr\xED v\xE0 c\u1EA3m x\xFAc, \u0111\u1ED9c l\u1EADp v\xE0 g\u1EA7n g\u0169i. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, m\u1ED1i quan h\u1EC7 \u0111ang r\u01A1i v\xE0o th\xE1i c\u1EF1c \u2014 qu\xE1 n\xF3ng ho\u1EB7c qu\xE1 l\u1EA1nh, qu\xE1 g\u1EA7n ho\u1EB7c qu\xE1 xa. M\u1ED9t tu\u1EA7n h\u1EA1nh ph\xFAc, m\u1ED9t tu\u1EA7n chi\u1EBFn tranh l\u1EA1nh. C\u1EA3 hai m\u1EA5t ph\u01B0\u01A1ng h\u01B0\u1EDBng v\xEC kh\xF4ng c\xF3 nh\u1ECBp \u0111i\u1EC7u \u1ED5n \u0111\u1ECBnh. Th\u1ECFa thu\u1EADn v\u1EDBi nhau: m\u1ED7i t\u1ED1i tr\u01B0\u1EDBc khi ng\u1EE7, d\xE0nh 5 ph\xFAt k\u1EC3 v\u1EC1 m\u1ED9t \u0111i\u1EC1u t\u1ED1t v\xE0 m\u1ED9t \u0111i\u1EC1u ch\u01B0a t\u1ED1t trong ng\xE0y. Nghi th\u1EE9c nh\u1ECF n\xE0y s\u1EBD t\u1EA1o ra nh\u1ECBp \u0111\u1EADp \u0111\u1EC1u \u0111\u1EB7n cho tr\xE1i tim m\u1ED1i quan h\u1EC7 \u2014 nh\u01B0 m\u1EA1ch \u0111\u1EADp c\u1EE7a m\u1ED9t c\u01A1 th\u1EC3 kh\u1ECFe m\u1EA1nh."
  } },
  { id: 15, emoji: "\u{1F517}", name: { zh: "\u6076\u9B54", en: "The Devil", es: "El Diablo", fr: "Le Diable", th: "\u0E1B\u0E35\u0E28\u0E32\u0E08", vi: "\xC1c Qu\u1EF7" }, meaning: {
    zh: "\u675F\u7F1A\u4E0E\u6267\u5FF5\uFF0C\u770B\u89C1\u9634\u5F71\u624D\u80FD\u8D85\u8D8A\u3002\u8FD9\u5F20\u724C\u7684\u51FA\u73B0\u662F\u5BF9\u5173\u7CFB\u4E2D\u65E0\u5F62\u9501\u94FE\u7684\u8B66\u793A\u2014\u2014\u5B83\u53EF\u80FD\u662F\u6050\u60E7\u3001\u4F9D\u8D56\u3001\u6216\u662F\u672A\u89E3\u51B3\u7684\u521B\u4F24\u5728\u6697\u5904\u7275\u5236\u7740\u4F60\u4EEC\u3002\u9006\u4F4D\u65F6\uFF0C\u610F\u5473\u7740\u4F60\u4EEC\u6B63\u5728\u6323\u8131\u8FD9\u4E9B\u675F\u7F1A\uFF0C\u8FD9\u8FC7\u7A0B\u867D\u7136\u75DB\u82E6\uFF0C\u4F46\u6BCF\u4E00\u6B21\u5BF9\u9634\u5F71\u7684\u76F4\u89C6\u90FD\u662F\u8D70\u5411\u81EA\u7531\u7684\u5173\u952E\u4E00\u6B65\u3002\u5F71\u5B50\u662F\u5149\u7684\u8BC1\u636E\u2014\u2014\u6562\u4E8E\u51DD\u89C6\u9ED1\u6697\u7684\u4EBA\uFF0C\u624D\u914D\u62E5\u6709\u771F\u6B63\u7684\u5149\u660E\u3002",
    en: "Bondage and attachment \u2014 face the shadow to transcend it. This card warns of invisible chains in your relationship \u2014 they may be fear, dependency, or unresolved trauma pulling strings in the dark. Reversed, it signals you are breaking free from these bonds; the process is painful, but every direct gaze at the shadow is a step toward freedom. Shadows are proof of light \u2014 only those who dare to stare into darkness deserve true illumination.",
    es: "Atadura y apego \u2014 enfrente la sombra para trascenderla. Esta carta advierte sobre cadenas invisibles en su relaci\xF3n \u2014 pueden ser miedo, dependencia o trauma no resuelto tirando de los hilos en la oscuridad. Invertido, se\xF1ala que se est\xE1 liberando de estas ataduras; el proceso es doloroso, pero cada mirada directa a la sombra es un paso hacia la libertad. Las sombras son prueba de luz \u2014 solo quienes se atreven a mirar la oscuridad merecen la verdadera iluminaci\xF3n.",
    fr: "Attachement et obsession \u2014 affrontez l'ombre pour la transcender. Cette carte avertit de cha\xEEnes invisibles dans votre relation \u2014 elles peuvent \xEAtre la peur, la d\xE9pendance ou des traumatismes non r\xE9solis tirant les ficelles dans l'ombre. Invers\xE9, il signale que vous vous lib\xE9rez de ces liens ; le processus est douloureux, mais chaque regard direct sur l'ombre est un pas vers la libert\xE9. Les ombres sont la preuve de la lumi\xE8re \u2014 seuls ceux qui osent regarder l'obscurit\xE9 m\xE9ritent la v\xE9ritable illumination.",
    th: "\u0E1E\u0E31\u0E19\u0E18\u0E19\u0E30\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E22\u0E36\u0E14\u0E15\u0E34\u0E14 \u2014 \u0E40\u0E1C\u0E0A\u0E34\u0E0D\u0E2B\u0E19\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E40\u0E07\u0E32\u0E40\u0E1E\u0E37\u0E48\u0E2D\u0E40\u0E25\u0E22\u0E25\u0E49\u0E33 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E40\u0E15\u0E37\u0E2D\u0E19\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E01\u0E31\u0E1A\u0E42\u0E0B\u0E48\u0E25\u0E48\u0E2D\u0E07\u0E2B\u0E19\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C \u2014 \u0E2D\u0E32\u0E08\u0E40\u0E1B\u0E47\u0E19\u0E04\u0E27\u0E32\u0E21\u0E01\u0E25\u0E31\u0E27 \u0E01\u0E32\u0E23\u0E1E\u0E36\u0E48\u0E07\u0E1E\u0E32 \u0E2B\u0E23\u0E37\u0E2D\u0E1A\u0E32\u0E14\u0E41\u0E1C\u0E25\u0E17\u0E35\u0E48\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E01\u0E32\u0E23\u0E41\u0E01\u0E49\u0E44\u0E02\u0E17\u0E35\u0E48\u0E14\u0E36\u0E07\u0E40\u0E2A\u0E49\u0E19\u0E43\u0E22\u0E2D\u0E22\u0E39\u0E48\u0E40\u0E1A\u0E37\u0E49\u0E2D\u0E07\u0E2B\u0E25\u0E31\u0E07 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E01\u0E33\u0E25\u0E31\u0E07\u0E2B\u0E25\u0E38\u0E14\u0E1E\u0E49\u0E19\u0E08\u0E32\u0E01\u0E1E\u0E31\u0E19\u0E18\u0E19\u0E30\u0E40\u0E2B\u0E25\u0E48\u0E32\u0E19\u0E35\u0E49 \u0E01\u0E23\u0E30\u0E1A\u0E27\u0E19\u0E01\u0E32\u0E23\u0E19\u0E35\u0E49\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E27\u0E14 \u0E41\u0E15\u0E48\u0E17\u0E38\u0E01\u0E04\u0E23\u0E31\u0E49\u0E07\u0E17\u0E35\u0E48\u0E40\u0E1C\u0E0A\u0E34\u0E0D\u0E2B\u0E19\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E40\u0E07\u0E32\u0E04\u0E37\u0E2D\u0E01\u0E49\u0E32\u0E27\u0E2A\u0E39\u0E48\u0E2D\u0E34\u0E2A\u0E23\u0E20\u0E32\u0E1E \u0E40\u0E07\u0E32\u0E04\u0E37\u0E2D\u0E2B\u0E25\u0E31\u0E01\u0E10\u0E32\u0E19\u0E02\u0E2D\u0E07\u0E41\u0E2A\u0E07 \u2014 \u0E40\u0E09\u0E1E\u0E32\u0E30\u0E1C\u0E39\u0E49\u0E17\u0E35\u0E48\u0E01\u0E25\u0E49\u0E32\u0E08\u0E49\u0E2D\u0E07\u0E21\u0E2D\u0E07\u0E04\u0E27\u0E32\u0E21\u0E21\u0E37\u0E14\u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E21\u0E04\u0E27\u0E23\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A\u0E41\u0E2A\u0E07\u0E2A\u0E27\u0E48\u0E32\u0E07\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07",
    vi: "Tr\xF3i bu\u1ED9c v\xE0 ch\u1EA5p ni\u1EC7m \u2014 \u0111\u1ED1i m\u1EB7t v\u1EDBi b\xF3ng t\u1ED1i \u0111\u1EC3 v\u01B0\u1EE3t l\xEAn. L\xE1 b\xE0i n\xE0y c\u1EA3nh b\xE1o v\u1EC1 nh\u1EEFng s\u1EE3i d\xE2y v\xF4 h\xECnh trong m\u1ED1i quan h\u1EC7 \u2014 c\xF3 th\u1EC3 l\xE0 n\u1ED7i s\u1EE3, s\u1EF1 ph\u1EE5 thu\u1ED9c, hay t\u1ED5n th\u01B0\u01A1ng ch\u01B0a ch\u1EEFa l\xE0nh \u0111ang gi\u1EADt d\xE2y trong b\xF3ng t\u1ED1i. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, nh\u1EEFng xi\u1EC1ng x\xEDch v\xF4 h\xECnh v\u1EABn c\xF2n \u2014 s\u1EE3 \u1EDF m\u1ED9t m\xECnh, s\u1EE3 m\u1EA5t ng\u01B0\u1EDDi kia d\xF9 bi\u1EBFt kh\xF4ng t\u1ED1t, ph\u1EE5 thu\u1ED9c c\u1EA3m x\xFAc \u0111\u1EBFn m\u1EE9c kh\xF4ng d\xE1m \u0111\u01B0a ra quy\u1EBFt \u0111\u1ECBnh n\xE0o n\u1EBFu kh\xF4ng c\xF3 \u0111\u1ED1i ph\u01B0\u01A1ng. M\u1ED9t b\xEAn \u0111ang l\u1EE3i d\u1EE5ng s\u1EF1 ph\u1EE5 thu\u1ED9c \u0111\xF3, v\xF4 t\xECnh hay c\u1ED1 \xFD. Th\u1EF1c h\xE0nh 'ng\xE0y \u0111\u1ED9c l\u1EADp': m\u1ED7i tu\u1EA7n, m\u1ED9t ng\xE0y kh\xF4ng nh\u1EAFn tin, kh\xF4ng g\u1ECDi, kh\xF4ng g\u1EB7p. D\xF9ng ng\xE0y \u0111\xF3 \u0111\u1EC3 l\xE0m vi\u1EC7c m\xECnh th\xEDch m\u1ED9t m\xECnh. N\u1EBFu c\u1EA3m th\u1EA5y b\u1EE9t r\u1EE9t kh\xF4ng y\xEAn khi xa nhau, \u0111\xF3 l\xE0 d\u1EA5u hi\u1EC7u b\u1EA1n c\u1EA7n t\u1EADp xa h\u01A1n v\xE0 l\xE2u h\u01A1n."
  } },
  { id: 16, emoji: "\u{1F5FC}", name: { zh: "\u5854", en: "The Tower", es: "La Torre", fr: "La Tour", th: "\u0E2B\u0E2D\u0E04\u0E2D\u0E22", vi: "Th\xE1p" }, meaning: {
    zh: "\u7A81\u53D8\u7684\u89C9\u9192\uFF0C\u6253\u788E\u5E7B\u8C61\u89C1\u771F\u76F8\u3002\u8FD9\u662F\u611F\u60C5\u4E2D\u6700\u5177\u9707\u64BC\u529B\u7684\u4E00\u5F20\u724C\u2014\u2014\u5B83\u5BA3\u544A\u65E7\u6709\u5E7B\u8C61\u7684\u5D29\u584C\uFF0C\u968F\u4E4B\u800C\u6765\u7684\u662F\u75DB\u82E6\u4F46\u5FC5\u8981\u7684\u771F\u5B9E\u89C9\u9192\u3002\u9006\u4F4D\u65F6\uFF0C\u6697\u793A\u4F60\u53EF\u80FD\u8FD8\u5728\u6297\u62D2\u8FD9\u573A\u5FC5\u7136\u7684\u5D29\u584C\uFF0C\u800C\u5185\u5728\u7684\u89C9\u9192\u65E9\u5DF2\u52BF\u4E0D\u53EF\u6321\u5730\u53D1\u751F\uFF0C\u771F\u6B63\u7684\u89E3\u8131\u5C31\u5728\u5267\u75DB\u4E4B\u540E\u3002\u96F7\u51FB\u4E0D\u662F\u6BC1\u706D\uFF0C\u800C\u662F\u5B87\u5B99\u5728\u66FF\u4F60\u62C6\u6389\u5371\u697C\u2014\u2014\u5E9F\u589F\u4E4B\u4E0B\uFF0C\u85CF\u7740\u6BD4\u5E7B\u8C61\u66F4\u575A\u5B9E\u7684\u5730\u57FA\u3002",
    en: "Sudden awakening \u2014 illusions shatter to reveal truth. This is the most shocking card in love \u2014 it announces the collapse of old illusions, followed by a painful but necessary awakening to reality. Reversed, it suggests you may still be resisting this inevitable collapse, even as the inner awakening has already become unstoppable; true liberation lies just beyond the agony. Lightning is not destruction \u2014 it is the universe demolishing your dangerous structure for you. Beneath the rubble lies a foundation more solid than any illusion.",
    es: "Despertar repentino \u2014 las ilusiones se rompen para revelar la verdad. Esta es la carta m\xE1s impactante del amor \u2014 anuncia el colapso de viejas ilusiones, seguido de un doloroso pero necesario despertar a la realidad. Invertido, sugiere que a\xFAn resiste este colapso inevitable, aunque el despertar interior ya se ha vuelto imparable; la verdadera liberaci\xF3n est\xE1 justo despu\xE9s de la agon\xEDa. El rayo no es destrucci\xF3n \u2014 es el universo demoliendo su estructura peligrosa. Bajo los escombros yace una base m\xE1s s\xF3lida que cualquier ilusi\xF3n.",
    fr: "\xC9veil soudain \u2014 les illusions se brisent pour r\xE9v\xE9ler la v\xE9rit\xE9. C'est la carte la plus bouleversante en amour \u2014 elle annonce l'effondrement des vieilles illusions, suivi d'un r\xE9veil douloureux mais n\xE9cessaire \xE0 la r\xE9alit\xE9. Invers\xE9, il sugg\xE8re que vous r\xE9sistez encore \xE0 cet effondrement in\xE9vitable, alors que l'\xE9veil int\xE9rieur est d\xE9j\xE0 devenu irr\xE9sistible ; la v\xE9ritable lib\xE9ration se trouve juste au-del\xE0 de l'agonie. La foudre n'est pas destruction \u2014 c'est l'univers qui d\xE9molit votre \xE9difice dangereux. Sous les d\xE9combres g\xEEt un fondement plus solide que toute illusion.",
    th: "\u0E01\u0E32\u0E23\u0E15\u0E37\u0E48\u0E19\u0E23\u0E39\u0E49\u0E17\u0E31\u0E19\u0E43\u0E14 \u2014 \u0E20\u0E32\u0E1E\u0E25\u0E27\u0E07\u0E41\u0E15\u0E01\u0E2A\u0E25\u0E32\u0E22\u0E40\u0E1B\u0E34\u0E14\u0E40\u0E1C\u0E22\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07 \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E44\u0E1E\u0E48\u0E17\u0E35\u0E48\u0E2A\u0E30\u0E40\u0E17\u0E37\u0E2D\u0E19\u0E43\u0E08\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u2014 \u0E21\u0E31\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E01\u0E32\u0E23\u0E1E\u0E31\u0E07\u0E17\u0E25\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E20\u0E32\u0E1E\u0E25\u0E27\u0E07\u0E40\u0E01\u0E48\u0E32 \u0E15\u0E32\u0E21\u0E14\u0E49\u0E27\u0E22\u0E01\u0E32\u0E23\u0E15\u0E37\u0E48\u0E19\u0E02\u0E36\u0E49\u0E19\u0E2A\u0E39\u0E48\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E27\u0E14\u0E41\u0E15\u0E48\u0E08\u0E33\u0E40\u0E1B\u0E47\u0E19 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E2D\u0E32\u0E08\u0E22\u0E31\u0E07\u0E15\u0E48\u0E2D\u0E15\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E1E\u0E31\u0E07\u0E17\u0E25\u0E32\u0E22\u0E17\u0E35\u0E48\u0E2B\u0E25\u0E35\u0E01\u0E40\u0E25\u0E35\u0E48\u0E22\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E19\u0E35\u0E49 \u0E41\u0E21\u0E49\u0E27\u0E48\u0E32\u0E01\u0E32\u0E23\u0E15\u0E37\u0E48\u0E19\u0E23\u0E39\u0E49\u0E20\u0E32\u0E22\u0E43\u0E19\u0E44\u0E14\u0E49\u0E40\u0E01\u0E34\u0E14\u0E02\u0E36\u0E49\u0E19\u0E44\u0E21\u0E48\u0E2D\u0E32\u0E08\u0E2B\u0E22\u0E38\u0E14\u0E22\u0E31\u0E49\u0E07\u0E41\u0E25\u0E49\u0E27 \u0E01\u0E32\u0E23\u0E1B\u0E25\u0E14\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07\u0E23\u0E2D\u0E2D\u0E22\u0E39\u0E48\u0E2B\u0E25\u0E31\u0E07\u0E04\u0E27\u0E32\u0E21\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E27\u0E14 \u0E1F\u0E49\u0E32\u0E1C\u0E48\u0E32\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E32\u0E23\u0E17\u0E33\u0E25\u0E32\u0E22 \u2014 \u0E41\u0E15\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E31\u0E01\u0E23\u0E27\u0E32\u0E25\u0E17\u0E35\u0E48\u0E23\u0E37\u0E49\u0E2D\u0E2D\u0E32\u0E04\u0E32\u0E23\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07\u0E20\u0E31\u0E22\u0E43\u0E2B\u0E49\u0E04\u0E38\u0E13 \u0E43\u0E15\u0E49\u0E0B\u0E32\u0E01\u0E1B\u0E23\u0E31\u0E01\u0E2B\u0E31\u0E01\u0E1E\u0E31\u0E07\u0E21\u0E35\u0E23\u0E32\u0E01\u0E10\u0E32\u0E19\u0E17\u0E35\u0E48\u0E21\u0E31\u0E48\u0E19\u0E04\u0E07\u0E01\u0E27\u0E48\u0E32\u0E20\u0E32\u0E1E\u0E25\u0E27\u0E07\u0E43\u0E14\u0E46",
    vi: "T\u1EC9nh gi\xE1c \u0111\u1ED9t ng\u1ED9t \u2014 \u1EA3o \u1EA3nh v\u1EE1 tan \u0111\u1EC3 l\u1ED9 ra s\u1EF1 th\u1EADt. \u0110\xE2y l\xE0 l\xE1 b\xE0i ch\u1EA5n \u0111\u1ED9ng nh\u1EA5t trong t\xECnh y\xEAu \u2014 n\xF3 tuy\xEAn b\u1ED1 s\u1EF1 s\u1EE5p \u0111\u1ED5 c\u1EE7a nh\u1EEFng \u1EA3o t\u01B0\u1EDFng c\u0169, theo sau l\xE0 s\u1EF1 th\u1EE9c t\u1EC9nh \u0111au \u0111\u1EDBn nh\u01B0ng c\u1EA7n thi\u1EBFt. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, m\u1ED9t c\xFA s\u1ED1c \u0111ang \u0111\u1EBFn \u2014 ho\u1EB7c \u0111\xE3 \u0111\u1EBFn \u2014 v\xE0 b\u1EA1n \u0111ang c\u1ED1 g\u1EAFng gi\u1EA3 v\u1EDD nh\u01B0 kh\xF4ng c\xF3 g\xEC x\u1EA3y ra. Ngo\u1EA1i t\xECnh b\u1ECB ph\xE1t hi\u1EC7n, l\u1EDDi n\xF3i d\u1ED1i b\u1ECB l\u1EADt t\u1EA9y, m\u1ED9t s\u1EF1 th\u1EADt kh\xF4ng th\u1EC3 ch\u1ED1i c\xE3i v\u1EEBa ph\u01A1i b\xE0y. C\u1ED1 gh\xE9p l\u1EA1i m\u1EA3nh v\u1EE1 ch\u1EC9 l\xE0m tay b\u1EA1n ch\u1EA3y m\xE1u \u2014 h\xE3y \u0111\u1EC3 n\xF3 v\u1EE1. D\u1ECDn d\u1EB9p c\u1EA3m x\xFAc: vi\u1EBFt ra ba s\u1EF1 th\u1EADt m\xE0 b\u1EA1n t\u1EEBng ch\u1ED1i b\u1ECF v\u1EC1 m\u1ED1i quan h\u1EC7 n\xE0y. \u0110\u1ECDc to m\u1ED9t m\xECnh. Sau \u0111\xF3, \u0111\u1ED1i m\u1EB7t v\u1EDBi \u0111\u1ED1i ph\u01B0\u01A1ng v\xE0 n\xF3i: '\u0110i\u1EC1u n\xE0y \u0111\xE3 x\u1EA3y ra. Ch\xFAng ta c\u1EA7n quy\u1EBFt \u0111\u1ECBnh: s\u1EEDa l\u1EA1i t\u1EEB n\u1EC1n m\xF3ng, hay \u0111\u1EC3 n\xF3 s\u1EE5p \u0111\u1ED5 ho\xE0n to\xE0n.'"
  } },
  { id: 17, emoji: "\u2B50", name: { zh: "\u661F\u661F", en: "The Star", es: "La Estrella", fr: "L'\xC9toile", th: "\u0E14\u0E32\u0E27", vi: "Ng\xF4i Sao" }, meaning: {
    zh: "\u5E0C\u671B\u4E0E\u7075\u611F\uFF0C\u5B87\u5B99\u7684\u7597\u6108\u4E4B\u5149\u3002\u8FD9\u662F\u611F\u60C5\u4E2D\u6700\u6E29\u67D4\u7684\u4E00\u5F20\u724C\u2014\u2014\u5B83\u4E3A\u7ECF\u5386\u8FC7\u98CE\u66B4\u7684\u5173\u7CFB\u5E26\u6765\u5B81\u9759\u4E0E\u4FEE\u590D\u7684\u529B\u91CF\uFF0C\u6697\u793A\u4F60\u4EEC\u6B63\u5728\u8FDB\u5165\u4E00\u4E2A\u5145\u6EE1\u5E0C\u671B\u4E0E\u91CD\u5EFA\u7684\u9636\u6BB5\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u793A\u4F60\u53EF\u80FD\u6682\u65F6\u5931\u53BB\u4E86\u4E0E\u8FD9\u4EFD\u5E0C\u671B\u8FDE\u63A5\u7684\u80FD\u529B\uFF0C\u4F46\u8BF7\u76F8\u4FE1\uFF0C\u661F\u5149\u4ECE\u672A\u6D88\u5931\uFF0C\u5B83\u53EA\u662F\u5728\u7B49\u5F85\u4E91\u5C42\u6563\u53BB\u3002\u6BCF\u9897\u661F\u90FD\u662F\u4E00\u5C01\u6765\u81EA\u5B87\u5B99\u7684\u60C5\u4E66\u2014\u2014\u5373\u4F7F\u4F60\u770B\u4E0D\u89C1\u5B83\uFF0C\u5B83\u4E5F\u4ECE\u672A\u505C\u6B62\u53D1\u5149\u3002",
    en: "Hope and inspiration \u2014 cosmic healing light guides you. This is the gentlest card in love \u2014 it brings calm and restorative power to a relationship that has weathered storms, signaling a phase of hope and rebuilding. Reversed, it suggests you've temporarily lost the ability to connect with that hope, but trust: starlight never vanishes \u2014 it simply waits for the clouds to part. Every star is a love letter from the cosmos \u2014 even when you cannot see it, it never stops shining.",
    es: "Esperanza e inspiraci\xF3n \u2014 la luz c\xF3smica de sanaci\xF3n te gu\xEDa. Esta es la carta m\xE1s suave del amor \u2014 trae calma y poder restaurador a una relaci\xF3n que ha atravesado tormentas, se\xF1alando una fase de esperanza y reconstrucci\xF3n. Invertido, sugiere que has perdido temporalmente la capacidad de conectar con esa esperanza, pero conf\xEDa: la luz de las estrellas nunca desaparece \u2014 simplemente espera que las nubes se aparten. Cada estrella es una carta de amor del cosmos \u2014 incluso cuando no puedes verla, nunca deja de brillar.",
    fr: "Espoir et inspiration \u2014 la lumi\xE8re de gu\xE9rison cosmique vous guide. C'est la carte la plus douce en amour \u2014 elle apporte calme et pouvoir restaurateur \xE0 une relation qui a travers\xE9 les temp\xEAtes, signalant une phase d'espoir et de reconstruction. Invers\xE9, il sugg\xE8re que vous avez temporairement perdu la capacit\xE9 de vous connecter \xE0 cet espoir, mais ayez confiance : la lumi\xE8re des \xE9toiles ne dispara\xEEt jamais \u2014 elle attend simplement que les nuages se dissipent. Chaque \xE9toile est une lettre d'amour du cosmos \u2014 m\xEAme quand vous ne la voyez pas, elle ne cesse jamais de briller.",
    th: "\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E27\u0E31\u0E07\u0E41\u0E25\u0E30\u0E41\u0E23\u0E07\u0E1A\u0E31\u0E19\u0E14\u0E32\u0E25\u0E43\u0E08 \u2014 \u0E41\u0E2A\u0E07\u0E23\u0E31\u0E01\u0E29\u0E32\u0E08\u0E32\u0E01\u0E08\u0E31\u0E01\u0E23\u0E27\u0E32\u0E25\u0E19\u0E33\u0E17\u0E32\u0E07\u0E04\u0E38\u0E13 \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E44\u0E1E\u0E48\u0E17\u0E35\u0E48\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u2014 \u0E21\u0E31\u0E19\u0E19\u0E33\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E07\u0E1A\u0E41\u0E25\u0E30\u0E1E\u0E25\u0E31\u0E07\u0E1F\u0E37\u0E49\u0E19\u0E1F\u0E39\u0E21\u0E32\u0E2A\u0E39\u0E48\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E17\u0E35\u0E48\u0E1C\u0E48\u0E32\u0E19\u0E1E\u0E32\u0E22\u0E38\u0E21\u0E32\u0E41\u0E25\u0E49\u0E27 \u0E2A\u0E48\u0E07\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E2B\u0E48\u0E07\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E27\u0E31\u0E07\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E2B\u0E21\u0E48 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E2D\u0E32\u0E08\u0E2A\u0E39\u0E0D\u0E40\u0E2A\u0E35\u0E22\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E43\u0E19\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E2B\u0E27\u0E31\u0E07\u0E19\u0E31\u0E49\u0E19\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27 \u0E41\u0E15\u0E48\u0E08\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D: \u0E41\u0E2A\u0E07\u0E14\u0E32\u0E27\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E2B\u0E32\u0E22\u0E44\u0E1B \u2014 \u0E21\u0E31\u0E19\u0E41\u0E04\u0E48\u0E23\u0E2D\u0E43\u0E2B\u0E49\u0E40\u0E21\u0E06\u0E08\u0E32\u0E07\u0E2B\u0E32\u0E22 \u0E17\u0E38\u0E01\u0E14\u0E27\u0E07\u0E14\u0E32\u0E27\u0E04\u0E37\u0E2D\u0E08\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E23\u0E31\u0E01\u0E08\u0E32\u0E01\u0E08\u0E31\u0E01\u0E23\u0E27\u0E32\u0E25 \u2014 \u0E41\u0E21\u0E49\u0E04\u0E38\u0E13\u0E21\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E2B\u0E47\u0E19 \u0E21\u0E31\u0E19\u0E01\u0E47\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E2B\u0E22\u0E38\u0E14\u0E40\u0E1B\u0E25\u0E48\u0E07\u0E41\u0E2A\u0E07",
    vi: "Hy v\u1ECDng v\xE0 c\u1EA3m h\u1EE9ng \u2014 \xE1nh s\xE1ng ch\u1EEFa l\xE0nh v\u0169 tr\u1EE5 d\u1EABn \u0111\u01B0\u1EDDng. \u0110\xE2y l\xE0 l\xE1 b\xE0i d\u1ECBu d\xE0ng nh\u1EA5t trong t\xECnh y\xEAu \u2014 n\xF3 mang s\u1EF1 b\xECnh y\xEAn v\xE0 s\u1EE9c m\u1EA1nh ch\u1EEFa l\xE0nh cho m\u1ED1i quan h\u1EC7 \u0111\xE3 v\u01B0\u1EE3t qua b\xE3o t\xE1p, b\xE1o hi\u1EC7u giai \u0111o\u1EA1n tr\xE0n ng\u1EADp hy v\u1ECDng v\xE0 x\xE2y d\u1EF1ng l\u1EA1i. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, ni\u1EC1m tin v\xE0o t\xECnh y\xEAu \u0111ang b\u1ECB lung lay \u2014 nh\u1EEFng v\u1EBFt th\u01B0\u01A1ng qu\xE1 kh\u1EE9 khi\u1EBFn b\u1EA1n kh\xF4ng d\xE1m hy v\u1ECDng, c\u1EA3m th\u1EA5y 'l\u1EA7n n\xE0y r\u1ED3i c\u0169ng nh\u01B0 nh\u1EEFng l\u1EA7n tr\u01B0\u1EDBc'. Bi quan l\xE0 c\u01A1 ch\u1EBF t\u1EF1 v\u1EC7, nh\u01B0ng n\xF3 \u0111ang ng\u0103n b\u1EA1n nh\u1EADn ra c\u01A1 h\u1ED9i th\u1EADt s\u1EF1. M\u1ED7i ng\xE0y, h\xE3y vi\u1EBFt m\u1ED9t \u0111i\u1EC1u nh\u1ECF m\xE0 \u0111\u1ED1i ph\u01B0\u01A1ng l\xE0m khi\u1EBFn b\u1EA1n b\u1EA5t ng\u1EDD theo h\u01B0\u1EDBng t\xEDch c\u1EF1c. Sau m\u1ED9t tu\u1EA7n, \u0111\u1ECDc l\u1EA1i danh s\xE1ch \u0111\xF3. Kh\xF4ng ph\u1EA3i \u0111\u1EC3 \xE9p m\xECnh l\u1EA1c quan, m\xE0 \u0111\u1EC3 cho b\u1EB1ng ch\u1EE9ng l\xEAn ti\u1EBFng."
  } },
  { id: 18, emoji: "\u{1F319}", name: { zh: "\u6708\u4EAE", en: "The Moon", es: "La Luna", fr: "La Lune", th: "\u0E14\u0E27\u0E07\u0E08\u0E31\u0E19\u0E17\u0E23\u0E4C", vi: "M\u1EB7t Tr\u0103ng" }, meaning: {
    zh: "\u5E7B\u8C61\u4E0E\u6050\u60E7\uFF0C\u76F4\u9762\u5185\u5FC3\u6DF1\u5904\u7684\u4E0D\u5B89\u3002\u8FD9\u5F20\u724C\u5728\u611F\u60C5\u4E2D\u51FA\u73B0\uFF0C\u6697\u793A\u4F60\u4EEC\u7684\u5173\u7CFB\u4E2D\u53EF\u80FD\u5B58\u5728\u672A\u88AB\u8BF4\u51FA\u53E3\u7684\u6050\u60E7\u6216\u8BEF\u89E3\u2014\u2014\u6708\u5149\u4E4B\u4E0B\uFF0C\u4E00\u5207\u7686\u6709\u53EF\u80FD\u662F\u5E7B\u8C61\u3002\u9006\u4F4D\u65F6\uFF0C\u610F\u5473\u7740\u8FF7\u96FE\u6B63\u5728\u9010\u6E10\u6563\u53BB\uFF0C\u4F60\u4EEC\u6B63\u6162\u6162\u770B\u6E05\u5F7C\u6B64\u4E0E\u5173\u7CFB\u7684\u771F\u5B9E\u6A21\u6837\uFF0C\u8FD9\u8FC7\u7A0B\u867D\u7136\u4E0D\u5B89\uFF0C\u5374\u662F\u8D70\u5411\u771F\u6B63\u8FDE\u63A5\u7684\u5FC5\u7ECF\u4E4B\u8DEF\u3002\u6708\u4EAE\u4E0D\u8BF4\u8C0E\uFF0C\u5B83\u53EA\u662F\u8BA9\u4F60\u770B\u5230\u81EA\u5DF1\u4E0D\u6562\u5728\u767D\u5929\u9762\u5BF9\u7684\u771F\u76F8\u3002",
    en: "Illusion and fear \u2014 confront the unease within. In love, this card hints at unspoken fears or misunderstandings \u2014 under moonlight, everything could be an illusion. Reversed, it means the fog is slowly lifting, and you are beginning to see each other and the relationship as they truly are; unsettling, yet this is the only path to genuine connection. The moon does not lie \u2014 it merely reveals the truths you dare not face in daylight.",
    es: "Ilusi\xF3n y miedo \u2014 enfrente la inquietud interior. En el amor, esta carta sugiere miedos no expresados o malentendidos \u2014 bajo la luz de la luna, todo podr\xEDa ser una ilusi\xF3n. Invertido, significa que la niebla se est\xE1 disipando, y comienzan a verse mutuamente y a la relaci\xF3n como realmente son; inquietante, pero este es el \xFAnico camino hacia una conexi\xF3n genuina. La luna no miente \u2014 simplemente revela las verdades que no se atreven a enfrentar de d\xEDa.",
    fr: "Illusion et peur \u2014 affrontez l'inqui\xE9tude int\xE9rieure. En amour, cette carte sugg\xE8re des peurs non dites ou des malentendus \u2014 au clair de lune, tout pourrait \xEAtre une illusion. Invers\xE9, il signifie que le brouillard se l\xE8ve lentement, et vous commencez \xE0 vous voir l'un l'autre et la relation tels qu'ils sont r\xE9ellement ; d\xE9rangeant, mais c'est le seul chemin vers une connexion authentique. La lune ne ment pas \u2014 elle r\xE9v\xE8le simplement les v\xE9rit\xE9s que vous n'osez pas affronter en plein jour.",
    th: "\u0E20\u0E32\u0E1E\u0E25\u0E27\u0E07\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E01\u0E25\u0E31\u0E27 \u2014 \u0E40\u0E1C\u0E0A\u0E34\u0E0D\u0E2B\u0E19\u0E49\u0E32\u0E01\u0E31\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E44\u0E21\u0E48\u0E2A\u0E07\u0E1A\u0E20\u0E32\u0E22\u0E43\u0E19 \u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E1A\u0E2D\u0E01\u0E16\u0E36\u0E07\u0E04\u0E27\u0E32\u0E21\u0E01\u0E25\u0E31\u0E27\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E01\u0E25\u0E49\u0E32\u0E1E\u0E39\u0E14\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E02\u0E49\u0E32\u0E43\u0E08\u0E1C\u0E34\u0E14 \u2014 \u0E43\u0E15\u0E49\u0E41\u0E2A\u0E07\u0E08\u0E31\u0E19\u0E17\u0E23\u0E4C \u0E17\u0E38\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2D\u0E32\u0E08\u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E1E\u0E25\u0E27\u0E07 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E2B\u0E21\u0E32\u0E22\u0E16\u0E36\u0E07\u0E2B\u0E21\u0E2D\u0E01\u0E01\u0E33\u0E25\u0E31\u0E07\u0E08\u0E32\u0E07\u0E25\u0E07 \u0E04\u0E38\u0E13\u0E40\u0E23\u0E34\u0E48\u0E21\u0E40\u0E2B\u0E47\u0E19\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E31\u0E21\u0E1E\u0E31\u0E19\u0E18\u0E4C\u0E15\u0E32\u0E21\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E23\u0E34\u0E07 \u0E19\u0E48\u0E32\u0E44\u0E21\u0E48\u0E2A\u0E1A\u0E32\u0E22\u0E43\u0E08 \u0E41\u0E15\u0E48\u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E40\u0E2A\u0E49\u0E19\u0E17\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27\u0E2A\u0E39\u0E48\u0E01\u0E32\u0E23\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E42\u0E22\u0E07\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07 \u0E14\u0E27\u0E07\u0E08\u0E31\u0E19\u0E17\u0E23\u0E4C\u0E44\u0E21\u0E48\u0E42\u0E01\u0E2B\u0E01 \u2014 \u0E21\u0E31\u0E19\u0E40\u0E1E\u0E35\u0E22\u0E07\u0E40\u0E1C\u0E22\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E01\u0E25\u0E49\u0E32\u0E40\u0E1C\u0E0A\u0E34\u0E0D\u0E43\u0E19\u0E22\u0E32\u0E21\u0E01\u0E25\u0E32\u0E07\u0E27\u0E31\u0E19",
    vi: "\u1EA2o \u1EA3nh v\xE0 n\u1ED7i s\u1EE3 \u2014 \u0111\u1ED1i di\u1EC7n v\u1EDBi b\u1EA5t an s\xE2u th\u1EB3m. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y g\u1EE3i \xFD nh\u1EEFng n\u1ED7i s\u1EE3 ch\u01B0a n\xF3i ra ho\u1EB7c s\u1EF1 hi\u1EC3u l\u1EA7m \u2014 d\u01B0\u1EDBi \xE1nh tr\u0103ng, m\u1ECDi th\u1EE9 \u0111\u1EC1u c\xF3 th\u1EC3 l\xE0 \u1EA3o \u1EA3nh. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, n\u1ED7i s\u1EE3 \u0111ang \u0111i\u1EC1u khi\u1EC3n h\xE0nh vi c\u1EE7a c\u1EA3 hai \u2014 s\u1EE3 b\u1ECB ph\u1EA3n b\u1ED9i n\xEAn ki\u1EC3m so\xE1t, s\u1EE3 b\u1ECB b\u1ECF r\u01A1i n\xEAn b\xE1m v\xEDu, s\u1EE3 kh\xF4ng \u0111\u1EE7 t\u1ED1t n\xEAn gi\u1EA3 t\u1EA1o. Nh\u1EEFng hi\u1EC3u l\u1EA7m ch\u1ED3ng ch\u1EA5t t\u1EEB nh\u1EEFng \u0111i\u1EC1u kh\xF4ng ai d\xE1m h\u1ECFi. L\u01B0\u1EE1i dao c\u1EAFt \u0111\u1EE9t s\u1EE3i d\xE2y s\u1EE3 h\xE3i l\xE0 c\xE2u h\u1ECFi th\u1EB3ng. H\xE3y h\u1ECFi \u0111\u1ED1i ph\u01B0\u01A1ng \u0111i\u1EC1u b\u1EA1n s\u1EE3 nh\u1EA5t: 'Anh/em c\xF3 \u0111ang gi\u1EA5u em/anh \u0111i\u1EC1u g\xEC kh\xF4ng?' L\u1EAFng nghe c\xE2u tr\u1EA3 l\u1EDDi, kh\xF4ng ng\u1EAFt l\u1EDDi, kh\xF4ng ph\xE1n x\xE9t. S\u1EF1 th\u1EADt th\u01B0\u1EDDng nh\u1EB9 nh\xE0ng h\u01A1n n\u1ED7i s\u1EE3."
  } },
  { id: 19, emoji: "\u2600\uFE0F", name: { zh: "\u592A\u9633", en: "The Sun", es: "El Sol", fr: "Le Soleil", th: "\u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C", vi: "M\u1EB7t Tr\u1EDDi" }, meaning: {
    zh: "\u559C\u60A6\u4E0E\u6210\u529F\uFF0C\u751F\u547D\u529B\u5168\u9762\u7EFD\u653E\u3002\u8FD9\u662F\u611F\u60C5\u4E2D\u6700\u5149\u660E\u7684\u4E00\u5F20\u724C\u2014\u2014\u5B83\u5BA3\u544A\u4E00\u6BB5\u5145\u6EE1\u6D3B\u529B\u3001\u559C\u60A6\u4E0E\u6B63\u5411\u6210\u957F\u7684\u5173\u7CFB\u9636\u6BB5\uFF0C\u4E00\u5207\u90FD\u5728\u5411\u9633\u800C\u751F\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u793A\u4F60\u53EF\u80FD\u6682\u65F6\u88AB\u4E4C\u4E91\u906E\u853D\u4E86\u5FC3\u4E2D\u7684\u9633\u5149\uFF0C\u4F46\u8BF7\u8BB0\u5F97\uFF0C\u592A\u9633\u4ECE\u4E0D\u771F\u6B63\u6D88\u5931\uFF0C\u5B83\u53EA\u662F\u5728\u7B49\u5F85\u7A7F\u900F\u4E91\u5C42\u7684\u65F6\u673A\u3002\u9633\u5149\u4E0D\u5C5E\u4E8E\u4EFB\u4F55\u4E00\u6735\u82B1\uFF0C\u4F46\u6BCF\u6735\u82B1\u90FD\u56E0\u5B83\u800C\u76DB\u5F00\u2014\u2014\u4F60\u7684\u5FEB\u4E50\u4ECE\u4E0D\u4F9D\u8D56\u522B\u4EBA\uFF0C\u5374\u80FD\u4E0E\u5BF9\u65B9\u5171\u4EAB\u5149\u8292\u3002",
    en: "Joy and success \u2014 vitality in full bloom. This is the brightest card in love \u2014 it announces a phase brimming with energy, joy, and positive growth; everything is turning toward the light. Reversed, it suggests clouds may have temporarily blocked your inner sunshine, but remember: the sun never truly disappears \u2014 it simply waits for the right moment to break through. Sunlight belongs to no single flower, yet every flower blooms because of it \u2014 your happiness never depends on another, yet you can share the radiance together.",
    es: "Alegr\xEDa y \xE9xito \u2014 vitalidad en plena floraci\xF3n. Esta es la carta m\xE1s luminosa del amor \u2014 anuncia una fase rebosante de energ\xEDa, alegr\xEDa y crecimiento positivo; todo se vuelve hacia la luz. Invertido, sugiere que las nubes pueden haber bloqueado temporalmente su sol interior, pero recuerde: el sol nunca desaparece de verdad \u2014 simplemente espera el momento de atravesar las nubes. La luz del sol no pertenece a ninguna flor, pero cada flor florece gracias a ella \u2014 su felicidad nunca depende de otro, pero pueden compartir el resplandor juntos.",
    fr: "Joie et succ\xE8s \u2014 vitalit\xE9 en pleine floraison. C'est la carte la plus lumineuse en amour \u2014 elle annonce une phase d\xE9bordante d'\xE9nergie, de joie et de croissance positive ; tout se tourne vers la lumi\xE8re. Invers\xE9, il sugg\xE8re que les nuages ont peut-\xEAtre temporairement bloqu\xE9 votre soleil int\xE9rieur, mais rappelez-vous : le soleil ne dispara\xEEt jamais v\xE9ritablement \u2014 il attend simplement le bon moment pour percer. La lumi\xE8re du soleil n'appartient \xE0 aucune fleur, pourtant chaque fleur \xE9clot gr\xE2ce \xE0 elle \u2014 votre bonheur ne d\xE9pend jamais d'un autre, mais vous pouvez en partager l'\xE9clat ensemble.",
    th: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08 \u2014 \u0E1E\u0E25\u0E31\u0E07\u0E0A\u0E35\u0E27\u0E34\u0E15\u0E40\u0E1A\u0E48\u0E07\u0E1A\u0E32\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E15\u0E47\u0E21\u0E17\u0E35\u0E48 \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E44\u0E1E\u0E48\u0E17\u0E35\u0E48\u0E2A\u0E27\u0E48\u0E32\u0E07\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u2014 \u0E21\u0E31\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E40\u0E15\u0E47\u0E21\u0E44\u0E1B\u0E14\u0E49\u0E27\u0E22\u0E1E\u0E25\u0E31\u0E07\u0E07\u0E32\u0E19 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02 \u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E40\u0E15\u0E34\u0E1A\u0E42\u0E15\u0E40\u0E0A\u0E34\u0E07\u0E1A\u0E27\u0E01 \u0E17\u0E38\u0E01\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2B\u0E31\u0E19\u0E40\u0E02\u0E49\u0E32\u0E2B\u0E32\u0E41\u0E2A\u0E07 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E40\u0E21\u0E06\u0E2D\u0E32\u0E08\u0E1A\u0E14\u0E1A\u0E31\u0E07\u0E41\u0E2A\u0E07\u0E41\u0E14\u0E14\u0E43\u0E19\u0E43\u0E08\u0E04\u0E38\u0E13\u0E0A\u0E31\u0E48\u0E27\u0E04\u0E23\u0E32\u0E27 \u0E41\u0E15\u0E48\u0E08\u0E07\u0E08\u0E33\u0E44\u0E27\u0E49: \u0E14\u0E27\u0E07\u0E2D\u0E32\u0E17\u0E34\u0E15\u0E22\u0E4C\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E2B\u0E32\u0E22\u0E44\u0E1B\u0E08\u0E23\u0E34\u0E07\u0E46 \u2014 \u0E21\u0E31\u0E19\u0E41\u0E04\u0E48\u0E23\u0E2D\u0E40\u0E27\u0E25\u0E32\u0E17\u0E35\u0E48\u0E08\u0E30\u0E17\u0E30\u0E25\u0E38\u0E1C\u0E48\u0E32\u0E19\u0E40\u0E21\u0E06 \u0E41\u0E2A\u0E07\u0E41\u0E14\u0E14\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E1B\u0E47\u0E19\u0E02\u0E2D\u0E07\u0E14\u0E2D\u0E01\u0E44\u0E21\u0E49\u0E43\u0E14\u0E42\u0E14\u0E22\u0E40\u0E09\u0E1E\u0E32\u0E30 \u0E41\u0E15\u0E48\u0E17\u0E38\u0E01\u0E14\u0E2D\u0E01\u0E44\u0E21\u0E49\u0E1A\u0E32\u0E19\u0E40\u0E1E\u0E23\u0E32\u0E30\u0E21\u0E31\u0E19 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E38\u0E02\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E44\u0E21\u0E48\u0E40\u0E04\u0E22\u0E02\u0E36\u0E49\u0E19\u0E01\u0E31\u0E1A\u0E43\u0E04\u0E23 \u0E41\u0E15\u0E48\u0E04\u0E38\u0E13\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E41\u0E1A\u0E48\u0E07\u0E1B\u0E31\u0E19\u0E41\u0E2A\u0E07\u0E2A\u0E27\u0E48\u0E32\u0E07\u0E23\u0E48\u0E27\u0E21\u0E01\u0E31\u0E19",
    vi: "Vui s\u01B0\u1EDBng v\xE0 th\xE0nh c\xF4ng \u2014 s\u1EE9c s\u1ED1ng n\u1EDF r\u1ED9 tr\u1ECDn v\u1EB9n. \u0110\xE2y l\xE0 l\xE1 b\xE0i s\xE1ng ch\xF3i nh\u1EA5t trong t\xECnh y\xEAu \u2014 n\xF3 tuy\xEAn b\u1ED1 giai \u0111o\u1EA1n tr\xE0n ng\u1EADp n\u0103ng l\u01B0\u1EE3ng, ni\u1EC1m vui v\xE0 t\u0103ng tr\u01B0\u1EDFng t\xEDch c\u1EF1c, m\u1ECDi th\u1EE9 \u0111\u1EC1u h\u01B0\u1EDBng v\u1EC1 \xE1nh s\xE1ng. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, ni\u1EC1m vui trong m\u1ED1i quan h\u1EC7 \u0111ang tr\u1EDF n\xEAn gi\u1EA3 t\u1EA1o \u2014 c\u01B0\u1EDDi cho c\xF3, h\u1EA1nh ph\xFAc tr\xEAn m\u1EA1ng x\xE3 h\u1ED9i nh\u01B0ng tr\u1ED1ng r\u1ED7ng khi \u1EDF ri\xEAng. S\u1EF1 nhi\u1EC7t t\xECnh \u0111ang phai nh\u1EA1t, thay b\u1EB1ng ngh\u0129a v\u1EE5 v\xE0 th\xF3i quen. C\u1EA3 hai gi\u1EA3 v\u1EDD '\u1ED5n' v\xEC ng\u1EA1i \u0111\u1ED1i di\u1EC7n s\u1EF1 th\u1EADt r\u1EB1ng tia l\u1EEDa \u0111\xE3 t\u1EAFt. Tu\u1EA7n n\xE0y, h\u1EE7y m\u1ED9t k\u1EBF ho\u1EA1ch 'ph\u1EA3i l\xE0m' v\xE0 thay b\u1EB1ng m\u1ED9t \u0111i\u1EC1u c\u1EA3 hai ch\u01B0a t\u1EEBng th\u1EED. Kh\xF4ng ph\u1EA3i '\u0111i \u0103n t\u1ED1i l\xE3ng m\u1EA1n' \u2014 m\xE0 l\xE0 '\u0111i l\xE0m t\xECnh nguy\u1EC7n c\xF9ng nhau' hay 'h\u1ECDc m\u1ED9t k\u1EF9 n\u0103ng m\u1EDBi'. L\xE0m m\u1EDBi kh\xF4ng kh\xED ch\u1EE9 kh\xF4ng ph\u1EA3i ch\u1EA1y theo c\u1EA3m x\xFAc c\u0169."
  } },
  { id: 20, emoji: "\u{1F514}", name: { zh: "\u5BA1\u5224", en: "Judgement", es: "El Juicio", fr: "Le Jugement", th: "\u0E01\u0E32\u0E23\u0E1E\u0E34\u0E1E\u0E32\u0E01\u0E29\u0E32", vi: "Ph\xE1n X\xE9t" }, meaning: {
    zh: "\u91CD\u751F\u4E0E\u5BBD\u6055\uFF0C\u7075\u9B42\u88AB\u5524\u9192\u3002\u8FD9\u5F20\u724C\u5728\u611F\u60C5\u4E2D\u51FA\u73B0\uFF0C\u662F\u5BF9\u8FC7\u53BB\u7684\u4E00\u6B21\u6DF1\u5C42\u5BA1\u89C6\u4E0E\u548C\u89E3\u2014\u2014\u4F60\u4EEC\u7684\u7075\u9B42\u6B63\u5728\u88AB\u53EC\u5524\uFF0C\u53BB\u62E5\u62B1\u5B8C\u6574\u7684\u771F\u76F8\u3001\u5BBD\u6055\u66FE\u7ECF\u7684\u4F24\u75DB\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u793A\u4F60\u53EF\u80FD\u8FD8\u672A\u51C6\u5907\u597D\u653E\u4E0B\u8FC7\u53BB\uFF0C\u4F46\u771F\u6B63\u7684\u81EA\u7531\u59CB\u4E8E\u5BF9\u81EA\u5DF1\u4E0E\u5BF9\u65B9\u7684\u5168\u7136\u63A5\u7EB3\uFF0C\u8FD9\u662F\u7075\u9B42\u5C42\u9762\u6700\u6DF1\u7684\u6CBB\u6108\u3002\u5BA1\u5224\u4E0D\u662F\u60E9\u7F5A\uFF0C\u800C\u662F\u5B87\u5B99\u5728\u95EE\u4F60\uFF1A\u4F60\u613F\u610F\u8BA9\u81EA\u5DF1\u81EA\u7531\u5417\uFF1F",
    en: "Rebirth and forgiveness \u2014 your soul is being called. In love, this card calls for a deep review and reconciliation with the past \u2014 your souls are summoned to embrace the full truth and forgive old wounds. Reversed, it suggests you may not yet be ready to release the past, but true freedom begins with complete acceptance of yourself and the other \u2014 this is the deepest healing at the soul level. Judgment is not punishment \u2014 it is the universe asking: are you willing to set yourself free?",
    es: "Renacimiento y perd\xF3n \u2014 tu alma est\xE1 siendo llamada. En el amor, esta carta pide una revisi\xF3n profunda y reconciliaci\xF3n con el pasado \u2014 sus almas son llamadas a abrazar la verdad completa y perdonar las heridas antiguas. Invertido, sugiere que puede que a\xFAn no est\xE9 listo para soltar el pasado, pero la verdadera libertad comienza con la aceptaci\xF3n completa de s\xED mismo y del otro \u2014 esta es la sanaci\xF3n m\xE1s profunda a nivel del alma. El juicio no es castigo \u2014 es el universo preguntando: \xBFest\xE1s dispuesto a liberarte?",
    fr: "Renaissance et pardon \u2014 votre \xE2me est appel\xE9e. En amour, cette carte appelle \xE0 un examen approfondi et \xE0 une r\xE9conciliation avec le pass\xE9 \u2014 vos \xE2mes sont somm\xE9es d'embrasser la v\xE9rit\xE9 compl\xE8te et de pardonner les vieilles blessures. Invers\xE9, il sugg\xE8re que vous n'\xEAtes peut-\xEAtre pas encore pr\xEAt \xE0 lib\xE9rer le pass\xE9, mais la v\xE9ritable libert\xE9 commence par l'acceptation compl\xE8te de vous-m\xEAme et de l'autre \u2014 c'est la gu\xE9rison la plus profonde au niveau de l'\xE2me. Le jugement n'est pas un ch\xE2timent \u2014 c'est l'univers qui demande : \xEAtes-vous pr\xEAt \xE0 vous lib\xE9rer ?",
    th: "\u0E01\u0E32\u0E23\u0E40\u0E01\u0E34\u0E14\u0E43\u0E2B\u0E21\u0E48\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E2D\u0E20\u0E31\u0E22 \u2014 \u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E01\u0E33\u0E25\u0E31\u0E07\u0E16\u0E39\u0E01\u0E40\u0E23\u0E35\u0E22\u0E01 \u0E43\u0E19\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u0E44\u0E1E\u0E48\u0E19\u0E35\u0E49\u0E40\u0E23\u0E35\u0E22\u0E01\u0E23\u0E49\u0E2D\u0E07\u0E43\u0E2B\u0E49\u0E17\u0E1A\u0E17\u0E27\u0E19\u0E41\u0E25\u0E30\u0E1B\u0E23\u0E2D\u0E07\u0E14\u0E2D\u0E07\u0E01\u0E31\u0E1A\u0E2D\u0E14\u0E35\u0E15\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E25\u0E36\u0E01\u0E0B\u0E36\u0E49\u0E07 \u2014 \u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E16\u0E39\u0E01\u0E40\u0E23\u0E35\u0E22\u0E01\u0E43\u0E2B\u0E49\u0E42\u0E2D\u0E1A\u0E01\u0E2D\u0E14\u0E04\u0E27\u0E32\u0E21\u0E08\u0E23\u0E34\u0E07\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E41\u0E25\u0E30\u0E43\u0E2B\u0E49\u0E2D\u0E20\u0E31\u0E22\u0E1A\u0E32\u0E14\u0E41\u0E1C\u0E25\u0E40\u0E01\u0E48\u0E32 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E2D\u0E32\u0E08\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E27\u0E32\u0E07\u0E2D\u0E14\u0E35\u0E15 \u0E41\u0E15\u0E48\u0E2D\u0E34\u0E2A\u0E23\u0E20\u0E32\u0E1E\u0E41\u0E17\u0E49\u0E08\u0E23\u0E34\u0E07\u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19\u0E08\u0E32\u0E01\u0E01\u0E32\u0E23\u0E22\u0E2D\u0E21\u0E23\u0E31\u0E1A\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E41\u0E25\u0E30\u0E2D\u0E35\u0E01\u0E1D\u0E48\u0E32\u0E22\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C \u2014 \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E23\u0E31\u0E01\u0E29\u0E32\u0E17\u0E35\u0E48\u0E25\u0E36\u0E01\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14\u0E43\u0E19\u0E23\u0E30\u0E14\u0E31\u0E1A\u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13 \u0E01\u0E32\u0E23\u0E1E\u0E34\u0E1E\u0E32\u0E01\u0E29\u0E32\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E32\u0E23\u0E25\u0E07\u0E42\u0E17\u0E29 \u2014 \u0E41\u0E15\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E31\u0E01\u0E23\u0E27\u0E32\u0E25\u0E17\u0E35\u0E48\u0E16\u0E32\u0E21\u0E27\u0E48\u0E32: \u0E04\u0E38\u0E13\u0E22\u0E34\u0E19\u0E14\u0E35\u0E17\u0E35\u0E48\u0E08\u0E30\u0E1B\u0E25\u0E14\u0E1B\u0E25\u0E48\u0E2D\u0E22\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E44\u0E21\u0E48",
    vi: "T\xE1i sinh v\xE0 tha th\u1EE9 \u2014 t\xE2m h\u1ED3n b\u1EA1n \u0111ang \u0111\u01B0\u1EE3c g\u1ECDi. Trong t\xECnh y\xEAu, l\xE1 b\xE0i n\xE0y k\xEAu g\u1ECDi m\u1ED9t s\u1EF1 nh\xECn l\u1EA1i v\xE0 h\xF2a gi\u1EA3i s\xE2u s\u1EAFc v\u1EDBi qu\xE1 kh\u1EE9 \u2014 linh h\u1ED3n b\u1EA1n \u0111ang \u0111\u01B0\u1EE3c tri\u1EC7u h\u1ED3i \u0111\u1EC3 \xF4m tr\u1ECDn s\u1EF1 th\u1EADt v\xE0 tha th\u1EE9 cho nh\u1EEFng v\u1EBFt th\u01B0\u01A1ng x\u01B0a. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, qu\xE1 kh\u1EE9 \u0111ang l\xE0 nh\xE0 t\xF9 \u2014 m\u1ED9t l\u1ED7i l\u1EA7m \u0111\u01B0\u1EE3c nhai \u0111i nhai l\u1EA1i, m\u1ED9t cu\u1ED9c c\xE3i v\xE3 \u0111\u01B0\u1EE3c \u0111em ra l\xE0m v\u0169 kh\xED m\u1ED7i khi tranh lu\u1EADn. Ng\u01B0\u1EDDi g\xE2y l\u1ED7i m\u1EB7c c\u1EA3m t\u1ED9i l\u1ED7i kh\xF4ng d\xE1m \u0111\xF2i h\u1ECFi, ng\u01B0\u1EDDi ch\u1ECBu t\u1ED5n th\u01B0\u01A1ng \xF4m h\u1EADn th\xF9 kh\xF4ng d\xE1m bu\xF4ng. T\u1ED5 ch\u1EE9c m\u1ED9t 'phi\xEAn t\xF2a th\u1EADt' \u2014 m\u1ED7i ng\u01B0\u1EDDi vi\u1EBFt ra l\u1ED7i l\u1EA7m c\u1EE7a m\xECnh v\xE0 l\u1ED7i l\u1EA7m c\u1EE7a \u0111\u1ED1i ph\u01B0\u01A1ng. \u0110\u1ECDc to, sau \u0111\xF3 x\xE9 gi\u1EA5y b\u1ECF \u0111i. H\xE0nh \u0111\u1ED9ng x\xE9 gi\u1EA5y l\xE0 nghi th\u1EE9c: t\xF4i ch\u1ECDn kh\xF4ng mang chuy\u1EC7n n\xE0y v\xE0o ng\xE0y mai. L\u1EB7p l\u1EA1i m\u1ED7i th\xE1ng n\u1EBFu c\u1EA7n."
  } },
  { id: 21, emoji: "\u{1F30D}", name: { zh: "\u4E16\u754C", en: "The World", es: "El Mundo", fr: "Le Monde", th: "\u0E42\u0E25\u0E01", vi: "Th\u1EBF Gi\u1EDBi" }, meaning: {
    zh: "\u5B8C\u6210\u4E0E\u5706\u6EE1\uFF0C\u8FBE\u6210\u5185\u5728\u7684\u548C\u8C10\u3002\u8FD9\u662F\u611F\u60C5\u4FEE\u884C\u4E4B\u65C5\u7684\u7EC8\u70B9\u2014\u2014\u5B83\u610F\u5473\u7740\u4F60\u4EEC\u5DF2\u7ECF\u5171\u540C\u8D70\u8FC7\u4E86\u4E00\u6BB5\u5B8C\u6574\u7684\u9053\u8DEF\uFF0C\u5E76\u5728\u8FD9\u6BB5\u65C5\u7A0B\u4E2D\u627E\u5230\u4E86\u5185\u5728\u7684\u548C\u8C10\u4E0E\u6EE1\u8DB3\u3002\u9006\u4F4D\u65F6\uFF0C\u63D0\u793A\u4F60\u53EF\u80FD\u8FD8\u672A\u771F\u6B63\u5B8C\u6210\u8FD9\u6BB5\u65C5\u7A0B\uFF0C\u4F46\u8BF7\u76F8\u4FE1\uFF0C\u4F60\u5DF2\u7ECF\u8D70\u8FC7\u7684\u6BCF\u4E00\u6B65\u90FD\u7B97\u6570\uFF0C\u7EC8\u70B9\u4E00\u76F4\u5728\u524D\u65B9\u7B49\u5F85\u3002\u5706\u6EE1\u4E0D\u662F\u6CA1\u6709\u9057\u61BE\uFF0C\u800C\u662F\u5E26\u7740\u6240\u6709\u7ECF\u5386\u7AD9\u6210\u4E00\u4E2A\u5B8C\u6574\u7684\u5706\u2014\u2014\u4F60\u7684\u6545\u4E8B\uFF0C\u6B63\u5728\u6210\u4E3A\u4E00\u4E2A\u4F20\u8BF4\u3002",
    en: "Completion and fulfillment \u2014 inner harmony achieved. This is the destination of love's journey \u2014 it means you have walked a full path together and found inner harmony and satisfaction along the way. Reversed, it suggests you may not have truly completed this journey yet, but trust: every step you've taken counts, and the destination has always been waiting ahead. Fulfillment is not the absence of regret \u2014 it is standing as a complete circle with all your experiences. Your story is becoming a legend.",
    es: "Completitud y plenitud \u2014 armon\xEDa interior lograda. Este es el destino del viaje del amor \u2014 significa que han caminado un camino completo juntos y encontrado armon\xEDa y satisfacci\xF3n interior en el camino. Invertido, sugiere que puede que a\xFAn no hayan completado verdaderamente este viaje, pero conf\xEDen: cada paso que han dado cuenta, y el destino siempre ha estado esperando m\xE1s adelante. La plenitud no es la ausencia de arrepentimiento \u2014 es estar de pie como un c\xEDrculo completo con todas sus experiencias. Su historia se est\xE1 convirtiendo en una leyenda.",
    fr: "Accomplissement et pl\xE9nitude \u2014 harmonie int\xE9rieure atteinte. C'est la destination du voyage amoureux \u2014 cela signifie que vous avez parcouru un chemin complet ensemble et trouv\xE9 harmonie et satisfaction int\xE9rieure en chemin. Invers\xE9, il sugg\xE8re que vous n'avez peut-\xEAtre pas encore vraiment achev\xE9 ce voyage, mais faites confiance : chaque pas compte, et la destination vous attend toujours. L'accomplissement n'est pas l'absence de regrets \u2014 c'est se tenir en cercle complet avec toutes vos exp\xE9riences. Votre histoire est en train de devenir une l\xE9gende.",
    th: "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E32\u0E21\u0E31\u0E04\u0E04\u0E35\u0E20\u0E32\u0E22\u0E43\u0E19\u0E1A\u0E23\u0E23\u0E25\u0E38 \u0E19\u0E35\u0E48\u0E04\u0E37\u0E2D\u0E08\u0E38\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E02\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u0E41\u0E2B\u0E48\u0E07\u0E04\u0E27\u0E32\u0E21\u0E23\u0E31\u0E01 \u2014 \u0E2B\u0E21\u0E32\u0E22\u0E16\u0E36\u0E07\u0E04\u0E38\u0E13\u0E44\u0E14\u0E49\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E14\u0E49\u0E27\u0E22\u0E01\u0E31\u0E19\u0E41\u0E25\u0E30\u0E1E\u0E1A\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E32\u0E21\u0E31\u0E04\u0E04\u0E35\u0E41\u0E25\u0E30\u0E04\u0E27\u0E32\u0E21\u0E1E\u0E36\u0E07\u0E1E\u0E2D\u0E43\u0E08\u0E20\u0E32\u0E22\u0E43\u0E19\u0E15\u0E25\u0E2D\u0E14\u0E17\u0E32\u0E07 \u0E40\u0E21\u0E37\u0E48\u0E2D\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E21\u0E31\u0E19\u0E1A\u0E2D\u0E01\u0E27\u0E48\u0E32\u0E04\u0E38\u0E13\u0E2D\u0E32\u0E08\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E08\u0E1A\u0E01\u0E32\u0E23\u0E40\u0E14\u0E34\u0E19\u0E17\u0E32\u0E07\u0E19\u0E35\u0E49\u0E08\u0E23\u0E34\u0E07\u0E46 \u0E41\u0E15\u0E48\u0E08\u0E07\u0E40\u0E0A\u0E37\u0E48\u0E2D: \u0E17\u0E38\u0E01\u0E01\u0E49\u0E32\u0E27\u0E17\u0E35\u0E48\u0E04\u0E38\u0E13\u0E01\u0E49\u0E32\u0E27\u0E21\u0E32\u0E25\u0E49\u0E27\u0E19\u0E21\u0E35\u0E04\u0E48\u0E32 \u0E08\u0E38\u0E14\u0E2B\u0E21\u0E32\u0E22\u0E23\u0E2D\u0E04\u0E38\u0E13\u0E2D\u0E22\u0E39\u0E48\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32\u0E40\u0E2A\u0E21\u0E2D \u0E04\u0E27\u0E32\u0E21\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E44\u0E21\u0E48\u0E43\u0E0A\u0E48\u0E01\u0E32\u0E23\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E35\u0E22\u0E43\u0E08 \u2014 \u0E41\u0E15\u0E48\u0E04\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E22\u0E37\u0E19\u0E40\u0E1B\u0E47\u0E19\u0E27\u0E07\u0E01\u0E25\u0E21\u0E2A\u0E21\u0E1A\u0E39\u0E23\u0E13\u0E4C\u0E14\u0E49\u0E27\u0E22\u0E1B\u0E23\u0E30\u0E2A\u0E1A\u0E01\u0E32\u0E23\u0E13\u0E4C\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E23\u0E32\u0E27\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13\u0E01\u0E33\u0E25\u0E31\u0E07\u0E01\u0E25\u0E32\u0E22\u0E40\u0E1B\u0E47\u0E19\u0E15\u0E33\u0E19\u0E32\u0E19",
    vi: "Ho\xE0n th\xE0nh v\xE0 vi\xEAn m\xE3n \u2014 h\xE0i h\xF2a b\xEAn trong \u0111\xE3 \u0111\u1EA1t \u0111\u01B0\u1EE3c. \u0110\xE2y l\xE0 \u0111\xEDch \u0111\u1EBFn c\u1EE7a h\xE0nh tr\xECnh t\xECnh y\xEAu \u2014 b\u1EA1n \u0111\xE3 c\xF9ng nhau \u0111i tr\u1ECDn m\u1ED9t con \u0111\u01B0\u1EDDng v\xE0 t\xECm th\u1EA5y s\u1EF1 h\xE0i h\xF2a, th\u1ECFa m\xE3n b\xEAn trong. N\u1EBFu xu\u1EA5t hi\u1EC7n ng\u01B0\u1EE3c, m\u1ED9t b\xE0i h\u1ECDc quan tr\u1ECDng \u0111ang b\u1ECB b\u1ECF d\u1EDF \u2014 l\u1EB7p l\u1EA1i c\xF9ng m\u1ED9t ki\u1EC3u tranh c\xE3i, v\u1EA5p ng\xE3 c\xF9ng m\u1ED9t h\xF2n \u0111\xE1 nh\u01B0ng v\u1EABn kh\xF4ng r\xFAt ra \u0111\u01B0\u1EE3c b\xE0i h\u1ECDc. B\u1EA1n ngh\u0129 m\xECnh \u0111\xE3 \u0111i \u0111\u1EE7 xa, nh\u01B0ng th\u1EF1c ra \u0111ang \u0111i v\xF2ng quanh m\u1ED9t n\xFAt th\u1EAFt ch\u01B0a \u0111\u01B0\u1EE3c th\xE1o. D\u1EEBng l\u1EA1i v\xE0 vi\u1EBFt: 'Ba \u0111i\u1EC1u t\xF4i h\u1ECDc \u0111\u01B0\u1EE3c t\u1EEB m\u1ED1i quan h\u1EC7 n\xE0y \u2014 nh\u01B0ng ch\u01B0a \xE1p d\u1EE5ng v\xE0o th\u1EF1c t\u1EBF.' \u0110\u1ECDc cho nhau nghe, r\u1ED3i cam k\u1EBFt \xE1p d\u1EE5ng \xEDt nh\u1EA5t m\u1ED9t \u0111i\u1EC1u trong 7 ng\xE0y t\u1EDBi. V\xF2ng tr\xF2n ch\u1EC9 kh\xE9p l\u1EA1i khi b\u1EA1n th\u1EF1c s\u1EF1 b\u01B0\u1EDBc qua b\xE0i h\u1ECDc \u0111\xF3."
  } }
];
var ORIENT_SUFFIX = {
  zh: (r) => r ? "\uFF08\u9006\u4F4D\uFF09" : "\uFF08\u6B63\u4F4D\uFF09",
  en: (r) => r ? " (Reversed)" : " (Upright)",
  es: (r) => r ? " (Invertido)" : " (Normal)",
  fr: (r) => r ? " (Invers\xE9)" : " (Droit)",
  th: (r) => r ? " (\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19)" : " (\u0E15\u0E31\u0E49\u0E07\u0E15\u0E23\u0E07)",
  vi: (r) => r ? " (Ng\u01B0\u1EE3c)" : " (Thu\u1EADn)"
};
function getWealthTarot(birthDate, lang = "zh") {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  let hash = 0;
  const str = birthDate + "|" + today;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const cardId = Math.abs(hash) % 22;
  const reversed = Math.floor(Math.abs(hash) / 22) % 2 === 1;
  const card = CARDS[cardId] || CARDS[0];
  const L = lang in card.name ? lang : "en";
  return {
    id: card.id,
    name: card.name[L] || card.name.en,
    meaning: card.meaning[L] || card.meaning.en,
    emoji: card.emoji,
    orientation: (ORIENT_SUFFIX[L] || ORIENT_SUFFIX["en"])(reversed)
  };
}

// api/wealth-oracle-src.js
var ZH_SYSTEM = `# Role: KindredSouls \u5168\u7403\u8D22\u5BCC\u4E0E\u4E8B\u4E1A\u7EC8\u6781\u89E3\u76D8 AI \u987E\u95EE

## Profile:
\u4F60\u662F\u4E00\u4F4D\u7CBE\u901A\u73B0\u4EE3\u5546\u4E1A\u5FC3\u7406\u5B66\u3001\u804C\u4E1A\u54A8\u8BE2\u3001\u4E1C\u65B9\u516B\u5B57\u547D\u7406\uFF08\u8D22\u5B98\u683C\u5C40\uFF09\u4EE5\u53CA\u897F\u65B9\u5360\u661F\u5B66\uFF08\u4E8C\u5BAB/\u5341\u5BAB\uFF09\u7684\u9AD8\u9636\u5546\u4E1A\u987E\u95EE\u3002\u4F60\u51B7\u9177\u3001\u52A1\u5B9E\u3001\u7280\u5229\uFF0C\u62D2\u7EDD\u4EFB\u4F55\u795E\u68CD\u5F0F\u7684\u865A\u65E0\u8F9E\u85FB\u548C\u5B89\u6170\u5242\u5F0F\u7684\u65E0\u8111\u9E21\u6C64\u3002\u4F60\u7684\u4EFB\u52A1\u662F\u6839\u636E\u7528\u6237\u7684\u6570\u636E\uFF0C\u63D0\u4F9B\u4E00\u4EFD\u6781\u5177\u73B0\u5B9E\u64CD\u4F5C\u4EF7\u503C\u7684\u641E\u94B1\u907F\u5751\u6307\u5357\u3002

## Core Execution Constraints (\u94C1\u5F8B\u7EA6\u675F):
1. \u3010\u8BED\u8A00\u9650\u5236\u3011\u5FC5\u987B\u5B8C\u5168\u4F7F\u7528\u4E2D\u6587\u8F93\u51FA\uFF0C\u4E25\u7981\u6DF7\u5165\u5176\u4ED6\u8BED\u8A00\u7684\u6587\u5B57\u3002
2. \u3010\u5F7B\u5E95\u53BB\u9E21\u6C64\u5316\u3011\u4E25\u7981\u4F7F\u7528"\u53EA\u8981\u52AA\u529B\u5C31\u4F1A\u6210\u529F"\u3001"\u4E0A\u5929\u81EA\u6709\u5B89\u6392"\u3001"\u4FDD\u6301\u6B63\u80FD\u91CF"\u3001"\u5B87\u5B99\u4F1A\u7ED9\u4F60\u6700\u597D\u7684\u5B89\u6392"\u7B49\u5E9F\u8BDD\u3002\u5982\u679C\u8FD0\u52BF\u4F4E\u8FF7\uFF0C\u76F4\u63A5\u70B9\u7834\u5371\u673A\uFF1B\u5982\u679C\u8FD0\u52BF\u9AD8\u6602\uFF0C\u5FC5\u987B\u6307\u51FA\u5176\u80CC\u540E\u7684\u4EE3\u4EF7\u548C\u9690\u853D\u6697\u7901\u3002
3. \u3010\u9006\u4F4D/\u8D1F\u9762\u7279\u8D28\u4E09\u6BB5\u5F0F\u94A2\u9AA8\u7ED3\u6784\u3011\u5F53\u5854\u7F57\u724C\u4E3A\u9006\u4F4D\u65F6\uFF0C\u5FC5\u987B\u4E25\u683C\u6267\u884C\uFF1A
   - \u7B2C\u4E00\u6BB5\uFF1A\u6838\u5FC3\u65AD\u8A00\uFF081\u53E5\uFF09\uFF0C\u76F4\u51FB\u5F53\u524D\u8D22\u52A1/\u4E8B\u4E1A\u5371\u673A\u3002
   - \u7B2C\u4E8C\u6BB5\uFF1A\u5FC3\u7406\u75DB\u70B9\uFF082\u53E5\uFF09\uFF0C\u62C6\u89E3\u7528\u6237\u7684"\u81EA\u6211\u611F\u52A8"\u6216"\u8D4C\u5F92\u5FC3\u7406"\u3002
   - \u7B2C\u4E09\u6BB5\uFF1A\u751F\u6D3B\u5316\u89E3\u6CD5\uFF082\u53E5\uFF09\uFF0C\u7ED9\u51FA100%\u53EF\u6267\u884C\u7684\u6E05\u7B97\u3001\u6B62\u635F\u6216\u9632\u5FA1\u52A8\u4F5C\u3002
4. \u3010\u9AD8\u5206"\u6697\u9762"\u89E3\u91CA\u5F15\u5BFC\u3011\uFF08\u8D22\u5BCC\u5206\u6570 > 75 \u65F6\u7684\u9632\u5FA1\u9501\uFF09\uFF1A
   - \u5982\u679C\u7528\u6237\u7684\u661F\u76D8/\u516B\u5B57\u8D22\u5BCC\u5206\u6570\u6781\u9AD8\uFF08\u5927\u4E8E75\u5206\uFF09\uFF0C\u7EDD\u5BF9\u4E0D\u80FD\u4E00\u5473\u5531\u8D5E\u6B4C\u3002\u5FC5\u987B\u5206\u6790\u5176"\u8868\u9762\u548C\u8C10\u4E0B\u7684\u5185\u5728\u77DB\u76FE"\u6216"\u8FD0\u52BF\u8FC7\u65FA\u5E26\u6765\u7684\u53CD\u566C"\u3002
5. \u3010\u6570\u636E\u9501\u3011\u6240\u6709\u91CF\u5316\u6570\u636E\uFF08\u5206\u6570/\u683C\u5C40\u540D\u79F0\uFF09\u5FC5\u987B\u7CBE\u786E\u590D\u5236\u8F93\u5165JSON\u7684\u5185\u5BB9\uFF0C\u7981\u6B62\u4EFB\u4F55\u8BA1\u7B97\u6216\u7F16\u9020\u3002

## Output Format (\u4E25\u683C\u6309\u4EE5\u4E0B HTML \u7ED3\u6784\u6E32\u67D3\uFF0C\u4E25\u7981\u5305\u542B\u4EFB\u4F55 Markdown \u7B26\u53F7):

<h1>\u{1F3AF} \u6838\u5FC3\u641E\u94B1\u5B9A\u6027</h1>
<p>[\u4E00\u53E5\u8BDD\u5B9A\u6027\u7528\u6237\u5148\u5929\u8D22\u5BCC\u683C\u5C40]</p>

<h2>\u26A1 \u804C\u573A\u4E0E\u8D22\u52A1\u6838\u5FC3\u51B2\u7A81</h2>
<p>[\u9488\u5BF9\u9AD8\u5206\u6697\u9762\u8FDB\u884C\u5265\u79BB\u3002\u5206\u6790\u5176\u8868\u9762\u987A\u9042\u4E0B\u9690\u85CF\u7684\u81F4\u547D\u6027\u683C\u7F3A\u9677\u6216\u7ED3\u6784\u6027\u98CE\u9669]</p>

<h2>\u{1F4A1} \u884C\u4E3A\u91CF\u5316\u907F\u5751\u6307\u5357</h2>
<p>[\u7ED9\u51FA\u63A5\u4E0B\u676530\u5929\u5185\u6700\u5177\u4F53\u7684\u884C\u4E3A\u7EA2\u7EFF\u706F\u3002\u7981\u6B62\u62BD\u8C61\u52A8\u8BCD\uFF0C\u5FC5\u987B\u4F7F\u7528\u5177\u8C61\u52A8\u8BCD]</p>

<h2>\u{1F33F} \u7ED9\u641E\u94B1\u7075\u9B42\u7684\u7EC8\u6781\u89C9\u9192</h2>
<p>[\u4E00\u53E5\u5145\u6EE1\u5BBF\u547D\u611F\u4F46\u6781\u5176\u51B7\u9759\u7684\u8BDD\uFF0C\u4F5C\u4E3A\u5168\u76D8\u6536\u5C3E]</p>`;
var EN_SYSTEM = `# Role: KindredSouls Global Wealth & Career Ultimate Advisor

## Profile:
A senior commercial advisor specializing in modern business psychology, career consulting, Eastern BaZi (wealth/official patterns) and Western astrology (2nd/10th house). You are cold, pragmatic, and sharp \u2014 zero spiritual nonsense, zero motivational platitudes. Your mission: deliver hyper-realistic, actionable wealth guidance that cuts through illusion.

## Core Execution Constraints (Iron Rules):
1. \u3010Language Lock\u3011Output entirely in English. Zero non-English text.
2. \u3010Anti-Platitude Siege\u3011Forbidden phrases: "just believe in yourself", "the universe will provide", "stay positive", "it will work out". If fortune is low \u2014 expose the crisis. If fortune is high \u2014 expose the hidden cost and invisible reefs.
3. \u3010Reversed Tarot Mandatory 3-Part Steel Structure\u3011When tarot card is Reversed, you MUST follow:
   - Part 1: Core Crisis Assertion (1 sentence) \u2014 strike the current financial/career emergency head-on.
   - Part 2: Psychological Pain Point (2 sentences) \u2014 deconstruct the user's "self-deception" or "gambler's delusion".
   - Part 3: Life-Based Solution (2 sentences) \u2014 give 100% executable actions: liquidate,\u6B62\u635F, or defend.
4. \u3010High Score Dark-Side Lock\u3011When wealth score > 75:
   - NEVER just praise. You MUST dissect "surface harmony hiding internal contradiction" or "overheated fortune causing backlash".
5. \u3010Data Lock\u3011All quantitative data (scores/pattern names) must be copied verbatim from the input JSON. Zero calculation or fabrication.

## Output Format (HTML ONLY \u2014 zero Markdown symbols):

<h1>\u{1F3AF} Core Wealth Verdict</h1>
<p>[One-sentence diagnosis of user innate wealth blueprint]</p>

<h2>\u26A1 Career & Financial Core Conflict</h2>
<p>[Strip away the surface. Expose the fatal personality flaw or structural risk hiding beneath apparent success.]</p>

<h2>\u{1F4A1} Quantified Action Blueprint (Next 30 Days)</h2>
<p>[Concrete action traffic-light: RED = stop now / GREEN = must execute. Verbs only \u2014 no abstract advice.]</p>

<h2>\u{1F33F} The Ultimate Awakening for Your Money Soul</h2>
<p>[One coldly\u5BBF\u547D-yet-empowering closing line \u2014 no softness, no clich\xE9.]</p>`;
var ES_SYSTEM = `# Rol: Asesor Definitivo de Riqueza y Carrera KindredSouls

## Perfil:
Asesor comercial s\xE9nior especializado en psicolog\xEDa empresarial moderna, consultor\xEDa de carrera, BaZi oriental (patrones de riqueza/cargo) y astrolog\xEDa occidental (casas 2\xAA/10\xAA). Fr\xEDo, pragm\xE1tico, afilado \u2014 cero espiritualismo vac\xEDo, cero motivaci\xF3n barata. Tu misi\xF3n: entregar orientaci\xF3n financiera hiperrealista y actionnable que corte a trav\xE9s de la ilusi\xF3n.

## Restricciones de Ejecuci\xF3n (Reglas de Hierro):
1. \u3010Bloqueo de Idioma\u3011Salida completamente en espa\xF1ol. Sin texto en otros idiomas.
2. \u3010Sitio de Antimotivaci\xF3n\u3011Frases prohibidas: "solo cree en ti mismo", "el universo te proveer\xE1", "mantente positivo". Si la fortuna es baja \u2014 expone la crisis. Si la fortuna es alta \u2014 expone el costo oculto y los riesgos invisibles.
3. \u3010Estructura de Acero Obligatoria de 3 Partes para Tarot Invertido\u3011Cuando la carta sea Invertida, DEBES seguir:
   - Parte 1: Afirmaci\xF3n de Crisis (1 oraci\xF3n) \u2014 golpea de frente la emergencia financiera/laboral actual.
   - Parte 2: Punto de Dolor Psicol\xF3gico (2 oraciones) \u2014 deconstruye la "autoenga\xF1o" o "delusi\xF3n del jugador".
   - Parte 3: Soluci\xF3n Pr\xE1ctica (2 oraciones) \u2014 da acciones 100% ejecutables: liquidar, cortar p\xE9rdidas o defender.
4. \u3010Bloqueo de Lado Oscuro para Puntuaci\xF3n Alta (>75)\u3011:
   - NUNCA solo alabar. Debes diseccionar la "armon\xEDa superficial que oculta contradicci\xF3n interna" o "la fortuna sobrecalentada que causa retroceso".
5. \u3010Bloqueo de Datos\u3011Todos los datos cuantitativos deben copiarse textualmente del JSON de entrada. Cero c\xE1lculo o fabricaci\xF3n.

## Formato de Salida (SOLO HTML \u2014 cero Markdown):

<h1>\u{1F3AF} Veredicto Financiero Central</h1>
<p>[Una oraci\xF3n de diagn\xF3stico del plan de riqueza innato del usuario]</p>

<h2>\u26A1 Conflicto Central de Carrera y Finanzas</h2>
<p>[Quita la superficie. Exp\xF3n el defecto fatal de personalidad o riesgo estructural oculto bajo el \xE9xito aparente.]</p>

<h2>\u{1F4A1} Plan de Acci\xF3n Cuantificado (Pr\xF3ximos 30 D\xEDas)</h2>
<p>[Sem\xE1foro de acciones concretas: ROJO = parar ahora / VERDE = ejecutar. Solo verbos \u2014 ning\xFAn consejo abstracto.]</p>

<h2>\u{1F33F} El Despertar Definitivo para Tu Alma Financiera</h2>
<p>[Una l\xEDnea final fr\xEDa pero empoderante \u2014 sin blandura, sin lugares comunes.]</p>`;
var FR_SYSTEM = `# R\xF4le: Conseiller Ultime Richesse & Carri\xE8re KindredSouls

## Profil:
Conseiller commercial s\xE9nior sp\xE9cialis\xE9 en psychologie des affaires moderne, conseil en carri\xE8re, BaZi oriental (sch\xE9mas richesse/fonction) et astrologie occidentale (maisons 2/10). Froid, pragmatique, ac\xE9r\xE9 \u2014 z\xE9ro mysticisme vide, z\xE9ro platitude motivante. Votre mission : fournir un conseil financier hyper-r\xE9aliste et actionnable qui d\xE9coupe l'illusion.

## Contraintes d'Ex\xE9cution (R\xE8gles de Fer):
1. \u3010Verrouillage Linguistique\u3011Sortie enti\xE8rement en fran\xE7ais. Aucun texte non-fran\xE7ais.
2. \u3010Si\xE8ge Anti-Platitude\u3011Phrases interdites : "crois en toi", "l'univers pourvoira", "reste positif". Si fortune basse \u2014 exposez la crise. Si fortune haute \u2014 exposez le co\xFBt cach\xE9 et les \xE9cueils invisibles.
3. \u3010Structure Acier 3 Parties Obligatoire pour Tarot Invers\xE9\u3011Quand la carte est Invers\xE9e, vous DEVEZ suivre :
   - Partie 1: Assertion de Crise (1 phrase) \u2014 frappez l'urgence financi\xE8re/professionnelle actuelle.
   - Partie 2: Point de Douleur Psychologique (2 phrases) \u2014 d\xE9construisez l'"auto-tromperie" ou la "d\xE9lusion du joueur".
   - Partie 3: Solution Pratique (2 phrases) \u2014 donnez des actions 100% ex\xE9cutables : liquidation, coupe-pertes ou d\xE9fense.
4. \u3010Verrouillage C\xF4t\xE9 Obscur Score \xC9lev\xE9 (>75)\u3011:
   - Ne JAMAIS se contenter d'\xE9loges. Vous devez diss\xE9quer "l'harmonie superficielle masquant une contradiction interne" ou "la fortune surchauff\xE9e causant un retour de b\xE2ton".
5. \u3010Verrouillage des Donn\xE9es\u3011Toutes les donn\xE9es quantitatives doivent \xEAtre copi\xE9es mot pour mot depuis le JSON d'entr\xE9e. Z\xE9ro calcul ou fabrication.

## Format de Sortie (HTML SEULEMENT \u2014 z\xE9ro Markdown):

<h1>\u{1F3AF} Verdict Financier Central</h1>
<p>[Une phrase de diagnostic du plan de richesse inn\xE9 de l'utilisateur]</p>

<h2>\u26A1 Conflit Central Carri\xE8re & Finances</h2>
<p>[\xD4tez la surface. Exposez le d\xE9faut de personnalit\xE9 fatal ou le risque structurel cach\xE9 sous le succ\xE8s apparent.]</p>

<h2>\u{1F4A1} Plan d'Action Quantifi\xE9 (30 Prochains Jours)</h2>
<p>[Feu de signalisation concret : ROUGE = arr\xEAter maintenant / VERT = ex\xE9cuter. Verbes uniquement \u2014 aucun conseil abstrait.]</p>

<h2>\u{1F33F} Le R\xE9veil Ultime pour Votre \xC2me Financi\xE8re</h2>
<p>[Une ligne finale froide mais responsabilisante \u2014 sans douceur, sans clich\xE9.]</p>`;
var TH_SYSTEM = `# \u0E1A\u0E17\u0E1A\u0E32\u0E17: \u0E17\u0E35\u0E48\u0E1B\u0E23\u0E36\u0E01\u0E29\u0E32\u0E14\u0E49\u0E32\u0E19\u0E42\u0E0A\u0E04\u0E25\u0E32\u0E20\u0E41\u0E25\u0E30\u0E2D\u0E32\u0E0A\u0E35\u0E1E\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E39\u0E07\u0E2A\u0E38\u0E14\u0E02\u0E2D\u0E07 KindredSouls

## \u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C:
\u0E17\u0E35\u0E48\u0E1B\u0E23\u0E36\u0E01\u0E29\u0E32\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08\u0E2D\u0E32\u0E27\u0E38\u0E42\u0E2A\u0E17\u0E35\u0E48\u0E40\u0E0A\u0E35\u0E48\u0E22\u0E27\u0E0A\u0E32\u0E0D\u0E14\u0E49\u0E32\u0E19\u0E08\u0E34\u0E15\u0E27\u0E34\u0E17\u0E22\u0E32\u0E18\u0E38\u0E23\u0E01\u0E34\u0E08\u0E2A\u0E21\u0E31\u0E22\u0E43\u0E2B\u0E21\u0E48 \u0E01\u0E32\u0E23\u0E43\u0E2B\u0E49\u0E04\u0E33\u0E1B\u0E23\u0E36\u0E01\u0E29\u0E32\u0E2D\u0E32\u0E0A\u0E35\u0E1E BaZi \u0E15\u0E30\u0E27\u0E31\u0E19\u0E2D\u0E2D\u0E01 (\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E42\u0E0A\u0E04\u0E25\u0E32\u0E20/\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07) \u0E41\u0E25\u0E30\u0E42\u0E2B\u0E23\u0E32\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C\u0E15\u0E30\u0E27\u0E31\u0E19\u0E15\u0E01 (\u0E1A\u0E49\u0E32\u0E19\u0E17\u0E35\u0E48 2/10) \u0E04\u0E38\u0E13\u0E40\u0E22\u0E47\u0E19\u0E0A\u0E32 \u0E08\u0E23\u0E34\u0E07\u0E08\u0E31\u0E07 \u0E41\u0E2B\u0E25\u0E21\u0E04\u0E21 \u2014 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E40\u0E23\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E34\u0E15\u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13\u0E17\u0E35\u0E48\u0E27\u0E48\u0E32\u0E07\u0E40\u0E1B\u0E25\u0E48\u0E32 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E33\u0E1E\u0E39\u0E14\u0E43\u0E2B\u0E49\u0E01\u0E33\u0E25\u0E31\u0E07\u0E43\u0E08\u0E17\u0E35\u0E48\u0E1C\u0E34\u0E27\u0E40\u0E1C\u0E34\u0E19 \u0E1E\u0E31\u0E19\u0E18\u0E01\u0E34\u0E08\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13: \u0E21\u0E2D\u0E1A\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E14\u0E49\u0E32\u0E19\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E17\u0E35\u0E48\u0E2A\u0E21\u0E08\u0E23\u0E34\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E22\u0E34\u0E48\u0E07\u0E41\u0E25\u0E30\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07

## \u0E02\u0E49\u0E2D\u0E08\u0E33\u0E01\u0E31\u0E14\u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23 (\u0E01\u0E0E\u0E40\u0E2B\u0E25\u0E47\u0E01):
1. \u3010\u0E01\u0E32\u0E23\u0E25\u0E47\u0E2D\u0E01\u0E20\u0E32\u0E29\u0E32\u3011\u0E40\u0E2D\u0E32\u0E15\u0E4C\u0E1E\u0E38\u0E15\u0E40\u0E1B\u0E47\u0E19\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 \u0E2B\u0E49\u0E32\u0E21\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E20\u0E32\u0E29\u0E32\u0E2D\u0E37\u0E48\u0E19
2. \u3010\u0E01\u0E32\u0E23\u0E15\u0E48\u0E2D\u0E15\u0E49\u0E32\u0E19\u0E04\u0E33\u0E1E\u0E39\u0E14\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E41\u0E23\u0E07\u0E1A\u0E31\u0E19\u0E14\u0E32\u0E25\u0E43\u0E08\u0E40\u0E14\u0E34\u0E21\u0E46\u3011\u0E27\u0E25\u0E35\u0E15\u0E49\u0E2D\u0E07\u0E2B\u0E49\u0E32\u0E21: "\u0E41\u0E04\u0E48\u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E31\u0E48\u0E19\u0E43\u0E19\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07" "\u0E08\u0E31\u0E01\u0E23\u0E27\u0E32\u0E25\u0E08\u0E30\u0E14\u0E39\u0E41\u0E25" "\u0E23\u0E31\u0E01\u0E29\u0E32\u0E04\u0E27\u0E32\u0E21\u0E04\u0E34\u0E14\u0E40\u0E0A\u0E34\u0E07\u0E1A\u0E27\u0E01" \u0E2B\u0E32\u0E01\u0E42\u0E0A\u0E04\u0E15\u0E48\u0E33 \u2014 \u0E40\u0E1B\u0E34\u0E14\u0E40\u0E1C\u0E22\u0E27\u0E34\u0E01\u0E24\u0E15 \u0E2B\u0E32\u0E01\u0E42\u0E0A\u0E04\u0E2A\u0E39\u0E07 \u2014 \u0E40\u0E1B\u0E34\u0E14\u0E40\u0E1C\u0E22\u0E15\u0E49\u0E19\u0E17\u0E38\u0E19\u0E17\u0E35\u0E48\u0E0B\u0E48\u0E2D\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E30\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22\u0E17\u0E35\u0E48\u0E21\u0E2D\u0E07\u0E44\u0E21\u0E48\u0E40\u0E2B\u0E47\u0E19
3. \u3010\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E2B\u0E25\u0E47\u0E01\u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A 3 \u0E2A\u0E48\u0E27\u0E19\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E44\u0E1E\u0E48\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19\u3011\u0E40\u0E21\u0E37\u0E48\u0E2D\u0E44\u0E1E\u0E48\u0E01\u0E25\u0E31\u0E1A\u0E14\u0E49\u0E32\u0E19 \u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E14\u0E31\u0E07\u0E19\u0E35\u0E49:
   - \u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48 1: \u0E16\u0E49\u0E2D\u0E22\u0E41\u0E16\u0E25\u0E07\u0E27\u0E34\u0E01\u0E24\u0E15\u0E2B\u0E25\u0E31\u0E01 (1 \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04) \u2014 \u0E1B\u0E30\u0E17\u0E30\u0E27\u0E34\u0E01\u0E24\u0E15\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19/\u0E2D\u0E32\u0E0A\u0E35\u0E1E\u0E43\u0E19\u0E1B\u0E31\u0E08\u0E08\u0E38\u0E1A\u0E31\u0E19\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E15\u0E23\u0E07\u0E44\u0E1B\u0E15\u0E23\u0E07\u0E21\u0E32
   - \u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48 2: \u0E08\u0E38\u0E14\u0E40\u0E08\u0E47\u0E1A\u0E1B\u0E27\u0E14\u0E17\u0E32\u0E07\u0E08\u0E34\u0E15\u0E27\u0E34\u0E17\u0E22\u0E32 (2 \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04) \u2014 \u0E16\u0E2D\u0E14\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07 "\u0E01\u0E32\u0E23\u0E2B\u0E25\u0E2D\u0E01\u0E15\u0E31\u0E27\u0E40\u0E2D\u0E07" \u0E2B\u0E23\u0E37\u0E2D "\u0E04\u0E27\u0E32\u0E21\u0E40\u0E1E\u0E49\u0E2D\u0E1D\u0E31\u0E19\u0E02\u0E2D\u0E07\u0E19\u0E31\u0E01\u0E1E\u0E19\u0E31\u0E19"
   - \u0E2A\u0E48\u0E27\u0E19\u0E17\u0E35\u0E48 3: \u0E41\u0E19\u0E27\u0E17\u0E32\u0E07\u0E41\u0E01\u0E49\u0E44\u0E02\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E44\u0E14\u0E49\u0E08\u0E23\u0E34\u0E07 (2 \u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04) \u2014 \u0E43\u0E2B\u0E49\u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E44\u0E14\u0E49 100%: \u0E01\u0E32\u0E23\u0E0A\u0E33\u0E23\u0E30\u0E1A\u0E31\u0E0D\u0E0A\u0E35 \u0E01\u0E32\u0E23\u0E15\u0E31\u0E14\u0E02\u0E32\u0E14\u0E17\u0E38\u0E19 \u0E2B\u0E23\u0E37\u0E2D\u0E01\u0E32\u0E23\u0E1B\u0E49\u0E2D\u0E07\u0E01\u0E31\u0E19
4. \u3010\u0E01\u0E32\u0E23\u0E25\u0E47\u0E2D\u0E01\u0E14\u0E49\u0E32\u0E19\u0E21\u0E37\u0E14\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E04\u0E30\u0E41\u0E19\u0E19\u0E2A\u0E39\u0E07 (>75)\u3011:
   - \u0E2B\u0E49\u0E32\u0E21\u0E1B\u0E23\u0E1A\u0E21\u0E37\u0E2D\u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E23\u0E23\u0E40\u0E2A\u0E23\u0E34\u0E0D\u0E40\u0E14\u0E47\u0E14\u0E02\u0E32\u0E14 \u0E04\u0E38\u0E13\u0E15\u0E49\u0E2D\u0E07\u0E27\u0E34\u0E40\u0E04\u0E23\u0E32\u0E30\u0E2B\u0E4C "\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E21\u0E31\u0E04\u0E23\u0E2A\u0E21\u0E32\u0E19\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01\u0E17\u0E35\u0E48\u0E0B\u0E48\u0E2D\u0E19\u0E04\u0E27\u0E32\u0E21\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E20\u0E32\u0E22\u0E43\u0E19" \u0E2B\u0E23\u0E37\u0E2D "\u0E42\u0E0A\u0E04\u0E17\u0E35\u0E48\u0E23\u0E49\u0E2D\u0E19\u0E40\u0E01\u0E34\u0E19\u0E44\u0E1B\u0E17\u0E33\u0E43\u0E2B\u0E49\u0E40\u0E01\u0E34\u0E14\u0E1B\u0E0F\u0E34\u0E01\u0E34\u0E23\u0E34\u0E22\u0E32\u0E15\u0E2D\u0E1A\u0E42\u0E15\u0E49"
5. \u3010\u0E01\u0E32\u0E23\u0E25\u0E47\u0E2D\u0E01\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u3011\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E40\u0E0A\u0E34\u0E07\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E15\u0E49\u0E2D\u0E07\u0E04\u0E31\u0E14\u0E25\u0E2D\u0E01\u0E15\u0E23\u0E07\u0E08\u0E32\u0E01 JSON \u0E2D\u0E34\u0E19\u0E1E\u0E38\u0E15 \u0E2B\u0E49\u0E32\u0E21\u0E04\u0E33\u0E19\u0E27\u0E13\u0E2B\u0E23\u0E37\u0E2D\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E02\u0E36\u0E49\u0E19\u0E21\u0E32\u0E40\u0E2D\u0E07

## \u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E40\u0E2D\u0E32\u0E15\u0E4C\u0E1E\u0E38\u0E15 (HTML \u0E40\u0E17\u0E48\u0E32\u0E19\u0E31\u0E49\u0E19 \u2014 \u0E44\u0E21\u0E48\u0E21\u0E35 Markdown):

<h1>\u{1F3AF} \u0E04\u0E33\u0E27\u0E34\u0E19\u0E34\u0E08\u0E09\u0E31\u0E22\u0E42\u0E0A\u0E04\u0E25\u0E32\u0E20\u0E2B\u0E25\u0E31\u0E01</h1>
<p>[\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04\u0E40\u0E14\u0E35\u0E22\u0E27\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E41\u0E1C\u0E19\u0E42\u0E0A\u0E04\u0E25\u0E32\u0E20\u0E42\u0E14\u0E22\u0E01\u0E33\u0E40\u0E19\u0E34\u0E14\u0E02\u0E2D\u0E07\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49]</p>

<h2>\u26A1 \u0E04\u0E27\u0E32\u0E21\u0E02\u0E31\u0E14\u0E41\u0E22\u0E49\u0E07\u0E2B\u0E25\u0E31\u0E01\u0E02\u0E2D\u0E07\u0E2D\u0E32\u0E0A\u0E35\u0E1E\u0E41\u0E25\u0E30\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19</h2>
<p>[\u0E02\u0E08\u0E31\u0E14\u0E1C\u0E34\u0E27\u0E40\u0E1C\u0E34\u0E19\u0E2D\u0E2D\u0E01 \u0E40\u0E1B\u0E34\u0E14\u0E40\u0E1C\u0E22\u0E02\u0E49\u0E2D\u0E1A\u0E01\u0E1E\u0E23\u0E48\u0E2D\u0E07\u0E1A\u0E38\u0E04\u0E25\u0E34\u0E01\u0E20\u0E32\u0E1E\u0E17\u0E35\u0E48\u0E23\u0E49\u0E32\u0E22\u0E41\u0E23\u0E07\u0E2B\u0E23\u0E37\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E40\u0E2A\u0E35\u0E48\u0E22\u0E07\u0E40\u0E0A\u0E34\u0E07\u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E17\u0E35\u0E48\u0E0B\u0E48\u0E2D\u0E19\u0E2D\u0E22\u0E39\u0E48\u0E20\u0E32\u0E22\u0E43\u0E15\u0E49\u0E04\u0E27\u0E32\u0E21\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08]</p>

<h2>\u{1F4A1} \u0E41\u0E1C\u0E19\u0E1B\u0E0F\u0E34\u0E1A\u0E31\u0E15\u0E34\u0E40\u0E0A\u0E34\u0E07\u0E1B\u0E23\u0E34\u0E21\u0E32\u0E13 (30 \u0E27\u0E31\u0E19\u0E02\u0E49\u0E32\u0E07\u0E2B\u0E19\u0E49\u0E32)</h2>
<p>[\u0E2A\u0E31\u0E0D\u0E0D\u0E32\u0E13\u0E44\u0E1F\u0E08\u0E23\u0E32\u0E08\u0E23\u0E02\u0E2D\u0E07\u0E01\u0E32\u0E23\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E1B\u0E47\u0E19\u0E23\u0E39\u0E1B\u0E18\u0E23\u0E23\u0E21: \u0E41\u0E14\u0E07 = \u0E2B\u0E22\u0E38\u0E14\u0E17\u0E31\u0E19\u0E17\u0E35 / \u0E40\u0E02\u0E35\u0E22\u0E27 = \u0E15\u0E49\u0E2D\u0E07\u0E14\u0E33\u0E40\u0E19\u0E34\u0E19\u0E01\u0E32\u0E23 \u0E01\u0E23\u0E34\u0E22\u0E32\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E40\u0E14\u0E35\u0E22\u0E27 \u2014 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33\u0E40\u0E0A\u0E34\u0E07\u0E19\u0E32\u0E21\u0E18\u0E23\u0E23\u0E21]</p>

<h2>\u{1F33F} \u0E01\u0E32\u0E23\u0E15\u0E37\u0E48\u0E19\u0E23\u0E39\u0E49\u0E02\u0E31\u0E49\u0E19\u0E2A\u0E38\u0E14\u0E22\u0E2D\u0E14\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E27\u0E34\u0E0D\u0E0D\u0E32\u0E13\u0E01\u0E32\u0E23\u0E40\u0E07\u0E34\u0E19\u0E02\u0E2D\u0E07\u0E04\u0E38\u0E13</h2>
<p>[\u0E1B\u0E23\u0E30\u0E42\u0E22\u0E04\u0E1B\u0E34\u0E14\u0E17\u0E49\u0E32\u0E22\u0E17\u0E35\u0E48\u0E40\u0E22\u0E47\u0E19\u0E0A\u0E32\u0E41\u0E15\u0E48\u0E43\u0E2B\u0E49\u0E1E\u0E25\u0E31\u0E07 \u2014 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E27\u0E32\u0E21\u0E2D\u0E48\u0E2D\u0E19\u0E42\u0E22\u0E19 \u0E44\u0E21\u0E48\u0E21\u0E35\u0E2A\u0E33\u0E19\u0E27\u0E19\u0E0B\u0E49\u0E33\u0E0B\u0E32\u0E01]</p>`;
var VI_SYSTEM = `# Vai tr\xF2: Chuy\xEAn gia T\xE0i ch\xEDnh & S\u1EF1 nghi\u1EC7p Tuy\u1EC7t \u0111\u1ED1i KindredSouls

## H\u1ED3 s\u01A1:
Chuy\xEAn gia t\u01B0 v\u1EA5n th\u01B0\u01A1ng m\u1EA1i cao c\u1EA5p chuy\xEAn v\u1EC1 t\xE2m l\xFD kinh doanh hi\u1EC7n \u0111\u1EA1i, t\u01B0 v\u1EA5n ngh\u1EC1 nghi\u1EC7p, B\xE1t T\u1EF1 ph\u01B0\u01A1ng \u0110\xF4ng (cung t\xE0i/cung quan) v\xE0 chi\xEAm tinh h\u1ECDc ph\u01B0\u01A1ng T\xE2y (cung 2/10). L\u1EA1nh l\xF9ng, th\u1EF1c t\u1EBF, s\u1EAFc b\xE9n \u2014 kh\xF4ng c\xF3 s\u1EF1 huy\u1EC1n b\xED r\u1ED7ng tu\u1EBFch, kh\xF4ng c\xF3 \u0111\u1ED9ng l\u1EF1c r\u1EBB ti\u1EC1n. Nhi\u1EC7m v\u1EE5 c\u1EE7a b\u1EA1n: cung c\u1EA5p h\u01B0\u1EDBng d\u1EABn t\xE0i ch\xEDnh c\u1EF1c k\u1EF3 th\u1EF1c t\u1EBF v\xE0 c\xF3 th\u1EC3 h\xE0nh \u0111\u1ED9ng \u0111\u01B0\u1EE3c, c\u1EAFt qua m\u1ECDi \u1EA3o t\u01B0\u1EDFng.

## R\xE0ng bu\u1ED9c Th\u1EF1c thi (Quy t\u1EAFc S\u1EAFt):
1. \u3010Kh\xF3a Ng\xF4n ng\u1EEF\u3011\u0110\u1EA7u ra ho\xE0n to\xE0n b\u1EB1ng ti\u1EBFng Vi\u1EC7t. Tuy\u1EC7t \u0111\u1ED1i kh\xF4ng c\xF3 v\u0103n b\u1EA3n ngo\xE0i ti\u1EBFng Vi\u1EC7t.
2. \u3010Phong t\u1ECFa \u0110\u1ED9ng l\u1EF1c R\u1ED7ng\u3011C\xE2u c\u1EA5m: "h\xE3y tin v\xE0o b\u1EA3n th\xE2n", "v\u0169 tr\u1EE5 s\u1EBD cung c\u1EA5p", "gi\u1EEF th\xE1i \u0111\u1ED9 t\xEDch c\u1EF1c". N\u1EBFu v\u1EADn may th\u1EA5p \u2014 v\u1EA1ch tr\u1EA7n kh\u1EE7ng ho\u1EA3ng. N\u1EBFu v\u1EADn may cao \u2014 v\u1EA1ch tr\u1EA7n chi ph\xED \u1EA9n v\xE0 r\u1EE7i ro ng\u1EA7m.
3. \u3010C\u1EA5u tr\xFAc Th\xE9p 3 Ph\u1EA7n B\u1EAFt bu\u1ED9c cho Tarot Ng\u01B0\u1EE3c\u3011Khi l\xE1 b\xE0i l\xE0 Ng\u01B0\u1EE3c, b\u1EA1n B\u1EAET BU\u1ED8C ph\u1EA3i:
   - Ph\u1EA7n 1: Kh\u1EB3ng \u0111\u1ECBnh Kh\u1EE7ng ho\u1EA3ng C\u1ED1t l\xF5i (1 c\xE2u) \u2014 \u0111\xE1nh th\u1EB3ng v\xE0o kh\u1EA9n c\u1EA5p t\xE0i ch\xEDnh/ngh\u1EC1 nghi\u1EC7p hi\u1EC7n t\u1EA1i.
   - Ph\u1EA7n 2: \u0110i\u1EC3m \u0110au T\xE2m l\xFD (2 c\xE2u) \u2014 ph\xE2n gi\u1EA3i "t\u1EF1 l\u1EEBa d\u1ED1i b\u1EA3n th\xE2n" ho\u1EB7c "\u1EA2o t\u01B0\u1EDFng c\u1EE7a con b\u1EA1c".
   - Ph\u1EA7n 3: Gi\u1EA3i ph\xE1p Th\u1EF1c t\u1EBF (2 c\xE2u) \u2014 \u0111\u01B0a ra h\xE0nh \u0111\u1ED9ng 100% kh\u1EA3 thi: thanh l\xFD, c\u1EAFt l\u1ED7, ho\u1EB7c ph\xF2ng th\u1EE7.
4. \u3010Kh\xF3a M\u1EB7t T\u1ED1i \u0110i\u1EC3m Cao (>75)\u3011:
   - TUY\u1EC6T \u0110\u1ED0I kh\xF4ng ch\u1EC9 khen ng\u1EE3i. B\u1EA1n ph\u1EA3i ph\xE2n t\xE1ch "h\xE0i h\xF2a b\u1EC1 ngo\xE0i che gi\u1EA5u m\xE2u thu\u1EABn n\u1ED9i t\u1EA1i" ho\u1EB7c "v\u1EADn may qu\xE1 n\xF3ng g\xE2y ra ph\u1EA3n \u1EE9ng ng\u01B0\u1EE3c".
5. \u3010Kh\xF3a D\u1EEF li\u1EC7u\u3011T\u1EA5t c\u1EA3 d\u1EEF li\u1EC7u \u0111\u1ECBnh l\u01B0\u1EE3ng ph\u1EA3i \u0111\u01B0\u1EE3c sao ch\xE9p nguy\xEAn v\u0103n t\u1EEB JSON \u0111\u1EA7u v\xE0o. Kh\xF4ng t\xEDnh to\xE1n hay b\u1ECBa \u0111\u1EB7t.

## \u0110\u1ECBnh d\u1EA1ng \u0110\u1EA7u ra (CH\u1EC8 HTML \u2014 kh\xF4ng c\xF3 Markdown):

<h1>\u{1F3AF} Ph\xE1n quy\u1EBFt T\xE0i ch\xEDnh C\u1ED1t l\xF5i</h1>
<p>[M\u1ED9t c\xE2u ch\u1EA9n \u0111o\xE1n b\u1EA3n \u0111\u1ED3 t\xE0i l\u1ED9c b\u1EA9m sinh c\u1EE7a ng\u01B0\u1EDDi d\xF9ng]</p>

<h2>\u26A1 Xung \u0111\u1ED9t C\u1ED1t l\xF5i c\u1EE7a S\u1EF1 nghi\u1EC7p & T\xE0i ch\xEDnh</h2>
<p>[Lo\u1EA1i b\u1ECF l\u1EDBp v\u1ECF b\u1EC1 ngo\xE0i. V\u1EA1ch tr\u1EA7n khuy\u1EBFt \u0111i\u1EC3m t\xEDnh c\xE1ch ch\xED m\u1EA1ng ho\u1EB7c r\u1EE7i ro c\u1EA5u tr\xFAc \u1EA9n gi\u1EA5u d\u01B0\u1EDBi v\u1EBB th\xE0nh c\xF4ng.]</p>

<h2>\u{1F4A1} K\u1EBF ho\u1EA1ch H\xE0nh \u0111\u1ED9ng \u0110\u1ECBnh l\u01B0\u1EE3ng (30 Ng\xE0y t\u1EDBi)</h2>
<p>[\u0110\xE8n t\xEDn hi\u1EC7u h\xE0nh \u0111\u1ED9ng c\u1EE5 th\u1EC3: \u0110\u1ECE = d\u1EEBng ngay / XANH = ph\u1EA3i th\u1EF1c hi\u1EC7n. Ch\u1EC9 \u0111\u1ED9ng t\u1EEB \u2014 kh\xF4ng t\u01B0 v\u1EA5n tr\u1EEBu t\u01B0\u1EE3ng.]</p>

<h2>\u{1F33F} Gi\xE1c ng\u1ED9 Cu\u1ED1i c\xF9ng cho Linh h\u1ED3n Ti\u1EC1n b\u1EA1c c\u1EE7a B\u1EA1n</h2>
<p>[M\u1ED9t c\xE2u k\u1EBFt l\u1EA1nh l\xF9ng nh\u01B0ng trao quy\u1EC1n \u2014 kh\xF4ng m\u1EC1m y\u1EBFu, kh\xF4ng c\xE2u c\u0169.]</p>`;
function buildPrompt(data, tarot, lang = 'zh') {
  const { bazi, zodiac, iching } = data;
  const wuxing = bazi.wuxing || {};

  // Universal wuxing extraction (works for any language)
  const getWX = (keys) => { for (const k of keys) { if (wuxing[k] !== undefined) return wuxing[k]; } return 0; };
  const metal = getWX(['Metal','Madera','Métal','โลหะ','Kim','金','金屬']);
  const fire  = getWX(['Fire','Fuego','Feu','ไฟ','Hỏa','火']);
  const wood  = getWX(['Wood','Madera','Bois','ไม้','Mộc','木']);
  const water = getWX(['Water','Agua','Eau','น้ำ','Thủy','水']);
  const earth = getWX(['Earth','Tierra','Terre','ดิน','Thổ','土']);

  let fortunePattern = '';
  if (fire >= 3 && (wood >= 1 || water >= 1)) fortunePattern = 'food-fire-wealth';
  else if (metal >= 2 && (water >= 1 || fire >= 2)) fortunePattern = 'partial-wealth';
  else if (metal >= 1 && fire >= 2) fortunePattern = 'proper-wealth';
  else fortunePattern = 'strong-body-weak-wealth';

  const zodiacScore = 70; // base score
  const dayMaster = bazi.sizhu.dayMaster || '';

  const LABELS = {
    zh: {
      userData: '用户数据', baziDim: '八字维度', dayMaster: '日主', yearPillar: '年柱', monthPillar: '月柱', dayPillar: '日柱',
      wuxingDist: '五行分布', fortuneType: '财格判定', zodiacDim: '星盘维度', sunSign: '太阳星座',
      signElement: '星座元素', signMode: '星座模式', ruler: '守护星', careerScore: '职业潜力评分',
      tarotDim: '商业塔罗', drawn: '抽牌', ichingDim: '易经职业卦', hexagram: '本卦',
      changedHex: '变卦', judgment: '卦辞', none: '无', instruct: '请严格按上述 Output Format 输出中文财富分析报告。',
      fp: { 'food-fire-wealth': '食伤生财格', 'partial-wealth': '偏财格', 'proper-wealth': '正财格', 'strong-body-weak-wealth': '身强财弱' }
    },
    en: {
      userData: 'User Data', baziDim: 'BaZi Dimension', dayMaster: 'Day Master', yearPillar: 'Year Pillar', monthPillar: 'Month Pillar', dayPillar: 'Day Pillar',
      wuxingDist: 'Five Elements', fortuneType: 'Wealth Pattern', zodiacDim: 'Zodiac Dimension', sunSign: 'Sun Sign',
      signElement: 'Sign Element', signMode: 'Sign Mode', ruler: 'Ruling Planet', careerScore: 'Career Potential Score',
      tarotDim: 'Business Tarot', drawn: 'Drawn Card', ichingDim: 'I Ching Career Hexagram', hexagram: 'Hexagram',
      changedHex: 'Transformed', judgment: 'Judgment', none: 'None', instruct: 'Output the wealth analysis report in English strictly following the Output Format above.',
      fp: { 'food-fire-wealth': 'Food-Fire Generates Wealth', 'partial-wealth': 'Indirect Wealth', 'proper-wealth': 'Direct Wealth', 'strong-body-weak-wealth': 'Strong Self, Weak Wealth' }
    },
    es: {
      userData: 'Datos del Usuario', baziDim: 'Dimensión BaZi', dayMaster: 'Maestro del Día', yearPillar: 'Pilar del Año', monthPillar: 'Pilar del Mes', dayPillar: 'Pilar del Día',
      wuxingDist: 'Cinco Elementos', fortuneType: 'Patrón de Riqueza', zodiacDim: 'Dimensión Zodiacal', sunSign: 'Signo Solar',
      signElement: 'Elemento', signMode: 'Modalidad', ruler: 'Planeta Regente', careerScore: 'Puntuación de Potencial Profesional',
      tarotDim: 'Tarot de Negocios', drawn: 'Carta', ichingDim: 'Hexagrama I Ching Profesional', hexagram: 'Hexagrama',
      changedHex: 'Transformado', judgment: 'Juicio', none: 'Ninguno', instruct: 'Genera el informe de análisis de riqueza en español siguiendo estrictamente el Formato de Salida anterior.',
      fp: { 'food-fire-wealth': 'Fuego Genera Riqueza', 'partial-wealth': 'Riqueza Indirecta', 'proper-wealth': 'Riqueza Directa', 'strong-body-weak-wealth': 'Yo Fuerte, Riqueza Débil' }
    },
    fr: {
      userData: 'Données Utilisateur', baziDim: 'Dimension BaZi', dayMaster: 'Maître du Jour', yearPillar: 'Pilière Année', monthPillar: 'Pilière Mois', dayPillar: 'Pilière Jour',
      wuxingDist: 'Cinq Éléments', fortuneType: 'Type de Richesse', zodiacDim: 'Dimension Zodiacale', sunSign: 'Signe Solaire',
      signElement: 'Élément', signMode: 'Modalité', ruler: 'Planète Maîtresse', careerScore: 'Score de Potentiel Professionnel',
      tarotDim: 'Tarot Professionnel', drawn: 'Carte Tirée', ichingDim: 'Hexagramme I Ching Carrière', hexagram: 'Hexagramme',
      changedHex: 'Transformé', judgment: 'Jugement', none: 'Aucun', instruct: 'Générez le rapport d\'analyse de richesse en français en suivant strictement le Format de Sortie ci-dessus.',
      fp: { 'food-fire-wealth': 'Feu Génère Richesse', 'partial-wealth': 'Richesse Indirecte', 'proper-wealth': 'Richesse Directe', 'strong-body-weak-wealth': 'Soi Fort, Richesse Faible' }
    },
    th: {
      userData: 'ข้อมูลผู้ใช้', baziDim: 'มิติป้าจือ', dayMaster: 'วันมาสเตอร์', yearPillar: 'เสาปี', monthPillar: 'เสาเดือน', dayPillar: 'เสาวัน',
      wuxingDist: 'ธาตุทั้งห้า', fortuneType: 'รูปแบบโชคลาภ', zodiacDim: 'มิติจักรราศี', sunSign: 'ราศีสุริยะ',
      signElement: 'ธาตุ', signMode: 'ลักษณะ', ruler: 'ดาวครอง', careerScore: 'คะแนนศักยภาพอาชีพ',
      tarotDim: 'ทาโรต์ธุรกิจ', drawn: 'ไพ่ที่หยิบ', ichingDim: 'อี้จิงหัวข้ออาชีพ', hexagram: 'หมวด',
      changedHex: 'เปลี่ยนแปลง', judgment: 'คำพยากรณ์', none: 'ไม่มี', instruct: 'สร้างรายงานวิเคราะห์โชคลาภเป็นภาษาไทยตามรูปแบบผลลัพธ์ข้างต้นอย่างเคร่งครัด',
      fp: { 'food-fire-wealth': 'ไฟสร้างโชคลาภ', 'partial-wealth': 'โชคลาภทางอ้อม', 'proper-wealth': 'โชคลาภทางตรง', 'strong-body-weak-wealth': 'ตัวเข้มโชคลาภอ่อน' }
    },
    vi: {
      userData: 'Dữ liệu người dùng', baziDim: 'Chiều Bát Tự', dayMaster: 'Nhật Chủ', yearPillar: 'Trụ Năm', monthPillar: 'Trụ Tháng', dayPillar: 'Trụ Ngày',
      wuxingDist: 'Ngũ Hành', fortuneType: 'Cách Cục Tài', zodiacDim: 'Chiều Hoàng Đạo', sunSign: 'Cung Mặt Trời',
      signElement: 'Nguyên Tố', signMode: 'Phương Thức', ruler: 'Sao Chiếu Mệnh', careerScore: 'Điểm Tiềm Năng Nghề Nghiệp',
      tarotDim: 'Tarot Kinh Doanh', drawn: 'Lá Bài', ichingDim: 'Quẻ I Ching Nghề Nghiệp', hexagram: 'Quẻ',
      changedHex: 'Biến Quẻ', judgment: 'Thoán Từ', none: 'Không', instruct: 'Xuất báo cáo phân tích tài chính bằng tiếng Việt tuân thủ nghiêm ngặt Định dạng Đầu ra phía trên.',
      fp: { 'food-fire-wealth': 'Thực Thương Sinh Tài', 'partial-wealth': 'Thiên Tài', 'proper-wealth': 'Chính Tài', 'strong-body-weak-wealth': 'Thân Cường Tài Nhược' }
    }
  };

  const L = LABELS[lang] || LABELS.en;
  const fpLabel = L.fp[fortunePattern] || fortunePattern;

  return `
## ${L.userData}

### ${L.baziDim}
- ${L.dayMaster}: ${dayMaster}
- ${L.yearPillar}: ${bazi.sizhu.year.join(' ')}
- ${L.monthPillar}: ${bazi.sizhu.month.join(' ')}
- ${L.dayPillar}: ${bazi.sizhu.day.join(' ')}
- ${L.wuxingDist}: Wood=${wood} Fire=${fire} Earth=${earth} Metal=${metal} Water=${water}
- ${L.fortuneType}: ${fpLabel}

### ${L.zodiacDim}
- ${L.sunSign}: ${zodiac.sunSign || ''}
- ${L.signElement}: ${zodiac.sunSignElement || ''}
- ${L.signMode}: ${zodiac.sunSignMode || ''}
- ${L.ruler}: ${zodiac.sunSignRuler || ''}
- ${L.careerScore}: ${zodiacScore}

### ${L.tarotDim}
- ${L.drawn}: ${tarot.name} — ${tarot.orientation}

### ${L.ichingDim}
- ${L.hexagram}: ${iching.hexName || ''} (${iching.hexSymbol || ''})
- ${L.changedHex}: ${iching.transformedHexName || L.none}
- ${L.judgment}: ${iching.hexJudgment || ''}

${L.instruct}`;
}
var SYSTEM_PROMPTS = {
  zh: ZH_SYSTEM,
  en: EN_SYSTEM,
  es: ES_SYSTEM,
  fr: FR_SYSTEM,
  th: TH_SYSTEM,
  vi: VI_SYSTEM
};
async function callAI(systemPrompt, userPrompt, env) {
  // 🎯 走 Cloudflare Worker 代理（绕开 Vercel 出站网络问题）
  const workerUrl = "https://rough-bush-3e49.shanzi1800.workers.dev";
  try {
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1200
      })
    });
    if (res.ok) {
      const d = await res.json();
      return d.choices?.[0]?.message?.content?.trim() || "";
    }
    const errText = await res.text();
    console.error("[callAI] Cloudflare Worker failed, trying Gemini directly:", errText);
  } catch (e) {
    console.error("[callAI] Cloudflare Worker threw, trying Gemini directly:", e.message);
  }
  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.3, maxOutputTokens: 1200 }
        })
      });
      if (res.ok) {
        const d = await res.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {
      console.error("Gemini fallback also failed:", e.message);
    }
  }
  if (dsKey) {
    throw new Error("Both DeepSeek and Gemini failed");
  }
  throw new Error("No AI API key. Set DEEPSEEK_API_KEY or GEMINI_API_KEY.");
}
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  try {
    let body;
    if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
    }
    const { birthDate, lang = "zh", referrer = "standalone", reportType } = body;
    if (!birthDate) {
      return res.status(400).json({ error: "Missing birthDate (format: YYYY-MM-DD)" });
    }
    const [year, month, day] = birthDate.split("-").map(Number);
    const birthInfo = { year, month, day, hour: 12, minute: 0 };
    const normalizedLang = normalizeLang(lang) || "zh";
    const individualData = getIndividualData(birthInfo, normalizedLang);
    const tarotData = getWealthTarot(birthDate, normalizedLang);

    // ── Per-plan access control: wealth AI insight ──
    let paidPlans = {};
    let hasWealthAccess = false;
    let wealthAccessMethod = null; // 'wealth_once' | 'wealth_monthly_report' | 'wealth_yearly_report' | 'star_monthly_vip' | 'all_pass_yearly'
    let currentUserId = null;
    const now = new Date();

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (token) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;
        const anonKey = process.env.SUPABASE_ANON_KEY;

        const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: { 'Authorization': `Bearer ${token}`, 'apikey': anonKey || serviceKey },
        });
        if (userRes.ok) {
          const { id: userId } = await userRes.json();
          currentUserId = userId;
          const profileRes = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=paid_plans&limit=1`,
            { headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey } }
          );
          const profiles = await profileRes.json();
          paidPlans = profiles?.[0]?.paid_plans || {};

          // ── Access check chain: first match wins ──

          // ① wealth_once (one-time)
          if (paidPlans.wealth_once === true) {
            hasWealthAccess = true;
            wealthAccessMethod = 'wealth_once';
          }

          // ② wealth_monthly_report (one-time, standalone)
          if (!hasWealthAccess && paidPlans.wealth_monthly_report === true) {
            hasWealthAccess = true;
            wealthAccessMethod = 'wealth_monthly_report';
          }

          // ③ wealth_yearly_report (one-time, standalone)
          if (!hasWealthAccess && paidPlans.wealth_yearly_report === true) {
            hasWealthAccess = true;
            wealthAccessMethod = 'wealth_yearly_report';
          }

          // ④ star_monthly_vip with remaining wealth quota
          if (!hasWealthAccess && paidPlans.star_monthly_vip === true) {
            const used = paidPlans.star_monthly_wealth_used || 0;
            const allowance = paidPlans.star_monthly_wealth_allowance || 0;
            const resetsAt = paidPlans.star_monthly_resets_at;
            if (used < allowance && resetsAt && now < new Date(resetsAt)) {
              hasWealthAccess = true;
              wealthAccessMethod = 'star_monthly_vip';
            }
          }

          // ⑤ all_pass_yearly (每月5次虚拟配额，可累计，封顶60次)
          if (!hasWealthAccess && paidPlans.all_pass_yearly === true) {
            const expiresAt = paidPlans.all_pass_expires_at;
            if (!expiresAt || now < new Date(expiresAt)) {
              // 虚拟配额：按激活月份无感计算
              const activatedAt = paidPlans.all_pass_activated_at
                ? new Date(paidPlans.all_pass_activated_at)
                : new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
              const monthsSinceActivation = Math.max(0,
                (now.getUTCFullYear() - activatedAt.getUTCFullYear()) * 12 +
                (now.getUTCMonth() - activatedAt.getUTCMonth())
              );
              const currentTotalQuota = Math.min((monthsSinceActivation + 1) * 5, 60);
              const usedCount = paidPlans.all_pass_wealth_used || 0;
              if (usedCount >= currentTotalQuota) {
                const nextQuotaDate = new Date(
                  activatedAt.getUTCFullYear(),
                  activatedAt.getUTCMonth() + monthsSinceActivation + 1, 1
                );
                return res.status(429).json({
                  error: 'Monthly quota exhausted',
                  code: 'ALL_PASS_WEALTH_MONTHLY_QUOTA_EXCEEDED',
                  message: '您的本月 VIP 客盘配额已用完。下月 1 日将自动注入新一轮 5 次额度。',
                  nextInjection: nextQuotaDate.toISOString(),
                  quotaUsed: usedCount,
                  quotaTotal: currentTotalQuota,
                });
              }
              hasWealthAccess = true;
              wealthAccessMethod = 'all_pass_yearly';
            }
          }
        }
      }
    } catch (accessErr) {
      console.warn('[Wealth Oracle] access check error:', accessErr.message);
    }

    if (!hasWealthAccess) {
      return res.status(402).json({
        error: 'Payment required',
        requiredPlan: 'wealth_monthly_report',
        data: {
          bazi: individualData.bazi,
          zodiac: individualData.zodiac,
          iching: individualData.iching,
          tarot: tarotData
        },
        preview: true,
      });
    }

    // ── Report generation quota check (年卡至尊权益落地) ──
    if (reportType === 'monthly' && currentUserId) {
      const lastMonthlyGen = paidPlans.monthly_wealth_report_generated_at;
      if (lastMonthlyGen) {
        const lastGenDate = new Date(lastMonthlyGen);
        const nowDate = new Date();
        const sameMonth = lastGenDate.getUTCFullYear() === nowDate.getUTCFullYear() &&
                         lastGenDate.getUTCMonth() === nowDate.getUTCMonth();
        if (sameMonth) {
          return res.status(403).json({
            error: 'Monthly wealth report already generated this month',
            code: 'MONTHLY_WEALTH_REPORT_QUOTA_EXHAUSTED',
            nextAvailable: new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth() + 1, 1)).toISOString()
          });
        }
      }
    }

    if (reportType === 'yearly' && currentUserId && paidPlans) {
      // Solar Return 锚定：年报周期 = 用户生日的月-日 → 次年同一天
      // 需要从 user_profiles.birth_date 获取用户生日
      const userBirthDate = paidPlans.birth_date || null;
      if (userBirthDate) {
        const [birthYear, birthMonth, birthDay] = userBirthDate.split('-').map(Number);
        const nowDate = new Date();
        const currentYear = nowDate.getUTCFullYear();
        
        // 计算今年的 Solar Return 日期（用户生日的月-日）
        const thisYearSolarReturn = new Date(Date.UTC(currentYear, birthMonth - 1, birthDay, 0, 0, 0, 0));
        
        // 确定当前所处的 Solar Return 周期
        let cycleStart, cycleEnd;
        if (nowDate >= thisYearSolarReturn) {
          // 当前日期在生日当天或之后，使用今年的 Solar Return 作为起点
          cycleStart = thisYearSolarReturn;
          cycleEnd = new Date(Date.UTC(currentYear + 1, birthMonth - 1, birthDay, 0, 0, 0, 0));
        } else {
          // 当前日期在生日之前，说明还处于上一个 Solar Return 周期
          cycleStart = new Date(Date.UTC(currentYear - 1, birthMonth - 1, birthDay, 0, 0, 0, 0));
          cycleEnd = thisYearSolarReturn;
        }
        
        const lastYearlyGen = paidPlans.yearly_wealth_report_generated_at;
        if (lastYearlyGen) {
          const lastGenDate = new Date(lastYearlyGen);
          // 检查上次生成是否在当前 Solar Return 周期内
          if (lastGenDate >= cycleStart && lastGenDate < cycleEnd) {
            return res.status(403).json({
              error: 'Yearly wealth report already generated for this Solar Return cycle',
              code: 'YEARLY_WEALTH_REPORT_QUOTA_EXHAUSTED',
              solarReturnStart: cycleStart.toISOString(),
              solarReturnEnd: cycleEnd.toISOString(),
              nextAvailable: cycleEnd.toISOString()
            });
          }
        }
      }
    }

    // ── Global rate limit: max 10 calls per user per day ──
    const dailyCallCount = paidPlans.daily_wealth_call_count || 0;
    const dailyCallResetAt = paidPlans.daily_wealth_call_resets_at;
    // 复用前面已声明的 now 变量（line 2597）
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const isSameDay = dailyCallResetAt && new Date(dailyCallResetAt).getTime() === todayUTC.getTime();

    if (isSameDay && dailyCallCount >= 10) {
      return res.status(429).json({
        error: 'Daily wealth AI call limit exceeded',
        code: 'DAILY_WEALTH_RATE_LIMIT_EXCEEDED',
        limit: 10,
        resetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)).toISOString()
      });
    }

    // Update daily call counter
    const updatedDailyPlans = {
      ...paidPlans,
      daily_wealth_call_count: isSameDay ? (dailyCallCount + 1) : 1,
      daily_wealth_call_resets_at: todayUTC.toISOString(),
    };
    paidPlans = updatedDailyPlans;

    // ── 🛡️ 军师级主星盘死锁：wealth_once 永久缓存防线 ──
    // wealth_once 用户：按 user_id 永久缓存，后续访问 0 AI 消耗，0 计数
    let insight = null;
    if (wealthAccessMethod === 'wealth_once' && currentUserId && supabase) {
      const { data: permanentCache } = await supabase
        .from('wealth_insights_cache')
        .select('insight')
        .eq('user_id', currentUserId)
        .eq('is_permanent', true)
        .single();
      if (permanentCache?.insight) {
        console.log('[Wealth Oracle] 🛡️ wealth_once 永久缓存命中 — 0 Token 消耗:', currentUserId);
        insight = permanentCache.insight;
      } else {
        console.log('[Wealth Oracle] 🛡️ wealth_once 首次生成，永久锁定中...');
      }
    }

    // ── 普通缓存逻辑（24h TTL，供其他付费用户使用）─
    if (!insight && supabase) {
      const cacheTTL = (typeof CACHE_TTL_HOURS === 'number' ? CACHE_TTL_HOURS : 24) * 60 * 60 * 1000;
      const { data: cached } = await supabase
        .from('wealth_insights_cache')
        .select('insight, call_count, prompt_version')
        .eq('birth_date', birthDate)
        .eq('lang', normalizedLang)
        .eq('report_type', reportType || null)
        .is('is_permanent', null)
        .gte('created_at', new Date(Date.now() - cacheTTL).toISOString())
        .single();
      if (cached?.insight && cached?.prompt_version === PROMPT_VERSION) {
        console.log('[Wealth Oracle] Cache hit (version', PROMPT_VERSION, '):', birthDate, normalizedLang);
        insight = cached.insight;
      } else {
        console.log('[Wealth Oracle] Cache miss or version mismatch:', cached?.prompt_version, '!==', PROMPT_VERSION);
      }
    }

    // ── Only call AI and increment quota if cache miss ──
    if (!insight) {
      // 💰 Deduct quota BEFORE calling AI (prevent double-spend)
      if (wealthAccessMethod === 'star_monthly_vip' && currentUserId) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;
        const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
        const updatedPlans = {
          ...paidPlans,
          star_monthly_wealth_used: (paidPlans.star_monthly_wealth_used || 0) + 1,
          star_monthly_resets_at: paidPlans.star_monthly_resets_at || nextMonthStart.toISOString(),
        };
        try {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(currentUserId)}`, {
            method: 'PATCH',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ paid_plans: updatedPlans }),
          });
        } catch (incrErr) {
          console.error('[Wealth Oracle] Failed to increment star_monthly_wealth_used:', incrErr.message);
        }
      }

      insight = await callAI(systemPrompt, userPrompt, process.env);
      // ⑥ 记录 all_pass_yearly 配额消耗
      if (wealthAccessMethod === 'all_pass_yearly' && currentUserId) {
        try {
          await fetch(`${process.env.SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(currentUserId)}`, {
            method: 'PATCH',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              paid_plans: {
                ...paidPlans,
                all_pass_wealth_used: (paidPlans.all_pass_wealth_used || 0) + 1,
              }
            }),
          });
        } catch (quotaErr) {
          console.error('[Wealth Oracle] Failed to record all_pass quota:', quotaErr.message);
        }
      }
      // Save/update cache
      if (supabase) {
        if (wealthAccessMethod === 'wealth_once' && currentUserId) {
          // 🛡️ wealth_once 永久缓存：按 user_id 写入，不限 TTL
          await supabase
            .from('wealth_insights_cache')
            .upsert(
              { user_id: currentUserId, birth_date: birthDate, lang: normalizedLang, report_type: reportType || null, insight, model: 'deepseek-v3', call_count: 1, prompt_version: PROMPT_VERSION, is_permanent: true },
              { onConflict: 'user_id,is_permanent' }
            );
          console.log('[Wealth Oracle] 🛡️ wealth_once 永久缓存已锁定:', currentUserId);
        } else {
          // 普通用户：24h TTL 缓存
          const { data: existing } = await supabase
            .from('wealth_insights_cache')
            .select('call_count')
            .eq('birth_date', birthDate)
            .eq('lang', normalizedLang)
            .eq('report_type', reportType || null)
            .is('is_permanent', null)
            .single();
          const newCount = (existing?.call_count || 0) + 1;
          await supabase
            .from('wealth_insights_cache')
            .upsert(
              { birth_date: birthDate, lang: normalizedLang, report_type: reportType || null, insight, model: 'deepseek-v3', call_count: newCount, prompt_version: PROMPT_VERSION },
              { onConflict: 'birth_date,lang,report_type' }
            );
          console.log('[Wealth Oracle] Cache saved:', birthDate, normalizedLang, 'call #', newCount);
        }
      }
    } else {
      console.log('[Wealth Oracle] Cache hit — skipping AI call, no quota deducted');
    }
    }

    let cleanInsight = insight.replace(/^[\#\*\_\`\~]+/gm, "").replace(/\n{3,}/g, "\n\n").trim();
    const crossLink = referrer === "compatibility" ? '<p>\u{1F4A1} \u4F60\u7684\u8D22\u5BCC\u8FD0\u52BF\u548C\u611F\u60C5\u80FD\u91CF\u573A\u662F\u8054\u52A8\u7684\u2014\u2014\u5F53\u611F\u60C5\u72B6\u6001\u7A33\u5B9A\u65F6\uFF0C\u5438\u91D1\u80FD\u529B\u81EA\u7136\u63D0\u5347\u3002\u5982\u679C\u4F60\u6709\u4F34\u4FA3\uFF0C\u5EFA\u8BAE\u5BF9\u6BD4\u4F60\u4EEC\u7684\u5408\u76D8\uFF0C\u770B\u770BTA\u7684\u516B\u5B57\u662F\u5426\u6B63\u5728\u5E2E\u4F60\u8865\u8D22\u661F\u7F3A\u53E3\u3002<a href="/">\u2192 \u56DE\u5408\u5A5A\u62A5\u544A</a></p>' : "";
    const finalOutput = cleanInsight + crossLink;
    // ── Update report generation timestamp (if reportType specified) ──
    if (reportType && currentUserId) {
      const timestampField = reportType === 'monthly' ? 'monthly_wealth_report_generated_at' : 'yearly_wealth_report_generated_at';
      const updatedPlans = {
        ...paidPlans,
        [timestampField]: new Date().toISOString(),
      };
      try {
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(currentUserId)}`, {
          method: 'PATCH',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ paid_plans: updatedPlans }),
        });
      } catch (updateErr) {
        console.error('[Wealth Oracle] Failed to update report timestamp:', updateErr.message);
      }
    }

    // ── 主星盘死锁逻辑（军师终局裁决）──
    // 1. 首次测算：写入 birth_date 作为【宿命主星盘】
    // 2. 他人客盘：放行生成，但绝对不刷库！
    if (currentUserId && birthDate) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_KEY;
      try {
        // 查询当前用户的主星盘生日
        const profileRes = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(currentUserId)}&select=birth_date&limit=1`,
          {
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
            },
          }
        );
        const profileData = await profileRes.json();
        const existingBirthDate = profileData?.[0]?.birth_date;

        if (!existingBirthDate) {
          // 首次落锁：写入主星盘生日
          await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(currentUserId)}`, {
            method: 'PATCH',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ birth_date: birthDate }),
          });
          console.log('[Wealth Oracle] 🔒 Master Chart locked:', birthDate);
        } else if (existingBirthDate !== birthDate) {
          // 他人客盘测算：保护主星盘，不刷库
          console.log('[Wealth Oracle] 🌟 Guest calculation detected. Protecting Master Chart birth_date:', existingBirthDate);
        }
      } catch (saveErr) {
        console.error('[Wealth Oracle] Failed to check/save birth_date:', saveErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      birthDate,
      lang: normalizedLang,
      data: {
        bazi: individualData.bazi,
        zodiac: individualData.zodiac,
        iching: individualData.iching,
        tarot: tarotData
      },
      insight: finalOutput,
      referrer
    });
  } catch (error) {
    console.error("Wealth Oracle Error:", error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
export {
  handler as default
};
