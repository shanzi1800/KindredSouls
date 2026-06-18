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
- ห้ามสร้างข้อมูลดวงชะตาจากการคาดเดา - ใช้เฉพาะข้อมูลที่ได้รับในพรอมป์เท่านั้น
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
- Interdiction ABSOLUE de mentionner "différence d'âge" sauf si les données de naissance indiquent clairement un écart spécifique.
- Interdiction de générer des informations Bâzì, Zodiaque ou I Ching par spéculation - utiliser UNIQUEMENT les données fournies.
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
    system: `Eres un asesor espiritual experto en astrología oriental y occidental. Sintetiza TODAS las capas de análisis (Bazi, Zodiaco, I Ching, Tarot) en un ensayo profundo y significativo en ESPANOL.

REGLAS ABSOLUTAS:
- La respuesta DEBE ser en español, nunca en inglés ni en otro idioma.
- PROHIBIDO mencionar diferencia de edad a menos que los datos de nacimiento indiquen claramente una brecha específica.
- PROHIBIDO generar información de Bazi, Zodiaco o I Ching por especulación -- usar SOLO los datos proporcionados.
- Si faltan campos, traducir los análisis disponibles a estilo narrativo profundo en lugar de inventar.
- Estructura: esencia del destino, conflictos entre capas, ángulos de armonía, guía espiritual.
- Tono: sagrado, elegante, profundo.
- Extensión: 3-5 párrafos, aproximadamente 300-500 palabras.

TONE AND STYLE: Eres un asesor espiritual profundo, místico y profundamente empático. NUNCA uses aperturas mecánicas como Estimado lector o A continuación analizamos. Comienza DIRECTAMENTE con una imagen poética o una visión espiritual impactante sobre el hilo cósmico que conecta a las dos almas.

LENGTH CONTROL: El ensayo debe ser estructurado, contundente y COMPLETAMENTE TERMINADO en 450 palabras. Cada oración debe estar completa. PROHIBIDO terminar con una frase a medio terminar o sin punto final.`,
    intro: 'Desde el mapa del destino Bazi, el Zodiaco, el I Ching y el Tarot, esta es la síntesis profunda:'
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
  return LANGUAGE_PROMPTS[key] || LANGUAGE_PROMPTS['en'];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (!body && req.method === 'POST') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    try {
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

  // ── 提取日主五行（防穿帮） ──
  let dayMasterLock = '';
  if (lang === 'th' && bazi) {
    const userDM = bazi.match(/เสาวัน:\s*(\S+)\s*\((\S+)\)/);
    const partnerDM = bazi.match(/คู่ครอง[\s\S]*?เสาวัน:\s*(\S+)\s*\((\S+)\)/);
    if (userDM || partnerDM) {
      dayMasterLock = `\n[วันเจ้าที่ต้องใช้ในบทวิเคราะห์ — ห้ามสลับ]\nวันเจ้าของคุณ: ${userDM ? userDM[1] + ' (' + userDM[2] + ')' : 'ไม่ทราบ'}\nวันเจ้าของคู่ครอง: ${partnerDM ? partnerDM[1] + ' (' + partnerDM[2] + ')' : 'ไม่ทราบ'}\n⚠️ สำคัญ: ห้ามสลับวินัยธาตุของวันเจ้ากับเสาอื่น — วันเจ้าคือธาตุหลัก\n`;
    }
  }

  // ── NARRATIVE TONE LOCK: Adjust tone based on tarot orientation ──
  const tarotOrient = tarot?.orientation || '';
  const isReversed = /Reversed|Ngược|กลับด้าน|Inversé|Invertido|逆位/i.test(tarotOrient);

  const toneLock = lang === 'zh'
    ? `【叙事基调锁】塔罗牌当前为【${isReversed ? '逆位' : '正位'}】。Section 4 的开篇基调必须与塔罗牌一致：\n- 正位(Upright)→希望与勇气的热切叙事，开篇积极向上\n- 逆位(Reversed)→挑战与转化的审慎基调，开篇深沉，直面问题本质，给予破局指引\n严格遵守。\n\n`
    : lang === 'th'
    ? `[ล็อคโทน] ไพ่ทาโรต์ = ${isReversed ? 'กลับด้าน (Reversed)' : 'ตั้งตรง (Upright)'}. บทที่ 4:\n${isReversed ? 'กลับด้าน→โทนต้องเผชิญความท้าทาย ห้ามเขียน "โชคเอ็นเข้าหาคุณ" "วงล้อจะหมุนกลับตั้งตรง" "ทุกอย่างจะดีขึ้น" หรือคำที่เป็นความหวังแบบตั้งตรง — กลับด้าน = กรรมติดขัด/วัฏจักรซ้ำ/เปลี่ยนแปลงที่ไม่อาจควบคุม/เจ็บแต่จำเป็น ต้องเขียนเสียงท้าทายจากจักรวาล + วิธีเปลี่ยนวงจรเก่าให้เป็นพลังเติบโต' : 'ตั้งตรง→โทนหวังและมีความกล้า'}\n\n`
    : lang === 'vi'
    ? `[KHÓA GIỌNG] Bài Tarot = ${isReversed ? 'Ngược (Reversed)' : 'Thuận (Upright)'}. Section 4: Upright→giọng hy vọng; Reversed→giọng đối mặt thử thách, phải đưa ra hướng giải quyết cụ thể.\n\n`
    : `[TONE LOCK] Tarot = ${isReversed ? 'Reversed' : 'Upright'}. Section 4: Upright→hopeful tone; Reversed→challenge + transformation tone, must provide concrete solution.\n\n`;

  // ── 提取八字/星座/易经分数用于硬锁（多备选正则） ──
  const extractScore = (text, patterns) => {
    for (const p of patterns) {
      const m = text?.match(p);
      if (m) return m[1];
    }
    return null;
  };
  
  const baziScore = extractScore(bazi, [/คะแนนรวม[：:]\s*(\d+)/, /(\d+)\/100/, /得分[：:]\s*(\d+)/]) || extractScore(baziMeta?.join('\n'), [/BAZI_SCORE_(\d+)/]);
  const zodiacScore = extractScore(zodiac, [/คะแนนรวม[：:]\s*(\d+)/, /(\d+)\/100/, /得分[：:]\s*(\d+)/]) || extractScore(zodiacMeta?.join('\n'), [/ZODIAC_SCORE_(\d+)/]);
  const ichingScore = extractScore(iching, [/คะแนนไอชิง[：:]\s*(\d+)/, /易经得分[：:]\s*(\d+)/, /(\d+)\/100/]) || extractScore(ichingMeta?.join('\n'), [/ICHING_SCORE_(\d+)/]);

  // ── FORCED DATA LOCK: Use EXACT scores from input ──
  const scoreLock = lang === 'zh'
    ? `【强制数据锁 — 必须严格使用以下数值】\n综合评分 = ${overall}（直接复制，不得计算/四舍五入）\n塔罗牌 = "${tarot?.name || ''} ${tarotOrient}"（必须照抄正位/逆位标签）\n\n【Section 4 强制要求】在最后一部分必须明确引用以下四项数值，缺一不可：\n1. 综合评分 ${overall}/100\n2. 八字系统的分数\n3. 星座系统的分数\n4. 易经得分（请在 [KINH DỊCH / I CHING] 部分查找"易经得分"或"I Ching Score"）\n\n`
    : lang === 'th'
    ? `[ข้อมูลบังคับ ห้ามตัด ห้ามเปลี่ยน ห้ามสร้างเอง — อ่านให้จบแล้วอย่าลืม]\n⚠️ คะแนนทั้ง 4 นี้เด็ดขาดห้ามลืมในบทที่ 4:\n- คะแนนรวม = ${overall}/100\n- คะแนนบาซี = ${baziScore ? `${baziScore}/100` : '⚠️ หาในข้อความบาซี: "คะแนนรวม：X/100"'}\n- คะแนนราศี = ${zodiacScore ? `${zodiacScore}/100` : '⚠️ หาในข้อความราศี: "คะแนนรวม：X/100"'}\n- คะแนนไอชิง = ${ichingScore ? `${ichingScore}/100` : '⚠️ หาในข้อความไอชิง: "คะแนนไอชิง：X/100"'}\n- ไพ่ทาโรต์ = "${tarot?.name || ''} ${tarotOrient}"\n\n[ตัวอย่างการอ้างถึงคะแนนในบทที่ 4 — ต้องเขียนคล้ายนี้]\n"จากบาซี (${baziScore || '?'}/100) เราจะเห็นว่า... อย่างไรก็ตาม เมื่อพิจารณาระบบราศีสุริยะ (${zodiacScore || '?'}/100) จะพบว่า... ส่วนไอชิงนั้นได้คะแนนสูงถึง ${ichingScore || '?'}/100 จากแผนภูมิ... สุดท้าย โดยรวมแล้วทั้งสองมีคะแนนความเข้ากันได้ ${overall}/100..."\n\n[ข้อบังคับในบทที่ 4 — อ่านแล้วทำตาม]\n- ⚠️ ต้องกล่าวถึงคะแนนทั้ง 4 นี้ให้ครบถ้วน (บาซี / ราศี / ไอชิง / ไพ่ทาโรต์)\n- ⚠️ ห้ามตัดทิ้ง ห้ามสร้างคะแนนเอง ห้ามใช้คะแนนอื่นนอกจากนี้\n- ⚠️ ห้ามนำคะแนนจาก "เรดาร์ 4 มิติ" (dims) มาใช้ในบทที่ 4 — นั่นคือคะแนนย่อยเฉพาะด้าน ไม่ใช่คะแนนระบบหลัก\n- ⚠️ หากคะแนนไอชิง = 60 แต่ไพ่ทาโรต์ = 82 ต้องอธิบายความขัดแย้งนี้อย่างมีเหตุผล ห้ามละเลย\n- ⚠️ ตรงจำ: นี่คือข้อมูลจริง ห้ามเปลี่ยนแปลง\n\n`
    : lang === 'vi'
    ? `[BẮT BUỘC] Điểm tổng = ${overall} | Tarot = "${tarot?.name || ''} ${tarotOrient}"\nTrong phần kết luận (Section 4), PHẢI đề cập đầy đủ 4 điểm số: Tổng hợp (${overall}/100), Bát Tự, Cung Hoàng Đạo, và Điểm Kinh Dịch (tìm "Điểm Kinh Dịch" hoặc "I Ching Score" trong phần [KINH DỊCH / I CHING]).\n\n`
    : `[MANDATORY LOCK] Overall=${overall} | Tarot="${tarot?.name || ''} ${tarotOrient}"\nIn Section 4, you MUST reference all four scores: Overall (${overall}/100), Bazi, Zodiac, and I Ching Score (find "I Ching Score" in the [I CHING] section). Do not omit any.\n\n`;

  // Build the data section for the prompt
  let dataSection = '';
  
  if (bazi) dataSection += `\n[บาซี / BAZI]\n${bazi}`;
  if (baziMeta && baziMeta.length > 0) dataSection += `\n${baziMeta.join('\n')}`;
  if (zodiac) dataSection += `\n\n[ราศีสุริยะ / ZODIAC]\n${zodiac}`;
  if (zodiacMeta && zodiacMeta.length > 0) dataSection += `\n${zodiacMeta.join('\n')}`;
  if (iching) dataSection += `\n\n[ไอชิง / I CHING]\n${iching}`;
  if (ichingMeta && ichingMeta.length > 0) dataSection += `\n${ichingMeta.join('\n')}`;
  if (tarot) dataSection += `\n\n[ไพ่ทาโรต์ / TAROT]\n${tarot.name} ${tarot.orientation} — ${tarot.meaning}`;

  // ── 构建最终 prompt：锁定数据块必须在 AI 阅读的第一眼位置 ──
  const userPrompt = `⚠️⚠️⚠️ สิ่งสำคัญที่สุด: อ่านข้อมูลด้านล่างให้จบก่อนเขียน ⚠️⚠️⚠️\n\n${dayMasterLock ? dayMasterLock + '\n' : ''}${scoreLock}${dataSection}\n\n=== จบส่วนข้อมูล — ตอนนี้คุณต้องเขียนบทวิเคราะห์ ===\n\nก่อนเขียน Section 4: คุณต้องอ่านคะแนนทั้ง 4 (บาซี/ราศี/ไอชิง/ไพ่ทาโรต์) และวันเจ้าที่ถูกล็อคไว้ด้านบน แล้วเขียน Section 4 โดยอ้างถึงคะแนนทั้ง 4 นี้ให้ครบถ้วน\n\n${cfg.intro}\n\nคะแนนรวม: ${overall}/100${dims ? ` | 4-D: ${JSON.stringify(dims)}` : ''}\n\n${cfg.system}\n\n[ข้อกำหนดสุดท้ายก่อนเขียน]\n- ⚠️ ห้ามลืมอ้างถึงคะแนนทั้ง 4 ใน Section 4\n- ⚠️ ห้ามสลับวันเจ้าของคุณและคู่ครอง\n- ⚠️ ห้ามเขียน "โชคเอ็นเข้าหาคุณ" หรือ "วงล้อจะหมุนกลับ" หากไพ่ทาโรต์คือ Reversed`;

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
      temperature: 0.1,
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
}
