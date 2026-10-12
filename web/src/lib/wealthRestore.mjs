/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  45-D2c · 财富「现场恢复」回跳 URL 纯核（单一真源）
 * ═══════════════════════════════════════════════════════════════════════════
 *  缺陷史（本模块永久封锁的线上事故）：
 *    回跳 URL 旧写法只带 `birth` + `lang` 两个参数 ⇒ 在**冷启动恢复**场景
 *    （OAuth 弹窗期间主页面被移动端后台回收 / 微信内置浏览器 / 跨标签页重载 /
 *    Stripe 支付成功回跳）恢复现场时，出生时间 · 出生城市 · 经纬度 · 时区
 *    **全部丢失** ⇒ 系统按 useState 默认值（13.75 / 100.5 / Asia/Bangkok）
 *    重算 ⇒ 用户拿到的仍是**曼谷默认盘**（与 45-D1「参数名错位 ⇒ 曼谷默认盘」
 *    完全同源的孪生暗雷）。
 *
 *  防线契约：
 *    A. 回跳一律走 `buildWealthRestoreUrl`，**白名单透传**全部出生参数；
 *    B. 🔴 **参数名以消费方为准** —— 报告页 `deriveWealthBirthParams` 只认
 *       `time|birthTime` / `lat` / `lon` / `tz`，故这些标准名必须在回跳 URL 中
 *       原样带出（`birth*` 兼容名一并保留，向后兼容）；
 *    C. ⚠️ E34 D5 红线 —— 源 = 当前 URL（由 WealthPage 按 D5 规则生成的权威形态）。
 *       未选城时 WealthPage **本就不发** `lat`/`lon` ⇒ 此处**绝不臆造**默认坐标，
 *       禁以曼谷默认盘冒充真实出生地。
 *
 *  纯函数（无 DOM / 无 state / 无副作用）⇒ 可被闸门直接 import 做行为断言。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 白名单键（顺序即契约）：出生日期 · 语言 · 时间 · 城市 · 坐标 · 时区 · 绿通 */
export const WEALTH_RESTORE_KEYS = [
  'birth', 'lang', 'time', 'birthTime', 'birthCity',
  'birthLat', 'birthLon', 'birthTz', 'lat', 'lon', 'tz', 'free_access',
];

/**
 * 构造「现场恢复」回跳 URL。
 * @param {string} pathname 当前路径（如 /wealth/report）
 * @param {string} search   当前查询串（含出生全参；**唯一真值源**）
 * @param {{birthDate?: string, lang?: string}} fallback 缺参兜底
 * @param {Record<string,string>} extra 追加参数（如 free_access）
 * @returns {string}
 */
export const buildWealthRestoreUrl = (pathname, search, fallback = {}, extra = {}) => {
  const cur = new URLSearchParams(search || '');
  const out = new URLSearchParams();
  for (const k of WEALTH_RESTORE_KEYS) {
    const v = cur.get(k);
    if (v !== null && v !== '') out.set(k, v);
  }
  if (!out.get('birth') && fallback.birthDate) out.set('birth', fallback.birthDate);
  if (!out.get('lang') && fallback.lang) out.set('lang', fallback.lang);
  for (const k of Object.keys(extra)) out.set(k, extra[k]);
  const qs = out.toString();
  return qs ? pathname + '?' + qs : pathname;
};
