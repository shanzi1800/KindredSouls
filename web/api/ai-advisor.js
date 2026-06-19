export const runtime = 'nodejs';

// ============================================================
// KindredSouls AI Advisor — "填空打字员"架构 (军师架构 + 牛牛工程修复)
// 版本: V9 (总分后端重算 + 正逆位绝对锁 + 塔罗牌意意图约束 + 6语言)
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

// 3. 工具函数：正逆位本地化文本
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

// 4. 工具函数：从 tarot.meaning 提取核心关键词（给 AI 的意图约束，防止瞎编仪式）
function getTarotCoreKeyword(meaning, lang) {
  if (!meaning) return '';
  // meaning 格式: "Creation and Expression — ..." or "关键词 — 详细解释"
  const core = meaning.split('—')[0].trim();
  if (lang === 'th') {
    // 泰语meaning的常见核心词翻译
    if (core.includes('Creation') || core.includes('Expression')) return 'การสร้างสรรค์และการแสดงออก';
    if (core.includes('Nurturing') || core.includes('Abundance')) return 'การหล่อเลี้ยงและความอุดมสมบูรณ์';
    if (core.includes('Intuition') || core.includes('Mystery')) return 'สัญชาตญาณและความลึกลับ';
    if (core.includes('Balance') || core.includes('Harmony')) return 'ความสมดุลและความประสาน';
    if (core.includes('Power') || core.includes('Authority')) return 'พลังและอำนาจ';
    if (core.includes('Love') || core.includes('Union')) return 'ความรักและการรวมเป็นหนึ่ง';
    if (core.includes('Transformation') || core.includes('Death')) return 'การเปลี่ยนแปลงและการตาย';
    if (core.includes('Reward') || core.includes('Harvest')) return 'ผลตอบแทนและการเก็บเกี่ยว';
    if (core.includes('Hope') || core.includes('Illumination')) return 'ความหวังและแสงสว่าง';
    if (core.includes('Journey') || core.includes('Road')) return 'การเดินทางและเส้นทาง';
    return core;
  }
  return core;
}

