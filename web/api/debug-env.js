export const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const envStatus = {
    DEEPSSEEK_API_KEY: {
      exists: !!process.env.DEEPSEEK_API_KEY,
      length: process.env.DEEPSEEK_API_KEY?.length || 0,
      prefix: process.env.DEEPSEEK_API_KEY?.substring(0, 5) || '',
    },
    GEMINI_API_KEY: {
      exists: !!process.env.GEMINI_API_KEY,
      length: process.env.GEMINI_API_KEY?.length || 0,
      prefix: process.env.GEMINI_API_KEY?.substring(0, 5) || '',
    },
    SUPABASE_URL: {
      exists: !!process.env.SUPABASE_URL,
      value: process.env.SUPABASE_URL?.substring(0, 30) || '',
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    },
    STRIPE_SECRET_KEY: {
      exists: !!process.env.STRIPE_SECRET_KEY,
      length: process.env.STRIPE_SECRET_KEY?.length || 0,
    },
  };

  console.log('[debug-env] Environment status:', envStatus);

  return res.status(200).json({
    message: 'Debug: Environment Variables Status',
    timestamp: new Date().toISOString(),
    env: envStatus,
  });
}
