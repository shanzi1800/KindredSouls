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
    serverVersion: 't4-debug-2026-06-29c',
    tarotHasName: typeof TAROT_CARDS !== 'undefined' && TAROT_CARDS[0] && !!TAROT_CARDS[0].name,
    fileSize: require('fs').readFileSync(__filename).length,
  });
});

// ── /api/health ──
app.use('/api/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'kindredsouls-api', version: 'v1.0.0-2026-30-TEST-FIX' });
});

// ── AI Call Helper (DeepSeek + Gemini fallback) ──
async function callAI(systemPrompt, userPrompt, env) {
  const deepseekKey = env.DEEPSEEK_API_KEY;
  const geminiKey = env.GEMINI_API_KEY;

  // Try DeepSeek first
  if (deepseekKey) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 8000,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.error('[AI] DeepSeek failed, trying Gemini:', e.message);
    }
  }

  // Fallback to Gemini
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
          }],
          generationConfig: { maxOutputTokens: 8000, temperature: 0.7 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
      }
    } catch (e) {
      console.error('[AI] Gemini failed:', e.message);
    }
  }

  throw new Error('All AI providers failed');
}

// ── Wealth Report Prompt Builder (按军师框架) ──
function buildCompatibilityReportPrompt(d1, d2, lang, reportType) {
  const langInstructions = {
    zh: '',
    en: `\n\n[Language Style: English] You are a top-tier relationship astrologer and Jungian psychologist. Use terms like Shadow Self, Synastry Alignment, Karmic Tether. Write in sophisticated, soul-stirring English.`,
    es: `\n\n[Language Style: Spanish] Eres un astrólogo de relaciones élite. Usa términos profesionales. Escríbelo en español sofisticado y místico.`,
    fr: `\n\n[Language Style: French] Vous êtes un maître astrologue relationnel parisien. Utilisez un ton romantique, philosophique. Écrivez en français élégant.`,
    th: `\n\n[Language Style: Thai] คุณคือโหราจารย์ความสัมพันธ์ชั้นนำที่ผสมผสานศาสนาพุทธและโหราศาสตร์ไทย เขียนในภาษาไทยที่ทรงพลัง`,
    vi: `\n\n[Language Style: Vietnamese] Bạn là một chiêm tinh gia quan hệ hàng đầu kết hợp Đạo giáo và chiêm tinh học Việt Nam. Viết bằng tiếng Việt trang trọng.`,
  };

  const instruction = langInstructions[lang] || langInstructions.en;

  if (reportType === 'monthly') {
    return `Generate a ${lang} monthly compatibility report for two people (birth dates: ${d1} and ${d2}) for July 2026.\n\nCRITICAL REQUIREMENTS:\n1. Total length: STRICTLY 1200-1500 words (${lang})\n2. Style: Fast-consuming, card-style, romantic\n3. MUST have 3 sections:\n\nSection 1 (300 words): 双人流月磁场 - synergy overview\nSection 2 (500 words): 恋爱破冰/激情日 - give 2 specific golden days in July\nSection 3 (400 words): 安全气囊熔断日 - warn about 1 specific high-risk day\n\nOUTPUT FORMAT (STRICT JSON):\n{\n  "headline": "...",\n  "weeks": [\n    {"type": "spark", "tag": "💖 Spark Week", "dateRange": "Jul 1-7", "text": "...(min 150 words)", "keyDay": "Jul 5"},\n    {"type": "risk", "tag": "⚡ Karmic Friction", "dateRange": "Jul 8-14", "text": "...(min 150 words)", "keyDay": "Jul 11"},\n    {"type": "flow", "tag": "🔵 Flow Week", "dateRange": "Jul 15-21", "text": "...(min 150 words)", "keyDay": "Jul 18"},\n    {"type": "spark", "tag": "💖 Spark Week", "dateRange": "Jul 22-31", "text": "...(min 150 words)", "keyDay": "Jul 28"}\n  ],\n  "silent_treatment": {"tag": "⚠️ Silent Treatment Day", "dateRange": "...", "text": "...(min 100 words)"}\n}\n\nIMPORTANT:\n- Each week's text MUST be at least 150 words\n- Write in ${lang} with native relationship astrological terms\n- NO markdown formatting in text fields\n- Focus on emotions, intimacy, communication patterns`;
  } else if (reportType === 'yearly') {
    return `Generate a ${lang} yearly compatibility almanac for two people (birth dates: ${d1} and ${d2}) for 2026-2027.\n\nCRITICAL REQUIREMENTS:\n1. Total length: 6000-8000 words (${lang})\n2. Style: Epic, destiny-filled, premium\n3. Must include 5 chapters:\n\nChapter 1 (1200 words): Annual Synergy Matrix - karmic tether analysis\nChapter 2 (3000 words): 12-Month Relationship Calendar - detail EVERY month\nChapter 3 (1000 words): Shadow Self & Hidden Crises\nChapter 4 (1000 words): Money & Home Conflicts\nChapter 5 (800 words): Cosmic Guide for the Year\n\nOUTPUT FORMAT: Markdown with 5 chapters.\n\nWrite in ${lang}. Use native ${lang} relationship astrological terms.`;
  }
  return `分析 ${d1} 和 ${d2} 的命理合盘。必须用 ${lang} 输出，温暖、积极的情感解读。`;
}
  const langInstructions = {
    zh: '',
    en: `\n\n[Language Style: English] You are a top-tier Western astrologer and Jungian psychologist. Use professional terms (Solar Return, Shadow Self, Synastry Alignment). Write in sophisticated, soul-stirring English.`,
    es: `\n\n[Language Style: Spanish] Eres un astrólogo de élite. Usa términos profesionales. Escríbelo en español sofisticado y místico.`,
    fr: `\n\n[Language Style: French] Vous êtes un maître astrologue parisien. Utilisez un ton romantique, philosophique, avec des termes tarologiques classiques. Écrivez en français élégant.`,
    th: `\n\n[Language Style: Thai] คุณคือโหราจารย์ชั้นนำที่ผสมผสานศาสนาพุทธและโหราศาสตร์ไทย ใช้คำที่ศักดิ์สิทธิ์และน่าเคารพ เขียนในภาษาไทยที่ทรงพลัง`,
    vi: `\n\n[Language Style: Vietnamese] Bạn là một chiêm tinh gia hàng đầu kết hợp Đạo giáo và chiêm tinh học Việt Nam. Viết bằng tiếng Việt trang trọng, mang tính định mệnh.`,
  };

  const instruction = langInstructions[lang] || langInstructions.en;

  if (reportType === 'monthly') {
    return {
      system: `You are a wealth astrologer generating a monthly financial report.${instruction}\n\nCRITICAL: You MUST write at least 1200 words (${lang}). If you write less than 1200 words, the report will be rejected. Write detailed, specific content for each week.`,
      user: `Generate a ${lang} monthly wealth report for birth date ${birthDate} (July 2026).\n\nCRITICAL REQUIREMENTS:\n1. Total length: STRICTLY 1200-1500 words (${lang}) - COUNT YOUR WORDS BEFORE SUBMITTING\n2. Style: Fast-consuming, card-style, actionable\n3. MUST have 4 weeks (not 3)\n\nSTRUCTURE:\nSection 1 (300 words): Monthly wealth overview - current financial energy, mantra\nSection 2 (400 words): 3 Golden Days in July 2026 with SPECIFIC dates\nSection 3 (300 words): Expense Trap warning with SPECIFIC date\nSection 4 (200 words): Action guide for the month\n\nOUTPUT FORMAT (STRICT JSON):\n{\n  "headline": "...",\n  "weeks": [\n    {"type": "peak", "tag": "🟢 Peak Week", "dateRange": "Jul 1-7", "text": "...(minimum 150 words)", "keyDay": "Jul 3"},\n    {"type": "risk", "tag": "🔴 High-Risk Week", "dateRange": "Jul 8-14", "text": "...(minimum 150 words)", "keyDay": "Jul 11"},\n    {"type": "flow", "tag": "🔵 Flow Week", "dateRange": "Jul 15-21", "text": "...(minimum 150 words)", "keyDay": "Jul 18"},\n    {"type": "peak", "tag": "🟢 Peak Week", "dateRange": "Jul 22-31", "text": "...(minimum 150 words)", "keyDay": "Jul 28"}\n  ],\n  "expense_trap": {"tag": "⚠️ Expense Trap", "dateRange": "...", "text": "...(minimum 100 words)"}\n}\n\nIMPORTANT: \n- Each week's text MUST be at least 150 words\n- Write in ${lang} with native astrological terms\n- NO markdown formatting in text fields (no **, ##, etc)\n- NO English words in Chinese version (except astrological terms like Jupiter, Saturn)`,
    };
  } else if (reportType === 'yearly') {
    return {
      system: `You are a master wealth astrologer generating a premium yearly almanac.${instruction}`,
      user: `Generate a ${lang} yearly wealth almanac for birth date ${birthDate} (2026-2027).\n\nREQUIREMENTS:\n- Total length: 6000-8000 words (${lang})\n- Style: Epic, destiny-filled, premium ($29.99 value)\n- Must include 5 chapters:\n\nChapter 1 (1200 words): Annual Wealth Matrix\nChapter 2 (3000 words): 12-Month Revenue Matrix\nChapter 3 (1000 words): Destiny Career Path\nChapter 4 (1000 words): Debt & Risk Shield\nChapter 5 (800 words): Oracle's Manifestation Guide\n\nOUTPUT FORMAT: Markdown with 5 chapters.\n\nWrite in ${lang}. Use native ${lang} astrological and psychological terms.`,
    };
  }
  return null;
}


