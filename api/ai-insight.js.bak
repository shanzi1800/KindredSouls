// Force Node.js 20 runtime (avoid Edge crypto issue)
export const runtime = 'nodejs20.x';

// Node 18+ has native fetch, no need for node-fetch

const { createClient } = require('@supabase/supabase-js');

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('[ai-insight] supabase init:', {
  url: supabaseUrl?.substring(0, 40),
  keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : process.env.SUPABASE_SERVICE_KEY ? 'SERVICE_KEY' : 'VITE',
  keyPrefix: supabaseKey?.substring(0, 20)
});

// ── In-memory cache ──
const insightCache = new Map();
const MAX_CACHE = 200;

function cacheKey(d1, d2, overall, dims, lang) {
  return `${d1}|${d2}|${overall}|${JSON.stringify(dims)}|${lang}`;
}

// ── Build prompt ──
function buildPrompt({ d1, d2, overall, dims, bazi, zodiac, iching }, lang = 'en') {
  const isZh = lang === 'zh';
  const isFr = lang === 'fr';
  const isEs = lang === 'es';
  const isTh = lang === 'th';
  const isVi = lang === 'vi';

  // ── Build user prompt from actual calculation data ──
  let userPrompt = '';
  if (bazi || zodiac || iching) {
    userPrompt = `Compatibility data:\n`;
    if (d1 && d2) userPrompt += `Person 1 birthday: ${d1}, Person 2 birthday: ${d2}\n`;
    if (overall) userPrompt += `Overall score: ${overall}\n`;
    if (dims) userPrompt += `Dimension scores: Love=${dims.love}, Communication=${dims.communication}, Chemistry=${dims.chemistry}, Stability=${dims.stability}\n`;
    if (bazi) userPrompt += `Bazi analysis: ${JSON.stringify(bazi)}\n`;
    if (zodiac) userPrompt += `Zodiac analysis: ${JSON.stringify(zodiac)}\n`;
    if (iching) userPrompt += `I Ching reading: ${JSON.stringify(iching)}\n`;
  }

  const systemPrompt = isZh
    ? '你是 KindredSouls 的 AI 情感顾问。用户输入了一对情侣的命理数据，请用温暖，专业、积极的语气，给出 3–5 句话的关系洞察。只用中文输出。不要预测分手或负面结局，始终给予希望和具体行动建议。\n【重要】你必须严格遵守以下规则：\n1. 只用中文回答，不得混用任何其他语言（包括英语）。\n2. 绝对不要自创或提及任何塔罗牌名称、星座名称或命理系统，除非数据中明确提供。\n3. 只基于数据中给出的信息进行解读，不要编造额外内容。'
    : isFr
    ? "Tu es le conseiller sentimental IA de KindredSouls. Bas\u00e9 sur les donn\u00e9es de compatibilit\u00e9 d'un couple, donne 3\u20135 phrases d'insight chaleureux, professionnelles et positives.\nR\u00c8GLES ABSOLUES :\n- R\u00e9ponds UNIQUEMENT en fran\u00e7ais. JAMAIS en anglais ou dans une autre langue. Interdiction absolue d'utiliser des mots anglais ou des anglicismes.\n- N'invente PAS de nom de carte de tarot, signe du zodiaque ou syst\u00e8me divinatoire non pr\u00e9sent dans les donn\u00e9es.\n- Base-toi UNIQUEMENT sur les informations fournies. Ne jamais pr\u00e9dire de rupture. Toujours donner de l'espoir et des conseils pratiques.\n- Interdiction absolue d'utiliser le pronom neutre 'iel'. Utilise uniquement les structures fran\u00e7aises traditionnelles ou des termes \u00e9l\u00e9gants comme 'ton partenaire', 'l'autre', 'votre moiti\u00e9' pour d\u00e9signer le partenaire."
    : isEs
    ? 'Eres el consejero sentimental IA de KindredSouls. Basado en los datos de compatibilidad de una pareja, da 3\u20135 frases de insight c\u00e1lido, profesional y positivo. Tono: astro-bestie / amiga \u00edntima \u2014 usa linda, hermosa, chica para dirigirte a la usuaria.\nREGLAS ABSOLUTAS :\n- Responde \u00daNICAMENTE en espa\u00f1ol. NUNCA en ingl\u00e9s u otro idioma.\n- NO inventes nombres de cartas de tarot, signos del zodiaco o sistemas de adivinaci\u00f3n no presentes en los datos.\n- Basa tu respuesta ESTRICTAMENTE en la informaci\u00f3n proporcionada. Nunca predigas ruptura. Siempre da esperanza y consejos pr\u00e1cticos.'
    : isTh
    ? `คุณเป็นที่ปร\u0e3eษาความสัมพันธ์ AI ของ KindredSouls ให้คำแนะนำความสัมพันธ์อบอุ่น มืออาชีพ และเปี่ยมไปด้วยแง่บวก 3\u20135 ประโยค โดยสรุปผลจากข้อมูลที่ให้มาอย่างสวยงามและเป็นธรรมชาติ
โทนเสียง: นักโหราศาสตร์มืออาชีพใน Instagram ระดับกรุงเทพฯ ที่มีความรู้สึกและใส่ใจ ใช้คำลงท้ายค่ะ/นะคะเพื่อสร้างบรรยากาศอบอุ่น
กฎเด็ดขาด :\n- ตอบเป็นภาษาไทยเท่านั้น ห้ามตอบเป็นภาษาอังกฤษ จีน หรือภาษาอื่นเด็ดขาด ห้ามใช้อักขระจีนหรือคันจิภายใต้ทุกสถานการณ์\n- ห้ามแต่งข้อความเกี่ยวกับไพ่ทาโรต์ ราศี หรือระบบพยากรณ์ใดๆ ที่ไม่มีในข้อมูลที่ให้มา\n- ใช้ข้อมูลที่ได้รับเท่านั้น อย่าคิดขึ้นเอง เสมอให้ความหวังและคำแนะนำที่ทำได้จริง อย่าพยากรณ์การเลิกรา\n- ห้ามใช้สัญลักษณ์ฯ หลังชื่อดาวเคราะห์ เขียน ดาวพฤหัส และ ดาวศุกร์ โดยตรง\n- เรียบเรียงเป็นย่อหน้าเดียวต่อเนื่อง สลับเรื่อง Bazi → ราศี → แผนภูมิไหวพราย อย่าเขียนเป็นรายการหรือตัวเลข\n- ใช้คำศัพท์มาตรฐาน: ธาตุดิน/ธาตุน้ำ/ธาตุไฟ/ธาตุไม้/ธาตุโลหะ, ช่วยเลี้ยงดู, รากฐานมั่นคง, ความเข้าใจกัน, เคมีที่ลงตัว
- ห้ามใช้เครื่องหมายวรรคตอนภาษาจีนแบบเต็ม เช่น ，หรือ。 ใช้เว้นวรรคและจุดภาษาอังกฤษปกติ
- นำเสนอความแตกต่างหรือความขัดแย้งเป็นพื้นที่แห่งการเติบโตและเรียนรู้ร่วมกัน ไม่ใช่อุปสรรค
- ห้ามกล่าวถึงไพ่ทาโรต์ใดๆ ไม่ว่ากรณีใด อย่าลงท้ายด้วยคำแนะนำจากไพ่เด็ดขาด`
    : isVi
    ? 'Bạn l\u00e0 c\u1ed1 v\u1ea5n t\u00ecnh c\u1ea3m AI c\u1ee7a KindredSouls. D\u1ef1a tr\u00ean d\u1eef li\u1ec7u t\u01b0\u01a1ng h\u1ee3p c\u1ee7a m\u1ed9t c\u1eb7p \u0111\u00f4i, \u0111\u01b0a ra 3\u20135 c\u00e2u th\u1ea5u hi\u1ec3u v\u1ec1 m\u1ed1i quan h\u1ec7 \u1ea5m \u00e1p, chuy\u00ean nghi\u1ec7p v\u00e0 t\u00edch c\u1ef1c.\nQUY T\u1eacC TUY\u1ec6T \u0110\u1ed0I :\n- Ch\u1ec9 tr\u1ea3 l\u1eddi b\u1eb1ng ti\u1ebfng Vi\u1ec7t. TUY\u1ec6T \u0110\u1ed0I kh\u00f4ng d\u00f9ng ti\u1ebfng Anh hay ng\u00f4n ng\u1eef kh\u00e1c.\n- KH\u00d4NG \u0111\u01b0\u1ee3c b\u1ecba \u0111\u1eb7t t\u00ean l\u00e1 b\u00e0i Tarot, cung ho\u00e0ng \u0111\u1ea1o hay h\u1ec7 th\u1ed1ng b\u00f3i to\u00e1n n\u00e0o kh\u00f4ng c\u00f3 trong d\u1eef li\u1ec7u.\n- Ch\u1ec9 d\u1ef1a v\u00e0o th\u00f4ng tin \u0111\u01b0\u1ee3c cung c\u1ea5p. Kh\u00f4ng bao gi\u1edd \u0111o\u00e1n tr\u01b0\u1edbc chia tay. Lu\u00f4n mang l\u1ea1i hy v\u1ecdng v\u00e0 l\u1eddi khuy\u00ean c\u1ee5 th\u1ec3.\n- S\u1eed d\u1ee5ng Bạn v\u00e0 Người ấy / \u0110\u1ed1i ph\u01b0\u01a1ng \u0111\u1ec3 g\u1ecdi c\u00e1c b\u00ean, ho\u1eb7c C\u1eadu - T\u1edb (gi\u1ecdcng v\u0103n tr\u01b0\u1eddng h\u1ecdc th\u01b0 gi\u00e3n). TUY\u1ec6T \u0110\u1ed0I kh\u00f4ng d\u00f9ng Em - Anh v\u00ec n\u00f3 mang h\u1ec7 quy chi\u1ebfu d\u01b0\u01a1ng t\u00ednh c\u1ed1 \u0111\u1ecbnh.'
    : 'You are the AI relationship advisor for KindredSouls. Based on the user input (a couple compatibility data), give 3\u20135 sentences of warm, professional, and positive relationship insight. Tone: astro-bestie / close girlfriend \u2014 use babe, girl, bestie naturally.\nABSOLUTE RULES :\n- Only respond in English. Never mix in Chinese, Thai, Vietnamese, French, Spanish or any other language.\n- Do NOT invent or mention any Tarot card names, symbols, zodiac signs, or divination systems not present in the input data.\n- Base your response STRICTLY on the information provided. Never predict breakups. Always give hope and specific actionable advice.';



  return { systemPrompt, userPrompt };
}

