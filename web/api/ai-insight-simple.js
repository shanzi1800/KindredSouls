export const runtime = 'nodejs';

export default async function handler(req, res) {
  console.log('[ai-insight-simple] Called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const body = await req.json();
    console.log('[ai-insight-simple] Body received:', JSON.stringify(body));
    
    // Test DeepSeek API call
    const apiKey = process.env.DEEPSEEK_API_KEY;
    console.log('[ai-insight-simple] API key present:', !!apiKey);
    
    if (!apiKey) {
      return res.status(500).json({ error: 'DeepSeek API key not configured' });
    }
    
    // Try calling DeepSeek
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      }),
    });
    
    console.log('[ai-insight-simple] DeepSeek response status:', response.status);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('[ai-insight-simple] DeepSeek error:', errText);
      return res.status(502).json({ error: 'DeepSeek API error', details: errText });
    }
    
    const data = await response.json();
    console.log('[ai-insight-simple] DeepSeek success');
    
    return res.status(200).json({
      status: 'ok',
      message: 'Simple endpoint works',
      deepseekResponse: !!data.choices,
    });
    
  } catch (error) {
    console.error('[ai-insight-simple] Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
