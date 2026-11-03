/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-刀二（主公军令 2026-11-03）：五维情绪天象罗盘数据真源＋语调铁律守卫
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：MoodCompassModal 五维徽章（五行微光）＋天象归因（AstroMoodAttribution）。
 * 0525 原案 3.1「心情打卡」逆向收编：不做双人可见社交，只做灵宠气象共鸣。
 * 🔴 语调铁律（0525 原文 2.2，军令断言 1 的守备对象）：
 *    ① 每条抚慰积极正面收尾，永远给希望；
 *    ② 必须含具体微小行动闭环（喝水/散步/发消息/早睡级粒度）；
 *    ③ 严禁「相克/倒霉/灾祸/相冲/劫难/注定」等消极恐慌词（BANNED 全语扫描）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 语调铁律词表（zh 正向行动词——断言 1 的正例锚） */
export const POSITIVE_ACTION_WORDS = Object.freeze([
  '喝水', '温水', '散步', '发消息', '发一句', '早睡', '晚安', '深呼吸', '分享', '留言', '洗个热水澡',
]);

/** 语调铁律违规词（全语扫面——断言 1 的负例锚；命中即红色恐慌话术） */
export const BANNED_PANIC_WORDS = Object.freeze([
  '相克', '相冲', '倒霉', '灾祸', '劫难', '注定分手', '注定失败', '血光',
]);

/** 六语官方序列 */
export const MOOD_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/**
 * 五维情绪罗盘徽章（五行元素微光——军令钦定五行归属）
 * radiant=fire 灿烂 / longing=water 想念 / melancholy=metal 低落 /
 * agitated=wood 焦躁 / grateful=earth 感恩
 */
export const MOOD_ARCHETYPES = Object.freeze([
  {
    archetype: 'radiant', element: 'fire', icon: '✨',
    label: { zh: '灿烂', en: 'Radiant', fr: 'Radieux', es: 'Radiante', th: 'เปล่งประกาย', vi: 'Rực rỡ' },
    description: {
      zh: '心里亮堂堂，好事正在靠近',
      en: 'Your heart is bright — good things approach',
      fr: 'Votre cœur rayonne — de belles choses s’approchent',
      es: 'Tu corazón brilla — algo bueno se acerca',
      th: 'หัวใจส่องสว่าง — เรื่องดีๆ กำลังใกล้เข้ามา',
      vi: 'Tim bạn đang rạng ngời — điều tốt đẹp đang đến gần',
    },
  },
  {
    archetype: 'longing', element: 'water', icon: '🌙',
    label: { zh: '想念', en: 'Longing', fr: 'Nostalgie', es: 'Añoranza', th: 'คิดถึง', vi: 'Nhớ nhung' },
    description: {
      zh: '有个名字在心里轻轻发光',
      en: 'A name glows softly in your heart',
      fr: 'Un prénom brille doucement dans votre cœur',
      es: 'Un nombre brilla suavemente en tu corazón',
      th: 'มีชื่อหนึ่งเรืองแสงอยู่ในใจอย่างเบาๆ',
      vi: 'Một cái tên đang tỏa sáng dịu dàng trong tim bạn',
    },
  },
  {
    archetype: 'melancholy', element: 'metal', icon: '🌧️',
    label: { zh: '低落', en: 'Melancholy', fr: 'Mélancolie', es: 'Melancolía', th: 'อ่อนล้า', vi: 'Chùng xuống' },
    description: {
      zh: '情绪的潮汐暂时退了潮',
      en: 'The emotional tide has briefly receded',
      fr: 'La marée émotionnelle s’est brièvement retirée',
      es: 'La marea emocional ha retrocedido un momento',
      th: 'กระแสน้ำแห่งอารมณ์เพิ่งถอยรี่ลงตามวัฏจักร',
      vi: 'Thủy triều cảm xúc vừa lặng xuống một nhịp',
    },
  },
  {
    archetype: 'agitated', element: 'wood', icon: '⚡',
    label: { zh: '焦躁', en: 'Agitated', fr: 'Agitation', es: 'Inquietud', th: 'หงุดหงิด', vi: 'Bồn chồn' },
    description: {
      zh: '气不顺，心里有团小火苗',
      en: 'A small flame flickers restlessly inside',
      fr: 'Une petite flamme vacille en vous',
      es: 'Una pequeña llama parpadea dentro de ti',
      th: 'มีประกายไฟดวงเล็กๆ ส่ายไปมาในใจ',
      vi: 'Một ngọn lửa nhỏ đang lay động trong lòng',
    },
  },
  {
    archetype: 'grateful', element: 'earth', icon: '🌏',
    label: { zh: '感恩', en: 'Grateful', fr: 'Gratitude', es: 'Gratitud', th: 'กตัญญู', vi: 'Biết ơn' },
    description: {
      zh: '心里满满的，想谢谢一个人',
      en: 'Your heart is full — someone deserves thanks',
      fr: 'Votre cœur débordant — quelqu’un mérite un merci',
      es: 'Tu corazón está lleno — alguien merece un gracias',
      th: 'ใจเต็มเปี่ยม — มีคนหนึ่งที่น่าจะได้รับคำขอบคุณ',
      vi: 'Tim bạn tràn đầy — có người xứng đáng nhận lời cảm ơn',
    },
  },
]);

