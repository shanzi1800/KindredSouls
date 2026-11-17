/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E143-SOULBOND（主公军令 2026-11-17）：灵犀共生状态机数据核（纯逻辑）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（模块一 1.1）：
 *   · bondLevel 三档：Lv.1 初识星伴 → Lv.2 星轨同频 → Lv.3 灵魂共生；
 *   · resonanceScore 0–100 默契值（累加制，clamp 0–100）；
 *   · 持久化键 ks_soul_bond_state（localStorage；旧档容错 fail-closed，
 *     坏值归零重建——对齐 E142.1 greetingMode 随档固化形制：档位入档固化、
 *     白名单净化，坏档绝不阻断对话流）；
 *   · 跃迁阈值 0/40/80 三档（军令建议值）；档位只升不降（默契累加制）。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络；storage 注入可单测）；
 *    六语自容 L_ 字典（零 i18n 139 键扰动——E120/E121/E122/E123/E137 先例）；
 *    fail-closed：坏形状一律归零重建绝不臆造。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 军令钦定存储键（localStorage 白名单在册：E143 新增） */
export const SOUL_BOND_STORAGE_KEY = 'ks_soul_bond_state';

/** bondLevel 档位白名单（闭集；Lv.3 满阶＝军令「满阶共生称号」态） */
export const BOND_LEVEL_KEYS = Object.freeze(['lv1', 'lv2', 'lv3']);

/** 三档跃迁阈值（军令建议 0/40/80；score ≥ min 即入该档） */
export const BOND_LEVEL_THRESHOLDS = Object.freeze({ lv1: 0, lv2: 40, lv3: 80 });

/** 默契值上下界 */
export const RESONANCE_MIN = 0;
export const RESONANCE_MAX = 100;

/* ═══════════ 六语自容字典（军令译表逐字——零 i18n 扰动）═══════════ */
/** 三档称号（zh 灵魂共生 / en Twin Flame / fr Âme Sœur / es Alma Gemela / th จิตวิญญาณคู่ / vi Tri Kỷ Tinh Hà＝Lv.3 满阶共生称号列） */
export const L_BOND_TITLES = Object.freeze({
  lv1: Object.freeze({
    zh: '初识星伴', en: 'Stargazer Bond', fr: 'Lien d\'Étoiles', es: 'Vínculo Estelar',
    th: 'พันธะดาวดึงดูด', vi: 'Gắn Bó Tinh Tú',
  }),
  lv2: Object.freeze({
    zh: '星轨同频', en: 'Orbit in Sync', fr: 'Orbites Accordées', es: 'Órbitas en Sintonía',
    th: 'วงโคจรเดียวกัน', vi: 'Đồng Điệu Quỹ Đạo',
  }),
  lv3: Object.freeze({
    zh: '灵魂共生', en: 'Twin Flame', fr: 'Âme Sœur', es: 'Alma Gemela',
    th: 'จิตวิญญาณคู่', vi: 'Tri Kỷ Tinh Hà',
  }),
});

/** 灵犀默契前缀（状态栏军令钦定「灵犀默契」列） */
export const L_RESONANCE_PREFIX = Object.freeze({
  zh: '灵犀默契', en: 'Soul Bond', fr: 'Lien Astral', es: 'Vínculo Astral',
  th: 'พันธะดวงดาว', vi: 'Tâm Linh Tương Thông',
});

/* ═══════════ 数据核（纯函数）═══════════ */

/** lang 白名单守卫（六语外 ⇒ en 兜底） */
function sanitizeLang(l) {
  return ['zh', 'en', 'fr', 'es', 'th', 'vi'].includes(String(l || '')) ? String(l) : 'en';
}

/** 分值形状守卫（有限数值 ⇒ clamp 0–100；坏值 ⇒ 0） */
function clampScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(RESONANCE_MIN, Math.min(RESONANCE_MAX, Math.round(n)));
}

/** 档位形状守卫（白名单外 ⇒ ''——fail-closed） */
function sanitizeLevelKey(v) {
  return (typeof v === 'string' && BOND_LEVEL_KEYS.includes(v)) ? v : '';
}

/** 按分值解档位（0/40/80 三档） */
export function resolveBondLevel(score) {
  const s = clampScore(score);
  if (s >= BOND_LEVEL_THRESHOLDS.lv3) return 'lv3';
  if (s >= BOND_LEVEL_THRESHOLDS.lv2) return 'lv2';
  return 'lv1';
}

