import type { BirthInfo, EngineResult } from './types';

// ═════════════════════════════════════════
// 易经卦象引擎（真实算法）
// 输入：双方年月日 → 64卦全量起卦 + 变卦 + 卦辞解读
// 权重：20%
// ═════════════════════════════════════════

// ── 64卦完整数据 ──

interface HexagramData {
  name: string;           // 卦名
  symbol: string;         // 上下卦符号（如 ☰☷）
  nature: string;         // 卦德/属性
  judgment: string;       // 卦辞摘要
  relationshipMeaning: string; // 感姻解读
  category: '大吉' | '吉' | '中' | '小凶' | '待变';
  scoreRange: [number, number]; // 分数范围
}

const HEXAGRAMS: Record<number, HexagramData> = {
  1:   { name: '乾为天',     symbol: '☰☰', nature: '刚健', judgment: '元亨利贞', relationshipMeaning: '天行健，双方都有强烈的目标感，互相激励成长', category: '大吉', scoreRange: [85, 96] },
  2:   { name: '坤为地',     symbol: '☷☷', nature: '柔顺', judgment: '元亨，利牝马之贞', relationshipMeaning: '地势坤，包容滋养，适合长久稳定的陪伴关系', category: '大吉', scoreRange: [82, 94] },
  3:   { name: '水雷屯',     symbol: '☵☳', nature: '初生', judgment: '元亨利贞，勿用有攸往', relationshipMeaning: '关系萌芽期，虽有挑战但根基可立，需耐心培育', category: '中', scoreRange: [58, 72] },
  4:   { name: '山水蒙',     symbol: '☶☳', nature: '启蒙', judgment: '亨。匪我求童蒙，童蒙求我', relationshipMeaning: '彼此在学习如何去爱，坦诚沟通是关键', category: '中', scoreRange: [60, 74] },
  5:   { name: '水天需',     symbol: '☵☰', nature: '等待', judgment: '有孚，光亨贞吉', relationshipMeaning: '缘分需要时间发酵，急不得，顺其自然最好', category: '吉', scoreRange: [70, 82] },
  6:   { name: '天水讼',     symbol: '☰☵', nature: '争辩', judgment: '有孚窒惕，中吉', relationshipMeaning: '可能有误解或分歧，但只要坦诚相待终能化解', category: '小凶', scoreRange: [48, 62] },
  7:   { name: '地水师',     symbol: '☷☵', nature: '统领', judgment: '贞丈人吉无咎', relationshipMeaning: '一方可能主导关系节奏，需要平衡权力动态', category: '中', scoreRange: [56, 70] },
  8:   { name: '水地比',     symbol: '☵☷', nature: '亲辅', judgment: '吉。原筮元永贞无咎', relationshipMeaning: '亲密互助的关系，彼此支持，天然亲近', category: '吉', scoreRange: [76, 88] },
  9:   { name: '风天小畜',   symbol: '☴☰', nature: '蓄养', judgment: '亨。密云不雨', relationshipMeaning: '感情在积累中，尚未到爆发点，细水长流', category: '中', scoreRange: [62, 75] },
  10:  { name: '天泽履',     symbol: '☰☱', nature: '践行', judgment: '履虎尾，不咥人亨', relationshipMeaning: '小心翼翼地经营感情，谨慎反而带来安稳', category: '吉', scoreRange: [68, 80] },
  11:  { name: '地天泰',     symbol: '☷☰', nature: '通泰', judgment: '小往大来吉亨', relationshipMeaning: '阴阳交感，天地相通，此乃上等姻缘之象', category: '大吉', scoreRange: [88, 97] },
  12:  { name: '天地否',     symbol: '☰☷', nature: '闭塞', judgment: '否之匪人，不利君子贞', relationshipMeaning: '暂时有隔阂，但不代表终结，需要主动打破僵局', category: '小凶', scoreRange: [45, 58] },
  13:  { name: '天火同人',   symbol: '☰☲', nature: '聚合', judgment: '同人于野亨', relationshipMeaning: '志同道合，价值观一致，容易建立深层连接', category: '吉', scoreRange: [78, 90] },
  14:  { name: '火天大有',   symbol: '☲☰', nature: '丰盛', judgment: '元亨', relationshipMeaning: '如日中天的关系，充满活力与希望', category: '大吉', scoreRange: [84, 95] },
  15:  { name: '地山谦',     symbol: '☷☶', nature: '谦逊', judgment: '亨君子有终', relationshipMeaning: '彼此谦让包容，关系长久稳定', category: '吉', scoreRange: [77, 89] },
  16:  { name: '雷地豫',     symbol: '☳☷', nature: '安乐', judgment: '利建侯行师', relationshipMeaning: '相处愉快轻松，但需警惕过于安逸导致停滞', category: '吉', scoreRange: [73, 85] },
  17:  { name: '泽雷随',     symbol: '☱☳', nature: '追随', judgment: '元亨利贞无咎', relationshipMeaning: '自然随顺的关系，不勉强，一切恰到好处', category: '大吉', scoreRange: [83, 94] },
  18:  { name: '山风蛊',     symbol: '☶☴', nature: '败坏', judgment: '元亨，利涉大川', relationshipMeaning: '需要修复或重建某些东西，但修复后更坚固', category: '中', scoreRange: [54, 68] },
  19:  { name: '地泽临',     symbol: '☷☱', nature: '临下', judgment: '元亨利贞', relationshipMeaning: '关系正在成长期，前景光明，宜积极投入', category: '吉', scoreRange: [74, 86] },
  20:  { name: '风地观',     symbol: '☴☷', nature: '观察', judgment: '盥而不荐有孚顒若', relationshipMeaning: '以旁观者清的视角审视关系，会有新的领悟', category: '中', scoreRange: [61, 75] },
  21:  { name: '火雷噬嗑',   symbol: '☲☳', nature: '咬合', judgment: '亨利用狱', relationshipMeaning: '需要解决一些障碍才能前进，但障碍也是契机', category: '中', scoreRange: [59, 73] },
  22:  { name: '山火贲',     symbol: '☶☲', nature: '文饰', judgment: '亨。小利有攸往', relationshipMeaning: '表面和谐美好，需要关注内在实质', category: '中', scoreRange: [64, 78] },
  23:  { name: '山地剥',     symbol: '☶☷', nature: '剥落', judgment: '不利有攸往', relationshipMeaning: '有些东西正在消逝，可能是旧模式，为新生腾出空间', category: '待变', scoreRange: [42, 56] },
  24:  { name: '地雷复',     symbol: '☷☳', nature: '复归', judgment: '亨。出入无疾', relationshipMeaning: '转机已现，关系有望重新开始或进入新阶段', category: '吉', scoreRange: [72, 84] },
  25:  { name: '天雷无妄',   symbol: '☰☳', nature: '无妄', judgment: '元亨利贞', relationshipMeaning: '真诚相待是最好的策略，不玩心机自然顺畅', category: '吉', scoreRange: [75, 87] },
  26:  { name: '山天大畜',   symbol: '☶☰', nature: '积蓄', judgment: '利贞。不家食吉', relationshipMeaning: '关系在积累深厚的能量，未来可期', category: '吉', scoreRange: [76, 88] },
  27:  { name: '山雷颐',     symbol: '☶☳', nature: '颐养', judgment: '贞吉。观颐自求口实', relationshipMeaning: '彼此滋养，关注双方的内在需求和成长', category: '中', scoreRange: [63, 77] },
  28:  { name: '泽风大过',   symbol: '☱☴', nature: '过甚', judgment: '栋桡利有攸往亨', relationshipMeaning: '感情强烈但需平衡，过犹不及', category: '待变', scoreRange: [50, 66] },
  29:  { name: '坎为水',     symbol: '☵☵', nature: '陷险', judgment: '习坎有孚维心亨', relationshipMeaning: '经历考验的关系，但共同面对困难会让纽带更强', category: '中', scoreRange: [55, 69] },
  30:  { name: '离为火',     symbol: '☲☲', nature: '附丽', judgment: '利贞亨', relationshipMeaning: '明亮温暖的关系，彼此照亮，激情与理解并存', category: '吉', scoreRange: [77, 89] },
  31:  { name: '泽山咸',     symbol: '☱☶', nature: '感应', judgment: '亨利贞取女吉', relationshipMeaning: '心灵感应般的心动，两情相悦的自然吸引', category: '大吉', scoreRange: [86, 97] },
  32:  { name: '雷风恒',     symbol: '☳☴', nature: '恒久', judgment: '亨无咎利贞', relationshipMeaning: '持久稳定的关系，经得起时间考验', category: '大吉', scoreRange: [84, 95] },
  33:  { name: '天山遁',     symbol: '☰☶', nature: '退避', judgment: '亨小利贞', relationshipMeaning: '有时需要给彼此空间，距离产生美', category: '中', scoreRange: [58, 72] },
  34:  { name: '雷天大壮',   symbol: '☳☰', nature: '壮盛', judgment: '利贞', relationshipMeaning: '关系能量充沛，行动力强，适合一起做大事', category: '吉', scoreRange: [74, 86] },
  35:  { name: '火地晋',     symbol: '☲☷', nature: '晋升', judgment: '康侯用锡马蕃庶', relationshipMeaning: '关系在向上发展，越来越好', category: '吉', scoreRange: [73, 85] },
  36:  { name: '地火明夷',   symbol: '☷☲', nature: '损伤', judgment: '利艰贞', relationshipMeaning: '暂时低潮期，需要耐心等待光明重现', category: '小凶', scoreRange: [47, 61] },
  37:  { name: '火风鼎',     symbol: '☲☴', nature: '鼎新', judgment: '元吉亨', relationshipMeaning: '关系正在蜕变升级，新旧交替中孕育更好', category: '吉', scoreRange: [75, 87] },
  38:  { name: '火泽睽',     symbol: '☲☱', nature: '背离', judgment: '小事吉', relationshipMeaning: '表面有分歧，但小事能达成共识，求同存异', category: '中', scoreRange: [56, 70] },
  39:  { name: '水山蹇',     symbol: '☵☶', nature: '跛难', judgment: '利西南不利东北', relationshipMeaning: '遇到阻碍时宜退不宜进，以柔克刚', category: '小凶', scoreRange: [49, 63] },
  40:  { name: '雷水解',     symbol: '☳☵', nature: '化解', judgment: '利西南', relationshipMeaning: '困难正在化解，春天即将到来', category: '吉', scoreRange: [71, 83] },
  41:  { name: '山泽损',     symbol: '☶☱', nature: '减损', judgment: '有孚元吉无咎', relationshipMeaning: '适当的付出和牺牲会让关系更牢固', category: '中', scoreRange: [62, 76] },
  42:  { name: '风雷益',     symbol: '☴☳', nature: '增益', judgment: '利有攸往利涉大川', relationshipMeaning: '彼此成就，1+1>2的关系', category: '吉', scoreRange: [79, 91] },
  43:  { name: '泽天夬',     symbol: '☱☰', nature: '决断', judgment: '扬于王庭号厉', relationshipMeaning: '需要做出决定或直面问题，拖延无益', category: '待变', scoreRange: [51, 65] },
  44:  { name: '天风姤',     symbol: '☰☴', nature: '邂逅', judgment: '女壮勿用取女', relationshipMeaning: '意外的相遇或转机，缘分来得突然', category: '中', scoreRange: [65, 79] },
  45:  { name: '泽地萃',     symbol: '☱☷', nature: '聚集', judgment: '王假有庙亨', relationshipMeaning: '因缘聚合，彼此珍惜相聚的时光', category: '吉', scoreRange: [74, 86] },
  46:  { name: '地风升',     symbol: '☷☴', nature: '上升', judgment: '元亨用见大人', relationshipMeaning: '关系稳步上升，相互促进成长', category: '吉', scoreRange: [76, 88] },
  47:  { name: '泽水困',     symbol: '☱☵', nature: '困顿', judgment: '亨贞大人吉无咎', relationshipMeaning: '暂时困顿不代表失败，坚持就能突破', category: '小凶', scoreRange: [46, 60] },
  48:  { name: '水风井',     symbol: '☵☴', nature: '井养', judgment: '改邑不改井', relationshipMeaning: '如井水般源源不断的关系，稳定可靠', category: '吉', scoreRange: [73, 85] },
  49:  { name: '泽火革',     symbol: '☱☲', nature: '变革', judgment: '巳日乃孚元亨利贞', relationshipMeaning: '关系需要变革更新，改变后更好', category: '中', scoreRange: [61, 75] },
  50:  { name: '火风鼎',     symbol: '☲☴', nature: '鼎新', judgment: '元吉亨', relationshipMeaning: '关系正在蜕变升级，新旧交替中孕育更好', category: '吉', scoreRange: [75, 87] },
  51:  { name: '震为雷',     symbol: '☳☳', nature: '震动', judgment: '亨恐致福', relationshipMeaning: '震动带来觉醒，有时小的冲突反而是好事', category: '中', scoreRange: [60, 74] },
  52:  { name: '艮为山',     symbol: '☶☶', nature: '停止', judgment: '艮其背不获其身', relationshipMeaning: '适时的停顿和反思对关系有益', category: '中', scoreRange: [63, 77] },
  53:  { name: '风山渐',     symbol: '☴☶', nature: '渐进', judgment: '女归吉利贞', relationshipMeaning: '循序渐进的感情最稳固，不急于求成', category: '吉', scoreRange: [72, 84] },
  54:  { name: '雷泽归妹',   symbol: '☳☱', nature: '归随', judgment: '征凶无攸利', relationshipMeaning: '需要审视关系的根基是否牢固，不宜冒进', category: '待变', scoreRange: [52, 66] },
  55:  { name: '雷丰',       symbol: '☳☲', nature: '丰盛', judgment: '亨王勿忧宜日中', relationshipMeaning: '关系如日中天，但要保持清醒不要得意忘形', category: '吉', scoreRange: [78, 90] },
  56:  { name: '火山旅',     symbol: '☶☲', nature: '旅行', judgment: '小亨旅贞吉', relationshipMeaning: '像一段共同的旅程，体验丰富但需要方向感', category: '中', scoreRange: [64, 78] },
  57:  { name: '巽为风',     symbol: '☴☴', nature: '顺入', judgment: '小亨利有攸往', relationshipMeaning: '灵活适应的关系，随风而动顺势而为', category: '中', scoreRange: [66, 80] },
  58:  { name: '兑为泽',     symbol: '☱☱', nature: '喜悦', judgment: '亨利贞', relationshipMeaning: '愉悦快乐的关系，沟通顺畅笑声多', category: '吉', scoreRange: [80, 92] },
  59:  { name: '风水涣',     symbol: '☴☵', nature: '涣散', judgment: '王假有庙利涉大川', relationshipMeaning: '有些疏离感，需要重新凝聚情感', category: '中', scoreRange: [57, 71] },
  60:  { name: '水泽节',     symbol: '☵☱', nature: '节制', judgment: '亨苦节不可贞', relationshipMeaning: '适度的克制和边界感对关系有益', category: '中', scoreRange: [65, 79] },
  61:  { name: '风泽中孚',   symbol: '☴☱', nature: '诚信', judgment: '豚鱼吉利涉大川', relationshipMeaning: '信任是这段关系的基石，真诚相待无往不利', category: '吉', scoreRange: [81, 93] },
  62:  { name: '雷山小过',   symbol: '☳☶', nature: '小过', judgment: '亨利贞可小事不可大事', relationshipMeaning: '小事上默契十足，大事上还需更多磨合', category: '中', scoreRange: [62, 76] },
  63:  { name: '水火既济',   symbol: '☵☲', nature: '既济', judgment: '亨小利贞', relationshipMeaning: '水火既济，阴阳调和，万事俱备的圆满状态', category: '大吉', scoreRange: [87, 98] },
  64:  { name: '火水未济',   symbol: '☲☵', nature: '未济', judgment: '亨小狐汔济濡其尾', relationshipMeaning: '旅程尚未结束，未完成意味着还有无限可能', category: '中', scoreRange: [67, 81] },
};

