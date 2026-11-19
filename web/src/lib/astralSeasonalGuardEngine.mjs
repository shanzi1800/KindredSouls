/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E147 SEASONAL-GUARD-ENGINE（军令 2026-11-19）：餐饮零地名清洗锁 ＋
 *    着装「季节 × 所在地气候 × 年龄段」三维硬锁与反季面料拦截
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令钦定（主公三张产线截图病灶根治）：
 *   · 刀二 餐饮「零地名/零菜系前缀」硬规则＋出流清洗锁：System Prompt
 *     纪律（菜名只描述食材/做法/口感）＋出流清洗 `washFoodRegionPrefix`
 *     剥离明确地域前缀保留食材做法（潮汕清炖牛腩 → 清炖牛腩）；六语词典
 *     宁窄勿宽（铁律 19——只收明确地域美食前缀，绝不泛化误伤）；
 *   · 刀三 着装三维硬锁：①季节 ②用户所在地气候 ③年龄段。出生地/现居地
 *     彻底解耦（本核不吃任何 birth 参数——季节判定只看「此刻所在」）；
 *     四级无感定位顺位 `resolveCurrentClimate`：L1 当轮 user 文本城市
 *     词典 → L2 请求头国家码 → L3 客户端时区 → null（回退现行 geoZone
 *     北半球语义零破坏）。跨半球用例：出生宜昌现居墨尔本 ⇒ L3 命中
 *     Australia/Melbourne ⇒ south（南半球初夏）——绝不触发北半球冬大衣；
 *   · 反季面料拦截双级：prompt 级黑名单注入＋出流拦截器 `guardSeasonalFabric`
 *     （凉季气候命中春夏面料词 ⇒ 自动替换当季保暖材质）；
 *   · 刀三 年龄段三档（出生年推导）：<28 青春活泼 / 28–45 从容精进 /
 *     >45 成熟沉稳——只锚气质剪裁语感，不出现具体年龄数字。
 * 🔴 纪律：纯逻辑核（零 DOM/零 i18n/零网络）；六语自容 L_ 字典（零 i18n
 *    键扰动）；fail-closed：坏形状一律 null/''；词典宁窄勿宽；幂等纯
 *    字符串清洗（逐 delta 独立清洗，跨分片断词残留为已知边界——prompt
 *    戒律为主闸，出流清洗为兜底）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 语言白名单（六语闭集） */
export const E147_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** lang 白名单守卫（六语外 ⇒ en 兜底） */
function sanitizeLang(l) {
  return E147_LOCALES.includes(String(l || '')) ? String(l) : 'en';
}

/* ═══ 刀二：餐饮零地名/零菜系前缀词典（宁窄勿宽——只收明确地域连缀前缀）═══ */
/** 出流清洗剥离表（命中即剥前缀；六语窄收：明确「地域+菜式」连缀形态） */
export const FOOD_REGION_PREFIXES = Object.freeze([
  // zh 明确地域前缀（产线实锤：潮汕清炖牛腩）
  '潮汕', '广式', '粤式', '港式', '川味', '川式', '湘味', '苏式', '沪式', '京式',
  '东北', '西北', '台式', '日式', '韩式', '泰式', '越式', '法式', '意式', '墨西哥',
  '兰州', '沙县', '顺德', '乐山', '柳州',
  // en 菜系连缀（明确 cuisine 形态，宁窄勿宽）
  'Cantonese-style ', 'Sichuan-style ', 'Hunan-style ', 'Japanese-style ',
  'Korean-style ', 'Thai-style ', 'Vietnamese-style ', 'French-style ',
  'Italian-style ', 'Mexican-style ', 'Sichuan ', 'Cantonese ',
  // fr/es/th/vi 明确连缀（窄收）
  'à la cantonaise ', 'estilo cantonés ', 'estilo tailandés ', 'สไตล์ญี่ปุ่น ',
  'kiểu Nhật ', 'kiểu Thái ',
]);

/**
 * 刀二出流清洗：剥离餐饮地域前缀保留食材做法（幂等——多次清洗同结果）
 * @param {string} text 出流增量帧文本
 * @returns {string} 清洗后文本（坏形状 ⇒ 原文透传 fail-closed）
 */
