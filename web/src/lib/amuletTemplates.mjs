/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-ASSET 刀一（主公军令 2026-11-03）：全六语 24 套破冰密函静态模板库
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：4 类密函（apology 道歉·解冻 / longing 想念·引力 / support 鼓励·加持
 * / weather 关系天气·透镜）× 6 官方语种（zh/en/fr/es/th/vi）＝ 24 套军师钦定
 * 典藏文案（逐字录入，严禁再创作）。
 * 🔴 0525 语调铁律锁死：积极正面收尾＋具体微小行动闭环（发一句晚安/喝杯温水/
 *    散步 20 分钟/具体时窗发消息）——零「相克/倒霉/灾祸」恐慌词。
 * 消费方：amuletCanvasRenderer.mjs（Canvas 排版真源）＋ AmuletPlayground.tsx
 * （/dev/amulet-preview 走查矩阵）＋ companionScribeTrigger.mjs（意图推荐）。
 * 塔罗图腾真源：goldCardTotems.mjs cardId——6 恋人 / 14 节制 / 17 星星 / 19 太阳。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 官方六语（Soul OS 语言底座） */
export const AMULET_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** 四类密函（军令钦定序） */
export const AMULET_TYPES = Object.freeze(['apology', 'longing', 'support', 'weather']);

/** 类型 × 韦特大阿卡纳 cardId（goldCardTotems.mjs 22 张线稿真源分发） */
export const AMULET_CARD_ID = Object.freeze({
  apology: 14, // XIV 节制 Temperance（双杯水火相融线稿）
  longing: 17, // XVII 星星 The Star（八角星芒与生命之泉线稿）
  support: 19, // XIX 太阳 The Sun（旭日金轮与向日葵线稿）
  weather: 6, // VI 恋人 The Lovers（天使加持与生命之树线稿）
});

/** 类型防伪章三字码（右下角水印 KS-AMULET-{TYP}-{LOCALE}） */
export const AMULET_TYPE_STAMP = Object.freeze({
  apology: 'APL',
  longing: 'LNG',
  support: 'PWR',
  weather: 'WTH',
});

/**
 * 24 套六语典藏模板（军师全文逐字录入——单源静态资产，零网络零动态拼接）
 * @type {Record<string, Record<string, object>>}
 */
