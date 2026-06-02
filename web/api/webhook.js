// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.slice(7);

  let user;
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: { user: u }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !u) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    user = u;
  } catch (e) {
    return res.status(401).json({ error: 'Token verification failed' });
  }

  const { type = 'iching' } = req.body;

  // Simple placeholder for webhook verification
  const { data: profile } = await createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
    .from('user_profiles')
    .select('paid')
    .eq('id', user.id)
    .single();

  return res.status(200).json({ received: true });
}
