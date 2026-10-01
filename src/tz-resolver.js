/**
 * 🛡️ V490: 时区强校验与三级回退（Tier-1 规范化/typo → Tier-2 坐标最近邻 → Tier-3 显式拒绝）
 *
 * ── 病根（2026-10-01 实测）──────────────────────────────────────────────────
 *   astro/astro_matrix.py:_localize_dt() 对**无效 IANA 时区静默退 UTC**，接口照常返回
 *   200 success ⇒ **静默错盘**：实测 tz 拼写错 `America/Agentina/Ushuaia`（应为 Argentina）
 *   → 上升点偏差 48.82°、上升星座 Leo→Gemini，而用户与调用方**双盲无感**。
 *
 * ── 设计（军师钦定「严谨 / 防崩 / 显式」）──────────────────────────────────
 *   Tier-0 空值      → 默认 Asia/Bangkok（保持历史行为，**不算错误**）
 *   Tier-1 规范化    → Intl.DateTimeFormat 校验 + `resolvedOptions().timeZone` 取**规范名**
 *                      （实测：Intl 大小写不敏感；且**自动归一官方别名** ——
 *                        US/Pacific→America/Los_Angeles、Asia/Kolkata→Asia/Calcutta、GMT→UTC
 *                        ⇒ 官方别名无需自维护，只补「真拼写错」）
 *            + typo 纠正（显式小表：Agentina→Argentina 等）
 *   Tier-2 坐标推定  → 复用仓内 web/public/data/cities.json（32,004 城 / 353 时区）
 *                      球面最近邻（Haversine）反查 tz —— **零新依赖**
 *   Tier-3 不可解析  → `{ ok:false }` ⇒ **调用方必须 HTTP 400**（拒绝静默假绿）
 *
 * ⚠️ 本模块**绝不做任何静默兜底**：解析不出就如实返回 ok:false，策略交给调用方。
 * ⚠️ 产出一定是**规范 IANA 名**（供：① 缓存键去重 ② 传 Python 引擎 ③ 落库）。
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** 历史默认时区（缺省/空值时使用，与 server.js 既有默认一致） */
export const DEFAULT_TZ = 'Asia/Bangkok';

/**
 * 显式 typo 纠正表 —— **只收「真拼写错 / 变体拼法」**。
 * 官方别名（US/Pacific、Asia/Calcutta、GMT…）交给 Intl 自身归一，不在此维护。
 */
const TYPO_RULES = [
  [/agentina/gi, 'Argentina'],          // 🔴 实测踩到的拼写错（V490 立项起因）
  [/arg[ae]ntine/gi, 'Argentina'],      // 西语 Argentine 变体
  [/reyk?jav[iy]k/gi, 'Reykjavik'],     // 冰岛首都常见拼错
  [/kolkatta/gi, 'Kolkata'],
  [/katmando?u/gi, 'Kathmandu'],
  [/\s+/g, ''],                          // 去掉内部空白（'Asia/ Bangkok'）
];

// ── 城市索引（懒加载 + 常驻） ────────────────────────────────────────────────
let _idx = null;
let _idxTried = false;
const _nnCache = new Map();           // `${lat},${lon}` → 最近邻结果（Tier-2 罕见，配额 500）
const _NN_CACHE_MAX = 500;

function _jsonCandidates() {
  return [
    '/app/web/public/data/cities.json',                                 // Railway Docker（WORKDIR=/app）
    join(__dirname, '..', 'web', 'public', 'data', 'cities.json'),      // 本地：src/../web/public/...
    join(process.cwd(), 'web', 'public', 'data', 'cities.json'),
  ];
}

/** 懒加载城市索引（只留 lat/lon/tz/key 四元组，去掉 search/names 省内存） */
function _loadIndex() {
  if (_idx || _idxTried) return _idx;
  _idxTried = true;
  for (const p of _jsonCandidates()) {
    try {
      if (!existsSync(p)) continue;
      const raw = JSON.parse(readFileSync(p, 'utf8'));
      const arr = raw.fuse_index || raw.cities || [];
      _idx = arr
        .filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lon) && c.tz)
        .map(c => ({ lat: c.lat, lon: c.lon, tz: c.tz, key: c.key || '' }));
      console.log(`[V490] tz-city-index loaded: ${_idx.length} cities from ${p}`);
      return _idx;
    } catch (e) {
      console.warn(`[V490] tz-city-index load failed at ${p}: ${e.message}`);
    }
  }
  console.warn('[V490] tz-city-index UNavailable — Tier-2 坐标推定不可用（Tier-3 仍以 400 兜底）');
  return null;
}

