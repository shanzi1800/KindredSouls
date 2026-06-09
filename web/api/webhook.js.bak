// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';
// Disable body parsing so we can verify Stripe signature with raw body
export const config = { api: { bodyParser: false } };

import crypto from 'crypto';

function verifyStripeSignature(rawBody, signature, secret) {
  try {
    const elements = Object.fromEntries(
      signature.split(',').map(part => {
        const [k, v] = part.split('=');
        return [k, v];
      })
    );
    const timestamp = elements['t'];
    const expectedSig = elements['v1'];
    
    const payload = `${timestamp}.${rawBody}`;
    const computed = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    return computed === expectedSig;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read raw body for Stripe signature verification
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks).toString();
  
  // Verify Stripe signature
  const signature = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (webhookSecret && signature) {
    if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
      console.error('[webhook] Invalid Stripe signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    console.log('[webhook] Signature verified ✅');
  } else if (!webhookSecret) {
    console.warn('[webhook] STRIPE_WEBHOOK_SECRET not set, skipping signature verification');
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.supabase_user_id;
    const email = session.customer_details?.email || null;

    console.log('[webhook] payment success for user:', userId, 'email:', email);

    if (userId) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;

        const updatePayload = {
          user_id: userId,
          paid: true,
          subscription_id: session.subscription || session.id,
          updated_at: new Date().toISOString(),
        };
        
        if (email) {
          updatePayload.email = email;
        }

        // First try to update existing record, then insert if not found
        const patchRes = await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
          method: 'PATCH',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paid: true, subscription_id: session.subscription || session.id, updated_at: new Date().toISOString(), ...(email ? { email } : {}) }),
        });

        const patchData = await patchRes.json();
        if (!Array.isArray(patchData) || patchData.length === 0) {
          // No existing record, insert new one
          const res2 = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
            method: 'POST',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
          });
          if (!res2.ok) {
            const err = await res2.json();
            console.error('[webhook] failed to insert profile:', err);
          } else {
            console.log('[webhook] inserted new profile with paid=true');
          }
        } else {
          console.log('[webhook] updated existing profile to paid=true, count:', patchData.length);
        }

        if (!res2.ok) {
          const err = await res2.json();
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
