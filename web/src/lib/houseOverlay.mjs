/**
 * houseOverlay.mjs — 合盘「宫位交互网格」纯派生核（Gate 44 · 甲线 · 画布视觉二期）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军师令（方向 B · 视觉二期精修）：把「双人落宫」这一最复杂的星盘对应关系，
 * 译成一张 4×3 的宫位交互网格 —— 一眼看清灵宠与你在哪些生活领域深刻共鸣。
 *
 * 🔴 三条纪律（与全仓铁律同源）：
 *   ① 零硬编码术语 —— 行星/学说词条一律经 termRef() 硬查字典（planetsShort / familiar 域），禁机翻；
 *   ② 零脑补 —— 宫位真值缺失（date_level / 未采到）⇒ available:false + return null，
 *      绝不臆造宫位号、绝不虚构连线（缺任一宫位 ⇒ 该连线整条剔除）；
 *   ③ 纯派生 —— 12 宫格/共鸣判定/连线序皆由真值确定性推导（同输入同输出，可单测）。
 *
 * 🔴 纯逻辑核：零 import / 零网络 / 零 DOM / 零 LLM。
 *    字典（astro_terms_dict.json 派生物）由调用方**注入** ⇒ Node 可直接 import 本模块单测。
 *
 * 真值来路：服务端信封旁置字段 `houseOverlay`（源自 astroMatrix.meta.computed_houses），
 *          与 payload 并列独立通道 —— payload 契约双向键集零污染（Gate 40 封仓不动）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 十二宫罗马数字（通用占星记法，语言中立 ⇒ 非翻译产物，无需入字典） */
export const HOUSE_NUMERALS = Object.freeze([
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
]);

/** 宫位总数（4×3 网格 = 12 宫） */
export const HOUSE_TOTAL = 12;

/** 网格列数（4 列 × 3 行） */
export const GRID_COLS = 4;

/** 十主星规范序（引擎英文键）—— 网格 chip 排序真源，禁随机序 */
export const PLANET_ORDER = Object.freeze([
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
]);

/** 字典取词（唯一取词入口）—— 缺域/缺键/空值 ⇒ null（拒绝静默伪造） */
export function termRef(dict, domain, key, lang) {
  const dom = dict && dict.domains && dict.domains[domain];
  if (!dom || !dom[key]) return null;
  const langs = (dict.meta && Array.isArray(dict.meta.langs)) ? dict.meta.langs : null;
  const L = (langs && !langs.includes(lang)) ? 'zh' : lang;
  const label = dom[key][L];
  if (typeof label !== 'string' || label === '') return null;
  const slot = (dict.slots && dict.slots.assignment && dict.slots.assignment[domain]) || 'chip';
  return { domain, key, label, slot };
}

/** 宫位号合法性（1..12 整数；否则 null —— 绝不臆造） */
export function houseOf(v) {
  return (Number.isInteger(v) && v >= 1 && v <= HOUSE_TOTAL) ? v : null;
}

const _planetRef = (key, lang, dict) => {
  const r = termRef(dict, 'planetsShort', key, lang);
  return r ? { key, label: r.label } : null;
};

/**
 * 派生 12 宫位交互网格模型。
 * @param payload    report_payload.v1（取 cards 相位项做星轨连线）
 * @param houseTruth 信封旁置字段 houseOverlay（{available, precision, a:{Planet:house}, b:{...}}）
 * @param dict       字典真值（astro_terms_dict.json 或前端派生物 ASTRO_TERMS）
 * @returns 网格模型；缺真值/入参非法 ⇒ null（前端优雅不渲染，绝不渲染 undefined/NaN）
 */
export function deriveHouseOverlay(payload, houseTruth, dict) {
  if (!payload || typeof payload !== 'object') return null;
  const t = payload.truth;
  if (!t || typeof t !== 'object' || !t.available) return null;
  if (!houseTruth || typeof houseTruth !== 'object' || houseTruth.available !== true) return null;
  const mapA = (houseTruth.a && typeof houseTruth.a === 'object' && !Array.isArray(houseTruth.a)) ? houseTruth.a : null;
  const mapB = (houseTruth.b && typeof houseTruth.b === 'object' && !Array.isArray(houseTruth.b)) ? houseTruth.b : null;
  if (!mapA || !mapB) return null;
  // 🔴 空映射（{}）如同缺真值 —— 拒绝臆造「空网格」（绝不把「没采到」渲染成「十二宫皆空」）
  if (Object.keys(mapA).length === 0 || Object.keys(mapB).length === 0) return null;
  const lang = typeof payload.lang === 'string' ? payload.lang : 'zh';

  /* ① 12 宫格 —— 宫内行星（双方）+ 共鸣判定（两侧同宫 ⇒ true） */
  const cells = [];
  for (let h = 1; h <= HOUSE_TOTAL; h++) {
    const a = PLANET_ORDER.filter((k) => houseOf(mapA[k]) === h)
      .map((k) => _planetRef(k, lang, dict)).filter(Boolean);
    const b = PLANET_ORDER.filter((k) => houseOf(mapB[k]) === h)
      .map((k) => _planetRef(k, lang, dict)).filter(Boolean);
    cells.push({
      house: h,
      numeral: HOUSE_NUMERALS[h - 1],
      a,
      b,
      resonance: a.length > 0 && b.length > 0,
    });
  }
  const resonanceCount = cells.filter((c) => c.resonance).length;

  /* ② 星轨连线 —— 真实相位 ⊗ 双方宫位上下文（缺任一宫位 ⇒ 整条剔除） */
  const links = [];
  const cards = Array.isArray(payload.cards) ? payload.cards : [];
  for (const c of cards) {
    if (!c || !Array.isArray(c.items)) continue;
    const cardId = (typeof c.id === 'string' && c.id) ? c.id : 'card';
    for (const it of c.items) {
      if (!it || !it.a || !it.b) continue;
      const ha = houseOf(mapA[it.a.key]);
      const hb = houseOf(mapB[it.b.key]);
      if (!ha || !hb) continue;
      links.push({
        id: `${cardId}:${it.id}`,
        aLabel: it.a.label,
        bLabel: it.b.label,
        aspectLabel: (it.aspect && it.aspect.label) ? it.aspect.label : '',
        orb: (typeof it.orb === 'number' && Number.isFinite(it.orb)) ? it.orb : null,
        polarity: (it.polarity === 'harmonious' || it.polarity === 'hard') ? it.polarity : null,
        houseA: ha,
        houseB: hb,
        houseNumeralA: HOUSE_NUMERALS[ha - 1],
        houseNumeralB: HOUSE_NUMERALS[hb - 1],
      });
    }
  }
  /* 连线按真实天距升序（越近越先；缺 orb 者殿后） */
  links.sort((x, y) => {
    const ox = (x.orb == null) ? Number.POSITIVE_INFINITY : x.orb;
    const oy = (y.orb == null) ? Number.POSITIVE_INFINITY : y.orb;
    return ox - oy;
  });

  return {
    available: true,
    precision: (typeof houseTruth.precision === 'string') ? houseTruth.precision : null,
    title: termRef(dict, 'familiar', 'HouseOverlay', lang),
    resonanceLabel: termRef(dict, 'familiar', 'HouseResonance', lang),
    legend: {
      self: termRef(dict, 'familiar', 'HouseSelf', lang),
      familiar: termRef(dict, 'familiar', 'Familiar', lang),
    },
    numerals: [...HOUSE_NUMERALS],
    cols: GRID_COLS,
    cells,
    resonanceCount,
    links,
  };
}
