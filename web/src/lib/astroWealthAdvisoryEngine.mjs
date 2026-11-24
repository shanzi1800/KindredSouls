/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E139-ASTRO-WEALTH-ADVISORY-ENGINE 刀一（主公军令 2026-11-15）：
 * 星盘财商智库与破财避坑引擎（人生五阶 × 四维处方）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：将六册经典私人银行财商教育手册的方法论目录（八步筑底法＋五段
 * 生命周期＋十大资产类别光谱＋信用 5 心法与财务比率＋三明治 CUT 法则与
 * 四大失落护盾＋退休四大惊雷＋遗嘱信托精神遗嘱传承）与用户本命星盘
 * （2 宫财库 / 5·8 宫投机杠杆 / 8 宫借贷 / 四元素众数）深度咬合，锻造
 * 「星盘财商智库与破财避坑引擎」：
 *   · 输入：birthData（出生年真值）＋ chartSummary（本命元素众数）＋
 *     age（显式年龄优先）＋ locale ＋ queryText；
 *   · 输出：人生五阶自动定位（20-30 起步 / 30-45 筑基三明治 / 45-60 巩固 /
 *     60-69 收官 / 70+ 黄金传承；无出生年 ⇒ 默认 30-45 筑基三明治期）＋
 *     四维处方（cashflow_stage 财库筑底 / asset_spectrum 十维配置 /
 *     credit_leverage 杠杆金律 / cut_and_legacy 破局传承）；
 *   · 16 套严选模板＝cashflow 5 阶＋asset 5 元素＋credit 1 通用＋cut 5 阶；
 *     balanced 兜底＝土枢（均衡铺开，核心-卫星）。
 * 🔴 铁律沿袭：零网络零外部服务零 LLM（纯函数静态资产）；零第三方银行
 *   品牌词、零具体股票代码、零货币符号、零促销词（定性「星盘周期与财商
 *   教育」不构成持牌投顾建议）；六语处方文案内嵌单源（仿 E137 引擎先例
 *   ——i18n 仅 7 键承载卡片标签与免责声明）；fail-closed——坏形状一律
 *   回退兜底绝不崩溃。
 * 消费方：server.js（familiar/chat 触发检测＋prompt 块注入＋SSE meta 帧）
 * ＋ WealthAdvisorySlotCard（对话舱处方卡）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 官方六语（Soul OS 语言底座——与 WELLNESS_RX_LOCALES 同源） */
export const WEALTH_RX_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** 人生五阶白名单（军令钦定序——20-30/30-45/45-60/60-69/70+） */
export const WEALTH_LIFE_STAGES = Object.freeze([
  'starting_out', 'sandwich_building', 'consolidating', 'winding_down', 'golden_legacy',
]);

/** 四维处方白名单（军令钦定序） */
export const WEALTH_PILLARS = Object.freeze([
  'cashflow_stage', 'asset_spectrum', 'credit_leverage', 'cut_and_legacy',
]);

/** 五元素白名单（含 balanced 兜底象限——与 E137 WELLNESS_ELEMENTS 同形） */
export const WEALTH_ELEMENTS = Object.freeze(['fire', 'earth', 'air', 'water', 'balanced']);

/** chatQ1 六语钦定文本（军令触发锚——与 locales/*.json familiar.chatQ1 逐字同源） */
export const WEALTH_CHATQ1_TEXTS = Object.freeze([
  '💰 今日财富节奏校准',
  "💰 Today's Wealth Rhythm",
  '💰 Rythme financier du jour',
  '💰 Ritmo de abundancia de hoy',
  '💰 ปรับจังหวะการเงินวันนี้',
  '💰 Hiệu Chỉnh Nhịp Tài Lộc Hôm Nay',
]);

/** 财富语义关键词（六语白名单——军令钦定词族＋常见衍生） */
const WEALTH_SEMANTIC_KEYS = Object.freeze([
  // zh
  '财运', '破财', '漏财', '破财避坑', '投资', '理财', '财务', '股票', '基金', '存款', '储蓄', '省钱', '消费',
  '买房', '置业', '房贷', '贷款', '借贷', '负债', '信用卡', '创业', '副业', '养老', '退休', '遗产',
  '信托', '传承', '资产', '配置', '现金流', '应急金', '保险', '分红', '债券', '税务', '避税', '财富自由',
  // en
  'wealth', 'money', 'finance', 'financial', 'invest', 'investment', 'investing', 'saving', 'savings',
  'budget', 'debt', 'loan', 'mortgage', 'credit', 'credit card', 'retirement', 'pension', 'legacy',
  'estate', 'trust', 'portfolio', 'asset', 'allocation', 'cash flow', 'emergency fund', 'insurance',
  'stock', 'bond', 'equity', 'real estate', 'tax', 'charity', 'compound interest', 'net worth',
  // fr
  'richesse', 'argent', 'épargne', 'budget', 'dette', 'prêt', 'crédit', 'hypothèque', 'retraite',
  'héritage', 'patrimoine', 'portefeuille', 'fonds', 'financier', 'investir', 'fiscal', 'assurance',
  // es
  'riqueza', 'dinero', 'finanz', 'ahorro', 'presupuesto', 'deuda', 'préstamo', 'crédito', 'hipoteca',
  'jubilación', 'herencia', 'patrimonio', 'cartera', 'inversión', 'invertir', 'fondo', 'impuesto',
  // th
  'การเงิน', 'การลงทุน', 'เงินออม', 'ออมเงิน', 'ออมทรัพย์', 'หุ้น', 'กองทุน', 'กู้', 'หนี้', 'บัตรเครดิต',
  'ซื้อบ้าน', 'บ้าน', 'เกษียณ', 'เกษียณก่อนกำหนด', 'มรดก', 'สินทรัพย์', 'ความมั่งคั่ง', 'เงินเดือน', 'ภาษี', 'ประกัน',
  // vi
  'tài chính', 'tiền', 'đầu tư', 'tiết kiệm', 'nợ', 'vay', 'tín dụng', 'mua nhà', 'nhà cửa', 'hưu',
  'nghỉ hưu', 'di sản', 'thừa kế', 'chứng khoán', 'quỹ', 'tài sản', 'sự nghiệp', 'kinh doanh', 'thuế', 'bảo hiểm',
]);

/**
 * 财富意图触发检测（纯函数——末条 user message 文本）：
 * chatQ1 六语钦定文本精确命中 ＞ 财富语义关键词子串命中 ＞ false fail-closed。
 */
export function detectWealthIntent(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  const s = text.trim();
  for (const q of WEALTH_CHATQ1_TEXTS) {
    if (s.includes(q) || q.includes(s)) return true;
  }
  const lower = s.toLowerCase();
  for (const k of WEALTH_SEMANTIC_KEYS) {
    const kk = k.trim().toLowerCase();
    if (kk && lower.includes(kk)) return true;
  }
  return false;
}

/* ═══════════════ 人生五阶名（六语——军令钦定阶段章） ═══════════════ */

