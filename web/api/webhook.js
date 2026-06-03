// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Stripe webhook signature verification
  // For now, just process the event
  const event = req.body;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.supabase_user_id;

    if (userId) {
      try {
        const supabaseAdmin = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY,
          { realtime: { enabled: false } }
        );

        await supabaseAdmin.from('user_profiles').upsert({
          id: userId,
          paid: true,
          subscription_id: session.subscription || session.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

        console.log('[webhook] user marked as paid:', userId);
      } catch (err) {
        console.error('[webhook] error updating user:', err);
      }
    }
  }

  return res.status(200).json({ received: true });
}
