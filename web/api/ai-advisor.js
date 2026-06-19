export const runtime = 'nodejs';

// ============================================================
// KindredSouls AI Advisor — "填空打字员"架构 (军师架构 + 牛牛工程修复)
// 版本: V7 (Gemini 1.5 Flash + 军师模板硬锁 + 6语言全覆盖)
// ============================================================

// 1. 通用多语言分数截获正则
function extractScore(text) {
  if (!text || typeof text !== 'string') return 70;
  const match = text.match(/(\d+)\s*\/\s*100/);
  if (match) {
    const score = parseInt(match[1], 10);
    return isNaN(score) ? 70 : score;
  }
  return 70;
}

// 2. Vercel Serverless 异步 Body 解析 Fallback
async function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
}

// 3. 全量6语言系统指令 + 参数化命题模板矩阵
const LANGUAGE_CONFIGS = {
  th: {
    systemPrompt: "คุณเป็นปรมาจารย์ด้านโหราศาสตร์ระดับสูงที่มีความเชี่ยวชาญในระบบ Bazi, โหราศาสตร์ตะวันตก, และคัมภีร์อี้จิง หน้าที่ของคุณคือนำข้อมูลและคะแนนที่กำหนดให้ด้านล่าง มาเขียนบทสรุปวิเคราะห์เชิงลึก (AI วิเคราะห์) ความยาว 300-500 คำ โดยห้ามเปลี่ยนตัวเลขหรือคะแนนใดๆ ทั้งสิ้น ห้ามพร่ำเพ้อพรรณนาซ้ำซาก ให้เน้นการตีความทางจิตวิญญาณและคำแนะนำที่เป็นรูปธรรมเพื่อทลายกรรมที่ติดขัด",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => `
[ข้อมูลบังคับที่ต้องใช้ในการร้อยเรียง]
- คะแนนรวมภายนอก (Overall Score): ${overall}/100
- คะแนนบาซี (Bazi Score): ${baziScore}/100
- คะแนนราศี (Zodiac Score): ${zodiacScore}/100
- คะแนนอี้จิง (I Ching Score): ${ichingScore}/100
- ไพ่ทาโรต์ (Tarot): ${tarot?.name || ''} (${tarot?.orientation === 'Reversed' ? 'กลับด้าน / Reversed' : 'ตั้งตรง / Upright'})
- ความหมายไพ่เชิงลึก: ${tarot?.meaning || ''}

[คำสั่งควบคุมขั้นเด็ดขาด]
จงเขียนข้อความในส่วน "4、✨ วิเคราะห์ AI" โดยอธิบายเหตุผลอย่างมีตรรกะว่าทำไมตัวเลขทั้ง 4 ชุดนี้ถึงเชื่อมโยงกันอย่างเป็นระบบ และจงประสานพลังงานที่ขัดแย้งระหว่างคะแนนอี้จิงและไพ่ทาโรต์ให้เป็นเนื้อเรื่องเดียวกัน ห้ามสรุปคะแนนใหม่ ห้ามทิ้งคำแนะนำเชิงจิตวิญญาณ และต้องปิดท้ายด้วย Emoji สามตัวนี้เสมอ: 🌿 ✨ 🔮

[รูปแบบผลลัพธ์ที่คุณต้องกรอกข้อความขยายความ]
4、✨ วิเคราะห์ AI
ภายใต้ผืนฟ้าแห่งโชคชะตา คะแนนความเข้ากันได้โดยรวมที่ **${overall} คะแนน** คือ... [โปรดเขียนบทวิเคราะห์ความยาว 300-500 คำขยายความจากตรงนี้ โดยใช้ข้อมูลคะแนนบาซี ${baziScore} คะแนน, ราศี ${zodiacScore} คะแนน, และอี้จิง ${ichingScore} คะแนน รวมถึงความหมายของไพ่ ${tarot?.name || ''} (${tarot?.orientation || ''}) มาร้อยเรียงให้สมบูรณ์แบบ] 🌿 ✨ 🔮
`
  },
  zh: {
    systemPrompt: "你是一位精通八字、占星与易经的天级命理导师。请结合给定的分数和塔罗牌意，撰写一段300-500字的核心灵魂解读大作文。不可篡改任何既定分数，着重逻辑缝合与心灵指引。严禁使用'各位用户'等机械开场白，必须直接以诗意意象或灵魂洞见开篇。",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => `
[强制数据锁] 综合评分 = ${overall}/100, 八字 = ${baziScore}/100, 星座 = ${zodiacScore}/100, 易经 = ${ichingScore}/100
- 塔罗牌: ${tarot?.name || ''} (${tarot?.orientation === 'Reversed' ? '逆位' : '正位'})
- 牌意内核: ${tarot?.meaning || ''}

[输出格式约束]
4、✨ AI 洞察
在命运的星空下，你们的综合评分 **${overall} 分** 是... [请在此处续写300-500字的灵魂大作文，深度融合八字 ${baziScore}分、星座 ${zodiacScore}分、易经 ${ichingScore}分与塔罗牌 ${tarot?.name || ''} 的挣扎与解法。必须提到全部四个分数。] 🌿 ✨ 🔮
`
  },
  vi: {
    systemPrompt: "Bạn là một bậc thầy chiêm tinh học cấp cao. Hãy kết hợp số điểm và ý nghĩa bài Tarot dưới đây để viết một bài luận phân tích sâu từ 300-500 từ. Không được thay đổi bất kỳ con số nào. TUYỆT ĐỐI KHÔNG được mở đầu bằng các khuôn mẫu cứng nhắc. Hãy bắt đầu TRỰC TIẾP bằng hình ảnh thi ca.",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => `
[Khóa dữ liệu bắt buộc] Điểm tổng thể = ${overall}/100, Bát Tự = ${baziScore}/100, Cung Hoàng Đạo = ${zodiacScore}/100, Kinh Dịch = ${ichingScore}/100
- Bài Tarot: ${tarot?.name || ''} (${tarot?.orientation === 'Reversed' ? 'Ngược' : 'Xuôi'})
- Ý nghĩa Tarot: ${tarot?.meaning || ''}

[Định dạng đầu ra]
4、✨ AI Thấu thị
Dưới bầu trời số phận, điểm tương hợp tổng thể **${overall} điểm** là... [Hãy viết tiếp 300-500 từ phân tích kết hợp Bát Tự ${baziScore} điểm, Chiêm tinh ${zodiacScore} điểm, Kinh Dịch ${ichingScore} điểm và bài Tarot ${tarot?.name || ''}. Phải nhắc đến cả 4 con số.] 🌿 ✨ 🔮
`
  },
  en: {
    systemPrompt: "You are an elite spiritual astrologer specializing in Chinese Bazi, Western Astrology, and I Ching. Integrate the given sub-scores and Tarot card meaning into a deep, cohesive analysis (300-500 words). Do NOT alter any numbers provided. Start directly with a poetic image, no generic openings.",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => `
[DATA LOCK] Overall = ${overall}/100, Bazi = ${baziScore}/100, Zodiac = ${zodiacScore}/100, I Ching = ${ichingScore}/100
- Tarot: ${tarot?.name || ''} (${tarot?.orientation === 'Reversed' ? 'Reversed' : 'Upright'})
- Tarot Meaning: ${tarot?.meaning || ''}

[OUTPUT FORMAT]
4、✨ AI Analysis
Under the cosmic tapestry, your overall compatibility score of **${overall} points** indicates... [Please extend into a 300-500 word narrative explaining how Bazi (${baziScore}), Zodiac (${zodiacScore}), and I Ching (${ichingScore}) scores interplay with the Tarot card ${tarot?.name || ''}. Must reference all 4 scores.] 🌿 ✨ 🔮
`
  },
  es: {
    systemPrompt: "Eres un maestro astrólogo espiritual de élite experto en Bazi, Astrología Occidental e I Ching. Integra las puntuaciones dadas y el significado del Tarot para escribir un análisis profundo (300-500 palabras). NO cambies ningún número.",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => `
[BLOQUEO DE DATOS] General = ${overall}/100, Bazi = ${baziScore}/100, Horóscopo = ${zodiacScore}/100, I Ching = ${ichingScore}/100
- Tarot: ${tarot?.name || ''} (${tarot?.orientation === 'Reversed' ? 'Invertido' : 'Derecho'})

[FORMATO DE SALIDA]
4、✨ Análisis AI
Bajo el tapiz cósmico, su puntuación de compatibilidad general de **${overall} puntos** indica... [Continúe con un análisis de 300-500 palabras combinando Bazi (${baziScore}), Horóscopo (${zodiacScore}), I Ching (${ichingScore}) y el Tarot ${tarot?.name || ''}. Debe mencionar las 4 puntuaciones.] 🌿 ✨ 🔮
`
  },
  fr: {
    systemPrompt: "Vous êtes un astrologue spirituel d'élite expert en Bazi, Astrologie Occidentale et Yi Jing. Intégrez les scores fournis et la signification du Tarot pour rédiger une analyse approfondie (300-500 mots). Ne modifiez AUCUN chiffre.",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => `
[VERROUILLAGE DES DONNÉES] Global = ${overall}/100, Bazi = ${baziScore}/100, Horoscope = ${zodiacScore}/100, Yi Jing = ${ichingScore}/100
- Tarot: ${tarot?.name || ''} (${tarot?.orientation === 'Reversed' ? 'Inversé' : 'Droit'})

[FORMAT DE SORTIE]
4、✨ Analyse AI
Sous la tapisserie cosmique, votre score de compatibilité globale de **${overall} points** indique... [Rédigez une analyse de 300-500 mots combinant Bazi (${baziScore}), Horoscope (${zodiacScore}), Yi Jing (${ichingScore}) et le Tarot ${tarot?.name || ''}. Doit mentionner les 4 scores.] 🌿 ✨ 🔮
`
  }
};

