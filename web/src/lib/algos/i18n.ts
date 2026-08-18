export type AlgLang = "zh" | "en" | "es" | "fr" | "th" | "vi";

const SUPPORTED: AlgLang[] = ["zh", "en", "es", "fr", "th", "vi"];

export function normalizeLang(raw: string): AlgLang {
  const base = raw.split("-")[0] as string;
  return SUPPORTED.includes(base as AlgLang) ? (base as AlgLang) : "en";
}

// ── 翻译字典（合婚引擎用） ──
const DICT: Record<string, Record<AlgLang, string>> = {
  deep_fate: { zh: '命定深缘', en: 'Deep Fate Connection', es: 'Conexión Profunda del Destino', fr: 'Connexion Profonde du Destin', th: 'มิตรภาพแห่งชะตากรรมลึกซึ้ง', vi: 'Sợi dây số phận sâu thẳm' },
  wuxing_potential: { zh: '五行互补潜力', en: 'Wu Xing Complementary Potential', es: 'Potencial Complementario Wu Xing', fr: 'Potentiel Complémentaire Wu Xing', th: 'ศักยภาพอู่หงิงประสานกัน', vi: 'Tiềm năng Ngũ Hành bù đắp' },
  zodiac_harmony: { zh: '星座和谐共振', en: 'Zodiac Harmonious Resonance', es: 'Resonancia Armoniosa del Zodíaco', fr: 'Résonance Harmonieuse du Zodiaque', th: 'เคมีดวงดาวที่ราบรื่นและเข้ากันได้ดี', vi: 'Cung hoàng đạo hài hòa cộng hưởng' },
  iching_trend: { zh: '易经吉卦趋势', en: 'I Ching Auspicious Trend', es: 'Tendencia Auspiciosa del I Ching', fr: 'Tendance Auspicieuse du Yi Jing', th: 'คำชี้แนะแห่งความเติบโตจากอี้จิง', vi: 'Xu hướng cát lợi Kinh Dịch' },
  attraction_strong: { zh: '情感吸引力强', en: 'Strong Emotional Attraction', es: 'Fuerte Atracción Emocional', fr: 'Forte Attraction Émotionnelle', th: 'แรงดึงดูดทางอารมณ์ที่รุนแรง', vi: 'Sức hút tình cảm mạnh mẽ' },
  comm_low_cost: { zh: '沟通成本低', en: 'Low Communication Cost', es: 'Bajo Costo de Comunicación', fr: 'Faible Coût de Communication', th: 'ต้นทุนการสื่อสารต่ำ', vi: 'Chi phí giao tiếp thấp' },
  stability_good: { zh: '长期稳定佳', en: 'Good Long-term Stability', es: 'Buena Estabilidad a Largo Plazo', fr: 'Bonne Stabilité à Long Terme', th: 'ความมั่นคงระยะยาวดีเยี่ยม', vi: 'Nền tảng vững chãi' },
  comm_patience: { zh: '沟通需耐心', en: 'Patience Needed in Communication', es: 'Paciencia Necesaria en la Comunicación', fr: 'Patience Nécessaire dans la Communication', th: 'ต้องใช้ความอดทนในการสื่อสาร', vi: 'Cần thêm sự thấu hiểu và kiên nhẫn' },
  stability_goal: { zh: '稳定需共同目标', en: 'Stability Needs Shared Goals', es: 'La Estabilidad Necesita Objetivos Compartidos', fr: 'La Stabilité Nécessite des Objectifs Communs', th: 'ความมั่นคงต้องการเป้าหมายร่วมกัน', vi: 'Cần xây dựng nền tảng chung' },
  chemistry_cultivate: { zh: '亲密感可培养', en: 'Intimacy Can Be Cultivated', es: 'La Intimidad se Puede Cultivar', fr: 'L\'Intimité Peut Être Cultivée', th: 'ความใกล้ชิดสามารถพัฒนาได้', vi: 'Sự thân mật có thể vun đắp' },
  bazi_polish: { zh: '八字可调和', en: 'BaZi Can Be Harmonized', es: 'El BaZi se Puede Armonizar', fr: 'Le BaZi Peut Être Harmonisé', th: 'ปาจื่อปรับสมดุลกันได้', vi: 'Bát Tự có thể điều hòa' },
  zodiac_misalign: { zh: '星座稍有错位', en: 'Slight Zodiac Misalignment', es: 'Ligera Desalineación del Zodíaco', fr: 'Légère Désalignement du Zodiaque', th: 'ราศีเล็กน้อยไม่สอดคล้องกัน', vi: 'Cung hoàng đạo hơi lệch nhau' },
  growth_will: { zh: '成长意愿', en: 'Willingness to Grow', es: 'Disposición a Crecer', fr: 'Volonté de Grandir', th: 'ความต้องการเติบโต', vi: 'Khao khát phát triển' },
  freshness: { zh: '保持新鲜感', en: 'Keep Freshness Alive', es: 'Mantener Viva la Frescura', fr: 'Garder la Fraîcheur Vivante', th: 'เติมไฟและรักษาความตื่นเต้นในความรัก', vi: 'Giữ gìn sự mới mẻ' },
};

export function t(key: string, lang: AlgLang): string {
  return DICT[key]?.[lang] ?? key;
}

// ═══════════════════════════════════════════════════════
// ── 财富页数据翻译层 ──
// 算法返回的原始中文值 → 用户语言
// ═══════════════════════════════════════════════════════

// ── 五行 ──
const WUXING_NAMES: Record<string, Record<AlgLang, string>> = {
  木: { zh: '木', en: 'Wood',    es: 'Madera',    fr: 'Bois',    th: 'ไม้',       vi: 'Mộc' },
  火: { zh: '火', en: 'Fire',    es: 'Fuego',      fr: 'Feu',     th: 'ไฟ',        vi: 'Hỏa' },
  土: { zh: '土', en: 'Earth',   es: 'Tierra',     fr: 'Terre',   th: 'ดิน',       vi: 'Thổ' },
  金: { zh: '金', en: 'Metal',   es: 'Metal',      fr: 'Métal',   th: 'โลหะ',     vi: 'Kim' },
  水: { zh: '水', en: 'Water',   es: 'Agua',       fr: 'Eau',     th: 'น้ำ',       vi: 'Thủy' },
};

