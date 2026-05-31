import fetch from 'node-fetch';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

// ── In-memory cache ──
const insightCache = new Map<string, string>();
const MAX_CACHE = 200;

function cacheKey(
  d1: string, d2: string, overall: number,
  dims: Record<string, number>, lang: string
): string {
  return `${d1}|${d2}|${overall}|${JSON.stringify(dims)}|${lang}`;
}

// ── Build prompt ──
function buildPrompt(
  { d1, d2, overall, dims, bazi, zodiac, iching }: Record<string, unknown>,
  lang = 'en'
) {
  const isZh = lang === 'zh';
  const isFr = lang === 'fr';
  const isEs = lang === 'es';

  const systemPrompt = isZh
    ? '你是 KindredSouls 的 AI 情感顾问。用户输入了一对情侣的命理数据，请用温暖、专业、积极的语气，给出 3–5 句话的关系洞察。只用中文输出。不要预测分手或负面结局，始终给予希望和具体行动建议。'
    : isFr
    ? "Tu es le conseiller sentimental IA de KindredSouls. Basé sur les données de compatibilité d'un couple, donne 3–5 phrases d'insight chaleureuses, professionnelles et positives. Réponds uniquement en français. Ne prédis jamais de rupture. Donne toujours de l'espoir et des conseils pratiques."
    : isEs
    ? 'Eres el consejero sentimental IA de KindredSouls. Basado en los datos de compatibilidad de una pareja, da 3–5 frases de insight cálido, profesional y positivo. Responde solo en español. Nunca predigas ruptura. Siempre da esperanza y consejos prácticos.'
    : 'You are the AI relationship advisor for KindredSouls. Based on the user input (a couple compatibility data), give 3–5 sentences of warm, professional, and positive relationship insight. Only respond in English. Never predict breakups or negative outcomes. Always give hope and specific actionable advice.';

  const userPrompt = isZh
    ? `用户生日: ${d1}，TA生日: ${d2}\n综合分: ${overall}/100\n四维度: 爱情 ${dims.love} | 沟通 ${dims.communication} | 默契 ${dims.chemistry} | 稳定 ${dims.stability}\n八字: ${bazi}\n星座: ${zodiac}\n易经: ${iching}`
    : isFr
    ? `Anniversaire: ${d1}, Partenaire: ${d2}\nScore global: ${overall}/100\nDimensions: Amour ${dims.love} | Communication ${dims.communication} | Chimie ${dims.chemistry} | Stabilité ${dims.stability}\nAstrologie chinoise: ${bazi}\nZodiaque occidental: ${zodiac}\nI Ching: ${iching}`
    : isEs
    ? `Cumpleaños: ${d1}, Pareja: ${d2}\nPuntuación global: ${overall}/100\nDimensiones: Amor ${dims.love} | Comunicación ${dims.communication} | Química ${dims.chemistry} | Estabilidad ${dims.stability}\nAstrología china: ${bazi}\nZodíaco occidental: ${zodiac}\nI Ching: ${iching}`
    : `Your birthday: ${d1}, Their birthday: ${d2}\nOverall score: ${overall}/100\nFour dimensions: Love ${dims.love} | Communication ${dims.communication} | Chemistry ${dims.chemistry} | Stability ${dims.stability}\nChinese Astrology: ${bazi}\nWestern Zodiac: ${zodiac}\nI Ching: ${iching}`;

  return { systemPrompt, userPrompt };
}

// Vercel Serverless Function entry point
export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = await req.json() as Record<string, unknown>;
  const { d1, d2, overall, dims, bazi, zodiac, iching, lang = 'en' } = body;
  if (!d1 || !d2 || !dims) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'DeepSeek API key not configured' }), { status: 500 });
  }

  const key = cacheKey(d1 as string, d2 as string, overall as number, dims as Record<string, number>, lang as string);
  if (insightCache.has(key)) {
    return new Response(JSON.stringify({ insight: insightCache.get(key), cached: true }), { status: 200 });
  }

  const { systemPrompt, userPrompt } = buildPrompt({ d1, d2, overall, dims, bazi, zodiac, iching }, lang as string);

  try {
    const response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), { status: 502 });
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const insight = data.choices?.[0]?.message?.content?.trim();
    if (!insight) {
      return new Response(JSON.stringify({ error: 'Empty response from AI' }), { status: 502 });
    }

    const clean = insight
      .replace(/[\u2640-\u26FF]/g, '')
      .replace(/[\u2700-\u27BF]/g, '');

    if (insightCache.size >= MAX_CACHE) {
      const firstKey = insightCache.keys().next().value;
      insightCache.delete(firstKey);
    }
    insightCache.set(key, clean);

    return new Response(JSON.stringify({ insight: clean, cached: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-insight handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
