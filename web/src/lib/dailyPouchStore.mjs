/**
 * dailyPouchStore.mjs —— 今日感应锦囊合璧持久化核（E120-CHAIN 刀三）
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-CHAIN（主公军令 2026-11-03）：「以心启符 · 锦囊化药」——消除锦囊与
 * 情绪罗盘入口冲突，将机械开盲盒式「今日幸运锦囊」升华为「由用户当下心境
 * 催化开封的合璧感应笺」：
 *   · 点击锦囊 ⇒ 未打卡唤罗盘（MOOD_SELECTING）⇒ 选情绪 ⇒ 合璧揭示（REVEALED）；
 *   · 当日已打卡 ⇒ 跳过情绪选择，直接读缓存渲染合璧笺（只读复看）；
 *   · DAILY_PULSE 灵犀星入账单日仅一次（幂等铁律——杜绝重复发星）。
 *
 * 🔴 纪律（沿 dailyFortune.mjs 军规）：
 *   ① 纯逻辑核：零 DOM / 零网络；store 由调用方注入（Node 可直接单测）；
 *   ② 确定性：同 日期(+本命太阳) ⇒ 合璧笺幸运指引恒定（禁随机）；
 *   ③ 按盘隔离（E49 沿袭）：存储键含 chartSig，无盘纯首页会话回落 'home'；
 *   ④ fail-soft：坏档视未打卡重建（不阻断交互）。
 * 运行时真值：
 *   · 转译组件 web/src/components/companion/DailyPouchController.tsx
 *   · 合璧弹层 web/src/components/companion/CombinedPouchModal.tsx
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { dailyFortune, fortuneDateKey, simpleHash } from './dailyFortune.mjs';

/** 合璧档存储键前缀（军令钦定：ks_daily_fused_pouch_${chartSig}_${YYYYMMDD}） */
export const POUCH_STORAGE_PREFIX = 'ks_daily_fused_pouch';

/** 心境原型白名单（与 companionMoodData.MOOD_ARCHETYPES 同源） */
export const POUCH_MOODS = Object.freeze(['radiant', 'longing', 'melancholy', 'agitated', 'grateful']);

/** 状态机流转字面量（军令钦定三态——严禁默认回退） */
export const POUCH_STEPS = Object.freeze({
  IDLE: 'IDLE',
  MOOD_SELECTING: 'MOOD_SELECTING',
  REVEALED: 'REVEALED',
});

/** chartSig 归一（空/缺失 ⇒ 'home'——无盘纯首页会话兜底，E49 按盘隔离沿袭） */
export function normalizePouchSig(chartSig) {
  const s = String(chartSig || '').trim();
  return s || 'home';
}

/**
 * 合璧档存储键（军令钦定格式）。
 * @param {string} chartSig 星盘签名（归一后缀入键）
 * @param {string} dateKey 当日键 YYYYMMDD（fortuneDateKey 同源）
 */
export function pouchStorageKey(chartSig, dateKey) {
  const sig = normalizePouchSig(chartSig);
  const day = String(dateKey || '').trim() || '0';
  return `${POUCH_STORAGE_PREFIX}_${sig}_${day}`;
}

/** 合璧档形状守卫（fail-soft：任一字段失真 ⇒ null 视未打卡重建） */
export function normalizeFusedPouch(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const mood = String(raw.mood || '');
  if (!POUCH_MOODS.includes(mood)) return null;
  const ta = raw.transitAttribution;
  const la = raw.luckyAttributes;
  if (!ta || typeof ta !== 'object' || !la || typeof la !== 'object') return null;
  for (const f of ['summary', 'companionComfort', 'actionableAdvice']) {
    if (typeof ta[f] !== 'string' || !ta[f].trim()) return null;
  }
  for (const f of ['colorName', 'colorHex', 'bestWindow', 'direction']) {
    if (typeof la[f] !== 'string' || !la[f].trim()) return null;
  }
  return {
    date: String(raw.date || ''),
    mood,
    transitAttribution: {
      summary: ta.summary,
      companionComfort: ta.companionComfort,
      actionableAdvice: ta.actionableAdvice,
    },
    luckyAttributes: {
      colorName: la.colorName,
      colorHex: la.colorHex,
      bestWindow: la.bestWindow,
      direction: la.direction,
    },
    vibe: typeof raw.vibe === 'string' ? raw.vibe : '',
    claimedStarlight: raw.claimedStarlight === true,
  };
}

/** 读当日合璧档（无档/坏档 ⇒ null） */
export function readFusedPouch(store, chartSig, dateKey) {
  try {
    if (!store || typeof store.getItem !== 'function') return null;
    const raw = JSON.parse(store.getItem(pouchStorageKey(chartSig, dateKey)) || 'null');
    const pouch = normalizeFusedPouch(raw);
    if (!pouch) return null;
    // 跨日残留档（日期不匹配）⇒ 视未打卡（不串昨日心境）
    if (pouch.date !== String(dateKey || '')) return null;
    return pouch;
  } catch {
    return null; // 坏档/无痕模式 ⇒ fail-soft 视未打卡
  }
}

