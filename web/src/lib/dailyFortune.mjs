/**
 * dailyFortune.mjs —— 今日命理赋能真值核（E54-2 主公亲令 2026-10-15）
 * ═══════════════════════════════════════════════════════════════════════════
 * 主公军令（E54-2）：E53 撤下首页「今日运势卡」**绝非丢弃内容** ——
 *   卡片外壳不要，里面【今日幸运数字 / 幸运颜色 / 幸运花朵 / 贵人方位】等命理真值
 *   必须**无缝注入灵宠的互动交互池**，由灵宠亲昵口吻轮播分享（Whisper 气泡）。
 *   ⇒ 首页保持极致极简，灵宠成为每日送运势锦囊的贴心元神。
 *
 * 🔴 三条纪律：
 *   ① **纯逻辑核**：零 DOM / 零网络 / 零 localStorage —— 任意调用点可 import（Node 可直接单测）；
 *   ② **确定性**：同一 日期(+本命太阳星座) ⇒ 输出恒定，绝不抖动（同一用户当日刷新结果一致）；
 *   ③ **本命赋能**：太阳星座（本命真值）⇒ 元素 ⇒ 贵人方位池收窄（火/土/风/水四象各有专属方位），
 *      无本命真值（未认领/未带盘）⇒ 回落全八方位池（绝不臆造本命）。
 *
 * 迁移来源：components/DailyDashboard.tsx（E53 撤下首页的那个卡片）—— 算法与词表同源迁移，
 *   仅把组件内联数据抽为可复用核，并补全六语（原 VIBES 仅 zh/en 两语）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 支持语种（与 i18n LANGS 同源；未知语种一律回落 zh） */
export const FORTUNE_LANGS = Object.freeze(['zh', 'en', 'es', 'fr', 'th', 'vi']);

/** 归一语种（'en-US' ⇒ 'en'；未知 ⇒ 'zh'） */
export function normalizeFortuneLang(lang) {
  const l = String(lang || '').slice(0, 2).toLowerCase();
  return FORTUNE_LANGS.includes(l) ? l : 'zh';
}

