// 🤝 E159-刀二（主公军令 2026-11-27）：三模块解读按场景分流 · 六语场景词典（纯函数，零外部依赖）
//   · 情爱（romance）＝既有文案逐字节不变；商道（business）/挚友（friendship）＝本文件场景文案。
//   · 底层排盘真理（卦象/星座相位/四柱/评分）不随场景变；只有「解读语」随场景换。
//   · 🔴 商道/挚友语境严禁出现情爱穿帮词（姻缘解读/感情生活/恋爱者/旧情换新颜/吸引力/姻缘/合婚）。
//   · 词条为权威手写六语（zh/en/fr/es/th/vi），严禁机翻。
//   · 占位符：${B} 关系名 / ${O} 对方 / ${OS} 对方属格 / ${A} ${B2} 干支或星座名 / ${L} 爻位 / ${N} 卦名 / ${num} 卦序
//     ${P1} ${P2} 柱名 / ${D} 角度 / ${T} 次数 / ${A1} ${A2} 干支

export type CompatScene = 'romance' | 'business' | 'friendship';
export type SceneLang = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';
export type PairScene = 'business' | 'friendship';

const SCENES: CompatScene[] = ['romance', 'business', 'friendship'];

/** 场景白名单（非法/缺省 ⇒ 情爱；绝不回显原始入参） */
export function normalizeCompatScene(raw: unknown): CompatScene {
  return SCENES.indexOf(raw as CompatScene) !== -1 ? (raw as CompatScene) : 'romance';
}

/** 六语白名单（非法 ⇒ en） */
export function normalizeSceneLang(raw: unknown): SceneLang {
  return raw === 'zh' || raw === 'en' || raw === 'fr' || raw === 'es' || raw === 'th' || raw === 'vi' ? raw : 'en';
}

type Row = Record<SceneLang, string>;

/** 场景基础词元（标题/对方称谓/关系名）——与 resonanceI18n.mjs 的 iching_heading_* 逐字同源 */
const TOKENS: Record<PairScene, { heading: Row; other: Row; others: Row; bond: Row }> = {
  business: {
    heading: { zh: '商道解读', en: 'Alliance Reading', fr: 'Lecture Alliance', es: 'Lectura de Alianza', th: 'คำทำนายพันธมิตร', vi: 'Luận Giải Đồng Hành' },
    other: { zh: '搭档', en: 'ally', fr: 'allié', es: 'aliado', th: 'พันธมิตร', vi: 'đồng đội' },
    others: { zh: '搭档的', en: "ally's", fr: 'de votre allié', es: 'de tu aliado', th: 'ของพันธมิตร', vi: 'của đồng đội' },
    bond: { zh: '合作', en: 'alliance', fr: 'alliance', es: 'alianza', th: 'ความร่วมมือ', vi: 'hợp tác' },
  },
  friendship: {
    heading: { zh: '挚友解读', en: 'Kindred Reading', fr: 'Lecture Complicité', es: 'Lectura de Afinidad', th: 'คำทำนายกัลยาณมิตร', vi: 'Luận Giải Tri Kỷ' },
    other: { zh: '挚友', en: 'friend', fr: 'ami', es: 'amigo', th: 'เพื่อนสนิท', vi: 'bạn thân' },
    others: { zh: '挚友的', en: "friend's", fr: 'de votre ami', es: 'de tu amigo', th: 'ของเพื่อน', vi: 'của bạn thân' },
    bond: { zh: '情谊', en: 'friendship', fr: 'amitié', es: 'amistad', th: 'มิตรภาพ', vi: 'tình bạn' },
  },
};

const YOU: Row = { zh: '你', en: 'Your', es: 'Tu', fr: 'Votre', th: 'ของคุณ', vi: 'của bạn' };
const YOU_LOWER: Row = { zh: '你', en: 'your', es: 'tuyo', fr: 'votre', th: 'ของคุณ', vi: 'của bạn' };
const YOU_BARE: Row = { zh: '你', en: 'you', es: 'ti', fr: 'vous', th: 'คุณ', vi: 'bạn' };

const uc = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

type Tpl = (v: Record<string, string | number>) => string;
const tpl = (s: string): Tpl => (v) => s.replace(/\$\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m));
const row = (r: Row, lang: SceneLang): string => r[lang] || r.en;

/* ═══════════════ 易经：卦象等级 × 场景 解读正文（六语手写） ═══════════════ */
export type HexCat = '大吉' | '吉' | '中' | '小凶' | '待变';
export const HEX_CATS: HexCat[] = ['大吉', '吉', '中', '小凶', '待变'];

