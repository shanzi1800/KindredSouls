import type { BirthInfo, EngineResult } from './types';
import type { AlgLang } from './i18n';

// 卦分类多语言映射（字典方案）
type LangKey = 'zh' | 'en' | 'es' | 'fr' | 'th' | 'vi';

const HEX_CATEGORY: Record<string, Record<LangKey, string>> = {
  '大吉': { zh: '大吉', en: 'Great Auspicious', es: 'Gran Auspicioso', fr: 'Très Auspice', th: 'มหามงคล', vi: 'Đại Cát' },
  '吉': { zh: '吉', en: 'Auspicious', es: 'Auspicious', fr: 'Auspice', th: 'มงคล', vi: 'Cát' },
  '中': { zh: '中', en: 'Neutral', es: 'Neutral', fr: 'Neutre', th: 'กลาง', vi: 'Trung' },
  '小凶': { zh: '小凶', en: 'Slightly Unfavorable', es: 'Ligeramente Desfavorable', fr: 'Légèrement Défavorable', th: 'เล็กน้อยไม่ดี', vi: 'Tiểu Hung' },
  '待变': { zh: '待变', en: 'Pending Change', es: 'Cambio Pendiente', fr: 'Changement en Attente', th: 'รอการเปลี่ยนแปลง', vi: 'Đợi Biến' },
};

// 从 HexagramData 多语言字段读取
function getHexField(hex: any, field: 'name'|'nature'|'judgment'|'relationshipMeaning', lang: AlgLang): string {
  if (lang === 'zh') {
    if (field === 'name') return hex.name;
    if (field === 'nature') return hex.nature;
    if (field === 'judgment') return hex.judgment;
    return hex.relationshipMeaning;
  }
  // en/es/fr/th/vi 都有翻译
  const suffixMap: Record<string, string> = { en: 'En', es: 'Es', fr: 'Fr', th: 'Th', vi: 'Vi' };
  const suffix = suffixMap[lang] || 'En';
  const key = field === 'relationshipMeaning' ? ('relationshipMeaning' + suffix) : (field + suffix.charAt(0).toUpperCase() + suffix.slice(1));
  return hex[key] || hex[field] || '';
}

// ═════════════════════════════════════════
// 易经卦象引擎（真实算法）
// 输入：双方年月日 → 64卦全量起卦 + 变卦 + 卦辞解读
// 权重：20%
// ═════════════════════════════════════════

// ── 64卦完整数据 ──

interface HexagramData {
  name: string;           // 卦名
  nameEn?: string;
  nameEs?: string;
  nameFr?: string;
  nameTh?: string;
  nameVi?: string;
  symbol: string;         // 上下卦符号（如 ☰☷）
  nature: string;         // 卦德/属性
  natureEn?: string;
  natureEs?: string;
  natureFr?: string;
  judgment: string;       // 卦辞摘要
  judgmentEn?: string;
  judgmentEs?: string;
  judgmentFr?: string;
  relationshipMeaning: string; // 感姻解读
  relationshipMeaningEn?: string;
  relationshipMeaningEs?: string;
  relationshipMeaningFr?: string;
  relationshipMeaningTh?: string;
  relationshipMeaningVi?: string;
  category: '大吉' | '吉' | '中' | '小凶' | '待变';
  scoreRange: [number, number]; // 分数范围
}

