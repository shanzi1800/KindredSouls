// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  insight_once: 499,    // $4.99 one-time AI insight
  monthly: 499,         // $4.99/month unlimited
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Extract Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.slice(7);
  console.log('[create-checkout] token prefix:', token.substring(0, 20));

  // 2. Verify token using service_role key + getUser(token)
  //    Disable realtime entirely to avoid WebSocket issues in Node.js 20
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { realtime: { enabled: false } }
    );

    // supabase-js v2: getUser(jwt) works with service_role key
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      console.error('[create-checkout] getUser error:', userError?.message);
      return res.status(401).json({ error: 'Invalid token: ' + (userError?.message || 'unknown') });
    }

    console.log('[create-checkout] user verified:', user.id);

    // 3. Check if user already has active subscription
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('paid, stripe_customer_id, subscription_id')
      .eq('id', user.id)
      .single();

    const isPaid = profile?.paid === true && profile?.subscription_id;

    const { plan = 'insight_once' } = req.body;

    // If already subscribed, just grant access
    if (isPaid) {
      return res.status(200).json({
        already_paid: true,
        message: 'Already subscribed',
      });
    }

    // 4. Create or retrieve Stripe customer
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabaseAdmin.from('user_profiles').upsert({
        id: user.id,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    // 5. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: plan === 'monthly' ? 'subscription' : 'payment',
      line_items: [{
        price_data: {
          currency: 'aud',
          product_data: {
            name: plan === 'monthly'
              ? 'Kindred Souls — Unlimited AI Insights (Monthly)'
              : 'Kindred Souls — AI Insight Unlock',
            description: plan === 'monthly'
              ? 'Unlimited AI-powered relationship insights'
              : 'One-time AI deep insight for your compatibility reading',
          },
          unit_amount: PRICES[plan],
          recurring: plan === 'monthly' ? { interval: 'month' } : undefined,
        },
        quantity: 1,
      }],
      success_url: `${req.headers.origin || 'https://www.kindredsouls.com.au'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://www.kindredsouls.com.au'}?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('[create-checkout] error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session', detail: err.message });
  }
}
