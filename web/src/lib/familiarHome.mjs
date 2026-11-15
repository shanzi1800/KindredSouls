/**
 * familiarHome.mjs — 灵宠「首页座位卡」纯逻辑核（主公特赦令 · 前端呈现线 · E46）
 * ═══════════════════════════════════════════════════════════════════════════
 * 背景：灵宠此前只有**认领入口**（付费墙 FamiliarPicker ＋ 报告尾 AdoptFamiliarCTA），
 *   认领之后**首页毫无呈现**（FamiliarOverlay 是未挂载的 Stub）⇒ 用户再也见不到自己的灵宠。
 *   本核为主公所令「生成灵宠后在首页呈现的形态」提供**唯一真值解析层**。
 *
 * 🔴 三条纪律：
 *   ① **纯函数**：零 DOM / 零网络 / 零 LLM —— `storage` 与 `Date` 一律由调用方注入
 *      （Node 可直接 import 做行为断言，无需 jsdom）；
 *   ② **零伪造**：缺真值 ⇒ 明确返回 null / 空数组，卡片据此**不渲染该行**；
 *      禁臆造星座、禁补 0 分性格轴、禁以默认盘坐标（曼谷 13.75/100.5）冒充出生地；
 *   ③ **认领档单源**：`ks_familiar` 与 FamiliarPicker / AdoptFamiliarCTA **同键同形**
 *      （`{profile, triad, persisted, adoptedAt}`）—— 键名由 `FAMILIAR_HOME_LS_KEY` 常量给出，
 *      组件调用时仍以 FamiliarPicker 的 `FAMILIAR_LS_KEY` 为准传入（防双源漂移）。
 *
 * 🔴 E34 D5 红线（出生真值抽取同源遵守）：抽取结果必须「出生日期 ＋ 成对合法经纬度 ＋ 时区」
 *   四件齐全，缺一 ⇒ null（fail-closed）。宁可不给预填，也绝不静默退默认盘。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ── 测试锚点（与组件同源，闸门据此锁定契约）── */
export const FAMILIAR_HOME_TESTID = 'familiar-home-card';
export const FAMILIAR_HOME_BAR_TESTID = 'familiar-home-bar';
export const FAMILIAR_HOME_FORM_TESTID = 'familiar-home-form';
export const FAMILIAR_HOME_SEAT_TESTID = 'familiar-home-seat';
export const FAMILIAR_HOME_AVATAR_TESTID = 'familiar-home-avatar';

/** 认领档 localStorage 键 —— **必须**与 FamiliarPicker.FAMILIAR_LS_KEY 同值（闸门断言） */
export const FAMILIAR_HOME_LS_KEY = 'ks_familiar';

/* ═══ E140-FIX-HOMEPAGE-FAMILIAR-PERSISTENCE（主公军令 2026-11-15）：业务线溯源 ═══ */

/**
 * 认领业务线闭集：romance＝姻缘 /result（AdoptFamiliarCTA·d1/t1/c1）；
 *   wealth＝财富报告页（AdoptFamiliarCTA·报告盘）。
 * 🔴 病根（军令实测）：三处 E49 校验点全用「异线真值」清洗——首页拿**财富线留痕**
 *   （ks_last_wealth_report/ks_oauth_back_url）校验**姻缘认领档**（compat 常无出生时间，
 *   签名必然不匹配）⇒ 首页挂载即删档 ⇒ 灵宠消失。line 字段让校验线感知：
 *   同线换盘清洗照旧（E49 保真），异线豁免不误杀。
 */
export const FAMILIAR_LINES = Object.freeze(['romance', 'wealth']);

/** 档业务线判别（旧档无 line ⇒ '' ⇒ 沿袭 E49 旧行为全局校验，fail-closed 不臆造） */
export function familiarRecordLine(rec) {
  const r = normalizeFamiliarRecord(rec);
  return r ? r.line : '';
}

/** 五维性格轴（顺序即契约；与 familiar_engine.calculate_familiar_profile 出参 personality 同键） */
export const FAMILIAR_PERSONALITY_KEYS = Object.freeze([
  'talkative', 'clingy', 'moody', 'sarcastic', 'healing',
]);

