import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const {
    user_id,
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
    const uid = user_id || crypto.randomUUID();

    const { data, error } = await supabase
      .from('compatibility_results')
      .insert({
        user_id: uid,
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
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save result', detail: error.message });
    }

    return res.status(200).json({ success: true, id: (data as Record<string,unknown>)?.id, user_id: uid });
  } catch (err) {
    console.error('save-result handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
