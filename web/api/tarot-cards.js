// tarot-cards.js — 22 Major Arcana with love-focused interpretations
// Phase 1: Pseudo-random tarot based on birthdates + date (deterministic)

const MAJOR_ARCANA = [
  {
    id: 0,
    name: { zh: '愚人', en: 'The Fool', emoji: '🌟' },
    upright: {
      zh: 'TA目前对这段关系充满新鲜感和冲动，愿意不顾一切陪你冒险，但心思略显漂浮，需要你给这段热情加一把现实的锚。',
      en: "They're full of freshness and impulse about this relationship, willing to adventure with you recklessly, but their mind is a bit floating—you need to anchor this passion with some reality.",
      es: 'Están llenos de frescura e impulso sobre esta relación, dispuestos a aventurarse contigo sin importar qué, pero su mente está un poco flotante—necesitas anclar esta pasión con algo de realidad.',
      fr: "Ils sont pleins de fraîcheur et d'impulsion concernant cette relation, prêts à s'aventurer avec vous sans réserve, mais leur esprit flotte un peu—vous devez ancrer cette passion avec un peu de réalité.",
    },
    reversed: {
      zh: 'TA在这段关系里感到有些迷茫或害怕承担责任，最近的冷淡可能只是TA在逃避现实的压力，需要静下心来沟通。',
      en: "They feel lost or afraid of taking responsibility in this relationship. Recent coldness might just be them escaping from reality's pressure—need calm communication.",
      es: 'Se sienten perdidos o tienen miedo de asumir responsabilidad en esta relación. La frialdad reciente podría ser solo una escapatoria de la presión de la realidad—necesitan comunicación tranquila.',
      fr: "Ils se sentent perdus ou ont peur de prendre des responsabilités dans cette relation. La froideur récente n'est peut-être qu'une fuite face à la pression de la réalité—une communication calme est nécessaire.",
    },
  },
  {
    id: 1,
    name: { zh: '魔术师', en: 'The Magician', emoji: '🔮' },
    upright: {
      zh: 'TA觉得你非常有吸引力，你们之间有着极强的化学反应。TA正在主动规划你们的未来，并有能力把想法变成现实。',
      en: "They find you incredibly attractive—there's powerful chemistry between you. They're actively planning your future and have the ability to turn ideas into reality.",
      es: 'Te encuentran increíblemente atractivo—hay una química poderosa entre ustedes. Están planeando activamente su futuro y tienen la capacidad de convertir ideas en realidad.',
      fr: "Ils vous trouvent incroyablement attirant—il y a une chimie puissante entre vous. Ils planifient activement votre avenir et ont la capacité de transformer les idées en réalité.",
    },
    reversed: {
      zh: '注意言行中的水分。TA近期可能在用一些话术或小套路来掩饰自己的真心，或者你正在被TA的表面现象所迷惑。',
      en: "Watch out for empty words. They might be using tactics or tricks to hide their true feelings, or you're being misled by their surface appearance.",
      es: 'Cuidado con las palabras vacías. Podrían estar usando tácticas o trucos para ocultar sus verdaderos sentimientos, o estás siendo engañado por su apariencia superficial.',
      fr: "Méfiez-vous des paroles creuses. Ils pourraient utiliser des tactiques ou des astuces pour cacher leurs vrais sentiments, ou vous êtes trompé par leur apparence superficielle.",
    },
  },
  {
    id: 2,
    name: { zh: '女祭司', en: 'The High Priestess', emoji: '🌙' },
    upright: {
      zh: '你们之间有一种深刻的心灵默契。TA此时此刻在默默关注你，虽然表面风平浪静，但内心的情感其实非常细腻且克制。',
      en: "There's a profound spiritual connection between you. Right now, they're silently watching you—surface calm, but inner emotions are delicate and restrained.",
      es: 'Hay una conexión espiritual profunda entre ustedes. En este momento, te están observando en silencio—calma en la superficie, pero emociones internas delicadas y contenidas.',
      fr: "Il y a une connexion spirituelle profonde entre vous. En ce moment, ils vous observent en silence—calme en surface, mais des émotions intérieures délicates et retenues.",
    },
    reversed: {
      zh: '沟通出现了隐形的隔阂。TA有些心思和秘密没有对你坦白，或者最近有些过于理智、冷漠，让你捉摸不透。',
      en: "There's an invisible barrier in communication. They have thoughts and secrets they haven't confessed to you, or they've been overly rational and cold lately—hard to read.",
      es: 'Hay una barrera invisible en la comunicación. Tienen pensamientos y secretos que no te han confesado, o han estado demasiado racionales y fríos últimamente—difíciles de leer.',
      fr: "Il y a une barrière invisible dans la communication. Ils ont des pensées et des secrets qu'ils ne vous ont pas avoués, ou ils sont devenus trop rationnels et froids récemment—difficiles à cerner.",
    },
  },
  {
    id: 3,
    name: { zh: '女皇', en: 'The Empress', emoji: '🌺' },
    upright: {
      zh: '这是一张极佳的恋爱牌。TA对你充满了浓烈的爱意与包容，在这段关系里，TA感到极度的舒适和满足，甚至有了成家的念头。',
      en: "An excellent love card. They're filled with intense love and acceptance for you—in this relationship, they feel extremely comfortable and fulfilled, even thinking about settling down.",
      es: 'Una excelente carta de amor. Están llenos de amor intenso y aceptación hacia ti—en esta relación, se sienten extremadamente cómodos y realizados, incluso pensando en establecerse.',
      fr: "Une excellente carte d'amour. Ils sont remplis d'un amour intense et d'acceptation pour vous—dans cette relation, ils se sentent extrêmement à l'aise et épanouis, pensant même à fonder un foyer.",
    },
    reversed: {
      zh: 'TA最近可能觉得你有些占有欲过强，或者在这段关系里感到了某种压迫感和情绪勒索，需要给彼此一点呼吸的空间。',
      en: "They might feel you're too possessive lately, or feel oppression and emotional blackmail in this relationship—need to give each other some breathing room.",
      es: 'Podrían sentir que eres demasiado posesivo últimamente, o sentir opresión y chantaje emocional en esta relación—necesitan darse espacio para respirar.',
      fr: "Ils pourraient sentir que vous êtes trop possessif récemment, ou ressentir de l'oppression et du chantage émotionnel dans cette relation—besoin de se donner de l'espace pour respirer.",
    },
  },
  {
    id: 4,
    name: { zh: '皇帝', en: 'The Emperor', emoji: '👑' },
    upright: {
      zh: 'TA对你的感情是稳定且长远的，倾向于用实际行动（如掌控欲、保护欲或物质付出）来表达爱，是个靠得住的依靠。',
      en: "Their feelings for you are stable and long-term. They tend to express love through practical actions (control, protection, or material giving)—a reliable partner to count on.",
      es: 'Sus sentimientos por ti son estables y a largo plazo. Tienden a expresar amor a través de acciones prácticas (control, protección o dar material)—una pareja confiable en quien apoyarse.',
      fr: "Leurs sentiments pour vous sont stables et à long terme. Ils ont tendance à exprimer l'amour par des actions pratiques (contrôle, protection ou don matériel)—un partenaire fiable sur qui compter.",
    },
    reversed: {
      zh: 'TA的性格有些大男子主义或过于死板。最近的冲突源于TA不肯低头，掌控欲让你感到了窒息和不平等。',
      en: "Their personality has some machismo or is too rigid. Recent conflicts come from their refusal to back down—their controlling nature makes you feel suffocated and unequal.",
      es: 'Su personalidad tiene algo de machismo o es demasiado rígida. Los conflictos recientes vienen de su negativa a ceder—su naturaleza controladora te hace sentir sofocado y desigual.',
      fr: "Leur personnalité a un certain machisme ou est trop rigide. Les conflits récents viennent de leur refus de céder—their controlling nature makes you feel suffocated and unequal.",
    },
  },
  {
    id: 5,
    name: { zh: '教皇', en: 'The Hierophant', emoji: '🙏' },
    upright: {
      zh: '你们的关系正走向传统和稳固，TA非常尊重你，这是一段受到周围人祝福、以结婚或长期相处为目的的正缘。',
      en: "Your relationship is moving toward tradition and stability. They deeply respect you—this is a blessed connection aimed at marriage or long-term commitment.",
      es: 'Su relación se dirige hacia la tradición y la estabilidad. Te respetan profundamente—esta es una conexión bendecida destinada al matrimonio o compromiso a largo plazo.',
      fr: "Votre relation se dirige vers la tradition et la stabilité. Ils vous respectent profondément—c'est une connexion bénie visant le mariage ou l'engagement à long terme.",
    },
    reversed: {
      zh: 'TA最近的观念显得有些保守、说教甚至无趣，你们在观念上出现了一丝裂痕，让你觉得两人的相处缺乏激情。',
      en: "Their views lately seem conservative, preachy, even boring. A crack has appeared in your values—you feel the relationship lacks passion.",
      es: 'Sus puntos de vista últimamente parecen conservadores, predicadores, incluso aburridos. Ha aparecido una grieta en sus valores—sientes que la relación carece de pasión.',
      fr: "Leurs points de vue récemment semblent conservateurs, moralisateurs, même ennuyeux. Une fissure est apparue dans vos valeurs—vous sentez que la relation manque de passion.",
    },
  },
  {
    id: 6,
    name: { zh: '恋人', en: 'The Lovers', emoji: '💕' },
    upright: {
      zh: '完美契合！TA此时此刻满脑子都是你，彼此之间有着无法抗拒的吸引力。无论是价值观还是肉体，都处于高度共鸣期。',
      en: "Perfect match! Right now, they can't stop thinking about you—irresistible attraction between you. Whether values or physical connection, you're in a high resonance period.",
      es: '¡Combina perfectamente! En este momento, no pueden dejar de pensar en ti—atracción irresistible entre ustedes. Ya sean valores o conexión física, están en un período de alta resonancia.',
      fr: "Correspondance parfaite ! En ce moment, ils ne peuvent pas s'empêcher de penser à vous—attraction irrésistible entre vous. Que ce soit les valeurs ou la connexion physique, vous êtes dans une période de haute résonance.",
    },
    reversed: {
      zh: '面临选择与诱惑。你们的关系来到了一个十字路口，TA内心开始出现动摇，或者有外部的人际关系在干扰TA的判断。',
      en: "Facing choices and temptations. Your relationship has reached a crossroads—their heart is wavering, or external relationships are interfering with their judgment.",
      es: 'Enfrentando elecciones y tentaciones. Su relación ha llegado a un cruce de caminos—su corazón está vacilando, o relaciones externas están interfiriendo con su juicio.',
      fr: "Face aux choix et aux tentations. Votre relation a atteint une croisée des chemins—theur cœur vacille, ou des relations externes interfèrent avec leur jugement.",
    },
  },
  {
    id: 7,
    name: { zh: '战车', en: 'The Chariot', emoji: '🏛️' },
    upright: {
      zh: 'TA是一个在感情里掌控欲强且极具行动力的人。不管遇到什么阻碍，TA目前都抱有"一定要和你走下去"的坚定决心。',
      en: "They're someone with strong control and action in relationships. No matter the obstacles, they currently hold a firm determination to walk this path with you.",
      es: 'Son alguien con fuerte control y acción en las relaciones. No importa los obstáculos, actualmente mantienen una determinación firme de caminar este camino contigo.',
      fr: "Ils sont quelqu'un avec un fort contrôle et action dans les relations. Peu importe les obstacles, ils maintiennent actuellement une détermination ferme de marcher sur ce chemin avec vous.",
    },
    reversed: {
      zh: '感情失去了方向。TA最近显得有些急躁，或者你们之间积压的矛盾正在失控，两人的步调完全没有踩在同一个点上。',
      en: "The relationship has lost direction. They seem impatient lately, or accumulated conflicts are spiraling out of control—you two are completely out of sync.",
      es: 'La relación ha perdido dirección. Parecen impacientes últimamente, o los conflictos acumulados están saliendo de control—están completamente desincronizados.',
      fr: "La relation a perdu sa direction. Ils semblent impatients récemment, ou les conflits accumulés spiralent hors de contrôle—vous deux êtes complètement désynchronisés.",
    },
  },
  {
    id: 8,
    name: { zh: '力量', en: 'Strength', emoji: '🦁' },
    upright: {
      zh: '以柔克刚。TA非常吃你温柔、包容的那一套。你在这段关系里占据着温柔的主导权，TA愿意为了你收敛自己的脾气。',
      en: "Softness conquers strength. They respond deeply to your gentleness and acceptance. You hold a gentle dominance in this relationship—they're willing to restrain their temper for you.",
      es: 'La suavidad conquista la fuerza. Responden profundamente a tu gentileza y aceptación. Mantienes un dominio gentil en esta relación—están dispuestos a refrenar su temperamento por ti.',
      fr: "La douceur conquiert la force. Ils répondent profondément à votre gentillesse et acceptation. Vous détenez une domination douce dans cette relation—ils sont prêts à retenir leur tempérament pour vous.",
    },
    reversed: {
      zh: '情绪失控的征兆。TA最近感到内心疲惫、软弱，或者在相处中容易因为一件小事而引发内心深处的自卑与暴躁。',
      en: "Signs of emotional breakdown. They feel exhausted and weak inside lately, or small things easily trigger deep insecurity and anger in interactions.",
      es: 'Señales de colapso emocional. Se sienten agotados y débiles por dentro últimamente, o las pequeñas cosas fácilmente desencadenan inseguridad profunda y enojo en las interacciones.',
      fr: "Signes d'effondrement émotionnel. Ils se sentent épuisés et faibles à l'intérieur récemment, ou les petites choses déclenchent facilement une insécurité profonde et de la colère dans les interactions.",
    },
  },
  {
    id: 9,
    name: { zh: '隐者', en: 'The Hermit', emoji: '🔦' },
    upright: {
      zh: 'TA最近处于情感的内省期。TA不是不爱你，而是需要孤独的空间来思考自己的未来。这时候不宜过度逼迫TA。',
      en: "They're in a period of emotional introspection. They don't not love you—they need solitary space to think about their future. This isn't the time to push them hard.",
      es: 'Están en un período de introspección emocional. No es que no te amen—necesitan espacio solitario para pensar en su futuro. No es el momento de presionarlos fuerte.',
      fr: "Ils sont dans une période d'introspection émotionnelle. Ce n'est pas qu'ils ne vous aiment pas—ils ont besoin d'espace solitaire pour réfléchir à leur avenir. Ce n'est pas le moment de les pousser fort.",
    },
    reversed: {
      zh: '冷暴力与自我封闭。TA正在故意逃避与你的沟通，沉浸在自己的负面情绪里，这段关系让你感到孤立无援。',
      en: "Cold violence and self-isolation. They're deliberately avoiding communication with you, immersed in their own negative emotions—this relationship makes you feel isolated and helpless.",
      es: 'Violencia fría y autoaislamiento. Están evitando deliberadamente la comunicación contigo, inmersos en sus propias emociones negativas—esta relación te hace sentir aislado e indefenso.',
      fr: "Violence froide et auto-isolement. Ils évitent délibérément la communication avec vous, immergés dans leurs propres émotions négatives—cette relation vous fait sentir isolé et impuissant.",
    },
  },
  {
    id: 10,
    name: { zh: '命运之轮', en: 'Wheel of Fortune', emoji: '🎡' },
    upright: {
      zh: '宿命般的相遇。星盘与命运在此时重合，你们的关系正在迎来一个积极的转折点，顺应时势，感情会突飞猛进。',
      en: "A fateful encounter. Star charts and destiny converge at this moment—your relationship is welcoming a positive turning point. Go with the flow, and feelings will leap forward.",
      es: 'Un encuentro fatídico. Los mapas estelares y el destino convergen en este momento—su relación está dando la bienvenida a un punto de inflexión positivo. Sigan la corriente, y los sentimientos avanzarán a saltos.',
      fr: "Une rencontre fatidique. Les cartes stellaires et le destin convergent en ce moment—votre relation accueille un tournant positif. Suivez le courant, et les sentiments feront un bond en avant.",
    },
    reversed: {
      zh: '时机不对的无力感。最近你们之间可能出现了一些难以抗拒的现实阻碍（如异地、家庭），感觉怎么努力都踩不到对的点。',
      en: "A sense of powerlessness from bad timing. Recently, some irresistible real-world obstacles (like distance, family) may have appeared—feeling like no matter how hard you try, you can't catch the right moment.",
      es: 'Una sensación de impotencia por mal momento. Recientemente, algunos obstáculos irresistibles del mundo real (como distancia, familia) pueden haber aparecido—sintiendo que no importa cuánto intenten, no pueden atrapar el momento correcto.',
      fr: "Un sentiment d'impuissance dû à un mauvais timing. Récemment, certains obstacles irrésistibles du monde réel (comme la distance, la famille) ont pu apparaître—le sentiment que peu importe vos efforts, vous ne pouvez pas saisir le bon moment.",
    },
  },
  {
    id: 11,
    name: { zh: '正义', en: 'Justice', emoji: '⚖️' },
    upright: {
      zh: 'TA在用非常理智的眼光审视这段关系。TA付出多少，就希望得到你多少的回报，这是一段势均力敌、讲究平等的感情。',
      en: "They're examining this relationship with a very rational eye. How much they give, they expect the same in return—this is an equal, balanced relationship.",
      es: 'Están examinando esta relación con una mirada muy racional. Lo que dan, esperan lo mismo a cambio—esta es una relación igual y equilibrada.',
      fr: "Ils examinent cette relation avec un regard très rationnel. Ce qu'ils donnent, ils s'attendent à la même chose en retour—c'est une relation égale et équilibrée.",
    },
    reversed: {
      zh: '不公平的委屈感。你或TA觉得在这段感情里付出得不到尊重，天平倾斜了，冷战和计较正在消耗最初的爱意。',
      en: "Unfair grievance. You or they feel that giving in this relationship isn't respected—the scales are tilted, cold wars and calculations are consuming the original love.",
      es: 'Agravio injusto. Tú o ellos sienten que dar en esta relación no es respetado—las balanzas están inclinadas, las guerras frías y los cálculos están consumiendo el amor original.',
      fr: "Grief injuste. Vous ou eux sentez que donner dans cette relation n'est pas respecté—les balances sont inclinées, les guerres froides et les calculs consument l'amour originel.",
    },
  },
  {
    id: 12,
    name: { zh: '倒吊人', en: 'The Hanged Man', emoji: '🧘' },
    upright: {
      zh: '默默付出不求回报。TA愿意为了这段感情做出妥协和牺牲，此时的换位思考能够帮你们化解之前所有的矛盾。',
      en: "Silent giving without expecting return. They're willing to compromise and sacrifice for this relationship—empathy at this time can help dissolve all previous conflicts.",
      es: 'Dar silencioso sin esperar retorno. Están dispuestos a comprometerse y sacrificarse por esta relación—la empatía en este momento puede ayudar a disolver todos los conflictos anteriores.',
      fr: "Don silencieux sans attendre de retour. Ils sont prêts à faire des compromis et des sacrifices pour cette relation—l'empathie en ce moment peut aider à dissoudre tous les conflits précédents.",
    },
    reversed: {
      zh: '无谓的纠缠与白费力气。TA或你觉得自己的委屈和牺牲没有意义，感情陷入了僵局，再怎么委曲求全也换不来好结果。',
      en: "Meaningless entanglement and wasted effort. They or you feel your grievances and sacrifices are pointless—the relationship is stuck, no amount of compromise will bring good results.",
      es: 'Enredo sin sentido y esfuerzo desperdiciado. Ellos o tú sienten que tus agravios y sacrificios no tienen sentido—la relación está estancada, ninguna cantidad de compromiso traerá buenos resultados.',
      fr: "Enchevêtrement sans sens et efforts gaspillés. Eux ou vous sentez que vos griefs et sacrifices n'ont pas de sens—la relation est bloquée, aucun compromis n'apportera de bons résultats.",
    },
  },
  {
    id: 13,
    name: { zh: '死神', en: 'Death', emoji: '💀' },
    upright: {
      zh: '旧关系的终结与新生。你们之间一成不变的相处模式必须打破了，经历这次蜕变，你们会迎来更健康的相处状态。',
      en: "End of the old relationship and rebirth. The unchanged patterns between you must be broken—through this transformation, you'll welcome a healthier way of being together.",
      es: 'Fin de la vieja relación y renacimiento. Los patrones sin cambios entre ustedes deben romperse—a través de esta transformación, darán la bienvenida a una forma más saludable de estar juntos.',
      fr: "Fin de l'ancienne relation et renaissance. Les modèles inchangés entre vous doivent être brisés—à travers cette transformation, vous accueillerez une façon plus saine d'être ensemble.",
    },
    reversed: {
      zh: '关系名存实亡，或者某一方死抓着过去的矛盾不放，不愿意做出改变，让感情在痛苦中反复拉扯、原地踏步。',
      en: "The relationship exists in name only, or one side clings to past conflicts refusing to change, letting feelings repeatedly pull in pain and stay in place.",
      es: 'La relación existe solo de nombre, o un lado se aferra a conflictos pasados negándose a cambiar, dejando que los sentimientos se estanquen en dolor y permanezcan en el lugar.',
      fr: "La relation n'existe que de nom, ou un côté s'accroche aux conflits passés refusant de changer, laissant les sentiments tirer répétitivement dans la douleur et rester sur place.",
    },
  },
  {
    id: 14,
    name: { zh: '节制', en: 'Temperance', emoji: '🌊' },
    upright: {
      zh: '极佳的沟通牌。TA觉得和你在精神上非常契合，两人的情绪能够完美互补，沟通顺畅，感情正在细水长流地升温。',
      en: "An excellent communication card. They feel spiritually aligned with you—your emotions complement each other perfectly, communication flows, and feelings are steadily warming.",
      es: 'Una excelente carta de comunicación. Se sienten espiritualmente alineados contigo—sus emociones se complementan perfectamente, la comunicación fluye, y los sentimientos se calientan constantemente.',
      fr: "Une excellente carte de communication. Ils se sentent spirituellement alignés avec vous—vos émotions se complètent parfaitement, la communication coule, et les sentiments se réchauffent régulièrement.",
    },
    reversed: {
      zh: '缺乏沟通的默契。最近两人的交流如同鸡同鸭讲，情绪无法同频，甚至出现了各怀心思、难以融合的尴尬局面。',
      en: "Lack of communication chemistry. Recently, your conversations are like talking past each other, emotions can't sync up—even awkward situations of hidden thoughts and inability to merge.",
      es: 'Falta de química en la comunicación. Recientemente, sus conversaciones son como hablar pasándose el uno al otro, las emociones no pueden sincronizarse—incluso situaciones incómodas de pensamientos ocultos e incapacidad de fusionarse.',
      fr: "Manque de chimie dans la communication. Récemment, vos conversations sont comme parler l'un après l'autre, les émotions ne peuvent pas se synchroniser—même des situations gênantes de pensées cachées et d'incapacité de fusionner.",
    },
  },
  {
    id: 15,
    name: { zh: '恶魔', en: 'The Devil', emoji: '😈' },
    upright: {
      zh: '致命的诱惑与执念。TA对你有着极强的肉体依恋或占有欲，这段感情带着一丝虐恋和宿命感，明知危险却欲罢不能。',
      en: "Fatal temptation and obsession. They have an intense physical attachment or possessiveness toward you—this relationship carries a hint of toxic love and destiny, knowing it's dangerous but unable to stop.",
      es: 'Tentación fatal y obsesión. Tienen un apego físico intenso o posesividad hacia ti—esta relación lleva un toque de amor tóxico y destino, sabiendo que es peligroso pero incapaces de parar.',
      fr: "Tentation fatale et obsession. Ils ont un attachement physique intense ou de la possessivité envers vous—cette relation porte une touche d'amour toxique et de destin, sachant que c'est dangereux mais incapable d'arrêter.",
    },
    reversed: {
      zh: '试图摆脱束缚。某一方正在从盲目的迷恋中清醒过来，想要打破这种不健康的依恋关系，或者正在割舍内心的执念。',
      en: "Trying to break free from bondage. One side is waking up from blind infatuation, wanting to break this unhealthy attachment, or cutting off inner obsession.",
      es: 'Intentando liberarse de las ataduras. Un lado está despertando de la infatuación ciega, queriendo romper este apego no saludable, o cortando la obsesión interior.',
      fr: "Essayer de se libérer des liens. Un côté se réveille de l'infatuation aveugle, voulant briser cet attachement malsain, ou coupant l'obsession intérieure.",
    },
  },
  {
    id: 16,
    name: { zh: '高塔', en: 'The Tower', emoji: '⚡' },
    upright: {
      zh: '突如其来的冲击。你们的关系近期会面临一场激烈的争吵、冷战或现实事件的考验，原有的伪装和问题将被彻底震碎。',
      en: "Sudden shock. Your relationship will soon face an intense argument, cold war, or real-world test—original disguises and problems will be completely shattered.",
      es: 'Impacto repentino. Su relación pronto enfrentará una discusión intensa, guerra fría o prueba del mundo real—las máscaras y problemas originales serán completamente destrozados.',
      fr: "Choc soudain. Votre relation fera bientôt face à une dispute intense, une guerre froide ou une épreuve du monde réel—les déguisements et problèmes originaux seront complètement brisés.",
    },
    reversed: {
      zh: '风暴前的死寂。矛盾早已积压到了顶点，虽然目前还没爆发，但如果继续粉饰太平，更大的危机只是时间问题。',
      en: "Dead silence before the storm. Contradictions have long accumulated to a peak—although it hasn't erupted yet, if you keep pretending everything's fine, a bigger crisis is just a matter of time.",
      es: 'Silencio mortal antes de la tormenta. Las contradicciones se han acumulado hasta un pico—aunque aún no ha estallado, si siguen fingiendo que todo está bien, una crisis mayor es solo cuestión de tiempo.',
      fr: "Silence mortel avant la tempête. Les contradictions se sont accumulées jusqu'à un pic—bien que cela n'ait pas encore éclaté, si vous continuez à prétendre que tout va bien, une crise plus grande n'est qu'une question de temps.",
    },
  },
  {
    id: 17,
    name: { zh: '星星', en: 'The Star', emoji: '⭐' },
    upright: {
      zh: '充满希望与治愈。TA把你看作生命里的白月光，对未来抱有美好的憧憬。即使之前有伤痕，现在也是最佳的修复期。',
      en: "Full of hope and healing. They see you as the white moonlight in their life, holding beautiful visions for the future. Even if there were scars before, now is the best time for healing.",
      es: 'Lleno de esperanza y curación. Te ven como la luz de luna blanca en su vida, sosteniendo visiones hermosas para el futuro. Incluso si hubo cicatrices antes, ahora es el mejor momento para sanar.',
      fr: "Plein d'espoir et de guérison. Ils vous voient comme le clair de lune blanc dans leur vie, tenant de belles visions pour l'avenir. Même s'il y avait des cicatrices avant, maintenant c'est le meilleur moment pour guérir.",
    },
    reversed: {
      zh: '理想破灭的失望感。TA或你把这段感情想得太完美，当现实的柴米油盐压下来时，产生了大失所望的心理落差。',
      en: "Disappointment from shattered ideals. They or you thought of this relationship too perfectly—when real-world daily life pressures down, a huge psychological gap of disappointment emerges.",
      es: 'Decepción por ideales destrozados. Ellos o tú pensaron en esta relación demasiado perfectamente—cuando la vida diaria del mundo real presiona, surge una enorme brecha psicológica de decepción.',
      fr: "Déception des idéaux brisés. Eux ou vous ont pensé cette relation trop parfaitement—quand la vie quotidienne du monde réel pèse, un énorme écart psychologique de déception émerge.",
    },
  },
  {
    id: 18,
    name: { zh: '月亮', en: 'The Moon', emoji: '🌕' },
    upright: {
      zh: '不安、焦虑与猜忌。TA最近内心极度缺乏安全感，对你忽冷忽热是因为TA害怕受伤，这段关系里隐藏着你没看清的迷雾。',
      en: "Unease, anxiety, and suspicion. They feel extremely insecure inside lately—hot and cold behavior is because they fear getting hurt. There's fog in this relationship you haven't seen through.",
      es: 'Inquietud, ansiedad y sospecha. Se sienten extremadamente inseguros por dentro últimamente—comportamiento caliente y frío porque temen salir lastimados. Hay niebla en esta relación que no has visto claramente.',
      fr: "Inquiétude, anxiété et soupçon. Ils se sentent extrêmement insécures à l'intérieur récemment—comportement chaud et froid parce qu'ils ont peur d'être blessés. Il y a du brouillard dans cette relation que vous n'avez pas vu clairement.",
    },
    reversed: {
      zh: '迷雾正在散去。内心的恐惧、怀疑和误会开始慢慢解开，隐藏的真相浮出水面，感情即将重新找回光明。',
      en: "The fog is lifting. Inner fears, doubts, and misunderstandings are slowly unraveling—hidden truths are surfacing, and the relationship is about to find light again.",
      es: 'La niebla se está levantando. Los miedos internos, dudas y malentendidos se están desenvolviendo lentamente—las verdades ocultas están saliendo a la superficie, y la relación está a punto de encontrar la luz de nuevo.',
      fr: "Le brouillard se lève. Les peurs intérieures, les doutes et les malentendus se dénouent lentement—les vérités cachées émergent, et la relation est sur le point de retrouver la lumière.",
    },
  },
  {
    id: 19,
    name: { zh: '太阳', en: 'The Sun', emoji: '☀️' },
    upright: {
      zh: '光明磊落，热烈纯粹。TA对你的爱没有任何杂质，和你在一起TA感到无比快乐。这是一张能带来结婚、怀孕等大喜讯的牌。',
      en: "Bright and open, passionate and pure. Their love for you has no impurities—they feel incredibly happy with you. This card can bring great news like marriage, pregnancy.",
      es: 'Brillante y abierto, apasionado y puro. Su amor por ti no tiene impurezas—se sienten increíblemente felices contigo. Esta carta puede traer grandes noticias como matrimonio, embarazo.',
      fr: "Brillant et ouvert, passionné et pur. Leur amour pour vous n'a pas d'impuretés—they feel incredibly happy with you. Cette carte peut apporter de grandes nouvelles comme le mariage, la grossesse.",
    },
    reversed: {
      zh: '虽然依旧有爱，但光芒有些黯淡。TA最近可能有些骄傲或自我中心，或者你们的相处缺乏了一点最初的新鲜感。',
      en: "Still love, but the light is a bit dim. They might be somewhat proud or self-centered lately, or your interactions lack a bit of the initial freshness.",
      es: 'Todavía hay amor, pero la luz está un poco tenue. Podrían estar algo orgullosos o egocéntricos últimamente, o sus interacciones carecen un poco de la frescura inicial.',
      fr: "Il y a toujours de l'amour, mais la lumière est un peu tamisée. Ils pourraient être quelque peu fiers ou égocentriques récemment, ou vos interactions manquent un peu de la fraîcheur initiale.",
    },
  },
  {
    id: 20,
    name: { zh: '审判', en: 'Judgement', emoji: '📯' },
    upright: {
      zh: '破镜重圆与重大抉择。如果是冷战或分手的状态，这张牌代表着关系的转机和重修旧好的信号；你们需要为未来做一个诚实的决定。',
      en: "Reunion and major decision. If in cold war or broken up state, this card represents a turning point and signal for reconciliation—you need to make an honest decision for the future.",
      es: 'Reunión y decisión importante. Si están en guerra fría o rotos, esta carta representa un punto de inflexión y señal de reconciliación—necesitan tomar una decisión honesta para el futuro.',
      fr: "Réunion et décision majeure. Si en guerre froide ou état de rupture, cette carte représente un tournant et un signal de réconciliation—vous devez prendre une décision honnête pour l'avenir.",
    },
    reversed: {
      zh: '错失良机或拒绝清醒。面对感情中的问题，某一方选择装聋作哑，不愿意直面内心的审判，导致关系继续拖延恶化。',
      en: "Missing the opportunity or refusing to wake up. Facing relationship problems, one side chooses to play deaf and dumb, unwilling to face inner judgment—causing the relationship to drag on and worsen.",
      es: 'Perder la oportunidad o negarse a despertar. Enfrentando problemas de relación, un lado elige hacerse el sordo y mudo, no dispuesto a enfrentar el juicio interior—causando que la relación se arrastre y empeore.',
      fr: "Manquer l'opportunité ou refuser de se réveiller. Face aux problèmes de relation, un côté choisit de faire le sourd et le muet, pas prêt à faire face au jugement intérieur—causant la relation à traîner et s'aggraver.",
    },
  },
  {
    id: 21,
    name: { zh: '世界', en: 'The World', emoji: '🌍' },
    upright: {
      zh: '功德圆满。TA认为你就是TA一直在寻找的灵魂伴侣，两人的感情达到了一个完美的闭环，非常适合走向谈婚论嫁的终点。',
      en: "Complete fulfillment. They believe you're the soulmate they've been searching for—your relationship has reached a perfect closure, very suitable for moving toward marriage.",
      es: 'Realización completa. Creen que eres la media naranja que han estado buscando—su relación ha alcanzado un cierre perfecto, muy adecuada para avanzar hacia el matrimonio.',
      fr: "Accomplissement complet. Ils croient que vous êtes l'âme sœur qu'ils recherchent—votre relation a atteint une clôture parfaite, très appropriée pour avancer vers le mariage.",
    },
    reversed: {
      zh: '差临门一脚。感情虽然大体很好，但总觉得还不够圆满，某个现实问题（如卡在最后的买房、定居）没有得到最终解决。',
      en: "One step short. The relationship is generally good, but feels not quite complete—some real-world issue (like stuck on final house purchase, settling down) hasn't been finally resolved.",
      es: 'A un paso de la meta. La relación es generalmente buena, pero se siente no del todo completa—algún problema del mundo real (como atascado en la compra final de casa, establecimiento) no ha sido resuelto finalmente.',
      fr: "À un pas près. La relation est globalement bonne, mais semble pas tout à fait complète—certains problèmes du monde réel (comme bloqué sur l'achat final de maison, l'installation) n'ont pas été finalement résolus.",
    },
  },
];

module.exports = { MAJOR_ARCANA };