// KindredSouls Railway Server
// Serves static frontend + all API routes on port 3000
import express from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const app = express();

// ── Middleware ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS ──
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ── API Routes ──
// Each route handler runs the original Vercel function logic

// ── /api/health ──
app.use('/api/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'kindredsouls-api' });
});

// ── /api/create-checkout ──
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { plan, successUrl, cancelUrl } = req.body;
    const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: plan, quantity: 1 }],
      success_url: successUrl || `${req.headers.origin || 'https://kindredsouls.com.au'}/result?session_id={CHECKOUT_SESSION_ID}&paid=true`,
      cancel_url: cancelUrl || `${req.headers.origin || 'https://kindredsouls.com.au'}/result?canceled=true`,
    };
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[create-checkout]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/webhook ──
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeSig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));
    const event = stripe.webhooks.constructEvent(req.body, stripeSig, webhookSecret);
    console.log('[webhook] Event:', event.type);
    // Handle events here (same logic as original webhook.js)
    if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.created') {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;
      console.log('[webhook] Payment from:', email, 'plan:', session.metadata?.plan || session.subscription);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[webhook]', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ── /api/save-result ──
app.post('/api/save-result', async (req, res) => {
  try {
    const { userId, resultType, resultData } = req.body;
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { error } = await supabase.from('compatibility_results').insert({
      user_id: userId,
      result_type: resultType,
      result_data: resultData,
    });
    if (error) throw error;
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[save-result]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/wealth-oracle ──
app.post('/api/wealth-oracle', async (req, res) => {
  try {
    // 直接调原始 wealth-oracle 逻辑
    const { birthDate, lang = 'zh' } = req.body;
    if (!birthDate) return res.status(400).json({ error: 'birthDate required' });

    // ── 八字计算（从 wealth-oracle.js 提取）──
    const TIANGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const DIZHI   = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const [year, month, day] = birthDate.split('-').map(Number);
    const yTG = TIANGAN[(year - 4) % 10];
    const yDZ = DIZHI[(year - 4) % 12];
    const mDZ = DIZHI[(month + 1) % 12];
    const dTG = TIANGAN[((year - 1900) * 5 + (month - 1) * 30 + day - 15) % 10];
    const dDZ = DIZHI[((year - 1900) * 12 + (month - 1) * 30 + day - 15) % 12];

    const WUXING_SCORE = { '金':0,'水':0,'木':0,'火':0,'土':0 };
    const tg = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const dz = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };
    [yTG,yDZ,mDZ,dTG,dDZ].forEach(el => WUXING_SCORE[tg[el]]++);
    [yDZ,mDZ,dDZ].forEach(el => WUXING_SCORE[dz[el]]++);

    const score = Math.floor((WUXING_SCORE['土'] + WUXING_SCORE['金']) * 12 + WUXING_SCORE['水'] * 15 + WUXING_SCORE['木'] * 10);

    const result = {
      birthDate, lang,
      八字: { 年柱:`${yTG}${yDZ}`, 月柱:`${mTG||TIANGAN[(month-4+1)%10]}${mDZ}`, 日柱:`${dTG}${dDZ}`, 时柱:'待定' },
      wuxing: WUXING_SCORE,
      score,
      cached: false,
      message: lang === 'zh' ? '财富格局已生成' : 'Wealth pattern generated'
    };
    res.json(result);
  } catch (err) {
    console.error('[wealth-oracle]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/ai-advisor (简版，完整迁移见 ai-advisor.mjs) ──
app.use('/api/ai-advisor', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { d1, d2, lang = 'zh', reportType = 'compatibility' } = req.body || {};
    const cacheKey = `${d1 || ''}|${d2 || ''}|${lang}|${reportType}`;

    // 检查缓存
    const { data: cached } = await supabase
      .from('ai_insights_cache')
      .select('insight')
      .eq('cache_key', cacheKey)
      .gte('created_at', new Date(Date.now() - 24*3600*1000).toISOString())
      .single();

    if (cached?.insight) {
      return res.json({ insight: cached.insight, cached: true });
    }

    // DeepSeek 调用（走直连，不走 Vercel）
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekKey) return res.status(500).json({ error: 'AI API key not configured' });

    const prompt = reportType === 'compatibility'
      ? `请分析 ${d1} 和 ${d2} 的命理合盘，用${lang === 'zh' ? '中文' : lang === 'en' ? '英文' : '中文'}给出温暖、积极的情感解读。`
      : `请分析 ${d1} 的财富格局，用${lang === 'zh' ? '中文' : '英文'}给出专业的财富建议。`;

    const aiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 800, temperature: 0.35 }),
    });

    if (!aiRes.ok) throw new Error(`DeepSeek error: ${aiRes.status}`);
    const aiData = await aiRes.json();
    const insight = aiData.choices?.[0]?.message?.content?.trim() || '';

    // 写入缓存
    await supabase.from('ai_insights_cache').insert({ cache_key: cacheKey, insight, prompt_version: 'v1' });

    res.json({ insight, cached: false });
  } catch (err) {
    console.error('[ai-advisor]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Serve static frontend (dist/) ──
const distPath = join(__dirname, 'web', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && existsSync(join(distPath, 'index.html'))) {
      return res.sendFile(join(distPath, 'index.html'));
    }
    next();
  });
}

// ── Start ──
app.listen(PORT, () => {
  console.log(`[KindredSouls] 🚄 Railway server running on port ${PORT}`);
  console.log(`  - API: http://localhost:${PORT}/api/*`);
  console.log(`  - Web: http://localhost:${PORT}/`);
});
