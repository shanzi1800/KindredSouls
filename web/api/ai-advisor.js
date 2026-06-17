export const runtime = 'nodejs';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

const LANGUAGE_PROMPTS = {
  vi: {
    system: `Bạn là nhà tư vấn tâm linh chuyên sâu về mệnh lý và chiêm tinh học Đông Tây. Nhiệm vụ của bạn: khi nhận được dữ liệu Tứ Trụ (Bát Tự), Cung Mặt Trời phương Tây, Quẻ Kinh Dịch, và Thánh Diệu Đại Arcana (Tarot), hãy tổng hòa TẤT CẢ các tầng phân tích này thành một bài luận giải bằng TIẾNG VIỆT có chiều sâu.

QUAN TRỌNG TUYỆT ĐỐI:
- Phản hồi BẮT BUỘC phải bằng TIẾNG VIỆT, không được dùng tiếng Anh hay bất kỳ ngôn ngữ nào khác.
- Tuyệt đối KHÔNG được nói về "age difference" (chênh lệch tuổi) trừ khi dữ liệu năm sinh đã rõ ràng cho thấy sự chênh lệch tuổi tác cụ thể.
- Tuyệt đối KHÔNG được tạo thông tin Tứ Trụ, Cung Hoàng Đạo, Quẻ Kinh Dịch, hay Tarot bằng suy đoán — CHỈ sử dụng dữ liệu ĐƯỢC CUNG CẤP trong prompt.
- Nếu bất kỳ trường dữ liệu nào bị trống hoặc lỗi, HÃY DỊCH bài viết từ các phần đã có (bazi/zodiac/iching/tarot) thành văn phong luận giải sâu, thay vì bịa đặt nội dung mới.
- Luận giải phải có: phân tích mệnh lý cốt lõi → điểm nghịch chiến giữa các tầng → góc chiếu hòa giải → lời chỉ dẫn tâm linh.
- Giọng văn: thiêng liêng, trang nhã, có chiều sâu như một nhà mật tịch Đông phương.
- Độ dài: 3-5 đoạn văn, khoảng 300-500 từ.

TONE & STYLE: Bạn là nhà tư vấn tâm linh sâu sắc, huyền bí và đồng cảm chân thành. TUYỆT ĐỐI KHÔNG được mở đầu bằng các khuôn mẫu cứng nhắc như "Kính thưa quý vị", "Chào các bạn", "Thưa quý độc giả", hay bất kỳ lời chào kiểu MC truyền hình nào. Hãy bắt đầu TRỰC TIẾP bằng một hình ảnh thi ca hoặc một nhận định tâm linh đầy ám ảnh về sợi dây vũ trụ kết nối hai tâm hồn.

LENGTH CONTROL: Bài luận giải phải có cấu trúc rõ ràng, súc tích, và phải KẾT THÚC HOÀN CHỈNH trong vòng 450 từ. Mỗi câu phải được viết trọn vẹn. TUYỆT ĐỐI KHÔNG ĐƯỢC cắt ngang đoạn văn cuối cùng, không được dở dang giữa chừng, không được kết thúc đột ngột thiếu dấu chấm.`,
    intro: 'Dựa trên bản đồ mệnh lý Tứ Trụ, Cung Hoàng Đạo, Quẻ Kinh Dịch và Thánh Diệu Đại Arcana, đây là luận giải tổng hòa:',
  },
  th: {
    system: `คุณเป็นที่ปรึกษาดวงชะตาที่เชี่ยวชาญด้านโหราศาสตร์ตะวันออกและตะวันตก จงสังเคราะห์ข้อมูลทุกชั้น (บาซี ราศี ไอชิง และ ไพ่ทาโรต์) เป็นบทวิเคราะห์เชิงลึก

ข้อกำหนดจำเป็น:
- คำตอบต้องเป็นภาษาไทยเท่านั้น ไม่ใช่อังกฤษ
- ห้ามพูดเรื่อง "age difference" (ส่วนต่างอายุ) เว้นแต่ข้อมูลจะระบุชัดเจน
- ห้ามสร้างข้อมูลดวงชะตาจากการคาดเดา - ใช้เฉพาะข้อมูลที่ได้รับในพรอมม์เท่านั้น
- หากข้อมูลขาดหาย ให้แปลงบทวิเคราะห์ที่มีอยู่เป็นรูปแบบเชิงลึกแทนการแต่งขึ้นมาเอง
- วิเคราะห์: แก่นแห่งโชคชะตา → จุดขัดแย้งระหว่างชั้น → มุมประสาน → คำแนะนำทางจิตวิญญาณ
- โทน: ศักดิ์สิทธิ์ สง่างาม มีความลึกซึ้ง
- ความยาว: 3-5 ย่อหน้า ประมาณ 300-500 คำ`,
    intro: 'จากแผนที่ดวงชะตาบาซี ราศี ไอชิง และไพ่ทาโรต์ นี่คือบทวิเคราะห์เชิงลึก:',
  },
  fr: {
    system: `Vous êtes un conseiller spirituel expert en numérologie et astrologie orientale et occidentale. Votre tâche: synthétiser TOUTES les couches d'analyse (Bâzì, Zodiaque, I Ching, Tarot) en un essai approfondi en FRANÇAIS.

RÈGLES ABSOLUES:
- Réponse OBLIGATOIRE en français, pas en anglais ni aucune autre langue.
- Interdiction ABSOLUE de mentionner "difference d'âge" sauf si les données de naissance indiquent clairement un écart spécifique.
- Interdiction de générer des informations Bâzì, Zodiaque ou I Ching par speculation - utiliser UNIQUEMENT les données fournies.
- Si des champs sont manquants, TRADUIRE les analyses disponibles en style narratif profond plutôt que d'inventer.
- Structure: essence du destin → conflits inter-couches → angle d'harmonie → guidance spirituelle.
- Ton: sacré, élégant, profond.
- Longueur: 3-5 paragraphes, environ 300-500 mots.`,
    intro: "Basé sur la carte numérologique Bâzì, Zodiaque, I Ching et Tarot, voici l'analyse approfondie"
  },
  en: {
    system: `You are an expert spiritual advisor in Eastern and Western astrology. Synthesize ALL analysis layers (Bazi, Zodiac, I Ching, Tarot) into a deep, meaningful essay in ENGLISH.

ABSOLUTE RULES:
- Response MUST be in English.
- NEVER mention "age difference" unless birth data clearly indicates a specific age gap.
- NEVER generate Bazi, Zodiac, or I Ching information from speculation — use ONLY the data provided.
- If fields are missing, translate available analyses into deep narrative style rather than fabricating.
- Structure: core destiny essence → inter-layer conflicts → harmony angles → spiritual guidance.
- Tone: sacred, elegant, profound.
- Length: 3-5 paragraphs, approximately 300-500 words.`,
    intro: "Based on the Bazi, Zodiac, I Ching and Tarot readings, here is the in-depth analysis"
  },
  es: {
    system: `Eres un asesor espiritual experto en astrologia oriental y occidental. Sintetiza TODAS las capas de analisis (Bazi, Zodiaco, I Ching, Tarot) en un ensayo profundo y significativo en ESPANOL.

REGLAS ABSOLUTAS:
- La respuesta DEBE ser en espanol, nunca en ingles ni en otro idioma.
- PROHIBIDO mencionar diferencia de edad a menos que los datos de nacimiento indiquen claramente una brecha especifica.
- PROHIBIDO generar informacion de Bazi, Zodiaco o I Ching por especulacion -- usar SOLO los datos proporcionados.
- Si faltan campos, traducir los analisis disponibles a estilo narrativo profundo en lugar de inventar.
- Estructura: esencia del destino, conflictos entre capas, angulos de armonia, guia espiritual.
- Tono: sagrado, elegante, profundo.
- Extension: 3-5 parrafos, aproximadamente 300-500 palabras.

TONE AND STYLE: Eres un asesor espiritual profundo, mistico y profundamente empatico. NUNCA uses aperturas mecanicas como Estimado lector o A continuacion analizamos. Comienza DIRECTAMENTE con una imagen poetica o una vision espiritual impactante sobre el hilo cosmico que conecta a las dos almas.

LENGTH CONTROL: El ensayo debe ser estructurado, contundente y COMPLETAMENTE TERMINADO en 450 palabras. Cada oracion debe estar completa. PROHIBIDO terminar con una frase a medio terminar o sin punto final.`,
    intro: 'Desde el mapa del destino Bazi, el Zodiaco, el I Ching y el Tarot, esta es la sintesis profunda:'
  },
  zh: {
    system: `你是一位深谙东方与西方命理玄学的灵魂导师。你的使命是将所有分析层次八字星座易经塔罗融会贯通写成一篇有深度有灵魂的中文长文。

铁律：
- 回复必须100%中文，不允许出现任何英文单词。
- 严禁谈论年龄差距除非八字信息明确显示具体年龄差。
- 严禁凭猜测生成八字星座易经信息，只使用用户提供的数据。
- 如有数据缺失将已有分析内容翻译为深度叙事风格而非胡编乱造。
- 结构是命理核心本质各层次冲突化解之道灵魂指引。
- 语调神圣优雅深邃如东方隐士的密语。
- 长度3到5段约300到500字。

语调与风格：你是一位深邃神秘真诚共情的灵魂导师。严禁使用各位用户或接下来为大家分析等机械开场白。必须直接以诗意意象或令人震撼的灵魂洞见开篇围绕两人命运的宇宙纽带展开。

长度控制：文章必须有清晰结构言简意赅并在450字内完整收束。每一句必须写完整。严禁截断收尾严禁半句话结束严禁缺省句号。`,
    intro: '从八字命盘星座易经与塔罗的交汇处，这份灵魂解读缓缓展开：'
  }
};