export function tWuxing(cn: string, lang: AlgLang): string {
  return WUXING_NAMES[cn]?.[lang] ?? cn;
}

// ── 星座（12宫） ──
const ZODIAC_SIGNS: Record<string, Record<AlgLang, string>> = {
  白羊座: { zh: '白羊座', en: 'Aries',         es: 'Aries',           fr: 'Bélier',           th: 'ราศีเมษ',         vi: 'Bạch Dương' },
  金牛座: { zh: '金牛座', en: 'Taurus',        es: 'Tauro',            fr: 'Taureau',          th: 'ราศีพฤษภ',         vi: 'Kim Ngưu' },
  双子座: { zh: '双子座', en: 'Gemini',        es: 'Géminis',          fr: 'Gémeaux',          th: 'ราศีมิถุน',        vi: 'Song Tử' },
  巨蟹座: { zh: '巨蟹座', en: 'Cancer',        es: 'Cáncer',            fr: 'Cancer',           th: 'ราศีกรกฎ',        vi: 'Cự Giải' },
  狮子座: { zh: '狮子座', en: 'Leo',           es: 'Leo',               fr: 'Lion',             th: 'ราศีสิงห์',         vi: 'Sư Tử' },
  处女座: { zh: '处女座', en: 'Virgo',         es: 'Virgo',             fr: 'Vierge',           th: 'ราศีกันย์',         vi: 'Xử Nữ' },
  天秤座: { zh: '天秤座', en: 'Libra',        es: 'Libra',             fr: 'Balance',          th: 'ราศีตุลย์',          vi: 'Thiên Bình' },
  天蝎座: { zh: '天蝎座', en: 'Scorpio',      es: 'Escorpio',          fr: 'Scorpion',         th: 'ราศีพิจิก',      vi: 'Thiên Xung' },
  射手座: { zh: '射手座', en: 'Sagittarius',  es: 'Sagitario',         fr: 'Sagittaire',       th: 'ราศีธนู',         vi: 'Nhân Mã' },
  摩羯座: { zh: '摩羯座', en: 'Capricorn',    es: 'Capricornio',       fr: 'Capricorne',       th: 'ราศีมังกร',          vi: 'Ma Kết' },
  水瓶座: { zh: '水瓶座', en: 'Aquarius',     es: 'Acuario',           fr: 'Verseau',          th: 'ราศีกุมภ์',      vi: 'Bảo Bình' },
  双鱼座: { zh: '双鱼座', en: 'Pisces',       es: 'Piscis',            fr: 'Poissons',         th: 'ราศีมีน',          vi: 'Song Ngư' },
};

export function tZodiacSign(sign: string, lang: AlgLang): string {
  return ZODIAC_SIGNS[sign]?.[lang] ?? sign;
}

// ── 星座元素（水/火/风/土） ──
const ZODIAC_ELEMENTS: Record<string, Record<AlgLang, string>> = {
  火: { zh: '火', en: 'Fire',   es: 'Fuego',    fr: 'Feu',    th: 'ไฟ',      vi: 'Hỏa' },
  土: { zh: '土', en: 'Earth',  es: 'Tierra',   fr: 'Terre',  th: 'ดิน',    vi: 'Thổ' },
  风: { zh: '风', en: 'Air',    es: 'Aire',     fr: 'Air',    th: 'ลม',     vi: 'Phong' },
  水: { zh: '水', en: 'Water',  es: 'Agua',     fr: 'Eau',    th: 'น้ำ',    vi: 'Thủy' },
};

export function tZodiacElement(elem: string, lang: AlgLang): string {
  return ZODIAC_ELEMENTS[elem]?.[lang] ?? elem;
}

// ── 八字天干 ──
const TIANGAN: Record<string, Record<AlgLang, string>> = {
  甲: { zh: '甲', en: 'Jia',  es: 'Jiǎ',   fr: 'Jiǎ',  th: 'ขอ', vi: 'Giáp' },
  乙: { zh: '乙', en: 'Yi',   es: 'Yǐ',    fr: 'Yǐ',   th: 'อี', vi: 'Ất' },
  丙: { zh: '丙', en: 'Bing', es: 'Bǐng',  fr: 'Bǐng', th: 'ปิ้ง', vi: 'Bính' },
  丁: { zh: '丁', en: 'Ding', es: 'Dīng',  fr: 'Dīng', th: 'ติ้ง', vi: 'Đinh' },
  戊: { zh: '戊', en: 'Wu',   es: 'Wù',    fr: 'Wù',   th: 'อู', vi: 'Mậu' },
  己: { zh: '己', en: 'Ji',   es: 'Jǐ',    fr: 'Jǐ',   th: 'จี้', vi: 'Kỷ' },
  庚: { zh: '庚', en: 'Geng', es: 'Gēng',  fr: 'Gēng', th: 'เกิง', vi: 'Canh' },
  辛: { zh: '辛', en: 'Xin',  es: 'Xīn',   fr: 'Xīn',  th: 'ซิน', vi: 'Tân' },
  壬: { zh: '壬', en: 'Ren',  es: 'Rén',   fr: 'Rén',  th: 'เริ่น', vi: 'Nhâm' },
  癸: { zh: '癸', en: 'Gui',  es: 'Guǐ',   fr: 'Guǐ',  th: 'กุย', vi: 'Quý' },
};

export function tTiangan(cn: string, lang: AlgLang): string {
  return TIANGAN[cn]?.[lang] ?? cn;
}

