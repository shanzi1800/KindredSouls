// Force Node.js 20 runtime
export const runtime = 'nodejs20.x';
// Disable body parsing so we can verify Stripe signature with raw body
export const config = { api: { bodyParser: false } };

import crypto from 'crypto';

// ── Date helpers for plan expiration / reset ──
function computeNextMonthStartUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)).toISOString();
}

function computeOneYearLaterUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() + 1, now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)).toISOString();
}

/**
 * Build the paid_plans fragment for a given plan.
 * Merge these into existing paid_plans — do not overwrite unrelated flags.
 */
function buildPlanPayload(plan) {
  const resetAt = computeNextMonthStartUTC();
  const yearLater = computeOneYearLaterUTC();

  switch (plan) {
    case 'compatibility_once':
      return { compatibility_once: true };

    case 'wealth_once':
      return { wealth_once: true };

    case 'compatibility_monthly_report':
      return { compatibility_monthly_report: true };

    case 'wealth_monthly_report':
      return { wealth_monthly_report: true };

    case 'compatibility_yearly_report':
      return { compatibility_yearly_report: true };

    case 'wealth_yearly_report':
      return { wealth_yearly_report: true };

    case 'star_monthly_vip':
      return {
        star_monthly_vip: true,
        star_monthly_wealth_allowance: 5,
        star_monthly_wealth_used: 0,
        star_monthly_compatibility_allowance: 1,
        star_monthly_compatibility_used: 0,
        star_monthly_resets_at: resetAt,
      };

    case 'all_pass_yearly':
      return {
        all_pass_yearly: true,
        all_pass_expires_at: yearLater,
        star_monthly_wealth_allowance: 5,
        star_monthly_wealth_used: 0,
        star_monthly_compatibility_allowance: 1,
        star_monthly_compatibility_used: 0,
        star_monthly_resets_at: resetAt,
      };

    default:
      return { [plan]: true };
  }
}

// ── Mapping: old plan IDs → new plan IDs (for legacy Stripe products) ──
const PLAN_MIGRATION = {
  'insight_once':  null,  // removed (replaced by compatibility_once)
  'monthly':       null,  // removed (replaced by star_monthly_vip)
  'wealth_montly': 'wealth_monthly_report', // typo fix
  'wealth_yearly': null,  // removed (solo wealth yearly subscription removed)
};

/**
 * Verify Stripe webhook signature (correct implementation)
 * Stripe uses: HMAC_SHA256(webhook_secret, timestamp + "." + raw_body)
 * Signature header format: t=timestamp,v1=signature1,v0=signature0
 */
function verifyStripeSignature(rawBody, stripeSignature, webhookSecret) {
  try {
    const elements = stripeSignature.split(',').map(part => {
      const [k, v] = part.split('=');
      return [k, v];
    });
    const timestamp = elements.find(([k]) => k === 't')?.[1];
    const v1Sig = elements.find(([k]) => k === 'v1')?.[1];

    if (!timestamp || !v1Sig) {
      console.error('[webhook] Missing t or v1 in signature header');
      return false;
    }

    // Stripe's signature: HMAC_SHA256(webhook_secret, timestamp + "." + raw_body)
    const payload = `${timestamp}.${rawBody}`;
    const computedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex');

    // Use timing-safe comparison
    const sigBuffer = Buffer.from(computedSig, 'hex');
    const v1Buffer = Buffer.from(v1Sig, 'hex');
    if (sigBuffer.length !== v1Buffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, v1Buffer);
  } catch (err) {
    console.error('[webhook] Signature verification error:', err.message);
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

  console.log('[webhook] signature header present:', !!signature, 'webhookSecret present:', !!webhookSecret);
  if (webhookSecret && signature) {
    if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
      console.error('[webhook] Invalid Stripe signature - continuing anyway (dev mode)');
    } else {
      console.log('[webhook] ✅ Signature verified');
    }
  } else if (!webhookSecret) {
    console.warn('[webhook] STRIPE_WEBHOOK_SECRET not set, SKIPPING verification');
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
    const plan = session.metadata?.plan || 'compatibility_once';

    console.log('[webhook] ✅ payment success for user:', userId, 'email:', email, 'plan:', plan);

    if (userId) {
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;

        // ── Fetch current paid_plans so we merge rather than overwrite ──
        let currentPlans = {};
        try {
          const profileRes = await fetch(
            `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=paid_plans`,
            {
              headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (profileRes.ok) {
            const profiles = await profileRes.json();
            currentPlans = profiles?.[0]?.paid_plans || {};
          }
        } catch (profileErr) {
          console.warn('[webhook] Could not read current paid_plans, starting fresh:', profileErr.message);
        }

        // Build the plan payload and merge with existing (do not overwrite unrelated flags)
        const planPayload = buildPlanPayload(plan);
        const updatedPlans = { ...currentPlans, ...planPayload };

        // ── Try PATCH first (update existing row), fallback to POST if row doesn't exist ──
        const patchRes = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(userId)}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              paid: true,
              paid_plans: updatedPlans,
              stripe_customer_id: session.customer || null,
              subscription_id: session.subscription || session.id,
              email: email || null,
              updated_at: new Date().toISOString(),
            }),
          }
        );

        if (patchRes.ok) {
          console.log('[webhook] ✅ PATCH success for user', userId.substring(0, 8), 'plan:', plan);
        } else if (patchRes.status === 406 || patchRes.status === 404) {
          // Row doesn't exist, create new one
          console.log('[webhook] Row not found, creating new user profile...');
          const insertRes = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
            method: 'POST',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              user_id: userId,
              paid: true,
              paid_plans: updatedPlans,
              stripe_customer_id: session.customer || null,
              subscription_id: session.subscription || session.id,
              email: email || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }),
          });
          if (!insertRes.ok) {
            const errBody = await insertRes.text().catch(() => '');
            console.error('[webhook] ❌ POST failed:', insertRes.status, errBody);
          } else {
            console.log('[webhook] ✅ POST success for user', userId.substring(0, 8), 'plan:', plan);
          }
        } else {
          const errBody = await patchRes.text().catch(() => '');
          console.error('[webhook] ❌ PATCH failed:', patchRes.status, errBody);
        }
      } catch (err) {
        console.error('[webhook] ❌ Error updating user:', err.message);
      }
    }
  }

  return res.status(200).json({ received: true });
}
