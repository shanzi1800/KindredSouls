// 临时调试端点：测试 DeepSeek 和 Gemini 是否可用
const runtime = 'nodejs';

async function testDeepSeek(key) {
  const start = Date.now();
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Say 'OK' in one word" }],
        max_tokens: 10
      })
    });
    const ms = Date.now() - start;
    if (res.ok) {
      const d = await res.json();
      return { ok: true, ms, text: d.choices?.[0]?.message?.content };
    }
    const err = await res.text();
    return { ok: false, ms, status: res.status, err: err.substring(0, 200) };
  } catch (e) {
    return { ok: false, ms, exception: e.message };
  }
}

async function testGemini(key) {
  const start = Date.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Say 'OK' in one word" }] }],
        generationConfig: { maxOutputTokens: 10 }
      })
    });
    const ms = Date.now() - start;
    if (res.ok) {
      const d = await res.json();
      return { ok: true, ms, text: d.candidates?.[0]?.content?.parts?.[0]?.text };
    }
    const err = await res.text();
    return { ok: false, ms, status: res.status, err: err.substring(0, 200) };
  } catch (e) {
    return { ok: false, ms, exception: e.message };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const dsKey = process.env.DEEPSEEK_API_KEY || '';
  const gmKey = process.env.GEMINI_API_KEY || '';
  const hardcodedDs = 'sk-9307f02599b44612b6767996a7839ab5';

  const [dsResult, gmResult, hardcodedResult] = await Promise.all([
    testDeepSeek(dsKey),
    testGemini(gmKey),
    testDeepSeek(hardcodedDs),
  ]);

  res.status(200).json({
    timestamp: new Date().toISOString(),
    runtime: runtime,
    deepseek_env: { keyExists: !!dsKey, keyLength: dsKey.length, prefix: dsKey.substring(0, 8) },
    gemini_env: { keyExists: !!gmKey, keyLength: gmKey.length, prefix: gmKey.substring(0, 8) },
    hardcoded_key: { keyLength: hardcodedDs.length, prefix: hardcodedDs.substring(0, 8) },
    results: {
      deepseek_env: dsResult,
      gemini_env: gmResult,
      hardcoded_key: hardcodedResult,
    }
  });
};
