// Vercel test: ai-insight without body parsing
export const runtime = 'nodejs';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

export default async function handler(req, res) {
  try {
    // Read raw body
    const rawBody = req.body;
    console.log('[ai-insight] req.body type:', typeof rawBody, 'value:', rawBody);

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ error: 'API key not configured', debug: { bodyType: typeof rawBody, hasJsonMethod: typeof req.json } });
    }

    const response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a relationship advisor. Give warm, positive advice in 2-3 sentences.' },
          { role: 'user', content: 'Two people born on 1990-01-01 and 1990-01-01 have compatibility score 80/100. Give brief relationship advice.' },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(200).json({ error: 'DeepSeek error', details: errText });
    }

    const data = await response.json();
    return res.status(200).json({
      insight: data.choices?.[0]?.message?.content?.trim(),
      cached: false,
    });
  } catch (error) {
    return res.status(200).json({ error: error.message, stack: error.stack });
  }
}