const ICHING_READING: Record<PairScene, Record<HexCat, Row>> = {
  business: {
    '大吉': {
      zh: '卦象大吉：两人气场天然合拍，协同几乎不需要磨合；资源互通、各展所长，是难得的黄金搭档格局。',
      en: 'A supremely auspicious hexagram: your energies align naturally and coordination needs almost no adjustment. Resources flow both ways and each of you plays to their strengths — a rare golden partnership.',
      fr: 'Hexagramme très auspice : vos énergies s\'accordent naturellement et la coordination demande presque aucun ajustement. Les ressources circulent dans les deux sens et chacun joue ses atouts — un partenariat en or, chose rare.',
      es: 'Hexagrama muy auspicioso: sus energías se alinean de forma natural y la coordinación casi no necesita ajustes. Los recursos fluyen en ambos sentidos y cada uno aporta lo mejor de sí — una alianza dorada, poco común.',
      th: 'ลางมงคลสูงสุด: พลังงานของทั้งคู่เข้ากันเองโดยธรรมชาติ แทบไม่ต้องปรับตัว ทรัพยากรไหลถึงกันและกัน ต่างคนต่างโชว์จุดแข็ง — เป็นรูปแบบพันธมิตรระดับทองคำที่หาได้ยาก',
      vi: 'Quẻ đại cát: năng lượng hai người tự nhiên cộng hưởng, hầu như không cần chỉnh hợp. Tài nguyên cùng chia sẻ, mỗi người phát huy sở trường — hiếm có một sự hợp tác vàng.',
    },
    '吉': {
      zh: '卦象呈吉：合作有默契、资源能互补，推进时机宜稳步向前；遇分歧时多商量，共赢可期。',
      en: 'An auspicious hexagram: cooperation runs smoothly and resources complement each other; the timing favors steady advance. Talk through any disagreement and a win-win is within reach.',
      fr: 'Hexagramme auspice : la coopération est fluide et les ressources se complètent ; le moment est propice à une avancée régulière. Concertez-vous face aux désaccords et le gain mutuel est en vue.',
      es: 'Hexagrama auspicioso: la cooperación fluye y los recursos se complementan; el momento favorece un avance constante. Consulten ante las diferencias y el beneficio mutuo está al alcance.',
      th: 'ลางมงคล: ความร่วมมือมีความเข้าใจกัน ทรัพยากรเสริมกัน จังหวะเวลาเอื้อให้ก้าวไปอย่างมั่นคง หากมีความเห็นต่างกันให้ปรึกษากัน ผลลัพธ์ที่ทั้งสองฝ่ายได้ประโยชน์อยู่ในมือ',
      vi: 'Quẻ cát: hợp tác ăn ý, tài nguyên bổ trợ nhau, thời điểm thuận lợi để tiến lên ổn định. Gặp bất đồng thì cùng bàn bạc, kết quả đôi bên cùng có lợi là trong tầm tay.',
    },
    '中': {
      zh: '卦象居中：合作基础平稳，协同与分工需要慢慢磨合；资源各有所长，先立规则再谈推进，变通是关键。',
      en: 'A neutral hexagram: the foundation is stable, yet roles and coordination still need tuning. Each side holds different resources — set the rules first, then push forward; flexibility is the key.',
      fr: 'Hexagramme neutre : la base est stable, mais les rôles et la coordination demandent encore des réglages. Chacun apporte des ressources différentes — fixez d\'abord les règles, puis avancez ; la souplesse est la clé.',
      es: 'Hexagrama neutro: la base es estable, aunque los roles y la coordinación aún necesitan ajustes. Cada parte aporta recursos distintos — acuerden las reglas primero y luego avancen; la flexibilidad es la clave.',
      th: 'ลางกลาง: รากฐานความร่วมมือมั่นคง แต่การประสานงานและการแบ่งบทบาทยังต้องปรับจูง ต่างคนต่างมีทรัพยากรจุดแข็งไม่เหมือนกัน ควรวางกติกาก่อนแล้วค่อยคุยเรื่องก้าวต่อไป ความยืดหยุ่นคือหัวใจ',
      vi: 'Quẻ trung bình: nền tảng hợp tác ổn định, nhưng sự phối hợp và phân vai cần thời gian điều chỉnh. Mỗi bên có thế mạnh tài nguyên riêng — hãy thống nhất nguyên tắc trước rồi mới tính bước tiến; sự linh hoạt là chìa khóa.',
    },
    '小凶': {
      zh: '卦象小凶：合作中容易节奏不一、资源错位；推进时机宜缓不宜急，先对齐目标再分工，多一分变通少一分内耗。',
      en: 'A mildly inauspicious hexagram: rhythms may drift apart and resources misalign. Better to slow the pace, align goals before dividing roles, and stay flexible to avoid friction.',
      fr: 'Hexagramme peu auspice : les rythmes risquent de diverger et les ressources de se décaler. Mieux vaut ralentir, aligner les objectifs avant de répartir les rôles, et rester souple pour limiter les frottements.',
      es: 'Hexagrama poco auspicioso: los ritmos pueden desfasarse y los recursos desalinearse. Conviene frenar el avance, alinear objetivos antes de repartir roles y mantenerse flexibles para evitar roces.',
      th: 'ลางค่อนข้างไม่ดี: จังหวะการทำงานอาจไม่ตรงกันและทรัพยากรอาจเหลื่อมกัน ควรชะลอจังหวะการก้าวต่อไป ปรับเป้าหมายให้ตรงกันก่อนแบ่งบทบาท ยืดหยุ่นมากสักหน่อยเพื่อลดแรงเสียดทานภายใน',
      vi: 'Quẻ tiểu xấu: nhịp độ hợp tác dễ lệch nhau, tài nguyên dễ chồng chéo. Nên chậm lại một chút, thống nhất mục tiêu trước rồi mới phân vai; thêm một chút linh hoạt, bớt một chút hao tổn nội bộ.',
    },
    '待变': {
      zh: '卦象待变：合作格局尚未定型，推进时机仍在酝酿；此时不宜冒进，先理清资源与分工，静候契机再落子。',
      en: 'A hexagram awaiting change: the partnership is still taking shape and the right moment to advance is brewing. Hold off on bold moves, clarify resources and roles, and wait for the opening.',
      fr: 'Hexagramme en attente de changement : le partenariat se dessine encore et le bon moment d\'avancer mûrit. Évitez les gestes brusques, clarifiez ressources et rôles, puis attendez l\'ouverture.',
      es: 'Hexagrama a la espera del cambio: la alianza aún está tomando forma y el momento de avanzar está madurando. Eviten movimientos audaces, aclaren recursos y roles, y esperen la apertura.',
      th: 'ลางรอการเปลี่ยนแปลง: รูปแบบความร่วมมือยังไม่ชัดเจน จังหวะเวลาที่จะก้าวต่อยังอยู่ในช่วงก่อตัว ยังไม่ควรรีบเร่ง ควรทำความชัดเจนเรื่องทรัพยากรและการแบ่งบทบาท แล้วตั้งตารอจังหวะก่อนลงมือ',
      vi: 'Quẻ chờ biến chuyển: bố cục hợp tác chưa định hình, thời điểm tiến công vẫn đang ươm mầm. Chưa nên liều lĩnh, hãy làm rõ tài nguyên và phân vai, kiên nhẫn chờ thời rồi mới ra quân.',
    },
  },
  friendship: {
    '大吉': {
      zh: '卦象大吉：两人气场天然同频，信任几乎一见即立；圈层相合、长期默契可期，是难得的知己格局。',
      en: 'A supremely auspicious hexagram: you are naturally on the same wavelength and trust forms almost at first meeting. Your circles align and long-term rapport is promised — a rare kindred bond.',
      fr: 'Hexagramme très auspice : vous êtes naturellement sur la même longueur d\'onde et la confiance s\'installe presque dès la première rencontre. Vos cercles s\'accordent et une complicité durable s\'annonce — un lien de confident rare.',
      es: 'Hexagrama muy auspicioso: están naturalmente en sintonía y la confianza se forma casi desde el primer encuentro. Sus círculos se complementan y se avizora una sintonía duradera — un vínculo de afinidad poco común.',
      th: 'ลางมงคลสูงสุด: ทั้งคู่อยู่ในคลื่นเดียวกันโดยธรรมชาติ ความไว้ใจเกิดขึ้นเกือบตั้งแต่แรกพบ วงสังคมของคุณสอดคล้องกัน และมีแนวโน้มที่จะเข้าใจกันยาวนาน — เป็นรูปแบบกัลยาณมิตรที่หาได้ยาก',
      vi: 'Quẻ đại cát: hai người tự nhiên đồng điệu, niềm tin gần như lập tức hình thành khi mới gặp. Vòng bạn bè tương hợp, ăn ý lâu dài là điều có thể kỳ vọng — một tình tri kỷ hiếm có.',
    },
    '吉': {
      zh: '卦象呈吉：相处轻松、信任稳步累积，圈层同频；多主动关心彼此，长期默契会越来越深。',
      en: 'An auspicious hexagram: time together feels easy, trust grows steadily and your circles resonate. Keep checking in on each other and the long-term rapport will deepen.',
      fr: 'Hexagramme auspice : l\'amitié est facile, la confiance grandit pas à pas et vos cercles résonnent à l\'unisson. Continuez à prendre des nouvelles et la complicité durable s\'approfondira.',
      es: 'Hexagrama auspicioso: convivir resulta fácil, la confianza crece de forma constante y sus círculos resuenan afines. Sigan mostrándose interés mutuamente y la sintonía duradera se profundizará.',
      th: 'ลางมงคล: การอยู่ร่วมกันราบรื่น ความไว้ใจค่อยๆ สะสม วงสังคมของคุณเข้ากันได้ดี หากต่างฝ่ายต่างใส่ใจกัน ความเข้าใจกันระยะยาวจะยิ่งลึกซึ้งขึ้น',
      vi: 'Quẻ cát: ở bên nhau thấy thoải mái, niềm tin tăng dần đều đặn, vòng bạn bè đồng điệu. Chủ động quan tâm nhau nhiều hơn, sự ăn ý lâu dài sẽ ngày càng sâu đậm.',
    },
    '中': {
      zh: '卦象居中：友情基础平稳，信任需要时间沉淀；圈层与节奏略有差异，多沟通多迁就，默契自然生长。',
      en: 'A neutral hexagram: the friendship rests on stable ground, but trust takes time to settle. Circles and rhythms differ slightly — communicate more, yield a little, and the rapport grows on its own.',
      fr: 'Hexagramme neutre : l\'amitié repose sur une base stable, mais la confiance demande du temps. Cercles et rythmes diffèrent légèrement — parlez davantage, cédez un peu, et la complicité grandira d\'elle-même.',
      es: 'Hexagrama neutro: la amistad se apoya en una base estable, aunque la confianza necesita tiempo para asentarse. Los círculos y ritmos difieren un poco — comuníquense más, cédan un poco y la sintonía crecerá sola.',
      th: 'ลางกลาง: มิตรภาพมีรากฐานมั่นคง แต่ความไว้ใจต้องอาศัยเวลา วงสังคมของคุณกับจังหวะชีวิตต่างกันเล็กน้อย — พูดคุยกันมากขึ้น ผ่อนปรนมากขึ้น ความเข้าใจกันจะเติบโตเอง',
      vi: 'Quẻ trung bình: tình bạn đứng trên nền tảng ổn định, nhưng niềm tin cần thời gian lắng đọng. Vòng quan hệ và nhịp sống hơi khác biệt — hãy nói chuyện nhiều hơn, nhường nhịn một chút, sự ăn ý sẽ tự lớn lên.',
    },
    '小凶': {
      zh: '卦象小凶：相处中容易有误会与距离感，信任需要更用心经营；少一些主观臆断，多一分坦诚与长期陪伴。',
      en: 'A mildly inauspicious hexagram: misunderstandings and distance may creep in, and trust needs more deliberate care. Judge less, and offer more honesty and steady company.',
      fr: 'Hexagramme peu auspice : malentendus et distance peuvent s\'installer, et la confiance demande plus d\'attention. Jugez moins, et offrez plus de franchise et une présence régulière.',
      es: 'Hexagrama poco auspicioso: pueden colarse malentendidos y distancia, y la confianza necesita más cuidado. Juzguen menos, y ofrezcan más sinceridad y compañía constante.',
      th: 'ลางค่อนข้างไม่ดี: อาจเกิดความเข้าใจผิดและรู้สึกห่างเหิน ความไว้ใจต้องดูแลกันให้มากขึ้น อย่าตัดสินกันเอง และให้ความจริงใจกับการอยู่เคียงข้างกันมากขึ้น',
      vi: 'Quẻ tiểu xấu: dễ nảy sinh hiểu lầm và khoảng cách, niềm tin cần được vun đắp nhiều hơn. Đừng vội phán đoán, hãy thêm thật lòng và đồng hành bền lâu.',
    },
    '待变': {
      zh: '卦象待变：友情正处在一个转折点，亲疏远近尚未定；此刻宜以诚相待、静观其变，信任经得起时间考验。',
      en: 'A hexagram awaiting change: the friendship stands at a turning point and closeness is still unsettled. Meet each other with sincerity, let things unfold, and trust will stand the test of time.',
      fr: 'Hexagramme en attente de changement : l\'amitié se trouve à un tournant et la proximité reste à définir. Restez sincères, laissez les choses évoluer, et la confiance passera l\'épreuve du temps.',
      es: 'Hexagrama a la espera del cambio: la amistad está en un punto de inflexión y la cercanía aún no se define. Trátense con sinceridad, dejen que todo fluya, y la confianza superará la prueba del tiempo.',
      th: 'ลางรอการเปลี่ยนแปลง: มิตรภาพกำลังอยู่ที่จุดเปลี่ยน ความใกล้ชิดยังไม่แน่นอน ช่วงนี้ควรจริงใจต่อกันและคอยสังเกต ความไว้ใจจะผ่านการทดสอบของเวลา',
      vi: 'Quẻ chờ biến chuyển: tình bạn đang ở bước ngoặt, gần xa chưa định. Lúc này hãy thật lòng với nhau, tĩnh quan sự biến, niềm tin sẽ vượt qua thử thách của thời gian.',
    },
  },
};

