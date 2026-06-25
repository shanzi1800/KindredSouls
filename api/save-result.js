// Force Node.js 20 runtime (avoid Edge crypto issue)
export const runtime = 'nodejs20.x';

import { createClient } from '@supabase/supabase-js';

const PRICE = {
  insight_once: 499,
  monthly: 499,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Extract and verify JWT via Supabase Auth REST API
  const authHeader = req.headers.authorization || (req.headers.get && req.headers.get('Authorization'));
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.slice(7);

  let user;
  try {
    // ✅ 正确方法：直接调 Supabase Auth REST API 验证 token
    const supabaseUrl = process.env.SUPABASE_URL;
    const verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.error('[save-result] Token verify HTTP error:', verifyRes.status, errText);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userData = await verifyRes.json();
    if (!userData?.id) {
      console.error('[save-result] No user ID in verify response');
      return res.status(401).json({ error: 'Invalid token - no user ID' });
    }

    user = { id: userData.id };
    console.log('[save-result] user verified via REST:', user.id);
  } catch (e) {
    console.error('[save-result] auth exception:', e.message, e.stack);
    return res.status(401).json({ error: 'Token verification failed' });
  }

  // 2. Extract fields from body (user_id comes from JWT, NOT from body)
  const {
    dob1,
    dob2,
    overall_score,
    dimensions,
    engines,
    ai_insight,
    language,
  } = req.body;

  if (!dob1 || !dob2 || overall_score === undefined) {
    return res.status(400).json({ error: 'Missing required fields: dob1, dob2, overall_score' });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabaseAdmin
      .from('compatibility_results')
      .insert({
        user_id: user.id,  // ✅ use JWT-verified user ID
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
      })
      .select()
      .single();

    if (error) {
      console.error('[save-result] Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save result', detail: error.message });
    }

    return res.status(200).json({ success: true, id: data?.id, user_id: user.id });
  } catch (err) {
    console.error('[save-result] handler error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