const HEXAGRAMS: Record<number, HexagramData> = {
  1: {
    name: "乾为天",
    nameEn: "The Creative / Heaven",
    nameEs: "Lo Creativo / El Cielo",
    nameFr: "Le Créatif / Le Ciel",
    nameTh: 'ฉียน (ฟ้า)',
    nameVi: 'Càn Vi Thiên',
    symbol: "☰☰",
    nature: "刚健",
    natureEn: "Strong & Vigorous",
    natureEs: "Fuerza / Vigor",
    natureFr: "Force / Vigueur",
    judgment: "元亨利贞",
    judgmentEn: "Success. The noble person has a successful conclusion.",
    relationshipMeaning: '大吉。充满活力与激情，彼此吸引力强，但需防刚愎自用导致争执，宜多包容。',
    relationshipMeaningEn: 'Highly auspicious. Full of energy and passion with strong attraction. Avoid stubbornness to prevent conflicts; mutual tolerance is key.',
    relationshipMeaningTh: 'เป็นมงคลยิ่ง มีพลังและความดึงดูดใจสูง หลีกเลี่ยงความดื้อรั้นเพื่อป้องกันการขัดแย้ง ควรยอมรับและผ่อนปรนให้กัน',
    relationshipMeaningVi: 'Đại cát. Đầy năng lượng và đam mê, sức hút đôi bên mạnh mẽ. Cần phòng tự cao tự đại dẫn đến tranh chấp, nên bao dung lẫn nhau.',
    category: "大吉",
    scoreRange: [85, 96]
  },
  2: {
    name: "坤为地",
    nameEn: "The Receptive / Earth",
    nameEs: "Lo Receptivo / La Tierra",
    nameFr: "Le Réceptif / La Terre",
    nameTh: 'คุน (ดิน)',
    nameVi: 'Khôn Vi Địa',
    symbol: "☷☷",
    nature: "柔顺",
    natureEn: "Yielding & Receptive",
    natureEs: "Docilidad / Sumisión",
    natureFr: "Docilité / Soumission",
    judgment: "元亨，利牝马之贞",
    judgmentEn: "Supreme success. Furthering through perseverance. No blame.",
    relationshipMeaning: '吉。性格互补，关系包容稳定，细水长流。女方主顺，男方主护，感情能开花结果。',
    relationshipMeaningEn: 'Auspicious. Complementary personalities bring stability and tolerance. A gentle and protective bond that leads to a fruitful marriage.',
    relationshipMeaningTh: 'โชคดี นิสัยเกื้อกูลกัน ความสัมพันธ์มั่นคงและยอมรับในตัวตนของกันและกัน ความรักที่อ่อนโยนและดูแลกันจะนำไปสู่ความสำเร็จ',
    relationshipMeaningVi: 'Cát. Tính cách bù trừ, quan hệ bao dung ổn định, bền vững lâu dài. Nữ thuận theo, nam che chở, tình cảm sẽ đơm hoa kết trái.',
    category: "大吉",
    scoreRange: [82, 94]
  },
  3: {
    name: "水雷屯",
    nameEn: "Difficulty at the Beginning",
    nameEs: "La Dificultad Inicial",
    nameFr: "La Difficulté Initiale",
    nameTh: 'ทุน (ความยากลำบากเริ่มต้น)',
    nameVi: 'Thuỷ Lôi Truân',
    symbol: "☵☳",
    nature: "初生",
    natureEn: "Beginning of Life",
    natureEs: "Nacimiento / Brote inicial",
    natureFr: "Commencement / Bourgeonnement",
    judgment: "元亨利贞，勿用有攸往",
    judgmentEn: "Great success. Advantageous to cross the great river.",
    relationshipMeaning: '平。创业或感情初期充满波折与阻碍，不可操之过急，需耐心培植感情，静待转机。',
    relationshipMeaningEn: 'Neutral. Initial stages are full of twists and obstacles. Do not rush; build the relationship with patience and wait for the turning point.',
    relationshipMeaningTh: 'ปานกลาง ช่วงเริ่มต้นเต็มไปด้วยอุปสรรคและความผันผวน ไม่ควรรีบร้อน ต้องอาศัยความอดทนและรอคอยจังหวะเวลาที่ดี',
    relationshipMeaningVi: 'Bình. Giai đoạn đầu nhiều sóng gió và trở ngại, không được nôn nóng, cần kiên nhẫn bồi đắp tình cảm, chờ đợi thời cơ chuyển biến.',
    category: "中",
    scoreRange: [58, 72]
  },
  4: {
    name: "山水蒙",
    nameEn: "Youthful Folly",
    nameEs: "La Necedad Juvenil / La Inmadurez",
    nameFr: "La Folie Juvénile / L'Obscurité",
    nameTh: 'เหมิง (ความเขลาของเยาว์วัย)',
    nameVi: 'Sơn Thuỷ Mông',
    symbol: "☶☳",
    nature: "启蒙",
    natureEn: "Unaware & Naive",
    natureEs: "Iluminación / Iniciación",
    natureFr: "Éveil / Initiation",
    judgment: "亨。匪我求童蒙，童蒙求我",
    judgmentEn: "Washing hands but not yet offering. Sincere devotion, solemnity.",
    relationshipMeaning: '凶。沟通不畅，充满误解与迷茫，一方可能较为幼稚或隐瞒真相。宜坦诚相待，寻求长辈指引。',
    relationshipMeaningEn: 'Inauspicious. Poor communication leading to misunderstandings. One party may be immature or hiding the truth. Be honest and seek elders' guidance.',
    relationshipMeaningTh: 'ไม่ดี การสื่อสารไม่เข้าใจกัน เต็มไปด้วยความไม่รู้หรือความเข้าใจผิด ฝ่ายใดฝ่ายหนึ่งอาจยังไม่โตพอ ควรเปิดใจคุยกันและขอคำแนะนำจากผู้ใหญ่',
    relationshipMeaningVi: 'Hung. Giao tiếp không thông suốt, đầy hiểu lầm và mơ hồ, một bên có thể khá non nớt hoặc che giấu sự thật. Nên thành thật và xin lời khuyên từ người lớn.',
    category: "中",
    scoreRange: [60, 74]
  },
  5: {
    name: "水天需",
    nameEn: "Waiting (Nourishment)",
    nameEs: "La Espera",
    nameFr: "L'Attente",
    nameTh: 'ซวี (การรอคอย)',
    nameVi: 'Thuỷ Thiên Nhu',
    symbol: "☵☰",
    nature: "等待",
    natureEn: "Patient Waiting",
    natureEs: "Espera",
    natureFr: "Attente",
    judgment: "有孚，光亨贞吉",
    judgmentEn: "Success. Advantageous for litigation.",
    relationshipMeaning: '平。时机未到，不可强求。感情需经历时间的考验，保持定力，顺其自然，终有光明结果。',
    relationshipMeaningEn: 'Neutral. The time is not ripe yet; do not force it. The relationship needs to stand the test of time. Be patient, and a bright outcome will follow.',
    relationshipMeaningTh: 'ปานกลาง จังหวะเวลายังมาไม่ถึง ไม่ควรฝืน ความรักต้องผ่านการพิสูจน์ด้วยเวลา จงรักษาความมั่นคงแล้วจะสมหวังในที่สุด',
    relationshipMeaningVi: 'Bình. Thời cơ chưa đến, không thể khiên cưỡng. Tình cảm cần trải qua thử thách của thời gian, giữ vững định lực, thuận theo tự nhiên sẽ có kết quả tốt đẹp.',
    category: "吉",
    scoreRange: [70, 82]
  },
  6: {
    name: "天水讼",
    nameEn: "Conflict",
    nameEs: "El Conflicto / El Pleito",
    nameFr: "Le Conflit / Le Litige",
    nameTh: 'ซ่ง (การโต้เถียง)',
    nameVi: 'Thiên Thuỷ Tụng',
    symbol: "☰☵",
    nature: "争辩",
    natureEn: "Conflict & Dispute",
    natureEs: "Disputa / Litigio",
    natureFr: "Dispute / Contestation",
    judgment: "有孚窒惕，中吉",
    judgmentEn: "Success. Minor advantages in movement.",
    relationshipMeaning: '凶。意见严重不合，口舌争吵不断，甚至有分离之忧。各不相让只会流向两败俱伤，宜退让和解。',
    relationshipMeaningEn: 'Inauspicious. Severe disagreement and constant arguments, risking separation. Stubbornness leads to mutual ruin; compromise and withdrawal are advised.',
    relationshipMeaningTh: 'ไม่ดี ความคิดเห็นขัดแย้งกันอย่างรุนแรง มีปากเสียงไม่เว้นแต่ละวัน หากไม่ยอมลดราวาศอกจะนำไปสู่ความแตกหัก ควรประนีประนอม',
    relationshipMeaningVi: 'Hung. Ý kiến bất đồng sâu sắc, khẩu thiệt tranh cãi không ngừng, thậm chí có nguy cơ chia ly. Không ai nhường ai sẽ dẫn đến lưỡng bại câu thương, nên lùi bước hòa giải.',
    category: "小凶",
    scoreRange: [48, 62]
  },
  7: {
    name: "地水师",
    nameEn: "The Army",
    nameEs: "El Ejército",
    nameFr: "L'Armée",
    nameTh: 'ซือ (กองทัพ)',
    nameVi: 'Địa Thuỷ Sư',
    symbol: "☷☵",
    nature: "统领",
    natureEn: "Disciplined Force",
    natureEs: "Mando / Liderazgo",
    natureFr: "Commandement / Direction",
    judgment: "贞丈人吉无咎",
    judgmentEn: "Advantageous to persevere. Not eating at home - good fortune.",
    relationshipMeaning: '平。感情带有强烈的控制欲或竞争色彩，需要严格的自我约束。主导者需以德服人，避免流于冷战。',
    relationshipMeaningEn: 'Neutral. Relationship involves strong control or competition, requiring self-discipline. The dominant partner must lead with virtue to avoid cold wars.',
    relationshipMeaningTh: 'ปานกลาง ความสัมพันธ์มีความต้องการควบคุมหรือการแข่งขันสูง ต้องมีวินัยในตนเอง ฝ่ายที่นำควรใช้ความเข้าใจและความถูกต้องมากกว่าใช้อำนาจ',
    relationshipMeaningVi: 'Bình. Tình cảm mang tính kiểm soát hoặc cạnh tranh mạnh mẽ, cần tự kỷ luật nghiêm ngặt. Người làm chủ cần phục chúng bằng đức, tránh rơi vào chiến tranh lạnh.',
    category: "中",
    scoreRange: [56, 70]
  },
  8: {
    name: "水地比",
    nameEn: "Holding Together",
    nameEs: "La Unión / La Solidaridad",
    nameFr: "L'Union / La Solidarité",
    nameTh: 'ปี่ (การเคียงคู่)',
    nameVi: 'Thuỷ Địa Tỷ',
    symbol: "☵☷",
    nature: "亲辅",
    natureEn: "Close Support",
    natureEs: "Afinidad / Apoyo mutuo",
    natureFr: "Affinité / Entraide",
    judgment: "吉。原筮元永贞无咎",
    judgmentEn: "Divination auspicious. Observe the jaws, provide for yourself.",
    relationshipMeaning: '吉。亲密无间，相亲相爱，互依互靠。单身者易遇良缘，恋爱者利于谈婚论嫁，是一段和乐融融的关系。',
    relationshipMeaningEn: 'Auspicious. Close and affectionate, relying mutually on each other. Singles find good matches; couples will find it ideal for marriage discussion.',
    relationshipMeaningTh: 'โชคดี ความสัมพันธ์ใกล้ชิด สนิทสนมและพึ่งพาอาศัยกัน คนโสดมีเกณฑ์พบเนื้อคู่ คนมีคู่เหมาะแก่การเจรจาเรื่องแต่งงานและสร้างครอบครัว',
    relationshipMeaningVi: 'Cát. Thân mật khăng khít, tương thân tương ái, nương tựa lẫn nhau. Người độc thân dễ gặp lương duyên, người đang yêu lợi cho việc bàn tính hôn nhân.',
    category: "吉",
    scoreRange: [76, 88]
  },
  9: {
    name: "风天小畜",
    nameEn: "Small Taming",
    nameEs: "La Fuerza Domesticadora de lo Pequeño",
    nameFr: "Le Pouvoir d'Apprivoisement du Petit",
    nameTh: 'เสี่ยวชู่ (การสะสมเล็กน้อย)',
    nameVi: 'Phong Thiên Tiểu Súc',
    symbol: "☴☰",
    nature: "蓄养",
    natureEn: "Nourishing Accumulation",
    natureEs: "Acumulación Menor / Crianza",
    natureFr: "Accumulation Mineure / Élevage",
    judgment: "亨。密云不雨",
    judgmentEn: "The ridgepole sags. Advantageous to move. Success.",
    relationshipMeaning: '平。感情虽有微小进展，但阻力犹存，常因生活琐事产生摩擦。不可急于求成，需耐心积累感情。',
    relationshipMeaningEn: 'Neutral. Slight progress but resistance remains. Friction often arises from trivial matters. Do not rush; build affection gradually.',
    relationshipMeaningTh: 'ปานกลาง มีความคืบหน้าเล็กน้อยแต่ยังมีแรงต้าน มักขัดแย้งด้วยเรื่องเล็กๆ น้อยๆ ในชีวิตประจำวัน อย่าใจร้อน ต้องค่อยๆ สะสมความรู้สึกที่ดีต่อกัน',
    relationshipMeaningVi: 'Bình. Tình cảm tuy có tiến triển nhỏ nhưng trở ngại vẫn còn, thường vì chuyện vặt vãnh mà ma sát. Không được nôn nóng thành công, cần kiên nhẫn tích lũy tình cảm.',
    category: "中",
    scoreRange: [62, 75]
  },
  10: {
    name: "天泽履",
    nameEn: "Treading (Conduct)",
    nameEs: "El Pisar / La Conducta",
    nameFr: "Le Pas / La Conduite",
    nameTh: 'ลู่ (การย่างก้าวด้วยความระมัดระวัง)',
    nameVi: 'Thiên Trạch Lý',
    symbol: "☰☱",
    nature: "践行",
    natureEn: "Practice & Action",
    natureEs: "Práctica / Ejecución",
    natureFr: "Pratique / Mettre en œuvre",
    judgment: "履虎尾，不咥人亨",
    judgmentEn: "Advantageous to persevere. Success.",
    relationshipMeaning: '平。步步惊心，关系中存在一定阶层感或压力。必须相敬如宾，遵守礼节，谨言慎行方能相安无事。',
    relationshipMeaningEn: 'Neutral. Walking on thin ice; the relationship has underlying pressure or inequality. Respecting boundaries and acting cautiously ensure harmony.',
    relationshipMeaningTh: 'ปานกลาง ความสัมพันธ์มีความกดดันหรือความเหลื่อมล้ำ ต้องให้เกียรติซึ่งกันและกัน รักษามารยาทและระวังคำพูดเพื่อประคองความสงบสุข',
    relationshipMeaningVi: 'Bình. Như đi trên băng mỏng, quan hệ có áp lực hoặc cảm giác thứ bậc. Phải tương kính như tân, tuân thủ lễ tiết, cẩn ngôn thận hành mới có thể bình an vô sự.',
    category: "吉",
    scoreRange: [68, 80]
  },
  11: {
    name: "地天泰",
    nameEn: "Peace",
    nameEs: "La Paz / La Armonía",
    nameFr: "La Paix / La Prospérité",
    nameTh: 'ไท้ (ความสงบสุข)',
    nameVi: 'Địa Thiên Thái',
    symbol: "☷☰",
    nature: "通泰",
    natureEn: "Harmonious Flow",
    natureEs: "Fluidez / Prosperidad",
    natureFr: "Harmonie / Fluidité",
    judgment: "小往大来吉亨",
    judgmentEn: "Success, prosperity, perseverance. Marrying a maiden is auspicious.",
    relationshipMeaning: '大吉。阴阳交泰，沟通顺畅，彼此心意相通。感情甜蜜融洽，极为利于订婚、结婚等喜事。',
    relationshipMeaningEn: 'Highly auspicious. Perfect harmony and smooth communication; hearts are aligned. Sweet and harmonious relationship, ideal for engagement or marriage.',
    relationshipMeaningTh: 'เป็นมงคลยิ่ง หยินหยางสมดุล สื่อสารราบรื่นและใจตรงกัน ความรักหวานชื่นและลงตัว เหมาะมากสำหรับการหมั้นหมายหรือแต่งงาน',
    relationshipMeaningVi: 'Đại cát. Âm dương giao hòa, giao tiếp thông suốt, tâm ý tương thông. Tình cảm ngọt ngào hòa hợp, cực kỳ có lợi cho việc đính hôn, kết hôn.',
    category: "大吉",
    scoreRange: [88, 97]
  },
  12: {
    name: "天地否",
    nameEn: "Standstill (Stagnation)",
    nameEs: "El Estancamiento / La Obstrucción",
    nameFr: "La Stagnation / L'Obstruction",
    nameTh: 'ผี่ (ความหยุดชะงัก)',
    nameVi: 'Thiên Địa Bĩ',
    symbol: "☰☷",
    nature: "闭塞",
    natureEn: "Blocked & Stagnant",
    natureEs: "Bloqueo / Clausura",
    natureFr: "Blocage / Fermeture",
    judgment: "否之匪人，不利君子贞",
    judgmentEn: "Success, no blame. Advantageous to persevere.",
    relationshipMeaning: '凶。沟通闭塞，冷战对立，想法背道而驰。感情陷入僵局，若不积极打破隔阂，恐面临分手。',
    relationshipMeaningEn: 'Inauspicious. Blocked communication, cold war, and divergent goals. The relationship is stagnant; without breaking the barrier, break-up is likely.',
    relationshipMeaningTh: 'ไม่ดี การสื่อสารปิดตาย เกิดสงครามเย็นและความคิดเห็นสวนทางกัน ความสัมพันธ์หยุดชะงัก หากไม่เปิดใจแก้ไขอาจต้องเลิกรากัน',
    relationshipMeaningVi: 'Hung. Giao tiếp bế tắc, chiến tranh lạnh đối lập, suy nghĩ đi ngược lại nhau. Tình cảm rơi vào bế tắc, nếu không tích cực phá vỡ rào cản sẽ dễ đối mặt với chia tay.',
    category: "小凶",
    scoreRange: [45, 58]
  },
  13: {
    name: "天火同人",
    nameEn: "Fellowship with Men",
    nameEs: "La Comunidad con los Hombres",
    nameFr: "La Communauté / L'Union des Hommes",
    nameTh: 'ถงเหริน (มิตรสหาย)',
    nameVi: 'Thiên Hỏa Đồng Nhân',
    symbol: "☰☲",
    nature: "聚合",
    natureEn: "Gathering Together",
    natureEs: "Reunión / Convergencia",
    natureFr: "Rassemblement / Convergence",
    judgment: "同人于野亨",
    judgmentEn: "Success. Minor advantages in firmness.",
    relationshipMeaning: '吉。志同道合，既是爱人又是知己，拥有共同的目标与圈子。公开恋情能获得大众的祝福。',
    relationshipMeaningEn: 'Auspicious. Like-minded partners who are both lovers and soulmates. Sharing common goals and social circles; opening the relationship brings public blessings.',
    relationshipMeaningTh: 'โชคดี เป็นทั้งคนรักและมิตรแท้ที่มีอุดมการณ์เดียวกัน มีเป้าหมายและสังคมร่วมกัน การเปิดเผยความสัมพันธ์จะได้รับการยินดีจากรอบข้าง',
    relationshipMeaningVi: 'Cát. Chí đồng đạo hợp, vừa là người yêu vừa là tri kỷ, có chung mục tiêu và vòng bạn bè. Công khai tình cảm sẽ nhận được sự chúc phúc của mọi người.',
    category: "吉",
    scoreRange: [78, 90]
  },
  14: {
    name: "火天大有",
    nameEn: "Great Possession",
    nameEs: "La Gran Posesión / La Abundancia",
    nameFr: "Le Grand Avoir / La Grande Possession",
    nameTh: 'ต้าโหย่ว (ความมั่งคั่งยิ่งใหญ่)',
    nameVi: 'Hỏa Thiên Đại Hữu',
    symbol: "☲☰",
    nature: "丰盛",
    natureEn: "Full Abundance",
    natureEs: "Abundancia / Plenitud",
    natureFr: "Abondance / Plénitude",
    judgment: "元亨",
    judgmentEn: "Advantageous to persevere.",
    relationshipMeaning: '大吉。感情丰富且物质基础雄厚，彼此相处融洽，充满正能量。此时利于共筑未来，走向美满婚姻。',
    relationshipMeaningEn: 'Highly auspicious. Rich affection backed by a strong material foundation. Mutual positive energy leads to a happy, prosperous future and marriage.',
    relationshipMeaningTh: 'เป็นมงคลยิ่ง ความรักเบ่งบานพร้อมฐานะที่มั่นคง ทั้งสองฝ่ายเข้ากันได้ดีและเต็มไปด้วยพลังบวก เหมาะแก่การสร้างอนาคตร่วมกันสู่การแต่งงาน',
    relationshipMeaningVi: 'Đại cát. Tình cảm phong phú lại có nền tảng vật chất vững chắc, đôi bên chung sống hòa hợp, đầy năng lượng tích cực. Lợi cho việc cùng xây tương lai, hướng tới hôn nhân viên mãn.',
    category: "大吉",
    scoreRange: [84, 95]
  },
  15: {
    name: "地山谦",
    nameEn: "Modesty",
    nameEs: "La Modestia",
    nameFr: "La Modestie",
    nameTh: 'เชียน (ความอ่อนน้อมถ่อมตน)',
    nameVi: 'Địa Sơn Khiêm',
    symbol: "☷☶",
    nature: "谦逊",
    natureEn: "Humble Modesty",
    natureEs: "Humildad / Modestia",
    natureFr: "Humilité / Modestie",
    judgment: "亨君子有终",
    judgmentEn: "The prosperous lord uses gift horses, multiplying them.",
    relationshipMeaning: '吉。相处缺乏激情但极为安全稳固。彼此懂得低头与退让，相敬如宾，能够平平安安走到最后。',
    relationshipMeaningEn: 'Auspicious. Lacks wild passion but offers extreme safety and stability. Mutual humility and compromise ensure a peaceful, lifelong journey together.',
    relationshipMeaningTh: 'โชคดี แม้จะขาดความหวือหวาแต่มีความมั่นคงและปลอดภัยสูง ต่างฝ่ายต่างรู้จักยอมและให้อภัยกัน จะสามารถประคองคู่กันไปได้ยาวนาน',
    relationshipMeaningVi: 'Cát. Chung sống thiếu đi sự cuồng nhiệt nhưng cực kỳ an toàn và vững chắc. Đôi bên biết nhường nhịn và cúi đầu, tương kính như tân, có thể bình an đi đến cuối con đường.',
    category: "吉",
    scoreRange: [77, 89]
  },
  16: {
    name: "雷地豫",
    nameEn: "Enthusiasm",
    nameEs: "El Entusiasmo",
    nameFr: "L'Enthousiasme",
    nameTh: 'อวี้ (ความสุขสำราญ)',
    nameVi: 'Lôi Địa Dự',
    symbol: "☳☷",
    nature: "安乐",
    natureEn: "Peace & Joy",
    natureEs: "Alegría / Bienestar",
    natureFr: "Joie / Quiétude",
    judgment: "利建侯行师",
    judgmentEn: "Great good fortune. Success.",
    relationshipMeaning: '吉。快乐、充满情调与欢愉的恋爱关系。但需注意流于享乐而忽视现实问题，避免虚荣与喜新厌旧。',
    relationshipMeaningEn: 'Auspicious. A joyful, romantic, and pleasurable relationship. However, beware of overindulgence in pleasure while ignoring practical realities and vanity.',
    relationshipMeaningTh: 'โชคดี ความสัมพันธ์เต็มไปด้วยความสุข ความโรแมนติกและความสนุกสนาน แต่ต้องระวังการเพลิดเพลินกับความสุขจนละเลยความจริงหรือความรับผิดชอบ',
    relationshipMeaningVi: 'Cát. Mối quan hệ vui vẻ, đầy tình điệu và hoan hỷ. Nhưng cần chú ý tránh sa đà vào hưởng lạc mà bỏ qua vấn đề thực tế, tránh hư vinh và cả thèm chóng chán.',
    category: "吉",
    scoreRange: [73, 85]
  },
  17: {
    name: "泽雷随",
    nameEn: "Following",
    nameEs: "El Seguimiento",
    nameFr: "La Suite",
    nameTh: 'สุย (การคล้อยตาม)',
    nameVi: 'Trạch Lôi Tùy',
    symbol: "☱☳",
    nature: "追随",
    natureEn: "Following",
    natureEs: "Seguir / Acompañar",
    natureFr: "Suivre / Accompagner",
    judgment: "元亨利贞无咎",
    judgmentEn: "Minor affairs auspicious.",
    relationshipMeaning: '吉。顺其自然，随缘而安。彼此能互相迁就，夫唱妇随，感情发展顺利。',
    relationshipMeaningEn: 'Auspicious. Go with the flow and adapt to circumstances. Mutual accommodation and harmony lead to smooth relationship development.',
    relationshipMeaningTh: 'โชคดี ปล่อยให้เป็นไปตามธรรมชาติและปรับตัวตามสถานการณ์ ต่างฝ่ายต่างยอมอ่อนข้อให้กัน ความรักดำเนินไปอย่างราบรื่น',
    relationshipMeaningVi: 'Cát. Thuận theo tự nhiên, tùy duyên mà an. Đôi bên biết nhường nhịn, phu xướng phụ tùy, tình cảm phát triển thuận lợi.',
    category: "大吉",
    scoreRange: [83, 94]
  },
  18: {
    name: "山风蛊",
    nameEn: "Work on the Decayed",
    nameEs: "El Trabajo sobre lo Corrompido",
    nameFr: "Le Travail sur ce qui est Corrompu",
    nameTh: 'กู่ (ความเสื่อมถอย)',
    nameVi: 'Sơn Phong Cổ',
    symbol: "☶☴",
    nature: "败坏",
    natureEn: "Decay & Renewal",
    natureEs: "Corrupción / Deterioro",
    natureFr: "Corruption / Dégradation",
    judgment: "元亨，利涉大川",
    judgmentEn: "Advantageous southwest, not advantageous northeast.",
    relationshipMeaning: '凶。关系积弊已深，有隐瞒、欺骗或前任纠缠的问题。必须大刀阔斧斩断乱麻，重新整顿方有生机。',
    relationshipMeaningEn: 'Inauspicious. Deep-seated issues, concealment, deception, or past relationship baggage. Drastic changes and rectification are needed to revive it.',
    relationshipMeaningTh: 'ไม่ดี ปัญหาเรื้อรังสะสมมานาน มีการปกปิด หลอกลวง หรือรักสามเส้า ต้องเด็ดขาดในการแก้ไขและปรับปรุงความสัมพันธ์จึงจะไปต่อได้',
    relationshipMeaningVi: 'Hung. Quan hệ tích tụ nhiều tệ nạn đã lâu, có sự giấu giếm, lừa dối hoặc vướng mắc với người cũ. Phải quyết tâm triệt để chấn chỉnh mới mong có sinh cơ.',
    category: "中",
    scoreRange: [54, 68]
  },
  19: {
    name: "地泽临",
    nameEn: "Approach",
    nameEs: "La Aproximación",
    nameFr: "L'Approche",
    nameTh: 'หลิน (การย่างกรายเข้ามา)',
    nameVi: 'Địa Trạch Lâm',
    symbol: "☷☱",
    nature: "临下",
    natureEn: "Approaching from Below",
    natureEs: "Acercamiento / Presidir",
    natureFr: "Approcher / Présider",
    judgment: "元亨利贞",
    judgmentEn: "Sincere. Great good fortune, no blame.",
    relationshipMeaning: '吉。运势渐入佳境，感情迎来新转机或追求者。彼此积极互动，充满期盼。但需防热情过后面临后劲不足。',
    relationshipMeaningEn: 'Auspicious. Fortunes are improving; relationship welcomes new turns or suitors. Active interaction and high expectations. Beware of a post-passion slump.',
    relationshipMeaningTh: 'โชคดี ดวงชะตาเริ่มดีขึ้น ความรักมีโอกาสใหม่หรือมีคนมาขายขนมจีบ มีปฏิสัมพันธ์ที่ดีต่อกัน แต่ต้องระวังความเฉื่อยชาหลังจากหมดช่วงโปรโมชั่น',
    relationshipMeaningVi: 'Cát. Vận thế dần vào cảnh đẹp, tình cảm đón nhận chuyển biến mới hoặc có người theo đuổi. Đôi bên tương tác tích cực, đầy mong đợi. Cần phòng sau khi hết nhiệt tình sẽ bị hụt hơi.',
    category: "吉",
    scoreRange: [74, 86]
  },
  20: {
    name: "风地观",
    nameEn: "Contemplation",
    nameEs: "La Contemplación",
    nameFr: "La Contemplation",
    nameTh: 'กวาน (การเพ่งพินิจ)',
    nameVi: 'Phong Địa Quán',
    symbol: "☴☷",
    nature: "观察",
    natureEn: "Contemplative View",
    natureEs: "Observación / Mirada",
    natureFr: "Observation / Regard",
    judgment: "盥而不荐有孚顒若",
    judgmentEn: "Advantageous to move, advantageous to cross the great river.",
    relationshipMeaning: '平。感情处于观察期，流于精神交流，缺乏实质行动。彼此都在衡量与审视，宜多展现诚意而非止步不前。',
    relationshipMeaningEn: 'Neutral. Observation phase; heavily reliant on mental/spiritual exchange with lack of real action. Both are evaluating; show sincerity rather than hesitating.',
    relationshipMeaningTh: 'ปานกลาง อยู่ในช่วงสังเกตการณ์ เน้นการแลกเปลี่ยนทางความคิดแต่ขาดการลงมือทำ ต่างฝ่ายต่างประเมินกันและกัน ควรแสดงความจริงใจมากกว่าลังเล',
    relationshipMeaningVi: 'Bình. Tình cảm đang trong giai đoạn quan sát, thiên về giao lưu tinh thần, thiếu hành động thực tế. Đôi bên đều đang cân nhắc và xem xét, nên thể hiện thành ý thay vì đứng im bất động.',
    category: "中",
    scoreRange: [61, 75]
  },
  21: {
    name: "火雷噬嗑",
    nameEn: "Biting Through",
    nameEs: "Morder el Obstáculo",
    nameFr: "Mordre au Travers",
    nameTh: 'ซื่อเค่อ (การขบเคี้ยวอุปสรรค)',
    nameVi: 'Hỏa Lôi Phệ Hạp',
    symbol: "☲☳",
    nature: "咬合",
    natureEn: "Decisive Action",
    natureEs: "Mordedura / Enganche",
    natureFr: "Morsure / Enclenchement",
    judgment: "亨利用狱",
    judgmentEn: "Proclaimed in the king's court. Crying out, danger.",
    relationshipMeaning: '凶。障碍重重，矛盾尖锐，常有激烈争吵甚至外界阻力。必须像咬碎硬物一般刚决果断，排除干扰。',
    relationshipMeaningEn: 'Inauspicious. Numerous obstacles and sharp conflicts, often with fierce arguments or external resistance. Must act resolutely to break through barriers.',
    relationshipMeaningTh: 'ไม่ดี อุปสรรคขวากหนามมากมาย ความขัดแย้งรุนแรง มีปากเสียงหรือแรงต้านจากภายนอก ต้องเด็ดขาดและหนักแน่นในการทลายกำแพงปัญหาร่วมกัน',
    relationshipMeaningVi: 'Hung. Trở ngại bủa vây, mâu thuẫn gay gắt, thường có tranh cãi kịch liệt hoặc lực cản từ bên ngoài. Phải kiên quyết quả đoạn như cắn vỡ vật cứng để gạt bỏ cản trở.',
    category: "中",
    scoreRange: [59, 73]
  },
  22: {
    name: "山火贲",
    nameEn: "Grace",
    nameEs: "La Gracia / La Elegancia",
    nameFr: "La Grâce / L'Élégance",
    nameTh: 'ปี้ (ความงดงามภายนอก)',
    nameVi: 'Sơn Hỏa Bí',
    symbol: "☶☲",
    nature: "文饰",
    natureEn: "Elegant Grace",
    natureEs: "Adorno / Ornamentación",
    natureFr: "Ornement / Embellissement",
    judgment: "亨。小利有攸往",
    judgmentEn: "The maiden is powerful. Do not marry a maiden.",
    relationshipMeaning: '平。重外表、轻实质，感情表面看似光鲜华丽，实则流于形式或缺乏深度。宜坦诚务实，追求内心的契合。',
    relationshipMeaningEn: 'Neutral. Focuses on appearance over substance. The relationship looks glamorous but lacks depth or authenticity. Be realistic and seek true inner connection.',
    relationshipMeaningTh: 'ปานกลาง เน้นภาพลักษณ์ภายนอกมากกว่าความจริง ความรักดูสวยหรูแต่ขาดความลึกซึ้ง ควรเปิดใจเป็นเนื้อแท้และแสวงหาความผูกพันทางใจที่แท้จริง',
    relationshipMeaningVi: 'Bình. Trọng vẻ bề ngoài, nhẹ bản chất, tình cảm bề ngoài trông có vẻ hào nhoáng nhưng thực chất chỉ là hình thức hoặc thiếu chiều sâu. Nên thành thật thực tế, theo đuổi sự hòa hợp nội tâm.',
    category: "中",
    scoreRange: [64, 78]
  },
  23: {
    name: "山地剥",
    nameEn: "Splitting Apart",
    nameEs: "La Desintegración / El Desgarramiento",
    nameFr: "L'Éclatement / L'Écorchage",
    nameTh: 'โป๋ (การลอกล่อน)',
    nameVi: 'Sơn Địa Bác',
    symbol: "☶☷",
    nature: "剥落",
    natureEn: "Peeling Away",
    natureEs: "Desprendimiento / Desgaste",
    natureFr: "Effritement / Détachement",
    judgment: "不利有攸往",
    judgmentEn: "The king arrives at the temple. Success.",
    relationshipMeaning: '大凶。基础动摇，感情面临分崩离析、背叛或小人破坏。不宜盲目挽留，此时静守、保护自己才是上策。',
    relationshipMeaningEn: 'Highly inauspicious. Foundations are shaken; relationship faces disintegration, betrayal, or sabotage by backstabbers. Do not force it; keeping quiet and self-preservation is best.',
    relationshipMeaningTh: 'ไม่ดีอย่างยิ่ง รากฐานสั่นคลอน ความสัมพันธ์เสี่ยงต่อการแตกหัก การทรยศ หรือถูกยุแยง ไม่ควรรั้งไว้โดยไร้สติ การนิ่งสงบและปกป้องตนเองคือทางออกที่ดีที่สุด',
    relationshipMeaningVi: 'Đại hung. Nền tảng lung lay, tình cảm đối mặt với tan vỡ, phản bội hoặc tiểu nhân phá hoại. Không nên mù quáng níu kéo, lúc này giữ mình, bảo vệ bản thân mới là thượng sách.',
    category: "待变",
    scoreRange: [42, 56]
  },
  24: {
    name: "地雷复",
    nameEn: "Return",
    nameEs: "El Retorno / El Renacimiento",
    nameFr: "Le Retour",
    nameTh: 'ฟู่ (การหวนคืน)',
    nameVi: 'Địa Lôi Phục',
    symbol: "☷☳",
    nature: "复归",
    natureEn: "Return & Recovery",
    natureEs: "Retorno / Regreso",
    natureFr: "Retour / Renouveau",
    judgment: "亨。出入无疾",
    judgmentEn: "Great success. Advantageous to see the great person.",
    relationshipMeaning: '吉。失去的感情有望失而复得，破镜重圆。是一个休养生息、重新开始的良机，过去的问题将逐渐解决。',
    relationshipMeaningEn: 'Auspicious. Lost love has a chance to return; reconciliation is possible. A great opportunity for a fresh start as past issues gradually resolve.',
    relationshipMeaningTh: 'โชคดี ความรักที่สูญเสียไปมีเกณฑ์ได้หวนคืนหรือถ่านไฟเก่าคุ เป็นโอกาสดีในการเริ่มต้นใหม่ ปัญหาในอดีตจะค่อยๆ คลี่คลายไปในทางที่ดี',
    relationshipMeaningVi: 'Cát. Tình cảm đã mất có hy vọng tìm lại được, gương vỡ lại lành. Là cơ hội tốt để dưỡng sức và bắt đầu lại, những vấn đề trong quá khứ sẽ dần được giải quyết.',
    category: "吉",
    scoreRange: [72, 84]
  },
  25: {
    name: "天雷无妄",
    nameEn: "Innocence",
    nameEs: "La Inocencia / Lo Inesperado",
    nameFr: "L'Innocence / L'Imprévu",
    nameTh: 'อู๋วั่ง (ความบริสุทธิ์)',
    nameVi: 'Thiên Lôi Vô Vọng',
    symbol: "☰☳",
    nature: "无妄",
    natureEn: "Spontaneous Integrity",
    natureEs: "Sin falsedad / Autenticidad",
    natureFr: "Sans fausseté / Authenticité",
    judgment: "元亨利贞",
    judgmentEn: "Success, firmness. The great person - auspicious, no blame.",
    relationshipMeaning: '平。感情宜顺应自然，保持纯粹，不可心存投机或强求妄动。常有突如其来的意外事件打乱计划，宜沉着应对。',
    relationshipMeaningEn: 'Neutral. Keep the relationship pure and natural; avoid opportunism or forced actions. Unexpected events may disrupt plans; stay calm.',
    relationshipMeaningTh: 'ปานกลาง ควรปล่อยให้ความรักเป็นไปอย่างบริสุทธิ์ตามธรรมชาติ อย่าคาดหวังหรือฝืนจนเกินไป มักมีเรื่องไม่คาดฝันเข้ามาแทรกแซง ต้องตั้งสติให้ดี',
    relationshipMeaningVi: 'Bình. Tình cảm nên thuận theo tự nhiên, giữ sự thuần khiết, không được đầu cơ hay khiên cưỡng hành động vô vọng. Thường có sự cố bất ngờ làm xáo trộn kế hoạch, nên bình tĩnh ứng phó.',
    category: "吉",
    scoreRange: [75, 87]
  },
  26: {
    name: "山天大畜",
    nameEn: "Great Taming",
    nameEs: "La Gran Fuerza Domesticadora",
    nameFr: "Le Grand Pouvoir d'Apprivoisement",
    nameTh: 'ต้าชู่ (การสะสมครั้งใหญ่)',
    nameVi: 'Sơn Thiên Đại Súc',
    symbol: "☶☰",
    nature: "积蓄",
    natureEn: "Accumulation",
    natureEs: "Gran Acumulación / Reserva",
    natureFr: "Grande Accumulation / Réserve",
    judgment: "利贞。不家食吉",
    judgmentEn: "On the si day, trust is established. Supreme success, advantageous, perseverance.",
    relationshipMeaning: '吉。感情基础深厚，能量与信任不断积累。利于长期规划及见家长。虽然当前略有克制或等待，但前途光明。',
    relationshipMeaningEn: 'Auspicious. Deep foundation with accumulating trust and energy. Favorable for long-term planning and meeting parents. Even with temporary restraint, the future is bright.',
    relationshipMeaningTh: 'โชคดี รากฐานความรักแน่นหนา ความเชื่อใจสะสมมากขึ้น เหมาะแก่การวางแผนระยะยาวหรือพาไปพบผู้ใหญ่ แม้ตอนนี้ต้องอดทนรอคอยแต่ อนาคตรุ่งโรจน์แน่นอน',
    relationshipMeaningVi: 'Cát. Nền tảng tình cảm sâu sắc, năng lượng và sự tin tưởng không ngừng tích lũy. Có lợi cho quy hoạch lâu dài và ra mắt gia đình. Tuy hiện tại có chút kìm nén hoặc chờ đợi, nhưng tiền đồ tươi sáng.',
    category: "吉",
    scoreRange: [76, 88]
  },
  27: {
    name: "山雷颐",
    nameEn: "Nourishment (The Corners of the Mouth)",
    nameEs: "Las Comisuras de la Boca / La Nutrición",
    nameFr: "Les Coins de la Bouche / La Nutrition",
    nameTh: 'อี๋ (การเลี้ยงดูฟูมฟัก)',
    nameVi: 'Sơn Lôi Di',
    symbol: "☶☳",
    nature: "颐养",
    natureEn: "Nourishment & Care",
    natureEs: "Nutrición / Sustento",
    natureFr: "Nourriture / Entretien",
    judgment: "贞吉。观颐自求口实",
    judgmentEn: "Success. Fear brings blessing.",
    relationshipMeaning: '平。注重言语沟通与生活照料。祸从口出，需防口舌摩擦。多关心彼此的身心健康与精神滋养，感情方能长久。',
    relationshipMeaningEn: 'Neutral. Focus on verbal communication and mutual care. Guard against sharp words causing friction. Nurture each other's physical and mental well-being for longevity.',
    relationshipMeaningTh: 'ปานกลาง เน้นการสื่อสารและการดูแลเอาใจใส่ชีวิตความเป็นอยู่ ระวังคำพูดที่อาจบาดหมางน้ำใจ ควรเติมเต็มพลังกายและใจให้กัน ความรักจึงจะยั่งยืน',
    relationshipMeaningVi: 'Bình. Chú trọng giao tiếp ngôn từ và chăm sóc cuộc sống. Họa từ miệng mà ra, cần phòng ma sát khẩu thiệt. Quan tâm nhiều hơn đến sức khỏe thể chất lẫn tinh thần của nhau thì tình cảm mới bền lâu.',
    category: "中",
    scoreRange: [63, 77]
  },
  28: {
    name: "泽风大过",
    nameEn: "Great Exceeding",
    nameEs: "El Gran Exceso",
    nameFr: "Le Grand Excès",
    nameTh: 'ต้ากั้ว (ความแบกรับหนักหน่วง)',
    nameVi: 'Trạch Phong Đại Quá',
    symbol: "☱☴",
    nature: "过甚",
    natureEn: "Excessive",
    natureEs: "Exceso / Demasía",
    natureFr: "Excès / Dépasser la mesure",
    judgment: "栋桡利有攸往亨",
    judgmentEn: "Keeping his back still, he does not obtain his body.",
    relationshipMeaning: '凶。压力过大，关系失衡，面临沉重的现实负担或感情危机（如栋梁弯曲）。无法承受时需果断寻找突破口。',
    relationshipMeaningEn: 'Inauspicious. Excessive pressure and imbalance; facing heavy practical burdens or crisis (like a sagging ridgepole). Find a breakthrough before it collapses.',
    relationshipMeaningTh: 'ไม่ดี ความกดดันสูงมาก ความสัมพันธ์เสียสมดุล แบกรับภาระในความเป็นจริงหรือวิกฤตความรักที่หนักหน่วงเกินไป ต้องหาทางออกอย่างเร่งด่วนก่อนจะพังทลาย',
    relationshipMeaningVi: 'Hung. Áp lực quá lớn, quan hệ mất cân bằng, đối mặt với gánh nặng thực tế nặng nề hoặc nguy cơ tình cảm (như kèo cột cong vẹo). Khi không thể chịu đựng cần quả đoán tìm lối thoát.',
    category: "待变",
    scoreRange: [50, 66]
  },
  29: {
    name: "坎为水",
    nameEn: "The Abysmal (Water)",
    nameEs: "Lo Abismal / El Agua",
    nameFr: "L'Insondable / L'Eau",
    nameTh: 'ข่าน (ห้วงน้ำลึก)',
    nameVi: 'Khảm Vi Thủy',
    symbol: "☵☵",
    nature: "陷险",
    natureEn: "Falling into Danger",
    natureEs: "Peligro / Inmersión",
    natureFr: "Danger / Immersion",
    judgment: "习坎有孚维心亨",
    judgmentEn: "The maiden marries. Auspicious, advantageous to persevere.",
    relationshipMeaning: '大凶。重重险陷，危机四伏。感情充斥着猜忌、不安或陷入无法自拔的困境。需保持内心诚信，谨慎行事，切勿铤而走险。',
    relationshipMeaningEn: 'Highly inauspicious. Surrounded by dangers and crises. Relationship is full of suspicion, insecurity, or inescapable dilemmas. Maintain integrity and act with caution.',
    relationshipMeaningTh: 'ไม่ดีอย่างยิ่ง เต็มไปด้วยภยันตรายและวิกฤตซ้ำซ้อน ความสัมพันธ์มีแต่ความหวาดระแวง ไม่มั่นคง หรือติดอยู่ในหลุมพราง ต้องมีสติและซื่อสัตย์ อย่าเสี่ยงทำสิ่งที่ผิด',
    relationshipMeaningVi: 'Đại hung. Hiểm họa trùng trùng, nguy cơ bủa vây. Tình cảm tràn ngập nghi kỵ, bất an hoặc rơi vào khốn cảnh không thể tự thoát ra. Cần giữ vững lòng thành, cẩn trọng hành sự, tuyệt đối không liều lĩnh.',
    category: "中",
    scoreRange: [55, 69]
  },
  30: {
    name: "离为火",
    nameEn: "The Clinging (Fire)",
    nameEs: "Lo Adherente / El Fuego",
    nameFr: "L'Attachement / Le Feu",
    nameTh: 'หลี (เปลวไฟ)',
    nameVi: 'Ly Vi Hỏa',
    symbol: "☲☲",
    nature: "附丽",
    natureEn: "Attachment & Adherence",
    natureEs: "Adhesión / Resplandor",
    natureFr: "Adhésion / Éclat",
    judgment: "利贞亨",
    judgmentEn: "Advancing - misfortune. Nothing advantageous.",
    relationshipMeaning: '吉。热情似火，充满光明与希望，彼此依附。但火势过旺易导致脾气暴躁、缺乏耐性，需保持外明内柔，文明相待。',
    relationshipMeaningEn: 'Auspicious. Passionate like fire, full of light and hope, clinging to each other. However, excessive fire leads to hot tempers and impatience; remain gentle inside.',
    relationshipMeaningTh: 'โชคดี ความรักร้อนแรงดั่งไฟ เต็มไปด้วยความหวังและการพึ่งพาอาศัยกัน แต่ไฟที่แรงเกินไปอาจทำให้ใจร้อนและขาดความอดทน ควรประคองด้วยความอ่อนโยน',
    relationshipMeaningVi: 'Cát. Nhiệt tình như lửa, đầy quang minh và hy vọng, nương tựa lẫn nhau. Nhưng lửa quá vượng dễ dẫn đến tính khí bạo táo, thiếu kiên nhẫn, cần giữ ngoài sáng trong nhu, đối xử văn minh.',
    category: "吉",
    scoreRange: [77, 89]
  },
  31: {
    name: "泽山咸",
    nameEn: "Influence (Wooing)",
    nameEs: "La Influencia / El Cortejo",
    nameFr: "L'Influence / L'Attraction",
    nameTh: 'เสียน (แรงดึงดูดใจ)',
    nameVi: 'Trạch Sơn Hàm',
    symbol: "☱☶",
    nature: "感应",
    natureEn: "Mutual Response",
    natureEs: "Resonancia / Atracción mutua",
    natureFr: "Résonance / Influence mutuelle",
    judgment: "亨利贞取女吉",
    judgmentEn: "Success. The king need not worry. It is fitting at noon.",
    relationshipMeaning: '大吉。少男少女心灵感应，第一印象极佳，彼此深深吸引，充满浪漫情调。极其利于恋爱发展，两情相悦。',
    relationshipMeaningEn: 'Highly auspicious. Telepathic connection and excellent first impression. Deep mutual attraction, highly romantic, perfect for dating and mutual affection.',
    relationshipMeaningTh: 'เป็นมงคลยิ่ง สัญญาณใจตรงกันอย่างรุนแรง ความประทับใจแรกพบดีเยี่ยม ดึงดูดกันและกันอย่างลึกซึ้ง เต็มไปด้วยความโรแมนติกและความสมหวังในรัก',
    relationshipMeaningVi: 'Đại cát. Trai tài gái sắc tâm linh tương thông, ấn tượng đầu tiên cực tốt, đôi bên thu hút sâu sắc, tràn ngập tình điệu lãng mạn. Cực kỳ có lợi cho phát triển tình cảm, hai bên tình nguyện.',
    category: "大吉",
    scoreRange: [86, 97]
  },
  32: {
    name: "雷风恒",
    nameEn: "Duration (Perseverance)",
    nameEs: "La Duración / La Constancia",
    nameFr: "La Durée / La Constance",
    nameTh: 'เหิง (ความยั่งยืนคงมั่น)',
    nameVi: 'Lôi Phong Hằng',
    symbol: "☳☴",
    nature: "恒久",
    natureEn: "Enduring",
    natureEs: "Permanencia / Eternidad",
    natureFr: "Permanence / Éternité",
    judgment: "亨无咎利贞",
    judgmentEn: "Minor success. The traveler - firmness, auspicious.",
    relationshipMeaning: '吉。恒久稳定，细水长流。虽然缺乏新鲜感，但关系坚如磐石，利于缔结良缘、白头偕老。贵在坚持初心。',
    relationshipMeaningEn: 'Auspicious. Long-lasting and stable, a slow-burning bond. Though lacking novelty, the relationship is rock-solid, favorable for marriage and lifelong commitment. Key is maintaining the initial intent.',
    relationshipMeaningTh: 'โชคดี มั่นคงยาวนาน รักแท้ดูแลได้ แม้จะขาดความแปลกใหม่แต่ความสัมพันธ์หนักแน่นดั่งหินผา ดีสำหรับการแต่งงาน คีย์สำคัญคือการรักษาปณิธานแรกเริ่ม',
    relationshipMeaningVi: 'Cát. Hằng cửu ổn định, bền vững lâu dài. Tuy thiếu đi cảm giác tươi mới nhưng quan hệ vững như bàn thạch, lợi cho việc kết tóc se duyên, bạc đầu giai lão. Quý ở chỗ kiên trì tâm nguyện ban đầu.',
    category: "大吉",
    scoreRange: [84, 95]
  },
  33: {
    name: "天山遁",
    nameEn: "Retreat",
    nameEs: "La Retirada",
    nameFr: "La Retraite",
    nameTh: 'ตุ้น (การปลีกตัว)',
    nameVi: 'Thiên Sơn Độn',
    symbol: "☰☶",
    nature: "退避",
    natureEn: "Retreat & Avoidance",
    natureEs: "Retirada / Evasión",
    natureFr: "Retraite / Évasion",
    judgment: "亨小利贞",
    judgmentEn: "Minor success. Advantageous to move.",
    relationshipMeaning: '凶。运势衰退，危机渐显。此时不宜盲目进攻或强求在一起，适当拉开距离、以退为进，保持冷静才是保护感情的良策。',
    relationshipMeaningEn: 'Inauspicious. Declining fortune with emerging crises. Do not force intimacy; taking a step back and keeping a strategic distance is best.',
    relationshipMeaningTh: 'ไม่ดี ดวงชะตาถดถอยและเริ่มมีวิกฤต ไม่ควรฝืนดึงดันดึงชิดใกล้ การเว้นระยะห่างและถอยออกมาตั้งหลักคือทางออกที่ดีที่สุด',
    relationshipMeaningVi: 'Hung. Vận thế suy thoái, nguy cơ dần lộ diện. Lúc này không nên mù quáng tấn công hay khiên cưỡng bên nhau, tạm thời giữ khoảng cách, lấy lui làm tiến mới là thượng sách.',
    category: "中",
    scoreRange: [58, 72]
  },
  34: {
    name: "雷天大壮",
    nameEn: "Great Power (Strength)",
    nameEs: "El Poder de lo Grande",
    nameFr: "La Puissance du Grand",
    nameTh: 'ต้าจ้าง (ความแข็งแกร่งยิ่งใหญ่)',
    nameVi: 'Lôi Thiên Đại Tráng',
    symbol: "☳☰",
    nature: "壮盛",
    natureEn: "Flourishing Power",
    natureEs: "Vigor / Esplendor",
    natureFr: "Puissance / Vigueur",
    judgment: "利贞",
    judgmentEn: "Success, advantageous, firm.",
    relationshipMeaning: '吉。声势浩大，充满力量与冲劲。但需注意大壮利贞，切忌过度强势、任性冲动或对伴侣施加压力，柔和相处方能持久。',
    relationshipMeaningEn: 'Auspicious. Powerful and full of momentum. However, avoid being overly dominant or impulsive; softening your approach ensures longevity.',
    relationshipMeaningTh: 'โชคดี มีพลังและแรงขับเคลื่อนสูงมาก แต่ต้องระวังอย่าทำตัวเป็นใหญ่หรือใช้อารมณ์ข่มคนรัก ความอ่อนโยนจะช่วยให้รักยั่งยืน',
    relationshipMeaningVi: 'Cát. Thanh thế vang dội, đầy sức mạnh và xung lực. Nhưng cần chú ý tránh quá mức mạnh mẽ, tùy hứng bốc đồng hoặc gây áp lực cho đối phương, dịu dàng mới có thể bền lâu.',
    category: "吉",
    scoreRange: [74, 86]
  },
  35: {
    name: "火地晋",
    nameEn: "Progress",
    nameEs: "El Progreso",
    nameFr: "Le Progrès",
    nameTh: 'จิ้น (ความก้าวหน้าโชติช่วง)',
    nameVi: 'Hỏa Địa Tấn',
    symbol: "☲☷",
    nature: "晋升",
    natureEn: "Advancement",
    natureEs: "Ascenso / Avance",
    natureFr: "Ascension / Avancement",
    judgment: "康侯用锡马蕃庶",
    judgmentEn: "The king arrives at the temple. Advantageous to cross the great river.",
    relationshipMeaning: '大吉。如日中天，感情运势节节攀升。彼此吸引力倍增，沟通顺畅且充满正能量，非常适合公开关系、谈婚论嫁或共同创业。',
    relationshipMeaningEn: 'Highly auspicious. Rapid progress like the rising sun. Mutual attraction peaks with positive energy; perfect for making the relationship public or planning marriage.',
    relationshipMeaningTh: 'เป็นมงคลยิ่ง ความรักรุ่งโรจน์ดั่งดวงอาทิตย์ยามเที่ยงวัน ต่างฝ่ายต่างดึงดูดกัน มีพลังบวก เหมาะสำหรับการเปิดตัวหรือคุยเรื่องแต่งงาน',
    relationshipMeaningVi: 'Đại cát. Như mặt trời ban trưa, vận trình tình cảm thăng tiến không ngừng. Sức hút đôi bên tăng vọt, giao tiếp thông suốt, rất thích hợp công khai quan hệ hoặc tính chuyện trăm năm.',
    category: "吉",
    scoreRange: [73, 85]
  },
  36: {
    name: "地火明夷",
    nameEn: "Darkening of the Light",
    nameEs: "El Oscurecimiento de la Luz",
    nameFr: "L'Obscurcissement de la Lumière",
    nameTh: 'หมิงอี๋ (แสงสว่างที่ถูกบดบัง)',
    nameVi: 'Địa Hỏa Minh Di',
    symbol: "☷☲",
    nature: "损伤",
    natureEn: "Harm & Injury",
    natureEs: "Herida / Daño",
    natureFr: "Blessure / Dommage",
    judgment: "利艰贞",
    judgmentEn: "Success. Bitter limitation. One must not persevere.",
    relationshipMeaning: '凶。光明受损，感情进入晦暗期。充满误解、伤害或内心痛苦。此时宜敛藏锋芒，隐忍包容，切勿在情绪失控时做重大决定。',
    relationshipMeaningEn: 'Inauspicious. Darkness prevails; relationship enters a gloomy phase filled with misunderstandings and pain. Keep a low profile and avoid impulsive decisions.',
    relationshipMeaningTh: 'ไม่ดี ความรักตกอยู่ในความมืดมน เต็มไปด้วยความเข้าใจผิดและความเจ็บปวด ควรเก็บซ่อนความรู้สึกและอดทนไว้ อย่าตัดสินใจเรื่องใหญ่ยามอารมณ์ชั่ววูบ',
    relationshipMeaningVi: 'Hung. Ánh sáng bị tổn hại, tình cảm rơi vào giai đoạn tăm tối. Đầy rẫy hiểu lầm, tổn thương hoặc đau khổ nội tâm. Lúc này nên thu mình nhẫn nhịn, tránh quyết định khi kích động.',
    category: "小凶",
    scoreRange: [47, 61]
  },
  37: {
    name: "火风鼎",
    nameEn: "The Cauldron",
    nameEs: "El Clan / La Familia",
    nameFr: "Le Clan / La Famille",
    nameTh: 'เจียเหริน (คนในครอบครัว)',
    nameVi: 'Phong Hỏa Gia Nhân',
    symbol: "☲☴",
    nature: "鼎新",
    natureEn: "Establishing New Order",
    natureEs: "Espíritu Familiar / Interior",
    natureFr: "Esprit de Famille / Intérieur",
    judgment: "元吉亨",
    judgmentEn: "Pig and fish. Auspicious. Advantageous to cross the great river.",
    relationshipMeaning: '吉。充满温馨、责任与陪伴的关系。彼此各司其职，相处融洽，极具家庭归属感。利于同居、见家长及组建家庭。',
    relationshipMeaningEn: 'Auspicious. Filled with warmth, responsibility, and companionship. Both parties play their roles well with a strong sense of home. Great for moving in together.',
    relationshipMeaningTh: 'โชคดี ความสัมพันธ์อบอุ่น มีความรับผิดชอบและดูแลกันดั่งคนในครอบครัว อยู่กันได้ดี เหมาะสำหรับการใช้ชีวิตคู่หรือสร้างอนาคตร่วมกัน',
    relationshipMeaningVi: 'Cát. Mối quan hệ đầy ấm áp, trách nhiệm và sự đồng hành. Đôi bên đều làm tốt bổn phận, chung sống hòa hợp, mang lại cảm giác gia đình. Lợi cho việc chung sống hoặc kết hôn.',
    category: "吉",
    scoreRange: [75, 87]
  },
  38: {
    name: "火泽睽",
    nameEn: "Opposition (Divergence)",
    nameEs: "La Oposición / El Antagonismo",
    nameFr: "L'Opposition / L'Aliénation",
    nameTh: 'เค่วย (ความขัดแย้งเหินห่าง)',
    nameVi: 'Hỏa Trạch Khuê',
    symbol: "☲☱",
    nature: "背离",
    natureEn: "Separation",
    natureEs: "Divergencia / Separación",
    natureFr: "Divergence / Séparation",
    judgment: "小事吉",
    judgmentEn: "Success, advantageous, firm. Can do small things, cannot do great things.",
    relationshipMeaning: '凶。人心背离，同床异梦。因性格、价值观差异导致频繁摩擦，难以达成共识。小事尚可，大事不宜，需寻找求同存异的支点。',
    relationshipMeaningEn: 'Inauspicious. Divergent paths and emotional distance. Frequent friction due to differing values. Seek common ground while respecting differences.',
    relationshipMeaningTh: 'ไม่ดี ความคิดสวนทางกัน มองคนละมุม เกิดการกระทบกระทั่งจากทัศนคติที่ต่างกันบ่อยครั้ง ต้องหาจุดตรงกลางและยอมรับความต่างให้ได้',
    relationshipMeaningVi: 'Hung. Đồng sàng dị mộng, lòng người xa cách. Do tính cách, quan điểm sống khác biệt dẫn đến ma sát thường xuyên, khó đạt đồng thuận. Cần tìm điểm chung, gạt bỏ bất đồng.',
    category: "中",
    scoreRange: [56, 70]
  },
  39: {
    name: "水山蹇",
    nameEn: "Obstruction",
    nameEs: "La Obstrucción / El Impedimento",
    nameFr: "L'Obstruction / L'Entrave",
    nameTh: 'เจี่ยน (อุปสรรคขวากหนาม)',
    nameVi: 'Thủy Sơn Kiển',
    symbol: "☵☶",
    nature: "跛难",
    natureEn: "Difficulty & Limping",
    natureEs: "Dificultad / Cojera",
    natureFr: "Difficulté / Boitement",
    judgment: "利西南不利东北",
    judgmentEn: "Success. The little fox has almost crossed, wets its tail.",
    relationshipMeaning: '凶。前路险阻，举步维艰。感情面临严重的现实阻力（如经济、地域或家庭反对），强行推进只会碰壁，宜反求诸己，寻求外援。',
    relationshipMeaningEn: 'Inauspicious. Hardships ahead; relationship faces severe practical obstacles (finance, long distance, or family disapproval). Stop and review your options.',
    relationshipMeaningTh: 'ไม่ดี หนทางข้างหน้ามีแต่สิ่งกีดขวาง ความรักเจอแรงต้านจากความจริง (เช่น ครอบครัวไม่ยอมรับ หรือระยะทาง) ควรหยุดทบทวนและหาที่ปรึกษา',
    relationshipMeaningVi: 'Hung. Đường đi hiểm trở, bước đi gian nan. Tình cảm đối mặt với trở lực thực tế nghiêm trọng (kinh tế, địa lý hoặc gia đình phản đối), cố chấp chỉ rước lấy thất bại.',
    category: "小凶",
    scoreRange: [49, 63]
  },
  40: {
    name: "雷水解",
    nameEn: "Deliverance (Resolution)",
    nameEs: "La Liberación",
    nameFr: "La Libération",
    nameTh: 'เจี่ย (การคลี่คลาย)',
    nameVi: 'Lôi Thủy Giải',
    symbol: "☳☵",
    nature: "化解",
    natureEn: "Dissolution",
    natureEs: "Disolución / Alivio",
    natureFr: "Résolution / Dissolution",
    judgment: "利西南",
    judgmentEn: "Favorable in the southwest.",
    relationshipMeaning: '吉。劫后余生，误会冰释。过去的矛盾、冷战或危机将迎来转机并获得解决。宜把握时机既往不咎，让关系重新出发。',
    relationshipMeaningEn: 'Auspicious. Misunderstandings dissolve and crises recede. A perfect timing to forgive, forget, and let the relationship move forward smoothly.',
    relationshipMeaningTh: 'โชคดี วิกฤตคลี่คลาย ความเข้าใจผิดได้รับการแก้ไข ความขัดแย้งหรือสงครามเย็นในอดีตจะสิ้นสุดลง ควรให้อภัยและเริ่มต้นใหม่ร่วมกัน',
    relationshipMeaningVi: 'Cát. Tai qua nạn khỏi, băng tan hiểu lầm. Những mâu thuẫn, chiến tranh lạnh hay nguy cơ trước đây sẽ được giải quyết. Nên nắm bắt thời cơ, không lường gạt quá khứ để làm lại từ đầu.',
    category: "吉",
    scoreRange: [71, 83]
  },
  41: {
    name: "山泽损",
    nameEn: "Decrease",
    nameEs: "La Disminución",
    nameFr: "La Diminution",
    nameTh: 'สุ่น (การเสียสละ)',
    nameVi: 'Sơn Trạch Tổn',
    symbol: "☶☱",
    nature: "减损",
    natureEn: "Reduction & Restraint",
    natureEs: "Reducción / Pérdida",
    natureFr: "Réduction / Perte",
    judgment: "有孚元吉无咎",
    judgmentEn: "Sincere, great success, no blame.",
    relationshipMeaning: '平。感情需要一方做出物质、精力或情绪上的牺牲与奉献。损己利人，虽然暂时感到吃力，但只要出于真心，长远来看反能换来稳固。',
    relationshipMeaningEn: 'Neutral. Requires sacrifice of material, energy, or emotion from one party. Though demanding now, sincere devotion will yield long-term stability.',
    relationshipMeaningTh: 'ปานกลาง ต้องมีฝ่ายใดฝ่ายหนึ่งยอมเสียสละทรัพย์สิน พลังงาน หรืออารมณ์เพื่ออีกฝ่าย แม้จะเหนื่อยในตอนนี้ แต่หากทำด้วยใจจริงจะส่งผลดีในระยะยาว',
    relationshipMeaningVi: 'Bình. Tình cảm đòi hỏi một bên phải hy sinh, cống hiến về vật chất, tinh thần hoặc cảm xúc. Tổn mình lợi người, tuy tạm thời vất vả nhưng nếu chân thành sẽ đổi lại sự bền vững.',
    category: "中",
    scoreRange: [62, 76]
  },
  42: {
    name: "风雷益",
    nameEn: "Increase",
    nameEs: "El Aumento",
    nameFr: "L'Augmentation",
    nameTh: 'อี้ (ความเพิ่มพูน)',
    nameVi: 'Phong Lôi Ích',
    symbol: "☴☳",
    nature: "增益",
    natureEn: "Growth & Increase",
    natureEs: "Ganancia / Beneficio",
    natureFr: "Gain / Enrichissement",
    judgment: "利有攸往利涉大川",
    judgmentEn: "Advantageous to go forward, advantageous to cross the great river.",
    relationshipMeaning: '大吉。相辅相成，共同成长。彼此在精神与物质上都能带给对方好运，关系极具建设性。是携手共创未来、订婚结婚的绝佳时机。',
    relationshipMeaningEn: 'Highly auspicious. Mutual growth and support. Both partners bring good fortune and constructiveness to each other's lives. Excellent time for marriage.',
    relationshipMeaningTh: 'เป็นมงคลยิ่ง ส่งเสริมและเติบโตร่วมกัน นำพาโชคคลาภและความสุขมาให้แก่กัน ความสัมพันธ์ก้าวหน้าอย่างมาก เหมาะแก่การจัดงานมงคลหมั้นหมาย',
    relationshipMeaningVi: 'Đại cát. Tương phụ tương thành, cùng nhau trưởng thành. Đôi bên đem lại vận may cho nhau cả về tinh thần lẫn vật chất. Là thời cơ tuyệt vời để hướng tới hôn nhân viên mãn.',
    category: "吉",
    scoreRange: [79, 91]
  },
  43: {
    name: "泽天夬",
    nameEn: "Breakthrough",
    nameEs: "La Irrupción / La Resolución",
    nameFr: "La Percée / La Résolution",
    nameTh: 'ไก้ว (การตัดสินใจเด็ดขาด)',
    nameVi: 'Trạch Thiên Quái',
    symbol: "☱☰",
    nature: "决断",
    natureEn: "Decisive Action",
    natureEs: "Decisión / Determinación",
    natureFr: "Décision / Trancher",
    judgment: "扬于王庭号厉",
    judgmentEn: "Proclaimed in the king's court — crying out, danger.",
    relationshipMeaning: '平。面临重大抉择或摊牌时刻，矛盾已到不得不解决的临界点。决断需果断且有智慧，切忌意气用事，要用光明正大的方式解决。',
    relationshipMeaningEn: 'Neutral. Time for a major decision or showdown. Issues have reached a boiling point; resolve them resolutely and righteously rather than emotionally.',
    relationshipMeaningTh: 'ปานกลาง ถึงเวลาต้องตัดสินใจครั้งใหญ่หรือเปิดอกคุย ปัญหาถึงจุดที่ต้องสะสาง ต้องเด็ดขาดและใช้สติ อย่าใช้อารมณ์ตัดสินปัญหา',
    relationshipMeaningVi: 'Bình. Đối mặt với lựa chọn lớn hoặc thời khắc ngửa bài, mâu thuẫn đã đến điểm tới hạn phải giải quyết. Cần quả quyết và khôn ngoan, tránh hành xử theo cảm tính.',
    category: "待变",
    scoreRange: [51, 65]
  },
  44: {
    name: "天风姤",
    nameEn: "Coming to Meet",
    nameEs: "Encantamiento / El Encuentro",
    nameFr: "La Rencontre",
    nameTh: 'โก้ว (การพบเจอโดยบังเอิญ)',
    nameVi: 'Thiên Phong Cấu',
    symbol: "☰☴",
    nature: "邂逅",
    natureEn: "Unexpected Encounter",
    natureEs: "Encuentro Fortuito",
    natureFr: "Rencontre Fortuite",
    judgment: "女壮勿用取女",
    judgmentEn: "The maiden is powerful — do not marry a maiden.",
    relationshipMeaning: '凶。邂逅之中暗藏危机，多属艳遇或桃花劫。一方可能带有强烈的控制欲或不可告人的目的，女强男弱，感情难以长久维系。',
    relationshipMeaningEn: 'Inauspicious. A chance encounter hiding potential hazards or infidelity. One party may be overly dominant or deceitful; difficult for long-term commitment.',
    relationshipMeaningTh: 'ไม่ดี การพบเจอที่แฝงไปด้วยวิกฤตหรือรักสามเส้า ฝ่ายใดฝ่ายหนึ่งอาจมีความต้องการควบคุมสูงหรือมีเจตนาซ่อนเร้น ยากที่จะคบกันได้ยาวนาน',
    relationshipMeaningVi: 'Hung. Tình cờ gặp gỡ nhưng ẩn tàng nguy cơ, dễ là đào hoa sát. Một bên có thể có ham muốn kiểm soát mạnh mẽ hoặc mục đích khó nói, tình cảm khó duy trì lâu dài.',
    category: "中",
    scoreRange: [65, 79]
  },
  45: {
    name: "泽地萃",
    nameEn: "Gathering Together",
    nameEs: "La Reunión / La Colección",
    nameFr: "Le Rassemblement / La Collection",
    nameTh: 'ฉุ่ย (การรวมตัว)',
    nameVi: 'Trạch Địa Tụy',
    symbol: "☱☷",
    nature: "聚集",
    natureEn: "Gathering Together",
    natureEs: "Congregación / Unión",
    natureFr: "Réunion / Convergence",
    judgment: "王假有庙亨",
    judgmentEn: "The king arrives at the temple — success.",
    relationshipMeaning: '吉。群英荟萃，感情生活丰富精彩。彼此圈子融合，能得到双方亲友的大力支持。恋爱者关系进一步升华，利于聚会与公开。',
    relationshipMeaningEn: 'Auspicious. Social circles merge beautifully; relationship receives strong support from family and friends. Great for social gatherings and formalizing ties.',
    relationshipMeaningTh: 'โชคดี สังคมของทั้งคู่หลอมรวมกันได้ดี ได้รับการสนับสนุนอย่างล้นหลามจากครอบครัวและเพื่อนฝูง ความสัมพันธ์พัฒนาขึ้นอีกขั้น',
    relationshipMeaningVi: 'Cát. Vòng bạn bè đôi bên hòa nhập, nhận được sự ủng hộ mạnh mẽ từ người thân, bạn bè. Người đang yêu tình cảm càng thêm thăng hoa, lợi cho tụ họp và công khai.',
    category: "吉",
    scoreRange: [74, 86]
  },
  46: {
    name: "地风升",
    nameEn: "Pushing Upward",
    nameEs: "El Ascenso",
    nameFr: "La Poussée Vers le Haut",
    nameTh: 'เซิง (การเลื่อนขั้น)',
    nameVi: 'Địa Phong Sâng',
    symbol: "☷☴",
    nature: "上升",
    natureEn: "Rising Upward",
    natureEs: "Elevación / Surgimiento",
    natureFr: "Élévation / Ascension",
    judgment: "元亨用见大人",
    judgmentEn: "Great success — advantageous to see the great person.",
    relationshipMeaning: '吉。稳步上升，顺风顺水。感情基础在日常陪伴中不断加固，由浅入深。只要坚持正道、脚踏实地，感情定能走向圆满。',
    relationshipMeaningEn: 'Auspicious. Steady upward progress. The bond strengthens through daily companionship, growing from shallow to deep. Stay grounded for a blissful ending.',
    relationshipMeaningTh: 'โชคดี ความสัมพันธ์พัฒนาขึ้นอย่างมั่นคงและราบรื่น ผูกพันกันลึกซึ้งขึ้นเรื่อยๆ จากการดูแลกันในทุกวัน หากซื่อสัตย์ต่อกันจะสมหวังแน่นอน',
    relationshipMeaningVi: 'Cát. Vững bước đi lên, thuận buồm xuôi gió. Nền tảng tình cảm được củng cố qua sự đồng hành mỗi ngày, từ nông đến sâu. Chỉ cần kiên trì chính đạo, tình cảm sẽ viên mãn.',
    category: "吉",
    scoreRange: [76, 88]
  },
  47: {
    name: "泽水困",
    nameEn: "Oppression",
    nameEs: "La Opresión / El Agotamiento",
    nameFr: "L'Oppression / L'Épuisement",
    nameTh: 'ควิ่น (ความยากลำบาก)',
    nameVi: 'Trạch Thủy Khốn',
    symbol: "☱☵",
    nature: "困顿",
    natureEn: "Hardship & Constraint",
    natureEs: "Aflicción / Estancamiento",
    natureFr: "Détresse / Épuisement",
    judgment: "亨贞大人吉无咎",
    judgmentEn: "Success, perseverance — the great person, auspicious, no blame.",
    relationshipMeaning: '大凶。身陷绝境，举步维艰。感情因经济拮据、言语误解或外界压迫而陷入极度痛苦与匮乏之中。此时考验的是彼此能否同甘共苦。',
    relationshipMeaningEn: 'Highly inauspicious. Trapped in a desperate dilemma. Relationship suffers from financial strain, verbal blocks, or heavy oppression. Tests your loyalty.',
    relationshipMeaningTh: 'ไม่ดีอย่างยิ่ง ตกอยู่ในสถานการณ์ที่ยากลำบาก ความรักถูกกดดันจากปัญหาเงินทองหรือความไม่เข้าใจกันอย่างรุนแรง เป็นช่วงพิสูจน์รักแท้ว่าจะร่วมทุกข์ร่วมสุขได้ไหม',
    relationshipMeaningVi: 'Đại hung. Rơi vào tuyệt cảnh, khốn đốn trăm bề. Tình cảm vì kinh tế eo hẹp, ngôn từ bất đồng hoặc áp lực bên ngoài mà rơi vào đau khổ cùng cực. Thử thách lòng đồng cam cộng khổ.',
    category: "小凶",
    scoreRange: [46, 60]
  },
  48: {
    name: "水风井",
    nameEn: "The Well",
    nameEs: "El Pozo de Agua",
    nameFr: "Le Puits",
    nameTh: 'จิ่ง (บ่อน้ำ)',
    nameVi: 'Thủy Phong Tỉnh',
    symbol: "☵☴",
    nature: "井养",
    natureEn: "Well Nourishment",
    natureEs: "Sustento del pozo / Cuidado",
    natureFr: "Abreuvoir / Entretien",
    judgment: "改邑不改井",
    judgmentEn: "Change the town but not the well. Core values remain constant.",
    relationshipMeaning: '平。感情进入平淡期，如井水般恒久却缺乏波澜。彼此需深入挖掘内心的情感需求，不断往关系里注入新鲜养分，方能避免枯竭。',
    relationshipMeaningEn: 'Neutral. Relationship enters a dull phase; steady like a well but lacks excitement. Actively nurture and refresh the bond to prevent emotional exhaustion.',
    relationshipMeaningTh: 'ปานกลาง ความรักมาถึงจุดที่ราบเรียบดั่งบ่อน้ำที่นิ่งสงบแต่ขาดความตื่นเต้น ต้องหมั่นเติมความหวานและดูแลใจกันเพื่อไม่ให้ความสัมพันธ์แห้งแล้ง',
    relationshipMeaningVi: 'Bình. Tình cảm bước vào giai đoạn bình lặng, như nước giếng hằng cửu nhưng thiếu đi sóng gợn. Đôi bên cần đào sâu nhu cầu cảm xúc của nhau, liên tục bổ sung dưỡng chất mới tránh cạn kiệt.',
    category: "吉",
    scoreRange: [73, 85]
  },
  49: {
    name: "泽火革",
    nameEn: "Revolution",
    nameEs: "La Revolución / Mudanza",
    nameFr: "La Révolution / La Mue",
    nameTh: 'เก้อ (การปฏิวัติเปลี่ยนแปลง)',
    nameVi: 'Trạch Hỏa Cách',
    symbol: "☱☲",
    nature: "变革",
    natureEn: "Radical Change",
    natureEs: "Transformación / Revolución",
    natureFr: "Transformation / Révolution",
    judgment: "巳日乃孚元亨利贞",
    judgmentEn: "On the si day, trust is established — supreme success, advantageous, perseverance.",
    relationshipMeaning: '吉。顺应时势，洗心革面。感情将迎来彻底的转变（如改变相处模式、告别过去甚至旧情换新颜）。顺应变化、摒弃旧习方大吉。',
    relationshipMeaningEn: 'Auspicious. Adapt to changes and renew yourself. The relationship faces a thorough transformation (e.g., changing patterns or leaving the past behind). Embrace the change.',
    relationshipMeaningTh: 'โชคดี ถึงเวลาปฏิวัติและเปลี่ยนแปลงความสัมพันธ์ไปสู่สิ่งใหม่ ปรับเปลี่ยนพฤติกรรมเดิมๆ แล้วจะเกิดผลดีอย่างคาดไม่ถึง',
    relationshipMeaningVi: 'Cát. Thuận theo thời thế, cải cách đổi mới. Tình cảm sẽ đón nhận sự chuyển biến triệt để (như thay đổi cách ứng xử, từ biệt quá khứ). Thuận theo biến đổi mới đại cát.','
    category: "中",
    scoreRange: [61, 75]
  },
  50: {
    name: "火风鼎",
    nameEn: "The Cauldron",
    nameEs: "El Caldero",
    nameFr: "Le Chaudron",
    nameTh: 'ติ่ง (หม้อสามขาเพรียบพร้อม)',
    nameVi: 'Hỏa Phong Đỉnh',
    symbol: "☲☴",
    nature: "鼎新",
    natureEn: "Establishing New Order",
    natureEs: "Renovación / Refundación",
    natureFr: "Renouveau / Refondation",
    judgment: "元吉亨",
    judgmentEn: "Supreme auspiciousness, success.",
    relationshipMeaning: '大吉。三足鼎立，稳如泰山。感情不仅稳固，而且能互相成就，物质与精神双丰收。极利于确立关系或步入婚姻殿堂。',
    relationshipMeaningEn: 'Highly auspicious. Exceptionally stable and supportive. Both parties achieve mutual success, flourishing materially and spiritually. Ideal for marriage.',
    relationshipMeaningTh: 'เป็นมงคลยิ่ง มั่นคงดั่งหม้อสามขา ความสัมพันธ์เกื้อหนุนกันให้เจริญรุ่งเรือง ทั้งฐานะและจิตใจ ดีเลิศสำหรับการแต่งงานสร้างครอบครัว',
    relationshipMeaningVi: 'Đại cát. Tam túc đỉnh lập, vững như Thái Sơn. Tình cảm không chỉ vững chắc mà còn tương trợ lẫn nhau cùng thành công, vật chất lẫn tinh thần đều mỹ mãn. Cực lợi cho kết hôn.','
    category: "吉",
    scoreRange: [75, 87]
  },
  51: {
    name: "震为雷",
    nameEn: "The Arousing (Thunder)",
    nameEs: "Lo Conmocionante / El Trueno",
    nameFr: "L'Éveilleur / Le Tonnerre",
    nameTh: 'เจิ้น (สายฟ้ากึกก้อง)',
    nameVi: '震 Vi Lôi',
    symbol: "☳☳",
    nature: "震动",
    natureEn: "Quaking & Shaking",
    natureEs: "Sacudida / Conmoción",
    natureFr: "Secousse / Ébranlement",
    judgment: "亨恐致福",
    judgmentEn: "Success — fear brings blessing.",
    relationshipMeaning: '平。惊天动地，突生波澜。感情中常有突发性的争吵、震惊事件或外界冲击。虽令人惊恐，但只要保持镇定，反能震醒迷局，带来转机。',
    relationshipMeaningEn: 'Neutral. Sudden shocks and unexpected waves. Intense arguments or external shocks may alarm you, but staying calm can awaken the relationship and bring a turning point.',
    relationshipMeaningTh: 'ปานกลาง มีเรื่องตื่นเต้นหรือปากเสียงเข้ามาอย่างกะทันหันดั่งเสียงฟ้าผ่า แต่ต้องอย่าตื่นตระหนก หากมีสติจะสามารถผ่านพ้นและเข้าใจกันมากขึ้น',
    relationshipMeaningVi: 'Bình. Kinh thiên động địa, đột ngột nổi sóng. Tình cảm thường có tranh cãi bột phát, sự cố gây sốc hoặc xung kích từ bên ngoài. Chỉ cần bình tĩnh, ngược lại sẽ tỉnh ngộ và mang lại chuyển biến.','
    category: "中",
    scoreRange: [60, 74]
  },
  52: {
    name: "艮为山",
    nameEn: "Keeping Still (Mountain)",
    nameEs: "El Aquietamiento / La Montaña",
    nameFr: "L'Immobilisation / La Montagne",
    nameTh: 'เกิ้น (ขุนเขาที่นิ่งสงบ)',
    nameVi: 'Cấn Vi Sơn',
    symbol: "☶☶",
    nature: "停止",
    natureEn: "Cessation",
    natureEs: "Detención / Inmovilidad",
    natureFr: "Arrêt / Immobilité",
    judgment: "艮其背不获其身",
    judgmentEn: "Keeping his back still, he does not obtain his body.",
    relationshipMeaning: '平。动辄得咎，时止则止。感情进入停滞不前的冷淡期，彼此存在隔阂，沟通困难。此时不宜强求推进，静止思考、各留空间才是上策。',
    relationshipMeaningEn: 'Neutral. Stagnation and emotional distance. Communication is difficult; do not force progress. Internal reflection and giving each other space is the best strategy.',
    relationshipMeaningTh: 'ปานกลาง ความสัมพันธ์ชั่วคราวนิ่งสนิทและเหินห่างเหมือนมีภูเขากั้น ไม่ควรกดดันหรือฝืนเดินหน้า ควรให้เวลาและพื้นที่ส่วนตัวแก่กันและกัน',
    relationshipMeaningVi: 'Bình. Động thì dễ lỗi, nên dừng thì dừng. Tình cảm bước vào giai đoạn trì trệ lạnh nhạt, đôi bên có rào cản, giao tiếp khó khăn. Lúc này không nên khiên cưỡng, giữ không gian riêng mới là thượng sách.','
    category: "中",
    scoreRange: [63, 77]
  },
  53: {
    name: "风山渐",
    nameEn: "Gradual Progress",
    nameEs: "El Progreso Gradual",
    nameFr: "Le Progrès Graduel",
    nameTh: 'เจี้ยน (การพัฒนาอย่างค่อยเป็นค่อยไป)',
    nameVi: 'Phong Sơn Tiệm',
    symbol: "☴☶",
    nature: "渐进",
    natureEn: "Gradual Advance",
    natureEs: "Graduación / Avance paulatino",
    natureFr: "Gradation / Progression lente",
    judgment: "女归吉利贞",
    judgmentEn: "The maiden returns — auspicious, advantageous to persevere.",
    relationshipMeaning: '大吉。循序渐进，细水长流。如同鸿雁飞翔有序，感情发展完全符合传统礼节，步步扎实。是一段能白头偕老、顺理成章的良缘。',
    relationshipMeaningEn: 'Highly auspicious. Gradual and steady progress. The relationship develops naturally and orderly, following traditions perfectly. Leads to a solid, lifelong marriage.',
    relationshipMeaningTh: 'เป็นมงคลยิ่ง ความรักก้าวหน้าอย่างเป็นขั้นเป็นตอนและมั่นคง ไม่หวือหวาแต่ยั่งยืนตามประเพณีอันดีงาม เป็นคู่แท้ที่จะได้แต่งงานและอยู่ด้วยกันจนแก่เฒ่า',
    relationshipMeaningVi: 'Đại cát. Tuần tự nhi tiến, bền vững lâu dài. Tình cảm phát triển hoàn toàn phù hợp với lễ tiết, từng bước vững chắc. Là lương duyên thuận lý thành chương, bạc đầu giai lão.','
    category: "吉",
    scoreRange: [72, 84]
  },
  54: {
    name: "雷泽归妹",
    nameEn: "The Marrying Maiden",
    nameEs: "La Doncella que se Casa",
    nameFr: "La Jeune Fille qui se Marie",
    nameTh: 'กุยเม่ย (หญิงสาวออกเรือน/ความสัมพันธ์ที่ผิดขั้นตอน)',
    nameVi: 'Lôi Trạch Quy Muội',
    symbol: "☳☱",
    nature: "归随",
    natureEn: "Returning & Following",
    natureEs: "Alianza / Séquito",
    natureFr: "Alliance / Soumission",
    judgment: "征凶无攸利",
    judgmentEn: "Advancing — misfortune, nothing advantageous.",
    relationshipMeaning: "需要审视关系的根基是否牢固，不宜冒进",
    relationshipMeaningEn: "A time of meaningful connection: like a shared journey — rich experiences but needs direction.",
    relationshipMeaningTh: 'ไม่ดี ความสัมพันธ์ผิดที่ผิดทางหรือรีบร้อนเกินไป มักเกิดจากความหลงใหลชั่ววูบหรือมีเรื่องความสัมพันธ์ที่ซับซ้อน (มือที่สาม) ขาดรากฐานที่มั่นคงในระยะยาว',
    relationshipMeaningVi: 'Hung. Vị trí không chính, dễ theo cảm tính. Tình cảm nhiều phần mù quáng hoặc mang sắc thái không chính thức (như người thứ ba, cưới chạy bầu). Thiếu nền tảng lâu dài, phòng đầu cát đuôi hung.',
    category: "待变",
    scoreRange: [52, 66]
  },
  55: {
    name: "雷丰",
    nameEn: "Abundance",
    nameEs: "La Abundancia / La Plenitud",
    nameFr: "L'Abondance / La Plénitude",
    nameTh: 'เฟิง (ความอุดมสมบูรณ์ถึงขีดสุด)',
    nameVi: 'Lôi Hỏa Phong',
    symbol: "☳☲",
    nature: "丰盛",
    natureEn: "Full Abundance",
    natureEs: "Abundancia / Grandeza",
    natureFr: "Abondance / Grandeur",
    judgment: "亨王勿忧宜日中",
    judgmentEn: "Success — the king need not worry, it is fitting at noon.",
    relationshipMeaning: "关系如日中天，但要保持清醒不要得意忘形",
    relationshipMeaningEn: "A time of meaningful connection: like a shared journey — rich experiences but needs direction.",
    relationshipMeaningTh: 'โชคดี ความรักเบ่งบานและหวานชื่นถึงขีดสุดเป็นที่อิจฉาของใครๆ แต่ต้องระวังว่าเมื่อขึ้นถึงจุดสูงสุดแล้วอาจถดถอย ควรประคองความรู้สึกให้สม่ำเสมอ',
    relationshipMeaningVi: 'Cát. Thịnh đại phong mãn, quang huy xán lạn. Tình cảm đang ở giai đoạn nồng nhiệt đỉnh cao, khiến người ngưỡng mộ. Nhưng vật cực tất phản, cần phòng thịnh cực sinh suy.',
    category: "吉",
    scoreRange: [78, 90]
  },
  56: {
    name: "火山旅",
    nameEn: "The Wanderer",
    nameEs: "El Andariego / El Viajero",
    nameFr: "Le Voyageur",
    nameTh: 'ลวี่ (ผู้เดินทางที่อ้างว้าง)',
    nameVi: 'Hỏa Sơn Lữ',
    symbol: "☶☲",
    nature: "旅行",
    natureEn: "Wandering",
    natureEs: "Viaje / Erranza",
    natureFr: "Voyage / Errance",
    judgment: "小亨旅贞吉",
    judgmentEn: "Small success — the traveler, perseverance, auspicious.",
    relationshipMeaning: "像一段共同的旅程，体验丰富但需要方向感",
    relationshipMeaningEn: "A time of meaningful connection: Like a shared journey—rich experiences but needs direction.",
    relationshipMeaningTh: 'ไม่ดี ความสัมพันธ์ไม่แน่นอนและผันผวน มักเป็นความรักระยะไกลหรือเป็นเพียงทางผ่านสั้นๆ ยากที่จะปักหลักสร้างอนาคต ร่วมกัน รู้สึกอ้างว้าง',
    relationshipMeaningVi: 'Hung. Phiêu bạt bất định, kiếp sống tha hương. Tình cảm thiếu đi tính ổn định, dễ là yêu xa, bôn ba thường xuyên hoặc duyên phận ngắn ngủi. Khó mà cắm rễ sâu bền.',
    category: "中",
    scoreRange: [64, 78]
  },
  57: {
    name: "巽为风",
    nameEn: "The Gentle (Wind)",
    nameEs: "Lo Suave / El Viento",
    nameFr: "Le Doux / Le Vent",
    nameTh: 'ซวี่น (สายลมที่อ่อนโยนแต่แทรกซึม)',
    nameVi: 'Tốn Vi Phong',
    symbol: "☴☴",
    nature: "顺入",
    natureEn: "Gentle Penetration",
    natureEs: "Penetración / Flexibilidad",
    natureFr: "Pénétration / Souplesse",
    judgment: "小亨利有攸往",
    judgmentEn: "Small success, advantageous to have somewhere to go.",
    relationshipMeaning: "灵活适应的关系，随风而动顺势而为",
    relationshipMeaningEn: "A time of meaningful connection: gentle influence, go with the flow together.",
    relationshipMeaningTh: 'ปานกลาง เป็นความรักที่ซึมลึกและอ่อนโยนดั่งสายลม แต่ต้องระวังความโลเล ไม่มีจุดยืน หรือยอมให้คนรอบข้างเป่าหูจนความสัมพันธ์สั่นคลอน',
    relationshipMeaningVi: 'Bình. Thuận phong tiềm nhập, nhu thuận thẩm thấu. Tình cảm thiếu đi đam mê kinh thiên động địa mà là sự ảnh hưởng ngầm. Cần phòng thiếu chính kiến, do dự khiến quan hệ lung lay.',
    category: "中",
    scoreRange: [66, 80]
  },
  58: {
    name: "兑为泽",
    nameEn: "The Joyous (Lake)",
    nameEs: "Lo Sereno / El Lago",
    nameFr: "Le Joyeux / Le Lac",
    nameTh: 'ตุ้ย (ทะเลสาบแห่งความเบิกบาน)',
    nameVi: 'Đoài Vi Trạch',
    symbol: "☱☱",
    nature: "喜悦",
    natureEn: "Joyful Communication",
    natureEs: "Alegría / Regocijo",
    natureFr: "Joie / Plaisir",
    judgment: "亨利贞",
    judgmentEn: "Success, advantageous, perseverance.",
    relationshipMeaning: "愉悦快乐的关系，沟通顺畅笑声多",
    relationshipMeaningEn: "A time of meaningful connection: joyful communication, laughter flows naturally.",
    relationshipMeaningTh: 'โชคดี เต็มไปด้วยความสุข เสียงหัวเราะ และความเข้ากันได้ดี มีเรื่องคุยกันไม่รู้จบ แต่ต้องระวังการพูดเอาใจเพื่อผลประโยชน์สั้นๆ โดยไม่มีสัญญาที่แท้จริง',
    relationshipMeaningVi: 'Cát. Hòa lạc dung dung, ngập tràn tiếng cười. Đôi bên chung sống vui vẻ, tương tác ngọt ngào và nói không hết chuyện. Lợi cho hẹn hò, nhưng phòng lưu tại đầu môi chót lưỡi.',
    category: "吉",
    scoreRange: [80, 92]
  },
  59: {
    name: "风水涣",
    nameEn: "Dispersion",
    nameEs: "La Disolución / La Dispersión",
    nameFr: "La Dissipation / La Dispersion",
    nameTh: 'ฮว่าน (การกระจัดกระจาย/การคลี่คลาย)',
    nameVi: 'Phong Thủy Hoán',
    symbol: "☴☵",
    nature: "涣散",
    natureEn: "Dissolving Boundaries",
    natureEs: "Dispersión",
    natureFr: "Dispersion",
    judgment: "王假有庙利涉大川",
    judgmentEn: "The king arrives at the temple — advantageous to cross the great river.",
    relationshipMeaning: "有些疏离感，需要重新凝聚情感",
    relationshipMeaningEn: "A time of meaningful connection: dispersing boundaries, finding new closeness.",
    relationshipMeaningTh: 'ปานกลาง ความรู้สึกเริ่มห่างเหินหรือเกิดความไม่เข้าใจกัน แต่อีกนัยหนึ่งหากรีบเปิดใจสะสาง จะสามารถสลายความขัดแย้งในอดีตและกลับมารักกันได้',
    relationshipMeaningVi: 'Bình. Gió thổi nước tan, lòng người ly tán. Tình cảm xuất hiện sơ ly, lạnh nhạt hoặc khủng hoảng lòng tin. Nếu chủ động phá vỡ bế tắc, hóa giải băng giá sẽ đón nhận tái sinh.',
    category: "中",
    scoreRange: [57, 71]
  },
  60: {
    name: "水泽节",
    nameEn: "Limitation",
    nameEs: "La Restricción / La Medida",
    nameFr: "La Limitation / La Mesure",
    nameTh: 'เจี๋ย (การจำกัด/การมีขอบเขต)',
    nameVi: 'Thủy Trạch Tiết',
    symbol: "☵☱",
    nature: "节制",
    natureEn: "Measured Limitation",
    natureEs: "Moderación / Control",
    natureFr: "Modération / Retenue",
    judgment: "亨苦节不可贞",
    judgmentEn: "Success — bitter restraint, not advantageous to persevere.",
    relationshipMeaning: "适度的克制和边界感对关系有益",
    relationshipMeaningEn: "A time of meaningful connection: healthy boundaries make love stronger.",
    relationshipMeaningTh: 'ปานกลาง ความสัมพันธ์ต้องอยู่บนพื้นฐานของความพอดี มีขอบเขตและระเบียบวินัย (เช่น การคุมงบแต่งงาน) แต่ต้องอย่าตึงเกินไปจนอีกฝ่ายอึดอัด',
    relationshipMeaningVi: 'Bình. Tiết chế có độ, tương an vô sự. Chung sống cần tuân thủ quy củ, kiềm chế ham muốn hoặc chú ý ngân sách thực tế. Khắc khổ quá sẽ gây ngột ngạt, nên linh hoạt.',
    category: "中",
    scoreRange: [65, 79]
  },
  61: {
    name: "风泽中孚",
    nameEn: "Inner Truth",
    nameEs: "Verdad Interior",
    nameFr: "La Vérité Intérieure",
    nameTh: 'จงฟู (ความจริงใจอันบริสุทธิ์)',
    nameVi: 'Phong Trạch Trung Phu',
    symbol: "☴☱",
    nature: "诚信",
    natureEn: "Sincere Faithfulness",
    natureEs: "Sinceridad / Buena fe",
    natureFr: "Sincérité / Bonne foi",
    judgment: "豚鱼吉利涉大川",
    judgmentEn: "Pig and fish — auspicious, advantageous to cross the great river.",
    relationshipMeaning: "信任是这段关系的基石，真诚相待无往不利",
    relationshipMeaningEn: "A time of meaningful connection: Trust is the cornerstone of this relationship. Sincere treatment brings success.",
    relationshipMeaningTh: 'เป็นมงคลยิ่ง มีความซื่อสัตย์และเชื่อใจกันอย่างแท้จริง เป็นเนื้อคู่ทางจิตวิญญาณ (Soulmate) ที่เปิดใจคุยกันได้ทุกเรื่อง รักสมหวังและมีความสุขอย่างที่สุด',
    relationshipMeaningVi: 'Đại cát. Thành tín từ tâm, tâm có linh tê. Đôi bên thành thật đối đãi, không chút nghi kỵ, đạt đến chiều sâu hòa hợp tinh thần (linh hồn bạn lữ). Dùng chân tâm này tương thủ sẽ viên mãn.',
    category: "吉",
    scoreRange: [81, 93]
  },
  62: {
    name: "雷山小过",
    nameEn: "Small Excess",
    nameEs: "Pequeño Exceso",
    nameFr: "Le Petit Excès",
    nameTh: 'เสี่ยวชั่ว (ความผิดพลาดเล็กน้อย/ควร谦น้อม)',
    nameVi: 'Lôi Sơn Tiểu Quá',
    symbol: "☳☶",
    nature: "小过",
    natureEn: "Minor Exceeding",
    natureEs: "Pequeño Exceso",
    natureFr: "Petit Excès",
    judgment: "亨利贞可小事不可大事",
    judgmentEn: "Success, advantageous, perseverance — can do small things, cannot do great things.",
    relationshipMeaning: "小事上默契十足，大事上还需更多磨合",
    relationshipMeaningEn: "A time of meaningful connection: small excesses are okay, don't sweat the small stuff.",
    relationshipMeaningTh: 'ปานกลาง มีเรื่องผิดใจกันด้วยเรื่องเล็กๆ น้อยๆ บ่อยครั้ง ไม่ควรเอาชนะหรือคาดหวังสูงเกินไป การยอมอ่อนข้อและใส่ใจเรื่องเล็กๆ ในบ้านจะประคองรักได้',
    relationshipMeaningVi: 'Bình. Có lỗi nhỏ, nên dưới không nên trên. Tình cảm thường ma sát vì chuyện lông gà vỏ tỏi, lúc này kỵ nhất tranh cường hiếu thắng, giữ khiêm tốn, chăm chút việc nhỏ sẽ bình an.',
    category: "中",
    scoreRange: [62, 76]
  },
  63: {
    name: "水火既济",
    nameEn: "After Completion",
    nameEs: "Después de la Realización",
    nameFr: "Après l'Accomplissement",
    nameTh: 'จี้จี้ (ความสำเร็จเสร็จสิ้น)',
    nameVi: 'Thủy Hỏa Ký Tế',
    symbol: "☵☲",
    nature: "既济",
    natureEn: "Already Fulfilled",
    natureEs: "Realización / Logro total",
    natureFr: "Accomplissement / Harmonie",
    judgment: "亨小利贞",
    judgmentEn: "Success, small, advantageous to persevere.",
    relationshipMeaning: "水火既济，阴阳调和，万事俱备的圆满状态",
    relationshipMeaningEn: "A time of meaningful connection: water and fire in balance — a fulfilled and complete bond.",
    relationshipMeaningTh: 'โชคดี สมหวังทุกประการ ความรักบรรลุเป้าหมายที่ตั้งไว้ (เช่น ได้แต่งงาน) แต่ต้องระวังความเฉื่อยชาหลังจากความสำเร็จ ควรเติมความใส่ใจให้กันเสมอ',
    relationshipMeaningVi: 'Cát. Công đức viên mãn, thủy hỏa tương tế. Tình cảm đạt được mục tiêu lý tưởng (như thuận lợi kết hôn). Nhưng phòng 'đầu cát đuôi loạn', sau thành công dễ sinh lười biếng.',
    category: "大吉",
    scoreRange: [87, 98]
  },
  64: {
    name: "火水未济",
    nameEn: "Before Completion",
    nameEs: "Antes de la Realización",
    nameFr: "Avant l'Accomplissement",
    nameTh: 'เวยจี้ (ก่อนความสำเร็จ/อนาคตภาคย์)',
    nameVi: 'Hỏa Thủy Vị Tế',
    symbol: "☲☵",
    nature: "未济",
    natureEn: "Not Yet Fulfilled",
    natureEs: "Inconcluso / Potencial",
    natureFr: "Inaccompli / Potentiel",
    judgment: "亨小狐汔济濡其尾",
    judgmentEn: "Success — the little fox has almost crossed, wets its tail.",
    relationshipMeaning: "旅程尚未结束，未完成意味着还有无限可能",
    relationshipMeaningEn: "A time of meaningful connection: not yet fulfilled — the story is still being written, and that's exciting.",
    relationshipMeaningTh: 'ปานกลาง อยู่ในช่วงพยายามก่อนถึงเป้าหมาย แม้ตอนนี้จะยังไม่สมบูรณ์แบบที่สุด (เช่น อยู่ในช่วงดูใจ) แต่มีอนาคตที่สดใสอยู่หากไม่ละความพยายาม',
    relationshipMeaningVi: 'Bình. Bóng tối trước bình minh, tương lai tràn ngập khả năng vô hạn. Tuy hiện tại chưa đạt trạng thái hoàn mỹ (đang theo đuổi/yêu xa), chỉ cần kiên trì sẽ lội nước thành công.',
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

export function calcIChing(p1: BirthInfo, p2: BirthInfo, lang: AlgLang = 'zh'): EngineResult {
  const { hexNum, hex, changingLine, transformedHex } = deriveHexagram(p1, p2);

  // 多语言字段读取
  const tName = getHexField(hex, 'name', lang);
  const tNature = getHexField(hex, 'nature', lang);
  const tJudgment = getHexField(hex, 'judgment', lang);
  const tRelation = getHexField(hex, 'relationshipMeaning', lang);

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
    const tNameTr = getHexField(transformedHex, 'name', lang);
    const tRelTr = getHexField(transformedHex, 'relationshipMeaning', lang);
    const isZhTr = lang === 'zh';
    if (tCategory === '大吉' || tCategory === '吉') {
      score += 3;
      transformDesc = isZhTr
        ? `\n【变卦】第${changingLine}爻动 → ${tNameTr}（${transformedHex.symbol}）\n${tRelTr}\n变卦趋势向好，未来发展有转机。`
        : lang === 'en'
        ? `\n[Changing Hex] Line ${changingLine} changes → ${tNameTr} (${transformedHex.symbol})\n${tRelTr}\nChanging hexagram trend is positive; future development has a turning point.`
        : lang === 'es'
        ? `\n[Hex Cambiante] La línea ${changingLine} cambia → ${tNameTr} (${transformedHex.symbol})\n${tRelTr}\nLa tendencia del hexagrama cambiante es positiva; el desarrollo futuro tiene un punto de inflexión.`
        : `\n[Hex Changeant] La ligne ${changingLine} change → ${tNameTr} (${transformedHex.symbol})\n${tRelTr}\nLa tendance de l'hexagramme changeant est positive; le développement futur a un point de bascule.`;
    } else if (tCategory === '小凶' || tCategory === '待变') {
      score -= 2;
      transformDesc = isZhTr
        ? `\n【变卦】第${changingLine}爻动 → ${tNameTr}（${transformedHex.symbol}）\n${tRelTr}\n需注意变化趋势，提前准备。`
        : lang === 'en'
        ? `\n[Changing Hex] Line ${changingLine} changes → ${tNameTr} (${transformedHex.symbol})\n${tRelTr}\nNote the changing trend and prepare in advance.`
        : lang === 'es'
        ? `\n[Hex Cambiante] La línea ${changingLine} cambia → ${tNameTr} (${transformedHex.symbol})\n${tRelTr}\nNote la tendencia cambiante y prepárese con anticipación.`
        : `\n[Hex Changeant] La ligne ${changingLine} change → ${tNameTr} (${transformedHex.symbol})\n${tRelTr}\nNotez la tendance changeante et préparez-vous à l'avance.`;
    } else {
      transformDesc = isZhTr
        ? `\n【变卦】第${changingLine}爻动 → ${tNameTr}（${transformedHex.symbol}）\n${tRelTr}`
        : lang === 'en'
        ? `\n[Changing Hex] Line ${changingLine} changes → ${tNameTr} (${transformedHex.symbol})\n${tRelTr}`
        : lang === 'es'
        ? `\n[Hex Cambiante] La línea ${changingLine} cambia → ${tNameTr} (${transformedHex.symbol})\n${tRelTr}`
        : `\n[Hex Changeant] La ligne ${changingLine} change → ${tNameTr} (${transformedHex.symbol})\n${tRelTr}`;
    }
  }

  score = Math.max(35, Math.min(99, score));

  // ── 解读文案 ──
  const categoryEmoji: Record<string, string> = {
    '大吉': '✦', '吉': '◆', '中': '◇', '小凶': '◗', '待变': '◈',
  };

  // 多语言 summary
  let summary: string;
  const isZh = lang === 'zh';
  if (score >= 82) {
    summary = isZh
      ? `占得「${tName}」，${categoryEmoji[hex.category]}${tJudgment}，此乃上上之卦。`
      : lang === 'en'
      ? `Hexagram ${hexNum}: ${tName}. ${tJudgment} — an extremely auspicious sign.`
      : lang === 'es'
      ? `Hexagrama ${hexNum}: ${tName}. ${tJudgment} — un signo extremadamente auspicioso.`
      : `Hexagramme ${hexNum} : ${tName}. ${tJudgment} — un signe extrêmement auspice.`;
  } else if (score >= 68) {
    summary = isZh
      ? `占得「${tName}」，${tNature}之卦，缘分稳中有升。`
      : lang === 'en'
      ? `Hexagram ${hexNum}: ${tName} (${tNature}). Your connection has steady, growing potential.`
      : lang === 'es'
      ? `Hexagrama ${hexNum}: ${tName} (${tNature}). Su conexión tiene un potencial de crecimiento constante.`
      : `Hexagramme ${hexNum} : ${tName} (${tNature}). Votre connexion a un potentiel de croissance constante.`;
  } else if (score >= 55) {
    summary = isZh
      ? `占得「${tName}」，卦象显示需用心经营，方能长久。`
      : lang === 'en'
      ? `Hexagram ${hexNum}: ${tName}. Care and intention are needed to sustain this bond.`
      : lang === 'es'
      ? `Hexagrama ${hexNum}: ${tName}. Se necesita cuidado e intención para mantener este vínculo.`
      : `Hexagramme ${hexNum} : ${tName}. Des soins et une intención sont nécessaires pour maintenir ce lien.`;
  } else {
    summary = isZh
      ? `占得「${tName}」，虽遇挑战，但否极泰来，转机在后。`
      : lang === 'en'
      ? `Hexagram ${hexNum}: ${tName}. Challenges arise, but turning points follow.`
      : lang === 'es'
      ? `Hexagrama ${hexNum}: ${tName}. Surgen desafíos, pero siguen puntos de inflexión.`
      : `Hexagramme ${hexNum} : ${tName}. Des défis surgissent, mais des points d'inflexion suivent.`;
  }

  // 多语言 detail
  const tCategory = isZh ? hex.category : lang === 'en' ? HEX_CATEGORY_EN[hex.category] || hex.category : lang === 'es' ? HEX_CATEGORY_ES[hex.category] || hex.category : HEX_CATEGORY_FR[hex.category] || hex.category;
  const tTransform = transformDesc; // transformDesc 也需要多语言化，先保留
  const detail = [
    (isZh ? `【本卦】第${hexNum}卦 — ${tName} ${hex.symbol}` : lang === 'en' ? `【Primary Hexagram】#${hexNum} — ${tName} ${hex.symbol}` : lang === 'es' ? `【Hexagrama Principal】#${hexNum} — ${tName} ${hex.symbol}` : `【Hexagramme Principal】#${hexNum} — ${tName} ${hex.symbol}`),
    (isZh ? `卦德：${tNature} | 卦辞：${tJudgment}` : lang === 'en' ? `Nature: ${tNature} | Judgment: ${tJudgment}` : lang === 'es' ? `Naturaleza: ${tNature} | Juicio: ${tJudgment}` : `Nature: ${tNature} | Jugement: ${tJudgment}`),
    (isZh ? `等级：${categoryEmoji[hex.category] || ''}${hex.category}` : lang === 'en' ? `Grade: ${categoryEmoji[hex.category] || ''}${tCategory}` : lang === 'es' ? `Grado: ${categoryEmoji[hex.category] || ''}${tCategory}` : `Grade: ${categoryEmoji[hex.category] || ''}${tCategory}`),
    ``,
    (isZh ? `【姻缘解读】` : lang === 'en' ? `【Relationship Reading】` : lang === 'es' ? `【Lectura de Relación】` : `【Lecture de Relation】`),
    tRelation,
    ``,
    (isZh ? `【爻位分析】` : lang === 'en' ? `【Line Analysis】` : lang === 'es' ? `【Análisis de Líneas】` : `【Analyse des Lignes】`),
    changingLine ? (isZh ? `第${changingLine}爻为动爻，显示关系中存在变化的契机` : lang === 'en' ? `Line ${changingLine} is changing — indicates a turning point in the relationship` : lang === 'es' ? `La línea ${changingLine} está cambiando — indica un punto de inflexión en la relación` : `La ligne ${changingLine} est en changement — indique un point de inflexión dans la relation`) : (isZh ? '六爻安静，关系当前处于稳定状态' : lang === 'en' ? 'All lines are stable — the relationship is currently in a steady state' : lang === 'es' ? 'Todas las líneas están estables — la relación está actualmente en un estado estable' : 'Toutes les lignes sont stables — la relation est actuellement dans un état stable'),
    tTransform,
    ``,
    score >= 80 ? (isZh ? '卦象大吉，顺应天道' : lang === 'en' ? 'Auspicious hexagram, follow the Tao' : lang === 'es' ? 'Hexagrama auspicioso, sigue el Tao' : 'Hexagramme auspice, suivez le Tao')
      : score >= 65 ? (isZh ? '中上之卦，事在人为' : lang === 'en' ? 'Above-average hexagram, human effort matters' : lang === 'es' ? 'Hexagrama superior al promedio, el esfuerzo humano importa' : 'Hexagramme au-dessus de la moyenne, l\'effort humain compte')
      : (isZh ? '卦象待变，修心即改命' : lang === 'en' ? 'Hexagram in transition — cultivate the heart to change destiny' : lang === 'es' ? 'Hexagrama en transición — cultiva el corazón para cambiar el destino' : 'Hexagramme en transition — cultivez le cœur pour changer la destinée'),
    ``,
  ].join('\n');

  return {
    score,
    title: '易经智慧',
    summary,
    detail,
  };
}