/* 易经摘要尾句（替代情爱「缘分稳中有升/需用心经营」） */
const ICHING_TAIL: Record<PairScene, Record<HexCat, Row>> = {
  business: {
    '大吉': { zh: '协同稳中有升', en: 'steady cooperation with growing potential', es: 'cooperación estable con potencial de crecimiento', fr: 'coopération stable au potentiel croissant', th: 'ความร่วมมือมั่นคงและเติบโต', vi: 'sự hợp tác vững chắc, tiềm năng tăng trưởng' },
    '吉': { zh: '协同稳中有升', en: 'steady cooperation with growing potential', es: 'cooperación estable con potencial de crecimiento', fr: 'coopération stable au potentiel croissant', th: 'ความร่วมมือมั่นคงและเติบโต', vi: 'sự hợp tác vững chắc, tiềm năng tăng trưởng' },
    '中': { zh: '需先立规则再推进', en: 'needs clear rules before advancing', es: 'necesita reglas claras antes de avanzar', fr: 'nécessite des règles claires avant d\'avancer', th: 'ต้องวางกติกาให้ชัดก่อนก้าวต่อ', vi: 'cần thống nhất nguyên tắc trước khi tiến' },
    '小凶': { zh: '虽遇波折但有转机', en: 'bumps ahead but turning points follow', es: 'baches pero llegan puntos de inflexión', fr: 'des bosses mais des tournants suivent', th: 'มีอุปสรรคแต่จุดเปลี่ยนตามมา', vi: 'có thử thách nhưng bước ngoặt sẽ đến' },
    '待变': { zh: '待变之象，静候转机', en: 'pending change, await turning points', es: 'cambio pendiente, esperen puntos de inflexión', fr: 'changement en attente', th: 'รอการเปลี่ยนแปลง', vi: 'đang chờ biến chuyển, hãy kiên nhẫn' },
  },
  friendship: {
    '大吉': { zh: '情谊稳中有升', en: 'steady friendship with growing potential', es: 'amistad estable con potencial de crecimiento', fr: 'amitié stable au potentiel croissant', th: 'มิตรภาพมั่นคงและเติบโต', vi: 'tình bạn vững chắc, tiềm năng tăng trưởng' },
    '吉': { zh: '情谊稳中有升', en: 'steady friendship with growing potential', es: 'amistad estable con potencial de crecimiento', fr: 'amitié stable au potentiel croissant', th: 'มิตรภาพมั่นคงและเติบโต', vi: 'tình bạn vững chắc, tiềm năng tăng trưởng' },
    '中': { zh: '需用心经营', en: 'needs intention to deepen', es: 'necesita intención para profundizar', fr: 'nécessite de l\'intention pour approfondir', th: 'ต้องตั้งใจดูแลให้ลึกซึ้ง', vi: 'cần dụng tâm vun đắp' },
    '小凶': { zh: '虽遇波折但有转机', en: 'bumps ahead but turning points follow', es: 'baches pero llegan puntos de inflexión', fr: 'des bosses mais des tournants suivent', th: 'มีอุปสรรคแต่จุดเปลี่ยนตามมา', vi: 'có thử thách nhưng bước ngoặt sẽ đến' },
    '待变': { zh: '待变之象，静候转机', en: 'pending change, await turning points', es: 'cambio pendiente, esperen puntos de inflexión', fr: 'changement en attente', th: 'รอการเปลี่ยนแปลง', vi: 'đang chờ biến chuyển, hãy kiên nhẫn' },
  },
};