/** 四象关系模式闭集（与 astro/familiar_engine.py::RELATION_MODES 同源） */
export const FAMILIAR_RELATION_MODES = Object.freeze([
  'girlfriend', 'bestie', 'buddy', 'boyfriend',
]);

/**
 * 出生真值参数别名表 —— **参数名以消费方 `/api/familiar/adopt` 为准**（45-D1 铁律）。
 *   标准名（birthDate/birthTime/lat/lon/tz）优先；`birth*` 兼容名兜底。
 */
export const FAMILIAR_BIRTH_ALIASES = Object.freeze({
  birthDate: ['birthDate', 'birth'],
  birthTime: ['birthTime', 'time'],
  lat: ['lat', 'birthLat'],
  lon: ['lon', 'birthLon'],
  tz: ['tz', 'birthTz'],
});

/** 关系模式闭集判别 */
export function isRelationMode(m) {
  return FAMILIAR_RELATION_MODES.indexOf(m) !== -1;
}

/* ═══ E137.2-COMPANION-NAME-CTA（主公军令 2026-11-13）：灵宠真名单源 ═══ */

/**
 * relation_mode ⇒ IP 名映射（与服务端 familiar_engine.IP_OF 同源白名单；
 * 与 FamiliarHomeCard.IP_OF_MODE 同形——闸门断言同源）。全站唯二 IP 名：
 * Sophia（girlfriend/bestie）· Milo（buddy/boyfriend）。
 */
export const FAMILIAR_IP_OF_MODE = Object.freeze({
  girlfriend: 'Sophia', bestie: 'Sophia', buddy: 'Milo', boyfriend: 'Milo',
});

/**
 * 灵宠真名解析（E137.2 军令：手札主按钮/追问句呼唤真名，永不残留占位符）。
 *   ① 认领档 `ks_familiar` 命中且 `profile.name` 恰为 Sophia/Milo ⇒ 直接采用；
 *   ② 否则按 `profile.relation_mode` 映射 IP 名；
 *   ③ 无档/坏档/直链空降（未显式选宠）⇒ 首页默认守护灵 **Sophia**（军令钦定兜底）。
 * 纯函数：storage 注入（Node 闸门可 mock 断言，零 DOM）。
 * @returns 'Sophia' | 'Milo'（闭集，恒非空——按钮文案永不出现 {name} 字面量）
 */
export function companionDisplayName(storage, key = FAMILIAR_HOME_LS_KEY) {
  const rec = readFamiliarRecord(storage, key);
  if (rec) {
    const n = String(rec.profile.name || '').trim();
    if (n === 'Sophia' || n === 'Milo') return n;
    const ip = FAMILIAR_IP_OF_MODE[String(rec.profile.relation_mode || '')];
    if (ip) return ip;
  }
  return 'Sophia';
}

/* ═══════════ 一 · 认领档读写（形状守卫 · 坏档一概不认）═══════════ */

/**
 * 记录形状守卫。入参可为原始对象或 JSON 字符串。
 * 🔴 缺 `profile.name` 或缺**合法**关系模式 ⇒ null（视作未认领）——
 *   宁可让用户重新认领，也不用一份半坏档案渲染出错位的灵宠。
 */
