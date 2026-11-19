/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E146 FOUR-FOLD-REC-ENGINE（军令 2026-11-19）：四维校准吃喝与穿搭推荐引擎
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（时令季节 × 真实星盘 × 情绪/场景 × 时段 四维顺位）：
 *   · 四维顺位铁律：吃喝与穿搭推荐严格按 ① 即时时令季节 → ② 用户真实星盘
 *     （本命行星/星座五行底色）→ ③ 当下情绪/场景 → ④ 时段（晨间/午后/
 *     傍晚夜间/深夜）生成，严禁脱离星盘与节气瞎猜；口吻自然知己语感，
 *     不堆砌晦涩术语与商业品牌词，维持 60–80 字上下双段空行留白；
 *   · 克制触发：默认非每次互动都输出推荐；仅①每日首次破冰/②快捷胶囊
 *     （财运避坑、今日指引）/③用户主动聊吃喝、出门/见客户/社交/约会、
 *     穿搭/④明显情绪波动时触发；
 *   · 单次聚焦：单次回复只聚焦「吃喝」或「穿搭」其中一项，严禁同条消息
 *     汤水茶饮与服饰全塞满；
 *   · 吃喝矩阵：时令定寒热燥湿（秋冬润燥暖身/春夏清润理气）× 星盘五行
 *     （火旺降火/水土温润/月亮压力安神）× 时段侧重动态切换；换饮须给
 *     自然理由；
 *   · 穿搭矩阵：日级主锚定（日内恒定主色系材质）× 场景版型微调＋一句
 *     自然解释（复用 E145 outfitDayAnchorLine 单一真源）。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；六语自容 L_ 字典（零 i18n
 *    键扰动）；fail-closed：未触发一律静默形态；关键词网宁窄勿宽（铁律
 *    19）。季节/元素/意图/日主锚定真源复用 E137/E145 既有纯核（禁过度
 *    工程化——单一真源不复制实现）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* 真源复用：E145 意图网（克制触发四情形同源）＋穿搭日主锚定句 */
import { detectSmartRecIntent, outfitDayAnchorLine } from './astralSmartRecEngine.mjs';
/* 真源复用：E137 季节模式（北/南半球镜像）＋星盘元素众数推导 */
import { resolveSeasonMode, resolveHemisphere, deriveDominantElement } from './astroSeasonalWellnessEngine.mjs';

/** 语言白名单（六语闭集） */
export const FOURFOLD_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** lang 白名单守卫（六语外 ⇒ en 兜底） */
function sanitizeLang(l) {
  return FOURFOLD_LOCALES.includes(String(l || '')) ? String(l) : 'en';
}

/** 四维调质闭集 */
export const SEASONAL_TONES = Object.freeze(['moisten', 'clear']);
export const NATAL_TONES = Object.freeze(['cooling', 'warming', 'soothing', 'steady']);
export const FOURFOLD_SLOTS = Object.freeze(['morning', 'afternoon', 'duskNight', 'lateNight']);
export const REC_FOCUS = Object.freeze(['food', 'outfit']);

/* ═══ 军令钦定词条（六语对照表逐字）═══ */
export const L_FOURFOLD_TERMS = Object.freeze({
  title: Object.freeze({
    zh: '四维顺时校准', en: 'Four-Fold Astral Alignment', fr: 'Alignement Quadruple',
    es: 'Alineación Cuádruple', th: 'ปรับสมดุลสี่มิติ', vi: 'Căn Chỉnh Tứ Chiều',
  }),
  seasonal: Object.freeze({
    zh: '时令节气底色', en: 'Seasonal & Solar Tone', fr: 'Ton Saisonnier',
    es: 'Tono Estacional', th: 'โทนตามฤดูกาลและราศี', vi: 'Sắc Thái Theo Mùa',
  }),
  nourish: Object.freeze({
    zh: '饮膳暖润调理', en: 'Nourishment & Warmth', fr: 'Infusion & Réconfort',
    es: 'Nutrición y Calidez', th: 'การกินและการดื่มประคองใจ', vi: 'Ẩm Thực & Thức Uống An Hòa',
  }),
  aura: Object.freeze({
    zh: '气场穿搭微调', en: 'Aura Styling Tuning', fr: 'Ajustement d’Aura',
    es: 'Ajuste de Aura', th: 'ปรับสไตล์ตามวาระ', vi: 'Điều Chỉnh Phối Đồ Theo Bối Cảnh',
  }),
});

