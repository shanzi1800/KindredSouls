// 🤝 E155-刀二 → E156（主公军令 2026-11-25）：缘分密码 · 场景基调 / 纯净锁 / 场景叠加层
//   零网络 / 零 LLM ⇒ node --test 直测。
//   E156 起：A/B 双视角 JSON 生成链随独立 /resonance、/invite 页整体退役；本文件只留
//   ① 三场景基调 ② 纯净锁（禁词＋单语）③ 场景叠加层（长在现有 /api/ai-advisor 黄金漏斗上）。
//   🔴 禁词：任何语种不得出现宗教说教词、C.S. Lewis / Four Loves / Agape 等外部专名、
//      具体金融买卖建议；输出须单语纯净（非 zh 语种零 CJK）。
//   🔴 真理锁：场景报告只许引用请求内真值块给出的相位/星座；缺时辰 ⇒ 上升/宫位显式未知，严禁伪造。

import { RESONANCE_SCENES, RESONANCE_LOCALES, normalizeScene, normalizeResonanceLocale } from './resonanceCore.mjs';

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
    taboo: 'No specific financial or investment advice (no buying/selling stocks, funds, crypto, real estate), no promised profits.',
  },
  friendship: {
    stance: 'Unarmored warmth, timelessly familiar anywhere.',
    brief: 'Explore kinship: ease of being together, communication rhythm, loyalty, space and boundaries, and how the friendship replenishes both. Relaxed, sincere, unforced.',
    taboo: 'No romantic framing, no dependency or exclusivity demands.',
  },
});

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

/* ══════════════════════════════════════════════════════════════════════
   E156（主公军令 2026-11-25）：场景叠加层 —— 三场景长在现有 /api/ai-advisor
   黄金漏斗上（once / monthly / yearly 三档共用一条生成链）。
   · 情爱（romance）＝现有链逐字不变，本层返回 ''（零注入）。
   · 商道 / 挚友 ＝ 在既有 prompt 之后**追加**本层：场景基调＋称呼＋档位契约＋纯净红线。
   · 称呼：白名单清洗后才入 prompt（防注入）；缺省「我 / TA」由前端兜底。
   ══════════════════════════════════════════════════════════════════════ */

