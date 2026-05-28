// ── 核心类型定义 ──

/** 出生信息 */
export interface BirthInfo {
  year: number;
  month: number;
  day: number;
}

/** 四维度评分 */
export interface DimensionScore {
  love: number;          // 爱情（吸引力/激情）
  communication: number; // 沟通理解
  chemistry: number;      // 身心默契
  stability: number;     // 长期稳定
}

/** 单引擎计算结果 */
export interface EngineResult {
  score: number;       // 0-100 匹配分
  title: string;        // 如 "八字命理"
  summary: string;      // 1-2句解读文案
  detail: string;       // 详细解读（结果页展开用）
}

/** 三引擎 + AI 汇总结果 */
export interface CompatibilityResult {
  overall: number;          // 综合分 0-100
  engines: {
    bazi: EngineResult;
    zodiac: EngineResult;
    iching: EngineResult;
  };
  aiInsight: string;        // AI 情感建议（后期接入）
  luckyAspects: string[];   // 有利方面
  challengingAspects: string[]; // 需要注意的方面
  dimensions: DimensionScore;  // 四维度评分
  _d1?: string;
  _d2?: string;
}
