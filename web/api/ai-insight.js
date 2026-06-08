// Force Node.js 20 runtime (avoid Edge crypto issue)
export const runtime = 'nodejs20.x';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

// ── Tarot data (22 Major Arcana) ──
const MAJOR_ARCANA = [
  { id: 0, name: { zh: '愚人', en: 'The Fool', emoji: '🌟' }, loveUpright: '你们的关系正处于一个令人兴奋的起点，如同愚人踏上新的旅程，充满未知与可能性。这不是草率的决定，而是内心深处对爱的呼唤。保持开放与好奇，你们正在书写属于自己的故事。', loveReversed: '最近可能有些冲动或考虑不周的地方，但不要因此后悔。每一段旅程都有其意义，这段经历正在教会你们更清楚地认识自己。不妨放慢脚步，等彼此都准备好了再继续前行。' },
  { id: 1, name: { zh: '魔术师', en: 'The Magician', emoji: '🔮' }, loveUpright: '你们之间有强大的吸引力与创造力，可以通过沟通与行动把愿景变成实际。不要害怕展现真实的自己——你们拥有彼此需要的一切资源。', loveReversed: '也许你们之间存在沟通不顺畅或行动力不足的问题。魔术师提醒你：你们本拥有所需的一切，只是需要重新找到焦点。坦诚面对问题，把注意力放回你们共同的愿景上。' },
  { id: 2, name: { zh: '女祭司', en: 'The High Priestess', emoji: '🌙' }, loveUpright: '你们的关系中有些层面需要用心去感受而非用眼去看。答案可能不在表面，而在彼此的直觉与沉默中。那些无声的理解，往往是最深刻的连接。', loveReversed: '也许有些事情被掩盖了，或者你们都在揣测对方的心思却不敢开口。勇敢问出那个问题，或者说出藏在心底的话。沟通是解开女祭司之谜的钥匙。' },
  { id: 3, name: { zh: '女皇', en: 'The Empress', emoji: '🌺' }, loveUpright: '你们的关系正在一个丰盛与滋养的阶段，女皇象征着爱与关怀的自然流动。这段感情像花园一样需要持续浇灌，保持对彼此的关怀与欣赏，你们会看到它茁壮成长。', loveReversed: '也许你们最近的关系中少了些滋养与关怀，或者有一方感到被忽视。女皇提醒：爱需要表达出来才有生命力。今天做一件小事让对方感受到你的在乎。' },
  { id: 4, name: { zh: '皇帝', en: 'The Emperor', emoji: '👑' }, loveUpright: '你们的关系正在建立一种稳定与结构感，皇帝代表着成熟与负责。如果你们正在规划未来，此刻适合做实际的决定。', loveReversed: '也许其中一方过于强势或控制，让另一方感到被压制。真正的力量来自于尊重，而非控制。试着倾听对方的声音，找到让彼此都舒适的相处方式。' },
  { id: 5, name: { zh: '教皇', en: 'The Hierophant', emoji: '🙏' }, loveUpright: '你们的关系建立在共同的价值观与信念之上，教皇象征着精神连接与传统的智慧。这种深层的一致性是关系的锚点，不妨和对方分享你内心的信仰与追求。', loveReversed: '也许你们的关系面临着一个选择：是否要打破常规，走出舒适区。勇敢讨论你们真正想要的是什么。' },
  { id: 6, name: { zh: '恋人', en: 'The Lovers', emoji: '💕' }, loveUpright: '恋人牌是你们关系的核心象征。这不仅是一段浪漫的吸引，更是价值观与灵魂层面的契合。你们在彼此身上看到了自己渴望成为的样子，也在差异中找到了成长的机会。', loveReversed: '你们之间可能存在价值观的差异或沟通的障碍，但这不是无法跨越的鸿沟。恋人逆位提醒：先对自己诚实，再对对方坦诚。' },
  { id: 7, name: { zh: '战车', en: 'The Chariot', emoji: '🏛️' }, loveUpright: '你们的关系正朝着一个共同目标前进，战车代表着意志力与决心。你们都愿意为这段感情付出努力，并且在困难面前不会轻易放弃。记住：你们是同一个团队的。', loveReversed: '也许你们中的一个感到失去了对关系的控制，或者你们在朝着不同的方向使劲。真正的胜利是让彼此都到达目的地。放下谁对谁错，找到你们都能接受的中间点。' },
  { id: 8, name: { zh: '力量', en: 'Strength', emoji: '🦁' }, loveUpright: '你们之间最强大的连接不是激情，而是深层的理解与接纳。力量牌代表着内在的勇气——不是要压制什么，而是温柔地引导。当你们都敢于做真实的自己，这段关系才会真正稳固。', loveReversed: '也许你们中的一个感到筋疲力尽。力量逆位提醒：疲惫是因为你在用错误的方式使劲。有时候，退后一步、给自己空间，反而能找回内在的力量。爱不是牺牲自己，而是彼此赋能。' },
  { id: 9, name: { zh: '隐者', en: 'The Hermit', emoji: '🔦' }, loveUpright: '你们的关系正在一个需要深度思考的阶段。隐者不是孤独，而是有意识的独处来寻找内心的答案。也许你们需要一些时间和空间来思考这段关系的意义。今天试着发起一次真正深入的对话——不是表面的寒暄，而是心与心的交流。', loveReversed: '也许你们最近都沉浸在自己的世界里，减少了真正的连接。隐者逆位警告：过度的独处会变成孤立，而孤立会伤害关系。' },
  { id: 10, name: { zh: '命运之轮', en: 'Wheel of Fortune', emoji: '🎡' }, loveUpright: '你们的关系正处于一个转折点。命运之轮正在转动——无论之前经历了什么，新的阶段即将开始。接受变化，拥抱未知。有时候，最好的事情发生在我们最意想不到的时刻。', loveReversed: '也许你们感到事情停滞不前，或者机遇被延误了。命运之轮逆位提醒：时机未到不代表不会到来。耐心是一种智慧，尤其是在感情中。' },
  { id: 11, name: { zh: '正义', en: 'Justice', emoji: '⚖️' }, loveUpright: '你们的关系需要建立在真诚与公平的基础上。正义牌提醒：真正的亲密需要双方都愿意展示真实的自己，包括优点和缺点。如果有什么需要被说出来，现在是正视它的时候。', loveReversed: '也许你们之间存在一些未解决的误会或不平衡。正义逆位警告：逃避或忽视不会让问题消失，只会让它积累。今天，勇敢地说出那个一直没说出口的想法。' },
  { id: 12, name: { zh: '倒吊人', en: 'The Hanged Man', emoji: '🧘' }, loveUpright: '你们的关系可能正在经历一个「暂停」的时刻。倒吊人不是放弃，而是换一个视角看问题。有时候，停下来等待，比盲目前进更有智慧。不要急于做出重大决定——当你们准备好时，答案会自然浮现。', loveReversed: '也许你们中的一个感到一直在为这段关系「牺牲」，而没有得到回报。倒吊人逆位提醒：健康的牺牲是自愿的，而长期的失衡会伤害双方。今天，诚实地问自己：这段关系中，我的需求被满足了吗？' },
  { id: 13, name: { zh: '死神', en: 'Death', emoji: '💀' }, loveUpright: '死神牌在感情中往往是最有力量的牌之一——它代表着结束，也代表着转变。也许你们正在经历某些方面的「死去」：旧的习惯、旧的期望。这是痛苦的，但也是必要的。每一段关系的重生，都需要先放下过去。', loveReversed: '也许你们害怕某个结束，或者在等待一个必然会来的变化。死神逆位提醒：恐惧只会延长痛苦。当断则断，重生总是从勇气开始。' },
  { id: 14, name: { zh: '节制', en: 'Temperance', emoji: '🌊' }, loveUpright: '你们的关系正在寻找一个平衡点。节制牌代表着耐心与调和——你们不需要走极端，而是在两个极端之间找到自己的路。找到让彼此都舒适的中间地带，让关系在温和中成长。', loveReversed: '也许你们的关系太「热」或太「冷」——要么过于激烈，要么过于疏远。节制逆位警告：长期的失衡会伤害关系。今天，主动做出调整，让关系回到更平衡的状态。' },
  { id: 15, name: { zh: '恶魔', en: 'The Devil', emoji: '😈' }, loveUpright: '你们的关系中可能存在一些「束缚」——也许是对彼此的过度依赖，也许是一些不健康的模式。恶魔牌提醒我们：有些锁链是我们自己戴上的。识别那些让你们感到被困住的部分，然后问自己：这是真的吗？我真的想要这样吗？觉醒是自由的第一步。', loveReversed: '也许你们正在挣脱一些限制，或者刚刚意识到某些模式的问题。恶魔逆位代表着解放与觉醒。你们正在从旧有的束缚中走出来。不要害怕真相，不要害怕改变。你们比那些限制你们的东西更强大。' },
  { id: 16, name: { zh: '塔', en: 'The Tower', emoji: '⚡' }, loveUpright: '塔牌代表着突然的震动——也许是你们关系中某个隐藏的问题突然浮出水面。这看起来是破坏性的，但实际上是必要的清理。塔倒下后，才能重建更稳固的基础。不要抗拒变化，接受它——这是你们关系升级的阵痛。', loveReversed: '也许你们都在避免某个必然会发生的变化，或者假装问题不存在。塔逆位提醒：拖延不会让问题消失，只会让它以更剧烈的方式爆发。今天，主动面对那个你们一直在逃避的问题。' },
  { id: 17, name: { zh: '星星', en: 'The Star', emoji: '⭐' }, loveUpright: '星星为你们的关系带来了希望的光芒。在经历了一些挑战之后，你们的关系正在进入一个疗愈与重生的阶段。星星象征着灵感、愿景与内在的平静。你们比之前更清楚地知道自己想要什么，也更有信心去追求它。不要忘记你们内心的那束光，它会指引你们前进。', loveReversed: '也许你们中的一方或双方感到失去了方向，或者经历了挫折后难以恢复信心。星星逆位提醒：即使在最黑暗的时刻，星星依然在那里。今天，想想你们可以做什么来为这段关系增加一些正能量。' },
  { id: 18, name: { zh: '月亮', en: 'The Moon', emoji: '🌕' }, loveUpright: '月亮牌提醒你们：关系中有些东西可能不是表面看到的那样。也许你们都在揣测对方的心思，或者有些恐惧是源于想象而非现实。月亮鼓励你们：相信直觉，但也要验证直觉。勇敢地问出你们真实的感受，而不是在黑暗中猜测。', loveReversed: '也许你们最近都在焦虑或恐惧中度过，一些误解或猜测正在伤害你们的关系。月亮逆位带来好消息：迷雾正在散去，真相正在浮现。诚实的对话，是驱散月光的最好方式。' },
  { id: 19, name: { zh: '太阳', en: 'The Sun', emoji: '☀️' }, loveUpright: '太阳牌为你们的关系带来了最温暖的能量！你们的关系正处于一个充满活力与喜悦的阶段。太阳象征着成功、快乐与生命力——你们之间的相处让彼此都感到被滋养。这段感情让你们的生命更加明亮，也给了你们面对世界的勇气。珍惜这段时光，享受彼此的陪伴。', loveReversed: '也许你们最近感到关系中少了些阳光，或者有一方感到不快乐。太阳逆位提醒：快乐是需要被维护的。今天，想想你们可以做什么来为这段关系增加一些正能量——一个拥抱，一句赞美，都能让阳光重新照进来。' },
  { id: 20, name: { zh: '审判', en: 'Judgement', emoji: '📯' }, loveUpright: '审判牌为你们的关系带来了一个反思与觉醒的时刻。也许你们正在回顾这段关系的旅程，或者正在做一个重要的决定。审判召唤你们：倾听内心的声音，它已经知道了答案。不要因为过去的错误而自我责备——每一次经历都在为你们此刻的智慧让路。新的章节正在开启。', loveReversed: '也许你们中的一个感到自我怀疑，或者在犹豫是否要继续这段关系。审判逆位提醒：犹豫不决不会带来答案，反而会消耗你们的能量。今天，给自己一个安静的时刻，问自己：我真正想要的是什么？你值得被爱，你也值得去爱。' },
  { id: 21, name: { zh: '世界', en: 'The World', emoji: '🌍' }, loveUpright: '世界牌象征着你们关系的一个圆满时刻。你们共同经历了一段完整的旅程，现在正在一个整合与完成的节点上。这不是结束，而是新的开始。世界提醒你们：庆祝你们的成就，感激这段旅程中的每一次成长。你们已经做到了很多，值得为彼此骄傲。', loveReversed: '也许你们感到某些事情还没有完成，或者还有未解决的问题。世界逆位提醒：圆满不是一蹴而就的，它需要你们继续努力。今天，回顾你们已经走过的路——你们已经比开始时成长了太多。继续前进，圆满会自然到来。' },
];