export function normalizeFamiliarRecord(raw) {
  let o = raw;
  if (typeof raw === 'string') {
    try { o = JSON.parse(raw); } catch { return null; }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  const p = o.profile;
  if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
  const name = typeof p.name === 'string' ? p.name.trim() : '';
  const mode = typeof p.relation_mode === 'string' ? p.relation_mode : '';
  if (!name || !isRelationMode(mode)) return null;
  return {
    profile: p,
    triad: (o.triad && typeof o.triad === 'object' && !Array.isArray(o.triad)) ? o.triad : null,
    persisted: o.persisted === true,
    adoptedAt: typeof o.adoptedAt === 'string' ? o.adoptedAt : '',
    // 🔒 E49（主公亲令 2026-10-14）: 星盘签名 —— 认领档必须与出生盘绑定；
    //   旧档无签名 ⇒ 空串（读取侧判为不匹配 ⇒ 清洗，见 recordMatchesChart）
    chartSig: typeof o.chartSig === 'string' ? o.chartSig : '',
    // 🔒 E140（主公军令 2026-11-15）: 业务线溯源 —— romance/wealth 闭集之外一律
    //   空串（旧档语义：沿袭 E49 全局校验行为，绝不臆造线属）
    line: (o.line === 'romance' || o.line === 'wealth') ? o.line : '',
  };
}

/* ═══════════ 一·B 星盘绑定（E49 · 按盘隔离，禁全局裸存）═══════════ */

/**
 * 星盘签名：birthDate|birthTime|lat|lon|tz（坐标 4 位小数归一）。
 * 🔴 灵宠认领档**严禁**脱离星盘全局裸存 —— 写入必带签名，读取必校验；
 *   用户换生日/城市重新生成报告 ⇒ 新盘未认领前必须呈现原始待选态。
 */
export function familiarChartSig(chart) {
  const c = (chart && typeof chart === 'object') ? chart : {};
  const r4 = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? String(Math.round(n * 10000) / 10000) : '';
  };
  const bt = typeof c.birthTime === 'string' ? c.birthTime.trim() : '';
  return [String(c.birthDate || '').trim(), bt, r4(c.lat), r4(c.lon), String(c.tz || '').trim()].join('|');
}

/**
 * 认领档与当前盘是否匹配。🔴 旧档无签名（chartSig 空）⇒ 一律不匹配
 * （军令「清查 localStorage 旧键值」：历史裸存态在下次读取时自动清洗）。
 */
export function recordMatchesChart(rec, chart) {
  const r = normalizeFamiliarRecord(rec);
  if (!r || !r.chartSig) return false;
  return r.chartSig === familiarChartSig(chart);
}

/* ═══════════ E140 线感知校验（主公军令 2026-11-15 · 军令断言族真源）═══════════ */

/**
 * 报告页线感知去留：当前页（currentLine + 当前盘）是否应**保留**该认领档。
 *   · 档无 line（旧档）⇒ E49 旧语义：recordMatchesChart 定去留；
 *   · 档 line === currentLine ⇒ E49 同线换盘清洗：签名不匹配 ⇒ 弃；
 *   · 档 line 异线 ⇒ **跨线豁免恒保留**（romance 认领档不被 wealth 盘误杀，
 *     wealth 认领档不被 romance 盘误杀——E140 病根根治）。
 * 纯函数（Node 闸门直接断言）。
 */
export function shouldKeepFamiliarRecord(rec, chart, currentLine) {
  const r = normalizeFamiliarRecord(rec);
  if (!r) return false;
  const line = r.line;
  if (line && FAMILIAR_LINES.indexOf(line) !== -1 && line !== String(currentLine || '')) {
    return true; // 跨线豁免
  }
  return recordMatchesChart(r, chart);
}

/**
 * 首页线感知去留（FamiliarHomeCard 挂载即判真源）：
 *   · truth 为 null（纯首页会话）⇒ 恒保留（沿袭 E49「无真值可校验 ⇒ 保留呈现」）；
 *   · truth.source === 'url'（当前页查询串——显式新盘信号）⇒ 全线生效，
 *     recordMatchesChart 定去留（E49 最强语义保留）；
 *   · truth.source 为 'lastReport'/'oauthBack'（**财富线留痕**）⇒ 仅对 wealth 档
 *     与旧档生效；romance 线档豁免——姻缘认领灵宠严禁被异线留痕误杀（军令：
 *     返回首页 100% 稳定常驻，直到测试总监点击「🔄 重置沙盒演练」）。
 */
export function shouldKeepFamiliarOnHome(rec, truth) {
  const r = normalizeFamiliarRecord(rec);
  if (!r) return false;
  if (!truth) return true;
  if (truth.source === 'url') return recordMatchesChart(r, truth);
  if (r.line === 'romance') return true; // 跨线豁免（E140 根治位）
  return recordMatchesChart(r, truth);
}

