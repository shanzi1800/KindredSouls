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

// ═════════════════════════════════════════
// 🌍 i18n 字典（军师方案：算法与文案解耦）
// ═════════════════════════════════════════

type LangKey = 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';

/** 获取翻译，fallback 到英文 */
function t(dict: Record<LangKey, string>, lang: AlgLang): string {
  return dict[lang as LangKey] || dict['en'];
}

// ── 星座名 ──
const ZODIAC_NAMES: Record<ZodiacSign, Record<LangKey, string>> = {
  '白羊座': { zh: '白羊座', en: 'Aries', es: 'Aries', fr: 'Bélier', th: 'เมษ', vi: 'Bạch Dương' },
  '金牛座': { zh: '金牛座', en: 'Taurus', es: 'Tauro', fr: 'Taureau', th: 'พฤษภ', vi: 'Kim Ngưu' },
  '双子座': { zh: '双子座', en: 'Gemini', es: 'Géminis', fr: 'Gémeaux', th: 'เมถุน', vi: 'Song Tử' },
  '巨蟹座': { zh: '巨蟹座', en: 'Cancer', es: 'Cáncer', fr: 'Cancer', th: 'กรกฎ', vi: 'Cự Giải' },
  '狮子座': { zh: '狮子座', en: 'Leo', es: 'Leo', fr: 'Lion', th: 'สิงห์', vi: 'Sư Tử' },
  '处女座': { zh: '处女座', en: 'Virgo', es: 'Virgo', fr: 'Vierge', th: 'กันย์', vi: 'Xử Nữ' },
  '天秤座': { zh: '天秤座', en: 'Libra', es: 'Libra', fr: 'Balance', th: 'ตุลย์', vi: 'Thiên Bình' },
  '天蝎座': { zh: '天蝎座', en: 'Scorpio', es: 'Escorpio', fr: 'Scorpion', th: 'พิจิก', vi: 'Bọ Cạp' },
  '射手座': { zh: '射手座', en: 'Sagittarius', es: 'Sagitario', fr: 'Sagittaire', th: 'ธนู', vi: 'Nhân Mã' },
  '摩羯座': { zh: '摩羯座', en: 'Capricorn', es: 'Capricornio', fr: 'Capricorne', th: 'มังกร', vi: 'Ma Kết' },
  '水瓶座': { zh: '水瓶座', en: 'Aquarius', es: 'Acuario', fr: 'Verseau', th: 'กุมภ์', vi: 'Bảo Bình' },
  '双鱼座': { zh: '双鱼座', en: 'Pisces', es: 'Piscis', fr: 'Poissons', th: 'มีน', vi: 'Song Ngư' },
};

// ── 元素名 ──
const ELEMENT_NAMES: Record<string, Record<LangKey, string>> = {
  '火': { zh: '火象', en: 'Fire', es: 'Fuego', fr: 'Feu', th: 'ธาตุไฟ', vi: 'Hỏa' },
  '土': { zh: '土象', en: 'Earth', es: 'Tierra', fr: 'Terre', th: 'ธาตุดิน', vi: 'Thổ' },
  '风': { zh: '风象', en: 'Air', es: 'Aire', fr: 'Air', th: 'ธาตุลม', vi: 'Phong' },
  '水': { zh: '水象', en: 'Water', es: 'Agua', fr: 'Eau', th: 'ธาตุน้ำ', vi: 'Thủy' },
};

// ── 模式名 ──
const MODE_NAMES: Record<string, Record<LangKey, string>> = {
  '基本': { zh: '基本宫', en: 'Cardinal', es: 'Cardinal', fr: 'Cardinal', th: 'ราศีเริ่มต้น', vi: 'Thống Lĩnh' },
  '固定': { zh: '固定宫', en: 'Fixed', es: 'Fijo', fr: 'Fixe', th: 'ราศีคงที่', vi: 'Cố Định' },
  '变动': { zh: '变动宫', en: 'Mutable', es: 'Mutable', fr: 'Mutable', th: 'ราศีเปลี่ยนแปลง', vi: 'Linh Hoạt' },
};

