const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

(async () => {
  const prices = await stripe.prices.list({ limit: 20, active: true });
  console.log('Active Stripe Prices:\n');
  prices.data.forEach(p => {
    console.log(`- ${p.id} | $${(p.unit_amount / 100).toFixed(2)} / ${p.recurring?.interval || 'one_time'} | ${p.nickname || p.product}`);
  });
})();
