// tarot-cards.js — 22 Major Arcana (7 languages: zh/en/fr/es/th/vi)
// Per 军师 2026-06-14: EN bestie astrologer | FR Paris philosopher | ES LATAM warmth | ZH Gentle but Firm

const MAJOR_ARCANA = [
  {
    id: 0,
    name: { zh: "愚人", en: "The Fool", fr: "Le Mat", es: "El Loco", th: "เดอะฟูล", vi: "Kẻ Ngốc" },
    emoji: "🌟",
    upright: {
      zh: "TA在这段关系里感到新鲜感和冲动，愿意为你冒险，但心思漂浮，需要你给这段热情加一点现实的锚。",
      en: "Feels like a fresh adventure, babe. They're totally into the thrill with you — but maybe lacking a little grounding. Trust your gut here.",
      fr: "L'air de l'aventure, c'est excitant. Iels sont partant·es pour le thrill avec toi — mais manque un peu de ancrage. Fie-toi à ton instinct. 🪐",
      es: "¡Esto se siente como una aventura fresca, linda! Están totalmente metidos en el riesgo contigo — pero les falta un poco de piso. Confía en tu intuición. 💖",
      th: "การเริ่มต้นใหม่ที่บริสุทธิ์เปี่ยมศักยภาพ",
      vi: "Lá bài mang đến một làn gió tươi mới, báo hiệu một chương mới trong tình cảm của hai bạn đang mở ra. Đừng ngần ngại rũ bỏ những hoài nghi quá khứ để cùng nhau bước vào hành trình này với một trái tim thuần khiết nhất. Niềm tin khờ dại nhưng chân thành chính là chìa khóa mở ra hạnh phúc."
    },
    reversed: {
      zh: "TA感到迷茫或害怕承担责任，冷淡可能是在逃避现实压力，需要静下心来好好沟通。",
      en: "They're a bit lost in the fog right now, babe. The distance? It's not you — it's them retreating from something. Pull them in gently.",
      fr: "Iels se perdent un peu dans le brouillard. La distance ? C'est pas toi — c'est iels qui fuient quelque chose. Rapproche-les doucement. 👁️",
      es: "Se sienten un poco perdidos en la niebla, linda. ¿La distancia? No eres tú — es ellxs huyendo de algo. Acércate con calma. 💫",
      th: "เสียงก้องในหมอก — เค้ากำลังถอยออกจากบางสิ่ง อย่าคิดว่าเป็นความผิดของเธอ เข้าหาเค้าอย่างนุ่มนวล",
      vi: "Vòng quay số phận đang tạm thời khựng lại, mang theo những thử thách và rào cản ngoài ý muốn đến với tình cảm của hai bạn. Đây không phải là dấu chấm hết, mà là khoảng lặng cần thiết để cả hai nhìn nhận lại bước đi của mình, kiên nhẫn chờ đợi thời cơ để cùng nhau chuyển mình."
    }
  },
  {
    id: 1,
    name: { zh: "魔术师", en: "The Magician", fr: "Le Bateleur", es: "El Mago", th: "จอมเวทย์", vi: "Nhà Ảo Thuật" },
    emoji: "🔮",
    upright: {
      zh: "TA觉得你非常有吸引力，正在主动规划你们的未来，有能力把想法变成现实。",
      en: "Oh, they fancy you big time. That chemistry is off the charts and they're already dreaming up your future together, babe.",
      fr: "Oh, iel t'aime bien comme il faut. Cette alchimie estWOW et iel rêve déjà de votre avenir commun. 🪐",
      es: "¡Oh, te encuentran súper atractiva! La química está por las nubes y ya están soñando con su futuro juntas. 💖",
      th: "ความสามารถบรรลุเป้าหมาย",
      vi: "Lá bài Nhà Ảo Thuật tượng trưng cho sự biến ước thành hiện thực, báo hiệu rằng người kia đang nắm giữ năng lực đặc biệt để biến những giấc mơ tình yêu thành hành động cụ thể. Đây là thời điểm hoàn hảo để cùng nhau kiến tạo tương lai với sự sáng tạo và quyết tâm. Năng lượng dồi dào này chính là nguyên liệu quý giá cho một mối quan hệ bền vững."
    },
    reversed: {
      zh: "TA可能在用话术或小套路掩饰真心，或者你被TA的表面现象迷惑了。",
      en: "A little voice is whispering: something might be a bit performative here. Don't overthink it — just stay curious, babe.",
      fr: "Une petite voix murmure : quelque chose pourrait être légèrement performatif ici. Ne rumine pas — reste curieuse. 👁️",
      es: "Un bichito te dice que algo aquí puede ser un poquito performativo. No te rayes — solo mantente alerta con cariño. 💫",
      th: "พลังที่ซ่อนอยู่หลังม่าน — บางทักษะอาจเป็นเกม อย่าเพิ่งด่วนตัดสิน แค่สังเกตแล้วปล่อย",
      vi: "Khi lá bài này xuất hiện ở chiều ngược, những lời đường mật hoặc biểu hiện bề ngoài có thể đang che giấu đi sự thật sâu xa. Hãy dành thời gian để phân biệt rõ ràng giữa tình yêu chân thành và những trò chơi cảm xúc, giữ cho tâm trí tỉnh táo và trái tim không bị lung lay."
    }
  },
  {
    id: 2,
    name: { zh: "女祭司", en: "The High Priestess", fr: "La Papesse", es: "La Sacerdotisa", th: "หญิงชาววัด", vi: "Nữ Tu" },
    emoji: "🌙",
    upright: {
      zh: "TA有些心思和秘密没有坦白，或者过于理智冷漠，让你捉摸不透。",
      en: "Something's staying unspoken between you two, babe. They're a bit guarded — or maybe just processing quietly. Give it time.",
      fr: "Quelque chose reste indicible entre vous. Iel est un peu sur ses gardes — ou en train de digérer en silence. Laisse faire. 🪐",
      es: "Algo se está quedando en el aire entre ustedes, linda. Ellxs están un poquito a la defensiva — o quizás procesando en silencio. Dale tiempo. 💖",
      th: "การรอคอยสิ่งดีๆ",
      vi: "Nữ Tu ngầm hiệu một trực giác sâu sắc đang dẫn lối, báo hiệu rằng người kia đang lắng nghe những tiếng vọng từ tâm hồn để tìm kiếm sự kết nối đích thực với bạn. Những điều được giấu kín đang dần hé lộ, và thời gian chờ đợi sẽ được đền bù bằng sự thấu hiểu sâu sắc hơn. Tin tưởng vào trực giác chung của hai bạn chính là ánh đèn soi đường trong đêm."
    },
    reversed: {
      zh: "直觉在告诉你某些被忽视的信号，TA其实在乎你，只是不知道怎么表达。",
      en: "Your gut is actually onto something here. They do care — they're just not the best at showing it. Read between the lines, babe.",
      fr: "Ton instinct a raison. Iel tient à toi — iel ne sait juste pas bien comment le montrer. Lis entre les lignes. 👁️",
      es: "Tu intuición tiene razón, linda. Sí les importas — solo que no saben bien cómo demostrarlo. Lee entre líneas. 💫",
      th: "เสียงเงียบที่ยังคงดัง — ความลับซ่อนอยู่ เส้นทางที่ยังไม่ชัด จงให้เวลากับการรอคอย",
      vi: "Chiều ngược của Nữ Tu báo hiệu những bí mật đang được giấu kín, có thể có những hiểu lầm cần được giải quyết bằng sự thấu hiểu và kiên nhẫn. Đừng để những giả định sai lầm xâm nhập vào tâm trí, hãy mở lòng để lắng nghe những điều chưa được nói ra, bởi chính khoảng lặng ấy đang chờ một tiếng nói chân thật."
    }
  },
  {
    id: 3,
    name: { zh: "女皇", en: "The Empress", fr: "L'Impératrice", es: "La Emperatriz", th: "จักรพรรดินี", vi: "Nữ Hoàng" },
    emoji: "🌺",
    upright: {
      zh: "TA最近可能觉得你占有欲过强，或者在这段关系里感到压迫感，需要给彼此一点呼吸空间。",
      en: "The energy between you might feel a touch suffocating for them lately, babe. It's not about rejecting you — they just need a little room to breathe.",
      fr: "L'énergie entre vous peut leur sembler un tantinet étouffante lately. C'est pas un rejet — iel a juste besoin d'un peu d'espace. 🪐",
      es: "La energía entre ustedes puede sentirse un poquito agobiante para ellxs últimamente, linda. No es rechazarte — solo necesitan un poco de aire. 💖",
      th: "ความมั่นคงและความอบอุ่นในครอบครัว",
      vi: "Nữ Hoàng tỏa ra năng lượng nuôi dưỡng vô song, báo hiệu rằng người kia đang mang đến sự che chở và ấm áp cho không gian tình yêu của hai bạn. Đây là biểu tượng của sự sung túc cảm xúc, nơi mà sự quan tâm và lòng trắc ẩn được thể hiện một cách tự nhiên nhất. Hãy để tình yêu này phát triển trong môi trường đầy đủ dinh dưỡng tâm hồn."
    },
    reversed: {
      zh: "TA的控制欲源于深层的不安全感，多给予理解和肯定，能软化TA的心。",
      en: "Their need for control? It's coming from somewhere deep inside, babe. More warmth and reassurance will do wonders.",
      fr: "Leur besoin de contrôle ? Ça vient de quelque part profonde. Plus de douceur et de réassurance, et ça fait des miracles. 👁️",
      es: "¿Su necesidad de control? Viene de algún lugar profundo, linda. Más calidez y certeza van a hacer milagros. 💫",
      th: "เมฆบังแสงจันทร์ — ความอบอุ่นยังอยู่แต่ซ่อนอยู่ ความรู้สึกที่ไม่แน่นอนต้องการพื้นที่",
      vi: "Khi Nữ Hoàng xuất hiện ngược, sự bất ổn trong cảm xúc có thể đang tạo ra những cơn sóng ngầm trong mối quan hệ, có thể gây áp lực hoặc thiếu không gian cho nhau. Hãy dành thời gian để nuôi dưỡng lại sự cân bằng cảm xúc trước khi tiếp tục hành trình, bởi một tâm hồn bình yên sẽ mang lại sự ấm áp bền lâu hơn."
    }
  },
  {
    id: 4,
    name: { zh: "皇帝", en: "The Emperor", fr: "L'Empereur", es: "El Emperador", th: "จักรพรรดิ", vi: "Nam Hoàng" },
    emoji: "👑",
    upright: {
      zh: "TA性格强势有主见，渴望掌控全局，这是TA表达爱的方式——给你安全感。",
      en: "They're taking charge because they genuinely want the best for both of you, babe. That's their love language — providing stability.",
      fr: "Iel prend les choses en mainparce qu'iel veut vraiment le meilleur pour vous deux. C'est sa façon d'aimer — apporter de la stabilité. 🪐",
      es: "Toma el control porque genuinamente quiere lo mejor para ambas partes, linda. Esa es su forma de amar — darte seguridad. 💖",
      th: "ความสำเร็จและความเป็นผู้นำ",
      vi: "Nam Hoàng đại diện cho nguyên tắc trật tự và kỷ luật, báo hiệu rằng người kia đang mang đến sự ổn định và định hướng vững chắc cho mối quan hệ. Đây là biểu tượng của sự thành công trong việc xây dựng nền tảng kiên cố, nơi mà sự trách nhiệm và tài lãnh đạo được thể hiện rõ ràng. Hãy để sự vững vàng này dẫn dắt con đường chung của hai bạn."
    },
    reversed: {
      zh: "TA的大男子主义或过于死板让你感到窒息，两人的步调没有踩在同一个点上。",
      en: "Their rigid side is starting to feel a little heavy for you, babe. When the rhythm is off, the vibe shifts — and you feel it.",
      fr: "Leur côté rigide commence à peser un peu pour toi. Quand le rythme est décalé, le vibe change — et tu le sens. 👁️",
      es: "Su lado rígido está empezando a sentirse pesado, linda. Cuando el ritmo no cuadra, todo se siente fuera de lugar — y tú lo sientes. 💫",
      th: "ราชันที่แข็งเกินไป — กำแพงที่เค้าสร้างไว้อาจเป็นเพื่อปกป้องตัวเอง ไม่ใช่เพื่อกั้นเธอ",
      vi: "Chiều ngược của Nam Hoàng phản ánh sự độc đoán và thiếu linh hoạt có thể tạo ra những bức tường ngăn cách trong mối quan hệ. Hãy kiên nhẫn mở lối thông cảm, bởi phía sau lớp vỏ cứng rắn ấy là một trái tim đang khao khát sự gần gũi thực sự."
    }
  },
  {
    id: 5,
    name: { zh: "教皇", en: "The Hierophant", fr: "Le Pape", es: "El Papa", th: "ศาสนาจารย์", vi: "Giáo Sĩ" },
    emoji: "🙏",
    upright: {
      zh: "TA渴望精神层面的深层连接，这段关系有潜力成为彼此生命中最稳固的支撑。",
      en: "What they really want? A soul-level bond with you. This connection has the potential to be one of the most grounding things in their life.",
      fr: "Ce qu'iel veut vraiment ? Un lien âme à âme avec toi. Cette connexion peut devenir un des piliers les plus ancrants de sa vie. 🪐",
      es: "Lo que realmente quiere es un vínculo alma a alma contigo, linda. Esta conexión tiene potencial para ser una de las cosas más reconfortantes en su vida. 💖",
      th: "การเลือกเส้นทางที่ถูกต้อง",
      vi: "Giáo Sĩ là biểu tượng của sự kết nối tâm linh và tri thức, báo hiệu rằng người kia đang khao khát một sự thấu hiểu sâu sắc về mối quan hệ này ở cấp độ tâm hồn. Đây là thời điểm mà triết lý tình yêu chung của hai bạn đang dần được định hình, mở ra cánh cửa dẫn đến sự hài hòa tinh thần lâu dài."
    },
    reversed: {
      zh: "TA被传统观念束缚，可能在用社会的标准来评判你们的关系，试着打破框架。",
      en: "They're a bit caught up in what tradition says. But babe, you two write your own rules — don't let old scripts define your story.",
      fr: "Iel est un peu coincé·e dans ce que la tradition dicte. Mais you two, vous écrivez vos propres règles — ne laissez pas de vieux schémas décider. 👁️",
      es: "Se dejaron llevar un poquito por lo que la tradición dicta. Pero mirá, ustedes escriben sus propias reglas — no dejes que viejo guiones definan su historia. 💫",
      th: "เข็มทิศที่หลงทาง — การเลือกเส้นทางผิดครั้งนี้อาจเป็นบทเรียนที่สวยงาม อย่าโทษตัวเองมาก",
      vi: "Khi Giáo Sĩ xuất hiện ngược, những lời khuyên sai lầm hoặc ảnh hưởng tiêu cực từ bên ngoài có thể đang gây rối với mối quan hệ của hai bạn. Hãy giữ vững niềm tin vào những giá trị cốt lõi của hai bạn, đừng để những lời không đáng tin cậy làm lung lay nền móng tình yêu."
    }
  },
  {
    id: 6,
    name: { zh: "恋人", en: "The Lovers", fr: "Les Amoureux", es: "Los Amantes", th: "คู่รัก", vi: "Tình Nhân" },
    emoji: "💕",
    upright: {
      zh: "你们之间有极强的化学反应和价值观共鸣，TA视你为灵魂伴侣。",
      en: "The chemistry between you is next level, babe. They genuinely see you as their person — soulmate energy is real here.",
      fr: "L'alchimie entre vous est à un autre niveau. Iel te voit vraiment comme sa personne — l'énergie âme sœur, c'est réel ici. 🪐",
      es: "¡La química entre ustedes es de otro nivel, linda! Te ven genuinamente como su persona — el tema de alma gemela es real aquí. 💖",
      th: "ความสามัคคีและความรักที่ลึกซึ้ง",
      vi: "Lá bài Nữ Hoàng Tình Yêu là biểu tượng tuyệt đối của sự hòa hợp, báo hiệu rằng người kia nhìn thấy bạn như một nửa hoàn hảo của linh hồn mình. Đây là sự kết hợp hoàn hảo giữa hai người, nơi mà sự đồng điệu trong giá trị và cảm xúc tạo nên một mối liên kết không thể phá vỡ. Hãy trân trọng duyên phần thiêng liêng này."
    },
    reversed: {
      zh: "选择让你们都感到纠结，可能有外部压力干扰了你们的判断。",
      en: "A crossroads just showed up, babe. External noise might be making this harder than it needs to be — trust the bond, not the pressure.",
      fr: "Un carrefour vient d'apparaître. Le bruit externe pourrait compliquer les choses — fais confiance à votre lien, pas à la pression. 👁️",
      es: "Un cruce de caminos apareció, linda. El ruido externo puede estar haciendo esto más difícil de lo necesario — confía en el vínculo, no en la presión. 💫",
      th: "รอยร้าวที่ยังซ่อมได้ — ความขัดแย้งคือการเติบโต ไม่ใช่จุดจบ ความรักที่ผ่านพ้นจะแข็งแกร่งกว่าเดิม",
      vi: "Chiều ngược của lá bài Tình Yêu báo hiệu những xung đột trong mối quan hệ với những lựa chọn khó khăn hoặc thậm chí là chia ly. Hãy bình tĩnh để nhìn nhận rõ ràng thay vì vội vàng đưa ra quyết định quan trọng, bởi sự xung đột đôi khi là tiếng vọng của một bước chuyển mình cần thiết."
    }
  },
  {
    id: 7,
    name: { zh: "战车", en: "The Chariot", fr: "Le Chariot", es: "El Carro", th: "ราชารถ", vi: "Chiến Xa" },
    emoji: "🏛️",
    upright: {
      zh: "不管遇到什么阻碍，TA抱有坚定决心要和你走下去。",
      en: "No matter what's in the way, they've got their eyes on you and the prize, babe. That determination? It's actually really attractive.",
      fr: "Peu importe ce qui est sur leur chemin, iel a les yeux rivés sur toi et sur le prize. Cette détermination ? C'est plutôt attirant, en vrai. 🪐",
      es: "No importa lo que esté en el camino, tienen sus ojos puestos en ti y en el premio, linda. ¿Esa determinación? Es bastante atractiva, de verdad. 💖",
      th: "ความมุ่งมั่นและชัยชนะ",
      vi: "Chiến Xa tượng trưng cho ý chí kiên định và quyết tâm chinh phục, báo hiệu rằng người kia sẽ không để bất kỳ rào cản nào ngăn cách hai bạn. Đây là biểu tượng của sự chiến thắng trong tình yêu, nơi mà sự dũng cảm và ý chí được kết hợp để mang về thành công. Hãy để ngọn lửa quyết tâm này thắp sáng con đường chung của hai bạn."
    },
    reversed: {
      zh: "感情失去了方向，两人都在向不同方向拉扯，缺乏协调。",
      en: "The momentum stalled a little, babe. When both people pull in different directions, everything feels out of sync — that's what you're sensing.",
      fr: "L'élan s'est un peu enlisé. Quand deux personnes tirent dans des directions opposées, tout est désynchronisé — c'est ce que tu ressens. 👁️",
      es: "El impulso se estancó un poquito, linda. Cuando ambas personas tiran para lados diferentes, todo se siente fuera de sincronía — eso es lo que estás sintiendo. 💫",
      th: "รถราที่แล่นเร็วเกินไป — เค้าอาจต้องการเวลาให้ทุกอย่างนิ่งลง อย่าเร่งด่วน ให้พลังงานไหลตามธรรมชาติ",
      vi: "Khi Chiến Xa xuất hiện ngược, sự thiếu kế hoạch và mất kiểm soát có thể khiến mối quan hệ mất phương hướng, cả hai đang kéo đi những hướng khác nhau. Hãy cùng nhau ngồi lại và thảo luận để tìm lại hướng đi chung, bởi sự phối hợp nhịp nhàng mới là chìa khóa dẫn đến chiến thắng."
    }
  },
  {
    id: 8,
    name: { zh: "力量", en: "Strength", fr: "La Force", es: "La Fuerza", th: "พลัง", vi: "Sức Mạnh" },
    emoji: "🦁",
    upright: {
      zh: "TA非常吃你温柔包容的那一套，你在这段关系里占据温柔的主导权。",
      en: "They're totally moved by your warmth and patience, babe. You've got a quiet power here — and they feel it.",
      fr: "Iel est vraiment touché·e par ta douceur et ta patience. Tu détiens un pouvoir discret ici — et iel le ressent. 🪐",
      es: "Son súper tocados por tu calidez y paciencia, linda. Tenés un poder callado aquí — y ellxs lo sienten. 💖",
      th: "ความกล้าและความอดทน",
      vi: "Sức Mạnh không chỉ là sức mạnh thể chất mà còn là sức mạnh tinh thần kiên cường, báo hiệu rằng người kia có đủ nội lực để vượt qua mọi thử thách trong tình yêu. Đây là biểu tượng của sự dũng cảm đối mặt với nỗi sợ và kiên nhẫn nuôi dưỡng cảm xúc, một cách đầy kiêu hãnh và độ lượng."
    },
    reversed: {
      zh: "TA内心感到疲惫软弱，容易因为小事引发自卑与暴躁，需要你拉TA一把。",
      en: "They're running on empty, babe. The small stuff is hitting harder than it should — what they need most is you, steady and soft.",
      fr: "Iel roule sur la réserve. Les petites choses tapent plus fort qu'elles ne devraient — ce dont iel a le plus besoin, c'est toi, steady and soft. 👁️",
      es: "Van con las luces de reserva, linda. Las cosas chiquitas pegan más fuerte de lo que deberían — lo que más necesitan es a vos, firme y gentil. 💫",
      th: "สิ่งที่อ่อนแอคือสิ่งที่แท้จริง — ความกลัวไม่ใช่จุดอ่อน มันคือพื้นที่ที่รอการเติบโต",
      vi: "Chiều ngược của Sức Mạnh cho thấy nỗi sợ hãi và sự yếu đuối bên trong đang chi phối tâm trí, có thể khiến người kia nghi ngờ chính khả năng yêu thương của mình. Họ cần được an ủi và khẳng định để lấy lại sự tự tin đã lung lay, bởi sức mạnh thực sự chính là dám nhìn vào nỗi sợ và vẫn tiến về phía trước."
    }
  },
  {
    id: 9,
    name: { zh: "隐士", en: "The Hermit", fr: "L'Ermite", es: "El Ermitaño", th: "ฤๅษี", vi: "Nhà Ẩn Sĩ" },
    emoji: "🏔️",
    upright: {
      zh: "TA需要独处的时间来处理内心，但你主动的陪伴能让TA更快回归。",
      en: "They need some solo time to sort things out, babe. But here's the thing — your presence actually brings them back faster.",
      fr: "Iel a besoin de temps seul·e pour démêler les choses. Mais voici le truc — ta présence l'aide à revenir plus vite. 🪐",
      es: "Necesitan tiempo a solas para ordenar las cosas, linda. Pero mirá — tu presencia las hace volver más rápido. 💖",
      th: "การเดินทางแห่งการค้นพบตัวเอง",
      vi: "Nhà Ẩn Sĩ mang đến thông điệp về hành trình nội tâm sâu sắc, báo hiệu rằng người kia đang tìm kiếm sự thật bên trong qua sự tĩnh lặng và suy tư. Đây là biểu tượng của trí tuệ thu được từ việc đi sâu vào nội tâm, nơi mà những câu trả lời đích thực đang chờ đợi được khám phá. Sự hiện diện âm thầm của bạn chính là ngọn nến soi đường trong hành trình ấy."
    },
    reversed: {
      zh: "TA在逃避现实，在关系中显得过于退缩，需要你主动打破沉默。",
      en: "They've been retreating a bit — and the silence is loud, babe. Sometimes the one who reaches out first changes everything.",
      fr: "Iel s'est un peu retiré·e — et le silence est lourd. Parfois, celle qui tend la main en premier change tout. 👁️",
      es: "Se han estado recluyendo — y el silencio se siente pesado, linda. A veces la que da el primer paso lo cambia todo. 💫",
      th: "ป้อมปราการที่ซ่อนตัว — เค้ากำลังหาแสงเทียนในความมืด แค่ให้เค้ารู้ว่าเธอยังอยู่ตรงนี้",
      vi: "Khi Nhà Ẩn Sĩ xuất hiện ngược, sự cô đơn và thu hẹp nội tâm đang ảnh hưởng đến mối quan hệ, có thể khiến người kia rút lui khỏi sự kết nối. Hãy kiên nhẫn tiếp cận bằng sự nhẹ nhàng thay vì áp lực, bởi đôi khi người cần không gian nhất lại là người khao khát sự gần gũi nhất."
    }
  },
  {
    id: 10,
    name: { zh: "命运之轮", en: "Wheel of Fortune", fr: "La Roue de Fortune", es: "La Rueda de la Fortuna", th: "ล้อแห่งโชคชะตา", vi: "Bánh Xe Vận Mệnh" },
    emoji: "🎡",
    upright: {
      zh: "命运的齿轮正在转动，这是你们关系的关键转折点，顺势而为会有惊喜。",
      en: "The wheel is spinning, babe — and this is a real turning point. Go with it. Big things are on the other side of this shift.",
      fr: "La roue tourne — et c'est un vrai tournant. Laisse-toi porter. Les grandes choses sont de l'autre côté de ce changement. 🪐",
      es: "¡La rueda está girando y este es un punto de quiebre real, linda! Déjate llevar. Cosas grandes vienen del otro lado de este giro. 💖",
      th: "การเปลี่ยนแปลงและโชคชะตา",
      vi: "Bánh Xe Vận Mệnh báo hiệu một bước ngoặt quan trọng đang đến, nơi mà vận may và cơ hội mới mẻ sẽ mở ra cánh cửa cho tình yêu của hai bạn. Đây là biểu tượng của chu kỳ vận hành trong vũ trụ, nơi mà những điều tưởng chừng bất khả thi sẽ trở nên khả thi một cách kỳ diệu. Hãy nắm bắt khoảnh khắc vàng này để tạo nên sự chuyển mình đáng kinh ngạc."
    },
    reversed: {
      zh: "意外的挑战突然出现，打乱了你们的计划，需要灵活应对。",
      en: "Something unexpected just flipped the script, babe. Plans shifted fast — but hey, adaptability is literally your superpower.",
      fr: "Quelque chose d'inattendu vient de retourner le scénario. Les plans ont changé vite — mais hey, l'adaptabilité, c'est littéralement ton superpouvoir. 👁️",
      es: "Algo inesperado acaba de cambiar el guion, linda. Los planes cambiaron rápido — pero mirá, la adaptabilidad es literalmente tu superpoder. 💫",
      th: "ล้อที่หมุนช้าลง — ช่วงนี้อาจหนักหน่วง แต่ทุกการหยุดคือจังหวะก่อนก้าวใหม่",
      vi: "Chiều ngược của Bánh Xe Vận Mệnh báo hiệu những trở ngại cản trở tiến bộ trong mối quan hệ, có thể có những rào cản bất ngờ xuất hiện trên đường đi chung. Hãy thích nghi và linh hoạt để vượt qua những thay đổi bất ngờ này, bởi đôi khi những chướng ngại lại là bài học cần thiết giúp hai bạn trưởng thành hơn."
    }
  },
  {
    id: 11,
    name: { zh: "正义", en: "Justice", fr: "La Justice", es: "La Justicia", th: "ความยุติธรรม", vi: "Công Lý" },
    emoji: "⚖️",
    upright: {
      zh: "TA的决策基于公平和逻辑，你们的关系在理性框架下稳定发展。",
      en: "Everything they decide comes from a place of real fairness, babe. This relationship is built on solid, well-thought-out ground.",
      fr: "Tout ce qu'iel décide vient d'un vrai sens de l'équité. Cette relation est construite sur un terrain solide et bien réfléchi. 🪐",
      es: "Todo lo que决定 viene de un lugar de verdadera equidad, linda. Esta relación está construida sobre terreno sólido y bien pensado. 💖",
      th: "ความสมดุลและความยุติธรรม",
      vi: "Công Lý đại diện cho sự cân bằng và công lý trong tình yêu, báo hiệu rằng mối quan hệ của hai bạn đang được vũ trụ soi chiếu công minh. Đây là biểu tượng của sự thật và công bằng, nơi mà mọi hành động đều được ghi nhận và đáp trả một cách xứng đáng. Hãy duy trì sự công minh trong từng lời nói và hành động."
    },
    reversed: {
      zh: "TA可能在权衡某些决定的利弊，迟迟不做承诺是因为怕伤害你。",
      en: "They're weighing things carefully — and taking time is actually a sign of respect, babe. They're trying not to hurt you in the process.",
      fr: "Iel pèse les choses soigneusement — et prendre son temps, c'est réellement un signe de respect. Iel essaie de ne pas te blesser en chemin. 👁️",
      es: "Están ponderando todo con cuidado — y tomarse su tiempo es un signo de respeto, linda. Están tratando de no lastimarte en el proceso. 💫",
      th: "ความจริงที่ยังซ่อนอยู่ — บางเรื่องต้องให้เวลา ความอยุติธรรมจะปรากฏเมื่อถึงเวลาของมัน",
      vi: "Khi Công Lý xuất hiện ngược, sự thiếu công bằng trong cách nhìn nhận vấn đề có thể đang gây tổn thương cho mối quan hệ, có thể có định kiến hoặc thiên vị cần được xem xét lại. Hãy nhìn nhận mọi việc từ góc độ khách quan hơn, để sự công minh thực sự được phục hồi trong tâm hồn hai bạn."
    }
  },
  {
    id: 12,
    name: { zh: "倒吊人", en: "The Hanged Man", fr: "Le Pendu", es: "El Colgado", th: "คนแขวนคอ", vi: "Người Treo Ngược" },
    emoji: "🗼",
    upright: {
      zh: "TA愿意为这段关系暂停自我，牺牲是TA无声的爱的表达。",
      en: "They're literally pausing their whole world for this, babe. That's not nothing — that's a whole love language right there.",
      fr: "Iel met littéralement son monde entier sur pause pour ça. Ça compte — c'est tout un langage d'amour. 🪐",
      es: "Literalmente están pausando su mundo entero por esto, linda. Eso no es cualquier cosa — eso es todo un lenguaje de amor. 💖",
      th: "การเปลี่ยนแปลงครั้งใหญ่และการเริ่มต้นใหม่",
      vi: "Người Bị Treo Ngược là biểu tượng của sự hy sinh có ý nghĩa và góc nhìn hoàn toàn mới, báo hiệu rằng người kia đang sẵn sàng tạm dừng để nhìn nhận lại mối quan hệ từ một góc độ sâu sắc hơn. Đây là biểu tượng của sự trưởng thành thông qua việc buông bỏ những gì đã cũ, mở ra cánh cửa cho một chương mới đầy triển vọng."
    },
    reversed: {
      zh: "TA在关系里感到困住，或正在用受害者心态逃避责任，需要换位思考。",
      en: "They might feel a bit stuck in their own story, babe. A little perspective shift — yours or theirs — could be the whole unlock.",
      fr: "Iel se sent peut-être coincé·e dans sa propre histoire. Un petit changement de perspective — le tien ou le sien — pourrait tout déclencher. 👁️",
      es: "Se sienten un poquito atrapados en su propia historia, linda. Un pequeño cambio de perspectiva — tuyo o de ellxs — podría ser la clave. 💫",
      th: "การแขวนที่ยังไม่สมบูรณ์ — ความลนลานคือสัญญาณว่าหัวใจยังใส่ใจ จงใช้ช่วงนี้เรียนรู้ตัวเอง",
      vi: "Chiều ngược của Người Bị Treo Ngược cho thấy sự trì trệ trong tư duy đang khiến người kia không thể tiến về phía trước, cảm giác bị treo lơ lửng giữa các quyết định. Hãy giúp họ tìm lại sự cân bằng bằng cách cung cấp một góc nhìn mới mẻ, bởi đôi khi chỉ cần một cú huých nhỏ để tháo gỡ toàn bộ bế tắc."
    }
  },
  {
    id: 13,
    name: { zh: "死神", en: "Death", fr: "La Mort", es: "La Muerte", th: "ความตาย", vi: "Cái Chết" },
    emoji: "💀",
    upright: {
      zh: "旧的模式正在消解，你们的关系在经历必要的死亡后会更加强大。",
      en: "Something old is making room for something new, babe. It feels intense in the moment — but what's coming is genuinely stronger.",
      fr: "Quelque chose d'ancien fait de la place pour du nouveau. C'est intense sur le moment — mais ce qui vient est réellement plus fort. 🪐",
      es: "Algo viejo está haciendo lugar para algo nuevo, linda. Se siente intenso en el momento — pero lo que viene es genuinamente más fuerte. 💖",
      th: "การเปลี่ยนแปลงและการหลุดพ้น",
      vi: "Cái Chết không phải là sự kết thúc mà là sự chuyển đổi đầy quyền năng, báo hiệu rằng một chương cũ đang khép lại để nhường chỗ cho điều mới mẻ trong tình yêu. Đây là biểu tượng của sự giải thoát khỏi những gánh nặng đã cũ, nơi mà sự chấp niệm tan biến để nhường chỗ cho tình yêu thanh tẩy hơn. Hãy can đảm đón nhận sự chuyển mình này."
    },
    reversed: {
      zh: "你们害怕改变，但抗拒只会让痛苦延长，接受才能真正前进。",
      en: "Holding onto what was is human, babe — but resisting only stretches the pain. Letting the old chapter close is how the new one begins.",
      fr: "S'accrocher à ce qui était, c'est humain — mais résister ne fait qu'étirer la douleur. Laisser le vieux chapitre se fermer, c'est comme le nouveau commence. 👁️",
      es: "Agarrarse a lo que fue es humano, linda — pero resistir solo estira el dolor. Dejar que el capítulo viejo se cierre es cómo empieza el nuevo. 💫",
      th: "ไม่มีความตายที่ไม่นำไปสู่การเกิดใหม่ — การเปลี่ยนแปลงน่ากลัวเสมอ แต่มันคือทางของจักรวาล",
      vi: "Chiều ngược của Cái Chết báo hiệu nỗi sợ thay đổi và sự bám víu vào những gì đã qua đang trói buộc tâm trí, có thể khiến mối quan hệ đứng yên tại chỗ. Hãy dịu dàng buông bỏ những gì không còn phục vụ cho sự phát triển của tình yêu, bởi chỉ khi dám buông bỏ, hai bạn mới có thể đón nhận những điều tốt đẹp hơn."
    }
  },
  {
    id: 14,
    name: { zh: "节制", en: "Temperance", fr: "La Tempérance", es: "La Templanza", th: "การสมดุล", vi: "Sự Cân Bằng" },
    emoji: "⚖️",
    upright: {
      zh: "TA在关系中扮演调节者的角色，TA在寻找你们之间的平衡点。",
      en: "They're actively looking for the sweet spot between you two, babe. Balance is what they're chasing — and honestly, they need you in it.",
      fr: "Iel cherche activement le point juste entre vous deux. L'équilibre, c'est ce qu'iel poursuit — et honestly, iel a besoin de toi pour y arriver. 🪐",
      es: "Están buscando activamente el punto justo entre ustedes dos, linda. El equilibrio es lo que persiguen — y honestamente te necesitan para lograrlo. 💖",
      th: "การรอคอยการเปลี่ยนแปลง",
      vi: "Sự Cân Bằng tượng trưng cho sự điều hòa hoàn hảo giữa các yếu tố đối lập, báo hiệu rằng người kia đang tìm kiếm sự hài hòa trong mối quan hệ một cách đầy kiên nhẫn. Đây là biểu tượng của sự kiên nhẫn và điều tiết, nơi mà mọi sự thiếu cân bằng đều được chữa lành từ từ. Hãy cùng nhau tìm lại nhịp thở chung cho tình yêu."
    },
    reversed: {
      zh: "TA在走极端，要么给太多要么收太少，关系的天平需要校准。",
      en: "They're going a little extreme — either pouring in too much or pulling back too hard. The scale just needs a gentle recalibration, babe.",
      fr: "Iel part un peu dans les extrêmes — soit trop d'investissement, soit trop de recul. L'équilibre a juste besoin d'un petit réajustement doux. 👁️",
      es: "Se van a los extremos — o meten demasiado o se guardan demasiado. La balanza solo necesita un pequeño reacomodo gentil, linda. 💫",
      th: "โซ่ที่พร้อมจะหลุด — เค้าอาจรู้สึกติดอยู่ แต่การหลุดพ้นเริ่มจากการมองออกไปนอกกรอบ",
      vi: "Khi Sự Cân Bằng xuất hiện ngược, sự xung đột nội tâm đang diễn ra mạnh mẽ, có thể khiến người kia đưa ra những quyết định khó khăn liên quan đến mối quan hệ. Hãy kiên nhẫn đồng hành trong giai đoạn khó khăn này, bởi sự cân bằng thực sự chỉ đến sau khi đã trải qua những biến động cần thiết."
    }
  },
  {
    id: 15,
    name: { zh: "恶魔", en: "The Devil", fr: "Le Diable", es: "El Diablo", th: "ปีศาจ", vi: "Con Quỷ" },
    emoji: "⛓️",
    upright: {
      zh: "TA感到被某种执念束缚，可能是物质，可能是旧习惯，这需要被正视。",
      en: "Something's got a tighter grip than it should, babe. It might be something material, or a habit — either way, naming it is the first move.",
      fr: "Quelque chose a une prise plus forte qu'il ne devrait. Ça peut être du matériel, ou une habitude — dans tous les cas, le nommer, c'est la première étape. 🪐",
      es: "Algo tiene un agarre más fuerte de lo que debería, linda. Puede ser algo material, o un hábito — en cualquier caso, nombrarlo es el primer paso. 💖",
      th: "การพังทลายอย่างกะทันหัน",
      vi: "Con Quỷ tượng trưng cho những xiềng xích tâm lý đang trói buộc tâm trí, báo hiệu rằng người kia có thể đang bị những ràng buộc vô hình giam cầm trong mối quan hệ. Đây là biểu tượng của những cám dỗ và thói quen không lành mạnh cần được nhận diện và giải phóng, để tình yêu được trở về với sự tự do nguyên sơ."
    },
    reversed: {
      zh: "你们之间存在某种隐蔽的依赖关系，健康的界限感是破局的关键。",
      en: "There's a little dependency loop between you two, babe. Healthy boundaries here aren't walls — they're actually the most loving thing you can build.",
      fr: "I y a une petite boucle de dépendance entre vous. Des frontières saines ici, ce sont pas des murs — c'est vraiment la chose la plus aimante que vous puissiez construire. 👁️",
      es: "Hay un pequeño ciclo de dependencia entre ustedes dos, linda. Límites saludables no son muros — son lo más amoroso que pueden construir. 💫",
      th: "ซากปรักหักพังที่พร้อมสร้างใหม่ — ความพังทลายคือการเคลียร์พื้นที่ให้สิ่งที่ดีกว่าเข้ามา",
      vi: "Chiều ngược của Con Quỷ báo hiệu sự sụp đổ của những xiềng xích tâm lý và sự mất niềm tin, có thể khiến mối quan hệ đối mặt với những thử thách nghiêm trọng. Hãy cùng nhau xây dựng lại sự tin tưởng bằng sự chân thành và minh bạch, bởi đôi khi sự sụp đổ chính là nền móng cho sự tái thiết kiên cố hơn."
    }
  },
  {
    id: 16,
    name: { zh: "塔", en: "The Tower", fr: "La Maison-Dieu", es: "La Torre", th: "หอคอย", vi: "Tháp" },
    emoji: "🗼",
    upright: {
      zh: "突然的震动正在瓦解虚假的根基，真正的连接才会显现。",
      en: "A sudden shake just took down some fake foundations, babe. What looks like chaos? It's actually the universe clearing the path for what's real.",
      fr: "Une secousse soudaine vient d'abattre de fausses fondations. Ce qui ressemble à du chaos ? C'est en fait l'univers qui dégage le chemin pour ce qui est vrai. 🪐",
      es: "Un sacudón repentino acaba de tirar abajo falsas bases, linda. ¿Lo que parece caos? Es el universo despejando el camino para lo real. 💖",
      th: "ความหวังและการรักษาบาดแผล",
      vi: "Tháp mang đến thông điệp về sự sụp đổ bất ngờ nhưng cần thiết, báo hiệu rằng những nền tảng không vững chắc đang được phơi bày để tình yêu thực sự có cơ hội xây dựng lại. Đây là biểu tượng của sự giải phóng qua đau thương, nơi mà sau cơn mưa tốt trời sẽ trở nên trong xanh hơn. Hãy tin rằng mọi sự sụp đổ đều đang dọn đường cho sự tái thiết."
    },
    reversed: {
      zh: "危机带来的伤痛需要时间愈合，TA正在重新评估这段关系的价值。",
      en: "The fallout is real and it needs space to heal, babe. They're quietly re-assessing what matters — give them that room without pressure.",
      fr: "Les dégâts sont réels et ont besoin d'espace pour guérir. Iel réassigne discrètement ce qui compte — laisse-lui cet espace sans pression. 👁️",
      es: "El impacto es real y necesita espacio para sanar, linda. Están reevaluando silenciosamente qué importa — déjalos sin presión. 💫",
      th: "ดวงดาวที่ซ่อนอยู่หลังเมฆ — แม้ท้องฟ้ามืดลง ดวงดาวไม่เคยหายไป มันเพียงถูกบดบังชั่วคราว",
      vi: "Khi Tháp xuất hiện ngược, sự bối rối và sợ hãi đang bao trùm tâm trí khiến mối quan hệ gặp khó khăn trong việc tìm lại sự cân bằng. Hãy dành thời gian để chữa lành thay vì vội vàng phán xét, bởi đôi khi sự bình yên chỉ đến sau khi đã trải qua những cơn bão cần thiết."
    }
  },
  {
    id: 17,
    name: { zh: "星星", en: "The Star", fr: "L'Etoile", es: "La Estrella", th: "ดาว", vi: "Sao" },
    emoji: "⭐",
    upright: {
      zh: "TA带来了疗愈和希望，你们的关系正在经历一场温柔的重生。",
      en: "They bring this gentle healing energy wherever they go, babe. Your connection is genuinely in a season of soft rebirth right now.",
      fr: "Iel apporte cette énergie de guérison douce où qu'iel aille. Votre connexion est sincèrement en pleine saison de renaissance douce. 🪐",
      es: "Traen esta energía de sanación gentil por donde van, linda. Su conexión está genuinamente en una temporada de suave renacimiento. 💖",
      th: "ความสุขและความสำเร็จ",
      vi: "Sao là biểu tượng của hy vọng và sự hồi sinh rực rỡ, báo hiệu rằng tình yêu của hai bạn đang trải qua giai đoạn hồi phục và tìm lại ánh sáng sau những ngày u ám. Đây là biểu tượng của sự hồi sinh cảm xúc, nơi mà những vết thương được chữa lành và tâm hồn tìm lại sự bình yên. Hãy để năng lượng tươi mát của lá bài này nuôi dưỡng tình yêu của hai bạn."
    },
    reversed: {
      zh: "TA给予了太多而忘记了自己，关系的能量需要重新平衡。",
      en: "They've been giving a lot — maybe too much — and forgot to fill their own cup, babe. A little energetic rebalancing would do everyone good.",
      fr: "Iel a beaucoup donné — peut-être trop — et a oublié de remplir son propre verre. Un petit rééquilibrage énergétique ferait du bien à tout le monde. 👁️",
      es: "Han dado mucho — quizás demasiado — y olvidaron llenarse su propio vaso, linda. Un poco de reequilibrio energético le haría bien a todos. 💫",
      th: "หมอกที่เริ่มจางลง — ความเข้าใจผิดบางครั้งเกิดจากความรู้สึกที่ไม่ชัด ค่อยๆ ลงหลัก",
      vi: "Chiều ngược của Sao báo hiệu sự dao động cảm xúc và ảo tưởng đang khiến người kia mất phương hướng, có thể có những kỳ vọng không thực tế cần được điều chỉnh. Hãy giúp nhau trở về với thực tế và tập trung vào những điều cơ bản, bởi ánh sáng chân thật không đến từ ảo tưởng mà từ sự gần gũi đích thực."
    }
  },
  {
    id: 18,
    name: { zh: "月亮", en: "The Moon", fr: "La Lune", es: "La Luna", th: "ดวงจันทร์", vi: "Mặt Trăng" },
    emoji: "🌙",
    upright: {
      zh: "TA需要你用耐心穿透迷雾，那些TA不愿说出口的恐惧正困扰着TA。",
      en: "The fog is thick right now, babe. What they're not saying? It's probably weighing on them more than you'd think. Patient love cuts through.",
      fr: "Le brouillard est épais en ce moment. Ce qu'iel ne dit pas ? Ça pèse probablement sur ellxs plus qu'on ne croit. L'amour patient traverse tout. 🪐",
      es: "La niebla está gruesa ahora, linda. ¿Lo que no están diciendo? Probablemente les pesa más de lo que pensás. El amor paciente atraviesa todo. 💖",
      th: "การฟื้นฟูและการเริ่มต้นใหม่",
      vi: "Mặt Trăng mang đến thông điệp về sự hồi sinh và khởi đầu mới đầy bí ẩn, báo hiệu rằng người kia đang trải qua giai đoạn chuyển đổi nội tâm sâu sắc. Đây là biểu tượng của trực giác và cảm xúc thầm kín, nơi mà những bí mật bên trong đang dần hé lộ trong ánh trăng mờ ảo. Hãy để tâm trí bình yên để đón nhận những thông điệp từ vô thức."
    },
    reversed: {
      zh: "TA可能被幻觉和不安所误导，你们需要更坦诚的对话来消除误会。",
      en: "Illusions and anxiety might be clouding the picture, babe. What helps? Honest conversation — the messy kind that's actually real.",
      fr: "Illusions et anxiété pourraient brouiller le tableau. Ce qui aide ? La conversation honnête — celle qui est un peu désordonnée mais vraiment réelle. 👁️",
      es: "Ilusiones y ansiedad pueden estar nublando el panorama, linda. ¿Qué ayuda? Conversación honesta — de la desordenada pero genuinamente real. 💫",
      th: "แสงแดดที่ยังคงส่อง — ความอับอายเป็นเมฆบัง ไม่ใช่การดับ ให้เวลากับการรับแสงใหม่",
      vi: "Chiều ngược của Mặt Trăng báo hiệu cảm giác xấu hổ và thiếu tự tin đang ảnh hưởng đến tâm trạng và cách người kia thể hiện tình cảm. Hãy giúp họ nhận ra rằng vẻ đẹp thực sự không nằm ở sự hoàn hảo mà ở sự chân thành, để ánh trăng lại được chiếu sáng trong tâm hồn hai bạn."
    }
  },
  {
    id: 19,
    name: { zh: "太阳", en: "The Sun", fr: "Le Soleil", es: "El Sol", th: "ดวงอาทิตย์", vi: "Mặt Trời" },
    emoji: "☀️",
    upright: {
      zh: "TA对你的爱没有任何杂质，和你在一起TA感到无比快乐，这是天作之合。",
      en: "Pure sunlight, babe. Their love for you has zero hidden agenda — it's bright, clean, and all in. This is the real deal.",
      fr: "Plein soleil. Leur amour pour toi n'a aucune arrière-pensée — c'est lumineux, clean, et à fond. C'est ça, le truc vrai. 🪐",
      es: "Sol puro, linda. Su amor por vos no tiene ninguna agenda oculta — es brillante, limpio y todo puesto. Esto es lo real. 💖",
      th: "ความสุขและความสำเร็จ",
      vi: "Mặt Trời là biểu tượng tuyệt đối của niềm vui thuần khiết và thành công trong tình yêu, báo hiệu rằng mối quan hệ này đang tỏa sáng rực rỡ như ánh ban mai. Đây là sự hạnh phúc đích thực đến từ sự kết nối chân thành, nơi mà niềm vui không pha trộn bất kỳ tạp chất nào. Hãy tận hưởng ánh nắng ấm áp này và giữ gìn sự trong sáng của tình yêu."
    },
    reversed: {
      zh: "虽然依旧有爱，但光芒有些黯淡。TA可能有些骄傲或自我中心，缺乏最初的新鲜感。",
      en: "The light is still there, babe — but a little dimmer. A hint of pride or self-absorption might be creeping in. Time to reconnect with the original spark.",
      fr: "La lumière est toujours là — mais un peu plus terne. Une pointe de fierté ou d'autoabsorption pourrait s'infiltrer. Il est temps de se reconnecter à l'étincelle initiale. 👁️",
      es: "La luz sigue ahí, linda — pero un poquito más tenue. Un poquito de orgullo o autoabsorción puede estar colándose. Es hora de reconectarse con la chispa original. 💫",
      th: "แสงแดดที่ยังคงส่อง — ความอับอายเป็นเมฆบัง ไม่ใช่การดับ ให้เวลากับการรับแสงใหม่",
      vi: "Chiều ngược của Mặt Trời báo hiệu cảm giác xấu hổ và thiếu tự tin đang làm lu mờ ánh sáng tình yêu, có thể có sự kiêu hãnh hoặc tự ti đang ảnh hưởng đến mối quan hệ. Hãy nhắc nhở nhau rằng ánh sáng thực sự đến từ sự chân thành, không phải từ sự hoàn hảo, để mặt trời lại được chiếu sáng đầy đủ."
    }
  },
  {
    id: 20,
    name: { zh: "审判", en: "Judgement", fr: "Le Jugement", es: "El Juicio", th: "การพิพากษา", vi: "Sự Phán Xét" },
    emoji: "🔔",
    upright: {
      zh: "TA在这段关系里看到了自己的成长，你们的关系正在经历灵魂层面的觉醒。",
      en: "They're looking at your connection and seeing how much they've grown because of it, babe. This is soulmate-level recognition right here.",
      fr: "Iel regarde votre connexion et voit à quel point iel a grandi grâce à elle. C'est de la reconnaissance niveau âme sœur. 🪐",
      es: "Están mirando su conexión y viendo cuánto han crecido gracias a ella, linda. Esto es reconocimiento de nivel alma gemela. 💖",
      th: "ความสมบูรณ์และความสำเร็จ",
      vi: "Sự Phán Xét đại diện cho sự trưởng thành tâm linh và sự hàn gắn, báo hiệu rằng người kia đang trải qua quá trình nhận thức lại bản thân và mối quan hệ từ góc độ sâu sắc hơn. Đây là biểu tượng của sự thức tỉnh, nơi mà quá khứ được phán xét công minh để mở đường cho tương lai tươi sáng hơn. Hãy đón nhận sự thức tỉnh này với tâm hồn rộng mở."
    },
    reversed: {
      zh: "TA在等待某个信号或事件来做重大决定，你需要给TA时间。",
      en: "They're quietly waiting for something — a sign, a feeling, a moment. This one needs time, babe. Don't rush what wants to arrive naturally.",
      fr: "Iel attend silencieusement quelque chose — un signe, un ressenti, un moment. Celui-ci a besoin de temps. Ne force pas ce qui veut arriver naturellement. 👁️",
      es: "Están esperando algo tranquilamente — un signo, un feeling, un momento. Este necesita tiempo, linda. No apures lo que quiere llegar naturalmente. 💫",
      th: "เสียงเรียกที่ยังไม่ได้ยิน — บางครั้งเราตัดสินตัวเองรุนแรงเกินไป จงให้อภัยกับตัวเอง",
      vi: "Khi Sự Phán Xét xuất hiện ngược, sự tự trách và tự phán xét bản thân quá nghiêm khắc đang ảnh hưởng đến quyết định và cảm xúc, có thể khiến người kia chìm trong những suy nghĩ tiêu cực. Hãy giúp họ buông bỏ gánh nặng tự phán xét và tin vào giá trị đích thực của bản thân, bởi sự tha thứ chính là ánh sáng phán xét công minh nhất."
    }
  },
  {
    id: 21,
    name: { zh: "世界", en: "The World", fr: "Le Monde", es: "El Mundo", th: "โลก", vi: "Thế Giới" },
    emoji: "🌍",
    upright: {
      zh: "你们的关系已经完成了一个完整的循环，这是圆满和成功的标志。",
      en: "A full circle just closed — and babe, that's beautiful. This is the kind of completion that opens the door to something even more satisfying.",
      fr: "Un cercle complet vient de se fermer — et c'est beau. C'est le genre de complétude qui ouvre la porte à quelque chose d'encore plus satisfaisant. 🪐",
      es: "Un círculo completo acaba de cerrarse — y eso es hermoso, linda. Este tipo de completitud abre la puerta a algo aún más satisfactorio. 💖",
      th: "พระเจ้าและมนุษย์",
      vi: "Thế Giới là biểu tượng của sự viên mãn và hoàn chỉnh tuyệt đối, báo hiệu rằng tình yêu của hai bạn đã hoàn thành một chu kỳ đầy ý nghĩa và đang mở ra một chương mới đầy triển vọng. Đây là sự hài hòa toàn diện trong mối quan hệ, nơi mà tâm hồn hai bạn đã hòa quyện thành một thể thống nhất. Hãy trân trọng khoảnh khắc thiêng liêng này."
    },
    reversed: {
      zh: "TA暂时感到满足但缺乏新的方向，你们需要共同设定新的目标来保持活力。",
      en: "They feel settled but maybe a little restless for what's next, babe. Setting a new shared goal together? That's how you keep the spark alive.",
      fr: "Iel se sent apaisé·e mais peut-être un peu agité·e pour la suite. Se fixer un nouvel objectif ensemble ? C'est comme ça que l'étincelle reste vive. 👁️",
      es: "Se sienten tranquilos pero quizás un poquito inquietos por lo que sigue, linda. ¿Fijarse una nueva meta compartida? Así es como la chispa se mantiene viva. 💫",
      th: "วงจรที่เกือบเ�闭环แต่ยังไม่สมบูรณ์ — ความรู้สึกว่าขาดอะไรบางอย่างคือสัญญาณว่าคุณใกล้จะสมบูรณ์แล้ว",
      vi: "Chiều ngược của Thế Giới báo hiệu cảm giác không thuộc về và mất cân bằng trong mối quan hệ, có thể có cảm giác thiếu một mục tiêu chung rõ ràng khiến tình yêu dần mất đi động lực. Hãy cùng nhau xác định lại hướng đi và thiết lập những mục tiêu mới, để vòng tròn tình yêu lại được khép lại đầy đủ ý nghĩa."
    }
  }
];

export { MAJOR_ARCANA };