// ── 守护星名 ──
const RULER_NAMES: Record<string, Record<LangKey, string>> = {
  '火星': { zh: '火星', en: 'Mars', es: 'Marte', fr: 'Mars', th: 'ดาวอังคาร', vi: 'Sao Hỏa' },
  '金星': { zh: '金星', en: 'Venus', es: 'Venus', fr: 'Vénus', th: 'ดาวศุกร์', vi: 'Sao Kim' },
  '水星': { zh: '水星', en: 'Mercury', es: 'Mercurio', fr: 'Mercure', th: 'ดาวพุธ', vi: 'Sao Thủy' },
  '月亮': { zh: '月亮', en: 'Moon', es: 'Luna', fr: 'Lune', th: 'ดวงจันทร์', vi: 'Mặt Trăng' },
  '太阳': { zh: '太阳', en: 'Sun', es: 'Sol', fr: 'Soleil', th: 'ดวงอาทิตย์', vi: 'Mặt Trời' },
  '木星': { zh: '木星', en: 'Jupiter', es: 'Júpiter', fr: 'Jupiter', th: 'ดาวพฤหัสบดี', vi: 'Sao Mộc' },
  '土星': { zh: '土星', en: 'Saturn', es: 'Saturno', fr: 'Saturne', th: 'ดาวเสาร์', vi: 'Sao Thổ' },
  '天王星': { zh: '天王星', en: 'Uranus', es: 'Urano', fr: 'Uranus', th: 'ดาวยูเรนัส', vi: 'Sao Thiên Vương' },
  '海王星': { zh: '海王星', en: 'Neptune', es: 'Neptuno', fr: 'Neptune', th: 'ดาวเนปจูน', vi: 'Sao Hải Vương' },
  '冥王星': { zh: '冥王星', en: 'Pluto', es: 'Plutón', fr: 'Pluton', th: 'ดาวพลูโต', vi: 'Sao Diêm Vương' },
};

