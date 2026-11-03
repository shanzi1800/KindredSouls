/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-刀四（主公军令 2026-11-03）：伴生状态机 FSM v2.0 意图代写触发器
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：检测用户在对话中出现的僵局关键词正则
 *   /(吵架|冷战|不理我|不知怎么说|怎么开口|尴尬|想他|想她|道歉)/i
 * 命中意图后灵宠不说教，追加微缩卡片插槽气泡：
 *   「看着你们彼此拉扯，Sophia 心里也很着急呢。借着星轨的吉时，
 *    我替你拟好了一张《${amuletName}》[点此预览并保存]。」
 * 点击一键呼出全屏高清 Canvas 预览层（AmuletPlayground 同源引擎）。
 * 🔴 fail-closed：非僵局语料（如「今天天气不错」）一律返回 null，
 *    严禁无意图强推密函（打扰红线）；apology 优先级高于 longing
 *    （「吵架…想他」复合句以破冰为第一诉求）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 军令钦定僵局关键词正则（zh——E120 分支语料面） */
export const SCRIBE_INTENT_REGEX = /(吵架|冷战|不理我|不知怎么说|怎么开口|尴尬|想他|想她|道歉)/i;

/** 意图 → 密函类型映射（apology 优先——复合句以解冻为第一诉求） */
export const SCRIBE_INTENT_RULES = Object.freeze([
  Object.freeze({
    type: 'apology',
    keywords: Object.freeze(['吵架', '冷战', '不理我', '不知怎么说', '怎么开口', '尴尬', '道歉']),
  }),
  Object.freeze({
    type: 'longing',
    keywords: Object.freeze(['想他', '想她']),
  }),
]);

/** 密函展示名（六语——推荐气泡《${amuletName}》插值用） */
export const AMULET_DISPLAY_NAMES = Object.freeze({
  apology: Object.freeze({ zh: '解冻道歉密函', en: 'Lunar Apology Amulet', fr: 'Amulette de Dégel Lunaire', es: 'Amuleto de Deshielo Lunar', th: 'เครื่องรางละลายใจใต้แสงจันทร์', vi: 'Mật Thư Giải Băng Ánh Trăng' }),
  longing: Object.freeze({ zh: '想念引力密函', en: 'Gravitational Longing Amulet', fr: 'Amulette d\'Attraction Gravitationnelle', es: 'Amuleto de Atracción Gravitacional', th: 'เครื่องรางแรงดึงดูดแห่งห้วงคิดถึง', vi: 'Mật Thư Lực Hút Nỗi Nhớ' }),
  support: Object.freeze({ zh: '旭日庇佑密函', en: 'Solar Empowering Amulet', fr: 'Amulette de Bénédiction Solaire', es: 'Amuleto de Bendición Solar', th: 'เครื่องรางสุริยันเปี่ยมพลัง', vi: 'Mật Thư Ánh Dương Tiếp Sức' }),
  weather: Object.freeze({ zh: '关系晴雨密函', en: 'Celestial Synergy Weather', fr: 'Amulette de Météo Relationnelle', es: 'Amuleto de Clima Vincular', th: 'เครื่องรางพยากรณ์บรรยากาศสองใจ', vi: 'Mật Thư Thời Tiết Tình Cảm' }),
});

/**
 * 意图识别（fail-closed——未命中返回 null，严禁默认回退推荐）
 * @param {string} text 用户对话文本
 * @returns {{ type: string, keyword: string } | null}
 */
export function detectScribeIntent(text) {
  const s = String(text || '');
  if (!s.trim()) return null;
  for (const rule of SCRIBE_INTENT_RULES) {
    for (const kw of rule.keywords) {
      if (s.includes(kw)) return { type: rule.type, keyword: kw };
    }
  }
  return null;
}

/**
 * 代写推荐气泡文案（军令钦定句式——命中最优密函后注入微缩卡片插槽）
 * @param {string} amuletName 密函展示名（AMULET_DISPLAY_NAMES 取值）
 * @param {string} [companionName] 灵宠名（缺省 Sophia）
 * @returns {string}
 */
export function scribeSuggestionLine(amuletName, companionName = 'Sophia') {
  const name = String(amuletName || '').trim();
  if (!name) return '';
  return `看着你们彼此拉扯，${companionName} 心里也很着急呢。借着星轨的吉时，我替你拟好了一张《${name}》，点此预览并保存。`;
}