/* ═══ ① 时令节气底色（mode: cool 润燥暖身 / mild+warm 清润理气）═══ */
export const L_SEASONAL_TONE = Object.freeze({
  moisten: Object.freeze({
    zh: '① 时令节气底色【敛阴护阳 · 温补润燥】：秋冬燥冷，吃喝穿搭整体偏润燥暖身——温汤、根茎炖煮、暖材质叠穿，忌生冷与轻薄单衣。',
    en: '① Seasonal & Solar Tone [Gather Yin, Guard Yang · warm & moisten]: autumn-winter dryness calls for nourishing warmth — broths, root stews, layered warm fabrics; nothing icy or flimsy.',
    fr: '① Ton Saisonnier [Rassemblement du Yin · réchauffer et hydrater] : la saison sèche appelle chaleur nourrissante — bouillons, racines braisées, matières superposées ; rien de glacé.',
    es: '① Tono Estacional [Reunir el Yin · templar e hidratar]: la estación seca pide calidez nutritiva — caldos, raíces estofadas, telas abrigadas en capas; nada helado.',
    th: '① โทนตามฤดูกาล [สะสมหยิน อบอุ่นชุ่มชื้น]: หน้าแห้งหนาวเน้นของอุ่นบำรุง ซุป สตูว์รากผัก ผ้าหนาซ้อนชั้น เลี่ยงของเย็นและผ้าบาง',
    vi: '① Sắc Thái Theo Mùa [Liễm Âm Hộ Dương · ôn bổ nhuận táo]: mùa khô lạnh cần sự ấm bổ — canh, hầm củ, vải ấm chất lớp; tránh đồ lạnh.',
  }),
  clear: Object.freeze({
    zh: '① 时令节气底色【清心降火 · 清润理气】：春夏温热升发，整体偏清润理气——清茶、轻食、透气面料，忌厚重燥热与油炸辛辣。',
    en: '① Seasonal & Solar Tone [Clear Heart, Cool Fire · light & flowing]: spring-summer heat rising calls for clarity — light teas, fresh bites, breathable fabrics; nothing heavy or greasy.',
    fr: '① Ton Saisonnier [Cœur clair · légèreté vivante] : la chaleur montante appelle clarté — infusions légères, bouchées fraîches, matières respirantes ; rien de lourd.',
    es: '① Tono Estacional [Corazón claro · ligereza viva]: el calor ascendente pide claridad — tés ligeros, bocados frescos, telas que respiran; nada pesado.',
    th: '① โทนตามฤดูกาล [ใจเย็น ละลายไฟ]: หน้าร้อนเน้นสายเบาสดชื่น ชาใส อาหารเบา ผ้าระบายอากาศ เลี่ยงของหนักและมัน',
    vi: '① Sắc Thái Theo Mùa [Thanh Tâm Giáng Hỏa · thanh nhuận]: mùa ấm dâng cần sự thanh nhẹ — trà thanh, món nhẹ, vải thoáng; tránh nặng và dầu.',
  }),
});

/**
 * 时令调质解析（E137 season mode → 军令二档：cool ⇒ moisten 润燥暖身；
 * mild/warm ⇒ clear 清润理气；非法 ⇒ null fail-closed）
 * @param {string} mode E137 resolveSeasonMode().mode（cool/mild/warm）
 * @returns {'moisten'|'clear'|null}
 */
export function seasonalToneOf(mode) {
  const m = String(mode || '');
  if (m === 'cool') return 'moisten';
  if (m === 'mild' || m === 'warm') return 'clear';
  return null;
}