/* ═══════════════ 星座 / 八字 / 四维提示 模板 ═══════════════ */
const Z = {
  ta: {
    business: { zh: '搭档', en: 'Ally', fr: 'Allié', es: 'Aliado', th: 'พันธมิตร', vi: 'Đồng đội' },
    friendship: { zh: '挚友', en: 'Friend', fr: 'Ami', es: 'Amigo', th: 'เพื่อนสนิท', vi: 'Bạn thân' },
  },
  bestMatch: {
    business: { zh: '${A}与${B}在经典配对表中属于最佳组合之一，协同有先天优势', en: '${A} and ${B} are one of the classic best matches — a natural edge for working together', fr: '${A} et ${B} forment un des meilleurs duos classiques — un avantage naturel pour travailler ensemble', es: '${A} y ${B} son una de las mejores combinaciones clásicas — ventaja natural para trabajar juntos', th: '${A}และ${B}เป็นหนึ่งในคู่ที่เข้ากันได้ดีที่สุดแบบคลาสสิก — มีความได้เปรียบตามธรรมชาติในการทำงานร่วมกัน', vi: '${A} và ${B} là một trong những cặp tương hợp kinh điển nhất — lợi thế sẵn có khi cùng làm việc' },
    friendship: { zh: '${A}与${B}在经典配对表中属于最佳组合之一，是天然的默契知己', en: '${A} and ${B} are one of the classic best matches — natural kindred spirits', fr: '${A} et ${B} forment un des meilleurs duos classiques — une complicité naturelle', es: '${A} y ${B} son una de las mejores combinaciones clásicas — afinidad natural', th: '${A}และ${B}เป็นหนึ่งในคู่ที่เข้ากันได้ดีที่สุดแบบคลาสสิก — เข้าใจกันโดยธรรมชาติ', vi: '${A} và ${B} là một trong những cặp tương hợp kinh điển nhất — tri kỷ ăn ý tự nhiên' },
  },
  oppositeMatch: {
    business: { zh: '${A}与${B}互为对宫，互补性极强但节奏需磨合', en: '${A} and ${B} are opposite signs — strong complementarity, but rhythm needs tuning', fr: '${A} et ${B} sont des signes opposés — forte complémentarité, mais le rythme demande des réglages', es: '${A} y ${B} son signos opuestos — gran complementariedad, pero el ritmo necesita ajustes', th: '${A}และ${B}เป็นราศีตรงข้ามกัน — เสริมกันได้มาก แต่จังหวะต้องปรับจูง', vi: '${A} và ${B} là hai cung đối đỉnh — bổ trợ mạnh nhưng nhịp độ cần chỉnh' },
    friendship: { zh: '${A}与${B}互为对宫，性格互补，越处越有默契', en: '${A} and ${B} are opposite signs — complementary natures, rapport grows with time', fr: '${A} et ${B} sont des signes opposés — natures complémentaires, la complicité grandit avec le temps', es: '${A} y ${B} son signos opuestos — naturalezas complementarias, la sintonía crece con el tiempo', th: '${A}และ${B}เป็นราศีตรงข้ามกัน — นิสัยเสริมกัน ยิ่งอยู่ด้วยกันยิ่งเข้าใจกัน', vi: '${A} và ${B} là hai cung đối đỉnh — tính cách bổ trợ, càng ở lâu càng ăn ý' },
  },
  scoreHigh: {
    business: { zh: '星辰为证，协同天成', en: 'Stars bear witness — natural allies', fr: 'Les étoiles en témoignent — complices naturels', es: 'Las estrellas atestiguan — aliados naturales', th: 'ดวงดาวเป็นพยาน — พันธมิตรโดยธรรมชาติ', vi: 'Các vì sao làm chứng — đồng đội trời sinh' },
    friendship: { zh: '星辰为证，情谊深厚', en: 'Stars bear witness — deep friendship', fr: 'Les étoiles en témoignent — amitié profonde', es: 'Las estrellas atestiguan — amistad profunda', th: 'ดวงดาวเป็นพยาน — มิตรภาพลึกซึ้ง', vi: 'Các vì sao làm chứng — tình bạn sâu sắc' },
  },
  scoreMid: {
    business: { zh: '星光指引，合作值得期待', en: 'Starlight guides — the alliance is worth looking forward to', fr: 'La lumière des étoiles guide — l\'alliance promet', es: 'La luz de las estrellas guía — la alianza promete', th: 'แสงดาวนำทาง — ความร่วมมือน่าตั้งตารอ', vi: 'Ánh sao dẫn lối — sự hợp tác đáng trông chờ' },
    friendship: { zh: '星光指引，友情值得期待', en: 'Starlight guides — the friendship is worth looking forward to', fr: 'La lumière des étoiles guide — l\'amitié promet', es: 'La luz de las estrellas guía — la amistad promete', th: 'แสงดาวนำทาง — มิตรภาพน่าตั้งตารอ', vi: 'Ánh sao dẫn lối — tình bạn đáng trông chờ' },
  },
  scoreLow: {
    business: { zh: '星途虽有挑战，同心协力可越', en: 'Starry path has challenges — pull together and you can overcome', fr: 'Le chemin étoilé a des défis — unissez vos forces et vous surmonterez', es: 'El camino estelar tiene desafíos — unan esfuerzos y los superarán', th: 'เส้นทางดาวมีความท้าทาย — ร่วมแรงกันก็ฝ่าฟันได้', vi: 'Đường sao có thách thức — đồng lòng là vượt qua' },
    friendship: { zh: '星途虽有挑战，真心相伴可越', en: 'Starry path has challenges — with sincerity you can overcome', fr: 'Le chemin étoilé a des défis — avec sincérité vous surmonterez', es: 'El camino estelar tiene desafíos — con sinceridad los superarán', th: 'เส้นทางดาวมีความท้าทาย — ด้วยความจริงใจก็ฝ่าฟันได้', vi: 'Đường sao có thách thức — chân thành là vượt qua' },
  },
  golden: {
    business: { zh: '${A}与${B}的配置堪称黄金搭档，星星都在为你们开路。', en: '${A} and ${B} form a golden partnership — the stars clear the way for you both.', fr: '${A} et ${B} forment un partenariat en or — les étoiles vous ouvrent la route.', es: '${A} y ${B} forman una alianza dorada — las estrellas les abren camino.', th: '${A}และ${B}เป็นพันธมิตรระดับทองคำ — ดวงดาวเปิดทางให้ทั้งคู่', vi: '${A} và ${B} là bộ đôi vàng — các vì sao đã mở đường cho hai bạn.' },
    friendship: { zh: '${A}与${B}的配置堪称知己配对，星星都在为你们让路。', en: '${A} and ${B} form a kindred pairing — the stars align for you both.', fr: '${A} et ${B} forment un duo de confidents — les étoiles s\'alignent pour vous deux.', es: '${A} y ${B} forman una afinidad de confianza — las estrellas se alinean para ambos.', th: '${A}และ${B}เป็นคู่กัลยาณมิตร — ดวงดาวเอื้ออำนวยให้ทั้งคู่', vi: '${A} và ${B} là cặp tri kỷ — các vì sao đã an bài cho hai bạn.' },
  },
  chemistry: {
    business: { zh: '${A}(你)遇上${B}(搭档)，星座能量形成高效的协同反应。', en: '${A} (you) meets ${B} (ally) — cosmic energies spark a highly effective collaboration.', fr: '${A} (vous) rencontre ${B} (allié) — les énergies cosmiques créent une collaboration très efficace.', es: '${A} (tú) encuentra ${B} (aliado) — las energías cósmicas crean una colaboración muy eficaz.', th: '${A}(คุณ)พบ${B}(พันธมิตร) — พลังจักรวาลสร้างการร่วมมือที่มีประสิทธิภาพ', vi: '${A} (bạn) gặp ${B} (đồng đội) — năng lượng vũ trụ tạo nên sự phối hợp hiệu quả.' },
    friendship: { zh: '${A}(你)遇上${B}(挚友)，星座能量形成有趣的同频反应。', en: '${A} (you) meets ${B} (friend) — cosmic energies spark a fascinating kindred rapport.', fr: '${A} (vous) rencontre ${B} (ami) — les énergies cosmiques créent une complicité fascinante.', es: '${A} (tú) encuentra ${B} (amigo) — las energías cósmicas crean una afinidad fascinante.', th: '${A}(คุณ)พบ${B}(เพื่อนสนิท) — พลังจักรวาลสร้างความเข้ากันอย่างน่าสนใจ', vi: '${A} (bạn) gặp ${B} (bạn thân) — năng lượng vũ trụ tạo nên sự đồng điệu thú vị.' },
  },
  understanding: {
    business: { zh: '${A}与${B}的组合需要更多理解，但差异正是互补的来源。', en: '${A} and ${B} need more understanding, but differences fuel complementarity.', fr: '${A} et ${B} nécessitent plus de compréhension, mais les différences nourrissent la complémentarité.', es: '${A} y ${B} necesitan más comprensión, pero las diferencias alimentan la complementariedad.', th: '${A}และ${B}ต้องการความเข้าใจมากขึ้น แต่ความต่างคือที่มาของการเสริมกัน', vi: '${A} và ${B} cần thêm sự thấu hiểu, nhưng chính sự khác biệt lại nuôi dưỡng sự bổ trợ.' },
    friendship: { zh: '${A}与${B}的组合需要更多理解，但差异正是默契的来源。', en: '${A} and ${B} need more understanding, but differences feed the rapport.', fr: '${A} et ${B} nécessitent plus de compréhension, mais les différences nourrissent la complicité.', es: '${A} y ${B} necesitan más comprensión, pero las diferencias alimentan la sintonía.', th: '${A}และ${B}ต้องการความเข้าใจมากขึ้น แต่ความต่างคือที่มาของความเข้าใจกัน', vi: '${A} và ${B} cần thêm sự thấu hiểu, nhưng chính sự khác biệt lại nuôi dưỡng sự ăn ý.' },
  },
  opposite: {
    business: { zh: '对宫相遇，强烈的对立感背后是等量的互补能量。', en: 'Opposing signs meet — strong polarity hides an equal complementary force.', fr: 'Signes opposés se rencontrent — forte polarité cache une force complémentaire égale.', es: 'Signos opuestos se encuentran — fuerte polaridad esconde una fuerza complementaria igual.', th: 'ราศีตรงข้ามพบกัน — ขั้วตรงข้ามซ่อนพลังเสริมกันในปริมาณเท่ากัน', vi: 'Cung đối nghịch gặp nhau — đối lập ẩn chứa lực bổ trợ ngang nhau.' },
    friendship: { zh: '对宫相遇，强烈的对立感背后是等量的互补能量。', en: 'Opposing signs meet — strong polarity hides an equal complementary force.', fr: 'Signes opposés se rencontrent — forte polarité cache une force complémentaire égale.', es: 'Signos opuestos se encuentran — fuerte polaridad esconde una fuerza complementaria igual.', th: 'ราศีตรงข้ามพบกัน — ขั้วตรงข้ามซ่อนพลังเสริมกันในปริมาณเท่ากัน', vi: 'Cung đối nghịch gặp nhau — đối lập ẩn chứa lực bổ trợ ngang nhau.' },
  },
  phaseOpposition: {
    business: { zh: '对宫相位(${A} ↔ ${B})，互补性极强但需平衡差异', en: 'Opposition (${A} ↔ ${B}) — strong complementarity but requires balancing differences', fr: 'Opposition (${A} ↔ ${B}) — complémentarité forte mais nécessite d\'équilibrer les différences', es: 'Oposición (${A} ↔ ${B}) — gran complementariedad pero requiere equilibrar diferencias', th: 'ตรงข้าม (${A} ↔ ${B}) — เสริมกันได้มาก แต่ต้องสมดุลความแตกต่าง', vi: 'Đối đỉnh (${A} ↔ ${B}) — bổ trợ mạnh nhưng cần cân bằng khác biệt' },
    friendship: { zh: '对宫相位(${A} ↔ ${B})，性格互补但需平衡差异', en: 'Opposition (${A} ↔ ${B}) — complementary natures but requires balancing differences', fr: 'Opposition (${A} ↔ ${B}) — natures complémentaires mais nécessite d\'équilibrer les différences', es: 'Oposición (${A} ↔ ${B}) — naturalezas complementarias pero requiere equilibrar diferencias', th: 'ตรงข้าม (${A} ↔ ${B}) — นิสัยเสริมกัน แต่ต้องสมดุลความแตกต่าง', vi: 'Đối đỉnh (${A} ↔ ${B}) — tính cách bổ trợ nhưng cần cân bằng khác biệt' },
  },
  phaseSpecial: {
    business: { zh: '特殊相位(角度差${D}°)，有独特的合作火花', en: 'Special aspect (${D}° apart) — a unique working spark', fr: 'Aspect spécial (à ${D}°) — une étincelle de collaboration unique', es: 'Aspecto especial (a ${D}°) — una chispa de colaboración única', th: 'มุมพิเศษ (${D}°) — ประกายการทำงานร่วมกันที่เป็นเอกลักษณ์', vi: 'Góc đặc biệt (${D}°) — tia lửa hợp tác độc đáo' },
    friendship: { zh: '特殊相位(角度差${D}°)，有独特的默契火花', en: 'Special aspect (${D}° apart) — a unique spark of rapport', fr: 'Aspect spécial (à ${D}°) — une étincelle de complicité unique', es: 'Aspecto especial (a ${D}°) — una chispa de sintonía única', th: 'มุมพิเศษ (${D}°) — ประกายความเข้าใจกันที่เป็นเอกลักษณ์', vi: 'Góc đặc biệt (${D}°) — tia lửa ăn ý độc đáo' },
  },
};

