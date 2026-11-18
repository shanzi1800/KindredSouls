/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E144-ASTRAL-RHYTHM-ACTION（军令 2026-11-18）：星灵节律与干活能力纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（零新增卡片最高准则——所有交互融于既有气泡流与 11px 微标体系）：
 *   · 模块一 星灵短句留白：常规陪伴回复 zh 60–80 字双段 \n\n（第一段星盘底牌
 *     ＋共情 35–45 字，第二段无品牌质感叮嘱/轻问 25–35 字；en/fr/es/vi
 *     40–55 词，th 等比折算）；
 *   · 模块二 昼夜星轨色温：终端本地小时 06:00–17:59 白昼暖金 ☀️ /
 *     18:00–05:59 星夜静谧紫 🌙 状态前缀（CSS 变量切换毛玻璃微光零新增 DOM）；
 *   · 模块三 星象跨日重逢：间隔 ≥6h 或跨本地自然日 ⇒ 重逢首句＋✨ 11px 微标
 *     （复用 AstralMemoryBadge 渲染样式槽；单会话最多 1 次）；
 *   · 模块四 天时日程锁：吉时/避坑时段文本提取 ⇒ RFC-5545 .ics（VALARM 15
 *     分钟提醒＋星盘叮嘱备注）气泡尾部内联 11px 毛玻璃微胶囊 📅；
 *   · 模块五 高情商嘴替：怎么回/替我回/TA说 意图 ⇒ 首段 ≤30 字拆解＋\n\n
 *     ＋三档 ▫️ 行（柔光破冰/高位笃定/体面退守），行内轻点剥离前缀复制。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；六语自容 L_ 字典（零 i18n
 *    139 键扰动）；fail-closed：意图未命中一律 null/'' 严禁强推。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 语言白名单（六语闭集） */
export const ASTRAL_RHYTHM_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** lang 白名单守卫（六语外 ⇒ en 兜底） */
function sanitizeLang(l) {
  return ASTRAL_RHYTHM_LOCALES.includes(String(l || '')) ? String(l) : 'en';
}

/* ═══════════ 模块二：昼夜星轨色温（军令译表表1逐字）═══════════ */
export const L_CIRCADIAN = Object.freeze({
  day: Object.freeze({
    zh: '☀️ 晨曦星轨同频', en: '☀️ Daylight Sync', fr: '☀️ Harmonie Diurne',
    es: '☀️ Sincronía Diurna', th: '☀️ พลังยามเช้า', vi: '☀️ Đồng Điệu Ngày',
  }),
  night: Object.freeze({
    zh: '🌙 星夜守护磁场', en: '🌙 Night Aura Guard', fr: '🌙 Veille Nocturne',
    es: '🌙 Guardia Nocturna', th: '🌙 คุ้มครองค่ำคืน', vi: '🌙 Canh Giữ Đêm',
  }),
});

/* ═══════════ 模块三：跨日重逢微标（军令译表表1逐字）═══════════ */
export const L_ASTRAL_REUNION_BADGE = Object.freeze({
  zh: '✨ 跨日星轨重逢', en: '✨ Astral Reunion', fr: '✨ Retrouvailles',
  es: '✨ Reencuentro', th: '✨ ดวงดาวพานพบ', vi: '✨ Hội Ngộ Tinh Bàn',
});

/* ═══════════ 模块四：天时日历锁微标（军令译表表1逐字）═══════════ */
export const L_CALENDAR_LOCK_PILL = Object.freeze({
  zh: '📅 锁入手机日历', en: '📅 Lock to Calendar', fr: '📅 Ajouter Agenda',
  es: '📅 Fijar Calendario', th: '📅 บันทึกปฏิทิน', vi: '📅 Khóa Lịch Ngay',
});

