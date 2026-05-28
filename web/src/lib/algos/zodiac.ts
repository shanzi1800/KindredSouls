import type { BirthInfo, EngineResult } from './types';

// ═════════════════════════════════════════
// 星座合盘引擎（真实算法）
// 输入：双方月日 → 太阳星座配对 + 相位分析 + 元素和谐度
// 权重：40%
// ═════════════════════════════════════════

// ── 星座基础数据 ──

const ZODIAC_SIGNS = [
  '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座',
] as const;

type ZodiacSign = typeof ZODIAC_SIGNS[number];

/** 星座元素 */
const SIGN_ELEMENT: Record<ZodiacSign, string> = {
  '白羊座': '火', '狮子座': '火', '射手座': '火',
  '金牛座': '土', '处女座': '土', '摩羯座': '土',
  '双子座': '风', '天秤座': '风', '水瓶座': '风',
  '巨蟹座': '水', '天蝎座': '水', '双鱼座': '水',
};

/** 星座模式（基本/固定/变动） */
const SIGN_MODE: Record<ZodiacSign, string> = {
  '白羊座': '基本', '巨蟹座': '基本', '天秤座': '基本', '摩羯座': '基本',
  '金牛座': '固定', '狮子座': '固定', '天蝎座': '固定', '水瓶座': '固定',
  '双子座': '变动', '射手座': '变动', '双鱼座': '变动', '处女座': '变动',
};

/** 守护星 */
const SIGN_RULER: Record<ZodiacSign, string> = {
  '白羊座': '火星', '金牛座': '金星', '双子座': '水星',
  '巨蟹座': '月亮', '狮子座': '太阳', '处女座': '水星',
  '天秤座': '金星', '天蝎座': '冥王星', '射手座': '木星',
  '摩羯座': '土星', '水瓶座': '天王星', '双鱼座': '海王星',
};

// ── 星座日期范围 ──

interface DateRange { month: number; day: number; sign: ZodiacSign }

const ZODIAC_DATES: DateRange[] = [
  { month: 1, day: 19, sign: '摩羯座' }, { month: 1, day: 31, sign: '水瓶座' },
  { month: 2, day: 18, sign: '水瓶座' }, { month: 2, day: 29, sign: '双鱼座' },
  { month: 3, day: 20, sign: '双鱼座' }, { month: 3, day: 31, sign: '白羊座' },
  { month: 4, day: 19, sign: '白羊座' }, { month: 4, day: 30, sign: '金牛座' },
  { month: 5, day: 20, sign: '金牛座' }, { month: 5, day: 31, sign: '双子座' },
  { month: 6, day: 21, sign: '双子座' }, { month: 6, day: 30, sign: '巨蟹座' },
  { month: 7, day: 22, sign: '巨蟹座' }, { month: 7, day: 31, sign: '狮子座' },
  { month: 8, day: 22, sign: '狮子座' }, { month: 8, day: 31, sign: '处女座' },
  { month: 9, day: 22, sign: '处女座' }, { month: 9, day: 30, sign: '天秤座' },
  { month: 10, day: 23, sign: '天秤座' }, { month: 10, day: 31, sign: '天蝎座' },
  { month: 11, day: 21, sign: '天蝎座' }, { month: 11, day: 30, sign: '射手座' },
  { month: 12, day: 21, sign: '射手座' }, { month: 12, day: 31, sign: '摩羯座' },
];

// ── 配对关系数据 ──

/** 最佳配对（高契合） */
const BEST_MATCHES: Record<ZodiacSign, ZodiacSign[]> = {
  '白羊座': ['狮子座', '射手座', '双子座'],
  '金牛座': ['处女座', '摩羯座', '巨蟹座'],
  '双子座': ['天秤座', '水瓶座', '白羊座'],
  '巨蟹座': ['天蝎座', '双鱼座', '金牛座'],
  '狮子座': ['白羊座', '射手座', '双子座'],
  '处女座': ['金牛座', '摩羯座', '天蝎座'],
  '天秤座': ['双子座', '水瓶座', '射手座'],
  '天蝎座': ['巨蟹座', '双鱼座', '处女座'],
  '射手座': ['白羊座', '狮子座', '天秤座'],
  '摩羯座': ['金牛座', '处女座', '巨蟹座'],
  '水瓶座': ['双子座', '天秤座', '射手座'],
  '双鱼座': ['巨蟹座', '天蝎座', '摩羯座'],
};

