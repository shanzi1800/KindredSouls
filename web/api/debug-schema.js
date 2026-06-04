export const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!serviceKey) {
    return res.status(500).json({ error: 'No service key configured' });
  }
  
  // 尝试查一条记录看有哪些列
  const r = await fetch(`${supabaseUrl}/rest/v1/user_profiles?limit=1&select=*`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    }
  });
  
  // 如果列不存在，PostgREST会返回400
  if (r.status === 400) {
    const err = await r.json();
    return res.json({ 
      status: '400_bad_request',
      error: err,
      hint: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;' 
    });
  }
  
  const data = await r.json();
  return res.json({ 
    ok: true, 
    firstRow: data?.[0] || null,
    columns: data?.[0] ? Object.keys(data[0]) : 'empty'
  });
}
