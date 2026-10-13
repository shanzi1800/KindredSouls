/**
 * houseOverlayStore.mjs — P0-1「旁置真值回放」客户端本地留存纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 病根（Gate 44 续项 · 如实登记，非缺陷、非伪造）：
 *   · Gate 41 read-through 命中为**零算力路径**（不重跑引擎、不扣配额）；
 *   · Gate 44 宫位真值走**响应信封旁置**（`houseOverlay`），**未入库** ——
 *     因 Gate 41 `ai_context` **五键被精确锁定**（persistVersion / reportId /
 *     reportType / schemaVersion / payload）⇒ 旁置真值**不可入库**
 *     （硬约束：扩键即引爆 Gate 41 键集断言）。
 *   ⇒ 命中缓存秒回时宫位网格不渲染（如实反映「本轮无新推演」）。
 *
 * 本核职责（旁置回放之第二通路：**客户端本地留存**）：
 *   · MISS 生成成功 ⇒ 以 `reportId`（sha256 hex 截取）为键**旁置留存**真值四键；
 *   · HIT 秒回（回执照旧携带 `reportId`）⇒ 按键**回放**旁置真值 ⇒ 网格照常渲染。
 *   🔴 服务端零改动 · 零 DDL · 零算力：HIT 仍是纯读缓存 + 本地回放。
 *
 * 🔴 四条纪律（与全仓铁律同源）：
 *   ① **只存真值四键**（available / precision / a / b）—— 禁存正文与载荷（体积与隐私双守）；
 *   ② **形状守卫与 Gate 44 同源**：available !== true、缺 a·b、空映射 `{}`、
 *      宫位值非 1..12 整数 ⇒ **拒存拒放**（绝不臆造宫位、绝不渲染「十二宫皆空」）；
 *   ③ **有界**：最多 OVERLAY_STORE_MAX_ENTRIES 条，按 ts 升序淘汰（防 localStorage 无限膨胀）；
 *   ④ **fail-safe**：storage 缺省（Node / 隐私模式 / 配额满）⇒ 静默降级（false / null），
 *      绝不抛错、绝不阻断报告交付。
 *
 * 🔴 纯逻辑核：零 import / 零网络 / 零 DOM / 零 LLM；storage **可注入** ⇒ Node 可直接单测。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 留存契约版本（形状变更必须升版 ⇒ 旧记录自然失配、自愈清除） */
export const OVERLAY_STORE_VERSION = 'houseOverlayStore.v1';

/** 键前缀（含契约版本；prune 只认本前缀，绝不误删他人键） */
export const OVERLAY_STORE_KEY_PREFIX = 'ksHouseOverlay:v1:';

/** 留存上限（条）—— 有界防膨胀 */
export const OVERLAY_STORE_MAX_ENTRIES = 20;

/** Report ID 形状（sha256 hex 截取；16..64 位十六进制，杜绝任意串注入键空间） */
const REPORT_ID_RE = /^[0-9a-f]{16,64}$/i;

/**
 * 由 reportId 派生留存键。
 * @returns 合法 ⇒ `ksHouseOverlay:v1:<reportId>`；非法（非串/非 hex）⇒ null（拒存拒放）
 */
export function overlayStoreKey(reportId) {
  if (typeof reportId !== 'string') return null;
  const id = reportId.trim();
  if (!REPORT_ID_RE.test(id)) return null;
  return OVERLAY_STORE_KEY_PREFIX + id;
}

/** 宫位映射合法性：普通对象 · 非空 · 值全为 1..12 整数（与 Gate 44 `_houseOf` 同判据） */
export function isHouseMap(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) return false;
  const keys = Object.keys(m);
  if (keys.length === 0) return false;
  for (const k of keys) {
    const v = m[k];
    if (!Number.isInteger(v) || v < 1 || v > 12) return false;
  }
  return true;
}

/**
 * 归一化旁置真值（**只取真值四键**，其余字段一律剔除）。
 * 🔴 缺真值/形状不合 ⇒ null（绝不臆造；空映射 `{}` 亦拒 —— 与 Gate 44 派生核同纪律）。
 * @returns {available:true, precision:string, a:object, b:object} 或 null
 */