/* ═══════════ 模块五：嘴替三档行内前缀＋复制反馈（军令译表表2逐字）═══════════ */
export const L_PROXY_TIERS = Object.freeze({
  warm: Object.freeze({
    zh: '▫️ 柔光破冰：', en: '▫️ Warm Icebreak:', fr: '▫️ Douceur:',
    es: '▫️ Calidez:', th: '▫️ ละลายพฤติกรรม:', vi: '▫️ Phá Băng Ấm:',
  }),
  poise: Object.freeze({
    zh: '▫️ 高位笃定：', en: '▫️ High Poise:', fr: '▫️ Haute Posture:',
    es: '▫️ Alta Postura:', th: '▫️ ถือไพ่เหนือกว่า:', vi: '▫️ Vị Thế Cao:',
  }),
  exit: Object.freeze({
    zh: '▫️ 体面退守：', en: '▫️ Graceful Exit:', fr: '▫️ Retrait Noble:',
    es: '▫️ Retiro Digno:', th: '▫️ ถอยอย่างสง่า:', vi: '▫️ Lùi Đúng Lúc:',
  }),
});

/** 行内复制成功微标（1.5s 闪现——军令译表表2逐字） */
export const L_COPY_DONE = Object.freeze({
  zh: '✓ 已复制', en: '✓ Copied', fr: '✓ Copiées', es: '✓ Copiado',
  th: '✓ คัดลอกแล้ว', vi: '✓ Đã chép',
});

/* ═══════════ 模块二：昼夜判定（纯函数）═══════════ */

/**
 * 昼夜相位判定——白昼 06:00–17:59 / 星夜 18:00–05:59（军令钦定窗）。
 * @param {number} hour 本地小时 0–23（非法 ⇒ 星夜兜底 fail-closed）
 * @param {number} [minute] 本地分钟（未传按 0）
 * @returns {'day'|'night'}
 */
export function resolveCircadianPhase(hour, minute) {
  const h = Number(hour);
  const m = Number.isFinite(Number(minute)) ? Number(minute) : 0;
  if (!Number.isFinite(h) || h < 0 || h > 23) return 'night';
  const mins = h * 60 + (m >= 0 && m <= 59 ? m : 0);
  return (mins >= 6 * 60 && mins < 18 * 60) ? 'day' : 'night';
}

/** 昼夜状态前缀词条（白名单外 lang ⇒ ''——fail-closed 绝不臆造） */
export function circadianStatusLabel(lang, phase) {
  const l = sanitizeLang(lang);
  const row = L_CIRCADIAN[String(phase)];
  return (row && row[l]) || '';
}

/** 状态栏昼夜合成——「灵犀默契 Lv.x 星轨同频 · 78/100 · ☀️ 晨曦星轨同频」形态 */
export function composeCircadianStatus(bondLabel, hour, minute, lang) {
  const prefix = circadianStatusLabel(lang, resolveCircadianPhase(hour, minute));
  const base = String(bondLabel || '').trim();
  if (!prefix) return base;
  return base ? `${base} · ${prefix}` : prefix;
}

/* ═══════════ 模块三：跨日重逢核（纯函数）═══════════ */

/** 重逢间隔阈值（军令钦定 6 小时） */
export const ASTRAL_REUNION_GAP_MS = 6 * 60 * 60 * 1000;

/** 最后活跃时间戳存储键（localStorage 白名单在册：E144 新增） */
export const ASTRAL_LAST_ACTIVE_KEY = 'ks_last_active_ts';

