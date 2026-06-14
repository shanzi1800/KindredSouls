// tarot-cards.js — 22 Major Arcana (7 languages: zh/en/fr/es/th/vi)
// Generated with Thai + Vietnamese localization for KindredSouls

const MAJOR_ARCANA = [
  {
    id: 0,
    name: { zh: "愚人", en: "The Fool", fr: "Le Mat", es: "El Loco", th: "เดอะฟูล", vi: "Kẻ Ngốc" },
    emoji: "🌟",
    upright: {
      zh: "TA在这段关系里感到新鲜感和冲动，愿意为你冒险，但心思漂浮，需要你给这段热情加现实的锚。",
      en: "Fresh and spontaneous, ready to take risks with you. Anchor this passion with grounding.",
      fr: "Fraîcheur et spontanéité, prêts à prendre des risques avec vous.",
      es: "Frescura y espontaneidad, listos para arriesgarse.",
      th: "การเริ่มต้นใหม่ที่บริสุทธิ์เปี่ยมศักยภาพ",
      vi: "Sự khởi đầu mới tinh khiết đầy tiềm năng"
    },
    reversed: {
      zh: "TA感到迷茫或害怕承担责任，冷淡可能是在逃避压力，需要静下心来沟通。",
      en: "Lost or afraid of commitment. Coldness could be escaping real pressures.",
      fr: "Perdus ou peur de s'engager.",
      es: "Perdido o temeroso de comprometerse.",
      th: "การขาดความรับผิดชอบหรือความประมาท",
      vi: "Thiếu trách nhiệm hoặc bất cẩn"
    }
  },
  {
    id: 1,
    name: { zh: "魔术师", en: "The Magician", fr: "Le Bateleur", es: "El Mago", th: "จอมเวทย์", vi: "Nhà Ảo Thuật" },
    emoji: "🔮",
    upright: {
      zh: "TA觉得你非常有吸引力，TA正在主动规划你们的未来，有能力把想法变成现实。",
      en: "Incredibly attractive. Strong chemistry, actively planning your shared future.",
      fr: "Incrouyablement attirant. Forte alchimie, planifiant activement.",
      es: "Increíblemente atractivo. Fuerte química, planificando activamente.",
      th: "ความสามารถบรรลุเป้าหมาย",
      vi: "Khả năng đạt được mục tiêu"
    },
    reversed: {
      zh: "TA可能在用话术或小套路掩饰真心，或者你被TA的表面现象所迷惑。",
      en: "Hidden motives or exaggerations may be at play.",
      fr: "Motifs cachés ou exagérations.",
      es: "Motivos ocultos o exageraciones.",
      th: "การใช้พลังในทางที่ผิด",
      vi: "Lạm dụng quyền lực"
    }
  },
  {
    id: 2,
    name: { zh: "女祭司", en: "The High Priestess", fr: "La Papesse", es: "La Sacerdotisa", th: "หญิงชาววัด", vi: "Nữ Tu" },
    emoji: "🌙",
    upright: {
      zh: "TA有些心思和秘密没有坦白，或者过于理智冷漠，让你捉摸不透。",
      en: "Hiding thoughts or secrets. Overly rational and detached lately.",
      fr: "Cache des pensées ou secrets. Trop rationnels.",
      es: "Ocultando pensamientos o secretos. Muy racionales.",
      th: "การรอคอยสิ่งดีๆ",
      vi: "Chờ đợi điều tốt đẹp sắp đến"
    },
    reversed: {
      zh: "直觉在告诉你某些被忽视的信号，TA其实在乎你，只是不知道怎么表达。",
      en: "Intuition tells you about neglected signals. They care but don't know how to express.",
      fr: "Votre intuition vous dit quelque chose.",
      es: "Tu intuición te dice algo.",
      th: "ความล่าช้าและความผิดหวัง",
      vi: "Trì hoãn và thất vọng"
    }
  },
  {
    id: 3,
    name: { zh: "女皇", en: "The Empress", fr: "L'Impératrice", es: "La Emperatriz", th: "จักรพรรดินี", vi: "Nữ Hoàng" },
    emoji: "🌺",
    upright: {
      zh: "TA最近可能觉得你占有欲过强，或者感到了压迫感，需要给彼此一点呼吸空间。",
      en: "Too possessive or emotional suffocation in the relationship.",
      fr: "Trop possessif(-ve) ou oppression émotionnelle.",
      es: "Demasiado posesivo/a o sofocación emocional.",
      th: "ความมั่นคงและความอบอุ่นในครอบครัว",
      vi: "Sự ổn định và ấm áp gia đình"
    },
    reversed: {
      zh: "TA的控制欲源于深层不安全感，多给予理解和肯定，能软化TA的心。",
      en: "Control stems from deep insecurity. More understanding will soften them.",
      fr: "Leur contrôle vient d'insécurité profonde.",
      es: "Su control viene de inseguridad profunda.",
      th: "ความไม่มั่นคงทางอารมณ์",
      vi: "Bất ổn cảm xúc"
    }
  },
  {
    id: 4,
    name: { zh: "皇帝", en: "The Emperor", fr: "L'Empereur", es: "El Emperador", th: "จักรพรรดิ", vi: "Nam Hoàng" },
    emoji: "👑",
    upright: {
      zh: "TA性格强势有主见，渴望掌控全局，这是TA表达爱的方式——给你安全感。",
      en: "Strong-willed and authoritative. This is their way of showing love.",
      fr: "Fort et autoritaire. C'est leur façon d'aimer.",
      es: "Fuerte y autoritario. Es su forma de amar.",
      th: "ความสำเร็จและความเป็นผู้นำ",
      vi: "Thành công và tài lãnh đạo"
    },
    reversed: {
      zh: "TA的大男子主义或过于死板让你感到窒息，两人的步调没有踩在同一个点上。",
      en: "Authoritarian nature causes suffocation. Out of sync.",
      fr: "Autoritarisme étouffe.",
      es: "Autoritarismo sofoca.",
      th: "ความเผด็จการและการขาดความยืดหยุ่น",
      vi: "Độc đoán và thiếu linh hoạt"
    }
  },
  {
    id: 5,
    name: { zh: "教皇", en: "The Hierophant", fr: "Le Pape", es: "El Papa", th: "ศาสนาจารย์", vi: "Giáo Sĩ" },
    emoji: "🙏",
    upright: {
      zh: "TA渴望精神层面的深层连接，这段关系有潜力成为彼此生命中最稳固的支撑。",
      en: "Crave deep spiritual connection. Can be your strongest anchor.",
      fr: "Aspirent à connexion spirituelle profonde.",
      es: "Aspiran conexión espiritual profunda.",
      th: "การเลือกเส้นทางที่ถูกต้อง",
      vi: "Chọn đúng con đường"
    },
    reversed: {
      zh: "TA被传统观念束缚，可能在用社会标准来评判你们的关系，试着打破框架。",
      en: "Bound by tradition. Question the framework.",
      fr: "Liés par la tradition.",
      es: "Limitados por la tradición.",
      th: "การตัดสินใจที่ผิดพลาด",
      vi: "Quyết định sai từ lời khuyên"
    }
  },
  {
    id: 6,
    name: { zh: "恋人", en: "The Lovers", fr: "Les Amoureux", es: "Los Amantes", th: "ราชินีแห่งคู่รัก", vi: "Nữ Hoàng Tình Yêu" },
    emoji: "💕",
    upright: {
      zh: "你们之间有极强的化学反应和价值观共鸣，TA视你为灵魂伴侣。",
      en: "Strong chemistry and values alignment. Soulmate connection.",
      fr: "Forte alchimie et valeurs. Âme sœur.",
      es: "Fuerte química y valores. Alma gemela.",
      th: "ความสามัคคีและความรักที่ลึกซึ้ง",
      vi: "Hòa hợp và tình yêu sâu sắc"
    },
    reversed: {
      zh: "选择让你们都感到纠结，可能有外部压力干扰了你们的判断。",
      en: "A choice causes dilemma. External pressures may interfere.",
      fr: "Un choix cause des dilemmes.",
      es: "Una elección causa dilemas.",
      th: "ความขัดแย้งในความสัมพันธ์",
      vi: "Xung đột trong mối quan hệ"
    }
  },
  {
    id: 7,
    name: { zh: "战车", en: "The Chariot", fr: "Le Chariot", es: "El Carro", th: "ราชารถ", vi: "Chiến Xa" },
    emoji: "🏛️",
    upright: {
      zh: "不管遇到什么阻碍，TA抱有坚定决心要和你走下去。",
      en: "Firm resolve to make this work no matter the obstacles.",
      fr: "Ferme résolution malgré les obstacles.",
      es: "Firme resolución a pesar de los obstáculos.",
      th: "ความมุ่งมั่นและชัยชนะ",
      vi: "Quyết tâm và chiến thắng"
    },
    reversed: {
      zh: "感情失去了方向，两人都在向不同方向拉扯，缺乏协调。",
      en: "Lost direction. Both pulling in different directions.",
      fr: "Perdus, tous les deux.",
      es: "Sin dirección.",
      th: "การขาดแบบแผนหรือการสูญเสียการควบคุม",
      vi: "Thiếu kế hoạch hoặc mất kiểm soát"
    }
  },
  {
    id: 8,
    name: { zh: "力量", en: "Strength", fr: "La Force", es: "La Fuerza", th: "พลัง", vi: "Sức Mạnh" },
    emoji: "🦁",
    upright: {
      zh: "TA非常吃你温柔包容的那一套，你在这段关系里占据温柔的主导权。",
      en: "Respond to your warmth and patience. Gentle dominance.",
      fr: "Répondent à votre chaleur et patience.",
      es: "Responden a tu calidez y paciencia.",
      th: "ความกล้าและความอดทน",
      vi: "Dũng cảm và kiên nhẫn"
    },
    reversed: {
      zh: "TA内心感到疲惫软弱，容易因为小事引发自卑与暴躁，需要你拉TA一把。",
      en: "Feel exhausted and weak. Small things trigger insecurity.",
      fr: "Épuisés. Petites choses déclenchent insécurité.",
      es: "Agotados. Cosas pequeñas disparan inseguridad.",
      th: "ความกลัวและความอ่อนแอ",
      vi: "Sợ hãi và yếu đuối"
    }
  },
  {
    id: 9,
    name: { zh: "隐士", en: "The Hermit", fr: "L'Ermite", es: "El Ermitaño", th: "ฤๅษี", vi: "Nhà Ẩn Sĩ" },
    emoji: "🏔️",
    upright: {
      zh: "TA需要独处的时间来处理内心，但你主动的陪伴能让TA更快回归。",
      en: "Need solitude but your presence brings them back faster.",
      fr: "Besoin de solitude mais votre présence les ramène.",
      es: "Necesitan soledad pero tu presencia los trae de vuelta.",
      th: "การเดินทางแห่งการค้นพบตัวเอง",
      vi: "Hành trình khám phá bản thân"
    },
    reversed: {
      zh: "TA在逃避现实，在关系中显得过于退缩，需要你主动打破沉默。",
      en: "Retreating. Break the silence first.",
      fr: "Se retirent. Brisez le silence.",
      es: "Se están retirando. Rompe el silencio.",
      th: "การหลงทางหรือการถอยกลับ",
      vi: "Đi lạc hoặc rút lui"
    }
  },
  {
    id: 10,
    name: { zh: "命运之轮", en: "Wheel of Fortune", fr: "La Roue de Fortune", es: "La Rueda de la Fortuna", th: "ล้อแห่งโชคชะตา", vi: "Bánh Xe Vận Mệnh" },
    emoji: "🎡",
    upright: {
      zh: "命运的齿轮正在转动，这是你们关系的关键转折点，顺势而为会有惊喜。",
      en: "The wheel is turning. Pivotal moment. Go with the flow.",
      fr: "La roue tourne. Moment charnière.",
      es: "La rueda gira. Momento crucial.",
      th: "การเปลี่ยนแปลงและโชคชะตา",
      vi: "Thay đổi và vận may"
    },
    reversed: {
      zh: "意外的挑战突然出现，打乱了你们的计划，需要灵活应对。",
      en: "Unexpected challenges disrupt plans. Stay flexible.",
      fr: "Défis inattendus perturbent les plans.",
      es: "Desafíos inesperados interrumpen planes.",
      th: "อุปสรรคที่หยุดยั้งการเคลื่อนไหว",
      vi: "Trở ngại cản trở tiến bộ"
    }
  },
  {
    id: 11,
    name: { zh: "正义", en: "Justice", fr: "La Justice", es: "La Justicia", th: "ความยุติธรรม", vi: "Công Lý" },
    emoji: "⚖️",
    upright: {
      zh: "TA的决策基于公平和逻辑，你们的关系在理性框架下稳定发展。",
      en: "Fair and logical decisions. Stable, principled growth.",
      fr: "Décisions justes et logiques.",
      es: "Decisiones justas y lógicas.",
      th: "ความสมดุลและความยุติธรรม",
      vi: "Cân bằng và công lý"
    },
    reversed: {
      zh: "TA可能在权衡某些决定的利弊，迟迟不做承诺是因为怕伤害你。",
      en: "Weighing pros and cons. Hesitating to protect you.",
      fr: "Pesant le pour et le contre.",
      es: "Pesando pros y contras.",
      th: "การตัดสินที่ไม่เป็นธรรมและความลำเอียง",
      vi: "Phán xét không công bằng"
    }
  },
  {
    id: 12,
    name: { zh: "倒吊人", en: "The Hanged Man", fr: "Le Pendu", es: "El Colgado", th: "ผู้ถูกตัดหัว", vi: "Người Bị Mất Đầu" },
    emoji: "🗼",
    upright: {
      zh: "TA愿意为这段关系暂停自我，牺牲是TA无声的爱的表达。",
      en: "Pause ego for this relationship. Sacrifice is love language.",
      fr: "Suspendent leur ego pour cette relation.",
      es: "Suspenden su ego por esta relación.",
      th: "การเปลี่ยนแปลงครั้งใหญ่และการเริ่มต้นใหม่",
      vi: "Thay đổi lớn và khởi đầu mới"
    },
    reversed: {
      zh: "TA在关系里感到困住，或正在用受害者心态逃避责任，需要换位思考。",
      en: "Trapped or playing victim. Reframe perspective.",
      fr: "Piégés ou victimes.",
      es: "Atrapados o victimizados.",
      th: "ความวิตกกังวลและการหยุดชะงัก",
      vi: "Lo lắng và trì trệ"
    }
  },
  {
    id: 13,
    name: { zh: "死神", en: "Death", fr: "La Mort", es: "La Muerte", th: "ความตาย", vi: "Cái Chết" },
    emoji: "💀",
    upright: {
      zh: "旧的模式正在消解，你们的关系在经历必要的死亡后会更加强大。",
      en: "Old patterns dissolving. Necessary death makes you stronger.",
      fr: "Vieux schémas se dissolvent.",
      es: "Los viejos patrones se disuelven.",
      th: "การเปลี่ยนแปลงและการหลุดพ้น",
      vi: "Thay đổi và giải thoát"
    },
    reversed: {
      zh: "你们害怕改变，但抗拒只会让痛苦延长，接受才能真正前进。",
      en: "Fear of change. Resistance prolongs pain.",
      fr: "Peur du changement.",
      es: "Miedo al cambio.",
      th: "ความกลัวการเปลี่ยนแปลงและการยึดติด",
      vi: "Sợ thay đổi và bám víu"
    }
  },
  {
    id: 14,
    name: { zh: "节制", en: "Temperance", fr: "La Tempérance", es: "La Templanza", th: "ปีศาจ", vi: "Sự Cân Bằng" },
    emoji: "⚖️",
    upright: {
      zh: "TA在关系中扮演调节者的角色，TA在寻找你们之间的平衡点。",
      en: "Seek balance. Bridge-builder in the relationship.",
      fr: "Recherchent l'équilibre.",
      es: "Buscan el equilibrio.",
      th: "การรอคอยการเปลี่ยนแปลง",
      vi: "Chờ đợi thay đổi"
    },
    reversed: {
      zh: "TA在走极端，要么给太多要么收太少，关系的天平需要校准。",
      en: "Going to extremes. Need to recalibrate.",
      fr: "Extrêmes. Besoin de recalibrer.",
      es: "Extremos. Necesitan recalibrar.",
      th: "ความขัดแย้งภายในและการตัดสินใจลำบาก",
      vi: "Xung đột nội tâm và quyết định khó khăn"
    }
  },
  {
    id: 15,
    name: { zh: "恶魔", en: "The Devil", fr: "Le Diable", es: "El Diablo", th: "หอคอย", vi: "Con Quỷ" },
    emoji: "⛓️",
    upright: {
      zh: "TA感到被某种执念束缚，可能是物质，可能是旧习惯，这需要被正视。",
      en: "Feel bound by obsession. Material or habitual traps.",
      fr: "Liés par l'obsession.",
      es: "Ligados por obsesión.",
      th: "การพังทลายอย่างกะทันหัน",
      vi: "Sụp đổ bất ngờ"
    },
    reversed: {
      zh: "你们之间存在某种隐蔽的依赖关系，健康的界限感是破局的关键。",
      en: "Hidden dependency. Healthy boundaries are key.",
      fr: "Dépendance cachée. Limites saines.",
      es: "Dependencia oculta. Límites saludables.",
      th: "ความล้มเหลวจากการสูญเสียความเชื่อมั่น",
      vi: "Thất bại từ mất niềm tin"
    }
  },
  {
    id: 16,
    name: { zh: "塔", en: "The Tower", fr: "La Maison-Dieu", es: "La Torre", th: "ดาว", vi: "Tháp" },
    emoji: "🗼",
    upright: {
      zh: "突然的震动正在瓦解虚假的根基，真正的连接才会显现。",
      en: "Sudden upheaval dismantling false foundations. True connection emerges.",
      fr: "Secousse démolit fausses fondations.",
      es: "Sacudida derriba falsas bases.",
      th: "ความหวังและการรักษาบาดแผล",
      vi: "Hy vọng và chữa lành"
    },
    reversed: {
      zh: "危机带来的伤痛需要时间愈合，TA正在重新评估这段关系的价值。",
      en: "Pain needs healing. Reassessing value.",
      fr: "La douleur a besoin de guérison.",
      es: "El dolor necesita sanación.",
      th: "ความสับสนและความกลัวในความมืด",
      vi: "Bối rối và sợ hãi"
    }
  },
  {
    id: 17,
    name: { zh: "星星", en: "The Star", fr: "L'Etoile", es: "La Estrella", th: "ดาว", vi: "Sao" },
    emoji: "⭐",
    upright: {
      zh: "TA带来了疗愈和希望，你们的关系正在经历一场温柔的重生。",
      en: "Bring healing and hope. Gentle rebirth.",
      fr: "Apportent guérison et espoir.",
      es: "Traen curación y esperanza.",
      th: "ความสุขและความสำเร็จ",
      vi: "Hạnh phúc và thành công"
    },
    reversed: {
      zh: "TA给予了太多而忘记了自己，关系的能量需要重新平衡。",
      en: "Giving too much, forgetting self. Need rebalancing.",
      fr: "Donner trop, s'oublier.",
      es: "Dar demasiado, olvidarse.",
      th: "ความเคว้งคว้างทางอารมณ์และภาพลวงตา",
      vi: "Dao động cảm xúc và ảo tưởng"
    }
  },
  {
    id: 18,
    name: { zh: "月亮", en: "The Moon", fr: "La Lune", es: "La Luna", th: "ดวงจันทร์", vi: "Mặt Trăng" },
    emoji: "🌙",
    upright: {
      zh: "TA需要你用耐心穿透迷雾，那些TA不愿说出口的恐惧正困扰着TA。",
      en: "Need patience to see through fog. Fears unspoken haunt them.",
      fr: "Patience pour voir à travers le brouillard.",
      es: "Paciencia para ver a través de la niebla.",
      th: "การฟื้นฟูและการเริ่มต้นใหม่",
      vi: "Hồi sinh và khởi đầu mới"
    },
    reversed: {
      zh: "TA可能被幻觉和不安所误导，你们需要更坦诚的对话来消除误会。",
      en: "Illusion and anxiety mislead. More honest dialogue needed.",
      fr: "Illusion et anxiété induisent en erreur.",
      es: "Ilusión y ansiedad pueden engañar.",
      th: "ความรู้สึกถูกทำให้อับอายหรือขาดความมั่นใจ",
      vi: "Cảm thấy xấu hổ hoặc thiếu tự tin"
    }
  },
  {
    id: 19,
    name: { zh: "太阳", en: "The Sun", fr: "Le Soleil", es: "El Sol", th: "ดวงอาทิตย์", vi: "Mặt Trời" },
    emoji: "☀️",
    upright: {
      zh: "TA对你的爱没有任何杂质，和你在一起TA感到无比快乐，这是天作之合。",
      en: "Pure and transparent love. Unadulterated joy with you.",
      fr: "Amour pur et transparent. Joie pure avec vous.",
      es: "Amor puro y transparente. Alegría pura contigo.",
      th: "ความสุขและความสำเร็จ",
      vi: "Hạnh phúc và thành công"
    },
    reversed: {
      zh: "虽然依旧有爱，但光芒有些黯淡。TA可能有些骄傲或自我中心，缺乏最初的新鲜感。",
      en: "Though love is there, brightness dimmed. Pride creeping in.",
      fr: "Amour présent mais éclat terni.",
      es: "Amor presente pero brillo apagado.",
      th: "ความรู้สึกถูกทำให้อับอายหรือขาดความมั่นใจ",
      vi: "Cảm thấy xấu hổ hoặc thiếu tự tin"
    }
  },
  {
    id: 20,
    name: { zh: "审判", en: "Judgement", fr: "Le Jugement", es: "El Juicio", th: "การพิพากษา", vi: "Sự Phán Xét" },
    emoji: "🔔",
    upright: {
      zh: "TA在这段关系里看到了自己的成长，你们的关系正在经历灵魂层面的觉醒。",
      en: "See growth in this relationship. Soul-level awakening.",
      fr: "Voient leur croissance.",
      es: "Ven crecimiento.",
      th: "ความสมบูรณ์และความสำเร็จ",
      vi: "Hoàn thiện và thành công"
    },
    reversed: {
      zh: "TA在等待某个信号或事件来做重大决定，你需要给TA时间。",
      en: "Waiting for a signal to make a big decision. Give time.",
      fr: "Attendant un signal.",
      es: "Esperando una señal.",
      th: "ความรู้สึกผิดและการตัดสินตัวเอง",
      vi: "Tự trách và tự phán xét"
    }
  },
  {
    id: 21,
    name: { zh: "世界", en: "The World", fr: "Le Monde", es: "El Mundo", th: "โลก", vi: "Thế Giới" },
    emoji: "🌍",
    upright: {
      zh: "你们的关系已经完成了一个完整的循环，这是圆满和成功的标志。",
      en: "Completed a full cycle. Sign of fulfillment.",
      fr: "Complété un cycle complet.",
      es: "Ha completado un ciclo completo.",
      th: "พระเจ้าและมนุษย์",
      vi: "Thần và con người"
    },
    reversed: {
      zh: "TA暂时感到满足但缺乏新的方向，你们需要共同设定新的目标来保持活力。",
      en: "Satisfied but lacking new direction. Set new goals.",
      fr: "satisfait mais manquant de direction.",
      es: "Satisfecho pero sin dirección.",
      th: "ความรู้สึกไม่เป็นส่วนหนึ่งและความไม่สมดุล",
      vi: "Cảm giác không thuộc về và mất cân bằng"
    }
  }
];

module.exports = { MAJOR_ARCANA };