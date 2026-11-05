/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E124-LIFESTYLE-MUSE 刀二（主公军令 2026-11-05）：生活方式意图探测网
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：在 E121 密函意图（companionScribeTrigger）静默时接管——六语捕获
 *   · STYLE_INTENT：穿搭/约会着装/重要场合形象求助（穿什么/怎么搭配/
 *     what to wear/quoi porter/qué ponerme/แต่งตัว/mặc gì…）；
 *   · ROADTRIP_INTENT：出行/自驾/散心避世规划（自驾/周末去哪/road trip/
 *     escapade/escapada/ทริปขับรถ/phượt…）。
 * 命中 ⇒ ChatSheet send 收口后于本轮 assistant 气泡下方挂载生活卡微缩插槽。
 * 🔴 fail-closed：日常寒暄/常规问答一律 null 严禁误触（军令红线——
 *   密函优先级更高：消费端先查 detectScribeIntent，静默才落本网）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 军令钦定生活方式关键词网（六语——includes 子串匹配） */
export const LIFESTYLE_INTENT_RULES = Object.freeze([
  Object.freeze({
    type: 'style',
    keywords: Object.freeze([
      // zh：穿搭/着装求助语料面（军令钦定清单）
      '穿什么', '怎么搭配', '穿搭', '搭配建议', '约会穿搭', '面试穿', '着装', '造型建议', '配什么衣服', '穿哪件',
      // en
      'what to wear', 'outfit', 'dress for', 'style advice', 'wardrobe', 'what should i wear', 'clothes for',
      // fr
      'quoi porter', 'tenue', "s'habiller", 'comment m’habiller', 'comment m\'habiller', 'styliste',
      // es
      'qué ponerme', 'que ponerme', 'qué me pongo', 'que me pongo', 'outfit para', 'cómo vestir', 'como vestir', 'conjunto para',
      // th
      'แต่งตัวยังไง', 'แต่งตัว', 'เสื้อผ้า', 'ชุดไป', 'ใส่อะไรดี', 'ประแจ้งสไตล์',
      // vi
      'mặc gì', 'trang phục', 'phối đồ', 'phối quần', 'đi dự mặc', 'đi gặp mặc',
    ]),
  }),
  Object.freeze({
    type: 'roadtrip',
    keywords: Object.freeze([
      // zh：出行/自驾/散心语料面
      '自驾', '去哪玩', '去哪儿玩', '周末去哪', '周边游', '周边散心', '路线规划', '散心', '出游', '短途旅行', '两天一夜',
      // en
      'road trip', 'roadtrip', 'weekend getaway', 'where to go', 'where should i go', 'drive out', 'day trip', 'scenic drive',
      // fr
      'escapade', 'roadtrip', 'partir le week-end', 'partir ce week-end', 'balade en voiture', 'où partir',
      // es
      'escapada', 'viaje en carretera', 'ruta de fin de semana', 'a dónde ir', 'a donde ir', 'paseo en coche', 'viajito',
      // th
      'ทริปขับรถ', 'ขับรถเที่ยว', 'ไปเที่ยวไหนดี', 'เที่ยวสุดสัปดาห์', 'ทริปสุดสัปดาห์', 'ไปเที่ยวไกล้', 'ขับรถไปไหน',
      // vi
      'phượt', 'du lịch cuối tuần', 'đi đâu chơi', 'chạy xe đi đâu', 'lên lịch trình', 'đi chơi đâu', 'chuyến ngắn',
    ]),
  }),
]);

/**
 * 生活方式意图识别（fail-closed——未命中返回 null，严禁默认回退强推）
 * @param {string} text 用户对话文本
 * @returns {{ type: 'style' | 'roadtrip', keyword: string } | null}
 */
export function detectLifestyleIntent(text) {
  const s = String(text || '').toLowerCase();
  if (!s.trim()) return null;
  for (const rule of LIFESTYLE_INTENT_RULES) {
    for (const kw of rule.keywords) {
      if (s.includes(kw.toLowerCase())) return { type: rule.type, keyword: kw };
    }
  }
  return null;
}
