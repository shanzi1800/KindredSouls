// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

const PRICES = {
  insight_once: 499,    // $4.99 one-time AI insight
  monthly: 499,         // $4.99/month unlimited
  // 财富模块价格
  wealth_monthly: 799,  // $7.99/month 财富解码月卡
  wealth_yearly: 7999,  // $79.99/年 财富解码年卡
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const token = authHeader.slice(7);

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    // Verify JWT via Supabase Auth REST API (no supabase-js needed)
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': anonKey || serviceKey,
      },
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { id: userId, email } = await userRes.json();
    if (!userId) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.log('[create-checkout] user verified:', userId);

    // Check existing profile via REST API
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=paid,stripe_customer_id,subscription_id`,
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
      // Upsert to ensure row exists
      await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          email: email,
          paid: true,
          updated_at: new Date().toISOString(),
        }),
      }).catch(err => console.error('[create-checkout] Upsert error (non-fatal):', err));

      return res.status(200).json({ already_paid: true, message: 'Already subscribed' });
    }

    // Dynamic import Stripe (avoid ESM init crash)
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: userId,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        }),
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSubscription ? 'subscription' : 'payment',
      // 产品名称映射
      const PRODUCT_NAMES = {
        insight_once:   'Kindred Souls — AI Insight Unlock',
        monthly:        'Kindred Souls — Unlimited AI Insights (Monthly)',
        wealth_monthly: 'Kindred Souls — Wealth Oracle (Monthly)',
        wealth_yearly:  'Kindred Souls — Wealth Oracle (Yearly)',
      };
      const PRODUCT_DESCS = {
        insight_once:   'One-time AI deep insight for your compatibility reading',
        monthly:       'Unlimited AI-powered relationship insights',
        wealth_monthly:'Unlock your 180-day wealth & career blueprint — monthly access',
        wealth_yearly: 'Full-year access to wealth oracle + all future features',
      };
      const isSubscription = plan === 'monthly' || plan === 'wealth_monthly';

      line_items: [{
        price_data: {
          currency: 'aud',
          product_data: {
            name: PRODUCT_NAMES[plan] || PRODUCT_NAMES.insight_once,
            description: PRODUCT_DESCS[plan] || PRODUCT_DESCS.insight_once,
          },
          unit_amount: PRICES[plan] || PRICES.insight_once,
          recurring: isSubscription ? { interval: plan === 'wealth_monthly' ? 'month' : 'month' } : undefined,
        },
        quantity: 1,
      }],
      success_url: `${req.headers.origin || 'https://www.kindredsouls.com.au'}/?payment=success&plan=${plan}`,
      cancel_url: `${req.headers.origin || 'https://www.kindredsouls.com.au'}/#/result?payment=cancelled`,
      metadata: { supabase_user_id: userId, plan },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('[create-checkout] error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session', detail: err.message });
  }
}
