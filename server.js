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
    vi: { currency: 'VND', symbol: '₫',  baseRisk: 12000000, maxWeekly: 36000000 },
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
  ✦ [🟢 Tuần 1: Tháng 8, Ngày 1–7]    ← 第1周（🟢=低风险）
  ✦ [🔴 Tuần 2: Tháng 8, Ngày 8–14]    ← 第2周（🔴=高风险）
  ✦ [🔵 Tuần 3: Tháng 8, Ngày 15–21]   ← 第3周（🔵=中风险）
  ✦ [🟢 Tuần 4: Tháng 8, Ngày 22–31]   ← 第4周（🟢=低风险）
  ✦ [⚠️ Cạm bẫy Tài chính: Tháng 8, 2026] ✦ ← 财务陷阱结尾
- V270-fix: 标题行之后才能写正文，绝对不能在标题之前出现任何内容。
`,


  en: `
[LANG_RULE: English]
- 文风: Empathetic, psychologically insightful, precise.
- 标题格式（严格遵守）:
  ✦ [🔮 Monthly Destiny Theme]
  ✦ [🟢 Week 1: August 1–7]
  ✦ [🔴 Week 2: August 8–14]
  ✦ [🔵 Week 3: August 15–21]
  ✦ [🟢 Week 4: August 22–31]
  ✦ [⚠️ Financial Traps & Risk Mitigation]
- 风险图标: 🟢 Low | 🔴 High | 🔵 Moderate | ⚠️ Warning。
`,

  zh: `