// 4. API 调用封装（Gemini 优先，DeepSeek Fallback）
async function callAI(systemPrompt, userPrompt, env) {
  // 优先 Gemini 1.5 Flash
  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { temperature: 0.35, maxOutputTokens: 1500 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {
      console.error('Gemini failed, falling back to DeepSeek:', e.message);
    }
  }

  // Fallback: DeepSeek-V3
  const deepseekKey = env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.35,
        max_tokens: 1500
      })
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content?.trim() || '';
    }
    const errText = await res.text();
    throw new Error(`DeepSeek error: ${errText}`);
  }

  throw new Error('No AI API key configured. Set GEMINI_API_KEY or DEEPSEEK_API_KEY.');
}

// 5. 核心路由
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = await parseRequestBody(req);
    const { bazi, zodiac, iching, tarot, lang = 'th', overall = 70 } = body;

    // 检查必要字段
    if (!body.d1 || !body.d2) {
      return res.status(400).json({ error: 'Missing d1 or d2' });
    }

    // 正则清洗三大维度分数
    const baziScore = extractScore(bazi);
    const zodiacScore = extractScore(zodiac);
    const ichingScore = extractScore(iching);

    // 命中语言包（默认回落泰语）
    const config = LANGUAGE_CONFIGS[lang] || LANGUAGE_CONFIGS['th'];

    // 生成填空模板 Prompt
    const finalPrompt = config.buildPrompt(overall, baziScore, zodiacScore, ichingScore, tarot);

    // 调用 AI（Gemini 优先，DeepSeek Fallback）
    const aiText = await callAI(config.systemPrompt, finalPrompt, process.env);

    // 后端守门：确保切分锚点存在
    let finalInsight = aiText || 'Unable to generate insight at this time.';
    if (!finalInsight.startsWith('4、')) {
      finalInsight = `4、✨ AI Analysis\n${finalInsight}`;
    }

    // 严守 API 契约：返回 { insight }
    return res.status(200).json({
      insight: finalInsight,
      cached: false,
      tarot: tarot || null,
      tarotLine: tarot?.meaning || null,
    });

  } catch (error) {
    console.error('AI Advisor Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
