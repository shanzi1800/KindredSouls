import type { BirthInfo, EngineResult } from './types';
import type { AlgLang } from './i18n';

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

export function calcZodiac(p1: BirthInfo, p2: BirthInfo, lang: AlgLang = 'zh'): EngineResult {
  const z1 = getZodiac(p1.month, p1.day);
  const z2 = getZodiac(p2.month, p2.day);

  // ── Pre-compute for i18n ──
  const elem1 = SIGN_ELEMENT[z1];
  const elem2 = SIGN_ELEMENT[z2];
  const mode1 = SIGN_MODE[z1];
  const mode2 = SIGN_MODE[z2];
  const ruler1 = SIGN_RULER[z1];
  const ruler2 = SIGN_RULER[z2];

// ── i18n helpers ──
  const ZODIAC_NAMES: Record<ZodiacSign, Record<string, string>> = {
    '白羊座': { zh:'白羊座', en:'Aries', es:'Aries', fr:'Bélier', th:'แกะ', vi:'Bạch Dương' },
    '金牛座': { zh:'金牛座', en:'Taurus', es:'Tauro', fr:'Taureau', th:'พันธุ์', vi:'Kim Ngưu' },
    '双子座': { zh:'双子座', en:'Gemini', es:'Géminis', fr:'Gémeaux', th:'คนคู่', vi:'Song Tử' },
    '巨蟹座': { zh:'巨蟹座', en:'Cancer', es:'Cáncer', fr:'Cancer', th:'ปู', vi:'Cự Giải' },
    '狮子座': { zh:'狮子座', en:'Leo', es:'Leo', fr:'Lion', th:'สิงโต', vi:'Sư Tử' },
    '处女座': { zh:'处女座', en:'Virgo', es:'Virgo', fr:'Vierge', th:'หญิงสาว', vi:'Xử Nữ' },
    '天秤座': { zh:'天秤座', en:'Libra', es:'Libra', fr:'Balance', th:'คันชั่ง', vi:'Thiên Xứng' },
    '天蝎座': { zh:'天蝎座', en:'Scorpio', es:'Escorpio', fr:'Scorpion', th:'แมงป่อง', vi:'Thiên Yết' },
    '射手座': { zh:'射手座', en:'Sagittarius', es:'Sagitario', fr:'Sagittaire', th:'นักธนู', vi:'Nhân Mã' },
    '摩羯座': { zh:'摩羯座', en:'Capricorn', es:'Capricornio', fr:'Capricorne', th:'แพะ', vi:'Ma Kết' },
    '水瓶座': { zh:'水瓶座', en:'Aquarius', es:'Acuario', fr:'Verseau', th:'ถังน้ำ', vi:'Bảo Bình' },
    '双鱼座': { zh:'双鱼座', en:'Pisces', es:'Piscis', fr:'Poissons', th:'ปลา', vi:'Song Ngư' },
  };
  const ELEM_NAMES: Record<string, Record<string, string>> = {
    '火': { zh:'火', en:'Fire', es:'Fuego', fr:'Feu', th:'ไฟ', vi:'Hỏa' },
    '土': { zh:'土', en:'Earth', es:'Tierra', fr:'Terre', th:'ดิน', vi:'Thổ' },
    '风': { zh:'风', en:'Air', es:'Aire', fr:'Air', th:'ลม', vi:'Phong' },
    '水': { zh:'水', en:'Water', es:'Agua', fr:'Eau', th:'น้ำ', vi:'Thủy' },
  };
  const MODE_NAMES: Record<string, Record<string, string>> = {
    '本位': { zh:'本位', en:'Cardinal', es:'Cardinal', fr:'Cardinal', th:'ดาวเคราะห์', vi:'Cương' },
    '固定': { zh:'固定', en:'Fixed', es:'Fijo', fr:'Fixe', th:'คงที่', vi:'Cố Định' },
    '变动': { zh:'变动', en:'Mutable', es:'Mutable', fr:'Mutable', th:'เปลี่ยนแปลง', vi:'Biến Đổi' },
  };
  const RULER_NAMES: Record<string, Record<string, string>> = {
    '火星': { zh:'火星', en:'Mars', es:'Marte', fr:'Mars', th:'ดาวอังคาร', vi:'Hỏa Tinh' },
    '金星': { zh:'金星', en:'Venus', es:'Venus', fr:'Vénus', th:'ดาวศุกร์', vi:'Kim Tinh' },
    '水星': { zh:'水星', en:'Mercury', es:'Mercurio', fr:'Mercure', th:'ดาวพุธ', vi:'Thủy Tinh' },
    '月亮': { zh:'月亮', en:'Moon', es:'Luna', fr:'Lune', th:'ดวงจันทร์', vi:'Nguyệt Tinh' },
    '太阳': { zh:'太阳', en:'Sun', es:'Sol', fr:'Soleil', th:'ดวงอาทิตย์', vi:'Nhật Tinh' },
    '木星': { zh:'木星', en:'Jupiter', es:'Júpiter', fr:'Jupiter', th:'ดาวพฤหัส', vi:'Mộc Tinh' },
    '土星': { zh:'土星', en:'Saturn', es:'Saturno', fr:'Saturne', th:'ดาวเสาร์', vi:'Thổ Tinh' },
    '天王星': { zh:'天王星', en:'Uranus', es:'Urano', fr:'Uranus', th:'ดาวยูเรนัส', vi:'Thiên Vương' },
    '海王星': { zh:'海王星', en:'Neptune', es:'Neptuno', fr:'Neptune', th:'ดาวเนปจูน', vi:'Hải Vương' },
    '冥王星': { zh:'冥王星', en:'Pluto', es:'Plutón', fr:'Pluton', th:'ดาวพลูโต', vi:'Minh Vương' },
  };
  const z1Name = ZODIAC_NAMES[z1]?.[lang] || ZODIAC_NAMES[z1]?.['en'] || z1;
  const z2Name = ZODIAC_NAMES[z2]?.[lang] || ZODIAC_NAMES[z2]?.['en'] || z2;
  const elem1Name = ELEM_NAMES[elem1]?.[lang] || elem1;
  const elem2Name = ELEM_NAMES[elem2]?.[lang] || elem2;
  const mode1Name = MODE_NAMES[mode1]?.[lang] || mode1;
  const mode2Name = MODE_NAMES[mode2]?.[lang] || mode2;
  const ruler1Name = RULER_NAMES[ruler1]?.[lang] || ruler1;
  const ruler2Name = RULER_NAMES[ruler2]?.[lang] || ruler2;



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
    phaseDesc = lang === 'zh' ? '同星座（0°合相），彼此深度理解，但也容易放大相同弱点' :
      lang === 'en' ? 'Same sign (0° conjunction) — deep mutual understanding, but can amplify shared weaknesses' :
      lang === 'es' ? 'Mismo signo (0° conjunción) — comprensión mutua profunda, pero puede amplificar debilidades compartidas' :
      'Même signe (0° conjonction) — compréhension mutuelle profonde, mais peut amplifier les faiblesses partagées',
      th: '相同座（0°合相）— ความเข้าใจซึ่งกันและกันลึกซึ้ง แต่อาจขยายจุดอ่อนเดียวกัน',
      vi: 'Cùng cung (0° hợp) — hiểu nhau sâu sắc nhưng có thể làm trầm trọng điểm yếu chung';
  } else if (phaseDist === 6) {
    // 对宫（180°冲相）
    phaseScore = 58;
    phaseDesc = lang === 'zh' ? `对宫相位（${z1} ↔ ${z2}），吸引力极强但需平衡差异` :
      lang === 'en' ? `Opposition (${z1Name} ↔ ${z2Name}) — intense attraction but requires balancing differences` :
      lang === 'es' ? `Oposición (${z1Name} ↔ ${z2Name}) — atracción intensa pero requiere equilibrar diferencias` :
      `Opposition (${z1Name} ↔ ${z2Name}) — attraction intense mais nécessite d'équilibrer les différences`;
  } else if (phaseDist === 3 || phaseDist === 9) {
    // 四分相（90°）
    const isSquare = SQUARES[z1] === z2 || Object.values(SQUARES).includes(z1);
    if (isSquare || phaseDist === 3) {
      phaseScore = 62;
      phaseDesc = lang === 'zh' ? `四分相位（${z1} □ ${z2}），存在成长张力，磨合后更稳固` :
      lang === 'en' ? `Square (${z1Name} □ ${z2Name}) — growth tension exists, more solid after adjustment` :
      lang === 'es' ? `Cuadratura (${z1Name} □ ${z2Name}) — existe tensión de crecimiento, más sólido tras ajuste` :
      `Carré (${z1Name} □ ${z2Name}) — tension de croissance existe, plus solide après ajustement`;
    } else {
      // 三分相（120°）
      phaseScore = 82;
      phaseDesc = lang === 'zh' ? `三分相位（${z1} △ ${z2}），能量和谐流动，轻松愉快` :
      lang === 'en' ? `Trine (${z1Name} △ ${z2Name}) — energy flows harmoniously, relaxed and pleasant` :
      lang === 'es' ? `Trígono (${z1Name} △ ${z2Name}) — energía fluye armoniosamente, relajado y agradable` :
      `Trigone (${z1Name} △ ${z2Name}) — énergie circule harmonieusement, détendu et agréable`;
    }
  } else if (phaseDist === 4 || phaseDist === 8) {
    // 三分相（120°）
    phaseScore = 82;
    phaseDesc = lang === 'zh' ? `三分相位（${z1} △ ${z2}），能量和谐流动，轻松愉快` :
      lang === 'en' ? `Trine (${z1Name} △ ${z2Name}) — energy flows harmoniously, relaxed and pleasant` :
      lang === 'es' ? `Trígono (${z1Name} △ ${z2Name}) — energía fluye armoniosamente, relajado y agradable` :
      `Trigone (${z1Name} △ ${z2Name}) — énergie circule harmonieusement, détendu et agréable`;
  } else if (phaseDist === 2 || phaseDist === 10) {
    // 六分相（60°）
    phaseScore = 76;
    phaseDesc = lang === 'zh' ? `六分相位（${z1} ⚹ ${z2}），机缘巧合多，合作顺利` :
      lang === 'en' ? `Sextile (${z1Name} ⚹ ${z2Name}) — many coincidences, cooperation goes smoothly` :
      lang === 'es' ? `Sextil (${z1Name} ⚹ ${z2Name}) — muchas coincidencias, cooperación fluye suavemente` :
      `Sextile (${z1Name} ⚹ ${z2Name}) — beaucoup de coïncidences, coopération se déroule sans accroc`;
  } else {
    // 其他距离（30°/150°）
    phaseScore = 68;
    phaseDesc = lang === 'zh' ? `特殊相位（角度差${phaseDist * 30}°），有独特吸引力` :
      lang === 'en' ? `Special aspect (${phaseDist * 30}° apart) — unique attraction` :
      lang === 'es' ? `Aspecto especial (a ${phaseDist * 30}°), atracción única` :
      `Aspect spécial (à ${phaseDist * 30}°), attraction unique`;
  }

  // ── 3. 元素和谐度 ──
  let elementBonus = 0;
  let elementDesc = '';

  if (elem1 === elem2) {
    elementBonus = 5;
    elementDesc = lang === 'zh' ? `同属${elem1}象，价值观底层一致，但可能缺乏新鲜刺激` :
      lang === 'en' ? `Both ${elem1Name} — core values align, but may lack fresh stimulation` :
      lang === 'es' ? `Ambos ${elem1Name} — valores centrales alinean, pero puede faltar estímulo fresco` :
      `Tous deux ${elem1Name} — valeurs de base alignment, mais peut manquer stimulation fraîche`;
  } else {
    // 检查元素相生关系
    const SHENG_MAP: Record<string, string> = { '火': '土', '土': '金', '金': '水', '水': '木', '木': '火' };
    if (SHENG_MAP[elem1] === elem2 || SHENG_MAP[elem2] === elem1) {
      elementBonus = 8;
      elementDesc = lang === 'zh' ? `${elem1}与${elem2}相生，天然互补，互相滋养` :
      lang === 'en' ? `${elem1Name} and ${elem2Name} nurture each other — natural complement, mutual nourishment` :
      lang === 'es' ? `${elem1Name} y ${elem2Name} se nutren mutuamente — complemento natural, nutrición mutua` :
      `${elem1Name} et ${elem2Name} se nourrissent mutuellement — complément naturel, nourishment mutuel`;
    } else {
      elementBonus = 3;
      elementDesc = lang === 'zh' ? `${elem1}与${elem2}不同象，差异带来成长空间` :
      lang === 'en' ? `${elem1Name} and ${elem2Name} differ — differences create growth space` :
      lang === 'es' ? `${elem1Name} y ${elem2Name} difieren — las diferencias crean espacio de crecimiento` :
      `${elem1Name} et ${elem2Name} diffèrent — les différences créent espace de croissance`;
    }
  }

  // ── 4. 模式和谐度 ──
  let modeBonus = 0;
  if (mode1 === mode2) modeBonus = 4; // 同模式=理解对方行为模式
  else modeBonus = 2; // 不同模式=互补

  // ── 5. 守护星互动 ──


  // 基础45% + 相位30% + 元素15% + 模式10%

  // ── 综合评分 ──
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
    summary = lang === 'zh' ? `${z1}与${z2}的配置堪称黄金配对，星星都在为你们让路。` :
      lang === 'en' ? `${z1Name} and ${z2Name} form a golden pairing — the stars align for you both.` :
      lang === 'es' ? `${z1Name} y ${z2Name} forman un par dorado — las estrellas se alinean para ambos.` :
      `${z1Name} et ${z2Name} forment un couple doré — les étoiles s'alignent pour vous deux.`;
  } else if (score >= 70) {
    summary = lang === 'zh' ? `${z1}（你）遇上${z2}（TA），星座能量形成有趣的化学反应。` :
      lang === 'en' ? `${z1Name} (you) meets ${z2Name} (partner) — cosmic energies spark fascinating chemistry.` :
      lang === 'es' ? `${z1Name} (tú) encuentra ${z2Name} (pareja) — las energías cósmicas crean química fascinante.` :
      `${z1Name} (vous) rencontre ${z2Name} (partenaire) — les énergies cosmiques créent une chimie fascinante.`;
  } else if (score >= 58) {
    summary = lang === 'zh' ? `${z1}与${z2}的组合需要更多理解，但差异正是吸引力的来源。` :
      lang === 'en' ? `${z1Name} and ${z2Name} need more understanding, but differences fuel attraction.` :
      lang === 'es' ? `${z1Name} y ${z2Name} necesitan más comprensión, pero las diferencias alimentan la atracción.` :
      `${z1Name} et ${z2Name} nécessitent plus de compréhension, mais les différences alimentent l'attraction.`;
  } else {
    summary = lang === 'zh' ? `对宫相遇，强烈的对立感背后是等量的吸引力。` :
      lang === 'en' ? `Opposing signs meet — strong polarity hides equal attraction.` :
      lang === 'es' ? `Signos opuestos se encuentran — fuerte polaridad esconde igual atracción.` :
      `Signes opposés se rencontrent — forte polarité cache une égale attraction.`;
  }

  const labels = {
    sunSign: { zh:'【太阳星座】', en:'[Sun Sign]', es:'[Signo Solar]', fr:'[Signe Solaire]', th:'[ราศีอาทิตย์]', vi:'[Mặt Trời]' },
    you: { zh:'你', en:'You', es:'Tú', fr:'Vous', th:'คุณ', vi:'Bạn' },
    ta: { zh:'TA', en:'Partner', es:'Pareja', fr:'Partenaire', th:'คู่ครอง', vi:'Đối phương' },
    element: { zh:'象', en:'element', es:'elemento', fr:'élément', th:'ธาตุ', vi:'nguyên tố' },
    ruler: { zh:'守护星', en:'ruler', es:'regente', fr:'maître', th:'ดาวพิทักษ์', vi:'sao bảo hộ' },
    phaseTitle: { zh:'【相位分析】', en:'[Aspect Analysis]', es:'[Análisis de Aspecto]', fr:'[Analyse d\'Aspect]', th:'[การวิเคราะห์มุม]', vi:'[Phân tích Góc]' },
    elemTitle: { zh:'【元素互动】', en:'[Element Interaction]', es:'[Interacción Elemental]', fr:'[Interaction Élémentaire]', th:'[ปฏิสัมพันธ์ธาตุ]', vi:'[Tương tác Nguyên tố]' },
    rulerTitle: { zh:'【守护星互动】', en:'[Ruler Interaction]', es:'[Interacción Regente]', fr:'[Interaction Maître]', th:'[ปฏิสัมพันธ์ดาวพิทักษ์]', vi:'[Tương tác Sao Bảo Hộ]' },
    bestMatch: { zh:'${z1}与${z2}在经典配对表中属于最佳组合之一', en:'${z1Name} and ${z2Name} are one of the classic best matches', es:'${z1Name} y ${z2Name} son una de las mejores parejas clásicas', fr:'${z1Name} et ${z2Name} forment un des meilleurs couples classiques', th:'${z1Name} และ ${z2Name} เป็นหนึ่งในคู่ที่เข้ากันได้ดีที่สุดแบบคลาสสิก', vi:'${z1Name} và ${z2Name} là một trong những cặp đôi hoàn hảo kinh điển' },
    opposite: { zh:'${z1}与${z2}互为对宫，吸引力与挑战并存', en:'${z1Name} and ${z2Name} are opposite signs — attraction meets challenge', es:'${z1Name} y ${z2Name} son signos opuestos — atracción encuentra desafío', fr:'${z1Name} et ${z2Name} sont des signes opposés — l\'attraction rencontre le défi', th:'${z1Name} และ ${z2Name} เป็นราศีตรงข้ามกัน — แรงดึงดูดพบกับความท้าทาย', vi:'${z1Name} và ${z2Name} là cung đối nghịch — hấp dẫn gặp thách thức' },
    unique: lang === 'zh' ? `${z1}与${z2}构成独特配置，不走寻常路` : lang === 'en' ? `${z1Name} and ${z2Name} form a unique configuration — not the usual path` : lang === 'es' ? `${z1Name} y ${z2Name} forman una configuración única — no es el camino usual` : `${z1Name} et ${z2Name} forment une configuration unique — pas le chemin habituel`,
    scoreLabel: { zh:'综合评分', en:'Overall Score', es:'Puntuación General', fr:'Score Global', th:'คะแนนรวม', vi:'Điểm tổng' },
    scoreHigh: { zh:'星辰为证，缘分深厚', en:'Stars bear witness — deep connection', es:'Las estrellas atestiguan — conexión profunda', fr:'Les étoiles en témoignent — connexion profonde', th:'ดวงดาวเป็นพยาน — ความเชื่อมโยงลึกซึ้ง', vi:'Các vì sao làm chứng — kết nối sâu sắc' },
    scoreMid: { zh:'星光指引，值得期待', en:'Starlight guides — something to look forward to', es:'La luz de las estrellas guía — algo que esperar', fr:'La lumière des étoiles guide — à attendre', th:'แสงดาวนำทาง — มีสิ่งที่ต้องตั้งตารอคอย', vi:'Ánh sao dẫn lối — có điều đáng để trông chờ' },
    scoreLow: { zh:'星途虽有挑战，携手可越', en:'Starry path has challenges — together you can overcome', es:'El camino estelar tiene desafíos — juntos pueden superar', fr:'Le chemin étoilé a des défis — ensemble vous pouvez surmonter', th:'เส้นทางดวงดาวมีความท้าทาย — ร่วมกันเราสามารถผ่านพ้น', vi:'Con đường sao có thử thách — cùng nhau vượt qua được' },
  };

  const detail = [
    `${labels.sunSign}`,
    `${labels.you}：${z1Name}（${p1.month}/${p1.day}）— ${elem1Name} ${labels.element} · ${mode1Name} · ${labels.ruler} ${ruler1Name}`,
    `${labels.ta}：${z2Name}（${p2.month}/${p2.day}）— ${elem2Name} ${labels.element} · ${mode2Name} · ${labels.ruler} ${ruler2Name}`,
    ``,
    `${labels.phaseTitle}`,
    phaseDesc,
    ``,
    `${labels.elemTitle}`,
    elementDesc,
    ``,
    `${labels.rulerTitle}`,
    `${z1Name} ${labels.ruler} ${ruler1Name} meets ${z2Name} ${labels.ruler} ${ruler2Name}`,
    ``,
    isBestMatch ? `✨ ${labels.bestMatch}` : OPPOSITES[z1] === z2 ? `⚡ ${labels.opposite}` : `◆ ${labels.unique}`,
    `\n${labels.scoreLabel}：${score}/100 — ${score >= 80 ? labels.scoreHigh : score >= 65 ? labels.scoreMid : labels.scoreLow}`,
  ].join('\n');

  return {
    score,
    title: { zh:'西方星座', en:'Western Zodiac', es:'Zodiaco Occidental', fr:'Zodiaque Occidental', th:'ดวงชะตาราศี', vi:'Tử Vi (Chiêm tinh học phương Tây)' },
    summary,
    detail,
  };
}