export function washFoodRegionPrefix(text) {
  if (typeof text !== 'string' || !text) return (typeof text === 'string' ? text : '');
  let out = text;
  for (const p of FOOD_REGION_PREFIXES) {
    if (out.includes(p)) out = out.split(p).join('');
  }
  // 剥离后残空格归一（「潮汕 清炖」→「清炖」；防双空格＋前导空格形态）
  if (out !== text) {
    out = out.replace(/ {2,}/g, ' ')
      .replace(/^ +([\u4e00-\u9fff])/, '$1')
      .replace(/([\u4e00-\u9fff]) +([\u4e00-\u9fff])/g, '$1$2');
  }
  return out;
}

/* ═══ 刀三：四级无感定位顺位（所在地气候三档）═══ */
/** 气候带闭集：north 北温 / south 南温（镜像季节）/ tropical 常夏湿热 */
export const CLIMATE_ZONES = Object.freeze(['north', 'south', 'tropical']);

/**
 * L1 城市词典（宁窄勿宽：只收「跨半球防误判」必需的南半球＋热带城市——
 * 北半球由 L2/L3 兜底，绝不收北半球城市避免误伤）。主公用例：出生宜昌
 * 现居墨尔本 ⇒ 命中 south ⇒ 南半球初夏——北半球冬装被硬锁拦下。
 */
export const LOCATION_HINT_DICT = Object.freeze({
  south: Object.freeze([
    '墨尔本', '悉尼', '奥克兰', '惠灵顿', '布里斯班', '珀斯', '阿德莱德',
    'Melbourne', 'Sydney', 'Auckland', 'Wellington', 'Brisbane', 'Perth', 'Adelaide',
    'Canberra', 'Hobart',
  ]),
  tropical: Object.freeze([
    '新加坡', '曼谷', '吉隆坡', '雅加达', '马尼拉', '胡志明', '巴厘',
    'Singapore', 'Bangkok', 'Kuala Lumpur', 'Jakarta', 'Manila', 'Ho Chi Minh', 'Bali',
    'Phuket', '普吉',
  ]),
});

/** L2 国家码词典（宁窄勿宽：只收南半球＋热带国家；其余头值跳过走 L3） */
export const COUNTRY_CLIMATE = Object.freeze({
  south: Object.freeze(['AU', 'NZ']),
  tropical: Object.freeze(['SG', 'TH', 'MY', 'ID', 'VN', 'PH']),
});

/** L3 客户端时区词典（宁窄勿宽：南半球＋热带时区白名单；其余 ⇒ north 兜底） */
export const TZ_CLIMATE = Object.freeze({
  south: Object.freeze([
    'Australia/Sydney', 'Australia/Melbourne', 'Australia/Adelaide', 'Australia/Perth',
    'Australia/Canberra', 'Australia/Hobart', 'Australia/Brisbane', 'Pacific/Auckland',
  ]),
  tropical: Object.freeze([
    'Asia/Singapore', 'Asia/Bangkok', 'Asia/Jakarta', 'Asia/Kuala_Lumpur',
    'Asia/Ho_Chi_Minh', 'Asia/Manila',
  ]),
});

/**
 * L1 城市词典侦测（当轮 user 文本命中 ⇒ 气候真值；宁窄勿宽零命中合法）
 * @param {string} text 当轮用户消息
 * @returns {'south'|'tropical'|null}
 */
export function detectLocationClimateHint(text) {
  if (typeof text !== 'string' || !text) return null;
  const low = text.toLowerCase();
  for (const city of LOCATION_HINT_DICT.south) {
    if (text.includes(city) || low.includes(String(city).toLowerCase())) return 'south';
  }
  for (const city of LOCATION_HINT_DICT.tropical) {
    if (text.includes(city) || low.includes(String(city).toLowerCase())) return 'tropical';
  }
  return null;
}

