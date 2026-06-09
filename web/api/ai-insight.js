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
  const str1 = d1.replace(/\D/g, '');
  const str2 = d2.replace(/\D/g, '');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  const combinedStr = str1 + str2 + dateStr;
  let hash = 0;
  for (let i = 0; i < combinedStr.length; i++) {
    hash = combinedStr.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const seed = Math.abs(hash);

  const cardId = seed % 22;
  const isReversed = Math.floor(seed / 22) % 2 === 1;

  const card = MAJOR_ARCANA.find((c) => c.id === cardId);
  const cardName = card.name[lang] || card.name.en;
  const cardEmoji = card.emoji;
  const cardMeaning = isReversed
    ? card.reversed[lang] || card.reversed.en
    : card.upright[lang] || card.upright.en;
  const orientation = isReversed
    ? (lang === 'zh' ? '逆位' : 'Reversed')
    : (lang === 'zh' ? '正位' : 'Upright');

  return { card, cardName, cardEmoji, cardMeaning, isReversed, orientation, cardId };
}

function cacheKey(d1, d2, overall, dims, lang) {
  return `${d1}|${d2}|${overall}|${JSON.stringify(dims)}|${lang}`;
}

// ── Build prompt ──
function buildPrompt({ d1, d2, overall, dims, bazi, zodiac, iching }, lang = 'en') {
  const isZh = lang === 'zh';

  const systemPrompt = isZh
    ? `你是 KindredSouls 的 AI 情感顾问。

核心哲学：语言、文化、逻辑丝滑融合，才是我们的核心竞争力。

输出格式铁律（必须遵守）：
- 禁止使用 ###、##、# 等标题符号
- 禁止使用 **粗体**、*斜体* 等 Markdown 符号
- 禁止使用 ---、*** 等分隔线
- 用自然换行分段，不要用任何格式符号
- 塔罗牌信息必须写在正文最后，格式：【今日塔罗指引】牌名（正位/逆位）：一句话解读

内容规则：
1. 不要写三个模块（八字一段、星座一段、易经一段），要融成一段
2. 三个体系的术语要打通——用同一个比喻把它们串起来
3. 塔罗牌是洞察的终点，不是附录——用塔罗牌的意象收尾，落在具体的情感画面上
4. 语言要有文采，但不掉书袋
5. 永远给希望，永远不预测分手
6. 100-180字，有料、有温度、有逻辑`
    : `You are the AI relationship advisor for KindredSouls.

Core philosophy: Seamless integration of language, culture, and logic is our core competitive advantage.

OUTPUT FORMAT RULES (must obey):
- NO ### headers, NO ## headers, NO # headers
- NO **bold**, NO *italic*, NO Markdown symbols
- NO --- or *** dividers
- Use natural line breaks only, no formatting symbols
- Tarot card info MUST appear at the end, format: [Tarot Guidance] Card Name (Upright/Reversed): one-sentence insight

Content rules:
1. Do NOT write three separate sections. Weave into ONE flowing narrative.
2. Find the ONE relationship truth, build one metaphor.
3. The tarot card is the CLOSING insight, not a footnote.
4. Poetic but not pedantic.
5. Always hopeful, NEVER predict breakup.
6. 80-150 words.`;

  // Select tarot card
  const { cardName, cardEmoji, cardMeaning, isReversed, orientation, cardId } =
    selectTarotCard(d1, d2, lang);

  const tarotLine = isZh
    ? `\\n\\n【今日塔罗指引】${cardEmoji} ${cardName}（${orientation}）：${cardMeaning}`
    : `\\n\\n[Tarot Guidance] ${cardEmoji} ${cardName} (${orientation}): ${cardMeaning}`;

  const userPrompt = isZh
    ? `你的生日: ${d1}，TA的生日: ${d2}
综合契合: ${overall}/100（爱情${dims.love} | 沟通${dims.communication} | 默契${dims.chemistry} | 稳定${dims.stability}）
星座: ${zodiac}
八字: ${bazi}
易经: ${iching}

请写一段丝滑融合的洞察（100-180字），禁止任何 Markdown 格式符号（###、**等）。最后必须在正文末尾另起一行，写上【今日塔罗指引】并包含牌名、正逆位和牌意解读。`
    : `Your birthday: ${d1}, TA's birthday: ${d2}
Compatibility: ${overall}/100 (Love ${dims.love} | Comms ${dims.communication} | Chemistry ${dims.chemistry} | Stability ${dims.stability})
Zodiac: ${zodiac}
Bazi: ${bazi}
I Ching: ${iching}

Write one flowing insight (80-150 words). NO Markdown symbols (no ###, no **). You MUST end with a [Tarot Guidance] line containing the card name, orientation, and meaning.`;

  return {
    systemPrompt,
    userPrompt,
    tarotCard: { id: cardId, name: cardName, emoji: cardEmoji, isReversed, orientation },
    tarotLine, // used later to append
  };
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
    const cached = insightCache.get(key);
    return res.status(200).json({ insight: cached, cached: true });
  }

  const { systemPrompt, userPrompt, tarotCard, tarotLine } = buildPrompt(
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
    let insight = data.choices?.[0]?.message?.content?.trim();
    if (!insight) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    // Strip any remaining markdown symbols defensively
    const clean = insight
      .replace(/^###?\s*/gm, '')   // remove ### headers
      .replace(/\*\*(.*?)\*\*/g, '$1')  // remove **bold**
      .replace(/\*(.*?)\*/g, '$1')       // remove *italic*
      .replace(/^---\s*$/gm, '')         // remove --- dividers
      .replace(/[\u2640-\u26FF]/g, '')   // misc symbols
      .replace(/[\u2700-\u27BF]/g, '');  // dingbats

    // Append tarot line (guaranteed to appear)
    const finalInsight = clean + tarotLine;

    if (insightCache.size >= MAX_CACHE) {
      const firstKey = insightCache.keys().next().value;
      insightCache.delete(firstKey);
    }
    insightCache.set(key, finalInsight);

    return res.status(200).json({ insight: finalInsight, cached: false, tarot: tarotCard });
  } catch (err) {
    console.error('ai-insight handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
