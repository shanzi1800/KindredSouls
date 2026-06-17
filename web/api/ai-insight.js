export const runtime = 'nodejs';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

export default async function handler(req, res) {
  console.log('[ai-insight] Handler started');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('[ai-insight] Parsing body...');
    const body = req.body;
    console.log('[ai-insight] Body:', JSON.stringify(body));
    
    const { d1, d2, overall, dims, lang = 'en' } = body;
    
    if (!d1 || !d2) {
      return res.status(400).json({ error: 'Missing d1 or d2' });
    }
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('[ai-insight] DEEPSEEK_API_KEY not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    console.log('[ai-insight] Calling DeepSeek API...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
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
          { role: 'user', content: `Two people born on ${d1} and ${d2} have compatibility score ${overall}/100. Give brief relationship advice.` }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('[ai-insight] DeepSeek response status:', response.status);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('[ai-insight] DeepSeek error:', errText);
      return res.status(502).json({ error: 'AI service error', details: errText });
    }
    
    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim();
    
    console.log('[ai-insight] Success, insight length:', insight?.length);
    
    return res.status(200).json({
      insight: insight || 'Unable to generate insight at this time.',
      cached: false,
    });
    
  } catch (error) {
    console.error('[ai-insight] Error:', error);
    console.error('[ai-insight] Stack:', error.stack);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'AI service timeout' });
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