/**
 * 刀三四级无感定位顺位：L1 城市（当轮文本）＞ L2 国家头（cf-ipcountry/
 * x-geo-country）＞ L3 客户端时区 ＞ null（回退现行 geoZone 语义零破坏）。
 * 🔴 本核不吃任何 birth 参数（出生地/现居地解耦铁律——季节判定真源
 *    恒为「此刻所在」）。fail-closed：坏形状 ⇒ null。
 * @param {{locationText?: string|null, countryHeader?: string|null,
 *          timezone?: string|null}} raw
 * @returns {{climate: 'north'|'south'|'tropical'|null, source: 'L1-city'|'L2-country'|'L3-timezone'|null}}
 */
export function resolveCurrentClimate(raw) {
  const r = (raw && typeof raw === 'object') ? raw : {};
  // L1 当轮 user 文本城市词典
  const l1 = detectLocationClimateHint(r.locationText || null);
  if (l1) return { climate: l1, source: 'L1-city' };
  // L2 请求头国家码（ISO2 大写匹配；白名单外跳过）
  const c = String(r.countryHeader || '').trim().toUpperCase();
  if (c && COUNTRY_CLIMATE.south.includes(c)) return { climate: 'south', source: 'L2-country' };
  if (c && COUNTRY_CLIMATE.tropical.includes(c)) return { climate: 'tropical', source: 'L2-country' };
  // L3 客户端时区（白名单精确匹配；其余有效时区 ⇒ north 兜底——与现行
  //    geoZone 北半球语义一致零破坏；无效/缺失 ⇒ null 静默回退）
  const tz = String(r.timezone || '').trim();
  if (tz && TZ_CLIMATE.south.includes(tz)) return { climate: 'south', source: 'L3-timezone' };
  if (tz && TZ_CLIMATE.tropical.includes(tz)) return { climate: 'tropical', source: 'L3-timezone' };
  if (tz && /^[A-Za-z]+\/[A-Za-z_+\-0-9]+$/.test(tz)) return { climate: 'north', source: 'L3-timezone' };
  return { climate: null, source: null };
}

/**
 * 气候带 → E146 季节真值合成帮助（server IIFE 消费——复用 E137 引擎零重造）：
 * south ⇒ 传 'AU' 给 resolveFourFoldTruth（南半球镜像）；tropical ⇒ 季节
 * 强制 warm（常夏湿热·清润理气）；north/null ⇒ null（沿用现行 geoZone）。
 * @param {'north'|'south'|'tropical'|null} climate
 * @returns {{geoZoneOverride: string|null, seasonModeOverride: string|null}}
 */
export function climateSeasonOverride(climate) {
  if (climate === 'south') return { geoZoneOverride: 'AU', seasonModeOverride: null };
  if (climate === 'tropical') return { geoZoneOverride: null, seasonModeOverride: 'warm' };
  return { geoZoneOverride: null, seasonModeOverride: null };
}

/* ═══ 刀三：年龄段三档（出生年推导——只锚气质语感，不出现年龄数字）═══ */
export const AGE_TIERS = Object.freeze(['youth', 'prime', 'mature']);

/**
 * 年龄段解析（<28 youth 青春活泼 / 28–45 prime 从容精进 / >45 mature
 * 成熟沉稳；坏年份 ⇒ null 静默不注入）
 * @param {string|null} birthDateISO 出生日 ISO（YYYY-MM-DD 前缀即可）
 * @param {number} currentYear 当前自然年
 * @returns {'youth'|'prime'|'mature'|null}
 */
export function ageTierOf(birthDateISO, currentYear) {
  const y = Number(String(birthDateISO || '').slice(0, 4));
  const cy = Number(currentYear);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null;
  if (!Number.isFinite(cy) || cy < 1900 || cy > 2200) return null;
  const age = cy - y;
  if (age < 28) return 'youth';
  if (age <= 45) return 'prime';
  return 'mature';
}

/* ═══ 刀三：反季面料拦截（凉季黑名单＋保暖替换——出流兜底级）═══ */
/**
 * 凉季（北/south 寒季）春夏面料黑名单 → 保暖材质替换对（宁窄勿宽：
 * 只收整词连缀形态；zh/en 出流替换，fr/es/th/vi 由 prompt 级纪律守备）
 */
