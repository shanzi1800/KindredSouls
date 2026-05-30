export default async function handler(req: { method?: string; body?: unknown }, res: { status(code: number): { json(data: unknown): void } }) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { overall, dims, lang } = req.body as {
      overall: number;
      dims: Record<string, number>;
      lang: string;
    };

    // Rule-based insight (replace with real LLM call when API key is available)
    const score = overall ?? 70;
    const topDim = Object.entries(dims ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'chemistry';

    const insights: Record<string, Record<string, string>> = {
      zh: {
        high: `你们的匹配度高达 ${score} 分，尤其在${topDim === 'chemistry' ? '化学反应' : topDim === 'values' ? '价值观' : topDim === 'communication' ? '沟通' : topDim === 'growth' ? '成长' : '亲密'}方面默契十足。建议珍惜当下，保持开放沟通，关系会持续升温。`,
        mid: `匹配度 ${score} 分，有不错的潜力。建议多关注彼此的情感需求，在${topDim === 'chemistry' ? '化学反应' : topDim === 'values' ? '价值观' : topDim === 'communication' ? '沟通' : topDim === 'growth' ? '成长' : '亲密'}方面可以尝试新的互动方式。`,
        low: `匹配度 ${score} 分，但数字不是全部。每段关系都有独特价值，关键是理解彼此的核心需求，找到适合你们的相处模式。`,
      },
      en: {
        high: `Your compatibility hits ${score}/100 — especially strong in ${topDim}. Cherish this connection and keep communication open; the bond will only deepen.`,
        mid: `At ${score}/100, there's solid potential. Focus on each other's emotional needs and explore new ways to connect in your ${topDim} dimension.`,
        low: `${score}/100 on paper, but numbers aren't everything. Every relationship has unique value — focus on understanding core needs and finding your rhythm together.`,
      },
      es: {
        high: `Su compatibilidad alcanza ${score}/100 — especialmente fuerte en ${topDim}. Aprecien esta conexión y mantengan la comunicación abierta.`,
        mid: `Con ${score}/100, hay potencial sólido. Enfóquense en las necesidades emocionales del otro y exploren nuevas formas de conectar.`,
        low: `${score}/100 en papel, pero los números no son todo. Cada relación tiene valor único — enfóquense en entender las necesidades básicas.`,
      },
      fr: {
        high: `Votre compatibilité atteint ${score}/100 — particulièrement forte en ${topDim}. Chérissez ce lien et gardez la communication ouverte.`,
        mid: `À ${score}/100, le potentiel est solide. Concentrez-vous sur les besoins émotionnels de l'autre et explorez de nouvelles façons de connecter.`,
        low: `${score}/100 sur papier, mais les chiffres ne sont pas tout. Chaque relation a une valeur unique — trouvez votre rythme ensemble.`,
      },
    };

    const bucket = score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
    const locale = insights[lang]?.[bucket] ?? insights['en'][bucket];

    return res.status(200).json({ insight: locale });
  } catch (err) {
    console.error('ai-insight error:', err);
    return res.status(500).json({ error: 'Failed to generate insight' });
  }
}
