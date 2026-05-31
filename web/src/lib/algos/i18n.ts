export type AlgLang = "zh" | "en" | "es" | "fr";

const SUPPORTED: AlgLang[] = ["zh", "en", "es", "fr"];

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
  },
  wuxing_potential: {
    zh: '五行互补潜力',
    en: 'Wu Xing Complementary Potential',
    es: 'Potencial Complementario Wu Xing',
    fr: 'Potentiel Complémentaire Wu Xing',
  },
  zodiac_harmony: {
    zh: '星座和谐共振',
    en: 'Zodiac Harmonious Resonance',
    es: 'Resonancia Armoniosa del Zodíaco',
    fr: 'Résonance Harmonieuse du Zodiaque',
  },
  iching_trend: {
    zh: '易经吉卦趋势',
    en: 'I Ching Auspicious Trend',
    es: 'Tendencia Auspiciosa del I Ching',
    fr: 'Tendance Auspicieuse du Yi Jing',
  },
  attraction_strong: {
    zh: '情感吸引力强',
    en: 'Strong Emotional Attraction',
    es: 'Fuerte Atracción Emocional',
    fr: 'Forte Attraction Émotionnelle',
  },
  comm_low_cost: {
    zh: '沟通成本低',
    en: 'Low Communication Cost',
    es: 'Bajo Costo de Comunicación',
    fr: 'Faible Coût de Communication',
  },
  stability_good: {
    zh: '长期稳定佳',
    en: 'Good Long-term Stability',
    es: 'Buena Estabilidad a Largo Plazo',
    fr: 'Bonne Stabilité à Long Terme',
  },
  comm_patience: {
    zh: '沟通需耐心',
    en: 'Patience Needed in Communication',
    es: 'Paciencia Necesaria en la Comunicación',
    fr: 'Patience Nécessaire dans la Communication',
  },
  stability_goal: {
    zh: '稳定需共同目标',
    en: 'Stability Needs Shared Goals',
    es: 'La Estabilidad Necesita Objetivos Compartidos',
    fr: 'La Stabilité Nécessite des Objectifs Communs',
  },
  chemistry_cultivate: {
    zh: '亲密感可培养',
    en: 'Intimacy Can Be Cultivated',
    es: 'La Intimidad se Puede Cultivar',
    fr: 'L\'Intimité Peut Être Cultivée',
  },
  bazi_polish: {
    zh: '八字可调和',
    en: 'BaZi Can Be Harmonized',
    es: 'El BaZi se Puede Armonizar',
    fr: 'Le BaZi Peut Être Harmonisé',
  },
  zodiac_misalign: {
    zh: '星座稍有错位',
    en: 'Slight Zodiac Misalignment',
    es: 'Ligera Desalineación del Zodíaco',
    fr: 'Légère Désalignement du Zodiaque',
  },
  growth_will: {
    zh: '成长意愿',
    en: 'Willingness to Grow',
    es: 'Disposición a Crecer',
    fr: 'Volonté de Grandir',
  },
  freshness: {
    zh: '保持新鲜感',
    en: 'Keep Freshness Alive',
    es: 'Mantener Viva la Frescura',
    fr: 'Garder la Fraîcheur Vivante',
  },
};

/** 翻译函数（index.ts 中以 `t as at` 导入） */
export function t(key: string, lang: AlgLang): string {
  return DICT[key]?.[lang] ?? key;
}