/* ── 一 · 幸运花（12 种 · 六语名 + 花语）── */
export const FLOWERS = [
  {
    emoji: '🌹',
    names: { zh: '红玫瑰', en: 'Red Rose', es: 'Rosa Roja', fr: 'Rose Rouge', th: 'กุหลาบแดง', vi: 'Hoa Hồng Đỏ' },
    meanings: { zh: '炽热的激情与深沉的眷恋', en: 'Passion & Deep Devotion', es: 'Pasión y Devoción Profunda', fr: 'Passion et Dévotion Profonde', th: 'ความหลงใหลและความผูกพันลึกซึ้ง', vi: 'Đam mê và Tình cảm sâu sắc' },
  },
  {
    emoji: '🌺',
    names: { zh: '芙蓉花', en: 'Hibiscus', es: 'Hibisco', fr: 'Hibiscus', th: 'ชบา', vi: 'Hoa Dâm Bụt' },
    meanings: { zh: '优雅敏感的灵魂之美', en: 'Delicate Beauty & Sensitivity', es: 'Belleza Delicada y Sensibilidad', fr: 'Beauté Délicate et Sensibilité', th: 'ความงามที่อ่อนโยนและละเอียดอ่อน', vi: 'Vẻ đẹp tinh tế và nhạy cảm' },
  },
  {
    emoji: '🪷',
    names: { zh: '莲花', en: 'Lotus', es: 'Loto', fr: 'Lotus', th: 'ดอกบัว', vi: 'Hoa Sen' },
    meanings: { zh: '出淤泥不染的觉醒之力', en: 'Purity & Spiritual Awakening', es: 'Pureza y Despertar Espiritual', fr: 'Pureté et Éveil Spirituel', th: 'ความบริสุทธิ์และการตื่นรู้ทางจิตวิญญาณ', vi: 'Sự thuần khiết và thức tỉnh tâm linh' },
  },
  {
    emoji: '🌻',
    names: { zh: '向日葵', en: 'Sunflower', es: 'Girasol', fr: 'Tournesol', th: 'ดอกทานตะวัน', vi: 'Hoa Hướng Dương' },
    meanings: { zh: '追逐光明的忠诚与积极', en: 'Loyalty & Radiant Optimism', es: 'Lealtad y Optimismo Radiante', fr: 'Loyauté et Optimisme Rayonnant', th: 'ความภักดีและการมองโลกในแง่ดี', vi: 'Trung thành và lạc quan rực rỡ' },
  },
  {
    emoji: '🌸',
    names: { zh: '樱花', en: 'Cherry Blossom', es: 'Flor de Cerezo', fr: 'Fleur de Cerisier', th: 'ดอกซากุระ', vi: 'Hoa Anh Đào' },
    meanings: { zh: '转瞬即逝的极致之美', en: 'Ephemeral Beauty & Grace', es: 'Belleza Efímera y Gracia', fr: 'Beauté Éphémère et Grâce', th: 'ความงามที่ชั่วคราวและสง่างาม', vi: 'Vẻ đẹp thoáng qua và duyên dáng' },
  },
  {
    emoji: '🌿',
    names: { zh: '薰衣草', en: 'Lavender', es: 'Lavanda', fr: 'Lavande', th: 'ลาเวนเดอร์', vi: 'Hoa Oải Hương' },
    meanings: { zh: '平静内心的深层智慧', en: 'Calm Mind & Inner Wisdom', es: 'Mente Calma y Sabiduría Interior', fr: 'Calme Mental et Sagesse Intérieure', th: 'จิตใจที่สงบและปัญญาภายใน', vi: 'Tâm trí bình thản và trí tuệ nội tâm' },
  },
  {
    emoji: '🌷',
    names: { zh: '郁金香', en: 'Tulip', es: 'Tulipán', fr: 'Tulipe', th: 'ดอกทิวลิป', vi: 'Hoa Tulip' },
    meanings: { zh: '热烈而直白的爱的宣言', en: 'Declaration of Passionate Love', es: 'Declaración de Amor Apasionado', fr: "Déclaration d'Amour Passionné", th: 'การประกาศความรักที่ร้อนแรง', vi: 'Tuyên ngôn tình yêu nồng cháy' },
  },
  {
    emoji: '💐',
    names: { zh: '牡丹花', en: 'Peony', es: 'Peonía', fr: 'Pivoine', th: 'ดอกโบตั๋น', vi: 'Hoa Mẫu Đơn' },
    meanings: { zh: '富贵吉祥与圆满人生', en: 'Prosperity & Fulfillment', es: 'Prosperidad y Plenitud', fr: 'Prospérité et Épanouissement', th: 'ความเจริญรุ่งเรืองและความสมบูรณ์', vi: 'Thịnh vượng và viên mãn' },
  },
  {
    emoji: '🎋',
    names: { zh: '竹子', en: 'Bamboo', es: 'Bambú', fr: 'Bambou', th: 'ไม้ไผ่', vi: 'Cây Tre' },
    meanings: { zh: '韧性生长的低调强者', en: 'Resilience & Steady Growth', es: 'Resiliencia y Crecimiento Constante', fr: 'Résilience et Croissance Constante', th: 'ความยืดหยุ่นและการเติบโตที่มั่นคง', vi: 'Kiên cường và phát triển bền vững' },
  },
  {
    emoji: '🌙',
    names: { zh: '夜来香', en: 'Night Blooming Jasmine', es: 'Jazmín Nocturno', fr: 'Jasmin de Nuit', th: 'ดอกมะลิราตรี', vi: 'Hoa Lài Đêm' },
    meanings: { zh: '暗夜中绽放的神秘直觉', en: 'Mysterious Intuition in Darkness', es: 'Intuición Misteriosa en la Oscuridad', fr: "Intuition Mystérieuse dans l'Obscurité", th: 'สัญชาตญาณลึกลับในความมืด', vi: 'Trực giác huyền bí trong bóng tối' },
  },
  {
    emoji: '💜',
    names: { zh: '紫罗兰', en: 'Violet', es: 'Violeta', fr: 'Violette', th: 'ดอกไวโอเล็ต', vi: 'Hoa Violet' },
    meanings: { zh: '谦逊的永恒之美', en: 'Humble Eternal Beauty', es: 'Belleza Eterna y Humilde', fr: 'Beauté Éternelle et Humble', th: 'ความงามที่ถ่อมตนและเป็นนิรันดร์', vi: 'Vẻ đẹp khiêm tốn vĩnh cửu' },
  },
  {
    emoji: '🌼',
    names: { zh: '雏菊', en: 'Daisy', es: 'Margarita', fr: 'Marguerite', th: 'ดอกเดซี่', vi: 'Hoa Cúc' },
    meanings: { zh: '纯真快乐与新的开始', en: 'Innocence & New Beginnings', es: 'Inocencia y Nuevos Comienzos', fr: 'Innocence et Nouveaux Départs', th: 'ความบริสุทธิ์และการเริ่มต้นใหม่', vi: 'Ngây thơ và khởi đầu mới' },
  },
];

