export const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  // 用 service role key 直接 ALTER TABLE 添加 email 列
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!serviceKey) {
    return res.status(500).json({ error: 'No service key' });
  }
  
  try {
    // 用 Supabase PostgREST 的 rpc 功能来执行 SQL
    // 实际上直接用 REST API 的方式：POST 到 pg_catalog 表
    // 最简单：用 Supabase SQL Editor API (需要 management token)
    
    // 换个思路：直接在 webhook 里做 upsert 时带上 email
    // 如果 email 列不存在，webhook 会报错，这时候我们就知道需要加列
    // 或者：先尝试插入带 email 的记录，看看是否成功
    
    const testRes = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.'test'&select=email`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    });
    
    // 如果返回400说email列不存在，需要加列
    if (testRes.status === 400) {
      const err = await testRes.json();
      if (err.message?.includes('email') || err.details?.includes('email')) {
        // 需要加列，用 Supabase Management API
        // 这里我们直接告诉前端需要做什么
        return res.status(400).json({ 
          error: 'email column missing', 
          needMigration: true,
          sql: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;'
        });
      }
    }
    
    return res.status(200).json({ 
      ok: true, 
      columns: Object.keys((await testRes.json())[0] || {}) 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
