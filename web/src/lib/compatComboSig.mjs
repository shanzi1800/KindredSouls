/**
 * compatComboSig.mjs — E148-刀二 合婚 once 档「按盘隔离」双盘组合签名纯逻辑核
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E148（主公 2026-11-19）·裁决③：复用 E131 对称形制，不造新缓存键】：
 *   病灶：账号级 paid_plans.compatibility_once 布尔位只绑账号不绑盘——换一对
 *   新人（新 d1/d2 双盘）直接短路跳过 $4.99 付费墙（权限串流，E131 同型）。
 *   治法：付讫时把「双盘组合签名」落库进 paid_plans.compatibility_once_charts
 *   （封顶 50 防膨胀）；解锁判定走名单；老用户（位 true 且名单空）首次回访
 *   由服务端懒回填锚定当前组合（read-merge-write best-effort）。
 * 🔴 纪律（与 wealthChartSig.mjs 同源三条）：
 *   ① 纯函数：零 DOM / 零网络 / 零 LLM —— Node 可直接 import 做行为断言；
 *   ② **前后端同源**：单人盘块 `birthDate|birthTime|lat|lon|tz`（坐标
 *      toFixed(4) 归一），双块按字典序排序后以 `~` 拼接（同一对伴侣不拘
 *      a/b 输入序恒同签名）；与 server.js::compatComboSigOf /
 *      normalizeCompatComboSig 逐字镜像，e148 闸门以「同输入同输出」
 *      双向锁定（改任一侧必转红）；
 *   ③ fail-closed：缺任一方生日 / 畸形签名 / 同盘自合 ⇒ ''（视同未付讫，
 *      必停付费墙），绝不以默认盘冒充真实双盘写入权益名单。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 组合签名名单容量上限（防 jsonb 无限膨胀；与 server.js::COMPAT_COMBO_SIG_MAX 同值） */
export const COMPAT_COMBO_SIG_MAX = 50;

/** 单人盘块形态校验（与 server.js::FAMILIAR_CHART_SIG_RE 同源口径） */
const COMPAT_PERSON_BLOCK_RE = /^\d{4}-\d{2}-\d{2}\|[^|]*\|-?[\d.]+\|-?[\d.]+\|[^|]*$/;

/** 坐标 4 位小数归一（恒 toFixed(4) 形态——前后端唯一真源，禁 String(n) 自由形态） */
const _r4 = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(4) : '';
};

/** 五件套 ⇒ 单人盘块（birthDate 缺失 ⇒ ''，fail-closed） */
export function compatPersonBlock(birthDate, birthTime, lat, lon, tz) {
  const bd = String(birthDate == null ? '' : birthDate).trim().slice(0, 10);
  const bt = String(birthTime == null ? '' : birthTime).trim().slice(0, 5);
  const tzS = String(tz == null ? '' : tz).trim();
  return [bd, bt, _r4(lat), _r4(lon), tzS].join('|');
}

/**
 * 双盘六参 ⇒ 组合签名（任一方生日缺失/同盘自合 ⇒ ''，fail-closed）。
 * c1/c2 为城市记录（{lat,lon,tz}——null/坏形状 ⇒ 空坐标，签名自然不合法）。
 */
export function compatComboSigOf(d1, d2, t1, t2, c1, c2) {
  const bd1 = String(d1 == null ? '' : d1).trim().slice(0, 10);
  const bd2 = String(d2 == null ? '' : d2).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bd1) || !/^\d{4}-\d{2}-\d{2}$/.test(bd2)) return '';
  const city = (v) => (v && typeof v === 'object' ? v : {});
  const blocks = [
    compatPersonBlock(bd1, t1, city(c1).lat, city(c1).lon, city(c1).tz),
    compatPersonBlock(bd2, t2, city(c2).lat, city(c2).lon, city(c2).tz),
  ].sort();
  if (blocks[0] === blocks[1]) return '';
  return blocks[0] + '~' + blocks[1];
}

/** 任意入参 ⇒ 规范组合签名（畸形 ⇒ ''；合法 ⇒ 双块逐件归一后重铸） */
export function normalizeCompatComboSig(raw) {
  const s = String(raw == null ? '' : raw).trim();
  if (!s) return '';
  const halves = s.split('~');
  if (halves.length !== 2) return '';
  const blocks = halves.map((h) => {
    const f = String(h || '').split('|');
    return compatPersonBlock(f[0], f[1], f[2], f[3], f[4]);
  }).sort();
  if (blocks[0] === blocks[1]) return '';
  if (!blocks.every((b) => COMPAT_PERSON_BLOCK_RE.test(b))) return '';
  return blocks[0] + '~' + blocks[1];
}

/** once 档按盘付讫判定：账号位 + 组合签名名单双闸（缺一不放行） */
export function compatOnceComboListed(paidPlans, comboSig) {
  if (!comboSig) return false;
  const p = (paidPlans && typeof paidPlans === 'object' && !Array.isArray(paidPlans)) ? paidPlans : {};
  if (p.compatibility_once !== true) return false;
  const list = Array.isArray(p.compatibility_once_charts) ? p.compatibility_once_charts : [];
  return list.indexOf(comboSig) !== -1;
}

/**
 * URL ⇒ 组合签名（SandboxCashier doPay 从收银台 url 的 combo_sig query 提取用）。
 * 缺参/畸形 ⇒ ''（body 不挂 combo_sig 键，旧行为零变——与 wealthChartSigFromSearch 同形制）。
 */
export function compatComboSigFromSearch(search) {
  try {
    const raw = (typeof search === 'string' && search.startsWith('?')) ? search.slice(1) : String(search || '');
    const p = new URLSearchParams(raw);
    return normalizeCompatComboSig(p.get('combo_sig') || '');
  } catch (_) { return ''; }
}