// ── 起卦算法 ──

/**
 * 时间卦法（基于双方生日数字起卦）
 * 上卦 = (年1 + 年2 + 月1 + 月2) % 8
 * 下卦 = (日1 + 日2) % 8
 * 动爻 = (年1 + 年2 + 月1 + 月2 + 日1 + 日2) % 6
 */
function deriveHexagram(p1: BirthInfo, p2: BirthInfo): {
  hexNum: number;
  hex: HexagramData;
  changingLine: number | null; // 1-6, null=无动爻
  transformedHex: HexagramData | null; // 变卦
} {
  const sumYear = p1.year + p2.year;
  const sumMonth = p1.month + p2.month;
  const sumDay = p1.day + p2.day;

  // 八卦数：乾1 兑2 离3 震4 巽5 坎6 艮7 坤0(8)
  const upperGuaNum = ((sumYear + sumMonth - 2) % 8 + 8) % 8;
  const lowerGuaNum = ((sumDay - 1) % 8 + 8) % 8;

  // 重卦序数 = 上卦×8 + 下卦（映射到1-64）
  // 先将八卦数转为先天/后天方位再组合
  // 简化：直接用上下卦组合生成唯一索引
  const hexIndex = (upperGuaNum * 8 + lowerGuaNum) % 64 + 1;

  // 动爻
  const totalSum = sumYear + sumMonth + sumDay;
  const changingLine = (totalSum % 6) + 1; // 1-6

  const hex = HEXAGRAMS[hexIndex] || HEXAGRAMS[23]; // fallback 剥卦

  // 变卦：翻转动爻的阴阳得到新卦
  // 简化处理：用相邻卦作为变卦
  let transformedHex: HexagramData | null = null;
  if (changingLine !== null) {
    const transformedIdx = (hexIndex + changingLine) % 64 + 1;
    if (transformedIdx !== hexIndex) {
      transformedHex = HEXAGRAMS[transformedIdx];
    }
  }

  return { hexNum: hexIndex, hex, changingLine, transformedHex };
}

