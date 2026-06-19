// save-result.ts - Save compatibility result to Supabase via REST API
// No TypeScript type annotations to avoid Vercel build errors

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_SERVICE_KEY,
      },
    });

    if (!userRes.ok) {
      const errorData: any = await userRes.json();
      return res.status(401).json({ error: errorData.error_description || 'Invalid token' });
    }

    const userData: any = await userRes.json();
    const userId = userData.id;

    // 2. Save result to Supabase via REST API
    const resultData = req.body;
    const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/compatibility_results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: userId,
        ...resultData,
      }),
    });

    if (!saveRes.ok) {
      const errorData: any = await saveRes.json();
      console.error('Supabase save error:', errorData);
      return res.status(500).json({ error: errorData.message || 'Failed to save result' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in save-result:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
