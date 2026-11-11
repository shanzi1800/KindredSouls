/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E124-LIFESTYLE-MUSE 刀一（主公军令 2026-11-05）：全语言生活区静态模板库
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：2 类生活方式卡（style 气场穿搭 Aura Style Capsule / roadtrip 灵魂漫游
 * 路书 Soul Roadtrip Guide）× 6 官方语种（zh/en/fr/es/th/vi）＝ 12 套军师钦定
 * 典藏文案（逐字录入，严禁再创作）。内容对齐军令「6 大语言生活区映射矩阵」：
 *   · style：生活区审美原型（胶囊衣橱/巴黎不费力/暖大地/热带轻质/印支真丝/
 *     新中式素雅）＋3 组能量色盘（Aura Palette hex 真值）＋单品廓形＋配饰避坑；
 *   · roadtrip：生活区逃离坐标（Nature Grounding）＋吉方罗盘角＋路线补给＋
 *     避世美宿＋地磁避雷。
 * 🔴 铁律沿袭：零 i18n 新键（消费方自容字典）；小众质感·极致性价比红线
 *   （禁奢侈大牌名）；零恐慌词（0525 语调铁律）。
 * 消费方：lifestyleCanvasRenderer.mjs（Canvas 排版真源）＋
 * LifestyleMuseSlot.tsx（微缩插槽/大图预览）＋ detectLifestyleIntent.mjs（意图网）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 官方六语（Soul OS 语言底座——与 AMULET_LOCALES 同源） */
export const LIFESTYLE_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** 两类生活方式卡（军令钦定序） */
export const LIFESTYLE_TYPES = Object.freeze(['style', 'roadtrip']);

/** 类型防伪章三字码（右下角水印 KS-STYLE-/KS-ROADTRIP-{TYP 省}-{LOCALE}） */
export const LIFESTYLE_STAMP = Object.freeze({
  style: { prefix: 'KS-STYLE-', typ: 'AUR' },
  roadtrip: { prefix: 'KS-ROADTRIP-', typ: 'SOL' },
});

/** 导出文件名前缀（军令钦定 KindredSouls-Style/Roadtrip-YYYYMMDD.png） */
export const LIFESTYLE_FILENAME = Object.freeze({
  style: 'KindredSouls-Style-',
  roadtrip: 'KindredSouls-Roadtrip-',
});

/**
 * 12 套六语典藏模板（军师全文逐字录入——单源静态资产，零网络零动态拼接）
 * palette＝3 组能量色盘真值（hex＋生活区命名）；heading＝路书吉方罗盘角（度＋名）。
 * @type {Record<string, Record<string, object>>}
 */