const WEALTH_STAGE_NAMES = Object.freeze({
  starting_out: Object.freeze({
    zh: '起步期 · 20-30', en: 'Starting Out · 20-30', fr: 'Départ · 20-30 ans',
    es: 'Arrancando · 20-30', th: 'วัยเริ่มต้น · 20-30', vi: 'Giai đoạn khởi nghiệp · 20-30',
  }),
  sandwich_building: Object.freeze({
    zh: '筑基与三明治期 · 30-45', en: 'Building & Sandwich Years · 30-45', fr: 'Construction & Génération Sandwich · 30-45',
    es: 'Construcción y Años Sándwich · 30-45', th: 'วัยวางรากฐานและวัยแซนด์วิช · 30-45', vi: 'Giai đoạn xây nền và kẹp giữa · 30-45',
  }),
  consolidating: Object.freeze({
    zh: '巩固期 · 45-60', en: 'Consolidating · 45-60', fr: 'Consolidation · 45-60 ans',
    es: 'Consolidación · 45-60', th: 'วัยมั่นคง · 45-60', vi: 'Giai đoạn củng cố · 45-60',
  }),
  winding_down: Object.freeze({
    zh: '收官期 · 60-69', en: 'Winding Down · 60-69', fr: 'Ralentissement · 60-69 ans',
    es: 'Desaceleración · 60-69', th: 'วัยเก็บเกี่ยว · 60-69', vi: 'Giai đoạn thu hoạch · 60-69',
  }),
  golden_legacy: Object.freeze({
    zh: '黄金传承期 · 70+', en: 'Golden Legacy · 70+', fr: 'Héritage Doré · 70+',
    es: 'Legado Dorado · 70+', th: 'วัยทองแห่งมรดก · 70+', vi: 'Thời kỳ hoàng kim truyền lại · 70+',
  }),
});

/** 未知语回退（沿 E137 _rxLang 先例——绝不崩溃） */
function _wxLang(lang) {
  const s = String(lang || '').trim().toLowerCase();
  return WEALTH_RX_LOCALES.includes(s) ? s : 'en';
}

/* ═══════════════ 维度 A · cashflow_stage 财库筑底（第 2 宫×五阶；六语） ═══════════════ */

