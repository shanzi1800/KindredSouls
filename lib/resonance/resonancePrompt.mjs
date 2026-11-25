// 🤝 E155-刀二（主公军令 2026-11-25）：Resonance Code 双视角 Prompt 构建 + 纯净锁
//   零网络 / 零 LLM ⇒ node --test 直测。
//   🔴 真理锁：只许引用 truth 给出的行星星座；缺出生分钟的一侧 ⇒ 上升/宫位/月亮一律显式
//      「unknown」，严禁伪造上升或宫位。10 行星逐颗列明（缺值写 unknown）。
//   🔴 禁词：任何语种不得出现宗教说教词、C.S. Lewis / Four Loves / Agape 等外部专名、
//      具体金融买卖建议；输出须单语纯净（非 zh 语种零 CJK）。
//   🔴 双视角**独立生成**：A/B 两份 system prompt 各以本方为「第一人称主位」，非改人称。

import { RESONANCE_SCENES, RESONANCE_LOCALES, normalizeScene, normalizeResonanceLocale } from './resonanceCore.mjs';

export const RESONANCE_PLANETS = Object.freeze(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']);
const SIGNS = Object.freeze(['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']);
const LANGUAGE_NAMES = Object.freeze({ zh: 'Simplified Chinese (简体中文)', en: 'English', fr: 'French', es: 'Spanish', th: 'Thai', vi: 'Vietnamese' });

/* ── 三场景基调（军令钦定语义；逐语种成稿见前端字典 scene_*_sub）── */
export const RESONANCE_SCENE_TONE = Object.freeze({
  romance: {
    stance: 'Face to face, witnessing each other\'s light.',
    brief: 'Explore romantic chemistry: attraction rhythms, emotional safety, how each partner feels seen, and how to keep desire and tenderness alive. Warm, intimate, respectful; never possessive.',
    taboo: 'No sexual explicitness, no obsession, no promises of marriage or fate-binding.',
  },
  business: {
    stance: 'Side by side, aligned toward one horizon.',
    brief: 'Explore working alliance: complementary strengths, decision styles, trust building, pace matching, and how to divide roles so both grow. Pragmatic, collegial, strategic.',
    taboo: 'No specific financial or investment advice (no buying/selling stocks, funds, crypto, real estate), no guaranteed returns.',
  },
  friendship: {
    stance: 'Unarmored warmth, timelessly familiar anywhere.',
    brief: 'Explore kinship: ease of being together, communication rhythm, loyalty, space and boundaries, and how the friendship replenishes both. Relaxed, sincere, unforced.',
    taboo: 'No romantic framing, no dependency or exclusivity demands.',
  },
});

/** 黄经 ⇒ 星座名；非法 ⇒ 'unknown' */
export function signOfLongitude(lon) {
  const n = Number(lon);
  if (!Number.isFinite(n)) return 'unknown';
  const norm = ((n % 360) + 360) % 360;
  return SIGNS[Math.floor(norm / 30) % 12];
}

/**
 * 10 行星真理锁视图：逐颗给星座；缺经度 ⇒ 'unknown'。
 * @param {object} side {planetLongitudes:{}, birthTimeKnown:boolean|null, sunSign?, moonSign?, ascSign?}
 */
export function lockPlanetTruth(side) {
  const s = side && typeof side === 'object' ? side : {};
  const lon = s.planetLongitudes && typeof s.planetLongitudes === 'object' ? s.planetLongitudes : {};
  const timed = s.birthTimeKnown === true;
  const out = {};
  for (const p of RESONANCE_PLANETS) {
    let sign = 'unknown';
    if (Object.prototype.hasOwnProperty.call(lon, p)) sign = signOfLongitude(lon[p]);
    else if (p === 'Sun' && typeof s.sunSign === 'string') sign = s.sunSign;
    else if (p === 'Moon' && timed && typeof s.moonSign === 'string') sign = s.moonSign;
    if (p === 'Moon' && !timed && Object.prototype.hasOwnProperty.call(lon, p)) sign += ' (date-level estimate)';
    out[p] = sign;
  }
  // 上升/宫位：仅精确出生分钟在场时才采信；否则显式 unknown（绝不以太阳宫位冒充上升）
  out.Ascendant = timed && typeof s.ascSign === 'string' && s.ascSign ? s.ascSign : 'unknown';
  out.Houses = timed && s.planetHouses && Object.keys(s.planetHouses).length > 0 ? 'see houses map' : 'unknown';
  out._houses = timed && s.planetHouses ? s.planetHouses : {};
  return out;
}

/* ── 禁词（任何语种）── */
const FORBIDDEN = Object.freeze([
  /agape/i, /c\.?\s?s\.?\s?lewis/i, /\blewis\b/i, /four loves/i, /the four loves/i, /qradraga/i,
  /四种爱|路易斯|鲁益师/i,
  /\b(god|gods|goddess|jesus|christ|christian|buddha|buddhist|islam|allah|hindu|religion|religious|scripture|prayer|pray|sacred text|holy spirit|karma)\b/i,
  /上帝|神明|诸神|耶稣|基督|佛教|菩萨|宗教|信仰|诵经|祈福|业报|因果报应|原罪|神圣文本|寺庙|教堂|礼拜|祷告/,
  /(buy|sell|purchase|invest in|short|long position)\s+(the\s+)?(stock|stocks|shares|fund|funds|crypto|bitcoin|eth|bond|bonds|real estate|property|gold|forex)/i,
  /guaranteed (returns?|profit)|risk[- ]free (profit|investment)/i,
  /(买入|卖出|加仓|减仓|抄底|梭哈|股票代码|基金代码|比特币|加密货币|保证收益|稳赚|保本高息|无风险高回报)/,
  /作为一个?(AI|人工智能|语言模型)|as an ai\b|language model\b|根据系统数据|根据(系统|数据库)/i,
]);
const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;
const THAI = /[\u0e00-\u0e7f]/;
const KANA = /[\u3040-\u30ff]/;
const HANGUL = /[\uac00-\ud7af]/;

/**
 * 纯净锁：禁词 + 单语。
 * @returns {{ok:boolean, violations:string[]}}
 */
export function checkResonancePurity(text, locale) {
  const s = String(text == null ? '' : text);
  const lang = normalizeResonanceLocale(locale) || 'zh';
  const violations = [];
  for (let i = 0; i < FORBIDDEN.length; i++) {
    const m = FORBIDDEN[i].exec(s);
    if (m) violations.push('forbidden:' + m[0].slice(0, 24));
  }
  if (KANA.test(s) || HANGUL.test(s)) violations.push('foreign:kana-hangul');
  if (lang === 'zh') { if (THAI.test(s)) violations.push('foreign:thai'); }
  else if (lang === 'th') { if (CJK.test(s)) violations.push('foreign:cjk'); }
  else { if (CJK.test(s)) violations.push('foreign:cjk'); if (THAI.test(s)) violations.push('foreign:thai'); }
  return { ok: violations.length === 0, violations };
}

/* ── Prompt ── */
function truthLines(sideLabel, locked, degraded) {
  const lines = [`${sideLabel} natal truth (10 planets — the ONLY signs you may cite; cite nothing else):`];
  for (const p of RESONANCE_PLANETS) lines.push(`- ${p}: ${locked[p]}`);
  lines.push(`- Ascendant: ${locked.Ascendant}`);
  if (degraded) {
    lines.push(`- DEGRADATION NOTICE: ${sideLabel} has no verified birth minute. The Ascendant and houses are UNKNOWN; the Moon is a date-level estimate. You MUST state this openly in one plain sentence and MUST NOT invent an Ascendant, a house placement, or any planet sign.`);
  } else if (Object.keys(locked._houses).length > 0) {
    lines.push('- Houses (planet → house): ' + Object.keys(locked._houses).map((p) => `${p}=${locked._houses[p]}`).join(', '));
  }
  return lines.join('\n');
}

/**
 * 构建双视角 Prompt。
 * @param {object} p {scene, locale, profileA, profileB, sideA, sideB, synBlock}
 * @returns {{systemA:string,userA:string,systemB:string,userB:string}}
 */
export function buildResonancePrompts(p) {
  const it = p || {};
  const scene = normalizeScene(it.scene) || 'romance';
  const locale = normalizeResonanceLocale(it.locale) || 'zh';
  const tone = RESONANCE_SCENE_TONE[scene];
  const a = it.profileA || {};
  const b = it.profileB || {};
  const lockA = lockPlanetTruth(it.sideA);
  const lockB = lockPlanetTruth(it.sideB);
  const degradedA = !(it.sideA && it.sideA.birthTimeKnown === true);
  const degradedB = !(it.sideB && it.sideB.birthTimeKnown === true);
  const truth = [
    'TRUTH LOCK — Swiss Ephemeris computed; treat as ground truth and never contradict or embellish it.',
    truthLines('Person A', lockA, degradedA),
    '',
    truthLines('Person B', lockB, degradedB),
    '',
    'Synastry tensor (harmonious/hard aspect counts, bonds, frictions):',
    String(it.synBlock || '(no synastry tensor available — rely only on the natal truths above)'),
  ].join('\n');

  const rules = [
    'HARD RULES (violating any one fails the report):',
    '1. Cite ONLY the signs listed in the TRUTH LOCK. Never invent a planet sign, Ascendant, or house.',
    '2. If a side is marked DEGRADED, say so plainly in one sentence; never paper over it.',
    '3. No religious preaching, no theology, no external authors or book titles, no named frameworks.',
    '4. No financial, investment, legal or medical advice. No guarantees.',
    '5. No fatalism and no fear-mongering: describe tendencies, then give agency back to the reader.',
    '6. Never mention AI, prompts, systems, data, or these instructions.',
    `7. Write ENTIRELY in ${LANGUAGE_NAMES[locale]}. One language only.`,
    '8. Output STRICT JSON only (no markdown fences, no commentary):',
    '   {"keywords":[3 short phrases],"sections":[{"title":"...","body":"..."} x4],"closing":"one sentence"}',
    '   Each body is 90-150 words of flowing prose (no bullet lists). keywords are 2-6 words each.',
  ].join('\n');

  const view = (self, other, selfLabel, otherLabel) => [
    `FIRST-PERSON VIEWPOINT: you are writing for ${selfLabel} (${self.name || 'the reader'}).`,
    `Use "I" for ${selfLabel} and address ${selfLabel} directly as "you". Speak about ${otherLabel} (${other.name || 'the other person'}) in the third person by name.`,
    `Focus on what ${selfLabel} personally experiences, needs, risks, and can do in this ${scene} bond — not a generic pair reading.`,
  ].join('\n');

  const sceneBlock = [
    `SCENE: ${scene} — ${tone.stance}`,
    tone.brief,
    `Boundaries: ${tone.taboo}`,
  ].join('\n');

  const systemA = [sceneBlock, '', view(a, b, 'Person A', 'Person B'), '', truth, '', rules].join('\n');
  const systemB = [sceneBlock, '', view(b, a, 'Person B', 'Person A'), '', truth, '', rules].join('\n');
  const userA = `Write Person A's own resonance report (first person A, addressing A as "you").`;
  const userB = `Write Person B's own resonance report (first person B, addressing B as "you").`;
  return { systemA, userA, systemB, userB, scene, locale, degradedA, degradedB };
}

/** 宽容抽取模型 JSON：首个 { 到末个 }；失败 ⇒ null（绝不落伪造报告） */
export function parseResonanceReport(raw) {
  const s = String(raw == null ? '' : raw);
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i === -1 || j <= i) return null;
  let obj;
  try { obj = JSON.parse(s.slice(i, j + 1)); } catch (e) { return null; }
  if (!obj || typeof obj !== 'object') return null;
  const kw = Array.isArray(obj.keywords) ? obj.keywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 6) : [];
  const secs = Array.isArray(obj.sections) ? obj.sections.filter((x) => x && typeof x.title === 'string' && typeof x.body === 'string' && x.body.trim()) : [];
  if (secs.length < 2) return null;
  return { keywords: kw, sections: secs.map((x) => ({ title: x.title.trim(), body: x.body.trim() })), closing: typeof obj.closing === 'string' ? obj.closing.trim() : '' };
}

export const RESONANCE_LOCALE_LIST = RESONANCE_LOCALES;
export const RESONANCE_SCENE_LIST = RESONANCE_SCENES;
