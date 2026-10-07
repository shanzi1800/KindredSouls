// V120-fix19: rebuild-20260719170618
// V223d-GHA-FORCE-REBUILD-1785663888


// ═══════════════════════════════════════════════════════════════
// 🌟 V238：三刀流后处理安全阀（军师封仓补丁）
// 刀一：多语言防重截断（Deduplication Guard）
// 刀二：泰语 Tokenizer 词素字典校正（Consonant Repair）
// 刀三：月亮天蝎座幻觉强制抹平（Moon Scorpio Hard Override）
// ═══════════════════════════════════════════════════════════════

// 刀二：泰语高频掉辅音校正字典（持续扩充）
const THAI_CORRECTION_MAP = {
  'จริงัง': 'จริงจัง',
  'ปรับุง': 'ปรับปรุง',
  'ภาวะโล': 'ภาวะโลภ',
  'น่าดึงดูไร': 'น่าดึงดูดใจ',
  'ราบื่น': 'ราบรื่น',
  'ฝงไว้': 'ฝังไว้',
  'แก้ค้น': 'แก้ไข',
};

function fixMoonScorpioHallucination(text) {
  if (!text) return text;
  const lines = text.split('\n');
  const processedLines = lines.map((line) => {
    const hasMoon = /(จันทร์|ดวงจันทร์|พระจันทร์|Moon)/i.test(line);
    const hasScorpio = /(ราศีพิจิก|Scorpio)/i.test(line);
    if (hasMoon && hasScorpio) {
      const isLegal = /(\b9\b|\b10\b|\b11\b|๙|๑๐|๑๑)/.test(line) && /(ส\.ค\.|สิงหาคม|August|Aug)/i.test(line);
      if (!isLegal) {
        return line
          .replace(/ดวงจันทร์(เคลื่อน|ย้าย)?เข้าสู่ราศีพิจิก/g, 'ดวงจันทร์เคลื่อนผ่านกลุ่มดาวตามปรกติ')
          .replace(/พระจันทร์เข้าสู่ราศีพิจิก[^。\n]*/g, 'พระจันทร์เคลื่อนผ่านกลุ่มดาวตามปรกติ')
          .replace(/Moon (in|enters) Scorpio[^。\n]*/gi, 'Moon continues its standard transit');
      }
    }
    return line;
  });
  return processedLines.join('\n');
}

function sanitizeReportFinal(text, options = {}) {
  if (!text || typeof text !== 'string') return text;
  const { lang = 'zh', reportType = 'monthly' } = options;
  let result = text;
  // 刀一：多语言防重截断
  const HEADER_REGEX = /(本月命运主题|ธีมโชคชะตาประจำเดือน|Monthly Destiny Theme)/gi;
  const hm = [...result.matchAll(HEADER_REGEX)];
  if (hm.length > 1) {
    result = result.substring(0, hm[1].index).trim();
    console.warn(`[V238] 防重截断: 主题头×${hm.length}, 截断至第${hm[1].index}字`);
  }
  // 刀二：泰语掉辅音字典校正
  if (lang === 'th' || /[\u0E00-\u0E7F]/.test(result)) {
    for (const [wrong, correct] of Object.entries(THAI_CORRECTION_MAP)) {
      if (wrong !== correct) result = result.split(wrong).join(correct);
    }
  }
  // 刀三：月亮天蝎座幻觉清洗
  if (reportType === 'monthly') {
    result = fixMoonScorpioHallucination(result);
  }
  // 刀四(V239): 排版美化——压缩过量空行 + 消除孤立/连续 ✦ + 风险提示转 Markdown 引用
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.replace(/✦\s*✦+/g, '✦');
  result = result.replace(/【风险提示：?】/g, '\n> 🛡️ **风控指南**：');
  result = result.replace(/\s*✦\s*$/, '');
  return result;
}

// ═══ V239: 动态币种/宫位 Prompt 注入算子（仅 6 语:zh/en/fr/es/th/vi）═══
// 1. 动态币种与风控阈值——取代月报硬编码 ￥5000 / 5% 资产上限
function getCurrencyRiskProfile(lang) {
  const profiles = {
    zh: { currency: 'CNY', symbol: '￥', baseRisk: 5000,     maxWeekly: 15000 },
    en: { currency: 'USD', symbol: '$',  baseRisk: 800,      maxWeekly: 2500 },
    fr: { currency: 'EUR', symbol: '€',  baseRisk: 700,      maxWeekly: 2000 },
    es: { currency: 'EUR', symbol: '€',  baseRisk: 700,      maxWeekly: 2000 },
    th: { currency: 'THB', symbol: '฿',  baseRisk: 5000,     maxWeekly: 15000 },
    vi: { currency: 'VND', symbol: '₫',  baseRisk: 500000, maxWeekly: 36000000 },
  };
  return profiles[lang] || profiles.en;
}

// 2. 中英签名归一化 + 整宫制太阳宫位推导(1-12),无新数据依赖
const V239_ZH_ORDER = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
const V239_EN2ZH = { Aries:'白羊座', Taurus:'金牛座', Gemini:'双子座', Cancer:'巨蟹座', Leo:'狮子座', Virgo:'处女座', Libra:'天秤座', Scorpio:'天蝎座', Sagittarius:'射手座', Capricorn:'摩羯座', Aquarius:'水瓶座', Pisces:'双鱼座' };
function _v239ToZhSign(s) {
  if (!s) return null;
  if (V239_ZH_ORDER.includes(s)) return s;
  return V239_EN2ZH[s] || null;
}
function deriveSunHouse(risingSign, sunSign) {
  const rs = _v239ToZhSign(risingSign);
  const ss = _v239ToZhSign(sunSign);
  if (!rs || !ss) return 9; // 兜底:第9宫(远行/跨界)
  const ri = V239_ZH_ORDER.indexOf(rs);
  const si = V239_ZH_ORDER.indexOf(ss);
  return ((si - ri) % 12 + 12) % 12 + 1;
}

// 3. 动态 Prompt 注入指令(月报专用,覆盖通用 FORMAT_FIREWALL 周标题模板)
// V241-fix: buildWealthPromptContext 多语言化——原硬编码中文周标题导致法语等非中文报告夹带中文

// ═══════════════════════════════════════════════════════════════════════
// 🛠️ [V267] Slim Lang Packs — 单语种月报规则包（替代 35k 全量 INSTR）
// 按语种精准注入，Payload 从 35k Tokens 降至 ~8k Tokens，彻底解决 Gemini HTTP 400
// ═══════════════════════════════════════════════════════════════════════
const SLIM_LANG_PACKS = {
  fr: `
[LANG_RULE: French]
- 文风: 深邃诗意，灵性哲学（善用 l'archétype, nigredo alchimique, alchimie 等词）。
- 语法: 严格法语语法，介词/冠词完整（l', d', de, à），数字加空格（700 €）。
- CRITICAL MANDATORY HEADERS — Each section MUST begin with its exact tag. DO NOT omit, rename, or modify any tag:
  ✦ [🔮 Thème de Destin du Mois]   ← 月度主题开头
  ✦ [🟢 Semaine 1: Août 1–7]      ← 第1周（🟢=低风险）
  ✦ [🔴 Semaine 2: Août 8–14]     ← 第2周（🔴=高风险）
  ✦ [🔵 Semaine 3: Août 15–21]    ← 第3周（🔵=中风险）
  ✦ [🟢 Semaine 4: Août 22–31]    ← 第4周（🟢=低风险）
  ✦ [⚠️ Pièges Financiers: Août 2026] ✦ ← 财务陷阱结尾
- 行星拼写: Soleil（太阳）, Lune（月亮）, Mars（火星）, Mercure（水星）, Jupiter（木星）, Saturne（土星）, Vénus（金星）, Neptune（海王星）, Pluton（冥王星）, Uranus（天王星）。
- 宫位: Maison 1–12（禁止写"宫"字）。
- 风险图标: 🟢 Faible | 🔴 Élevé | 🔵 Modéré | ⚠️ Avertissement。
- V270-fix: 标题行之后才能写正文，绝对不能在标题之前出现任何内容。
`,


  es: `
[LANG_RULE: Spanish]
- 文风: 热情内省，灵性共鸣。
- 语法: 介词/冠词完整（el, la, de, a, del），数字加空格（700 €）。
- CRITICAL MANDATORY HEADERS — Each section MUST begin with its exact tag. DO NOT omit, rename, or modify any tag:
  ✦ [🔮 Tema del Destino Mensual]   ← 月度主题开头
  ✦ [🟢 Semana 1: Agosto 1–7]      ← 第1周（🟢=低风险）
  ✦ [🔴 Semana 2: Agosto 8–14]     ← 第2周（🔴=高风险）
  ✦ [🔵 Semana 3: Agosto 15–21]    ← 第3周（🔵=中风险）
  ✦ [🟢 Semana 4: Agosto 22–31]    ← 第4周（🟢=低风险）
  ✦ [⚠️ Trampas Financieras: Agosto 2026] ✦ ← 财务陷阱结尾
- V270-fix: 标题行之后才能写正文，绝对不能在标题之前出现任何内容。
`,


  th: `
[LANG_RULE: Thai]
- 文风: สุภาพ ลึกซึ้ง ให้สติ บวกด้วยพลังบวก
- ⚠️ CONSONANT+VOWEL INTEGRITY: Every Thai consonant (ก-ฮ), vowel mark (่ ้ ๊ ๋ ็ ์ ํ), and tone mark MUST appear intact in output. Common dropped letters: น (dropped from ซึ่ง→ซ่), ษ (dropped from สัญญาณ→สัญ信号), ห (dropped from หุ้น→หุ้น). NEVER truncate mid-syllable.
- CRITICAL MANDATORY HEADERS — Each section MUST begin with its exact tag:
  ✦ [🔮 ธีมโชคชะตารายเดือน]   ← 月度主题开头
  ✦ [🟢 สัปดาห์ที่ 1: สิงหาคม 1–7]   ← 第1周（🟢=低风险）
  ✦ [🔴 สัปดาห์ที่ 2: สิงหาคม 8–14]   ← 第2周（🔴=高风险）
  ✦ [🔵 สัปดาห์ที่ 3: สิงหาคม 15–21]  ← 第3周（🔵=中风险）
  ✦ [🟢 สัปดาห์ที่ 4: สิงหาคม 22–31]  ← 第4周（🟢=低风险）
  ✦ [⚠️ กับดักทางการเงิน: สิงหาคม 2026] ✦ ← 财务陷阱结尾
- V270-fix: 标题行之后才能写正文，绝对不能在标题之前出现任何内容。
`,


  vi: `
[LANG_RULE: Vietnamese]
- 文风: Sâu sắc, thấu hiểu, triết lý cuộc sống。
- CRITICAL MANDATORY HEADERS — Each section MUST begin with its exact tag:
  ✦ [🔮 Chủ đề Vận mệnh Tháng]   ← 月度主题开头
  ✦ [🟢 Tuần 1: {MONTH}, Ngày 1–7]    ← 第1周（🟢=低风险）
  ✦ [🔴 Tuần 2: {MONTH}, Ngày 8–14]    ← 第2周（🔴=高风险）
  ✦ [🔵 Tuần 3: {MONTH}, Ngày 15–21]   ← 第3周（🔵=中风险）
  ✦ [🟢 Tuần 4: {MONTH}, Ngày 22–31]   ← 第4周（🟢=低风险）
  ✦ [⚠️ Cạm bẫy Tài chính: Tháng 8, 2026] ✦ ← 财务陷阱结尾
- V270-fix: 标题行之后才能写正文，绝对不能在标题之前出现任何内容。
`,


  en: `
[LANG_RULE: English]
- 文风: Empathetic, psychologically insightful, precise.
- 标题格式（严格遵守）:
  ✦ [🔮 Monthly Destiny Theme]
  ✦ [🟢 Week 1: {MONTH} 1–7]
  ✦ [🔴 Week 2: {MONTH} 8–14]
  ✦ [🔵 Week 3: {MONTH} 15–21]
  ✦ [🟢 Week 4: {MONTH} 22–31]
  ✦ [⚠️ Financial Traps & Risk Mitigation]
- 风险图标: 🟢 Low | 🔴 High | 🔵 Moderate | ⚠️ Warning。
`,

  zh: `
[LANG_RULE: Chinese]
- 文风: 深邃典雅，融汇西方占星与东方灵性。
- 标题格式（严格遵守）:
  ✦ [🔮 月度命运主题]
  ✦ [🟢 第1周: {MONTH}1日–7日]
  ✦ [🔴 第2周: {MONTH}8日–14日]
  ✦ [🔵 第3周: {MONTH}15日–21日]
  ✦ [🟢 第4周: {MONTH}22日–31日]
  ✦ [⚠️ 财务避坑指南]
- 风险图标: 🟢 低危 | 🔴 高危 | 🔵 中危 | ⚠️ 警示。
`
};

function buildWealthPromptContext(lang, meta) {
  const curr = getCurrencyRiskProfile(lang);
  const sunSign = meta?.zodiac?.sunSign || '天秤座';
  const risingSign = meta?.zodiac?.risingSign || '摩羯座';
  const sunHouse = deriveSunHouse(risingSign, sunSign);
  const _l = (d) => d[lang] || d.zh;
  const INSTR = {
    overview: {
      zh: `[DYNAMIC_FINANCIAL_PROFILE — 月报专用·覆盖通用 FORMAT_FIREWALL 周标题模板]`,
      en: `[DYNAMIC_FINANCIAL_PROFILE — Monthly report override. Replaces FORMAT_FIREWALL weekly header template]`,
      es: `[DYNAMIC_FINANCIAL_PROFILE — Informe mensual. Reemplaza la plantilla semanal de FORMAT_FIREWALL]`,
      fr: `[DYNAMIC_FINANCIAL_PROFILE — Rapport mensuel. Remplace le modèle d'en-tête hebdomadaire FORMAT_FIREWALL]`,
      th: `[DYNAMIC_FINANCIAL_PROFILE — รายงานรายเดือน ใช้แทนเทมเพลตสัปดาห์ FORMAT_FIREWALL]`,
      vi: `[DYNAMIC_FINANCIAL_PROFILE — Báo cáo hàng tháng. Thay thế mẫu tiêu đề hàng tuần FORMAT_FIREWALL]`,
    },
    langNote: {
      zh: `- 报告语言: ${lang}`,
      en: `- Report language: ${lang}`,
      es: `- Idioma del informe: ${lang}`,
      fr: `- Langue du rapport: ${lang}`,
      th: `- ภาษารายงาน: ${lang}`,
      vi: `- Ngôn ngữ báo cáo: ${lang}`,
    },
    currency: {
      zh: `- 币种单位: ${curr.currency} (${curr.symbol})`,
      en: `- Currency: ${curr.currency} (${curr.symbol})`,
      es: `- Moneda: ${curr.currency} (${curr.symbol})`,
      fr: `- Devise: ${curr.currency} (${curr.symbol})`,
      th: `- สกุลเงิน: ${curr.currency} (${curr.symbol})`,
      vi: `- Đơn vị tiền tệ: ${curr.currency} (${curr.symbol})`,
    },
    riskThreshold: {
      zh: `- 单笔消费风控阈值: ${curr.symbol}${curr.baseRisk.toLocaleString()}`,
      en: `- Single transaction risk threshold: ${curr.symbol}${curr.baseRisk.toLocaleString()}`,
      es: `- Umbral de riesgo por transacción: ${curr.symbol}${curr.baseRisk.toLocaleString()}`,
      fr: `- Seuil de risque par dépense: ${curr.symbol}${curr.baseRisk.toLocaleString()}`,
      th: `- ขีดจำกัดความเสี่ยงต่อรายการ: ${curr.symbol}${curr.baseRisk.toLocaleString()}`,
      vi: `- Ngưỡng rủi ro mỗi giao dịch: ${curr.symbol}${curr.baseRisk.toLocaleString()}`,
    },
    weeklyCap: {
      zh: `- 周度非必需消费上限: ${curr.symbol}${curr.maxWeekly.toLocaleString()}`,
      en: `- Weekly non-essential spending cap: ${curr.symbol}${curr.maxWeekly.toLocaleString()}`,
      es: `- Tope de gasto no esencial semanal: ${curr.symbol}${curr.maxWeekly.toLocaleString()}`,
      fr: `- Plafond de dépenses non essentielles hebdomadaire: ${curr.symbol}${curr.maxWeekly.toLocaleString()}`,
      th: `- เพดานการใช้จ่ายที่ไม่จำเป็นรายสัปดาห์: ${curr.symbol}${curr.maxWeekly.toLocaleString()}`,
      vi: `- Giới hạn chi tiêu không thiết yếu hàng tuần: ${curr.symbol}${curr.maxWeekly.toLocaleString()}`,
    },
    house: {
      zh: `- 太阳/木星核心激活宫位: 第 ${sunHouse} 宫`,
      en: `- Core activated house (Sun/Jupiter): House ${sunHouse}`,
      es: `- Casa activada principal (Sol/Júpiter): Casa ${sunHouse}`,
      fr: `- Maison principale activée (Soleil/Jupiter): Maison ${sunHouse}`,
      th: `- บ้านหลักที่เปิดใช้งาน (ดวงอาทิตย์/ดาวพฤหัสบดี): บ้านที่ ${sunHouse}`,
      vi: `- Nhà chính được kích hoạt (Mặt Trời/Mộc Tinh): Nhà ${sunHouse}`,
    },
    rulesTitle: {
      zh: `[STRICT_OUTPUT_FORMAT_RULES — 月报周卡片标题增强]`,
      en: `[STRICT_OUTPUT_FORMAT_RULES — Enhanced weekly card headers]`,
      es: `[STRICT_OUTPUT_FORMAT_RULES — Encabezados de tarjetas semanales mejorados]`,
      fr: `[STRICT_OUTPUT_FORMAT_RULES — En-têtes de cartes hebdomadaires enrichis]`,
      th: `[STRICT_OUTPUT_FORMAT_RULES — ส่วนหัวการ์ดรายสัปดาห์ที่ปรับปรุงแล้ว]`,
      vi: `[STRICT_OUTPUT_FORMAT_RULES — Đầu thẻ hàng tuần nâng cao]`,
    },
    // V242-fix: 强化格式约束 + Few-Shot 示例，防 LLM 省略换行和方括号
    rule1: {
      zh: `1. 【格式强制】每周卡片标题必须严格遵循以下格式，不得擅自改动：
   ✦
   [🟢 第1周：{MONTH}1日–7日（水星淬火 · 技能显化之窗） | 第${sunHouse}宫 | 风控: 🟢低危]
   规则：
   - "✦" 必须单独占一行，后面紧跟一个换行
   - 标题内容必须用方括号 [...] 包裹
   - 方括号内不得换行、不得嵌套
   - 副标题（括号内）必须用 V461 诗意意象替代干瘪分类词，四周映射示例：
     · 第1周 →（水星淬火 · 技能显化之窗）类意象（严禁写"财富充能"）
     · 第2周 →（海王迷雾 · 绝对熔断）类意象（严禁写"高危熔断"）
     · 第3周 →（土星沉淀 · 静水深流）类意象（严禁写"顺流蓄力"）
     · 第4周 →（木星高光 · 收割落袋）类意象（严禁写"财富爆发"）
   - 错误格式（禁止）：✦ [🟢 第1周... ]（✦ 和 [ 同在一行）
   - 错误格式（禁止）：✦ 🟢 第1周...（缺失方括号）`,
      en: `1. 【STRICT FORMAT】Every weekly header MUST follow this EXACT pattern:
   ✦
   [🟢 Week 1: {MONTH} 1–7 (Mercury Forged · Skill Manifestation) | House ${sunHouse} | Risk: 🟢 Low]
   Rules:
   - "✦" MUST be on its own line, followed by exactly one newline
   - Title content MUST be wrapped in square brackets [...]
   - No line breaks inside the brackets
   - Subtitle (in parentheses) MUST use V461 poetic imagery instead of dry category words. 4-week mapping example:
     · Week 1 → (Mercury Forged · Skill Manifestation) type imagery (NEVER write "Wealth Recharging")
     · Week 2 → (Neptune Mist · Absolute Meltdown) type imagery (NEVER write "High Risk")
     · Week 3 → (Saturn Sediment · Still Deep Flow) type imagery (NEVER write "Flow Recharge")
     · Week 4 → (Jupiter Spotlight · Harvest In Hand) type imagery (NEVER write "Wealth Burst")
   - FORBIDDEN: ✦ [🟢 Week 1... ] (✦ and [ on same line)
   - FORBIDDEN: ✦ 🟢 Week 1... (missing brackets)`,
      es: `1. 【FORMATO ESTRICTO】Cada encabezado semanal DEBE seguir este patrón exacto:
   ✦
   [🟢 Semana 1: Ago 1–7 (Mercurio Forjado · Manifestación de Habilidad) | Casa ${sunHouse} | Riesgo: 🟢 Bajo]
   Reglas:
   - "✦" DEBE estar en su propia línea, seguido de un salto de línea
   - El título DEBE estar envuelto en corchetes [...]
   - Sin saltos de línea dentro de los corchetes
   - El subtítulo (entre paréntesis) DEBE usar imágenes poéticas V461 en vez de palabras secas. Mapeo 4 semanas:
     · Semana 1 → (Mercurio Forjado · Manifestación de Habilidad) (NUNCA escribir "Recarga de Riqueza")
     · Semana 2 → (Niebla de Neptuno · Fusión Absoluta) (NUNCA escribir "Riesgo Alto")
     · Semana 3 → (Sedimento de Saturno · Corriente Profunda) (NUNCA escribir "Flujo")
     · Semana 4 → (Spotlight de Júpiter · Cosecha en Mano) (NUNCA escribir "Expansión")
   - PROHIBIDO: ✦ [🟢 Semana 1... ] (✦ y [ en la misma línea)
   - PROHIBIDO: ✦ 🟢 Semana 1... (sin corchetes)`,
      fr: `1. 【FORMAT OBLIGATOIRE】Chaque en-tête hebdomadaire DOIT suivre ce modèle exact:
   ✦
   [🟢 Semaine 1: Août 1–7 (Mercure Trempé · Manifestation de Compétence) | Maison ${sunHouse} | Risque: 🟢 Faible]
   Règles:
   - "✦" DOIT être sur sa propre ligne, suivi d'un saut de ligne
   - Le titre DOIT être entouré de crochets [...]
   - Pas de saut de ligne à l'intérieur des crochets
   - Le sous-titre (entre parenthèses) DOIT utiliser des images poétiques V461 au lieu de mots secs. Mapping 4 semaines:
     · Semaine 1 → (Mercure Trempé · Manifestation de Compétence) (JAMAIS écrire "Recharge de Richesse")
     · Semaine 2 → (Brume de Neptune · Fusion Absolue) (JAMAIS écrire "Risque")
     · Semaine 3 → (Sédiment de Saturne · Courant Profond) (JAMAIS écrire "Flux")
     · Semaine 4 → (Spotlight de Jupiter · Récolte en Main) (JAMAIS écrire "Expansion")
   - INTERDIT: ✦ [🟢 Semaine 1... ] (✦ et [ sur la même ligne)
   - INTERDIT: ✦ 🟢 Semaine 1... (crochets manquants)`,
      th: `1. 【รูปแบบบังคับ】ส่วนหัวรายสัปดาห์ทุกสัปดาห์ต้องเป็นไปตามรูปแบบนี้:
   ✦
   [🟢 สัปดาห์ที่ 1: ส.ค. 1–7 (ดาวพุธหลอมแฝง · ประจักษ์ทักษะ) | บ้านที่ ${sunHouse} | ความเสี่ยง: 🟢 ต่ำ]
   กฎ:
   - "✦" ต้องอยู่บรรทัดของตัวเอง ตามด้วยการขึ้นบรรทัดใหม่
   - หัวข้อต้องอยู่ในวงเล็บ [...]
   - ห้ามขึ้นบรรทัดใหม่ภายในวงเล็บ
   - ห้ามคำแบนๆ: ใช้ภาพพจน์ V461 แทน (การเติมพลัง/ความเสี่ยงสูง/ไหลลื่น/เติบโต)
     · สัปดาห์ที่ 1 → (ดาวพุธหลอมแฝง · ประจักษ์ทักษะ)
     · สัปดาห์ที่ 2 → (เนปจูนหมอกลง · หลอมละลายเด็ดขาด)
     · สัปดาห์ที่ 3 → (เสาร์ตะกอน · น้ำเงียบลึก)
     · สัปดาห์ที่ 4 → (พฤหัสจุดสว่าง · เก็บเกี่ยวลงมือ)
   - ห้าม: ✦ [🟢 สัปดาห์ที่ 1... ] (✦ และ [ บรรทัดเดียวกัน)
   - ห้าม: ✦ 🟢 สัปดาห์ที่ 1... (ไม่มีวงเล็บ)`,
      vi: `1. 【ĐỊNH DẠNG BẮT BUỘC】Mỗi tiêu đề hàng tuần phải tuân theo mẫu này:
   ✦
   [🟢 Tuần 1: Thg8 1–7 (Thủy Tinh Luyện · Hiện Thực Kỹ Năng) | Nhà ${sunHouse} | Rủi ro: 🟢 Thấp]
   Quy tắc:
   - "✦" PHẢI trên dòng riêng, theo sau bởi một dòng mới
   - Tiêu đề PHẢI được bọc trong dấu ngoặc [...]
   - Không xuống dòng bên trong dấu ngoặc
   - Tiêu đề phụ (trong ngoặc) PHẢI dùng hình ảnh thơ V461 thay từ khô khan. 4 tuần:
     · Tuần 1 → (Thủy Tinh Luyện · Hiện Thực Kỹ Năng) (CẤM viết "Nạp năng lượng")
     · Tuần 2 → (Hải Vương Sương Mù · Tan Chảy Tuyệt Đối) (CẤM viết "Rủi Ro")
     · Tuần 3 → (Thổ Tinh Trầm Tích · Dòng Nước Sâu) (CẤM viết "Thành Công")
     · Tuần 4 → (Mộc Tinh Điểm Sáng · Gặt Hái Trong Tay) (CẤM viết "Tài Lộc")
   - CẤM: ✦ [🟢 Tuần 1... ] (✦ và [ cùng dòng)
   - CẤM: ✦ 🟢 Tuần 1... (thiếu dấu ngoặc)`,
    },
    rule2: {
      zh: `2. 消费陷阱模块(✦ [⚠️ 消费陷阱...])必须对超过 ${curr.symbol}${curr.baseRisk.toLocaleString()} 的单笔消费强制执行 24 小时冷静期规则,周度非必需上限 ${curr.symbol}${curr.maxWeekly.toLocaleString()},并附灵魂三问决策树。`,
      en: `2. The spending trap section (✦ [⚠️ Spending Traps...]) must enforce a 24-hour cooling-off for any single purchase over ${curr.symbol}${curr.baseRisk.toLocaleString()}, weekly non-essential cap ${curr.symbol}${curr.maxWeekly.toLocaleString()}, plus the 3-question decision tree.`,
      es: `2. La sección de trampas de gasto (✦ [⚠️ Trampas de Gasto...]) debe imponer un enfriamiento de 24 horas para compras superiores a ${curr.symbol}${curr.baseRisk.toLocaleString()}, tope semanal no esencial ${curr.symbol}${curr.maxWeekly.toLocaleString()}, más el árbol de decisión de 3 preguntas.`,
      fr: `2. La section pièges financiers (✦ [⚠️ Pièges Financiers...]) doit imposer un délai de réflexion de 24h pour tout achat dépassant ${curr.symbol}${curr.baseRisk.toLocaleString()}, plafond hebdomadaire non essentiel ${curr.symbol}${curr.maxWeekly.toLocaleString()}, plus l'arbre de décision à 3 questions.`,
      th: `2. ส่วนกับดักการใช้จ่าย (✦ [⚠️ กับดักการใช้จ่าย...]) ต้องบังคับระยะเย็นลง 24 ชม. สำหรับการซื้อเกิน ${curr.symbol}${curr.baseRisk.toLocaleString()} เพดานรายสัปดาห์ไม่จำเป็น ${curr.symbol}${curr.maxWeekly.toLocaleString()} บวกต้นไม้ตัดสินใจ 3 คำถาม`,
      vi: `【越南语输出铁律 V395】绝对禁止吞掉任何单词首字母、禁止两词粘连缺字、变音符号必须完整输出。若不确定宁可多空格也不要丢字。\n【标题格式死模板】报告必须以「✦ [🔮 Chủ đề Vận mệnh Tháng]」开头；每周标题严格用「✦ [🟢 Tuần 1: Thg9 1–7]」「✦ [🔴 Tuần 2: ...]」「✦ [🔵 Tuần 3: ...]」格式（🟢🔴🔵 与周次一一对应）；消费陷阱段标题严格用「✦ [⚠️ Cạm bẫy Tài chính: Tháng 9, 2026] ✦」。金额一律写作「500.000 ₫」，禁止写成 2.000.000 / 5.000.000 等越界数值。\n2. Phần bẫy chi tiêu (✦ [⚠️ Bẫy Chi Tiêu...]) PHẢI nêu bật CON SỐ VI MÔ CHÍNH là ${curr.symbol}${curr.baseRisk.toLocaleString()} — ngưỡng kích hoạt tâm lý cho chi tiêu bốc đồng/không thiết yếu. Ghi rõ '${curr.symbol}${curr.baseRisk.toLocaleString()}' như là con số chủ đạo (lead number) của phần này. Áp dụng thời gian chờ 24 giờ cho mỗi giao dịch vượt quá mức này. Trần hàng tuần không thiết yếu ${curr.symbol}${curr.maxWeekly.toLocaleString()} CHỈ là ranh giới phụ, TUYỆT ĐỐT KHÔNG được dùng làm con số chính. Cộng cây quyết định 3 câu hỏi.`,
    },
    rule3: {
      zh: `3. 全文币种统一使用 ${curr.symbol},禁止混入其他币种符号。`,
      en: `3. Use only ${curr.symbol} throughout. No other currency symbols allowed.`,
      es: `3. Usar solo ${curr.symbol} en todo el texto. No mezclar símbolos de otras monedas.`,
      fr: `3. Utiliser uniquement ${curr.symbol} dans tout le texte. Ne pas mélanger avec d'autres symboles monétaires.`,
      th: `3. ใช้เฉพาะ ${curr.symbol} ทั่วทั้งข้อความ ห้ามผสมสัญลักษณ์สกุลเงินอื่น`,
      vi: `3. Chỉ sử dụng ${curr.symbol} trong toàn bộ văn bản. Không trộn lẫn các ký hiệu tiền tệ khác.`,
    },
    rule4: {
      zh: `4. 全文禁止拼写错误：如"月亮"写错、火星/金星等专有名词错误。`,
      en: `4. No spelling errors for celestial body names: "Lune" (not "Laune"), "Mars", "Vénus", "Mercure", "Jupiter", "Saturne".`,
      es: `4. Sin errores ortográficos en nombres de cuerpos celestes.`,
      fr: `4. 【ORTHOGRAPHE & MAISON】Aucune erreur de spelling. Corps célestes: "Lune" (PAS "Laune"), "Mars", "Vénus", "Mercure", "Jupiter", "Saturne". Chaque section hebdomadaire DOIT maintenir la MÊME maison par corps céleste. EXEMPLE INTERDIT: "La Lune traverse votre Maison 9" suivi de "La Lune en Scorpion dans votre Maison 7" — CHOISIR une seule maison et la garder cohérente dans toute la section.`,
      th: `4. ไม่มีข้อผิดพลาดในการสะกดชื่อวัตถุท้องฟ้า`,
      vi: `4. Không lỗi chính tả tên thiên thể.`,
    },
    rule5: {
      zh: `5. 开篇模块【Thème de Destin du Mois】全文只允许出现一次，严禁重复生成两段相同的开篇。`,
      en: `5. The opening module 【Thème de Destin du Mois】 MUST appear EXACTLY ONCE. Never generate it twice.`,
      es: `5. El módulo de apertura 【Thème de Destin du Mois】 debe aparecer EXACTAMENTE UNA VEZ. Nunca lo generes dos veces.`,
      fr: `5. 【ANTI-DUPLICATION】Le module d'ouverture 【Thème de Destin du Mois】 DOIT apparaître EXACTEMENT UNE FOIS au début du rapport. INTERDIT de le générer deux fois (pas de double intro).`,
      th: `5. โมดูลเปิด 【Thème de Destin du Mois】 ต้องปรากฏเพียงครั้งเดียวเท่านั้น ห้ามสร้างซ้ำ`,
      vi: `5. Phần mở đầu 【Thème de Destin du Mois】 CHỈ ĐƯỢC PHÉP xuất hiện ĐÚNG MỘT LẦN. Không bao giờ tạo hai lần.`,
    },
    rule6: {
      zh: `6. 描述流年太阳运行时统一使用“流年太阳”或“[月份]的太阳”，严禁用“你的太阳”指代行运太阳——“你的太阳”指本命太阳（固定不变，如天秤座）。`,
      en: `6. When describing the Sun's monthly movement (transit), ALWAYS use "the transit Sun" or "the Sun of [month]". NEVER use "your Sun" for the transit Sun — "your Sun" refers to the user's fixed natal Sun sign.`,
      es: `6. AL DESCRIBIR el movimiento mensual del Sol (tránsito), USA SIEMPRE "El Sol en tránsito" o "El Sol de [mes]". NUNCA uses "Tu Sol" para el Sol transitorio — "Tu Sol" se refiere a tu Sol natal (fijo, ej. Libra).`,
      fr: `6. Pour décrire le mouvement mensuel du Soleil (transit), utilisez TOUJOURS "Le Soleil en transit" ou "Le Soleil d'août". N'utilisez jamais "Votre Soleil" pour le Soleil transitoire — "Votre Soleil" désigne votre Soleil natal (fixe).`,
      th: `6. เมื่ออธิบายการเคลื่อนที่รายเดือนของดวงอาทิตย์ (ทรานซิส) ให้ใช้ "ดวงอาทิตย์ในระยะทรานซิส" หรือ "ดวงอาทิตย์ประจำเดือน" เสมอ ห้ามใช้ "ดวงอาทิตย์ของคุณ" สำหรับดวงอาทิตย์ระยะทรานซิส`,
      vi: `6. Khi mô tả sự vận động hàng tháng của Mặt Trời (trôi qua), luôn dùng "Mặt Trời transit" hoặc "Mặt Trời của tháng". KHÔNG dùng "Mặt Trời của bạn" cho Mặt Trời transit — "Mặt Trời của bạn" chỉ Mặt Trời bản mệnh (cố định).`,
    },
    rule7: {
      zh: `7. 本报告所有日期（尤其“消费陷阱”段落）必须严格属于本报告月份，严禁出现其他月份名称（如把8月写成7月）。`,
      en: `7. ALL dates in this report (especially the "Spending Traps" section) MUST belong to the report's current month. NEVER reference other months (e.g., writing August as July).`,
      es: `7. TODAS las fechas de este informe (especialmente la sección "Trampas de Gasto") DEBEN pertenecer al mes actual del informe. NUNCA menciones otros meses (ej. escribir agosto como julio).`,
      fr: `7. Toutes les dates de ce rapport (surtout la section "Pièges Financiers") DOIVENT appartenir au mois courant du rapport. N'évoquez jamais d'autres mois (ex. écrire août au lieu de juillet).`,
      th: `7. วันที่ทั้งหมดในรายงานนี้ (โดยเฉพาะส่วน "กับดักการใช้จ่าย") ต้องอยู่ในเดือนปัจจุบันของรายงาน ห้ามระบุเดือนอื่น (เช่น เขียนสิงหาคมเป็นกรกฎาคม)`,
      vi: `7. TẤT CẢ ngày trong báo cáo này (đặc biệt phần "Bẫy Chi Tiêu") PHẢI thuộc tháng hiện tại của báo cáo. KHÔNG nhắc đến tháng khác (vd. viết tháng 8 thành tháng 7).`,
    },
  };
  const instruction = [
    INSTR.overview[lang] || INSTR.overview.zh,
    _l(INSTR.langNote),
    _l(INSTR.currency),
    _l(INSTR.riskThreshold),
    _l(INSTR.weeklyCap),
    _l(INSTR.house),
    '',
    _l(INSTR.rulesTitle),
    _l(INSTR.rule1),
    _l(INSTR.rule2),
    _l(INSTR.rule3),
    _l(INSTR.rule4),
    _l(INSTR.rule5),
    _l(INSTR.rule6),
    _l(INSTR.rule7),
  ].join('\n');
  return { instruction, curr, sunHouse, risingSign, sunSign };
}

const FORMAT_FIREWALL = `\n\n### 🛑 格式绝对铁律（System Boundary — Zero Tolerance）：\n\n#### A. 禁止 CoT 泄漏\n严禁将任何思考过程、自我纠错、规则讨论、数据验证输出到正文中。内部推理必须在模型内部完成，不得出现在最终文本里。\n禁止输出： (note:...) (注意：...) (Je me corrige...) (correction) (根据数据...) (数据说...) 等任何括号包裹的推理内容。\n\n#### B. 方括号完整性（P0）\n每张卡片的 [ 和 ] 必须成对匹配，且方括号内部不得换行、不得断句、不得嵌套。严禁输出双左括号（如 [🔵[ 周标题前缀后再出现第二个 [）。周标题严格格式：✦ [🔵 Semana 3: ...]（西语）/ ✦ [🔴 Semaine 2: ...]（法语）/ ✦ [🟢 Week 2: ...]（英语），[ 后紧跟 emoji、emoji 后紧跟空格与内容，绝无第二个 [。
  • [🔵[Semana 3: ...]  （双左括号，[ 后紧跟 [，禁止）
\n错误示例（全部禁止）：\n  • [สัปดาห์ที่ 2: ก] .ค. 8–14]  （在 [ 内部断开）\n  • [สัปดาห์ที่ 4: ก.ค. 23–31  （缺失结尾 ]）\n  • [เงาการเงิน] กับดัก... （在 [ 内部有空格和 ]）\n正确格式：\n  • [🟢 สัปดาห์ที่ 2: ก.ค. 8–14 (วงจรความเสี่ยงสูง)]  （一气呵成，无内部断句）\n  • [⚠️ เงาการเงิน：กับดักการใช้จ่าย ก.ค. 2026]  （整行是单个方括号块）\n\n#### C. 语言封锁（最高优先级 — V210-fix 多语言重复循环）
本报告全文必须与用户请求语言严格一致，禁止输出其他语言：
  - lang=th（泰语）→ 全文泰语 ราศี/สัปดาห์/เงินทอง
  - lang=en（英语）→ 全文英语 Zodiac Signs/Week/Wealth
  - lang=es（西语）→ 全文西班牙语
  - lang=fr（法语）→ 全文法语
  - lang=vi（越语）→ 全文越南语
  - lang=zh（中文）→ 全文中文
❌ 禁止：多语言翻译、镜像版本、英文对照、法语对照、中文对照、越南语对照
❌ 禁止：英/法/西/中/越各写一遍
每张周卡片必须严格使用：
  ✦
[emoji สัปดาห์ที่ N: ก.ค. D–D (主题)]
内容

#### C-2. 周次时间段与星象日期严格对应（P1）\n每张周卡片内的星象事件日期（如 Mercury stations direct、Sun enters、Venus enters 等）必须落在该周时间段内，不得跨周次错置：\n  • Week 1 = 当月 1–7 日\n  • Week 2 = 当月 8–14 日\n  • Week 3 = 当月 15–22 日\n  • Week 4 = 当月 23–31 日\n例：若 Mercury stations direct on July 24，则必须写在 Week 4（23–31日），严禁写在 Week 3（15–22日）。\n\n#### D. 消费陷阱卡片（P0）\n必须：  ✦\n[⚠️ 消费陷阱关键词：描述 YYYY年M月]\n内容\n禁止缺失 ⚠️、禁止在方括号内断行。\n\n#### E. 冒号与连接符规范\n[emoji 标题：副标题] 中，冒号必须紧贴文字，不得在冒号后加空格再写内容。\n\n#### F. 泰国数字与月份名禁止拆分\n绝不能拆成 ก] .ค. 或 ก .ค.，必须写成 ก.ค. 或 กรกฎาคม。\n

#### G. 严格单次输出约束（P0）
全文必须严格遵守以下出现次数限制，禁止超出：
  • ✦ [🔮 月度主题] → 仅出现 1 次（第 1 行）
  • ✦ [emoji 第N周] → 仅出现 4 次
  • ✦ [⚠️ 消费陷阱] → 仅出现 1 次
禁止：生成第 2 个月度主题、第 5 个周次卡片、草稿版、替代版本
`;

//
// KindredSouls Railway Server - V116bc (FORCE REBUILD 1783756901)
// Serves static frontend + all API routes on port 3000
import express from 'express';
import { readFileSync, existsSync, statSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAstroMatrix, buildFactSheet, buildPerMonthData, buildPerMonthDataBlock, buildAspectsData, v69HealthCheck, buildNatalAnchors, buildMoonWeekBlock, buildMonthlyOverviewBlock, buildMonthlyTrapBlock, buildMonthlyFactTree, v462NormalizeMoonLabel } from './v69_client.js';
import { resolveTimeZone } from './src/tz-resolver.js';  // 🛡️ V490: 时区强校验与三级回退
import { resolveCoordinates, invalidCoordinatesBody } from './src/coord-validator.js';  // 🛡️ V490b: 坐标强校验
import { LEXICON } from './lexicon.js';
import { buildAstroTruth, SIGN_ARCHETYPE, getSignToHouseMap, SIGN_ORDER_ZH } from './astro-truth.js';
import { validateAstroLogic } from './astro-validator.js';
import https from 'https';
import { Buffer } from 'buffer';
import { getSystemPromptByLocale } from './src/prompts/loader.js';
import { exec } from 'child_process';
import { StringDecoder } from 'string_decoder';  // P0-fix: UTF-8 增量解码器，根治泰语/越南语掉辅音
import { buildDeepSeekSamplingParams } from './lib/llm_params.mjs';  // 🛡️ V475: 采样参数单一真源
import { assessYearlyReportIntegrity } from './lib/yearly_integrity.mjs';  // 🛡️ V475: 年报文本完整度闸门

// ─────────────────────────────────────────────────────────
// 🛠️ V332-fix: StringDecoder 字节级安全分块
// ─────────────────────────────────────────────────────────
//
// 问题根因：
// JS string.length 是 UTF-16 code unit 数，不是字节数。emoji (🟢) 占 2 个 code unit 但 4 个 UTF-8 字节，
// 泰语组合符 ่ 占 1 个 code unit 但 3 个 UTF-8 字节。若按 string 位置切片后再 Buffer.from().toString('utf8')，
// Buffer 内部字节边界可能切在多字节字符中间 → JSON.stringify 产生 U+FFFD → 前端渲染为 乱码方块。
//
// 治本方案：
// 1. 先把 string encode 成 Buffer（utf8 字节数组）
// 2. 在字节层切片（BYTES_PER_CHUNK）
// 3. 用 StringDecoder 把每个字节分片解码成完整字符
//
// StringDecoder 机制：内部维护一个"遗留字节缓冲区"，遇到不完整的多字节序列时，暂存尾部字节，
// 等下次 write() 时把遗留缓冲 + 新字节一起解码，实现零丢失的流式拼接。
//
// 注意：这里不是处理原始网络流（那种场景 StringDecoder 直接接 on('data')），
// 而是"把已组装好的大字符串切成 SSE-safe 的小字符串"——仍然用 StringDecoder 做字节对齐，
// 保证每个 SSE chunk 的内容在字节层面是完整的 UTF-8 字符序列。
//
/**
 * 把大字符串切成字节对齐的 SSE-safe chunk
 *
 * @param text       原始完整字符串
 * @param maxBytes   每个 chunk 的最大字节数（默认 2000 bytes ≈ ~666 个泰语字符）
 * @returns          完整的字符数组，每个元素都是 UTF-8 字节对齐的（无截断）
 */
function _safeChunk(text, maxBytes = 2000) {
  const bytes = Buffer.from(text, 'utf8');
  const decoder = new StringDecoder('utf8');
  const chunks = [];

  for (let byteOffset = 0; byteOffset < bytes.length; byteOffset += maxBytes) {
    // 取 maxBytes 字节（最后一个 chunk 不满也正常）
    const slice = bytes.slice(byteOffset, byteOffset + maxBytes);

    // StringDecoder.write() 负责把不完整的字节序列暂存，
    // 只有完整的 UTF-8 字符才被吐出——不会有 U+FFFD
    const decoded = decoder.write(slice);
    if (decoded) chunks.push(decoded);
  }

  // end() 强制清空 StringDecoder 内部缓冲区，吐出最后的完整字符
  const tail = decoder.end();
  if (tail) chunks.push(tail);

  return chunks;
}

// 保留旧函数别名——其他模块可能仍引用 _chunkEndSafe（渐进式迁移）
function _chunkEndSafe(s, end) {
  if (end >= s.length) return s.length;
  const c = s.charCodeAt(end);
  if (c >= 0xDC00 && c <= 0xDFFF) return end - 1;
  if (c >= 0x0E31 && c <= 0x0E3F) return end - 1;
  return end;
}

// ── safeFetch: 替代全局 fetch,跳过 Node undici ByteString 缺陷 ──
// undici(Node 内置 fetch)在 body/header 含非 ASCII 字符时抛 TypeError:
//   "Cannot convert argument to a ByteString because the character at index X has a value of YYYY"
// ── Latin-1 清洗:Headers 含非 ASCII → 用 ? 替换(防 ByteString 死锁)──
function sanitizeLatin1(v) {
  if (typeof v !== 'string') return String(v);
  let out = '';
  for (let i = 0; i < v.length; i++) {
    const c = v.charCodeAt(i);
    out += c > 255 ? '?' : v[i];
  }
  return out;
}

// ── 全局 env var 污染诊断(启动时打一次)──
(function checkEnvForNonASCII() {
  const dirtyVars = [];
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v !== 'string') continue;
    for (let i = 0; i < v.length; i++) {
      if (v.charCodeAt(i) > 255) {
        // 只记录前 4 个损坏字符的位置
        dirtyVars.push(`${k}[pos=${i}]=${v.charCodeAt(i)}`);
        break;
      }
    }
  }
  if (dirtyVars.length > 0) {
    console.log('[ENV-DIAG] ⚠️ 发现非 ASCII 环境变量★', dirtyVars.join(' | '));
  } else {
    console.log('[ENV-DIAG] ✅ 所有环境变量 ASCII 干净');
  }
})();

// ── V97r: DeepSeek key 从文件读(防 Railway Dashboard 老 key 覆盖)──
function getDeepSeekKey() {
  try {
    if (existsSync('/app/.deepseek-key')) {
      const k = readFileSync('/app/.deepseek-key', 'utf-8').trim();
      if (k.length > 10) return k;
    }
  } catch(e) { /* fall through */ }
  return process.env.DEEPSEEK_API_KEY;
}

// ── V116: Gemini key 从文件读(防 Railway Dashboard 覆盖)──
function getGeminiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) return process.env.GEMINI_API_KEY;
  try {
    if (existsSync('/app/.gemini-key')) {
      const k = readFileSync('/app/.gemini-key', 'utf-8').trim();
      if (k.length > 10) return k;
    }
  } catch(e) { /* fall through */ }
  return null;
}

// ── DeepSeek 直连流式(OpenAI 兼容格式,SSE 逐字吐出)──
// 🛠️ V131: Node.js 原生 fetch 流式(Railway 实测 https.request 在流式场景丢数据,fetch 完美)
async function callDeepSeekStream(systemText, userText, controller, res, onChunk, astroMatrix, realSunSign, lang, reportType = 'yearly', skipFinal = false) {
  // 🛠️ V221: Prompt 预填充真值——彻底弃用 {{}} 占位符机制(主公裁决·方案2)
  // 送进 LLM 前用 astroMatrix 本命盘真值把 {{SUN_HOUSE}} 等替换为 第X宫,
  // 物理杜绝模型因看见 {{}} 非自然 token 而退化,也避免标记裸奔进成品。
  try {
    const _natalH = astroMatrix?.meta?.computed_houses || {};
    const _gJupH = _natalH.Jupiter?.house ?? 2;
    const _gSatH = _natalH.Saturn?.house ?? 10;
    const _gPltH = _natalH.Pluto?.house ?? 8;
    const _gSunH = _natalH.Sun?.house ?? 1;
    const _gMooH = _natalH.Moon?.house ?? 2;
    const _gMarsH = _natalH.Mars?.house ?? 2; // V465: 补齐缺失的本命火星宫位
    const _houseTok = {
      '{{JUPITER_HOUSE}}': '第' + _gJupH + '宫',
      '{{SATURN_HOUSE}}': '第' + _gSatH + '宫',
      '{{PLUTO_HOUSE}}': '第' + _gPltH + '宫',
      '{{SUN_HOUSE}}': '第' + _gSunH + '宫',
      '{{MOON_HOUSE}}': '第' + _gMooH + '宫',
    };
    for (const [_t, _v] of Object.entries(_houseTok)) {
      if (_t) { systemText = (systemText || '').split(_t).join(_v); userText = (userText || '').split(_t).join(_v); }
    }
    // 兜底: 清除任何残留 {{...}}
    systemText = (systemText || '').replace(/\{\{[A-Z0-9_]+\}\}/g, '第1宫');
    userText = (userText || '').replace(/\{\{[A-Z0-9_]+\}\}/g, '第1宫');
  } catch (e) { /* 预填充失败不影响主流程 */ }


  // 🛡️ V219b: 流内重复/超长检测——模型陷入 degeneracy 循环(完整月报重复吐)时提前终止,杜绝 8MB 卡死
  let _acc = '';
  // V222-FINAL: tokMap 仅在 prompt 构建时有用,流式清洗不需要,直接空对象兜底
  const _safeTokMap = {};
  const _tokClean = (s) => {
    if (!s) return s;
    for (const [_t, _v] of Object.entries(_safeTokMap)) {
      if (_t && _v) s = s.split(_t).join(_v);
    }
    s = s.replace(/\{\{[A-Z0-9_]+\}\}/g, '');
    // 🛠️ P0-fix: 清除所有 \uFFFD 替换字符（UTF-8 多字节被切断后的乱码方块）
    s = s.replace(/\uFFFD/g, '');
    return s;
  };
  const _dupGuard = (txt) => {
    _acc += (txt || '');
    // V220g-fix: 改为"最高周次"计数而非"重复次数"——
    // 问题: _acc 累积全量文本,每个增量 chunk 都含"第1周"标题,
    // 导致同一个月报章节被重复计 10~20 次,合法 4 周月报也触发早停。
    // 修复: 提取 _acc 中出现的最大周次(第1周=1, 第2周=2...),
    // 只有模型开始生成"第5周"才算真正越界,4 周合法月报永不触发。
    const _stripped = _acc.replace(/\[V132e-DEPLOYED\]/g, '');
    const _clean = _stripped.replace(/⚠️ 安全指令：第\d+日|Day \d+-\d+|第\d+日[\s\S]*$/gm, '');
    const _cnNums = { '一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8 };
    const _wnMatches = _clean.match(/第([一二三四五六七八1-8])周/g) || [];
    let _maxWeek = 0;
    for (const m of _wnMatches) {
      const _n = m[1];
      const _v = _cnNums[_n] || parseInt(_n);
      if (_v > _maxWeek) _maxWeek = _v;
    }
    // 🛡️ V369-fix: 双份报告检测升级——原"本月命运主题"正则会误匹配周标题内的🔮字符(如"✦ [🔴 本月命运主题第2周"),导致合法4周月报被误判截断
    // 正确锚点: `✦ [🔮 本月命运主题]` 含 ✦+🔮+中文字,全宇宙唯一,只有真正的月度主题章节头才会命中
    // 🛡️ V369-fix2: trap 检测升级——原 `/\[⚠️/` 会把 trap 章节内子项的 ⚠️ 也计入(如"⚠️ 冲动消费"),合法 trap 也触发
    // 修复: trap 章节头 `[⚠️` 必须出现在行首(中文 trap 子项 "⚠️ 冲动" 在句中无行首,不会被误计)
    const _themeCount = (_acc.match(/\✦\s*\[🔮\s*本月命运主题/g) || []).length;
    const _trapCount  = (_acc.match(/^\[⚠️|^\[💸/gm) || []).length;
    if (_themeCount >= 2 || _trapCount >= 2) {
      console.log('[callDeepSeek] ⚠️ V222z-fix10 检测到双份报告(命运主题×' + _themeCount + '/陷阱×' + _trapCount + '),提前终止流 (' + _acc.length + ' chars)');
      // 🛠️ V369-fix3: _dupGuard 返回 false 前先把 unsentDelta 缓冲 flush 出去（消费陷阱等尾部内容可能还在缓冲里），再发 [DONE]，杜绝截断
      if (unsentDelta.length > 0) {
        try {
          res.write(Buffer.from('data: ' + JSON.stringify({ text: unsentDelta }) + '\n\n', 'utf-8'));
          unsentDelta = '';
          if (typeof res.flush === 'function') res.flush();
        } catch(e2){}
      }
      try { clearInterval(heartbeat); } catch(e){}
      try { res.write('data: [DONE]\n\n'); } catch(e){} // V220f: 先发 [DONE] 再关连接
      try { res.end(); } catch(e){}
      return false;
    }
    // 超长(>60k 字)或周次超过 4(即出现第5周+)才算真正的 degeneracy
    if (_acc.length > 60000 || _maxWeek > 4) {
      console.log('[callDeepSeek] ⚠️ V219b 检测到超长/越界周次,提前终止流 (' + _acc.length + ' chars, maxWeek=' + _maxWeek + ')');
      // 🛠️ V369-fix3: 同上——尾部缓冲 flush
      if (unsentDelta.length > 0) {
        try {
          res.write(Buffer.from('data: ' + JSON.stringify({ text: unsentDelta }) + '\n\n', 'utf-8'));
          unsentDelta = '';
          if (typeof res.flush === 'function') res.flush();
        } catch(e2){}
      }
      try { clearInterval(heartbeat); } catch(e){}
      try { res.write('data: [DONE]\n\n'); } catch(e){} // V220f: 先发 [DONE] 再关连接
      try { res.end(); } catch(e){}
      return false;
    }
    return true;
  };
  console.log('[callDeepSeek] START, res.type=', typeof res, 'res.write=', typeof res?.write, 'res.flush=', typeof res?.flush);
  const deepseekKey = getDeepSeekKey();
  let resp;
  try {
    console.log('[callDeepSeek] → api.deepseek.com (native fetch)');
    resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
      // 🛡️ V437-fix: 泰文 BPE 膨胀效应——3700 泰字符≈4500-5500 tokens，加上 Prompt 侧已消耗，
      //   deepseek-flash 8K 模型总容量在输出中途爆表（实测 3726 字符截断在陷阱标题）。
      //   按语种扩容：th/vi 月报→16384，zh 月报→12000，其余→10000
      // 🛡️ V475: 采样参数收敛到 lib/llm_params.mjs 单一真源。
      //   旧内联参数对年报沿用月报的 0.3 频率惩罚 → 中文超长占星文系统性缺字(座/星/阳/亮被压制)+提前烂尾。
      //   年报现走零惩罚 + max_tokens 16384；月报参数原样保留(多轮封仓验证过)。
      body: JSON.stringify({ model: 'deepseek-flash', thinking: { type: 'disabled' }, messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }], ...buildDeepSeekSamplingParams(reportType, lang), stream: true, stop: ['===END_OF_REPORT==='] }),
      signal: controller.signal,
    });
    console.log('[callDeepSeek] HTTP', resp.status);
  } catch(e) { console.error('[callDeepSeek] fetch threw:', e.name, e.message); throw e; }
  if (!resp.ok) { const body = await resp.text(); console.error('[callDeepSeek] HTTP!ok:', resp.status, body.slice(0,200)); throw new Error('DeepSeek HTTP '+resp.status); }
  const reader = resp.body.getReader();
  // 🛠️ P0-fix: 用 StringDecoder 替代 TextDecoder，根治 UTF-8 多字节字符被 Chunk 边界切断导致的掉辅音/乱码方块
  // TextDecoder 在遇到不完整的多字节序列时会输出 \uFFFD，StringDecoder 会暂存未完整的字节等下一个 chunk 凑齐后再解码
  const decoder = new StringDecoder('utf8');
  let buf = '', fullText = '';
  const FLUSH_SIZE = 80; // V370-fix3: 200→80，DeepSeek-V4-Flash 生成极快，200字仍是一段一段蹦；80字约0.5-1秒一个chunk更接近打字机视觉
  let pending = '';
  let sentLen = 0; // V220d
  let lastClean = ''; // V220d: last chunk clean for new-suffix
  let unsentDelta = ''; // V220d: pending delta to send
  let chunkCount = 0;
  // 🛡️ V222z-fix13e: text 流层单锚截断——MISS 路径下 sanitized 从不触发,必须在 text 流层直接断流
  let _monthlyCutDone = false;
  // 🛡️ V436-fix2: 加换行前缀要求——注入的标准标题在 text 最开头(无前置换行)不触发截断守卫，LLM 自生成的 ✦ [🔮 才触发
  const _MONTHLY_THEME_RE = /\n\✦\s*\[\🔮/g;
  // 🛠️ V362: 全局心跳同步升级为 1KB 重型心跳
  const heartbeat = setInterval(() => { try { if (typeof res?.write === 'function') { res.write(': ' + ' '.repeat(1024) + '\n\n'); if (typeof res.flush === 'function') res.flush(); } } catch(e){} }, 20000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) { const _final = decoder.end(); if (_final) buf += _final; break; }
      buf += decoder.write(value);
      const lines2 = buf.split('\n');
      buf = lines2.pop() || '';
      for (const line of lines2) {
        if (!line.startsWith('data: ')) continue;
        const d = line.slice(6).trim();
        if (d === '[DONE]') { clearInterval(heartbeat); continue; }
        try {
          const parsed = JSON.parse(d);
          const txt = parsed.choices?.[0]?.delta?.content || '';
          if (!txt) continue;
          chunkCount++;
          // 🛠️ V374-fix: 首个 chunk 必须以 ✦ [🔮 开头——DeepSeek 偶发省略 ✦ 或 [🔮] 括号
          // 若首 chunk 不以 ✦ 开头，补全前缀；若以 ✦ 开头但缺 [🔮，补 [🔮
          // 🛠️ V120-fix26: 净化层 - 含字面\uXXXX转义→真实emoji + 标题修复
          let clean = txt
            .replace(/\\n/g, '\n')
            .replace(/ \n/g, '\n')
            .replace(/  +/g, ' ')
            // 字面 unicode 转义 → 真实字符 (DeepSeek 偶尔字面吐出 \ud83d\udd2e)
            .replace(/\\ud83d ?\\udd2e/g, '🔮')
            // 🛠️ V407-fix: \ud83d\udfe2 才是 🟢(U+1F7E2)，\ud83d\udd2e 是 🔮(U+1F52E)，旧版重复映射
            .replace(/\\ud83d ?\\udfe2/g, '🟢')
            .replace(/\\ud83d ?\\udd34/g, '🔴')
            .replace(/\\ud83d ?\\udd35/g, '🔵')
            .replace(/\\u26a0 ?\\ufe0f/g, '⚠️');
          // 🛠️ V140: 半角括号→全角 仅限中文 (2026-07-26 V154修正: 原为 lang!=='en' 导致es/fr/th/vi全错)
          if (lang === 'zh') {
            clean = clean.replace(/\(/g, '（').replace(/\)/g, '）');
          }
          clean = clean
            // 章节标题兜底修复 (DeepSeek 截断/缩写标题)
            .replace(/🔮\s*本命主(?!题)/g, '🔮 本月命运主题')
            .replace(/🔮\s*本(?![月命运主题])/g, '🔮 本月命运主题')
            .replace(/🔮\s*命主(?!题)/g, '🔮 本月命运主题')
            // 🛠️ V462: 旧套话归一（治本：此处原本把残缺词“修复”回旧套话，与提示词黑名单互相打架）
            .replace(/（财充）/g, `（${V462_WEEK_SUB.zh[0]}）`)
            .replace(/（高熔）/g, `（${V462_WEEK_SUB.zh[1]}）`)
            .replace(/（顺蓄）/g, `（${V462_WEEK_SUB.zh[2]}）`)
            .replace(/（财爆）/g, `（${V462_WEEK_SUB.zh[3]}）`)
            // 🛠️ V467: 月亮周标签单一真源（治本「🌙 月亮过境/途经」混用）—— 归一为各语言 canonical
            .replace(/\uFFFD/g,'').replace(/�/g,'');
          clean = v462NormalizeMoonLabel(clean, lang);
          // 🛠️ V414-fix: V374 首块主题头补全——原代码块位于 `let clean` 之前(TDZ 死区),
          //   首 chunk 访问 clean 抛 ReferenceError 被 catch 吞掉 → 首段文字丢失("削首"根因)。移到 clean 生成之后。
          if (chunkCount === 1) {
            if (!clean.startsWith('✦')) {
              clean = '✦ [🔮 ' + clean;
            } else if (!clean.startsWith('✦ [🔮')) {
              clean = clean.replace(/^✦\s*/, '✦ [🔮 ');
            }
          }
          console.log('[CLEAN] in:', JSON.stringify(txt.slice(0,80)), '-> out has 财充:', clean.includes('（财充）'), 'has 财富充能:', clean.includes('（财富充能）'));
          // V221: newSuffix 恒为增量(delta); fullText 累积真实全文, sentLen 游标保证只发未发部分(根治累积重发灾难)
          // V222q: 加前缀重发检测——DeepSeek 偶发重发已输出前缀(clean 是 lastClean 的前缀或相同) → 丢弃,根治事件级重复
          let newSuffix = '';
          if (lastClean) {
            if (clean.length > lastClean.length && clean.startsWith(lastClean)) {
              newSuffix = clean.slice(lastClean.length);      // 正常累积延伸
            } else if (clean.length <= lastClean.length && lastClean.startsWith(clean)) {
              newSuffix = '';                                  // 重发前缀/完全相同 → 丢弃
            } else {
              newSuffix = clean;                               // 全新内容(增量SDK/漂移) → 原样
            }
          } else {
            newSuffix = clean;
          }
          lastClean = clean;
          fullText += newSuffix;
          pending = fullText;
          // 🛡️ V222z-fix13e: monthly 专用——流式循环中实时检测第二个 ✦ [🔮 锚点,发现即截断
          // 截断逻辑前置到 text 流层:MISS 路径下 sanitized 从不触发,必须在流式循环里直接断流
          if (reportType === 'monthly' && !_monthlyCutDone) {
            _MONTHLY_THEME_RE.lastIndex = 0;
            const _anchors = [...fullText.matchAll(_MONTHLY_THEME_RE)];
            if (_anchors.length >= 2) {
              const _cutPos = _anchors[1].index; // 第 2 个锚点位置 = 第 2 份报告起点
              const _truncated = fullText.substring(0, _cutPos);
              console.warn(`[V222z-fix13e] text流层截断(锚点×${_anchors.length}): ${fullText.length}→${_truncated.length} chars`);
              _monthlyCutDone = true; // 阻止重复触发
              // 发截断后的完整内容,立即关闭流
              try {
                res.write(Buffer.from(`data: ${JSON.stringify({ text: _truncated, _dbg: { source: 'V233FIX13E_STREAM_CUT' } })}\n\n`, 'utf-8'));
              } catch(e) {}
              res.write('data: [DONE]\n\n');
              if (typeof res.flush === 'function') try { res.flush(); } catch(e) {}
              clearInterval(heartbeat);
              return; // 跳出流式循环
            }
          }
          unsentDelta += newSuffix; // V222q: 增量入缓冲——V221b 无条件推进 sentLen 导致 <FLUSH_SIZE 的增量被永久跳过(text事件全丢,前端无流式),恢复 V220d 缓冲方案
          if (unsentDelta.length >= FLUSH_SIZE) {
            const _toSend = unsentDelta;
            unsentDelta = '';
            sentLen += _toSend.length;
            try {
              // V220d: delta already merged into unsentDelta (see above)
              const _a = astroMatrix?.meta?.rising_sign||'Cancer';
// 🛠️ V120-fix23: 流式月报零清洗
              let pc;
              if (reportType === 'monthly') {
                // 🛠️ V131e: 月报流式 flush 也过相角清洗(保证前端展示干净); realSunSign 传给 Pluto House 修正
  console.log("[V132e-DEPLOYED] monthly handler active - v132e-final active at", new Date().toISOString());
                pc = stripAspectTermsAndPlutoHouse(fixMonthlySectionTitles(fixSectionBrackets(_toSend, lang), false, lang)).replace(/\uFFFD/g,'');
              } else {
                // 🛡️ V477: 全链输出统一过 CJK 守恒守卫(任一刀吃字则回滚本块)
                pc = house_linter(natal_sun_linter(astro_phase_linter(final_text_sanitizer(_toSend,_a, lang)),realSunSign,_a), astroMatrix);
                pc = applyMonthLockSanitizer(pc,astroMatrix,null,null,lang).replace(/\uFFFD/g,'').replace(/�/g,'');
                pc = _v477Guard(_toSend, pc, 'stream-chunk');
              }
              res.write(Buffer.from(`data: ${JSON.stringify({
                text: pc,
                _dbg: {
                  pendingLen: _toSend.length,
                  fixInput: _toSend.slice(0, 100),
                  fixOutput: (pc||'').slice(0, 100),
                  hasKaichuan: pc.includes('【开篇】'),
                  hasCaichong: pc.includes('（财富充能）')
                }
              })}\n\n`, 'utf-8'));
              if (_dupGuard(pc)) { try { onChunk && onChunk(pc); } catch(e) {} } else return;
            } catch(e2) {
              // 🛠️ V120-fix8: 兜底——即使下游linter抛错,也至少过final_text_sanitizer清洗半角括号/相位术语
              
              let _safe = _toSend;
              try { _safe = final_text_sanitizer(_toSend, astroMatrix?.meta?.rising_sign||'Cancer'); } catch(e3) { _safe = _toSend; }
              res.write(Buffer.from(`data: ${JSON.stringify({ text: _tokClean(_safe) })}\n\n`, 'utf-8'));
              { /* V222t: catch 兜底只发一次 no-dbg 事件，不再 onChunk(_safe) 重复累积 */ }
            }
            /* V221b: sentLen 已在 _toSend 算完时无条件推进, 不依赖此处 */
          }
          // 🛠️ V222s: res.flush 移到 flush try 外——原 265 行的 res.flush 在 try 内,若 flush 抛错会进 257 catch → 每 flush 重复发一次 no-dbg 事件(成对重复+ sanitary 失效)。现单独 try/catch,抛错只影响 flush 时机,不触发主 catch
          try { if (typeof res.flush === 'function') res.flush(); } catch(e) {}
        } catch(e) {}
      }
    }
  } catch(e) { clearInterval(heartbeat); console.error('[callDeepSeek] stream read error:', e.message); throw e; }
  clearInterval(heartbeat);
  const _rest = fullText.slice(sentLen); // V221: 循环结束时未达 FLUSH_SIZE 的尾部真增量
  if (_rest) {
    const _a = astroMatrix?.meta?.rising_sign||'Cancer';
    let pc;
    if (reportType === 'monthly') {
      // 🛠️ V120-fix23: 月报修复章节标题缩写 + 去乱码
      // 🛠️ V131e: 月报 flush 也过相角清洗; realSunSign 传给 Pluto House 修正
      pc = stripAspectTermsAndPlutoHouse(fixMonthlySectionTitles(fixSectionBrackets(_rest, lang), false, lang)).replace(/\uFFFD/g,'');
      res.write(Buffer.from(`data: ${JSON.stringify({ text: _tokClean(pc) })}\n\n`, 'utf-8'));
      if (_dupGuard(pc)) onChunk && onChunk(pc); else return;
    } else {
      try {
        pc = house_linter(natal_sun_linter(astro_phase_linter(final_text_sanitizer(_rest,_a, lang)),realSunSign,_a), astroMatrix);
        pc = applyMonthLockSanitizer(pc,astroMatrix,null,null,lang).replace(/\uFFFD/g,'').replace(/�/g,'');
        pc = _v477Guard(_rest, pc, 'stream-tail');
        res.write(Buffer.from(`data: ${JSON.stringify({ text: _tokClean(pc) })}\n\n`, 'utf-8'));
        if (_dupGuard(pc)) onChunk && onChunk(pc); else return;
      } catch(e) {
        res.write(Buffer.from(`data: ${JSON.stringify({ text: _tokClean(_rest) })}\n\n`, 'utf-8'));
        if (_dupGuard(_rest)) onChunk && onChunk(_rest); else return;
      }
    }
    if (typeof res.flush === 'function') res.flush();
  }
  // 🛠️ V131e-fix: 月报相角术语+ Pluto水瓶宫位双重后处理清洗
  // 根治:DeepSeek 绕过 Prompt 禁令写"三分相/对分相/合相"和"水瓶座第10宫"
  function stripAspectTermsAndPlutoHouse(text, natalSunSign, lang) {
    if (!text) return text;

  // V152: 标题方括号补全
  text = fixSectionBrackets(text, lang);

    let t = text;
    // 0) 半角括号→全角(兜底,月报路径不过final_text_sanitizer)
    // 🛠️ V140: 仅限非英文 (英文报告保留半角括号)
    if (lang !== 'en') {
      if (lang === 'zh') { t = t.replace(/\(/g, '（').replace(/\)/g, '）'); }
    }
    // 🛠️ V168-fix3: 【】转[]——AI流式输出中文月报时用【】而非[]
    if (lang === 'zh') {
      t = t.replace(/【/g, '[').replace(/】/g, ']');
    }
    // 0b) 后处理天文强杀 — AI瞎编的历史行星位置
    // 🛠️ V132-fix: 强杀土星在射手座(AI用2015-2017年旧数据),太阳入狮子错误日期
    t = t.replace(/土星在射手座/g, '土星在白羊座');
    t = t.replace(/土星在摩羯座(?!.*逆行)/g, '土星在白羊座');
    // 强杀"水星在狮子座逆行"(真实7月逆行在水星在巨蟹座)
    t = t.replace(/水星在狮子座逆行/g, '水星在巨蟹座逆行');
    // 强杀"7月25日太阳进入狮子座"(真实是7月23日)
    t = t.replace(/7月25日，太阳进入狮子座/g, '7月23日，太阳进入狮子座');
    t = t.replace(/7月25日\s*[,，]\s*太阳进入狮子座/g, '7月23日，太阳进入狮子座');
    // 🛠️ V168-fix: "太阳进入狮子座"仅限7月23日,其他日期的"进入狮子座"全部是AI幻觉
    // 用否定 lookahead 确保"7月23日"不被误杀
    t = t.replace(/(?<!7月23日[,，]?)太阳进入狮子座/g, '太阳进入巨蟹座');
    // 强杀"太阳在狮子座"（7月1-22日太阳在巨蟹座）
    t = t.replace(/太阳在狮子座第十宫与木星狮子座/g, '太阳在巨蟹座第十宫与木星巨蟹座');
    t = t.replace(/太阳在狮子座/g, '太阳在巨蟹座');
    // 🛠️ V168-fix2: 强杀"月亮在摩羯座与冥王星在水瓶座形成对冲"——几何错误,摩羯座与水瓶座仅30°相邻
    t = t.replace(/月亮在摩羯座与冥王星在水瓶座形成对冲/g, '月亮在摩羯座与冥王星在水瓶座形成错位张力');
    t = t.replace(/月亮在摩羯座[^。\n]{0,20}?冥王星在水瓶座[^。\n]{0,20}?对冲/g, '月亮在摩羯座与冥王星在水瓶座形成错位张力');
    // 强杀"月亮7月底在双子座"(真实在水瓶座)
    t = t.replace(/月亮进入双子座并与冥王星/g, '月亮进入水瓶座并与冥王星');
    // 强杀"太阳与木星在狮子座"（7月1-21日太阳在巨蟹座，AI插入"与木星"躲过"太阳在狮子座"规则）
    t = t.replace(/太阳与木星在狮子座/g, '太阳与木星在巨蟹座');
    // 强杀"太阳在狮子座"紧跟"共振/扩张/能量/点火"等后续词（AI幻觉太阳提前入狮）
    t = t.replace(/太阳与木星在([一-龥]{0,8}?)(共振|扩张|能量|点火|闪耀|共鸣|辉映|共振)/g, '太阳与木星在巨蟹座$1$2');
    // 强杀单独的"太阳进入/在狮子座"在7月语境（月报只覆盖7月）
    t = t.replace(/太阳进入狮子座/g, '太阳进入巨蟹座');
    // 强杀"同频共振"——全局替换，不依赖
    while (t.includes('同频共振')) { t = t.replace('同频共振', '协同互动'); }
    // 强杀"意外之财"描述梅花/四分相
    t = t.replace(/意外之财/g, '财富变数');
    // 1) 清除所有相角术语 → 自然能量语言
    // 🛠️ V131e-fix2: 覆盖全角（120度）+半角(120°)双版本
    // 🛠️ V132e-fix: 禁止"同频共振"用于四分相/梅花相
    t = t.replace(/同频共振/g, '能量互动');
    // 禁止"和谐互动"描述梅花相(处女-白羊)
    t = t.replace(/处女座与土星在白羊座形成和谐互动/g, '处女座金星与白羊座土星形成错位张力');
    // 禁止"意外之财"描述四分相(处女-双子)
    t = t.replace(/金星在处女座与天王星在双子座形成相位.*?意外之财/g, '金星在处女座与天王星在双子座形成能量碰撞，变数增加');
    const ASPECT_MAP = [
      ['三分相（120度）','共振'],['三分相(120度)','共振'],['三分相','共振'],
      ['四分相（90度）','张力'],['四分相(90度)','张力'],['四分相','张力'],
      ['对分相（180度）','强烈对冲'],['对分相(180度)','强烈对冲'],['对分相','对冲'],
      ['六分相（60度）','和谐互动'],['六分相(60度)','和谐互动'],['六分相','和谐互动'],
      ['合相（0度）','同频共振'],['合相(0度)','同频共振'],['合相','同频共振'],
      ['梅花相位（150度）','艰难共振'],['梅花相位(150度)','艰难共振'],['梅花相位','艰难共振'],
      ['十二分相（30度）','微调互动'],['十二分相(30度)','微调互动'],['十二分相','微调互动'],
    ];
    for (const [bad, good] of ASPECT_MAP) t = t.split(bad).join(good);
    // 🛠️ V132e-fix: 月报直接输出"同频共振"替换为中性词（避免"合相"变"同频共振"后AI直接写同频共振）
    t = t.replace(/同频共振/g, '能量互动');
    // 🛠️ V133-fix: 太阳双向拦截——7月1-22巨蟹 / 7月23-31狮子（防LLM算错方向）
    const _wk4 = t.indexOf('第4周');
    if (_wk4 >= 0) {
      const _before = t.substring(0, _wk4);
      let _after = t.substring(_wk4);
      // 第4周及之后(7月23-31):太阳必在狮子
      _after = _after.split('太阳在巨蟹座').join('太阳在狮子座');
      // 第4周之前(7月1-22):太阳必在巨蟹
      const _beforeFixed = _before.split('太阳在狮子座').join('太阳在巨蟹座');
      t = _beforeFixed + _after;
    } else {
      // 无第4周标记时，按日期兜底
      t = t.replace(/7月(2[3-9]|3[01])日[^。\n]*?太阳在巨蟹座/g, (m) => m.replace('太阳在巨蟹座', '太阳在狮子座'));
      t = t.replace(/7月([1-9]|1[0-9]|2[0-2])日[^。\n]*?太阳在狮子座/g, (m) => m.replace('太阳在狮子座', '太阳在巨蟹座'));
    }
    // 兜底：月末"太阳在巨蟹座"与"太阳进入狮子座"矛盾时，统一狮子座
    t = t.replace(/(太阳与木星在巨蟹座|太阳在巨蟹座第十宫|太阳在巨蟹座第11宫)/g, (m) => m.replace('巨蟹座', '狮子座'));
    // 🛠️ V133d-fix: 水星逆行日期纠偏(Swiss Eph实测:7月全程巨蟹座,6月底已逆,7/23-24转顺)
    // AI常编"7月8日正式开始""7月18日顶点"——7月内没有开始日,7/18只是普通逆行中
    t = t.replace(/水星逆行于7月\d+日正式开始/g, '水星在巨蟹座逆行');
    t = t.replace(/水星于7月\d+日进入逆行/g, '水星在巨蟹座逆行');
    t = t.replace(/水星在巨蟹座逆行于7月\d+日正式开始/g, '水星在巨蟹座逆行');
    // 🛠️ V133d-fix2: 扩大匹配覆盖"7月8日...开始"和"7月18日...顶点"变体

    // 🛠️ V144-fix: 保留完整句子，只清括号内的"逆行顶点"标签
    t = t.replace(/（逆行顶点）/g, '（中期）');
    t = t.replace(/7月18日，水星逆行达到最慢点/g, '7月18日前后，水星逆行处于中期');
    t = t.replace(/7月8日[^。]+正式[^。]+开始/g, '7月全程处于逆行状态');
    t = t.replace(/7月8日[^。]+开始[^。]+逆行/g, '7月全程处于逆行状态');
    // 🛠️ V133d-fix3: 覆盖"逆行进入顶点（7月8日至25日）"这种嵌套括号变体
    t = t.replace(/逆行[^。]+7月8日至25日/g, '逆行（7月1日至23日前后）');
    // 🛠️ V133d-fix4: 直接杀"水星逆行进入顶点"这个错误短语
    // 真实天象：水星7月全程在巨蟹座逆行，没有"进入顶点"这个概念
    // 句式："7月8-12日，水星逆行进入顶点（7月18日前后最慢）"
    // 🛠️ V133d-fix6: 覆盖"进入逆行顶点（最慢点）"和"逆行水星在巨蟹座"等变体
    // 🛠️ V133d-fix7: 直接杀"第N日（逆行顶点）"和"正式在巨蟹座逆行"残留
    t = t.replace(/正式在巨蟹座逆行/g, '在巨蟹座逆行');
    // 🛠️ V144: 只清括号内标签，保留完整句子结构
    t = t.replace(/第\d+日正是逆行顶点/g, '逆行中期');
    // 🛠️ V133d-fix9: 非贪婪版——停在第一个)而非贪到下一个句号
    // 括号未闭合兜底：匹配到第一个句号
    // 清理括号不规范：多重重开 → 单重
    // 例: 第6宫在（全程））→ 第6宫在（全程）
    t = t.replace(/（（+/g, '（');
    // 🛠️ V133g-fix3: 括号规范化——多重重括号只保留一个
    // 例: （全程）））→（全程））→（全程）

    // 括号计数法：统计（和）数量，从后往前删超出的）
    const _oc = (t.match(/（/g)||[]).length;
    const _cc = (t.match(/）/g)||[]).length;
    if (_cc > _oc) {
      let _ex = _cc - _oc;
      const _rv = t.split(''); _rv.reverse();
      for (let i=0;i<_rv.length&&_ex>0;i++) { if (_rv[i]==='）') { _rv[i]=''; _ex--; } }
      t = _rv.reverse().join('');
    }
    // 🛠️ V133f-fix1: 修复正则误伤"在巨蟹座在巨蟹座"连写
    t = t.replace(/在巨蟹座在巨蟹座/g, '在巨蟹座');
    // 🛠️ V133f-fix2: 强杀"7月23日太阳进入巨蟹座"——双向拦截误伤了正确的"进入狮子座"
    // 也可能是LLM直接生成了错误表述，无论如何这是物理级错误必须杀
    t = t.replace(/7月23日[,，]?太阳进入巨蟹座/g, '7月23日，太阳进入狮子座');
    // 同理修复"在第七宫在巨蟹座"
    t = t.replace(/在第(\d)宫在巨蟹座/g, '在第$1宫');
    // 🛠️ V133f-fix: 修复正则误伤导致"在巨蟹座在巨蟹座"连写
    t = t.replace(/在巨蟹座在巨蟹座/g, '在巨蟹座');
    // 🛠️ V133f-fix2: 强杀"7月23日太阳进入巨蟹座"——双向拦截误伤了正确的"进入狮子座"
    // 也可能是LLM直接生成了错误表述，无论如何这是物理级错误必须杀
    t = t.replace(/7月23日[,，]?太阳进入巨蟹座/g, '7月23日，太阳进入狮子座');
    // 同理修复"在第七宫在巨蟹座"
    t = t.replace(/在第(.)宫在巨蟹座/g, '在第$1宫在巨蟹座');
    // 覆盖"逆行水星在巨蟹座第N宫" → "水星在巨蟹座逆行第N宫"
    t = t.replace(/逆行水星在巨蟹座([^，,。\n]+)/g, '水星在巨蟹座逆行$1');
    // 🛠️ V133d-fix6c: "7月18日至22日，水星逆行末期"——7月18日不是逆行末期，正确是7月23-24日顺行
    // 🛠️ V144: 温和处理，不破坏句子结构
    t = t.replace(/7月18日至22日[^。]*?逆行末期/g, '逆行影响逐渐减弱');
    t = t.replace(/7月18日至22日[^。]*?逆行[^。]*?减弱/g, '逆行影响逐渐减弱');
    // 🛠️ V133d-fix5: 精确兜底——直接匹配实际生成的错误句式
    t = t.replace(/7月18日[前后]后[最慢左右][^。]+/g, '7月18日前后，逆行中期');
    t = t.replace(/水星逆行（7月8-25日）/g, '水星在巨蟹座逆行（7月1日至23日）');
    t = t.replace(/水星在巨蟹座逆行（7月8-25日）/g, '水星在巨蟹座逆行（7月1日至23日）');
    t = t.replace(/水星逆行（7月1-25日）/g, '水星在巨蟹座逆行（7月1日至23日）');
    t = t.replace(/水星在巨蟹座逆行[^。\n]{0,20}?7月8日[^。\n]{0,15}?开始/g, '水星在巨蟹座逆行（7月23日前后恢复顺行）');
    // 🛠️ V133d-fix: 月报长括号自动闭合(搬自final_text_sanitizer V104c,月报路径不过该链)
    // 防AI流式丢左括号→裸右括号(如"月亮进入天蝎座天然守护星座）")
    var _secs = t.split('\n');
    for (var _si = 0; _si < _secs.length; _si++) {
      var _sec = _secs[_si];
      var _openC = (_sec.match(/（/g) || []).length;
      var _closeC = (_sec.match(/）/g) || []).length;
      if (_openC > _closeC && !_sec.match(/[）\s]$/)) {
        _secs[_si] = _sec + '）';
      }
      // 反向:有)无(开头→ 补左括号(流式块被截断的孤立右括号)——但仅当句首即右括号
      if (_closeC > _openC && _sec.trim().startsWith('）')) {
        _secs[_si] = '（' + _sec;
      }
    }
    t = _secs.join('\n');
    // 2) 修正 Pluto 水瓶座宫位(仅对本命太阳水瓶座用户生效)
    // 上升水瓶=全行星落Aquarius=House 11; AI 统一写成 House 10 必须统一纠正
    // 中数字(第十/第十一)和阿拉伯数字都匹配
    const isAquarius = natalSunSign && (natalSunSign.includes('水瓶') || natalSunSign.includes('Aquarius') || natalSunSign.includes('Verseau') || natalSunSign === 'Aquarius');
    if (isAquarius) {
      t = t.replace(/水瓶座第[零一二三四五六七八九十百\d]+宫/g, '水瓶座第十一宫');
      t = t.replace(/\bAquarius House \d+/g, 'Aquarius House 11');
    }
    return t;
  }

  // 🛠️ V120-fix25: 流式结束后,用完整 fullText 重新应用章节标题修复 + 相角清洗
  // 前端收到 sanitized 标志时整体替换流式脏文本(避免叠加重复)
  // 🛡️ V222q: 分段生成时跳过最终 sanitized 全量发送(由主端点最终合并后统一发一次),根治前端流式分段跳变
  if (reportType === 'monthly' && fullText && !skipFinal) {
    let fixed = stripAspectTermsAndPlutoHouse(fixMonthlySectionTitles(fullText, true, lang), realSunSign, lang);
    // 🛠️ V133g-fix5: 括号计数修复必须同步更新fullText
    const _ocF = (fixed.match(/\uff08/g)||[]).length;
    const _ccF = (fixed.match(/\uff09/g)||[]).length;
    if (_ccF > _ocF) {
      let _exF = _ccF - _ocF;
      const _rvF = fixed.split(''); _rvF.reverse();
      for (let i=0; i<_rvF.length && _exF>0; i++) { if (_rvF[i]==='\uff09') { _rvF[i]=''; _exF--; } }
      fixed = _rvF.reverse().join('');
    }
    // 🛠️ V222e: 月报格式铁律——在 sanitized 发送前强制统一格式
    if (reportType === 'monthly') {
      fixed = fixMonthlySectionTitles(fixed, true, lang);
    }
    if (fixed.length > 0) {
      try {
        // 🌟 V238 刀B：sanitized 发送前过三刀流
        fixed = sanitizeReportFinal(fixed, { lang, reportType });
        // 🛠️ V414: 阈值清洗为越南语专用,加语言门控防污染其他语言(原无条件执行)
        if (lang === 'vi') fixed = enforceRiskThreshold(fixed, lang);
        res.write(Buffer.from(`data: ${JSON.stringify({ sanitized: fixed })}\n\n`, 'utf-8'));
        onChunk && onChunk(fixed);
        if (typeof res.flush === 'function') res.flush();
        console.log('[callDeepSeek] [MONTHLY-FIX] len=' + fixed.length + ' oc=' + _ocF + ' cc=' + _ccF);
        fullText = fixed;
      } catch(e) {
        console.error('[callDeepSeek] [MONTHLY-FIX] error:', e.message);
      }
    }
  }

  // ── V154: 清除全角括号（非中文语言）—— 早于final_text_sanitizer处理 ──
  if (lang !== "zh") {
    fullText = fullText.replace(/（/g, "").replace(/）/g, "");
  }

  return fullText;
}


// ── V437: Supabase 凭据加载 —— 环境变量优先，容器文件仅作兜底 ──
// 【为什么改】旧版(V97bd)是「容器文件覆盖环境变量」→ 密钥必须烤进镜像(Dockerfile printf)
//   → 每次轮换都要重新构建镜像，且密钥永久留在镜像层/公开仓库（安全死循环）。
// 【新规则】环境变量优先：Railway 改变量 + Redeploy 即可轮换，零重新打镜像。
//   容器文件只在「无环境变量」时兜底（本地开发 / 旧镜像兼容）。
try {
  const envKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();
  if (envKey.length > 10) {
    process.env.SUPABASE_SERVICE_KEY = envKey;
    console.log('[V437] Supabase key 来源: 环境变量 (len=' + envKey.length + ')');
  } else if (existsSync('/app/.supabase-key')) {
    const k = readFileSync('/app/.supabase-key', 'utf-8').trim();
    if (k.length > 10) {
      process.env.SUPABASE_SERVICE_KEY = k;
      console.log('[V437] Supabase key 来源: 容器文件兜底 (len=' + k.length + ') → 建议改配环境变量');
    }
  }
  const envUrl = String(process.env.SUPABASE_URL || '').trim();
  if (envUrl.length > 10) {
    process.env.SUPABASE_URL = envUrl;
  } else if (existsSync('/app/.supabase-url')) {
    const u = readFileSync('/app/.supabase-url', 'utf-8').trim();
    if (u.length > 10) process.env.SUPABASE_URL = u;
  }
} catch(e) { /* fall through */ }

// https.request 直接处理字节流,不受此限制
async function safeFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const method = options.method || 'GET';
    let bodyBuf;
    if (options.body != null) {
      bodyBuf = options.body instanceof Uint8Array ? Buffer.from(options.body) : Buffer.from(options.body);
    }

    // ── Headers 强制 Latin-1 清洗(防 Key 里混入 ...)──
    const cleanHeaders = {};
    if (options.headers) {
      for (const [hk, hv] of Object.entries(options.headers)) {
        cleanHeaders[sanitizeLatin1(hk)] = sanitizeLatin1(hv);
      }
    }

    // 🛡️ V483d: 带 body 时必须显式设 Content-Length。
    //   旧代码只 `req.write(bodyBuf); req.end()` → Node 自动走 `Transfer-Encoding: chunked`
    //   → Supabase 网关对 chunked 一律 `400 PGRST102 "Empty or invalid json"`(与 body 大小/内容无关)。
    //   2026-09-30 线上实证: writeToCache 永远 status=400 → 缓存表恒空 → HIT 永不命中。
    //   四象限 curl 复现: 小/大 body × Content-Length=201 × chunked=400。
    if (bodyBuf) {
      for (const _hk of Object.keys(cleanHeaders)) {
        const _lk = _hk.toLowerCase();
        if (_lk === 'content-length' || _lk === 'transfer-encoding') delete cleanHeaders[_hk];
      }
      cleanHeaders['Content-Length'] = String(bodyBuf.length);
    }

    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method,
      headers: cleanHeaders,
      rejectUnauthorized: false,
    }, (res) => {
      const chunks = [];
      let ended = false;
      let waiter = null;

      res.on('data', (chunk) => {
        // 🐛V97r-BUG: 曾经 chunks.push(chunk) + waiter 双发,导致每段 text 发两遍
        if (waiter) {
          const w = waiter; waiter = null;
          w({ done: false, value: new Uint8Array(chunk) });
        } else {
          chunks.push(chunk);
        }
      });
      res.on('end', () => {
        ended = true;
        if (waiter) {
          const w = waiter; waiter = null;
          w({ done: true, value: undefined });
        }
      });

      const response = {
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        headers: res.headers,
        body: {
          getReader() {
            let pos = 0;
            return {
              read() {
                if (pos < chunks.length) {
                  return Promise.resolve({ done: false, value: new Uint8Array(chunks[pos++]) });
                }
                if (ended) return Promise.resolve({ done: true, value: undefined });
                return new Promise((r) => { waiter = r; });
              },
            };
          },
        },
        json: async () => {
          if (!ended) await new Promise((r) => res.once('end', r));
          try { return JSON.parse(Buffer.concat(chunks).toString('utf-8')); }
          catch(e) { throw new Error(`safeFetch json parse error: ${e.message}`); }
        },
        text: async () => {
          if (!ended) await new Promise((r) => res.once('end', r));
          return Buffer.concat(chunks).toString('utf-8');
        },
      };

      resolve(response);
    });

    req.on('error', reject);
    if (options.signal) {
      options.signal.addEventListener('abort', () => req.destroy(), { once: true });
    }
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// V238: Railway Edge Proxy 转发到注入的 process.env.PORT(实测 8080)。
// server 必须监听同一 PORT,代理才能命中。HOST 显式 0.0.0.0 供容器外访问。
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
const app = express();

// ═══════════════════════════════════════════════════════════════════════
// ⛔ 时间线强行熔断重组(防 DeepSeek Streaming 污染)

// ═══════════════════════════════════════════════════════════════════════
// V97: 宫位强制纠正器(后端铁血断路器)
// AI 脑子里"白羊=1宫/狮子=5宫/水瓶=11宫"的惯性太深,Prompt 压不住。
// 解决方案:AI 生成后,由后端强制替换,不给穿帮留活路。
// ═══════════════════════════════════════════════════════════════════════
function stripLoneSurrogates(str) {
  if (!str) return str;
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF) {            // 高代理
      const n = str.charCodeAt(i + 1);
      if (n >= 0xDC00 && n <= 0xDFFF) { out += str[i] + str[i + 1]; i++; } // 合法对→保留
      // 否则半截高代理→丢弃
    } else if (c >= 0xDC00 && c <= 0xDFFF) {     // 半截低代理→丢弃
      /* drop */
    } else {
      out += str[i];
    }
  }
  return out;
}

// 🛡️ E23/R11q ④（2026-10-06）：**well-formed 保证** + 可观测告警
//   由来（线上实锤）：文本一旦含**孤立代理项**（半截 emoji），`JSON.stringify` 会产出 `\udc41` 之类
//   非法转义 ⇒ PostgREST(aeson) 拒解析 ⇒ `400 PGRST102 "Empty or invalid json"` ⇒ **写缓存静默失败**
//   ⇒ 该盘永不命中（每次 MISS 全价）。已定位真凶为 `_V480_DECOR` 缺 `u`（见该处注释）并根治；
//   本函数是**同类缺陷的最后一道保证**：把「输出文本必为合法 UTF-16」从「碰巧」升为「不变式」。
//   铁律：① 只删非法码元（`stripLoneSurrogates` 语义），**对合法文本零改动**（可证、已验）；
//        ② **必须告警**（删了就打印）—— 绝不做静默兜底，否则等于掩盖上游新缺陷；
//        ③ 非流式落在 `_finalText`、流式落在 `cleanedText` —— 均在「响应文本与落库文本共用同一字符串」的
//           收敛点**之前**施加 ⇒ E18/R11k「Text(MISS) ≡ Text(HIT) 逐字同源」契约不破。
function _v525WellFormed(tag, text) {
  if (!text || typeof text !== 'string') return text;
  const out = stripLoneSurrogates(text);
  if (out !== text) {
    let n = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      if (c >= 0xD800 && c <= 0xDBFF) { const x = text.charCodeAt(i + 1); if (!(x >= 0xDC00 && x <= 0xDFFF)) n++; }
      else if (c >= 0xDC00 && c <= 0xDFFF) { const p = text.charCodeAt(i - 1); if (!(p >= 0xD800 && p <= 0xDBFF)) n++; }
    }
    console.warn(`[E23/R11q-4][WELLFORMED] ${tag} 剥离孤立代理项 ${n} 个（${text.length}→${out.length} 字）——上游仍在造半代理，请查新增/改动过的「含 emoji 字符类」正则是否缺 u 标志`);
  }
  return out;
}

// V116-Bug4b-fix: 英文星座名 → 中文(报头回归,前置Map + 后置清洗双保险)
function englishSignToChinese(text){
  if(!text)return text;
  const EN_ZH = {
    'Aries':'白羊座','Taurus':'金牛座','Gemini':'双子座','Cancer':'巨蟹座','Leo':'狮子座','Virgo':'处女座',
    'Libra':'天秤座','Scorpio':'天蝎座','Sagittarius':'射手座','Capricorn':'摩羯座','Aquarius':'水瓶座','Pisces':'双鱼座',
    'aries':'白羊座','taurus':'金牛座','gemini':'双子座','cancer':'巨蟹座','leo':'狮子座','virgo':'处女座',
    'libra':'天秤座','scorpio':'天蝎座','sagittarius':'射手座','capricorn':'摩羯座','aquarius':'水瓶座','pisces':'双鱼座'
  };
  let t = text;
  for(const [en,zh] of Object.entries(EN_ZH)){
    t = t.replace(new RegExp('\\b'+en+'\\b','g'), zh);
  }
  return t;
}

// V116-Bug1-fix: 空间宫位模糊匹配(抓关键词前后任意宫位,强制归位到产品固定隐喻)
// 产品固定规则(山子大叔裁决):卧室=第四宫(田宅宫),厨房=第二宫(财帛宫)与第八宫(共享资源),财务室=第八宫(共享资源)
function forceSpaceHouseSanitizer(text){
  if(!text)return text;
  const _ZH_NUM = '一二三四五六七八九十百0-9';
  let t = text;
  // ── 刀1: 行内误写归位 ──────────────────────────────────────────────
  //   ⛔ V485 拆除旧形态(跨行吞并正文, 100% 必现且幂等):
  //      旧: /卧室[^✦]{0,40}?第[N]宫[^\n]{0,20}?/g  —— ✦ 在本体文本中几乎不出现,
  //      故 [^✦] 等价于「任意字符(含换行)」⇒「卧室…」会跨行吃到下一段的
  //      「厨房区域:第二宫」, 把中间整段正文吞掉, 产出线上那种断层:
  //        「…因为卧室区域:第四宫(田宅宫)：你的厨房是你财富滋养的象征」
  //      旧第2/4/6条 /[^\n]{0,20}?(第N宫[^)]{0,12})[^\n]{0,20}?/ 更粗暴(前窗吞20字)。
  //   新形态四重护栏: ① 起手行内 [^\n✦] ② 「关键词」后紧跟「区域」=已规范, 负向回顾跳过
  //                   ③ 尾窗只容许规整的「(宫名)」括号, 不吃后续正文 ④ 结果幂等
  for (const [kw, label] of [
    ['卧室', '卧室区域:第四宫(田宅宫)'],
    ['厨房', '厨房区域:第二宫(财帛宫)与第八宫(共享资源)'],
    ['财务室', '财务室区域:第八宫(共享资源)'],
  ]) {
    t = t.replace(
      new RegExp(kw + '(?!区域)[^\\n✦]{0,20}?第[' + _ZH_NUM + ']{1,3}宫(\\([^)\\n]{0,8}\\))?', 'g'),
      label
    );
  }
  // ── 刀2: 标签归一(收口) ────────────────────────────────────────────
  //   V482 收口条在此(V485 加固); 作用: 同行的「XX区域:…宫…」标签串压回规范写法,
  //   治历史垃圾「卧室区域:第四宫(田宅宫))田宅宫」「厨房区域:…))与第八宫(共享资源)」。
  //   ⛔ V485: 排除列表补上「：」——否则「卧室区域:第四宫(田宅宫)：你的卧室…」
  //   这种同行形态会把「：」之后的正文一并吃掉。
  t = t.replace(/卧室区域\s*[:：]?\s*[^\n，。；、：:*]{0,60}宫[^\n，。；、：:*]{0,60}/g, '卧室区域:第四宫(田宅宫)');
  t = t.replace(/厨房区域\s*[:：]?\s*[^\n，。；、：:*]{0,60}宫[^\n，。；、：:*]{0,60}/g, '厨房区域:第二宫(财帛宫)与第八宫(共享资源)');
  t = t.replace(/财务室区域\s*[:：]?\s*[^\n，。；、：:*]{0,60}宫[^\n，。；、：:*]{0,60}/g, '财务室区域:第八宫(共享资源)');
  return t;
}

// V116-Bug4-fix
function cleanGarbageCharacters(text){if(!text)return text;return text.replace(/\uFFFD/g,'').replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g,'').replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,'').replace(/[\u200B-\u200D\uFEFF]/g,'');}


// ── V152: 标题方括号强制补全（es/fr/th/vi 模板输出丢失 []）──

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ V271: 后端月报输出归一化清洗器——LLM 概率性丢标签，代码兜底补全
// 所有漏标的 Semaine/Semana/Tuần/สัปดาห์ 标题全部强制补全 ✦ 标签
// 在 cleanedText 最终发送前调用，治本而非治标
// ═══════════════════════════════════════════════════════════════════════════
function normalizeReportTags(text, lang) {
  if (!text) return text;

  // Step 1: 清理非法换行符（AI 偶发产生垂直跳格 \x0b）
  text = text.replace(/\x0b/g, '\n');

  // 🛠️ V390-fix: 从源头拦截双重括号——DeepSeek偶发生成[emoji [emoji/text,
  // normalizeReportTags prepend ✦ 时若源文本已含[emoji会变成[emoji [emoji;
  // 修复: 函数入口处直接清除[emoji重复,阻止其进入后续prepend逻辑
  if (['vi','es','fr','th'].includes(lang)) {
    // Pattern A: [emoji [emoji/[[ -> [emoji (递归清除)
    const _v390a = /^(\[[🔴🟢🔵⚠️💎✨⭐🚀📈📉🎯💡🔮✦🔆🔅])\s*\[+[🔴🟢🔵⚠️💎✨⭐🚀📈📉🎯💡🔮✦🔆🔅]?\s*/gm;
    let _p;
    do { _p = text; text = text.replace(_v390a, '$1 '); } while (text !== _p);
    // Pattern B: [emoji [text -> [emoji text (emoji后直接跟[text)
    text = text.replace(/^\[([🔴🟢🔵⚠️💎✨⭐🚀📈📉🎯💡🔮✦🔆🔅])\s*\[([^\]]+)/gm, '[$1 $2');
  }

  // ── 法语归一化 ──────────────────────────────────────────────────
  if (lang === 'fr') {
    // 法语 Semaine 2/3/4 漏标：行首无 ✦ 且含 Semaine N: → 补全标签
    text = text.replace(
      /^(?!✦)([^\n]*Semaine\s+([2-4]):[^\n]*)$/gm,
      (m, rest, weekNum) => {
        const emoji = { '2': '🔴', '3': '🔵', '4': '🟢' }[weekNum] || '🟢';
        return `✦ [${emoji} Semaine ${weekNum}:${rest.replace(/^[^:]+:/, '')}`;
      }
    );
    // 法语小标题漏标兜底（Disjoncteur/Intégration/Explosion）
    if (!/✦.*Semaine\s*2/.test(text) && /Disjoncteur/i.test(text)) {
      text = text.replace(/(Disjoncteur[^\n]*)/i, '✦ [🔴 Semaine 2: Circuit de Haut Risque]\n$1');
    }
    if (!/✦.*Semaine\s*3/.test(text) && /Intégration\s*Stratégique/i.test(text)) {
      text = text.replace(/(Intégration\s*Stratégique[^\n]*)/i, '✦ [🔵 Semaine 3: Intégration Stratégique]\n$1');
    }
    if (!/✦.*Semaine\s*4/.test(text) && /Explosion\s*de\s*Richesse/i.test(text)) {
      text = text.replace(/(Explosion\s*de\s*Richesse[^\n]*)/i, '✦ [🟢 Semaine 4: Explosion de Richesse]\n$1');
    }
    // 财务陷阱漏标
    if (/Pièges\s*Financiers/i.test(text) && !/✦.*Pièges\s*Financiers/.test(text)) {
      text = text.replace(/(Pièges\s*Financiers[^\n]*)/i, '✦ [⚠️ Pièges Financiers: Août 2026] ✦');
    }
  }

  // ── 西班牙语归一化 ──────────────────────────────────────────────
  if (lang === 'es') {
    text = text.replace(
      /^(?!✦)([^\n]*Semana\s+([2-4]):[^\n]*)$/gm,
      (m, rest, weekNum) => {
        const emoji = { '2': '🔴', '3': '🔵', '4': '🟢' }[weekNum] || '🟢';
        return `✦ [${emoji} Semana ${weekNum}:${rest.replace(/^[^:]+:/, '')}`;
      }
    );
    if (/Trampas\s*Financieras/i.test(text) && !/✦.*Trampas\s*Financieras/.test(text)) {
      text = text.replace(/(Trampas\s*Financieras[^\n]*)/i, '✦ [⚠️ Trampas Financieras: Agosto 2026] ✦');
    }
  }

  // ── 泰语归一化 ──────────────────────────────────────────────────
  if (lang === 'th') {
    text = text.replace(
      /^(?!✦)([^\n]*สัปดาห์ที่\s*([2-4])[^\n]*)$/gm,
      (m, rest, weekNum) => {
        const emoji = { '2': '🔴', '3': '🔵', '4': '🟢' }[weekNum] || '🟢';
        return `✦ [${emoji} สัปดาห์ที่ ${weekNum}:${rest.replace(/^[^:]+:/, '')}`;
      }
    );
  }

  // ── 越南语归一化 ────────────────────────────────────────────────
  if (lang === 'vi') {
    text = text.replace(
      /^(?!✦)([^\n]*Tuần\s+([2-4]):[^\n]*)$/gm,
      (m, rest, weekNum) => {
        const emoji = { '2': '🔴', '3': '🔵', '4': '🟢' }[weekNum] || '🟢';
        return `✦ [${emoji} Tuần ${weekNum}:${rest.replace(/^[^:]+:/, '')}`;
      }
    );
  }

  // ── 全语种兜底：检测到 4 个 Semaine/Semana 段落但缺少对应 ✦ 标签时强制注入 ──
  const weekCount = (text.match(/(?:Semaine|Semana|Tuần|สัปดาห์ที่)\s*[2-4]/gi) || []).length;
  const tagCount = (text.match(/✦.*(?:Semaine|Semana|Tuần|สัปดาห์ที่)\s*[2-4]/gi) || []).length;
  if (weekCount > 0 && tagCount < weekCount) {
    // 强制修复：遍历全文，把所有漏标的周标题行前面注入 ✦
    text = text.replace(
      /^((?:(?!✦).)*(?:Semaine|Semana|Tuần|สัปดาห์ที่)\s*([2-4])[:\s][^\n]*)$/gim,
      (m) => {
        // 已在上面逐语种处理过了，这里只做兜底不做重复替换
        return m;
      }
    );
  }

  return text;
}

function fixSectionBrackets(text, lang) {
  if (!['es','fr','th','vi'].includes(lang)) return text;
  // 🛠️ V392-fix: NFC Unicode 标准化（入口）——根治 NFD 分解形态导致单词内被插空格
  text = (text || '').normalize('NFC');
  // ── V155: 跨语言 week 词纠正（fr/es 同源易混 Semaine/Semana，LLM 偶发串味）──
  if (lang === 'fr') text = text.replace(/Semana/gi, 'Semaine');
  if (lang === 'es') text = text.replace(/Semaine/gi, 'Semana');
  // ── V157: ✦ 标题行归一化（LLM 偶发加 ** 加粗 + 双 [[ + 结尾 **] 错配）──
  // 例：✦ **[[Semana 1: Jul 1–7] Recarga de Riqueza**] → ✦ [Semana 1: Jul 1–7] Recarga de Riqueza
  const HEADER_KEY_RE = /(Visi[oó]n General|Sombra Financiera|Semana \d|Aper[çc]u|Th[eè]me Cosmique|Ombre Financi[eè]re|Semaine \d|ภาพรวม|สัปดาห์ที่ \d|เงาการเงิน|Tổng quan|Tuần \d|Bóng Tài chính)/i;
  // V171: 行首锚定版——仅当标题词出现在行首才视为标题,避免正文提及สัปดาห์ที่ 3等被误套[]
  const HEADER_START_RE = new RegExp('^(' + HEADER_KEY_RE.source + ')', 'i');
  // 通用：单独成行的裸标题关键词 → 补 []
  const lines = text.split('\n');
  const fixed = lines.map(line => {
    const t = line.trim();
    // 1) 裸露标题行（不以 [/*/✦/# 开头）→ 补 []
    if (t && !t.startsWith('[') && !t.startsWith('*') && !t.startsWith('✦') && !t.startsWith('#')) {
      if (HEADER_START_RE.test(t) && !t.startsWith('[')) return '[' + t + ']';
      return line;
    }
    // 1.5) ## 或 ### 开头的 Markdown 标题行 → 剥 ## 后按 ✦ 开头处理
    if (/^##+\s/.test(t) && HEADER_KEY_RE.test(t)) {
      let s = line.replace(/^##+\s*/, ''); // 剥 ##/###
      s = s.replace(/\*\*/g, '');         // 剥加粗
      s = s.replace(/\[\[+/g, '[').replace(/\]\]+/g, ']');
      if (!s.includes('[')) {
        // 越南语(## 分支,已剥 ##): 兼容 '1–7/7'(无空格/带/M月份) 与 'Thg7 1–7'(有空格) 两种 LLM 非确定性输出
        s = s.replace(/(Tuần\s*\d+\s*:\s*[^\n]*?)\**\s*(?=\s+[A-ZÀ-ÿ]|\n|$|\])/, '✦ [$1] ');
        s = s.replace(/✦\s+(Tổng quan)/, '✦ [$1]');
        s = s.replace(/✦\s+(Bóng Tài chính)/, '✦ [$1]');
        // 泰文(## 分支,已剥 ##): 同 ✦ 分支逻辑,兜底 ## 前缀的泰文标题
        s = s.replace(/(สัปดาห์ที่\s*[๑๒๓๔\d]+\s*:\s*[^\n]*?)\**\s*(?=\s+[ก-๙]|\n|$|\])/, '✦ [$1] ');
        s = s.replace(/(ภาพรวม|เงาการเงิน)/, '✦ [$1]');
      }
      return '## ' + s;
    }
    // 2) ✦ 开头的标题行 → 剥 **、折叠 [[、修结尾 ] 错配、补缺失的 []
    if (t.startsWith('✦') && HEADER_KEY_RE.test(t)) {
      let s = line.replace(/\*\*/g, '');                       // 剥 markdown 加粗
      s = s.replace(/\[\[+/g, '[').replace(/\]\]+/g, ']');   // 折叠双括号
      if (!s.includes('[')) s = s.replace(/\s*\]+$/, '');                 // 删结尾错配 ]（来自 **]，但放过已平衡的 [..] 标题）
      s = s.replace(/^✦\s*\[+/, '✦ [');                        // 规范化 ✦ [ 前缀
      // V159-fix: ✦ Semana 1: Jul 1–7 Recarga de Riqueza → ✦ [Semana 1: Jul 1–7] Recarga de Riqueza
      // V159-fix-vi: ✦ Tuần 1: Thg7 1–7 — Nạp năng lượng Tài sản → ✦ [Tuần 1: Thg7 1–7] Nạp năng lượng Tài sản
      if (!s.includes('[')) {
        // 泰文(✦ 分支): 兼容 '1–7 ก.ค. —'(em-dash 标题分隔) 与 '1–7/7' 等 LLM 非确定性格式; 已平衡标题跳过避免重复套[]
        s = s.replace(/(✦\s*)?\**\s*(สัปดาห์ที่\s*[๑๒๓๔\d]+\s*:\s*[^\n]*?)\**\s*(?=\s+[ก-๙]|\n|$|\])/, '✦ [$2] ');
        s = s.replace(/✦\s+(ภาพรวม)/, '✦ [$1]');
        s = s.replace(/✦\s+(เงาการเงิน)/, '✦ [$1]');
        // 西班牙语
        s = s.replace(/✦\s+(Semana\s*\d+\s*:\s*[^\n]+?)\s+(?=[A-ZÁÉÍÓÚÑ])/, '✦ [$1] ');
        s = s.replace(/✦\s+(Visi[oó]n General)/, '✦ [$1]');
        s = s.replace(/✦\s+(Sombra Financiera)/, '✦ [$1]');
        // 越南语(✦ 分支): 兼容 '1–7/7**'(无空格+**加粗) 与 'Thg7 23–31'(有空格) 与 '** [Tuần 3: 15–22/7**]'(双括号+加粗) 所有 LLM 非确定性变体
        s = s.replace(/(✦\s*)?\**\s*(Tuần\s*\d+\s*:\s*[^\n]*?)\**\s*(?=\s+[A-ZÀ-ÿ]|\n|$|\])/, '✦ [$2] ');
        s = s.replace(/✦\s+(Tổng quan)/, '✦ [$1]');
        s = s.replace(/✦\s+(Bóng Tài chính)/, '✦ [$1]');
      }
      return s;
    }
    return line;
  });
  // V378-fix: 双重括号清洗——[emoji [emoji title...] → [emoji title...]
  // LLM 偶发生成 [emoji [emoji title...] 双重嵌套，前端 \n✦ 分割时会额外产生空/碎段
  if (['th','vi','es','fr'].includes(lang)) {
    // Pattern: [emoji [emoji ... → [emoji ... (递归清除双重括号)
    const _dRe = /^(\[[🟢🟡🟠🟣🔴🔵⚠️🔮💎✨⭐🚀📈📉🎯💡🔆🔅]\s*)\s*\[/gm;
    let _prev;
    do { _prev = text; text = text.replace(_dRe, '$1'); } while (text !== _prev);
    // Pattern: 孤立 ⚠ 行后紧跟 [⚠️ ... → 合并为一行 [⚠️ ...
    text = text.replace(/^⚠\s*$(?:\n)(\[⚠️[^\n\[]+)/gm, '$1');
  }

  // 🛠️ V389-fix: [emoji [text 双重括号（emoji后直接跟[text，非[emoji [emoji）
  // 处理: [🔵 [Tuần 3:...] → [🔵 Tuần 3:...]  (后端补全后残留，扩展V378覆盖)
  if (['vi','es','fr','th'].includes(lang)) {
    const _d2Re = /^\[([🔴🟢🔵⚠️💎✨⭐🚀📈📉🎯💡🔮✦🔆🔅])\s*\[([^\]]+)/gm;
    let _prev2;
    do { _prev2 = text; text = text.replace(_d2Re, '[$1 $2'); } while (text !== _prev2);
  }

  return fixed.join('\n');
}

// ── V158: 月报空括号/孤儿标点清洗（军师审计:1993-10-18牛津中文报告空括号大爆发）──
// 根因:月报路径跳过 final_text_sanitizer(V149仅在该函数内,且只删"孤儿"括号),
// 成对空括号（）被栈校验视为合法放行。本函数专门治理月报空括号/嵌套/孤儿标点。
function cleanMonthlyBrackets(text, lang = 'zh') {
  if (!text) return text;
    // ── V222q: 中文周标题拆行 + 补方括号兜底(LLM 丢括号/粘行时前端不渲染金色标题)──
    if (lang === 'zh') {
      // 1. 行内标题拆行: "……正文。✦ 🔴 第2周：8月8日–14日（高危熔断）" → 拆出独立标题行
      text = text.replace(/([^\n])(✦\s*(?:🟢|🔴|🔵)\s*第[一二三四1-4]周)/g, '$1\n$2');
      // 2. 独占行裸标题补方括号: "✦ 🔴 第2周：8月8日–14日（高危熔断）" → "✦ [🔴 第2周：8月8日–14日（高危熔断）]"
      text = text.split('\n').map(ln => {
        const t = ln.trim();
        if (/^✦\s*(?:🟢|🔴|🔵)\s*第[一二三四1-4]周/.test(t) && !t.includes('[') && !t.includes(']')) {
          return '✦ [' + t.replace(/^✦\s*/, '').trim() + ']';
        }
        return ln;
      }).join('\n');
      // 3. overview 裸标题补括号: "✦ 🔮 本月命运主题 ✦" → "✦ [🔮 本月命运主题] ✦"
      text = text.replace(/✦\s*🔮\s*本月命运主题\s*✦?/g, '✦ [🔮 本月命运主题] ✦');
    }
    // step0: 中文周标题补[] (emoji开头: 🟢 第1周...)
    if (lang === 'zh') {
      const _dbgLines = text.split('\n').filter(l => /周/.test(l) && /第[一二三四1-4]/.test(l));
      console.log('[STEP0-DEBUG] lang=zh weekLines=', JSON.stringify(_dbgLines.slice(0,4)));
    }
    // V383: 删除未使用的 _stripEmoji(原会剥🔮)，备用注释
    text = text.split('\n').map(ln => {
    const t = ln.trim();
    // ── 先处理特殊内容，再判断括号 ──
    // 消费陷阱：[消费陷阱 2026年7月] → [⚠️ 消费陷阱：2026年7月]
    // V184-fix: 必须在 startsWith('[') 判断之前检查，否则会被放行
    if (/消费陷阱/.test(t)) {
      // 🛡️ V446-trap2: 先剥外层 ✦ 信封，识别「已带 ✦ … ✦ 前后缀」的规范形态（幂等）。
      //   否则规范标题 ✦ [⚠️ 消费陷阱：X] ✦ 会被当裸标题再套一层 → ✦\n[✦ [⚠️ 消费陷阱：X] ✦]（尾部多 ] 回归）。
      const _trapLine = t.replace(/^✦\s*/, '').replace(/\s*✦\s*$/, '').trim();
      //   仅当陷阱标题处于行首才按标题归一；正文中提及「消费陷阱」的行原样放行（防并段后整段被套框）
      if (_trapLine.startsWith('[') || /^⚠️?\s*消费陷阱/.test(_trapLine)) {
        if (_trapLine.startsWith('[')) {
          // [消费陷阱 2026年7月] → 消费陷阱 2026年7月
          let inner = _trapLine.replace(/^\[+\s*/, '').replace(/\s*\]+$/, '');
          inner = inner.replace(/消费陷阱\s*([：:]?)\s*/g, '消费陷阱：').replace(/^⚠️?\s*/, '');
          if (!/⚠/.test(inner)) inner = '⚠️ ' + inner;
          return '✦\n[' + inner + ']';  // 🛠️ V187: 加 ✦ 分隔符
        } else {
          // 消费陷阱 2026年7月 → [⚠️ 消费陷阱：2026年7月]
          let normalized = _trapLine.replace(/消费陷阱\s*([：:]?)\s*/g, '消费陷阱：').replace(/^⚠️?\s*/, '');
          if (!/⚠/.test(normalized)) normalized = '⚠️ ' + normalized;
          return '✦\n[' + normalized + ']';  // 🛠️ V187: 加 ✦ 分隔符
        }
      }
    }
    
    // 已带 [ ] 的标题直接放行（幂等）——但先清理多余括号
    if (t.startsWith('[[')) {
      // [[ 本月命运主题]] → [🔮 本月命运主题]
      const cleaned = t.replace(/^\[\[\s*/, '[').replace(/\s*\]\]$/, ']');
      // 如果没有 emoji，加上 🔮
      if (!/[✦🔮]/.test(cleaned)) return '[🔮 ' + cleaned.slice(1);
      return cleaned;
    }
    if (t.startsWith('[')) return ln;
    return ln;
    }).join('\n');
  // 1. 周标题空括号: 第2周 2026年7月（）高危熔断 → 第2周 2026年7月（高危熔断）
  text = text.replace(/(第[一二三四1-4]周[^\n]{0,18}?)（）([^）\n]*?)）/g, '$1（$2）');
  text = text.replace(/(第[一二三四1-4]周[^\n]{0,18}?)（）([^）\n]*)/g, '$1（$2）');
  // 2. 嵌套空括号: 第八宫（）共享资源） → 第八宫（共享资源）
  text = text.replace(/（）([^）\n]*?）)/g, '（$1）');
  // 3. 孤儿顿号/逗号紧挨右括号: （如伴侣收入、遗产、） → （如伴侣收入、遗产）
  text = text.replace(/[、，,](?=）)/g, '');
  // 4. 残留空括号兜底: （） → 删除
  text = text.replace(/（）/g, '');
  text = text.replace(/\(\s*\)/g, '');
  // 5. 多余右括号折叠
  text = text.replace(/）\s*）/g, '）');
  text = text.replace(/\)\s*\)/g, ')');
  // 6. 介词补缺: "X座的水瓶座冥王星" → "X座，与水瓶座冥王星"(LLM 偶漏"与")
  text = text.replace(/([座])的(白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|射手座|摩羯座|水瓶座|双鱼座)/g, '$1，与$2');
  // 7. 周标题标签括号错位: （顺）流蓄力 → （顺流蓄力）(LLM 偶将闭括号提前)
  text = text.replace(/(第[一二三四1-4]周[^\n]{0,18}?)（([充富高危顺流蓄爆熔发]{1,3})）([充富高危顺流蓄爆熔发]{1,4})/g, '$1（$2$3）');
  // 8. 正文内部误入方括号（西/法/英/泰/越通用）: 移除非行首的方括号
  //    保留行首标题格式 [Visión General]/[Semana 1]/[Semaine 1] 等
  const lines = text.split('\n');
  text = lines.map(line => {
    const t = line.trim();
    if (t.startsWith('[') || t.startsWith('✦ [') || t.startsWith('* [') || t.startsWith('# [') || t.startsWith('- [')) {
      return line; // 行首标题保留
    }
    // 正文内部方括号：[xxx] → xxx
    return line.replace(/\[([^\[\]]+?)\]/g, '$1');
  }).join('\n');
  // 9. 越南语水逆时间轴纠正（军师审计:V145越南语样本水星顺逆倒错）
  // 第1周错误写“水星顺行”→纠正为“水星逆行”
  // 第2周错误写“水星开始逆行”→纠正为“水星逆行持续”
  // 正确时间轴:7月上旬水星巨蟹座逆行,7月24日恢复顺行
  // ── V172: 天文度数硬锁（中文月报）──
  // 两星座间隔的相位度数必须真实：处女座(5)与白羊座(0)相隔5座=150度梅花相位，绝非90度四分相。
  // 若 LLM 写的度数 ≠ 实际星座间隔度数，纠正为真实度数（若该间隔无标准相位则剥离度数词）。
  if (lang === 'zh') {
    const _ZH_SIGN = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
    const _SEP2DEG = {0:0,1:30,2:60,3:90,4:120,5:150,6:180};
    const _degRe = new RegExp('(' + _ZH_SIGN.join('|') + ')[^。\n]{0,18}?与[^。\n]{0,18}?(' + _ZH_SIGN.join('|') + ')[^。\n]{0,12}?(\\d+)度', 'g');
    text = text.replace(_degRe, (m, sa, sb, nd) => {
      const ia = _ZH_SIGN.indexOf(sa), ib = _ZH_SIGN.indexOf(sb);
      if (ia < 0 || ib < 0 || !nd) return m;
      const sep = Math.min(Math.abs(ia - ib), 12 - Math.abs(ia - ib));
      const realDeg = _SEP2DEG[sep] || 0;
      if (realDeg === 0) return m;           // 同座/合相不处理
      if (Number(nd) === realDeg) return m;  // 度数已正确，放过
      const tok = nd + '度';
      const idx = m.lastIndexOf(tok);
      if (idx < 0) return m;
      // 纠正为真实度数（如 90度→150度）；若该间隔无标准相位则剥离"N度"
      return realDeg > 0 ? (m.slice(0, idx) + realDeg + '度' + m.slice(idx + tok.length)) : m.replace(tok, '');
    });
  }
  // 🛠️ V188: 括号崩塌兜底(军师审计: 冥）王星 / 第11）宫 等错位右括号)
  // 只删夹在中文/数字之间的错位右括号,绝不误伤合法 (第X宫)
  text = text.replace(/([\u4e00-\u9fff0-9])）([\u4e00-\u9fff])/g, '$1$2');
  return text;
}

// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V477: CJK 守恒守卫 —— 清洗链"吃字"自动拦截(末日兜底)
// 背景: 2026-09-29/30 年报多次出现汉字被大面积吞掉(先知神谕→先神),先后查出
//   final_text_sanitizer:1619、stream 收尾块 10389 两处"空捕获组"坏正则。
//   这类坏正则的共同签名 = 清洗后 CJK 断崖式下跌。本守卫把"守恒"变成硬约束:
//   任何一段文本经清洗后 CJK 存活 < 90%,即判定为坏正则吃字,直接回滚为清洗前原文,
//   宁可少清洗,绝不吐缺字稿。所有清洗入口统一挂此守卫。
// ═══════════════════════════════════════════════════════════════════════
function _v477CjkCount(s) {
  return (String(s || '').match(/[\u4e00-\u9fff]/g) || []).length;
}
function _v477Guard(original, cleaned, tag) {
  const a = _v477CjkCount(original), b = _v477CjkCount(cleaned);
  // 阈值说明: 流式块 CJK 数十~百量级,故门槛定在 24(CJK 文本片段);
  // 正常清洗只删括号/标点残片(汉字损失 <5%),故 10% 存活跌幅已属"吃字"。
  if (a >= 24 && b < a * 0.9) {
    console.error(`[V477-GUARD] ${tag} 清洗链吃字: CJK ${a}→${b} (-${((1 - b / a) * 100).toFixed(1)}%), 已回滚为清洗前原文`);
    return original;
  }
  return cleaned;
}

function final_text_sanitizer(text, lang_asc = 'Cancer', lang = 'zh') {
  if (!text) return text;


  // ── V97ab: 清除 AI 幻觉 [object Object](只删脏数据,不伤正常星座词)──
  // V103-fix7: 用 / {2,}/g 替代 /\s{2,}/g,只折叠多个空格,保留换行符不伤段落结构
  text = text.replace(/\[object Object\]/g, ' ').replace(/ {2,}/g, ' ');

  // ── V97ap: 清除渲染失败的乱码方块(U+FFFD 和空 Emoji 占位)──
  text = text.replace(/�/g, '').replace(/\uFFFD/g, '').replace(/ {2,}/g, ' ');

  // ── V120-fix: 清理军师审计发现的空括号污染(AI 变量填充残留)──
  text = text.replace(/()/g, '').replace(/\(\)/g, '');
  // 🛠️ V122-fix: 跨块残留空括号(流式拆块时 "第N宫" 与 "(XX座)" 分离,
  //   每块单独处理会留下 "第五宫" 后面跟 "()狮子座" 或 "(英文)中文" 错位)
  // 解决:删除 "任意中文" + 孤立左括号 + 英文/中文 + 孤立的 ")" 后接 "中文" 的组合
  // 例1: 第五宫()狮子座 → 第五宫狮子座
  // 🛡️ V476-fix: 原式的中间两个小括号未转义(形如"汉字组+空括号组+汉字组"),
  //    () 退化为【空捕获组】→ 实际语义=任意相邻两汉字只留第一个 → 全文 CJK 被杀 53.9%
  //    (V475 夜 Oslo/1989 盘缺字毒化真凶,隔离复现 10522→5635)。补上 \( \) 转义。
  text = text.replace(/([\u4e00-\u9fa5])\(\)([\u4e00-\u9fa5])/g, '$1$2');
  // 例2: (Jupiter Return)开启 → 开启 (首尾孤立括号包裹英文,被嵌入中文段落)
  text = text.replace(/[((][A-Za-z][A-Za-z0-9 ,.'":;\-]{0,40}?[))](?=[\u4e00-\u9fa5])/g, '');
  // 例3: 末尾有 "(" 但无配对 ")"(流式块被截断),等待下一块配对;当前块先不处理
  //   这条会导致脏输出但跨块时由后处理块清理

  // ── V120-fix3: 月报括号鬼魂专项清洗（军师审计：DeepSeek 流式吐字畸变）──
  // 1. 删除孤立「（你的）」碎片（AI 偶发插入的废括号）
  text = text.replace(/（你的）/g, '');
  // 2. 修复「（共享）资源）」→「（共享资源）」（括号在词中断裂）
  text = text.replace(/（共享）资源/g, '（共享资源）');
  // 3. 修复「金星命官）」缺左括号 →「（金星命官）」
  text = text.replace(/([\u4e00-\u9fa5]{1,3}\u547d\u5b98\uFF09)/g, '\uFF08$1');
  // 4. 修复「（第22）-31日）」→「（第22-31日）」
  text = text.replace(/\uFF08第(\d{1,2})\uff09-(\d{1,2}\u65e5\uFF09)/g, '\uFF08第$1-$2');
  // 5. 折叠双右括号 ））→ ）
  text = text.replace(/\uFF09+/g, '\uFF09');
  // 6. 折叠双左括号 （（→ （
  text = text.replace(/\uFF08+/g, '\uFF08');

  // ── V97ar: 清理隐身脏字符(Emoji 变体选择符/零宽字符/不可见 Unicode)──
  // ── V100r: 清理模板污染残留(军师审计:AI将互联网金句与章节标记混合)──
  // ── V100r: 清理互联网金句与章节标记混合污染(军师2026-07-12审计发现)──
  // 直接字符串替换,避免regex转义问题
  if (text.includes('Do not compare your') && text.includes('Chapter 1') && text.includes('Chapter 20')) {
    text = text.replace(/Do not compare your[\s\S]{10,250}?Chapter \d+[\s\S]{5,100}?Chapter \d+/gi,
      'Do not compare your Chapter 1 to someone else\'s Chapter 20. Your foundation is being laid.');
  }

  // ── V101a: 清理灵性毒鸡汤模板词(军师2026-07-12审计:金融神谕禁塞"前世")──
  // 金融报告调性=硬核风控,禁止 past lives / karma 等地摊占卜词
  text = text
    .replace(/,?\s*(and\s+)?from\s+past lives\b/gi, '')
    .replace(/,?\s*(y|and)?\s*(de\s+)?vidas pasadas\b/gi, '')
    .replace(/,?\s*(et\s+)?de\s+vies antérieures\b/gi, '')
    .replace(/[,、]?\s*甚至前世\b/g, '')
    .replace(/[,、]?\s*来自前世\b/g, '');
  // U+200B → 零宽空格,U+FEFF → BOM,U+200D → 零宽连字
  text = text.replace(/[\u200B-\u200D\uFEFF\uFFFE\uFFF0-\uFFFF]/g, ''); // V383-fix: 保留 U+FE0F (Variation Selector-16)，emoji🔮显示必需

  // ── V97aq: 12个月太阳星座全面校订(防止AI把本命太阳写成流年太阳)──
  // 流年太阳按公历月份固定:7月巨蟹、8月狮子...6月双子
  text = text
    .replace(/(2026年7月[::]\s*)太阳(?!巨蟹)[^座\n]*座/g, '$1太阳巨蟹座')
    .replace(/(2026年8月[::]\s*)太阳(?!狮子)[^座\n]*座/g, '$1太阳狮子座')
    .replace(/(2026年9月[::]\s*)太阳(?!处女)[^座\n]*座/g, '$1太阳处女座')
    .replace(/(2026年10月[::]\s*)太阳(?!天秤)[^座\n]*座/g, '$1太阳天秤座')
    .replace(/(2026年11月[::]\s*)太阳(?!天蝎)[^座\n]*座/g, '$1太阳天蝎座')
    .replace(/(2026年12月[::]\s*)太阳(?!射手)[^座\n]*座/g, '$1太阳射手座')
    .replace(/(2027年1月[::]\s*)太阳(?!摩羯)[^座\n]*座/g, '$1太阳摩羯座')
    .replace(/(2027年2月[::]\s*)太阳(?!水瓶)[^座\n]*座/g, '$1太阳水瓶座')
    .replace(/(2027年3月[::]\s*)太阳(?!双鱼)[^座\n]*座/g, '$1太阳双鱼座')
    .replace(/(2027年4月[::]\s*)太阳(?!白羊)[^座\n]*座/g, '$1太阳白羊座')
    .replace(/(2027年5月[::]\s*)太阳(?!金牛)[^座\n]*座/g, '$1太阳金牛座')
    .replace(/(2027年6月[::]\s*)太阳(?!双子)[^座\n]*座/g, '$1太阳双子座');

  // ── V97m2: 火星/凯龙/北交点主动过滤(validator 已校验,但 AI 重试仍犯,只能强洗)──
  // 删除整句含"火星在XX座"或"火星在第X宫"的句子(黑天鹅日描述火星相位冲突)
  text = text
    .split('\n')
    .filter(line => {
      // 🛠️ V102t: 停用火星整行删除--星座+相位是真天文(不依赖出生时间),只有宫位号穿帮。
      // 宫位号交由下方 V102s 降维单独砍除,保留完整黑天鹅内容(星座/相位/日期)。
      return true;
    })
    .join('\n');

  // ── V102s: 行内"非锁定行星"宫位降维 ──
  // 只砍火星/天王/海王/水星/金星在正文里瞎写的宫位号(保留星座);太阳/月亮/木星/土星/冥王的锁定宫位绝不碰。
  // 中文:行星+在+X座+第N宫 → 保留"行星在X座",砍宫位
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)(在[\u4e00-\u9fa5]{1,3}座)第[一二三四五六七八九十百零\d]+宫/g, '$1$2');
  // 中文:行星+在(你/您)的+第N宫(无星座)→ 砍"在...第N宫"
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)在[\u4e00-\u9fa5你您]{0,6}?第[一二三四五六七八九十百零\d]+宫/g, '$1');
  // 中文兜底:行星+任意描述(逆行/发生在你的/四分相等动词引导)+第N宫 → 砍宫位(补 V102s 仅要求紧接"在"的缺口,覆盖动词引导句式)
  // 🛠️ V106-fix2: 原 [^。\n]{0,20}? 会吞掉外层闭合括号里的 ) ,导致相位句出现无头)
  // 修复:加 ) 到禁止字符集,确保匹配在括号对边界停止
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)[^\uff09\u3002\n)]{0,20}?第[一二三四五六七八九十百零0-9]+宫/g, '$1');
  // 🛠️ V106-fix2b: 上述替换后若句中出现"行星)第N宫("(内层括号被连宫位一起删),补闭合并清星座
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)）（第[一二三四五六七八九十百零0-9]+宫）/g, '$1$2');
  // 🛠️ Issue B 终级 fix: 贪婪捕获"在你的第N宫(XX座)"型复杂嵌套句式 → 砍宫位+括号内星座,保留行星和"在你的"引导
  // 匹配:火星在你的第3宫(处女座)、水星在第5宫(狮子座)、冥王星在你的第12宫(水瓶座)等所有变体
  // 🛡️ V476-fix: 原第一支 (([^)]+座) 漏转义字面括号 → 实际匹配「第N宫+任意非)串+座」,
  //    从每个"第N宫"吞文本直到下一个"座"——正文 83% 汉字被杀(V475 夜 Oslo 盘实锤)。
  //    收紧为必须字面括号:第N宫(XX座) 才砍。
  text = text.replace(/(行星|[\u4e00-\u9fa5星曜]+星?)(在你|在他|在她|在|的)(第[一二三四五六七八九十百零0-9]+宫)\(([^)]+)座\)/g, '$1$2$3');
  // 🛠️ Issue B 兜底:"第N宫(XX座)"仍在句中 → 砍括号内星座(保留第N宫描述,但括号内星座必删,因与本命冲突)
  // 🛡️ V476-fix: 原 L1699 同款漏转义(整条删除);本行已是正确转义版,保留。
  text = text.replace(/第([一二三四五六七八九十百零0-9]+)宫\(([^)]+)座\)/g, '第$1宫');
  // 🛠️ Issue B 兜底:行星+你的+第N宫(无括号)→ 砍"你的第N宫"保留行星
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)在你的第[一二三四五六七八九十百零0-9]+宫/g, '$1');
  // 英/西/法:Planet [in Sign] + House/Casa/Maison N → 保留 Planet in Sign
  text = text.replace(/\b(Mars|Uranus|Neptune|Mercury|Venus|Chiron)(\s+in\s+[A-Z][a-z]+)?(\s*(?:\(|,|\bin\b)?\s*(?:the\s+)?(?:\d+(?:st|nd|rd|th)\s+House|House\s+\d+|Casa\s+\d+|Maison\s+\d+)\)?)/g, '$1$2');
  // 泰:ดาว... + ภพที่/เรือนที่ N
  text = text.replace(/(ดาวอังคาร|ดาวยูเรนัส|ดาวเนปจูน|ดาวพุธ|ดาวศุกร์)([^\n]{0,12}?)(?:ภพที่|เรือนที่)\s*\d+/g, '$1$2');
  // 越:Sao Hỏa/Thiên Vương/Hải Vương/Thủy/Kim + Nhà N
  text = text.replace(/(Sao Hỏa|Sao Thiên Vương|Sao Hải Vương|Sao Thủy|Sao Kim)([^\n]{0,12}?)\s*Nhà\s*\d+/g, '$1$2');
  // 降维收尾:仅合并多余空格(不碰换行,保护 markdown 段落)
  text = text.replace(/ {2,}/g, ' ');

  // ── 通用宫位纠正(治本:按实际上升星座算 Equal House,替代写死 Cancer 映射)──
  // 旧逻辑只对 Cancer 生效且写死映射,导致非 Cancer 用户被错误纠正(如摩羯用户白羊被纠成第10宫)。
  // 🛠️ V471-fix: 形参名是 lang_asc,旧代码误引 ascendant → ReferenceError 'ascendant is not defined',
  //    年报收尾崩溃直接吐给前端;月报链路被 try-catch 静默吞掉导致 sanitize 链整体失效。统一改用 lang_asc。
  const houseMap = getSignToHouseMap(lang_asc);
  if (houseMap) {
    const fixes = [
      { sign: '狮子座', h: houseMap[SIGN_ORDER_ZH.indexOf('狮子座')] },
      { sign: '白羊座', h: houseMap[SIGN_ORDER_ZH.indexOf('白羊座')] },
      { sign: '水瓶座', h: houseMap[SIGN_ORDER_ZH.indexOf('水瓶座')] },
    ];
    for (const f of fixes) {
      text = text.replace(new RegExp(`第([一二三四五六七八九十百零\d]+)宫(${f.sign})`, 'g'), `第${f.h}宫(${f.sign})`);
      text = text.replace(new RegExp(`${f.sign}在第(\d+)宫`, 'g'), `${f.sign}在第${f.h}宫`);
    }
  }
  const R = (pattern, replacement, flags = 'gi') => {
    text = text.replace(new RegExp(pattern, flags), replacement);
  };

  if (lang_asc === 'Cancer') {
    // ── 木星在狮子座 = 第2宫(财帛宫)── AI 错写成第5宫 ──
    R('第5宫(狮子座)', '第2宫(狮子座)');
    R('第5宫(Leo)', '第2宫(狮子座)');
    R('第5宫(leo)', '第2宫(狮子座)');
    R('第5宫狮子座', '第2宫(狮子座)');
    R('第5宫的狮子座', '第2宫的狮子座');
    R('进入你命盘的第5宫(狮子座)', '进入你命盘的第2宫(狮子座)');
    R('进入第5宫(狮子座)', '进入第2宫(狮子座)');
    R('木星入第5宫(狮子座)', '木星入第2宫(狮子座)');
    R('木星进入第5宫(狮子座)', '木星进入第2宫(狮子座)');
    R('木星在第5宫(狮子座)', '木星在第2宫(狮子座)');
    R('狮子座在第5宫', '狮子座在第2宫');

    // 上下文清洗(因宫位错写产生的错误联想)
    text = text.replace(/投机项目或创意事业/g, '正财项目或核心资产提升');
    text = text.replace(/恋爱、投机、子女/g, '正财、现金流、资产增值');
    text = text.replace(/创造力、领导力/g, '财富掌控力、资产管理');
    text = text.replace(/舞台中央的王者/g, '财富舞台的掌控者');
    text = text.replace(/无与伦比的创造力/g, '无与伦比的财富吸引力');
    text = text.replace(/个人魅力的展现/g, '财运的展现');
    text = text.replace(/创造性的自我表达/g, '物质财富的创造与变现');

    // ── 土星在白羊座 = 第10宫(官禄宫)── AI 错写成第1宫 ──
    R('第1宫(白羊座)', '第10宫(白羊座)');
    R('第1宫(Aries)', '第10宫(白羊座)');
    R('第1宫白羊座', '第10宫(白羊座)');
    R('盘踞在你.*第1宫(白羊座)', '盘踞在你的第10宫(白羊座)');
    R('盘踞在你的第1宫(白羊座)', '盘踞在你的第10宫(白羊座)');
    R('进入第1宫(白羊座)', '进入第10宫(白羊座)');
    R('土星入第1宫(白羊座)', '土星入第10宫(白羊座)');
    R('土星在第1宫(白羊座)', '土星在第10宫(白羊座)');

    // V103-fix16: 处女座归风元素--AI 幻觉把处女座(土象)归入风元素,正则物理矫正
    R('风元素\\(处女座', '土元素(处女座');  // V476-fix: 双反斜杠——单 \( 会被字符串转义吞成裸括号 → 运行时 Unterminated group(太阳巨蟹盘直接崩)
    R('风元素路径:处女座', '土元素路径:处女座');

    // 上下文清洗
    text = text.replace(/"自我身份"正在经历一场残酷的锻造/g, '事业天花板与顶头上司的残酷施压');
    text = text.replace(/土星在第一宫的压力/g, '土星在第十宫的压力');
    text = text.replace(/疯狂的扩张/g, '事业领域的深度耕耘');
    text = text.replace(/在"创造性的自我表达"与"严苛的自我约束"/g, '在"职场晋升与外部责任"之间');
    text = text.replace(/贪多嚼不烂/g, '野心过大而执行力不足');

    // ── 冥王星在水瓶座 = 第8宫(疾厄宫)── AI 错写成第11宫 ──
    R('第11宫(水瓶座)', '第8宫(水瓶座)');
    R('第11宫(Aquarius)', '第8宫(水瓶座)');
    R('第11宫(aquarius)', '第8宫(水瓶座)');
    R('第11宫水瓶座', '第8宫(水瓶座)');
    R('冥王星在第11宫(水瓶座)', '冥王星在第8宫(水瓶座)');
    R('冥王星入第11宫(水瓶座)', '冥王星入第8宫(水瓶座)');

    // 上下文清洗
    text = text.replace(/人际圈层、社会资源与集体财富/g, '深度共同资产、税务与遗产规划');
    text = text.replace(/人际圈层、社会资源/g, '深层共有财富、税务与债务');
    text = text.replace(/集体财富/g, '深层共有财富');
    text = text.replace(/旧友的离去/g, '财务合伙人的深层洗牌');
    text = text.replace(/群体、科技、未来愿景/g, '深层财务转化、保险与遗产');

    // ── 月份正文里的流月矛盾句清洗 ──
    // AI写"金星在第7宫,为你带来和谐"--8月金星在狮子座(2宫),不在7宫
    text = text.replace(/金星在第7宫,[^\n。]*为你带来和谐[^\n。]*/g, '');
    // 同理"金星在第7宫"单独出现也删
    text = text.replace(/金星在第7宫,[^\n。]*/g, '');

    // ── 全局兜底:彻底清除所有残留错误宫位 ──
    // 先执行两次确保彻底(AI可能产生嵌套错误)
    for (let i = 0; i < 2; i++) {
      R('第5宫(狮子座)', '第2宫(狮子座)');
      R('第1宫(白羊座)', '第10宫(白羊座)');
      R('第11宫(水瓶座)', '第8宫(水瓶座)');
    }
  }


  // 🛠️ V104b: 水星断头句修复--AI常漏写「水星在XX座逆行」中的「逆行」两字
  // 模式:「2月9日至3月3日,水星,财务文件需要格外小心」→补逆行
  text = text.replace(/(\d月\d日[^。\n]{0,20}?)水星,([^。\n]{0,5}?财务[^。\n]{0,20}?[。\n])/g, '$1水星在双鱼座逆行,$2');
  text = text.replace(/(\d月\d日[^。\n]{0,20}?)水星,([^。\n]{0,30}?[。\n])/g, function(m, p1, p2) {
    if (p2.indexOf('逆行') === -1 && p2.indexOf('顺行') === -1) {
      return p1 + '水星在双鱼座逆行,' + p2;
    }
    return m;
  });

  // 🛠️ V104c: 长括号自动闭合--段落结尾有(无)时自动补
  // 匹配结尾字符不是)」等且前面有未闭合(的段落
  var sections = text.split('\n');
  for (var si = 0; si < sections.length; si++) {
    var sec = sections[si];
    var openC = (sec.match(/\uff08/g) || []).length;
    var closeC = (sec.match(/\uff09/g) || []).length;
    if (openC > closeC && !sec.match(/[) ]\s*$/)) {
      sections[si] = sec + ')';
    }
  }
  text = sections.join('\n');

  // 🛡️ V97h2: 防御性清洗--移除编码崩坏的孤立代理对 + U+FFFD 替换符(保留合法 emoji 对)
  text = stripLoneSurrogates(text).replace(/\uFFFD/g, '');
  // V104d: 斩杀文本中字面的 \n 串
  text = text.replace(/\\n/g, '');

  // 🛠️ V120-fix7: 军师硬约束——禁止具体相位角度术语(大模型非确定性易编造),改为泛化能量描述
  // 只替换相位术语本身(保留行星名与"形成/带来"等动词),如"形成三分相(120度)"→"形成强烈共振"
  text = text.replace(/(三分相|六分相|四分相|对分相)(\（\d+度\）)?/g, '强烈共振');

  // 🛠️ V120-fix6: 军师前端防御层——半角括号→全角 + Emoji 标准空格
  // 1. 全局半角括号 ( ) → 全角 （ ）(防止安卓/iOS 排版错位与中英混杂)
  // ⚠️ V150-fix: 西班牙语/法语/泰语/越南语保留半角括号（国际化要求）
  // 🛠️ V153: 仅对中文转全角括号，es/fr/th/vi 由 langPunctuationClean 保持半角
  if (lang === 'zh') { text = text.replace(/\(/g, '（').replace(/\)/g, '）'); }
  // 匹配: 中文/英文/数字后接孤立全角）→ 删
  text = text.replace(/([\u4e00-\u9fa5a-zA-Z0-9])）/g, '$1');
  // 2. 章节 Emoji 标记(🟢🔴🔵⚠️)后强制标准空格,防止移动端文本排版错位
  text = text.replace(/((?:🟢|🔴|🔵|⚠️))(?=[^\s\n])/g, '$1 ');

  // ── V149: 全局括号配对清洗（根治空括号/孤儿右括号/孤儿左括号）──
  // 军师抓包: "（高危熔断）()"/"冥王星（水瓶座形成对冲"/"处女座）"
  // 算法:逐行双向栈校验,确保每个左括号有对应右括号
  text = (function(t) {
    const lines = t.split('\n');
    const result = lines.map(line => {
      let openHalf = 0, openFull = 0;
      let pass1 = '';
      // 正向:丢弃孤儿右括号
      for (const ch of line) {
        if (ch === '(') { openHalf++; pass1 += ch; }
        else if (ch === ')') { if (openHalf > 0) { openHalf--; pass1 += ch; } }
        else if (ch === '（') { openFull++; pass1 += ch; }
        else if (ch === '）') { if (openFull > 0) { openFull--; pass1 += ch; } }
        else pass1 += ch;
      }
      // 反向:丢弃孤儿左括号
      let pass2 = '';
      for (let i = pass1.length - 1; i >= 0; i--) {
        const ch = pass1[i];
        if (ch === '(' && openHalf > 0) { openHalf--; }
        else if (ch === '（' && openFull > 0) { openFull--; }
        else pass2 += ch;
      }
      return pass2.split('').reverse().join('');
    });
    return result.join('\n');
  })(text);

  return text;
}

// ── V104e: 本命太阳断言器 + 反向括号补丁 ──
// 1) 正文中「你的太阳在X座」但X不是本命太阳 → 替换为本命太阳
// 2) 反向残括号:「但水星)」「而天王星)」等(有)无(前)→ 补前
// 3) 「(巨蟹座形成强大的支持相位」漏)→ 补)
function natal_sun_linter(text, natalSunSign, ascendant) {
  if (!text || !natalSunSign) return text;


  // 🛠️ V110-fix1: 报头本命太阳硬覆盖(AI幻觉把摩羯写成双鱼,pat1只覆盖正文"你的太阳在X座"漏了报头)
  //   报头两处:年度星盘: X座 / 核心本命代码: 太阳X座 · 月亮Y座
  const _allSigns = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
  text = text.replace(new RegExp('年度星盘[^座]*(' + _allSigns.join('|') + ')', 'g'), '年度星盘: ' + natalSunSign);
  text = text.replace(new RegExp('核心本命代码[^座]*太阳(' + _allSigns.join('|') + ')', 'g'), '核心本命代码: 太阳' + natalSunSign);

  // 1) 本命太阳断言:匹配「你的太阳在X座」或「太阳在X座第Y宫」等显式引用
  //    只修正文中的本命表述,不修月度标题(月锁已保证正确)
  const SUN_SIGNS = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
  for (const wrongSign of SUN_SIGNS) {
    if (wrongSign === natalSunSign) continue;
    // 模式 1:你的太阳在双子座第12宫 → 你的太阳在狮子座第X宫
    // 但保留「太阳进入双子座」(月度 transit 语境)
    // 「太阳在X座」且前面 20 字内有「你的」→ 视为本命引用
    const pat1 = new RegExp('你的(?:本命)?太阳在' + wrongSign, 'g');
    text = text.replace(pat1, '你的太阳在' + natalSunSign);

    // 模式 2:前面无「你的」但有明显的本命上下文(如风元素路径章节)
    // 谨慎处理:只替换明确的前缀模式
    const pat2 = new RegExp('太阳在' + wrongSign + '第', 'g');
    // 替换前先检查上下文:如果上一句是「你的」领起,或前300字内第一次出现
    text = text.replace(pat2, '太阳在' + natalSunSign + '第');

    // 🛠️ V107-fix1: AI 把相位目标星座(如巨蟹座四分相 白羊座)错写为本命星座
    // 模式:与你的本命白羊座太阳形成四分相(用户本命射手座时,白羊座是 aspect target 不是本命)
    // 匹配:与你的本命[WRONG]座太阳/月亮形成[相位]
    const pat3 = new RegExp('与你的本命' + wrongSign + '(太阳|月亮)形成', 'g');
    text = text.replace(pat3, '与你的本命' + natalSunSign + '$1形成');

    // 🛠️ V110-fix2: 本命太阳句式扩面(pat1只覆盖"你的太阳在X座",漏了带"本命"间隔和"之人"句式)
    //   "你的本命太阳在X座" / "本命太阳在X座" / "作为X座之人" / "X座之人"
    text = text.replace(new RegExp('你的本命太阳在' + wrongSign, 'g'), '你的本命太阳在' + natalSunSign);
    text = text.replace(new RegExp('本命太阳在' + wrongSign + '座', 'g'), '本命太阳在' + natalSunSign + '座');
    text = text.replace(new RegExp('作为' + wrongSign + '之人', 'g'), '作为' + natalSunSign + '之人');
    text = text.replace(new RegExp('(^|[\\s,。、])' + wrongSign + '之人', 'g'), '$1' + natalSunSign + '之人');
    
    // 🛠️ V181-fix: "X座本命太阳"模式(军师审计:摩羯本命太阳应为双鱼)
    //   "金星在处女座与摩羯座本命太阳的谐和联动" → "金星在处女座与双鱼座本命太阳的镜像联动"
    text = text.replace(new RegExp(wrongSign + '本命太阳', 'g'), natalSunSign + '本命太阳');
  }

  // 2) 反向残括号:但水星)→ 但水星(逆行) 或补前(
  //   「但[行星名])」 → 「但[行星名](逆行)」
  //   「而[行星名])」 → 「而[行星名](逆行)」
  const PLANETS = ['水星','金星','火星','木星','土星','天王星','海王星','冥王星'];
  for (const p of PLANETS) {
    const revPat = new RegExp('但' + p + '[\)）]', 'g');
    text = text.replace(revPat, '但' + p + '(逆行)');
    const revPat2 = new RegExp('而' + p + '[\)）]', 'g');
    text = text.replace(revPat2, '而' + p + '(逆行)');
    const revPat3 = new RegExp(',' + p + '[\)）]', 'g');
    text = text.replace(revPat3, ',' + p + '(逆行)');
  }

  // 🛠️ V108-fix4: 第五章本命宫位硬编码--AI 自行推算本命太阳宫位时常写".2e6.79bb.121宫"
  // 根据上升星座和本命太阳星座,用整宫制计算正确宫位
  try {
    const _vm = getSignToHouseMap(ascendant);
    const _si = SIGN_ORDER_ZH.indexOf(natalSunSign);
    if (_vm && _si >= 0 && _vm[_si]) {
      const _ch = _vm[_si];
      text = text.replace(/你的本命太阳在第[一二三四五六七八九十百零\d]{1,3}宫/g, '你的本命太阳在第' + _ch + '宫');
      text = text.replace(/本命太阳在第[一二三四五六七八九十百零\d]{1,3}宫/g, '本命太阳在第' + _ch + '宫');

      // ⛔ V485 拆除 V108-fix7: 「第五章家居对齐硬编码宫位解耦」
      //   原代码: text.indexOf('家居财富对齐') ~ indexOf('办公室财富对齐') 之间
      //           所有「第N宫」无差别替换为 _ch(=本命太阳宫位, 本盘=第11宫)。
      //   危害(线上实证 + 探针逐字复现, 1997-10-18 特罗姆瑟盘):
      //     「你的第四宫落在双鱼座」 → 「你的本命第11宫落在双鱼座」
      //     「你的第二宫落在摩羯座，第八宫落在巨蟹座」 → 两处全变「第11宫」
      //   ⇒ 产品固定隐喻(卧室=第四宫/厨房=第二宫+第八宫/财务室=第八宫)被整体摧毁,
      //     正文与标签自相矛盾; 且与 forceSpaceHouseSanitizer 直接冲突。
      //   该段本意(兜底本命太阳宫位)已由上方两条 replace 完成, 故整体删除。
    }
  } catch(e) {
    console.warn('[natal_sun_linter] house fix failed:', e.message);
  }


  // ═══ V113-fix6: 月度爆发窗口星座强锁 ═══
  // 根因:Gemini偷懒套7月模板,Peak Revenue Window里"太阳在X座"全写成本命星座
  // 解法:按月章节切分,提取标题当月天象星座,正文"太阳在X座"全部强制对齐
  try {
    const _alls = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
    const _secs = text.split(/(?=###\s*\d{4}年\d{1,2}月)/g);
    const _proc = _secs.map(_s => {
      const _m = _s.match(/###\s*\d{4}年\d{1,2}月\s*:\s*太阳([^\s座]+座)/);
      if (!_m) return _s;
      const _transit = _m[1];
      const _ti = _s.indexOf('\n', _s.indexOf('###'));
      if (_ti < 0) return _s;
      const _hdr = _s.substring(0, _ti + 1);
      let _body = _s.substring(_ti + 1);
      _body = _body.replace(/太阳在([^\s座]+)座/g, (_mm, _sg) => {
        if (_alls.includes(_sg + '座') && _sg + '座' !== _transit) {
          return '太阳在' + _transit.replace('座','') + '座';
        }
        return _mm;
      });
      return _hdr + _body;
    });
    text = _proc.join('');
  } catch(e) {
    console.warn('[natal_sun_linter] transit sun lock failed:', e.message);
  }

  return text;

  // ── V146: 中文本命星体断言器（木星/土星/海王星/冥王星张冠李戴）──
  // 根因：LLM把2026流年星体（白羊座土星/海王星）误冠"本命"前缀
  const NATAL_PLANETS_ZH = [
    { planet: '土星', real: '摩羯座', wrong: ['白羊座','狮子座','处女座','天秤座','射手座','水瓶座','双子座','巨蟹座','双鱼座'] },
    { planet: '海王星', real: '摩羯座', wrong: ['白羊座','金牛座','双子座','狮子座','处女座','天蝎座','射手座','双鱼座'] },
    { planet: '木星', real: '金牛座', wrong: ['白羊座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','水瓶座','双鱼座'] },
    { planet: '冥王星', real: '天蝎座', wrong: ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','射手座','摩羯座','水瓶座','双鱼座'] }
  ];
  NATAL_PLANETS_ZH.forEach(({ planet, wrong }) => {
    wrong.forEach(wrongSign => {
      text = text.replace(new RegExp(`本命${planet}在${wrongSign}`, 'g'), `流年${planet}在${wrongSign}`);
      text = text.replace(new RegExp(`${planet}是本命${wrongSign}`, 'g'), `${planet}是流年${wrongSign}`);
    });
  });
}

// ── 模块级 _sunOf: 从 astroMatrix month 对象安全取太阳星座/宫位(astro-truth.js / Python 双格式兼容)──
// ⚠️ 必须模块级定义! house_linter / applyMonthLockSanitizer / buildWealthReportPrompt 共用,局部定义会导致跨函数调用 _sunOf is not defined
const _sunOf = (m) => {
  if (!m) return { sign: '', house: undefined };
  if (m.sun && m.sun.sign) return m.sun;
  if (m.positions && m.positions.Sun) return { sign: m.positions.Sun.sign, house: m.positions.Sun.house };
  if (m.sunSignZH) return { sign: m.sunSignZH, house: m.sunHouse };  // astro-truth.js format
  return { sign: '', house: undefined };
};

// ── 🛡️ V483b: 月标题「年/月」的唯一真源 = 矩阵的 month_key ─────────────────────
//   病根（2026-09-30 生产实测, 1999-12-15 特罗姆瑟盘）:
//     V483 已把年报矩阵窗口改为财年(当年 7 月 ~ 次年 6 月), 但 Prompt 的月份硬锁表 /
//     区间说明 / 输出侧月度锁仍在用「服务器当前月 + i」推算 → **数据是 7 月起、标签是 9 月起**,
//     用户可见的 12 条月标题整体错位 2 个月（判据②「逐月数据零矛盾」绿、判据⑦「窗口对齐」红）。
//     此前两者恰好都是 9 月起, 错位被掩盖 —— 属 V483 暴露出来的潜伏 bug。
//   月报不受影响: 月报矩阵 month_key 本来就是「当月起」, 与回退分支语义一致。
function _v483bMonthYM(m, i, currentYear, currentMonth) {
  const t = /^(\d{4})-(\d{1,2})$/.exec(String((m && m.month_key) || ''));
  if (t) return { year: Number(t[1]), month: Number(t[2]) };
  const cm = (currentMonth == null) ? (new Date().getMonth() + 1) : currentMonth;
  const cy = (currentYear == null) ? new Date().getFullYear() : currentYear;
  const mi = cm - 1 + i;
  return { year: cy + (mi >= 12 ? 1 : 0), month: (mi % 12) + 1 };
}

// 🛠️ V120-fix5: 宫位强制纠偏 linter——AI 常把行星宫位写错(如木星狮子座写成第11宫,实为第2宫)
// 基于 astroMatrix 真值(或 rising Cancer fallback)强制修正行星-宫位映射
// ═══════════════════════════════════════════════════════════════════
// 🛡️ V233-fix: 法语/西班牙语月报专用清洗工具
// ── 修空格粘连（DeepSeek 吞词边界空格）─────────────────────────
function fixFrenchSpacing(text) {
  if (!text || typeof text !== 'string') return text;
  if (!/(?:maison|Maison|Soleil|Lune|Jupiter|Saturne|Mars|Mercure|Vénus|Semaine|Jour|Août|Juillet|de \d|€|%)/i.test(text)) return text;
  // 1. ordinal 粘连（数字紧贴 maison 但带 e）：votre7e maison → votre 7e maison
  text = text.replace(/([a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ])(\d+e?)(?= maison)/g, '$1 $2');
  // 2. en/du/la/le + 数字 ordinal：en7e maison → en 7e maison
  text = text.replace(/(en|du|la|le)\s*(\d+e?)(?= maison)/gi, '$1 $2');
  // 3. 纯数字 + e + maison：7e maison → 7e maison（如已有空格不变）
  text = text.replace(/([0-9]+)\s*e?\s*(maison)/gi, '$1e $2');
  // 4. Maison + 数字：Maison7 → Maison 7
  text = text.replace(/(Maison)\s*([0-9])/gi, '$1 $2');
  // 5. 字母紧贴数字（如 votre7 / Jour12 / le18）——但 ordinal 7e 已修，跳过 7e
  text = text.replace(/([a-zA-ZàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ])([0-9]+(?!s*e\s))/g, '$1 $2');
  // 6. 数字紧贴货币（合并）: 450 € → 450€
  text = text.replace(/([0-9]+)\s*(€|%|\$|£)/g, '$1$2');
  return text.replace(/ {2,}/g, ' ');
}

function fixFrenchTypo(text) {
  if (!text || typeof text !== 'string') return text;
  // guard 用独立词匹配，防止 "Laune" 被 "Lune" 子串误触发
  // guard 改用子串检测（独立词边界无法匹配 Laune 里的 Lune 子串）
  if (!/(?:maison|Soleil|Lune|Jupiter|Saturne|Mars|Mercure|Vénus|Août|Juillet|Semaine|Jour|quinz|dix|vingt|trente)/i.test(text) && !/(?:Laune|oleil|Maisonn|junguien)/i.test(text)) return text;
  text = text.replace(/\bLaune\b/g, 'La Lune');   // Laune → La Lune
  text = text.replace(/\boleil\b/g, 'Soleil');   // oleil → Soleil
  text = text.replace(/\bMaisonn\b/g, 'Maison'); // Maisonn → Maison
  text = text.replace(/\bjunguien/gi, 'jungien');  // junguien → jungien
  text = text.replace(/vous demande\s+(transformer|donner|acheter|payer)/gi, 'vous demande de $1'); // 缺介词
  return text;
}

// ── 修西班牙语空格粘连 ────────────────────────────────────
function fixSpanishSpacing(text) {
  if (!text || typeof text !== 'string') return text;
  if (!/(?:casa|Casa|Semana|Día|mes|Sol|Luna|Júpiter|Marte)/i.test(text)) return text;
  // 数字紧贴字母
  text = text.replace(/([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])([0-9])/g, '$1 $2');
  text = text.replace(/([0-9]+)(?![eèéêë]\b)([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ])/g, '$1 $2');
  return text.replace(/ {2,}/g, ' ');
}

// 🛡️ V492/R5: 高纬度分宫降级告知——astro_matrix.py 触发 WholeSignFallback（|lat|>66.5°）时
//   报告首段由**后端拼接注入**本告知（非 LLM 生成，禁止 LLM 复述/翻译）。文案 6 语原生。
function injectHighLatitudeNotice(text, astroMatrix, lang) {
  if (!text || typeof text !== 'string') return text;
  if (!astroMatrix || !astroMatrix.meta || astroMatrix.meta.is_high_latitude_fallback !== true) return text;
  const NOTICE = {
    zh: '检测到您的出生地位于高纬度极圈区域，系统已自动启用等宫制（Whole Sign）为您精确校准宫位。',
    en: 'Your birthplace lies in the high-latitude polar region — the system has automatically switched to the Whole Sign house system for precise house calibration.',
    es: 'Tu lugar de nacimiento se encuentra en la región polar de alta latitud: el sistema ha activado automáticamente el sistema de casas de Signo Completo (Whole Sign) para calibrar con precisión tus casas.',
    fr: 'Votre lieu de naissance se situe dans la région polaire de haute latitude — le système a automatiquement activé le système des maisons en Signes Entiers (Whole Sign) afin de calibrer précisément vos maisons.',
    th: 'สถานที่เกิดของคุณอยู่ในเขตละติจูดสูงบริเวณขั้วโลก ระบบได้เปิดใช้ระบบเรือนแบบราศีเต็ม (Whole Sign) โดยอัตโนมัติ เพื่อปรับเรือนให้แม่นยำ',
    vi: 'Nơi sinh của bạn nằm ở vùng vĩ độ cao gần cực — hệ thống đã tự động chuyển sang hệ thống nhà Toàn Cung (Whole Sign) để hiệu chỉnh nhà chính xác.',
  };
  // 🛡️ E17/R11j ⑤-a（军师裁决 2026-10-05）：**停止向正文拼接**高纬告知。
  //   病根：该提示属「系统级 UI 状态气泡」，混入 Markdown 正文会与前端自有 Banner 重复，
  //   并在导出（PDF/复制）时破坏结构。现改为随 JSON `highLatitudeNotice` 字段返回
  //   （见 buildHighLatitudeMeta），由前端在页面顶部单独渲染。本函数保留为**兼容 no-op**。
  void NOTICE; void astroMatrix; void lang;
  return text;
}

function house_linter(text, astroMatrix, currentMonth = null, opts = {}) {
  if (!text) return text;

  const getH = (v) => typeof v === 'number' ? v : (v?.house ?? v?.natal_house ?? v?.[0] ?? null);
  const toCN = (n) => ['零','一','二','三','四','五','六','七','八','九','十','十一','十二'][n] || String(n);
  // 🛡️ V492/R1: 中文数字/阿拉伯数字双向解析 —— 供「同值零改动」判读（护栏 G02/G06 口径）
  const fromCN = (s) => {
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    const D = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9 };
    const m = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/.exec(s);
    if (m) return (m[1] ? D[m[1]] : 1) * 10 + (m[2] ? D[m[2]] : 0);
    return NaN;
  };
  // 🛡️ V492/E7: 英文月锚点分支用全星体词条（与 NAME_MAP/NAME_MAP2 同步维护三份）
  const NAME_MAP_ALL = {
    jupiter: ['木星', 'Jupiter', 'Júpiter', 'ดาวพฤหัส', 'Sao Mộc'],
    saturn:  ['土星', 'Saturn', 'Saturno', 'Saturne', 'ดาวเสาร์', 'Sao Thổ'],
    pluto:   ['冥王星', 'Pluto', 'Plutón', 'Pluton', 'ดาวพลูโต', 'Sao Diêm Vương'],
    // 🛡️ E16/R11g: 太阳/月亮补**泰语正字** `ดวงอาทิตย์`/`ดวงจันทร์` —— 原表只列 `ดาวอาทิตย์`
    //   (星期/行星义的「ดาว」)与 `ดาวจันทร์`(非占星正字)。系统其余各处(_TH_PLANET:3122、
    //   _TH_BODY_ANY:3135、th 提示词)一律用 `ดวง-` 形态 ⇒ 原表与产出**永不相交** ⇒
    //   本表既有的「太阳/月亮宫位纠偏」对泰语**整体空转**(静默失效类)。
    sun:     ['太阳', 'Sun', 'Sol', 'Soleil', 'ดาวอาทิตย์', 'ดวงอาทิตย์', 'Mặt Trời'],
    moon:    ['月亮', 'Moon', 'Luna', 'Lune', 'ดาวจันทร์', 'ดวงจันทร์', 'Mặt Trăng'],
    // 🛡️ E16/R11g: 补**西语正字** `Mercurio`/`Marte` —— 原表只有法语 `Mercure`，
    //   西语产出写 `Mercurio`/`Marte`（_V432_NAME.es）⇒ 水星/火星的宫位纠偏对西语空转。
    mercury: ['水星', 'Mercury', 'Mercure', 'Mercurio', 'ดาวพุธ', 'Sao Thủy'],
    venus:   ['金星', 'Venus', 'Vénus', 'ดาวศุกร์', 'Sao Kim'],
    mars:    ['火星', 'Mars', 'Marte', 'ดาวอังคาร', 'Sao Hỏa'],
    uranus:  ['天王星', 'Uranus', 'Urano', 'ดาวยูเรนัส', 'Sao Thiên Vương'],
    neptune: ['海王星', 'Neptune', 'Neptuno', 'ดาวเนปจูน', 'Sao Hải Vương'],
  };

  // ── 按月分区处理：每节用当月真实 house ──────────────────────────
  // 月份锚点: ### YYYY年MM月: / #### YYYY年M月: / ##### ...
  // 🛠️ V482e 修两处:
  //   ① **步长错位**: 正则有 2 个捕获组 ⇒ split 后每 3 项一组(年/月/正文),
  //      旧代码按 `i += 2` 步进 ⇒ i=3 起把「正文」当成年份 → parseInt→NaN →
  //      月数据查不到 → 走 !monthData 分支把**正文原样再追加一遍**并补 `年undefined月:`。
  //      实测: 只要正文含 `### YYYY年M月:` 且 astroMatrix 有 months, 整篇月标题必被碾碎
  //      (`### 2026年11月: X` → `2026年11月: X X年undefined月:`)。
  //   ② **标题标记被吞**: 正则不含 `#` 前缀 ⇒ 重建时 `###` 整个丢失,
  //      下游 lockYearlyMonthTitles / lockYearlyTransitSigns 认不出月标题 → 真值锁集体失效。
  //      现改为把 `#{1,6}` 与空白一并捕获, 按 4 项一组步进, 重建时原样保留。
  const monthAnchorRe = /(#{1,6}[ \t]*)(\d{4})年(\d{1,2})月:/g;
  const sections = text.split(monthAnchorRe);
  // sections[0] = 前导文本(开篇等), 之后每 4 项一组: [标题标记, 年份, 月份, 正文]

  if (sections.length >= 5 && astroMatrix && astroMatrix.months && astroMatrix.months.length > 0) {
    // 🛠️ V230-fix: 精确年月匹配,不靠 monthNum-1 索引推算
    //   风险: months 是动态滚动数组(从当前月切片), months[monthNum-1] 会越界/错配
    //   治本: 用文本锚点的真实年月拼 month_key ("2026-08") 在 months 里精确查找
    const _monthsMap = {};
    astroMatrix.months.forEach(m => {
      const _k = m.month_key || (m.year && m.month ? `${m.year}-${String(m.month).padStart(2,'0')}` : '');
      if (_k) _monthsMap[_k] = m;
    });
    // sections 每 4 项一组: 1=标题标记, 2=年份, 3=月份, 4=正文, 5=标记, 6=年份, 7=月份, 8=正文, ...
    let result = sections[0]; // 前导(不含月份)
    for (let i = 1; i + 2 < sections.length; i += 4) {
      const marker  = sections[i];                    // `### ` 原样保留(旧代码在此吞掉)
      const yearStr  = sections[i + 1];
      const monthStr = sections[i + 2];
      const year  = parseInt(yearStr);
      const monthNum = parseInt(monthStr); // 1-12
      const body = sections[i + 3] !== undefined ? sections[i + 3] : '';
      // 🛠️ V230-fix: 精确查找(兼容静态全年数组 & 动态滚动数组)
      const _key = `${year}-${String(monthNum).padStart(2,'0')}`;
      const monthData = _monthsMap[_key] || astroMatrix.months[monthNum - 1] || null;
      if (!monthData) { result += marker + yearStr + '年' + monthStr + '月:' + body; continue; }
      const jupHouse = getH(monthData.jupiter?.house) || 2;
      const satHouse = getH(monthData.saturn?.house) || 10;
      const plHouse  = getH(monthData.pluto?.house)  || 8;
      const sunHouse = getH(_sunOf(monthData).house) || 1;
      const moonHouse= getH(monthData.moon?.house)   || 2;
      // 🛡️ V492/R2: 补齐天王星/海王星（月锚点分支原仅 5 颗）——缺真值时跳过（不编造兜底宫位）
      const uraHouse = getH(monthData.uranus?.house);
      const nepHouse = getH(monthData.neptune?.house);
      const RULES = [
        ['jupiter', jupHouse], ['saturn', satHouse], ['pluto', plHouse],
        ['sun', sunHouse], ['moon', moonHouse],
        ['uranus', uraHouse], ['neptune', nepHouse],
      ];
      const NAME_MAP = {
        jupiter: ['木星', 'Jupiter', 'Júpiter', 'Jupiter', 'ดาวพฤหัส', 'Sao Mộc'],
        saturn:  ['土星', 'Saturn', 'Saturno', 'Saturne', 'ดาวเสาร์', 'Sao Thổ'],
        pluto:   ['冥王星', 'Pluto', 'Plutón', 'Pluton', 'ดาวพลูโต', 'Sao Diêm Vương'],
        // 🛡️ E16/R11g: 与 NAME_MAP_ALL/NAME_MAP2 同步 —— 补泰语正字 ดวงอาทิตย์ / ดวงจันทร์
        sun:     ['太阳', 'Sun', 'Sol', 'Soleil', 'ดาวอาทิตย์', 'ดวงอาทิตย์', 'Mặt Trời'],
        moon:    ['月亮', 'Moon', 'Luna', 'Lune', 'ดาวจันทร์', 'ดวงจันทร์', 'Mặt Trăng'],
        // 🛡️ V492/R2: 天王星/海王星词条（全 6 语）
        uranus:  ['天王星', 'Uranus', 'Urano', 'ดาวยูเรนัส', 'Sao Thiên Vương'],
        neptune: ['海王星', 'Neptune', 'Neptuno', 'ดาวเนปจูน', 'Sao Hải Vương'],
      };
      let secText = marker + yearStr + '年' + monthStr + '月:' + body;
      for (const [key, house] of RULES) {
        if (!house) continue;
        for (const pname of NAME_MAP[key]) {
          // 🛡️ V492/R1: 字符类补 \d —— 旧正则 [一二三四五六七八九十]+宫 遇「第1宫」全空转
          // 🛡️ V492/R3: 连接词放宽 —— 旧正则要求行星名紧邻「在」，报告写法（沉入/燃烧于/行经）全漏；
          //   窗口仍守 [^第\n]{0,12} 句界与「第」界，不跨句不跨宫
          const reCN = new RegExp('(' + pname + '[^第\\n]{0,12}?第)([一二三四五六七八九十\\d]+)宫', 'g');
          secText = secText.replace(reCN, (mm, p1, num) => {
            const _n = fromCN(num);
            return (_n === house) ? mm : (p1 + toCN(house) + '宫');  // 同值零改动（值不变字也不变）
          });
          const reEN = new RegExp('(' + pname + ')([^\\n]{0,16}?)(House|Casa|Maison|ภพที่|เรือนที่|Nhà)( +)[0-9]+', 'gi');
          secText = secText.replace(reEN, (m, p1, p2, p3, p4) => p1 + p2 + p3 + p4 + house);
          // 🛡️ V492/E6: 英文序数格式（7th House / 12th House）—— 旧 reEN 只认「House 7」序数在后 ⇒ 英文年报全空转
          const reENOrd = new RegExp('(' + pname + ')([^\\n]{0,16}?)([0-9]+)(?:st|nd|rd|th)( +)(House|Casa|Maison|ภพที่|เรือนที่|Nhà)', 'gi');
          secText = secText.replace(reENOrd, (m, p1, p2, num, sp, p3) =>
            parseInt(num) !== house ? p1 + p2 + house + sp + p3 : m);
        }
      }
      result += secText;
    }
    return result;
  }

  // ── 🛡️ V492/E7: 英文月锚点分支（年报 en/fr/es/vi 月段：`### July 2026: ...`）──
  // 后端 lockYearlyMonthTitles 已内建英文月识别（_V478_EN_MONTHS），house_linter 必须同步认得，
  // 否则英文年报月段无法按月纠偏（Adelaide 盘实证：月段全对、非月段全错且无硬后手）。
  // split 捕获组 3 个（marker/整月词/年）⇒ 每 4 项一组；整月词捕获防 rebuild 丢后缀（September）。
  {
    const _hasMonths = astroMatrix && astroMatrix.months && astroMatrix.months.length > 0;
    // 🛡️ E16/R11g: 月锚点词表**必须覆盖 es/fr 全 12 月名**（原表只列英文 12 月缩写）。
    //   实测（2026-10-04 v513 线上 raw 产物，逐盘统计命中数）：
    //     es 8/12 命中（缺 Agosto/Diciembre/Enero/Abril）；fr **5/12** 命中
    //     （缺 Juillet/Août/Décembre/Février/Avril/Mai/Juin）。
    //   病根：`text.split` 只在不命中处**不切段** ⇒ 未命中月份的正文被并入**上一个命中月**
    //   的段 ⇒ 该段用**错月数据**改写行星宫位。实测 fr：`Décembre 的 Maison` 被写成
    //   Novembre 的值、`Février` 被写成 Janvier 的值、`Avril/Mai` 被写成 Mars 的值
    //   （标题行由更晚的 lockYearlyMonthTitles 兜住，正文行则残留错值）。
    //   治法：词表按 _V516_MONTHS 的 en/es/fr 三语月名构建（长词优先、大小写不敏感），
    //   月份号由**命中词本身**解析（不靠序号位置推算），彻底消除跨月串段。
    //   ⚠️ 不引入 th/vi：泰/越月锚点形态不同（Tháng N Năm YYYY / กรกฎาคม 2569），
    //   启用等于**新增覆盖**（新风险面），非本缺陷的修复范围。
    const _ANCHOR_ALT = [];
    for (const _l of ['en', 'es', 'fr']) for (let i = 0; i < 12; i++) _ANCHOR_ALT.push([_V516_MONTHS[_l][i], i + 1]);
    _ANCHOR_ALT.sort((a, b) => b[0].length - a[0].length);
    const _ANCHOR_IDX = {};
    for (const [w, mo] of _ANCHOR_ALT) _ANCHOR_IDX[w.toLowerCase()] = mo;
    const enAnchorRe = new RegExp(
      '(#{1,6}[ \\t]*)(' + _ANCHOR_ALT.map(([w]) => _v516Esc(w)).join('|') + ')[ \\t]+(\\d{4}):', 'gi');
    const enSections = _hasMonths ? text.split(enAnchorRe) : [];
    if (enSections.length >= 5 && _hasMonths) {
      const _monthsMap = {};
      astroMatrix.months.forEach(m => {
        const _k = m.month_key || (m.year && m.month ? `${m.year}-${String(m.month).padStart(2,'0')}` : '');
        if (_k) _monthsMap[_k] = m;
      });
      let result = enSections[0];
      for (let i = 1; i + 3 < enSections.length; i += 4) {
        const marker  = enSections[i];
        const monWord = enSections[i + 1];
        const yearStr = enSections[i + 2];
        const body    = enSections[i + 3] !== undefined ? enSections[i + 3] : '';
        const _mNum = _ANCHOR_IDX[String(monWord).toLowerCase()] || 0;
        const _key = `${yearStr}-${String(_mNum).padStart(2, '0')}`;
        const monthData = _monthsMap[_key] || astroMatrix.months[_mNum - 1] || null;
        let secText = marker + monWord + ' ' + yearStr + ':' + body;
        if (monthData) {
          const _rulesEN = [
            ['jupiter', getH(monthData.jupiter?.house)], ['saturn', getH(monthData.saturn?.house)],
            ['pluto', getH(monthData.pluto?.house)], ['sun', getH(_sunOf(monthData).house)],
            ['moon', getH(monthData.moon?.house)], ['uranus', getH(monthData.uranus?.house)],
            ['neptune', getH(monthData.neptune?.house)],
          ];
          for (const [key, house] of _rulesEN) {
            if (!house) continue;
            for (const pname of NAME_MAP_ALL[key]) {
              const reCN = new RegExp('(' + pname + '[^第\\n]{0,12}?第)([一二三四五六七八九十\\d]+)宫', 'g');
              secText = secText.replace(reCN, (mm, p1, num) => {
                const _n = fromCN(num);
                return (_n === house) ? mm : (p1 + toCN(house) + '宫');
              });
              const reFR = new RegExp('(' + pname + '[^\\n]{0,20}?)(\\d+)e?\\s*(maison)', 'gi');
              secText = secText.replace(reFR, (m, prefix, n, suffix) =>
                parseInt(n) !== house ? prefix + house + 'e ' + suffix : m);
              const reEN = new RegExp('(' + pname + ')([^\\n]{0,16}?)(House|Casa|Maison|ภพที่|เรือนที่|Nhà)( +)[0-9]+', 'gi');
              secText = secText.replace(reEN, (m, p1, p2, p3, p4) => p1 + p2 + p3 + p4 + house);
              const reENOrd = new RegExp('(' + pname + ')([^\\n]{0,16}?)([0-9]+)(?:st|nd|rd|th)( +)(House|Casa|Maison|ภพที่|เรือนที่|Nhà)', 'gi');
              secText = secText.replace(reENOrd, (m, p1, p2, num, sp, p3) =>
                parseInt(num) !== house ? p1 + p2 + house + sp + p3 : m);
            }
          }
        }
        result += secText;
      }
      return result;
    }
  }
  // 🛡️ V492/E7: 年报模式（strictAnchor）且中/英月锚点均不匹配（如 th 全泰文月标）⇒ 原文透传——
  //   绝不允许「单月数据纠偏全文」的伪纠偏（回退分支的 detectedMonth 启发式只对月报安全）。
  if (opts && opts.strictAnchor) return text;

  // ── 回退: 无月份锚点或无 astroMatrix → 用 months 数据处理 ───
  // 🛡️ V233-fix: 法语/西班牙语月份锚点无法被中文锚点正则捕获，自动检测月份关键词选对应数据。
  // 🛡️ V492/G04: 无 months 数据 ⇒ 原文透传 —— 硬编兜底宫位（pluto||8 等）在 R1 补 \d 后
  //   会从「不匹配」变成「主动改写」= 无真值伪造纠偏，绝不允许。
  if (!astroMatrix || !astroMatrix.months || astroMatrix.months.length === 0) return text;
  const FR_MONTH_MAP = {Juil:7,Juillet:7,Août:8,Aout:8,Sept:9,Sep:9,Septembre:9,
    Oct:10,Octobre:10,Nov:11,Novembre:11,Déc:12,Dec:12,Decembre:12,
    Janv:1,Janvier:1,Févr:2,Fév:2,Février:2,Mars:3,Avril:4,Mai:5,Juin:6};
  const ES_MONTH_MAP = {Ene:1,Feb:2,Mar:3,Abr:4,May:5,Jun:6,Jul:7,Ago:8,Sep:9,Oct:10,Nov:11,Dic:12};
  const MONTH_MAP = {...FR_MONTH_MAP, ...ES_MONTH_MAP};
  let detectedMonth = 1;
  for (const [kw, m] of Object.entries(MONTH_MAP)) {
    if (new RegExp('\\b' + kw + '\\b', 'i').test(text)) { detectedMonth = m; break; }
  }
  const monthIdx = Math.min(Math.max(detectedMonth - 1, 0), (astroMatrix?.months?.length || 1) - 1);
  const fb = (astroMatrix?.months?.[monthIdx]) || (astroMatrix?.months?.[0]) || {};
  const jupHouse = getH(fb.jupiter?.house) || getH(fb.positions?.Jupiter?.house) || 2;
  const satHouse = getH(fb.saturn?.house)  || getH(fb.positions?.Saturn?.house)  || 10;
  const plHouse  = getH(fb.pluto?.house)   || getH(fb.positions?.Pluto?.house)   || 8;
  const sunHouse = getH(_sunOf(fb).house)  || getH(fb.sun?.house)  || 1;
  const moonHouse= getH(fb.moon?.house)    || getH(fb.positions?.Moon?.house)    || 2;
  const mercHouse= getH(fb.mercury?.house)|| getH(fb.positions?.Mercury?.house)|| 3;
  const venHouse = getH(fb.venus?.house)  || getH(fb.positions?.Venus?.house)   || 4;
  const marsHouse= getH(fb.mars?.house)   || getH(fb.positions?.Mars?.house)    || 5;
  // 🛡️ V492/R2: 回退分支补齐天王星/海王星——缺真值时跳过（不编造兜底宫位）
  const uraHouse = getH(fb.uranus?.house) || getH(fb.positions?.Uranus?.house);
  const nepHouse = getH(fb.neptune?.house)|| getH(fb.positions?.Neptune?.house);
  const RULES2 = [
    ['jupiter', jupHouse], ['saturn', satHouse], ['pluto', plHouse],
    ['sun', sunHouse], ['moon', moonHouse], ['mercury', mercHouse], ['venus', venHouse], ['mars', marsHouse],
    ['uranus', uraHouse], ['neptune', nepHouse],
  ];
  const NAME_MAP2 = {
    jupiter: ['木星', 'Jupiter', 'Júpiter', 'ดาวพฤหัส', 'Sao Mộc'],
    saturn:  ['土星', 'Saturn', 'Saturno', 'Saturne', 'ดาวเสาร์', 'Sao Thổ'],
    pluto:   ['冥王星', 'Pluto', 'Plutón', 'Pluton', 'ดาวพลูโต', 'Sao Diêm Vương'],
    // 🛡️ V492/R2c: 越南语「太阳」词条曾被污染为 Mặt Trăng（=月亮）⇒ 太阳规则误匹配越语月亮；正字 = Mặt Trời
    // 🛡️ E16/R11g: 太阳/月亮补**泰语正字** `ดวงอาทิตย์`/`ดวงจันทร์` —— 原表只列 `ดาวอาทิตย์`
    //   (星期/行星义的「ดาว」)与 `ดาวจันทร์`(非占星正字)。系统其余各处(_TH_PLANET:3122、
    //   _TH_BODY_ANY:3135、th 提示词)一律用 `ดวง-` 形态 ⇒ 原表与产出**永不相交** ⇒
    //   本表既有的「太阳/月亮宫位纠偏」对泰语**整体空转**(静默失效类)。
    sun:     ['太阳', 'Sun', 'Sol', 'Soleil', 'ดาวอาทิตย์', 'ดวงอาทิตย์', 'Mặt Trời'],
    moon:    ['月亮', 'Moon', 'Luna', 'Lune', 'ดาวจันทร์', 'ดวงจันทร์', 'Mặt Trăng'],
    // 🛡️ E16/R11g: 补**西语正字** `Mercurio`/`Marte` —— 原表只有法语 `Mercure`，
    //   西语产出写 `Mercurio`/`Marte`（_V432_NAME.es）⇒ 水星/火星的宫位纠偏对西语空转。
    mercury: ['水星', 'Mercury', 'Mercure', 'Mercurio', 'ดาวพุธ', 'Sao Thủy'],
    venus:   ['金星', 'Venus', 'Vénus', 'ดาวศุกร์', 'Sao Kim'],
    mars:    ['火星', 'Mars', 'Marte', 'ดาวอังคาร', 'Sao Hỏa'],
    // 🛡️ V492/R2: 天王星/海王星词条（全 6 语）
    uranus:  ['天王星', 'Uranus', 'Urano', 'ดาวยูเรนัส', 'Sao Thiên Vương'],
    neptune: ['海王星', 'Neptune', 'Neptuno', 'ดาวเนปจูน', 'Sao Hải Vương'],
  };
  for (const [key, house] of RULES2) {
    if (!house) continue;
    for (const pname of NAME_MAP2[key]) {
      // 🛡️ V492/R1+R3: 与月锚点分支同口径 —— 字符类补 \d、连接词放宽（守句界与「第」界）、同值零改动
      const reCN = new RegExp('(' + pname + '[^第\n]{0,12}?第)([一二三四五六七八九十\\d]+)宫', 'g');
      text = text.replace(reCN, (mm, p1, num) => {
        const _n = fromCN(num);
        return (_n === house) ? mm : (p1 + toCN(house) + '宫');
      });
      // 🛡️ V233-fix: 法语 maison 格式——Lune en 9e maison / Soleil en 8e Maison
      const reFR = new RegExp('(' + pname + '[^\n]{0,20}?)(\d+)e?\s*(maison)', 'gi');
      text = text.replace(reFR, (m, prefix, n, suffix) =>
        parseInt(n) !== house ? prefix + house + 'e ' + suffix : m);
      const reEN = new RegExp('(' + pname + ')([^\n]{0,16}?)(House|Casa|Maison|ภพที่|เรือนที่|Nhà)( +)[0-9]+', 'gi');
      text = text.replace(reEN, (m, p1, p2, p3, p4) => p1 + p2 + p3 + p4 + house);
      // 🛡️ V492/E6: 英文序数格式（7th House）—— 与月锚点分支同口径
      const reENOrd = new RegExp('(' + pname + ')([^\n]{0,16}?)([0-9]+)(?:st|nd|rd|th)( +)(House|Casa|Maison|ภพที่|เรือนที่|Nhà)', 'gi');
      text = text.replace(reENOrd, (m, p1, p2, num, sp, p3) =>
        parseInt(num) !== house ? p1 + p2 + house + sp + p3 : m);
    }
  }
  return text;

}// 校验AI生成的相位描述是否符合天文学规则。
// 星座-相位关系是有限且确定的,用查表法100%拦截错误配对。
function astro_phase_linter(text) {
  if (!text) return text;


  // 相位规则表:12星座,每类相位只能与指定星座形成
  const PHASE_RULES = {
    '对分相':  { '白羊座':'天秤座','天秤座':'白羊座','金牛座':'天蝎座','天蝎座':'金牛座','双子座':'射手座','射手座':'双子座','巨蟹座':'摩羯座','摩羯座':'巨蟹座','狮子座':'水瓶座','水瓶座':'狮子座','处女座':'双鱼座','双鱼座':'处女座' },
    '四分相':  { '白羊座':['巨蟹座','摩羯座'],'金牛座':['狮子座','水瓶座'],'双子座':['处女座','双鱼座'],'巨蟹座':['白羊座','天秤座'],'狮子座':['金牛座','天蝎座'],'处女座':['双子座','射手座'],'天秤座':['巨蟹座','摩羯座'],'天蝎座':['狮子座','水瓶座'],'射手座':['处女座','双鱼座'],'摩羯座':['白羊座','天秤座'],'水瓶座':['金牛座','天蝎座'],'双鱼座':['双子座','射手座'] },
    '三分相':  { '白羊座':['狮子座','射手座'],'狮子座':['白羊座','射手座'],'射手座':['白羊座','狮子座'],'金牛座':['处女座','摩羯座'],'处女座':['金牛座','摩羯座'],'摩羯座':['金牛座','处女座'],'双子座':['天秤座','水瓶座'],'天秤座':['双子座','水瓶座'],'水瓶座':['双子座','天秤座'],'巨蟹座':['天蝎座','双鱼座'],'天蝎座':['巨蟹座','双鱼座'],'双鱼座':['巨蟹座','天蝎座'] },
    '六分相':  { '白羊座':['双子座','水瓶座'],'双子座':['白羊座','狮子座'],'狮子座':['双子座','天秤座'],'天秤座':['狮子座','射手座'],'射手座':['天秤座','水瓶座'],'水瓶座':['射手座','白羊座'],'金牛座':['巨蟹座','双鱼座'],'巨蟹座':['金牛座','处女座'],'处女座':['巨蟹座','天蝎座'],'天蝎座':['处女座','摩羯座'],'摩羯座':['天蝎座','金牛座'],'双鱼座':['摩羯座','巨蟹座'] },
  };
  const SIGN_ZH = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
  const PHASE_ZH = ['对分相','四分相','三分相','六分相'];
  const SIGN_RE = new RegExp(SIGN_ZH.join('|'), 'g');
  const PHASE_RE = new RegExp(PHASE_ZH.join('|'), 'g');
  const lines = text.split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const phaseMatches = [...line.matchAll(PHASE_RE)];
    if (phaseMatches.length === 0) continue;

    const signMatches = [...line.matchAll(SIGN_RE)];
    if (signMatches.length < 2) continue;

    for (const pm of phaseMatches) {
      const phase = pm[0];
      const rules = PHASE_RULES[phase];
      if (!rules) continue;

      // 找离相位词最近的2个星座(不区分前后,中文句式两个星座通常都在前面)
      const sorted = signMatches
        .map(function(m) { return { sign: m[0], idx: m.index, dist: Math.abs(m.index - pm.index) }; })
        .sort(function(a, b) { return a.dist - b.dist; });

      const closest = sorted[0];
      const second = sorted[1];
      if (!closest || !second) continue;

      const signA = closest.sign;
      const signB = second.sign;

      const validForA = rules[signA];
      if (!validForA) continue;

      let isValid = false;
      if (typeof validForA === 'string') {
        isValid = (validForA === signB);
      } else if (Array.isArray(validForA)) {
        isValid = validForA.indexOf(signB) !== -1;
      }

      if (!isValid) {
        console.log('[astro_linter] DETECTED: ' + signA + ' ' + phase + ' ' + signB);
        var validForB = rules[signB];
        var corrected = null;
        if (typeof validForB === 'string') {
          corrected = validForB;
        } else if (Array.isArray(validForB) && validForB.length > 0) {
          corrected = validForB[0];
        }
        if (corrected && corrected !== signA) {
          lines[i] = lines[i].replace(signA, corrected);
          modified = true;
          console.log('[astro_linter] FIXED: ' + signA + ' -> ' + corrected);
        }
      }
    }
  }

  return modified ? lines.join('\n') : text;
}

// DeepSeek Streaming 时常产生「年份重影」:2026年6月2026年6月6月21日
// 本函数暴力清洗所有已知的污染模式
// 🛠️ V97w: 后处理硬替换--逐月检查标题的太阳星座,用锁表修正AI胡编(治本:Prompt锁不住就后门堵死)
function applyMonthLockSanitizer(text, astroMatrix, currentYear = null, currentMonth = null, lang = 'zh') {
  text = forceSpaceHouseSanitizer(text); // 🛠️ V116-final: 空间宫位清洗挂到月度锁内,V1/V2所有清洗路径自动受益
  if (currentMonth === null) currentMonth = new Date().getMonth() + 1;
  if (!text || !astroMatrix || !astroMatrix.months) return text;

  // 🛠️ V106-fix3: 最早期清洗--在任何标题/星座替换之前,先清乱码+修复孤闭括号
  // 这两刀走在 applyMonthLockSanitizer 最前,确保进入主循环前文本已干净
  text = text.replace(/\uFFFD/g, '').replace(/�/g, '');
  // ═══════════════════════════════════════════════════════════
  // 🛠️ V115-fix1: 月度标题全量精准锁(一次性替换12个月,不依赖正则分组)
  // 根因:V114 的 titleRe 只处理 ### 标题,漏了 #### 加粗标题 + 句式变体。
  // 治法:直接遍历12个月,精准替换"年N月:太阳[错误]座"→"年N月:太阳[正确]座"
  // ═══════════════════════════════════════════════════════════
  const _ZS = {Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座'};
  const _sunSignMap = {};
  if (astroMatrix && astroMatrix.months) {
    astroMatrix.months.forEach((m, i) => {
      const sun = _sunOf(m);
      const signZh = _ZS[sun.sign] || sun.sign || '';
      if (!signZh) return;
      const _ym = _v483bMonthYM(m, i, currentYear, currentMonth);   // 🛡️ V483b: 年月真源=month_key
      _sunSignMap[`${_ym.year}年${_ym.month}月`] = signZh;
    });
  }
  Object.keys(_sunSignMap).forEach(key => {
    const correctSign = _sunSignMap[key];
    // 全量替换:key + 冒号/冒号 + 任意内容 + 星座名 → 正确星座名
    // 匹配:2027年6月:/:+ 太阳 + 任意 + 星座名
    const wrongSigns = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
    wrongSigns.forEach(wrong => {
      if (wrong === correctSign) return;
      // Pattern A: 冒号+空格+太阳+任意+星座名(标题格式)
      const reA = new RegExp(`(${key}[::]\s*太阳[^\n]*?)${wrong}`, 'g');
      // Pattern B: 冒号+星座名(简洁标题,如"太阳双鱼座")
      const reB = new RegExp(`(${key}[::]\s*)${wrong}`, 'g');
      text = text.replace(reA, `$1${correctSign}`);
      text = text.replace(reB, `$1${correctSign}`);
    });
  });
  // 通用孤闭括号兜底(无头)→ 清掉;有头括号链交给 natal_sun_linter / V104c 处理
  text = text.replace(/（([^）\n]*?)(?=\n|$)/g, '（$1）');

  const ZH_SIGN = {Aries:'白羊座', Taurus:'金牛座', Gemini:'双子座', Cancer:'巨蟹座', Leo:'狮子座', Virgo:'处女座', Libra:'天秤座', Scorpio:'天蝎座', Sagittarius:'射手座', Capricorn:'摩羯座', Aquarius:'水瓶座', Pisces:'双鱼座'};

  // Build correct entries: [{ key: "2026年7月", sign: "巨蟹座", house: 9 }]
  const entries = [];
  astroMatrix.months.forEach((m, i) => {
    const sun = _sunOf(m);
    const signZh = ZH_SIGN[sun.sign] || sun.sign || '';
    const house = sun.house || '';
    const _ym = _v483bMonthYM(m, i, currentYear, currentMonth);   // 🛡️ V483b: 年月真源=month_key
    entries.push({ year: _ym.year, month: _ym.month, key: `${_ym.year}年${_ym.month}月`, sign: signZh, house, monthIdx: i });
  });

  // Process each month: find the title line and fix the sun sign
  for (const entry of entries) {
    // Target: "2026年7月:太阳[WRONG_SIGN]座[第X宫] · "
    // Replace with: "2026年7月:太阳[CORRECT_SIGN]座第[HOUSE]宫 · "
    const ymEscaped = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 标题锚点死锁:年-月-冒号(含冒号后可选空格)-太阳 起到第一个空格/·/换行之前
    // 统一重注为 太阳{sign}{第house宫},截断时以·或换行为界,保护后续主题文本
    // 🛠️ V106-fix1: 去掉 [^·\n\s] 里的 \s,允许 NBSP/全角空格参与匹配;替换时规范化为"太阳{sign}{house}·"(截断后续)
    const houseStr = entry.house ? `第${entry.house}宫` : '';
    const titleRe = new RegExp(`(${ymEscaped}[::]\s*)太阳[^·\n]*`, 'gi');
    text = text.replace(titleRe, (match, prefix) => {
      // 去掉 match 末尾超过"太阳{sign}{house}"的部分(贪婪匹配吞了主题),只保留标题前缀
      const norm = match
        .replace(/\u00A0/g, ' ')  // 干掉 NBSP
        .replace(/座座/g, '座')    // 干掉重复座
        .replace(/第\d+宫座/g, m => m.replace(/座$/, '')) // 干掉"第N宫座"
        .replace(/\s*·.+$/, '');  // 以 · 为界截断,保护后续
      if (!norm.includes('太阳')) return match; // 🛠️ V206: 守卫-无太阳则原样返回,防止整行被空替换吞掉
      return norm.replace(/太阳.+$/, `太阳${entry.sign}${houseStr}`);
    });



    // 🛠️ V102u: 语言感知标题锁(仅 zh 报告)--AI 偶尔把月度标题写成 "Sun in 巨蟹座第7宫" 等英文/混杂格式,
    // 强制转回中文 "太阳{sign}座第{house}宫",值仍从 SwissEph 死锁(杜绝英文词混进中文报告,且不依赖 AI 听话)。
    if (lang === 'zh') {
      const enTitleRe = new RegExp(`(${ymEscaped}[::]\s*)Sun\s+in\s*[^·\n]{0,30}?(?=\s*[·\n]|$)`, 'gi');
      text = text.replace(enTitleRe, (match, prefix) => {
        return `${prefix}太阳${entry.sign}${houseStr}`;
      });
    }

    // Also fix "太阳进入[WRONG]座" in the body text for same month
    // e.g.: "六月,太阳进入水瓶座" → "六月,太阳进入双子座"
    if (entry.month >= 1 && entry.month <= 12) {
      const monthNames = ['', '一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
      const cnMonth = monthNames[entry.month];
      if (cnMonth) {
        // 🛠️ Issue A fix: 贪婪捕获"6月,太阳/木星/土星在处女座"所有变体
        // 覆盖:太阳在处女座 / 太阳进入处女座 / 太阳行经处女座 / 木星在处女座 等
        const bodyRe = new RegExp(`(${cnMonth}[,,、\s]{0,5})(?:太阳|木星|土星|冥王星|月亮|火星|水星|金星)(?:\s*进入|\s*在|\s*行经|\s*来到|\s*进|\s*抵|\s*位于)?\s*[^座\n]*?座(?:\s*座)?`, 'gi');
        text = text.replace(bodyRe, (match, prefix) => {
          // 提行星名:逐个匹配前缀中的行星关键词
          const planets = ['太阳','木星','土星','冥王星','月亮','火星','水星','金星'];
          let planet = '太阳';
          for (const p of planets) {
            if (match.includes(p)) { planet = p; break; }
          }
          return `${prefix}${planet}进入${entry.sign}`;
        });

        // 🛠️ Issue A fix #2: 英文月份 body - "June, Sun in Virgo" → "June, Sun in Gemini"
        const enMonths = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
        const enMonth = enMonths[entry.month];
        if (enMonth) {
          const enBodyRe = new RegExp(`(${enMonth}[,\s]{0,5})(Sun|Mars|Saturn|Jupiter|Moon|Mercury|Venus|Pluto)(?:\s+in|\s+enters|\s+entering)?\s+[^\n,]{3,30}?(?:sign|座)?`, 'gi');
          text = text.replace(enBodyRe, (m, p, planet) => `${p}${planet} in ${entry.sign}`);
        }
      }

      // 🛠️ V107-fix2: 修复 Peak Window/Black Swan 行星位置幻觉
      // AI 常忽略 SwissEph 数据,用自己的训练知识写行星位置(7月写「太阳在射手座」)
      // 用 astroMatrix 真实数据覆盖 Peak Window 描述中的行星位置
      if (entry.monthIdx !== undefined) {
        const _md = astroMatrix.months[entry.monthIdx];
        if (_md) {
          // 取各行星的真实星座中文名
          const ZH_SIGN_PL = {Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座'};
          const _realSun = ZH_SIGN_PL[_sunOf(_md).sign] || _sunOf(_md).sign || '';
          const _realJup = ZH_SIGN_PL[_md.jupiter?.sign] || _md.jupiter?.sign || '';
          const _realSat = ZH_SIGN_PL[_md.saturn?.sign] || _md.saturn?.sign || '';
          const _realMar = ZH_SIGN_PL[_md.mars?.sign] || _md.mars?.sign || '';
          const _realMerc = ZH_SIGN_PL[_md.mercury?.sign] || _md.mercury?.sign || '';
          const _realVen = ZH_SIGN_PL[_md.venus?.sign] || _md.venus?.sign || '';

          // 找本月份章节(用 entry.key 定位):2026年7月: ...
          // 在章节内做精确的行星际替换:
          const _monthKeyEsc = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const _sectionRe = new RegExp(`(${_monthKeyEsc}[::][\s\S]*?)(太阳|木星|土星|火星|水星|金星|月亮|冥王星)在([白羊金牛双子巨蟹狮子处女天秤天蝎射手摩羯水瓶双鱼]+)座第\\d+宫(?=与|形成|,|\.|。|$)`, 'g');
          text = text.replace(_sectionRe, function(match, prefix, planetChar) {
            // 根据行星名选真实星座
            let realSign = '';
            if ((planetChar === '太阳' || planetChar === 'Sun') && _realSun) realSign = _realSun;
            else if (planetChar === '木星' && _realJup) realSign = _realJup;
            else if (planetChar === '土星' && _realSat) realSign = _realSat;
            else if (planetChar === '火星' && _realMar) realSign = _realMar;
            else if (planetChar === '水星' && _realMerc) realSign = _realMerc;
            else if (planetChar === '金星' && _realVen) realSign = _realVen;
            else if (planetChar === '月亮' && _md.moon?.sign) realSign = _md.moon.sign.replace(/座$/, '') || '';
            if (!realSign) return match; // 没数据不动
            // 提取宫位号
            const _houseMatch = match.match(/第([一二三四五六七八九十百零\d]+)宫/);
            const _house = _houseMatch ? _houseMatch[1] : '';
            const _signCore = realSign.replace(/座$/, '');
            return `${prefix}${planetChar}在${_signCore}第${_house}宫`;
          });

          // 🛠️ V111: 火星相位死循环硬锁(章节隔离 + 真值替换)
          // 根因:AI 在 Black Swan 段写"火星在X座刑克天王星在Y座",长文本复制粘贴到所有月份。
          //       V107-fix2 的 _sectionRe 只锁"X座第N宫"格式,漏了"X座刑克Y座"相位句式 → 跨月死循环。
          // 治本:用 astroMatrix 每月真实火星/天王星星座,按章节隔离替换(不依赖 AI 听话)。
          const ZH_SIGN_PL2 = {Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座'};
          // 🛠️ V115-fix2: 火星/天王星全量真值替换(不依赖段隔离,一次遍历全局替换)
          // 根因:AI 写"火星在狮子座刑克天王星在双子座"跨月复制,sanitizer 段隔离逻辑漏截
          // 治法:读每月真值,全局逐月替换,斩断复读冲动
          // ⚠️ 注意:_wrongZodiacs 在月度循环内定义,此处用 _ZS(月度循环外专用)
          const _wrongZodiacs = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
          if (astroMatrix && astroMatrix.months) {
            const _marsCache = {};
            const _uraCache = {};
            astroMatrix.months.forEach((m2, i2) => {
              const marSign = m2.mars?.sign || m2.positions?.Mars?.sign || '';
              const uraSign = m2.uranus?.sign || m2.positions?.Uranus?.sign || '';
              _marsCache[i2] = ZH_SIGN_PL2[marSign]?.replace(/座$/,'') || marSign.replace(/座$/,'') || '';
              _uraCache[i2] = ZH_SIGN_PL2[uraSign]?.replace(/座$/,'') || uraSign.replace(/座$/,'') || '';
            });
            // 替换:火星在X座 → 火星在当月真值座(只替换"火星在"+非真值+座)
            const _allMarsSigns = Object.values(_marsCache).filter(Boolean);
            const _allUraSigns = Object.values(_uraCache).filter(Boolean);
            _allMarsSigns.forEach(ms => {
              if (!ms) return;
              _wrongZodiacs.forEach(ws => {
                if (ws === ms) return;
                const _mr = new RegExp(`火星在${ws}`, 'g');
                text = text.replace(_mr, `火星在${ms}`);
              });
            });
            _allUraSigns.forEach(us => {
              if (!us) return;
              _wrongZodiacs.forEach(ws => {
                if (ws === us) return;
                const _ur = new RegExp(`天王星在${ws}`, 'g');
                text = text.replace(_ur, `天王星在${us}`);
              });
            });
          }
          const _realMar2 = ZH_SIGN_PL2[_md.mars?.sign] || _md.mars?.sign || '';
          const _realUra2 = ZH_SIGN_PL2[_md.uranus?.sign] || _md.uranus?.sign || '';
          const _marCore = _realMar2.replace(/座$/, '');
          const _uraCore = _realUra2.replace(/座$/, '');
          if (_marCore && _uraCore) {
            const _mkEsc = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const _titleRe = new RegExp('\\n#{2,4}\\s*' + _mkEsc + '[::]');
            const _titleMatch = _titleRe.exec(text);
            if (_titleMatch) {
              const _mkStart = _titleMatch.index;
              const _nextEntry = entries.find(e => e.monthIdx > entry.monthIdx);
              let _mkEnd = text.length;
              if (_nextEntry) {
                const _nextEsc = _nextEntry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const _nextRe = new RegExp('\\n#{2,4}\\s*' + _nextEsc + '[::]');
                const _nextMatch = _nextRe.exec(text.slice(_mkStart + 1));
                if (_nextMatch) _mkEnd = _mkStart + 1 + _nextMatch.index;
              }
              const _section = text.slice(_mkStart, _mkEnd);
              // V112: 鲁棒--章节内所有"火星在X座"和"天王星在Y座"强制真值替换,覆盖所有格式变体(简式/带宫位/带括注)
              let _fixed = _section
                .replace(/火星在[^。\n]*?座/g, `火星在${_marCore}座`)
                .replace(/天王星在[^。\n]*?座/g, `天王星在${_uraCore}座`);
              text = text.slice(0, _mkStart) + _fixed + text.slice(_mkEnd);
            }
          }
        }
      }
    }
  }

  // 🛠️ V112: 头部/尾部 BlackSwan 段硬锁(AI 抽到月度章节外的汇总段,V111 月度隔离漏不掉这里)
  if (astroMatrix && astroMatrix.months && astroMatrix.months.length >= 12) {
    const _marM = {}, _uraM = {};
    astroMatrix.months.forEach((m, i) => {
      if (m?.mars?.sign) _marM[i] = ZH_SIGN[m.mars.sign]?.replace(/座$/, '') || '';
      if (m?.uranus?.sign) _uraM[i] = ZH_SIGN[m.uranus.sign]?.replace(/座$/, '') || '';
    });
    const _mtRe = /#{2,4}\s*\d{4}年\d{1,2}月[::]/g;
    const _titles = [];
    let _mt;
    while ((_mt = _mtRe.exec(text))) _titles.push(_mt.index);
    if (_titles.length) {
      const _process = (seg) => {
        const _dayRe = /\*\*?(\d{4})年(\d{1,2})月(\d{1,2})日[前后]?\*\*?/g;
        const _days = [];
        let _dm;
        while ((_dm = _dayRe.exec(seg))) {
          const _mi = parseInt(_dm[2], 10) - 1;
          if (_mi >= 0 && _mi < 12) _days.push({ idx: _dm.index, mi: _mi });
        }
        if (!_days.length) return seg;
        let _out = '';
        let _last = 0;
        for (let k = 0; k < _days.length; k++) {
          const _d = _days[k];
          const _nextIdx = (k + 1 < _days.length) ? _days[k + 1].idx : seg.length;
          const _s = seg.slice(_last, _nextIdx);
          const _mc = _marM[_d.mi] || '';
          const _uc = _uraM[_d.mi] || '';
          let _sf = _s;
          if (_mc) _sf = _sf.replace(/火星在[^。\n]*?座/g, `火星在${_mc}座`);
          if (_uc) _sf = _sf.replace(/天王星在[^。\n]*?座/g, `天王星在${_uc}座`);
          _out += _sf;
          _last = _nextIdx;
        }
        return _out + seg.slice(_last);
      };
      const _head = _process(text.slice(0, _titles[0]));
      const _tail = _process(text.slice(_titles[_titles.length - 1]));
      text = _head + text.slice(_titles[0], _titles[_titles.length - 1]) + _tail;
      // 汇总段特判:风险(火星在X座):日期 → 用第一个日期月份真值
      text = text.replace(/(风险[^\n（]*?)\（火星在[^。\n]*?座[^。\n]*?）\s*[：:]\s*(\d{4})年(\d{1,2})月(\d{1,2})日/g,
        (m, pre, marsPart, y, mo, d) => {
          const _mi = parseInt(mo, 10) - 1;
          const _mc = _marM[_mi] || '';
          const _uc = _uraM[_mi] || '';
          let _nm = marsPart;
          if (_mc) _nm = _nm.replace(/火星在[^。\n]*?座/, `火星在${_mc}座`);
          if (_uc) _nm = _nm.replace(/天王星在[^。\n]*?座/, `天王星在${_uc}座`);
          return `${pre}(${_nm}):${y}年${mo}月${d}日`;
        });
    }
  }

  // 🛠️ V108-fix3: 6月标题本命魂穿兜底--当 AI 在6月写了本命太阳而非双子座时强制纠正
  // 🛠️ V108-fix5: Gemini 输出的 "Sun in 双子座第X宫" 格式转为 "太阳双子座第X宫"
  if (lang === 'zh') {
    text = text.replace(/(2027年6月[::]\s*)太阳(?!双子座)[^·\n座]*座/g, '$1太阳双子座');
    // 修复 Gemini 输出的 "Sun in X座" 格式(全部12个月)
    text = text.replace(/(\d{4}年\d{1,2}月[::]\s*)Sun\s+in\s+([^·\n]{1,10})(?=\s*[·\n]|$)/g, '$1太阳$2');
  }

  // ═══ V114-fix: 月度天文星座强锁(治Gemini偷懒/换座期幻觉)═══
  // 根因:AI写正文时,遇到换座期/长文本后半段,偷懒套已生成的星座模式
  //        applyMonthLockSanitizer 的正则只匹配"太阳进入X座"等标准格式,
  //        漏了"太阳在X座"/"X座能量"/"当你看到X座"等变体 → 月度星座错乱
  // 解法:章节隔离--以月度标题为锚,正文里所有出现"X座"的句子里,
  //        若X座≠标题星座 → 强制替换为标题星座(不限格式/句式)
  try {
    const _all12 = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
    // 按月份章节切分
    const _secs2 = text.split(/(?=###\s*\d{4}年\d{1,2}月)/g);
    const _fixed2 = _secs2.map(_sec => {
      // 提取当月标题星座
      const _tm = _sec.match(/###\s*\d{4}年\d{1,2}月\s*[::]\s*太阳([^\s·\n]+座)/);
      if (!_tm) return _sec;
      const _correctSign = _tm[1]; // 如"射手座"
      const _signCore = _correctSign.replace('座','');
      // 定位正文(跳过标题行)
      const _ti = _sec.indexOf('\n', _sec.indexOf('###'));
      if (_ti < 0) return _sec;
      const _hdr2 = _sec.substring(0, _ti + 1);
      let _bod = _sec.substring(_ti + 1);
      // 遍历正文里所有 12 星座,把不是标题星座的强制替换
      // 但排除"本命太阳在X座"/"你的太阳在X座"等本命句式(那是 natal_sun_linter 的活)
      // 简单策略:正文里出现"星座"+"[WRONG]座"→"[CORRECT]座"
      // 更精准:找"太阳在X座"/"太阳进入X座"/"[星座名]座的"等月度语境
      for (const _ws of _all12) {
        if (_ws === _correctSign) continue;
        const _wc = _ws.replace('座','');
        // 跳过含"本命"/"你的"/"此人"/"之人"的行(那是本命语境,不归这里管)
        const _skipLinePat = /(本命太阳|你的太阳|此人|之人|星座是|属于)/;
        const _lines = _bod.split('\n');
        const _newLines = _lines.map(_ln => {
          if (_skipLinePat.test(_ln)) return _ln;
          if (!_ln.includes(_ws)) return _ln;
          // 替换:太阳在[WRONG]座 / 太阳进入[WRONG]座 / [WRONG]座能量 / [WRONG]座的光芒
          return _ln
            .replace(new RegExp('太阳在' + _ws, 'g'), '太阳在' + _correctSign)
            .replace(new RegExp('太阳进入' + _ws, 'g'), '太阳进入' + _correctSign)
            .replace(new RegExp('太阳行经' + _ws, 'g'), '太阳行经' + _correctSign)
            .replace(new RegExp(_ws + '能量', 'g'), _correctSign + '能量')
            .replace(new RegExp(_ws + '的光芒', 'g'), _correctSign + '的光芒')
            .replace(new RegExp('进入' + _ws, 'g'), '进入' + _correctSign)
            .replace(new RegExp('看到' + _ws, 'g'), '看到' + _correctSign);
        });
        _bod = _newLines.join('\n');
      }
      return _hdr2 + _bod;
    });
    text = _fixed2.join('');
  } catch(e) {
    console.warn('[MonthAstroLock] failed:', e.message);
  }

  // 🛠️ V207: 修复 AI 把 ) 吞进正文导致的 dangling 开括号
  // 例:（第6宫逆行 → （第6宫）逆行  /  （第7宫与木星 → （第7宫）与木星
  text = text.replace(/（第([一二三四五六七八九十百零\d]+)宫(?!）)/g, '（第$1宫）');

  return text;
}

// 🛠️ V189: 消费陷阱标头清洗 + 括号兜底修复（双路径共享）
// 消费陷阱: 裸行/有✦无[]/有[]缺格式 → 统一 ✦\n[⚠️ 消费陷阱：YYYY年M月]
// 括号: (第X）宫 → (第X宫)
// 🛠️ V214: 周次颜色强制规范化（所有语言，HIT+MISS 路径共用）
// 周次标准色: 1=🟢(充能) 2=🔴(熔断) 3=🔵(蓄力) 4=🟢(爆发)
// AI 偶发用错 emoji(⚠️/🔥/🟢混用)，按周次序号强制覆盖
// 🛠️ V214: 周次颜色强制规范化（所有语言，HIT+MISS 路径共用）
// 周次标准色: 1=🟢(充能) 2=🔴(熔断) 3=🔵(蓄力) 4=🟢(爆发)
// V214d-fr-fix: 无括号的 ✦ Semaine/Semana 行补方括号+颜色
// 消费陷阱[⚠️ ...]和Overview[🔮 ...]不含 Week/第N周 关键词，不会误伤
  // V215: 全语言周次颜色规范化（隔离测试 21/21 通过）
  // 全局常量：数字→标准色、泰文数字映射、非标准 emoji 黑名单
  const _STD_COLOR = {1:'🟢', 2:'🔴', 3:'🔵', 4:'🟢'};
  const _TH_MAP = {'๐':0,'๑':1,'๒':2,'๓':3,'๔':4,'๕':5,'๖':6,'๗':7,'๘':8,'๙':9};
  const _BAD_EMOJI = ['🕰','🌿','🔥','💎','💜','💙','⚡','🌙','☀️','🎯','📊','💫','🌟','⭐','💰','🟡'];

  function _cleanEmoji(str) {
    let s = str;
    for(const e of _BAD_EMOJI) s = s.split(e).join('');
    // V383-fix: 移除 _cleanEmoji 的 standalone \uFE0F strip(影响非坏emoji如🔮)
    s = s.replace(/⚠(?!️)/g, '⚠️');
    return s;
  }

  function _replaceFirstWithColor(str, newColor) {
    let s = _cleanEmoji(str);
    const m = /^[^\w\u4e00-\u9fff\u0e00-\u0e7f]*/u.exec(s);
    if (m && m[0].length > 0) s = newColor + ' ' + s.slice(m[0].length);
    else s = newColor + ' ' + s;
    return s.trim();
  }

  function _extractWeek(str) {
    const zhW = /第\s*(\d+)\s*周/.exec(str);
    if (zhW) return parseInt(zhW[1]);
    const thW = /สัปดาห์ที่\s*([๑๒๓๔๕๖๗๘๙\d]+)/.exec(str);
    if (thW) {
      let tn=''; for(const c of thW[1]) tn += _TH_MAP[c]!==undefined ? _TH_MAP[c] : c;
      return parseInt(tn)||null;
    }
    const enW = /(?:Week|Semana|Semaine|Tuần)\s+(\d+)\b/.exec(str);
    if (enW) return parseInt(enW[1]);
    return null;
  }

  // ✅ 精准：trimStart 后检测第一个非空白字符
  function _hasStdColor(str) {
    const s = str.trimStart();
    return s.startsWith('🟢') || s.startsWith('🔴') || s.startsWith('🔵') || s.startsWith('⚠️');
  }

  function fixWeekHeaderColors(text) {
    if (!text) return text;
    text = text.replace(/\*\*/g, '');
    return text.split('\n').map(line => {
      let l = line.trimEnd();
      l = l.replace(/^##\s*/, '');
      let star = false;

      if (l.startsWith('\u2726')) { star = true; l = l.slice(1).trimStart(); }

      const fb = l.indexOf('[');
      const lb = l.lastIndexOf(']');
      if (fb !== -1 && lb !== -1 && lb > fb) {
        const inner = l.slice(fb + 1, lb);
        const after = l.slice(lb + 1); // keep leading spaces
        const n = _extractWeek(inner);
        const needsRewrite = n && _STD_COLOR[n] && !_hasStdColor(inner);

        let newInner;
        if (needsRewrite) newInner = _replaceFirstWithColor(inner, _STD_COLOR[n]);
        else newInner = _cleanEmoji(inner);

        const prefix = fb > 0 ? l.slice(0, fb) : '';
        let result = prefix + '[' + newInner + ']' + after;
        if (star) result = '\u2726 ' + result;
        return result;
      }

      // 无括号：✦ Semaine 2: ...
      const m = /^(Semaine|Semana)\s+(\d+)\s*:\s*(.+)/.exec(l);
      if (m) {
        const c = _STD_COLOR[parseInt(m[2])]||'🔵';
        const prefix = star ? '\u2726 ' : '';
        return prefix + '[' + c + ' ' + m[1] + ' ' + m[2] + ': ' + m[3] + ']';
      }
      return l;
    }).join('\n');
  }

function guardWeekDateDrift(text) {
  if (!text) return text;
  // V215-i18n: 扩展四语种月份（西/法/泰）；越南语 ThgN 单独解析
  const MONTHS = {
    jan:1,january:1,feb:2,february:2,mar:3,march:3,apr:4,april:4,may:5,jun:6,june:6,jul:7,july:7,aug:8,august:8,sep:9,sept:9,september:9,oct:10,october:10,nov:11,november:11,dec:12,december:12,
    ene:1,enero:1,feb:2,febrero:2,mar:3,marzo:3,abr:4,abril:4,may:5,mayo:5,jun:6,junio:6,jul:7,julio:7,ago:8,agosto:8,sep:9,septiembre:9,oct:10,octubre:10,nov:11,noviembre:11,dic:12,diciembre:12,
    janv:1,janvier:1,fév:2,fev:2,février:2,fevrier:2,mars:3,avr:4,avril:4,mai:5,juin:6,juil:7,juillet:7,août:8,aout:8,sept:9,septembre:9,oct:10,octobre:10,nov:11,novembre:11,déc:12,dec:12,décembre:12,decembre:12,
    'ม.ค.':1,'มกราคม':1,'ก.พ.':2,'กุมภาพันธ์':2,'มี.ค.':3,'มีนาคม':3,'เม.ย.':4,'เมษายน':4,'พ.ค.':5,'พฤษภาคม':5,'มิ.ย.':6,'มิถุนายน':6,'ก.ค.':7,'กรกฎาคม':7,'ส.ค.':8,'สิงหาคม':8,'ก.ย.':9,'กันยายน':9,'ต.ค.':10,'ตุลาคม':10,'พ.ย.':11,'พฤศจิกายน':11,'ธ.ค.':12,'ธันวาคม':12
  };
  const DAYS = {1:31,2:28,3:31,4:30,5:31,6:30,7:31,8:31,9:30,10:31,11:30,12:31};
  // 行星名覆盖英/法/泰/越（西语复用英文名）
  const PLANETS = 'Mercury|Venus|Mars|Sun|Moon|Jupiter|Saturn|Vénus|Mercure|Saturne|Lune|Soleil|ดาวพุธ|ดาวศุกร์|ดาวอังคาร|ดวงอาทิตย์|ดวงจันทร์|ดาวพฤหัส|ดาวเสาร์|Sao Thủy|Sao Kim|Sao Hỏa|Mặt Trời|Mặt Trăng|Sao Mộc|Sao Thổ';
  // V215-i18n: 月份词精确列表（转义正则特殊字符，含泰语点），避免 (\S+) 贪婪捕获过多
  const MT = Object.keys(MONTHS).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  function monthNum(tok) {
    if (!tok) return null;
    const t = String(tok).toLowerCase().replace(/[.,;:]+$/, ''); // 去尾点/标点（julio. → julio）
    if (MONTHS[t] !== undefined) return MONTHS[t];
    // 🛠️ V215-th-dot-fix: Thai abbrevs like ก.ค. lose trailing dot in t; check raw tok too
    if (MONTHS[tok] !== undefined) return MONTHS[tok];
    const m = t.match(/^thg\s*(\d+)$/); // 越南语 Thg7 = Tháng 7
    if (m) return parseInt(m[1], 10);
    return null;
  }
  function inRange(evM, evD, sM, sD, eM, eD) {
    return (evM === sM && evD >= sD && evD <= eD) ||
           (sM !== eM && ((evM === sM && evD >= sD) || (evM === eM && evD <= eD)));
  }
  const segs = text.split(/(?=✦)/);
  return segs.map(seg => {
    // V215-i18n: 周次标题支持 Week/Semana/Semaine/Tuần/第N周/สัปดาห์ที่ + 四语种月份 token
    const hm = seg.match(/\[(🟢|🔴|🔵|⚠️)?\s*(?:Week|Semana|Semaine|Tuần|สัปดาห์ที่)\s*(\d+)\s*[:：]\s*(\S+)\s+(\d+)\s*[–-]\s*(?:(\S+)\s+)?(\d+)/i);
    if (!hm) return seg;
    const sM = monthNum(hm[3]);
    const sD = parseInt(hm[4], 10);
    const eM = hm[5] ? monthNum(hm[5]) : sM;
    const eD = parseInt(hm[6], 10);
    if (!sM) return seg;
    let drifted = false, m;
    // 月+日（英）：Planet ... Month DD
    const mdRe = new RegExp('(' + PLANETS + ')[^\\n]{0,40}?(' + MT + ')\\s+(\\d+)', 'gi');
    while ((m = mdRe.exec(seg)) !== null) {
      const evM = monthNum(m[2]);
      if (!evM) continue;
      let evD = parseInt(m[3], 10);
      if (evD > DAYS[evM]) evD = DAYS[evM];
      if (!inRange(evM, evD, sM, sD, eM, eD)) { drifted = true; break; }
    }
    // 日+月（西/法/泰）：Planet ... DD (de|วันที่) Month
    if (!drifted) {
      const dmRe = new RegExp('(' + PLANETS + ')[^\\n]{0,40}?(\\d+)\\s+(?:de\\s+|วันที่\\s+)?(' + MT + ')', 'gi');
      while ((m = dmRe.exec(seg)) !== null) {
        const evM = monthNum(m[3]);
        if (!evM) continue;
        let evD = parseInt(m[2], 10);
        if (evD > DAYS[evM]) evD = DAYS[evM];
        if (!inRange(evM, evD, sM, sD, eM, eD)) { drifted = true; break; }
      }
    }
    // 越南语：Planet ... ngày DD tháng MM
    if (!drifted) {
      const viRe = new RegExp('(' + PLANETS + ')[^\\n]{0,40}?ngày\\s+(\\d+)\\s+tháng\\s+(\\d+)', 'gi');
      while ((m = viRe.exec(seg)) !== null) {
        let evM = parseInt(m[3], 10), evD = parseInt(m[2], 10);
        if (evD > DAYS[evM]) evD = DAYS[evM];
        if (!inRange(evM, evD, sM, sD, eM, eD)) { drifted = true; break; }
      }
    }
    if (drifted) {
      // 🛠️ V441-fix: 日期漂移检测仅记日志、绝不注入用户文本（旧版会把调试标记 ⚠️ 日期校准 写进生产报告）
      console.warn(`[V215-datecalib] week date drift detected, header="${hm[0]}" (debug-only, not injected into output)`);
    }
    return seg;
  }).join('');
}


// 🛡️ V222z-fix14: 越南语 DeepSeek 词边界编码缺陷后处理补偿
// 根因: DeepSeek 模型对越南语词边界处理有编码缺陷（空格被模型吞掉）
//       trình tài → trìnhài / của cải → củaải / những nỗi → nhữngỗi 等
// 修复: NFD 归一化 + 空格锚点 split-join，精确替换已知损坏模式
// 🛠️ V380-fix: 升级为通用正则+扩展硬编码列表，根治所有"辅音首字母粘连"模式
// 根因: _safeChunk 字节截断破坏多字节UTF-8字符，本函数做最后防线兜底
// 检测: 越南语声调元音字母紧跟辅音字母，中间无空格
// V382-fix: 全面覆盖辅音双写+元音粘连模式，根治所有越南语吞字Bug
// 模式1: 辅音尾双写(first word ends with X, second starts with X) → 加空格
// 模式2: 元音+元音粘连(含辅音被吸收) → 还原辅音+空格
// 模式3: 实测案例兜底
// 🛠️ V395: 极简确定性后置清洗器(主公军令·零误伤/无吞字)
//   只做 1:1 精准替换(金额+标题),绝不碰正文单词;拼写/变音修复彻底废除(靠 Prompt 源头 + StringDecoder 传输根治)
//   金额正则覆盖所有百万级越界(含 X.500.000),1:1 替换零误伤正确阈值 ₫500,000
// 🛠️ V396: 极简 1:1 精准替换（金额越界 + 缺失型 + 标题格式）
function fixViReportSanitize(text) {
  if (!text) return text;
  const _now = new Date();
  const _mLabel = getMonthLabel('vi', _now.getFullYear(), _now.getMonth() + 1);
  let t = text;
  // 🛠️ V414-fix: 外币金额(USD/US$/đô la/đô)一律归一为本地风控阈值 ₫500,000
  //   根因: 下方「金额越界」正则按【面值】比较(≥500000 才替换),"2.000 USD"/"1.500 đô la" 面值 < 500000 → 漏网,
  //   越南语月报陷阱段裸奔美元金额(本地应为 VND)。此处先做币种归一,再做面值兜底。
  //   ⚠️ V415-fix: 越南语「đô la」必须一并覆盖;且 đ/ô 不属于 \w,
  //   原 `\b...\b` 在 "đô la" 上边界恒不成立(数字与 đ 之间无 word boundary) —— 改用 lookbehind/lookahead。
  t = t.replace(/(?:\$|US\$)\s?\d[\d.,]*|(?<![\d.,])\d[\d.,]*\s?(?:\$|US\$)|(?<![\d.,])\d[\d.,]*\s*(?:US\$|USD|đô\s*la(?:\s*Mỹ)?|đô|Mỹ\s*kim)(?![\p{L}\p{N}])/giu, '500.000 ₫');
  // ── 1. 金额越界替换（千分位格式：X.000 / X.000.000）──
  // 🛠️ V396: 极简确定性替换—— ONLY 1:1 数字格式归一 + 固定标题字符串替换。
  //    绝不触碰任何正文单词（废除所有修正拼写/变音符号的模糊正则，根治“吞字”）
  t = t.replace(/\b([1-9]\d{0,2}(?:,\d{3}){1,}(?:[.,]\d{3})?|\d{1,3}[.,]\d{3}[.,]?\d*)(?:\s*(?:VND|VN?Đ|đồng|₫))?/gi,
    (m) => {
      const _n = parseInt(m.replace(/\D/g, ''), 10);
      if (_n >= 500000) return '500.000';
      return m;
    });
  // ── 2b. 越南语 triệu đồng（×1,000,000）──
  t = t.replace(/\b(\d+)\s*triệu(?:\s*(?:đồng|₫))?/gi,
    (m) => {
      const _n = parseInt(m.match(/\d+/)[0], 10) * 1000000;
      if (_n >= 500000) return '500.000';
      return m;
    });
  // ── 3. 标题格式标准化 ──
  // 🛠️ V407-fix: 主标题大小写全匹配(Đ/đ 混淆)——不区分大小写
  t = t.replace(/^(Chủ đề vận mệnh tháng)/mi, '✦ [🔮 Chủ đề Vận mệnh Tháng]');
  // 🛠️ V407-fix2: 周标题修复——DeepSeek 偶发省去开头 ✦ 或 emoji，三种模式兜底
  // 模式A: ✦ [🟢 Tuần 1:...] 已有格式，补全 ✦ 前缀
  t = t.replace(/^\[((?:🟢|🔴|🔵)\s+Tuần \d+:[^\]]+\])/gm, '✦ [$1');
  // 模式B: ✦ Tuần 1: Thg9 1–7] 无 [ 开头，补全 ✦ [emoji
  t = t.replace(/^✦\s+((?:🟢|🔴|🔵)\s+Tuần \d+)/gm, '✦ [$1');
  // 模式C: Tuần 1: Thg9 1–7] 完全无 ✦ 和 emoji，直接补全
  t = t.replace(/^(?!✦)(\[?\s*Tuần \d+:[^\n]+)/gmi, '✦ [🟢 $1');
  // 陷阱段格式
  t = t.replace(/\[⚠️ (?:Bẫy Chi Tiêu|Cạm bẫy Tài chính):?[^\]]*\]/gi, '✦ [⚠️ Cạm bẫy Tài chính: ' + _mLabel + '] ✦');
  // ── 4. 金额越界替换(治本:不碰任何其他数字，只替换风险阈值 500,000)──
  // 🛠️ V407-fix3: 根治金额替换丢失 ₫ 符号——回调必须返回含 ₫
  t = t.replace(/\b([1-9]\d{0,2}(?:,\d{3}){1,}(?:[.,]\d{3})?|\d{1,3}[.,]\d{3}[.,]?\d*)(?:\s*(?:VND|VN?Đ|đồng|₫))?/gi,
    (m) => {
      const _n = parseInt(m.replace(/\D/g, ''), 10);
      if (_n >= 500000) return '500.000 ₫';
      return m;
    });
  t = t.replace(/\b(\d+)\s*triệu(?:\s*(?:đồng|₫))?/gi,
    (m) => {
      const _n = parseInt(m.match(/\d+/)[0], 10) * 1000000;
      if (_n >= 500000) return '500.000 ₫';
      return m;
    });
  // ── 🛠️ V420: 同值括号冗余折叠 —— 金额归一后两端变同值，会打出 "500.000 ₫ (khoảng 500.000 ₫)" 的打结式重复
  t = t.replace(/([\d][\d.,]*)\s*₫\s*\(\s*(?:khoảng|tầm|chừng|≈|~)?\s*([\d][\d.,]*)\s*₫?\s*\)/gi,
    (m, a, b) => {
      const _a = parseInt(String(a).replace(/[.,]/g, ''), 10);
      const _b = parseInt(String(b).replace(/[.,]/g, ''), 10);
      return (_a && _b && _a === _b) ? _a.toLocaleString('de-DE') + ' ₫' : m;
    });
  // 🛡️ V411-fix4: vi月报陷阱段必含 ₫500,000 风险阈值——军师军令(无金额则追加权威声明行72h冷静期)
  //   仅对完整报告(>3000字)生效,避免流式分片(<500字)误触发;幂等(已含₫500,000则跳过)
  if (t.length > 3000 && /Cạm\s*bẫy\s*Tài\s*chính|Bẫy\s*Chi\s*Tiêu/i.test(t) && !/500\.000\s*₫|₫500\.?000/i.test(t)) {
    const _thresh = '\n\n⚠️ Ngưỡng rủi ro khuyến nghị: mọi quyết định tài chính trên ₫500,000 cần ít nhất 72 giờ để cân nhắc kỹ lưỡng trước khi hành động.';
    const _ti = t.search(/✦\s*\[\s*⚠️\s*(?:Cạm bẫy Tài chính|Bẫy Chi Tiêu)/i);
    if (_ti >= 0) {
      const _ns = t.indexOf('✦', _ti + 10);
      t = (_ns > 0 ? t.slice(0, _ns) + _thresh + '\n\n' + t.slice(_ns) : t + _thresh);
    } else {
      t = t + _thresh;
    }
  }
  // 🛠️ V415-fix2: 区间退化收敛——模型写"X đến Y"区间且两端均≥阈值时,归一后撞成同值
  //   ("khoảng 500.000 ₫ đến 500.000 ₫"),语义上应折叠为单值。其他值因<500000 未被改动,故只需处理阈值自身。
  t = t.replace(/(500\.000\s*₫)\s*(?:đến|tới|–|—|~|-|đến mức|hoặc|hay|hoặc là)\s*500\.000\s*₫/gi, '$1');
  // 🛠️ V414-fix2: 收尾补空格——模型偶发把 "₫" 与下个单词粘连(500.000₫cho),补一个空格防粘连
  t = t.replace(/₫(?=[\p{L}])/gu, '₫ ');
  // 🛠️ V407-fix4: 末尾必须有 return t;(原 V396 漏写导致越南语报告变 undefined)
  return t;
}
function fixVietnameseCorruption(text) {
  return fixViReportSanitize(text);
}

// ── 🛠️ V421: 越南语本命盘真值硬锁（军令 P0 收口）────────────────────────
// 病根2（Prompt 软约束的天花板）：即使把 NATAL CHART ANCHORS 真值注进 prompt，实测仍会漂：
//   ① 1990-08-05 本命月亮 Ma Kết 第5宫 → 首句写对 Nhà 5，后续 5 句漂成 Nhà 8
//   ② 1992-03-17 本命月亮 Xử Nữ 第4宫 → 被写成与太阳同座的 Song Ngư Nhà 5
// 修法：用 SwissEph 真值做确定性后置替换（与 enforceRiskThreshold 同挂载点，HIT/MISS × stream/非stream）。
// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ V423: 10 行星本命真值锁（日月水金火木土天海冥 · 星座 + 宫位）
//   设计要点（全部是踩坑换来的，改这里前先读 test/audit-natal-truth-lock.test.js）：
//   ① 单次归因扫描：每个「本命锚点」只改【它自己的从句】，从架构上杜绝多任务互踩
//      （V421 血泪：泛化太阳任务跨句把月亮正确的 Nhà 4 改写成太阳的 Nhà 11）
//   ② 从句边界 = 句读 / 连词(và,với,cùng,trong khi,…) / 其他星体名 / 流月动词
//   ③ 流月(transit)描述绝不改：非显式 natal 锚点必须含「của bạn|natal」且无流月动词
//   ④ 回看段含流月动词 → 整段弃用（其星座/宫位属于流月，不是本命）
//      V421 血泪：「Sao Hỏa transit ở Cự Giải Nhà 1 chiếu vào Mặt Trăng natal của bạn ở …」，
//      回看段里的 Nhà 1 是火星流月的，被误算给月亮
//   ⑤ 改动区右界一律用【原长度】定位（V421 血泪：用改后长度切尾 → 掉字/重字）
//   ⑥ 校验器与之对称：test/verify_report_truth.py 用同一套从句归因（锁和检查表同源，防口径漂移）
// ═══════════════════════════════════════════════════════════════════════════
const _EN2ZIDX = { Aries:0,Taurus:1,Gemini:2,Cancer:3,Leo:4,Virgo:5,Libra:6,Scorpio:7,Sagittarius:8,Capricorn:9,Aquarius:10,Pisces:11 };
const _VI_TRANSIT_MARK = /di chuyển qua|quá cảnh|transit|đi qua|đi vào|bước vào|luân chuyển|chuyển sang/i;
const _VI_BODY_SPLIT = /(?:^|\s)(?:Mặt|Sao|Hành|Thiên Vương|Hải Vương|Diêm Vương)\s/;
const _VI_CLAUSE_BREAK = /[.;,!?:()\n]|\s(?:và|với|nhưng|song|trong khi|đồng thời|khi|cùng)\s/gi;

// ── V424: 泰语本命真值锁（镜像 V421/V423 越南语锁，泰语无显式 natal 标记，用 transit 动词排除）
const _TH_PLANET = {
  Sun: 'ดวงอาทิตย์', Moon: 'ดวงจันทร์', Mercury: 'ดาวพุธ', Venus: 'ดาวศุกร์', Mars: 'ดาวอังคาร',
  Jupiter: 'ดาวพฤหัสบดี', Saturn: 'ดาวเสาร์', Uranus: 'ดาวยูเรนัส', Neptune: 'ดาวเนปจูน', Pluto: 'ดาวพลูโต',
};
const _TH_PLANET_ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
let _TH_SIGN_UNIQ_CACHE = null;
const _TH_SIGN_UNIQ = () => (_TH_SIGN_UNIQ_CACHE ||= SUN_SIGN_TH.filter((s,i,a) => a.indexOf(s)===i));
// 泰语流月动词（遇这些词 → 明确是 transit，不归入本命）
// 🛠️ V424-fix7: โคจร(本轮周期="การโคจรครั้งนี้")、ออกจาก(逃离陷阱="ออกจากกับดัก") 是 natal 隐喻，非 transit 移动动词，移除以防 natal 句被误杀跳过
const _TH_TRANSIT_MARK = /ทรานซิส|ผ่าน|เคลื่อน|เดินทาง|ย้าย|ขึ้น|ลง|เข้าสู่/i;
// 泰语句末标点
const _TH_CLAUSE_BREAK = /[.!:ๆ๋\n]/g;
// 泰语身体句（行星出现即截断归因窗口，避免把别的行星数据归到本锚点上）
const _TH_BODY_ANY = /ดวงอาทิตย์|ดวงจันทร์|ดาวพุธ|ดาวศุกร์|ดาวอังคาร|ดาวพฤหัสบดี|ดาวเสาร์|ดาวยูเรนัส|ดาวเนปจูน|ดาวพลูโต/;
// 泰语节点轴（遇轴短语截断，防止轴星座被误判成本命；镜像 _VI_AXIS）
const _TH_AXIS = /คู่แกน|แกน|ระหว่าง/;

// 泰语真值表：行星名 → {sign, house}
function _natalTruthMap10_TH(astroMatrix) {
  const meta = astroMatrix?.meta || {};
  const ch = meta.computed_houses || {};
  const map = {};
  for (const p of _TH_PLANET_ORDER) {
    const info = (p === 'Moon' ? (meta.natal_moon || ch.Moon) : ch[p]) || null;
    if (!info) continue;
    const signEN = info.sign || (p === 'Sun' ? meta.sun_sign : null);
    const idx = _EN2ZIDX[signEN];
    const sign = idx != null ? SUN_SIGN_TH[idx] : null;
    const house = Number(info.house) || 0;
    if (sign || house) map[_TH_PLANET[p]] = { sign, house };
  }
  return map;
}

// 泰语从句归因窗口（镜像 _viClause，无显式 natal 标记，用 transit 动词排他）
// 🛠️ V424-fix2: 改逻辑——无 transit 动词即接受（泰国月报句型多无显式 transit 标记，
//  本命与流月混写，用 transit 排除保护更可靠）。
//  接受条件：无 transit 动词（显式标记不强制要求）。
function _thClause(text, i, len) {
  const aEnd = i + len;
  // 先找前向从句（含锚点后 90 字）
  let fwd = text.slice(aEnd, aEnd + 90);
  const e = fwd.search(_TH_CLAUSE_BREAK);
  if (e >= 0) fwd = fwd.slice(0, e);
  // 核心规则：含 transit 动词 → 明确流月，拒绝；无 transit → 接受
  if (_TH_TRANSIT_MARK.test(fwd)) return null;
  // 节点轴截断（镜像 V423-fix-node-axis）
  const axisIdx = fwd.search(_TH_AXIS);
  if (axisIdx >= 0) fwd = fwd.slice(0, axisIdx);
  // 前段：70 字内；含 transit 动词 → 整段弃用；否则切到首个其他行星名之前
  let bwd = text.slice(Math.max(0, i - 70), i);
  if (_TH_TRANSIT_MARK.test(bwd)) {
    bwd = '';
  } else {
    let lo = 0;
    for (const m of bwd.matchAll(_TH_CLAUSE_BREAK)) lo = Math.max(lo, m.index + m[0].length);
    const bm = bwd.search(_TH_BODY_ANY);
    bwd = bwd.slice(lo, bm >= 0 ? Math.max(lo, bm) : bwd.length);
  }
  return { fwd, bwd };
}

// 泰语单段替换（镜像 _viPatchZone）
function _thPatchZone(zone, sign, house, preferFirst, text, absBase) {
  let z = zone, ch = 0;
  const log = [];
  if (sign) {
    let best = null;
    for (const s of _TH_SIGN_UNIQ()) {
      if (s === sign) continue;
      const idx = preferFirst ? z.indexOf(s) : z.lastIndexOf(s);
      if (idx < 0) continue;
      // ⚠️ V436 守卫挂此处会误杀本命真星座引用（th/vi natal/transit 锁的星座是行星-星座直接关联，
      //   不是月名中的日期词）；已回滚，仅保留参数以兼容调用方。
      if (false && text != null && absBase != null && _v436InThMonth(text, absBase + idx, s.length)) continue;
      if (best === null || (preferFirst ? idx < best.idx : idx > best.idx)) best = { idx, s };
    }
    if (best) { z = z.slice(0, best.idx) + sign + z.slice(best.idx + best.s.length); ch++; log.push(`เบอร์ ${best.s}→${sign}`); }
  }
  if (house) {
    // 🛠️ V424-fix3: 三种宫位格式全认：เรือนที่ X / บ้าน X / (ภพที่ X)
    const re = /(?:เรือนที่|บ้าน|ภพที่)\s*(\d+)|\((?:ภพที่)\s*(\d+)\)/g;
    let target = null, m;
    while ((m = re.exec(z)) !== null) {
      if (preferFirst) { target = m; break; } target = m;
    }
    if (target) {
      const oldNum = Number(target[1] || target[2]);
      if (oldNum !== house) {
        // 保留原始前缀格式
        const prefix = target[0].replace(/\d+/, '');
        z = z.slice(0, target.index) + (prefix + house) + z.slice(target.index + target[0].length);
        ch++; log.push(`เรือน ${oldNum}→${house}`);
      }
    }
  }
  return { text: z, count: ch, log };
}

// ═══ 🛡️ E15/R11f-3（偏移坐标系铁律 · 第 3 例）: 命中区间去交叉 ═══
// 病根（2026-10-04 es 盘 Ushuaia 实证）: 同一段里两个行星的窗口可以【相交】——
//   `Júpiter, el gran benefactor, se encuentra en Géminis en tu 5ª Casa** — la misma casa que
//    ocupa tu tu Sol.` 中，Júpiter 的 fwd 窗口 [2459,2552) 与 Sol 的 bwd 窗口 [2483,2553)
//   相交（Sol 的 bwd 回溯越界，吃进了上一句 Júpiter 的从句）。
//   E13 的「命中区间倒序应用」只解决了【不相交】区间的失效问题；一旦相交，先应用者（靠后那个，
//   Sol 的 bwd，Géminis→Cáncer 使串长 −1）改变了串长，后应用者（Júpiter 的 fwd）右界立即失效
//   ⇒ 实测 `T1[2552)` 取到 'S' 而非空格 ⇒ `tu tu ` + `Sol` = `tu tuSol`（凭空吃掉 1 个空格 = artifact）。
//   ⇒ 铁律补充：凡「多段替换 + 区间坐标」，命中区间还必须【两两不相交】，否则坐标体系根本不成立。
// 处置（保守 · 宁漏不改 · 绝不编）: 按左界升序扫描，只接受与已接受区间不相交的命中；相交者整条丢弃并计数。
//   语义依据：先起者 = 从自己行星名开始的合法窗口（fwd 必起于本从句）；后起者多为 bwd 回溯越界侵入了前一句
//   ⇒ 丢弃它即丢弃「越界污染」（实测被丢弃的 Sol bwd 会把 Júpiter 从句的 Géminis 伪造成 Cáncer，
//   且其 house 修正在先起者的窗口内已被覆盖 ⇒ 零功能损失）。
// 零回归保证：完全无相交时（生产绝大多数盘）返回的数组与输入逐元素相同 ⇒ 下游行为逐字节一致。
// ⚠️ 语义边界：本函数是**纯过滤器**（只丢弃，不重排、不改写 hit 内容）——返回数组保持【入参顺序】。
//   若在此处顺带排序，会令下游 `hits.sort((a,b)=>b[0]-a[0])` 的前置状态改变，并使 E13 闸门 ⑬
//   「复刻旧版 hits 应用顺序」的注入锚点静默失去判别力（注入后恰好变成正确顺序 ⇒ 闸门假红）。
//   ⇒ 定序职责单一归 `hits.sort`，本函数只管「不相交」。
function _v432ResolveOverlaps(hits, tag) {
  if (!Array.isArray(hits) || hits.length < 2) return hits || [];
  const idx = hits.map((h, i) => i).sort((a, b) => (hits[a][0] - hits[b][0]) || (hits[b][1] - hits[a][1]));
  const drop = new Set();
  let last = null;
  for (const i of idx) {
    const h = hits[i];
    if (last && h[0] < last[1]) { drop.add(i); continue; }   // 相交 ⇒ 丢弃后起者（先起者胜）
    last = h;
  }
  if (!drop.size) return hits;
  console.log(`[E15-R11f] ${tag}: 命中区间相交 ${drop.size} 处 → 已丢弃越界命中（防串长错位 artifact）`);
  return hits.filter((h, i) => !drop.has(i));
}

// 🛡️ E16/R11i: 宫位 token 匹配必须带数字边界——`ภพที่ 1` 是 `ภพที่ 11/12` 的前缀,
//   裸 includes 会把「真值宫位=1、文本写 11」误判为已正确 ⇒ 跳过宫位纠错（线上 v515
//   s6/s9 月标题污染的帮凶: 星座被改而宫位 11/12 因子串误判幸存, 形成半错半对的 B 版）。
function _thHasHouse(zone, h) {
  if (!zone || !h) return false;
  return new RegExp('(?:เรือนที่|บ้าน|ภพที่)\\s*' + h + '(?!\\d)').test(zone);
}

function lockNatalTruthTh(text, astroMatrix) {
  if (!text) return text;
  const truth = astroMatrix ? _natalTruthMap10_TH(astroMatrix) : {};
  const names = Object.keys(truth);
  if (!names.length) {
    console.log('[V424] ข้อมูลนำเกิดไม่พร้อม → ข้าม Thai natal lock');
    return text;
  }
  // 🛡️ E16/R11i: 月标题行豁免（线上 v515 实证 P0：HIT 路径本命锁把 12 个月标题星座
  //   全部污染成 natal Sun 星座——s6 阿皮亚 12 标题全变 Libra、s9 曼谷全变 Scorpio）。
  //   病根：本命锁对「任何」含行星名的从句按 natal 真值纠错，月标题
  //   `ดวงอาทิตย์ในกรกฎ ภพที่ 11`（7 月流年）与 natal Sun（Libra H1）不符 ⇒ 整句被改写。
  //   MISS 链尾有 lockYearlyMonthTitles 兜底纠回，HIT 链没有 ⇒ 同一缓存 HIT 返回坏版。
  //   治本：标题行（# 开头）一律跳过——月标题真值由 lockYearlyMonthTitles 专职负责。
  const _headRanges = [];
  {
    let _off = 0;
    for (const _ln of String(text).split('\n')) {
      if (/^#{1,6}[ \t]/.test(_ln)) _headRanges.push([_off, _off + _ln.length]);
      _off += _ln.length + 1;
    }
  }
  const _inHead = (i) => {
    for (const [s, e] of _headRanges) { if (i >= s && i < e) return true; }
    return false;
  };
  const nameRe = new RegExp('(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  let result = text;
  let m;
  while ((m = nameRe.exec(text)) !== null) {
    if (_inHead(m.index)) continue;   // 🛡️ E16/R11i: 标题行豁免
    const name = m[1];
    const t = truth[name];
    if (!t) continue;
    const clause = _thClause(text, m.index, m[0].length);
    if (!clause) continue;
    const { fwd, bwd } = clause;
    const hasSign = t.sign && (fwd.includes(t.sign) || bwd.includes(t.sign));
    // 🛠️ V424-fix5: 三种宫位格式全认：บ้าน X / เรือนที่ X / (ภพที่ X)；🛡️ E16/R11i: 数字边界
    const hasHouse = _thHasHouse(fwd, t.house) || _thHasHouse(bwd, t.house);
    if (hasSign && hasHouse) continue;
    // 先找后段目标
    let z = fwd.length >= bwd.length ? fwd : bwd;
    const origLen = z.length;
    let patch;
    if (hasSign || hasHouse) {
      patch = _thPatchZone(z, hasSign ? null : t.sign, hasHouse ? null : t.house, z === fwd, text, z === fwd ? m.index + m[0].length : m.index - origLen);
    } else {
      patch = _thPatchZone(z, t.sign, t.house, z === fwd, text, z === fwd ? m.index + m[0].length : m.index - origLen);
    }
    if (patch.count === 0) continue;
    // 替换：基于 text（原文）位置，防止多轮替换位移踩踏
    const pos = z === fwd ? m.index + m[0].length : m.index - origLen;
    const safePos = Math.max(0, pos);
    result = result.slice(0, safePos) + patch.text + result.slice(safePos + origLen);
    // 更新 text 指针用于下一轮 search（基于 result 长度修正）
    const delta = patch.text.length - origLen;
    text = result;
    nameRe.lastIndex += delta;
    if (patch.count > 0) {
      const old = (fwd + bwd).replace(/\n/g,' ');
      console.log(`[V424] Thai natal lock: ${name} → ${t.sign||'?'} ${t.house ? 'บ้าน '+t.house : ''} | ${old.slice(0,40)}`);
    }
  }
  return result;
}

// 🛠️ V424-B2: 泰语 transit 真值硬锁（镜像 natal 锁）
// 治 LLM 把本命盘位置误写入 transit 句（如 ดาวพฤหัสบดีทรานซิสในราศีธนู 应为 ราศีสิงห์）。
// 只作用于含 transit 标记(ทรานซิส/เคลื่อน/ผ่าน/เข้าสู่/สถิต/โคจร/เดินทาง/ย้าย)且不含 กำเนิด 的从句；
// 与 natal 锁互补：natal 锁处理 กำเนิด 句，transit 锁处理 transit 标记句，plain 句两者皆不动。
function _thTransitClause(text, i, len) {
  const aEnd = i + len;
  let fwd = text.slice(aEnd, aEnd + 90);
  const e = fwd.search(_TH_CLAUSE_BREAK);
  if (e >= 0) fwd = fwd.slice(0, e);
  const axisIdx = fwd.search(_TH_AXIS);
  if (axisIdx >= 0) fwd = fwd.slice(0, axisIdx);
  if (/กำเนิด/.test(fwd)) return null;            // 本命句 → natal lock 已处理，跳过
  if (!_TH_TRANSIT_MARK.test(fwd)) return null;    // 非 transit 标记 → 不碰
  let bwd = text.slice(Math.max(0, i - 70), i);
  let lo = 0;
  for (const m of bwd.matchAll(_TH_CLAUSE_BREAK)) lo = Math.max(lo, m.index + m[0].length);
  const bm = bwd.search(_TH_BODY_ANY);
  bwd = bwd.slice(lo, bm >= 0 ? Math.max(lo, bm) : bwd.length);
  return { fwd, bwd };
}

function lockTransitTruthTh(text, astroMatrix) {
  if (!text || typeof text !== 'string' || !astroMatrix?.months?.[0]) return text;
  const first = astroMatrix.months[0];
  const getH2 = (v) => typeof v === 'number' ? v : (v?.house ?? v?.natal_house ?? v?.[0] ?? 1);
  // 从报告月(months[0])取 transit 真值
  const truth = {};
  for (const p of _TH_PLANET_ORDER) {
    const k = p.toLowerCase();
    const info = p === 'Sun' ? (first.sun || (first.positions && first.positions.Sun) || {}) : (first[k] || {});
    if (!info?.sign) continue;
    const idx = _EN2ZIDX[info.sign];
    const thSign = idx != null ? SUN_SIGN_TH[idx] : null;
    const house = Number(getH2(info.house)) || 0;
    if (thSign || house) truth[_TH_PLANET[p]] = { sign: thSign, house };
  }
  const names = Object.keys(truth);
  if (!names.length) return text;
  const nameRe = new RegExp('(' + names.map(n => n.replace(/[.*+?^${}()|()[\]\\]/g,'\\$&')).join('|') + ')', 'g');
  let result = text;
  let m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const t = truth[name];
    if (!t) continue;
    const clause = _thTransitClause(text, m.index, m[0].length);
    if (!clause) continue;
    const { fwd, bwd } = clause;
    const hasSign = t.sign && (fwd.includes(t.sign) || bwd.includes(t.sign));
    // 🛡️ E16/R11i: 数字边界（`ภพที่ 1` ⊄ `ภพที่ 11`）
    const hasHouse = _thHasHouse(fwd, t.house) || _thHasHouse(bwd, t.house);
    if (hasSign && hasHouse) continue;
    let z = fwd.length >= bwd.length ? fwd : bwd;
    const origLen = z.length;
    let patch;
    if (hasSign || hasHouse) patch = _thPatchZone(z, hasSign ? null : t.sign, hasHouse ? null : t.house, z === fwd);
    else patch = _thPatchZone(z, t.sign, t.house, z === fwd);
    if (patch.count === 0) continue;
    const pos = z === fwd ? m.index + m[0].length : m.index - origLen;
    const safePos = Math.max(0, pos);
    result = result.slice(0, safePos) + patch.text + result.slice(safePos + origLen);
    const delta = patch.text.length - origLen;
    text = result;
    nameRe.lastIndex += delta;
    if (patch.count > 0) {
      const old = (fwd + bwd).replace(/\n/g,' ');
      console.log(`[V424-B2] Thai transit lock: ${name} → ${t.sign||'?'}${t.house ? ' บ้าน '+t.house : ''} | ${old.slice(0,40)}`);
    }
  }
  return result;
}

const _VI_BODY_ANY = /(?:^|\s)(?:Mặt|Sao|Hành|Thiên Vương|Hải Vương|Diêm Vương)\s/;
// 10 行星越语名（V423 全量覆盖；锁按此表匹配正文）
const _VI_PLANET = {
  Sun: 'Mặt Trời', Moon: 'Mặt Trăng', Mercury: 'Sao Thủy', Venus: 'Sao Kim', Mars: 'Sao Hỏa',
  Jupiter: 'Sao Mộc', Saturn: 'Sao Thổ', Uranus: 'Sao Thiên Vương', Neptune: 'Sao Hải Vương', Pluto: 'Sao Diêm Vương',
};
const _VI_PLANET_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
// 🛠️ V421-fix2: 顶层不得直接引用 SUN_SIGN_VI（其声明在本行之后 → TDZ 启动崩溃，2026-09-10 已实陆一次）
//   改用惰性函数，运行时才去读后方声明的常量
let _VI_SIGN_UNIQ_CACHE = null;
const _VI_SIGN_UNIQ = () => (_VI_SIGN_UNIQ_CACHE ||= SUN_SIGN_VI.filter((s, i, a) => a.indexOf(s) === i));

// 本命真值表：越语行星名 → {sign, house}（astroMatrix.meta.computed_houses 为唯一真值源）
function _natalTruthMap10(astroMatrix) {
  const meta = astroMatrix?.meta || {};
  const ch = meta.computed_houses || {};
  const map = {};
  for (const p of _VI_PLANET_ORDER) {
    const info = (p === 'Moon' ? (meta.natal_moon || ch.Moon) : ch[p]) || null;
    if (!info) continue;
    const signEN = info.sign || (p === 'Sun' ? meta.sun_sign : null);
    const sign = _EN2ZIDX[signEN] != null ? SUN_SIGN_VI[_EN2ZIDX[signEN]] : null;
    const house = Number(info.house) || 0;
    if (sign || house) map[_VI_PLANET[p]] = { sign, house };
  }
  return map;
}

// 从句归因：锚点自己那一段（前段 bwd / 后段 fwd 各自在边界处切断，锚点本体不动）
//   explicit = 锚点后紧跟 “natal/bản mệnh”（强本命标记）
function _viClause(text, i, len, explicit) {
  const aEnd = i + len;
  // 🛠️ V423 严门：非强标记时，「本命定语」必须紧贴锚点 —— 锚点后到首个星座/宫位之间的定语段
  //   必须含 natal|bản mệnh|của bạn 且不得含流月动词。
  //   2026-09-10 血泪（生产实测误报）：模型写流月 “Sao Mộc tại Sư Tử trong Nhà 12 của bạn”、
  //   “Sao Kim Bọ Cạp tại Nhà 1” —— 从句里那个 “của bạn” 是修饰宫的，不是本命标记，
  //   旧口径（从句内任意位置见 của bạn 即算本命）会把流月当真值去改写。
  if (!explicit) {
    const after = text.slice(aEnd, aEnd + 40);
    let pre = after;
    let cut = -1;
    for (const s of _VI_SIGN_UNIQ()) { const k = after.indexOf(s); if (k >= 0 && (cut < 0 || k < cut)) cut = k; }
    const hm = after.match(/Nhà\s*\d+/);
    if (hm && (cut < 0 || hm.index < cut)) cut = hm.index;
    if (cut >= 0) pre = after.slice(0, cut);
    if (!/(?:natal|bản mệnh|của bạn)/i.test(pre)) return null;   // 非「你的X」→ 多半是流月/泛指，不碰
    if (_VI_TRANSIT_MARK.test(pre)) return null;                  // 定语段含流月动词 → 明确是 transit，不碰
  }
  // 后段：90 字内、句末为止、遇其他星体名即截断（绝不吃到别的行星的数据）
  let fwd = text.slice(aEnd, aEnd + 90);
  const e = fwd.search(/[.\n]/);
  if (e >= 0) fwd = fwd.slice(0, e);
  const bIdx = fwd.search(_VI_BODY_SPLIT);
  if (bIdx >= 0) fwd = fwd.slice(0, bIdx);
  // 🛠️ V423-fix-node-axis: 节点轴短语「trục X–Y」里的第二个星座是「对轴星座」绝非本命落点，
  //   一旦吃进归因窗口就会把 Bạch Dương 之类轴星座误判成本命星座去改写（生产实测把
  //   “trục Kim Ngưu–Bạch Dương” 改成了 “trục Kim Ngưu–Kim Ngưu”，纯误伤）。轴描述永远在句尾，
  //   遇 trục / 破折号即截断本命从句窗口。
  const axisIdx = fwd.search(/trục|—|–/i);
  if (axisIdx >= 0) fwd = fwd.slice(0, axisIdx);
  // 前段：70 字内；含流月动词 → 整段弃用；否则切成 [最后一个句读/连词之后, 首个其他星体名之前)
  let bwd = text.slice(Math.max(0, i - 70), i);
  if (_VI_TRANSIT_MARK.test(bwd)) {
    bwd = '';
  } else {
    let lo = 0;
    for (const m of bwd.matchAll(_VI_CLAUSE_BREAK)) lo = Math.max(lo, m.index + m[0].length);
    // 首个其他星体名【起点】即上界：其后的星座/宫位属于那颗星，绝不算到本锚点上
    //  （V423 自证血泪：“Sao Hỏa Cự Giải Nhà 1 chiếu vào Mặt Trăng natal của bạn” → Nhà 1 是火星的）
    const bm = bwd.search(_VI_BODY_ANY);
    bwd = bwd.slice(lo, bm >= 0 ? Math.max(lo, bm) : bwd.length);
  }
  return { fwd, bwd };
}

// 在单段区间内做「就近一处」替换：preferFirst=true → 取该区间首个；false → 取最后一个
function _viPatchZone(zone, sign, house, preferFirst, text, absBase) {
  let z = zone, ch = 0;
  const log = [];
  if (sign) {
    let best = null;
    for (const s of _VI_SIGN_UNIQ()) {
      if (s === sign) continue;
      const idx = preferFirst ? z.indexOf(s) : z.lastIndexOf(s);
      if (idx < 0) continue;
      // ⚠️ V436 守卫不挂 vi：vi 月名不含星座子串，守卫永远 false（零误杀）；th 同理已回滚。
      if (false && text != null && absBase != null && _v436InThMonth(text, absBase + idx, s.length)) continue;
      if (best === null || (preferFirst ? idx < best.idx : idx > best.idx)) best = { idx, s };
    }
    if (best) { z = z.slice(0, best.idx) + sign + z.slice(best.idx + best.s.length); ch++; log.push(`星座 ${best.s}→${sign}`); }
    else if (!z.includes(sign)) {
      // 盲区：z 不含预期星座，也不含任何已知错误星座（如 LLM 拼写错误 Sư Lửa≠Sư Tử）
      // → 找第一个 Nhà N，把其前的词（到上一个空格）强制替换为预期星座，杜绝残错误名
      const hm = z.match(/Nhà\s*\d+/);
      if (hm) {
        const before = z.slice(0, hm.index).replace(/\s+$/, '');
        const sp = before.lastIndexOf(' ');
        const wStart = sp >= 0 ? sp + 1 : 0;
        const word = before.slice(wStart);
        // 只替换首字母大写的词（星座名特征），跳过小写介词（trong/ở/tại 等），避免误伤
        if (word && word !== sign && !_VI_SIGN_UNIQ().includes(word) && /^[A-ZÀ-Ỹ]/.test(word)) {
          z = z.slice(0, wStart) + sign + z.slice(wStart + word.length);
          ch++; log.push(`星座 ${word}→${sign}(未知/拼写兜底)`);
        }
      }
    }
  }
  if (house) {
    const re = /Nhà\s*(\d+)/g;
    let target = null, m;
    while ((m = re.exec(z)) !== null) { if (preferFirst) { target = m; break; } target = m; }
    if (target && Number(target[1]) !== house) { z = z.slice(0, target.index) + ('Nhà ' + house) + z.slice(target.index + target[0].length); ch++; log.push(`宫位 ${target[1]}→${house}`); }
  }
  return { text: z, count: ch, log };
}

function lockNatalTruthVi(text, astroMatrix) {
  if (!text) return text;
  const truth = astroMatrix ? _natalTruthMap10(astroMatrix) : {};
  const names = Object.keys(truth);
  if (!names.length) {
    console.log('[V423] 本命真值盘不可用 → 跳过本命真值锁（绝不编）');
    return text;
  }
  const nameRe = new RegExp('(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  let hits = [];
  const detail = [];
  let fixes = 0, m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const t = truth[name];
    if (!t) continue;
    const explicit = /^\s*(?:natal|bản mệnh)\b/i.test(text.slice(m.index + m[0].length, m.index + m[0].length + 10));
    const clause = _viClause(text, m.index, m[0].length, explicit);
    if (!clause) continue;
    const { fwd, bwd } = clause;
    const backStart = m.index - bwd.length;
    const F = _viPatchZone(fwd, t.sign, t.house, true, text, m.index + m[0].length);
    const B = bwd ? _viPatchZone(bwd, t.sign, t.house, false, text, backStart) : { text: bwd, count: 0, log: [] };
    if (!F.count && !B.count) continue;
    for (const x of F.log.concat(B.log)) detail.push(`${name} ${x}`);
    // 右界用【原长度】定位：星座名长短变化不会导致掉字/重字
    if (F.count) hits.push([m.index + m[0].length, m.index + m[0].length + fwd.length, F.text]);
    if (B.count) hits.push([backStart, m.index, B.text]);
    fixes += F.count + B.count;
  }
  // 🛡️ E13/R11d: 命中区间按位置倒序应用（同 _v432LockNatal 的偏移坐标系修正，本函数同构同病）
  // 🛡️ E15/R11f-3: 先做区间去交叉（第 3 例：相交区间 + 串长变化 ⇒ 右界失效吃掉字符）
  hits = _v432ResolveOverlaps(hits, 'vi 本命锁');
  hits.sort((a, b) => b[0] - a[0]);
  for (let i = 0; i < hits.length; i++) {
    const [s, e, rep] = hits[i];
    text = text.slice(0, s) + rep + text.slice(e);
  }
  if (fixes) console.log(`[V423] 本命盘真值锁(10行星): 修正 ${fixes} 处 native 星座/宫位漂移${detail.length ? ' | ' + detail.slice(0, 10).join('; ') : ''}`);
  return text;
}

// ═══════════════════════════════════════════════════════════
// 🛠️ V424-B2: 越南语 transit 真值硬锁（镜像 natal 锁）
// 治 LLM 把本命盘位置误写入 transit 句（如 "Sao Mộc tại Sư Tử Nhà 12" 应为 transit 真值）。
// 越南语 transit 句多用具位置描述 "tại [星座] Nhà N"，绝大多数无显式 transit 动词，
//   故判定标记同时接受 tại 与 _VI_TRANSIT_MARK。
// 与 natal 锁互补：natal 锁管含 natal/bản mệnh/của bạn 的本命句、transit 锁管不含这些标记且含 tại 的位置句、plain 句不动。
// ═══════════════════════════════════════════════════════════

// 越南语 transit 真值表（从报告月 months[0] 取；与 _natalTruthMap10 同构，源不同）
function _transitTruthMap10_VI(astroMatrix) {
  const first = astroMatrix?.months?.[0];
  if (!first) return {};
  const map = {};
  for (const p of _VI_PLANET_ORDER) {
    const k = p.toLowerCase();
    const info = p === 'Sun' ? (first.sun || (first.positions && first.positions.Sun) || {}) : (first[k] || {});
    if (!info) continue;
    const signEN = info.sign;
    const sign = _EN2ZIDX[signEN] != null ? SUN_SIGN_VI[_EN2ZIDX[signEN]] : null;
    const house = Number(info.house) || 0;
    if (sign || house) map[_VI_PLANET[p]] = { sign, house };
  }
  return map;
}

// 越南语 transit 从句归因（镜像 _viClause 的非 explicit 分支，但只取 transit 句）
function _viTransitClause(text, i, len) {
  const aEnd = i + len;
  // 本命定语判定：锚点后到首个星座/宫位之间的定语段含 natal/bản mệnh/của bạn → 本命句，跳过（natal 锁已处理）
  const after = text.slice(aEnd, aEnd + 40);
  let pre = after;
  let cut = -1;
  for (const s of _VI_SIGN_UNIQ()) { const k = after.indexOf(s); if (k >= 0 && (cut < 0 || k < cut)) cut = k; }
  const hm = after.match(/Nhà\s*\d+/);
  if (hm && (cut < 0 || hm.index < cut)) cut = hm.index;
  if (cut >= 0) pre = after.slice(0, cut);
  if (/(?:bản mệnh|natal|của bạn)/i.test(pre)) return null;   // 本命句 → natal 锁已处理，跳过
  if (!/tại/i.test(after) && !_VI_TRANSIT_MARK.test(after)) return null;  // 非位置/transit 描述 → 不碰
  // 后段：90 字内、句末/其他星体名为止、遇节点轴截断
  let fwd = text.slice(aEnd, aEnd + 90);
  const e = fwd.search(/[.\n]/);
  if (e >= 0) fwd = fwd.slice(0, e);
  const bIdx = fwd.search(_VI_BODY_SPLIT);
  if (bIdx >= 0) fwd = fwd.slice(0, bIdx);
  const axisIdx = fwd.search(/trục|—|–/i);
  if (axisIdx >= 0) fwd = fwd.slice(0, axisIdx);
  // 前段：70 字内；含 transit 动词 → 整段弃用；否则切到 [最后句读/连词之后, 首个其他星体名之前)
  let bwd = text.slice(Math.max(0, i - 70), i);
  if (_VI_TRANSIT_MARK.test(bwd)) {
    bwd = '';
  } else {
    let lo = 0;
    for (const m of bwd.matchAll(_VI_CLAUSE_BREAK)) lo = Math.max(lo, m.index + m[0].length);
    const bm = bwd.search(_VI_BODY_ANY);
    bwd = bwd.slice(lo, bm >= 0 ? Math.max(lo, bm) : bwd.length);
  }
  return { fwd, bwd };
}

function lockTransitTruthVi(text, astroMatrix) {
  if (!text || typeof text !== 'string' || !astroMatrix?.months?.[0]) return text;
  const truth = _transitTruthMap10_VI(astroMatrix);
  const names = Object.keys(truth);
  if (!names.length) return text;
  const nameRe = new RegExp('(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  let result = text;
  let m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const t = truth[name];
    if (!t) continue;
    const clause = _viTransitClause(text, m.index, m[0].length);
    if (!clause) continue;
    const { fwd, bwd } = clause;
    const hPat = String(t.house);
    const hasSign = t.sign && (fwd.includes(t.sign) || bwd.includes(t.sign));
    const hasHouse = t.house && (fwd.includes('Nhà ' + hPat) || bwd.includes('Nhà ' + hPat));
    if (hasSign && hasHouse) continue;
    let z = fwd.length >= bwd.length ? fwd : bwd;
    const origLen = z.length;
    let patch;
    if (hasSign || hasHouse) patch = _viPatchZone(z, hasSign ? null : t.sign, hasHouse ? null : t.house, z === fwd, text, z === fwd ? m.index + m[0].length : m.index - origLen);
    else patch = _viPatchZone(z, t.sign, t.house, z === fwd, text, z === fwd ? m.index + m[0].length : m.index - origLen);
    if (patch.count === 0) continue;
    const pos = z === fwd ? m.index + m[0].length : m.index - origLen;
    const safePos = Math.max(0, pos);
    result = result.slice(0, safePos) + patch.text + result.slice(safePos + origLen);
    const delta = patch.text.length - origLen;
    text = result;
    nameRe.lastIndex += delta;
    if (patch.count > 0) {
      const old = (fwd + bwd).replace(/\n/g, ' ');
      console.log(`[V424-B2] Vi transit lock: ${name} → ${t.sign || '?'}${t.house ? ' Nhà ' + t.house : ''} | ${old.slice(0, 40)}`);
    }
  }
  return result;
}


// ── V426: 法语本命+transit 真值双锁（镜像 V423/V424/V425，治 LLM 二次翻译偷抄本命锚点）
// 根因同源：labels.fr 此前喂英文缩写 ['Ari','Tau'...] 逼 LLM 翻译 → 偷抄本命锚点混进 transit 段。
// 现在 labels.fr 已本土化（v69_client.js），本锁负责输出后置硬归真兜底。
const _FR_PLANET = {
  Sun: 'Soleil', Moon: 'Lune', Mercury: 'Mercure', Venus: 'Vénus', Mars: 'Mars',
  Jupiter: 'Jupiter', Saturn: 'Saturne', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluton',
};
const _FR_PLANET_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
// 法语标准星座名（与山子大叔路线图 + labels.fr 完全一致）
const _FR_SIGN_FR = ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'];
// 🛠️ 惰性函数避免 TDZ（声明在本行之后会被读取，运行时才解析）
let _FR_SIGN_UNIQ_CACHE = null;
const _FR_SIGN_UNIQ = () => (_FR_SIGN_UNIQ_CACHE ||= _FR_SIGN_FR.filter((s, i, a) => a.indexOf(s) === i));
// 法语流月标记（显式 transit 动词；"en [星座]" 介词由 _frTransitClause 单独判定）
const _FR_TRANSIT_MARK = /transitant|se déplace|passe|entre dans|rejoint|quitte|croise|au signe/i;
// 法语句读 + 连词
const _FR_CLAUSE_BREAK = /[.;!?:()\n]|\s(?:et|mais|ou|donc|or|ni|car|lorsque|pendant|tandis|alors)\s/gi;  // 逗号不当 bwd 硬截断：法语本命星座常作同位语置于行星名前的逗号前
// 法语行星名（出现即截断归因窗口，避免把别的行星数据归到本锚点）
const _FR_BODY_ANY = /(?:^|\s)(?:Soleil|Lune|Mercure|Vénus|Mars|Jupiter|Saturne|Uranus|Neptune|Pluton)\b/i;
// 法语节点轴（遇轴短语截断，防止轴星座误判成本命；镜像 _VI_AXIS / _TH_AXIS）
const _FR_AXIS = /axe|pôle|entre\s+.+?\s+et\s+.+?\(?Maison/i;

// 法语 natal 真值表：法语行星名 → {sign, house}（astroMatrix.meta.computed_houses 为唯一真值源）
function _natalTruthMap10_FR(astroMatrix) {
  const meta = astroMatrix?.meta || {};
  const ch = meta.computed_houses || {};
  const map = {};
  for (const p of _FR_PLANET_ORDER) {
    const info = (p === 'Moon' ? (meta.natal_moon || ch.Moon) : ch[p]) || null;
    if (!info) continue;
    const signEN = info.sign || (p === 'Sun' ? meta.sun_sign : null);
    const sign = _EN2ZIDX[signEN] != null ? _FR_SIGN_FR[_EN2ZIDX[signEN]] : null;
    const house = Number(info.house) || 0;
    if (sign || house) map[_FR_PLANET[p]] = { sign, house, retrograde: !!info.retrograde };
  }
  return map;
}

// 法语 transit 真值表（从报告月 months[0] 取；与 _natalTruthMap10_FR 同构，源不同）
function _transitTruthMap10_FR(astroMatrix) {
  const first = astroMatrix?.months?.[0];
  if (!first) return {};
  const map = {};
  for (const p of _FR_PLANET_ORDER) {
    const k = p.toLowerCase();
    const info = p === 'Sun' ? (first.sun || (first.positions && first.positions.Sun) || {}) : (first[k] || {});
    if (!info) continue;
    const signEN = info.sign;
    const sign = _EN2ZIDX[signEN] != null ? _FR_SIGN_FR[_EN2ZIDX[signEN]] : null;
    const house = Number(info.house) || 0;
    if (sign || house) map[_FR_PLANET[p]] = { sign, house };
  }
  return map;
}

// 法语本命从句归因（镜像 _viClause；natal 标记 = 行星后紧跟 natal/natale）
// 🛡️ E15/R11f-2: 法语「序数指示符缩写」宫位形态 —— `5ᵉ maison` / `5e maison` / `5ème maison` / `5° maison`。
//   与 es 的 `5ª Casa` 同源（E13「拼写式序数」的多语言孪生体）；en/es 走 _V432_CFG.houseAbbr，
//   fr 走本独立通道（lockNatalTruthFr），故在此单列。实测 2 盘 fr 产出 0 处（纯防御性补齐）。
//   `(?<![\d.,])` 防把 `2026 maison` / `1.5 maison` 的尾段数字当宫位号；值域 1~12 由调用方钳制。
const _FR_HOUSE_ABBR = /(?<![\d.,])\b(\d{1,2})\s*(?:ème|eme|[eèé\u1d49\u00b0])?\s*maison\b/i;
// 宫位引用「任一形态」（`Maison 5` ∪ `5ᵉ maison`）—— 供定语槽裁剪统一使用，避免两处漂移。
const _FR_HOUSE_ANY = /(?:Maison\s*\d+|(?<![\d.,])\b\d{1,2}\s*(?:ème|eme|[eèé\u1d49\u00b0])?\s*maison)\b/i;

function _frClause(text, i, len, explicit) {
  const aEnd = i + len;
  if (!explicit) {
    const after = text.slice(aEnd, aEnd + 50);
    let pre = after;
    let cut = -1;
    for (const s of _FR_SIGN_UNIQ()) { const k = after.indexOf(s); if (k >= 0 && (cut < 0 || k < cut)) cut = k; }
    const hm = after.match(_FR_HOUSE_ANY);
    if (hm && (cut < 0 || hm.index < cut)) cut = hm.index;
    if (cut >= 0) pre = after.slice(0, cut);
    if (!/(?:natal|natale|de naissance|qui vous fit naître)/i.test(pre)) return null;        // 非本命标记 → 多半是 transit/泛指，不碰
    if (_FR_TRANSIT_MARK.test(pre)) return null;            // 定语段含 transit 动词 → 明确是 transit，不碰
  }
  let fwd = text.slice(aEnd, aEnd + 90);
  const e = fwd.search(/[.\n]/);
  if (e >= 0) fwd = fwd.slice(0, e);
  const bIdx = fwd.search(_FR_BODY_ANY);
  if (bIdx >= 0) fwd = fwd.slice(0, bIdx);
  const axisIdx = fwd.search(_FR_AXIS);
  if (axisIdx >= 0) fwd = fwd.slice(0, axisIdx);
  let bwd = text.slice(Math.max(0, i - 70), i);
  if (_FR_TRANSIT_MARK.test(bwd)) {
    bwd = '';
  } else {
    let lo = 0;
    for (const m of bwd.matchAll(_FR_CLAUSE_BREAK)) lo = Math.max(lo, m.index + m[0].length);
    const bm = bwd.search(_FR_BODY_ANY);
    bwd = bwd.slice(lo, bm >= 0 ? Math.max(lo, bm) : bwd.length);
  }
  return { fwd, bwd };
}

// 法语 transit 从句归因（镜像 _viTransitClause；transit 标记 = 行星后 en [大写星座] 且无 natal）
function _frTransitClause(text, i, len) {
  const aEnd = i + len;
  const after = text.slice(aEnd, aEnd + 50);
  let pre = after;
  let cut = -1;
  for (const s of _FR_SIGN_UNIQ()) { const k = after.indexOf(s); if (k >= 0 && (cut < 0 || k < cut)) cut = k; }
  const hm = after.match(_FR_HOUSE_ANY);
  if (hm && (cut < 0 || hm.index < cut)) cut = hm.index;
  if (cut >= 0) pre = after.slice(0, cut);
  if (/(?:natal|natale|natif|native)/i.test(pre)) return null;                     // 本命句 → natal 锁已处理，跳过
  if (_FR_PRE_NATAL_DESC.test(text.slice(Math.max(0, i - 34), i))) return null;      // V431: 前置本命定语（`natif du Soleil …`）→ 同上
  if (!/\ben\b\s+[A-ZÀ-ÿ]/i.test(after) && !_FR_TRANSIT_MARK.test(after)) return null;  // 非位置/transit 描述 → 不碰
  let fwd = text.slice(aEnd, aEnd + 90);
  const e = fwd.search(/[.\n]/);
  if (e >= 0) fwd = fwd.slice(0, e);
  const bIdx = fwd.search(_FR_BODY_ANY);
  if (bIdx >= 0) fwd = fwd.slice(0, bIdx);
  const axisIdx = fwd.search(_FR_AXIS);
  if (axisIdx >= 0) fwd = fwd.slice(0, axisIdx);
  let bwd = text.slice(Math.max(0, i - 70), i);
  if (_FR_TRANSIT_MARK.test(bwd)) {
    bwd = '';
  } else {
    let lo = 0;
    for (const m of bwd.matchAll(_FR_CLAUSE_BREAK)) lo = Math.max(lo, m.index + m[0].length);
    const bm = bwd.search(_FR_BODY_ANY);
    bwd = bwd.slice(lo, bm >= 0 ? Math.max(lo, bm) : bwd.length);
  }
  return { fwd, bwd };
}

// 法语单段替换（镜像 _viPatchZone；house=Maison X；含拼写错误兜底归真）
const _FR_ORDINAL_TO_DIGIT = {
  'première': 1, 'premier': 1, 'deuxième': 2, 'troisième': 3, 'quatrième': 4,
  'cinquième': 5, 'sixième': 6, 'septième': 7, 'huitième': 8, 'neuvième': 9,
  'dixième': 10, 'onzième': 11, 'douzième': 12,
};
const _FR_DIGIT_TO_ORDINAL = {
  1: 'première', 2: 'deuxième', 3: 'troisième', 4: 'quatrième', 5: 'cinquième',
  6: 'sixième', 7: 'septième', 8: 'huitième', 9: 'neuvième', 10: 'dixième',
  11: 'onzième', 12: 'douzième',
};

function _frPatchZone(zone, sign, house, preferFirst) {
  let z = zone, ch = 0;
  const log = [];
  if (sign) {
    let best = null;
    for (const s of _FR_SIGN_UNIQ()) {
      if (s === sign) continue;
      const idx = preferFirst ? z.indexOf(s) : z.lastIndexOf(s);
      if (idx < 0) continue;
      if (best === null || (preferFirst ? idx < best.idx : idx > best.idx)) best = { idx, s };
    }
    if (best) { z = z.slice(0, best.idx) + sign + z.slice(best.idx + best.s.length); ch++; log.push(`星座 ${best.s}→${sign}`); }
    else if (!z.includes(sign)) {
      // 盲区：z 不含预期星座，也不含任何已知错误星座（如 LLM 拼写错误 Lion≠Lion? 或外文混入）→ 兜底归真
      const hm = z.match(_FR_HOUSE_ANY);
      if (hm) {
        const before = z.slice(0, hm.index).replace(/\s+$/, '');
        const sp = before.lastIndexOf(' ');
        const wStart = sp >= 0 ? sp + 1 : 0;
        const word = before.slice(wStart);
        // 只替换首字母大写的词（星座名特征），跳过小写介词（en/dans/à 等），避免误伤
        if (word && word !== sign && !_FR_SIGN_UNIQ().includes(word) && /^[A-ZÀ-ÖØ-Þ]/.test(word)) {
          z = z.slice(0, wStart) + sign + z.slice(wStart + word.length);
          ch++; log.push(`星座 ${word}→${sign}(未知/拼写兜底)`);
        }
      }
    }
  }
  if (house) {
    let target = null, m, isOrdinal = false, isAbbr = false;
    const reNum = /Maison\s*(\d+)/gi;
    while ((m = reNum.exec(z)) !== null) { if (preferFirst) { target = m; break; } target = m; }
    if (!target) {
      const reOrd = /\b(première|premier|deuxième|troisième|quatrième|cinquième|sixième|septième|huitième|neuvième|dixième|onzième|douzième)\s+maison/gi;
      while ((m = reOrd.exec(z)) !== null) { if (preferFirst) { target = m; break; } target = m; }
      isOrdinal = true;
    }
    // 🛡️ E15/R11f-2: 序数指示符缩写形态 `5ᵉ maison` / `5e maison` / `5ème maison`（仅当窗内无 `Maison N` 时兜底）
    if (!target) {
      const reAbbr = new RegExp(_FR_HOUSE_ABBR.source, 'gi');
      while ((m = reAbbr.exec(z)) !== null) { if (preferFirst) { target = m; break; } target = m; }
      if (target) { isOrdinal = false; isAbbr = true; }
    }
    if (target) {
      const gotHouse = isOrdinal ? (_FR_ORDINAL_TO_DIGIT[target[1].toLowerCase()] || 0) : Number(target[1]);
      if (gotHouse !== house && gotHouse >= 1 && gotHouse <= 12) {
        const replacement = isAbbr ? (house + '\u1d49 maison')
          : isOrdinal ? (_FR_DIGIT_TO_ORDINAL[house] + ' maison') : ('Maison ' + house);
        z = z.slice(0, target.index) + replacement + z.slice(target.index + target[0].length);
        ch++; log.push('宫位 ' + gotHouse + '\u2192' + house);
      }
    }
  }
  return { text: z, count: ch, log };
}

// ============================================================================
// V430: 法语「本命/流年定语」双向裁定器（治「夺舍」与「丢标识」两类定语错配）
//   定位：由 lockNatalTruthFr 入口调用 → 必然早于 natal / transit 两个真值锁。
//   只动「定语词」本身，绝不动星座/宫位（星座/宫位仍由双锁按真值归真）。
//   判据是「真值匹配 + 同分句窗口」，不是 V428 式的词距猜测：
//     A 夺舍剥离：行星后定语= natal/natale，但所写星座/宫位 = 流月真值 ≠ 本命真值
//                → 该句实为流月句，剥掉本命定语（值已 = 流月真值，transit 锁随后零改动）
//     B 标识补全：行星后无本命定语，但所写星座/宫位 = 本命真值 ≠ 流月真值
//                → 该句实为本命句，补回 natal/natale（否则会被 transit 锁误改成流月值）
//                （B1 星座+宫位双中；B2 星座中且同句含本命语境词；两者都要求槽内无 transit 动词）
//   幂等：修后再次运行零改动（A 剥离后 isN 仍假 → B 不触发；B 补全后 hasDesc 真 → A/B 均不触发）
//   不变量：往返「真值↔错值」替换后必须逐字符等于原文（抓掉字/重字）
// ============================================================================
// ── V431: 定语家族「单一真源」——检测与剥离共用同一段 regex 源串，杜绝「检测到 A 形态、剥离只认 B 形态」的错位────
// 本命定语家族（后缀槽：紧跟在行星名之后）
const _FR_NATAL_DESC_SRC = '(?:natal(?:e)?s?|natif|native|natifs|natives|de\\s+naissance|à\\s+la\\s+naissance|au\\s+moment\\s+de\\s+la\\s+naissance|du\\s+thème\\s+natal|de\\s+votre\\s+thème(?:\\s+natal)?|de\\s+votre\\s+ciel|qui\\s+vous\\s+fit\\s+naître)';
const _FR_NATAL_SLOT = new RegExp(_FR_NATAL_DESC_SRC, 'i');
const _FR_DESC_STRIP = new RegExp('\\s*' + _FR_NATAL_DESC_SRC + '\\b', 'gi');
const _FR_NATAL_CTX = /(?:natal|natale|natif|native|naissance|votre thème|votre ciel|carte du ciel|votre signature)/i;
const _FR_FEM_PLANET = /^(?:Lune|Vénus)$/;
// 前置本命定语：定语在行星名**之前**（生产实测：`vous, natif du Soleil en Vierge` / `native de la Lune`）
const _FR_PRE_NATAL_DESC = /(?:natif|native|natifs|natives|née?|nés?)\s+(?:du|de\s+la|de\s+l['’]|des|d['’]|avec\s+le|avec\s+la)\s*$/i;
// 流年定语家族（后缀槽）—— V431 新增：transitant/transitaire/de passage/en transit/du mois/actuel…
const _FR_TRANSIT_DESC_SRC = '(?:transitant(?:e)?s?|transitaire(?:s)?|en\\s+transit|de\\s+passage|du\\s+mois|ce\\s+mois(?:-ci)?|de\\s+ce\\s+mois|actuel(?:le)?s?|en\\s+cours)';
const _FR_TRANSIT_DESC = new RegExp(_FR_TRANSIT_DESC_SRC, 'i');
const _FR_TRANSIT_DESC_STRIP = new RegExp('\\s*' + _FR_TRANSIT_DESC_SRC + '\\b', 'gi');
// 流年「运动性」语义（V431-A2 判向用：句中若有运动动词，则实为流月句，本命定语是贴错的）
const _FR_TRANSIT_VERB = /transit|se\s+déplace|déambule|passe\b|glisse|entre\s+en|entre\s+dans|rejoint|quitte|croise|se\s+dirige|approche|poursuit\s+sa\s+course|voyage|arrive\b|s['’]installe|se\s+lève|décline|recule/i;
// 外文（英）星座名泄漏归真表：生产实测 fr 报告混入 Aries×18 / Libra×4（法英同形者 Cancer/Lion/Balance 不入表，避免误伤）
const _FR_EN_SIGN_MAP = { aries: 'Bélier', taurus: 'Taureau', gemini: 'Gémeaux', leo: 'Lion', virgo: 'Vierge', libra: 'Balance', scorpio: 'Scorpion', sagittarius: 'Sagittaire', capricorn: 'Capricorne', aquarius: 'Verseau', pisces: 'Poissons' };
const _FR_EN_SIGN_RE = /\b(Aries|Taurus|Gemini|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b/gi;
function normalizeForeignSignsFr(text) {
  if (!text || typeof text !== 'string') return text;
  let n = 0;
  let out = text.replace(_FR_EN_SIGN_RE, (w) => { const r = _FR_EN_SIGN_MAP[w.toLowerCase()]; if (r && r !== w) { n++; return r; } return w; });
  // 法语性别修正：Vierge / Balance 为阴性星座名 → 「Vierge natal」应为「Vierge natale」
  const before2 = out;
  out = out.replace(/\b(Vierge|Balance)(\s+)natal\b/g, '$1$2natale');
  if (out !== before2) n += (before2.match(/\b(?:Vierge|Balance)\s+natal\b/g) || []).length;
  if (n) console.log(`[V431] 法语外文星座名/性别归真: ${n} 处`);
  return out;
}

// 定语槽：行星名 → 第一个星座/宫位之间（与两个真值锁同源口径）
function _frSlotOf(text, aEnd) {
  const after = text.slice(aEnd, aEnd + 50);
  let cut = after.length;
  for (const s of _FR_SIGN_UNIQ()) { const k = after.indexOf(s); if (k >= 0 && k < cut) cut = k; }
  const hm = after.match(_FR_HOUSE_ANY);
  if (hm && hm.index < cut) cut = hm.index;
  return after.slice(0, cut);
}

// 该从句「声称」的星座/宫位（fwd 优先，fwd 无则回看 bwd）
function _frClaimOf(fwd, bwd) {
  const uniq = _FR_SIGN_UNIQ();
  let sign = null, si = -1;
  for (const s of uniq) { const k = fwd.indexOf(s); if (k >= 0 && (si < 0 || k < si)) { si = k; sign = s; } }
  let house = null;
  const hm = fwd.match(/Maison\s*(\d+)/i);
  if (hm) house = Number(hm[1]);
  if (!sign && bwd) { let bi = -1; for (const s of uniq) { const k = bwd.lastIndexOf(s); if (k > bi) { bi = k; sign = s; } } }
  if (house === null && bwd) { const all = [...String(bwd).matchAll(/Maison\s*(\d+)/gi)]; if (all.length) house = Number(all[all.length - 1][1]); }
  return { sign, house };
}

// 声称值是否与某真值盘一致（有宫位则星座+宫位都要中）
function _frTruthMatch(t, sign, house) {
  if (!t) return false;
  if (!sign && house === null) return false;
  if (sign && t.sign !== sign) return false;
  if (house !== null && t.house !== house) return false;
  return true;
}

function adjudicateNatalDescriptorsFr(text, astroMatrix) {
  if (!text || typeof text !== 'string' || !astroMatrix) return text;
  text = normalizeForeignSignsFr(text);   // V431: 先归真外文星座名（Aries→Bélier），否则值域判据整体失效
  const NT = _natalTruthMap10_FR(astroMatrix);
  const names = Object.keys(NT);
  if (!names.length) return text;
  const TT = (astroMatrix.months && astroMatrix.months[0]) ? _transitTruthMap10_FR(astroMatrix) : {};
  const nameRe = new RegExp('(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  const patches = [];
  let stripped = 0, inserted = 0, m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const nt = NT[name];
    if (!nt) continue;
    const aEnd = m.index + m[0].length;
    const slot = _frSlotOf(text, aEnd);
    // V431: 本命定语两种位置都要认——后缀槽（`Soleil natal`）与前置（`natif du Soleil`）
    const preWin = text.slice(Math.max(0, m.index - 34), m.index);
    const isPrefix = _FR_PRE_NATAL_DESC.test(preWin);
    const hasSuffixDesc = _FR_NATAL_SLOT.test(slot);
    const hasDesc = hasSuffixDesc || isPrefix;
    const hasTDesc = _FR_TRANSIT_DESC.test(slot);
    const clause = _frClause(text, m.index, m[0].length, true);
    if (!clause) continue;
    const claim = _frClaimOf(clause.fwd, clause.bwd);
    const isN = _frTruthMatch(nt, claim.sign, claim.house);
    const isT = TT[name] ? _frTruthMatch(TT[name], claim.sign, claim.house) : false;

    if (hasSuffixDesc && isT && !isN) {
      // A) 夺舍：本命定语贴在流月句上 → 剥定语（槽内最多 3 处，且不误伤冒号前的法式空格）
      const re = new RegExp(_FR_DESC_STRIP.source, 'gi');
      let sm, n0 = 0;
      while ((sm = re.exec(slot)) !== null) {
        let e = aEnd + sm.index + sm[0].length;
        // 剥离后若紧跟「空格+逗号」，一并吃掉该空格（法语逗号前不加空格）
        if (text[e] === ' ' && text[e + 1] === ',') e += 1;
        patches.push({ s: aEnd + sm.index, e, rep: '' });
        n0++;
        if (n0 >= 3) break;
      }
      stripped += n0;
      continue;
    }

    if (hasDesc && !isN && !isT) {
      // A2) V431: 定语在、但值域两盘都不符（改无可改）→ 唯有句中带「运动性流年动词」时
      //     才能断定这是流月句、本命定语是贴错的 → 剥定语（让值锁与文意自然接管）
      const verb = _FR_TRANSIT_VERB.test(slot) || _FR_TRANSIT_VERB.test(clause.fwd) || _FR_TRANSIT_VERB.test(clause.bwd || '');
      if (verb && hasSuffixDesc) {
        const re = new RegExp(_FR_DESC_STRIP.source, 'gi');
        let sm, n0 = 0;
        while ((sm = re.exec(slot)) !== null) {
          let e = aEnd + sm.index + sm[0].length;
          if (text[e] === ' ' && text[e + 1] === ',') e += 1;
          patches.push({ s: aEnd + sm.index, e, rep: '' });
          n0++;
          if (n0 >= 3) break;
        }
        stripped += n0;
      }
      continue;   // 其余情况：取不到可判定的值域 → 一律不动（宁可不动，不可编）
    }

    if (!hasDesc && !hasTDesc && isN && !isT && !_FR_TRANSIT_MARK.test(slot)) {
      // B) 丢标识：本命事实被写成流月格式 → 补回 natal/natale
      const strong = !!(claim.sign && claim.house !== null);
      const ctxSig = _FR_NATAL_CTX.test(clause.fwd) || _FR_NATAL_CTX.test(clause.bwd) ||
                     _FR_NATAL_CTX.test(text.slice(Math.max(0, m.index - 90), m.index));
      if (strong || ctxSig) {
        const marker = _FR_FEM_PLANET.test(name) ? 'natale' : 'natal';
        const tail = text.slice(aEnd, aEnd + 16);
        const mc = tail.match(/^(\s*),/);
        const mp = tail.match(/^(\s*)(?:en|dans|au|à)\b/i);
        if (mc) { patches.push({ s: aEnd + mc[1].length, e: aEnd + mc[1].length, rep: ' ' + marker }); inserted++; }
        else if (mp) { patches.push({ s: aEnd + mp[1].length, e: aEnd + mp[1].length, rep: marker + ' ' }); inserted++; }
      }
      continue;
    }

    // 
    // ⚠️ V431 已考虑并**否决**的规则「C 类：流年定语贴本命句 → 换成 natal」：
    //    原句「Le Soleil transitaire en Balance, Maison 2」（Balance/2 = 本命真值）既可读作
    //    「本命句写错定语」也可读作「流月句抄了本命锚点」，两种改法都能得到真句，但
    //    V426 已定“流年定语 → 值由流年锁归真（transit 真值）”，再加逆规则会与实际锁链互踩。
    //    因此此处**不换定语**，交给 lockTransitTruthFr 把值归真。
  }
  if (!patches.length) return text;
  patches.sort((a, b) => a.s - b.s || a.e - b.e);
  let out = text;
  for (let i = patches.length - 1; i >= 0; i--) {
    const p = patches[i];
    out = out.slice(0, p.s) + p.rep + out.slice(p.e);
  }
  console.log(`[V431] 法语定语裁定: 剥离 ${stripped} 处(实为流月句的贴错定语) / 补全 ${inserted} 处(丢标识的本命句)`);
  return out;
}

function lockNatalTruthFr(text, astroMatrix) {
  if (!text) return text;
  text = normalizeForeignSignsFr(text);   // V431: 外文星座名先归真（幂等；adjudicate 内也调一次）
  const truth = astroMatrix ? _natalTruthMap10_FR(astroMatrix) : {};
  const names = Object.keys(truth);
  if (!names.length) {
    console.log('[V426] 法语本命真值盘不可用 → 跳过本命真值锁（绝不编）');
    return text;
  }
  // 🛠️ V430: 先做定语双向裁定（剥夺舍 / 补丢标识），再进本命真值锁
  text = adjudicateNatalDescriptorsFr(text, astroMatrix);
  const nameRe = new RegExp('(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  let hits = [];
  const detail = [];
  let fixes = 0, m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const t = truth[name];
    if (!t) continue;
    // V431: 本命定语两种位置都认——后缀（`Soleil natal`）+ 前置（`natif du Soleil`）
    const explicit = /^(?:natal|natale|natif|native|de naissance|à la naissance|au moment de la naissance|du thème natal|de votre thème|qui vous fit naître)\b/i.test(text.slice(m.index + m[0].length, m.index + m[0].length + 30))
      || _FR_PRE_NATAL_DESC.test(text.slice(Math.max(0, m.index - 34), m.index));
    const clause = _frClause(text, m.index, m[0].length, explicit);
    if (!clause) continue;
    const { fwd, bwd } = clause;
    const backStart = m.index - bwd.length;
    const F = _frPatchZone(fwd, t.sign, t.house, true);
    const B = bwd ? _frPatchZone(bwd, t.sign, t.house, false) : { text: bwd, count: 0, log: [] };
    if (!F.count && !B.count) continue;
    for (const x of F.log.concat(B.log)) detail.push(`${name} ${x}`);
    if (F.count) hits.push([m.index + m[0].length, m.index + m[0].length + fwd.length, F.text]);
    if (B.count) hits.push([backStart, m.index, B.text]);
    fixes += F.count + B.count;
  }
  // 🛡️ E13/R11d: 命中区间按位置倒序应用（同 _v432LockNatal 的偏移坐标系修正，本函数同构同病）
  // 🛡️ E15/R11f-3: 先做区间去交叉（第 3 例：相交区间 + 串长变化 ⇒ 右界失效吃掉字符）
  hits = _v432ResolveOverlaps(hits, 'fr 本命锁');
  hits.sort((a, b) => b[0] - a[0]);
  for (let i = 0; i < hits.length; i++) {
    const [s, e, rep] = hits[i];
    text = text.slice(0, s) + rep + text.slice(e);
  }
  if (fixes) console.log(`[V426] 法语本命盘真值锁(10行星): 修正 ${fixes} 处 native 星座/宫位漂移${detail.length ? ' | ' + detail.slice(0, 10).join('; ') : ''}`);
  text = v426EnforceNatalRetrograde(text, 'fr', astroMatrix);   // 🛠️ V426-R: 本命逆行标识锁（fr）
  return text;
}

function lockTransitTruthFr(text, astroMatrix) {
  if (!text || typeof text !== 'string' || !astroMatrix?.months?.[0]) return text;
  const truth = _transitTruthMap10_FR(astroMatrix);
  const names = Object.keys(truth);
  if (!names.length) return text;
  const nameRe = new RegExp('(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  let result = text;
  let m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const t = truth[name];
    if (!t) continue;
    // V429: "entre en [Signe]" 是入驻(ingress)事件 —— 入驻目标随日期而变（月末=下月星座, 月初=当月星座），
    //   绝不能用「当月流月星座」硬套；否则会把 LLM 写对的 Balance（9/23 太阳入驻天秤）反向改成 Vierge。
    //   同分句口径：窗口遇下一颗行星名即截断，防跨句误判。
    const _tail = text.slice(m.index + m[0].length, m.index + m[0].length + 90);
    const _bp = _tail.search(_FR_BODY_ANY);
    const entreWin = _bp >= 0 ? _tail.slice(0, _bp) : _tail;
    const entreM = entreWin.match(/\bentre en\s+([A-ZÀ-Ý][a-zà-ý]*)/i);
    if (entreM) {
      const written = entreM[1];
      const curSign = t.sign;
      const nextMonth = astroMatrix.months?.[1];
      const nextSignEn = nextMonth?.sun?.sign || nextMonth?.Sun?.sign || null;
      let nextSignFr = nextSignEn && _EN2ZIDX[nextSignEn] != null ? _FR_SIGN_FR[_EN2ZIDX[nextSignEn]] : nextSignEn;
      // 兜底：months[1] 缺失时退回黄道顺序下一个（保证 Vierge→Balance 不漏）
      if (!nextSignFr && curSign) {
        const zi = _FR_SIGN_FR.indexOf(curSign);
        if (zi >= 0) nextSignFr = _FR_SIGN_FR[(zi + 1) % 12];
      }
      // V429: 只用「明确日号」判定时序阶段。禁用 septembre/octobre 等月名（会让整月都判成月末）
      //   与裸 2[3-9]（年份 "2026" 会被误命中）——这两者是本次把正确 Balance 改成 Vierge 的真凶。
      const ctx = text.slice(Math.max(0, m.index - 80), m.index + 240);
      const _MONTHS_FR = 'janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre|janv|f[ée]vr|sept|oct|nov|d[ée]c';
      let day = null;
      let dm = ctx.match(/\bJour\s*(\d{1,2})\b/i);
      if (dm) day = Number(dm[1]);
      if (day == null) { dm = ctx.match(new RegExp('\\b(\\d{1,2})\\s*(?:er)?\\s*(?:' + _MONTHS_FR + ')\\b', 'i')); if (dm) day = Number(dm[1]); }
      if (day == null) { dm = ctx.match(new RegExp('\\b(?:' + _MONTHS_FR + ')\\.?\\s*(\\d{1,2})\\b', 'i')); if (dm) day = Number(dm[1]); }
      const isEnd = day != null
        ? day >= 22
        : /fin\s+d[eu]\s+mois|derni(?:er|ère|ers|ères)|semaine\s*4/i.test(ctx);
      const isStart = day != null
        ? day <= 8
        : /d[ée]but\s+d[eu]\s+mois|semaine\s*1/i.test(ctx);
      let fixed = null;
      if (isEnd && nextSignFr && written !== nextSignFr) fixed = nextSignFr;   // 月末入驻 → 下月星座
      else if (isStart && curSign && written !== curSign) fixed = curSign;      // 月初入驻 → 当月星座
      if (fixed) {
        const re = new RegExp('entre en ' + written.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
        const before = text;
        text = text.replace(re, 'entre en ' + fixed);
        result = text;
        nameRe.lastIndex += (text.length - before.length);
        console.log(`[V429] Fr ingress时序锁: ${name} entre en ${written} → entre en ${fixed} (day=${day})`);
      }
      continue;  // V429: 入驻句一律不走「流月星座/宫位归真」，防把正确的下月星座反向改回当月星座
    }
    const clause = _frTransitClause(text, m.index, m[0].length);
    if (!clause) continue;
    const { fwd, bwd } = clause;
    const hPat = String(t.house);
    const hasSignF = t.sign && fwd.includes(t.sign);
    const hasHouseF = t.house && fwd.includes('Maison ' + hPat);
    const hasSignB = t.sign && bwd.includes(t.sign);
    const hasHouseB = t.house && bwd.includes('Maison ' + hPat);
    if (hasSignF && hasHouseF && hasSignB && hasHouseB) continue;  // fwd 与 bwd 均已正确 → 跳过
    // V428: 分别尝试 fwd / bwd 修正（先 fwd 后 bwd），避免复合句选错窗口漏改（如 "Mars ... Maison 1, et Neptune..."）
    let z = fwd;
    let origLen = z.length;
    let patch = _frPatchZone(z, hasSignF ? null : t.sign, hasHouseF ? null : t.house, true);
    if (patch.count === 0 && bwd) {
      z = bwd;
      origLen = z.length;  // V428: 更新窗口长度，保证回写位置正确
      patch = _frPatchZone(z, hasSignB ? null : t.sign, hasHouseB ? null : t.house, false);
    }
    if (patch.count === 0) continue;
    const pos = z === fwd ? m.index + m[0].length : m.index - origLen;
    const safePos = Math.max(0, pos);
    result = result.slice(0, safePos) + patch.text + result.slice(safePos + origLen);
    const delta = patch.text.length - origLen;
    text = result;
    nameRe.lastIndex += delta;
    if (patch.count > 0) {
      const old = (fwd + bwd).replace(/\n/g, ' ');
      console.log(`[V426] Fr transit lock: ${name} → ${t.sign || '?'}${t.house ? ' Maison ' + t.house : ''} | ${old.slice(0, 40)}`);
    }
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// V432: en / es / zh 真值双锁通用引擎（镜像 V421-vi / V424-th / V426-V431-fr 架构）
//
// 为什么写「通用引擎 + 语言配置」而不是再抄三份：
//   判据宽度 = 防线宽度（V431 实锤）。三份拷贝 = 三处可能写歪的判据、三处可能漏的变体。
//   一份引擎 + 三个配置，判据只写一次，新增语言只加配置。
//
// 与既有 vi/th/fr **完全解耦**：本块不引用、不修改任何既有锁符号；既有三语锁继续独立工作。
//
// ⚠️ TDZ 铁律：本块顶层**不得**引用 SUN_SIGN_EN/ES/ZH（它们的 const 声明在本块之后），
//   一律惰性 `_v432Signs()` 取用。V421 曾因顶层引用后置 const 导致全站 502，
//   而 `node --check` 只查语法抓不到 → 必须靠启动烟测（test/smoke-boot.test.js）兜底。
// ══════════════════════════════════════════════════════════════════════════════

const _V432_LANGS = ['en', 'es', 'zh'];
const _V432_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const _V432_NAME = {
  en: { Sun: 'Sun', Moon: 'Moon', Mercury: 'Mercury', Venus: 'Venus', Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto' },
  es: { Sun: 'Sol', Moon: 'Luna', Mercury: 'Mercurio', Venus: 'Venus', Mars: 'Marte', Jupiter: 'J\u00fapiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Neptuno', Pluto: 'Plut\u00f3n' },
  zh: { Sun: '\u592a\u9633', Moon: '\u6708\u4eae', Mercury: '\u6c34\u661f', Venus: '\u91d1\u661f', Mars: '\u706b\u661f', Jupiter: '\u6728\u661f', Saturn: '\u571f\u661f', Uranus: '\u5929\u738b\u661f', Neptune: '\u6d77\u738b\u661f', Pluto: '\u51a5\u738b\u661f' },
};
// 英文星座名 → 本地化（仅 es/zh 需要；en 自身即真值语言，不需要归真）
const _V432_EN2LOC = {
  es: { Aries: 'Aries', Taurus: 'Tauro', Gemini: 'G\u00e9minis', Cancer: 'C\u00e1ncer', Leo: 'Leo', Virgo: 'Virgo', Libra: 'Libra', Scorpio: 'Escorpio', Sagittarius: 'Sagitario', Capricorn: 'Capricornio', Aquarius: 'Acuario', Pisces: 'Piscis' },
  zh: { Aries: '\u767d\u7f8a\u5ea7', Taurus: '\u91d1\u725b\u5ea7', Gemini: '\u53cc\u5b50\u5ea7', Cancer: '\u5de8\u87f9\u5ea7', Leo: '\u72ee\u5b50\u5ea7', Virgo: '\u5904\u5973\u5ea7', Libra: '\u5929\u79e4\u5ea7', Scorpio: '\u5929\u874e\u5ea7', Sagittarius: '\u5c04\u624b\u5ea7', Capricorn: '\u6469\u7faf\u5ea7', Aquarius: '\u6c34\u74f6\u5ea7', Pisces: '\u53cc\u9c7c\u5ea7' },
};
const _V432_ZH_NUM = { '\u4e00': 1, '\u4e8c': 2, '\u4e09': 3, '\u56db': 4, '\u4e94': 5, '\u516d': 6, '\u4e03': 7, '\u516b': 8, '\u4e5d': 9, '\u5341': 10, '\u5341\u4e00': 11, '\u5341\u4e8c': 12 };
const _V432_ES_ORD = { primera: 1, segundo: 2, segunda: 2, tercera: 3, cuarta: 4, quinta: 5, sexta: 6, 's\u00e9ptima': 7, septima: 7, octava: 8, novena: 9, 'd\u00e9cima': 10, decima: 10, 'und\u00e9cima': 11, undecima: 11, 'duod\u00e9cima': 12, duodecima: 12 };
const _V432_ES_ORD_FORMAT = { 1: 'primera', 2: 'segunda', 3: 'tercera', 4: 'cuarta', 5: 'quinta', 6: 'sexta', 7: 's\u00e9ptima', 8: 'octava', 9: 'novena', 10: 'd\u00e9cima', 11: 'und\u00e9cima', 12: 'duod\u00e9cima' };

// ── 惰性取本地化星座名（防 TDZ）──
function _v432Signs(lang) {
  if (lang === 'en') return SUN_SIGN_EN;
  if (lang === 'es') return SUN_SIGN_ES;
  if (lang === 'zh') return SUN_SIGN_ZH;
  return null;
}
// 附加可识别写法（中文短名：报告里常写「白羊」而非「白羊座」）
function _v432SignAlts(lang) {
  return lang === 'zh' ? ['\u767d\u7f8a', '\u91d1\u725b', '\u53cc\u5b50', '\u5de8\u87f9', '\u72ee\u5b50', '\u5904\u5973', '\u5929\u79e4', '\u5929\u874e', '\u5c04\u624b', '\u6469\u7faf', '\u6c34\u74f6', '\u53cc\u9c7c'] : [];
}
function _v432AllSignWords(lang) {
  const s = _v432Signs(lang) || [];
  return s.concat(_v432SignAlts(lang));
}

// ── 语言配置（纯字面量；全角/拉丁皆按各语言真实书写习惯）──
// 🛡️ E10/R9-R1: 英文序数后缀助手（houseOrdFmt / houseBareFmt 共用，防三处漂移）
const _v432EnOrdSuf = (n) => ((n % 10 === 1 && n !== 11) ? 'st' : (n % 10 === 2 && n !== 12) ? 'nd' : (n % 10 === 3 && n !== 13) ? 'rd' : 'th');
// 🛡️ E13/R11d-1: 英文**拼写式**序数表（first…twelfth）—— 第五类盲区值域映射。
//   病根（2026-10-03 Adelaide v511 线上实证，验收④）：LLM 文风抖动，把本命宫位从
//   `7th House` 改写成 `the seventh house`（拼写式）⇒ en cfg 四式（houseNum/houseOrd/
//   houseBare/houseBareNum）**全部只认阿拉伯数字** ⇒ 零匹配 ⇒ 第 1 章 5 处本命宫位全错。
//   表键恒小写（取 hit 时 .toLowerCase()）；值域 1~12 由 finder 钳制。
const _V432_EN_SPELLED = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12 };
const _V432_CFG = {
  en: {
    markerSide: 'pre',          // 英文定语在行星名**之前**：your natal Sun
    marker: 'natal',
    natalSuf: /^\s*[(\u2014-]?\s*(?:natal|native|of birth|at birth|birth-chart)\b/i,
    natalPre: /(?:\bnatal|\bnative|\bbirth(?:[-\s]?chart)?|\bnativ\w*|\bof birth|\bat birth)\s*$/i,
    natalAny: /\b(?:natal|native|of birth|at birth|birth-chart)\b/i,
    transitSuf: /^\s*[(\u2014-]?\s*(?:in transit|transiting|transits?|of the month|this month|current)\b/i,
    transitPre: /(?:\btransit\w*|\bcurrent|\bmonthly|\bthis month'?s?)\s*$/i,
    transitMark: /\b(?:transit\w*|enters?|entering|moves?|moving|passes?|crosses?|reaches?|travels?|visits?|journey\w*|this month|current)\b/i,
    transitVerb: /\b(?:moves?|moving|travels?|journey\w*|passes?|crosses?|reaches?|enters?|entering|glides?|shifts?|returns?|arrives?|sweeps?|visits?)\b/i,
    ingress: /\b(?:enters?|entering|ingress)\b/i,
    posMark: /\b(?:in|into|at)\b\s+[A-Z]/,
    bodyAny: /(?:^|[\s(])(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\b/,
    clauseBreak: /[.;!?:()\n]|\s(?:and|but|or|while|when|as|so|yet|then)\s/gi,
    axis: /\baxis\b|\bpolarity\b|\bbetween\b[^.]{0,60}\band\b/i,
    houseNum: /\bHouse\s*(\d{1,2})\b/i,
    houseOrd: /\b(\d{1,2})(?:st|nd|rd|th)\s+House\b/i,
    // 🛡️ E10/R9-R1: 裸序数宫位识别 —— 病根（2026-10-03 Adelaide v508 线上实证）：LLM 写
    //   "your Moon … also burns in Leo in the 7th."（句尾裸序数, 无 House 关键词），
    //   houseNum/houseOrd 双双不匹配 → 月亮 7th 漏网（真值 8th）。
    //   防误伤护栏（三重）：
    //   ① 必须 "in the|in your" 前缀 → "July 7th" / "on the 7th" / "the 7th of July" 不匹配；
    //   ② 否定前瞻 (?!\s*House\b) → "in the 7th House" 让位给 houseOrd（避免双重命中）；
    //   ③ 否定前瞻排除日期后缀（of / 月份名）→ "in the 7th of July" / "in the 7th, July 2026" 不匹配。
    //   另在 _v432FindHouse 内做 1~12 值域钳制（第 13th+ 序数恒非宫位）。
    houseBare: /\bin\s+(?:the|your)\s+(\d{1,2})(?:st|nd|rd|th)\b(?!\s*(?:House\b|of\b|,?\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\b))/i,
    // 🛡️ E12/R11a-1: 畸形宫位「数字在前 + 缺序数后缀」第三盲区 ——
    //   病根（2026-10-03 v510 线上实证 7 处）：LLM 原生写 `in the 5 House`（数字在前、House 在后、
    //   但缺 st/nd/rd/th）。四式全体不匹配：houseNum 要 `House 5`、houseOrd 要 `5th House`、
    //   houseBare 要 `in the 5th` ⇒ 连 `Your natal Moon in Leo in the 5 House`（带 natal 标记）
    //   也零改动（真值 8th 未纠）。非我方产物（houseFmt 产出 `House N`、houseBareFmt 恒带后缀）。
    //   本式**只吃 `<数字>\s+House` 段** ⇒ 前缀（in the / in your / your / the）天然落在匹配段之外，
    //   保形写回 `5th House`。1~12 值域钳制（第 13+ 恒非宫位）；`5th House` 不匹配
    //   （数字后须直接空白）⇒ 幂等且不与 houseOrd 抢匹配。
    houseBareNum: /\b(\d{1,2})\s+House\b/i,
    // 🛡️ E13/R11d-1: 第四盲区「拼写式英文序数」—— `in the seventh house` / `in your first house`。
    //   病根（2026-10-03 Adelaide v510→v511 线上实证）：四式全只认数字 ⇒ 拼写式零匹配 ⇒
    //   `your natal Sun burns in the seventh house`（真值 12th）、`Pluto in Scorpio in your
    //   first house`（真值 11th）等 5 处本命宫位全错且 CRITIC 同源失明（判据 12 复用同一 finder）。
    //   防误伤护栏（二重，与 houseBare 同哲学）：
    //   ① **可变长后顾** 强制前置 `in|into|through|within` + `the|your` —— 「the first house on
    //      the left」类无介词引导的短语、以及 "White House"/"fifth house"(爵士乐) 等不匹配；
    //   ② 匹配段**只吃** `<spelled>\s+house`（介词/冠词落在后顾里不在匹配段内）⇒ 保形写回
    //      `in the 8th House`，绝不改动前缀；1~12 值域钳制（_V432_EN_SPELLED 表）+ 幂等
    //      （输出为数字式，不再匹配本式）。
    houseSpelled: /(?<=\b(?:in|into|through|within)\s+(?:the|your)\s+)(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+house\b/i,
    houseFmt: (n) => 'House ' + n,
    houseOrdFmt: (n) => n + _v432EnOrdSuf(n) + ' House',
    houseBareFmt: (n) => 'in the ' + n + _v432EnOrdSuf(n),
    houseBareNumFmt: (n) => n + _v432EnOrdSuf(n) + ' House',
    // E13/R11d-1: 拼写式 → 标准数字序数（`seventh house`→`8th House`）；前缀由后顾保护，自动保留。
    houseSpelledFmt: (n) => n + _v432EnOrdSuf(n) + ' House',
    ctx: /\b(?:natal|native|birth|your chart|your sky)\b/i,
    dayRe: [/\bDay\s*(\d{1,2})\b/i, /\b(\d{1,2})\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b/i, /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(\d{1,2})\b/i],
    dateMark: /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s*\d{1,2}\b|\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\b|\bDay\s*\d{1,2}\b|\bWeek\s*\d\b/i,
    endHint: /\bend of (?:the )?month\b|\bfinal week\b|\bweek\s*4\b|\blast week\b/i,
    startHint: /\bbeginning of (?:the )?month\b|\bfirst week\b|\bweek\s*1\b/i,
  },
  es: {
    markerSide: 'post',         // 西语定语在行星名**之后**：el Sol natal
    marker: 'natal',
    natalSuf: /^\s*[(\u2014-]?\s*(?:natal(?:es)?|de nacimiento|natales|nacido|nacida)\b/i,
    natalPre: /(?:\bnatal(?:es)?|\bde nacimiento|\bnacido|\bnacida|\bnativ\w*)\s*$/i,
    natalAny: /\b(?:natal(?:es)?|nacimiento|nacido|nacida)\b/i,
    transitSuf: /^\s*[(\u2014-]?\s*(?:en tr[a\u00e1]nsito|transitando|transita|del mes|de este mes|actual(?:es)?)\b/i,
    transitPre: /(?:\btransitando|\ben tr[a\u00e1]nsito|\bdel mes|\bactual)\s*$/i,
    transitMark: /\b(?:tr[a\u00e1]nsito|transitando|transita|recorre|avanza|pasa|entra en|ingresa|del mes|de este mes|actual)\b/i,
    transitVerb: /\b(?:recorre|avanza|pasa|entra|ingresa|transita|viaja|cruza|llega|se desplaza|retorna)\b/i,
    ingress: /\b(?:entra en|entrar[a\u00e1] en|ingresa en|ingresar[a\u00e1] en)\b/i,
    posMark: /\b(?:en)\b\s+[A-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1]/,
    bodyAny: /(?:^|[\s(])(?:Sol|Luna|Mercurio|Venus|Marte|J\u00fapiter|Saturno|Urano|Neptuno|Plut\u00f3n)\b/,
    clauseBreak: /[.;!?:()\n]|\s(?:y|pero|o|mientras|cuando|aunque|entonces)\s/gi,
    axis: /\beje\b|\bentre\b[^.]{0,60}\by\b/i,
    // 🔴 E24③/P4（2026-10-06 线上实证 · 2006-06-21 Ushuaia 盘）：西语正文高频**借用英语宫位形态**
    //   `5º House`（实测 3 处本命宫位错配：Júpiter→H9 / Saturno→H5 / Plutón→H10，星座全对宫位错）。
    //   病根：原三式（houseNum / houseOrd / houseAbbr）**全部只认 `Casa`** ⇒ finder 零匹配 ⇒
    //   本命宫位真值锁**结构性空转**（月标题恰用 `Casa N` 故 12/12 正常，缺陷只暴露在正文）。
    //   治法（军师 E24③ P0 指令）：houseNum / houseOrd **直接并入 `House` 分支**（同式同形，写回形态无歧义）；
    //   houseAbbr 因**保形写回**要求（`ª Casa` ↔ `º House` 两形态不可互串）改用**同源独立式** houseAbbrEn
    //   （共享同一「否定后顾 + 数字 + 可选指示符 + 宫位词」骨架），见其定义处注释。
    houseNum: /\b(?:Casa|House)\s*(\d{1,2})\b/i,
    houseOrd: /\b(primera|segunda|tercera|cuarta|quinta|sexta|s[e\u00e9]ptima|octava|novena|d[e\u00e9]cima|und[e\u00e9]cima|duod[e\u00e9]cima)\s+(?:casa|house)\b/i,
    // 🛡️ E15/R11f-2: 第五类盲区（**E13「拼写式序数」的西语孪生体**）——
    //   `5ª Casa` / `5º Casa` / `5.ª Casa` / `5a Casa`（阴性/阳性序数指示符 + 数字在前）。
    //   病根（2026-10-04 12 盘批测实证）：es cfg 原本只有 houseNum(`Casa 5`) + houseOrd(拼写式)
    //   两式，**不含任何「数字在前 + 指示符」形态**；LLM 文风抖动时产出 `Tu Sol en Cáncer ocupa
    //   la 5ª Casa`（真值 Casa 4）⇒ finder 零匹配 ⇒ 本命宫位错配漏网（Ushuaia 盘实测 **54 处**，
    //   同语 Madrid 盘 0 处 ⇒ 纯文风抖动，与 E13 的 `seventh house` 同源）。
    //   防误伤护栏：
    //   ① 否定后顾 `(?<![\d.,])` —— `2026 Casa` / `1.5 Casa` 不会把尾段数字当宫位号；
    //   ② 匹配段**只吃** `<数字><指示符?> Casa` ⇒ 前缀（`la` / `tu` / `en tu`）落在匹配段之外，
    //      写回时自动保留；
    //   ③ 1~12 值域钳制（在 _v432FindHouse 内），第 13+ 恒非宫位；
    //   ④ 写回**保形**（`4ª Casa`）而非归一成 `Casa 4` —— 避免与同窗内月份标题的 `Casa N`
    //      形态相撞，且输出不再匹配本式（幂等）。
    //   ⚠️ 已知边界：带点形态 `5.ª Casa` 会被 `_v432Clause` 的 clauseBreak（含 `.`）切成两段
    //      ⇒ 窗口内无法整体匹配。**实测真实产出为不带点的 `5ª Casa`（Ushuaia 盘 54 处）**，已覆盖；
    //      带点形态为低概率变体，收窄 clauseBreak 会波及 E9~E12 全部真值锁，收益远小于风险，故不做。
    houseAbbr: /(?<![\d.,])\b(\d{1,2})\s*(?:\.?\s*[\u00ba\u00aa\u00b0oa])?\s*[Cc]asa\b/i,
    // 🔴 E24③/P4: **英文借形宫位**（`5º House` / `5 House`）—— 与 houseAbbr **同源骨架**
    //   （同一否定后顾 `(?<![\d.,])` + 1~12 值域钳制 + 可选序数指示符），唯宫位词换 `House`。
    //   **独立成式**（而非并入 houseAbbr）的唯一理由 = **保形回写**：`4ª Casa` 与 `4º House`
    //   两形态绝不互串 ⇒ 零形态污染、零回归（houseAbbr 原行为逐字不变）。
    //   ⚠️ 词边界安全：`2026 House` 不匹配（`(\d{1,2})` 后须词边界 ⇒ 长数字回溯到单字符仍非边界）；
    //      与 en 的 `houseNum:/\bHouse\s*(\d{1,2})\b/` 同哲学，双侧对称。带点形态 `5.º House` 同
    //      houseAbbr 已知边界（clauseBreak 含 `.`），实测真实产出为无点形态，不扩大改动面。
    houseAbbrEn: /(?<![\d.,])\b(\d{1,2})\s*(?:\.?\s*[\u00ba\u00aa\u00b0oa])?\s*House\b/i,
    houseFmt: (n) => 'Casa ' + n,
    houseOrdFmt: (n) => (_V432_ES_ORD_FORMAT[n] || n) + ' casa',
    houseAbbrFmt: (n) => n + '\u00aa Casa',
    houseAbbrEnFmt: (n) => n + '\u00ba House',
    ctx: /\b(?:natal(?:es)?|nacimiento|tu carta|tu cielo)\b/i,
    dayRe: [/\bD[i\u00ed]a\s*(\d{1,2})\b/i, /\b(\d{1,2})\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/i],
    dateMark: /\bD[i\u00ed]a\s*\d{1,2}\b|\b\d{1,2}\s+de\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b|\b(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s*\d{1,2}\b|\bSemana\s*\d\b/i,
    endHint: /\bfin de mes\b|\bfinal del mes\b|\b[u\u00fa]ltima semana\b|\bsemana\s*4\b/i,
    startHint: /\bprincipio de mes\b|\bcomienzo del mes\b|\bprimera semana\b|\bsemana\s*1\b/i,
  },
  zh: {
    markerSide: 'pre',          // 中文定语在行星名**之前**：本命太阳
    marker: '\u672c\u547d',
    natalSuf: /^\s*[(\uff08]?\s*(?:\u672c\u547d|\u51fa\u751f|\u539f\u751f|\u672c\u76d8)/,
    natalPre: /(?:\u672c\u547d|\u51fa\u751f|\u539f\u751f|\u672c\u76d8).*$/,  // V469-fix: 中文本命不限preWin末尾
    natalAny: /(?:\u672c\u547d|\u51fa\u751f|\u539f\u751f|\u672c\u76d8)/,
    transitSuf: /^\s*[(\uff08]?\s*(?:\u6d41\u5e74|\u884c\u8fd0|\u8fc7\u5883|\u672c\u6708|\u5f53\u6708|\u5f53\u524d)/,
    transitPre: /(?:\u6d41\u5e74|\u884c\u8fd0|\u8fc7\u5883|\u672c\u6708|\u5f53\u6708|\u5f53\u524d)\s*$/,
    transitMark: /(?:\u6d41\u5e74|\u884c\u8fd0|\u8fc7\u5883|\u672c\u6708|\u5f53\u6708|\u5f53\u524d|\u8fdb\u5165|\u5165\u9a7b|\u7ecf\u8fc7|\u79fb\u81f3|\u8d70\u5230)/,
    transitVerb: /(?:\u8fdb\u5165|\u5165\u9a7b|\u7ecf\u8fc7|\u79fb\u81f3|\u8d70\u5230|\u884c\u81f3|\u8fd0\u884c|\u56de\u5230|\u62b5\u8fbe|\u626b\u8fc7)/,
    ingress: /(?:\u8fdb\u5165|\u5165\u9a7b)/,
    posMark: /(?:\u5728|\u4e8e|\u4f4d\u4e8e)/,
    bodyAny: /(?:\u592a\u9633|\u6708\u4eae|\u6c34\u661f|\u91d1\u661f|\u706b\u661f|\u6728\u661f|\u571f\u661f|\u5929\u738b\u661f|\u6d77\u738b\u661f|\u51a5\u738b\u661f)/,
    clauseBreak: /[\u3002\uff1b\uff01\uff1f\uff1a\n]/g,
    axis: /(?:\u8f74\u7ebf|\u5bf9\u8f74|\u4e4b\u95f4)/,
    houseNum: /(?:\u7b2c\s*)?(\d{1,2})\s*\u5bab/,
    houseOrd: /\u7b2c\s*([\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u5341\u4e00\u5341\u4e8c]{1,3})\s*\u5bab/,
    houseFmt: (n) => '\u7b2c' + n + '\u5bab',
    houseOrdFmt: (n) => '\u7b2c' + n + '\u5bab',
    ctx: /(?:\u672c\u547d|\u51fa\u751f|\u539f\u751f|\u672c\u76d8)/,
    dayRe: [/(?:\d{1,2}\u6708)?(\d{1,2})\u65e5/, /\u7b2c(\d{1,2})\u5929/],
    dateMark: /\d{1,2}\u6708\d{1,2}\u65e5|\u7b2c\s*\d{1,2}\s*\u5929|\u7b2c\s*[\u4e00\u4e8c\u4e09\u56db1-4]\s*\u5468|\d{1,2}\u65e5/,
    endHint: /\u6708\u672b|\u6700\u540e\u4e00\u5468|\u7b2c\s*4\s*\u5468|\u7b2c\u56db\u5468/,
    startHint: /\u6708\u521d|\u6708\u4e0a\u65ec|\u7b2c\u4e00\u5468|\u7b2c\s*1\s*\u5468/,
  },
};

function _v432Esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ── 真值盘（本命 / 流月），与 vi/th/fr 同构，仅换语言字典 ──
function _v432Truth(lang, astroMatrix, kind) {
  const signs = _v432Signs(lang);
  if (!signs) return {};
  const NAME = _V432_NAME[lang] || {};
  const map = {};
  if (kind === 'natal') {
    const meta = astroMatrix?.meta || {};
    const ch = meta.computed_houses || {};
    for (const p of _V432_ORDER) {
      const info = (p === 'Moon' ? (meta.natal_moon || ch.Moon) : ch[p]) || null;
      if (!info) continue;
      const signEN = info.sign || (p === 'Sun' ? meta.sun_sign : null);
      const idx = _EN2ZIDX[signEN];
      const sign = idx != null ? signs[idx] : null;
      const house = Number(info.house) || 0;
      if (sign || house) map[NAME[p]] = { sign, house, retrograde: !!info.retrograde };
    }
    return map;
  }
  const first = astroMatrix?.months?.[0];
  if (!first) return {};
  for (const p of _V432_ORDER) {
    // ⚠️ V432-fix: 月亮排除在流月真值之外 —— 月亮约 2.5 天换一宫，
    //   而真值盘只是「月初快照」。用月初快照去「纠正」报告里带日期的月亮句（如
    //   "the transiting Moon in Libra, House 4, on September 1-2"）= 把正确写反。
    //   月亮保留在本命锁（本命月亮是出生锁定的固定事实）。宁可不纠，不可编。
    if (p === 'Moon') continue;
    const k = p.toLowerCase();
    const info = p === 'Sun' ? (first.sun || (first.positions && first.positions.Sun) || {}) : (first[k] || {});
    if (!info) continue;
    const idx = _EN2ZIDX[info.sign];
    const sign = idx != null ? signs[idx] : null;
    const house = Number(info.house) || 0;
    if (sign || house) map[NAME[p]] = { sign, house };
  }
  return map;
}

// ── 宫位定位（数字式 / 序数式 / 汉字式），返回 {idx,len,value,ord} ──
function _v432FindHouse(cfg, zone, preferFirst) {
  let best = null, m;
  if (cfg.houseNum) {
    const re = new RegExp(cfg.houseNum.source, 'g');
    while ((m = re.exec(zone)) !== null) {
      const hit = { idx: m.index, len: m[0].length, value: Number(m[1]), ord: false };
      if (preferFirst) { best = hit; break; }
      best = hit;
    }
  }
  if (cfg.houseOrd) {
    const re = new RegExp(cfg.houseOrd.source, 'g');
    while ((m = re.exec(zone)) !== null) {
      let v = null;
      if (cfg === _V432_CFG.zh) v = _V432_ZH_NUM[m[1]] || null;
      else if (cfg === _V432_CFG.es) v = _V432_ES_ORD[m[1].toLowerCase()] || null;
      else v = Number(m[1]) || null;
      if (!v) continue;
      const hit = { idx: m.index, len: m[0].length, value: v, ord: true };
      const take = !best || (preferFirst ? hit.idx < best.idx : hit.idx > best.idx);
      if (take) best = hit;
    }
  }
  // 🛡️ E10/R9-R1: 裸序数（"in the 7th"）—— en 专属；ord:'bare' 让 PatchZone 选用 houseBareFmt
  //   保形替换（写回 "in the 8th"，绝不长出 House 关键词）。1~12 值域钳制：第 13th+ 恒非宫位。
  if (cfg.houseBare) {
    const re = new RegExp(cfg.houseBare.source, 'gi');
    while ((m = re.exec(zone)) !== null) {
      const v = Number(m[1]);
      if (!(v >= 1 && v <= 12)) continue;
      const hit = { idx: m.index, len: m[0].length, value: v, ord: 'bare' };
      const take = !best || (preferFirst ? hit.idx < best.idx : hit.idx > best.idx);
      if (take) best = hit;
    }
  }
  // 🛡️ E12/R11a-1: 畸形形态「<数字> House」（缺序数后缀）—— en 专属；ord:'numHouse' 让 PatchZone
  //   用 houseBareNumFmt 保形写回 `Nth House`（前缀在匹配段之外 ⇒ 自动保留）。1~12 值域钳制。
  if (cfg.houseBareNum) {
    const re = new RegExp(cfg.houseBareNum.source, 'gi');
    while ((m = re.exec(zone)) !== null) {
      const v = Number(m[1]);
      if (!(v >= 1 && v <= 12)) continue;
      const hit = { idx: m.index, len: m[0].length, value: v, ord: 'numHouse' };
      const take = !best || (preferFirst ? hit.idx < best.idx : hit.idx > best.idx);
      if (take) best = hit;
    }
  }
  // 🛡️ E13/R11d-1: 拼写式英文序数（`in the seventh house` / `in your first house`）—— en 专属；
  //   ord:'spelled' 让 PatchZone 用 houseSpelledFmt 保形写回 `Nth House`。表值缺失 / 越值域一律跳过。
  if (cfg.houseSpelled) {
    const re = new RegExp(cfg.houseSpelled.source, 'gi');
    while ((m = re.exec(zone)) !== null) {
      const v = _V432_EN_SPELLED[String(m[1]).toLowerCase()] || null;
      if (!v || !(v >= 1 && v <= 12)) continue;
      const hit = { idx: m.index, len: m[0].length, value: v, ord: 'spelled' };
      const take = !best || (preferFirst ? hit.idx < best.idx : hit.idx > best.idx);
      if (take) best = hit;
    }
  }
  // 🛡️ E15/R11f-2: 序数指示符缩写形态（es 专属：`5ª Casa` / `5º Casa` / `5a Casa` / `5.ª Casa`）
  //   —— E13「拼写式序数」的西语孪生体；ord:'abbr' 让 PatchZone 用 houseAbbrFmt 保形写回。
  //   1~12 值域钳制（`2026 Casa` 已被否定后顾挡在正则外，此处再兜一层）。
  if (cfg.houseAbbr) {
    const re = new RegExp(cfg.houseAbbr.source, 'gi');
    while ((m = re.exec(zone)) !== null) {
      const v = Number(m[1]);
      if (!(v >= 1 && v <= 12)) continue;
      const hit = { idx: m.index, len: m[0].length, value: v, ord: 'abbr' };
      const take = !best || (preferFirst ? hit.idx < best.idx : hit.idx > best.idx);
      if (take) best = hit;
    }
  }
  // 🛡️ E24③/P4: 英文借形宫位（es 专属：`5º House` / `5 House`）—— E15「序数指示符缩写」的
  //   **英文借形孪生体**；ord:'abbrEn' 让 PatchZone 用 houseAbbrEnFmt 保形写回 `Nº House`。
  //   与 houseAbbr 分支**结构逐字对称**（同取值域钳制 + 同 best 语义），仅写回形态不同。
  if (cfg.houseAbbrEn) {
    const re = new RegExp(cfg.houseAbbrEn.source, 'gi');
    while ((m = re.exec(zone)) !== null) {
      const v = Number(m[1]);
      if (!(v >= 1 && v <= 12)) continue;
      const hit = { idx: m.index, len: m[0].length, value: v, ord: 'abbrEn' };
      const take = !best || (preferFirst ? hit.idx < best.idx : hit.idx > best.idx);
      if (take) best = hit;
    }
  }
  return best;
}

// ── 定语槽：行星名 → 第一个星座/宫位之间 ──
function _v432SlotOf(cfg, lang, text, aEnd) {
  const after = text.slice(aEnd, aEnd + 50);
  let cut = after.length;
  for (const s of _v432AllSignWords(lang)) { const k = after.indexOf(s); if (k >= 0 && k < cut) cut = k; }
  const h = _v432FindHouse(cfg, after, true);
  if (h && h.idx < cut) cut = h.idx;
  return after.slice(0, cut);
}

// ── 从句窗口（fwd / bwd），口径与 vi/th/fr 一致 ──
// 🛠️ V482: fwd 窗口「断句界定符补完」—— 除 `.` `\n` `。` 外, 补 `；;！!？?：:` 与并列/转折连词。
//   病根（2026-09-30 军师抓 + 探针实证）：「本命射手座月亮在第9宫…；而巨蟹座上升…」的月亮从句
//   fwd 窗口**只按 /[.\n。]/ 断句、不吃「；」** → 跨过「；」吃进下一句「巨蟹座上升」→
//   把月亮的真值星座（双鱼座）错扣到上升头上（张冠李戴, dormant 主动污染）。
const _V482_FWD_BREAK = /[.\n\u3002\uff1b\uff01\uff1f\uff1a;!?:]/;
const _V482_FWD_CONJ = {
  zh: /而|但|则|同时|然而|此外|并且|以及/,
  en: /\s(?:and|but|or|while|when|as|so|yet|then)\s/i,
  es: /\s(?:y|pero|o|mientras|cuando|aunque|entonces)\s/i,
};
// 🛠️ V482: 「星座紧邻行星名之前」（如「射手座月亮」）= 报告自带的本命归属写法。
//   用途① _v432Clause: 这类句子常无显式「本命/出生」定语 → 旧逻辑弃权致漂移漏网, 需补前向窗口。
//   用途② _v432AdjudicateDescriptors B 类: 已有星座归属 → 无需再补「本命」, 否则产出「双鱼座本命月亮」倒装。
function _v482SignAdjacent(text, lang, idx) {
  const pre = text.slice(Math.max(0, idx - 12), idx);
  return _v432AllSignWords(lang).some((s) => pre.endsWith(s));
}
function _v432Clause(cfg, lang, text, i, len, explicit, opts2 = {}) {
  const aEnd = i + len;
  // 🛠️ V482: 「本命标签式」识别 —— 星座词**紧邻行星名之前**（如「射手座月亮」）是本报告自带的本命归属写法。
  //   这类句子常无显式「本命/出生」定语（如「射手座月亮在第9宫」），旧逻辑一律弃权 → LLM sign-bleed 漏网
  //   （太阳射手座被串染给月亮）。仅补前向窗口, 不改显式本命句 / 流年句既有行为。
  const signAdjacent = _v482SignAdjacent(text, lang, i);
  if (!explicit && !signAdjacent) {
    const after = text.slice(aEnd, aEnd + 50);
    let pre = after, cut = -1;
    for (const s of _v432AllSignWords(lang)) { const k = after.indexOf(s); if (k >= 0 && (cut < 0 || k < cut)) cut = k; }
    const hm = _v432FindHouse(cfg, after, true);
    if (hm && (cut < 0 || hm.idx < cut)) cut = hm.idx;
    if (cut >= 0) pre = after.slice(0, cut);
    if (!cfg.natalAny.test(pre)) return null;
    if (cfg.transitMark.test(pre)) return null;
  }
  let fwd = text.slice(aEnd, aEnd + (opts2.wide ? 220 : 90));
  let e = fwd.search(_V482_FWD_BREAK);
  // 🛡️ V492b/E9: wide 模式（前导段）不停在连接词 —— 前导段是描述性长句
  //   （"Jupiter, your ruling planet as a Sagittarian, sits in Leo…"），
  //   「 as 」会拦腰截断窗口吃掉真正的星座/宫位声称；句号断句仍然生效。
  const cj = (opts2.wide || !_V482_FWD_CONJ[lang]) ? -1 : fwd.search(_V482_FWD_CONJ[lang]);
  if (cj >= 0 && (e < 0 || cj < e)) e = cj;
  if (e >= 0) fwd = fwd.slice(0, e);
  const bIdx = fwd.search(cfg.bodyAny);
  if (bIdx >= 0) fwd = fwd.slice(0, bIdx);
  // 🛡️ V492b/E9: 「星座 + Ascendant/Rising/Midheaven」= 轴点事实（上升/中天星座），
  //   不是行星的星座声称（cfg.axis 不含 Ascendant ⇒ 旧逻辑把 "Capricorn Ascendant"
  //   当行星声称改写 = 伪造轴点）。窗口分段：fwd=轴点之前的声称段（剥掉紧邻星座词）、
  //   fwd2=轴点之后的声称段（"sits in Aries in the 4th House" 的真声称全在这）；
  //   轴点词本身两段都不含 ⇒ 原样保留，两段各自送 PatchZone 纠值。
  //   （不可用等长空格掩蔽 —— 窗口文本会被写回正文，掩蔽=物理删除轴点词，Adelaide 实证。）
  let fwd2 = null, fwd2Off = 0;
  const aTok = fwd.match(/\b(?:Ascendant|Rising\s+Sign|Rising|Midheaven)\b/i);
  if (aTok) {
    const tIdx0 = aTok.index, tEnd0 = tIdx0 + aTok[0].length;
    const _mAxisSign = fwd.slice(0, tIdx0).match(new RegExp('(?:' + _v432AllSignWords(lang).join('|') + ')\\s*$', 'i'));
    fwd2Off = tEnd0;
    fwd2 = fwd.slice(tEnd0);
    fwd = fwd.slice(0, _mAxisSign ? _mAxisSign.index : tIdx0);
  } else {
    const aIdx = fwd.search(cfg.axis);
    if (aIdx >= 0) fwd = fwd.slice(0, aIdx);
  }
  const bwdBase = Math.max(0, i - 70);
  let bwd = text.slice(bwdBase, i);
  let bwdOff = bwdBase;        // bwd 在 text 中的**绝对起点**（见下 E18 注释，调用方禁止再用长度推算）
  let bwdOther = false;        // bwd 是否被「另一颗行星名」截断（该窗段的前置星座/宫位归属那颗行星）
  if (cfg.transitMark.test(bwd)) {
    bwd = '';
  } else {
    let lo = 0;
    for (const m of bwd.matchAll(cfg.clauseBreak)) lo = Math.max(lo, m.index + m[0].length);
    // 🛠️ V482: 「其他行星名截断」只在**本从句内**生效 —— 旧写法 slice(lo, Math.max(lo, bm)) 在
    //   上一个行星名位于最近断句点**之前**时（bm < lo）退化成 slice(lo, lo) = 空串,
    //   把「；本命射手座」这截自己吃掉 → bwd 永远捕不到「星座紧邻行星名之前」的写法 →
    //   「射手座月亮」这类漂移**从来纠不动**。改为：先取本从句尾段, 再在其中截断到首个其他行星名。
    const tail = bwd.slice(lo);
    const bm = tail.search(cfg.bodyAny);
    if (bm >= 0) { bwd = tail.slice(0, bm); bwdOther = true; } else { bwd = tail; }
    // 🛡️ E18/R11k（偏移坐标系铁律 · 第 4 例）：bwd 必须回传**绝对起点**。
    //   旧调用方写法 `backStart = m.index - bwd.length` 隐含「bwd 是紧贴锚点的后缀」这一前提；
    //   而 `cfg.bodyAny = /(?:^|[\s(])(?:Sun|Moon|…)\b/` 会**吞掉前导分隔符** ⇒
    //   `bwd = tail.slice(0, bm)` 与锚点之间还隔着 `tail.slice(bm)`（如 `" Sun, "`）⇒
    //   起点被右移 (窗口长 − bm) 个字符。实证（s2 en 库内文本 replay）：库内正确句
    //   `Sagittarius 12th House emphasis in your chart — Sun, Moon,` 被替换成
    //   `SagittLeo 8th House emphasis in your chart —Moon,`（保留 `Sagitt` + 写入 `Leo`
    //   + 吞掉 `" Sun, "`）—— 正是线上 HIT 逐字复现的 artifact。
    //   ⇒ 起点一律由 builder 回传（`bwdOff = 窗口起点 + 从句起点`），彻底废除长度推算。
    //   ⚠️ `bm < 0`（无其他行星名截断）时 `bwdBase + lo === i - bwd.length` ⇒ 行为逐字节不变。
    bwdOff = bwdBase + lo;
  }
  return { fwd, bwd, bwdOff, bwdOther, fwd2, fwd2Off };
}

// ── 流月从句归因：需「位置描述」或「流月标记」，且无本命定语 ──
function _v432TransitClause(cfg, lang, text, i, len) {
  const aEnd = i + len;
  const after = text.slice(aEnd, aEnd + 50);
  let pre = after, cut = -1;
  for (const s of _v432AllSignWords(lang)) { const k = after.indexOf(s); if (k >= 0 && (cut < 0 || k < cut)) cut = k; }
  const hm = _v432FindHouse(cfg, after, true);
  if (hm && (cut < 0 || hm.idx < cut)) cut = hm.idx;
  if (cut >= 0) pre = after.slice(0, cut);
  if (cfg.natalAny.test(pre)) return null;                                   // 本命句 → 归属本命锁
  const preWin = text.slice(Math.max(0, i - 34), i);
  if (cfg.natalPre.test(preWin)) return null;                                 // 前置本命定语
  if (!cfg.posMark.test(after) && !cfg.transitMark.test(after)) return null;   // 非位置/流月描述 → 不碰
  return _v432Clause(cfg, lang, text, i, len, true);
}

// ── 该从句「声称」的星座/宫位 ──
function _v432ClaimOf(cfg, lang, fwd, bwd) {
  const words = _v432AllSignWords(lang);
  let sign = null, si = -1;
  for (const s of words) { const k = fwd.indexOf(s); if (k >= 0 && (si < 0 || k < si)) { si = k; sign = s; } }
  let house = null;
  const h = _v432FindHouse(cfg, fwd, true);
  if (h) house = h.value;
  if (!sign && bwd) { let bi = -1; for (const s of words) { const k = bwd.lastIndexOf(s); if (k > bi) { bi = k; sign = s; } } }
  if (house === null && bwd) { const hb = _v432FindHouse(cfg, bwd, false); if (hb) house = hb.value; }
  return { sign, house };
}

// 声称值是否与真值一致（有宫位则星座+宫位都要中）
function _v432TruthMatch(t, sign, house) {
  if (!t) return false;
  if (!sign && house === null) return false;
  if (sign && t.sign !== sign) return false;
  if (house !== null && t.house !== house) return false;
  return true;
}

// ── 单段替换：星座归真 + 宫位归真（含未知/拼写错误兜底）──
function _v432PatchZone(cfg, lang, zone, sign, house, preferFirst, text, absBase) {
  let z = zone, cnt = 0, log = [];
  const words = _v432AllSignWords(lang);
  if (sign) {
    let best = null;
    for (const s of words) {
      if (s === sign) continue;
      // ⚠️ V432: 真名与候选互为子串时必须跳过（中文全称/简称互含：'天蝎' ⊂ '天蝎座'），
      //   否则会把已经正确的 '天蝎座' 里的 '天蝎' 当成错值再替换一次 → '天蝎座座'
      if (s.includes(sign) || sign.includes(s)) continue;
      const idx = preferFirst ? z.indexOf(s) : z.lastIndexOf(s);
      if (idx < 0) continue;
      // 🛠️ V436: 泰语月名内嵌星座名防撞（统一挂到全部真值锁）—— 候选星座位置落在月名区间内
      //   （如 กันยายน⊃กันยา）= 不是星座引用，跳过。non-th 文本不含泰语月名 → 零误杀。
      if (text != null && absBase != null && _v436InThMonth(text, absBase + idx, s.length)) continue;
      if (best === null || (preferFirst ? idx < best.idx : idx > best.idx)) best = { idx, s };
    }
    // 🛡️ V448: 窗内已出现「本行星的正确星座」时，绝不再改写窗内其它星座——
    //   窗可能跨并列锁点（如「本命太阳在摩羯座第10宫，上升白羊座」），否则会把属于「上升」的
    //   白羊座当成本命太阳的错星座改写 → 张冠李戴（生产实测：上升白羊座 被 摩羯座 吃掉）。
    //   哲学：宁可漏改，不可编（本行星星座已在，窗内其余星座多半归属别的实体）。
    if (best && z.includes(sign)) best = null;
    if (best) {
      z = z.slice(0, best.idx) + sign + z.slice(best.idx + best.s.length);
      cnt++; log.push(`sign ${best.s}\u2192${sign}`);
    } else if (!z.includes(sign)) {
      // 兜底：z 里既没有预期星座、也没有任何已知星座 → 可能是拼写错误/外文/缩写
      const hm = _v432FindHouse(cfg, z, true);
      if (hm) {
        const before = z.slice(0, hm.idx).replace(/[\s,\uff0c\u3001]+$/, '');
        const w = lang === 'zh'
          ? before.match(/([\u4e00-\u9fa5]{2,4})$/)
          : before.match(/([A-Za-z\u00c0-\u017f]{3,14})$/);
        if (w) {
          const word = w[1];
          const known = words.includes(word) || (lang !== 'zh' && word.toLowerCase() === String(sign).toLowerCase());
          const looksSign = lang === 'zh' ? true : /^[A-Z\u00c0-\u00de]/.test(word);
          if (word !== sign && !known && looksSign) {
            const wStart = before.length - word.length;
            // 🛠️ V436: 月名内嵌星座名防撞（兜底分支也要守卫，保守漏改非假阳性）
            if (text != null && absBase != null && _v436InThMonth(text, absBase + wStart, word.length)) {
              // 候选词落在泰语月名区间内（如 กันยายน⊃กันยา）= 不是星座引用 → 跳过替换
            } else {
              // 🛡️ E15/R11f-3: 偏移修正 —— `before` 只是去掉了【尾部】空白/逗号，其【首部】与 z 完全对齐
              //   ⇒ 词在 z 中的绝对起点就是 `wStart` 本身。旧写法 `base + wStart` 把起点右移了 `base`
              //   个字符（base = 被裁掉的尾部空白数）⇒ 保留词的前 base 个字符 + 写入 sign ⇒ 产出
              //   `LioCáncer` 这类残字 artifact（同族缺陷，见 fr/th/vi 通道 `z.slice(0, wStart)` 的正确写法）。
              //   `base` 仅用于「词尾到宫位之间」的定位，绝不能参与替换起点。
              z = z.slice(0, wStart) + sign + z.slice(wStart + word.length);
              cnt++; log.push(`sign ${word}\u2192${sign}(未知/拼写兜底)`);
            }
          }
        }
      }
    }
  }
  if (house) {
    const h = _v432FindHouse(cfg, z, preferFirst);
    if (h && h.value !== Number(house)) {
      // 🛡️ E10/R9-R1: 裸序数命中 → houseBareFmt 保形替换（"in the 7th"→"in the 8th"，不长出 House）
      // 🛡️ E12/R11a-1: 畸形形态命中（"5 House"）→ houseBareNumFmt 补序数后缀（"5th House"）
      // 🛡️ E13/R11d-1: 拼写式命中（"in the seventh house"）→ houseSpelledFmt 保形写回（"in the 8th House"）
      // 🛡️ E15/R11f-2: 序数指示符缩写命中（es `5ª Casa`）→ houseAbbrFmt 保形写回（`4ª Casa`）
      const repl = h.ord === 'bare' ? cfg.houseBareFmt(house)
        : h.ord === 'numHouse' ? cfg.houseBareNumFmt(house)
        : h.ord === 'spelled' ? cfg.houseSpelledFmt(house)
        : h.ord === 'abbr' ? cfg.houseAbbrFmt(house)
        // 🛡️ E24③/P4: 英文借形命中（es `5º House`）→ houseAbbrEnFmt 保形写回（`4º House`）
        : h.ord === 'abbrEn' ? cfg.houseAbbrEnFmt(house)
        : (h.ord ? cfg.houseOrdFmt(house) : cfg.houseFmt(house));
      z = z.slice(0, h.idx) + repl + z.slice(h.idx + h.len);
      cnt++; log.push('house ' + h.value + '\u2192' + house);
    }
  }
  return { text: z, count: cnt, log };
}

// ── 外文（英）星座名归真 + 本地化简短名归真（幂等）──
function _v432Normalize(text, lang) {
  if (!text || typeof text !== 'string') return text;
  const map = _V432_EN2LOC[lang];
  if (!map) return text;
  let n = 0;
  const re = new RegExp('\\b(' + Object.keys(map).map(_v432Esc).join('|') + ')\\b', 'g');
  const out = text.replace(re, (w) => { const r = map[w]; if (r && r !== w) { n++; return r; } return w; });
  if (n) console.log(`[V432] ${lang} \u5916\u6587\u661f\u5ea7\u540d\u5f52\u771f: ${n} \u5904`);
  return out;
}

// 🛡️ V479: 「月标题行」识别 —— 标题行(^#{1,6}) 且自带年月(zh: 2027年8月 / en·es: August 2027)。
//   病根: 月标题描述的是【流月】太阳/行星, 措辞极简(通常无「流年/进入」这类 transitMark),
//   故 B 类「本命事实被写成流月格式 → 补本命标识」在此必然误判——尤其当该月流月值恰好与
//   本命值同 sign+house 时(实测 1989-08-15 奥斯陆盘: 8 月流月太阳=狮子座第10宫=本命太阳值),
//   标题被补成「本命太阳狮子座」, 与其余 11 个月「太阳X座 第N宫」措辞不一。
//   铁律: 月标题的太阳永远是流月值, 永不加本命定语; 措辞统一由 lockYearlyMonthTitles 兜底。
function _v479IsMonthTitleLine(text, idx) {
  const ls = text.lastIndexOf('\n', idx - 1) + 1;
  let le = text.indexOf('\n', idx);
  if (le === -1) le = text.length;
  const line = text.slice(ls, le);
  if (!/^\s*#{1,6}\s/.test(line)) return false;
  if (/\d{4}\s*\u5e74\s*\d{1,2}\s*\u6708/.test(line)) return true;   // zh: 2027年8月
  return new RegExp('(?:January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{4}').test(line)   // en
    || new RegExp('(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\\s*\\d{4}').test(line);   // es
}

// ── 定语双向裁定（镜像 V430/V431：A 夺舍剥离 / A2 值域皆不符+运动动词 / B 丢标识补全）；否决不动的 C 类留档 ──
function _v432AdjudicateDescriptors(text, lang, astroMatrix) {
  const cfg = _V432_CFG[lang];
  if (!cfg) return text;
  const NT = _v432Truth(lang, astroMatrix, 'natal');
  const names = Object.keys(NT);
  if (!names.length) return text;
  const TT = _v432Truth(lang, astroMatrix, 'transit');
  const nameRe = new RegExp('(' + names.map(_v432Esc).join('|') + ')', 'g');
  const patches = [];
  let stripped = 0, inserted = 0, m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const nt = NT[name];
    const aEnd = m.index + m[0].length;
    const slot = _v432SlotOf(cfg, lang, text, aEnd);
    const preWin = text.slice(Math.max(0, m.index - 34), m.index);
    const isPrefix = cfg.natalPre.test(preWin);
    const hasSuffixDesc = cfg.natalSuf.test(slot);
    const hasDesc = hasSuffixDesc || isPrefix;
    const hasTDesc = cfg.transitSuf.test(slot) || cfg.transitPre.test(preWin);
    const clause = _v432Clause(cfg, lang, text, m.index, m[0].length, true);
    if (!clause) continue;
    const claim = _v432ClaimOf(cfg, lang, clause.fwd, clause.bwd);
    const isN = _v432TruthMatch(nt, claim.sign, claim.house);
    const isT = _v432TruthMatch(TT[name], claim.sign, claim.house);

    // A) 夺舍：本命定语贴在流月值上 → 剥定语
    if (hasDesc && isT && !isN) {
      const re = new RegExp(cfg.natalSuf.source, 'gi');
      let sm, n0 = 0;
      while ((sm = re.exec(slot)) !== null) {
        let e = aEnd + sm.index + sm[0].length;
        if (text[e] === ' ' && text[e + 1] === ',') e += 1;
        patches.push({ s: aEnd + sm.index, e, rep: '' });
        n0++; if (n0 >= 3) break;
      }
      if (!n0 && isPrefix) {
        const ws = Math.max(0, m.index - 34);
        const winc = text.slice(ws, m.index);
        const pm = winc.match(cfg.natalPre);
        if (pm) {
          patches.push({ s: ws + pm.index, e: m.index, rep: '' });
          n0 = 1;
        }
      }
      stripped += n0;
      continue;
    }

    // A2) 定语在、值域两盘皆不符（改无可改）：仅当句中有运动性流月动词时才认定「本命定语贴错在流月句上」→ 剥
    if (hasDesc && !isN && !isT) {
      const verb = cfg.transitVerb.test(slot) || cfg.transitVerb.test(clause.fwd) || cfg.transitVerb.test(clause.bwd || '');
      if (verb && hasSuffixDesc) {
        const re = new RegExp(cfg.natalSuf.source, 'gi');
        let sm, n0 = 0;
        while ((sm = re.exec(slot)) !== null) {
          let e = aEnd + sm.index + sm[0].length;
          if (text[e] === ' ' && text[e + 1] === ',') e += 1;
          patches.push({ s: aEnd + sm.index, e, rep: '' });
          n0++; if (n0 >= 3) break;
        }
        stripped += n0;
      }
      continue;   // 其余一律不动（宁可不动，不可编）
    }

    // B) 丢标识：本命事实被写成流月格式（无本命定语、无流月定语、非流月标记）→ 补本命标识
    //   🛡️ V479: 月标题行豁免 —— 标题行的太阳是流月值, 绝不补本命定语(见 _v479IsMonthTitleLine)。
    //   🛡️ V482: 星座紧邻行星名之前（如「双鱼座月亮」）已是本命归属写法 → 不再补, 防「双鱼座本命月亮」倒装。
    if (!hasDesc && !hasTDesc && isN && !isT && !cfg.transitMark.test(slot) && !_v479IsMonthTitleLine(text, m.index) && !_v482SignAdjacent(text, lang, m.index)) {
      const strong = !!(claim.sign && claim.house !== null);
      const ctxSig = cfg.ctx.test(clause.fwd) || cfg.ctx.test(clause.bwd) || cfg.ctx.test(text.slice(Math.max(0, m.index - 90), m.index));
      if (strong || ctxSig) {
        if (cfg.markerSide === 'pre') {
          if (lang === 'zh') {
            patches.push({ s: m.index, e: m.index, rep: cfg.marker });   // 中文无词间空格，直接前置
          } else {
            const lead = text.slice(Math.max(0, m.index - 24), m.index).match(/[\s(\uff08\u2014-]*$/);
            patches.push({ s: m.index - (lead ? lead[0].length : 0), e: m.index, rep: (lead ? lead[0] : ' ') + cfg.marker + ' ' });
          }
        } else {
          const tail = text.slice(aEnd, aEnd + 16);
          const mc = tail.match(/^(\s*),/);
          const mp = tail.match(/^(\s*)(?:en|dans|au|\u00e0)\b/i);
          if (mc) patches.push({ s: aEnd + mc[1].length, e: aEnd + mc[1].length, rep: ' ' + cfg.marker });
          else if (mp) patches.push({ s: aEnd + mp[1].length, e: aEnd + mp[1].length, rep: cfg.marker + ' ' });
          else patches.push({ s: aEnd, e: aEnd, rep: ' ' + cfg.marker });
        }
        inserted++;
      }
      continue;
    }

    // C 类（流月定语贴本命句 → 换成本命定语）**已考虑并否决**：与「定语决定管辖」互踩，
    //   实测会触发既有回归门（V426 transitant 句）。流月定语保留，值由流月锁归真。
  }
  if (!patches.length) return text;
  patches.sort((a, b) => a.s - b.s || a.e - b.e);
  let out = text;
  for (let i = patches.length - 1; i >= 0; i--) {
    const p = patches[i];
    out = out.slice(0, p.s) + p.rep + out.slice(p.e);
  }
  console.log(`[V432] ${lang} \u5b9a\u8bed\u88c1\u5b9a: \u5265\u79bb ${stripped} \u5904 / \u8865\u5168 ${inserted} \u5904`);
  return out;
}

// ── 本命真值锁（10 行星）──
// 🛡️ V492b/E9: 前导段流年句识别 —— 独立于 cfg.transitMark（军师裁决口径：Transit / 2026 /
//   In 2026 等流年限定词，含裸年份因财年跨 2026-2027）。比 cfg.transitMark 的动词表更收窄，
//   防「your current path」这类非流年词误豁免。句窗 = 前后最近断句符之间。
const _V492B_LEAD_TRANSIT = {
  en: /\b(?:transit\w*|this\s+year|in\s+20\d{2}|during\s+20\d{2})\b|\b20\d{2}\b/i,
  es: /\btr[aá]nsit\w*|\b20\d{2}\b|este\s+a[ñn]o/i,
  zh: /流年|流月|行运|今年|20\d{2}年/,
};
const _V492B_SENT_BREAK = /[.\n。；;!?！？]/g;
function _v432SentTransitMarked(lang, text, i, len) {
  const pat = _V492B_LEAD_TRANSIT[lang] || _V492B_LEAD_TRANSIT.en;
  const backFrom = Math.max(0, i - 400);
  let start = backFrom;
  for (const mm of text.slice(backFrom, i).matchAll(_V492B_SENT_BREAK)) start = backFrom + mm.index + mm[0].length;
  const endRel = text.slice(i + len, i + len + 300).search(_V492B_SENT_BREAK);
  const end = endRel >= 0 ? i + len + endRel : Math.min(text.length, i + len + 300);
  return pat.test(text.slice(start, end));
}
function _v432LockNatal(text, lang, astroMatrix, opts = {}) {
  const cfg = _V432_CFG[lang];
  if (!text || !cfg) return text;
  const truth = _v432Truth(lang, astroMatrix, 'natal');
  const names = Object.keys(truth);
  if (!names.length) {
    console.log(`[V432] ${lang} \u672c\u547d\u771f\u503c\u76d8\u4e0d\u53ef\u7528 \u2192 \u8df3\u8fc7\u672c\u547d\u771f\u503c\u9501\uff08\u7edd\u4e0d\u7f16\uff09`);
    return text;
  }
  text = (!opts.leading && !opts.natalScope && !opts.skipAdjudicate) ? _v432AdjudicateDescriptors(text, lang, astroMatrix) : text;
  // 🛡️ V492b/E9: leading 模式跳过定语裁定 —— 它会向裸句插写「natal」限定词
  //   （二跑幂等性被破坏实证：'Your Sun sits…' → 'Your natal Sun sits…'）。
  //   前导段只需纠值、绝不动措辞。
  // 🛡️ E13/R11d-4: HIT 路径同理由跳过（opts.skipAdjudicate）—— 缓存键已带版本号，
  //   HIT 文本必为本版流水线产物 ⇒ 只需「纠值锁」兜底（幂等），不需「措辞裁定」
  //   （后者依赖 claim==真值，而纠值锁恰好改变了该前提 ⇒ 二跑必插写 natal 限定词，
  //    实测 HIT 与缓存文本产生 7 处差异）。目标：HIT 响应 == 缓存落库文本（军师裁决）。
  const nameRe = new RegExp('(' + names.map(_v432Esc).join('|') + ')', 'g');
  let hits = [];
  let fixes = 0, m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const t = truth[name];
    if (!t) continue;
    const tail30 = text.slice(m.index + m[0].length, m.index + m[0].length + 30);
    const preWin = text.slice(Math.max(0, m.index - 34), m.index);
    const explicit = cfg.natalSuf.test(tail30) || cfg.natalPre.test(preWin);
    // 🛡️ V492b/E9: 前导段模式 —— 第 1 章（本命建筑）整段视为本命语境：
    //   非显式本命句不再因缺 natal/native/of birth 定语而弃权（Adelaide 盘线上实证：
    //   LLM 写 "Sun in Sagittarius in the 7th House" 这类裸句 5 星全漏）。唯一豁免 =
    //   句内带流年标记（前导段无月份锚点 ⇒ 无流年真值可校验 ⇒ 绝不碰，镜像 D3 纪律）；
    //   显式本命句即使含年份/流年词也照锁（本命定语优先级最高）。
    if (opts.leading && !explicit && _v432SentTransitMarked(lang, text, m.index, m[0].length)) continue;
    // 🛡️ E12/R11b: 非前导段「物主本命语境」准入（admitByScope）—— 先让 clause 可算（解除 natalAny 弃权），
    //   再由 _v512PossessiveNatal 做四重否决 + 物主贴附的保守裁定；显式本命句 / 前导段行为零改动。
    const admitByScope = opts.natalScope === 'possessive';
    const clause = _v432Clause(cfg, lang, text, m.index, m[0].length, explicit || !!opts.leading || admitByScope, { wide: !!opts.leading });
    if (!clause) continue;
    if (!explicit && !opts.leading && admitByScope
      && !_v512PossessiveNatal(cfg, lang, text, m.index, m[0].length, clause, astroMatrix)) continue;
    const { fwd, bwd, bwdOff, bwdOther, fwd2, fwd2Off } = clause;
    // 🛡️ E18/R11k: 起点一律取 builder 回传的**绝对坐标**（旧 `m.index - bwd.length` 在
    //   `bwdOther`（被另一颗行星名截断）时右移，产生 `SagittLeo` 类拼接 artifact —— 见 _v432Clause 注释）。
    const backStart = (typeof bwdOff === 'number') ? bwdOff : (m.index - bwd.length);
    // 🛡️ E18/R11k 幂等守卫：bwd 窗被「另一颗行星名」截断（`bwdOther`）⇒ 窗内前置的星座/宫位
    //   已被那颗行星认领（`— Sun, Moon` 里的 `Sagittarius 12th` 属太阳），把它当本行星的声称 =
    //   张冠李戴；且这一改写在二次施加时结果不稳定（f(f(x)) ≠ f(x)，实测 s3 es / s10 en）。
    //   语义依据（与 `_v432ResolveOverlaps` 同族）：窗段与锚点之间隔着「另一颗行星名」，
    //   中间那颗星才是该窗段的后继主体 ⇒ 弃权是**唯一保守且自洽**的选择（宁可漏改，不可编）。
    const skipB = bwdOther;
    const F = _v432PatchZone(cfg, lang, fwd, t.sign, t.house, true, text, m.index + m[0].length);
    const B = (bwd && !skipB) ? _v432PatchZone(cfg, lang, bwd, t.sign, t.house, false, text, backStart) : { text: bwd, count: 0 };
    // 🛡️ V492b/E9: 轴点后段（fwd2）同送纠值 —— "…Capricorn Ascendant, sits in Aries in the
    //   4th House" 的真声称在轴点之后；轴点词本身不在任何窗口 ⇒ 原样保留。
    const F2 = (fwd2 && fwd2.trim()) ? _v432PatchZone(cfg, lang, fwd2, t.sign, t.house, true, text, m.index + m[0].length + fwd2Off) : { count: 0 };
    if (!F.count && !B.count && !F2.count) continue;
    if (F.count) hits.push([m.index + m[0].length, m.index + m[0].length + fwd.length, F.text]);
    if (B.count) hits.push([backStart, m.index, B.text]);
    if (F2.count) hits.push([m.index + m[0].length + fwd2Off, m.index + m[0].length + fwd2Off + fwd2.length, F2.text]);
    fixes += F.count + B.count + F2.count;
  }
  // 🛡️ E13/R11d（偏移坐标系铁律 · 第 2 例）：命中区间必须按**位置倒序**应用。
  //   病根（2026-10-03 v511 生产稿实证）：同一行星的 fwd 命中与 bwd 命中在数组中为
  //   [fwd(靠后), bwd(靠前)]，而旧循环「从数组尾部往前」⇒ **bwd 先应用**；一旦 bwd 替换
  //   改变串长（`Aquarius`→`Sagittarius` +3 字符），fwd 的 [start,end] 立即失效 ⇒
  //   实测把 `The Aquarius Sun in your 2nd House` 改成 `The Sagittarius  in your 12th House`
  //   （**吃掉 `Sun` 三字符**）并在尾部复制出 `or or`。
  //   ⇒ 排序后从后往前应用：任何前缀改动都不再影响尚未应用的靠后区间。
  //   （与 E12/R11a-2 的 cuts 同源纪律：凡「多段替换 + 区间坐标」必先定序、后应用。）
  // 🛡️ E15/R11f-3（偏移坐标系铁律 · 第 3 例）: 倒序只解决【不相交】区间；一旦两区间【相交】，
  //   先应用者改变串长即令后者右界失效 ⇒ 凭空吃掉/复制字符（es 盘实证 `tu tu Sol`→`tu tuSol`）。
  //   ⇒ 应用前先做区间去交叉（保留先起者，丢弃越界者）。
  hits = _v432ResolveOverlaps(hits, lang + ' 本命锁');
  hits.sort((a, b) => b[0] - a[0]);
  for (let i = 0; i < hits.length; i++) {
    const [s, e, rep] = hits[i];
    text = text.slice(0, s) + rep + text.slice(e);
  }
  if (fixes) console.log(`[V432] ${lang} \u672c\u547d\u771f\u503c\u9501(10\u884c\u661f): \u4fee\u6b63 ${fixes} \u5904`);
  return text;
}

// ═══ 🛡️ V492b/E9（R8）: 年报前导段（第 1 章「本命建筑」）本命真值强锁 ═══
// 病根（2026-10-02 Adelaide 盘线上实证）：第 1 章把 2026 行运位伪装成本命位（Sun Sag 12宫→写
//   7th / Moon Leo 8宫→7th / Jupiter Libra 10宫→Leo 7th / Saturn Aqu 2宫→Aries 4th / Pluto
//   Sco 11宫→Aqu 1st），而第 2 章逐月全对 ⇒ 同篇自相矛盾。三层防线全漏：
//     ① house_linter 只处理月锚点之后段落，前导段（enSections[0]）原样透传；
//     ② lockNatalAnchorRole V478-guard 对年报整体禁用（防流年句被强改本命值，不能解除）；
//     ③ _v432LockNatal 对非显式本命句要求 natal/native/of birth 定语，否则弃权。
// 治本（军师裁决·方案A）：前导段子串整体视为本命语境重跑 _v432LockNatal（opts.leading）——
//   非显式句不再弃权；唯一豁免=句内流年标记（无月份锚点⇒无流年真值⇒绝不碰）。
// 前导段边界 = 首个月份锚点行（zh 数字 / 英文整月词，与 house_linter 同口径）之前。
// 幂等；月段正文零影响。挂载点：三链 V488 之后（本锁对前导段拥有最终话语权）。
function _v432LockLeadingNatal(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string' || !_V432_LANGS.includes(lang)) return text;
  let cut = -1;
  const reZH = /(?:^|\n)(?=#{1,6}[ \t]*\d{4}年\d{1,2}月:)/;
  const reEN = /(?:^|\n)(?=#{1,6}[ \t]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[ \t]+\d{4}:)/;
  for (const re of [reZH, reEN]) {
    const m = re.exec(text);
    if (m) { const c = m.index + (m[0].charAt(0) === '\n' ? 1 : 0); if (cut < 0 || c < cut) cut = c; }
  }
  if (cut <= 0) return text;
  const lead = text.slice(0, cut);
  let locked = _v432LockNatal(lead, lang, astroMatrix, { leading: true });
  // 🛡️ E10/R9-R2: 轴点+称谓真值锁 —— 必须在行星锁**之后**（见下函数头注释的顺序推演）
  locked = _v492cLockAxisSalutation(locked, lang, astroMatrix);
  // 🛡️ E12/R11b: 月锚点之后（Ch II~V）的「物主本命语境」声称同锁（全章真值防线扩展，见 _v512PossessiveNatal）。
  //   ⚠️ 轴点锁**不**随之扩展：月段的 "Ascendant" 可能指太阳返照/流年上升，强制本命上升 = 主动污染。
  const tailLocked = _v432LockNatal(text.slice(cut), lang, astroMatrix, { natalScope: 'possessive' });
  const out = locked + tailLocked;
  return out === text ? text : out;
}

// ═══ 🛡️ E10/R9-R2（军师裁决 2）: 前导段轴点与开篇称谓真值锁 ═══
// 病根（2026-10-03 Adelaide v508 线上实证，验收④）：仪表盘 "Core Natal Code: … Rising Leo"、
//   开篇 "…the horizon of your life rising through Leo"、"O child of Leo" —— 三处均无行星名，
//   _v432LockNatal 按设计只锁 10 行星 → 永不进锁；prompt NATAL_CODE 头部硬锁已注真值
//   （本文件 ~:9636）但 LLM 违背后无后处理兜底。
// 治本：确定性重写，只认四类句式、只换星座 token、值==真值原样保留（幂等）：
//   A. Rising [Sign] [is|in|:|·|—] <Sign> / Ascendant(e) 同型 / zh 上升<星座>
//   B. rising through <Sign> / <Sign> rising
//   C. O child of <Sign>（= 太阳星座称谓，真值取 meta.sun_sign）
// 铁律：
//   - 上升/太阳真值缺失（无出生时间、引擎异常）→ 对应组整组跳过，绝不编造（V102s 纪律）；
//   - token 不在星座词表（如 "Rising Star" / "rising costs"）→ 不动（防误伤）；
//   - 非 _V432_LANGS 语言整段跳过（与既有锁覆盖面一致）。
// 挂载顺序（为何在行星锁之后）：行星锁 fwd2 窗口按 E9 设计会把「轴点词之后」的星座词当
//   行星声称纠值（"…Capricorn Ascendant, sits in Aries…" 的 Aries 属行星）。若轴点锁先跑、
//   把 "rising through Leo" 纠成 Capricorn，随后 Moon 窗口（真值 Leo）会在 fwd2 里把
//   Capricorn 当错值反写回 Leo = 伪造轴点。后置 ⇒ 本锁对轴点拥有最终话语权，无人再碰。
function _v492cLockAxisSalutation(text, lang, astroMatrix) {
  if (!text || typeof text !== 'string' || !_V432_LANGS.includes(lang)) return text;
  const meta = (astroMatrix && astroMatrix.meta) || null;
  const risingEN = meta ? meta.rising_sign : null;
  const sunEN = meta ? meta.sun_sign : null;
  const langSigns = _v432Signs(lang) || [];
  const toLoc = (enName) => {
    if (!enName) return null;
    if (lang === 'en') return enName;
    const i = SUN_SIGN_EN.indexOf(enName);
    return (i >= 0 && langSigns[i]) ? langSigns[i] : null;
  };
  const risingLoc = toLoc(risingEN);
  const sunLoc = toLoc(sunEN);
  if (!risingLoc && !sunLoc) return text;
  const isSignTok = (tok) => !!tok && langSigns.some((s) => s.toLowerCase() === String(tok).toLowerCase());
  let nAxis = 0, nSun = 0;
  const applyRules = (rules) => {
    for (const [re, truth, kind] of rules) {
      if (!truth) continue;   // 真值缺失 → 该组整组跳过，绝不编造
      text = text.replace(re, (m0, tok) => {
        if (!isSignTok(tok)) return m0;
        if (String(tok).toLowerCase() === String(truth).toLowerCase()) return m0;   // 幂等
        const i = m0.indexOf(tok);
        if (kind === 'sun') nSun++; else nAxis++;
        return m0.slice(0, i) + truth + m0.slice(i + tok.length);
      });
    }
  };
  if (lang === 'en') {
    applyRules([
      [/\b(?:Rising\s+Sign|Rising|Ascendant|Ascendente)\s*(?:is\s+|in\s+)?(?:[:\u00b7\u2014-]\s*)?([A-Z][a-z]+)\b/gi, risingLoc, 'axis'],
      [/\brising\s+through\s+([A-Z][a-z]+)\b/gi, risingLoc, 'axis'],
      [/\b([A-Z][a-z]+)\s+rising\b/gi, risingLoc, 'axis'],
      [/\bO\s+child\s+of\s+([A-Z][a-z]+)\b/g, sunLoc, 'sun'],
    ]);
  } else if (lang === 'es') {
    applyRules([
      [/\b(?:Ascendente|Ascendant)\s*(?:es\s+|en\s+)?(?:[:\u00b7]\s*)?([A-Z][a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1]+)\b/g, risingLoc, 'axis'],
    ]);
  } else {
    applyRules([
      [/\u4e0a\u5347(?:\u661f\u5ea7)?(?:\u662f|\u4e3a|\u5728)?\s*([\u4e00-\u9fa5]{2,4})/g, risingLoc, 'axis'],
    ]);
  }
  if (nAxis || nSun) console.log(`[E10/R9] ${lang} \u8f74\u70b9/\u79f0\u8c13\u771f\u503c\u9501: \u4e0a\u5347\u7ea0\u6b63 ${nAxis} \u5904 / \u79f0\u8c13\u7ea0\u6b63 ${nSun} \u5904`);
  return text;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E12/R11: 全章真值锁演进与 CRITIC 强规则收拢（军师最高裁决 2026-10-03）
//   病根（E11 上线复验范围外新发现）：CRITIC 假阳性洗净后不再必然拦截 ⇒ 首稿直入缓存，
//   失去「强约束重试稿」的意外兜底 ⇒ II~V 章暴露三类漏网（畸形宫位 / 无标记裸声称 / 自纠 artifact）。
//   R11a-1 形态归一 · R11a-2 artifact 剥离 · R11b 全章物主本命锁 · R11c 判据扩容。
// ═══════════════════════════════════════════════════════════════════════════

// ── R11a-1: 畸形宫位形态归一（`5 House` → `5th House`）──────────────────────
//   与 CFG.houseBareNum / PatchZone 的 numHouse 分支互补：
//   ① 补漏【值也错】的句子（finder 认出 → 走 houseBareNumFmt 写回真值 + 补后缀）；
//   ② 补漏【值本对但形态畸形】的句子（"in the 8 House" 真值 8 ⇒ PatchZone 无改动可做），
//      由本归一独立完成「补序数后缀」—— 军师裁决原文「保形重写时自动补全序数后缀」。
//   铁律：只吃 `<数字>\s+House`（数字在前）；`House 5` 是我方 houseFmt 合法产物，绝不触碰；
//     1~12 值域钳制；幂等（`5th House` 不匹配）。
const _V512_MALFORMED_HOUSE = /\b(\d{1,2})\s+House\b/gi;
// 🛡️ E13/R11d-1: 拼写式序数归一（`in the seventh house` → `in the 7th House`）。
//   与 cfg.houseSpelled / Finder 的 spelled 分支互补：本归一保证「形态」先收口成标准数字式，
//   使下游**全部**数字式设施（houseOrd 纠值 / CRITIC 判据 12 claim 提取 / 月标题硬锁）天然吃得下。
//   前缀面 = **冠词/物主紧贴**（the/your/my/his/her/its/our/their）——
//     区别于真值锁侧的 cfg.houseSpelled（后者只认 in|into|through|within，宁漏不改），
//     本归一**不涉及任何真值判断**（只换形态、绝不改值）⇒ 可安全覆盖 LLM 的全部动词搭配：
//       "in the seventh house" / "in your first house" / "crosses your fourth house" /
//       "activates your second house" / "The container is the fourth house"。
//   零误伤护栏：① 连字符形态（`seventh-house native` 形容词）不匹配；② 复数/并列
//     （`seventh and eighth houses`）不匹配（本式只吃单数 `<spelled>\s+house`）；
//     ③ 1~12 值域经 _V432_EN_SPELLED 表钳制；④ 幂等（输出为数字式）。
//   ⚠️ 领域假设：本产品正文中「the/your + 序数 + house」恒指占星宫位（无房产/乐理语义面）。
const _V512_SPELLED_HOUSE = /(?<=\b(?:the|your|my|his|her|its|our|their)\s+)(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\s+house\b/gi;
function _v512NormalizeHouseOrdinal(text, lang) {
  if (!text || typeof text !== 'string') return text;
  const cfg = _V432_CFG[lang];
  if (!cfg || !cfg.houseBareNumFmt) return text;      // en 专属（es 序数为词式 / zh 为 第N宫，无此畸形）
  const before = text;
  let n = 0;
  let out = text.replace(_V512_MALFORMED_HOUSE, (m0, d) => {
    const v = Number(d);
    if (!(v >= 1 && v <= 12)) return m0;              // 越值域原样（年份/数量/楼层）
    n++;
    return cfg.houseBareNumFmt(v);
  });
  // 🛡️ E13/R11d-1: 拼写式 → 标准数字序数（形态收口第二式）
  if (cfg.houseSpelledFmt) {
    out = out.replace(_V512_SPELLED_HOUSE, (m0, w) => {
      const v = _V432_EN_SPELLED[String(w).toLowerCase()] || null;
      if (!v) return m0;
      n++;
      return cfg.houseSpelledFmt(v);
    });
  }
  if (n) console.log(`[E12/R11a|E13/R11d] ${lang} 宫位形态归一(N House / spelled house \u2192 Nth House): ${n} \u5904`);
  return out === before ? text : out;
}

// ── R11a-2: LLM 「自纠/元话语」artifact 剥离 ─────────────────────────────────
//   病根（2026-10-03 v510 线上实证）：`…your Jupiter in Leo in the 7th House — wait, no.
//   Let us be precise. The transiting Sun in Leo occupies your 8th House…` —— 大模型生成中
//   「自我思考/纠错」的半成品被原样写出，无任何清洗链剥离 ⇒ 直接进用户可见正文。
//   铁律：只剥离**明确的元话语标记**，绝不触碰正文破折号（V484「见 —— 就删」事故面）。
//   反例护栏（本闸门注入自测覆盖）：`market correction`（金融常用词）绝不能被 `correction`
//     误吃 ⇒ Correction 只在**句首 + 冒号**形态才删（`/^...Correction\s*[:：]/m`）。
//   ⚠️ 「只删标记」不足以治本：被撤回的那句仍在 ⇒ 输出自相矛盾（见 ⓪ 注释实证）。
//     故 ⓪ 对**破折号 + wait, no** 形态额外删除被撤回的整句（撤回语义由破折号绑定到前一句）。
const _V512_META_RETRACT = /\s*[\u2014\u2013-]{1,2}\s*(?:wait|hold\s+on)\s*,?\s*no\b\.?(?:\s*let\s+us\s+be\s+precise\b\.?)?[ \t]*/gi;
const _V512_SENT_CUT = /[.\n\u3002\uff01\uff1f;\uff1b!?]/g;
const _V512_META_PLAIN = /\b(?:wait|hold\s+on)\s*,?\s*no\b\.?\s*/gi;
const _V512_META_DECL = /\b(?:scratch\s+that|my\s+mistake|i\s+apolog(?:y|ize))\b\s*[:.]?\s*/gi;
const _V512_META_CORR = /(^|[.!?\u3002\uff01\uff1f]\s+)Correction\s*[:：]\s*/gm;
const _V512_META_SENT = /(^|[.!?\u3002\uff01\uff1f]\s+)(?:actually\s*,?\s*no|let\s+us\s+be\s+precise)\b\.?\s*/gim;
const _V512_META_PAREN = /[\(\[]\s*(?:wait|hold\s+on|correction|scratch\s+that)\b[^)\]]{0,40}[\)\]]\s*/gi;
function stripLLMSelfCorrection(text) {
  if (!text || typeof text !== 'string') return text;
  const before = text;
  let t = text;
  // ⓪ 「破折号 + wait, no」= LLM **明确撤回前一句** ⇒ 连同被撤回的句子一起删除。
  //   ⚠️ 只删标记会留下自相矛盾（线上实证复现：`Saturn in Aries in the 4th House — wait, no.
  //   Let us be precise. Saturn sits in Aquarius in the 2nd House.` → 删标记后「4th House」这句
  //   仍在，与后句真值直接打架）。撤回语义只对**破折号 + wait, no** 成立（破折号把撤回绑定到前一句），
  //   故本删除仅服务该形态；裸 wait, no / (wait, no) / Correction: 只删标记、不牵连正文。
  //   ⚠️ 偏移坐标系：replace 一旦删掉标记，串长即变 ⇒ 被撤回句的删除必须回到**原文**坐标系执行
  //     （初版把 cuts 应用到 replace 之后的串上，删出「HouseThe transiting」并把后半句吃掉 —— 已修）。
  const cuts = [];
  text.replace(_V512_META_RETRACT, function (m0, off, whole) {
    const backStart = Math.max(0, off - 400);
    let b = -1;
    for (const mm of whole.slice(backStart, off).matchAll(_V512_SENT_CUT)) b = Math.max(b, mm.index + mm[0].length);
    cuts.push([b >= 0 ? backStart + b : 0, off + m0.length]);
    return '';
  });
  //   此刻 `t === text` 仍成立（上面用的是非破坏性 `text.replace`，仅收集 cuts）⇒ 直接在原文坐标系删除
  for (let i = cuts.length - 1; i >= 0; i--) t = t.slice(0, cuts[i][0]) + t.slice(cuts[i][1]);
  // ① 其余形态：只删标记本身（绝不牵连正文）
  //   括号包裹形态**必须早于**裸形态：否则 `(wait, no)` 先被裸规则吃掉 `wait, no` ⇒ 留下空括号 `()`
  t = t.replace(_V512_META_PAREN, ' ');
  t = t.replace(_V512_META_PLAIN, '');
  t = t.replace(_V512_META_DECL, '');
  t = t.replace(_V512_META_CORR, '$1');
  t = t.replace(_V512_META_SENT, '$1');
  // 收尾归一：双空格 / 空格+标点 / 重复标点 / 空括号 / 行首孤标点 / 行尾空格
  t = t.replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    .replace(/([.,;:!?])[ \t]*\1+/g, '$1')
    .replace(/[\(\[]\s*[\)\]]/g, '')
    .replace(/^[ \t]*[.,;:]\s*/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
  if (t !== before) console.log(`[E12/R11a] LLM 自纠 artifact 剥离: ${before.length - t.length} 字符`);
  return t === before ? text : t;
}

// ── R11b: 全章本命声称真值锁（物主本命语境准入）──────────────────────────────
//   病根（2026-10-03 v510 线上实证，验收范围外）：Ch III `Your Moon is in Leo, a Fire sign,
//   in the 7th House.`（真值 8th）／`Jupiter in Leo occupies your 7th House`（真值 Libra 10th）
//   —— 月锚点之后的**无标记本命声称**，因「非前导段须 natal 定语」而设计性弃权（全身锁零改动）；
//   探针对照证明**同一句若落在前导段，前导锁能正确纠偏** ⇒ 能力足够，仅覆盖面止于首个月锚点。
//   治本：非前导段以「**物主本命语境**」准入。四重否决 + 物主贴附（保守弃权，宁漏不改）：
//     ① 流年标记（_v432SentTransitMarked 窄表 + cfg.transitMark）；
//     ② 月份词（January…/enero…/N月）—— 月锚点行与逐月正文一律含之；
//     ③ 具体日期（cfg.dateMark：October 7 / Day 5 / Week 2 / 3rd of July）；
//     ④ 物主必须**紧贴**行星名（"your Moon"）或紧贴宫位短语（"your 7th House"）。
//   为何必须物主准入（而非「月段一律锁」）：月段满是无标记**流月陈述**
//     （"The Moon in Libra smooths negotiations." / "Mercury Retrograde in the 7th House"）
//     ——一律锁会把流月值改成本命值 = 主动污染（生产已见 `Mercury Retrograde in the 7th House` 须存活）。
//   为何「紧贴」而非「句内含物主」：`Saturn tests your patience in the 3rd House` 的物主属 patience，
//     不属宫位 ⇒ 不得据以认定本命。
const _V512_POSS = {
  en: /\b(?:your|you\s+own)\b/i,
  es: /\b(?:tu|tus|su|sus)\b/i,
  zh: /(?:\u4f60\u7684|\u4f60\u672c\u547d|\u4f60\u539f\u751f)/,
};
const _V512_MONTH_TOK = {
  en: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
  es: /\b(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/i,
  zh: /\d{1,2}\s*\u6708/,
};
const _V512_POSS_NEAR = { en: 14, es: 14, zh: 8 };
// ⑤ 时间限定词否决（this month/this summer/now/currently/soon…）—— 流年陈述的强信号；
//   与 ①②③ 互补：`Jupiter in Leo this summer activates your 7th House` 必须原样保留。
const _V512_TIME_QUAL = {
  en: /\b(?:this\s+(?:month|year|week|season|summer|winter|spring|autumn|fall)|next\s+(?:month|year|week)|now|currently|presently|today|tonight|soon|these\s+days)\b/i,
  es: /\b(?:este\s+(?:mes|a[ñn]o|verano|invierno)|ahora|actualmente|hoy|pronto|pr[óo]xim\w*)\b/i,
  zh: /(?:\u672c\u6708|\u4eca\u5e74|\u672c\u5468|\u73b0\u5728|\u76ee\u524d|\u5982\u4eca|\u5373\u5c06|\u4e0b\u6708|\u660e\u5e74)/,
};
// ④b 附加门槛：行星名**紧跟**位置短语（`Jupiter in Leo … your 7th House`）—— 行星自己拥有星座声称。
//   ⚠️ 必要性实证（探针）：`Your 8th House is activated by the Leo Sun` 若仅凭「物主紧贴宫位」就准入，
//   会把 Leo Sun / 8th House 一并改成本命真值 = 主动污染（该句是「狮子座太阳激活你本命 8 宫」的
//   流年陈述）。行星紧跟位置短语 ⇒ 该句是在陈述**行星自身**的落位，才可据本命真值纠偏。
const _V512_PLACE_AFTER = {
  en: /^\s*,?\s*(?:in|at|into|of)\b/i,
  es: /^\s*,?\s*(?:en|de)\b/i,
  zh: /^\s*[\uff0c,]?\s*(?:\u5728|\u4e8e|\u4f4d\u4e8e)/,
};
// 句窗（与 _v432SentTransitMarked 同口径）：前后最近断句符之间
function _v512SentWindow(text, i, len) {
  const backFrom = Math.max(0, i - 400);
  let start = backFrom;
  for (const mm of text.slice(backFrom, i).matchAll(_V492B_SENT_BREAK)) start = backFrom + mm.index + mm[0].length;
  const endRel = text.slice(i + len, i + len + 300).search(_V492B_SENT_BREAK);
  const end = endRel >= 0 ? i + len + endRel : Math.min(text.length, i + len + 300);
  return { start, end, text: text.slice(start, end) };
}
// 物主紧贴：宫位短语侧（clause.fwd 里宫位 token 之前 30 字符内）+ 行星名侧（`pre` 窗口内）
function _v512PossessiveTouch(cfg, lang, clause, fwd) {
  const P = _V512_POSS[lang];
  if (!P || !fwd) return false;
  const h = _v432FindHouse(cfg, fwd, true);
  if (!h) return false;
  return P.test(fwd.slice(Math.max(0, h.idx - 30), h.idx));
}
// ═══ 🛡️ E15/R11f-4（支柱 3）: 「星座 → 所辖宫位」按**真实宫头**判定（替掉等宫制退化公式） ═══
// 病根（2026-10-04 源码盘查 + Adelaide 实证）：`((signIdx - ascIdx) % 12) + 1` 只是
//   astro/astro_matrix.py:161 `get_house(sign, rising)` 的 **无出生时间退化分支**（等宫制）；
//   出生时间已知时同文件走 `get_house_from_cusps` 用 Placidus **真实宫头**
//   （Adelaide：H1 宫头 292.82°=22.82°Cap，H2 宫头 314.19°=14.19°Aqu）
//   ⇒ 水瓶 0–14.19° 落 H1、14.19–30° 落 H2，**一个星座可跨两宫**。
//   用退化公式去问「星座 X 是否落在本命第 N 宫」必然漏判 → ⑥ 流年一致性否决静默失效。
// 处置：优先用 meta.house_cusps_full 的真实宫头算出该星座所辖宫位【集合】，命中集合内任一宫即弃权。
// 零回归：cusps 缺失/结构不完整（无出生时间盘、旧缓存）⇒ 返回 null，调用方回落等宫制单宫
//   （与 v512 逐字节一致）。绝不猜 ⇒ 结构只要有任一宫头非数即整体放弃。
// 边界：宫头恰落在星座边界时（重叠 ≤ 1e-6）不计入，避免 0 长度交叠生出假宫位。
function _v512SignSpanHouses(meta, si) {
  if (!meta || !(si >= 0 && si <= 11)) return null;
  const full = meta.house_cusps_full;
  if (!full) return null;
  const cusps = [];
  for (let h = 1; h <= 12; h++) {
    const c = full['house_' + h];
    const d = c ? Number(c.cusp_degree) : NaN;
    if (!Number.isFinite(d)) return null;   // 结构不完整 ⇒ 整体放弃（绝不猜）
    cusps.push(((d % 360) + 360) % 360);
  }
  const lo = si * 30, hi = lo + 30;
  const set = new Set();
  for (let h = 0; h < 12; h++) {
    const a = cusps[h];
    const span = (((cusps[(h + 1) % 12] - a) % 360) + 360) % 360;
    if (span <= 0) continue;               // 退化宫头（两宫头重合）⇒ 跳过，不生成宫位
    for (let k = -1; k <= 1; k++) {        // 星座区间与宫位弧均可跨 0° ⇒ 平移一次覆盖双向绕行
      const ov = Math.min(hi + k * 360, a + span) - Math.max(lo + k * 360, a);
      if (ov > 1e-6) set.add(h + 1);
    }
  }
  return set.size ? set : null;
}
// 本命语境准入裁定（possessive 模式唯一放行依据）
function _v512PossessiveNatal(cfg, lang, text, i, len, clause, astroMatrix) {
  const P = _V512_POSS[lang];
  if (!P) return false;
  const win = _v512SentWindow(text, i, len);
  const sent = win.text;
  if (_v432SentTransitMarked(lang, text, i, len)) return false;   // ① 流年标记（窄表）
  if (cfg.transitMark && cfg.transitMark.test(sent)) return false; // ① 流年标记（宽表）
  if (_V512_MONTH_TOK[lang] && _V512_MONTH_TOK[lang].test(sent)) return false; // ② 月份词
  if (cfg.dateMark && cfg.dateMark.test(sent)) return false;       // ③ 具体日期
  if (_V512_TIME_QUAL[lang] && _V512_TIME_QUAL[lang].test(sent)) return false; // ⑤ 时间限定词
  // ⑥ 🛡️ E13/R11d: 流年一致性否决 —— 「星座 X 恰在 X 的本命宫位」= 流年句惯用式，非本命声称。
  //   病根（2026-10-03 v511 生产稿实证）：`**[Peak Revenue Window]** …. The Aquarius Sun in your
  //   2nd House is an excellent window for a pricing overhaul…`（二月流年太阳在水瓶座＝本命第 2 宫）
  //   四个既有否决全不命中（无流年动词/无月份词/日期在上一句/无时间限定词）⇒ 被当本命句改写为
  //   `Sagittarius … 12th House`，把一句**正确的流年陈述**毁掉（E11 假阳性教训的同类事故面）。
  //   判据：claim.house === 该 claim.sign 在本命盘所辖宫位（等宫制：house = ((signIdx - ascIdx) mod 12) + 1）
  //   ⇒ 该句描述的是「某星座经过其本命宫位」＝流年语境 ⇒ 弃权（宁漏不改）。
  //   真值缺失（无 rising_sign 且无真实宫头 / 非法值）⇒ 本否决整体不启用（绝不猜，V102s 纪律）。
  if (clause && astroMatrix && astroMatrix.meta) {
    const ascEN = astroMatrix.meta.rising_sign;
    const ri = ascEN ? SUN_SIGN_EN.findIndex((s) => s.toLowerCase() === String(ascEN).toLowerCase()) : -1;
    // 🛡️ E15/R11f-4（支柱 3）: 有真实宫头（house_cusps_full）时不再依赖 rising_sign —— 等宫制退化
    //   公式只是无出生时间的兜底，真实宫头才是真值源（见 _v512SignSpanHouses 函数头）。
    const hasCusps = !!(astroMatrix.meta.house_cusps_full);
    if (ri >= 0 || hasCusps) {
      const claim = _v432ClaimOf(cfg, lang, clause.fwd, clause.bwd);
      // 🛡️ E13/R11d（本否决的**自证补丁**）：claim.sign 可能为 null —— 上游 _v432Clause 的 bwd
      //   是**未按句界截断的 70 字符窗口**，若跨界吃到上一个月标题里的 `20\d{2}` 会被
      //   cfg.transitMark 直接清空（V492b 既有设计：流年语境的 bwd 不得当本命声称）。
      //   后果：`…### August 2026: …\n\nThe Aquarius Sun in your 2nd House.` 这类
      //   **前置定语型流年句**取不到 sign ⇒ 本否决静默失效 ⇒ 宫位被误改（v511 生产稿实证）。
      //   ⇒ 此处**自主**取行星名紧邻之前的星座词（24 字符窗口；先 trim 尾空白再 endsWith，
      //     与 _v482SignAdjacent 同源思路）。仅在 claim.sign 缺失时走此回退 ⇒ 既有行为零改动。
      let signTok = claim && claim.sign ? claim.sign : null;
      if (!signTok) {
        const pre = text.slice(Math.max(0, i - 24), i).replace(/\s+$/, '').toLowerCase();
        for (const w of _v432AllSignWords(lang)) {
          if (w && pre.endsWith(String(w).toLowerCase())) { signTok = w; break; }
        }
      }
      if (signTok && claim && claim.house !== null) {
        // 语言无关映射：先按英文字表（en 场景 claim.sign 即英文），再按本地化字表（同序于 SUN_SIGN_EN）
        let si = SUN_SIGN_EN.findIndex((s) => s.toLowerCase() === String(signTok).toLowerCase());
        if (si < 0) { const ls = _v432Signs(lang) || []; si = ls.findIndex((s) => s.toLowerCase() === String(signTok).toLowerCase()); }
        if (si >= 0) {
          // 🛡️ E15/R11f-4（支柱 3）: 真值源优先级 —— 真实宫头（Placidus，可跨宫）> 等宫制退化公式。
          const span = _v512SignSpanHouses(astroMatrix.meta, si);
          if (span) {
            if (span.has(Number(claim.house))) return false;
          } else if (ri >= 0 && ((((si - ri) % 12) + 12) % 12) + 1 === Number(claim.house)) {
            return false;   // 无真实宫头 ⇒ 回落等宫制（v512 原行为，逐字节一致）
          }
        }
      }
    }
  }
  const near = _V512_POSS_NEAR[lang] || 14;
  if (P.test(text.slice(Math.max(0, i - near), i))) return true;   // ④a 物主紧贴行星名
  // ④b 物主紧贴宫位 —— 附加门槛：行星名必须紧跟位置短语（见 _V512_PLACE_AFTER 注释的反例实证）
  if (clause && _V512_PLACE_AFTER[lang]
    && _V512_PLACE_AFTER[lang].test(text.slice(i + len, i + len + 8))
    && _v512PossessiveTouch(cfg, lang, clause, clause.fwd)) return true;
  return false;
}
// R11c 判据 12 用：全章「物主本命声称」与 SwissEph 真值的错配计数（只检不改，纯函数）
//   ⚠️ 排除「既无星座也无宫位」的句子（"Your Moon craves security." 什么都没声称 ⇒ 无对错可言），
//     否则会把无尽言句全部记成错配 ⇒ CRITIC 恒误报（E11 空数组坑的同类事故面）。
function _v512CountNatalClaimMismatch(text, lang, astroMatrix) {
  const cfg = _V432_CFG[lang];
  if (!cfg || !text || typeof text !== 'string') return 0;
  const truth = _v432Truth(lang, astroMatrix, 'natal');
  const names = Object.keys(truth);
  if (!names.length) return 0;
  const nameRe = new RegExp('(' + names.map(_v432Esc).join('|') + ')', 'g');
  let n = 0, m;
  while ((m = nameRe.exec(text)) !== null) {
    const t = truth[m[1]];
    if (!t) continue;
    const clause = _v432Clause(cfg, lang, text, m.index, m[0].length, true, {});
    if (!clause) continue;
    if (!_v512PossessiveNatal(cfg, lang, text, m.index, m[0].length, clause, astroMatrix)) continue;   // 🛡️ E13/R11d-3: 补传 astroMatrix，令「流年一致性否决」在判据 12 同步生效（判据同源）
    // 🛡️ E20/R11n③: 多声称连句防伪影（**只窄化判据，不动锁链**；s1 特罗姆瑟盘重生成实证：
    //   「你的天秤座太阳…，你的射手座上升…，你的金牛座月亮…」全真值句被判 2 处错配）——
    //   机制：① `_v432ClaimOf` 的 **fwd 优先**取向令太阳的 fwd 窗跨过逗号读到**下一子句**的
    //   「射手座上升」⇒ 凭空错配；② 月亮的 bwd 被「另一行星名截断」（bwdOther，截到本句
    //   首颗行星「太阳」处）⇒ 回退读到**别家物主**的「你的天秤座」⇒ 二次凭空错配。
    //   治法（宁漏不改）：
    //   ① fwd 中**星座之前**含逗号/顿号 ⇒ 该星座属下一子句的物主，把 fwd 截到逗号处重取
    //      （fwd 因此失去星座时自然回落 bwd）；
    //   ② fwd 截后无星座、且 bwd 被另一行星名截断（bwdOther=true）⇒ bwd 属于别家 ⇒ 整个
    //      出现点弃权（与 E18/R11k `bwdOther ⇒ 弃权` 同一裁定）。
    let fwdC = clause.fwd, bwdC = clause.bwd;
    const _e20comma = fwdC.search(/[,，、]/);
    let _e20si = -1;
    for (const s of _v432AllSignWords(lang)) { const k = fwdC.indexOf(s); if (k >= 0 && (_e20si < 0 || k < _e20si)) _e20si = k; }
    if (_e20si >= 0 && _e20comma >= 0 && _e20comma < _e20si) fwdC = fwdC.slice(0, _e20comma);
    let claim = null;
    {
      let _hasSign = false;
      for (const s of _v432AllSignWords(lang)) { if (fwdC.indexOf(s) >= 0) { _hasSign = true; break; } }
      if (!_hasSign && clause.bwdOther) {
        // ②' bwd 被另一行星名截断 ⇒ 常规 bwd 回退读到别家物主, 弃权；但「星座紧邻行星名
        //    之前」的局部贴合形态（「天蝎座月亮」，V482 signAdjacent 同源）永远只属于本
        //    行星, 可安全采信（宁漏不改的例外: 贴附归属无歧义）。
        const _adj = text.slice(Math.max(0, m.index - 8), m.index).match(new RegExp('(' + _v432AllSignWords(lang).slice().sort((a, b) => b.length - a.length).map(_v432Esc).join('|') + ')$'));
        if (_adj) claim = { sign: _adj[1], house: null };
        else continue;
      }
    }
    if (!claim) claim = _v432ClaimOf(cfg, lang, fwdC, bwdC);
    if (!claim.sign && claim.house === null) continue;   // 无尽言 ⇒ 不算错配
    if (!_v432TruthMatch(t, claim.sign, claim.house)) n++;
  }
  return n;
}

// 🛠️ V426-R: 本命外行星「逆行标识(retrograde)」后处理真值锁（治本 FR 样本 Pluto natal 漏 rétrograde）
//   病根（2026-09-23 实测）：LLM 写「Pluton natal en Sagittaire, Maison 9」漏 retrograde，但 SwissEph 实算 natal Pluto = retrógrado。
//     V426/V432 本命锁只纠 sign/house，不碰逆行标识 → 漏标。
//   治本（军师裁定）：纯确定性后处理，零碰 LLM prompt。
//     - 若 SwissEph 实算 natal.retrograde=True，强行确保本命引用带 R 标识（rétrograde/retrógrado/retrograde）
//     - 若 =False 但 LLM 误标 R，剔除（含前导 ", "）
//   范围：fr（_natalTruthMap10_FR）/ en·es（_v432Truth）；zh 无 marker 自动跳过。
const _RETRO_MARKER = {
  en: /\bretrograde\b/i,
  es: /\bretr[óo]grado\b/i,
  fr: /\br[ée]trograde\b/i,
};
const _RETRO_INSERT = {
  en: ' retrograde',
  es: ' retrógrado',
  fr: ' rétrograde',
};
function _v426IsNatalRef(lang, text, m) {
  const tail30 = text.slice(m.index + m[0].length, m.index + m[0].length + 30);
  const preWin = text.slice(Math.max(0, m.index - 34), m.index);
  if (lang === 'fr') {
    // fr 本命标记常紧跟行星名后（如「Pluton natal」），tail30 以空格开头 → 用 .test 而非 ^ 锚定
    const frNatal = /(natif|native|natale?|de naissance|à la naissance|au moment de la naissance|du thème natal|de votre thème|qui vous fit naître)/i;
    return frNatal.test(tail30) || frNatal.test(preWin) || _FR_PRE_NATAL_DESC.test(preWin);
  }
  const cfg = _V432_CFG[lang];
  if (!cfg) return false;
  return cfg.natalSuf.test(tail30) || cfg.natalPre.test(preWin) || cfg.natalAny.test(tail30) || cfg.natalAny.test(preWin);
}
function v426EnforceNatalRetrograde(text, lang, astroMatrix) {
  const marker = _RETRO_MARKER[lang];
  const insert = _RETRO_INSERT[lang];
  if (!text || !marker || !insert) return text;   // zh 无 marker → 自动跳过
  const truth = lang === 'fr' ? _natalTruthMap10_FR(astroMatrix) : _v432Truth(lang, astroMatrix, 'natal');
  if (!truth) return text;
  const names = Object.keys(truth);
  if (!names.length) return text;
  const nameRe = new RegExp('(' + names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  let m, fixes = 0;
  let hits = [];
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const t = truth[name];
    if (!t) continue;
    if (!_v426IsNatalRef(lang, text, m)) continue;
    // 窗口：行星名后到句末标点（排除逗号/括号，确保覆盖 house 短语）
    const rest = text.slice(m.index);
    const wb = rest.search(/[.;!?\n]/);
    const window = wb === -1 ? rest : rest.slice(0, wb);
    const hasR = marker.test(window);
    if (t.retrograde && !hasR) {
      let insPos = m.index + window.length;
      let insStr = ', ' + insert.trim();   // 默认 ", retrograde"
      const houseNum = _V432_CFG[lang] ? _V432_CFG[lang].houseNum : /\bMaison\s*(\d{1,2})\b/i;
      const hm = window.match(houseNum);
      if (hm) {
        insPos = m.index + hm.index + hm[0].length;
        const after = text.slice(insPos, insPos + 2);
        if (after === ', ' || after === ',') insStr = ' ' + insert.trim();   // house 后已有逗号 → 不加逗号
      }
      hits.push([insPos, insPos, insStr]);
      fixes++;
    } else if (!t.retrograde && hasR) {
      const rm = window.match(marker.source);
      if (rm) {
        const rPos = m.index + rm.index;
        let adjStart = rPos;
        if (text[rPos - 1] === ' ') { adjStart = rPos - 1; if (text[rPos - 2] === ',') adjStart = rPos - 2; }   // 清前导空格+逗号
        hits.push([adjStart, rPos + rm[0].length, '']);
        fixes++;
      }
    }
  }
  // 🛡️ E13/R11d: 命中区间按位置倒序应用（偏移坐标系纪律；本函数各命中为单段，排序后语义等价）
  // 🛡️ E15/R11f-3: 统一去交叉（含零长插入命中；相交即丢弃后起者，防串长错位）
  hits = _v432ResolveOverlaps(hits, lang + ' 本命逆行锁');
  hits.sort((a, b) => b[0] - a[0]);
  for (let i = 0; i < hits.length; i++) {
    const [s, e, rep] = hits[i];
    text = text.slice(0, s) + rep + text.slice(e);
  }
  if (fixes) console.log(`[V426-R] ${lang} 本命逆行锁: 补/删 ${fixes} 处`);
  return text;
}

// ── 流月（行运）真值锁：入驻句单独按日号判向，其余位置句按 months[0] 归真 ──
function _v432IngressDay(cfg, ctx) {
  let day = null;
  for (const re of (cfg.dayRe || [])) {
    const m = ctx.match(re);
    if (m) { day = Number(m[1]); if (day) break; }
  }
  return day || null;
}

// 🛠️ V433-fix4: 月亮「周级真值」硬锁（确定性后处理，治本 vi 等模型读周级块的行为缺陷）
//
// 病根：方案 A 已把周级月亮真值 + 照抄句注入 prompt（es 几乎 100% 正确），但 vi 模型仍会
//   把相邻周的星座（如 Scorpio）搬进 W1/W4 并配错宫位（实测 HCMC/vi）。靠喂数据已到顶 → 上确定性锁。
//
// 规则（镜像 V432 锁族，仅作用于「流月月亮」）：
//   ① 解析报告 ✦[周N] 分段；每段只允许本周真实星座集合（陷阱段用全月并集）
//   ② 流月月亮句里：星座在集合内 → 宫位不符则归真；星座不在集合内 → 整段(星座+宫位)换成本周首个真值
//   ③ 本命月亮（natal/bản mệnh/本命/出生）一律不动（由本命锁管辖）
//   ④ 取不到真值盘 → 原文透传（绝不编）
// ── V436: 泰语「月份名内嵌星座名」防撞 ─────────────────────────────
// 【病根】泰语 12 月名里嵌着星座名：เมษายน⊃เมษ(白羊) / พฤษภาคม⊃พฤษภ(金牛) / มิถุนายน⊃มิถุน(双子)
//   / กรกฎาคม⊃กรกฎ(巨蟹) / กันยายน⊃กันยา(处女) / มีนาคม⊃มีน(双鱼)
//   → 星座匹配落进日期词后，会把「后一个星座/别人的宫位」算到这个星座头上（实测：
//     处女座把 Scorpio 的 บ้าน 5 改成 3 并配 truth[3,4]）→ 假阳性改写 + 与 V435 互打乒乓（永不收敛）
// 【治法】匹配位置落在任一月名区间内 → 视为「不是星座引用」，跳过（三把月亮锁统一挂）
const _V436_TH_MONTHS = 'มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม';
function _v436InThMonth(text, pos, len) {
  if (!text || pos < 0 || typeof pos !== 'number') return false;
  const a = Math.max(0, pos - 12), b = Math.min(text.length, pos + (len || 0) + 4);
  const w = text.slice(a, b);
  const re = new RegExp(_V436_TH_MONTHS, 'g');
  let m;
  while ((m = re.exec(w)) !== null) {
    const st = a + m.index;
    if (st <= pos && pos < st + m[0].length) return true;   // 匹配起点落在月名内部
  }
  return false;
}

// 🛡️ V447: 非月亮行星名表——月亮周级锁的「星座归属守卫」用
//   病根（2026-09-15 生产实测）：_v433LockMoonWeek 用「月亮关键词 ±40/+110 字符」窗口扫描，
//   会把同一周正文里**其他行星**的星座（如「流年太阳在处女座」）误判成「越界月亮星座」→
//   改写成本周首个真值（白羊座/第1宫）；该锁被多层链反复调用 → 污染逐轮雪崩（W2/W3/W4 全变白羊座）。
const _V447_OTHER_PLANET_RE = {
  zh: /(太阳|水星|金星|火星|木星|土星|天王星|海王星|冥王星)/g,
  en: /\b(Sun|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\b/g,
  es: /\b(Sol|Mercurio|Venus|Marte|Júpiter|Saturno|Urano|Neptuno|Plutón)\b/g,
  fr: /\b(Soleil|Mercure|Vénus|Mars|Jupiter|Saturne|Uranus|Neptune|Pluton)\b/g,
  th: /(ดวงอาทิตย์|ดาวอาทิตย์|ดาวพุธ|ดาวศุกร์|ดาวอังคาร|ดาวพฤหัสบดี|ดาวพฤหัส|ดาวเสาร์|ดาวยูเรนัส|ดาวเนปจูน|ดาวพลูโต)/g,
  vi: /(Mặt Trời|Sao Thủy|Sao Kim|Sao Hỏa|Sao Mộc|Sao Thổ|Sao Thiên Vương|Sao Hải Vương|Sao Diêm Vương)/g,
};
const _V447_SENT_TERM_RE = /[。.！？!?；;]/;
// 取 re 在 hay 中最后一次匹配的下标（-1 = 无）；内部重置 lastIndex，安全复用共享 /g 正则
function _v447LastIdx(hay, re) {
  re.lastIndex = 0;
  let last = -1, m;
  while ((m = re.exec(hay)) !== null) { last = m.index; if (re.lastIndex === m.index) re.lastIndex++; }
  return last;
}

function _v433LockMoonWeek(text, lang, astroMatrix) {
  const weeks = astroMatrix && astroMatrix.months && astroMatrix.months[0] && astroMatrix.months[0].moon_weeks;
  if (!Array.isArray(weeks) || !weeks.length) return text;
  const LMAP = { en: SUN_SIGN_EN, es: SUN_SIGN_ES, zh: SUN_SIGN_ZH, fr: SUN_SIGN_FR, th: SUN_SIGN_TH, vi: SUN_SIGN_VI };
  const L = LMAP[lang];
  if (!L || !L.length) return text;
  const wkSigns = {}, wkHouse = {}, wkFirst = {};
  const union = new Set(), unionHouse = {};
  for (const w of weeks) {
    const s = new Set(), h = {};
    for (const lg of w.legs) {
      const li = _EN2ZIDX[lg.sign];
      if (li == null) continue;
      s.add(li); (h[li] = h[li] || new Set()).add(lg.house);
      union.add(li); (unionHouse[li] = unionHouse[li] || new Set()).add(lg.house);
    }
    wkSigns[w.week] = s; wkHouse[w.week] = h;
    const firstLeg = (w.legs || [])[0];
    wkFirst[w.week] = firstLeg ? { idx: _EN2ZIDX[firstLeg.sign], house: firstLeg.house } : null;
  }
  // ⚠️ moonRe 用字符串表（\\b 在字符串里=词边界；正则字面量的 .source 喂 new RegExp 会被重解析成退格符，导致月亮关键词永远匹配不上）
  const moonRe = { es: '\\bLuna\\b', vi: '\\bMặt Trăng\\b', zh: '月亮', en: '\\bMoon\\b', fr: '\\bLune\\b', th: 'ดวงจันทร์' }[lang];  // zh/th 不用 \b（CJK/泰文非 \w，边界失效）
  if (!moonRe) return text;
  const houseRe = { es: /Casa\s*(\d{1,2})/i, vi: /Nhà\s*(\d{1,2})/i, zh: /第\s*(\d{1,2})\s*宫/, en: /House\s*(\d{1,2})(?!\s*,)/i, fr: /Maison\s*(\d{1,2})/i, th: /บ้าน\s*(\d{1,2})/i }[lang];   // 🛠️ V455-fix: en houseRe 加「逗号+空白」排除（trailing comma 语法 'Aries (House 11),'），避免括号后紧跟逗号时数字被截断
  const natalRe = /(natal|bản mệnh|本命|出生|de naissance|natif|generación|กำเนิด)/i;

  // 切分 ✦[周N] 段落（indexOf 而非脆弱正则，避 /g lastIndex 诡异）
  const segs = [];
  let sp = text.indexOf('✦');
  while (sp !== -1) {
    const np = text.indexOf('✦', sp + 1);
    const seg = np === -1 ? text.slice(sp) : text.slice(sp, np);
    const hm = seg.match(/(?:Semana|Semaine|Tuần|Week|สัปดาห์ที่)\s*([1-4])|第\s*([1-4])\s*周|周\s*([1-4])/);  // 兼容中文「第N周」（数字在「周」前）
    segs.push({ start: sp, end: np === -1 ? text.length : np, wk: hm ? parseInt(hm[1] || hm[2] || hm[3], 10) : 0 });
    if (np === -1) break;
    sp = np;
  }

  let patches = [];
  for (const seg of segs) {
    const start = seg.start, wk = seg.wk;
    const end = seg.end;
    const allowed = wk ? wkSigns[wk] : union;
    const ah = wk ? wkHouse[wk] : unionHouse;
    const first = wk ? wkFirst[wk] : null;
    const moonIt = new RegExp(moonRe, 'gi');
    const _v447MoonScanRe = new RegExp(moonRe, 'gi');   // V447: 独立实例（勿扰 moonIt 的 lastIndex）
    let mpos;
    while ((mpos = moonIt.exec(text.slice(start, end))) !== null) {
      const mo = start + mpos.index;
      // 🛡️ V447-fix2: 窗口必须夹紧在「本段（本周）」内——原 `mo + 110` 未夹紧，
      //   导致本周末尾的月亮关键词把【下一周】的星座拉进窗口，再用本周真值去改下一周 → 误改正确文本。
      const w0 = Math.max(start, mo - 40);  // 窗口起点（夹紧段首 + 负下标）
      const win = text.slice(w0, Math.min(end, mo + 110));
      for (let si = 0; si < L.length; si++) {
        const sign = L[si];
        const sre = new RegExp(_v432Esc(sign), 'g');
        let sm;
        while ((sm = sre.exec(win)) !== null) {
          const abs = w0 + sm.index;  // 绝对位置 = 窗口起点 + 窗口内偏移
          if (lang === 'th' && _v436InThMonth(text, abs, sm[0].length)) continue;  // V436: 月名内嵌星座（กันยายน⊃กันยา）不是星座引用
          if (natalRe.test(win.slice(0, sm.index))) continue;   // 本命月亮 → 不动
          // 🛡️ V447: 星座归属守卫——只改「确实属于月亮轨迹」的星座：
          //   ① 星座之前（窗口前缀内）必须出现过月亮关键词（否则不是月亮轨迹；前缀里的星座一律不碰）
          //   ② 前缀里「最近的一个行星名」必须是月亮（若是太阳/水星/金星/火星/木星/土星…→ 属于别的行星，不改）
          //   ③ 月亮关键词与该星座之间不得有句读（不得跨句吞掉下一句）
          {
            const _pre = win.slice(0, sm.index);
            const _lastMoon = _v447LastIdx(_pre, _v447MoonScanRe);
            if (_lastMoon < 0) continue;
            const _otherRe = _V447_OTHER_PLANET_RE[lang];
            if (_otherRe && _v447LastIdx(_pre, _otherRe) > _lastMoon) continue;
            if (_V447_SENT_TERM_RE.test(_pre.slice(_lastMoon))) continue;
          }
          let around = win.slice(sm.index, sm.index + 60);
          // V436: 宫位窗口不得跨出「本星座自己的括注组」(轨迹写法 'พิจิก (บ้าน 5→บ้าน 3)' 的后一个是下个星座的宫位)
          {
            const rest = around.slice(sm[0].length);
            let cut = rest.length;
            for (const s2 of L) { const p2 = rest.indexOf(s2); if (p2 >= 0 && p2 < cut) cut = p2; }
            const arr = rest.indexOf('\u2192'); if (arr >= 0 && arr < cut) cut = arr;
            if (cut < rest.length) around = around.slice(0, sm[0].length + cut);
          }
          const hm = around.match(houseRe);
          const writtenHouse = hm ? parseInt(hm[1], 10) : null;
          if (allowed.has(si)) {
            const th = ah[si] ? Array.from(ah[si]) : [];
            if (writtenHouse != null && th.length && !th.includes(writtenHouse)) {
              // 宫位不符 → 归真（取真值首个宫位）
              patches.push({ s: abs + hm.index, e: abs + hm.index + hm[0].length, rep: hm[0].replace(/\d{1,2}/, String(th[0])) });
            }
          } else if (first && first.idx >= 0) {
            // 越界星座 → 整段(星座+宫位)换成本周首个真值
            const repSign = L[first.idx];
            // 🛠️ V433-fix10: tail 从 hm[0] 原始匹配自动继承格式（根治手动 per-lang 拼接漏括号）
            //   hm[0] 例如 '(Maison 7)' / '第5宫' / 'บ้าน 7' / 'Nhà 3' / '(Casa 9)' / '(House 4)'
            //   → 把数字替换为真值宫位号即可，括号/前缀/后缀全自动保留
            //   ⚠️ 但 houseRe 不含括号时（vi 'Nhà 3' / zh '第5宫'），原文的左括号在 sm 末尾与 hm 之间
            //      → 被替换区间吃掉。用 gap = sm 末尾到 hm 起始之间的原文自动补回。
            const tail = (writtenHouse != null && hm)
              ? hm[0].replace(/\d{1,2}/, String(first.house))
              : (writtenHouse != null ? ' ' + first.house : '');
            // gap = 星座名末尾到 houseRe 匹配起始之间的字符（通常是 ' (' 或 '（'）
            const gapEnd = hm ? (hm.index - sm[0].length) : 0;
            const gap = (hm && gapEnd > 0) ? around.slice(sm[0].length, sm[0].length + gapEnd) : '';
            const rep = repSign + gap + tail;
            patches.push({ s: abs, e: abs + sm[0].length + (hm ? (hm.index - sm[0].length + hm[0].length) : 0), rep });
          }
        }
      }
    }
  }
  if (!patches.length) return text;
  patches.sort((x, y) => y.s - x.s);
  let out = text;
  for (const p of patches) out = out.slice(0, p.s) + p.rep + out.slice(p.e);
  console.log(`[V433] 月亮周级锁: 归正 ${patches.length} 处 (lang=${lang})`);
  return out;
}

function _v432LockTransit(text, lang, astroMatrix) {
  const cfg = _V432_CFG[lang];
  if (!text || !cfg || !astroMatrix?.months?.[0]) return text;
  const signs = _v432Signs(lang);
  const truth = _v432Truth(lang, astroMatrix, 'transit');
  const names = Object.keys(truth);
  if (!names.length) return text;
  const nameRe = new RegExp('(' + names.map(_v432Esc).join('|') + ')', 'g');
  let result = text, m;
  while ((m = nameRe.exec(text)) !== null) {
    const name = m[1];
    const t = truth[name];
    if (!t) continue;
    // 入驻（ingress）句：目标星座随日期而变 → 绝不用「当月星座」硬套（镜像 V429）
    const tail = text.slice(m.index + m[0].length, m.index + m[0].length + 90);
    const bp = tail.search(cfg.bodyAny);
    const win = bp >= 0 ? tail.slice(0, bp) : tail;
    if (cfg.ingress.test(win)) {
      // ⚠️ V432-fix: 日号窗口收紧到「本句」(+前置 60 字符，容纳 "Jour 24" 这类标头)，
      //   否则会抓到后面句子的日期 → 用错误日号判向（实测：Sept 1-2 句被后面的 Sept 27 带偏）
      const s0 = text.slice(m.index, m.index + 160);
      const sEnd = s0.search(/[.\n\u3002]/);
      const core = sEnd >= 0 ? s0.slice(0, sEnd) : s0;
      const ctx = text.slice(Math.max(0, m.index - 60), m.index) + core;
      const day = _v432IngressDay(cfg, ctx);
      const nextMonth = astroMatrix.months?.[1];
      const nSun = nextMonth?.sun || nextMonth?.Sun || (nextMonth?.positions && nextMonth.positions.Sun) || null;
      let nextSign = nSun && _EN2ZIDX[nSun.sign] != null ? signs[_EN2ZIDX[nSun.sign]] : null;
      if (!nextSign && t.sign) { const zi = signs.indexOf(t.sign); if (zi >= 0) nextSign = signs[(zi + 1) % 12]; }
      const isEnd = day != null ? day >= 22 : cfg.endHint.test(ctx);
      const isStart = day != null ? day <= 8 : cfg.startHint.test(ctx);
      if (day == null && !isEnd && !isStart) continue;   // 取不到时序 → 不动（宁可不动，不可编）
      const written = (() => {
        for (const s of _v432AllSignWords(lang)) if (win.includes(s)) return s;
        return null;
      })();
      const target = isEnd ? nextSign : (isStart ? t.sign : null);
      const wi = written ? win.indexOf(written) : -1;
      if (wi >= 0 && target && written !== target) {
        // ⚠️ V432-fix: 只改「本句」内的那一处（原实现 text.replace 会改全文首个同名星座 → 可能覆写前文的正确句子）
        const abs = m.index + m[0].length + wi;
        const before = text;
        // 🛡️ V478c: 防「座座」——窗内只剩【简称】(如「巨蟹」)时, 原文紧邻的「座」不在替换范围内,
        //   与新值(全称, 以「座」结尾)相邻 →「巨蟹座」被改成「白羊座座」。此处一并吃掉残留「座」。
        let wLen = written.length;
        if (lang === 'zh' && target.endsWith('座') && text[abs + wLen] === '座') wLen += 1;
        text = text.slice(0, abs) + target + text.slice(abs + wLen);
        nameRe.lastIndex += (text.length - before.length);
        result = text;
        console.log(`[V432] ${lang} ingress\u65f6\u5e8f\u9501: ${name} \u2192 ${written} \u21d2 ${target} (day=${day})`);
      }
      continue;
    }
    // ⚠️ V432-fix: 句中带明确日期的，流月「值锁」一律不得介入 —— 真值盘只是月初快照，
    //   代表不了该日真值，强行纠正 = 把正确写反（月亮除外已整星排除）。宁可不动，不可编。
    const sw = text.slice(m.index, m.index + 160);
    const swEnd = sw.search(/[.\n\u3002]/);
    const swCore = swEnd >= 0 ? sw.slice(0, swEnd) : sw;
    const prevLine = (text.slice(Math.max(0, m.index - 80), m.index).split(/[.\n\u3002]/).pop() || '');
    if (cfg.dateMark.test(swCore) || cfg.dateMark.test(prevLine)) continue;
    const clause = _v432TransitClause(cfg, lang, text, m.index, m[0].length);
    if (!clause) continue;
    const { fwd, bwd } = clause;
    const hasSignF = t.sign && fwd.includes(t.sign);
    const hasHouseF = t.house && (() => { const h = _v432FindHouse(cfg, fwd, true); return h && h.value === Number(t.house); })();
    const hasSignB = t.sign && bwd.includes(t.sign);
    const hasHouseB = t.house && (() => { const h = _v432FindHouse(cfg, bwd, false); return h && h.value === Number(t.house); })();
    // ── V459 统一声明（两条支路只做赋值，common tail 统一结算）──
    let patch = null, pos = -1, z = '', origLen = 0, changed = false;
    if (!(hasSignF || hasHouseF)) {
      // 🛠️ V459 扩展长句修复支路：fwd 窗口不包含 sign/house → 扩展搜索区域到第一个星座/宫位
      const pEnd = m.index + m[0].length;
      let extendedEnd = -1;
      for (const s of _v432AllSignWords(lang)) {
        const pos_s = text.indexOf(s, pEnd);
        if (pos_s >= 0) {
          const absSignEnd = pos_s + s.length;
          if (extendedEnd < 0 || absSignEnd < extendedEnd) extendedEnd = absSignEnd;
        }
      }
      const hm2 = _v432FindHouse(cfg, text.slice(pEnd, pEnd + 200), true);
      if (hm2) {
        const houseFmt = cfg.houseFmt(hm2.value);
        const absHouse = pEnd + hm2.idx + houseFmt.length;
        if (extendedEnd < 0 || absHouse > extendedEnd) extendedEnd = absHouse;
      }
      const zExt = text.slice(pEnd, extendedEnd > 0 ? extendedEnd : pEnd + 200);
      const p = _v432PatchZone(cfg, lang, zExt, t.sign, t.house, true, text, pEnd);
      if (p.count > 0) {
        patch = p; pos = pEnd; z = zExt; origLen = zExt.length;
      }
    } else {
      // ── 标准短句命中支路 ──
      z = fwd; origLen = z.length;
      patch = _v432PatchZone(cfg, lang, z, hasSignF ? null : t.sign, hasHouseF ? null : t.house, true, text, m.index + m[0].length);
      if (patch.count === 0 && bwd) {
        z = bwd; origLen = z.length;
        patch = _v432PatchZone(cfg, lang, z, hasSignB ? null : t.sign, hasHouseB ? null : t.house, false, text, m.index - origLen);
      }
      if (patch.count === 0) continue;
      pos = z === fwd ? m.index + m[0].length : Math.max(0, m.index - origLen);
    }
    // ── Common Tail（统一步骤）──
    if (patch && patch.count > 0 && pos >= 0) {
      // 🛡️ V478c: 防「座座」——窗口按 90 字硬截断时可能切断「X座」, 窗内只剩简称(如「巨蟹」),
      //   被替换成全称新值(如「白羊座」)后, 窗口【外】残留的那个「座」与其相邻 →「白羊座座」
      //   (生产实测: 年报同段「巨蟹座→白羊座座」而「天蝎座→水瓶座」正常, 差别正是窗口边界)。
      //   此处若新值以「座」结尾、原文紧邻字符同为「座」, 一并吃掉。
      let tailStart = pos + origLen;
      if (lang === 'zh' && patch.text.endsWith('座') && result[tailStart] === '座') tailStart += 1;
      result = result.slice(0, pos) + patch.text + result.slice(tailStart);
      text = result;
      nameRe.lastIndex = pos + patch.text.length;
      changed = true;
    console.log(`[V432] ${lang} \u6d41\u6708\u9501: ${name} \u2192 ${t.sign || '?'}${t.house ? ' ' + cfg.houseFmt(t.house) : ''}`);
    }
  }
  // 🛡️ V478c 兜底: 任何路径残留的重复「座」在此收口(中文「座座」无合法用例; 幂等, 无副作用)
  if (lang === 'zh') result = result.replace(/座座/g, '座');
  return result;
}

// ── 统一入口：en/es/zh 三语真值双锁（幂等；无真值盘则全程跳过，绝不编）──
// 🛡️ E13/R11d-4: 第 5 形参 opts（可选）—— HIT 路径传 `{ skipAdjudicate: true }`：
//   跳过错定「定语裁定」（它会向裸句插写 natal 限定词，破坏二跑幂等），
//   使 HIT 响应与缓存落库文本逐字一致；MISS/流式路径不传 ⇒ 行为零改动。
function applyTruthLocksEnEsZh(text, lang, astroMatrix, reportType, opts) {
  if (!text || typeof text !== 'string' || !_V432_LANGS.includes(lang)) return text;
  try {
    // 🛡️ E12/R11a: 形态收口必须**先于**真值锁 ——
    //   ① artifact 剥离（`— wait, no. Let us be precise.` 元话语不得进任何真值/句窗判断）；
    //   ② 畸形宫位归一（`in the 5 House`→`in the 5th House`，否则 houseOrd 认不出 ⇒ 纠偏链整段漏网）。
    //   🛡️ E13/R11d-1: ③ 拼写式序数归一（`in the seventh house`→`in the 7th House`，第五类盲区形态收口）。
    let out = stripLLMSelfCorrection(_v512NormalizeHouseOrdinal(text, lang));
    // 🛡️ E16/R11g: 输出卫生（吞空格粘连拆合 + es 英文宫位混入归一）—— 必须收口在
    //   `_v432Normalize` / 真值锁**之前**; 否则畸形形态进不了各语言形态正则 ⇒ 整段漏纠。
    out = _v516OutputHygiene(out, lang);
    out = _v432Normalize(out, lang);
    out = _v432LockNatal(out, lang, astroMatrix, opts && opts.skipAdjudicate ? { skipAdjudicate: true } : undefined);
    // 🛡️ V478-guard: 年报(12 个月跨度)禁用单月固化【流月锁】—— 镜像 V472-guard 的既有设计。
    //   病根: _v432Truth(...,'transit') 只锚 astroMatrix.months[0](首月快照), 无月份索引。
    //   套到年报正文会把【12 个月】的流年真值全部改写成【首月】值, 并注入「座座」重字。
    //   实测(1989-08-15 奥斯陆盘): LLM 原稿逐月标题「处女座第11宫/天秤座第12宫/天蝎座第1宫…」
    //   与 SwissEph 真值盘逐月一致, 被本锁改成首月值「水瓶座第4宫/白羊座第6宫…」+ 28 处「座座」。
    //   年报流年真值由 Prompt 层 P1.1 逐月注入块 + 12 月标题硬锁表锁定, 本锁只需服务月报。
    if (reportType !== 'yearly') out = _v432LockTransit(out, lang, astroMatrix);
    out = _v433LockMoonWeek(out, lang, astroMatrix);   // V433-fix4: 月亮周级硬锁
    out = applyV434Locks(out, lang, astroMatrix);   // V434
    out = v426EnforceNatalRetrograde(out, lang, astroMatrix);   // 🛠️ V426-R: 本命逆行标识锁（en/es；zh 无 marker 自动跳过）
    return out;
  } catch (e) {
    console.warn(`[V432] ${lang} \u771f\u503c\u9501\u5f02\u5e38\uff08\u539f\u6587\u900f\u4f20\uff09: ${e.message}`);
    return text;
  }
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V478b: 年报「12 个月标题逐月真值锁」（框架在案欠账落地）
//   病根: 年报月标题的太阳星座靠 LLM 自由发挥 → 同一盘不同次生成会漂移。
//     实测 1989-08-15 奥斯陆盘: 一次给对「处女座/天秤座/天蝎座/射手座…」(与真值盘逐字吻合),
//     另一次把【本命太阳狮子座】套给全部 12 个月(宫位对、星座全错)。
//   而月报时代的 _v432LockTransit 只锚 months[0] 首月快照, 跨 12 个月必然改错
//   (本轮已按 reportType 于年报停用), 故必须补一把「逐月」锁 —— 即框架文档在案的
//   「12 月逐月真值锁」欠账。
//   本锁: 以 astroMatrix.months[i] 逐月真值重写【标题行】的太阳星座 + 宫位;
//     按标题行在文档中的出现顺序对应 months[0..11]（年报月序严格时间递增, 无需外部日期）。
//   仅服务年报(reportType==='yearly' 且 months.length>=12), 月报零影响; 幂等。
// ══════════════════════════════════════════════════════════════════
const _V478_ORD_ZH = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const _V478_EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// 🛠️ V482b: 月标题「英文模板残渣」本地化表 + 「太阳词」表 —— 供 lockYearlyMonthTitles 兜底用。
//   病根(2026-09-30 生产端 1999-12-15 特罗姆瑟盘实测): 硬锁标题表对所有语种硬编码英文
//   `Sun in X` / `House N`, 中文 Prompt 因此夹带英文 → LLM 照抄 → 整篇 12 条月标题全变
//   「### 2026年9月: Sun in 处女座 第3宫 · …」。提示词侧已本地化(治本), 此处为输出侧兜底。
// 🛡️ E16/R11g: th 两项拼写纠正 —— 原表 `ดาวอาทิตย์`(行星/星期, 错) 与 `บ้าน N`(房屋, 错),
//   实际产出泰语形态为 `ดวงอาทิตย์`(太阳) 与 `ภพที่ N`(宫位)。原表与产出不符 ⇒
//   ① 英文模板残渣本地化会写出 LLM 自己都不用的词; ② `sigOf` 去重签名里的 th 太阳词失配。
const _V482B_TITLE_LEAD = { zh: '太阳', es: 'Sol en ', fr: 'Soleil en ', th: 'ดวงอาทิตย์ใน', vi: 'Mặt Trời trong ' };
const _V482B_TITLE_HOUSE = {
  zh: (n) => '第' + n + '宫', es: (n) => 'Casa ' + n, fr: (n) => 'Maison ' + n,
  th: (n) => 'ภพที่ ' + n, vi: (n) => 'Nhà ' + n,
};
const _V482B_SUN_WORD = { zh: '太阳', en: 'Sun', es: 'Sol', fr: 'Soleil', th: 'ดวงอาทิตย์', vi: 'Mặt Trời' };

// ══════════════════════════════════════════════════════════════════
// 🛡️ E16/R11g: 月标题行识别的【六语统一口径】
//   病根（2026-10-04 v513 线上 12 盘六语批测实测, 真值核对 **54 处错项**）:
//     下游三把锁（lockYearlyMonthTitles / lockYearlyTransitSigns / dedupYearlyMonthTitles）
//     的月标题行识别**只认 zh `2026年7月` 与 `lang==='en'` 的 `July 2026`**;
//     es `Julio 2026` / fr `Juillet 2026` / th `กรกฎาคม 2026` / vi `Tháng 7 Năm 2026`
//     全部认不出 ⇒ 段数 <2 ⇒ 三把锁**静默 return text 集体失效**。
//   实测后果: fr 12/12 标题星座全写 `Cancer`(首月锚点值)、th 12/12 写**本命太阳**;
//             es/vi 星座侥幸正确, 但**宫位零纠错**(各 3/12 错)。
//   本设施为唯一识别真源（判据同源纪律）: 三处调用点共用, 杜绝「一处补了、另一处仍盲」。
//   ⚠️ 泰语专有风险: 星座简写是月份名的**前缀**(กรกฎ ⊂ กรกฎาคม) ⇒
//      识别月名无碍, 但**星座匹配必须排除月份名内部**, 否则 `กรกฎาคม 2026: …ในตุลย์`
//      会被写成 `ตุลย์าคม 2026`(月份名被改坏) —— 见 _V516_TH_SIGN_EXCL。
// ══════════════════════════════════════════════════════════════════
// ⚠️ 自带转义器（**不复用 `_v444Esc`**）：本设施的调用方 `applyTruthLocksEnEsZh` 会被
//   `test/audit-en-es-zh-lock.test.js` 用 `new Function(SIGNS + BLOCK)` 抽取执行，
//   而 `_v444Esc` 定义在抽取区间**之外** ⇒ 复用会 ReferenceError 并被 `applyTruthLocksEnEsZh`
//   的 try/catch 静默吞掉（实测：整条真值锁退化为透传）。自带则与区间解耦。
function _v516Esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'); }

const _V516_MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
  vi: ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'],
};
// 泰语星座简写 → 必须排除的月份名后缀（键=星座简写, 值=其同前缀月份名的剩余部分）
const _V516_TH_SIGN_EXCL = { 'เมษ': 'ายน', 'พฤษภ': 'าคม', 'มิถุน': 'ายน', 'กรกฎ': 'าคม', 'กันยา': 'ยน', 'มีน': 'าคม' };
const _V516_TH_BE_OFFSET = 543;            // 佛历 − 543 = 公历
const _V516_HOUSE_WORD = { en: 'House', es: 'Casa', fr: 'Maison', th: '(?:ภพที่|บ้าน)', vi: 'Nhà' };
// 🛡️ E16/R11g-fix: 宫位词**纯字面**形态（供 `_v516OutputHygiene` 的「英文 `N House` 残渣归一」用）。
//   th 取**占星宫位**专用词 `ภพที่`（非「房屋」`บ้าน`）—— 与标题锁 `_V482B_TITLE_HOUSE.th` 同源。
const _V516_HOUSE_PLAIN = { es: 'Casa', fr: 'Maison', th: 'ภพที่', vi: 'Nhà' };

// 返回 { y, mo } 或 null（y 恒为**公历**年: 泰语佛历自动 −543）。
function _v516MonthHeadKey(line, lang) {
  if (!line) return null;
  const s = String(line);
  if (!/^#{1,6}\s/.test(s.trim())) return null;
  // ① 中文: 2026年7月
  let m = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/);
  if (m) { const mo = Number(m[2]); return (mo >= 1 && mo <= 12) ? { y: Number(m[1]), mo } : null; }
  // ② 泰语: กรกฎาคม พ.ศ. 2569（佛历） / กรกฎาคม 2026（公历）
  if (lang === 'th') {
    for (let i = 0; i < 12; i++) {
      if (s.indexOf(_V516_MONTHS.th[i]) < 0) continue;
      const be = s.match(/พ\.ศ\.\s*(\d{4})/);
      if (be) return { y: Number(be[1]) - _V516_TH_BE_OFFSET, mo: i + 1 };
      const ce = s.match(/(\d{4})/);
      return ce ? { y: Number(ce[1]), mo: i + 1 } : null;
    }
    return null;
  }
  // ③ 越南语: Tháng 7 Năm 2026
  m = s.match(/Tháng\s*(\d{1,2})\s*Năm\s*(\d{4})/i);
  if (m) { const mo = Number(m[1]); return (mo >= 1 && mo <= 12) ? { y: Number(m[2]), mo } : null; }
  // ④ en/es/fr/vi: <月名> <年>（月名独立成词, 前后不得紧贴其他字母/数字）
  //   🔴🔴 E16/R11g-fix (2026-10-04 线上 12 盘批测实锤): **必须加 `(?!\d)`**。
  //     病根: vi 的 `tháng 1` 是 `tháng 10`/`tháng 11`/`tháng 12` 的**前缀**, 原实现按 i=0..11
  //     顺序首次命中 ⇒ `### Tháng 11 2026: …` 被识别成 **1 月**（`Tháng 1` + `1 ` + `2026`）。
  //     后果（比「认不出」严重得多）: 10/11/12 三个月折叠成同一个 key ⇒ 下游
  //     `dedupYearlyMonthTitles` 判为「同月重复标题」⇒ **整行清空 11、12 月标题**
  //     （线上实测 s11 河内: 12 个标题只剩 10 个, 节距仍对齐 10 行 ⇒ 用户可见缺 2 月）。
  //   治法（双层）: ① 月词后禁止紧跟数字 `(?!\d)`; ② 遍历顺序改**词长倒序**（长词优先）。
  const words = _V516_MONTHS[lang];
  if (words) {
    const order = words.map((w, i) => [w, i + 1]).sort((a, b) => b[0].length - a[0].length);
    for (const [w, mo] of order) {
      const re = new RegExp('(?:^|[^A-Za-z\u00c0-\u00ff])' + _v516Esc(w) + '(?!\\d)[^A-Za-z\u00c0-\u00ff]{1,4}(\\d{4})', 'i');
      const mm = s.match(re);
      if (mm) return { y: Number(mm[1]), mo };
    }
  }
  return null;
}

// 年份/月份号真值写回（按各语原生形态; 泰语保持原历法）。幂等。
function _v516RewriteMonthYear(line, lang, y, mo) {
  if (!line || !(y >= 1) || !(mo >= 1 && mo <= 12)) return line;
  const cur = _v516MonthHeadKey(line, lang);
  if (!cur) return line;
  if (lang === 'zh') {
    if (cur.y === y && cur.mo === mo) return line;
    return line.replace(/(\d{4})\s*年\s*(\d{1,2})\s*月/, String(y) + '年' + mo + '月');
  }
  if (lang === 'th') {
    const w = _V516_MONTHS.th[mo - 1];
    let out = line;
    if (cur.mo !== mo) out = out.replace(_V516_MONTHS.th[cur.mo - 1], w);
    if (cur.y !== y) {
      out = /พ\.ศ\./.test(out)
        ? out.replace(/พ\.ศ\.\s*\d{4}/, 'พ.ศ. ' + (y + _V516_TH_BE_OFFSET))
        : out.replace(/(\d{4})/, String(y));
    }
    return out;
  }
  if (lang === 'vi') {
    // 🛡️ E24④/P6（2026-10-06 线上 8 盘终验铁证）：`Năm` **一律清洗**（归一为 `Tháng N YYYY`）。
    //   病根：原策略「原文有 `Năm` 就写回 `Năm`」（保本地化观感）⇒ **同一语种双形态并存**：
    //     s5（阿克拉）`### Tháng 7 2026: …` ／ s11（河内）`### Tháng 7 **Năm** 2026: …`
    //   ⇒ 前端 `KS_MONTH_TITLE_RE` 只认前者 ⇒ **s11 的 12 个月标题全数落白（0/12）**，
    //     而 s5 为 12/12。同语种两种外观的本质差异只在 `Năm`，必须归一（军师令：Năm 词汇清洗）。
    //   归一后单形态，前端零歧义（前端 `KS_MONTH_VI` **同步**补 `(?:\s*Năm)?` 容错 —— 双向兜底，
    //   因**流式期** `sacredText` 是 SSE 原文、**不经**后端归一 ⇒ 前端仍须容忍 `Năm`）。
    //   幂等：无 `Năm` 时该 `replace` 仅重写数字与年份（真值相同 ⇒ 文本不变）。
    return line.replace(/Tháng\s*\d{1,2}(?:\s*Năm)?\s*\d{4}/i,
      () => 'Tháng ' + mo + ' ' + y);
  }
  const arr = _V516_MONTHS[lang];
  if (!arr) return line;
  const w = arr[mo - 1], wOld = arr[cur.mo - 1];
  let out = line;
  if (cur.mo !== mo && w && wOld) {
    // 🛡️ E16/R11g: 保留原文大小写 —— es/fr 词表为**小写原生形态**(julio/juillet),
    //   但标题行首月名实际是**首字母大写**(`Septiembre 2026`)。直接写小写会产出
    //   `### julio 2026`(本地化观感瑕疵, 实测 12/12 条); 按原词的大小写风格回写。
    out = out.replace(new RegExp(_v516Esc(wOld), 'i'), (mm) => (
      /^[A-Z\u00c0-\u00dd]/.test(mm) ? (w.charAt(0).toUpperCase() + w.slice(1)) : w));
  }
  if (cur.y !== y) out = out.replace(/(\d{4})/, String(y));
  return out;
}

// 星座匹配串: 泰语须排除月份名内部（否则 `กรกฎาคม` 被当成 `กรกฎ` 写坏）。
function _v516SignAlt(lang, word) {
  const ex = (lang === 'th' && _V516_TH_SIGN_EXCL[word]) ? ('(?!' + _V516_TH_SIGN_EXCL[word] + ')') : '';
  return _v516Esc(word) + ex;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E16/R11g: 输出卫生守卫（确定性清洗; 幂等; **绝不改真值**）
//   两条实测缺陷（2026-10-04 v513 线上 12 盘批测）:
//   ① 吞空格粘连(en, s10 Delhi 4 处): `…also sextiles The CancerJupiter in Leo (12th House)`
//      与 `…also trine The GeminiMoon in Gemini`, 同句另有 `trines  The` 双空格
//      ⇒ 疑为「多段替换净长差 ⇒ 串长错位」的产物(该 artifact 在锁链输入即存在, 重跑不消除)。
//      本守卫按【星座名|行星名】词表组合确定性拆开, 不依赖根因定位;
//      该组合在正常文本中不存在 ⇒ 零误伤。
//   ② 英文宫位混入(es, s8 Madrid 9 处): `Júpiter en el 7 House`。`_V432_CFG.es` 只有
//      `Casa N` + 拼写序数两式, 对英文 `N House` 全盲 ⇒ 正文宫位形态非本地化。
//      **只换形态(值不变)**; 冠词 `el`→`la` 仅在「介词+冠词」紧邻该形态时纠正(Casa 阴性)。
// ══════════════════════════════════════════════════════════════════
let _V516_GLUE_RE = null;
function _v516GlueRe() {
  if (_V516_GLUE_RE) return _V516_GLUE_RE;
  // ⚠️ 延迟构造：SUN_SIGN_* 常量定义在本文件后半段, 顶层立即求值会触发 TDZ。
  const signs = [];
  for (const arr of [SUN_SIGN_EN, SUN_SIGN_ES, SUN_SIGN_FR]) {
    for (const w of (arr || [])) if (signs.indexOf(w) < 0) signs.push(w);
  }
  const planets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  _V516_GLUE_RE = new RegExp('(' + signs.map(_v516Esc).join('|') + ')(?=(?:' + planets.join('|') + ')\\b)', 'g');
  return _V516_GLUE_RE;
}
function _v516OutputHygiene(text, lang) {
  if (!text || typeof text !== 'string') return text;
  const before = text;
  let t = text.replace(_v516GlueRe(), '$1 ');
  // 🛡️ E16/R11g-fix: 原实现**只处理 es** ⇒ fr/th/vi 的英文宫位混入全盲
  //   （线上实测 s5/vi 阿克拉 `Sao Mộc tại 11 House`×38、s12/fr 巴黎 `… 7 House`×1）。
  //   原则不变: **只换形态, 绝不改值**; 幂等（换完再无 `House` 可命中）。
  const _hp = _V516_HOUSE_PLAIN[lang];
  if (_hp) {
    if (lang === 'es') {
      // `en el 7 House` → `en la Casa 7`（介词 + 冠词整体替换; Casa 为阴性名词）
      t = t.replace(/(\b(?:en|desde|hacia|a)\s+)(?:el|la|los|las)?\s*(\d{1,2})\s+House\b/gi, (m, prep, n) => prep + 'la Casa ' + n);
    }
    // 裸 `7 House` → `Casa 7` / `Maison 7` / `ภพที่ 7` / `Nhà 7`
    t = t.replace(/(?<![A-Za-z])(\d{1,2})\s+House\b/g, (m, n) => _hp + ' ' + n);
    // `House 7` → 同上（英文模板残渣的另一形态）
    t = t.replace(/(?<![A-Za-z])House\s+(\d{1,2})\b/g, (m, n) => _hp + ' ' + n);
    t = t.replace(/[ \t]{2,}/g, ' ');
  }
  if (t !== before) console.log(`[E16/R11g] ${lang} \u8f93\u51fa\u536b\u751f: ${before.length - t.length} \u5b57\u7b26\u5dee`);
  return t;
}

function lockYearlyMonthTitles(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  const months = astroMatrix && astroMatrix.months;
  if (!Array.isArray(months) || months.length < 12) return text;
  const signs = _v444Signs(lang);
  if (!signs) return text;
  const signRe = new RegExp('(' + signs.map((w) => _v516SignAlt(lang, w)).join('|') + ')');
  // 宫位短语: zh 需同时吃「第11宫」与「第十一宫」两种写法;
  // 🛡️ E16/R11g: ① en 实际产出是**序数前置** `7th House`(非 `House 7`) ⇒ 原 houseRe 认不出,
  //   标题宫位锁对 en 也失效(实测 Adelaide「12 月标题 12/12」只验了星座, 宫位是 LLM 自觉);
  //   ② th 需同时吃「ภพที่ 11」(实际产出形态)与旧「บ้าน 11」。
  const houseRe = lang === 'zh'
    ? /(第(?:\d+|[一二三四五六七八九十]+)宫)/
    : lang === 'en'
      ? /((?:\d{1,2}(?:st|nd|rd|th)\s+House)|(?:House\s*\d{1,2}))/
      : new RegExp('((?:' + ['Maison', 'Casa', 'ภพที่', 'บ้าน', 'Nhà'].join('|') + ')\\s*\\d+)');
  const ord2n = (s) => { const i = _V478_ORD_ZH.indexOf(s); return i > 0 ? i : NaN; };
  const nOfHouse = (ph) => {
    const d = ph.match(/\d+/);
    if (d) return Number(d[0]);
    const o = ph.match(/[一二三四五六七八九十]+/);
    return o ? ord2n(o[0]) : NaN;
  };

  const lines = text.split('\n');
  const groups = [];
  const keyOf = new Map();
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!/^#{1,6}\s/.test(ln)) continue;
    // 🛡️ E16/R11g: 六语统一识别（原实现只认 zh `2026年7月` 与 lang==='en' 的 `July 2026`
    //   ⇒ es/fr/th/vi 的 `Julio 2026`/`Juillet 2026`/`กรกฎาคม 2026`/`Tháng 7 Năm 2026`
    //   全部认不出 ⇒ groups<2 ⇒ 本锁对四语静默失效）。
    const _vk = _v516MonthHeadKey(ln, lang);
    if (!_vk) continue;
    const y = _vk.y, mo = _vk.mo;
    const key = y * 12 + mo;
    let g = keyOf.get(key);
    if (!g) { g = { key, rows: [] }; keyOf.set(key, g); groups.push(g); }
    g.rows.push(i);
  }
  if (groups.length < 2) return text;            // 不是 12 月矩阵 → 不动
  groups.sort((a, b) => a.key - b.key);
  const base = groups[0].key;
  let touched = 0;
  let wording = 0;   // 🛡️ V479: 措辞归一计数
  let dropped = 0;   // 🛡️ V482b: 重复月标题清算计数
  // 🛠️ V482b/V482c: 「同月重复标题行」清算 —— LLM 偶发对同一个月连续输出两行标题:
  //   「### 2026年9月: 太阳处女座 · 第3宫 · 沟通炼金，细节生金」
  //   「### 2026年9月: 太阳处女座 第3宫 · 沟通炼金，细节生金」
  //   (生产实测 12/12 个月全中招)。保留一行, 其余置空行(不改行数, 不破坏后续索引)。幂等。
  //
  //   V482b 旧法取「·」后第 1 段当副标题比对 → 上面两行的「副标题」分别是「第3宫」与
  //   「沟通炼金，细节生金」→ 判为不同标题 → **12/12 漏判**(线上实测 24 行标题)。V482c 改法:
  //     sig = 该行剥掉「太阳词」与**全部装饰分隔符/空白**后的字符串。
  //     ① sig 完全相同 → 同一条目(治「只在标点位置不同」);
  //     ② 两行都含「星座+宫位」且一条 sig 是另一条的前缀 → 简版/全版同一条目。
  //   保守侧: 「### 2026年9月财务重点」这类无星座宫位的子标题 sig 与月标题不同 → 不动;
  //           `####` 与 `###` 层级差天然隔离子标题。宁可漏改, 绝不误删正文。
  const _dropRows = new Set();
  {
    const sunWord = _V482B_SUN_WORD[lang] || _V482B_SUN_WORD.en;
    const sunWords = [...new Set([...Object.values(_V482B_SUN_WORD), 'Sun'])];
    const sigOf = (s) => {
      let t = String(s);
      for (const w of sunWords) if (w) t = t.split(w).join('');
      // ⚠️ 字符类里**禁止出现 ASCII 引号**(`"` / `'`): 测试端的朴素大括号配平器
      //   (test/*.test.js 的 fnBody) 不识别正则字面量, 会把引号当字符串起点 → 抽错函数体。
      return t.replace(/[\s\u00b7\u2022|:：\-—–，,、.。!！?？“”‘’()（）\[\]【】]+/g, '');
    };
    const hasCore = (ln) => signRe.test(ln) && houseRe.test(ln);
    for (const g of groups) {
      if (g.rows.length < 2) continue;
      const kept = [];
      for (const r of g.rows) {
        const ln = lines[r] || '';
        const sig = sigOf(ln);
        const prev = kept.find((p) => p.sig === sig
          || (sig && p.sig && hasCore(ln) && hasCore(p.ln)
            && (p.sig.startsWith(sig) || sig.startsWith(p.sig))));
        if (!prev) { kept.push({ r, ln, sig }); continue; }
        // 二选一: 优先「含太阳词」→ 其次「更长(信息更全)」→ 否则保留先出现的
        const keepNew = (!prev.ln.includes(sunWord) && ln.includes(sunWord))
          || (prev.ln.includes(sunWord) === ln.includes(sunWord) && sig.length > prev.sig.length);
        if (keepNew) { _dropRows.add(prev.r); prev.r = r; prev.ln = ln; prev.sig = sig; }
        else _dropRows.add(r);
      }
    }
  }
  for (const g of groups) {
    const idx = g.key - base;
    if (idx < 0 || idx >= months.length) continue;
    const m = months[idx];
    const sun = (m && (m.sun || (m.positions && m.positions.Sun))) || null;
    if (!sun || !sun.sign) continue;
    const zi = SUN_SIGN_EN.indexOf(sun.sign);
    if (zi < 0) continue;
    const trueSign = signs[zi];
    const trueHouse = Number(sun.house) || 0;
    for (const r of g.rows) {
      if (_dropRows.has(r)) { if (lines[r] !== '') { lines[r] = ''; dropped++; } continue; }
      let line = lines[r];
      // 🛡️ V483b: 月份号真值锁 —— 标题里的「年/月」必须等于本段窗口矩阵的 month_key。
      //   病根: Prompt 月份硬锁表此前按「服务器当前月 + i」生成 → LLM 照抄出 9 月起标题,
      //   而矩阵数据已是财年 7 月起 → 用户可见 12 条月标题整体错位 2 个月(V483 上线后暴露)。
      //   本锁按【标题行出现顺序】对应矩阵同序号月份, 与下方星座/宫位重写同源; 幂等; 无 month_key 则不动。
      //   ⚠️ 注释里禁止出现 `months[序号]` 字面量: test/*.test.js 的朴素 fnBody 会把注释一起切片,
      //     导致 `replace(/months\[idx\]/, ...)` 打到注释而非代码 → 注入自测假红。
      {
        const _mk = /^(\d{4})-(\d{1,2})$/.exec(String(m.month_key || ''));
        if (_mk) line = _v516RewriteMonthYear(line, lang, Number(_mk[1]), Number(_mk[2]));
      }
      // 🛠️ V482b: 英文模板残渣本地化(输出侧兜底, 见文件上方 _V482B_TITLE_LEAD 注释)。
      //   必须在下面的星座/宫位真值重写**之前**执行: 否则 `House 3` 不匹配 zh 的 houseRe → 宫位漏纠。
      if (lang !== 'en') {
        const _lead = _V482B_TITLE_LEAD[lang], _hw = _V482B_TITLE_HOUSE[lang];
        if (_lead) line = line.replace(/\bSun\s+in\s*/gi, _lead).replace(/\bSun\b\s*/gi, _lead);
        if (_hw) line = line.replace(/\bHouse\s*(\d+)/gi, (mm, n) => _hw(n));
      }
      const sm = line.match(signRe);
      if (sm && sm[1] !== trueSign) line = line.replace(sm[1], trueSign);
      const hm = line.match(houseRe);
      if (hm && trueHouse) {
        const cur = nOfHouse(hm[1]);
        if (cur !== trueHouse) {
          const ordForm = /[一二三四五六七八九十]/.test(hm[1]) && lang === 'zh';
          // 🛡️ E16/R11g: en 序数前置 `7th House` 的值改写必须重算后缀(否则 1st→`2th House`)
          const enOrd = lang === 'en' && /^(\d{1,2})(?:st|nd|rd|th)\s+House$/i.test(hm[1]);
          const want = ordForm ? ('第' + _V478_ORD_ZH[trueHouse] + '宫')
            : enOrd ? (trueHouse + _v432EnOrdSuf(trueHouse) + ' House')
              : hm[1].replace(/\d+/, String(trueHouse));
          const at = line.indexOf(hm[1]);
          line = line.slice(0, at) + want + line.slice(at + hm[1].length);
        }
      }
      // 🛡️ V479: 标题措辞归一 —— 剥掉标题行里紧贴行星名的指代前缀, 统一为「太阳X座 第N宫」形态。
      //   来源有二: ① LLM 原稿自带; ② 定语裁定 B 类历史上会误补(已在 _v479IsMonthTitleLine 处豁免)。
      //   月标题的太阳是【流月】值, 加「本命/你的」即为语义错误(本命太阳只有一个固定星座), 故一律剥离。
      //   本处为「统一出口」, 保证任意来源的措辞不一都在最后一道被拉齐; 幂等。
      const _w0 = line;
      if (lang === 'zh') {
        line = line.replace(/(?:\u4f60\u7684|\u547d\u4e2d|\u672c\u547d)\s*(?=(?:\u592a\u9633|\u6708\u4eae|\u6c34\u661f|\u91d1\u661f|\u706b\u661f|\u6728\u661f|\u571f\u661f|\u5929\u738b\u661f|\u6d77\u738b\u661f|\u51a5\u738b\u661f|\u4e0a\u5347|\u4e2d\u5929))/g, '');
      } else {
        line = line.replace(new RegExp('\\b(?:your|her|his|my|our|their|natal|natales?)\\b\\s*(?=(?:Sun|Moon|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|Sol|Luna|Soleil|Lune)\\b)', 'gi'), '');
        // 🛡️ E16/R11g: **后置**形态 —— fr/es 习惯写 `Soleil natal` / `Sol natal`
        //   (产出实测 s12/fr 标题 `Soleil natal en Capricorne`)。原实现只吃前置
        //   ⇒ 四语月标题里的「本命定语」残留 ⇒ 语义错误(月标题的太阳恒为流月值)。
        line = line.replace(new RegExp('\\b(Sun|Sol|Soleil|Moon|Luna|Lune|Mercury|Mercure|Venus|Mars|Jupiter|Saturne|Saturn|Uranus|Neptune|Pluton|Pluto)\\s+natal(?:e?s)?\\b', 'gi'), '$1');
      }
      if (line !== _w0) wording++;
      // 🛠️ V482c: 星座与宫位之间的装饰分隔符归一 —— `太阳处女座 · 第3宫 · 主题` → `太阳处女座 第3宫 · 主题`
      //   (V482b 硬锁表里 monthLockTable 给的是「星座 · 宫位」形态, LLM 会照抄成月标题;
      //    与另一条「星座 宫位」形态撞车 = 同月双标题。此处只吃「紧邻宫位短语之前」的 `·`,
      //    `第3宫 · 主题` 那一个保持不动。幂等。)
      line = line.replace(
        /\s*[\u00b7\u2022|]\s*(?=(?:第(?:\d+|[一二三四五六七八九十]+)宫)|(?:House|Maison|Casa|\u0e20\u0e1e\u0e17\u0e35\u0e48|\u0e1a\u0e49\u0e32\u0e19|Nh\u00e0)\s*\d+)/g, ' ');
      if (line !== lines[r]) { lines[r] = line; touched++; }
    }
  }
  if (touched || wording || dropped) console.log(`[V478b] ${lang} \u5e74\u62a5\u6708\u6807\u9898\u9010\u6708\u771f\u503c\u9501: \u91cd\u5199 ${touched} \u884c | V479 \u63aa\u8f9e\u5f52\u4e00 ${wording} \u884c | V482b \u53bb\u91cd ${dropped} \u884c`);
  return lines.join('\n');
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V482: 年报「逐月流年行星真值锁」—— 治本「跨月沿用 / 串染」
//   病根（2026-09-30 生产端 1999-12-15 特罗姆瑟盘实测）:
//     火星真值 2026-09=巨蟹座(第1宫), 10 月起离开巨蟹(狮子→处女→天秤),
//     但正文把首月的「火星在巨蟹」沿用到 11/12/次年2/3/4/5/6 月共 6 处 → 全年星座错误。
//     同类还有 2027-03「流月太阳在射手座」(该月真值双鱼座)。
//   本锁: 按【月标题行】把正文切成 12 段（与 lockYearlyMonthTitles 同源口径）,
//     每段内把「行星+动词+X座」的行星星座重写为该月真值 months[i]; 月亮除外(周级变化);
//     本命句(前 12 字含 本命/出生/原生/本盘)不动 —— 宁可漏改, 绝不编。
//   仅服务年报(reportType==='yearly' 且 12 月齐备); 月报零影响; 幂等。
// ══════════════════════════════════════════════════════════════════
const _V482_TRANSIT_KEYS = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];  // 排除 Moon
const _V482_TVERB = {
  zh: '(?:在|行经|进入|入驻|落入|位于|走到|移至|来到|抵达)',
  en: '\\s+(?:in|enters|entering|moves into|passes into|travels through)\\s+',
  es: '\\s+(?:en|entra en|ingresa en|recorre)\\s+',
};

function lockYearlyTransitSigns(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  const months = astroMatrix && astroMatrix.months;
  if (!Array.isArray(months) || months.length < 12) return text;
  const NAME = _V432_NAME[lang];
  const signs = _v444Signs(lang);                                                  // 全称（真值输出用）
  // ⚠️ 模式必须同时吃【全称】与【短名】（正文常写「火星在巨蟹」而非「巨蟹座」）;
  //   且**长优先**排序, 否则短名「巨蟹」会先吃掉「巨蟹座」→ 产出「狮子座座」。
  const signWords = _v432AllSignWords(lang).slice().sort((a, b) => b.length - a.length);
  const verb = _V482_TVERB[lang];
  if (!NAME || !signs || !signWords.length || !verb) return text;

  // ① 按【月标题行】切段（同 lockYearlyMonthTitles 口径）
  const lines = text.split('\n');
  const heads = [];
  const seen = new Set();
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!/^#{1,6}\s/.test(ln)) continue;
    // 🛡️ E16/R11g: 六语统一识别（同 lockYearlyMonthTitles 口径）
    const _vk = _v516MonthHeadKey(ln, lang);
    if (!_vk) continue;
    const y = _vk.y, mo = _vk.mo;
    const key = y * 12 + mo;
    if (seen.has(key)) continue;
    seen.add(key);
    heads.push({ line: i, key });
  }
  if (heads.length < 2) return text;
  heads.sort((a, b) => a.key - b.key);
  const base = heads[0].key;
  const signSrc = '(' + signWords.map((w) => _v516SignAlt(lang, w)).join('|') + ')';
  // 🛡️ E16/R11g: 宫位词按语言取（原实现非 zh/en 一律用 `Casa` ⇒ fr/th/vi 的
  //   `Maison N`/`ภพที่ N`/`Nhà N` 全部认不出, 星座改了宫位却不改 ⇒ 半改不一致）;
  //   en 实际产出是序数前置 `7th House` ⇒ 必须同时吃两种形态。
  const houseSrc = lang === 'zh'
    ? '(第\\s*\\d+\\s*宫)'
    : lang === 'en'
      ? '((?:\\d{1,2}(?:st|nd|rd|th)\\s+House)|(?:House\\s*\\d+))'
      : ('(' + (_V516_HOUSE_WORD[lang] || 'House') + '\\s*\\d+)');

  // 🛡️ E19/R11l: 本命星座豁免 —— 匹配星座与该行星【本命星座】一致时, 该句是对本命
  //   位置的陈述, 绝不可按流年真值改写; 否则既污染本命句, 又会让下游本命锁的
  //   「流年一致性门控」(_v512PossessiveNatal ⑥)误判弃权(E19/R11l 生产实证: s2 en
  //   「Saturn in Aquarius in your 4th House」被改成流年 Aries, Aries 恰跨该盘第4宫
  //   ⇒ 门控 false ⇒ 本命锁弃权 ⇒ 宫位错值终局落库)。宁漏不改。
  let natalTruth = null;
  try { natalTruth = _v432Truth(lang, astroMatrix, 'natal'); } catch (e) { natalTruth = null; }
  const _natalSignRe = {};
  if (natalTruth) {
    for (const pk of Object.keys(natalTruth)) {
      const _ns = natalTruth[pk] && natalTruth[pk].sign;
      if (!_ns) continue;
      try { _natalSignRe[pk] = new RegExp('^(?:' + _v516SignAlt(lang, _ns) + ')$', 'i'); } catch (e) {}
    }
  }

  let changed = 0;
  for (let h = 0; h < heads.length; h++) {
    const idx = heads[h].key - base;
    if (idx < 0 || idx >= months.length) continue;
    const m = months[idx] || {};
    const start = heads[h].line + 1;
    // ⚠️ 段尾 = 下一个【月标题】或下一个非月标题的标题行 —— 缺了守卫,
    //   末月段会一路吞到文末, 把【第三章~第五章】正文按末月真值改写(生产实测误改 5 行)。
    //   🛡️ E19/R11l: 原守卫只认 `## ` 二级锚点, 但 en 年报章节标题是 `### Chapter III~V`
    //   (三级) ⇒ 守卫形同虚设, 末月段吞进第三~五章, 「Saturn in Aquarius in your 4th
    //   House」(本命句)被按 6 月流年改成 Aries ⇒ 连锁炸掉下游本命锁的门控
    //   (_v512PossessiveNatal ⑥流年一致性否决, CRITIC 判据12 余警真因)。
    //   现改为: 任何【非月标题】的标题行都终止月段(月段内部实测无其他子标题)。
    let end = (h + 1 < heads.length) ? heads[h + 1].line : lines.length;
    for (let k = start; k < end; k++) {
      if (/^\s*#{1,6}\s/.test(lines[k]) && !_v516MonthHeadKey(lines[k].trim(), lang)) { end = k; break; }
    }
    for (let li = start; li < end; li++) {
      let line = lines[li];
      if (!line) continue;
      for (const key of _V482_TRANSIT_KEYS) {
        const pname = NAME[key];
        const pm = m[key.toLowerCase()] || (m.positions && m.positions[key]) || null;
        if (!pname || !pm || !pm.sign) continue;
        const zi = SUN_SIGN_EN.indexOf(pm.sign);
        if (zi < 0) continue;
        const trueSign = signs[zi];
        const trueHouse = Number(pm.house) || 0;
        const re = new RegExp(_v444Esc(pname) + verb + '\\s*' + signSrc + '(?:\\s*' + houseSrc + ')?', 'g');
        const before = line;
        line = line.replace(re, (full, signWord, houseWord, off) => {
          // 🛡️ E16/R11g: 本命豁免补多语 —— 原豁免**只有中文四词**(本命|出生|原生|本盘),
          //   对 en/es/fr 完全无效 ⇒ 「物主代词 + 太阳/月亮」的本命叙述被当作流年值改写。
          //   实测(s2/en Adelaide 本命太阳射手): `Your Sun in Sagittarius is the sign of
          //   abundance — but your Capricorn Rising…` 整句为本命陈述, 却被改成该月流年
          //   `Your Sun in Gemini` ⇒ 语义错误。该类句子是对「你出生星盘」的陈述, 不属月度流年。
          const _pre = before.slice(Math.max(0, off - 20), off);
          if (/(?:本命|出生|原生|本盘)/.test(_pre)) return full;
          if (/(?:\bnatal|\bnatale?s?|\bnative|\bof birth|\bat birth)\b/i.test(_pre + ' ' + full)) return full;
          if (/(?:\byour|\bmy|\bhis|\bher|\btheir|\bour|\btu|\bsu|\bson|\bsa|\bton|\bta|\bvotre|\bmon|\bma|\bnotre)\s*$/i.test(_pre)
            && /^(?:Sun|Moon|Sol|Luna|Soleil|Lune)\b/i.test(full)) return full;
          // 🛡️ E19/R11l: 匹配星座 ≡ 本命星座 ⇒ 本命陈述句, 弃权不改(宁漏不改)
          if (_natalSignRe[key] && _natalSignRe[key].test(signWord)) return full;
          let out = full;
          // 保留原文形态: 原文写短名(无「座」)就还它短名, 写全称就还全称
          const wantSign = (lang === 'zh' && !/座$/.test(signWord)) ? trueSign.replace(/座$/, '') : trueSign;
          if (signWord !== wantSign) {
            const si = out.indexOf(signWord);
            out = out.slice(0, si) + wantSign + out.slice(si + signWord.length);
          }
          // 星座改了就必须连宫位一起改, 否则产出「处女座第2宫」这种半改不一致
          if (houseWord && trueHouse) {
            const cur = Number((houseWord.match(/\d+/) || [0])[0]);
            if (cur !== trueHouse) {
              // 🛡️ E16/R11g: en 序数前置的值改写须重算后缀(否则 1st → `2th House`)
              const _eo = lang === 'en' && /^\d{1,2}(?:st|nd|rd|th)\s+House$/i.test(houseWord);
              const _hw = _eo ? (trueHouse + _v432EnOrdSuf(trueHouse) + ' House')
                : houseWord.replace(/\d+/, String(trueHouse));
              out = out.replace(houseWord, _hw);
            }
          }
          return out;
        });
        if (line !== before) changed++;
      }
      if (line !== lines[li]) lines[li] = line;
    }
  }
  if (changed) console.log(`[V482] ${lang} 年报逐月流年行星真值锁: 修正 ${changed} 处`);
  return lines.join('\n');
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V485: 年报「年度恒定外行星」全文真值锁
//   病根(2026-10-01 生产实测, 1997-10-18 特罗姆瑟盘):
//     流式产物第五章出现「在2026-2027年，木星进入双子座第9宫」,
//     而该盘全 12 个月真值均为【木星 狮子座 第9宫】(SwissEph 逐月核验, 无一例外)。
//   为什么 V482 的 lockYearlyTransitSigns 抓不住:
//     它按【月标题行】切段 ⇒ 非月段区间(开篇/第三章~第五章)整体不在作用域内, 越界句漏网。
//   本函数: 取「年度恒定」外行星真值(12 个月同值才启用), 对【全文】逐行纠正
//     「行星 + 动词 + 错星座(第N宫)」与「行星 + 动词 + 第N宫 + 错星座」两种形态;
//     排除本命句; 改星座必连宫位一起改; 幂等。
//   ⚠️ 只处理年内恒定的 5 颗外行星(木/土/天/海/冥) —— 火星/太阳等逐月变动的由 V482 月段锁负责。
//   ⚠️ 暂只做 zh(真值词表最完备); 其他语言维持原状, 不引入新风险。
// ══════════════════════════════════════════════════════════════════
const _V485_OUTER_KEYS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
// 🛡️ V485: 逐月「专属风控切入角度」池(12 个互不相同) —— 用于对抗黑天鹅段落跨月措辞同质化。
//   背景(军师 P1②, 2026-10-01 线上实证): 该盘 6 个月黑天鹅真值同为 Mars SQUARE Uranus,
//   LLM 收到一模一样的素材 ⇒ 连写同套措辞。给每月分配不同视角, 才有差异化内容可写。
const _V485_CRISIS_ANGLES = [
  '现金流周转与应急储备', '合同细则与隐性条款审查', '隐性债务与杠杆暴露', '合伙关系与资金共管',
  '税务与合规申报', '职业决策与收入结构', '资产流动性与变现难度', '跨境/远行相关资金',
  '创意项目投入产出比', '信息真伪与决策依据', '家庭财务与房产议题', '契约续签与人情债边界',
];
// ══════════════════════════════════════════════════════════════════
// 🛡️ V487: 逐月「叙述镜头 + 风控表达框架」确定性注入 —— 破解跨月句式同构(打地鼠终局)
//   病根(军师三轮评审 + 2026-10-01 线上实测, 1997-10-18 盘):
//     ① 【月度财富概览】首句 11/12 月共用同一骨架。V486b 禁掉「流年太阳进入…」后,
//        LLM 立刻换成一个同样统一的新骨架(「本月你的财务重心落在"某领域"」)——禁一个换一个。
//     ② 断路器段(黑天鹅警告)「绝对禁止…」整句逐月逐字复用, 线上实测 13 次;
//        V486/V486b 的「禁止类」规则与「只检不改」审计能抓到, 但治不住。
//   根因是结构性的: 12 个月真值高度雷同(外行星全年不动) + 产品强制四段结构
//     ⇒ 只给「禁止雷同」这类规则, LLM 必然落回某个统一句式。
//   对策与 V485 黑天鹅战役同法(已验证有效, 12/12 月窗口名全不同):
//     逐月注入**具体**切入角度/结构 —— 「给具体」远胜「禁止雷同」。
//   ⚠️ 只描述**结构**, 刻意不给任何可照抄的示例句(V462 教训: 提示词里的反例会被 LLM 照抄)。
//   ⚠️ 代号为闭集(属机制不属内容) ⇒ 泄漏时按 ⑤⑥ 规则整字段删除。
// ══════════════════════════════════════════════════════════════════
const _V487_NARRATIVE_LENSES = [
  '现金流周转速度与账期节奏', '长期资产配置比例与再平衡', '合同条款与定价中的隐性溢价',
  '副业与新渠道的变现测试', '固定支出结构与订阅式开销', '应收账款与回款周期',
  '定价权与议价空间', '技能资本化与知识变现', '保障覆盖与风险对冲',
  '存量债务的再融资时机', '时间成本与精力预算', '资产与负债的期限匹配',
];
const _V487_RISK_FRAMEWORKS = [
  '条件触发式——先给触发条件, 再给后果判断',
  '时间窗式——以时间长度与紧迫度组织风险叙述',
  '主体归因式——指明风险源自哪个外部主体',
  '对冲替代式——先给风险, 再给可替代的稳妥选项',
  '分级预警式——把风险按影响面分成两到三档',
  '因果链条式——由一个小信号推演至最终损失',
  '场景代入式——以签约/转账/续约等具体动作作载体',
  '反直觉式——先给与直觉相反的判断, 再解释缘由',
  '主动权式——把重心放在用户可以控制的部分',
  '代价对比式——对比两条路径的代价差异',
  '拖延成本式——指出推迟决定本身产生的代价',
  '边界划定式——给出明确的取舍边界与红线',
];
// 🛡️ V487: 逐月「财富高峰窗口·执行指令」框架池(12 个互不相同的开句结构)
//   第三条 12/12 同骨架(线上实测 V486b 产物): 「这是你本月最适合"X"的窗口」×12 ——
//   与概览首句同病: 禁掉「这个窗口期是行动的最佳时机」后 LLM 立刻换成另一个统一套壳。
//   ⇒ 同样按「逐月给具体」处理, 而非再加一条禁止令。
const _V487_WINDOW_FRAMES = [
  '动作指令式——开句直接给出当月可执行的动作, 不使用套壳式引导语',
  '截止时点式——开句先给出最晚必须完成的时间点',
  '对象优先式——开句先点明要找的人或要谈的对手',
  '阈值量化式——开句先给出一个可量化的金额或比例标准',
  '两步顺序式——开句给出"先做A再做B"的顺序, 不写笼统鼓励',
  '场景先行式——开句先给一个具体财务场景, 再落到动作',
  '备选对冲式——开句先写"若第一条路径不通, 退而做哪件事"',
  '自检提问式——开句以一个自查问题引出当月动作',
  '筹码盘点式——开句先盘点用户手中已有的筹码',
  '错失代价式——开句先写错过这几天的具体代价',
  '双方分工式——开句把动作拆成"你做什么／对方做什么"',
  '单一焦点式——开句只给一个动作, 并明确本月只做这一件',
];
// 结构性框架的闭集代号(风控 + 窗口): 泄漏时整字段删除 —— 代号是人工词, 正文不会自然出现。
const _V487_RFW_CODES = _V487_RISK_FRAMEWORKS.concat(_V487_WINDOW_FRAMES).map((s) => s.split('——')[0]);
// 年报 prompt 追加块(zh 专用): 三张分配表 + 机械判据。
//   ⚠️ 与 V485 的「风控主线分配表」并列使用, 索引口径一致(第 i 个月 ↔ 第 i 项)。
//   ⚠️ 坐标真值(线上产物核验): 12 个月度章节位于【第二章 365天月度收入矩阵】之下
//      (标题形如 `### 2026年7月: 太阳巨蟹座 第8宫 · …`), 概览/窗口/断路器段都在章内。
function buildYearlyLensFrameworkBlock() {
  const rows = (list) => list.map((a, idx) => `${idx + 1}. ${a}`).join('; ');
  return '\n\n【📌 第二章 月度叙述镜头分配表(内部参考, 严禁在正文写出本表名/字段名)】\n'
    + '按第二章【365天月度收入矩阵】里 12 个月出现的先后顺序依次对应(第 1 个月=第 1 项, 依此类推, 不得错位/重复):\n'
    + rows(_V487_NARRATIVE_LENSES)
    + '\n\n【📌 第二章 风控表达框架分配表(内部参考, 严禁在正文写出本表名/字段名)】\n'
    + '同样按第二章 12 个月出现的先后顺序依次对应(第 1 个月=第 1 项, 依此类推, 不得错位/重复):\n'
    + rows(_V487_RISK_FRAMEWORKS)
    + '\n\n【📌 第二章 窗口表达框架分配表(内部参考, 严禁在正文写出本表名/字段名)】\n'
    + '同样按第二章 12 个月出现的先后顺序依次对应(第 1 个月=第 1 项, 依此类推, 不得错位/重复):\n'
    + rows(_V487_WINDOW_FRAMES)
    + '\n\n【V487 机械判据 — 与前文所有铁律同级, 违反即视为不合格品】\n'
    + '1. 【概览首句必须从「本月叙述镜头」切入】12 个月的【月度财富概览】首句, 必须直接以「月度叙述镜头分配表」中该月对应的那一项作为切入主题(资金周转速度／资产配置比例／合同隐性溢价／回款周期 等具体财务角度), 并给出本月的金钱后果判断。严禁采用"先点出领域名词、再用一个解释性从句说明该领域意味着什么"的同构起手骨架; 严禁 12 个月复用同一句首句结构。每个月必须让人一眼看出切入点不同。⚠️ 只能取自「月度叙述镜头分配表」, 严禁与「第二章 风控主线分配表」「风控表达框架分配表」互相串用(三张表用途不同, 取错表即视为不合格品)。\n'
    + '2. 【断路器段必须使用「本月风控表达框架」】12 个月的 🔴[财务黑天鹅日] 断路器警告段, 必须按「风控表达框架分配表」中该月对应的结构组织叙述。严禁使用无条件的命令式禁令句作为风险收尾; 严禁 12 个月复用同一句风险结论、同一个收尾动词或同一个比喻意象。\n'
    + '3. 【窗口执行指令必须使用「本月窗口表达框架」】12 个月的 🟢[财富高峰窗口] 的 *执行指令* 一句, 必须按「窗口表达框架分配表」中该月对应的结构开句。严禁 12 个月让这一句共用同一个引导骨架或同一个收尾判断。\n'
    + '4. 【本表仅为写作指令】严禁把「叙述镜头」「风控表达框架」「窗口表达框架」这类字段名、分配表编号或本表任何整句原样写进正文。';
}
function lockYearlyOuterPlanetsYear(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return text;
  if (lang !== 'zh') return text;
  if (!text || typeof text !== 'string') return text;
  const months = astroMatrix && astroMatrix.months;
  if (!Array.isArray(months) || months.length < 12) return text;
  const NAME = _V432_NAME[lang];
  const signs = _v444Signs(lang);
  const signWords = _v432AllSignWords(lang).slice().sort((a, b) => b.length - a.length);
  const verb = _V482_TVERB[lang];
  if (!NAME || !signs || !signWords.length || !verb) return text;

  // ── 取年度真值: 12 个月必须同值, 否则该行星年内换座 → 弃权(交给 V482 月段锁) ──
  const truth = {};
  for (const key of _V485_OUTER_KEYS) {
    const seen = new Map();
    for (const m of months) {
      const pm = m[key.toLowerCase()] || (m.positions && m.positions[key]) || null;
      if (!pm || !pm.sign) { seen.clear(); break; }
      const k = pm.sign + '|' + (Number(pm.house) || 0);
      seen.set(k, (seen.get(k) || 0) + 1);
    }
    if (seen.size !== 1) continue;
    const k = [...seen.keys()][0];
    const parts = k.split('|');
    const zi = SUN_SIGN_EN.indexOf(parts[0]);
    if (zi < 0 || !signs[zi]) continue;
    truth[key] = { sign: signs[zi], house: Number(parts[1]) || 0 };
  }
  if (!Object.keys(truth).length) return text;

  const signSrc = '(' + signWords.map(_v444Esc).join('|') + ')';
  const houseSrc = '(第\\s*\\d+\\s*宫)';
  const lines = text.split('\n');
  let changed = 0;
  for (let li = 0; li < lines.length; li++) {
    let line = lines[li];
    if (!line) continue;
    for (const key of _V485_OUTER_KEYS) {
      const tv = truth[key];
      if (!tv) continue;
      const pname = NAME[key];
      if (!pname || line.indexOf(pname) < 0) continue;
      // 形态A: 木星进入「双子座第9宫」 / 形态B: 木星进入「第9宫狮子座」
      const reA = new RegExp(_v444Esc(pname) + verb + '\\s*' + signSrc + '(?:\\s*' + houseSrc + ')?', 'g');
      const reB = new RegExp(_v444Esc(pname) + verb + '\\s*' + houseSrc + '\\s*' + signSrc, 'g');
      const fix = (full, a1, a2, off) => {
        // a1/a2 依形态而序不定 → 逐个判别
        const args = [a1, a2].filter((x) => typeof x === 'string');
        const signWord = args.find((x) => signWords.indexOf(x) >= 0);
        const houseWord = args.find((x) => /第\s*\d+\s*宫/.test(x));
        if (/(?:本命|出生|原生|本盘)/.test(line.slice(Math.max(0, off - 12), off))) return full;  // 本命句归本命锁
        let out = full;
        if (signWord) {
          const wantSign = /座$/.test(signWord) ? tv.sign : tv.sign.replace(/座$/, '');
          if (signWord !== wantSign) {
            const si = out.indexOf(signWord);
            if (si >= 0) out = out.slice(0, si) + wantSign + out.slice(si + signWord.length);
          }
        }
        if (houseWord && tv.house) {
          const cur = Number((houseWord.match(/\d+/) || [0])[0]);
          if (cur !== tv.house) out = out.replace(houseWord, houseWord.replace(/\d+/, String(tv.house)));
        }
        return out;
      };
      const before = line;
      line = line.replace(reA, (full, a1, a2, off) => fix(full, a1, a2, off));
      line = line.replace(reB, (full, a1, a2, off) => fix(full, a1, a2, off));
      if (line !== before) changed++;
    }
    if (line !== lines[li]) lines[li] = line;
  }
  if (changed) console.log(`[V485] ${lang} 年报年度外行星真值锁: 修正 ${changed} 处`);
  return lines.join('\n');
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V488: 年报「非月段·流年太阳引用」真值锁 + 语义漂移审计
//   病根(2026-10-01 立项调研, 跨 2 盘实证: 可定位真值的非月段流年太阳引用 9 处中 8 处错 = 89%):
//     非月段(开篇/第一章/第三章/第四章/第五章/最终神谕)是现有真值锁体系的**作用域真空**——
//     V485 注释原文「只处理年内恒定的 5 颗外行星(木/土/天/海/冥) —— 火星/太阳等逐月变动的
//     由 V482 月段锁负责」, 而 V482 的作用域**只有月段** ⇒ 非月段的流年太阳**两头都不管**。
//     1985-06-20 盘实测: 星座全被写成本命太阳星座(双子座)、只改了宫位
//     ⇒ 即 Natal Sun 的星座被套到 Transit Sun 上(军师所判 Transit/Natal 语义漂移)。
//   三级治理(军师裁决):
//     一级 确定性纠正 —— 只改星座词与宫位词(不改句式/不重写其它任何字符), 需同时满足:
//       ① 行不在任何【月段】区间内(与 V482 同源口径)
//       ② 句内含「流年/行运」锚点
//       ③ 引用之前【最近的行星名】必须是「太阳」       ← 归属护栏(一步解决「夹其它行星误伤」)
//       ④ 该「太阳」前 2 字不含 本命/出生/原生/本盘    ← 本命豁免
//       ⑤ 存在【前置】月份锚点, 且距引用 ≤ 24 字       ← 只认前置, 天然放行「月份在后」的反例
//     二级 审计(只检不改) —— 无前置月份锚点的太阳引用, 值不属于本年度 12 个月真值集合 ⇒ 告警
//     三级 审计(只检不改) —— 句内月份唯一但**位于引用之后**且与引用值冲突 ⇒ 告警
//        (覆盖军师原报形态「流年太阳在天秤座第11宫，2027年3月将激活…」: 该处 3 月是「激活」的
//         时间点而非入座时间, 强改会撕裂「激活田宅宫」语义 ⇒ V484 类事故面, 绝不改)
//   ⚠️ 真值源 = astroMatrix.months[i] 的太阳(与 V482/V485 同源); **禁止**从月标题反构。
//   ⚠️ 仅 zh + yearly(决策: EN/TH 未做同等密度取证前不推广); 幂等; 改星座必连宫位一起改。
//   ⚠️ 接线必须紧随 lockYearlyOuterPlanetsYear(后者只管外行星, 无重叠); 二/三级审计由本函数内联执行。
// ══════════════════════════════════════════════════════════════════
const _V488_NATAL = /本命|出生|原生|本盘/;
const _V488_PLANETS = '(太阳|月亮|水星|金星|火星|木星|土星|天王星|海王星|冥王星|上升|中天)';
const _V488_MONTH = /(?:\d{4}\s*年)?\s*(\d{1,2})\s*月(?:份)?/g;
const _V488_MAX_GAP = 24;   // 月份锚点与引用之间的最大字距, 超出视为无关(防"句内远月"错配)
const _V488_ORD = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

// 核心: 返回 { out, fixed, warn2, warn3, log }。纯函数(不修改入参), 不改行数, 幂等。
function _v488SunRefCore(text, lang, astroMatrix) {
  if (lang !== 'zh') return null;
  if (!text || typeof text !== 'string') return null;
  const months = astroMatrix && astroMatrix.months;
  if (!Array.isArray(months) || months.length < 12) return null;
  const signs = _v444Signs(lang);
  const signWords = _v432AllSignWords(lang).slice().sort((a, b) => b.length - a.length);
  if (!signs || !signWords.length) return null;

  // ① 逐月太阳真值: 月号优先取 month_key(V483b 月标题真源同口径), 无 month_key 则按序号回退
  const truth = new Map();
  months.forEach((m, i) => {
    const sun = (m && (m.sun || (m.positions && m.positions.Sun))) || null;
    if (!sun || !sun.sign) return;
    const zi = SUN_SIGN_EN.indexOf(sun.sign);
    if (zi < 0 || !signs[zi]) return;
    let mo = i + 1;
    const mk = /^(\d{4})-(\d{1,2})$/.exec(String((m && m.month_key) || ''));
    if (mk) mo = Number(mk[2]);
    if (mo < 1 || mo > 12 || truth.has(mo)) return;
    truth.set(mo, { sign: signs[zi], house: Number(sun.house) || 0 });
  });
  if (!truth.size) return null;
  const validSet = new Set([...truth.values()].map((v) => v.sign + '|' + v.house));

  // ② 月段行集合(与 V482 同源: 按【月标题行】切段, 段尾止于下一个 `## ` 章节锚点)
  const lines = text.split('\n');
  const heads = [];
  const seenKey = new Set();
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!/^#{1,6}\s/.test(ln)) continue;
    const ym = ln.match(/(\d{4})年(\d{1,2})月/);
    if (!ym) continue;
    const mo = Number(ym[2]);
    if (mo < 1 || mo > 12) continue;
    const key = Number(ym[1]) * 12 + mo;
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    heads.push({ line: i, key });
  }
  if (heads.length < 2) return null;
  heads.sort((a, b) => a.key - b.key);
  const inMonth = new Set();
  heads.forEach((h, n) => {
    let end = n + 1 < heads.length ? heads[n + 1].line : lines.length;
    for (let k = h.line + 1; k < end; k++) { if (/^\s*##\s/.test(lines[k])) { end = k; break; } }
    for (let k = h.line; k < end; k++) inMonth.add(k);
  });

  const signSrc = '(' + signWords.map(_v444Esc).join('|') + ')';
  const refSrc = signSrc + '(?:\\s*第\\s*(\\d+|[一二三四五六七八九十]{1,3})\\s*宫)?';
  const numOfHouse = (w) => {
    if (/\d/.test(w)) return Number((w.match(/\d+/) || [0])[0]);
    const o = w.match(/[一二三四五六七八九十]+/);
    const i = o ? _V488_ORD.indexOf(o[0]) : -1;
    return i > 0 ? i : NaN;
  };

  let fixed = 0, warn2 = 0, warn3 = 0;
  const log = [];

  for (let li = 0; li < lines.length; li++) {
    if (inMonth.has(li)) continue;                              // ① 非月段
    const line = lines[li];
    if (!line || line.indexOf('太阳') < 0) continue;
    const parts = line.split(/(?<=[。！？])/);
    let touched = false;
    for (let pi = 0; pi < parts.length; pi++) {
      const s = parts[pi];
      if (!/太阳/.test(s) || !/流年|行运/.test(s)) continue;    // ② 句级流年锚点

      const anchors = [];
      for (const m of s.matchAll(new RegExp(_V488_MONTH.source, 'g'))) anchors.push({ end: m.index + m[0].length, mo: Number(m[1]) });
      const refs = [];
      for (const m of s.matchAll(new RegExp(refSrc, 'g')))
        refs.push({ start: m.index, len: m[0].length, sign: m[1], house: m[2] ? numOfHouse(m[2]) : null, raw: m[0] });
      const lastPlanet = (str, pos) => {
        let r = null;
        for (const m of str.slice(0, pos).matchAll(new RegExp(_V488_PLANETS, 'g'))) r = { name: m[1], idx: m.index };
        return r;
      };
      const isSunOwned = (str, pos) => {
        const lp = lastPlanet(str, pos);
        if (!lp || lp.name !== '太阳') return false;                                     // ③ 归属护栏
        if (_V488_NATAL.test(str.slice(Math.max(0, lp.idx - 2), lp.idx))) return false;  // ④ 本命豁免
        return true;
      };

      let out = s;
      const paired = new Set();
      for (let k = refs.length - 1; k >= 0; k--) {                 // 从后往前, 避免位移
        const ref = refs[k];
        if (!isSunOwned(s, ref.start)) continue;
        let a = null;
        for (const x of anchors) if (x.end <= ref.start && (!a || x.end > a.end)) a = x;
        if (!a || ref.start - a.end > _V488_MAX_GAP) continue;     // ⑤ 前置月份配对
        const tv = truth.get(a.mo);
        if (!tv) continue;
        paired.add(k);
        let r = ref.raw, hit = false;
        if (ref.sign !== tv.sign) {
          const want = /座$/.test(ref.sign) ? tv.sign : tv.sign.replace(/座$/, '');  // 保留原文形态(有座写座)
          if (want !== ref.sign) { r = r.replace(ref.sign, want); hit = true; }
        }
        if (ref.house != null && tv.house && ref.house !== tv.house) {               // 改星座必连宫位一起改
          const wantH = /\d/.test(ref.raw) ? ('第' + tv.house + '宫') : ('第' + _V488_ORD[tv.house] + '宫');
          r = r.replace(/第\s*(?:\d+|[一二三四五六七八九十]{1,3})\s*宫/, wantH);
          hit = true;
        }
        if (hit) {
          out = out.slice(0, ref.start) + r + out.slice(ref.start + ref.len);
          fixed++;
          log.push(`[L${li + 1}] 一级纠正「${ref.raw}」→「${r}」(${a.mo}月真值)`);
        }
      }
      if (out !== s) { parts[pi] = out; touched = true; }

      // 二级审计(只检不改): 无(有效前置)月份锚点的太阳引用, 值不属本年度真值集合 ⇒ 告警
      const seenRef = new Set();
      for (const m of out.matchAll(new RegExp(refSrc, 'g'))) {
        if (m[2] == null) continue;
        if (!isSunOwned(out, m.index)) continue;
        const sign = m[1], house = numOfHouse(m[2]);
        const dup = sign + '|' + house;
        if (seenRef.has(dup)) continue;
        seenRef.add(dup);
        let hasFront = false;
        for (const x of anchors) if (x.end <= m.index && m.index - x.end <= _V488_MAX_GAP && truth.has(x.mo)) hasFront = true;
        if (hasFront) continue;                                    // 有前置锚点 ⇒ 归一级口径
        if (!validSet.has(dup)) {
          warn2++;
          log.push(`[L${li + 1}] 二级告警 ⚠️ 太阳「${sign} 第${house}宫」不属本年度任何月份真值(无可靠前置月份锚点)`);
        }
      }

      // 三级审计(只检不改): 句内月份唯一但位于引用之后, 且与引用值冲突 ⇒ 语义漂移告警
      const uniqM = [...new Set([...s.matchAll(new RegExp(_V488_MONTH.source, 'g'))].map((m) => Number(m[1])))];
      if (uniqM.length === 1 && truth.has(uniqM[0])) {
        const tv = truth.get(uniqM[0]);
        refs.forEach((ref, k) => {
          if (paired.has(k)) return;                               // 已被一级接管
          if (!isSunOwned(s, ref.start)) return;
          for (const x of anchors) if (x.end <= ref.start && ref.start - x.end <= _V488_MAX_GAP) return;
          if (ref.sign !== tv.sign || (ref.house != null && tv.house && ref.house !== tv.house)) {
            warn3++;
            log.push(`[L${li + 1}] 三级告警 ⚠️ 语义漂移: 句内 ${uniqM[0]} 月真值「${tv.sign} 第${tv.house}宫」, 但太阳引用写作「${ref.raw}」`);
          }
        });
      }
    }
    if (touched) lines[li] = parts.join('');
  }

  if (fixed) console.log(`[V488] ${lang} 年报非月段流年太阳真值锁: 修正 ${fixed} 处`);
  if (warn2 || warn3) console.log(`[V488-AUDIT] ${lang} 年报非月段流年太阳语义漂移审计(只检不改): 二级 ${warn2} 处 / 三级 ${warn3} 处`);
  log.slice(0, 4).forEach((x) => console.log(`[V488]   ${x}`));
  return { out: lines.join('\n'), fixed, warn2, warn3, log };
}

// 一级纠正出口(含内联二/三级审计日志) —— 接线必须紧随 lockYearlyOuterPlanetsYear。
function lockYearlyNonMonthSunRef(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return text;
  const r = _v488SunRefCore(text, lang, astroMatrix);
  return r ? r.out : text;
}

// 只读审计出口(在线探针 / 单测直调): 不返回改写文本, 只回告警计数。
function auditYearlyNonMonthSunRef(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return null;
  const r = _v488SunRefCore(text, lang, astroMatrix);
  if (!r) return null;
  return { fixed: 0, warned: r.warn2 + r.warn3, warn2: r.warn2, warn3: r.warn3, log: r.log };
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E20/R11n ①：年报「元素归纳段·流年坐标剪枝锁」（V488d 契约的确定性落地）
// ══════════════════════════════════════════════════════════════════
// 【病根】（2026-10-05 E19/R11m 终局 sweep s7 zh 实证）：yearlySystemZH.txt 4d-6（V488d）
//   规定第三章/四/五章的「元素归类/主题归纳/能量趋势」段落**禁止**出现
//   「流年太阳（行星）+ 星座 + 宫位」坐标断言 —— 但该契约此前只有 prompt 规则 +
//   V488-AUDIT 埋点（只检不改），无确定性执行器 ⇒ LLM 偶发违约直达落库：
//     · 「土元素…主要通过流年太阳在双子座第八宫2027年5月来激活」（坐标还错值，5月真值金牛）
//     · 「火元素的能量主要通过流年土星在白羊座第六宫来激活」（无月份锚点的孤立坐标）
//   即 V488-AUDIT「三级 3 处」告警本体，CRITIC 判据9（双子归土元素）真阳性之源。
// 【治法】stripYearlyElementCoordLeak —— 确定性剪枝：**删坐标、保时间**。铁律：
//   ① 仅 zh + yearly（契约只存在于中文年报 prompt；他语宁漏不改）；
//   ② 仅「非月段」（月段有 V482 逐月锁；段判定与 V488 同源：`#{1,6}\s`+YYYY年M月 标题行）；
//   ③ 句级准入（窄前缀，宁漏不改）：句含「元素」字样（元素归类/元素路径/火土风水元素）；
//   ④ 打击面 = `流年<行星>在<星座><第N宫>` 坐标断言，且该坐标**无前置月份锚点**
//      （配对规则与 V488 一级/二级同源：锚点须在坐标之前 ≤_V488_MAX_GAP 字）——
//      「在2027年4月流年太阳在白羊座第六宫」这类有前置锚点的合法形态绝不触碰；
//   ⑤ 本命豁免：坐标前 2 字含「本命」⇒ 跳过（本命配置是 4d-6 明文允许项）；
//   ⑥ 动作 = 剪坐标保时间：剪后句内仍余月份词 ⇒ 坐标整段删除（时间自然承接）；
//      无月份词 ⇒ 坐标替换为「流年行运」（保「主要通过…来激活」句法可读，零坐标零真值断言）；
//   ⑦ 禁动句界：只做句内 span 替换，绝不跨句/跨行；幂等（替换产物不再命中准入正则）。
const _E20_LEAK_PLANET = '(?:太阳|月亮|水星|金星|火星|木星|土星|天王星|海王星|冥王星)';
function stripYearlyElementCoordLeak(text, lang, reportType) {
  if (lang !== 'zh' || reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  const signWords = _v432AllSignWords('zh').slice().sort((a, b) => b.length - a.length);
  if (!signWords.length) return text;
  const leakRe = new RegExp('流年' + _E20_LEAK_PLANET + '在(' + signWords.map(_v444Esc).join('|') + ')第\\s*(?:\\d+|[一二三四五六七八九十]{1,3})\\s*宫', 'g');
  const lines = text.split('\n');
  // 非月段判定（与 V488 同源：月标题行 + 其段内行集合；段尾止于 `## ` 二级章节锚点）
  const heads = [];
  const seenKey = new Set();
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!/^#{1,6}\s/.test(ln)) continue;
    const ym = ln.match(/(\d{4})年(\d{1,2})月/);
    if (!ym) continue;
    const mo = Number(ym[2]);
    if (mo < 1 || mo > 12) continue;
    const key = Number(ym[1]) * 12 + mo;
    if (seenKey.has(key)) continue;
    seenKey.add(key);
    heads.push({ line: i, key });
  }
  if (heads.length < 2) return text;
  heads.sort((a, b) => a.key - b.key);
  const inMonth = new Set();
  heads.forEach((h, n) => {
    let end = n + 1 < heads.length ? heads[n + 1].line : lines.length;
    for (let k = h.line + 1; k < end; k++) { if (/^\s*##\s/.test(lines[k])) { end = k; break; } }
    for (let k = h.line; k < end; k++) inMonth.add(k);
  });
  let touchedAny = false;
  for (let li = 0; li < lines.length; li++) {
    if (inMonth.has(li)) continue;                              // ② 非月段
    const line = lines[li];
    if (!line || line.indexOf('元素') < 0 || line.indexOf('流年') < 0) continue;
    const parts = line.split(/(?<=[。！？])/);
    let touched = false;
    for (let pi = 0; pi < parts.length; pi++) {
      const s = parts[pi];
      if (!/元素/.test(s)) continue;                            // ③ 元素归纳句
      leakRe.lastIndex = 0;
      if (!leakRe.test(s)) continue;
      const anchors = [];
      for (const m of s.matchAll(new RegExp(_V488_MONTH.source, 'g'))) anchors.push({ end: m.index + m[0].length, mo: Number(m[1]) });
      leakRe.lastIndex = 0;
      const hits = [...s.matchAll(leakRe)].map((m) => ({ start: m.index, len: m[0].length }));
      let out = s;
      for (let k = hits.length - 1; k >= 0; k--) {              // 从后往前, 避免位移（E13 铁律）
        const h0 = hits[k];
        if (/本命/.test(out.slice(Math.max(0, h0.start - 2), h0.start))) continue;  // ⑤ 本命豁免
        let hasFront = false;                                   // ④ 无前置月份锚点才动
        for (const x of anchors) if (x.end <= h0.start && h0.start - x.end <= _V488_MAX_GAP) hasFront = true;
        if (hasFront) continue;
        const rest = out.slice(0, h0.start) + out.slice(h0.start + h0.len);
        const repl = /(?:\d{4}\s*年)?\s*\d{1,2}\s*月/.test(rest) ? '' : '流年行运'; // ⑥ 删坐标保时间
        out = out.slice(0, h0.start) + repl + out.slice(h0.start + h0.len);
      }
      if (out !== s) { parts[pi] = out; touched = true; }
    }
    if (touched) { lines[li] = parts.join(''); touchedAny = true; }
  }
  return touchedAny ? lines.join('\n') : text;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E21/R11o ①：宫位语义标签契约锁（House Semantic Label Lock）
// ══════════════════════════════════════════════════════════════════
// 【病根】（2026-10-06 1993-12-15 Adelaide en 年报线上实证，军师终审 88/B+）：
//   「数字保真、文义乱套」的新类别 —— LLM 在 `Nth House of <语义标签>` 形态下
//   把**他宫主题词**随机拼接到**正确的宫位数字**后面：
//     · `Your Sun resides in the 12th House of Partnership`（Partnership 是 7 宫主题）
//     · `2nd House of Home and Roots`（Home/Roots 是 4 宫主题；2 宫=财富/资源）
//   宫位数字 vs SwissEph 全对 ⇒ 数字层真值锁（c12）与全部 13 条 CRITIC 判据空转
//   —— 「第 N 宫叫什么名字」天生在标量判据射程之外（结构性盲区，c12=0 实证）。
// 【治法】军师裁断（2026-10-06）：白名单契约锁，完全遵照 V488d 剪枝哲学 ——
//   **保数字、剪错配标签**：`…in the 12th House of Partnership` → `…in the 12th House`。
// 铁律：
//   ① 仅 en（实证只在 en；zh「第N宫：X」与他语形态无实证 ⇒ 宁漏不改，E14 教训）；
//   ② 打击面 = `Nth House of <大写标签串>`（Title-Case 自然定界：标签以大写词起、
//      仅 and/&/or 连接的后续大写词可并入；小写后缀如 "in your chart" 绝不吞入）；
//   ③ 契约表 `_E21_HOUSE_LABEL_CONTRACT`：12 宫各持主题词表；标签命中**任一**本宫
//      主题词（词边界、忽略大小写）⇒ 合法保留；零命中 ⇒ 错配，剪 ` of <label>`；
//   ④ 宫位数字越界（<1 或 >12）⇒ 弃权不动；主题词意外构造坏正则 ⇒ 弃权不动；
//   ⑤ 幂等：剪后 `House` 后无 `of` ⇒ 不再命中；
//   ⑥ 判据同源：CRITIC c14 与本锁共用同一正则字面量与同一契约表（杜绝双盲）。
const _E21_HOUSE_LABEL_CONTRACT = [
  /* 1st */ ['Self', 'Identity', 'Vitality', 'Appearance', 'Body', 'Self-Image', 'Self-Discovery'],
  /* 2nd */ ['Wealth', 'Money', 'Finances', 'Financial', 'Resources', 'Assets', 'Income', 'Possessions', 'Earnings', 'Value', 'Values', 'Worth', 'Savings'],
  /* 3rd */ ['Communication', 'Learning', 'Siblings', 'Ideas', 'Skills', 'Neighbors', 'Short Trips', 'Information', 'Curiosity', 'Writing'],
  /* 4th */ ['Home', 'Roots', 'Family', 'Foundation', 'Foundations', 'Ancestry', 'Domestic', 'Homeland', 'Upbringing'],
  /* 5th */ ['Creativity', 'Creative', 'Romance', 'Children', 'Pleasure', 'Play', 'Self-Expression', 'Fun', 'Hobbies', 'Passion'],
  /* 6th */ ['Health', 'Work', 'Routine', 'Service', 'Habits', 'Wellness', 'Daily', 'Craft', 'Discipline', 'Well-Being'],
  /* 7th */ ['Partnership', 'Partnerships', 'Marriage', 'Allies', 'Relationships', 'Relationship', 'Commitment', 'Union', 'Significant Other', 'One-on-One'],
  /* 8th */ ['Transformation', 'Intimacy', 'Debts', 'Debt', 'Inheritance', 'Shared Resources', "Other People's Money", 'Depth', 'Crisis', 'Rebirth', 'Joint Finances', 'Merging'],
  /* 9th */ ['Expansion', 'Travel', 'Philosophy', 'Wisdom', 'Beliefs', 'Faith', 'Foreign', 'Higher Learning', 'Higher Education', 'Adventure', 'Worldview', 'Long Journeys'],
  /* 10th */ ['Career', 'Legacy', 'Public Standing', 'Reputation', 'Ambition', 'Public Image', 'Achievement', 'Vocation', 'Status', 'Profession', 'Calling', 'Public Role'],
  /* 11th */ ['Community', 'Networks', 'Friendship', 'Friendships', 'Groups', 'Hopes', 'Wishes', 'Social Circles', 'Collective', 'Causes'],
  /* 12th */ ['Subconscious', 'Unseen', 'Karma', 'Solitude', 'Spirituality', 'Hidden', 'Retreat', 'Inner World', 'Secrets', 'Endings', 'Isolation', 'Dreams', 'Surrender'],
];
// Title-Case 标签串自然定界（E21 铁律②）：连续大写词串（含 and/&/or 连接词）整体并入，
//   小写词（"in your chart"）与标点自然终止 —— 故「Shared Resources」「Career and Public
//   Standing」「the Subconscious」均能完整捕获，不会被截半误剪。
// ⚠️ 撇号必须写成 `\x27`（而非字面 `'`）：否则离线切片器（extract_decls 的字符串感知扫描）
//   会把字符类里的 `'` 误判为字符串起始 ⇒ 顶层声明切片被截坏（V483d 同族天坑）。
const _E21_HOUSE_LABEL_RE = /\b(\d{1,2})(?:st|nd|rd|th)\s+Houses?\s+of\s+((?:the\s+|The\s+)?[A-Z][A-Za-z&\x27-]*(?:\s+(?:(?:and|&|or)\s+)?(?:the\s+|The\s+)?[A-Z][A-Za-z&\x27-]*)*)/g;
function _e21LabelAllowed(label, houseNum) {
  const themes = _E21_HOUSE_LABEL_CONTRACT[houseNum - 1];
  if (!themes) return true;                                   // ④ 越界宫号 ⇒ 弃权（宁漏不改）
  for (const t of themes) {
    let re = null;
    try { re = new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'); } catch (e) { return true; }  // ④ 坏正则天坑兜底
    if (re && re.test(label)) return true;
  }
  return false;
}
// ══════════════════════════════════════════════════════════════════
// 🛡️ E23/R11q ②（2026-10-06）：分隔符式标签（`Nth House, <标签>`）契约剪枝
// ══════════════════════════════════════════════════════════════════
// 【病根】E21 正则要求字面 ` of ` ⇒ 逗号/中点/破折号式天然漏网（s13 收编批测的
//   advisoryProbes 早已把该形态列入「只报不拦」）。13 盘 v523 落库文本实测形态分布：
//     · 真·错配 1 处：`Your natal Sun … occupies the 12th House, Marriage, and Allies`
//       （Marriage/Allies 是 7 宫主题 ⇒ 病根原文「他宫主题词拼到正确宫号后」的逗号形态）
//     · 合法-月段标题 12 处：`### September 2026: Sun in Virgo · 2nd House · The Harvest of Worth`
//       （V487 自由副标题，`The Month of …` 之外的变体）⇒ **绝不能剪**
//     · 合法-星座宫位对 4 处：`the Virgo 2nd House, the Taurus 10th House`
//       （分隔符后是**星座**而非语义标签）⇒ **绝不能剪**
// 【治法】窄触发 = 「标签命中**他宫**契约主题词」才剪（病根的可判定形态），配三重护栏：
//   ① 标题行豁免（行首 `#` ⇒ 不动）② 主题词锚定（零命中主题词 ⇒ 弃权 —— 直接挡掉
//   星座名/行星名等非法标签）③ 本宫主题词 ⇒ 合法保留。
//   幂等：剪后 `House` 后不再有分隔符 ⇒ 二次施加零改动。
//   判据同源：本正则与 `_e21CountHouseLabelMismatch`（CRITIC c14）共用，杜绝双盲。
const _E23_DELIM_LABEL_RE = new RegExp(
  '(\\b(\\d{1,2})(?:st|nd|rd|th)\\s+Houses?)(\\s*[,:：—–·-]\\s+)'
  + '((?:the\\s+|The\\s+)?[A-Z][A-Za-z&\\x27-]*(?:\\s+(?:(?:and|&|or)\\s+)?(?:the\\s+|The\\s+)?[A-Z][A-Za-z&\\x27-]*)*'
  + '(?:\\s*,\\s*(?:(?:and|or)\\s+)?(?:the\\s+|The\\s+)?[A-Z][A-Za-z&\\x27-]*(?:\\s+(?:(?:and|&|or)\\s+)?(?:the\\s+|The\\s+)?[A-Z][A-Za-z&\\x27-]*)*)*)',
  'g');
/** 标签命中哪些宫的契约主题词（返回宫号数组，可空）。判据同源：复用 `_E21_HOUSE_LABEL_CONTRACT` */
function _e23ThemeHouses(label) {
  const hits = [];
  for (let i = 0; i < _E21_HOUSE_LABEL_CONTRACT.length; i++) {
    for (const t of _E21_HOUSE_LABEL_CONTRACT[i]) {
      let re = null;
      try { re = new RegExp('\\b' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'); } catch (e) { continue; }
      if (re && re.test(label)) { hits.push(i + 1); break; }
    }
  }
  return hits;
}
/** 该位置是否位于标题行（行首 `#` 起） —— 月份标题豁免护栏 */
function _e23OnHeadingLine(source, offset) {
  const ls = source.lastIndexOf('\n', offset) + 1;
  return source.slice(ls, offset).trimStart().startsWith('#');
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E24/R11r②（2026-10-06）：**西语（es）**宫位语义标签契约锁
// ══════════════════════════════════════════════════════════════════
// 【病根】E21/E23 的契约锁**仅 en**（`if (lang !== 'en') return text;`）⇒ 西语同形残影无人管。
//   2002-06-21 Ushuaia `lang=es` 落库文本实测三处（用户实测盘，军师亲点）：
//     · `Júpiter … abandona tu 5ª Casa de Hogar y Raíces` （Hogar/Raíces = 4 宫主题 ⇒ 应 4ª）
//     · `Plutón … en tu 10ª Casa de Redes, Amigos y Ganancias`（Redes/Amigos = 11 宫主题 ⇒ 应 11ª；
//        同段下一句又写 `Plutón en la 11ª Casa` ⇒ **同段自相矛盾**，用户一眼可见）
//     · `Saturno … en tu 4ª Casa de Riqueza y Recursos`（Riqueza/Recursos = 2 宫主题 ⇒ 应 2ª）
//   与 en 病根**完全同源**：宫号数字被真值锁改正、语义标签原地不动 ⇒ 标量判据（含判据12）结构性
//   失明（E21 已实证 c12=0）。故必须走**独立白名单契约 + 独立剪枝**。
// 【治法】同 E21 哲学（V488d 剪枝）：**保数字、剪错配标签**
//        `en tu 5ª Casa de Hogar y Raíces` → `en tu 5ª Casa`
//   三重护栏（同 E23 ②）：
//     ① 标题行豁免（月标题 `### … Casa N de …` 是**合法**标签，绝不能剪）；
//     ② 主题词锚定（零命中 ⇒ 弃权 —— 直接挡掉星座名/行星名/人名等非法标签）；
//     ③ 本宫主题词 ⇒ 合法保留。
//   ④ 窄形态（只在 `Nª/No Casa de <标签>` 上动；`Casa 5 de …`／拼写式序数一律弃权 —— 宁漏不改）。
//   ⑤ 幂等：剪后 `Casa` 后无 ` de ` ⇒ 二次施加零改动。
//   ⑥ 判据同源：CRITIC c14 与批测 `labelMismatch` 指标均回调 `_e21CountHouseLabelMismatch`（同一正则 + 同一表）。
//   ⚠️ 西语标签**不是** Title-Case（`Hogar y Raíces` 只有首词大写）⇒ 定界改用
//      「首词大写 + 后续词/连接词（y|e|o|u|de|del|la|el|los|las）| 逗号后须接大写词」，
//      遇 `.`/`;`/`:`/`(`/`)` 或**小写非连接词**即自然终止。
const _E24_ES_HOUSE_CONTRACT = [
  /* 1ª */ ['Identidad', 'Yo', 'Apariencia', 'Cuerpo', 'Vitalidad', 'Imagen', 'Personalidad', 'Autoconocimiento', 'Nuevos Comienzos', 'Aparicencia', 'Presencia'],
  /* 2ª */ ['Riqueza', 'Recursos', 'Dinero', 'Finanzas', 'Bienes', 'Ingresos', 'Posesiones', 'Valores', 'Autoestima', 'Economía', 'Ganancias', 'Patrimonio', 'Ahorros'],
  /* 3ª */ ['Comunicación', 'Aprendizaje', 'Hermanos', 'Ideas', 'Habilidades', 'Vecinos', 'Información', 'Curiosidad', 'Escritura', 'Estudios', 'Palabra'],
  /* 4ª */ ['Hogar', 'Raíces', 'Familia', 'Fundación', 'Fundaciones', 'Base', 'Bases', 'Ancestros', 'Doméstico', 'Origen', 'Orígenes', 'Vida Doméstica', 'Tierra', 'Linaje'],
  /* 5ª */ ['Creatividad', 'Romance', 'Hijos', 'Placer', 'Juego', 'Autoexpresión', 'Diversión', 'Pasatiempos', 'Pasión', 'Alegría', 'Talento'],
  /* 6ª */ ['Trabajo', 'Rutina', 'Salud', 'Servicio', 'Hábitos', 'Bienestar', 'Cotidiano', 'Oficio', 'Disciplina', 'Labor', 'Cuerpo Físico'],
  /* 7ª */ ['Asociaciones', 'Asociación', 'Matrimonio', 'Alianzas', 'Alianza', 'Relaciones', 'Relación', 'Compromiso', 'Unión', 'Socios', 'Pareja', 'Contratos', 'Sociedades'],
  /* 8ª */ ['Transformación', 'Intimidad', 'Deudas', 'Deuda', 'Herencia', 'Recursos Compartidos', 'Profundidad', 'Crisis', 'Renacimiento', 'Finanzas Compartidas', 'Poder', 'Muerte', 'Sombra'],
  /* 9ª */ ['Expansión', 'Viajes', 'Filosofía', 'Sabiduría', 'Creencias', 'Fe', 'Extranjero', 'Educación Superior', 'Aventura', 'Cosmovisión', 'Viajes Largos', 'Filosofía Superior', 'Horizontes'],
  /* 10ª */ ['Carrera', 'Legado', 'Reputación', 'Ambición', 'Imagen Pública', 'Logros', 'Vocación', 'Estatus', 'Profesión', 'Llamado', 'Rol Público', 'Éxito', 'Estatus Público', 'Autoridad', 'Destino'],
  /* 11ª */ ['Comunidad', 'Redes', 'Amistad', 'Amigos', 'Amistades', 'Grupos', 'Esperanzas', 'Deseos', 'Círculos Sociales', 'Colectivo', 'Causas', 'Ganancias', 'Contactos'],
  /* 12ª */ ['Subconsciente', 'Inconsciente', 'Oculto', 'Ocultos', 'Karma', 'Soledad', 'Espiritualidad', 'Retiro', 'Mundo Interior', 'Secretos', 'Finales', 'Aislamiento', 'Sueños', 'Entrega', 'Asuntos Ocultos', 'Misticismo'],
];
const _E24_ES_LBL_WORD = '[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+';
const _E24_ES_LBL_CAP = '[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑÜáéíóúñü]*';
const _E24_ES_LBL_CONN = '(?:y|e|o|u|de|del|la|el|los|las|and|&|or|en)';
// 窄触发：`<Nª|No> Casa(s) de <标签>`（`de` 与标签之间允许冠词；标签定界见文件头注释）
// 🛡️ E24④/P5：标签**首词**由 `_E24_ES_LBL_CAP`（首字母大写）放宽为 `_E24_ES_LBL_WORD` ——
//   真实稿标签多为小写（`la casa de la creatividad`）。实测在 4 份真实语料上**零增量**
//   （命中 9/15/0/0 与剪除数**完全不变**）⇒ 免费放宽、无回归风险、仅作前向兜底。
const _E24_ES_HOUSE_RE = new RegExp(
  '(\\b(\\d{1,2})\\s*[ªº]\\s*Casas?\\s+de\\s+)'
  + '((?:(?:la|el|los|las)\\s+)?' + _E24_ES_LBL_WORD
  + '(?:\\s+' + _E24_ES_LBL_CONN + '\\s+' + _E24_ES_LBL_WORD
  + '|\\s+' + _E24_ES_LBL_CAP
  + '|,\\s+(?:' + _E24_ES_LBL_CONN + '\\s+)?' + _E24_ES_LBL_CAP
  + '){0,8})',
  'g');
// ── 🛡️ E24④/P5（2026-10-06）：**同位语式**契约锁补三式（es）──
// 【病根】式1 硬性要求 `Nª/No Casa de <标签>`（**名词后置** + 序数缩写 + 无逗号），
//   而线上主流形态是**名词前置**的逗号同位语：`Casa N, la Casa de <标签>`（靶盘 27 处）、
//   插入语式 `Casa N de <插入语>, la Casa de <标签>`（靶盘 1 处）、数字缩写式
//   `Nª Casa, la Casa de <标签>`（s3 15 处）⇒ 三种主流形态**全数射程外**。
//   实测铁证（同语种两盘形态**完全相反**）：s3 命中 15 处（含 1 处真错配）/ 靶盘命中 0 处、
//   射程外 28 处（3 处真错配）⇒ 现锁是**概率性覆盖**（命中与否取决于 LLM 采样），
//   必须补式做到**结构性覆盖**。英文侧有第二遍 `_E23_DELIM_LABEL_RE` 兜分隔符式，
//   **es 侧结构性缺失**（本次补齐）。
// ⚠️ 式6（`Nª Casa, <gloss>`）**并非可选**：s3 `Plutón … en tu 10ª Casa, la Casa de las
//   Redes y las Ganancias`（真值 Pluto=H10 ⇒ 数字对、标签错）**只有式6 能咬合**，
//   式1（需 ` de `）与式4（需 `Casa` 在前）双双漏网 ⇒ 不加式6 则 s3 残留真错配（假绿）。
// 【定界纪律（P5 首版「一刀切禁逗号」→ E24④/P5b 修正为「受限续段」）】首版允许 `,` 无限制连接
//   ⇒ 实测吞掉 `, según la rueda de casas iguales desde tu Ascendente Piscis` 等后续小句（过度剪枝）；
//   遂改为**禁逗号**。但 v528 线上靶盘复跑暴露**反向代价**：真实标签本身含逗号
//   （`la creatividad, el romance y los hijos`）⇒ 禁逗号只咬第一段、强剪会留碎片。
//   终局定界 = `_E24_ES_LBL`（禁逗号本体）+ `_E24_ES_LBL_TAIL`（**白名单首词**的受限续段）见下。
// 【保形写回】DELIM/NABBR 剪 `, <标签>` 只留数字；INTERJ **保留** `de tu carta natal` 插入语。
// 【幂等】剪后 `Casa` 后不再有 `,`/` de <标签>` ⇒ 二次施加零改动（离线+线上实测已验）。
// 【判据同源】三式与 `_e21CountHouseLabelMismatch`（CRITIC c14 / 批测 `labelMismatch`）**共用**。
const _E24_ES_LBL = '(?:' + _E24_ES_LBL_WORD + '(?:\\s+(?:' + _E24_ES_LBL_CONN + '\\s+)?' + _E24_ES_LBL_WORD + '){0,8})';
// ── 🛡️ E24④/P5b（2026-10-06）：gloss **头部同义扩面** + **逗号续段**定界 ──
// 【新缺陷 · 线上靶盘 v528 实证（3 处真错配）】数值真值锁把 LLM 的**错宫号改写正确**
//   （本命 Júpiter 5→9 / Saturno 2→5 / Plutón 11→10，引擎真值 = H9/H5/H10 已核对），
//   而**与错宫号自洽的同位语标签原地不动** ⇒ 落库 `en la Casa 9, el hogar de la creatividad,
//   el romance y los hijos`（数字对、标签是 5 宫主题）。P5 首版三式漏网真因有二：
//   ① **同义词**：真实稿 17/17 用 `el hogar de`，**没有一处** `la casa de` ⇒ 头部写死 `casa` 即全盲；
//   ② **标签内含逗号**：`la creatividad, el romance y los hijos` —— 一刀切禁逗号只咬到第一段，
//      强行剪会留下 `, el romance y los hijos` **碎片**（比不剪更差）⇒ 必须整体吃掉。
// 【续段定界纪律（取代一刀切禁逗号）】续段仅在**首词为连接词或冠词**
//   （`y|e|o|u|el|la|los|las|lo`，`lo` 为中性冠词 —— 靶盘实测 `el hogar del subconsciente,
//   lo oculto y el karma` 续段以 `lo` 起头，漏掉它即留碎片）时并入标签；`es`/`según`/`esta`/`pero`
//   等**小句起始词**自然终止 ⇒ 既吃全标签、又不吞后续小句。冠词后再加**关系词护栏**
//   `(?!que|cual|cuales|quien|quienes)` —— 挡掉 `, lo que indica que…` 这类关系从句被误并。
//   回归守卫见闸门⑰（原 `, según la rueda de casas iguales desde tu Ascendente Piscis` 过度剪枝）。
//   段数上限 3、每段词数上限 6 ⇒ 总长有界，杜绝贪婪失控。
const _E24_ES_LBL_TAIL = '(?:\\s*,\\s*(?:(?:y|e|o|u)\\s+)?(?:el|la|los|las|lo)\\s+'
  + '(?!(?:que|cual|cuales|quien|quienes)\\b)' + _E24_ES_LBL_WORD
  + '(?:\\s+(?:' + _E24_ES_LBL_CONN + '\\s+)?' + _E24_ES_LBL_WORD + '){0,6}){0,3}';
/** 同位语核心：`(la|el|los|las) (casa|hogar) (de(l|la|los|las)?)? <标签>`（标签可含受限逗号续段） */
const _E24_ES_GLOSS = '((?:la|el|los|las)\\s+(?:casa|hogar)\\s+(?:de(?:l|la|los|las)?\\s+)?' + _E24_ES_LBL + _E24_ES_LBL_TAIL + ')';
// 式4：逗号同位语 `Casa N, (la Casa de|el hogar de) <标签>`（靶盘 v528 实测 17/17 用 `el hogar de`）
const _E24_ES_DELIM_RE = new RegExp('(\\bCasa\\s+(\\d{1,2}))\\s*[,:]\\s*' + _E24_ES_GLOSS, 'gi');
// 式5：插入语式 `Casa N de <插入语>, (la Casa de|el hogar de) <标签>`（保形：保留插入语）
const _E24_ES_INTERJ_RE = new RegExp('(\\bCasa\\s+(\\d{1,2}))\\s+de\\s+([^.,;\\n]{0,40}),\\s*' + _E24_ES_GLOSS, 'gi');
// 式6：数字缩写同位语 `Nª Casa, (la Casa de|el hogar de) <标签>`（s3 主流；式1/式4 均不覆盖）
const _E24_ES_NABBR_RE = new RegExp('(\\b(\\d{1,2})\\s*[ªº]\\s*Casas?)\\s*[,:]\\s*' + _E24_ES_GLOSS, 'gi');
// ── 🛡️ E24④/P5b：主题判定前**必须先剥离 gloss 头部** ──
// 【实测铁证（本次踩中）】`_e24EsThemeHouses` 是**子串**匹配，而头部 `hogar` 恰好命中 4 宫契约词
//   `Hogar` ⇒ 任何 `el hogar de …` 都被污染成「含 4 宫主题」⇒ ① `Casa 5, el hogar de tu Júpiter
//   en Leo`（**关系性短语、非主题标签**，本应弃权）被误判为错配而**误剪**；② 计数随之虚增。
//   治本：主题判定只喂**头部之后**的标签本体（头部是定界脚手架，不是标签内容）。
const _E24_ES_GLOSS_HEAD_RE = /^\s*(?:la|el|los|las)\s+(?:casa|hogar)\s+(?:de(?:l|la|los|las)?\s+)?/i;
function _e24EsGlossLabel(gloss) {
  const s = String(gloss || '');
  const m = s.match(_E24_ES_GLOSS_HEAD_RE);
  return m ? s.slice(m[0].length) : s;
}
// ── 🛡️ E24④/P8（2026-10-06）：**越南语（vi）**宫位语义标签契约锁 ──
// 【病根】es/en 有契约锁，**vi 无** ⇒ 与 P5 同族（`_viPatchZone` 会纠 `Nhà N` 的**数字**，
//   但语义标签原地不动）。线上实测形态（s5 阿克拉）：`Nhà N, ngôi nhà của <标签>` 共 12 处。
//   ⚠️ 现存稿 12/12 **自洽**（数字与标签一致）⇒ 本锁为**防患于未然**（军师令：防患于未然），
//   绝不假设「发现即有错」；闸门以**注入缺陷自测**证明其有牙（否则＝无牙假防线）。
// 【治法】同 P5 哲学：**保数字、剪错配标签** + 四重护栏（① 标题行豁免 ② 主题词锚定
//   ③ 本宫主题 ⇒ 保留 ④ **头部锚定**）。
// ⚠️ 与 es 的**关键差异**：越语标签**内部含逗号**
//   （`tiềm thức, nghiệp quả, và những gì ẩn giấu`）⇒ **必须允许逗号**，改以「句末标点」定界。
//   但放开逗号 ⇒ 存在吞并后续小句的风险（`…, và bạn cần quan tâm đến gia đình`）⇒
//   加**头部锚定**：标签**前 2 个词**必须命中主题词，否则弃权（宁漏不改）。
// ⚠️ 定界词类必须用 `\p{L}`（**不可用 `[^A-Za-z]`**）：越语变音字母多在 `\u1E00-\u1EFF`
//   （`ồ`/`ự`/`ế`…）⇒ ASCII 负类会把变音字母当「非字母」，在**词内制造虚假词边界**。
const _E24_VI_HOUSE_CONTRACT = [
  /* 1 */ ['bản ngã', 'sức sống', 'bản sắc', 'sự khởi đầu', 'diện mạo', 'cái tôi', 'sự hiện diện'],
  /* 2 */ ['tài sản', 'tiền bạc', 'nguồn lực', 'giá trị vật chất', 'thu nhập', 'giá trị bản thân', 'tài chính', 'thịnh vượng'],
  /* 3 */ ['giao tiếp', 'học hỏi', 'học tập', 'anh chị em', 'chuyến đi ngắn', 'thông tin', 'ngôn từ'],
  /* 4 */ ['gia đình', 'nguồn cội', 'nhà cửa', 'nền tảng cảm xúc', 'tổ ấm', 'cội nguồn', 'nền tảng'],
  /* 5 */ ['sáng tạo', 'tình yêu', 'trẻ em', 'con cái', 'niềm vui', 'lãng mạn', 'đam mê', 'đầu tư'],
  /* 6 */ ['công việc hàng ngày', 'công việc', 'sức khỏe', 'thói quen', 'phục vụ', 'kỷ luật', 'thường nhật'],
  /* 7 */ ['đối tác', 'hôn nhân', 'hợp tác', 'bạn đời', 'cam kết', 'quan hệ đối tác'],
  /* 8 */ ['sự chuyển hóa', 'cái chết', 'tái sinh', 'nợ nần', 'nguồn lực chung', 'bí mật', 'chuyển hóa'],
  /* 9 */ ['sự mở rộng', 'du lịch', 'triết học', 'giáo dục cao cấp', 'tầm nhìn', 'niềm tin', 'mở rộng'],
  /* 10 */ ['sự nghiệp', 'danh tiếng', 'địa vị xã hội', 'thành tựu công khai', 'danh vọng công chúng', 'uy tín', 'sự công nhận'],
  /* 11 */ ['cộng đồng', 'bạn bè', 'mạng lưới xã hội', 'lợi ích tập thể', 'mạng lưới', 'nhóm'],
  /* 12 */ ['tiềm thức', 'nghiệp quả', 'ẩn giấu', 'sự chuyển hóa tâm linh', 'tâm linh', 'cô đơn', 'vô thức'],
];
const _E24_VI_TOKEN = '[\\p{L}\\p{M}]+';
const _E24_VI_LBL = '(?:' + _E24_VI_TOKEN + '(?:[ ,]+(?:và\\s+)?' + _E24_VI_TOKEN + '){0,14})';
// ⚠️ 捕获组 ③ **只含标签本体**（`ngôi nhà của ` 前缀置于组外）—— 头部锚定（前 2 词）必须落在
//   标签上，若把 `ngôi nhà` 也算进去 ⇒ 头部恒为「ngôi nhà」⇒ 零命中 ⇒ **锁整体空转**（实测踩过）。
const _E24_VI_GLOSS_RE = new RegExp('(\\bNhà\\s+(\\d{1,2}))\\s*,\\s*ngôi\\s+nhà\\s+của\\s+(' + _E24_VI_LBL + ')', 'giu');
/** 越语标签命中哪些宫的契约主题词（`\p{L}` 边界，杜绝变音字母造成的虚假词边界） */
function _e24ViThemeHouses(label) {
  const hits = [];
  for (let i = 0; i < _E24_VI_HOUSE_CONTRACT.length; i++) {
    for (const t of _E24_VI_HOUSE_CONTRACT[i]) {
      let re = null;
      try { re = new RegExp('(?<!\\p{L})' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?!\\p{L})', 'iu'); } catch (e) { continue; }  // 坏正则天坑兜底
      if (re && re.test(label)) { hits.push(i + 1); break; }
    }
  }
  return hits;
}
/** 标签命中哪些宫的契约主题词（返回宫号数组，可空）。判据同源：复用 `_E24_ES_HOUSE_CONTRACT` */
function _e24EsThemeHouses(label) {
  const hits = [];
  for (let i = 0; i < _E24_ES_HOUSE_CONTRACT.length; i++) {
    for (const t of _E24_ES_HOUSE_CONTRACT[i]) {
      let re = null;
      try { re = new RegExp('(?:^|[^A-Za-zÁÉÍÓÚÑÜáéíóúñü])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:$|[^A-Za-zÁÉÍÓÚÑÜáéíóúñü])', 'i'); } catch (e) { continue; }  // 坏正则天坑兜底
      if (re && re.test(label)) { hits.push(i + 1); break; }
    }
  }
  return hits;
}

function stripHouseSemanticLabelMismatch(text, lang, reportType) {
  if (lang === 'es') {
    // 🛡️ E24/R11r②：西语分支（同哲学、独立契约表；英文形态在 es 文本中不存在，反之亦然）
    if (!text || typeof text !== 'string') return text;
    let prunedEs = 0;
    const outEs = text.replace(_E24_ES_HOUSE_RE, (m0, prefix, num, label, offset) => {
      const n = Number(num);
      if (!(n >= 1 && n <= 12)) return m0;                     // 越界弃权
      if (_e23OnHeadingLine(text, offset)) return m0;          // ① 标题行豁免（月标题合法）
      const themes = _e24EsThemeHouses(label);
      if (themes.length === 0) return m0;                      // ② 主题词锚定（挡星座/行星名）
      if (themes.indexOf(n) !== -1) return m0;                 // ③ 本宫主题 ⇒ 合法保留
      prunedEs++;
      const cut = m0.indexOf(' de ');                          // 保数字：剪 ` de <标签>`
      return cut > 0 ? m0.slice(0, cut) : prefix.trimEnd();
    });
    // ── 🛡️ E24④/P5：同位语三式（逗号式 / 插入语式 / 数字缩写式）──
    //   与式1 同哲学、同契约表、同三重护栏（标题行豁免／主题词锚定／本宫保留）。
    let prunedGloss = 0;
    let outEs2 = outEs.replace(_E24_ES_DELIM_RE, (m0, housePart, num, label, offset) => {
      const n = Number(num);
      if (!(n >= 1 && n <= 12)) return m0;                     // 越界弃权
      if (_e23OnHeadingLine(outEs, offset)) return m0;         // ① 标题行豁免
      const themes = _e24EsThemeHouses(_e24EsGlossLabel(label));
      if (themes.length === 0) return m0;                      // ② 主题词锚定
      if (themes.indexOf(n) !== -1) return m0;                 // ③ 本宫主题 ⇒ 合法保留
      prunedGloss++;
      return housePart;                                        // 剪 `, <标签>` 保数字
    });
    outEs2 = outEs2.replace(_E24_ES_INTERJ_RE, (m0, housePart, num, interj, label, offset) => {
      const n = Number(num);
      if (!(n >= 1 && n <= 12)) return m0;
      if (_e23OnHeadingLine(outEs2, offset)) return m0;
      const themes = _e24EsThemeHouses(_e24EsGlossLabel(label));
      if (themes.length === 0) return m0;
      if (themes.indexOf(n) !== -1) return m0;
      prunedGloss++;
      return housePart + ' de ' + interj.trim();               // 剪 `, <标签>` 但**保留插入语**
    });
    outEs2 = outEs2.replace(_E24_ES_NABBR_RE, (m0, housePart, num, label, offset) => {
      const n = Number(num);
      if (!(n >= 1 && n <= 12)) return m0;
      if (_e23OnHeadingLine(outEs2, offset)) return m0;
      const themes = _e24EsThemeHouses(_e24EsGlossLabel(label));
      if (themes.length === 0) return m0;
      if (themes.indexOf(n) !== -1) return m0;
      prunedGloss++;
      return housePart;                                        // 剪 `, <标签>` 保数字
    });
    if (prunedEs > 0 || prunedGloss > 0) {
      console.log(`[E24/R11r] ${lang}/${reportType || ''} 西语宫位语义标签契约锁: 剪除错配标签 ${prunedEs + prunedGloss} 处（式1 ${prunedEs} / 同位语 ${prunedGloss}）`);
    }
    return outEs2;
  }
  if (lang === 'vi') {
    // 🛡️ E24④/P8：越南语分支（独立契约表 + `\p{L}` 词边界；允许标签内含逗号，头部锚定兜底）
    if (!text || typeof text !== 'string') return text;
    let prunedVi = 0;
    const outVi = text.replace(_E24_VI_GLOSS_RE, (m0, housePart, num, label, offset) => {
      const n = Number(num);
      if (!(n >= 1 && n <= 12)) return m0;                     // 越界弃权
      if (_e23OnHeadingLine(text, offset)) return m0;          // ① 标题行豁免（月标题合法）
      const head = label.split(/[ ,]+/).slice(0, 2).join(' '); // ④ 头部锚定（前 2 词）
      if (_e24ViThemeHouses(head).length === 0) return m0;     // 放开逗号的代价：非主题开头一律弃权
      const themes = _e24ViThemeHouses(label);
      if (themes.length === 0) return m0;                      // ② 主题词锚定
      if (themes.indexOf(n) !== -1) return m0;                 // ③ 本宫主题 ⇒ 合法保留
      prunedVi++;
      return housePart;                                        // 剪 `, ngôi nhà của <标签>` 保数字
    });
    if (prunedVi > 0) console.log(`[E24/R11r] ${lang}/${reportType || ''} 越语宫位语义标签契约锁: 剪除错配标签 ${prunedVi} 处`);
    return outVi;
  }
  if (lang !== 'en') return text;                             // ① 仅 en（旧契约锁语义不变）
  if (!text || typeof text !== 'string') return text;
  let pruned = 0;
  const out = text.replace(_E21_HOUSE_LABEL_RE, (m0, num, label) => {
    const n = Number(num);
    if (!(n >= 1 && n <= 12)) return m0;                      // ④ 越界弃权
    const bare = label.replace(/^[Tt]he\s+/, '');
    if (_e21LabelAllowed(bare, n)) return m0;                 // ③ 契约内 ⇒ 保留
    pruned++;
    return m0.slice(0, m0.indexOf(' of '));                   // 剪 ` of <label>` 保数字（V488d 哲学）
  });
  if (pruned > 0) console.log(`[E21/R11o] ${lang}/${reportType || ''} 宫位语义标签契约锁: 剪除错配标签 ${pruned} 处`);
  // 🛡️ E23/R11q ②：第二遍 —— 分隔符式（`Nth House, <标签>`）
  let pruned2 = 0;
  const out2 = out.replace(_E23_DELIM_LABEL_RE, (m0, housePart, num, _sep, label, offset) => {
    const n = Number(num);
    if (!(n >= 1 && n <= 12)) return m0;                      // 越界弃权
    if (_e23OnHeadingLine(out, offset)) return m0;            // ① 标题行豁免（月份标题）
    const themes = _e23ThemeHouses(label);
    if (themes.length === 0) return m0;                       // ② 主题词锚定（挡星座/行星名）
    if (themes.indexOf(n) !== -1) return m0;                  // ③ 本宫主题 ⇒ 合法
    pruned2++;
    return housePart;                                        // 剪 `, <标签>` 保数字
  });
  if (pruned2 > 0) console.log(`[E23/R11q] ${lang}/${reportType || ''} 分隔符式标签契约剪枝: 剪除错配 ${pruned2} 处`);
  return out2;
}
function _e21CountHouseLabelMismatch(text, lang) {
  // 🛡️ E23/R11q ②：语言门控（可选传参）—— 与生产链**严格同源**：`stripHouseSemanticLabelMismatch`
  //   仅 en 生效、CRITIC c14 亦仅 en 运行 ⇒ 非 en 文本的计数必须为 0，否则批测工具会
  //   对「锁根本不管的语种」判红（假红）。不传 lang ⇒ 保持历史行为（全量计数，兼容旧调用）。
  // 🛡️ E24/R11r②：门控扩 **es** —— 西语契约锁已上线（见 `_E24_ES_HOUSE_CONTRACT`），
  //   故 es 必须走西语形态计数（en 形态在 es 文本中不存在 ⇒ 互斥，无双重计数）。
  // 🛡️ E24④/R11t：门控再扩 **vi** —— 越语契约锁已上线（见 `_E24_VI_HOUSE_CONTRACT`）；
  //   批测 `sweep-online.mjs::labelMismatch` **直接回调本函数**且 `ok` 要求其为 0
  //   ⇒ 门控漏 vi 会让 vi 盘永远报 0 = 假绿。**门控必须与锁的生效语种逐一对应**。
  const L = lang || '';
  if (L && L !== 'en' && L !== 'es' && L !== 'vi') return 0;
  if (!text || typeof text !== 'string') return 0;
  let n = 0;
  if (L === 'es') {
    // ── 西语形态：`Nª Casa de <标签>`（与 `stripHouseSemanticLabelMismatch` 西语分支同判据） ──
    for (const m of text.matchAll(new RegExp(_E24_ES_HOUSE_RE.source, 'g'))) {
      const num = Number(m[2]);
      if (!(num >= 1 && num <= 12)) continue;
      if (_e23OnHeadingLine(text, m.index)) continue;
      const themes = _e24EsThemeHouses(m[3]);
      if (themes.length > 0 && themes.indexOf(num) === -1) n++;
    }
    // ── 🛡️ E24④/P5：同位语三式**同源计数**（与锁的三遍**逐一对应**，否则批测仍假绿）──
    //   ⚠️ E24④/P5b：主题判定前同样**必须** `_e24EsGlossLabel` 剥离头部 —— 否则 `hogar` 命中 4 宫
    //   契约词 `Hogar` ⇒ 计数虚增（与锁同步失效），正好又是「判据同源」纪律的同一枚硬币。
    for (const m of text.matchAll(new RegExp(_E24_ES_DELIM_RE.source, _E24_ES_DELIM_RE.flags))) {
      const num = Number(m[2]);
      if (!(num >= 1 && num <= 12)) continue;
      if (_e23OnHeadingLine(text, m.index)) continue;
      const themes = _e24EsThemeHouses(_e24EsGlossLabel(m[3]));
      if (themes.length > 0 && themes.indexOf(num) === -1) n++;
    }
    for (const m of text.matchAll(new RegExp(_E24_ES_INTERJ_RE.source, _E24_ES_INTERJ_RE.flags))) {
      const num = Number(m[2]);
      if (!(num >= 1 && num <= 12)) continue;
      if (_e23OnHeadingLine(text, m.index)) continue;
      const themes = _e24EsThemeHouses(_e24EsGlossLabel(m[4]));
      if (themes.length > 0 && themes.indexOf(num) === -1) n++;
    }
    for (const m of text.matchAll(new RegExp(_E24_ES_NABBR_RE.source, _E24_ES_NABBR_RE.flags))) {
      const num = Number(m[2]);
      if (!(num >= 1 && num <= 12)) continue;
      if (_e23OnHeadingLine(text, m.index)) continue;
      const themes = _e24EsThemeHouses(_e24EsGlossLabel(m[3]));
      if (themes.length > 0 && themes.indexOf(num) === -1) n++;
    }
    return n;
  }
  if (L === 'vi') {
    // ── 🛡️ E24④/P8：越南语形态 `Nhà N, ngôi nhà của <标签>`（与 vi 分支同判据，含头部锚定）──
    for (const m of text.matchAll(new RegExp(_E24_VI_GLOSS_RE.source, _E24_VI_GLOSS_RE.flags))) {
      const num = Number(m[2]);
      if (!(num >= 1 && num <= 12)) continue;
      if (_e23OnHeadingLine(text, m.index)) continue;
      const head = m[3].split(/[ ,]+/).slice(0, 2).join(' ');
      if (_e24ViThemeHouses(head).length === 0) continue;      // 头部锚定（同锁）
      const themes = _e24ViThemeHouses(m[3]);
      if (themes.length > 0 && themes.indexOf(num) === -1) n++;
    }
    return n;
  }
  for (const m of text.matchAll(_E21_HOUSE_LABEL_RE)) {
    const num = Number(m[1]);
    if (!(num >= 1 && num <= 12)) continue;
    const bare = m[2].replace(/^[Tt]he\s+/, '');
    if (!_e21LabelAllowed(bare, num)) n++;
  }
  // 🛡️ E23/R11q ②：分隔符式错配**同源计数**（与 stripHouseSemanticLabelMismatch 第二遍同判据）
  for (const m of text.matchAll(new RegExp(_E23_DELIM_LABEL_RE.source, 'g'))) {
    const num = Number(m[2]);
    if (!(num >= 1 && num <= 12)) continue;
    if (_e23OnHeadingLine(text, m.index)) continue;
    const themes = _e23ThemeHouses(m[4]);
    if (themes.length > 0 && themes.indexOf(num) === -1) n++;
  }
  return n;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E23/R11q ②（2026-10-06）：`Nth House` **序数后缀笔误**归一
// ══════════════════════════════════════════════════════════════════
// 证据（13 盘 v523 落库文本扫描）：
//   · `Your Saturn in Aquarius in the 2th House is the karmic weight of your career.` （2th→2nd）
//   · `The career path of the Jupiter in Cancer 12st House involves expansion…`     （12st→12th）
// E13 的拼写式序数锁只管 `in the seventh house`；「数字 + 错后缀」从未被覆盖 = 形态卫生缺口。
// 铁律：① 仅改 `数字+后缀+\s+Houses?` 三连形态，绝不碰散文序数（`1st place` 不动）；
//   ② 宫号越界（<1 或 >12）⇒ 弃权；③ 后缀已正确 ⇒ 零改动（幂等）；④ 语言中立。
// 判据同源：本正则被 `fixHouseOrdinalSuffix`（归一）与 `_e23CountHouseOrdinalTypos`（计数/CRITIC 源）
//   共用同一字面量，杜绝「归一漏了、批测看不见」双盲。
const _E23_HOUSE_ORDINAL_RE = /\b(\d{1,2})(st|nd|rd|th)(\s+Houses?\b)/g;
/** 英文序数后缀真值（`1st/2nd/3rd/…/11th/12th/13th` 的例外规则） */
function _e23WantOrdinalSuffix(n) {
  return (n % 10 === 1 && n % 100 !== 11) ? 'st'
    : (n % 10 === 2 && n % 100 !== 12) ? 'nd'
      : (n % 10 === 3 && n % 100 !== 13) ? 'rd' : 'th';
}
function fixHouseOrdinalSuffix(text) {
  if (!text || typeof text !== 'string') return text;
  let fixed = 0;
  const out = text.replace(new RegExp(_E23_HOUSE_ORDINAL_RE.source, 'g'), (m0, num, suf, tail) => {
    const n = Number(num);
    if (!(n >= 1 && n <= 12)) return m0;
    const want = _e23WantOrdinalSuffix(n);
    if (suf === want) return m0;
    fixed++;
    return num + want + tail;
  });
  if (fixed > 0) console.log(`[E23/R11q] 宫位序数后缀归一: 修正 ${fixed} 处`);
  return out;
}
/** 序数后缀笔误计数（与 `fixHouseOrdinalSuffix` 同源正则 —— 供批测工具做**硬判据**） */
function _e23CountHouseOrdinalTypos(text) {
  if (!text || typeof text !== 'string') return 0;
  let n = 0;
  for (const m of text.matchAll(new RegExp(_E23_HOUSE_ORDINAL_RE.source, 'g'))) {
    const d = Number(m[1]);
    if (!(d >= 1 && d <= 12)) continue;
    if (m[2] !== _e23WantOrdinalSuffix(d)) n++;
  }
  return n;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E17/R11j ①：年报「上升锚点」真值锁（窄锁，**不复用**整条旧锁）
// ══════════════════════════════════════════════════════════════════
// 【病根】（2026-10-05 v516 特罗姆瑟盘 zh 年报线上实证）
//   ① `lockNatalAnchorRole`（V444/V453 本命锚点锁）首行 `if (reportType === 'yearly') return text;`
//      （V478-guard，为治「流年句被强改本命值」而**整体关闭**）⇒ 年报内「上升X座」零纠错；
//   ② 替代防线 `_v432LockNatal` 只管 **10 行星**、**不含「上升」锚点**；
//   ③ `_v492cLockAxisSalutation` 只作用于**前导段**（月段刻意不碰，防「太阳返照上升」被强改）；
//   ④ CRITIC 12 条判据**无一条管上升** ⇒ 写错既无人纠、也无人拦，直接写库。
//   实测该盘一稿同时出现 **3 个不同上升**：报头「上升射手座」(真值) + 「你的上升金牛座」
//   + 「对于上升水瓶座而言」⇒ 同篇自相矛盾（军师终审 78 分主因）。
//
// 【治法】军师裁决：新建**窄锁**，绝不复用整条旧锁（避免重演 V478 流年误伤）。铁律：
//   ① 只换**星座 token**，绝不改措辞/语序/标点（保形写回，幂等：值==真值原样返回）；
//   ② 真值缺失（无出生时间 ⇒ meta.rising_sign 空）⇒ 整锁跳过，绝不编造（V102s 纪律）；
//   ③ 捕获 token **必须命中星座词表**，否则不算「上升X座」（如「你的上升星座与命宫」的
//      「与命宫」⇒ 不动）—— 这条同时是「泛指句零误伤」的护栏；
//   ④ **流年豁免**：匹配点前窗 24 字含流年标记（流年/本年/次限/返照 / transit/transiting/
//      progressed/solar return …）⇒ 跳过（该处「上升」可能指太阳返照上升，强改=主动污染）；
//   ⑤ 作用域 = **全文**（yearly 专属），与 `_v492cLockAxisSalutation`（仅前导段）互补。
const _V517_TRANSIT_MARK = {
  zh: /流年|本年|本月|当月|次限|返照|行运|未来/,
  en: /\b(?:transit(?:ing)?|progressed|solar\s+return|this\s+month|current\s+month|annual\s+profection)\b/i,
  es: /\b(?:tr[aá]nsito|progresad|revoluci[oó]n\s+solar|este\s+mes)\b/i,
  fr: /\b(?:transit|progression|r[eé]volution\s+solaire|ce\s+mois)\b/i,
  th: /จร|เดือนนี้|ปัจจุบัน/,
  vi: /qu[aá]\s*độ|tiến\s*triển|th[aá]ng\s*n[aà]y|hiện\s*tại/i,
};

// 各语「上升 + 星座」句式（仅认明确轴点词；捕获组恒为**星座 token**）
// 🛡️ E20/R11n ②（2026-10-06 s1 zh 重生成实证「你的天秤座上升天生渴望扩张」，真值 rising=Sagittarius）：
//   旧正则只认**前置形态**「上升X座」，**后置形态**「X座上升 / X座命宫」整锁漏接 ⇒
//   错值直达落库、CRITIC 判据12 告警。补后置分支（双捕获组，锁体取 g1||g2）：
//   · zh 后置：`<星座>(的)?(上升|命宫)`，且轴点词后禁跟「期/段/势」（防「双子座上升期」类
//     非轴点用法误伤）；
//   · en 后置：`<sign> Rising/Ascendant`，轴点词后禁跟 above/toward/from（防 "rising above"
//     动词短语误伤）；
//   · es/fr/th/vi 暂不补（宁漏不改，后置形态暂无线下实证）。
function _v517AxisRe(lang, signsPat) {
  if (lang === 'zh') return new RegExp('(?:你的|本命|乃)?(?:上升|命宫)(?:星座)?(?:是|在|为)?\\s*(' + signsPat + ')|(?:你的|本命|乃)?\\s*(' + signsPat + ')(?:的)?(?:上升|命宫)(?![期段势])', 'g');
  if (lang === 'en') return new RegExp('(?:Rising\\s+Sign|Rising|Ascendant)(?:\\s+is|\\s+in)?\\s*(' + signsPat + ')\\b|(' + signsPat + ')\\s+(?:Rising|Ascendant)\\b(?!\\s+(?:above|toward|from))', 'gi');
  if (lang === 'es') return new RegExp('(?:Ascendente|Ascendant)(?:\\s+es|\\s+en)?\\s*(' + signsPat + ')\\b', 'g');
  if (lang === 'fr') return new RegExp('(?:Ascendant)(?:\\s+est)?(?:\\s+en)?\\s*(' + signsPat + ')\\b', 'gi');
  // ⚠️ th/vi 的「你的」是**中置**（ลัคนา**ของคุณ** / Ascendant **của bạn**）—— 必须显式吃掉，
  //   否则「ลัคนาของคุณอยู่ในเมษ」永不匹配（实测：漏这两段 ⇒ 泰/越两语整锁空转）。
  // ⚠️ 泰文**不用空格分词**（ลัคนาของคุณอยู่ในเมษ 整串无空格）⇒ 中置词必须用 `\s*` 而非 `\s+`。
  if (lang === 'th') return new RegExp('(?:ลัคนา|Ascendant)(?:\\s*ของ\\s*คุณ)?(?:\\s*อยู่)?(?:\\s*ใน)?\\s*(' + signsPat + ')', 'g');
  if (lang === 'vi') return new RegExp('(?:Ascendant|cung\\s+Mọc)(?:\\s*của\\s*bạn)?(?:\\s*là)?(?:\\s*ở)?\\s*(' + signsPat + ')', 'gi');
  return null;
}

// 本地化真值（英文星座名 → 本语写法）；缺表/越界返回 null
function _v517LocalSign(lang, enName) {
  if (!enName) return null;
  const i = SUN_SIGN_EN.indexOf(enName);
  if (i < 0) return null;
  if (lang === 'en') return enName;
  const signs = _v444Signs(lang);
  return (signs && signs[i]) ? signs[i] : null;
}

function lockYearlyAxisAnchor(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  const meta = (astroMatrix && astroMatrix.meta) || null;
  const trueLoc = _v517LocalSign(lang, meta && meta.rising_sign);
  if (!trueLoc) return text;                                   // ② 真值缺失 → 整锁跳过
  const signs = _v444Signs(lang);
  if (!signs) return text;
  const signsPat = signs.map(_v444Esc).join('|');
  const re = _v517AxisRe(lang, signsPat);
  if (!re) return text;
  const mark = _V517_TRANSIT_MARK[lang] || null;
  const signSet = new Set(signs.map((s) => String(s).toLowerCase()));
  let n = 0;
  // 🛡️ E20/R11n ②: zh/en 补后置形态后正则含双捕获组（前置 g1 / 后置 g2），token 取 g1||g2；
  //   其余单组语言 g2 恒 undefined，行为不变。
  const out = text.replace(re, (m, g1, g2, off) => {
    const tok = g1 || g2;
    if (!signSet.has(String(tok).toLowerCase())) return m;      // ③ 非星座 token → 不动
    if (mark && mark.test(text.slice(Math.max(0, off - 24), off))) return m;  // ④ 流年豁免
    if (String(tok).toLowerCase() === String(trueLoc).toLowerCase()) return m; // 幂等
    n++;
    const j = m.indexOf(tok);
    return m.slice(0, j) + trueLoc + m.slice(j + tok.length);
  });
  if (n) console.log(`[E17/R11j] ${lang} 年报轴点锁(上升/命宫): \u4fee\u6b63 ${n} \u5904 \u2192 ${trueLoc}`);
  return out === text ? text : out;
}

// 只读出口（在线探针 / 单测直调）
function auditYearlyAxisAnchor(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return null;
  const meta = (astroMatrix && astroMatrix.meta) || null;
  const trueLoc = _v517LocalSign(lang, meta && meta.rising_sign);
  if (!trueLoc) return null;
  const signs = _v444Signs(lang) || [];
  const re = _v517AxisRe(lang, signs.map(_v444Esc).join('|'));
  if (!re) return null;
  const signSet = new Set(signs.map((s) => String(s).toLowerCase()));
  const seen = [];
  for (const m of text.matchAll(re)) {
    if (!signSet.has(String(m[1]).toLowerCase())) continue;
    seen.push(m[1]);
  }
  const bad = seen.filter((s) => String(s).toLowerCase() !== String(trueLoc).toLowerCase());
  return { trueSign: trueLoc, seen, total: seen.length, mismatch: bad };
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E17/R11j ③④：年报非月段「裸本命句」真值锁
// ══════════════════════════════════════════════════════════════════
// 【病根】第三章「四元素」/ 第四章「阴影审计」是**本命分析**段，但句式为**裸句**（无「你的/本命」前缀）：
//   「月亮在金牛座第十二宫，要求你…」（真值 Moon Taurus **H6**）
//   「太阳在双子座第七宫，要求你…」（真值 Sun Libra **H11**）
//   「你的冥王星在水瓶座第3宫。」（真值 Pluto Scorpio **H11**）
//   ⇒ 落在既有窄前缀盲区（`_v432LockNatal` 月段要求显式本命定语 / 物主裁定）⇒ 实测 monthly 亦不纠。
// 【治法】在月锚点**之后**的段落，对「行星 + 在/落入/位于 + 星座(+宫位)」形态纠值；
//   唯一豁免 = **同句前窗含流年标记**（流年太阳在双鱼座第4宫 ⇒ 不动，那是流年真值）。
//   保形写回：只换星座 token 与宫位数字，绝不改措辞；幂等。
const _V517_PLANET_ZH = ['太阳', '月亮', '水星', '金星', '火星', '木星', '土星', '天王星', '海王星', '冥王星'];
const _V517_PLANET_EN = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const _V517_PLANET_KEY_ORDER = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

function _v517BareNatalRe(lang, signsPat) {
  if (lang === 'zh') {
    return new RegExp('(' + _V517_PLANET_ZH.join('|') + ')(?:在|落入|位于|驻守)\\s*(' + signsPat + ')(?:\\s*第\\s*(\\d{1,2}|[一二三四五六七八九十]{1,3})\\s*宫)?', 'g');
  }
  if (lang === 'en') {
    return new RegExp('\\b(' + _V517_PLANET_EN.join('|') + ')\\s+(?:in|sits\\s+in|occupies)\\s+(' + signsPat + ')(?:\\s+(?:in\\s+)?(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)\\s+House)?', 'g');
  }
  return null;   // 本锁先服务 zh/en（其余语种由轴点锁 + 月标题锁覆盖；扩展需补各语介词表）
}

function lockYearlyBareNatalPlanets(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  const meta = (astroMatrix && astroMatrix.meta) || null;
  const np = meta && (meta.computed_houses || meta.natal_planets);
  if (!meta || !np) return text;
  const signs = _v444Signs(lang);
  if (!signs) return text;
  const signsPat = signs.map(_v444Esc).join('|');
  const re = _v517BareNatalRe(lang, signsPat);
  if (!re) return text;
  // 真值表：行星 → { sign(本地化), house }
  const truth = {};
  for (const k of _V517_PLANET_KEY_ORDER) {
    const c = np[k];
    if (!c || !c.sign) continue;
    truth[k] = { sign: _v517LocalSign(lang, c.sign), house: (typeof c.house === 'number' ? c.house : (c.house && c.house.house)) };
  }
  if (!Object.keys(truth).length) return text;
  const mark = _V517_TRANSIT_MARK[lang] || null;
  const signSet = new Set(signs.map((s) => String(s).toLowerCase()));
  // 🛡️ E18/R11k（P0）：**月标题行豁免**。
  //   病根（2026-10-05 v517 线上 s2 en 库内文本实证）：月标题 `### July 2026: Sun in Cancer · 7th House · …`
  //   描述的是**流月**太阳，措辞极简（无 transit 词 ⇒ 流年豁免失效），被本锁当成「裸本命句」
  //   按本命真值反写 ⇒ **12 个月标题星座全部变成 natal Sun（Sagittarius）**，而宫位仍是正确的
  //   流年值 ⇒ 半错半对的 B 版。后果：CRITIC 判据 4/5（月标题太阳星座真值）持续告警，
  //   且本锁挂在 `lockYearlyMonthTitles` **之后** ⇒ 把刚纠好的标题又改坏（链上实测 Δ=+55）。
  //   识别真源复用 `_v516MonthHeadKey`（六语统一识别，与 `lockYearlyMonthTitles` **同口径**，判据同源）。
  //   ⚠️ 与 E16/R11g 修 th/vi/fr「标题行豁免」、`_v432AdjudicateDescriptors` 的 `_v479IsMonthTitleLine`
  //   守卫同族 —— 凡「按行星真值纠值的锁」都必须先排除月标题行。
  const _v517InMonthTitle = (idx) => {
    const ls = text.lastIndexOf('\n', idx - 1) + 1;
    let le = text.indexOf('\n', idx);
    if (le === -1) le = text.length;
    try { return !!_v516MonthHeadKey(text.slice(ls, le), lang); } catch (e) { return false; }
  };
  let n = 0;
  const out = text.replace(re, (m, planetTok, signTok, houseTok, off) => {
    if (!signSet.has(String(signTok).toLowerCase())) return m;
    if (_v517InMonthTitle(off)) return m;                                      // 🛡️ E18/R11k 月标题豁免
    if (mark && mark.test(text.slice(Math.max(0, off - 30), off))) return m;   // 流年豁免
    const key = _V517_PLANET_KEY_ORDER[_V517_PLANET_ZH.indexOf(planetTok) >= 0 ? _V517_PLANET_ZH.indexOf(planetTok) : _V517_PLANET_EN.indexOf(planetTok)];
    const t = truth[key];
    if (!t || !t.sign) return m;
    let mm = m;
    let changed = false;
    if (String(signTok).toLowerCase() !== String(t.sign).toLowerCase()) {
      const j = mm.indexOf(signTok);
      if (j >= 0) { mm = mm.slice(0, j) + t.sign + mm.slice(j + signTok.length); changed = true; }
    }
    if (houseTok && t.house) {
      const want = String(t.house);
      const cur = /^\d+$/.test(houseTok) ? String(Number(houseTok)) : String(_v517Cn2Int(houseTok));
      if (cur !== want) {
        const j = mm.indexOf(houseTok);
        if (j >= 0) {
          const rep = lang === 'zh' ? (houseTok === String(Number(houseTok)) ? want : _v517Int2Cn(want)) : want;
          mm = mm.slice(0, j) + rep + mm.slice(j + houseTok.length);
          changed = true;
        }
      }
    }
    if (!changed) return m;
    n++;
    return mm;
  });
  if (n) console.log(`[E17/R11j] ${lang} 年报裸本命句锁: \u4fee\u6b63 ${n} \u5904`);
  return out === text ? text : out;
}

// 整数 → 中文数字（1~12）
function _v517Int2Cn(n) {
  const CN = ['\u96f6', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u4e03', '\u516b', '\u4e5d', '\u5341', '\u5341\u4e00', '\u5341\u4e8c'];
  return CN[n] || String(n);
}

// 中文数字 → 整数（1~12；失败返回 NaN）
function _v517Cn2Int(s) {
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const D = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
  const m = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/.exec(s);
  if (m) return (m[1] ? D[m[1]] : 1) * 10 + (m[2] ? D[m[2]] : 0);
  if (D[s]) return D[s];
  return NaN;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E17/R11j ⑥：年报「模板标签残句」清理（zh）
// ══════════════════════════════════════════════════════════════════
// 【病根】v516 线上实证：「本命水星在天秤座**你的本命太阳**，与木星形成强烈共振。」
//   /「水星在射手座**你的上升星座**，与木星形成强烈共振。」—— 模板标签词被当正文留在句中，
//   属收尾链未洗净的残句。
// 【铁律】只删「**紧跟星座词之后、以逗号结尾**」的插入语形态：
//   匹配 = `(?<=座) 你的(本命)?(太阳|上升|月亮)(星座)? (?=，)`。
//   必须保留**独立指代**用法：「这是你的上升星座与命宫。」（后面是「与」，非逗号）⇒ 不匹配、不删。
function stripYearlyLabelResidue(text, lang, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  if (lang !== 'zh') return text;
  let n = 0;
  const out = text.replace(/(?<=\u5ea7)\s*\u4f60\u7684(?:\u672c\u547d)?(?:\u592a\u9633|\u4e0a\u5347|\u6708\u4eae)(?:\u661f\u5ea7)?(?=\s*[\uff0c,])/g, () => { n++; return ''; });
  if (n) console.log(`[E17/R11j] zh \u5e74\u62a5\u6807\u7b7e\u6b8b\u53e5\u6e05\u7406: ${n} \u5904`);
  return out === text ? text : out;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E17/R11j ⑤-b：年报「尾部落款」硬剥离（六语）
// ══════════════════════════════════════════════════════════════════
// 【病根】`src/prompts/` 下各语提示词内**没有任何署名/落款/版权指令** ⇒ 尾部三行（本报告由…生成 /
//   报告周期：… / © 2026 KINDREDSOULS. All rights reserved.）系 **LLM 自发**（系统提示词标题含品牌名）。
//   该落款属**视口组件**，不应进正文 Markdown（前端已有自有 Footer ⇒ 重复叠加）。
// 【治法】军师裁决：prompt 侧禁写 + 输出侧**确定性硬剥离**（防 LLM 换措辞）。仅删「整行即落款」的行。
function stripYearlySignature(text, lang, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  const before = text;
  // 正则**内建**于函数（避免全局正则 lastIndex 状态复用陷阱；每篇报告仅调用一次，开销可忽略）
  const SIG_LINE = new RegExp(
    '^[ \\t]*\\*{0,2}[ \\t]*(?:'
    + '\u672c\u62a5\u544a\u7531[^\\n]*KINDREDSOULS[^\\n]*|'            // 本报告由 KINDREDSOULS…
    + '\u62a5\u544a\u5468\u671f[:\uff1a][^\\n]*|'                       // 报告周期：…
    + 'This\\s+report\\s+(?:was\\s+)?generated\\s+by[^\\n]*|'
    + 'Report\\s+[Pp]eriod[:\uff1a][^\\n]*|'
    + '\u00a9[^\\n]*|'                                                  // © …
    + 'Copyright[^\\n]*|'
    + 'All\\s+rights\\s+reserved[^\\n]*'
    + ')[ \\t]*\\*{0,2}[ \\t]*$', 'gim');
  let t = text.replace(SIG_LINE, '');
  // 落款块删除后会留下多余空行/孤立分隔线 ⇒ 收口（只动尾部，避免吃正文）
  if (t !== before) {
    t = t.replace(/[ \t]*\n(?:[ \t]*\n)*(?:[ \t]*---[ \t]*\n)(?:[ \t]*\n)*$/, '\n');
    t = t.replace(/\n{3,}$/, '\n');
  }
  if (t !== before) console.log('[E17/R11j] \u5e74\u62a5\u5c3e\u90e8\u843d\u6b3e\u786c\u5265\u79bb: \u5df2\u6e05\u9664');
  return t;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E17/R11j ⑤-a：高纬告知 meta 化（正文不再拼接）
// ══════════════════════════════════════════════════════════════════
// 【病根】`injectHighLatitudeNotice` 把「ℹ️ 检测到您的出生地位于高纬度极圈区域…」**拼进正文首段**
//   ⇒ 导出/渲染时与前端自有 Banner 重复，且破坏了 Markdown 结构（军师裁定：属 UI 状态气泡，
//   不是「星盘神谕报告正文」）。
// 【治法】正文**不拼**；改由 JSON `highLatitudeNotice` 字段返回（见 `buildHighLatitudeMeta`），
//   前端在页面顶部单独渲染。本函数保留为**兼容 no-op**（旧调用点不动，行为=原样返回）。
const _V517_HL_NOTICE = {
  zh: '\u68c0\u6d4b\u5230\u60a8\u7684\u51fa\u751f\u5730\u4f4d\u4e8e\u9ad8\u7eac\u5ea6\u6781\u5708\u533a\u57df\uff0c\u7cfb\u7edf\u5df2\u81ea\u52a8\u542f\u7528\u7b49\u5bab\u5236\uff08Whole Sign\uff09\u4e3a\u60a8\u7cbe\u786e\u6821\u51c6\u5bab\u4f4d\u3002',
  en: 'Your birthplace lies in the high-latitude polar region \u2014 the system has automatically switched to the Whole Sign house system for precise house calibration.',
  es: 'Tu lugar de nacimiento se encuentra en la regi\u00f3n polar de alta latitud: el sistema ha activado autom\u00e1ticamente el sistema de casas de Signo Completo (Whole Sign) para calibrar con precisi\u00f3n tus casas.',
  fr: 'Votre lieu de naissance se situe dans la r\u00e9gion polaire de haute latitude \u2014 le syst\u00e8me a automatiquement activ\u00e9 le syst\u00e8me des maisons en Signes Entiers (Whole Sign) afin de calibrer pr\u00e9cis\u00e9ment vos maisons.',
  th: '\u0e2a\u0e16\u0e32\u0e19\u0e17\u0e35\u0e48\u0e40\u0e01\u0e34\u0e14\u0e02\u0e2d\u0e07\u0e04\u0e38\u0e13\u0e2d\u0e22\u0e39\u0e48\u0e43\u0e19\u0e40\u0e02\u0e15\u0e25\u0e30\u0e15\u0e34\u0e08\u0e39\u0e14\u0e2a\u0e39\u0e07\u0e1a\u0e23\u0e34\u0e40\u0e27\u0e13\u0e02\u0e31\u0e49\u0e27\u0e42\u0e25\u0e01 \u0e23\u0e30\u0e1a\u0e1a\u0e44\u0e14\u0e49\u0e40\u0e1b\u0e34\u0e14\u0e43\u0e0a\u0e49\u0e23\u0e30\u0e1a\u0e1a\u0e40\u0e23\u0e37\u0e2d\u0e19\u0e41\u0e1a\u0e1a\u0e23\u0e32\u0e28\u0e35\u0e40\u0e15\u0e47\u0e21 (Whole Sign) \u0e42\u0e14\u0e22\u0e2d\u0e31\u0e15\u0e42\u0e19\u0e21\u0e31\u0e15\u0e34 \u0e40\u0e1e\u0e37\u0e48\u0e2d\u0e1b\u0e23\u0e31\u0e1a\u0e40\u0e23\u0e37\u0e2d\u0e19\u0e43\u0e2b\u0e49\u0e41\u0e21\u0e48\u0e19\u0e22\u0e33',
  vi: 'N\u01a1i sinh c\u1ee7a b\u1ea1n n\u1eb1m \u1edf v\u00f9ng v\u0129 \u0111\u1ed9 cao g\u1ea7n c\u1ef1c \u2014 h\u1ec7 th\u1ed1ng \u0111\u00e3 t\u1ef1 \u0111\u1ed9ng chuy\u1ec3n sang h\u1ec7 th\u1ed1ng nh\u00e0 To\u00e0n Cung (Whole Sign) \u0111\u1ec3 hi\u1ec7u ch\u1ec9nh nh\u00e0 ch\u00ednh x\u00e1c.',
};

function buildHighLatitudeMeta(astroMatrix, lang) {
  if (!astroMatrix || !astroMatrix.meta || astroMatrix.meta.is_high_latitude_fallback !== true) return null;
  return {
    is_high_latitude_fallback: true,
    house_system: astroMatrix.meta.house_system || 'Whole Sign',
    notice: _V517_HL_NOTICE[lang] || _V517_HL_NOTICE.en,
  };
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ E17/R11j：年报四道治本锁的**统一入口**
// ══════════════════════════════════════════════════════════════════
// ⚠️ 铁律（军师裁决·E13/R11d-4 同源）：**MISS 链 / HIT 链 / 流式链 / 补全链 / 落库链
//   必须同序同集**调用本函数 —— 否则「同一缓存键，HIT 响应 ≠ 落库文本」，用户刷新两次
//   得到两份不同的报告（E9 已记载的隐性缺陷面）。
//   幂等：四锁均为「值==真值 ⇒ 原样返回」，对已处理的文本重跑零改动。
function _v517YearlyFinalLocks(text, lang, astroMatrix, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  let t = text;
  t = lockYearlyAxisAnchor(t, lang, astroMatrix, reportType);         // ① 上升锚点（窄锁）
  t = lockYearlyBareNatalPlanets(t, lang, astroMatrix, reportType);   // ③④ 裸本命句
  t = stripYearlyLabelResidue(t, lang, reportType);                   // ⑥ 模板标签残句
  t = stripYearlySignature(t, lang, reportType);                      // ⑤-b 尾部落款
  return t;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V485b: 年报「Prompt 内部字段泄漏」清理
//   病根(2026-10-01 生产实测, 上线 V485 黑天鹅差异化后立即暴露):
//     为使黑天鹅逐月差异化, V485 在 prompt 里注入「★ 本月专属风控切入角度:XXX」,
//     LLM 把该字段名连同取值**原样写进正文** ⇒ 12 个月全部出现
//     「…警告你:不要投机。本月专属风控切入角度:隐性债务与杠杆暴露。你需要…」
//     —— 内部机制泄漏给用户(高奢交付的观感事故)。
//   治法(双保险):
//     ① prompt 侧: 明确「内部参考·严禁在正文出现本行字样」(见下方 system 追加段)
//     ② 输出侧: 本函数确定性清除该类字段句(整句删除; 因其前后均为完整句子, 删除后语句通顺)
//   幂等; 只服务年报 zh。
// ══════════════════════════════════════════════════════════════════
function stripYearlyPromptLeakage(text, lang, reportType) {
  if (reportType !== 'yearly') return text;
  if (lang !== 'zh') return text;
  if (!text || typeof text !== 'string') return text;
  const before = text;
  let t = text;
  // ⚠️ 次序要紧: 先处理「整句形态」, 再处理「字段名形态」(反过来则字段名先被删、整句形态再也匹配不到)。
  // ① 整句形态 —— 字段名连同取值自成一整句(「…惩罚。本月专属风控切入角度:X。你需要…」), 整句删除;
  //    因其前后均为完整句子, 删除后语句通顺。
  t = t.replace(/\*{0,2}(?:本月|当月)?(?:专属|内部)?\s*(?:风控|风险)切入点?\s*(?:角度|视角)\*{0,2}\s*[:：]\s*[^。；\n]*[。；]?[ \t]*/g, '');
  // ② 字段名形态 —— 其后紧跟实质内容(V485b 线上二次实测: LLM 写成带 💡 的条目
  //    「* 💡 **本月风控主线**: 现金流周转与应急储备。第8宫的能量…」, 内容本身逐月差异化且有效)
  //    ⇒ 只删「字段名 + 冒号」, **保留内容**, 删后语句自然衔接。
  //    词表做泛化: 风控/风险 + 主线/角度/视角/重点/切入点 (prompt 换词也不会再漏)。
  t = t.replace(/\*{0,2}(?:本月|当月)?(?:专属|内部)?\s*(?:风控|风险)\s*(?:主线|角度|视角|重点|切入点)\*{0,2}\s*[:：]\s*/g, '');
  // ③ 兜底: 极少数把字段名单独成行/带 markdown 强调的形态
  t = t.replace(/^[ \t]*\*{0,2}(?:本月|当月)?(?:专属|内部)?\s*(?:风控|风险)\s*(?:主线|角度|视角|重点|切入点)\*{0,2}\s*[:：][^\n]*$\n?/gm, '');
  // ── V487 新增字段(叙述镜头 / 风控表达框架 / 窗口表达框架)────────────────────────
  // ⚠️ 必须优先处理「长形态」: 与 server 端注入串同形 ——
  //    `★ 内部参考·本月窗口表达框架(仅供你组织…): 动作指令式 —— 开句直接给出动作。`
  //    压力测试实测: 只写短形态规则会漏网(前缀 ★ / 内部参考 / 括号说明全都匹配不上)。
  const _PFX487 = '\\*{0,2}[★✦]?\\s*(?:(?:内部参考|内部|专属)\\s*[·・]?\\s*)?(?:本月|当月)?\\s*';
  const _PAREN487 = '(?:\\s*[（(][^)）\\n]{0,60}[)）])?';
  const _SEP487 = '\\*{0,2}\\s*[:：]\\s*';
  // ④a 框架类字段(风控/窗口/高峰/执行): 前缀 + 括号说明 + 冒号 一并删除(其后是纯机制)
  t = t.replace(new RegExp(_PFX487 + '(?:风控|风险|窗口|高峰|执行)\\s*(?:表达)?\\s*(?:指令)?\\s*框架' + _PAREN487 + _SEP487, 'g'), '');
  // ④b 框架的「代号 + 结构说明」(如 `条件触发式 —— 先给触发条件, 再给后果判断。`): 整段删除
  //    ⚠️ 仅在**紧跟闭集代号**时才删 —— 绝不做「见到 —— 就删」(正文里 —— 是正常破折号, V484 类事故面)
  t = t.replace(new RegExp('(?:' + _V487_RFW_CODES.join('|') + ')\\s*——\\s*[^。；\\n]{0,80}[。；]?\\s*', 'g'), '');
  // ④c 闭集代号裸残留(LLM 把代号单独写进句子/小标题时) —— 代号均为人工词, 正文不会自然出现
  t = t.replace(new RegExp('(?:' + _V487_RFW_CODES.join('|') + ')', 'g'), '');
  // ④d 镜头类字段(叙述/叙事/概览): 只删字段名(含长形态前缀), **保留其后的内容**
  //     取值(如「现金流周转速度与账期节奏」)是真正要写进正文的角度, 属内容 ⇒ 与 V485b② 同法保留。
  t = t.replace(new RegExp(_PFX487 + '(?:叙述|叙事|概览)\\s*(?:镜头|视角|切入点)' + _PAREN487 + _SEP487, 'g'), '');
  // ⑤ 分配表名/编号残留(极少数把表头抄进正文的形态)
  t = t.replace(/【?\s*📌?\s*第[一二三四]章\s*(?:月度)?(?:叙述镜头|风控表达框架|窗口表达框架)分配表[^】\n]*】?/g, '');
  // ── V488b 的「是/为」连接变体（2026-10-01 线上跨盘验收实测）──────────────────────────
  //   真值(线上 1985-06-20 盘 zh 年报 18204 字): 12/12 个月全部出现
  //     「…变成"债主"。本月风控主线是"现金流周转与应急储备"，因此，在18日前…」
  //   取值与 `_V485_CRISIS_ANGLES` 的 12 项**逐项吻合** ⇒ 确系 V485 注入表字段名 + 取值进了正文;
  //   V485b② 只覆盖「字段名 + 冒号」形态 ⇒ 「是/为」连接整批漏网(跨盘 0/12 vs 12/12)。
  //   ⚠️ V488f 结构性收敛: 该层能力**已被下方 V488e/f 兜底完全覆盖**(词表相同, 且同样处理
  //      系动词与引号) —— 两层语义重叠会让"注入自测到底该判哪一层会红"无法定位(已踩) ⇒ 合一。
  //   ⚠️ 字符类里不得出现字面 ASCII 引号(会打乱测试端朴素括号配平器) ⇒ 用 \u0022 转义。
  const _LQ488B = '[\\u201c\\u300c\\u0022]';                       // “ 「 "
  const _RQ488B = '[\\u201d\\u300d\\u0022]';                       // ” 」 "
  // ── V488e: 结构性兜底 —— 「定语 + 字段名」无条件删除, **不再枚举连接符** ───────────────
  //   第三次实测漏网(2026-10-01 V488d 复抓, 部署 234101f3):
  //     「…任何电子转账都可能出现延迟或错误。本月风控主线聚焦于现金流周转与应急储备，请确保…」
  //   ⇒ 连接符是**开放集合**(冒号 → 是/为 → 聚焦于 → 将会是/围绕着/关键在于…), 枚举永远补不全。
  //   正解(结构性): 「定语 + 字段名」本身就是"机制口吻"的充要标志 —— 定语在、字段名在, 就删;
  //     其后内容(含动词短语「聚焦于…」)原样保留, 删后句子仍然通顺
  //     (「…出现延迟或错误。聚焦于现金流周转与应急储备，请确保…」)。
  //   ⚠️ 定语必须**强制出现**(绝不能写成 `(?:本月|当月)?` 这种可选形态) —— 否则会误伤正文
  //      自然表达「你的风控重点是现金流」。
  //   ── V488f 增强（同日线上复验证实第四个变体）: LLM 在定语与字段名之间**插入人称/助词** ——
  //     「本月**你的**风控主线[是]现金流周转与应急储备——请确保…」(12/12 个月出现; 取值仍与
  //      _V485_CRISIS_ANGLES 逐项吻合 ⇒ 同一泄漏)。此前 6 批(120 盘)未出现 ⇒ 随机措辞变体, 基率低但非零。
  //     ⇒ 「定语必须紧贴字段名」的假设也被推翻 ⇒ 容忍「定语 + ≤4 个非标点字符 + 字段名」,
  //       并把系动词一并吃掉(否则删完会剩「是现金流周转…」这种断句)。
  const _F488E = '(?:本月|当月|专属|内部)[^，。；：\\n]{0,4}?(?:(?:风控|风险)\\s*(?:切入)?\\s*(?:主线|角度|视角|重点|切入点)'
    + '|(?:叙述|叙事|概览)\\s*(?:镜头|视角|切入点))';
  // a) 字段名后接引号内容 ⇒ 只保留引号内内容(取值是内容)
  t = t.replace(new RegExp('\\*{0,2}\\s*' + _F488E + '\\s*\\*{0,2}\\s*(?:[是为即系]{1,2}|[:：])?\\s*'
    + _LQ488B + '([^\\u201d\\u300d\\u0022\\n]{1,60})' + _RQ488B, 'g'), '$1');
  // b) 其余形态 ⇒ 字段名 + 可选系动词/冒号 一并删除, 其后内容原样保留
  t = t.replace(new RegExp('\\*{0,2}\\s*' + _F488E + '\\s*\\*{0,2}\\s*(?:[是为即系]{1,2}|[:：])?\\s*', 'g'), '');
  // 清理可能因删除产生的孤立连接词/空标点/行首逗号
  t = t.replace(/[，,]\s*。/g, '。').replace(/。\s*。/g, '。').replace(/[ \t]{2,}/g, ' ')
    .replace(/(^|[\n。；;：:])\s*[，,、]\s*/g, '$1');
  if (t !== before) console.log(`[V485b] ${lang} 年报 Prompt 字段泄漏清理: 清除 ${(before.length - t.length)} 字`);
  return t;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V486: 年报文风复读审计 —— **只检不改**
// ══════════════════════════════════════════════════════════════════
//   军师二轮评审实证(1997-10-18 盘 zh 年报 19583 字): 11 类长句在 12 个月里逐字复用,
//   最高单句复用 7 次; 句式级复用更重(窗口号召句 12/12 月同一句)。
//   ⚠️ 本函数**绝不修改文本**。对正文做确定性改写 = 造词/语义损伤风险,
//      与本项目 V484「替换串凭空造日」属同一类事故面 ⇒ 一律不做。
//   只做统计 + 日志告警, 供线上取证与回归对比; 真正的治理在 prompt 侧硬规则(V486)。
//   幂等、纯读; 非年报返回 null; 有 reportType 护栏。
// ══════════════════════════════════════════════════════════════════
function auditYearlyStyleRepetition(text, lang, reportType) {
  if (reportType !== 'yearly') return null;
  if (!text || typeof text !== 'string') return null;
  const _seen = new Map();
  for (const r of text.split(/(?<=[。！？])/)) {
    const head = r.replace(/^[\s>*\-]+/, '');
    const c0 = head.codePointAt(0) || 0;
    // 跳过以图形符号/emoji 起手的标签行(🌐/🟢/🔴/💡/🚀/🌟/⚠️/🔮),
    // 用码点区间判定而非正则字符类 —— 后者按 UTF-16 码元匹配代理对, 会误伤正文。
    if ((c0 >= 0x2190 && c0 <= 0x2BFF) || (c0 >= 0x1F300 && c0 <= 0x1FAFF)) continue;
    const s = head.replace(/\s+/g, '').trim();
    if (s.length < 10) continue;
    _seen.set(s, (_seen.get(s) || 0) + 1);
  }
  const _dup = [..._seen.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  const stat = {
    dupTypes: _dup.length,
    dupOccurrences: _dup.reduce((a, [, n]) => a + n, 0),
    maxRepeat: _dup.length ? _dup[0][1] : 0,
    worst: _dup.slice(0, 3).map(([s, n]) => `×${n} ${s.slice(0, 36)}`),
  };
  if (stat.dupTypes > 0) {
    console.log(`[V486-STYLE] ${lang} 年报文风审计(只检不改): 重复句 ${stat.dupTypes} 类 / ${stat.dupOccurrences} 次 / 最高 ×${stat.maxRepeat} ｜ ${stat.worst.join(' ｜ ')}`);
  } else {
    console.log(`[V486-STYLE] ${lang} 年报文风审计(只检不改): 零重复句 ✅`);
  }
  return stat;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V480: 年报「Markdown 结构归一」—— 标题层级/分隔符锁死 + 卡标签本地化 + 头部块瘦身
// ══════════════════════════════════════════════════════════════════
//   真值(2026-09-30 生产端 1989-08-15 zh 年报; 用真实产物端到端跑线上同一份前端解析器复现):
//     ① 【已引爆】月卡全丢: 该次 LLM 用全角冒号「### 2026年9月：太阳在处女座第十一宫」,
//        而前端月卡正则 `[·::-|]` 只认半角 → parseYearlyReport 实测 months=0
//        → 12 个月卡整体消失、流年矩阵容器空白、H1 也缺失(标题兜底成「年度财富报告」)。
//     ② 半吊子章节锚点: 前端把「### 📊 2026-2027 年度财富核心指标仪表盘」替换成
//        「### 先知神谕:年度财富天启」(残留 1 个 #) → 而章节卡严格要求「## 」→ 沦为正文残渣。
//     ③ 层级漂移: Prompt 的锁定标题模板是 `#### … Sun in …`(英文), LLM 实际输出时 ## 时 ###,
//        写死 `###\s*\d{4}年` 的老清洗正则(L2008/L2593)静默漏网 → 真值锁失效。
//     ④ 卡标签未本地化: 中文年报残留 [Peak Revenue Window]×12 / [Financial Black Swan Day]×12。
//     ⑤ 头部块: ◇ 漂移 emoji + `> * **X`(粗体星号不成对) + 双 ✦ 包裹 → 渲染错乱。
//   本函数=纯确定性后处理: 只服务年报(reportType 护栏), 幂等; 只动标记层级/分隔符/装饰符, 不改语义。
// ══════════════════════════════════════════════════════════════════
const _V480_SEP = '[：:·\\-–—|｜]';                                    // 半角+全角分隔符都要吃
const _V480_EN_MON = 'January|February|March|April|May|June|July|August|September|October|November|December';
const _V480_ES_MON = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';
// 章节锚点关键词(与前端 `chapterPatterns` / `advancedUniversalChapterRegex` 对齐); 命中即锁 `## `
// 🔴 E24/R11r②（2026-10-06 线上西语实测根治）：原表**只认中文** ⇒ 六语里除 zh，章节锚点一律被
//   降级 `### `（与月标题同构 ⇒ 结构语义丢失；前端又把 `#` 全剥，故用户可见差异由前端判据造成）。
//   现补全六语章节 token（zh/en/es/fr/vi/th）+ 各语「最终神谕 / 报告主标题」锚点。
//   ⚠️ 与前端 `web/src/components/SacredYearlyReportBox.tsx` 的 `KS_CHAPTER_ROMAN` / `KS_ORACLE_ANCHOR`
//      **同源**（同一 token 集）；断言见 `test/audit-e24-r11r-multilang-chapter-title.test.mjs`。
//   ⚠️ 只放**章节锚点专属** token：**绝不可**加入月份名 —— 那是月标题的判据（`_V480_EN_MON`/
//      `_V480_ES_MON`），加入即把 12 个月标题全部升格成章节锚点。
const _V480_CHAP_KW = /(?:第[一二三四五六七八九十]+[章节]|先知神谕|先知天书|最终财富|通关密令|精通之钥|Chapter\s*[IVX0-9]|Cap[ií]tulo\s*[IVX0-9]+|Chapitre\s*[IVX0-9]+|Chương\s*[IVX0-9]+|บทที่\s*[\d๑๒๓๔๕๖๗๘๙]+|บทสรุป|Or[áa]culo|FINAL WEALTH ORACLE|Final Oracle)/i;
// 标题/正文行首的装饰符(前端 L106 会剥除的那批 + 双 ✦)
//
// 🔴🔴 E23/R11q ④（2026-10-06）**必须带 `u` 标志** —— 缺它 = 半代理项污染工厂。
//   病根（线上实测取证，非推演）：JS 非 `u` 模式下，字符类里的**星平面字符被拆成两个独立码元**：
//     `📜` = U+D83D + U+DCDC ⇒ 类成员集合实际上含 **裸 `\uD83D`、`\uDEE1`、`\uFE0F`** 等半代理项。
//   于是 `^[...]+` 对**未列入本闭集**的 emoji 标题（如 `### 👁️ 潜意识阴影`）：
//     `\uD83D` 命中类 → 被单独删除；`\uDC41` 不属类成员 → `+` 提前中断
//     ⇒ 产出 `### \uDC41\uFE0F 潜意识阴影`（**孤立低代理项**）。
//   后果连锁（已逐一实证）：
//     ① 用户可见乱码 `�`（emoji 被斩首）；
//     ② `JSON.stringify` 把孤立代理项转义成 `\udc41` ⇒ PostgREST(aeson) 判为非法 JSON
//        ⇒ `400 PGRST102 "Empty or invalid json"` ⇒ **写缓存静默失败** ⇒ 该盘**永不命中**
//        （线上日志实锤：`[wealth-stream] [WRITE-FAIL] status=400 body={"code":"PGRST102"...}`）；
//     ③ 复现率：s7 zh 连抽 5 稿有 1 稿含 emoji 小标题 ⇒ 被拒库；s2 en 5/5 正常。
//   修法：补 `u` ⇒ 类成员是**整颗 emoji** ⇒ 闭集内 emoji（📜/📅/✦…）剥离行为**完全不变**
//     （零 churn，已逐例验证），闭集外 emoji **原样保留**（不再被斩首）。
//   ⚠️ 同类扫描：`test/audit-e23-r11q-...` 闸门内建「锚定式星平面字符类必须带 u」全仓扫描。
const _V480_DECOR = /^[\s✦◆◇📜📅🏹🛡️🔮📊📕📌·]+/u;
// 标题尾部的装饰符(如「## ✦ 先知神谕 · 财富启示录 ✦」的收尾 ✦) —— 同 `_V480_DECOR`，`u` 标志不可去
const _V480_DECOR_TAIL = /[\s✦◆◇📜📅🏹🛡️🔮📊📕📌·]+$/u;

function normalizeYearlyMarkup(text, lang, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  let titles = 0, chaps = 0, dropped = 0, heads = 0, tags = 0;
  let out = text;

  // ── ① 卡标签本地化(zh): 中文年报里不许出现英文模板标签 ──
  if (lang === 'zh') {
    const b0 = out;
    out = out
      .replace(/\[\s*Peak\s+Revenue\s+Window\s*\]/gi, '[财富高峰窗口]')
      .replace(/\[\s*Financial\s+Black\s+Swan\s+Day\s*\]/gi, '[财务黑天鹅日]');
    if (out !== b0) tags = (b0.match(/Peak\s+Revenue\s+Window|Financial\s+Black\s+Swan\s+Day/gi) || []).length;
  }

  const lines = out.split('\n');
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── ② 干扰行: 「YYYY-YYYY …指标…仪表盘」标题(前端会吞成正文 + 生成半吊子锚点) → 删 ──
    if (i < 40 && /^\s*>?\s*#{1,6}\s*\S{0,4}\s*\d{4}\s*[-–—]\s*\d{4}[^\n]*指标/.test(line)) { dropped++; continue; }
    // ── ③ 空引用行(会渲染成空引用框) ──
    if (/^\s*>\s*$/.test(line)) { dropped++; continue; }

    const head = line.match(/^\s*>?\s*(#{1,6})\s*(.*)$/);
    if (head) {
      const hashes = head[1].length;
      const body = head[2];

      // ── ④ 月标题归一: 层级锁 ### + 分隔符锁「半角冒号+空格」(分隔符允许重复, 如 `——`) ──
      const mo = body.match(new RegExp('^(\\d{4}\\s*年\\s*\\d{1,2}\\s*月)\\s*' + _V480_SEP + '+\\s*(\\S.*?)\\s*$'));
      if (mo) { titles++; kept.push('### ' + mo[1].replace(/\s+/g, '') + ': ' + mo[2]); continue; }
      if (lang !== 'zh') {
        const mon = lang === 'en' ? _V480_EN_MON : _V480_ES_MON;
        const em = body.match(new RegExp('^((?:' + mon + '))\\s+(\\d{4})\\s*' + _V480_SEP + '+\\s*(\\S.*?)\\s*$', 'i'));
        if (em) { titles++; kept.push('### ' + em[1] + ' ' + em[2] + ': ' + em[3]); continue; }
      }

      // ── ⑤ 章节锚点归一: 一律 `## `, 并剥两端装饰前缀/后缀 ──
      const bare = body.replace(_V480_DECOR, '').replace(_V480_DECOR_TAIL, '');
      //   🛠️ V481-fix: 剥完装饰后为空(如 `# ✦` / 被 standardizeReport 劈碎的 `# `) → 删, 不再渲染成空标题块。
      if (bare === '') { dropped++; continue; }
      if (_V480_CHAP_KW.test(bare)) { chaps++; kept.push('## ' + bare); continue; }

      // ── ⑥ 其余标题: 剥装饰前缀; H1 保留, 2-6 级统一锁 `### `(与月标题同构, 老正则不再漏网) ──
      const nh = hashes === 1 ? 1 : 3;
      if (bare !== body || hashes !== nh) heads++;
      kept.push('#'.repeat(nh) + ' ' + bare);
      continue;
    }

    // ── ⑦ 头部块(前 25 行): 去 ◇/◆/✦ 漂移符 + 粗体星号配对修复(奇数额 → 去本行 **) ──
    let l2 = line.replace(/^(\s*>?\s*(?:\*\s*)?)[◇◆✦]\s*/, '$1');
    if (i < 25) {
      if (((l2.match(/\*\*/g) || []).length) % 2 === 1) { l2 = l2.replace(/\*\*/g, ''); heads++; }
    }
    if (l2 !== line) heads++;
    kept.push(l2);
  }

  out = kept.join('\n');
  if (titles || chaps || dropped || heads || tags) {
    console.log(`[V480] ${lang} 年报结构归一: 月标题 ${titles} | 章节 ${chaps} | 删干扰行 ${dropped} | 装饰/头部 ${heads} | 标签本地化 ${tags}`);
  }
  return out;
}

// ═══════════════════════════════════════════════════════════
// V434-1: 行星修饰词错配硬锁（Qualifier Alignment）
// ═══════════════════════════════════════════════════════════
// 病根：LLM 偶发把「逆行」贴在太阳/月亮身上（天文上日月永不逆行）→ 懂行用户一眼假。
// 铁律：只在「紧邻」日月处剥离（括号内 / 日月后紧跟修饰词），绝不跨子句误伤其他行星的合法逆行。
// ⚠️ CJK/泰文不用 \b（JS \w 仅 [A-Za-z0-9_]，\b 对中文/泰文失效）→ 字符串表 + new RegExp(str)
const _V434_LUM_SRC = {
  en: 'Sun|Moon', es: 'Sol|Luna', zh: '太阳|月亮',
  vi: 'Mặt Trời|Mặt Trăng', fr: 'Soleil|Lune', th: 'ดวงอาทิตย์|ดวงจันทร์',
};
const _V434_RETRO_SRC = {
  en: '\\bin\\s+retrograde\\b|\\bretrograde\\b|\\brx\\b',
  es: '\\ben\\s+retrogradación\\b|\\bretrógrad[oa]s?\\b|\\bretrograd[oa]s?\\b',
  zh: '处于逆行(?:状态|中)?|逆行(?:状态|中)?',
  vi: '\\bđang\\s+nghịch\\s+hành\\b|\\bnghịch\\s+hành\\b',
  fr: '\\ben\\s+rétrogradation\\b|\\brétrogrades?\\b',
  th: 'กำลังถอยหลัง|ถอยหลัง',
};
function _v434LockQualifiers(text, lang) {
  if (!text || typeof text !== 'string') return text;
  const lum = _V434_LUM_SRC[lang], retro = _V434_RETRO_SRC[lang];
  if (!lum || !retro) return text;
  let out = text, n = 0;
  // 1) 括号形式：日月（…逆行…） → 日月
  const bre = new RegExp('(' + lum + ')\\s*[\\(（][^\\)）]{0,24}?(?:' + retro + ')[^\\)）]{0,16}[\\)）]', 'gi');
  out = out.replace(bre, (m, l) => { n++; return l; });
  // 2) 紧邻修饰词：日月 [系动词] 逆行词 → 日月（其余行星的合法逆行不受影响）
  const are = new RegExp('(' + lum + ')\\s*(?:(?:is|est|đang|กำลัง|处于|正)\\s*)?(?:' + retro + ')(?=[\\s,，、.。;；!！?？]|$)', 'gi');
  out = out.replace(are, (m, l) => { n++; return l; });
  if (n) console.log('[V434] 行星修饰词锁: 剥离日月误贴逆行 ' + n + ' 处 (lang=' + lang + ')');
  return out;
}

// ═══════════════════════════════════════════════════════════
// V434-2: 全范围月亮声明一致性硬锁（Global Moon Scope）
// ═══════════════════════════════════════════════════════════
// V433 只处理「带周号」段落；无周号段落（概览/陷阱/前言）走全月并集但**越界星座不纠**（first=null）。
// 此锁补齐：非周段落里出现「全月真值并集之外」的月亮星座 → 归正为「本月主导星座」（腿数最多者）。
// 只纠可证伪的（不在并集内），并集内一律不碰——宁可不动，不可编。
function _v434HouseFmt(lang, n) {
  switch (lang) {
    case 'zh': return '第' + n + '宫';
    case 'vi': return 'Nhà ' + n;
    case 'es': return 'Casa ' + n;
    case 'fr': return 'Maison ' + n;
    case 'th': return 'บ้าน ' + n;
    default: return 'House ' + n;
  }
}
// 持续性声明词：月亮 ~2.5 天换一座，绝无可能「整月停留某座」→ 命中即可证伪
const _V434_PERSIST_SRC = {
  en: 'spends most of the month|most of the month|throughout the month|all month long|all month|stays in|remains in',
  es: 'la mayor parte del mes|todo el mes|permanece|se queda',
  zh: '主要停留在|整月停留|整个月|全月|整月|一直停留|大部分时间',
  vi: 'phần lớn tháng|suốt tháng|toàn bộ tháng|cả tháng',
  fr: 'la majeure partie du mois|tout le mois|reste dans|demeure',
  th: 'ส่วนใหญ่ของเดือน|ตลอดทั้งเดือน|ทั้งเดือน',
};
const _V434_TRAV = {
  en: (l) => 'travels through ' + l.join(' → ') + ' this month',
  es: (l) => 'recorre este mes ' + l.join(' → '),
  zh: (l) => '本月依次经过' + l.join('、'),
  vi: (l) => 'đi qua lần lượt ' + l.join(' → ') + ' trong tháng này',
  fr: (l) => 'traverse ce mois ' + l.join(' → '),
  th: (l) => 'เดือนนี้เคลื่อนผ่าน ' + l.join(' → '),
};
function _v434Trajectory(lang, weeks) {
  const LMAP = { en: SUN_SIGN_EN, es: SUN_SIGN_ES, zh: SUN_SIGN_ZH, fr: SUN_SIGN_FR, th: SUN_SIGN_TH, vi: SUN_SIGN_VI };
  const L = LMAP[lang]; const out = [];
  if (!L) return out;
  for (const w of weeks) for (const lg of w.legs) {
    const li = _EN2ZIDX[lg.sign];
    if (li == null) continue;
    const nm = L[li];
    if (!out.length || out[out.length - 1] !== nm) out.push(nm);
  }
  return out;
}
function _v434LockGlobalMoonScope(text, lang, astroMatrix) {
  const weeks = astroMatrix && astroMatrix.months && astroMatrix.months[0] && astroMatrix.months[0].moon_weeks;
  if (!text || typeof text !== 'string' || !Array.isArray(weeks) || !weeks.length) return text;
  const LMAP = { en: SUN_SIGN_EN, es: SUN_SIGN_ES, zh: SUN_SIGN_ZH, fr: SUN_SIGN_FR, th: SUN_SIGN_TH, vi: SUN_SIGN_VI };
  const L = LMAP[lang];
  if (!L || !L.length) return text;
  const union = new Set(), cnt = {}, uh = {};
  for (const w of weeks) for (const lg of w.legs) {
    const li = _EN2ZIDX[lg.sign];
    if (li == null) continue;
    union.add(li); cnt[li] = (cnt[li] || 0) + 1;
    (uh[li] = uh[li] || new Set()).add(lg.house);
  }
  if (!union.size) return text;
  let dom = -1, best = -1;
  for (let i = 0; i < L.length; i++) if ((cnt[i] || 0) > best) { best = cnt[i] || 0; dom = i; }
  if (dom < 0) return text;
  const traj = _v434Trajectory(lang, weeks);
  const moonRe = { es: '\\bLuna\\b', vi: '\\bMặt Trăng\\b', zh: '月亮', en: '\\bMoon\\b', fr: '\\bLune\\b', th: 'ดวงจันทร์' }[lang];
  if (!moonRe) return text;
  const houseRe = { es: /Casa\s*(\d{1,2})/i, vi: /Nhà\s*(\d{1,2})/i, zh: /第\s*(\d{1,2})\s*宫/, en: /House\s*(\d{1,2})/i, fr: /Maison\s*(\d{1,2})/i, th: /บ้าน\s*(\d{1,2})/i }[lang];
  const persistRe = new RegExp(_V434_PERSIST_SRC[lang], 'i');
  const natalRe = /(natal|bản mệnh|本命|出生|de naissance|natif|generación|กำเนิด)/i;
  // 切段：✦ 分段的非周段落 + ✦ 之前的「前言」段（V433 从首个 ✦ 起切，前言是它的盲区）
  const segs = [];
  let sp = text.indexOf('✦');
  if (sp > 0) segs.push({ start: 0, end: sp, wk: 0 });
  while (sp !== -1) {
    const np = text.indexOf('✦', sp + 1);
    const seg = np === -1 ? text.slice(sp) : text.slice(sp, np);
    const hm = seg.match(/(?:Semana|Semaine|Tuần|Week|สัปดาห์ที่)\s*([1-4])|第\s*([1-4])\s*周|周\s*([1-4])/);
    segs.push({ start: sp, end: np === -1 ? text.length : np, wk: hm ? parseInt(hm[1] || hm[2] || hm[3], 10) : 0 });
    if (np === -1) break;
    sp = np;
  }
  const patches = [];
  let fixed = 0, persist = 0;
  for (const seg of segs) {
    if (seg.wk) continue;   // 带周号 → V433 管辖，V434 不侵入
    const segText = text.slice(seg.start, seg.end);
    const moonIt = new RegExp(moonRe, 'gi');
    let mp;
    while ((mp = moonIt.exec(segText)) !== null) {
      const mo = seg.start + mp.index;
      const pre = text.slice(Math.max(0, mo - 40), mo);                 // 月亮之前 40 字符（本命定语判定）
      const post = text.slice(mo + mp[0].length, mo + mp[0].length + 140);
      const cut = post.search(/[.\n。]/);
      const wr = cut >= 0 ? post.slice(0, cut) : post;                  // ⚠️ 只取「月亮之后、本句之内」
      const base = mo + mp[0].length;
      let si = -1, spos = -1;
      for (let i = 0; i < L.length; i++) {
        let p = wr.indexOf(L[i]);
        // V436: 泰语月名内嵌星座名 → 跳到下一个出现位置（否则日期词被当星座）
        while (p >= 0 && lang === 'th' && _v436InThMonth(text, base + p, L[i].length)) p = wr.indexOf(L[i], p + 1);
        if (p >= 0 && (spos < 0 || p < spos)) { si = i; spos = p; }
      }
      const pm = persistRe.exec(wr);
      // 本命月亮（前置/后置定语）→ 一律不动
      const guardTo = Math.min(spos >= 0 ? spos : 1e9, pm ? pm.index : 1e9, wr.length);
      if (natalRe.test(pre) || natalRe.test(wr.slice(0, guardTo))) continue;
      // ── 规则 1（主·真会触发）：持续性声明「月亮整月/主要停留在X座」 → 可证伪 → 换成真实轨迹 ──
      if (pm && si >= 0 && Math.abs(pm.index - spos) <= 40 && traj.length) {
        const s = base + Math.min(pm.index, spos);
        let e = base + Math.max(pm.index + pm[0].length, spos + L[si].length);
        const around = wr.slice(spos, spos + 60);
        const hm = around.match(houseRe);
        if (hm && spos + hm.index + hm[0].length > spos + L[si].length) e = base + spos + hm.index + hm[0].length;
        patches.push({ s, e, rep: _V434_TRAV[lang](traj) });
        persist++; fixed++;
        continue;
      }
      // ── 规则 2（兜底）：并集外星座 → 主导星座（正常月份并集=全黄道 12 座，此支路几乎不触发）──
      if (si < 0) continue;
      if (union.has(si)) continue;                     // 全月并集之内 → 合法，不碰
      const abs = base + spos;
      const around2 = wr.slice(spos, spos + 60);
      const hm2 = around2.match(houseRe);
      const th = uh[dom] ? Array.from(uh[dom]) : [];
      const rep = L[dom] + (hm2 && th.length ? ' ' + _v434HouseFmt(lang, th[0]) : '');
      const e2 = hm2 ? abs + hm2.index + hm2[0].length : abs + L[si].length;
      patches.push({ s: abs, e: Math.max(abs + L[si].length, e2), rep });
      fixed++;
    }
  }
  if (!patches.length) return text;
  patches.sort((a, b) => a.s - b.s || a.e - b.e);
  let out = text;
  for (let i = patches.length - 1; i >= 0; i--) {
    const p = patches[i];
    out = out.slice(0, p.s) + p.rep + out.slice(p.e);
  }
  console.log('[V434] 全范围月亮锁: 归正 ' + fixed + ' 处（持续性声明 ' + persist + ' 处）(lang=' + lang + ')');
  return out;
}

// ── V434 统一入口（月亮全范围锁 + 日月修饰词锁；幂等，无真值盘自动跳过）──
// ==================== V435: 日级月亮星座区间硬锁 ====================
// 【病根】V433 只锁「带周号」段落 + 只到「周」粒度；周内「日期–月亮星座」组合无人校验。
//   实测 Chatham 盘 W2：真值 8日 Cancer→Leo / 12日 12:37 Virgo→Libra / 14日 19:28 Libra→Scorpio，
//   而文案写「Día 12 ... Luna en tránsito en Escorpio」→ 星座在该周并集内（V433 放行），日期却对不上。
//
// 【真值来源】moon_weeks[].changes（kind='sign'/'cusp' + day + time）→ 现推逐日切片。
//   ⚠️ 星盘矩阵**没有** dailyMoonMap 字段（草案假设它存在 → 整把锁会 return 原文 = 静默死锁）；
//      必须从 changes 现推：换座当天产出两段（星座+宫位各带分钟权重）。
//
// 【硬约束（每条都对应一个已踩过的坑）】
//   ① 星座按「文本位置最近」选，绝不按星座字典顺序选（V430 的假阳性根因）
//   ② 必须是「月亮自己的」星座：月亮关键词之后若先出现其他行星名则截断（绝不改金星/水星的星座）
//   ③ 本命月亮不动：只查月亮关键词「紧邻前 40 / 紧邻后 16」，不做整窗排除（V433 跨子句教训）
//   ④ 区间内只要有任一天含该星座 → 合法放行（交集非空即合法，零误杀）
//   ⑤ 日期须带月份或显式日期词，日号 1..31，且月份必须是报告月
//   ⑥ 幂等；无真值盘 → 原文透传
const V435_MOON = { en: '\\bMoon\\b', es: '\\bLuna\\b', zh: '月亮', vi: 'Mặt Trăng', fr: '\\bLune\\b', th: 'ดวงจันทร์' };
const V435_PLANET = {
  en: '\\b(?:Sun|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto)\\b',
  es: '\\b(?:Sol|Mercurio|Venus|Marte|Júpiter|Saturno|Urano|Neptuno|Plutón)\\b',
  zh: '(?:太阳|水星|金星|火星|木星|土星|天王星|海王星|冥王星)',
  vi: '(?:Mặt Trời|Sao Thủy|Sao Kim|Sao Hỏa|Sao Mộc|Sao Thổ|Sao Thiên Vương|Sao Hải Vương|Sao Diêm Vương)',
  fr: '\\b(?:Soleil|Mercure|Vénus|Mars|Jupiter|Saturne|Uranus|Neptune|Pluton)\\b',
  th: '(?:ดวงอาทิตย์|ดาวพุธ|ดาวศุกร์|ดาวอังคาร|ดาวพฤหัสบดี|ดาวเสาร์|ดาวยูเรนัส|ดาวเนปจูน|ดาวพลูโต)',
};
const V435_HOUSE = {
  zh: '第\\s*(\\d{1,2})\\s*宫', en: '\\bHouse\\s*(\\d{1,2})', es: '\\bCasa\\s*(\\d{1,2})',
  vi: '\\bNhà\\s*(\\d{1,2})', fr: '\\bMaison\\s*(\\d{1,2})', th: '(?:บ้าน|ภพ)\\s*(\\d{1,2})',
};
const V435_NATAL = /(natal|natale|natif|native|de naissance|本命|出生|bản mệnh|กำเนิด)/i;
const V435_MONTHS = {
  en: { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 },
  es: { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 },
  fr: { janvier: 1, fevrier: 2, 'février': 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, 'août': 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12, 'décembre': 12 },
  th: { 'มกราคม': 1, 'กุมภาพันธ์': 2, 'มีนาคม': 3, 'เมษายน': 4, 'พฤษภาคม': 5, 'มิถุนายน': 6, 'กรกฎาคม': 7, 'สิงหาคม': 8, 'กันยายน': 9, 'ตุลาคม': 10, 'พฤศจิกายน': 11, 'ธันวาคม': 12 },
};
// 日期区间模式表：gN = 捕获组序号（1 起）；monName = 月份名组；monNum = 数值月份组
const V435_DATE_PATTERNS = {
  zh: [
    { re: /(\d{1,2})\s*月\s*(\d{1,2})\s*日?\s*(?:[-–~—]|至|到)\s*(?:(\d{1,2})\s*月\s*)?(\d{1,2})\s*日?(?![0-9])/g, gS: 2, gE: 4, monNum: 1, monNum2: 3 },
    { re: /(\d{1,2})\s*月\s*(\d{1,2})\s*日(?![0-9])/g, gS: 2, gE: null, monNum: 1 },
    // 🛠️ V435-fix1: LLM 周段落常用裸日格式「X日月亮进入Y座」（省略「X月」），旧正则不匹配→V435 整体跳过→日期句幻觉裸奔
    { re: /(?<![0-9月])(\d{1,2})\s*日(?![0-9年])/g, gS: 1, gE: null, monNum: null, bareDay: true },
  ],
  en: [
    { re: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?![0-9])\s*(?:[-–~—]|to|through|until)\s*(\d{1,2})(?![0-9])/gi, gS: 2, gE: 3, monName: 1 },
    { re: /(?:on\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?![0-9])/gi, gS: 2, gE: null, monName: 1 },
  ],
  es: [
    { re: /(\d{1,2})(?![0-9])\s*(?:al|a|hasta|[-–~—])\s*(\d{1,2})(?![0-9])\s+de\s+([a-záéíóúñ]+)/gi, gS: 1, gE: 2, monName: 3 },
    { re: /d[íi]a\s+(\d{1,2})(?![0-9])/gi, gS: 1, gE: null },
  ],
  vi: [
    { re: /ng[àa]y\s+(\d{1,2})(?![0-9])\s*(?:[-–~—]|đến|tới)\s*(\d{1,2})(?![0-9])/gi, gS: 1, gE: 2 },
    { re: /ng[àa]y\s+(\d{1,2})(?![0-9])/gi, gS: 1, gE: null },
  ],
  fr: [
    { re: /(\d{1,2})(?![0-9])\s*(?:au|à|[-–~—])\s*(\d{1,2})(?![0-9])\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/gi, gS: 1, gE: 2, monName: 3 },
    { re: /(?:(?:le|du)\s+)?(\d{1,2})(?![0-9])\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)/gi, gS: 1, gE: null, monName: 2 },
  ],
  th: [
    { re: /วันที่\s*(\d{1,2})(?![0-9])\s*(?:[-–~—]|ถึง)\s*(\d{1,2})(?![0-9])/g, gS: 1, gE: 2 },
    { re: /วันที่\s*(\d{1,2})(?![0-9])/g, gS: 1, gE: null },
  ],
};

function _v435Key(y, m, d) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
function _v435Min(t) { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); return m ? (+m[1]) * 60 + (+m[2]) : 0; }

/** 由 moon_weeks[].changes 现推「逐日切片真值表」：{ year, month, map: {'YYYY-MM-DD': [{sign,house,mins}]} } */
function _v435DailyMap(astroMatrix) {
  const m0 = astroMatrix && astroMatrix.months && astroMatrix.months[0];
  const weeks = m0 && m0.moon_weeks;
  if (!Array.isArray(weeks) || !weeks.length) return null;
  const mm = /^(\d{4})-(\d{1,2})$/.exec(String(m0.month_key || ''));
  if (!mm) return null;
  const year = +mm[1], month = +mm[2];
  const all = [];
  for (const w of weeks) for (const c of (w.changes || [])) if ((c.kind === 'sign' || c.kind === 'cusp') && c.day) all.push(c);
  if (!all.some((c) => c.kind === 'sign')) return null;   // 无换座数据 → 不做（宁可不锁，绝不瞎猜）
  all.sort((a, b) => (a.day - b.day) || String(a.time || '00:00').localeCompare(String(b.time || '00:00')));
  const firstDay = Math.min(...weeks.map((w) => w.from_day));
  const lastDay = Math.max(...weeks.map((w) => w.to_day));
  const w0 = weeks[0] || {};
  const startSign = (w0.start && w0.start.sign) || (w0.legs && w0.legs[0] && w0.legs[0].sign);
  if (!startSign) return null;
  const map = {};
  for (let d = firstDay; d <= lastDay; d++) {
    let cur = { sign: startSign, house: (w0.start && w0.start.house) || (w0.legs && w0.legs[0] && w0.legs[0].house) || null };
    for (const c of all) if (c.day < d) cur = { sign: c.to_sign || cur.sign, house: c.to_house || cur.house };
    const same = all.filter((c) => c.day === d);
    const segs = [];
    let t = 0;
    for (const c of same) {
      const mins = _v435Min(c.time);
      segs.push({ sign: cur.sign, house: cur.house, mins: Math.max(0, mins - t) });
      cur = { sign: c.to_sign || cur.sign, house: c.to_house || cur.house };
      t = mins;
    }
    segs.push({ sign: cur.sign, house: cur.house, mins: Math.max(0, 1440 - t) });
    map[_v435Key(year, month, d)] = segs;
  }
  return { year, month, map };
}

/** 区间真值：valid=该区间出现过的星座集合（交集判据）；dom=占时最长星座；domHouse=该星座占时最长的宫位 */
function _v435RangeTruth(dm, sd, ed) {
  const mins = {}, hMins = {};
  for (let d = sd; d <= ed; d++) {
    const segs = dm.map[_v435Key(dm.year, dm.month, d)];
    if (!segs) continue;
    for (const s of segs) {
      mins[s.sign] = (mins[s.sign] || 0) + s.mins;
      const k = s.sign + '|' + s.house;
      hMins[k] = (hMins[k] || 0) + s.mins;
    }
  }
  const signs = Object.keys(mins);
  if (!signs.length) return null;
  let dom = signs[0];
  for (const s of signs) if (mins[s] > mins[dom]) dom = s;
  let domHouse = null, best = -1;
  for (const k of Object.keys(hMins)) {
    const i = k.lastIndexOf('|');
    if (k.slice(0, i) === dom && hMins[k] > best) { best = hMins[k]; domHouse = +k.slice(i + 1); }
  }
  return { valid: new Set(signs), dom, domHouse };
}

/** 取日期区间文本 → 候选列表 [{s,e,sd,ed}]（月份必须与报告月一致） */
function _v435CollectDates(text, lang, tM) {
  const specs = V435_DATE_PATTERNS[lang];
  if (!specs) return [];
  const out = [];
  for (const sp of specs) {
    const re = new RegExp(sp.re.source, sp.re.flags);
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      const sd = parseInt(m[sp.gS], 10);
      const ed = sp.gE ? parseInt(m[sp.gE], 10) : sd;
      if (!(sd >= 1 && sd <= 31 && ed >= 1 && ed <= 31 && sd <= ed)) continue;
      let mon = tM;
      if (sp.monNum) {
        mon = parseInt(m[sp.monNum], 10);
        if (mon !== tM) continue;                                  // 非报告月 → 跳过
        if (sp.monNum2 && m[sp.monNum2] && parseInt(m[sp.monNum2], 10) !== tM) continue;
      }
      if (sp.monName) {
        const key = String(m[sp.monName] || '').toLowerCase();
        const mp = V435_MONTHS[lang] || {};
        let found = 0;
        for (const k of Object.keys(mp)) if (key.startsWith(k.slice(0, 3)) || key === k) { found = mp[k]; break; }
        if (!found || found !== tM) continue;                      // 认不出/非报告月 → 跳过
      }
      out.push({ s: m.index, e: m.index + m[0].length, sd, ed });
    }
  }
  // 折叠重叠（同一起点保留最长）
  return out.sort((a, b) => a.s - b.s || b.e - a.e).filter((x, i, arr) => i === 0 || x.s >= arr[i - 1].e);
}

/** 在日期所在句内找到「月亮自己的」星座 → { signStart, signEnd, signIdx, hStart, hEnd, hNum } */
function _v435FindMoonSign(text, ds, de, lang, L) {
  const moonStr = V435_MOON[lang];
  if (!moonStr) return null;
  const B = /[.!?。！？\n;；]/;
  let cs = ds, ce = de;
  while (cs > 0 && !B.test(text[cs - 1]) && (ds - cs) < 220) cs--;
  while (ce < text.length && !B.test(text[ce]) && (ce - de) < 220) ce++;
  const clause = text.slice(cs, ce);
  const relS = ds - cs;
  const moonIt = new RegExp(moonStr, 'gi');
  let best = null, bestD = 1e9, mm;
  while ((mm = moonIt.exec(clause)) !== null) {
    const st = mm.index, en = mm.index + mm[0].length;
    const d = (en <= relS) ? relS - en : (st >= relS ? st - relS : 0);
    if (d < bestD) { bestD = d; best = { st, en }; }
  }
  if (!best || bestD > 130) return null;                            // 月亮不在该日期附近
  if (V435_NATAL.test(clause.slice(Math.max(0, best.st - 40), best.st))) return null;   // 本命月亮（前置）
  if (V435_NATAL.test(clause.slice(best.en, best.en + 16))) return null;                // 本命月亮（后置）
  let seg = clause.slice(best.en, best.en + 70);
  const pRe = V435_PLANET[lang];
  if (pRe) { const cp = seg.search(new RegExp(pRe, 'i')); if (cp >= 0) seg = seg.slice(0, cp); }   // 截断到下一个行星
  let si = -1, sp = -1;
  for (let i = 0; i < L.length; i++) {
    let p = seg.indexOf(L[i]);
    // V436: 泰语月名内嵌星座名 → 跳过（否则日期词被当星座，宫位张冠李戴）
    while (p >= 0 && lang === 'th' && _v436InThMonth(text, cs + best.en + p, L[i].length)) p = seg.indexOf(L[i], p + 1);
    if (p >= 0 && (sp < 0 || p < sp)) { sp = p; si = i; }           // ① 按位置最近选，不按字典序
  }
  if (si < 0) return null;
  const signStart = cs + best.en + sp;
  const signEnd = signStart + L[si].length;
  let hNum = null, hStart = -1, hEnd = -1;
  const hPat = V435_HOUSE[lang];
  if (hPat) {
    const after = text.slice(signEnd, signEnd + 24);
    const hm = after.match(new RegExp('^\\s*[,，、（(]?\\s*' + hPat));
    if (hm) {
      hNum = parseInt(hm[1], 10);
      hStart = signEnd + hm[0].indexOf(hm[1]);
      hEnd = hStart + hm[1].length;
    }
  }
  return { signStart, signEnd, signIdx: si, hStart, hEnd, hNum };
}

/**
 * V435 主锁：校验并归正「日期–月亮星座」组合（区间 + 显式单日）
 * @param {string} text 报告文本
 * @param {string} lang 语言码
 * @param {object} astroMatrix 星盘矩阵（含 months[0].moon_weeks）
 */
function _v435LockMoonDailyRanges(text, lang, astroMatrix) {
  if (!text || typeof text !== 'string') return text;
  const L = ({ en: SUN_SIGN_EN, es: SUN_SIGN_ES, zh: SUN_SIGN_ZH, fr: SUN_SIGN_FR, th: SUN_SIGN_TH, vi: SUN_SIGN_VI })[lang];
  if (!L || !V435_MOON[lang]) return text;
  const dm = _v435DailyMap(astroMatrix);
  if (!dm) return text;
  const dates = _v435CollectDates(text, lang, dm.month);
  if (!dates.length) return text;
  const patches = [];
  for (const dt of dates) {
    const claim = _v435FindMoonSign(text, dt.s, dt.e, lang, L);
    if (!claim) continue;
    const claimedEn = Object.keys(_EN2ZIDX).find((k) => _EN2ZIDX[k] === claim.signIdx);
    if (!claimedEn) continue;
    const truth = _v435RangeTruth(dm, dt.sd, dt.ed);
    if (!truth) continue;
    if (truth.valid.has(claimedEn)) continue;                        // ④ 交集非空 → 合法放行
    const domIdx = _EN2ZIDX[truth.dom];
    if (domIdx === undefined || domIdx === claim.signIdx) continue;
    patches.push({ s: claim.signStart, e: claim.signEnd, txt: L[domIdx], tag: `${claimedEn}→${truth.dom}@${dt.sd}-${dt.ed}` });
    if (claim.hNum && truth.domHouse && claim.hStart >= 0) {
      patches.push({ s: claim.hStart, e: claim.hEnd, txt: String(truth.domHouse) });
    }
  }
  if (!patches.length) return text;
  patches.sort((a, b) => b.s - a.s);                                 // 倒序应用，保证索引不漂
  let out = text, guard = Infinity, done = [];
  for (const p of patches) {
    if (p.e > guard) continue;                                       // 与已应用补丁重叠 → 跳过
    out = out.slice(0, p.s) + p.txt + out.slice(p.e);
    guard = p.s;
    if (p.tag) done.push(p.tag);
  }
  if (done.length) console.log(`[V435] 月亮日级区间锁: 归正 ${done.length} 处 (lang=${lang}) | ${done.slice(0, 4).join(' ')}`);
  return out;
}

function applyV434Locks(text, lang, astroMatrix) {
  if (!text || typeof text !== 'string') return text;
  try {
    // V435 日级区间锁先做（位置敏感：它按「日期所在句」定位星座，必须在全局改写之前）
    let out = _v435LockMoonDailyRanges(text, lang, astroMatrix);
    out = _v434LockGlobalMoonScope(out, lang, astroMatrix);
    out = _v434LockQualifiers(out, lang);
    return out;
  } catch (e) {
    console.warn('[V434] ' + lang + ' 锁异常（原文透传）: ' + e.message);
    return text;
  }
}

function cleanConsumerTrapAndBrackets(text) {
  if (!text) return text;

  // 🛠️ V216-fix: 过滤 DeepSeek 幻觉吐出的 LaTeX 源码（5种触发）
  if (/\\begin\{|documentclass|begin\{|usepackage|\\[a-z]/i.test(text) || /```.?latex/i.test(text)) {
    // 1. 抹掉 ```latex 标签行
    text = text.replace(/```\.?latex\n?/gi, '');
    // 2. 抹掉 \begin{...}...\end{...} 块
    text = text.replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, '');
    // 3. 抹掉 LaTeX 命令+花括号参数
    text = text.replace(/\\[a-zA-Z]+(?:\[[^\]]*\])?\{[^}]*\}/g, ' ');
    // 4. 抹掉超长花括号（20字符以上，多半是 LaTeX 参数）
    text = text.replace(/\{[^}]{20,}\}/g, '');
    // 5. 抹掉裸LaTeX命令词
    text = text.replace(/\b(documentclass|usepackage|begin|end|section|article|geometry|fontspec|xcolor)\b/gi, ' ');
  }

  // ═══════════════════════════════════════════════════════════
  // V200 激进清洗引擎（军师方案）
  // 解决：宫位括号错位、孤立右括号残余、消费陷阱切片头缺失
  // ═══════════════════════════════════════════════════════════

  // 1. 修复所有类型的宫位括号错位/畸变
  // （第12）宫 / (第12)宫 → （第12宫）
  text = text.replace(/[（\(]\s*第\s*(\d+)\s*[）\)]\s*宫/g, '（第$1宫）');
  // （第）12宫 / (第)12宫 → （第12宫）
  text = text.replace(/[（\(]\s*第\s*[）\)]\s*(\d+)\s*宫/g, '（第$1宫）');
  // 第12）宫 / 第12)宫 → （第12宫）
  text = text.replace(/(?<![（\(])第\s*(\d+)\s*[）\)]\s*宫/g, '（第$1宫）');

  // 2. 激进算法：剥离所有无左括号配对的"孤立右括号"（栈扫描）
  // 🛠️ V209-fix: 不统一转为中文括号，按原文半角/全角保留，只抹孤立闭括号
  text = text.split('\n').map(line => {
    const result = [];
    let openBrackets = 0;
    for (const char of line) {
      if (char === '（' || char === '(') {
        openBrackets++;
        result.push(char); // 原样保留
      } else if (char === '）' || char === ')') {
        if (openBrackets > 0) {
          openBrackets--;
          result.push(char); // 有配对，保留
        }
        // 否则跳过（孤立右括号，抹除）
      } else {
        result.push(char);
      }
    }
    return result.join('');
  }).join('\n');

  // 3. 多语言消费陷阱标头与 ✦ 分隔符强行补齐
  // 关键词: 中文"消费陷阱" / 英文"Spending Trap""Financial Shadow" / 泰语"กับดักการใช้จ่าย""เงาการเงิน" / 越南语"Bẫy chi tiêu" / 西班牙语"Trampa de gasto" / 法语"Piège de dépense""Ombre Financière"
  // Step A: 确保 [⚠️ ...] 格式（多语言）
  // 🛠️ V209-fix: 兼容 [Sombra Financiera] Trampas de Gasto Jul 2026] 这类行末带内容的裸头
  // 也兼容纯 [Sombra Financiera] 后接换行的简单裸头
  text = text.replace(/^(?!\[)(\[?\s*)(Sombra Financiera|Sombra Financiera de Gasto|Ombre Financière|消费陷阱|Spending Trap|Financial Shadow|กับดักการใช้จ่าย|เงาการเงิน|Bẫy chi tiêu|Trampa de gasto|Piège de dépense)[^\n\[]*$/gm, (m, prefix, kw) => {
    // 已经有 [ 的直接升级，没有的补上
    if (prefix.includes('[')) return '✦\n' + m.trim();
    return '✦\n[' + kw + '] ' + m.replace(prefix, '').replace(kw, '').trim();
  });
  text = text.replace(/^(?!\[)(⚠️\s*(?:消费陷阱|Spending Trap|Financial Shadow|Sombra Financiera|Sombra Financiera de Gasto|กับดักการใช้จ่าย|เงาการเงิน|Bẫy chi tiêu|Trampa de gasto|Piège de dépense|Ombre Financière)[^\n]*)$/gm, '✦\n[$1]');
  // Step B: 匹配各语言的消费陷阱关键词并补 [⚠️ ...]
  text = text.replace(/^(\[\s*)(เงาการเงิน|กับดักการใช้จ่าย|Ombre Financière|Piège de dépense)([^\]]*\])$/gm, '[⚠️ $1$2$3');
  text = text.replace(/^\[(เงาการเงิน|Ombre Financière)[^\]]*\]/gm, '[⚠️ $1]');
  // Step C: 确保 [⚠️ ...] 前面有 ✦ 分隔符
  text = text.replace(/(?<!✦\n)(^\s*\[⚠️\s*(?:消费陷阱|Spending Trap|Financial Shadow|Sombra Financiera|Sombra Financiera de Gasto|กับดักการใช้จ่าย|เงาการเงิน|Bẫy chi tiêu|Trampa de gasto|Piège de dépense|Ombre Financière)[^\n]*\])/gm, '✦\n$1');
  // Step D: 规范化消费陷阱内部的冒号
  text = text.replace(/\[⚠️\s*(消费陷阱|Spending Trap|Financial Shadow|Sombra Financiera|Sombra Financiera de Gasto|กับดักการใช้จ่าย|เงาการเงิน|Bẫy chi tiêu|Trampa de gasto|Piège de dépense|Ombre Financière)\s*([：:]?)\s*/g, '[⚠️ $1：');

  // ═══════════════════════════════════════════════════════════
  // 4. V201: CoT 泄漏清洗（AI 内心戏喷出）
  // 匹配: (note: xxx) (注意：xxx) (note – xxx) (注意 - xxx)
  // ═══════════════════════════════════════════════════════════
  text = text.replace(/\s*\([Nn]ote\s*[：:\-–—]\s*[^)]*\)/g, ''); // 英文 note
  text = text.replace(/\s*\(注意[：:\-–—][^)]*\)/g, ''); // 中文 注意
  // V203-fix3: 全角括号内的 CoT 泄漏（中文全角括号包裹的内心戏）
  text = text.replace(/（[^）]*(?:note|Je me corrige|correction|根据数据|数据说|rules say|data says|Verification|Mais la données|Mars est|Vérifions|Je me corrige)[^）]*）/gi, '');
  text = text.replace(/\s*\(note\s*:[^)]*\)/gi, ''); // note: 格式
  text = text.replace(/\s*\(note\s*–[^)]*\)/gi, ''); // note – 格式
  // 激进清洗：任何包含 "Je me corrige" "correction" "根据数据" "数据说" 的括号内容
  text = text.replace(/\([^)]*(?:Je me corrige|correction|根据数据|数据说|rules say|data says)[^)]*\)/gi, '');
  // V203-fix2: CoT 泄漏增强版——空格位置更灵活 (note : xxx) (note:xxx) (note - xxx) 全覆盖
  text = text.replace(/\s*\([Nn]ote\s*[：:\-\u2013\u2014]\s*[^)]*\)/g, '');
  text = text.replace(/\s*\([Nn]ote\s+[^)]*\)/gi, ''); // 任意 "(note " 格式（无严格分隔符）

  // ═══════════════════════════════════════════════════════════
  // 5. V201: 缺失左括号修复（多语言周标题）
  // 匹配: 标题名] 但前面没有 [
  // ═══════════════════════════════════════════════════════════
  // 法语周标题: Semaine 1: xxx]  → [Semaine 1: xxx]
  text = text.replace(/^(?!\[)(Semaine\s*\d+[：:\s][^\]\n]+)\]/gm, '[$1]');
  // 泰语周标题: สัปดาห์ที่ 1: xxx]  → [สัปดาห์ที่ 1: xxx]
  text = text.replace(/^(?!\[)(สัปดาห์ที่\s*\d+[：:\s][^\]\n]+)\]/gm, '[$1]');
  // 越南语周标题: Tuần 1: xxx]  → [Tuần 1: xxx]
  text = text.replace(/^(?!\[)(Tuần\s*\d+[：:\s][^\]\n]+)\]/gm, '[$1]');
  // 西班牙语周标题: Semana 1: xxx]  → [Semana 1: xxx]
  text = text.replace(/^(?!\[)(Semana\s*\d+[：:\s][^\]\n]+)\]/gm, '[$1]');
  // 英语周标题: Week 1: xxx]  → [Week 1: xxx]
  text = text.replace(/^(?!\[)(Week\s*\d+[：:\s][^\]\n]+)\]/gm, '[$1]');
  // 法语主题标题: Aperçu] xxx  → [Aperçu: xxx]
  text = text.replace(/^(?!\[)(Aperçu)\]/gm, '[$1]');

  // V203: 激进修复 Sombra Financiera] Trampas de Gasto Jul 2026] 格式问题
  text = text.replace(/^\[\s*((?:Sombra Financiera|Sombra Financiera de Gasto|Ombre Financière)[^\]]*?)\s*\]\s*([^\n]+)$/gm, '[⚠️ $1： $2]');

  // 4. 消费陷阱第2段标题清理: [⚠️ xxx:——xxx] → [⚠️ xxx: xxx]
  text = text.replace(/\[⚠️ ([^\]]*?)[：:]——/g, '[⚠️ $1：');

  // ═══════════════════════════════════════════════════════════
  // V204: 泰语专项修复（军师实测发现）
  // ═══════════════════════════════════════════════════════════
  // 1) 修复 สัปดาห์ที่ 2: ก] .ค. → สัปดาห์ที่ 2: ก.ค. （第2周括号错位）
  text = text.replace(/สัปดาห์ที่\s*(\d+)[：:\s]*ก\s*\]\s*\.\s*ค\.\s*(\d+)[–\-]*(\d+)/g,
    'สัปดาห์ที่ $1: ก.ค. $2–$3');
  // 2) 修复裸周标题 สัปดาห์ที่ 4: ก.ค. 23–31 缺失 [
  text = text.replace(/^(?!\[)(สัปดาห์ที่\s*\d+[：:\s][^\n\[\]]+)$/gm, '[$1]');
  // 3) 修复末尾 เงาการเงิน] กับดัก → [⚠️ เงาการเงิน：กับดักการใช้จ่าย ...]
  text = text.replace(
    /^(?!\[)(เงาการเงิน[：:\s]*(?:กับดักการใช้จ่าย|[^\n]*))(ก\.ค\.\s*\d{4})?([\n]*)$/gm,
    '[⚠️ $1$3'
  );
  // 4) 激进兜底：任何 เงาการเงิน 结尾裸 ] 强制补全
  text = text.replace(/^(เงาการเงิน[^\[]*)\](\s*$)/gm, '[⚠️ $1]');

  // 🛠️ V213: 括号安全守卫——防止 cleanConsumerTrapAndBrackets 误删有效括号
  // 当 cleanConsumerTrapAndBrackets 处理后仍有 dangling 开括号时，用此兜底修复
  // 例: （第11宫的 → （第11宫）的 / （第11宫与 → （第11宫）与
  text = text.replace(/（第([一二三四五六七八九十百零\d]+)宫(?!）)/g, '（第$1宫）');

  // 🛠️ V214: 周次颜色强制规范化（所有语言）
  text = fixWeekHeaderColors(text);
  text = guardWeekDateDrift(text); // V215 星象日期-周次校验

  // 5. 规范化空行
  text = text.replace(/\n{3,}/g, '\n\n');

  return text;
}

// 🛡️ E10/R9-R3（军师裁决 3）: CRITIC 拦截后的强约束重生成 prompt 块
//   语境: 预检（wealthCriticCheck / assessYearlyReportIntegrity）拦截 → 静默重试 1 次。
//   内容 = 本次实测三大伤的针对性铁律: 报头轴点/称谓（Rising Leo / O child of Leo 实证）、
//   本命/流年分野（第 1 章宫位）、元素归属（"双子座被错误归入土元素" 实证）。
function _E10_RETRY_CONSTRAINT(lang, sunEN, risingEN) {
  if (lang === 'zh') {
    return '\n\n\u26d4 \u7ec8\u5c40\u8d28\u91cf\u95f8\u2014\u2014\u4e0a\u4e00\u7a3f\u5df2\u88ab\u9884\u68c0\u9a73\u56de\uff0c\u91cd\u5199\u65f6\u9010\u6761\u9075\u5b88\uff1a'
      + (risingEN ? '\n1) \u62a5\u5934 Core Natal Code \u7684\u4e0a\u5347\u661f\u5ea7\u53ea\u80fd\u5199 ' + risingEN + '\uff0c\u5168\u6587\u4efb\u4f55\u300c\u4e0a\u5347/Rising/Ascendant\u300d\u58f0\u660e\u4e00\u5f8b\u7528\u6b64\u503c\uff1b' : '')
      + (sunEN ? '\n2) \u5f00\u7bc7\u79f0\u8c13\u53ea\u80fd\u5199\u300cO child of ' + sunEN + '\u300d\uff0c\u592a\u9633\u661f\u5ea7\u4e0d\u51c6\u6539\u5199\uff1b' : '')
      + '\n3) \u672c\u547d\u5bab\u4f4d/\u661f\u5ea7\u53ea\u80fd\u53d6\u81ea\u4e0a\u65b9\u6ce8\u5165\u7684 SwissEph \u771f\u503c\u8868\uff0c\u7edd\u4e0d\u501f\u7528\u884c\u8fd0\u4f4d\uff1b'
      + '\n4) \u5143\u7d20\u5f52\u5c5e\u5fc5\u987b\u7b26\u5408\u5929\u6587\u4e8b\u5b9e\uff08\u5982\u53cc\u5b50\u5ea7=\u98ce\u8c61\uff09\uff1b'
      + '\n5) \u7b2c 1 \u7ae0\u53ea\u5199\u672c\u547d\uff0c\u6d41\u5e74\u58f0\u660e\u5fc5\u987b\u5e26\u300c\u6d41\u5e74/20XX\u300d\u9650\u5b9a\u8bcd\u3002';
  }
  return '\n\n\u26d4 FINAL QUALITY GATE \u2014 your previous draft was REJECTED by preflight. Rewrite under these MANDATORY rules:'
    + (risingEN ? '\n1) The header Core Natal Code Rising field MUST be exactly: Rising ' + risingEN + '. EVERY "Rising/Ascendant" mention in the whole report MUST use this sign \u2014 never any other.' : '')
    + (sunEN ? '\n2) The opening salutation MUST be "O child of ' + sunEN + '" \u2014 the natal Sun sign is immutable.' : '')
    + '\n3) Every NATAL sign/house claim (including bare ordinals like "in the 7th") MUST come ONLY from the SwissEph truth table injected above \u2014 never borrow transit positions for natal claims.'
    + '\n4) Elemental attributions MUST be astronomically standard (e.g. Gemini = AIR, never Earth).'
    + '\n5) Chapter I describes NATAL placements ONLY; any current-year claim MUST be marked with a transit/year qualifier.';
}

// 🛡️ E10/R9-R3: 缓存终局裁定（纯函数，闸门可测）—— 军师裁决 3「有限 1 次重试 + 强后手」+ 截断红线
//   useRetryText: 重试稿完整即采用；重试稿截断但首稿完整 → 保留首稿。
//   action: 'normal' 零瑕疵正常入库｜'force' 有风格瑕疵但纠偏链已尽力 → 带标记入库（强后手）｜
//           'block' 截断（完整性不足）→ 绝不入库（Adelaide 毒缓存铁律，重试也不豁免）。
function _e10CacheDecision(j1, j2) {
  const useRetryText = !(j2 && j2.iv && !j2.iv.ok && j1 && j1.iv && j1.iv.ok);
  const fin = useRetryText ? j2 : j1;
  if (!fin || !fin.iv || !fin.iv.ok) return { action: 'block', useRetryText };
  if (fin.issues && fin.issues.length > 0) return { action: 'force', useRetryText };
  return { action: 'normal', useRetryText };
}

// ═══ 🛡️ E11/R10a: 星座名多语言归一（CRITIC 判据语言适配基础设施）═══
//   病根（2026-10-03 线上实测）：判据 1 拿中文 `natalSunSign`（端点 `:10455` 取自
//   buildWealthMetaFull 的**中文** signs 数组 `:10166`，与 lang 无关）去 includes 英文报头
//   ⇒ 英文报告恒误报 ⇒ 每条非中文年报白跑一次重试（63s→134s、成本 ×2）且终局永远 force。
//   ⚠️ TDZ 铁律：SUN_SIGN_* 的 const 声明在 `:7231`，而本函数定义在 `:6705` —— 故**惰性构造**
//     （首次调用时才建表；调用发生在请求期，彼时模块已加载完毕），与该文件既有
//     `_TH_SIGN_UNIQ`/`_VI_SIGN_UNIQ` 同款模式。**模块顶层直接引 SUN_SIGN_* 会启动即崩**。
let _E11_SIGN_IDX_CACHE = null;
function _e11SignIndex(name) {
  if (!name || typeof name !== 'string') return -1;
  if (!_E11_SIGN_IDX_CACHE) {
    _E11_SIGN_IDX_CACHE = new Map();
    const tables = [SUN_SIGN_EN, SUN_SIGN_ZH, SUN_SIGN_TH, SUN_SIGN_VI, SUN_SIGN_ES, SUN_SIGN_FR];
    for (let i = 0; i < 12; i++) {
      for (const tb of tables) {
        const n = tb && tb[i];
        if (typeof n === 'string' && n) _E11_SIGN_IDX_CACHE.set(n.toLowerCase(), i);
      }
    }
  }
  const k = name.toLowerCase();
  return _E11_SIGN_IDX_CACHE.has(k) ? _E11_SIGN_IDX_CACHE.get(k) : -1;
}
// 把任意语言的星座名转成本次报告语言（lang）的写法；无法归一则原样返回（保守：绝不臆造）
function _e11SignLocal(name, lang) {
  const i = _e11SignIndex(name);
  if (i < 0) return name;
  const T = { en: SUN_SIGN_EN, zh: SUN_SIGN_ZH, th: SUN_SIGN_TH, vi: SUN_SIGN_VI, es: SUN_SIGN_ES, fr: SUN_SIGN_FR };
  const arr = T[lang] || SUN_SIGN_EN;
  return (arr && arr[i]) || name;
}

// 🛠️ V107-方案A: 轻量级预缓存校验器(写缓存前拦截质量问题)
// 🛡️ E12/R11c: 第 5 形参 astroMatrix（可选）—— 判据 12「全章本命声称 vs SwissEph 真值错配」需要真值盘；
//   缺省时该判据整条跳过（对既有调用/闸门零影响）。
function wealthCriticCheck(text, birthDate, natalSunSign, lang, astroMatrix) {
  const issues = [];
  if (!text || text.length < 500) issues.push('内容过短');

  // 1. 验证本命太阳星座是否正确出现在前2000字
  // 🛡️ E11/R10a: 语言适配 —— 入参 natalSunSign 恒为**中文**（见 `_e11SignLocal` 头注根因），
  //   必须先归一到本次报告语言（en→Sagittarius / th→ธนู / …）再比对，否则英文报告恒误报。
  if (natalSunSign) {
    const header = text.slice(0, 2000);
    const _sunLocal = _e11SignLocal(natalSunSign, lang || 'zh');
    if (!header.includes(_sunLocal)) {
      issues.push('报头缺少' + _sunLocal);
    }
  }

  // 2. 验证乱码
  const fffd = (text.match(/\ufffd/g) || []).length + (text.match(/�/g) || []).length;
  if (fffd > 0) issues.push('FFFD残块: ' + fffd);

  // 3. 验证孤括号
  if (text.match(/[^（]）》/)) issues.push('孤闭括号');

  // 4. 验证关键月份:6月标题必须有双子座（🛡️ E11/R10a: 语言感知）
  if (lang === 'zh') {
    const juneHeader = text.match(/6月[::].{0,40}?太阳[^座]*座/);
    if (juneHeader && !juneHeader[0].includes('双子座')) {
      issues.push('6月标题星座错误: ' + juneHeader[0].slice(0, 30));
    }
  } else if (lang === 'en') {
    // 英文月标题形态：`### June 2027: Sun in Gemini · 6th House · …`
    const juneEN = text.match(/June\s+20\d\d\s*:[^\n]*?Sun in\s+([A-Za-z]+)/i);
    if (juneEN && !/^Gemini$/i.test(juneEN[1])) {
      issues.push('June header Sun sign wrong: ' + juneEN[0].slice(0, 40));
    }
  }

  // 5. 验证 7月 太阳座不含射手座（2026-07 太阳在巨蟹；🛡️ E11/R10a: 语言感知）
  if (lang === 'zh') {
    const julyPeak = text.match(/2026年7月[^🔴🟢]*(?:🟢|🔴)[^。]*?太阳在[^座]*座/g);
    if (julyPeak && julyPeak.some(m => m.includes('射手座'))) {
      issues.push('7月Peak/W太阳座错误(含射手座)');
    }
  } else if (lang === 'en') {
    const julyEN = text.match(/July\s+20\d\d\s*:[^\n]*?Sun in\s+Sagittarius/i);
    if (julyEN) issues.push('July header Sun sign wrong (Sagittarius, expected Cancer)');
  }

  // 🛡️ E11/R10a: 判据 6~8 判据锚定**中文表述**（玄秘宫 / 2026年N月 / 形成刑克），
  //   对非中文报告恒空转 —— 显式 gate 到 zh，杜绝「看起来在检、实则永假」的假防线。
  if (lang === 'zh') {
    // 6. 🛠️ 军师审计·P0: 玄秘宫误用--本命太阳非天秤座时不得写"玄秘宫"
    // 天秤座=第3宫(沟通宫)对于上升狮子座;"玄秘宫"=第12宫(巨蟹座)
    if (natalSunSign === '天秤座' && text.slice(0, 3000).includes('玄秘宫')) {
      issues.push('本命天秤座被误归玄秘宫(第12宫)');
    }

    // 7. 🛠️ 军师审计·P1: 11月/12月星座串线--正文第一句与标题不符
    // 11月标题天秤座但正文写"太阳进入摩羯座"
    const monthBodies = text.match(/2026年1[12]月[::][^。]*?太阳进入[^座]{1,3}座/g);
    if (monthBodies) {
      for (const mb of monthBodies) {
        const titleSign = mb.match(/(天蝎座|射手座|天秤座|摩羯座|水瓶座)第/);
        const bodySign = mb.match(/太阳进入[^座]{1,3}(座)/);
        if (titleSign && bodySign && titleSign[1] !== bodySign[1]) {
          issues.push('月度正文星座与标题不匹配:' + mb.slice(0, 40));
        }
      }
    }

    // 8. 🛠️ 军师审计·P2: 幽灵相位--"火星形成刑克相位"缺行星对象
    // 在完整句子内检查:含'形成刑克/三分/六分/对分'但同一句内无「行星 与 行星」对偶
    // 🛡️ E19/R11l: 守卫扩展——行星可写「太阳/太阴/月亮」（不带星尾），否则
    //    「流年太阳…与流年木星形成合相」被误报为幽灵相位（E18 批测 s1 zh 实证）。
    // 🛡️ E19/R11m: 再扩【外行星】—— 原字符类 `[日月水火木金土]星` 认不出「冥王星/海王星/
    //    天王星」（首字不在类内）⇒「流年太阳…与冥王星形成合相」仍被判为幽灵相位
    //    （E19 批测 s7 zh 实证）。外行星三词均为「X王星」形态 ⇒ 单列 `[冥海天]王星`。
    var _c8Aspect = /形成(刑克|对分|三分|六分|合相)/;
    var _c8Pair = /(太阳|太阴|月亮|[日月水火木金土]星|[冥海天]王星)[^。\n]{0,30}与[^。\n]{0,30}(太阳|太阴|月亮|[日月水火木金土]星|[冥海天]王星)/;
    var sents = text.split(/[。\n]/);
    for (var si = 0; si < sents.length; si++) {
      var s = sents[si];
      if (_c8Aspect.test(s) && !_c8Pair.test(s)) {
        issues.push('幽灵相位:' + s.slice(0, 50));
        break;
      }
    }
  }

  // 9. 🛠️ 军师审计·P3: 双子座元素错--归入土元素
  // 用分割行方式绕过\n在character class中的逃逸问题
  // 🛡️ E11/R10a（双修）:
  //   ① **空数组真值坑**——原 `if (badElement)` 对 `filter()` 返回的 `[]` 恒 truthy（JS 铁律：
  //      空数组是 object ⇒ truthy），导致**任何语言的任何报告都必然命中此告警**（线上实证
  //      `双子座被错误归入土元素:` 尾巴为空即 [] 的指纹）。改为 `.length > 0`。
  //   ② 语言适配——原判据只认中文「土元素/双子座」，英文报告（earth element + Gemini）
  //      恒空转 ⇒ 补英文等价键。
  const _E11_EARTH_KEYS = ['土元素', '土象', 'earth element', 'earth sign', 'element of earth'];
  // ⚠️ 守卫 `k &&`：空串键会让 `low.includes('')` 恒真 ⇒ 判据形同虚设（注入自测实证）
  const _E11_hasEarth = (line) => {
    const low = line.toLowerCase();
    return _E11_EARTH_KEYS.some(k => k && ((k === '土元素' || k === '土象') ? line.includes(k) : low.includes(k)));
  };
  const _E11_hasGemini = (line) => line.includes('双子座') || /gemini/i.test(line);
  const badElement = text.split('\n').filter((l) => _E11_hasEarth(l) && _E11_hasGemini(l));
  if (badElement.length > 0) issues.push('双子座被错误归入土元素:' + badElement.join('|'));

  // ═══ 🛡️ E12/R11c: 三类 E12 漏洞正告警判据（命中即触发 R3 静默重试，重试稿携带强约束 prompt）═══
  //   设计原则（E11 教训的反向应用）：判据必须**有区分力**（合规报告 0 告警）且**可被注入自测证伪**。
  //   ① 畸形宫位 `N House`（数字在前、缺序数后缀）—— 只认**数字在前**形态（`House 5` 是我方
  //      houseFmt 的合法产物，绝不误伤）；1~12 值域。R11a-1 归一后仍残留 = 后处理链漏覆盖 ⇒ 重试。
  if (lang === 'en') {
    const _v512BadHouse = [];
    const _reBadHouse = /\b(\d{1,2})\s+House\b/g;
    let _mbh;
    while ((_mbh = _reBadHouse.exec(text)) !== null) {
      const _v = Number(_mbh[1]);
      if (_v >= 1 && _v <= 12) _v512BadHouse.push(_mbh[0]);
    }
    if (_v512BadHouse.length > 0) {
      issues.push('畸形宫位格式(N House 缺序数后缀): ' + _v512BadHouse.slice(0, 5).join(', '));
    }
    // 🛡️ E13/R11d-3: 拼写式序数残留（`in the seventh house`）—— 与判据 10 同性质的「形态未收口」告警。
    //   R11d-1 归一（_v512NormalizeHouseOrdinal）后本不应残留 ⇒ 残留即后处理链漏覆盖/被绕过，
    //   触发静默重试（重试稿携带 STRICT NUMERIC ORDINAL RULE 强约束）。
    //   ⚠️ 同源口径：本判据与 _v512NormalizeHouseOrdinal 共用 `_V512_SPELLED_HOUSE` 正则源码，
    //     彻底杜绝「归一漏了、CRITIC 也看不见」的双盲（E12 判据 12 复现同一 finder 失明的教训）。
    const _reSpelled = new RegExp(_V512_SPELLED_HOUSE.source, 'gi');
    const _spelledHits = text.match(_reSpelled) || [];
    if (_spelledHits.length > 0) {
      issues.push('拼写式序数宫位残留(应为 Nth House 数字式): ' + _spelledHits.slice(0, 5).join(', '));
    }
  }
  //   ② LLM 自纠/元话语 artifact 残留（R11a-2 剥离链之外的变体）
  //      ⚠️ `correction` 只在句首 + 冒号形态才判 —— 否则金融常用词 `market correction` 恒误报。
  if (/\b(?:wait\s*,?\s*no|let\s+us\s+be\s+precise|scratch\s+that)\b/i.test(text)
    || /(^|[.!?\u3002\uff01\uff1f]\s+)Correction\s*[:：]/m.test(text)) {
    issues.push('LLM 自纠/元话语 artifact 残留');
  }
  //   ③ 全章「物主本命声称」与 SwissEph 真值错配（复用 R11b 的物主准入裁定 ⇒ 只判「明确本命」句；
  //      无尽言句 / 流年句 / 含月份日期的句子一律不计 ⇒ 杜绝 E11 式的必然误报）
  if (astroMatrix) {
    const _mis = _v512CountNatalClaimMismatch(text, lang || 'zh', astroMatrix);
    if (_mis > 0) issues.push('本命行星/宫位声称与 SwissEph 真值错配: ' + _mis + ' 处');
  }

  // ═══ 🛡️ E17/R11j 判据 13（军师铁律 2026-10-05）：全篇「上升/命宫 + 具体星座」必须恒等于 ASC 真值 ═══
  //   病根：v516 特罗姆瑟盘 zh 年报同一篇出现 **3 个不同上升**（报头「上升射手座」= 真值，
  //   正文「你的上升金牛座」+「对于上升水瓶座而言」= 幻觉），而 CRITIC 12 条判据**无一条管上升**
  //   ⇒ 既无人纠正、也无人拦截，直接写库（军师终审 78 分主因）。
  //   口径（与 `auditYearlyAxisAnchor` **同源**）：只认**捕获到星座词表内 token** 的「上升X座」形态；
  //   「这是你的上升星座与命宫」这类**泛指句**（捕获 "与命宫" 非星座词 ⇒ 不计）绝不误报。
  //   命中 ⇒ 走 R3 静默重试（重试 prompt 的 `_E10_RETRY_CONSTRAINT` 已含「全文任何上升声明一律用此值」铁律）。
  if (astroMatrix && astroMatrix.meta && astroMatrix.meta.rising_sign) {
    const _ax = auditYearlyAxisAnchor(text, lang || 'zh', astroMatrix, 'yearly');
    if (_ax && _ax.mismatch && _ax.mismatch.length > 0) {
      issues.push('上升锚点真值错配(应为 ' + _ax.trueSign + '): ' + _ax.mismatch.slice(0, 5).join(', '));
    }
  }

  // ═══ 🛡️ E21/R11o 判据 14（军师裁断 2026-10-06）：c14 · 宫位语义标签错配守卫 ═══
  //   病根：1993 盘实证「数字保真、文义乱套」（12th House of Partnership /
  //   2nd House of Home and Roots）—— 宫位数字 vs SwissEph 全对 ⇒ 13 条标量判据
  //   全部空转（c12=0 实证），标签盲区直达落库。本判据与 stripHouseSemanticLabelMismatch
  //   共用同一正则字面量与契约表（判据同源纪律，杜绝「锁修了、判据看不见」双盲）。
  //   🛡️ E24/R11r②：生效语种扩 **es**（西语契约锁已上线；锁在前、判据在后 ⇒ 正常情况下恒为 0，
  //      残余即兜底告警并触发 R3 静默重试，与 en 完全对称）。必须传 lang —— 计数函数按语种选形态。
  //   🛡️ E24④/R11t（2026-10-06）：语种再扩 **vi**（越语 `Nhà N, ngôi nhà của <标签>` 契约锁上线，
  //      同为「锁在前、判据在后」⇒ 恒 0 兜底）。**三处同源**不变式：c14 语言门 ≡ 计数函数门控 ≡
  //      批测 `labelMismatch` 口径（sweep 直接回调 `_e21CountHouseLabelMismatch(text, lang)`）——
  //      锁的射程扩到哪，判据与批测就必须跟到哪，否则 = 假绿死角（E24③ 8 盘全报 0 的教训）。
  if ((lang || 'zh') === 'en' || (lang || 'zh') === 'es' || (lang || 'zh') === 'vi') {
    const _c14 = _e21CountHouseLabelMismatch(text, lang || 'zh');
    if (_c14 > 0) issues.push('宫位语义标签错配(House-Semantic Misalignment): ' + _c14 + ' 处');
  }

  return issues;
}

// 🛠️ V482d: 补 `lang` 形参 —— 本函数是**模块级**函数, 词法作用域看不到调用者的局部 `lang`;
//   原先签名只有 `(text)`, 却在 L5895 用 `lang === 'es' || …` → 任何调用都必抛
//   `ReferenceError: lang is not defined`。线上实测: `/api/wealth-oracle`(非流式/前端 fallback 路径)
//   yearly MISS 直接 500 `AI generation failed: lang is not defined`(2026-09-30)。
//   教训: 收尾/清洗函数必须自洽 —— 需要哪些上下文就显式收形参, 绝不隐式依赖调用者。
function cleanYearlyTimeline(text, lang) {
  if (!text) return text;
  // Pattern 1: 2026年6月2026年6月 → 2026年6月
  text = text.replace(/(\d{4}年\d{1,2}月)(\d{4}年\1)/g, '$1');
  // Pattern 2: 2026年6月2026年6月6月 → 2026年6月21日
  text = text.replace(/(\d{4}年\d{1,2}月)(\d{4}年)(\1)(\d{1,2}月)/g, '$1$4');
  // 🛡️ V484: 原 Pattern 3 已拆除 —— 它与 Pattern 4 正则完全相同, 替换串却是 `'$1$2$4日'`:
  //   `(\d{4}年)(\d{1,2}月)(\d{4}年)(\2)` 中 $4 是「与 $2 相同的月」⇒ 替换结果 = `2026年6月6月日`
  //   (凭空造「日」+ 月份重复), 线上实证 `2026年6月2026年6月21日 → 2026年6月6月日21日`。
  //   其注释声称的意图「1990年6月2026年6月 → 1990年6月15日」本身就是无中生有。
  //   语义由 Pattern 4(不带日 → 塌缩为首个标签) 与 Pattern 5(带日 → 保留日期) 正确承接。
  // Pattern 4: 2027年6月2026年6月 → 2027年6月
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年)(\2)/g, '$1$2');
  // Pattern 5: 2026年6月2026年6月21日 → 2026年6月21日
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年\2)(\d{1,2}日)/g, '$1$2$4');
  // Pattern 6: 2027年6月2026年6月至2027年6月 → 2027年6月
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年)(\1至)(\d{4}年\1)/g, '$1$2');
  // Pattern 7: 连续两个相同月份 → 保留一个
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\1)(\d{1,2}月)/g, '$1$2');
  // Pattern 8: 任意位置连续年份重复
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年)(\1)/g, '$1$2');
  // Pattern 9: 2026年6月2026年6月 → 2026年6月(贪婪清理)
  text = text.replace(/(\d{4}年\d{1,2}月)(\d{4}年)(\1)/g, '$1');

  // V103-fix18: 断头括号兜底--AI 流式截断导致行星名+)独立成句,替换为逗号
  text = text.replace(/(火星|水星|天王星|冥王星|金星|木星|土星)(?!)(?!在)/g, "$1,");

  // V103-fix21: 通用括号平衡--行内中文左括号(无闭合)→ 行尾补)
  text = text.replace(/（([^）\n]*?)(\s*)(?=\n|$)/g, '（$1$2）');

  // ── V147: 西班牙语等非中文全角括号转半角(军师抓包: （Plutón...）残留) ──
  if (lang === 'es' || lang === 'en' || lang === 'fr' || lang === 'th' || lang === 'vi') {
    text = text.replace(/（/g, '(').replace(/）/g, '');
  }
  return text;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V483c: 年报「同月重复标题」终局清算（最后一公里兜底）
// ══════════════════════════════════════════════════════════════════
//   背景（2026-09-30 线上实测）: 非流式 /api/wealth-oracle 偶发返回同一个月两条逐字相同的
//     月标题行（12 个月 ×2 = 24 行标题），用户可见 24 条。V482b/c 的清算要求「两条都含星座+宫位」
//     （hasCore）且签名相同或前缀关系 —— 一旦 LLM 两条措辞差异较大就整月漏判（线上实测 dropped=0）。
//   本函数 = 全链**最末**的确定性兜底: 只要同一个月出现多条标题行，就只保留**信息最全（最长）**的那条，
//     其余置空行（不改行数，保持索引稳定）。幂等、零误伤。
//   保守侧: ① 必须 `#{1,6}` 开头且紧跟「四位年 + 年 + 月」，章节子标题（如含年份区间的「…-…年」）
//             不匹配，不会被误删；② 每个月份 key 至多保留 1 行，月份之间互不影响。
//   ⚠️ 必须挂在锁链末端（lockYearlyMonthTitles → normalizeYearlyMarkup → lockYearlyTransitSigns
//      → cleanYearlyTimeline 之后）: 前面的环节会改变标题行形态，末端清算才拿得到终局文本。
function dedupYearlyMonthTitles(text, lang, reportType) {
  if (reportType !== 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  const lines = text.split('\n');
  const byKey = new Map();          // 月份 key → 该月的标题行号数组
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (!/^#{1,6}\s/.test(ln)) continue;
    // 🛡️ E16/R11g: 六语统一识别（原为 zh-only 的 `^#{1,6}\s*YYYY 年 M 月`
    //   ⇒ es/fr/th/vi 的同月重复标题**永不清理**）
    const _vk = _v516MonthHeadKey(ln, lang);
    if (!_vk) continue;
    const key = _vk.y + '-' + _vk.mo;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(i);
  }
  const drop = new Set();
  for (const rows of byKey.values()) {
    if (rows.length < 2) continue;
    let best = rows[0];
    for (const r of rows) if (lines[r].length > lines[best].length) best = r;   // 信息最全者胜出
    for (const r of rows) if (r !== best) drop.add(r);
  }
  if (!drop.size) return text;
  for (const r of drop) lines[r] = '';
  console.log(`[V483c] ${lang} 年报月标题终局去重: 清除同月重复 ${drop.size} 行`);
  return lines.join('\n');
}

// // ── Middleware ──
// 🔴 E24⑥（2026-10-07）P0 修正：/api/webhook 必须拿到**原始 Buffer** 才能验签
//   —— Stripe 签名是对**原始字节**做 HMAC。全局 json 解析器一旦抢先跑，req.body 变成
//      object，路由内的 express.raw 见 req._body 已置位便跳过 ⇒ constructEvent 必然抛错
//      ⇒ 真实回调 100% 400、权益永不落库（用户付了钱拿不到报告）。
//   故对 webhook 路径**豁免**全局 JSON 解析，把原始流留给路由内的 express.raw。
//   （urlencoded 只吃 application/x-www-form-urlencoded，Stripe 发 application/json，无需豁免）
const _globalJsonParser = express.json({ limit: '10mb' });
app.use((req, res, next) => {
  const _p = (req.originalUrl || '').split('?')[0];
  if (_p === '/api/webhook') return next();
  return _globalJsonParser(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// ── CORS ──
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ── API Routes ──
// Each route handler runs the original Vercel function logic

// ── /api/debug-env ──
// ── /api/debug-thai-prompt: 检查泰语 system prompt 是否正确加载 ──
app.get('/api/debug-thai-prompt', async (req, res) => {
  try {
    const { buildWealthReportPrompt } = await import('./server.js').catch(() => ({}));
    const thPrompt = await import('./src/prompts/yearlySystemTH.ts').catch(() => null);
    const loader = await import('./src/prompts/loader.js').catch(() => null);
    const sysPrompt = loader?.getSystemPromptByLocale?.('th') || '';
    // Check for problem markers
    const checks = {
      length: sysPrompt.length,
      hasASTRONOMY_MARKER: sysPrompt.includes('[2026-2027 ASTRONOMY FACT SHEET'),
      hasASPECTS_MARKER: sysPrompt.includes('[ASPECTS_DATA]'),
      hasRisingLocal: sysPrompt.includes('__RISING_LOCAL__'),
      hasJupHouse: sysPrompt.includes('__JUP_HOUSE__'),
      hasOBJECT_OBJECT: sysPrompt.includes('[object Object]'),
      first200: sysPrompt.slice(0, 200),
    };
    res.json(checks);
  } catch(e) {
    res.json({ error: e.message });
  }
});

app.get('/api/debug-env', (req, res) => {
  // 🛠️ V100e: 临时加 debug 看实际 prompt 语言
  if (req.query.lang) {
    try {
      const lang = req.query.lang.toString();
      const prompt = buildWealthReportPrompt('1992-12-21', lang, 'yearly', null, null);
      const sys = prompt?.system || '';
      return res.json({
        lang,
        sysLen: sys.length,
        sysFirst300: sys.slice(0, 300),
        sysLast300: sys.slice(-300),
        sysHasChinese: /[\u4E00-\u9FFF]/.test(sys),
        sysHasEnglish: /[A-Za-z]/.test(sys),
        fileSize: readFileSync(__filename).length,
      });
    } catch (e) {
      return res.json({ error: e.message, stack: e.stack?.slice(0, 500) });
    }
  }
  res.json({
    DEEPSEEK: process.env.DEEPSEEK_API_KEY ? '✓ set' : '✗ missing',
    GEMINI: (() => { const k = getGeminiKey(); return k ? '✓ ' + k.slice(0,8) + '...' : '✗ missing'; })(),
    SUPABASE_URL: process.env.SUPABASE_URL ? '✓ set' : '✗ missing',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? '✓ set' : '✗ missing',
    STRIPE: process.env.STRIPE_SECRET_KEY ? '✓ set' : '✗ missing',
    serverVersion: 't4-debug-2026-06-29c', gitSha: '1a11de8',
    tarotHasName: typeof TAROT_CARDS !== 'undefined' && TAROT_CARDS[0] && !!TAROT_CARDS[0].name,
    fileSize: readFileSync(__filename).length,
  });
});

// ── /api/debug-clear-cache ── 清空指定 cache_key 的财富报告缓存(调试用,生成后删除)


// ── V98: Supabase连通性诊断端点 ──
app.get('/api/debug-supabase-test', async (req, res) => {
  // https 已在顶部 import
    const tests = [];

  // Test 1: 直接 HTTP ping
  const t1 = Date.now();
  try {
    const r1 = await Promise.race([
      new Promise((resolve, reject) => {
        const req = https.request(
          { hostname: 'wfkxqhlcgrikxoofjvas.supabase.co', path: '/', port: 443, method: 'HEAD' },
          (r) => resolve(r.statusCode)
        );
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('timeout')));
        req.setTimeout(5000);
        req.end();
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout 5s')), 5000))
    ]);
    tests.push({ name: 'HTTPS ping', ok: true, status: r1, ms: Date.now() - t1 });
  } catch(e) {
    tests.push({ name: 'HTTPS ping', ok: false, error: e.message, ms: Date.now() - t1 });
  }

  // Test 2: REST API with anon key
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;   // 🛠️ 2026-09-13 修复：原先漏声明，Test 2 直接 ReferenceError → "SB_KEY is not defined"（误导以为没恢复，实际生产函数都各自声明了）
  const t2 = Date.now();
  try {
    const r2 = await Promise.race([
      new Promise((resolve, reject) => {
        const req = https.request(
          { hostname: 'wfkxqhlcgrikxoofjvas.supabase.co', path: '/rest/v1/ai_insights_cache?cache_key=eq.wealth:1996-01-23:zh:yearly&select=insight&limit=1', port: 443, method: 'GET',
            headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY } },
          (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve({ status: r.statusCode, body: d.slice(0, 200) }));
          }
        );
        req.on('error', reject);
        req.end();
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout 10s')), 10000))
    ]);
    tests.push({ name: 'REST API (anon key)', ok: r2.status === 200, status: r2.status, body: r2.body, ms: Date.now() - t2 });
  } catch(e) {
    tests.push({ name: 'REST API (anon key)', ok: false, error: e.message, ms: Date.now() - t2 });
  }

  // Test 3: env vars
  tests.push({
    name: 'env vars',
    SB_URL: !!process.env.SUPABASE_URL,
    SB_KEY_len: (process.env.SUPABASE_SERVICE_KEY || '').length,
    V69_HOST: process.env.V69_HOST,
    V69_PORT: process.env.V69_PORT,
    DEEPSEEK: !!process.env.DEEPSEEK_API_KEY
  });

  res.json({ tests, timestamp: new Date().toISOString() });
  return;

  // 试 anon key

  const options = {
    hostname: url.hostname, port: 443, path: url.pathname + url.search,
    method: 'GET',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  };

  const p = new Promise((resolve) => {
    const req2 = https.request(options, (r) => {
      let data = '';
      r.on('data', d => data += d);
      r.on('end', () => resolve({ status: r.statusCode, data: data.slice(0, 500) }));
    });
    req2.on('error', e => resolve({ error: e.message }));
    req2.end();
  });

  const result = await p;
  res.json(result);
});

app.post('/api/debug-clear-cache', express.json(), async (req, res) => {
  const { cacheKey } = req.body;
  if (!cacheKey) return res.status(400).json({ error: 'cacheKey required' });
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'supabase not configured' });
  try {
    const r = await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}`, {
      method: 'DELETE',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    res.json({ ok: r.ok, status: r.status, cacheKey });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── /api/clear-cache ──
app.get('/api/clear-cache/:birthDate/:lang/:reportType', async (req, res) => {
  const { birthDate, lang, reportType } = req.params;
  const { birthTime, lat, lon, tz } = req.query;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.json({ error: 'Supabase not configured' });
  // 🛠️ V178-P0: 精准清(带 birthTime/lat/lon/tz 查询参数) 或 通配清(该生日全部, 兼容旧格式)
  let delUrl;
  if (birthTime && lat && lon && tz) {
    // 模式A: 精确清理特定生辰
    const _ckLat = Number(lat).toFixed(4);
    const _ckLon = Number(lon).toFixed(4);
    // 🛡️ V490: 删除键必须用**规范 tz**（与写入端同源）—— 否则传 `Asia/Kolkata` 删不掉
    //   写入端实际存的规范键 `...:Asia/Calcutta:...`（Intl canonical）→ 清了等于没清。
    const _tzrC = resolveTimeZone(tz, lat, lon);
    const _ckTzDel = _tzrC.ok ? _tzrC.tz : tz;
    const cacheKey = `wealth:v529:${birthDate}:${birthTime}:${_ckLat}:${_ckLon}:${_ckTzDel}:${lang}:${reportType}`;
    delUrl = `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}`;
  } else {
    // 模式B: 通配清理该生日下所有旧/新格式缓存 (PostgREST like 通配符用 *, 非 %)
    // 🛠️ V433-fix: 原模式 'wealth:<date>:*' 匹配不到真实键 'wealth:v356:<date>:...' → 清了等于没清！
    //   实测：GET /api/clear-cache/1988-12-31/es/monthly 返回 deleted:true/204，但随后生成仍是旧文本
    //   （命中旧缓存），导致整轮验证结论错误。改为 'wealth:*<date>*' 同时覆盖新旧两种键格式。
    const pat = 'wealth:*' + encodeURIComponent(birthDate) + '*';
    delUrl = `${SB_URL}/rest/v1/ai_insights_cache?cache_key=like.${pat}`;
  }
  try {
    const delRes = await safeFetch(delUrl, {
      method: 'DELETE',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    res.json({ deleted: true, mode: birthTime ? 'precise' : 'wildcard', status: delRes.status });
  } catch (e) {
    res.json({ deleted: false, error: e.message });
  }
});

// ── Root health check for Railway ──
// V342: fileLen 误读教训——src.length 是 UTF-16 字符数不是字节数。
// 改为输出 byteLen(Buffer 字节数) + charLen + md5，杜绝字符/字节混淆。
app.get('/api/debug-source', async (req, res) => {
  try {
    const filePath = import.meta.url.replace('file://', '');
    const buf = readFileSync(filePath);
    const src = buf.toString('utf-8');
    const idx = src.indexOf('res.write(Buffer.from(`data: ${JSON.stringify({');
    res.json({
      hasDbg: src.includes('_dbg'),
      hasDbgAnnotation: src.includes('hasKaichuan'),
      snippet: idx >= 0 ? src.slice(idx, idx+200) : 'NOT FOUND',
      byteLen: buf.length,          // ✅ 真实 UTF-8 字节数（与 wc -c / Docker build 一致）
      charLen: src.length,          // 💡 UTF-16 字符数（仅作对比，勿当字节数）
      md5: createHash('md5').update(buf).digest('hex'),
      mtime: statSync(filePath).mtime.toISOString()
    });
  } catch(e) {
    res.json({ error: e.message });
  }
});

// 🛠️ V120-fix27: 健康检查移到 /api/health，让 / 走静态文件服务
// 🛠️ 2026-07-29: 读 Railway 自动注入的 RAILWAY_GIT_COMMIT_SHORT_SHA / RAILWAY_DEPLOYMENT_ID
//                  一秒确认部署版本;此前被 app.use('/api/health', ...) 遮蔽不可达
// 🛠️ 2026-07-29 16:41: Railway 环境变量不注入 Dockerfile 部署，改为读 /app/.git-sha 文件
app.get('/api/health', async (req, res) => {
  let gitSha = 'unknown';
  let gitShaFull = 'unknown';
  try {
    const shaFile = readFileSync('/app/.git-sha', 'utf-8').trim();
    if (shaFile && shaFile !== 'unknown') {
      gitShaFull = shaFile;
      gitSha = shaFile.substring(0, 7);
    }
  } catch (e) {}
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'kindredsouls-api',
    version: 'v1.0.2-V233-FINAL',
    gitSha,
    gitShaFull,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || 'unknown',
    environment: process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_ENVIRONMENT_NAME || 'unknown',
    railpackVersion: process.env.RAILPACK_VERSION || 'unknown',
    debugBuildTime: new Date().toISOString(),
  });
});

// ── 确定性种子:从用户 Prompt 中提取生日算 seed,确保同用户出同结果 ──
function seedFromUserPrompt(userPrompt) {
  if (!userPrompt) return 42;
  // 匹配各种格式的出生日期
  const m = userPrompt.match(/birth(?:Date|day)?[=:\s]*['"]?(\d{4})[-年](\d{1,2})[-月](\d{1,2})/i)
    || userPrompt.match(/['"]?(\d{4})[-年](\d{1,2})[-月](\d{1,2})['"]?/);
  if (m) {
    const d = parseInt(m[1]) * 10000 + parseInt(m[2]) * 100 + parseInt(m[3]);
    return d % 2147483647; // DeepSeek seed 最大 int32
  }
  return 42;
}

// ── AI Call Helper (DeepSeek + Gemini fallback) ──
async function callAI(systemPrompt, userPrompt, env, options = {}) {
  // 🛠️ V211: 月报默认从 4000→12000
  const { maxTokens = 12000, reportType = 'monthly' } = options;
  const deepseekKey = getDeepSeekKey();
  const geminiKey = env.GEMINI_API_KEY;

  // 优先 DeepSeek-V4.1-Flash（月报/年报主输出引擎，V4.1 2026-09-10 上线）
  if (deepseekKey) {
    try {
      const res = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-flash',
          thinking: { type: 'disabled' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0,
          seed: seedFromUserPrompt(userPrompt),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const m = data?.choices?.[0]?.message;
        if (m?.content || m?.reasoning_content) return (m.content || m.reasoning_content || '').trim();
        console.error('[AI] DeepSeek returned empty, trying Gemini fallback');
      } else {
        console.error('[AI] DeepSeek HTTP', res.status, 'trying Gemini fallback');
      }
    } catch (e) {
      console.error('[AI] DeepSeek failed, trying Gemini:', e.message);
    }
  }

  // 兜底 Gemini（澳洲付费通道）
  if (geminiKey) {
    try {
      const res = await safeFetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
          }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (txt) return txt;
        console.error('[AI] Gemini returned empty');
      } else {
        console.error('[AI] Gemini HTTP', res.status);
      }
    } catch (e) {
      console.error('[AI] Gemini failed:', e.message);
    }
  }

  throw new Error('All AI providers failed');
}

// ── Wealth Report Prompt Builder (按军师框架) ──

// ═══════════════════════════════════════════════════════════════════
// KindredSouls 财富报告 Prompt 构建引擎 v1.0.0
// 月报:动态日期 + 6语言独立结构
// 年报:5大硬核乐章 + 荣格阴影整合 + 动态日期 + 6语言独立系统提示词
// ═══════════════════════════════════════════════════════════════════

// ── 🛠️ V83: Natal Sun Sign 计算(从生日直接推,不依赖 transit month)──
function getNatalSunSign(birthDate) {
  const [, month, day] = birthDate.split('-').map(Number);
  // 🛠️ V121-fix: 1月1-19日属于摩羯座(12月22日-1月19日)
  // 反向循环从12月开始,1月早期的日期会漏掉
  if (month === 1 && day < 20) return 9; // 摩羯座

  const cuts = [
    [1, 20, 10], [2, 19, 11], [3, 21, 0], [4, 20, 1], [5, 21, 2], [6, 21, 3],
    [7, 23, 4], [8, 23, 5], [9, 23, 6], [10, 23, 7], [11, 22, 8], [12, 22, 9]
  ];
  for (let i = cuts.length - 1; i >= 0; i--) {
    if (month > cuts[i][0] || (month === cuts[i][0] && day >= cuts[i][1])) return cuts[i][2];
  }
  return 11;
}
const SUN_SIGN_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SUN_SIGN_VI = ['Bạch Dương','Kim Ngưu','Song Tử','Cự Giải','Sư Tử','Xử Nữ','Thiên Bình','Bọ Cạp','Nhân Mã','Ma Kết','Bảo Bình','Song Ngư'];
const SUN_SIGN_TH = ['เมษ','พฤษภ','มิถุน','กรกฎ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
const SUN_SIGN_ZH = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const SUN_SIGN_ES = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const SUN_SIGN_FR = ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];

// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V438: 月亮周级轨迹「硬覆盖」后处理护栏 —— 算法算真值，AI 只填颜色
// 病根实证(2026-09-13 / 1997-10-18 盘): LLM 在周正文续写时把 W1 写过的「白羊座」当节奏
//   带下去,在 W2/W3 凭空造出不存在的月亮过境(且宫位张冠李戴)。V433/V436 真值锁只锁住了
//   「宫位数字」,没拦住「编造月亮在哪一周」.
// 治本: 用 moon_weeks 真值逐周构建轨迹串,强制覆盖每周正文里的月亮过境句.
//   不依赖 LLM 是否照抄 —— 直接替换。幂等(对已正确的文本 = no-op).
// ═══════════════════════════════════════════════════════════════════════

// 由单周 legs 构建真值轨迹串(按星座聚合并标注宫位区段)
function _v438WeekTruth(w, cfg, spanOnly) {
  // 🛠️ V454-fix1: leg.house 是「换座瞬间旧 house」，换入 house 藏 changes[].to_house
  //   1973-11-18 Kiritimati W1: legs=[AriesH9, TaurusH10, GeminiH11, CancerH12]
  //     真实入口 house = changes[0].to_house=10（不是9）
  //   策略：同 sign 延续时取 changes 最后一条 to_house；新 sign 第一段取 changes[signIdx].to_house
  const changes = Array.isArray(w.changes) ? w.changes : [];
  const seq = (Array.isArray(w.legs) && w.legs.length) ? w.legs : (w.start ? [w.start] : []);
  if (!seq.length) return '';
  const groups = [];
  for (let si = 0; si < seq.length; si++) {
    const lg = seq[si];
    const last = groups[groups.length - 1];
    // changes[i] 语义：seq[i] 换出 → seq[i+1] 换入
    //   from_house = seq[i] 出口 house；to_house = seq[i+1] 入口 house
    // 统一公式：entry = 入口 house，exit = 出口 house
    //   changes[i].from_house = 换出时本星座 house；changes[i].to_house = 换入下一星座的 house
    //   seq[i] 的入口 = i===0 ? w.start.house : changes[i-1].to_house
    //   seq[i] 的出口 = i===0 ? changes[0].to_house : changes[i-1].from_house
    const prevChange = changes[si - 1];
    const entryHouse = si === 0
      ? ((w.start && w.start.house) ? w.start.house : lg.house)
      : (prevChange ? prevChange.to_house : lg.house);
    const exitHouse = (si === 0 && changes.length > 0)
      ? changes[0].to_house
      : (prevChange ? prevChange.from_house : lg.house);
    // 🛠️ V460-fix1: 同 sign 延续组必须累积【每个 leg 的入口宫 entryHouse】。
    //   旧版 push 的是 exitHouse(=prevChange.from_house=上一腿的入口宫)，导致组内中间宫位整段丢失：
    //   1990-08-08 LA W1 金牛组 legs=[TaurusH5,TaurusH6,TaurusH7] 只产出「第5宫→第6宫」，
    //   真值应为「第5宫→第6宫→第7宫」→ 真值本身被截断，锁写进去的就是残缺序列。
    if (last && last.sign === lg.sign) {
      if (last.houses[last.houses.length - 1] !== entryHouse) last.houses.push(entryHouse);
    } else {
      groups.push({ sign: lg.sign, houses: [entryHouse] });
    }
  }
  const _v438Body = groups.map(g => {
    const idx = _EN2ZIDX[g.sign];
    const loc = (idx != null && cfg.signs[idx]) ? cfg.signs[idx] : g.sign;
    const hs = g.houses.map(cfg.houseOut).join('→');
    // 🛠️ V438-th-fix: 泰文星座名带 ราศี 前缀 + 括号包裹宫位
    if (cfg.signPrefix) {
      const inner = cfg.fmt(loc, hs);  // fmt 返回括号内容如 (บ้าน 5)
      const full = cfg.signWrap ? cfg.signWrap(cfg.signPrefix + loc, inner) : `${cfg.signPrefix}${loc} ${inner}`;
      return full;
    }
    return cfg.fmt(loc, hs);
  }).join(cfg.sep);
  // 🛠️ V451-fix: 还原引导词（cfg.intro 原为死字段，从未被使用）——锁替换掉的是【整句】，
  //   若不带引导词，周正文开头会变成一串裸清单（如 `Aries (House 11), Taurus (...)`），
  //   用户会当成新穿帮。带上引导词即恢复规范句式（zh `流月月亮依次行经…` / en `The Moon transits through …`）。
  // 🛠️ V452: spanOnly=true 时只返回星座序列本体（不含引导词），供「整段 span 替换」使用——保留 LLM 原有引导短语（如 La Lune en transit traverse）。
  return spanOnly ? _v438Body : ((cfg.intro || '') + _v438Body);
}

const _V438_CFG = {
  zh: { signs: SUN_SIGN_ZH, houseOut: h => `第${h}宫`, fmt: (loc, hs) => `${loc}（${hs}）`, sep: '、',
        intro: '月光的足迹掠过', stopRe: /\n|[。.]|\d+月\d+日/,   // 🛠️ V454-fix2: \n 放前面优先截断英文；中文句号 \。 补漏（stopAt=-1 时整把锁跳过）
        headerRe: /第([1-4])周[^\n]*/g },
  en: { signs: SUN_SIGN_EN, houseOut: h => `House ${h}`, fmt: (loc, hs) => {
      const parts = hs.replace(/House\s*/g, '').trim().split('\u2192');
      const houses = parts.map(n => 'House ' + n.trim()).join('\u2192');
      return parts.length === 1 ? `${loc} (${houses})` : `${loc} (${houses})`;
    },  // V442-fix6: 单宫 'House 1'，多宫 'House 1→House 2'
        intro: "The Moon's path sweeps through ", stopRe: /,|\.(?=\s|\n|$)/,   // 🛠️ V455-fix: 英文 Trail 用逗号结尾→stopAt 落到下一句末→整段正文被乱序句覆盖。加逗号后只截到 Trail 逗号处，保留后面散文；es/fr/th/vi 同理（/[.\n]/ 已含换行，英文 Trail 通常无换行）。
        headerRe: /Week\s+([1-4])[^\n]*/gi,
        sep: ', ',   // V442-fix10
  },   // en
  es: { signs: SUN_SIGN_ES, houseOut: h => `Casa ${h}`, fmt: (loc, hs) => `${loc} (${hs})`, sep: ', ',
        intro: 'El rastro de la Luna recorre ', stopRe: /[.\n]/,
        headerRe: /Semana\s+([1-4])[^\n]*/gi },
  fr: { signs: SUN_SIGN_FR, houseOut: h => `Maison ${h}`, fmt: (loc, hs) => `${loc} (${hs})`, sep: ', ',
        intro: 'Le sillage de la Lune traverse ', stopRe: /[.\n]/,
        headerRe: /Semaine\s+([1-4])[^\n]*/gi },
  th: { signs: SUN_SIGN_TH, houseOut: h => `บ้าน ${h}`, fmt: (loc, hs) => `(${hs})`, signPrefix: 'ราศี', signWrap: (loc, inner) => `${loc} ${inner}`,
        sep: ' → ',
        intro: 'เส้นทางจันทราเคลื่อนผ่าน ', stopRe: /[.\n]/,
        headerRe: /สัปดาห์ที่\s*([1-4])[^\n]*/g },
  vi: { signs: SUN_SIGN_VI, houseOut: h => `Nhà ${h}`, fmt: (loc, hs) => `${loc} ${hs}`, sep: ', ', multiWordSigns: true,
        intro: 'Vệt trăng lần lượt đi qua ', stopRe: /[.\n]/,
        headerRe: /Tuần\s*([1-4])[^\n]*/gi },
};

function applyMoonWeekHardOverride(text, lang, astroMatrix) {
  console.log('[V438] CALLED lang=' + lang + ' text.len=' + (text ? text.length : 'null'));
  if (!text || typeof text !== 'string') return text;
  const cfg = _V438_CFG[lang];
  if (!cfg) { console.log('[V438] NO CFG for lang=' + lang); return text; }
  if (!cfg) return text;
  const m0 = astroMatrix && astroMatrix.months && astroMatrix.months[0];
  const weeks = m0 && m0.moon_weeks;
  if (!Array.isArray(weeks) || !weeks.length) return text;   // 无真值 → 不动(绝瞎猜)
  const truths = weeks.map(w => _v438WeekTruth(w, cfg, true));   // 🛠️ V452: spanOnly（整段序列，不含引导词）
  const truthByWeek = {};
  weeks.forEach((w, i) => { const n = w.week || (i + 1); if (truths[i]) truthByWeek[n] = truths[i]; });
  // 定位所有周标题(只保留有真值的周)
  const headers = [];
  let hm; cfg.headerRe.lastIndex = 0;
  while ((hm = cfg.headerRe.exec(text)) !== null) {
    if (truthByWeek[+hm[1]]) headers.push({ i: hm.index, e: hm.index + hm[0].length, week: +hm[1] });
  }
  if (!headers.length) { console.log('[V438] NO HEADERS found, text.len=' + text.length); return text; }
  console.log('[V438] headers=' + headers.length + ' (' + headers.map(h=>'W'+h.week).join(',') + '), text.len=' + text.length);
  let result = '', prevCursor = 0;
  for (let hi = 0; hi < headers.length; hi++) {
    const h = headers[hi];
    const nextStart = (hi + 1 < headers.length) ? headers[hi + 1].i : text.length;
    const body = text.slice(h.e, nextStart);
    const fixedBody = _v438OverrideBody(body, cfg, truthByWeek[h.week]);
    // 追加：上周body末尾到本周标题 + 本周标题 + 本周替换body
    result += text.slice(prevCursor, h.e) + fixedBody;
    prevCursor = nextStart;   // V442-fix2: 跳过整个本周body（h.e→nextStart），下轮从下个标题起始   // 下周标题从本周body末尾之后开始
  }
  result += text.slice(prevCursor);  // 最后一周body末尾到文本末尾
  return result;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V444：本命锚点角色归属锁（军师 9-14 主公令）
// 目的：防止 LLM 散文把"上升/太阳/月亮"三个本命锚点对应的星座搞混
//   已知最常见 bug：把"月亮金牛座"误写成"上升金牛座"（截图实证）
// 策略：扫描散文中"角色词 + 星座"搭配，与 astroMatrix.meta 真值对撞
//   错则替换为真值星座（LLM 文采保留、事实归位）。
// 排除：流年/流月/本月等 transit 上下文（流年太阳不算本命，不动）。
// ══════════════════════════════════════════════════════════════════
const _V444_TRANSIT_EXC_ZH = '(?<!流年|流月|今年|本月|当月|下月|上月|当周|这周|下周|上周)';

function _v444Esc(s) { return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'); }

function _v444Signs(lang) {
  const m = { zh: SUN_SIGN_ZH, en: SUN_SIGN_EN, es: SUN_SIGN_ES, fr: SUN_SIGN_FR, th: SUN_SIGN_TH, vi: SUN_SIGN_VI };
  return m[lang] || null;
}

function _v444Patterns(lang, signsPat) {
  if (lang === 'zh') {
    const te = _V444_TRANSIT_EXC_ZH;
    return {
      rising: new RegExp(String.raw`${te}(?:你的|本命|乃)?上升(?:星座)?(?:是|在|为)?\s*(${signsPat})`, 'g'),
      sun: new RegExp(String.raw`${te}(?:你的|本命|乃)?太阳(?:星座)?(?:是|在|为)?\s*(${signsPat})`, 'g'),
      moon: new RegExp(String.raw`${te}(?:你的|本命|乃)?月亮(?:星座)?(?:是|在|为)?\s*(${signsPat})`, 'g'),
    };
  }
  if (lang === 'en') {
    return {
      rising: new RegExp(String.raw`(?:your|Your)\s+(?:natal\s+)?(?:rising\s+sign|ascendant|Rising|Ascendant)(?:\s+is)?(?:\s+in)?\s+(${signsPat})\b`, 'g'),
      sun: new RegExp(String.raw`(?:your|Your)\s+(?:natal\s+)?(?:sun|Sun)(?:\s+sign)?(?:\s+is)?(?:\s+in)?\s+(${signsPat})\b`, 'g'),
      moon: new RegExp(String.raw`(?:your|Your)\s+(?:natal\s+)?(?:moon|Moon)(?:\s+sign)?(?:\s+is)?(?:\s+in)?\s+(${signsPat})\b`, 'g'),
    };
  }
  if (lang === 'fr') {
    return {
      rising: new RegExp(String.raw`(?:ton|votre|mon|notre|son)\s+(?:Ascendant|ascendant)(?:\s+est)?(?:\s+en)?\s+(${signsPat})\b`, 'gi'),
      sun: new RegExp(String.raw`(?:ton|votre|mon|notre|son)\s+(?:Soleil|soleil)(?:\s+est)?(?:\s+en)?\s+(${signsPat})\b`, 'gi'),
      moon: new RegExp(String.raw`(?:ta|votre|mon|notre|sa)\s+(?:Lune|lune)(?:\s+est)?(?:\s+en)?\s+(${signsPat})\b`, 'gi'),
    };
  }
  if (lang === 'es') {
    return {
      rising: new RegExp(String.raw`(?:tu|su|mi|nuestro)\s+(?:Ascendente|ascendente)(?:\s+es)?(?:\s+en)?\s+(${signsPat})\b`, 'gi'),
      sun: new RegExp(String.raw`(?:tu|su|mi|nuestro)\s+(?:Sol|sol)(?:\s+es)?(?:\s+en)?\s+(${signsPat})\b`, 'gi'),
      moon: new RegExp(String.raw`(?:tu|su|mi|nuestra)\s+(?:Luna|luna)(?:\s+es)?(?:\s+en)?\s+(${signsPat})\b`, 'gi'),
    };
  }
  if (lang === 'th') {
    return {
      rising: new RegExp(`(?:ลัคนา|Ascendant|ascendant)(?:\s+ของ\s+คุณ)?(?:\s+อยู่)?(?:\s+ใน)?\s*(${signsPat})`, 'g'),
      sun: new RegExp(`(?:ดวงอาทิตย์|พระอาทิตย์|Sun|sun)(?:\s+ของ\s+คุณ)?(?:\s+อยู่)?(?:\s+ใน)?\s*(${signsPat})`, 'g'),
      moon: new RegExp(`(?:ดวงจันทร์|พระจันทร์|Moon|moon)(?:\s+ของ\s+คุณ)?(?:\s+อยู่)?(?:\s+ใน)?\s*(${signsPat})`, 'g'),
    };
  }
  if (lang === 'vi') {
    return {
      rising: new RegExp(String.raw`(?:Ascendant|ascendant|cung\s+Thiên\s+Bình)(?:\s+của\s+bạn)?(?:\s+là)?(?:\s+ở)?\s+(${signsPat})`, 'gi'),
      sun: new RegExp(String.raw`(?:Mặt\s+Trời|Mặt\s+trời|Sun|sun)(?:\s+của\s+bạn)?(?:\s+là)?(?:\s+ở)?\s+(${signsPat})`, 'gi'),
      moon: new RegExp(String.raw`(?:Mặt\s+Trăng|Mặt\s+trăng|Moon|moon)(?:\s+của\s+bạn)?(?:\s+là)?(?:\s+ở)?\s+(${signsPat})`, 'gi'),
    };
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V453：本命锚点锁扩容到 10 大行星（V444 只管日月升，非日月行星裸奔）
//   覆盖：太阳/月亮/水星/金星/火星/木星/土星/天王星/海王星/冥王星
//   真值源：meta.computed_houses（computeViaPython 合并的全 10 行星 sign+house+retrograde）
//   只在本命所有格语境下修正（"你的/本命/votre/your + 行星"），绝不误伤流年行星（流年由 V445 锁）
// ══════════════════════════════════════════════════════════════════
const _V453_PLANET_KEYS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const _V453_PLANET_NAMES = {
  zh: { Mercury: '水星', Venus: '金星', Mars: '火星', Jupiter: '木星', Saturn: '土星', Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星' },
  en: { Mercury: 'Mercury', Venus: 'Venus', Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto' },
  fr: { Mercury: 'Mercure', Venus: 'Vénus', Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturne', Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluton' },
  es: { Mercury: 'Mercurio', Venus: 'Venus', Mars: 'Marte', Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Neptuno', Pluto: 'Plutón' },
  th: { Mercury: 'ดวงพุธ', Venus: 'ดวงศุกร์', Mars: 'ดวงอังคาร', Jupiter: 'ดวงพฤหัสบดี', Saturn: 'ดวงเสาร์', Uranus: 'ดวงมฤตยู', Neptune: 'ดวงเนปจูน', Pluto: 'ดวงพลูโต' },
  vi: { Mercury: 'Sao Thủy', Venus: 'Sao Kim', Mars: 'Sao Hỏa', Jupiter: 'Sao Mộc', Saturn: 'Sao Thổ', Uranus: 'Thiên Vương', Neptune: 'Hải Vương', Pluto: 'Diêm Vương' },
};
function _v453Poss(lang) {
  switch (lang) {
    case 'zh': return '(?:你的|本命|乃)?';
    case 'en': return '(?:your|her|his|my|our|their)\\s+';
    case 'fr': return '(?:ton|votre|mon|notre|son|sa|leur|ma)\\s+';
    case 'es': return '(?:tu|su|mi|nuestro|nuestra)\\s+';
    case 'th': return '(?:ดวง\\s*ของ\\s*คุณ|ของ\\s*คุณ|本命)?\\s*';
    case 'vi': return '(?:của\\s+bạn)?\\s*';
    default: return '';
  }
}
function _v453Link(lang) {
  switch (lang) {
    case 'zh': return '(?:星座)?(?:是|在|为)?\\s*';
    case 'en': return '(?:\\s+is)?(?:\\s+in)?\\s*';
    case 'fr': return '(?:\\s+est)?(?:\\s+en)?\\s*';
    case 'es': return '(?:\\s+es)?(?:\\s+en)?\\s*';
    case 'th': return '(?:อยู่\\s+ใน|ใน)?\\s*';
    case 'vi': return '(?:là)?(?:ở)?\\s*';
    default: return '\\s*';
  }
}
function _v453HouseLabel(lang) {
  switch (lang) {
    case 'zh': return '第(\\d+)宫';
    case 'en': return 'House\\s+(\\d+)';
    case 'fr': return 'Maison\\s+(\\d+)';
    case 'es': return 'Casa\\s+(\\d+)';
    case 'th': return 'บ้าน\\s+(\\d+)';
    case 'vi': return 'Nhà\\s+(\\d+)';
    default: return 'House\\s+(\\d+)';
  }
}
function _v453RetroPat(lang) {
  switch (lang) {
    case 'zh': return '(顺行|逆行)';
    case 'en': return '(retrograde|direct)';
    case 'fr': return '(rétrograde|direct)';
    case 'es': return '(retrógrado|directo)';
    case 'th': return '(โคจรย้อน|โคจรปกติ)';
    case 'vi': return '(xiều hành tụt|xiều hành thuận)';
    default: return '(retrograde|direct)';
  }
}
function _v453RetroWord(lang, retrograde) {
  switch (lang) {
    case 'zh': return retrograde ? '逆行' : '顺行';
    case 'en': return retrograde ? 'retrograde' : 'direct';
    case 'fr': return retrograde ? 'rétrograde' : 'direct';
    case 'es': return retrograde ? 'retrógrado' : 'directo';
    case 'th': return retrograde ? 'โคจรย้อน' : 'โคจรปกติ';
    case 'vi': return retrograde ? 'xiều hành tụt' : 'xiều hành thuận';
    default: return retrograde ? 'retrograde' : 'direct';
  }
}

function lockNatalAnchorRole(text, lang, astroMatrix, reportType) {
  // 🛡️ V478-guard: 年报(12 个月跨度)禁用【本命锚点锁】—— 镜像 V472-guard（V445 已用同一范式）。
  //   病根: _v453Poss 在 zh/th/vi 是【可选】占有词 (?:你的|本命|乃)? → 「木星在狮子座第十宫」
  //   这类【流年句】也被匹配 → 被强制改写成【本命】值。月报中流年句带「流年/流月」前缀且随后
  //   由 V445/V432 流月锁改回, 故月报无恙; 年报跨 12 个月, V445 已被 V472-guard 停用、
  //   V432 流月锁本轮同步停用 → 无人纠正 → 年报全篇把流年真值写成本命值。
  //   实测(1989-08-15 奥斯陆盘, 单刀改坏 71 行, 全部是「对的改错」):
  //     流年木星在狮子座第十宫(真值) → 木星巨蟹座(本命值)
  //     流年土星在白羊座第六宫(真值) → 土星摩羯座(本命值)
  //     流年冥王星在水瓶座第四宫(真值) → 冥王星天蝎座(本命值)
  //     月份标题「2026年10月：太阳在天秤座」→「太阳在狮子座」(本命太阳套流月)
  //   年报本命事实由 _v432LockNatal(computed_houses 全 10 行星) + 头部硬锁覆盖, 此处不必再锁。
  if (reportType === 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  const meta = astroMatrix && astroMatrix.meta;
  if (!meta) return text;
  // 🛠️ V453: 真值 = 本命全 10 行星 sign+house+retrograde（meta.computed_houses，由 v69_client 合并本命盘）
  //   ⚠️ 旧代码用 meta.natal_planets —— 该字段从未被填充（undefined），导致 V453 七行星锁全空转！
  //   改用 meta.computed_houses（含 Sun/Moon/Mercury/Venus/... 全 10 行星 sign+house+retrograde）。
  const np = meta.computed_houses || meta.natal_planets || {};
  const truth = {};
  if (meta.rising_sign) truth.rising = { sign: meta.rising_sign, house: 1, retrograde: false };
  if (meta.sun_sign) truth.sun = { sign: meta.sun_sign, house: (np.Sun && np.Sun.house) || 1, retrograde: !!(np.Sun && np.Sun.retrograde) };
  if (meta.natal_moon) truth.moon = { sign: meta.natal_moon.sign, house: meta.natal_moon.house, retrograde: !!meta.natal_moon.retrograde };
  for (const k of _V453_PLANET_KEYS) {
    const c = np[k];
    if (c && c.sign) truth[k] = { sign: c.sign, house: c.house, retrograde: !!c.retrograde };
  }
  const signs = _v444Signs(lang);
  if (!signs) return text;
  const signsPat = signs.map(_v444Esc).join('|');
  let out = text;
  // ① 日月升（沿用 V444 既有模式）
  const pats = _v444Patterns(lang, signsPat);
  if (pats) {
    for (const role of ['sun', 'rising', 'moon']) {
      if (!truth[role]) continue;
      const re = pats[role];
      const idx = SUN_SIGN_EN.indexOf(truth[role].sign);
      if (idx < 0) continue;
      const trueLocal = signs[idx];
      out = out.replace(re, (m, captured) => (captured === trueLocal ? m : m.replace(captured, trueLocal)));
    }
  }
  // ② V453：其余 7 行星本命锚点全锁（星座 + 宫位 + 逆行）
  const pnames = _V453_PLANET_NAMES[lang];
  if (pnames) {
    const poss = _v453Poss(lang);
    const link = _v453Link(lang);
    const houseLab = _v453HouseLabel(lang);
    const retroPat = _v453RetroPat(lang);
    for (const k of _V453_PLANET_KEYS) {
      const t = truth[k];
      if (!t) continue;
      const idx = SUN_SIGN_EN.indexOf(t.sign);
      if (idx < 0) continue;
      const trueLocal = signs[idx];
      const planet = _v444Esc(pnames[k]);
      // 星座修正：poss + 行星 + (link) + 错星座（i 标志：fr/es 本命所有格首字母大写 Votre/Vénus 亦匹配）
      const signRe = new RegExp(poss + planet + link + '(' + signsPat + ')', 'gi');
      out = out.replace(signRe, (m, s) => (s === trueLocal ? m : m.replace(s, trueLocal)));
      // 宫位修正：poss + 行星 + (可选中间词) + 宫位标签 + 错宫号
      const houseRe = new RegExp(poss + planet + '(?:[^\\n]{0,18}?)' + houseLab, 'gi');
      out = out.replace(houseRe, (m, num) => (String(num) === String(t.house) ? m : m.replace(String(num), String(t.house))));
      // 逆行修正：poss + 行星 + (任意中间词) + 逆行词
      const retroRe = new RegExp(poss + planet + '[^\\n]{0,48}?' + retroPat, 'gi');
      const trueRetro = _v453RetroWord(lang, t.retrograde);
      out = out.replace(retroRe, (m, w) => (w === trueRetro ? m : m.replace(w, trueRetro)));
    }
  }
  // 🛠️ V444-th-cluster-fix: 泰文倒装集群 "ราศีX บ้าน Y ซึ่งเป็นที่สถิตของ P1กำเนิด P2กำเนิด..." 逐个真值修正
  //   实测 1995-03-18 曼谷 th 盘: W4 写 "ราศีมีน บ้าน 12 ซึ่งเป็นที่สถิตของดาวพุธกำเนิด ดาวศุกร์กำเนิด ดาวเสาร์กำเนิด"
  //   LLM 把 3 颗本命行星全批量归到 Pisces H12，但 Venus 真值=Aquarius H12 → 错误。
  //   正装扫描(ดาวศุกร์ ราศีX)匹配不到倒装句式 → 漏网。本分支逐个核对并拆分重写。
  if (lang === 'th') {
    const _thPlanetKey = {
      'ดวงพุธ': 'Mercury', 'ดาวพุธ': 'Mercury',
      'ดวงศุกร์': 'Venus', 'ดาวศุกร์': 'Venus',
      'ดวงอังคาร': 'Mars', 'ดาวอังคาร': 'Mars',
      'ดวงพฤหัสบดี': 'Jupiter', 'ดาวพฤหัสบดี': 'Jupiter',
      'ดาวเสาร์': 'Saturn', 'ดวงเสาร์': 'Saturn',
      'ดาวยูเรนัส': 'Uranus', 'ดาวเนปจูน': 'Neptune', 'ดาวพลูโต': 'Pluto',
      'ดวงอาทิตย์': 'Sun', 'ดาวอาทิตย์': 'Sun',
      'ดวงจันทร์': 'Moon', 'ดาวจันทร์': 'Moon',
    };
    const _thTH = '[\u0E01-\u0E4F]';
    const clusterRe = new RegExp('ราศี(' + signsPat + ')\\s*บ้าน\\s*(\\d+)\\s*ซึ่งเป็นที่สถิตของ\\s*([^。\\n]+?)(?:ของท่าน|$)', 'g');
    out = out.replace(clusterRe, (m, signCap, houseCap, planetList) => {
      const planets = [];
      const plRe = new RegExp('(ดาว' + _thTH + '+|ดวง' + _thTH + '+)\\s*กำเนิด', 'g');
      let pm;
      while ((pm = plRe.exec(planetList)) !== null) {
        const key = _thPlanetKey[pm[1]];
        if (key && truth[key]) planets.push({ key, name: pm[1] });
      }
      if (!planets.length) return m;
      const parts = planets.map(p => {
        const t = truth[p.key];
        const idx = SUN_SIGN_EN.indexOf(t.sign);
        const localSign = idx >= 0 ? signs[idx] : t.sign;
        return `ราศี${localSign} บ้าน ${t.house} (${p.name}กำเนิด)`;
      });
      return parts.join(', ');
    });
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════
// 🛡️ V445：流年行星星座归属锁（军师 9-14 主公令·极致封仓）
// 目的：V444 只锁本命锚点(上升/太阳/月亮)。但陷阱段 LLM 仍会把
//   流年行星(水/金/火/木/土)的星座写错——如把火星写成天蝎座(实则在巨蟹)，
//   与同报告正文自相矛盾。本锁扫描"星座(的)行星"与"行星(在)星座"搭配，
//   与 astroMatrix.months[0] 真值对撞，错则归位。不锁太阳(V444 已管本命太阳)。
// ══════════════════════════════════════════════════════════════════
// 🛠️ V457: 扩展覆盖全部 10 行星（原仅内行星 mercury/venus/mars/jupiter/saturn，
//   外行星 uranus/neptune/pluto 漏网 → Trap 段若写错外行星 sign 完全不被锁。
//   治未病：当前盘 natal≈transit（Neptune 慢）恰好不暴露，但换盘即炸。
const _V445_PLANET_KEYS = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
const _V445_PLANET_NAMES = {
  zh: { mercury: '水星', venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星', uranus: '天王星', neptune: '海王星', pluto: '冥王星' },
  en: { mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto' },
  fr: { mercury: 'Mercure', venus: 'Vénus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturne', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluton' },
  es: { mercury: 'Mercurio', venus: 'Venus', mars: 'Marte', jupiter: 'Júpiter', saturn: 'Saturno', uranus: 'Urano', neptune: 'Neptuno', pluto: 'Plutón' },
  th: { mercury: 'ดวงพุธ', venus: 'ดวงศุกร์', mars: 'ดวงอังคาร', jupiter: 'ดวงพฤหัสบดี', saturn: 'ดวงเสาร์', uranus: 'ดาวยูเรนัส', neptune: 'ดาวเนปจูน', pluto: 'ดาวพลูโต' },
  vi: { mercury: 'Sao Thủy', venus: 'Sao Kim', mars: 'Sao Hỏa', jupiter: 'Sao Mộc', saturn: 'Sao Thổ', uranus: 'Sao Thiên Vương', neptune: 'Sao Hải Vương', pluto: 'Sao Diêm Vương' },
};

function _v445TruthSigns(lang, astroMatrix) {
  const m0 = astroMatrix && astroMatrix.months && astroMatrix.months[0];
  if (!m0) return null;
  const signs = _v444Signs(lang);
  if (!signs) return null;
  const out = {};
  for (const k of _V445_PLANET_KEYS) {
    const p = m0[k];
    if (p && p.sign) {
      const idx = SUN_SIGN_EN.indexOf(p.sign);
      if (idx >= 0) out[k] = signs[idx];
    }
  }
  return out;
}

// 🛠️ V460-fix5: 连词式行星真值漏网修复（中文实测）。
//   现象：「流年金星与流年水星同在天秤座第11宫」——真值金星在天蝎座，但「P1与P2同在S座」
//   连词句式让 lockTransitPlanetSigns 的 reB（要求「金星(在)S座」紧邻）匹配不上 → 金星错误星座漏网。
//   策略：命中 P1与/和 P2同(在)S座[第N宫] 且真值(P1)≠真值(P2) 时，拆成两段各自真值的独立从句。
//   宫位取 months[0][k].house 真值；拿不到就省略该宫位（绝不臆造）。
function _v445TruthHouses(astroMatrix) {
  const m0 = astroMatrix && astroMatrix.months && astroMatrix.months[0];
  if (!m0) return {};
  const out = {};
  for (const k of _V445_PLANET_KEYS) {
    const p = m0[k];
    if (p && p.sign && p.house) out[k] = p.house;
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════
// V460-fix5：连词式行星声明（"P1与P2同在S座"）真值拆分锁 —— 全语种通用
// 根因：AI 常把两个流年行星写进同一星座（如「水星与金星同在天蝎座」），而两者真值常不同；
//       单行星真值锁(reB)只能改相邻星座，连词簇会让其中一个行星永久错配。
// 治本：识别「行星簇 + 动词 + 星座」结构，按各自真值拆成「P1在真值1、P2在真值2」。
//   - 仅当簇断言的星座与≥1行星真值不符时才改写（真值全同/无星座断言→原句无误→不动）
//   - 各语种连词/动词/宫位格式差异大，用 _SPLIT_CFG 表驱动
// ═══════════════════════════════════════════════════════════════════
const _SPLIT_CFG = {
  zh: { pf: '(?:流年|流月)?', conn: '(?:与|和|、|及|以及)', sp: '',
        verb: '(?:同|共|一同|皆|同时)?(?:在|位于|处于|驻|驻守|聚于|聚|落入|落在|落于|落|进入|行经|停留|守|临|照耀|降临)?',
        houseRe: '第\\d+宫', join: '、',
        part: (name, sign, house) => name + '在' + sign + (house ? '第' + house + '宫' : '') },
  en: { pf: '(?:transit\\s+)?', conn: '\\s+(?:and|&|with|,)\\s+', sp: '',
        verb: '\\s+(?:in|are in|is in|transit|transits|reside|resides|occupy|occupies|enter|enters|sit|sits|travel|travels)\\s*',
        houseRe: 'House\\s*\\d+', join: ', ',
        part: (name, sign, house) => name + ' in ' + sign + (house ? ' (House ' + house + ')' : '') },
  es: { pf: '(?:transit\\s+)?', conn: '\\s+(?:y|e|,|con)\\s+', sp: '',
        verb: '\\s+(?:en|están en|está en|transitan|transita|residen|reside)\\s*',
        houseRe: 'Casa\\s*\\d+', join: ', ',
        part: (name, sign, house) => name + ' en ' + sign + (house ? ' (Casa ' + house + ')' : '') },
  fr: { pf: '(?:transit\\s+)?', conn: '\\s+(?:et|avec|,)\\s+', sp: '',
        verb: '\\s+(?:en|sont en|est en|traverse|traversent|résident|réside)\\s*',
        houseRe: 'Maison\\s*\\d+', join: ', ',
        part: (name, sign, house) => name + ' en ' + sign + (house ? ' (Maison ' + house + ')' : '') },
  th: { pf: '', thSuf: 'ทรานซิส', conn: '\\s*(?:และ|กับ)\\s*', sp: '(?:ราศี)?',
        verb: '\\s*(?:ใน|อยู่ใน|เดินทางสู่)\\s*',
        houseRe: 'บ้าน\\s*\\d+', join: ' และ ',
        part: (name, sign, house) => name + 'ในราศี' + sign + (house ? ' (บ้าน ' + house + ')' : '') },
  vi: { pf: '(?:transit\\s+)?', conn: '\\s+(?:và|với|,)\\s+', sp: '',
        verb: '\\s+(?:trong|ở|tại|nằm|hành vận|đang)\\s*',
        houseRe: 'Nhà\\s*\\d+', join: ', ',
        part: (name, sign, house) => name + ' hành vận ' + sign + (house ? ' (Nhà ' + house + ')' : '') },
};

function splitConjoinedPlanetClaims(text, lang, astroMatrix) {
  if (!text || typeof text !== 'string') return text;
  const cfg = _SPLIT_CFG[lang];
  if (!cfg) return text;
  const truth = _v445TruthSigns(lang, astroMatrix);
  if (!truth || !Object.keys(truth).length) return text;
  const names = _V445_PLANET_NAMES[lang] || {};
  const signs = _v444Signs(lang);
  if (!signs || !Object.keys(names).length) return text;
  const kBy = {};
  _V445_PLANET_KEYS.forEach(k => { if (names[k]) kBy[names[k]] = k; });
  // 行星名（th 允许可选 ทรานซิส 后缀）
  const P = Object.keys(kBy).map(n => _v444Esc(n) + (cfg.thSuf ? '(?:' + cfg.thSuf + ')?' : '')).join('|');
  if (!P) return text;
  const signsPat = signs.map(_v444Esc).join('|');
  const houses = _v445TruthHouses(astroMatrix);
  const CLUSTER = '(' + cfg.pf + '(?:' + P + ')' + '(?:' + cfg.conn + cfg.pf + '(?:' + P + '))+)';
  const _spPart = cfg.sp ? '(?:' + cfg.sp + ')?' : '';
  const re = new RegExp(CLUSTER + '(?:' + cfg.verb + ')' + _spPart + '(' + signsPat + ')(?:\\s*\\(?(' + cfg.houseRe + ')\\)?)?', 'g');
  const reN = new RegExp(cfg.pf + '(' + P + ')', 'g');
  return text.replace(re, (m, cluster, s, h) => {
    const ks = [];
    let mm; reN.lastIndex = 0;
    while ((mm = reN.exec(cluster)) !== null) {
      const nm = mm[1].replace(cfg.thSuf || '', '');
      if (kBy[nm]) ks.push(kBy[nm]);
    }
    if (ks.length < 2) return m;
    const ts = ks.map(k => truth[k]);
    if (ts.some(t => !t)) return m;
    if (ts.every(t => t === ts[0])) return m;   // 真值全同 → 原句无误 → 不动
    const lead = (cluster.match(new RegExp('^' + cfg.pf)) || [''])[0] || '';
    const out = ks.map((k) => lead + cfg.part(names[k], truth[k], houses ? houses[k] : null)).join(cfg.join);
    console.log('[V460-fix5] 连词行星拆分(' + lang + '): ' + m + ' → ' + out);
    return out;
  });
}

function lockTransitPlanetSigns(text, lang, astroMatrix, reportType) {
  // 🛡️ V472-guard: 年报(12个月跨度)禁用单月固化锁。
  // 病根: _v445TruthSigns 只锚 months[0](首月), 年报内水星/金星/火星多次换座、木星2027-08狮子→处女,
  // 补全路径触发时会把后半段正确的星座声明误纠回首月星座。年报真值由 P1.1 逐月注入块锁定, 此锁只需服务月报。
  if (reportType === 'yearly') return text;
  if (!text || typeof text !== 'string') return text;
  const truth = _v445TruthSigns(lang, astroMatrix);
  if (!truth || !Object.keys(truth).length) return text;
  const names = _V445_PLANET_NAMES[lang];
  if (!names) return text;
  const signs = _v444Signs(lang);
  const signsPat = signs.map(_v444Esc).join('|');
  const suf = lang === 'zh' ? '座' : '';
  let out = text;
  for (const k of _V445_PLANET_KEYS) {
    const trueSign = truth[k];
    const planet = names[k];
    if (!trueSign || !planet) continue;
    if (lang === 'zh') {
      const reA = new RegExp(String.raw`(${signsPat})${suf}?的(?:流年|流月)?${planet}`, 'g');
      out = out.replace(reA, (m, s) => (s === trueSign ? m : m.replace(s, trueSign)));
      // 🛠️ V457-fix: 原 reB 为 (${signsPat})${suf}，zh 的 signsPat 已含「座」（白羊座），再拼 suf=座 → 要求「白羊座座」双座，永远匹配不上
      //   导致中文「海王星在白羊座」写法完全锁不住（reA 仅覆盖「白羊座的海王星」写法）。去掉 suf（signsPat 已是完整星座名）。
      const reB = new RegExp(String.raw`(?:流年|流月)?${planet}(?:在|位于|落入|行经)?(${signsPat})`, 'g');
      out = out.replace(reB, (m, s) => (s === trueSign ? m : m.replace(s, trueSign)));
    } else {
      const inWord = lang === 'en' ? '(?:\\s+in|\\s+is\\s+in|\\s+enters)?\\s+'
        : lang === 'fr' ? '(?:\\s+en|\\s+dans)?\\s+'
        : lang === 'es' ? '(?:\\s+en|\\s+está\\s+en)?\\s+'
        : lang === 'th' ? '(?:\\s+อยู่\\s+ใน|\\s+ใน)?\\s*'
        : '(?:\\s+ở|\\s+trong)?\\s*';
      const reB = new RegExp(String.raw`(?:transit\s+)?${planet}${inWord}(${signsPat})`, 'g');
      out = out.replace(reB, (m, s) => (s === trueSign ? m : m.replace(s, trueSign)));
    }
  }
  out = splitConjoinedPlanetClaims(out, lang, astroMatrix);   // 🛠️ V460-fix5: 连词句式兜底
  return out;
}

// 🛠️ V460-fix4: 月亮轨迹「换宫写在括号外」残渣归一。
//   现象（线上实测）：AI 正文散文里把「狮子座（第8宫→第9宫）」写成「狮子座（第8宫）→第9宫）」，
//   留下悬空的「）→第N宫）」脏尾（月报正文可见穿帮，非规范轨迹句，V438 锁不到）。
//   规范轨迹句不含「宫）→第」模式，故本函数对 V438 产物零影响（幂等、不误伤）。
function fixMoonHouseParens(text) {
  if (!text) return text;
  return text
    .replace(/（第(\d+)宫）\s*→\s*(第\d+宫(?:→第\d+宫)*)）?/g, '（第$1宫→$2）')
    .replace(/第(\d+)宫→第\1宫/g, '第$1宫');   // 自环「第5宫→第5宫」必为漂移残渣，收敛为单宫
}

function _v438OverrideBody(body, cfg, truth) {
  if (!truth) return body;
  const signs = cfg.signs || [];
  // 🛠️ V461-fix: body 全以 \n 开头（标题→换行→body），旧版 tokRe 找到 \n → stopAt=0 → 整锁跳步
  //   剥掉全部前导空白（\n / 空格），在 tokRe/toks/lead/tail 全部用干净 body；
  //   末尾把前导空白补回去，保证幂等（不改变 body 首字符）。
  const leadingWS = body.match(/^[\n\s]*/)[0];
  const work = leadingWS ? body.slice(leadingWS.length) : body;
  if (!signs.length) return body;
  const signsPat = signs.map(_v444Esc).join('|');
  // 🛠️ V452: 位置无关——识别过境序列 span，用真值序列硬重写。
  //   只把由过境分隔符（→ / 、 / 逗号+空白）连接的连续星座 token 串成 run；
  //   旧版按「句末 stopRe」截断：英文周段落常一整行无换行 → 整段散文被吞；
  //   且副标题在过境句之前时 stopRe 落在副标题 → 整段跳过（W3 开头错星座漏网根因）。
  //   日期句（"X日月亮进入Y座"）用「月亮进入」而非 →/、 连接 → 自动断开，留给 V435 锁处理。
  const greedy = cfg.multiWordSigns ? '+' : '+?';
  // 越南变音符号 Unicode 范围（确保 tokRe 在它们之前停止，而非贪吃到括号内）
  const VI_DIAC = '\\u01B0\\u01A1\\u1EA0-\\u1EF9';
  const FULLW = '（）'; // zh/th 全角括号
  // 🛠️ V460-fix2: AI 经常把多宫腿写成「金牛座（第5宫）→第6宫→第7宫）」（换宫写在括号外），
  //   旧 tokRe 只吃到「（第5宫）」就停 → run 断裂成 2 腿 → 只替换子串、后续残留原封不动
  //   → 产出「…狮子座（第8宫）→第6宫→第7宫）、双子座（第7宫）→第8宫）…」这类脏串（用户实测就是这版）。
  //   让 token 继续吞掉紧随其后的「→ <宫位> [)]」尾巴，使整条腿合成一个 token，run 才完整。
  const HOUSE_TAIL = '(?:\\s*(?:→|->)\\s*(?:(?:第\\s*)?\\d{1,2}\\s*宫|House\\s*\\d{1,2}|Casa\\s*\\d{1,2}|Maison\\s*\\d{1,2}|บ้าน\\s*\\d{1,2}|Nhà\\s*\\d{1,2})[)）]?)*';
  // 排除相反方向括号：开( 配对时排除 )/），关( 配对时排除 （/（
  // zh 星座后无空格：白羊座（第9宫）→ [^\s]* 吞0空格；en 有空格：Aries (House...) → [^\s]* 吞字母剩余量
  // 开括号: ASCII ( 或全角 （; 闭括号: ASCII ) 或全角 ）; body: 排除闭括号和越南变音
  // 🛠️ V438-th-fix: 泰文星座名在报告中带 ราศี 前缀，tokRe 必须吃掉前缀否则 gap 里残留 ราศี 导致 connector 断裂
  const signPrefixPat = cfg.signPrefix ? '(?:' + cfg.signPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')?' : '';
  const tokRe = new RegExp(signPrefixPat + '(' + signsPat + ')' + greedy + '\\s*[(（]([^' + FULLW + ')' + FULLW + VI_DIAC + ']{0,40})[\\)' + FULLW + ']' + HOUSE_TAIL, 'g');
  const toks = [];
  let mm;
  tokRe.lastIndex = 0;
  while ((mm = tokRe.exec(work)) !== null) {
    if (mm[1]) toks.push({ i: mm.index, e: mm.index + mm[0].length });
  }
  if (toks.length < 2) return body;   // 月亮路径至少 2 段；不足视为无序列 → 不动
  // 只把由过境分隔符（→ / 、 / 逗号+空白）连接的 token 串成 run；其余（日期句等）断开
  const connectorRe = /^[\s→、,]+$/;
  let best = null, run = [toks[0]];
  for (let k = 1; k < toks.length; k++) {
    const gap = work.slice(toks[k-1].e, toks[k].i);
    if (connectorRe.test(gap)) run.push(toks[k]);
    else { if (run.length > 1 && (!best || run.length > best.length)) best = run; run = [toks[k]]; }
  }
  if (run.length > 1 && (!best || run.length > best.length)) best = run;
  if (!best) return body;
  const runText = work.slice(best[0].i, best[best.length - 1].e);
  if (runText === truth) return body;   // 幂等：已是真值序列 → 不动
  const lead = work.slice(0, best[0].i);
  const tail = work.slice(best[best.length - 1].e);
  console.log('[V452] span replaced (' + best.length + ' legs): ' + runText + ' → ' + truth);
  return leadingWS + lead + truth + tail;
}


// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// 月报章节标题兜底修复 (DeepSeek 流式吐字畸变修复)
// 把 AI 缩写/截断的章节标题还原成完整版
// ═══════════════════════════════════════════════════════════════
const SECTION_PLACEHOLDERS = {
  zh: { theme: '【占位符-系统注入】本月命运主题（请刷新重试，AI 未生成此节）', trap: '【占位符-系统注入】消费陷阱（请刷新重试，AI 未生成此节）' },
  en: { theme: '【System-Injected】Monthly Destiny Theme (please refresh, AI did not generate this section)', trap: '【System-Injected】Spending Traps (please refresh, AI did not generate this section)' },
  es: { theme: '【Inyección del Sistema】Tema de Destino Mensual (actualice para reintentar, la IA no generó esta sección)', trap: '【Inyección del Sistema】Trampas Financieras (actualice para reintentar, la IA no generó esta sección)' },
  fr: { theme: '【Injection Système】Thème de Destin du Mois (veuillez actualiser, l\'IA n\'a pas généré cette section)', trap: '【Injection Système】Pièges Financiers (veuillez actualiser, l\'IA n\'a pas généré cette section)' },
  th: { theme: '【ระบบป้ายแทรก】ธีมโชคชะตาประจำเดือน (กรุณารีเฟรช AI ไม่ได้สร้างส่วนนี้)', trap: '【ระบบป้ายแทรก】กับดักทางการเงิน (กรุณารีเฟรช AI ไม่ได้สร้างส่วนนี้)' },
  vi: { theme: '【Hệ Thống Chèn】Chủ Đề Vận Mệnh Tháng (vui lòng làm mới, AI chưa tạo phần này)', trap: '【Hệ Thống Chèn】Cạm bẫy Tài chính (vui lòng làm mới, AI chưa tạo phần này)' }
};

// 🛠️ 章节标题（展示层）按 lang 翻译——UI 视图层 100% 遵循 lang，绝不对用户展示未翻译中文
const SECTION_HEADERS = {
  zh: { theme: '本月命运主题', trap: '消费陷阱：' },
  en: { theme: 'Monthly Destiny Theme', trap: 'Spending Traps: ' },
  es: { theme: 'Tema de Destino Mensual', trap: 'Trampas Financieras: ' },
  fr: { theme: 'Thème de Destin du Mois', trap: 'Pièges Financiers: ' },
  th: { theme: 'ธีมโชคชะตาประจำเดือน', trap: 'กับดักทางการเงิน: ' },
  vi: { theme: 'Chủ Đề Vận Mệnh Tháng', trap: 'Cạm bẫy Tài chính: ' }
};

const MONTH_NAMES = {
  zh: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  fr: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  th: ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'],
  vi: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
};

function getMonthLabel(lang, year, month) {
  const _names = MONTH_NAMES[lang] || MONTH_NAMES.zh;
  const _name = _names[month - 1];
  if (lang === 'zh') return `${year}年${_name}`;
  return `${_name} ${year}`;
}

// ═══════════════════════════════════════════════════════════════
// 🌟 V462：周副标题「单一真源」+ 旧套话根治
//   治本背景（2026-09-21 封仓验收抓到的真根因）：
//     V461-B/C 只改了 _W1_SUB~_W4_SUB 与提示词黑名单，但
//     ① HEADER_TEMPLATES ② HEADER_TEMPLATES_RP ③ _langW1Title
//     三处模板仍**硬编码**旧套话（财富充能/高危熔断/顺流蓄力/财富爆发），
//     ④ fixMonthlySectionTitles 还会把残缺词「修复」**回**旧套话，
//     ⑤ 流式 clean 链同样回填旧套话。
//   → 结果：LLM 就算守规矩，代码也把它改回旧词（改了一次没生效的真因）。
//   本块：真源唯一 + 全语言旧词归一，任何路径吐出旧词都被改写为新意象。
// ═══════════════════════════════════════════════════════════════
const V462_WEEK_SUB = {
  zh: ['水星淬火 · 技能显化之窗', '海王迷雾 · 绝对熔断', '土星沉淀 · 静水深流', '木星高光 · 收割落袋'],
  en: ['Mercury Forged · Skill Manifestation', 'Neptune Mist · Absolute Meltdown', 'Saturn Sediment · Still Deep Flow', 'Jupiter Spotlight · Harvest In Hand'],
  es: ['Mercurio Forjado · Manifestación de Habilidad', 'Niebla de Neptuno · Fusión Absoluta', 'Sedimento de Saturno · Corriente Profunda', 'Spotlight de Júpiter · Cosecha en Mano'],
  fr: ['Mercure Trempé · Manifestation de Compétence', 'Brume de Neptune · Fusion Absolue', 'Sédiment de Saturne · Courant Profond', 'Spotlight de Jupiter · Récolte en Main'],
  th: ['ดาวพุธหลอมแฝง · ประจักษ์ทักษะ', 'เนปจูนหมอกลง · หลอมละลายเด็ดขาด', 'เสาร์ตะกอน · น้ำเงียบลึก', 'พฤหัสจุดสว่าง · รับรางวัลลงมือ'],
  vi: ['Thủy Tinh Luyện · Hiện Thực Kỹ Năng', 'Hải Vương Sương Mù · Tan Chảy Tuyệt Đối', 'Thổ Tinh Trầm Tích · Dòng Nước Sâu', 'Mộc Tinh Điểm Sáng · Gặt Hái Trong Tay'],
};
const v462Sub = (lang) => V462_WEEK_SUB[lang] || V462_WEEK_SUB.zh;

// 旧套话 / 截断残留 → 归一目标索引（0=W1 … 3=W4）
const V462_LEGACY_SUB = {
  zh: [['财富充能', 0], ['财充', 0], ['高危熔断', 1], ['高熔断', 1], ['高熔', 1], ['高危', 1],
       ['顺流蓄力', 2], ['顺流', 2], ['顺蓄', 2],
       ['财富爆发', 3], ['财富爆', 3], ['财爆', 3]],
  en: [['Wealth Recharging', 0], ['High-Risk Circuit Breaker', 1], ['Strategic Integration', 2],
       ['The Wealth Explosion', 3], ['Wealth Explosion', 3]],
  es: [['Recarga de Riqueza', 0], ['Cortocircuito de Alto Riesgo', 1], ['Integración Estratégica', 2], ['Explosión de Riqueza', 3]],
  fr: [['Recharge de Richesse', 0], ['Disjoncteur à Haut Risque', 1], ['Intégration Stratégique', 2], ['Explosion de Richesse', 3]],
  th: [['การเติมพลังความมั่งคั่ง', 0], ['พุธหลอมรวม', 0], ['วงจรความเสี่ยงสูง', 1], ['พุธสว่าง', 1], ['พุธแยกทาง', 2], ['การบูรณาการเชิงกลยุทธ์', 2], ['การระเบิดความมั่งคั่ง', 3]],
  vi: [['Nạp năng lượng Tài sản', 0], ['Mạch Ngắn Rủi ro Cao', 1], ['Tích hợp Chiến lược', 2], ['Bùng nổ Tài sản', 3]],
};

// 周副标题归一（幂等；新意象不含旧词子串，可反复调用）
function v462NormalizeWeekSub(text, lang) {
  if (!text || typeof text !== 'string') return text;
  const subs = v462Sub(lang);
  let c = text;
  // ① 旧套话全词 → 新意象（长词在前，避免「财富爆发」被「财爆」误切）
  // V464-fix: Thai diacritics ั(U+0E33) and ุ(U+0E38) appear/drop inconsistently across LLM outputs vs LEGACY_SUB keys.
  //   → strip both from text and keys before includes() check. Only strip these 2 chars (not all diacritics).
  const _tstrip = lang === 'th' ? (s) => s.replace(/[ั-ฺ]/g, (m, o) => o === 0 ? m : '') : (s) => s;
  const _txt = _tstrip(text);
  for (const [legacy, idx] of (V462_LEGACY_SUB[lang] || V462_LEGACY_SUB.zh)) {
    if (_txt.includes(_tstrip(legacy)) || c.includes(legacy)) c = c.split(legacy).join(subs[idx]);
  }
  // ② 中文括号内字符脱落（「（财）」「（高）」「（顺）」等）→ 按周次归一
  if (lang === 'zh') {
    c = c.replace(/第([1-4])周([^\n]{0,30}?)（[^）\n]{0,6}）\s*[顺高财危熔流蓄爆]{0,4}）/g,
                  (m, n, pre) => `第${n}周${pre}（${subs[Number(n) - 1]}）`);
    c = c.replace(/）\s*[顺高财危熔流蓄爆]{1,4}）/g, '）');
  }
  return c;
}

// 月轨「天文学日志式」→ 诗意化（V462-fix2）
//   根因：原替换只写在 callDeepSeekStream 的「逐 chunk」清洗链里，
//   而 `月亮过境：流月月亮依次行经…` 会跨 chunk 边界（FLUSH_SIZE=80），
//   逐 chunk replace 永远匹配不到 → 必须放在全文/整段级净化层里才可靠。
function v462PoeticizeTrail(text, lang) {
  if (!text || typeof text !== 'string') return text;
  let c = text;
  if (lang === 'zh') {
    // ① 剔天文标签前缀（全角/半角冒号 + 已归一形态一律清掉）
    c = c.replace(/(\u6708\u4eae\u8fc7\u5883|\u6708\u7403\u8fc7\u5883|\u6708\u4eae\u9014\u7ecf)\s*[\uff1a:]\s*/g, '');
    // ①b 无冒号残留（陷阱段括号内等）→ 诗意替词
    c = c.split('\u6708\u4eae\u8fc7\u5883').join('\u6708\u4eae\u9014\u7ecf');
    // ② 日志式引导词 → 诗意月轨
    c = c.split('\u6d41\u6708\u6708\u4eae\u4f9d\u6b21\u884c\u7ecf').join('\u6708\u5149\u7684\u8db3\u8ff9\u63a0\u8fc7');
    c = c.split('\u672c\u6708\u6708\u4eae\u4f9d\u6b21\u884c\u7ecf').join('\u6708\u5149\u7684\u8db3\u8ff9\u63a0\u8fc7');
    c = c.split('\u6708\u4eae\u4f9d\u6b21\u884c\u7ecf').join('\u6708\u5149\u7684\u8db3\u8ff9\u63a0\u8fc7');
    c = c.split('\u6708\u4eae\u884c\u7ecf').join('\u6708\u5149\u7684\u8db3\u8ff9\u63a0\u8fc7');
    // ③ 剔「N日X座、N日Y座换座」/「N日月亮进入X座」日期清单句
    //    保留月轨本身（已含星座/宫位轨迹），只删重复的日期表。
    //    ⚠️ 判据必须双条件（血泪）：单看「≥2 个日期」会误杀周标题——
    //       `第1周：9月1日–7日（…）` 里 `1日`+`7日` 就是两个匹配！
    //       故要求：① 句内含换座/进入类动词 且 ② 日期数 ≥2 或以日期开头
    const _INGRESS_RE = /(\u6362\u5ea7|\u8fdb\u5165|\u884c\u81f3|\u843d\u5165|\u5165\u5ea7)/;
    c = c.split('\n').map((line) => {
      // 标题/胴面行不碰——仅限「行首标题」或「第N周：」真标题；
      // ⚠️ 不能用含「第N周」就跳（血泪）：正文里「把第2周掉置的谈判」会整行免检 → 残留日期清单
      if (/^\s*[✦【\[]/.test(line) || /\u7b2c[1-4\u4e00\u4e8c\u4e09\u56db]\u5468[\uff1a:]/.test(line)) return line;
      if (!/\d{1,2}\u65e5/.test(line)) return line;
      const kept = line.split('\u3002').filter((s) => {
        const dates = (s.match(/\d{1,2}\u65e5/g) || []).length;
        if (dates < 2 && !/^\s*\d{1,2}\u65e5/.test(s)) return true;
        if (!_INGRESS_RE.test(s)) return true;
        return !(dates >= 2 || /^\s*\d{1,2}\u65e5/.test(s));
      });
      return kept.join('\u3002');
    }).join('\n');
    // ④ 收尾：清单句删除后残留的空白行归一（只压 3+ 连换行，绝不碰 2 连空行——
    //    V446-trap2 铁律：标题前空行必须保留）
    c = c.replace(/\n{3,}/g, '\n\n');
  } else {
    const map = {
      en: [/Moon\s+transit:\s*/gi, /The Moon transits through/g],
      es: [/Tr[aá]nsito lunar:\s*/gi, /La Luna transita por/g],
      fr: [/Transit lunaire\s*:\s*/gi, /La Lune traverse/g],
      th: [/การโคจรของดวงจันทร์:\s*/g, /ดวงจันทร์เคลื่อนผ่าน/g],
      vi: [/Quá cảnh Mặt Trăng:\s*/gi, /Mặt Trăng đi qua/g],
    }[lang];
    if (map) {
      c = c.replace(map[0], '');
      c = c.replace(map[1], v462TrailIntro(lang));
    }
  }
  return c;
}

// 各语言月轨引导词（与 _V438_CFG.intro 保持同一真源口径）
function v462TrailIntro(lang) {
  return ({ zh: '月光的足迹掠过', en: "The Moon's path sweeps through", es: 'El rastro de la Luna recorre',
            fr: 'Le sillage de la Lune traverse', th: 'เส้นทางจันทราเคลื่อนผ่าน', vi: 'Vệt trăng lần lượt đi qua' })[lang] || '月光的足迹掠过';
}

// V462-fix3: 流式「有损净化」安全发射器
//   流式逐块替换会跳跨 chunk 边界失配（「月亮过境：流月月亮依次行经」跨 flush 就改不到）；
//   治法：只对「已成句的前缀」做净化，句末残句攒到下一块再发，长句超 200 字强制断。
//   幂等 + 无状态依赖，可直接单测。
function v462StreamSafeEmitter(emit, lang, maxCarry = 400, keep = 80) {
  const safe = (t) => v462PoeticizeTrail(v462NormalizeWeekSub(t, lang), lang);
  let carry = '';
  return {
    push(t, force) {
      if (t) carry += t;
      if (!carry) return;
      if (force) {
        const all = carry; carry = '';
        emit(safe(all));
        return;
      }
      // ① 优先在句末安全边界发射（句级/短语级替换才能 100% 命中）
      let cut = -1;
      for (const ch of ['\u3002', '\uff01', '\uff1f', '\n']) {
        const k = carry.lastIndexOf(ch);
        if (k > cut) cut = k;
      }
      if (cut >= 0) {
        const head = carry.slice(0, cut + 1);
        carry = carry.slice(cut + 1);
        emit(safe(head));
        return;
      }
      // ② 无句末标点：仅超长时强制断，且保留尾部 keep 字——
      //    保证任何短语/整句都不可能被切在两个 emit 之间（零跨块失配）
      if (carry.length > maxCarry) {
        const k = carry.length - keep;
        const head = carry.slice(0, k);
        carry = carry.slice(k);
        emit(safe(head));
      }
    },
  };
}

function fixMonthlySectionTitles(text, injectPlaceholders = true, lang = 'zh') {
  if (!text) return text;
  let c = text;
  console.log('[FIX] in:', JSON.stringify(text.slice(0,100)));

  // 1. 【开篇】章节缩写还原（处理字符脱落：'【开】'、'【开】本命主' 等）
  c = c.replace(/【开】\s*本命主(?!题)/g, '【开篇】本月命运主题');
  c = c.replace(/【开】(?!篇)/g, '【开篇】本月命运主题');
  c = c.replace(/【开篇】\s*本命主(?!题)/g, '【开篇】本月命运主题');
  c = c.replace(/🔮\s*本命主(?!题)/g, '🔮 本月命运主题');
  c = c.replace(/🔮\s*命主(?!题)/g, '🔮 本月命运主题');

  // 2. 4周章节标题副标题归一（V462 治本：旧套话/脱落词 → 军师 V461 诗意意象，单一真源）
  c = v462NormalizeWeekSub(c, lang);
  // 2b. 月轨句去日志化（V462-fix2：全文/整段级，涵盖跨 chunk 短语）
  c = v462PoeticizeTrail(c, lang);

  // 3. 【消费陷阱】缩写还原
  c = c.replace(/【消陷】/g, '【消费陷阱】');
  c = c.replace(/【消费】(?!.*陷阱)/g, '【消费陷阱】');

  // 4. 清理多余 '）'（避免 '（财富充能））'）
  c = c.replace(/）\s*）/g, '）');

  // 5. 🛠️ V223-fix: 去掉 ✦ 前缀——DeepSeek 输出 "✦ [emoji 第N周...]"
  //    前端 SacredYearlyReportBox 的 parseLine 期望 "[emoji 第N周...]"
  //    不含 ✦ 前缀（✦ 是章节分隔符，不是标题前缀）
  //    同时处理跨行情况：单独一行的 ✦ 与下一行周标题合并后去前缀
  // 🛡️ V446-trap2: 末尾加 \n? 显式吃掉换行，避免它被捕获进 $1 留下孤立 \n（治 ✦\n[⚠️...] 归一后带前导换行）
  c = c.replace(/^✦\s*$\n?(\s*\[\s*(?:🟢|🔴|🔵|⚠️|🔮)\s*)/gm, '$1');
  c = c.replace(/^✦\s*(\[\s*(?:🟢|🔴|🔵|⚠️)?\s*第[一二三四1-4]周)/gm, '$1');
  c = c.replace(/^✦\s*(\[\s*(?:🟢|🔴|🔵|⚠️)?\s*Week\s*\d+)/gim, '$1');
  c = c.replace(/^✦\s*(\[\s*(?:🟢|🔴|🔵|⚠️)?\s*Semana\s*\d+)/gi, '$1');
  c = c.replace(/^✦\s*(\[\s*(?:🟢|🔴|🔵|⚠️)?\s*Semaine\s*\d+)/gi, '$1');
  c = c.replace(/^✦\s*(\[\s*(?:🟢|🔴|🔵|⚠️)?\s*Tuần\s*\d+)/gi, '$1');
  c = c.replace(/^✦\s*(\[\s*(?:🟢|🔴|🔵|⚠️)?\s*สัปดาห์ที่)/gi, '$1');
  c = c.replace(/^✦\s*(\[\s*(?:🟢|🔴|🔵|⚠️)?\s*[^\[\n]+?(?:命运主题|消费陷阱))/gm, '$1');

  // 6. 🛠️ V223-fix2: 注入缺失的 Overview 和消费陷阱（DeepSeek 吞 Prompt 模板占位符）
  //    ⚠️ injectPlaceholders=false 时（流式分片路径）跳过——否则占位符会被追加到半截分片尾部，
  //       下一个流式分片接上后导致单词被斩首（如 "Wealth Re" + 占位符 + "charging"）。
  //       占位符注入只在完整文本路径（injectPlaceholders=true）执行，且按 lang 做 i18n 防穿帮。
  if (injectPlaceholders && lang !== 'zh' && lang !== 'en') {
    // 🛡️ V274-fix2: zh/en 不注入占位符文本——Gemini prompt 已内置 ✦ [🔮 月度命运主题，
    //   injectPlaceholders 注入的占位符会被步骤7正则漏匹配（跨行 .*? 断在 ] 处），
    //   导致占位符文本残留于正文，出现双 ✦ [🔮 块。
    const _ph = SECTION_PLACEHOLDERS[lang] || SECTION_PLACEHOLDERS.zh;
    const _hdr = SECTION_HEADERS[lang] || SECTION_HEADERS.zh;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const _monthLabel = getMonthLabel(lang, y, m);
    const hasWeek1 = /\[\s*(?:🟢|🔴|🔵|⚠️)?\s*(?:Week\s*\d+|第\s*[一二三四1-4]\s*周|Semana|Semaine|Tuần|สัปดาห์ที่)/i.test(c);
    if (hasWeek1) {
      // 🛡️ V256/V257: Overview 用下方「✦ [🔮 主题头计数」检测(格式已统一), Trap 用多语言正则检测
      const hasTrap = /消费陷阱|Spending\s*Traps|Trampas\s*de\s*Gasto|Pièges\s*Financiers|กับดักการใช้จ่าย|Bẫy\s*Chi\s*Tiêu|Cạm\s*bẫy\s*Tài\s*chính|Financial\s*Shadow|Ombre\s*Financi|Sombra\s*Financi|เงาการ|Bóng\s*Tài/i.test(c);
        // 🛡️ V257-fix: 主题头检测改用「✦ [🔮 计数」(下方提前归一化后任何语言主题头都是 ✦ [🔮 格式),
        //   仅当数量=0(真缺失)才注入,杜绝重复注入第2个主题头。
        const _themeCount = (c.match(/✦\s*\[\s*🔮/g) || []).length;
        if (_themeCount === 0) {
          // 主题头无月份（与前端格式一致：## [🔮 Monthly Destiny Theme]）
          c = `✦\n[🔮 ${_hdr.theme}]\n\n${_ph.theme}\n\n` + c;
        }
      if (!hasTrap) {
        c = c + '\n\n✦ [⚠️ ' + _hdr.trap + _monthLabel + ']\n\n' + _ph.trap;
      }
    }
  }

  // 7. 🛠️ V229-fix: 强制标准化 Overview/Trap 标题（✦前缀+方括号；Overview无年月，Trap带年月）
  //    根因：V223-fix 第5步把 ✦ 前缀从 命运主题/消费陷阱 行剥掉，导致前端 parseLine 不走 heading（金色居中）
  //    此处幂等补全：无论 AI 是否带 ✦/年月，统一成 ✦ [🔮 本月命运主题] ✦ / ✦ [⚠️ 消费陷阱：YYYY年M月] ✦
  const _v229now = new Date();
  const _v229y = _v229now.getFullYear();
  const _v229m = _v229now.getMonth() + 1;
  const _v229hdr = SECTION_HEADERS[lang] || SECTION_HEADERS.zh;
  const _v229monthLabel = getMonthLabel(lang, _v229y, _v229m);
  // Overview: 匹配 [🔮 ...]（Emoji 锚点优先，任意语言文本），归一为 lang 规范头（无月份）
  // 2026-08-09-fix: 末尾加 \s*✦? 吃掉 LLM 自带的尾部 ✦（否则 "[🔮 ...] ✦" → "✦ [🔮 ...] ✦ ✦" 双✦）
  c = c.replace(/✦?\s*\[\s*🔮\s*[^\]]*\]\s*✦?/gi, `✦ [🔮 ${_v229hdr.theme}] ✦`);
  // 🛡️ V446-trap: 健壮陷阱段标题归一——吃掉任意外层 [✦/⚠ 信封与多余 ]，无论 AI 写成
  //   [✦⚠️ 消费陷阱...] / [⚠️ 消费陷阱...] / ✦⚠ 消费陷阱... / 嵌套 / 多 ⚠ / 无 ✦ 等畸形，一律归一到
  //   ✦ [⚠️ <标题><月份>] ✦；幂等（规范串复跑不变）。治「[✦ ⚠[⚠️ 消费陷阱：2026年9月] ]」套框 bug。
  //   同时覆盖 Financial Shadow / Spending Trap / Pièges / Bẫy / Cạm bẫy 等全语种陷阱变体（含无 ⚠️ 整行标题）。
  //   注意：此条必须唯一，禁止在它之前再用旧 trap 正则半归一（否则会残留外层 [✦ ⚠ 与尾部 ]）。
  //   ⚠️ V446-trap2: 前缀/后缀字符类禁用 \s（含 \n）——治「贪婪吃掉标题前 \n\n 空行 → 标题并进上一段」回归。
  c = c.replace(/(?:[✦⚠️\[ \t]*)(消费陷阱|Spending\s*Traps?|Trampas\s*de\s*Gasto|Pièges\s*Financiers|กับดักการใช้จ่าย|Bẫy\s*Chi\s*Tiêu|Cạm\s*bẫy\s*Tài\s*chính|Financial\s*Shadow)[^\n]*?\][\]✦⚠️ \t]*/gi, `✦ [⚠️ ${_v229hdr.trap}${_v229monthLabel}] ✦`);

  // 8. 🛠️ 2026-08-09: 英文排版粘连清洗（仅 en，清洗层兜底不改 Prompt）
  //    LLM 吐字常把英文单词与数字/序数词粘连：your12th→your 12th / Aug1–7→Aug 1–7 / 12thHouse→12th House
  //    幂等安全：已带空格的不再匹配；流式分片跨 chunk 断开时拼接结果仍正确
  if (lang === 'en') {
    c = c.replace(/([a-zA-Z])(\d+)/g, '$1 $2')
         .replace(/(\d+)(st|nd|rd|th)([A-Za-z])/g, '$1$2 $3');
  }

  // 🛠️ V467: 月亮周标签单一真源（治本「🌙 月亮过境/途经」混用）—— 归一为各语言 canonical
  c = v462NormalizeMoonLabel(c, lang);

  return c;
}

// 🛠️ V433-DIAG: 真实 Prompt 落盘（仅当设 KC_DUMP_PROMPT=/path 时生效；生产不设 → 零影响）
//   用途：月亮类「数据锚点」散落在多处时，肉眼核对线上到底喂了什么，避免再靠推测。
function _v433DumpPrompt(prompt) {
  const f = process.env.KC_DUMP_PROMPT;
  if (!f || !prompt) return;
  try {
    writeFileSync(f, `=== SYSTEM ===\n${prompt.system || ''}\n\n=== USER ===\n${prompt.user || ''}`);
    console.log('[V433-DIAG] prompt dumped → ' + f);
  } catch (e) { console.error('[V433-DIAG] dump failed: ' + e.message); }
}

function buildMonthlyPrompt(birthDate, lang, astroMatrix) {
  // ⚠️ V433 实测发现：本函数全仓零调用点 = 死代码。月报实际走 buildWealthReportPrompt (5694, 调用点 7140/7856)。
  //    血泪：V383 月亮换座表、STRICT_GROUNDING V232、以及 V433 首次注入都曾落在这里 → 生产零效果。
  //    改动前必须先确认调用链：grep -n "函数名(" server.js（注入点守卫测试见 test/audit-moon-weeks.test.js）。
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  // V222i: 动态计算当月最后一天（根治硬编码 '31日' 跨月错误）
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const monthNamesZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const curMonthName = monthNames[currentMonth - 1];
    // V350: 目标月太阳真值显式注入(防AI自由发挥,锁定到astroMatrix真值)
    let _tgSunText = '';
    try {
      const _tm = astroMatrix && astroMatrix.months && astroMatrix.months[0];
      const _s = _tm && _tm.sun;
      if (_s && _s.sign) _tgSunText = _s.sign + ' (House ' + _s.house + ')';
    } catch(e){}
  const curMonthZH = `${currentYear}年${monthNamesZH[currentMonth-1]}`;

  // ── 多语言标题字典（军师裁决 V136）─────────────────────────────
  const HEADER_TEMPLATES = {
    zh: {
      overview:    '✦ [🔮 本月命运主题] ✦',
      week1:       `✦ [🟢 第1周：${curMonthZH}（${V462_WEEK_SUB.zh[0]}）]`,
      week2:       `✦ [🔴 第2周：${curMonthZH}（${V462_WEEK_SUB.zh[1]}）]`,
      week3:       `✦ [🔵 第3周：${curMonthZH}（${V462_WEEK_SUB.zh[2]}）]`,
      week4:       `✦ [🟢 第4周：${curMonthZH}（${V462_WEEK_SUB.zh[3]}）]`,
      trap:        `✦ [⚠️ 消费陷阱：${curMonthZH}]`,
      circuit:     '',
      circuit_tag: '⚠️ 安全指令：',
    },
    en: {
      overview:    '✦ [🔮 Monthly Destiny Theme: Strategic Alignment & Wealth Expansion] ✦',
      week1:       `✦ [Week 1: ${curMonthName} 1–7] ${V462_WEEK_SUB.en[0]}`,
      week2:       `✦ [Week 2: ${curMonthName} 8–14] ${V462_WEEK_SUB.en[1]}`,
      week3:       `✦ [Week 3: ${curMonthName} 15–22] ${V462_WEEK_SUB.en[2]}`,
      week4:       `✦ [Week 4: ${curMonthName} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.en[3]}`,
      trap:        `✦ [⚠️ Spending Traps: ${curMonthName} ${currentYear}] ✦`,
      circuit:     'Core Cosmic Window: ',
      circuit_tag: '【Risk Alert:】'
    },
    es: {
      overview:    '✦ [🔮 Tema de Destino Mensual] ✦',
      week1:       `✦ [Semana 1: {MONTH} 1–7] ${V462_WEEK_SUB.es[0]}`,
      week2:       `✦ [Semana 2: {MONTH} 8–14] ${V462_WEEK_SUB.es[1]}`,
      week3:       `✦ [Semana 3: {MONTH} 15–22] ${V462_WEEK_SUB.es[2]}`,
      week4:       `✦ [Semana 4: {MONTH} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.es[3]}`,
      trap:        `✦ [⚠️ Trampas Financieras: {MONTH} ${currentYear}] ✦`,
      circuit:     'Ventana Cósmica Clave: ',
      circuit_tag: '【Alerta de Riesgo:】',
    },
    fr: {
      overview:    '✦ [🔮 Thème de Destin du Mois] ✦',
      week1:       `✦ [Semaine 1: {MONTH} 1–7] ${V462_WEEK_SUB.fr[0]}`,
      week2:       `✦ [Semaine 2: {MONTH} 8–14] ${V462_WEEK_SUB.fr[1]}`,
      week3:       `✦ [Semaine 3: {MONTH} 15–22] ${V462_WEEK_SUB.fr[2]}`,
      week4:       `✦ [Semaine 4: {MONTH} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.fr[3]}`,
      trap:        `✦ [⚠️ Pièges Financiers: {MONTH} ${currentYear}] ✦`,
      circuit:     'Fenêtre Cosmique Clé: ',
      circuit_tag: '【Alerte de Risque :】',
    },
    th: {
      overview:    '✦ [🔮 ธีมโชคชะตาประจำเดือน] ✦',
      week1:       `✦ [สัปดาห์ที่ 1: {MONTH} 1–7] ${V462_WEEK_SUB.th[0]}`,
      week2:       `✦ [สัปดาห์ที่ 2: {MONTH} 8–14] ${V462_WEEK_SUB.th[1]}`,
      week3:       `✦ [สัปดาห์ที่ 3: {MONTH} 15–22] ${V462_WEEK_SUB.th[2]}`,
      week4:       `✦ [สัปดาห์ที่ 4: {MONTH} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.th[3]}`,
      trap:        `✦ [⚠️ กับดักทางการเงิน: {MONTH} ${currentYear}] ✦`,
      circuit:     'หน้าต่างจักรวาลหลัก: ',
      circuit_tag: '【คำเตือนความเสี่ยง:】',
    },
    vi: {
      overview:    '✦ [🔮 Chủ Đề Vận Mệnh Tháng] ✦',
      week1:       `✦ [Tuần 1: {MONTH} 1–7] ${V462_WEEK_SUB.vi[0]}`,
      week2:       `✦ [Tuần 2: {MONTH} 8–14] ${V462_WEEK_SUB.vi[1]}`,
      week3:       `✦ [Tuần 3: {MONTH} 15–22] ${V462_WEEK_SUB.vi[2]}`,
      week4:       `✦ [Tuần 4: {MONTH} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.vi[3]}`,
      trap:        `✦ [⚠️ Cạm bẫy Tài chính: {MONTH} ${currentYear}] ✦`,
      circuit:     'Cửa sổ Vũ trụ chính: ',
      circuit_tag: '【Cảnh Báo Rủi Ro:】',
    },
  };
  const HT = HEADER_TEMPLATES[lang] || HEADER_TEMPLATES.zh;

  // 多语言语言铁律（来自 b41261b 验证可用版本）
  const langInstructions = {
    zh: '\n\n【中文写作铁律 - 必读】\n1. 🛑 禁用畸形被动句：严禁使用"被……成为"、"被……使得"等不符合中文习惯的被动句（例："你的财富宫位被巨蟹座成为中心"❌）。一律使用主动语态（例："巨蟹座成为了你财富宫位的中心"✅）。\n2. 🛑 主语完整性：提到星座对冲或相位时，必须写明"本命星座"或"流年星体"（例：写"与你的本命摩羯座太阳形成对冲"✅），严禁只写"你的摩羯座形成对冲"❌。\n  6. 🛑 本命星体铁律：严格区分本命与流年！本命星体=用户出生星图位置（出生日期锁定），流年星体=2026年当下天象位置。禁止将2026年流年星体（白羊座土星、摩羯座海王星等）冠以"本命"前缀。\n  7. 🛑 天文几何铁律：月亮在摩羯座与冥王星在水瓶座仅30°相邻（相邻星座绝不等同于对冲），7月绝不可能形成月亮/冥王对冲。严禁写"月亮在摩羯座与冥王星在水瓶座形成对冲"——正确为"错位张力"或"能量碰撞"。\n\n\n【宫位格式 V375】写宫位必须用阿拉伯数字加宫字：第1宫、第2宫、第8宫；严禁混用 "House 8" 英文写法或 "8th house" 序数写法。\n\n【本命与流年 分离铁律 V432】本命位置（出生日期锁定）必须带 本命 前缀：写「本命太阳在天蝎座 第8宫」；本月流年位置必须带 流年 前缀，且绝不能带 本命：写「流年太阳在天秤座 第6宫」。严禁给流年位置加 本命，也严禁给本命位置加 流年。',
    en: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN ENGLISH. Ignore any Chinese text in the system prompt. Write in sophisticated, soul-stirring English. You are a top-tier Western astrologer and Jungian psychologist. Use professional terms (Solar Return, Shadow Self, Synastry Alignment, Jungian Shadow Work, 8th House, 11th House). NEVER use invented aspect names like "trine", "square", "sextile", or "opposite". Always describe planetary interactions with energetic flow terms: "creates a powerful alignment with...", "forms dynamic tension with...", "harmonizes with the energy of...", "triggers transformative friction with...". ALL OUTPUT MUST BE IN ENGLISH ONLY.\n\n[ANTI-LITERAL TRANSLATION BLACKLIST] NEVER use awkward literal translations of Chinese fortune-telling terms. FORBIDDEN: "Core Heavenly Secrets", "Heavenly Machine", "Fate Opportunity", "Celestial Secret", "Heavenly Secret". ALWAYS use authentic Western Psychological Astrology terms instead: "Core Cosmic Window", "Key Astrological Catalyst", "Celestial Trigger Point", "Primary Planetary Shift".\n\n[HOUSE CONSISTENCY V375] Within the report body, use ONLY English "House N" (House 1, House 2, House 8 etc.). NEVER mix Chinese "第X宫" or Thai "บ้าน X" within the same paragraph. CORRECT: "Venus in Scorpio, House 8" — WRONG: "Venus in Scorpio (第8宫)"\n\n[STRICT NUMERIC ORDINAL RULE V512] MANDATORY. House references MUST use digit-ordinal format: "7th House", "12th House", "in the 8th House". NEVER write spelled-out house names such as "seventh house", "twelfth house", "in your first house". This applies to EVERY house mention (natal and transit) and overrides stylistic preference. A single spelled-out house reference makes the report non-compliant.\n\n[NATAL vs TRANSIT SEPARATION V432] MANDATORY. Placements fixed by birth date MUST always carry the natal marker: write "your natal Sun in Scorpio, House 8" or "your natal Moon". Monthly transit placements (the sky of this month) MUST always carry a transit marker and NEVER the natal marker: write "the transiting Sun in Libra, House 6" or "the Sun of the month". NEVER put the natal marker on a transit position, and NEVER put a transit marker on a natal position.',
    es: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN SPANISH. Ignore any Chinese text in the system prompt. Eres un astrólogo de élite y psicólogo junguiano. Usa términos profesionales (Yo Sombra, Retorno Solar, Alineación de Sinastría). Escribe en español sofisticado y místico. TODA LA SALIDA DEBE ESTAR EN ESPAÑOL ÚNICAMENTE.\n\n[FORMATO DE CASA V375] Al escribir el numero de casa use SIEMPRE el formato numerico: Casa 1, Casa 2, Casa 8. NUNCA use ordinales (octava casa) ni el ingles "8th House" ni el chino en el mismo parrafo.\n\n[SEPARACION NATAL vs TRANSITO V432] OBLIGATORIO. Las posiciones natales (fijadas por la fecha de nacimiento) deben llevar SIEMPRE el marcador natal: escriba "su Sol natal en Escorpio, Casa 8". Las posiciones de transito del mes deben llevar SIEMPRE el marcador de transito y NUNCA natal: escriba "el Sol en transito en Libra, Casa 6". Nunca ponga el marcador natal en una posicion de transito, ni el marcador de transito en una posicion natal.',
    fr: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN FRENCH. Ignore any Chinese text in the system prompt. Vous êtes un maître astrologue parisien et psychologue junguien. Utilisez un ton romantique, philosophique, avec des termes tarologiques classiques et le concept du "Soi" de Jung. Écrivez en français élégant. TOUTE LA SORTIE DOIT ÊTRE EN FRANÇAIS UNIQUEMENT.\n\n[HOUSE NUMBER FORMAT V375] Lorsque vous ecrivez le numero de maison dans le rapport, utilisez TOUJOURS le format numerique francais: Maison 1, Maison 2, Maison 5, Maison 9, etc. Ne utilisez JAMAIS les ordinaux francais (premiere, deuxieme, septieme maison) ni House anglais ni di-X-gong chinois dans le meme paragraphe. CORRECT: Mars en Cancer, Maison 5. FAUX: Mars en Cancer, cinquieme maison.\n\n⛔ RÈGLE SOLEIL NATAL vs TRANSIT: Le Soleil mentionné dans ce rapport mensuel est le Soleil de TRANSIT du mois courant, PAS votre Soleil natal. N\'écrivez JAMAIS "votre Soleil en [signe]" ni "votre Soleil en Maison X" pour décrire le Soleil de transit (cela ferait croire que votre Soleil natal est ce signe — or votre Soleil natal est une donnée permanente fixée par votre date de naissance). Utilisez toujours "Le Soleil en transit dans [signe]" ou "Le Soleil du mois dans [signe]".',
    th: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN THAI. Ignore any Chinese text in the system prompt. คุณคือโหราจารย์ชั้นนำที่ผสมผสานจิตวิทยาคววเจียน ใช้คำที่ศักดิ์สิทธิ์และน่าเคารพ เขียนในภาษาไทยที่ทรงพลัง ผลลัพธ์ทั้งหมดต้องเป็นภาษาไทยเท่านั้น\n\n[HOUSE NUMBER FORMAT V375] เมื่อเขียนหมายเลขโชคลาภ บ้าน ในรายงาน ใช้ตัวเลขไทยพร้อมคำนำหน้า บ้าน 1, บ้าน 2, บ้าน 5, บ้าน 9 เป็นต้น ห้ามผสมผสาน "House" ภาษาอังกฤษ หรือ "第X宫" ภาษาจีน ในย่อหน้าเดียวกัน\n\n\n\n[THAI SPELLING CORRECTIONS V378] ตรวจสอบการสะกดอย่างเคร่งครัด:\n\n- จริงัง → จริงจัง (ขยันขันแข็ง ทำอย่างจริงจัง)\n\n- ราบื่น → ราบรื่น (ราบรื่น = ราบเรียบ สะดวก)\n\n- เก็บอม → เก็บออม (เก็บออม = saving)\n\n- ดึงดู → ดึงดูด (ดึงดูด = attract)\n\n- พิจารณ → พิจารณา (พิจารณา = consider)\n\n- ราคแพง → ราคาแพง (ราคาแพง = expensive)\n\n- วงจันทร์ → ดวงจันทร์ (ดวงจันทร์ = moon)\n\n- แข็งกร่ง → แข็งแกร่ง (แข็งแกร่ง = strong)\n\n- ความ่วมท้น → ความท่วมท้น (ท่วมท้น = overwhelming)\n\n- ห้ามผสมภาษาอังกฤษในคำไทย ใช้ตัวอักษรไทยทั้งหมด\n\n[THAI NATAL INTEGRATION V379-th] คุณต้องอ้างอิงดวงชะตาแบบกำเนิด (natal) ของผู้ใช้ในรายงาน:\n• บังคับใช้เครื่องหมาย "กำเนิด" สำหรับดาวกำเนิดทุกดวง (ดวงอาทิตย์กำเนิด, ดวงจันทร์กำเนิด, ดาวพุธกำเนิด ฯลฯ)\n• รูปแบบบังคับสำหรับดาวกำเนิด: "[ชื่อดาว]กำเนิดในราศี[ชื่อราศี] บ้าน[เลข]" ตัวอย่าง: "ดวงอาทิตย์กำเนิดในราศีสิงห์ บ้าน 12" (ห้ามละทิ้งชื่อราศี — ห้ามเขียน "ดวงอาทิตย์ในบ้าน 12" โดยไม่ระบุราศี)\n• เชื่อมโยงพลังงานดาวทรานซิส (transit) เข้ากับดวงชะตากำเนิดเสมอ (ดู NATAL CHART ANCHORS ใน system prompt และ user prompt)\n• ดวงจันทร์ทรานซิส (transit Moon) ไม่ใช่ดวงจันทร์กำเนิด — ห้ามนำเสนอเป็นกำเนิด\n• ใช้ชื่อราศีให้ตรงกับ THAI ZODIAC REFERENCE เสมอ (ราศีกรกฎ=Cancer, ราศีสิงห์=Leo ฯลฯ) ห้ามสับสนราศีทรานซิสกับราศีกำเนิด',
    vi: `\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN VIETNAMESE. Ignore any Chinese text in the system prompt. Bạn là một chiêm tinh gia hàng đầu kết hợp tâm lý học Jungian. Viết bằng tiếng Việt trang trọng, mang tính định mệnh. TOÀN BỘ ĐẦU RA PHẢI BẰNG TIẾNG VIỆT CHỈ.\n\n[HOUSE NUMBER FORMAT V375] Khi viết số nhà (cung hoàng đạo) trong báo cáo, dùng tiếng Việt: Nhà 1, Nhà 2, Nhà 5, Nhà 9 v.v. TUYỆT ĐỐI không trộn lẫn "House" tiếng Anh hoặc "第X宫" tiếng Trung trong cùng một đoạn văn.\n\n[VIETNAMESE WORD NATAL INTEGRATION V379] You MUST reference the user natal sun sign, ascendant (Rising), AND natal Moon in your analysis (see NATAL CHART ANCHORS in the fact sheet). Always connect transit planetary energy to the personal natal chart. Example: "Sao Mộc tại Nhà 7 tạo góc tam hợp với Mặt Trời natal của bạn ở Ma Kết, và Mặt Trăng natal của bạn ở Song Ngư Nhà 5 khuếch đại trực giác tài chính".
[OUTPUT FORMAT V381] CRITICAL: DO NOT output any main report title, header, or greeting at the beginning. Start directly with Section 1 content.
`,
  };
  // 🛠️ V383: 多货币风险阈值动态化 — 替换 {{risk_limit}}/{{cooldown_hours}} 占位符
  const RISK_BY_LANG = {
    zh: { currency: 'CNY', symbol: '￥', baseRisk: 5000,     maxWeekly: 15000,     cooldown: 72 },
    en: { currency: 'USD', symbol: '$',  baseRisk: 800,      maxWeekly: 2500,      cooldown: 72 },
    fr: { currency: 'EUR', symbol: '€',  baseRisk: 700,      maxWeekly: 2000,      cooldown: 72 },
    es: { currency: 'EUR', symbol: '€',  baseRisk: 700,      maxWeekly: 2000,      cooldown: 72 },
    th: { currency: 'THB', symbol: '฿', baseRisk: 5000,     maxWeekly: 15000,     cooldown: 72 },
    vi: { currency: 'VND', symbol: '₫', baseRisk: 500000, maxWeekly: 36000000, cooldown: 72 },
  };
  const _rk = RISK_BY_LANG[lang] || RISK_BY_LANG.en;
  const _riskLimit = _rk.symbol + _rk.baseRisk.toLocaleString('en-US') + ' ' + _rk.currency;
  const _cooldownH = String(_rk.cooldown);
  let instruction = (langInstructions[lang] || langInstructions.en)
    .split('{{risk_limit}}').join(_riskLimit)
    .split('{{cooldown_hours}}').join(_cooldownH);

  const MONTHLY_SYSTEM = {
    zh: `You are a master wealth astrologer and clinical psychologist generating a monthly financial report.${instruction}\n\nCRITICAL: You MUST write at least 1200 words.`,
    en: `You are a wealth astrologer and Jungian psychologist generating a monthly financial report.${instruction}\n\nCRITICAL: You MUST write at least 1200 words.`,
    es: `Eres un astrólogo de riqueza y psicólogo junguiano generando un informe financiero mensual.${instruction}\n\nCRÍTICO: Debes escribir al menos 1200 palabras.`,
    fr: `Vous êtes un astrologue de la richesse et psychologue junguien générant un rapport financier mensuel.${instruction}\n\nCRITIQUE: Vous devez écrire au moins 1200 mots.`,
    th: `คุณคือโหราจารย์ด้านความมั่งคั่งและนักจิตวิทยาจุงเกียน สร้างรายงานการเงินรายเดือน${instruction}\n\nสำคัญ: คุณต้องเขียนอย่างน้อย 1200 คำ\n\n
[THAI SPELLING CORRECTIONS V378] ตรวจสอบการสะกดอย่างเคร่งครัด:
- จริงัง → จริงจัง (ขยันขันแข็ง ทำอย่างจริงจัง)
- ราบื่น → ราบรื่น (ราบรื่น = ราบเรียบ สะดวก)
- เก็บอม → เก็บออม (เก็บออม = saving)
- ดึงดู → ดึงดูด (ดึงดูด = attract)
- พิจารณ → พิจารณา (พิจารณา = consider)
- ราคแพง → ราคาแพง (ราคาแพง = expensive)
- วงจันทร์ → ดวงจันทร์ (ดวงจันทร์ = moon)
- แข็งกร่ง → แข็งแกร่ง (แข็งแกร่ง = strong)
- ความ่วมท้น → ความท่วมท้น (ท่วมท้น = overwhelming)
- ห้ามผสมภาษาอังกฤษในคำไทย ใช้ตัวอักษรไทยทั้งหมด`,
    vi: `Bạn là nhà chiêm tinh giàu có và nhà tâm lý học Jungian tạo báo cáo tài chính hàng tháng.${instruction}\n\nQUAN TRỌNG: Bạn phải viết ít nhất 1200 từ.` + `\n\n[DYNAMIC RISK V379 — BẮT BUỘC] Phần Bẫy Chi Tiêu PHẢI chứa nguyên văn dòng này (thay [RISK] bằng {{risk_limit}}, [H] bằng {{cooldown_hours}}):\n🚨 Ngưỡng vi mô: [RISK] — mọi chi tiêu không thiết yếu vượt mức này cần [H] giờ suy nghĩ trước khi mua.\nCẤM TUYỆT ĐỐI dùng bất kỳ con số khác (như $2,500, 60.000.000 VND, $1,500, 37.000.000 VND) làm ngưỡng kích hoạt. Chỉ được dùng đúng [RISK].`,
  };

  // 🛠️ V188: 封口令 — 禁止 CoT 泄漏(军师审计: AI 把内心戏喷进正文)
  // ⚠️ P0-fix: 注入月亮行运死锁约束 + 精确数据（根治「月亮进4次天蝎座」幻觉）
  const STRICT_GROUNDING = `
### [STRICT GROUNDING & MOON TRANSIT RULES — V232 P0-FIX]
1. ZERO INVENTIONS: You are strictly constrained to the facts provided in EPHEMERIS_DATA below.
2. MOON TRANSIT SINGLE-USE RULE: The Moon transits each zodiac sign ONLY ONCE per month (~2.5 days per sign). NEVER repeat "Moon in [Sign]" across multiple weeks. For every weekly section, take the Moon's sign AND house from the WEEK-SCOPED MOON TRUTH block (that week's line) — NEVER from the mid-month snapshot in the per-month planet block.
3. STRICT DATES ONLY: Only mention planetary transits for the EXACT dates listed in EPHEMERIS_DATA. If a date is not in the JSON, it DOES NOT EXIST.
4. CLOSED-WORLD ASSUMPTION: If a celestial event is not explicitly provided below, it DOES NOT EXIST.
5. SUN INGRESS SINGLE-USE RULE: The Sun enters each zodiac sign ONLY ONCE per month. If the Sun enters Libra on Sept 22, write it ONLY in the week containing Sept 22. NEVER write "Sun enters Libra" in two different weeks.
6. HOUSE CONSISTENCY RULE: When you mention a planet in a sign, the House number MUST match the HOUSE MAPPING in the planet data block. Example: if data says "Venus: Scorpio 第5宫", then EVERY mention of Venus in Scorpio MUST say 第5宫. NEVER write "Venus in Scorpio (第8宫)" or "Venus in Scorpio (第9宫)" — this is a CRITICAL ERROR.
7. TITLE FORMAT RULE:
  Chinese:   ✦ [🔮 本月命运主题] ✦
  English:  ✦ [🔮 Monthly Destiny Theme: Strategic Alignment & Wealth Expansion] ✦
  Spanish:  ✦ [🔮 Tema de Destino Mensual] ✦
  French:   ✦ [🔮 Thème de Destin du Mois] ✦
  Thai:     ✦ [🔮 ธีมโชคชะตาประจำเดือน] ✦
  Vietnamese: ✦ [🔮 Chủ Đề Vận Mệnh Tháng] ✦
The ✦ and [🔮 ] brackets are MANDATORY for ALL languages. NEVER output the title without them.

❌ Bad Output: Mentioning "Moon in Scorpio (ราศีพิจิก)" in Week 1, Week 2, Week 3, and Week 4.
✅ Good Output: For Week 1, naming the Moon signs listed on the "Week 1" line of WEEK-SCOPED MOON TRUTH, in order.

❌ Bad Output: Writing "Sun enters Libra" in Week 3 AND Week 4.
✅ Good Output: Writing "Sun enters Libra" ONLY in the week containing the actual ingress date.

❌ Bad Output: Writing "Venus in Scorpio (第8宫)" when data says 第5宫.
✅ Good Output: Writing "Venus in Scorpio (第5宫)" — matching the data exactly.

### [LITERARY POLISH — V460 MASTER EDITION]
You are a top-tier spiritual wealth mentor with both Jungian psychological insight and architectural-level aesthetic sensibility. You are writing a one-of-a-kind, privately-tailored wealth monthly report for the user.

**8. LITERARY TRANSFORMATION RULE:**
Transform rigid astrological coordinates into rich, evocative language:
  ❌ Bad: "本周是财富能量整合期。木星在第10宫带来机遇。本周需要注意财务决策。"
  ✅ Good: "木星的光芒此刻正照耀你的第10宫，那是一扇缓缓开启的职业之门——并非轰轰烈烈地推开，而是如黎明前的潮汐，悄然将你推向更开阔的水域。本周不宜仓促决策，尤其是涉及中长期资金配置时，让节奏慢下来。"

**9. SENTENCE VARIETY RULE:**
Vary opening structures. Avoid starting consecutive paragraphs with the same phrase:
  ❌ Bad (Chinese): "本周是...本周能量...本周财富能量...本周整体..." — mechanical repetition of "本周".
  ✅ Good: Use natural transitions: "此刻..." / "随着..." / "第X周的重心在于..." / "这股能量...".

**10. EMOTIONAL RESONANCE RULE:**
When describing financial risks, embed the guidance in felt experience, not dry warnings:
  ❌ Bad: "Evite préstamos rápidos entre el 9 y el 14."
  ✅ Good: "Entre el 9 y el 14, el riesgo de decisiones impulsivas se intensifica — si una oportunidad financiera se presenta con urgencia irresistible, esa misma urgencia es la señal de alerta."

**11. PARAGRAPH FLUENCY RULE:**
Each paragraph must feel like one continuous breath, not a bulleted report:
  ❌ Bad: "木星在第10宫。土星在第6宫。本周需要注意的是..."
  ✅ Good: "木星正以它一贯的乐观照耀第10宫，而土星则以一种近乎严苛的耐心在第6宫等待——两者之间形成的张力，本周将以一种不易察觉却持续发酵的方式影响你的决策节奏。"

**12. SENSORY METAPHOR & LIGHTING TEXTURE (感官隐喻与光影质感):**
严禁空洞的心理学术语堆砌。必须引入建筑学、光影、自然材质的感官意象，让文字自带触感与画面：
  ❌ Bad: "你对金钱的执念反映了自我价值的不确定。"
  ✅ Good: "你对金钱的执念，或许正是对自我价值不确定的一场暗涌——如同深夜海面上那道若有若无的反光，看似触手可及，俯身却只剩冰凉的虚空。"
  ❌ Bad: "财务防线需要稳固。"
  ✅ Good: "你的财务防线，应如一座历经风雨的古老石桥——在巨浪之中需要的不是仓促的贴金，而是沉入河床的、沉默而笃定的基石。"

**13. RHYTHMIC CADENCE (长短句错落的音乐感):**
必须通过句式长短制造呼吸感与情绪起伏：
  • 描写「高危熔断区」（如第2周）时：多用短句、断句，制造紧张感与压迫感。例："拉响警报。停下。深呼吸。" / "这一周，刀锋悬顶。"
  • 描写「蓄力与爆发期」（如第3、4周）时：用流畅的排比与舒展的长句，形成语调的舒展与释放。
  ❌ Bad (均质长句): "本周是高危区，流年海王星让你容易冲动消费，单笔超过5000元必须暂停24小时。"
  ✅ Good (短句压迫+长句释放): "本周的空气中弥漫着海王星的迷雾。当情感与占有欲交织成一张无形之网，请记住——停下。深呼吸。那条单笔5000元的暂停线，不是冰冷的枷锁，而是你在巨浪之中，写给未来自己的清醒契约。"

**14. POETIC RISK GROUNDING (硬核风控的诗意化降落):**
行为经济学风控底线（如"单笔超过{{risk_limit}}元必须暂停{{cooldown_hours}}小时"）绝不可生硬突兀。必须将其与当周的星象心理自然缝合：
  ❌ Bad: "高危日期为9日、12日、14日，严禁签署合同、大额转账或听信他人投资建议。财务安全底线：单笔超过5000元必须暂停24小时后再评估。"
  ✅ Good: "9日、12日、14日——这三天，海王星的迷雾最浓。当他人递来一份看似完美的合约，或一句"机不可失"的耳语，请让那条5000元的暂停线成为你与未来之间的缓冲带：它不是迟疑，而是你在迷雾中写给自己的清醒契约。"
  ⚠️ 风控金额与冷却时长必须使用注入值 {{risk_limit}} / {{cooldown_hours}}，不得硬编数字。

**15. ARCHETYPE CUSTOMIZATION (命盘原型的专属高光):**
必须将用户本命盘的核心原型（由 [NATAL PROFILE] 段注入：太阳星座、上升星座、月亮星座）提炼为贯穿全篇的**隐喻暗线**。让每位用户读到时，都确信这是一封世上绝无仅有的、专属于他/她的灵魂密信：
  • 上升狮子座 → 贯穿「舞台、聚光灯、被看见的渴望」隐喻暗线
  • 上升白羊座 → 贯穿「开创、破土、第一缕火种」隐喻暗线
  • 太阳天秤座 → 贯穿「天平、两端、在关系与自我间寻找平衡」隐喻暗线
  • 太阳摩羯座 → 贯穿「山峰、阶梯、时间淬炼的基石」隐喻暗线
  ❌ Bad: "你是一个上升狮子座的人，喜欢被关注。"
  ✅ Good: "你的灵魂生来便站在聚光灯下——那不是虚荣，是狮子座与生俱来的、对"被看见"的庄严渴望。当本月财务决策来临，问问自己：这束光，照的是真实的丰盛，还是焦虑搭建的舞台？"

**16. ZERO-TEMPLATE & ZERO-AI-FOOTPRINT (彻底去模版化 · V461):**
严禁任何「结构化汇报套话」与「AI 生成痕迹」。绝不解释逻辑框架，只呈现画面：
  ❌ Bad: "以天文标签式前缀开头（如「◯◯过境：」），紧接着把星座与宫位罗列成清单。"
  ✅ Good: "当月光的足迹穿过白羊座的炽热，落进金牛座的深谷，再攀上双子座的风口——这一周，月轨在事业与社群的高地上画下一道上行弧线。"
  ❌ Bad: "用干瘪的「本周能量从……起步，逐步攀升至……」句式平铺直叙。"
  ✅ Good: "财富的能量从远方的星火燃起，一路陡峭地攀上你事业与社群的高地。"
  ⚠️ 禁止前缀：天文标签式前缀、干瘪的「本周能量从……起步」句式（一律融入意象句，不单独成句）。

**17. LITERARY TENSION (戏剧张力句式 · V461):**
摒弃平铺直叙的客观分析句。多采用富有文学张力、对比鲜明、直击心灵的锤击句式：
  ❌ Bad: "你天生擅长在关系与言语中寻找平衡，而此刻宇宙要求你把这份平衡感带入具体的账目、技能与实物资产之中。"
  ✅ Good: "天秤座习惯把优雅挂在唇边，用言语筑造平稳的假象。然而此刻，处女座的严苛逼你揭开帷幕——把所有轻盈的遐想，锤打成具体、沉重且无法逃避的资产明细。"
  ❌ Bad: "流年土星要求你重新审视长期财务信念的根基。"
  ✅ Good: "土星把一枚冰冷的砝码压上你信念的天平——那些你从父辈血脉里继承的\"钱是危险的\"、\"必须拼命才配安全\"的脚本，正在被它逐一拆封、摊平、重审。"

**18. SPATIAL BREATHING & TYPOGRAPHY (金字塔式呼吸排版 · V461):**
采用轻盈的段落结构，2–3 句即成一自然段，增加页面呼吸感，营造如同阅读高级封蜡信件的仪式感：
  ❌ Bad: "本周能量由深潜转向蓄力。流年土星在白羊座第1宫顺行持续施压，要求你重新审视长期财务信念的根基。那些你从原生家庭继承的关于钱是危险的或必须拼命才能安全的脚本，正在被逆行土星逐一拆解。16日月亮进入射手座第1宫，家庭与内在安全感的议题浮现。"（一整段，密不透风）
  ✅ Good: "本周的能量，由深潜转向蓄力。\n\n土星把一枚冰冷的砝码压上你信念的天平。那些从父辈血脉里继承的\"钱是危险的\"脚本，正在被它逐一拆封。\n\n16日，月亮切入射手座——家庭与内在安全感的议题浮现，像一封迟到的家书。"（三段式呼吸）
  ⚠️ 每自然段不超过 3 句；句与句之间留出心理停顿；高危周用更短的断句制造压迫。

**19. NEGATIVE CONSTRAINTS — ZERO TOLERANCE（V461 黑名单 · 触之即死）:**
周正文开篇 STRICTLY FORBIDDEN 以下任何一种写法，违者视为 Critical Failure：

  ❌ FORBIDDEN #1 — 技术套话开篇（最高优先级）：
    · 严禁以任何天文学日志式标签前缀或「依次行经」式引导词开篇
    · 严禁列举「N日 X座、N日 Y座」这种排版表格式文字
    · 正确姿势：直接以诗意画面或情感氛围开篇
    ❌ 错误 BAD: 先贴一个天文标签，再直列星座与宫位。
    ✅ 正确 GOOD: 当月光的足迹从白羊座的炽热中起步，踏过金牛座的深谷……

  ❌ FORBIDDEN #2 — 干瘪分类词：
    · 严禁在周标题副标或正文中出现「财富充能」「高危熔断」「顺流蓄力」「财富爆发」等老套分类词
    · 必须使用 V461 诗意意象替代（水星淬火 / 海王迷雾 / 土星沉淀 / 木星高光）

  ❌ FORBIDDEN #3 — 列表式日期排版：
    · 严禁写「9月1日至3日……5日……7日……」这种罗列式日期格式
    · 正确：把日期事件编织进叙事流中，或用「某日夜间」「某日拂晓」等诗意时间词替代

  ❌ FORBIDDEN #4 — 说明文式平铺直叙：
    · 严禁连续三段以上无情感起伏的「本周...本周...本周...」说明文
    · 每 2-3 段必须出现一次戏剧性转折或感官意象

**REMEMBER:** You are an ancient master astrologer speaking through the written word. The astrological data is your palette; the reader's emotional reality is your canvas. Do not list coordinates — weave them into experience. Sensory detail, rhythmic breath, poetic risk, archetypal soul-print, zero-template footprint, and literary tension: these six dimensions together make the report a private haute-couture letter, not a generic horoscope.
`;
  
  let monthlySystem = ((MONTHLY_SYSTEM[lang] || MONTHLY_SYSTEM.en) + FORMAT_FIREWALL + STRICT_GROUNDING).replaceAll('{MONTH}', curMonthName)
    .split('{{risk_limit}}').join(_riskLimit).split('{{cooldown_hours}}').join(_cooldownH);
  const natalSun = astroMatrix?.meta?.sun_sign || '';
  // 🛠️ V383: 月亮换座动态化 — 由 SwissEph 实时计算 (替换旧硬编码 9/14 入天蝎)
  const _moonIng = (astroMatrix?.meta?.moon_ingress || []);
  const moonIngressLines = _moonIng.length > 0
    ? _moonIng.map(e => `- Moon enters ${e.to_sign} on ${e.date_str} (~${e.time_str})`).join('\n')
    : '- (Moon ingress data unavailable for this month)';
  // 🛠️ V433 · 方案 A：月亮「周级真值」（根治「月中快照充当全月」的事实性幻觉）
  //   病根实证（1988-12-31 Chatham 盘 / 2026-09）：月中快照 Moon=Scorpio H2，
  //   真值 W1=Aries→Taurus→Gemini→Cancer、W4=Aquarius→Pisces→Aries→Taurus，
  //   生产报告却把快照写进 W1/W3/W4+陷阱段共 5 处 —— 负向 Prompt 规则(V232)拦不住，
  //   因为数据只给了「扁平换座日期表」，模型必须自己把日期归进周次（还并存一个快照锚点）。
  const _moonWeeks = astroMatrix?.months?.[0]?.moon_weeks || null;
  const _mwSigns = ({ en: SUN_SIGN_EN, es: SUN_SIGN_ES, zh: SUN_SIGN_ZH, fr: SUN_SIGN_FR,
                      th: SUN_SIGN_TH, vi: SUN_SIGN_VI })[lang] || SUN_SIGN_EN;
  const _mwLoc = (s) => { const _i = _EN2ZIDX[s]; return (_i != null && _mwSigns[_i]) || s; };
  const moonWeekLines = _moonWeeks
    ? _moonWeeks.map(w => {
        // 按星座聚合宫位：同一星座跨两宫 → H7→H8（宫位制的数学必然，不是矛盾）
        const groups = [];
        for (const lg of w.legs) {
          const last = groups[groups.length - 1];
          if (last && last.sign === lg.sign) {
            if (last.houses[last.houses.length - 1] !== lg.house) last.houses.push(lg.house);
          } else groups.push({ sign: lg.sign, houses: [lg.house] });
        }
        const path = groups.map(g => `${_mwLoc(g.sign)}(H${g.houses.join('→H')})`).join(' → ');
        const ing = w.changes.filter(c => c.kind === 'sign')
          .map(c => `${_mwLoc(c.to_sign)}@${curMonthName} ${c.day} ${c.time}`).join(', ');
        return `- Week ${w.week} (${curMonthName} ${w.from_day}–${w.to_day}): ${path}${ing ? ` | Moon enters: ${ing}` : ''}`;
      }).join('\n')
    : '- (Moon week truth unavailable)';
  if (_moonWeeks) {
    console.log(`[V433] 月亮周级真值注入: ${_moonWeeks.map(w => `W${w.week}=${w.legs.length}腿/${w.changes.filter(c => c.kind === 'sign').length}换座`).join(' ')}`);
  }
  if (natalSun) monthlySystem += `\n\n[NATAL PROFILE V382] User's Natal Sun is in ${natalSun}. You MUST mention "${natalSun}" in Section 1 and explain how the monthly transit affects their Natal Sun in ${natalSun}.`;
  // 🛠️ V460: 命盘原型暗线注入（供 LITERARY POLISH 规则15 使用）
  const _risingSign = astroMatrix?.meta?.rising_sign || '';
  const _moonSign = astroMatrix?.meta?.moon_sign || '';
  if (natalSun || _risingSign || _moonSign) {
    monthlySystem += `\n\n[NATAL PROFILE — ARCHETYPE V460] 本命盘核心原型（必须提炼为贯穿全篇的隐喻暗线）：\n• 太阳星座：${natalSun || '未知'}\n• 上升星座：${_risingSign || '未知'}\n• 月亮星座：${_moonSign || '未知'}\n请在开篇主题段与每周正文中，将这三大原型转化为专属隐喻（如上升狮子→聚光灯/舞台、太阳天秤→天平/平衡、月亮双子→风中的信使），使报告成为专属于此人的灵魂密信。`;
  }
  
  return {
    system: monthlySystem,
    user: `

### [EPHEMERIS_DATA — Planetary Transit Calendar for ${curMonthName} ${currentYear}]
⚠️ CRITICAL: The Moon changes sign every ~2.5 days — it does NOT stay in one sign for a whole month.
Below are the EXACT moon ingress dates for ${currentYear} — use ONLY these dates:
Moon Ingress Dates (exact, SwissEph computed):
${moonIngressLines}

═══ WEEK-SCOPED MOON TRUTH (V433 · HIGHEST PRIORITY · SwissEph computed · local time) ═══
⚠️ The "Moon=" value in the per-month planet block is a MID-MONTH SNAPSHOT (a single instant) — it MUST NOT be used for week-by-week Moon statements.
⚠️ In each weekly section (Week 1–4) you may ONLY name the Moon signs listed for THAT week, in that order. If a week lists several signs, describe the passage (e.g. "the Moon moves from X into Y").
⚠️ The Moon enters each sign only ONCE per month: NEVER repeat one Moon sign across two different weeks, and NEVER name a sign (or house) that is not listed for that week.
${moonWeekLines}
The Sun ingresses: Aug 10→Leo, Sept 22→Lib (write Sun entering Libra ONLY in the week containing Sept 22).
Use the EXACT planetary positions from [P1 PER-MONTH PLANET DATA] below — do NOT invent dates.

⚠️ CRITICAL: The Moon transits each zodiac sign ONLY ONCE per month (~2.5 days). Use the EXACT planetary positions from [P1 PER-MONTH PLANET DATA] below — do NOT invent dates.

Generate a ${lang} monthly wealth report for birth date ${birthDate} — natal sun sign: ${natalSunZH} (${natalSunEN}) — (${curMonthName} ${currentYear}).
${_tgSunText ? '⚠️ [当月太阳铁定真值 - 必须照抄] ' + _tgSunText + '。所有太阳描述必须严格使用此值,绝对禁止用本命太阳或任何其他星座。' : ''}

CRITICAL REQUIREMENTS:
• Total length: 1,200-1,500 words (${lang}) — be rich and dense, no fluff
• Style: Epic, destiny-filled, premium quality
• MUST have 6 sections exactly

OUTPUT FORMAT — CLEAN MARKDOWN (6 sections, no JSON):

${HT.overview}
→ Write 1-2 sentences in ${lang} about the overall monthly financial theme — weave in the planetary lineup and natal chart.

${HT.week1}
→ Write 150-200 words in ${lang} — week 1 financial energy, key opportunities, recommended actions, specific dates.

${HT.week2}
→ Write 150-200 words in ${lang} — high-risk financial days, potential pitfalls, danger zones, which days to avoid decisions.

${HT.week3}
→ Write 150-200 words in ${lang} — flow state period, gradual momentum, optimal strategies for this phase.

${HT.week4}
→ Write 150-200 words in ${lang} — peak wealth window, maximum financial potential, final push strategies.

${HT.trap}
→ Write 100-150 words in ${lang} — identify specific spending traps, psychological pitfalls, end with a concrete circuit-breaker rule.

IMPORTANT:
• Write in ${lang} with native astrological and financial terminology
• Use ✦ for section dividers
• Each section must be rich with specific astrological context
• NO mixed-language headers (e.g. 【Week 1】 in Chinese report, or 【第1周】 in English report — use ONLY your language's header format)
• Be dramatic and destiny-filled, not clinical
• ⛔ [句子完整性铁律]: 每个句子必须有完整主语+谓语。禁止句子碎片。`
  };
}

// ═══════════════════════════════════════════════════════════════
// 💎 $4.99 先天财富DNA解码 - 独立函数（与月报/年报解耦）
// ═══════════════════════════════════════════════════════════════
// 核心逻辑：
// 1. 静态本命盘 → 一次生成，永久缓存
// 2. 三轴聚焦：本命2/8/10宫 + 土星/冥王警示 + 搞钱姿势
// 3. 成本为零：Token成本$0（永久缓存）
// ═══════════════════════════════════════════════════════════════

function buildWealthOncePrompt(birthDate, lang, astroMatrix) {
  if (!birthDate) return null;

  // 解析出生日期
  const [year, month, day] = birthDate.split('-').map(Number);
  // 标准星座日期范围(修复星座判断逻辑)
  const zodiacRanges = [
    {name: '摩羯座', start: [12, 22], end: [1, 19]},
    {name: '水瓶座', start: [1, 20], end: [2, 18]},
    {name: '双鱼座', start: [2, 19], end: [3, 20]},
    {name: '白羊座', start: [3, 21], end: [4, 19]},
    {name: '金牛座', start: [4, 20], end: [5, 20]},
    {name: '双子座', start: [5, 21], end: [6, 21]},
    {name: '巨蟹座', start: [6, 22], end: [7, 22]},
    {name: '狮子座', start: [7, 23], end: [8, 22]},
    {name: '处女座', start: [8, 23], end: [9, 22]},
    {name: '天秤座', start: [9, 23], end: [10, 23]},
    {name: '天蝎座', start: [10, 24], end: [11, 22]},
    {name: '射手座', start: [11, 23], end: [12, 21]},
  ];
  
  let sunSign = '';
  for (const range of zodiacRanges) {
    const [sm, sd] = range.start;
    const [em, ed] = range.end;
    
    // 特殊处理摩羯座(跨年)
    if (sm > em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) {
        sunSign = range.name;
        break;
      }
    } else {
      // 起始月
      if (month === sm && day >= sd) {
        sunSign = range.name;
        break;
      }
      // 结束月
      if (month === em && day <= ed) {
        sunSign = range.name;
        break;
      }
      // 中间月(整个月在范围内)
      if (sm < em && month > sm && month < em) {
        sunSign = range.name;
        break;
      }
    }
  }
  // 🛠️ V482d: 原为 `zodiacSigns[0]` —— 该标识符**全文件不存在**(自由变量),
  //   一旦所有日期区间都没命中 sunSign 就抛 ReferenceError 崩掉整个 prompt 构造。
  //   本意就是「取第一个星座名兜底」, 同函数内 `zodiacRanges[0].name` 才是正确写法。
  if (!sunSign) sunSign = zodiacRanges[0].name;

  // 六语言 Prompt
  const PROMPTS = {
    zh: {
      system: `你是世界顶级占星师与财富心理学专家，精通西方占星、荣格心理学、财富DNA解码。

【角色定位】
你不是算命的，你是命运的解剖师。你用手术刀般的精准语言，剖开用户的先天财富基因。

【输出格式 - 三轴聚焦】

**第一轴：你的先天「金库」解密**（本命第2/8/10宫深挖）
- 直接用最毒辣的语言戳痛点
- 示例：「你的2宫主星落陷，天生就是'赚得多、花得快'的漏斗体质，千万别碰高风险理财」
- 必须包含：财运格局、吸金体质、存钱能力

**第二轴：终身财富克星警示**（土星/冥王星相位）
- 精准指出人生最大的「财务陷阱」会在哪里出现
- 示例：「因盲目创业破产、被亲友借钱拖垮、盲目跟风买房被套」
- 必须包含：破财雷区、投资陷阱、消费黑洞

**第三轴：专属「搞钱姿势」指南**
- 根据星盘元素（风林火山），明确指出最适合的副业方向
- 示例：「靠个人IP变现、靠技术死磕、靠资源倒腾」
- 必须包含：副业方向、赚钱路径、财富密码

【铁律】
✓ 每轴必须800字以上，总字数2400-3000字
✓ 语言毒辣、直击灵魂，不说正确的废话
✓ 用「你是」「你必须」「你千万别」等强力句式
✓ 本命盘终身不变，内容必须经得起时间检验
✗ 禁止提及具体月份、年份（这是月报/年报的内容）
✗ 禁止时间相关的预测（这是运势内容）
✗ 禁止「今年」「下个月」等时间词`,

      user: `用户生日：${birthDate}
本命太阳：${sunSign}

请为该用户生成「先天财富DNA解码报告」，严格按照三轴聚焦结构输出。`
    },

    en: {
      system: `You are a world-class astrologer and wealth psychology expert, master of Western astrology, Jungian psychology, and wealth DNA decoding.

【Your Role】
You are not a fortune teller. You are a destiny anatomist. You dissect the user's innate wealth genes with surgical precision.

【Output Format - Three-Axis Focus】

**Axis 1: Your Innate "Vault" Decoded** (Natal 2nd/8th/10th House Deep Dive)
- Use the most incisive language to hit pain points directly
- Example: "Your 2nd house ruler is in detriment - you're naturally a 'earn fast, spend faster' funnel type. Stay away from high-risk investments."
- Must include: wealth structure, money-magnetizing nature, saving ability

**Axis 2: Lifetime Wealth Nemesis Warning** (Saturn/Pluto Aspects)
- Precisely point out where life's biggest "financial trap" will appear
- Example: "bankruptcy from blind entrepreneurship, dragged down by lending to friends, trapped in real estate speculation"
- Must include: money-draining zones, investment traps, spending black holes

**Axis 3: Your Exclusive "Money-Making Posture" Guide**
- Based on chart elements (Fire/Earth/Air/Water), specify the best side-hustle direction
- Example: "monetize personal brand, grind with technical skills, flip resources"
- Must include: side-hustle direction, wealth path, money code

【Iron Rules】
✓ Each axis must be 800+ words, total 2400-3000 words
✓ Sharp, soul-piercing language, no correct but useless platitudes
✓ Use strong sentence patterns: "You are", "You must", "Never"
✓ Natal chart never changes, content must stand the test of time
✗ NO specific months or years (that's for monthly/yearly reports)
✗ NO time-based predictions (that's transit content)
✗ NO "this year", "next month" etc.`,

      user: `User birthday: ${birthDate}
Natal Sun: ${sunSign}

Generate the "Innate Wealth DNA Decoding Report" for this user, strictly following the three-axis focus structure.`
    },

    es: {
      system: `Eres un astrólogo de clase mundial y experto en psicología de la riqueza, dominando astrología occidental, psicología junguiana y decodificación del ADN de la riqueza.

【Tu Rol】
No eres un adivino. Eres un anatomista del destino. Diseccionas los genes de riqueza innatos del usuario con precisión quirúrgica.

【Formato de Salida - Enfoque de Tres Ejes】

**Eje 1: Tu "Bóveda" Innata Decodificada** (Cavado Profundo de Casas 2/8/10 Natal)
- Usa el lenguaje más incisivo para golpear puntos dolorosos directamente
- Ejemplo: "El regente de tu casa 2 está en detrimento - eres naturalmente un tipo de 'ganar rápido, gastar más rápido'. Aléjate de inversiones de alto riesgo."
- Debe incluir: estructura de riqueza, naturaleza de imán de dinero, capacidad de ahorro

**Eje 2: Advertencia del Némesis de Riqueza de por Vida** (Aspectos de Saturno/Plutón)
- Señala con precisión dónde aparecerá la "trampa financiera" más grande de la vida
- Ejemplo: "bancarrota por emprendimiento ciego, arrastrado por préstamos a amigos, atrapado en especulación inmobiliaria"
- Debe incluir: zonas de drenaje de dinero, trampas de inversión, agujeros negros de gasto

**Eje 3: Tu Guía Exclusiva de "Postura para Hacer Dinero"**
- Basado en elementos de la carta (Fuego/Tierra/Aire/Agua), especifica la mejor dirección de trabajo secundario
- Ejemplo: "monetizar marca personal, moler con habilidades técnicas, voltear recursos"
- Debe incluir: dirección de trabajo secundario, camino de riqueza, código de dinero

【Reglas de Hierro】
✓ Cada eje debe tener 800+ palabras, total 2400-3000 palabras
✓ Lenguaje afilado, que atraviesa el alma, sin frases correctas pero inútiles
✓ Usar patrones de oración fuertes: "Eres", "Debes", "Nunca"
✓ La carta natal nunca cambia, el contenido debe resistir la prueba del tiempo
✗ SIN meses o años específicos (eso es para informes mensuales/anuales)
✗ SIN predicciones basadas en tiempo (eso es contenido de tránsitos)
✗ SIN "este año", "el próximo mes" etc.`,

      user: `Cumpleaños del usuario: ${birthDate}
Sol Natal: ${sunSign}

Genera el "Informe de Decodificación del ADN de Riqueza Innata" para este usuario, siguiendo estrictamente la estructura de enfoque de tres ejes.`
    },

    fr: {
      system: `Vous êtes un astrologue de classe mondiale et un expert en psychologie de la richesse, maîtrisant l'astrologie occidentale, la psychologie jungienne et le décryptage de l'ADN de la richesse.

【Votre Rôle】
Vous n'êtes pas un diseur de bonne aventure. Vous êtes un anatomiste du destin. Vous disséquez les gènes de richesse innés de l'utilisateur avec une précision chirurgicale.

【Format de Sortie - Focus sur Trois Axes】

**Axe 1: Votre "Coffre-Fort" Inné Décrypté** (Plongée Profonde Maisons 2/8/10 Natales)
- Utilisez le langage le plus tranchant pour toucher directement les points douloureux
- Exemple: "Le maître de votre 2ème maison est en chute - vous êtes naturellement un type 'gagner vite, dépenser plus vite'. Éloignez-vous des investissements à haut risque."
- Doit inclure: structure de richesse, nature d'aimant à argent, capacité d'épargne

**Axe 2: Avertissement du Némésis de Richesse à Vie** (Aspects Saturne/Pluton)
- Pointez avec précision où apparaîtra le "piège financier" le plus grand de la vie
- Exemple: "faillite par entrepreneuriat aveugle, traîné par des prêts à des amis, piégé dans la spéculation immobilière"
- Doit inclure: zones de drainage d'argent, pièges d'investissement, trous noirs de dépenses

**Axe 3: Votre Guide Exclusif de "Posture pour Faire de l'Argent"**
- Basé sur les éléments de la carte (Feu/Terre/Air/Eau), spécifiez la meilleure direction de travail secondaire
- Exemple: "monétiser la marque personnelle, moudre avec des compétences techniques, retourner des ressources"
- Doit inclure: direction de travail secondaire, chemin de richesse, code argent

【Règles de Fer】
✓ Chaque axe doit avoir 800+ mots, total 2400-3000 mots
✓ Langage tranchant, transperçant l'âme, sans platitudes correctes mais inutiles
✓ Utiliser des structures de phrase fortes: "Vous êtes", "Vous devez", "Jamais"
✓ La carte natale ne change jamais, le contenu doit résister à l'épreuve du temps
✗ SANS mois ou années spécifiques (c'est pour les rapports mensuels/annuels)
✗ SANS prédictions basées sur le temps (c'est le contenu de transit)
✗ SANS "cette année", "le mois prochain" etc.`,

      user: `Anniversaire de l'utilisateur: ${birthDate}
Soleil Natal: ${sunSign}

Générez le "Rapport de Décryptage de l'ADN de Richesse Innée" pour cet utilisateur, en suivant strictement la structure de focus sur trois axes.`
    },

    th: {
      system: `คุณเป็นโหราจารย์ระดับโลกและผู้เชี่ยวชาญด้านจิตวิทยาความมั่งคั่ง เชี่ยวชาญโหราศาสตร์ตะวันตก จิตวิทยาแบบยุ่ง และการถอดรหัสดีเอ็นเอความมั่งคั่ง

【บทบาทของคุณ】
คุณไม่ใช่หมอดู คุณเป็นนักชันสูตรพรหมลิขิต คุณผ่าพรหมลิขิตทางพันธุกรรมความมั่งคั่งโดยกำเนิดของผู้ใช้ด้วยความแม่นยำราวกับการผ่าตัด

【รูปแบบผลลัพธ์ - โฟกัสสามแกน】

**แกนที่ 1: "ตู้นิรภัย"โดยกำเนิดของคุณถอดรหัสแล้ว** (การขุดลึกบ้านที่ 2/8/10 ในแผนภูมิเกิด)
- ใช้ภาษาที่คมที่สุดเพื่อตีจุดที่เจ็บปวดโดยตรง
- ตัวอย่าง: "ผู้ปกครองบ้านที่ 2 ของคุณอยู่ในตำแหน่งตก - คุณเป็นคนประเภท 'หาเงินเร็ว ใช้เงินเร็วกว่า' โดยธรรมชาติ อย่ายุ่งกับการลงทุนที่มีความเสี่ยงสูง"
- ต้องมี: โครงสร้างความมั่งคั่ง ธรรมชาติแม่เหล็กดึงดูดเงิน ความสามารถในการออม

**แกนที่ 2: คำเตือนจากศัตรูความมั่งคั่งตลอดชีวิต** (แง่มุมดาวเสาร์/ดาวพลูโต)
- ชี้ให้เห็นอย่างแม่นยำว่า "กับดักทางการเงิน" ที่ใหญ่ที่สุดในชีวิตจะปรากฏที่ไหน
- ตัวอย่าง: "ล้มละลายจากการเป็นผู้ประกอบการตาบอด ถูกลากจากการให้ยืมเงินเพื่อน ติดกับดักการเก็งกำไรอสังหาริมทรัพย์"
- ต้องมี: เขตระบายเงิน กับดักการลงทุน หลุมดำการใช้จ่าย

**แกนที่ 3: คู่มือ "ท่าทางทำเงิน" สำหรับคุณโดยเฉพาะ**
- อิงตามธาตุในแผนภูมิ (ไฟ/ดิน/ลม/น้ำ) ระบุทิศทางงานเสริมที่ดีที่สุด
- ตัวอย่าง: "สร้างรายได้จากแบรนด์ส่วนตัว บินเคี้ยวด้วยทักษะเทคนิค พลิกทรัพยากร"
- ต้องมี: ทิศทางงานเสริม เส้นทางความมั่งคั่ง รหัสเงิน

【กฎเหล็ก】
✓ แต่ละแกนต้องมี 800+ คำ รวม 2400-3000 คำ
✓ ภาษาคมชัด เจาะจิตวิญญาณ ไม่มีถ้อยคำที่ถูกต้องแต่ไร้ประโยชน์
✓ ใช้รูปแบบประโยคที่แข็งแกร่ง: "คุณคือ", "คุณต้อง", "อย่า"
✓ แผนภูมิเกิดไม่เปลี่ยนแปลง เนื้อหาต้องยืนหยุดยั่งต่อการทดสอบของเวลา
✗ ไม่มีเดือนหรือปีที่เฉพาะเจาะจง (นั่นสำหรับรายงานรายเดือน/รายปี)
✗ ไม่มีการทำนายตามเวลา (นั่นคือเนื้อหาการเคลื่อนที่)
✗ ไม่มี "ปีนี้", "เดือนหน้า" ฯลฯ`,

      user: `วันเกิดผู้ใช้: ${birthDate}
ดวงอาทิตย์โดยกำเนิด: ${sunSign}

สร้าง "รายงานถอดรหัสดีเอ็นเอความมั่งคั่งโดยกำเนิด" สำหรับผู้ใช้นี้ ตามโครงสร้างโฟกัสสามแกนอย่างเคร่งครัด`
    },

    vi: {
      system: `Bạn là một chiêm tinh gia đẳng cấp thế giới và chuyên gia tâm lý học về sự giàu có, làm chủ chiêm tinh phương Tây, tâm lý học Jung và giải mã DNA sự giàu có.

【Vai Trò Của Bạn】
Bạn không phải là người bói toán. Bạn là nhà giải phẫu học số phận. Bạn mổ xẻ gen giàu có bẩm sinh của người dùng với độ chính xác như phẫu thuật.

【Định Dạng Đầu Ra - Tập Trung Ba Trục】

**Trục 1: "Kho Báu" Bẩm Sinh Của Bạn Được Giải Mã** (Đào Sâu Nhà 2/8/10 Bản Mệnh)
- Sử dụng ngôn ngữ sắc bén nhất để đánh trúng điểm đau trực tiếp
- Ví dụ: "Chủ nhân nhà 2 của bạn ở vị trí suy - bạn là kiểu 'kiếm nhanh, tiêu nhanh hơn' tự nhiên. Tránh xa đầu tư rủi ro cao."
- Phải bao gồm: cấu trúc giàu có, bản chất nam châm hút tiền, khả năng tiết kiệm

**Trục 2: Cảnh Báo Kẻ Thù Giàu Có Suốt Đời** (Khía cạnh Sao Thổ/Diêm Vương)
- Chỉ ra chính xác nơi "bẫy tài chính" lớn nhất trong đời sẽ xuất hiện
- Ví dụ: "phá sản từ khởi nghiệp mù quáng, bị kéo xuống bởi cho bạn bè vay, mắc kẹt trong đầu cơ bất động sản"
- Phải bao gồm: vùng rò rỉ tiền, bẫy đầu tư, hố đen chi tiêu

**Trục 3: Hướng Dẫn "Tư Thế Kiếm Tiền" Riêng Của Bạn**
- Dựa trên yếu tố biểu đồ (Lửa/Đất/Khí/Nước), chỉ định hướng công việc phụ tốt nhất
- Ví dụ: "kiếm tiền từ thương hiệu cá nhân, chinh phục bằng kỹ năng, lật ngược tài nguyên"
- Phải bao gồm: hướng công việc phụ, con đường giàu có, mã tiền

【Quy Tắc Sắt】
✓ Mỗi trục phải có 800+ từ, tổng 2400-3000 từ
✓ Ngôn ngữ sắc bén, xuyên thấu tâm hồn, không có câu đúng nhưng vô dụng
✓ Sử dụng cấu trúc câu mạnh: "Bạn là", "Bạn phải", "Không bao giờ"
✓ Bản mệnh không bao giờ thay đổi, nội dung phải đứng vững trước thử thách của thời gian
✗ KHÔNG có tháng hoặc năm cụ thể (đó dành cho báo cáo tháng/năm)
✗ KHÔNG có dự đoán dựa trên thời gian (đó là nội dung lưu chuyển)
✗ KHÔNG có "năm nay", "tháng sau" v.v.`,

      user: `Ngày sinh người dùng: ${birthDate}
Mặt Trời Bản Mệnh: ${sunSign}

Tạo "Báo Cáo Giải Mã DNA Giàu Có Bẩm Sinh" cho người dùng này, tuân thủ nghiêm ngặt cấu trúc tập trung ba trục.`
    }
  };

  const prompt = PROMPTS[lang] || PROMPTS.en;
  return prompt;
}

function buildWealthReportPrompt(birthDate, lang, reportType, astroData, astroMatrix, hasBirthTime = false) {
  if (!reportType) return null;

  try {

  // 🛠️ V82: function-level houseLock (used in user prompt for all 6 languages)
  let houseLock = '';

  // ── 动态日期计算 ──
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  // 🛡️ V483b: 时间轴真源 —— 一律以【矩阵实际窗口】为准（年报=财年 7 月起 / 月报=当月起），
  //   取代「服务器当前月 + i」的推算。matrix.months[0].month_key 已由 v69_client 按 reportType 分流。
  const _axisKey = /^(\d{4})-(\d{1,2})$/.exec(String(astroMatrix?.months?.[0]?.month_key || ''));
  const axisYear = _axisKey ? Number(_axisKey[1]) : currentYear;
  const axisMonth = _axisKey ? Number(_axisKey[2]) : currentMonth;
  // V225: 目标月份防御日志——出生日期仅用于本命盘，报告时间轴强制锁死服务器当月
  console.log(`[MONTHLY] 出生: ${birthDate || '未提供'} | 目标锁定: ${currentYear}年${currentMonth}月`);
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate(); // V222k
  const monthNamesZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const monthNamesEN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // 计算未来12个月的区间
  function getMonthRange(startIdx, count) {
    let ranges = [];
    for (let i = 0; i < count; i++) {
      let m = (startIdx + i) % 12;
      let y = currentYear + Math.floor((startIdx + i) / 12);
      ranges.push(`${y}年${monthNamesZH[m]}`);
    }
    return ranges;
  }

  // 🛡️ V483b: 12 个月区间说明同样以矩阵 month_key 为真源（原按 currentMonth 推算 → 年报错位 2 个月）
  const monthsRange = (_axisKey && Array.isArray(astroMatrix?.months) && astroMatrix.months.length
    ? astroMatrix.months.map((m) => {
        const t = /^(\d{4})-(\d{1,2})$/.exec(String(m?.month_key || ''));
        return t ? `${t[1]}年${Number(t[2])}月` : '';
      }).filter(Boolean)
    : getMonthRange(currentMonth - 1, 12)
  ).join('、') + '(共12个月)';

  // ── 语言专属指令 ──
  const langInstructions = {
    zh: '\n\n【强制语言指令】你必须全程使用简体中文输出。忽略系统提示中的任何英文指令。严禁输出任何英文句子或英文单词，只写中文。\n\n【中文写作铁律 - 必读】\n1. 🛑 禁用畸形被动句：严禁使用"被……成为"、"被……使得"等不符合中文习惯的被动句（例："你的财富宫位被巨蟹座成为中心"❌）。一律使用主动语态（例："巨蟹座成为了你财富宫位的中心"✅）。\n2. 🛑 主语完整性：提到星座对冲或相位时，必须写明"本命星座"或"流年星体"（例：写"与你的本命摩羯座太阳形成对冲"✅），严禁只写"你的摩羯座形成对冲"❌。\n3. 🛑 句式完整性铁律：每个句子必须有完整主语+谓语。星体名称不能单独成句或与动词分离（如"巨蟹座交织"❌应写成"太阳与水星在巨蟹座交织"✅；"金星从狮子座的深层资源领域"❌应写成"金星从狮子座进入深层资源领域"✅）。\n4. 🛑 宫位标签强制吐出：当提及星体所在宫位时，必须同时写出"第X宫"标签（例："木星在狮子座（第5宫）"✅），不得只写宫位主题省略"第X宫"数字标签。\n5. 🛑 水星逆行铁律：水星于6月底进入巨蟹座逆行，7月24日恢复顺行。禁止写"7月16日恢复顺行"、"7月18日逆行顶点"等矛盾句式。正确写法："水星在巨蟹座逆行"或"7月24日水星恢复顺行"。\n  6. 🛑 天文几何铁律：月亮在摩羯座与冥王星在水瓶座仅30°相邻（相邻星座绝不等同于对冲），7月绝不可能形成月亮/冥王对冲。严禁写"月亮在摩羯座与冥王星在水瓶座形成对冲"——正确为"错位张力"或"能量碰撞"。\n\n\n【宫位格式 V375】写宫位必须用阿拉伯数字加宫字：第1宫、第2宫、第8宫；严禁混用 "House 8" 英文写法或 "8th house" 序数写法。\n\n【本命与流年 分离铁律 V432】本命位置（出生日期锁定）必须带 本命 前缀：写「本命太阳在天蝎座 第8宫」；本月流年位置必须带 流年 前缀，且绝不能带 本命：写「流年太阳在天秤座 第6宫」。严禁给流年位置加 本命，也严禁给本命位置加 流年。',
    en: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN ENGLISH. Ignore any Chinese text in the system prompt. Write in sophisticated, soul-stirring English. You are a top-tier Western astrologer and Jungian psychologist. Use professional terms (Solar Return, Shadow Self, Synastry Alignment, Jungian Shadow Work, 8th House, 11th House). NEVER use invented aspect names like "trine", "square", "sextile", or "opposite". Always describe planetary interactions with energetic flow terms: "creates a powerful alignment with...", "forms dynamic tension with...", "harmonizes with the energy of...", "triggers transformative friction with...". ALL OUTPUT MUST BE IN ENGLISH ONLY.\n\n[ANTI-LITERAL TRANSLATION BLACKLIST] NEVER use awkward literal translations of Chinese fortune-telling terms. FORBIDDEN: "Core Heavenly Secrets", "Heavenly Machine", "Fate Opportunity", "Celestial Secret", "Heavenly Secret". ALWAYS use authentic Western Psychological Astrology terms instead: "Core Cosmic Window", "Key Astrological Catalyst", "Celestial Trigger Point", "Primary Planetary Shift".\n\n[HOUSE CONSISTENCY V375] Within the report body, use ONLY English "House N" (House 1, House 2, House 8 etc.). NEVER mix Chinese "第X宫" or Thai "บ้าน X" within the same paragraph. CORRECT: "Venus in Scorpio, House 8" — WRONG: "Venus in Scorpio (第8宫)"\n\n[STRICT NUMERIC ORDINAL RULE V512] MANDATORY. House references MUST use digit-ordinal format: "7th House", "12th House", "in the 8th House". NEVER write spelled-out house names such as "seventh house", "twelfth house", "in your first house". This applies to EVERY house mention (natal and transit) and overrides stylistic preference. A single spelled-out house reference makes the report non-compliant.\n\n[NATAL vs TRANSIT SEPARATION V432] MANDATORY. Placements fixed by birth date MUST always carry the natal marker: write "your natal Sun in Scorpio, House 8" or "your natal Moon". Monthly transit placements (the sky of this month) MUST always carry a transit marker and NEVER the natal marker: write "the transiting Sun in Libra, House 6" or "the Sun of the month". NEVER put the natal marker on a transit position, and NEVER put a transit marker on a natal position.',
    es: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN SPANISH. Ignore any Chinese text in the system prompt. Eres un astrólogo de élite y psicólogo junguiano. Usa términos profesionales (Yo Sombra, Retorno Solar, Alineación de Sinastría). Escribe en español sofisticado y místico. TODA LA SALIDA DEBE ESTAR EN ESPAÑOL ÚNICAMENTE.\n\n[FORMATO DE CASA V375] Al escribir el numero de casa use SIEMPRE el formato numerico: Casa 1, Casa 2, Casa 8. NUNCA use ordinales (octava casa) ni el ingles "8th House" ni el chino en el mismo parrafo.\n\n[SEPARACION NATAL vs TRANSITO V432] OBLIGATORIO. Las posiciones natales (fijadas por la fecha de nacimiento) deben llevar SIEMPRE el marcador natal: escriba "su Sol natal en Escorpio, Casa 8". Las posiciones de transito del mes deben llevar SIEMPRE el marcador de transito y NUNCA natal: escriba "el Sol en transito en Libra, Casa 6". Nunca ponga el marcador natal en una posicion de transito, ni el marcador de transito en una posicion natal.',
    fr: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN FRENCH. Ignore any Chinese text in the system prompt. Vous êtes un maître astrologue parisien et psychologue junguien. Utilisez un ton romantique, philosophique, avec des termes tarologiques classiques et le concept du "Soi" de Jung. Écrivez en français élégant. TOUTE LA SORTIE DOIT ÊTRE EN FRANÇAIS UNIQUEMENT.\n\n[HOUSE NUMBER FORMAT V375] Lorsque vous ecrivez le numero de maison dans le rapport, utilisez TOUJOURS le format numerique francais: Maison 1, Maison 2, Maison 5, Maison 9, etc. Ne utilisez JAMAIS les ordinaux francais (premiere, deuxieme, septieme maison) ni House anglais ni di-X-gong chinois dans le meme paragraphe. CORRECT: Mars en Cancer, Maison 5. FAUX: Mars en Cancer, cinquieme maison.',
    th: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN THAI. Ignore any Chinese text in the system prompt. คุณคือโหราจารย์ชั้นนําที่ผสมผสานจิตวิทยาคววเจียน ใช้คําที่ศักดิ์สิทธิ์และน่าเคารพ เขียนในภาษาไทยที่ทรงพลัง ผลลัพธ์ทั้งหมดต้องเป็นภาษาไทยเท่านั้น\n\n[HOUSE NUMBER FORMAT V375] เมื่อเขียนหมายเลขโชคลาภ บ้าน ในรายงาน ใช้ตัวเลขไทยพร้อมคำนำหน้า บ้าน 1, บ้าน 2, บ้าน 5, บ้าน 9 เป็นต้น ห้ามผสมผสาน "House" ภาษาอังกฤษ หรือ "第X宫" ภาษาจีน ในย่อหน้าเดียวกัน',
    vi: `\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN VIETNAMESE. Ignore any Chinese text in the system prompt. Bạn là một chiêm tinh gia hàng đầu kết hợp tâm lý học Jungian. Viết bằng tiếng Việt trang trọng, mang tính định mệnh. TOÀN BỘ ĐẦU RA PHẢI BẰNG TIẾNG VIỆT CHỈ.\n\n[HOUSE NUMBER FORMAT V375] Khi viết số nhà (cung hoàng đạo) trong báo cáo, dùng tiếng Việt: Nhà 1, Nhà 2, Nhà 5, Nhà 9 v.v. TUYỆT ĐỐI không trộn lẫn "House" tiếng Anh hoặc "第X宫" tiếng Trung trong cùng một đoạn văn.\n\n[VIETNAMESE WORD NATAL INTEGRATION V379] You MUST reference the user natal sun sign, ascendant (Rising), AND natal Moon in your analysis (see NATAL CHART ANCHORS in the fact sheet). Always connect transit planetary energy to the personal natal chart. Example: "Sao Mộc tại Nhà 7 tạo góc tam hợp với Mặt Trời natal của bạn ở Ma Kết, và Mặt Trăng natal của bạn ở Song Ngư Nhà 5 khuếch đại trực giác tài chính".
[OUTPUT FORMAT V381] CRITICAL: DO NOT output any main report title, header, or greeting at the beginning. Start directly with Section 1 content.
`,
  };
  // 🛠️ V383: 多货币风险阈值动态化 — 替换 {{risk_limit}}/{{cooldown_hours}} 占位符
  const RISK_BY_LANG = {
    zh: { currency: 'CNY', symbol: '￥', baseRisk: 5000,     maxWeekly: 15000,     cooldown: 72 },
    en: { currency: 'USD', symbol: '$',  baseRisk: 800,      maxWeekly: 2500,      cooldown: 72 },
    fr: { currency: 'EUR', symbol: '€',  baseRisk: 700,      maxWeekly: 2000,      cooldown: 72 },
    es: { currency: 'EUR', symbol: '€',  baseRisk: 700,      maxWeekly: 2000,      cooldown: 72 },
    th: { currency: 'THB', symbol: '฿', baseRisk: 5000,     maxWeekly: 15000,     cooldown: 72 },
    vi: { currency: 'VND', symbol: '₫', baseRisk: 500000, maxWeekly: 36000000, cooldown: 72 },
  };
  const _rk = RISK_BY_LANG[lang] || RISK_BY_LANG.en;
  const _riskLimit = _rk.symbol + _rk.baseRisk.toLocaleString('en-US') + ' ' + _rk.currency;
  const _cooldownH = String(_rk.cooldown);
  let instruction = (langInstructions[lang] || langInstructions.en)
    .split('{{risk_limit}}').join(_riskLimit)
    .split('{{cooldown_hours}}').join(_cooldownH);

  // ── V69 SwissEph FACT_SHEET ─────────────────────────────────────────
  // When astroMatrix is provided (from Python SwissEph), use it.
  // This replaces the hardcoded FACT_SHEET with machine-computed truth.
  const v69FactSheet = astroMatrix
    ? buildFactSheet(astroMatrix, lang)
    : null;
  // If V69 computed data available, skip the hardcoded FACT_SHEET section
  // by marking it with a tag that the caller can replace.
  const HAS_V69_DATA = !!v69FactSheet;
  // 🛠️ P1.1: 逐月全行星真理数据块(内行星+外行星+峰值+黑天鹅,按月隔离)
  const perMonthData = astroMatrix ? buildPerMonthData(astroMatrix, lang) : '';
  const aspectsData = astroMatrix ? buildAspectsData(astroMatrix, lang) : '';
  // 🛠️ V177-P1: 全12月可读行星数据块，LLM照单抄不瞎猜
  const monthlyDataBlock = astroMatrix ? buildPerMonthDataBlock(astroMatrix, lang) : '';
  // 🛠️ V433 · 方案 A：月亮「周级真值」（根治「月中快照充当全月」的事实性幻觉）
  //   病根实证（1988-12-31 Chatham 盘 / 2026-09，es 生产）：
  //   ① 月报走的是 buildWealthReportPrompt（本函数），而 V383 月亮换座表与 EPHEMERIS 块
  //      都在 buildMonthlyPrompt —— 全仓零调用点的死代码 → 生产从未喂过任何月亮流月数据；
  //   ② 唯一月亮数据是 P1 块里的月中快照 Moon=Escorpio(H2) → 模型当全月常量抄，
  //      W1/W3/W4+陷阱段共 5 处写同一星座（真值 W1=Aries→Cancer、W4=Aquarius→Taurus）。
  //   治本：① 对月报摘掉 Moon 行（不留误导锚点）② 注入按周切分的真实月亮轨迹 + 硬规则。
  // 🛡️ V483: 只对【月报】取当月周表 —— 年报窗口起点是财年 7 月，若照旧取 months[0].moon_weeks
  //   会拿到 7 月周表并打进日志（语义错位 + 误导排查），而年报根本不消费这段。
  const _moonWeeks = reportType === 'monthly' ? (astroMatrix?.months?.[0]?.moon_weeks || null) : null;
  // ⚠️ 不得用 curMonthName：它在 live 函数里 5949 行才声明（本月报分支内），此处引用会 TDZ/未定义。
  //    改用引擎自带的月名（如 'Sep 2026' → 'Sep'），语言无关、无作用域依赖。
  const _mwMonthLabel = String(astroMatrix?.months?.[0]?.month_name || '').replace(/\s*\d{4}\s*$/, '').trim();
  const moonWeekBlock = buildMoonWeekBlock(astroMatrix, lang, _mwMonthLabel);
  // 🛠️ V441: JSON 事实宪法块（剥夺 LLM 生成天体事实的最后自留地）
  const factTreeBlock = buildMonthlyFactTree(astroMatrix, lang, _mwMonthLabel);
  const monthlyDataBlockMoon = (_moonWeeks
    ? monthlyDataBlock.replace(/\s*Moon=[^\s]+\*snap\*/g, '')
    : monthlyDataBlock) + moonWeekBlock;
  if (_moonWeeks) {
    console.log(`[V433] 月亮周级真值注入: ${_moonWeeks.map(w => `W${w.week}=${w.legs.length}腿/${(w.changes || []).filter(c => c.kind === 'sign').length}换座`).join(' ')}`);
  }

  // ── 多语言标题字典（军师裁决 V136 — buildWealthReportPrompt 专用版）──
  const MONTH_ABBR = {
    zh: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
    en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    es: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    fr: ['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'],
    th: ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],
    vi: ['Thg1','Thg2','Thg3','Thg4','Thg5','Thg6','Thg7','Thg8','Thg9','Thg10','Thg11','Thg12'],
  };
  const curMonthLocal = (MONTH_ABBR[lang] || MONTH_ABBR.zh)[currentMonth - 1];
  const HEADER_TEMPLATES_RP = {
    zh: {
      overview:    '✦ [🔮 本月命运主题] ✦',
      week1:       `✦ [🟢 第1周：${curMonthLocal}1日–7日（${V462_WEEK_SUB.zh[0]}）]`,
      week2:       `✦ [🔴 第2周：${curMonthLocal}8日–14日（${V462_WEEK_SUB.zh[1]}）]`,
      week3:       `✦ [🔵 第3周：${curMonthLocal}15日–22日（${V462_WEEK_SUB.zh[2]}）]`,
      week4:       `✦ [🟢 第4周：${curMonthLocal}23日–${lastDayOfMonth}日（${V462_WEEK_SUB.zh[3]}）]`,
      trap:        `✦ [⚠️ 消费陷阱：${currentYear}年${curMonthLocal}] ✦`,
      circuit:     '核心天机：',
      circuit_tag: '【风险提示：】',
    },
    en: {
      overview:    '✦ [🔮 Monthly Destiny Theme: Strategic Alignment & Wealth Expansion] ✦',
      week1:       `✦ [Week 1: ${curMonthLocal} 1–7] ${V462_WEEK_SUB.en[0]}`,
      week2:       `✦ [Week 2: ${curMonthLocal} 8–14] ${V462_WEEK_SUB.en[1]}`,
      week3:       `✦ [Week 3: ${curMonthLocal} 15–22] ${V462_WEEK_SUB.en[2]}`,
      week4:       `✦ [Week 4: ${curMonthLocal} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.en[3]}`,
      trap:        `✦ [⚠️ Spending Traps: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'Core Cosmic Window: ',
      circuit_tag: '【Risk Alert:】'
    },
    es: {
      overview:    '✦ [🔮 Tema de Destino Mensual] ✦',
      week1:       `✦ [Semana 1: ${curMonthLocal} 1–7] ${V462_WEEK_SUB.es[0]}`,
      week2:       `✦ [Semana 2: ${curMonthLocal} 8–14] ${V462_WEEK_SUB.es[1]}`,
      week3:       `✦ [Semana 3: ${curMonthLocal} 15–22] ${V462_WEEK_SUB.es[2]}`,
      week4:       `✦ [Semana 4: ${curMonthLocal} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.es[3]}`,
      trap:        `✦ [⚠️ Trampas de Gasto: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'Ventana Cósmica Clave: ',
      circuit_tag: '【Alerta de Riesgo:】',
    },
    fr: {
      overview:    '✦ [🔮 Thème de Destin du Mois] ✦',
      week1:       `✦ [Semaine 1: ${curMonthLocal} 1–7] ${V462_WEEK_SUB.fr[0]}`,
      week2:       `✦ [Semaine 2: ${curMonthLocal} 8–14] ${V462_WEEK_SUB.fr[1]}`,
      week3:       `✦ [Semaine 3: ${curMonthLocal} 15–22] ${V462_WEEK_SUB.fr[2]}`,
      week4:       `✦ [Semaine 4: ${curMonthLocal} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.fr[3]}`,
      trap:        `✦ [⚠️ Pièges Financiers: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'Fenêtre Cosmique Clé: ',
      circuit_tag: '【Alerte de Risque :】',
    },
    th: {
      overview:    '✦ [🔮 ธีมโชคชะตาประจำเดือน] ✦',
      week1:       `✦ [สัปดาห์ที่ 1: ${curMonthLocal} 1–7] ${V462_WEEK_SUB.th[0]}`,
      week2:       `✦ [สัปดาห์ที่ 2: ${curMonthLocal} 8–14] ${V462_WEEK_SUB.th[1]}`,
      week3:       `✦ [สัปดาห์ที่ 3: ${curMonthLocal} 15–22] ${V462_WEEK_SUB.th[2]}`,
      week4:       `✦ [สัปดาห์ที่ 4: ${curMonthLocal} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.th[3]}`,
      trap:        `✦ [⚠️ กับดักการใช้จ่าย: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'หน้าต่างจักรวาลหลัก: ',
      circuit_tag: '【คำเตือนความเสี่ยง:】',
    },
    vi: {
      overview:    '✦ [🔮 Chủ Đề Vận Mệnh Tháng] ✦',
      week1:       `✦ [Tuần 1: ${curMonthLocal} 1–7] ${V462_WEEK_SUB.vi[0]}`,
      week2:       `✦ [Tuần 2: ${curMonthLocal} 8–14] ${V462_WEEK_SUB.vi[1]}`,
      week3:       `✦ [Tuần 3: ${curMonthLocal} 15–22] ${V462_WEEK_SUB.vi[2]}`,
      week4:       `✦ [Tuần 4: ${curMonthLocal} 23–${lastDayOfMonth}] ${V462_WEEK_SUB.vi[3]}`,
      trap:        `✦ [⚠️ Bẫy Chi Tiêu: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'Cửa sổ Vũ trụ chính: ',
      circuit_tag: '【Cảnh Báo Rủi Ro:】',
    },
  };
  const HT_RP = HEADER_TEMPLATES_RP[lang] || HEADER_TEMPLATES_RP.zh;

  // 🛠️ V97x 治本:代码算死12个月锁死标题(星座+宫位由 SwissEph 算死,AI 只填四字主题)
  // 🛠️ V100f: 多语言版(按 lang 选字)
  // 🛠️ V482b: 补齐 es/fr/th/vi —— 原表只有 zh/en, 非 en/zh 会 fallback 到 **中文** 星座名,
  //   与 V478b 月标题锁(用 _v444Signs(lang) 写本地星座名)不一致 → 提示词自带中文泄漏源。
  const SIGN_LOCKS = {
    zh: {Aries:'白羊座', Taurus:'金牛座', Gemini:'双子座', Cancer:'巨蟹座', Leo:'狮子座', Virgo:'处女座', Libra:'天秤座', Scorpio:'天蝎座', Sagittarius:'射手座', Capricorn:'摩羯座', Aquarius:'水瓶座', Pisces:'双鱼座'},
    en: {Aries:'Aries', Taurus:'Taurus', Gemini:'Gemini', Cancer:'Cancer', Leo:'Leo', Virgo:'Virgo', Libra:'Libra', Scorpio:'Scorpio', Sagittarius:'Sagittarius', Capricorn:'Capricorn', Aquarius:'Aquarius', Pisces:'Pisces'},
    es: Object.fromEntries(SUN_SIGN_EN.map((e, i) => [e, SUN_SIGN_ES[i]])),
    fr: Object.fromEntries(SUN_SIGN_EN.map((e, i) => [e, SUN_SIGN_FR[i]])),
    th: Object.fromEntries(SUN_SIGN_EN.map((e, i) => [e, SUN_SIGN_TH[i]])),
    vi: Object.fromEntries(SUN_SIGN_EN.map((e, i) => [e, SUN_SIGN_VI[i]])),
  };
  const HOUSE_LOCKS = {
    zh: {1:'第1宫',2:'第2宫',3:'第3宫',4:'第4宫',5:'第5宫',6:'第6宫',7:'第7宫',8:'第8宫',9:'第9宫',10:'第10宫',11:'第11宫',12:'第12宫'},
    en: {1:'1st House',2:'2nd House',3:'3rd House',4:'4th House',5:'5th House',6:'6th House',7:'7th House',8:'8th House',9:'9th House',10:'10th House',11:'11th House',12:'12th House'},
    es: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 'Casa ' + (i + 1)])),
    fr: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 'Maison ' + (i + 1)])),
    // 🛡️ E16/R11g: 泰语宫位词纠为 `ภพที่ N` —— 原 `บ้าน N` 是「房屋/家」(口语义)，
    //   而泰语提示词与 LLM 实际产出均为 `ภพที่ N`（占星宫位正字，实测 12/12 盘一致）。
    //   提示词硬锁表给错词 ⇒ LLM 照抄即词汇降级; 输出侧 houseRe 两形态都认, 故只改写作侧。
    th: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 'ภพที่ ' + (i + 1)])),
    vi: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 'Nhà ' + (i + 1)])),
  };
  const SIGN_LOCK = SIGN_LOCKS[lang] || SIGN_LOCKS.zh;
  const HOUSE_LOCK = HOUSE_LOCKS[lang] || HOUSE_LOCKS.zh;
  // 🛠️ V482b: 月标题「行星引导词」本地化 —— 原写法对所有语种硬编码英文 `Sun in`,
  //   中文 Prompt 里因此夹带英文 → LLM 照抄, 生产实测(2026-09-30 1999-12-15 特罗姆瑟盘)
  //   整篇 12 条月标题全变「### 2026年9月: Sun in 处女座 第3宫 · …」。
  // 🛡️ E16/R11g: th 引导词纠为 `ดวงอาทิตย์ใน `（原 `ดาวอาทิตย์ใน ` 是星期/行星义的「ดาว」形态）
  const _V482B_SUN_LEAD = { zh: '太阳', en: 'Sun in ', es: 'Sol en ', fr: 'Soleil en ', th: 'ดวงอาทิตย์ใน ', vi: 'Mặt Trời trong ' };
  const _SUN_LEAD = _V482B_SUN_LEAD[lang] || _V482B_SUN_LEAD.en;
  const MONTH_FMT = lang === 'en'
    ? { yearPrefix: (y, m) => `${monthNamesEN[m - 1]} ${y}`, prefix: (y, m) => `${monthNamesEN[m - 1]} ${y}` }
    : { yearPrefix: (y, m) => `${y}年${m}月`, prefix: (y, m) => `${y}年${m}月` };
  const lockedTitles = astroMatrix && astroMatrix.months
    ? astroMatrix.months.map((m, i) => {
        // 🛠️ V114-fix: Python返回positions.Sun,fallback防止空对象
      const sun = m.sun || (m.positions?.Sun ? {sign: m.positions.Sun.sign, house: m.positions.Sun.house} : {});
        const signName = SIGN_LOCK[sun.sign] || sun.sign || '';
        const houseName = HOUSE_LOCK[sun.house] || `House ${sun.house}`;
        const _ym = _v483bMonthYM(m, i, currentYear, currentMonth);   // 🛡️ V483b: 年月真源=month_key
        return `#### ${MONTH_FMT.yearPrefix(_ym.year, _ym.month)}: ${_SUN_LEAD}${signName} ${houseName} · __[Fill 4-word theme]__`;
      }).join('\n')
    : '';
  const monthLockTable = astroMatrix && astroMatrix.months
    ? '\n⛔ [12-Month Sun Sign Hard-Lock Table - Month titles MUST use exact values below, strictly forbidden to tamper]:\n' +
      'All month titles【Sun Sign】and【House】MUST strictly follow the table below. Forbidden to use other data to extrapolate monthly Sun sign.\n' +
      astroMatrix.months.map((m, i) => {
        const sun = _sunOf(m);
        const signName = SIGN_LOCK[sun.sign] || sun.sign || '';
        const _ym = _v483bMonthYM(m, i, currentYear, currentMonth);   // 🛡️ V483b: 年月真源=month_key
        // 🛠️ V482b: 引导词/宫位词一律本地化(原写死英文 `Sun in` / `House N` → 中文 Prompt 夹带英文被 LLM 照抄)
        return `  ● ${MONTH_FMT.yearPrefix(_ym.year, _ym.month)}: ${_SUN_LEAD}${signName} · ${HOUSE_LOCK[sun.house] || ('House ' + sun.house)}`;
      }).join('\n')
    : '';

  // ═══════════════════════════════════════════════════════════════
  // V99n: 多语言 Prompt 架构重构 - 独立语种 Map
  // 彻底根除语种混淆,为全球化铺平道路
  // ═══════════════════════════════════════════════════════════════

  // 🛠️ V126-fix: natalSunSign 在年报分支无独立赋值,模板字面量直接引用会炸 ReferenceError
  //    必须在 YEARLY_SYSTEM 定义前给默认值
  const natalSunFallback = (() => {
    const idx = getNatalSunSign(birthDate);
    const m = {
      zh:['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'],
      en:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],
    }[lang] || ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    return m[idx] || 'Cancer';
  })();
  // 🛠️ V126-fix: natalSunENFallback 在年报块内声明,但月报块先执行时它还不存在
  //    移到此处与 natalSunFallback 并列,两分支都可见
  const natalSunENFallback = (() => {
    const idx2 = getNatalSunSign(birthDate);
    const enSigns=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    return enSigns[idx2]||'Cancer';
  })();

  // 根据用户语言动态加载纯净系统提示词
  const YEARLY_SYSTEM = {
    zh: getSystemPromptByLocale('zh'),
    en: getSystemPromptByLocale('en'),
    fr: getSystemPromptByLocale('fr'),
    es: getSystemPromptByLocale('es'),
    th: getSystemPromptByLocale('th'),
    vi: getSystemPromptByLocale('vi'),
  };


  // ════════════════════════════════
  // 分支:月报
  // ════════════════════════════════
    // 🛠️ V126-fix: 年报/月报模板共用变量必须在两者共同的父作用域声明
    //    月报 if() 里 let 声明的变量对年报 if() 不可见 → TDZ
    //    统一在外层声明,月报/年报内只做赋值(含条件赋值)
    let jupHouse=2, satHouse=10, plHouse=8, sunHouse=1, moonHouse=2;
    let jupSign='Leo', satSign='Aries', moonSign='Cancer';
    let natalSunSign = natalSunFallback;
    let natalSunSignEN = natalSunENFallback;
    let risingLocal = 'Cancer', jupSignLocal = 'Leo', satSignLocal = 'Aries', moonSignLocal = 'Cancer';
    let natalMoonSign = 'Cancer', natalMoonSignEN = 'Cancer';
    let _mZH='', _mEN='', _mES='', _mFR='', _mTH='', _mVI='';
    if (reportType === 'monthly') {
    // 计算当前月的英文名称
    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    const monthNamesZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const curMonthName = monthNames[currentMonth - 1];
      // V350b: 目标月太阳真值显式注入(buildWealthReportPrompt,stream实际调用)
      let _tgSunText = '';
      try {
        const _tm = astroMatrix && astroMatrix.months && astroMatrix.months[0];
        const _s = _tm && _tm.sun;
        if (_s && _s.sign) _tgSunText = _s.sign + ' (House ' + _s.house + ')';
      } catch(e){}
    const curMonthZH = `${currentYear}年${monthNamesZH[currentMonth-1]}`;

    // ── V120-fix3: 月报真实太阳星座 + 宫位锁(与年报同套逻辑)──
    const natalSunIdx = getNatalSunSign(birthDate);
    const NATAL_SIGN_ZH = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
    const NATAL_SIGN_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const natalSunZH = NATAL_SIGN_ZH[natalSunIdx];
    const natalSunEN = NATAL_SIGN_EN[natalSunIdx];

    // 宫位锁(从 astroMatrix 取真值,fallback 至上升巨蟹默认映射)
    const rising = astroMatrix?.meta?.rising_sign || 'Cancer';
    const RISING_IDX = { Aries:0, Taurus:1, Gemini:2, Cancer:3, Leo:4, Virgo:5, Libra:6, Scorpio:7, Sagittarius:8, Capricorn:9, Aquarius:10, Pisces:11 };
    const risingIdx = RISING_IDX[rising] ?? 3;
    risingLocal = { zh: NATAL_SIGN_ZH[risingIdx], en: rising, es: rising, fr: rising, th: rising, vi: rising }[lang] || rising;
    const getH2 = (v) => typeof v === 'number' ? v : (v?.house ?? v?.natal_house ?? v?.[0] ?? 1);
    // 🛠️ V120-fix5: fallback 修正为 ASC=Cancer 真值(与年报旧 fallback 对齐:木星狮子=2宫,土星白羊=10宫,冥王水瓶=8宫)
    // ⚠️ jupHouse/jupSign 等已在外层(let)声明,此处只赋值不重声明
    jupHouse=2; satHouse=10; plHouse=8; sunHouse=1; moonHouse=2;
    jupSign='Leo'; satSign='Aries'; moonSign='Cancer';
    if (astroMatrix && astroMatrix.months && astroMatrix.months[0]) {
      const first = astroMatrix.months[0];
      jupHouse = getH2(first.jupiter?.house);
      satHouse = getH2(first.saturn?.house);
      plHouse = getH2(first.pluto?.house);
      sunHouse = getH2(_sunOf(first).house);
      moonHouse = getH2(first.moon?.house);
      jupSign = first.jupiter?.sign || 'Leo';
      satSign = first.saturn?.sign || 'Aries';
      moonSign = first.moon?.sign || 'Cancer';
    }

    // ── V120-fix6: 月报全量行星数据(从 astroMatrix 真值提取,喂给 DeepSeek 杜绝编造)──
    const firstMonth = astroMatrix?.months?.[0];
    const PLANET_KEYS = [['sun','太阳'],['moon','月亮'],['mercury','水星'],['venus','金星'],['mars','火星'],['jupiter','木星'],['saturn','土星'],['uranus','天王星'],['neptune','海王星'],['pluto','冥王星']];
    const planetBlock = firstMonth ? PLANET_KEYS.map(([k, zh]) => {
      const p = k === 'sun' ? _sunOf(firstMonth) : (firstMonth[k]);
      if (!p || !p.sign) return null;
      const house = getH2(p.house);
      const rx = p.retrograde ? '（逆行）' : '';
      const status = p.status ? ` [${p.status}]` : '';
      // 🛠️ V433: 流月月亮绝不能以「月中快照」形式出现在「必须照抄」清单里。
      //   病根实证（Chatham 盘 es 生产）：此处 `月亮: Scorpio 第2宫` 被模型当成全月常量 →
      //   W1/W3/W4+陷阱段共 5 处写同一星座；而真值 W1=Aries→Cancer、W4=Aquarius→Taurus。
      //   月报且已有周级真值时 → 该行改为指向周级真值块（月亮 house 每周都变，本行不成立）。
      if (k === 'moon' && reportType === 'monthly' && _moonWeeks) {
        return '  - 月亮: ⚠️ NOT a month-wide value — take the Moon sign+house for EACH week from [MOON PER-WEEK TRUTH V433]';
      }
      return `  - ${zh}: ${p.sign} 第${house}宫${rx}${status}`;
    }).filter(Boolean).join('\n') : '';

    // ── V138-fix3: Warn AI when house data is from FALLBACK (ASC=Cancer default) vs real birth-time computation ──
    // true when: no astroMatrix OR astroMatrix.rising_sign_source !== 'computed'
    // This ensures AI knows houses are defaults even if astroMatrix exists (cache may not have rising_sign_source)
    const HOUSE_RISK = !astroMatrix?.meta?.rising_sign_source || astroMatrix.meta.rising_sign_source !== 'computed';
    const HOUSE_LOCK_WARNING = HOUSE_RISK ? `
⛔ [宫位来源说明]
以下行星宫位基于上升巨蟹座(ASC=Cancer)默认映射计算——这是因为未提供精确出生时间。
严禁将上述宫位数据与用户的真实出生盘混淆！
` : '';
    const planetBlockWithWarning = HOUSE_LOCK_WARNING + (planetBlock ? '\n' + planetBlock : '');

    // ── 月报系统提示词(6语言·Markdown格式·2026-07-19简化版)──
    const MONTHLY_SYSTEM = {
      zh: `你是顶级财富占星师兼荣格心理分析师。${instruction}`,
      en: `You are a master wealth astrologer and Jungian psychologist.${instruction}`,
      es: `Eres un maestro astrólogo de riqueza y psicólogo junguiano.${instruction}`,
      fr: `Vous êtes un maître astrologue de la richesse et psychologue junguien.${instruction}`,
      th: `คุณคือโหราจารย์ด้านความมั่งคั่งและนักจิตวิทยาจุงเกียนชั้นเซียน.${instruction}`,
      vi: `Bạn là nhà chiêm tinh giàu có và nhà tâm lý học Jungian hàng đầu.${instruction}`,
    };

    let monthlySystem = ((MONTHLY_SYSTEM[lang] || MONTHLY_SYSTEM.en) + FORMAT_FIREWALL + `
### [STRICT GROUNDING V374 — SUN/HOUSE/TITLE RULES]
5. SUN INGRESS SINGLE-USE: The Sun enters each zodiac sign ONLY ONCE per month. Write it ONLY in the week containing the actual ingress date. NEVER in two weeks.
6. HOUSE CONSISTENCY: Planet House number MUST match the data block. If data says "Venus: Scorpio 第5宫", EVERY mention MUST say 第5宫. NEVER write 第8宫 or 第9宫 for the same planet.
6b. MOON PER-WEEK TRUTH (V433 · HIGHEST PRIORITY): The Moon changes sign every ~2.5 days, so it NEVER keeps one sign for a month — its single mid-month value was REMOVED from the data block on purpose. For every weekly section take the Moon sign AND house ONLY from that week's line of [MOON PER-WEEK TRUTH V433]. NEVER repeat one Moon sign in two different weeks; NEVER name a Moon sign that is not listed for that week.
7. TITLE FORMAT: Monthly theme title MUST use your own language. Chinese=✦ [🔮 本月命运主题] ✦, English=✦ [🔮 Monthly Destiny Theme] ✦, Spanish=✦ [🔮 Tema de Destino Mensual] ✦, French=✦ [🔮 Thème de Destin du Mois] ✦, Thai=✦ [🔮 ธีมโชคชะตาประจำเดือน] ✦, Vietnamese=✦ [🔮 Chủ Đề Vận Mệnh Tháng] ✦. The 🔮 crystal ball icon is MANDATORY. (with ✦ and [🔮 ] brackets). NEVER bare text without brackets.
`).replaceAll('{MONTH}', curMonthName)
      .split('{{risk_limit}}').join(_riskLimit).split('{{cooldown_hours}}').join(_cooldownH);
        const natalSun2 = astroMatrix?.meta?.sun_sign || '';
        if (natalSun2) monthlySystem += `\n\n[NATAL PROFILE V382] User\'s Natal Sun is in ${natalSun2}. You MUST mention "${natalSun2}" in Section 1 and explain how the monthly transit affects their Natal Sun in ${natalSun2}.`;
        // 🛠️ V420 (军令 P0) 月报补齐「本命盘真值锚点」注入 —— 根治本命月亮造假
        //   病根: monthlySystem 此前只有本命太阳, 无任何本命锚点/fact sheet 数据,
        //   而各语言 instruction 却写着「see NATAL CHART ANCHORS in the fact sheet」
        //   → 指向一张从未注入的表 → 模型只能编本命月亮
        //   (实测 1990-08-05 真值 Ma Kết/摩羯 第5宫 被编成 Bọ Cạp/天蝎 第3·8宫, 且自相矛盾)
        if (astroMatrix) {
          try {
            const _natAnchors = buildNatalAnchors(astroMatrix);
            monthlySystem += `\n\n[NATAL CHART ANCHORS — SwissEph COMPUTED TRUTH · FIXED FOREVER · NEVER alter, infer or substitute]\n` +
              _natAnchors;
            // 🛠️ V461-FIX: 升级规则 —— 从「只管月亮」扩为「全行星铁锁」
            // 根因: 原规则只说 Moon，LLM 把 Jupiter Aquarius H2 写成 Leo H8；
            // 现在要求 JSON 真值与散文必须精确匹配，任何行星写错 = generation failure。
            monthlySystem += `\n- RULE: When writing about ANY natal planet, you MUST copy the sign AND house EXACTLY from the JSON above. If JSON says "natalJupiter":{"sign":"Aquarius","house":2}, you MUST write "Your natal Jupiter in Aquarius, House 2". VIOLATION = "Your Jupiter in Leo, House 8" is a CRITICAL failure. The transit Sun/Moon of the month are DIFFERENT from natal planets — never merge them.`;
          } catch (e) { console.warn('[V420] natal anchors inject failed: ' + e.message); }
        }
        // 🛠️ V424-B: 泰语本命锚点（泰语直出，杜绝模型自译漏写星座名/漏写กำเนิด标记）
        let _natAnchorsTh = '';
        if (astroMatrix) {
          try {
            const meta = astroMatrix?.meta || {};
            const ch = meta.computed_houses || {};
            const _thSign = (en) => { const i = _EN2ZIDX[en]; return i != null ? SUN_SIGN_TH[i] : (en || '?'); };
            const _lines = [
              `ดวงอาทิตย์กำเนิด (Natal Sun): ราศี${_thSign(meta.sun_sign || ch.Sun?.sign)} บ้าน ${ch.Sun?.house ?? '?'}`,
              `ดวงจันทร์กำเนิด (Natal Moon): ราศี${_thSign(meta.natal_moon?.sign || ch.Moon?.sign)} บ้าน ${meta.natal_moon?.house ?? ch.Moon?.house ?? '?'}`,
            ];
            for (const p of _TH_PLANET_ORDER) {
              if (p === 'Sun' || p === 'Moon') continue;
              const info = ch[p];
              if (!info) continue;
              _lines.push(`${_TH_PLANET[p]}กำเนิด (Natal ${p}): ราศี${_thSign(info.sign)} บ้าน ${info.house ?? '?'}`);
            }
            _natAnchorsTh = _lines.join('\n');
          } catch (e) { console.warn('[V424-B] th natal anchors build failed: ' + e.message); }
        }

        // 🛠️ V439: 概述句+陷阱段骨架硬注入——算法生成真值，剥夺 LLM 编造天体事实的最后自留地
        // 概述句骨架（概述段禁止 LLM 自由发挥天文数据）
        let _overviewBlock = '';
        try { _overviewBlock = buildMonthlyOverviewBlock(astroMatrix, lang); } catch(e) { console.warn('[V439] overview block failed: ' + e.message); }
        // 陷阱段骨架
        let _trapBlock = '';
        try { _trapBlock = buildMonthlyTrapBlock(astroMatrix, lang); } catch(e) { console.warn('[V439] trap block failed: ' + e.message); }

        // ── V137: Per-language user templates (fix: isolate Chinese contamination in EN/ES/FR/TH/VI) ──
    const USER_TEMPLATE = {
      zh: `⛔ [ASTRONOMICAL TRUTH - 唯一数据来源]:
以下天文数据来自 AstroMatrix，请严格遵循，禁止推理：
${planetBlockWithWarning}

🛠️ [P1 全12月行星数据 - 严禁自行计算]:
${monthlyDataBlockMoon}

${factTreeBlock}

⛔ [宫位系统一致性]: 禁止写"狮子座是第10宫"——宫位由上升星座决定，严格使用上方数据中的第N宫编号。
⛔ [宫位直写铁律]: 提到行星宫位时，直接写"第N宫"（如"木星在狮子座第2宫带来财富"），严禁使用任何 {{}} 模板占位符或英文 token 标记。后端不再做占位符替换。

⛔ [相角幻觉禁令]: 禁止写"形成和谐互动"、"吉相"、"三分相/四分相/对分相"等相角术语。禁止描述 quincunx(150°处女-白羊)、square(90°处女-双子)为正向能量。统一用中性行星能量描述，如："处女座金星与白羊座土星的错位张力"、"处女座金星与双子座天王星的能量碰撞带来突发变数"。禁止用"意外之财"、"意外收获"描述四分相/梅花相位的相位。
禁止用"同频共振"描述四分相(90°/square)或梅花相(150°/quincunx)——只有三分相(120°/trine)或六分相(60°/sextile)才可用"共振"类词汇。水星/火星/天王星与任何行星的紧张相位禁止用"同频共振"。
几何关系：狮子座与水瓶座正对（180度），摩羯座与水瓶座相邻（30度），相邻星座绝不等同于对冲。

几何关系：狮子座与水瓶座正对（180度），摩羯座与水瓶座相邻（30度），相邻星座绝不等同于对冲。


Generate a ${lang} monthly wealth report for birth date ${birthDate} — natal sun sign: ${natalSunZH} (${natalSunEN}) — rising sign: ${risingLocal} — (${curMonthName} ${currentYear}).
${_tgSunText ? '⚠️ [当月太阳铁定真值 - 必须照抄] ' + _tgSunText + '。所有太阳描述必须严格使用此值,绝对禁止用本命太阳或任何其他星座。' : ''}
⛔ [V165-vital] 本命太阳星座 = ${natalSunEN}（生日 ${birthDate} 绝对正确,绝不是其他星座）。上升星座 = ${risingLocal}（绝非 Cancer，除非从 AstroMatrix 真实计算得出）。

CRITICAL REQUIREMENTS:
• Total length: 1,200-1,500 words (${lang}) — be rich and dense, no fluff
• Style: Epic, destiny-filled, premium quality
• MUST have 6 sections exactly

OUTPUT FORMAT — CLEAN MARKDOWN (6 sections, no JSON):

${HT_RP.overview}
${_overviewBlock}

${HT_RP.week1}
[Write 150-200 words: describe the financial energy of week 1, key opportunities, recommended actions, important dates. Be specific and actionable.]

${HT_RP.week2}
[Write 150-200 words: describe high-risk financial days, potential pitfalls, danger zones. Be specific about which days to avoid major financial decisions.]

${HT_RP.week3}
[Write 150-200 words: describe gradual financial growth, opportunities for passive income, strategic preparation. Include specific date references where relevant.]

${HT_RP.week4}
[Write 150-200 words: describe peak financial energy, major money-making opportunities, bonus income, windfall possibilities. Reference specific celestial events driving this energy.]

${HT_RP.trap}
${_trapBlock}
    \``,
      en: `USER INSTRUCTIONS:
⛔ [V165-vital] THIS USER'S CHART:
  - Natal Sun = ${natalSunEN} (birth date ${birthDate} = ALWAYS ${natalSunEN}, NEVER any other sign)
  - Ascendant = ${risingLocal} (NOT Cancer unless specifically computed by AstroMatrix)
  - TRANSIT Jupiter (Sep 2026): in ${jupSignLocal} = House ${jupHouse} — this is the TRANSIT position for THIS month, NOT the user's natal Jupiter. The natal Jupiter is in [NATAL CHART ANCHORS].
  - TRANSIT Saturn (Sep 2026): in ${satSignLocal} = House ${satHouse} — this is TRANSIT, NOT natal. See [NATAL CHART ANCHORS] for natal Saturn.
  - TRANSIT Pluto (Sep 2026): in Aquarius = House ${plHouse} — this is TRANSIT, NOT natal. See [NATAL CHART ANCHORS] for natal Pluto.
  - CRITICAL: You MUST reference the user's NATAL planets (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto) from the [NATAL CHART ANCHORS] section. When describing how monthly transit affects the user, ALWAYS say "Your natal Jupiter in [CHECK NATAL CHART ANCHORS], House [CHECK NATAL CHART ANCHORS]" — NEVER write a natal planet's sign or house without matching [NATAL CHART ANCHORS]. Example (DO NOT COPY): if your NATAL CHART ANCHORS says Jupiter in Sagittarius, House 4 → write exactly "Your natal Jupiter in Sagittarius, House 4". The sign AND house must BOTH match [NATAL CHART ANCHORS].
${planetBlockWithWarning}

🛠️ [P1 FULL 12-MONTH PLANET DATA — COPY EXACTLY, NEVER CALCULATE]:
${monthlyDataBlockMoon}

ASTROGRAPHIC RULES:
• All planetary positions above are computed by Swiss Ephemeris — follow EXACTLY
• Do NOT use aspect terminology (trine/square/sextile/opposition) — use energy description instead
• Do NOT write "unexpected windfall" for tense aspects
• When a planet is in a house, describe the THEMATIC wealth energy of that house
• ⛔ [MERCURY RX TIMELINE LOCK] Mercury entered retrograde in Cancer on ~June 28, 2026. It stations DIRECT on July 24, 2026. FORBIDDEN to say Mercury turns direct before July 24 or that it "reaches retrograde apex" after July 24. The correct narrative: "Mercury stations direct on July 24." • Venus enters Virgo Jul 14; Sun enters Leo Jul 23
• Moon NEVER goes retrograde — always Direct
• NO invented planetary positions — use only the data above

OUTPUT FORMAT — CLEAN MARKDOWN (6 sections, no JSON):

${HT_RP.overview}
[Write 1-2 sentences about the overall monthly financial theme, incorporating the planetary lineup and the native's natal sun sign. You MUST mention the user's natal Sun in [sign] House [N] and natal Moon in [sign] House [N] from [NATAL CHART ANCHORS].]

${HT_RP.week1}
[Write 150-200 words: describe the financial energy of week 1, key opportunities, recommended actions, important dates. Reference how the transit affects the user's natal planets. Example (check [NATAL CHART ANCHORS] for the CORRECT sign and house): "With your natal Jupiter in [NATAL CHART ANCHORS], House [NATAL CHART ANCHORS], this week's transit Moon amplifies your natural energy." You MUST mention at least 2 natal planets (Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn) from [NATAL CHART ANCHORS] — copy sign AND house EXACTLY from [NATAL CHART ANCHORS].

${HT_RP.week2}
[Write 150-200 words: describe high-risk financial days, potential pitfalls, danger zones. Be specific about which days are dangerous and why. Include a concrete financial safety rule. Reference the transit-to-natal interaction for at least 2 natal planets from [NATAL CHART ANCHORS].]

${HT_RP.week3}
[Write 150-200 words: describe gradual financial growth, opportunities for passive income, strategic preparation. Include days for planning and consolidation. Reference how transit affects the user's natal planets from [NATAL CHART ANCHORS].]

${HT_RP.week4}
[Write 150-200 words: describe peak financial energy, major money-making opportunities, bonus income, windfall possibilities. Be bold and specific about peak days. Reference how transit aligns with or challenges the user's natal planets from [NATAL CHART ANCHORS]. Example (check [NATAL CHART ANCHORS] for the CORRECT sign and house): "Your natal Mars in [NATAL CHART ANCHORS], House [NATAL CHART ANCHORS], harmonizes with the transit to create bold, expansion-focused action." Copy sign AND house EXACTLY from [NATAL CHART ANCHORS].

${HT_RP.trap}
${_trapBlock}
`,
      es: `INSTRUCCIONES DE USUARIO:
${planetBlockWithWarning}

🛠️ [P1 DATOS PLANETARIOS 12 MESES — COPIAR EXACTO, NUNCA CALCULAR]:
${monthlyDataBlockMoon}

REGLAS ASTROGRÁFICAS:
• Todas las posiciones planetarias son de Swiss Ephemeris — seguir EXACTAMENTE
• NO usar terminología de aspectos como trino, cuadratura o sextil — usar descripción de energía
• Cuando un planeta esté en una casa, describir el tema de RIQUEZA de esa casa
• ⛔ [CRONOLOGÍA DE MERCURIO RETRÓGRADO] Mercurio entró retrógrado en Cáncer aprox. el 28 de Junio. Estaciona directo el 24 de Julio. PROHIBIDO decir que Mercurio cambia a directo antes del 24 de Julio. • Venus entra en Virgo Jul 14; Sol entra en Leo Jul 23
• La Luna NUNCA es retrógrada

FORMATO DE SALIDA — MARKDOWN LIMPIO (6 secciones):

${HT_RP.overview}
[Write 1-2 sentences...]

${HT_RP.week1}
${HT_RP.circuit}Día X
[Write 150-200 words in Spanish...]

${HT_RP.week2}
${HT_RP.circuit}Día X
[Write 150-200 words in Spanish...]

${HT_RP.week3}
${HT_RP.circuit}Día X
[Write 150-200 words in Spanish...]

${HT_RP.week4}
${HT_RP.circuit}Día X
[Write 150-200 words in Spanish...]

${HT_RP.trap}
[Write 100-150 words in Spanish... specific dollar amount trigger...]
`,
      fr: `INSTRUCTIONS UTILISATEUR:
${planetBlockWithWarning}

🛠️ [P1 DONNÉES PLANÉTAIRES 12 MOIS — COPIER EXACTEMENT, NE JAMAIS CALCULER]:
${monthlyDataBlockMoon}

RÈGLES ASTROGRAPHIQUES:
• Toutes les positions planétaires viennent de Swiss Ephemeris — suivre EXACTEMENT
• Ne PAS utiliser la terminologie des aspects (trine/carré/sextile) — utiliser la description d'énergie
• Quand une planète est dans une maison, décrire le thème de RICHESSE de cette maison
• Mercure rétrograde en Cancer du ~8 au ~25 juillet; Vénus entre en Vierge le 14 juillet; Soleil entre en Lion le 23 juillet
• La Lune N'EST JAMAIS rétrograde

FORMAT DE SORTIE — MARKDOWN PROPRE (6 sections):

${HT_RP.overview}
[Write 1-2 sentences...]

${HT_RP.week1}
${HT_RP.circuit}Jour X
[Write 150-200 words in French...]

${HT_RP.week2}
${HT_RP.circuit}Jour X
[Write 150-200 words in French...]

${HT_RP.week3}
${HT_RP.circuit}Jour X
[Write 150-200 words in French...]

${HT_RP.week4}
${HT_RP.circuit}Jour X
[Write 150-200 words in French...]

${HT_RP.trap}
[Write 100-150 words in French... specific dollar amount trigger...]
`,
      th: `⚠️ [ภาษาบังคับ — อ่านก่อนเขียน] ภาษาของรายงานนี้ต้องเป็นภาษาไทยเท่านั้น！
ภาษาของรายงานทั้งหมดต้องเป็นภาษาไทย ห้ามเขียนเป็นภาษาอังกฤษ/จีน/ฝรั่งเศส/สเปน/เวียดนาม แม้แต่ตัวอย่างหรือคำอธิบาย
คำแนะนำสำหรับผู้ใช้:
${planetBlockWithWarning}

🛠️ [P1 ข้อมูลดาวเคราะห์ 12 เดือน — คัดลอกตรงๆ ห้ามคำนวณเอง]:
${monthlyDataBlockMoon}

🛠️ [แยกแยะ NATAL vs TRANSIT — สำคัญที่สุด]:
• [P1 PER-MONTH PLANET DATA] คือตำแหน่งดาวทรานซิส (transit) ของแต่ละเดือน — ต้องใช้สำหรับคำอธิบายดาวทรานซิส เท่านั้น ชื่อราศีต้องตรงกับข้อมูลนี้ทุกตัวอักษร ห้ามเปลี่ยน
• [ดวงชะตากำเนิด NATAL CHART ANCHORS] คือตำแหน่งกำเนิด (natal) — ใช้เฉพาะเมื่อเขียนคำว่า "กำเนิด" เท่านั้น
• ห้ามนำตำแหน่งกำเนิด (natal) มาเขียนแทนดาวทรานซิส และห้ามนำดาวทรานซิสมาเขียนแทนกำเนิด
• ดาวทรานซิสแต่ละดวง (ดวงอาทิตย์เคลื่อนเข้าสู่..., ดาวศุกร์ใน..., ฯลฯ) ต้องใช้ราศีจาก [P1 PER-MONTH PLANET DATA] เท่านั้น ไม่ใช่จากดวงชะตากำเนิด

กฎดาราศาสตร์:
• ตำแหน่งดาวเคราะห์ทั้งหมดมาจาก Swiss Ephemeris — ปฏิบัติตามอย่างเคร่งครัด
• ห้ามใช้ศัพท์มุม (trine/square/sextile) — ใช้คำอธิบายพลังงานแทน
• ดาวพุธวงในในราศีกรกฎ ประมาณ 8-25 กรกฎาคม; ดาวศูกรเข้าราศีกันยา 14 กรกฎาคม; ดวงอาทิตย์เข้าราศีสิงห์ 23 กรกฎาคม
• ดวงจันทร์ไม่เคยวงใน

🛠️ [ดวงชะตากำเนิด — NATAL CHART ANCHORS ภาษาไทย (SwissEph คำนวณจริง · ห้ามเปลี่ยนแปลง)]
${_natAnchorsTh}
กฎ: ทุกการกล่าวถึงดาวกำเนิด ต้องใช้เครื่องหมาย "กำเนิด" และระบุราศี+บ้านตามที่ระบุ exactly ห้ามละทิ้งชื่อราศี (เช่น ห้ามเขียน "ดวงอาทิตย์ในบ้าน 12" โดยไม่ระบุราศี)

[THAI ZODIAC REFERENCE] ราศีเมษ=Aries, ราศีพฤษภ=Taurus, ราศีมิถุน=Gemini, ราศีกรกฎ=Cancer, ราศีสิงห์=Leo, ราศีกันยา=Virgo, ราศีตุลย์=Libra, ราศีพิจิก=Scorpio, ราศีธนู=Sagittarius, ราศีมังกร=Capricorn, ราศีกุมภ์=Aquarius, ราศีมีน=Pisces

รูปแบบผลลัพธ์ — MARKDOWN สะอาด (6 ส่วน):

${HT_RP.overview}
[Write 1-2 sentences...]

${HT_RP.week1}
${HT_RP.circuit}วันที่ X
[Write 150-200 words in Thai...]

${HT_RP.week2}
${HT_RP.circuit}วันที่ X
[Write 150-200 words in Thai...]

${HT_RP.week3}
${HT_RP.circuit}วันที่ X
[Write 150-200 words in Thai...]

${HT_RP.week4}
${HT_RP.circuit}วันที่ X
[Write 150-200 words in Thai...]

${HT_RP.trap}
[Write 100-150 words in Thai... specific dollar amount trigger...]
`,
      vi: `HƯỚNG DẪN CHO NGƯỜI DÙNG:
${planetBlockWithWarning}

🛠️ [P1 DỮ LIỆU HÀNH TINH 12 THÁNG — SAO CHÉP CHÍNH XÁC, TUYỆT ĐỐI KHÔNG TÍNH TOÁN]:
${monthlyDataBlockMoon}

QUY TẮC THIÊN VĂN:
• Tất cả vị trí hành tinh từ Swiss Ephemeris — tuân thủ CHÍNH XÁC
• Không dùng thuật ngữ góc chiếu (trine/square/sextile) — dùng mô tả năng lượng
• Sao Thủy nghịch hành trong Cự Giải khoảng 8-25/7; Sao Kim vào Xử Nữ 14/7; Mặt Trời vào Sư Tử 23/7
• Mặt Trăng không bao giờ nghịch hành

ĐỊNH DẠNG ĐẦU RA — MARKDOWN SẠCH (6 phần):

${HT_RP.overview}
[Write 1-2 sentences...]

${HT_RP.week1}
${HT_RP.circuit}Ngày X
[Write 150-200 words in Vietnamese...]

${HT_RP.week2}
${HT_RP.circuit}Ngày X
[Write 150-200 words in Vietnamese...]

${HT_RP.week3}
${HT_RP.circuit}Ngày X
[Write 150-200 words in Vietnamese...]

${HT_RP.week4}
${HT_RP.circuit}Ngày X
[Write 150-200 words in Vietnamese...]

${HT_RP.trap}
[Write 100-150 words in Vietnamese... specific dollar amount trigger...]
`,
    };

    return {
      system: monthlySystem,
      user: (USER_TEMPLATE[lang] || USER_TEMPLATE.zh).split('{{risk_limit}}').join(_riskLimit).split('{{cooldown_hours}}').join(_cooldownH),
    };
  }

    jupHouse = 2;
    if (!satHouse || satHouse === 0) satHouse = 10;
    if (!plHouse || plHouse === 0) plHouse = 8;
    if (!sunHouse || sunHouse === 0) sunHouse = 1;
    if (!moonHouse || moonHouse === 0) moonHouse = 2;

    const DATA_CONSUMPTION_RULE_ZH = `
[数据消费铁律 - 必须遵守]
1. 你的唯一数据来源是后端 JSON 中的 quarterly_forecast。禁止自行计算天文数据。
2. 本月太阳星座和宫位必须100%从上方 [P1 PER-MONTH PLANET DATA] 里 [当前月] 行的 Sun= 值提取（例如 9月行: Sun=Vir(H9) = 处女座第9宫）。⚠️ 绝对禁止用本命太阳星座 natalSunSign（那是固定的本命盘，不是本月行运）；即使与用户本命星座冲突，也必须严格使用 P1 数据里 [当前月] 行的 Sun= 值。
3. active_aspects 中的每个相位必须严格按公式叙述,禁止编造未列出的相位。
4. financial_black_swan 包含精确日期和行动指南——必须原样翻译为叙述性散文。
`;
    const DATA_CONSUMPTION_RULE_EN = `
[Data Consumption Supreme Guideline - MUST OBEY]
1. Your SOLE data source is the quarterly_forecast JSON from the backend. NO astronomical calculation or sign derivation is permitted.
2. The current month's Sun sign and House MUST be extracted 100% from the [当前月] row's Sun= value in [P1 PER-MONTH PLANET DATA] above (e.g. September row: Sun=Vir(H9) = Virgo House 9).⚠️ NEVER use the natal Sun sign natalSunSign (that is the fixed natal chart, NOT this month's transit); always use the Sun= value from the [current month] row in P1 data, even if it conflicts with the user's natal sign.
3. Each aspect in active_aspects MUST be narrated using the given formula only. Never invent unlisted planetary aspects.
4. financial_black_swan contains exact dates and action guidelines - translate verbatim into narrative prose.
`;
    const DATA_CONSUMPTION_RULE_TH = `
[กฎบริโภคข้อมูลสูงสุด - ต้องปฏิบัติตาม]
1. แหล่งข้อมูลเดียวของคุณคือ JSON จาก backend ห้ามคํานวณดาราศาสตร์ด้วยตัวเอง
2. เมื่อเขียนรายเดือน ดวงอาทิตย์และบ้านต้องมาจาก JSON เท่านั้น
3. ดาวเคราะห์ใน active_aspects ต้องใช้สูตรที่ให้มาเท่านั้น ห้ามแต่งเพิ่ม
4. financial_black_swan มีวันที่และคําแนะนําต้องแปลตรงตามที่ให้มา
`;
    const DATA_CONSUMPTION_RULE_VI = `
[Quy Tắc Tiêu Thụ Dữ Liệu Tối Cao - PHẢI TUÂN THỦ]
1. Nguồn dữ liệu duy nhất của bạn là JSON từ backend. Cấm tính toán thiên văn.
2. Khi viết báo cáo hàng tháng, Mặt Trời và Cung phải từ JSON. Tuyệt đối không suy luận riêng.
3. Mỗi góc chiếu trong active_aspects phải theo công thức đã cho, cấm bịa đặt.
4. financial_black_swan có ngày và hướng dẫn phải viết y nguyên.
`;
    const DATA_CONSUMPTION_RULES = {
        zh: DATA_CONSUMPTION_RULE_ZH,
        en: DATA_CONSUMPTION_RULE_EN,
        th: DATA_CONSUMPTION_RULE_TH,
        vi: DATA_CONSUMPTION_RULE_VI,
    };
    const dataRule = DATA_CONSUMPTION_RULES[lang] || DATA_CONSUMPTION_RULE_EN;

    // 简单重建 yearlySystem(只保留系统叙事prompt + 数据消费铁律)
    let yearlySystem = (YEARLY_SYSTEM[lang] || YEARLY_SYSTEM.zh) + '\n' + dataRule;

    // 🛠️ V472-th-depth: 泰语年报篇幅强化 — 24.5K 字符约为其他语言一半, $29.99 尊享感需对齐
    if (lang === 'th') {
      yearlySystem += `\n\n⛔ [ความลึกของเนื้อหา - ขยายความบังคับ V472] รายงานนี้คือผลิตภัณฑ์พรีเมียมระดับสูง ห้ามสรุปสั้น:
• แต่ละเดือนใน 12 เดือน ต้องขยายความอย่างน้อย 3-4 ย่อหน้า: บริบทดาวเคราะห์ → ผลต่อการเงิน → กลยุทธ์ที่ควรลงมือ
• แต่ละบท (Chương/บทที่) ต้องยาวและลึกเทียบเท่าภาษาอังกฤษ — ห้ามย่อเหลือเพียงบุลเลต
• เจาะลึกความหมายจิตวิทยาย่องรู้ (Jung) ประกอบทุกตำแหน่งดาวเคราะห์ที่กล่าวถึง
• เป้าหมายความยาวรวม: รายละเอียดเทียบเท่ารายงานภาษาอังกฤษ (${6000}-8000 คำ)`;
    }

    // ── V97at: 注入 [ASPECTS_DATA] 块 ──
    // ── V97at: 注入 [ASPECTS_DATA] 块 ──
    if (aspectsData) {
      yearlySystem = aspectsData + '\n' + yearlySystem;
      console.log('[V97at] ASPECTS_DATA injected with real SwissEph aspects');
    }

    // ── V97 TDZ FIX: placeholder replacement REMOVED from here (was in TDZ zone) ──
    // ── it is re-inserted AFTER variable assignment (see below, before V89) ──

    // ── V69 SwissEph Override: Replace hardcoded FACT_SHEET with computed truth ──
    if (v69FactSheet) {
      const FACT_START = yearlySystem.indexOf('[2026-2027 ASTRONOMY FACT SHEET');
      const FACT_END = yearlySystem.indexOf('Sun in Leo = 2nd House (solar return year)');
      if (FACT_START !== -1 && FACT_END !== -1) {
        const factSheetBlock = yearlySystem.slice(FACT_START, FACT_END + 'Sun in Leo = 2nd House (solar return year)'.length);
        // Replace the entire block with V69 truth
        yearlySystem = yearlySystem.replace(
          factSheetBlock,
          v69FactSheet + '\n\n[NOTE: Above is V69 SwissEph computed. This takes precedence over any conflicting hardcoded data.]'
        );
        console.log('[V69] FACT_SHEET injected, V69 data overrides hardcoded facts');
      }
    }

    // ── 🛠️ V80 FIX: Thai/Vietnamese 动态宫位替换 ──
    // 删除旧硬编码 house mapping(ASC=Cancer),注入 AstroMatrix 真值
    if ((lang === 'th' || lang === 'vi') && astroMatrix && astroMatrix.months && astroMatrix.months[0]) {
      const first = astroMatrix.months[0];
      const rising = astroMatrix.meta?.rising_sign || 'Cancer';
      // V96 FIX: 所有 fallback 改为 1(未知),强制 AI 从 monthly data 读取正确值
      // 旧 fallback(暴露错误值):jupHouse=2, satHouse=10, plHouse=8
      // 🛠️ V100o FIX: AstroMatrix house 可能是嵌套对象,递归提取数值
      const getHouse = (v) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'object' && v !== null) return v.house ?? v.natal_house ?? v[0] ?? 1;
        return 1;
      };
      const jupHouse = getHouse(first.jupiter?.house);
      const satHouse = getHouse(first.saturn?.house);
      const plHouse = getHouse(first.pluto?.house);
      const sunHouse = getHouse(_sunOf(first).house);
      const moonHouse = getHouse(first.moon?.house);

      // P1.2 Fixed Lexicon: 从 lexicon.js 读取泰语/越南语星座和宫位
      const TH_SIGN = LEXICON.th.signs;
      // 🛡️ 军师修正:泰文宫位用 ภพ(梵文 bhava)而非 เรือน
      const TH_HOUSE = {}; for (let i=1;i<=12;i++) TH_HOUSE[i] = 'ภพที่ ' + i;
      const VI_SIGN = LEXICON.vi.signs;

      const signMap = lang === 'th' ? TH_SIGN : VI_SIGN;
      const jupSignTH = signMap[first.jupiter?.sign] || first.jupiter?.sign || 'Leo';
      const satSignTH = signMap[first.saturn?.sign] || first.saturn?.sign || 'Aries';

      if (lang === 'th') {
        // 1 替换 ASTRO RULES 里的硬编码 ASC=Cancer house mapping
        const OLD_HOUSE_RULES = 'ระบบเรือน 12 หลังสําหรับ ASC=ราศีกรกฎ: เรือนที่ 1=กรกฎ, 9=มีน, 10=เมษ, 11=พฤษภ, 12=มิถุน. ดวงอาทิตย์ในราศีมีน = เรือนที่ 9 ไม่ใช่ 1 หรือ 12!';
        const NEW_HOUSE_RULES = `ระบบเรือน 12 หลังสําหรับ ASC=${signMap[rising] || rising} (Equal House คํานวณจากวันเกิดจริง): ดาวพฤหัสบดีในราศี${jupSignTH} = ${TH_HOUSE[jupHouse]}, ดาวเสาร์ในราศี${satSignTH} = ${TH_HOUSE[satHouse]}, ดาวพลูโตในราศีกุมภ์ = ${TH_HOUSE[plHouse]}, ดวงอาทิตย์ = ${TH_HOUSE[sunHouse]}. ห้ามใช้ house mapping อื่นเด็ดขาด!`;
        yearlySystem = yearlySystem.replace(OLD_HOUSE_RULES, NEW_HOUSE_RULES);

        // 2 替换 FORMAT_SPEC 里的硬编码宫位描述
        yearlySystem = yearlySystem.replace(
          /ดาวพฤหัสบดีในราศีสิงห์ทุก 12 ปี เปิดเรือนชะตาที่ 2/g,
          `ดาวพฤหัสบดีในราศี${jupSignTH} เปิด${TH_HOUSE[jupHouse]}ทุก 12 ปี`
        );
        yearlySystem = yearlySystem.replace(
          /ดาวเสาร์ในราศีเมษตรวจสอบเรือนชะตาที่ 11/g,
          `ดาวเสาร์ในราศี${satSignTH}ตรวจสอบ${TH_HOUSE[satHouse]}`
        );
        console.log(`[V80] Thai house context injected: Jup=${jupHouse} House(${jupSignTH}), Sat=${satHouse} House(${satSignTH}), Rising=${rising}`);
      } else if (lang === 'vi') {
        // ── 🛠️ V81 FIX: 替换越南文 ASTRO RULES(P1.2: 从 lexicon 读取)──
        const VI_HOUSE = {}; for (let i=1;i<=12;i++) VI_HOUSE[i] = 'Nhà ' + i;
        const VI_SIGNS = LEXICON.vi.signs;
        const risingVI = VI_SIGNS[rising] || rising;
        const jupSignVI = VI_SIGNS[first.jupiter?.sign] || first.jupiter?.sign || 'Leo';
        const satSignVI = VI_SIGNS[first.saturn?.sign] || first.saturn?.sign || 'Aries';
        const OLD_VI_HOUSE = 'BẢN ĐỒ 12 NHÀ cho ASC=Cự Giải: 1=Cự Giải/9=Sông Ngư/10=Bạch Dương/11=Kim Ngưu/12=Song Tử. Mặt Trời tại Sông Ngư = Nhà 9, KHÔNG PHẢI Nhà 1 hay 12!';
        const NEW_VI_HOUSE = `BẢN ĐỒ 12 NHÀ cho ASC=${risingVI} (Equal House tính từ ngày sinh): Sao Mộc tại ${jupSignVI} = ${VI_HOUSE[jupHouse]}, Sao Thổ tại ${satSignVI} = ${VI_HOUSE[satHouse]}, Sao Diêm Vương tại Bảo Bình = ${VI_HOUSE[plHouse]}, Mặt Trời = ${VI_HOUSE[sunHouse]}. TUYỆT ĐỐI KHÔNG dùng Bản Đồ Whole Sign khác!`;
        yearlySystem = yearlySystem.replace(OLD_VI_HOUSE, NEW_VI_HOUSE);
        console.log(`[V81] Vietnamese house context injected: Jup=${jupHouse}(${jupSignVI}), Sat=${satHouse}(${satSignVI}), Rising=${risingVI}`);
      }


    }

    // ── 🛠️ V91: 把 if 块内声明的常量提升到外层 let,供 V89 HEADER_ENFORCE 访问 ──
    // ⚠️ V126-fix: natalSunSign/risingLocal/jupSign 等已在外层(let monthly level)声明
    //    年报块不再重声明,只做赋值
    natalSunSign = natalSunFallback;
    natalSunSignEN = natalSunENFallback;
    risingLocal = 'Cancer'; // 年报默认上升,无出生时间时用 Cancer
    jupSignLocal = 'Leo'; satSignLocal = 'Aries'; moonSignLocal = 'Cancer';
    natalMoonSign = 'Cancer'; natalMoonSignEN = 'Cancer';
    jupHouse = 2; satHouse = 10; plHouse = 8; sunHouse = 1; moonHouse = 2;

    if (astroMatrix && astroMatrix.months && astroMatrix.months[0]) {
      const first = astroMatrix.months[0];
      const rising = astroMatrix.meta?.rising_sign || 'Cancer';
      const getH2 = (v) => typeof v === 'number' ? v : (v?.house ?? v?.natal_house ?? v?.[0] ?? 1);
      jupHouse = getH2(first.jupiter?.house);
      satHouse = getH2(first.saturn?.house);
      plHouse = getH2(first.pluto?.house);
      sunHouse = getH2(_sunOf(first).house);
      moonHouse = getH2(first.moon?.house);
      jupSign = first.jupiter?.sign || 'Leo';
      satSign = first.saturn?.sign || 'Aries';

      // 🛠️ V83: 计算 natal Sun Sign(不依赖 transit month)
      const natalSunIdx = getNatalSunSign(birthDate);
      const natalSunMap = {
        en: SUN_SIGN_EN[natalSunIdx], vi: SUN_SIGN_VI[natalSunIdx], th: SUN_SIGN_TH[natalSunIdx],
        zh: SUN_SIGN_ZH[natalSunIdx], es: SUN_SIGN_ES[natalSunIdx], fr: SUN_SIGN_FR[natalSunIdx]
      };
      natalSunSign = natalSunMap[lang] || SUN_SIGN_EN[natalSunIdx];
      natalSunSignEN = SUN_SIGN_EN[natalSunIdx];
      const plSignEN = 'Aquarius';

      // P1.2 Fixed Lexicon: 从 lexicon.js 读取 6 语言星座名
      // 🛠️ V100g: LEXICON[lang].signs 返回 SIGNS 对象(12个星座),不是语言名
      const SIGNS_TABLE = LEXICON[lang]?.signs || LEXICON.en.signs;
      // SIGNS[signKey][lang] 返回该语言名
      const signName = (signKey, fallback) => {
        const entry = SIGNS_TABLE[signKey];
        if (entry && typeof entry === 'object' && entry[lang]) return entry[lang];
        return entry && entry.en ? entry.en : (signKey || fallback);
      };
      risingLocal = signName(rising, 'Cancer');
      jupSignLocal = signName(jupSign, 'Leo');
      satSignLocal = signName(satSign, 'Aries');
      moonSignLocal = signName(first.moon?.sign, 'Cancer');
      // 🛠️ V102s: 本命月亮从 SwissEph 取真值(报头用),非流月月亮
      // 🛠️ V420 键名修正(军令 P0): astroMatrix 真实键是 meta.natal_moon(次选 meta.computed_houses.Moon)。
      //   旧代码写 astroMatrix.natal_planets?.Moon?.sign —— 该键根本不存在 → undefined
      //   → optional chaining 静默回落到 first.moon(流月月亮) → 报头本命月亮逐月漂移、纯随机。
      //   此处彻底斩断「流月冒充本命」的后路: 取不到真值就留空(下游 if 守卫会省略), 绝不编。
      const natalMoonEN = astroMatrix?.meta?.natal_moon?.sign
        || astroMatrix?.natal_moon?.sign
        || astroMatrix?.meta?.computed_houses?.Moon?.sign
        || '';
      natalMoonSignEN = natalMoonEN;
      natalMoonSign = signName(natalMoonEN, natalMoonEN);

      // ── V158: 动态上升宫位映射表(根治 LLM 用硬编码白羊映射/自行推算宫位)──
      const _hm = getSignToHouseMap(risingLocal);
      const _SIGNS_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
      const _houseLabelMap = { zh:(n)=>`第${n}宫`, en:(n)=>`House ${n}`, es:(n)=>`Casa ${n}`, fr:(n)=>`Maison ${n}`, th:(n)=>`ภพที่ ${n}`, vi:(n)=>`Nhà ${n}` };
      const _houseLabel = _houseLabelMap[lang] || _houseLabelMap.zh;
      const _sep = lang === 'zh' ? '、' : ', ';
      const _houseRef = _hm ? _SIGNS_EN.map((enSign, i) => `${signName(enSign, SIGN_ORDER_ZH[i])}=${_houseLabel(_hm[i])}`).join(_sep) : '';

      // 🌐 6语言 STRICT HOUSE LOCK 模板
      const locks = {
        vi: `⛔ [QUY TẮC CUNG ĐỊA BÀN BẮT BUỘC] - Dữ liệu từ AstroMatrix + computed_houses.json ⛔

⛔ BẮT BUỘC: Khi viết về nhà của Sao Mộc/Sao Thổ/Sao Diêm Vương, BẮT BUỘC phải dùng số nhà từ khối JSON [COMPUTED_HOUSES] trong FACT SHEET. Không viết 'Nhà 5' cho Sư Tử trừ khi [COMPUTED_HOUSES] nói vậy.
\n\n📛 THÔNG TIN BẢN NGÃ (CẤM DÙNG DỮ LIỆU NGƯỜI KHÁC):\n• Mặt Trời = ${natalSunSign} (SUN SIGN CỦA NGƯỜI DÙNG NÀY, ngày sinh ${birthDate})\n• Mọi câu 'Hỡi người con của X' phải dùng ${natalSunSign} - KHÔNG ĐƯỢC dùng cung khác\n\n📍 Dựa trên Ascendant = __RISING_LOCAL__ (Equal House tính từ ngày sinh), các hành tinh BẮT BUỘC phải viết đúng cung sau:\n• Sao Mộc tại ${jupSignLocal} = Nhà ${jupHouse}\n• Sao Thổ tại ${satSignLocal} = Nhà ${satHouse}\n• Sao Diêm Vương tại Bảo Bình = Nhà ${plHouse}\n• Mặt Trời = Nhà ${sunHouse}\n• Mặt Trăng = Nhà ${moonHouse}\n\n⛔ CẤM TUYỆT ĐỐI:\n- Tự suy luận cung từ chòm sao (PHẢI dùng dữ liệu trên)\n- Dùng Bản Đồ Whole Sign - SAI\n- Viết Sao Mộc = Nhà 5 (phải là Nhà ${jupHouse})\n- Viết Sao Thổ = Nhà 11 (phải là Nhà ${satHouse})\n- Viết Sao Diêm Vương = Nhà 3 hoặc Nhà 11 (phải là Nhà ${plHouse})\n- Viết 'Mặt Trời Song Tử' nếu người dùng sinh tháng 10 (PHẢI là ${natalSunSign})`,
        th: `⛔ [กฎเหล็กเรือนดาราศาสตร์] - ข้อมูลจาก AstroMatrix + computed_houses.json ⛔

⛔ บังคับ: เมื่อเขียนเรือนของดาวพฤหัสบดี/ดาวเสาร์/ดาวพลูโต ต้องใช้หมายเลขเรือนจากบล็อก JSON [COMPUTED_HOUSES] ใน FACT SHEET ข้างบน ห้ามเขียน 'เรือนที่ 5' สําหรับราศีสิงห์ หาก [COMPUTED_HOUSES] ไม่ได้บอก!
\n\n📛 ข้อมูลส่วนตัว (ห้ามใช้ข้อมูลผู้ใช้อื่น):\n• ดวงอาทิตย์ = ${natalSunSign} (ดวงอาทิตย์ของผู้ใช้นี้, เกิดวันที่ ${birthDate})\n• ทุกข้อความ 'โอ้บุตรแห่งราศี X' ต้องใช้ ${natalSunSign} - ห้ามใช้ราศีอื่น\n\n📍 อ้างอิง Ascendant = __RISING_LOCAL__ (Equal House คํานวณจากวันเกิดจริง), ดาวเหล่านี้ต้องเขียนเรือนให้ถูกต้อง:\n• ดาวพฤหัสบดีที่ ${jupSignLocal} = ภพที่ ${jupHouse}\n• ดาวเสาร์ที่ ${satSignLocal} = ภพที่ ${satHouse}\n• ดาวพลูโตที่ กุมภ์ = ภพที่ ${plHouse}\n• ดวงอาทิตย์ = ภพที่ ${sunHouse}\n• ดวงจันทร์ = ภพที่ ${moonHouse}\n\n⛔ ห้ามเด็ดขาด:\n- อนุมานเรือนจากราศี (ต้องใช้ข้อมูลข้างบน)\n- ใช้แผนที่ Whole Sign\n- เขียนภพที่ผิด\n- เขียน 'ดวงอาทิตย์ราศีเมถุน' ให้ผู้ใช้ที่เกิดเดือนตุลาคม (ต้องเป็น ${natalSunSign})`,
        zh: `⛔ [宫位铁律] - 数据来自 AstroMatrix ⛔\n\n📛 个人信息强制(禁止用别人数据):\n• 太阳 = ${natalSunSign} (本用户的太阳星座, 生日 ${birthDate})\n• 所有 'X座之人' 必须用 ${natalSunSign} - 不得用其他星座\n\n📍 基于上升星座 = __RISING_LOCAL__ (Equal House 从生日计算), 行星必须使用以下精确宫位:\n• 木星在 ${jupSignLocal} = 第 ${jupHouse} 宫\n• 土星在 ${satSignLocal} = 第 ${satHouse} 宫\n• 冥王星在水瓶座 = 第 ${plHouse} 宫\n• 太阳 = 第 ${sunHouse} 宫\n• 月亮 = 第 ${moonHouse} 宫\n\n⚠️ 强制引用规则:全文所有涉及木星/土星/冥王星/太阳的宫位描写,必须引用 [COMPUTED_HOUSES] JSON 块里的精确 house 数值!\n  禁止:看到"狮子座"就写第5宫、看到"白羊座"就写第1宫、看到"水瓶座"就写第11宫。\n  正确:以 [COMPUTED_HOUSES] JSON 里的 computed_house 数值为准。\n\n⛔ 严禁:\n- 从星座推算宫位(必须用上面数据)\n- 使用 Whole Sign 全星座制\n- 写错宫位\n- 写'太阳在双子座'给10月生日的用户(必须用 ${natalSunSign})`,
        en: `⛔ [HOUSE MAPPING IRON RULE] - Data from AstroMatrix ␦ STRICTLY VERIFIED ␦\n\n📛 PERSONAL IDENTITY (do NOT use other users' data):\n• Sun = ${natalSunSignEN} (this user's Sun Sign, birth date ${birthDate})\n• All 'O child of X' must use ${natalSunSignEN} - NOT other signs\n\n📍 Based on Ascendant = __RISING_LOCAL__ (Equal House from birth date), planets MUST use these exact houses:\n• Jupiter in ${jupSignLocal} = House ${jupHouse}\n• Saturn in ${satSignLocal} = House ${satHouse}\n• Pluto in Aquarius = House ${plHouse}\n• Sun = House ${sunHouse}\n• Moon = House ${moonHouse}\n\n⛔ STRICTLY FORBIDDEN:\n- Inferring houses from signs (USE THE DATA ABOVE)\n- Using Whole Sign house system\n- Writing Jupiter = House 5 (must be House ${jupHouse})\n- Writing Saturn = House 11 (must be House ${satHouse})\n- Writing 'Sun in Gemini' for an October-born user (MUST be ${natalSunSignEN})`,
        es: `⛔ [REGLA DE HIERRO DE CASAS] - Datos de AstroMatrix + computed_houses.json ⛔

⛔ OBLIGATORIO: Al escribir sobre las casas de Júpiter/Saturno/Plutón, DEBES usar el número de casa del bloque JSON [COMPUTED_HOUSES] en la FACT SHEET. No escribir 'Casa 5' para Leo sin que [COMPUTED_HOUSES] lo indique.
\n\n📛 IDENTIDAD PERSONAL (no usar datos de otros usuarios):\n• Sol = ${natalSunSign} (el Sol de ESTE usuario, fecha de nacimiento ${birthDate})\n• Todo 'Oh hijo de X' debe usar ${natalSunSign} - NO otros signos\n\n📍 Basado en Ascendente = __RISING_LOCAL__ (Equal House desde fecha de nacimiento), los planetas DEBEN usar estas casas exactas:\n• Júpiter en ${jupSignLocal} = Casa ${jupHouse}\n• Saturno en ${satSignLocal} = Casa ${satHouse}\n• Plutón en Acuario = Casa ${plHouse}\n• Sol = Casa ${sunHouse}\n• Luna = Casa ${moonHouse}\n\n⛔ ESTRICTAMENTE PROHIBIDO:\n- Inferir casas desde signos (usar datos arriba)\n- Usar sistema Whole Sign\n- Escribir Júpiter = Casa 5 (debe ser Casa ${jupHouse})\n- Escribir 'Sol en Géminis' para usuarios nacidos en octubre (DEBE ser ${natalSunSign})`,
        fr: `⛔ [RÈGLE DE FER DES MAISONS] - Données d'AstroMatrix + computed_houses.json ⛔

⛔ OBLIGATOIRE: En écrivant sur les maisons de Jupiter/Saturne/Pluton, vous DEVEZ utiliser le numéro de maison du bloc JSON [COMPUTED_HOUSES] dans la FACT SHEET. Ne pas écrire 'Maison 5' pour Léo sans que [COMPUTED_HOUSES] l'indique.
\n\nBasé sur Ascendant = __RISING_LOCAL__ (Equal House depuis date de naissance), les planètes DOIVENT utiliser ces maisons exactes:\n• Jupiter en ${jupSignLocal} = Maison ${jupHouse}\n• Saturne en ${satSignLocal} = Maison ${satHouse}\n• Pluton en Verseau = Maison ${plHouse}\n• Soleil = Maison ${sunHouse}\n• Lune = Maison ${moonHouse}\n\n⛔ STRICTEMENT INTERDIT:\n- Inférer les maisons depuis les signes\n- Utiliser le système Whole Sign\n- Écrire Jupiter = Maison 5 (doit être Maison ${jupHouse})`
      };
      houseLock = locks[lang] || locks.en;
      // ── V158: 注入动态上升宫位映射表(根治 LLM 自行推算/硬编码白羊映射)──
      if (_houseRef) {
        houseLock += `\n\n📍 本命上升 = ${risingLocal} 的等宫制完整映射(流年行星落入某星座,其宫位必须按此表查,禁止自行推算):\n${_houseRef}`;
      }
      console.log(`[V82] houseLock built for ${lang}: Jup=${jupHouse}, Sat=${satHouse}, Pluto=${plHouse}, Sun=${sunHouse}, Rising=${risingLocal}`);
    }

    // V97ac: V69 Python引擎失败时(astroMatrix=null),risingLocal为空 → fallback为太阳星座
    if (!risingLocal) {
      const SUN_ZH_FB = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
      const sunIdx = getNatalSunSign(birthDate);
      risingLocal = SUN_ZH_FB[sunIdx] || '天蝎座';
      console.warn(`[V97ac] V69 failed, risingLocal fallback → ${risingLocal}`);
    }

    // ── V97 TDZ FIX: placeholder replacement (runs AFTER all vars assigned, safe) ──
    yearlySystem = yearlySystem
      .replace(/__RISING_LOCAL__/g, risingLocal)
      .replace(/__JUP_HOUSE__/g, String(jupHouse))
      .replace(/__SAT_HOUSE__/g, String(satHouse))
      .replace(/__PL_HOUSE__/g, String(plHouse))
      .replace(/__SUN_HOUSE__/g, String(sunHouse))
      .replace(/__MOON_HOUSE__/g, String(moonHouse))
      .replace(/__NATAL_SUN__/g, natalSunSign)
      .replace(/__JUP_SIGN_LOCAL__/g, jupSignLocal)
      .replace(/__SAT_SIGN_LOCAL__/g, satSignLocal)
      .replace(/__MOON_SIGN_LOCAL__/g, moonSignLocal)
      .replace(/__NATAL_SUN_EN__/g, natalSunSignEN)
      .replace(/__NATAL_SUN__/g, natalSunSign)
      .replace(/__SUN_HOUSE_NUM__/g, String(sunHouse))
      .replace(/__LOCKED_TITLES_BLOCK__/g, lockedTitles);
    if (!lockedTitles) {
      console.warn('[V97x] lockedTitles empty - astroMatrix.months missing, AI may hallucinate month titles');
    } else {
      console.log('[V97x] lockedTitles injected, 12 titles locked');
    }

    // ⛔ V89: 注入强制头部模板到 system prompt(system > user 层级更高)
    // ── V97h: 本命太阳星座头部锁(全语言,治本:zh/en/es/fr/th/vi 均强制锁死本命太阳,防止 AI 幻觉改写头部元数据)──
    // 🛠️ V102s: 核心本命代码硬锁(太阳+月亮 SwissEph 算死;无出生时间→砍上升,杜绝编造)
    _mZH = natalMoonSign ? ` · 月亮${natalMoonSign}` : '';
    _mEN = natalMoonSignEN ? ` · Moon ${natalMoonSignEN}` : '';
    _mES = natalMoonSign ? ` · Luna ${natalMoonSign}` : '';
    _mFR = natalMoonSign ? ` · Lune ${natalMoonSign}` : '';
    _mTH = natalMoonSign ? ` · ดวงจันทร์${natalMoonSign}` : '';
    _mVI = natalMoonSign ? ` · Mặt Trăng ${natalMoonSign}` : '';
    const _rHB = hasBirthTime && risingLocal;
    const NATAL_CODE = {
      zh: `太阳${natalSunSign}${_mZH}${_rHB?` · 上升${risingLocal}`:''}`,
      en: `Sun ${natalSunSignEN}${_mEN}${_rHB?` · Rising ${risingLocal}`:''}`,
      es: `Sol ${natalSunSign}${_mES}${_rHB?` · Ascendente ${risingLocal}`:''}`,
      fr: `Soleil ${natalSunSign}${_mFR}${_rHB?` · Ascendant ${risingLocal}`:''}`,
      th: `ดวงอาทิตย์${natalSunSign}${_mTH}${_rHB?` · ราศีขึ้น${risingLocal}`:''}`,
      vi: `Mặt Trời ${natalSunSign}${_mVI}${_rHB?` · Cung Mọc ${risingLocal}`:''}`,
    };
    const NO_RISING = {
      zh: hasBirthTime ? '' : '\n⛔ 未提供出生时间:绝对禁止在头部或全文声称任何"上升星座/Ascendant"。核心本命代码只写太阳与月亮,不得追加上升字段。',
      en: hasBirthTime ? '' : '\n⛔ Birth time NOT provided: NEVER state any "Rising/Ascendant" sign anywhere. Core Natal Code contains ONLY Sun and Moon - do NOT append a Rising field.',
      es: hasBirthTime ? '' : '\n⛔ Sin hora de nacimiento: NUNCA indiques un "Ascendente". El Código Natal solo lleva Sol y Luna.',
      fr: hasBirthTime ? '' : '\n⛔ Heure de naissance absente : NE JAMAIS indiquer un "Ascendant". Le Code Natal ne contient que Soleil et Lune.',
      th: hasBirthTime ? '' : '\n⛔ ไม่มีเวลาเกิด: ห้ามระบุ "ราศีขึ้น/Ascendant" เด็ดขาด รหัสดวงชะตาแกนกลางมีแค่ดวงอาทิตย์และดวงจันทร์.',
      vi: hasBirthTime ? '' : '\n⛔ Không có giờ sinh: TUYỆT ĐỐI không nêu "Cung Mọc/Ascendant". Mã Bản Đồ Sao chỉ gồm Mặt Trời và Mặt Trăng.',
    };
    // 🛠️ V126-fix: natalSunENFallback 已移到月报块前面,此处不再重复声明
    const HE_MAP = {
      zh: `\n\n⛔ [强制头部值 - 不得更改,原样抄录]:\n本用户的本命太阳星座是 ${natalSunFallback}(由出生日期 ${birthDate} 经天文计算确定,绝对正确)。\n你的输出头部【元数据】必须精确使用:\n🌌 年度星盘: ${natalSunFallback} · 太阳回归年\n🗝️ 核心本命代码: ${NATAL_CODE.zh}\n所有 'X座之人' 必须用 ${natalSunFallback},绝对不得输出其他星座。${NO_RISING.zh}\n若头部元数据出现错误的太阳/月亮星座,生成将被拒绝!`,
      en: `\n\n⛔ [MANDATORY HEADER - DO NOT CHANGE, COPY VERBATIM]:\nThe user's Natal Sun Sign is ${natalSunENFallback} (Swiss Ephemeris, birth date ${birthDate}).\nYOUR HEADER MUST use exactly:\n🌌 Annual Solar Chart: ${natalSunENFallback} · Solar Return\n🗝️ Core Natal Code: ${NATAL_CODE.en}\nAll 'O child of X' MUST use ${natalSunENFallback} - NEVER other signs.${NO_RISING.en}\nIf the header contains a WRONG Sun/Moon Sign, generation will be REJECTED!`,
      es: `\n\n⛔ [CABECERA OBLIGATORIA - NO CAMBIAR, COPIAR VERBATIM]:\nEl Signo Solar Natal del usuario es ${natalSunFallback} (Efemérides Suizas, fecha ${birthDate}).\nTU CABECERA DEBE usar exactamente:\n🌌 Carta Solar Anual: ${natalSunFallback} · Retorno Solar\n🗝️ Código Natal Central: ${NATAL_CODE.es}\nTodo 'Hijo de X' DEBE usar ${natalSunFallback} - NUNCA otros signos.${NO_RISING.es}\nSi la cabecera contiene un Signo ERRÓNEO, la generación será RECHAZADA!`,
      fr: `\n\n⛔ [EN-TÊTE OBLIGATOIRE - NE PAS CHANGER, COPIER VERBATIM]:\nLe Signe Solaire Natal de l'utilisateur est ${natalSunFallback} (Éphémérides Suisses, date ${birthDate}).\nTON EN-TÊTE DOIT utiliser exactement:\n🌌 Thème Solaire Annuel: ${natalSunFallback} · Retour Solaire\n🗝️ Code Natal Central: ${NATAL_CODE.fr}\nTout 'Enfant de X' DOIT utiliser ${natalSunFallback} - JAMAIS d'autres signes.${NO_RISING.fr}\nSi l'en-tête contient un Signe ERRONÉ, la génération sera REJETÉE!`,
      th: `\n\n⛔ [ส่วนหัวบังคับ - ห้ามเปลี่ยน คัดลอกตรงๆ]:\nดวงอาทิตย์ประจําตัวของผู้ใช้คือ ${natalSunFallback} (Efemerides Suizas, วันเกิด ${birthDate}).\nส่วนหัวของคุณต้องใช้ตรงๆ:\n🌌 เวลาราศีประจําปี: ${natalSunFallback} · การกลับมาของดวงอาทิตย์\n🗝️ รหัสดวงชะตาแกนกลาง: ${NATAL_CODE.th}\nทุกคําว่า 'โอ้บุตรแห่งราศี X' ต้องใช้ ${natalSunFallback} - ห้ามใช้ราศีอื่น.${NO_RISING.th}\nหากส่วนหัวมีราศีผิด การสร้างจะถูกปฏิเสธ!`,
      vi: `\n\n⛔ [MANDATORY HEADER - DO NOT CHANGE, COPY VERBATIM]:\nThe user's Natal Sun Sign is ${natalSunFallback} (Swiss Ephemeris, birth date ${birthDate}).\nYOUR HEADER MUST use exactly:\n🌌 Bảng Vận Niên: ${natalSunFallback} · Năm Cách Mạng Mặt Trời\n🗝️ Mã Bản Đồ Sao Chính: ${NATAL_CODE.vi}\nAll 'O child of X' MUST use ${natalSunFallback} - NEVER other signs.${NO_RISING.vi}\nIf header contains wrong Sun/Moon Sign, generation will be REJECTED!`,
    };
    yearlySystem += (HE_MAP[lang] || HE_MAP.en);

    // 🛡️ V483: 火星 Transit 硬编码事实表**只对 FY2026(2026-07 ~ 2027-06) 成立**。
    //   病根: 原表写死在 Prompt 里、不随财年变化 —— 一旦财年滚动到 2027-07 起，
    //   该表就变成「主动编造」的假事实，LLM 会照着写错火星星座。
    //   现按矩阵实际窗口门控: 命中 FY2026 才注入硬表，否则降级为「只准描述相位、禁止写火星星座」。
    const _fw = astroMatrix?.meta?.report_window;
    const _winStartKey = _fw?.start_key || String(astroMatrix?.months?.[0]?.month_key || '');
    const MARS_TRANSIT_RULE = (_winStartKey === '2026-07')
      ? `火星不在 AstroMatrix 固定外行星列表中,但其 2026-2027 年真实 Transit 位置有明确天文学事实,可以写入。具体规则:
- 2026年7月-8月:火星在狮子座(6月21日离开巨蟹进入狮子,9月23日才进处女)
- 2026年11月30日-12月:火星在处女座(9月23日进处女,2027年1月中旬才离)
- 2027年2月-3月:火星在处女座/天秤座(1月中旬进天秤)
- 2027年5月:火星在狮子座(4月中旬进狮子,6月中旬离)
若 Black Swan Day 涉及火星相位,**必须**按上述真实 Transit 位置写,例如:"(火星在狮子座与XX形成XX相位)"。绝对不得写"火星在处女座"给7月/8月的日子,也不得写"火星在XX座"给任何不在上述窗口的日子。`
      : `火星不在 AstroMatrix 固定外行星列表中。本财年(起点 ${_winStartKey || '未知'})没有可用的火星 Transit 硬编码事实表 —— 涉及火星相位时,只描述相位关系本身(如"火星与土星形成刑相位"),**绝对禁止写出火星的任何具体星座或宫位**。`;

    // 🛡️ V483: 窗口标签（Prompt「时间窗口铁律」用；与 FactSheet 同源，杜绝各写各的）
    const _WIN_LABEL = _fw?.label || (() => {
      const _m = astroMatrix?.months || [];
      return `${_m[0]?.month_name || '?'} – ${_m[_m.length - 1]?.month_name || '?'}`;
    })();

    return {
      system: yearlySystem,
      user: `
⛔ [时间窗口铁律 — 财年周期, 不得自行推算]: 本报告的时间轴由服务器锁定为 **${_WIN_LABEL}**（整整 12 个月，当年 7 月至次年 6 月的跨年财年周期）。下方 P1.1 数据块的 12 个月即此窗口，一一对应。绝对禁止根据"当前日期"或"生成当月"自行向后推算 12 个月来改写起止月份；第二章月标题必须严格落在 ${_WIN_LABEL} 区间内，不得出现该区间之外的月份。
⛔ [天文真值铁律]: 只准使用 AstroMatrix 提供的外行星数据(木星/土星/冥王星/太阳/月亮)。未提供的行星(火星/凯龙/北交点等)不得写具体星座或宫位,只能描述原型特质("行动力强"/"开创精神"),禁止"火星在XX座"或"火星在第X宫"。

⛔ [火星/凯龙禁则]: 绝对禁止在年报正文(除 Black Swan Day 断路器警告外)写"火星在XX座"或"火星在第X宫"。

⛔ [Black Swan Day 火星 Transit 规则]: ${MARS_TRANSIT_RULE}
⛔ [缝合怪禁则]: 绝对禁止将两个星座名直接连接(如"处女座金牛座"、"双子座白羊座")。每段只描述一个星座,宫位从 AstroMatrix 的 computed_houses 引用,不得自创。
⛔ [月内宫位一致性]: 同一月内太阳描述必须唯一(如5月=金牛座,不得同时说双子座)。若发现矛盾,以流月数据为准。
⛔ [本命盘 vs Transit 严格区分 - 核心区分规则]:
本报告包含两类本质不同的占星数据:
【本命盘固定数据】由出生日期算死,绝不随月份变化:
  - 太阳星座 = ${natalSunSign}(如:太阳水瓶座)
  - 太阳宫位 = 第${sunHouse}宫(请勿写成"点亮第1宫"或"落在第X宫")
  - 上升星座 = __RISING_LOCAL__
  - 木星 = ${jupSign}座第${jupHouse}宫
  - 土星 = ${satSign}座第${satHouse}宫
  - 冥王星 = 水瓶座第${plHouse}宫
【Transit 流月数据】随月份变化,由 [P1.1 SWISSEPH PER-MONTH TRUTH DATA] 提供:
  - 例:2026年7月Transit太阳 = 巨蟹座;2027年6月Transit太阳 = 双子座
  - Transit数据仅在当月正文内有效,禁止跨月引用
【绝对禁止】:
  1. 将 Transit 月份的太阳星座写成"你的太阳是XX座"(那是本命太阳,已锁死)
  2. 将2月Transit水瓶座写成"本命太阳水瓶座的能量"(本命太阳永远不变)
  3. 在任何月份正文里写"太阳水瓶点亮你的第1宫"(本命太阳在第${sunHouse}宫,不是第1宫)
  4. 将某月的 Transit 星座(如2月水瓶座)的内容复制到其他月份

例如:对于1996-01-23的用户,Transit太阳2月=水瓶座≠本命太阳水瓶在第4宫(不是第1宫)。写2月正文只能说Transit水瓶座,不得写"点亮第1宫"。
- AI MUST output the five chapter headings explicitly using '第X章' (中文) / 'Chapter X' (英文) / 'Chương X' (Tiếng Việt) format:
  • zh: '第一章:年度财富矩阵', '第二章:365天月度收入矩阵', '第三章:命运职业路径', '第四章:债务与风险护盾', '第五章:神谕显化仪式'
  • en: 'Chapter I: Annual Wealth Matrix', 'Chapter II: 365-Day Monthly Income Matrix', 'Chapter III: Destiny Career Path', 'Chapter IV: Debt & Risk Shield', 'Chapter V: Oracle Manifestation Ritual'
  • vi: 'Chương I: Ma Trận Tài Chính Năm', 'Chương II: Ma Trận Thu Nhập Hàng Tháng 365 Ngày', 'Chương III: Con Đường Sự Nghiệp Duyên Kiếp', 'Chương IV: Khiên Nợ và Rủi Ro', 'Chương V: Nghi Thức Hiện Thực Hóa Của Oracle'
  • es/fr/th: 参照语言自身惯例本地化编号前缀 (Capítulo/Chapitre/บทที่) + 本地化标题。
  These headings are REQUIRED - the frontend renders them as gold chapter cards. 绝对禁止写成'第X节'或'Section X'。⛔ 绝对禁止在任何非中文报告里出现中文'第X章'字样 — VI 报告必须用 'Chương I~V' 前缀。
- 🛠️ V472 vi-retrograde: ${lang === 'vi' ? "BẮT BUỘC: Trong phần mô tả 12 tháng, khi dữ liệu [P1 PER-MONTH] đánh dấu retrograde=true cho Sao Thổ/Sao Thủy/Sao Hỏa, bài viết PHẢI nhắc rõ trạng thái 'nghịch hành' (vd. 'Sao Thổ nghịch hành tại Bạch Dương'). Không được bỏ sót toàn bộ các sự kiện nghịch hành." : "Retrograde events must be stated explicitly where P1.1 per-month data marks retrograde=true (e.g. Saturn retrograde)."}

Generate a ${lang} ultra-premium yearly wealth almanac for birth date ${birthDate}.

⛔ [CRITICAL - DO NOT COMPUTE SUN SIGN]: The user's Natal Sun Sign has been pre-computed by Swiss Ephemeris and provided in the [HOUSE MAPPING IRON RULE] section above. The per-month data below is TRANSIT data for the 12 forecast months - NOT natal chart data. DO NOT use transit Sun positions to compute or replace the user's natal Sun Sign. If the Sun Sign is explicitly stated above, USE THAT VALUE. In output, include the header 'Bảng Vận Niên: {natalSunSign} · Năm Cách Mạng Mặt Trời' and 'Mã Bản Đồ Sao Chính: Mặt Trời {natalSunSign}' using the exact natalSunSign value, NOT computed from transit data.

[P1.1 SWISSEPH PER-MONTH TRUTH DATA - DO NOT ALTER]:
All planet positions, houses, and aspects below are COMPUTED by Swiss Ephemeris.
Use this data DIRECTLY. Do NOT recalculate, re-assign houses, or invent positions.
${perMonthData || '    [SwissEph data unavailable - use your best astrological judgement]'}
${monthLockTable}


DYNAMIC DATE CALCULATION (CRITICAL):
• Report cycle starts from: ${axisYear}年${monthNamesZH[axisMonth-1]}
• Report covers exactly 12 months: ${monthsRange}
• The user's Solar Return cycle anchors the annual forecast
• ALL dates must be dynamically calculated - ZERO hardcoded dates allowed

⛔ MERCURY RETROGRADE 2026 (FIXED - reference these, but adapt to user's Solar Return):
• MR#2: June 12 - July 7, 2026 (partially overlaps current cycle)
• MR#3: July 18 - August 11, 2026 (CRITICAL: July 18 is the real H2 Mercury Rx start!)
• MR#4: October 7 - October 28, 2026

⛔ [Mercury Rx 周期句式铁律]: 当描述 Mercury 逆行周期时,**必须**构成完整句,主语+谓语齐全。正确示范:"水星逆行期间(2月9日至3月3日),财务文件签署需格外谨慎,你的沟通可能出现误解。" 错误示范(截断/缺谓语):"2月9日至3月3日,水星,财务文件需要格外小心。" 禁止将日期范围+"水星"单独成句后不接谓语。

⛔ NEVER write dates like "2026年6月2026年6月" or duplicated/corrupted dates.
⛔ NEVER repeat the year inside month descriptions.

REQUIREMENTS:
• Total length: 6,000-8,000 words (${lang})
• Style: Epic, destiny-filled, ultra-premium ($29.99 value)
• ⛔ [句子完整性铁律]: 每个句子必须有完整主语+谓语。禁止逗号/句号后直接跟名词性短语不接谓语(如"X,财务文件需要格外小心"或"Y,沟通可能出现误解"都是病句)。月度和章节段落的每句话都必须读起来完整,不允许"句子碎片"。
• MUST include 5 complete chapters (each chapter ≥1,000 words):
  1. Annual Wealth Matrix
  2. 12-Month Revenue Matrix (strictly 12 months, NO merging)
  3. Destiny Career Path
  4. Debt & Risk Shield
  5. Oracle's Manifestation Guide

OUTPUT FORMAT: Clean Markdown with exactly 5 chapters.

Write in ${lang}. Use native ${lang} astrological and Jungian psychological terms.`,
    };

  } catch (e) {
    throw e;
  }

  return null;
}


// ── Compatibility Report Prompt Builder ──
function buildCompatibilityReportPrompt(d1, d2, lang, reportType) {
  if (reportType === 'monthly') {
    return `Generate a ${lang} monthly compatibility report for two people (birth dates: ${d1} and ${d2}) for July 2026.\n\nREQUIREMENTS:\n1. Total length: 1200-1500 words\n2. Style: Romantic, card-style\n3. MUST have 4 weeks\n\nOUTPUT FORMAT (JSON): {\n  \"headline\": \"...\",\n  \"weeks\": [...]\n}`;
  }
  return `分析 ${d1} 和 ${d2} 的命理合盘。`;
}

// ── Stripe Price ID 映射表 ──
// ⚠️ 需要替换为真实的 Stripe Price ID(从 Stripe Dashboard 获取)
const STRIPE_PRICE_MAP = {
  wealth_once:           'price_1Tl4pBRnHNva8hys1s5WC3uR',  // $4.99 财富单次
  wealth_monthly_report: 'price_1Tl56VRnHNva8hysQBWuVd5t',  // $2.99 财富月报
  wealth_yearly_report:  'price_1Tl5BCRnHNva8hysRm3BfIHs',  // $29.99 财富年报
  compatibility_once:    'price_1Tl4lGRnHNva8hysp2Q17TfN',  // $4.99 合婚单次
  compatibility_monthly_report: 'price_1Tl51rRnHNva8hysoA4erWmn',  // $2.99 合婚月报
  compatibility_yearly_report:  'price_1Tl59QRnHNva8hysEXDUGyEI',  // $29.99 合婚年报
  star_monthly_vip:      'price_1Tl5EjRnHNva8hysoVOryjQN',  // $9.99 双引擎月卡
  all_pass_yearly:       'price_1Tl5IFRnHNva8hysWa0ndl9A',  // $99.99 全通年卡
};
// ═══════════════════════════════════════════════════════════════
// 🛍️ E24⑥（2026-10-07 军师开工令）：商业闭环上架闸门
//   病根：付费三件套（webhook 落库 / 防重付 / 端点权益校验）只存在于
//         已废弃的 Vercel 函数（web/api 目录下的 webhook / create-checkout / wealth-oracle）；Railway 生产 server.js 里
//         webhook 仅 `console.log` ⇒ 即便 Stripe 后台把回调指向本域，
//         paid_plans 也永远写不进去（用户付了钱也解锁不了）。
//   治法：原样移植 Vercel 三件套语义（含测试白名单 / free_access 绿色通道），单点收敛。
//   铁律：下方四个纯函数（buildPlanPayload / planHasAccess / wealthIsGreenChannel /
//         wealthEntitledByPlans）为**单一真源** —— 闸门
//         test/audit-e24g-stripe-commercial-gate.test.mjs 直接抽取其源码做行为断言，
//         实现与断言同源，改实现不改闸门必转红。
// ═══════════════════════════════════════════════════════════════

// ── 权益周期时间（月卡配额重置 / 年卡过期）──
function computeNextMonthStartUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)).toISOString();
}
function computeOneYearLaterUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)).toISOString();
}

// ── plan → paid_plans 片段（**合并**写入，绝不覆盖无关字段）──
//   移植自 web/api/webhook.js::buildPlanPayload（逐档对齐，禁止增删档位）
function buildPlanPayload(plan) {
  const resetAt = computeNextMonthStartUTC();
  const yearLater = computeOneYearLaterUTC();
  switch (plan) {
    case 'compatibility_once':
      return { compatibility_once: true };
    case 'wealth_once':
      return { wealth_once: true };
    case 'compatibility_monthly_report':
      return { compatibility_monthly_report: true };
    case 'wealth_monthly_report':
      return { wealth_monthly_report: true };
    case 'compatibility_yearly_report':
      return { compatibility_yearly_report: true };
    case 'wealth_yearly_report':
      return { wealth_yearly_report: true };
    case 'star_monthly_vip':
      return {
        star_monthly_vip: true,
        star_monthly_wealth_allowance: 5,
        star_monthly_wealth_used: 0,
        star_monthly_compatibility_allowance: 1,
        star_monthly_compatibility_used: 0,
        star_monthly_resets_at: resetAt,
      };
    case 'all_pass_yearly':
      return {
        all_pass_yearly: true,
        all_pass_expires_at: yearLater,
        star_monthly_wealth_allowance: 5,
        star_monthly_wealth_used: 0,
        star_monthly_compatibility_allowance: 1,
        star_monthly_compatibility_used: 0,
        star_monthly_resets_at: resetAt,
      };
    default:
      return { [plan]: true };
  }
}

// ── 旧 plan ID → 新 plan ID（历史 Stripe 商品兼容，含 typo 修复）──
const PLAN_MIGRATION = {
  'insight_once': null,
  'monthly': null,
  'wealth_montly': 'wealth_monthly_report', // typo fix
  'wealth_yearly': null,
};
function normalizePlanId(plan) {
  const p = String(plan == null ? '' : plan);
  if (Object.prototype.hasOwnProperty.call(PLAN_MIGRATION, p)) return PLAN_MIGRATION[p];
  return p;
}

// ── 已购判定（防重复扣款）：宽档覆盖窄档。now 可注入 ⇒ 可测 ──
function planHasAccess(plans, target, now) {
  const p = plans || {};
  const ts = now instanceof Date ? now : new Date();
  const valid = (d) => d && !isNaN(new Date(d).getTime());
  if (p[target] === true) return true;
  const ap = p.all_pass_yearly === true && (!p.all_pass_expires_at || ts < new Date(p.all_pass_expires_at));

  if (target === 'compatibility_once' || target === 'compatibility_monthly_report' || target === 'compatibility_yearly_report') {
    if (ap) return true;
    if (target === 'compatibility_once' && p.star_monthly_vip === true) {
      const used = p.star_monthly_compatibility_used || 0;
      const allowance = p.star_monthly_compatibility_allowance || 0;
      const resetsAt = p.star_monthly_resets_at;
      if (used < allowance && resetsAt && ts < new Date(resetsAt)) return true;
    }
  }

  if (target === 'wealth_once' || target === 'wealth_monthly_report' || target === 'wealth_yearly_report') {
    if (ap) return true;
    if (target === 'wealth_once' && p.star_monthly_vip === true) {
      const used = p.star_monthly_wealth_used || 0;
      const allowance = p.star_monthly_wealth_allowance || 0;
      const resetsAt = p.star_monthly_resets_at;
      if (used < allowance && resetsAt && ts < new Date(resetsAt)) return true;
    }
  }

  return false;
}

// ── 财富权益（纯函数，**按产物分档**）：命中则返回方法名，无权益返回 null ──
//   分档规则（= 产品付费阶梯，与前端 wealthEntitledFor(type) 同源）：
//     · once（$4.99 先天报告）→ wealth_once        / 月卡配额 / 全通年卡
//     · monthly（$2.99 月报） → wealth_monthly_report / 月卡配额 / 全通年卡
//     · yearly（$29.99 年报） → wealth_yearly_report  / 全通年卡
//   🔴 禁止退化成「任一财富档即放行」的宽判 —— 否则 $4.99 用户可直接白拿 $29.99 年报。
//   （Vercel 生产版 wealth-oracle.js 正是宽判，属历史遗留营收漏洞，本次**不放行**。）
function wealthEntitledByType(plans, reportType, now) {
  const p = plans || {};
  const ts = now instanceof Date ? now : new Date();
  const apValid = p.all_pass_yearly === true && (!p.all_pass_expires_at || ts < new Date(p.all_pass_expires_at));
  const starQuotaOk = p.star_monthly_vip === true
    && (p.star_monthly_wealth_used || 0) < (p.star_monthly_wealth_allowance || 0)
    && !!p.star_monthly_resets_at && ts < new Date(p.star_monthly_resets_at);
  if (reportType === 'once') {
    if (p.wealth_once === true) return 'wealth_once';
    if (starQuotaOk) return 'star_monthly_vip';
    if (apValid) return 'all_pass_yearly';
    return null;
  }
  if (reportType === 'monthly') {
    if (p.wealth_monthly_report === true) return 'wealth_monthly_report';
    if (starQuotaOk) return 'star_monthly_vip';
    if (apValid) return 'all_pass_yearly';
    return null;
  }
  if (reportType === 'yearly') {
    if (p.wealth_yearly_report === true) return 'wealth_yearly_report';
    if (apValid) return 'all_pass_yearly';
    return null;
  }
  return null;
}

// ── 402 引导：按**请求产物**返回应购 SKU ──
//   旧写法把 requiredPlan 硬编成 'wealth_monthly_report' ⇒ 请求年报的用户被引导去买月报，
//   付完仍打不开年报（二次投诉来源）。故必须与 reportType 同源。
function requiredPlanFor(reportType) {
  if (reportType === 'yearly') return 'wealth_yearly_report';
  if (reportType === 'once') return 'wealth_once';
  return 'wealth_monthly_report';
}

// ── 测试绿色通道（原样保留）：free_access=1（前端从 URL 同源转发）/ Vercel 时代测试生日 ──
const WEALTH_TEST_BIRTHDATE = '1990-06-15';
// ⚠️ 射程：**只**覆盖这三种付费产物的生成端点；免费预告（reportType 缺省='oracle'）不受门禁
const WEALTH_PAID_REPORT_TYPES = new Set(['monthly', 'yearly', 'once']);
function wealthIsGreenChannel(body) {
  const b = body || {};
  if (b.free_access === 1 || b.free_access === true || b.freeAccess === 1 || b.freeAccess === true) return true;
  return b.birthDate === WEALTH_TEST_BIRTHDATE;
}

// ── 权益解析：token → 用户 → paid_plans → **按产物分档**判定。失败**闭合**（绝不静默放行）──
async function resolveWealthEntitlement(req, reportType) {
  const body = req.body || {};
  if (wealthIsGreenChannel(body)) return { ok: true, method: 'green_channel' };
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  // 本地/离线环境未接 Supabase ⇒ 不设卡（与闸门「射程外安全弃权」一致）
  if (!SB_URL || !SB_KEY) return { ok: true, method: 'no_supabase_configured' };
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { ok: false, method: null, reason: 'NO_TOKEN' };
  try {
    const userRes = await safeFetch(`${SB_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY || SB_KEY },
    });
    if (!userRes.ok) return { ok: false, method: null, reason: 'INVALID_TOKEN' };
    const { id: userId } = await userRes.json();
    if (!userId) return { ok: false, method: null, reason: 'INVALID_TOKEN' };
    const profRes = await safeFetch(
      `${SB_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=paid_plans&limit=1`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const rows = profRes.ok ? await profRes.json() : [];
    const plans = (Array.isArray(rows) && rows[0] && rows[0].paid_plans) || {};
    const method = wealthEntitledByType(plans, reportType, new Date());
    if (method) return { ok: true, method, userId, plans };
    return { ok: false, method: null, reason: 'NO_ENTITLEMENT', userId, plans };
  } catch (e) {
    console.warn('[E24⑥] entitlement check error:', e && e.message);
    return { ok: false, method: null, reason: 'CHECK_ERROR' };
  }
}

// ── /api/create-checkout ──（E24⑥ 全量移植：登录校验 → 防重付 → 建客户 → 建会话(**带 metadata**)）
//   🛡️ metadata.supabase_user_id / metadata.plan 是 webhook 落库的**唯一钥匙**，
//      缺它则回调无从归属 ⇒ 本次移植的核心不改项（旧 Railway 版正是缺这一段）。
app.post('/api/create-checkout', async (req, res) => {
  try {
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    const { plan: rawPlan, successUrl, cancelUrl } = req.body || {};
    const plan = normalizePlanId(rawPlan);
    const priceId = STRIPE_PRICE_MAP[plan];
    if (!priceId) {
      console.error('[create-checkout] Unknown plan:', rawPlan);
      return res.status(400).json({ error: 'Unknown plan: ' + rawPlan });
    }
    if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'Supabase env missing' });

    // ① 登录校验：必须带 Bearer（与 Vercel 版同语义）
    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const userRes = await safeFetch(`${SB_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY || SB_KEY },
    });
    if (!userRes.ok) return res.status(401).json({ error: 'Invalid or expired token' });
    const { id: userId, email } = await userRes.json();
    if (!userId) return res.status(401).json({ error: 'Invalid or expired token' });

    // ② 拉权益 → 防重复扣款
    const profileRes = await safeFetch(
      `${SB_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=paid_plans,paid,stripe_customer_id,subscription_id`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' } }
    );
    const profiles = profileRes.ok ? await profileRes.json() : [];
    const profile = (Array.isArray(profiles) && profiles[0]) || null;
    const paidPlans = (profile && profile.paid_plans) || {};
    if (planHasAccess(paidPlans, plan, new Date())) {
      console.log(`[create-checkout] ${plan} 已被现有权益覆盖 user=${String(userId).slice(0, 8)} → already_paid`);
      return res.status(200).json({ already_paid: true, message: 'Already subscribed' });
    }

    const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));

    // ③ 客户：无则建 + 落库（供后续订阅/查询关联）
    let customerId = profile && profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: email || undefined, metadata: { supabase_user_id: userId } });
      customerId = customer.id;
      await safeFetch(`${SB_URL}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ user_id: userId, stripe_customer_id: customerId, updated_at: new Date().toISOString() }),
      });
    }

    // ④ 过期该客户遗留的 open session（同客户不允许重复挂单/混币种）
    try {
      const open = await stripe.checkout.sessions.list({ customer: customerId, status: 'open', limit: 10 });
      for (const s of open.data) { await stripe.checkout.sessions.expire(s.id).catch(() => {}); }
    } catch (e) {
      console.warn('[create-checkout] expire old sessions:', e.message);
    }

    // ⑤ 建会话 —— **必须带 metadata**（webhook 靠它写权益）
    const SUBSCRIPTION_PLANS = new Set(['star_monthly_vip', 'all_pass_yearly']);
    const coversWealth = plan.startsWith('wealth_') || plan === 'star_monthly_vip' || plan === 'all_pass_yearly';
    const origin = req.headers.origin || 'https://kindredsouls.online';
    const defaultSuccess = `${origin}/wealth/report?payment=success&plan=${plan}`;
    const defaultCancel = `${origin}${coversWealth ? '/wealth/report?payment=cancelled' : '/?payment=cancelled'}`;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: SUBSCRIPTION_PLANS.has(plan) ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || defaultSuccess,
      cancel_url: cancelUrl || defaultCancel,
      metadata: { supabase_user_id: userId, plan },
    });
    console.log('[create-checkout] ✅ session:', session.id, 'plan:', plan, 'user:', String(userId).slice(0, 8));
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[create-checkout]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/webhook ──（E24⑥ 全量移植：验签 → 解析事件 → **合并写 paid_plans**）
//   🔴 上架前必办：Stripe Dashboard 的 webhook 端点须指向**本域** `/api/webhook`
//      （旧 Vercel 域名已弃用）——否则本函数永远收不到回调，权益无从落库。
//   ⚠️ 本路由用 express.raw 保持原始 body 供验签；**不可**改成 express.json。
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeSig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event = null;

  // ① 验签 —— 🔴 fail-closed 铁律：**只要配了密钥就必须验签**，
  //    缺 sig / 验签异常一律 400 拒绝。绝不可退化成「密钥在但没带签名就跳过」，
  //    否则任何人 POST 一段伪造 JSON 即可白拿顶级权益（营收致命洞）。
  //    仅当**完全未配置**密钥（本地开发）时才容忍，且必须响告警。
  if (webhookSecret) {
    if (!stripeSig) {
      console.error('[webhook] ❌ 已配置密钥但缺失 stripe-signature 头 → 拒绝');
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }
    try {
      const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));
      event = stripe.webhooks.constructEvent(req.body, stripeSig, webhookSecret);
      console.log('[webhook] ✅ 验签通过:', event.type);
    } catch (err) {
      console.error('[webhook] ❌ 验签失败:', err.message);
      return res.status(400).json({ error: err.message });
    }
  } else {
    console.warn('[webhook] ⚠️ 未配置 STRIPE_WEBHOOK_SECRET → 跳过验签（仅限本地开发）');
    try {
      event = JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '{}'));
    } catch (err) {
      console.error('[webhook] ❌ 请求体非合法 JSON:', err.message);
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
  }

  try {
    if (!event || event.type !== 'checkout.session.completed') {
      console.log('[webhook] 非落库事件，忽略:', event && event.type);
      return res.json({ received: true });
    }

    const session = event.data.object || {};
    const plan = normalizePlanId(session.metadata && session.metadata.plan);
    const userId = session.metadata && session.metadata.supabase_user_id;
    const email = (session.customer_details && session.customer_details.email) || session.customer_email || null;
    console.log('[webhook] 💰 支付成功 user:', userId, 'email:', email, 'plan:', plan);

    if (!userId) {
      console.warn('[webhook] ⚠️ 无 metadata.supabase_user_id（旧会话/手工创建）→ 跳过落库');
      return res.json({ received: true, skipped: 'no_user_metadata' });
    }
    if (!plan) {
      console.warn('[webhook] ⚠️ 无 metadata.plan → 跳过落库');
      return res.json({ received: true, skipped: 'no_plan_metadata' });
    }

    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (!SB_URL || !SB_KEY) {
      console.error('[webhook] ❌ Supabase env 缺失 → 无法落库');
      return res.status(500).json({ error: 'Supabase env missing' });
    }

    // ② 读现有权益 ⇒ **合并**写入（绝不覆盖无关字段；读失败按空合并并告警）
    let currentPlans = {};
    try {
      const r = await safeFetch(
        `${SB_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=paid_plans`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' } }
      );
      if (r.ok) {
        const rows = await r.json();
        currentPlans = (Array.isArray(rows) && rows[0] && rows[0].paid_plans) || {};
      } else {
        console.warn('[webhook] ⚠️ 读 paid_plans 失败 status=' + r.status + ' → 按空权益合并');
      }
    } catch (e) {
      console.warn('[webhook] ⚠️ 读 paid_plans 异常(按空权益合并):', e.message);
    }

    const updatedPlans = Object.assign({}, currentPlans, buildPlanPayload(plan));
    const rowPatch = {
      paid: true,
      paid_plans: updatedPlans,
      stripe_customer_id: session.customer || null,
      subscription_id: session.subscription || session.id || null,
      email: email || null,
      updated_at: new Date().toISOString(),
    };

    // ③ PATCH 优先；行不存在（406/404）则 INSERT
    const patchRes = await safeFetch(`${SB_URL}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(rowPatch),
    });

    if (patchRes.ok) {
      console.log('[webhook] ✅ PATCH 落库成功 user:', String(userId).slice(0, 8), 'plan:', plan);
    } else {
      const errBody = await patchRes.text().catch(() => '');
      console.warn('[webhook] PATCH 未成功:', patchRes.status, errBody, '→ 尝试 INSERT');
      const insRes = await safeFetch(`${SB_URL}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(Object.assign({ user_id: userId, created_at: new Date().toISOString() }, rowPatch)),
      });
      if (!insRes.ok) {
        const insBody = await insRes.text().catch(() => '');
        console.error('[webhook] ❌ INSERT 落库失败:', insRes.status, insBody);
        return res.status(500).json({ error: 'entitlement write failed' });
      }
      console.log('[webhook] ✅ INSERT 落库成功 user:', String(userId).slice(0, 8), 'plan:', plan);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[webhook] ❌ 处理失败:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/save-result ──
app.post('/api/save-result', async (req, res) => {
  try {
    const { userId, resultType, resultData } = req.body;
    // 直接用 REST API 写入
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    const insRes = await safeFetch(
      `${SB_URL}/rest/v1/compatibility_results`,
      {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ user_id: userId, result_type: resultType, result_data: resultData })
      }
    );
    if (!insRes.ok) throw new Error(`Supabase insert failed: ${insRes.status}`);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[save-result]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// 🛍️ V463：爆款/物理法器（Physical Artefacts & CTA）商业闭环预留节点
//   军师指令 2026-09-21（优先级 Low，仅预留不占工期）
//   ── 封仓期（当前）：has_recommended_item=false，其余字段 null
//      前端解析到 false 直接忽略该节点 → 页面零多余 UI，报告绝对纯洁
//   ── 上线期：算法按星盘硬损耗（如盘中金星/土星硬相位、破损宫位）置
//      has_recommended_item=true 并下发 item_sku / trigger_reason / cta_text / target_url
//      前端识别后自动在报告末尾渲染「专属法器卡片」并跳转购买
//   ── 单一真源：所有报告接口（月报/年报/先天财富）共用此构造器，不手写第二份
// ═══════════════════════════════════════════════════════════════
const ACTIONABLE_ARTEFACT_RESERVED = Object.freeze({
  has_recommended_item: false,
  item_sku: null,
  trigger_reason: null,
  cta_text: null,
  target_url: null,
});
function buildActionableArtefact(overrides) {
  return Object.assign({}, ACTIONABLE_ARTEFACT_RESERVED, overrides || {});
}

// ── [V238-STREAM-META] 共享: 结构化命理元数据(八字/星座/易经/塔罗)供流式端点报头渲染 ──
function buildWealthMeta(birthDate, lang, astroMatrix) {
  const TIANGAN = { zh:['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'], en:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], es:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], fr:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], th:['เจีย','อี้','ปิง','ติง','อู๋','จี','เกิง','ซิน','เหริน','กุ่ย'], vi:['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'] };
  const DIZHI = { zh:['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'], en:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], es:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], fr:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], th:['จื่อ','โฉ่ว','อิน','เม้า','เฉิน','ซื่อ','อู๋','เว่ย','เซิน','โย่ว','สวี่','ไห่'], vi:['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'] };
  const WUXING_TG = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
  const WUXING_DZ = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };
  const DAY_MASTER_EL = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
  const t = (dict, key, lang) => (dict[lang] && dict[lang][key] !== undefined) ? dict[lang][key] : (dict.zh ? dict.zh[key] : dict[key]);

  const [year, month, day] = birthDate.split('-').map(Number);
  const yTG = TIANGAN.zh[(year - 4) % 10]; const yTGDisplay = t(TIANGAN, (year - 4) % 10, lang);
  const yDZ = DIZHI.zh[(year - 4) % 12]; const yDZDisplay = t(DIZHI, (year - 4) % 12, lang);
  const mTG = TIANGAN.zh[(month + 1) % 10]; const mTGDisplay = t(TIANGAN, (month + 1) % 10, lang);
  const mDZ = DIZHI.zh[(month + 1) % 12]; const mDZDisplay = t(DIZHI, (month + 1) % 12, lang);
  const dTGIdx = ((year - 1900) * 5 + (month - 1) * 30 + day - 15) % 10; const dTG = TIANGAN.zh[dTGIdx]; const dTGDisplay = t(TIANGAN, dTGIdx, lang);
  const dDZIdx = ((year - 1900) * 12 + (month - 1) * 30 + day - 15) % 12; const dDZ = DIZHI.zh[dDZIdx]; const dDZDisplay = t(DIZHI, dDZIdx, lang);
  const dayMasterEl = DAY_MASTER_EL[dTG];

  const wuxing = { '金':0,'木':0,'水':0,'火':0,'土':0 };
  [yTG, mTG, dTG].forEach(el => { if (WUXING_TG[el]) wuxing[WUXING_TG[el]]++; });
  [yDZ, mDZ, dDZ].forEach(el => { if (WUXING_DZ[el]) wuxing[WUXING_DZ[el]]++; });

  const signs = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
  const signsEn = ['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'];
  const elements = ['土','风','水','火','土','风','水','火','土','风','水','火'];
  const modalities = ['基本','固定','变动','基本','固定','变动','基本','固定','变动','基本','固定','变动'];
  function getZodiacIdx(m, d) {
    const cuts = [[1,20,1],[2,19,2],[3,21,3],[4,20,4],[5,21,5],[6,22,6],[7,23,7],[8,23,8],[9,23,9],[10,24,10],[11,22,11],[12,22,0]];
    for (let i = cuts.length - 1; i >= 0; i--) {
      if (m > cuts[i][0] || (m === cuts[i][0] && d >= cuts[i][1])) return cuts[i][2];
    }
    return 0;
  }
  const zodiacIdx = getZodiacIdx(month, day);
  const sunSign = signs[zodiacIdx];
  const sunSignEn = signsEn[zodiacIdx];
  const sunSignElement = elements[zodiacIdx];
  const sunSignMode = modalities[zodiacIdx];
  const risingSign = astroMatrix?.meta?.rising_sign || sunSign;

  const HEXNAMES = { zh:['乾','兑','离','震','巽','坎','艮','坤'], en:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], es:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], fr:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], th:['เฉียน','ตุ้ย','หลี่','เจิ้น','ซุน','ขั้น','เคิ่น','คุ่น'], vi:['Càn','Đoái','Ly','Chấn','Tốn','Khảm','Cấn','Khôn'] };
  const HEXNATURES = { zh:['天','泽','火','雷','风','水','山','地'], en:['Heaven','Lake','Fire','Thunder','Wind','Water','Mountain','Earth'], es:['Cielo','Lago','Fuego','Trueno','Viento','Agua','Montaña','Tierra'], fr:['Ciel','Lac','Feu','Tonnerre','Vent','Eau','Montagne','Terre'], th:['สวรรค์','บึง','ไฟ','ฟ้าร้อง','ลม','น้ํา','ภูเขา','ดิน'], vi:['Trờ','Đầm','Lửa','Sấm','Gió','Nước','Núi','Đất'] };
  const hash = (year + month + day) % 64 + 1;
  const upper = Math.floor((hash - 1) / 8) + 1;
  const hexName = HEXNAMES[lang] ? HEXNAMES[lang][upper - 1] : HEXNAMES.zh[upper - 1];
  const hexNature = HEXNATURES[lang] ? HEXNATURES[lang][upper - 1] : HEXNATURES.zh[upper - 1];

  const tarotId = ((year * 13 + month * 3 + day) % 22);
  const tarotReversed = (year + month + day) % 3 === 0;
  const TAROT_CARDS = [
    { id:0, emoji:'🃏', name:{zh:'愚人',en:'The Fool',es:'El Loco',fr:'Le Mat',th:'ไพ่คนบ้า',vi:'Kẻ Khờ'} },
    { id:1, emoji:'🎩', name:{zh:'魔术师',en:'The Magician',es:'El Mago',fr:'Le Bateleur',th:'ไพ่จอมเวทย์',vi:'Ảo Thuật Gia'} },
    { id:2, emoji:'🌙', name:{zh:'女祭司',en:'The High Priestess',es:'La Sacerdotisa',fr:'La Papesse',th:'ไพ่นักบวชหญิง',vi:'Nữ Tư Tế'} },
    { id:3, emoji:'👑', name:{zh:'女皇',en:'The Empress',es:'La Emperatriz',fr:"L'Impératrice",th:'ไพ่จักรพรรดินี',vi:'Nữ Hoàng'} },
    { id:4, emoji:'🏛️', name:{zh:'皇帝',en:'The Emperor',es:'El Emperador',fr:"L'Empereur",th:'ไพ่จักรพรรดิ',vi:'Hoàng Đế'} },
    { id:5, emoji:'📜', name:{zh:'教皇',en:'The Hierophant',es:'El Papa',fr:'Le Pape',th:'ไพ่สมเด็จพระสังฆราช',vi:'Giáo Hoàng'} },
    { id:6, emoji:'💞', name:{zh:'恋人',en:'The Lovers',es:'Los Enamorados',fr:'Les Amoureux',th:'ไพ่คู่รัก',vi:'Tình Nhân'} },
    { id:7, emoji:'🏇', name:{zh:'战车',en:'The Chariot',es:'El Carro',fr:'Le Chariot',th:'ไพ่รถศึก',vi:'Chiến Xe'} },
    { id:8, emoji:'🦁', name:{zh:'力量',en:'Strength',es:'La Fuerza',fr:'La Force',th:'ไพ่พละกําลัง',vi:'Sức Mạnh'} },
    { id:9, emoji:'🏮', name:{zh:'隐士',en:'The Hermit',es:'El Ermitaño',fr:"L'Ermite",th:'ไพ่ฤาษี',vi:'Ẩn Sĩ'} },
    { id:10, emoji:'🎡', name:{zh:'命运之轮',en:'Wheel of Fortune',es:'La Rueda de la Fortuna',fr:'La Roue de Fortune',th:'วีลออฟฟอร์จูน',vi:'Bánh Xe Số Phận'} },
    { id:11, emoji:'⚖️', name:{zh:'正义',en:'Justice',es:'La Justicia',fr:'La Justice',th:'จัสติซ',vi:'Công Lý'} },
    { id:12, emoji:'🙃', name:{zh:'倒吊人',en:'The Hanged Man',es:'El Colgado',fr:'Le Pendu',th:'ไพ่คนแขวน',vi:'Ngước Treo'} },
    { id:13, emoji:'💀', name:{zh:'死神',en:'Death',es:'La Muerte',fr:'La Mort',th:'เดธ',vi:'Cái Chết'} },
    { id:14, emoji:'🍷', name:{zh:'节制',en:'Temperance',es:'La Templanza',fr:'La Tempérance',th:'เทมเปอแรนซ์',vi:'Điều Độ'} },
    { id:15, emoji:'😈', name:{zh:'恶魔',en:'The Devil',es:'El Diablo',fr:'Le Diable',th:'ไพ่ปีศาจ',vi:'Ác Ma'} },
    { id:16, emoji:'🗼', name:{zh:'高塔',en:'The Tower',es:'La Torre',fr:'La Maison Dieu',th:'ไพ่หอคอย',vi:'Tháp Đổ'} },
    { id:17, emoji:'⭐', name:{zh:'星星',en:'The Star',es:'La Estrella',fr:"L'Étoile",th:'ไพ่ดาว',vi:'Ngôi Sao'} },
    { id:18, emoji:'🌕', name:{zh:'月亮',en:'The Moon',es:'La Luna',fr:'La Lune',th:'ไพ่จันทร์',vi:'Mặt Trăng'} },
    { id:19, emoji:'☀️', name:{zh:'太阳',en:'The Sun',es:'El Sol',fr:'Le Soleil',th:'ไพ่อาทิตย์',vi:'Mặt Trời'} },
    { id:20, emoji:'📯', name:{zh:'审判',en:'Judgement',es:'El Juicio',fr:'Le Jugement',th:'จัดเมนต์',vi:'Phán Xét'} },
    { id:21, emoji:'🌍', name:{zh:'世界',en:'The World',es:'El Mundo',fr:'Le Monde',th:'ไพ่โลก',vi:'Thế Giới'} }
  ];
  const card = TAROT_CARDS[tarotId];

  return {
    bazi: {
      sizhu: {
        yearPillar: `${yTGDisplay}${yDZDisplay}`,
        monthPillar: `${mTGDisplay}${mDZDisplay}`,
        dayPillar: `${dTGDisplay}${dDZDisplay}`,
        dayMaster: dTGDisplay,
        dayMasterWuxing: dayMasterEl
      },
      wuxing
    },
    zodiac: {
      sunSign,
      sunSignEn,
      sunSignElement,
      sunSignMode,
      risingSign
    },
    iching: {
      hexName,
      hexNum: hash,
      hexNature
    },
    tarot: {
      id: tarotId,
      name: (card?.name?.[lang] || card?.name?.en),
      emoji: card?.emoji,
      orientation: tarotReversed ? 'Reversed' : 'Upright'
    },
    // 🛍️ V463: 爆款/法器预留节点（封仓期 false；前端见 false 忽略）
    actionable_artefact: buildActionableArtefact()
  };
}

// 🛠️ V383-fix5: 后处理兜底 — 强制 vi 月报消费陷阱段包含真实微冲动阈值 ₫500,000
// 根因: DeepSeek 在超长 prompt 下对嵌入式风险阈值指令遵循极弱, 反复自创 USD 金额($4,800/$2,500/$1,500等)
//   无视 ₫500,000 指令(连 system prompt 强制原样行都被忽略)。此处生成后兜底, 确保阈值必现。
//   逻辑: 定位 Bẫy Chi Tiêu 段, 若已含 ₫500,000 则跳过; 否则替换 LLM 自创的 USD/VND 金额为 ₫500,000,
//   若无金额可替换则追加权威声明行。仅作用于 lang==='vi'。
function enforceRiskThreshold(report, lang) {
  return fixViReportSanitize(report);
}

// ── /api/wealth-oracle ──
// ── V427: 命理元数据计算（MISS + HIT 路径共用，杜绝逻辑重复）──
function buildWealthMetaFull(birthDate, lang) {
    const TIANGAN = { zh:['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'], en:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], es:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], fr:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], th:['เจีย','อี้','ปิง','ติง','อู๋','จี','เกิง','ซิน','เหริน','กุ่ย'], vi:['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'] };
    const DIZHI = { zh:['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'], en:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], es:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], fr:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], th:['จื่อ','โฉ่ว','อิน','เม้า','เฉิน','ซื่อ','อู๋','เว่ย','เซิน','โย่ว','สวี่','ไห่'], vi:['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'] };
    const WUXING = { zh:['金','木','水','火','土'], en:['Metal','Wood','Water','Fire','Earth'], es:['Metal','Madera','Agua','Fuego','Tierra'], fr:['Métal','Bois','Eau','Feu','Terre'], th:['โลหะ','ไม้','น้ํา','ไฟ','ดิน'], vi:['Kim','Mộc','Thủy','Hỏa','Thổ'] };
    const WUXING_TG = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const WUXING_DZ = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };
    const DAY_MASTER_EL = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const t = (dict, key, lang) => (dict[lang] && dict[lang][key] !== undefined) ? dict[lang][key] : (dict.zh ? dict.zh[key] : dict[key]);

    // ── 1. 八字 ──
    const [year, month, day] = birthDate.split('-').map(Number);
    const yTG = TIANGAN.zh[(year - 4) % 10]; const yTGDisplay = t(TIANGAN, (year - 4) % 10, lang);
    const yDZ = DIZHI.zh[(year - 4) % 12]; const yDZDisplay = t(DIZHI, (year - 4) % 12, lang);
    const mTG = TIANGAN.zh[(month + 1) % 10]; const mTGDisplay = t(TIANGAN, (month + 1) % 10, lang);
    const mDZ = DIZHI.zh[(month + 1) % 12]; const mDZDisplay = t(DIZHI, (month + 1) % 12, lang);
    const dTGIdx = ((year - 1900) * 5 + (month - 1) * 30 + day - 15) % 10; const dTG = TIANGAN.zh[dTGIdx]; const dTGDisplay = t(TIANGAN, dTGIdx, lang);
    const dDZIdx = ((year - 1900) * 12 + (month - 1) * 30 + day - 15) % 12; const dDZ = DIZHI.zh[dDZIdx]; const dDZDisplay = t(DIZHI, dDZIdx, lang);
    const dayMasterEl = DAY_MASTER_EL[dTG];
    const dayMasterName = `${dTG}·${dayMasterEl}`;

    const wuxing = { '金':0,'木':0,'水':0,'火':0,'土':0 };
    [yTG, mTG, dTG].forEach(el => { if (WUXING_TG[el]) wuxing[WUXING_TG[el]]++; });
    [yDZ, mDZ, dDZ].forEach(el => { if (WUXING_DZ[el]) wuxing[WUXING_DZ[el]]++; });

    const score = Math.floor((wuxing['土'] + wuxing['金']) * 12 + wuxing['水'] * 15 + wuxing['木'] * 10);

    // ── 2. 星座 ──
    const signs = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
    const signsEn = ['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'];
    const elements = ['土','风','水','火','土','风','水','火','土','风','水','火'];
    const modalities = ['基本','固定','变动','基本','固定','变动','基本','固定','变动','基本','固定','变动'];
    const rulers = ['土星','天王星','海王星','火星','金星','水星','月亮','太阳','水星','金星','冥王星','木星'];

    // 星座查表:每个元素是 [月, 切换日, 星座索引]
    // 切换日当天及之后,属于新星座
    // 摩羯座:12月22日-1月19日 | 水瓶座:1月20日-2月18日 | 双鱼座:2月19日-3月20日
    // 白羊座:3月21日-4月19日 | 金牛座:4月20日-5月20日 | 双子座:5月21日-6月21日
    // 巨蟹座:6月22日-7月22日 | 狮子座:7月23日-8月22日 | 处女座:8月23日-9月22日
    // 天秤座:9月23日-10月23日 | 天蝎座:10月24日-11月21日 | 射手座:11月22日-12月21日
    function getZodiacIdx(m, d) {
      const cuts = [[1,20,1],[2,19,2],[3,21,3],[4,20,4],[5,21,5],[6,22,6],[7,23,7],[8,23,8],[9,23,9],[10,24,10],[11,22,11],[12,22,0]];
      for (let i = cuts.length - 1; i >= 0; i--) {
        if (m > cuts[i][0] || (m === cuts[i][0] && d >= cuts[i][1])) {
          return cuts[i][2];
        }
      }
      return 0;
    }
    const zodiacIdx = getZodiacIdx(month, day);
    const sunSign = signs[zodiacIdx];
    const sunSignEn = signsEn[zodiacIdx];
    const sunSignElement = elements[zodiacIdx];
    const sunSignMode = modalities[zodiacIdx];
    const sunSignRuler = rulers[zodiacIdx];

    // ── 3. 易经 ──
    const HEXNAMES = { zh:['乾','兑','离','震','巽','坎','艮','坤'], en:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], es:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], fr:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], th:['เฉียน','ตุ้ย','หลี่','เจิ้น','ซุน','ขั้น','เคิ่น','คุ่น'], vi:['Càn','Đoái','Ly','Chấn','Tốn','Khảm','Cấn','Khôn'] };
    const HEXNATURES = { zh:['天','泽','火','雷','风','水','山','地'], en:['Heaven','Lake','Fire','Thunder','Wind','Water','Mountain','Earth'], es:['Cielo','Lago','Fuego','Trueno','Viento','Agua','Montaña','Tierra'], fr:['Ciel','Lac','Feu','Tonnerre','Vent','Eau','Montagne','Terre'], th:['สวรรค์','บึง','ไฟ','ฟ้าร้อง','ลม','น้ํา','ภูเขา','ดิน'], vi:['Trờ','Đầm','Lửa','Sấm','Gió','Nước','Núi','Đất'] };
    const hash = (year + month + day) % 64 + 1;
    const upper = Math.floor((hash - 1) / 8) + 1;
    const lower = (hash - 1) % 8 + 1;
    const hexName = HEXNAMES[lang] ? HEXNAMES[lang][upper - 1] : HEXNAMES.zh[upper - 1];
    const hexNameEn = HEXNAMES.en[upper - 1];
    const hexNature = HEXNATURES[lang] ? HEXNATURES[lang][upper - 1] : HEXNATURES.zh[upper - 1];
    const changingLine = ((year + month + day) % 6) + 1;
    const transformedHex = upper === 8 ? 2 : upper + 1;
    const transformedHexName = HEXNAMES[lang] ? HEXNAMES[lang][transformedHex - 1] : HEXNAMES.zh[transformedHex - 1];
    const transformedHexNameEn = HEXNAMES.en[transformedHex - 1];

    // ── 4. 塔罗 ──
    const tarotId = ((year * 13 + month * 3 + day) % 22);
    const tarotReversed = (year + month + day) % 3 === 0;

    // 22张大阿卡纳:id → {name(中), nameEn(英), emoji, meaning(中), meaningEn(英)}
    const TAROT_CARDS = [
      { id:0, emoji:'🃏', name:{zh:'愚人',en:'The Fool',es:'El Loco',fr:'Le Mat',th:'ไพ่คนบ้า',vi:'Kẻ Khờ'}, meaning:{zh:'新的财务冒险即将开始,适合小额试错。',en:'A new financial adventure begins. Calculated risks favor you today.',es:'Nueva aventura financiera - toma riesgos calculados.',fr:'Nouvelle aventure financière - prends des risques calculés.',th:'การเสี่ยงทางการเงินใหม่ - คํานวณความเสี่ยงก่อน',vi:'Cuộc phiêu lưu tài chính mới - tính toán rủi ro trước。'} },
      { id:1, emoji:'🎩', name:{zh:'魔术师',en:'The Magician',es:'El Mago',fr:'Le Bateleur',th:'ไพ่จอมเวทย์',vi:'Ảo Thuật Gia'}, meaning:{zh:'你手头资源足以搅动一个项目,直接动手。',en:'Your financial tools are ready. Manifest wealth with focus.',es:'Manifiesta riqueza ahora - tus talentos están listos.',fr:'Manifester la richesse maintenant - vos talents sont prêts.',th:'สร้างความมั่งคั่งตอนนี้ - พรสวรรค์พร้อมแล้ว',vi:'Thể hiện của cải ngay bây giờ - tài năng sẵn sàng。'} },
      { id:2, emoji:'🌙', name:{zh:'女祭司',en:'The High Priestess',es:'La Sacerdotisa',fr:'La Papesse',th:'ไพ่นักบวชหญิง',vi:'Nữ Tư Tế'}, meaning:{zh:'直觉今天比财报准,信任你第六感。',en:'Financial intuition peaks. Trust your money gut today.',es:'Confía en tu intuición financiera - oportunidades ocultas te esperan.',fr:'Faites confiance à votre intuition - des opportunités vous attendent.',th:'ไว้ใจสัญชาตญาณ - โอกาสซ่อนอยู่รอคุณอยู่',vi:'Tin vào trực giác tài chính - cơ hội ẩn đang chờ bạn。'} },
      { id:3, emoji:'👑', name:{zh:'女皇',en:'The Empress',es:'La Emperatriz',fr:'L\'Impératrice',th:'ไพ่จักรพรรดินี',vi:'Nữ Hoàng'}, meaning:{zh:'适合收割之前种下的项目,果实该摘了。',en:'Financial abundance flows. Harvest what you planted.',es:'La abundancia fluye - la riqueza crece con paciencia.',fr:'L\'abondance circule - la richesse grandit avec patience.',th:'เงินไหลมา - ความมั่งคั่งเติบโตด้วยความอดทน',vi:'Cải tạo dồi dào - của cải lớn lên nhờ kiên nhẫn。'} },
      { id:4, emoji:'🏛️', name:{zh:'皇帝',en:'The Emperor',es:'El Emperador',fr:'L\'Empereur',th:'ไพ่จักรพรรดิ',vi:'Hoàng Đế'}, meaning:{zh:'拍板一个决策,把人管住,钱理清。',en:'Solid financial foundation. Build wealth with clear rules.',es:'Construye estructura de riqueza - base financiera sólida.',fr:'Construire la structure financière - base solide établie.',th:'สร้างโครงสร้างความมั่งคั่ง - ฐานะมั่นคงแล้ว',vi:'Xây dựng cấu trúc tài sản - nền tảng vững chắc rồi。'} },
      { id:5, emoji:'📜', name:{zh:'教皇',en:'The Hierophant',es:'El Papa',fr:'Le Pape',th:'ไพ่สมเด็จพระสังฆราช',vi:'Giáo Hoàng'}, meaning:{zh:'找个比你赚得多的人聊,问题可能出在认知圈。',en:'Seek a wealth mentor. Your money path needs guidance.',es:'Riqueza alineada con valores - camino ético claro.',fr:'Richesse alignée avec vos valeurs - chemin éthique clair.',th:'ความมั่งคั่งสอดคล้องค่านิยม - ทางที่ถูกต้องชัดเจน',vi:'Củả phù hợp giá trị - con đường kiếm tiền đạo đức rõ ràng。'} },
      { id:6, emoji:'💞', name:{zh:'恋人',en:'The Lovers',es:'Los Enamorados',fr:'Les Amoureux',th:'ไพ่คู่รัก',vi:'Tình Nhân'}, meaning:{zh:'跟钱有关的选择,选让你心跳加速的那条。',en:'Financial choice point. Follow your money heart.',es:'Punto de decisión financiera - sigue tu corazón.',fr:'Point de choix financier - suivez votre cœur.',th:'จุดตัดสินใจเรื่องเงิน - ทําตามหัวใจ',vi:'Điểm quyết định tài chính - theo trái tim tài chính của bạn。'} },
      { id:7, emoji:'🏇', name:{zh:'战车',en:'The Chariot',es:'El Carro',fr:'Le Chariot',th:'ไพ่รถศึก',vi:'Chiến Xe'}, meaning:{zh:'全速推进,犹豫一秒都是对财运的不尊重。',en:'Unstoppable financial momentum. Execute with confidence.',es:'El carro de la riqueza avanza - la acción decisiva gana.',fr:'Le char de la richesse avance - l\'action déterminée gagne.',th:'รถม้าความมั่งคั่งวิ่ง - ความมุ่งมั่นชนะ',vi:'Xe tài chính tiến - hành động kiên quyết thắng。'} },
      { id:8, emoji:'🦁', name:{zh:'力量',en:'Strength',es:'La Fuerza',fr:'La Force',th:'ไพ่พละกําลัง',vi:'Sức Mạnh'}, meaning:{zh:'今天要么搞定那笔钱,要么搞定那个不敢谈价的人。',en:'Inner financial power. Gentle wealth strength awakens.',es:'Fortaleza financiera interior - poder gentil despierta.',fr:'Force financière intérieure - pouvoir doux s\'éveille.',th:'พลังการเงินภายใน - พลังอ่อนโยนตื่น',vi:'Sức mạnh tài chính bên trong - năng lượng dịu dàng thức tỉnh。'} },
      { id:9, emoji:'🏮', name:{zh:'隐士',en:'The Hermit',es:'El Ermitaño',fr:'L\'Ermite',th:'ไพ่ฤาษี',vi:'Ẩn Sĩ'}, meaning:{zh:'关掉消息提醒,花30分钟盘你的财务底牌。',en:'Financial wisdom within. Solitude brings money insights.',es:'Sabiduría financiera interior - la soledad trae perspectivas.',fr:'Sagesse financière intérieure - la solitude apporte des perspectives.',th:'ปัญญาความมั่งคั่งภายใน - ความสันโดษให้มุมมองใหม่',vi:'Trí tuệ giàu có bên trong - một mình mang lại góc nhìn mới。'} },
      { id:10, emoji:'🎡', name:{zh:'命运之轮',en:'Wheel of Fortune',es:'La Rueda de la Fortuna',fr:'La Roue de Fortune',th:'วีลออฟฟอร์จูน',vi:'Bánh Xe Số Phận'}, meaning:{zh:'你的财运拐点到了,今天必须做一次主动出击。',en:'Financial cycle turning. Fortune favors bold money moves.',es:'El ciclo de riqueza gira - la fortuna favorece movimientos audaces.',fr:'Le cycle de richesse tourne - la fortune favorise les audacieux.',th:'วงจรความมั่งคั่งหมุน - โชคสนับสนุนผู้กล้า',vi:'Chu kỳ giàu có quay - vận may ủng hộ người dám làm。'} },
      { id:11, emoji:'⚖️', name:{zh:'正义',en:'Justice',es:'La Justicia',fr:'La Justice',th:'จัสติซ',vi:'Công Lý'}, meaning:{zh:'做一件正确但难开口的事,跟合伙人谈分成。',en:'Financial karma balancing. Money justice arrives.',es:'Justicia financiera - el karma del dinero se equilibra.',fr:'Justice financière - le karma de l\'argent s\'équilibre.',th:'ความยุติธรรมทางการเงิน - กรรมเงินสมดุล',vi:'Công lý tài chính - nghiệp tiền cân bằng hoàn hảo。'} },
      { id:12, emoji:'🙃', name:{zh:'倒吊人',en:'The Hanged Man',es:'El Colgado',fr:'Le Pendu',th:'ไพ่คนแขวน',vi:'Ngước Treo'}, meaning:{zh:'停下来的勇气比冲的勇气值钱。',en:'Financial perspective shift. New money vision needed.',es:'Cambio de perspectiva financiera - nueva visión del dinero.',fr:'Changement de perspective - nouvelle vision nécessaire.',th:'มุมมองทางการเงินเปลี่ยน - ต้องการวิสัยทัศน์ใหม่',vi:'Góc nhìn tài chính chuyển đổi - cần tầm nhìn mới về tiền。'} },
      { id:13, emoji:'💀', name:{zh:'死神',en:'Death',es:'La Muerte',fr:'La Mort',th:'เดธ',vi:'Cái Chết'}, meaning:{zh:'清理一个拖你后腿的财务包袱,结束才有新生。',en:'Financial transformation. Old you dies, new emerges.',es:'Transformación de riqueza - el viejo tú financiero muere.',fr:'Transformation financière - le vieil vous meurt.',th:'การเปลี่ยนแปลงความมั่งคั่ง - ตายแล้วเกิดใหม่',vi:'Chuyển đổi giàu có - người tài chính cũ chết, người mới ra đời。'} },
      { id:14, emoji:'🍷', name:{zh:'节制',en:'Temperance',es:'La Templanza',fr:'La Tempérance',th:'เทมเปอแรนซ์',vi:'Điều Độ'}, meaning:{zh:'今天最适合做资产配置的一步调整。',en:'Financial balance. Moderate money approach wins.',es:'Equilibrio financiero - la moderación gana.',fr:'Équilibre financier - la modération gagne.',th:'สมดุลความมั่งคั่ง - ทางเลือกปานกลางชนะ',vi:'Cân bằng giàu có - chiến lược tiền bạc vừa phải thắng。'} },
      { id:15, emoji:'😈', name:{zh:'恶魔',en:'The Devil',es:'El Diablo',fr:'Le Diable',th:'ไพ่ปีศาจ',vi:'Ác Ma'}, meaning:{zh:'直视你最上瘾的那笔消费或投资。',en:'Financial shadow work. Face money demons to win.',es:'Trabajo con la sombra financiera - enfrenta tus demonios.',fr:'Travail sur l\'ombre - affrontez vos démons.',th:'ทํางานกับเงาทางการเงิน - เผชิญปีศาจเงิน',vi:'Làm việc với bóng tối tài chính - đối mặt quỷ tiền bạc để thắng。'} },
      { id:16, emoji:'🗼', name:{zh:'高塔',en:'The Tower',es:'La Torre',fr:'La Maison Dieu',th:'ไพ่หอคอย',vi:'Tháp Đổ'}, meaning:{zh:'打破一个旧的收入结构,制造一次主动破坏。',en:'Financial breakthrough. Sudden money shift incoming.',es:'Quiebre financiero - cambio repentino de dinero.',fr:'Percée financière - changement soudain.',th:'การทะลุทางการเงิน - เงินเปลี่ยนทิศฉับพลัน',vi:'Đột phá tài chính - chuyển đổi tiền bạc đột ngột。'} },
      { id:17, emoji:'⭐', name:{zh:'星星',en:'The Star',es:'La Estrella',fr:'L\'Étoile',th:'ไพ่ดาว',vi:'Ngôi Sao'}, meaning:{zh:'今天适合定下一个长期目标。',en:'Financial hope returns. Wealth star guides your journey.',es:'La estrella financiera guía - la esperanza regresa.',fr:'L\'étoile financière guide - l\'espoir revient.',th:'ดาวนําทางความมั่งคั่ง - ความหวังกลับมา',vi:'Ngôi sao dẫn đường giàu có - hy vọng quay lại。'} },
      { id:18, emoji:'🌕', name:{zh:'月亮',en:'The Moon',es:'La Luna',fr:'La Lune',th:'ไพ่จันทร์',vi:'Mặt Trăng'}, meaning:{zh:'赚钱机会藏在模糊信息里。',en:'Financial intuition peaks. Lunar money magic works.',es:'Intuición financiera en su punto máximo - magia lunar.',fr:'Intuition financière à son apogée - magie lunaire.',th:'สัญชาตญาณทางการเงินสูงสุด - เวทมนตร์จันทรคติ',vi:'Trực giác tài chính đạt đỉnh - phép thuật trăng tròn。'} },
      { id:19, emoji:'☀️', name:{zh:'太阳',en:'The Sun',es:'El Sol',fr:'Le Soleil',th:'ไพ่อาทิตย์',vi:'Mặt Trời'}, meaning:{zh:'今天是亮牌日,把价值show出来。',en:'Financial success bright ahead. Wealth sunshine blesses you.',es:'El sol financiero brilla - éxito brillante adelante.',fr:'Le soleil financier brille - succès brillant devant.',th:'ดวงอาทิตย์ทางการเงินส่อง - ความสําเร็จรุ่งโรจน์',vi:'Ánh dương tài chính chiếu sáng - thành công rực rỡ phía trước。'} },
      { id:20, emoji:'📯', name:{zh:'审判',en:'Judgement',es:'El Juicio',fr:'Le Jugement',th:'จัดเมนต์',vi:'Phán Xét'}, meaning:{zh:'复盘一次过去的财务失误。',en:'Financial rebirth. Wealth calling heard.',es:'El llamado de la riqueza es escuchado - renacimiento.',fr:'L\'appel de la richesse entendu - renaissance.',th:'เสียงเรียกความมั่งคั่งดังแล้ว - การเกิดใหม่ใกล้',vi:'Tiếng gọi giàu có được nghe - tái sinh đang đến gần。'} },
      { id:21, emoji:'🌍', name:{zh:'世界',en:'The World',es:'El Mundo',fr:'Le Monde',th:'ไพ่โลก',vi:'Thế Giới'}, meaning:{zh:'一个财务周期结束了,今天奖励自己。',en:'Financial cycle complete. Wealth world transforms.',es:'Ciclo financiero completo - transformación total.',fr:'Cycle financier complet - transformation mondiale.',th:'วงจรความมั่งคั่งสมบูรณ์ - โลกการเงินเปลี่ยน',vi:'Chu kỳ giàu có hoàn tất - thế giới tài chính chuyển đổi。'} }
    ];
    const card = TAROT_CARDS[tarotId];
    const cardMeaning = (card.meaning[lang] || card.meaning.en);
    const cardName = (card.name[lang] || card.name.en);

    const result = {
      success: true,
      birthDate, lang,
      score,
      cached: false,
      // 🛍️ V463: 爆款/法器预留节点（封仓期 false；前端见 false 忽略）
      actionable_artefact: buildActionableArtefact(),
      message: lang === 'zh' ? '财富格局已生成' : 'Wealth pattern generated',
      data: {
        bazi: {
          sizhu: {
            yearPillar: `${yTGDisplay}${yDZDisplay}`,
            monthPillar: `${mTGDisplay}${mDZDisplay}`,
            dayPillar: `${dTGDisplay}${dDZDisplay}`,
            dayMaster: dTGDisplay,
            dayMasterWuxing: dayMasterEl
          },
          wuxing
        },
        zodiac: { sunSign, sunSignEn, sunSignElement, sunSignMode, sunSignRuler },
        iching: { hexName, hexNameEn, hexNum: hash, hexNature, changingLine, transformedHexName, transformedHexNameEn },
        tarot: {
          id: tarotId,
          name: cardName,
          nameEn: card.name.en,
          emoji: card.emoji,
          meaning: cardMeaning,
          orientation: tarotReversed ? 'Reversed' : 'Upright'
        }
      }
    }
  return { result, sunSign, dTGDisplay, wuxing, hexName, cardName };
}

app.post('/api/wealth-oracle', async (req, res) => {
  try {
    // 🛠️ V91+: 出生时间/经纬度/时区(默认 Bangkok 中午)
    const {
      birthDate,
      birthTime,  // ⚠️ V176-fix: 禁止默认值！缺省时由 hasBirthTime=false 触发 Solar House 降级
      lang = 'zh',
    } = req.body;
    // 🛠️ V102s: 是否真提供出生时间(未提供→报头不声称上升)
    const hasBirthTime = typeof req.body.birthTime === 'string' && req.body.birthTime.trim().length > 0;
    if (!birthDate) return res.status(400).json({ success: false, error: 'birthDate required' });

    // 🛡️ V490: 时区强校验与三级回退（Tier-1 规范化/typo → Tier-2 坐标最近邻 → Tier-3 HTTP 400）
    //   病根: 时区拼写错曾被 Python 静默退 UTC → 上升点错 48.82° 仍返回 200 success（静默假绿）。
    //   此处统一解析，tz 一律换成**规范 IANA 名** ⇒ 缓存键 / 引擎入参 / 落库三处同源。
    //   ⚠️ 传**原始** lat/lon 做 Tier-2 推定：坐标本身的合法性由下方 V490b 闸门独立把关，
    //     这里只是"借用坐标猜时区"（猜不到就走 Tier-3 400，绝不静默）。
    const _tzr = resolveTimeZone(req.body.tz, req.body.lat, req.body.lon);  // ⚠️ 传原值(不预转 Number)：null 不可被 Number() 洗成 0
    if (!_tzr.ok) {
      console.warn(`[TZ_FALLBACK_WARNING] 无法解析时区 input=${JSON.stringify(req.body.tz)} lat=${req.body.lat} lon=${req.body.lon} → HTTP 400`);
      return res.status(400).json({ success: false, code: 'INVALID_TIMEZONE', error: `Invalid time zone: ${req.body.tz}` });
    }
    const tz = _tzr.tz;
    if (_tzr.corrected) {
      console.warn(`[TZ_RESOLVED] ${JSON.stringify(_tzr.input)} → ${tz} (tier=${_tzr.tier}/${_tzr.reason}`
        + `${_tzr.distanceKm != null ? ', dist=' + _tzr.distanceKm.toFixed(1) + 'km' : ''})`);
    }

    // 🛡️ V490b: 坐标强校验（入参第一关）—— 消灭「lat=null 静默降级 Cancer / lat=91 越界照算出盘」
    //   ⚠️ 必须传**原始值**（不预转 Number）：Number(null)===0 会把「没给坐标」洗成 (0°,0°) = 合法坐标。
    //   ⚠️ 置于 tz 解析**之后**：时区闸门（Tier-3 需靠"无坐标"才可达）不能被坐标闸门遮蔽成死代码，
    //      两层各自独立可达、可测（时区层用「无坐标 + 无效 tz」，坐标层用「合法 tz + 非法坐标」）。
    const _coord = resolveCoordinates(req.body.lat, req.body.lon);
    if (!_coord.ok) {
      console.warn(`[COORD_REJECTED] lat=${JSON.stringify(req.body.lat)} lon=${JSON.stringify(req.body.lon)} → HTTP 400 (${_coord.reason}: ${_coord.message})`);
      return res.status(400).json(invalidCoordinatesBody(_coord.message));
    }
    const lat = _coord.lat;
    const lon = _coord.lon;

    // ═══ 军师缓存键:wealth:{生日}:{语言}:{类型} ═══
    const reportType = req.body.reportType || 'oracle';
    // 🛡️ V483c: 支持 `nocache` —— 线上真值复验必须能「强制 MISS」走真实生成链。
    //   此前服务端完全不识别该参数（test/tools/verify_*.mjs 传了也是空转）: 一旦 HIT 恢复正常,
    //   复验就会变成「验缓存」而不是「验生成」→ 假绿。前端不传该参数, 行为不受影响。
    const noCache = req.body.nocache === true || req.body.noCache === true;
    // 🛠️ V178-P0: 缓存键纳入 birthTime/lat/lon/tz — 同生日不同时辰/地理位置 100% 独立计算, 杜绝跨用户串盘
    const _ckTime = birthTime || '12:00';
    // 🛡️ V490b: lat/lon 此时已是**校验过的数值**（上面 resolveCoordinates），故直接 toFixed。
    //   原写法 `Number(lat || 13.75)` 是类型洗白惯用法 —— 会把 null 洗成默认值/0，正是 V490b 要消灭的。
    const _ckLat = lat.toFixed(4);
    const _ckLon = lon.toFixed(4);
    const _ckTz = tz || 'Asia/Bangkok';
    const cacheKey = `wealth:v529:${birthDate}:${_ckTime}:${_ckLat}:${_ckLon}:${_ckTz}:${lang}:${reportType}`;
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

    // ═══ 🛍️ E24⑥ 权益闸门（军师开工令 2026-10-07）：付费产物必须先过权益 ═══
    //   射程：monthly / yearly / once 三种付费产物；免费预告(reportType 缺省='oracle')不受门禁。
    //   绿色通道：free_access=1（前端从 URL 同源转发）/ Vercel 时代测试生日 1990-06-15。
    //   ⚠️ 必须置于 Cache Hit **之前** —— 否则无权益者可直接读走缓存里的付费正文。
    if (WEALTH_PAID_REPORT_TYPES.has(reportType)) {
      const _ent = await resolveWealthEntitlement(req, reportType);
      if (!_ent.ok) {
        console.log(`[E24⑥] entitlement DENIED reason=${_ent.reason} type=${reportType} date=${birthDate}`);
        let _previewData = null;
        try { _previewData = buildWealthMetaFull(birthDate, lang).result.data; } catch (e) { console.warn('[E24⑥] preview build failed:', e.message); }
        return res.status(402).json({
          error: 'Payment required',
          code: 'ENTITLEMENT_REQUIRED',
          requiredPlan: requiredPlanFor(reportType),
          data: _previewData,
          preview: true,
        });
      }
      console.log(`[E24⑥] entitlement GRANTED via ${_ent.method} type=${reportType}`);
    }

    // ═══ 第一道拦截:Cache Hit ═══
    if (SB_URL && SB_KEY && reportType !== 'oracle' && !noCache) {
      try {
        const cacheRes = await safeFetch(
          `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=insight&order=created_at.desc&limit=1`,
          { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
        );
        const cacheRows = await cacheRes.json();
        const cachedText = cacheRows?.[0]?.insight;

        if (cachedText && cachedText.length > 2000) {
          console.log(`[wealth-oracle] [HIT] Cache HIT: ${cacheKey}, length=${cachedText.length}`);
          // V103-fix6: 标准化旧缓存,确保格式统一
          // 🛡️ E15/R11f-0 (P0 修复, 2026-10-04): 此处必须用 `let`，**绝不可改回 `const`**。
          //   病根: 下方 vi 分支(:~10810) / th 分支(:~10820) 会对本变量**重新赋值**
          //   （stdCached = lockNatalTruthVi(...) 等）⇒ 若为 const 则运行时必抛
          //   `TypeError: Assignment to constant variable`，被外层 catch 吞掉 ⇒
          //   `return res.json({cached:true})` 永不执行 ⇒ 缓存行明明已读出却静默丢弃，
          //   每次请求退化为全量 MISS 重新生成（vi/th 双倍 token + 100~186s）。
          //   实证(12 盘批测): vi 阿克拉盘行已落库(created_at 早于 HIT) 却 cached=false、HIT 166.6s；
          //   同端点 en 对照 Adelaide HIT 1166ms / 新德里 2086ms。
          //   闸门: audit-e15-r11f-multilang-uncage（含注入缺陷自测: 改回 const 必须报红）。
          // 🛡️ E18/R11k: **不再二次 `standardizeReport`**。
          //   病根：`standardizeReport` 内含 `t.replace(/(?<!#)###\s+/g, '\n### ')` 与
          //   `t.replace(/---/g, '\n---\n')` —— 二者**非幂等**（每次施加都再插一批换行）；
          //   落库时已施加过一次（:11849 `insight: standardizeReport(reportContent)`），
          //   HIT 再施加一次 ⇒ HIT 文本比库内文本多出一批换行（12 盘实测 `hit_identical` 恒 false）。
          //   ⇒ 命中文本按**原样**使用，一个字符都不动（见下方 Clean HIT Pipeline）。
          let stdCached = cachedText;
          // 🛠️ V394-fix8: 非stream端点HIT路径补齐vi清洗兜底(与stream端点6077对齐)——
          //   历史9-06脏缓存(含bạnè/trongương吞字/5.000.000越界)经此强制清洗,杜绝毒化复现
          // 🛡️ V483c: `_hitAstro` / `_hitAstroTh` / `_hitAstro432` 必须在本块**顶层**声明。
          //   原写法三者分别在 `lang === 'vi' | 'th' | _V432_LANGS` 的 if 块内用 `let` 声明,
          //   却在块外 `const _hitMatrix = _hitAstro432 || _hitAstro || _hitAstroTh || null;` 处读取
          //   → 只要走进本 HIT 分支(缓存文本 >2000 字)就**必然**抛
          //     `ReferenceError: _hitAstro432 is not defined`（zh/en/es 时它是块内 let; vi/th 时连声明都没有）,
          //   被下方 catch 吞掉 → `return res.json` 根本执行不到 → HIT 路径**整体失效**,
          //   每次请求都退化成 MISS 重新生成（LLM 费用 + 用户等待双输）。
          //   线上实测日志(2026-09-30): `[wealth-oracle] Cache check error: _hitAstro432 is not defined`。
          //   ⚠️ 与 V482d「模块级函数隐式依赖调用者局部变量」同源: 收尾/缓存路径必须自洽。
          // ═══ 🛡️ E18/R11k（军师裁决②）: Clean HIT Pipeline —— 命中即终局，**绝不再跑锁链** ═══
          // 病根（2026-10-05 v517 线上 12 盘 + 离线逐字复刻）：
          //   ① 缓存键内嵌版本号（上方 cacheKey 模板字面量，查询用 `eq.` 整键精确匹配）
          //      ⇒ 命中行**必然**由本版写链产出，其文本已是「锁链终局」；
          //   ② 写链末还有 `standardizeReport()` 一步（落库前），而 HIT 侧重跑的是**写链的子集**
          //      且时序错位 ⇒ 命中文本与重跑输入**根本不是同一个不动点**，二次施加在数学上无意义；
          //   ③ 实测劣化（12 盘中 5 盘 HIT ≠ 库内文本）：
          //      · `_v432LockLeadingNatal` 把 `Sagittarius 12th House emphasis in your chart — Sun, Moon,`
          //        抠成 `SagittLeo 8th House … —Moon,`（拼接吃字 artifact，s2 en 逐字复现）；
          //      · `applyTruthLocksEnEsZh` 在库内文本上净删 30~64 字；
          //      · `standardizeReport` 二次施加再插一批换行（其 `###`/`---` 换行注入非幂等）。
          // 治法：HIT 直接下发库内文本 ⇒ `HIT 响应 ≡ 落库文本` 由**结构**保证，
          //   不再依赖「每把锁都恰好幂等」这一脆弱前提。被删掉的 HIT 侧补锁（V421/V424-fix4/V432/E16-R11i）
          //   其算子集合均为写链**子集**（enforceRiskThreshold / fixVietnameseCorruption / lockNatalTruth*
          //   / lockYearlyMonthTitles / lockYearlyTransitSigns / applyV434Locks / applyTruthLocksEnEsZh /
          //   _v432LockLeadingNatal / _v517YearlyFinalLocks 在写链 :13450~13486 与 :11724~11751 均已挂载）
          //   ⇒ 删除后 HIT 输出 = 写链输出，信息**只增不减**。旧代码保留于 git 历史。
          //   本条即军师「在锁链开头增加 is_already_locked 判重」的等价实现 —— 版本号就在缓存键里，
          //   命中行天然携带「已锁定」语义，无需再探文本。
          // 仍需真值盘：仅为 `buildHighLatitudeMeta` 计算高纬告知（正文不再拼接）。
          let _hitMatrix = null;
          try { _hitMatrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz, { reportType }); } catch (e) { console.warn('[E18/R11k] HIT matrix fetch failed: ' + e.message); }
          const _hitFinal = stdCached;
          // 🛠️ V427: HIT 路径补 data 字段(让前端 4 卡片能渲染，与 MISS 路径对称)
          const _hitMeta = buildWealthMetaFull(birthDate, lang);
          // 🛡️ E17/R11j ⑤-a: 高纬告知改由 JSON meta 返回（正文不再拼接，前端顶部单独渲染）
          return res.json({ ..._hitMeta.result, cached: true, report: _hitFinal, highLatitudeNotice: buildHighLatitudeMeta(_hitMatrix, lang) });
        }
      } catch (e) {
        console.warn('[wealth-oracle] Cache check error:', e.message);
      }
    }

    // 🛠️ V427: 调用 buildWealthMetaFull 生成命理元数据（与 HIT 路径共用，无重复逻辑）
    const _meta = buildWealthMetaFull(birthDate, lang);
    const { sunSign, dTGDisplay, wuxing, hexName, cardName } = _meta;  // 🛠️ V427: 解构供后续 buildWealthReportPrompt 使用
    const result = _meta.result;
    // ── 报告生成(月报/年报/先天财富DNA)──
    const { includeInsight } = req.body || {};
    if (reportType === 'monthly' || reportType === 'yearly' || reportType === 'once') {
      // ── V69 SwissEph: Fetch computed astro matrix ──
      let astroMatrix = null;
      // 先天财富DNA不需要astroMatrix(静态本命盘)
      if (reportType !== 'once') {
        try {
          astroMatrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz, { reportType }); // 🛠️ V91: 传精确时间/坐标/时区；🛡️ V483: 传报告类型决定时间窗口(年报=财年7月–次年6月)
          if (astroMatrix) console.log(`[Wealth Oracle] [V69] Got matrix (asc=${astroMatrix.meta?.rising_sign})`);
        } catch (e) {
          console.warn('[Wealth Oracle] [V69] Fetch failed:', e.message);
        }
      }

      try {
        console.log('[Wealth Oracle] Generating report:', { birthDate, lang, reportType });
        let prompt;
        try {
          // 💎 先天财富DNA: 独立 Prompt 函数
          if (reportType === 'once') {
            prompt = buildWealthOncePrompt(birthDate, lang, astroMatrix);
          } else {
            // 🛠️ FIX: 月报/年报走 buildWealthReportPrompt（有 astroMatrix 注入行星数据）
            prompt = buildWealthReportPrompt(birthDate, lang, reportType, {
            dayMaster: dTGDisplay,
            wuxing,
            sunSign,
            hexName,
            cardName,
          }, astroMatrix, hasBirthTime);
          }
        } catch (promptErr) {
          console.error('[Wealth Oracle] buildWealthReportPrompt CRASHED:', promptErr.message);
          console.error('[Wealth Oracle] Stack:', promptErr.stack);
          return res.status(500).json({ success: false, error: 'Prompt construction failed: ' + promptErr.message });
        }

        if (!prompt) {
          return res.status(400).json({ success: false, error: 'Invalid reportType' });
        }

        _v433DumpPrompt(prompt);   // V433-DIAG（env 门控）

        // 🛡️ V487: 年报逐月「叙述镜头 + 风控表达框架」注入
        //   与非流式/流式两端点同源 —— 修复端点间提示词漂移(军师 P0 技术债同源问题)。
        if (lang === 'zh' && reportType === 'yearly') {
          prompt.system += buildYearlyLensFrameworkBlock();
        }

        // 🛠️ V211: 月报从 4000→12000
        const maxTokens = reportType === 'yearly' ? 48000 : (reportType === 'once' ? 8000 : 12000);
        const ascendant = astroMatrix?.meta?.rising_sign || 'Cancer';
        const realSunSign = sunSign;  // 🛠️ V120-fix4: 补全非流式端点真实太阳星座(供 inline 清洗 + natal_sun_linter 使用)
        const natalSunSign = sunSign;

        // ── V97f: Astro-Logic Validator 断路器(通不过熔断重调,最多3次)──
        let aiResult = null;
        let _lastRaw = null;
        if (reportType === 'yearly') {
          // 🛡️ E23/R11q ①（2026-10-06）：三处窄化的**同源取材** —— 全部取自 astroMatrix.meta，
          //   杜绝「判据各自硬编码」：
          //   ① 真值窗口 = `meta.report_window`（财年 7 月–次年 6 月，与报告月标题 1:1 对齐；
          //      原写 `new Date()` ⇒ 当月起 12 月，与年报窗口错位，多数月份落空/错月份的月被漏检）；
          //   ② 本命盘 = `meta.computed_houses`（SwissEph Placidus 真值）⇒ 接受「本命合法声明」；
          //   ③ 已供给行星 = 上述真值盘的键集 ⇒ 未提供行星禁则数据驱动（火星实为已供给）。
          // 🛡️ E23/R11q ①b（2026-10-06）：④ 引擎实算流年外行星 = `months[0]`（**与生产 `houseLock`
          //   同源同取材**，见 V82 `jupHouse = getH2(first.jupiter?.house)`）⇒ 消除「等宫粗映射差 1」误报。
          const _v524RW = (astroMatrix && astroMatrix.meta && astroMatrix.meta.report_window) || null;
          const _v524CH = (astroMatrix && astroMatrix.meta && astroMatrix.meta.computed_houses) || null;
          const _v524EF = (astroMatrix && astroMatrix.months && astroMatrix.months[0]) || null;
          const astroTruth = buildAstroTruth(
            birthDate, ascendant, lang,
            _v524RW ? _v524RW.start_year : new Date().getFullYear(),
            _v524RW ? _v524RW.start_month : new Date().getMonth() + 1,
            { natalHouses: _v524CH, providedPlanets: _v524CH ? Object.keys(_v524CH) : null, engineFirstMonth: _v524EF }
          );
          const MAX_RETRY = 3;
          for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
            const r = await callAI(prompt.system, prompt.user, process.env, { maxTokens, reportType });
            _lastRaw = r;
            const v = validateAstroLogic(r, astroTruth, lang);
            if (v.pass) { aiResult = r; break; }
            console.warn(`[Validator] yearly attempt ${attempt + 1}/${MAX_RETRY} FAILED:`, v.errors);
          }
          if (!aiResult) {
            console.error('[Validator] yearly 所有重试均失败,降级交付(含潜在逻辑错误)');
            aiResult = _lastRaw;
          }
        } else {
          aiResult = await callAI(prompt.system, prompt.user, process.env, { maxTokens, reportType });
        }

        // 🛡️ E10/R9-R3: 后处理链提取为局部函数 —— CRITIC 拦截重试时对第二稿复跑同一条链（对称兜底）。
        //   参数 aiResult 有意遮蔽外层同名变量 ⇒ 下方链体逐行零改动（只增首尾两行）。
        const _e10PostProcess = (aiResult) => {
        // ── V97 宫位强制纠正器(铁血断路)──
    // 🛠️ V115-fix3: Body 正文本命太阳全护(在 linter 前全量扫射)
    // 根因:AI 在长文后半段偶发"作为X座之人"等句式,natal_sun_linter 只护句式骨架
    // 治法:在 linter 前全量替换12星座名 → 本命真值(覆盖所有句式变体)
    if (realSunSign) {
      ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].forEach(wrong => {
        if (wrong === realSunSign) return;
        // 斩断所有句式变体
        const _patterns = [
          new RegExp(`作为${wrong}之人`, 'g'),
          new RegExp(`${wrong}之人`, 'g'),
          new RegExp(`你是${wrong}`, 'g'),
          new RegExp(`${wrong}的你`, 'g'),
          new RegExp(`双鱼座(?!座)`, 'g'),  // 防止双鱼座座
        ];
        _patterns.forEach(p => { aiResult = aiResult.replace(p, realSunSign); });
      });
    }
        // 🛠️ V120-fix22: 月报零清洗，只去乱码
        // 💎 先天财富DNA: 简化清洗(不涉及时间线/宫位锁)
        let sanitizedAI;
        if (reportType === 'monthly') {
          // 🛠️ P0-token-fix: 不可变 token → astroMatrix 真值确定性替换(军师 P0 批准·月报 MISS 试点)
          // LLM 原样输出 {{JUPITER_HOUSE}} 等标记,后端用真值渲染,物理上杜绝"木11/冥5"类宫位幻觉
          // 若 LLM 没用 token 而写了"第X宫",下方 house_linter(V166 已部署)兜底纠偏
          let _tokResult = aiResult || '';
          if (astroMatrix && astroMatrix.months && astroMatrix.months[0]) {
            const _first = astroMatrix.months[0];
            const _gH = (v) => typeof v === 'number' ? v : (v?.house ?? v?.natal_house ?? v?.[0] ?? null);
            const _jH = _gH(_first.jupiter?.house);
            const _sH = _gH(_first.saturn?.house);
            const _pH = _gH(_first.pluto?.house);
            const _snH = _gH(_first.sun?.house) ?? 1;
            const _mnH = _gH(_first.moon?.house) ?? 2;
            const _tokMap = {
              '{{JUPITER_HOUSE}}': '第' + _jH + '宫',
              '{{SATURN_HOUSE}}': '第' + _sH + '宫',
              '{{PLUTO_HOUSE}}': '第' + _pH + '宫',
              '{{SUN_HOUSE}}': '第' + _snH + '宫',
              '{{MOON_HOUSE}}': '第' + _mnH + '宫',
            };
            for (const [_t, _v] of Object.entries(_tokMap)) {
              if (_t && _v) _tokResult = _tokResult.split(_t).join(_v);
            }
          }
          sanitizedAI = cleanConsumerTrapAndBrackets(house_linter((_tokResult || '').replace(/\uFFFD/g, ''), astroMatrix));
        } else if (reportType === 'once') {
          // 先天财富DNA: 只做基础清理
          sanitizedAI = (aiResult || '').replace(/�/g,'');
        } else {
          sanitizedAI = house_linter(natal_sun_linter(astro_phase_linter(final_text_sanitizer(aiResult, ascendant, lang)), natalSunSign), astroMatrix);
        }

        // 🛠️ V107-fix3: MISS 路径补全 applyMonthLockSanitizer
        const monthLocked = (reportType === 'yearly' && astroMatrix)
          ? applyMonthLockSanitizer(sanitizedAI, astroMatrix, null, null, lang)
          : sanitizedAI;

        // Parse AI result
        let reportContent = monthLocked;
        // 🛠️ V414: 语言门控(同上)——越南语专用清洗不得作用于其他语言
        // 🛠️ V424: 泰语 MISS 非stream 路径补 lockNatalTruthTh（金额阈值已由 enforceRiskThreshold 覆盖）
        if (lang === 'vi') reportContent = lockNatalTruthVi(enforceRiskThreshold(reportContent, lang), astroMatrix);
        if (lang === 'vi') reportContent = lockTransitTruthVi(reportContent, astroMatrix);
        reportContent = _v433LockMoonWeek(reportContent, lang, astroMatrix);   // V433-fix4
        reportContent = applyV434Locks(reportContent, lang, astroMatrix);   // V434
  if (lang === 'fr') reportContent = lockNatalTruthFr(enforceRiskThreshold(reportContent, lang), astroMatrix);
  if (lang === 'fr') reportContent = lockTransitTruthFr(reportContent, astroMatrix);
        reportContent = _v433LockMoonWeek(reportContent, lang, astroMatrix);   // V433-fix4
        reportContent = applyV434Locks(reportContent, lang, astroMatrix);   // V434
        if (lang === 'th') reportContent = lockNatalTruthTh(enforceRiskThreshold(reportContent, lang), astroMatrix);
        if (lang === 'th') reportContent = lockTransitTruthTh(reportContent, astroMatrix);
        reportContent = _v433LockMoonWeek(reportContent, lang, astroMatrix);   // V433-fix4
        reportContent = applyV434Locks(reportContent, lang, astroMatrix);   // V434
        // 🛠️ V432: MISS 非stream 路径 en/es/zh 真值双锁（与 vi/th/fr 对称）
        if (_V432_LANGS.includes(lang)) reportContent = applyTruthLocksEnEsZh(reportContent, lang, astroMatrix, reportType);
        // 🛡️ E16/R11g-fix: fr/th/vi **不**进真值锁白名单（保守侧, E14 教训）, 但**输出卫生必须过**——
        //   否则英文 `N House` 残渣(实测 vi 38 处/fr 1 处)无人归一。本守卫只换形态、绝不改值。
        else reportContent = _v516OutputHygiene(reportContent, lang);
        reportContent = lockNatalAnchorRole(reportContent, lang, astroMatrix, reportType);   // 🛡️ V444
        reportContent = lockTransitPlanetSigns(reportContent, lang, astroMatrix, reportType); // 🛡️ V445
        reportContent = applyMoonWeekHardOverride(reportContent, lang, astroMatrix);  // 🛡️ V438
        reportContent = lockYearlyMonthTitles(reportContent, lang, astroMatrix, reportType);  // 🛡️ V478b 年报月标题逐月真值锁(最后一道)
        reportContent = normalizeYearlyMarkup(reportContent, lang, reportType);  // 🛡️ V480 年报结构归一(层级/分隔符/标签)
        reportContent = lockYearlyTransitSigns(reportContent, lang, astroMatrix, reportType);  // 🛡️ V482 年报逐月流年行星真值锁
        reportContent = lockYearlyOuterPlanetsYear(reportContent, lang, astroMatrix, reportType);  // 🛡️ V485 年度恒定外行星全文真值锁(木星笔误等越界句)
        reportContent = lockYearlyNonMonthSunRef(reportContent, lang, astroMatrix, reportType);  // 🛡️ V488 年报非月段流年太阳真值锁 + 语义漂移审计(只检不改, 仅日志)
        reportContent = _v432LockLeadingNatal(reportContent, lang, astroMatrix, reportType);  // 🛡️ V492b/E9 年报前导段本命真值强锁(非流式, V488 之后=最终话语权)
        reportContent = stripYearlyPromptLeakage(reportContent, lang, reportType);  // 🛡️ V485b Prompt 字段泄漏清理
        reportContent = _v517YearlyFinalLocks(reportContent, lang, astroMatrix, reportType);  // 🛡️ E17/R11j 年报四锁(轴点/裸本命句/标签残句/落款)
        auditYearlyStyleRepetition(reportContent, lang, reportType);  // 📊 V486 文风复读审计(只检不改, 仅日志)
        // 🛠️ V460-fix4b: 非流式 MISS 路径补月亮轨迹「换宫写在括号外」脏尾归一
        //   根因：V460-fix4 只挂在流式路径(9874)，此端点漏调 → 正文偶发「（第8宫）→第9宫）」悬空脏尾。
        if (reportType === 'monthly') reportContent = fixMoonHouseParens(reportContent);
        // 🛠️ V456: 非流式 MISS 路径补 fixMonthlySectionTitles（V446-trap 陷阱标题归一 + 周标题铁律）
        //   根因：此前此端点漏调 → 陷阱段标题 LLM 漂移未被修复（实锤 "⚠️ Spending Trap：s: Sep 2026] ✦"）。
        //   流式路径(9648 行)与 HIT 路径(1024 行)均已调用，唯独 /api/wealth-oracle 非流式 MISS 路径漏 → 补齐对称。
        //   幂等：规范串复跑不变；只动标题不动正文，置于真值锁之后安全。
        if (reportType === 'monthly') reportContent = fixMonthlySectionTitles(reportContent, true, lang);

        // 🛠️ V394-fix8: 非stream端点MISS路径补齐vi清洗兜底(与stream端点6786对齐)——
        //   fixVietnameseCorruption 此前仅stream挂,导致前端free_access fallback到/api/wealth-oracle时vi吞字(bạnè/trongương)残留
        if (lang === 'vi') {
          reportContent = fixVietnameseCorruption((reportContent || '').normalize('NFC'));
        }

        // ── ⛔ 时间线强行熔断重组(防 DeepSeek Streaming 污染)──
        if (reportType === 'yearly') {
          reportContent = cleanYearlyTimeline(reportContent, lang);
        }
        // 🛡️ V483c: 年报月标题终局去重 —— 全链最末, 兜住 LLM 偶发把同一月的标题写两遍(线上实测 24 行)
        if (reportType === 'yearly') {
          reportContent = dedupYearlyMonthTitles(reportContent, lang, reportType);
        }

        // 🛡️ E20/R11n: 元素归纳段流年坐标剪枝锁（V488d 契约确定性落地, 见函数头注释）——
        //   置于真值锁**之前**：先剪掉无锚点坐标断言, 再让真值链对剪后文本收口。
        if (reportType === 'yearly') {
          reportContent = stripYearlyElementCoordLeak(reportContent, lang, reportType);
        }

        // 🛡️ E21/R11o: 宫位语义标签契约锁（保数字、剪错配标签, 见函数头注释）——
        //   数字层真值锁对「数字全对、标签乱贴」无能为力 ⇒ 独立剪枝, 先剪再让真值链收口。
        reportContent = fixHouseOrdinalSuffix(reportContent);   // 🛡️ E23/R11q ②: 序数后缀笔误归一(形态先行)
        reportContent = stripHouseSemanticLabelMismatch(reportContent, lang, reportType);

        // 🛡️ E19/R11m: 真值锁**最终话语权** —— 全部清洗/去重之后再跑一次本命真值链。
        //   病根（2026-10-05 E19 收官 P0 闭环, s2 en 线上实证）：`_v432LockLeadingNatal` 挂在
        //   链中段（V492b 位置），其「物主本命句」准入依赖句窗内容 —— 只要句窗内有**年份/月份词**
        //   （门控① `_V492B_LEAD_TRANSIT.en` 命中任意 `20\d{2}`、门控② `_V512_MONTH_TOK`），
        //   该句即被判为「流年语境」而弃权（宁漏不改）。链中段此时文本仍带时间线残渣/标题粘连，
        //   于是 `Saturn in Aquarius in your 4th House`（本命 H2）整批漏纠 ⇒ CRITIC 判据12 余警；
        //   而这些残渣随后被 cleanYearlyTimeline/dedup 清掉 ⇒ 落库文本的句窗反而是干净的
        //   （⇒ 离线重放该锁能修、线上产物却保留错值，E18/E19 两次「离线能修、线上不修」之谜的真因）。
        //   治本：把真值链放到**所有文本清理之后**收口 —— 此时句窗干净，纠值成立；且实测
        //   对 11/12 盘是**零 churn**（Δ=0），对残差盘恰好修好，二次施加严格幂等（12/12 Δ=0）。
        if (reportType === 'yearly') {
          reportContent = _v432LockLeadingNatal(reportContent, lang, astroMatrix, reportType);
        }

        // 🛡️ E22/R11p: 宫位语义标签契约锁**链末收口**（与 E21 同源同表，第二次施加，幂等）。
        //   病根（2026-10-06 E21/R11o 收编 s13 首跑捕获的 P0）：上面这道 E19/R11m 链末真值锁
        //   `_v432LockLeadingNatal` 会把**本命行星真值**误绑到同句**流年子句**的宫号上 ——
        //   例：`… your Jupiter in Scorpio … in your 7th House of Partnership`（natal 木星真值 = H10）
        //   ⇒ 数字 7 被改写成 10、而标签 Partnership **原地不动** ⇒ 造出 `10th House of Partnership`
        //   （「数字被真值锁动过、标签却是别人家的」新形态）。E21 锁挂在真值锁**之前**
        //   ⇒ 该后置错配无任何下游清洗，直达落库（c14 有牙但重试稿同样过链末真值锁 ⇒ 二次污染）。
        //   治法（军师裁定 方案①·最小改动）：在所有清理/真值收口**之后**把标签契约锁再施加一次。
        //   纯过滤器 + 幂等（对已合规文本零改动、对合规标签零误伤）⇒ 与 E19「链末重跑」同一哲学，
        //   不触碰上游 `_v432LockLeadingNatal` 的物主绑定核心逻辑（零新逻辑、零侧效应）。
        reportContent = fixHouseOrdinalSuffix(reportContent);   // 🛡️ E23/R11q ②: 序数后缀笔误归一(链末再兜一次)
        reportContent = stripHouseSemanticLabelMismatch(reportContent, lang, reportType);

        // 🛡️ V492/R5: 高纬告知——WholeSignFallback 盘首段注入等宫制告知（后端拼接，非 LLM 生成）
        reportContent = injectHighLatitudeNotice(reportContent, astroMatrix, lang);
        return reportContent;
        };  // ── end _e10PostProcess ──
        let reportContent = _e10PostProcess(aiResult);

        console.log('[Wealth Oracle] Report generated successfully, length:', aiResult.length);

        // ═══ 🛡️ E10/R9-R3（军师裁决 3）: 预检判定 → 有限 1 次静默重试 → 终局裁定 ═══
        //   判定 = wealthCriticCheck（报头/元素等风格真值）+ assessYearlyReportIntegrity（截断红线）。
        //   拦截 → 用 _E10_RETRY_CONSTRAINT 强约束 prompt 重生成一次 → 第二稿复跑同一条
        //   _e10PostProcess 后处理链（纠偏兜底对称）→ _e10CacheDecision 终局裁定：
        //   normal 零瑕疵正常入库｜force 有瑕疵但纠偏链已尽力 → 带标记入库（保服务成功率）｜
        //   block 截断 → 绝不入库（Adelaide 毒缓存铁律，重试也不豁免）。
        let skipCache = false;
        if (reportType === 'yearly') {
          const _e10Judge = (txt) => ({
            // 🛡️ E11/R10a: 必须传 lang —— wealthCriticCheck 的报头/月份/元素判据全部依赖语言适配
            // 🛡️ E12/R11c: 必须传 astroMatrix —— 判据 12 全章本命声称真值错配检测依赖 SwissEph 真值盘
            issues: wealthCriticCheck(txt, birthDate, natalSunSign, lang, astroMatrix),
            // 🛡️ E17/R11j: 轴点度量由本处**统一计算**后传入（判据同源）—— integrity 只做可观测输出
            iv: assessYearlyReportIntegrity(txt, Object.assign(
              { lang },
              (() => { const a = auditYearlyAxisAnchor(txt, lang, astroMatrix, reportType); return a ? { axisMismatch: a.mismatch.length, axisTrueSign: a.trueSign } : {}; })()
            )),
          });
          let _j1 = _e10Judge(reportContent);
          if (_j1.issues.length > 0 || !_j1.iv.ok) {
            console.warn('[E10/R9] 第 1 稿被预检拦截 → 静默重试 1/1（强约束 prompt）',
              JSON.stringify(_j1.issues), !_j1.iv.ok ? ('| 完整性: ' + _j1.iv.reasons.join('; ')) : '');
            try {
              const _strongSystem = prompt.system
                + _E10_RETRY_CONSTRAINT(lang,
                  astroMatrix && astroMatrix.meta ? astroMatrix.meta.sun_sign : null,
                  astroMatrix && astroMatrix.meta ? astroMatrix.meta.rising_sign : null);
              const _r2 = await callAI(_strongSystem, prompt.user, process.env, { maxTokens, reportType });
              const _rc2 = _e10PostProcess(_r2);
              const _j2 = _e10Judge(_rc2);
              const _d = _e10CacheDecision(_j1, _j2);
              if (_d.useRetryText) { reportContent = _rc2; _j1 = _j2; }
              console.log('[E10/R9] 重试终局裁定:', _d.action, _d.useRetryText ? '(采用重试稿)' : '(重试稿截断, 保留首稿)');
            } catch (_e) {
              console.warn('[E10/R9] 重试生成失败, 保留首稿走终局裁定:', _e.message);
            }
            // 终局裁定 → skipCache
            const _fin = _j1;
            if (!_fin.iv.ok) {
              console.error('[E10/R9] 🚨 截断红线: 完整性仍不足, 拒绝写缓存:', _fin.iv.reasons.join('; '));
              skipCache = true;
            } else if (_fin.issues.length > 0) {
              console.warn('[E10/R9] 强后手: 纠偏链已尽力, 带标记写入缓存:', JSON.stringify(_fin.issues));
            } else {
              console.log('[E10/R9] 重试稿预检全过 ✅ 正常入库');
            }
          } else {
            console.log('[CRITIC] 预缓存校验通过 ✅');
          }
        }

        // 🛡️ E18/R11k: **响应文本与落库文本必须逐字同源**（军师裁决：Text(MISS) ≡ Text(HIT) 逐字）。
        //   病根：落库写的是 `standardizeReport(reportContent)`（:11866），而响应返回的是 `reportContent` 原样
        //   ⇒ 同一份报告「首屏（MISS）」与「刷新（HIT）」排版不同（12 盘实测长度差 35~156 字，全为
        //   `###`/`---` 前后换行与 ✦ 注入）。`standardizeReport` 的换行注入**非幂等**，
        //   故必须**只算一次**、两处共用同一字符串（否则又变成两次独立施加）。
        const _finalText = _v525WellFormed('nonstream/' + lang + '/' + reportType, standardizeReport(reportContent));

        // ═══ 写入缓存(非流式端点)═══
        if (SB_URL && SB_KEY && _finalText && _finalText.length > 100 && !skipCache) {
          try {
            const _wRes = await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache`, {
              method: 'POST',
              headers: {
                'apikey': SB_KEY,
                'Authorization': `Bearer ${SB_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=ignore-duplicates'
              },
              body: JSON.stringify({
                cache_key: cacheKey,
                insight: _finalText,
                prompt_version: `v1.0.0-${reportType}-${lang}`,
                created_at: new Date().toISOString(),
              })
            });
            // 🛡️ E23/R11q ④: **必须校验 res.status** —— 旧写法只打「Cache write」不校验，
            //   于是 400 PGRST102（孤立代理项致非法 JSON）等失败**完全不可见** ⇒「静默不落库 ⇒ 永不命中」。
            //   与流式 `writeToCache`（本就打印 status 与 WRITE-FAIL body）对齐，消除观测盲区。
            console.log(`[wealth-oracle] [WRITE] Cache write: ${cacheKey}, length=${_finalText.length}, status=${_wRes ? _wRes.status : '?'}`);
            if (_wRes && !_wRes.ok) {
              const _wb = await _wRes.text().catch(() => '');
              console.warn(`[wealth-oracle] [WRITE-FAIL] status=${_wRes.status} body=${String(_wb).slice(0, 300)}`);
            }
          } catch (e) {
            console.warn('[wealth-oracle] Cache write error:', e.message);
          }
        }

        // 🛡️ E17/R11j ⑤-a: 高纬告知改由 JSON meta 返回（正文不再拼接，前端顶部单独渲染 Banner）
        // 🛡️ E18/R11k: `report` 用 `_finalText` —— 与落库同一字符串 ⇒ MISS 响应 ≡ HIT 响应（逐字）。
        return res.json({ ...result, report: _finalText, insight: '', highLatitudeNotice: buildHighLatitudeMeta(astroMatrix, lang) });
      } catch (aiError) {
        console.error('[Wealth Oracle] AI generation failed:', aiError.message);
        return res.status(500).json({ success: false, error: 'AI generation failed: ' + aiError.message });
      }
    }

    res.json(result);
  } catch (err) {
    console.error('[wealth-oracle]', err.message, err.stack);
    // 🛡️ V490/V490b: 入参类错误必须仍是 400（而非被兜成 500）—— 保住「可区分」的语义
    if (err && (err.code === 'INVALID_TIMEZONE' || err.code === 'INVALID_COORDINATES')) {
      return res.status(400).json({ success: false, code: err.code, error: err.message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── /api/test-gemini ──
app.get('/api/test-gemini', async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ error: 'GEMINI_API_KEY not set' });
  try {
    const r = await safeFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 50 } }),
      }
    );
    const data = await r.json();
    res.json({ status: r.status, data });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ── /api/ai-advisor (REST API版,无Supabase客户端依赖) ──
app.use('/api/ai-advisor', async (req, res) => {
  try {
    const { d1, d2, lang = 'zh', reportType = 'compatibility' } = req.body || {};

    // ── 月报/年报生成(AI 调用)──
    if (reportType === 'monthly' || reportType === 'yearly') {
      try {
        console.log('[AI Advisor] Generating report:', { d1, d2, lang, reportType });
        const prompt = buildCompatibilityReportPrompt(d1, d2, lang, reportType);

        const insight = await callAI(
          `You are a relationship astrologer generating a ${reportType} report.`,
          prompt,
          process.env
        );

        console.log('[AI Advisor] Report generated, length:', insight.length);
        return res.json({ insight, cached: false });
      } catch (aiError) {
        console.error('[AI Advisor] AI generation failed:', aiError.message);
        return res.status(500).json({ error: 'AI generation failed: ' + aiError.message });
      }
    }

    // ── 普通合盘洞察(旧逻辑)──
    const cacheKey = `${d1 || ''}|${d2 || ''}|${lang}|${reportType}`;
    const since = new Date(Date.now() - 24*3600*1000).toISOString();

    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

    // ── 检查缓存(直接用 REST API)──
    const cacheRes = await safeFetch(
      `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&created_at=gte.${since}&select=insight`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    const cached = await cacheRes.json();
    if (cached?.[0]?.insight) {
      return res.json({ insight: cached[0].insight, cached: true });
    }

    const LANG_NAME = {zh:'中文',en:'English',es:'Español',fr:'Français',th:'ภาษาไทย',vi:'Tiếng Việt'};

    // ── V9 塔罗方向锁 prompt(从 web/api/ai-advisor.js 迁移,2026-07-19)──
    const tarotOrient = (req.body.tarot && req.body.tarot.orientation) ? req.body.tarot.orientation : '';
    const isReversed = tarotOrient.includes('Reversed') || tarotOrient.includes('Invertido') || tarotOrient.includes('Inversé') || tarotOrient.includes('กลับด้าน') || tarotOrient.includes('Ngược');
    const isUpright  = tarotOrient.includes('Upright')  || tarotOrient.includes('Derecho')   || tarotOrient.includes('Droit')     || tarotOrient.includes('ตั้งตรง') || tarotOrient.includes('Xuôi');

    // 各语言塔罗正逆位强制锁(从 V9 迁移)
    const tarotLock =
      lang === 'zh' ? (isReversed ? '【强制】塔罗牌为逆位,全程禁止出现"正位"或"Upright"字样。' : isUpright ? '【强制】塔罗牌为正位,全程禁止出现"逆位"或"Reversed"字样。' : '') :
      lang === 'en' ? (isReversed ? '[LOCK] Tarot is Reversed. FORBIDDEN: upright, Upright, 正位. ALWAYS say Reversed.' : isUpright ? '[LOCK] Tarot is Upright. FORBIDDEN: reversed, Reversed, 逆位. ALWAYS say Upright.' : '') :
      lang === 'es' ? (isReversed ? '[BLOQUEO] La carta es Invertido. PROHIBIDO: upright, Derecho.' : isUpright ? '[BLOQUEO] La carta es Derecho. PROHIBIDO: inverted, Invertido.' : '') :
      lang === 'fr' ? (isReversed ? '[VERROU] La carte est Inversé. DÉFENDU: upright, Droit.' : isUpright ? '[VERROU] La carte est Droit. DÉFENDU: reversed, Inversé.' : '') :
      lang === 'th' ? (isReversed ? '[🔒] ไพ่กลับด้าน ห้ามพูด"ตั้งตรง"หรือ"Upright"แม้แต่คําเดียว' : isUpright ? '[🔒] ไพ่ตั้งตรง ห้ามพูด"กลับด้าน"หรือ"Reversed"แม้แต่คําเดียว' : '') :
      lang === 'vi' ? (isReversed ? '[KHOÁ] Lá bài là Ngược. CẤM: Xuôi, Upright. Luôn nói Ngược.' : isUpright ? '[KHOÁ] Lá bài là Xuôi. CẤM: Ngược, Reversed. Luôn nói Xuôi.' : '') :
      '';

    const bazi = req.body.bazi || '未知';
    const zodiac = req.body.zodiac || '未知';
    const iching = req.body.iching || '未知';

    const prompt = reportType === 'compatibility'
      ? (lang === 'zh' ? `${tarotLock}${tarotLock ? ' ' : ''}你是一位资深命理情感顾问。综合八字${bazi}、星座${zodiac}、易经${iching}的数据,对 ${d1} 和 ${d2} 的合盘给出温暖、专业、积极的4句话情感洞察。只用中文输出,不预测分手或负面结局,始终给予希望和具体行动建议。` :
        lang === 'en' ? `${tarotLock}${tarotLock ? ' ' : ''}You are the AI relationship advisor for KindredSouls. Based on: Bazi=${bazi}, Zodiac=${zodiac}, I Ching=${iching}. Give 4 warm, professional, positive sentences of relationship insight for ${d1} and ${d2}. Only English. Never predict breakups. Always give hope and specific actionable advice.` :
        lang === 'es' ? `${tarotLock}${tarotLock ? ' ' : ''}Eres el consejero sentimental IA de KindredSouls. Basado en: Bazi=${bazi}, Zodiaco=${zodiac}, I Ching=${iching}. Da 4 frases cálidas y positivas sobre ${d1} y ${d2}. Solo español. Nunca predigas ruptura.` :
        lang === 'fr' ? `${tarotLock}${tarotLock ? ' ' : ''}Tu es le conseiller sentimental IA de KindredSouls. Basé sur: Bazi=${bazi}, Zodiac=${zodiac}, I Ching=${iching}. Donne 4 phrases chaleureuses et positives sur ${d1} et ${d2}. Seulement français. Ne prédis jamais de rupture.` :
        lang === 'th' ? `${tarotLock}${tarotLock ? ' ' : ''}คุณเป็นที่ปรึกษาความสัมพันธ์ AI ของ KindredSouls จากข้อมูล: บาซี=${bazi}, ราศี=${zodiac}, อี้จิง=${iching} ให้ 4 ประโยคที่อบอุ่นและเชิงบวกเกี่ยวกับความสัมพันธ์ระหว่าง ${d1} และ ${d2} เป็นภาษาไทยเท่านั้น` :
        lang === 'vi' ? `${tarotLock}${tarotLock ? ' ' : ''}Bạn là cố vấn mối quan hệ AI của KindredSouls. Dựa trên: Bazi=${bazi}, Zodiac=${zodiac}, I Ching=${iching}. Đưa ra 4 câu ấm áp, tích cực về mối quan hệ giữa ${d1} và ${d2}. Chỉ tiếng Việt. Không dự đoán chia tay.` :
        `分析 ${d1} 和 ${d2} 的命理合盘。温暖、积极的情感解读。`)
      : `分析 ${d1} 的财富格局。专业财富建议,禁止输出其他语言。`;


    // ── DeepSeek 直连,失败自动切 Gemini 免费层 ──
    let insight = '';
    const deepseekKey = getDeepSeekKey();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (deepseekKey) {
      try {
        const aiRes = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
          body: JSON.stringify({ model: 'deepseek-flash', thinking: { type: 'disabled' }, messages: [{ role: 'user', content: prompt }], max_tokens: 800, temperature: 0.35 }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          insight = aiData.choices?.[0]?.message?.content?.trim() || '';
        } else {
          console.warn(`[ai-advisor] DeepSeek failed (${aiRes.status}), falling back to Gemini`);
        }
      } catch (e) {
        console.warn(`[ai-advisor] DeepSeek error: ${e.message}, falling back to Gemini`);
      }
    }

    // Gemini 免费层 fallback
    if (!insight && geminiKey) {
      try {
        const gemRes = await safeFetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: { parts: [{ text: '你是一个财富月报生成器。绝对禁止输出任何英文指令、自我纠错记录、思考过程或指令摘要。你的输出必须直接以报告正文开头，第一个字符必须是「✦」。禁止输出任何类似"No English"、"Self-Correction"、instruction summary 等元文本。' }] },
              generationConfig: { maxOutputTokens: 800, temperature: 0.3 },
            }),
          }
        );
        if (!gemRes.ok) throw new Error(`Gemini ${gemRes.status}`);
        const gemData = await gemRes.json();
        insight = gemData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (insight) console.log('[ai-advisor] [OK] Gemini fallback used');
      } catch (e) {
        console.error('[ai-advisor] Gemini fallback failed:', e.message);
      }
    }

    if (!insight) return res.status(500).json({ error: 'All AI providers failed' });

    // ── 写入缓存(直接 REST)──
    await safeFetch(
      `${SB_URL}/rest/v1/ai_insights_cache`,
      {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ cache_key: cacheKey, insight, prompt_version: `v1.0.0-${reportType || 'single'}-${lang}` })
      }
    );

    res.json({ insight, cached: false });
  } catch (err) {
    console.error('[ai-advisor]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Serve static frontend (dist/) ──
const distPath = join(__dirname, 'web', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: 所有非 /api 路由返回 index.html（包括 /）
  // 🛠️ V120-fix28: 使用正则表达式兼容新版 path-to-regexp
  app.get(/.*/, (req, res, next) => {
    if (!req.path.startsWith('/api') && existsSync(join(distPath, 'index.html'))) {
      return res.sendFile(join(distPath, 'index.html'));
    }
    next();
  });
}

// ───────────────────────────────────────────────────────────────────────
// V103-fix6: 报告内容标准化(统一章节格式,解决缓存/实时生成不一致)
// 写入缓存前调用,确保所有缓存数据格式统一
// ───────────────────────────────────────────────────────────────────────
function standardizeReport(text) {
  if (!text || typeof text !== 'string') return text;
  let t = text;

  // 0. 蒸发图片残留碎屑
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, '');  // ![](...)
  t = t.replace(/!\[[^\]]*\]/g, '');              // 裸 ![alt]

  // 1. 主标题头拆分--命运宿主从标题行剥离(若有)
  // 处理 "## ✦ 先知神谕 · 财富启示录 ✦ * ◆ **命运宿主**" 单行问题
  t = t.replace(/(\s)\* ◆ \*\*命运宿主\*\*:?\s*/g, '\n命运宿主:');

  // 2. 章节标题统一注入 ✦(主要章节:第一章~第五章 + 最终财富神谕)
  // 模式:## [emoji]? 第X章/最终财富神谕 + 可选内容
  // 只处理还没有 ✦ 的行,避免重复注入
  const chapterMap = [
    // 第一章~第五章
    [/^(\s*)(## [\p{Emoji}]*\s*)(第一章:[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    [/^(\s*)(## [\p{Emoji}]*\s*)(第二章:[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    [/^(\s*)(## [\p{Emoji}]*\s*)(第三章:[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    [/^(\s*)(## [\p{Emoji}]*\s*)(第四章:[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    [/^(\s*)(## [\p{Emoji}]*\s*)(第五章:[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    // 最终财富神谕
    [/^(\s*)(## [\p{Emoji}]*\s*)(最终财富[^✦\n]*?)(\s*)$/um, '$1✦\n$2$3 ✦\n$4'],
  ];
  for (const [pattern, replacement] of chapterMap) {
    if (!pattern.test(t)) { pattern.lastIndex = 0; if (pattern.test(t)) {} } // reset
    t = t.replace(pattern, replacement);
  }

  // 3. 换行修复:月份标题前 + 子章节前 + 分割线前后
  t = t.replace(/####\s*📅/g, '\n#### 📅');
  // 🛠️ V481-fix: 原写法 `/###\s+/g` 会把「≥4 个 #」的标题从**第 2 个 # 处劈开**:
  //   `#### 2026年9月：…` → `#` + `\n### 2026年9月：…`, 再被 V480 补成「# 」空标题行
  //   → 生产端实测每个月份标题前多一条空 `# `(12 条), 渲染成空 H1 破坏排版。
  //   加「前一字符非 #」负向回顾, 只劈独立的 `### `, 不再误伤 `####`/`#####`。
  t = t.replace(/(?<!#)###\s+/g, '\n### ');
  t = t.replace(/---/g, '\n---\n');

  // V103-fix14: 清理月份标题中的 "Sun in"(不依赖 ### 📅,覆盖所有格式)
  t = t.replace(/(\d{4}年\d{1,2}月):\s*Sun\s+in\s+/g, '$1: ');

  // V103-fix17: 末尾 trim + 消除章节标题前的残留空格
  // Step3 的 `###\s+` 注入换行,但若文本本身以空格开头会变成 "\\n 第一章";此行兜底清理
  t = t.replace(/\n +(\*{0,2}\s*(?:第[一二三四五六七八九十\d]+章|最终财富|通关密令))/g, '\n$1');

  // 🛠️ V107-fixB3: 终极乱码清洗--standardizeReport 的 emoji regex 和 ✦ 注入在 Unicode 处理中
  // 可能产生二次 FFFD 乱码。此刀作为返回前最后一道防线,不依赖之前的位置标记,直接通杀
  t = t.replace(/[\uFFFD]/g, '').replace(/[\uFFFE\uFFFF]/g, '').trim();

  return t;
}

// ═══════════════════════════════════════════════════════════════════════
// 🌊 流式输出端点:SSE (Server-Sent Events)
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/wealth-oracle/stream', async (req, res) => {
  // 🛠️ V97r 部署验证标识:真生产 KindredSouls 日志里看到这个 = V97r 代码已生效
  console.log('[V97r-DEPLOY-MARKER] stream endpoint hit, body-encoding=TextEncoder');

  // 🛠️ V91+: 出生时间/经纬度/时区(默认 Bangkok 中午)
  const {
    birthDate,
    birthTime,  // ⚠️ V176c-fix: 无默认值，缺省时 hasBirthTime=false 触发 Solar House 降级
    lang = 'zh',
    reportType = 'monthly',
  } = req.body;
  // 🛠️ V102s: 是否真提供出生时间(未提供→报头不声称上升)
  const hasBirthTime = typeof req.body.birthTime === 'string' && req.body.birthTime.trim().length > 0;
  // 🛠️ V361: 日期合法性校验（返回 SSE 格式错误，前端 stream reader 可捕获，不截断管道）
  const _dp = birthDate ? birthDate.split('-').map(Number) : null;
  const _badDate = (() => {
    if (!_dp || _dp.length !== 3 || _dp.some(isNaN)) return 'birthDate 格式错误';
    const _td = new Date(birthDate + 'T00:00:00');
    if (isNaN(_td.getTime()) || _td.getFullYear() !== _dp[0] || _td.getMonth() + 1 !== _dp[1] || _td.getDate() !== _dp[2]) return '出生日期不存在: ' + birthDate + '（如2月30日）';
    return null;
  })();
  if (_badDate) {
    res.write(Buffer.from('data: ' + JSON.stringify({ error: _badDate }) + '\n\n', 'utf-8'));
    res.end();
    return;
  }
  // 🛡️ V490: 时区强校验与三级回退 —— 必须在 SSE header 建立/首包下发**之前**返回 400，
  //   否则前端只会看到一个 200 的 SSE 管道里塞错误（假绿）。故放在此处（早于 heartbeat/header）。
  //   ⚠️ 传**原始** lat/lon 做 Tier-2 推定（坐标合法性由下方 V490b 闸门独立把关）。
  const _tzr = resolveTimeZone(req.body.tz, req.body.lat, req.body.lon);  // ⚠️ 传原值(不预转 Number)：null 不可被 Number() 洗成 0
  if (!_tzr.ok) {
    console.warn(`[TZ_FALLBACK_WARNING] (stream) 无法解析时区 input=${JSON.stringify(req.body.tz)} lat=${req.body.lat} lon=${req.body.lon} → HTTP 400`);
    return res.status(400).json({ success: false, code: 'INVALID_TIMEZONE', error: `Invalid time zone: ${req.body.tz}` });
  }
  const tz = _tzr.tz;
  if (_tzr.corrected) {
    console.warn(`[TZ_RESOLVED] (stream) ${JSON.stringify(_tzr.input)} → ${tz} (tier=${_tzr.tier}/${_tzr.reason}`
      + `${_tzr.distanceKm != null ? ', dist=' + _tzr.distanceKm.toFixed(1) + 'km' : ''})`);
  }

  // 🛡️ V490b: 坐标强校验（同 /api/wealth-oracle）—— 同样必须在 SSE header 之前返回 400
  const _coord = resolveCoordinates(req.body.lat, req.body.lon);
  if (!_coord.ok) {
    console.warn(`[COORD_REJECTED] (stream) lat=${JSON.stringify(req.body.lat)} lon=${JSON.stringify(req.body.lon)} → HTTP 400 (${_coord.reason}: ${_coord.message})`);
    return res.status(400).json(invalidCoordinatesBody(_coord.message));
  }
  const lat = _coord.lat;
  const lon = _coord.lon;

  // ═══ 🛍️ E24⑥ 权益闸门（流式主路径）═══
  //   铁律同 tz/坐标闸门：必须在 SSE header 建立**之前**以 JSON 402 返回，
  //   否则前端只会看到一个 200 的 SSE 管道里塞错误（假绿、且会吞掉 402 分支）。
  if (WEALTH_PAID_REPORT_TYPES.has(reportType)) {
    const _ent = await resolveWealthEntitlement(req, reportType);
    if (!_ent.ok) {
      console.log(`[E24⑥] (stream) entitlement DENIED reason=${_ent.reason} type=${reportType} date=${birthDate}`);
      let _previewData = null;
      try { _previewData = buildWealthMetaFull(birthDate, lang).result.data; } catch (e) { console.warn('[E24⑥] (stream) preview build failed:', e.message); }
      return res.status(402).json({
        error: 'Payment required',
        code: 'ENTITLEMENT_REQUIRED',
        requiredPlan: requiredPlanFor(reportType),
        data: _previewData,
        preview: true,
      });
    }
    console.log(`[E24⑥] (stream) entitlement GRANTED via ${_ent.method} type=${reportType}`);
  }

  console.log(`[wealth-stream] [STREAM] Stream request: ${birthDate}/${lang}/${reportType}`);

  // 🛠️ V122-fix: SSE 心跳保活--Railway hikari 代理在 AI 首字延迟/生成停顿期会因 idle 掐断长连接 (curl 92 / ERR_HTTP2_PROTOCOL_ERROR);每 8s 发注释事件保活
  // 🛠️ V362: 1KB 重型心跳——每 8s 发送 1024 字节空格垫片，强制挤满 Nginx 缓冲区立即刷盘
  // 旧版 ': heartbeat\n\n' 仅 13 字节，极易被代理层静默挂起积压，满 30s 超时砍连接
  const _hb = setInterval(() => {
    try {
      res.write(': ' + ' '.repeat(1024) + '\n\n');
      if (typeof res.flush === 'function') res.flush();
    } catch (e) {}
  }, 8000);
  // V343: 客户端断连 → 立即 abort 上游 AI 请求（防烧钱：用户关页面/断网后 Gemini/DeepSeek 不再继续跑完）
  let _aiCtrl = null;
  res.on('close', () => {
    try { clearInterval(_hb); } catch (e) {}
    if (_aiCtrl) {
      try { _aiCtrl.abort(); console.warn('[V343] 🔌 客户端断连，已 abort 上游 AI 请求'); } catch (e) {}
    }
    console.warn('[wealth-stream] ⚠️ 连接关闭:', { destroyed: res.destroyed, writableEnded: res.writableEnded, writableFinished: res.writableFinished });
  });
  res.on('error', (e) => console.error('[wealth-stream] ❌ res error:', e && e.message));


  // 🛠️ V362: SSE Header 组合拳——强破 Nginx/hikari 代理层缓冲
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-No-Compression', '1');      // 绕过 compression 中间件（若有）
  res.setHeader('X-Deploy-Marker', 'V124-keep-alive');
  res.setHeader('Connection', 'keep-alive');
  // HTTP 200 握手建立后立刻冲刷首包 Header，防止代理层等待
  if (res.flushHeaders) res.flushHeaders();


  // 🔥 军师缓存键 (V178-P0 升级): 纳入 birthTime/lat/lon/tz, 杜绝跨用户串盘
  // 🛡️ V483c: 与 /api/wealth-oracle 对齐 —— 支持 `nocache` 强制跳过 HIT（线上真值复验要跑真实生成链）
  const noCache = req.body.nocache === true || req.body.noCache === true;
  const _ckTime = birthTime || '12:00';
  // 🛡️ V490b: 此处 lat/lon 已由 resolveCoordinates 校验为数值（见端点入参第一关）
  const _ckLat = lat.toFixed(4);
  const _ckLon = lon.toFixed(4);
  const _ckTz = tz || 'Asia/Bangkok';
  const cacheKey = `wealth:v529:${birthDate}:${_ckTime}:${_ckLat}:${_ckLon}:${_ckTz}:${lang}:${reportType}`;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  // ═══ 第一道拦截:Cache Hit → 伪流式 ═══
  // 🛠️ V185: 占位符替换需要 astroMatrix,提前计算(HIT/MISS 共用)
  let astroMatrix = null;
  try {
    astroMatrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz, { reportType });   // 🛡️ V483: 年报=财年 7 月–次年 6 月 / 月报=当月起
    if (astroMatrix) {
      console.log(`[wealth-stream] [V69] Got matrix: asc=${astroMatrix.meta?.rising_sign}, lat=${lat}, lon=${lon}`);
    }
  } catch (e) {
    // 🛡️ V490/V490b: 入参闸门（时区/坐标）在更早处已拦截，故此处理论上不可达；
    //   但**绝不静默吞掉** —— 显式下发错误帧并结束，避免"降级继续出盘"的伪造成功。
    if (e && (e.code === 'INVALID_TIMEZONE' || e.code === 'INVALID_COORDINATES')) {
      console.error(`[wealth-stream] ${e.code} 在引擎调用处上抛（入参闸门未拦住，异常路径）`);
      try { clearInterval(_hb); } catch { /* noop */ }
      try { res.write(`data: ${JSON.stringify({ error: e.message, code: e.code })}\n\n`); } catch { /* noop */ }
      try { res.end(); } catch { /* noop */ }
      return;
    }
    console.warn('[wealth-stream] [V69] Fetch failed, proceeding without V69:', e.message);
  }

  // ===== [V238-STREAM-META] 优先推送结构化元数据供前端报头渲染 =====
  try {
    const metaPayload = buildWealthMeta(birthDate, lang, astroMatrix);
    // V239: 注入动态风控门槛 + 宫位元数据(前端 meta 事件未来可视化用)
    try {
      const _ctx = buildWealthPromptContext(lang, metaPayload);
      metaPayload.riskControl = {
        currency: _ctx.curr.currency,
        symbol: _ctx.curr.symbol,
        baseRisk: _ctx.curr.baseRisk,
        maxWeekly: _ctx.curr.maxWeekly,
      };
      metaPayload.houseInfo = { sunHouse: _ctx.sunHouse, risingSign: _ctx.risingSign, sunSign: _ctx.sunSign };
    } catch (e) { /* meta 兜底不阻断 */ }
    // 🛡️ E17/R11j ⑤-b: 高纬降级告知随 meta 下发（正文不再拼接 ⇒ 前端页面顶部独立 Banner 渲染）
    try {
      const _hl = buildHighLatitudeMeta(astroMatrix, lang);
      if (_hl) metaPayload.highLatitudeNotice = _hl;
    } catch (e) { /* 不阻断 */ }
    res.write(Buffer.from(`data: ${JSON.stringify({ meta: metaPayload })}\n\n`, 'utf-8'));
    if (typeof res.flush === 'function') res.flush();
  } catch (e) {
    console.warn('[wealth-stream] [V238-META] build failed:', e.message);
  }

  // ── [V444 9-14 摘除] factTree SSE 事件已下线(前端不再消费，内部真值层仅V444后处理调用 astroMatrix)──
  try { /* no-op */ } catch (e) {
    console.warn('[wealth-stream] [B-FACTTREE] emit failed:', e.message);
  }

  try {
    if (SB_URL && SB_KEY && !noCache) {
      const cacheRes = await safeFetch(
        `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=insight&order=created_at.desc&limit=1`,
        { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
      );
      const cacheRows = await cacheRes.json();
      const cachedText = cacheRows?.[0]?.insight;

      // 🛡️ V222z-fix9: 最小长度检查——若缓存文本 <3000字（正常月报应 >5000），说明是历史残缺缓存，强制穿透重新生成
      // 🛠️ V394-fix4: HIT 入口 vi 脏缓存拦截——任何 9-06 前旧脏缓存(不含₫500,000正确阈值/含乱码/越界大额/拆词)直接视为 MISS 强制重生成
      //   拆词信息已丢失(ậ n 无法复原 ận),清洗不可逆,只能弃缓存重生成。
      //   正向健康校验:我 V383+ 所有 vi 月报必含 ₫500,000;凡不含即 9-06 前旧数据→拦截。
      const _viDirtyHit = lang === 'vi' && (
        (cachedText || '').includes('�') ||                          // U+FFFD 乱码方块(9-06 StringDecoder前产物)
        !/(?:500[.,]000\s*₫|₫\s?500[.,]000)/.test(cachedText || '') ||   // 🛠️ V437-fix: 兼容前后缀两种阈值写法——提示词第326行强制「金额一律写作 500.000 ₫」，而 V394 守卫只认 ₫500,000 → vi 缓存恒判脏、永远 MISS 全量重算
        /[2-9]\.000\.000|\d{2,}\.000\.000|5\.000\.000|7\.000\.000/.test(cachedText || '') ||  // 越界大额VND
        /Vậ\s+n|Mệ\s+nh|Thá\s+ng|Dươ\s+ng|Nă\s+ng|lượ\s+ng|Mặ\s+t|chiế\s+u|chuyệ\s+n|cuộ\s+c|mộ\s+t|đượ\s+c/i.test(cachedText || '')  // 拆词型
      );
      if (_viDirtyHit) {
        console.warn(`[V394] HIT缓存含vi拆词脏文本, 拦截强制MISS重生成: ${cacheKey}`);
      }
      if (cachedText && !_viDirtyHit && cachedText.length > 2000 && cachedText.length > 3000) {
        // ── V113: 缓存命中 → 完美终稿直传(写入时已清洗,读取时零处理)──
        console.log(`[wealth-stream] [HIT] Cache HIT: ${cacheKey}, length=${cachedText.length}, instant response`);
        // V113: 写入时已跑完全套清洗,缓存=完美终稿;读取时零处理直接分块 SSE 输出
        // V113-fix: 缓存已是完美终稿,直接分块 SSE 输出,跳过双重清洗
        // V113-fix3: HIT路径补全全套处理链,与MISS client内容完全一致
        // HIT路径重新计算 realSunSign(定义在MISS路径,不在HIT路径作用域)
        const [_, bm2, bd2] = birthDate.split('-').map(Number);
        const _signs2 = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
        const _cuts2 = [[1,20,1],[2,19,2],[3,21,3],[4,20,4],[5,21,5],[6,22,6],[7,23,7],[8,23,8],[9,23,9],[10,24,10],[11,22,11],[12,22,0]];
        let _si = 0;
        for (let _ci = _cuts2.length-1; _ci>=0; _ci--) { if (bm2>_cuts2[_ci][0]||(bm2===_cuts2[_ci][0]&&bd2>=_cuts2[_ci][1])) {_si=_cuts2[_ci][2]; break;} }
        const _rs = _signs2[_si];
        let streamText = cachedText;  // V113-fix5: 缓存已是cleanedText,零处理直接用
        
        // 🛠️ V185: 占位符替换(军师审计:{{SUN_HOUSE}}等模板变量未渲染)
        // HIT 路径也必须执行替换,否则缓存里的占位符会裸奔
        // 🛠️ V200: 占位符从 natal 本命盘读取(computed_houses.Sun.house 而非流年 months[0].sun.house)
        // 占位符 {{SUN_HOUSE}} 指本命太阳宫位,不是流年太阳宫位
        const natalH = astroMatrix?.meta?.computed_houses || {};
        const _gJupH = natalH.Jupiter?.house ?? 2;
        const _gSatH = natalH.Saturn?.house ?? 10;
        const _gPltH = natalH.Pluto?.house ?? 8;
        const _gSunH = natalH.Sun?.house ?? 1;
        const _gMooH = (() => {
          if (natalH.Moon) return natalH.Moon.house;
          // 月亮不在 computed_houses 里,fallback 到 months[0]
          const m0 = astroMatrix.months?.[0];
          return m0?.moon?.house ?? 2;
        })();
        const _tokMap = {
          '{{JUPITER_HOUSE}}': '第' + _gJupH + '宫',
          '{{SATURN_HOUSE}}': '第' + _gSatH + '宫',
          '{{PLUTO_HOUSE}}': '第' + _gPltH + '宫',
          '{{SUN_HOUSE}}': '第' + _gSunH + '宫',
          '{{MOON_HOUSE}}': '第' + _gMooH + '宫',
        };
        for (const [_t, _v] of Object.entries(_tokMap)) {
          if (_t && _v) streamText = streamText.split(_t).join(_v);
        }
        // 🛡️ V233-fix: 法语/西班牙语清洗（空格粘连+漏字）
          if (lang === 'fr') { streamText = fixFrenchTypo(fixFrenchSpacing(streamText)); }
          if (lang === 'es') { streamText = fixSpanishSpacing(streamText); }
          // 兜底: 清除任何未匹配的 {{...}} 占位符
          streamText = streamText.replace(/\{\{[A-Z0-9_]+\}\}/g, '');

        // 🛠️ V316-fix: 多份报告去重——统一由 _dedupParagraphs 处理（HIT路径已调用）
        // 旧 V274-fix 已整合到 _dedupParagraphs，此处删除避免重复截断

        // 🛠️ V316-fix: HIT路径去重——直接调用 _dedupParagraphs（无阈值guard）
        if (typeof _dedupParagraphs === 'function') {
          streamText = _dedupParagraphs(streamText);
        }

        // 🛡️ V233-fix: 法语/西班牙语清洗
        if (lang === 'fr') { streamText = fixFrenchTypo(fixFrenchSpacing(streamText)); }
        if (lang === 'es') { streamText = fixSpanishSpacing(streamText); }
        // 🛠️ V189: 消费陷阱+括号兜底（共享函数）
        streamText = cleanConsumerTrapAndBrackets(streamText);

        // ═══ 🛡️ E18/R11k（军师裁决②）: 流式 HIT 同样「命中即终局，不再跑锁链」 ═══
        //   与非流式 HIT（Clean HIT Pipeline）同一条铁律：缓存键内嵌版本号（`wealth:v5xx:…`，`eq.` 整键匹配）
        //   ⇒ 命中文本**必然**是写链终局；HIT 侧重跑的是写链**子集且时序错位** ⇒ 二次施加必然劣化。
        //   线上实证（12 盘，v517）：`_v432LockLeadingNatal` 拼接吃字（`Sagittarius…— Sun, Moon,`
        //   → `SagittLeo…—Moon,`）、`applyTruthLocksEnEsZh` 净删 30~64 字、
        //   `_v517YearlyFinalLocks`→`lockYearlyBareNatalPlanets` 把 12 个月标题星座反写成 natal Sun。
        //   ⇒ 一并删除（含 vi/th/fr 补锁与月标题逐月锁）—— 全部已挂载于写链
        //   （stream 写链 :13450~13486 / 非流式 :11724~11751），信息**只增不减**。
        //   形态卫生类步骤（占位符替换 / 法·西清洗 / `_dedupParagraphs` / `cleanConsumerTrapAndBrackets`）
        //   保留在上方：它们只动形态、不动真值（旧代码保留于 git 历史）。
        // 🛠️ V222z-fix14: 越南语 DeepSeek 词边界编码缺陷后处理补偿（形态类，保留）
        if (lang === 'vi') {
          streamText = fixVietnameseCorruption(streamText);
          // 🛠️ V394-fix7: 阈值兜底（金额形态归一，非真值改写）
          streamText = enforceRiskThreshold(streamText, lang);
        }
        // 🛡️ E16/R11g-fix: fr/th/vi 形态卫生（英文 `N House` 残渣归一本地形；**只换形态、绝不改值**）
        //   E18/R11k: en/es/zh 的真值双锁已收拢至写链（命中即终局），此处仅保留**形态类**守卫
        //   —— 它幂等（已归一则无操作）⇒ 不破坏「HIT 响应 ≡ 库内文本」。
        if (!_V432_LANGS.includes(lang)) streamText = _v516OutputHygiene(streamText, lang);

        // 🛠️ P0-fix: 清除所有 \uFFFD 替换字符（UTF-8 多字节被切断后的乱码方块）
        streamText = streamText.replace(/\uFFFD/g, '');

        // 🛠️ V332-fix: 用 StringDecoder 字节级对齐分块——彻底替代手动 _chunkEndSafe 切片
        // maxBytes=6000 相当于 ~2000 个泰/中文字符，足以触发 Railway 代理截断阈值
        const safeChunks = _safeChunk(streamText, 500); // V357-fix: 1500字节≈500中文字符，每1-2秒推送一次，流式边到边
        for (const chunk of safeChunks) {
          res.write(Buffer.from(`data: ${JSON.stringify({ text: chunk })}\n\n`, 'utf-8'));
          if (typeof res.flush === 'function') res.flush();
        }
        // V113-fix2: 发送 sanitized 事件,确保前端与 MISS 路径一致
        // 🛡️ V272-fix2: HIT路径 sanitized 只对 zh/en 执行（小语种正文含英文词会误触发刀一截断）
        let _sanitizedOut = streamText;
        if (['zh', 'en'].includes(lang)) {
          _sanitizedOut = sanitizeReportFinal(streamText, { lang, reportType });
        }
        res.write(Buffer.from(`data: ${JSON.stringify({ sanitized: _sanitizedOut })}\n\n`, 'utf-8'));
        res.write('data: [DONE]\n\n');
        if (typeof res.flush === 'function') res.flush();
        res.end();
        console.log(`[wealth-stream] [OK] Cache instant chunked complete, ${streamText.length} chars`);
        return;
      }
    }
  } catch (e) {
    console.warn('[wealth-stream] Cache check error (fallthrough to AI):', e.message);
  }

  // ═══ 第二道:Cache Miss → 真流式 + 落库 ═══
  console.log(`[wealth-stream] [MISS] Cache MISS: ${cacheKey}, calling DeepSeek...`);

  // 用于缓存落库的全文本收集器
  let fullTextCollector = '';
  let _yearlyIntegrityFailed = false; // 🛡️ V475: 年报三掷全败标记(交付但不写缓存,防毒化)

  // 🛠️ V222x-fix: stream 端点补声明 _tokMap
  // 5115/5123/5150 引用 _tokMap 但本端点从未声明 → ReferenceError → onChunk 抛错被 callDeepSeekStream 内部 catch 吞掉
  // → fullTextCollector 永不累积 → 方案C补全条件(fullTextCollector.length>100)恒false → sanitized 不推送、缓存不写 → 用户半截流
  // _tokMap 语义为占位符替换({{JUPITER_HOUSE}}→第N宫),stream 端点无此需求 → null 跳过替换,行为不变
  const _tokMap = null;

  // 写缓存辅助函数
  const writeToCache = async (text) => {
    if (!text || text.length < 100 || !SB_URL || !SB_KEY) return;
    // 🛡️ V475: 年报缓存卫生守卫——zh 缺字退化文本拒绝写入(防毒化永久复发)。
    //   前车之鉴: V394 卫生守卫只防 vi 拆词/占位符残渣; 2026-09-29 zh 年报缺字毒化文本
    //   畅通无阻写入缓存,同盘后续请求永久 HIT 垃圾。
    if (reportType === 'yearly' && !_yearlyIntegrityFailed) {
      const _iv = assessYearlyReportIntegrity(text, { lang });
      if (!_iv.ok) {
        console.warn(`[V475] 缓存卫生守卫拦截不合格年报, 不写入: ${cacheKey} | ${_iv.reasons.join('; ')}`);
        return;
      }
    }
    if (_yearlyIntegrityFailed) {
      console.warn(`[V475] 三掷全败稿, 拒绝写入缓存: ${cacheKey}`);
      return;
    }
    try {
      // 🛠️ V394-fix3: 缓存写入卫生守卫——拆词脏文本/占位符残渣拒绝写入,防毒化永久复发(组2 1981-09-08 HIT到V389脏缓存实证)。
      //   拆词不可逆(ậ n 无法复原 ận),只能不写+下次重生成;占位符残渣(<3000字含marker)同理。
      const _dirtyVi = lang === 'vi' && /Vậ\s+n|Mệ\s+nh|Thá\s+ng|Dươ\s+ng|Nă\s+ng|lượ\s+ng|Mặ\s+t|chiế\s+u|chuyệ\s+n|cuộ\s+c|mộ\s+t|đượ\s+c/i.test(text);
      const _phResidue = /【(?:Hệ Thống Chèn|System-Injected|占位符-系统注入|Inyección del Sistema|Injection Système|ระบบป้ายแทรก)】|vui lòng làm mới|please refresh/i.test(text) && text.length < 3000;
      if (_dirtyVi || _phResidue) {
        console.warn(`[V394] 缓存卫生守卫拦截脏文本(${_dirtyVi ? 'vi拆词' : ''}${_phResidue ? '占位符残渣' : ''}), 不写入: ${cacheKey}`);
        return;
      }
      // 🛠️ V98k: 写入前先删除该 cache_key 旧记录,避免多条脏数据堆积(无 UNIQUE 约束时尤其关键)
      await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}`, {
        method: 'DELETE',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
      });
      const res2 = await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache`, {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          cache_key: cacheKey,
          insight: text,  // V113-fix4: 写入不洗,读取洗,彻底消除双次标准化差异
          prompt_version: `v1.0.0-stream-${reportType}-${lang}`,
          created_at: new Date().toISOString(),
        })
      });
      console.log(`[wealth-stream] [WRITE] Cache write: ${cacheKey}, length=${text.length}, status=${res2.status}`);
      // 🛡️ V483d: 写入失败必须把 Supabase 响应体打出来(否则 400/4xx 永远只能靠猜)
      if (!res2.ok) {
        const _eb = await res2.text().catch(() => '');
        console.warn(`[wealth-stream] [WRITE-FAIL] status=${res2.status} body=${_eb.slice(0, 300)}`);
      }
    } catch (e) {
      console.error('[wealth-stream] [WRITE-ERROR] ' + (cacheKey||'?') + ': ' + (e && e.message) + (e && e.stack ? ' | ' + e.stack.split('\n')[1] : ''));
    }
  };

  // 🔧 V32修复: 根据birthDate计算真实星座(之前硬编码'双子座'导致所有用户都是双子座)
  const [_, birthMonth, birthDay] = birthDate.split('-').map(Number);
  const signs = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
  function getZodiacIdx(m, d) {
    const cuts = [[1,20,1],[2,19,2],[3,21,3],[4,20,4],[5,21,5],[6,22,6],[7,23,7],[8,23,8],[9,23,9],[10,24,10],[11,22,11],[12,22,0]];
    for (let i = cuts.length - 1; i >= 0; i--) {
      if (m > cuts[i][0] || (m === cuts[i][0] && d >= cuts[i][1])) return cuts[i][2];
    }
    return 0;
  }
  const realSunSign = signs[getZodiacIdx(birthMonth, birthDay)];

  // ── V69 SwissEph: astroMatrix 已在 HIT 路径前计算,此处复用 ──
  // (已移至函数开头,V185 重构)

  // 🔧 V90: aiTimeout 声明在 try 块外,catch 才能访问
  let aiTimeout;
  try {
    const prompt = buildWealthReportPrompt(birthDate, lang, reportType, {
      dayMaster: '甲',
      wuxing: { '金':1, '木':2, '水':1, '火':1, '土':1 },
      sunSign: realSunSign, // 🔧 V32: 使用真实星座
      hexName: '震',
      cardName: '隐士',
    }, astroMatrix, hasBirthTime);  // ← Pass V69 matrix + hasBirthTime to prompt builder
    _v433DumpPrompt(prompt);   // V433-DIAG（env 门控）

    // ── V97r: prompt 脏字符清洗(... → ...,防 ByteString 死锁)──
    if (prompt) {
      prompt.system = prompt.system.replace(/[\u2026]/g, '...');

      // 🛠️ V148: 空间锚点Prompt仅限中文,防止泰语等非中文语言输出中文词汇
      if (lang === 'zh') {
        prompt.system += '\n\n【⚠️ 空间财富对齐硬性铁律 -- 严禁幻觉】\n在撰写第五章时,你必须像执行编译器代码一样,毫无保留地严格遵守以下物理空间与占星宫位的固定隐喻,严禁将其替换为任何流年行运宫位:\n1. 卧室区域:必须且只能描述为"第四宫(田宅宫)",代表财富根基与守藏。\n2. 厨房区域:必须且只能描述为"第二宫(财帛宫)与第八宫(共享资源)",代表食禄与滋养之源。\n3. 财务室/保险柜:必须且只能描述为"第八宫(共享资源)",代表核心资产与偏财。\n\n【输出格式控制】:每一个空间的标题行必须严格使用以下加粗纯文本,严禁夹杂任何斜杠或自行脑补的星座(如白羊座/土星等杂质):\n* **卧室区域:第四宫(田宅宫)**\n* **厨房区域:第二宫(财帛宫)与第八宫(共享资源)**\n* **财务室/保险柜:第八宫(共享资源)**';
      }
      // 🛠️ V482: 星体星座「反串染 / 反跨月沿用」硬约束（P0）
      //   病根(2026-09-30 生产端 1999-12-15 盘实证): ① 月亮被写成「射手座月亮」(串用太阳星座, sign-bleed);
      //   ② 火星真值 2026-09=巨蟹座, 10 月起离开巨蟹(狮子→处女→天秤), 但 LLM 把「火星在巨蟹」沿用到
      //     11/12/次年2/3/4/5/6 月共 6 处 → 全年星座错误(refund 级)。
      //   本约束为语言无关的通用禁令, **不含任何个案数值**(prompt 为全用户共用, 严禁写死某盘真值)。
      if (lang === 'zh') {
        prompt.system += '\n\n【⚠️ 星体星座真值铁律 — 严禁串染与跨月沿用】\n1. 每一颗星体的星座必须独立按其自身真值书写, 严禁把一颗星体的星座套用到另一颗上(典型错误: 把太阳的星座写成月亮的星座, 产出"射手座月亮"这类自相矛盾表述)。\n2. 流年行星(太阳/火星/木星/土星/天王星/海王星/冥王星)的星座【逐月不同】, 必须逐月使用该月真值, 严禁把任意月份的星座沿用、复制或延宕到其他月份(典型错误: 把首月星座一路写到年末)。\n3. 黑天鹅日 / 财富高峰窗口等段落, 各月必须使用【该月】真实星象, 星体星座与措辞不得跨月雷同。\n4. 【流年 vs 本命必须显式标注】提及任一行星时, 若指流年行运必须带「流年/行运」字样, 若指本命盘配置必须带「本命」字样; 严禁同一颗星在两个语义间不加前缀地来回切换(典型错误: 先写「本命冥王星在第1宫射手座」, 后文又写「冥王星在第3宫水瓶座」却不标流年)。\n5. 【黑天鹅/风控段落严禁套模板】每月黑天鹅必须围绕下方分配表给出的本月风控主线展开, 相邻月份的叙述句式、比喻与结论必须明显不同; 严禁把上一月的整句或整段复制到下一月。\n6. 【内部字段严禁入正文】数据块/分配表中的「内部参考」「本月风控主线」「风控切入角度」「★」等一律只是给你的写作指令, 严禁把这些字样或字段名原样写进正文(H1~H6 与正文段落都不得出现)。\n\n【📌 第二章 风控主线分配表(内部参考, 严禁在正文写出本表名/字段名)】\n按第二章 12 个月出现的先后顺序依次对应(第 1 个月=第 1 项, 依此类推, 不得错位/重复):\n' + _V485_CRISIS_ANGLES.map((a, idx) => `${idx + 1}. ${a}`).join('; ') + '\n若某月数据块已单独给出「本月风控主线」, 以该处为准。';
      } else {
        prompt.system += '\n\n[PLANET-SIGN TRUTH RULE — NO SIGN-BLEED, NO CROSS-MONTH CARRY-OVER] (1) Each planet\'s sign MUST be written independently from its own true value; NEVER reuse one planet\'s sign for another (a typical error is labelling the Moon with the Sun\'s sign). (2) Transit planets (Sun/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto) CHANGE SIGN FROM MONTH TO MONTH: always use that month\'s true sign, and NEVER copy or carry over any other month\'s sign. (3) Black-swan days / peak windows MUST use the true configuration of THAT month; wording and signs must not be identical across months.';
      }
      // 🛡️ V487: 逐月「叙述镜头 + 风控表达框架」分配表 —— 破解概览首句/断路器段跨月同构(打地鼠终局)
      //   与 V485 的「风控主线分配表」同法: 逐月注入**具体**切入角度/结构, 而非只下「禁止雷同」令。
      //   取值范围 = 上面两张 12 项闭集表; 索引口径与 V485 一致(第 i 个月 ↔ 第 i 项)。
      if (lang === 'zh' && reportType === 'yearly') {
        prompt.system += buildYearlyLensFrameworkBlock();
      }
      // V239: 月报动态币种/宫位 Prompt 注入(覆盖通用标题模板,仅 monthly)
      if (reportType === 'monthly') {
        const _ctx = buildWealthPromptContext(lang, astroMatrix ? buildWealthMeta(birthDate, lang, astroMatrix) : null);
        prompt.system += '\n\n' + (SLIM_LANG_PACKS[lang] || SLIM_LANG_PACKS['zh']);
      }
      prompt.user = prompt.user.replace(/[\u2026]/g, '...');

      // 🛠️ V165-fix: 清理 user prompt 残留占位符(年报/月报流式共用药组)
      if (prompt.user) {
        prompt.user = prompt.user.replace(/__RISING_LOCAL__/g, 'Cancer');
        prompt.user = prompt.user.replace(/__NATAL_SUN__/g, 'Leo');
      }
    }

    // 🛠️ V165-crisis: 年报 system prompt 强制占位符替换(流式端点年报路径不经过 buildWealthReportPrompt 内的替换)
    // 年报不走 buildWealthReportPrompt 的 yearlySystem 替换逻辑,在此兜底
    if (reportType === 'yearly' && prompt) {
      const rRising = astroMatrix?.meta?.rising_sign || 'Cancer';
      const NATAL_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
      const natalEN = NATAL_EN[getNatalSunSign(birthDate)];
      const first = astroMatrix?.months?.[0];
      const getH = (v) => typeof v === 'number' ? v : (v?.house ?? v?.natal_house ?? v?.[0] ?? 1);
      const rJupH = first ? getH(first.jupiter?.house) : 2;
      const rSatH = first ? getH(first.saturn?.house) : 10;
      const rPlH = first ? getH(first.pluto?.house) : 8;
      const rSunH = first ? getH(first.sun?.house) : 1;
      const rJupS = first?.jupiter?.sign || 'Leo';
      const rSatS = first?.saturn?.sign || 'Aries';
      const rMoonS = first?.moon?.sign || 'Cancer';
      const rMoonH = first ? getH(first.moon?.house) : 2;
      // 熔断检测
      const unreplaced = (prompt.system.match(/__[A-Z0-9_]+__/g) || []);
      if (unreplaced.length > 0) {
        console.warn('[V165-crisis] Unreplaced tokens:', unreplaced);
      }
      prompt.system = prompt.system
        .replace(/__RISING_LOCAL__/g, rRising)
        .replace(/__RISING_SIGN__/g, rRising)
        .replace(/__NATAL_SUN__/g, natalEN)
        .replace(/__NATAL_SUN_EN__/g, natalEN)
        .replace(/__JUP_HOUSE__/g, String(rJupH))
        .replace(/__SAT_HOUSE__/g, String(rSatH))
        .replace(/__PL_HOUSE__/g, String(rPlH))
        .replace(/__SUN_HOUSE__/g, String(rSunH))
        .replace(/__MOON_HOUSE__/g, String(rMoonH))
        .replace(/__JUP_SIGN_LOCAL__/g, rJupS)
        .replace(/__SAT_SIGN_LOCAL__/g, rSatS)
        .replace(/__MOON_SIGN_LOCAL__/g, rMoonS);
      const stillUnreplaced = (prompt.system.match(/__[A-Z0-9_]+__/g) || []);
      if (stillUnreplaced.length > 0) {
        console.error('[V165-crisis] FATAL: After replacement still unreplaced:', stillUnreplaced);
      }
    }

    if (!prompt) {
      res.write(Buffer.from(`data: ${JSON.stringify({ error: 'Invalid reportType' })}

`, "utf-8"));
      return res.end();
    }

    const deepseekKey = getDeepSeekKey();
    const geminiKey = process.env.GEMINI_API_KEY;
    // 🔧 V75 fix: 64000 彻底解除年报截断
    // 🛠️ V125-final: 删除所有 OpenRouter 残留,纯 DeepSeek 直连
    // 🛠️ V211: 月报 maxOutputTokens 从 4000→12000,Gemini Flash 需足够余量完整输出四周+消费陷阱
    let maxTokens = reportType === 'yearly' ? 48000 : (reportType === 'monthly' ? 12000 : 4000);
    const controller = new AbortController();
    _aiCtrl = controller; // V343: 主请求纳入断连取消
    try { aiTimeout = setTimeout(() => controller.abort(), 600000); } catch(e){}

    // 🛠️ V108-fix2: 年报优先走 Gemini 2.5 Pro(输出上限高),非年报走 DeepSeek(快)
    let usedGemini = false;
    let aiRes = null;
    let aiStream = false;
    let geminiFullText = '';
    let _totalWritten = ''; // V315-fix: 追踪已写SSE内容，检测并跳过Gemini输出重叠
    const _MIN_OVERLAP = 20;

    // 🛠️ V315-fix: 段落级去重——在月度块外定义，可在缓存写入时被调用
    // 🛠️ V316-fix-final: 可靠的去重截断——找第2个"第2周"/"Week 2"，中文用indexOf(废弃 emoji regex)
    function _dedupParagraphs(text) {
      // 🛠️ V322: 重复月报截断（只保留第1份）——全语言通用锚点
      // 主锚点: 「✦ [🔮」——🔮 emoji 只出现在月度主题头（✦ [🔮 Tema/Monthly/本月命运主题...]），全语言通用
      // AI 重复输出完整月报时,第2份必然以主题头重新开始 → 找到第2个 🔮 头即第2份起点
      const _themeMark = '✦ [🔮';
      // 🛡️ V436-fix2 V322补丁: 注入的标题在 text 开头(V386-fix 强制注入),
      // 不算作第一份报告主题头——只有落入正文深处(pos>100)的才可能是真正的第一份
      let _firstTheme = text.indexOf(_themeMark);
      if (_firstTheme >= 0 && _firstTheme < 100) _firstTheme = text.indexOf(_themeMark, 100);
      // 🛠️ V394-fix5: 无括号变体锚点——LLM 第二份报告主题头偶发丢方括号('✦ 🔮 Chủ đề...'),
      //   主锚点匹配不到导致双份报告残留(1981-09-08 实证: 报告A腰斩+报告B从头插入)。
      //   退化到宽松锚点 '✦ 🔮'(正文不会用🔮 emoji,安全)再扫一遍第2份起点。
      let _secondTheme = _firstTheme >= 0 ? text.indexOf(_themeMark, _firstTheme + _themeMark.length) : -1;
      if (_secondTheme < 0) {
        const _looseMark = '✦ 🔮';
        // 🛡️ V436-fix2: loose mark 也跳过 text 前 100 字符(注入的 ✦ 🔮 也在开头)
        let _scanFrom = 100;
        let _looseCount = 0;
        for (;;) {
          const _hit = text.indexOf(_looseMark, _scanFrom);
          if (_hit < 0) break;
          _looseCount++;
          if (_looseCount === 2) { _secondTheme = _hit; break; }
          _scanFrom = _hit + _looseMark.length;
        }
        if (_secondTheme >= 0) console.log(`[wealth-stream] [V394-fix5] 无括号主题头变体第2份起点: idx=${_secondTheme}`);
      }
      if (_firstTheme >= 0) {
        if (_secondTheme > 0) {
          const _cut = text.substring(0, _secondTheme).trim();
          console.log(`[wealth-stream] [V322] 主题头重复截断: ${text.length}→${_cut.length}字`);
          return _cut;
        }
      }
      // 降级锚点: 行首精确匹配第2个「第2周」级标题（周2 = 🔴 全语言唯一,不会与第4周🟢混淆）
      // 🛡️ V436-fix3: 1) 冒号/破折号皆可(V386注入的标题用 em dash)；2) 跳过开头的注入W1(位置<100)
      const _w2Line = /^\s*✦?\s*[\[【]\s*(?:[🔴🟢🔵]+\s*)?(第2周|Week 2|Semana 2|Semaine 2|สัปดาห์ที่ 2|Tuần 2)[\s\-—:：]/m;
      const _matches = [...text.matchAll(new RegExp(_w2Line.source, 'gm'))];
      // 过滤：位置<100的是V386注入的W1，不算第1份报告的W2
      const _realMatches = _matches.filter(m => m.index >= 100);
      if (_realMatches.length >= 2) {
        const _firstW2 = _matches[0].index;
        const _secondW2 = _realMatches[1].index;
        const _cut = text.substring(0, _secondW2 + _matches[1][0].length).trim();
        console.log(`[wealth-stream] [V322] 周2标题重复截断: ${text.length}→${_cut.length}字`);
        return _cut;
      }
      console.log(`[wealth-stream] [V322] 无重复章节头 (${text.length}字)`);
      return text;
    }

    // 🛠️ V131-final: 统一走 callDeepSeekStream(native fetch),废弃所有 Gemini/https.request 降级路径
    if (!deepseekKey) {
      clearTimeout(aiTimeout);
      res.write(Buffer.from(`data: ${JSON.stringify({ error: 'AI service unavailable (no key)' })}\n\n`, 'utf-8'));
      return res.end();
    }
    // 🛡️ V370: 主通道 DeepSeek-V4-Flash(non-thinking,极速流式),Gemini 兜底(带30s timeout)
    try {
      // 🛡️ V219g: monthly 分段生成(DeepSeek 长生成退化,拆段各写1部分拼接)
      // 🛠️ V222q: 从4段扩到6段——补 overview(本月命运主题)与消费陷阱,根治两段稳定缺失
      if (reportType === 'monthly') {
        // 🛡️ [V281] 语言分流：zh/en→DeepSeek，es/fr/th/vi→Gemini流式+DeepSeek降级兜底
        // 🛠️ V315-fix: 完整去重体系
        // _getTrimmed: 核心去重函数——计算 chunk 去掉重叠后的真实增量
        const _getTrimmed = (chunk) => {
          if (!chunk || typeof chunk !== 'string') return '';
          if (!chunk.trim()) return '';
          if (_totalWritten.includes(chunk)) return '';           // 场景A：完全重复
          let t = chunk;
          for (let n = Math.min(chunk.length, _totalWritten.length); n >= _MIN_OVERLAP; n--) {
            if (_totalWritten.endsWith(chunk.slice(0, n))) { t = chunk.slice(n); break; }
          }
          return t.length > 0 ? t : ''; // V388-fix: 不trim()——保留chunk末尾空格,防跨chunk拼接吞字
        };
        // _dedupWrite: 双重职责——更新状态 + 通过 _resDedupe 写 SSE
        // 🛠️ V364-fix: Chunk 清洗器——拦截 AI 指令摘要/思维链泄漏，如 "No English, no CoT"、Self-Correction 等
        const _rejectPatterns = [
          /No English,? no CoT/i, /Self[- ]?Correction/i, /strict active voice/i,
          /mandatory house labels/i, /no forbidden aspects/i, /space wealth alignment/i,
          /avoid ["'"][^"']+["']/i, /instead of ["'"][^"']+["']/i,
        ];
        const _isGarbage = (t) => {
          for (const p of _rejectPatterns) { if (p.test(t)) return true; }
          return false;
        };
        const _dedupWrite = (chunk) => {
          // 🛠️ V392-fix: NFC Unicode 标准化——DeepSeek 输出偶发 NFD 分解形态(字母+声调分离)，
          //   声调字符在 chunk 边界被切断后前端无法重组，导致 Vậ n / Mệ nh / Thá ng 类单词内被插空格
          //   normalize('NFC') 强制合成为标准形式，确保所有后续逻辑（去重/清洗）处理统一码点
          const _normalized = (chunk || '').normalize('NFC');
          const t = _getTrimmed(_normalized);
          if (!t) return;
          // 🛠️ V331-fix: 二次扑灭 U+FFFD——JSON.encode/decode 跨 SSE 流边界偶尔残留，兜底清洗后写入
          // 🛠️ V364-fix: 拦截指令摘要泄漏（No English / Self-Correction / instruction summary）
          if (_isGarbage(t)) {
            console.warn('[V364] ⚠️ 拦截指令泄漏 chunk:', t.slice(0, 60));
            return;
          }
          const clean = t.replace(/\uFFFD/g, '');
          if (_isGarbage(clean)) {
            console.warn('[V364] ⚠️ 拦截清洗后仍含指令片段:', clean.slice(0, 60));
            return;
          }
          _totalWritten += clean;
          fullTextCollector += clean;
          _resDedupe.write(clean);   // 走 wrapper 去重
        };

        // 🛠️ V315-fix: res 去重 wrapper——拦截所有 res.write() 调用，防止 Gemini 和 DeepSeek 双重写入
        const _resDedupe = {
          write: (data, enc, cb) => {
            const s = typeof data === 'string' ? data : data.toString('utf-8');
            const trimmed = _getTrimmed(s);
            if (!trimmed) return typeof cb === 'function' && cb();
            // 🛡️ V410: 流式 SSE text 事件层越南语拆词修复——callDeepSeekStream 直接写 raw chunk,
            //   此处统一清洗 text 字段,确保前端实时看到的是已修拆词+₫500,000阈值的干净文本
            //   (onChunk/_dedupWrite 只累积 fullTextCollector 不控制 SSE 输出,故在此清洗)
            let _out = trimmed;
            if ((lang === 'vi' || lang === 'th') && trimmed.startsWith('data: ')) {
              try {
                const _j = JSON.parse(trimmed.slice(6).trim());
                if (_j && typeof _j.text === 'string' && _j.text.length) {
                  if (lang === 'vi') _j.text = fixVietnameseCorruption(_j.text);
                  _j.text = enforceRiskThreshold(_j.text, lang);
                  if (lang === 'vi') _j.text = lockNatalTruthVi(_j.text, astroMatrix);
                  if (lang === 'vi') _j.text = lockTransitTruthVi(_j.text, astroMatrix);
  if (lang === 'fr') _j.text = lockNatalTruthFr(_j.text, astroMatrix);
  if (lang === 'fr') _j.text = lockTransitTruthFr(_j.text, astroMatrix);
                  if (lang === 'th') _j.text = lockNatalTruthTh(_j.text, astroMatrix);
                  if (lang === 'th') _j.text = lockTransitTruthTh(_j.text, astroMatrix);
                  _j.text = lockNatalAnchorRole(_j.text, lang, astroMatrix, reportType);   // 🛡️ V444
                  _j.text = lockTransitPlanetSigns(_j.text, lang, astroMatrix, reportType); // 🛡️ V445
                  _j.text = applyV434Locks(_j.text, lang, astroMatrix);   // V434（补 V433 未挂的 SSE 逐块链）
                  _out = 'data: ' + JSON.stringify(_j) + '\n\n';
                }
              } catch (e) { /* 非标准 JSON 行原样透传 */ }
            }
            return res.write(_out, enc, cb);
          },
          flush: res.flush && res.flush.bind(res),
          writableEnded: false,
          end: (...args) => { _resDedupe.writableEnded = true; return res.end(...args); }
        };
        // 🛠️ V370: 主路径翻转为 DeepSeek-V4-Flash(non-thinking,极速流式),Gemini 3.5 Flash 兜底
        // V320 架构(Gemini主+DeepSeek兜底)已废除——DeepSeek V4-Flash 首字更快、成本更低、多语言够用
          // 🟢 DeepSeek-V4-Flash 流式（全语言 zh/en/es/fr/th/vi），失败自动降级 Gemini
          console.log('[wealth-stream] V370 lang=' + lang + ' -> DeepSeek-V4-Flash主路径+Gemini兜底');
          try {
            let _didStream = false; // V366-fix: 标记是否走了流式路径
            // 🛠️ V386-fix: 月报路径 DeepSeek 主路径——流式首 chunk 前注入标准化主题标题(根治🔮消失)
            const _monthlyThemeInject = reportType === 'monthly' ? {
              zh:'✦ [🔮 本月命运主题] ✦', en:'✦ [🔮 Monthly Destiny Theme] ✦', es:'✦ [🔮 Tema de Destino Mensual] ✦', fr:'✦ [🔮 Thème de Destin du Mois] ✦', th:'✦ [🔮 ธีมโชคชะตาประจำเดือน] ✦', vi:'✦ [🔮 Chủ Đề Vận Mệnh Tháng] ✦'
            }[lang] || '✦ [🔮 本月命运主题] ✦' : '';
            let _themeTitleInjected = !_monthlyThemeInject;
            // 🛡️ V414: 月报真·流式(DeepSeek SSE 直通)——根治 V411「callAI 生成完再批量 _safeChunk 推流」
            //   导致的「前端一次性蹦全文」(非流式观感:chunk 同毫秒灌入,浏览器一次渲染)。
            //   设计铁律:
            //   ① 逐 token 转发 SSE data:{text} 事件,_MT_FLUSH=60字 逼近打字机节奏(自然节流,靠模型自身出字速度)
            //   ② 无损累积——绝不做 lastClean/newSuffix 前缀去重、_getTrimmed 重叠裁剪等【有损】操作,
            //      流式拼接字节数 == 非流式全文(历史病根:旧 callDeepSeekStream 的有损去重把 'những nỗ' 吞成 'nhữngỗ')
            //   ③ 每块只做无损清洗(字面 \uXXXX→emoji / U+FFFD 清除);金额阈值、标题归一、去重等有损替换留给末尾 sanitized 终稿
            //   ④ 双份报告护栏:检测到第 2 个 `✦ [🔮` 锚点即断流
            const _mtMax = 12000;
            let _mtFull = '';
            const _mtEmit = (t) => {
              if (!t) return;
              try {
                res.write(Buffer.from('data: ' + JSON.stringify({ text: t }) + '\n\n', 'utf-8'));
                if (typeof res.flush === 'function') res.flush();
              } catch (e) {}
            };
            const _mtEmitSafe = v462StreamSafeEmitter(_mtEmit, lang);
            try {
              const _mtKey = getDeepSeekKey();
              const _mtResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_mtKey}` },
                body: JSON.stringify({
                  model: 'deepseek-flash', thinking: { type: 'disabled' },
                  messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
                  max_tokens: _mtMax, temperature: 0.7,
                  frequency_penalty: lang === 'vi' ? 0 : 0.3,
                  presence_penalty: lang === 'vi' ? 0 : 0.3,
                  repetition_penalty: lang === 'vi' ? 1.08 : 1.05,
                  stream: true, stop: ['===END_OF_REPORT==='],
                }),
                signal: controller.signal,
              });
              if (!_mtResp.ok) throw new Error('DeepSeek HTTP ' + _mtResp.status);
              const _mtReader = _mtResp.body.getReader();
              const _mtDec = new StringDecoder('utf8');
              const _MT_FLUSH = 60;
              let _mtBuf = '', _mtPend = '', _mtFirstFlush = true, _mtStop = false;
              while (!_mtStop) {
                const { done, value } = await _mtReader.read();
                if (done) { const _tl = _mtDec.end(); if (_tl) _mtBuf += _tl; } else { _mtBuf += _mtDec.write(value); }
                const _ls = _mtBuf.split('\n');
                _mtBuf = _ls.pop() || '';
                for (const _ln of _ls) {
                  if (!_ln.startsWith('data: ')) continue;
                  const _d = _ln.slice(6).trim();
                  if (!_d || _d === '[DONE]') continue;
                  let _txt = '';
                  try { _txt = JSON.parse(_d).choices?.[0]?.delta?.content || ''; } catch (e) { continue; }
                  if (!_txt) continue;
                  // ── 无损清洗层(绝不改动字词边界) ──
                  _txt = _txt
                    .replace(/\\n/g, '\n')
                    .replace(/\\ud83d ?\\udd2e/g, '🔮')
                    .replace(/\\ud83d ?\\udfe2/g, '🟢')
                    .replace(/\\ud83d ?\\udd34/g, '🔴')
                    .replace(/\\ud83d ?\\udd35/g, '🔵')
                    .replace(/\\u26a0 ?\\ufe0f/g, '⚠️')
                    .replace(/\uFFFD/g, '').replace(/�/g, '');
                  if (!_txt) continue;
                  _mtFull += _txt;
                  _mtPend += _txt;
                  // ④ 双份报告护栏:出现第 2 个 ✦ [🔮 锚点 → 立即断流
                  if ((_mtFull.match(/✦\s*\[🔮/g) || []).length >= 2) {
                    console.warn('[V414] 检测到第2个主题锚点(双份报告),断流 @' + _mtFull.length + '字');
                    _mtStop = true;
                    break;
                  }
                  if (_mtPend.length >= _MT_FLUSH) {
                    // 首块兜底:模型漏 ✦ 主题头时补全标准头
                    if (!_themeTitleInjected && _mtFirstFlush) {
                      _mtFirstFlush = false;
                      if (!_mtFull.trimStart().startsWith('✦')) {
                        _mtPend = _monthlyThemeInject + '\n' + _mtPend;
                        _mtFull = _monthlyThemeInject + '\n' + _mtFull;
                      }
                      _themeTitleInjected = true;
                    }
                    _mtEmitSafe.push(_mtPend, false); _mtPend = '';
                  }
                }
                if (done) break;
              }
              if (_mtPend && !_mtStop) { _mtEmitSafe.push(_mtPend, true); _mtPend = ''; }
              if (!(_mtFull || '').trim()) throw new Error('stream produced empty text');
            } catch (_mtErr) {
              console.warn('[V414] 月报流式失败,降级 callAI(非流式): ' + (_mtErr && _mtErr.message));
              _mtFull = (await callAI(prompt.system, prompt.user, process.env, { maxTokens: _mtMax, reportType: 'monthly' })) || '';
              if (_tokMap) for (const [_t, _v] of Object.entries(_tokMap)) _mtFull = _mtFull.split(_t).join(_v);
              if (!_themeTitleInjected && !_mtFull.trimStart().startsWith('✦')) {
                _mtFull = _monthlyThemeInject + '\n' + _mtFull;
                _themeTitleInjected = true;
              }
              for (const _mc of _safeChunk(v462PoeticizeTrail(v462NormalizeWeekSub(_mtFull, lang), lang), 500)) _mtEmit(_mc);
            }
            fullTextCollector = v462PoeticizeTrail(v462NormalizeWeekSub(_mtFull, lang), lang);
            _didStream = true;
            geminiFullText = _mtFull;
          } catch(dsErr) {
            console.error('[wealth-stream] V411 callAI失败，降级Gemini流式: ' + dsErr.message);
            try {
              const _gemFull = await streamGeminiSequential(_resDedupe, (chunk) => {
                if(_tokMap) for(const [_t,_v] of Object.entries(_tokMap)) chunk=chunk.split(_t).join(_v);
                if (typeof v462PoeticizeTrail === 'function') chunk = v462PoeticizeTrail(v462NormalizeWeekSub(chunk, lang), lang);
                fullTextCollector += chunk;
                let _out = lang === 'vi' ? (() => { try { const _j = { text: chunk }; _j.text = fixVietnameseCorruption(_j.text); _j.text = enforceRiskThreshold(_j.text, lang); return 'data: ' + JSON.stringify(_j) + '\n\n'; } catch (e) { return 'data: ' + JSON.stringify({ text: chunk }) + '\n\n'; } })() : 'data: ' + JSON.stringify({ text: chunk }) + '\n\n';
                res.write(Buffer.from(_out, 'utf-8'));
                if (typeof res.flush === 'function') res.flush();
              }, lang, prompt.system, prompt.user, astroMatrix);
              geminiFullText = (_gemFull && _gemFull.length >= fullTextCollector.length) ? _gemFull : fullTextCollector;
            } catch(gemErr2) {
              console.error('[wealth-stream] V411 Gemini降级也失败: ' + gemErr2.message);
              geminiFullText = fullTextCollector;
            }
          }
        if (geminiFullText && geminiFullText.trim().length > 0) aiStream = true;

      } else {
        // 🛡️ V411: 非月报(yearly/once) MISS 同样改用 callAI(干净)生成全文,再切 SSE chunk 推流(res 直写)
        // 🛡️ V475: 年报加挂「文本完整度闸门 + 多通道重试」——
        //   生产实证(2026-09-29, 1985-06-15 盘): 单发 48k 长生成退化,产出"每隔两三字缺一字"的
        //   毒化文本(座密度 15.9→3.1/千字)且一度写入缓存。修复策略:
        //   ① 首选 DeepSeek(temperature 0,确定性) → 闸门体检
        //   ② 不合格 → 直调 Gemini 重试(不同模型=重新掷骰) → 再体检
        //   ③ 仍不合格 → DeepSeek 高温重试(temperature 0.7 无 seed) → 终检
        //   三掷全败则交付最长稿(不拦用户),但绝不写入缓存(writeToCache 同步加挂同闸门),并大声留痕。
        try {
          const _maxT = reportType === 'yearly' ? 48000 : 8000;
          // 🛡️ V477b: 非月报(yearly/once) MISS 由「callAI 生成完整篇 → _safeChunk 批量推流」
          //   改为【真·流式】——根治 V411 遗留的「干等 40+ 秒、76 个块全挤在最后 0.6 秒到达、
          //   用户观感像命中缓存一次性吐出」的假流式体感。设计纪律:
          //   ① 通道1 = DeepSeek 直链 SSE 逐 token 转发(sampling 与 callAI 年报一致:
          //      temperature 0 + seed 确定性、零惩罚、max_tokens 48000),通道纪律不变(DeepSeek 必须优先)。
          //   ② 边流边【无损】累积 _yrFull(只做字面 \n/字面 emoji 还原/U+FFFD 清除,绝不改动字词边界);
          //      有损清洗仍全部留给末尾 sanitized 终稿,保证流式拼接字节数 == 终稿。
          //   ③ 流毕过 V475 完整度闸门 assessYearlyReportIntegrity;合格即采用(用户已实时看到真流式)。
          //   ④ 不合格 → 通道2 DeepSeek(0.7 无种子重掷) → 通道3 Gemini(末位后备)(均非流式);
          //      其一合格则用其结果覆盖 _full → 末尾 sanitized 事件整篇替换前端所见
          //      (前端 V419「终稿优先」+ V476「CJK 密度守卫」已承接)。
          //   ⑤ 三掷全败 → 交付最长稿 + _yearlyIntegrityFailed(不写缓存)。流式通道彻底失败 → callAI 非流式兜底。
          const _yrEmit = (t) => {
            if (!t) return;
            try {
              let _out;
              if (lang === 'vi') {
                try {
                  const _j = { text: t };
                  _j.text = fixVietnameseCorruption(_j.text);
                  _j.text = enforceRiskThreshold(_j.text, lang);
                  _out = 'data: ' + JSON.stringify(_j) + '\n\n';
                } catch (e) { _out = 'data: ' + JSON.stringify({ text: t }) + '\n\n'; }
              } else {
                _out = 'data: ' + JSON.stringify({ text: t }) + '\n\n';
              }
              res.write(Buffer.from(_out, 'utf-8'));
              if (typeof res.flush === 'function') res.flush();
            } catch (e) {}
          };
          let _full = '';
          let _yrStreamed = false;   // 通道1 是否真流式成功
          try {
            const _yrResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
              body: JSON.stringify({
                model: 'deepseek-flash', thinking: { type: 'disabled' },
                messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
                max_tokens: _maxT, temperature: 0, seed: seedFromUserPrompt(prompt.user),
                frequency_penalty: 0, presence_penalty: 0, repetition_penalty: 1,
                stream: true, stop: ['===END_OF_REPORT==='],
              }),
              signal: controller.signal,
            });
            if (!_yrResp.ok) throw new Error('DeepSeek HTTP ' + _yrResp.status);
            const _yrReader = _yrResp.body.getReader();
            const _yrDec = new StringDecoder('utf8');
            let _yrBuf = '';
            let _yrRunaway = false;
            while (!_yrRunaway) {
              const { done, value } = await _yrReader.read();
              if (done) { const _tl = _yrDec.end(); if (_tl) _yrBuf += _tl; } else { _yrBuf += _yrDec.write(value); }
              const _ls = _yrBuf.split('\n');
              _yrBuf = _ls.pop() || '';
              for (const _ln of _ls) {
                if (!_ln.startsWith('data: ')) continue;
                const _d = _ln.slice(6).trim();
                if (!_d || _d === '[DONE]') continue;
                let _txt = '';
                try { _txt = JSON.parse(_d).choices?.[0]?.delta?.content || ''; } catch (e) { continue; }
                if (!_txt) continue;
                // ── 无损清洗层(绝不改动字词边界) ──
                _txt = _txt
                  .replace(/\\n/g, '\n')
                  .replace(/\\ud83d ?\\udd2e/g, '🔮')
                  .replace(/\\ud83d ?\\udfe2/g, '🟢')
                  .replace(/\\ud83d ?\\udd34/g, '🔴')
                  .replace(/\\ud83d ?\\udd35/g, '🔵')
                  .replace(/\\u26a0 ?\\ufe0f/g, '⚠️')
                  .replace(/\uFFFD/g, '').replace(/�/g, '');
                if (!_txt) continue;
                _full += _txt;
                _yrEmit(_txt);
                // 失控护栏: 年报正常 ≤2.5 万字, 超 6 万字判定模型打转 → 断流(不整份复读)
                if (_full.length > 60000) {
                  console.warn('[V477b] 年报流式超长(' + _full.length + '字), 判定失控断流');
                  _yrRunaway = true;
                  break;
                }
              }
              if (done) break;
            }
            if (!_full.trim()) throw new Error('stream produced empty text');
            _yrStreamed = true;
            if (_tokMap) for (const [_t, _v] of Object.entries(_tokMap)) _full = _full.split(_t).join(_v);
            console.log('[V477b] 年报真流式完成: ' + _full.length + ' 字');
          } catch (_yrErr) {
            console.warn('[V477b] 年报流式通道失败, 降级 callAI(非流式): ' + (_yrErr && _yrErr.message));
          }
          if (!_yrStreamed) {
            // 兜底: 通道1 流式失败 → 原有 callAI 非流式生成 + 分块推流(保证用户至少看到内容)
            _full = await callAI(prompt.system, prompt.user, process.env, { maxTokens: _maxT, reportType });
            if (_tokMap) for (const [_t, _v] of Object.entries(_tokMap)) _full = _full.split(_t).join(_v);
            for (const _c of _safeChunk(_full || '', 500)) _yrEmit(_c);
          }

          if (reportType === 'yearly') {
            const _judge = (t) => assessYearlyReportIntegrity(t, { lang });
            let _verdict = _judge(_full);
            console.log(`[V475] 完整度体检 #1(DeepSeek): ok=${_verdict.ok} len=${_verdict.metrics.length} 座=${_verdict.metrics.density_座} 星=${_verdict.metrics.density_星} ${_verdict.reasons.join('; ') || 'PASS'}`);

            // ② DeepSeek 高温重试(temperature 0.7, 无 seed → 重新掷骰)
            // 🛡️ 通道纪律(V475b,大叔钦定): DeepSeek 直链必须优先——先在 DeepSeek 内部
            //    换参数重掷,穷尽后才允许降级到 Gemini 后备通道。
            if (!_verdict.ok) {
              try {
                console.warn('[V475] ⚠️ DeepSeek 稿不合格 → DeepSeek 高温重试(0.7, 换种子重掷)');
                const _dsKey = getDeepSeekKey();
                const _dsRes = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_dsKey}` },
                  body: JSON.stringify({
                    model: 'deepseek-flash', thinking: { type: 'disabled' },
                    messages: [{ role: 'system', content: prompt.system }, { role: 'user', content: prompt.user }],
                    max_tokens: 48000, temperature: 0.7, stream: false, stop: ['===END_OF_REPORT==='],
                  }),
                  signal: controller.signal,
                });
                if (_dsRes.ok) {
                  const _dsData = await _dsRes.json();
                  const _dsTxt = (_dsData?.choices?.[0]?.message?.content || '').trim();
                  const _dsVerdict = _judge(_dsTxt);
                  console.log(`[V475] 完整度体检 #2(DeepSeek高温): ok=${_dsVerdict.ok} len=${_dsVerdict.metrics.length} ${_dsVerdict.reasons.join('; ') || 'PASS'}`);
                  if (_dsVerdict.ok) { _full = _dsTxt; _verdict = _dsVerdict; }
                } else {
                  console.error('[V475] DeepSeek 高温重试 HTTP ' + _dsRes.status);
                }
              } catch (_dsErr) { console.error('[V475] DeepSeek 高温重试异常: ' + _dsErr.message); }
            }

            // ③ Gemini 后备(仅当 DeepSeek 两掷全败,末位兜底)
            if (!_verdict.ok && getGeminiKey()) {
              try {
                console.warn('[V475] ⚠️ DeepSeek 两掷均不合格 → Gemini 后备通道');
                const _gRes = await safeFetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${getGeminiKey()}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt.system + '\n\n' + prompt.user }] }],
                    generationConfig: { maxOutputTokens: 48000, temperature: 0.3 },
                  }),
                  signal: controller.signal,
                });
                if (_gRes.ok) {
                  const _gData = await _gRes.json();
                  const _gTxt = _gData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  const _gVerdict = _judge(_gTxt);
                  console.log(`[V475] 完整度体检 #3(Gemini后备): ok=${_gVerdict.ok} len=${_gVerdict.metrics.length} ${_gVerdict.reasons.join('; ') || 'PASS'}`);
                  if (_gVerdict.ok) { _full = _gTxt; _verdict = _gVerdict; }
                } else {
                  console.error('[V475] Gemini 后备 HTTP ' + _gRes.status);
                }
              } catch (_gErr) { console.error('[V475] Gemini 后备异常: ' + _gErr.message); }
            }

            if (!_verdict.ok) {
              // 三掷全败:交付最长稿 + 大声留痕(绝不静默)
              console.error(`[V475] ❌❌ 年报三次生成均未过完整度闸门! 交付最长稿(${_full.length}字)且不写缓存。原因: ${_verdict.reasons.join('; ')}`);
              _yearlyIntegrityFailed = true;
            }
          }

          // 🛡️ V477b: 推流已于上方完成(真流式逐 token / 兜底 _safeChunk 分块二选一),
          //   此处不再重复 _safeChunk 全量推送——否则前端会看到全文复读一遍。
          fullTextCollector += (_full || '');
          geminiFullText = _full || fullTextCollector;
        } catch (e2) {
          console.error('[wealth-stream] V411 非月报 callAI失败: ' + (e2.message || e2));
          geminiFullText = fullTextCollector;
        }
        if (geminiFullText && geminiFullText.trim().length > 0) aiStream = true;
      }
    } catch(e) {
      console.error('[wealth-stream] [V131] DeepSeek stream FAILED: ' + (e.message || String(e)));
      if (geminiKey) {
        const gCtrl = new AbortController();
        _aiCtrl = gCtrl; // V343: Gemini fallback 也纳入断连取消
        const gTimer = setTimeout(() => gCtrl.abort(), 30000);
        try {
          console.log('[wealth-stream] → Gemini fallback (non-stream, 30s timeout)');
          usedGemini = true;
          const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=' + geminiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt.system + '\n\n' + prompt.user }] }],
              generationConfig: { maxOutputTokens: 16000, temperature: 0.3 },
            }),
            signal: gCtrl.signal,
          });
          clearTimeout(gTimer);
          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            geminiFullText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (lang !== 'zh') { geminiFullText = geminiFullText.replace(/（/g, '').replace(/）/g, ''); }
            if (_tokMap) for (const [_t, _v] of Object.entries(_tokMap)) geminiFullText = geminiFullText.split(_t).join(_v);
            geminiFullText = geminiFullText.replace(/\{\{[A-Z0-9_]+\}\}/g, '');
            // 🛠️ V364-fix: fallback 路径也拦截指令摘要泄漏
            const _fbGarbageMatch = geminiFullText.match(/(No English|No CoT|Self[- ]?Correction|strict active voice)/i);
            if (_fbGarbageMatch) {
              console.warn('[V364] ⚠️ Fallback geminiFullText 含指令泄漏，裁剪掉前 ' + (geminiFullText.indexOf(_fbGarbageMatch[0])) + ' 字节');
              geminiFullText = geminiFullText.slice(geminiFullText.indexOf(_fbGarbageMatch[0]));
            }
            // 从第一个 ✦ 截取（忽略一切前言）
            const _firstMarker = geminiFullText.indexOf('✦');
            if (_firstMarker > 0) {
              console.log('[V364] ⚠️ Fallback 截取首个✦之前内容，前', _firstMarker, '字节指令泄漏');
              geminiFullText = geminiFullText.slice(_firstMarker);
            }
            if (geminiFullText && geminiFullText.trim().length > 0) {
              res.write(Buffer.from('data: ' + JSON.stringify({ text: geminiFullText }) + '\n\n', 'utf-8'));
              if (typeof res.flush === 'function') res.flush();
              onChunk && onChunk(geminiFullText);
            }
          } else {
            console.error('[wealth-stream] Gemini fallback HTTP', geminiRes.status);
          }
        } catch(geminiErr) {
          console.error('[wealth-stream] Gemini fallback EXCEPTION:', geminiErr.message);
        } finally {
          // V366-fix: 流式成功时 chunks 已通过 _resDedupe.write 逐段发了，finally 不再发完整文本
          if (!_didStream && geminiFullText && geminiFullText.trim().length > 0) {
            res.write(Buffer.from('data: ' + JSON.stringify({ text: geminiFullText }) + '\n\n', 'utf-8'));
            if (typeof res.flush === 'function') res.flush();
          }
          clearTimeout(gTimer);
        }
      }
    }

    // V100i: 英文标点清洗(去除中文全角标点污染)
    // V103-fix8: 清理 DeepSeek AI 输出时在换行前加的多余空格("word \n" → "word\n")
    const langPunctuationClean = (text, lang) => {
      // 通用清理:先清 literal \\n,再清换行前空格,再清多余空格
      text = text.replace(/\\n/g, '\n'); // literal \n 转实际换行
      text = text.replace(/ \n/g, '\n'); // 清理换行前空格
      text = text.replace(/  +/g, ' ');   // 清理连续多余空格
      if (lang === 'en') {
        return text
          .replace(/--/g, ' - ')
          .replace(/--/g, ' -- ')
          .replace(/·/g, ' | ')
          .replace(/ /g, ' ') // 全角空格
          // ── V139: 反直译兜底 (军师双轨制) — 防 LLM 偶发直译中文玄学大词 ──
          .replace(/Core Heavenly Secrets?/gi, 'Core Cosmic Window')
          .replace(/Heavenly Machine/gi, 'Cosmic Catalyst')
          .replace(/Core Celestial Secrets?/gi, 'Key Astrological Trigger')
          .replace(/(?:The )?Heavenly Secrets?/gi, 'Celestial Trigger Point')
          .replace(/Fate Opportunity/gi, 'Key Astrological Catalyst')
          // ── V140: 英文全角标点转半角 (军师抓包: （not the person）残留) ──
          // 🛠️ V208-fix: 移除中文括号而非转换为英文括号(否则与另一半括号不匹配时导致dangling括号)
          .replace(/（/g, '')
          .replace(/）/g, '')
          .replace(/，/g, ', ')
          .replace(/：/g, ': ')
          .replace(/；/g, '; ')
          .replace(/  +/g, ' ');
      }
      // ── V150: 西班牙语/法语全角括号转半角 (军师抓包: exclus）ivas) ──
      if (lang !== 'zh') {
        return text
          .replace(/（/g, '(')
          .replace(/）/g, ')')
          .replace(/，/g, ',')
          .replace(/：/g, ':')
          .replace(/；/g, ';')
          // ── V150: 词界保护 — 修复右括号插在单词中间 (exclus)ivas → exclusivas) ──
          .replace(/([A-Za-z]+)\)([A-Za-z]+)/g, '$1$2)');
      }
      return text;
    };
    // 🛠️ V131c-fix: 月报原用 geminiFullText(函数返回值)替代 fullTextCollector(onChunk只收flush块,缺最后pending段)
    //    ⚠️ 实测回归: callDeepSeekStream 返回值(geminiFullText)在某些报告被截断(仅 Overview+第1周,约1040字),
    //       而 fullTextCollector(流式累加) 反而是全量(8151字)。两者互为长短,
    //       → 取【较长者】作为月报 sanitized 源,根治"结尾 sanitized 截断到第1/2周"。
    console.log('[V276-DIAG] geminiFullText.len=' + (geminiFullText?.length||0) + ' | fullTextCollector.len=' + (fullTextCollector?.length||0) + ' | 选择:' + ((geminiFullText && geminiFullText.length > (fullTextCollector||'').length) ? 'geminiFullText' : 'fullTextCollector'));
    // 🛠️ V394-fix: 源选择根治——优先 fullTextCollector(用户真看到的流:已NFC+去重+含V386注入主题头),
    //   仅当 geminiFullText NFD归一化后仍显著更长(>15%,防NFD虚长30%)才选它(覆盖callDeepSeek返回值独有的完整尾段)。
    //   根因: _dsFull 是 callDeepSeekStream 内部累积的原始AI输出——未过 _dedupWrite 的 NFC 归一,
    //   越南语NFD形态比NFC长~30%,导致旧逻辑总是选中 NFD 的 geminiFullText → cleanedText 无主题头(V386注入只在fullTextCollector)
    //   → fixMonthlySectionTitles 注入占位符头 → sanitized 正文丢失/占位符胜出。
    // 🛠️ V396-fix: DeepSeek异常时geminiFullText未赋值，||''保证undefined不抛次生错
    const _gfNfc = (geminiFullText ?? '').normalize('NFC');
    const _fcNfc = (fullTextCollector || '').normalize('NFC');
    const _useGemini = (_gfNfc.length > _fcNfc.length * 1.15) && _gfNfc.length > 2000;
    const _monthlySrc = _useGemini ? _gfNfc : _fcNfc;
    console.log('[V394-DIAG] gfNFC=' + _gfNfc.length + ' | fcNFC=' + _fcNfc.length + ' | useGemini=' + _useGemini + ' | _monthlySrc.len=' + (_monthlySrc?.length||0));
    let rawText = langPunctuationClean(reportType === 'monthly' ? _monthlySrc : fullTextCollector, lang);
    // 🛠️ V200: 占位符从 natal 本命盘读取(computed_houses.Sun.house 而非流年 months[0].sun.house)
    const natalH = astroMatrix?.meta?.computed_houses || {};
    const _gJupH = natalH.Jupiter?.house ?? 2;
    const _gSatH = natalH.Saturn?.house ?? 10;
    const _gPltH = natalH.Pluto?.house ?? 8;
    const _gSunH = natalH.Sun?.house ?? 1;
    const _gMooH = (() => {
      if (natalH.Moon) return natalH.Moon.house;
      const m0 = astroMatrix.months?.[0];
      return m0?.moon?.house ?? 2;
    })();
    const _tokMap2 = {
      '{{JUPITER_HOUSE}}': '第' + _gJupH + '宫',
      '{{SATURN_HOUSE}}': '第' + _gSatH + '宫',
      '{{PLUTO_HOUSE}}': '第' + _gPltH + '宫',
      '{{SUN_HOUSE}}': '第' + _gSunH + '宫',
      '{{MOON_HOUSE}}': '第' + _gMooH + '宫',
    };
    for (const [_t, _v] of Object.entries(_tokMap2)) {
      if (_t && _v) rawText = rawText.split(_t).join(_v);
    }
  // V152: 月度非流式也加括号补全
  let cleanedText = reportType === 'monthly' ? fixSectionBrackets(rawText, lang) : rawText;
  // ── V158: 月报空括号/孤儿标点清洗(月报路径跳过 final_text_sanitizer,需独立处理)──
  if (reportType === 'monthly') cleanedText = cleanMonthlyBrackets(cleanedText, lang);
    // 🛠️ V271: 调用归一化清洗器，补全 LLM 概率性漏标的周标题标签
    if (reportType === 'monthly') cleanedText = normalizeReportTags(cleanedText, lang);
    // 🛠️ V102s: 流式端点接入完整清洗器(此前只跑 langPunctuationClean,漏了宫位降维/月锁/前世清洗)
    const _ascStream = astroMatrix?.meta?.rising_sign || 'Cancer';
    // 🛠️ V104e: 本命太阳断言器 + 反向括号补丁
    // 🛠️ V115-fix3: MISS流式路径 Body 正文本命太阳全护
    if (realSunSign) {
      ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].forEach(wrong => {
        if (wrong === realSunSign) return;
        const _r1 = new RegExp(`作为${wrong}之人`, 'g');
        const _r2 = new RegExp(`${wrong}之人`, 'g');
        const _r3 = new RegExp(`你是${wrong}`, 'g');
        cleanedText = cleanedText.replace(_r1, realSunSign).replace(_r2, realSunSign).replace(_r3, realSunSign);
      });
    }
    // 🛠️ V140: 英文本命太阳断言器 (军师核弹级抓包: 1973-12-12射手座被误写Cancer Sun)
    // 根因: LLM 把流年太阳(Transit Sun in Cancer)误当本命太阳。只拦"当本命用"的错误表述,
    // 不误杀合法的"the Sun in Cancer"(指流年)。
    if (lang === 'en') {
      const natalEN = astroMatrix?.meta?.sun_sign || '';
      if (natalEN) {
        const SIGNS_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
        SIGNS_EN.forEach(wrong => {
          if (wrong === natalEN) return;
          // "your <wrong> Sun" → "your <natal> Sun"
          cleanedText = cleanedText.replace(new RegExp(`\\byour ${wrong} Sun\\b`, 'gi'), `your ${natalEN} Sun`);
          // "<wrong> Sun's" → "<natal> Sun's"
          cleanedText = cleanedText.replace(new RegExp(`\\b${wrong} Sun's\\b`, 'g'), `${natalEN} Sun's`);
          // "as a <wrong> Sun" / "as a <wrong>," → natal
          cleanedText = cleanedText.replace(new RegExp(`\\bas a ${wrong} Sun\\b`, 'gi'), `as a ${natalEN} Sun`);
          // "you are a <wrong>" / "you, a <wrong>" → natal
          cleanedText = cleanedText.replace(new RegExp(`\\byou are a ${wrong}\\b`, 'gi'), `you are a ${natalEN}`);
          // "your natal <wrong>" → "your natal <natal>"
          cleanedText = cleanedText.replace(new RegExp(`\\byour natal ${wrong}\\b`, 'gi'), `your natal ${natalEN}`);
        });
      }
    }
        // 🛠️ V161: 法文本命/Transit太阳断言器 (军师核弹级抓包: 1993-09-18处女座被误写Votre Soleil en Cancer)
    // 根因: LLM 偶发把流年太阳(Transit Sun in Cancer)写成 "Votre Soleil en Cancer"，混淆本命
    // 修复: 全量改 'votre Soleil'→'le Soleil'(流年),不改成处女座(保留流年真值)
    if (lang === 'fr') {
      // 月报正文太阳=流年太阳(7月=巨蟹座)，统一 'votre Soleil' → 'le Soleil'
      // 彻底消除本命/流年混淆视觉错误(报头本命太阳由locks锁死,不在此格式)
      cleanedText = cleanedText.replace(/votre Soleil(?! natal)/gi, 'le Soleil');
    }
    // 🛠️ V162: 月报标题补 [ ] (流式路径确保覆盖 fixSectionBrackets,根治四周标题缺[])
    if (reportType === 'monthly') cleanedText = fixSectionBrackets(cleanedText, lang);
    // 🛠️ V163: 清除 LLM 幻觉的 Prompt 残留括号 (es: sin usar el término 等元指令漏出)
    if (lang === 'es') {
      cleanedText = cleanedText.replace(/\(\s*(sin usar|no usar|sans utiliser|ne pas utiliser)[^)]{0,20}t[eé]rmino|terme\s*\)/gi, '');
    }
    // 🛠️ V131b-fix: 月报文本已经过 fixMonthlySectionTitles 完整清洗(流式路径)，
    // final_text_sanitizer + applyMonthLockSanitizer 的贪婪正则对月报格式
    // 有破坏性(HIT/MISS不一致 bug)，跳过直接用基础清洗
    // 🛠️ V131c-fix: 月报跳过全部后续清洗链(空括号/standardizeReport)，仅做 FFFD 清理
    if (reportType === 'monthly') {
      // 🛠️ V133g-fix4: 月报路径内嵌括号计数修复（stripAspectTermsAndPlutoHouse计数法移植）
      const _oc2 = (cleanedText.match(/（/g)||[]).length;
      const _cc2 = (cleanedText.match(/）/g)||[]).length;
      if (_cc2 > _oc2) {
        let _ex2 = _cc2 - _oc2;
        const _rv2 = cleanedText.split(''); _rv2.reverse();
        for (let i=0; i<_rv2.length && _ex2>0; i++) { if (_rv2[i]==='）') { _rv2[i]=''; _ex2--; } }
        cleanedText = _rv2.reverse().join('');
      }
      cleanedText = cleanedText.replace(/\uFFFD/g, '').replace(/\uFFFD/g, '');
      // 🛠️ V166-fix: 补回月报 house_linter(非破坏性,仅修正行星-宫位映射,杜绝英文月报木/冥/土星宫位幻觉)
      // 🛠️ V189: 消费陷阱+括号兜底（MISS月报路径）
      // 🛡️ V233-fix: 法语/西班牙语清洗
      if (lang === 'fr') { cleanedText = fixFrenchTypo(fixFrenchSpacing(cleanedText)); }
      if (lang === 'es') { cleanedText = fixSpanishSpacing(cleanedText); }
      cleanedText = cleanConsumerTrapAndBrackets(cleanedText);
      // 🛠️ V210: 西班牙语月报专项——双重标题最终兜底
      // 场景: AI同时输出裸头和带⚠️的头，或输出[Sombra Financiera] Trampas de Gasto Jul 2026]
      // 修复: 统一 → ✦\n[⚠️ Sombra Financiera]
      if (lang === 'es') {
        // 终极清洗:不管[Sombra Financiera]出现在哪里,都统一收口
        // 合并跨chunk边界的双重标题:[Sombra Financiera] + [⚠️ Sombra Financiera]
        cleanedText = cleanedText
          .replace(/\[Sombra Financiera[^\]]*\]\s*⚠️\s*\[Sombra Financiera[^\]]*\]/g, '✦\n[⚠️ Sombra Financiera]')
          .replace(/\[Sombra Financiera[^\]]*\]\s*⚠️\s*Sombra Financiera[^\n\[]*/g, '✦\n[⚠️ Sombra Financiera]')
          .replace(/\[Sombra Financiera[^\]]*\]\s*Trampas[^\n]+/g, '✦\n[⚠️ Sombra Financiera: Trampas de Gasto Julio 2026]')
          .replace(/^\[Sombra Financiera[^\]]*\]$/gm, '')
          .replace(/\[Sombra Financiera[^\]]*\]\s*\[Sombra Financiera[^\]]*\]/g, '✦\n[⚠️ Sombra Financiera]')
          .replace(/(?<!✦\n)(\[⚠️\s*Sombra[^\]]*\])/g, '✦\n$1');
      }
      // 🛡️ V459: applyMoonWeekHardOverride 必须先于 house_linter/fixMonthlySectionTitles 跑！
      //   根因: 流式路径原本 house_linter → fixMonthlySectionTitles 在前，applyMoonWeekHardOverride(V438) 在后；
      //   这俩清洗会把月亮 Trail 文本（星座+括号宫位+→分隔）改坏，导致 V438 的 tokRe 失配、整段替换失效，
      //   流式月报 W2/W3/W4 出现白羊座幻觉循环（非流式路径无 house_linter 且 V438 在最后，故一直正常）。
      //   提序后 V438 拿到原始 Trail（与非流式一致），替换成功；house_linter/fixMonthlySectionTitles 后续跑且不碰 Trail，安全。
      cleanedText = applyMoonWeekHardOverride(cleanedText, lang, astroMatrix);  // 🛡️ V438 (FIRST)
      cleanedText = house_linter(cleanedText, astroMatrix);
      // 🛠️ V256-fix: 月报全量 Overview/陷阱 注入——根因: 原 fixMonthlySectionTitles(true) 误置于 yearly else 分支,
      //   if(reportType==='monthly') 在 yearly 分支内永假→从不执行; 流式逐chunk flush 处 injectPlaceholders=false 须保留(防半截分片斩首单词),
      //   故改在【整段流结束后】此处(全量 cleanedText)以 true 注入, 确保 6 段齐全。hasOverview/hasTrap 检测已升级全语言。
      cleanedText = fixMonthlySectionTitles(cleanedText, true, lang);
      cleanedText = lockNatalAnchorRole(cleanedText, lang, astroMatrix, reportType);   // 🛡️ V444
      cleanedText = lockTransitPlanetSigns(cleanedText, lang, astroMatrix, reportType); // 🛡️ V445
    } else {
      // 🛡️ V492/E7: 取消年报跳过 house_linter 的特权——年报（全语言）纳入真值纠偏防线。
      //   strictAnchor=true：仅认中/英月锚点逐月纠偏；锚点不匹配（如 th）⇒ 透传，绝不单月纠偏全文。
      cleanedText = house_linter(cleanedText, astroMatrix, null, { strictAnchor: true });
      cleanedText = natal_sun_linter(astro_phase_linter(final_text_sanitizer(cleanedText, _ascStream, lang)), realSunSign, _ascStream);
      cleanedText = applyMonthLockSanitizer(cleanedText, astroMatrix, null, null, lang);

    // 🛠️ V122-fix: 终极空括号清理(final_text_sanitizer 可能漏 "()" 跨块,
    //   完整文本这里再扣一遍)
    // 🛡️ V477-fix: 下一行字面括号未转义——写法是 [一-龥] 而非 [\u4e00-\u9fa5],
    //   故 V476 的源码封禁闸门(只抓 \u4e00 写法)与 final_text_sanitizer 修复都漏了它!
    //   实测: "先知神谕·财富启示录" → "先神·财启录"(CJK 存活 56.5%),正是线上 1989 盘缺字毒化真凶。
    const _v477Pre = cleanedText;  // 🛡️ V477: 收尾清洗前快照(供守恒守卫回滚)
    cleanedText = cleanedText.replace(/([一-龥])\(\)([一-龥])/g, '$1$2');
    cleanedText = cleanedText.replace(/[((][A-Za-z][A-Za-z0-9 ,.'":;\-]{0,40}?[))](?=[一-龥])/g, '');
    cleanedText = _v477Guard(_v477Pre, cleanedText, 'post-stream');

    // 🛠️ V108-fix8: MISS 流式路径补 standardizeReport(HIT 路径已调用,此处漏掉导致章节 ✦ 注入缺失)
    cleanedText = standardizeReport(cleanedText);
    
    // 🛠️ V222e: 月报格式铁律（主公裁决）——强制统一周标题格式
    if (reportType === 'monthly') {
      cleanedText = fixMonthlySectionTitles(cleanedText, true, lang);
    }

    // 🛠️ V377-fix: 主题标题行规范化——LLM 输出漂移(# markdown头/漏尾✦/方括号缺失)统一为 "✦ [🔮 X] ✦" 独占行
    // 根因: Gemini 英文偶发输出 "# ✦ [🔮 Monthly Destiny Theme] ✦"(带#)或漏尾✦, 前端 parseLine 行首非✦则回退普通文本(不金色不居中)
    // V377-fix: 保留原始副标题(如 "Strategic Alignment & Wealth Expansion")，不截断
    if (reportType === 'monthly') {
      const _themeStd = { zh:'本月命运主题', en:'Monthly Destiny Theme', es:'Tema de Destino Mensual', fr:'Thème de Destin du Mois', th:'ธีมโชคชะตา', vi:'Chủ Đề Vận Mệnh Tháng' }[lang] || '本月命运主题';
      const _themeRe = /^✦?\s*[\[【]?\s*(?:🔮\s*)?(本月命运主题|月度命运主题|Monthly Destiny Theme|Tema de Destino Mensual|Th[èe]me de Destin du Mois|ธีมโชคชะตา|Chủ Đề Vận Mệnh Tháng)([^\]】✦]*)/i;
      cleanedText = cleanedText.split('\n').map(_l => {
        const _s = _l.trim().replace(/^[#>_*\-]+\s*/, ''); // 剥 markdown # 头等
        const _m = _s.match(_themeRe);
        if (_m) {
          const _sub = (_m[2] || '').trim().replace(/^[:：]\s*/, '').replace(/[\]】]?\s*✦?$/, '').trim();
          const _fullTitle = _sub ? (_themeStd + ': ' + _sub) : _themeStd;
          return '✦ [🔮 ' + _fullTitle + '] ✦';
        }
        return _l;
      }).join('\n');
    }

    // 🛠️ V108-fix1: 终极乱码清洗--sanitized 事件前最后一次 FFFD 清扫
    cleanedText = cleanedText.replace(/�/g, '').replace(/�/g, '');
    }

    // 🛡️ V492/R5: 高纬告知——WholeSignFallback 盘首段注入等宫制告知（后端拼接，非 LLM 生成）
    cleanedText = injectHighLatitudeNotice(cleanedText, astroMatrix, lang);

    // V100i2: 用清洗后的完整文本替换显示(清除中文标点污染)
    // V113-fix5: client sanitized 和 writeToCache 都用 cleanedText(标准化后),同一终稿
    // V222q: 原条件 cleanedText !== fullTextCollector 在 text 事件恢复后恒为 false(两者清洗链不同但内容常相同),导致 sanitized 永不发送 → 改无条件发(前端无条件替换,幂等无害)

    // 🛠️ 方案 C (2026-08-09 军师裁决): 截断检测 + 同步补全, 在 [DONE] 前完成
    //    原逻辑: 补全在 res.end() 后后台执行 → 当前用户只看到半截流, 补全版仅进缓存(下次访问才完整)
    //    现逻辑: 流结束即检测, 不完整则同步非流式补全(8s 心跳保活), 成功后覆盖 cleanedText
    //            → sanitized 事件与缓存自动使用完整版, 前端 WealthReportPage.tsx:2043-2050 整体平滑替换
    const hasFinalOracle = fullTextCollector.includes('Final Wealth Oracle') ||
      fullTextCollector.includes('The Final Wealth Oracle') ||
      fullTextCollector.includes('最终财富神谕');
    // 月报完整性阈值: 正常 5000-8000 字符, <2000 判定 LLM 提前终止(原 500 过宽, 1000 字半截不触发补全)
    const isComplete = reportType === 'yearly'
      ? (hasFinalOracle && fullTextCollector.length > 8000)
      : (fullTextCollector.length > 2000);

    if (!isComplete && fullTextCollector.length > 100) {
      console.log(`[wealth-stream] [WARN] Stream truncated (${fullTextCollector.length} chars < 2000), sync completing before [DONE]...`);
      try {
        const fullRes = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + deepseekKey },
          body: new TextEncoder().encode(JSON.stringify({
            model: 'deepseek-flash',
            messages: [
              { role: 'system', content: prompt.system },
              { role: 'user', content: prompt.user },
            ],
            max_tokens: 64000,
            temperature: 0,
            seed: seedFromUserPrompt(prompt.user),
          })),
        });
        if (fullRes.ok) {
          const fdata = await fullRes.json();
          let ft = fdata.choices?.[0]?.message?.content || '';
          // 🛠️ V102s: 补全文本也过一道完整清洗再落库(防脏缓存)
          if (ft) ft = applyMonthLockSanitizer(astro_phase_linter(final_text_sanitizer(langPunctuationClean(ft, lang), _ascStream, lang)), astroMatrix, null, null, lang);
          // 🛠️ V115-fix3: Completion路径 Body 正文本命太阳全护
          if (realSunSign) {
            ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].forEach(wrong => {
              if (wrong === realSunSign) return;
              const _r1 = new RegExp(`作为${wrong}之人`, 'g');
              const _r2 = new RegExp(`${wrong}之人`, 'g');
              ft = ft.replace(_r1, realSunSign).replace(_r2, realSunSign);
            });
          }
          if (ft) ft = natal_sun_linter(ft, realSunSign, _ascStream);
          // 🛠️ V231-fix: 补全版补齐标题契约(standardizeReport + fixMonthlySectionTitles), 否则 sanitized 无 ✦ 装饰符
          if (ft) ft = standardizeReport(ft);
          if (ft && reportType === 'monthly') ft = fixMonthlySectionTitles(ft, true, lang);
          if (ft) ft = lockNatalAnchorRole(ft, lang, astroMatrix, reportType);   // 🛡️ V444
          if (ft) ft = lockTransitPlanetSigns(ft, lang, astroMatrix, reportType); // 🛡️ V445
          if (ft) ft = applyMoonWeekHardOverride(ft, lang, astroMatrix);  // 🛡️ V438
          if (ft) ft = lockYearlyMonthTitles(ft, lang, astroMatrix, reportType);  // 🛡️ V478b 年报月标题逐月真值锁
          if (ft) ft = normalizeYearlyMarkup(ft, lang, reportType);  // 🛡️ V480 年报结构归一
          if (ft) ft = lockYearlyTransitSigns(ft, lang, astroMatrix, reportType);  // 🛡️ V482 年报逐月流年行星真值锁
          if (ft) ft = lockYearlyOuterPlanetsYear(ft, lang, astroMatrix, reportType);  // 🛡️ V485 年度恒定外行星全文真值锁
          if (ft) ft = lockYearlyNonMonthSunRef(ft, lang, astroMatrix, reportType);  // 🛡️ V488 年报非月段流年太阳真值锁
          if (ft) ft = stripYearlyPromptLeakage(ft, lang, reportType);  // 🛡️ V485b Prompt 字段泄漏清理
          if (ft) ft = _v517YearlyFinalLocks(ft, lang, astroMatrix, reportType);  // 🛡️ E17/R11j 年报四锁(补全链)
          if (ft && ft.length > cleanedText.length) {
            console.log(`[wealth-stream] [OK] Sync completion success, ${ft.length} chars > ${cleanedText.length}, overriding for sanitized/cache`);
            cleanedText = ft; // sanitized 事件与缓存自动使用完整版
          } else {
            console.log(`[wealth-stream] [WARN] Sync completion returned ${ft.length} chars (stream had ${cleanedText.length}), keep stream text`);
          }
        } else {
          const errBody = await fullRes.text().catch(() => '');
          console.error(`[wealth-stream] [ERROR] Sync completion failed ${fullRes.status}: ${errBody.slice(0, 200)}`);
        }
      } catch (e) {
        console.error('[wealth-stream] 同步补全异常,降级原流输出:', e.message);
      }
    }

    // 🛡️ V318-fix: 多份报告守卫——只对极端超长文本(>25000字)触发，此时很可能是 AI 无节制输出多份
    // V317 的 _dedupParagraphs 已经精确处理正常重复，这个守卫只管极端情况
    if (cleanedText && cleanedText.length > 25000) {
      const _s2 = '第2周', _e2 = 'Week 2';
      const _isZh = cleanedText.includes(_s2);
      const _p2 = _isZh
        ? (() => { let p = cleanedText.indexOf(_s2); return cleanedText.indexOf(_s2, p + 1); })()
        : (() => { let p = cleanedText.indexOf(_e2); return cleanedText.indexOf(_e2, p + 1); })();
      if (_p2 > 0) {
        console.warn(`[V318-fix] 极端超长(${cleanedText.length}字)→截断第2周重复: ${_p2}字`);
        cleanedText = cleanedText.substring(0, _p2);
      }
    }

    // 🛠️ V383-fix5: 后处理兜底 — 强制 vi 月报消费陷阱段含真实阈值 ₫500,000(stream MISS 路径)
    // 必须在 sanitized 发送 + 缓存落库前、且晚于「方案C同步补全」覆盖,确保阈值必现(即便补全路径跑过)
    // 🛠️ V414: 语言门控——越南语专用清洗不得作用于 zh/en/es/fr/th
    // 🛠️ V424: 泰语 sync completion 补 lockNatalTruthTh
    if (lang === 'vi') cleanedText = lockNatalTruthVi(enforceRiskThreshold(cleanedText, lang), astroMatrix);
    if (lang === 'vi') cleanedText = lockTransitTruthVi(cleanedText, astroMatrix);
  if (lang === 'fr') cleanedText = lockNatalTruthFr(enforceRiskThreshold(cleanedText, lang), astroMatrix);
  if (lang === 'fr') cleanedText = lockTransitTruthFr(cleanedText, astroMatrix);
    if (lang === 'th') cleanedText = lockNatalTruthTh(enforceRiskThreshold(cleanedText, lang), astroMatrix);
    if (lang === 'th') cleanedText = lockTransitTruthTh(cleanedText, astroMatrix);
    cleanedText = applyV434Locks(cleanedText, lang, astroMatrix);   // V434（补 V433 未挂的落库前收尾链）
    // 🛠️ V432: MISS stream 收尾 en/es/zh 真值双锁（完整文本、落库前最后一道）
    cleanedText = lockNatalAnchorRole(cleanedText, lang, astroMatrix, reportType);   // 🛡️ V444
    cleanedText = lockTransitPlanetSigns(cleanedText, lang, astroMatrix, reportType); // 🛡️ V445
    if (_V432_LANGS.includes(lang)) cleanedText = applyTruthLocksEnEsZh(cleanedText, lang, astroMatrix, reportType);
    else cleanedText = _v516OutputHygiene(cleanedText, lang);   // 🛡️ E16/R11g-fix: fr/th/vi 形态卫生（落库前最后一道）
    // 🛡️ V460-fix3: 月亮周轨迹真值锁必须拿【最终话语权】。
    //   实测：V438 在 house_linter 之前跑完后，本收尾链(V434/V444/V445/V432)会把月亮轨迹再次改坏
    //   （线上 sanitized 实测 W2-W4 变成「狮子座（第9宫）、白羊座（第5宫→第10宫）…」）。
    //   在落库前最后一道再跑一次（已验证幂等），确保最终 sanitized / 缓存落库的都是真值序列。
    cleanedText = applyMoonWeekHardOverride(cleanedText, lang, astroMatrix);  // 🛡️ V438-final
    cleanedText = lockYearlyMonthTitles(cleanedText, lang, astroMatrix, reportType);  // 🛡️ V478b 年报月标题逐月真值锁(落库前最后一道)
    cleanedText = normalizeYearlyMarkup(cleanedText, lang, reportType);  // 🛡️ V480 年报结构归一(落库前最后一道)
    cleanedText = lockYearlyTransitSigns(cleanedText, lang, astroMatrix, reportType);  // 🛡️ V482 年报逐月流年行星真值锁(落库前最后一道)
    cleanedText = lockYearlyOuterPlanetsYear(cleanedText, lang, astroMatrix, reportType);  // 🛡️ V485 年度恒定外行星全文真值锁(落库前)
    cleanedText = lockYearlyNonMonthSunRef(cleanedText, lang, astroMatrix, reportType);  // 🛡️ V488 年报非月段流年太阳真值锁(落库前)
    cleanedText = _v432LockLeadingNatal(cleanedText, lang, astroMatrix, reportType);  // 🛡️ V492b/E9 年报前导段本命真值强锁(落库前最后一道, 对前导段拥有最终话语权)
    cleanedText = stripYearlyPromptLeakage(cleanedText, lang, reportType);  // 🛡️ V485b Prompt 字段泄漏清理(落库前)
    cleanedText = _v517YearlyFinalLocks(cleanedText, lang, astroMatrix, reportType);  // 🛡️ E17/R11j 年报四锁(落库前最后一道)
    auditYearlyStyleRepetition(cleanedText, lang, reportType);  // 📊 V486 文风复读审计(只检不改, 落库前, 仅日志)
    cleanedText = dedupYearlyMonthTitles(cleanedText, lang, reportType);  // 🛡️ V483c 年报月标题终局去重(落库前最后一道, 防 24 行毒缓存)
    // 🛡️ E20/R11n: 元素归纳段流年坐标剪枝锁(与 /api/wealth-oracle 非流式端点同源) —— 先剪坐标再收口。
    if (reportType === 'yearly') cleanedText = stripYearlyElementCoordLeak(cleanedText, lang, reportType);
    // 🛡️ E21/R11o: 宫位语义标签契约锁(与非流式端点同源) —— 保数字、剪错配标签。
    cleanedText = fixHouseOrdinalSuffix(cleanedText);   // 🛡️ E23/R11q ②: 序数后缀笔误归一(形态先行)
    cleanedText = stripHouseSemanticLabelMismatch(cleanedText, lang, reportType);
    // 🛡️ E19/R11m: 真值锁最终话语权(与 /api/wealth-oracle 非流式端点同源) —— 见该处函数头注释:
    //   链中段真值锁在「句窗含年份/月份词」时弃权, 而残渣随后被清掉 ⇒ 残差漏纠;
    //   故在所有清洗/去重之后收口重跑。实测 12 盘零 churn, 仅修残差, 二次施加幂等。
    if (reportType === 'yearly') cleanedText = _v432LockLeadingNatal(cleanedText, lang, astroMatrix, reportType);
    // 🛡️ E22/R11p: 宫位语义标签契约锁**链末收口**（与非流式端点同源）—— 见 /api/wealth-oracle 处注释：
    //   E19/R11m 链末真值锁会把 natal 行星真值误绑到同句流年子句的宫号上（7→10、标签原地不动），
    //   而 E21 锁挂在其之前 ⇒ 后置错配直达落库。故在真值收口之后再施加一次（纯过滤器、幂等）。
    cleanedText = fixHouseOrdinalSuffix(cleanedText);   // 🛡️ E23/R11q ②: 序数后缀笔误归一(链末再兜一次)
    cleanedText = stripHouseSemanticLabelMismatch(cleanedText, lang, reportType);
    if (reportType === 'monthly') cleanedText = fixMoonHouseParens(cleanedText);  // 🛠️ V460-fix4
    // 🛠️ V389: MISS 路径补齐越南语清洗(军师拍板) — 与 HIT 路径(6054)100%对齐,
    //   抹平 Thá ng(词内空格)/mayắn(吞辅音) 类越南语编码缺陷,在流式生成阶段即修复。
    if (lang === 'vi') {
      cleanedText = fixVietnameseCorruption((cleanedText || '').normalize('NFC'));
    }
    // 🛡️ E23/R11q ④: well-formed 保证（孤立代理项 ⇒ 写库 400 PGRST102 ⇒ 永不落库）——
    //   置于 `_sanitizedForClient`（客户端终稿）与 `writeToCache`（落库文本）的**共同上游** ⇒ 两者仍逐字同源。
    cleanedText = _v525WellFormed('stream/' + lang + '/' + reportType, cleanedText);

    // 🛠️ V316-fix3: sanitized 事件去重——在发送前调用去重，确保客户端收到的 sanitized 是单份完整报告
    let _sanitizedForClient = cleanedText;
    if (typeof _dedupParagraphs === 'function' && cleanedText && cleanedText.length > 500) {
      _sanitizedForClient = _dedupParagraphs(cleanedText);
      if (_sanitizedForClient.length < cleanedText.length) {
        console.log(`[wealth-stream] [V316-fix3] sanitized 去重: ${cleanedText.length}→${_sanitizedForClient.length}字`);
      }
    }
    // 🛠️ V389: 确保清洗版 sanitized 击败前端"保留较长者"守卫(WealthReportPage.tsx:2104)。
    //   清洗(金额13→9字符 / 越南语修复)必然缩短,导致前端丢弃清洗版、保留脏text→用户看到错误金额/Thá ng。
    //   补尾空白使 sanitized 长度 > 原始流,清洗版(含₫500,000 + 越南语修复)必现。纯后端、零前端改动。
    // 🛠️ V394-fix: 占位符残渣守卫——若清洗版仍是占位符(主题头注入失败/源异常短),补长只会让
    //   前端"较长者"守卫选中垃圾(用户看到占位符+几千空格,正文消失)。此时【不发 sanitized】,前端回退 text 流。
    const _phMarker = /【(?:Hệ Thống Chèn|System-Injected|占位符-系统注入|Inyección del Sistema|Injection Système|ระบบป้ายแทรก)】|vui lòng làm mới|please refresh|actualice|actualisez|กรุณารีเฟรช/i;
    const _isPlaceholderResidue = _sanitizedForClient && (
      _sanitizedForClient.length < 3000 && _phMarker.test(_sanitizedForClient)
    );
    const _rawStreamLen = (fullTextCollector || '').length;
    if (_isPlaceholderResidue) {
      console.warn('[V394] sanitized 占位符残渣(' + _sanitizedForClient.length + '字), 不发送, 前端回退 text 流(' + _rawStreamLen + '字)');
    } else {
      if (_sanitizedForClient.length < _rawStreamLen) {
        _sanitizedForClient = _sanitizedForClient + '\n\n' + ' '.repeat(_rawStreamLen - _sanitizedForClient.length + 64);
      }
      if (_sanitizedForClient && _sanitizedForClient.length > 100) {
        try {
          res.write(Buffer.from(`data: ${JSON.stringify({ sanitized: _sanitizedForClient })}\n\n`, 'utf-8'));
        } catch(e) {}
      }
    }

    // 流式结束,发送 [DONE]
    res.write('data: [DONE]\n\n');
    if (typeof res.flush === 'function') res.flush();

    // 🛠️ V125-fix: streaming结束立即写缓存(不依赖completion是否成功) —— 方案C: cleanedText 可能已被补全版覆盖
    // 🛠️ V222z-fix3: 写缓存门槛从100→2000, 与截断检测阈值拉齐, 防止截断碎片(<2000字)毒化缓存
    // 🛠️ V315-fix: 段落级去重防缓存污染（去重后重新计算长度，门槛仍用2000）
    if (typeof cleanedText === 'string' && cleanedText.length > 0) {
      const _deduped = _dedupParagraphs(cleanedText);
      if (_deduped.length < cleanedText.length * 0.95) {
        console.log('[wealth-stream] [V315] 段落去重: ' + cleanedText.length + '→' + _deduped.length + '字, 删' + (cleanedText.length - _deduped.length) + '字重复');
        cleanedText = _deduped;
      }
    }
    if (cleanedText.length > 2000) {
      console.log(`[wealth-stream] [WRITE-CACHE] Streaming done, writing ${cleanedText.length} chars to cache: ${cacheKey}`);
      writeToCache(cleanedText).catch((e) => {
        console.error('[wealth-stream] [WRITE-CACHE-ERROR] ' + cacheKey + ': ' + (e && e.message));
      });
    } else {
      console.warn('[wealth-stream] [WRITE-CACHE-SKIP] cleanedText too short: ' + cleanedText.length + ' chars');
    }

    res.end();

  } catch (err) {
    clearTimeout(aiTimeout); // V75: Error or abort, cancel timeout
    try { clearInterval(heartbeat); } catch(e){} // V75: also clear heartbeat
    console.error('[Stream Error]', err.message, '| Stack:', err.stack?.substring(0, 500));
    // 找到出错字符串中第13个字符的值
    const errMsg = err.message;
    console.error('[Stream Error] char13=', errMsg.charCodeAt(13), '| msg_len=', errMsg.length);
    // 尝试写入错误(避免中文导致编码问题)
    const safeErr = err.message.replace(/[^\x00-\x7F]/g, '?');
    try { res.write(Buffer.from(`data: ${JSON.stringify({ error: safeErr })}\n\n`, 'utf-8')); } catch(e) {}
    try { res.end(); } catch(e) {}
  }
});

// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// 🌊 V116: /api/wealth-oracle/v2 - 分片滚动年报引擎
// 架构:V69月度数据 → JS季度聚合 → 4×Gemini实时SSE流 → 缓存落库
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/wealth-oracle/v2', async (req, res) => {
  const {
    birthDate,
    birthTime = '12:00',
    lang = 'zh',
  } = req.body;
  if (!birthDate) return res.status(400).json({ error: 'birthDate required' });

  // 🛡️ V490: 时区强校验与三级回退（同 /api/wealth-oracle）—— 必须在 SSE header 之前返回 400
  //   ⚠️ 传**原始** lat/lon 做 Tier-2 推定（坐标合法性由下方 V490b 闸门独立把关）。
  const _tzr = resolveTimeZone(req.body.tz, req.body.lat, req.body.lon);  // ⚠️ 传原值(不预转 Number)：null 不可被 Number() 洗成 0
  if (!_tzr.ok) {
    console.warn(`[TZ_FALLBACK_WARNING] (v2) 无法解析时区 input=${JSON.stringify(req.body.tz)} lat=${req.body.lat} lon=${req.body.lon} → HTTP 400`);
    return res.status(400).json({ success: false, code: 'INVALID_TIMEZONE', error: `Invalid time zone: ${req.body.tz}` });
  }
  const tz = _tzr.tz;
  if (_tzr.corrected) {
    console.warn(`[TZ_RESOLVED] (v2) ${JSON.stringify(_tzr.input)} → ${tz} (tier=${_tzr.tier}/${_tzr.reason})`);
  }

  // 🛡️ V490b: 坐标强校验（同 /api/wealth-oracle）—— 必须在 SSE header 之前返回 400
  const _coord = resolveCoordinates(req.body.lat, req.body.lon);
  if (!_coord.ok) {
    console.warn(`[COORD_REJECTED] (v2) lat=${JSON.stringify(req.body.lat)} lon=${JSON.stringify(req.body.lon)} → HTTP 400 (${_coord.reason}: ${_coord.message})`);
    return res.status(400).json(invalidCoordinatesBody(_coord.message));
  }
  const lat = _coord.lat;
  const lon = _coord.lon;

  // ── SSE Headers ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-Deploy-Marker', 'V124-keep-alive');
  res.setHeader('Connection', 'keep-alive');

  const send = (obj) => {
    try {
      const data = typeof obj === 'string' ? obj : JSON.stringify(obj);
      res.write(Buffer.from('data: ' + data + '\n\n', 'utf-8'));
      if (typeof res.flush === 'function') res.flush();
    } catch(e) {}
  };
  const flush = () => { try { if (typeof res.flush === 'function') res.flush(); } catch(e) {} };
  const heartbeat = setInterval(() => { send(': heartbeat\n\n'); flush(); }, 20000);

  const sendStatus = (text) => { send(JSON.stringify({ type: 'status', text })); flush(); };
  // 🛍️ V463: 爆款/法器预留节点首帧下发（V2 年报通道；封仓期 false，前端忽略）
  try { send(JSON.stringify({ meta: { actionable_artefact: buildActionableArtefact() } })); } catch (e) {}
  const sendChunk = (text) => {
    if (lang !== 'zh') { text = text.replace(/（/g, '').replace(/）/g, ''); }
    send(JSON.stringify({ type: 'chunk', text })); flush();
  };
  const sendText = (text) => {
    if (lang !== 'zh') { text = text.replace(/（/g, '').replace(/）/g, ''); }
    send(JSON.stringify({ type: 'text', text })); flush();
  };
  let allText = '';

  try {
    // ── Step 1: V69 月度数据(通过HTTP调用Python引擎)──
    sendStatus('🔮 命运推演引擎启动...');
    const matrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz);
    if (!matrix || !matrix.months || matrix.months.length === 0) {
      throw new Error('V69 engine unavailable - 无法获取星盘数据');
    }
    console.log('[V2] V69 OK: ' + matrix.months.length + ' months, rising=' + (matrix.meta && matrix.meta.rising_sign));

    // ── Step 2: 月度→季度聚合 ──
    const months = matrix.months;
    const meta = matrix.meta || {};
    const risingSign = meta.rising_sign || 'Cancer';

    const SIGN_MAP_ZH = { Aries:'白羊',Taurus:'金牛',Gemini:'双子',Cancer:'巨蟹',Leo:'狮子',Virgo:'处女',Libra:'天秤',Scorpio:'天蝎',Sagittarius:'射手',Capricorn:'摩羯',Aquarius:'水瓶',Pisces:'双鱼' };

    // ── Step 3: System Prompt ──
    const localeMap = { zh: 'zh', en: 'en', fr: 'fr', es: 'es', th: 'th', vi: 'vi' };
    const locale = localeMap[lang] || 'zh';
    const sysPrompt = getSystemPromptByLocale(locale);

    // 🛠️ V148: 第五章空间锚点分语言约束(中文用中文,其余语言自动切换目标语言)
    const CHAPTER5_ZH = `
【第五章:空间财富对齐硬性格式规范】
在撰写第五章(空间/家居/办公室财富对齐)时,你必须严格且毫无例外地遵守以下产品设计隐喻,严禁自行更换宫位或添加其他星座杂质:
1. 卧室区域:必须且只能描述为"第四宫(田宅宫)",代表财富根基与安全感。
2. 厨房区域:必须且只能描述为"第二宫(财帛宫)与第八宫(共享资源)".
3. 财务室/保险柜:必须且只能描述为"第八宫(共享资源)".
4. 客厅/入口/前台/工位/会议室等区域:保持与前述章节一致的宫位描述,不得自行发明宫位。
【强制输出格式模板】:
* **卧室区域:第四宫(田宅宫)**
* **厨房区域:第二宫(财帛宫)与第八宫(共享资源)**
* **财务室区域:第八宫(共享资源)**
严禁添加任何括号外的星座名或宫位变体。`;

    const CHAPTER5_EN = `
[Chapter 5: Spatial Wealth Alignment - Strict Format]
When writing Chapter 5 (Spatial/Home/Office Wealth Alignment), you MUST follow these fixed metaphors without exception:
1. Bedroom Area: describe ONLY as "4th House (Home Foundation)", financial roots and security.
2. Kitchen Area: describe ONLY as "2nd House (Income) & 8th House (Shared Resources)".
3. Financial Room/Safe: describe ONLY as "8th House (Shared Resources)".
4. Living room/Entrance/Reception/Desk/Conference room: follow the house descriptions from previous sections.

[Strict Output Format]:
* **Bedroom Area: 4th House (Home Foundation)**
* **Kitchen Area: 2nd House & 8th House**
* **Financial Room/Safe: 8th House**
Do NOT add any zodiac signs outside parentheses or invent house variants.`;

    const CHAPTER5_ES = `
[Capítulo 5: Alineación de Riqueza Espacial - Formato Estricto]
Al escribir el Capítulo 5 (Alineación de Riqueza Espacial/Doméstica/de Oficina), DEBES seguir estas metáforas sin excepción:
1. Zona del Dormitorio: describir SOLO como "Casa 4 (Hogar)", raíces financieras y seguridad.
2. Zona de la Cocina: describir SOLO como "Casa 2 (Ingresos) y Casa 8 (Recursos Compartidos)".
3. Sala Financiera/Caja Fuerte: describir SOLO como "Casa 8 (Recursos Compartidos)".
4. Sala de estar/Entrada/Recepción/Escritorio/Sala de conferencias: seguir las descripciones de casas de secciones anteriores.

[Formato de Salida Estricto]:
* **Zona del Dormitorio: Casa 4 (Hogar)**
* **Zona de la Cocina: Casa 2 y Casa 8**
* **Sala Financiera/Caja Fuerte: Casa 8**
No añadir signos zodiacales fuera de paréntesis ni inventar variantes de casas.`;

    const CHAPTER5_FR = `
[Chapitre 5: Alignement de Richesse Spatiale - Format Strict]
En rédigeant le Chapitre 5 (Alignement de Richesse Spatiale/Domestique/de Bureau), vous DEVEZ suivre ces métaphores sans exception:
1. Zone de la Chambre: décrire UNIQUEMENT comme "Maison 4 (Foyer)", racines financières et sécurité.
2. Zone de la Cuisine: décrire UNIQUEMENT comme "Maison 2 (Revenus) et Maison 8 (Ressources Partagées)".
3. Bureau/Coffre-fort financier: décrire UNIQUEMENT comme "Maison 8 (Ressources Partagées)".
4. Salon/Entrée/Réception/Bureau/Salle de conférence: suivre les descriptions de maisons des sections précédentes.

[Format de Sortie Strict]:
* **Zone de la Chambre: Maison 4 (Foyer)**
* **Zone de la Cuisine: Maison 2 et Maison 8**
* **Bureau financier/Coffre-fort: Maison 8**
Ne pas ajouter de signes zodiacaux hors des parenthèses ni inventer de variantes de maisons.`;

    const CHAPTER5_TH = `
[บทที่ 5: การจัดตำแหน่งความมั่งคั่งตามพื้นที่ - รูปแบบตายตัว]
เมื่อเขียนบทที่ 5 (การจัดตำแหน่งความมั่งคั่งตามพื้นที่/บ้าน/สำนักงาน), คุณต้องปฏิบัติตามอุปลักษณ์เหล่านี้โดยไม่มีข้อยกเว้น:
1. พื้นที่ห้องนอน: อธิบายได้เพียง "เรือนที่ 4 (รากฐานความมั่งคั่ง)", รากฐานทางการเงินและความปลอดภัย
2. พื้นที่ห้องครัว: อธิบายได้เพียง "เรือนที่ 2 (รายได้) และเรือนที่ 8 (ทรัพยากรที่ใช้ร่วมกัน)"
3. ห้องการเงิน/ตู้นิรภัย: อธิบายได้เพียง "เรือนที่ 8 (ทรัพยากรที่ใช้ร่วมกัน)"
4. ห้องนั่งเล่น/ทางเข้า/เคาน์เตอร์/โต๊ะทำงาน/ห้องประชุม: ใช้คำอธิบายเรือนจากบทก่อนหน้า

[รูปแบบการแสดงผลบังคับ]:
* **พื้นที่ห้องนอน: เรือนที่ 4 (รากฐานความมั่งคั่ง)**
* **พื้นที่ห้องครัว: เรือนที่ 2 และ 8**
* **ห้องการเงิน/ตู้นิรภัย: เรือนที่ 8**
ห้ามเพิ่มราศีนอกวงเล็บหรือคิดค้นรูปแบบเรือนอื่น.`;

    const CHAPTER5_VI = `
[Chương 5: Căn Chỉnh Tài Lộc Theo Không Gian - Định Dạng Bắt Buộc]
Khi viết Chương 5 (Căn Chỉnh Tài Lộc Không Gian/Nhà Ở/Văn Phòng), bạn PHẢI tuân thủ các ẩn dụ này không có ngoại lệ:
1. Khu Vực Phòng Ngủ: mô tả DUY NHẤT là "Cung 4 (Gốc Tài Chính)", gốc rễ tài chính và an toàn.
2. Khu Vực Nhà Bếp: mô tả DUY NHẤT là "Cung 2 (Thu Nhập) & Cung 8 (Tài Nguyên Chia Sẻ)".
3. Phòng Tài Chính/Két Sắt: mô tả DUY NHẤT là "Cung 8 (Tài Nguyên Chia Sẻ)".
4. Phòng khách/Quầy tiếp tân/Bàn làm việc/Phòng họp: dùng mô tả cung từ chương trước.

[Định Dạng Bắt Buộc]:
* **Khu Vực Phòng Ngủ: Cung 4 (Gốc Tài Chính)**
* **Khu Vực Nhà Bếp: Cung 2 và 8**
* **Phòng Tài Chính/Két Sắt: Cung 8**
Không được thêm cung hoàng đạo ngoài dấu ngoặc hay tự nghĩ ra biến thể cung khác.`;

    const CHAPTER5_MAP = { zh: CHAPTER5_ZH, en: CHAPTER5_EN, es: CHAPTER5_ES, fr: CHAPTER5_FR, th: CHAPTER5_TH, vi: CHAPTER5_VI };
    const CHAPTER5_CONSTRAINT = CHAPTER5_MAP[locale] || CHAPTER5_EN;
    const v2SysPrompt = sysPrompt + CHAPTER5_CONSTRAINT;

    // ── Step 4: 年度引言 ──
    // 🛠️ V121-fix: Python 服务未返回本命太阳星座,用 JavaScript 计算覆盖 fallback
    const birthParts = birthDate.split('-');
    const birthYear = parseInt(birthParts[0]);
    const birthMonth = parseInt(birthParts[1]);
    const birthDay = parseInt(birthParts[2]);

    // JavaScript 星座计算函数(同 getZodiacIdx)
    const getNatalSunIdx = (m, d) => {
      const cuts = [[1,20,1],[2,19,2],[3,21,3],[4,20,4],[5,21,5],[6,22,6],[7,23,7],[8,23,8],[9,23,9],[10,24,10],[11,22,11],[12,22,0]];
      for (let i = cuts.length - 1; i >= 0; i--) {
        if (m > cuts[i][0] || (m === cuts[i][0] && d >= cuts[i][1])) return cuts[i][2];
      }
      return 0;
    };
    const SIGNS_EN = ['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'];
    const jsNatalSunSign = SIGNS_EN[getNatalSunIdx(birthMonth, birthDay)];

    const natalSunSign = jsNatalSunSign || meta.sun_sign || 'Pisces';
    const natalMoonSign = meta.moon_sign || 'Cancer';
    const natalRising = risingSign;
    const natalSunZH = SIGN_MAP_ZH[natalSunSign] || natalSunSign;
    const natalMoonZH = SIGN_MAP_ZH[natalMoonSign] || natalMoonSign;
    const natalRisingZH = SIGN_MAP_ZH[natalRising] || natalRising;
    // 用第1个月的数据取年度主星
    const m0Jup = months[0] && months[0].jupiter ? months[0].jupiter.sign : 'Leo';
    const m0Sat = months[0] && months[0].saturn ? months[0].saturn.sign : 'Aries';
    const jupSignZH = SIGN_MAP_ZH[m0Jup] || m0Jup;
    const satSignZH = SIGN_MAP_ZH[m0Sat] || m0Sat;

    sendStatus('✨ 正在书写年度宏观战略...');
    const factSheet = buildFactSheet(matrix, locale) || '';

    // ── 格式化生日(1997-03-18 → 1997年3月18日)──
    const birthDateFormatted = (function() {
      const parts = birthDate.split('-');
      return parts[0] + '年' + parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
    })();

    const introPrompt = v2SysPrompt + '\n\n[V116-V2 INTRO]: 生成年报开场章节(500-800字)。\n\n★ 用户出生日期(必须写入报头,不得虚构):' + birthDateFormatted + '\n★ 年度星盘(报头必须精确引用):\n太阳' + natalSunZH + '座 / 月亮' + natalMoonZH + '座 / 上升' + natalRisingZH + '座\n木星' + jupSignZH + '座(年度机遇主星)/ 土星' + satSignZH + '座(年度业力考验)\n\n【报头铁律】:以上星座必须100%使用中文(如双鱼座、摩羯座),严禁使用英文(如Pisces、Capricorn)。\n\n' + factSheet + '\n\n请生成包含报头和年度宏观战略简介的章节,以[V116-V2 INTRO]标签标注。';

    const introText = await streamGeminiChunk(introPrompt, sendChunk, lang);
    allText += introText + '\n\n';
    sendText(introText);
    console.log('[V2] 引言: ' + introText.length + '字');

    // ── Step 5: 逐月滚动(12个月)──
    for (let i = 0; i < months.length; i++) {
      const m = months[i];
      const monthName = m.month_name || ('Month ' + (i + 1));
      const sun = m.sun || {};
      const jupiter = m.jupiter || {};
      const saturn = m.saturn || {};
      const pluto = m.pluto || {};
      const sunSignZH = SIGN_MAP_ZH[sun.sign] || sun.sign || '';
      const jupSignZH_m = SIGN_MAP_ZH[jupiter.sign] || jupiter.sign || '';
      const satSignZH_m = SIGN_MAP_ZH[saturn.sign] || saturn.sign || '';
      const pluSignZH = SIGN_MAP_ZH[pluto.sign] || pluto.sign || '';
      const peakWindows = m.peak_windows || [];
      const crisisDays = m.black_swan_days || [];

      const transition = '\n\n---\n\n## ✦ ' + monthName + '\n\n';
      send(JSON.stringify({ type: 'transition', text: transition }));
      flush();
      allText += transition;

      sendStatus('🔮 ' + monthName + ' 运势撰写中...(' + (i+1) + '/12)');

      // 峰值窗口
      var peakBlock = '';
      if (peakWindows.length > 0) {
        for (var pi = 0; pi < Math.min(2, peakWindows.length); pi++) {
          var pw = peakWindows[pi];
          peakBlock += '★ 峰值窗口:' + (pw.date || '') + '(' + (pw.type || '收入高峰') + ' in ' + (pw.sign || '') + ')\n';
        }
      }
      // 黑天鹅
      var crisisBlock = '';
      if (crisisDays.length > 0) {
        for (var ci = 0; ci < Math.min(1, crisisDays.length); ci++) {
          var cd = crisisDays[ci];
          crisisBlock += '★ 危机警示日:' + (cd.date || '') + ' ' + (cd.aspect || '') + '\n';
        }
        // 🛡️ V485: 逐月「专属风控切入角度」—— 真值雷同(Mars SQUARE Uranus 连月)时,
        //   旧 prompt 只给一行相位, LLM 便把同套措辞连写 6 个月(军师 P1② 线上实证)。
        //   治法: 按月份序号确定性分配互不相同的风控视角, 给 LLM 差异化素材 + 硬约束。
        crisisBlock += '★ 内部参考·本月风控主线(仅供你组织叙述; 严禁在正文写出本行、字段名或「风控切入角度」等措辞, 直接把它当成本月风险的切入视角去写即可):' + _V485_CRISIS_ANGLES[i % _V485_CRISIS_ANGLES.length] + '\n';
      }
      // 🛡️ V487: 逐月「叙述镜头 + 风控表达框架 + 窗口表达框架」—— 与 /stream 的分配表同源、索引口径一致。
      //   概览首句 V486b 禁了「流年太阳进入…」后, LLM 立刻换成一个同样统一的新骨架 ⇒
      //   只有给「具体」的切断角度才能破同构(与 V485 黑天鹅战役同法)。
      var lensBlock = '';
      if (locale === 'zh') {
        lensBlock += '★ 内部参考·本月叙述镜头(仅供你组织"月度财富概览"首句; 严禁在正文写出本行或字段名):' + _V487_NARRATIVE_LENSES[i % _V487_NARRATIVE_LENSES.length] + '\n';
        lensBlock += '★ 内部参考·本月风控表达框架(仅供你组织本月风险叙述; 严禁在正文写出本行或框架代号):' + _V487_RISK_FRAMEWORKS[i % _V487_RISK_FRAMEWORKS.length] + '\n';
        lensBlock += '★ 内部参考·本月窗口表达框架(仅供你组织财富高峰窗口的执行指令; 严禁在正文写出本行或框架代号):' + _V487_WINDOW_FRAMES[i % _V487_WINDOW_FRAMES.length] + '\n';
      }

      var mPrompt = v2SysPrompt + '\n\n[V116-V2-M' + (i+1) + ']: 生成' + monthName + '月度章节(800-1200字)。\n\n★ 月份:' + monthName + '\n★ 太阳行运:' + sunSignZH + '座第' + (sun.house || '?') + '宫\n★ 木星行运:' + jupSignZH_m + '座第' + (jupiter.house || '?') + '宫\n★ 土星行运:' + satSignZH_m + '座第' + (saturn.house || '?') + '宫\n★ 冥王行运:' + pluSignZH + '座第' + (pluto.house || '?') + '宫\n' + peakBlock + crisisBlock + lensBlock + factSheet + '\n\n请以[V116-V2-M' + (i+1) + ']标签标注输出本章。';

      const mText = await streamGeminiChunk(mPrompt, sendChunk, lang);
      // 🔒 V116-step8-fix: 月度标题即时锁(applyMonthLockSanitizer的regex不匹配V2格式)
      let mTextLocked = mText;
      if (m.sun && m.sun.sign) {
        const sunSignCorrect = { Aries:'白羊',Taurus:'金牛',Gemini:'双子',Cancer:'巨蟹',Leo:'狮子',Virgo:'处女',Libra:'天秤',Scorpio:'天蝎',Sagittarius:'射手',Capricorn:'摩羯',Aquarius:'水瓶',Pisces:'双鱼' }[m.sun.sign] || m.sun.sign;
        // V116-Bug3-fix
      let mTextLocked = mText;
      if(m.sun&&m.sun.sign){
        const monthEscaped=monthName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const signMap={Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座'};
        const correctSun=signMap[m.sun.sign]||(m.sun.sign+'座');
        const titleRe=new RegExp('(##\\s*[\\u2606*]\\s*'+monthEscaped+'\\s*[::]\\s*太阳)[^\n]{1,30}?(座)','g');
        mTextLocked=mText.replace(titleRe,'$1'+correctSun);
      }
      }
      allText += mTextLocked + '\n\n';
      // Bug4实时锁
      let mTextSanitized=mTextLocked;
      try{mTextSanitized=natal_sun_linter(astro_phase_linter(final_text_sanitizer(mTextLocked,natalRising,lang)),natalSunSign,natalRising);mTextSanitized=cleanGarbageCharacters(mTextSanitized);}catch(e){mTextSanitized=mTextLocked;}
      sendText(mTextSanitized);
      console.log('[V2] M' + (i+1) + ' (' + monthName + '): ' + mText.length + '字');
    }

    // ── Step 6: 结语 ──
    const outroText = '\n\n---\n\n## 🌌 结语\n\n年报至此终结。愿你在星辰的指引下,握紧属于你的财富主权。\n\n*KindredSouls V116 · 命运主权觉醒系统*\n';
    sendText(outroText);
    allText += outroText;

    // ── Step 7: V116八层清洗链(Bug1~Bug4全硬锁) ──
    allText = englishSignToChinese(allText);      // 刀0(报头英文→中文回归)
    allText = cleanGarbageCharacters(allText);    // 刀1(Bug4)
    allText = forceSpaceHouseSanitizer(allText);  // 刀2(Bug1)
    allText = final_text_sanitizer(allText, natalRising);
    allText = astro_phase_linter(allText);
    allText = natal_sun_linter(allText, natalSunSign, natalRising);
    allText = applyMonthLockSanitizer(allText, matrix, null, null, lang);
    allText = v2_monthly_title_lock(allText, matrix.months);
    allText = impossible_aspect_guard(allText);
    allText = standardizeReport(allText);
    if (lang !== "zh") { allText = allText.replace(/（/g, "").replace(/）/g, ""); } // V154: sendChunk+allText双保险
    allText = cleanGarbageCharacters(allText);    // 刀10(Bug4)

    // ── Step 8: DONE ──
    send(JSON.stringify({ sanitized: allText }));
    send('data: [DONE]\n\n');
    res.end();
    clearInterval(heartbeat);

    // ── Step 8: 缓存落库(异步)──
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    // 🛠️ V178-P0: 年报缓存键同样纳入 birthTime/lat/lon/tz, 与月报/先天同标准, 杜绝跨用户串盘
    // 🛡️ V490: 前缀 v116-v2 → v505-v2 —— 历史键可能含「静默退 UTC 的毒 tz」，随版本作废
    // 🛡️ V490b: lat/lon 已由三元组入参第一关校验为数值；tz 亦为 V490 解析后的**规范名**
    const v2CacheKey = `wealth:v529-v2:${birthDate}:${birthTime || '12:00'}:${lat.toFixed(4)}:${lon.toFixed(4)}:${tz || 'Asia/Bangkok'}:${lang}:yearly`;
    // 🛡️ V492/E5: v2 年报写缓存前强校验完整性（全语言 5 章 + Final Oracle）——不完整坚决不入库
    const _ivV2 = assessYearlyReportIntegrity(allText, { lang });
    if (SB_URL && SB_KEY && allText.length > 500 && _ivV2.ok) {
      try {
        await safeFetch(SB_URL + '/rest/v1/ai_insights_cache?cache_key=eq.' + encodeURIComponent(v2CacheKey), {
          method: 'DELETE',
          headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
        });
        await safeFetch(SB_URL + '/rest/v1/ai_insights_cache', {
          method: 'POST',
          headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ cache_key: v2CacheKey, insight: allText, prompt_version: 'v116-v2-rolling', created_at: new Date().toISOString() })
        });
        console.log('[V2] 缓存写入: ' + v2CacheKey + ' (' + allText.length + '字)');
      } catch(e) { console.warn('[V2] 缓存写入失败: ' + e.message); }
    } else if (SB_URL && SB_KEY && allText.length > 500 && !_ivV2.ok) {
      console.warn('[V492/E5] 🚨 v2 年报完整性不足, 不写入缓存: ' + _ivV2.reasons.join('; '));
    }
    console.log('[V2] ✅ 完成: ' + birthDate + '/' + lang + ',总字数: ' + allText.length);

  } catch (err) {
    console.error('[V2] ❌ 错误: ' + err.message);
    clearInterval(heartbeat);
    send(JSON.stringify({ error: err.message }));
    try { res.end(); } catch(e2) {}
  }
});

// ── Gemini流式调用辅助函数 ──
async function streamGeminiChunk(prompt, onChunk, langForClean = "zh") {
  const geminiKey = getGeminiKey();
  console.log("[V267-diag] getGeminiKey()=", getGeminiKey()?.slice(0,8)); if (!geminiKey) throw new Error('GEMINI_API_KEY not configured');

  // ── V263-fix: streamGenerateContent 有输出截断问题，改用非流式 generateContent
  //    实测 streamGenerateContent maxOutputTokens=32768 时仍只吐 437 字主动停止
  //    非流式不受流式引擎的额外截断控制，maxOutputTokens 真正生效
  //    生成完后手动 SSE 推送给前端，与流式等效
  console.log("[V263-DEBUG] streamGeminiChunk: non-streaming mode, prompt_len=" + prompt.length);

  let attempt = 0;
  while (attempt < 2) {
    attempt++;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);

      // 🟢 非流式 generateContent，maxOutputTokens 真正生效
      const response = await safeFetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=' + geminiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: new TextEncoder().encode(JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 32768, temperature: 0.3 }
          })),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (!response.ok) throw new Error('Gemini HTTP ' + response.status);

      const data = await response.json();
      const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log("[V263-DEBUG] Gemini generateContent 成功, len=" + fullText.length);

      // 🛠️ V332-fix: StringDecoder 字节对齐分块（每 ~500 字 ≈ 1500 bytes）
      const safeChunks = _safeChunk(fullText, 1500);
      for (const chunk of safeChunks) {
        onChunk(chunk);
        await new Promise(r => setTimeout(r, 20)); // 20ms 打字机节奏
      }

      const cleaned = langForClean !== "zh" ? fullText.replace(/（/g, "").replace(/）/g, "") : fullText;
      return cleaned;
    } catch(err) {
      console.warn('[V263-DEBUG] Gemini attempt ' + attempt + ' failed: ' + err.message);
      if (err.message.includes('429') || err.message.includes('rate limit')) {
        console.warn('[V263] Gemini配额耗尽,切换DeepSeek兜底...');
        break;
      }
      if (attempt >= 2) throw new Error('Gemini连续失败: ' + err.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // ── DeepSeek 兜底 ──
  const deepseekKey = getDeepSeekKey();
  if (!deepseekKey) throw new Error('Gemini配额耗尽,DeepSeek也不可用');
  console.warn('[V263] 使用DeepSeek兜底...');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);
  const res = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + deepseekKey },
    body: new TextEncoder().encode(JSON.stringify({
      model: 'deepseek-flash',
      thinking: { type: 'disabled' },
      messages: [{ role: 'user', content: prompt }],
      max_tokens: langForClean === 'th' || langForClean === 'vi' ? 16384 : langForClean === 'zh' ? 12000 : 10000,
      temperature: 0.7,
      stream: true,
    })),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error('DeepSeek HTTP ' + res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(dataStr);
        const txt = parsed.choices?.[0]?.delta?.content || '';
        if (txt) { fullText += txt; onChunk(txt); }
      } catch(e) {}
    }
  }
  if (buffer.trim()) {
    const t = buffer.trim();
    if (t.startsWith('data: ')) {
      try {
        const p = JSON.parse(t.slice(6));
        const tx = p?.choices?.[0]?.delta?.content || '';
        if (tx) { fullText += tx; onChunk(tx); }
      } catch(e3) {}
    }
  }
  console.log('[V263] DeepSeek成功: ' + fullText.length + '字');
  return fullText;
}

// ── V266: Gemini 分段串联流式生成器（小语种月报专用）──
// Gemini 单次 maxOutputTokens 上限 8192（约 6000 英文字）
// 月报 12000+ 字符分 3 段串联生成，每段结果实时 res.write 给前端
// 全部 3 段完成后返回完整文本供下游缓存/后处理
async function streamGeminiSequential(res, onChunk, lang, promptSystem, promptUser, astroMatrix) {
  const geminiKey = getGeminiKey();
  if (!geminiKey) throw new Error('GEMINI_API_KEY not configured');

  // ── 3 段任务定义 ──
  const _langName = { zh: '中文', en: '英语', es: '西班牙语', fr: '法语', th: '泰语', vi: '越南语' }[lang] || '中文';
  const _MONTHLY_THEME = { zh:'月度命运主题', en:'Monthly Destiny Theme', es:'Tema del Destino Mensual', fr:'Thème de Destin du Mois', th:'ธีมโชคชะตารายเดือน', vi:'Chủ đề Vận mệnh Tháng' };
  const _W1_TITLE  = { zh:'第1周', en:'Week 1', es:'Semana 1', fr:'Semaine 1', th:'สัปดาห์ที่ 1', vi:'Tuần 1' };
  const _W1_SUB    = { zh:V462_WEEK_SUB.zh[0], en:V462_WEEK_SUB.en[0], es:V462_WEEK_SUB.es[0], fr:V462_WEEK_SUB.fr[0], th:V462_WEEK_SUB.th[0], vi:V462_WEEK_SUB.vi[0] };
  const _W2_TITLE  = { zh:'第2周', en:'Week 2', es:'Semana 2', fr:'Semaine 2', th:'สัปดาห์ที่ 2', vi:'Tuần 2' };
  const _W2_SUB    = { zh:V462_WEEK_SUB.zh[1], en:V462_WEEK_SUB.en[1], es:V462_WEEK_SUB.es[1], fr:V462_WEEK_SUB.fr[1], th:V462_WEEK_SUB.th[1], vi:V462_WEEK_SUB.vi[1] };
  const _W3_TITLE  = { zh:'第3周', en:'Week 3', es:'Semana 3', fr:'Semaine 3', th:'สัปดาห์ที่ 3', vi:'Tuần 3' };
  const _W3_SUB    = { zh:V462_WEEK_SUB.zh[2], en:V462_WEEK_SUB.en[2], es:V462_WEEK_SUB.es[2], fr:V462_WEEK_SUB.fr[2], th:V462_WEEK_SUB.th[2], vi:V462_WEEK_SUB.vi[2] };
  const _W4_TITLE  = { zh:'第4周', en:'Week 4', es:'Semana 4', fr:'Semaine 4', th:'สัปดาห์ที่ 4', vi:'Tuần 4' };
  const _W4_SUB    = { zh:V462_WEEK_SUB.zh[3], en:V462_WEEK_SUB.en[3], es:V462_WEEK_SUB.es[3], fr:V462_WEEK_SUB.fr[3], th:V462_WEEK_SUB.th[3], vi:V462_WEEK_SUB.vi[3] };
  const _TRAP_TITLE = { zh:'避坑指南', en:'Financial Traps & Risk Mitigation', es:'Trampas Financieras', fr:'Pièges Financiers', th:'กับดักทางการเงิน', vi:'Cạm bẫy Tài chính' };
  const _THEME_HDR = _MONTHLY_THEME[lang] || _MONTHLY_THEME.zh;
  // 🛠️ V386-fix: 流式首段强制注入标准化月报主题标题(DeepSeek偶发漏🔮导致金色标题消失)
  // 根因: DeepSeek V4-Flash 听 Prompt 但偶发输出 "Chủ Đề Vận Mệnh Tháng" 不带 ✦[🔮] 格式
  // 治本: 流式首 chunk 到达时,若 _acc 尚未含标准标题头,自动注入一行标准格式,前端解析识别→金色居中
  let _themeInjected = false;
  const _langThemeTitle = { zh:'✦ [🔮 本月命运主题] ✦', en:'✦ [🔮 Monthly Destiny Theme] ✦', es:'✦ [🔮 Tema de Destino Mensual] ✦', fr:'✦ [🔮 Thème de Destin du Mois] ✦', th:'✦ [🔮 ธีมโชคชะตาประจำเดือน] ✦', vi:'✦ [🔮 Chủ Đề Vận Mệnh Tháng] ✦' }[lang] || '✦ [🔮 本月命运主题] ✦';
  // 周标题语言映射(第1段需注入第1周标题,让前端 parseLine 能识别周次金色)
  const _langW1Title = { zh:`✦ [🟢 第1周：${V462_WEEK_SUB.zh[0]}] ✦`, en:`✦ [🟢 Week 1: ${V462_WEEK_SUB.en[0]}] ✦`, es:`✦ [🟢 Semana 1: ${V462_WEEK_SUB.es[0]}] ✦`, fr:`✦ [🟢 Semaine 1: ${V462_WEEK_SUB.fr[0]}] ✦`, th:`✦ [🟢 สัปดาห์ที่ 1: ${V462_WEEK_SUB.th[0]}] ✦`, vi:`✦ [🟢 Tuần 1: ${V462_WEEK_SUB.vi[0]}] ✦` }[lang] || `✦ [🟢 第1周：${V462_WEEK_SUB.zh[0]}] ✦`;
  const _T1 = _W1_TITLE[lang]||_W1_TITLE.zh; const _S1 = _W1_SUB[lang]||_W1_SUB.zh;
  const _T2 = _W2_TITLE[lang]||_W2_TITLE.zh; const _S2 = _W2_SUB[lang]||_W2_SUB.zh;
  const _T3 = _W3_TITLE[lang]||_W3_TITLE.zh; const _S3 = _W3_SUB[lang]||_W3_SUB.zh;
  const _T4 = _W4_TITLE[lang]||_W4_TITLE.zh; const _S4 = _W4_SUB[lang]||_W4_SUB.zh;
  const _TRP = _TRAP_TITLE[lang]||_TRAP_TITLE.zh;

  // 🛡️ V284: 星盘锁死——上升 + 12宫整宫制映射表(IMMUTABLE TRUTH), 切断 Gemini 自行推算上升的幻觉
  const _RISING_IDX = { Aries:0, Taurus:1, Gemini:2, Cancer:3, Leo:4, Virgo:5, Libra:6, Scorpio:7, Sagittarius:8, Capricorn:9, Aquarius:10, Pisces:11 };
  const _rising = (astroMatrix && astroMatrix.meta && astroMatrix.meta.rising_sign) || 'Gemini';
  const _risingIdx = _RISING_IDX[_rising] ?? 2;
  const _SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const _houseSigns = _SIGNS.slice(_risingIdx).concat(_SIGNS.slice(0, _risingIdx));
  const _houseNames = ['命宫(自我)','财帛(资源)','兄弟(沟通/契约)','田宅(家庭)','子女(创意/恋爱)','奴仆(健康/工作)','夫妻(合作/婚姻)','疾厄(偏财/蜕变)','迁移(远方/学问)','官禄(事业)','福德(社交/希望)','相貌(隐秘/潜意识)'];
  const _astroLock = '[CRITICAL ASTROLOGICAL DATA — IMMUTABLE TRUTH]\n' +
    'Ascendant/Rising Sign: ' + _rising + ' (Whole Sign 整宫制)\n\n' +
    '[HOUSE MAPPING TABLE — STRICT CONSTRAINT]\n' +
    _houseSigns.map((s, i) => '- House ' + (i+1) + ' (' + _houseNames[i] + '): ' + s).join('\n') + '\n\n' +
    '[STRICT GENERATION RULES]\n' +
    '1. DO NOT calculate or infer the Rising Sign. Use ONLY ' + _rising + ' above (天文真值, 不可更改).\n' +
    '2. When mentioning ANY planet (Sun/Moon/Mercury/Venus/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto), its House placement MUST match the HOUSE MAPPING TABLE above STRICTLY.\n' +
    '   e.g. If Mars is in Cancer, check which House Cancer is in the table above -> write THAT House number. Do NOT assume Cancer=House1.\n' +
    '3. NEVER use Whole Sign system incorrectly. The table above IS the correct Whole Sign mapping.\n' +
    '4. ABSOLUTELY FORBIDDEN: 自行推算上升星座、编造宫位、或写与表格不符的宫位。';
  const _segPrompt = [
    { title: '月度主题+第1周', content: `【V461 写作规范 — HARD 示例 — 必须严格遵循】

❌ 以下是错误示范（概念示意，绝对禁止照此生成）：
① 贴一个天文标签当开头；② 把星座与宫位罗列成清单，再补一句「N日X座、N日Y座换座」；③ 用说明书式句子（「本周流年行星在◯座第◯宫持续为你……」）平铺直叙。

✅ 以下是正确的开篇方式（模仿此风格）：
当月光的足迹从白羊座的远山之巅起步，踏过金牛座的深谷，一路折向双子与巨蟹的陡峭高地——

本周流年太阳在处女座第2宫按下了精算的锤音……

📐 格式规范：
- 周正文必须直接以诗意意象开篇，绝不贴天文标签式前缀（如「◯◯过境：」「依次行经」）
- 日期事件须编织进叙事流，绝不写成「1日X座、3日Y座换座」列表
- 不得出现「财富充能」等老套分类词（已由副标题承载，正文不再重复）
- 2-3句即成一自然段，长短交错，绝不堆砌无起伏的说明

严格遵循 FORMAT_FIREWALL 格式，生成：
1. ✦ [🔮 ${_THEME_HDR}]（标题无月份）
2. ✦ [🟢 ${_T1}（${_S1}）]（emoji+副标题）
生成 EXACTLY 上述列出的章节。
写完立即停止，不要输出多余内容。` },
    { title: '第2周+第3周', content: `【V461 写作规范 — HARD 示例 — 必须严格遵循】

❌ 以下是错误示范（概念示意，绝对禁止照此生成）：
① 贴天文标签开篇；② 罗列「N日X座换座」；③ 用「本周是……的高危险区」这类分类口号当句子。

✅ 以下是正确的开篇方式（模仿此风格）：
本周，宇宙在财务的高压线上拉响警报——

或：风暴过后，海面开始缓缓沉淀……

📐 格式规范：
- 第2周（W2）开篇必须短促有力（≤2句），制造压迫感；正文用断句或省略号增强张力
- 第3周（W3）开篇须有静水深流的静谧感；正文长短句交错，叙事而非列举
- 不得出现「高危熔断」「顺流蓄力」等老套词（已由副标题承载）
- 不得写「9日……12日……14日……」等列表式日期排版
- 风控数字必须与星象心理叙事缝合（不是干巴巴的「冷静24小时」）

严格遵循 FORMAT_FIREWALL 格式，生成：
1. ✦ [🔴 ${_T2}（${_S2}）]
2. ✦ [🔵 ${_T3}（${_S3}）]
生成 EXACTLY 上述列出的章节。
写完立即停止，不要输出多余内容。` },
    { title: '第4周+避坑指南', content: `【V461 写作规范 — HARD 示例 — 必须严格遵循】

❌ 以下是错误示范（概念示意，绝对禁止照此生成）：
① 贴天文标签开篇；② 罗列「N日X座换座」；③ 用「本周迎来……的◯◯窗口」这类口号句收尾。

✅ 以下是正确的开篇方式（模仿此风格）：
木星的光芒在此刻聚焦——收获的时节悄然降临……

📐 格式规范：
- 第4周（W4）开篇须有收获感与荣耀感；正文叙事流畅，不列举日期
- 陷阱段（⚠️）必须把「5000元」「24小时冷静期」编织进星象心理叙事
  错误：消费陷阱：超过5000元必须冷静24小时。
  正确：若有一笔支出以紧迫之名召唤你，请记住——那份紧迫本身，就是最诚实的警报。
- 陷阱段终章须有余韵，触发内心被触碰的感觉，而非干巴巴的风险警告
- 不得出现「财富爆发」等老套词（已由副标题承载）

严格遵循 FORMAT_FIREWALL 格式，生成：
1. ✦ [🟢 ${_T4}（${_S4}）]
2. ✦ [⚠️ ${_TRP}]
生成 EXACTLY 上述列出的章节。
写完立即停止，不要输出多余内容。` }
  ];

  // 🛠️ V330-fix: 泰/越语 BPE token 膨胀，Thai raw 2459字≈2500+ tokens → 第2段(Week2+Week3)截断
  // Thai BPE tokenizer 对辅音+元音+声调组合膨胀系数约2.5x，8192不够；提至16384保第2段完整吐完Week3
  // V365-fix: 提升至16384治截断
  const _segMaxTokens = (['th', 'vi'].includes(lang)) ? 16384 : 16384;
  const MODEL = 'gemini-3.5-flash';
  let fullText = '';

  for (let seg = 0; seg < _segPrompt.length; seg++) {
    const segPrompt = _astroLock + '\n\n' + promptSystem + '\n\n[背景信息]\n' + promptUser + '\n\n[分段生成指令] ' + _segPrompt[seg].content;
    let segText = '';
    let attempt = 0;

    while (attempt < 2) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180000);

        console.log('[V266] Gemini 段' + (seg+1) + '/3: ' + _segPrompt[seg].title);
        const response = await safeFetch(
          'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + geminiKey,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: new TextEncoder().encode(JSON.stringify({
              contents: [{ parts: [{ text: segPrompt }] }],
              generationConfig: { maxOutputTokens: _segMaxTokens, temperature: 0.3 }
            })),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);
        if (!response.ok) throw new Error('Gemini HTTP ' + response.status);

        const data = await response.json();
        segText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // 🛡️ V277-fix: 清理嵌套括号如 [[🔴 → [🔴
        segText = segText.replace(/\[{2,}/g, '[').replace(/\]{2,}/g, ']');
        console.log('[V272-seg] 段' + (seg+1) + ' len=' + segText.length + ' preview=' + JSON.stringify(segText.slice(0,80)));
        console.log("[V266] segText preview:", JSON.stringify(segText.slice(0,100)));
        break; // 成功，跳出重试循环
      } catch(err) {
        console.warn('[V266] Gemini 段' + (seg+1) + ' attempt ' + attempt + ' 失败: ' + err.message);
        console.error("[V266] Gemini 段" + (seg+1) + " 3次重试全失败，最终 throw");
        if (attempt >= 2) throw new Error('Gemini 段' + (seg+1) + ' 连续失败: ' + err.message);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 🛠️ V332-fix: StringDecoder 字节对齐分块（每 ~300 字 ≈ 900 bytes）
    const safeChunks = _safeChunk(segText, 900);
    for (const chunk of safeChunks) {
      const sseMsg = JSON.stringify({ text: chunk });
      // V367-fix: 删 direct res.write()——全走 onChunk(_resDedupe) 去重出口（原双写导致周次重复）
      // 🛠️ V386-fix: 流式首 chunk 到达时,若尚未注入标准月报主题头,强制注入(DeepSeek偶发漏🔮导致金色标题消失)
      // _themeInjected 在 streamGeminiSequential 函数顶部声明,seg=0 时检测,已注入则跳过
      if (!_themeInjected && chunk.trim().length > 0 && chunk.trim().length < 500) {
        // 首段(seg=0)第一批次 chunk 到达: 注入标准主题头 + 第1周标题
        // 只有 chunk 长度<500 才注入(防已到中段内容时再误注)
        if (seg === 0 && !fullText.includes('[' + String.fromCharCode(0x1F4A1)) && !fullText.includes('Tuần') && !fullText.includes('Week') && !fullText.includes('第1周')) {
          onChunk(_langThemeTitle + '\n' + _langW1Title + '\n');
          _themeInjected = true;
        }
      }
      onChunk(chunk);
      fullText += chunk;
      await new Promise(r => setTimeout(r, 30)); // 30ms 打字机节奏
    }
  }

  // 全 3 段完成后返回完整文本（供下游缓存/后处理）
  return fullText;
}

//
// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V116 Impossible Aspect Guard
// 修复 Bug3(军师):"火星在双子座与天王星在双子座形成四分相"
// 天文学:同星座两天体只能形成合相,四分相/对分相/六分相必须跨星座
// 本函数检测"行星A在X座与行星B在X座[非合相相位]"并移除非法相位描述
// ═══════════════════════════════════════════════════════════════════════
function impossible_aspect_guard(text) {
  if (!text || !text.includes('座与') && !text.includes('座和')) return text;
  // 匹配:行星在X座[与/和]行星在X座[相位名]
  // 只处理:X座 ≠ X座(同星座),且相位 ≠ 合相/同宫
  const RE_SAME_SIGN_ASPECT = /([\u4e00-\u9fa5星曜]+星?)(在[\u4e00-\u9fa5]{1,3}座)(?:与|和)([\u4e00-\u9fa5星曜]+星?)(在)([\u4e00-\u9fa5]{1,3}座)((?:精准)?(?:四分相|对分相|六分相|三分相|刑克|拱照|三分|六分))(:?)/g;
  return text.replace(RE_SAME_SIGN_ASPECT, function(match, p1, sign1, p2, _kw, sign2, aspect, colon) {
    if (sign1 !== sign2) return match; // 不同星座,不处理
    // 同星座但写的是非合相相位 → 移除非法相位描述
    const conj = (aspect.includes('合相') || aspect.includes('同宫')) ? aspect : '(合相)';
    return p1 + sign1 + '与' + p2 + sign2 + conj + colon;
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 🔒 V2 Monthly Title Lock(V116-step8补丁)
// Bug2 根因:applyMonthLockSanitizer 匹配 "## 2027年6月:太阳XX座"
// 但 V2 月度标题是 "## ✦ 2027年6月:太阳XX座",regex 不命中
// 本函数直接对 allText 做 12 个月针对性替换
// ═══════════════════════════════════════════════════════════════════════
function v2_monthly_title_lock(text, months) {
  if (!text || !months || !Array.isArray(months)) return text;
  const SIGN_ZH = { Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座' };
  const SIGNS = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const signRe = new RegExp('(' + SIGNS.join('|') + ')', 'g');
  let t = text;
  for (const m of months) {
    const monthName = m.month_name;
    if (!monthName || !m.sun) continue;
    const correctSign = SIGN_ZH[m.sun.sign] || (m.sun.sign + '座');
    const correctHouse = m.sun.house ? ('第' + m.sun.house + '宫') : '';
    const idx = t.indexOf(monthName);
    if (idx === -1) continue;
    const lineEnd = t.indexOf('\n', idx);
    const segEnd = lineEnd === -1 ? Math.min(idx + 80, t.length) : lineEnd;
    const seg = t.slice(idx, segEnd);
    let newSeg = seg.replace(signRe, correctSign);
    if (correctHouse) {
      newSeg = newSeg.replace(/第[一二三四五六七八九十百0-9]{1,3}宫/g, correctHouse);
    }
    t = t.slice(0, idx) + newSeg + t.slice(segEnd);
  }
  return t;
}

// ── /api/debug-dump-cache ── 只读诊断:返回某 cache_key 的所有记录(时间+版本,不含正文避免超长)
app.get('/api/debug-dump-cache', async (req, res) => {
  const cacheKey = req.query.cacheKey || req.query.key;
  if (!cacheKey) return res.status(400).json({ error: 'cacheKey required' });
  try {
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    const r = await safeFetch(
      `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=created_at,prompt_version&order=created_at.desc`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    const rawRows = await r.json();
    const rows = Array.isArray(rawRows) ? rawRows : [];
    const cRes = await safeFetch(
      `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=count`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    const cRaw = await cRes.json();
    const count = (Array.isArray(cRaw) && cRaw[0] && cRaw[0].count) ? cRaw[0].count : rows.length;
    res.json({ cacheKey, status: r.status, ok: r.ok, isArray: Array.isArray(rawRows), count, rows: rows.slice(0, 20) });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ── Start ──
app.listen(PORT, HOST, () => {
  console.log(`[KindredSouls]  Railway server running on port ${PORT}`);
  console.log(`  - API: http://0.0.0.0:${PORT}/api/*`);
  console.log(`  - Web: http://0.0.0.0:${PORT}/`);
  // V431: 启动即打「真值锁清单」——以后判定「新代码是否在线」不再靠猜部署哈希（webhook 部署 commitHash 常为 `-`），
  //       直接 grep 本行即可。任何一次解锁/回退都会在这行上体现。
  console.log('[BUILD] V431 真值锁清单: vi(natal+transit) | th(natal+transit) | fr(natal+transit+定语家族裁定) | 外文星座名归真(Aries→Bélier) | HOUSE-NUMBER-FORMAT V375(en/th/vi/fr)');
  console.log('[BUILD] V432 真值锁清单: en/es/zh(natal+transit) | 六语种对称 | 月亮整星排除流月锁 + 日期守卫');
  console.log('[BUILD] V433 真值锁清单: 六语种月亮周级硬锁 (MOON PER-WEEK TRUTH + 照抄句) | 星座名本地化(修 SIGN_NAMES 缩写死代码)');
  console.log('[BUILD] V434 真值锁清单: 全范围月亮锁(持续性声明→真实轨迹) | 行星修饰词锁(日月无逆行·剥离误贴逆行·CJK 不用 \\b)');
});
// FORCE REBUILD 1783756900

// ── Groq API Test Endpoint ──────────────────────────────────────────────────
// GET /api/test-groq?key=YOUR_KEY
// 测试 Railway → Groq 是否可达 + key 是否有效
app.get('/api/test-groq', async (req, res) => {
  const groqKey = req.query.key || process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.json({ error: 'No Groq key provided. Add ?key=YOUR_KEY' });
  }
  try {
    const start = Date.now();
    const apiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say "GROQ_OK" in exactly that format.' }],
        max_tokens: 10,
        temperature: 0,
      }),
    });
    const latency = Date.now() - start;
    const data = await apiRes.json();
    if (!apiRes.ok) {
      return res.json({ ok: false, status: apiRes.status, error: data.error?.message || data, latency_ms: latency });
    }
    return res.json({ ok: true, latency_ms: latency, model: data.model, response: data.choices[0].message.content });
  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});

// ── Groq 内容质量对比测试端点 ─────────────────────────────────────────────
// GET /api/compare-llm
// 用同一份 prompt 分别测 Groq 和 DeepSeek,输出内容和耗时用于对比
app.get('/api/compare-llm', async (req, res) => {
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.GROQ_KEY || req.query.groq_key;
  const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

  // 诊断:环境变量状态
  const envDiag = {
    GROQ_API_KEY_exists: !!process.env.GROQ_API_KEY,
    GROQ_API_KEY_length: process.env.GROQ_API_KEY?.length || 0,
    GROQ_KEY_exists: !!process.env.GROQ_KEY,
    DEEPSEEK_API_KEY_exists: !!process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_API_KEY_length: process.env.DEEPSEEK_API_KEY?.length || 0,
  };
  const testPrompt = req.query.prompt ||
    '请为以下星盘写一段200字的中文财富月报:\n太阳星座:射手座 | 上升星座:天蝎座 | 月亮星座:双子座\n要求:专业有深度,像真正的占星师在说话,直接输出不要废话。';

  const results = {};

  // 测 Groq
  if (GROQ_KEY) {
    const start = Date.now();
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: testPrompt }], max_tokens: 512, temperature: 0.7 }),
      });
      const d = await r.json();
      results.groq = { ok: r.ok, latency_ms: Date.now() - start, status: r.status, text: d.choices?.[0]?.message?.content || d.error?.message, chars: (d.choices?.[0]?.message?.content || '').length };
    } catch(e) { results.groq = { ok: false, latency_ms: Date.now() - start, error: e.message }; }
  } else { results.groq = { ok: false, error: 'GROQ_KEY not set' }; }

  // 测 DeepSeek
  if (DEEPSEEK_KEY) {
    const start = Date.now();
    try {
      // 强制 ASCII 编码,防止 Unicode 字符导致 header 错误
      const cleanKey = Buffer.from(DEEPSEEK_KEY).toString('ascii');
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cleanKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-flash', thinking: { type: 'disabled' }, messages: [{ role: 'user', content: testPrompt }], max_tokens: 512, temperature: 0.7 }),
      });
      const d = await r.json();
      results.deepseek = { ok: r.ok, latency_ms: Date.now() - start, status: r.status, text: d.choices?.[0]?.message?.content || d.error?.message, chars: (d.choices?.[0]?.message?.content || '').length };
    } catch(e) { results.deepseek = { ok: false, latency_ms: Date.now() - start, error: e.message }; }
  } else { results.deepseek = { ok: false, error: 'DEEPSEEK_API_KEY not set' }; }

  res.json({ results, env_diag: envDiag, prompt_length: testPrompt.length });
});
// V223-verify-1785660410
// V223c-1785660969