// ── Stripe Price ID 映射表 ──
// ⚠️ 需要替换为真实的 Stripe Price ID（从 Stripe Dashboard 获取）
const STRIPE_PRICE_MAP = {
  wealth_once:           'price_1Tl4pBRnHNva8hys1s5WC3uR',  // $4.99 财富单次
  wealth_monthly_report: 'price_1Tl56VRnHNva8hysQBWuVd5t',  // $2.99 财富月报
  wealth_yearly_report:  'price_1Tl5BCRnHNva8hysRm3BfIHs',  // $29.99 财富年报
  compatibility_once:    'price_1Tl4lGRnHNva8hysp2Q17TfN',  // $4.99 合婚单次
  compatibility_monthly_report: 'price_1Tl51rRnHNva8hysoA4erWmn',  // $2.99 合婚月报
  compatibility_yearly_report:  'price_1Tl59QRnHNva8hysEXDUGyEI',  // $29.99 合婚年报
  star_monthly_vip:      'price_1Tl5EjRnHNva8hysoVOryjQN',  // $9.99 双引擎月卡
  all_pass_yearly:       'price_1Tl5IFRnHNva8hysWa0ndl9A',  // $99.99 全通年卡
};
// ── /api/create-checkout ──
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { plan, successUrl, cancelUrl } = req.body;
    const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));
    
    // 🛡️ 映射计划名 → Stripe Price ID
    const priceId = STRIPE_PRICE_MAP[plan] || plan; // 兼容直接传 Price ID 的情况
    if (!STRIPE_PRICE_MAP[plan] && !plan.startsWith('price_')) {
      console.error('[create-checkout] Unknown plan:', plan);
      return res.status(400).json({ error: 'Unknown plan: ' + plan });
    }
    
    // 🛡️ 根据 plan 决定 mode：单次产品用 payment，订阅用 subscription
    const SUBSCRIPTION_PLANS = new Set(['star_monthly_vip', 'all_pass_yearly']);
    const sessionParams = {
      mode: SUBSCRIPTION_PLANS.has(plan) ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
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

    const TIANGAN = { zh:['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'], en:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], es:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], fr:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], th:['เจีย','อี้','ปิง','ติง','อู๋','จี','เกิง','ซิน','เหริน','กุ่ย'], vi:['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'] };
    const DIZHI = { zh:['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'], en:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], es:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], fr:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], th:['จื่อ','โฉ่ว','อิน','เม้า','เฉิน','ซื่อ','อู๋','เว่ย','เซิน','โย่ว','สวี่','ไห่'], vi:['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'] };
    const WUXING = { zh:['金','木','水','火','土'], en:['Metal','Wood','Water','Fire','Earth'], es:['Metal','Madera','Agua','Fuego','Tierra'], fr:['Métal','Bois','Eau','Feu','Terre'], th:['โลหะ','ไม้','น้ำ','ไฟ','ดิน'], vi:['Kim','Mộc','Thủy','Hỏa','Thổ'] };
    const WUXING_TG = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const WUXING_DZ = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };
    const DAY_MASTER_EL = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const t = (dict, key, lang) => (dict[lang] && dict[lang][key] !== undefined) ? dict[lang][key] : (dict.zh ? dict.zh[key] : dict[key]);

    // ── 1. 八字 ──
    const [year, month, day] = birthDate.split('-').map(Number);
    const yTG = TIANGAN.zh[(year - 4) % 10]; const yTGDisplay = t(TIANGAN, (year - 4) % 10, lang);
    const yDZ = DIZHI.zh[(year - 4) % 12]; const yDZDisplay = t(DIZHI, (year - 4) % 12, lang);
    const mTG = TIANGAN.zh[(month + 1) % 10]; const mTGDisplay = t(TIANGAN, (month + 1) % 10, lang);
    const mDZ = DIZHI.zh[(month + 1) % 12]; const mDZDisplay = t(DIZHI, (month + 1) % 12, lang);
    const dTGIdx = ((year - 1900) * 5 + (month - 1) * 30 + day - 15) % 10; const dTG = TIANGAN.zh[dTGIdx]; const dTGDisplay = t(TIANGAN, dTGIdx, lang);
    const dDZIdx = ((year - 1900) * 12 + (month - 1) * 30 + day - 15) % 12; const dDZ = DIZHI.zh[dDZIdx]; const dDZDisplay = t(DIZHI, dDZIdx, lang);
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
    const HEXNAMES = { zh:['乾','兑','离','震','巽','坎','艮','坤'], en:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], es:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], fr:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], th:['เฉียน','ตุ้ย','หลี่','เจิ้น','ซุน','ขั้น','เคิ่น','คุ่น'], vi:['Càn','Đoái','Ly','Chấn','Tốn','Khảm','Cấn','Khôn'] };
    const HEXNATURES = { zh:['天','泽','火','雷','风','水','山','地'], en:['Heaven','Lake','Fire','Thunder','Wind','Water','Mountain','Earth'], es:['Cielo','Lago','Fuego','Trueno','Viento','Agua','Montaña','Tierra'], fr:['Ciel','Lac','Feu','Tonnerre','Vent','Eau','Montagne','Terre'], th:['สวรรค์','บึง','ไฟ','ฟ้าร้อง','ลม','น้ำ','ภูเขา','ดิน'], vi:['Trờ','Đầm','Lửa','Sấm','Gió','Nước','Núi','Đất'] };
    const hash = ((year * 31 + month * 17 + day * 7) % 64) + 1;
    const upper = Math.floor((hash - 1) / 8) + 1;
    const lower = (hash - 1) % 8 + 1;
    const hexName = HEXNAMES[lang] ? HEXNAMES[lang][upper - 1] : HEXNAMES.zh[upper - 1];
    const hexNameEn = HEXNAMES.en[upper - 1];
    const hexNature = HEXNATURES[lang] ? HEXNATURES[lang][upper - 1] : HEXNATURES.zh[upper - 1];
    const changingLine = ((year + month + day) % 6) + 1;
    const transformedHex = upper === 8 ? 2 : upper + 1;
    const transformedHexName = HEXNAMES[lang] ? HEXNAMES[lang][transformedHex - 1] : HEXNAMES.zh[transformedHex - 1];
    const transformedHexNameEn = HEXNAMES.en[transformedHex - 1];

    // ── 4. 塔罗 ──
    const tarotId = ((year * 13 + month * 3 + day) % 22);
    const tarotReversed = (year + month + day) % 3 === 0;

    // 22张大阿卡纳：id → {name(中), nameEn(英), emoji, meaning(中), meaningEn(英)}
    const TAROT_CARDS = [
      { id:0, emoji:'🃏', name:{zh:'愚人',en:'The Fool',es:'El Loco',fr:'Le Mat',th:'เดอะฟูล',vi:'Kẻ Khờ'}, meaning:{zh:'新的财务冒险即将开始，适合小额试错。',en:'A new financial adventure begins. Calculated risks favor you today.',es:'Nueva aventura financiera — toma riesgos calculados.',fr:'Nouvelle aventure financière — prends des risques calculés.',th:'การเสี่ยงทางการเงินใหม่ — คำนวณความเสี่ยงก่อน',vi:'Cuộc phiêu lưu tài chính mới — tính toán rủi ro trước。'} },
      { id:1, emoji:'🎩', name:{zh:'魔术师',en:'The Magician',es:'El Mago',fr:'Le Bateleur',th:'เดอะเมจิเชี่ยน',vi:'Ảo Thuật Gia'}, meaning:{zh:'你手头资源足以搅动一个项目，直接动手。',en:'Your financial tools are ready. Manifest wealth with focus.',es:'Manifiesta riqueza ahora — tus talentos están listos.',fr:'Manifester la richesse maintenant — vos talents sont prêts.',th:'สร้างความมั่งคั่งตอนนี้ — พรสวรรค์พร้อมแล้ว',vi:'Thể hiện của cải ngay bây giờ — tài năng sẵn sàng。'} },
      { id:2, emoji:'🌙', name:{zh:'女祭司',en:'The High Priestess',es:'La Sacerdotisa',fr:'La Papesse',th:'เดอะไฮพรีสเตส',vi:'Nữ Tư Tế'}, meaning:{zh:'直觉今天比财报准，信任你第六感。',en:'Financial intuition peaks. Trust your money gut today.',es:'Confía en tu intuición financiera — oportunidades ocultas te esperan.',fr:'Faites confiance à votre intuition — des opportunités vous attendent.',th:'ไว้ใจสัญชาตญาณ — โอกาสซ่อนอยู่รอคุณอยู่',vi:'Tin vào trực giác tài chính — cơ hội ẩn đang chờ bạn。'} },
      { id:3, emoji:'👑', name:{zh:'女皇',en:'The Empress',es:'La Emperatriz',fr:'L\'Impératrice',th:'เดอะเอมเพรส',vi:'Nữ Hoàng'}, meaning:{zh:'适合收割之前种下的项目，果实该摘了。',en:'Financial abundance flows. Harvest what you planted.',es:'La abundancia fluye — la riqueza crece con paciencia.',fr:'L\'abondance circule — la richesse grandit avec patience.',th:'เงินไหลมา — ความมั่งคั่งเติบโตด้วยความอดทน',vi:'Cải tạo dồi dào — của cải lớn lên nhờ kiên nhẫn。'} },
      { id:4, emoji:'🏛️', name:{zh:'皇帝',en:'The Emperor',es:'El Emperador',fr:'L\'Empereur',th:'เดอะเอมเพอเรอร์',vi:'Hoàng Đế'}, meaning:{zh:'拍板一个决策，把人管住，钱理清。',en:'Solid financial foundation. Build wealth with clear rules.',es:'Construye estructura de riqueza — base financiera sólida.',fr:'Construire la structure financière — base solide établie.',th:'สร้างโครงสร้างความมั่งคั่ง — ฐานะมั่นคงแล้ว',vi:'Xây dựng cấu trúc tài sản — nền tảng vững chắc rồi。'} },
      { id:5, emoji:'📜', name:{zh:'教皇',en:'The Hierophant',es:'El Papa',fr:'Le Pape',th:'เดอะไฮโรแฟนต์',vi:'Giáo Hoàng'}, meaning:{zh:'找个比你赚得多的人聊，问题可能出在认知圈。',en:'Seek a wealth mentor. Your money path needs guidance.',es:'Riqueza alineada con valores — camino ético claro.',fr:'Richesse alignée avec vos valeurs — chemin éthique clair.',th:'ความมั่งคั่งสอดคล้องค่านิยม — ทางที่ถูกต้องชัดเจน',vi:'Củả phù hợp giá trị — con đường kiếm tiền đạo đức rõ ràng。'} },
      { id:6, emoji:'💞', name:{zh:'恋人',en:'The Lovers',es:'Los Enamorados',fr:'Les Amoureux',th:'เดอะเลิฟเวอร์ส',vi:'Tình Nhân'}, meaning:{zh:'跟钱有关的选择，选让你心跳加速的那条。',en:'Financial choice point. Follow your money heart.',es:'Punto de decisión financiera — sigue tu corazón.',fr:'Point de choix financier — suivez votre cœur.',th:'จุดตัดสินใจเรื่องเงิน — ทำตามหัวใจ',vi:'Điểm quyết định tài chính — theo trái tim tài chính của bạn。'} },
      { id:7, emoji:'🏇', name:{zh:'战车',en:'The Chariot',es:'El Carro',fr:'Le Chariot',th:'เดอะแชริออต',vi:'Chiến Xe'}, meaning:{zh:'全速推进，犹豫一秒都是对财运的不尊重。',en:'Unstoppable financial momentum. Execute with confidence.',es:'El carro de la riqueza avanza — la acción decisiva gana.',fr:'Le char de la richesse avance — l\'action déterminée gagne.',th:'รถม้าความมั่งคั่งวิ่ง — ความมุ่งมั่นชนะ',vi:'Xe tài chính tiến — hành động kiên quyết thắng。'} },
      { id:8, emoji:'🦁', name:{zh:'力量',en:'Strength',es:'La Fuerza',fr:'La Force',th:'สเตรงธ์',vi:'Sức Mạnh'}, meaning:{zh:'今天要么搞定那笔钱，要么搞定那个不敢谈价的人。',en:'Inner financial power. Gentle wealth strength awakens.',es:'Fortaleza financiera interior — poder gentil despierta.',fr:'Force financière intérieure — pouvoir doux s\'éveille.',th:'พลังการเงินภายใน — พลังอ่อนโยนตื่น',vi:'Sức mạnh tài chính bên trong — năng lượng dịu dàng thức tỉnh。'} },
      { id:9, emoji:'🏮', name:{zh:'隐士',en:'The Hermit',es:'El Ermitaño',fr:'L\'Ermite',th:'เดอะเฮอร์มิต',vi:'Ẩn Sĩ'}, meaning:{zh:'关掉消息提醒，花30分钟盘你的财务底牌。',en:'Financial wisdom within. Solitude brings money insights.',es:'Sabiduría financiera interior — la soledad trae perspectivas.',fr:'Sagesse financière intérieure — la solitude apporte des perspectives.',th:'ปัญญาความมั่งคั่งภายใน — ความสันโดษให้มุมมองใหม่',vi:'Trí tuệ giàu có bên trong — một mình mang lại góc nhìn mới。'} },
      { id:10, emoji:'🎡', name:{zh:'命运之轮',en:'Wheel of Fortune',es:'La Rueda de la Fortuna',fr:'La Roue de Fortune',th:'วีลออฟฟอร์จูน',vi:'Bánh Xe Số Phận'}, meaning:{zh:'你的财运拐点到了，今天必须做一次主动出击。',en:'Financial cycle turning. Fortune favors bold money moves.',es:'El ciclo de riqueza gira — la fortuna favorece movimientos audaces.',fr:'Le cycle de richesse tourne — la fortune favorise les audacieux.',th:'วงจรความมั่งคั่งหมุน — โชคสนับสนุนผู้กล้า',vi:'Chu kỳ giàu có quay — vận may ủng hộ người dám làm。'} },
      { id:11, emoji:'⚖️', name:{zh:'正义',en:'Justice',es:'La Justicia',fr:'La Justice',th:'จัสติซ',vi:'Công Lý'}, meaning:{zh:'做一件正确但难开口的事，跟合伙人谈分成。',en:'Financial karma balancing. Money justice arrives.',es:'Justicia financiera — el karma del dinero se equilibra.',fr:'Justice financière — le karma de l\'argent s\'équilibre.',th:'ความยุติธรรมทางการเงิน — กรรมเงินสมดุล',vi:'Công lý tài chính — nghiệp tiền cân bằng hoàn hảo。'} },
      { id:12, emoji:'🙃', name:{zh:'倒吊人',en:'The Hanged Man',es:'El Colgado',fr:'Le Pendu',th:'เดอะแฮงค์แมน',vi:'Ngước Treo'}, meaning:{zh:'停下来的勇气比冲的勇气值钱。',en:'Financial perspective shift. New money vision needed.',es:'Cambio de perspectiva financiera — nueva visión del dinero.',fr:'Changement de perspective — nouvelle vision nécessaire.',th:'มุมมองทางการเงินเปลี่ยน — ต้องการวิสัยทัศน์ใหม่',vi:'Góc nhìn tài chính chuyển đổi — cần tầm nhìn mới về tiền。'} },
      { id:13, emoji:'💀', name:{zh:'死神',en:'Death',es:'La Muerte',fr:'La Mort',th:'เดธ',vi:'Cái Chết'}, meaning:{zh:'清理一个拖你后腿的财务包袱，结束才有新生。',en:'Financial transformation. Old you dies, new emerges.',es:'Transformación de riqueza — el viejo tú financiero muere.',fr:'Transformation financière — le vieil vous meurt.',th:'การเปลี่ยนแปลงความมั่งคั่ง — ตายแล้วเกิดใหม่',vi:'Chuyển đổi giàu có — người tài chính cũ chết, người mới ra đời。'} },
      { id:14, emoji:'🍷', name:{zh:'节制',en:'Temperance',es:'La Templanza',fr:'La Tempérance',th:'เทมเปอแรนซ์',vi:'Điều Độ'}, meaning:{zh:'今天最适合做资产配置的一步调整。',en:'Financial balance. Moderate money approach wins.',es:'Equilibrio financiero — la moderación gana.',fr:'Équilibre financier — la modération gagne.',th:'สมดุลความมั่งคั่ง — ทางเลือกปานกลางชนะ',vi:'Cân bằng giàu có — chiến lược tiền bạc vừa phải thắng。'} },
      { id:15, emoji:'😈', name:{zh:'恶魔',en:'The Devil',es:'El Diablo',fr:'Le Diable',th:'เดอะเดวิล',vi:'Ác Ma'}, meaning:{zh:'直视你最上瘾的那笔消费或投资。',en:'Financial shadow work. Face money demons to win.',es:'Trabajo con la sombra financiera — enfrenta tus demonios.',fr:'Travail sur l\'ombre — affrontez vos démons.',th:'ทำงานกับเงาทางการเงิน — เผชิญปีศาจเงิน',vi:'Làm việc với bóng tối tài chính — đối mặt quỷ tiền bạc để thắng。'} },
      { id:16, emoji:'🗼', name:{zh:'高塔',en:'The Tower',es:'La Torre',fr:'La Maison Dieu',th:'เดอะทาวเวอร์',vi:'Tháp Đổ'}, meaning:{zh:'打破一个旧的收入结构，制造一次主动破坏。',en:'Financial breakthrough. Sudden money shift incoming.',es:'Quiebre financiero — cambio repentino de dinero.',fr:'Percée financière — changement soudain.',th:'การทะลุทางการเงิน — เงินเปลี่ยนทิศฉับพลัน',vi:'Đột phá tài chính — chuyển đổi tiền bạc đột ngột。'} },
      { id:17, emoji:'⭐', name:{zh:'星星',en:'The Star',es:'La Estrella',fr:'L\'Étoile',th:'เดอะสตาร์',vi:'Ngôi Sao'}, meaning:{zh:'今天适合定下一个长期目标。',en:'Financial hope returns. Wealth star guides your journey.',es:'La estrella financiera guía — la esperanza regresa.',fr:'L\'étoile financière guide — l\'espoir revient.',th:'ดาวนำทางความมั่งคั่ง — ความหวังกลับมา',vi:'Ngôi sao dẫn đường giàu có — hy vọng quay lại。'} },
      { id:18, emoji:'🌕', name:{zh:'月亮',en:'The Moon',es:'La Luna',fr:'La Lune',th:'เดอะมูน',vi:'Mặt Trăng'}, meaning:{zh:'赚钱机会藏在模糊信息里。',en:'Financial intuition peaks. Lunar money magic works.',es:'Intuición financiera en su punto máximo — magia lunar.',fr:'Intuition financière à son apogée — magie lunaire.',th:'สัญชาตญาณทางการเงินสูงสุด — เวทมนตร์จันทรคติ',vi:'Trực giác tài chính đạt đỉnh — phép thuật trăng tròn。'} },
      { id:19, emoji:'☀️', name:{zh:'太阳',en:'The Sun',es:'El Sol',fr:'Le Soleil',th:'เดอะซัน',vi:'Mặt Trời'}, meaning:{zh:'今天是亮牌日，把价值show出来。',en:'Financial success bright ahead. Wealth sunshine blesses you.',es:'El sol financiero brilla — éxito brillante adelante.',fr:'Le soleil financier brille — succès brillant devant.',th:'ดวงอาทิตย์ทางการเงินส่อง — ความสำเร็จรุ่งโรจน์',vi:'Ánh dương tài chính chiếu sáng — thành công rực rỡ phía trước。'} },
      { id:20, emoji:'📯', name:{zh:'审判',en:'Judgement',es:'El Juicio',fr:'Le Jugement',th:'จัดเมนต์',vi:'Phán Xét'}, meaning:{zh:'复盘一次过去的财务失误。',en:'Financial rebirth. Wealth calling heard.',es:'El llamado de la riqueza es escuchado — renacimiento.',fr:'L\'appel de la richesse entendu — renaissance.',th:'เสียงเรียกความมั่งคั่งดังแล้ว — การเกิดใหม่ใกล้',vi:'Tiếng gọi giàu có được nghe — tái sinh đang đến gần。'} },
      { id:21, emoji:'🌍', name:{zh:'世界',en:'The World',es:'El Mundo',fr:'Le Monde',th:'เดอะเวิร์ลด์',vi:'Thế Giới'}, meaning:{zh:'一个财务周期结束了，今天奖励自己。',en:'Financial cycle complete. Wealth world transforms.',es:'Ciclo financiero completo — transformación total.',fr:'Cycle financier complet — transformation mondiale.',th:'วงจรความมั่งคั่งสมบูรณ์ — โลกการเงินเปลี่ยน',vi:'Chu kỳ giàu có hoàn tất — thế giới tài chính chuyển đổi。'} }
    ];
    const card = TAROT_CARDS[tarotId];
    const cardMeaning = (card.meaning[lang] || card.meaning.en);
    const cardName = (card.name[lang] || card.name.en);

    const result = {
      success: true,
      birthDate, lang,
      score,
      cached: false,
      message: lang === 'zh' ? '财富格局已生成' : 'Wealth pattern generated',
      data: {
        bazi: {
          sizhu: {
            yearPillar: `${yTGDisplay}${yDZDisplay}`,
            monthPillar: `${mTGDisplay}${mDZDisplay}`,
            dayPillar: `${dTGDisplay}${dDZDisplay}`,
            dayMaster: dTGDisplay,
            dayMasterWuxing: dayMasterEl
          },
          wuxing
        },
        zodiac: { sunSign, sunSignEn, sunSignElement, sunSignMode, sunSignRuler },
        iching: { hexName, hexNameEn, hexNum: hash, hexNature, changingLine, transformedHexName, transformedHexNameEn },
        tarot: {
          id: tarotId,
          name: cardName,
          nameEn: card.name.en,
          emoji: card.emoji,
          meaning: cardMeaning,
          orientation: tarotReversed ? 'Reversed' : 'Upright'
        }
      }
    };
    // ── 报告生成（月报/年报）──
    const { reportType, includeInsight } = req.body || {};
    if (reportType === 'monthly' || reportType === 'yearly') {
      try {
        console.log('[Wealth Oracle] Generating report:', { birthDate, lang, reportType });
        const prompt = buildWealthReportPrompt(birthDate, lang, reportType, {
          dayMaster: dTGDisplay,
          wuxing,
          sunSign,
          hexName,
          cardName,
        });
        
        if (!prompt) {
          return res.status(400).json({ success: false, error: 'Invalid reportType' });
        }

        const aiResult = await callAI(prompt.system, prompt.user, process.env);
        
        // Parse AI result
        let reportContent = aiResult;
        if (reportType === 'monthly') {
          // Try to parse as JSON, if fails return as markdown
          try {
            const parsed = JSON.parse(aiResult);
            reportContent = JSON.stringify(parsed); // Send JSON to frontend
          } catch (e) {
            // Not JSON, treat as markdown
            reportContent = aiResult;
          }
        }
        
        console.log('[Wealth Oracle] Report generated successfully, length:', aiResult.length);
        return res.json({ ...result, report: reportContent, insight: '' });
      } catch (aiError) {
        console.error('[Wealth Oracle] AI generation failed:', aiError.message);
        return res.status(500).json({ success: false, error: 'AI generation failed: ' + aiError.message });
      }
    }

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
    
    // ── 月报/年报生成（AI 调用）──
    if (reportType === 'monthly' || reportType === 'yearly') {
      try {
        console.log('[AI Advisor] Generating report:', { d1, d2, lang, reportType });
        const prompt = buildCompatibilityReportPrompt(d1, d2, lang, reportType);
        
        const insight = await callAI(
          `You are a relationship astrologer generating a ${reportType} report.`,
          prompt,
          process.env
        );
        
        console.log('[AI Advisor] Report generated, length:', insight.length);
        return res.json({ insight, cached: false });
      } catch (aiError) {
        console.error('[AI Advisor] AI generation failed:', aiError.message);
        return res.status(500).json({ error: 'AI generation failed: ' + aiError.message });
      }
    }
    
    // ── 普通合盘洞察（旧逻辑）──
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

    const LANG_NAME = {zh:'中文',en:'English',es:'Español',fr:'Français',th:'ภาษาไทย',vi:'Tiếng Việt'};
    const prompt = reportType === 'compatibility'
      ? `分析 ${d1} 和 ${d2} 的命理合盘。必须用 ${LANG_NAME[lang]||'Tiếng Việt'} 输出，温暖、积极的情感解读，禁止输出其他语言，禁止重复塔罗牌名称。数据：${JSON.stringify({d1,d2})}`
      : `分析 ${d1} 的财富格局。必须用 ${LANG_NAME[lang]||'English'} 输出，专业的财富建议，禁止输出其他语言，禁止重复塔罗牌名称。数据：${JSON.stringify({d1,lang})}`

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