// 5. 全量6语言系统指令 + 参数化命题模板矩阵 (V9)
const LANGUAGE_CONFIGS = {
  th: {
    systemPrompt: "คุณเป็นปรมาจารย์ด้านโหราศาสตร์และจิตวิญญาณระดับสูง เขียนบทวิเคราะห์เชิงลึกโดยใช้โครงสร้าง 4 ส่วนที่กำหนดอย่างเคร่งครัด ห้ามเขียนคำนำ ห้ามเขียนหัวข้อเกิน ห้ามพร่ำเพ้อ ย่อหน้าละ 2-3 ประโยค ห้ามเปลี่ยนตัวเลข ห้ามเปลี่ยนสถานะไพ่จากที่ระบุ ห้ามเขียน (ตั้งตรง) เองโดยเด็ดขาดต้องใช้งานสถานะไพ่จากข้อมูลที่ให้มาทุกตัวอักษร ห้ามเขียนคำแนะนำพิธีกรรมทางศาสนาหรือไสยศาสตร์เด็ดขาด เช่น นั่งสมาธิ สวดมนต์ บูชาวิญญาณ ให้เน้นคำแนะนำการใช้ชีวิตร่วมกันในโลกจริงที่มนุษย์พูดคุยกันได้ รวมความยาวไม่เกิน 200 คำ\n\n[บังคับการขึ้นย่อหน้าใหม่] ทุกส่วนต้องขึ้นย่อหน้าใหม่ด้วยบรรทัดเปล่าหนึ่งบรรทัด (empty line) ห้ามเขียนต่อเนื่องกัน",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'th');
      const cardName = tarot?.name || '';
      const coreKeyword = getTarotCoreKeyword(tarot?.meaning, 'th');
      return [
        `[ข้อมูลบังคับ] คะแนนรวม=${overall}, บาซี=${baziScore}, ราศี=${zodiacScore}, อี้จิง=${ichingScore}, ไพ่=${cardName}, สถานะไพ่=${statusText}`,
        `ไพ่เชิงลึก: ${tarot?.meaning || ''}`,
        `แก่นไพ่(ต้องใช้ใน💡): ${coreKeyword}`,
        ``,
        `[คำสั่งบังคับเด็ดขาด — อ่านก่อนเขียน]
- ห้ามคิดคำว่า (ตั้งตรง) เองเด็ดขาด! ต้องอ่านสถานะไพ่จาก [ข้อมูลบังคับ] ว่า=${statusText} แล้วเขียนสถานะนั้นทุกตัวอักษร ไม่มากไม่น้อย
- ห้ามแนะนำพิธีกรรมทางศาสนาหรือไสยศาสตร์เด็ดขาด เช่น นั่งสมาธิ สวดมนต์ ทำบุญ ให้เขียนคำแนะนำที่คู่รักใช้ชีวิตร่วมกันในโลกจริงได้ทันที
- สำคัญ: หากคะแนนบาซีและราศีเท่ากัน (baziScore === zodiacScore) ห้ามใช้คำว่าขัดแย้งหรือตรงข้าม แต่ให้เขียนว่า พลังงานสมดุลสูง ทั้งสองฝ่ายต้องการการกระตุ้นจากภายนอกเพื่อ打破沉闷
        - สำคัญ: วิเคราะห์ข้อขัดแย้งของราศี ต้องอ้างอิงลักษณะจริงของราศีสองราศีที่แสดงในผลลัพธ์ เช่น กันย์(วิเคราะห์/พิถีพิถัน) ตุลย์(หริ่มหนวก/ต้องการสมดุล) ห้ามแต่งลักษณะจิตใจขึ้นเอง เช่น "อ่อนไหวและต้องการการตอบสนองทางอารมณ์อย่างรวดเร็ว" ซึ่งเป็นของปักษ์งเฟิงหรือตึนปลา

[โครงสร้างบังคับ — เขียนตามนี้ทุกประการ ห้ามเปลี่ยน emoji หรือหัวข้อ ห้ามเพิ่มเติม ห้ามเขียนหัวข้อเช่น "4、✨ วิเคราะห์ AI" หรือหัวข้อบนเว็บเพจอื่นใดก่อน 🎯 เป็นอันขาด]`,
        `🎯 **บทสรุปหลัก:** [1 ประโยคสรุปความสัมพันธ์จากคะแนนรวม ${overall} ให้ตรงกับข้อมูลจริง]`,
        ``,
        `⚡ **จุดขัดแย้ง:** [2 ประโยค: ทำไมบาซี ${baziScore} กับราศี ${zodiacScore} สะท้อนความตึงเครียดในชีวิตจริง]`,
        ``,
        `💡 **ทางออก:** [2 ประโยค: ใช้อี้จิง ${ichingScore} กับไพ่${cardName}(${statusText}) โดยอิงจากแก่นไพ่"${coreKeyword}" ให้คำแนะนำการอยู่ร่วมกันในชีวิตประจำวันที่จับต้องได้จริง ห้ามมีพิธีกรรมทางไสยศาสตร์]`,
        ``,
        `🌿 **พลังจิตวิญญาณ:** [1 ประโยคปิดท้ายให้กำลังใจและดึงสติ] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  zh: {
    systemPrompt: `你是精通八字、占星与易经的命理导师。严格按照4段结构输出，每段2-3句话，总字数不超过200字。第一句直接给结论，不要废话前缀，不要标题序号（如"4、"），严禁在🎯前加任何其他标题或前缀。严禁篡改任何分数。严禁写错塔罗牌正逆位状态。严禁写任何迷信仪式（如烧纸、做法、诵经）。`,
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'zh');
      const cardName = tarot?.name || '';
      const coreKeyword = getTarotCoreKeyword(tarot?.meaning, 'zh');
      return [
        `[强制数据锁] 综合评分=${overall}, 八字=${baziScore}, 星座=${zodiacScore}, 易经=${ichingScore}, 塔罗=${cardName}, 正逆位=${statusText}`,
        `牌意: ${tarot?.meaning || ''}`,
        `牌核(用于💡): ${coreKeyword}`,
        ``,
        `[输出结构 — 严格执行，不改emoji和标题]`,
        `🎯 **核心结论:** [1句话，根据综合评分${overall}直接定性这段关系]`,
        ``,
        `⚡ **命运冲突:** [2句话：八字${baziScore}与星座${zodiacScore}暴露的核心矛盾]`,
        ``,
        `💡 **破局建议:** [2句话：易经${ichingScore}与塔罗${cardName}(${statusText})，围绕"${coreKeyword}"给出在现实生活中的具体相处建议，严禁迷信仪式]`,
        ``,
        `🌿 **灵性指引:** [1句话收尾祝福] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  vi: {
    systemPrompt: "Bạn là bậc thầy chiêm tinh cấp cao. Viết theo cấu trúc 4 phần, mỗi phần 2-3 câu, tổng không quá 200 từ. KHÔNG được thay đổi bất kỳ con số nào. CRITICAL: Nếu trạng thái bài Tarot là \"Ngược\", CẤM ĐOẠN tuyệt đối không được viết từ \"Xuôi\" hoặc bất kỳ từ nào có nghĩa là vị trí bình thường. Nếu trạng thái là \"Xuôi\", CẤM ĐOẠN tuyệt đối không được viết \"Ngược\". PHẢI kiểm tra trạng thái bài trước khi viết từng đoạn. Không viết lễ nghi mê tín (đốt vàng mã, tụng kinh, làm phép). Tập trung vào lời khuyên thực tế cho đời sống thật.",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'vi');
      const cardName = tarot?.name || '';
      const coreKeyword = tarot?.meaning?.split('—')[0]?.trim() || '';
      return [
        `[Khóa dữ liệu] Tổng=${overall}, Bát Tự=${baziScore}, Cung Hoàng Đạo=${zodiacScore}, Kinh Dịch=${ichingScore}, Tarot=${cardName}, Trạng thái=${statusText}`,
        `Ý nghĩa: ${tarot?.meaning || ''}`,
        `Lõi bài: ${coreKeyword}`,
        ``,
        `[KHÓA TRẠNG THÁI BÀI TAROT — đọc kỹ trước khi viết]\n- Nếu Trạng thái = \"Ngược\": CẤM ĐOẠN tuyệt đối cấm dùng từ \"Xuôi\" hoặc bất kỳ từ nào có nghĩa là vị trí bình thường. Mọi nhắc đến bài tarot phải dùng đúng trạng thái: ${statusText}.\n- Nếu Trạng thái = \"Xuôi\": CẤM ĐOẠN tuyệt đối cấm dùng từ \"Ngược\".\n- Kiểm tra kỹ trạng thái bài trước khi viết từng đoạn.\n\n[Cấu trúc bắt buộc — không đổi emoji hay tiêu đề]`,
        - Quan trọng: Khi phân tích xung đột cung hoàng đạo, PHẢI tham chiếu đặc điểm thực tế của hai cung cụ thể trong kết quả (ví dụ: Xử Nữ thì hay phê bình/chỉn chu, Thiên Bình thì do dự/cân bằng). CẤM ĐOẠN chỉnh sửa đặc điểm tính cách.
        `🎯 **Kết luận cốt lõi:** [1 câu tóm tắt mối quan hệ dựa trên điểm ${overall}]`,
        ``,
        `⚡ **Điểm xung đột:** [2 câu: Bát Tự ${baziScore} và Cung Hoàng Đạo ${zodiacScore} phản ánh mâu thuẫn gì]`,
        ``,
        `💡 **Đề xuất thực tế:** [2 câu: Kinh Dịch ${ichingScore} và Tarot ${cardName}(${statusText}) dựa trên lõi "${coreKeyword}" đưa ra gợi ý kết nối thực tế trong cuộc sống hằng ngày, không có nghi lễ mê tín]`,
        ``,
        `🌿 **Hướng dẫn tâm linh:** [1 câu chúc phúc kết thúc] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  en: {
    systemPrompt: "You are an elite spiritual astrologer. Write in exactly 4 sections, 2-3 sentences each, under 200 words total. No preamble, no numbering. Never alter any scores. Never change the tarot orientation — if Orientation is \"Reversed\", you are STRICTLY FORBIDDEN from writing the word \"upright\" anywhere in your analysis. All references to the tarot card must exactly match the given Orientation status. Never suggest superstitious rituals (burning paper, chanting, spells, meditation). Focus on practical relationship advice for real life.",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'en');
      const cardName = tarot?.name || '';
      const coreKeyword = tarot?.meaning?.split('—')[0]?.trim() || '';
      return [
        `[DATA LOCK] Overall=${overall}, Bazi=${baziScore}, Zodiac=${zodiacScore}, IChing=${ichingScore}, Tarot=${cardName}, Orientation=${statusText}`,
        `Meaning: ${tarot?.meaning || ''}`,
        `Core keyword (for 💡): ${coreKeyword}`,
        ``,
        `[CRITICAL ORIENTATION LOCK — read before writing]
- If Orientation = "Reversed"
        - CRITICAL: When analyzing zodiac conflicts, you MUST reference the actual traits of the two specific zodiac signs shown in the results (e.g., Virgo = critical/precise, Libra = indecisive/balanced). Do NOT invent personality traits.
, you are STRICTLY FORBIDDEN from using the word "upright" anywhere in your analysis. Every reference to the tarot card must use the exact status: ${statusText} — no synonyms, no substitutions.
- If Orientation = "Upright", you must NOT write "Reversed".
- Double-check the card status before writing each paragraph.

[MANDATORY STRUCTURE — do not change emojis or headers]`,
        `🎯 **Core Verdict:** [1 sentence summarizing the relationship based on score ${overall}]`,
        ``,
        `⚡ **Tension Points:** [2 sentences: how Bazi ${baziScore} and Zodiac ${zodiacScore} reveal core friction]`,
        ``,
        `💡 **Path Forward:** [2 sentences: IChing ${ichingScore} and Tarot ${cardName}(${statusText}) based on core "${coreKeyword}" — give practical relationship advice for real life. No superstitious rituals.]`,
        ``,
        `🌿 **Spiritual Guidance:** [1 closing blessing] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  es: {
    systemPrompt: "Eres un maestro astrólogo espiritual. Escribe en exactamente 4 secciones, 2-3 oraciones cada una, bajo 200 palabras. Sin preámbulo, sin numeración. Nunca alteres ninguna puntuación. CRÍTICO — Si la Orientación del tarot es \"Invertido\": QUEDA TERMINANTEMENTE PROHIBIDO usar las palabras \"en derecho\", \"al derecho\" o cualquier término que signifique posición normal. Si la Orientación es \"Derecho\": QUEDA TERMINANTEMENTE PROHIBIDO usar \"invertido\". Nunca sugieras rituales supersticiosos (quemar papel, rezar, hacer hechizos).",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'es');
      const cardName = tarot?.name || '';
      const coreKeyword = tarot?.meaning?.split('—')[0]?.trim() || '';
      return [
        `[BLOQUEO DE DATOS] General=${overall}, Bazi=${baziScore}, Horóscopo=${zodiacScore}, IChing=${ichingScore}, Tarot=${cardName}, Orientación=${statusText}`,
        `Significado: ${tarot?.meaning || ''}`,
        `Palabra clave central: ${coreKeyword}`,
        ``,
        `[BLOQUEO DE ORIENTACIÓN CRÍTICO — leer antes de escribir]
- Si Orientación = "Invertido"
        - CRÍTICO: Al analizar conflictos de zodiaco, DEBES referenciar los rasgos reales de los dos signos específicos en los resultados (ej. Virgo = crítico/preciso, Libra = indeciso/equilibrado). PROHIBIDO inventar rasgos.
, ESTRICTAMENTE PROHIBIDO usar "en derecho", "al derecho" o cualquier sinónimo de posición normal. Toda referencia a la carta debe usar exactamene: ${statusText}.
- Si Orientación = "Derecho", PROHIBIDO escribir "invertido".
- Verificar dos veces el estado de la carta antes de escribir cada párrafo.

[ESTRUCTURA OBLIGATORIA — no cambiar emojis ni títulos]`,
        `🎯 **Veredicto central:** [1 oración resumiendo la relación según puntuación ${overall}]`,
        ``,
        `⚡ **Puntos de tensión:** [2 oraciones: cómo Bazi ${baziScore} y Horóscopo ${zodiacScore} revelan fricción]`,
        ``,
        `💡 **Camino adelante:** [2 oraciones: IChing ${ichingScore} y Tarot ${cardName}(${statusText}) basado en "${coreKeyword}" — dar consejo práctico de relación real. Sin rituales supersticiosos.]`,
        ``,
        `🌿 **Guía espiritual:** [1 bendición final] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  fr: {
    systemPrompt: "Vous êtes un astrologue spirituel d'élite. Écrivez en exactement 4 sections, 2-3 phrases chacune, sous 200 mots. Pas de préambule, pas de numérotation. Ne modifiez aucun score. Ne changez jamais l'orientation du tarot. Ne suggérez jamais de rituels superstitieux (brûler du papier, prières, sorts).",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot) => {
      const statusText = getOrientText(tarot, 'fr');
      const cardName = tarot?.name || '';
      const coreKeyword = tarot?.meaning?.split('—')[0]?.trim() || '';
      return [
        `[VERROUILLAGE DES DONNÉES] Global=${overall}, Bazi=${baziScore}, Horoscope=${zodiacScore}, YiJing=${ichingScore}, Tarot=${cardName}, Orientation=${statusText}`,
        `Signification: ${tarot?.meaning || ''}`,
        `Mot-clé central: ${coreKeyword}`,
        ``,
        `[STRUCTURE OBLIGATOIRE — ne pas modifier emojis ni titres]
        - CRITIQUE: En analysant les conflits du zodiaque, vous DEVEZ vous référer aux traits réels des deux signes spécifiques dans les résultats (ex. Vierge = critique/précis, Balance = indécis/équilibré). INTERDIT d'inventer des traits.
`,
        `🎯 **Verdict central:** [1 phrase résumant la relation selon le score ${overall}]`,
        ``,
        `⚡ **Points de tension:** [2 phrases: comment Bazi ${baziScore} et Horoscope ${zodiacScore} révèlent des frictions]`,
        ``,
        `💡 **Voie à suivre:** [2 phrases: YiJing ${ichingScore} et Tarot ${cardName}(${statusText}) basé sur "${coreKeyword}" — donner des conseils relationnels pratiques. Pas de rituels superstitieux.]`,
        ``,
        `🌿 **Guidance spirituelle:** [1 bénédiction finale] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  }
};

// 6. API 调用封装（Gemini 优先，DeepSeek Fallback）
async function callAI(systemPrompt, userPrompt, env) {
  const geminiKey = process.env.GEMINI_API_KEY;
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

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
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

// 7. 核心路由
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = await parseRequestBody(req);
    const { bazi, zodiac, iching, tarot, lang = 'th' } = body;

    if (!body.d1 || !body.d2) {
      return res.status(400).json({ error: 'Missing d1 or d2' });
    }

    // V9: 后端重算总分，不用前端传来的 overall（防止前端传错）
    const baziScore = extractScore(bazi);
    const zodiacScore = extractScore(zodiac);
    const ichingScore = extractScore(iching);
    // 三维度加权重算: 八字45% + 星座35% + 易经20%
    const computedOverall = Math.round(baziScore * 0.45 + zodiacScore * 0.35 + ichingScore * 0.20);

    const config = LANGUAGE_CONFIGS[lang] || LANGUAGE_CONFIGS['th'];
    const finalPrompt = config.buildPrompt(computedOverall, baziScore, zodiacScore, ichingScore, tarot);

    const aiText = await callAI(config.systemPrompt, finalPrompt, process.env);

    let finalInsight = aiText || 'Unable to generate insight at this time.';
    finalInsight = finalInsight.replace(/(🎯|⚡|💡|🌿)/g, '\n\n$1').trim();
    finalInsight = finalInsight.replace(/^[\d]+[、.．]\s*/, '');
    finalInsight = finalInsight.replace(/\n*🦋[\s\S]*$/, '');

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
