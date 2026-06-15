import type { BirthInfo, EngineResult } from './types';
import type { AlgLang } from './i18n';

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

/** 天干多语言名称 */
const TIAN_GAN_NAMES: Record<string, Record<string, string>> = {
  '甲': { zh: '甲', en: 'Jia', es: 'Jia', fr: 'Jia', th: 'เจีย', vi: 'Giáp' },
  '乙': { zh: '乙', en: 'Yi', es: 'Yi', fr: 'Yi', th: 'อี้', vi: 'Ất' },
  '丙': { zh: '丙', en: 'Bing', es: 'Bing', fr: 'Bing', th: 'ปิง', vi: 'Bính' },
  '丁': { zh: '丁', en: 'Ding', es: 'Ding', fr: 'Ding', th: 'ติง', vi: 'Đinh' },
  '戊': { zh: '戊', en: 'Wu', es: 'Wu', fr: 'Wu', th: 'อู๋', vi: 'Mậu' },
  '己': { zh: '己', en: 'Ji', es: 'Ji', fr: 'Ji', th: 'จี้', vi: 'Kỷ' },
  '庚': { zh: '庚', en: 'Geng', es: 'Geng', fr: 'Geng', th: 'เกิง', vi: 'Canh' },
  '辛': { zh: '辛', en: 'Xin', es: 'Xin', fr: 'Xin', th: 'ซิน', vi: 'Tân' },
  '壬': { zh: '壬', en: 'Ren', es: 'Ren', fr: 'Ren', th: 'เรน', vi: 'Nhâm' },
  '癸': { zh: '癸', en: 'Gui', es: 'Gui', fr: 'Gui', th: 'กุ้ย', vi: 'Quý' },
};

/** 地支多语言名称 */
const DI_ZHI_NAMES: Record<string, Record<string, string>> = {
  '子': { zh: '子', en: 'Zi', es: 'Zi', fr: 'Zi', th: 'จื้อ', vi: 'Tý' },
  '丑': { zh: '丑', en: 'Chou', es: 'Chou', fr: 'Chou', th: 'โฉ่ว', vi: 'Sửu' },
  '寅': { zh: '寅', en: 'Yin', es: 'Yin', fr: 'Yin', th: 'อิ่น', vi: 'Dần' },
  '卯': { zh: '卯', en: 'Mao', es: 'Mao', fr: 'Mao', th: 'เหมา', vi: 'Mão' },
  '辰': { zh: '辰', en: 'Chen', es: 'Chen', fr: 'Chen', th: 'เฉิน', vi: 'Thìn' },
  '巳': { zh: '巳', en: 'Si', es: 'Si', fr: 'Si', th: 'ซื่อ', vi: 'Tỵ' },
  '午': { zh: '午', en: 'Wu', es: 'Wu', fr: 'Wu', th: 'อู๋', vi: 'Ngọ' },
  '未': { zh: '未', en: 'Wei', es: 'Wei', fr: 'Wei', th: 'เหว่ย์', vi: 'Mùi' },
  '申': { zh: '申', en: 'Shen', es: 'Shen', fr: 'Shen', th: 'เชิน', vi: 'Thân' },
  '酉': { zh: '酉', en: 'You', es: 'You', fr: 'You', th: 'โย่ว', vi: 'Dậu' },
  '戌': { zh: '戌', en: 'Xu', es: 'Xu', fr: 'Xu', th: 'ซวี่', vi: 'Tuất' },
  '亥': { zh: '亥', en: 'Hai', es: 'Hai', fr: 'Hai', th: 'ไห่', vi: 'Hợi' },
};

/** 五行多语言名称 */
const WU_XING_NAMES: Record<string, Record<string, string>> = {
  '木': { zh: '木', en: 'Wood', es: 'Madera', fr: 'Bois', th: 'ไม้', vi: 'Mộc' },
  '火': { zh: '火', en: 'Fire', es: 'Fuego', fr: 'Feu', th: 'ไฟ', vi: 'Hỏa' },
  '土': { zh: '土', en: 'Earth', es: 'Tierra', fr: 'Terre', th: 'ดิน', vi: 'Thổ' },
  '金': { zh: '金', en: 'Metal', es: 'Metal', fr: 'Métal', th: 'โลหะ', vi: 'Kim' },
  '水': { zh: '水', en: 'Water', es: 'Agua', fr: 'Eau', th: 'น้ำ', vi: 'Thủy' },
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
    dayPillar: `${dTG}${dDZ}`,
  };
}

