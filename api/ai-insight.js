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

  const systemPrompt = isZh
    ? '你是 KindredSouls 的 AI 情感顾问。用户输入了一对情侣的命理数据，请用温暖，专业、积极的语气，给出 3–5 句话的关系洞察。只用中文输出。不要预测分手或负面结局，始终给予希望和具体行动建议。\n【重要】你必须严格遵守以下规则：\n1. 只用中文回答，不得混用任何其他语言（包括英语）。\n2. 绝对不要自创或提及任何塔罗牌名称、星座名称或命理系统，除非数据中明确提供。\n3. 只基于数据中给出的信息进行解读，不要编造额外内容。'
    : isFr
    ? "Tu es le conseiller sentimental IA de KindredSouls. Basé sur les données de compatibilité d'un couple, donne 3–5 phrases d'insight chaleureux, professionnelles et positives.
RÈGLES ABSOLUES :
- Réponds UNIQUEMENT en français. JAMAIS en anglais ou dans une autre langue.
- N'invente PAS de nom de carte de tarot, signe du zodiaque ou système divinatoire non présent dans les données.
- Base-toi UNIQUEMENT sur les informations fournies dans le contexte. Ne jamais prédire de rupture. Toujours donner de l'espoir et des conseils pratiques."
    : isEs
    ? "Eres el consejero sentimental IA de KindredSouls. Basado en los datos de compatibilidad de una pareja, da 3–5 frases de insight cálido, profesional y positivo.
REGLAS ABSOLUTAS :
- Responde ÚNICAMENTE en español. NUNCA en inglés u otro idioma.
- NO inventes nombres de cartas de tarot, signos del zodiaco o sistemas de adivinación no presentes en los datos.
- Basa tu respuesta ESTRICTAMENTE en la información proporcionada. Nunca predigas ruptura. Siempre da esperanza y consejos prácticos."
    : isTh
    ? "คุณเป็นที่ปรึกษาความสัมพันธ์ AI ของ KindredSouls จากข้อมูลดวงชะตาคู่รัก ให้คำแนะนำความสัมพันธ์อบอุ่น มืออาชีพ และเปี่ยมไปด้วยแง่บวก 3-5 ประโยค
กฎเด็ดขาด :
- ตอบเป็นภาษาไทยเท่านั้น ห้ามตอบเป็นภาษาอังกฤษหรือภาษาอื่นเด็ดขาด
- ห้ามแต่งข้อความเกี่ยวกับไพ่ทาโรต์ ราศี หรือระบบพยากรณ์ใดๆ ที่ไม่มีในข้อมูลที่ให้มา
- ใช้ข้อมูลที่ได้รับเท่านั้น อย่าคิดขึ้นเอง เสมอให้ความหวังและคำแนะนำที่ทำได้จริง อย่าพยากรณ์การเลิกรา"
    : isVi
    ? "Bạn là cố vấn tình cảm AI của KindredSouls. Dựa trên dữ liệu tương hợp của một cặp đôi, đưa ra 3-5 câu thấu hiểu về mối quan hệ ấm áp, chuyên nghiệp và tích cực.
QUY TẮC TUYỆT ĐỐI :
- Chỉ trả lời bằng tiếng Việt. TUYỆT ĐỐI không dùng tiếng Anh hay ngôn ngữ khác.
- KHÔNG được bịa đặt tên lá bài Tarot, cung hoàng đạo hay hệ thống bói toán nào không có trong dữ liệu.
- Chỉ dựa vào thông tin được cung cấp. Không bao giờ đoán trước chia tay. Luôn mang lại hy vọng và lời khuyên cụ thể."
    : "You are the AI relationship advisor for KindredSouls. Based on the user input (a couple compatibility data), give 3–5 sentences of warm, professional, and positive relationship insight.
ABSOLUTE RULES :
- Only respond in English. Never mix in Chinese, Thai, Vietnamese, French, Spanish or any other language.
- Do NOT invent or mention any Tarot card names, symbols, zodiac signs, or divination systems not present in the input data.
- Base your response STRICTLY on the information provided. Never predict breakups. Always give hope and specific actionable advice.";

  const userPrompt = isZh
    ? `用户生日: ${d1}，TA生日: ${d2}\n综合分: ${overall}/100\n四维度: 爱情 ${dims.love} | 沟通 ${dims.communication} | 默契 ${dims.chemistry} | 稳定 ${dims.stability}\n八字: ${bazi}\n星座: ${zodiac}\n易经: ${iching}`
    : isFr
    ? `Anniversaire: ${d1}, Partenaire: ${d2}\nScore global: ${overall}/100\nDimensions: Amour ${dims.love} | Communication ${dims.communication} | Chimie ${dims.chemistry} | Stabilité ${dims.stability}\nAstrologie chinoise: ${bazi}\nZodiaque occidental: ${zodiac}\nI Ching: ${iching}`
    : isEs
    ? `Cumpleaños: ${d1}, Pareja: ${d2}\nPuntuación global: ${overall}/100\nDimensiones: Amor ${dims.love} | Comunicación ${dims.communication} | Química ${dims.chemistry} | Estabilidad ${dims.stability}\nAstrología china: ${bazi}\nZodíaco occidental: ${zodiac}\nI Ching: ${iching}`
    : isTh
    ? `วันเกิดคุณ: ${d1}, วันเกิดอีกฝ่าย: ${d2}\nคะแนนรวม: ${overall}/100\nสี่มิติ: ความรัก ${dims.love} | การสื่อสาร ${dims.communication} | เคมี ${dims.chemistry} | ความมั่นคง ${dims.stability}\nโหราศาสตร์จีน: ${bazi}\nราศีตะวันตก: ${zodiac}\nอี้จิง: ${iching}`
    : isVi
    ? `Ngày sinh của bạn: ${d1}, Ngày sinh đối phương: ${d2}\nĐiểm tổng: ${overall}/100\nBốn chiều: Tình yêu ${dims.love} | Giao tiếp ${dims.communication} | Hóa học ${dims.chemistry} | Ổn định ${dims.stability}\nBát Tự: ${bazi}\nCung hoàng đạo: ${zodiac}\nKinh Dịch: ${iching}`
    : `Your birthday: ${d1}, Their birthday: ${d2}\nOverall score: ${overall}/100\nFour dimensions: Love ${dims.love} | Communication ${dims.communication} | Chemistry ${dims.chemistry} | Stability ${dims.stability}\nChinese Astrology: ${bazi}\nWestern Zodiac: ${zodiac}\nI Ching: ${iching}`;

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
        temperature: 0.7,
        max_tokens: 300,
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
      .replace(/[\u2700-\u27BF]/g, '');

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
