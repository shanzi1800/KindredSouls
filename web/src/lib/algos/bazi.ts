import type { BirthInfo, EngineResult } from './types';

// ═════════════════════════════════════════
// 八字合婚引擎（真实算法）
// 输入：双方出生日期 → 天干地支配对 + 五行互补评分 + 日主关系分析
// 权重：40%
// ═════════════════════════════════════════

// ── 天干地支基础数据 ──

const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 天干五行 */
const TG_WUXING: Record<string, string> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

/** 地支五行 */
const DZ_WUXING: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};


/** 五行相克：A 克 B */

/** 天干六合 */
const TIANGAN_LIUHE: Record<string, string> = {
  '甲': '己', '己': '甲', '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊',
};

/** 地支三合局 */
const DZHI_SANHE: Record<string, { partners: string; element: string }> = {
  '申': { partners: '子辰', element: '水' },
  '子': { partners: '申辰', element: '水' },
  '辰': { partners: '申子', element: '水' },
  '寅': { partners: '午戌', element: '火' },
  '午': { partners: '寅戌', element: '火' },
  '戌': { partners: '寅午', element: '火' },
  '亥': { partners: '卯未', element: '木' },
  '卯': { partners: '亥未', element: '木' },
  '未': { partners: '亥卯', element: '木' },
  '巳': { partners: '酉丑', element: '金' },
  '酉': { partners: '巳丑', element: '金' },
  '丑': { partners: '巳酉', element: '金' },
};

/** 地支六冲 */
const DZHI_LIUCHONG: Record<string, string> = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯', '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
};

/** 日主十神关系评分表（日主A vs 日主B 的相性） */
const RISHI_RELATION: Record<string, Record<string, number>> = {
  // 同类=和合(85-95)，生我者=被生(75-85)，我生者=消耗(65-75)
  // 克我者=压力(55-65)，我克者=掌控(60-70)
  '甲': { '甲': 90, '乙': 92, '丙': 78, '丁': 76, '戊': 68, '己': 70, '庚': 58, '辛': 60, '壬': 88, '癸': 86 },
  '乙': { '甲': 92, '乙': 90, '丙': 80, '丁': 78, '戊': 66, '己': 68, '庚': 56, '辛': 58, '壬': 86, '癸': 88 },
  '丙': { '甲': 72, '乙': 74, '丙': 88, '丁': 90, '戊': 82, '己': 84, '庚': 64, '辛': 62, '壬': 78, '癸': 76 },
  '丁': { '甲': 70, '乙': 72, '丙': 90, '丁': 88, '戊': 84, '己': 82, '辛': 64, '庚': 62, '壬': 78, '癸': 76 },
  '戊': { '甲': 68, '乙': 66, '丙': 82, '丁': 84, '戊': 90, '己': 92, '庚': 74, '辛': 76, '壬': 58, '癸': 56 },
  '己': { '甲': 70, '乙': 68, '丙': 84, '丁': 82, '己': 92, '戊': 90, '辛': 74, '庚': 76, '癸': 58, '壬': 56 },
  '庚': { '甲': 62, '乙': 60, '丙': 66, '丁': 64, '戊': 76, '己': 74, '庚': 90, '辛': 92, '壬': 72, '癸': 70 },
  '辛': { '甲': 60, '乙': 58, '丙': 64, '丁': 66, '戊': 74, '己': 76, '辛': 92, '庚': 90, '癸': 70, '壬': 72 },
  '壬': { '甲': 82, '乙': 84, '丙': 76, '丁': 78, '戊': 58, '己': 56, '庚': 72, '辛': 70, '壬': 90, '癸': 92 },
  '癸': { '甲': 84, '乙': 82, '丙': 78, '丁': 76, '戊': 56, '己': 58, '庚': 70, '辛': 72, '癸': 92, '壬': 90 },
};

// ── 工具函数 ──

/**
 * 年柱天干计算（基于年尾数）
 * 尾数4=甲,5=乙,6=丙,7=丁,8=戊,9=己,0=庚,1=辛,2=壬,3=癸
 */
function yearTianGan(year: number): string {
  const idx = (year - 4) % 10;
  return TIANGAN[(idx + 10) % 10];
}

/**
 * 年柱地支计算（基于年份除12余数）
 * 4=子,5=丑,...,3=亥
 */
function yearDiZhi(year: number): string {
  const idx = (year - 4) % 12;
  return DIZHI[(idx + 12) % 12];
}