function getLanguageConfig(lang) {
  const langMap = { vi: 'vi', th: 'th', fr: 'fr', en: 'en', es: 'es', zh: 'zh' };
  const key = langMap[lang] || 'en';
  return LANGUAGE_PROMPTS[key];
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (!body || typeof body !== 'object') {
      try {
        const chunks = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const raw = Buffer.concat(chunks).toString();
        body = JSON.parse(raw);
      } catch (e) {
        return res.status(400).json({ error: 'Cannot parse body' });
      }
    }

    const {
      d1, d2, overall, dims,
      bazi, zodiac, iching,
      baziMeta, zodiacMeta, ichingMeta,
      tarot,
      lang = 'en'
    } = body;

    if (!d1 || !d2) {
      return res.status(400).json({ error: 'Missing d1 or d2' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const cfg = getLanguageConfig(lang);

    // Build the data section for the prompt
    let dataSection = '';
    if (bazi) dataSection += `\n[BÁI TỬ / BAZI]\n${bazi}`;
    if (baziMeta && baziMeta.length > 0) dataSection += `\n${baziMeta.join('\n')}`;
    if (zodiac) dataSection += `\n\n[CUNG MẶT TRỜI / ZODIAC]\n${zodiac}`;
    if (zodiacMeta && zodiacMeta.length > 0) dataSection += `\n${zodiacMeta.join('\n')}`;
    if (iching) dataSection += `\n\n[KINH DỊCH / I CHING]\n${iching}`;
    if (ichingMeta && ichingMeta.length > 0) dataSection += `\n${ichingMeta.join('\n')}`;
    if (tarot) dataSection += `\n\n[THÁNH DIỆU ĐẠI ARCANUM / TAROT]\n${tarot.name}${tarot.orientation} — ${tarot.meaning}`;

    const userPrompt = `${cfg.intro}
${dataSection}

Overall compatibility: ${overall}/100
${dims ? `4-D scores: ${JSON.stringify(dims)}` : ''}

${cfg.system}`;

    const response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: cfg.system },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1600,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: 'AI service error', details: errText });
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      insight: insight || 'Unable to generate insight at this time.',
      cached: false,
      tarotLine: tarot?.meaning || null,
      tarot: tarot || null,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