/* ═══ ② 星盘能量调质（五行底色四档）═══ */
export const L_NATAL_TONE = Object.freeze({
  cooling: Object.freeze({
    zh: '② 星盘能量调质【火象偏旺】：吃喝偏清润降火（雪梨汤、菊花、绿豆），穿搭偏透气降温面料；忌辛辣油炸与闷热厚重。',
    en: '② Natal energy tuning [Fire-dominant]: favor cooling nourishment (pear soup, chrysanthemum, mung bean) and breathable fabrics; avoid spicy, fried, or heat-trapping layers.',
    fr: '② Accord natal [Feu dominant] : privilégiez le frais apaisant (soupe de poire, chrysanthème, haricot mungo) et les matières respirantes ; éviter épicé et épais.',
    es: '② Afinación natal [Fuego dominante]: favorece lo refrescante (sopa de pera, crisantemo, frijol mungo) y telas que respiran; evita picante y capas calurosas.',
    th: '② ปรับพลังดวง [ไฟเด่น]: เน้นเย็นสบาย (ซุปลูกแพร์ เก็กฮวย ถั่วเขียว) ผ้าระบายอากาศ เลี่ยงเผ็ด ทอด และหนาร้อน',
    vi: '② Điều chỉnh bản mệnh [Hỏa vượng]: thiên về thanh mát (canh lê, cúc, đậu xanh) và vải thoáng mát; tránh cay, chiên và chất dày nóng.',
  }),
  warming: Object.freeze({
    zh: '② 星盘能量调质【水土偏寒】：吃喝偏温润暖身（姜枣茶、根茎炖汤），穿搭偏暖材质叠穿；忌生冷寒凉与单薄。',
    en: '② Natal energy tuning [Water-earth cold]: favor warming moisture (ginger-jujube tea, root stews) and warm layered fabrics; avoid raw, chilled, or flimsy pieces.',
    fr: '② Accord natal [Eau-terre froid] : privilégiez la chaleur douce (infusion gingembre-jujubier, ragoût de racines) et les matières chaudes en couches ; éviter le cru.',
    es: '② Afinación natal [Agua-tierra fría]: favorece el calor suave (té jengibre-azufaifo, estofado de raíces) y telas cálidas en capas; evita lo crudo y ligero.',
    th: '② ปรับพลังดวง [น้ำ-ดินเย็น]: เน้นอุ่นชุ่มชื้น (ชาขิง-ไจ๋ซื่อ สตูว์รากผัก) ผ้าอุ่นซ้อนชั้น เลี่ยงของดิบเย็นและผ้าบาง',
    vi: '② Điều chỉnh bản mệnh [Thủy-Thổ hàn]: thiên về ôn nhu (trà gừng-táo, hầm củ) và vải ấm chất lớp; tránh sống lạnh và mỏng manh.',
  }),
  soothing: Object.freeze({
    zh: '② 星盘能量调质【月亮潮汐 · 压力带】：吃喝偏安神抚慰（热牛奶、桂圆红枣、洋甘菊），穿搭偏轻软包裹感；忌强刺激饮品与硬挺束缚。',
    en: '② Natal energy tuning [Lunar tide · pressure]: favor soothing comfort (warm milk, longan-jujube, chamomile) and soft cocooning fabrics; avoid strong stimulants and stiff structure.',
    fr: '② Accord natal [Marée lunaire · pression] : privilégiez l’apaisement (lait chaud, longane-jujubier, camomille) et les matières douces enveloppantes ; éviter stimulants et rigidité.',
    es: '② Afinación natal [Marea lunar · presión]: favorece el consuelo (leche tibia, longan-azufaifo, manzanilla) y telas suaves que abrazan; evita estimulantes y rigidez.',
    th: '② ปรับพลังดวง [น้ำขึ้นน้ำลง · แรงกดดัน]: เน้นประคองใจ (นมอุ่น ลำไย-ไจ๋ซื่อ คาโมมายล์) ผ้านุ่มโอบล้อม เลี่ยงเครื่องดื่มแรงและผ้าแข็ง',
    vi: '② Điều chỉnh bản mệnh [Thuỷ triều · áp lực]: thiên về an phủ (sữa ấm, nhãn-táo, cúc la mã) và vải mềm ôm; tránh kích thích mạnh và cứng nhắc.',
  }),
  steady: Object.freeze({
    zh: '② 星盘能量调质【气机平和】：吃喝穿搭以平衡调理为主，顺时令不偏科，无强偏禁忌。',
    en: '② Natal energy tuning [Balanced flow]: keep an even keel — follow the season without strong bias, no hard avoidances.',
    fr: '② Accord natal [Flux équilibré] : restez équilibré — suivez la saison sans parti pris, sans interdit marqué.',
    es: '② Afinación natal [Flujo equilibrado]: mantén el punto medio — sigue la estación sin sesgos marcados, sin vedas fuertes.',
    th: '② ปรับพลังดวง [สมดุล]: เดินตรงกลาง ตามฤดูกาล ไม่ต้องเว้นอะไรเป็นพิเศษ',
    vi: '② Điều chỉnh bản mệnh [Khí cơ hòa bình]: giữ trung tính — theo mùa, không kiêng kị mạnh.',
  }),
});