/**
 * 月柱地支计算（基于月份）
 * 寅月(立春起)=正月，...，丑月=十二月
 * 简化版：直接用月份数映射（精确版需节气）
 */
function monthDiZhi(month: number): string {
  // 正月起寅（立春约2/4），简化处理用公历月份近似
  const idx = (month + 1) % 12; // 1月→寅(2), 2月→卯(3), ...
  return DIZHI[idx];
}

/**
 * 月柱天干（根据年干和月支推算）
 * "五虎遁"法则：年干决定月起天干
 */
function monthTianGan(yearTG: string, monthDZ: string): string {
  const startMap: Record<string, number> = {
    '甲': 0, '己': 0,   // 甲己之年丙作首
    '乙': 2, '庚': 2,   // 乙庚之岁戊为头
    '丙': 4, '辛': 4,   // 丙辛必定寻庚起
    '丁': 6, '壬': 6,   // 丁壬壬位顺行流
    '戊': 8, '癸': 8,   // 戊癸之年何方觅，甲寅之上好追求
  };
  const monthIdx = DIZHI.indexOf(monthDZ);
  const startIdx = startMap[yearTG] ?? 0;
  return TIANGAN[(startIdx + monthIdx) % 10];
}

/**
 * 日柱天干地支（基于日期的简化算法）
 * 使用已知锚点+偏移量计算（精确版需查万年历）
 * 锚点：1900-01-01 = 甲戌日
 */
