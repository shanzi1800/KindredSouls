/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E134-AESTHETIC-25D-ROUTE-MAP（主公军令 2026-11-11）：一键唤醒原生地图导航
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：基于路书 waypoints 三站（query 导航串）＋当前 geoLocale，组装
 * Google Maps 多途经点导航链接（origin=第一站 / destination=第三站 /
 * waypoints=第二站 / travelmode=driving）；iOS WebKit 兼容——新标签页安全
 * 打开（target="_blank" rel="noopener noreferrer"），对话舱状态 100% 留存
 * 不刷新（消费方用 <a> 直挂 href，本模块提供纯函数供测试与兜底直开）。
 * 🔴 fail-closed：waypoints 缺失/不足三站 ⇒ null（严禁伪造残缺路线）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * 组装 Google Maps 多途经点导航 URL（三站式——军令钦定形态）
 * @param {Array<{name?:string, query?:string}>} waypoints 三站（query 为导航串）
 * @returns {string|null} URL；fail-closed：非数组/不足三站/任一 query 空 ⇒ null
 */
export function buildMultiStopMapsUrl(waypoints) {
  if (!Array.isArray(waypoints) || waypoints.length < 3) return null;
  const q = [];
  for (let i = 0; i < 3; i++) {
    const s = String((waypoints[i] && waypoints[i].query) || '').trim();
    if (!s) return null; // fail-closed：任一站缺导航串 ⇒ 整链弃权
    q.push(s);
  }
  // 军令钦定 URL 形态（Google Maps Directions API——通用/Android/Desktop）：
  // https://www.google.com/maps/dir/?api=1&origin=…&destination=…&waypoints=…&travelmode=driving
  return 'https://www.google.com/maps/dir/?api=1'
    + `&origin=${encodeURIComponent(q[0])}`
    + `&destination=${encodeURIComponent(q[2])}`
    + `&waypoints=${encodeURIComponent(q[1])}`
    + '&travelmode=driving';
}

/**
 * 路书模板安全取三站（fail-closed：waypoints 非法 ⇒ null——沙盘/导航双消费同源）
 * @param {object} template 路书模板（lifestyleMuseData.mjs 真源）
 * @returns {Array<{name:string, query:string}>|null}
 */
export function roadtripWaypointsOf(template) {
  const wp = template && template.waypoints;
  if (!Array.isArray(wp) || wp.length < 3) return null;
  const out = [];
  for (let i = 0; i < 3; i++) {
    const w = wp[i] || {};
    const name = String(w.name || '').trim();
    const query = String(w.query || '').trim();
    if (!query) return null;
    out.push({ name, query });
  }
  return out;
}

/**
 * 新标签页安全打开（iOS WebKit 兼容——noopener noreferrer，对话舱零跳出）
 * SSR/无窗口环境安全降级返回 false（纯函数可测）。
 * @param {string} url buildMultiStopMapsUrl 产物
 * @returns {boolean} 是否成功唤起
 */
export function openNativeMapUrl(url) {
  if (typeof window === 'undefined' || !window || typeof window.open !== 'function') return false;
  if (!url || !/^https:\/\/www\.google\.com\/maps\/dir\//.test(String(url))) return false; // 白名单守卫：仅 Maps dir 链
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  return !!(win === null || win); // noopener 下 window.open 返回 null＝已安全开窗（Chromium 语义）
}