export default async function handler(req, res) {
  console.log('[ai-insight] === FUNCTION CALLED ===', { method: req.method, hasAuth: !!req.headers.authorization });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth check ──
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }
  const token = authHeader.slice(7);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check paid status
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('paid, user_id')
    .eq('user_id', user.id)
    .limit(1);

  console.log('[ai-insight] check paid:', { userId: user.id, profile, profileError });

  const isPaid = profile?.[0]?.paid === true;
  console.log('[ai-insight] paid check:', { userId: user.id, isPaid, profile });
  // TEMP: skip paid check for testing
  // if (!isPaid) {
  //   return res.status(402).json({ error: 'Payment required to unlock AI insight', debug: { userId: user.id, profileRows: profile?.length || 0, profileError: profileError?.message } });
  // }

  const { d1, d2, overall, dims, bazi, zodiac, iching, lang = 'en' } = req.body;
  if (!d1 || !d2 || !dims) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DeepSeek API key not configured' });
  }

  const key = cacheKey(d1, d2, overall, dims, lang);
  if (insightCache.has(key)) {
    return res.status(200).json({ insight: insightCache.get(key), cached: true });
  }

  const { systemPrompt, userPrompt } = buildPrompt(
    { d1, d2, overall, dims, bazi, zodiac, iching },
    lang
  );

  try {
    const response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim();
    if (!insight) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    const clean = insight
      .replace(/[\u2640-\u26FF]/g, '')
      .replace(/[\u2700-\u27BF]/g, '')
      .replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, '')
      .replace(/【คำแนะนำจากไพ่ทาโรต์】[\s\S]*$/g, '')  // Remove AI-hallucinated tarot in Thai
      .replace(/【Recommendation from Tarot】[\s\S]*$/g, '')  // Remove AI-hallucinated tarot in English
      .replace(/【คำแนะนำจากไพ่ทาโรต์】/g, '');

    if (insightCache.size >= MAX_CACHE) {
      const firstKey = insightCache.keys().next().value;
      insightCache.delete(firstKey);
    }
    insightCache.set(key, clean);

    return res.status(200).json({ insight: clean, cached: false });
  } catch (err) {
    console.error('ai-insight handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
