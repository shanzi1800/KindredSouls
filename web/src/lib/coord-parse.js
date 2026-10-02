/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  V491 · WP-2 / F1b — 前端坐标解析纯函数（与后端 src/coord-validator.js 对称）
 * ═══════════════════════════════════════════════════════════════════════════
 *  契约（与后端 V490b 逐字对齐，A2 冻结项）：
 *    Tier-0  两值完全未提供 ⇒ { ok:true, lat:13.75, lon:100.5, tier:0 }
 *            —— 历史默认（曼谷）**不算错误**（D3 冻结项）
 *    半缺    只给一侧     ⇒ { ok:false, code:'MISSING_PARTNER' }
 *    Tier-1  number / 纯数字串 ⇒ 解析为数值（🔴 严禁 Number(null)===0 洗白：
 *            只放行 typeof number|string，其余一律拒绝）
 *    Tier-2  闭区间 lat∈[-90,90] / lon∈[-180,180]，越界 ⇒ { ok:false, code:'INVALID_COORDINATES' }
 *    Tier-3  不可解析 ⇒ { ok:false, code:'INVALID_COORDINATES' } —— 严禁静默退曼谷
 */

/**
 * @param {unknown} lat URL 传入的纬度原值（string | number | null | undefined）
 * @param {unknown} lon URL 传入的经度原值
 * @returns {{ok:boolean, lat?:number, lon?:number, tier?:number, code?:string, reason?:string}}
 */
export function resolveCoordinates(lat, lon) {
  const hasLat = lat !== undefined && lat !== null && lat !== '';
  const hasLon = lon !== undefined && lon !== null && lon !== '';

  // Tier-0：完全未提供 → 历史默认值，不算错误（后端契约一致）
  if (!hasLat && !hasLon) {
    return { ok: true, lat: 13.75, lon: 100.5, tier: 0 };
  }

  // 半缺：只给一侧 → 拒绝（对齐后端 missing_partner，绝不悄悄补默认值）
  if (hasLat !== hasLon) {
    return { ok: false, code: 'MISSING_PARTNER', reason: 'half-missing-coordinates' };
  }

  // Tier-1：解析 —— 只放行 number 与纯数字串，堵死 Number(null)===0 / Number(true)===1 洗白
  const toNum = (v) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
    if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) return Number(v.trim());
    return NaN;
  };
  const nLat = toNum(lat);
  const nLon = toNum(lon);
  if (Number.isNaN(nLat) || Number.isNaN(nLon)) {
    return { ok: false, code: 'INVALID_COORDINATES', reason: 'unparseable-coordinates' };
  }

  // Tier-2：闭区间校验
  if (nLat < -90 || nLat > 90 || nLon < -180 || nLon > 180) {
    return { ok: false, code: 'INVALID_COORDINATES', reason: 'coordinates-out-of-range' };
  }

  return { ok: true, lat: nLat, lon: nLon, tier: 1 };
}