/* ── 二 · 幸运色（12 种 · 六语名 + 色值）── */
export const COLORS = [
  { hex: '#D4AF37', zh: '金色', en: 'Gold', es: 'Oro', fr: 'Or', th: 'สีทอง', vi: 'Vàng Kim' },
  { hex: '#81D8D0', zh: '薄荷绿', en: 'Mint', es: 'Menta', fr: 'Menthe', th: 'สีมิ้นต์', vi: 'Bạc Hà' },
  { hex: '#A855F7', zh: '星云紫', en: 'Nebula Purple', es: 'Púrpura Nebulosa', fr: 'Violet Nébuleuse', th: 'สีม่วงเนบิวลา', vi: 'Tím Tinh Vân' },
  { hex: '#FF6B6B', zh: '珊瑚红', en: 'Coral Red', es: 'Rojo Coral', fr: 'Rouge Corail', th: 'สีแดงปะการัง', vi: 'Đỏ San Hô' },
  { hex: '#4ECDC4', zh: '海蓝', en: 'Ocean Blue', es: 'Azul Océano', fr: 'Bleu Océan', th: 'สีฟ้ามหาสมุทร', vi: 'Xanh Đại Dương' },
  { hex: '#FFD93D', zh: '琥珀黄', en: 'Amber', es: 'Ámbar', fr: 'Ambre', th: 'สีอำพัน', vi: 'Hổ Phách' },
  { hex: '#DA70D6', zh: '兰花紫', en: 'Orchid', es: 'Orquídea', fr: 'Orchidée', th: 'สีกล้วยไม้', vi: 'Tím Phong Lan' },
  { hex: '#20B2AA', zh: '深海绿', en: 'Deep Sea', es: 'Verde Marino', fr: 'Vert Océan Profond', th: 'สีเขียวทะเลลึก', vi: 'Xanh Biển Sâu' },
  { hex: '#FFA07A', zh: '暖橘', en: 'Warm Orange', es: 'Naranja Cálido', fr: 'Orange Doux', th: 'สีส้มอบอุ่น', vi: 'Cam Ấm' },
  { hex: '#C39BD3', zh: '紫丁香', en: 'Lilac', es: 'Lila', fr: 'Lilas', th: 'สีไลแลค', vi: 'Tử Đinh Hương' },
  { hex: '#85C1E9', zh: '天空蓝', en: 'Sky Blue', es: 'Azul Cielo', fr: 'Bleu Ciel', th: 'สีฟ้า', vi: 'Xanh Trời' },
  { hex: '#F0B27A', zh: '蜜桃', en: 'Peach', es: 'Durazno', fr: 'Pêche', th: 'สีพีช', vi: 'Đào' },
];

/* ── 三 · 贵人方位（八方位 · 六语名）── */
export const DIRECTIONS = [
  { key: 'east', zh: '正东', en: 'East', es: 'Este', fr: 'Est', th: 'ทิศตะวันออก', vi: 'Chính Đông' },
  { key: 'southeast', zh: '东南', en: 'Southeast', es: 'Sureste', fr: 'Sud-Est', th: 'ทิศตะวันออกเฉียงใต้', vi: 'Đông Nam' },
  { key: 'south', zh: '正南', en: 'South', es: 'Sur', fr: 'Sud', th: 'ทิศใต้', vi: 'Chính Nam' },
  { key: 'southwest', zh: '西南', en: 'Southwest', es: 'Suroeste', fr: 'Sud-Ouest', th: 'ทิศตะวันตกเฉียงใต้', vi: 'Tây Nam' },
  { key: 'west', zh: '正西', en: 'West', es: 'Oeste', fr: 'Ouest', th: 'ทิศตะวันตก', vi: 'Chính Tây' },
  { key: 'northwest', zh: '西北', en: 'Northwest', es: 'Noroeste', fr: 'Nord-Ouest', th: 'ทิศตะวันตกเฉียงเหนือ', vi: 'Tây Bắc' },
  { key: 'north', zh: '正北', en: 'North', es: 'Norte', fr: 'Nord', th: 'ทิศเหนือ', vi: 'Chính Bắc' },
  { key: 'northeast', zh: '东北', en: 'Northeast', es: 'Noreste', fr: 'Nord-Est', th: 'ทิศตะวันออกเฉียงเหนือ', vi: 'Đông Bắc' },
];