/** 读最后活跃时间戳（坏档/无档 ⇒ null；纯读不抛错） */
export function readLastActiveTs(store) {
  try {
    if (!store || typeof store.getItem !== 'function') return null;
    const v = Number(store.getItem(ASTRAL_LAST_ACTIVE_KEY));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

/** 写最后活跃时间戳（隐私模式/写满 fail-soft 静默） */
export function writeLastActiveTs(store, ts) {
  try {
    if (!store || typeof store.setItem !== 'function') return false;
    const v = Number(ts);
    if (!Number.isFinite(v) || v <= 0) return false;
    store.setItem(ASTRAL_LAST_ACTIVE_KEY, String(Math.floor(v)));
    return true;
  } catch {
    return false;
  }
}

/**
 * 跨日重逢上下文判定（零算力毫秒级——军令模块三）。
 * @param {{lastActiveTs: number|null, nowTs: number, localISO: string}} input
 *   localISO＝客户端本地 ISO（YYYY-MM-DD 前缀——与 E142 时钟三件套同源）
 * @returns {{reunion: boolean, dayCrossed: boolean, gapHours: number}}
 */
export function computeAstralReunionContext(input) {
  // fail-soft 硬化：null/坏形状入参 ⇒ 空参兜底（组件恒传对象，防御纵深零成本）
  const { lastActiveTs, nowTs, localISO } = (input && typeof input === 'object') ? input : {};
  const now = Number(nowTs);
  const last = (lastActiveTs === null || lastActiveTs === undefined) ? null : Number(lastActiveTs);
  if (!Number.isFinite(now) || last === null || !Number.isFinite(last) || last <= 0 || last > now) {
    return { reunion: false, dayCrossed: false, gapHours: 0 };
  }
  const gap = now - last;
  // 跨本地自然日判定：两时间戳的本地日期键不同（localISO 优先——服务器 UTC 兜底）
  let dayCrossed = false;
  try {
    const localDay = String(localISO || '').slice(0, 10);
    const lastDay = new Date(last).toISOString().slice(0, 10);
    dayCrossed = /^\d{4}-\d{2}-\d{2}$/.test(localDay) && localDay !== lastDay;
  } catch { /* 坏形状 ⇒ 仅间隔判定 */ }
  const gapHours = Math.floor(gap / (60 * 60 * 1000));
  const reunion = gap >= ASTRAL_REUNION_GAP_MS || dayCrossed;
  return { reunion, dayCrossed, gapHours };
}

/** 重逢微标词条（白名单外 lang ⇒ ''） */
export function astralReunionBadgeLabel(lang) {
  return L_ASTRAL_REUNION_BADGE[sanitizeLang(lang)] || '';
}

/* ═══════════ 模块一：星灵短句留白分段器（纯函数）═══════════ */

/** 分段判定阈值：zh 55 字以上无 \n\n ⇒ 主动分段（非 zh 40 词） */
const BREATH_SPLIT_MIN_ZH = 55;
const BREATH_SPLIT_MIN_WORDS = 40;

/** 词数统计（拉丁/泰文按空白分词；zh 按字符计） */
function countUnits(text, lang) {
  const s = String(text || '');
  if (lang === 'zh') return s.replace(/\s/g, '').length;
  return s.split(/\s+/).filter(Boolean).length;
}

/**
 * 留白归一（chunk-safe——emitDelta 出流层逐分片安全调用）：
 * 统一 \r\n→\n；3+ 连续换行归一双段 \n\n；首尾空白剥离。幂等零跨分片风险。
 */
export function normalizeAstralBreathingChunk(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^[ \t]+|[ \t]+$/g, '');
}

/**
 * 终帧留白分段器（军令模块一）：全文无 \n\n 且超阈值 ⇒ 在中位附近最佳句子
 * 边界拆为上下两段（第一段星盘底牌/共情，第二段叮嘱/轻问）；已有 \n\n 或
 * 边界不可寻 ⇒ 归一透传（fail-soft——prompt 戒律为主闸，此处结构兜底）。
 */
export function splitAstralBreathingText(text, lang) {
  const l = sanitizeLang(lang);
  const norm = String(text || '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!norm) return norm;
  if (norm.includes('\n\n')) return norm;
  if (countUnits(norm, l) < (l === 'zh' ? BREATH_SPLIT_MIN_ZH : BREATH_SPLIT_MIN_WORDS)) return norm;
  const SENT = l === 'zh' ? /[。！？；…]/ : /[.!?;?]/;
  const mid = Math.floor(norm.length / 2);
  let best = -1;
  for (let i = 0; i < norm.length; i += 1) {
    if (!SENT.test(norm[i])) continue;
    if (best === -1 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  }
  if (best === -1 || best < 8 || best > norm.length - 8) return norm;
  const head = norm.slice(0, best + 1).trim();
  const tail = norm.slice(best + 1).trim();
  if (!head || !tail) return norm;
  return `${head}\n\n${tail}`;
}

/* ═══════════ 模块四：天时日程锁（吉时/避坑窗提取＋RFC-5545 .ics）═══════════ */

/** 时窗正则：HH:MM-HH:MM / HH：MM～HH：MM / HH点-HH点 等形态 */
const CAL_TIME_RE = /(\d{1,2})\s*[:：点时]\s*(\d{1,2})?\s*[-–~～至到]\s*(\d{1,2})\s*[:：点时]\s*(\d{1,2})?/;

/** 吉时/避坑语义关键词（zh 白名单——宁窄勿宽铁律 19） */
const CAL_KEYWORDS = Object.freeze([
  '吉时', '避坑', '破财', '不宜', '宜在', '签约', '面试', '约见', '办事',
]);

/** 事件摘要词典（关键词 ⇒ 摘要——六语走 L_CALENDAR_SUMMARY 由 lang 选） */
const L_CALENDAR_SUMMARY = Object.freeze({
  lucky: Object.freeze({
    zh: '星象吉时', en: 'Astral Lucky Window', fr: 'Fenêtre Astrale Chanceuse',
    es: 'Ventana Astral Afortunada', th: 'ช่วงเวลาดีตามดวง', vi: 'Khung Giờ Tốt Theo Sao',
  }),
  caution: Object.freeze({
    zh: '破财避坑时段', en: 'Financial Caution Window', fr: 'Fenêtre de Prudence Financière',
    es: 'Ventana de Prudencia Financiera', th: 'ช่วงระวังการเงิน', vi: 'Khung Giờ Cần Thận Trọng',
  }),
});

/**
 * 天时事件提取（军令模块四）：文本含 HH:MM-HH:MM 时窗＋吉时/避坑语义 ⇒
 * 事件形状；日期＝明日/明天 ⇒ 次日，否则当日（本地浮届时由调用方注入）。
 * fail-closed：无时窗/无关键词 ⇒ null（严禁臆造日程）。
 * @returns {{dateOffset: 0|1, startHH: number, startMM: number, endHH: number,
 *   endMM: number, kind: 'lucky'|'caution'}|null}
 */
export function detectAstralCalendarEvent(text) {
  const s = String(text || '');
  if (!s.trim()) return null;
  const m = s.match(CAL_TIME_RE);
  if (!m) return null;
  const sh = Number(m[1]); const sm = Number(m[2] || 0);
  const eh = Number(m[3]); const em = Number(m[4] || 0);
  if (!(sh >= 0 && sh <= 23 && eh >= 0 && eh <= 23) || eh < sh) return null;
  const lower = s.toLowerCase ? s : s;
  const kind = (lower.includes('避坑') || lower.includes('破财') || lower.includes('不宜')) ? 'caution' : 'lucky';
  const hasKeyword = CAL_KEYWORDS.some((k) => s.includes(k));
  if (!hasKeyword) return null;
  const dateOffset = /明日|明天|次日|明晚/.test(s) ? 1 : 0;
  return { dateOffset, startHH: sh, startMM: sm, endHH: eh, endMM: em, kind };
}

/** 日历锁微胶囊词条（白名单外 lang ⇒ ''） */
export function calendarLockPillLabel(lang) {
  return L_CALENDAR_LOCK_PILL[sanitizeLang(lang)] || '';
}

/** 事件摘要词条（kind 白名单外 ⇒ lucky 兜底） */
export function calendarEventSummary(lang, kind) {
  const l = sanitizeLang(lang);
  const row = (kind === 'caution') ? L_CALENDAR_SUMMARY.caution : L_CALENDAR_SUMMARY.lucky;
  return row[l] || row.en;
}

/** ICS 文本字段转义（RFC-5545：反斜杠/分号/逗号） */
function icsEscape(v) {
  return String(v || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** 本地浮届时间戳（YYYYMMDDTHHMMSS——RFC 5545 浮届时区，随终端本地时区落历） */
function icsLocalStamp(dateISO, hh, mm) {
  const d = String(dateISO || '').replace(/-/g, '');
  const H = String(hh).padStart(2, '0');
  const M = String(mm).padStart(2, '0');
  return `${d}T${H}${M}00`;
}

/**
 * RFC-5545 .ics 载荷生成（军令模块四）：VALARM 15 分钟提前提醒＋星盘/财库
 * 叮嘱备注；CRLF 行尾（RFC 钦定）；UID 带 chartSig 盐防多设备撞车。
 * @param {{dateISO: string, startHH: number, startMM: number, endHH: number,
 *   endMM: number, summary: string, description?: string, uidSalt?: string}} ev
 */
export function buildAstralCalendarICS(ev) {
  const e = (ev && typeof ev === 'object') ? ev : null;
  if (!e) return '';
  const dateISO = String(e.dateISO || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return '';
  const sh = Number(e.startHH); const sm = Number(e.startMM);
  const eh = Number(e.endHH); const em = Number(e.endMM);
  if (!(sh >= 0 && sh <= 23 && eh >= 0 && eh <= 23 && eh >= sh)) return '';
  const summary = icsEscape(String(e.summary || '').slice(0, 80) || 'KindredSouls');
  const desc = icsEscape(String(e.description || '').slice(0, 200));
  const salt = icsEscape(String(e.uidSalt || 'ks').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24) || 'ks');
  const stamp = `${dateISO.replace(/-/g, '')}T${String(sh).padStart(2, '0')}${String(sm).padStart(2, '0')}00`;
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//KindredSouls//Astral Calendar Lock//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${stamp}-${salt}@kindredsouls`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${icsLocalStamp(dateISO, sh, sm)}`,
    `DTEND:${icsLocalStamp(dateISO, eh, em)}`,
    `SUMMARY:${summary}`,
    ...(desc ? [`DESCRIPTION:${desc}`] : []),
    'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY',
    `DESCRIPTION:${summary}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

/** .ics 下载文件名（军令钦定格式 KindredSouls-AstralLock-YYYYMMDD.ics） */
export function astralCalendarFilename(dateISO) {
  const d = String(dateISO || '').replace(/-/g, '');
  return /^\d{8}$/.test(d) ? `KindredSouls-AstralLock-${d}.ics` : 'KindredSouls-AstralLock.ics';
}

/* ═══════════ 模块五：高情商嘴替（意图侦测＋三档解析）═══════════ */

/** 嘴替意图关键词网（六语 includes 子串——军令钦定语料面） */
export const PROXY_INTENT_RULES = Object.freeze([
  Object.freeze({
    lang: 'zh',
    keywords: Object.freeze(['怎么回', '替我回', 'TA说', 'ta说', '对方发来', '不知道回什么', '帮我回', '怎么回复', '回复他', '回复她', '他发了', '她发了', '怎么搭话']),
  }),
  Object.freeze({
    lang: 'en',
    keywords: Object.freeze(['how should i reply', 'what should i say back', 'help me reply', 'help me respond', 'draft a reply', 'text back', 'they said', 'he said', 'she said', 'what to reply']),
  }),
  Object.freeze({
    lang: 'fr',
    keywords: Object.freeze(["comment répondre", "comment repondre", "qu'est-ce que je réponds", 'il a dit', 'elle a dit', 'aide-moi à répondre']),
  }),
  Object.freeze({
    lang: 'es',
    keywords: Object.freeze(['cómo respondo', 'como respondo', 'qué le respondo', 'que le respondo', 'me escribió', 'me escribio', 'cómo contesto', 'ayúdame a responder']),
  }),
  Object.freeze({
    lang: 'th',
    keywords: Object.freeze(['ตอบยังไง', 'ตอบอะไรดี', 'เขาส่งมาว่า', 'เธอส่งมาว่า', 'ช่วยตอบหน่อย']),
  }),
  Object.freeze({
    lang: 'vi',
    keywords: Object.freeze(['trả lời sao', 'trả lời gì', 'nhắn gì', 'nhắn tin gì', 'anh ấy nói', 'cô ấy nói', 'gặp câu này', 'phải trả lời thế nào']),
  }),
]);

/**
 * 嘴替意图侦测（fail-closed——未命中 null 严禁默认回退；日常寒暄零误触）。
 * @returns {{lang: string, keyword: string}|null}
 */
export function detectReplyProxyIntent(text) {
  const s = String(text || '').toLowerCase().trim();
  if (!s || s.length < 4) return null;
  for (const rule of PROXY_INTENT_RULES) {
    for (const kw of rule.keywords) {
      if (s.includes(kw)) return { lang: rule.lang, keyword: kw };
    }
  }
  return null;
}

/** 三档前缀取词（tier 白名单外 ⇒ ''） */
export function proxyTierPrefix(lang, tier) {
  const l = sanitizeLang(lang);
  const row = L_PROXY_TIERS[String(tier)];
  return (row && row[l]) || '';
}

/** 复制成功微标词条 */
export function copyDoneLabel(lang) {
  return L_COPY_DONE[sanitizeLang(lang)] || '';
}

/**
 * 嘴替行判定＋前缀剥离（行内轻点复制——军令模块五）：
 * 以 ▫️ 开头且命中六语任一档前缀 ⇒ 返回 { tier, content }（content＝剥壳纯话术）；
 * 非嘴替行 ⇒ null（fail-closed——普通文本行零交互）。
 */
export function parseProxyLine(line) {
  const s = String(line || '').trim();
  if (!s.startsWith('▫️')) return null;
  for (const tier of Object.keys(L_PROXY_TIERS)) {
    for (const lang of ASTRAL_RHYTHM_LOCALES) {
      const p = L_PROXY_TIERS[tier][lang];
      if (p && s.startsWith(p)) {
        return { tier, content: s.slice(p.length).trim() };
      }
    }
  }
  return null;
}

/* ═══════════ 服务端 Prompt 分支块（路由内后缀拼接——零锚破坏路径）═══════════ */

/**
 * 模块一常规留白 Prompt 戒律块（六语：zh 独块＋非 zh 共用英文块词数规格）。
 * 嘴替分支在场时由调用方跳过本块（嘴替自有 90–110 字四行格式铁律）。
 */
export function buildAstralBreathingPromptBlock(lang) {
  if (sanitizeLang(lang) === 'zh') {
    return '\n\n【ASTRAL BREATHING FORMAT 留白戒律】每次常规陪伴回复必须是 60–80 个汉字，且固定拆为两个自然段：第一段（35–45 字）先亮星盘/塔罗底牌再走心共情；两段之间必须且只能空一行（\\n\\n）；第二段（25–35 字）给一句无品牌质感的穿搭/热汤食疗叮嘱或一个轻轻的问句收尾。严禁超过 80 字；严禁分点罗列；严禁单段文字墙。';
  }
  return '\n\n[ASTRAL BREATHING FORMAT] Every regular companion reply must be 40-55 words, always split into exactly two paragraphs separated by one blank line (\\n\\n): the first paragraph reveals the natal chart / tarot undercurrent then empathizes; the second paragraph offers one brand-free styling / warm-tonic nudge or a gentle closing question. NEVER exceed 55 words; NEVER use lists; NEVER a single wall of text.';
}

/**
 * 模块五嘴替 Prompt 戒律块（随 lang 注入六语三档前缀逐字——模型按钦定
 * 前缀逐字输出，客户端 parseProxyLine 按同表剥壳）。
 */
export function buildAstralReplyProxyPromptBlock(lang) {
  const l = sanitizeLang(lang);
  const pW = proxyTierPrefix(l, 'warm');
  const pP = proxyTierPrefix(l, 'poise');
  const pE = proxyTierPrefix(l, 'exit');
  const prefixes = `${pW} / ${pP} / ${pE}`;
  if (l === 'zh') {
    return `\n\n【ASTRAL REPLY PROXY 嘴替模式】本条回复采用「高情商嘴替」格式（优先于常规留白格式）：第一段仅 1 句话（≤30 字），结合对方话语与本命星盘一针见血拆解其潜台词；随后空一行（\\n\\n）；紧接着 3 行纯文本代笔话术，逐行以钦定前缀「${pW}」「${pP}」「${pE}」开头（前缀逐字原样输出），每行 20–30 字，三档分别对应温和破冰/高位笃定/体面退守；总篇幅 90–110 字。三档前缀只用：${prefixes}。严禁卡片、严禁列表符号、严禁额外格式。`;
  }
  return `\n\n[ASTRAL REPLY PROXY] This reply uses the "reply proxy" format (overrides the regular breathing format): the first paragraph is ONE sentence (max 30 characters for zh / 12 words otherwise) that decodes the other side's subtext via the natal chart; then one blank line (\\n\\n); then exactly 3 plain-text lines, each starting verbatim with the prefixes "${pW}" / "${pP}" / "${pE}" (warm icebreak / high poise / graceful exit), 15-25 words each, total 90-110 characters. ONLY these prefixes: ${prefixes}. NEVER cards, NEVER list markers, NEVER extra formatting.`;
}
