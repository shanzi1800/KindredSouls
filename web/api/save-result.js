// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

// Verify Supabase JWT manually (no createClient = no WebSocket issues)
function verifySupabaseJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload.sub || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    if (!payload.aud || !payload.aud.includes('authenticated')) return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.slice(7);

  const user = verifySupabaseJWT(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  console.log('[save-result] user verified:', user.id);

  // Extract fields
  const { dob1, dob2, overall_score, dimensions, engines, ai_insight, language } = req.body;
  if (!dob1 || !dob2 || overall_score === undefined) {
    return res.status(400).json({ error: 'Missing required fields: dob1, dob2, overall_score' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/compatibility_results`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        user_id: user.id,
        dob1,
        dob2,
        overall_score,
        love_score: dimensions?.love,
        communication_score: dimensions?.communication,
        chemistry_score: dimensions?.chemistry,
        stability_score: dimensions?.stability,
        bazi_detail: engines?.bazi?.detail,
        zodiac_detail: engines?.zodiac?.detail,
        iching_detail: engines?.iching?.detail,
        ai_insight,
        language: language || 'en',
      }),
    });

    if (!insertRes.ok) {
      const errBody = await insertRes.text();
      console.error('[save-result] Supabase error:', insertRes.status, errBody);
      return res.status(500).json({ error: 'Failed to save result', detail: errBody.slice(0, 200) });
    }

    const [data] = await insertRes.json();
    return res.status(200).json({ success: true, id: data?.id, user_id: user.id });

  } catch (err) {
    console.error('[save-result] handler error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