/** 状态形状守卫（旧档容错 fail-closed：坏值归零重建；档位与分值不符 ⇒ 分值兑底） */
export function sanitizeSoulBondState(v) {
  if (!v || typeof v !== 'object') return { resonanceScore: 0, bondLevel: 'lv1', updatedAt: 0 };
  const score = clampScore(v.resonanceScore);
  const byScore = resolveBondLevel(score);
  const archived = sanitizeLevelKey(v.bondLevel);
  // 档位只升不降（军令累加制）：档内取「历史最高档 vs 分值档」的高位固化
  const rank = { lv1: 0, lv2: 1, lv3: 2 };
  const bondLevel = (archived && rank[archived] > rank[byScore]) ? archived : byScore;
  const ts = Number(v.updatedAt);
  return { resonanceScore: score, bondLevel, updatedAt: Number.isFinite(ts) ? ts : 0 };
}

/** 读档（无档/坏档/隐私模式 ⇒ 归零态——绝不阻断对话流） */
export function readSoulBondState(store) {
  try {
    if (!store || typeof store.getItem !== 'function') return sanitizeSoulBondState(null);
    const raw = store.getItem(SOUL_BOND_STORAGE_KEY);
    if (!raw) return sanitizeSoulBondState(null);
    return sanitizeSoulBondState(JSON.parse(raw));
  } catch {
    return sanitizeSoulBondState(null); // 坏 JSON ⇒ 归零重建（fail-soft）
  }
}

/** 写档（白名单净化后落键；隐私模式写满额 ⇒ 静默 false） */
export function writeSoulBondState(store, state) {
  try {
    if (!store || typeof store.setItem !== 'function') return false;
    const clean = sanitizeSoulBondState(state);
    store.setItem(SOUL_BOND_STORAGE_KEY, JSON.stringify({ ...clean, updatedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

/**
 * 默契值累加（军令「每次 +N」纯核）——clamp 0–100＋档位重算（只升不降）。
 * @returns {{state: object, leveledUp: boolean}} leveledUp＝本次跃迁事件（供星光呼吸光晕触发）
 */
export function applyBondDelta(state, delta) {
  const before = sanitizeSoulBondState(state);
  const d = Number(delta);
  const gain = Number.isFinite(d) ? Math.max(0, Math.round(d)) : 0; // 累加制：负增量一律归零
  const score = clampScore(before.resonanceScore + gain);
  const byScore = resolveBondLevel(score);
  const rank = { lv1: 0, lv2: 1, lv3: 2 };
  const bondLevel = rank[byScore] >= rank[before.bondLevel] ? byScore : before.bondLevel;
  return {
    state: { resonanceScore: score, bondLevel, updatedAt: Date.now() },
    leveledUp: bondLevel !== before.bondLevel,
  };
}

/**
 * 走心回复判定（默契埋点启发——宁窄勿宽：长句或情绪词命中 ⇒ 深度互动 +2；否则 +1）。
 * 情绪词闭集（六语共性子串，纯逻辑零 i18n）。
 */
const HEARTFELT_HINTS = /想|爱|念|难过|开心|孤独|担心|谢谢|抱抱|miss|love|sad|lonely|thank|merci|triste|seul|gracias|amor|คิดถึง|รัก|เหงา|nhớ|yêu|buồn|cảm ơn/i;
export function resonanceGainFromUserText(text) {
  const s = String(text || '').trim();
  if (!s) return 0;
  return (s.length >= 24 || HEARTFELT_HINTS.test(s)) ? 2 : 1;
}

/** 状态栏标签（六语自容；Lv.1/2＝`灵犀默契 Lv.2 星轨同频 · 62`；Lv.3 满阶＝`灵魂共生 Lv.3 · 95`） */
export function bondStatusBarLabel(lang, state) {
  const l = sanitizeLang(lang);
  const st = sanitizeSoulBondState(state);
  const title = (L_BOND_TITLES[st.bondLevel] && L_BOND_TITLES[st.bondLevel][l])
    || L_BOND_TITLES.lv1.zh;
  const lvNum = st.bondLevel === 'lv3' ? 'Lv.3' : (st.bondLevel === 'lv2' ? 'Lv.2' : 'Lv.1');
  const prefix = (st.bondLevel === 'lv3')
    ? L_RESONANCE_PREFIX[l] // 满阶态：灵犀前缀＋满阶共生称号（军令译表第 4/5 列并列）
    : L_RESONANCE_PREFIX[l];
  return `${prefix} ${lvNum} ${title} · ${st.resonanceScore}/100`;
}