const B = {
  hehunTitle: {
    business: { zh: '【合作格局】', en: '[Partnership Dynamics]', fr: '[Dynamique de l\'Alliance]', es: '[Dinámica de Alianza]', th: '[พลวัตความร่วมมือ]', vi: '[Động Lực Hợp Tác]' },
    friendship: { zh: '【相处之道】', en: '[Friendship Dynamics]', fr: '[Dynamique de l\'Amitié]', es: '[Dinámica de Amistad]', th: '[พลวัตมิตรภาพ]', vi: '[Động Lực Tình Bạn]' },
  },
  hehunPlain: {
    business: { zh: '合作格局', en: 'Partnership Dynamics', fr: 'Dynamique de l\'alliance', es: 'Dinámica de alianza', th: 'พลวัตความร่วมมือ', vi: 'Động lực hợp tác' },
    friendship: { zh: '相处之道', en: 'Friendship Dynamics', fr: 'Dynamique de l\'amitié', es: 'Dinámica de amistad', th: 'พลวัตมิตรภาพ', vi: 'Động lực tình bạn' },
  },
  ta: {
    business: { zh: '搭档', en: 'Ally', fr: 'Votre allié', es: 'Tu aliado', th: 'พันธมิตร', vi: 'Đồng đội' },
    friendship: { zh: '挚友', en: 'Friend', fr: 'Votre ami', es: 'Tu amigo', th: 'เพื่อนสนิท', vi: 'Bạn thân' },
  },
  detailTa: {
    business: { zh: '搭档', en: "Ally's", fr: 'Allié', es: 'Aliado', th: 'ของพันธมิตร', vi: 'của đồng đội' },
    friendship: { zh: '挚友', en: "Friend's", fr: 'Ami', es: 'Amigo', th: 'ของเพื่อน', vi: 'của bạn thân' },
  },
  liuhe: {
    business: { zh: '日干${A1}与${A2}形成【天干六合】，合作纽带极强', en: 'Day Stems ${A1} & ${A2} form a Six Harmony — a powerful working bond', fr: 'Tiges ${A1} et ${A2} forment Six Harmonies — un lien de travail puissant', es: 'Tallos ${A1} y ${A2} forman Seis Armonías — vínculo de trabajo poderoso', th: 'ธาตุ ${A1} และ ${A2} สร้างหกสามัคคี — พันธะการทำงานร่วมกันที่ทรงพลัง', vi: 'Ngày ${A1} và ${A2} tạo Ngũ Hợp — liên kết hợp tác mạnh mẽ' },
    friendship: { zh: '日干${A1}与${A2}形成【天干六合】，情谊纽带极强', en: 'Day Stems ${A1} & ${A2} form a Six Harmony — a powerful bond of friendship', fr: 'Tiges ${A1} et ${A2} forment Six Harmonies — un lien d\'amitié puissant', es: 'Tallos ${A1} y ${A2} forman Seis Armonías — vínculo de amistad poderoso', th: 'ธาตุ ${A1} และ ${A2} สร้างหกสามัคคี — พันธะมิตรภาพที่ทรงพลัง', vi: 'Ngày ${A1} và ${A2} tạo Ngũ Hợp — tình bạn gắn bó mạnh mẽ' },
  },
  crossClash: {
    business: { zh: '跨柱${P1}支${A1}与对方${P2}支${A2}形成【六冲】，节奏易撞车，需先对齐再分工', en: 'Cross-pillar: Your ${P1} Branch ${A1} & ${OS} ${P2} Branch ${A2} form a Six Clash — expect friction; align first, then divide roles', fr: 'Entre piliers : votre Branche ${P1} ${A1} et la Branche ${P2} ${A2} ${OS} forment un Choc Six — des frottements sont à prévoir ; alignez-vous avant de répartir les rôles', es: 'Entre pilares: tu Rama ${P1} ${A1} y la Rama ${P2} ${A2} ${OS} forman un Choque Seis — habrá roces; alinéense antes de repartir roles', th: 'ขัดแย้งระหว่าง ${P1} สาขา ${A1} ของคุณกับ ${P2} สาขา ${A2} ${O} — จังหวะอาจชนกัน ควรปรับให้ตรงกันก่อนแบ่งบทบาท', vi: 'Xuyên trụ: ${P1} Trụ ${A1} của bạn xung với ${P2} Trụ ${A2} ${OS} — nhịp độ dễ va chạm, hãy thống nhất trước rồi phân vai' },
    friendship: { zh: '跨柱${P1}支${A1}与对方${P2}支${A2}形成【六冲】，观点易相左，需多一分包容', en: 'Cross-pillar: Your ${P1} Branch ${A1} & ${OS} ${P2} Branch ${A2} form a Six Clash — views may diverge; a little more tolerance helps', fr: 'Entre piliers : votre Branche ${P1} ${A1} et la Branche ${P2} ${A2} ${OS} forment un Choc Six — les avis peuvent diverger ; un peu de tolérance aide', es: 'Entre pilares: tu Rama ${P1} ${A1} y la Rama ${P2} ${A2} ${OS} forman un Choque Seis — las opiniones pueden divergir; un poco de tolerancia ayuda', th: 'ขัดแย้งระหว่าง ${P1} สาขา ${A1} ของคุณกับ ${P2} สาขา ${A2} ${O} — มุมมองอาจต่างกัน ควรให้อภัยกันมากขึ้น', vi: 'Xuyên trụ: ${P1} Trụ ${A1} của bạn xung với ${P2} Trụ ${A2} ${OS} — quan điểm dễ trái ngược, cần thêm bao dung' },
  },
  zixing: {
    business: { zh: '八字中${A}出现${T}次，形成【${A}${A}自刑】，内耗倾向需自我觉察', en: '${A} appears ${T}x in both charts — self-punishment pattern; watch for self-inflicted friction', fr: '${A} apparaît ${T} fois — motif d\'auto-punition ; surveillez les frottements internes', es: '${A} aparece ${T} veces — patrón de auto-castigo; cuiden los roces internos', th: '${A} ปรากฏ ${T} ครั้ง — รูปแบบการลงโทษตัวเอง ควรระวังความเสียดทานภายใน', vi: 'Địa chi ${A} xuất hiện ${T} lần — tạo ${A} Tự Hình, cần cảnh giác hao tổn nội tâm' },
    friendship: { zh: '八字中${A}出现${T}次，形成【${A}${A}自刑】，心事易内耗，坦诚倾诉更轻松', en: '${A} appears ${T}x in both charts — self-punishment pattern; voicing things openly lightens the load', fr: '${A} apparaît ${T} fois — motif d\'auto-punition ; en parler franchement allège le cœur', es: '${A} aparece ${T} veces — patrón de auto-castigo; hablarlo con sinceridad aligera la carga', th: '${A} ปรากฏ ${T} ครั้ง — รูปแบบการลงโทษตัวเอง การพูดคุยกันตรงๆ ช่วยให้เบาใจ', vi: 'Địa chi ${A} xuất hiện ${T} lần — tạo ${A} Tự Hình, tâm sự thật lòng sẽ nhẹ nhõm hơn' },
  },
  summary85: {
    business: { zh: '日主${A1}遇${A2}，天干有情，地支有合，属上等搭档。', en: 'Day Master ${A1} meets ${A2} — heavenly stems harmonize, earthly branches align. A first-rate partnership.', fr: 'Maître Jour ${A1} rencontre ${A2} — tiges célestes s\'harmonisent, branches terrestres s\'alignent. Un partenariat de premier ordre.', es: 'Maestro Día ${A1} encuentra ${A2} — tallos celestiales armonizan, ramas terrestres se alinean. Una alianza de primer nivel.', th: 'เจ้า ${A1} พบ ${A2} — กิ่งฟ้าปรองดอง กิ่งดินลงรอย เป็นพันธมิตรระดับสูง', vi: 'Nhật Chủ ${A1} gặp ${A2} — thiên can hòa hợp, địa chi tương thành. Một sự hợp tác thượng hạng.' },
    friendship: { zh: '日主${A1}遇${A2}，天干有情，地支有合，属难得的知己格局。', en: 'Day Master ${A1} meets ${A2} — heavenly stems harmonize, earthly branches align. A rare kindred bond.', fr: 'Maître Jour ${A1} rencontre ${A2} — tiges célestes s\'harmonisent, branches terrestres s\'alignent. Un lien de confident rare.', es: 'Maestro Día ${A1} encuentra ${A2} — tallos celestiales armonizan, ramas terrestres se alinean. Una afinidad de confianza poco común.', th: 'เจ้า ${A1} พบ ${A2} — กิ่งฟ้าปรองดอง กิ่งดินลงรอย เป็นกัลยาณมิตรที่หาได้ยาก', vi: 'Nhật Chủ ${A1} gặp ${A2} — thiên can hòa hợp, địa chi tương thành. Một tình tri kỷ hiếm có.' },
  },
  summary60: {
    business: { zh: '命盘显示性格互补空间大，用心磨合可渐入佳境。', en: 'Charts show strong complementary potential — with care, this partnership finds its groove.', fr: 'Les graphiques montrent un fort potentiel complémentaire — avec soin, ce partenariat trouve son rythme.', es: 'Los gráficos muestran fuerte potencial complementario — con cuidado, esta alianza encuentra su ritmo.', th: 'แผนชะตาส่งเสริมกันอย่างดี — หากใส่ใจปรับตัว ความร่วมมือจะราบรื่นขึ้น', vi: 'Lá số cho thấy tiềm năng bổ trợ cao — cùng nhau vun đắp, hợp tác sẽ ngày càng thuận' },
    friendship: { zh: '命盘显示性格互补空间大，用心相处可渐入佳境。', en: 'Charts show strong complementary potential — with care, this friendship blossoms.', fr: 'Les graphiques montrent un fort potentiel complémentaire — avec soin, cette amitié s\'épanouit.', es: 'Los gráficos muestran fuerte potencial complementario — con cuidado, esta amistad florece.', th: 'แผนชะตาส่งเสริมกันอย่างดี — หากใส่ใจกัน มิตรภาพจะยิ่งแนบแน่น', vi: 'Lá số cho thấy tiềm năng bổ trợ cao — cùng nhau vun đắp, tình bạn sẽ ngày càng bền chặt' },
  },
  rishiLiuhe: {
    business: { zh: '虽五行不同，但天干六合，天然搭档感强', en: 'Different elements yet Six Harmony — a natural, powerful working rapport', fr: 'Éléments différents mais Six Harmonies — une entente de travail naturelle et puissante', es: 'Elementos distintos pero Seis Armonías — una entente de trabajo natural y poderosa', th: 'ธาตุต่างแต่หกสามัคคี — ความเข้ากันในการทำงานที่เป็นธรรมชาติและทรงพลัง', vi: 'Nguyên tố khác nhau nhưng Ngũ Hợp — sự ăn ý hợp tác tự nhiên và mạnh mẽ' },
    friendship: { zh: '虽五行不同，但天干六合，天然投缘', en: 'Different elements yet Six Harmony — a natural, powerful rapport', fr: 'Éléments différents mais Six Harmonies — une complicité naturelle et puissante', es: 'Elementos distintos pero Seis Armonías — una afinidad natural y poderosa', th: 'ธาตุต่างแต่หกสามัคคี — ความลงรอยกันตามธรรมชาติที่ทรงพลัง', vi: 'Nguyên tố khác nhau nhưng Ngũ Hợp — sự ăn ý tự nhiên và mạnh mẽ' },
  },
  scoreHi: {
    business: { zh: '协同深厚，互相成就', en: 'Deep working bond — bring out the best in each other', fr: 'Lien de travail profond — faites ressortir le meilleur de chacun', es: 'Vínculo de trabajo profundo — saquen lo mejor de cada uno', th: 'ความร่วมมือลึกซึ้ง — เสริมให้กันและกันเต็มที่', vi: 'Hợp tác gắn bó — cùng nhau tỏa sáng' },
    friendship: { zh: '情谊深厚，珍惜彼此', en: 'Deep friendship — cherish each other', fr: 'Amitié profonde — chérissez-vous mutuellement', es: 'Amistad profunda — apreciense mutuamente', th: 'มิตรภาพลึกซึ้ง — หวงแหนกัน', vi: 'Tình bạn sâu sắc — trân trọng nhau' },
  },
};