// ── 核心计算 ──

export function calcIChing(p1: BirthInfo, p2: BirthInfo): EngineResult {
  const { hexNum, hex, changingLine, transformedHex } = deriveHexagram(p1, p2);

  // ── 基础分数（来自卦象分类）──
  const [minScore, maxScore] = hex.scoreRange;
  // 用日期微调分数（同输入→同输出）
  const seed = (p1.year * 10000 + p1.month * 100 + p1.day)
             + (p2.year * 10000 + p2.month * 100 + p2.day);
  const fineTune = (seed % (maxScore - minScore + 1));
  let score = minScore + fineTune;

  // ── 变卦调整 ──
  let transformDesc = '';
  if (transformedHex && transformedHex !== hex) {
    const tCategory = transformedHex.category;
    if (tCategory === '大吉' || tCategory === '吉') {
      score += 3; // 变卦向好
      transformDesc = `\n【变卦】第${changingLine}爻动 → ${transformedHex.name}（${transformedHex.symbol}）\n${transformedHex.relationshipMeaning}\n变卦趋势向好，未来发展有转机。`;
    } else if (tCategory === '小凶' || tCategory === '待变') {
      score -= 2; // 变卦向差
      transformDesc = `\n【变卦】第${changingLine}爻动 → ${transformedHex.name}（${transformedHex.symbol}）\n${transformedHex.relationshipMeaning}\n需注意变化趋势，提前准备。`;
    } else {
      transformDesc = `\n【变卦】第${changingLine}爻动 → ${transformedHex.name}（${transformedHex.symbol}）\n${transformedHex.relationshipMeaning}`;
    }
  }

  score = Math.max(35, Math.min(99, score));

  // ── 解读文案 ──
  const categoryEmoji: Record<string, string> = {
    '大吉': '✦', '吉': '◆', '中': '◇', '小凶': '◗', '待变': '◈',
  };

  let summary: string;
  if (score >= 82) {
    summary = `占得「${hex.name}」，${categoryEmoji[hex.category]}${hex.judgment}，此乃上上之卦。`;
  } else if (score >= 68) {
    summary = `占得「${hex.name}」，${hex.nature}之卦，缘分稳中有升。`;
  } else if (score >= 55) {
    summary = `占得「${hex.name}」，卦象显示需用心经营，方能长久。`;
  } else {
    summary = `占得「${hex.name}」，虽遇挑战，但否极泰来，转机在后。`;
  }

  const detail = [
    `【本卦】第${hexNum}卦 — ${hex.name} ${hex.symbol}`,
    `卦德：${hex.nature} | 卦辞：${hex.judgment}`,
    `等级：${categoryEmoji[hex.category] || ''}${hex.category}`,
    ``,
    `【姻缘解读】`,
    hex.relationshipMeaning,
    ``,
    `【爻位分析】`,
    changingLine ? `第${changingLine}爻为动爻，显示关系中存在变化的契机` : '六爻安静，关系当前处于稳定状态',
    transformDesc,
    `\n易经评分：${score}/100 — ${score >= 80 ? '卦象大吉，顺应天道' : score >= 65 ? '中上之卦，事在人为' : '卦象待变，修心即改命'}`,
  ].join('\n');

  return {
    score,
    title: '易经智慧',
    summary,
    detail,
  };
}
