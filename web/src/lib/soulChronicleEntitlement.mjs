/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E145-刀四 SOUL-CHRONICLE-ENTITLEMENT（军令 2026-11-19）：灵魂成长年鉴纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（立即开通＋按权益免费解锁——替主人「沉淀生命资产」）：
 *   · 权益四档（严格落码校验，fail-closed）：
 *     ① 已购姻缘年度报告（$29.99 / paid_plans.love_yearly）⇒ 姻缘模块免费；
 *     ② 已购财富年度报告（$29.99 / paid_plans.wealth_yearly_report）⇒ 财富模块免费；
 *     ③ 连续支付满 6 个月 $9.99 月度全通（all_pass_monthly 在期＋
 *        all_pass_monthly_streak ≥ 6）⇒ 双模块免费；
 *     ④ $99.99 年度全通（all_pass_yearly 在期）⇒ 双模块免费。
 *   · 年鉴正文＝前端本地排版导出（阶段星象/关键塔罗/情绪蜕变/灵犀羁绊
 *     轨迹；Blob HTML 下载——零重型服务端渲染）。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；六语自容 L_ 字典（零 i18n
 *    键扰动）；fail-closed：坏 paidPlans 一律全 false；对话舱红线＝本核
 *    与组件输出零价格字眼（权益态只用「已解锁/待解锁」中性词）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 语言白名单（六语闭集） */
export const CHRONICLE_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** lang 白名单守卫（六语外 ⇒ en 兜底） */
function sanitizeLang(l) {
  return CHRONICLE_LOCALES.includes(String(l || '')) ? String(l) : 'en';
}

/** 灵魂成长年鉴标题（军令六语对照表逐字） */
export const L_CHRONICLE_TITLE = Object.freeze({
  zh: '灵魂成长年鉴', en: 'Soul Growth Chronicle', fr: 'Chronique de l’Âme',
  es: 'Crónica del Alma', th: 'บันทึกการเติบโตของจิตวิญญาณ', vi: 'Biên Niên Tăng Trưởng Tâm Hồn',
});

/** 权益态中性词（零价格字眼——对话舱红线安全） */
export const L_CHRONICLE_STATE = Object.freeze({
  unlocked: Object.freeze({
    zh: '已解锁', en: 'Unlocked', fr: 'Débloqué', es: 'Desbloqueado', th: 'ปลดล็อกแล้ว', vi: 'Đã mở khóa',
  }),
  locked: Object.freeze({
    zh: '待解锁', en: 'Awaiting', fr: 'En attente', es: 'En espera', th: 'รอปลดล็อก', vi: 'Chờ mở khóa',
  }),
  module: Object.freeze({
    romance: Object.freeze({ zh: '姻缘', en: 'Romance', fr: 'Romance', es: 'Romance', th: 'ความรัก', vi: 'Duyên Phận' }),
    wealth: Object.freeze({ zh: '财富', en: 'Wealth', fr: 'Richesse', es: 'Riqueza', th: 'การเงิน', vi: 'Tài Lộc' }),
  }),
  exportCta: Object.freeze({
    zh: '导出年鉴', en: 'Export Chronicle', fr: 'Exporter la Chronique', es: 'Exportar Crónica', th: 'บันทึกฉบับเต็ม', vi: 'Xuất Niên Giám',
  }),
});

/**
 * 灵魂成长年鉴权益四档判定（与 wealthEntitledFor 同口径的「在期」校验）
 * @param {object|null} paidPlans user_profiles.paid_plans（jsonb 原档）
 * @returns {{romance: boolean, wealth: boolean, basis: string|null}}
 *   basis: 'love_yearly' | 'wealth_yearly' | 'monthly_streak6' | 'all_pass_yearly' | null
 */