export const AMULET_TEMPLATES_24 = Object.freeze({
  /* ═══════════ 一、道歉·解冻密函（Lunar Apology & Thawing · NO. 14）═══════════ */
  apology: Object.freeze({
    zh: Object.freeze({
      title: '✦ 月相解冻密函 ✦',
      subtitle: 'TEMPERANCE ALIGNMENT · NO. 14',
      prose: '星轨有时会偏转，情绪的潮汐亦有涨落；但我对你的珍重，从未偏移半分。\n若我们之间曾落下一场突如其来的霜雪，愿以此信化作初融的晨曦。',
      companionWhisper: '今晚月相趋于平静，水星柔和能量正在抚平褶皱。最好的破冰无需长篇大论，在 20:30 前后给对方发一句：「今天辛苦啦，晚上喝杯温水早点休息」，冰雪便会悄然消融。',
      bestWindowPrefix: 'Best Celestial Window',
      tarotCard: '节制',
      tarotNumber: 'NO. 14',
      defaultTiming: '20:00 - 21:15 UTC+8',
    }),
    en: Object.freeze({
      title: '✦ LUNAR APOLOGY AMULET ✦',
      subtitle: 'TEMPERANCE ALIGNMENT · NO. 14',
      prose: 'Celestial orbits may drift, and the tides of emotion naturally rise and fall; yet my reverence for you has never shifted by a single degree.\nIf an unexpected frost has settled between our worlds, let this message serve as the gentle dawn that melts it away.',
      companionWhisper: 'The lunar sphere rests in tranquility tonight as Mercury\'s grace softens the air. True reconciliation demands no complex arguments — simply send: "Hope your day wasn\'t too exhausting, stay warm tonight" around 8:30 PM to let the warmth return.',
      bestWindowPrefix: 'Best Celestial Window',
      tarotCard: 'Temperance',
      tarotNumber: 'NO. 14',
      defaultTiming: '20:00 - 21:15 UTC+8',
    }),
    fr: Object.freeze({
      title: '✦ AMULETTE DE DÉGEL LUNAIRE ✦',
      subtitle: 'ALIGNEMENT DE LA TEMPÉRANCE · N° 14',
      prose: 'Les orbites célestes peuvent dériver et les marées émotionnelles monter et descendre ; mais mon estime pour toi n\'a jamais dévié d\'un seul degré.\nSi un givre soudain s\'est installé entre nos mondes, que ce message soit la première aube qui le dissipe doucement.',
      companionWhisper: 'La lune retrouve son calme ce soir, et la douce énergie de Mercure apaise les tensions. La plus belle réconciliation ne demande aucun grand discours : vers 20h30, envoie-lui simplement : « J\'espère que ta journée n\'a pas été trop éprouvante, prends un verre d\'eau tiède et repose-toi bien ce soir ». La glace fondra sans bruit.',
      bestWindowPrefix: 'Meilleur créneau céleste',
      tarotCard: 'Tempérance',
      tarotNumber: 'N° 14',
      defaultTiming: '20:00 - 21:15 UTC+8',
    }),
    es: Object.freeze({
      title: '✦ AMULETO DE DESHIELO LUNAR ✦',
      subtitle: 'ALINEACIÓN DE LA TEMPLANZA · N.º 14',
      prose: 'Las órbitas celestes pueden desviarse y las mareas del corazón fluctuar; pero mi aprecio por ti jamás se ha movido un solo milímetro.\nSi una helada repentina cayó entre nosotros, que esta misiva sea la suave aurora que la disuelva.',
      companionWhisper: 'La luna entra en calma esta noche y la energía serena de Mercurio suaviza el aire. La mejor reconciliación no necesita grandes discursos: alrededor de las 20:30, envíale: «Espero que tu día no haya sido tan pesado, toma un té caliente y descansa». El hielo se irá sin dejar rastro.',
      bestWindowPrefix: 'Mejor ventana celeste',
      tarotCard: 'La Templanza',
      tarotNumber: 'N.º 14',
      defaultTiming: '20:00 - 21:15 UTC+8',
    }),
    th: Object.freeze({
      title: '✦ เครื่องรางละลายใจใต้แสงจันทร์ ✦',
      subtitle: 'การสอดคล้องแห่งไพ่คนโทเทน้ำ (TEMPERANCE) · หมายเลข 14',
      prose: 'วิถีแห่งดวงดาวอาจผันแปร และคลื่นอารมณ์ย่อมมีขึ้นมีลง ทว่าความหวังดีและลึกซึ้งที่ฉันมีให้เธอ ไม่เคยคลาดเคลื่อนไปแม้แต่องศาเดียว\nหากมีเกล็ดน้ำแข็งแห่งความเงียบงันก่อตัวขึ้นระหว่างเรา ขอให้สารนี้เป็นดั่งแสงแรกของรุ่งอรุณที่ละลายมันลงอย่างอ่อนโยน',
      companionWhisper: 'คืนนี้ดวงจันทร์เข้าสู่ความสงบ และพลังอันนุ่มนวลของดาวพุธกำลังช่วยคลี่คลายรอยร้าว การคืนดีที่ดีที่สุดไม่จำเป็นต้องใช้คำพูดยืดยาว ช่วงเวลาราว 20:30 น. ลองส่งข้อความหาเธอว่า: «วันนี้เหนื่อยไหม อย่าลืมดื่มน้ำอุ่นๆ แล้วพักผ่อนเร็วๆ นะ» แล้วความเย็นชาจะละลายหายไปเอง',
      bestWindowPrefix: 'ช่วงเวลาแห่งฟ้าที่ดีที่สุด',
      tarotCard: 'คนโทเทน้ำ',
      tarotNumber: 'หมายเลข 14',
      defaultTiming: '20:00 - 21:15 น. (UTC+8)',
    }),
    vi: Object.freeze({
      title: '✦ MẬT THƯ GIẢI BĂNG ÁNH TRĂNG ✦',
      subtitle: 'KẾT HỢP TIẾT ĐỘ (TEMPERANCE) · SỐ 14',
      prose: 'Quỹ đạo của các vì sao có thể dao động và thủy triều cảm xúc có lúc vơi đầy; nhưng sự trân quý tôi dành cho người ấy chưa từng lệch đi một độ nào.\nNếu giữa chúng ta từng có một cơn giá buốt bất chợt, mong lá thư này sẽ là ánh bình minh đầu tiên sưởi ấm và làm tan chảy tất cả.',
      companionWhisper: 'Đêm nay vầng trăng dần tĩnh lặng, năng lượng êm dịu của sao Thủy đang xoa dịu những nốt thắt trong lòng. Sự hòa giải tuyệt vời nhất chẳng cần hoa mỹ: khoảng 20:30, hãy gửi cho người ấy một câu: «Hôm nay vất vả rồi, tối nay uống một cốc nước ấm rồi nghỉ ngơi sớm nhé». Băng giá rồi sẽ lặng lẽ tan biến.',
      bestWindowPrefix: 'Khung giờ tinh tú đẹp nhất',
      tarotCard: 'Tiết Độ',
      tarotNumber: 'SỐ 14',
      defaultTiming: '20:00 - 21:15 UTC+8',
    }),
  }),

  /* ═══════════ 二、想念·引力密函（Gravitational Longing · NO. 17）═══════════ */
  longing: Object.freeze({
    zh: Object.freeze({
      title: '✦ 潮汐引力密函 ✦',
      subtitle: 'GRAVITATIONAL LONGING AMULET · NO. 17',
      prose: '每一个静谧的夜晚，宇宙都在以光年为刻度无声呼吸；而在每一次呼吸的间歇，我都在想你。\n跨越星辰的微风，正替我带去这一瞬无言的共鸣。',
      companionWhisper: '此刻月亮正温柔掠过你们彼此相连的天区。若思念已在胸口满溢，无需刻意寒暄，把一首你们都听过的歌或晚风照片分享过去，引力自会完成剩下的连接。',
      bestWindowPrefix: 'Best Celestial Window',
      tarotCard: '星星',
      tarotNumber: 'NO. 17',
      defaultTiming: '21:30 - 22:45 UTC+8',
    }),
    en: Object.freeze({
      title: '✦ GRAVITATIONAL LONGING AMULET ✦',
      subtitle: 'THE STAR RESONANCE · NO. 17',
      prose: 'In every quiet hour of the night, the cosmos breathes across light-years in silence; and within each breath between the stars, you cross my mind.\nMay this subtle interstellar breeze carry an unspoken resonance directly to where you are.',
      companionWhisper: 'The Moon currently transits your shared harmonic sector. If your thoughts of them are overflowing, no grand words are needed — share a song you both cherish or a photo of tonight\'s sky; gravity will take care of the rest.',
      bestWindowPrefix: 'Best Celestial Window',
      tarotCard: 'The Star',
      tarotNumber: 'NO. 17',
      defaultTiming: '21:30 - 22:45 UTC+8',
    }),
    fr: Object.freeze({
      title: '✦ AMULETTE D\'ATTRACTION GRAVITATIONNELLE ✦',
      subtitle: 'RÉSONANCE DE L\'ÉTOILE · N° 17',
      prose: 'Dans chaque nuit silencieuse, l\'univers respire au rythme des années-lumière ; et dans chaque intervalle entre deux souffles stellaires, je pense à toi.\nPuisse cette brise cosmique te porter cet écho sans un mot.',
      companionWhisper: 'La lune traverse doucement votre secteur de résonance partagé. Si le manque déborde dans ton cœur, nul besoin d\'artifices : partage simplement une mélodie que vous aimez ou une photo du ciel nocturne. La gravité fera le reste.',
      bestWindowPrefix: 'Meilleur créneau céleste',
      tarotCard: 'L\'Étoile',
      tarotNumber: 'N° 17',
      defaultTiming: '21:30 - 22:45 UTC+8',
    }),
    es: Object.freeze({
      title: '✦ AMULETO DE ATRACCIÓN GRAVITACIONAL ✦',
      subtitle: 'RESONANCIA DE LA ESTRELLA · N.º 17',
      prose: 'En cada noche serena, el cosmos respira a través de años luz; y en el silencio entre cada latido estelar, tú cruzas por mi mente.\nQue esta suave brisa interestelar te lleve este eco que no necesita palabras.',
      companionWhisper: 'La luna viaja esta noche por su sector armónico común. Si las ganas de verle se desbordan, no hace falta buscar pretextos: comparte una canción que ambos adoren o una foto del cielo de hoy. La gravedad cósmica hará el resto.',
      bestWindowPrefix: 'Mejor ventana celeste',
      tarotCard: 'La Estrella',
      tarotNumber: 'N.º 17',
      defaultTiming: '21:30 - 22:45 UTC+8',
    }),
    th: Object.freeze({
      title: '✦ เครื่องรางแรงดึงดูดแห่งห้วงคิดถึง ✦',
      subtitle: 'คลื่นสะท้อนแห่งไพ่ดวงดาว (THE STAR) · หมายเลข 17',
      prose: 'ในทุกค่ำคืนอันเงียบสงบ จักรวาลกำลังหายใจผ่านมิติแห่งปีแสงอย่างแผ่วเบา และในช่องว่างระหว่างลมหายใจของหมู่ดาว ฉันกำลังคิดถึงเธอ\nขอให้สายลมแห่งดวงดาราพัดพาเอาความรู้สึกที่ไร้สุ้มเสียงนี้ ส่งตรงไปให้ถึงใจเธอ',
      companionWhisper: 'เวลานี้ดวงจันทร์กำลังเคลื่อนผ่านเรือนสะท้อนใจที่เชื่อมโยงถึงกัน หากความคิดถึงมันเอ่อล้นจนห้ามไม่อยู่ ไม่ต้องสรรหาคำพูดทักทายให้ยุ่งยาก เพียงแชร์บทเพลงที่คุณทั้งคู่ชอบ หรือภาพท้องฟ้าในคืนนี้ส่งไป แล้วแรงดึงดูดจะทำหน้าที่เชื่อมใจให้เอง',
      bestWindowPrefix: 'ช่วงเวลาแห่งฟ้าที่ดีที่สุด',
      tarotCard: 'ดวงดาว',
      tarotNumber: 'หมายเลข 17',
      defaultTiming: '21:30 - 22:45 น. (UTC+8)',
    }),
    vi: Object.freeze({
      title: '✦ MẬT THƯ LỰC HÚT NỖI NHỚ ✦',
      subtitle: 'CỘNG HƯỞNG NGÔI SAO (THE STAR) · SỐ 17',
      prose: 'Trong mỗi màn đêm tĩnh lặng, vũ trụ vẫn đang hít thở qua từng năm ánh sáng; và giữa khoảng lặng của những nhịp thở tinh cầu, tôi lại nhớ về người ấy.\nNguyện xin làn gió tinh tú mang theo tiếng vọng không lời này đến thẳng bên người.',
      companionWhisper: 'Lúc này vầng trăng đang lướt qua khu vực hoàng đạo kết nối giữa hai người. Nếu nỗi nhớ đã đong đầy lồng ngực, chẳng cần gượng gạo xã giao: hãy gửi qua một bài hát cả hai từng nghe chung hoặc một tấm ảnh chụp bầu trời đêm nay. Lực hấp dẫn của vũ trụ sẽ lo phần còn lại.',
      bestWindowPrefix: 'Khung giờ tinh tú đẹp nhất',
      tarotCard: 'Ngôi Sao',
      tarotNumber: 'SỐ 17',
      defaultTiming: '21:30 - 22:45 UTC+8',
    }),
  }),

  /* ═══════════ 三、鼓励·加持密函（Solar Empowering · NO. 19）═══════════ */
  support: Object.freeze({
    zh: Object.freeze({
      title: '✦ 旭日庇佑密函 ✦',
      subtitle: 'SOLAR EMPOWERING AMULET · NO. 19',
      prose: '每一颗在夜空璀璨的恒星，都曾历经万千重力的坍缩与淬炼。\n你此刻所穿越的阴霾绝非终局，而是黎明前最深刻的破茧。你的光芒，本就无可遮挡。',
      companionWhisper: '木星正在守护你的志向星域，眼前的颠簸只是换轨的前奏。放下紧绷的双肩，送对方一句「无论结果如何，你走过的每一步都闪闪发光」，你就是 TA 当下最好的定海神针。',
      bestWindowPrefix: 'Best Celestial Window',
      tarotCard: '太阳',
      tarotNumber: 'NO. 19',
      defaultTiming: '08:30 - 10:00 UTC+8',
    }),
    en: Object.freeze({
      title: '✦ SOLAR EMPOWERING AMULET ✦',
      subtitle: 'THE SUN MANIFEST · NO. 19',
      prose: 'Every radiant star in the night sky was forged through relentless collapse and immense pressure.\nThe turbulence you face today is not your destination — it is merely the crucible before your dawn. Your inner brilliance was never meant to be hidden.',
      companionWhisper: 'Jupiter casts a protective trine over your endeavors today. Release the tension in your shoulders and send them this reassurance: "No matter what happens, every step you took was brave and meaningful." Your presence is their sanctuary.',
      bestWindowPrefix: 'Best Celestial Window',
      tarotCard: 'The Sun',
      tarotNumber: 'NO. 19',
      defaultTiming: '08:30 - 10:00 UTC+8',
    }),
    fr: Object.freeze({
      title: '✦ AMULETTE DE BÉNÉDICTION SOLAIRE ✦',
      subtitle: 'RAYONNEMENT DU SOLEIL · N° 19',
      prose: 'Chaque étoile resplendissante dans le ciel nocturne a enduré d\'immenses gravités et d\'innombrables épreuves.\nL\'ombre que tu traverses aujourd\'hui n\'est pas ta destination, mais le creuset le plus profond avant l\'aube. Ta lumière a toujours été irrésistible.',
      companionWhisper: 'Jupiter veille sur ta maison des ambitions ; les secousses actuelles ne sont que le prélude à un renouveau. Desserre tes épaules et dis-lui : « Peu importe l\'issue, chacun de tes pas était lumineux et courageux ». Tu es son plus bel ancrage.',
      bestWindowPrefix: 'Meilleur créneau céleste',
      tarotCard: 'Le Soleil',
      tarotNumber: 'N° 19',
      defaultTiming: '08:30 - 10:00 UTC+8',
    }),
    es: Object.freeze({
      title: '✦ AMULETO DE BENDICIÓN SOLAR ✦',
      subtitle: 'MANIFESTACIÓN DEL SOL · N.º 19',
      prose: 'Cada estrella que hoy brilla con fuerza en la noche superó un colapso inmenso bajo una gravedad implacable.\nLa sombra que cruzas hoy no es tu final, sino el crisol previo al amanecer. Tu resplandor jamás estuvo destinado a apagarse.',
      companionWhisper: 'Júpiter custodia hoy tu sector de proyectos; este tropiezo temporal es solo el preludio de un cambio de órbita. Relaja los hombros y regálale estas palabras: «Pase lo que pase, cada paso que diste estuvo lleno de valor y luz». Eres su mejor refugio.',
      bestWindowPrefix: 'Mejor ventana celeste',
      tarotCard: 'El Sol',
      tarotNumber: 'N.º 19',
      defaultTiming: '08:30 - 10:00 UTC+8',
    }),
    th: Object.freeze({
      title: '✦ เครื่องรางสุริยันเปี่ยมพลัง ✦',
      subtitle: 'การปรากฏแห่งไพ่พระอาทิตย์ (THE SUN) · หมายเลข 19',
      prose: 'ดาวฤกษ์ทุกดวงที่ส่องแสงเจิดจรัสบนท้องฟ้าราตรี ล้วนผ่านการบีบอัดและหลอมละลายภายใต้แรงโน้มถ่วงมหาศาลมาแล้วทั้งสิ้น\nเมฆหมอกที่คุณกำลังก้าวผ่านในวันนี้ไม่ใช่จุดจบ แต่คือบททดสอบล้ำค่าก่อนรุ่งอรุณ แสงสว่างในตัวคุณ ไม่เคยมีสิ่งใดบดบังได้',
      companionWhisper: 'ดาวพฤหัสบดีกำลังปกปักคุ้มครองเรือนเป้าหมายของคุณ ความผันผวนตรงหน้านี้เป็นเพียงบทนำสู่การก้าวหน้า ปลดเปลื้องความตึงเครียดที่หัวไหล่ลง แล้วส่งกำลังใจให้เธอว่า: «ไม่ว่าผลลัพธ์จะเป็นอย่างไร ทุกย่างก้าวที่คุณก้าวผ่านมาล้วนเปล่งประกายและกล้าหาญเสมอ» คุณคือที่พักใจที่ดีที่สุดของเธอ',
      bestWindowPrefix: 'ช่วงเวลาแห่งฟ้าที่ดีที่สุด',
      tarotCard: 'พระอาทิตย์',
      tarotNumber: 'หมายเลข 19',
      defaultTiming: '08:30 - 10:00 น. (UTC+8)',
    }),
    vi: Object.freeze({
      title: '✦ MẬT THƯ ÁNH DƯƠNG TIẾP SỨC ✦',
      subtitle: 'HIỆN THÂN MẶT TRỜI (THE SUN) · SỐ 19',
      prose: 'Mỗi vì tinh tú rực rỡ nơi trời đêm đều từng tôi luyện qua áp lực ngàn trùng của hố sâu vũ trụ.\nLớp sương mù người ấy đang vượt qua lúc này tuyệt nhiên không phải đích đến, mà là bước chuyển mình trước bình minh. Ánh sáng của bạn, vốn dĩ không gì che khuất nổi.',
      companionWhisper: 'Sao Mộc đang chiếu sáng phương diện chí hướng của bạn; những trắc trở lúc này chỉ là khúc dạo đầu trước khi đổi hướng quỹ đạo. Hãy thả lỏng bờ vai và gửi tới người ấy một câu: «Dù kết quả thế nào, mỗi bước bạn đã đi qua đều vô cùng kiên cường và tỏa sáng». Bạn chính là điểm tựa bình yên nhất của người ấy.',
      bestWindowPrefix: 'Khung giờ tinh tú đẹp nhất',
      tarotCard: 'Mặt Trời',
      tarotNumber: 'SỐ 19',
      defaultTiming: '08:30 - 10:00 UTC+8',
    }),
  }),

  /* ═══════════ 四、关系天气·透镜密函（Celestial Synergy Weather · NO. 06）═══════════ */
  weather: Object.freeze({
    zh: Object.freeze({
      title: '✦ 关系晴雨密函 ✦',
      subtitle: 'CELESTIAL SYNERGY WEATHER · NO. 06',
      prose: '今日双人星轨交织出澄澈的微风，金水互溶带来了天然的倾听磁场。\n宜：促膝漫步、分享日常碎片；忌：在沉默中无端揣度。',
      companionWhisper: '今日关系指数 94%（晴空万里）。最佳能量交互窗口在傍晚 19:00 - 20:30。今晚不妨放下手机，一起散步 20 分钟或共享一份甜点，心声会在晚风里自然契合。',
      bestWindowPrefix: 'Best Celestial Window',
      tarotCard: '恋人',
      tarotNumber: 'NO. 06',
      defaultTiming: '19:00 - 20:30 UTC+8',
    }),
    en: Object.freeze({
      title: '✦ CELESTIAL SYNERGY WEATHER ✦',
      subtitle: 'THE LOVERS HARMONY · NO. 06',
      prose: 'Today, your twin orbits weave a serene and lucid breeze as Venus and Mercury foster genuine listening.\nFavorable: Unhurried evening walks, sharing quiet laughter; Unfavorable: Guessing thoughts in silence.',
      companionWhisper: 'Synastry Resonance: 94% (Clear Skies). Your prime harmonic window opens between 7:00 PM and 8:30 PM. Set aside your screens, take a 20-minute stroll together or share a light dessert; true alignment flourishes without force.',
      bestWindowPrefix: 'Best Celestial Window',
      tarotCard: 'The Lovers',
      tarotNumber: 'NO. 06',
      defaultTiming: '19:00 - 20:30 UTC+8',
    }),
    fr: Object.freeze({
      title: '✦ AMULETTE DE MÉTÉO RELATIONNELLE ✦',
      subtitle: 'HARMONIE DES AMOUREUX · N° 06',
      prose: 'Aujourd\'hui, vos trajectoires croisées tissent une brise pure et apaisante où Vénus et Mercure invitent à une écoute sincère.\nFavorable : Marcher côte à côte le soir, partager des éclats du quotidien ; Défavorable : Se perdre en suppositions silencieuses.',
      companionWhisper: 'Indice de résonance : 94 % (Ciel dégagé). Le meilleur moment d\'échange se situe en soirée, entre 19h00 et 20h30. Laissez vos écrans de côté, prenez 20 minutes pour vous promener ensemble ou partagez un dessert ; vos cœurs s\'accorderont dans la brise du soir.',
      bestWindowPrefix: 'Meilleur créneau céleste',
      tarotCard: 'Les Amoureux',
      tarotNumber: 'N° 06',
      defaultTiming: '19:00 - 20:30 UTC+8',
    }),
    es: Object.freeze({
      title: '✦ AMULETO DE CLIMA VINCULAR ✦',
      subtitle: 'ARMONÍA DE LOS ENAMORADOS · N.º 06',
      prose: 'Las órbitas de ambos se entrelazan hoy creando una brisa limpia y cristalina; Venus y Mercurio abren un espacio natural para escucharse de verdad.\nPropicio : Paseos vespertinos, compartir pequeños instantes del día ; Desaconsejado : Guardar silencio y suponer sin preguntar.',
      companionWhisper: 'Índice de sintonía : 94 % (Cielo despejado). La mejor ventana de conexión se abrirá al atardecer, entre las 19:00 y las 20:30. Dejen el móvil a un lado, caminen juntos unos 20 minutos o compartan un postre ; la armonía fluirá sola con el viento de la tarde.',
      bestWindowPrefix: 'Mejor ventana celeste',
      tarotCard: 'Los Enamorados',
      tarotNumber: 'N.º 06',
      defaultTiming: '19:00 - 20:30 UTC+8',
    }),
    th: Object.freeze({
      title: '✦ เครื่องรางพยากรณ์บรรยากาศสองใจ ✦',
      subtitle: 'ความสอดคล้องแห่งไพ่คู่รัก (THE LOVERS) · หมายเลข 06',
      prose: 'วันนี้วิถีแห่งดวงดาวของทั้งสองประสานกันเป็นสายลมอ่อนโยนและปลอดโปร่ง ดาวศุกร์และดาวพุธหลอมรวมเปิดสนามพลังแห่งการรับฟังจากใจจริง\nสิ่งที่ควรทำ : เดินเล่นเคียงข้างกันในยามเย็น, เล่าเรื่องราวเล็กๆ ในชีวิต ; สิ่งที่ไม่ควรทำ : คาดเดาความรู้สึกกันไปเองในความเงียบงัน',
      companionWhisper: 'ดัชนีความสอดคล้องวันนี้พุ่งสูงถึง 94% (ฟ้าโปร่งใสไร้เมฆหมอก) ช่วงเวลาแลกเปลี่ยนพลังงานที่ดีที่สุดคือยามเย็น 19:00 - 20:30 น. วางโทรศัพท์มือถือลงสักครู่ ออกไปเดินเล่นด้วยกัน 20 นาที หรือทานขนมหวานด้วยกันสักมื้อ แล้วหัวใจจะจูนเข้าหากันได้อย่างเป็นธรรมชาติ',
      bestWindowPrefix: 'ช่วงเวลาแห่งฟ้าที่ดีที่สุด',
      tarotCard: 'คู่รัก',
      tarotNumber: 'หมายเลข 06',
      defaultTiming: '19:00 - 20:30 น. (UTC+8)',
    }),
    vi: Object.freeze({
      title: '✦ MẬT THƯ THỜI TIẾT TÌNH CẢM ✦',
      subtitle: 'HÒA HỢP TÌNH NHÂN (THE LOVERS) · SỐ 06',
      prose: 'Quỹ đạo đôi bên hôm nay đan kết thành một làn gió trong trẻo và thanh bình; sao Kim cùng sao Thủy giao hòa mang lại từ trường lắng nghe hết sức tự nhiên.\nNên : Tản bộ cạnh nhau lúc hoàng hôn, chia sẻ những khoảnh khắc đời thường ; Kỵ : Im lặng rồi tự suy đoán lung tung.',
      companionWhisper: 'Chỉ số hòa hợp hôm nay đạt 94% (Trời trong không mây). Khung giờ năng lượng tuyệt vời nhất là chập tối 19:00 - 20:30. Hãy thử tạm gác điện thoại qua một bên, cùng nhau đi dạo 20 phút hoặc chia nhau một món tráng miệng ngọt ngào ; sự thấu hiểu sẽ tự tìm về trong làn gió mát.',
      bestWindowPrefix: 'Khung giờ tinh tú đẹp nhất',
      tarotCard: 'Tình Nhân',
      tarotNumber: 'SỐ 06',
      defaultTiming: '19:00 - 20:30 UTC+8',
    }),
  }),
});

/** 模板完整性校验（4 类 × 6 语 = 24 套——军令断言门禁数据面） */
export function listAmuletTemplateKeys() {
  const keys = [];
  for (const type of AMULET_TYPES) {
    for (const locale of AMULET_LOCALES) {
      keys.push(`${type}_${locale}`);
    }
  }
  return keys;
}

/** 取模板（未知组合 fail-closed 返回 null——严禁默认回退编造文案） */
export function getAmuletTemplate(type, locale) {
  const byType = AMULET_TEMPLATES_24[type];
  if (!byType) return null;
  return byType[locale] || null;
}