// ── 相位描述 ──
const PHASE_DESCS = {
  sameSign: {
    zh: '同星座（0°合相），彼此深度理解，但也容易放大相同弱点',
    en: 'Same sign (0° conjunction) — deep mutual understanding, but can amplify shared weaknesses',
    es: 'Mismo signo (0° conjunción) — comprensión mutua profunda, pero puede amplificar debilidades compartidas',
    fr: 'Même signe (0° conjonction) — compréhension mutuelle profonde, mais peut amplifier les faiblesses partagées',
    th: 'ราศีเดียวกัน (0° ร่วม) — เข้าใจซึ่งกันและกันอย่างลึกซึ้ง แต่อาจขยายจุดอ่อนร่วมกัน',
    vi: 'Cùng cung (Góc trùng 0°) — thấu hiểu sâu sắc nhưng có thể làm trầm trọng điểm yếu chung',
  },
  opposition: {
    zh: '对宫相位（${z1} ↔ ${z2}），吸引力极强但需平衡差异',
    en: 'Opposition (${z1} ↔ ${z2}) — intense attraction but requires balancing differences',
    es: 'Oposición (${z1} ↔ ${z2}) — atracción intensa pero requiere equilibrar diferencias',
    fr: 'Opposition (${z1} ↔ ${z2}) — attraction intense mais nécessite d\'équibrer les différences',
    th: 'ตรงข้าม (${z1} ↔ ${z2}) — แรงดึงดูดแรงกล้า แต่ต้องสมดุลความแตกต่าง',
    vi: 'Đối đỉnh (${z1} ↔ ${z2}) — sức hút mãnh liệt nhưng cần cân bằng khác biệt',
  },
  square: {
    zh: '四分相位（${z1} □ ${z2}），存在成长张力，磨合后更稳固',
    en: 'Square (${z1} □ ${z2}) — growth tension exists, more solid after adjustment',
    es: 'Cuadratura (${z1} □ ${z2}) — existe tensión de crecimiento, más sólido tras ajuste',
    fr: 'Carré (${z1} □ ${z2}) — tension de croissance existe, plus solide après ajustement',
    th: 'สี่เหลี่ยม (${z1} □ ${z2}) — มีแรงตึงเครียดเพื่อการเติบโต มั่นคงขึ้นหลังปรับตัว',
    vi: 'Vuông góc (${z1} □ ${z2}) — căng thẳng thúc đẩy trưởng thành, vững chắc hơn sau điều chỉnh',
  },
  trine: {
    zh: '三分相位（${z1} △ ${z2}），能量和谐流动，轻松愉快',
    en: 'Trine (${z1} △ ${z2}) — energy flows harmoniously, relaxed and pleasant',
    es: 'Trígono (${z1} △ ${z2}) — energía fluye armoniosamente, relajado y agradable',
    fr: 'Trigone (${z1} △ ${z2}) — énergie circule harmonieusement, détendu et agréable',
    th: 'สามเหลี่ยม (${z1} △ ${z2}) — พลังงานไหลลงตัว ผ่อนคลายและน่าพอใจ',
    vi: 'Tam hợp (${z1} △ ${z2}) — dòng chảy năng lượng hài hòa, tự nhiên và dễ chịu',
  },
  sextile: {
    zh: '六分相位（${z1} ⚹ ${z2}），机缘巧合多，合作顺利',
    en: 'Sextile (${z1} ⚹ ${z2}) — many coincidences, cooperation goes smoothly',
    es: 'Sextil (${z1} ⚹ ${z2}) — muchas coincidencias, cooperación fluye suavemente',
    fr: 'Sextile (${z1} ⚹ ${z2}) — beaucoup de coïncidences, coopération se déroule sans accroc',
    th: 'มุมเกื้อหนุน (${z1} ⚹ ${z2}) — โอกาสมากมาย ความร่วมมือราบรื่น',
    vi: 'Lục hợp (${z1} ⚹ ${z2}) — tương hợp cao, hợp tác và đồng hành suôn sẻ',
  },
  special: {
    zh: '特殊相位（角度差${deg}°），有独特吸引力',
    en: 'Special aspect (${deg}° apart) — unique attraction',
    es: 'Aspecto especial (a ${deg}°), atracción única',
    fr: 'Aspect spécial (à ${deg}°), attraction unique',
    th: 'มุมพิเศษ (${deg}°) — แรงดึงดูดเฉพาะตัว',
    vi: 'Góc đặc biệt (${deg}°) — hấp dẫn độc đáo',
  },
};

// ── 元素描述 ──
const ELEMENT_DESCS = {
  same: {
    zh: '同属${elem}象，价值观底层一致，但可能缺乏新鲜刺激',
    en: 'Both ${elem} — core values align, but may lack fresh stimulation',
    es: 'Ambos ${elem} — valores centrales alinean, pero puede faltar estímulo fresco',
    fr: 'Tous deux ${elem} — valeurs de base alignées, mais peut manquer stimulation fraîche',
    th: 'ทั้งคู่${elem} — ค่านิยมตรงกัน แต่อาจขาดการกระตุ้นใหม่',
    vi: 'Cả hai đều thuộc nhóm ${elem} — giá trị cốt lõi đồng điệu, nhưng cần thêm kích thích mới',
  },
  nurturing: {
    zh: '${elem1}与${elem2}相生，天然互补，互相滋养',
    en: '${elem1} and ${elem2} nurture each other — natural complement, mutual nourishment',
    es: '${elem1} y ${elem2} se nutren mutuamente — complemento natural, nutrición mutua',
    fr: '${elem1} et ${elem2} se nourrissent mutuellement — complément naturel, nourishment mutuel',
    th: '${elem1}และ${elem2}หล่อเลี้ยงซึ่งกัน — เสริมกันตามธรรมชาติ',
    vi: '${elem1} và ${elem2} nuôi dưỡng nhau — tương sinh bổ trợ tự nhiên',
  },
  different: {
    zh: '${elem1}与${elem2}不同象，差异带来成长空间',
    en: '${elem1} and ${elem2} differ — differences create growth space',
    es: '${elem1} y ${elem2} difieren — las diferencias crean espacio de crecimiento',
    fr: '${elem1} et ${elem2} diffèrent — les différences créent espace de croissance',
    th: '${elem1}และ${elem2}แตกต่างกัน — ความต่างสร้างพื้นที่เติบโต',
    vi: '${elem1} và ${elem2} mang năng lượng khác biệt — tạo không gian để cùng nhau trưởng thành',
  },
};

