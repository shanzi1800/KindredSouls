// 极简 debug 端点 - 测试函数是否能正常运行
export default async function handler(req, res) {
  try {
    const env = {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET (' + process.env.SUPABASE_ANON_KEY.length + ' chars)' : 'MISSING',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET (' + process.env.SUPABASE_SERVICE_KEY.length + ' chars)' : 'MISSING',
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? 'SET (' + process.env.DEEPSEEK_API_KEY.length + ' chars)' : 'MISSING',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET (' + process.env.GEMINI_API_KEY.length + ' chars)' : 'MISSING',
    };
    return res.status(200).json({ ok: true, env });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message, stack: err.stack });
  }
}