/**
 * 星盘调质解析（元素众数＋月亮单元素 → 军令四档；均缺 ⇒ steady 平和）
 * fire ⇒ cooling 降火；water ⇒ warming 温润（水土寒凉）；
 * moon 落 water/earth ⇒ soothing 安神（月亮潮汐压力带，优先级高于众数）；
 * earth/air/balanced ⇒ steady 平和。fail-closed：坏形状 ⇒ steady。
 * @param {string} element E137 deriveDominantElement 结果（fire/earth/air/water/balanced）
 * @param {string|null} moonElement 月亮星座元素（可 null）
 * @returns {'cooling'|'warming'|'soothing'|'steady'}
 */
export function natalToneOf(element, moonElement) {
  const m = (moonElement === 'water' || moonElement === 'earth') ? 'soothing' : null;
  if (m) return m;
  const e = String(element || '');
  if (e === 'fire') return 'cooling';
  if (e === 'water') return 'warming';
  return 'steady';
}

/* ═══ ④ 时段侧重（军令四档边界：06-10:59 / 11-16:59 / 17-23:59 / 00-05:59）═══ */
export const L_SLOT_FOCUS = Object.freeze({
  morning: Object.freeze({
    zh: '④ 时段侧重【晨间 06:00–10:59】：开嗓、暖中焦、稳节奏——温热轻食与暖饮优先，忌空腹冰饮与浓咖啡。',
    en: '④ Slot focus [Morning 06:00–10:59]: warm the voice and mid-center, steady the pace — warm light food and drinks first; no iced or double-espresso on an empty stomach.',
    fr: '④ Créneau [Matin 06:00–10:59] : éveiller en douceur le centre — nourriture tiède et boissons chaudes d’abord ; rien de glacé ni double espresso à jeun.',
    es: '④ Franja [Mañana 06:00–10:59]: abrir la voz y el centro con calma — comida tibia ligera y bebidas calientes primero; nada helado ni espresso doble en ayunas.',
    th: '④ ช่วงเวลา [เช้า 06:00–10:59]: ปลุกร่างอุ่นๆ นิ่งๆ อาหารอุ่นเบาและเครื่องดื่มอุ่นก่อน เลี่ยงของเย็นและกาแฟแรงตอนท้องว่าง',
    vi: '④ Khung giờ [Sáng 06:00–10:59]: mở giọng, ấm trung tiêu, giữ nhịp — đồ ấm nhẹ trước; tránh lạnh và cà phê đậm lúc đói.',
  }),
  afternoon: Object.freeze({
    zh: '④ 时段侧重【午后 11:00–16:59】：降心火、防犯困、顺应约见饮品——清润茶饮或慢食，有约见时选体面不慌乱的饮单。',
    en: '④ Slot focus [Afternoon 11:00–16:59]: cool the heart-fire, dodge the slump, match any meeting — clear teas or slow bites; for appointments pick a composed, presentable order.',
    fr: '④ Créneau [Après-midi 11:00–16:59] : apaiser le feu, éviter la somnolence, s’accorder aux rendez-vous — infusions claires ou bouchées lentes ; en rendez-vous, un choix posé et présentable.',
    es: '④ Franja [Tarde 11:00–16:59]: bajar el fuego del corazón, evitar el bajón, ajustarse a las citas — tés claros o bocados lentos; en citas, un pedido sereno y presentable.',
    th: '④ ช่วงเวลา [บ่าย 11:00–16:59]: ลดไฟใจ กันง่วง เข้ากับนัดหมาย ชาใสหรืออาหารช้าๆ มีนัดให้เลือกสุภาพไม่รีบ',
    vi: '④ Khung giờ [Buổi chiều 11:00–16:59]: giáng tâm hỏa, chống buồn ngủ, theo lịch hẹn — trà thanh hoặc món chậm; đi hẹn chọn thứ điềm đạm đẹp mặt.',
  }),
  duskNight: Object.freeze({
    zh: '④ 时段侧重【傍晚夜间 17:00–23:59】：收心、暖胃、减负——温汤安神优先，忌重口宵夜与大酒。',
    en: '④ Slot focus [Dusk & night 17:00–23:59]: gather in, warm the stomach, lighten the load — settling warm bowls first; no heavy midnight snacks or big pours.',
    fr: '④ Créneau [Soirée 17:00–23:59] : rentrer, réchauffer l’estomac, alléger — bols chauds apaisants d’abord ; pas de grignotage lourd ni grands verres.',
    es: '④ Franja [Tarde-noche 17:00–23:59]: recoger, templar el estómago, aligerar — cuencos cálidos calmantes primero; nada de picoteo pesado ni copas grandes.',
    th: '④ ช่วงเวลา [เย็นถึงดึก 17:00–23:59]: เก็บใจ อุ่นท้อง ผ่อนภาระ ของอุ่นสงบก่อน เลี่ยงของหนักและเหล้าเยอะดึก',
    vi: '④ Khung giờ [Chiều tối 17:00–23:59]: thu tâm, ấm dạ, giảm tải — bát ấm an thần trước; tránh đồ nặng và rượu nhiều.',
  }),
  lateNight: Object.freeze({
    zh: '④ 时段侧重【深夜 00:00–05:59】：温水与休息提醒优先——此刻不给任何兴奋性推荐，只温柔劝收。',
    en: '④ Slot focus [Late night 00:00–05:59]: warm water and rest come first — no stimulating picks at this hour, only a gentle nudge toward sleep.',
    fr: '④ Créneau [Nuit profonde 00:00–05:59] : eau tiède et repos d’abord — aucune suggestion stimulante, seulement une douce invitation au sommeil.',
    es: '④ Franja [Madrugada 00:00–05:59]: agua tibia y descanso primero — nada estimulante a esta hora, solo un dulce impulso hacia dormir.',
    th: '④ ช่วงเวลา [ดึกมาก 00:00–05:59]: น้ำอุ่นและพักผ่อนก่อน ไม่แนะนำของปลุกใจ แค่ชวนนอนเบาๆ',
    vi: '④ Khung giờ [Khuya 00:00–05:59]: nước ấm và nghỉ ngơi trước — không gợi ý gì kích thích, chỉ dịu dàng mời ngủ.',
  }),
});