// ── 总结描述 ──
const SUMMARY_DESCS = {
  golden: {
    zh: '${z1}与${z2}的配置堪称黄金配对，星星都在为你们让路。',
    en: '${z1} and ${z2} form a golden pairing — the stars align for you both.',
    es: '${z1} y ${z2} forman un par dorado — las estrellas se alinean para ambos.',
    fr: '${z1} et ${z2} forment un couple doré — les étoiles s\'alignent pour vous deux.',
    th: '${z1}และ${z2}คู่ที่เข้ากันอย่างลงตัว — ดวงดาวเอื้ออำนวย',
    vi: '${z1} và ${z2} là cặp đôi hoàn hảo — các vì sao đã an bài cho hai bạn.',
  },
  chemistry: {
    zh: '${z1}（你）遇上${z2}（TA），星座能量形成有趣的化学反应。',
    en: '${z1} (you) meets ${z2} (partner) — cosmic energies spark fascinating chemistry.',
    es: '${z1} (tú) encuentra ${z2} (pareja) — las energías cósmicas crean química fascinante.',
    fr: '${z1} (vous) rencontre ${z2} (partenaire) — les énergies cosmiques créent une chimie fascinante.',
    th: '${z1}(คุณ)พบ${z2}(คู่ครอง) — พลังจักรวาลดึงดูดกัน เคมีเข้ากันน่าตื่นเต้น',
    vi: '${z1} (bạn) gặp ${z2} (người ấy) — năng lượng vũ trụ bùng nổ phản ứng hóa học đầy thú vị.',
  },
  understanding: {
    zh: '${z1}与${z2}的组合需要更多理解，但差异正是吸引力的来源。',
    en: '${z1} and ${z2} need more understanding, but differences fuel attraction.',
    es: '${z1} y ${z2} necesitan más comprensión, pero las diferencias alimentan la atracción.',
    fr: '${z1} et ${z2} nécessitent plus de compréhension, mais les différences alimentent l\'attraction.',
    th: '${z1}และ${z2}ต้องการความเข้าใจมากขึ้น แต่ความต่างคือแรงดึงดูด',
    vi: '${z1} và ${z2} cần thêm sự thấu hiểu, nhưng chính sự khác biệt lại nuôi dưỡng sức hút.',
  },
  opposite: {
    zh: '对宫相遇，强烈的对立感背后是等量的吸引力。',
    en: 'Opposing signs meet — strong polarity hides equal attraction.',
    es: 'Signos opuestos se encuentran — fuerte polaridad esconde igual atracción.',
    fr: 'Signes opposés se rencontrent — forte polarité cache une égale attraction.',
    th: 'ราศีตรงข้ามพบกัน — ขั้วตรงข้ามซ่อนแรงดึงดูดเท่ากัน',
    vi: 'Cung đối nghịch gặp nhau — đối lập ẩn chứa hấp dẫn ngang nhau.',
  },
};