// ── 易经八卦（八经卦，含卦名 + 象名） ──
const BAGUA: Record<string, Record<AlgLang, string>> = {
  // 卦名（本名）
  乾: { zh: '乾', en: 'Qian (Heaven)',  es: 'Qian (Cielo)',    fr: 'Qian (Ciel)',    th: 'เชียน (สวรรค์)', vi: 'Càn (Thiên)' },
  坤: { zh: '坤', en: 'Kun (Earth)',   es: 'Kun (Tierra)',    fr: 'Kun (Terre)',    th: 'คุน (ดิน)',     vi: 'Khôn (Địa)' },
  震: { zh: '震', en: 'Zhen (Thunder)', es: 'Zhen (Trueno)',   fr: 'Zhen (Tonnerre)',th: 'ต้าน (อินทรี)', vi: 'Chấn (Lôi)' },
  坎: { zh: '坎', en: 'Kan (Water)',   es: 'Kan (Agua)',      fr: 'Kan (Eau)',      th: 'คัน (น้ำ)',    vi: 'Khảm (Thủy)' },
  艮: { zh: '艮', en: 'Gen (Mountain)',es: 'Gen (Montaña)',    fr: 'Gen (Montagne)',  th: 'เกิน (เขา)',   vi: 'Cấn (Sơn)' },
  巽: { zh: '巽', en: 'Xun (Wind)',    es: 'Xun (Viento)',     fr: 'Xun (Vent)',     th: 'ซุน (ลม)',     vi: 'Tốn (Phong)' },
  离: { zh: '离', en: 'Li (Fire)',     es: 'Li (Fuego)',       fr: 'Li (Feu)',       th: 'ลี่ (ไฟ)',     vi: 'Ly (Hỏa)' },
  兑: { zh: '兑', en: 'Dui (Lake)',    es: 'Dui (Lago)',       fr: 'Dui (Lac)',      th: 'ตุย (ทะเลสาบ)',vi: 'Đoài (Trạch)' },
  // 象名（自然现象，后端 hexNature 用此名）
  天: { zh: '天', en: 'Heaven',  es: 'Cielo',    fr: 'Ciel',    th: 'สวรรค์',  vi: 'Thiên (Trời)' },
  地: { zh: '地', en: 'Earth',   es: 'Tierra',   fr: 'Terre',   th: 'ดิน',     vi: 'Địa (Đất)' },
  雷: { zh: '雷', en: 'Thunder', es: 'Trueno',   fr: 'Tonnerre',th: 'อินทรี',  vi: 'Lôi (Sấm Sét)' },
  水: { zh: '水', en: 'Water',   es: 'Agua',     fr: 'Eau',     th: 'น้ำ',     vi: 'Thủy (Nước)' },
  山: { zh: '山', en: 'Mountain',es: 'Montaña',  fr: 'Montagne',th: 'เขา',     vi: 'Sơn (Núi)' },
  风: { zh: '风', en: 'Wind',    es: 'Viento',   fr: 'Vent',    th: 'ลม',      vi: 'Phong (Gió)' },
  火: { zh: '火', en: 'Fire',    es: 'Fuego',    fr: 'Feu',     th: 'ไฟ',      vi: 'Hỏa (Lửa)' },
  泽: { zh: '泽', en: 'Lake',    es: 'Lago',     fr: 'Lac',     th: 'ทะเลสาบ', vi: 'Trạch (Hồ)' },
};

export function tBagua(cn: string, lang: AlgLang): string {
  return BAGUA[cn]?.[lang] ?? cn;
}

// ── 塔罗大阿卡纳（22张）─
const TAROT_CARD_NAMES: Record<number, Record<AlgLang, string>> = {
  0:  { zh: '愚人',     en: 'The Fool',       es: 'El Loco',         fr: 'Le Fou',          th: 'ไพ่คนบ้า',          vi: 'Kẻ Ngốc' },
  1:  { zh: '魔术师',   en: 'The Magician',    es: 'El Mago',          fr: 'Le Magicien',      th: 'ไพ่จอมเวทย์',       vi: 'Nhà Ảo Thuật' },
  2:  { zh: '女祭司',   en: 'The High Priestess', es: 'La Sacerdotisa',  fr: 'La Grande Prêtresse', th: 'ไพ่นักบวชหญิง', vi: 'Nữ Giáo Chủ' },
  3:  { zh: '女皇',     en: 'The Empress',    es: 'La Emperadora',    fr: 'L\'Impératrice',   th: 'ไพ่จักรพรรดินี',         vi: 'Nữ Hoàng' },
  4:  { zh: '皇帝',     en: 'The Emperor',    es: 'El Emperador',     fr: 'L\'Empereur',      th: 'ไพ่จักรพรรดิ',         vi: 'Nam Hoàng' },
  5:  { zh: '教皇',     en: 'The Hierophant', es: 'El Hierofante',    fr: 'Le Pape',          th: 'ไพ่สมเด็จพระสังฆราช',      vi: 'Giáo Chủ' },
  6:  { zh: '恋人',     en: 'The Lovers',     es: 'Los Enamorados',  fr: 'Les Amoureux',     th: 'ไพ่คู่รัก',          vi: 'Người Yêu' },
  7:  { zh: '战车',     en: 'The Chariot',   es: 'El Carro',         fr: 'Le Char',          th: 'ไพ่รถศึก',        vi: 'Chiến Xa' },
  8:  { zh: '力量',     en: 'Strength',      es: 'La Fuerza',        fr: 'La Force',         th: 'ไพ่พละกำลัง',            vi: 'Sức Mạnh' },
  9:  { zh: '隐士',     en: 'The Hermit',    es: 'El Ermitaño',      fr: 'L\'Ermite',        th: 'ไพ่ฤาษี',          vi: 'Ẩn Sĩ' },
  10: { zh: '命运之轮', en: 'Wheel of Fortune', es: 'La Rueda de la Fortuna', fr: 'La Roue de la Fortune', th: 'ไพ่วงล้อแห่งโชคชะตา', vi: 'Bánh Xe Vận Mệnh' },
  11: { zh: '正义',     en: 'Justice',       es: 'La Justicia',     fr: 'La Justice',        th: 'ไพ่ความยุติธรรม',            vi: 'Công Lý' },
  12: { zh: '倒吊人',   en: 'The Hanged Man', es: 'El Colgado',      fr: 'Le Pendu',          th: 'ไพ่คนแขวน',      vi: 'Người Treo Ngược' },
  13: { zh: '死神',     en: 'Death',         es: 'La Muerte',        fr: 'La Mort',           th: 'ไพ่มัจจุราช',              vi: 'Tử Thần' },
  14: { zh: '节制',     en: 'Temperance',    es: 'La Templanza',     fr: 'La Tempérance',     th: 'ไพ่ความพอดี',          vi: 'Điều Hòa' },
  15: { zh: '恶魔',     en: 'The Devil',     es: 'El Diablo',        fr: 'Le Diable',         th: 'ไพ่ปีศาจ',          vi: 'Ác Quỷ' },
  16: { zh: '高塔',     en: 'The Tower',     es: 'La Torre',         fr: 'La Maison-Dieu',   th: 'ไพ่หอคอย',           vi: 'Ngọn Tháp' },
  17: { zh: '星星',     en: 'The Star',      es: 'La Estrella',      fr: 'L\'Etoile',         th: 'ไพ่ดาว',           vi: 'Ngôi Sao' },
  18: { zh: '月亮',     en: 'The Moon',      es: 'La Luna',          fr: 'La Lune',           th: 'ไพ่จันทร์',           vi: 'Mặt Trăng' },
  19: { zh: '太阳',     en: 'The Sun',       es: 'El Sol',           fr: 'Le Soleil',         th: 'ไพ่อาทิตย์',            vi: 'Mặt Trời' },
  20: { zh: '审判',     en: 'Judgement',    es: 'El Juicio',        fr: 'Le Jugement',       th: 'ไพ่คำพิพากษา',          vi: 'Sự Phán Xét' },
  21: { zh: '世界',     en: 'The World',    es: 'El Mundo',          fr: 'Le Monde',          th: 'ไพ่โลก',          vi: 'Thế Giới' },
};

