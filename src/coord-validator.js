/**
 * 🛡️ V490b: 坐标（lat/lon）强校验 —— 消灭「静默降级 Cancer 上升」的带毒 200
 *
 * ── 病根（2026-10-01 实测，与 V490 时区同一类缺陷）─────────────────────────
 *   `v69_client.js` 用 `String(lat)` 把坐标拼进 Python 命令行，而 Python 侧
 *   `--lat` 是 `type=float`、**没有任何范围校验**。两种非法输入各走一条静默路：
 *
 *     · `lat = null`   → `String(null)` = "null" → argparse `float("null")` 失败
 *                        ⇒ **退出码 2**（非 V490 的 3）⇒ JS catch 不认 ⇒
 *                        `Falling back to Cancer rising` ⇒ **伪造巨蟹座上升出盘**
 *     · `lat = 91`     → argparse 收下 ⇒ **照常算出且返回 200**
 *                        实测：`{"lat":91.0,"rising_sign":"Virgo","ascendant_deg":178.68}`
 *                        ⇒ 用户拿到一张**基于越界纬度的错盘**，全程无告警
 *
 *   两者都与 V490 的「无效时区静默退 UTC」同构：**输入非法 → 输出照常 200 假绿**。
 *
 * ── 设计（军师钦定「咽喉堵截 + 拒绝静默」）───────────────────────────────
 *   Tier-0 未提供（`undefined`/字段缺失）→ 默认坐标（13.75 / 100.5，**不算错误**）
 *   Tier-1 可解析形态                    → 数值 / 数字字符串（含负号、小数、科学计数）
 *   Tier-2 范围强制                      → lat ∈ [-90, 90]、lon ∈ [-180, 180]
 *   Tier-3 不可补全                      → `{ ok:false }` ⇒ **调用方必须 HTTP 400**
 *
 * ⚠️ 关键防线（V490 实战教训，`Number(null) === 0`）：
 *   **只有 `typeof number` 与 `typeof string` 才进入解析**。
 *   `null` / `true` / `[]` / `{}` 等一律直接判非法 —— 否则 `Number(null)===0`、
 *   `Number(true)===1`、`Number([])===0` 会把「没给值」洗成「坐标在 (0°,0°)」，
 *   再次变成静默假绿（这正是 V490 踩过的坑，此处前置堵死）。
 */

/** 历史默认坐标（缺省时使用，与 server.js 既有默认一致 = 曼谷） */
export const DEFAULT_LAT = 13.75;
export const DEFAULT_LON = 100.5;

/** 合法范围（闭区间） */
export const COORD_RANGE = Object.freeze({
  lat: Object.freeze([-90, 90]),
  lon: Object.freeze([-180, 180]),
});

/** 单个分量的解析：区分「未提供」「可解析」「非法」三态 */
function _parseOne(raw) {
  if (raw === undefined) return { state: 'missing' };
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? { state: 'ok', value: raw } : { state: 'bad', why: `非有限数值 ${raw}` };
  }
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (s === '') return { state: 'bad', why: '空字符串' };
    const n = Number(s);
    return Number.isFinite(n) ? { state: 'ok', value: n } : { state: 'bad', why: `无法解析为数值 "${raw}"` };
  }
  // null / boolean / object / array / function …：显式提供了值但不是坐标 ⇒ 一律拒绝
  return { state: 'bad', why: `类型非法（${raw === null ? 'null' : typeof raw}）` };
}

/**
 * 解析并校验坐标。
 *
 * @param {*} latInput  原始纬度（**不要预转 Number** —— 预转会制造 `Number(null)===0` 假绿）
 * @param {*} lonInput  原始经度
 * @returns {{ok:true, lat:number, lon:number, tier:'default'|'explicit'}
 *         | {ok:false, code:'INVALID_COORDINATES', reason:'missing_partner'|'not_a_number'|'out_of_range', message:string}}
 */
export function resolveCoordinates(latInput, lonInput) {
  const a = _parseOne(latInput);
  const b = _parseOne(lonInput);

  // ── Tier-0: 两者都未提供 ⇒ 默认坐标（保持历史 API 契约，不算错误）──
  if (a.state === 'missing' && b.state === 'missing') {
    return { ok: true, lat: DEFAULT_LAT, lon: DEFAULT_LON, tier: 'default' };
  }

  // ── 只有一侧提供：视为残缺入参（绝不拿默认值悄悄补齐另一半 —— 那会得到
  //    一个「半真半假」的坐标，比直接报错更危险）──
  if (a.state === 'missing' || b.state === 'missing') {
    const which = a.state === 'missing' ? 'lat' : 'lon';
    return {
      ok: false,
      code: 'INVALID_COORDINATES',
      reason: 'missing_partner',
      message: `坐标必须成对提供，缺失 ${which}`,
    };
  }

  // ── Tier-1: 可解析性 ──
  if (a.state === 'bad') {
    return { ok: false, code: 'INVALID_COORDINATES', reason: 'not_a_number', message: `lat ${a.why}` };
  }
  if (b.state === 'bad') {
    return { ok: false, code: 'INVALID_COORDINATES', reason: 'not_a_number', message: `lon ${b.why}` };
  }

  // ── Tier-2: 范围 ──
  const [latMin, latMax] = COORD_RANGE.lat;
  const [lonMin, lonMax] = COORD_RANGE.lon;
  if (a.value < latMin || a.value > latMax) {
    return {
      ok: false,
      code: 'INVALID_COORDINATES',
      reason: 'out_of_range',
      message: `lat ${a.value} 超出合法范围 [${latMin}, ${latMax}]`,
    };
  }
  if (b.value < lonMin || b.value > lonMax) {
    return {
      ok: false,
      code: 'INVALID_COORDINATES',
      reason: 'out_of_range',
      message: `lon ${b.value} 超出合法范围 [${lonMin}, ${lonMax}]`,
    };
  }

  return { ok: true, lat: a.value, lon: b.value, tier: 'explicit' };
}

/** 供闸门/调用方复用的错误构造（与 server.js 的响应体保持一致） */
export function invalidCoordinatesBody(message) {
  return { success: false, code: 'INVALID_COORDINATES', error: `Invalid coordinates: ${message}` };
}
