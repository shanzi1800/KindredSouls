/**
 * wealthChartSig.mjs — E131-A 财富 once 档「按盘隔离」盘签名纯逻辑核
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E131-WEALTH-FUNNEL-AND-REPORT-FRAME（主公 2026-11-09）】：
 *   病灶①「权限串流」——账号级 paid_plans.wealth_once 布尔对**任意生日盘**放行，
 *   新输入的生日直接短路跳过 $4.99 付费墙。
 *   铁则：只要当前测算的这组 birth+birthTime 坐标尚未**单独支付解锁**过先天财富报告
 *   （或用户非有效期内全通订阅会员），哪怕 localStorage 已认领灵宠也禁跳付费墙。
 *
 * 治法：$4.99 付讫时把「盘签名」落库进 paid_plans.wealth_once_charts（封顶 50 防膨胀）；
 *   解锁判定 = 盘签名在名单 ∪ 有效全通（年卡/月订）∪ 绿道。
 *
 * 🔴 三条纪律（与全仓铁律同源）：
 *   ① **纯函数**：零 DOM / 零网络 / 零 LLM —— Node 可直接 import 做行为断言；
 *   ② **前后端同源**：签名形态 `birthDate|birthTime|lat|lon|tz`（坐标 toFixed(4) 归一）
 *      与 server.js::wealthChartSigOf / normalizeWealthChartSig 逐字镜像，
 *      e131 闸门以「同输入同输出」双向锁定（改任一侧必转红）；
 *   ③ **fail-closed**：缺 birth / 畸形签名 ⇒ ''（视同未付讫，必停付费墙），
 *      绝不以默认盘冒充真实出生地写入权益名单。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 盘签名名单容量上限（防 jsonb 无限膨胀；与 server.js::WEALTH_CHART_SIG_MAX 同值） */
export const WEALTH_CHART_SIG_MAX = 50;

/** 盘签名形态校验（与 server.js::FAMILIAR_CHART_SIG_RE 同源口径） */
const WEALTH_CHART_SIG_RE = /^\d{4}-\d{2}-\d{2}\|[^|]*\|-?[\d.]+\|-?[\d.]+\|[^|]*$/;

/** 坐标 4 位小数归一（恒 toFixed(4) 形态——前后端唯一真源，禁 String(n) 自由形态） */
const _r4 = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(4) : '';
};

/** 五件套 ⇒ 盘签名（birthDate 缺失 ⇒ ''，fail-closed） */
export function wealthChartSigOf(birthDate, birthTime, lat, lon, tz) {
  const bd = String(birthDate == null ? '' : birthDate).trim().slice(0, 10);
  const bt = String(birthTime == null ? '' : birthTime).trim().slice(0, 5);
  const tzS = String(tz == null ? '' : tz).trim();
  return [bd, bt, _r4(lat), _r4(lon), tzS].join('|');
}

/** 任意入参 ⇒ 规范盘签名（畸形 ⇒ ''；合法 ⇒ 逐件归一后重铸） */
export function normalizeWealthChartSig(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (!WEALTH_CHART_SIG_RE.test(s)) return '';
  const parts = s.split('|');
  return wealthChartSigOf(parts[0], parts[1], parts[2], parts[3], parts[4]);
}

/** once 档按盘付讫判定：账号位 + 盘签名名单双闸（缺一不放行） */
export function wealthOnceChartListed(paidPlans, chartSig) {
  if (!chartSig) return false;
  const p = (paidPlans && typeof paidPlans === 'object' && !Array.isArray(paidPlans)) ? paidPlans : {};
  if (p.wealth_once !== true) return false;
  const list = Array.isArray(p.wealth_once_charts) ? p.wealth_once_charts : [];
  return list.indexOf(chartSig) !== -1;
}

/** 有效全通判定（年卡/月订，任一在期即真；与 wealthEntitledFor 的 ap/apm 口径一致） */
export function wealthAllPassActive(paidPlans, nowMs) {
  const p = (paidPlans && typeof paidPlans === 'object' && !Array.isArray(paidPlans)) ? paidPlans : {};
  const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  const exp = (v) => {
    if (!v) return Infinity; // 缺失 ⇒ 视为永续（与 wealthEntitledFor 同口径）
    const t = Date.parse(String(v));
    return Number.isFinite(t) ? t : Infinity;
  };
  const ap = p.all_pass_yearly === true && exp(p.all_pass_expires_at) > now;
  const apm = p.all_pass_monthly === true && exp(p.all_pass_monthly_expires_at) > now;
  return ap || apm;
}

/**
 * URL ⇒ 当前盘签名（WealthReportPage / SandboxCashier 共用唯一入口）。
 * 坐标回退与 WealthReportPage::deriveWealthBirthParams 同源：无显式 lat/lon ⇒ 曼谷默认盘；
 * 越界坐标 ⇒ 同样回落默认（绝不让畸形坐标铸进权益名单）。
 * 缺 birth（非报告页上下文，如 /sandbox-pay 直达）⇒ ''（body 只带 plan，行为零变）。
 * ⚠️ time 缺省 '12:00' —— 与 WealthReportPage state 默认（V91「默认 Bangkok 中午」）逐字同源：
 *    「只填生日不填时间」的盘，前端落库签名与后端请求体签名必须同形，否则付讫后 402 死锁。
 */
export function wealthChartSigFromSearch(search) {
  let p;
  try {
    const raw = (typeof search === 'string' && search.startsWith('?')) ? search.slice(1) : String(search || '');
    p = new URLSearchParams(raw);
  } catch (_) { return ''; }
  const birthDate = (p.get('birth') || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return '';
  const birthTime = (p.get('time') || p.get('birthTime') || '12:00').trim().slice(0, 5);
  const latRaw = p.get('lat');
  const lonRaw = p.get('lon');
  const latN = Number(latRaw);
  const lonN = Number(lonRaw);
  const lat = (latRaw !== null && Number.isFinite(latN) && latN >= -90 && latN <= 90) ? latN : 13.75;
  const lon = (lonRaw !== null && Number.isFinite(lonN) && lonN >= -180 && lonN <= 180) ? lonN : 100.5;
  const tz = (p.get('tz') || p.get('birthTz') || 'Asia/Bangkok').trim() || 'Asia/Bangkok';
  return wealthChartSigOf(birthDate, birthTime, lat, lon, tz);
}