const RX_CASHFLOW = Object.freeze({
  starting_out: Object.freeze({
    zh: '第 2 宫财库起步如春播：先记账立预算，每月强制储蓄一成到两成雷打不动；应急金从一个月生活费攒起，信用白纸期首戒消费贷与分期陷阱。',
    en: 'Your 2nd-house vault starts like spring sowing: track spending and set a budget first, sweep 10-20% into savings every month without exception; build the emergency fund from one month of living costs, and on a blank credit record the first rule is avoiding consumer loans and installment traps.',
    fr: 'Le coffre de votre 2e maison débute comme un semis de printemps : tenez vos comptes, fixez un budget, et versez 10 à 20 % en épargne chaque mois sans exception ; dotez le fonds d’urgence d’un mois de frais, et sur un dossier de crédit vierge, la première règle est d’éviter crédits à la consommation et pièges des paiements échelonnés.',
    es: 'La bóveda de tu 2ª casa empieza como una siembra de primavera: registra tus gastos y fija un presupuesto, aparta del 10 al 20 % en ahorro cada mes sin excepción; construye el fondo de emergencia desde un mes de gastos, y con un historial crediticio en blanco, la primera regla es evitar préstamos de consumo y trampas de cuotas.',
    th: 'คลังทรัพย์จากบ้านที่ 2 เริ่มต้นดั่งการหว่านเมล็ดพันธุ์ฤดูใบไม้ผลิ จดบันทึกรายรับรายจ่ายและวางงบประมาณก่อน เก็บออม 10-20% ทุกเดือนโดยไม่มีข้อยกเว้น ตั้งกองทุนสำรองฉุกเฉินจากค่าใช้จ่ายหนึ่งเดือน และในวัยที่ประวัติเครดิตยังเป็นกระดาษขาว กฎข้อแรกคือเลี่ยงเงินกู้เพื่อการบริโภคและกับดักการผ่อนเป็นงวด',
    vi: 'Kho tài cung 2 khởi đầu như gieo mầm mùa xuân: ghi chép chi tiêu và lập ngân sách trước, gồng 10-20% vào tiết kiệm mỗi tháng không ngoại lệ; quỹ khẩn cấp bắt đầu từ một tháng sinh hoạt phí, và khi hồ sơ tín dụng còn trang trắng, luật đầu tiên là tránh vay tiêu dùng và bẫy trả góp.',
  }),
  sandwich_building: Object.freeze({
    zh: '三明治期第 2 宫讲分渠：日常、应急、远期三条账户互不挪用，应急金补足三到六个月家庭开销；伴侣财务每月同频对账——上奉下养之间，先守住现金流不出暗漏。',
    en: 'In the sandwich years the 2nd house runs on separate channels: daily, emergency, and long-term accounts never borrow from each other, with the emergency fund topped up to 3-6 months of family outgoings; sync finances with your partner monthly — between parents above and children below, the first duty is keeping cash flow leak-free.',
    fr: 'Dans les années sandwich, la 2e maison vit en canaux séparés : comptes du quotidien, d’urgence et de long terme ne se touchent jamais, le fonds d’urgence couvrant 3 à 6 mois de dépenses du foyer ; mettez vos finances en phase avec votre partenaire chaque mois — entre parents au-dessus et enfants en dessous, le premier devoir est de garder une trésorerie sans fuite.',
    es: 'En los años sándwich, la 2ª casa funciona por canales separados: las cuentas diaria, de emergencia y de largo plazo nunca se prestan entre sí, con el fondo de emergencia cubriendo 3 a 6 meses de gastos familiares; sincroniza las finanzas con tu pareja cada mes — entre padres e hijos, el primer deber es mantener el flujo de caja sin fugas.',
    th: 'ในวัยแซนด์วิช บ้านที่ 2 ต้องแยกช่องทาง: บัญชีใช้จ่ายประจำวัน กองทุนฉุกเฉิน และบัญชีระยะยาวไม่มีการยืมโอนข้ามกัน กองทุนฉุกเฉินต้องถึงระดับ 3-6 เดือนของค่าใช้จ่ายครอบครัว และคุยตรวจสอบการเงินกับคู่ชีวิตทุกเดือน — ท่ามกลางการดูแลทั้งผู้ใหญ่และลูก หน้าที่แรกคือรักษากระแสเงินสดให้รั่วไหลเป็นศูนย์',
    vi: 'Tuổi kẹp giữa, cung 2 vận hành theo kênh tách bạch: tài khoản chi tiêu hằng ngày, quỹ khẩn cấp và dài hạn không vay mượn lẫn nhau, quỹ khẩn cấp đủ 3-6 tháng chi phí gia đình; đối chiếu tài chính với bạn đời mỗi tháng — giữa cha mẹ trên và con dưới, nhiệm vụ đầu tiên là giữ dòng tiền không rò rỉ.',
  }),
  consolidating: Object.freeze({
    zh: '巩固期第 2 宫转精密：现金流从「赚多少」转向「留住多少」，锁定养老资金缺口并倒排补差计划；所得税、房产税、遗产税三税统筹前置排程，让每一分流入都先过税网再落袋。',
    en: 'In the consolidating years the 2nd house turns precise: cash flow shifts from “how much you earn” to “how much you keep” — lock the retirement funding gap and plan the top-up backwards; schedule income, property, and estate tax coordination up front, so every inflow passes the tax net before it lands.',
    fr: 'Pendant la consolidation, la 2e maison devient précise : le flux passe de « combien vous gagnez » à « combien vous conservez » — verrouillez le déficit de retraite et planifiez le complément à rebours ; anticipez la coordination des impôts sur le revenu, foncier et successoral, pour que chaque entrée franchisse le filet fiscal avant d’être engrangée.',
    es: 'En la consolidación, la 2ª casa se vuelve precisa: el flujo pasa de «cuánto ganas» a «cuánto conservas» — fija el déficit de jubilación y planifica la reposición al revés; programa por adelantado la coordinación de impuestos sobre la renta, patrimonial y sucesorio, para que cada entrada cruce la red fiscal antes de aterrizar.',
    th: 'ในวัยมั่นคง บ้านที่ 2 ต้องแม่นยำยิ่งขึ้น: กระแสเงินสดเปลี่ยนจาก «หาได้เท่าไร» เป็น «รักษาไว้ได้เท่าไร» ล็อกช่องว่างเงินบำนาญและวางแผนเติมชดเชยแบบย้อนกลับ จัดตารางภาษีสามชั้น (ภาษีเงินได้ ภาษีที่ดินและสิ่งปลูกสร้าง ภาษีมรดก) ล่วงหน้า ให้ทุกบาทที่ไหลเข้าผ่านแหล่งภาษีก่อนตกกระเป๋า',
    vi: 'Giai đoạn củng cố, cung 2 chuyển sang chính xác: dòng tiền chuyển từ «kiếm được bao nhiêu» sang «giữ được bao nhiêu» — khóa khoảng hụt hưu trí và lập kế hoạch bù đắp ngược dòng; xếp trước lịch phối hợp ba sắc thuế (thu nhập, bất động sản, di sản) để mỗi dòng vào đều qua lưới thuế trước khi bỏ túi.',
  }),
  winding_down: Object.freeze({
    zh: '收官期第 2 宫转守：现金流以保底为纲——债券与年金比例上调，医疗预备金单列成格；跨城旅居成本比价量入为出，提取顺序先动税轻的格子，护住本金的最后一段坡道。',
    en: 'In the winding-down years the 2nd house turns defensive: cash flow is anchored on floor-building — tilt the mix toward bonds and annuities, and carve out a dedicated medical reserve; compare cross-city living costs and live within them, withdraw from the lighter-taxed buckets first, and guard the final slope of your capital.',
    fr: 'Pendant le ralentissement, la 2e maison se fait défensive : la trésorerie s’ancre sur la sécurité — augmentez la part des obligations et des rentes, et réservez un compartiment dédié aux soins de santé ; comparez les coûts de vie entre villes et ajustez-vous, retirez d’abord des compartiments moins fiscalisés, et protégez la dernière pente de votre capital.',
    es: 'En la desaceleración, la 2ª casa se vuelve defensiva: el flujo se ancla en asegurar el suelo — sube la proporción de bonos y rentas, y aparta un compartimento exclusivo para cuidados médicos; compara costos de vida entre ciudades y ajústate, retira primero de los compartimentos menos gravados, y protege la última pendiente de tu capital.',
    th: 'ในวัยเก็บเกี่ยว บ้านที่ 2 เปลี่ยนเป็นรับ: กระแสเงินสดยึดหลักรักษาพื้นฐาน — เพิ่มสัดส่วนพันธบัตรและบำนาญ แยกกองสำรองค่ารักษาพยาบาลเป็นช่องของตัวเอง เทียบราคาค่าครองชีพระหว่างเมืองและใช้ตามกำลัง ถอนจากช่องที่ภาษีเบาก่อน และพิทักษ์ทางลากสุดท้ายของทุน',
    vi: 'Giai đoạn thu hoạch, cung 2 chuyển sang thủ: dòng tiền lấy bảo toàn làm cương — nâng tỷ lệ trái phiếu và lương hưu, tách riêng quỹ y tế dự phòng; so giá sinh hoạt liên thành phố và chi theo khả năng, rút khỏi ô thuế nhẹ trước, giữ trọn đoạn dốc cuối cùng của vốn.',
  }),
  golden_legacy: Object.freeze({
    zh: '传承期第 2 宫守成：支出以「不给后人留债」为底线，大额动用先过授权书与信托条款核验；慈善支出纳入年度预算——财库的最后一程，是把自己活成一笔干净的礼物。',
    en: 'In the legacy years the 2nd house preserves: spending holds the line of “leaving no debts behind” — any large outlay first clears the power-of-attorney and trust clauses; charity enters the annual budget — the vault’s final journey is becoming a clean gift yourself.',
    fr: 'Aux années d’héritage, la 2e maison préserve : la dépense tient la ligne « ne laisser aucune dette derrière soi » — toute sortie importante passe d’abord par les clauses de mandat et de trust ; la charité entre dans le budget annuel — le dernier voyage du coffre est de devenir soi-même un don propre.',
    es: 'En los años de legado, la 2ª casa preserva: el gasto sostiene la línea de «no dejar deudas detrás» — toda salida grande pasa primero por las cláusulas del poder notarial y del fideicomiso; la caridad entra en el presupuesto anual — el último viaje de la bóveda es convertirse uno mismo en un regalo limpio.',
    th: 'ในวัยมรดก บ้านที่ 2 รักษาทรัพย์: การใช้จ่ายยึดเส้นแบ่ง «ไม่ทิ้งหนี้ให้คนรุ่นหลัง» รายจ่ายก้อนใหญ่ต้องผ่านการตรวจสอบตามข้อกำหนดหนังสือมอบอำนาจและทรัสต์ก่อน บรรจุการกุศลไว้ในงบประมาณประจำปี — บทสุดท้ายของคลังทรัพย์คือการทำตัวเองให้เป็นของขวัญที่สะอาด',
    vi: 'Thời kỳ truyền lại, cung 2 giữ thành: chi tiêu giữ vạch đáy «không để nợ lại cho đời sau» — mọi khoản lớn phải qua kiểm tra điều khoản ủy quyền và quỹ tín thác trước; từ thiện vào ngân sách năm — chặng cuối của kho tài là tự mình trở thành một món quà thanh sạch.',
  }),
});

/* ═══════════════ 维度 B · asset_spectrum 十维配置（本命元素×六语） ═══════════════ */