/** 四维提示（替代 i18n.ts 的 deep_fate / attraction_strong / chemistry_cultivate / freshness） */
const ASPECT: Record<PairScene, Record<'deep_fate' | 'attraction_strong' | 'chemistry_cultivate' | 'freshness', Row>> = {
  business: {
    deep_fate: { zh: '深度同盟', en: 'Deep alliance', fr: 'Alliance profonde', es: 'Alianza profunda', th: 'พันธมิตรลึกซึ้ง', vi: 'Đồng minh sâu sắc' },
    attraction_strong: { zh: '协作共振', en: 'Strong collaboration', fr: 'Forte collaboration', es: 'Colaboración fuerte', th: 'ความร่วมมือแน่นแฟ้น', vi: 'Hợp tác mạnh mẽ' },
    chemistry_cultivate: { zh: '默契待磨合', en: 'Rapport needs building', fr: 'Entente à construire', es: 'Sintonía por construir', th: 'ความเข้าใจกันต้องปรับตัว', vi: 'Ăn ý cần rèn luyện' },
    freshness: { zh: '合作需要变通', en: 'Partnership needs flexibility', fr: 'Le partenariat demande de la souplesse', es: 'La alianza necesita flexibilidad', th: 'ความร่วมมือต้องยืดหยุ่น', vi: 'Hợp tác cần linh hoạt' },
  },
  friendship: {
    deep_fate: { zh: '深度知己', en: 'Deep kindred bond', fr: 'Lien de confident profond', es: 'Afinidad profunda', th: 'กัลยาณมิตรลึกซึ้ง', vi: 'Tri kỷ sâu sắc' },
    attraction_strong: { zh: '同频共振', en: 'Strong rapport', fr: 'Forte complicité', es: 'Fuerte sintonía', th: 'เข้ากันได้ดี', vi: 'Đồng điệu mạnh mẽ' },
    chemistry_cultivate: { zh: '默契待磨合', en: 'Rapport needs building', fr: 'Entente à construire', es: 'Sintonía por construir', th: 'ความเข้าใจกันต้องปรับตัว', vi: 'Ăn ý cần rèn luyện' },
    freshness: { zh: '相处需要新鲜感', en: 'Friendship needs freshness', fr: 'L\'amitié demande du renouveau', es: 'La amistad necesita frescura', th: 'มิตรภาพต้องการความสดใหม่', vi: 'Tình bạn cần làm mới' },
  },
};

