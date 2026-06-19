export const runtime = 'nodejs';

// ============================================================
// KindredSouls AI Advisor — "填空打字员"架构 (军师架构 + 牛牛工程修复)
// 版本: V8 (正逆位绝对防御锁 + 6语言全覆盖)
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

// 3. 全量6语言系统指令 + 参数化命题模板矩阵 (V8: 正逆位 statusText 绝对锁)
const ORIENT_MAP = {
  th: { up: 'ตั้งตรง', rev: 'กลับด้าน' },
  zh: { up: '正位', rev: '逆位' },
  vi: { up: 'Xuôi', rev: 'Ngược' },
  en: { up: 'Upright', rev: 'Reversed' },
  es: { up: 'Derecho', rev: 'Invertido' },
  fr: { up: 'Droit', rev: 'Inversé' },
};

function getOrientText(tarot, lang) {
  const m = ORIENT_MAP[lang] || ORIENT_MAP['en'];
  return tarot?.orientation === 'Reversed' ? m.rev : m.up;
}

const LANGUAGE_CONFIGS = {
  th: {
    systemPrompt: "คุณเป็นปรมาจารย์ด้านโหราศาสตร์และจิตวิญญาณระดับสูง เขียนบทวิเคราะห์เชิงลึกโดยใช้โครงสร้าง 4 ส่วนที่กำหนดอย่างเคร่งครัด ห้ามเขียนคำนำ ห้ามเขียนหัวข้อเกิน ห้ามพร่ำเพ้อ ย่อหน้าละ 2-3 ประโยค ห้ามเปลี่ยนตัวเลข ห้ามเปลี่ยนสถานะไพ่จากที่ระบุใน[ข้อมูลบังคับ] รวมความยาวไม่เกิน 200 คำ",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'th');
      const cardName = tarot?.name || '';
      return [
        `[ข้อมูลบังคับ] คะแนนรวม=${overall}, บาซี=${baziScore}, ราศี=${zodiacScore}, อี้จิง=${ichingScore}, ไพ่=${cardName}, สถานะไพ่=${statusText}`,
        `ไพ่เชิงลึก: ${tarot?.meaning || ''}`,
        ``,
        `[โครงสร้างบังคับ — เขียนตามนี้ทุกประการ ห้ามเปลี่ยน emoji หรือหัวข้อ]`,
        `🎯 **บทสรุปหลัก:** [1 ประโยคสรุปความสัมพันธ์โดยอิงคะแนนรวม ${overall}]`,
        ``,
        `⚡ **จุดขัดแย้ง:** [2 ประโยค: ทำไมบาซี ${baziScore} กับราศี ${zodiacScore} สะท้อนความตึงเครียด]`,
        ``,
        `💡 **ทางออก:** [2 ประโยค: ใช้อี้จิง ${ichingScore} กับไพ่${cardName}(${statusText}) ให้คำแนะนำเป็นรูปธรรม]`,
        ``,
        `🌿 **พลังจิตวิญญาณ:** [1 ประโยคปิดท้ายให้กำลังใจ] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  zh: {
    systemPrompt: "你是精通八字、占星与易经的命理导师。严格按照4段结构输出，每段2-3句话，总字数不超过200字。第一句直接给结论，不要废话前缀，不要标题序号。严禁篡改任何分数。严禁写错塔罗牌正逆位状态。",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'zh');
      const cardName = tarot?.name || '';
      return [
        `[强制数据锁] 综合评分=${overall}, 八字=${baziScore}, 星座=${zodiacScore}, 易经=${ichingScore}, 塔罗=${cardName}, 正逆位=${statusText}`,
        `牌意: ${tarot?.meaning || ''}`,
        ``,
        `[输出结构 — 严格执行，不改emoji和标题]`,
        `🎯 **核心结论:** [1句话，根据综合评分${overall}直接定性这段关系]`,
        ``,
        `⚡ **命运冲突:** [2句话：八字${baziScore}与星座${zodiacScore}暴露的核心矛盾]`,
        ``,
        `💡 **破局建议:** [2句话：易经${ichingScore}与塔罗${cardName}(${statusText})给出的现实相处建议]`,
        ``,
        `🌿 **灵性指引:** [1句话收尾祝福] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  vi: {
    systemPrompt: "Bạn là bậc thầy chiêm tinh cấp cao. Viết theo cấu trúc 4 phần, mỗi phần 2-3 câu, tổng không quá 200 từ. Không viết lời mở đầu, không số thứ tự. Không thay đổi bất kỳ số điểm nào. Không viết sai trạng thái xuôi/ngược của bài Tarot.",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'vi');
      const cardName = tarot?.name || '';
      return [
        `[Khóa dữ liệu] Tổng=${overall}, Bát Tự=${baziScore}, Cung Hoàng Đạo=${zodiacScore}, Kinh Dịch=${ichingScore}, Tarot=${cardName}, Trạng thái=${statusText}`,
        `Ý nghĩa: ${tarot?.meaning || ''}`,
        ``,
        `[Cấu trúc bắt buộc — không đổi emoji hay tiêu đề]`,
        `🎯 **Kết luận cốt lõi:** [1 câu tóm tắt mối quan hệ dựa trên điểm ${overall}]`,
        ``,
        `⚡ **Điểm xung đột:** [2 câu: Bát Tự ${baziScore} và Cung Hoàng Đạo ${zodiacScore} phản ánh mâu thuẫn gì]`,
        ``,
        `💡 **Đề xuất thực tế:** [2 câu: Kinh Dịch ${ichingScore} và Tarot ${cardName}(${statusText}) gợi ý cách kết nối]`,
        ``,
        `🌿 **Hướng dẫn tâm linh:** [1 câu chúc phúc kết thúc] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  en: {
    systemPrompt: "You are an elite spiritual astrologer. Write in exactly 4 sections, 2-3 sentences each, under 200 words total. No preamble, no numbering. Never alter any scores. Never change the tarot orientation from what is given in [DATA LOCK].",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'en');
      const cardName = tarot?.name || '';
      return [
        `[DATA LOCK] Overall=${overall}, Bazi=${baziScore}, Zodiac=${zodiacScore}, IChing=${ichingScore}, Tarot=${cardName}, Orientation=${statusText}`,
        `Meaning: ${tarot?.meaning || ''}`,
        ``,
        `[MANDATORY STRUCTURE — do not change emojis or headers]`,
        `🎯 **Core Verdict:** [1 sentence summarizing the relationship based on score ${overall}]`,
        ``,
        `⚡ **Tension Points:** [2 sentences: how Bazi ${baziScore} and Zodiac ${zodiacScore} reveal core friction]`,
        ``,
        `💡 **Path Forward:** [2 sentences: actionable advice from IChing ${ichingScore} and Tarot ${cardName}(${statusText})]`,
        ``,
        `🌿 **Spiritual Guidance:** [1 closing blessing] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  es: {
    systemPrompt: "Eres un maestro astrólogo espiritual. Escribe en exactamente 4 secciones, 2-3 oraciones cada una, bajo 200 palabras. Sin preámbulo, sin numeración. Nunca alteres ninguna puntuación. Nunca cambies la orientación del tarot de la indicada en [BLOQUEO DE DATOS].",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'es');
      const cardName = tarot?.name || '';
      return [
        `[BLOQUEO DE DATOS] General=${overall}, Bazi=${baziScore}, Horóscopo=${zodiacScore}, IChing=${ichingScore}, Tarot=${cardName}, Orientación=${statusText}`,
        `Significado: ${tarot?.meaning || ''}`,
        ``,
        `[ESTRUCTURA OBLIGATORIA — no cambiar emojis ni títulos]`,
        `🎯 **Veredicto central:** [1 oración resumiendo la relación según puntuación ${overall}]`,
        ``,
        `⚡ **Puntos de tensión:** [2 oraciones: cómo Bazi ${baziScore} y Horóscopo ${zodiacScore} revelan fricción]`,
        ``,
        `💡 **Camino adelante:** [2 oraciones: consejo práctico desde IChing ${ichingScore} y Tarot ${cardName}(${statusText})]`,
        ``,
        `🌿 **Guía espiritual:** [1 bendición final] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  fr: {
    systemPrompt: "Vous êtes un astrologue spirituel d'élite. Écrivez en exactement 4 sections, 2-3 phrases chacune, sous 200 mots. Pas de préambule, pas de numérotation. Ne modifiez aucun score. Ne changez jamais l'orientation du tarot indiquée dans [VERROUILLAGE DES DONNÉES].",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'fr');
      const cardName = tarot?.name || '';
      return [
        `[VERROUILLAGE DES DONNÉES] Global=${overall}, Bazi=${baziScore}, Horoscope=${zodiacScore}, YiJing=${ichingScore}, Tarot=${cardName}, Orientation=${statusText}`,
        `Signification: ${tarot?.meaning || ''}`,
        ``,
        `[STRUCTURE OBLIGATOIRE — ne pas modifier emojis ni titres]`,
        `🎯 **Verdict central:** [1 phrase résumant la relation selon le score ${overall}]`,
        ``,
        `⚡ **Points de tension:** [2 phrases: comment Bazi ${baziScore} et Horoscope ${zodiacScore} révèlent des frictions]`,
        ``,
        `💡 **Voie à suivre:** [2 phrases: conseils pratiques depuis YiJing ${ichingScore} et Tarot ${cardName}(${statusText})]`,
        ``,
        `🌿 **Guidance spirituelle:** [1 bénédiction finale] 🌿 ✨ 🔮`,
      ].join('\n');
    }
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

  // Fallback: DeepSeek-V4 Flash
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
    // Ensure proper paragraph spacing between sections
    finalInsight = finalInsight.replace(/(🎯|⚡|💡|🌿)/g, '\n\n$1').trim();
    // Strip any AI-generated numbering prefix
    finalInsight = finalInsight.replace(/^[\d]+[、.．]\s*/, '');
    // Strip tarot card info block if AI appended it (🦋 ...)
    finalInsight = finalInsight.replace(/\n*🦋[\s\S]*$/, '');

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
