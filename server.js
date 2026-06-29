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

// ── /api/debug-env ──
app.get('/api/debug-env', (req, res) => {
  res.json({
    DEEPSEEK: process.env.DEEPSEEK_API_KEY ? '✓ set' : '✗ missing',
    GEMINI: process.env.GEMINI_API_KEY ? '✓ ' + process.env.GEMINI_API_KEY.slice(0,8) + '...' : '✗ missing',
    SUPABASE_URL: process.env.SUPABASE_URL ? '✓ set' : '✗ missing',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? '✓ set' : '✗ missing',
    STRIPE: process.env.STRIPE_SECRET_KEY ? '✓ set' : '✗ missing',
  });
});

// ── /api/health ──
app.use('/api/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'kindredsouls-api', version: '2026-06-29b' });
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
      success_url: successUrl || `${req.headers.origin || 'https://kindredsouls.com'}/result?session_id={CHECKOUT_SESSION_ID}&paid=true`,
      cancel_url: cancelUrl || `${req.headers.origin || 'https://kindredsouls.com'}/result?canceled=true`,
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
    // 直接用 REST API 写入
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    const insRes = await fetch(
      `${SB_URL}/rest/v1/compatibility_results`,
      {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ user_id: userId, result_type: resultType, result_data: resultData })
      }
    );
    if (!insRes.ok) throw new Error(`Supabase insert failed: ${insRes.status}`);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[save-result]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/wealth-oracle ──
