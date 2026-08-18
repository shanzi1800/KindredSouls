// Deterministic tarot card from birthdays + today (22 Major Arcana)
type L = Record<string, string>;

export interface TarotCard {
  id: number;
  name: string;
  meaning: string;
  emoji: string;
  orientation: string; // e.g. " (Ngược)" for Vietnamese reversed
}

const CARDS: { id: number; emoji: string; name: L; meaning: L }[] = [
  {id:0, emoji:'🌟', name:{zh:'愚人',en:'The Fool',es:'El Loco',fr:'Le Fou',th:'คนโง่ประหลาด',vi:'Chàng Khờ'}, meaning:{
    zh:'踏上未知旅程的勇气，新可能的开启。在感情中，这意味着愿意为爱冒险、放下算计、凭直觉前行。逆位时，这张牌提醒你：莫让恐惧浇灭心中那团无畏之火，真正的亲密需要一颗赤子之心。',
    en:'The courage to embark on an unknown journey — new possibilities await.',
    es:'El valor para emprender un viaje desconocido — nuevas posibilidades le esperan.',
    fr:'Le courage de partir vers l\'inconnu — de nouvelles possibilités vous attendent.',
    th:'ความกล้าที่จะเริ่มต้นการเดินทางแห่งความลึกลับ — โอกาสใหม่รอคุณอยู่',
    vi:'Can đảm bước vào hành trình chưa biết — những khả năng mới đang chờ đợi bạn. Đây là lời nhắc nhở rằng đôi khi trong tình yêu, ta cần buông bỏ những tính toán và tin vào trực giác của trái tim. Nếu lá bài xuất hiện ngược, hãy cẩn thận với sự hấp tấp hoặc thiếu chín chắn, nhưng đừng để nỗi sợ làm mất đi sự ngây thơ và can đảm trong yêu thương.'
  }},
  {id:1, emoji:'🔮', name:{zh:'魔术师',en:'The Magician',es:'El Mago',fr:'Le Bateleur',th:'นักมายกล',vi:'Nhà Ảo Thuật'}, meaning:{
    zh:'意志与行动力觉醒，创造显化的时刻。你的感情中出现这张牌，暗示着将心意化为现实的力量正在苏醒——你们有能力将关系塑造成心中所愿。逆位时，提醒你勿让才华沉睡，敢于行动才是破解困局的关键。',
    en:'Manifestation and creation — willpower awakened into action.',
    es:'Manifestación y creación — la fuerza de voluntad se despierta en acción.',
    fr:'Manifestation et création — la volonté s\'éveille en action.',
    th:'การสร้างสรรค์และการแสดงออก — พลังจิตตื่นขึ้นสู่การลงมือ',
    vi:'Hiện thực hóa và sáng tạo — ý chí thức tỉnh thành hành động. Trong tình yêu, lá bài này cho thấy bạn có khả năng biến ước mơ thành hiện thực. Hãy dùng sự sáng tạo và ý chí mạnh mẽ để kiến tạo mối quan hệ như mong muốn. Nếu xuất hiện ngược, hãy chú ý đến sự do dự hoặc thiếu tập trung, đừng để tiềm năng của bạn bị lãng phí.'
  }},
  {id:2, emoji:'🌙', name:{zh:'女祭司',en:'The High Priestess',es:'La Sacerdotisa',fr:'La Papesse',th:'นางพราหมณี',vi:'Nữ Đại Tư Tế'}, meaning:{
    zh:'直觉与秘密，等待揭晓的答案。这张牌暗示你的感情正处于一个需要信任直觉的阶段——有些事情尚未显现，但答案早已存在于内心深处。逆位时，提醒你倾听内心的声音，勿被表象所迷惑，真相需要时间慢慢浮出水面。',
    en:'Intuition and mystery — the answer waits to be revealed.',
    es:'Intuición y misterio — la respuesta espera ser revelada.',
    fr:'Intuition et mystère — la réponse attend d\'être révélée.',
    th:'สัญชาตญาณและความลับ — คำตอบรอให้ถูกเปิดเผย',
    vi:'Trực giác và bí ẩn — câu trả lời đang chờ được bật mí. Trong tình yêu, lá bài này cho thấy mối quan hệ của bạn đang ở giai đoạn cần sự thấu hiểu sâu sắc hơn. Đôi khi cần lắng nghe trực giác thay vì vội vàng kết luận. Nếu xuất hiện ngược, hãy cẩn thận với những bí mật hoặc sự thiếu minh bạch giữa hai người.'
  }},
  {id:3, emoji:'🌺', name:{zh:'女皇',en:'The Empress',es:'La Emperatriz',fr:'L\'Impératrice',th:'จักรพรรดินี',vi:'Nữ Hoàng'}, meaning:{
    zh:'丰盛与滋养，爱的温柔绽放。在感情中，这张牌象征着被爱环绕、安全感十足的状态——你们的关系正在经历一个自然的生长与绽放阶段。逆位时，提醒你关注自己的情感需求，勿忘自我滋养，只有先学会爱自己，才能更好地爱对方。',
    en:'Abundance and nurturing — love blooms gently.',
    es:'Abundancia y cuidado — el amor florece suavemente.',
    fr:'Abondance et tendresse — l\'amour fleurit doucement.',
    th:'ความอุดมสมบูรณ์และการเอื้ออาทร — ความรักเบ่งบานอย่างอ่อนโยน',
    vi:'Phồn vinh và nuôi dưỡng — tình yêu nở rộ nhẹ nhàng. Đây là thời kỳ mà mối quan hệ của bạn đang được nuôi dưỡng bởi sự chăm sóc và yêu thương. Cả hai người đều cảm thấy được bảo vệ và an toàn bên nhau. Nếu xuất hiện ngược, hãy chú ý đến sự mất cân bằng trong việc cho và nhận, có thể một người đang cho quá nhiều mà quên đi bản thân.'
  }},
  {id:4, emoji:'👑', name:{zh:'皇帝',en:'The Emperor',es:'El Emperador',fr:'L\'Empereur',th:'จักรพรรดิ',vi:'Hoàng Đế'}, meaning:{
    zh:'秩序与守护，稳稳托住的力量。这张牌在感情中出现，意味着你们的关系需要一份沉稳与可靠——它意味着责任、边界与可依赖的承诺。逆位时，提醒你检视关系中是否有控制欲过强或缺乏沟通的问题，健康的关系需要柔软与坚定并存。',
    en:'Order and protection — a steady, grounding force.',
    es:'Orden y protección — una fuerza firme y estable.',
    fr:'Ordre et protection — une force stable et rassurante.',
    th:'ความเป็นระเบียบและการปกป้อง — พลังที่มั่นคง',
    vi:'Trật tự và bảo vệ — một sức mạnh vững chãi. Trong tình yêu, lá bài này nhắc nhở về tầm quan trọng của sự ổn định và tin cậy. Bạn đang cần hoặc đang xây dựng một nền tảng vững chắc cho mối quan hệ. Nếu xuất hiện ngược, hãy chú ý đến sự cứng rắn thái quá hoặc thiếu sự linh hoạt trong cách thể hiện tình yêu.'
  }},
  {id:5, emoji:'⛪', name:{zh:'教皇',en:'The Hierophant',es:'El Sumo Sacerdote',fr:'Le Pape',th:'ประมุขสงฆ์',vi:'Giáo Hoàng'}, meaning:{
    zh:'指引与信念，灵魂层面的契合。这张牌暗示你们的感情建立在共同的价值观与精神追求之上——这是超越表面的深层连接，需要双方共同成长。逆位时，提醒你反思是否有盲从外界标准而忽视内心真实声音的情况，真正的契合来自灵魂而非形式。',
    en:'Guidance and faith — souls aligned on a deeper level.',
    es:'Guía y fe — las almas se alinean en un nivel más profundo.',
    fr:'Guidance et foi — les âmes s\'alignent au plus profond.',
    th:'การชี้นำและความศรัทธา — วิญญาณเชื่อมโยงกันในระดับลึก',
    vi:'Dẫn dắt và niềm tin — tâm hồn kết nối ở tầng sâu hơn. Đây là lá bài về sự kết nối tâm linh và giá trị chung giữa hai người. Nếu xuất hiện ngược, hãy xem xét lại những kỳ vọng hoặc niềm tin đang ảnh hưởng đến mối quan hệ của bạn, có thể đã đến lúc phá vỡ những khuôn mẫu cũ và tìm kiếm sự thật cá nhân.'
  }},
  {id:6, emoji:'💕', name:{zh:'恋人',en:'The Lovers',es:'Los Enamorados',fr:'Les Amoureux',th:'คู่รัก',vi:'Tình Nhân'}, meaning:{
    zh:'抉择与诱惑，关系来到十字路口。这张牌直指感情中最关键的选择时刻——它意味着你正面临一个将深刻影响关系走向的决策，需要忠于内心。逆位时，提醒你莫因一时诱惑偏离本心，真爱往往需要穿越迷雾才能看清，对话与诚实是此刻最重要的功课。',
    en:'A crossroads of choice — your relationship faces a pivotal decision.',
    es:'Una encrucijada de elección — su relación enfrenta una decisión crucial.',
    fr:'Un carrefour de choix — votre relation fait face à une décision cruciale.',
    th:'ทางแยกแห่งการเลือก — ความสัมพันธ์ของคุณเผชิญการตัดสินใจสำคัญ',
    vi:'Ngã tư của sự lựa chọn — mối quan hệ đối mặt với quyết định quan trọng. Đây là khoảnh khắc để nhìn sâu vào bản chất của mối quan hệ và chọn con đường phù hợp nhất. Việc này đòi hỏi sự trung thực với bản thân và đối phương. Nếu xuất hiện ngược, hãy cẩn thận với những quyết định vội vàng hoặc thiếu suy nghĩ, đừng để ngoại cảnh chi phối trái tim.'
  }},
  {id:7, emoji:'🏛️', name:{zh:'战车',en:'The Chariot',es:'El Carro',fr:'Le Chariot',th:'รถศึก',vi:'Cỗ Xe Chiến Thắng'}, meaning:{
    zh:'意志与征服，携手跨越障碍。这张牌象征着坚定的决心与胜利——你们的感情正经历一个需要共同努力跨越挑战的阶段，唯有同舟共济方能抵达彼岸。逆位时，暗示可能存在方向不一致或动力分散的问题，沟通彼此的目标与愿景是破解之道。',
    en:'Willpower and triumph — overcoming obstacles together.',
    es:'Fuerza de voluntad y triunfo — superando obstáculos juntos.',
    fr:'Volonté et triomphe — surmonter les obstacles ensemble.',
    th:'พลังจิตและชัยชนะ — เอาชนะอุปสรรคไปด้วยกัน',
    vi:'Ý chí và thắng lợi — vượt qua chướng ngại cùng nhau. Trong tình yêu, đây là lá bài của sự quyết tâm và ý chí vượt khó. Cả hai người đang cùng nhau hướng tới một mục tiêu chung và có đủ nghị lực để vượt qua mọi trở ngại. Nếu xuất hiện ngược, hãy kiểm tra lại xem hai người có đang cùng hướng không, hoặc có đang để ngoại cảnh cản trở con đường của nhau.'
  }},
  {id:8, emoji:'💪', name:{zh:'力量',en:'The Strength',es:'La Fuerza',fr:'La Force',th:'พละกำลัง',vi:'Sức Mạnh'}, meaning:{
    zh:'内在勇气，柔韧却不可战胜。这张牌在感情中的出现，是对你内心力量的肯定——真正的强大不是坚硬如铁，而是以温柔与耐心化解冲突、以韧性守护关系。逆位时，提醒你可能忽略了内在的声音或压抑了真实感受，柔弱胜刚强，学会示弱是一种更高的勇气。',
    en:'Inner courage — gentle yet invincible.',
    es:'Coraje interior — suave pero invencible.',
    fr:'Courage intérieur — doux mais invincible.',
    th:'ความกล้าภายใน — อ่อนโยนแต่ไร้พ่าย',
    vi:'Can đảm bên trong — dịu dàng nhưng bất khả chiến bại. Trong tình yêu, lá bài này tượng trưng cho sức mạnh của sự kiên nhẫn, lòng trắc ẩn và sự dịu dàng đầy quyền năng. Hãy để tình yêu được nuôi dưỡng bởi sự thấu hiểu thay vì sự cứng rắn. Nếu xuất hiện ngược, hãy chú ý đến những cảm xúc bị kìm nén hoặc thiếu kiên nhẫn trong mối quan hệ.'
  }},
  {id:9, emoji:'🕯️', name:{zh:'隐士',en:'The Hermit',es:'El Ermitaño',fr:'L\'Ermite',th:'นักบวชเรี่ยมใจ',vi:'Ẩn Sĩ'}, meaning:{
    zh:'独处与内观，答案在内心深处。这张牌在感情中出现，不是分离的征兆，而是提醒你们需要个人空间去思考、成长与自我整合——真正的亲密需要先与自我和解。逆位时，暗示可能过度封闭或逃避关系中的问题，有时独自行走是为了更好地相遇。',
    en:'Solitude and introspection — the answer lies within.',
    es:'Soledad e introspección — la respuesta está dentro.',
    fr:'Solitude et introspection — la réponse est en vous.',
    th:'ความเงียบและการสำรวจภายใน — คำตอบอยู่ในใจ',
    vi:'Cô đơn và nội quan — câu trả lời nằm ở sâu bên trong. Trong tình yêu, lá bài này nhắc nhở rằng đôi khi cần không gian riêng để hiểu rõ bản thân hơn. Sự im lặng không phải là dấu hiệu của sự xa cách mà là nền tảng để hai tâm hồn gặp gỡ sâu hơn. Nếu xuất hiện ngược, hãy cẩn thận với sự cô lập quá mức hoặc tránh né sự gần gũi.'
  }},
  {id:10, emoji:'☸️', name:{zh:'命运之轮',en:'Wheel of Fortune',es:'Rueda de la Fortuna',fr:'Roue de Fortune',th:'วงล้อแห่งโชคชะตา',vi:'Bánh Xe Số Phận'}, meaning:{
    zh:'转变与循环，命运正在转动。这张牌带来宇宙级的信息：你们的关系正处于一个关键的转折点上，过去的积累正在转化为新的可能，幸运的天平正在向你们倾斜。逆位时，提醒你不要抗拒改变，命运之轮从不后退，接纳它才能顺势而为，乘风破浪。',
    en:'Transformation and cycles — destiny is turning in your favor.',
    es:'Transformación y ciclos — el destino gira a su favor.',
    fr:'Transformation et cycles — le destin tourne en votre faveur.',
    th:'การเปลี่ยนแปลงและวัฏจักร — โชคชะตากำลังหมุนเข้ามา',
    vi:'Biến đổi và chu kỳ — vận mệnh đang xoay chuyển đến với bạn. Trong tình yêu, lá bài này báo hiệu một bước ngoặt quan trọng đang đến. Vận may đang mỉm cười với cả hai người, những cánh cửa mới đang mở ra. Nếu xuất hiện ngược, hãy kiên nhẫn hơn — đây có thể chỉ là giai đoạn chờ đợi trước khi vận may thực sự đến.'
  }},
  {id:11, emoji:'⚖️', name:{zh:'正义',en:'Justice',es:'La Justicia',fr:'La Justice',th:'ความยุติธรรม',vi:'Công Lý'}, meaning:{
    zh:'因果与平衡，宇宙在精准回应。这张牌出现于感情中，是对你们关系公正性的审视——每一个选择都有回响，你的付出与收获终将趋于平衡。逆位时，提示你需要诚实地审视关系中是否存在失衡之处，唯有基于真相的和解才能带来持久的安宁。',
    en:'Cause and balance — the universe responds with precision.',
    es:'Causa y equilibrio — el universo responde con precisión.',
    fr:'Cause et équilibre — l\'univers répond avec précision.',
    th:'เหตุและสมดุล — จักรวาลตอบสนองอย่างแม่นยำ',
    vi:'Nhân quả và cân bằng — vũ trụ đáp trả chính xác. Trong tình yêu, lá bài này nhắc nhở về tầm quan trọng của sự trung thực và công bằng. Mọi hành động đều có hệ quả, và vũ trụ đang lắng nghe. Nếu xuất hiện ngược, hãy xem xét lại xem có sự mất cân bằng nào trong mối quan hệ cần được điều chỉnh, hoặc có sự thiếu trung thực cần được giải quyết.'
  }},
  {id:12, emoji:'🙃', name:{zh:'倒吊人',en:'The Hanged Man',es:'El Colgado',fr:'Le Pendu',th:'คนแขวนหัว',vi:'Kẻ Treo Ngược'}, meaning:{
    zh:'放下与臣服，另一种视角的智慧。这张牌的出现，是你与关系都需要换一种眼光审视的时刻——有时候暂停与臣服，比强行推进更能带来突破。逆位时，提醒你可能过于执着于某个结果，学会放下执念，反而能让答案自动浮现。',
    en:'Surrender and release — wisdom from a different perspective.',
    es:'Rendición y liberación — sabiduría desde otra perspectiva.',
    fr:'Lâcher-prise et abandon — sagesse d\'une autre perspective.',
    th:'การยอมแพ้และการปล่อยวาง — ภูมิปัญญาจากมุม nhìn khác',
    vi:'Buông bỏ và đầu hàng — sự khôn ngoan từ góc nhìn khác. Trong tình yêu, lá bài này nhắc nhở rằng đôi khi cần phải buông bỏ những gì đang kiểm soát và tin vào quá trình. Việc thay đổi góc nhìn có thể mở ra những điều bất ngờ. Nếu xuất hiện ngược, hãy cẩn thận với sự chống đối hoặc không chịu thay đổi, đây là lúc để học cách buông bỏ.'
  }},
  {id:13, emoji:'💀', name:{zh:'死神',en:'Death',es:'La Muerte',fr:'La Mort',th:'เจ้าแห่งความตาย',vi:'Cái Chết'}, meaning:{
    zh:'结束与蜕变，旧篇章的翻页。这张牌在感情中从不意味着真正的终结——它象征的是一种深刻的转化，一个阶段向另一个阶段的蜕变，旧有的模式正在被彻底更新。逆位时，提示你抗拒变化可能正在造成不必要的痛苦，拥抱结束才能迎来真正的新生。',
    en:'Endings and transformation — a new chapter begins.',
    es:'Finales y transformación — un nuevo capítulo comienza.',
    fr:'Fins et transformation — un nouveau chapitre commence.',
    th:'จุดจบและการเปลี่ยนแปลง — บทใหม่เริ่มต้น',
    vi:'Kết thúc và hoán chuyển — một chương mới bắt đầu. Trong tình yêu, lá bài này không phải là dấu hiệu của sự chia ly mà là biểu tượng của sự chuyển đổi sâu sắc. Một giai đoạn cũ đang kết thúc để nhường chỗ cho điều mới mẻ hơn. Nếu xuất hiện ngược, hãy cẩn thận với việc bám víu vào những gì đã lỗi thời, đôi khi cần dũng cảm để buông bỏ.'
  }},
  {id:14, emoji:'🦋', name:{zh:'节制',en:'Temperance',es:'La Templanza',fr:'Tempérance',th:'ความสมดุล',vi:'Chừng Mực'}, meaning:{
    zh:'平衡与调和，在两极间找到节奏。这张牌出现于感情中，暗示你们需要找到属于两人的节奏——在给予与接受、理性与感性、独立与亲密之间找到动态的平衡。逆位时，提示关系中某一方可能付出或索取过度，中庸之道才是持久之策。',
    en:'Balance and harmony — finding rhythm between opposites.',
    es:'Equilibrio y armonía — encontrando ritmo entre opuestos.',
    fr:'Équilibre et harmonie — trouver le rythme entre les contraires.',
    th:'สมดุลและความสามัคคี — หาจังหวะระหว่างสองขั้ว',
    vi:'Cân bằng và hài hòa — tìm thấy nhịp điệu giữa hai thái cực. Trong tình yêu, lá bài này nhắc nhở về sự điều độ và hài hòa. Hãy tìm nhịp chung giữa hai người, cân bằng giữa các thái cực khác nhau. Nếu xuất hiện ngược, hãy chú ý đến sự mất cân bằng hoặc thiếu điều độ nào đó trong cách bạn yêu thương.'
  }},
  {id:15, emoji:'🔗', name:{zh:'恶魔',en:'The Devil',es:'El Diablo',fr:'Le Diable',th:'ปีศาจ',vi:'Ác Quỷ'}, meaning:{
    zh:'束缚与执念，看见阴影才能超越。这张牌的出现是对关系中无形锁链的警示——它可能是恐惧、依赖、或是未解决的创伤在暗处牵制着你们。逆位时，意味着你们正在挣脱这些束缚，这过程虽然痛苦，但每一次对阴影的直视都是走向自由的关键一步。',
    en:'Bondage and attachment — face the shadow to transcend it.',
    es:'Atadura y apego — enfrente la sombra para trascenderla.',
    fr:'Attachement et obsession — affrontez l\'ombre pour la transcender.',
    th:'พันธนะและความยึดติด — เผชิญหน้ากับเงาเพื่อเลยล้ำ',
    vi:'Trói buộc và chấp niệm — đối mặt với bóng tối để vượt lên. Trong tình yêu, lá bài này là lời nhắc nhở về những bài học karma cần được đối mặt. Có thể có những ràng buộc hoặc nỗi sợ đang giữ bạn lại. Nếu xuất hiện ngược, đây là dấu hiệu tích cực — nó cho thấy bạn đang giải phóng bản thân khỏi những xiềng xích vô hình và bước vào ánh sáng.'
  }},
  {id:16, emoji:'🗼', name:{zh:'塔',en:'The Tower',es:'La Torre',fr:'La Tour',th:'หอคอย',vi:'Tháp'}, meaning:{
    zh:'突变的觉醒，打碎幻象见真相。这是感情中最具震感力的一张牌——它宣告旧有幻象的崩塌，随之而来的是痛苦但必要的真实觉醒。逆位时，暗示你可能还在抗拒这场必然的崩塌，而内在的觉醒早已势不可挡地发生，真正的解脱就在剧痛之后。',
    en:'Sudden awakening — illusions shatter to reveal truth.',
    es:'Despertar repentino — las ilusiones se rompen para revelar la verdad.',
    fr:'Éveil soudain — les illusions se brisent pour révéler la vérité.',
    th:'การตื่นรู้ทันใด — ภาพลวงแตกสลายเปิดเผยความจริง',
    vi:'Tỉnh giác đột ngột — ảo ảnh vỡ tan để lộ ra sự thật. Trong tình yêu, lá bài này thường xuất hiện khi có những biến động lớn làm rung chuyển nền tảng. Tuy đau đớn, nhưng đây là cần thiết cho sự phát triển. Sau cơn chấn động, bạn sẽ thấy rõ ràng hơn về bản chất thật của mối quan hệ. Nếu xuất hiện ngược, hãy cẩn thận với việc bỏ qua những dấu hiệu cảnh báo hoặc tránh né sự thật.'
  }},
  {id:17, emoji:'⭐', name:{zh:'星星',en:'The Star',es:'La Estrella',fr:'L\'Étoile',th:'ดาว',vi:'Ngôi Sao'}, meaning:{
    zh:'希望与灵感，宇宙的疗愈之光。这是感情中最温柔的一张牌——它为经历过风暴的关系带来宁静与修复的力量，暗示你们正在进入一个充满希望与重建的阶段。逆位时，提示你可能暂时失去了与这份希望连接的能力，但请相信，星光从未消失，它只是在等待云层散去。',
    en:'Hope and inspiration — cosmic healing light guides you.',
    es:'Esperanza e inspiración — la luz cósmica de sanación te guía.',
    fr:'Espoir et inspiration — la lumière de guérison cosmique vous guide.',
    th:'ความหวังและแรงบันดาลใจ — แสงรักษาจากจักรวาลนำทางคุณ',
    vi:'Hy vọng và cảm hứng — ánh sáng chữa lành vũ trụ dẫn đường cho bạn. Trong tình yêu, đây là một trong những lá bài đẹp nhất — nó mang đến sự chữa lành, hòa giải và tái sinh. Sau những giai đoạn khó khăn, cả hai người đang tìm lại niềm tin và hy vọng. Nếu xuất hiện ngược, hãy kiên nhẫn — đôi khi ánh sáng cần thời gian để xuyên qua những đám mây.'
  }},
  {id:18, emoji:'🌙', name:{zh:'月亮',en:'The Moon',es:'La Luna',fr:'La Lune',th:'ดวงจันทร์',vi:'Mặt Trăng'}, meaning:{
    zh:'幻象与恐惧，直面内心深处的不安。这张牌在感情中出现，暗示你们的关系中可能存在未被说出口的恐惧或误解——月光之下，一切皆有可能是幻象。逆位时，意味着迷雾正在逐渐散去，你们正慢慢看清彼此与关系的真实模样，这过程虽然不安，却是走向真正连接的必经之路。',
    en:'Illusion and fear — confront the unease within.',
    es:'Ilusión y miedo — enfrente la inquietud interior.',
    fr:'Illusion et peur — affrontez l\'inquiétude intérieure.',
    th:'ภาพลวงและความกลัว — เผชิญหòng đối với bất an sâu thẳm bên trong',
    vi:'Ảo ảnh và nỗi sợ — đối diện với bất an sâu thẳm bên trong. Trong tình yêu, lá bài này cảnh báo về những ảo ảnh, nỗi sợ hoặc sự hiểu lầm đang ẩn giấu. Đôi khi không phải mọi thứ đều như nó appear. Nếu xuất hiện ngược, đây là dấu hiệu tích cực — bạn đang dần nhìn thấu những bí ẩn và bắt đầu hiểu rõ hơn về bản chất thật của mối quan hệ.'
  }},
  {id:19, emoji:'☀️', name:{zh:'太阳',en:'The Sun',es:'El Sol',fr:'Le Soleil',th:'ดวงอาทิตย์',vi:'Mặt Trời'}, meaning:{
    zh:'喜悦与成功，生命力全面绽放。这是感情中最光明的一张牌——它宣告一段充满活力、喜悦与正向成长的关系阶段，一切都在向阳而生。逆位时，提示你可能暂时被乌云遮蔽了心中的阳光，但请记得，太阳从不真正消失，它只是在等待穿透云层的时机。',
    en:'Joy and success — vitality in full bloom.',
    es:'Alegría y éxito — vitalidad en plena floración.',
    fr:'Joie et succès — vitalité en pleine floración.',
    th:'ความสุขและความสำเร็จ — พลังชีวิตเบ่งบานอย่างเต็มที่',
    vi:'Vui sướng và thành công — sức sống nở rộ trọn vẹn. Trong tình yêu, lá bài này là biểu tượng của sự thịnh vượng, niềm vui và năng lượng tích cực. Mối quan hệ của bạn đang trải qua giai đoạn rực rỡ nhất. Nếu xuất hiện ngược, hãy cố gắng nhìn thấy mặt tích cực ngay cả trong những lúc khó khăn — ánh sáng luôn ở đó, chỉ có thể bạn đang nhìn sai hướng.'
  }},
  {id:20, emoji:'🔔', name:{zh:'审判',en:'Judgement',es:'El Juicio',fr:'Le Jugement',th:'การพิพากษา',vi:'Phán Xét'}, meaning:{
    zh:'重生与宽恕，灵魂被唤醒。这张牌在感情中出现，是对过去的一次深层审视与和解——你们的灵魂正在被召唤，去拥抱完整的真相、宽恕曾经的伤痛。逆位时，提示你可能还未准备好放下过去，但真正的自由始于对自己与对方的全然接纳，这是灵魂层面最深的治愈。',
    en:'Rebirth and forgiveness — your soul is being called.',
    es:'Renacimiento y perdón — tu alma está siendo llamada.',
    fr:'Renaissance et pardon — votre âme est appelée.',
    th:'การเกิดใหม่ và sự tha thứ — tâm hồn bạn đang được gọi',
    vi:'Tái sinh và tha thứ — tâm hồn bạn đang được gọi. Trong tình yêu, lá bài này là biểu tượng của sự thức tỉnh và chuộc lỗi. Đây là thời điểm để hòa giải với quá khứ, tha thứ cho bản thân và đối phương, và bắt đầu lại với tâm hồn trong sáng hơn. Nếu xuất hiện ngược, hãy kiểm tra xem có gì đang ngăn cản bạn tiến về phía trước, có thể đã đến lúc buông bỏ những gánh nặng cũ.'
  }},
  {id:21, emoji:'🌍', name:{zh:'世界',en:'The World',es:'El Mundo',fr:'Le Monde',th:'โลก',vi:'Thế Giới'}, meaning:{
    zh:'完成与圆满，达成内在的和谐。这是感情修行之旅的终点——它意味着你们已经共同走过了一段完整的道路，并在这段旅程中找到了内在的和谐与满足。逆位时，提示你可能还未真正完成这段旅程，但请相信，你已经走过的每一步都算数，终点一直在前方等待。',
    en:'Completion and fulfillment — inner harmony achieved.',
    es:'Completitud y plenitud — armonía interior lograda.',
    fr:'Accomplissement et plénitude — harmonie intérieure atteinte.',
    th:'ความสมบูรณ์ và sự viên mãn — ความสามัคคีภายในบรรลุ',
    vi:'Hoàn thành và viên mãn — hài hòa bên trong đã đạt được. Trong tình yêu, đây là một trong những lá bài đẹp nhất — nó tượng trưng cho sự viên mãn, hoàn thành và hài hòa. Bạn đang ở giai đoạn đẹp nhất của hành trình tình yêu. Nếu xuất hiện ngược, hãy tự hỏi liệu bạn đang thực sự ở đâu trong hành trình của mình và có gì đang ngăn bạn đạt đến sự viên mãn đó.'
  }},
];

const ORIENT_SUFFIX: Record<string, (reversed: boolean) => string> = {
  zh: (r) => r ? '（逆位）' : '（正位）',
  en: (r) => r ? ' (Reversed)' : ' (Upright)',
  es: (r) => r ? ' (Invertido)' : ' (Normal)',
  fr: (r) => r ? ' (Inversé)' : ' (Droit)',
  th: (r) => r ? ' (กลับด้าน)' : ' (ตั้งตรง)',
  vi: (r) => r ? ' (Ngược)' : ' (Thuận)',
};

export function getTarot(d1: string, d2: string, lang: string = 'en'): TarotCard {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const sorted = [d1, d2].sort();
  const str = sorted[0] + '|' + sorted[1] + '|' + today;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const cardId = Math.abs(hash) % 22;
  const reversed = Math.floor(Math.abs(hash) / 22) % 2 === 1;
  const card = CARDS[cardId] || CARDS[0];
  const L = (lang in card.name) ? lang : 'en';
  return {
    id: card.id,
    name: card.name[L] || card.name.en,
    meaning: card.meaning[L] || card.meaning.en,
    emoji: card.emoji,
    orientation: (ORIENT_SUFFIX[L] || ORIENT_SUFFIX['en'])(reversed),
  };
}
