export const runtime = 'nodejs20.x';

export default async function handler(req, res) {
  return res.status(200).json({ ok: true, env: !!process.env.STRIPE_SECRET_KEY });
}
// auto-deploy test 1782004447