app.post('/api/wealth-oracle', async (req, res) => {
  try {
    const { birthDate, lang = 'zh' } = req.body;
    if (!birthDate) return res.status(400).json({ success: false, error: 'birthDate required' });

    const TIANGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const DIZHI   = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const WUXING_TG = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const WUXING_DZ = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };
    const DAY_MASTER_EL = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };

    // ── 1. 八字 ──
    const [year, month, day] = birthDate.split('-').map(Number);
    const yTG = TIANGAN[(year - 4) % 10];
    const yDZ = DIZHI[(year - 4) % 12];
    const mTG = TIANGAN[(month + 1) % 10];
    const mDZ = DIZHI[(month + 1) % 12];
    const dTG = TIANGAN[((year - 1900) * 5 + (month - 1) * 30 + day - 15) % 10];
    const dDZ = DIZHI[((year - 1900) * 12 + (month - 1) * 30 + day - 15) % 12];
    const dayMasterEl = DAY_MASTER_EL[dTG];
    const dayMasterName = `${dTG}·${dayMasterEl}`;

    const wuxing = { '金':0,'木':0,'水':0,'火':0,'土':0 };
    [yTG, mTG, dTG].forEach(el => { if (WUXING_TG[el]) wuxing[WUXING_TG[el]]++; });
    [yDZ, mDZ, dDZ].forEach(el => { if (WUXING_DZ[el]) wuxing[WUXING_DZ[el]]++; });

    const score = Math.floor((wuxing['土'] + wuxing['金']) * 12 + wuxing['水'] * 15 + wuxing['木'] * 10);

    // ── 2. 星座 ──
    const signs = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
    const signsEn = ['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'];
    const elements = ['土','风','水','火','土','风','水','火','土','风','水','火'];
    const modalities = ['基本','固定','变动','基本','固定','变动','基本','固定','变动','基本','固定','变动'];
    const rulers = ['土星','天王星','海王星','火星','金星','水星','月亮','太阳','水星','金星','冥王星','木星'];

    // 星座查表：每月最多2个星座，按结束日判断
    function getZodiacIdx(m, d) {
      const t = [[1,19,'水瓶座'],[2,18,'双鱼座'],[3,20,'白羊座'],[4,19,'金牛座'],[5,20,'双子座'],[6,20,'巨蟹座'],[7,22,'狮子座'],[8,22,'处女座'],[9,22,'天秤座'],[10,22,'天蝎座'],[11,21,'射手座'],[12,21,'摩羯座']];
      if (m === 1 && d >= 20) return 1;
      for (let i = 0; i < t.length; i++) {
        const [em, ed] = t[i];
        if (m === em && d <= ed) return i + 1;
      }
      return 0;
    }
    const zodiacIdx = getZodiacIdx(month, day);
    const sunSign = signs[zodiacIdx];
    const sunSignEn = signsEn[zodiacIdx];
    const sunSignElement = elements[zodiacIdx];
    const sunSignMode = modalities[zodiacIdx];
    const sunSignRuler = rulers[zodiacIdx];

    // ── 3. 易经 ──
    const HEXNAMES = ['乾','兑','离','震','巽','坎','艮','坤'];
    const HEXNAMES_EN = ['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'];
    const HEXNATURES = ['天','泽','火','雷','风','水','山','地'];
    const hash = ((year * 31 + month * 17 + day * 7) % 64) + 1;
    const upper = Math.floor((hash - 1) / 8) + 1;
    const lower = (hash - 1) % 8 + 1;
    const hexName = HEXNAMES[upper - 1];
    const hexNameEn = HEXNAMES_EN[upper - 1];
    const hexNature = HEXNATURES[upper - 1];
    const changingLine = ((year + month + day) % 6) + 1;
    const transformedHex = upper === 8 ? 2 : upper + 1;
    const transformedHexName = HEXNAMES[transformedHex - 1];
    const transformedHexNameEn = HEXNAMES_EN[transformedHex - 1];

    // ── 4. 塔罗 ──
    const tarotId = ((year * 13 + month * 3 + day) % 22);
    const tarotReversed = (year + month + day) % 3 === 0;

    // 22张大阿卡纳：id → {name(中), nameEn(英), emoji, meaning(中), meaningEn(英)}
    const TAROT_CARDS = [
      { name:'愚人', nameEn:'The Fool', emoji:'🃏', meaning:'新的财务冒险即将开始，适合小额试错。', meaningEn:'A new financial adventure begins. Calculated risks favor you today.' },
      { name:'魔术师', nameEn:'The Magician', emoji:'🎩', meaning:'你手头资源足以搅动一个项目，直接动手。', meaningEn:'Your financial tools are ready. Manifest wealth with focus.' },
      { name:'女祭司', nameEn:'The High Priestess', emoji:'🌙', meaning:'直觉今天比财报准，信任你第六感。', meaningEn:'Financial intuition peaks. Trust your money gut today.' },
      { name:'女皇', nameEn:'The Empress', emoji:'👑', meaning:'适合收割之前种下的项目，果实该摘了。', meaningEn:'Financial abundance flows. Harvest what you planted.' },
      { name:'皇帝', nameEn:'The Emperor', emoji:'🏛️', meaning:'拍板一个决策，把人管住，钱理清。', meaningEn:'Solid financial foundation. Build wealth with clear rules.' },
      { name:'教皇', nameEn:'The Hierophant', emoji:'📜', meaning:'找个比你赚得多的人聊，问题可能出在认知圈。', meaningEn:'Seek a wealth mentor. Your money path needs guidance.' },
      { name:'恋人', nameEn:'The Lovers', emoji:'💞', meaning:'跟钱有关的选择，选让你心跳加速的那条。', meaningEn:'Financial choice point. Follow your money heart.' },
      { name:'战车', nameEn:'The Chariot', emoji:'🏇', meaning:'全速推进，犹豫一秒都是对财运的不尊重。', meaningEn:'Unstoppable financial momentum. Execute with confidence.' },
      { name:'力量', nameEn:'Strength', emoji:'🦁', meaning:'今天要么搞定那笔钱，要么搞定那个不敢谈价的人。', meaningEn:'Inner financial power. Gentle wealth strength awakens.' },
      { name:'隐士', nameEn:'The Hermit', emoji:'🏮', meaning:'关掉消息提醒，花30分钟盘你的财务底牌。', meaningEn:'Financial wisdom within. Solitude brings money insights.' },
      { name:'命运之轮', nameEn:'Wheel of Fortune', emoji:'🎡', meaning:'你的财运拐点到了，今天必须做一次主动出击。', meaningEn:'Financial cycle turning. Fortune favors bold money moves.' },
      { name:'正义', nameEn:'Justice', emoji:'⚖️', meaning:'做一件正确但难开口的事，跟合伙人谈分成。', meaningEn:'Financial karma balancing. Money justice arrives.' },
      { name:'倒吊人', nameEn:'The Hanged Man', emoji:'🙃', meaning:'停下来的勇气比冲的勇气值钱。', meaningEn:'Financial perspective shift. New money vision needed.' },
      { name:'死神', nameEn:'Death', emoji:'💀', meaning:'清理一个拖你后腿的财务包袱，结束才有新生。', meaningEn:'Financial transformation. Old you dies, new emerges.' },
      { name:'节制', nameEn:'Temperance', emoji:'🍷', meaning:'今天最适合做资产配置的一步调整。', meaningEn:'Financial balance. Moderate money approach wins.' },
      { name:'恶魔', nameEn:'The Devil', emoji:'😈', meaning:'直视你最上瘾的那笔消费或投资。', meaningEn:'Financial shadow work. Face money demons to win.' },
      { name:'高塔', nameEn:'The Tower', emoji:'🗼', meaning:'打破一个旧的收入结构，制造一次主动破坏。', meaningEn:'Financial breakthrough. Sudden money shift incoming.' },
      { name:'星星', nameEn:'The Star', emoji:'⭐', meaning:'今天适合定下一个长期目标。', meaningEn:'Financial hope returns. Wealth star guides your journey.' },
      { name:'月亮', nameEn:'The Moon', emoji:'🌕', meaning:'赚钱机会藏在模糊信息里。', meaningEn:'Financial intuition peaks. Lunar money magic works.' },
      { name:'太阳', nameEn:'The Sun', emoji:'☀️', meaning:'今天是亮牌日，把价值show出来。', meaningEn:'Financial success bright ahead. Wealth sunshine blesses you.' },
      { name:'审判', nameEn:'Judgement', emoji:'📯', meaning:'复盘一次过去的财务失误。', meaningEn:'Financial rebirth. Wealth calling heard.' },
      { name:'世界', nameEn:'The World', emoji:'🌍', meaning:'一个财务周期结束了，今天奖励自己。', meaningEn:'Financial cycle complete. Wealth world transforms.' }
    ];
    const card = TAROT_CARDS[tarotId];
    const cardMeaning = lang === 'zh' ? card.meaning : card.meaningEn;

    const result = {
      success: true,
      birthDate, lang,
      score,
      cached: false,
      message: lang === 'zh' ? '财富格局已生成' : 'Wealth pattern generated',
      data: {
        bazi: {
          sizhu: {
            yearPillar: `${yTG}${yDZ}`,
            monthPillar: `${mTG}${mDZ}`,
            dayPillar: `${dTG}${dDZ}`,
            dayMaster: dayMasterName,
            dayMasterWuxing: dayMasterEl
          },
          wuxing
        },
        zodiac: { sunSign, sunSignEn, sunSignElement, sunSignMode, sunSignRuler },
        iching: { hexName, hexNameEn, hexNum: hash, hexNature, changingLine, transformedHexName, transformedHexNameEn },
        tarot: {
          id: tarotId,
          name: card.name,
          nameEn: card.nameEn,
          emoji: card.emoji,
          meaning: cardMeaning,
          orientation: tarotReversed ? 'Reversed' : 'Upright'
        }
      }
    };
    res.json(result);
  } catch (err) {
    console.error('[wealth-oracle]', err.message, err.stack);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── /api/test-gemini ──
app.get('/api/test-gemini', async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ error: 'GEMINI_API_KEY not set' });
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 50 } }),
      }
    );
    const data = await r.json();
    res.json({ status: r.status, data });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ── /api/ai-advisor (REST API版，无Supabase客户端依赖) ──
