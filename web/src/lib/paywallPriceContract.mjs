/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E142-PAYWALL-PRICE-CONTRACT（主公军令 2026-11-16）：双模块付费墙价格契约
 * ═══════════════════════════════════════════════════════════════════════════
 * 病灶：/wealth/report 财富年鉴按钮仍是旧版「生成财富月报/年报」＋「VIP 尊享
 * 点击免费生成」，未与姻缘 $2.99/$29.99 沙盒付费墙对齐（主公产线截图实锤）。
 * 治本（军令模块四）：价格与按钮文案散落大组件 if-else ⇒ 抽离独立纯函数
 * 契约模块——改 B 坏 A 的工程病灶物理拔除；Contract Lock Tests 防回归。
 * 军令钦定六语译表（逐字）＋已解锁态「查看」文案：
 *   zh  🗓️ 解锁财富月报 $2.99 / 📈 解锁财富年报 $29.99
 *   en  Unlock Monthly Wealth $2.99 / Unlock Annual Wealth $29.99
 *   fr  Mensuel Richesse $2,99 / Annuel Richesse $29,99（E103-③ 小数逗号）
 *   es  Riqueza Mensual $2,99 / Riqueza Anual $29,99（同上）
 *   th  ปลดล็อกรายเดือน $2.99 / ปลดล็อกรายปี $29.99
 *   vi  Mở Báo Cáo Tháng $2.99 / Mở Báo Cáo Năm $29.99
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；fr/es 小数逗号形态（E103-③
 *   铁律沿袭）；点击链＝未解锁 openUpgradePaywall ⇒ WealthUpgradePaywall
 *   沙盒弹窗（$2.99/$29.99 一键模拟支付——与姻缘 100% 同链，模块内零收银）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 六语白名单 */
const LANGS = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/**
 * 双模块付费墙价格契约表（军令钦定五档——数字真源，美元）。
 * 消费面：财富年报按钮文案 / WealthUpgradePaywall 标价对账 / e142 锁 4 闸门。
 */
export const PAYWALL_PRICE_CONTRACT = Object.freeze({
  love_core: 4.99,
  love_monthly: 2.99,
  love_yearly: 29.99,
  wealth_core: 4.99,
  wealth_monthly: 2.99,
  wealth_yearly: 29.99,
});

/** fr/es 小数逗号化（$2.99 → $2,99——E103-③ 军令铁律沿袭） */
export function priceLabel(plan, lang) {
  const v = PAYWALL_PRICE_CONTRACT[plan];
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const s = v.toFixed(2);
  return (lang === 'fr' || lang === 'es') ? `$${s.replace('.', ',')}` : `$${s}`;
}

/** 财富月/年报按钮文案（军令钦定六语译表逐字；unlocked ⇒ 「查看」文案） */
const WEALTH_REPORT_BUTTONS = Object.freeze({
  wealth_monthly: Object.freeze({
    locked: Object.freeze({
      zh: '🗓️ 解锁财富月报 $2.99', en: '🗓️ Unlock Monthly Wealth $2.99',
      fr: '🗓️ Mensuel Richesse $2,99', es: '🗓️ Riqueza Mensual $2,99',
      th: '🗓️ ปลดล็อกรายเดือน $2.99', vi: '🗓️ Mở Báo Cáo Tháng $2.99',
    }),
    unlocked: Object.freeze({
      zh: '🗓️ 查看财富月报', en: '🗓️ View Monthly Wealth',
      fr: '🗓️ Consulter Mensuel Richesse', es: '🗓️ Ver Riqueza Mensual',
      th: '🗓️ ดูรายงานรายเดือน', vi: '🗓️ Xem Báo Cáo Tháng',
    }),
  }),
  wealth_yearly: Object.freeze({
    locked: Object.freeze({
      zh: '📈 解锁财富年报 $29.99', en: '📈 Unlock Annual Wealth $29.99',
      fr: '📈 Annuel Richesse $29,99', es: '📈 Riqueza Anual $29,99',
      th: '📈 ปลดล็อกรายปี $29.99', vi: '📈 Mở Báo Cáo Năm $29.99',
    }),
    unlocked: Object.freeze({
      zh: '📈 查看财富年报', en: '📈 View Annual Wealth',
      fr: '📈 Consulter Annuel Richesse', es: '📈 Ver Riqueza Anual',
      th: '📈 ดูรายงานรายปี', vi: '📈 Xem Báo Cáo Năm',
    }),
  }),
});

/**
 * 财富月/年报按钮文案取值（fail-closed：非白名单 plan/lang ⇒ null 绝不臆造）。
 * @param {string} plan 'wealth_monthly' | 'wealth_yearly'
 * @param {string} lang 六语之一
 * @param {boolean} unlocked 已解锁态 ⇒ 「查看」文案（军令钦定）
 * @returns {string|null}
 */
export function wealthReportButtonLabel(plan, lang, unlocked) {
  const row = WEALTH_REPORT_BUTTONS[plan];
  if (!row) return null;
  const l = LANGS.includes(String(lang || '')) ? String(lang) : 'en';
  const v = (unlocked ? row.unlocked : row.locked)[l];
  return typeof v === 'string' && v.trim() ? v : null;
}

/** 已解锁双档提示行（替换旧「VIP 尊享，点击免费生成」——零误导六语自容） */
const VIP_UNLOCKED_HINT = Object.freeze({
  zh: '✨ 已解锁尊享权益，点按即可生成 / 查看',
  en: '✨ Unlocked benefit — tap to generate / view',
  fr: '✨ Avantage déverrouillé — touchez pour générer / consulter',
  es: '✨ Beneficio desbloqueado — toca para generar / ver',
  th: '✨ สิทธิพิเศษที่ปลดล็อกแล้ว — แตะเพื่อสร้าง / ดู',
  vi: '✨ Quyền lợi đã mở khóa — chạm để tạo / xem',
});

/** 已解锁提示行取值（坏 lang ⇒ en 兜底） */
export function vipUnlockedHintLabel(lang) {
  const l = LANGS.includes(String(lang || '')) ? String(lang) : 'en';
  return VIP_UNLOCKED_HINT[l];
}