export const LIFESTYLE_TEMPLATES_12 = Object.freeze({
  /* ═══════════ 一、气场穿搭灵感笺（Aura Style Capsule）═══════════ */
  style: Object.freeze({
    zh: Object.freeze({
      title: '✦ 气场穿搭灵感笺 ✦',
      subtitle: 'AURA STYLE CAPSULE · GROUNDED ELEGANCE',
      prose: '今日气场关键词：松弛而有力量。垂感棉麻或厚磅针织承住心绪，中性色收敛内耗，剪裁利落处见分寸。\n一件素色立领衬衣配直筒长裤，玉石或珍珠微点缀即可——克制，是最高级的气场。',
      companionWhisper: '小众质感胜过大牌logo：这类剪裁去翻 COS 或优衣库 U 系就足够体面。避开浮夸印花与褶皱；今日宜低调蓄势，不宜喧哗夺目。',
      bestWindowPrefix: '气场共振时段',
      defaultTiming: '08:00 - 10:30 · 出门前定调',
      palette: [
        { hex: '#8A7A5C', name: '茶褐' },
        { hex: '#4A5568', name: '黛蓝' },
        { hex: '#C9B79C', name: '米杏' },
      ],
    }),
    en: Object.freeze({
      title: '✦ AURA STYLE CAPSULE ✦',
      subtitle: 'GROUNDED ELEGANCE · QUIET LUXURY',
      prose: "Today's energy keyword: quiet strength. Reach for oatmeal cashmere or heavyweight cotton to steady your aura; neutral tones mute the inner noise, and a clean silhouette does the talking.\nA tailored shirt with straight-cut trousers needs nothing more — restraint is the most powerful statement.",
      companionWhisper: 'Understated beats logo: COS or the Uniqlo U line carry this cut beautifully at honest prices. Skip loud prints and creases; today favors composed presence over attention-seeking.',
      bestWindowPrefix: 'Aura Resonance Window',
      defaultTiming: '08:00 - 10:30 · set the tone before you leave',
      palette: [
        { hex: '#D8CBB0', name: 'Oatmeal' },
        { hex: '#5A6478', name: 'Slate Blue' },
        { hex: '#B0A286', name: 'Sandstone' },
      ],
    }),
    fr: Object.freeze({
      title: "✦ CAPSULE D'AURA & STYLE ✦",
      subtitle: 'CHIC EFFORTLESS · ÉLÉGANCE PARISIENNE',
      prose: "Mot-clé du jour : l'effortless. Un blazer légèrement oversize sur denim brut, une maille rayée : l'élégance à la française ne se force jamais.\nLes matières nobles — laine froide, coton épais — portent seules le raffinement.",
      companionWhisper: "Le chic discret vaut mieux qu'une étiquette : fouillez les rayons COS ou & Other Stories pour ces coupes, sans surpayer. Évitez les imprimés criards ; aujourd'hui, la retenue est votre meilleure signature.",
      bestWindowPrefix: 'Fenêtre de résonance',
      defaultTiming: '08:00 - 10:30 · avant de sortir',
      palette: [
        { hex: '#1F2A38', name: 'Bleu Nuit' },
        { hex: '#EDE6D6', name: 'Ivoire' },
        { hex: '#8C7B6B', name: 'Taupe' },
      ],
    }),
    es: Object.freeze({
      title: '✦ CÁPSULA DE ESTILO Y AURA ✦',
      subtitle: 'WARM EARTH · LUJO SERENO',
      prose: 'Palabra clave de hoy: calidez serena. Lino respirable en tonos tierra, cortes fluidos y joyería artesanal en plata — la elegancia mediterránea no grita, respira.\nUn lino color arena con detalles en terracota sostiene tu aura sin esfuerzo.',
      companionWhisper: 'Lo artesanal vale más que la etiqueta: busca estos cortes en Mango o líneas de lino de temporada sin pagar de más. Evita el sintético brillante; hoy la naturalidad es tu mejor aliada.',
      bestWindowPrefix: 'Ventana de resonancia',
      defaultTiming: '08:00 - 10:30 · antes de salir',
      palette: [
        { hex: '#C48B6A', name: 'Terracota' },
        { hex: '#F0E0C8', name: 'Crema' },
        { hex: '#7A8B6F', name: 'Oliva' },
      ],
    }),
    th: Object.freeze({
      title: '✦ สารนำทางสไตล์และพลังออร่า ✦',
      subtitle: 'TROPICAL LIGHT · MODERN CRAFT',
      prose: 'คำสำคัญของวันนี้: ความเบาสบายที่มีพลัง ผ้าลินินใยสูงระบายอากาศดีในโทนสงบ ตัดเย็บสะอาดตา ให้บุคลิกนิ่งและอบอุ่น\nเสื้อเชิ้ตโทนไอวอรีเข้าชุดกางเกงขายาวตรง เพียงเท่านี้ก็สง่างามพอ',
      companionWhisper: 'ดีไซน์ดีไม่ต้องแพง: แบรนด์ดีไซเนอร์ไทยฝีมือดีในเชียงใหม่ หรือแบรนด์ท้องถิ่นคุณภาพดี เลี่ยงลายฉูดฉาดและผ้ายับ วันนี้ความสุภาพคือพลังของเธอ',
      bestWindowPrefix: 'ช่วงเวลาเสริมพลัง',
      defaultTiming: '08:00 - 10:30 · ก่อนออกจากบ้าน',
      palette: [
        { hex: '#E8DCC8', name: 'ไอวอรี' },
        { hex: '#9FB4A3', name: 'เซจเขียวอ่อน' },
        { hex: '#D9A688', name: 'คอรัลอ่อน' },
      ],
    }),
    vi: Object.freeze({
      title: '✦ THẺ CẢM HỨNG TRANG PHỤC KHÍ CHẤT ✦',
      subtitle: 'MODERN INDOCHINE · SOFT SILK',
      prose: 'Từ khóa hôm nay: dịu dàng mà vững vàng. Lụa nhẹ hoặc vải dệt thô thanh lịch trong tông trầm ấm, đường cắt may Indochine tân thời giữ nét riêng của bạn.\nMột chiếc sơ mi lụa màu kem lạnh với quần âu suông đã đủ tinh tế.',
      companionWhisper: 'Chất lượng tốt không cần đắt đỏ: các thương hiệu nội địa chairs cutting gọn hoặc dòng cơ bản của Uniqlo đều có những mẫu này. Tránh họa tiết rực rỡ và vải nhăn; hôm nay sự kín đáo chính là khí chất.',
      bestWindowPrefix: 'Khung giờ cộng hưởng',
      defaultTiming: '08:00 - 10:30 · trước khi ra cửa',
      palette: [
        { hex: '#B8927A', name: 'Hồng Lụa' },
        { hex: '#3E4A5A', name: 'Chàm Sẫm' },
        { hex: '#E9DCC9', name: 'Kem Lụa' },
      ],
    }),
  }),

  /* ═══════════ 二、灵魂漫游路书（Soul Roadtrip Guide）═══════════ */
  roadtrip: Object.freeze({
    zh: Object.freeze({
      title: '✦ 漫游自驾避坑路书 ✦',
      subtitle: 'SOUL ROADTRIP · NATURE GROUNDING',
      prose: '本周末宜往「东南」纳吉气：莫干山竹海或安吉山居，盘山路缓、林梢换气，正是安放心绪的去处。\n补给点：山腰茶歇一盏单丛冷泡；黄昏前抵民宿，择带院落的一户，夜里听得见风穿竹叶。',
      companionWhisper: '避坑：避开节假日主干道与网红打卡点的人潮；行程留白半天，不赶路不打卡。预算参考：山居美宿人均 300~500，性价比远胜人挤人的连锁五星。',
      bestWindowPrefix: '出发吉时窗',
      defaultTiming: '周六 09:00 - 10:30 出发',
      heading: { deg: 135, name: '东南 · 巽位纳气' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: '莫干山', query: 'Moganshan, Deqing, Huzhou', sponsor_badge: null, secret_code: null },
        { name: '安吉大竹海', query: 'China Big Bamboo Sea, Anji', sponsor_badge: null, secret_code: null },
        { name: '莫干山山居美宿', query: 'Moganshan lodge, Deqing', sponsor_badge: null, secret_code: null },
      ],
    }),
    en: Object.freeze({
      title: '✦ SOUL ROADTRIP GUIDE ✦',
      subtitle: 'NATURE GROUNDING · QUIET ESCAPE',
      prose: "This weekend points 'northwest' for grounding energy: think Joshua Tree's desert stillness or a Catskills A-frame cabin — wide skies, no crowds, phone on silent.\nRefuel stops: a roadside diner with real coffee; arrive before dusk so the forest can do its quiet work on your nervous system.",
      companionWhisper: 'Avoid: viral photo spots and highway-chain motels. Leave half a day unplanned — the point is exhaling, not checking boxes. Boutique cabins run $120~$180 a night, far better value than any crowded resort.',
      bestWindowPrefix: 'Departure Window',
      defaultTiming: 'Saturday 09:00 - 10:30 departure',
      heading: { deg: 315, name: 'Northwest · Grounding' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: 'Joshua Tree', query: 'Joshua Tree National Park', sponsor_badge: null, secret_code: null },
        { name: 'Keys View', query: 'Keys View, Joshua Tree', sponsor_badge: null, secret_code: null },
        { name: 'Pioneertown', query: 'Pioneertown, California', sponsor_badge: null, secret_code: null },
      ],
    }),
    fr: Object.freeze({
      title: "✦ GUIDE D'ÉCHAPPÉE & SÉRÉNITÉ ✦",
      subtitle: 'RETRAITE SAUVAGE · TERROIR',
      prose: "Ce week-end, cap au 'sud' : les collines de lavande de Provence ou une longère de la Loire, routes secondaires et vignes au ras des champs.\nHaltes : un marché de village pour un pain au levain ; arrivez avant la tombée du jour pour laisser la terre faire son œuvre.",
      companionWhisper: "À éviter : les axes bondés et les hôtels de chaîne en bord de nationale. Gardez une demi-journée sans programme — le but est de souffler. Les maisons d'hôtes de caractère se trouvent autour de 90~140 € la nuit, un vrai luxe à prix juste.",
      bestWindowPrefix: 'Fenêtre de départ',
      defaultTiming: 'Samedi 09:00 - 10:30 départ',
      heading: { deg: 180, name: 'Sud · Lumière' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: 'Valensole', query: 'Plateau de Valensole', sponsor_badge: null, secret_code: null },
        { name: 'Moustiers', query: 'Moustiers-Sainte-Marie', sponsor_badge: null, secret_code: null },
        { name: 'Gorges du Verdon', query: 'Gorges du Verdon', sponsor_badge: null, secret_code: null },
      ],
    }),
    es: Object.freeze({
      title: '✦ HOJA DE RUTA DE ESCAPE DEL ALMA ✦',
      subtitle: 'COSTA Y PUEBLOS BLANCOS · CALMA',
      prose: "Este fin de semana rumbo al 'norte': los pueblos blancos de Andalucía o una cala escondida de Mallorca — carreteras serpenteantes, silencio y sal.\nParadas: un cortijo con aceite de oliva recién prensado; llega antes del atardecer para que el mar calme la mente.",
      companionWhisper: 'Evita: las autopistas saturadas y los complejos turísticos masivos. Deja media tarde sin plan — se trata de respirar. Las fincas y casitas rurales cuestan 80~150 € la noche, mucho mejor que cualquier resort abarrotado.',
      bestWindowPrefix: 'Ventana de salida',
      defaultTiming: 'Sábado 09:00 - 10:30 salida',
      heading: { deg: 0, name: 'Norte · Claridad' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: 'Ronda', query: 'Ronda, Andalusia', sponsor_badge: null, secret_code: null },
        { name: 'Setenil', query: 'Setenil de las Bodegas', sponsor_badge: null, secret_code: null },
        { name: 'Grazalema', query: 'Sierra de Grazalema', sponsor_badge: null, secret_code: null },
      ],
    }),
    th: Object.freeze({
      title: '✦ บันทึกการเดินทางเพื่อการเยียวยา ✦',
      subtitle: 'CHIANG MAI & ISLAND SERENITY',
      prose: "สุดสัปดาห์นี้หันหน้าไปทาง 'ตะวันออกเฉียงเหนือ' : ถนนคดเขาสู่แม่ฮ่องสอนหรือทะเลกระบี่ร่มเงียบ — ลมหนาวผ่านป่า ใจค่อยๆ นิ่ง\nจุดพัก: ร้านกาแฟบ้านไม้กลางหุบเขา ชงช้าๆ ชิมช้าๆ ให้ถึงที่พักก่อนค่ำ",
      companionWhisper: 'เลี่ยง: ถนนหลักวันหยุดยาวและแหล่งท่องเที่ยวคนเต็ม ทิ้งช่วงบ่ายให้ว่างครึ่งวัน — จุดประสงค์คือการพักใจ บ้านพักสไตล์รีสอร์ทป่าล้อมเขา ราคาราว 1,500~2,500 บาท คุ้มค่ากว่าโรงแรมใหญ่แน่นอน',
      bestWindowPrefix: 'ช่วงเวลาออกเดินทาง',
      defaultTiming: 'เสาร์ 09:00 - 10:30 ออกเดินทาง',
      heading: { deg: 45, name: 'ตะวันออกเฉียงเหนือ · พลังใหม่' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: 'แม่ฮ่องสอน', query: 'Mae Hong Son', sponsor_badge: null, secret_code: null },
        { name: 'หุบเขาไผ่ปาย', query: 'Pai Canyon', sponsor_badge: null, secret_code: null },
        { name: 'อ่าวนาง กระบี่', query: 'Ao Nang, Krabi', sponsor_badge: null, secret_code: null },
      ],
    }),
    vi: Object.freeze({
      title: '✦ CẨM NANG DU NGOẠN CHỮA LÀNH ✦',
      subtitle: 'ĐÀ LẠT SƯƠNG & DUYÊN HẢI',
      prose: "Cuối tuần này hướng về 'đông': cung đèo sương mù Đà Lạt hoặc đèo Hải Vân trên đường Đà Nẵng–Huế — rừng thông thổi mát, biển xanh mở tầm mắt.\nĐiểm dừng: quán cà phê gỗ ven đồi giữa chặng, tới nơi nghỉ trước khi trời tối để núi rừng làm việc tĩnh lặng của nó.",
      companionWhisper: 'Né: cao tốc đông ngày lễ và khu nghỉ dưỡng đóng kín kiểu resort lớn. Giữ nửa ngày trống — mục đích là thở, không phải chấm danh sách. Homestay vườn view đồi 600k~1tr2/đêm, đáng giá hơn bất kỳ khách sạn đông đúc nào.',
      bestWindowPrefix: 'Khung giờ xuất phát',
      defaultTiming: 'Thứ Bảy 09:00 - 10:30 xuất phát',
      heading: { deg: 90, name: 'Đông · Khởi Động' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: 'Đà Lạt', query: 'Da Lat, Vietnam', sponsor_badge: null, secret_code: null },
        { name: 'Đèo Hải Vân', query: 'Hai Van Pass', sponsor_badge: null, secret_code: null },
        { name: 'Vịnh Lăng Cô', query: 'Lang Co Beach', sponsor_badge: null, secret_code: null },
      ],
    }),
  }),
});