const RX_ASSET = Object.freeze({
  fire: Object.freeze({
    zh: '火象进取光谱：权益与成长类资产可顶到进取端上限，但每一格仓位都装止损闸与再平衡日历；投机性敞口设硬顶——让火焰推动财库，而不是吞噬它。',
    en: 'Fire spectrum, offensive tilt: equities and growth assets may reach the aggressive cap, yet every bucket carries a stop-loss gate and a rebalancing calendar; speculative exposure gets a hard ceiling — let the flame drive the vault, never consume it.',
    fr: 'Spectre de Feu, inclinaison offensive : actions et actifs de croissance peuvent atteindre le plafond offensif, mais chaque compartiment porte un seuil de coupe et un calendrier de rééquilibrage ; l’exposition spéculative plafonnée durement — que la flamme pousse le coffre, jamais ne le dévore.',
    es: 'Espectro de Fuego, sesgo ofensivo: acciones y activos de crecimiento pueden llegar al tope agresivo, pero cada compartimento lleva una compuerta de stop y un calendario de rebalanceo; la exposición especulativa con techo duro — que la llama impulse la bóveda, jamás la devore.',
    th: 'สเปกตรัมธาตุไฟ โน้มเอียงรุก: หุ้นและสินทรัพย์เติบโตไปได้ถึงเพดานฝั่งบุก แต่ทุกช่องต้องมีจุดตัดขาดทุนและปฏิทินปรับสมดุล ส่วนการเก็งกำไรมีเพดานแข็ง — ให้เปลวไฟขับเคลื่อนคลังทรัพย์ ไม่ใช่เผาผลาญมัน',
    vi: 'Phổ nguyên tố Hỏa, thiên công: cổ phiếu và tài sản tăng trưởng có thể chạm trần khu vực tấn công, nhưng mỗi ô đều có chốt cắt lỗ và lịch tái cân bằng; phần đầu cơ đặt trần cứng — để ngọn lửa đẩy kho tài đi, chứ không nuốt chửng nó.',
  }),
  earth: Object.freeze({
    zh: '土象稳健光谱：不动产与固收打底，年金与品质生活资产作慢变量之锚；收益来自耐心复利，仓位调整以年为尺——大地不追风，只把每一步踩实。',
    en: 'Earth spectrum, steady tilt: property and fixed income lay the base, annuities and quality-of-life assets serve as slow anchors; returns come from patient compounding, positions are tuned with the year as ruler — earth chases no wind, it only plants each step firm.',
    fr: 'Spectre de Terre, inclinaison stable : immobilier et revenus fixes posent la base, rentes et actifs de qualité de vie servent d’ancres lentes ; le rendement naît de la composition patiente, les positions s’accordent à l’année pour règle — la terre ne court après aucun vent, elle ancre chaque pas.',
    es: 'Espectro de Tierra, sesgo estable: inmuebles y renta fija forman la base, rentas y activos de calidad de vida anclan despacio; el retorno nace del interés compuesto paciente, las posiciones se ajustan con el año por regla — la tierra no persigue vientos, solo afirma cada paso.',
    th: 'สเปกตรัมธาตุดิน โน้มเอียงมั่นคง: อสังหาริมทรัพย์และรายได้ประจำวางฐาน บำนาญและสินทรัพย์คุณภาพชีวิตเป็นสมอยึดช้า ผลตอบแทนมาจากดอกเบี้ยทบต้นแบบอดทน ปรับพอร์ตโดยใช้ปีเป็นไม้บรรทัด — ดินไม่วิ่งตามลม แค่ย่างก้าวให้มั่นทุกก้าว',
    vi: 'Phổ nguyên tố Thổ, thiên ổn: bất động sản và thu nhập cố định làm nền, lương hưu và tài sản chất lượng cuộc sống làm neo chậm; lợi nhuận đến từ lãi kép kiên nhẫn, điều chỉnh vị trí lấy năm làm thước — đất không đuổi theo gió, chỉ bước từng bước cho chắc.',
  }),
  air: Object.freeze({
    zh: '风象灵动光谱：十维分散、流动性优先，动态再平衡灵敏；警惕资讯过载催生的频繁交易——让翅膀带你去更高的视野，而不是更密的焦虑。',
    en: 'Air spectrum, agile tilt: ten classes spread wide, liquidity first, rebalancing nimble; beware of overtrading born from information overload — let the wings lift you to a wider view, not a denser anxiety.',
    fr: 'Spectre d’Air, inclinaison agile : dix classes dispersées, liquidité d’abord, rééquilibrage vif ; méfiez-vous du surtrading né de la surcharge d’informations — que les ailes vous élèvent vers une vue plus large, non vers une anxiété plus dense.',
    es: 'Espectro de Aire, sesgo ágil: diez clases repartidas, liquidez primero, rebalanceo vivo; cuídate del sobrecambio nacido del exceso de información — que las alas te eleven a una vista más amplia, no a una ansiedad más densa.',
    th: 'สเปกตรัมธาตุลม โน้มเอียงคล่องตัว: กระจายทั้งสิบกลุ่มสินทรัพย์ ยึดสภาพคล่องเป็นอันดับแรก ปรับสมดุลไว ระวังการซื้อขายถี่เกินจากข้อมูลท่วมท้น — ให้ปีกพาไปสู่มุมมองกว้างกว่า ไม่ใช่ความวิตกที่หนาแน่นขึ้น',
    vi: 'Phổ nguyên tố Phong, thiên linh hoạt: mười lớp tài sản dàn trải, thanh khoản ưu tiên, tái cân bằng nhạy; đề phòng giao dịch quá nhiều sinh ra từ quá tải thông tin — để đôi cánh nâng bạn tới tầm nhìn rộng hơn, chứ không phải nỗi lo dày hơn.',
  }),
  water: Object.freeze({
    zh: '水象防守光谱：现金、债券、年金厚仓防御，波动类资产低配；先保本、后收益，情绪化决策强制四十八小时冷静期——深水不喧哗，却最难被撼动。',
    en: 'Water spectrum, defensive tilt: cash, bonds, and annuities hold thick defensive layers while volatile assets stay light; safety before yield, and any emotional decision sits through a 48-hour cooling-off — deep water makes no noise, yet is hardest to shake.',
    fr: 'Spectre d’Eau, inclinaison défensive : liquidités, obligations et rentes en couches épaisses, actifs volatils allégés ; la sécurité avant le rendement, et toute décision émotionnelle traverse 48 heures de refroidissement — l’eau profonde ne fait pas de bruit, mais elle est la plus difficile à ébranler.',
    es: 'Espectro de Agua, sesgo defensivo: efectivo, bonos y rentas en capas gruesas, activos volátiles al mínimo; seguridad antes que rentabilidad, y toda decisión emocional cumple 48 horas de enfriamiento — el agua profunda no hace ruido, y es la más difícil de sacudir.',
    th: 'สเปกตรัมธาตุน้ำ โน้มเอียงรับ: เงินสด พันธบัตร และบำนาญถือเป็นชั้นเกราะหนา สินทรัพย์ผันผวนถือน้อย ความปลอดภัยก่อนผลตอบแทน ทุกการตัดสินใจที่เป็นอารมณ์ต้องพักใจ 48 ชั่วโมง — น้ำลึกไม่ส่งเสียง แต่สั่นคลอนยากที่สุด',
    vi: 'Phổ nguyên tố Thủy, thiên thủ: tiền mặt, trái phiếu và lương hưu giữ lớp phòng thủ dày, tài sản biến động giữ nhẹ; an toàn trước lợi nhuận, mọi quyết định bằng cảm xúc phải qua 48 giờ nguội — nước sâu không ồn ào, nhưng khó lay chuyển nhất.',
  }),
  balanced: Object.freeze({
    zh: '中和土枢光谱：十维均衡铺开，核心-卫星结构——核心仓求稳压舱，卫星仓小注试进；每季再平衡一次，涨出的贪婪与跌出的恐惧都交还给纪律。',
    en: 'Balanced spectrum, earth pivot: all ten classes laid out evenly in a core-satellite frame — the core steadies the ship, satellites take small exploratory stakes; rebalance each quarter, and hand both bull-born greed and bear-born fear back to discipline.',
    fr: 'Spectre équilibré, pivot de terre : les dix classes réparties uniformément en structure cœur-satellite — le cœur stabilise le navire, les satellites prennent de petites parts exploratoires ; rééquilibrez chaque trimestre, et rendez à la discipline la cupidité née de la hausse comme la peur née de la baisse.',
    es: 'Espectro equilibrado, pivote de tierra: las diez clases repartidas de forma pareja en estructura núcleo-satélite — el núcleo estabiliza el barco, los satélites toman pequeñas cuotas exploratorias; rebalancea cada trimestre, y devuélvele a la disciplina tanto la avaricia nacida de la subida como el miedo nacido de la caída.',
    th: 'สเปกตรัมสมดุล ศูนย์กลางธาตุดิน: ทั้งสิบกลุ่มสินทรัพย์กางเต็มแบบโครงสร้างแกน-ดาวเทียม — แกนหลักถือเพื่อรักษาสมดุล ดาวเทียมลงเล็กเพื่อสำรวจ ปรับสมดุลทุกไตรมาส มอบความโลภที่โตจากตลาดขึ้นและความกลัวจากตลาดลงคืนให้วินัย',
    vi: 'Phổ cân bằng, trục Thổ: mười lớp tài sản trải đều theo kết cấu lõi-vệ tinh — lõi giữ ổn định, vệ tinh xuống vốn nhỏ để thăm dò; tái cân bằng mỗi quý, giao cả tham sinh từ thị trường lên và sợ hãi từ thị trường xuống lại cho kỷ luật.',
  }),
});

