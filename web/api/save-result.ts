export default async function handler(req: { method?: string; body?: unknown }, res: { status(code: number): { json(data: unknown): void } }) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as {
      user_id?: string;
      dob1?: string;
      dob2?: string;
      overall_score?: number;
      dimensions?: Record<string, number>;
      engines?: Record<string, unknown>;
      language?: string;
    };

    // TODO: Connect to Supabase when credentials are available
    // For now, acknowledge receipt
    console.log('save-result payload:', JSON.stringify(body).slice(0, 500));

    return res.status(200).json({ saved: true, message: 'Result logged' });
  } catch (err) {
    console.error('save-result error:', err);
    return res.status(500).json({ error: 'Failed to save result' });
  }
}