/** 读档（storage 注入；无档 / 坏档 / 隐私模式 ⇒ null） */
export function readFamiliarRecord(storage, key = FAMILIAR_HOME_LS_KEY) {
  try {
    if (!storage || typeof storage.getItem !== 'function') return null;
    const raw = storage.getItem(key);
    if (!raw) return null;
    return normalizeFamiliarRecord(raw);
  } catch { return null; }
}

/** 写档（恒写规范形状；形状不合法 ⇒ 拒写并返回 false，绝不留半坏档） */
export function writeFamiliarRecord(storage, rec, key = FAMILIAR_HOME_LS_KEY) {
  const n = normalizeFamiliarRecord(rec);
  if (!n) return false;
  try {
    if (!storage || typeof storage.setItem !== 'function') return false;
    storage.setItem(key, JSON.stringify(n));
    return true;
  } catch { return false; }
}

/** 清除认领档（「换一位伙伴」用；storage 不可用 ⇒ false，不抛） */
export function clearFamiliarRecord(storage, key = FAMILIAR_HOME_LS_KEY) {
  try {
    if (!storage || typeof storage.removeItem !== 'function') return false;
    storage.removeItem(key);
    return true;
  } catch { return false; }
}

/* ═══════════ 二 · 呈现派生（全部零伪造）═══════════ */

/**
 * 五维性格轴归一：**只**收录有限数值轴，夹 0..100 取整。
 * 🔴 缺失/非数值轴**直接丢弃**（不补 0、不补 50）⇒ 卡片只画真有的轴。
 */