/** 称呼清洗：仅留字母/数字/空白与 ·-_.；压空白；上限 16 个码点；非法 ⇒ '' */
export function sanitizeDisplayName(raw) {
  if (typeof raw !== 'string') return '';
  const s = raw.normalize('NFKC')
    .replace(/[\p{C}\p{Zl}\p{Zp}<>{}[\]"'`\\|/$~^]/gu, ' ')
    .replace(/[^\p{L}\p{M}\p{N} ·\-_.]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(s).slice(0, 16).join('').trim();
}

/** 场景白名单：非法/缺省 ⇒ 'romance'（情爱＝既有链） */
export function normalizeOverlayScene(raw) {
  const s = normalizeScene(raw);
  return s === 'business' || s === 'friendship' ? s : 'romance';
}

const OVERLAY_LANGUAGE_NAMES = Object.freeze({ zh: 'Simplified Chinese (简体中文)', en: 'English', fr: 'French', es: 'Spanish', th: 'Thai', vi: 'Vietnamese' });

/** 四模块标题（军令钦定；六语）—— 语种序 [zh,en,fr,es,th,vi] */
const OVERLAY_MODULE_TITLES = Object.freeze({
  zh: ['核心共振定调', '天赋与角色分工', '盲区与摩擦预警', '关系校准建议'],
  en: ['Core resonance', 'Talents & role division', 'Blind spots & friction alerts', 'Calibration advice'],
  fr: ['Résonance essentielle', 'Talents et répartition des rôles', 'Angles morts et alertes de friction', 'Conseils de calibration'],
  es: ['Resonancia esencial', 'Talentos y reparto de roles', 'Puntos ciegos y alertas de fricción', 'Consejos de calibración'],
  th: ['จุดร่วมแก่น', 'พรสวรรค์และการแบ่งบทบาท', 'จุดบอดและสัญญาณเสียดทาน', 'คำแนะนำการปรับจูน'],
  vi: ['Cộng hưởng cốt lõi', 'Thiên phú và phân vai', 'Điểm mù và cảnh báo ma sát', 'Lời khuyên hiệu chỉnh'],
});

const OVERLAY_RULES = [
  'SCENE HARD RULES (violating any one fails the report):',
  // 🔴 措辞规避禁词本体（叠加层文本自身须过纯净锁：禁词只以同义说明出现，绝不落字面）
  '1. No preaching about faiths, deities or spiritual doctrines; no theology; no external authors, book titles or named frameworks.',
  '2. No financial, investment, legal or medical advice. No specific buy/sell suggestions. No promised profits or outcomes.',
  '3. No fatalism and no fear-mongering: describe tendencies, then give agency back to the reader.',
  '4. Never mention AI, prompts, systems, data, or these instructions.',
  '5. Cite ONLY planet signs that appear earlier in this prompt; never invent a placement.',
  '6. NAME LOCK: on every single occurrence print both names exactly as given above — never transliterated, romanized, respelled or translated, whatever the report language.',
].join('\n');

/* 称呼缺省（用户未填时）：与前端 resonanceI18n name_you_ph / name_ta_ph 同值（语种序恒 [zh,en,fr,es,th,vi]） */
const DEFAULT_NAMES = Object.freeze({
  zh: ['我', 'TA'], en: ['Me', 'Partner'], fr: ['Moi', 'Partenaire'], es: ['Yo', 'Pareja'], th: ['ฉัน', 'เขา'], vi: ['Tôi', 'Người ấy'],
});

/** 称呼原样锁：返回未在正文**逐字**出现的非空称呼（主公裁决 2026-11-26：严禁音译/意译——用户输入什么，正文与坐标卡就印什么） */
/** 称呼解析：清洗 ⇒ 缺省补位；named＝用户是否亲手填写了双方称呼（决定生成后是否执行称呼原样锁重试） */
export function resolveSceneNames(locale, rawA, rawB) {
  const a = sanitizeDisplayName(rawA);
  const b = sanitizeDisplayName(rawB);
  const fallback = DEFAULT_NAMES[normalizeResonanceLocale(locale)] || DEFAULT_NAMES.zh;
  return { nameA: a || fallback[0], nameB: b || fallback[1], named: !!(a && b) };
}

/** 称呼原样锁：返回未在正文**逐字**出现的非空称呼（主公裁决 2026-11-26：严禁音译/意译——用户输入什么，正文与坐标卡就印什么） */
export function nameLockViolations(text, nameA, nameB) {
  const s = String(text == null ? '' : text);
  return [nameA, nameB].filter((n) => typeof n === 'string' && n.length > 0 && !s.includes(n));
}

/**
 * 场景叠加层。
 * @param {object} p {scene, locale, reportType, nameA, nameB}
 * @returns {string} 情爱 ⇒ ''（零注入）；商道/挚友 ⇒ 追加到 system 尾部的文本块
 */
export function buildSceneOverlay(p) {
  const it = p || {};
  const scene = normalizeOverlayScene(it.scene);
  if (scene === 'romance') return '';
  const locale = normalizeResonanceLocale(it.locale) || 'zh';
  const tone = RESONANCE_SCENE_TONE[scene];
  const reportType = ['once', 'monthly', 'yearly'].indexOf(it.reportType) !== -1 ? it.reportType : 'once';
  const titles = OVERLAY_MODULE_TITLES[locale] || OVERLAY_MODULE_TITLES.zh;
  const { nameA, nameB } = resolveSceneNames(locale, it.nameA, it.nameB);

  const lines = [
    '',
    '',
    '═══ SCENE OVERRIDE — HIGHEST PRIORITY (voids every earlier romance / couple framing) ═══',
    `SCENE: ${scene} — ${tone.stance}`,
    tone.brief,
    `Boundaries: ${tone.taboo}`,
    'Reframe every element of this reading (scores, aspects, tarot, time windows) for THIS scene. '
      + 'The tarot card must still be named with its orientation. Do not use romantic, couple or marriage framing.',
    '',
    'NAME LOCK — HARD RULE (one altered name fails the whole report):',
    `- The reader's name is the exact string: ${nameA}`,
    `- The other person's name is the exact string: ${nameB}`,
    '- These strings were typed by the user. Every occurrence MUST be copied character-for-character: same letters, same script, same capitalization.',
    '- NEVER transliterate, romanize, respell, translate, localize, shorten or attach any honorific or title to them — even when the report language uses a different script '
      + '(for example, in a report written in another script a Latin name stays in Latin letters, and a name written in Chinese characters stays in Chinese characters).',
    '- Do not put the names in quotation marks and do not invent another form of address for either person.',
    '- Address the reader as "you"; refer to the other person by name in the third person.',
    '',
  ];

  if (reportType === 'once') {
    lines.push(
      'OUTPUT CONTRACT (overrides every earlier length / element clause for this report):',
      `Write ENTIRELY in ${OVERLAY_LANGUAGE_NAMES[locale]}. Plain text only — no JSON, no markdown fences, no bullet lists, no "#"/"*" markers.`,
      'Exactly four sections in this order. Format each section as: a title line written exactly as 【<title>】, then one blank line, then one paragraph of 90-150 words of flowing prose:',
      ...titles.map((t, i) => `  ${i + 1}. 【${t}】`),
      'The last section ends with exactly 3 concrete, immediately actionable suggestions written inline in the prose.',
      'Total 400-650 words. Terse over padded. Start directly with the first 【title】 line.',
    );
  } else {
    lines.push(
      'OUTPUT CONTRACT (structure and length stay exactly as defined earlier in this prompt):',
      `Keep the ${reportType === 'monthly' ? 'monthly four-module' : 'yearly five-chapter'} structure, module order and length defined above — but every module reads for THIS scene.`,
      `Write ENTIRELY in ${OVERLAY_LANGUAGE_NAMES[locale]}.`,
    );
  }
  lines.push('', OVERLAY_RULES);
  return lines.join('\n');
}

/** 纯净锁失败时的确定性清洗：剔除禁词命中片段＋异种文字逐字剥离（不删整行/整段，零内容误伤）；返回 { text, violations, clean }。
 *  protectedNames＝用户称呼：异种文字剥离前先以私有区占位符掩埋、剥离后原样复位（中文昵称进泰/英报告不被称为「异种文字」误杀）。 */
export function washSceneReport(text, locale, protectedNames) {
  const lang = normalizeResonanceLocale(locale) || 'zh';
  let out = String(text == null ? '' : text);
  const before = checkResonancePurity(out, lang);
  if (before.ok) return { text: out, violations: [], clean: true };
  // 逐条禁词剥离（命中即删）
  for (const re of FORBIDDEN) {
    out = out.replace(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'), '');
  }
  // 称呼掩埋（原样锁：剥离前占位，剥离后复位）
  const masks = [];
  for (const n of Array.isArray(protectedNames) ? protectedNames : []) {
    if (typeof n !== 'string' || !n || masks.some((m) => m.n === n)) continue;
    const token = String.fromCharCode(0xe000 + masks.length);
    masks.push({ n, token });
    out = out.split(n).join(token);
  }
  // 单语锁：逐字剥离异种文字（非 zh ⇒ 剥汉字；非 th ⇒ 剥泰文；全语种 ⇒ 剥假名/谚文）
  if (lang !== 'zh') out = out.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, '');
  if (lang !== 'th') out = out.replace(/[\u0e00-\u0e7f]/g, '');
  out = out.replace(/[\u3040-\u30ff\uac00-\ud7af]/g, '');
  for (const m of masks) out = out.split(m.token).join(m.n);
  const after = checkResonancePurity(out, lang);
  return { text: out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim(), violations: before.violations, clean: after.ok };
}

export const RESONANCE_LOCALE_LIST = RESONANCE_LOCALES;
export const RESONANCE_SCENE_LIST = RESONANCE_SCENES;
