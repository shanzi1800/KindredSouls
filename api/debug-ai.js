// Cloudflare Worker: AI API 代理
// 部署: wrangler deploy
// 用法: POST https://ai.kindredsouls.com.au/chat
// Body: { "messages": [...], "model": "deepseek-chat" }
const DEEPSEEK_KEY = 'sk-9307f02599b44612b6767996a7839ab5';
const MODEL = 'deepseek-chat';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const body = await request.json();
    const messages = body.messages || [];
    const model = body.model || MODEL;

    const start = Date.now();
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + DEEPSEEK_KEY,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: body.temperature ?? 0.3,
        max_tokens: body.max_tokens ?? 1200,
      })
    });

    const ms = Date.now() - start;
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': String(ms),
        ...corsHeaders,
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
