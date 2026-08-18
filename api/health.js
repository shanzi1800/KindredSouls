// Force Node.js 20 runtime (avoid Edge crypto issue)
export const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  return res.status(200).json({
    status: 'ok',
    supabase: hasSupabase,
    deepseek: hasDeepSeek,
    timestamp: new Date().toISOString(),
  });
}
