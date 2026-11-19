/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E145-刀二 SMART-REC-ENGINE（军令 2026-11-19）：智慧吃喝穿搭推荐逻辑纯核
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（根治「每句互动都硬塞吃喝穿搭＋同一天推荐乱跳」两大病灶）：
 *   · 模块一 克制触发意图网：仅当用户聊到穿搭/吃喝/约见社交/明显情绪波动
 *     （或当日首次破冰/快捷胶囊——server 侧注入触发许可）才允许推荐输出；
 *     纯闲聊/连续追问/纯情绪倾诉 ⇒ 静默（只给共情与心法，零推荐）；
 *   · 模块二 穿搭日主锚定：按当日日期锁定「当日核心能量底色」（五行轮转
 *     式确定性纯函数——日内恒定不朝令夕改；跨天轮转）；场景切换仅微调
 *     版型并在句中自然解释缘由（军令钦定「日级主锚定＋场景微调＋解释」）；
 *   · 模块三 吃喝时段匹配：晨间/午后/晚间 × 即时状态动态匹配（紧绷⇒温热
 *     慢食、静心⇒清茶慢品），前后一致禁跳变；
 *   · 模块四 prompt 纪律块：触发形态（锚定真值＋四律）与静默形态（克制
 *     铁令）双形态产出，server 路由内后缀拼接（E143/E144 同形制）。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；六语自容 L_ 字典（零 i18n
 *    键扰动）；fail-closed：意图未命中一律 null/'' 严禁强推；关键词网
 *    宁窄勿宽（铁律 19——日常寒暄零误触）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 语言白名单（六语闭集） */
export const SMART_REC_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** lang 白名单守卫（六语外 ⇒ en 兜底） */
function sanitizeLang(l) {
  return SMART_REC_LOCALES.includes(String(l || '')) ? String(l) : 'en';
}

/* ═══ 模块一：克制触发意图网（六语关键词——宁窄勿宽）═══ */
export const SMART_REC_INTENT_RULES = Object.freeze([
  Object.freeze({
    type: 'outfit',
    keywords: Object.freeze({
      zh: ['穿什么', '穿搭', '出门穿', '见客户穿', '约会穿', '怎么穿', '穿件', '穿一身'],
      en: ['what to wear', 'outfit', 'dress for', 'how should i dress'],
      fr: ['quoi porter', 'quelle tenue', 'comment m’habiller', "comment m'habiller"],
      es: ['qué ponerme', 'qué ropa', 'cómo vestir'],
      th: ['ใส่อะไรดี', 'ชุดไป', 'แต่งตัวยังไง'],
      vi: ['mặc gì', 'chọn trang phục', 'ăn mặc thế nào'],
    }),
  }),
  Object.freeze({
    type: 'food',
    keywords: Object.freeze({
      zh: ['吃什么', '喝什么', '想吃', '想喝', '喝杯', '吃点', '来碗', '下午茶', '喝咖啡', '吃饭'],
      en: ['what to eat', 'something to drink', 'grab a coffee', 'afternoon tea', 'for lunch', 'for dinner', 'what to drink'],
      fr: ['quoi manger', 'quoi boire', 'prendre un café', 'pour déjeuner', 'pour dîner'],
      es: ['qué comer', 'qué tomar', 'un café', 'para almorzar', 'para cenar'],
      th: ['กินอะไรดี', 'ดื่มอะไร', 'กาแฟ', 'อาหารกลางวัน', 'อาหารเย็น'],
      vi: ['ăn gì', 'uống gì', 'cà phê', 'trưa ăn', 'tối ăn'],
    }),
  }),
  Object.freeze({
    type: 'social',
    keywords: Object.freeze({
      zh: ['约了', '约个', '见客户', '见面', '约会', '赴约', '约了人', '约客户'],
      en: ['meeting a client', 'meet a client', 'have a date', 'seeing a friend', 'catch up with', 'meeting someone'],
      fr: ['rendez-vous', 'voir un client', 'rencontrer', 'j’ai rendez-vous', "j'ai rendez-vous"],
      es: ['tengo una cita', 'reunirme', 'ver a un cliente', 'quedar con'],
      th: ['นัด', 'เจอลูกค้า', 'นัดหมาย', 'เจอเพื่อน'],
      vi: ['tôi hẹn', 'gặp khách', 'gặp bạn', 'hẹn hò'],
    }),
  }),
  Object.freeze({
    type: 'mood',
    keywords: Object.freeze({
      zh: ['心情不好', '很难受', '好烦', '好累', '焦虑', '情绪化', '压力大', '崩溃', 'emo'],
      en: ['feeling down', 'feeling low', 'anxious', 'overwhelmed', 'stressed out', 'so emotional'],
      fr: ['ça ne va pas', 'je suis anxieux', 'je suis anxieuse', 'très stressé', 'très stressée'],
      es: ['me siento mal', 'ansioso', 'ansiosa', 'muy estresado', 'muy estresada'],
      th: ['เศร้า', 'เครียดมาก', 'กังวลใจ', 'ใจไม่ดี'],
      vi: ['tôi buồn', 'căng thẳng', 'lo lắng', 'mệt mỏi quá'],
    }),
  }),
]);