/* ═══════════════ 维度 C · credit_leverage 杠杆金律（第 8 宫通用；六语单套） ═══════════════ */

const RX_CREDIT = Object.freeze({
  zh: '第 8 宫杠杆金律：负债收入比守 36% 红线——水逆与火土刑流日期间，禁高息无抵押贷款与为他人担保签字，宇宙正在替你踩刹车。辨良性负债（低息长周期生息）与恶性负债（消费滚息）；信用利用率守 30% 以下，信用如星轨，靠长年积分慢慢养出。',
  en: '8th-house leverage rules: hold the debt-to-income line at 36% — during Mercury retrograde and Mars-Saturn squares, refuse high-interest unsecured loans and any guarantee signature; the cosmos is braking for you. Separate good debt (low-interest, long-cycle, income-bearing) from bad debt (revolving consumption); keep credit utilization under 30% — credit, like a star track, is earned by years of steady orbits.',
  fr: 'Règles de levier de la 8e maison : tenez le ratio dettes/revenus à 36 % — pendant les rétrogrades de Mercure et les carrés Mars-Saturne, refusez les prêts non garantis à taux élevé et toute signature de caution ; le cosmos freine pour vous. Distinguez la bonne dette (peu coûteuse, longue, productrice) de la mauvaise (crédit revolving) ; gardez l’utilisation du crédit sous 30 % — le crédit, comme une trajectoire d’étoile, se forge par des années d’orbites régulières.',
  es: 'Reglas de palanca de la 8ª casa: mantén la relación deuda/ingreso en 36% — durante las retrogradaciones de Mercurio y los cuadrados Marte-Saturno, rechaza préstamos no garantizados de interés alto y cualquier firma de aval; el cosmos está frenando por ti. Distingue la deuda buena (barata, larga, productiva) de la mala (revolvente); usa menos del 30% del crédito — el crédito, como una órbita estelar, se cultiva con años de giros constantes.',
  th: 'กฎเดินคานบ้านที่ 8: รักษาอัตราส่วนหนี้ต่อรายได้ที่ 36% — ช่วงพุธสถยศและมาร์สชนดาวเสาร์ ปฏิเสธเงินกู้ดอกเบี้ยสูงไม่มีหลักประกันและการเซ็นค้ำประกันให้ผู้อื่น เพราะจักรวาลกำลังเบรกให้คุณ แยกหนี้ดี (ดอกต่ำ ระยะยาว ทำให้เงินงอกเงย) ออกจากหนี้ร้าย (ดอกทบจากการบริโภค) ใช้เครดิตไม่เกิน 30% — เครดิตเหมือนวงโคจรดาว ต้องอาศัยหลายปีของวงรอบสม่ำเสมอ',
  vi: 'Luật đòn bẩy cung 8: giữ tỷ lệ nợ/thu nhập ở vạch 36% — trong thời kỳ Sao Thủy nghịch hành và vuông Hỏa-Thổ, từ chối vay không thế chấp lãi cao và mọi chữ ký bảo lãnh; vũ trụ đang hãm phanh giúp bạn. Phân biệt nợ tốt (lãi thấp, chu kỳ dài, sinh lợi) với nợ xấu (lãi kép tiêu dùng); giữ mức sử dụng tín dụng dưới 30% — uy tín như quỹ đạo sao, phải nhiều năm quay đều mới dưỡng ra.',
});

/* ═══════════════ 维度 D · cut_and_legacy 破局传承（五阶×六语） ═══════════════ */

