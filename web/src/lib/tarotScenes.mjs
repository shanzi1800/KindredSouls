/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ✦ E158-刀四（主公军令 2026-11-26）：塔罗牌义三场景语境映射（六语权威字典）
 * ═══════════════════════════════════════════════════════════════════════════
 *   · 抽牌算法零变（tarot.ts getTarot 同一哈希）；仅「牌义文案」按场景分流：
 *       romance   ⇒ tarot.ts 既有情爱语境（逐字不动，本文件不收录）；
 *       business  ⇒ 协作韧性 / 决策魄力 / 格局边界；
 *       friendship ⇒ 真诚托底 / 情绪松弛 / 长久默契。
 *   · 严禁机翻；商道/挚友语境零情感专属词（闸门 audit-e158 逐条扫描六语禁词），
 *     并守 E157 澳洲合规护栏（零神明/信仰/因果布道、零定论式预测、零商业指令）。
 *   · 键＝tarot.ts CARDS 的 id（0~21）；语种序 [zh,en,fr,es,th,vi]；缺行 ⇒ 回落情爱牌义。
 */

export const TAROT_SCENE_MEANING = Object.freeze({
  business: {
  0: {
    zh: "共同启程的勇气：面对未经验证的新方向，愿意一起试错、做原型、边做边学。逆位时，先停一停把风险摆上桌面——把最坏情况说清楚，大胆的步伐才走得稳。",
    en: "The courage to begin an untested venture together. Upright: a shared willingness to experiment, prototype and learn by doing. Reversed: pause and put the risk on the table — a bold step only holds when the worst case has been named first.",
    fr: "Le courage d'entreprendre ensemble sur un terrain inexploré. À l'endroit : une envie partagée d'expérimenter, de prototyper, d'apprendre en faisant. Sens inverse : faites une pause et posez le risque sur la table — un pas audacieux ne tient que si le pire cas a été nommé.",
    es: "El valor de emprender juntos en terreno sin explorar. Al derecho: ganas compartidas de experimentar, crear prototipos y aprender haciendo. En sentido inverso: hagan una pausa y pongan el riesgo sobre la mesa; un paso audaz solo se sostiene si lo peor ya está nombrado.",
    th: 'ความกล้าที่จะเริ่มต้นสิ่งใหม่ร่วมกันในเส้นทางที่ยังไม่มีใครพิสูจน์ ตำแหน่งตรง: ความพร้อมใจที่จะทดลอง ลงมือทำต้นแบบ และเรียนรู้จากการลงมือ ตำแหน่งกลับด้าน: หยุดพักและวางความเสี่ยงลงบนโต๊ะ — ก้าวที่กล้าหาญจะยั่งยืนได้ก็ต่อเมื่อรู้จักกรณีที่แย่ที่สุดเสียก่อน',
    vi: 'Can đảm cùng nhau khởi đầu trên một hướng đi chưa ai kiểm chứng. Thuận: sự sẵn lòng chia sẻ để thử nghiệm, làm mẫu và học bằng chính đôi tay. Ngược: tạm dừng và đặt rủi ro lên bàn — bước đi táo bạo chỉ vững khi tình huống xấu nhất đã được gọi tên.',
  },
  1: {
    zh: "资源已在手中：能力、人脉与时机俱备。正位，把想法落成第一份可交付的成果。逆位，切忌过度承诺——先对齐范围与能力，再敲定时间表。",
    en: "The resources are already in your hands: skills, network and timing. Upright: turn the idea into a first tangible deliverable. Reversed: avoid over-promising; align scope and capabilities before fixing the deadline.",
    fr: "Les ressources sont déjà là : compétences, réseau, timing. À l'endroit : transformez l'idée en un premier livrable concret. Sens inverse : évitez la surpromesse ; alignez le périmètre et les capacités avant de fixer l'échéance.",
    es: "Los recursos ya están a su alcance: habilidades, contactos y momento oportuno. Al derecho: conviertan la idea en un primer entregable concreto. En sentido inverso: eviten prometer de más; alineen el alcance y las capacidades antes de fijar plazos.",
    th: 'ทรัพยากรอยู่ในมือคุณแล้ว: ทักษะ เครือข่าย และจังหวะเวลา ตำแหน่งตรง: แปลงไอเดียให้เป็นผลงานชิ้นแรกที่จับต้องได้ ตำแหน่งกลับด้าน: เลี่ยงการรับปากเกินตัว ตกลงขอบเขตและขีดความสามารถให้ชัดก่อนนัดส่ง',
    vi: 'Nguồn lực đã trong tay: kỹ năng, mối quan hệ và thời điểm. Thuận: biến ý tưởng thành sản phẩm đầu tiên có thể bàn giao. Ngược: tránh hứa hẹn quá sức; thống nhất phạm vi và năng lực trước khi chốt thời hạn.',
  },
  2: {
    zh: "留意安静的信号：客户没说出口的顾虑、数字里细微的异常。正位，给决策留出沉淀的空间。逆位，把隐藏的假设摆到明面上——没说出口的话，往往比议程更重要。",
    en: "Listen to the quiet signals: a concern a client has not voiced, a nuance in the numbers. Upright: give the decision room to mature. Reversed: bring hidden assumptions into the open — what is left unsaid often weighs more than the agenda.",
    fr: "Écoutez les signaux discrets : une réticence non dite d'un client, une nuance dans les chiffres. À l'endroit : laissez la décision mûrir. Sens inverse : mettez au jour les hypothèses cachées — ce qui n'est pas dit pèse souvent plus que l'ordre du jour.",
    es: "Escuchen las señales discretas: la duda no dicha de un cliente, un matiz en las cifras. Al derecho: dejen madurar la decisión. En sentido inverso: saquen a la luz los supuestos ocultos; lo que no se dice suele pesar más que la agenda.",
    th: 'รับฟังสัญญาณเบา ๆ: ความกังวลที่ลูกค้ายังไม่พูด ความผิดปกติเล็ก ๆ ในตัวเลข ตำแหน่งตรง: เว้นพื้นที่ให้การตัดสินใจได้สุกงอม ตำแหน่งกลับด้าน: ดึงสมมติฐานที่ซ่อนอยู่ออกมา เพราะสิ่งที่ไม่ได้พูดมักสำคัญกว่าวาระในที่ประชุม',
    vi: 'Lắng nghe những tín hiệu nhẹ nhàng: mối băn khoăn chưa nói ra của khách hàng, một điểm lạ trong số liệu. Thuận: dành không gian để quyết định chín muồi. Ngược: đưa các giả định ẩn ra ánh sáng — điều chưa nói thường nặng hơn chương trình họp.',
  },
  3: {
    zh: "以耐心培育项目、团队与客户联结。正位，一个想法已具备长成可持续事业的土壤。逆位，警惕铺得过开——为优先级做减法，核心才能长得好。",
    en: "Growth through patience: nurturing a project, a team, a customer bond. Upright: an idea is ready to grow into something sustainable. Reversed: watch for over-extension — prune priorities so the core can flourish.",
    fr: "La croissance par la patience : cultiver un projet, une équipe, un lien client. À l'endroit : une idée est prête à devenir quelque chose de durable. Sens inverse : surveillez l'extension excessive — simplifiez les priorités pour que l'essentiel s'épanouisse.",
    es: "El crecimiento mediante la paciencia: cultivar un proyecto, un equipo, un vínculo con el cliente. Al derecho: una idea está lista para convertirse en algo sostenible. En sentido inverso: cuiden la expansión excesiva; simplifiquen prioridades para que lo esencial florezca.",
    th: 'การเติบโตด้วยความใส่ใจ: บ่มเพาะโครงการ ทีม และความผูกพันกับลูกค้าอย่างใจเย็น ตำแหน่งตรง: ไอเดียพร้อมเติบโตเป็นสิ่งที่ยั่งยืน ตำแหน่งกลับด้าน: ระวังการกระจายตัวมากเกินไป ตัดลำดับความสำคัญให้เหลือแก่น เพื่อให้แกนหลักของงานเติบโตเต็มที่',
    vi: 'Tăng trưởng bằng sự kiên nhẫn: vun trồng một dự án, một đội ngũ, một kết nối với khách hàng. Thuận: một ý tưởng đã sẵn sàng trở thành điều bền vững. Ngược: đề phòng dàn trải quá mức; rút gọn ưu tiên để phần cốt lõi được phát triển.',
  },
  4: {
    zh: "结构、问责与稳健的治理。正位，明确角色、里程碑与决策权。逆位，松一松过紧的控制——规则太多，反而拖慢它本要保护的协作。",
    en: "Structure, accountability and steady governance. Upright: set clear roles, milestones and decision rights. Reversed: loosen rigid control — too many rules slow the very collaboration they were meant to protect.",
    fr: "Structure, responsabilité et gouvernance stable. À l'endroit : clarifiez les rôles, les jalons et les droits de décision. Sens inverse : desserrez le contrôle trop strict ; trop de règles ralentit la collaboration qu'elles devaient protéger.",
    es: "Estructura, responsabilidad y gobernanza estable. Al derecho: aclaren roles, hitos y derechos de decisión. En sentido inverso: aflojen el control demasiado rígido; el exceso de reglas frena la colaboración que debían proteger.",
    th: 'โครงสร้าง ความรับผิดชอบ และการกำกับที่มั่นคง ตำแหน่งตรง: กำหนดบทบาท หมุดหมาย และอำนาจการตัดสินใจให้ชัด ตำแหน่งกลับด้าน: คลายการควบคุมที่แน่นเกินไป กฎที่มากเกินไปกลับทำให้การร่วมมือที่มันควรปกป้องเชื่องช้าลง',
    vi: 'Cấu trúc, trách nhiệm và một bộ máy điều hành vững vàng. Thuận: làm rõ vai trò, cột mốc và quyền quyết định. Ngược: nới lỏng sự kiểm soát quá cứng; quá nhiều quy tắc lại làm chậm chính sự cộng tác mà chúng cần bảo vệ.',
  },
  5: {
    zh: "成熟的方法、导师与共同的标准。正位，向经过验证的框架与可信的顾问学习。逆位，当旧打法不再适配，就一起质疑它：留下有效的，重设其余的。",
    en: "Proven methods, mentors and shared standards. Upright: learn from validated frameworks and trusted advisors. Reversed: question the inherited playbook together when it no longer fits; keep what works, redesign the rest.",
    fr: "Des méthodes éprouvées, des mentors, des standards partagés. À l'endroit : apprenez des cadres validés et de conseillers de confiance. Sens inverse : questionnez ensemble le manuel hérité quand il ne convient plus ; gardez ce qui marche, refondez le reste.",
    es: "Métodos probados, mentores y estándares compartidos. Al derecho: aprendan de marcos validados y de consejeros de confianza. En sentido inverso: cuestionen juntos el manual heredado cuando ya no encaja; conserven lo que funciona y rediseñen el resto.",
    th: 'วิธีการที่พิสูจน์แล้ว ผู้รู้นำทาง และมาตรฐานร่วม ตำแหน่งตรง: เรียนรู้จากกรอบที่ผ่านการทดสอบและที่ปรึกษาที่น่าเชื่อถือ ตำแหน่งกลับด้าน: ตั้งคำถามกับคู่มือเดิมเมื่อมันไม่เหมาะอีกต่อไป เก็บส่วนที่ได้ผลไว้ แล้วออกแบบส่วนที่เหลือใหม่ร่วมกัน',
    vi: 'Phương pháp đã kiểm chứng, người dẫn dắt và chuẩn mực chung. Thuận: học từ khung được nghiệm thu và cố vấn đáng tin cậy. Ngược: cùng đặt câu hỏi với cuốn sổ cũ khi nó không còn phù hợp; giữ điều hiệu quả, thiết kế lại phần còn lại.',
  },
  6: {
    zh: "价值取舍的关键时刻。正位，选择你们双方都真心认同的方向。逆位，重新核对优先级——只由一方做出的决定，日后总会以摩擦的形式重现。",
    en: "A decisive choice of values at the crossroads. Upright: choose the direction that both of you genuinely stand behind. Reversed: re-check priorities — a decision made by only one side will keep resurfacing as friction.",
    fr: "Un choix de valeurs décisif à la croisée des chemins. À l'endroit : choisissez la direction que vous assumez tous les deux. Sens inverse : revérifiez les priorités — une décision prise par un seul côté revient toujours sous forme de friction.",
    es: "Una elección de valores decisiva en la encrucijada. Al derecho: elijan la dirección que ambos asumen de verdad. En sentido inverso: revisen las prioridades; una decisión tomada por una sola parte siempre reaparece como fricción.",
    th: 'การเลือกตามคุณค่าในช่วงจุดเปลี่ยน ตำแหน่งตรง: เลือกทิศทางที่ทั้งสองฝ่ายยืนยันด้วยใจจริง ตำแหน่งกลับด้าน: ตรวจลำดับความสำคัญอีกครั้ง การตัดสินใจที่มาจากฝ่ายเดียวย่อมกลับมาเป็นความขัดแย้งในภายหลัง',
    vi: 'Một lựa chọn giá trị mang tính quyết định tại ngã rẽ. Thuận: chọn hướng mà cả hai bên đều thật sự đứng về phía. Ngược: rà lại thứ tự ưu tiên — quyết định chỉ do một phía đưa ra rồi sẽ quay lại dưới dạng mâu thuẫn.',
  },
  7: {
    zh: "朝共同目标推进的动能。正位，把不同的长处调向同一方向，一起穿过阻力。逆位，靠掌舵而非硬冲——分散的用力，会磨掉专注带来的锋芒。",
    en: "Momentum toward a shared goal. Upright: steer different strengths in the same direction and push through resistance together. Reversed: steer rather than force — scattered effort loses the edge that focus creates.",
    fr: "L'élan vers un objectif commun. À l'endroit : orientez les forces différentes dans le même sens et traversez les résistances ensemble. Sens inverse : pilotez plutôt que forcer ; un effort dispersé perd l'avantage que donne la concentration.",
    es: "El impulso hacia un objetivo común. Al derecho: orienten las fortalezas distintas en el mismo sentido y atraviesen las resistencias juntos. En sentido inverso: conduzcan en vez de forzar; el esfuerzo disperso pierde la ventaja de la concentración.",
    th: 'แรงขับเคลื่อนสู่เป้าหมายร่วม ตำแหน่งตรง: บังคับจุดแข็งที่แตกต่างให้ไปทางเดียวกัน และฝ่าอุปสรรคไปด้วยกัน ตำแหน่งกลับด้าน: บังคับพวงมาลัยดีกว่าใช้แรงฝืน ความพยายามที่กระจัดกระจายจะเสียความได้เปรียบที่มาจากความจดจ่อ',
    vi: 'Đà tiến về mục tiêu chung. Thuận: điều hướng những điểm mạnh khác nhau về một hướng và cùng vượt trở ngại. Ngược: cầm lái thay vì ép buộc; nỗ lực phân tán đánh mất lợi thế mà sự tập trung mang lại.',
  },
  8: {
    zh: "真正的掌控力，不是强势压过搭档，而是以稳健与韧性化解分歧、驾驭野心。正位，耐心能撬动最难的障碍。逆位，收一收强推的冲动——坚定配上从容，才走得最远。",
    en: "True command is not overpowering your counterpart: it is resolving differences with steadiness and resilience while mastering ambition. Upright: patience moves the hardest obstacles. Reversed: tame the urge to push; firmness paired with calm wins the most ground.",
    fr: "La vraie maîtrise n'est pas de dominer son partenaire : c'est apaiser les désaccords avec constance et résilience tout en canalisant l'ambition. À l'endroit : la patience déplace les obstacles les plus durs. Sens inverse : retenez l'envie de forcer ; la fermeté alliée au calme gagne le plus de terrain.",
    es: "El verdadero dominio no es imponerse al colega: es resolver las diferencias con constancia y resiliencia mientras se encauza la ambición. Al derecho: la paciencia mueve los obstáculos más duros. En sentido inverso: contengan el impulso de empujar; la firmeza con calma gana más terreno.",
    th: 'อำนาจที่แท้จริงไม่ใช่การเอาชนะคู่ร่วมงาน แต่คือการคลี่คลายความเห็นต่างด้วยความมั่นคงและความยืดหยุ่น ขณะคุมความทะเยอทะยานไว้ได้ ตำแหน่งตรง: ความอดทนขยับอุปสรรคที่ยากที่สุดได้ ตำแหน่งกลับด้าน: ระงับความอยากผลักดัน ความหนักแน่นที่จับคู่กับความสงบยึดพื้นที่ได้มากที่สุด',
    vi: 'Quyền lực thật sự không phải là áp đảo đồng nghiệp, mà là hóa giải bất đồng bằng sự vững vàng và bền bỉ, đồng thời dẫn dắt khát vọng. Thuận: sự kiên nhẫn dịch chuyển trở ngại khó nhất. Ngược: kìm nén thôi thúc thúc đẩy; sự kiên định đi cùng điềm tĩnh giành được nhiều đất nhất.',
  },
  9: {
    zh: "主动抽身，把问题想清楚。正位，退一步复盘战略，请一位行家过目。逆位，别独处太久——趁结论还新鲜，把它带回桌面。",
    en: "Deliberate withdrawal to think clearly. Upright: step back, review the strategy, seek an expert eye. Reversed: do not stay isolated too long — bring your conclusions back to the table while they still matter.",
    fr: "Un retrait délibéré pour penser clairement. À l'endroit : prenez du recul, révisez la stratégie, sollicitez un regard expert. Sens inverse : ne restez pas isolé trop longtemps — rapportez vos conclusions à la table tant qu'elles comptent.",
    es: "Un repliegue deliberado para pensar con claridad. Al derecho: den un paso atrás, revisen la estrategia, busquen una mirada experta. En sentido inverso: no se aíslen demasiado tiempo; traigan sus conclusiones a la mesa mientras siguen vigentes.",
    th: 'ถอยออกมาอย่างตั้งใจเพื่อคิดให้ชัด ตำแหน่งตรง: ถอยหนึ่งก้าว ทบทวนกลยุทธ์ และขอความเห็นจากผู้เชี่ยวชาญ ตำแหน่งกลับด้าน: อย่าอยู่ตัวคนเดียวนานเกินไป นำข้อสรุปกลับมาที่โต๊ะประชุมในขณะที่มันยังมีคุณค่า',
    vi: 'Chủ động lùi lại để suy nghĩ cho rõ. Thuận: lùi một bước, xem lại chiến lược, tìm một ánh mắt chuyên gia. Ngược: đừng độc hành quá lâu — mang kết luận trở lại bàn làm việc khi nó còn giá trị.',
  },
  10: {
    zh: "周期在转：市场、时机与势头都在变化。正位，识别窗口期，在它敞开时行动。逆位，顺应新阶段而非硬扛——看清新一轮周期对你们的要求。",
    en: "Cycles turn: markets, timing and momentum shift. Upright: recognize the window and act while it is open. Reversed: adapt to the changing phase rather than resisting it; review what the new cycle asks of you.",
    fr: "Les cycles tournent : marché, timing et dynamique évoluent. À l'endroit : repérez la fenêtre et agissez pendant qu'elle est ouverte. Sens inverse : adaptez-vous à la nouvelle phase plutôt que d'y résister ; relisez ce que ce cycle attend de vous.",
    es: "Los ciclos giran: mercado, timing y dinámica cambian. Al derecho: reconozcan la ventana y actúen mientras está abierta. En sentido inverso: adáptense a la nueva fase en lugar de resistirla; relean lo que este ciclo les pide.",
    th: 'วัฏจักรหมุนเปลี่ยน: ตลาด จังหวะเวลา และโมเมนตัม ตำแหน่งตรง: มองเห็นช่วงโอกาสและลงมือในขณะที่มันเปิดอยู่ ตำแหน่งกลับด้าน: ปรับตัวตามเฟสใหม่แทนการต่อต้าน ทบทวนว่าวัฏจักรใหม่กำลังเรียกร้องอะไรจากคุณ',
    vi: 'Các chu kỳ xoay chuyển: thị trường, thời điểm và đà thay đổi. Thuận: nhận ra cửa sổ cơ hội và hành động khi nó còn mở. Ngược: thích nghi với giai đoạn mới thay vì chống lại; xem lại chu kỳ mới đang đòi hỏi gì ở bạn.',
  },
  11: {
    zh: "公平、事实与清晰的约定。正位，把条款、功劳与责任写下来，并保持平衡。逆位，公开面对失衡——含糊的问责，会悄悄侵蚀每一段协作。",
    en: "Fairness, facts and clear agreements. Upright: put terms, credit and responsibilities in writing and keep them balanced. Reversed: address an imbalance openly — unclear accountability quietly erodes every collaboration.",
    fr: "Équité, faits et accords clairs. À l'endroit : mettez par écrit les termes, le mérite et les responsabilités, en gardant l'équilibre. Sens inverse : abordez ouvertement un déséquilibre ; une responsabilité floue érode silencieusement toute collaboration.",
    es: "Equidad, hechos y acuerdos claros. Al derecho: pongan por escrito términos, mérito y responsabilidades, manteniendo el equilibrio. En sentido inverso: aborden abiertamente un desequilibrio; una responsabilidad difusa erosiona en silencio toda colaboración.",
    th: 'ความยุติธรรม ข้อเท็จจริง และข้อตกลงที่ชัดเจน ตำแหน่งตรง: เขียนเงื่อนไข เครดิต และความรับผิดชอบลงเป็นลายลักษณ์อักษรอย่างสมดุล ตำแหน่งกลับด้าน: เปิดเผยความไม่สมดุล ความรับผิดชอบที่คลุมเครือจะค่อย ๆ กัดกร่อนทุกความร่วมมือ',
    vi: 'Công bằng, sự thật và thỏa thuận rõ ràng. Thuận: ghi lại điều khoản, công trạng và trách nhiệm bằng văn bản, giữ thế cân bằng. Ngược: hành động thẳng thắn với một sự mất cân bằng; trách nhiệm mơ hồ lặng lẽ bào mòn mọi sự cộng tác.',
  },
  12: {
    zh: "一次带来新视角的暂停。正位，悬置判断，换个角度看问题，新的选项自然浮现。逆位，避免停滞式的犹豫——定下决策日期，别让等待变成回避。",
    en: "A pause that opens a new perspective. Upright: suspend judgment, look at the problem from another angle and a new option appears. Reversed: avoid stalled indecision — set a date to decide so waiting does not become avoidance.",
    fr: "Une pause qui ouvre une nouvelle perspective. À l'endroit : suspendez le jugement, regardez le problème sous un autre angle, une option apparaît. Sens inverse : évitez l'indécision prolongée — fixez une date de décision pour que l'attente ne devienne pas une esquive.",
    es: "Una pausa que abre una perspectiva nueva. Al derecho: suspendan el juicio, miren el problema desde otro ángulo y aparece una opción. En sentido inverso: eviten la indecisión prolongada; fijen una fecha para decidir y que la espera no se convierta en evasión.",
    th: 'การหยุดพักที่มอบมุมมองใหม่ ตำแหน่งตรง: ระงับการตัดสิน มองปัญหาจากอีกมุม แล้วทางเลือกใหม่จะปรากฏ ตำแหน่งกลับด้าน: เลี่ยงความลังเลที่ลากยาว กำหนดวันตัดสินใจ เพื่อให้การรอไม่กลายเป็นการหลีกเลี่ยง',
    vi: 'Một khoảng dừng mang đến góc nhìn mới. Thuận: tạm gác phán xét, nhìn vấn đề từ phía khác, một lựa chọn sẽ xuất hiện. Ngược: tránh do dự kéo dài; hẹn ngày quyết định để việc chờ đợi không trở thành né tránh.',
  },
  13: {
    zh: "一个结束为更新腾出空间。正位，关掉过时的模式或消耗性的承诺，为下一阶段留出余地。逆位，放手已经完成的事——带着它前行，只会拖慢同行的人。",
    en: "An ending that clears the ground for renewal. Upright: close an outdated model or a draining commitment to make room for the next stage. Reversed: release what is finished — carrying it forward only slows those who walk with you.",
    fr: "Une fin qui libère la place du renouveau. À l'endroit : fermez un modèle dépassé ou un engagement épuisant pour préparer la suite. Sens inverse : lâchez ce qui est terminé ; le porter plus loin ralentit ceux qui avancent avec vous.",
    es: "Un final que despeja el terreno para la renovación. Al derecho: cierren un modelo obsoleto o un compromiso desgastante para hacer sitio a la siguiente etapa. En sentido inverso: suelten lo que ya terminó; cargarlo solo frena a quienes avanzan con ustedes.",
    th: 'การสิ้นสุดที่เปิดพื้นที่ให้การเริ่มใหม่ ตำแหน่งตรง: ปิดโมเดลที่ล้าสมัยหรือคำมั่นที่ทำให้หมดแรง เพื่อเว้นที่ให้ขั้นถัดไป ตำแหน่งกลับด้าน: ปล่อยวางสิ่งที่จบลงแล้ว การแบกมันไปต่อจะทำให้คนที่เดินเคียงคุณช้าลงเท่านั้น',
    vi: 'Một kết thúc dọn đất cho sự đổi mới. Thuận: khép lại mô hình lỗi thời hoặc cam kết bào mòn để nhường chỗ cho giai đoạn tiếp theo. Ngược: buông bỏ điều đã kết thúc; ôm theo nó chỉ làm chậm những người đang cùng bạn tiến lên.',
  },
  14: {
    zh: "把不同的长处调和成可运转的整体。正位，节奏适中，风险与谨慎并行，融汇相左的观点。逆位，重新配平——一方的风格正在主导，趁融合未散先校准。",
    en: "Blending different strengths into a workable whole. Upright: moderate pace, risk balanced with caution, opposing views integrated. Reversed: rebalance — one side's style is dominating; recalibrate before the blend is lost.",
    fr: "Accorder des forces différentes en un tout cohérent. À l'endroit : rythme modéré, risque et prudence dosés, points de vue opposés intégrés. Sens inverse : rééquilibrez — le style d'un côté domine ; recalibrez avant que l'harmonie ne se perde.",
    es: "Armonizar fortalezas distintas en un todo funcional. Al derecho: ritmo moderado, riesgo y prudencia dosificados, opiniones opuestas integradas. En sentido inverso: reequilibren; el estilo de un lado domina; recalibren antes de que se pierda la mezcla.",
    th: 'ผสานจุดแข็งที่ต่างกันให้เป็นหนึ่งเดียวที่ขับเคลื่อนได้ ตำแหน่งตรง: จังหวะพอดี ผสมความเสี่ยงกับความระมัดระวัง และหลอมรวมความเห็นที่ขัดกัน ตำแหน่งกลับด้าน: ปรับสมดุลใหม่ สไตล์ของฝ่ายหนึ่งกำลังครอบงำ ปรับให้เข้าที่ก่อนที่ความกลมกลืนจะหายไป',
    vi: 'Hòa quyện những điểm mạnh khác nhau thành một chỉnh thể vận hành được. Thuận: nhịp vừa phải, rủi ro và thận trọng được cân đo, góc nhìn đối lập được dung hòa. Ngược: cân bằng lại — phong cách một phía đang chiếm ưu thế; hiệu chỉnh trước khi sự hòa hợp biến mất.',
  },
  15: {
    zh: "对短期利益、控制权或束缚性安排的执念。正位，看清那些钩子——诱人的捷径，或限制自由度的依赖。逆位，解开绳索——重新谈一谈那些“不得不”，把选择权拿回来。",
    en: "Attachment to short-term gain, control or a binding arrangement. Upright: notice the hooks — a tempting shortcut, a dependency that limits freedom. Reversed: loosen the ties; reclaim choice by renegotiating what has felt compulsory.",
    fr: "L'attachement au gain immédiat, au contrôle ou à un arrangement contraignant. À l'endroit : repérez les crochets — un raccourci séduisant, une dépendance qui limite la liberté. Sens inverse : desserrez les liens ; regagnez le choix en renégociant ce qui semblait obligatoire.",
    es: "El apego a la ganancia inmediata, al control o a un acuerdo vinculante. Al derecho: detecten los ganchos: un atajo seductor, una dependencia que limita la libertad. En sentido inverso: aflojen las ataduras; recuperen la capacidad de elegir renegociando lo que parecía obligatorio.",
    th: 'การยึดติดกับผลประโยชน์ระยะสั้น อำนาจควบคุม หรือข้อตกลงที่พันธนาการ ตำแหน่งตรง: มองเห็นตะขอเหล่านั้น ทางลัดที่หลอกล่อ หรือการพึ่งพาที่จำกัดเสรีภาพ ตำแหน่งกลับด้าน: คลายพันธนาการ ยึดสิทธิ์ในการเลือกคืนมาด้วยการเจรจาสิ่งที่เคยรู้สึกว่าจำต้องทำ',
    vi: 'Sự bám víu vào lợi ích trước mắt, quyền kiểm soát hoặc một thỏa thuận trói buộc. Thuận: nhận ra những cái móc — lối tắt quyến rũ, một sự phụ thuộc giới hạn tự do. Ngược: nới những sợi dây; giành lại quyền lựa chọn bằng cách đàm phán lại điều từng tưởng là bắt buộc.',
  },
  16: {
    zh: "一则撼动不稳结构的突发真相。正位，让有缺陷的计划早点倒塌——真相让你们能在坚实的地基上重建。逆位，危机被延缓而未解决——趁裂缝扩大前，先补牢薄弱的根基。",
    en: "A sudden truth that shakes an unstable structure. Upright: let the flawed plan collapse early — the truth lets you rebuild on solid ground. Reversed: the crisis is delayed, not resolved; repair the weak foundation before it cracks.",
    fr: "Une vérité soudaine qui ébranle une structure instable. À l'endroit : laissez le plan défectueux s'effondrer tôt — la vérité permet de rebâtir sur sol ferme. Sens inverse : la crise est retardée, pas résolue ; réparez la base fragile avant qu'elle ne cède.",
    es: "Una verdad repentina que sacude una estructura inestable. Al derecho: dejen que el plan defectuoso se derrumbe pronto; la verdad permite reconstruir sobre suelo firme. En sentido inverso: la crisis se pospone, no se resuelve; reparen la base frágil antes de que ceda.",
    th: 'ความจริงที่โผล่มากะทันหันและสั่นคลอนโครงสร้างที่ไม่มั่นคง ตำแหน่งตรง: ปล่อยให้แผนที่บกพร่องพังให้เร็ว เพราะความจริงทำให้คุณสร้างใหม่บนพื้นที่มั่นคงได้ ตำแหน่งกลับด้าน: วิกฤตถูกเลื่อนออกไปแต่ยังไม่คลี่คลาย ซ่อมรากฐานที่เปราะบางก่อนที่มันจะแตกร้าว',
    vi: 'Một sự thật bất ngờ làm rung chuyển cấu trúc thiếu vững chắc. Thuận: để kế hoạch sai sót sụp đổ sớm — sự thật giúp bạn xây lại trên nền tảng kiên cố. Ngược: khủng hoảng bị hoãn chứ chưa được giải quyết; sửa nền móng yếu trước khi nó nứt vỡ.',
  },
  17: {
    zh: "动荡之后的希望、愿景与沉静的信心。正位，一个长期方向正在激励这段协作，大方把它讲出来。逆位，重建对共同目标的信心——看得见的小进展，能让双方重拾投入。",
    en: "Hope, vision and quiet confidence after turbulence. Upright: a long-term direction is inspiring the collaboration; speak about it generously. Reversed: restore faith in the common goal — small visible progress renews commitment on both sides.",
    fr: "Espérance, vision et confiance calme après la turbulence. À l'endroit : une direction de long terme inspire la collaboration ; parlez-en généreusement. Sens inverse : restaurez la confiance dans l'objectif commun ; des progrès visibles ravivent l'engagement des deux côtés.",
    es: "Esperanza, visión y confianza serena tras la turbulencia. Al derecho: una dirección de largo plazo inspira la colaboración; compártanla con generosidad. En sentido inverso: restauren la confianza en el objetivo común; el progreso visible reaviva el compromiso de ambas partes.",
    th: 'ความหวัง วิสัยทัศน์ และความมั่นใจที่สงบหลังความปั่นป่วน ตำแหน่งตรง: ทิศทางระยะยาวกำลังสร้างแรงบันดาลใจให้การร่วมมือ บอกเล่ามันอย่างเต็มใจ ตำแหน่งกลับด้าน: ฟื้นความเชื่อมั่นในเป้าหมายร่วม ความคืบหน้าเล็ก ๆ ที่มองเห็นได้จะจุดการทุ่มเทของทั้งสองฝ่ายขึ้นอีกครั้ง',
    vi: 'Hy vọng, tầm nhìn và niềm tin điềm tĩnh sau sóng gió. Thuận: một hướng đi dài hạn đang truyền cảm hứng cho sự cộng tác; hãy kể về nó thật rộng rãi. Ngược: khôi phục niềm tin vào mục tiêu chung; những tiến bộ nhìn thấy được thắp lại cam kết của cả hai phía.',
  },
  18: {
    zh: "不确定、信息模糊、犹豫。正位，事实不清时先别签字、先别决定——多问、核实、等待。逆位，迷雾正在散去——把困惑说出口，谈判桌会重新清晰。",
    en: "Uncertainty, unclear information, hesitation. Upright: do not sign or decide while the facts are foggy; ask, verify, wait. Reversed: the fog is lifting — name the confusion aloud and the negotiation becomes clear again.",
    fr: "Incertitude, informations floues, hésitation. À l'endroit : ne signez ni ne décidez tant que les faits sont brumeux ; demandez, vérifiez, attendez. Sens inverse : la brume se lève — nommez la confusion à voix haute et la négociation s'éclaircit.",
    es: "Incertidumbre, información difusa, vacilación. Al derecho: no firmen ni decidan mientras los hechos estén brumosos; pregunten, verifiquen, esperen. En sentido inverso: la bruma se disipa; nombren la confusión en voz alta y la negociación se aclara.",
    th: 'ความไม่แน่นอน ข้อมูลที่เลือนลาง ความลังเล ตำแหน่งตรง: อย่าเซ็นหรือตัดสินใจในขณะที่ข้อเท็จจริงยังขุ่นมัว ถาม ตรวจสอบ และรอ ตำแหน่งกลับด้าน: หมอกจางลง พูดความสับสนออกมาดัง ๆ โต๊ะเจรจาจะกระจ่างขึ้น',
    vi: 'Bất định, thông tin mờ nhạt, do dự. Thuận: đừng ký, đừng quyết định khi sự thực còn mù mịt; hãy hỏi, kiểm chứng và chờ đợi. Ngược: màn sương tan dần — gọi tên sự bối rối thành lời và bàn đàm phán trở nên rõ ràng.',
  },
  19: {
    zh: "清晰、成效与可见的活力。正位，士气正盛，方案扎实，把成绩公开庆祝。逆位，收一收过度自信——热度不减，但放大之前先把细节核一遍。",
    en: "Clarity, results and visible vitality. Upright: morale is high and the plan is sound; celebrate the wins openly. Reversed: tone down over-confidence — keep the warmth, but check the details before scaling up.",
    fr: "Clarté, résultats et vitalité visible. À l'endroit : l'énergie est haute, le plan est solide, célébrez les victoires ouvertement. Sens inverse : modérez l'excès de confiance ; gardez la même chaleur mais vérifiez les détails avant de passer à l'échelle.",
    es: "Claridad, resultados y vitalidad visible. Al derecho: la energía está alta, el plan es sólido, celebren los logros abiertamente. En sentido inverso: moderen el exceso de confianza; mantengan el calor pero revisen los detalles antes de escalar.",
    th: 'ความชัดเจน ความสำเร็จ และพลังที่มองเห็นได้ ตำแหน่งตรง: กำลังใจสูง แผนมั่นคง ฉลองความสำเร็จอย่างเปิดเผย ตำแหน่งกลับด้าน: ลดความมั่นใจมากเกินไป คงความร้อนแรงไว้ แต่ตรวจรายละเอียดก่อนขยายผล',
    vi: 'Rõ ràng, thành công và sức sống hữu hình. Thuận: khí thế đang cao, kế hoạch vững, hãy ăn mừng chiến thắng công khai. Ngược: giảm bớt quá tự tin; giữ nguyên nhiệt huyết nhưng kiểm tra chi tiết trước khi mở rộng.',
  },
  20: {
    zh: "一次坦诚的复盘与明确的决断。正位，客观评估过往的得失，宽恕失误，带着更新的使命感再出发。逆位，过度的自我苛责会拖住进度——就事论事、不咎过往，往前走。",
    en: "An honest review and a clear call. Upright: assess past results objectively, forgive the missteps and move on with a renewed sense of purpose. Reversed: harsh self-critique stalls progress; look at the facts without blame and move forward.",
    fr: "Un bilan honnête et une décision claire. À l'endroit : évaluez objectivement les résultats passés, pardonnez les faux pas, repartez avec un objectif renouvelé. Sens inverse : l'autocritique excessive bloque la progression ; considérez les faits sans blâme et avancez.",
    es: "Un balance honesto y una decisión clara. Al derecho: evalúen con objetividad los resultados pasados, perdonen los tropiezos y avancen con un propósito renovado. En sentido inverso: la autocrítica excesiva frena el avance; miren los hechos sin culpas y sigan adelante.",
    th: 'การทบทวนอย่างตรงไปตรงมาและการตัดสินใจที่ชัดเจน ตำแหน่งตรง: ประเมินผลที่ผ่านมาอย่างเป็นกลาง ให้อภัยความผิดพลาด และก้าวต่อด้วยเป้าหมายที่ต่อใหม่ ตำแหน่งกลับด้าน: การตำหนิตัวเองมากเกินไปจะฉุดความคืบหน้า พิจารณาข้อเท็จจริงโดยไม่โทษใคร แล้วเดินต่อ',
    vi: 'Một cuộc nhìn nhận thẳng thắn và một quyết đoán rõ ràng. Thuận: đánh giá kết quả quá khứ khách quan, tha thứ những sai sót, tiếp bước với sứ mệnh được đổi mới. Ngược: tự trách quá mức kìm hãm tiến độ; xét các sự thật mà không đổ lỗi, rồi bước tiếp.',
  },
  21: {
    zh: "完成、整合与扩张。正位，一个周期圆满收束，这段协作已准备好放大。逆位，庆祝之前先收好尾——此刻的收束，正打开下一个更大的篇章。",
    en: "Completion, integration and expansion. Upright: a cycle closes successfully and the collaboration is ready to scale. Reversed: tie off the loose ends before celebrating; this closure opens the next, larger chapter.",
    fr: "Achèvement, intégration et expansion. À l'endroit : un cycle se referme avec succès et la collaboration est prête à s'étendre. Sens inverse : terminez les détails en suspens avant de fêter ; cette clôture ouvre le chapitre suivant, plus vaste.",
    es: "Culminación, integración y expansión. Al derecho: un ciclo se cierra con éxito y la colaboración está lista para crecer. En sentido inverso: cierren los cabos sueltos antes de celebrar; este cierre abre el próximo capítulo, más amplio.",
    th: 'ความสำเร็จครบถ้วน การหลอมรวม และการขยายวง ตำแหน่งตรง: วัฏจักรหนึ่งปิดลงอย่างงดงาม และการร่วมมือพร้อมขยายใหญ่ขึ้น ตำแหน่งกลับด้าน: เก็บงานที่ค้างให้เรียบร้อยก่อนฉลอง การปิดในวันนี้กำลังเปิดบทถัดไปที่ใหญ่กว่าเดิม',
    vi: 'Hoàn tất, hội nhập và mở rộng. Thuận: một chu kỳ khép lại thành công và sự cộng tác đã sẵn sàng mở rộng. Ngược: xử lý phần việc tồn đọng trước khi ăn mừng; sự khép lại hôm nay đang mở ra chương tiếp theo lớn hơn.',
  },
  },

  friendship: {
  0: {
    zh: "朋友之间新的开始：随性、笑声与开放的心态。正位，答应那次说走就走的约定。逆位，一句轻飘飘的许诺可能会落空——把承诺放小一点，放真一点。",
    en: "A fresh start between friends: spontaneity, laughter and an open mind. Upright: say yes to the unplanned outing, together. Reversed: a casual promise may slip — keep it small and keep it real.",
    fr: "Un nouveau départ entre amis : spontanéité, rires et esprit ouvert. À l'endroit : dites oui à la sortie imprévue, ensemble. Sens inverse : une promesse légère risque de s'évaporer — gardez-la petite et sincère.",
    es: "Un comienzo fresco entre amigos: espontaneidad, risas y mente abierta. Al derecho: digan sí a la salida no planeada, juntos. En sentido inverso: una promesa a la ligera puede quedar en nada; háganla pequeña y verdadera.",
    th: 'การเริ่มต้นใหม่ระหว่างเพื่อน: ความเป็นธรรมชาติ เสียงหัวเราะ และใจที่เปิดกว้าง ตำแหน่งตรง: ตอบตกลงการผจญภัยที่ไม่ได้วางแผนไปด้วยกัน ตำแหน่งกลับด้าน: คำสัญญาลอย ๆ อาจร่วงหล่น เลือกให้เล็กลงและจริงใจขึ้น',
    vi: 'Một khởi đầu mới giữa những người bạn: tự nhiên, tiếng cười và tâm hồn cởi mở. Thuận: hãy nói có với chuyến đi chưa định trước, cùng nhau. Ngược: một lời hứa hững hờ có thể tan biến — hãy để nó nhỏ lại và chân thành hơn.',
  },
  1: {
    zh: "在对的时机说出对的话。正位，你此刻的陪伴很有分量，给予具体的帮助。逆位，别急着把一切修好——有时朋友需要的是倾听，不是方案。",
    en: "The right words at the right moment. Upright: your presence carries real weight now; offer concrete help. Reversed: do not rush to fix everything — sometimes a friend needs listening, not solutions.",
    fr: "Les mots justes au bon moment. À l'endroit : votre présence compte vraiment maintenant ; proposez une aide concrète. Sens inverse : ne cherchez pas à tout réparer — parfois un ami a besoin d'être écouté, pas conseillé.",
    es: "Las palabras justas en el momento justo. Al derecho: tu presencia tiene un efecto real ahora; ofrece ayuda concreta. En sentido inverso: no intentes arreglarlo todo; a veces un amigo necesita ser escuchado, no resolverse.",
    th: 'คำพูดที่ถูกใจในจังหวะที่ถูกต้อง ตำแหน่งตรง: การมีอยู่ของคุณมีน้ำหนักจริงในตอนนี้ เสนอความช่วยเหลือที่จับต้องได้ ตำแหน่งกลับด้าน: อย่าเร่งแก้ทุกอย่าง บางครั้งเพื่อนต้องการผู้ฟัง ไม่ใช่ผู้แก้ปัญหา',
    vi: 'Đúng lời, đúng lúc. Thuận: sự hiện diện của bạn lúc này thật sự có sức nặng; hãy đề nghị một sự giúp đỡ cụ thể. Ngược: đừng vội sửa tất cả; đôi khi một người bạn cần được lắng nghe hơn là được giải quyết.',
  },
  2: {
    zh: "超越言语的安静默契。正位，相信你对这份情谊的直觉，在对方需要时留出空间。逆位，有些话还没说出口——一句温和的询问，就能把门推开。",
    en: "A quiet understanding beyond words. Upright: trust your intuition about this bond; give space when it is needed. Reversed: something remains unsaid — a gentle question can open the door.",
    fr: "Une compréhension tranquille, au-delà des mots. À l'endroit : faites confiance à votre intuition sur ce lien ; laissez de l'espace quand il le faut. Sens inverse : quelque chose reste à dire — une question douce peut ouvrir la porte.",
    es: "Una comprensión tranquila que va más allá de las palabras. Al derecho: confía en tu intuición sobre este vínculo; da espacio cuando hace falta. En sentido inverso: algo queda por decir; una pregunta suave puede abrir la puerta.",
    th: 'ความเข้าใจอันเงียบสงบที่อยู่เหนือถ้อยคำ ตำแหน่งตรง: เชื่อสัญชาตญาณของคุณเรื่องสายสัมพันธ์นี้ และเว้นพื้นที่เมื่ออีกฝ่ายต้องการ ตำแหน่งกลับด้าน: ยังมีบางอย่างที่ไม่ได้พูด คำถามที่อ่อนโยนสามารถเปิดประตูบานนั้นได้',
    vi: 'Sự thấu hiểu lặng lẽ vượt lên lời nói. Thuận: tin vào trực giác của bạn về sự gắn kết này; nhường không gian khi cần. Ngược: vẫn còn điều chưa nói — một câu hỏi dịu dàng có thể mở cánh cửa.',
  },
  3: {
    zh: "温暖、关怀与慷慨的支持。正位，用时间与注意力滋养这份友谊，它会枝繁叶茂。逆位，关心需要双向流动——留意是否总是你在付出。",
    en: "Warmth, care and generous support. Upright: nurture this friendship with time and attention and it flourishes. Reversed: care must flow both ways — notice if you are always the one giving.",
    fr: "Chaleur, attention et soutien généreux. À l'endroit : cultivez cette amitié avec du temps et de la présence, elle fleurit. Sens inverse : l'attention doit circuler dans les deux sens ; remarquez si c'est toujours vous qui donnez.",
    es: "Calidez, cuidado y apoyo generoso. Al derecho: cultiva esta amistad con tiempo y atención y florecerá. En sentido inverso: el cuidado debe fluir en ambos sentidos; fíjate si siempre eres tú quien da.",
    th: 'ความอบอุ่น ความใส่ใจ และการสนับสนุนอย่างเอื้อเฟื้อ ตำแหน่งตรง: บ่มเพาะมิตรภาพนี้ด้วยเวลาและความใส่ใจ มันจะเบ่งบาน ตำแหน่งกลับด้าน: ความใส่ใจต้องไหลสองทาง สังเกตดูว่าคุณเป็นฝ่ายให้ตลอดหรือไม่',
    vi: 'Ấm áp, quan tâm và sự nâng đỡ hào phóng. Thuận: vun đắp tình bạn này bằng thời gian và sự chú ý, nó sẽ nở rộ. Ngược: sự quan tâm phải chảy hai chiều; hãy nhận ra nếu bạn luôn là người cho đi.',
  },
  4: {
    zh: "可靠与健康的边界。正位，做那个稳稳的人——守住承诺，也守住彼此的界限。逆位，松一松想掌控的心——谁都不定规矩，友谊才呼吸得自在。",
    en: "Reliability and healthy boundaries. Upright: be the steady one — keep your promises and respect each other's limits. Reversed: loosen the need to control; friendship breathes when neither friend sets the rules.",
    fr: "Fiabilité et limites saines. À l'endroit : soyez celui sur qui l'on peut compter — tenez vos promesses, respectez les limites de l'autre. Sens inverse : desserrez le besoin de contrôler ; l'amitié respire quand aucun des deux n'impose ses règles.",
    es: "Fiabilidad y límites sanos. Al derecho: sé en quien se puede confiar: cumple tus promesas y respeta los límites del otro. En sentido inverso: afloja las ganas de controlar; la amistad respira cuando ninguno impone las reglas.",
    th: 'ความน่าเชื่อถือและขอบเขตที่ดีต่อกัน ตำแหน่งตรง: เป็นคนที่พึ่งพาได้ รักษาสัญญา และเคารพขอบเขตของกันและกัน ตำแหน่งกลับด้าน: คลายความอยากควบคุม มิตรภาพจะหายใจได้เมื่อไม่มีใครวางกติกาให้อีกฝ่าย',
    vi: 'Đáng tin cậy và những ranh giới lành mạnh. Thuận: là điểm tựa vững vàng — giữ lời hứa, tôn trọng giới hạn của nhau. Ngược: nới lòng muốn kiểm soát; tình bạn thở được khi không ai áp đặt luật lệ.',
  },
  5: {
    zh: "共同的价值观与可信的建议。正位，依靠你们都珍视的老习惯、长辈或前辈的智慧。逆位，一起跳出惯例也无妨——你们的情谊自有它的规矩。",
    en: "Shared values and trusted advice. Upright: lean on the traditions, elders or routines you both value. Reversed: it is fine to break from convention together; your bond defines its own customs.",
    fr: "Des valeurs partagées et des conseils de confiance. À l'endroit : appuyez-vous sur les traditions, les aînés ou les routines que vous appréciez tous les deux. Sens inverse : sortir ensemble des conventions est sain ; votre lien définit ses propres coutumes.",
    es: "Valores compartidos y consejos de confianza. Al derecho: apóyense en las tradiciones, los mayores o las rutinas que ambos valoran. En sentido inverso: está bien salirse de la convención juntos; su vínculo define sus propias costumbres.",
    th: 'คุณค่าร่วมและคำแนะนำที่ไว้ใจได้ ตำแหน่งตรง: ยึดโยงกับธรรมเนียม ผู้ใหญ่ หรือกิจวัตรที่ทั้งคู่ให้ค่า ตำแหน่งกลับด้าน: การออกนอกกรอบเดิมด้วยกันก็ไม่เป็นไร สายสัมพันธ์ของคุณมีขนบของตัวเอง',
    vi: 'Giá trị chung và lời khuyên đáng tin. Thuận: dựa vào truyền thống, người đi trước hoặc những thói quen cả hai trân trọng. Ngược: cùng bước ra ngoài lề thông thường cũng không sao; sự gắn kết của các bạn có nếp riêng của nó.',
  },
  6: {
    zh: "关于亲疏的一次有意义的选择。正位，价值观的契合让信任更深。逆位，优先级不同会考验这份情谊——坦诚聊聊，别让彼此慢慢走散。",
    en: "A meaningful choice about closeness. Upright: alignment of values deepens mutual trust. Reversed: differing priorities test the bond — talk honestly rather than drifting apart.",
    fr: "Un choix significatif sur la proximité. À l'endroit : l'accord des valeurs approfondit la confiance mutuelle. Sens inverse : des priorités différentes mettent le lien à l'épreuve — parlez franchement plutôt que de vous éloigner peu à peu.",
    es: "Una elección significativa sobre la cercanía. Al derecho: la sintonía de valores profundiza la confianza mutua. En sentido inverso: prioridades distintas ponen a prueba el vínculo; hablen con honestidad en lugar de irse alejando.",
    th: 'การเลือกอันมีความหมายเกี่ยวกับความใกล้ชิด ตำแหน่งตรง: คุณค่าที่ตรงกันทำให้ความไว้ใจลึกขึ้น ตำแหน่งกลับด้าน: ลำดับความสำคัญที่ต่างกันคือบททดสอบของสายสัมพันธ์ พูดคุยกันตรง ๆ ดีกว่าปล่อยให้ห่างกันทีละนิด',
    vi: 'Một lựa chọn có ý nghĩa về khoảng cách gần. Thuận: sự tương đồng giá trị khiến niềm tin sâu thêm. Ngược: ưu tiên khác biệt thử thách sự gắn kết này — hãy nói thẳng thay vì cứ thế lùi xa dần.',
  },
  7: {
    zh: "同行的动能：出行、共同的目标、一起完成的事。正位，朝同一方向前进，为彼此打气。逆位，步调不一会带来紧张——慢下来，别让任何人掉队。",
    en: "Shared momentum: outings, projects, common goals. Upright: move in the same direction and cheer each other on. Reversed: mismatched paces create tension — slow down so nobody is left behind.",
    fr: "Un élan partagé : sorties, projets, objectifs communs. À l'endroit : avancez dans le même sens et encouragez-vous. Sens inverse : des rythmes opposés créent des tensions — ralentissez pour que personne ne reste derrière.",
    es: "Un impulso compartido: salidas, proyectos, metas comunes. Al derecho: avancen en la misma dirección y ánense mutuamente. En sentido inverso: ritmos opuestos crean tensión; vayan más despacio para que nadie se quede atrás.",
    th: 'แรงผลักด้วยกัน: ทริป โครงการ เป้าหมายร่วม ตำแหน่งตรง: ก้าวไปทางเดียวกันและเชียร์กันและกัน ตำแหน่งกลับด้าน: จังหวะที่ไม่ตรงกันสร้างความตึงเครียด ช้าลงเพื่อไม่ให้ใครตกหล่น',
    vi: 'Đà cùng nhau: chuyến đi, dự án, mục tiêu chung. Thuận: tiến về một hướng và cổ vũ lẫn nhau. Ngược: nhịp đi ngược nhau tạo căng thẳng — chậm lại để không ai bị bỏ lại phía sau.',
  },
  8: {
    zh: "真正的默契，不是争出高下，而是在意见相左时仍以耐心与善意接住彼此。正位，温和的勇气能化解摩擦。逆位，收一收“必须我对”的冲动——体谅让情谊保持温度。",
    en: "Real closeness is not about winning: it is holding each other with patience and kindness when opinions differ. Upright: gentle courage resolves friction. Reversed: soften the urge to be right; compassion keeps the bond warm.",
    fr: "La vraie proximité n'est pas une question de victoire : c'est se soutenir avec patience et bienveillance quand les opinions divergent. À l'endroit : un courage doux apaise les frictions. Sens inverse : adoucissez l'envie d'avoir raison ; la bienveillance garde le lien chaleureux.",
    es: "La verdadera complicidad no es ganar la discusión; es sostenerse con paciencia y bondad cuando las opiniones difieren. Al derecho: un valor sereno aplaca las fricciones. En sentido inverso: suaviza las ganas de tener la razón; la compasión mantiene cálido el vínculo.",
    th: 'ความใกล้ชิดที่แท้จริงไม่ใช่เรื่องชนะหรือแพ้ แต่คือการรองรับกันด้วยความอดทนและความเมตตาเมื่อความคิดเห็นต่างกัน ตำแหน่งตรง: ความกล้าหาญที่อ่อนโยนคลี่คลายความขัดแย้ง ตำแหน่งกลับด้าน: บรรเทาความอยากเป็นฝ่ายถูก ความเมตตาทำให้สายสัมพันธ์อบอุ่น',
    vi: 'Sự tin cậy thật sự không phải là thắng thua; đó là nâng đỡ nhau bằng kiên nhẫn và tử tế khi quan điểm khác biệt. Thuận: lòng can đảm dịu dàng hóa giải va chạm. Ngược: làm dịu cơn muốn đúng; sự cảm thông giữ cho sự gắn kết ấm áp.',
  },
  9: {
    zh: "朋友需要独处，或者你需要。正位，尊重对方对安静的需要，不必往心里去。逆位，疏离已持续太久——发一条简单、不带压力的讯息吧。",
    en: "A friend needs solitude, or you do. Upright: respect the need for quiet without taking it personally. Reversed: the withdrawal has lasted long — send a simple, pressure-free message.",
    fr: "Un ami a besoin de solitude, ou vous. À l'endroit : respectez ce besoin de calme sans le prendre pour vous. Sens inverse : le retrait dure trop longtemps — envoyez un message simple, sans pression.",
    es: "Un amigo necesita soledad, o la necesitas tú. Al derecho: respeta esa necesidad de calma sin tomártelo como algo personal. En sentido inverso: el alejamiento dura demasiado; escribe un mensaje simple y sin presión.",
    th: 'เพื่อนต้องการความสงบ หรือคุณเองที่ต้องการ ตำแหน่งตรง: เคารพความต้องการนั้นโดยไม่ยึดเป็นเรื่องส่วนตัว ตำแหน่งกลับด้าน: การถอยห่างนานเกินไปแล้ว ส่งข้อความสั้น ๆ ที่ไม่กดดัน',
    vi: 'Một người bạn cần riêng tư, hoặc bạn cần. Thuận: tôn trọng nhu cầu yên tĩnh ấy, đừng coi là chuyện cá nhân. Ngược: sự lui xa đã kéo dài quá — gửi một tin nhắn đơn giản, không áp lực.',
  },
  10: {
    zh: "友谊的周期：重逢、距离、变化。正位，迎接这一转——更亲近的季节正在开始。逆位，一个阶段正在结束——一起顺势调整，别硬留住过去的样子。",
    en: "The cycles of a friendship: reunions, distance, change. Upright: welcome the turn — a season of closeness is beginning. Reversed: a phase is ending; adapt together rather than clinging to how things were.",
    fr: "Les cycles d'une amitié : retrouvailles, distance, changement. À l'endroit : accueillez le tournant — une saison de proximité commence. Sens inverse : une phase se termine ; adaptez-vous ensemble plutôt que de vous accrocher à ce qui était.",
    es: "Los ciclos de una amistad: reencuentros, distancia, cambio. Al derecho: recibe el giro; comienza una temporada de cercanía. En sentido inverso: una etapa termina; adáptense juntos en vez de aferrarse a lo que era.",
    th: 'วัฏจักรของมิตรภาพ: การกลับมาพบ ระยะห่าง ความเปลี่ยนแปลง ตำแหน่งตรง: ต้อนรับการหมุนเปลี่ยน ฤดูแห่งความใกล้ชิดกำลังเริ่ม ตำแหน่งกลับด้าน: หนึ่งช่วงกำลังจบลง ปรับตัวไปด้วยกันดีกว่ายึดติดกับความเป็นเมื่อก่อน',
    vi: 'Các chu kỳ của tình bạn: hội ngộ, xa cách, đổi thay. Thuận: đón nhận bước ngoặt — một mùa gần gũi đang bắt đầu. Ngược: một giai đoạn khép lại; cùng thích nghi thay vì níu giữ dáng vẻ ngày cũ.',
  },
  11: {
    zh: "诚实与平衡。正位，带着善意说真话，让付出与接收保持对等。逆位，一处没说出口的失衡需要摊开——公平，能让朋友之间重归轻松。",
    en: "Honesty and balance. Upright: speak the truth with kindness; keep giving and receiving even. Reversed: an unspoken imbalance needs airing — fairness brings ease back between friends.",
    fr: "Honnêteté et équilibre. À l'endroit : dites la vérité avec douceur ; gardez le donner et le recevoir à égalité. Sens inverse : un déséquilibre non dit a besoin d'être posé — l'équité rend la légèreté entre amis.",
    es: "Honestidad y equilibrio. Al derecho: di la verdad con amabilidad; mantén equilibrados el dar y el recibir. En sentido inverso: un desequilibrio no dicho necesita hablar; la justicia devuelve la ligereza entre amigos.",
    th: 'ความซื่อสัตย์และความสมดุล ตำแหน่งตรง: พูดความจริงด้วยความอ่อนโยน รักษาสมดุลระหว่างการให้และการรับ ตำแหน่งกลับด้าน: ความไม่สมดุลที่ยังไม่ได้พูดต้องถูกเปิดออกมา ความยุติธรรมนำความเบาสบายกลับมาหาเพื่อนทั้งสอง',
    vi: 'Chân thành và cân bằng. Thuận: nói thật với lòng tốt; giữ cho cho đi và nhận về cân xứng. Ngược: một mất cân bằng chưa nói ra cần được nói ra; sự công bằng trả lại nhẹ nhàng giữa những người bạn.',
  },
  12: {
    zh: "换个角度看这份友谊。正位，暂停，放下旧怨，新的画面自然出现。逆位，抓着过时的期待会带来紧绷——松手，人就松了。",
    en: "Seeing the friendship from a new angle. Upright: pause, let go of an old grudge and a fresh view appears. Reversed: clinging to a stale expectation brings strain — release it and relax.",
    fr: "Voir l'amitié sous un angle neuf. À l'endroit : faites une pause, lâchez une vieille rancune et une vision fraîche apparaît. Sens inverse : s'accrocher à une attente dépassée crée de la tension ; relâchez et détendez-vous.",
    es: "Ver la amistad desde un ángulo nuevo. Al derecho: haz una pausa, suelta un viejo reproche y aparece una visión fresca. En sentido inverso: aferrarse a una expectativa caducada genera tensión; suéltala y relájate.",
    th: 'มองมิตรภาพจากมุมใหม่ ตำแหน่งตรง: หยุดพัก ปล่อยวางความขุ่นเคืองเดิม แล้วภาพใหม่จะปรากฏ ตำแหน่งกลับด้าน: การยึดติดกับความคาดหวังเก่าสร้างความตึงเครียด ปล่อยมันไปแล้วจะรู้สึกโล่ง',
    vi: 'Nhìn tình bạn từ một góc mới. Thuận: tạm dừng, buông một ký ức hằn học cũ, một góc nhìn mới sẽ hiện ra. Ngược: bám víu kỳ vọng lỗi thời tạo căng thẳng; hãy buông để nhẹ lòng.',
  },
  13: {
    zh: "友谊在演变：一章结束，另一章开启。正位，让旧的相处模式退场，情谊才能长成下一种模样。逆位，放手已完成的部分——在这里，转变是友善的。",
    en: "A friendship evolves: one chapter ends, another begins. Upright: let the old pattern go so the bond can grow into its next form. Reversed: release what is finished; here, transformation is friendly.",
    fr: "Une amitié évolue : un chapitre se ferme, un autre s'ouvre. À l'endroit : laissez l'ancien modèle s'en aller pour que le lien prenne sa prochaine forme. Sens inverse : libérez ce qui est fini ; ici, la transformation est bienveillante.",
    es: "Una amistad evoluciona: un capítulo termina, otro comienza. Al derecho: deja que el viejo patrón se vaya para que el vínculo crezca hacia su próxima forma. En sentido inverso: suelta lo que ya terminó; aquí la transformación es amable.",
    th: 'มิตรภาพเปลี่ยนรูป: บทหนึ่งจบ อีกบทเริ่ม ตำแหน่งตรง: ปล่อยให้รูปแบบเดิมผ่านไป เพื่อให้สายสัมพันธ์เติบโตสู่ร่างถัดไป ตำแหน่งกลับด้าน: ปล่อยวางสิ่งที่จบแล้ว ที่นี่การเปลี่ยนแปลงเป็นมิตร',
    vi: 'Tình bạn vận động: một chương khép lại, một chương mở ra. Thuận: để nếp cũ rời đi để sự gắn kết lớn lên thành hình dạng tiếp theo. Ngược: buông bỏ điều đã kết thúc; ở đây, chuyển hóa là điều tốt lành.',
  },
  14: {
    zh: "以适度带来和谐。正位，耐心调和不同的脾气，相处便毫不费力。逆位，重新校准——太密或太远都不好，找回中间的节奏。",
    en: "Harmony through moderation. Upright: blend different temperaments with patience and the friendship feels effortless. Reversed: recalibrate — too much intensity or too much distance; find the middle rhythm again.",
    fr: "L'harmonie par la mesure. À l'endroit : mariez les tempéraments différents avec patience et l'amitié devient fluide. Sens inverse : recalibrez — trop d'intensité ou trop de distance ; retrouvez le rythme du milieu.",
    es: "La armonía por la mesura. Al derecho: mezcla los temperamentos distintos con paciencia y la amistad fluye sin esfuerzo. En sentido inverso: recalibra: demasiada intensidad o demasiada distancia; recupera el ritmo intermedio.",
    th: 'ความกลมกลืนด้วยความพอดี ตำแหน่งตรง: ผสมอุปนิสัยที่ต่างกันด้วยความอดทน แล้วมิตรภาพจะราบรื่น ตำแหน่งกลับด้าน: ปรับจูนใหม่ รุนแรงเกินไปหรือห่างเกินไป กลับไปที่จังหวะกลาง ๆ',
    vi: 'Hài hòa nhờ chừng mực. Thuận: pha trộn những tính cách khác nhau bằng kiên nhẫn, tình bạn trở nên nhẹ nhàng vô cùng. Ngược: hiệu chỉnh lại — quá dồn dập hoặc quá xa cách; tìm lại nhịp ở giữa.',
  },
  15: {
    zh: "执念、比较或亏欠感。正位，看清那个让你被绑住的模式——较劲、内疚或依赖。逆位，解开这根绳——真正的友谊是选择，从来不是欠。",
    en: "Attachment, comparison or a sense of obligation. Upright: notice the pattern that binds — rivalry, guilt or dependency. Reversed: free yourself from the tie; a true friendship is chosen, never owed.",
    fr: "Attachement, comparaison, obligation. À l'endroit : repérez le schéma qui attache — rivalité, culpabilité ou dépendance. Sens inverse : libérez-vous du lien ; une vraie amitié se choisit, elle ne se doit jamais.",
    es: "Apego, comparación u obligación. Al derecho: detecta el patrón que ata: rivalidad, culpa o dependencia. En sentido inverso: libérate de la atadura; una amistad verdadera se elige, nunca se debe.",
    th: 'ความยึดติด การเปรียบเทียบ หรือความรู้สึกเป็นหนี้ ตำแหน่งตรง: มองเห็นรูปแบบที่พันธนาการ การแข่งขัน ความรู้สึกผิด หรือการพึ่งพา ตำแหน่งกลับด้าน: ปลดปล่อยตัวเองจากสายนั้น มิตรภาพที่แท้คือสิ่งที่เลือก ไม่ใช่สิ่งที่ต้องตอบแทน',
    vi: 'Bám víu, so sánh hoặc cảm giác mắc nợ. Thuận: nhận ra khuôn mẫu trói buộc — cạnh tranh, mặc cảm tội lỗi hoặc phụ thuộc. Ngược: tự giải thoát khỏi sợi dây ấy; tình bạn thật là sự lựa chọn, không bao giờ là món nợ.',
  },
  16: {
    zh: "一则突如其来的真相重塑这段情谊。正位，坦诚的摊牌把空气洗净，在坚实的地基上重建。逆位，紧张暂被化解——趁它重新堆积之前，好好谈一谈。",
    en: "A sudden truth reshapes the bond. Upright: an honest reckoning clears the air and rebuilds on solid ground. Reversed: tension is defused for now — talk it through before it builds again.",
    fr: "Une vérité soudaine redessine le lien. À l'endroit : un échange franc purifie l'air et l'on rebâtit sur sol ferme. Sens inverse : la tension est désamorcée pour l'instant — parlez-en avant qu'elle ne remonte.",
    es: "Una verdad repentina redibuja el vínculo. Al derecho: una conversación franca limpia el aire y se reconstruye sobre suelo firme. En sentido inverso: la tensión se desactiva por ahora; háblenla antes de que vuelva a crecer.",
    th: 'ความจริงที่มากระทันหันปรับรูปสายสัมพันธ์ใหม่ ตำแหน่งตรง: การพูดคุยตรงไปตรงมาทำให้อากาศบริสุทธิ์ และสร้างใหม่บนพื้นที่มั่นคง ตำแหน่งกลับด้าน: ความตึงเครียดถูกลดลงชั่วคราว พูดคุยกันให้จบก่อนที่มันจะสะสมอีก',
    vi: 'Một sự thật bất ngờ định hình lại sự gắn kết. Thuận: một cuộc nói chuyện thẳng thắn làm không khí trong lành và xây lại trên nền vững. Ngược: căng thẳng tạm được hóa giải — hãy nói hết trước khi nó tích tụ trở lại.',
  },
  17: {
    zh: "希望、忠诚与安静的鼓励。正位，做那个相信朋友梦想的人，把愿景分享给对方。逆位，一段低潮期——温和的陪伴，比建议更有疗愈力。",
    en: "Hope, loyalty and quiet encouragement. Upright: be the friend who believes in the other's dream; share the vision. Reversed: a period of doubt — gentle presence heals more than advice.",
    fr: "Espérance, loyauté et encouragement discret. À l'endroit : soyez l'ami qui croit au rêve de l'autre ; partagez la vision. Sens inverse : une période de doute — une présence douce fait plus qu'un conseil.",
    es: "Esperanza, lealtad y ánimo sereno. Al derecho: sé el amigo que cree en el sueño del otro; comparte la visión. En sentido inverso: una etapa de dudas; una presencia amable sana más que un consejo.",
    th: 'ความหวัง ความภักดี และกำลังใจที่เงียบสงบ ตำแหน่งตรง: เป็นเพื่อนที่เชื่อในความฝันของอีกฝ่าย แบ่งปันวิสัยทัศน์ ตำแหน่งกลับด้าน: ช่วงเวลาแห่งความสงสัย การอยู่เคียงอย่างอ่อนโยนช่วยรักษาได้มากกว่าคำแนะนำ',
    vi: 'Hy vọng, trung thành và lời động viên lặng lẽ. Thuận: là người bạn tin vào giấc mơ của người kia; chia sẻ tầm nhìn. Ngược: giai đoạn hoài nghi — sự hiện diện dịu dàng chữa lành hơn lời khuyên.',
  },
  18: {
    zh: "困惑、没说出口的情绪、误读的信号。正位，别急着认定——先问清，再回应你以为察觉到的东西。逆位，薄雾散去——一次敞开的对话，就能化解误会。",
    en: "Confusion, unspoken feelings, misread signals. Upright: do not assume — ask before reacting to what you think you sensed. Reversed: the mist clears; an open conversation dissolves the misunderstanding.",
    fr: "Confusion, émotions tues, signaux mal lus. À l'endroit : ne présumez rien — demandez avant de réagir à ce que vous croyez avoir perçu. Sens inverse : la brume se dissipe ; une conversation ouverte dissout le malentendu.",
    es: "Confusión, emociones no dichas, señales malinterpretadas. Al derecho: no des nada por hecho; pregunta antes de reaccionar a lo que creíste percibir. En sentido inverso: la niebla se disipa; una conversación abierta disuelve el malentendido.",
    th: 'ความสับสน ความรู้สึกที่ยังไม่ได้พูด สัญญาณที่ตีความผิด ตำแหน่งตรง: อย่าสรุปเอง ถามก่อนตอบโต้ต่อสิ่งที่คุณคิดว่าได้สัมผัส ตำแหน่งกลับด้าน: หมอกจางลง บทสนทนาที่เปิดใจช่วยลบล้างความเข้าใจผิด',
    vi: 'Bối rối, cảm xúc chưa nói, tín hiệu hiểu lầm. Thuận: đừng vội kết luận — hỏi trước khi phản ứng với điều bạn nghĩ mình nhận ra. Ngược: màn sương tan; một cuộc trò chuyện cởi mở hóa giải hiểu lầm.',
  },
  19: {
    zh: "喜悦、开放与共同的成就。正位，一起庆祝；真诚会照亮这份友谊周围的一切。逆位，收敛一些期待——温度不减，但保持务实。",
    en: "Joy, openness and shared success. Upright: celebrate together; sincerity brightens everything around this friendship. Reversed: lower the expectations a little — keep the warmth but stay realistic.",
    fr: "Joie, ouverture et réussite partagée. À l'endroit : célébrez ensemble ; la sincérité illumine tout autour de cette amitié. Sens inverse : tempérez les attentes ; gardez la chaleur mais restez réaliste.",
    es: "Alegría, apertura y logros compartidos. Al derecho: celebren juntos; la sinceridad ilumina todo lo que rodea esta amistad. En sentido inverso: modera las expectativas; conserva la calidez pero mantente realista.",
    th: 'ความปีติ ความเปิดกว้าง และความสำเร็จร่วมกัน ตำแหน่งตรง: ฉลองด้วยกัน ความจริงใจส่องสว่างทุกสิ่งรอบมิตรภาพนี้ ตำแหน่งกลับด้าน: ลดความคาดหวังลง คงความอบอุ่นไว้ แต่จงสมจริง',
    vi: 'Niềm vui, cởi mở và thành công chung. Thuận: cùng ăn mừng; sự chân thành soi sáng mọi điều quanh tình bạn này. Ngược: hạ kỳ vọng; giữ hơi ấm nhưng hãy thực tế.',
  },
  20: {
    zh: "一次坦诚的清算与全新的开始。正位，宽恕，该道歉时道歉，一起带着更新后的心情再出发。逆位，放下心里的记分牌——指责只会让友谊困在过去。",
    en: "An honest reckoning and a fresh start. Upright: forgive, apologize where needed and move forward together, renewed. Reversed: drop the inner scorecard; blame keeps the friendship stuck in the past.",
    fr: "Un bilan honnête et un nouveau départ. À l'endroit : pardonnez, excusez-vous quand il le faut et repartez ensemble, renouvelés. Sens inverse : abandonnez le compteur intérieur ; le blâme garde l'amitié rivée au passé.",
    es: "Un balance honesto y un comienzo nuevo. Al derecho: perdona, discúlpate cuando haga falta y vuelvan a empezar renovados. En sentido inverso: deja el marcador interno; la culpa mantiene la amistad anclada al pasado.",
    th: 'การทบทวนอย่างจริงใจและการเริ่มใหม่ ตำแหน่งตรง: ให้อภัย ขอโทษเมื่อจำเป็น และก้าวต่อไปด้วยกันอย่างมีพลังใหม่ ตำแหน่งกลับด้าน: วางสมุดบันทึกคะแนนในใจ การโทษทำให้มิตรภาพติดอยู่ในอดีต',
    vi: 'Một cuộc nhìn nhận thật lòng và khởi đầu mới. Thuận: tha thứ, xin lỗi khi cần và cùng bước tiếp với tâm thế mới. Ngược: gác bảng điểm trong lòng; trách móc chỉ giữ tình bạn kẹt trong quá khứ.',
  },
  21: {
    zh: "圆满与长久以来的信任。正位，一个周期完成；这份友谊完整、踏实，准备好走向更宽。逆位，温和地收好未完的线头——完成，正打开下一个更丰盛的篇章。",
    en: "Wholeness and long-standing trust. Upright: a cycle completes; the friendship feels whole, grounded and ready to widen. Reversed: gently tie off the loose ends — completion opens the next, richer chapter.",
    fr: "Plénitude et confiance de longue date. À l'endroit : un cycle s'achève ; l'amitié se sent complète, solide et prête à s'élargir. Sens inverse : refermez doucement les fils suspendus ; l'achèvement ouvre le chapitre suivant, plus riche.",
    es: "Plenitud y confianza de largo plazo. Al derecho: un ciclo se completa; la amistad se siente entera, firme y lista para ampliarse. En sentido inverso: cierra con dulzura los cabos pendientes; el cierre abre el próximo capítulo, más rico.",
    th: 'ความครบถ้วนและความไว้ใจที่สั่งสมมายาวนาน ตำแหน่งตรง: วัฏจักรหนึ่งสำเร็จลุล่วง มิตรภาพรู้สึกครบถ้วน มั่นคง และพร้อมกว้างขึ้น ตำแหน่งกลับด้าน: ปิดเรื่องค้างอย่างอ่อนโยน ความสำเร็จนี้กำลังเปิดบทถัดไปที่เข้มข้นยิ่งขึ้น',
    vi: 'Trọn vẹn và niềm tin lâu năm. Thuận: một chu kỳ hoàn tất; tình bạn thấy trọn vẹn, vững chãi và sẵn sàng mở rộng. Ngược: khép lại những đầu việc lửng lơ một cách dịu dàng; sự hoàn tất mở ra chương tiếp theo đầy đủ hơn.',
  },
  },
});