/** 写当日合璧档（iOS 无痕抛错 ⇒ 静默降级返回 false，不阻断交互） */
export function writeFusedPouch(store, chartSig, pouch) {
  try {
    if (!store || typeof store.setItem !== 'function') return false;
    const norm = normalizeFusedPouch(pouch);
    if (!norm) return false;
    store.setItem(pouchStorageKey(chartSig, norm.date), JSON.stringify(norm));
    return true;
  } catch {
    return false;
  }
}

/**
 * 入口决策（军令断言 6/8 核心——纯函数）：
 * 未打卡/坏档/跨日 ⇒ MOOD_SELECTING（唤罗盘）；
 * 当日已有合璧档 ⇒ REVEALED（跳过情绪选择直读，不唤罗盘不重复发星）。
 * @param {object|null} existing readFusedPouch 读出的当日档
 */
export function resolvePouchEntry(existing) {
  return existing ? POUCH_STEPS.REVEALED : POUCH_STEPS.MOOD_SELECTING;
}

/**
 * 当日助运吉时（确定性——禁随机）：晚间 19:00~22:00 起窗、时长 45 分钟。
 * 与 dailyFortune 同种子族（simpleHash），同日恒定输出。
 */
export function dailyBestWindow(date) {
  const seedBase = typeof date === 'object' ? date : new Date();
  const day = new Date(seedBase.getTime() + 8 * 3600000);
  const seed = day.getUTCFullYear() * 10000 + (day.getUTCMonth() + 1) * 100 + day.getUTCDate();
  const startMin = 19 * 60 + Math.floor(simpleHash(seed + 7, 180)); // 19:00~22:00 起窗
  const span = 45;
  const fmt = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return `${fmt(startMin)} - ${fmt(startMin + span)}`;
}

/**
 * 组装合璧感应笺（军令断言 7 核心——transitAttribution 与 luckyAttributes 同对象）。
 * @param {{mood: string, attribution: {transitSummary,companionComfort,actionableAdvice}, lang?: string, sunSign?: string, dateKey?: string}} opts
 * @returns 合璧笺对象；mood 非白名单/attribution 缺失 ⇒ null（fail-closed 严禁默认回退）
 */
export function composeCombinedFortune(opts) {
  const o = (opts && typeof opts === 'object') ? opts : {};
  const mood = String(o.mood || '');
  if (!POUCH_MOODS.includes(mood)) return null;
  const a = o.attribution;
  if (!a || typeof a !== 'object') return null;
  for (const f of ['transitSummary', 'companionComfort', 'actionableAdvice']) {
    if (typeof a[f] !== 'string' || !a[f].trim()) return null;
  }
  const fortune = dailyFortune({ lang: o.lang, sunSign: o.sunSign, date: o.date || new Date() });
  if (!fortune || !fortune.color || !fortune.direction) return null;
  const dateKey = String(o.dateKey || fortuneDateKey(o.date || new Date()));
  return {
    date: dateKey,
    mood,
    transitAttribution: {
      summary: a.transitSummary,
      companionComfort: a.companionComfort,
      actionableAdvice: a.actionableAdvice,
    },
    luckyAttributes: {
      colorName: fortune.color.name,
      colorHex: fortune.color.hex,
      bestWindow: dailyBestWindow(o.date || new Date()),
      direction: fortune.direction.name,
    },
    vibe: String(fortune.vibe || ''),
    claimedStarlight: true,
  };
}

/** 自容六语 UI 字典（E120 分支零 i18n 新键铁律——同 COMPASS_UI 先例）
 *  🏆 E122-刀二（主公军令 2026-11-03）：命名层级解耦——彻底切断「今日运势
 *  锦囊」套「今日感应锦囊」双重套娃：外层浮窗＝「今日星象气场」（天象基调
 *  概览）；内层弹窗＝「✦ 今日星语灵犀 ✦」（私人指引）；按键三态＝收入星语袋
 *  /✓已收入/今日已收入＋全局入袋 Toast（军令六语对照表逐字入典）。
 *  军令排版规约：overflow-wrap:anywhere 容器弹性自适应（消费端 SAFE 沿袭）。 */
