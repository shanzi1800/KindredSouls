// @ts-nocheck
// ═════════════════════════════════════════
// Algorithm-layer i18n translations
// All user-facing text from bazi/zodiac/iching engines
// ═════════════════════════════════════════

export type AlgLang = 'zh' | 'en' | 'es' | 'fr';

// ── Shared keys ──
const SHARED: Record<AlgLang, Record<string, string>> = {
  zh: {
    // Scores
    deep_fate: '缘分深厚，相遇概率极低',
    wuxing_potential: '五行互补潜力大',
    zodiac_harmony: '星座相位和谐',
    iching_trend: '卦象趋势向好',
    attraction_strong: '天然吸引力强',
    comm_low_cost: '沟通成本低',
    stability_good: '长期发展前景好',
    comm_patience: '需要更多耐心倾听彼此',
    stability_goal: '需要建立共同目标',
    chemistry_cultivate: '肢体语言和亲密感有待培养',
    bazi_polish: '性格底层差异需磨合',
    zodiac_misalign: '表达方式可能不同频',
    growth_will: '双方都有成长意愿',
    freshness: '保持新鲜感需要持续投入',
    // Score labels
    score_high: '缘分深厚，珍惜彼此',
    score_mid: '基础良好，用心经营',
    score_low: '需要磨合，但值得努力',
  },
  en: {
    deep_fate: 'Deep connection, rare cosmic alignment',
    wuxing_potential: 'Strong elemental complementarity',
    zodiac_harmony: 'Harmonious zodiac aspects',
    iching_trend: 'Positive I Ching trajectory',
    attraction_strong: 'Natural magnetic attraction',
    comm_low_cost: 'Effortless communication flow',
    stability_good: 'Strong long-term potential',
    comm_patience: 'Practice more patient listening',
    stability_goal: 'Build shared goals together',
    chemistry_cultivate: 'Physical intimacy needs nurturing',
    bazi_polish: 'Core personality differences to bridge',
    zodiac_misalign: 'Expression styles may differ',
    growth_will: 'Both share a willingness to grow',
    freshness: 'Keeping spark alive takes effort',
    score_high: 'Deep bond, cherish each other',
    score_mid: 'Solid foundation, nurture it',
    score_low: 'Needs work, but worth the effort',
  },
  es: {
    deep_fate: 'Conexión profunda, rara alineación cósmica',
    wuxing_potential: 'Fuerte complementariedad elemental',
    zodiac_harmony: 'Aspectos armónicos del zodiaco',
    iching_tendencia: 'Tendencia positiva del I Ching',
    attraction_strong: 'Atracción natural magnética',
    comm_low_cost: 'Comunicación fluida sin esfuerzo',
    stability_good: 'Fuerte potencial a largo plazo',
    comm_patience: 'Practica escuchar con más paciencia',
    stability_goal: 'Construir metas compartidas juntas',
    chemistry_cultivar: 'La intimidad física necesita cuidado',
    bazi_pulir: 'Diferencias de personalidad base que superar',
    zodiac_desalineado: 'Los estilos de expresión pueden diferir',
    growth_voluntad: 'Ambas comparten voluntad de crecer',
    freshness: 'Mantener la chispa viva requiere esfuerzo',
    score_high: 'Vínculo profundo, apreciense mutuamente',
    score_mid: 'Base sólida, cuídenla',
    score_low: 'Requiere trabajo, pero vale la pena',
  },
  fr: {
    deep_fate: 'Connexion profonde, rare alignement cosmique',
    wuxing_potential: 'Forte complémentarité élémentaire',
    zodiac_harmony: 'Aspects harmonieux du zodiaque',
    iching_tendance: 'Tendance positive du Yi Jing',
    attraction_strong: 'Attraction magnétique naturelle',
    comm_low_cost: 'Communication fluide sans effort',
    stability_good: 'Fort potentiel à long terme',
    comm_patience: 'Pratiquez une écoute plus patiente',
    stability_goal: 'Construisez des objectifs ensemble',
    chemistry_cultiver: "L'intimité physique demande des soins",
    bazi_polir: 'Différences de personnalité de base à combler',
    zodiac_désaligné: 'Les styles d\'expression peuvent différer',
    growth_volonté: 'Les deux partagent la volonté de grandir',
    freshness: 'Garder l\'étincelle vive demande des efforts',
    score_high: 'Lien profond, chérissez-vous mutuellement',
    score_mid: 'Base solide, entretenez-la',
    score_low: 'Nécessite du travail, mais cela en vaut la peine',
  },
};

