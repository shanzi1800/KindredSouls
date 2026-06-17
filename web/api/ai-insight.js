export const runtime = 'nodejs';

export default async function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    env: {
      hasDeepSeekKey: !!process.env.DEEPSEEK_API_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeVersion: process.version,
    },
    timestamp: new Date().toISOString(),
  });
}
