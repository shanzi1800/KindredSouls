/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E126-GEO-LOCALE-DECOUPLING 刀一（主公军令 2026-11-05 晚）：Geo-Locale 解析核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：语言（Language）与地理锚点（Geo-Location）彻底解耦——「选中文 ≠ 人在
 * 中国」。在硅谷的华人用中文聊天，衣食住行推荐必须锚定北美生态圈；在悉尼的法国
 * 人用法文聊天，推荐锚定澳洲。三层优先级：
 *   P1 用户显式意图（prompt 自然语言内声明目的地——交模型，不进本模块）；
 *   P2 物理区域感知：cf-ipcountry 标头（Cloudflare 国家码）> 客户端时区随行
 *      （Intl.DateTimeFormat().resolvedOptions().timeZone）；
 *   P3 兜底：不注入 geo 上下文 ⇒ 回退 E124 语言生活区（现行为零破坏）。
 * zone＝生活区生态圈（非国家码）：NA 北美 / AU 澳新 / EU 欧陆 / CN 华语 /
 * SEA 东南亚 / JP 日本。未知/坏形状一律 fail-closed ⇒ null。
 * 🔴 铁律沿袭：零网络零外部 geo-IP 服务（自包含静态映射表）；零 i18n 新键。
 * 消费方：server.js（familiar/chat prompt 双轨注入）＋ LifestyleMuseSlot.tsx
 * （roadtrip 卡 geo 变体选卡）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 六大生活区生态圈（军令钦定 zone 白名单——fail-closed 根） */
export const LIFESTYLE_GEO_ZONES = Object.freeze(['NA', 'AU', 'EU', 'CN', 'SEA', 'JP']);

/** zone 人类可读名（prompt/日志用——非用户可见 UI 文案，零 i18n 争议） */
export const LIFESTYLE_GEO_ZONE_NAMES = Object.freeze({
  NA: 'North America',
  AU: 'Australia & New Zealand',
  EU: 'Continental Europe',
  CN: 'Greater China',
  SEA: 'Southeast Asia',
  JP: 'Japan',
});

/**
 * ISO 3166-1 alpha-2 国家码 → zone（cf-ipcountry / x-geo 白名单面）。
 * 未列入的国家（拉美/非洲/中东/印度等）⇒ 不在表内 ⇒ 查不到 ⇒ null（回退语言区）。
 */
const COUNTRY_TO_ZONE = Object.freeze({
  // NA 北美生态圈
  US: 'NA', CA: 'NA',
  // AU 澳新生态圈
  AU: 'AU', NZ: 'AU',
  // EU 欧陆生态圈（含英伦——度假生态一体：Cotswolds/湖区/普罗旺斯同盘）
  GB: 'EU', IE: 'EU', FR: 'EU', BE: 'EU', NL: 'EU', LU: 'EU', DE: 'EU', AT: 'EU',
  CH: 'EU', IT: 'EU', ES: 'EU', PT: 'EU', AD: 'EU', MC: 'EU', DK: 'EU', SE: 'EU',
  NO: 'EU', FI: 'EU', IS: 'EU', PL: 'EU', CZ: 'EU', SK: 'EU', HU: 'EU', RO: 'EU',
  BG: 'EU', GR: 'EU', HR: 'EU', SI: 'EU', EE: 'EU', LV: 'EU', LT: 'EU', MT: 'EU', CY: 'EU',
  // CN 华语生态圈（两岸暨港澳——莫干山/安吉/大理同盘）
  CN: 'CN', HK: 'CN', MO: 'CN', TW: 'CN',
  // SEA 东南亚生态圈
  TH: 'SEA', VN: 'SEA', SG: 'SEA', MY: 'SEA', PH: 'SEA', ID: 'SEA',
  KH: 'SEA', MM: 'SEA', LA: 'SEA', BN: 'SEA',
  // JP 日本生态圈
  JP: 'JP',
});

/**
 * IANA 时区前缀 → zone（客户端 Intl 兜底面）。
 * 用「最长前缀段」匹配（America/Indiana/Indianapolis 命中 America/ 前缀树）。
 * 未列入前缀 ⇒ null（fail-closed 回退）。
 */