function dayStemBranch(year: number, month: number, day: number): [string, string] {
  // 基准日：1900-01-01 是甲戌日（索引：甲=0, 戌=10）
  const baseDate = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const diffDays = Math.floor((targetDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

  const stemIdx = ((diffDays % 10) + 10) % 10;  // 甲=0
  const branchIdx = ((diffDays % 12) + 12) % 12; // 子=0

  return [TIANGAN[stemIdx], DIZHI[branchIdx]];
}

/**
 * 时柱（简化：不输入时辰则默认日支的三合/冲关系不影响核心评分）
 */

// ── 四柱排盘 ──

interface SiZhu {
  year: [string, string];  // [天干, 地支]
  month: [string, string];
  day: [string, string];
  /** 日主天干 */
  dayMaster: string;
  /** 日柱全称 */
  dayPillar: string;
}

function paipan(info: BirthInfo): SiZhu {
  const yTG = yearTianGan(info.year);
  const yDZ = yearDiZhi(info.year);
  const mDZ = monthDiZhi(info.month);
  const mTG = monthTianGan(yTG, mDZ);
  const [dTG, dDZ] = dayStemBranch(info.year, info.month, info.day);

  return {
    year: [yTG, yDZ],
    month: [mTG, mDZ],
    day: [dTG, dDZ],
    dayMaster: dTG,
    dayPillar: `${dTG}${dDZ}日`,
  };
}

// ── 合婚评分引擎 ──


export function calcBaZi(p1: BirthInfo, p2: BirthInfo): EngineResult {
  const sz1 = paipan(p1);
  const sz2 = paipan(p2);

  // ── 1. 日主关系评分（核心）──
  const rishiBase = RISHI_RELATION[sz1.dayMaster]?.[sz2.dayMaster] ?? 70;
  let rishiScore = rishiBase;

  // ── 2. 五行互补分析 ──
  const p1Wuxing = [
    TG_WUXING[sz1.year[0]], DZ_WUXING[sz1.year[1]],
    TG_WUXING[sz1.month[0]], DZ_WUXING[sz1.month[1]],
    TG_WUXING[sz1.day[0]], DZ_WUXING[sz1.day[1]],
  ];
  const p2Wuxing = [
    TG_WUXING[sz2.year[0]], DZ_WUXING[sz2.year[1]],
    TG_WUXING[sz2.month[0]], DZ_WUXING[sz2.month[1]],
    TG_WUXING[sz2.day[0]], DZ_WUXING[sz2.day[1]],
  ];

  // 统计双方五行数量
  const countWuxing = (list: string[]): Record<string, number> => {
    const counts: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    for (const w of list) counts[w] = (counts[w] || 0) + 1;
    return counts;
  };

  const wx1 = countWuxing(p1Wuxing);
  const wx2 = countWuxing(p2Wuxing);

  // 五行互补评分：一方多的恰好是另一方少的 → 高分
  let wuxingBonus = 0;
  const wuxingDetails: string[] = [];
  for (const w of ['木', '火', '土', '金', '水'] as const) {
    const diff = (wx1[w] || 0) - (wx2[w] || 0);
    if (Math.abs(diff) >= 2 && (wx1[w] || 0) + (wx2[w] || 0) >= 3) {
      // 一方明显多，另一方少 → 互补潜力
      if (diff > 0) {
        wuxingBonus += 3;
        wuxingDetails.push(`你${w}旺，对方可受益于你的${w}气`);
      } else {
        wuxingBonus += 3;
        wuxingDetails.push(`对方${w}旺，你可受益于对方的${w}气`);
      }
    }
  }
  const wuxingScore = Math.min(100, 60 + wuxingBonus + (wuxingDetails.length > 0 ? 5 : 0));

  // ── 3. 合婚特殊关系 ──
  let hehunBonus = 0;
  const hehunDetails: string[] = [];

  // 天干六合检查
  if (TIANGAN_LIUHE[sz1.dayMaster] === sz2.dayMaster) {
    hehunBonus += 12;
    hehunDetails.push(`日干${sz1.dayMaster}与${sz2.dayMaster}形成【天干六合】，情感纽带极强`);
  }

  // 地支六合/三合检查（年支、月支、日支）
  for (const label of ['年', '月', '日']) {
    const dz1 = label === '年' ? sz1.year[1] : label === '月' ? sz1.month[1] : sz1.day[1];
    const dz2 = label === '年' ? sz2.year[1] : label === '月' ? sz2.month[1] : sz2.day[1];

    // 三合局
    const sanhe = DZHI_SANHE[dz1];
    if (sanhe && sanhe.partners.includes(dz2)) {
      hehunBonus += 10;
      hehunDetails.push(`${label}支${dz1}与${dz2}参与【三合${sanhe.element}局】，根基稳固`);
    }

    // 六冲（扣分）
    if (DZHI_LIUCHONG[dz1] === dz2) {
      hehunBonus -= 8;
      hehunDetails.push(`${label}支${dz1}与${dz2}形成【六冲】，需注意沟通方式`);
    }
  }

  // ── 4. 综合评分 ──
  // 日主50% + 五行30% + 合婚20%
  const rawScore = Math.round(
    rishiScore * 0.5 +
    wuxingScore * 0.3 +
    Math.max(40, Math.min(100, 70 + hehunBonus)) * 0.2
  );
  const score = Math.max(35, Math.min(99, rawScore));

  // ── 5. 生成解读文案 ──
  const allDetails = [...wuxingDetails, ...hehunDetails];

  // 根据分数段选择 summary 模板
  let summary: string;
  if (score >= 85) {
    summary = `日主${sz1.dayMaster}遇${sz2.dayMaster}，天干有情，地支有合，属上等姻缘。`;
  } else if (score >= 72) {
    summary = `日柱${sz1.dayPillar}与${sz2.dayPillar}五行互根，彼此能互相成就。`;
  } else if (score >= 60) {
    summary = `命盘显示性格互补空间大，用心经营可渐入佳境。`;
  } else {
    summary = `五行配置差异较大，但差异正是成长契机，关键在包容。`;
  }

  const detail = [
    `【四柱排盘】`,
    `你：年柱${sz1.year[0]}${sz1.year[1]} 月柱${sz1.month[0]}${sz1.month[1]} 日柱${sz1.dayPillar}`,
    `TA：年柱${sz2.year[0]}${sz2.year[1]} 月柱${sz2.month[0]}${sz2.month[1]} 日柱${sz2.dayPillar}`,
    ``,
    `【日主分析】`,
    `你日主${sz1.dayMaster}（${TG_WUXING[sz1.dayMaster]}），TA日主${sz2.dayMaster}（${TG_WUXING[sz2.dayMaster]}）。${rishiBase >= 80 ? '两者性质相近，默契天然。' : rishiBase >= 70 ? '性质不同但能互补，互相激发潜能。' : '性质差异较大，需要更多理解和磨合。'}`,
    ...allDetails.length > 0 ? [`\n【合婚关系】`, ...allDetails] : [],
    `\n综合评分：${score}/100 — ${score >= 80 ? '缘分深厚，珍惜彼此' : score >= 65 ? '基础良好，用心经营' : '需要磨合，但值得努力'}`,
  ].join('\n');

  return {
    score,
    title: '八字命理',
    summary,
    detail,
  };
}