/**
 * 时段四档解析（军令边界：06-10:59 晨 / 11-16:59 午后 / 17-23:59 傍晚夜间 /
 * 00-05:59 深夜；非法小时 ⇒ 'duskNight' fail-closed 兜底）
 * @param {number} hour 0-23 本地小时
 * @returns {'morning'|'afternoon'|'duskNight'|'lateNight'}
 */
export function fourFoldSlotOf(hour) {
  const h = Number(hour);
  if (!Number.isFinite(h)) return 'duskNight';
  if (h >= 6 && h <= 10) return 'morning';
  if (h >= 11 && h <= 16) return 'afternoon';
  if (h >= 17 && h <= 23) return 'duskNight';
  return 'lateNight'; // 0-5
}

/* ═══ 单次聚焦规则（军令：只聚焦吃喝或穿搭其中一项）═══ */

/**
 * 单次聚焦解析（intent 优先 → 场景/情绪映射 → 日首破冰；未触发 ⇒ null 静默）
 * outfit ⇒ outfit；food ⇒ food；social（见客户/约会/社交）⇒ outfit；
 * mood（情绪波动）⇒ food（温润抚慰）；dayFirst（无显式意图）⇒ food（温润开嗓）。
 * @param {string|null} intent E145 detectSmartRecIntent 结果
 * @param {boolean} dayFirst 当日首条破冰
 * @returns {'food'|'outfit'|null}
 */
export function resolveRecFocus(intent, dayFirst) {
  const i = String(intent || '');
  if (i === 'outfit') return 'outfit';
  if (i === 'food') return 'food';
  if (i === 'social') return 'outfit';
  if (i === 'mood') return 'food';
  if (dayFirst === true) return 'food';
  return null;
}

/**
 * 克制触发意图侦测（E145 意图网单一真源 re-export）
 * @returns {'outfit'|'food'|'social'|'mood'|null}
 */
export function detectFourFoldIntent(text, lang) {
  return detectSmartRecIntent(text, lang);
}

/* ═══ prompt 纪律块（双形态：触发形态 / 静默形态）═══ */

/**
 * E146 四维校准纪律块（server 路由内后缀拼接消费——E143/E144/E145 同形制）
 * 触发形态（focus 非空）：四维真值行（时令底色＋星盘调质＋时段侧重）＋单次
 *   聚焦铁令＋吃喝矩阵或穿搭矩阵（按 focus 二选一）＋语感律；
 * 静默形态（focus null）：纯克制铁令（零真值零推荐——默认不输出推荐）。
 * @param {string} lang 六语
 * @param {{dateISO?: string, hour?: number, intent?: string|null, dayFirst?: boolean,
 *          seasonMode?: string, natalElement?: string, moonElement?: string|null}} ctx
 * @returns {string} prompt 块（''＝fail-closed 不注入）
 */