/**
 * ═══════════ E126-GEO-LOCALE 变体库（主公军令 2026-11-05 晚）═══════════
 * 军令钦定两大核心场景＋一反向场景的 roadtrip 卡 geo 变体（key＝`${lang}@${zone}`）：
 *   · zh@NA —— 在美华人：加州一号公路＋Catskills 木屋（军令原文明示）；
 *   · zh@AU —— 在澳华人：蓝山自驾＋莫宁顿半岛温泉（军令原文明示）；
 *   · fr@AU —— 悉尼/墨尔本法语客：Mornington Peninsula＋Blue Mountains；
 *   · en@SEA —— 欧美客亚太旅居：清迈环线（军令「符合当地地磁与气候」）。
 * 🔴 红线沿袭：小众质感·极致性价比（禁奢侈大牌）；零恐慌词；0525 语调；
 *   结构与 E124 基准模板同构（title/subtitle/prose/companionWhisper/
 *   bestWindowPrefix/defaultTiming/heading 全字段——E125 排版引擎直消费）；
 *   prose 长度与 E124 基准同量级（卡片排版安全余量）。
 */
export const LIFESTYLE_GEO_VARIANTS = Object.freeze({
  roadtrip: Object.freeze({
    'zh@NA': Object.freeze({
      title: '✦ 漫游自驾避坑路书 ✦',
      subtitle: 'SOUL ROADTRIP · WEST COAST GROUNDING',
      prose: '本周末宜往「开阔」纳吉气：加州一号公路由南向北慢行，海崖换景；或东岸 Catskills 山间木屋听风，手机静音正合养心。\n补给点：Big Sur 路边一盏热美式，或山径口的家庭果园酒；黄昏前抵宿，夜里听得见潮声或林涛。',
      companionWhisper: '避坑：避开长周末的网红观景台与十七哩人潮；行程留白半天，不赶路不打卡。预算参考：精品木屋 120~180 美元一晚，性价比远胜人挤人的连锁度假村。',
      bestWindowPrefix: '出发吉时窗',
      defaultTiming: '周六 09:00 - 10:30 出发',
      heading: { deg: 270, name: '西 · 开阔纳气' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: 'Big Sur', query: 'Big Sur, California', sponsor_badge: null, secret_code: null },
        { name: 'Nepenthe', query: 'Nepenthe, Big Sur', sponsor_badge: null, secret_code: null },
        { name: 'Catskills', query: 'Catskills, New York', sponsor_badge: null, secret_code: null },
      ],
    }),
    'zh@AU': Object.freeze({
      title: '✦ 漫游自驾避坑路书 ✦',
      subtitle: 'SOUL ROADTRIP · BLUE MOUNTAINS GROUNDING',
      prose: '本周末宜往「山与海」纳吉气：蓝山自驾走观景公路，桉树林梢的蓝雾正安放心绪；或莫宁顿半岛温泉海岸慢行收尾。\n补给点：山间小镇现磨咖啡与手工果酱；黄昏前抵宿，夜里听得见桉叶沙沙。',
      companionWhisper: '避坑：避开长周末观景台人潮与收费缆车排队；行程留白半天，不赶路不打卡。预算参考：山居酒馆民宿 150~220 澳元一晚，性价比远胜连锁度假村。',
      bestWindowPrefix: '出发吉时窗',
      defaultTiming: '周六 09:00 - 10:30 出发',
      heading: { deg: 135, name: '东南 · 山海纳气' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: '蓝山', query: 'Blue Mountains, NSW', sponsor_badge: null, secret_code: null },
        { name: 'Leura 小镇', query: 'Leura, NSW', sponsor_badge: null, secret_code: null },
        { name: '莫宁顿温泉', query: 'Mornington Peninsula Hot Springs', sponsor_badge: null, secret_code: null },
      ],
    }),
    'fr@AU': Object.freeze({
      title: "✦ GUIDE D'ÉCHAPPÉE & SÉRÉNITÉ ✦",
      subtitle: 'BLUE MOUNTAINS · MORNINGTON THERMAL',
      prose: "Ce week-end, cap sur la nature australienne : les Blue Mountains et leur brume d'eucalyptus, lookouts tranquilles — ou la péninsule de Mornington et ses sources chaudes au bord de la mer.\nHaltes : un flat white dans un village de montagne ; arrivez avant la tombée du jour pour laisser le bush faire son œuvre apaisante.",
      companionWhisper: "À éviter : les lookouts bondés les week-ends prolongés et les téléphériques à file d'attente. Gardez une demi-journée sans programme — le but est de souffler. Les lodges de caractère se trouvent autour de 150~220 $AU la nuit, un vrai luxe à prix juste.",
      bestWindowPrefix: 'Fenêtre de départ',
      defaultTiming: 'Samedi 09:00 - 10:30 départ',
      heading: { deg: 270, name: 'Ouest · Brume Bleue' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: 'Blue Mountains', query: 'Blue Mountains, NSW', sponsor_badge: null, secret_code: null },
        { name: 'Leura', query: 'Leura, NSW', sponsor_badge: null, secret_code: null },
        { name: 'Mornington', query: 'Mornington Peninsula Hot Springs', sponsor_badge: null, secret_code: null },
      ],
    }),
    'en@SEA': Object.freeze({
      title: '✦ SOUL ROADTRIP GUIDE ✦',
      subtitle: 'CHIANG MAI HIGHWAY · TROPICAL GROUNDING',
      prose: "This weekend points 'north' for fresh mountain energy: the Chiang Mai highland loop — misty switchbacks, roadside stalls brewing slow coffee — or a quiet Andaman cove far from the crowds, phone on silent.\nRefuel stops: a wooden café halfway up the ridge; arrive before dusk so the mountain calm can settle your nervous system.",
      companionWhisper: 'Avoid: long-weekend convoys on the main highway and cruise-ship beaches. Leave half a day unplanned — the point is exhaling, not checking boxes. Characterful mountain lodges run ~1,200–2,200 THB a night, far better value than any gated resort.',
      bestWindowPrefix: 'Departure Window',
      defaultTiming: 'Saturday 09:00 - 10:30 departure',
      heading: { deg: 0, name: 'North · Mountain Air' },
      // 🆕 E134（主公军令 2026-11-11）：三段式星轨路牌真实坐标（name 本地语显示 / query 原生地图导航串）；
      //    100K 里程碑赞助槽位预埋（sponsor_badge/secret_code 默认 null——界面零渲染，未来后台直配）。
      waypoints: [
        { name: 'Chiang Mai', query: 'Chiang Mai', sponsor_badge: null, secret_code: null },
        { name: 'Doi Inthanon', query: 'Doi Inthanon National Park', sponsor_badge: null, secret_code: null },
        { name: 'Mae Hong Son', query: 'Mae Hong Son', sponsor_badge: null, secret_code: null },
      ],
    }),
  }),
});