// ── 合婚评分引擎 ──


export function calcBaZi(p1: BirthInfo, p2: BirthInfo, lang: AlgLang = 'zh'): EngineResult {
  // Helper: translate gan/zhi/wuxing for target lang
  const tg = (g: string) => lang === 'zh' ? (TIAN_GAN_NAMES[g]?.[lang] || g) : `${TIAN_GAN_NAMES[g]?.[lang] || g}(${WU_XING_NAMES[TG_WUXING[g]]?.[lang] || ''})`;
  const dz_ = (z: string) => lang === 'zh' ? (DI_ZHI_NAMES[z]?.[lang] || z) : `${DI_ZHI_NAMES[z]?.[lang] || z}(${WU_XING_NAMES[DZ_WUXING[z]]?.[lang] || ''})`;
  const wx = (w: string) => WU_XING_NAMES[w]?.[lang] || w;

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
      const wxLabels: Record<string, Record<string,string>> = diff > 0
        ? { you: { zh:'你', en:'Your', es:'Tu', fr:'Votre', th:'ของคุณ', vi:'của bạn' },
            ta: { zh:'对方', en:"partner's", es:'de tu pareja', fr:'de votre partenaire', th:'ของคู่ครอง', vi:'của đối phương' } }
        : { you: { zh:'对方', en:"Partner's", es:'De tu pareja', fr:'De votre partenaire', th:'ของคู่ครอง', vi:'của đối phương' },
            ta: { zh:'你', en:'your', es:'tuyo', fr:'votre', th:'ของคุณ', vi:'của bạn' } };
      const wxQi: Record<string,string> = { zh:'气强', en:' element is strong', es:' es fuerte', fr:' est fort', th:' แข็งแกร่ง', vi:' mạnh' };
      const wxBenefit: Record<string,string> = { zh:', 对方可以受益', en:', partner can benefit', es:', tu pareja puede beneficiarse', fr:', votre partenaire peut en bénéficier', th:', คู่ครองได้ประโยชน์', vi:', đối phương được lợi' };
      wuxingDetails.push(`${wxLabels.you[lang]} ${wx(w)}${wxQi[lang]}${wxBenefit[lang]}`);
      wuxingBonus += 3;
    }
  }
  const wuxingScore = Math.min(100, 60 + wuxingBonus + (wuxingDetails.length > 0 ? 5 : 0));

  // ── 3. 合婚特殊关系 ──
  let hehunBonus = 0;
  const hehunDetails: string[] = [];

  // 天干六合检查
  if (TIANGAN_LIUHE[sz1.dayMaster] === sz2.dayMaster) {
    hehunBonus += 12;
    const liuheLabel = { zh:`日干${sz1.dayMaster}与${sz2.dayMaster}形成【天干六合】，情感纽带极强`,
      en:`Day Stems ${tg(sz1.dayMaster)} & ${tg(sz2.dayMaster)} form a Six Harmony — powerful emotional bond`,
      es:`Tallos ${tg(sz1.dayMaster)} y ${tg(sz2.dayMaster)} forman Seis Armonías — vínculo emocional poderoso`,
      fr:`Tiges ${tg(sz1.dayMaster)} et ${tg(sz2.dayMaster)} forment Six Harmonies — lien émotionnel puissant`,
      th:`ธาตุ ${tg(sz1.dayMaster)} และ ${tg(sz2.dayMaster)} สร้างหกสามัคคี — พันธะอารมณ์ที่ทรงพลัง`,
      vi:`Ngày ${tg(sz1.dayMaster)} và ${tg(sz2.dayMaster)} tạo Lục Hợp — liên kết cảm xúc mạnh mẽ` }[lang] || '';
    hehunDetails.push(liuheLabel);
  }

  // 地支六合/三合检查（年支、月支、日支）
  const PILLAR_LABELS: Record<string, Record<string,string>> = {
    '年': { zh:'年', en:'Year', es:'Año', fr:'Année', th:'ปี', vi:'Năm' },
    '月': { zh:'月', en:'Month', es:'Mes', fr:'Mois', th:'เดือน', vi:'Tháng' },
    '日': { zh:'日', en:'Day', es:'Día', fr:'Jour', th:'วัน', vi:'Ngày' },
  };
  for (const label of ['年', '月', '日']) {
    const dz1 = label === '年' ? sz1.year[1] : label === '月' ? sz1.month[1] : sz1.day[1];
    const dz2 = label === '年' ? sz2.year[1] : label === '月' ? sz2.month[1] : sz2.day[1];
    const pLabel = PILLAR_LABELS[label]?.[lang] || PILLAR_LABELS[label]?.['en'] || label;

    // 三合局
    const sanhe = DZHI_SANHE[dz1];
    if (sanhe && sanhe.partners.includes(dz2)) {
      hehunBonus += 10;
      const sanheLabel = {
        zh:`${pLabel}支${dz1}与${dz2}参与【三合${sanhe.element}局】，根基稳固`,
        en:`${pLabel} Branch ${dz_(dz1)} & ${dz_(dz2)} form Three-Element ${wx(sanhe.element)} Combination — solid foundation`,
        es:`Rama ${pLabel} ${dz_(dz1)} y ${dz_(dz2)} forman Combinación de Tres Elementos de ${wx(sanhe.element)} — base sólida`,
        fr:`Branche ${pLabel} ${dz_(dz1)} et ${dz_(dz2)} forment Trois Éléments ${wx(sanhe.element)} — fondation solide`,
        th:`${pLabel} สาขา ${dz_(dz1)} และ ${dz_(dz2)} สร้างธาตุ ${wx(sanhe.element)} — รากฐานมั่นคง`,
        vi:`${pLabel} Trụ ${dz_(dz1)} và ${dz_(dz2)} tạo Tam Hợp ${wx(sanhe.element)} — nền tảng vững chắc`,
      }[lang] || '';
      hehunDetails.push(sanheLabel);
    }

    // 六冲（扣分）
    if (DZHI_LIUCHONG[dz1] === dz2) {
      hehunBonus -= 8;
      const liuchongLabel = {
        zh:`${pLabel}支${dz1}与${dz2}形成【六冲】，需注意沟通方式`,
        en:`${pLabel} Branch ${dz_(dz1)} & ${dz_(dz2)} form a Six Clash — mindful communication needed`,
        es:`Rama ${pLabel} ${dz_(dz1)} y ${dz_(dz2)} forman un Choque Seis — se necesita comunicación cuidadosa`,
        fr:`Branche ${pLabel} ${dz_(dz1)} et ${dz_(dz2)} forment un Choc Six — une communication attentionnée est nécessaire`,
        th:`${pLabel} สาขา ${dz_(dz1)} และ ${dz_(dz2)} ขัดแย้ง — ต้องสื่อสารอย่างระมัดระวัง`,
        vi:`${pLabel} Trụ ${dz_(dz1)} và ${dz_(dz2)} tạo Lục Xung — cần giao tiếp cẩn thận`,
      }[lang] || '';
      hehunDetails.push(liuchongLabel);
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

  // i18n labels
  const BAZI_LABELS = {
    sipanTitle: { zh:'【四柱排盘】', en:'[Four Pillars Chart]', es:'[Carta Cuatro Pilares]', fr:'[Carte Quatre Piliers]', th:'[แผนภูมิสี่เสา]', vi:'[Tứ Trụ]' },
    you: { zh:'你', en:'You', es:'Tú', fr:'Vous', th:'คุณ', vi:'Bạn' },
    ta: { zh:'TA', en:'Partner', es:'Pareja', fr:'Partenaire', th:'คู่ครอง', vi:'Đối phương' },
    yearPillar: { zh:'年柱', en:'Year', es:'Año', fr:'Année', th:'ปี', vi:'Năm' },
    monthPillar: { zh:'月柱', en:'Month', es:'Mes', fr:'Mois', th:'เดือน', vi:'Tháng' },
    dayPillar: { zh:'日柱', en:'Day', es:'Día', fr:'Jour', th:'วัน', vi:'Ngày' },
    rishiTitle: { zh:'【日主分析】', en:'[Day Master Analysis]', es:'[Análisis Maestro Día]', fr:'[Analyse Maître Jour]', th:'[วิเคราะห์วันเจ้า]', vi:'[Phân tích Nhật Chủ]' },
    hehunTitle: { zh:'【合婚关系】', en:'[Marital Harmony]', es:'[Armonía Matrimonial]', fr:'[Harmonie Conjugale]', th:'[ความสามัคคีสมรส]', vi:'[Hợp Hôn]' },
    scoreLabel: { zh:'综合评分', en:'Overall Score', es:'Puntuación', fr:'Score', th:'คะแนนรวม', vi:'Điểm tổng' },
    element: { zh:'五行', en:'element', es:'elemento', fr:'élément', th:'ธาตุ', vi:'nguyên tố' },
    dayMaster: { zh:'日主', en:'Day Master', es:'Maestro Día', fr:'Maître Jour', th:'วันเจ้า', vi:'Nhật Chủ' },
    detailYou: { zh:'你', en:'Your', es:'Tu', fr:'Votre', th:'ของคุณ', vi:'của bạn' },
    detailTa: { zh:'TA', en:"Partner's", es:'Pareja', fr:'Partenaire', th:'ของคู่ครอง', vi:'của đối phương' },
  };

  // 根据分数段选择 summary 模板
  let summary: string;
  if (score >= 85) {
    const SUMMARY_85: Record<string,string> = {
      zh:`日主\${sz1.dayMaster}遇\${sz2.dayMaster}，天干有情，地支有合，属上等姻缘。`,
      en:`Day Master \${sz1.dayMaster} meets \${sz2.dayMaster} — heavenly stems harmonize, earthly branches align. A superior match.`,
      es:`Maestro Día \${sz1.dayMaster} encuentra \${sz2.dayMaster} — tallos celestiales armonizan, ramas terrestres se alinean. Unión superior.`,
      fr:`Maître Jour \${sz1.dayMaster} rencontre \${sz2.dayMaster} — tiges célestes s'harmonisent, branches terrestres s'alignent. Union supérieure.`,
      th:`เจ้า \${sz1.dayMaster} พบ \${sz2.dayMaster} — กิ่งฟ้าปรองดอง กิ่งดินลงรอย ชะตาชีวิตระดับสูง`,
      vi:`Nhật Chủ \${sz1.dayMaster} gặp \${sz2.dayMaster} — thiên can hòa hợp địa chi thuận duyên duyên phần trời`,
    };
    summary = SUMMARY_85[lang] || SUMMARY_85['en'];
  } else if (score >= 72) {
    const SUMMARY_72: Record<string,string> = {
      zh:`日柱\${sz1.dayPillar}与\${sz2.dayPillar}五行互根，彼此能互相成就。`,
      en:`Day Pillar \${sz1.dayPillar} and \${sz2.dayPillar} share elemental roots — each empowers the other.`,
      es:`Pilar Día \${sz1.dayPillar} y \${sz2.dayPillar} comparten raíces elementales — cada uno potencia al otro.`,
      fr:`Pilier Jour \${sz1.dayPillar} et \${sz2.dayPillar} partagent des racines élémentaires — chacun renforce l'autre.`,
      th:`เสา \${sz1.dayPillar} และ \${sz2.dayPillar} มีรากธาตุเดียวกัน — ช่วยเสริมกัน`,
      vi:`Trụ \${sz1.dayPillar} và \${sz2.dayPillar} cùng nguyên tố — mỗi người giúp đỡ người kia`,
    };
    summary = SUMMARY_72[lang] || SUMMARY_72['en'];
  } else if (score >= 60) {
    const SUMMARY_60: Record<string,string> = {
      zh:`命盘显示性格互补空间大，用心经营可渐入佳境。`,
      en:`Charts show strong complementary potential — with care, this relationship blossoms.`,
      es:`Los gráficos muestran fuerte potencial complementario — con cuidado, esta relación florece.`,
      fr:`Les graphiques montrent un fort potentiel complémentaire — avec soin, cette relation s'épanouit.`,
      th:`แผนชะตามีศักยภาพเสริมกันสูง — ดูแลดี๊ ความสัมพันธ์จะเบ่งบาน`,
      vi:`Bản đồ cho thấy tiềm năng bổ trợ mạnh — chăm sóc tốt, quan hệ sẽ nở hoa`,
    };
    summary = SUMMARY_60[lang] || SUMMARY_60['en'];
  } else {
    const SUMMARY_LT: Record<string,string> = {
      zh:`五行配置差异较大，但差异正是成长契机，关键在包容。`,
      en:`Elemental configurations differ notably, but differences are growth opportunities. Tolerance is key.`,
      es:`Las configuraciones elementales difieren notablemente, pero las diferencias son oportunidades de crecimiento. La tolerancia es clave.`,
      fr:`Les configurations élémentaires diffèrent notablement, mais les différences sont des opportunités de croissance. La tolérance est la clé.`,
      th:`ธาตุต่างกันมาก แต่ความต่างคือโอกาสเติบโต ความอดทนคือกุญแจ`,
      vi:`Nguyên tố khác nhau nhiều, nhưng khác biệt là cơ hội phát triển. Sự khoan dung là chìa khóa`,
    };
    summary = SUMMARY_LT[lang] || SUMMARY_LT['en'];
  }

  // rishi analysis phrase
  const RISHI_HI: Record<string,string> = {
    zh:'两者性质相近，默契天然。', en:'Similar natures — natural rapport from the start.',
    es:'Naturalezas similares — rapport natural desde el inicio.', fr:'Natures similaires — naturellement en phase dès le départ.',
    th:'ธัมย์ใกล้เคียงกัน — ความเข้าใจต่อกันอย่างเป็นธรรมชาติ', vi:'Bản chất tương đồng — ăn ý tự nhiên từ đầu',
  };
  const RISHI_MED: Record<string,string> = {
    zh:'性质不同但能互补，互相激发潜能。', en:"Different yet complementary — each brings out the other's potential.",
    es:'Diferentes pero complementarios — cada uno saca el potencial del otro.', fr:"Différents mais complémentaires — chacun libère le potentiel de l'autre.",
    th:'ต่างกันแต่เสริมกัน — ช่วยปลดปล่อยศักยภาพซึ่งกันและกัน', vi:'Khác nhau nhưng bổ trợ — mỗi người giúp đỡ phát huy tiềm năng của người kia',
  };
  const RISHI_LO: Record<string,string> = {
    zh:'性质差异较大，需要更多理解和磨合。', en:'Notable differences — requires more understanding and patience.',
    es:'Diferencias notables — requiere más comprensión y paciencia.', fr:'Différences notables — nécessite plus de compréhension et de patience.',
    th:'ความแตกต่างชัดเจน — ต้องเข้าใจและอดทนมากขึ้น', vi:'Khác biệt rõ ràng — cần thêm sự thấu hiểu và kiên nhẫn',
  };
  const rishiPhrase = rishiBase >= 80 ? (RISHI_HI[lang] || RISHI_HI['en']) :
    rishiBase >= 70 ? (RISHI_MED[lang] || RISHI_MED['en']) :
    (RISHI_LO[lang] || RISHI_LO['en']);

  // score phrase
  const SCORE_HI: Record<string,string> = {
    zh:'缘分深厚，珍惜彼此', en:'Deep bond — cherish each other',
    es:'Vínculo profundo — apreciense mutuamente', fr:'Lien profond — chérissez-vous mutuellement',
    th:'สายเชื่อมลึก — หวงแหนกัน', vi:'Duyên sâu sắc — trân trọng nhau',
  };
  const SCORE_MED: Record<string,string> = {
    zh:'基础良好，用心经营', en:'Solid foundation — nurture it',
    es:'Base sólida — cuídenla', fr:'Base solide — entretenez-la',
    th:'ฐานมั่นคง — ดูแลให้ดี', vi:'Nền tảng vững — chăm sóc thật tốt',
  };
  const SCORE_LO: Record<string,string> = {
    zh:'需要磨合，但值得努力', en:'Needs work, but worth the effort',
    es:'Requiere trabajo, pero vale la pena', fr:'Nécessite du travail, mais en vaut la peine',
    th:'ต้องปรับตัว แต่คุ้มค่าที่จะพยายาม', vi:'Cần điều chỉnh, nhưng đáng để cố gắng',
  };
  const scorePhrase = score >= 80 ? (SCORE_HI[lang] || SCORE_HI['en']) :
    score >= 65 ? (SCORE_MED[lang] || SCORE_MED['en']) :
    (SCORE_LO[lang] || SCORE_LO['en']);

  const labels = {
    sipanTitle: { zh:'四柱分析', en:'Four Pillars Analysis', es:'Análisis de los Cuatro Pilares', fr:'Analyse des Quatre Piliers', th:'การวิเคราะห์สี่เสาหลัก', vi:'Phân tích Tứ Trụ' },
    you: { zh:'你', en:'You', es:'Tú', fr:'Vous', th:'คุณ', vi:'Bạn' },
    ta: { zh:'对方', en:'Partner', es:'Tu pareja', fr:'Votre partenaire', th:'คู่ครอง', vi:'Đối phương' },
    yearPillar: { zh:'年柱', en:'Year Pillar', es:'Pilar del Año', fr:'Pilier de l\'Année', th:'เสาปี', vi:'Trụ Năm' },
    monthPillar: { zh:'月柱', en:'Month Pillar', es:'Pilar del Mes', fr:'Pilier du Mois', th:'เสาเดือน', vi:'Trụ Tháng' },
    dayPillar: { zh:'日柱', en:'Day Pillar', es:'Pilar del Día', fr:'Pilier du Jour', th:'เสาวัน', vi:'Trụ Ngày' },
    rishiTitle: { zh:'日主分析', en:'Day Master Analysis', es:'Análisis del Maestro del Día', fr:'Analyse du Maître du Jour', th:'การวิเคราะห์วัน', vi:'Phân tích Nhật Chủ' },
    hehunTitle: { zh:'合婚分析', en:'Marriage Compatibility', es:'Compatibilidad', fr:'Compatibilité', th:'การวิเคราะห์การสมรส', vi:'Phân tích Hợp Hôn' },
    scoreLabel: { zh:'综合评分', en:'Overall Score', es:'Puntuación Total', fr:'Score Global', th:'คะแนนรวม', vi:'Điểm Tổng' },
  };

  const detail = [
    `${labels.sipanTitle[lang]}`,
    `${labels.you[lang]}：${labels.yearPillar[lang]} ${tg(sz1.year[0])}${dz_(sz1.year[1])} ${labels.monthPillar[lang]} ${tg(sz1.month[0])}${dz_(sz1.month[1])} ${labels.dayPillar[lang]} ${tg(sz1.day[0])}${dz_(sz1.day[1])}`,
    `${labels.ta[lang]}：${labels.yearPillar[lang]} ${tg(sz2.year[0])}${dz_(sz2.year[1])} ${labels.monthPillar[lang]} ${tg(sz2.month[0])}${dz_(sz2.month[1])} ${labels.dayPillar[lang]} ${tg(sz2.day[0])}${dz_(sz2.day[1])}`,
    ``,
    `${labels.rishiTitle[lang]}`,
    `${BAZI_LABELS.detailYou[lang]} ${BAZI_LABELS.dayMaster[lang]} ${tg(sz1.dayMaster)}（${wx(TG_WUXING[sz1.dayMaster])}${lang === 'zh' ? '' : ' ' + BAZI_LABELS.element[lang]}），${BAZI_LABELS.detailTa[lang]} ${BAZI_LABELS.dayMaster[lang]} ${tg(sz2.dayMaster)}（${wx(TG_WUXING[sz2.dayMaster])}${lang === 'zh' ? '' : ' ' + BAZI_LABELS.element[lang]}）。${rishiPhrase}`,
    ...allDetails.length > 0 ? [`\n${labels.hehunTitle[lang]}`, ...allDetails] : [],
    `\n${labels.scoreLabel[lang]}：${score}/100 — ${scorePhrase}`,
  ].join('\n');

  return {
    score,
    title: { zh:'八字命理', en:'BaZi (Chinese Astrology)', es:'BaZi (Astrología China)', fr:'BaZi (Astrologie Chinoise)', th:'BaZi (โหราศาสตร์จีน)', vi:'BaZi (Tử Vi Trung Hoa)' },
    summary,
    detail,
  };
}
