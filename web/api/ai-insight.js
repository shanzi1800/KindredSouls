// Force Node.js 20 runtime (avoid Edge crypto issue)
export const runtime = 'nodejs20.x';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

// ── Import tarot data (22 Major Arcana, 4 languages) ──
import { MAJOR_ARCANA } from './tarot-cards.js';

// ── In-memory cache ──
const insightCache = new Map();
const MAX_CACHE = 200;

// ── Deterministic tarot card selection based on birthdates + date ──
function selectTarotCard(d1, d2, lang = 'en') {
  // Remove all non-digit characters (e.g. 1995-08-24 -> 19950824)
  const str1 = d1.replace(/\D/g, '');
  const str2 = d2.replace(/\D/g, '');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Combine birthdates + date as seed
  const combinedStr = str1 + str2 + dateStr;
  let hash = 0;
  for (let i = 0; i < combinedStr.length; i++) {
    hash = combinedStr.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  const seed = Math.abs(hash);

  // Calculate card ID (0-21)
  const cardId = seed % 22;

  // Calculate orientation (0 = upright, 1 = reversed)
  // Use floor(seed/22) to avoid simple correlation with cardId
  const isReversed = Math.floor(seed / 22) % 2 === 1;

  const card = MAJOR_ARCANA.find((c) => c.id === cardId);
  const cardName = card.name[lang] || card.name.en;
  const cardEmoji = card.emoji;
  const cardMeaning = isReversed ? card.reversed[lang] || card.reversed.en : card.upright[lang] || card.upright.en;
  const orientation = isReversed ? (lang === 'zh' ? '逆位' : 'Reversed') : (lang === 'zh' ? '正位' : 'Upright');

  return { card, cardName, cardEmoji, cardMeaning, isReversed, orientation, cardId };
}

function cacheKey(d1, d2, overall, dims, lang) {
  return `${d1}|${d2}|${overall}|${JSON.stringify(dims)}|${lang}`;
}

// ── Build prompt ──
function buildPrompt({ d1, d2, overall, dims, bazi, zodiac, iching }, lang = 'en') {
  const isZh = lang === 'zh';

  const systemPrompt = isZh
    ? '你是 KindredSouls 的 AI 情感顾问。用户输入了一对情侣的命理数据，请用温暖、专业、积极的语气，给出关系洞察。只用中文输出。不要预测分手或负面结局，始终给予希望和具体行动建议。'
    : 'You are the AI relationship advisor for KindredSouls. Based on the user input (a couple compatibility data), give 3–5 sentences of warm, professional, and positive relationship insight. Only respond in English. Never predict breakups or negative outcomes. Always give hope and specific actionable advice.';

  // Select tarot card based on birthdates
  const { cardName, cardEmoji, cardMeaning, isReversed, orientation, cardId } = selectTarotCard(d1, d2, lang);

  const tarotSection = isZh
    ? `\n\n🔮 塔罗指引：今日为你们摇动了命运的塔罗，显化为【${cardEmoji} ${cardName} · ${orientation}】。${cardMeaning}`
    : `\n\n🔮 Tarot Guidance: Today's card for you is 【${cardEmoji} ${cardName} · ${orientation}】. ${cardMeaning}`;

  const userPrompt = isZh
    ? `用户生日: ${d1}，TA生日: ${d2}\n综合分: ${overall}/100\n四维度: 爱情 ${dims.love} | 沟通 ${dims.communication} | 默契 ${dims.chemistry} | 稳定 ${dims.stability}\n八字: ${bazi}\n星座: ${zodiac}\n易经: ${iching}${tarotSection}`
    : `Your birthday: ${d1}, Their birthday: ${d2}\nOverall score: ${overall}/100\nFour dimensions: Love ${dims.love} | Communication ${dims.communication} | Chemistry ${dims.chemistry} | Stability ${dims.stability}\nChinese Astrology: ${bazi}\nWestern Zodiac: ${zodiac}\nI Ching: ${iching}${tarotSection}`;

  return { systemPrompt, userPrompt, tarotCard: { id: cardId, name: cardName, emoji: cardEmoji, isReversed, orientation } };
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