const TIMEZONE_PREFIXES = Object.freeze([
  // 注意：-America/* 只含美加主力（拉美时区 America/Sao_Paulo 等不入 ⇒ null）
  ['America/New_York', 'NA'], ['America/Detroit', 'NA'], ['America/Chicago', 'NA'],
  ['America/Indiana', 'NA'], ['America/Kentucky', 'NA'], ['America/Denver', 'NA'],
  ['America/Phoenix', 'NA'], ['America/Boise', 'NA'], ['America/Los_Angeles', 'NA'],
  ['America/Anchorage', 'NA'], ['America/Halifax', 'NA'], ['America/St_Johns', 'NA'],
  ['America/Toronto', 'NA'], ['America/Vancouver', 'NA'], ['America/Montreal', 'NA'],
  ['America/Winnipeg', 'NA'], ['America/Edmonton', 'NA'], ['Pacific/Honolulu', 'NA'],
  ['Australia/Sydney', 'AU'], ['Australia/Melbourne', 'AU'], ['Australia/Brisbane', 'AU'],
  ['Australia/Perth', 'AU'], ['Australia/Adelaide', 'AU'], ['Australia/Hobart', 'AU'],
  ['Australia/Darwin', 'AU'], ['Pacific/Auckland', 'AU'],
  ['Europe/London', 'EU'], ['Europe/Dublin', 'EU'], ['Europe/Paris', 'EU'],
  ['Europe/Berlin', 'EU'], ['Europe/Vienna', 'EU'], ['Europe/Zurich', 'EU'],
  ['Europe/Rome', 'EU'], ['Europe/Madrid', 'EU'], ['Europe/Lisbon', 'EU'],
  ['Europe/Amsterdam', 'EU'], ['Europe/Brussels', 'EU'], ['Europe/Stockholm', 'EU'],
  ['Europe/Oslo', 'EU'], ['Europe/Copenhagen', 'EU'], ['Europe/Helsinki', 'EU'],
  ['Europe/Warsaw', 'EU'], ['Europe/Prague', 'EU'], ['Europe/Budapest', 'EU'],
  ['Europe/Athens', 'EU'], ['Europe/Bucharest', 'EU'], ['Europe/Sofia', 'EU'],
  ['Europe/Zagreb', 'EU'], ['Europe/Ljubljana', 'EU'], ['Europe/Riga', 'EU'],
  ['Europe/Vilnius', 'EU'], ['Europe/Tallinn', 'EU'], ['Europe/Luxembourg', 'EU'],
  ['Europe/Malta', 'EU'], ['Europe/Bratislava', 'EU'], ['Europe/Monaco', 'EU'],
  ['Asia/Shanghai', 'CN'], ['Asia/Chongqing', 'CN'], ['Asia/Harbin', 'CN'],
  ['Asia/Urumqi', 'CN'], ['Asia/Hong_Kong', 'CN'], ['Asia/Macau', 'CN'], ['Asia/Taipei', 'CN'],
  ['Asia/Bangkok', 'SEA'], ['Asia/Ho_Chi_Minh', 'SEA'], ['Asia/Saigon', 'SEA'],
  ['Asia/Singapore', 'SEA'], ['Asia/Kuala_Lumpur', 'SEA'], ['Asia/Jakarta', 'SEA'],
  ['Asia/Manila', 'SEA'], ['Asia/Phnom_Penh', 'SEA'], ['Asia/Yangon', 'SEA'],
  ['Asia/Vientiane', 'SEA'], ['Asia/Brunei', 'SEA'],
  ['Asia/Tokyo', 'JP'], ['Asia/Osaka', 'JP'], ['Asia/Sapporo', 'JP'], ['Asia/Nagoya', 'JP'],
]);

/** 国家码查 zone（fail-closed：非白名单两字母码 ⇒ null） */
export function geoZoneFromCountry(cc) {
  if (typeof cc !== 'string') return null;
  const key = cc.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(key)) return null;
  return COUNTRY_TO_ZONE[key] || null;
}

/** IANA 时区查 zone（前缀精确匹配；未知/坏形状 ⇒ null） */
export function geoZoneFromTimezone(tz) {
  if (typeof tz !== 'string') return null;
  const s = tz.trim();
  if (!s || s.length > 64 || !/^[A-Za-z0-9_+\-/]+$/.test(s)) return null;
  for (let i = 0; i < TIMEZONE_PREFIXES.length; i += 1) {
    if (s === TIMEZONE_PREFIXES[i][0] || s.startsWith(`${TIMEZONE_PREFIXES[i][0]}/`)) {
      return TIMEZONE_PREFIXES[i][1];
    }
  }
  return null;
}

/**
 * 三层解析（country 优先 > timezone 次之 > null fail-closed）。
 * P1（用户显式意图）不进本模块——由模型在对话内遵循。
 * @param {{country?: string, timezone?: string}} hints
 * @returns {string|null} zone 白名单成员或 null
 */
export function resolveLifestyleGeoZone(hints) {
  if (!hints || typeof hints !== 'object') return null;
  const byCountry = geoZoneFromCountry(hints.country);
  if (byCountry) return byCountry;
  const byTz = geoZoneFromTimezone(hints.timezone);
  if (byTz) return byTz;
  return null;
}

/**
 * 浏览器端 Intl 兜底（无 headers 场景——Canvas 卡选卡用）。
 * Intl 不可用/时区未知 ⇒ null（fail-closed，回退语言区模板）。
 */
export function resolveBrowserGeoZone() {
  try {
    if (typeof Intl === 'undefined' || !Intl.DateTimeFormat) return null;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return geoZoneFromTimezone(tz);
  } catch {
    return null;
  }
}
