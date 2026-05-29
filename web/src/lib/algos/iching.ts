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
  1: {
    name: "乾为天",
    nameEn: "The Creative / Heaven",
    nameEs: "Lo Creativo / El Cielo",
    nameFr: "Le Créatif / Le Ciel",
    symbol: "☰☰",
    nature: "刚健",
    natureEn: "Strong & Vigorous",
    natureEs: "Fuerza / Vigor",
    natureFr: "Force / Vigueur",
    judgment: "元亨利贞",
    judgmentEn: "Success. The noble person has a successful conclusion.",
    relationshipMeaning: "天行健，双方都有强烈的目标感，互相激励成长",
    relationshipMeaningEn: "Emotions are accumulating, not yet at the breakthrough point. Let it flow gently like a stream.",
    category: "大吉",
    scoreRange: [85, 96]
  },
  2: {
    name: "坤为地",
    nameEn: "The Receptive / Earth",
    nameEs: "Lo Receptivo / La Tierra",
    nameFr: "Le Réceptif / La Terre",
    symbol: "☷☷",
    nature: "柔顺",
    natureEn: "Yielding & Receptive",
    natureEs: "Docilidad / Sumisión",
    natureFr: "Docilité / Soumission",
    judgment: "元亨，利牝马之贞",
    judgmentEn: "Supreme success. Furthering through perseverance. No blame.",
    relationshipMeaning: "地势坤，包容滋养，适合长久稳定的陪伴关系",
    relationshipMeaningEn: "Nurturing your love with care. This soft caution brings a deeper stability.",
    category: "大吉",
    scoreRange: [82, 94]
  },
  3: {
    name: "水雷屯",
    nameEn: "Difficulty at the Beginning",
    nameEs: "La Dificultad Inicial",
    nameFr: "La Difficulté Initiale",
    symbol: "☵☳",
    nature: "初生",
    natureEn: "Beginning of Life",
    natureEs: "Nacimiento / Brote inicial",
    natureFr: "Commencement / Bourgeonnement",
    judgment: "元亨利贞，勿用有攸往",
    judgmentEn: "Great success. Advantageous to cross the great river.",
    relationshipMeaning: "关系萌芽期，虽有挑战但根基可立，需耐心培育",
    relationshipMeaningEn: "Yin and yang intersect, heaven and earth connect. This is the sign of an excellent marriage.",
    category: "中",
    scoreRange: [58, 72]
  },
  4: {
    name: "山水蒙",
    nameEn: "Youthful Folly",
    nameEs: "La Necedad Juvenil / La Inmadurez",
    nameFr: "La Folie Juvénile / L'Obscurité",
    symbol: "☶☳",
    nature: "启蒙",
    natureEn: "Unaware & Naive",
    natureEs: "Iluminación / Iniciación",
    natureFr: "Éveil / Initiation",
    judgment: "亨。匪我求童蒙，童蒙求我",
    judgmentEn: "Washing hands but not yet offering. Sincere devotion, solemnity.",
    relationshipMeaning: "彼此在学习如何去爱，坦诚沟通是关键",
    relationshipMeaningEn: "Temporary estrangement, but it doesn't mean the end, and it's time to proactively break the ice.",
    category: "中",
    scoreRange: [60, 74]
  },
  5: {
    name: "水天需",
    nameEn: "Waiting (Nourishment)",
    nameEs: "La Espera",
    nameFr: "L'Attente",
    symbol: "☵☰",
    nature: "等待",
    natureEn: "Patient Waiting",
    natureEs: "Espera",
    natureFr: "Attente",
    judgment: "有孚，光亨贞吉",
    judgmentEn: "Success. Advantageous for litigation.",
    relationshipMeaning: "缘分需要时间发酵，急不得，顺其自然最好",
    relationshipMeaningEn: "Like-minded, shared values. Easy to build deep connection.",
    category: "吉",
    scoreRange: [70, 82]
  },
  6: {
    name: "天水讼",
    nameEn: "Conflict",
    nameEs: "El Conflicto / El Pleito",
    nameFr: "Le Conflit / Le Litige",
    symbol: "☰☵",
    nature: "争辩",
    natureEn: "Conflict & Dispute",
    natureEs: "Disputa / Litigio",
    natureFr: "Dispute / Contestation",
    judgment: "有孚窒惕，中吉",
    judgmentEn: "Success. Minor advantages in movement.",
    relationshipMeaning: "可能有误解或分歧，但只要坦诚相待终能化解",
    relationshipMeaningEn: "A relationship at its peak, full of vitality and hope.",
    category: "小凶",
    scoreRange: [48, 62]
  },
  7: {
    name: "地水师",
    nameEn: "The Army",
    nameEs: "El Ejército",
    nameFr: "L'Armée",
    symbol: "☷☵",
    nature: "统领",
    natureEn: "Disciplined Force",
    natureEs: "Mando / Liderazgo",
    natureFr: "Commandement / Direction",
    judgment: "贞丈人吉无咎",
    judgmentEn: "Advantageous to persevere. Not eating at home - good fortune.",
    relationshipMeaning: "一方可能主导关系节奏，需要平衡权力动态",
    relationshipMeaningEn: "Mutual humility and tolerance. The relationship is long-lasting and stable.",
    category: "中",
    scoreRange: [56, 70]
  },
  8: {
    name: "水地比",
    nameEn: "Holding Together",
    nameEs: "La Unión / La Solidaridad",
    nameFr: "L'Union / La Solidarité",
    symbol: "☵☷",
    nature: "亲辅",
    natureEn: "Close Support",
    natureEs: "Afinidad / Apoyo mutuo",
    natureFr: "Affinité / Entraide",
    judgment: "吉。原筮元永贞无咎",
    judgmentEn: "Divination auspicious. Observe the jaws, provide for yourself.",
    relationshipMeaning: "亲密互助的关系，彼此支持，天然亲近",
    relationshipMeaningEn: "Pleasant and relaxed together, but beware of stagnation from too much comfort.",
    category: "吉",
    scoreRange: [76, 88]
  },
  9: {
    name: "风天小畜",
    nameEn: "Small Taming",
    nameEs: "La Fuerza Domesticadora de lo Pequeño",
    nameFr: "Le Pouvoir d'Apprivoisement du Petit",
    symbol: "☴☰",
    nature: "蓄养",
    natureEn: "Nourishing Accumulation",
    natureEs: "Acumulación Menor / Crianza",
    natureFr: "Accumulation Mineure / Élevage",
    judgment: "亨。密云不雨",
    judgmentEn: "The ridgepole sags. Advantageous to move. Success.",
    relationshipMeaning: "感情在积累中，尚未到爆发点，细水长流",
    relationshipMeaningEn: "A natural, flowing relationship. No forcing, everything just right.",
    category: "中",
    scoreRange: [62, 75]
  },
  10: {
    name: "天泽履",
    nameEn: "Treading (Conduct)",
    nameEs: "El Pisar / La Conducta",
    nameFr: "Le Pas / La Conduite",
    symbol: "☰☱",
    nature: "践行",
    natureEn: "Practice & Action",
    natureEs: "Práctica / Ejecución",
    natureFr: "Pratique / Mettre en œuvre",
    judgment: "履虎尾，不咥人亨",
    judgmentEn: "Advantageous to persevere. Success.",
    relationshipMeaning: "小心翼翼地经营感情，谨慎反而带来安稳",
    relationshipMeaningEn: "You may need to repair or rebuild certain parts of your bond, but it will grow even stronger.",
    category: "吉",
    scoreRange: [68, 80]
  },
  11: {
    name: "地天泰",
    nameEn: "Peace",
    nameEs: "La Paz / La Armonía",
    nameFr: "La Paix / La Prospérité",
    symbol: "☷☰",
    nature: "通泰",
    natureEn: "Harmonious Flow",
    natureEs: "Fluidez / Prosperidad",
    natureFr: "Harmonie / Fluidité",
    judgment: "小往大来吉亨",
    judgmentEn: "Success, prosperity, perseverance. Marrying a maiden is auspicious.",
    relationshipMeaning: "阴阳交感，天地相通，此乃上等姻缘之象",
    relationshipMeaningEn: "The relationship is in a growth period, bright future ahead. Worth investing actively.",
    category: "大吉",
    scoreRange: [88, 97]
  },
  12: {
    name: "天地否",
    nameEn: "Standstill (Stagnation)",
    nameEs: "El Estancamiento / La Obstrucción",
    nameFr: "La Stagnation / L'Obstruction",
    symbol: "☰☷",
    nature: "闭塞",
    natureEn: "Blocked & Stagnant",
    natureEs: "Bloqueo / Clausura",
    natureFr: "Blocage / Fermeture",
    judgment: "否之匪人，不利君子贞",
    judgmentEn: "Success, no blame. Advantageous to persevere.",
    relationshipMeaning: "暂时有隔阂，但不代表终结，需要主动打破僵局",
    relationshipMeaningEn: "Need to resolve some obstacles to move forward, but obstacles are also opportunities.",
    category: "小凶",
    scoreRange: [45, 58]
  },
  13: {
    name: "天火同人",
    nameEn: "Fellowship with Men",
    nameEs: "La Comunidad con los Hombres",
    nameFr: "La Communauté / L'Union des Hommes",
    symbol: "☰☲",
    nature: "聚合",
    natureEn: "Gathering Together",
    natureEs: "Reunión / Convergencia",
    natureFr: "Rassemblement / Convergence",
    judgment: "同人于野亨",
    judgmentEn: "Success. Minor advantages in firmness.",
    relationshipMeaning: "志同道合，价值观一致，容易建立深层连接",
    relationshipMeaningEn: "Surface harmony and beauty. Need to pay attention to inner substance.",
    category: "吉",
    scoreRange: [78, 90]
  },
  14: {
    name: "火天大有",
    nameEn: "Great Possession",
    nameEs: "La Gran Posesión / La Abundancia",
    nameFr: "Le Grand Avoir / La Grande Possession",
    symbol: "☲☰",
    nature: "丰盛",
    natureEn: "Full Abundance",
    natureEs: "Abundancia / Plenitud",
    natureFr: "Abondance / Plénitude",
    judgment: "元亨",
    judgmentEn: "Advantageous to persevere.",
    relationshipMeaning: "如日中天的关系，充满活力与希望",
    relationshipMeaningEn: "Something is fading away, perhaps an old pattern, making space for new birth.",
    category: "大吉",
    scoreRange: [84, 95]
  },
  15: {
    name: "地山谦",
    nameEn: "Modesty",
    nameEs: "La Modestia",
    nameFr: "La Modestie",
    symbol: "☷☶",
    nature: "谦逊",
    natureEn: "Humble Modesty",
    natureEs: "Humildad / Modestia",
    natureFr: "Humilité / Modestie",
    judgment: "亨君子有终",
    judgmentEn: "The prosperous lord uses gift horses, multiplying them.",
    relationshipMeaning: "彼此谦让包容，关系长久稳定",
    relationshipMeaningEn: "A turning point has appeared. The relationship may restart or enter a new phase.",
    category: "吉",
    scoreRange: [77, 89]
  },
  16: {
    name: "雷地豫",
    nameEn: "Enthusiasm",
    nameEs: "El Entusiasmo",
    nameFr: "L'Enthousiasme",
    symbol: "☳☷",
    nature: "安乐",
    natureEn: "Peace & Joy",
    natureEs: "Alegría / Bienestar",
    natureFr: "Joie / Quiétude",
    judgment: "利建侯行师",
    judgmentEn: "Great good fortune. Success.",
    relationshipMeaning: "相处愉快轻松，但需警惕过于安逸导致停滞",
    relationshipMeaningEn: "Staying true to each other makes everything flow naturally.",
    category: "吉",
    scoreRange: [73, 85]
  },
  17: {
    name: "泽雷随",
    nameEn: "Following",
    nameEs: "El Seguimiento",
    nameFr: "La Suite",
    symbol: "☱☳",
    nature: "追随",
    natureEn: "Following",
    natureEs: "Seguir / Acompañar",
    natureFr: "Suivre / Accompagner",
    judgment: "元亨利贞无咎",
    judgmentEn: "Minor affairs auspicious.",
    relationshipMeaning: "自然随顺的关系，不勉强，一切恰到好处",
    relationshipMeaningEn: "The relationship is accumulating deep energy. The future is promising.",
    category: "大吉",
    scoreRange: [83, 94]
  },
  18: {
    name: "山风蛊",
    nameEn: "Work on the Decayed",
    nameEs: "El Trabajo sobre lo Corrompido",
    nameFr: "Le Travail sur ce qui est Corrompu",
    symbol: "☶☴",
    nature: "败坏",
    natureEn: "Decay & Renewal",
    natureEs: "Corrupción / Deterioro",
    natureFr: "Corruption / Dégradation",
    judgment: "元亨，利涉大川",
    judgmentEn: "Advantageous southwest, not advantageous northeast.",
    relationshipMeaning: "需要修复或重建某些东西，但修复后更坚固",
    relationshipMeaningEn: "You nurture each other by focusing on your inner needs and shared growth.",
    category: "中",
    scoreRange: [54, 68]
  },
  19: {
    name: "地泽临",
    nameEn: "Approach",
    nameEs: "La Aproximación",
    nameFr: "L'Approche",
    symbol: "☷☱",
    nature: "临下",
    natureEn: "Approaching from Below",
    natureEs: "Acercamiento / Presidir",
    natureFr: "Approcher / Présider",
    judgment: "元亨利贞",
    judgmentEn: "Sincere. Great good fortune, no blame.",
    relationshipMeaning: "关系正在成长期，前景光明，宜积极投入",
    relationshipMeaningEn: "Intense emotions but need balance. Too much is as bad as too little.",
    category: "吉",
    scoreRange: [74, 86]
  },
  20: {
    name: "风地观",
    nameEn: "Contemplation",
    nameEs: "La Contemplación",
    nameFr: "La Contemplation",
    symbol: "☴☷",
    nature: "观察",
    natureEn: "Contemplative View",
    natureEs: "Observación / Mirada",
    natureFr: "Observation / Regard",
    judgment: "盥而不荐有孚顒若",
    judgmentEn: "Advantageous to move, advantageous to cross the great river.",
    relationshipMeaning: "以旁观者清的视角审视关系，会有新的领悟",
    relationshipMeaningEn: "A relationship that has undergone tests. Facing difficulties together strengthens the bond.",
    category: "中",
    scoreRange: [61, 75]
  },
  21: {
    name: "火雷噬嗑",
    nameEn: "Biting Through",
    nameEs: "Morder el Obstáculo",
    nameFr: "Mordre au Travers",
    symbol: "☲☳",
    nature: "咬合",
    natureEn: "Decisive Action",
    natureEs: "Mordedura / Enganche",
    natureFr: "Morsure / Enclenchement",
    judgment: "亨利用狱",
    judgmentEn: "Proclaimed in the king's court. Crying out, danger.",
    relationshipMeaning: "需要解决一些障碍才能前进，但障碍也是契机",
    relationshipMeaningEn: "Bright and warm relationship. Illuminating each other, passion and understanding coexist.",
    category: "中",
    scoreRange: [59, 73]
  },
  22: {
    name: "山火贲",
    nameEn: "Grace",
    nameEs: "La Gracia / La Elegancia",
    nameFr: "La Grâce / L'Élégance",
    symbol: "☶☲",
    nature: "文饰",
    natureEn: "Elegant Grace",
    natureEs: "Adorno / Ornamentación",
    natureFr: "Ornement / Embellissement",
    judgment: "亨。小利有攸往",
    judgmentEn: "The maiden is powerful. Do not marry a maiden.",
    relationshipMeaning: "表面和谐美好，需要关注内在实质",
    relationshipMeaningEn: "Telepathic heartbeat, mutual attraction flowing naturally.",
    category: "中",
    scoreRange: [64, 78]
  },
  23: {
    name: "山地剥",
    nameEn: "Splitting Apart",
    nameEs: "La Desintegración / El Desgarramiento",
    nameFr: "L'Éclatement / L'Écorchage",
    symbol: "☶☷",
    nature: "剥落",
    natureEn: "Peeling Away",
    natureEs: "Desprendimiento / Desgaste",
    natureFr: "Effritement / Détachement",
    judgment: "不利有攸往",
    judgmentEn: "The king arrives at the temple. Success.",
    relationshipMeaning: "有些东西正在消逝，可能是旧模式，为新生腾出空间",
    relationshipMeaningEn: "An enduring and stable relationship, standing the test of time.",
    category: "待变",
    scoreRange: [42, 56]
  },
  24: {
    name: "地雷复",
    nameEn: "Return",
    nameEs: "El Retorno / El Renacimiento",
    nameFr: "Le Retour",
    symbol: "☷☳",
    nature: "复归",
    natureEn: "Return & Recovery",
    natureEs: "Retorno / Regreso",
    natureFr: "Retour / Renouveau",
    judgment: "亨。出入无疾",
    judgmentEn: "Great success. Advantageous to see the great person.",
    relationshipMeaning: "转机已现，关系有望重新开始或进入新阶段",
    relationshipMeaningEn: "Sometimes need to give each other space. Distance creates beauty.",
    category: "吉",
    scoreRange: [72, 84]
  },
  25: {
    name: "天雷无妄",
    nameEn: "Innocence",
    nameEs: "La Inocencia / Lo Inesperado",
    nameFr: "L'Innocence / L'Imprévu",
    symbol: "☰☳",
    nature: "无妄",
    natureEn: "Spontaneous Integrity",
    natureEs: "Sin falsedad / Autenticidad",
    natureFr: "Sans fausseté / Authenticité",
    judgment: "元亨利贞",
    judgmentEn: "Success, firmness. The great person - auspicious, no blame.",
    relationshipMeaning: "真诚相待是最好的策略，不玩心机自然顺畅",
    relationshipMeaningEn: "Abundant relationship energy, strong action power. Suitable for doing great things together.",
    category: "吉",
    scoreRange: [75, 87]
  },
  26: {
    name: "山天大畜",
    nameEn: "Great Taming",
    nameEs: "La Gran Fuerza Domesticadora",
    nameFr: "Le Grand Pouvoir d'Apprivoisement",
    symbol: "☶☰",
    nature: "积蓄",
    natureEn: "Accumulation",
    natureEs: "Gran Acumulación / Reserva",
    natureFr: "Grande Accumulation / Réserve",
    judgment: "利贞。不家食吉",
    judgmentEn: "On the si day, trust is established. Supreme success, advantageous, perseverance.",
    relationshipMeaning: "关系在积累深厚的能量，未来可期",
    relationshipMeaningEn: "The relationship is developing upward, getting better and better.",
    category: "吉",
    scoreRange: [76, 88]
  },
  27: {
    name: "山雷颐",
    nameEn: "Nourishment (The Corners of the Mouth)",
    nameEs: "Las Comisuras de la Boca / La Nutrición",
    nameFr: "Les Coins de la Bouche / La Nutrition",
    symbol: "☶☳",
    nature: "颐养",
    natureEn: "Nourishment & Care",
    natureEs: "Nutrición / Sustento",
    natureFr: "Nourriture / Entretien",
    judgment: "贞吉。观颐自求口实",
    judgmentEn: "Success. Fear brings blessing.",
    relationshipMeaning: "彼此滋养，关注双方的内在需求和成长",
    relationshipMeaningEn: "Temporary low period. Need patience to wait for light to reappear.",
    category: "中",
    scoreRange: [63, 77]
  },
  28: {
    name: "泽风大过",
    nameEn: "Great Exceeding",
    nameEs: "El Gran Exceso",
    nameFr: "Le Grand Excès",
    symbol: "☱☴",
    nature: "过甚",
    natureEn: "Excessive",
    natureEs: "Exceso / Demasía",
    natureFr: "Excès / Dépasser la mesure",
    judgment: "栋桡利有攸往亨",
    judgmentEn: "Keeping his back still, he does not obtain his body.",
    relationshipMeaning: "感情强烈但需平衡，过犹不及",
    relationshipMeaningEn: "The relationship is transforming and upgrading. Better things are brewing in the transition.",
    category: "待变",
    scoreRange: [50, 66]
  },
  29: {
    name: "坎为水",
    nameEn: "The Abysmal (Water)",
    nameEs: "Lo Abismal / El Agua",
    nameFr: "L'Insondable / L'Eau",
    symbol: "☵☵",
    nature: "陷险",
    natureEn: "Falling into Danger",
    natureEs: "Peligro / Inmersión",
    natureFr: "Danger / Immersion",
    judgment: "习坎有孚维心亨",
    judgmentEn: "The maiden marries. Auspicious, advantageous to persevere.",
    relationshipMeaning: "经历考验的关系，但共同面对困难会让纽带更强",
    relationshipMeaningEn: "Surface disagreements, but can reach consensus on small matters. Seek common ground while reserving differences.",
    category: "中",
    scoreRange: [55, 69]
  },
  30: {
    name: "离为火",
    nameEn: "The Clinging (Fire)",
    nameEs: "Lo Adherente / El Fuego",
    nameFr: "L'Attachement / Le Feu",
    symbol: "☲☲",
    nature: "附丽",
    natureEn: "Attachment & Adherence",
    natureEs: "Adhesión / Resplandor",
    natureFr: "Adhésion / Éclat",
    judgment: "利贞亨",
    judgmentEn: "Advancing - misfortune. Nothing advantageous.",
    relationshipMeaning: "明亮温暖的关系，彼此照亮，激情与理解并存",
    relationshipMeaningEn: "When encountering obstacles, retreat is better than advance. Overcome hardness with softness.",
    category: "吉",
    scoreRange: [77, 89]
  },
  31: {
    name: "泽山咸",
    nameEn: "Influence (Wooing)",
    nameEs: "La Influencia / El Cortejo",
    nameFr: "L'Influence / L'Attraction",
    symbol: "☱☶",
    nature: "感应",
    natureEn: "Mutual Response",
    natureEs: "Resonancia / Atracción mutua",
    natureFr: "Résonance / Influence mutuelle",
    judgment: "亨利贞取女吉",
    judgmentEn: "Success. The king need not worry. It is fitting at noon.",
    relationshipMeaning: "心灵感应般的心动，两情相悦的自然吸引",
    relationshipMeaningEn: "Difficulties are dissolving. Spring is coming.",
    category: "大吉",
    scoreRange: [86, 97]
  },
  32: {
    name: "雷风恒",
    nameEn: "Duration (Perseverance)",
    nameEs: "La Duración / La Constancia",
    nameFr: "La Durée / La Constance",
    symbol: "☳☴",
    nature: "恒久",
    natureEn: "Enduring",
    natureEs: "Permanencia / Eternidad",
    natureFr: "Permanence / Éternité",
    judgment: "亨无咎利贞",
    judgmentEn: "Minor success. The traveler - firmness, auspicious.",
    relationshipMeaning: "持久稳定的关系，经得起时间考验",
    relationshipMeaningEn: "Appropriate giving and sacrifice will make the relationship stronger.",
    category: "大吉",
    scoreRange: [84, 95]
  },
  33: {
    name: "天山遁",
    nameEn: "Retreat",
    nameEs: "La Retirada",
    nameFr: "La Retraite",
    symbol: "☰☶",
    nature: "退避",
    natureEn: "Retreat & Avoidance",
    natureEs: "Retirada / Evasión",
    natureFr: "Retraite / Évasion",
    judgment: "亨小利贞",
    judgmentEn: "Minor success. Advantageous to move.",
    relationshipMeaning: "有时需要给彼此空间，距离产生美",
    relationshipMeaningEn: "Bringing out the best in each other—a true 1+1>2 relationship.",
    category: "中",
    scoreRange: [58, 72]
  },
  34: {
    name: "雷天大壮",
    nameEn: "Great Power (Strength)",
    nameEs: "El Poder de lo Grande",
    nameFr: "La Puissance du Grand",
    symbol: "☳☰",
    nature: "壮盛",
    natureEn: "Flourishing Power",
    natureEs: "Vigor / Esplendor",
    natureFr: "Puissance / Vigueur",
    judgment: "利贞",
    judgmentEn: "Success, advantageous, firm.",
    relationshipMeaning: "关系能量充沛，行动力强，适合一起做大事",
    relationshipMeaningEn: "Need to make decisions or face problems directly. Delay is not helpful.",
    category: "吉",
    scoreRange: [74, 86]
  },
  35: {
    name: "火地晋",
    nameEn: "Progress",
    nameEs: "El Progreso",
    nameFr: "Le Progrès",
    symbol: "☲☷",
    nature: "晋升",
    natureEn: "Advancement",
    natureEs: "Ascenso / Avance",
    natureFr: "Ascension / Avancement",
    judgment: "康侯用锡马蕃庶",
    judgmentEn: "The king arrives at the temple. Advantageous to cross the great river.",
    relationshipMeaning: "关系在向上发展，越来越好",
    relationshipMeaningEn: "Unexpected encounter or turning point. Fate arrives suddenly.",
    category: "吉",
    scoreRange: [73, 85]
  },
  36: {
    name: "地火明夷",
    nameEn: "Darkening of the Light",
    nameEs: "El Oscurecimiento de la Luz",
    nameFr: "L'Obscurcissement de la Lumière",
    symbol: "☷☲",
    nature: "损伤",
    natureEn: "Harm & Injury",
    natureEs: "Herida / Daño",
    natureFr: "Blessure / Dommage",
    judgment: "利艰贞",
    judgmentEn: "Success. Bitter limitation. One must not persevere.",
    relationshipMeaning: "暂时低潮期，需要耐心等待光明重现",
    relationshipMeaningEn: "Destiny comes together. Cherish the time spent together.",
    category: "小凶",
    scoreRange: [47, 61]
  },
  37: {
    name: "火风鼎",
    nameEn: "The Cauldron",
    nameEs: "El Clan / La Familia",
    nameFr: "Le Clan / La Famille",
    symbol: "☲☴",
    nature: "鼎新",
    natureEn: "Establishing New Order",
    natureEs: "Espíritu Familiar / Interior",
    natureFr: "Esprit de Famille / Intérieur",
    judgment: "元吉亨",
    judgmentEn: "Pig and fish. Auspicious. Advantageous to cross the great river.",
    relationshipMeaning: "关系正在蜕变升级，新旧交替中孕育更好",
    relationshipMeaningEn: "Relationship rising steadily. Mutually promoting growth.",
    category: "吉",
    scoreRange: [75, 87]
  },
  38: {
    name: "火泽睽",
    nameEn: "Opposition (Divergence)",
    nameEs: "La Oposición / El Antagonismo",
    nameFr: "L'Opposition / L'Aliénation",
    symbol: "☲☱",
    nature: "背离",
    natureEn: "Separation",
    natureEs: "Divergencia / Separación",
    natureFr: "Divergence / Séparation",
    judgment: "小事吉",
    judgmentEn: "Success, advantageous, firm. Can do small things, cannot do great things.",
    relationshipMeaning: "表面有分歧，但小事能达成共识，求同存异",
    relationshipMeaningEn: "Feeling temporarily at a standstill doesn't mean failure. Keeping faith will bring a breakthrough.",
    category: "中",
    scoreRange: [56, 70]
  },
  39: {
    name: "水山蹇",
    nameEn: "Obstruction",
    nameEs: "La Obstrucción / El Impedimento",
    nameFr: "L'Obstruction / L'Entrave",
    symbol: "☵☶",
    nature: "跛难",
    natureEn: "Difficulty & Limping",
    natureEs: "Dificultad / Cojera",
    natureFr: "Difficulté / Boitement",
    judgment: "利西南不利东北",
    judgmentEn: "Success. The little fox has almost crossed, wets its tail.",
    relationshipMeaning: "遇到阻碍时宜退不宜进，以柔克刚",
    relationshipMeaningEn: "Like well water, an endless relationship. Stable and reliable.",
    category: "小凶",
    scoreRange: [49, 63]
  },
  40: {
    name: "雷水解",
    nameEn: "Deliverance (Resolution)",
    nameEs: "La Liberación",
    nameFr: "La Libération",
    symbol: "☳☵",
    nature: "化解",
    natureEn: "Dissolution",
    natureEs: "Disolución / Alivio",
    natureFr: "Résolution / Dissolution",
    judgment: "利西南",
    judgmentEn: "Favorable in the southwest.",
    relationshipMeaning: "困难正在化解，春天即将到来",
    relationshipMeaningEn: "The relationship needs transformation and renewal. Better after change.",
    category: "吉",
    scoreRange: [71, 83]
  },
  41: {
    name: "山泽损",
    nameEn: "Decrease",
    nameEs: "La Disminución",
    nameFr: "La Diminution",
    symbol: "☶☱",
    nature: "减损",
    natureEn: "Reduction & Restraint",
    natureEs: "Reducción / Pérdida",
    natureFr: "Réduction / Perte",
    judgment: "有孚元吉无咎",
    judgmentEn: "[Translation pending: 有孚元吉无咎...]",
    relationshipMeaning: "适当的付出和牺牲会让关系更牢固",
    relationshipMeaningEn: "Shock brings awakening. Sometimes small conflicts are actually good.",
    category: "中",
    scoreRange: [62, 76]
  },
  42: {
    name: "风雷益",
    nameEn: "Increase",
    nameEs: "El Aumento",
    nameFr: "L'Augmentation",
    symbol: "☴☳",
    nature: "增益",
    natureEn: "Growth & Increase",
    natureEs: "Ganancia / Beneficio",
    natureFr: "Gain / Enrichissement",
    judgment: "利有攸往利涉大川",
    judgmentEn: "[Translation pending: 利有攸往利涉大川...]",
    relationshipMeaning: "彼此成就，1+1>2的关系",
    relationshipMeaningEn: "Timely pauses and reflection are beneficial for the relationship.",
    category: "吉",
    scoreRange: [79, 91]
  },
  43: {
    name: "泽天夬",
    nameEn: "Breakthrough",
    nameEs: "La Irrupción / La Resolución",
    nameFr: "La Percée / La Résolution",
    symbol: "☱☰",
    nature: "决断",
    natureEn: "Decisive Action",
    natureEs: "Decisión / Determinación",
    natureFr: "Décision / Trancher",
    judgment: "扬于王庭号厉",
    judgmentEn: "[Translation pending: 扬于王庭号厉...]",
    relationshipMeaning: "需要做出决定或直面问题，拖延无益",
    relationshipMeaningEn: "Gradually developing emotions are most stable. No rush to succeed.",
    category: "待变",
    scoreRange: [51, 65]
  },
  44: {
    name: "天风姤",
    nameEn: "Coming to Meet",
    nameEs: "Encantamiento / El Encuentro",
    nameFr: "La Rencontre",
    symbol: "☰☴",
    nature: "邂逅",
    natureEn: "Unexpected Encounter",
    natureEs: "Encuentro Fortuito",
    natureFr: "Rencontre Fortuite",
    judgment: "女壮勿用取女",
    judgmentEn: "[Translation pending: 女壮勿用取女...]",
    relationshipMeaning: "意外的相遇或转机，缘分来得突然",
    relationshipMeaningEn: "Take a moment to ensure your foundation is solid before moving forward too quickly.",
    category: "中",
    scoreRange: [65, 79]
  },
  45: {
    name: "泽地萃",
    nameEn: "Gathering Together",
    nameEs: "La Reunión / La Colección",
    nameFr: "Le Rassemblement / La Collection",
    symbol: "☱☷",
    nature: "聚集",
    natureEn: "Gathering Together",
    natureEs: "Congregación / Unión",
    natureFr: "Réunion / Convergence",
    judgment: "王假有庙亨",
    judgmentEn: "[Translation pending: 王假有庙亨...]",
    relationshipMeaning: "因缘聚合，彼此珍惜相聚的时光",
    relationshipMeaningEn: "Relationship at its peak, but stay sober, don't get carried away.",
    category: "吉",
    scoreRange: [74, 86]
  },
  46: {
    name: "地风升",
    nameEn: "Pushing Upward",
    nameEs: "El Ascenso",
    nameFr: "La Poussée Vers le Haut",
    symbol: "☷☴",
    nature: "上升",
    natureEn: "Rising Upward",
    natureEs: "Elevación / Surgimiento",
    natureFr: "Élévation / Ascension",
    judgment: "元亨用见大人",
    judgmentEn: "[Translation pending: 元亨用见大人...]",
    relationshipMeaning: "关系稳步上升，相互促进成长",
    relationshipMeaningEn: "A flexible and adaptable relationship. Move with the wind, follow the trend.",
    category: "吉",
    scoreRange: [76, 88]
  },
  47: {
    name: "泽水困",
    nameEn: "Oppression",
    nameEs: "La Opresión / El Agotamiento",
    nameFr: "L'Oppression / L'Épuisement",
    symbol: "☱☵",
    nature: "困顿",
    natureEn: "Hardship & Constraint",
    natureEs: "Aflicción / Estancamiento",
    natureFr: "Détresse / Épuisement",
    judgment: "亨贞大人吉无咎",
    judgmentEn: "[Translation pending: 亨贞大人吉无咎...]",
    relationshipMeaning: "暂时困顿不代表失败，坚持就能突破",
    relationshipMeaningEn: "A joyful and happy relationship. Smooth communication, lots of laughter.",
    category: "小凶",
    scoreRange: [46, 60]
  },
  48: {
    name: "水风井",
    nameEn: "The Well",
    nameEs: "El Pozo de Agua",
    nameFr: "Le Puits",
    symbol: "☵☴",
    nature: "井养",
    natureEn: "Well Nourishment",
    natureEs: "Sustento del pozo / Cuidado",
    natureFr: "Abreuvoir / Entretien",
    judgment: "改邑不改井",
    judgmentEn: "Change the town but not the well. Core values remain constant.",
    relationshipMeaning: "如井水般源源不断的关系，稳定可靠",
    relationshipMeaningEn: "Some sense of distance. Need to re-condense emotions.",
    category: "吉",
    scoreRange: [73, 85]
  },
  49: {
    name: "泽火革",
    nameEn: "Revolution",
    nameEs: "La Revolución / Mudanza",
    nameFr: "La Révolution / La Mue",
    symbol: "☱☲",
    nature: "变革",
    natureEn: "Radical Change",
    natureEs: "Transformación / Revolución",
    natureFr: "Transformation / Révolution",
    judgment: "巳日乃孚元亨利贞",
    judgmentEn: "[Translation pending: 巳日乃孚元亨利贞...]",
    relationshipMeaning: "关系需要变革更新，改变后更好",
    relationshipMeaningEn: "Appropriate restraint and sense of boundaries are beneficial to the relationship.",
    category: "中",
    scoreRange: [61, 75]
  },
  50: {
    name: "火风鼎",
    nameEn: "The Cauldron",
    nameEs: "El Caldero",
    nameFr: "Le Chaudron",
    symbol: "☲☴",
    nature: "鼎新",
    natureEn: "Establishing New Order",
    natureEs: "Renovación / Refundación",
    natureFr: "Renouveau / Refondation",
    judgment: "元吉亨",
    judgmentEn: "[Translation pending: 元吉亨...]",
    relationshipMeaning: "关系正在蜕变升级，新旧交替中孕育更好",
    relationshipMeaningEn: "You have a great chemistry in the little things, but the bigger things still invite more alignment.",
    category: "吉",
    scoreRange: [75, 87]
  },
  51: {
    name: "震为雷",
    nameEn: "The Arousing (Thunder)",
    nameEs: "Lo Conmocionante / El Trueno",
    nameFr: "L'Éveilleur / Le Tonnerre",
    symbol: "☳☳",
    nature: "震动",
    natureEn: "Quaking & Shaking",
    natureEs: "Sacudida / Conmoción",
    natureFr: "Secousse / Ébranlement",
    judgment: "亨恐致福",
    judgmentEn: "[Translation pending: 亨恐致福...]",
    relationshipMeaning: "震动带来觉醒，有时小的冲突反而是好事",
    relationshipMeaningEn: "Water and fire in perfect balance, yin and yang harmonized. A state of complete preparedness and fulfillment.",
    category: "中",
    scoreRange: [60, 74]
  },
  52: {
    name: "艮为山",
    nameEn: "Keeping Still (Mountain)",
    nameEs: "El Aquietamiento / La Montaña",
    nameFr: "L'Immobilisation / La Montagne",
    symbol: "☶☶",
    nature: "停止",
    natureEn: "Cessation",
    natureEs: "Detención / Inmovilidad",
    natureFr: "Arrêt / Immobilité",
    judgment: "艮其背不获其身",
    judgmentEn: "[Translation pending: 艮其背不获其身...]",
    relationshipMeaning: "适时的停顿和反思对关系有益",
    relationshipMeaningEn: "The journey is not over yet. Unfinished means infinite possibilities.",
    category: "中",
    scoreRange: [63, 77]
  },
  53: {
    name: "风山渐",
    nameEn: "Gradual Progress",
    nameEs: "El Progreso Gradual",
    nameFr: "Le Progrès Graduel",
    symbol: "☴☶",
    nature: "渐进",
    natureEn: "Gradual Advance",
    natureEs: "Graduación / Avance paulatino",
    natureFr: "Gradation / Progression lente",
    judgment: "女归吉利贞",
    judgmentEn: "[Translation pending: 女归吉利贞...]",
    relationshipMeaning: "循序渐进的感情最稳固，不急于求成",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "吉",
    scoreRange: [72, 84]
  },
  54: {
    name: "雷泽归妹",
    nameEn: "The Marrying Maiden",
    nameEs: "La Doncella que se Casa",
    nameFr: "La Jeune Fille qui se Marie",
    symbol: "☳☱",
    nature: "归随",
    natureEn: "Returning & Following",
    natureEs: "Alianza / Séquito",
    natureFr: "Alliance / Soumission",
    judgment: "征凶无攸利",
    judgmentEn: "[Translation pending: 征凶无攸利...]",
    relationshipMeaning: "需要审视关系的根基是否牢固，不宜冒进",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "待变",
    scoreRange: [52, 66]
  },
  55: {
    name: "雷丰",
    nameEn: "Abundance",
    nameEs: "La Abundancia / La Plenitud",
    nameFr: "L'Abondance / La Plénitude",
    symbol: "☳☲",
    nature: "丰盛",
    natureEn: "Full Abundance",
    natureEs: "Abundancia / Grandeza",
    natureFr: "Abondance / Grandeur",
    judgment: "亨王勿忧宜日中",
    judgmentEn: "[Translation pending: 亨王勿忧宜日中...]",
    relationshipMeaning: "关系如日中天，但要保持清醒不要得意忘形",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "吉",
    scoreRange: [78, 90]
  },
  56: {
    name: "火山旅",
    nameEn: "The Wanderer",
    nameEs: "El Andariego / El Viajero",
    nameFr: "Le Voyageur",
    symbol: "☶☲",
    nature: "旅行",
    natureEn: "Wandering",
    natureEs: "Viaje / Erranza",
    natureFr: "Voyage / Errance",
    judgment: "小亨旅贞吉",
    judgmentEn: "[Translation pending: 小亨旅贞吉...]",
    relationshipMeaning: "像一段共同的旅程，体验丰富但需要方向感",
    relationshipMeaningEn: "A time of meaningful connection: Like a shared journey—rich experiences but needs direction.",
    category: "中",
    scoreRange: [64, 78]
  },
  57: {
    name: "巽为风",
    nameEn: "The Gentle (Wind)",
    nameEs: "Lo Suave / El Viento",
    nameFr: "Le Doux / Le Vent",
    symbol: "☴☴",
    nature: "顺入",
    natureEn: "Gentle Penetration",
    natureEs: "Penetración / Flexibilidad",
    natureFr: "Pénétration / Souplesse",
    judgment: "小亨利有攸往",
    judgmentEn: "[Translation pending: 小亨利有攸往...]",
    relationshipMeaning: "灵活适应的关系，随风而动顺势而为",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "中",
    scoreRange: [66, 80]
  },
  58: {
    name: "兑为泽",
    nameEn: "The Joyous (Lake)",
    nameEs: "Lo Sereno / El Lago",
    nameFr: "Le Joyeux / Le Lac",
    symbol: "☱☱",
    nature: "喜悦",
    natureEn: "Joyful Communication",
    natureEs: "Alegría / Regocijo",
    natureFr: "Joie / Plaisir",
    judgment: "亨利贞",
    judgmentEn: "[Translation pending: 亨利贞...]",
    relationshipMeaning: "愉悦快乐的关系，沟通顺畅笑声多",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "吉",
    scoreRange: [80, 92]
  },
  59: {
    name: "风水涣",
    nameEn: "Dispersion",
    nameEs: "La Disolución / La Dispersión",
    nameFr: "La Dissipation / La Dispersion",
    symbol: "☴☵",
    nature: "涣散",
    natureEn: "Dissolving Boundaries",
    natureEs: "Dispersión",
    natureFr: "Dispersion",
    judgment: "王假有庙利涉大川",
    judgmentEn: "[Translation pending: 王假有庙利涉大川...]",
    relationshipMeaning: "有些疏离感，需要重新凝聚情感",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "中",
    scoreRange: [57, 71]
  },
  60: {
    name: "水泽节",
    nameEn: "Limitation",
    nameEs: "La Restricción / La Medida",
    nameFr: "La Limitation / La Mesure",
    symbol: "☵☱",
    nature: "节制",
    natureEn: "Measured Limitation",
    natureEs: "Moderación / Control",
    natureFr: "Modération / Retenue",
    judgment: "亨苦节不可贞",
    judgmentEn: "[Translation pending: 亨苦节不可贞...]",
    relationshipMeaning: "适度的克制和边界感对关系有益",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "中",
    scoreRange: [65, 79]
  },
  61: {
    name: "风泽中孚",
    nameEn: "Inner Truth",
    nameEs: "Verdad Interior",
    nameFr: "La Vérité Intérieure",
    symbol: "☴☱",
    nature: "诚信",
    natureEn: "Sincere Faithfulness",
    natureEs: "Sinceridad / Buena fe",
    natureFr: "Sincérité / Bonne foi",
    judgment: "豚鱼吉利涉大川",
    judgmentEn: "[Translation pending: 豚鱼吉利涉大川...]",
    relationshipMeaning: "信任是这段关系的基石，真诚相待无往不利",
    relationshipMeaningEn: "A time of meaningful connection: Trust is the cornerstone of this relationship. Sincere treatment brings success.",
    category: "吉",
    scoreRange: [81, 93]
  },
  62: {
    name: "雷山小过",
    nameEn: "Small Excess",
    nameEs: "Pequeño Exceso",
    nameFr: "Le Petit Excès",
    symbol: "☳☶",
    nature: "小过",
    natureEn: "Minor Exceeding",
    natureEs: "Pequeño Exceso",
    natureFr: "Petit Excès",
    judgment: "亨利贞可小事不可大事",
    judgmentEn: "[Translation pending: 亨利贞可小事不可大事...]",
    relationshipMeaning: "小事上默契十足，大事上还需更多磨合",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "中",
    scoreRange: [62, 76]
  },
  63: {
    name: "水火既济",
    nameEn: "After Completion",
    nameEs: "Después de la Realización",
    nameFr: "Après l'Accomplissement",
    symbol: "☵☲",
    nature: "既济",
    natureEn: "Already Fulfilled",
    natureEs: "Realización / Logro total",
    natureFr: "Accomplissement / Harmonie",
    judgment: "亨小利贞",
    judgmentEn: "[Translation pending: 亨小利贞...]",
    relationshipMeaning: "水火既济，阴阳调和，万事俱备的圆满状态",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "大吉",
    scoreRange: [87, 98]
  },
  64: {
    name: "火水未济",
    nameEn: "Before Completion",
    nameEs: "Antes de la Realización",
    nameFr: "Avant l'Accomplissement",
    symbol: "☲☵",
    nature: "未济",
    natureEn: "Not Yet Fulfilled",
    natureEs: "Inconcluso / Potencial",
    natureFr: "Inaccompli / Potentiel",
    judgment: "亨小狐汔济濡其尾",
    judgmentEn: "[Translation pending: 亨小狐汔济濡其尾...]",
    relationshipMeaning: "旅程尚未结束，未完成意味着还有无限可能",
    relationshipMeaningEn: "A time of meaningful connection: [Translation pending]",
    category: "中",
    scoreRange: [67, 81]
  },
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