// ── BaZi specific ──
const BAZI_TEMPLATES: Record<AlgLang, {
  summary_high: string;
  summary_mid: string;
  summary_low: string;
  summary_verylow: string;
  sipan_title: string;
  you_label: string;
  ta_label: string;
  rishi_title: string;
  rishi_similar: string;
  rishi_complement: string;
  rishi_difficult: string;
  hehun_title: string;
  detail_prefix: string;
}> = {
  zh: {
    summary_high: (d1, d2) => `日主${d1}遇${d2}，天干有情，地支有合，属上等姻缘。`,
    summary_mid: (d1p, d2p) => `日柱${d1p}与${d2p}五行互根，彼此能互相成就。`,
    summary_low: '命盘显示性格互补空间大，用心经营可渐入佳境。',
    summary_verylow: '五行配置差异较大，但差异正是成长契机，关键在包容。',
    sipan_title: '【四柱排盘】',
    you_label: '你：',
    ta_label: 'TA：',
    rishi_title: '【日主分析】',
    rishi_similar: '两者性质相近，默契天然。',
    rishi_complement: '性质不同但能互补，互相激发潜能。',
    rishi_difficult: '性质差异较大，需要更多理解和磨合。',
    hehun_title: '【合婚关系】',
    detail_prefix: '综合评分：',
  },
  en: {
    summary_high: (d1, d2) => `Day Master ${d1} meets ${d2} — heavenly stems harmonize, earthly branches align. A superior match.`,
    summary_mid: (d1p, d2p) => `Day Pillar ${d1p} and ${d2p}: five elements interlock, each empowers the other.`,
    summary_low: 'Charts show strong complementary potential — with care, this relationship blossoms.',
    summary_verylow: 'Elemental configurations differ notably, but differences are growth opportunities. Tolerance is key.',
    sipan_title: '[Four Pillars Chart]',
    you_label: 'You: ',
    ta_label: 'Partner: ',
    rishi_title: '[Day Master Analysis]',
    rishi_similar: 'Similar natures — natural rapport from the start.',
    rishi_complement: 'Different yet complementary — each brings out the other\'s potential.',
    rishi_difficult: 'Notable differences — requires more understanding and patience.',
    hehun_title: '[Marital Harmony]',
    detail_prefix: 'Overall Score: ',
  },
  es: {
    summary_high: (d1, d2) => `Maestro día ${d1} encuentra ${d2} — tallos celestiales armonizan, ramas terrestres se alinean. Una unión superior.`,
    summary_mid: (d1p, d2p) => `Pilar Día ${d1p} y ${d2p}: cinco elementos se entrelazan, cada uno potencia al otro.`,
    summary_low: 'Los gráficos muestran fuerte potencial complementario — con cuidado, esta relación florece.',
    summary_verylow: 'Las configuraciones elementales difieren notablemente, pero las diferencias son oportunidades de crecimiento. La tolerancia es clave.',
    sipan_title: '[Carta Cuatro Pilares]',
    you_label: 'Tú: ',
    ta_label: 'Pareja: ',
    rishi_title: '[Análisis Maestro Día]',
    rishi_similar: 'Naturalezas similares — rapport natural desde el inicio.',
    rishi_complement: 'Diferentes pero complementarios — cada uno saca el potencial del otro.',
    rishi_difficult: 'Diferencias notables — requiere más comprensión y paciencia.',
    hehun_title: '[Armonía Matrimonial]',
    detail_prefix: 'Puntuación General: ',
  },
  fr: {
    summary_high: (d1, d2) => `Maître Jour ${d1} rencontre ${d2} — tiges célestes s\'harmonisent, branches terrestres s\'alignent. Une union supérieure.`,
    summary_mid: (d1p, d2p) => `Pilier Jour ${d1p} et ${d2p} : cinq éléments s\'entrelacent, chacun renforce l\'autre.`,
    summary_low: 'Les graphiques montrent un fort potentiel complémentaire — avec soin, cette relation s\'épanouit.',
    summary_verylow: 'Les configurations élémentaires diffèrent notablement, mais les différences sont des opportunités de croissance. La tolérance est la clé.',
    sipan_title: '[Carte Quatre Piliers]',
    you_label: 'Vous : ',
    ta_label: 'Partenaire : ',
    rishi_title: '[Analyse Maître Jour]',
    rishi_similar: 'Natures similaires — naturellement en phase dès le départ.',
    rishi_complement: 'Différents mais complémentaires — chacun libère le potentiel de l\'autre.',
    rishi_difficult: 'Différences notables — nécessite plus de compréhension et de patience.',
    hehun_title: '[Harmonie Conjugale]',
    detail_prefix: 'Score Global : ',
  },
};