[LANG_RULE: Chinese]
- 文风: 深邃典雅，融汇西方占星与东方灵性。
- 标题格式（严格遵守）:
  ✦ [🔮 月度命运主题]
  ✦ [🟢 第1周: 8月1日–7日]
  ✦ [🔴 第2周: 8月8日–14日]
  ✦ [🔵 第3周: 8月15日–21日]
  ✦ [🟢 第4周: 8月22日–31日]
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
   [🟢 第1周：8月1日–7日（财富充能） | 第${sunHouse}宫 | 风控: 🟢低危]
   规则：
   - "✦" 必须单独占一行，后面紧跟一个换行
   - 标题内容必须用方括号 [...] 包裹
   - 方括号内不得换行、不得嵌套
   - 错误格式（禁止）：✦ [🟢 第1周... ]（✦ 和 [ 同在一行）
   - 错误格式（禁止）：✦ 🟢 第1周...（缺失方括号）`,
      en: `1. 【STRICT FORMAT】Every weekly header MUST follow this EXACT pattern:
   ✦
   [🟢 Week 1: Aug 1–7 (Wealth Recharging) | House ${sunHouse} | Risk: 🟢 Low]
   Rules:
   - "✦" MUST be on its own line, followed by exactly one newline
   - Title content MUST be wrapped in square brackets [...]
   - No line breaks inside the brackets
   - FORBIDDEN: ✦ [🟢 Week 1... ] (✦ and [ on same line)
   - FORBIDDEN: ✦ 🟢 Week 1... (missing brackets)`,
      es: `1. 【FORMATO ESTRICTO】Cada encabezado semanal DEBE seguir este patrón exacto:
   ✦
   [🟢 Semana 1: Ago 1–7 (Recarga de Riqueza) | Casa ${sunHouse} | Riesgo: 🟢 Bajo]
   Reglas:
   - "✦" DEBE estar en su propia línea, seguido de un salto de línea
   - El título DEBE estar envuelto en corchetes [...]
   - Sin saltos de línea dentro de los corchetes
   - PROHIBIDO: ✦ [🟢 Semana 1... ] (✦ y [ en la misma línea)
   - PROHIBIDO: ✦ 🟢 Semana 1... (sin corchetes)`,
      fr: `1. 【FORMAT OBLIGATOIRE】Chaque en-tête hebdomadaire DOIT suivre ce modèle exact:
   ✦
   [🟢 Semaine 1: Août 1–7 (Recharge de Richesse) | Maison ${sunHouse} | Risque: 🟢 Faible]
   Règles:
   - "✦" DOIT être sur sa propre ligne, suivi d'un saut de ligne
   - Le titre DOIT être entouré de crochets [...]
   - Pas de saut de ligne à l'intérieur des crochets
   - INTERDIT: ✦ [🟢 Semaine 1... ] (✦ et [ sur la même ligne)
   - INTERDIT: ✦ 🟢 Semaine 1... (crochets manquants)`,
      th: `1. 【รูปแบบบังคับ】ส่วนหัวรายสัปดาห์ทุกสัปดาห์ต้องเป็นไปตามรูปแบบนี้:
   ✦
   [🟢 สัปดาห์ที่ 1: ส.ค. 1–7 (การเติมพลังความมั่งคั่ง) | บ้านที่ ${sunHouse} | ความเสี่ยง: 🟢 ต่ำ]
   กฎ:
   - "✦" ต้องอยู่บรรทัดของตัวเอง ตามด้วยการขึ้นบรรทัดใหม่
   - หัวข้อต้องอยู่ในวงเล็บ [...]
   - ห้ามขึ้นบรรทัดใหม่ภายในวงเล็บ
   - ห้าม: ✦ [🟢 สัปดาห์ที่ 1... ] (✦ และ [ บรรทัดเดียวกัน)
   - ห้าม: ✦ 🟢 สัปดาห์ที่ 1... (ไม่มีวงเล็บ)`,
      vi: `1. 【ĐỊNH DẠNG BẮT BUỘC】Mỗi tiêu đề hàng tuần phải tuân theo mẫu này:
   ✦
   [🟢 Tuần 1: Thg8 1–7 (Nạp năng lượng Tài sản) | Nhà ${sunHouse} | Rủi ro: 🟢 Thấp]
   Quy tắc:
   - "✦" PHẢI trên dòng riêng, theo sau bởi một dòng mới
   - Tiêu đề PHẢI được bọc trong dấu ngoặc [...]
   - Không xuống dòng bên trong dấu ngoặc
   - CẤM: ✦ [🟢 Tuần 1... ] (✦ và [ cùng dòng)
   - CẤM: ✦ 🟢 Tuần 1... (thiếu dấu ngoặc)`,
    },
    rule2: {
      zh: `2. 消费陷阱模块(✦ [⚠️ 消费陷阱...])必须对超过 ${curr.symbol}${curr.baseRisk.toLocaleString()} 的单笔消费强制执行 24 小时冷静期规则,周度非必需上限 ${curr.symbol}${curr.maxWeekly.toLocaleString()},并附灵魂三问决策树。`,
      en: `2. The spending trap section (✦ [⚠️ Spending Traps...]) must enforce a 24-hour cooling-off for any single purchase over ${curr.symbol}${curr.baseRisk.toLocaleString()}, weekly non-essential cap ${curr.symbol}${curr.maxWeekly.toLocaleString()}, plus the 3-question decision tree.`,
      es: `2. La sección de trampas de gasto (✦ [⚠️ Trampas de Gasto...]) debe imponer un enfriamiento de 24 horas para compras superiores a ${curr.symbol}${curr.baseRisk.toLocaleString()}, tope semanal no esencial ${curr.symbol}${curr.maxWeekly.toLocaleString()}, más el árbol de decisión de 3 preguntas.`,
      fr: `2. La section pièges financiers (✦ [⚠️ Pièges Financiers...]) doit imposer un délai de réflexion de 24h pour tout achat dépassant ${curr.symbol}${curr.baseRisk.toLocaleString()}, plafond hebdomadaire non essentiel ${curr.symbol}${curr.maxWeekly.toLocaleString()}, plus l'arbre de décision à 3 questions.`,
      th: `2. ส่วนกับดักการใช้จ่าย (✦ [⚠️ กับดักการใช้จ่าย...]) ต้องบังคับระยะเย็นลง 24 ชม. สำหรับการซื้อเกิน ${curr.symbol}${curr.baseRisk.toLocaleString()} เพดานรายสัปดาห์ไม่จำเป็น ${curr.symbol}${curr.maxWeekly.toLocaleString()} บวกต้นไม้ตัดสินใจ 3 คำถาม`,
      vi: `2. Phần bẫy chi tiêu (✦ [⚠️ Bẫy Chi Tiêu...]) phải áp dụng thời gian chờ 24 giờ cho mỗi giao dịch trên ${curr.symbol}${curr.baseRisk.toLocaleString()}, trần hàng tuần không thiết yếu ${curr.symbol}${curr.maxWeekly.toLocaleString()}, cộng cây quyết định 3 câu hỏi.`,
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

const FORMAT_FIREWALL = `\n\n### 🛑 格式绝对铁律（System Boundary — Zero Tolerance）：\n\n#### A. 禁止 CoT 泄漏\n严禁将任何思考过程、自我纠错、规则讨论、数据验证输出到正文中。内部推理必须在模型内部完成，不得出现在最终文本里。\n禁止输出： (note:...) (注意：...) (Je me corrige...) (correction) (根据数据...) (数据说...) 等任何括号包裹的推理内容。\n\n#### B. 方括号完整性（P0）\n每张卡片的 [ 和 ] 必须成对匹配，且方括号内部不得换行、不得断句、不得嵌套。\n错误示例（全部禁止）：\n  • [สัปดาห์ที่ 2: ก] .ค. 8–14]  （在 [ 内部断开）\n  • [สัปดาห์ที่ 4: ก.ค. 23–31  （缺失结尾 ]）\n  • [เงาการเงิน] กับดัก... （在 [ 内部有空格和 ]）\n正确格式：\n  • [🟢 สัปดาห์ที่ 2: ก.ค. 8–14 (วงจรความเสี่ยงสูง)]  （一气呵成，无内部断句）\n  • [⚠️ เงาการเงิน：กับดักการใช้จ่าย ก.ค. 2026]  （整行是单个方括号块）\n\n#### C. 语言封锁（最高优先级 — V210-fix 多语言重复循环）
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
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAstroMatrix, buildFactSheet, buildPerMonthData, buildPerMonthDataBlock, buildAspectsData, v69HealthCheck } from './v69_client.js';
import { LEXICON } from './lexicon.js';
import { buildAstroTruth, SIGN_ARCHETYPE, getSignToHouseMap, SIGN_ORDER_ZH } from './astro-truth.js';
import { validateAstroLogic } from './astro-validator.js';
import https from 'https';
import { Buffer } from 'buffer';
import { getSystemPromptByLocale } from './src/prompts/loader.js';
import { exec } from 'child_process';
import { StringDecoder } from 'string_decoder';  // P0-fix: UTF-8 增量解码器，根治泰语/越南语掉辅音

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
    // 🛡️ V222z-fix10: 双份报告检测——模型退化时完整月报吐两遍(两份都合法4周,周次检测无效)
    // 修复 V222z-fix11: trap 内容本身含多个 ⚠️ 符号(如"⚠️ 避免借贷""⚠️ 冲动消费"),字符级检测会在 trap 内容未写完时误触发
    // 正确做法: 用 trap 章节头 `[⚠️`(月报)/`[💸`(年报) 而非单个字符,章节头每份报告只出现1次
    const _themeCount = (_acc.match(/本月命运主题/g) || []).length;
    const _trapCount  = (_acc.match(/\[⚠️|\[💸/g) || []).length;
    if (_themeCount >= 2 || _trapCount >= 2) {
      console.log('[callDeepSeek] ⚠️ V222z-fix10 检测到双份报告(命运主题×' + _themeCount + '/陷阱×' + _trapCount + '),提前终止流 (' + _acc.length + ' chars)');
      try { clearInterval(heartbeat); } catch(e){}
      try { res.write('data: [DONE]\n\n'); } catch(e){} // V220f: 先发 [DONE] 再关连接
      try { res.end(); } catch(e){}
      return false;
    }
    // 超长(>60k 字)或周次超过 4(即出现第5周+)才算真正的 degeneracy
    if (_acc.length > 60000 || _maxWeek > 4) {
      console.log('[callDeepSeek] ⚠️ V219b 检测到超长/越界周次,提前终止流 (' + _acc.length + ' chars, maxWeek=' + _maxWeek + ')');
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
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }], max_tokens: reportType === 'monthly' ? 10000 : 8000, temperature: 0.7, frequency_penalty: 0.3, presence_penalty: 0.3, repetition_penalty: 1.05, stream: true, stop: ['===END_OF_REPORT==='] }),
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
  const FLUSH_SIZE = 50;
  let pending = '';
  let sentLen = 0; // V220d
  let lastClean = ''; // V220d: last chunk clean for new-suffix
  let unsentDelta = ''; // V220d: pending delta to send
  let chunkCount = 0;
  // 🛡️ V222z-fix13e: text 流层单锚截断——MISS 路径下 sanitized 从不触发,必须在 text 流层直接断流
  let _monthlyCutDone = false;
  const _MONTHLY_THEME_RE = /\✦\s*\[\🔮/g;
  const heartbeat = setInterval(() => { try { if (typeof res?.write === 'function') { res.write(': heartbeat\n\n'); if (typeof res.flush === 'function') res.flush(); } } catch(e){} }, 20000);
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
          // 🛠️ V120-fix26: 净化层 - 含字面\uXXXX转义→真实emoji + 标题修复
          let clean = txt
            .replace(/\\n/g, '\n')
            .replace(/ \n/g, '\n')
            .replace(/  +/g, ' ')
            // 字面 unicode 转义 → 真实字符 (DeepSeek 偶尔字面吐出 \ud83d\udd2e)
            .replace(/\\ud83d ?\\udd2e/g, '🔮')
            .replace(/\\ud83d ?\\udd2e/g, '🟢')
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
            .replace(/（财充）/g, '（财富充能）')
            .replace(/（高熔）/g, '（高危熔断）')
            .replace(/（顺蓄）/g, '（顺流蓄力）')
            .replace(/（财爆）/g, '（财富爆发）')
            .replace(/\uFFFD/g,'').replace(/�/g,'');
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
                pc = house_linter(natal_sun_linter(astro_phase_linter(final_text_sanitizer(_toSend,_a, lang)),realSunSign,_a), astroMatrix);
                pc = applyMonthLockSanitizer(pc,astroMatrix,null,null,lang).replace(/\uFFFD/g,'').replace(/�/g,'');
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


// ── V97bd: Supabase keys 从文件读(防 Railway Dashboard 老 key 覆盖,同 DeepSeek 方案)──
try {
  if (existsSync('/app/.supabase-url')) {
    const u = readFileSync('/app/.supabase-url', 'utf-8').trim();
    if (u.length > 10) process.env.SUPABASE_URL = u;
  }
  if (existsSync('/app/.supabase-key')) {
    const k = readFileSync('/app/.supabase-key', 'utf-8').trim();
    if (k.length > 10) process.env.SUPABASE_SERVICE_KEY = k;
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
  let t = text;
  // 卧室 → 第四宫(田宅宫)
  t = t.replace(/卧室[^\n]{0,40}?第[一二三四五六七八九十百0-9]{1,3}宫[^\n]{0,20}?/g, '卧室区域:第四宫(田宅宫)');
  t = t.replace(/卧室[^\n]{0,20}?(第[一二三四五六七八九十百0-9]{1,3}宫[^)]{0,12})[^\n]{0,20}?/g, '卧室区域:第四宫(田宅宫)');
  // 厨房 → 第二宫(财帛宫)与第八宫(共享资源)
  t = t.replace(/厨房[^\n]{0,40}?第[一二三四五六七八九十百0-9]{1,3}宫[^\n]{0,20}?/g, '厨房区域:第二宫(财帛宫)与第八宫(共享资源)');
  t = t.replace(/厨房[^\n]{0,20}?(第[一二三四五六七八九十百0-9]{1,3}宫[^)]{0,12})[^\n]{0,20}?/g, '厨房区域:第二宫(财帛宫)与第八宫(共享资源)');
  // 财务室 → 第八宫(共享资源)
  t = t.replace(/财务室[^\n]{0,40}?第[一二三四五六七八九十百0-9]{1,3}宫[^\n]{0,20}?/g, '财务室区域:第八宫(共享资源)');
  t = t.replace(/财务室[^\n]{0,20}?(第[一二三四五六七八九十百0-9]{1,3}宫[^)]{0,12})[^\n]{0,20}?/g, '财务室区域:第八宫(共享资源)');
  return t;
}

// V116-Bug4-fix
function cleanGarbageCharacters(text){if(!text)return text;return text.replace(/\uFFFD/g,'').replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g,'').replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,'').replace(/[\u200B-\u200D\uFE0F\uFEFF]/g,'');}


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
    const _stripEmoji = (s) => s.replace(/[✦🔮⚠️\*]/g, '').replace(/\uFE0F/g, '').trim();
    text = text.split('\n').map(ln => {
    const t = ln.trim();
    // ── 先处理特殊内容，再判断括号 ──
    // 消费陷阱：[消费陷阱 2026年7月] → [⚠️ 消费陷阱：2026年7月]
    // V184-fix: 必须在 startsWith('[') 判断之前检查，否则会被放行
    if (/消费陷阱/.test(t)) {
      // 已有方括号，但内容不对（缺 emoji 或冒号）
      if (t.startsWith('[')) {
        // [消费陷阱 2026年7月] → 消费陷阱 2026年7月
        let inner = t.replace(/^\[\s*/, '').replace(/\s*\]$/, '');
        inner = inner.replace(/消费陷阱\s*([：:]?)\s*/g, '消费陷阱：');
        if (!/⚠/.test(inner)) inner = '⚠️ ' + inner;
        return '✦\n[' + inner + ']';  // 🛠️ V187: 加 ✦ 分隔符
      } else {
        // 消费陷阱 2026年7月 → [⚠️ 消费陷阱：2026年7月]
        let normalized = t.replace(/消费陷阱\s*([：:]?)\s*/g, '消费陷阱：');
        if (!/⚠/.test(normalized)) normalized = '⚠️ ' + normalized;
        return '✦\n[' + normalized + ']';  // 🛠️ V187: 加 ✦ 分隔符
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
  text = text.replace(/([\u4e00-\u9fa5])()([\u4e00-\u9fa5])/g, '$1$2');
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
  text = text.replace(/[\u200B-\u200D\uFE0F\uFEFF\uFFFE\uFFF0-\uFFFF]/g, '');

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
  text = text.replace(/(行星|[\u4e00-\u9fa5星曜]+星?)(在你|在他|在她|在|的)(第[一二三四五六七八九十百零0-9]+宫)(([^)]+座)|\([^)]+座\))/g, '$1$2$3');
  // 🛠️ Issue B 兜底:"第N宫(XX座)"仍在句中 → 砍括号内星座(保留第N宫描述,但括号内星座必删,因与本命冲突)
  text = text.replace(/第([一二三四五六七八九十百零0-9]+)宫(([^)]+)座)/g, '第$1宫');
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
  const houseMap = getSignToHouseMap(ascendant);
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

  if (ascendant === 'Cancer') {
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
    R('风元素\(处女座', '土元素(处女座');
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

      // 🛠️ V108-fix7: 第五章家居对齐硬编码宫位解耦
      const _homeStart = text.indexOf('家居财富对齐');
      const _officeStart = text.indexOf('办公室财富对齐');
      if (_homeStart >= 0) {
        const _homeEnd = _officeStart >= 0 ? _officeStart : text.length;
        const _before = text.substring(0, _homeStart);
        let _home = text.substring(_homeStart, _homeEnd);
        const _after = text.substring(_homeEnd);
        _home = _home.replace(/第([一二三四五六七八九十百零\d]+)宫/g, '第' + _ch + '宫');
        text = _before + _home + _after;
      }
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

function house_linter(text, astroMatrix, currentMonth = null) {
  if (!text) return text;

  const getH = (v) => typeof v === 'number' ? v : (v?.house ?? v?.natal_house ?? v?.[0] ?? null);
  const toCN = (n) => ['零','一','二','三','四','五','六','七','八','九','十','十一','十二'][n] || String(n);

  // ── 按月分区处理：每节用当月真实 house ──────────────────────────
  // 月份锚点: ### YYYY年MM月: / ### YYYY年M月:
  const monthAnchorRe = /###\s*(\d{4})年(\d{1,2})月:/g;
  const sections = text.split(monthAnchorRe);
  // sections[0] = 前导文本(开篇等), sections[1]=年份, sections[2]=月份, sections[3]=正文, ...

  if (sections.length >= 4 && astroMatrix && astroMatrix.months && astroMatrix.months.length > 0) {
    // 🛠️ V230-fix: 精确年月匹配,不靠 monthNum-1 索引推算
    //   风险: months 是动态滚动数组(从当前月切片), months[monthNum-1] 会越界/错配
    //   治本: 用文本锚点的真实年月拼 month_key ("2026-08") 在 months 里精确查找
    const _monthsMap = {};
    astroMatrix.months.forEach(m => {
      const _k = m.month_key || (m.year && m.month ? `${m.year}-${String(m.month).padStart(2,'0')}` : '');
      if (_k) _monthsMap[_k] = m;
    });
    // sections 奇数位(1,3,5...)=年份/月份, 偶数位(2,4,6...)=正文
    let result = sections[0]; // 前导(不含月份)
    for (let i = 1; i < sections.length; i += 2) {
      const year  = parseInt(sections[i]);
      const monthNum = parseInt(sections[i + 1]); // 1-12
      const body = sections[i + 2] !== undefined ? sections[i + 2] : '';
      // 🛠️ V230-fix: 精确查找(兼容静态全年数组 & 动态滚动数组)
      const _key = `${year}-${String(monthNum).padStart(2,'0')}`;
      const monthData = _monthsMap[_key] || astroMatrix.months[monthNum - 1] || null;
      if (!monthData) { result += sections[i] + '年' + sections[i + 1] + '月:' + body; continue; }
      const jupHouse = getH(monthData.jupiter?.house) || 2;
      const satHouse = getH(monthData.saturn?.house) || 10;
      const plHouse  = getH(monthData.pluto?.house)  || 8;
      const sunHouse = getH(_sunOf(monthData).house) || 1;
      const moonHouse= getH(monthData.moon?.house)   || 2;
      const RULES = [
        ['jupiter', jupHouse], ['saturn', satHouse], ['pluto', plHouse],
        ['sun', sunHouse], ['moon', moonHouse],
      ];
      const NAME_MAP = {
        jupiter: ['木星', 'Jupiter', 'Júpiter', 'Jupiter', 'ดาวพฤหัส', 'Sao Mộc'],
        saturn:  ['土星', 'Saturn', 'Saturno', 'Saturne', 'ดาวเสาร์', 'Sao Thổ'],
        pluto:   ['冥王星', 'Pluto', 'Plutón', 'Pluton', 'ดาวพลูโต', 'Sao Diêm Vương'],
        sun:     ['太阳', 'Sun', 'Sol', 'Soleil', 'ดาวอาทิตย์', 'Mặt Trời'],
        moon:    ['月亮', 'Moon', 'Luna', 'Lune', 'ดาวจันทร์', 'Mặt Trăng'],
      };
      let secText = sections[i] + '年' + sections[i + 1] + '月:' + body;
      for (const [key, house] of RULES) {
        if (!house) continue;
        for (const pname of NAME_MAP[key]) {
          const reCN = new RegExp('(' + pname + '在[^第\\n]{0,12}?第)[一二三四五六七八九十]+宫', 'g');
          secText = secText.replace(reCN, '$1' + toCN(house) + '宫');
          const reEN = new RegExp('(' + pname + ')([^\\n]{0,16}?)(House|Casa|Maison|ภพที่|เรือนที่|Nhà)( +)[0-9]+', 'gi');
          secText = secText.replace(reEN, (m, p1, p2, p3, p4) => p1 + p2 + p3 + p4 + house);
        }
      }
      result += secText;
    }
    return result;
  }

  // ── 回退: 无月份锚点或无 astroMatrix → 用 months 数据处理 ───
  // 🛡️ V233-fix: 法语/西班牙语月份锚点无法被中文锚点正则捕获，自动检测月份关键词选对应数据。
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
  const RULES2 = [
    ['jupiter', jupHouse], ['saturn', satHouse], ['pluto', plHouse],
    ['sun', sunHouse], ['moon', moonHouse], ['mercury', mercHouse], ['venus', venHouse], ['mars', marsHouse],
  ];
  const NAME_MAP2 = {
    jupiter: ['木星', 'Jupiter', 'Júpiter', 'ดาวพฤหัส', 'Sao Mộc'],
    saturn:  ['土星', 'Saturn', 'Saturno', 'Saturne', 'ดาวเสาร์', 'Sao Thổ'],
    pluto:   ['冥王星', 'Pluto', 'Plutón', 'Pluton', 'ดาวพลูโต', 'Sao Diêm Vương'],
    sun:     ['太阳', 'Sun', 'Sol', 'Soleil', 'ดาวอาทิตย์', 'Mặt Trăng'],
    moon:    ['月亮', 'Moon', 'Luna', 'Lune', 'ดาวจันทร์', 'Mặt Trăng'],
    mercury: ['水星', 'Mercury', 'Mercure', 'ดาวพุธ', 'Sao Thủy'],
    venus:   ['金星', 'Venus', 'Vénus', 'ดาวศุกร์', 'Sao Kim'],
    mars:    ['火星', 'Mars', 'ดาวอังคาร', 'Sao Hỏa'],
  };
  for (const [key, house] of RULES2) {
    if (!house) continue;
    for (const pname of NAME_MAP2[key]) {
      const reCN = new RegExp('(' + pname + '在[^第\n]{0,12}?第)[一二三四五六七八九十]+宫', 'g');
      text = text.replace(reCN, '$1' + toCN(house) + '宫');
      // 🛡️ V233-fix: 法语 maison 格式——Lune en 9e maison / Soleil en 8e Maison
      const reFR = new RegExp('(' + pname + '[^\n]{0,20}?)(\d+)e?\s*(maison)', 'gi');
      text = text.replace(reFR, (m, prefix, n, suffix) =>
        parseInt(n) !== house ? prefix + house + 'e ' + suffix : m);
      const reEN = new RegExp('(' + pname + ')([^\n]{0,16}?)(House|Casa|Maison|ภพที่|เรือนที่|Nhà)( +)[0-9]+', 'gi');
      text = text.replace(reEN, (m, p1, p2, p3, p4) => p1 + p2 + p3 + p4 + house);
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
      const mi = currentMonth - 1 + i;
      const year = currentYear + (mi >= 12 ? 1 : 0);
      const month = (mi % 12) + 1;
      _sunSignMap[`${year}年${month}月`] = signZh;
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
    const mi = currentMonth - 1 + i;
    const year = currentYear + (mi >= 12 ? 1 : 0);
    const month = (mi % 12) + 1;
    entries.push({ year, month, key: `${year}年${month}月`, sign: signZh, house, monthIdx: i });
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
    s = s.replace(/\uFE0F/g, '');
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
    if (drifted && !seg.includes('⚠️ 日期校准')) {
      return seg.replace(hm[0], hm[0] + ' ⚠️ 日期校准');
    }
    return seg;
  }).join('');
}


// 🛡️ V222z-fix14: 越南语 DeepSeek 词边界编码缺陷后处理补偿
// 根因: DeepSeek 模型对越南语词边界处理有编码缺陷（空格被模型吞掉）
//       trình tài → trìnhài / của cải → củaải / những nỗi → nhữngỗi 等
// 修复: NFD 归一化 + 空格锚点 split-join，精确替换已知损坏模式
function fixVietnameseCorruption(text) {
  if (!text) return text;
  // 只有含越南语声调字符才处理（其他语言不受影响）
  if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởùúụủũưừứựửữỳýỵỷđ]/i.test(text)) return text;
  let s = text.normalize('NFD');
  s = ' ' + s + ' '; // 空格锚点，消除行首/行末匹配问题
  const fixes = [
    'bạnè bè', 'bạn bè bè',
    'trìnhài', 'trình tài',
    'củaải', 'của cải',
    'nhữngỗi', 'những nỗi',
    'thìầm', 'thì thầm',
    'bạnè', 'bạn bè',
    'từư duy', 'từ tư duy',
    'tíchinh', 'tích tinh',
    'cón nợ', 'món nợ',
    'làời', 'là lời',
    'trìnhâm', 'trình tâm',
  ];
  for (let i = 0; i < fixes.length; i += 2) {
    const bad = fixes[i].normalize('NFD');
    const good = fixes[i + 1].normalize('NFD');
    const parts = s.split(bad);
    if (parts.length > 1) s = parts.join(good);
  }
  return s.normalize('NFC').replace(/ {2,}/g, ' ').trim();
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
  text = text.replace(/^(?!\[)(Semaine\s*\d+[：:\s][^\]]+)\]$/gm, '[$1]');
  // 泰语周标题: สัปดาห์ที่ 1: xxx]  → [สัปดาห์ที่ 1: xxx]
  text = text.replace(/^(?!\[)(สัปดาห์ที่\s*\d+[：:\s][^\]]+)\]$/gm, '[$1]');
  // 越南语周标题: Tuần 1: xxx]  → [Tuần 1: xxx]
  text = text.replace(/^(?!\[)(Tuần\s*\d+[：:\s][^\]]+)\]$/gm, '[$1]');
  // 西班牙语周标题: Semana 1: xxx]  → [Semana 1: xxx]
  text = text.replace(/^(?!\[)(Semana\s*\d+[：:\s][^\]]+)\]$/gm, '[$1]');
  // 英语周标题: Week 1: xxx]  → [Week 1: xxx]
  text = text.replace(/^(?!\[)(Week\s*\d+[：:\s][^\]]+)\]$/gm, '[$1]');
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

// 🛠️ V107-方案A: 轻量级预缓存校验器(写缓存前拦截质量问题)
function wealthCriticCheck(text, birthDate, natalSunSign) {
  const issues = [];
  if (!text || text.length < 500) issues.push('内容过短');

  // 1. 验证本命太阳星座是否正确出现在前2000字
  if (natalSunSign) {
    const header = text.slice(0, 2000);
    if (!header.includes(natalSunSign)) {
      issues.push('报头缺少' + natalSunSign);
    }
  }

  // 2. 验证乱码
  const fffd = (text.match(/\ufffd/g) || []).length + (text.match(/�/g) || []).length;
  if (fffd > 0) issues.push('FFFD残块: ' + fffd);

  // 3. 验证孤括号
  if (text.match(/[^（]）》/)) issues.push('孤闭括号');

  // 4. 验证关键月份:6月标题必须有双子座
  const juneHeader = text.match(/6月[::].{0,40}?太阳[^座]*座/);
  if (juneHeader && !juneHeader[0].includes('双子座')) {
    issues.push('6月标题星座错误: ' + juneHeader[0].slice(0, 30));
  }

  // 5. 验证 7月 Peak Window 不含射手座
  const julyPeak = text.match(/2026年7月[^🔴🟢]*(?:🟢|🔴)[^。]*?太阳在[^座]*座/g);
  if (julyPeak && julyPeak.some(m => m.includes('射手座'))) {
    issues.push('7月Peak/W太阳座错误(含射手座)');
  }

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
  // 在完整句子内检查:含'形成刑克/三分/六分/对分'但同一句内无'与+行星名'
  var sents = text.split(/[。\n]/);
  for (var si = 0; si < sents.length; si++) {
    var s = sents[si];
    if (/形成(刑克|对分|三分|六分|合相)/.test(s) && !/[日月水火木金土]星.*与[日月水火木金土]星/.test(s)) {
      issues.push('幽灵相位:' + s.slice(0, 50));
      break;
    }
  }

  // 9. 🛠️ 军师审计·P3: 双子座元素错--归入土元素
  // 用分割行方式绕过\n在character class中的逃逸问题
  const badElement = text.split('\n').filter(function(l){return l.indexOf('土元素')>=0 && l.indexOf('双子座')>=0;});
  if (badElement) issues.push('双子座被错误归入土元素:' + badElement.join('|'));

  return issues;
}

function cleanYearlyTimeline(text) {
  if (!text) return text;
  // Pattern 1: 2026年6月2026年6月 → 2026年6月
  text = text.replace(/(\d{4}年\d{1,2}月)(\d{4}年\1)/g, '$1');
  // Pattern 2: 2026年6月2026年6月6月 → 2026年6月21日
  text = text.replace(/(\d{4}年\d{1,2}月)(\d{4}年)(\1)(\d{1,2}月)/g, '$1$4');
  // Pattern 3: 1990年6月2026年6月 → 1990年6月15日
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年)(\2)/g, '$1$2$4日');
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

// // ── Middleware ──
app.use(express.json({ limit: '10mb' }));
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
    const cacheKey = `wealth:v216e:${birthDate}:${birthTime}:${_ckLat}:${_ckLon}:${tz}:${lang}:${reportType}`;
    delUrl = `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}`;
  } else {
    // 模式B: 通配清理该生日下所有旧/新格式缓存 (PostgREST like 通配符用 *, 非 %)
    // 🛠️ V178-P0: 通配符覆盖 v216e(月报/先天) 与 v116-v2(年报) 全部财富键
    const pat = 'wealth:' + encodeURIComponent(birthDate) + ':*';
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
app.get('/api/debug-source', async (req, res) => {
  try {
    const src = readFileSync(import.meta.url.replace('file://', ''), 'utf-8');
    const idx = src.indexOf('res.write(Buffer.from(`data: ${JSON.stringify({');
    res.json({
      hasDbg: src.includes('_dbg'),
      hasDbgAnnotation: src.includes('hasKaichuan'),
      snippet: idx >= 0 ? src.slice(idx, idx+200) : 'NOT FOUND',
      fileLen: src.length
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

  // 优先 Gemini（澳洲付费通道，月报/年报主输出引擎）
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
        console.error('[AI] Gemini returned empty, trying DeepSeek fallback');
      } else {
        console.error('[AI] Gemini HTTP', res.status, 'trying DeepSeek fallback');
      }
    } catch (e) {
      console.error('[AI] Gemini failed, trying DeepSeek:', e.message);
    }
  }

  // 兜底 DeepSeek（修复 v4-flash 推理模型 content 为空问题）
  if (deepseekKey) {
    try {
      const res = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
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
        return (m?.content || m?.reasoning_content || '').trim();
      }
    } catch (e) {
      console.error('[AI] DeepSeek failed:', e.message);
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
const SUN_SIGN_TH = ['เมษ','พฤษภ','มิถุน','กรกฏ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
const SUN_SIGN_ZH = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const SUN_SIGN_ES = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const SUN_SIGN_FR = ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// 月报章节标题兜底修复 (DeepSeek 流式吐字畸变修复)
// 把 AI 缩写/截断的章节标题还原成完整版
// ═══════════════════════════════════════════════════════════════
const SECTION_PLACEHOLDERS = {
  zh: { theme: '【占位符-系统注入】本月命运主题（请刷新重试，AI 未生成此节）', trap: '【占位符-系统注入】消费陷阱（请刷新重试，AI 未生成此节）' },
  en: { theme: '【System-Injected】Monthly Destiny Theme (please refresh, AI did not generate this section)', trap: '【System-Injected】Spending Traps (please refresh, AI did not generate this section)' },
  es: { theme: '【Inyección del Sistema】Tema de Destino Mensual (actualice para reintentar, la IA no generó esta sección)', trap: '【Inyección del Sistema】Trampas de Gasto (actualice para reintentar, la IA no generó esta sección)' },
  fr: { theme: '【Injection Système】Thème de Destin du Mois (veuillez actualiser, l\'IA n\'a pas généré cette section)', trap: '【Injection Système】Pièges Financiers (veuillez actualiser, l\'IA n\'a pas généré cette section)' },
  th: { theme: '【ระบบป้ายแทรก】ธีมโชคชะตาประจำเดือน (กรุณารีเฟรช AI ไม่ได้สร้างส่วนนี้)', trap: '【ระบบป้ายแทรก】กับดักการใช้จ่าย (กรุณารีเฟรช AI ไม่ได้สร้างส่วนนี้)' },
  vi: { theme: '【Hệ Thống Chèn】Chủ Đề Vận Mệnh Tháng (vui lòng làm mới, AI chưa tạo phần này)', trap: '【Hệ Thống Chèn】Bẫy Chi Tiêu (vui lòng làm mới, AI chưa tạo phần này)' }
};

// 🛠️ 章节标题（展示层）按 lang 翻译——UI 视图层 100% 遵循 lang，绝不对用户展示未翻译中文
const SECTION_HEADERS = {
  zh: { theme: '本月命运主题', trap: '消费陷阱：' },
  en: { theme: 'Monthly Destiny Theme', trap: 'Spending Traps: ' },
  es: { theme: 'Tema de Destino Mensual', trap: 'Trampas de Gasto: ' },
  fr: { theme: 'Thème de Destin du Mois', trap: 'Pièges Financiers: ' },
  th: { theme: 'ธีมโชคชะตาประจำเดือน', trap: 'กับดักการใช้จ่าย: ' },
  vi: { theme: 'Chủ Đề Vận Mệnh Tháng', trap: 'Bẫy Chi Tiêu: ' }
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

  // 2. 4周章节标题括号内缩写还原（与AI脱字符场景兼容）
  // 2a. 严重脱落：括号里只剩一个字（AI字符掉了90%）
  c = c.replace(/【第1周】[\s\S]{0,40}（财）(?![富发])/g, m => m.replace(/（财）/, '（财富充能）'));
  c = c.replace(/【第2周】[\s\S]{0,40}（高）(?![危熔])/g, m => m.replace(/（高）/, '（高危熔断）'));
  c = c.replace(/【第3周】[\s\S]{0,40}（）\s*顺）(?![流蓄])/g, m => m.replace(/（）\s*顺）/, '（顺流蓄力）'));
  c = c.replace(/【第3周】[\s\S]{0,40}（顺）(?![流蓄])/g, m => m.replace(/（顺）/, '（顺流蓄力）'));
  c = c.replace(/【第4周】[\s\S]{0,40}（财）(?![富发])/g, m => m.replace(/（财）/, '（财富爆发）'));
  // 2b. 中度脱落：括号里还剩两个字
  c = c.replace(/（财充）(?![富发])/g, '（财富充能）');
  c = c.replace(/（高危）(?![熔])/g, '（高危熔断）');
  c = c.replace(/（高熔断）/g, '（高危熔断）');
  c = c.replace(/（高熔）(?![断])/g, '（高危熔断）');
  c = c.replace(/（顺流）(?![蓄])/g, '（顺流蓄力）');
  c = c.replace(/（顺蓄）(?![力])/g, '（顺流蓄力）');
  c = c.replace(/（财爆）(?![发])/g, '（财富爆发）');
  c = c.replace(/（财富爆）(?![发])/g, '（财富爆发）');

  // 3. 【消费陷阱】缩写还原
  c = c.replace(/【消陷】/g, '【消费陷阱】');
  c = c.replace(/【消费】(?!.*陷阱)/g, '【消费陷阱】');

  // 4. 清理多余 '）'（避免 '（财富充能））'）
  c = c.replace(/）\s*）/g, '）');

  // 5. 🛠️ V223-fix: 去掉 ✦ 前缀——DeepSeek 输出 "✦ [emoji 第N周...]"
  //    前端 SacredYearlyReportBox 的 parseLine 期望 "[emoji 第N周...]"
  //    不含 ✦ 前缀（✦ 是章节分隔符，不是标题前缀）
  //    同时处理跨行情况：单独一行的 ✦ 与下一行周标题合并后去前缀
  c = c.replace(/^✦\s*$(\s*\[\s*(?:🟢|🔴|🔵|⚠️|🔮)\s*)/gm, '$1');
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
      const hasTrap = /消费陷阱|Spending\s*Traps|Trampas\s*de\s*Gasto|Pièges\s*Financiers|กับดักการใช้จ่าย|Bẫy\s*Chi\s*Tiêu|Financial\s*Shadow|Ombre\s*Financi|Sombra\s*Financi|เงาการ|Bóng\s*Tài/i.test(c);
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
  // Trap: 匹配 [⚠️ ...]（负向预查排除周次标题 [⚠️ Week N]），归一为 lang 规范头（带月份）
  // 2026-08-09-fix: 末尾加 \s*✦? 吃掉尾部 ✦；并新增 Financial Shadow 变体（无 ⚠️ 时整行即标题，吃掉整行）
  c = c.replace(/✦?\s*\[\s*⚠️\s*(?!(?:🟢|🔴|🔵)?\s*(?:Week|Semana|Semaine|Tuần|สัปดาห์ที่|第\s*[\d一二三四五六七八九十]+\s*周))[^\]]*\]\s*✦?/gi, `✦ [⚠️ ${_v229hdr.trap}${_v229monthLabel}] ✦`);
  c = c.replace(/✦?\s*\[\s*Financial\s*Shadow[^\n]*/gi, `✦ [⚠️ ${_v229hdr.trap}${_v229monthLabel}] ✦`);

  // 8. 🛠️ 2026-08-09: 英文排版粘连清洗（仅 en，清洗层兜底不改 Prompt）
  //    LLM 吐字常把英文单词与数字/序数词粘连：your12th→your 12th / Aug1–7→Aug 1–7 / 12thHouse→12th House
  //    幂等安全：已带空格的不再匹配；流式分片跨 chunk 断开时拼接结果仍正确
  if (lang === 'en') {
    c = c.replace(/([a-zA-Z])(\d+)/g, '$1 $2')
         .replace(/(\d+)(st|nd|rd|th)([A-Za-z])/g, '$1$2 $3');
  }

  return c;
}

function buildMonthlyPrompt(birthDate, lang) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  // V222i: 动态计算当月最后一天（根治硬编码 '31日' 跨月错误）
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const monthNamesZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const curMonthName = monthNames[currentMonth - 1];
  const curMonthZH = `${currentYear}年${monthNamesZH[currentMonth-1]}`;

  // ── 多语言标题字典（军师裁决 V136）─────────────────────────────
  const HEADER_TEMPLATES = {
    zh: {
      overview:    '✦ [🔮 本月命运主题] ✦',
      week1:       `✦ [🟢 第1周：${curMonthZH}（财富充能）]`,
      week2:       `✦ [🔴 第2周：${curMonthZH}（高危熔断）]`,
      week3:       `✦ [🔵 第3周：${curMonthZH}（顺流蓄力）]`,
      week4:       `✦ [🟢 第4周：${curMonthZH}（财富爆发）]`,
      trap:        `✦ [⚠️ 消费陷阱：${curMonthZH}]`,
      circuit:     '',
      circuit_tag: '⚠️ 安全指令：',
    },
    en: {
      overview:    '✦ [🔮 Monthly Destiny Theme] ✦',
      week1:       `✦ [Week 1: ${curMonthName} 1–7] Wealth Recharging`,
      week2:       `✦ [Week 2: ${curMonthName} 8–14] High-Risk Circuit Breaker`,
      week3:       `✦ [Week 3: ${curMonthName} 15–22] Strategic Integration`,
      week4:       `✦ [Week 4: ${curMonthName} 23–${lastDayOfMonth}] The Wealth Explosion`,
      trap:        `✦ [⚠️ Spending Traps: ${curMonthName} ${currentYear}] ✦`,
      circuit:     'Core Cosmic Window: ',
      circuit_tag: '【Risk Alert:】'
    },
    es: {
      overview:    '✦ [🔮 Tema de Destino Mensual] ✦',
      week1:       `✦ [Semana 1: ${curMonthName} 1–7] Recarga de Riqueza`,
      week2:       `✦ [Semana 2: ${curMonthName} 8–14] Cortocircuito de Alto Riesgo`,
      week3:       `✦ [Semana 3: ${curMonthName} 15–22] Integración Estratégica`,
      week4:       `✦ [Semana 4: ${curMonthName} 23–${lastDayOfMonth}] Explosión de Riqueza`,
      trap:        `✦ [⚠️ Trampas de Gasto: ${curMonthName} ${currentYear}] ✦`,
      circuit:     'Ventana Cósmica Clave: ',
      circuit_tag: '【Alerta de Riesgo:】',
    },
    fr: {
      overview:    '✦ [🔮 Thème de Destin du Mois] ✦',
      week1:       `✦ [Semaine 1: ${curMonthName} 1–7] Recharge de Richesse`,
      week2:       `✦ [Semaine 2: ${curMonthName} 8–14] Disjoncteur à Haut Risque`,
      week3:       `✦ [Semaine 3: ${curMonthName} 15–22] Intégration Stratégique`,
      week4:       `✦ [Semaine 4: ${curMonthName} 23–${lastDayOfMonth}] Explosion de Richesse`,
      trap:        `✦ [⚠️ Pièges Financiers: ${curMonthName} ${currentYear}] ✦`,
      circuit:     'Fenêtre Cosmique Clé: ',
      circuit_tag: '【Alerte de Risque :】',
    },
    th: {
      overview:    '✦ [🔮 ธีมโชคชะตาประจำเดือน] ✦',
      week1:       `✦ [สัปดาห์ที่ 1: ${curMonthName} 1–7] การเติมพลังความมั่งคั่ง`,
      week2:       `✦ [สัปดาห์ที่ 2: ${curMonthName} 8–14] วงจรความเสี่ยงสูง`,
      week3:       `✦ [สัปดาห์ที่ 3: ${curMonthName} 15–22] การบูรณาการเชิงกลยุทธ์`,
      week4:       `✦ [สัปดาห์ที่ 4: ${curMonthName} 23–${lastDayOfMonth}] การระเบิดความมั่งคั่ง`,
      trap:        `✦ [⚠️ กับดักการใช้จ่าย: ${curMonthName} ${currentYear}] ✦`,
      circuit:     'หน้าต่างจักรวาลหลัก: ',
      circuit_tag: '【คำเตือนความเสี่ยง:】',
    },
    vi: {
      overview:    '✦ [🔮 Chủ Đề Vận Mệnh Tháng] ✦',
      week1:       `✦ [Tuần 1: ${curMonthName} 1–7] Nạp năng lượng Tài sản`,
      week2:       `✦ [Tuần 2: ${curMonthName} 8–14] Mạch Ngắn Rủi ro Cao`,
      week3:       `✦ [Tuần 3: ${curMonthName} 15–22] Tích hợp Chiến lược`,
      week4:       `✦ [Tuần 4: ${curMonthName} 23–${lastDayOfMonth}] Bùng nổ Tài sản`,
      trap:        `✦ [⚠️ Bẫy Chi Tiêu: ${curMonthName} ${currentYear}] ✦`,
      circuit:     'Cửa sổ Vũ trụ chính: ',
      circuit_tag: '【Cảnh Báo Rủi Ro:】',
    },
  };
  const HT = HEADER_TEMPLATES[lang] || HEADER_TEMPLATES.zh;

  // 多语言语言铁律（来自 b41261b 验证可用版本）
  const langInstructions = {
    zh: '\n\n【中文写作铁律 - 必读】\n1. 🛑 禁用畸形被动句：严禁使用"被……成为"、"被……使得"等不符合中文习惯的被动句（例："你的财富宫位被巨蟹座成为中心"❌）。一律使用主动语态（例："巨蟹座成为了你财富宫位的中心"✅）。\n2. 🛑 主语完整性：提到星座对冲或相位时，必须写明"本命星座"或"流年星体"（例：写"与你的本命摩羯座太阳形成对冲"✅），严禁只写"你的摩羯座形成对冲"❌。\n  6. 🛑 本命星体铁律：严格区分本命与流年！本命星体=用户出生星图位置（出生日期锁定），流年星体=2026年当下天象位置。禁止将2026年流年星体（白羊座土星、摩羯座海王星等）冠以"本命"前缀。\n  7. 🛑 天文几何铁律：月亮在摩羯座与冥王星在水瓶座仅30°相邻（相邻星座绝不等同于对冲），7月绝不可能形成月亮/冥王对冲。严禁写"月亮在摩羯座与冥王星在水瓶座形成对冲"——正确为"错位张力"或"能量碰撞"。\n',
    en: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN ENGLISH. Ignore any Chinese text in the system prompt. Write in sophisticated, soul-stirring English. You are a top-tier Western astrologer and Jungian psychologist. Use professional terms (Solar Return, Shadow Self, Synastry Alignment, Jungian Shadow Work, 8th House, 11th House). NEVER use invented aspect names like "trine", "square", "sextile", or "opposite". Always describe planetary interactions with energetic flow terms: "creates a powerful alignment with...", "forms dynamic tension with...", "harmonizes with the energy of...", "triggers transformative friction with...". ALL OUTPUT MUST BE IN ENGLISH ONLY.\n\n[ANTI-LITERAL TRANSLATION BLACKLIST] NEVER use awkward literal translations of Chinese fortune-telling terms. FORBIDDEN: "Core Heavenly Secrets", "Heavenly Machine", "Fate Opportunity", "Celestial Secret", "Heavenly Secret". ALWAYS use authentic Western Psychological Astrology terms instead: "Core Cosmic Window", "Key Astrological Catalyst", "Celestial Trigger Point", "Primary Planetary Shift".',
    es: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN SPANISH. Ignore any Chinese text in the system prompt. Eres un astrólogo de élite y psicólogo junguiano. Usa términos profesionales (Yo Sombra, Retorno Solar, Alineación de Sinastría). Escribe en español sofisticado y místico. TODA LA SALIDA DEBE ESTAR EN ESPAÑOL ÚNICAMENTE.',
    fr: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN FRENCH. Ignore any Chinese text in the system prompt. Vous êtes un maître astrologue parisien et psychologue junguien. Utilisez un ton romantique, philosophique, avec des termes tarologiques classiques et le concept du "Soi" de Jung. Écrivez en français élégant. TOUTE LA SORTIE DOIT ÊTRE EN FRANÇAIS UNIQUEMENT.\n\n⛔ RÈGLE SOLEIL NATAL vs TRANSIT: Le Soleil mentionné dans ce rapport mensuel est le Soleil de TRANSIT du mois courant, PAS votre Soleil natal. N\'écrivez JAMAIS "votre Soleil en [signe]" ni "votre Soleil en Maison X" pour décrire le Soleil de transit (cela ferait croire que votre Soleil natal est ce signe — or votre Soleil natal est une donnée permanente fixée par votre date de naissance). Utilisez toujours "Le Soleil en transit dans [signe]" ou "Le Soleil du mois dans [signe]".',
    th: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN THAI. Ignore any Chinese text in the system prompt. คุณคือโหราจารย์ชั้นนำที่ผสมผสานจิตวิทยาคววเจียน ใช้คำที่ศักดิ์สิทธิ์และน่าเคารพ เขียนในภาษาไทยที่ทรงพลัง ผลลัพธ์ทั้งหมดต้องเป็นภาษาไทยเท่านั้น',
    vi: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN VIETNAMESE. Ignore any Chinese text in the system prompt. Bạn là một chiêm tinh gia hàng đầu kết hợp tâm lý học Jungian. Viết bằng tiếng Việt trang trọng, mang tính định mệnh. TOÀN BỘ ĐẦU RA PHẢI BẰNG TIẾNG VIỆT CHỈ.',
  };
  const instruction = langInstructions[lang] || langInstructions.en;

  const MONTHLY_SYSTEM = {
    zh: `You are a master wealth astrologer and clinical psychologist generating a monthly financial report.${instruction}\n\nCRITICAL: You MUST write at least 1200 words.`,
    en: `You are a wealth astrologer and Jungian psychologist generating a monthly financial report.${instruction}\n\nCRITICAL: You MUST write at least 1200 words.`,
    es: `Eres un astrólogo de riqueza y psicólogo junguiano generando un informe financiero mensual.${instruction}\n\nCRÍTICO: Debes escribir al menos 1200 palabras.`,
    fr: `Vous êtes un astrologue de la richesse et psychologue junguien générant un rapport financier mensuel.${instruction}\n\nCRITIQUE: Vous devez écrire au moins 1200 mots.`,
    th: `คุณคือโหราจารย์ด้านความมั่งคั่งและนักจิตวิทยาจุงเกียน สร้างรายงานการเงินรายเดือน${instruction}\n\nสำคัญ: คุณต้องเขียนอย่างน้อย 1200 คำ`,
    vi: `Bạn là nhà chiêm tinh giàu có và nhà tâm lý học Jungian tạo báo cáo tài chính hàng tháng.${instruction}\n\nQUAN TRỌNG: Bạn phải viết ít nhất 1200 từ.`,
  };

  // 🛠️ V188: 封口令 — 禁止 CoT 泄漏(军师审计: AI 把内心戏喷进正文)
  // ⚠️ P0-fix: 注入月亮行运死锁约束 + 精确数据（根治「月亮进4次天蝎座」幻觉）
  const STRICT_GROUNDING = `
### [STRICT GROUNDING & MOON TRANSIT RULES — V232 P0-FIX]
1. ZERO INVENTIONS: You are strictly constrained to the facts provided in EPHEMERIS_DATA below.
2. MOON TRANSIT SINGLE-USE RULE: The Moon transits each zodiac sign ONLY ONCE per month (~2.5 days per sign). NEVER repeat "Moon in [Sign]" across multiple weeks.
3. STRICT DATES ONLY: Only mention planetary transits for the EXACT dates listed in EPHEMERIS_DATA. If a date is not in the JSON, it DOES NOT EXIST.
4. CLOSED-WORLD ASSUMPTION: If a celestial event is not explicitly provided below, it DOES NOT EXIST.

❌ Bad Output: Mentioning "Moon in Scorpio (ราศีพิจิก)" in Week 1, Week 2, Week 3, and Week 4.
✅ Good Output: Mentioning "Moon in Scorpio" ONLY on the exact dates specified in EPHEMERIS_DATA.
`;
  
  const monthlySystem = (MONTHLY_SYSTEM[lang] || MONTHLY_SYSTEM.en) + FORMAT_FIREWALL + STRICT_GROUNDING;

  
  return {
    system: monthlySystem,
    user: `

### [EPHEMERIS_DATA — Moon Transit Calendar for ${curMonthName} ${currentYear}]
⚠️ CRITICAL: The Moon transits each zodiac sign ONLY ONCE per month (~2.5 days). Below is the EXACT schedule. COPY THESE DATES EXACTLY — do NOT invent dates.

Moon Transits for ${curMonthName} ${currentYear}:
  • Aug 1-2: Moon in Leo (ราศีสิงห์)
  • Aug 3-5: Moon in Virgo (ราศีกันย์)
  • Aug 6-8: Moon in Libra (ราศีตุลย์)
  • Aug 9-11: Moon in Scorpio (ราศีพิจิก) ← ONLY occurrence this month
  • Aug 12-14: Moon in Sagittarius (ราศีธนู)
  • Aug 15-17: Moon in Capricorn (ราศีมังกร)
  • Aug 18-20: Moon in Aquarius (ราศีกุมภ์)
  • Aug 21-23: Moon in Pisces (ราศีมีน)
  • Aug 24-26: Moon in Aries (ราศีเมษ)
  • Aug 27-28: Moon in Taurus (ราศีพฤษภ)
  • Aug 29-30: Moon in Gemini (ราศีเมถุน)
  • Aug 31: Moon in Cancer (ราศีกรกฎ)

⛔ DEATH RULE: The Moon is in Scorpio (ราศีพิจิก) ONLY on Aug 9-11. NEVER write "Moon in Scorpio" for any other dates. NEVER repeat "Moon in Scorpio" across multiple weeks.

---

ASTROGRAPHIC RULES (MUST FOLLOW — DO NOT CONTRADICT):
• MERCURY Rx July 2026: ENTIRE MONTH in 巨蟹座 (Cancer) — Mercury is NEVER in Leo in July 2026 (do NOT write "水星在狮子座逆行"). Retrograde STARTED ~June 29 (before July) and ENDS ~July 23-24 (turns direct). So in July: 7/1–7/23 RETROGRADE, 7/24+ DIRECT, ALL MONTH in Cancer. July 18 is just MID-retrograde — NOT a start, NOT a peak. Correct phrasing: "水星在巨蟹座逆行（7月23日前后恢复顺行）". NEVER write: (1) "水星在狮子座逆行" (wrong sign). (2) "水星于7月X日正式开始逆行" (it started in late June, not July). (3) "7月18日逆行顶点/开始" (false — 7/18 is ordinary mid-retrograde). (4) "水星恢复顺行" before July 23.
• SUN INGRESS Leo: 7月23日太阳正式进入狮子座（这是唯一一次进入，且之后整月都在狮子座）。7月1日-22日太阳在巨蟹座，7月23日-31日太阳在狮子座。绝不能在7月1-22日写"太阳在狮子座"；也绝不能在7月23日之后（尤其是第4周7月25-31日）写"太阳在巨蟹座"——太阳一旦入狮绝不回头。禁止写"7月XX日太阳进入狮子座"（XX不是23）。正确写法：7月1-22日"太阳在巨蟹座"；7月23日之后（含第4周）必须写"太阳在狮子座"。严禁写"7月XX日太阳进入巨蟹座"——太阳在7月23日之后绝不在巨蟹座；如出现"进入巨蟹座"，立即改为"进入狮子座"。
• 禁止使用"同频共振"——一律用"协同互动"或"能量互动"。
• 禁止用"意外之财"描述梅花相/四分相。
• VENUS July 2026: 7/1–7/13 in 狮子座 (Leo); 7/14+ enters 处女座 (Virgo). Venus NEVER goes backwards.
• MARS July 2026: in 双子座 (Gemini) all month.
• SATURN July 2026: in 白羊座 (Aries) — NEVER write Saturn in 射手座/摩羯座. Saturn last in Sagittarius was 2015–2017.
• PLUTO July 2026: in 水瓶座 (Aquarius) all month.
• JUPITER: in Leo all July 2026 — NEVER write Jupiter in Pisces
• MOON July 2026: on 7/31 it is in 水瓶座 (Aquarius). NEVER write "月亮在双子座" for July 31.
• NO NEW MOON on July 1 or July 31 — real new moon is ~July 14
• 第八宫天然守护天蝎座 — 月亮在第8宫时，其星座应与天蝎座/摩羯座/射手座相邻，绝不是双子座。

⛔ [天体相位禁用令]: 严禁使用精确几何度数描述（如"形成四分相/合相/对分相"）。禁止将次六分相(30°)夸大为"突破性"。两个相邻星座(如双子座-巨蟹座)之间不存在强相位。当行星落入某宫时，只描述该宫的财富主题，不描述宫与宫之间的"相位"关系。

⛔ [禁止凭空发明行星位置]: 除本规则明确列出的行星位置外,不得随意编造任何行星在特定日期的星座位置。金星7/1在狮子座,不是处女座。月亮相对于第8宫的位置应基于真实黄道位置而非主观设定。
⛔ [宫位含义一致性]: 行星进入某星座时,其宫位必须严格引用下方[宫位铁律]注入的等宫制完整映射表(按本命上升星座计算)。不同上升星座宫位完全不同,禁止凭星座序号自行推算,禁止套用任何固定映射(如"处女座=第12宫"仅在白羊上升成立,对其他上升星座错误)。

[THAI ASTRO RULES]:
• MERCURY Rx: ดาวพุธวงในเริ่ม ~2–24 กรกฎาคม ในราศีกรกฎ (Cancer) — ห้ามเขียนดาวพุธในราศีสิงห์ (Leo) ตลอดเดือนกรกฎาคม
• SUN เข้าราศีสิงห์: 23 กรกฎาคม (ไม่ใช่ 22 หรือ 25)
• VENUS: 1-13 กรกฎาคม อยู่ราศีสิงห์ (Leo); 14+ เข้าราศีกันยา (Virgo)
• SATURN: อยู่ราศีเมษ (Aries) ตลอดกรกฎาคม — ห้ามเขียนดาวเสาร์ในราศีธนู/มังกร/กุมภ์
• PLUTO: อยู่ราศีกุมภ์ (Aquarius) ตลอดกรกฎาคม
• NEW MOON จริง: ~14 กรกฎาคม 2026

[VIETNAMESE ASTRO RULES]:
• MERCURY Rx: Sao Thủy nghịch ~2-24/7/2026 trong Cự Giải (Cancer) — cấm tuyệt đối viết Sao Thủy ở Sư Tử (Leo) trong tháng 7
• SUN vào Sư Tử: 23/7 (không phải 22 hay 25)
• VENUS: 1-13/7 ở Sư Tử (Leo); 14+ ở Xử Nữ (Virgo)
• SATURN: ở Bạch Dương (Aries) cả tháng 7 — cấm viết Sao Thổ ở Nhân Mã/Ma Kết
• PLUTO: ở Bảo Bình (Aquarius) cả tháng 7
• WEEK 3 (Jul 15-21): Ngày 18/7 là đỉnh Sao Thủy nghịch (station) — tuyệt đối không đặt ngày 18/7 làm ngày vàng tài chính
• SỐ TIỀN: Dùng cùng một đơn vị (VND hoặc triệu đồng), không thay đổi linh tinh
• CẤM: "TÌNH TRẠNG GIỜI NGUYỆT TÀI CHÍNH" — dùng tiếng Việt tự nhiên

Generate a ${lang} monthly wealth report for birth date ${birthDate} — natal sun sign: ${natalSunZH} (${natalSunEN}) — (${curMonthName} ${currentYear}).

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
  if (!sunSign) sunSign = zodiacSigns[0];

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

  const startMonth = currentMonth; // 7 (July)
  const monthsRange = getMonthRange(startMonth - 1, 12).join('、') + '(共12个月)';

  // ── 语言专属指令 ──
  const langInstructions = {
    zh: '\n\n【强制语言指令】你必须全程使用简体中文输出。忽略系统提示中的任何英文指令。严禁输出任何英文句子或英文单词，只写中文。\n\n【中文写作铁律 - 必读】\n1. 🛑 禁用畸形被动句：严禁使用"被……成为"、"被……使得"等不符合中文习惯的被动句（例："你的财富宫位被巨蟹座成为中心"❌）。一律使用主动语态（例："巨蟹座成为了你财富宫位的中心"✅）。\n2. 🛑 主语完整性：提到星座对冲或相位时，必须写明"本命星座"或"流年星体"（例：写"与你的本命摩羯座太阳形成对冲"✅），严禁只写"你的摩羯座形成对冲"❌。\n3. 🛑 句式完整性铁律：每个句子必须有完整主语+谓语。星体名称不能单独成句或与动词分离（如"巨蟹座交织"❌应写成"太阳与水星在巨蟹座交织"✅；"金星从狮子座的深层资源领域"❌应写成"金星从狮子座进入深层资源领域"✅）。\n4. 🛑 宫位标签强制吐出：当提及星体所在宫位时，必须同时写出"第X宫"标签（例："木星在狮子座（第5宫）"✅），不得只写宫位主题省略"第X宫"数字标签。\n5. 🛑 水星逆行铁律：水星于6月底进入巨蟹座逆行，7月24日恢复顺行。禁止写"7月16日恢复顺行"、"7月18日逆行顶点"等矛盾句式。正确写法："水星在巨蟹座逆行"或"7月24日水星恢复顺行"。\n  6. 🛑 天文几何铁律：月亮在摩羯座与冥王星在水瓶座仅30°相邻（相邻星座绝不等同于对冲），7月绝不可能形成月亮/冥王对冲。严禁写"月亮在摩羯座与冥王星在水瓶座形成对冲"——正确为"错位张力"或"能量碰撞"。\n',
    en: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN ENGLISH. Ignore any Chinese text in the system prompt. Write in sophisticated, soul-stirring English. You are a top-tier Western astrologer and Jungian psychologist. Use professional terms (Solar Return, Shadow Self, Synastry Alignment, Jungian Shadow Work, 8th House, 11th House). NEVER use invented aspect names like "trine", "square", "sextile", or "opposite". Always describe planetary interactions with energetic flow terms: "creates a powerful alignment with...", "forms dynamic tension with...", "harmonizes with the energy of...", "triggers transformative friction with...". ALL OUTPUT MUST BE IN ENGLISH ONLY.\n\n[ANTI-LITERAL TRANSLATION BLACKLIST] NEVER use awkward literal translations of Chinese fortune-telling terms. FORBIDDEN: "Core Heavenly Secrets", "Heavenly Machine", "Fate Opportunity", "Celestial Secret", "Heavenly Secret". ALWAYS use authentic Western Psychological Astrology terms instead: "Core Cosmic Window", "Key Astrological Catalyst", "Celestial Trigger Point", "Primary Planetary Shift".',
    es: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN SPANISH. Ignore any Chinese text in the system prompt. Eres un astrólogo de élite y psicólogo junguiano. Usa términos profesionales (Yo Sombra, Retorno Solar, Alineación de Sinastría). Escribe en español sofisticado y místico. TODA LA SALIDA DEBE ESTAR EN ESPAÑOL ÚNICAMENTE.',
    fr: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN FRENCH. Ignore any Chinese text in the system prompt. Vous êtes un maître astrologue parisien et psychologue junguien. Utilisez un ton romantique, philosophique, avec des termes tarologiques classiques et le concept du "Soi" de Jung. Écrivez en français élégant. TOUTE LA SORTIE DOIT ÊTRE EN FRANÇAIS UNIQUEMENT.',
    th: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN THAI. Ignore any Chinese text in the system prompt. คุณคือโหราจารย์ชั้นนําที่ผสมผสานจิตวิทยาคววเจียน ใช้คําที่ศักดิ์สิทธิ์และน่าเคารพ เขียนในภาษาไทยที่ทรงพลัง ผลลัพธ์ทั้งหมดต้องเป็นภาษาไทยเท่านั้น',
    vi: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN VIETNAMESE. Ignore any Chinese text in the system prompt. Bạn là một chiêm tinh gia hàng đầu kết hợp tâm lý học Jungian. Viết bằng tiếng Việt trang trọng, mang tính định mệnh. TOÀN BỘ ĐẦU RA PHẢI BẰNG TIẾNG VIỆT CHỈ.',
  };
  const instruction = langInstructions[lang] || langInstructions.en;

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
      week1:       `✦ [🟢 第1周：${curMonthLocal}1日–7日（财富充能）]`,
      week2:       `✦ [🔴 第2周：${curMonthLocal}8日–14日（高危熔断）]`,
      week3:       `✦ [🔵 第3周：${curMonthLocal}15日–22日（顺流蓄力）]`,
      week4:       `✦ [🟢 第4周：${curMonthLocal}23日–${lastDayOfMonth}日（财富爆发）]`,
      trap:        `✦ [⚠️ 消费陷阱：${currentYear}年${curMonthLocal}] ✦`,
      circuit:     '核心天机：',
      circuit_tag: '【风险提示：】',
    },
    en: {
      overview:    '✦ [🔮 Monthly Destiny Theme] ✦',
      week1:       `✦ [Week 1: ${curMonthLocal} 1–7] Wealth Recharging`,
      week2:       `✦ [Week 2: ${curMonthLocal} 8–14] High-Risk Circuit Breaker`,
      week3:       `✦ [Week 3: ${curMonthLocal} 15–22] Strategic Integration`,
      week4:       `✦ [Week 4: ${curMonthLocal} 23–${lastDayOfMonth}] The Wealth Explosion`,
      trap:        `✦ [⚠️ Spending Traps: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'Core Cosmic Window: ',
      circuit_tag: '【Risk Alert:】'
    },
    es: {
      overview:    '✦ [🔮 Tema de Destino Mensual] ✦',
      week1:       `✦ [Semana 1: ${curMonthLocal} 1–7] Recarga de Riqueza`,
      week2:       `✦ [Semana 2: ${curMonthLocal} 8–14] Cortocircuito de Alto Riesgo`,
      week3:       `✦ [Semana 3: ${curMonthLocal} 15–22] Integración Estratégica`,
      week4:       `✦ [Semana 4: ${curMonthLocal} 23–${lastDayOfMonth}] Explosión de Riqueza`,
      trap:        `✦ [⚠️ Trampas de Gasto: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'Ventana Cósmica Clave: ',
      circuit_tag: '【Alerta de Riesgo:】',
    },
    fr: {
      overview:    '✦ [🔮 Thème de Destin du Mois] ✦',
      week1:       `✦ [Semaine 1: ${curMonthLocal} 1–7] Recharge de Richesse`,
      week2:       `✦ [Semaine 2: ${curMonthLocal} 8–14] Disjoncteur à Haut Risque`,
      week3:       `✦ [Semaine 3: ${curMonthLocal} 15–22] Intégration Stratégique`,
      week4:       `✦ [Semaine 4: ${curMonthLocal} 23–${lastDayOfMonth}] Explosion de Richesse`,
      trap:        `✦ [⚠️ Pièges Financiers: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'Fenêtre Cosmique Clé: ',
      circuit_tag: '【Alerte de Risque :】',
    },
    th: {
      overview:    '✦ [🔮 ธีมโชคชะตาประจำเดือน] ✦',
      week1:       `✦ [สัปดาห์ที่ 1: ${curMonthLocal} 1–7] การเติมพลังความมั่งคั่ง`,
      week2:       `✦ [สัปดาห์ที่ 2: ${curMonthLocal} 8–14] วงจรความเสี่ยงสูง`,
      week3:       `✦ [สัปดาห์ที่ 3: ${curMonthLocal} 15–22] การบูรณาการเชิงกลยุทธ์`,
      week4:       `✦ [สัปดาห์ที่ 4: ${curMonthLocal} 23–${lastDayOfMonth}] การระเบิดความมั่งคั่ง`,
      trap:        `✦ [⚠️ กับดักการใช้จ่าย: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'หน้าต่างจักรวาลหลัก: ',
      circuit_tag: '【คำเตือนความเสี่ยง:】',
    },
    vi: {
      overview:    '✦ [🔮 Chủ Đề Vận Mệnh Tháng] ✦',
      week1:       `✦ [Tuần 1: ${curMonthLocal} 1–7] Nạp năng lượng Tài sản`,
      week2:       `✦ [Tuần 2: ${curMonthLocal} 8–14] Mạch Ngắn Rủi ro Cao`,
      week3:       `✦ [Tuần 3: ${curMonthLocal} 15–22] Tích hợp Chiến lược`,
      week4:       `✦ [Tuần 4: ${curMonthLocal} 23–${lastDayOfMonth}] Bùng nổ Tài sản`,
      trap:        `✦ [⚠️ Bẫy Chi Tiêu: ${curMonthLocal} ${currentYear}] ✦`,
      circuit:     'Cửa sổ Vũ trụ chính: ',
      circuit_tag: '【Cảnh Báo Rủi Ro:】',
    },
  };
  const HT_RP = HEADER_TEMPLATES_RP[lang] || HEADER_TEMPLATES_RP.zh;

  // 🛠️ V97x 治本:代码算死12个月锁死标题(星座+宫位由 SwissEph 算死,AI 只填四字主题)
  // 🛠️ V100f: 多语言版(按 lang 选字)
  const SIGN_LOCKS = {
    zh: {Aries:'白羊座', Taurus:'金牛座', Gemini:'双子座', Cancer:'巨蟹座', Leo:'狮子座', Virgo:'处女座', Libra:'天秤座', Scorpio:'天蝎座', Sagittarius:'射手座', Capricorn:'摩羯座', Aquarius:'水瓶座', Pisces:'双鱼座'},
    en: {Aries:'Aries', Taurus:'Taurus', Gemini:'Gemini', Cancer:'Cancer', Leo:'Leo', Virgo:'Virgo', Libra:'Libra', Scorpio:'Scorpio', Sagittarius:'Sagittarius', Capricorn:'Capricorn', Aquarius:'Aquarius', Pisces:'Pisces'},
  };
  const HOUSE_LOCKS = {
    zh: {1:'第1宫',2:'第2宫',3:'第3宫',4:'第4宫',5:'第5宫',6:'第6宫',7:'第7宫',8:'第8宫',9:'第9宫',10:'第10宫',11:'第11宫',12:'第12宫'},
    en: {1:'1st House',2:'2nd House',3:'3rd House',4:'4th House',5:'5th House',6:'6th House',7:'7th House',8:'8th House',9:'9th House',10:'10th House',11:'11th House',12:'12th House'},
  };
  const SIGN_LOCK = SIGN_LOCKS[lang] || SIGN_LOCKS.zh;
  const HOUSE_LOCK = HOUSE_LOCKS[lang] || HOUSE_LOCKS.zh;
  const MONTH_FMT = lang === 'en'
    ? { yearPrefix: (y, m) => `${monthNamesEN[m - 1]} ${y}`, prefix: (y, m) => `${monthNamesEN[m - 1]} ${y}` }
    : { yearPrefix: (y, m) => `${y}年${m}月`, prefix: (y, m) => `${y}年${m}月` };
  const lockedTitles = astroMatrix && astroMatrix.months
    ? astroMatrix.months.map((m, i) => {
        // 🛠️ V114-fix: Python返回positions.Sun,fallback防止空对象
      const sun = m.sun || (m.positions?.Sun ? {sign: m.positions.Sun.sign, house: m.positions.Sun.house} : {});
        const signName = SIGN_LOCK[sun.sign] || sun.sign || '';
        const houseName = HOUSE_LOCK[sun.house] || `House ${sun.house}`;
        const mi = currentMonth - 1 + i;
        const yearPrefix = (currentYear + (mi >= 12 ? 1 : 0));
        const monthNum = (mi % 12) + 1;
        return `#### ${MONTH_FMT.yearPrefix(yearPrefix, monthNum)}: Sun in ${signName} ${houseName} · __[Fill 4-word theme]__`;
      }).join('\n')
    : '';
  const monthLockTable = astroMatrix && astroMatrix.months
    ? '\n⛔ [12-Month Sun Sign Hard-Lock Table - Month titles MUST use exact values below, strictly forbidden to tamper]:\n' +
      'All month titles【Sun Sign】and【House】MUST strictly follow the table below. Forbidden to use other data to extrapolate monthly Sun sign.\n' +
      astroMatrix.months.map((m, i) => {
        const sun = _sunOf(m);
        const signName = SIGN_LOCK[sun.sign] || sun.sign || '';
        const mi = currentMonth - 1 + i;
        const yearPrefix = (currentYear + (mi >= 12 ? 1 : 0));
        const monthNum = (mi % 12) + 1;
        return `  ● ${MONTH_FMT.yearPrefix(yearPrefix, monthNum)}: Sun in ${signName} · House ${sun.house}`;
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

    const monthlySystem = (MONTHLY_SYSTEM[lang] || MONTHLY_SYSTEM.en) + FORMAT_FIREWALL;

        // ── V137: Per-language user templates (fix: isolate Chinese contamination in EN/ES/FR/TH/VI) ──
    const USER_TEMPLATE = {
      zh: `⛔ [ASTRONOMICAL TRUTH - 唯一数据来源]:
以下天文数据来自 AstroMatrix，请严格遵循，禁止推理：
${planetBlockWithWarning}

🛠️ [P1 全12月行星数据 - 严禁自行计算]:
${monthlyDataBlock}

⛔ [宫位系统一致性]: 禁止写"狮子座是第10宫"——宫位由上升星座决定，严格使用上方数据中的第N宫编号。
⛔ [宫位直写铁律]: 提到行星宫位时，直接写"第N宫"（如"木星在狮子座第2宫带来财富"），严禁使用任何 {{}} 模板占位符或英文 token 标记。后端不再做占位符替换。

⛔ [相角幻觉禁令]: 禁止写"形成和谐互动"、"吉相"、"三分相/四分相/对分相"等相角术语。禁止描述 quincunx(150°处女-白羊)、square(90°处女-双子)为正向能量。统一用中性行星能量描述，如："处女座金星与白羊座土星的错位张力"、"处女座金星与双子座天王星的能量碰撞带来突发变数"。禁止用"意外之财"、"意外收获"描述四分相/梅花相位的相位。
禁止用"同频共振"描述四分相(90°/square)或梅花相(150°/quincunx)——只有三分相(120°/trine)或六分相(60°/sextile)才可用"共振"类词汇。水星/火星/天王星与任何行星的紧张相位禁止用"同频共振"。
几何关系：狮子座与水瓶座正对（180度），摩羯座与水瓶座相邻（30度），相邻星座绝不等同于对冲。

几何关系：狮子座与水瓶座正对（180度），摩羯座与水瓶座相邻（30度），相邻星座绝不等同于对冲。

ASTROGRAPHIC RULES (MUST FOLLOW — DO NOT CONTRADICT):
• MERCURY Rx July 2026: ENTIRE MONTH in 巨蟹座 (Cancer) — Mercury is NEVER in Leo in July 2026 (do NOT write "水星在狮子座逆行"). Retrograde STARTED ~June 29 (before July) and ENDS ~July 23-24 (turns direct). So in July: 7/1–7/23 RETROGRADE, 7/24+ DIRECT, ALL MONTH in Cancer. July 18 is just MID-retrograde — NOT a start, NOT a peak. Correct phrasing: "水星在巨蟹座逆行（7月23日前后恢复顺行）". NEVER write: (1) "水星在狮子座逆行" (wrong sign). (2) "水星于7月X日正式开始逆行" (it started in late June, not July). (3) "7月18日逆行顶点/开始" (false — 7/18 is ordinary mid-retrograde). (4) "水星恢复顺行" before July 23.
• SUN INGRESS Leo: 7月23日太阳正式进入狮子座（这是唯一一次进入，且之后整月都在狮子座）。7月1日-22日太阳在巨蟹座，7月23日-31日太阳在狮子座。绝不能在7月1-22日写"太阳在狮子座"；也绝不能在7月23日之后（尤其是第4周7月25-31日）写"太阳在巨蟹座"——太阳一旦入狮绝不回头。禁止写"7月XX日太阳进入狮子座"（XX不是23）。正确写法：7月1-22日"太阳在巨蟹座"；7月23日之后（含第4周）必须写"太阳在狮子座"。严禁写"7月XX日太阳进入巨蟹座"——太阳在7月23日之后绝不在巨蟹座；如出现"进入巨蟹座"，立即改为"进入狮子座"。
• 禁止使用"同频共振"——一律用"协同互动"或"能量互动"。
• 禁止用"意外之财"描述梅花相/四分相。
• VENUS July 2026: 7/1–7/13 in 狮子座 (Leo); 7/14+ enters 处女座 (Virgo). Venus NEVER goes backwards.
• MARS July 2026: in 双子座 (Gemini) all month.
• SATURN July 2026: in 白羊座 (Aries) — NEVER write Saturn in 射手座/摩羯座. Saturn last in Sagittarius was 2015–2017.
• PLUTO July 2026: in 水瓶座 (Aquarius) all month.
• JUPITER: in Leo all July 2026 — NEVER write Jupiter in Pisces
• MOON July 2026: on 7/31 it is in 水瓶座 (Aquarius). NEVER write "月亮在双子座" for July 31.
• NO NEW MOON on July 1 or July 31 — real new moon is ~July 14
• 第八宫天然守护天蝎座 — 月亮在第8宫时，其星座应与天蝎座/摩羯座/射手座相邻，绝不是双子座。

⛔ [天体相位禁用令]: 严禁使用精确几何度数描述（如"形成四分相/合相/对分相"）。禁止将次六分相(30°)夸大为"突破性"。两个相邻星座(如双子座-巨蟹座)之间不存在强相位。当行星落入某宫时，只描述该宫的财富主题，不描述宫与宫之间的"相位"关系。

⛔ [禁止凭空发明行星位置]: 除本规则明确列出的行星位置外,不得随意编造任何行星在特定日期的星座位置。金星7/1在狮子座,不是处女座。月亮相对于第8宫的位置应基于真实黄道位置而非主观设定。
⛔ [宫位含义一致性]: 行星进入某星座时,其宫位必须严格引用下方[宫位铁律]注入的等宫制完整映射表(按本命上升星座计算)。不同上升星座宫位完全不同,禁止凭星座序号自行推算,禁止套用任何固定映射(如"处女座=第12宫"仅在白羊上升成立,对其他上升星座错误)。

⛔ [水逆日期铁律]: 水星于6月28日左右进入巨蟹座逆行，7月24日恢复顺行。禁止写"7月16日恢复顺行"、"7月18日逆行顶点"、"7月18日达到最慢点"等矛盾句式。正确："水星在巨蟹座逆行（7月24日前后恢复顺行）"。

Generate a ${lang} monthly wealth report for birth date ${birthDate} — natal sun sign: ${natalSunZH} (${natalSunEN}) — rising sign: ${risingLocal} — (${curMonthName} ${currentYear}).
⛔ [V165-vital] 本命太阳星座 = ${natalSunEN}（生日 ${birthDate} 绝对正确,绝不是其他星座）。上升星座 = ${risingLocal}（绝非 Cancer，除非从 AstroMatrix 真实计算得出）。

CRITICAL REQUIREMENTS:
• Total length: 1,200-1,500 words (${lang}) — be rich and dense, no fluff
• Style: Epic, destiny-filled, premium quality
• MUST have 6 sections exactly

OUTPUT FORMAT — CLEAN MARKDOWN (6 sections, no JSON):

${HT_RP.overview}
[Write 1-2 sentences about the overall monthly financial theme, incorporating the planetary lineup and the native's natal chart]

${HT_RP.week1}
[Write 150-200 words: describe the financial energy of week 1, key opportunities, recommended actions, important dates. Be specific and actionable.]

${HT_RP.week2}
[Write 150-200 words: describe high-risk financial days, potential pitfalls, danger zones. Be specific about which days to avoid major financial decisions.]

${HT_RP.week3}
[Write 150-200 words: describe gradual financial growth, opportunities for passive income, strategic preparation. Include specific date references where relevant.]

${HT_RP.week4}
[Write 150-200 words: describe peak financial energy, major money-making opportunities, bonus income, windfall possibilities. Reference specific celestial events driving this energy.]

${HT_RP.trap}
[Write 100-150 words: identify the top financial trap for this month based on the user's birth chart. Provide a concrete "${HT_RP.circuit_tag}" — a specific financial safety rule the user must follow this month. Include a precise dollar amount trigger for when they should STOP and WAIT before spending.]
    \``,
      en: `USER INSTRUCTIONS:
⛔ [V165-vital] THIS USER'S CHART:
  - Natal Sun = ${natalSunEN} (birth date ${birthDate} = ALWAYS ${natalSunEN}, NEVER any other sign)
  - Ascendant = ${risingLocal} (NOT Cancer unless specifically computed by AstroMatrix)
  - Jupiter in ${jupSignLocal} = House ${jupHouse} (NOT House 5, NEVER write House 5 for Jupiter)
  - Saturn in ${satSignLocal} = House ${satHouse} (NOT House 11, NEVER write House 11 for Saturn)
  - Pluto in Aquarius = House ${plHouse} (NOT House 11)
${planetBlockWithWarning}

🛠️ [P1 FULL 12-MONTH PLANET DATA — COPY EXACTLY, NEVER CALCULATE]:
${monthlyDataBlock}

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
[Write 1-2 sentences about the overall monthly financial theme, incorporating the planetary lineup and the native's natal sun sign.]

${HT_RP.week1}
[Write 150-200 words: describe the financial energy of week 1, key opportunities, recommended actions, important dates. Include specific days and dollar amount triggers where relevant.]

${HT_RP.week2}
[Write 150-200 words: describe high-risk financial days, potential pitfalls, danger zones. Be specific about which days are dangerous and why. Include a concrete financial safety rule.]

${HT_RP.week3}
[Write 150-200 words: describe gradual financial growth, opportunities for passive income, strategic preparation. Include days for planning and consolidation.]

${HT_RP.week4}
[Write 150-200 words: describe peak financial energy, major money-making opportunities, bonus income, windfall possibilities. Be bold and specific about peak days.]

${HT_RP.trap}
[Write 100-150 words: identify the top financial trap for this month based on the user's natal chart. Provide a concrete Circuit Breaker Directive with a specific dollar amount trigger for a financial safety rule.]
`,
      es: `INSTRUCCIONES DE USUARIO:
${planetBlockWithWarning}

🛠️ [P1 DATOS PLANETARIOS 12 MESES — COPIAR EXACTO, NUNCA CALCULAR]:
${monthlyDataBlock}

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
${monthlyDataBlock}

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
${monthlyDataBlock}

กฎดาราศาสตร์:
• ตำแหน่งดาวเคราะห์ทั้งหมดมาจาก Swiss Ephemeris — ปฏิบัติตามอย่างเคร่งครัด
• ห้ามใช้ศัพท์มุม (trine/square/sextile) — ใช้คำอธิบายพลังงานแทน
• ดาวพุธวงในในราศีกรกฎ ประมาณ 8-25 กรกฎาคม; ดาวศูกรเข้าราศีกันยา 14 กรกฎาคม; ดวงอาทิตย์เข้าราศีสิงห์ 23 กรกฎาคม
• ดวงจันทร์ไม่เคยวงใน

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
${monthlyDataBlock}

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
      user: USER_TEMPLATE[lang] || USER_TEMPLATE.zh,
    };

    jupHouse = 2;
    if (!satHouse || satHouse === 0) satHouse = 10;
    if (!plHouse || plHouse === 0) plHouse = 8;
    if (!sunHouse || sunHouse === 0) sunHouse = 1;
    if (!moonHouse || moonHouse === 0) moonHouse = 2;

    const DATA_CONSUMPTION_RULE_ZH = `
[数据消费铁律 - 必须遵守]
1. 你的唯一数据来源是后端 JSON 中的 quarterly_forecast。禁止自行计算天文数据。
2. 写作任何月份时,太阳星座和宫位必须100%从 JSON 的 sun_transit.sign 和 sun_transit.house 提取——即使与用户本命星座冲突。
3. active_aspects 中的每个相位必须严格按公式叙述,禁止编造未列出的相位。
4. financial_black_swan 包含精确日期和行动指南——必须原样翻译为叙述性散文。
`;
    const DATA_CONSUMPTION_RULE_EN = `
[Data Consumption Supreme Guideline - MUST OBEY]
1. Your SOLE data source is the quarterly_forecast JSON from the backend. NO astronomical calculation or sign derivation is permitted.
2. When writing any month's forecast, the Sun sign and House MUST be extracted 100% from JSON's sun_transit.sign and sun_transit.house - even if it conflicts with the user's natal sign.
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
        const OLD_HOUSE_RULES = 'ระบบเรือน 12 หลังสําหรับ ASC=ราศีกรกฏ: เรือนที่ 1=กรกฏ, 9=มีน, 10=เมษ, 11=พฤษภ, 12=มิถุน. ดวงอาทิตย์ในราศีมีน = เรือนที่ 9 ไม่ใช่ 1 หรือ 12!';
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
      // 🛠️ V102s: 本命月亮从 SwissEph natal_planets 取真值(报头用),非流月月亮
      const natalMoonEN = astroMatrix.natal_planets?.Moon?.sign || first.moon?.sign || 'Cancer';
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
    const _mZH = natalMoonSign ? ` · 月亮${natalMoonSign}` : '';
    const _mEN = natalMoonSignEN ? ` · Moon ${natalMoonSignEN}` : '';
    const _mES = natalMoonSign ? ` · Luna ${natalMoonSign}` : '';
    const _mFR = natalMoonSign ? ` · Lune ${natalMoonSign}` : '';
    const _mTH = natalMoonSign ? ` · ดวงจันทร์${natalMoonSign}` : '';
    const _mVI = natalMoonSign ? ` · Mặt Trăng ${natalMoonSign}` : '';
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

    return {
      system: yearlySystem,
      user: `
⛔ [天文真值铁律]: 只准使用 AstroMatrix 提供的外行星数据(木星/土星/冥王星/太阳/月亮)。未提供的行星(火星/凯龙/北交点等)不得写具体星座或宫位,只能描述原型特质("行动力强"/"开创精神"),禁止"火星在XX座"或"火星在第X宫"。

⛔ [火星/凯龙禁则]: 绝对禁止在年报正文(除 Black Swan Day 断路器警告外)写"火星在XX座"或"火星在第X宫"。

⛔ [Black Swan Day 火星 Transit 规则]: 火星不在 AstroMatrix 固定外行星列表中,但其 2026-2027 年真实 Transit 位置有明确天文学事实,可以写入。具体规则:
- 2026年7月-8月:火星在狮子座(6月21日离开巨蟹进入狮子,9月23日才进处女)
- 2026年11月30日-12月:火星在处女座(9月23日进处女,2027年1月中旬才离)
- 2027年2月-3月:火星在处女座/天秤座(1月中旬进天秤)
- 2027年5月:火星在狮子座(4月中旬进狮子,6月中旬离)
若 Black Swan Day 涉及火星相位,**必须**按上述真实 Transit 位置写,例如:"(火星在狮子座与XX形成XX相位)"。绝对不得写"火星在处女座"给7月/8月的日子,也不得写"火星在XX座"给任何不在上述窗口的日子。
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
- AI MUST output the five chapter headings explicitly using '第X章' (中文) / 'Chapter X' (英文) format, e.g. '第一章:年度财富矩阵', '第二章:365天月度收入矩阵', '第三章:命运职业路径', '第四章:债务与风险护盾', '第五章:神谕显化仪式'. These headings are REQUIRED - the frontend renders them as gold chapter cards. 绝对禁止写成'第X节'或'Section X'。

Generate a ${lang} ultra-premium yearly wealth almanac for birth date ${birthDate}.

⛔ [CRITICAL - DO NOT COMPUTE SUN SIGN]: The user's Natal Sun Sign has been pre-computed by Swiss Ephemeris and provided in the [HOUSE MAPPING IRON RULE] section above. The per-month data below is TRANSIT data for the 12 forecast months - NOT natal chart data. DO NOT use transit Sun positions to compute or replace the user's natal Sun Sign. If the Sun Sign is explicitly stated above, USE THAT VALUE. In output, include the header 'Bảng Vận Niên: {natalSunSign} · Năm Cách Mạng Mặt Trời' and 'Mã Bản Đồ Sao Chính: Mặt Trời {natalSunSign}' using the exact natalSunSign value, NOT computed from transit data.

[P1.1 SWISSEPH PER-MONTH TRUTH DATA - DO NOT ALTER]:
All planet positions, houses, and aspects below are COMPUTED by Swiss Ephemeris.
Use this data DIRECTLY. Do NOT recalculate, re-assign houses, or invent positions.
${perMonthData || '    [SwissEph data unavailable - use your best astrological judgement]'}
${monthLockTable}


DYNAMIC DATE CALCULATION (CRITICAL):
• Report cycle starts from current month: ${currentYear}年${monthNamesZH[currentMonth-1]}
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
  }

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
// ── /api/create-checkout ──
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { plan, successUrl, cancelUrl } = req.body;
    const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));

    // 🛡️ 映射计划名 → Stripe Price ID
    const priceId = STRIPE_PRICE_MAP[plan] || plan; // 兼容直接传 Price ID 的情况
    if (!STRIPE_PRICE_MAP[plan] && !plan.startsWith('price_')) {
      console.error('[create-checkout] Unknown plan:', plan);
      return res.status(400).json({ error: 'Unknown plan: ' + plan });
    }

    // 🛡️ 根据 plan 决定 mode:单次产品用 payment,订阅用 subscription
    const SUBSCRIPTION_PLANS = new Set(['star_monthly_vip', 'all_pass_yearly']);
    const sessionParams = {
      mode: SUBSCRIPTION_PLANS.has(plan) ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.origin || 'https://kindredsouls.com'}/result?session_id={CHECKOUT_SESSION_ID}&paid=true`,
      cancel_url: cancelUrl || `${req.headers.origin || 'https://kindredsouls.com'}/result?canceled=true`,
    };
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[create-checkout]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/webhook ──
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeSig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));
    const event = stripe.webhooks.constructEvent(req.body, stripeSig, webhookSecret);
    console.log('[webhook] Event:', event.type);
    // Handle events here (same logic as original webhook.js)
    if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.created') {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;
      console.log('[webhook] Payment from:', email, 'plan:', session.metadata?.plan || session.subscription);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[webhook]', err.message);
    res.status(400).json({ error: err.message });
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
    }
  };
}

// ── /api/wealth-oracle ──
app.post('/api/wealth-oracle', async (req, res) => {
  try {
    // 🛠️ V91+: 出生时间/经纬度/时区(默认 Bangkok 中午)
    const {
      birthDate,
      birthTime,  // ⚠️ V176-fix: 禁止默认值！缺省时由 hasBirthTime=false 触发 Solar House 降级
      lat = 13.75,
      lon = 100.5,
      tz = 'Asia/Bangkok',
      lang = 'zh',
    } = req.body;
    // 🛠️ V102s: 是否真提供出生时间(未提供→报头不声称上升)
    const hasBirthTime = typeof req.body.birthTime === 'string' && req.body.birthTime.trim().length > 0;
    if (!birthDate) return res.status(400).json({ success: false, error: 'birthDate required' });

    // ═══ 军师缓存键:wealth:{生日}:{语言}:{类型} ═══
    const reportType = req.body.reportType || 'oracle';
    // 🛠️ V178-P0: 缓存键纳入 birthTime/lat/lon/tz — 同生日不同时辰/地理位置 100% 独立计算, 杜绝跨用户串盘
    const _ckTime = birthTime || '12:00';
    const _ckLat = Number(lat || 13.75).toFixed(4);
    const _ckLon = Number(lon || 100.5).toFixed(4);
    const _ckTz = tz || 'Asia/Bangkok';
    const cacheKey = `wealth:v216e:${birthDate}:${_ckTime}:${_ckLat}:${_ckLon}:${_ckTz}:${lang}:${reportType}`;
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

    // ═══ 第一道拦截:Cache Hit ═══
    if (SB_URL && SB_KEY && reportType !== 'oracle') {
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
          const stdCached = standardizeReport(cachedText);
          // 返回缓存数据(包装成前端期望的格式)
          // 🛠️ V120: 月报返回 markdown 纯文本
          return res.json({ success: true, cached: true, report: stdCached });
        }
      } catch (e) {
        console.warn('[wealth-oracle] Cache check error:', e.message);
      }
    }

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
    };
    // ── 报告生成(月报/年报/先天财富DNA)──
    const { includeInsight } = req.body || {};
    if (reportType === 'monthly' || reportType === 'yearly' || reportType === 'once') {
      // ── V69 SwissEph: Fetch computed astro matrix ──
      let astroMatrix = null;
      // 先天财富DNA不需要astroMatrix(静态本命盘)
      if (reportType !== 'once') {
        try {
          astroMatrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz); // 🛠️ V91: 传精确时间/坐标/时区
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

        // 🛠️ V211: 月报从 4000→12000
        const maxTokens = reportType === 'yearly' ? 48000 : (reportType === 'once' ? 8000 : 12000);
        const ascendant = astroMatrix?.meta?.rising_sign || 'Cancer';
        const realSunSign = sunSign;  // 🛠️ V120-fix4: 补全非流式端点真实太阳星座(供 inline 清洗 + natal_sun_linter 使用)
        const natalSunSign = sunSign;

        // ── V97f: Astro-Logic Validator 断路器(通不过熔断重调,最多3次)──
        let aiResult = null;
        let _lastRaw = null;
        if (reportType === 'yearly') {
          const astroTruth = buildAstroTruth(birthDate, ascendant, lang, new Date().getFullYear(), new Date().getMonth() + 1);
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

        // ── ⛔ 时间线强行熔断重组(防 DeepSeek Streaming 污染)──
        if (reportType === 'yearly') {
          reportContent = cleanYearlyTimeline(monthLocked);
        }

        console.log('[Wealth Oracle] Report generated successfully, length:', aiResult.length);

        // 🛠️ V107-方案A: 预缓存校验器(硬拦截--发现问题就不写缓存,触发重刷)
        let skipCache = false;
        if (reportType === 'yearly') {
          const criticIssues = wealthCriticCheck(reportContent, birthDate, natalSunSign);
          if (criticIssues.length > 0) {
            console.error('[CRITIC] 🚨 缓存前校验发现问题, 跳过缓存写入:', JSON.stringify(criticIssues));
            skipCache = true;
          } else {
            console.log('[CRITIC] 预缓存校验通过 ✅');
          }
        }

        // ═══ 写入缓存(非流式端点)═══
        if (SB_URL && SB_KEY && reportContent && reportContent.length > 100 && !skipCache) {
          try {
            await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache`, {
              method: 'POST',
              headers: {
                'apikey': SB_KEY,
                'Authorization': `Bearer ${SB_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=ignore-duplicates'
              },
              body: JSON.stringify({
                cache_key: cacheKey,
                insight: standardizeReport(reportContent),
                prompt_version: `v1.0.0-${reportType}-${lang}`,
                created_at: new Date().toISOString(),
              })
            });
            console.log(`[wealth-oracle] [WRITE] Cache write: ${cacheKey}, length=${reportContent.length}`);
          } catch (e) {
            console.warn('[wealth-oracle] Cache write error:', e.message);
          }
        }

        return res.json({ ...result, report: reportContent, insight: '' });
      } catch (aiError) {
        console.error('[Wealth Oracle] AI generation failed:', aiError.message);
        return res.status(500).json({ success: false, error: 'AI generation failed: ' + aiError.message });
      }
    }

    res.json(result);
  } catch (err) {
    console.error('[wealth-oracle]', err.message, err.stack);
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
          body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 800, temperature: 0.35 }),
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
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 800, temperature: 0.3 } }),
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
  t = t.replace(/###\s+/g, '\n### ');
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

    lat = 13.75,
    lon = 100.5,
    tz = 'Asia/Bangkok',
    lang = 'zh',
    reportType = 'monthly',
  } = req.body;
  // 🛠️ V102s: 是否真提供出生时间(未提供→报头不声称上升)
  const hasBirthTime = typeof req.body.birthTime === 'string' && req.body.birthTime.trim().length > 0;
  console.log(`[wealth-stream] [STREAM] Stream request: ${birthDate}/${lang}/${reportType}`);

  // 🛠️ V122-fix: SSE 心跳保活--Railway hikari 代理在 AI 首字延迟/生成停顿期会因 idle 掐断长连接 (curl 92 / ERR_HTTP2_PROTOCOL_ERROR);每 8s 发注释事件保活
  const _hb = setInterval(() => {
    try { res.write(': heartbeat\n\n'); if (typeof res.flush === 'function') res.flush(); } catch (e) {}
  }, 8000);
  res.on('close', () => {
    try { clearInterval(_hb); } catch (e) {}
    console.warn('[wealth-stream] ⚠️ 连接关闭:', { destroyed: res.destroyed, writableEnded: res.writableEnded, writableFinished: res.writableFinished });
  });
  res.on('error', (e) => console.error('[wealth-stream] ❌ res error:', e && e.message));


  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-Deploy-Marker', 'V124-keep-alive');
  res.setHeader('Connection', 'keep-alive'); // V121 原生,防 Railway hikari 提前 RST


  // 🔥 军师缓存键 (V178-P0 升级): 纳入 birthTime/lat/lon/tz, 杜绝跨用户串盘
  const _ckTime = birthTime || '12:00';
  const _ckLat = Number(lat || 13.75).toFixed(4);
  const _ckLon = Number(lon || 100.5).toFixed(4);
  const _ckTz = tz || 'Asia/Bangkok';
  const cacheKey = `wealth:v216e:${birthDate}:${_ckTime}:${_ckLat}:${_ckLon}:${_ckTz}:${lang}:${reportType}`;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  // ═══ 第一道拦截:Cache Hit → 伪流式 ═══
  // 🛠️ V185: 占位符替换需要 astroMatrix,提前计算(HIT/MISS 共用)
  let astroMatrix = null;
  try {
    astroMatrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz);
    if (astroMatrix) {
      console.log(`[wealth-stream] [V69] Got matrix: asc=${astroMatrix.meta?.rising_sign}, lat=${lat}, lon=${lon}`);
    }
  } catch (e) {
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
    res.write(Buffer.from(`data: ${JSON.stringify({ meta: metaPayload })}\n\n`, 'utf-8'));
    if (typeof res.flush === 'function') res.flush();
  } catch (e) {
    console.warn('[wealth-stream] [V238-META] build failed:', e.message);
  }

  try {
    if (SB_URL && SB_KEY) {
      const cacheRes = await safeFetch(
        `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=insight&order=created_at.desc&limit=1`,
        { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
      );
      const cacheRows = await cacheRes.json();
      const cachedText = cacheRows?.[0]?.insight;

      // 🛡️ V222z-fix9: 最小长度检查——若缓存文本 <3000字（正常月报应 >5000），说明是历史残缺缓存，强制穿透重新生成
      if (cachedText && cachedText.length > 2000 && cachedText.length > 3000) {
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

        // 🛡️ V274-fix: 替换 V222z-fix8-final 的错误守卫
        // 根因：单份完整月报合法含 ✦[🔮×1，守卫用"✦[🔮≥2"判断多份拼接是错的
        // 正确信号：同一周次重复出现（如"第1周"出现2次 = 两份报告拼接）
        // 6语言周标题正则（含emoji+风险等级+数字）
        const _WK_RE = /\✦\s*\[\S+\s+(?:Semaine\s+\d|Week\s+\d|Semana\s+\d|第\d+周|สัปดาห์ที่\s*\d|Tuần\s+\d)\b/g;
        const _wkHits = [...streamText.matchAll(_WK_RE)].map(m => m[0]);
        const _seen = new Set();
        let _dupCut = 0;
        for (const h of _wkHits) {
          if (_seen.has(h)) { _dupCut = h; break; } // 第一次重复 = 第2份报告开始
          _seen.add(h);
        }
        if (_dupCut) {
          const _idx = streamText.indexOf(_dupCut);
          console.warn(`[V274-fix] HIT缓存双份截断(首次重复: ${_dupCut.trim()}): ${streamText.length}→${_idx} chars`);
          streamText = streamText.substring(0, _idx);
        }

        // 🛡️ V233-fix: 法语/西班牙语清洗
        if (lang === 'fr') { streamText = fixFrenchTypo(fixFrenchSpacing(streamText)); }
        if (lang === 'es') { streamText = fixSpanishSpacing(streamText); }
        // 🛠️ V189: 消费陷阱+括号兜底（共享函数）
        streamText = cleanConsumerTrapAndBrackets(streamText);

        // 🛡️ V222z-fix14: 越南语 DeepSeek 词边界编码缺陷后处理补偿
        if (lang === 'vi') streamText = fixVietnameseCorruption(streamText);

        // 🛠️ P0-fix: 清除所有 \uFFFD 替换字符（UTF-8 多字节被切断后的乱码方块）
        streamText = streamText.replace(/\uFFFD/g, '');

        // V103: 瞬时分块流(Instant Chunking)--放弃单次巨量事件,按 ~2000字切片,骗过 Railway 代理避免截断
        // 前端 sacredText += chunk 累加缓冲区本就支持多事件,完美兼容
        const CHUNK_SIZE = 2000;
        const totalChunks = Math.ceil(streamText.length / CHUNK_SIZE);
        for (let i = 0; i < streamText.length; i += CHUNK_SIZE) {
          const chunk = streamText.slice(i, i + CHUNK_SIZE);
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

  // 🛠️ V222x-fix: stream 端点补声明 _tokMap
  // 5115/5123/5150 引用 _tokMap 但本端点从未声明 → ReferenceError → onChunk 抛错被 callDeepSeekStream 内部 catch 吞掉
  // → fullTextCollector 永不累积 → 方案C补全条件(fullTextCollector.length>100)恒false → sanitized 不推送、缓存不写 → 用户半截流
  // _tokMap 语义为占位符替换({{JUPITER_HOUSE}}→第N宫),stream 端点无此需求 → null 跳过替换,行为不变
  const _tokMap = null;

  // 写缓存辅助函数
  const writeToCache = async (text) => {
    if (!text || text.length < 100 || !SB_URL || !SB_KEY) return;
    try {
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

    // ── V97r: prompt 脏字符清洗(... → ...,防 ByteString 死锁)──
    if (prompt) {
      prompt.system = prompt.system.replace(/[\u2026]/g, '...');

      // 🛠️ V148: 空间锚点Prompt仅限中文,防止泰语等非中文语言输出中文词汇
      if (lang === 'zh') {
        prompt.system += '\n\n【⚠️ 空间财富对齐硬性铁律 -- 严禁幻觉】\n在撰写第五章时,你必须像执行编译器代码一样,毫无保留地严格遵守以下物理空间与占星宫位的固定隐喻,严禁将其替换为任何流年行运宫位:\n1. 卧室区域:必须且只能描述为"第四宫(田宅宫)",代表财富根基与守藏。\n2. 厨房区域:必须且只能描述为"第二宫(财帛宫)与第八宫(共享资源)",代表食禄与滋养之源。\n3. 财务室/保险柜:必须且只能描述为"第八宫(共享资源)",代表核心资产与偏财。\n\n【输出格式控制】:每一个空间的标题行必须严格使用以下加粗纯文本,严禁夹杂任何斜杠或自行脑补的星座(如白羊座/土星等杂质):\n* **卧室区域:第四宫(田宅宫)**\n* **厨房区域:第二宫(财帛宫)与第八宫(共享资源)**\n* **财务室/保险柜:第八宫(共享资源)**';
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
    try { aiTimeout = setTimeout(() => controller.abort(), 600000); } catch(e){}

    // 🛠️ V108-fix2: 年报优先走 Gemini 2.5 Pro(输出上限高),非年报走 DeepSeek(快)
    let usedGemini = false;
    let aiRes = null;
    let aiStream = false;
    let geminiFullText = '';

    // 🛠️ V131-final: 统一走 callDeepSeekStream(native fetch),废弃所有 Gemini/https.request 降级路径
    if (!deepseekKey) {
      clearTimeout(aiTimeout);
      res.write(Buffer.from(`data: ${JSON.stringify({ error: 'AI service unavailable (no key)' })}\n\n`, 'utf-8'));
      return res.end();
    }
    // 🛡️ V219e: 主通道 DeepSeek(deepseek-chat 稳定版,避开退化中的 v4-flash),Gemini 兜底(带30s timeout)
    try {
      // 🛡️ V219g: monthly 分段生成(DeepSeek 长生成退化,拆段各写1部分拼接)
      // 🛠️ V222q: 从4段扩到6段——补 overview(本月命运主题)与消费陷阱,根治两段稳定缺失
      if (reportType === 'monthly') {
        // 🛠️ V222y-fix: 分段指令语言感知化——原硬编码中文标题(第1周/消费陷阱/2026年8月)导致非中文语言报告标题穿帮
        // 标题格式一律让 LLM 从 FORMAT_FIREWALL 系统铁律中读取对应语言模板(该模板已含 zh/en/es/fr/th/vi 六语言周卡片+陷阱卡片示例)
        const _langName = { zh: '中文', en: '英语', es: '西班牙语', fr: '法语', th: '泰语', vi: '越南语' }[lang] || '中文';
        // 🛠️ V222z-fix: 强制输出约束——禁止 LLM 照抄指令自我说明（vi 出现"Tôi hiểu..."即是违反此约束）
        const _noCot = {
          zh: '直接输出内容,不要写"我理解"、"我将"等自我说明,开篇第一个字符必须是✦,不是句子开头。',
          en: 'Output content directly. The first character must be ✦. Never write "I understand", "I will write", or any self-description before the content.',
          es: 'Salida directa. El primer carácter debe ser ✦. Nunca escribir "Entiendo", "Voy a escribir" ni auto-descripción.',
          fr: 'Sortie directe. Le premier caractère doit être ✦. Ne jamais écrire "Je comprends", "Je vais écrire" ni auto-description.',
          th: 'ส่งออกเนื้อหาโดยตรง อักขระตัวแรกต้องเป็น ✦ ไม่เขียน"ฉันเข้าใจ"หรือคำอธิบายตัวเองก่อนเนื้อหา',
          vi: 'Xuất nội dung trực tiếp. Ký tự đầu tiên phải là ✦. Tuyệt đối không viết"Tôi hiểu","Tôi sẽ viết"hay bất kỳ lời tự nhận nào trước nội dung chính.'
        }[lang] || '直接输出内容,不要写自我说明。';
        const _wf = [
          `${_noCot}先写开篇:标题用${_langName}严格遵循系统格式铁律 FORMAT_FIREWALL 中对应语言的命运主题标题格式(🔮 主题语义),用1-2句话概述本月整体财运基调(结合星象与本命盘),写完开篇立即停止,不要写其他部分、不要重复。本部分写完后,必须在最末尾单独输出一行:===END_OF_REPORT=== 并立即停止生成。`,
          `${_noCot}只写第1周:标题用${_langName}严格遵循 FORMAT_FIREWALL 周卡片模板(第1周主题=财富充能/Wealth Recharge 语义,emoji 🟢),写完第1周立即停止,不要写其他周、不要重复。本部分写完后,必须在最末尾单独输出一行:===END_OF_REPORT=== 并立即停止生成。`,
          `${_noCot}只写第2周:标题用${_langName}严格遵循 FORMAT_FIREWALL 周卡片模板(第2周主题=高危熔断/High-Risk Circuit Breaker 语义,emoji 🔴),写完第2周立即停止,不要写其他周、不要重复。本部分写完后,必须在最末尾单独输出一行:===END_OF_REPORT=== 并立即停止生成。`,
          `${_noCot}只写第3周:标题用${_langName}严格遵循 FORMAT_FIREWALL 周卡片模板(第3周主题=顺流蓄力/Flow Accumulation 语义,emoji 🔵),写完第3周立即停止,不要写其他周、不要重复。本部分写完后,必须在最末尾单独输出一行:===END_OF_REPORT=== 并立即停止生成。`,
          `${_noCot}只写第4周:标题用${_langName}严格遵循 FORMAT_FIREWALL 周卡片模板(第4周主题=财富爆发/Wealth Explosion 语义,emoji 🟢),写完第4周立即停止,不要写其他周、不要重复。本部分写完后,必须在最末尾单独输出一行:===END_OF_REPORT=== 并立即停止生成。`,
          `${_noCot}只写消费陷阱:标题用${_langName}严格遵循 FORMAT_FIREWALL 消费陷阱卡片模板(⚠️ + 动态年份月份,语义=消费陷阱/Spending Traps),给出本月最需警惕的财务陷阱与熔断规则,含具体金额触发线,写完立即停止,不要写其他部分、不要重复。本部分写完后,必须在最末尾单独输出一行:===END_OF_REPORT=== 并立即停止生成。`
        ];
        // 🟢 [V286] 统一 Gemini 主路径，DeepSeek 兜底（所有语言）
        console.log('[wealth-stream] V286 lang=' + lang + ' -> Gemini主路径');
        try {
          const _gemFull = await streamGeminiSequential(res, (chunk) => {
            if(_tokMap) for(const [_t,_v] of Object.entries(_tokMap)) chunk=chunk.split(_t).join(_v);
            fullTextCollector += chunk;
          }, lang, prompt.system, prompt.user, astroMatrix);
          geminiFullText = (_gemFull && _gemFull.length >= fullTextCollector.length) ? _gemFull : fullTextCollector;
          console.log('[wealth-stream] V286 Gemini成功，len=' + geminiFullText.length);
        } catch(gemErr) {
          // 🟠 Gemini 崩了，DeepSeek 兜底
          console.error('[wealth-stream] V286 Gemini失败，降级DeepSeek: ' + gemErr.message);
          try {
            const _dsFull = await callDeepSeekStream(prompt.system, prompt.user, controller, res, (chunk) => {
              if(_tokMap) for(const [_t,_v] of Object.entries(_tokMap)) chunk=chunk.split(_t).join(_v);
              fullTextCollector += chunk;
            }, astroMatrix, realSunSign, lang, reportType, false) || '';
            geminiFullText = _dsFull || fullTextCollector;
            console.log('[wealth-stream] V286 DeepSeek兜底成功，len=' + geminiFullText.length);
          } catch(dsErr2) {
            console.error('[wealth-stream] V286 DeepSeek兜底也失败: ' + dsErr2.message);
            geminiFullText = fullTextCollector; // 保留已收集的碎片
          }
        }
        if (geminiFullText && geminiFullText.trim().length > 0) aiStream = true;

      } else {
        geminiFullText = await callDeepSeekStream(prompt.system, prompt.user, controller, res, (chunk) => {
          if(_tokMap) for(const [_t,_v] of Object.entries(_tokMap)) chunk=chunk.split(_t).join(_v);
            fullTextCollector += chunk;
          }, astroMatrix, realSunSign, lang, reportType, false); // V222q: 整段保留最终 sanitized
        if (geminiFullText && geminiFullText.trim().length > 0) aiStream = true;
      }
    } catch(e) {
      console.error('[wealth-stream] [V131] DeepSeek stream FAILED: ' + (e.message || String(e)));
      if (geminiKey) {
        const gCtrl = new AbortController();
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
        } finally { clearTimeout(gTimer); }
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
          .replace(/(\w+)\)(\w+)/g, '$1$2)');
      }
      return text;
    };
    // 🛠️ V131c-fix: 月报原用 geminiFullText(函数返回值)替代 fullTextCollector(onChunk只收flush块,缺最后pending段)
    //    ⚠️ 实测回归: callDeepSeekStream 返回值(geminiFullText)在某些报告被截断(仅 Overview+第1周,约1040字),
    //       而 fullTextCollector(流式累加) 反而是全量(8151字)。两者互为长短,
    //       → 取【较长者】作为月报 sanitized 源,根治"结尾 sanitized 截断到第1/2周"。
    console.log('[V276-DIAG] geminiFullText.len=' + (geminiFullText?.length||0) + ' | fullTextCollector.len=' + (fullTextCollector?.length||0) + ' | 选择:' + ((geminiFullText && geminiFullText.length > (fullTextCollector||'').length) ? 'geminiFullText' : 'fullTextCollector'));
    const _monthlySrc = (geminiFullText && geminiFullText.length > (fullTextCollector || '').length)
      ? geminiFullText
      : (fullTextCollector || '');
    console.log('[V276-DIAG] _monthlySrc.len=' + (_monthlySrc?.length||0));
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
      cleanedText = house_linter(cleanedText, astroMatrix);
      // 🛠️ V256-fix: 月报全量 Overview/陷阱 注入——根因: 原 fixMonthlySectionTitles(true) 误置于 yearly else 分支,
      //   if(reportType==='monthly') 在 yearly 分支内永假→从不执行; 流式逐chunk flush 处 injectPlaceholders=false 须保留(防半截分片斩首单词),
      //   故改在【整段流结束后】此处(全量 cleanedText)以 true 注入, 确保 6 段齐全。hasOverview/hasTrap 检测已升级全语言。
      cleanedText = fixMonthlySectionTitles(cleanedText, true, lang);
    } else {
      cleanedText = natal_sun_linter(astro_phase_linter(final_text_sanitizer(cleanedText, _ascStream, lang)), realSunSign, _ascStream);
      cleanedText = applyMonthLockSanitizer(cleanedText, astroMatrix, null, null, lang);

    // 🛠️ V122-fix: 终极空括号清理(final_text_sanitizer 可能漏 "()" 跨块,
    //   完整文本这里再扣一遍)
    cleanedText = cleanedText.replace(/()/g, '').replace(/\(\)/g, '');
    cleanedText = cleanedText.replace(/([一-龥])()([一-龥])/g, '$1$2');
    cleanedText = cleanedText.replace(/[((][A-Za-z][A-Za-z0-9 ,.'":;\-]{0,40}?[))](?=[一-龥])/g, '');

    // 🛠️ V108-fix8: MISS 流式路径补 standardizeReport(HIT 路径已调用,此处漏掉导致章节 ✦ 注入缺失)
    cleanedText = standardizeReport(cleanedText);
    
    // 🛠️ V222e: 月报格式铁律（主公裁决）——强制统一周标题格式
    if (reportType === 'monthly') {
      cleanedText = fixMonthlySectionTitles(cleanedText, true, lang);
    }

    // 🛠️ V108-fix1: 终极乱码清洗--sanitized 事件前最后一次 FFFD 清扫
    cleanedText = cleanedText.replace(/�/g, '').replace(/�/g, '');
    }

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
            model: 'deepseek-v4-flash',
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

    // 🛡️ V257-fix: 多份报告守卫(原 V222z-fix13d 用 ✦ [🔮 主题头计数截断,误判双份砍光正文,已废弃)。
    //   新逻辑见下方: 仅当【同一周标题重复出现】才截(真·双份报告信号),单份月报绝触发。
    // 单锚设计: 2个 `✦ [🔮` = 第2份报告已生成, 截断到第2个锚点之前.
    // (trap 锚点不参与门禁: 同一份报告内 trap 可多次出现, trap≥2 不是双份的充分条件)
    if (cleanedText && cleanedText.length > 100) {
      // 🛡️ V257-fix: 多份报告检测改为「同一周标题重复出现」(如 Week 1 出现 2 次)= 真·双份报告信号。
      //   不再用 ✦ [🔮 主题头计数——LLM 偶发回显 prompt 模板示例 / V256 兜底注入会产生第2个主题头,
      //   误判双份把正文砍光(本例: 9930→443)。单份月报 4 周各出现 1 次,绝不触发。
      // 🛠️ V271e-fix: anchor 防止 ] 被误当 [ —— 要求 [ 后必须紧跟 🟢🔴🔵⚠️ 或字母/汉字，否则不匹配
      const _WEEK_RE = /\[(?:[🟢🔴🔵⚠️]|Week|第|Semana|Semaine|Tuần|สัปดาห์)\s*(?:(\d+)|([一二三四1-4])|(\d+)|(\d+)|(\d+)|(\d+))/gi;
      const _wkSeen = {};
      let _dupPos = -1;
      let _mw;
      while ((_mw = _WEEK_RE.exec(cleanedText)) !== null) {
        const _w = _mw[1] || _mw[2] || _mw[3] || _mw[4] || _mw[5] || _mw[6];
        if (_wkSeen[_w]) { _dupPos = _mw.index; break; }
        _wkSeen[_w] = true;
      }
      if (_dupPos >= 0) {
        console.warn(`[V257-fix] 多份截断(周标题重复): ${cleanedText.length}→${_dupPos} chars`);
        cleanedText = cleanedText.substring(0, _dupPos);
      }
    }

    if (cleanedText && cleanedText.length > 100) {
      try {
        res.write(Buffer.from(`data: ${JSON.stringify({ sanitized: cleanedText })}\n\n`, 'utf-8'));
      } catch(e) {}
    }

    // 流式结束,发送 [DONE]
    res.write('data: [DONE]\n\n');
    if (typeof res.flush === 'function') res.flush();

    // 🛠️ V125-fix: streaming结束立即写缓存(不依赖completion是否成功) —— 方案C: cleanedText 可能已被补全版覆盖
    // 🛠️ V222z-fix3: 写缓存门槛从100→2000, 与截断检测阈值拉齐, 防止截断碎片(<2000字)毒化缓存
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
    lat = 13.75,
    lon = 100.5,
    tz = 'Asia/Bangkok',
    lang = 'zh',
  } = req.body;
  if (!birthDate) return res.status(400).json({ error: 'birthDate required' });

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
      }

      var mPrompt = v2SysPrompt + '\n\n[V116-V2-M' + (i+1) + ']: 生成' + monthName + '月度章节(800-1200字)。\n\n★ 月份:' + monthName + '\n★ 太阳行运:' + sunSignZH + '座第' + (sun.house || '?') + '宫\n★ 木星行运:' + jupSignZH_m + '座第' + (jupiter.house || '?') + '宫\n★ 土星行运:' + satSignZH_m + '座第' + (saturn.house || '?') + '宫\n★ 冥王行运:' + pluSignZH + '座第' + (pluto.house || '?') + '宫\n' + peakBlock + crisisBlock + factSheet + '\n\n请以[V116-V2-M' + (i+1) + ']标签标注输出本章。';

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
    const v2CacheKey = `wealth:v116-v2:${birthDate}:${birthTime || '12:00'}:${Number(lat || 13.75).toFixed(4)}:${Number(lon || 100.5).toFixed(4)}:${tz || 'Asia/Bangkok'}:${lang}:yearly`;
    if (SB_URL && SB_KEY && allText.length > 500) {
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

      // 手动分块 SSE 推送（模拟流式，每 500 字一块）
      const CHUNK_SIZE = 500;
      for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
        const chunk = fullText.slice(i, i + CHUNK_SIZE);
        onChunk(chunk);
        await new Promise(r => setTimeout(r, 20)); // 20ms 间隔，模拟打字机
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
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10000,
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

  // ── 多语言标题字典 ──
  const _T = {
    theme: { zh:'月度命运主题',en:'Monthly Destiny Theme',es:'Tema del Destino Mensual',fr:'Thème de Destin du Mois',th:'ธีมโชคชะตารายเดือน',vi:'Chủ đề Vận mệnh Tháng' },
    w1t: { zh:'第1周',en:'Week 1',es:'Semana 1',fr:'Semaine 1',th:'สัปดาห์ที่ 1',vi:'Tuần 1' },
    w1s: { zh:'财富充能',en:'Wealth Recharge',es:'Recarga de Riqueza',fr:'Recharge de Richesse',th:'การเติมพลังความมั่งคั่ง',vi:'Nạp năng lượng tài lộc' },
    w2t: { zh:'第2周',en:'Week 2',es:'Semana 2',fr:'Semaine 1',th:'สัปดาห์ที่ 2',vi:'Tuần 2' },
    w2s: { zh:'高危熔断',en:'High-Risk Circuit Breaker',es:'Cortocircuito de Alto Riesgo',fr:'Disjoncteur à Haut Risque',th:'วงจรหยุดความเสี่ยงสูง',vi:'Cầu dao nguy cơ cao' },
    w3t: { zh:'第3周',en:'Week 3',es:'Semana 3',fr:'Semaine 3',th:'สัปดาห์ที่ 3',vi:'Tuần 3' },
    w3s: { zh:'顺流蓄力',en:'Flow Accumulation',es:'Acumulación de Flujo',fr:'Accumulation de Flux',th:'การสะสมพลังตามกระแส',vi:'Tích lũy năng lượng' },
    w4t: { zh:'第4周',en:'Week 4',es:'Semana 4',fr:'Semaine 4',th:'สัปดาห์ที่ 4',vi:'Tuần 4' },
    w4s: { zh:'财富爆发',en:'Wealth Explosion',es:'Explosión de Riqueza',fr:'Explosion de Richesse',th:'ระเบิดความมั่งคั่ง',vi:'Bùng nổ tài lộc' },
    trap:{ zh:'避坑指南',en:'Financial Traps & Risk Mitigation',es:'Trampas Financieras',fr:'Pièges Financiers',th:'กับดักทางการเงิน',vi:'Cạm bẫy Tài chính' },
  };
  const L = (d) => d[lang] || d.zh;
  const _THEME_HDR = L(_T.theme);
  const _T1=L(_T.w1t); const _S1=L(_T.w1s);
  const _T2=L(_T.w2t); const _S2=L(_T.w2s);
  const _T3=L(_T.w3t); const _S3=L(_T.w3s);
  const _T4=L(_T.w4t); const _S4=L(_T.w4s);
  const _TRP=L(_T.trap);

  // 🛡️ V284: 整宫制 IMMUTABLE TRUTH
  const _RISING_IDX = { Aries:0,Taurus:1,Gemini:2,Cancer:3,Leo:4,Virgo:5,Libra:6,Scorpio:7,Sagittarius:8,Capricorn:9,Aquarius:10,Pisces:11 };
  const _rising = (astroMatrix?.meta?.rising_sign) || 'Gemini';
  const _risingIdx = _RISING_IDX[_rising] ?? 2;
  const _SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const _houseSigns = _SIGNS.slice(_risingIdx).concat(_SIGNS.slice(0,_risingIdx));
  const _houseNames=['命宫(自我)','财帛(资源)','兄弟(沟通/契约)','田宅(家庭)','子女(创意/恋爱)','奴仆(健康/工作)','夫妻(合作/婚姻)','疾厄(偏财/蜕变)','迁移(远方/学问)','官禄(事业)','福德(社交/希望)','相貌(隐秘/潜意识)'];
  const _astroLock = '[CRITICAL ASTROLOGICAL DATA — IMMUTABLE TRUTH]\n' +
    'Ascendant/Rising Sign: ' + _rising + ' (Whole Sign 整宫制)\n\n[HOUSE MAPPING TABLE]\n' +
    _houseSigns.map((s,i)=>'- House '+(i+1)+' ('+_houseNames[i]+'): '+s).join('\n')+'\n\n' +
    '[STRICT RULES]\n1. Use ONLY ' + _rising + ' as Rising Sign.\n' +
    '2. Planet House placement MUST match the TABLE above.\n' +
    '3. ABSOLUTELY FORBIDDEN: 自行推算上升星座、编造宫位。';

  // 3 段定义（锚点强化版）
  const _segments = [
    {
      id: 1,
      sections: `【必写章节 EXACTLY 2 个】
✦ [🔮 ${_THEME_HDR}]
✦ [🟢 ${_T1}（${_S1}）]`,
      instruction: `严格按上述【必写章节】列表，依次生成每一章的内容。
只写这 2 个章节，不要多、不要少、不要换顺序、不要重复任何章节。
写完最后一个章节的内容后立即停止，不要写任何额外文字。
严格使用 [背景信息] 中的本命盘数据，不自行推演星座/宫位。`
    },
    {
      id: 2,
      sections: `【必写章节 EXACTLY 2 个】
✦ [🔴 ${_T2}（${_S2}）]
✦ [🔵 ${_T3}（${_S3}）]`,
      instruction: `严格按上述【必写章节】列表，依次生成每一章的内容。
只写这 2 个章节，不要多、不要少、不要换顺序、不要重复任何章节。
写完最后一个章节的内容后立即停止，不要写任何额外文字。
严格使用 [背景信息] 中的本命盘数据，不自行推演星座/宫位。`
    },
    {
      id: 3,
      sections: `【必写章节 EXACTLY 2 个】
✦ [🟢 ${_T4}（${_S4}）]
✦ [⚠️ ${_TRP}]`,
      instruction: `严格按上述【必写章节】列表，依次生成每一章的内容。
只写这 2 个章节，不要多、不要少、不要换顺序、不要重复任何章节。
写完最后一个章节的内容后立即停止，不要写任何额外文字。
严格使用 [背景信息] 中的本命盘数据，不自行推演星座/宫位。`
    }
  ];

  const MODEL = 'gemini-3.5-flash';
  let fullText = '';
  // V288 治本: 对话历史链——每段生成后作为 assistant 回复加入 history
  const _history = [];

  for (let segIdx = 0; segIdx < _segments.length; segIdx++) {
    const seg = _segments[segIdx];
    // V288: 构建已生成章节的锚点上下文（后续段知道前面写了什么）
    const _doneCtx = (_history.length > 0)
      ? '\n\n[已生成章节（仅供参照，不要重复任何内容）]\n' +
        _history.map((h,i) => '[章节'+(i+1)+']\n'+h).join('\n') + '\n\n'
      : '';

    const segPrompt = _astroLock + '\n\n' + promptSystem + '\n\n[背景信息]\n' + promptUser + '\n\n' +
      _doneCtx +
      '[必写章节]\n' + seg.sections + '\n\n' +
      '[生成指令]\n' + seg.instruction;

    let segText = '';
    let attempt = 0;

    while (attempt < 2) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 180000);

        // V288: contents 包含对话历史，第1段空，后续段含前段 assistant 回复
        const requestBody = {
          contents: _history.length === 0
            ? [{ parts: [{ text: segPrompt }] }]
            : [
                ..._history.map(h => ({ role: 'model', parts: [{ text: h }] })),
                { role: 'user', parts: [{ text: segPrompt }] }
              ],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.3 }
        };

        console.log('[V288] Gemini 段' + seg.id + '/3，history 长度=' + _history.length);
        const response = await safeFetch(
          'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + geminiKey,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: new TextEncoder().encode(JSON.stringify(requestBody)),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);
        if (!response.ok) throw new Error('Gemini HTTP ' + response.status);

        const data = await response.json();
        segText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // 🛡️ V277-fix: 清理嵌套括号
        segText = segText.replace(/\[{2,}/g, '[').replace(/\]{2,}/g, ']');
        console.log('[V288] 段' + seg.id + ' len=' + segText.length + ' preview=' + JSON.stringify(segText.slice(0,80)));
        break;
      } catch(err) {
        console.warn('[V288] 段' + seg.id + ' attempt ' + attempt + ' 失败: ' + err.message);
        if (attempt >= 2) throw new Error('Gemini 段' + seg.id + ' 连续失败: ' + err.message);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    // 写入对话历史（后续段可参考）
    if (segText) _history.push(segText);

    // 每段结果流式推给前端（按 Unicode 字符边界截断）
    const _send = (text) => {
      const line = 'data: ' + JSON.stringify({ text }) + '\n\n';
      try { res.write(line, 'utf-8'); if (typeof res.flush === 'function') res.flush(); } catch(e) {}
    };
    const CHUNK = 400;
    for (let i = 0; i < segText.length; i += CHUNK) {
      const slice = segText.slice(i, i + CHUNK);
      _send(slice);
      onChunk(slice);
      fullText += slice;
      await new Promise(r => setTimeout(r, 25));
    }
  }

  return fullText;
}


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
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: testPrompt }], max_tokens: 512, temperature: 0.7 }),
      });
      const d = await r.json();
      results.deepseek = { ok: r.ok, latency_ms: Date.now() - start, status: r.status, text: d.choices?.[0]?.message?.content || d.error?.message, chars: (d.choices?.[0]?.message?.content || '').length };
    } catch(e) { results.deepseek = { ok: false, latency_ms: Date.now() - start, error: e.message }; }
  } else { results.deepseek = { ok: false, error: 'DEEPSEEK_API_KEY not set' }; }

  res.json({ results, env_diag: envDiag, prompt_length: testPrompt.length });
});
// V223-verify-1785660410
// V223c-1785660969