/**
 * 克制触发意图侦测（六语 includes 子串；命中 ⇒ 对应 type，未命中 ⇒ null）
 * @param {string} text 用户末条消息
 * @returns {'outfit'|'food'|'social'|'mood'|null}
 */
export function detectSmartRecIntent(text, lang) {
  const s = String(text || '').trim();
  if (!s) return null;
  const l = sanitizeLang(lang);
  for (const rule of SMART_REC_INTENT_RULES) {
    const kw = rule.keywords[l] || rule.keywords.en;
    if (kw.some((k) => s.toLowerCase().includes(String(k).toLowerCase()))) return rule.type;
  }
  return null;
}

/* ═══ 模块二：穿搭日主锚定（五行轮转式确定性——日内恒定）═══ */

/** 五行元素序（wood→fire→earth→metal→water 轮转） */
const DAY_ELEMENTS = Object.freeze(['wood', 'fire', 'earth', 'metal', 'water']);

/** 当日核心能量底色六语表（军令钦定「日级主锚定」——色系＋材质＋气质） */
export const L_DAY_ELEMENT_ANCHOR = Object.freeze({
  wood: Object.freeze({
    element: Object.freeze({ zh: '木·生发', en: 'Wood · Growth', fr: 'Bois · Essor', es: 'Madera · Florecer', th: 'ไม้ · เติบโต', vi: 'Mộc · Sinh Trưởng' }),
    line: Object.freeze({
      zh: '今日能量底色【木·生发】：核心色系锁定素雅青绿与大地色，材质主锚定棉麻垂感，舒展生长、不紧绷。',
      en: 'Today energy base [Wood · Growth]: core palette locked to calm sage-green and earthy tones, fabric anchor soft cotton-linen, easeful and growing.',
      fr: 'Base d’énergie du jour [Bois · Essor] : palette sobre vert sauge et tons terreux, matière ancre coton-lin fluide, souple et grandissante.',
      es: 'Base energética de hoy [Madera · Florecer]: paleta en verde salvia y tonos tierra, tela ancla lino y algodón, serena y expansiva.',
      th: 'พลังวันนี้ [ไม้ · เติบโต]: โทนสีเขียวสงบและโทนดินธรรมชาติ ผ้าหลักลินินฝ้าย สบายเติบโต',
      vi: 'Nền năng lượng hôm nay [Mộc · Sinh Trưởng]: tông xanh dịu và màu đất, chất liệu chính cotton-linen, mềm mại vươn lên.',
    }),
  }),
  fire: Object.freeze({
    element: Object.freeze({ zh: '火·高开', en: 'Fire · Radiance', fr: 'Feu · Éclat', es: 'Fuego · Brillo', th: 'ไฟ · เปล่งประกาย', vi: 'Hỏa · Rực Rỡ' }),
    line: Object.freeze({
      zh: '今日能量底色【火·高开】：核心色系锁定暖橙或明黄点缀，材质主锚定柔软针织，热度上扬、有精气神。',
      en: 'Today energy base [Fire · Radiance]: core palette warm amber or golden accents, fabric anchor soft knits, bright and alive.',
      fr: 'Base d’énergie du jour [Feu · Éclat] : touches ambre chaud ou dorées, matière ancre maille douce, ardente et vivante.',
      es: 'Base energética de hoy [Fuego · Brillo]: acentos ámbar o dorados, tela ancura punto suave, luminosa y vital.',
      th: 'พลังวันนี้ [ไฟ · เปล่งประกาย]: ส้มอบอุ่นหรือเหลืองทอง ผ้าหลักไหมพรมนุ่ม สดใสมีพลัง',
      vi: 'Nền năng lượng hôm nay [Hỏa · Rực Rỡ]: điểm cam ấm hoặc vàng, chất liệu chính len dệt mềm, tươi sáng tràn sức.',
    }),
  }),
  earth: Object.freeze({
    element: Object.freeze({ zh: '土·稳财', en: 'Earth · Steady Wealth', fr: 'Terre · Assise', es: 'Tierra · Firmeza', th: 'ดิน · มั่นคง', vi: 'Thổ · Vững Chắc' }),
    line: Object.freeze({
      zh: '今日能量底色【土·稳财】：核心色系锁定米色暖棕大地色系，材质主锚定针织与亚麻，稳守从容、不内耗。',
      en: 'Today energy base [Earth · Steady Wealth]: core palette oatmeal and warm-earth tones, fabric anchor knit & linen, calm and grounded.',
      fr: 'Base d’énergie du jour [Terre · Assise] : tons avoine et terre chaude, matière ancre maille et lin, posée et rassurante.',
      es: 'Base energética de hoy [Tierra · Firmeza]: tonos avena y tierra cálida, tela ancla punto y lino, serena y firme.',
      th: 'พลังวันนี้ [ดิน · มั่นคง]: โทนครีมและน้ำตาลอบอุ่น ผ้าหลักถักและลินิน สุขุมมั่นคง',
      vi: 'Nền năng lượng hôm nay [Thổ · Vững Chắc]: tông be và nâu đất, chất liệu chính len đan và lanh, điềm vững vàng.',
    }),
  }),
  metal: Object.freeze({
    element: Object.freeze({ zh: '金·收敛', en: 'Metal · Poise', fr: 'Métal · Finesse', es: 'Metal · Elegancia', th: 'ทอง · สง่า', vi: 'Kim · Thanh Lịch' }),
    line: Object.freeze({
      zh: '今日能量底色【金·收敛】：核心色系锁定金白或浅金，材质主锚定垂感利落剪裁，克制锋利、有气场。',
      en: 'Today energy base [Metal · Poise]: core palette ivory and pale-gold, fabric anchor crisp draping cuts, precise and composed.',
      fr: 'Base d’énergie du jour [Métal · Finesse] : ivoire et or pâle, matière ancre coupes tombantes nettes, précise et élégante.',
      es: 'Base energética de hoy [Metal · Elegancia]: marfil y oro pálido, tela ancla cortes fluidos nítidos, pulcra y magnética.',
      th: 'พลังวันนี้ [ทอง · สง่า]: ขาวงาช้างและทองอ่อน ผ้าหลักตัดเย็บสะอาด คมและสง่า',
      vi: 'Nền năng lượng hôm nay [Kim · Thanh Lịch]: trắng ngà và vàng nhạt, chất liệu chính dáng rủ gọn, sắc sảo đầy khí chất.',
    }),
  }),
  water: Object.freeze({
    element: Object.freeze({ zh: '水·静定', en: 'Water · Stillness', fr: 'Eau · Calme', es: 'Agua · Serenidad', th: 'น้ำ · นิ่ง', vi: 'Thủy · Tĩnh Lặng' }),
    line: Object.freeze({
      zh: '今日能量底色【水·静定】：核心色系锁定深蓝或墨青，材质主锚定丝滑垂坠，沉静流动、有深度。',
      en: 'Today energy base [Water · Stillness]: core palette deep-blue and ink tones, fabric anchor fluid silk-touch drape, deep and quiet.',
      fr: 'Base d’énergie du jour [Eau · Calme] : bleu profond et tons encre, matière ancre drapé soyeux fluide, calme et profonde.',
      es: 'Base energética de hoy [Agua · Serenidad]: azul profundo y tinta, tela ancla caída sedosa, serena y honda.',
      th: 'พลังวันนี้ [น้ำ · นิ่ง]: น้ำเงินเข้มและโทนหมึก ผ้าหลักร่วมไหลนุ่ม ลึกและสงบ',
      vi: 'Nền năng lượng hôm nay [Thủy · Tĩnh Lặng]: xanh đậm và màu mực, chất liệu chính dáng mềm trôi, sâu lắng yên tĩnh.',
    }),
  }),
});