/**
 * 天象归因六语真值（AstroMoodAttribution）
 * 🔴 每条 companionComfort 以具体微小行动收尾（语调铁律②）；
 *    全表零 BANNED 词（铁律③）——toneGuard 断言守备。
 */
export const MOOD_ATTRIBUTIONS = Object.freeze({
  radiant: Object.freeze({
    zh: Object.freeze({
      transitSummary: '金星与水星形成和谐相位，流日能量顺滑',
      energyAspect: '金水互融，表达与倾听的自然窗口',
      companionComfort: '今天的你自带光泽。趁着这股顺滑的金星能量，把心里那句欣赏发消息给 TA——好状态值得被听见，也值得被回应。',
      actionableAdvice: '今晚 21:00 前发一句真诚的赞美给 TA',
    }),
    en: Object.freeze({
      transitSummary: 'Venus and Mercury form a harmonious aspect today',
      energyAspect: 'Venus-Mercury blend — a natural window for expression',
      companionComfort: 'You carry a gentle glow today. Ride this smooth Venus energy and send that compliment you have been holding — good states deserve to be heard, and answered.',
      actionableAdvice: 'Send one sincere compliment before 9:00 PM tonight',
    }),
    fr: Object.freeze({
      transitSummary: 'Vénus et Mercure forment un aspect harmonieux',
      energyAspect: 'Alliage Vénus-Mercure — fenêtre naturelle d’expression',
      companionComfort: 'Vous rayonnez doucement aujourd’hui. Profitez de cette énergie de Vénus pour envoyer le compliment que vous gardez en réserve — les beaux états méritent d’être entendus, et répondus.',
      actionableAdvice: 'Envoyez un compliment sincère avant 21h00',
    }),
    es: Object.freeze({
      transitSummary: 'Venus y Mercurio forman un aspecto armónico',
      energyAspect: 'Fusión Venus-Mercurio — ventana natural de expresión',
      companionComfort: 'Hoy llevas un brillo propio. Aprovecha esta energía de Venus y envía ese cumplido que venías guardando: los buenos momentos merecen escucharse, y recibirse.',
      actionableAdvice: 'Envía un cumplido sincero antes de las 21:00',
    }),
    th: Object.freeze({
      transitSummary: 'ดาวศุกร์และดาวพุธเข้าสัมพันธ์กันอย่างกลมกลืนวันนี้',
      energyAspect: 'พลังศุกร์-พุธหลอมรวม — ช่วงเวลาเหมาะแก่การแสดงออก',
      companionComfort: 'วันนี้คุณเปล่งประกายเป็นของตัวเอง ขี่กระแสพลังดาวศุกร์ที่ลื่นไหลนี้ ส่งคำชมที่เก็บไว้ในใจให้เขาฟัง — ความรู้สึกดีๆ สมควรได้รับการรับฟัง และตอบรับ',
      actionableAdvice: 'ส่งคำชมจริงใจหนึ่งประโยคก่อน 21:00 น. คืนนี้',
    }),
    vi: Object.freeze({
      transitSummary: 'Sao Kim và sao Thủy tạo góc hài hòa hôm nay',
      energyAspect: 'Kim-Thủy giao hòa — khung giờ tự nhiên để bày tỏ',
      companionComfort: 'Hôm nay bạn mang theo ánh sáng riêng của mình. Hãy nhân dòng năng lượng Sao Kim mượt mà này, gửi đi lời khen bạn vẫn để dành — cảm xúc đẹp xứng đáng được lắng nghe và được đáp lại.',
      actionableAdvice: 'Gửi một lời khen chân thành trước 21:00 tối nay',
    }),
  }),
  longing: Object.freeze({
    zh: Object.freeze({
      transitSummary: '流日月亮行经共鸣宫位，直觉格外敏锐',
      energyAspect: '月象引力期，思念被放大属自然节律',
      companionComfort: '你心里念着的那个名字，星盘其实都感应到了。想念不必藏成心事——今晚 20:15 后发消息分享一首你们都听过的歌，让月光替你完成开场。',
      actionableAdvice: '今晚 20:15 后分享一首共同听过的歌',
    }),
    en: Object.freeze({
      transitSummary: 'The transiting Moon crosses your resonance sector',
      energyAspect: 'Lunar gravity phase — longing naturally amplified',
      companionComfort: 'The name you keep thinking of — your chart has sensed it too. Longing need not be hidden as a secret: after 8:15 PM, share a song you both know and let the moonlight finish your opening line.',
      actionableAdvice: 'Share a song you both cherish after 8:15 PM',
    }),
    fr: Object.freeze({
      transitSummary: 'La Lune transitante traverse votre secteur de résonance',
      energyAspect: 'Phase de gravité lunaire — le manque s’amplifie naturellement',
      companionComfort: 'Le prénom qui occupe vos pensées — votre thème l’a ressenti lui aussi. Nul besoin de cacher cette tendresse : après 20h15, partagez une chanson que vous connaissez tous les deux et laissez le clair de lune écrire votre premier mot.',
      actionableAdvice: 'Partagez une chanson commune après 20h15',
    }),
    es: Object.freeze({
      transitSummary: 'La Luna en tránsito cruza tu sector de resonancia',
      energyAspect: 'Fase de gravedad lunar — la añoranza se amplifica de forma natural',
      companionComfort: 'Ese nombre que ocupa tu mente — tu carta también lo ha sentido. No hace falta guardar la añoranza como secreto: después de las 20:15 comparte una canción que ambos conozcan y deja que la luz de la luna complete tu apertura.',
      actionableAdvice: 'Comparte una canción en común después de las 20:15',
    }),
    th: Object.freeze({
      transitSummary: 'ดวงจันทร์เคลื่อนผ่านเรือนสะท้อนใจของคุณวันนี้',
      energyAspect: 'ช่วงแรงโน้มถ่วงจันทร์ — ความคิดถึงขยายตัวตามจังหวะธรรมชาติ',
      companionComfort: 'ชื่อที่คุณคิดถึงนั้น ดวงดาวของคุณรับรู้ด้วยเช่นกัน ความคิดถึงไม่จำเป็นต้องซ่อนไว้เป็นความลับ — คืนนี้หลัง 20:15 น. ลองส่งเพลงที่ทั้งคู่เคยฟังร่วมกัน แล้วให้แสงจันทร์ช่วยเปิดบทสนทนาให้',
      actionableAdvice: 'ส่งเพลงที่เคยฟังร่วมกันหลัง 20:15 น. คืนนี้',
    }),
    vi: Object.freeze({
      transitSummary: 'Mặt Trăng chuyển qua cung cộng hưởng của bạn hôm nay',
      energyAspect: 'Giai đoạn hấp dẫn nguyệt — nỗi nhớ tự nhiên được khuếch đại',
      companionComfort: 'Cái tên bạn vẫn thương nhớ — biểu đồ của bạn cũng đã cảm nhận được. Nỗi nhớ không cần giấu thành bí mật: tối nay sau 20:15, gửi cho người ấy một bài hát cả hai từng nghe, để ánh trăng thay bạn mở lời.',
      actionableAdvice: 'Gửi một bài hát chung sau 20:15 tối nay',
    }),
  }),
  melancholy: Object.freeze({
    zh: Object.freeze({
      transitSummary: '流日月亮刑克本命金星，情绪潮汐暂处低谷',
      energyAspect: '月亮过境敏感宫位，宇宙正在帮你清理旧情绪',
      companionComfort: '觉得委屈很正常，这不是你的问题，是月亮正好路过你的敏感宫位。别逼自己坚强——今晚洗个热水澡，22:00 前关掉手机喝杯温水早睡，好心情正在路上。',
      actionableAdvice: '洗个热水澡，22:00 前关机喝温水早睡',
    }),
    en: Object.freeze({
      transitSummary: 'The transiting Moon squares your natal Venus — an emotional low tide',
      energyAspect: 'The Moon crosses your sensitive house, clearing old feelings',
      companionComfort: 'Feeling tender is completely natural — the Moon is simply passing through your sensitive house, not your character. Take a warm shower tonight, put your phone away, sip some warm water and sleep early before 10 PM; brighter moods are already on their way.',
      actionableAdvice: 'Warm shower, phone off, warm water, sleep by 10 PM',
    }),
    fr: Object.freeze({
      transitSummary: 'La Lune transitante carré à votre Vénus natale — marée basse émotionnelle',
      energyAspect: 'La Lune traverse votre maison sensible et évacue les anciennes émotions',
      companionComfort: 'Se sentir fragile est tout à fait naturel — la Lune traverse simplement votre maison sensible, ce n’est pas votre caractère. Prenez une douche chaude ce soir, éloignez le téléphone, buvez de l’eau tiède et couchez-vous avant 22h00 ; le retour du sourire est déjà en route.',
      actionableAdvice: 'Douche chaude, téléphone éloigné, eau tiède, au lit avant 22h00',
    }),
    es: Object.freeze({
      transitSummary: 'La Luna en tránsito aspecta tu Venus natal — marea baja emocional',
      energyAspect: 'La Luna cruza tu casa sensible y limpia emociones viejas',
      companionComfort: 'Sentirte frágil es completamente natural: la Luna solo está cruzando tu casa sensible, no es tu carácter. Date una ducha caliente esta noche, aparta el teléfono, bebe agua tibia y duerme antes de las 22:00; el buen ánimo ya viene en camino.',
      actionableAdvice: 'Ducha caliente, teléfono lejos, agua tibia, dormir antes de las 22:00',
    }),
    th: Object.freeze({
      transitSummary: 'ดวงจันทร์เคลื่อนผ่านเข้ามุมแย้งกับศุกร์ประจำตัว — น้ำใจเข้าช่วงถลำลึก',
      energyAspect: 'ดวงจันทร์ผ่านเรือนอ่อนไหว กำลังช่วยระบายอารมณ์เก่าให้คุณ',
      companionComfort: 'รู้สึกเหนื่อยใจเป็นเรื่องปกติ — ดวงจันทร์แค่เดินผ่านเรือนอ่อนไหวของคุณเท่านั้น ไม่ใช่ความผิดของตัวคุณ คืนนี้อาบน้ำอุ่นให้รสชาติชื่นใจ เก็บโทรศัพท์ก่อน 22:00 น. จิบน้ำอุ่นแล้วนอนก่อน — อารมณ์ดีกำลังเดินทางมาหาคุณอยู่แล้ว',
      actionableAdvice: 'อาบน้ำอุ่น เก็บโทรศัพท์ จิบน้ำอุ่น นอนก่อน 22:00 น.',
    }),
    vi: Object.freeze({
      transitSummary: 'Mặt Trăng chuyển góc vuông với Sao Kim bản mệnh — thủy triều cảm xúc xuống thấp',
      energyAspect: 'Mặt Trăng đi qua cung nhạy cảm, vũ trụ đang giúp bạn thanh lọc cảm xúc cũ',
      companionComfort: 'Cảm thấy yếu lòng là hoàn toàn bình thường — Mặt Trăng chỉ đang đi ngang cung nhạy cảm của bạn, không phải lỗi của bạn. Tối nay tắm nước ấm, cất điện thoại trước 22:00, uống một cốc nước ấm và ngủ sớm; tâm trạng tươi sáng đang trên đường đến.',
      actionableAdvice: 'Tắm nước ấm, cất điện thoại, uống nước ấm, ngủ trước 22:00',
    }),
  }),
  agitated: Object.freeze({
    zh: Object.freeze({
      transitSummary: '当日火星处于冲位，摩擦易发期',
      energyAspect: '火星能量过剩，燥气是天象在作怪，不是修养不够',
      companionComfort: '深呼吸……今天火星能量过剩，你身上的燥气是星象在作怪。这会儿千万别急着做重大决定——去喝杯柠檬水，散步 15 分钟，等星轨平复，事情自会顺过来。',
      actionableAdvice: '喝杯柠檬水，散步 15 分钟再回来',
    }),
    en: Object.freeze({
      transitSummary: 'Mars stands in opposition today — a friction-prone window',
      energyAspect: 'Excess Mars energy; the restlessness is the sky, not your character',
      companionComfort: 'Deep breaths… Mars energy runs hot today, and that inner static is the sky at work, not your composure. Hold off on any big decisions right now — drink a glass of lemon water, take a 15-minute walk, and let the orbits settle before you act.',
      actionableAdvice: 'Lemon water, a 15-minute walk, then revisit',
    }),
    fr: Object.freeze({
      transitSummary: 'Mars en opposition aujourd’hui — fenêtre propice aux frictions',
      energyAspect: 'Excès d’énergie martienne ; l’agitation vient du ciel, pas de votre sang-froid',
      companionComfort: 'Respirez profondément… l’énergie de Mars est en excès aujourd’hui, et ce grésillement intérieur vient du ciel, non de votre tempérament. Reportez toute grande décision — buvez un verre d’eau citronnée, marchez 15 minutes, et laissez les orbites s’apaiser avant d’agir.',
      actionableAdvice: 'Eau citronnée, marche de 15 minutes, puis revoir',
    }),
    es: Object.freeze({
      transitSummary: 'Marte en oposición hoy — ventana propensa a fricciones',
      energyAspect: 'Exceso de energía marciana; la inquietud es del cielo, no de tu temple',
      companionComfort: 'Respira profundo… la energía de Marte está en exceso hoy y ese zumbido interior viene del cielo, no de tu carácter. Posterga las decisiones importantes — bebe un vaso de agua con limón, camina 15 minutos y deja que las órbitas se calmen antes de actuar.',
      actionableAdvice: 'Agua con limón, caminata de 15 minutos, luego decide',
    }),
    th: Object.freeze({
      transitSummary: 'ดาวอังคารเข้าตำแหน่งตรงข้ามวันนี้ — ช่วงเสี่ยงปะทะง่าย',
      energyAspect: 'พลังดาวอังคารล้นเกิน — อาการหงุดหงิดเป็นเพราะท้องฟ้า ไม่ใช่ความอดทนของคุณ',
      companionComfort: 'หายใจเข้าลึกๆ… พลังดาวอังคารวันนี้เดือดเกินพิกัด ความร้อนในใจของคุณมาจากดวงดาว ไม่ใช่ความใจแคบของตัวคุณเอง ตอนนี้ยังอย่ารีบตัดสินใจเรื่องใหญ่ — ดื่มน้ำมะนาวสักแก้ว เดินเล่น 15 นาที รอให้วงโคจรสงบลง เรื่องราวจะค่อยๆ ราบรื่นเอง',
      actionableAdvice: 'ดื่มน้ำมะนาวหนึ่งแก้ว เดินเล่น 15 นาที แล้วค่อยกลับมา',
    }),
    vi: Object.freeze({
      transitSummary: 'Sao Hỏa ở vị trí xung đối hôm nay — giai đoạn dễ va chạm',
      energyAspect: 'Năng lượng Sao Hỏa dư thừa; sự bồn chồn đến từ trời, không phải từ bản lĩnh của bạn',
      companionComfort: 'Hít thật sâu… năng lượng Sao Hỏa hôm nay dư sức, cảm giác nóng ruột trong người là do bầu trời, không phải do bạn thiếu kiềm chế. Đừng vội đưa ra quyết định lớn lúc này — uống một cốc nước chanh, đi bộ 15 phút, đợi các quỹ đạo lắng xuống, mọi chuyện sẽ tự thuận theo.',
      actionableAdvice: 'Uống nước chanh, đi bộ 15 phút rồi quay lại',
    }),
  }),
  grateful: Object.freeze({
    zh: Object.freeze({
      transitSummary: '月亮与本命木星形成三分相，丰盈感知期',
      energyAspect: '木月滋养，心里的善意正在发芽',
      companionComfort: '此刻心里的暖意是宇宙给你的回礼。感恩最动人的地方在于说出口——今晚给那个帮过你的人发一句「谢谢你」，善意会在晚风里继续生长。',
      actionableAdvice: '今晚给想感谢的人发一句谢谢你',
    }),
    en: Object.freeze({
      transitSummary: 'The Moon trines your natal Jupiter — a phase of felt abundance',
      energyAspect: 'Jupiter-Moon nurture; kindness is sprouting in you',
      companionComfort: 'The warmth you feel right now is the universe returning your kindness. Gratitude shines brightest when spoken — tonight, message the person who helped you a simple “thank you”, and let that goodness keep growing in the evening breeze.',
      actionableAdvice: 'Send a “thank you” message tonight to someone who helped you',
    }),
    fr: Object.freeze({
      transitSummary: 'La Lune trigone à votre Jupiter natal — phase d’abondance ressentie',
      energyAspect: 'Nourriture Jupiter-Lune ; la gentillesse germe en vous',
      companionComfort: 'La chaleur que vous ressentez est la façon qu’a l’univers de vous rendre la vôtre. La gratitude rayonne le mieux quand elle est dite — ce soir, envoyez à la personne qui vous a aidé un simple « merci », et laissez cette bonté grandir dans la brise du soir.',
      actionableAdvice: 'Envoyez un « merci » ce soir à quelqu’un qui vous a aidé',
    }),
    es: Object.freeze({
      transitSummary: 'La Luna está en trígono con tu Júpiter natal — fase de abundancia sentida',
      energyAspect: 'Nutrición Júpiter-Luna; la bondad está germinando en ti',
      companionComfort: 'El calor que sientes ahora es el universo devolviéndote tu propia bondad. La gratitud brilla más cuando se dice — esta noche mándale un simple “gracias” a quien te ayudó, y deja que esa bondad siga creciendo con la brisa de la tarde.',
      actionableAdvice: 'Manda un “gracias” esta noche a quien te ayudó',
    }),
    th: Object.freeze({
      transitSummary: 'ดวงจันทร์ทำมุม 120 องศากับดาวพฤหัสบดีประจำตัว — ช่วงเปี่ยมความอุดม',
      energyAspect: 'พฤหัสหล่อเลี้ยงจันทร์ — เมล็ดพันธุ์ความปรารถนาดีกำลังงอกงามในใจ',
      companionComfort: 'ความอบอุ่นที่คุณรู้สึกได้ตอนนี้ คือของขวัญที่จักรวาลตอบแทนความดีของคุณ ความกตัญญูงดงามที่สุดเมื่อได้บอกออกไป — คืนนี้ลองส่งข้อความว่า "ขอบคุณนะ" ให้คนที่เคยช่วยเหลือคุณ แล้วความดีงามจะเติบโตต่อไปในสายลมพัดเย็น',
      actionableAdvice: 'คืนนี้ส่งข้อความขอบคุณให้คนที่อยากขอบพระคุณ',
    }),
    vi: Object.freeze({
      transitSummary: 'Mặt Trăng hợp 120 độ với Sao Mộc bản mệnh — giai đoạn cảm nhận sung mãn',
      energyAspect: 'Mộc-Nguyệt nuôi dưỡng; hạt giống thiện chí đang nảy mầm trong bạn',
      companionComfort: 'Sự ấm áp trong lòng bạn lúc này là vũ trụ hồi đáp lòng tốt của chính bạn. Lòng biết ơn lung linh nhất khi được nói ra — tối nay gửi cho người từng giúp bạn một lời «cảm ơn», để thiện chí tiếp tục lớn lên trong làn gió tối.',
      actionableAdvice: 'Tối nay gửi lời cảm ơn cho người bạn muốn tri ân',
    }),
  }),
});

/**
 * 语调铁律守卫（toneGuard——军令断言 1 的运行时守卫）
 * @param {string} text 待检抚慰文本
 * @param {string} [locale] 语种（zh 走正向行动词硬检；其余语种正向行动由
 *   逐语字典保证，守卫只扫 BANNED 恐慌词——防全语种红色话术）
 * @returns {{ positive: boolean, bannedHit: string | null, actionWord: string | null }}
 */
export function toneGuard(text, locale = 'zh') {
  const s = String(text || '');
  const bannedHit = BANNED_PANIC_WORDS.find((w) => s.includes(w)) || null;
  const actionWord = POSITIVE_ACTION_WORDS.find((w) => s.includes(w)) || null;
  const needAction = locale === 'zh';
  return { positive: !bannedHit && (!needAction || Boolean(actionWord)), bannedHit, actionWord };
}

/** 罗盘取值（archetype × locale → 归因；未知输入 fail-closed 返回 null） */
export function moodAttribution(archetype, locale) {
  const byArch = MOOD_ATTRIBUTIONS[archetype];
  if (!byArch) return null;
  return byArch[locale] || byArch.en || null;
}