// ── UI Labels ──
const UI_LABELS = {
  title: {
    zh: '西方星座', en: 'Western Zodiac', es: 'Zodiaco Occidental', fr: 'Zodiaque Occidental',
    th: 'ราศีตะวันตก', vi: 'Cung Hoàng Đạo',
  },
  sunSign: {
    zh: '【太阳星座】', en: '[Sun Sign]', es: '[Signo Solar]', fr: '[Signe Solaire]',
    th: '[ราศีสุริยะ]', vi: '[Cung Mặt Trời]',
  },
  you: { zh: '你', en: 'You', es: 'Tú', fr: 'Vous', th: 'คุณ', vi: 'Bạn' },
  ta: { zh: 'TA', en: 'Partner', es: 'Pareja', fr: 'Partenaire', th: 'คู่ครอง', vi: 'Người ấy' },
  element: { zh: '', en: 'element', es: 'elemento', fr: 'élément', th: 'ธาตุ', vi: 'nguyên tố' },
  ruler: { zh: '守护星', en: 'ruler', es: 'regente', fr: 'maître', th: 'ดาวพิทักษ์', vi: 'sao bảo hộ' },
  meetVerb: { zh: '遇上', en: 'meets', es: 'se encuentra con', fr: 'rencontre', th: 'พบกับ', vi: 'gặp' },
  phaseTitle: {
    zh: '【相位分析】', en: '[Aspect Analysis]', es: '[Análisis de Aspecto]', fr: '[Analyse d\'Aspect]',
    th: '[วิเคราะห์มุม]', vi: '[Phân Tích Góc]',
  },
  elemTitle: {
    zh: '【元素互动】', en: '[Element Interaction]', es: '[Interacción Elemental]', fr: '[Interaction Élémentaire]',
    th: '[ปฏิสัมพันธ์ธาตุ]', vi: '[Tương Tác Nguyên Tố]',
  },
  rulerTitle: {
    zh: '【守护星互动】', en: '[Ruler Interaction]', es: '[Interacción Regente]', fr: '[Interaction Maître]',
    th: '[ปฏิสัมพันธ์ดาวพิทักษ์]', vi: '[Tương Tác Sao Bảo Hộ]',
  },
  bestMatch: {
    zh: '${z1}与${z2}在经典配对表中属于最佳组合之一',
    en: '${z1} and ${z2} are one of the classic best matches',
    es: '${z1} y ${z2} son una de las mejores parejas clásicas',
    fr: '${z1} et ${z2} forment un des meilleurs couples classiques',
    th: '${z1}และ${z2}เป็นหนึ่งในคู่ที่เข้ากันได้ดีที่สุดแบบคลาสสิก',
    vi: '${z1} và ${z2} là một trong những cặp đôi tương hợp kinh điển nhất',
  },
  oppositeMatch: {
    zh: '${z1}与${z2}互为对宫，吸引力与挑战并存',
    en: '${z1} and ${z2} are opposite signs — attraction meets challenge',
    es: '${z1} y ${z2} son signos opuestos — atracción encuentra desafío',
    fr: '${z1} et ${z2} sont des signes opposés — l\'attraction rencontre le défi',
    th: '${z1}และ${z2}เป็นราศีตรงข้ามกัน — แรงดึงดูดพบกับความท้าทาย',
    vi: '${z1} và ${z2} là hai cung đối đỉnh — sức hút đi kèm với thách thức',
  },
  unique: {
    zh: '${z1}与${z2}构成独特配置，不走寻常路',
    en: '${z1} and ${z2} form a unique configuration — not the usual path',
    es: '${z1} y ${z2} forman una configuración única — no es el camino usual',
    fr: '${z1} et ${z2} forment une configuration unique — pas le chemin habituel',
    th: '${z1}และ${z2}สร้างการกำหนดค่าที่ไม่ซ้ำใคร',
    vi: '${z1} và ${z2} tạo cấu hình độc đáo',
  },
  scoreLabel: { zh: '综合评分', en: 'Overall Score', es: 'Puntuación General', fr: 'Score Global', th: 'คะแนนรวม', vi: 'Chỉ số hòa hợp' },
  scoreHigh: {
    zh: '星辰为证，缘分深厚', en: 'Stars bear witness — deep connection',
    es: 'Las estrellas atestiguan — conexión profunda', fr: 'Les étoiles en témoignent — connexion profonde',
    th: 'ดวงดาวเป็นพยาน — ความเชื่อมโยงลึกซึ้ง', vi: 'Các vì sao làm chứng — kết nối sâu sắc',
  },
  scoreMid: {
    zh: '星光指引，值得期待', en: 'Starlight guides — something to look forward to',
    es: 'La luz de las estrellas guía — algo que esperar', fr: 'La lumière des étoiles guide — à attendre',
    th: 'แสงดาวนำทาง — มีสิ่งที่ต้องตั้งตารอคอย', vi: 'Ánh sao dẫn lối — có điều đáng để trông chờ',
  },
  scoreLow: {
    zh: '星途虽有挑战，携手可越', en: 'Starry path has challenges — together you can overcome',
    es: 'El camino estelar tiene desafíos — juntos pueden superar', fr: 'Le chemin étoilé a des défis — ensemble vous pouvez surmonter',
    th: 'เส้นทางดาวมีความท้าทาย — ร่วมกันคุณสามารถฝ่าฟัน', vi: 'Đường sao có thách thức — cùng nhau vượt qua',
  },
};

