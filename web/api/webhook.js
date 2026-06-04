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
    // ✅ 抓 Stripe 的 email（checkout 时用户填的）
    const email = session.customer_details?.email || null;

    console.log('[webhook] payment success for user:', userId, 'email:', email);

    if (userId) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;

        const updatePayload = {
          id: userId,
          paid: true,
          subscription_id: session.subscription || session.id,
          updated_at: new Date().toISOString(),
        };
        
        // ✅ 写入 email（如果 email 列存在则写入，不存在则静默忽略）
        if (email) {
          updatePayload.email = email;
        }

        const res2 = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(updatePayload),
        });

        if (!res2.ok) {
          const err = await res2.json();
          // 如果报错是关于 email 列不存在，忽略（列可能还没加）
          const isEmailColError = err?.details?.includes('email') || err?.message?.includes('email');
          if (!isEmailColError) {
            console.error('[webhook] failed to update profile:', err);
          } else {
            console.warn('[webhook] email column missing in user_profiles, skipping email write');
          }
        } else {
          console.log('[webhook] user profile updated with paid=true and email:', email);
        }
      } catch (err) {
        console.error('[webhook] error updating user:', err);
      }
    }
  }

  return res.status(200).json({ received: true });
}
