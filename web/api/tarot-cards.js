// tarot-cards.js — 22 Major Arcana (4 languages: zh/en/es/fr)
// Phase 1: Deterministic tarot based on birthdates + date
// Chinese texts: 山子大叔 original "TA perspective" version
// EN/FR/ES texts: 山子大叔 native-level translations

const MAJOR_ARCANA = [
  {
    id: 0,
    name: { zh: '愚人', en: 'The Fool', fr: 'Le Mat (Le Fou)', es: 'El Loco' },
    emoji: '🌟',
    upright: {
      zh: 'TA目前对这段关系充满新鲜感和冲动，愿意不顾一切陪你冒险，但心思略显漂浮，需要你给这段热情加一把现实的锚。',
      en: 'They currently feel a sense of freshness and spontaneity toward this relationship, ready to take risks with you. However, their mind can be a bit fleeting; you might need to add a touch of reality to anchor this passion.',
      fr: 'Cette personne ressent actuellement un sentiment de fraîcheur et de spontanéité envers votre relation, prête à prendre des risques avec vous. Cependant, son esprit est un peu fuyant ; vous devriez y ajouter une touche de réalité pour ancrer cette passion.',
      es: 'Actualmente siente una sensación de frescura y espontaneidad hacia esta relación, estando dispuesto/a a correr riesgos contigo. Sin embargo, su mente está un poco dispersa; es posible que necesites aportar un toque de realidad para anclar esta pasión.'
    },
    reversed: {
      zh: 'TA在这段关系里感到有些迷茫或害怕承担责任，最近的冷淡可能只是TA在逃避现实的压力，需要静下心来沟通。',
      en: 'They might feel a bit lost or afraid of commitment right now. Their recent coldness could just be an attempt to escape real-world pressures; it\'s time for a calm, non-pressuring conversation.',
      fr: 'Cette personne se sent un peu perdue ou a peur de s\'engager en ce moment. Sa froideur récente pourrait simplement être une tentative d\'échapper aux pressions du monde réel ; c\'est le moment d\'avoir une conversation calme et sans pression.',
      es: 'Es posible que se sienta un poco perdido/a o con miedo al compromiso en este momento. Su frialdad reciente podría ser simplemente un intento de escapar de las presiones de la vida real; es hora de una conversación tranquila y sin presiones.'
    }
  },
  {
    id: 1,
    name: { zh: '魔术师', en: 'The Magician', fr: 'Le Bateleur (Le Magicien)', es: 'El Mago' },
    emoji: '🔮',
    upright: {
      zh: 'TA觉得你非常有吸引力，你们之间有着极强的化学反应。TA正在主动规划你们的未来，并有能力把想法变成现实。',
      en: 'They find you incredibly attractive. There is a strong chemical reaction between you two, and they are actively planning for your shared future, with the ability to turn thoughts into reality.',
      fr: 'Cette personne vous trouve incroyablement attirant(e). Il y a une forte alchimie entre vous deux, et elle planifie activement votre avenir commun, ayant la capacité de transformer les pensées en réalité.',
      es: 'Te encuentra increíblemente atractivo/a. Hay una fuerte química entre ustedes y está planificando activamente un futuro juntos, con la capacidad de convertir los pensamientos en realidad.'
    },
    reversed: {
      zh: '注意言行中的水分。TA近期可能在用一些话术或小套路来掩饰自己的真心，或者你正在被TA的表面现象所迷惑。',
      en: 'Watch out for hidden motives or exaggerations. They might be using sweet talk or small mind games to mask their true feelings, or you might be blinded by superficial charms.',
      fr: 'Méfiez-vous des motifs cachés ou des exagérations. Cette personne utilise peut-être des paroles douces ou de petits jeux d\'esprit pour masquer ses vrais sentiments, ou vous êtes peut-être aveuglé(e) par des charmes superficiels.',
      es: 'Cuidado con los motivos ocultos o las exageraciones. Es posible que esté usando palabras dulces o pequeños juegos mentales para ocultar sus verdaderos sentimientos, o que te estés dejando cegar por encantos superficiales.'
    }
  },
  {
    id: 2,
    name: { zh: '女祭司', en: 'The High Priestess', fr: 'La Papesse', es: 'La Sacerdotisa' },
    emoji: '🌙',
    upright: {
      zh: '你们之间有一种深刻的心灵默契。TA此时此刻在默默关注你，虽然表面风平浪静，但内心的情感其实非常细腻且克制。',
      en: 'There is a deep, intuitive telepathy between you. They are quietly paying attention to you; though they seem calm on the surface, their inner feelings are deeply emotional and reserved.',
      fr: 'Il y a une télépathie profonde et intuitive entre vous. Cette personne fait discrètement attention à vous ; bien qu\'elle paraisse calme en surface, ses sentiments intérieurs sont profondément intenses et réservés.',
      es: 'Hay una profunda e intuitiva telepatía entre ustedes. Te está prestando atención en silencio; aunque parece tranquilo/a en la superficie, sus sentimientos internos son profundamente emocionales y reservados.'
    },
    reversed: {
      zh: '沟通出现了隐形的隔阂。TA有些心思和秘密没有对你坦白，或者最近有些过于理智、冷漠，让你捉摸不透。',
      en: 'An invisible barrier has formed in your communication. They are hiding some thoughts or secrets from you, or have been overly rational and detached lately, making them hard to read.',
      fr: 'Une barrière invisible s\'est formée dans votre communication. Cette personne vous cache certaines pensées ou secrets, ou s\'est montrée excessivement rationnelle et détachée ces derniers temps, ce qui la rend difficile à cerner.',
      es: 'Se ha formado una barrera invisible en su comunicación. Te está ocultando algunos pensamientos o secretos, o se ha mostrado demasiado racional y distante últimamente, lo que dificulta descifrarlo/a.'
    }
  },
  {
    id: 3,
    name: { zh: '女皇', en: 'The Empress', fr: 'L\'Impératrice', es: 'La Emperatriz' },
    emoji: '🌺',
    upright: {
      zh: '这是一张极佳的恋爱牌。TA对你充满了浓烈的爱意与包容，在这段关系里，TA感到极度的舒适和满足，甚至有了成家的念头。',
      en: 'An excellent card for love. They feel an abundance of affection and nurturing care for you. In this connection, they feel deeply comfortable, satisfied, and may even think about settling down.',
      fr: 'Une excellente carte pour l\'amour. Cette personne ressent une abondance d\'affection et de bienveillance à votre égard. Dans cette relation, elle se sent profondément à l\'aise, satisfaite, et pense peut-être même à s\'installer.',
      es: 'Una excelente carta para el amor. Siente una gran abundancia de afecto y cariño hacia ti. En esta conexión, se siente profundamente cómodo/a, satisfecho/a e incluso podría estar pensando en establecerse.'
    },
    reversed: {
      zh: 'TA最近可能觉得你有些占有欲过强，或者在这段关系里感到了某种压迫感和情绪勒索，需要给彼此一点呼吸的空间。',
      en: 'They might feel you are being a bit too possessive lately, or they are experiencing an emotional suffocation in the relationship. It\'s time to give each other some breathing room.',
      fr: 'Cette personne trouve peut-être que vous êtes un peu trop possessif(-ve) ces derniers temps, ou elle ressent un étouffement émotionnel dans la relation. Il est temps de vous donner un peu d\'espace.',
      es: 'Es posible que sienta que estás siendo demasiado posesivo/a últimamente, o está experimentando una asfixia emocional en la relación. Es hora de darse un poco de espacio para respirar.'
    }
  },
  {
    id: 4,
    name: { zh: '皇帝', en: 'The Emperor', fr: 'L\'Empereur', es: 'El Emperador' },
    emoji: '👑',
    upright: {
      zh: 'TA对你的感情是稳定且长远的，倾向于用实际行动（如掌控欲、保护欲或物质付出）来表达爱，是个靠得住的依靠。',
      en: 'Their feelings for you are stable, solid, and long-term. They prefer to express love through practical actions, protection, or material support—someone you can truly lean on.',
      fr: 'Ses sentiments pour vous sont stables, solides et à long terme. Cette personne préfère exprimer son amour par des actions concrètes, de la protection ou un soutien matériel — quelqu\'un sur qui vous pouvez vraiment vous appuyer.',
      es: 'Sus sentimientos por ti son estables, sólidos y a largo plazo. Prefiere expresar el amor a través de acciones prácticas, protección o apoyo material: alguien en quien realmente puedes apoyarte.'
    },
    reversed: {
      zh: 'TA的性格有些大男子主义或过于死板。最近的冲突源于TA不肯低头，掌控欲让你感到了窒息和不平等。',
      en: 'Their personality can be overly controlling, stubborn, or rigid. Recent conflicts stem from their refusal to back down, and their possessiveness might make you feel suffocated.',
      fr: 'Sa personnalité peut être excessivement contrôlante, têtue ou rigide. Les conflits récents découlent de son refus de céder, et son attitude possessive pourrait vous faire étouffer.',
      es: 'Su personalidad puede ser demasiado controladora, obstinada o rígida. Los conflictos recientes surgen de su negativa a ceder, y su posesividad podría hacerte sentir asfixiado/a.'
    }
  },
  {
    id: 5,
    name: { zh: '教皇', en: 'The Hierophant', fr: 'Le Pape', es: 'El Papa' },
    emoji: '🙏',
    upright: {
      zh: '你们的关系正走向传统和稳固，TA非常尊重你，这是一段受到周围人祝福、以结婚或长期相处为目的的正缘。',
      en: 'Your relationship is moving toward tradition and stability. They highly respect you; this is a blessed connection aiming for marriage or a structured, long-term commitment.',
      fr: 'Votre relation évolue vers la tradition et la stabilité. Cette personne vous respecte profondément ; c\'est une union bénie qui vise le mariage ou un engagement structuré à long terme.',
      es: 'Su relación avanza hacia la tradición y la estabilidad. Te respeta profundamente; esta es una conexión bendecida que apunta al matrimonio o a un compromiso estructurado a largo plazo.'
    },
    reversed: {
      zh: 'TA最近的观念显得有些保守、说教甚至无趣，你们在观念上出现了一丝裂痕，让你觉得两人的相处缺乏激情。',
      en: 'Their views might feel a bit conservative, preachy, or plain boring lately. A slight rift in your core values is making the dynamic lack passion and excitement.',
      fr: 'Ses opinions peuvent sembler un peu conservatrices, moralisatrices ou tout simplement ennuyeuses ces derniers temps. Une légère divergence dans vos valeurs fondamentales fait que la dynamique manque de passion.',
      es: 'Sus opiniones pueden sentirse un poco conservadoras, moralistas o simplemente aburridas últimamente. Una ligera grieta en sus valores fundamentales está haciendo que la dinámica carezca de pasión y emoción.'
    }
  },
  {
    id: 6,
    name: { zh: '恋人', en: 'The Lovers', fr: 'L\'Amoureux', es: 'Los Enamorados' },
    emoji: '💕',
    upright: {
      zh: '完美契合！TA此时此刻满脑子都是你，彼此之间有着无法抗拒的吸引力。无论是价值观还是肉体，都处于高度共鸣期。',
      en: 'A perfect match! Their mind is completely filled with you right now, sharing an irresistible attraction. You are in perfect harmony, both mentally and physically.',
      fr: 'Un accord parfait ! Son esprit est complètement occupé par vous en ce moment, partageant une attraction irrésistible. Vous êtes en harmonie idéale, tant sur le plan mental que physique.',
      es: '¡Una combinación perfecta! Su mente está completamente llena de ti en este momento, compartiendo una atracción irresistible. Están en perfecta armonía, tanto mental como físicamente.'
    },
    reversed: {
      zh: '面临选择与诱惑。你们的关系来到了一个十字路口，TA内心开始出现动摇，或者有外部的人际关系在干扰TA的判断。',
      en: 'Facing choices or temptations. Your relationship has hit a crossroads; they are experiencing inner wavering, or external relationships are interfering with their judgment.',
      fr: 'Face à des choix ou des tentations. Votre relation est à la croisée des chemins ; cette personne traverse des hésitations intérieures, ou des relations extérieures interfèrent avec son jugement.',
      es: 'Enfrentando elecciones o tentaciones. Su relación ha llegado a una encrucijada; está experimentando dudas internas, o relaciones externas están interfiriendo con su juicio.'
    }
  },
  {
    id: 7,
    name: { zh: '战车', en: 'The Chariot', fr: 'Le Chariot', es: 'El Carro' },
    emoji: '🏛️',
    upright: {
      zh: 'TA是一个在感情里掌控欲强且极具行动力的人。不管遇到什么阻碍，TA目前都抱有"一定要和你走下去"的坚定决心。',
      en: 'They are highly driven and determined in love. No matter what obstacles arise, they currently hold a firm resolve of "I will make this relationship work with you."',
      fr: 'Cette personne est très motivée et déterminée en amour. Peu importe les obstacles qui se dressent, elle maintient actuellement la ferme résolution de "faire fonctionner cette relation avec vous".',
      es: 'Es una persona muy motivada y decidida en el amor. Sin importar los obstáculos que surjan, actualmente mantiene la firme resolución de "hacer que esta relación funcione contigo".'
    },
    reversed: {
      zh: '感情失去了方向。TA最近显得有些急躁，或者你们之间积压的矛盾正在失控，两人的步调完全没有踩在同一个点上。',
      en: 'The relationship has lost its direction. They seem overly impatient lately, or accumulated conflicts are spiraling out of control; you two are simply not on the same page.',
      fr: 'La relation a perdu sa direction. Cette personne semble excessivement impatiente ces derniers temps, ou les conflits accumulés échappent à tout contrôle ; vous n\'êtes tout simplement pas sur la même longueur d\'onde.',
      es: 'La relación ha perdido su rumbo. Parece demasiado impaciente últimamente, o los conflictos acumulados se están saliendo de control; simplemente no están en la misma sintonía.'
    }
  },
  {
    id: 8,
    name: { zh: '力量', en: 'Strength', fr: 'La Force', es: 'La Fuerza' },
    emoji: '🦁',
    upright: {
      zh: '以柔克刚。TA非常吃你温柔、包容的那一套。你在这段关系里占据着温柔的主导权，TA愿意为了你收敛自己的脾气。',
      en: 'Conquering with gentleness. They respond incredibly well to your warmth and patience. You hold a gentle dominance here; they are willing to tame their temper for you.',
      fr: 'Conquérir par la douceur. Cette personne réagit incroyablement bien à votre chaleur et à votre patience. Vous détenez une douce domination ici ; elle est prête à calmer son tempérament pour vous.',
      es: 'Conquistar con gentileza. Responde increíblemente bien a tu calidez y paciencia. Tienes un dominio sutil aquí; está dispuesto/a a calmar su temperamento por ti.'
    },
    reversed: {
      zh: '情绪失控的征兆。TA最近感到内心疲惫、软弱，或者在相处中容易因为一件小事而引发内心深处的自卑与暴躁。',
      en: 'Signs of emotional outbursts. They are feeling mentally exhausted or weak lately, making them prone to sudden bouts of insecurity or irritation over minor things.',
      fr: 'Signes d\'éclats émotionnels. Cette personne se sent mentalement épuisée ou faible ces derniers temps, ce qui la rend encline à de soudaines crises d\'insécurité ou d\'irritation pour des broutilles.',
      es: 'Señales de arrebatos emocionales. Se siente mentalmente agotado/a o débil últimamente, lo que lo/a hace propenso/a a repentinos ataques de inseguridad o irritación por cosas menores.'
    }
  },
  {
    id: 9,
    name: { zh: '隐者', en: 'The Hermit', fr: 'L\'Ermite', es: 'El Ermitaño' },
    emoji: '🔦',
    upright: {
      zh: 'TA最近处于情感的内省期。TA不是不爱你，而是需要孤独的空间来思考自己的未来。这时候不宜过度逼迫TA。',
      en: 'They are entering a period of emotional introspection. It\'s not that they don\'t love you; they just need solitary space to think about their future. Avoid pressuring them right now.',
      fr: 'Cette personne entre dans une période d\'introspection émotionnelle. Ce n\'est pas qu\'elle ne vous aime pas ; elle a juste besoin d\'un espace de solitude pour réfléchir à son avenir. Évitez de lui mettre la pression en ce moment.',
      es: 'Está entrando en un período de introspección emocional. No es que no te ame; simplemente necesita un espacio de soledad para pensar en su futuro. Evita presionarlo/a en este momento.'
    },
    reversed: {
      zh: '冷暴力与自我封闭。TA正在故意逃避与你的沟通，沉浸在自己的负面情绪里，这段关系让你感到孤立无援。',
      en: 'Silent treatment and emotional withdrawal. They are deliberately avoiding communication, sinking into negative emotions, leaving you feeling isolated and helpless.',
      fr: 'Silence radio et repli émotionnel. Cette personne évite délibérément la communication, s\'enfonçant dans des émotions négatives, vous laissant un sentiment d\'isolement et d\'impuissance.',
      es: 'Tratamiento silencioso y distanciamiento emocional. Está evitando deliberadamente la comunicación, hundiéndose en emociones negativas, dejándote con una sensación de aislamiento e impotencia.'
    }
  },
  {
    id: 10,
    name: { zh: '命运之轮', en: 'Wheel of Fortune', fr: 'La Roue de Fortune', es: 'La Rueda de la Fortuna' },
    emoji: '🎡',
    upright: {
      zh: '宿命般的相遇。星盘与命运在此时重合，你们的关系正在迎来一个积极的转折点，顺应时势，感情会突飞猛进。',
      en: 'A fated connection. Your alignments match at this very moment, and your relationship is welcoming a highly positive turning point. Go with the flow, and things will leap forward.',
      fr: 'Une connexion fatidique. Vos alignements concordent en ce moment même, et votre relation accueille un tournant très positif. Suivez le mouvement, et les choses feront un bond en avant.',
      es: 'Una conexión del destino. Sus alineaciones coinciden en este preciso momento, y su relación está dando un giro muy positivo. Sigue la corriente y las cosas avanzarán a pasos agigantados.'
    },
    reversed: {
      zh: '时机不对的无力感。最近你们之间可能出现了一些难以抗拒的现实阻碍（如异地、家庭），感觉怎么努力都踩不到对的点。',
      en: 'A feeling of bad timing and helplessness. External, uncontrollable obstacles (like long distance or family) have disrupted your rhythm, making hard work feel unrewarded.',
      fr: 'Un sentiment de mauvais timing et d\'impuissance. Des obstacles extérieurs et incontrôlables (comme la distance ou la famille) ont perturbé votre rythme, donnant l\'impression que les efforts sont vains.',
      es: 'Una sensación de mal momento e impotencia. Obstáculos externos e incontrolables (como la distancia o la familia) han alterado su ritmo, haciendo que el trabajo duro se sienta en vano.'
    }
  },
  {
    id: 11,
    name: { zh: '正义', en: 'Justice', fr: 'La Justice', es: 'La Justicia' },
    emoji: '⚖️',
    upright: {
      zh: 'TA在用非常理智的眼光审视这段关系。TA付出多少，就希望得到你多少的回报，这是一段势均力敌、讲究平等的感情。',
      en: 'They are assessing this relationship with an intensely rational eye. They expect reciprocity—as much as they give is as much as they want back. It\'s a well-balanced dynamic.',
      fr: 'Cette personne évalue votre relation avec un œil intensément rationnel. Elle s\'attend à de la réciprocité — elle veut recevoir autant qu\'elle donne. C\'est une dynamique bien équilibrée.',
      es: 'Está evaluando esta relación con un ojo intensamente racional. Espera reciprocidad: quiere recibir tanto como da. Es una dinámica bien equilibrada.'
    },
    reversed: {
      zh: '不公平的委屈感。你或TA觉得在这段感情里付出得不到尊重，天平倾斜了，冷战和计较正在消耗最初的爱意。',
      en: 'Feelings of unfairness and resentment. One of you feels their effort isn\'t respected. The scales are unbalanced; score-keeping and cold shoulders are draining the initial love.',
      fr: 'Sentiments d\'injustice et de ressentiment. L\'un de vous a l\'impression que ses efforts ne sont pas respectés. La balance est déséquilibrée ; les comptes d\'apothicaire et l\'indifférence épuisent l\'amour initial.',
      es: 'Sentimientos de injusticia y resentimiento. Uno de ustedes siente que su esfuerzo no es respetado. La balanza está desequilibrada; llevar la cuenta y la indiferencia están agotando el amor inicial.'
    }
  },
  {
    id: 12,
    name: { zh: '倒吊人', en: 'The Hanged Man', fr: 'Le Pendu', es: 'El Colgado' },
    emoji: '🧘',
    upright: {
      zh: '默默付出不求回报。TA愿意为了这段感情做出妥协和牺牲，此时的换位思考能够帮你们化解之前所有的矛盾。',
      en: 'Devoting effort quietly without demanding immediate rewards. They are willing to compromise for the sake of this bond. Seeing things from their view can heal past rifts.',
      fr: 'Consacrer des efforts discrètement sans exiger de récompense immédiate. Cette personne est prête à faire des compromis pour le bien de ce lien. Voir les choses de son point de vue peut guérir les anciennes blessures.',
      es: 'Dedicar esfuerzos en silencio sin exigir recompensas inmediatas. Está dispuesto/a a ceder por el bien de este vínculo. Ver las cosas desde su perspectiva puede sanar viejas grietas.'
    },
    reversed: {
      zh: '无谓的纠缠与白费力气。TA或你觉得自己的委屈和牺牲没有意义，感情陷入了僵局，再怎么委曲求全也换不来好结果。',
      en: 'Pointless stagnation and wasted efforts. You or they feel that sacrifices have lost meaning. The dynamic is stuck; people-pleasing won\'t bring the desired outcome anymore.',
      fr: 'Stagnation inutile et efforts gâchés. Vous ou cette personne avez l\'impression que les sacrifices ont perdu leur sens. La dynamique est bloquée ; chercher à tout prix à plaire n\'apportera plus le résultat escompté.',
      es: 'Estancamiento inútil y esfuerzos en vano. Tú o esa persona sienten que los sacrificios han perdido sentido. La dinámica está estancada; complacer por complacer ya no traerá el resultado deseado.'
    }
  },
  {
    id: 13,
    name: { zh: '死神', en: 'Death', fr: 'La Mort', es: 'La Muerte' },
    emoji: '💀',
    upright: {
      zh: '旧关系的终结与新生。你们之间一成不变的相处模式必须打破了，经历这次蜕变，你们会迎来更健康的相处状态。',
      en: 'The end of an old phase and a fresh rebirth. The stagnant, unchanging patterns between you must be broken. After this transformation, you will greet a much healthier dynamic.',
      fr: 'La fin d\'une ancienne phase et une nouvelle renaissance. Les schémas stagnants et immuables entre vous doivent être brisés. Après cette transformation, vous accueillerez une dynamique bien plus saine.',
      es: 'El fin de una vieja fase y un nuevo renacer. Los patrones estancados e inmutables entre ustedes deben romperse. Después de esta transformación, recibirán una dinámica mucho más saludable.'
    },
    reversed: {
      zh: '关系名存实亡，或者某一方死抓着过去的矛盾不放，不愿意做出改变，让感情在痛苦中反复拉扯、原地踏步。',
      en: 'The relationship feels dead in all but name, or someone is stubbornly clinging to past conflicts, refusing to change, causing the dynamic to loop in painful inertia.',
      fr: 'La relation semble morte à tout point de vue sauf de nom, ou quelqu\'un s\'accroche obstinément aux conflits passés, refusant de changer, faisant boucler la dynamique dans une douloureuse inertie.',
      es: 'La relación se siente muerta en todo menos en el nombre, o alguien se aferra obstinadamente a los conflictos del pasado, negándose a cambiar, haciendo que la dinámica gire en una dolorosa inercia.'
    }
  },
  {
    id: 14,
    name: { zh: '节制', en: 'Temperance', fr: 'Tempérance', es: 'La Templanza' },
    emoji: '🌊',
    upright: {
      zh: '极佳的沟通牌。TA觉得和你在精神上非常契合，两人的情绪能够完美互补，沟通顺畅，感情正在细水长流地升温。',
      en: 'Excellent communication. They feel highly compatible with you on a mental and spiritual level. Your emotions complement each other perfectly, allowing love to warm up steadily.',
      fr: 'Excellente communication. Cette personne se sent très compatible avec vous sur le plan mental et spirituel. Vos émotions se complètent parfaitement, permettant à l\'amour de se réchauffer régulièrement.',
      es: 'Excelente comunicación. Se siente muy compatible contigo a nivel mental y espiritual. Sus emociones se complementan perfectamente, lo que permite que el amor crezca de manera constante.'
    },
    reversed: {
      zh: '缺乏沟通的默契。最近两人的交流如同鸡同鸭讲，情绪无法同频，甚至出现了各怀心思、难以融合的尴尬局面。',
      en: 'A lack of emotional harmony. Recent conversations feel like talking to a brick wall. Your emotions fail to sync, and an awkward vibe of hidden agendas is arising.',
      fr: 'Un manque d\'harmonie émotionnelle. Les conversations récentes donnent l\'impression de parler à un mur. Vos émotions ne se synchronisent pas, et une ambiance maladroite d\'intentions cachées s\'installe.',
      es: 'Falta de armonía emocional. Las conversaciones recientes se sienten como hablar con una pared. Sus emociones no se sincronizan y surge un ambiente incómodo de intenciones ocultas.'
    }
  },
  {
    id: 15,
    name: { zh: '恶魔', en: 'The Devil', fr: 'Le Diable', es: 'El Diablo' },
    emoji: '😈',
    upright: {
      zh: '致命的诱惑与执念。TA对你有着极强的肉体依恋或占有欲，这段感情带着一丝虐恋和宿命感，明知危险却欲罢不能。',
      en: 'Intense temptation and obsession. They have an extremely strong physical attachment or possessive urge toward you. This bond carries a touch of toxic infatuation—dangerous yet irresistible.',
      fr: 'Tentation intense et obsession. Cette personne a un attachement physique ou un besoin de possession extrêmement fort envers vous. Ce lien comporte une touche d\'infatuation toxique — dangereuse mais irrésistible.',
      es: 'Intensa tentación y obsesión. Tiene un apego físico o un impulso posesivo extremadamente fuerte hacia ti. Este vínculo conlleva un toque de obsesión tóxica: peligroso pero irresistible.'
    },
    reversed: {
      zh: '试图摆脱束缚。某一方正在从盲目的迷恋中清醒过来，想要打破这种不健康的依恋关系，或者正在割舍内心的执念。',
      en: 'Attempting to break free from shackles. Someone is waking up from blind infatuation, wanting to shatter unhealthy dependencies, or detaching themselves from toxic obsessions.',
      fr: 'Tenter de se libérer des chaînes. Quelqu\'un se réveille d\'une infatuation aveugle, voulant briser des dépendances malsaines ou se détacher d\'obsessions toxiques.',
      es: 'Intentando liberarse de las cadenas. Alguien está despertando de una obsesión ciega, queriendo romper dependencias poco saludables o distanciándose de obsesiones tóxicas.'
    }
  },
  {
    id: 16,
    name: { zh: '高塔', en: 'The Tower', fr: 'La Maison Dieu (La Tour)', es: 'La Torre' },
    emoji: '⚡',
    upright: {
      zh: '突如其来的冲击。你们的关系近期会面临一场激烈的争吵、冷战或现实事件的考验，原有的伪装和问题将被彻底震碎。',
      en: 'A sudden shock wave. Your relationship will face a fierce argument, sudden coldness, or a harsh reality check soon, shattering old illusions and buried issues completely.',
      fr: 'Une onde de choc soudaine. Votre relation sera bientôt confrontée à une violente dispute, à une froideur soudaine ou à un dur retour à la réalité, brisant complètement les anciennes illusions et les problèmes enfouis.',
      es: 'Una repentina ola de choque. Su relación enfrentará una fuerte discusión, una frialdad repentina o un duro golpe de realidad pronto, rompiendo por completo las viejas ilusiones y los problemas ocultos.'
    },
    reversed: {
      zh: '风暴前的死寂。矛盾早已积压到了顶点，虽然目前还没爆发，但如果继续粉饰太平，更大的危机只是时间问题。',
      en: 'The eerie calm before a major storm. Undercurrents have accumulated to a boiling point; though things haven\'t exploded yet, pretending everything is fine will only worsen the eventual crisis.',
      fr: 'Le calme étrange avant une tempête majeure. Les sous-courants ont atteint un point d\'ébullition ; bien que les choses n\'aient pas encore explosé, faire semblant que tout va bien ne fera qu\'aggraver la crise finale.',
      es: 'La extraña calma antes de una gran tormenta. Las tensiones ocultas han llegado a su punto crítico; aunque las cosas aún no han explotado, fingir que todo está bien solo empeorará la crisis final.'
    }
  },
  {
    id: 17,
    name: { zh: '星星', en: 'The Star', fr: 'L\'Étoile', es: 'La Estrella' },
    emoji: '⭐',
    upright: {
      zh: '充满希望与治愈。TA把你看作生命里的白月光，对未来抱有美好的憧憬。即使之前有伤痕，现在也是最佳的修复期。',
      en: 'Full of hope and healing. They view you as the guiding light of their life, holding beautiful dreams for the future. Even if there were past wounds, this is the prime window for recovery.',
      fr: 'Plein d\'espoir et de guérison. Cette personne vous considère comme la lumière guidant sa vie, nourrissant de beaux rêves pour l\'avenir. Même s\'il y a eu des blessures passées, c\'est la période idéale pour guérir.',
      es: 'Llena de esperanza y sanación. Te ve como la luz que guía su vida, albergando hermosos sueños para el futuro. Incluso si hubo heridas en el pasado, esta es la ventana ideal para la recuperación.'
    },
    reversed: {
      zh: '理想破灭的失望感。TA或你把这段感情想得太完美，当现实的柴米油盐压下来时，产生了大失所望的心理落差。',
      en: 'Disappointment from shattered ideals. You or they built up too perfect an expectation of this bond; as real-world practicalities weigh in, a deflating psychological drop occurs.',
      fr: 'Déception face à des idéaux brisés. Vous ou cette personne aviez des attentes trop parfaites de ce lien ; à mesure que les réalités du monde réel pèsent, une chute psychologique décevante se produit.',
      es: 'Decepción por ideales rotos. Tú o esa persona crearon una expectativa demasiado perfecta de este vínculo; a medida que las realidades de la vida real pesan, ocurre una caída psicológica desalentadora.'
    }
  },
  {
    id: 18,
    name: { zh: '月亮', en: 'The Moon', fr: 'La Lune', es: 'La Luna' },
    emoji: '🌕',
    upright: {
      zh: '不安、焦虑与猜忌。TA最近内心极度缺乏安全感，对你忽冷忽热是因为TA害怕受伤，这段关系里隐藏着你没看清的迷雾。',
      en: 'Insecurity, anxiety, and suspicion. They feel intensely insecure lately. Their hot-and-cold behavior stems from a fear of getting hurt; a dense fog is hiding parts of this connection.',
      fr: 'Insécurité, anxiété et suspicion. Cette personne se sent intensément en insécurité ces derniers temps. Son comportement chaud et froid découle de la peur d\'être blessée ; un brouillard épais cache des aspects de cette relation.',
      es: 'Inseguridad, ansiedad y sospecha. Se siente intensamente inseguro/a últimamente. Su comportamiento frío y cálido proviene del miedo a salir lastimado/a; la densa niebla oculta partes de esta conexión.'
    },
    reversed: {
      zh: '迷雾正在散去。内心的恐惧、怀疑和误会开始慢慢解开，隐藏的真相浮出水面，感情即将重新找回光明。',
      en: 'The fog is beginning to lift. Internal fears, doubts, and misunderstandings are slowly unraveling. Hidden truths come to light, and the relationship is reclaiming its clarity.',
      fr: 'Le brouillard commence à se dissiper. Les peurs internes, les doutes et les malentendus se dénouent lentement. Les vérités cachées éclatent au grand jour, et la relation retrouve sa clarté.',
      es: 'La niebla está comenzando a disiparse. Los miedos internos, las dudas y los malentendidos se están aclarando lentamente. Las verdades ocultas salen a la luz y la relación recupera su claridad.'
    }
  },
  {
    id: 19,
    name: { zh: '太阳', en: 'The Sun', fr: 'Le Soleil', es: 'El Sol' },
    emoji: '☀️',
    upright: {
      zh: '光明磊落，热烈纯粹。TA对你的爱没有任何杂质，和你在一起TA感到无比快乐。这是一张能带来结婚、怀孕等大喜讯的牌。',
      en: 'Radiant, pure, and transparent. Their love for you is free of any hidden agendas; being with you brings them unadulterated joy. A wonderful card signaling marriage, milestones, or big celebrations.',
      fr: 'Rayonnant, pur et transparent. Son amour pour vous est exempt de toute intention cachée ; être avec vous lui apporte une joie pure. Une magnifique carte signalant un mariage, des étapes importantes ou de grandes célébrations.',
      es: 'Radiante, puro y transparente. Su amor por ti está libre de segundas intenciones; estar contigo le brinda una alegría pura. Una maravillosa carta que señala matrimonio, hitos importantes o grandes celebraciones.'
    },
    reversed: {
      zh: '虽然依旧有爱，但光芒有些黯淡。TA最近可能有些骄傲或自我中心，或者你们的相处缺乏了一点最初的新鲜感。',
      en: 'Though love is still very much there, its brightness is slightly dimmed. They might be acting a bit too proud or self-centered lately, or the dynamic has lost a hint of its initial spark.',
      fr: 'Bien que l\'amour soit toujours bien présent, son éclat est légèrement obscurci. Cette personne se montre peut-être un peu trop fière ou égocentrique ces derniers temps, ou la dynamique a perdu un soupçon de son étincelle initiale.',
      es: 'Aunque el amor sigue estando muy presente, su brillo está un poco atenuado. Puede que esté actuando de forma un poco orgullosa o egocéntrica últimamente, o que la dinámica haya perdido un toque de su chispa inicial.'
    }
  },
  {
    id: 20,
    name: { zh: '审判', en: 'The Judgement', fr: 'Le Jugement', es: 'El Juicio' },
    emoji: '📯',
    upright: {
      zh: '破镜重圆与重大抉择。如果是冷战或分手的状态，这张牌代表着关系的转机和重修旧好的信号；你们需要为未来做一个诚实的决定。',
      en: 'A historic turning point or reconciliation. If you are currently in a breakup or silent treatment, this card signals a powerful breakthrough and a chance to mend rifts; time for an honest choice.',
      fr: 'Un tournant historique ou une réconciliation. Si vous êtes actuellement en rupture ou en silence radio, cette carte signale une puissante avancée et une chance de réparer les blessures ; c\'est le moment de faire un choix honnête.',
      es: 'Un punto de inflexión histórico o reconciliación. Si estás actualmente en una ruptura o ley del hielo, esta carta señala un poderoso avance y una oportunidad para sanar grietas; es hora de una elección honesta.'
    },
    reversed: {
      zh: '错失良机或拒绝清醒。面对感情中的问题，某一方选择装聋作哑，不愿意直面内心的审判，导致关系继续拖延恶化。',
      en: 'Missing the golden window or refusing to face reality. One party is playing dumb regarding deep-rooted relationship issues, dragging out a painful state of stagnation.',
      fr: 'Manquer la période idéale ou refuser de faire face à la réalité. L\'une des parties fait l\'autruche face aux problèmes profonds de la relation, prolongeant un état douloureux de stagnation.',
      es: 'Perder la oportunidad de oro o negarse a enfrentar la realidad. Una de las partes se está haciendo la desentendida con respecto a los problemas profundos de la relación, prolongando un doloroso estado de estancamiento.'
    }
  },
  {
    id: 21,
    name: { zh: '世界', en: 'The World', fr: 'Le Monde', es: 'El Mundo' },
    emoji: '🌍',
    upright: {
      zh: '功德圆满。TA认为你就是TA一直在寻找的灵魂伴侣，两人的感情达到了一个完美的闭环，非常适合走向谈婚论嫁的终点。',
      en: 'Ultimate fulfillment. They view you as the ultimate soulmate they\'ve been searching for. Your bond has achieved a perfect closed loop, ready to transition seamlessly into long-term commitment.',
      fr: 'L\'accomplissement ultime. Cette personne vous considère comme l\'âme sœur ultime qu\'elle recherchait. Votre lien a atteint une boucle parfaite, prêt à passer harmonieusement à un engagement à long terme.',
      es: 'La máxima plenitud. Te ve como la alma gemela definitiva que ha estado buscando. Su vínculo ha logrado un cierre perfecto, listo para hacer la transición sin problemas hacia un compromiso a largo plazo.'
    },
    reversed: {
      zh: '差临门一脚。感情虽然大体很好，但总觉得还不够圆满，某个现实问题（如卡在最后的买房、定居）没有得到最终解决。',
      en: 'Just one final step away from perfection. Although the relationship is generally wonderful, it feels slightly incomplete—stuck on a final practical hurdle like relocation or property decisions.',
      fr: 'À une seule étape de la perfection. Bien que la relation soit globalement magnifique, elle semble légèrement incomplète — bloquée sur un dernier obstacle pratique comme un déménagement ou des décisions immobilières.',
      es: 'A solo un paso de la perfección. Aunque la relación en general es maravillosa, se siente un poco incompleta, estancada en un último obstáculo práctico como la mudanza o decisiones de propiedad.'
    }
  }
];

module.exports = { MAJOR_ARCANA };