export const COLD_FABRIC_SWAPS = Object.freeze([
  // zh 整词形态（「亚麻」单独形态过宽——只收连缀）
  Object.freeze({ find: '麻衫', swap: '软针织衫' }),
  Object.freeze({ find: '亚麻衫', swap: '软针织衫' }),
  Object.freeze({ find: '亚麻衬衫', swap: '软针织衬衫' }),
  Object.freeze({ find: '亚麻裙', swap: '针织长裙' }),
  Object.freeze({ find: '亚麻面料', swap: '软针织面料' }),
  Object.freeze({ find: '雪纺', swap: '垂坠软呢' }),
  Object.freeze({ find: '吊带', swap: '叠穿针织' }),
  Object.freeze({ find: '短袖', swap: '长袖' }),
  Object.freeze({ find: '薄纱', swap: '呢料' }),
  // en 整词形态
  Object.freeze({ find: 'linen shirt', swap: 'soft-knit shirt' }),
  Object.freeze({ find: 'linen dress', swap: 'soft-knit dress' }),
  Object.freeze({ find: 'chiffon', swap: 'soft drape knit' }),
  Object.freeze({ find: 'camisole', swap: 'layered knit' }),
  Object.freeze({ find: 'tank top', swap: 'long-sleeve knit' }),
  Object.freeze({ find: 'short-sleeve', swap: 'long-sleeve' }),
  Object.freeze({ find: 'short sleeve', swap: 'long sleeve' }),
  Object.freeze({ find: 'sleeveless', swap: 'long-sleeve' }),
]);

/**
 * 刀三出流拦截：凉季气候命中春夏面料黑名单 ⇒ 替换保暖材质（幂等）
 * @param {string} text 出流增量帧文本
 * @param {boolean} coldClimate 当前气候为寒季（北/south 冬季）⇒ 启用拦截
 * @returns {string} 拦截替换后文本（非凉季/坏形状 ⇒ 原文透传）
 */
export function guardSeasonalFabric(text, coldClimate) {
  if (coldClimate !== true) return (typeof text === 'string' ? text : '');
  if (typeof text !== 'string' || !text) return (typeof text === 'string' ? text : '');
  let out = text;
  for (const pair of COLD_FABRIC_SWAPS) {
    if (out.includes(pair.find)) out = out.split(pair.find).join(pair.swap);
  }
  return out;
}

/**
 * E147 出流清洗合成入口（emitDelta 链消费——幂等纯函数；核缺席由
 * server 侧透传守卫兜底）：餐饮零地名剥离（无条件）＋反季面料拦截
 * （coldClimate 才启用）。逐 delta 独立清洗——跨分片断词残留为已知
 * 边界（prompt 戒律为主闸，本清洗为兜底）。
 * @param {string} text 增量帧文本
 * @param {boolean} coldClimate 凉季面料拦截开关
 * @returns {string}
 */
export function washE147Outbound(text, coldClimate) {
  let out = washFoodRegionPrefix(text);
  out = guardSeasonalFabric(out, coldClimate);
  return out;
}

/* ═══ E147 prompt 纪律块（双形态：food 零地名铁令 / outfit 三维硬锁）═══ */