/** 模板取值（fail-closed：坏类型/坏语种 ⇒ null，en 兜底沿 AMULET 先例）
 *  🆕 E126 刀二：第三参 zone 可选——命中 `${lang}@${zone}` 变体则返回（语言不变、
 *  地理实体锚定物理生活区）；未命中/坏 zone ⇒ 回退语言基准模板（现行为零破坏）。 */
export function getLifestyleTemplate(type, lang, zone) {
  if (type !== 'style' && type !== 'roadtrip') return null;
  if (zone) {
    const variants = LIFESTYLE_GEO_VARIANTS[type];
    const v = variants && variants[`${lang}@${zone}`];
    if (v && v.prose && v.title) return v;
  }
  const row = LIFESTYLE_TEMPLATES_12[type];
  const tpl = row && (row[lang] || row.en);
  if (!tpl || !tpl.prose || !tpl.title) return null;
  return tpl;
}

/**
 * ═══════════ E134-AESTHETIC-25D-ROUTE-MAP（主公军令 2026-11-11）═══════════
 * 军师钦定六语词表（5 键——逐字录入军令对照表；零 i18n 新键，自容字典先例 E121+）：
 *   waypoint_1/2/3_tag 三段式星轨路牌、open_native_map 一键原生导航、
 *   route_map_subtitle 2.5D 沙盘副题。消费方：RoadtripRouteMap.tsx（SVG 沙盘）
 *   ＋lifestyleCanvasRenderer.mjs（1080×1748 画布沙盘）＋LifestyleMuseSlot.tsx。
 */