const RX_CUT = Object.freeze({
  starting_out: Object.freeze({
    zh: '起步期 CUT 心法：C＝复利尽早启动，让时间做你最大的杠杆；U＝收入无常，先用基础保障兜底再谈进攻；T＝择时不赌单点，用分批定投熨平波动——年轻时最贵的资产，是下一段现金流。',
    en: 'Starting-out CUT: C — start compounding early and let time be your biggest lever; U — income is uncertain, floor yourself with basic protection before attacking; T — never bet on a single timing point, smooth the waves with staged entries — the priciest asset of youth is the next stretch of cash flow.',
    fr: 'CUT du départ : C — lancez la composition tôt, le temps est votre plus grand levier ; U — le revenu est incertain, sécurisez-vous avec une protection de base avant d’attaquer ; T — ne pariez jamais sur un point d’entrée unique, lissez les vagues par versements échelonnés — l’actif le plus précieux de la jeunesse, c’est le prochain segment de cash flow.',
    es: 'CUT de arranque: C — enciende el interés compuesto pronto y deja que el tiempo sea tu mayor palanca; U — el ingreso es incierto, cúbrete con protección básica antes de atacar; T — nunca apuestes a un único punto de entrada, alisa las olas con aportes escalonados — el activo más caro de la juventud es el próximo tramo de flujo de caja.',
    th: 'สูตร CUT วัยเริ่มต้น: C — เริ่มทบต้นให้เร็ว ให้เวลาเป็นคานงัดที่ใหญ่ที่สุด U — รายได้ไม่แน่นอน วางเกราะป้องกันพื้นฐานก่อนคิดบุก T — ไม่พนันกับจังหวะจุดเดียว ใช้การลงทุนเป็นงวดเรียงคลื่นให้เรียบ — สินทรัพย์ที่แพงที่สุดของวัยหนุ่มสาวคือกระแสเงินสดช่วงถัดไป',
    vi: 'CUT giai đoạn khởi nghiệp: C — khởi động lãi kép sớm, để thời gian là đòn bẩy lớn nhất; U — thu nhập vô thường, lót nền bằng lớp bảo vệ cơ bản rồi mới tấn công; T — không cược vào một điểm mua duy nhất, san phẳng sóng bằng xuống vốn theo đợt — tài sản đắt nhất của tuổi trẻ là đoạn dòng tiền phía trước.',
  }),
  sandwich_building: Object.freeze({
    zh: '三明治期 CUT 全开：C＝复利引擎任何震荡都不熄火；U＝无常四护盾优先——失业、失能、婚变、身故的风险隔离先于一切收益追求；T＝择时分批进退，置业创业皆以三成流动性安全垫为闸。',
    en: 'Sandwich-years CUT, fully open: C — the compounding engine stays lit through every storm; U — the four uncertainty shields come first: unemployment, disability, divorce, and death risk isolation precede any chase for yield; T — enter and exit in stages, with a 30% liquidity safety mat gating both home purchase and venture.',
    fr: 'CUT des années sandwich, grand ouvert : C — le moteur de composition reste allumé dans chaque tempête ; U — les quatre boucliers d’incertitude d’abord : isolation des risques de chômage, d’invalidité, de rupture et de décès passe avant toute quête de rendement ; T — entrez et sortez par étapes, un matelas de liquidité de 30% verrouillant achat et création d’entreprise.',
    es: 'CUT de los años sándwich, a plena apertura: C — el motor del interés compuesto no se apaga en ninguna tormenta; U — primero los cuatro escudos de incertidumbre: el aislamiento de riesgos de desempleo, invalidez, divorcio y fallecimiento va antes que cualquier búsqueda de rentabilidad; T — entra y sale por etapas, con un colchón de liquidez del 30% como compuerta para vivienda y emprendimiento.',
    th: 'สูตร CUT วัยแซนด์วิช เปิดเต็มระบบ: C — เครื่องทบต้นไม่ดับแม้ตลาดปั่น U — เกราะสี่ด้านรับความไม่แน่นอนต้องมาก่อน การแยกความเสี่ยงเรื่องตกงาน ทุพพลภาพ หย่า และการเสียชีวิต นำหน้าการไล่ล่าผลตอบแทน T — เข้าออกแบบแบ่งงวด ทั้งซื้อบ้านและทำธุรกิจใช้แผ่นรองสภาพคล่อง 30% เป็นประตูกั้น',
    vi: 'CUT tuổi kẹp giữa, mở hết: C — động cơ lãi kép không tắt máy trong mọi cơn bão; U — bốn lá chắn vô thường lên trước — cách ly rủi ro mất việc, mất sức lao động, ly hôn và tử vong đứng trước mọi mục tiêu lợi nhuận; T — vào ra theo đợt, mua nhà lẫn khởi nghiệp đều lấy đệm thanh khoản 30% làm cửa chặn.',
  }),
  consolidating: Object.freeze({
    zh: '巩固期 CUT 转精密：C＝复利进入税务敏感区——所得税、房产税、遗产税三税统筹前置，让税后留成最大化；U＝无常聚焦养老缺口锁定与跨周期再平衡；T＝资产腾挪的时点以税务日历为准绳。',
    en: 'Consolidating CUT turns precise: C — compounding enters its tax-sensitive zone, so income, property, and estate tax coordination comes first to maximize what stays after tax; U — uncertainty now focuses on locking the retirement gap and rebalancing across cycles; T — the timing of asset moves follows the tax calendar as its yardstick.',
    fr: 'Le CUT de consolidation devient précis : C — la composition entre en zone de sensibilité fiscale, la coordination des impôts sur le revenu, foncier et successoral passe donc en tête pour maximiser ce qui reste net ; U — l’incertitude se concentre sur le verrouillage du déficit de retraite et le rééquilibrage entre cycles ; T — le calendrier des arbitrages prend le calendrier fiscal pour étalon.',
    es: 'El CUT de consolidación se vuelve preciso: C — el interés compuesto entra en su zona fiscalmente sensible, así que la coordinación de renta, patrimonial y sucesoria va primero para maximizar lo que queda neto; U — la incertidumbre se enfoca en fijar el déficit de jubilación y rebalancear entre ciclos; T — el calendario de movimientos toma el fiscal como vara de medir.',
    th: 'สูตร CUT วัยมั่นคง แม่นขึ้น: C — การทบต้นเข้าเขตอ่อนไหวต่อภาษี การผสานภาษีสามชั้นจึงมาก่อน เพื่อให้ส่วนที่เหลือหลังภาษีมากที่สุด U — ความไม่แน่นอนมุ่งล็อกช่องว่างเงินบำนาญและปรับสมดุลข้ามวัฏจักร T — จังหวะย้ายสินทรัพย์ยึดปฏิทินภาษีเป็นเกณฑ์',
    vi: 'CUT giai đoạn củng cố chuyển sang tinh xảo: C — lãi kép bước vào vùng nhạy cảm thuế, phối hợp thu nhập - bất động sản - di sản lên trước để tối đa phần giữ lại sau thuế; U — vô thường tập trung khóa khoảng hụt hưu trí và tái cân bằng liên chu kỳ; T — thời điểm xê dịch tài sản lấy lịch thuế làm thước.',
  }),
  winding_down: Object.freeze({
    zh: '收官期 CUT 防四雷：通胀、股市周期、回报率波动、致残级医疗危机——四大惊雷齐防，保底仓与提取顺序先行；C＝复利交棒给下一代的时间复利，T＝提取时点先动税轻的格子。',
    en: 'Winding-down CUT guards the four bolts: inflation, equity cycles, return volatility, and disability-level medical shocks — all four defended at once, with the floor bucket and withdrawal order leading; C — compounding is handed to the next generation as time’s own interest; T — withdrawals tap the lighter-taxed buckets first.',
    fr: 'Le CUT du ralentissement pare aux quatre éclairs : inflation, cycles boursiers, volatilité des rendements et chocs médicaux invalidants — les quatre parés ensemble, compartiment de sécurité et ordre de retrait en tête ; C — la composition se transmet à la génération suivante comme l’intérêt du temps ; T — les retraits puisent d’abord dans les compartiments moins fiscalisés.',
    es: 'El CUT de la desaceleración guarda contra los cuatro rayos: inflación, ciclos bursátiles, volatilidad de retornos y choques médicos incapacitantes — los cuatro se defienden a la vez, con el compartimento de piso y el orden de retiro al frente; C — el interés compuesto se entrega a la siguiente generación como interés del tiempo; T — los retiros tocan primero los compartimentos menos gravados.',
    th: 'สูตร CUT วัยเก็บเกี่ยว รับสาฟ้าทั้งสี่: เงินเฟ้อ วัฏจักรตลาดหุ้น ผลตอบแทนผันผวน และวิกฤตสุขภาพระดับทุพพลภาพ — ป้องกันครบทั้งสี่ ให้พอร์ตรักษาพื้นและลำดับการถอนนำหน้า C — ส่งต่อดอกเบี้ยทบต้นของเวลาให้คนรุ่นถัดไป T — ถอนจากช่องที่ภาษีเบาก่อน',
    vi: 'CUT giai đoạn thu hoạch chống sét bốn đường: lạm phát, chu kỳ cổ phiếu, lợi nhuận dao động và cú sốc y tế mất sức lao động — phòng cả bốn cùng lúc, ô bảo toàn và thứ tự rút dẫn đầu; C — lãi kép trao cho thế hệ sau như lãi suất của thời gian; T — rút khỏi ô thuế nhẹ trước.',
  }),
  golden_legacy: Object.freeze({
    zh: '传承期 CUT 化盾：遗嘱、生前预嘱与持久授权书三件套齐备，海外资产以信托隔离，家族企业接班早立章法；精神遗嘱与慈善条款把价值观写进传承——真正的复利，是家族记忆的复利。',
    en: 'Legacy CUT turns into a shield: the will, living will, and durable power of attorney sit complete, offshore assets are insulated through trusts, and family-business succession rules are set early; the ethical will and charitable clauses write your values into the inheritance — the truest compounding is that of family memory.',
    fr: 'Le CUT d’héritage devient bouclier : testament, directives anticipées et mandat durable réunis au complet, actifs à l’étranger isolés par trusts, succession de l’entreprise familiale cadrée tôt ; le testament éthique et les clauses caritatives inscrivent vos valeurs dans la transmission — la composition la plus vraie est celle de la mémoire familiale.',
    es: 'El CUT de legado se vuelve escudo: testamento, testamento en vida y poder notarial duradero completos, activos en el extranjero aislados mediante fideicomisos, y la sucesión del negocio familiar reglamentada temprano; el testamento ético y las cláusulas caritativas escriben tus valores en la herencia — la composición más verdadera es la de la memoria familiar.',
    th: 'สูตร CUT วัยมรดก กลายเป็นเกราะ: พินัยกรรม คำสั่งเสียล่วงหน้า และหนังสือมอบอำนาจถาวร ครบสามชิ้น สินทรัพย์ต่างประเทศแยกด้วยทรัสต์ แผนส่งต่อกิจการครอบครัววางกติกาให้เร็ว พินัยกรรมทางจิตวิญญาณและข้อกำหนดการกุศลจารึกคุณค่าลงในมรดก — ดอกเบี้ยทบต้นที่แท้จริงคือดอกเบี้ยของความทรงจำตระกูล',
    vi: 'CUT thời kỳ truyền lại hoá lá chắn: di chúc, di nguyện trước và ủy quyền bền vững đủ bộ ba, tài sản nước ngoài cách ly qua quỹ tín thác, kế hoạch kế nhiệm gia nghiệp sớm đặt khuôn phép; di chúc tinh thần và điều khoản từ thiện khắc giá trị của bạn vào di sản — lãi kép chân thật nhất là lãi kép của ký ức gia đình.',
  }),
});

