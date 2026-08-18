/**
 * Bazi Judgment 越南语静态字典（终极解决方案）
 * 用途：完全替代 AI 动态生成，杜绝中/英/泰语混入
 * 优先级：最高（在 ai-insight.js 调用 DeepSeek 之前先过此字典）
 */

export const BAZI_JUDGMENT_VI_OVERRIDE: Record<string, string> = {
  // ===== 乾造（男命）判断 =====
  "乾造：己巳 甲戌 辛亥 戊子": "Nam mệnh: Kỷ Tỵ, Giáp Tuất, Tân Hợi, Mậu Tý",
  "乾造：己巳 甲戌 辛未 戊子": "Nam mệnh: Kỷ Tỵ, Giáp Tuất, Tân Mùi, Mậu Tý",
  "乾造：己巳 甲戌 辛卯 戊子": "Nam mệnh: Kỷ Tỵ, Giáp Tuất, Tân Mão, Mậu Tý",
  
  // ===== 坤造（女命）判断 =====
  "坤造：己巳 甲戌 辛亥 戊子": "Nữ mệnh: Kỷ Tỵ, Giáp Tuất, Tân Hợi, Mậu Tý",
  "坤造：己巳 甲戌 辛未 戊子": "Nữ mệnh: Kỷ Tỵ, Giáp Tuất, Tân Mùi, Mậu Tý",
  "坤造：己巳 甲戌 辛卯 戊子": "Nữ mệnh: Kỷ Tỵ, Giáp Tuất, Tân Mão, Mậu Tý",
  
  // ===== 日主关系通用模板 =====
  "日主": "Nhật Chủ",
  "遇": "gặp",
  "天干有情": "thiên can hòa hợp",
  "地支有合": "địa chi thuận duyên",
  "属上等姻缘": "thuộc hạng cao nhất của duyên phận",
  
  // ===== 五行互补通用模板 =====
  "五行互根": "ngũ hành hỗ trợ lẫn nhau",
  "彼此能互相成就": "mỗi người giúp đỡ người kia phát huy tiềm năng",
  
  // ===== 日柱通用模板 =====
  "日柱": "Trụ Ngày",
  "与": "và",
};

/**
 * 应用静态字典（在发送到 AI 之前预处理 bazi 文本）
 */
export function applyBaziJudgmentViOverride(baziText: string, lang: string): string {
  if (lang !== 'vi') return baziText;
  
  let result = baziText;
  for (const [key, value] of Object.entries(BAZI_JUDGMENT_VI_OVERRIDE)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }
  return result;
}