/** Intl 校验并取**规范名**；失败返回 null（大小写不敏感；官方别名自动归一） */
export function intlCanonical(tz) {
  if (typeof tz !== 'string') return null;
  const s = tz.trim();
  if (!s) return null;
  try {
    const r = new Intl.DateTimeFormat('en-US', { timeZone: s }).resolvedOptions().timeZone;
    return r || null;
  } catch (e) {
    return null;
  }
}

/** 大圆距离（km），Haversine */
function _haversineKm(aLat, aLon, bLat, bLon) {
  const R = 6371.0088;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** 球面最近邻反查时区（线性扫 32k ≈ 数 ms；按 0.01° 网格缓存） */
function _nearestByGeo(lat, lon) {
  const ck = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (_nnCache.has(ck)) return _nnCache.get(ck);

  const idx = _loadIndex();
  if (!idx || !idx.length) return null;

  let best = null, bestD = Infinity;
  for (let i = 0; i < idx.length; i++) {
    const c = idx[i];
    const d = _haversineKm(lat, lon, c.lat, c.lon);
    if (d < bestD) { bestD = d; best = c; }
  }
  const out = best ? { tz: best.tz, distanceKm: bestD, city: best.key } : null;
  if (_nnCache.size >= _NN_CACHE_MAX) _nnCache.clear();
  _nnCache.set(ck, out);
  return out;
}

/**
 * 三级时区解析。
 * @param {*} tzInput 原始 tz 字符串（可能 null/undefined/空白/拼写错/别名）
 * @param {number} [lat] 纬度（Tier-2 用）
 * @param {number} [lon] 经度（Tier-2 用）
 * @returns {{ok:boolean,tz:(string|null),tier:number,input:string,reason:string,corrected:boolean,distanceKm?:number,city?:string}}
 */
export function resolveTimeZone(tzInput, lat, lon) {
  const input = tzInput == null ? '' : String(tzInput).trim();

  // ── Tier-0: 空值 → 默认（保持历史行为，不算错误）──
  if (!input) {
    return { ok: true, tz: DEFAULT_TZ, tier: 0, input, reason: 'empty-default', corrected: false };
  }

  // ── Tier-1: Intl 直通 / 规范化 ──
  const c0 = intlCanonical(input);
  if (c0) {
    return {
      ok: true, tz: c0, tier: 1, input,
      reason: c0 === input ? 'intl-exact' : 'intl-normalized',
      corrected: c0 !== input,
    };
  }

  // ── Tier-1b: typo 纠正后再校验 ──
  let fixed = input;
  for (const [re, rep] of TYPO_RULES) fixed = fixed.replace(re, rep);
  if (fixed !== input) {
    const c1 = intlCanonical(fixed);
    if (c1) {
      return {
        ok: true, tz: c1, tier: 1, input,
        reason: 'typo-corrected', corrected: true, correctionChain: [input, fixed, c1],
      };
    }
  }

  // ── Tier-2: 按 lat/lon 最近邻推定 ──
  // ⚠️ 坐标有效性必须排除 null / undefined / '' —— 因为 **`Number(null) === 0`、`Number('') === 0`**，
  //   若直接用 Number.isFinite 判定，「**没给坐标**」会被误判成「**坐标在赤道零度 (0°,0°)**」
  //   （几内亚湾）⇒ 推定出一个毫无关系的时区。此陷阱由闸门判据④（注入自测）实测暴露。
  const _coordOk = (v) => v !== null && v !== undefined
    && String(v).trim() !== '' && Number.isFinite(Number(v));
  if (_coordOk(lat) && _coordOk(lon)) {
    const _lat = Number(lat), _lon = Number(lon);
    const nn = _nearestByGeo(_lat, _lon);
    if (nn && intlCanonical(nn.tz)) {
      return {
        ok: true, tz: nn.tz, tier: 2, input,
        reason: 'geo-nearest', corrected: true,
        distanceKm: nn.distanceKm, city: nn.city,
      };
    }
  }

  // ── Tier-3: 不可解析（调用方必须 400）──
  return { ok: false, tz: null, tier: 3, input, reason: 'unresolvable', corrected: false };
}

/** 测试用：清空索引/缓存状态（不改生产行为） */
export function _resetTzResolver() {
  _idx = null; _idxTried = false; _nnCache.clear();
}