/* ═══════════════ 对外：一次性取齐某场景某语种的全量文案 ═══════════════ */
export interface SceneText {
  heading: string;
  other: string;
  others: string;
  othersCap: string;
  bond: string;
  wxYou: string;
  wxYouLower: string;
  wxYouBare: string;
  ich: {
    heading: string;
    reading: (cat: string) => string;
    tail: (cat: string) => string;
    changing: (line: number) => string;
    stable: string;
    summary55: (name: string, num: number) => string;
  };
  zodiac: {
    ta: string;
    bestMatch: (a: string, b: string) => string;
    oppositeMatch: (a: string, b: string) => string;
    scoreHigh: string;
    scoreMid: string;
    scoreLow: string;
    golden: (a: string, b: string) => string;
    chemistry: (a: string, b: string) => string;
    understanding: (a: string, b: string) => string;
    opposite: string;
    phaseOpposition: (a: string, b: string) => string;
    phaseSpecial: (deg: number | string) => string;
  };
  bazi: {
    hehunTitle: string;
    hehunPlain: string;
    ta: string;
    detailTa: string;
    liuhe: (a1: string, a2: string) => string;
    crossClash: (p1: string, a1: string, p2: string, a2: string) => string;
    zixing: (b: string, total: number) => string;
    summary85: (a1: string, a2: string) => string;
    summary60: string;
    rishiLiuhe: string;
    scoreHi: string;
  };
  aspect: (key: 'deep_fate' | 'attraction_strong' | 'chemistry_cultivate' | 'freshness') => string;
}