// ── Zodiac specific ──
const ZODIAC_TEMPLATES: Record<AlgLang, {
  summary_high: string;
  summary_mid: string;
  summary_low: string;
  aspect_trine: string;
  aspect_sextile: string;
  aspect_square: string;
  aspect_opposition: string;
  element_match: string;
  element_complement: string;
  element_clash: string;
  modality_harmony: string;
  detail_prefix: string;
}> = {
  zh: {
    summary_high: (s1, s2, asp) => `${s1}（你）遇${s2}（TA），星座能量形成有趣的${asp}反应。`,
    summary_mid: (s1, s2) => `${s1}与${s2}的组合有独特的化学反应，值得深入探索。`,
    summary_low: (s1, s2) => `${s1}和${s2}的配置需要更多理解，但差异中藏着惊喜。`,
    aspect_trine: '三分相（120°）— 天然和谐，如鱼得水',
    aspect_sextile: '六分相（60°）— 机会与成长',
    aspect_square: '四分相（90°）— 张力激发成长',
    aspect_opposition: '对冲相（180°）— 吸引与挑战并存',
    element_match: '同元素 — 灵魂层面的深层理解',
    element_complement: '互补元素 — 彼此补全对方缺失的拼图',
    element_clash: '冲突元素 — 需要主动调和差异',
    modality_harmony: '模式相同或互补，生活节奏自然合拍',
    detail_prefix: '综合评分：',
  },
  en: {
    summary_high: (s1, s2, asp) => `${s1} (you) meets ${s2} (partner) — cosmic energies create a fascinating ${asp}.`,
    summary_mid: (s1, s2) => `${s1} and ${s2} have unique chemistry worth exploring deeply.`,
    summary_low: (s1, s2) => `${s1} and ${s2} require more understanding, but surprises hide in differences.`,
    aspect_trine: 'Trine (120°) — natural harmony, effortless flow',
    aspect_sextile: 'Sextile (60°) — opportunity and growth',
    aspect_square: 'Square (90°) — tension that sparks growth',
    aspect_opposition: 'Opposition (180°) — attraction meets challenge',
    element_match: 'Same element — soul-level understanding',
    element_complement: 'Complementary elements — completing each other\'s puzzle',
    element_clash: 'Clashing elements — active effort to reconcile differences',
    modality_harmony: 'Matching or complementary modalities — life rhythms sync naturally',
    detail_prefix: 'Overall Score: ',
  },
  es: {
    summary_high: (s1, s2, asp) => `${s1} (tú) encuentra ${s2} (pareja) — las energías cósmicas crean un fascinante ${asp}.`,
    summary_mid: (s1, s2) => `${s1} y ${s2} tienen química única por explorar profundamente.`,
    summary_low: (s1, s2) => `${s1} y ${s2} requieren más comprensión, pero las sorpresas se esconden en las diferencias.`,
    aspect_trine: 'Trígono (120°) — armonía natural, flujo sin esfuerzo',
    aspect_sextile: 'Sextil (60°) — oportunidad y crecimiento',
    aspect_square: 'Cuadratura (90°) — tensión que enciende el crecimiento',
    aspect_opposition: 'Oposición (180°) — atracción encuentra desafío',
    element_match: 'Mismo elemento — comprensión a nivel alma',
    element_complement: 'Elementos complementarios — completando el rompecabezas del otro',
    element_clash: 'Elementos en conflicto — esfuerzo activo para reconciliar diferencias',
    modality_harmony: 'Modalidades coincidentes o complementarias — los ritmos de vida sincronizan naturalmente',
    detail_prefix: 'Puntuación General: ',
  },
  fr: {
    summary_high: (s1, s2, asp) => `${s1} (vous) rencontre ${s2} (partenaire) — les énergies cosmiques créent un fascinant ${asp}.`,
    summary_mid: (s1, s2) => `${s1} et ${s2} ont une chimie unique à explorer en profondeur.`,
    summary_low: (s1, s2) => `${s1} et ${s2} nécessitent plus de compréhension, mais les surprises se cachent dans les différences.`,
    aspect_trine: 'Trigone (120°) — harmonie naturelle, flux sans effort',
    aspect_sextile: 'Sextile (60°) — opportunité et croissance',
    aspect_square: 'Carré (90°) — tension qui stimule la croissance',
    aspect_opposition: 'Opposition (180°) — attraction rencontre défi',
    element_match: 'Même élément — compréhension au niveau de l\'âme',
    element_complement: 'Éléments complémentaires — complétant le puzzle de l\'autre',
    element_clash: 'Éléments en conflit — effort actif pour réconcilier les différences',
    modality_harmony: 'Modalités correspondantes ou complémentaires — les rythmes de vie synchronisent naturellement',
    detail_prefix: 'Score Global : ',
  },
};