// ── In-memory cache ──
const insightCache = new Map();
const MAX_CACHE = 200;

// ── Deterministic tarot card selection based on birthdates + date ──
function selectTarotCard(d1, d2) {
  const today = new Date();
  const seed = (d1 + d2 + today.toISOString().slice(0, 10)).replace(/[-:]/g, '');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  // Also consider day of week as a factor
  hash = hash * 31 + today.getDay();
  const index = Math.abs(hash) % MAJOR_ARCANA.length;
  const isReversed = Math.abs(hash * 7) % 3 !== 0; // ~67% upright, ~33% reversed
  return { card: MAJOR_ARCANA[index], isReversed };
}

function cacheKey(d1, d2, overall, dims, lang) {
  return `${d1}|${d2}|${overall}|${JSON.stringify(dims)}|${lang}`;
}

// ── Build prompt ──
function buildPrompt({ d1, d2, overall, dims, bazi, zodiac, iching }, lang = 'en') {
  const isZh = lang === 'zh';
  const isFr = lang === 'fr';
  const isEs = lang === 'es';

  // Select tarot card based on birthdates
  const { card, isReversed } = selectTarotCard(d1, d2);
  const cardName = isZh ? card.name.zh : card.name.en;
  const cardEmoji = card.emoji;
  const cardMeaning = isReversed ? card.loveReversed : card.loveUpright;
  const orientation = isReversed ? (isZh ? '逆位' : 'Reversed') : (isZh ? '正位' : 'Upright');

  const systemPrompt = isZh
    ? '你是 KindredSouls 的 AI 情感顾问。用户输入了一对情侣的命理数据，请用温暖、专业、积极的语气，给出关系洞察。只用中文输出。不要预测分手或负面结局，始终给予希望和具体行动建议。'
    : isFr
    ? "Tu es le conseiller sentimental IA de KindredSouls. Basé sur les données de compatibilité d'un couple, donne 3–5 phrases d'insight chaleureux, professionnel et positif. Réponds uniquement en français. Ne prédis jamais de rupture. Donne toujours de l'espoir et des conseils pratiques."
    : isEs
    ? 'Eres el consejero sentimental IA de KindredSouls. Basado en los datos de compatibilidad de una pareja, da 3–5 frases de insight cálido, profesional y positivo. Responde solo en español. Nunca predigas ruptura. Siempre da esperanza y consejos prácticos.'
    : 'You are the AI relationship advisor for KindredSouls. Based on the user input (a couple compatibility data), give 3–5 sentences of warm, professional, and positive relationship insight. Only respond in English. Never predict breakups or negative outcomes. Always give hope and specific actionable advice.';

  const tarotSection = isZh
    ? `\n\n塔罗指引：今日为你们摇动了命运的塔罗，显化为【${cardEmoji} ${cardName} · ${orientation}】。${cardMeaning}`
    : isFr
    ? `\n\n💡 guidance tarot: Aujourd'hui, le destin vous a tiré 【${cardEmoji} ${cardName} · ${orientation}】. ${cardMeaning}`
    : isEs
    ? `\n\n💡 guía del tarot: Hoy el destino les ha repartido 【${cardEmoji} ${cardName} · ${orientation}】. ${cardMeaning}`
    : `\n\n💡 Today's tarot card for you: 【${cardEmoji} ${cardName} · ${orientation}】. ${cardMeaning}`;

  const userPrompt = isZh
    ? `用户生日: ${d1}，TA生日: ${d2}\n综合分: ${overall}/100\n四维度: 爱情 ${dims.love} | 沟通 ${dims.communication} | 默契 ${dims.chemistry} | 稳定 ${dims.stability}\n八字: ${bazi}\n星座: ${zodiac}\n易经: ${iching}${tarotSection}`
    : isFr
    ? `Anniversaire: ${d1}, Partenaire: ${d2}\nScore global: ${overall}/100\nDimensions: Amour ${dims.love} | Communication ${dims.communication} | Chimie ${dims.chemistry} | Stabilité ${dims.stability}\nAstrologie chinoise: ${bazi}\nZodiaque occidental: ${zodiac}\nI Ching: ${iching}${tarotSection}`
    : isEs
    ? `Cumpleaños: ${d1}, Pareja: ${d2}\nPuntuación global: ${overall}/100\nDimensiones: Amor ${dims.love} | Comunicación ${dims.communication} | Química ${dims.chemistry} | Estabilidad ${dims.stability}\nAstrología china: ${bazi}\nZodíaco occidental: ${zodiac}\nI Ching: ${iching}${tarotSection}`
    : `Your birthday: ${d1}, Their birthday: ${d2}\nOverall score: ${overall}/100\nFour dimensions: Love ${dims.love} | Communication ${dims.communication} | Chemistry ${dims.chemistry} | Stability ${dims.stability}\nChinese Astrology: ${bazi}\nWestern Zodiac: ${zodiac}\nI Ching: ${iching}${tarotSection}`;

  return { systemPrompt, userPrompt, tarotCard: { ...card, isReversed, orientation } };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { d1, d2, overall, dims, bazi, zodiac, iching, lang = 'en' } = req.body;
  if (!d1 || !d2 || !dims) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DeepSeek API key not configured' });
  }

  const key = cacheKey(d1, d2, overall, dims, lang);
  if (insightCache.has(key)) {
    return res.status(200).json({ insight: insightCache.get(key), cached: true });
  }

  const { systemPrompt, userPrompt, tarotCard } = buildPrompt(
    { d1, d2, overall, dims, bazi, zodiac, iching },
    lang
  );

  try {
    const response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.7,
        max_tokens: 450,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim();
    if (!insight) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    const clean = insight
      .replace(/[\u2640-\u26FF]/g, '')
      .replace(/[\u2700-\u27BF]/g, '');

    if (insightCache.size >= MAX_CACHE) {
      const firstKey = insightCache.keys().next().value;
      insightCache.delete(firstKey);
    }
    insightCache.set(key, clean);

    return res.status(200).json({ insight: clean, cached: false, tarot: tarotCard });
  } catch (err) {
    console.error('ai-insight handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}