app.use('/api/ai-advisor', async (req, res) => {
  try {
    const { d1, d2, lang = 'zh', reportType = 'compatibility' } = req.body || {};
    const cacheKey = `${d1 || ''}|${d2 || ''}|${lang}|${reportType}`;
    const since = new Date(Date.now() - 24*3600*1000).toISOString();

    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

    // ── 检查缓存（直接用 REST API）──
    const cacheRes = await fetch(
      `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&created_at=gte.${since}&select=insight`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    const cached = await cacheRes.json();
    if (cached?.[0]?.insight) {
      return res.json({ insight: cached[0].insight, cached: true });
    }

    const prompt = reportType === 'compatibility'
      ? `请分析 ${d1} 和 ${d2} 的命理合盘，用${lang === 'zh' ? '中文' : lang === 'en' ? '英文' : '中文'}给出温暖、积极的情感解读。`
      : `请分析 ${d1} 的财富格局，用${lang === 'zh' ? '中文' : '英文'}给出专业的财富建议。`;

    // ── DeepSeek 直连，失败自动切 Gemini 免费层 ──
    let insight = '';
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (deepseekKey) {
      try {
        const aiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
          body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 800, temperature: 0.35 }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          insight = aiData.choices?.[0]?.message?.content?.trim() || '';
        } else {
          console.warn(`[ai-advisor] DeepSeek failed (${aiRes.status}), falling back to Gemini`);
        }
      } catch (e) {
        console.warn(`[ai-advisor] DeepSeek error: ${e.message}, falling back to Gemini`);
      }
    }

    // Gemini 免费层 fallback
    if (!insight && geminiKey) {
      try {
        const gemRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 800, temperature: 0.35 } }),
          }
        );
        if (!gemRes.ok) throw new Error(`Gemini ${gemRes.status}`);
        const gemData = await gemRes.json();
        insight = gemData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (insight) console.log('[ai-advisor] ✓ Gemini fallback used');
      } catch (e) {
        console.error('[ai-advisor] Gemini fallback failed:', e.message);
      }
    }

    if (!insight) return res.status(500).json({ error: 'All AI providers failed' });

    // ── 写入缓存（直接 REST）──
    await fetch(
      `${SB_URL}/rest/v1/ai_insights_cache`,
      {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ cache_key: cacheKey, insight, prompt_version: 'v1' })
      }
    );

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