const ORIENTATION_LABELS: Record<AlgLang, { upright: string; reversed: string }> = {
  zh: { upright: '正位', reversed: '逆位' },
  en: { upright: 'Upright', reversed: 'Reversed' },
  es: { upright: 'Normal', reversed: 'Invertido' },
  fr: { upright: 'Droit', reversed: 'Inversé' },
  th: { upright: 'ตั้งตรง', reversed: 'กลับหลัง' },
  vi: { upright: 'Thuận', reversed: 'Nghịch' },
};

// ── 星座模式（基本/固定/变动）─
const ZODIAC_MODES: Record<string, Record<AlgLang, string>> = {
  '基本': { zh: '基本', en: 'Cardinal', es: 'Cardinal', fr: 'Cardinal', th: 'ราศีเริ่มต้น', vi: 'Cung Thống Lĩnh' },
  '固定': { zh: '固定', en: 'Fixed', es: 'Fijo', fr: 'Fixe', th: 'ราศีคงที่', vi: 'Cung Cố Định' },
  '变动': { zh: '变动', en: 'Mutable', es: 'Mutable', fr: 'Mutable', th: 'ราศีเปลี่ยนแปลง', vi: 'Cung Linh Hoạt' },
};

// ── 行星守护星 ──
const RULER_NAMES: Record<string, Record<AlgLang, string>> = {
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

// ── 变爻描述翻译（处理"第2爻动"或纯数字）──
const CHANGING_LINE_LABELS: Record<AlgLang, { prefix: string; suffix: string }> = {
  zh: { prefix: '第', suffix: '爻动' },
  en: { prefix: 'Line ', suffix: ' changes' },
  es: { prefix: 'Línea ', suffix: ' cambia' },
  fr: { prefix: 'Ligne ', suffix: ' change' },
  th: { prefix: 'เส้นที่ ', suffix: ' เปลี่ยน' },
  vi: { prefix: 'Hào ', suffix: ' động' },
};

function tChangingLine(s: string | number, lang: AlgLang): string {
  if (typeof s === 'number') {
    const lbl = CHANGING_LINE_LABELS[lang];
    return `${lbl.prefix}${s}${lbl.suffix}`;
  }
  if (lang === 'zh') return s;
  // 处理中文描述里的数字
  return s.replace(/第(\d+)爻动/g, (_, n) => `${CHANGING_LINE_LABELS[lang].prefix}${n}${CHANGING_LINE_LABELS[lang].suffix}`);
}

export function tZodiacMode(mode: string, lang: AlgLang): string {
  return ZODIAC_MODES[mode]?.[lang] ?? mode;
}

export function tRuler(ruler: string, lang: AlgLang): string {
  return RULER_NAMES[ruler]?.[lang] ?? ruler;
}

export function tChanging(s: string | number, lang: AlgLang): string {
  return tChangingLine(s, lang);
}


export function tTarotName(cardId: number, lang: AlgLang): string {
  return TAROT_CARD_NAMES[cardId]?.[lang] ?? TAROT_CARD_NAMES[cardId]?.en ?? `Card ${cardId}`;
}

export function tOrientation(orientation: string, lang: AlgLang): string {
  const isReversed = orientation.toLowerCase().includes('reversed');
  return ORIENTATION_LABELS[lang]?.[isReversed ? 'reversed' : 'upright'] ?? orientation;
}


// ── 易经六十四卦全名 ──
const HEXAGRAM_NAMES: Record<string, Record<AlgLang, string>> = {
  '乾为天':    { zh: '乾为天',    en: 'Qian / Heaven',       es: 'Qian / Cielo',       fr: 'Qian / Ciel',        th: 'เชียน / สวรรค์',      vi: 'Càn / Thiên' },
  '坤为地':    { zh: '坤为地',    en: 'Kun / Earth',         es: 'Kun / Tierra',        fr: 'Kun / Terre',         th: 'คุน / ดิน',           vi: 'Khôn / Địa' },
  '水雷屯':    { zh: '水雷屯',    en: 'Kan / Thunder',       es: 'Kan / Trueno',        fr: 'Kan / Tonnerre',     th: 'คัน / อินทรี',        vi: 'Trừng / Lôi' },
  '山水蒙':    { zh: '山水蒙',    en: 'Gen / Mountain',      es: 'Gen / Montaña',       fr: 'Gen / Montagne',     th: 'เกิน / เขา',          vi: 'Mông / Sơn' },
  '水天需':    { zh: '水天需',    en: 'Kan / Heaven',        es: 'Kan / Cielo',         fr: 'Kan / Ciel',         th: 'คัน / สวรรค์',        vi: 'Tu / Thiên' },
  '天水讼':    { zh: '天水讼',    en: 'Heaven / Kan',        es: 'Cielo / Kan',         fr: 'Ciel / Kan',         th: 'สวรรค์ / คัน',        vi: 'Tụng / Thủy' },
  '地水师':    { zh: '地水师',    en: 'Earth / Kan',         es: 'Tierra / Kan',        fr: 'Terre / Kan',        th: 'ดิน / คัน',            vi: 'Sư / Thủy' },
  '水地比':    { zh: '水地比',    en: 'Kan / Earth',         es: 'Kan / Tierra',        fr: 'Kan / Terre',        th: 'คัน / ดิน',            vi: 'Tỷ / Địa' },
  '风天小畜':  { zh: '风天小畜',  en: 'Xun / Heaven',       es: 'Xun / Cielo',         fr: 'Xun / Ciel',         th: 'ซุน / สวรรค์',        vi: 'Tiểu Túc / Thiên' },
  '天泽履':    { zh: '天泽履',    en: 'Heaven / Dui',        es: 'Cielo / Dui',         fr: 'Ciel / Dui',         th: 'สวรรค์ / ทะเลสาบ',    vi: 'Lý / Trạch' },
  '地天泰':    { zh: '地天泰',    en: 'Earth / Heaven',      es: 'Tierra / Cielo',      fr: 'Terre / Ciel',       th: 'ดิน / สวรรค์',        vi: 'Thái / Thiên' },
  '天地否':    { zh: '天地否',    en: 'Heaven / Earth',      es: 'Cielo / Tierra',      fr: 'Ciel / Terre',       th: 'สวรรค์ / ดิน',        vi: 'Phủ / Địa' },
  '天火同人':  { zh: '天火同人',  en: 'Heaven / Fire',       es: 'Cielo / Fuego',       fr: 'Ciel / Feu',         th: 'สวรรค์ / ไฟ',         vi: 'Đồng Nhân / Hỏa' },
  '火天大有':  { zh: '火天大有',  en: 'Fire / Heaven',       es: 'Fuego / Cielo',       fr: 'Feu / Ciel',         th: 'ไฟ / สวรรค์',         vi: 'Đại Hữu / Thiên' },
  '地山谦':    { zh: '地山谦',    en: 'Earth / Mountain',    es: 'Tierra / Montaña',    fr: 'Terre / Montagne',   th: 'ดิน / เขา',           vi: 'Khiêm / Sơn' },
  '雷地豫':    { zh: '雷地豫',    en: 'Thunder / Earth',     es: 'Trueno / Tierra',      fr: 'Tonnerre / Terre',   th: 'อินทรี / ดิน',         vi: 'Dự / Địa' },
  '泽雷随':    { zh: '泽雷随',    en: 'Lake / Thunder',      es: 'Lago / Trueno',        fr: 'Lac / Tonnerre',     th: 'ทะเลสาบ / อินทรี',   vi: 'Tùy / Lôi' },
  '山风蛊':    { zh: '山风蛊',    en: 'Mountain / Wind',     es: 'Montaña / Viento',     fr: 'Montagne / Vent',    th: 'เขา / ลม',            vi: 'Cổ / Phong' },
  '地泽临':    { zh: '地泽临',    en: 'Earth / Lake',        es: 'Tierra / Lago',        fr: 'Terre / Lac',        th: 'ดิน / ทะเลสาบ',      vi: 'Lâm / Trạch' },
  '风地观':    { zh: '风地观',    en: 'Wind / Earth',        es: 'Viento / Tierra',      fr: 'Vent / Terre',       th: 'ลม / ดิน',            vi: 'Quan / Địa' },
  '火雷噬嗑':  { zh: '火雷噬嗑',  en: 'Fire / Thunder',      es: 'Fuego / Trueno',       fr: 'Feu / Tonnerre',     th: 'ไฟ / อินทรี',         vi: 'Thế Hạp / Lôi' },
  '山火贲':    { zh: '山火贲',    en: 'Mountain / Fire',     es: 'Montaña / Fuego',      fr: 'Montagne / Feu',     th: 'เขา / ไฟ',           vi: 'Bễn / Hỏa' },
  '山地剥':    { zh: '山地剥',    en: 'Mountain / Earth',    es: 'Montaña / Tierra',     fr: 'Montagne / Terre',   th: 'เขา / ดิน',          vi: 'Bác / Sơn' },
  '地雷复':    { zh: '地雷复',    en: 'Earth / Thunder',     es: 'Tierra / Trueno',      fr: 'Terre / Tonnerre',   th: 'ดิน / อินทรี',        vi: 'Phục / Lôi' },
  '天雷无妄':  { zh: '天雷无妄',  en: 'Heaven / Thunder',   es: 'Cielo / Trueno',       fr: 'Ciel / Tonnerre',    th: 'สวรรค์ / อินทรี',     vi: 'Vô Vọng / Lôi' },
  '山天大畜':  { zh: '山天大畜',  en: 'Mountain / Heaven',  es: 'Montaña / Cielo',      fr: 'Montagne / Ciel',    th: 'เขา / สวรรค์',        vi: 'Đại Túc / Thiên' },
  '山雷颐':    { zh: '山雷颐',    en: 'Mountain / Thunder',  es: 'Montaña / Trueno',     fr: 'Montagne / Tonnerre',th: 'เขา / อินทรี',       vi: 'Dị / Lôi' },
  '泽风大过':  { zh: '泽风大过',  en: 'Lake / Wind',         es: 'Lago / Viento',        fr: 'Lac / Vent',         th: 'ทะเลสาบ / ลม',       vi: 'Đại Quá / Phong' },
  '坎为水':    { zh: '坎为水',    en: 'Kan / Water',         es: 'Kan / Agua',           fr: 'Kan / Eau',          th: 'คัน / น้ำ',           vi: 'Khảm / Thủy' },
  '泽为泽':    { zh: '泽为泽',    en: 'Lake / Lake',         es: 'Lago / Lago',          fr: 'Lac / Lac',          th: 'ทะเลสาบ / ทะเลสาบ',  vi: 'Đoài / Trạch' },
  '水为水':    { zh: '水为水',    en: 'Water / Water',       es: 'Agua / Agua',          fr: 'Eau / Eau',          th: 'น้ำ / น้ำ',           vi: 'Thủy / Thủy' },
  '火水未济':  { zh: '火水未济',  en: 'Fire / Water',        es: 'Fuego / Agua',         fr: 'Feu / Eau',          th: 'ไฟ / น้ำ',           vi: 'Vị Tế / Thủy' },
  '山水蹇':    { zh: '山水蹇',    en: 'Mountain / Water',    es: 'Montaña / Agua',       fr: 'Montagne / Eau',     th: 'เขา / น้ำ',          vi: 'Kiền / Thủy' },
  '风水涣':    { zh: '风水涣',    en: 'Wind / Water',        es: 'Viento / Agua',         fr: 'Vent / Eau',         th: 'ลม / น้ำ',           vi: 'Hoán / Thủy' },
  '天水困':    { zh: '天水困',    en: 'Heaven / Water',      es: 'Cielo / Agua',         fr: 'Ciel / Eau',         th: 'สวรรค์ / น้ำ',       vi: 'Khốn / Thủy' },
  '泽水困':    { zh: '泽水困',    en: 'Lake / Water',        es: 'Lago / Agua',           fr: 'Lac / Eau',          th: 'ทะเลสาบ / น้ำ',      vi: 'Khốn / Thủy' },
  '水泽节':    { zh: '水泽节',    en: 'Water / Lake',        es: 'Agua / Lago',           fr: 'Eau / Lac',          th: 'น้ำ / ทะเลสาบ',      vi: 'Tiết / Trạch' },
  '风泽中孚':  { zh: '风泽中孚',  en: 'Wind / Lake',         es: 'Viento / Lago',         fr: 'Vent / Lac',         th: 'ลม / ทะเลสาบ',      vi: 'Trung Phu / Trạch' },
  '雷山小过':  { zh: '雷山小过',  en: 'Thunder / Mountain',  es: 'Trueno / Montaña',      fr: 'Tonnerre / Montagne',th: 'อินทรี / เขา',      vi: 'Tiểu Quá / Sơn' },
  '水火既济':  { zh: '水火既济',  en: 'Water / Fire',         es: 'Agua / Fuego',          fr: 'Eau / Feu',          th: 'น้ำ / ไฟ',           vi: 'Ký Tế / Hỏa' },
  '雷水解':    { zh: '雷水解',    en: 'Thunder / Water',    es: 'Trueno / Agua',         fr: 'Tonnerre / Eau',     th: 'อินทรี / น้ำ',       vi: 'Giải / Thủy' },
  '风火家人':  { zh: '风火家人',  en: 'Wind / Fire',         es: 'Viento / Fuego',        fr: 'Vent / Feu',         th: 'ลม / ไฟ',            vi: 'Gia Nhân / Hỏa' },
  '火泽睽':    { zh: '火泽睽',    en: 'Fire / Lake',         es: 'Fuego / Lago',          fr: 'Feu / Lac',          th: 'ไฟ / ทะเลสาบ',      vi: 'Khuê / Trạch' },
  '水火既':    { zh: '水火既',    en: 'Water / Fire',         es: 'Agua / Fuego',          fr: 'Eau / Feu',          th: 'น้ำ / ไฟ',           vi: 'Ký Tế / Hỏa' },
  '山火贵':    { zh: '山火贵',    en: 'Mountain / Fire',     es: 'Montaña / Fuego',        fr: 'Montagne / Feu',     th: 'เขา / ไฟ',           vi: 'Bễn / Hỏa' },
  '天火鼎':    { zh: '天火鼎',    en: 'Heaven / Fire',        es: 'Cielo / Fuego',         fr: 'Ciel / Feu',         th: 'สวรรค์ / ไฟ',        vi: 'Đỉnh / Hỏa' },
  '雷震':      { zh: '雷震',      en: 'Thunder',             es: 'Trueno',                fr: 'Tonnerre',           th: 'อินทรี',              vi: 'Chấn' },
  '巽为风':    { zh: '巽为风',    en: 'Xun / Wind',           es: 'Xun / Viento',          fr: 'Xun / Vent',         th: 'ซุน / ลม',           vi: 'Tốn / Phong' },
  '兑为泽':    { zh: '兑为泽',    en: 'Dui / Lake',           es: 'Dui / Lago',            fr: 'Dui / Lac',          th: 'ตุย / ทะเลสาบ',      vi: 'Đoài / Trạch' },

};

/** 翻译易经卦名（如"兑"或"兑为泽"或"风天小畜"） */
export function tHexagram(name: string, lang: AlgLang): string {
  if (lang === 'zh') return name;
  // 精确匹配全名
  if (HEXAGRAM_NAMES[name]?.[lang]) return HEXAGRAM_NAMES[name][lang];
  // 尝试只翻译第一个字（单卦名）
  const first = name[0];
  if (BAGUA[first]?.[lang]) return BAGUA[first][lang];
  // 回退英文首字母大写
  return name;
}

// Tarot card short meanings (for wealth report)
const TAROT_MEANINGS: Record<number, Record<AlgLang, string>> = {
  0: { zh: '新开始与冒险——踏入未知的财务领域。', en: 'New beginnings and adventure—step into the unknown financial territory.', es: 'Nuevos comienzos y aventura—entra en el territorio financiero desconocido.', fr: 'Nouveaux départs et aventure—entrez sur le territoire financier inconnu.', th: 'การเริ่มต้นใหม่และการผจญภัย—ก้าวสู่ดินแดนทางการเงินที่ไม่รู้จัก', vi: 'Khởi đầu mới và phiêu lưu—bước vào vùng đất tài chính chưa biết.' },
  1: { zh: '财富显化的力量——你的财务工具已就绪。', en: 'Wealth manifestation power—your financial tools are ready.', es: 'Poder de manifestación de riqueza—tus herramientas financieras están listas.', fr: 'Pouvoir de manifestation de richesse—vos outils financiers sont prêts.', th: 'พลังแสดงออกความมั่งคั่ง—เครื่องมือทางการเงินของคุณพร้อมแล้ว', vi: 'Quyền năng hiện thực hóa tài lộc—công cụ tài chính đã sẵn sàng.' },
  2: { zh: '财务直觉达到顶峰——相信你的金钱直觉。', en: 'Financial intuition peaks—trust your money gut today.', es: 'La intuición financiera alcanza su punto máximo—confía en tu instinto de dinero.', fr: 'L\'intuition financière culmine—faites confiance à votre instinct.', th: 'สัญชาตญาณทางการเงินถึงจุดสูงสุด—ไว้ใจความรู้สึกเรื่องเงินวันนี้', vi: 'Trực giác tài chính đạt đỉnh—tin vào bản năng tiền bạc hôm nay.' },
  3: { zh: '财务丰盛流动——财富伴随耐心呵护而增长。', en: 'Financial abundance flows—wealth grows with patient care.', es: 'La abundancia financiera fluye—la riqueza crece con cuidado paciente.', fr: 'L\'abondance financière coule—la richesse croît avec des soins patients.', th: 'ความอุดมสมบูรณ์ทางการเงินไหลมา—ความมั่งคั่งเติบโตด้วยการดูแลอย่างอดทน', vi: 'Tài lộc dồi dào chảy đến—của cải lớn lên nhờ sự kiên nhẫn.' },
  4: { zh: '坚实的财务基础——用清晰的规则建立财富。', en: 'Solid financial foundation—build wealth with clear rules.', es: 'Base financiera sólida—construye riqueza con reglas claras.', fr: 'Base financière solide—construisez la richesse avec des règles claires.', th: 'ฐานะทางการเงินมั่นคง—สร้างความมั่งคั่งด้วยกฎที่ชัดเจน', vi: 'Nền tảng tài chính vững chắc—xây dựng của cải với quy tắc rõ ràng.' },
  5: { zh: '财富对齐——你的金钱道路与价值观一致。', en: 'Wealth alignment—your money path matches your values.', es: 'Alineación de riqueza—tu camino del dinero coincide con tus valores.', fr: 'Alignement de richesse—votre chemin financier correspond à vos valeurs.', th: 'การจัดตำแหน่งความมั่งคั่ง—เส้นทางเงินของคุณตรงกับค่านิยม', vi: 'Tài lộc thẳng hàng—con đường tiền bạc phù hợp giá trị.' },
  6: { zh: '财务决策点——跟随你的财富之心。', en: 'Financial decision point—follow your money heart.', es: 'Punto de decisión financiera—sigue tu corazón financiero.', fr: 'Point de décision financière—suivez votre cœur financier.', th: 'จุดตัดสินใจทางการเงิน—ตามหัวใจเงินของคุณ', vi: 'Điểm quyết định tài chính—theo trái tim tiền bạc.' },
  7: { zh: '不可阻挡的财务势头——自信执行财富决策。', en: 'Unstoppable financial momentum—execute wealth decisions with confidence.', es: 'Impulso financiero imparable—ejecuta decisiones de riqueza con confianza.', fr: 'Élan financier irrésistible—exécutez vos décisions avec confiance.', th: 'โมเมนตัมทางการเงินที่หยุดไม่ได้—ดำเนินการตัดสินใจด้านความมั่งคั่งอย่างมั่นใจ', vi: 'Đà tài chính không thể ngăn cản—thực hiện quyết định thịnh vượng với tự tin.' },
  8: { zh: '内在财务力量——温柔的力量正在觉醒。', en: 'Inner financial power—gentle wealth strength awakens.', es: 'Poder financiero interior—una fuerza de riqueza gentil despierta.', fr: 'Pouvoir financier intérieur—une force de richesse douce s\'éveille.', th: 'พลังการเงินภายใน—พลังแห่งความมั่งคั่งที่อ่อนโยนกำลังตื่นขึ้น', vi: 'Sức mạnh tài chính bên trong—năng lượng dịu dàng đang thức tỉnh.' },
  9: { zh: '内在财富智慧——独处带来金钱洞见。', en: 'Financial wisdom within—solitude brings money insights.', es: 'Sabiduría financiera interior—la soledad trae perspectivas de dinero.', fr: 'Sagesse financière intérieure—la solitude apporte des perspectives.', th: 'ปัญญาทางการเงินจากภายใน—ความสันโดษนำมาซึ่งความเข้าใจเรื่องเงิน', vi: 'Trí tuệ giàu có bên trong—một mình mang lại góc nhìn mới.' },
  10: { zh: '财务周期转动——好运青睐大胆的财务行动。', en: 'Financial cycle turns—fortune favors bold money moves.', es: 'El ciclo financiero gira—la fortuna favorece movimientos audaces.', fr: 'Le cycle financier tourne—la fortune favorise les actions audacieuses.', th: 'วงจรทางการเงินหมุน—โชคสนับสนุนการเคลื่อนไหวทางการเงินที่กล้าหาญ', vi: 'Chu kỳ tài lộc đang quay—vận may ủng hộ động thái táo bạo.' },
  11: { zh: '财务因果平衡——金钱公正到来。', en: 'Financial karma balance—money justice arrives.', es: 'Equilibrio del karma financiero—la justicia del dinero llega.', fr: 'Équilibre du karma financier—la justice monétaire arrive.', th: 'สมดุลกรรมทางการเงิน—ความยุติธรรมของเงินมาถึง', vi: 'Cân bằng nghiệp tài chính—công lý tiền bạc đến.' },
  12: { zh: '财务视角转换——需要新的金钱视野。', en: 'Financial perspective shift—new money vision needed.', es: 'Cambio de perspectiva financiera—nueva visión del dinero necesaria.', fr: 'Changement de perspective financière—une nouvelle vision s\'impose.', th: 'การเปลี่ยนมุมมองทางการเงิน—ต้องการวิสัยทัศน์ใหม่เรื่องเงิน', vi: 'Chuyển góc nhìn tài chính—cần tầm nhìn mới.' },
  13: { zh: '财务转型——旧的财务自我消亡，新的诞生。', en: 'Financial transformation—old money self dies, new emerges.', es: 'Transformación financiera—el viejo yo financiero muere, el nuevo emerge.', fr: 'Transformation financière—l\'ancien moi meurt, le nouveau naît.', th: 'การเปลี่ยนแปลงทางการเงิน—ตัวตนทางการเงินเดิมตาย ตัวใหม่เกิด', vi: 'Biến đổi tài chính—cái tôi cũ mất đi, cái mới sinh ra.' },
  14: { zh: '财务平衡——适度的方式获胜。', en: 'Financial balance—moderate approach wins.', es: 'Equilibrio financiero—el enfoque moderado gana.', fr: 'Équilibre financier—l\'approche modérée paie.', th: 'ความสมดุลทางการเงิน—แนวทางปานกลางชนะ', vi: 'Cân bằng tài chính—cách tiếp cận vừa phải thắng.' },
  15: { zh: '面对财务阴影——直面你的金钱魔鬼以获胜。', en: 'Face your money shadow—confront your financial demons to win.', es: 'Enfrenta tu sombra financiera—enfrenta tus demonios de dinero para ganar.', fr: 'Affrontez votre ombre financière—affrontez vos démons pour gagner.', th: 'เผชิญเงาทางการเงินของคุณ—เผชิญปีศาจเงินเพื่อชนะ', vi: 'Đối mặt bóng tối tài chính—chạm trán quỷ dữ để thắng.' },
  16: { zh: '财务突破——突然的变化即将来临。', en: 'Financial breakthrough—sudden change incoming.', es: 'Avance financiero—cambio repentino entrante.', fr: 'Percée financière—changement soudain imminent.', th: 'การทะลุทางการเงิน—การเปลี่ยนแปลงฉับพลันกำลังมา', vi: 'Đột phá tài chính—thay đổi đột ngột sắp đến.' },
  17: { zh: '财务希望回归——财富之星指引你的道路。', en: 'Financial hope returns—wealth star guides your path.', es: 'La esperanza financiera regresa—la estrella de riqueza guía tu camino.', fr: 'L\'espoir financier revient—l\'étoile de richesse guide votre chemin.', th: 'ความหวังทางการเงินกลับมา—ดาวความมั่งคั่งนำทางคุณ', vi: 'Hy vọng tài chính quay lại—ngôi sao may mắn chỉ đường.' },
  18: { zh: '财务直觉达到顶峰——月亮魔法起作用。', en: 'Financial intuition peaks—moon magic works.', es: 'La intuición financiera alcanza su pico—la magia lunar funciona.', fr: 'L\'intuition financière culmine—la magie lunaire fonctionne.', th: 'สัญชาตญาณทางการเงินถึงจุดสูงสุด—เวทมนตร์จันทรคติใช้ได้ผล', vi: 'Trực giác tài chính lên đỉnh—phép thuật mặt trăng hiệu nghiệm.' },
  19: { zh: '辉煌的财务成功——财富之光祝福你。', en: 'Brilliant financial success—wealth light blesses you.', es: 'Éxito financiero brillante—la luz de dinero te bendice.', fr: 'Succès financier brillant—la lumière de richesse vous bénit.', th: 'ความสำเร็จทางการเงินอันสุกสว่าง—แสงความมั่งคั่งโปรดคุณ', vi: 'Thành công tài chính rực rỡ—ánh sáng may mắn phù hộ.' },
  20: { zh: '财务重生——财富的呼唤被听见。', en: 'Financial rebirth—wealth call is heard.', es: 'Renacimiento financiero—el llamado de la riqueza es escuchado.', fr: 'Renaissance financière—l\'appel de la richesse est entendu.', th: 'การเกิดใหม่ทางการเงิน—เสียงเรียกความมั่งคั่งถูกได้ยิน', vi: 'Tái sinh tài chính—tiếng gọi giàu có được nghe.' },
  21: { zh: '财务周期完成——财富世界正在转变。', en: 'Financial cycle complete—wealth world transforms.', es: 'Ciclo financiero completo—el mundo del dinero se transforma.', fr: 'Cycle financier complet—le monde de la richesse se transforme.', th: 'วงจรทางการเงินสมบูรณ์—โลกความมั่งคั่งกำลังเปลี่ยน', vi: 'Chu kỳ tài chính hoàn tất—thế giới tiền bạc đang biến đổi.' },
};

export function tTarotMeaning(cardId: number, lang: AlgLang): string {
  return TAROT_MEANINGS[cardId]?.[lang] ?? TAROT_MEANINGS[cardId]?.en ?? `Card ${cardId}`;
}