/** 冲突配对（对宫，180°相位） */
const OPPOSITES: Record<ZodiacSign, ZodiacSign> = {
  '白羊座': '天秤座', '天秤座': '白羊座',
  '金牛座': '天蝎座', '天蝎座': '金牛座',
  '双子座': '射手座', '射手座': '双子座',
  '巨蟹座': '摩羯座', '摩羯座': '巨蟹座',
  '狮子座': '水瓶座', '水瓶座': '狮子座',
  '处女座': '双鱼座', '双鱼座': '处女座',
};

/** 四分相（90°，张力相位） */
const SQUARES: Record<ZodiacSign, ZodiacSign> = {
  '白羊座': '巨蟹座', '巨蟹座': '摩羯座',
  '金牛座': '狮子座', '狮子座': '天蝎座',
  '双子座': '处女座', '处女座': '射手座',
  '天秤座': '摩羯座', '摩羯座': '白羊座',
  '天蝎座': '水瓶座', '水瓶座': '金牛座',
  '射手座': '双鱼座', '双鱼座': '双子座',
};

// ── 工具函数 ──

function getZodiac(month: number, day: number): ZodiacSign {
  for (const range of ZODIAC_DATES) {
    if (month === range.month && day <= range.day) return range.sign;
  }
  return '摩羯座';
}

/** 计算两个星座的相位差（0-6，每个单位=30°） */
function getPhaseDistance(z1: ZodiacSign, z2: ZodiacSign): number {
  const idx1 = ZODIAC_SIGNS.indexOf(z1);
  const idx2 = ZODIAC_SIGNS.indexOf(z2);
  let dist = Math.abs(idx1 - idx2);
  if (dist > 6) dist = 12 - dist;
  return dist;
}

// ── 核心算法 ──