// ── I Ching specific ──
const ICHING_TEMPLATES: Record<AlgLang, {
  summary_high: string;
  summary_mid: string;
  summary_low: string;
  hexagram_prefix: string;
  changing_to: string;
  detail_prefix: string;
}> = {
  zh: {
    summary_high: (hex, target) => `占得「${hex}」，聚集之卦，缘分稳中有升。`,
    summary_mid: (hex, target) => `占得「${hex}」之卦，变${target}，缘分稳中有升。`,
    summary_low: (hex, target) => `占得「${hex}」之卦，变${target}，需耐心经营。`,
    hexagram_prefix: '占得「',
    changing_to: '」，变',
    detail_prefix: '综合评分：',
  },
  en: {
    summary_high: (hex, target) => `Drew "${hex}" — the Gathering hexagram. Connection is stable and ascending.`,
    summary_mid: (hex, target) => `Drew "${hex}" transforming into ${target} — steady upward momentum.`,
    summary_low: (hex, target) => `Drew "${hex}" transforming into ${target} — patience and cultivation advised.`,
    hexagram_prefix: 'Drew "',
    changing_to: '" transforming to ',
    detail_prefix: 'Overall Score: ',
  },
  es: {
    summary_high: (hex, target) => `Obtuvo "${hex}" — el hexagrama de Reunión. La conexión es estable y ascendente.`,
    summary_mid: (hex, target) => `Obtuvo "${hex}" transformándose en ${target} — momento ascendente estable.`,
    summary_low: (hex, target) => `Obtuvo "${hex}" transformándose en ${target} — se aconseja paciencia y cultivo.`,
    hexagram_prefix: 'Obtuvo "',
    changing_to: '" transformándose en ',
    detail_prefix: 'Puntuación General: ',
  },
  fr: {
    summary_high: (hex, target) => `A tiré "${hex}" — l\'hexagramme du Rassemblement. La connexion est stable et ascendante.`,
    summary_mid: (hex, target) => `A tiré "${hex}" se transformant en ${target} — élan ascendant stable.`,
    summary_low: (hex, target) => `A tiré "${hex}" se transformant en ${target} — patience et cultivation conseillées.`,
    hexagram_prefix: 'A tiré "',
    changing_to: '" se transformant en ',
    detail_prefix: 'Score Global : ',
  },
};

/** Get shared translation */
export function t(key: string, lang: AlgLang): string {
  return SHARED[lang]?.[key] ?? SHARED.zh[key] ?? key;
}

/** Get BaZi template */
export function bt(key: string, lang: AlgLang): any {
  return BAZI_TEMPLATES[lang]?.[key] ?? BAZI_TEMPLATES.zh[key];
}

/** Get Zodiac template */
export function zt(key: string, lang: AlgLang): any {
  return ZODIAC_TEMPLATES[lang]?.[key] ?? ZODIAC_TEMPLATES.zh[key];
}

/** Get IChing template */
export function it(key: string, lang: AlgLang): any {
  return ICHING_TEMPLATES[lang]?.[key] ?? ICHING_TEMPLATES.zh[key];
}

/** Normalize language code from i18next format */
export function normalizeLang(lang: string): AlgLang {
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('fr')) return 'fr';
  return 'en'; // default fallback
}