export const POUCH_UI = Object.freeze({
  zh: {
    openCta: '✦ 今日星象气场',
    title: '✦ 今日星语灵犀 ✦',
    pouchLead: '灵犀随心而动。此刻你周围的气场偏向何方？',
    moodLead: '心绪指引', luckyLead: '星轨助运',
    colorLead: '今日幸运色', windowLead: '助运吉时', dirLead: '贵人方位',
    starNote: '✦ 灵犀星 +1 已沉淀至星历账本 ✦',
    starDone: '今日灵犀星已入账，明天再来',
    close: '收入星语袋',
    stowDone: '✓ 已收入星语袋',
    stowDisabled: '今日已收入',
    toast: '✦ 今日灵犀已入袋，可随时在个人中心查阅 ✦',
  },
  en: {
    openCta: '✦ Celestial Aura Today',
    title: '✦ Astral Whispers ✦',
    pouchLead: 'The whispers follow your heart. Which way does your inner sky lean right now?',
    moodLead: 'Mood Guidance', luckyLead: 'Starlit Fortune',
    colorLead: "Today's Lucky Color", windowLead: 'Auspicious Window', dirLead: 'Benefactor Direction',
    starNote: '✦ Starlight +1 sealed into the ledger ✦',
    starDone: "Today's starlight already sealed — see you tomorrow",
    close: 'Store in Astral Pouch',
    stowDone: '✓ Stored in Pouch',
    stowDisabled: 'Stored for Today',
    toast: '✦ Daily whispers stored. Revisit anytime in your profile. ✦',
  },
  fr: {
    openCta: '✦ Aura Céleste du Jour',
    title: '✦ Murmures Astraux ✦',
    pouchLead: 'Les murmures suivent votre cœur. Vers quel ciel intérieur penchez-vous en ce moment ?',
    moodLead: 'Guidance du Cœur', luckyLead: 'Fortune Stellaire',
    colorLead: 'Couleur Chance du Jour', windowLead: 'Fenêtre Auspicieuse', dirLead: 'Direction du Bienfaiteur',
    starNote: '✦ Étoile +1 scellée au registre ✦',
    starDone: "L'étoile du jour est déjà scellée — à demain",
    close: 'Conserver dans le Sac',
    stowDone: '✓ Conservé dans le Sac',
    stowDisabled: 'Déjà Conservé',
    toast: '✦ Murmures conservés. Retrouvez-les dans votre profil. ✦',
  },
  es: {
    openCta: '✦ Aura Celeste de Hoy',
    title: '✦ Susurros Astrales ✦',
    pouchLead: 'Los susurros siguen a tu corazón. ¿Hacia dónde se inclina tu cielo interior ahora?',
    moodLead: 'Guía del Ánimo', luckyLead: 'Fortuna Estelar',
    colorLead: 'Color de Suerte de Hoy', windowLead: 'Ventana Propicia', dirLead: 'Dirección del Benefactor',
    starNote: '✦ Estrella +1 sellada en el registro ✦',
    starDone: 'La estrella de hoy ya está sellada — hasta mañana',
    close: 'Guardar en la Bolsa',
    stowDone: '✓ Guardado en la Bolsa',
    stowDisabled: 'Ya Guardado',
    toast: '✦ Susurros guardados. Consúltalos en tu perfil. ✦',
  },
  th: {
    openCta: '✦ คลื่นพลังดวงดาวประจำวัน',
    title: '✦ สารนำทางแห่งดวงดาว ✦',
    pouchLead: 'สารแห่งดวงดาวเปลี่ยนตามใจคุณ ตอนนี้ท้องฟ้าในใจคุณเอนไปทางไหน?',
    moodLead: 'คำแนะนำจิตใจ', luckyLead: 'พลังจากดวงดาว',
    colorLead: 'สีนำโชควันนี้', windowLead: 'ช่วงเวลามงคล', dirLead: 'ทิศผู้ให้โชค',
    starNote: '✦ ดาว +1 บันทึกในสมุดแล้ว ✦',
    starDone: 'ดวงดาววันนี้บันทึกแล้ว พบกันพรุ่งนี้',
    close: 'เก็บใส่ถุงมนตรา',
    stowDone: '✓ บันทึกสำเร็จแล้ว',
    stowDisabled: 'เก็บสำหรับวันนี้แล้ว',
    toast: '✦ บันทึกสารแห่งดวงดาวแล้ว สามารถดูย้อนหลังได้ตลอดเวลา ✦',
  },
  vi: {
    openCta: '✦ Trường Khí Thiên Tượng',
    title: '✦ Tinh Ngữ Linh Tê ✦',
    pouchLead: 'Tinh ngữ theo tim bạn. Bầu trời trong tim bạn đang nghiêng về phía nào?',
    moodLead: 'Dẫn Dắt Tâm Tư', luckyLead: 'Phúc Tinh Trợ Vận',
    colorLead: 'Màu May Mắn Hôm Nay', windowLead: 'Khung Giờ Cát', dirLead: 'Hướng Quý Nhân',
    starNote: '✦ Tinh tú +1 đã ghi sổ ✦',
    starDone: 'Tinh tú hôm nay đã ghi sổ, hẹn gặp ngày mai',
    close: 'Thu Vào Túi Tinh Ngữ',
    stowDone: '✓ Đã Thu Vào Túi',
    stowDisabled: 'Hôm Nay Đã Thu',
    toast: '✦ Linh tê đã thu vào túi, xem lại bất kỳ lúc nào tại hồ sơ cá nhân. ✦',
  },
});