export function calcZodiac(p1: BirthInfo, p2: BirthInfo): EngineResult {
  const z1 = getZodiac(p1.month, p1.day);
  const z2 = getZodiac(p2.month, p2.day);

  // ── 1. 基础配对分 ──
  const isBestMatch = BEST_MATCHES[z1]?.includes(z2) ?? false;
  const baseScore = isBestMatch ? 85 : 65;

  // ── 2. 相位分析 ──
  const phaseDist = getPhaseDistance(z1, z2);
  let phaseScore = 70;
  let phaseDesc = '';

  if (phaseDist === 0) {
    // 同星座
    phaseScore = 88;
    phaseDesc = '同星座（0°合相），彼此深度理解，但也容易放大相同弱点';
  } else if (phaseDist === 6) {
    // 对宫（180°冲相）
    phaseScore = 58;
    phaseDesc = `对宫相位（${z1} ↔ ${z2}），吸引力极强但需平衡差异`;
  } else if (phaseDist === 3 || phaseDist === 9) {
    // 四分相（90°）
    const isSquare = SQUARES[z1] === z2 || Object.values(SQUARES).includes(z1);
    if (isSquare || phaseDist === 3) {
      phaseScore = 62;
      phaseDesc = `四分相位（${z1} □ ${z2}），存在成长张力，磨合后更稳固`;
    } else {
      // 三分相（120°）
      phaseScore = 82;
      phaseDesc = `三分相位（${z1} △ ${z2}），能量和谐流动，轻松愉快`;
    }
  } else if (phaseDist === 4 || phaseDist === 8) {
    // 三分相（120°）
    phaseScore = 82;
    phaseDesc = `三分相位（${z1} △ ${z2}），能量和谐流动，轻松愉快`;
  } else if (phaseDist === 2 || phaseDist === 10) {
    // 六分相（60°）
    phaseScore = 76;
    phaseDesc = `六分相位（${z1} ⚹ ${z2}），机缘巧合多，合作顺利`;
  } else {
    // 其他距离（30°/150°）
    phaseScore = 68;
    phaseDesc = `特殊相位（角度差${phaseDist * 30}°），有独特吸引力`;
  }

  // ── 3. 元素和谐度 ──
  const elem1 = SIGN_ELEMENT[z1];
  const elem2 = SIGN_ELEMENT[z2];
  let elementBonus = 0;
  let elementDesc = '';

  if (elem1 === elem2) {
    elementBonus = 5;
    elementDesc = `同属${elem1}象，价值观底层一致，但可能缺乏新鲜刺激`;
  } else {
    // 检查元素相生关系
    const SHENG_MAP: Record<string, string> = { '火': '土', '土': '金', '金': '水', '水': '木', '木': '火' };
    if (SHENG_MAP[elem1] === elem2 || SHENG_MAP[elem2] === elem1) {
      elementBonus = 8;
      elementDesc = `${elem1}与${elem2}相生，天然互补，互相滋养`;
    } else {
      elementBonus = 3;
      elementDesc = `${elem1}与${elem2}不同象，差异带来成长空间`;
    }
  }

  // ── 4. 模式和谐度 ──
  const mode1 = SIGN_MODE[z1];
  const mode2 = SIGN_MODE[z2];
  let modeBonus = 0;
  if (mode1 === mode2) modeBonus = 4; // 同模式=理解对方行为模式
  else modeBonus = 2; // 不同模式=互补

  // ── 5. 守护星互动 ──
  const ruler1 = SIGN_RULER[z1];
  const ruler2 = SIGN_RULER[z2];
  const rulerDesc = `${z1}守护星${ruler1}遇上${z2}守护星${ruler2}`;

  // ── 综合评分 ──
  // 基础45% + 相位30% + 元素15% + 模式10%
  const rawScore = Math.round(
    baseScore * 0.45 +
    phaseScore * 0.30 +
    (70 + elementBonus) * 0.15 +
    (70 + modeBonus) * 0.10
  );
  const score = Math.max(40, Math.min(99, rawScore));

  // ── 解读文案 ──
  let summary: string;
  if (score >= 82) {
    summary = `${z1}与${z2}的配置堪称黄金配对，星星都在为你们让路。`;
  } else if (score >= 70) {
    summary = `${z1}（你）遇上${z2}（TA），星座能量形成有趣的化学反应。`;
  } else if (score >= 58) {
    summary = `${z1}与${z2}的组合需要更多理解，但差异正是吸引力的来源。`;
  } else {
    summary = `对宫相遇，强烈的对立感背后是等量的吸引力。`;
  }

  const detail = [
    `【太阳星座】`,
    `你：${z1}（${p1.month}月${p1.day}日）— ${elem1}象 · ${mode1} · 守护星${ruler1}`,
    `TA：${z2}（${p2.month}月${p2.day}日）— ${elem2}象 · ${mode2} · 守护星${ruler2}`,
    ``,
    `【相位分析】`,
    phaseDesc,
    ``,
    `【元素互动】`,
    elementDesc,
    ``,
    `【守护星互动】`,
    rulerDesc,
    ``,
    isBestMatch
      ? `✨ ${z1}与${z2}在经典配对表中属于最佳组合之一`
      : OPPOSITES[z1] === z2
        ? `⚡ ${z1}与${z2}互为对宫，吸引力与挑战并存`
        : `◆ ${z1}与${z2}构成独特配置，不走寻常路`,
    `\n综合评分：${score}/100 — ${score >= 80 ? '星辰为证，缘分深厚' : score >= 65 ? '星光指引，值得期待' : '星途虽有挑战，携手可越'}`,
  ].join('\n');

  return {
    score,
    title: '西方星座',
    summary,
    detail,
  };
}
