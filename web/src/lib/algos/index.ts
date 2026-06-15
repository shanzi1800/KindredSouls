import type { BirthInfo, CompatibilityResult, EngineResult } from './types';
import { calcBaZi } from './bazi';
import { calcZodiac } from './zodiac';
import { calcIChing } from './iching';
import { normalizeLang, t as at } from './i18n';
import type { AlgLang } from './i18n';

// ═════════════════════════════════════════
// 综合合盘引擎
// 三引擎加权 + 四维度评分 + AI情感建议
// 权重：八字40% + 星座40% + 易经20%
// ═════════════════════════════════════════

/** 日期解析 */
export function parseBirthday(input: string): BirthInfo | null {
  // YYYY-MM-DD
  let m = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };

  // DD/MM/YYYY
  m = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return { year: +m[3], month: +m[2], day: +m[1] };

  // YYYY/MM/DD
  m = input.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) return { year: +m[1], month: +m[2], day: +m[3] };

  return null;
}

// ── 四维度评分 ──

interface DimensionScore {
  love: number;       // 爱情（吸引力/激情）
  communication: number; // 沟通（理解/表达）
  chemistry: number;  // 性吸引力（身体/感官）
  stability: number;  // 长期稳定（价值观/承诺）
}

/**
 * 从三引擎结果推导四维度分数
 * 八字→稳定性+沟通，星座→爱情+性吸引力，易经→整体趋势
 */
function deriveDimensions(
  bazi: EngineResult,
  zodiac: EngineResult,
  iching: EngineResult
): DimensionScore {
  const base = (bazi.score + zodiac.score + iching.score) / 3;

  // 爱情维度：星座权重高（60%）+ 易经趋势（25%）+ 八字基础（15%）
  const love = Math.round(zodiac.score * 0.40 + bazi.score * 0.25 + iching.score * 0.15 + base * 0.20);

  // 沟通维度：八字日主关系（50%）+ 星座元素和谐（30%）+ 基础（20%）
  const communication = Math.round(bazi.score * 0.45 + zodiac.score * 0.30 + iching.score * 0.10 + base * 0.15);

  // 性吸引力：星座相位（55%）+ 八字合力（25%）+ 基础（20%）
  const chemistry = Math.round(zodiac.score * 0.45 + bazi.score * 0.30 + iching.score * 0.10 + base * 0.15);

  // 长期稳定：八字核心（55%）+ 易经卦象稳定性（25%）+ 星座模式（20%）
  const stability = Math.round(bazi.score * 0.50 + iching.score * 0.30 + zodiac.score * 0.15 + base * 0.05);

  return {
    love: Math.max(30, Math.min(99, love)),
    communication: Math.max(30, Math.min(99, communication)),
    chemistry: Math.max(30, Math.min(99, chemistry)),
    stability: Math.max(30, Math.min(99, stability)),
  };
}

// ── AI 情感建议生成 ──