export function chronicleEntitlementFor(paidPlans) {
  const none = { romance: false, wealth: false, basis: null };
  const p = (paidPlans && typeof paidPlans === 'object') ? paidPlans : null;
  if (!p) return none;
  const now = Date.now();
  const expOk = (v) => !v || new Date(v).getTime() > now; // 缺失 ⇒ 视为永续（同 wealthEntitledFor 口径）
  // ④ $99.99 年度全通（在期）⇒ 双模块
  if (p.all_pass_yearly === true && expOk(p.all_pass_expires_at)) {
    return { romance: true, wealth: true, basis: 'all_pass_yearly' };
  }
  // ③ 连续支付满 6 个月 $9.99 月度全通（在期＋streak ≥6）⇒ 双模块
  const streak = Number(p.all_pass_monthly_streak);
  if (p.all_pass_monthly === true && expOk(p.all_pass_monthly_expires_at)
    && Number.isFinite(streak) && streak >= 6) {
    return { romance: true, wealth: true, basis: 'monthly_streak6' };
  }
  // ①② $29.99 双年报各自模块（姻缘＝compatibility_yearly_report 服务端真源键；
  //    love_yearly 仅为 REPORT_KIND 描述词，容错双认）
  const romance = p.compatibility_yearly_report === true || p.love_yearly === true;
  const wealth = p.wealth_yearly_report === true;
  if (romance && wealth) return { romance: true, wealth: true, basis: 'compatibility_yearly+wealth_yearly' };
  if (romance) return { romance: true, wealth: false, basis: 'compatibility_yearly_report' };
  if (wealth) return { romance: false, wealth: true, basis: 'wealth_yearly_report' };
  return none;
}

/* ═══ E147-刀四（军令 2026-11-19）：双门槛防空壳门控 ═══
 * 军令：达到付费门槛后也须等对应时间节点（至少满 30 天蓄能周期）＋有效
 * 轨迹 ≥5 条才启封——否则导出空壳。锚点真源＝paid_plans.chronicle_anchor_at
 * （server 懒回填：首次权益命中时写入 now）；轨迹真源＝paid_plans.
 * chronicle_sessions（E145 蒸馏 merge 后 fire-and-forget 持久化，随 done
 * 帧同步前端 localStorage `ks_chronicle_state`）。
 * 状态三档：locked（无权益）＞ charging（蓄能中）＞ unlocked（双门槛齐过）。 */

/** 军令钦定门控常量：启封周期 ≥30 天；有效轨迹 ≥5 条 */
export const CHRONICLE_RIPEN_DAYS = 30;
export const CHRONICLE_MIN_TRAJECTORY = 5;

/** localStorage 键（E143 白名单族新成员） */
export const CHRONICLE_STATE_KEY = 'ks_chronicle_state';

/** 蓄能态标准文案（军令钦定六语对照表逐字：⏳ 编纂蓄能中·已沉淀 N 条轨迹·预计 YYYY-MM-DD 启封） */
export const L_CHRONICLE_CHARGING = Object.freeze({
  zh: '⏳ 编纂蓄能中·已沉淀 {n} 条轨迹·预计 {date} 启封',
  en: '⏳ Chronicle in the making · {n} trails gathered · opens {date}',
  fr: '⏳ Chronique en préparation · {n} traces recueillies · ouverture {date}',
  es: '⏳ Crónica en elaboración · {n} trazas reunidas · abre {date}',
  th: '⏳ กำลังรวบรวม · มี {n} รอยเส้นทาง · เปิด {date}',
  vi: '⏳ Đang biên soạn · đã tích lũy {n} dấu vết · mở khóa {date}',
});

/**
 * 客户端蓄能态档案读取（done 帧随行回写——readSoulBondState 同形制）
 * @param {Storage|null} ls window.localStorage（隐私模式 null ⇒ 全空）
 * @returns {{anchorAt: string|null, sessions: number}}
 */
export function readChronicleState(ls) {
  try {
    const raw = (ls && typeof ls.getItem === 'function') ? ls.getItem(CHRONICLE_STATE_KEY) : null;
    const j = raw ? JSON.parse(raw) : null;
    const o = (j && typeof j === 'object') ? j : {};
    const a = (typeof o.anchorAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(o.anchorAt))
      ? o.anchorAt : null;
    const s = (Number.isFinite(Number(o.sessions)) && Number(o.sessions) >= 0
      && Number(o.sessions) <= 9999) ? Math.floor(Number(o.sessions)) : 0;
    return { anchorAt: a, sessions: s };
  } catch {
    return { anchorAt: null, sessions: 0 };
  }
}

/**
 * E147-刀四双门槛门控（纯函数——组件与 server 共用判定真源）
 * @param {object|null} paidPlans user_profiles.paid_plans（jsonb 原档）
 * @param {'romance'|'wealth'} module 年鉴篇章
 * @param {number} trajectoryCount 有效轨迹数（客户端随行/服务端持久档）
 * @param {number} nowMs 当前毫秒（缺省 ⇒ Date.now）
 * @returns {{status: 'locked'|'charging'|'unlocked', entitled: boolean,
 *   unlockDateISO: string|null, trajectory: number, basis: string|null}}
 */