export function buildFourFoldPromptBlock(lang, ctx) {
  const l = sanitizeLang(lang);
  const c = (ctx && typeof ctx === 'object') ? ctx : {};
  const T = {
    zh: {
      head: '【E146 四维顺时校准（军令 2026-11-19，违反即失败）】',
      restrain: '- 克制铁令：吃喝与穿搭推荐默认不输出；仅当①每日首次破冰，或②快捷胶囊（💰 财运避坑 / 🔮 今日指引），或③主人主动聊到吃喝、出门/见客户/社交/约会、穿搭，或④明显情绪波动时才允许出现；纯闲聊、连续追问、纯情绪倾诉 ⇒ 只给走心回应与心法点拨。',
      focus: '- 单次聚焦铁律：本轮只聚焦「饮膳暖润调理」与「气场穿搭微调」其中一项（本轮锁定：',
      focusTail: '），严禁同条消息汤水茶饮与服饰全塞满。',
      nourishMatrix: '- 饮膳暖润调理矩阵：时令定寒热燥湿 × 星盘五行倾向 × 时段与情绪动态切换，前后一致禁跳变；更换饮品或汤水时，须结合当下时段或主人状态给出一句自然理由；恪守小众质感、极致性价比。',
      anchorHead: '- 当日穿搭主锚定（真值·日内恒定，严禁自改）：',
      auraMatrix: '- 气场穿搭微调（场景版型律）：同一天内主人切换场景（居家独处/见客户商务/约会小聚/情绪波动）⇒ 保留当日主色系与材质底色，仅微调版型剪裁或外层层次，并在句中用一句自然的话说明缘由；只描述款式＋颜色＋面料，严禁任何商业品牌名称（E142.1 红线）。',
      voice: '- 语感律：自然知己口吻，严禁堆砌晦涩术语与商业品牌词；维持 60–80 字上下、双段空行留白的短句节奏（E144 留白律照旧）。',
    },
    en: {
      head: '[E146 FOUR-FOLD ASTRAL ALIGNMENT (directive 2026-11-19 — violation = failure)]',
      restrain: '- Restraint law: food & outfit recommendations are OFF by default; they may appear ONLY when ① today\'s first icebreak, or ② quick capsules (💰 wealth guard / 🔮 daily guidance), or ③ the host brings up food, going out / clients / social / dates, or dressing, or ④ visible mood swings. Plain chat, follow-ups, pure venting ⇒ warm empathy and mindset guidance only.',
      focus: '- Single-focus law: this turn focuses on ONE of “Nourishment & Warmth” or “Aura Styling Tuning” (locked this turn: ',
      focusTail: ') — NEVER pile soups, teas AND outfits into one reply.',
      nourishMatrix: '- Nourishment matrix: seasonal cold-dry base × natal five-phase leaning × slot-and-mood switching, consistent no flipping; when changing drink or soup, give one natural reason tied to the current slot or the host\'s state; understated quality, honest value.',
      anchorHead: '- Day-master outfit anchor (truth · locked all day, never rewrite): ',
      auraMatrix: '- Aura Styling Tuning (scene-variant law): when the host switches scenes within one day (solo / client meeting / date or gathering / mood swing), keep the day palette & fabric base, adjust only cut or layering, and explain why in one natural clause; silhouette + color + fabric only, never any brand name (E142.1 red line).',
      voice: '- Voice law: natural confidante tone, no jargon stacking, no brand words; keep the 60–80-char two-paragraph breathing rhythm (E144 stays).',
    },
    fr: {
      head: '[E146 ALIGNEMENT QUADRUPLE (directive 2026-11-19 — violation = échec)]',
      restrain: '- Loi de retenue : recommandations nourriture/tenue désactivées par défaut ; autorisées UNIQUEMENT si ① premier contact du jour, ② capsules rapides, ③ l’hôte parle de nourriture, sortie, rendez-vous ou tenue, ④ émotion visible. Simple bavardage ⇒ empathie et guidance.',
      focus: '- Loi d’unicité : ce tour porte sur UN seul des « Infusion & Réconfort » ou « Ajustement d’Aura » (verrouillé : ',
      focusTail: ') — JAMAIS potages, thés ET tenues empilés dans une même réponse.',
      nourishMatrix: '- Matrice nourriture : base saisonnière chaud-sec × inclinaison natale × créneau et humeur, cohérent sans revirement ; un changement de boisson se justifie d’une phrase naturelle ; qualité discrète, juste valeur.',
      anchorHead: '- Ancrage tenue du jour (vérité · verrouillé, jamais réécrit) : ',
      auraMatrix: '- Ajustement d’Aura (loi des scènes) : même jour, même palette et matière ; n’ajuster que coupe ou superposition, expliqué d’une clause naturelle ; coupe + couleur + matière, jamais de marque (E142.1).',
      voice: '- Loi de voix : ton de confidente, sans jargon ni marques ; garder la respiration 60–80 caractères en deux paragraphes (E144).',
    },
    es: {
      head: '[E146 ALINEACIÓN CUÁDRUPLE (directiva 2026-11-19 — violación = fallo)]',
      restrain: '- Ley de contención: recomendaciones de comida/ropa apagadas por defecto; solo con ① primer contacto del día, ② cápsulas rápidas, ③ el anfitrión menciona comida, salidas, citas o ropa, ④ emoción visible. Charla simple ⇒ empatía y guía.',
      focus: '- Ley de foco único: este turno aborda UNO de «Nutrición y Calidez» o «Ajuste de Aura» (bloqueado: ',
      focusTail: ') — NUNCA apilar sopas, tés Y looks en una sola respuesta.',
      nourishMatrix: '- Matriz nutricional: base estacional frío-seco × inclinación natal × franja y ánimo, sin virar; cada cambio de bebida se justifica con una frase natural; calidad discreta, valor justo.',
      anchorHead: '- Ancla de vestuario del día (verdad · bloqueada, jamás reescribir): ',
      auraMatrix: '- Ajuste de Aura (ley de escenas): mismo día, misma paleta y tela; ajustar solo corte o capas, explicado en una cláusula natural; corte + color + tela, jamás marcas (E142.1).',
      voice: '- Ley de voz: tono de confidente, sin tecnicismos ni marcas; mantener la respiración 60–80 caracteres en dos párrafos (E144).',
    },
    th: {
      head: '[E146 ปรับสมดุลสี่มิติ (คำสั่ง 2026-11-19 — ผิด = ล้มเหลว)]',
      restrain: '- กฎสุขุม: คำแนะนำเรื่องกิน/แต่งตัวปิดโดยปกติ เปิดเฉพาะ ① ครั้งแรกของวัน ② แคปซูลเร็ว ③ เจ้าของพูดถึงเรื่องกิน ออกนอกบ้าน นัด หรือแต่งตัว ④ อารมณ์แรง คุยธรรมดา ⇒ เว้นใจและคำแนะใจเท่านั้น',
      focus: '- กฎโฟกัสเดี่ยว: รอบนี้เน้นอย่างเดียวระหว่าง «การกินและการดื่มประคองใจ» หรือ «ปรับสไตล์ตามวาระ» (ล็อก: ',
      focusTail: ') ห้ามยัดทั้งซุป ชา และเสื้อผ้าในข้อความเดียว',
      nourishMatrix: '- เมทริกซ์อาหาร: ฤดูกาล × ธาตุดวง × ช่วงเวลาและอารมณ์ คงเส้นคงวา เปลี่ยนเครื่องดื่มต้องบอกเหตุผลหนึ่งวรรค คุ้มค่าเรียบง่าย',
      anchorHead: '- หลักเสื้อผ้าประจำวัน (ความจริง · ล็อกทั้งวัน ห้ามเปลี่ยน): ',
      auraMatrix: '- ปรับสไตล์ตามวาระ: เปลี่ยนฉากในวันเดียว โทนสีและผ้าคงเดิม ปรับเฉพาะเส้นตัดหรือชั้น พร้อมอธิบายหนึ่งวรรค เส้นตัด+สี+ผ้าเท่านั้น ห้ามแบรนด์ (E142.1)',
      voice: '- กฎน้ำเสียง: เป็นเพื่อนสนิท ไม่ใช้ศัพท์หนักหรือชื่อแบรนด์ คงจังหวะสองย่อหน้า 60–80 ตัวอักษร (ตาม E144)',
    },
    vi: {
      head: '[E146 CĂN CHỈNH TỨ CHIỀU (chỉ thị 2026-11-19 — vi phạm = lỗi)]',
      restrain: '- Luật tiết chế: gợi ý ăn/mặc mặc định tắt; chỉ bật khi ① lần đầu trong ngày ② viên nhanh ③ chủ nhân nhắc ăn uống, đi gặp, hẹn hò, hoặc quần áo ④ cảm xúc mạnh. Tán gẫu ⇒ chỉ đồng cảm và dẫn dắt.',
      focus: '- Luật tập trung đơn: lượt này chỉ xử MỘT trong «Ẩm Thực & Thức Uống An Hòa» hoặc «Điều Chỉnh Phối Đồ Theo Bối Cảnh» (khóa: ',
      focusTail: ') — TUYỆT ĐỐI không nhồi canh, trà VÀ trang phục vào một câu trả lời.',
      nourishMatrix: '- Ma trận ẩm thực: nền mùa × thiên hướng bản mệnh × khung giờ và tâm trạng, nhất quán; đổi thức uống phải kèm một lý do tự nhiên theo khung giờ hoặc trạng thái; chất lượng kín đáo đáng giá.',
      anchorHead: '- Mỏ neo trang phục trong ngày (sự thật · khóa cả ngày, không tự đổi): ',
      auraMatrix: '- Điều Chỉnh Phối Đồ Theo Bối Cảnh: đổi bối cảnh trong ngày ⇒ giữ tông màu và chất liệu gốc, chỉ chỉnh dáng hoặc lớp, kèm một câu giải thích tự nhiên; chỉ dáng + màu + chất liệu, cấm thương hiệu (E142.1).',
      voice: '- Luật giọng điệu: giọng tri kỷ, không chất thuật ngữ hay tên thương hiệu; giữ nhịp hai đoạn 60–80 ký tự (theo E144).',
    },
  };

  const d = T[l] || T.en;
  const terms = L_FOURFOLD_TERMS;
  const focus = resolveRecFocus(c.intent, c.dayFirst);
  const lines = [d.head, d.restrain];

  if (focus) {
    const focusTerm = focus === 'food' ? terms.nourish[l] : terms.aura[l];
    lines.push(`${d.focus}${focusTerm}${d.focusTail}`);

    // ① 时令节气底色（真值·顺位第一）
    const st = seasonalToneOf(c.seasonMode);
    if (st) lines.push(`${(L_SEASONAL_TONE[st][l] || L_SEASONAL_TONE[st].en)}`);
    // ② 星盘能量调质（真值·顺位第二）
    const nt = natalToneOf(c.natalElement, c.moonElement === undefined ? null : c.moonElement);
    lines.push(`${(L_NATAL_TONE[nt][l] || L_NATAL_TONE[nt].en)}`);
    // ④ 时段侧重（真值·顺位第四）
    if (Number.isFinite(Number(c.hour))) {
      const slot = fourFoldSlotOf(Number(c.hour));
      lines.push(`${(L_SLOT_FOCUS[slot][l] || L_SLOT_FOCUS[slot].en)}`);
    }

    if (focus === 'food') {
      lines.push(d.nourishMatrix);
    } else {
      const anchor = c.dateISO ? outfitDayAnchorLine(c.dateISO, l) : '';
      if (anchor) lines.push(`${d.anchorHead}${anchor}`);
      lines.push(d.auraMatrix);
    }
    lines.push(d.voice);
  }
  lines.push('');
  return lines.join('\n');
}

/* ═══ server 侧四维真值合成（路由 IIFE 便捷入口）═══ */

/**
 * 四维真值合成（server 路由内消费——季节/元素由 E137 真源推导）
 * @param {{timestamp?: number, geoZone?: string|null, natalSigns?: string[],
 *          moonSign?: string|null}} raw
 * @returns {{seasonMode: string, natalElement: string, moonElement: string|null}}
 */
export function resolveFourFoldTruth(raw) {
  const r = (raw && typeof raw === 'object') ? raw : {};
  const hemisphere = resolveHemisphere(r.geoZone || null);
  const ts = Number.isFinite(Number(r.timestamp)) ? Number(r.timestamp) : Date.now();
  const season = resolveSeasonMode(ts, hemisphere);
  const natalElement = deriveDominantElement(Array.isArray(r.natalSigns) ? r.natalSigns : []);
  const moonElement = r.moonSign ? deriveDominantElement([r.moonSign]) : null;
  return { seasonMode: season.mode, natalElement, moonElement };
}