function generateAIInsight(
  overall: number,
  dims: DimensionScore,
  bazi: EngineResult,
  zodiac: EngineResult,
  iching: EngineResult,
  lang: AlgLang
): string {
  const parts: string[] = [];
  const isZh = lang === 'zh';

  // 开场总评
  if (overall >= 82) {
    parts.push(
      isZh
        ? '从命理学的角度看，你们之间的能量连接非常强。这不是偶然的相遇，而是某种更深层的引力将你们带到了一起。'
        : lang === 'en'
        ? 'From an astrological perspective, the energy connection between you is remarkably strong. This is no accident — a deeper gravitational pull brought you together.'
        : lang === 'es'
        ? 'Desde la perspectiva astrológica, la conexión energética entre ustedes es notablemente fuerte. No es una coincidencia — una atracción gravitacional más profunda los unió.'
        : 'D\'un point de vue astrologique, la connexion énergétique entre vous est remarquablement forte. Ce n\'est pas un hasard — une attraction gravitationnelle plus profonde vous a réunis.'
    );
  } else if (overall >= 70) {
    parts.push(
      isZh
        ? '你们的命盘组合显示出良好的契合度。每段关系都是独一无二的，而你们的配置有着独特的优势。'
        : lang === 'en'
        ? 'Your combined charts show strong compatibility. Every relationship is unique, and yours has distinctive strengths.'
        : lang === 'es'
        ? 'Sus cartas combinadas muestran una fuerte compatibilidad. Cada relación es única, y la suya tiene fortalezas distintivas.'
        : 'Vos cartes combinées montrent une forte compatibilité. Chaque relation est unique, et la vôtre a des forces distinctives.'
    );
  } else if (overall >= 58) {
    parts.push(
      isZh
        ? '每一段值得的关系都需要经营，而你们的配置中藏着不少待发掘的宝藏。差异不是障碍，是成长的土壤。'
        : lang === 'en'
        ? 'Every worthwhile relationship requires nurturing, and yours holds hidden treasures waiting to be discovered. Differences are not obstacles — they are soil for growth.'
        : lang === 'es'
        ? 'Cada relación valiosa requiere cultivo, y la suya guarda tesoros escondidos esperando ser descubiertos. Las diferencias no son obstáculos — son suelo para el crecimiento.'
        : 'Chaque relation qui en vaut la peine demande des soins, et la vôtre cache des trésors inestimés en attente de découverte. Les différences ne sont pas des obstacles — elles sont le terreau de la croissance.'
    );
  } else {
    parts.push(
      isZh
        ? '缘分有时以挑战的形式出现。你们的配置显示这是一段能带来重要人生课题的关系。'
        : lang === 'en'
        ? 'Connections sometimes arrive in the form of challenges. Your configuration suggests a relationship that brings important life lessons.'
        : lang === 'es'
        ? 'Las conexiones a veces llegan en forma de desafíos. Su configuración sugiere una relación que trae lecciones de vida importantes.'
        : 'Les connexions arrivent parfois sous forme de défis. Votre configuration suggère une relation qui apporte des leçons de vie importantes.'
    );
  }

  // 维度名称（按语言）
  const dimNames: Record<string, Record<AlgLang, string>> = {
    love:         { zh: '情感吸引力', en: 'Love & Attraction', es: 'Amor y Atracción', fr: 'Amour et Attraction', th: 'ความดึงดูดทางอารมณ์', vi: 'Sức hút tình cảm' },
    communication: { zh: '沟通理解',   en: 'Communication',     es: 'Comunicación',       fr: 'Communication',       th: 'ความเข้าใจกัน',          vi: 'Thấu hiểu' },
    chemistry:     { zh: '身心默契',   en: 'Chemistry',        es: 'Química',            fr: 'Chimie',              th: 'เคมี',               vi: 'Sức hút' },
    stability:     { zh: '长期稳定',   en: 'Long-term Stability', es: 'Estabilidad a Largo Plazo', fr: 'Stabilité à Long Terme', th: 'รากฐานความรัก', vi: 'Nền tảng' },
  };

  // 维度分析（挑最强和最弱给建议）
  const dimEntries = Object.entries(dims) as [keyof DimensionScore, number][];
  dimEntries.sort((a, b) => b[1] - a[1]);
  const [strongest] = dimEntries;
  const [weakest] = dimEntries.slice(-1);

  if (strongest[1] >= 78) {
    parts.push(
      isZh
        ? `你们在【${dimNames[strongest[0]][lang]}】方面天然有优势——这是你们关系的亮点，好好珍惜。`
        : lang === 'en'
        ? `You have a natural advantage in [${dimNames[strongest[0]][lang]}] — this is a shining point of your relationship. Cherish it.`
        : lang === 'es'
        ? `Tienen una ventaja natural en [${dimNames[strongest[0]][lang]}] — este es un punto brillante de su relación. Valórenlo.`
        : `Vous avez un avantage naturel dans [${dimNames[strongest[0]][lang]}] — c\'est un point lumineux de votre relation. Chérissez-le.`
    );
  }
  if (weakest[1] <= 65 && weakest[0] !== strongest[0]) {
    parts.push(
      isZh
        ? `【${dimNames[weakest[0]][lang]}】是这段关系可以重点投入的方向。多一份耐心和觉察，这里会成为新的增长点。`
        : lang === 'en'
        ? `[${dimNames[weakest[0]][lang]}] is an area worth focusing on. More patience and awareness here will become a new growth point.`
        : lang === 'es'
        ? `[${dimNames[weakest[0]][lang]}] es un área que vale la pena enfocar. Más paciencia y conciencia aquí se convertirá en un nuevo punto de crecimiento.`
        : `[${dimNames[weakest[0]][lang]}] est une zone qui mérite d\'être ciblée. Plus de patience et de conscience ici deviendra un nouveau point de croissance.`
    );
  }

  // 引擎亮点
  if (bazi.score >= 80) {
    parts.push(
      isZh ? '八字层面显示你们的日主关系融洽，内在性格底色互相吸引。'
        : lang === 'en' ? 'BaZi analysis shows your Day Masters relate harmoniously — your core personalities naturally attract each other.'
        : lang === 'es' ? 'El análisis BaZi muestra que sus Maestros Día se relacionan armoniosamente — sus personalidades base se atraen naturalmente.'
        : 'L\'analyse BaZi montre que vos Maîtres Jour s\'accordent harmonieusement — vos personnalités de base s\'attirent naturellement.'
    );
  }
  if (zodiac.score >= 80) {
    parts.push(
      isZh ? '星座层面显示星辰的能量在为你们加持，这是难得的宇宙祝福。'
        : lang === 'en' ? 'Your zodiac placement shows cosmic energies blessing your union — a rare celestial gift.'
        : lang === 'es' ? 'Su colocación zodiacal muestra energías cósmicas bendiciendo su unión — un raro regalo celestial.'
        : 'Votre placement zodiacal montre des énergies cosmiques bénissant votre union — un rare cadeau céleste.'
    );
  }
  if (iching.score >= 80) {
    parts.push(
      isZh ? '易经卦象预示着正向的发展趋势，顺势而为会有惊喜。'
        : lang === 'en' ? 'The I Ching hexagram indicates a positive developmental trend — going with the flow will bring pleasant surprises.'
        : lang === 'es' ? 'El hexagrama del I Ching indica una tendencia de desarrollo positiva — dejarse llevar por el flujo traerá sorpresas agradables.'
        : 'L\'hexagramme du Yi Jing indique une tendance de développement positive — suivre le flux apportera des surprises agréables.'
    );
  }

  // 积极收尾（铁律！）
  if (overall >= 75) {
    parts.push(
      isZh ? '记住，命理只是参考，真正决定关系质量的是你们每一天的选择。你们拥有创造幸福的所有条件。'
        : lang === 'en' ? 'Remember: astrology is only a reference. What truly determines relationship quality is the choices you make every day. You have everything you need to create happiness.'
        : lang === 'es' ? 'Recuerden: la astrología es solo una referencia. Lo que verdaderamente determina la calidad de la relación son las elecciones que hacen cada día. Tienen todo lo que necesitan para crear felicidad.'
        : 'Rappelez-vous : l\'astrologie n\'est qu\'une référence. Ce qui détermine vraiment la qualité de la relation, ce sont les choix que vous faites chaque jour. Vous avez tout ce qu\'il faut pour créer le bonheur.'
    );
  } else {
    parts.push(
      isZh ? '命理揭示的是潜能而非定数。每一段美好的关系都是从"愿意尝试"开始的。你们拥有的比想象中更多。'
        : lang === 'en' ? 'Astrology reveals potential, not destiny. Every beautiful relationship starts with "willing to try". You have more than you imagine.'
        : lang === 'es' ? 'La astrología revela potencial, no destino. Cada relación hermosa comienza con "estar dispuesto a intentar". Tienen más de lo que imaginan.'
        : 'L\'astrologie révèle le potentiel, pas la destinée. Chaque belle relation commence par "être prêt à essayer". Vous avez plus que vous n\'imaginez.'
    );
  }

  return parts.join('\n\n');
}