/* ═══════════════ 灵宠真名追问句模板（{name} 占位——E137.2 单源先例） ═══════════════ */

export const WEALTH_ASK_TEMPLATES = Object.freeze({
  // E139：句首 {name}＝灵宠真名（Sophia/Milo——前端 companionDisplayName 注入）
  zh: '{name}，请结合我的星盘二宫与八宫格局，按「十维资产光谱」与「CUT法则」为我推演今年的守财与攻守配比建议。',
  en: '{name}, please read my 2nd and 8th houses, and use the 10-Class Asset Spectrum and the CUT Rule to map this year’s defense-and-offense balance for my wealth.',
  fr: '{name}, lis mes 2e et 8e maisons, et applique le Spectre à 10 Actifs et la règle CUT pour tracer l’équilibre défense-offensive de mon patrimoine cette année.',
  es: '{name}, lee mis casas 2 y 8, y aplica el Espectro de 10 Activos y la Regla CUT para trazar el equilibrio defensa-ataque de mi patrimonio este año.',
  th: '{name} ช่วยอ่านบ้านที่ 2 และบ้านที่ 8 ในล่าดวงของฉัน แล้วใช้พอร์ต 10 สินทรัพย์และกฎ CUT วิเคราะห์สัดส่วนรับ-รุกของคลังทรัพย์ปีนี้ให้ฉันที',
  vi: '{name}, hãy đọc cung 2 và cung 8 trong lá số của tôi, dùng Phổ 10 Tài Sản và Luật CUT luận giải tỷ lệ phòng thủ – tấn công cho kho tài năm nay của tôi nhé.',
});

/* ═══════════════ 人生五阶分类器＋主入口 ═══════════════ */

/**
 * 人生五阶分类器（纯函数）：
 * @param {number|null} age 显式年龄（null/坏形状 ⇒ 默认三明治筑基期——军令钦定）
 * @returns {'starting_out'|'sandwich_building'|'consolidating'|'winding_down'|'golden_legacy'}
 */
export function classifyWealthLifeStage(age) {
  const n = (typeof age === 'number' && Number.isFinite(age)) ? Math.floor(age) : null;
  if (n === null || n < 0) return 'sandwich_building'; // 无出生年/坏形状 ⇒ 30-45 筑基三明治期
  if (n < 30) return 'starting_out';
  if (n < 45) return 'sandwich_building';
  if (n < 60) return 'consolidating';
  if (n < 70) return 'winding_down';
  return 'golden_legacy';
}

/** 出生年真值提取（YYYY-MM-DD 串 / {date, year} / year 数——坏形状 ⇒ null） */
function _wxBirthYear(birthData) {
  if (birthData === null || birthData === undefined) return null;
  if (typeof birthData === 'number' && Number.isFinite(birthData) && birthData > 1900 && birthData < 2200) {
    return Math.floor(birthData);
  }
  if (typeof birthData === 'string') {
    const m = birthData.trim().match(/^(\d{4})/);
    if (m) { const y = Number(m[1]); if (y > 1900 && y < 2200) return y; }
    return null;
  }
  if (typeof birthData === 'object') {
    if (typeof birthData.year === 'number' && Number.isFinite(birthData.year)
      && birthData.year > 1900 && birthData.year < 2200) return Math.floor(birthData.year);
    if (typeof birthData.date === 'string') {
      const m = birthData.date.trim().match(/^(\d{4})/);
      if (m) { const y = Number(m[1]); if (y > 1900 && y < 2200) return y; }
    }
  }
  return null;
}

/** 本命元素众数解析（复用 E137 deriveDominantElement 语义——多形状兼容 fail-closed） */
export function deriveWealthDominantElement(chartSummary, deriveDominantElementFn) {
  const cs = (chartSummary && typeof chartSummary === 'object') ? chartSummary : {};
  // 形状一：显式 dominantElement（server 端 E137 引擎已算好直传）
  const raw = String(cs.dominantElement || '').trim().toLowerCase();
  if (WEALTH_ELEMENTS.includes(raw)) return raw;
  // 形状二：natalSigns 英文星座名数组（引擎内自算——与 E137 同映射）
  if (Array.isArray(cs.natalSigns) && cs.natalSigns.length) {
    if (typeof deriveDominantElementFn === 'function') {
      const el = String(deriveDominantElementFn(cs.natalSigns) || '').trim().toLowerCase();
      if (WEALTH_ELEMENTS.includes(el)) return el;
    }
    return deriveWealthDominantElement(cs.natalSigns); // 数组直递归 → 形状四
  }
  // 形状三：natal 五星对象 { sun:{sign}, moon:{sign}, ... }（truth.natal 直传）
  const natal = (cs.natal && typeof cs.natal === 'object') ? cs.natal : null;
  if (natal) {
    const signs = ['sun', 'moon', 'asc', 'venus', 'mars']
      .map((k) => (natal[k] && typeof natal[k] === 'object' && natal[k].sign) || null)
      .filter(Boolean);
    if (signs.length) return deriveWealthDominantElement(signs); // → 形状四
  }
  // 形状四：星座名数组直传
  if (Array.isArray(chartSummary) && chartSummary.length) {
    const SIGN_TO_EL = {
      Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
      Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
      Gemini: 'air', Libra: 'air', Aquarius: 'air',
      Cancer: 'water', Scorpio: 'water', Pisces: 'water',
    };
    const tally = { fire: 0, earth: 0, air: 0, water: 0 };
    let valid = 0;
    for (const item of chartSummary) {
      const sign = (typeof item === 'string') ? item.trim() : '';
      const el = SIGN_TO_EL[sign.charAt(0).toUpperCase() + sign.slice(1)];
      if (el) { tally[el] += 1; valid += 1; }
    }
    if (valid) {
      let best = 'earth';
      let bestCount = -1;
      for (const el of ['fire', 'earth', 'air', 'water']) {
        if (tally[el] > bestCount) { best = el; bestCount = tally[el]; }
      }
      return best;
    }
  }
  return 'balanced'; // 坏形状兜底 ⇒ 土枢均衡
}