// ── 核心算法 ──

export function calcZodiac(p1: BirthInfo, p2: BirthInfo, lang: AlgLang = 'zh'): EngineResult {
  const z1 = getZodiac(p1.month, p1.day);
  const z2 = getZodiac(p2.month, p2.day);

  const elem1 = SIGN_ELEMENT[z1];
  const elem2 = SIGN_ELEMENT[z2];
  const mode1 = SIGN_MODE[z1];
  const mode2 = SIGN_MODE[z2];
  const ruler1 = SIGN_RULER[z1];
  const ruler2 = SIGN_RULER[z2];

  // ── 获取翻译后的名称 ──
  const z1Name = t(ZODIAC_NAMES[z1], lang);
  const z2Name = t(ZODIAC_NAMES[z2], lang);
  const elem1Name = t(ELEMENT_NAMES[elem1], lang);
  const elem2Name = t(ELEMENT_NAMES[elem2], lang);
  const mode1Name = t(MODE_NAMES[mode1], lang);
  const mode2Name = t(MODE_NAMES[mode2], lang);
  const ruler1Name = t(RULER_NAMES[ruler1], lang);
  const ruler2Name = t(RULER_NAMES[ruler2], lang);

  // ── 1. 基础配对分 ──
  const isBestMatch = BEST_MATCHES[z1]?.includes(z2) ?? false;
  const baseScore = isBestMatch ? 85 : 65;

  // ── 2. 相位分析 ──
  const phaseDist = getPhaseDistance(z1, z2);
  let phaseScore = 70;
  let phaseDesc = '';

  if (phaseDist === 0) {
    phaseScore = 88;
    phaseDesc = t(PHASE_DESCS.sameSign, lang);
  } else if (phaseDist === 6) {
    phaseScore = 58;
    phaseDesc = t(PHASE_DESCS.opposition, lang)
      .replace('${z1}', z1Name)
      .replace('${z2}', z2Name);
  } else if (phaseDist === 3 || phaseDist === 9) {
    const isSquare = SQUARES[z1] === z2 || Object.values(SQUARES).includes(z1);
    if (isSquare || phaseDist === 3) {
      phaseScore = 62;
      phaseDesc = t(PHASE_DESCS.square, lang)
        .replace('${z1}', z1Name)
        .replace('${z2}', z2Name);
    } else {
      phaseScore = 82;
      phaseDesc = t(PHASE_DESCS.trine, lang)
        .replace('${z1}', z1Name)
        .replace('${z2}', z2Name);
    }
  } else if (phaseDist === 4 || phaseDist === 8) {
    phaseScore = 82;
    phaseDesc = t(PHASE_DESCS.trine, lang)
      .replace('${z1}', z1Name)
      .replace('${z2}', z2Name);
  } else if (phaseDist === 2 || phaseDist === 10) {
    phaseScore = 76;
    phaseDesc = t(PHASE_DESCS.sextile, lang)
      .replace('${z1}', z1Name)
      .replace('${z2}', z2Name);
  } else {
    phaseScore = 68;
    phaseDesc = t(PHASE_DESCS.special, lang)
      .replace('${deg}', String(phaseDist * 30));
  }

  // ── 3. 元素和谐度 ──
  let elementBonus = 0;
  let elementDesc = '';

  if (elem1 === elem2) {
    elementBonus = 5;
    elementDesc = t(ELEMENT_DESCS.same, lang).replace('${elem}', elem1Name);
  } else {
    const SHENG_MAP: Record<string, string> = { '火': '土', '土': '金', '金': '水', '水': '木', '木': '火' };
    if (SHENG_MAP[elem1] === elem2 || SHENG_MAP[elem2] === elem1) {
      elementBonus = 8;
      elementDesc = t(ELEMENT_DESCS.nurturing, lang)
        .replace('${elem1}', elem1Name)
        .replace('${elem2}', elem2Name);
    } else {
      elementBonus = 3;
      elementDesc = t(ELEMENT_DESCS.different, lang)
        .replace('${elem1}', elem1Name)
        .replace('${elem2}', elem2Name);
    }
  }

  // ── 4. 模式和谐度 ──
  let modeBonus = 0;
  if (mode1 === mode2) modeBonus = 4;
  else modeBonus = 2;

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
    summary = t(SUMMARY_DESCS.golden, lang)
      .replace('${z1}', z1Name)
      .replace('${z2}', z2Name);
  } else if (score >= 70) {
    summary = t(SUMMARY_DESCS.chemistry, lang)
      .replace('${z1}', z1Name)
      .replace('${z2}', z2Name);
  } else if (score >= 58) {
    summary = t(SUMMARY_DESCS.understanding, lang)
      .replace('${z1}', z1Name)
      .replace('${z2}', z2Name);
  } else {
    summary = t(SUMMARY_DESCS.opposite, lang);
  }

  // ── 构建详情 ──
  const labels = {
    sunSign: t(UI_LABELS.sunSign, lang),
    you: t(UI_LABELS.you, lang),
    ta: t(UI_LABELS.ta, lang),
    element: t(UI_LABELS.element, lang),
    ruler: t(UI_LABELS.ruler, lang),
    phaseTitle: t(UI_LABELS.phaseTitle, lang),
    elemTitle: t(UI_LABELS.elemTitle, lang),
    rulerTitle: t(UI_LABELS.rulerTitle, lang),
    bestMatch: t(UI_LABELS.bestMatch, lang).replace('${z1}', z1Name).replace('${z2}', z2Name),
    oppositeMatch: t(UI_LABELS.oppositeMatch, lang).replace('${z1}', z1Name).replace('${z2}', z2Name),
    unique: t(UI_LABELS.unique, lang).replace('${z1}', z1Name).replace('${z2}', z2Name),
    scoreLabel: t(UI_LABELS.scoreLabel, lang),
    scoreHigh: t(UI_LABELS.scoreHigh, lang),
    scoreMid: t(UI_LABELS.scoreMid, lang),
    scoreLow: t(UI_LABELS.scoreLow, lang),
    meetVerb: t(UI_LABELS.meetVerb, lang),
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
    `${z1Name} ${labels.ruler} ${ruler1Name} ${labels.meetVerb} ${z2Name} ${labels.ruler} ${ruler2Name}`,
    ``,
    isBestMatch ? `✨ ${labels.bestMatch}` : OPPOSITES[z1] === z2 ? `⚡ ${labels.oppositeMatch}` : `◆ ${labels.unique}`,
    `\n${labels.scoreLabel}：${score}/100 — ${score >= 80 ? labels.scoreHigh : score >= 65 ? labels.scoreMid : labels.scoreLow}`,
  ].join('\n');

  return {
    score,
    title: t(UI_LABELS.title, lang),
    summary,
    detail,
  };
}
