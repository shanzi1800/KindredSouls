// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { realtime: { transport: ws } })
  : null;

// Stripe webhook handler — verifies signature and updates user status
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    // In sandbox, use the test webhook secret; in production use the real one
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      // Fallback for testing without configured secret (dev only)
      event = req.body;
      console.warn('[webhook] No STRIPE_WEBHOOK_SECRET configured, skipping signature verification');
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan;

      console.log(`[webhook] Payment complete: user=${userId}, plan=${plan}`);

      if (userId && supabase) {
        await supabase.from('user_profiles').upsert({
          id: userId,
          paid: true,
          stripe_customer_id: session.customer,
          subscription_id: plan === 'monthly' ? session.subscription : null,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customer = subscription.customer;

      // Find user by stripe_customer_id and mark as unpaid
      if (supabase && customer) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customer)
          .single();

        if (profile?.id) {
          await supabase.from('user_profiles').update({
            paid: false,
            subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq('id', profile.id);
        }
      }
      break;
    }

    default:
      console.log(`[webhook] Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