const catOf = (raw: string): HexCat => (HEX_CATS.indexOf(raw as HexCat) !== -1 ? (raw as HexCat) : '中');

/** 取齐场景文案（scene 须为 business/friendship；情爱不走本函数） */
export function sceneText(scene: PairScene, langRaw: unknown): SceneText {
  const lang = normalizeSceneLang(langRaw);
  const tk = TOKENS[scene];
  const z = (r: Record<PairScene, Row>) => r[scene][lang] || r[scene].en;
  const bt = (r: Record<PairScene, Row>) => r[scene][lang] || r[scene].en;
  const os = tk.others[lang] || tk.others.en;
  return {
    heading: row(tk.heading, lang),
    other: row(tk.other, lang),
    others: os,
    othersCap: uc(os),
    bond: row(tk.bond, lang),
    wxYou: row(YOU, lang),
    wxYouLower: row(YOU_LOWER, lang),
    wxYouBare: row(YOU_BARE, lang),
    ich: {
      heading: `【${row(tk.heading, lang)}】`,
      reading: (cat) => row(ICHING_READING[scene][catOf(cat)], lang),
      tail: (cat) => row(ICHING_TAIL[scene][catOf(cat)], lang),
      changing: (line) => tpl({
        business: { zh: '第${L}爻为动爻，显示合作中存在变化的契机', en: 'Line ${L} is changing — signals a shift in the partnership', fr: 'La ligne ${L} change — signale un tournant dans le partenariat', es: 'La línea ${L} está cambiando — indica un cambio en la alianza', th: 'เส้น${L}เปลี่ยน — จุดเปลี่ยนในความร่วมมือ', vi: 'Hào ${L} động — bước ngoặt trong sự hợp tác' },
        friendship: { zh: '第${L}爻为动爻，显示相处中存在变化的契机', en: 'Line ${L} is changing — signals a shift in the friendship', fr: 'La ligne ${L} change — signale un tournant dans l\'amitié', es: 'La línea ${L} está cambiando — indica un cambio en la amistad', th: 'เส้น${L}เปลี่ยน — จุดเปลี่ยนในมิตรภาพ', vi: 'Hào ${L} động — bước ngoặt trong tình bạn' },
      }[scene][lang])({ L: line }),
      stable: z({
        business: { zh: '六爻安静，合作当前处于稳定状态', en: 'All lines stable — the partnership is in a steady state', fr: 'Toutes les lignes stables — le partenariat est stable', es: 'Todas las líneas estables — la alianza está en estado firme', th: 'ทุกเส้นนิ่ง — ความร่วมมือมั่นคง', vi: 'Tất cả hào tĩnh — hợp tác đang ổn định' },
        friendship: { zh: '六爻安静，情谊当前处于稳定状态', en: 'All lines stable — the friendship is in a steady state', fr: 'Toutes les lignes stables — l\'amitié est stable', es: 'Todas las líneas estables — la amistad está en estado firme', th: 'ทุกเส้นนิ่ง — มิตรภาพมั่นคง', vi: 'Tất cả hào tĩnh — tình bạn đang ổn định' },
      }),
      summary55: (name, num) => tpl({
        business: { zh: '占得「${N}」，卦象显示需用心磨合，方能长久。', en: 'Hexagram ${num}: ${N}. Care and patience are needed to sustain this partnership.', fr: 'Hexagramme ${num} : ${N}. Des soins et de la patience sont nécessaires pour maintenir ce partenariat.', es: 'Hexagrama ${num}: ${N}. Se necesita cuidado y paciencia para mantener esta alianza.', th: 'ได้พบแผนภูมิ「${N}」— ต้องใส่ใจปรับตัวจึงจะยั่งยืน', vi: 'Gặp quẻ «${N}» — cần sự tận tâm và kiên nhẫn mới duy trì được sự hợp tác' },
        friendship: { zh: '占得「${N}」，卦象显示需用心相处，方能长久。', en: 'Hexagram ${num}: ${N}. Care and intention are needed to sustain this friendship.', fr: 'Hexagramme ${num} : ${N}. Des soins et de l\'attention sont nécessaires pour maintenir cette amitié.', es: 'Hexagrama ${num}: ${N}. Se necesita cuidado e intención para mantener esta amistad.', th: 'ได้พบแผนภูมิ「${N}」— ต้องใส่ใจกันจึงจะยั่งยืน', vi: 'Gặp quẻ «${N}» — cần sự tận tâm và chủ ý mới duy trì được tình bạn' },
      }[scene][lang])({ N: name, num }),
    },
    zodiac: {
      ta: z(Z.ta),
      bestMatch: (a, b) => tpl(z(Z.bestMatch))({ A: a, B: b }),
      oppositeMatch: (a, b) => tpl(z(Z.oppositeMatch))({ A: a, B: b }),
      scoreHigh: z(Z.scoreHigh),
      scoreMid: z(Z.scoreMid),
      scoreLow: z(Z.scoreLow),
      golden: (a, b) => tpl(z(Z.golden))({ A: a, B: b }),
      chemistry: (a, b) => tpl(z(Z.chemistry))({ A: a, B: b }),
      understanding: (a, b) => tpl(z(Z.understanding))({ A: a, B: b }),
      opposite: z(Z.opposite),
      phaseOpposition: (a, b) => tpl(z(Z.phaseOpposition))({ A: a, B: b }),
      phaseSpecial: (deg) => tpl(z(Z.phaseSpecial))({ D: deg }),
    },
    bazi: {
      hehunTitle: bt(B.hehunTitle),
      hehunPlain: bt(B.hehunPlain),
      ta: bt(B.ta),
      detailTa: bt(B.detailTa),
      liuhe: (a1, a2) => tpl(bt(B.liuhe))({ A1: a1, A2: a2 }),
      crossClash: (p1, a1, p2, a2) => tpl(bt(B.crossClash))({ P1: p1, A1: a1, P2: p2, A2: a2, O: row(tk.other, lang), OS: os }),
      zixing: (b, total) => tpl(bt(B.zixing))({ A: b, T: total }),
      summary85: (a1, a2) => tpl(bt(B.summary85))({ A1: a1, A2: a2 }),
      summary60: bt(B.summary60),
      rishiLiuhe: bt(B.rishiLiuhe),
      scoreHi: bt(B.scoreHi),
    },
    aspect: (key) => row(ASPECT[scene][key], lang),
  };
}
