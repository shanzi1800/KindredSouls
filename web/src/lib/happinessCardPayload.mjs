// 🤝 E155-刀三 → E156（主公军令 2026-11-25）：幸福坐标卡入参装配（四主题同母版；纯函数 ⇒ 直测）
//   E156 起：二维码恒指首页（邀请函链退役 ⇒ 卡片不再携带任何令牌/双人隐私）；
//   三场景卡由 /result 底部与财富报告页底部嵌入，主动权 100% 在付费用户本人。
import { resT } from './resonanceI18n.mjs';

export const HAPPINESS_BRAND = 'kindredsouls.online';

/** 场景白名单（与 lib/resonance/resonanceCore.mjs 同集） */
export const CARD_SCENES = Object.freeze(['romance', 'business', 'friendship']);

/** 归一：非法 ⇒ 'romance' */
export function normalizeCardScene(raw) {
  return CARD_SCENES.indexOf(String(raw == null ? '' : raw)) !== -1 ? String(raw) : 'romance';
}

/** 称呼清洗（与 lib/resonance/resonancePrompt.mjs sanitizeDisplayName 同规则的前端镜像；非法 ⇒ ''） */
export function sanitizeCardName(raw) {
  if (typeof raw !== 'string') return '';
  const s = raw.normalize('NFKC')
    .replace(/[\p{C}\p{Zl}\p{Zp}<>{}[\]"'`\\|/$~^]/gu, ' ')
    .replace(/[^\p{L}\p{M}\p{N} ·\-_.]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(s).slice(0, 16).join('').trim();
}

const SUN_SIGN_CUTOFFS = Object.freeze([
  [1, 20, 'Capricorn'], [2, 19, 'Aquarius'], [3, 21, 'Pisces'], [4, 20, 'Aries'],
  [5, 21, 'Taurus'], [6, 21, 'Gemini'], [7, 23, 'Cancer'], [8, 23, 'Leo'],
  [9, 23, 'Virgo'], [10, 23, 'Libra'], [11, 22, 'Scorpio'], [12, 22, 'Sagittarius'],
]);

/** YYYY-MM-DD ⇒ 太阳星座英文名（回归黄道日期口径；非法 ⇒ ''） */
export function sunSignOfDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ''));
  if (!m) return '';
  const mo = Number(m[2]), da = Number(m[3]);
  if (!(mo >= 1 && mo <= 12) || !(da >= 1 && da <= 31)) return '';
  for (const [mm, dd, name] of SUN_SIGN_CUTOFFS) {
    if (mo < mm || (mo === mm && da < dd)) return name;
  }
  return 'Capricorn';
}

/** 首页地址（二维码目标；去尾斜杠） */
export function homeUrl(origin) {
  return `${String(origin || '').replace(/\/+$/, '')}/`;
}

/**
 * 三场景双人卡（情爱 / 商道 / 挚友）
 * @param {object} p {lang, scene, nameA, nameB, birthA, birthB, dims:{love,communication,chemistry,stability}, overall, origin}
 */
export function buildSceneCardPayload(p) {
  const it = p || {};
  const lang = String(it.lang || 'zh').split('-')[0];
  const scene = normalizeCardScene(it.scene);
  const dims = (it.dims && typeof it.dims === 'object') ? it.dims : {};
  const row = resT(lang, `dim_${scene}`);
  const labels = Array.isArray(row) ? row : [];
  const keys = ['love', 'communication', 'chemistry', 'stability'];
  const keywords = (Array.isArray(labels) && labels.length === 4 ? keys : [])
    .map((k, i) => `${labels[i]} ${Number.isFinite(Number(dims[k])) ? Math.round(Number(dims[k])) : '—'}`)
    .filter(Boolean);
  return {
    theme: scene,
    lang,
    sceneTitle: scene === 'romance' ? resT(lang, 'scene_romance_title') : resT(lang, `pill_${scene}`),
    sceneSub: resT(lang, `scene_${scene}_sub`),
    selfLabel: resT(lang, 'card_you'),
    partnerLabel: resT(lang, 'card_partner'),
    self: { label: resT(lang, 'card_you'), name: sanitizeCardName(it.nameA) || resT(lang, 'name_you_ph'), sunSign: sunSignOfDate(it.birthA) },
    partner: { label: resT(lang, 'card_partner'), name: sanitizeCardName(it.nameB) || resT(lang, 'name_ta_ph'), sunSign: sunSignOfDate(it.birthB) },
    keywordsLabel: resT(lang, 'keywords_label'),
    keywords,
    quote: resT(lang, `card_quote_${scene}`),
    qrUrl: homeUrl(it.origin),
    cardTitle: resT(lang, 'card_title'),
    brand: HAPPINESS_BRAND,
    degraded: false,
    degradedBadge: '',
    overall: Number.isFinite(Number(it.overall)) ? Math.round(Number(it.overall)) : null,
  };
}

/** 个人财富卡（E139-P2 丰盛底色收编进同一母版）：二维码内嵌首页 */
export function buildWealthCardPayload({ lang, name, sunSign, keywords, origin }) {
  const L = String(lang || 'zh').split('-')[0];
  return {
    theme: 'wealth_abundance',
    lang: L,
    sceneTitle: resT(L, 'card_wealth_badge'),
    sceneSub: '',
    selfLabel: resT(L, 'card_you'),
    partnerLabel: '',
    self: { label: resT(L, 'card_you'), name: sanitizeCardName(name) || resT(L, 'name_you_ph'), sunSign: sunSign || null },
    partner: null,
    keywordsLabel: resT(L, 'keywords_label'),
    // 关键词：调用方给则用之；缺省 ⇒ 丰盛底色四词（E139-P2 守卫同义：天赋溢出/丰盛流向/松弛风控/善财圆融）
    keywords: (Array.isArray(keywords) && keywords.length
      ? keywords.filter((k) => typeof k === 'string')
      : (resT(L, 'card_wealth_keywords') || [])).slice(0, 4),
    quote: resT(L, 'card_quote_wealth'),
    qrUrl: homeUrl(origin),
    cardTitle: resT(L, 'card_title'),
    brand: HAPPINESS_BRAND,
    degraded: false,
    degradedBadge: '',
  };
}
