export const runtime = 'nodejs';

export default async function handler(req, res) {
  console.log('[ai-insight-minimal] Called');
  console.log('[ai-insight-minimal] Method:', req.method);
  
  try {
    const body = await req.json();
    console.log('[ai-insight-minimal] Body:', JSON.stringify(body));
    
    return res.status(200).json({
      status: 'ok',
      message: 'Minimal endpoint works',
      bodyReceived: !!body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ai-insight-minimal] Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