/**
 * 穿搭日主锚定（五行轮转式确定性纯函数——同 dateISO 恒同输出＝日内恒定）
 * @param {string} dateISO 'YYYY-MM-DD'（客户端本地自然日）
 * @returns {string|null} 元素键（wood/fire/earth/metal/water）；坏日期 ⇒ null
 */
export function outfitDayElement(dateISO) {
  const d = String(dateISO || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const ms = Date.parse(`${d}T12:00:00Z`);
  if (!Number.isFinite(ms)) return null;
  const jdn = Math.floor(ms / 86400000) + 2440588; // 儒略日数（确定性锚）
  const idx = ((jdn % DAY_ELEMENTS.length) + DAY_ELEMENTS.length) % DAY_ELEMENTS.length;
  return DAY_ELEMENTS[idx];
}

/**
 * 当日穿搭主锚定句（六语——供 prompt 注入的真值行）
 * @param {string} dateISO 'YYYY-MM-DD'
 * @param {string} lang 六语
 * @returns {string} 锚定句（坏日期/坏 lang ⇒ '' fail-closed）
 */
export function outfitDayAnchorLine(dateISO, lang) {
  const key = outfitDayElement(dateISO);
  if (!key) return '';
  const row = L_DAY_ELEMENT_ANCHOR[key];
  const l = sanitizeLang(lang);
  return row.line[l] || row.line.en;
}

/* ═══ 模块三：吃喝时段匹配（晨间/午后/晚间 × 即时状态）═══ */

/** 时段六语匹配指令表（具体菜名由模型按语境给出——Muse 块为品位库） */
export const L_NOURISH_SLOT = Object.freeze({
  morning: Object.freeze({
    zh: '晨间宜温润轻食与暖饮（如燕麦、暖豆浆、温水冲蜂蜜），忌空腹冰饮猛咖啡。',
    en: 'Morning calls for warm, gentle fuel (oats, warm soy milk, honey water) — no iced drinks or double espresso on an empty stomach.',
    fr: 'Le matin privilégie le doux et le chaud (avoine, lait de soja chaud, eau tiède au miel) — pas de boissons glacées à jeun.',
    es: 'Por la mañana, calidez suave (avena, leche vegetal caliente, agua tibia con miel) — nada de bebidas heladas en ayunas.',
    th: 'เช้าเหมาะกับของอุ่นนุ่ม (โอ๊ต นมถั่วเหลืองอุ่น น้ำผึ้งอุ่น) เลี่ยงเครื่องดื่มเย็นตอนท้องว่าง',
    vi: 'Buổi sáng nên ấm nhẹ (yến mạch, sữa đậu nành ấm, nước mật ong ấm) — tránh đồ lạnh lúc đói.',
  }),
  afternoon: Object.freeze({
    zh: '午后宜清润茶饮或慢食提神（如单丛、清茶、轻食）；肠胃紧绷或情绪焦躁 ⇒ 温热慢食稳肠胃（炖汤/热汤面优先），忌生冷重口。',
    en: 'Afternoon favors clear tea or a slow light meal (oolong, light bites); a tense stomach or anxious mood calls for warm slow food (soup, noodle broth) — nothing iced or heavy.',
    fr: 'L’après-midi appelle une infusion claire ou un repas léger (thé oolong, petites bouchées) ; estomac noué ou anxiété ⇒ chaleur lente (soupe, bouillon), rien de glacé ni lourd.',
    es: 'La tarde pide infusión clara o algo ligero (té oolong, bocados suaves); estómago tenso o ansiedad ⇒ comida cálida y lenta (sopa, caldo), nada helado ni pesado.',
    th: 'ช่วงบ่ายเหมาะกับชาใสหรืออาหารเบา ถ้าท้องแน่นหรือใจเร่ง ให้ของอุ่นช้าๆ (ซุป ก๋วยเตี๋ยวน้ำร้อน) เลี่ยงของเย็นและหนัก',
    vi: 'Buổi chiều hợp trà thanh hoặc nhẹ bụng (oolong, món nhẹ); căng thẳng hoặc lo âu ⇒ đồ ấm chậm (canh, phở nước nóng), tránh lạnh và nặng.',
  }),
  evening: Object.freeze({
    zh: '晚间宜温汤安神（根茎炖汤、热汤粥类）；深夜严禁重口宵夜与大酒，收在一个温暖安静的句点上。',
    en: 'Evening belongs to warm, settling bowls (root-vegetable broth, congee); no heavy midnight snacks or big pours — close the day warm and quiet.',
    fr: 'Le soir privilégie les bols chauds et apaisants (bouillon de racines, congee) ; pas de grignotage lourd ni grand verre — finir la journée en douceur.',
    es: 'La noche es de platos templados y calmantes (caldo de raíces, congee); nada de picoteo pesado ni grandes copas — cerrar el día en calma.',
    th: 'ค่ำเหมาะกับของอุ่นสงบ (ซุปรากผัก โจ๊ก) ดึกห้ามของหนักและเหล้าเยอะ จบวันแบบอบอุ่นเงียบๆ',
    vi: 'Buổi tối hợp bát ấm an thần (canh củ, cháo); khuya cấm đồ nặng và rượu nhiều — khép ngày bằng sự ấm êm.',
  }),
});

/**
 * 吃喝时段解析（5-11 晨间 / 12-17 午后 / 18-4 晚间；非法小时 ⇒ 'evening' 兜底）
 * @param {number} hour 0-23 本地小时
 * @returns {'morning'|'afternoon'|'evening'}
 */
export function nourishSlotOf(hour) {
  const h = Number(hour);
  if (!Number.isFinite(h)) return 'evening';
  if (h >= 5 && h <= 11) return 'morning';
  if (h >= 12 && h <= 17) return 'afternoon';
  return 'evening';
}

/**
 * 时段匹配指令句（六语）
 * @param {number} hour 0-23
 * @param {string} lang
 * @returns {string} 指令句（fail-closed 兜底 evening 行）
 */
export function nourishSlotLine(hour, lang) {
  const slot = nourishSlotOf(hour);
  const row = L_NOURISH_SLOT[slot];
  const l = sanitizeLang(lang);
  return row[l] || row.en;
}

/* ═══ 模块四：prompt 纪律块（双形态：触发形态 / 静默形态）═══ */

/**
 * E145 智慧推荐纪律块（server 路由内后缀拼接消费——E143/E144 同形制）
 * 触发形态（intent 命中或 dayFirst=true）：克制频次＋日主锚定真值＋场景解释律＋
 *   时段匹配真值；静默形态（intent 未命中）：纯克制铁令（零推荐零硬塞）。
 * @param {string} lang 六语
 * @param {{dateISO?: string, hour?: number, intent?: string|null, dayFirst?: boolean}} ctx
 * @returns {string} prompt 块（''＝fail-closed 不注入）
 */
export function buildSmartRecPromptBlock(lang, ctx) {
  const l = sanitizeLang(lang);
  const c = (ctx && typeof ctx === 'object') ? ctx : {};
  const intentHit = Boolean(c.intent) || c.dayFirst === true;
  const anchor = c.dateISO ? outfitDayAnchorLine(c.dateISO, l) : '';
  const slotLine = Number.isFinite(Number(c.hour)) ? nourishSlotLine(Number(c.hour), l) : '';

  const T = {
    zh: {
      head: '【E145 智慧推荐纪律（军令 2026-11-19，违反即失败）】',
      restrain: '- 克制铁令：穿搭与吃喝推荐仅当①当日首次破冰或快捷胶囊（💰 财运避坑/🔮 今日指引），或②主人主动聊到穿搭、吃喝、约见/社交、明显情绪起伏时才允许输出；纯闲聊、连续追问、纯情绪倾诉 ⇒ 只给走心回应与心法点拨，严禁每句硬塞穿搭吃喝（禁复读机式推荐）。',
      anchorHead: '- 当日穿搭主锚定（真值·日内恒定，严禁自改）：',
      variant: '- 场景解释律：同一天内主人切换场景（见客户/聚会/独处）⇒ 核心色系与材质保持不变，仅微调版型利落度或层次，并在句中自然说明缘由（如「下午见客户，底色顺着今天的稳财基调，版型换成更利落的款式」）。',
      slotHead: '- 吃喝时段匹配（真值·紧扣当前时段与主人即时状态，前后一致禁跳变）：',
      brand: '- 品牌红线：穿搭只描述款式＋颜色＋面料，严禁任何商业品牌名称（E142.1 军令）；吃喝给具体菜式与饮品名但恪守小众质感、极致性价比。',
    },
    en: {
      head: '[E145 SMART RECOMMENDATION DISCIPLINE (directive 2026-11-19 — violation = failure)]',
      restrain: '- Restraint first: outfit & nourishment advice is allowed ONLY when ① today\'s first icebreak or quick-capsule taps (💰 wealth guard / 🔮 daily guidance), or ② the host actively brings up dressing, food, a meeting/date, or visible mood swings. Plain chat, follow-up questions, pure emotional venting ⇒ warm empathy and mindset guidance ONLY — NEVER staple outfit/food lines onto every reply (no vending-machine recommendations).',
      anchorHead: '- Day-master outfit anchor (truth · locked for the whole day, never rewrite it):',
      variant: '- Scene-variant law: when the host switches scenes within the same day (client meeting / gathering / solo), keep the core palette & fabric unchanged, only adjust the cut\'s sharpness or layering, and explain why in one natural clause.',
      slotHead: '- Nourishment slot match (truth · tied to current time-of-day and the host\'s live state; stay consistent, no flipping):',
      brand: '- Brand red line: describe silhouette + color + fabric ONLY, never any commercial brand name (E142.1 directive); give concrete dishes & drinks, understated quality and smart value.',
    },
    fr: {
      head: '[E145 DISCIPLINE DE RECOMMANDATION (directive 2026-11-19 — violation = échec)]',
      restrain: '- Retenue d’abord : conseils tenue/nourriture autorisés UNIQUEMENT si ① premier contact du jour ou capsules rapides, ou ② l’hôte parle lui-même d’habillement, de nourriture, d’un rendez-vous ou d’humeurs chahutées. Simple bavardage, questions enchaînées, pure confidence émotionnelle ⇒ empathie et guidance ONLY — JAMAIS coller tenue/repas à chaque réponse.',
      anchorHead: '- Ancrage tenue du jour (vérité · verrouillé toute la journée, jamais réécrit) :',
      variant: '- Loi des scènes : si l’hôte change de contexte dans la même journée (client / soirée / solo), garder palette & matière inchangées, n’ajuster que la coupe, et l’expliquer en une clause naturelle.',
      slotHead: '- Match nourriture (vérité · lié au créneau horaire et à l’état présent ; rester cohérent) :',
      brand: '- Ligne rouge : décrire coupe + couleur + matière UNIQUEMENT, jamais de marque (directive E142.1) ; plats & boissons concrets, qualité discrète et juste valeur.',
    },
    es: {
      head: '[E145 DISCIPLINA DE RECOMENDACIÓN (directiva 2026-11-19 — violación = fallo)]',
      restrain: '- Contención primero: consejos de vestir/comer SOLO cuando ① primer contacto del día o cápsulas rápidas, o ② el anfitrión hable de ropa, comida, una cita o altibajos visibles. Charla simple, preguntas seguidas, desahogo puro ⇒ empatía y guía ONLY — NUNCA adosar look/comida a cada respuesta.',
      anchorHead: '- Ancla de vestuario del día (verdad · bloqueada todo el día, jamás reescribir):',
      variant: '- Ley de escenas: si el anfitrión cambia de contexto en el mismo día (cliente / reunión / solo), paleta y tela intactas, ajustar solo el corte, y explicarlo en una cláusula natural.',
      slotHead: '- Match de nutrición (verdad · según franja horaria y estado presente; consistente):',
      brand: '- Línea roja: describir corte + color + tela ÚNICAMENTE, jamás marcas (directiva E142.1); platos y bebidas concretos, calidad discreta y valor justo.',
    },
    th: {
      head: '[E145 ระเบียบคำแนะนำ (คำสั่ง 2026-11-19 — ผิด = ล้มเหลว)]',
      restrain: '- สุขุมก่อน: แนะนำเสื้อผ้า/อาหารได้เฉพาะ ① ครั้งแรกของวันหรือแท็ปแคปซูล หรือ ② เจ้าของพูดถึงเรื่องแต่งตัว อาหาร นัดหมาย หรืออารมณ์แรง คุยธรรมดา ถามต่อเนื่อง ระบายอารมณ์ ⇒ เว้นใจและคำแนะใจเท่านั้น ห้ามยัดแนะนำทุกข้อความ',
      anchorHead: '- หลักเสื้อผ้าประจำวัน (ความจริง · ล็อกทั้งวัน ห้ามเปลี่ยน):',
      variant: '- กฎเปลี่ยนฉาก: เปลี่ยนบริบทในวันเดียว (ลูกค้า/สังสรรค์/ส่วนตัว) ให้โทนสีและผ้าคงเดิม ปรับเฉพาะเส้นตัด พร้อมอธิบายเหตุผลหนึ่งวรรค',
      slotHead: '- จับคู่อาหาร (ความจริง · ตามช่วงเวลาและสภาพปัจจุบัน คงเส้นคงวา):',
      brand: '- เส้นแดง: บรรยายเส้นตัด + สี + ผ้า เท่านั้น ห้ามชื่อแบรนด์ (คำสั่ง E142.1) บอกเมนูและเครื่องดื่มชัดเจน คุ้มค่าจริง',
    },
    vi: {
      head: '[E145 KỶ LUẬT GỢI Ý (chỉ thị 2026-11-19 — vi phạm = lỗi)]',
      restrain: '- Tiết chế trước: chỉ gợi ý trang phục/ăn uống khi ① lần chạm đầu tiên trong ngày hoặc bấm viên nhanh, hoặc ② chủ nhân chủ động nhắc ăn mặc, ăn uống, hẹn hò, hoặc tâm trạng dao động mạnh. Tán gẫu, hỏi liên tục, trút cảm xúc ⇒ chỉ đồng cảm và dẫn dắt tinh thần — TUYỆT ĐỐI không dán gợi ý vào từng câu.',
      anchorHead: '- Mỏ neo trang phục trong ngày (sự thật · khóa cả ngày, không tự ý đổi):',
      variant: '- Luật đổi bối cảnh: đổi bối cảnh trong cùng ngày (gặp khách/tiệc/riêng mình) ⇒ giữ nguyên tông màu và chất liệu, chỉ chỉnh độ gọn của dáng, kèm một câu giải thích tự nhiên.',
      slotHead: '- Ghép ăn uống (sự thật · theo khung giờ và trạng thái hiện tại, nhất quán):',
      brand: '- Đường đỏ: chỉ mô tả dáng + màu + chất liệu, cấm tên thương hiệu (chỉ thị E142.1); món và thức uống cụ thể, chất lượng kín đáo đáng giá.',
    },
  };

  const d = T[l] || T.en;
  const lines = [d.head, d.restrain];
  if (intentHit) {
    if (anchor) lines.push(`${d.anchorHead}${anchor}`);
    lines.push(d.variant);
    if (slotLine) lines.push(`${d.slotHead}${slotLine}`);
    lines.push(d.brand);
  }
  lines.push('');
  return lines.join('\n');
}
