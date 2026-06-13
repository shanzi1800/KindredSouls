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
  const zEn: Record<ZodiacSign, string> = {
    '白羊座': 'Aries', '金牛座': 'Taurus', '双子座': 'Gemini', '巨蟹座': 'Cancer',
    '狮子座': 'Leo', '处女座': 'Virgo', '天秤座': 'Libra', '天蝎座': 'Scorpio',
    '射手座': 'Sagittarius', '摩羯座': 'Capricorn', '水瓶座': 'Aquarius', '双鱼座': 'Pisces',
  };
  const zEs: Record<ZodiacSign, string> = {
    '白羊座': 'Aries', '金牛座': 'Tauro', '双子座': 'Géminis', '巨蟹座': 'Cáncer',
    '狮子座': 'Leo', '处女座': 'Virgo', '天秤座': 'Libra', '天蝎座': 'Escorpio',
    '射手座': 'Sagitario', '摩羯座': 'Capricornio', '水瓶座': 'Acuario', '双鱼座': 'Piscis',
  };
  const zFr: Record<ZodiacSign, string> = {
    '白羊座': 'Bélier', '金牛座': 'Taureau', '双子座': 'Gémeaux', '巨蟹座': 'Cancer',
    '狮子座': 'Lion', '处女座': 'Vierge', '天秤座': 'Balance', '天蝎座': 'Scorpion',
    '射手座': 'Sagittaire', '摩羯座': 'Capricorne', '水瓶座': 'Verseau', '双鱼座': 'Poissons',
  };
  const z1En = lang === 'en' ? zEn[z1] : lang === 'es' ? zEs[z1] : lang === 'fr' ? zFr[z1] : z1;
  const z2En = lang === 'en' ? zEn[z2] : lang === 'es' ? zEs[z2] : lang === 'fr' ? zFr[z2] : z2;

  const eEn: Record<string, string> = { '火': 'Fire', '土': 'Earth', '风': 'Air', '水': 'Water' };
  const eEs: Record<string, string> = { '火': 'Fuego', '土': 'Tierra', '风': 'Aire', '水': 'Agua' };
  const eFr: Record<string, string> = { '火': 'Feu', '土': 'Terre', '风': 'Air', '水': 'Eau' };
  const elem1En = lang === 'en' ? eEn[elem1] : lang === 'es' ? eEs[elem1] : lang === 'fr' ? eFr[elem1] : elem1;
  const elem2En = lang === 'en' ? eEn[elem2] : lang === 'es' ? eEs[elem2] : lang === 'fr' ? eFr[elem2] : elem2;

  const modeEn: Record<string, string> = { '本位': 'Cardinal', '固定': 'Fixed', '变动': 'Mutable' };
  const modeEs: Record<string, string> = { '本位': 'Cardinal', '固定': 'Fijo', '变动': 'Mutable' };
  const modeFr: Record<string, string> = { '本位': 'Cardinal', '固定': 'Fixe', '变动': 'Mutable' };
  const mode1En = lang === 'en' ? modeEn[mode1] : lang === 'es' ? modeEs[mode1] : lang === 'fr' ? modeFr[mode1] : mode1;
  const mode2En = lang === 'en' ? modeEn[mode2] : lang === 'es' ? modeEs[mode2] : lang === 'fr' ? modeFr[mode2] : mode2;

  const rulerEn: Record<string, string> = {
    '火星': 'Mars', '金星': 'Venus', '水星': 'Mercury', '月亮': 'Moon', '太阳': 'Sun',
    '木星': 'Jupiter', '土星': 'Saturn', '天王星': 'Uranus', '海王星': 'Neptune', '冥王星': 'Pluto',
  };
  const rulerEs: Record<string, string> = {
    '火星': 'Marte', '金星': 'Venus', '水星': 'Mercurio', '月亮': 'Luna', '太阳': 'Sol',
    '木星': 'Júpiter', '土星': 'Saturno', '天王星': 'Urano', '海王星': 'Neptuno', '冥王星': 'Plutón',
  };
  const rulerFr: Record<string, string> = {
    '火星': 'Mars', '金星': 'Vénus', '水星': 'Mercure', '月亮': 'Lune', '太阳': 'Soleil',
    '木星': 'Jupiter', '土星': 'Saturne', '天王星': 'Uranus', '海王星': 'Neptune', '冥王星': 'Pluton',
  };
  const ruler1En = lang === 'en' ? rulerEn[ruler1] : lang === 'es' ? rulerEs[ruler1] : lang === 'fr' ? rulerFr[ruler1] : ruler1;
  const ruler2En = lang === 'en' ? rulerEn[ruler2] : lang === 'es' ? rulerEs[ruler2] : lang === 'fr' ? rulerFr[ruler2] : ruler2;



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
      'Même signe (0° conjonction) — compréhension mutuelle profonde, mais peut amplifier les faiblesses partagées';
  } else if (phaseDist === 6) {
    // 对宫（180°冲相）
    phaseScore = 58;
    phaseDesc = lang === 'zh' ? `对宫相位（${z1} ↔ ${z2}），吸引力极强但需平衡差异` :
      lang === 'en' ? `Opposition (${z1En} ↔ ${z2En}) — intense attraction but requires balancing differences` :
      lang === 'es' ? `Oposición (${z1En} ↔ ${z2En}) — atracción intensa pero requiere equilibrar diferencias` :
      `Opposition (${z1En} ↔ ${z2En}) — attraction intense mais nécessite d'équilibrer les différences`;
  } else if (phaseDist === 3 || phaseDist === 9) {
    // 四分相（90°）
    const isSquare = SQUARES[z1] === z2 || Object.values(SQUARES).includes(z1);
    if (isSquare || phaseDist === 3) {
      phaseScore = 62;
      phaseDesc = lang === 'zh' ? `四分相位（${z1} □ ${z2}），存在成长张力，磨合后更稳固` :
      lang === 'en' ? `Square (${z1En} □ ${z2En}) — growth tension exists, more solid after adjustment` :
      lang === 'es' ? `Cuadratura (${z1En} □ ${z2En}) — existe tensión de crecimiento, más sólido tras ajuste` :
      `Carré (${z1En} □ ${z2En}) — tension de croissance existe, plus solide après ajustement`;
    } else {
      // 三分相（120°）
      phaseScore = 82;
      phaseDesc = lang === 'zh' ? `三分相位（${z1} △ ${z2}），能量和谐流动，轻松愉快` :
      lang === 'en' ? `Trine (${z1En} △ ${z2En}) — energy flows harmoniously, relaxed and pleasant` :
      lang === 'es' ? `Trígono (${z1En} △ ${z2En}) — energía fluye armoniosamente, relajado y agradable` :
      `Trigone (${z1En} △ ${z2En}) — énergie circule harmonieusement, détendu et agréable`;
    }
  } else if (phaseDist === 4 || phaseDist === 8) {
    // 三分相（120°）
    phaseScore = 82;
    phaseDesc = lang === 'zh' ? `三分相位（${z1} △ ${z2}），能量和谐流动，轻松愉快` :
      lang === 'en' ? `Trine (${z1En} △ ${z2En}) — energy flows harmoniously, relaxed and pleasant` :
      lang === 'es' ? `Trígono (${z1En} △ ${z2En}) — energía fluye armoniosamente, relajado y agradable` :
      `Trigone (${z1En} △ ${z2En}) — énergie circule harmonieusement, détendu et agréable`;
  } else if (phaseDist === 2 || phaseDist === 10) {
    // 六分相（60°）
    phaseScore = 76;
    phaseDesc = lang === 'zh' ? `六分相位（${z1} ⚹ ${z2}），机缘巧合多，合作顺利` :
      lang === 'en' ? `Sextile (${z1En} ⚹ ${z2En}) — many coincidences, cooperation goes smoothly` :
      lang === 'es' ? `Sextil (${z1En} ⚹ ${z2En}) — muchas coincidencias, cooperación fluye suavemente` :
      `Sextile (${z1En} ⚹ ${z2En}) — beaucoup de coïncidences, coopération se déroule sans accroc`;
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
      lang === 'en' ? `Both ${elem1En} — core values align, but may lack fresh stimulation` :
      lang === 'es' ? `Ambos ${elem1En} — valores centrales alinean, pero puede faltar estímulo fresco` :
      `Tous deux ${elem1En} — valeurs de base alignment, mais peut manquer stimulation fraîche`;
  } else {
    // 检查元素相生关系
    const SHENG_MAP: Record<string, string> = { '火': '土', '土': '金', '金': '水', '水': '木', '木': '火' };
    if (SHENG_MAP[elem1] === elem2 || SHENG_MAP[elem2] === elem1) {
      elementBonus = 8;
      elementDesc = lang === 'zh' ? `${elem1}与${elem2}相生，天然互补，互相滋养` :
      lang === 'en' ? `${elem1En} and ${elem2En} nurture each other — natural complement, mutual nourishment` :
      lang === 'es' ? `${elem1En} y ${elem2En} se nutren mutuamente — complemento natural, nutrición mutua` :
      `${elem1En} et ${elem2En} se nourrissent mutuellement — complément naturel, nourishment mutuel`;
    } else {
      elementBonus = 3;
      elementDesc = lang === 'zh' ? `${elem1}与${elem2}不同象，差异带来成长空间` :
      lang === 'en' ? `${elem1En} and ${elem2En} differ — differences create growth space` :
      lang === 'es' ? `${elem1En} y ${elem2En} difieren — las diferencias crean espacio de crecimiento` :
      `${elem1En} et ${elem2En} diffèrent — les différences créent espace de croissance`;
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
      lang === 'en' ? `${z1En} and ${z2En} form a golden pairing — the stars align for you both.` :
      lang === 'es' ? `${z1En} y ${z2En} forman un par dorado — las estrellas se alinean para ambos.` :
      `${z1En} et ${z2En} forment un couple doré — les étoiles s'alignent pour vous deux.`;
  } else if (score >= 70) {
    summary = lang === 'zh' ? `${z1}（你）遇上${z2}（TA），星座能量形成有趣的化学反应。` :
      lang === 'en' ? `${z1En} (you) meets ${z2En} (partner) — cosmic energies spark fascinating chemistry.` :
      lang === 'es' ? `${z1En} (tú) encuentra ${z2En} (pareja) — las energías cósmicas crean química fascinante.` :
      `${z1En} (vous) rencontre ${z2En} (partenaire) — les énergies cosmiques créent une chimie fascinante.`;
  } else if (score >= 58) {
    summary = lang === 'zh' ? `${z1}与${z2}的组合需要更多理解，但差异正是吸引力的来源。` :
      lang === 'en' ? `${z1En} and ${z2En} need more understanding, but differences fuel attraction.` :
      lang === 'es' ? `${z1En} y ${z2En} necesitan más comprensión, pero las diferencias alimentan la atracción.` :
      `${z1En} et ${z2En} nécessitent plus de compréhension, mais les différences alimentent l'attraction.`;
  } else {
    summary = lang === 'zh' ? `对宫相遇，强烈的对立感背后是等量的吸引力。` :
      lang === 'en' ? `Opposing signs meet — strong polarity hides equal attraction.` :
      lang === 'es' ? `Signos opuestos se encuentran — fuerte polaridad esconde igual atracción.` :
      `Signes opposés se rencontrent — forte polarité cache une égale attraction.`;
  }

  const labels = {
    sunSign: lang === 'zh' ? '【太阳星座】' : lang === 'en' ? '[Sun Sign]' : lang === 'es' ? '[Signo Solar]' : '[Signe Solaire]',
    you: lang === 'zh' ? '你' : lang === 'en' ? 'You' : lang === 'es' ? 'Tú' : 'Vous',
    ta: lang === 'zh' ? 'TA' : lang === 'en' ? 'Partner' : lang === 'es' ? 'Pareja' : 'Partenaire',
    element: lang === 'zh' ? '象' : lang === 'en' ? 'element' : lang === 'es' ? 'elemento' : 'élément',
    ruler: lang === 'zh' ? '守护星' : lang === 'en' ? 'ruler' : lang === 'es' ? 'regente' : 'maître',
    phaseTitle: lang === 'zh' ? '【相位分析】' : lang === 'en' ? '[Aspect Analysis]' : lang === 'es' ? '[Análisis de Aspecto]' : '[Analyse d\'Aspect]',
    elemTitle: lang === 'zh' ? '【元素互动】' : lang === 'en' ? '[Element Interaction]' : lang === 'es' ? '[Interacción Elemental]' : '[Interaction Élémentaire]',
    rulerTitle: lang === 'zh' ? '【守护星互动】' : lang === 'en' ? '[Ruler Interaction]' : lang === 'es' ? '[Interacción Regente]' : '[Interaction Maître]',
    bestMatch: lang === 'zh' ? `${z1}与${z2}在经典配对表中属于最佳组合之一` : lang === 'en' ? `${z1En} and ${z2En} are one of the classic best matches` : lang === 'es' ? `${z1En} y ${z2En} son una de las mejores parejas clásicas` : `${z1En} et ${z2En} forment un des meilleurs couples classiques`,
    opposite: lang === 'zh' ? `${z1}与${z2}互为对宫，吸引力与挑战并存` : lang === 'en' ? `${z1En} and ${z2En} are opposite signs — attraction meets challenge` : lang === 'es' ? `${z1En} y ${z2En} son signos opuestos — atracción encuentra desafío` : `${z1En} et ${z2En} sont des signes opposés — l'attraction rencontre le défi`,
    unique: lang === 'zh' ? `${z1}与${z2}构成独特配置，不走寻常路` : lang === 'en' ? `${z1En} and ${z2En} form a unique configuration — not the usual path` : lang === 'es' ? `${z1En} y ${z2En} forman una configuración única — no es el camino usual` : `${z1En} et ${z2En} forment une configuration unique — pas le chemin habituel`,
    scoreLabel: lang === 'zh' ? '综合评分' : lang === 'en' ? 'Overall Score' : lang === 'es' ? 'Puntuación General' : 'Score Global',
    scoreHigh: lang === 'zh' ? '星辰为证，缘分深厚' : lang === 'en' ? 'Stars bear witness — deep connection' : lang === 'es' ? 'Las estrellas atestiguan — conexión profunda' : 'Les étoiles en témoignent — connexion profonde',
    scoreMid: lang === 'zh' ? '星光指引，值得期待' : lang === 'en' ? 'Starlight guides — something to look forward to' : lang === 'es' ? 'La luz de las estrellas guía — algo que esperar' : 'La lumière des étoiles guide — à attendre',
    scoreLow: lang === 'zh' ? '星途虽有挑战，携手可越' : lang === 'en' ? 'Starry path has challenges — together you can overcome' : lang === 'es' ? 'El camino estelar tiene desafíos — juntos pueden superar' : 'Le chemin étoilé a des défis — ensemble vous pouvez surmonter',
  };

  const detail = [
    `${labels.sunSign}`,
    `${labels.you}：${z1En}（${p1.month}/${p1.day}）— ${elem1En} ${labels.element} · ${mode1En} · ${labels.ruler} ${ruler1En}`,
    `${labels.ta}：${z2En}（${p2.month}/${p2.day}）— ${elem2En} ${labels.element} · ${mode2En} · ${labels.ruler} ${ruler2En}`,
    ``,
    `${labels.phaseTitle}`,
    phaseDesc,
    ``,
    `${labels.elemTitle}`,
    elementDesc,
    ``,
    `${labels.rulerTitle}`,
    `${z1En} ${labels.ruler} ${ruler1En} meets ${z2En} ${labels.ruler} ${ruler2En}`,
    ``,
    isBestMatch ? `✨ ${labels.bestMatch}` : OPPOSITES[z1] === z2 ? `⚡ ${labels.opposite}` : `◆ ${labels.unique}`,
    `\n${labels.scoreLabel}：${score}/100 — ${score >= 80 ? labels.scoreHigh : score >= 65 ? labels.scoreMid : labels.scoreLow}`,
  ].join('\n');

  return {
    score,
    title: lang === 'zh' ? '西方星座' : lang === 'en' ? 'Western Zodiac' : lang === 'es' ? 'Zodiaco Occidental' : 'Zodiaque Occidental',
    summary,
    detail,
  };
}
