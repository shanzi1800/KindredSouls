import type { BirthInfo, CompatibilityResult, EngineResult } from './types';
import { calcBaZi } from './bazi';
import { calcZodiac } from './zodiac';
import { calcIChing } from './iching';

// ═════════════════════════════════════════
// 综合合盘引擎
// 三引擎加权 + 四维度评分 + AI情感建议
// 权重：八字40% + 星座40% + 易经20%
// ═════════════════════════════════════════

/** 日期解析 */
export function parseBirthday(input: string): BirthInfo | null {
  // YYYY-MM-DD
  let m = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };

  // DD/MM/YYYY
  m = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return { year: +m[3], month: +m[2], day: +m[1] };

  // YYYY/MM/DD
  m = input.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };

  return null;
}

// ── 四维度评分 ──

interface DimensionScore {
  love: number;       // 爱情（吸引力/激情）
  communication: number; // 沟通（理解/表达）
  chemistry: number;  // 性吸引力（身体/感官）
  stability: number;  // 长期稳定（价值观/承诺）
}

/**
 * 从三引擎结果推导四维度分数
 * 八字→稳定性+沟通，星座→爱情+性吸引力，易经→整体趋势
 */
function deriveDimensions(
  bazi: EngineResult,
  zodiac: EngineResult,
  iching: EngineResult
): DimensionScore {
  const base = (bazi.score + zodiac.score + iching.score) / 3;

  // 爱情维度：星座权重高（60%）+ 易经趋势（25%）+ 八字基础（15%）
  const love = Math.round(zodiac.score * 0.40 + bazi.score * 0.25 + iching.score * 0.15 + base * 0.20);

  // 沟通维度：八字日主关系（50%）+ 星座元素和谐（30%）+ 基础（20%）
  const communication = Math.round(bazi.score * 0.45 + zodiac.score * 0.30 + iching.score * 0.10 + base * 0.15);

  // 性吸引力：星座相位（55%）+ 八字合力（25%）+ 基础（20%）
  const chemistry = Math.round(zodiac.score * 0.45 + bazi.score * 0.30 + iching.score * 0.10 + base * 0.15);

  // 长期稳定：八字核心（55%）+ 易经卦象稳定性（25%）+ 星座模式（20%）
  const stability = Math.round(bazi.score * 0.50 + iching.score * 0.30 + zodiac.score * 0.15 + base * 0.05);

  return {
    love: Math.max(30, Math.min(99, love)),
    communication: Math.max(30, Math.min(99, communication)),
    chemistry: Math.max(30, Math.min(99, chemistry)),
    stability: Math.max(30, Math.min(99, stability)),
  };
}

// ── AI 情感建议生成 ──

function generateAIInsight(
  overall: number,
  dims: DimensionScore,
  bazi: EngineResult,
  zodiac: EngineResult,
  iching: EngineResult
): string {
  const parts: string[] = [];

  // 开场总评
  if (overall >= 82) {
    parts.push('从命理学的角度看，你们之间的能量连接非常强。这不是偶然的相遇，而是某种更深层的引力将你们带到了一起。');
  } else if (overall >= 70) {
    parts.push('你们的命盘组合显示出良好的契合度。每段关系都是独一无二的，而你们的配置有着独特的优势。');
  } else if (overall >= 58) {
    parts.push('每一段值得的关系都需要经营，而你们的配置中藏着不少待发掘的宝藏。差异不是障碍，是成长的土壤。');
  } else {
    parts.push('缘分有时以挑战的形式出现。你们的配置显示这是一段能带来重要人生课题的关系。');
  }

  // 维度分析（挑最强和最弱给建议）
  const dimEntries = Object.entries(dims) as [keyof DimensionScore, number][];
  dimEntries.sort((a, b) => b[1] - a[1]);
  const [strongest] = dimEntries;
  const [weakest] = dimEntries.slice(-1);

  const dimNames: Record<string, string> = {
    love: '情感吸引力',
    communication: '沟通理解',
    chemistry: '身心默契',
    stability: '长期稳定',
  };

  if (strongest[1] >= 78) {
    parts.push(`你们在【${dimNames[strongest[0]]}】方面天然有优势——这是你们关系的亮点，好好珍惜。`);
  }
  if (weakest[1] <= 65 && weakest[0] !== strongest[0]) {
    parts.push(`【${dimNames[weakest[0]]}】是这段关系可以重点投入的方向。多一份耐心和觉察，这里会成为新的增长点。`);
  }

  // 引擎亮点
  if (bazi.score >= 80) {
    parts.push('八字层面显示你们的日主关系融洽，内在性格底色互相吸引。');
  }
  if (zodiac.score >= 80) {
    parts.push('星座层面显示星辰的能量在为你们加持，这是难得的宇宙祝福。');
  }
  if (iching.score >= 80) {
    parts.push('易经卦象预示着正向的发展趋势，顺势而为会有惊喜。');
  }

  // 积极收尾（铁律！）
  if (overall >= 75) {
    parts.push('记住，命理只是参考，真正决定关系质量的是你们每一天的选择。你们拥有创造幸福的所有条件。');
  } else {
    parts.push('命理揭示的是潜能而非定数。每一段美好的关系都是从"愿意尝试"开始的。你们拥有的比想象中更多。');
  }

  return parts.join('\n\n');
}

