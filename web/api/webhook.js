// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const event = req.body;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.supabase_user_id;

    if (userId) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;

        await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            id: userId,
            paid: true,
            subscription_id: session.subscription || session.id,
            updated_at: new Date().toISOString(),
          }),
        });

        console.log('[webhook] user marked as paid:', userId);
      } catch (err) {
        console.error('[webhook] error updating user:', err);
      }
    }
  }

  return res.status(200).json({ received: true });
}