/** 四象 ⇒ 贵人方位池（本命赋能：太阳星座元素收窄方位，缺本命 ⇒ 全八方位） */
export const ELEMENT_DIRECTIONS = Object.freeze({
  fire: ['south', 'southeast'],
  earth: ['southwest', 'northeast'],
  air: ['west', 'northwest'],
  water: ['north', 'east'],
});

/** 太阳星座 ⇒ 四象（英文名小写 + 中文名双向，缺则 ''） */
export const SUN_ELEMENT = Object.freeze({
  aries: 'fire', leo: 'fire', sagittarius: 'fire',
  taurus: 'earth', virgo: 'earth', capricorn: 'earth',
  gemini: 'air', libra: 'air', aquarius: 'air',
  cancer: 'water', scorpio: 'water', pisces: 'water',
  '白羊': 'fire', '狮子': 'fire', '射手': 'fire',
  '金牛': 'earth', '处女': 'earth', '摩羯': 'earth',
  '双子': 'air', '天秤': 'air', '水瓶': 'air',
  '巨蟹': 'water', '天蝎': 'water', '双鱼': 'water',
});

/** 今日能量语（8 条 · 六语）—— 迁移自 DailyDashboard（原仅 zh/en，E54 补全六语） */
export const VIBES = {
  zh: [
    '✨ 今日能量高开，适合主动出击', '🌊 顺势而为，事半功倍的一天', '🔥 内在动力充沛，适合攻坚', '💫 人际关系磁场强烈',
    '⭐ 机会藏在细节中', '🌈 今日宜复盘，不宜冒进', '🎯 专注当下，能量自然汇聚', '🌙 适合独处，倾听内心声音',
  ],
  en: [
    '✨ High energy today — take initiative', '🌊 Go with the flow — half the effort, double the gain', '🔥 Inner drive is strong — tackle what you have avoided', '💫 Strong social magnetism around you',
    '⭐ Opportunity hides in the details', '🌈 A day to review, not to rush', '🎯 Stay focused — energy will gather on its own', '🌙 Time for solitude — listen within',
  ],
  es: [
    '✨ Alta energía hoy — toma la iniciativa', '🌊 Ve con la corriente — la mitad del esfuerzo, el doble de resultado', '🔥 Tu impulso interior es fuerte — afronta lo pendiente', '💫 Fuerte magnetismo social a tu alrededor',
    '⭐ La oportunidad se esconde en los detalles', '🌈 Día para revisar, no para precipitarse', '🎯 Mantén el foco — la energía llegará sola', '🌙 Momento de soledad — escucha tu interior',
  ],
  fr: [
    "✨ Énergie élevée aujourd'hui — prenez l'initiative", '🌊 Suivez le courant — moitié d\'effort, double de résultat', '🔥 Votre élan intérieur est fort — affrontez ce qui reste', '💫 Fort magnétisme social autour de vous',
    "⭐ L'opportunité se cache dans les détails", '🌈 Journée de bilan, pas de précipitation', "🎯 Restez concentré — l'énergie viendra d'elle-même", '🌙 Moment de solitude — écoutez votre intérieur',
  ],
  th: [
    '✨ พลังงานสูงวันนี้ — กล้าลงมือก่อนใคร', '🌊 ปล่อยไหลตามจังหวะ — เหนื่อยครึ่งเดียว ได้ผลสองเท่า', '🔥 แรงขับภายในแข็งแกร่ง — จัดการสิ่งที่ค้างอยู่', '💫 สนามเสน่ห์ทางสังคมรอบตัวคุณแข็งแรง',
    '⭐ โอกาสซ่อนอยู่ในรายละเอียด', '🌈 วันนี้เหมาะทบทวน ไม่ควรบุ่มบ่าม', '🎯 จดจ่อกับปัจจุบัน — พลังงานจะรวมตัวเอง', '🌙 เหมาะกับการอยู่คนเดียว — ฟังเสียงข้างใน',
  ],
  vi: [
    '✨ Năng lượng hôm nay cao — hãy chủ động', '🌊 Thuận theo dòng chảy — nửa công sức, gấp đôi kết quả', '🔥 Nội lực mạnh — hãy xử lý việc còn dang dở', '💫 Từ trường giao tiếp quanh bạn rất mạnh',
    '⭐ Cơ hội ẩn trong chi tiết', '🌈 Ngày nên nhìn lại, đừng vội vàng', '🎯 Giữ tập trung — năng lượng sẽ tự tụ về', '🌙 Thời điểm ở một mình — lắng nghe nội tâm',
  ],
};

