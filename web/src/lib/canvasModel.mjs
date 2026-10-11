/**
 * canvasModel.mjs — 合盘画布「三卡视觉模型」纯派生核（Gate 42 · 甲线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军师令（画布视觉饱满度扩容）：将 payload 真值**纯粹派生**为三张高传播力卡片：
 *   ① 羁绊签名卡 BondSignatureCard —— 称号分档 + 调和占比 + 核心能量 Chip
 *   ② 命运契约卡 KarmicContractCard —— 交点/宿命点命中 ⇒ 契约态 + 箴言锚 + 命中虚点
 *   ③ 双星能量图谱 EnergyGrid      —— 亲密共振 / 情绪默契 / 领地磨合 三轴能量条
 *
 * 🔴 三条纪律（与全仓铁律同源）：
 *   ① 零硬编码术语 —— 一切展示词条经 termRef() 硬查字典（familiar / points 域），禁机翻；
 *   ② 零脑补 —— 无真值 ⇒ tier:null / known:false / value:null / sealed 如实，绝不用默认值填充；
 *   ③ 纯派生 —— 一切分档/分值/命中判定皆由 payload 确定性推导（同输入同输出，可单测）。
 *
 * 🔴 纯逻辑核：零 import / 零网络 / 零 DOM / 零 LLM。
 *    字典（astro_terms_dict.json 派生物）由调用方**注入** ⇒ Node 可直接 import 本模块单测。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ── ① 羁绊称号分档（闭集四档；ratio 非有限数 ⇒ null）───────────────────── */
export const BOND_TIERS = Object.freeze([
  { key: 'BondRadiant', floor: 0.6 },
  { key: 'BondHarmonic', floor: 0.4 },
  { key: 'BondTempered', floor: 0.2 },
  { key: 'BondTesting', floor: 0 },
]);

export function bondTierKey(ratio) {
  if (typeof ratio !== 'number' || !Number.isFinite(ratio)) return null;
  for (const t of BOND_TIERS) if (ratio >= t.floor) return t.key;
  return 'BondTesting';
}

/* ── ② 能量三轴定义（闭集三轴；行星集为引擎英文键）────────────────────── */
export const ENERGY_AXES = Object.freeze([
  { id: 'intimacy', termKey: 'IntimacyBond', planets: Object.freeze(['Venus', 'Mars', 'Pluto']) },
  { id: 'emotional', termKey: 'EmotionalSync', planets: Object.freeze(['Moon', 'Neptune']) },
  { id: 'territory', termKey: 'TerritoryFit', planets: Object.freeze(['Sun', 'Saturn', 'Jupiter']) },
]);

/* ── ③ 宿命点集合（交点 / 宿命点，取字典 points 域键）────────────────────── */
export const KARMIC_POINTS = Object.freeze(['NorthNode', 'Vertex']);

const clamp100 = (n) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * 字典取词（唯一取词入口）—— 缺域/缺键/空值 ⇒ null（拒绝静默伪造）。
 * @returns {{domain,key,label,slot}|null}
 */
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

/**
 * 派生画布三卡视觉模型。
 * @param payload report_payload.v1
 * @param dict    字典真值（astro_terms_dict.json 或前端派生物 ASTRO_TERMS）
 * @returns 三卡模型；不可用/入参非法 ⇒ null（前端优雅缺省，绝不渲染 undefined/NaN）
 */
export function deriveCanvasModel(payload, dict) {
  if (!payload || typeof payload !== 'object') return null;
  const t = payload.truth;
  if (!t || typeof t !== 'object' || !t.available) return null;
  const lang = typeof payload.lang === 'string' ? payload.lang : 'zh';

  // 相位项全集（跨卡展开，保留卡归属不再需要 ⇒ 仅取 item）
  const items = [];
  const cards = Array.isArray(payload.cards) ? payload.cards : [];
  for (const c of cards) {
    if (!c || !Array.isArray(c.items)) continue;
    for (const it of c.items) if (it && typeof it === 'object') items.push(it);
  }

  /* ① 羁绊签名卡 —— 称号分档 + 调和占比 + 核心能量 Chip（取柔和相位前三） */
  const tierKey = bondTierKey(t.ratio);
  const bondCard = cards.find((c) => c && c.id === 'bonds');
  const signature = {
    tierKey,
    tier: tierKey ? termRef(dict, 'familiar', tierKey, lang) : null,
    ratioPct: (typeof t.ratio === 'number' && Number.isFinite(t.ratio)) ? Math.round(t.ratio * 1000) / 10 : null,
    chips: (bondCard && Array.isArray(bondCard.items)) ? bondCard.items.slice(0, 3) : [],
  };

  /* ② 命运契约卡 —— 交点/宿命点命中 ⇒ 契约已成；箴言锚取首个命中相位 */
  const karmic = items.filter((it) => {
    const ka = it.a && it.a.key, kb = it.b && it.b.key;
    return KARMIC_POINTS.includes(ka) || KARMIC_POINTS.includes(kb);
  });
  const sealed = karmic.length > 0;
  const contract = {
    sealed,
    state: termRef(dict, 'familiar', sealed ? 'ContractSealed' : 'ContractPending', lang),
    points: KARMIC_POINTS
      .filter((p) => karmic.some((it) => (it.a && it.a.key === p) || (it.b && it.b.key === p)))
      .map((p) => termRef(dict, 'points', p, lang))
      .filter(Boolean),
    quote: karmic.length ? karmic[0] : null,
  };

  /* ③ 双星能量图谱 —— 三轴能量条（无信号轴 known:false + value:null） */
  const energy = ENERGY_AXES.map((ax) => {
    let h = 0, hd = 0;
    for (const it of items) {
      const ka = it.a && it.a.key, kb = it.b && it.b.key;
      if (ax.planets.includes(ka) || ax.planets.includes(kb)) {
        if (it.polarity === 'harmonious') h++;
        else if (it.polarity === 'hard') hd++;
      }
    }
    const known = (h + hd) > 0;
    return {
      id: ax.id,
      axis: termRef(dict, 'familiar', ax.termKey, lang),
      known,
      harmonious: h,
      hard: hd,
      value: known ? clamp100(50 + ((h - hd) / (h + hd)) * 50) : null,
    };
  });

  return { signature, contract, energy };
}
