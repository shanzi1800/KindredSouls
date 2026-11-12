/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E137-ASTRO-SEASONAL-WELLNESS-ENGINE 刀一（主公军令 2026-11-12）：
 * 星盘×时令健康正能量处方引擎（食愈/嗅觉/轻动/漫游四维匹配）
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：将用户的精确星盘特征（四元素 Fire/Earth/Air/Water）与当前节气时令
 * （南北半球镜像反转＋六语自适应）深度咬合，锻造「星盘时令能量处方引擎」。
 *   · 输入：chartSignature（主导元素＋可选天象相位）＋ timestamp ＋ geoZone；
 *   · 输出：四维正能量处方（functional_elixir / aura_scent / mindful_movement /
 *     seasonal_outing）＋三级供应链软植入元数据（WellnessSupplySlot）；
 *   · 12 套严选模板＝四元素 × 三季群（cool 寒季敛补 / mild 转换升发 /
 *     warm 暖季清心）；balanced 兜底＝土枢（土主运化，普适温和）；
 *   · 南北半球镜像：geoZone 'AU'（澳新生态圈）⇒ 南半球；11 月北半球
 *     「初冬·敛阴护阳·温补润燥」vs 南半球「孟夏·清心降火·补水活络」。
 * 🔴 铁律沿袭：零网络零外部服务（纯函数静态资产）；零货币符号（$/¥/€）、
 *   零促销词（购买/打折/促销/优惠券/buy/discount/promo）；sponsorBrand 恒 null；
 *   六语文案内嵌单源（仿 E124 lifestyleMuseData 先例——零 i18n 新键，
 *   i18n 六键只承载维度标签）；fail-closed——坏形状一律回退兜底绝不崩溃。
 * 消费方：server.js（familiar/chat prompt 注入＋/go/:remedyId 路由白名单）＋
 * WellnessRxSlot.tsx（对话舱处方卡）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 官方六语（Soul OS 语言底座——与 LIFESTYLE_LOCALES 同源） */
export const WELLNESS_RX_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** 四元素白名单（＋balanced 兜底象限） */
export const WELLNESS_ELEMENTS = Object.freeze(['fire', 'earth', 'air', 'water', 'balanced']);

/** 三季群（寒季敛补 / 转换升发 / 暖季清心） */
export const WELLNESS_SEASON_MODES = Object.freeze(['cool', 'mild', 'warm']);

/** 四维处方类别（军令钦定序） */
export const WELLNESS_RX_CATEGORIES = Object.freeze(['elixir', 'scent', 'movement', 'outing']);

/** 十二宫 → 四元素映射（natal.sign 英文名真源——server FAM_SIGN_ZH 键同形） */
const SIGN_TO_ELEMENT = Object.freeze({
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
});

/** 未知语回退（沿 legalTerms.mjs 先例——绝不崩溃） */
function _rxLang(lang) {
  const s = String(lang || '').trim().toLowerCase();
  return WELLNESS_RX_LOCALES.includes(s) ? s : 'en';
}

/** 半球判定（单源：AU 澳新生态圈 ⇒ 南半球；其余/null ⇒ 北半球 fail-closed） */
export function resolveHemisphere(geoZone) {
  return geoZone === 'AU' ? 'south' : 'north';
}

/** 四季名（六语——北半球基准；南半球由镜像反转取用） */
const SEASON_NAMES = Object.freeze({
  winter: { zh: '初冬', en: 'Early Winter', fr: 'Début d’hiver', es: 'Inicio del Invierno', th: 'ต้นฤดูหนาว', vi: 'Đầu Đông' },
  spring: { zh: '仲春', en: 'Mid-Spring', fr: 'Milieu du printemps', es: 'Mediados de la Primavera', th: 'กลางฤดูใบไม้ผลิ', vi: 'Giữa Xuân' },
  summer: { zh: '孟夏', en: 'Early Summer', fr: 'Début d’été', es: 'Inicio del Verano', th: 'ต้นฤดูร้อน', vi: 'Đầu Hạ' },
  autumn: { zh: '深秋', en: 'Deep Autumn', fr: 'Automne profond', es: 'Otoño profundo', th: 'ปลายฤดูใบไม้ร่วง', vi: 'Cuối Thu' },
});

/** 北半球月 → 季节（3~5 春 / 6~8 夏 / 9~10 秋 / 11~2 冬——军令钦定 11 月＝初冬） */
const MONTH_SEASON_NORTH = Object.freeze([
  'winter', 'winter', 'spring', 'spring', 'spring',
  'summer', 'summer', 'summer', 'autumn', 'autumn', 'winter', 'winter',
]);

/** 季群（cool 寒季敛补 / mild 转换升发 / warm 暖季清心） */
const SEASON_MODE = Object.freeze({
  winter: 'cool', autumn: 'cool',
  spring: 'mild',
  summer: 'warm',
});

/** 季群气质标签（六语——军令钦定逐字：北半球初冬「敛阴护阳·温补润燥」vs 南半球孟夏「清心降火·补水活络」） */
const MODE_TERMS = Object.freeze({
  cool: { zh: '敛阴护阳 · 温补润燥', en: 'Gather Yin, Guard Yang · Warm & Moisten', fr: 'Rassemblement du Yin, garde du Yang · réchauffer et hydrater', es: 'Reunir el Yin, custodiar el Yang · templar e hidratar', th: 'สะสมหยิน พิทักษ์หยาง · อบอุ่นและชุ่มชื้น', vi: 'Liễm Âm Hộ Dương · Ôn bổ nhuận táo' },
  mild: { zh: '升发疏肝 · 轻清疏导', en: 'Lift & Disperse · Light Clearing', fr: 'Élévation et dispersion · légèreté clarifiante', es: 'Elevar y dispersar · claridad ligera', th: 'กระตุ้นและระบาย · เบาสบายปลอดโปร่ง', vi: 'Thăng phát sơ can · Khinh thanh sơ đạo' },
  warm: { zh: '清心降火 · 补水活络', en: 'Cool the Heart, Calm the Fire · Hydrate & Flow', fr: 'Rafraîchir le cœur, apaiser le feu · hydrater et fluidifier', es: 'Refrescar el corazón, calmar el fuego · hidratar y activar', th: 'เย็นใจสงดไฟ · เติมน้ำและไหลเวียน', vi: 'Thanh tâm giáng hỏa · Bổ thủy hoạt lạc' },
});

/** 天象相位白名单（军令输入接口——轻量调制，禁臆造） */
const WELLNESS_SKY_EVENTS = Object.freeze(['mercury_retrograde', 'full_moon', 'fire_square']);

/**
 * 时令解析（纯函数核）：
 * @param {number|string|Date} timestamp 毫秒值/ISO 串/Date（坏形状 ⇒ 当前时刻）
 * @param {'north'|'south'} hemisphere
 * @returns {{ month:number, season:string, seasonName:string, mode:string, termLabel:string }}
 */