// ── 有利/需注意方面 ──

function generateAspects(
  overall: number,
  dims: DimensionScore,
  bazi: EngineResult,
  zodiac: EngineResult,
  iching: EngineResult
): { lucky: string[]; challenging: string[] } {
  const lucky: string[] = [];
  const challenging: string[] = [];

  // 基于整体分
  if (overall >= 80) lucky.push('缘分深厚，相遇概率极低');
  if (bazi.score >= 78) lucky.push('五行互补潜力大');
  if (zodiac.score >= 78) lucky.push('星座相位和谐');
  if (iching.score >= 78) lucky.push('卦象趋势向好');

  if (dims.love >= 80) lucky.push('天然吸引力强');
  if (dims.communication >= 80) lucky.push('沟通成本低');
  if (dims.stability >= 80) lucky.push('长期发展前景好');

  if (dims.communication <= 62) challenging.push('需要更多耐心倾听彼此');
  if (dims.stability <= 62) challenging.push('需要建立共同目标');
  if (dims.chemistry <= 62) challenging.push('肢体语言和亲密感有待培养');
  if (bazi.score <= 58) challenging.push('性格底层差异需磨合');
  if (zodiac.score <= 58) challenging.push('表达方式可能不同频');

  // 保证至少各有一条
  if (lucky.length === 0) lucky.push('双方都有成长意愿');
  if (challenging.length === 0) challenging.push('保持新鲜感需要持续投入');

  return { lucky: lucky.slice(0, 4), challenging: challenging.slice(0, 3) };
}

// ── 主计算入口 ──

export function calculateCompatibility(
  date1: string,
  date2: string
): CompatibilityResult | { error: string } {
  const p1 = parseBirthday(date1);
  const p2 = parseBirthday(date2);

  if (!p1 || !p2) {
    return { error: 'DATE_FORMAT_ERROR' };
  }

  // ── 三引擎计算 ──
  const baziResult = calcBaZi(p1, p2);
  const zodiacResult = calcZodiac(p1, p2);
  const ichingResult = calcIChing(p1, p2);

  // ── 加权总分（八字40% + 星座40% + 易经20%）──
  const overall = Math.round(
    baziResult.score * 0.40 +
    zodiacResult.score * 0.40 +
    ichingResult.score * 0.20
  );

  // ── 四维度评分 ──
  const dims = deriveDimensions(baziResult, zodiacResult, ichingResult);

  // ── AI 情感建议 ──
  const aiInsight = generateAIInsight(overall, dims, baziResult, zodiacResult, ichingResult);

  // ── 有利/需注意方面 ──
  const { lucky, challenging } = generateAspects(overall, dims, baziResult, zodiacResult, ichingResult);

  return {
    overall,
    engines: {
      bazi: baziResult,
      zodiac: zodiacResult,
      iching: ichingResult,
    },
    aiInsight,
    luckyAspects: lucky,
    challengingAspects: challenging,
    dimensions: dims,
  };
}
