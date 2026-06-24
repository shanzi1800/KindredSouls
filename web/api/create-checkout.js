// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';

const PRICES = {
  compatibility_once:           499,  // $4.99  one-time compatibility reading
  wealth_once:                  499,  // $4.99  one-time wealth reading
  compatibility_monthly_report:  299, // $2.99  relationship monthly report
  wealth_monthly_report:        299,  // $2.99  wealth monthly report
  compatibility_yearly_report:  1499, // $14.99 yearly relationship forecast
  wealth_yearly_report:        1499,  // $14.99 yearly wealth forecast
  star_monthly_vip:             999,  // $9.99/month  star monthly vip (5x wealth + 1x compatibility)
  all_pass_yearly:            9999,   // $99.99/year  all-pass yearly
};

// Static Price IDs from Stripe Dashboard (products created 2026-06-22)
const PRICE_IDS = {
  compatibility_once:           'price_1Tl4lGRnHNva8hysp2Q17TfN',
  wealth_once:                  'price_1Tl4pBRnHNva8hys1s5WC3uR',
  compatibility_monthly_report: 'price_1Tl51rRnHNva8hysoA4erWmn',
  wealth_monthly_report:        'price_1Tl56VRnHNva8hysQBWuVd5t',
  compatibility_yearly_report:  'price_1Tl59QRnHNva8hysEXDUGyEI',
  wealth_yearly_report:         'price_1Tl5BCRnHNva8hysRm3BfIHs',
  star_monthly_vip:             'price_1Tl5EjRnHNva8hysoVOryjQN',
  all_pass_yearly:              'price_1Tl5IFRnHNva8hysWa0ndl9A',
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
      `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=paid_plans,paid,stripe_customer_id,subscription_id`,
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

    const { plan = 'compatibility_once' } = req.body;
    const paidPlans = profile?.paid_plans || {};
    const now = new Date();

    // Plan-aware access check: use paid_plans only (not legacy paid boolean).
    // Broader plans cover narrower ones.
    function hasAccessToPlan(plans, target) {
      if (plans[target] === true) return true;

      const ap = plans.all_pass_yearly === true && (!plans.all_pass_expires_at || now < new Date(plans.all_pass_expires_at));

      // Compatibility plans covered by all_pass_yearly
      if (target === 'compatibility_once' || target === 'compatibility_monthly_report' || target === 'compatibility_yearly_report') {
        if (ap) return true;
        // star_monthly_vip includes 1 free compatibility per month
        if (target === 'compatibility_once' && plans.star_monthly_vip === true) {
          const used = plans.star_monthly_compatibility_used || 0;
          const allowance = plans.star_monthly_compatibility_allowance || 0;
          const resetsAt = plans.star_monthly_resets_at;
          if (used < allowance && resetsAt && now < new Date(resetsAt)) return true;
        }
      }

      // Wealth plans covered by all_pass_yearly
      if (target === 'wealth_once' || target === 'wealth_monthly_report' || target === 'wealth_yearly_report') {
        if (ap) return true;
        // star_monthly_vip includes 5 free wealth per month
        if (target === 'wealth_once' && plans.star_monthly_vip === true) {
          const used = plans.star_monthly_wealth_used || 0;
          const allowance = plans.star_monthly_wealth_allowance || 0;
          const resetsAt = plans.star_monthly_resets_at;
          if (used < allowance && resetsAt && now < new Date(resetsAt)) return true;
        }
      }

      return false;
    }

    if (hasAccessToPlan(paidPlans, plan)) {
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

    const PRODUCT_NAMES = {
      compatibility_once:           'Kindred Souls — Compatibility Reading',
      wealth_once:                  'Kindred Souls — Wealth Oracle (One-Time)',
      compatibility_monthly_report: 'Kindred Souls — Relationship Monthly Report',
      wealth_monthly_report:        'Kindred Souls — Wealth Monthly Report',
      compatibility_yearly_report:  'Kindred Souls — Compatibility Yearly Report',
      wealth_yearly_report:         'Kindred Souls — Wealth Yearly Report',
      star_monthly_vip:             'Kindred Souls — Star Monthly VIP',
      all_pass_yearly:              'Kindred Souls — All-Pass (Yearly)',
    };
    const PRODUCT_DESCS = {
      compatibility_once:           'One-time AI-powered relationship compatibility insight',
      wealth_once:                  'One-time wealth & career oracle reading',
      compatibility_monthly_report: 'Monthly relationship flow & forecast',
      wealth_monthly_report:        'Monthly wealth & career flow report',
      compatibility_yearly_report:  'Full-year relationship & destiny forecast',
      wealth_yearly_report:         'Full-year wealth & career forecast',
      star_monthly_vip:             'Monthly VIP: 5x wealth + 1x compatibility + all monthly reports included',
      all_pass_yearly:              'Everything — wealth oracle, compatibility, all future features',
    };
    const isSubscription = plan === 'star_monthly_vip' || plan === 'all_pass_yearly';
    // VIP plans cover wealth too — redirect to wealth page after payment
    const coversWealth = plan.startsWith('wealth_') || plan === 'star_monthly_vip' || plan === 'all_pass_yearly';
    const successPath = coversWealth
      ? '/wealth/report?payment=success'
      : '/?payment=success';
    const cancelPath = coversWealth
      ? '/wealth/report?payment=cancelled'
      : '/#/result?payment=cancelled';

    // ── Expire any existing active checkout sessions for this customer ──
    // Stripe forbids mixing currencies per customer, so clear old sessions first.
    try {
      const existingSessions = await stripe.checkout.sessions.list({
        customer: customerId,
        status: 'open',
        limit: 10,
      });
      for (const oldSession of existingSessions.data) {
        await stripe.checkout.sessions.expire(oldSession.id).catch(() => {});
      }
    } catch (e) {
      console.warn('[create-checkout] expire old sessions:', e.message);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{
        price: PRICE_IDS[plan] || undefined,
        price_data: PRICE_IDS[plan] ? undefined : {
          currency: 'aud',
          product_data: {
            name: PRODUCT_NAMES[plan] || PRODUCT_NAMES.compatibility_once,
            description: PRODUCT_DESCS[plan] || PRODUCT_DESCS.compatibility_once,
          },
          unit_amount: PRICES[plan] || PRICES.compatibility_once,
          recurring: isSubscription ? { interval: plan === 'all_pass_yearly' ? 'year' : 'month' } : undefined,
        },
        quantity: 1,
      }],
      success_url: `${req.headers.origin || 'https://www.kindredsouls.com.au'}${successPath}&plan=${plan}`,
      cancel_url: `${req.headers.origin || 'https://www.kindredsouls.com.au'}${cancelPath}`,
      metadata: { supabase_user_id: userId, plan },
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('[create-checkout] error:', err.message, err.stack?.split('\n')[0]);
    return res.status(500).json({ error: 'Failed to create checkout session', detail: err.message, hint: err.type || 'unknown' });
  }
}