export function resolveSeasonMode(timestamp, hemisphere) {
  let d = null;
  if (timestamp instanceof Date) d = timestamp;
  else if (typeof timestamp === 'number' && Number.isFinite(timestamp)) d = new Date(timestamp);
  else if (typeof timestamp === 'string' && timestamp.trim()) {
    const parsed = new Date(timestamp);
    d = Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const month = d ? d.getUTCMonth() : new Date().getUTCMonth();
  const northSeason = MONTH_SEASON_NORTH[month] || 'winter';
  // 南北半球镜像反转：季节对极（冬↔夏 / 春↔秋）
  const mirror = { winter: 'summer', summer: 'winter', spring: 'autumn', autumn: 'spring' };
  const season = (hemisphere === 'south') ? (mirror[northSeason] || northSeason) : northSeason;
  const mode = SEASON_MODE[season] || 'cool';
  return { month: month + 1, season, mode };
}

/** 星盘元素推导（natal 五星英文星座名 → 四元素众数；空/坏形状 ⇒ balanced 兜底土枢） */
export function deriveDominantElement(natalSigns) {
  if (!Array.isArray(natalSigns)) return 'balanced';
  const tally = { fire: 0, earth: 0, air: 0, water: 0 };
  let valid = 0;
  for (const raw of natalSigns) {
    const sign = (typeof raw === 'string' && typeof raw === 'string') ? raw.trim() : '';
    const el = SIGN_TO_ELEMENT[sign.charAt(0).toUpperCase() + sign.slice(1)];
    if (el) { tally[el] += 1; valid += 1; }
  }
  if (!valid) return 'balanced';
  let best = 'earth';
  let bestCount = -1;
  for (const el of ['fire', 'earth', 'air', 'water']) {
    if (tally[el] > bestCount) { best = el; bestCount = tally[el]; }
  }
  return best;
}

/* ═══════════════ 四维处方模板库（12 套＝四元素 × 三季群；balanced ⇒ 土枢） ═══════════════ */

/** 维度 A · 食愈茶饮与天然营养（functional_elixir）——12 套（元素 × 季群） */
const RX_ELIXIR = Object.freeze({
  fire: Object.freeze({
    cool: Object.freeze({
      remedyId: 'rx-elixir-ashwagandha-01', ingredientsKey: 'ashwagandha_magnesium',
      prescription: {
        zh: '南非醉茄＋甘氨酸镁晚安草本饮——沉降白日的火气，把神经轻轻放回夜里',
        en: 'Ashwagandha with magnesium glycinate evening infusion — settles the day’s fire and lays the nerves gently down to rest',
        fr: 'Infusion du soir ashwagandha et glycinate de magnésium — apaise le feu de la journée et dépose les nerfs dans la nuit',
        es: 'Infusión nocturna de ashwagandha y glicinato de magnesio — asienta el fuego del día y acompaña los nervios hacia el descanso',
        th: 'ชาสมุนไพรก่อนนอน แอชวากันดาและแมกนีเซียมไกลซิเนต — สงบไฟแห่งกลางวัน พาเส้นประสาทกลับสู่ความหลับ',
        vi: 'Nước thảo mộc tối ashwagandha và magnesium glycinate — điềm tĩnh lửa ban ngày, đặt thần kinh nhẹ nhàng vào đêm',
      },
    }),
    mild: Object.freeze({
      remedyId: 'rx-elixir-chrysanthemum-05', ingredientsKey: 'chrysanthemum_goji',
      prescription: {
        zh: '菊花枸杞决明子清润茶——春升之季替旺盛肝火开一扇疏解的窗',
        en: 'Chrysanthemum, goji and cassia seed clearing tea — opens a vent for the rising spring fire',
        fr: 'Tisane clarifiante chrysanthème, baie de goji et graine de cassia — ouvre une soupape au feu ascendant du printemps',
        es: 'Té depurativo de crisantemo, goji y semilla de casia — abre una vía al fuego ascendente de primavera',
        th: 'ชาเก็บฮวยโกจิและเมล็ดเจ็ดเม็ดยอดรั้ว — เปิดช่องระบายไฟที่พุ่งขึ้นในฤดูใบไม้ผลิ',
        vi: 'Trà cúc hoa kỳ tử quyết minh tử thanh nhuận — mở một cửa xả cho hỏa khí mùa xuân thăng phát',
      },
    }),
    warm: Object.freeze({
      remedyId: 'rx-elixir-mintcoconut-09', ingredientsKey: 'mint_chamomile_coconut',
      prescription: {
        zh: '薄荷椰子水＋洋甘菊冷萃——盛夏心火升腾时的一泓清凉',
        en: 'Mint coconut water with chilled chamomile brew — a cool spring for the heart when summer fire rises',
        fr: 'Eau de coco à la menthe et infusion glacée de camomille — une source fraîche quand le feu du cœur s’élève en été',
        es: 'Agua de coco con menta y manzanilla fría — un manantial fresco cuando el fuego del corazón sube en pleno verano',
        th: 'น้ำมะพร้าวใส่มินต์และชาคาโมมายเย็น — สายธารเย็นเมื่อไฟในใจลุกโชนกลางฤดูร้อน',
        vi: 'Nước dừa bạc hà cùng cúc La Mã ủ lạnh — một dòng mát khi hỏa khí mùa hè bốc lên',
      },
    }),
  }),
  earth: Object.freeze({
    cool: Object.freeze({
      remedyId: 'rx-elixir-coq10-02', ingredientsKey: 'coq10_eleuthero',
      prescription: {
        zh: '辅酶 Q10＋刺五加元气果昔——为沉缓的土象代谢重新点上炉火',
        en: 'CoQ10 with eleuthero vitality smoothie — rekindles the hearth of a slow earth metabolism',
        fr: 'Smoothie vitalité CoQ10 et éléuthérocoque — rallume le foyer d’un métabolisme de terre ralenti',
        es: 'Batido de vitalidad CoQ10 y eleuteroco — reenciende el hogar de un metabolismo de tierra lento',
        th: 'สมูทตี้ความสดใส CoQ10 และเอลิวเทโร — จุดไฟในเตาเผาสำหรับระบบเผาผลาญที่ช้า',
        vi: 'Sinh tố CoQ10 và thích ngũ gia — nhóm lại lò sưởi cho chuyển hóa mệnh Thổ trầm chậm',
      },
    }),
    mild: Object.freeze({
      remedyId: 'rx-elixir-poria-06', ingredientsKey: 'poria_yam',
      prescription: {
        zh: '茯苓山药米乳温饮——换季时给脾胃一层绵密的托底',
        en: 'Warm poria and yam rice milk — a soft layer of ballast for the digestion in shifting seasons',
        fr: 'Lait de riz chaud au poria et igname — un rempart doux pour la digestion entre deux saisons',
        es: 'Leche de arroz tibia con poria e ñame — un respaldo suave para la digestión en el cambio de estación',
        th: 'นมข้าวอุ่นฟู่หลิงและเผือก — ชั้นรองรับที่นุ่มนวลให้ระบบย่อยในฤดูกาลที่เปลี่ยน',
        vi: 'Sữa gạo ấm phục linh và hoài sơn — một lớp đỡ êm dịu cho tỳ vị lúc giao mùa',
      },
    }),
    warm: Object.freeze({
      remedyId: 'rx-elixir-tangerine-10', ingredientsKey: 'tangerine_lotus_leaf',
      prescription: {
        zh: '陈皮荷叶薏米轻身饮——暑湿裹身时的一服清爽梳理',
        en: 'Tangerine peel, lotus leaf and Job’s tears lightening brew — a crisp combing-through when summer dampness lingers',
        fr: 'Infusion allégée écorce de mandarine, feuille de lotus et larmes de Job — un peigne frais quand l’humidité d’été s’attarde',
        es: 'Infusión ligera de cáscara de mandarina, hoja de loto y lágrimas de Job — un peinado fresco cuando la humedad veraniega envuelve',
        th: 'เครื่องดื่มเบาเปลือกส้มจี้ ใบบัว และเมล็ดหมี่ — สางความอืดอาดชื้นแฉะแห่งฤดูร้อนให้ปลิวไป',
        vi: 'Nước giải nhẹ trần bì lá sen ý dĩ — lược mát khi thử thấp mùa hạ quấn lấy người',
      },
    }),
  }),
  air: Object.freeze({
    cool: Object.freeze({
      remedyId: 'rx-elixir-turmeric-03', ingredientsKey: 'turmeric_blackpepper_oat',
      prescription: {
        zh: '姜黄黑胡椒温热燕麦饮——思绪凝滞的寒晨，替头脑化开一层薄雾',
        en: 'Warm turmeric, black pepper and oat brew — melts the morning mist when thoughts turn sluggish',
        fr: 'Boisson chaude curcuma, poivre noir et avoine — dissout la brume matinale quand les pensées s’engourdissent',
        es: 'Bebida tibia de cúrcuma, pimienta negra y avena — deshace la niebla matinal cuando el pensamiento se enturbia',
        th: 'เครื่องดื่มข้าวโอ๊ตอุ่นขมิ้นและพริกไทยดำ — ละลายหมอกบางเช้าวันหนาวเมื่อความคิดเื่องช้า',
        vi: 'Nước bột yến mạch ấm nghệ vàng tiêu đen — tan đi màn sương sớm khi tư duy trì trệ',
      },
    }),
    mild: Object.freeze({
      remedyId: 'rx-elixir-silverneedle-07', ingredientsKey: 'silverneedle_elderflower',
      prescription: {
        zh: '白毫银针＋接骨木花轻萃——春风吹散思绪时的一盏定风茶',
        en: 'Silver needle white tea with elderflower light infusion — an anchor cup when spring winds scatter the mind',
        fr: 'Thé blanc aiguilles d’argent et fleur de sureau léger — une tasse d’ancre quand les vents de printemps dispersent l’esprit',
        es: 'Té blanco agujas de plata con flor de saúco ligera — una taza de anclaje cuando los vientos primaverales dispersan la mente',
        th: 'ชาขาวเงินเข็มกับชาดอกเอลเดอร์เบอร์รีเบาๆ — ถ้วยชาหยุดลมเมื่อสายลมฤดูใบไม้ผลิทำความคิดปลิว',
        vi: 'Trà bạch hào ngân châm cùng hoa cơm cháy ủ nhẹ — một chén neo tâm khi gió xuân cuốn bay suy nghĩ',
      },
    }),
    warm: Object.freeze({
      remedyId: 'rx-elixir-jasmine-11', ingredientsKey: 'jasmine_lime_cucumber',
      prescription: {
        zh: '茉莉银针冷泡＋青柠黄瓜水——把飘在热浪里的思绪凉镇下来',
        en: 'Cold-brew jasmine silver needle with lime-cucumber water — chills thoughts adrift in the heatwave',
        fr: 'Jasmin aiguilles d’argent à froid et eau citron-concombre — rafraîche les pensées dérivant dans la canicule',
        es: 'Jazmín agujas de plata en frío con agua de lima y pepino — enfría los pensamientos que derivan en la ola de calor',
        th: 'ชาเย็นมะลิเงินเข็มกับน้ำมะนาวแตงกวา — ทำให้ความคิดที่ล่องลอยในคลื่นความร้อนเย็นลง',
        vi: 'Trà lài ủ lạnh cùng nước chanh dưa leo — hạ nhiệt những suy nghĩ trôi theo sóng nóng',
      },
    }),
  }),
  water: Object.freeze({
    cool: Object.freeze({
      remedyId: 'rx-elixir-longan-04', ingredientsKey: 'longan_jujube_ginger',
      prescription: {
        zh: '桂圆红枣姜母茶——给寒季里流速放缓的水象血脉添一把温柔的内焰',
        en: 'Longan, red jujube and ginger mother tea — a gentle inner flame for water-blood running slower in the cold',
        fr: 'Thé longane, jujube rouge et gingembre mère — une flamme intérieure douce pour un sang d’eau qui ralentit au froid',
        es: 'Té de longan, azufaifo rojo y jengibre madre — una llama interior suave para la sangre de agua que se ralentiza con el frío',
        th: 'ชาลำไย อินทผลัม และขิงแม่ทอด — เปลวไฟภายในที่อ่อนโยนให้กระแสเลือดธาตุน้ำที่ไหลช้าลงในหนาว',
        vi: 'Trà nhãn táo đỏ gừng — ngọn lửa dịu dàng cho huyết mạch mệnh Thủy chảy chậm trong giá lạnh',
      },
    }),
    mild: Object.freeze({
      remedyId: 'rx-elixir-mulberry-08', ingredientsKey: 'mulberry_goji',
      prescription: {
        zh: '桑葚枸杞温酿饮——春水初涨时替情绪河道清一次淤',
        en: 'Warm mulberry and goji brew — dredges the emotional riverbed as spring waters first rise',
        fr: 'Infusion chaude mûre et baie de goji — drague le lit émotionnel quand les eaux du printemps montent',
        es: 'Infusión tibia de mora y goji — draga el cauce emocional cuando las aguas de primavera suben',
        th: 'เครื่องดื่มอุ่นหม่อนและโกจิ — ขุดลอกก้นบึนทางอารมณ์เมื่อน้ำฤดูใบไม้ผลิเริ่มหลาก',
        vi: 'Nước ấm dâu tằm kỳ tử — nạo vét lòng sông cảm xúc khi nước xuân vừa lên',
      },
    }),
    warm: Object.freeze({
      remedyId: 'rx-elixir-hibiscus-12', ingredientsKey: 'hibiscus_rose_electrolyte',
      prescription: {
        zh: '洛神花玫瑰冷萃电解质水——暑气蒸腾时替水象补回流失的潮汐',
        en: 'Hibiscus-rose cold brew electrolyte water — restores the tide a water sign loses to rising heat',
        fr: 'Infusion froide hibiscus et rose, eau électrolytique — restitue la marée que le signe d’eau perd à la chaleur',
        es: 'Frío de hibisco y rosa con agua electrolítica — devuelve la marea que un signo de agua pierde con el calor',
        th: 'ชาเย็นกระเจี๊ยบและกุหลาบผสมเกลือแร่ — คืนกระแสน้ำที่ธาตุน้ำสูญเสียในความร้อน',
        vi: 'Nước úp lạnh hoa atiso đỏ hoa hồng chất điện giải — trả lại con thủy triều mà mệnh Thủy mất vào nắng nóng',
      },
    }),
  }),
});

/** 维度 B · 嗅觉气场结界（aura_scent）——4 套（随元素） */
const RX_SCENT = Object.freeze({
  fire: Object.freeze({
    remedyId: 'rx-scent-vetiver-01', ingredientsKey: 'vetiver_white_sage',
    prescription: {
      zh: '岩兰草＋白鼠尾草单方精油——深根的烟土气替烈火围一圈沉静结界',
      en: 'Vetiver with white sage essential oil — a circle of stillness drawn by smoky, deep-rooted earth around the blaze',
      fr: 'Huile essentielle vétiver et sauge blanche — un cercle de calme tracé par la terre fumée et enracinée autour du brasier',
      es: 'Aceite esencial de vetiver y salvia blanca — un círculo de quietud trazado por la tierra ahumada y arraigada en torno al fuego',
      th: 'น้ำมันหอมระเหยเว็ทเวอร์และเสจขาว — วงแหวนความสงบที่ควันดินลึกล้อมไฟอันแผดจ้า',
      vi: 'Tinh dầu cỏ vetiver và ngải trắng — vòng kết tĩnh lặng do khói đất sâu rộn quanh đám lửa',
    },
  }),
  earth: Object.freeze({
    remedyId: 'rx-scent-bergamot-02', ingredientsKey: 'bergamot_sweetorange',
    prescription: {
      zh: '佛手柑＋甜橙复方精油——阳光果香替厚土揭开一扇明亮的窗',
      en: 'Bergamot with sweet orange blend — citrus sunlight lifts a bright window through heavy earth',
      fr: 'Synergie bergamote et orange douce — un soleil d’agrumes ouvre une fenêtre claire dans la terre épaisse',
      es: 'Sinergia de bergamota y naranja dulce — un sol cítrico abre una ventana luminosa en la tierra densa',
      th: 'น้ำมันผสมเบอร์กามอตและส้มหวาน — แสงตะวันจากผลไม้เปิดหน้าต่างสว่างในดินหนา',
      vi: 'Tinh dầu hỗn hợp bergamot và cam ngọt — nắng cam mở một cửa sổ sáng xuyên lớp đất dày',
    },
  }),
  air: Object.freeze({
    remedyId: 'rx-scent-cedar-03', ingredientsKey: 'cedar_atlantic_frankincense',
    prescription: {
      zh: '大西洋雪松＋乳香精油——木质与树脂的定风香气，收拢四散的思绪',
      en: 'Atlantic cedar with frankincense oil — wood and resin anchor the winds and gather scattered thoughts',
      fr: 'Cèdre de l’Atlas et encens — le bois et la résine ancrent les vents et rassemblent les pensées éparses',
      es: 'Cedro del Atlas e incienso — la madera y la resina anclan los vientos y reúnen los pensamientos dispersos',
      th: 'น้ำมันสนซีดาร์แอตแลนติกและกำยาน — กลิ่นไม้และยางไม้หยุดลมและรวบความคิดที่กระจัดกระจาย',
      vi: 'Tinh dầu tuyết tùng Đại Tây Dương và nhũ hương — gỗ và nhựa neo gió, thu về tư tán lạc',
    },
  }),
  water: Object.freeze({
    remedyId: 'rx-scent-sandalwood-04', ingredientsKey: 'sandalwood_rose',
    prescription: {
      zh: '檀香＋玫瑰精油——温润木质裹住花心，替柔软的情绪穿上护甲',
      en: 'Sandalwood with rose oil — warm wood cradles the floral heart and armors tender feeling',
      fr: 'Santal et rose — le bois chaud berce le cœur floral et protège l’émotion tendre',
      es: 'Sándalo y rosa — la madera tibia mece el corazón floral y blinda la emoción tierna',
      th: 'น้ำมันจันทน์กับกุหลาบ — ไม้หอมอุ่นโอบอุ้มหัวใจดอกไม้ ให้เกราะป้องกันความรู้สึกบอบบาง',
      vi: 'Tinh dầu đàn hương và hoa hồng — gỗ ấm ôm lấy tâm hoa, mặc cho cảm xúc mềm một tầng giáp',
    },
  }),
});

/** 维度 C · 身形能量疏通（mindful_movement）——4 套（随元素；15~20 分钟微习惯） */
const RX_MOVEMENT = Object.freeze({
  fire: Object.freeze({
    remedyId: 'rx-movement-grounding-01', ingredientsKey: 'forest_grounding',
    prescription: {
      zh: '林间赤足接地 18 分钟——把过载的火气顺着脚底交还给大地',
      en: '18 minutes of barefoot forest grounding — hands the overcharged fire back to the earth through your soles',
      fr: '18 minutes de marche pieds nus en forêt — rend au sol, par la plante des pieds, le feu en surcharge',
      es: '18 minutos de conexión a tierra descalzo en el bosque — devuelve por las plantas de los pies el fuego sobrecargado',
      th: 'เดินเท้าเปล่าสัมผัสหญ้า 18 นาที — ส่งไฟที่เป็นพิษคืนแผ่นดินผ่านฝ่าเท้า',
      vi: '18 phút đi chân trần tiếp đất trong rừng — trả lại lửa quá tải cho lòng đất qua đôi bàn chân',
    },
  }),
  earth: Object.freeze({
    remedyId: 'rx-movement-yinbowl-02', ingredientsKey: 'singing_bowl_yin',
    prescription: {
      zh: '颂钵阴瑜伽 20 分钟——音波的涟漪替固着的土象筋膜做一次深层松解',
      en: '20 minutes of singing-bowl yin yoga — the ripple of sound deeply unknots fixed earth fascia',
      fr: '20 minutes de yin yoga aux bols chantants — l’onde sonore défait en profondeur les fascias fixés de terre',
      es: '20 minutos de yin yoga con cuencos tibetanos — la onda sonora deshace en profundidad la fascia fija de tierra',
      th: 'โยคะหยินกับชามร้องเสียง 20 นาที — คลื่นเสียงคลายพังผืดธาตุดินที่แน่นไปในระดับลึก',
      vi: '20 phút yoga âm kèm hát bát — sóng âm gỡ sâu cân mạc mệnh Thổ cố kết',
    },
  }),
  air: Object.freeze({
    remedyId: 'rx-movement-breath478-03', ingredientsKey: 'breath_478',
    prescription: {
      zh: '4-7-8 节律呼吸 16 轮——用呼吸的节拍器把纷飞的风象思绪摆回正拍',
      en: 'Sixteen rounds of 4-7-8 breathing — a metronome that walks scattered air-thoughts back onto the beat',
      fr: 'Seize cycles de respiration 4-7-8 — un métronome qui ramène les pensées d’air dispersées sur le tempo',
      es: 'Dieciséis rondas de respiración 4-7-8 — un metrónomo que devuelve los pensamientos de aire dispersos al compás',
      th: 'หายใจ 4-7-8 จำนวน 16 รอบ — เครื่องจัดจังหวะพาความคิดธาตุลมที่ปลิวกลับสู่จังหวะเดิม',
      vi: '16 vòng thở 4-7-8 — máy đánh metronome đưa tư tưởng mệnh Phong phiêu trở về nhịp',
    },
  }),
  water: Object.freeze({
    remedyId: 'rx-movement-dawnwalk-04', ingredientsKey: 'dawnlight_walk',
    prescription: {
      zh: '晨光缓行 20 分钟——借初阳的节拍替寒凉的水象升一次温',
      en: '20 minutes of slow dawn walking — borrows the first sun’s rhythm to warm a cool water current',
      fr: '20 minutes de marche lente à l’aube — emprunte le rythme du premier soleil pour réchauffer un courant d’eau frais',
      es: '20 minutos de caminata lenta al alba — toma el ritmo del primer sol para templar una corriente de agua fría',
      th: 'เดินช้าๆ ตอนเช้าตรู่ 20 นาที — ยืมจังหวะแสงอาทิตย์แรกอุ่นกระแสน้ำที่เย็น',
      vi: '20 phút đi bộ chậm trong bình minh — mượn nhịp nắng sớm sưởi ấm dòng nước hàn lương',
    },
  }),
});

/** 维度 D · 时令顺时漫游（seasonal_outing）——3 套（随季群；与 E124 ootd＋E134/E136 roadtrip 联动） */
const RX_OUTING = Object.freeze({
  cool: Object.freeze({
    remedyId: 'rx-outing-forest-01', ingredientsKey: 'forest_oxygen',
    prescription: {
      zh: '近郊山林吸氧半日——午后的松风竹韵里缓行两小时，保温壶里灌一盏温饮',
      en: 'A half-day of forest oxygen nearby — two slow hours among pines and bamboo, a warm flask in hand',
      fr: 'Une demi-journée d’oxygène forestier aux environs — deux heures lentes entre pins et bambous, un thermos chaud à la main',
      es: 'Media jornada de oxígeno forestal cerca — dos horas lentas entre pinos y bambú, un termo templado en la mano',
      th: 'ครึ่งวันสูดออกซิเจนป่าใกล้เมือง — สองชั่วโมงช้าๆ ท่ามกลางสนและไผ่ พกกระบอกน้ำอุ่นติดมือ',
      vi: 'Nửa ngày hít oxy rừng ngoại thành — hai giờ thong dong giữa thông và tre, bình giữ ấm bên tay',
    },
  }),
  mild: Object.freeze({
    remedyId: 'rx-outing-riverside-02', ingredientsKey: 'riverside_bloom',
    prescription: {
      zh: '河畔花径晨行一小时——趁露水未散，替身心开一次春天的窗',
      en: 'An hour along riverside bloom paths at morning — while the dew holds, open a spring window for body and mind',
      fr: 'Une heure sur les chemins fleuris de la rivière au matin — pendant que la rosée tient, ouvrir une fenêtre de printemps au corps et à l’esprit',
      es: 'Una hora por senderos en flor junto al río al alba — mientras el rocío resiste, abrir una ventana de primavera al cuerpo y la mente',
      th: 'เดินชมดอกไม้ริมน้ำหนึ่งชั่วโมงตอนเช้า — ยังหยดน้ำค้าง จงเปิดหน้าต่างฤดูใบไม้ผลิให้กายและใจ',
      vi: 'Một giờ đi hoa ven sông buổi sớm — khi sương chưa tan, mở cho thân tâm một cửa sổ mùa xuân',
    },
  }),
  warm: Object.freeze({
    remedyId: 'rx-outing-lakeshore-03', ingredientsKey: 'lakeshore_breeze',
    prescription: {
      zh: '湖滨海风漫步九十分钟——趁晨光未烈，让清凉的水汽带走一身暑气',
      en: 'Ninety minutes along the lakeshore breeze — beat the strong sun and let cool water-air carry the summer heat away',
      fr: 'Quatre-vingt-dix minutes au fil de la brise du lac — avant le soleil fort, laisser l’air humide emporter la chaleur d’été',
      es: 'Noventa minutos junto a la brisa del lago — antes del sol fuerte, dejar que el aire húmedo se lleve el calor del verano',
      th: 'เดินเลียบทะเลสาบเก้าสิบนาที — ก่อนแดดแรง ให้ลมชื้นเย็นพาความร้อนทั้งหมดออกไป',
      vi: 'Chín mươi phút dạo theo gió bờ hồ — trước nắng gắt, để làn khí ẩm mát cuốn hết thử khí đi',
    },
  }),
});

/** 天象相位微调注脚（六语一句——满月安神；fail-closed 未知相位 ⇒ 不追加） */
const SKY_EVENT_FOOTNOTES = Object.freeze({
  full_moon: {
    zh: '今夜月相盈满，宜早些熄灯，把处方饮毕交还给睡眠。',
    en: 'The moon is full tonight — dim the lights a little earlier, finish the infusion and hand the night back to sleep.',
    fr: 'La lune est pleine ce soir — éteignez un peu plus tôt, terminez l’infusion et rendez la nuit au sommeil.',
    es: 'La luna está llena esta noche — apaga la luz un poco antes, termina la infusión y devuélvele la noche al sueño.',
    th: 'พระจันทร์เต็มดวงคืนนี้ — ปิดไฟให้เร็วขึ้นเล็กน้อย ดื่มชาสมุนไพรจนหมดแล้วคืนกลับไปนอน',
    vi: 'Đêm nay trăng tròn — tắt đèn sớm hơn chút, uống xong nước thảo mộc rồi trao đêm lại cho giấc ngủ.',
  },
  mercury_retrograde: {
    zh: '水星逆行期间思绪易打结，处方之外，凡事慢半拍便是护身。',
    en: 'Mercury is retrograde — thoughts tangle easily; beyond the remedy, moving half a beat slower is its own charm.',
    fr: 'Mercure est rétrograde — les pensées s’emmêlent aisément ; au-delà de la prescription, ralentir d’un demi-tempo est déjà une protection.',
    es: 'Mercurio está retrógrado — los pensamientos se enredan con facilidad; además del remedio, ir medio tiempo más lento ya es escudo.',
    th: 'ดาวพุธโคจรถอยหลัง — ความคิดพันกันง่าย นอกจากตำรับ การช้าลงครึ่งจังหวะคือเครื่องราง',
    vi: 'Sao Thủy nghịch hành — tư duy dễ rối; ngoài bài thuốc, chậm lại nửa nhịp đã là bùa hộ mệnh.',
  },
  fire_square: {
    zh: '火象冲克之日脾气易燥，处方的凉意正是今日的解药。',
    en: 'A fire square tightens tempers today — the cooling edge of this remedy is precisely today’s antidote.',
    fr: 'Un carré de feu tend les humeurs aujourd’hui — la fraîcheur de cette prescription est justement l’antidote du jour.',
    es: 'Una cuadratura de fuego tensa los ánimos hoy — el frescor de este remedio es justo el antídoto de hoy.',
    th: 'มุมฉากธาตุไฟวันนี้อารมณ์ร้อนง่าย — ความเย็นของตำรับคือยาถอนพิษแห่งวัน',
    vi: 'Ngày hỏa tương hình khắc tính tình dễ nóng — vị mát của bài thuốc chính là thuốc giải hôm nay.',
  },
});

/** 核心天然成分六语词典（ingredientsKey 真源——内嵌单源，零 i18n 新键） */
export const RX_INGREDIENTS = Object.freeze({
  ashwagandha_magnesium: { zh: '南非醉茄 · 甘氨酸镁', en: 'Ashwagandha · Magnesium Glycinate', fr: 'Ashwagandha · Glycinate de magnésium', es: 'Ashwagandha · Glicinato de magnesio', th: 'แอชวากันดา · แมกนีเซียมไกลซิเนต', vi: 'Ashwagandha · Magnesium Glycinate' },
  chrysanthemum_goji: { zh: '杭白菊 · 枸杞 · 决明子', en: 'Chrysanthemum · Goji · Cassia Seed', fr: 'Chrysanthème · Baie de goji · Graine de cassia', es: 'Crisantemo · Goji · Semilla de casia', th: 'เก็บฮวยโกจิ · เมล็ดเจ็ดเม็ดยอดรั้ว', vi: 'Cúc · Kỳ tử · Quyết minh tử' },
  mint_chamomile_coconut: { zh: '薄荷 · 洋甘菊 · 椰子水', en: 'Mint · Chamomile · Coconut Water', fr: 'Menthe · Camomille · Eau de coco', es: 'Menta · Manzanilla · Agua de coco', th: 'มินต์ · คาโมมาย · น้ำมะพร้าว', vi: 'Bạc hà · Cúc La Mã · Nước dừa' },
  coq10_eleuthero: { zh: '辅酶 Q10 · 刺五加', en: 'CoQ10 · Eleuthero', fr: 'CoQ10 · Éleuthérocoque', es: 'CoQ10 · Eleuteroco', th: 'โคเอ็นไซม์คิวเท็น · เอลิวเทโร', vi: 'CoQ10 · Thích ngũ gia' },
  poria_yam: { zh: '茯苓 · 山药 · 米乳', en: 'Poria · Yam · Rice Milk', fr: 'Poria · Igname · Lait de riz', es: 'Poria · Ñame · Leche de arroz', th: 'ฟู่หลิง · เผือก · นมข้าว', vi: 'Phục linh · Hoài sơn · Sữa gạo' },
  tangerine_lotus_leaf: { zh: '陈皮 · 荷叶 · 薏米', en: 'Tangerine Peel · Lotus Leaf · Job’s Tears', fr: 'Écorce de mandarine · Feuille de lotus · Larmes de Job', es: 'Cáscara de mandarina · Hoja de loto · Lágrimas de Job', th: 'เปลือกส้มจี้ · ใบบัว · เมล็ดหมี่', vi: 'Trần bì · Diệp liên · Ý dĩ' },
  turmeric_blackpepper_oat: { zh: '姜黄 · 黑胡椒 · 燕麦', en: 'Turmeric · Black Pepper · Oats', fr: 'Curcuma · Poivre noir · Avoine', es: 'Cúrcuma · Pimienta negra · Avena', th: 'ขมิ้น · พริกไทยดำ · ข้าวโอ๊ต', vi: 'Nghệ · Tiêu đen · Yến mạch' },
  silverneedle_elderflower: { zh: '白毫银针 · 接骨木花', en: 'Silver Needle · Elderflower', fr: 'Aiguilles d’argent · Fleur de sureau', es: 'Agujas de plata · Flor de saúco', th: 'ชาขาวเงินเข็ม · ดอกเอลเดอร์เบอร์รี', vi: 'Bạch hào ngân châm · Hoa cơm cháy' },
  jasmine_lime_cucumber: { zh: '茉莉 · 青柠 · 黄瓜', en: 'Jasmine · Lime · Cucumber', fr: 'Jasmin · Citron vert · Concombre', es: 'Jazmín · Lima · Pepino', th: 'มะลิ · มะนาว · แตงกวา', vi: 'Lài · Chanh · Dưa leo' },
  longan_jujube_ginger: { zh: '桂圆 · 红枣 · 姜母', en: 'Longan · Red Jujube · Ginger', fr: 'Longane · Jujube rouge · Gingembre', es: 'Longan · Azufaifo rojo · Jengibre', th: 'ลำไย · อินทผลัมแดง · ขิง', vi: 'Nhãn · Táo đỏ · Gừng' },
  mulberry_goji: { zh: '桑葚 · 枸杞', en: 'Mulberry · Goji', fr: 'Mûre · Baie de goji', es: 'Mora · Goji', th: 'หม่อน · โกจิ', vi: 'Dâu tằm · Kỳ tử' },
  hibiscus_rose_electrolyte: { zh: '洛神花 · 玫瑰 · 天然电解质', en: 'Hibiscus · Rose · Natural Electrolytes', fr: 'Hibiscus · Rose · Électrolytes naturels', es: 'Hibisco · Rosa · Electrolitos naturales', th: 'กระเจี๊ยบ · กุหลาบ · เกลือแร่ธรรมชาติ', vi: 'Hoa atiso đỏ · Hồng · Điện giải tự nhiên' },
  vetiver_white_sage: { zh: '岩兰草 · 白鼠尾草', en: 'Vetiver · White Sage', fr: 'Vétiver · Sauge blanche', es: 'Vetiver · Salvia blanca', th: 'เว็ทเวอร์ · เสจขาว', vi: 'Cỏ vetiver · Ngải trắng' },
  bergamot_sweetorange: { zh: '佛手柑 · 甜橙', en: 'Bergamot · Sweet Orange', fr: 'Bergamote · Orange douce', es: 'Bergamota · Naranja dulce', th: 'เบอร์กามอต · ส้มหวาน', vi: 'Bergamot · Cam ngọt' },
  cedar_atlantic_frankincense: { zh: '大西洋雪松 · 乳香', en: 'Atlantic Cedar · Frankincense', fr: 'Cèdre de l’Atlas · Encens', es: 'Cedro del Atlas · Incienso', th: 'สนซีดาร์แอตแลนติก · กำยาน', vi: 'Tuyết tùng · Nhũ hương' },
  sandalwood_rose: { zh: '檀香 · 玫瑰', en: 'Sandalwood · Rose', fr: 'Santal · Rose', es: 'Sándalo · Rosa', th: 'จันทน์ · กุหลาบ', vi: 'Đàn hương · Hoa hồng' },
  forest_grounding: { zh: '林间赤足 · 大地接地', en: 'Barefoot Forest · Earth Grounding', fr: 'Pieds nus en forêt · Mise à la terre', es: 'Descalzo en el bosque · Conexión a tierra', th: 'เท้าเปล่าในป่า · สัมผัสแผ่นดิน', vi: 'Chân trần trong rừng · Tiếp đất' },
  singing_bowl_yin: { zh: '颂钵 · 阴瑜伽', en: 'Singing Bowl · Yin Yoga', fr: 'Bols chantants · Yin yoga', es: 'Cuencos tibetanos · Yin yoga', th: 'ชามร้องเสียง · โยคะหยิน', vi: 'Tượng · Yoga âm' },
  breath_478: { zh: '4-7-8 节律呼吸', en: '4-7-8 Rhythmic Breathing', fr: 'Respiration rythmique 4-7-8', es: 'Respiración rítmica 4-7-8', th: 'หายใจจังหวะ 4-7-8', vi: 'Thở nhịp 4-7-8' },
  dawnlight_walk: { zh: '晨光 · 缓行', en: 'Dawn Light · Slow Walk', fr: 'Lumière de l’aube · Marche lente', es: 'Luz del alba · Caminata lenta', th: 'แสงเช้าตรู่ · เดินช้า', vi: 'Nắng sớm · Đi bộ chậm' },
  forest_oxygen: { zh: '松风竹韵 · 山林氧径', en: 'Pine & Bamboo · Forest Oxygen Trail', fr: 'Pins et bambous · Sentier d’oxygène forestier', es: 'Pinos y bambú · Sendero de oxígeno forestal', th: 'สนและไผ่ · เส้นทางออกซิเจนป่า', vi: 'Thông và tre · Đường oxy rừng' },
  riverside_bloom: { zh: '河畔花径 · 晨露', en: 'Riverside Bloom · Morning Dew', fr: 'Chemin fleuri · Rosée du matin', es: 'Sendero en flor · Rocío matinal', th: 'ทางเดินดอกไม้ริมน้ำ · น้ำค้างเช้า', vi: 'Đường hoa ven sông · Sương sớm' },
  lakeshore_breeze: { zh: '湖滨海风 · 水汽清凉', en: 'Lakeshore Breeze · Cool Water-Air', fr: 'Brise du lac · Air frais de l’eau', es: 'Brisa del lago · Aire fresco del agua', th: 'ลมทะเลสาบ · ลมน้ำเย็น', vi: 'Gió bờ hồ · Khí mát mặt nước' },
});

/**
 * 供应链软植入槽（三级 affiliateTier 白名单；sponsorBrand 恒 null——
 * 预留 100K 里程碑或自营健康供应链一键激活；redirectSlug 统一 /go/:remedyId）。
 * 军令铁律：当前全部 curated_free（零佣金零外链品牌——/go 落地为站内指引页）。
 */
export const WELLNESS_AFFILIATE_TIERS = Object.freeze(['curated_free', 'cps_affiliate', 'self_operated_sku']);

function _supplySlot(dim) {
  return Object.freeze({
    remedyId: dim.remedyId,
    category: dim.category,
    ingredientsKey: dim.ingredientsKey,
    redirectSlug: `/go/${dim.remedyId}`,
    affiliateTier: 'curated_free',
    sponsorBrand: null,
  });
}

/** 全量供应槽白名单（23 枚——/go/:remedyId 路由唯一真源；Object.freeze 恒定） */
const _RX_SLOT_TABLES = Object.freeze([
  ['elixir', RX_ELIXIR],
  ['scent', RX_SCENT],
  ['movement', RX_MOVEMENT],
  ['outing', RX_OUTING],
]);
export const WELLNESS_SUPPLY_SLOTS = Object.freeze(
  _RX_SLOT_TABLES.flatMap(([category, table]) =>
    Object.values(table)
      .flatMap((sub) => (sub.remedyId ? [sub] : Object.values(sub)))
      .map((dim) => _supplySlot({ remedyId: dim.remedyId, ingredientsKey: dim.ingredientsKey, category }))
  )
);

/* ═══════════════ 触发意图网（六语——chatQ3 精确文本＋养生语义白名单） ═══════════════ */

/** chatQ3 六语钦定文本（军令触发锚——与 locales/*.json familiar.chatQ3 逐字同源） */
export const WELLNESS_CHATQ3_TEXTS = Object.freeze([
  '🔮 结合星盘的今日指引',
  "🔮 Today's Astral Chart Guidance",
  '🔮 Conseils Astraux selon mon Thème',
  '🔮 Guía Astral según mi Carta Natal',
  '🔮 คำชี้แนะดวงดาวประจำวันตามลัคนา',
  '🔮 Chỉ Dẫn Tinh Bàn Hôm Nay',
]);

/** 养生语义关键词（六语白名单——疲惫/失眠/焦躁/换季/茶饮/吃喝玩乐语义族） */
const WELLNESS_SEMANTIC_KEYS = Object.freeze([
  '疲惫', '失眠', '焦躁', '焦虑', '睡不着', '熬夜', '养生', '茶饮', '花茶', '草药', ' herbal', '换季', '吃什么', '喝什么', '吃喝玩乐', '身心', '放松', '疗愈',
  'tired', 'exhausted', 'insomnia', 'sleepless', "can't sleep", 'anxious', 'anxiety', 'restless', 'wellness', 'herbal', 'tea', 'seasonal', 'self-care', 'relax', 'aromather',
  'fatigue', 'fatigué', 'insomnie', 'anxiété', 'tisane', 'phytothérapie', 'détente', 'saisonnier', 'bien-être', 'infusion',
  'cansado', 'cansancio', 'insomnio', 'ansiedad', 'ansioso', 'bienestar', 'infusión', 'estacional', 'relajación', 'aromaterapia',
  'เหนื่อย', 'นอนไม่หลับ', 'เครียด', 'วิตกกังวล', 'สมุนไพร', 'ชาสมุนไพร', 'ผ่อนคลาย', 'ฤดูกาลเปลี่ยน', 'ดูแลตัวเอง',
  'mệt mỏi', 'mệt', 'mất ngủ', 'lo âu', 'thảo mộc', 'trà thảo mộc', 'thư giãn', 'giao mùa', 'chăm sóc bản thân',
]);

/**
 * 触发检测（纯函数——末条 user message 文本）：
 * chatQ3 六语钦定文本精确命中 ＞ 养生语义关键词子串命中 ＞ false fail-closed。
 */
export function detectWellnessTrigger(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  const s = text.trim();
  for (const q of WELLNESS_CHATQ3_TEXTS) {
    if (s.includes(q) || q.includes(s)) return true;
  }
  const lower = s.toLowerCase();
  for (const k of WELLNESS_SEMANTIC_KEYS) {
    const kk = k.trim().toLowerCase();
    if (kk && lower.includes(kk)) return true;
  }
  return false;
}

/* ═══════════════ 主入口：resolveAstroSeasonalWellnessRx ═══════════════ */

function _pickDim(table, element, mode, lang) {
  const byElement = table[element] || table.earth; // balanced 兜底 ⇒ 土枢（土主运化）
  // 兼容两种表形：元素直挂（scent/movement）与元素×季群双层（elixir）
  const dim = byElement.remedyId ? byElement : (byElement[mode] || byElement.cool);
  const l = _rxLang(lang);
  return {
    remedyId: dim.remedyId,
    ingredientsKey: dim.ingredientsKey,
    prescription: dim.prescription[l] || dim.prescription.en,
    ingredients: (RX_INGREDIENTS[dim.ingredientsKey] || {})[l] || (RX_INGREDIENTS[dim.ingredientsKey] || {}).en || '',
  };
}

function _pickByMode(table, mode, lang, fallbackMode) {
  const dim = table[mode] || table[fallbackMode];
  const l = _rxLang(lang);
  return {
    remedyId: dim.remedyId,
    ingredientsKey: dim.ingredientsKey,
    prescription: dim.prescription[l] || dim.prescription.en,
    ingredients: (RX_INGREDIENTS[dim.ingredientsKey] || {})[l] || (RX_INGREDIENTS[dim.ingredientsKey] || {}).en || '',
  };
}

/**
 * 星盘×时令能量处方主入口（纯函数——零网络零 LLM 零臆造）。
 * @param {{chartSignature?:{dominantElement?:string, weakElement?:string, skyEvent?:string}, timestamp?:number|string|Date, geoZone?:string|null, lang?:string}} input
 * @returns {{ok:boolean, hemisphere:'north'|'south', geoZone:string|null, month:number, season:string, seasonName:string, mode:string, termLabel:string, dominantElement:string, skyEvent:string|null, rx:object, supplyChainMeta:object[]}}
 */
export function resolveAstroSeasonalWellnessRx(input) {
  const inp = (input && typeof input === 'object') ? input : {};
  const lang = _rxLang(inp.lang);
  const geoZone = (typeof inp.geoZone === 'string' && ['NA', 'AU', 'EU', 'CN', 'SEA', 'JP'].includes(inp.geoZone)) ? inp.geoZone : null;
  const hemisphere = resolveHemisphere(geoZone);

  // chartSignature 形状守卫（fail-closed：坏形状 ⇒ balanced 土枢兜底）
  const cs = (inp.chartSignature && typeof inp.chartSignature === 'object') ? inp.chartSignature : {};
  const rawElement = String(cs.dominantElement || '').trim().toLowerCase();
  const dominantElement = WELLNESS_ELEMENTS.includes(rawElement) ? rawElement : 'balanced';
  const skyEvent = WELLNESS_SKY_EVENTS.includes(cs.skyEvent) ? cs.skyEvent : null;

  // 时令解析
  const ts = (inp.timestamp !== undefined && inp.timestamp !== null) ? inp.timestamp : Date.now();
  let d = null;
  if (ts instanceof Date) d = ts;
  else if (typeof ts === 'number' && Number.isFinite(ts)) d = new Date(ts);
  else if (typeof ts === 'string' && ts.trim()) { const p = new Date(ts); d = Number.isNaN(p.getTime()) ? null : p; }
  const month = d ? d.getUTCMonth() : new Date().getUTCMonth();
  const northSeason = MONTH_SEASON_NORTH[month] || 'winter';
  const mirror = { winter: 'summer', summer: 'winter', spring: 'autumn', autumn: 'spring' };
  const season = (hemisphere === 'south') ? (mirror[northSeason] || northSeason) : northSeason;
  const mode = SEASON_MODE[season] || 'cool';
  const seasonName = ((SEASON_NAMES[season] || SEASON_NAMES.winter) || {})[lang]
    || (SEASON_NAMES[season] || SEASON_NAMES.winter).en;
  const termLabel = ((MODE_TERMS[mode] || MODE_TERMS.cool) || {})[lang]
    || MODE_TERMS.cool.en;

  // 四维处方（元素×季群矩阵）
  const el = (dominantElement === 'balanced') ? 'earth' : dominantElement;
  const elixir = { category: 'elixir', ..._pickDim(RX_ELIXIR, el, mode, lang) };
  const scent = { category: 'scent', ..._pickDim(RX_SCENT, el, mode, lang) };
  const movement = { category: 'movement', ..._pickDim(RX_MOVEMENT, el, mode, lang) };
  const outing = { category: 'outing', ..._pickByMode(RX_OUTING, mode, lang, 'cool') };

  // 天象相位注脚（满月/水逆/火象冲克——六语一句；未知 ⇒ null）
  const skyNote = skyEvent ? ((SKY_EVENT_FOOTNOTES[skyEvent] || {})[lang] || null) : null;

  const rx = { functional_elixir: elixir, aura_scent: scent, mindful_movement: movement, seasonal_outing: outing };
  if (skyNote) rx.skyNote = skyNote;

  // 供应链软植入槽（军令三级白名单；sponsorBrand 恒 null）
  const supplyChainMeta = [
    _supplySlot({ ...elixir, category: 'elixir' }),
    _supplySlot({ ...scent, category: 'scent' }),
    _supplySlot({ ...movement, category: 'movement' }),
    _supplySlot({ ...outing, category: 'outing' }),
  ];

  return {
    ok: true,
    hemisphere,
    geoZone,
    month: month + 1,
    season,
    seasonName,
    mode,
    termLabel,
    dominantElement,
    skyEvent,
    rx,
    supplyChainMeta,
  };
}

/** 模板套数（军令 12 套下界自证——四元素 × 三季群） */
export const WELLNESS_TEMPLATE_COUNT = 12;