export const ROADTRIP_ROUTE_UI = Object.freeze({
  zh: Object.freeze({
    waypoint_1_tag: '启程·醒神',
    waypoint_2_tag: '驻足·纳气',
    waypoint_3_tag: '归宿·枕星',
    open_native_map: '✦ 导入原生地图，开启导航',
    route_map_subtitle: '2.5D 星轨气场漫游沙盘',
  }),
  en: Object.freeze({
    waypoint_1_tag: 'Dawn Awakening',
    waypoint_2_tag: 'Aura Absorption',
    waypoint_3_tag: 'Starlit Sanctuary',
    open_native_map: '✦ Open Route in Maps',
    route_map_subtitle: '2.5D Celestial Aura Route',
  }),
  fr: Object.freeze({
    waypoint_1_tag: "Éveil de l'Aube",
    waypoint_2_tag: 'Immersion Astrale',
    waypoint_3_tag: 'Sanctuaire Étoilé',
    open_native_map: "✦ Ouvrir l'itinéraire dans Plans",
    route_map_subtitle: "Carte Astrale d'Itinéraire 2.5D",
  }),
  es: Object.freeze({
    waypoint_1_tag: 'Despertar del Alba',
    waypoint_2_tag: 'Absorción de Aura',
    waypoint_3_tag: 'Santuario Estelar',
    open_native_map: '✦ Abrir ruta en Mapas',
    route_map_subtitle: 'Mapa de Ruta Astral 2.5D',
  }),
  th: Object.freeze({
    waypoint_1_tag: 'จุดเริ่มต้น·ปลุกพลัง',
    waypoint_2_tag: 'จุดพัก·รับพลังจักรวาล',
    waypoint_3_tag: 'จุดหมาย·พักพิงใต้ดาว',
    open_native_map: '✦ เปิดเส้นทางในแอปแผนที่',
    route_map_subtitle: 'แผนที่เส้นทางพลังงานดวงดาว 2.5D',
  }),
  vi: Object.freeze({
    waypoint_1_tag: 'Khởi Hành · Tỉnh Thức',
    waypoint_2_tag: 'Dừng Chân · Nạp Khí',
    waypoint_3_tag: 'Điểm Đến · Gối Sao',
    open_native_map: '✦ Mở lộ trình trong Bản đồ',
    route_map_subtitle: 'Bản Đồ Lộ Trình Khí Trường 2.5D',
  }),
});

/**
 * 2.5D 暗金等高线星轨沙盘几何规格（军令钦定单源——SVG 与 Canvas 双渲染域同源）：
 *   · viewBox 320×210（对话舱内嵌）；Canvas 域映射至徽记区 x∈[180,900]；
 *   · 三节点归一化坐标（起点左下/转折中右/终点右上）；
 *   · 等高线 stroke rgba(212,175,55,0.16)×5 层、航线金色三次贝塞尔＋呼吸光晕；
 *   · 画布路牌文字安全区 x∈[141,933]（E125 800px 安全区同族扩展军令钦定）。
 */
export const ROADTRIP_MAP_SPEC = Object.freeze({
  viewBoxWidth: 320,
  viewBoxHeight: 210,
  nodes: Object.freeze([
    Object.freeze({ nx: 0.13, ny: 0.76 }),
    Object.freeze({ nx: 0.60, ny: 0.47 }),
    Object.freeze({ nx: 0.86, ny: 0.20 }),
  ]),
  contourColor: 'rgba(212,175,55,0.16)',
  contourLayers: 5,
  routeColor: '#D4AF37',
  canvasSafeX: Object.freeze({ minX: 141, maxX: 933 }),
});
