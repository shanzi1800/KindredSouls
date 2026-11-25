// 🤝 E155-刀三：幸福坐标卡入参装配（四主题同母版；纯函数 ⇒ 直测）
import { resT } from './resonanceI18n.mjs';
import { resonanceInviteUrl, RESONANCE_PATH } from './resonanceClient.mjs';

export const HAPPINESS_BRAND = 'kindredsouls.online';

/** 裂变卡（三场景）：二维码内嵌 /invite/:invite_token */
export function buildResonanceCardPayload({ lang, role, view, origin }) {
  const scene = view && ['romance', 'business', 'friendship'].indexOf(view.scene) !== -1 ? view.scene : 'romance';
  const report = (view && view.report) || {};
  const selfSign = (view && view.selfSunSign) || (report.truth && report.truth[role === 'payer' ? 'a' : 'b'] && report.truth[role === 'payer' ? 'a' : 'b'].sunSign) || null;
  const partnerSign = (view && view.partnerSunSign) || null;
  return {
    theme: scene,
    lang,
    sceneTitle: resT(lang, `scene_${scene}_title`),
    sceneSub: resT(lang, `scene_${scene}_sub`),
    selfLabel: resT(lang, 'card_you'),
    partnerLabel: resT(lang, 'card_partner'),
    self: { label: resT(lang, 'card_you'), name: (view && view.self && view.self.name) || '', sunSign: selfSign },
    partner: { label: resT(lang, 'card_partner'), name: (view && view.partnerName) || '', sunSign: partnerSign },
    keywordsLabel: resT(lang, 'keywords_label'),
    keywords: Array.isArray(report.keywords) ? report.keywords.slice(0, 4) : [],
    quote: resT(lang, `card_quote_${scene}`),
    qrUrl: resonanceInviteUrl(origin, view && view.inviteToken),
    cardTitle: resT(lang, 'card_title'),
    brand: HAPPINESS_BRAND,
    degraded: report.precision === 'date_level',
    degradedBadge: resT(lang, 'degraded_badge'),
  };
}

/** 个人财富卡（E139-P2 丰盛底色收编进同一母版）：二维码内嵌首页 */
export function buildWealthCardPayload({ lang, name, sunSign, keywords, origin }) {
  return {
    theme: 'wealth_abundance',
    lang,
    sceneTitle: resT(lang, 'card_wealth_badge'),
    sceneSub: resT(lang, 'res_title').split(' · ')[0],
    selfLabel: resT(lang, 'card_you'),
    partnerLabel: '',
    self: { label: resT(lang, 'card_you'), name: name || '', sunSign: sunSign || null },
    partner: null,
    keywordsLabel: resT(lang, 'keywords_label'),
    keywords: Array.isArray(keywords) ? keywords.filter((k) => typeof k === 'string').slice(0, 4) : [],
    quote: resT(lang, 'card_quote_wealth'),
    qrUrl: `${String(origin || '').replace(/\/+$/, '')}/`,
    cardTitle: resT(lang, 'card_title'),
    brand: HAPPINESS_BRAND,
    degraded: false,
    degradedBadge: '',
  };
}

export const RESONANCE_CARD_PATH = RESONANCE_PATH;
