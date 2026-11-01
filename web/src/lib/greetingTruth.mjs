/**
 * greetingTruth.mjs —— 首语插值真值核（E114-刀一 · 主公军令 2026-11-01）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定：六语首语模板（chatHello / helloLoveCore）一律占位符
 * {{tarotCard}} / {{trinePattern}}；本核负责把**报告真值**解析为可插值变量：
 *   · tarotCard  真源链：sessionStorage ks_compat_report_tarot（E109 一盘一清）
 *                → localStorage soul_recent_unlocked_report.keyAspects.tarotId
 *                （E112 跨会话持久）→ 中性词兜底（绝不臆造具体牌名——E109
 *                「隐士幽灵」血训：无真值时写死回退牌＝同一病灶复发）。
 *   · trinePattern 真源：ks_result.engines.bazi.meta 的 SANHE_${水|火|木|金}
 *                （E92 三合局真值）或 LIUHE_DAY_STEM（天干六合）→ 六语标签；
 *                无三合/六合 ⇒ 中性词（禁编「Fire Trine」类假象）。
 *
 * 🔴 纯逻辑核：禁 i18n / DOM 操作（store 由调用方注入，内存 Map 可模拟）；
 *    node:test 行为级闸门守备（E113 dailyChatSession S4 先例模式）。
 */
import { tarotCardName } from './tarotNames.mjs';
import { readRecentReport } from './soulRecentReport.mjs';

/** 三合局元素 ⇒ 六语标签（E92 bazi.ts SANHE_${element} 真值对接） */
const TRINE_LABELS = {
  水: { zh: '三合水局', en: 'Water Trine', es: 'Trino de Agua',  fr: 'Trine d\'Eau',  th: 'ไตรภาคธาตุน้ำ',  vi: 'Tam Hợp Thủy Cục' },
  火: { zh: '三合火局', en: 'Fire Trine',  es: 'Trino de Fuego', fr: 'Trine de Feu',  th: 'ไตรภาคธาตุไฟ',   vi: 'Tam Hợp Hỏa Cục' },
  木: { zh: '三合木局', en: 'Wood Trine',  es: 'Trino de Madera', fr: 'Trine de Bois', th: 'ไตรภาคธาตุไม้',  vi: 'Tam Hợp Mộc Cục' },
  金: { zh: '三合金局', en: 'Metal Trine', es: 'Trino de Metal', fr: 'Trine de Métal', th: 'ไตรภาคธาตุโลหะ', vi: 'Tam Hợp Kim Cục' },
};

/** 天干六合（LIUHE_DAY_STEM）⇒ 六语标签 */
const LIUHE_LABEL = {
  zh: '天干六合', en: 'Day-Stem Six Harmony', es: 'Armonía de los Seis Tallos',
  fr: 'Harmonie des Six Tiges', th: 'เทียนกั้นหกสามัคคี', vi: 'Lục Hợp Thiên Can',
};

/** 无塔罗真值 ⇒ 中性牌指称（六语；绝不指名具体大牌） */
const NEUTRAL_TAROT = {
  zh: '命运之牌', en: 'the card destiny drew', es: 'la carta que trazó el destino',
  fr: 'la carte tracée par le destin', th: 'ไพ่แห่งโชคชะตา', vi: 'lá bài định mệnh',
};

/** 无三合/六合真值 ⇒ 中性流光指称（六语；绝不编造具体局） */
const NEUTRAL_TRINE = {
  zh: '合盘深处的流光', en: 'the flowing light within your synastry',
  es: 'la luz que fluye en su sinastría', fr: 'la lumière qui coule dans votre synastrie',
  th: 'แสงที่หลั่งไหลในสายใยของคู่คุณ', vi: 'dòng sáng sâu thẳm trong lá số đôi',
};

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];
const pick = (map, lang) => {
  const L = (LANGS.indexOf(String(lang)) >= 0) ? String(lang) : 'en';
  return String(map[L] || map.en || '');
};

/**
 * 当次报告塔罗真值（E109 一盘一清 sessionStorage 档）⇒ 合法 id（0~21）或 null。
 * 形状守卫与 FamiliarChatSheet 随行通道同构（id 整数 0~21）。
 */
export function readReportTarotId(sessionStore) {
  try {
    const rt = JSON.parse(sessionStore.getItem('ks_compat_report_tarot') || 'null');
    if (rt && typeof rt === 'object' && Number.isInteger(rt.id) && rt.id >= 0 && rt.id <= 21) {
      return Number(rt.id);
    }
  } catch { /* 坏档 ⇒ null（fail-soft） */ }
  return null;
}

/**
 * 最近解锁报告塔罗真值（E112 localStorage 档 keyAspects.tarotId）⇒ 合法 id 或 null。
 * 跨会话兜底链：sessionStorage 档随新标签页蒸发，本档持久在场。
 */
export function readRecentTarotId(store) {
  const rr = readRecentReport(store);
  if (!rr || !rr.keyAspects) return null;
  const n = Number(rr.keyAspects.tarotId);
  return (Number.isInteger(n) && n >= 0 && n <= 21) ? n : null;
}

/**
 * 三合/六合真值（ks_result.engines.bazi.meta）⇒ '水'|'火'|'木'|'金'|'LIUHE' | null。
 * 与 E111 chatGreetingMode 甜核同源口径（SANHE_ 前缀 / LIUHE_DAY_STEM）。
 */
export function readTrineKey(sessionStore) {
  try {
    const r = JSON.parse(sessionStore.getItem('ks_result') || 'null');
    if (r && typeof r === 'object' && r.engines && r.engines.bazi && Array.isArray(r.engines.bazi.meta)) {
      for (const m of r.engines.bazi.meta) {
        if (typeof m !== 'string') continue;
        if (m.startsWith('SANHE_')) {
          const el = m.slice(6);
          if (TRINE_LABELS[el]) return el;
        }
        if (m === 'LIUHE_DAY_STEM') return 'LIUHE';
      }
    }
  } catch { /* 坏档 ⇒ null（fail-soft） */ }
  return null;
}

/**
 * 首语插值变量装配（军令 E114-①运行时提取契约）：
 *   resolveHelloVars(lang, { tarotId, trineKey }) ⇒ { tarotCard, trinePattern }
 * tarotId null ⇒ 中性牌指称；trineKey null ⇒ 中性流光指称（fail-closed，
 * 绝不臆造具体牌名/局名——「恋人幽灵」病根物理拔除）。
 */
export function resolveHelloVars(lang, truth) {
  const tarotId = truth ? truth.tarotId : null;
  const trineKey = truth ? truth.trineKey : null;
  const name = tarotCardName(tarotId, lang);
  const tarotCard = name || pick(NEUTRAL_TAROT, lang);
  let trinePattern;
  if (trineKey === 'LIUHE') trinePattern = pick(LIUHE_LABEL, lang);
  else if (trineKey && TRINE_LABELS[trineKey]) trinePattern = pick(TRINE_LABELS[trineKey], lang);
  else trinePattern = pick(NEUTRAL_TRINE, lang);
  return { tarotCard, trinePattern };
}
