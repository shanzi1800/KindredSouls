export const runtime = 'nodejs';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body', detail: e.message });
    }

    const { d1, d2, overall, dims, lang = 'en' } = body;
    if (!d1 || !d2) {
      return res.status(400).json({ error: 'Missing d1 or d2' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
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
          { role: 'user', content: `Two people born on ${d1} and ${d2} have compatibility score ${overall}/100. Give brief relationship advice.` },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'AI service error', details: errText });
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      insight: insight || 'Unable to generate insight at this time.',
      cached: false,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
