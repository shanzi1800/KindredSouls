import { createClient } from '@supabase/supabase-js';

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  if (!supabase) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: 'Database not configured' }));
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
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Missing required fields: dob1, dob2, overall_score' }));
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
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: 'Failed to save result', detail: error.message }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, id: (data as Record<string, unknown>)?.id, user_id: uid }));
  } catch (err) {
    console.error('save-result handler error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