/**
 * 星盘财商处方主入口（纯函数——零网络零 LLM 零臆造）。
 * @param {{birthData?:string|{date?:string,year?:number}, chartSummary?:object|array,
 *   age?:number, locale?:string, queryText?:string}} input
 * @returns {{ok:boolean, lang:string, stageKey:string, stageName:string,
 *   age:number|null, ageSource:'birth'|'explicit'|'default', dominantElement:string,
 *   rx:{cashflow_stage:{category, prescription}, asset_spectrum:{category, prescription},
 *   credit_leverage:{category, prescription}, cut_and_legacy:{category, prescription}}}}
 */
export function computeAstroWealthPrescription(input) {
  const inp = (input && typeof input === 'object') ? input : {};
  const lang = _wxLang(inp.locale || inp.lang);

  // ① 人生五阶定位（军令：显式 age ＞ birthData 出生年 ＞ 默认三明治筑基）
  const currentYear = new Date().getUTCFullYear();
  let age = null;
  let ageSource = 'default';
  if (typeof inp.age === 'number' && Number.isFinite(inp.age) && inp.age >= 0 && inp.age < 130) {
    age = Math.floor(inp.age);
    ageSource = 'explicit';
  } else {
    const birthYear = _wxBirthYear(inp.birthData);
    if (birthYear) {
      age = currentYear - birthYear;
      ageSource = 'birth';
      if (age < 0 || age >= 130) { age = null; ageSource = 'default'; } // 防荒谬真值
    }
  }
  const stageKey = classifyWealthLifeStage(age);
  const stageName = (WEALTH_STAGE_NAMES[stageKey] || WEALTH_STAGE_NAMES.sandwich_building)[lang]
    || WEALTH_STAGE_NAMES.sandwich_building.en;

  // ② 本命元素众数（asset_spectrum 配比方向）
  const dominantElement = deriveWealthDominantElement(inp.chartSummary, inp.deriveDominantElement);

  // ③ 四维处方组装（16 套模板严选）
  const l = lang;
  const cashflow = (RX_CASHFLOW[stageKey] || RX_CASHFLOW.sandwich_building);
  const asset = (RX_ASSET[dominantElement] || RX_ASSET.balanced);
  const cut = (RX_CUT[stageKey] || RX_CUT.sandwich_building);
  const rx = {
    cashflow_stage: { category: 'cashflow_stage', prescription: cashflow[l] || cashflow.en },
    asset_spectrum: { category: 'asset_spectrum', prescription: asset[l] || asset.en },
    credit_leverage: { category: 'credit_leverage', prescription: RX_CREDIT[l] || RX_CREDIT.en },
    cut_and_legacy: { category: 'cut_and_legacy', prescription: cut[l] || cut.en },
  };

  return {
    ok: true,
    lang,
    stageKey,
    stageName,
    age,
    ageSource,
    dominantElement,
    rx,
  };
}

/** 模板套数（军令 16 套下界自证——cashflow 5 阶＋asset 5 元素＋credit 1＋cut 5 阶） */
export const WEALTH_TEMPLATE_COUNT = 16;

/* ═══════════════ prompt 注入块（server 端 buildFamiliarChatSystemPrompt 消费） ═══════════════ */

/** 主导元素六语中文名（prompt 块行内标签——中文块同 E137 形制固定中文） */
const WEALTH_ELEMENT_ZH = Object.freeze({
  fire: '火', earth: '土', air: '风', water: '水', balanced: '中和（土枢）',
});

/**
 * 生成注入 Gemini / DeepSeek 对话上下文的结构化星盘财商提示词块。
 * 块头块铁律固定中文（E137 wellnessBlock 同形制——模型按回复语种输出）；
 * 四维处方文案按 locale 取语（与 meta 帧卡片同源单源）。
 * @param {object|null} prescription computeAstroWealthPrescription 回执
 * @param {string} locale 六语
 * @returns {string|null} 处方无效 ⇒ null ⇒ 块不注入（零破坏）
 */
export function buildWealthSystemPromptBlock(prescription, locale) {
  if (!prescription || typeof prescription !== 'object' || !prescription.ok || !prescription.rx) return null;
  const lang = _wxLang(locale);
  const p = prescription;
  const rx = p.rx;
  const dims = [
    rx.cashflow_stage && rx.cashflow_stage.prescription,
    rx.asset_spectrum && rx.asset_spectrum.prescription,
    rx.credit_leverage && rx.credit_leverage.prescription,
    rx.cut_and_legacy && rx.cut_and_legacy.prescription,
  ];
  if (dims.some((d) => typeof d !== 'string' || !d.trim())) return null;
  const lines = [
    '【ASTRO_WEALTH_ADVISORY_RX（E139 军令，违反即失败·私人银行级星盘财商真值）】',
    `- 主人人生阶段：【${p.stageName}】（年龄定位：${p.age === null ? '未知·默认筑基' : String(p.age)}岁）；本命元素倾向：【${WEALTH_ELEMENT_ZH[p.dominantElement] || '中和'}】。`,
    `- 财库筑底（维度A·第2宫）：${rx.cashflow_stage.prescription}`,
    `- 十维配置（维度B·资产光谱）：${rx.asset_spectrum.prescription}`,
    `- 杠杆金律（维度C·第8宫）：${rx.credit_leverage.prescription}`,
    `- 破局与传承（维度D·CUT法则）：${rx.cut_and_legacy.prescription}`,
    '- 开方铁律：先以星盘命理的语言点出第2宫财库与第8宫杠杆在主人当前人生阶段的引力，再以知己口吻给出一至两条最贴当下处境的财商叮嘱（从四维里选最相关的融入回复，严禁四条全文复读）；按回复语种自然输出。',
    '- 金融合规铁律：回复严禁出现任何具体股票代码、任何第三方银行或金融机构名称、任何持牌投资买卖建议或收益承诺；只谈资产大类、比例方向与纪律心法——你递星光与法则，不递荐股与账单。',
    '',
  ];
  return lines.join('\n');
}