/** 气候真值行（六语——注入 outfit 纪律块「所在地」维度） */
export const L_CLIMATE_TRUTH = Object.freeze({
  south: Object.freeze({
    zh: '主人此刻所在：南半球温带（季节与北半球镜像）——当下为南半球暖季，推荐以清凉透气为主，严禁北半球冬装（大衣/厚呢/叠穿保暖）。',
    en: 'Host location now: Southern Hemisphere temperate (season mirrored) — currently the warm side of the year; favor light breathable pieces, NEVER northern-winter coats or heavy layering.',
    fr: 'Localisation : hémisphère sud tempéré (saison inversée) — saison chaude ; privilégiez léger et respirant, JAMAIS de manteau d’hiver.',
    es: 'Ubicación: hemisferio sur templado (estación invertida) — temporada cálida; prefiere ligero y transpirable, NUNCA abrigo de invierno.',
    th: 'ที่อยู่ปัจจุบัน: ซีกโลกใต้ (ฤดูกลับข้าง) — ช่วงอบอุ่น เน้นผ้าเบาสบาย ห้ามเสื้อหนาหรือสายชั้นหนา',
    vi: 'Vị trí: nam bán cầu ôn đới (mùa đảo ngược) — mùa ấm; ưu tiên nhẹ thoáng, TUYỆT ĐỐI không áo đông nặng.',
  }),
  tropical: Object.freeze({
    zh: '主人此刻所在：热带常夏（全年湿热）——推荐以清润透气为主，严禁厚重保暖材质（呢料/羊绒/叠穿保暖）。',
    en: 'Host location now: tropical, perpetual summer (humid year-round) — favor light breathable pieces, NEVER heavy warm fabrics (wool coats, cashmere, warm layering).',
    fr: 'Localisation : zone tropicale, été perpétuel — privilégiez léger et respirant, JAMAIS de laine épaisse ni cachemire.',
    es: 'Ubicación: trópico, verano perpetuo — prefiere ligero y transpirable, NUNCA lana pesada ni capas cálidas.',
    th: 'ที่อยู่ปัจจุบัน: เขตร้อนชื้นตลอดปี เน้นผ้าเบาสบาย ห้ามผ้าหนาหรือชั้นอุ่น',
    vi: 'Vị trí: vùng nhiệt đới, mùa hè quanh năm — ưu tiên nhẹ thoáng, TUYỆT ĐỐI không len dày hay lớp ấm.',
  }),
});

/** 年龄档气质锚（六语——注入 outfit 纪律块「年龄段」维度；零年龄数字） */
export const L_AGE_TIER = Object.freeze({
  youth: Object.freeze({
    zh: '年龄段气质锚：青春灵动——版型利落轻快、色彩明快有生气，语感活泼不做老成。',
    en: 'Age-tier anchor: youthful spirit — crisp cuts, lively colors, an energetic voice, nothing old-soul.',
    fr: 'Ancrage d’âge : énergie juvénile — coupes nettes, couleurs vives, ton vif, rien de sobre.',
    es: 'Ancla de edad: energía juvenil — cortes limpios, colores vivos, voz enérgica, nada sobria.',
    th: 'สายอายุ: ความสดใสวัยเยาว์ เส้นตัดคม สีสันมีชีวิต น้ำเสียงกระฉับกระเฉง',
    vi: 'Mỏ neo độ tuổi: sức trẻ — đường cắt gọn, màu tươi, giọng năng động, không già dặn.',
  }),
  prime: Object.freeze({
    zh: '年龄段气质锚：从容精进——版型挺括合身、色彩克制有质感，语感沉稳干练。',
    en: 'Age-tier anchor: composed prime — structured fits, restrained refined colors, a steady capable voice.',
    fr: 'Ancrage d’âge : prime sereine — coupes structurées, couleurs retenues et qualitatives, voix posée.',
    es: 'Ancla de edad: plenitud serena — cortes estructurados, colores contenidos y de calidad, voz serena.',
    th: 'สายอายุ: วัยมั่นคง เส้นตัดมีโครง สีสงบมีคุณภาพ น้ำเสียงมั่นใจ',
    vi: 'Mỏ neo độ tuổi: độ chín chắn — dáng chắc, màu trầm có chất, giọng điềm đạm.',
  }),
  mature: Object.freeze({
    zh: '年龄段气质锚：成熟沉稳——版型宽松有余量、色彩温润低调，语感从容不迫。',
    en: 'Age-tier anchor: mature ease — relaxed cuts with ease, muted warm colors, an unhurried voice.',
    fr: 'Ancrage d’âge : maturité tranquille — coupes amples, teintes douces et discrètes, voix posée.',
    es: 'Ancla de edad: madurez serena — cortes holgados, tonos suaves y discretos, voz tranquila.',
    th: 'สายอายุ: วัยช้าง ผ้าสบายมีช่องว่าง สีอุ่นไม่ฉูดฉาด น้ำเสียงสุขุม',
    vi: 'Mỏ neo độ tuổi: trưởng thành — dáng thoải mái, màu trầm ấm, giọng thong thả.',
  }),
});

