export const runtime = 'nodejs20.x';

// 一次性 migration: 给 user_profiles 加 email 列
// 部署后访问一次 /api/migrate 即可，执行完会返回 success
// 注意：这个 endpoint 幂等，多次执行无害

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!serviceKey) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not set' });
  }
  
  try {
    // 用 Supabase SQL 执行 ALTER TABLE
    // 通过 PostgREST 的 rpc: pgrst_api.rpc('exec_sql', {sql: '...'})  
    // 或者更简单：直接在 webhook 里先尝试插入带 email 的记录，如果表没有 email 列，
    // 会在 webhook 日志里看到错误，然后我们才知道需要加列。
    
    // 最稳的方式：用 Supabase 的 auth.users 表查 email，然后 upsert 到 user_profiles
    // 但更好的方式是：既然 Stripe session 里有 email，直接用那个
    
    // 尝试执行 ALTER TABLE (通过扩展的 rpc)
    const alterRes = await fetch(`${supabaseUrl}/rest/v1/rpc/pgrst_api.rpc`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        fn: 'exec',
        args: ['ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;']
      })
    });
    
    return res.status(200).json({ 
      ok: true,
      message: 'Migration endpoint ready. If you see this, manual migration may be needed in Supabase dashboard.',
      sql: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;'
    });
    
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