/** 场景牌义取值：非 business/friendship 或缺行 ⇒ ''（调用方回落 tarot.ts 情爱牌义） */
export function tarotSceneMeaning(cardId, lang, scene) {
  if (scene !== 'business' && scene !== 'friendship') return '';
  const row = TAROT_SCENE_MEANING[scene][Number(cardId)];
  if (!row) return '';
  const L = String(lang || 'en').split('-')[0];
  return row[L] || row.en || '';
}

/* ── ✦ E159-刀五（主公军令 2026-11-27）：正/逆位分离 —— 场景牌义每条含「正位/逆位」两段启示，
      旧实现整段喂给模型 ⇒ 逆位牌下混排正位指令。按实抽方位只截取对应半句（264 条六语标记全量校验）。
      reversed 未传 ⇒ 整段原样（旧调用形态零变）；无方位标记 ⇒ 整段 fail-soft。 ── */
const ORIENT_MARK = Object.freeze({
  zh: [/正位[时]?[，,:：]/, /逆位[时]?[，,:：]/],
  en: [/Upright:/, /Reversed:/],
  fr: [/À l'endroit :/, /Sens inverse :/],
  es: [/Al derecho:/, /En sentido inverso:/],
  th: [/ตำแหน่งตรง:/, /ตำแหน่งกลับด้าน:/],
  vi: [/Thuận:/, /Ngược:/],
});
export function tarotOrientSlice(text, lang, reversed) {
  const t = String(text || '');
  const L = String(lang || 'en').split('-')[0];
  const M = ORIENT_MARK[L] || ORIENT_MARK.en;
  const r = t.search(M[1]);
  if (reversed !== true && reversed !== false) return t;
  if (r < 0) return t;
  if (reversed === true) return t.slice(r).replace(M[1], '').trim();
  const u = t.search(M[0]);
  if (u >= 0 && u < r) return (t.slice(0, u) + t.slice(u, r)).trim();
  return t.slice(0, r).trim();
}
