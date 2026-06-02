// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// Price points (AUD cents)
const PRICES = {
  insight_once: 499,    // $4.99 one-time AI insight
  monthly: 499,         // $4.99/month unlimited
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify JWT from Supabase
  const authHeader = req.headers.authorization;
  console.log('[create-checkout] auth header:', authHeader ? 'present (' + authHeader.substring(0, 20) + '...)' : 'MISSING');
  console.log('[create-checkout] supabase client:', supabase ? 'initialized' : 'NULL!');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = authHeader.slice(7);
  console.log('[create-checkout] token length:', token.length, 'prefix:', token.substring(0, 15));

  let user;
  try {
    const { data: { user: u }, error } = await supabase.auth.getUser(token);
    console.log('[create-checkout] getUser error:', error?.message || 'null', 'user:', !!u);
    if (error || !u) return res.status(401).json({ error: 'Invalid token', detail: error?.message });
    user = u;
  } catch (e) {
    console.error('[create-checkout] getUser exception:', e.message);
    return res.status(401).json({ error: 'Token verification failed', detail: e.message });
  }

  // 2. Check if user already has active subscription
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('paid, stripe_customer_id, subscription_id')
    .eq('id', user.id)
    .single();

  const isPaid = profile?.paid === true && profile?.subscription_id;

  // 3. Determine what to sell
  const { plan = 'insight_once' } = req.body; // 'insight_once' | 'monthly'

  // If already subscribed, just grant access (no charge)
  if (isPaid) {
    return res.status(200).json({
      already_paid: true,
      message: 'Already subscribed',
    });
  }

  try {
    // Create or retrieve Stripe customer
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID to Supabase
      if (supabase) {
        await supabase.from('user_profiles').upsert({
          id: user.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
    }

    // Create Checkout Session
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
