export type AlgLang = "zh" | "en" | "es" | "fr" | "th" | "vi";

const SUPPORTED: AlgLang[] = ["zh", "en", "es", "fr", "th", "vi"];

export function normalizeLang(raw: string): AlgLang {
  const base = raw.split("-")[0] as string;
  return SUPPORTED.includes(base as AlgLang) ? (base as AlgLang) : "en";
}

// ── 翻译字典 ──
// 被 index.ts → generateAspects() 调用
const DICT: Record<string, Record<AlgLang, string>> = {
  deep_fate: {
    zh: '命定深缘',
    en: 'Deep Fate Connection',
    es: 'Conexión Profunda del Destino',
    fr: 'Connexion Profonde du Destin',
    th: 'มิตรภาพแห่งชะตากรรมลึกซึ้ง',
    vi: 'Sợi dây số phận sâu thẳm',
  },
  wuxing_potential: {
    zh: '五行互补潜力',
    en: 'Wu Xing Complementary Potential',
    es: 'Potencial Complementario Wu Xing',
    fr: 'Potentiel Complémentaire Wu Xing',
    th: 'ศักยภาพอู่หงิงประสานกัน',
    vi: 'Tiềm năng Ngũ Hành bù đắp',
  },
  zodiac_harmony: {
    zh: '星座和谐共振',
    en: 'Zodiac Harmonious Resonance',
    es: 'Resonancia Armoniosa del Zodíaco',
    fr: 'Résonance Harmonieuse du Zodiaque',
    th: 'เคมีดวงดาวที่ราบรื่นและเข้ากันได้ดี',
    vi: 'Cung hoàng đạo hài hòa cộng hưởng',
  },
  iching_trend: {
    zh: '易经吉卦趋势',
    en: 'I Ching Auspicious Trend',
    es: 'Tendencia Auspiciosa del I Ching',
    fr: 'Tendance Auspicieuse du Yi Jing',
    th: 'คำชี้แนะแห่งความเติบโตจากอี้จิง',
    vi: 'Xu hướng cát lợi Kinh Dịch',
  },
  attraction_strong: {
    zh: '情感吸引力强',
    en: 'Strong Emotional Attraction',
    es: 'Fuerte Atracción Emocional',
    fr: 'Forte Attraction Émotionnelle',
    th: 'แรงดึงดูดทางอารมณ์ที่รุนแรง',
    vi: 'Sức hút tình cảm mạnh mẽ',
  },
  comm_low_cost: {
    zh: '沟通成本低',
    en: 'Low Communication Cost',
    es: 'Bajo Costo de Comunicación',
    fr: 'Faible Coût de Communication',
    th: 'ต้นทุนการสื่อสารต่ำ',
    vi: 'Chi phí giao tiếp thấp',
  },
  stability_good: {
    zh: '长期稳定佳',
    en: 'Good Long-term Stability',
    es: 'Buena Estabilidad a Largo Plazo',
    fr: 'Bonne Stabilité à Long Terme',
    th: 'ความมั่นคงระยะยาวดีเยี่ยม',
    vi: 'Nền tảng vững chãi',
  },
  comm_patience: {
    zh: '沟通需耐心',
    en: 'Patience Needed in Communication',
    es: 'Paciencia Necesaria en la Comunicación',
    fr: 'Patience Nécessaire dans la Communication',
    th: 'ต้องใช้ความอดทนในการสื่อสาร',
    vi: 'Cần thêm sự thấu hiểu và kiên nhẫn',
  },
  stability_goal: {
    zh: '稳定需共同目标',
    en: 'Stability Needs Shared Goals',
    es: 'La Estabilidad Necesita Objetivos Compartidos',
    fr: 'La Stabilité Nécessite des Objectifs Communs',
    th: 'ความมั่นคงต้องการเป้าหมายร่วมกัน',
    vi: 'Cần xây dựng nền tảng chung',
  },
  chemistry_cultivate: {
    zh: '亲密感可培养',
    en: 'Intimacy Can Be Cultivated',
    es: 'La Intimidad se Puede Cultivar',
    fr: 'L\'Intimité Peut Être Cultivée',
    th: 'ความใกล้ชิดสามารถพัฒนาได้',
    vi: 'Sự thân mật có thể vun đắp',
  },
  bazi_polish: {
    zh: '八字可调和',
    en: 'BaZi Can Be Harmonized',
    es: 'El BaZi se Puede Armonizar',
    fr: 'Le BaZi Peut Être Harmonisé',
    th: 'ปาจื่อปรับสมดุลกันได้',
    vi: 'Bát Tự có thể điều hòa',
  },
  zodiac_misalign: {
    zh: '星座稍有错位',
    en: 'Slight Zodiac Misalignment',
    es: 'Ligera Desalineación del Zodíaco',
    fr: 'Légère Désalignement du Zodiaque',
    th: 'ราศีเล็กน้อยไม่สอดคล้อง',
    vi: 'Cung hoàng đạo hơi lệch nhau',
  },
  growth_will: {
    zh: '成长意愿',
    en: 'Willingness to Grow',
    es: 'Disposición a Crecer',
    fr: 'Volonté de Grandir',
    th: 'ความต้องการเติบโต',
    vi: 'Khao khát phát triển',
  },
  freshness: {
    zh: '保持新鲜感',
    en: 'Keep Freshness Alive',
    es: 'Mantener Viva la Frescura',
    fr: 'Garder la Fraîcheur Vivante',
    th: 'เติมไฟและรักษาความตื่นเต้นในความรัก',
    vi: 'Giữ gìn sự mới mẻ',
  },
};

/** 翻译函数（index.ts 中以 `t as at` 导入） */
export function t(key: string, lang: AlgLang): string {
  return DICT[key]?.[lang] ?? key;
}