/* ── 四 · 确定性种子 ── */

/** 当日种子（Asia/Shanghai 日历日 ⇒ y*10000+m*100+d；与 DailyDashboard 同源算法） */
export function dailySeed(d) {
  const base = (d instanceof Date && !Number.isNaN(d.getTime())) ? d : new Date();
  const local = new Date(base.getTime() + 8 * 3600000);
  return local.getUTCFullYear() * 10000 + (local.getUTCMonth() + 1) * 100 + local.getUTCDate();
}

/** 同日历日键（YYYYMMDD 字符串） */
export function fortuneDateKey(d) {
  return String(dailySeed(d));
}

/** 线性同余散列（与 DailyDashboard 同源，保证迁移前后同 seed 同结果） */
export function simpleHash(seed, max) {
  const s = (seed * 9301 + 49297) % 233280;
  return (s / 233280) * max;
}

/** 太阳星座 ⇒ 四象（大小写/空白无关；中文取前两字；未知 ⇒ ''） */
export function sunElement(sunSign) {
  const raw = String(sunSign || '').trim();
  if (!raw) return '';
  const low = raw.toLowerCase();
  if (SUN_ELEMENT[low]) return SUN_ELEMENT[low];
  const zhKey = raw.slice(0, 2);
  return SUN_ELEMENT[zhKey] || '';
}

/** 方位池：有本命元素 ⇒ 该象两方位；否则全八方位（确定性，禁随机） */
export function directionPool(sunSign) {
  const el = sunElement(sunSign);
  const keys = (el && ELEMENT_DIRECTIONS[el]) ? ELEMENT_DIRECTIONS[el] : DIRECTIONS.map((x) => x.key);
  return keys.map((k) => DIRECTIONS.find((x) => x.key === k)).filter(Boolean);
}

/**
 * 今日运势锦囊（唯一入口）。
 * @param {{ lang?: string, sunSign?: string, date?: Date }} opts
 * @returns 确定性锦囊对象（同 date+lang+sunSign ⇒ 恒定输出）
 */
export function dailyFortune(opts) {
  const o = (opts && typeof opts === 'object') ? opts : {};
  const lang = normalizeFortuneLang(o.lang);
  const seed = dailySeed(o.date);

  const flowerIdx = Math.floor(simpleHash(seed, FLOWERS.length));
  const colorIdx = Math.floor(simpleHash(seed + 1, COLORS.length));
  const luckyNumber = Math.floor(simpleHash(seed + 2, 99)) + 1; // 1-99
  const pool = directionPool(o.sunSign);
  const dirIdx = Math.floor(simpleHash(seed + 4, pool.length));
  const vibes = VIBES[lang] || VIBES.zh;
  const vibeIdx = Math.floor(simpleHash(seed + 3, vibes.length));

  const flower = FLOWERS[flowerIdx];
  const color = COLORS[colorIdx];
  const direction = pool[dirIdx] || DIRECTIONS[0];

  return {
    dateKey: fortuneDateKey(o.date),
    luckyNumber,
    color: { hex: color.hex, name: color[lang] || color.zh },
    flower: {
      emoji: flower.emoji,
      name: flower.names[lang] || flower.names.zh,
      meaning: flower.meanings[lang] || flower.meanings.zh,
    },
    direction: { key: direction.key, name: direction[lang] || direction.zh },
    element: sunElement(o.sunSign),
    vibe: vibes[vibeIdx] || vibes[0],
  };
}