// ── 有利/需注意方面 ──

function generateAspects(
  overall: number,
  dims: DimensionScore,
  bazi: EngineResult,
  zodiac: EngineResult,
  iching: EngineResult,
  lang: AlgLang
): { lucky: string[]; challenging: string[] } {
  const lucky: string[] = [];
  const challenging: string[] = [];

  // 基于整体分
  if (overall >= 80) lucky.push(at('deep_fate', lang));
  if (bazi.score >= 78) lucky.push(at('wuxing_potential', lang));
  if (zodiac.score >= 78) lucky.push(at('zodiac_harmony', lang));
  if (iching.score >= 78) lucky.push(at('iching_trend', lang));

  if (dims.love >= 80) lucky.push(at('attraction_strong', lang));
  if (dims.communication >= 80) lucky.push(at('comm_low_cost', lang));
  if (dims.stability >= 80) lucky.push(at('stability_good', lang));

  if (dims.communication <= 62) challenging.push(at('comm_patience', lang));
  if (dims.stability <= 62) challenging.push(at('stability_goal', lang));
  if (dims.chemistry <= 62) challenging.push(at('chemistry_cultivate', lang));
  if (bazi.score <= 58) challenging.push(at('bazi_polish', lang));
  if (zodiac.score <= 58) challenging.push(at('zodiac_misalign', lang));

  // 保证至少各有一条
  if (lucky.length === 0) lucky.push(at('growth_will', lang));
  if (challenging.length === 0) challenging.push(at('freshness', lang));

  return { lucky: lucky.slice(0, 4), challenging: challenging.slice(0, 3) };
}

// ── 主计算入口 ──

export function calculateCompatibility(
  date1: string,
  date2: string,
  lang?: string
): CompatibilityResult | { error: string } {
  const p1 = parseBirthday(date1);
  const p2 = parseBirthday(date2);
  const algLang = normalizeLang(lang || 'en');

  if (!p1 || !p2) {
    return { error: 'DATE_FORMAT_ERROR' };
  }

  // ── 三引擎计算 ──
  const baziResult = calcBaZi(p1, p2, algLang);
  const zodiacResult = calcZodiac(p1, p2, algLang);
  const ichingResult = calcIChing(p1, p2, algLang);

  // ── 加权总分（八字40% + 星座40% + 易经20%）──
  const overall = Math.round(
    baziResult.score * 0.40 +
    zodiacResult.score * 0.40 +
    ichingResult.score * 0.20
  );

  // ── 四维度评分 ──
  const dims = deriveDimensions(baziResult, zodiacResult, ichingResult);

  // ── AI 情感建议 ──
  const aiInsight = generateAIInsight(overall, dims, baziResult, zodiacResult, ichingResult, algLang);

  // ── 有利/需注意方面 ──
  const { lucky, challenging } = generateAspects(overall, dims, baziResult, zodiacResult, ichingResult, algLang);

  return {
    overall,
    engines: {
      bazi: baziResult,
      zodiac: zodiacResult,
      iching: ichingResult,
    },
    aiInsight,
    luckyAspects: lucky,
    challengingAspects: challenging,
    dimensions: dims,
  };
}