export function normalizeOverlay(o) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  if (o.available !== true) return null;
  const precision = (typeof o.precision === 'string' && o.precision.trim()) ? o.precision : null;
  if (!precision) return null;
  if (!isHouseMap(o.a) || !isHouseMap(o.b)) return null;
  return { available: true, precision, a: { ...o.a }, b: { ...o.b } };
}

/** 取用 storage（可注入；缺省回落 globalThis.localStorage，任何异常一律 null） */
function resolveStorage(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try {
    const g = (typeof globalThis !== 'undefined') ? globalThis : null;
    const s = g ? g.localStorage : null;
    return (s && typeof s.getItem === 'function' && typeof s.setItem === 'function') ? s : null;
  } catch (e) {
    return null;
  }
}

/**
 * 旁置留存（MISS 生成成功后调用）。
 * 🔴 fail-safe：键非法 / 真值不合 / storage 不可用 / 写入异常 ⇒ 一律 false（绝不抛错）。
 * @returns {boolean} 是否实际写入
 */
export function saveHouseOverlay(reportId, overlay, storage) {
  const key = overlayStoreKey(reportId);
  const norm = normalizeOverlay(overlay);
  const S = resolveStorage(storage);
  if (!key || !norm || !S) return false;
  try {
    S.setItem(key, JSON.stringify({ v: OVERLAY_STORE_VERSION, ts: Date.now(), o: norm }));
    pruneHouseOverlayStore(OVERLAY_STORE_MAX_ENTRIES, S);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 旁置回放（HIT 秒回时调用）。
 * 🔴 版本哨兵失配 / 形状不合 / 记录损坏 ⇒ 清除该键并返回 null（自愈；绝不回放未知结构）。
 * @returns {available:true, precision, a, b} 或 null
 */
export function loadHouseOverlay(reportId, storage) {
  const key = overlayStoreKey(reportId);
  const S = resolveStorage(storage);
  if (!key || !S) return null;
  try {
    const raw = S.getItem(key);
    if (typeof raw !== 'string' || raw === '') return null;
    // 🔴 自愈：非 JSON / 版本哨兵失配 / 形状不合 ⇒ 一律清除该键并返回 null（绝不回放未知结构）
    let rec = null;
    try { rec = JSON.parse(raw); } catch (e) { rec = null; }
    const versionOk = !!rec && typeof rec === 'object' && rec.v === OVERLAY_STORE_VERSION && Number.isFinite(rec.ts);
    const norm = versionOk ? normalizeOverlay(rec.o) : null;
    if (!norm) {
      try { S.removeItem(key); } catch (e) { /* noop */ }
      return null;
    }
    return norm;
  } catch (e) {
    return null;
  }
}

/**
 * 有界淘汰（按键 ts 升序，超出上限者先出）。
 * 🔴 只认本核前缀键 ⇒ 绝不误删他人键；storage 无 length/key 能力 ⇒ 不动作（返回 0）。
 * @returns {number} 实际清除条数
 */
export function pruneHouseOverlayStore(maxEntries, storage) {
  const S = resolveStorage(storage);
  const cap = (Number.isInteger(maxEntries) && maxEntries > 0) ? maxEntries : OVERLAY_STORE_MAX_ENTRIES;
  if (!S || typeof S.length !== 'number' || typeof S.key !== 'function') return 0;
  try {
    const keys = [];
    for (let i = 0; i < S.length; i++) {
      const k = S.key(i);
      if (typeof k === 'string' && k.indexOf(OVERLAY_STORE_KEY_PREFIX) === 0) keys.push(k);
    }
    if (keys.length <= cap) return 0;
    const scored = keys.map((k) => {
      let ts = 0;
      try {
        const r = JSON.parse(S.getItem(k) || '');
        ts = (r && Number.isFinite(r.ts)) ? r.ts : 0;
      } catch (e) { ts = 0; }
      return { k, ts };
    });
    scored.sort((x, y) => x.ts - y.ts);
    let removed = 0;
    for (const it of scored.slice(0, scored.length - cap)) {
      try { S.removeItem(it.k); removed++; } catch (e) { /* noop */ }
    }
    return removed;
  } catch (e) {
    return 0;
  }
}