export function chronicleModuleGate(paidPlans, module, trajectoryCount, nowMs) {
  const ent = chronicleEntitlementFor(paidPlans);
  const entitled = module === 'romance' ? ent.romance : ent.wealth;
  const p = (paidPlans && typeof paidPlans === 'object') ? paidPlans : {};
  const traj = (Number.isFinite(Number(trajectoryCount)) && Number(trajectoryCount) >= 0)
    ? Math.floor(Number(trajectoryCount)) : 0;
  const now = Number.isFinite(Number(nowMs)) ? Number(nowMs) : Date.now();
  if (!entitled) {
    return { status: 'locked', entitled: false, unlockDateISO: null, trajectory: traj, basis: ent.basis };
  }
  // 锚点解析（paid_plans.chronicle_anchor_at ISO；缺失 ⇒ 未锚定——预估
  // now+30 天展示，server 将在下次聊天蒸馏时懒回填真锚）
  const anchorRaw = String(p.chronicle_anchor_at || '');
  const anchorMs = /^\d{4}-\d{2}-\d{2}/.test(anchorRaw) ? new Date(anchorRaw).getTime() : NaN;
  const unlockMs = Number.isFinite(anchorMs) ? anchorMs + CHRONICLE_RIPEN_DAYS * 86400000
    : now + CHRONICLE_RIPEN_DAYS * 86400000;
  const unlockDateISO = new Date(unlockMs).toISOString().slice(0, 10);
  const timeOk = now >= unlockMs;
  const trajOk = traj >= CHRONICLE_MIN_TRAJECTORY;
  return {
    status: (timeOk && trajOk) ? 'unlocked' : 'charging',
    entitled: true,
    unlockDateISO,
    trajectory: traj,
    basis: ent.basis,
  };
}

/**
 * 蓄能态文案装配（六语自容——模板 {n}/{date} 填充）
 * @param {string} lang 六语
 * @param {{trajectory?: number, unlockDateISO?: string|null}} meta
 * @returns {string}（''＝fail-closed）
 */
export function chronicleChargingLabel(lang, meta) {
  const l = sanitizeLang(lang);
  const tpl = L_CHRONICLE_CHARGING[l] || L_CHRONICLE_CHARGING.en;
  const m = (meta && typeof meta === 'object') ? meta : {};
  const n = Math.max(0, Math.floor(Number(m.trajectory) || 0));
  const date = String(m.unlockDateISO || '').slice(0, 10) || '—';
  return tpl.split('{n}').join(String(n)).split('{date}').join(date);
}

/**
 * 年鉴章节 HTML 装配（前端本地排版导出——零服务端渲染）
 * @param {{title?: string, lang?: string, companion?: string,
 *   sections?: Array<{heading: string, lines: string[]}>}} data
 * @returns {string} 完整 HTML 文档（''＝fail-closed 空数据）
 */
export function buildSoulChronicleHTML(data) {
  const d = (data && typeof data === 'object') ? data : null;
  if (!d || !Array.isArray(d.sections) || !d.sections.length) return '';
  const lang = sanitizeLang(d.lang);
  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const title = esc(d.title || L_CHRONICLE_TITLE[lang] || L_CHRONICLE_TITLE.en);
  const companion = esc(d.companion || '');
  const head = companion ? `${title} · ${companion}` : title;
  const sections = d.sections
    .filter((s) => s && typeof s === 'object' && (s.heading || (Array.isArray(s.lines) && s.lines.length)))
    .map((s) => {
      const h = esc(s.heading || '');
      const ls = (Array.isArray(s.lines) ? s.lines : [])
        .filter((x) => typeof x === 'string' && x.trim())
        .map((x) => `      <p>${esc(x)}</p>`)
        .join('\n');
      return `    <section>\n      <h2>${h}</h2>\n${ls}\n    </section>`;
    })
    .join('\n');
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${head}</title>
<style>
  body { background:#0B1220; color:#EAE2CF; font-family:Georgia,'Songti SC',serif; margin:0; padding:48px 24px; }
  .wrap { max-width:720px; margin:0 auto; }
  h1 { font-size:26px; letter-spacing:.08em; color:#D4AF37; border-bottom:1px solid rgba(212,175,55,.35); padding-bottom:12px; }
  h2 { font-size:17px; color:#D4AF37; margin:28px 0 8px; letter-spacing:.06em; }
  p { font-size:14.5px; line-height:1.9; margin:6px 0; color:#CFE0E8; }
  footer { margin-top:40px; font-size:11px; color:#8A93A6; letter-spacing:.05em; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>${head}</h1>
${sections}
    <footer>KindredSouls · kindredsouls.online</footer>
  </div>
</body>
</html>`;
}
