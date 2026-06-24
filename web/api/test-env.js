export const runtime = 'nodejs20.x';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  const stripeKeyLen = hasStripe ? process.env.STRIPE_SECRET_KEY.length : 0;
  const stripeKeyPrefix = hasStripe ? process.env.STRIPE_SECRET_KEY.substring(0, 10) : '';
  res.status(200).json({
    has_stripe_key: hasStripe,
    stripe_key_length: stripeKeyLen,
    stripe_key_preview: stripeKeyPrefix,
    supabase_url: (process.env.SUPABASE_URL || '').substring(0, 20),
  });
}
