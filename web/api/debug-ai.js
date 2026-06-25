// 极简调试端点 - 纯 CommonJS，无 import
async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const dsEnv = (typeof process !== 'undefined' && process.env && process.env.DEEPSEEK_API_KEY) || '';
  const gmEnv = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) || '';
  const hardcodedDs = 'sk-9307f02599b44612b6767996a7839ab5';

  const results = {};
  const errors = {};

  // Test DeepSeek env
  try {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + dsEnv },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 3 })
    });
    const text = await r.text();
    results.deepseekEnv = { ok: r.ok, status: r.status, body: text.substring(0, 150) };
  } catch (e) {
    errors.deepseekEnv = e.message;
    results.deepseekEnv = { error: e.message };
  }

  // Test DeepSeek hardcoded
  try {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + hardcodedDs },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 3 })
    });
    const text = await r.text();
    results.deepseekHard = { ok: r.ok, status: r.status, body: text.substring(0, 150) };
  } catch (e) {
    errors.deepseekHard = e.message;
    results.deepseekHard = { error: e.message };
  }

  // Test Gemini
  try {
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + gmEnv,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }) }
    );
    const text = await r.text();
    results.geminiEnv = { ok: r.ok, status: r.status, body: text.substring(0, 150) };
  } catch (e) {
    errors.geminiEnv = e.message;
    results.geminiEnv = { error: e.message };
  }

  res.status(200).json({
    ts: new Date().toISOString(),
    dsEnvKey: dsEnv ? 'present(len=' + dsEnv.length + ')' : 'MISSING',
    gmEnvKey: gmEnv ? 'present(len=' + gmEnv.length + ')' : 'MISSING',
    hardcodedKey: 'present(len=' + hardcodedDs.length + ')',
    results,
    errors
  });
}

module.exports = handler;
