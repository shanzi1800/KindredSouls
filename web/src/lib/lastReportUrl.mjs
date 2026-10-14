/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  P0（2026-10-14）· 周期锁态「查看已生成报告」纯核（单一真源）
 * ═══════════════════════════════════════════════════════════════════════════
 *  缺陷史（线上实测，主公截屏 2026-10-14 08:26）：
 *    月报**账号级月锁**命中后，报告页只渲染一行裸错误文本 + 「重试」按钮
 *    （点下去必然再次失败）⇒ 死胡同：用户既不知规则、也无路可走。
 *
 *  本核职责（全部为纯函数 / 注入式，零 DOM 依赖 ⇒ 可被闸门直接 import 断言）：
 *    ① `buildLastReportUrl(search, req)`  生成成功时落痕 & 锁定卡回跳 URL
 *    ② `saveLastReport` / `readLastReport` localStorage 留痕读写（storage 注入，便于测试）
 *    ③ `formatLockDate(iso, lang)`        「下次可生成」日期本地化
 *    ④ `isPeriodLockCode(code)`           周期锁错误码判别（与 server.js GUARD code 同源）
 *
 *  铁律：
 *     A. 回跳 URL 一律经 `buildWealthRestoreUrl`（45-D2c 白名单**单一真源**）；
 *     B. 参数名以**消费方** `deriveWealthBirthParams` 为准（`time|birthTime` / `lat` / `lon` / `tz`）；
 *     C. 🔴 空值 / `'undefined'` / `'null'` / `'NaN'` **绝不写入** ——
 *        否则 URL 被毒化（`lat=undefined`）⇒ 服务端坐标解析回退默认盘（曼谷）
 *        ⇒ 与 45-D1「参数名错位 ⇒ 曼谷默认盘」**同源暗雷**；
 *     D. `lat=0` 等 **falsy 但合法**的值必须保留（铁律：falsy ≠ 非法）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { buildWealthRestoreUrl } from './wealthRestore.mjs';

export const KS_LAST_REPORT_KEY = 'ks_last_wealth_report';

/** 周期锁错误码（与 server.js `wealthGuardBody` 的 code 同源；判别只以此表为准） */
export const PERIOD_LOCK_CODES = [
  'MONTHLY_WEALTH_REPORT_QUOTA_EXHAUSTED',
  'YEARLY_WEALTH_REPORT_QUOTA_EXHAUSTED',
];

/** 是否为「周期锁」（月报/年报 403）——锁态渲染体面锁定卡，而非裸错误文本 */
export const isPeriodLockCode = (code) => PERIOD_LOCK_CODES.indexOf(String(code == null ? '' : code)) !== -1;

/** 报告页路径（锁定卡「查看已生成报告」回跳落点） */
export const REPORT_PATH = '/wealth/report';

/** 单键写入守卫：空值 / 字面 'undefined' 等一律**不写**（铁律 C / D） */
const _put = (extra, k, v) => {
  if (v === undefined || v === null) return;
  const s = String(v);
  if (!s || s === 'undefined' || s === 'null' || s === 'NaN') return;
  extra[k] = s;
};

/**
 * 构造「查看已生成报告」回跳 URL。
 * @param {string} search 当前查询串（权威形态由 WealthPage 按 45-D2c D5 规则产出）
 * @param {{birthDate?:string, lang?:string, birthTime?:unknown, lat?:unknown, lon?:unknown, tz?:unknown}} req
 * @returns {string}
 */
export const buildLastReportUrl = (search, req) => {
  const r = req || {};
  const extra = {};
  _put(extra, 'time', r.birthTime);
  _put(extra, 'birthTime', r.birthTime);
  _put(extra, 'lat', r.lat);
  _put(extra, 'lon', r.lon);
  _put(extra, 'tz', r.tz);
  _put(extra, 'birthLat', r.lat);
  _put(extra, 'birthLon', r.lon);
  _put(extra, 'birthTz', r.tz);
  return buildWealthRestoreUrl(
    REPORT_PATH,
    search || '',
    { birthDate: r.birthDate || '', lang: r.lang || '' },
    extra,
  );
};

/** 生成成功时留痕（供锁定卡「查看已生成报告」同参重开走服务端 Cache HIT） */
export const saveLastReport = (storage, type, req, search) => {
  try {
    storage.setItem(
      KS_LAST_REPORT_KEY,
      JSON.stringify({ url: buildLastReportUrl(search, req), type, at: Date.now() }),
    );
  } catch {}
};

/** 读取留痕；**类型不匹配**（月报 ↔ 年报）一律返回空串，绝不给出错板块的回跳 */
export const readLastReport = (storage, type) => {
  try {
    const raw = storage.getItem(KS_LAST_REPORT_KEY);
    if (!raw) return '';
    const o = JSON.parse(raw);
    return o && o.type === type && typeof o.url === 'string' ? o.url : '';
  } catch { return ''; }
};

/** 「下次可生成」日期本地化（`nextAvailable` 为 ISO；无值/非法 ⇒ 空串 ⇒ 调用方不渲染该行） */
export const formatLockDate = (iso, lang) => {
  if (!iso) return '';
  const d = new Date(String(iso));
  if (isNaN(d.getTime())) return '';
  const loc = lang === 'zh' ? 'zh-CN' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR'
    : lang === 'th' ? 'th-TH' : lang === 'vi' ? 'vi-VN' : 'en-US';
  try {
    return d.toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return String(iso).slice(0, 10); }
};
