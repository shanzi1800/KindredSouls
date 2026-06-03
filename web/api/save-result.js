// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Extract and verify JWT using service_role key
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.slice(7);

  let user;
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { realtime: { enabled: false } }
    );

    const { data: { user: u }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !u) {
      console.error('[save-result] getUser error:', userError?.message);
      return res.status(401).json({ error: 'Invalid token: ' + (userError?.message || 'unknown') });
    }
    user = u;
    console.log('[save-result] user verified:', user.id);
  } catch (e) {
    console.error('[save-result] auth exception:', e.message);
    return res.status(401).json({ error: 'Token verification failed: ' + e.message });
  }

  // 2. Extract fields from body
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
      process.env.SUPABASE_SERVICE_KEY,
      { realtime: { enabled: false } }
    );

    const { data, error } = await supabaseAdmin
      .from('compatibility_results')
      .insert({
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
