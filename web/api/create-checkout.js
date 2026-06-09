// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  insight_once: 499,    // $4.99 one-time AI insight
  monthly: 499,         // $4.99/month unlimited
};

// Verify Supabase JWT via official SDK (handles revocation/disabled users/etc)
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function verifySupabaseJWT(token) {
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.slice(7);
  
  const user = await verifySupabaseJWT(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  console.log('[create-checkout] user verified:', user.id);

  try {
    // Use raw fetch for Supabase REST API (no WebSocket needed)
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    // Check existing profile
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user.id}&select=paid,stripe_customer_id,subscription_id`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const profiles = await profileRes.json();
    const profile = profiles?.[0];

    const isPaid = profile?.paid === true && profile?.subscription_id;
    const { plan = 'insight_once' } = req.body;

    if (isPaid) {
      return res.status(200).json({ already_paid: true, message: 'Already subscribed' });
    }

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Upsert profile with stripe_customer_id
      await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: user.id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }),
      });
    }

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
      success_url: `${req.headers.origin || 'https://www.kindredsouls.com.au'}/#/result?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://www.kindredsouls.com.au'}/#/result?payment=cancelled`,
      metadata: { supabase_user_id: user.id, plan },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('[create-checkout] error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session', detail: err.message });
  }
}