/**
 * E147 纪律块（server 路由内后缀拼接消费——E146 IIFE 后并列挂载）：
 *   focus==='food' ⇒ 餐饮零地名铁令块；focus==='outfit' ⇒ 着装三维
 *   硬锁块（所在地气候真值行＋年龄段锚＋反季面料黑名单）；其他 ⇒ ''
 *   （fail-closed 静默——E146 未触发时 E147 同步静默零注入）。
 * @param {string} lang 六语
 * @param {{focus?: 'food'|'outfit'|null, climate?: string|null,
 *          ageTier?: string|null}} ctx
 * @returns {string} prompt 块（''＝不注入）
 */
export function buildE147GuardBlock(lang, ctx) {
  const l = sanitizeLang(lang);
  const c = (ctx && typeof ctx === 'object') ? ctx : {};
  const focus = (c.focus === 'food' || c.focus === 'outfit') ? c.focus : null;
  if (!focus) return '';
  const T = {
    zh: {
      foodHead: '【E147 饮膳零地名铁令（军令 2026-11-19，违反即失败）】',
      foodRule: '- 菜名一律零地名零菜系前缀：绝不出现「潮汕」「广式」「川味」「日式」等任何地域/菜系连缀；只以食材＋做法＋口感＋温润属性描述（如「清炖牛腩汤」而非「潮汕清炖牛腩」）；家常灶火感优先，出流自动清洗兜底剥离地名。',
      outfitHead: '【E147 着装三维硬锁（军令 2026-11-19，违反即失败）】',
      outfitDim: '- 三维顺位：①季节（时令寒热）②主人此刻所在地气候（真值行注入，非出生地）③年龄段气质锚（出生年推导）；三者共同裁决材质与版型，与出生地无关。',
      fabricBan: '- 反季面料黑名单：当地为寒季时，严禁麻/亚麻/雪纺/吊带/短袖/薄纱等春夏材质；只推软针织、羊绒、呢料、叠穿保暖材质（出流自动拦截替换兜底）。',
    },
    en: {
      foodHead: '[E147 ZERO-REGION FOOD LAW (directive 2026-11-19 — violation = failure)]',
      foodRule: '- Dish names carry ZERO region or cuisine prefixes: never “Chaozhou”, “Cantonese-style”, “Sichuan” or any regional tag; describe only ingredient + method + texture + warming quality (e.g. “slow-stewed beef soup”, not “Chaozhou beef stew”); home-kitchen feel first; outbound wash strips regions as backstop.',
      outfitHead: '[E147 OUTFIT TRIPLE-LOCK (directive 2026-11-19 — violation = failure)]',
      outfitDim: '- Triple order: ① season (cold-dry tone) ② host CURRENT location climate (truth line injected — NOT birthplace) ③ age-tier anchor (derived from birth year); fabric and cut follow all three, birthplace never enters.',
      fabricBan: '- Off-season fabric blacklist: when the host is in a cold season, linen / chiffon / camisole / short sleeves / gauze are FORBIDDEN; only soft knits, cashmere, wool blends, warm layering (outbound guard swaps as backstop).',
    },
    fr: {
      foodHead: '[E147 LOI ZÉRO-RÉGION (directive 2026-11-19 — violation = échec)]',
      foodRule: '- Aucun plat ne porte de préfixe régional : jamais « à la cantonaise » ni tag régional ; uniquement ingrédient + méthode + texture + chaleur (ex. « soupe de bœuf mijotée ») ; ton cuisine maison ; nettoyage en sortie en filet.',
      outfitHead: '[E147 TRIPLE VERROU TENUE (directive 2026-11-19 — violation = échec)]',
      outfitDim: '- Triple ordre : ① saison ② climat ACTUEL de l’hôte (ligne de vérité — PAS le lieu de naissance) ③ ancre d’âge ; la naissance n’entre jamais en ligne de compte.',
      fabricBan: '- Tissus hors-saison interdits en saison froide : lin, chiffon, décolleté bretelles, manches courtes ; uniquement maille douce, cachemire, laine (garde en sortie).',
    },
    es: {
      foodHead: '[E147 LEY CERO-REGIÓN (directiva 2026-11-19 — violación = fallo)]',
      foodRule: '- Ningún plato lleva prefijo regional: jamás «estilo cantonés» ni etiqueta de región; solo ingrediente + método + textura + calidez (p. ej. «sopa de res estofada»); tono de cocina casera; lavado de salida como respaldo.',
      outfitHead: '[E147 TRIPLE CANDADO DE VESTUARIO (directiva 2026-11-19 — violación = fallo)]',
      outfitDim: '- Triple orden: ① estación ② clima ACTUAL del anfitrión (línea de verdad — NO el lugar de nacimiento) ③ ancla de edad; el nacimiento nunca cuenta.',
      fabricBan: '- Telas de temporada prohibidas en frío: lino, chiffon, tirantes, manga corta; solo punto suave, cachemir, lana (guardia de salida).',
    },
    th: {
      foodHead: '[E147 กฎอาหารไร้ภูมิภาค (คำสั่ง 2026-11-19 — ผิด = ล้มเหลว)]',
      foodRule: '- ชื่ออาหารห้ามนำหน้าด้วยชื่อท้องถิ่นหรือสายอาหาร บรรยายแค่วัตถุดิบ วิธีทำ สัมผัส และความอบอุ่น เช่นซุปเนื้อตุ๋น ไม่ใช่ซุปเนื้อสายเจียว กลิ่นครัวบ้านก่อน',
      outfitHead: '[E147 สามล็อกเสื้อผ้า (คำสั่ง 2026-11-19 — ผิด = ล้มเหลว)]',
      outfitDim: '- ลำดับสามมิติ: ① ฤดูกาล ② ภูมิอากาศปัจจุบันของเจ้าของ (ไม่ใช่ถิ่นเกิด) ③ สายอายุ ถิ่นเกิดไม่มีส่วนเกี่ยว',
      fabricBan: '- ผ้าผิดฤดูต้องห้ามช่วงหนาว: ลินิน ชิฟฟอน สายเดี่ยว แขนสั้น ใช้แต่ผ้าถักนุ่ม แคชเมียร์ ขนสัตว์',
    },
    vi: {
      foodHead: '[E147 LUẬT MÓN ĂN KHÔNG ĐỊA DANH (chỉ thị 2026-11-19 — vi phạm = lỗi)]',
      foodRule: '- Tên món tuyệt đối không mang tiền tố vùng miền: chỉ nguyên liệu + cách nấu + khẩu cảm + độ ấm (ví dụ «canh bò hầm», không «bò hầm kiểu Triều Châu»); chất bếp nhà; rửa đầu ra làm chốt chặn.',
      outfitHead: '[E147 BA KHÓA TRANG PHỤC (chỉ thị 2026-11-19 — vi phạm = lỗi)]',
      outfitDim: '- Thứ tự ba chiều: ① mùa ② khí hậu HIỆN TẠI của chủ nhân (không phải quê quán) ③ mỏ neo độ tuổi; quê quán không bao giờ được dùng.',
      fabricBan: '- Vải lệch mùa cấm khi lạnh: lanh, chiffon, dây kéo, tay ngắn; chỉ len mềm, cashmere, len dệt (chốt chặn đầu ra).',
    },
  };
  const d = T[l] || T.en;
  const lines = [];
  if (focus === 'food') {
    lines.push(d.foodHead, d.foodRule);
  } else {
    lines.push(d.outfitHead, d.outfitDim);
    const cl = (c.climate === 'south' || c.climate === 'tropical')
      ? (L_CLIMATE_TRUTH[c.climate][l] || L_CLIMATE_TRUTH[c.climate].en) : null;
    if (cl) lines.push(`- 所在地气候真值 / Location truth: ${cl}`);
    const at = (c.ageTier === 'youth' || c.ageTier === 'prime' || c.ageTier === 'mature')
      ? (L_AGE_TIER[c.ageTier][l] || L_AGE_TIER[c.ageTier].en) : null;
    if (at) lines.push(`- ${at}`);
    lines.push(d.fabricBan);
  }
  lines.push('');
  return lines.join('\n');
}