export function personalityAxes(profile) {
  const p = (profile && typeof profile === 'object') ? profile : {};
  const src = (p.personality && typeof p.personality === 'object') ? p.personality : {};
  const out = [];
  for (const key of FAMILIAR_PERSONALITY_KEYS) {
    const v = src[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    out.push({ key, value: Math.max(0, Math.min(100, Math.round(v))) });
  }
  return out;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
/** 只认 `#RRGGBB` 字面量；其余（含 `rgb()` / 空 / 注入串）一律回落兜底色 —— 防 CSS 注入 */
function safeHex(v, fallback) {
  return (typeof v === 'string' && HEX_RE.test(v.trim())) ? v.trim() : fallback;
}

/**
 * 取呈现配色。优先级：`display_palette` ⇒ `relation.palette` ⇒ 中性灰兜底。
 * 水晶色 / 瞳色取自 profile 顶层（`crystal_color` / `eye_color`）。
 */
export function familiarPalette(profile) {
  const p = (profile && typeof profile === 'object') ? profile : {};
  const dp = (p.display_palette && typeof p.display_palette === 'object') ? p.display_palette : null;
  const relP = (p.relation && typeof p.relation === 'object' && p.relation.palette
    && typeof p.relation.palette === 'object') ? p.relation.palette : null;
  const src = dp || relP || {};
  return {
    primary: safeHex(src.primary, '#8A8A8A'),
    secondary: safeHex(src.secondary, '#C9C9C9'),
    crystal: safeHex(p.crystal_color, '#8A8A8A'),
    eye: safeHex(p.eye_color, '#1E293B'),
  };
}

/**
 * 星源三真相（太阳 / 月亮 / 上升）。缺三元组或全为占位 ⇒ null（卡片不渲染该行）。
 * 🔴 `'?'` 是引擎的「真值缺席」哨兵 ⇒ 视为缺，绝不显示问号给用户。
 */
export function triadTruth(rec) {
  const t = (rec && rec.triad && typeof rec.triad === 'object') ? rec.triad : null;
  if (!t) return null;
  const s = (v) => (typeof v === 'string' && v.trim() !== '' && v.trim() !== '?') ? v.trim() : null;
  const out = { sun: s(t.sunSign), moon: s(t.moonSign), rise: s(t.ascSign) };
  if (!out.sun && !out.moon && !out.rise) return null;
  return out;
}

/** 是否需展示「外观降级」告知（`profile.degraded` 为非空数组 ⇒ 是） */
export function hasDegradation(profile) {
  const d = profile && profile.degraded;
  return Array.isArray(d) && d.length > 0;
}

/** 本地日期键 `YYYY-MM-DD`（非法 Date ⇒ 空串 ⇒ 调用方不取寄语） */
export function localDateKey(d) {
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const day = dt.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * 确定性「今日寄语」索引：种子 = `natal_hash`（缺则名字）＋ 本地日期键。
 * ⇒ 同一灵宠同一天恒取同一句；跨天更换；同一份档案在任何设备上同日一致。
 * @returns 0..count-1；count 非法 ⇒ -1（调用方据此不渲染）
 */
export function whisperIndex(profile, dateKey, count) {
  if (!Number.isInteger(count) || count <= 0) return -1;
  const seed = String((profile && profile.natal_hash) || (profile && profile.name) || '') + '|' + String(dateKey || '');
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % count;
}

/** 出生日期健全性（1900 ≤ 年 ≤ 今日；与 InputPage.validateDate 同口径） */
export function isPlausibleBirthDate(v, now) {
  if (typeof v !== 'string') return false;
  const parts = v.split('-');
  if (parts.length !== 3 || parts.some((p) => !p)) return false;
  const [y, m, d] = parts.map(Number);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false;
  if (y < 1900) return false;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return false;
  const ref = (now instanceof Date) ? new Date(now.getTime()) : new Date();
  ref.setHours(0, 0, 0, 0);
  return dt <= ref;
}

/* ═══════════ 三 · 出生真值抽取（fail-closed · 绝不退默认盘）═══════════ */

function pickParam(params, names) {
  for (const n of names) {
    const v = params.get(n);
    if (v !== null && v !== '') return v;
  }
  return '';
}

/** 从查询串抽出生真值；四件不齐 ⇒ null */
function birthFromQuery(qs) {
  const raw = (typeof qs === 'string' && qs.startsWith('?')) ? qs.slice(1) : String(qs || '');
  let params;
  try { params = new URLSearchParams(raw); } catch { return null; }
  const birthDate = pickParam(params, FAMILIAR_BIRTH_ALIASES.birthDate);
  const birthTime = pickParam(params, FAMILIAR_BIRTH_ALIASES.birthTime);
  const tz = pickParam(params, FAMILIAR_BIRTH_ALIASES.tz);
  const lat = Number(pickParam(params, FAMILIAR_BIRTH_ALIASES.lat));
  const lon = Number(pickParam(params, FAMILIAR_BIRTH_ALIASES.lon));
  // 🔴 fail-closed：日期 ＋ 成对合法坐标 ＋ 时区，缺一 ⇒ null
  if (!isPlausibleBirthDate(birthDate)) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  if (!tz) return null;
  return { birthDate, birthTime, lat, lon, tz };
}

/** 取 URL 的查询串部分（无 `?` ⇒ 空串） */
function queryFromUrl(url) {
  const u = String(url || '');
  const i = u.indexOf('?');
  return i === -1 ? '' : u.slice(i);
}

/**
 * 首页出生真值抽取（**只读**，三重来源按优先级）：
 *   ① 当前页查询串（用户刚从报告页/输入页回来）
 *   ② `ks_last_wealth_report` 留痕 URL（lastReportUrl.mjs 所写）
 *   ③ `ks_oauth_back_url` 回跳 URL（WealthReportPage 所写）
 * @returns `{birthDate,birthTime,lat,lon,tz,source}` | null
 */
export function extractBirthTruth(search, storage) {
  const direct = birthFromQuery(search);
  if (direct) return Object.assign(direct, { source: 'url' });

  try {
    if (storage && typeof storage.getItem === 'function') {
      const rec = JSON.parse(storage.getItem('ks_last_wealth_report') || 'null');
      if (rec && typeof rec.url === 'string') {
        const t = birthFromQuery(queryFromUrl(rec.url));
        if (t) return Object.assign(t, { source: 'lastReport' });
      }
    }
  } catch { /* 坏档忽略，继续下一来源 */ }

  try {
    if (storage && typeof storage.getItem === 'function') {
      const back = storage.getItem('ks_oauth_back_url');
      if (back) {
        const t = birthFromQuery(queryFromUrl(back));
        if (t) return Object.assign(t, { source: 'oauthBack' });
      }
    }
  } catch { /* 忽略 */ }

  return null;
}
