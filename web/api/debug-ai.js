// 临时调试端点
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const dsEnv = process.env.DEEPSEEK_API_KEY || '';
  const gmEnv = process.env.GEMINI_API_KEY || '';
  const hardcodedDs = 'sk-9307f02599b44612b6767996a7839ab5';

  async function tryDeepSeek(key) {
    const start = Date.now();
    try {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 3 })
      });
      const ms = Date.now() - start;
      const text = await r.text();
      return { ok: r.ok, ms, status: r.status, bodyPrefix: text.substring(0, 100) };
    } catch (e) {
      return { ok: false, ms: Date.now() - start, error: e.message };
    }
  }

  async function tryGemini(key) {
    const start = Date.now();
    try {
      const r = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }) }
      );
      const ms = Date.now() - start;
      const text = await r.text();
      return { ok: r.ok, ms, status: r.status, bodyPrefix: text.substring(0, 100) };
    } catch (e) {
      return { ok: false, ms: Date.now() - start, error: e.message };
    }
  }

  const [dsResult, gmResult, hardResult] = await Promise.all([
    tryDeepSeek(dsEnv),
    tryGemini(gmEnv),
    tryDeepSeek(hardcodedDs)
  ]);

  res.status(200).json({
    t: new Date().toISOString(),
    dsEnv: { exists: !!dsEnv, len: dsEnv.length },
    gmEnv: { exists: !!gmEnv, len: gmEnv.length },
    dsResult, gmResult, hardResult
  });
};
