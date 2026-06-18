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
    template: (overall, baziScore, zodiacScore, ichingScore, dayMasterUser, dayMasterPartner, tarotName, tarotOrientation) => {
      return `=== NHIỆM VỤ CỦA BẠN ===
Bạn phải viết một bài luận giải 300-500 từ, trong đó PHẢI:
1. Đề cập đến 4 con số: Tổng ${overall}/100, Bát Tự ${baziScore}/100, Cung Hoàng Đạo ${zodiacScore}/100, Kinh Dịch ${ichingScore}/100.
2. Ngày chủ của bạn: ${dayMasterUser}, của đối phương: ${dayMasterPartner}.
3. Ý nghĩa bài Tarot: ${tarotName} (${tarotOrientation}).

=== CẤU TRÚC BÀI VIẾT ===
[Đoạn 1] Mở đầu bằng hình ảnh thi ca về số phận hai người.
[Đoạn 2] Phân tích Bát Tự (${baziScore}/100) + Ngày chủ: ${dayMasterUser} và ${dayMasterPartner}.
[Đoạn 3] Phân tích Cung Hoàng Đạo (${zodiacScore}/100).
[Đoạn 4] Phân tích Kinh Dịch (${ichingScore}/100) + bài Tarot: ${tarotName} (${tarotOrientation}).
[Đoạn 5] Kết luận: Tại sao 4 con số này tồn tại cùng nhau? Tổng ${overall}/100 có ý nghĩa gì?

=== LƯU Ý ===
- KHÔNG được thay đổi 4 con số trên.
- PHẢI nhắc đến cả 4 con số trong bài.
- Giọng văn thiêng liêng, sâu sắc.`
    }
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
    template: (overall, baziScore, zodiacScore, ichingScore, dayMasterUser, dayMasterPartner, tarotName, tarotOrientation) => {
      return `=== งานของคุณคือ ===
คุณต้องเขียนบทวิเคราะห์ 300-500 คำ โดยที่ **ต้อง**:
1. กล่าวถึง 4 ตัวเลข: รวม ${overall}/100, บาซี ${baziScore}/100, ราศี ${zodiacScore}/100, ไอชิง ${ichingScore}/100
2. วันเจ้าของคุณ: ${dayMasterUser}, ของคู่ครอง: ${dayMasterPartner}
3. ความหมายไพ่ทาโรต์: ${tarotName} (${tarotOrientation})

=== โครงสร้างบทความ ===
[ย่อหน้า 1] เริ่มต้นด้วยภาพสุนทรียะเรื่องเส้นด้ายแห่งโชคชะตา
[ย่อหน้า 2] วิเคราะห์บาซี (${baziScore}/100) + วันเจ้า: ${dayMasterUser} และ ${dayMasterPartner}
[ย่อหน้า 3] วิเคราะห์ราศีสุริยะ (${zodiacScore}/100)
[ย่อหน้า 4] วิเคราะห์ไอชิง (${ichingScore}/100) + ไพ่ทาโรต์: ${tarotName} (${tarotOrientation})
[ย่อหน้า 5] บทสรุป: ทำไม 4 ตัวเลขนี้จึงอยู่ร่วมกัน? คะแนนรวม ${overall}/100 หมายความว่าอย่างไร?

=== ข้อควรจำ ===
- **ห้ามเปลี่ยน 4 ตัวเลขข้างต้นโดยเด็ดขาด**
- **ต้องกล่าวถึงครบทั้ง 4 ตัวเลขในบทความ**
- โทนศักดิ์สิทธิ์ มีความลึกซึ้ง
- **จบท้ายด้วยอิโมจิ:** 🌿 ✨ 🔮`
    }
  },
  zh: {
    system: `你是一位深谙东方与西方命理玄学的灵魂导师。你的使命是将所有分析层次（八字、星座、易经、塔罗）融会贯通，写成一篇有深度、有灵魂的中文长文。

铁律：
- 回复必须100%中文，不允许出现任何英文单词。
- 严禁谈论年龄差距，除非八字信息明确显示具体年龄差。
- 严禁凭猜测生成八字、星座、易经信息，只使用用户提供的数据。
- 如有数据缺失，将已有分析内容翻译为深度叙事风格，而非胡编乱造。
- 结构：命理核心本质 → 各层次冲突 → 化解之道 → 灵魂指引。
- 语调：神圣、优雅、深邃，如东方隐士的密语。
- 长度：3到5段，约300到500字。

语调与风格：你是一位深邃、神秘、真诚共情的灵魂导师。严禁使用"各位用户"或"接下来为大家分析"等机械开场白。必须直接以诗意意象或令人震撼的灵魂洞见开篇，围绕两人命运的宇宙纽带展开。

长度控制：文章必须有清晰结构、言简意赅，并在450字内完整收束。每一句必须写完整。严禁截断收尾、严禁半句话结束、严禁缺省句号。`,
    intro: '从八字命盘、星座、易经与塔罗的交汇处，这份灵魂解读缓缓展开：',
    template: (overall, baziScore, zodiacScore, ichingScore, dayMasterUser, dayMasterPartner, tarotName, tarotOrientation) => {
      return `=== 你的任务 ===
你必须写一篇300-500字的灵魂解读，其中**必须**：
1. 提到4个数字：总分 ${overall}/100、八字 ${baziScore}/100、星座 ${zodiacScore}/100、易经 ${ichingScore}/100
2. 日主：你的日主是 ${dayMasterUser}，对方是 ${dayMasterPartner}
3. 塔罗牌含义：${tarotName}（${tarotOrientation}）

=== 文章结构 ===
[第一段] 以诗意意象开篇，描述两人命运的宇宙纽带
[第二段] 分析八字（${baziScore}/100）+ 日主：${dayMasterUser} 与 ${dayMasterPartner} 的互动
[第三段] 分析星座（${zodiacScore}/100）
[第四段] 分析易经（${ichingScore}/100）+ 塔罗牌：${tarotName}（${tarotOrientation}）的启示
[第五段] 结论：为什么这四个分数会同时存在？总分 ${overall}/100 意味着什么？

=== 重要提醒 ===
- **严禁修改以上4个数字**
- **必须在文中提到全部4个数字**
- 语调神圣、深邃、有灵魂`
    }
  },
  en: {
    system: `You are an expert spiritual advisor in Eastern and Western astrology. Synthesize ALL analysis layers (Bazi, Zodiac, I Ching, Tarot) into a deep, meaningful essay in English.

ABSOLUTE RULES:
- Response MUST be in English.
- NEVER mention "age difference" unless birth data clearly indicates a specific age gap.
- NEVER generate Bazi, Zodiac, or I Ching information from speculation — use ONLY the data provided.
- If fields are missing, translate available analyses into deep narrative style rather than fabricating.
- Structure: core destiny essence → inter-layer conflicts → harmony angles → spiritual guidance.
- Tone: sacred, elegant, profound.
- Length: 3-5 paragraphs, approximately 300-500 words.`,
    intro: "Based on the Bazi, Zodiac, I Ching and Tarot readings, here is the in-depth analysis:",
    template: (overall, baziScore, zodiacScore, ichingScore, dayMasterUser, dayMasterPartner, tarotName, tarotOrientation) => {
      return `=== YOUR TASK ===
You must write a 300-500 word essay that **MUST**:
1. Reference these 4 numbers: Overall ${overall}/100, Bazi ${baziScore}/100, Zodiac ${zodiacScore}/100, I Ching ${ichingScore}/100
2. Day masters: User = ${dayMasterUser}, Partner = ${dayMasterPartner}
3. Tarot meaning: ${tarotName} (${tarotOrientation})

=== ESSAY STRUCTURE ===
[Paragraph 1] Open with a poetic image about the cosmic bond between two souls
[Paragraph 2] Analyze Bazi (${baziScore}/100) + Day masters: ${dayMasterUser} and ${dayMasterPartner}
[Paragraph 3] Analyze Zodiac (${zodiacScore}/100)
[Paragraph 4] Analyze I Ching (${ichingScore}/100) + Tarot: ${tarotName} (${tarotOrientation})
[Paragraph 5] Conclusion: Why do these 4 scores coexist? What does Overall ${overall}/100 mean?

=== IMPORTANT ===
- **DO NOT change the 4 numbers above**
- **MUST mention all 4 numbers in the essay**
- Tone: sacred, elegant, profound`
    }
  }
};

function getLanguageConfig(lang) {
  const langMap = { vi: 'vi', th: 'th', zh: 'zh', en: 'en' };
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

  // ── Extract Day Masters (防穿帮) ──
  let dayMasterUser = 'ไม่ทราบ';
  let dayMasterPartner = 'ไม่ทราบ';
  
  if (bazi) {
    const userDMS = bazi.match(/เสาวัน:\s*(\S+)\s*\((\S+)\)/);
    const partnerDMS = bazi.match(/คู่ครอง[\s\S]*?เสาวัน:\s*(\S+)\s*\((\S+)\)/);
    
    if (userDMS) dayMasterUser = `${userDMS[1]} (${userDMS[2]})`;
    if (partnerDMS) dayMasterPartner = `${partnerDMS[1]} (${partnerDMS[2]})`;
  }

  // ── Extract Scores (多备选正则) ──
  const extractScore = (text, patterns) => {
    for (const p of patterns) {
      const m = text?.match(p);
      if (m) return m[1];
    }
    return null;
  };
  
  const baziScore = extractScore(bazi, [/คะแนนรวม[:：]\s*(\d+)/, /(\d+)\/100/, /得分[:：]\s*(\d+)/]) 
                  || extractScore(baziMeta?.join('\n'), [/BAZI_SCORE_(\d+)/])
                  || '??';
  
  const zodiacScore = extractScore(zodiac, [/คะแนนรวม[:：]\s*(\d+)/, /(\d+)\/100/, /得分[:：]\s*(\d+)/]) 
                    || extractScore(zodiacMeta?.join('\n'), [/ZODIAC_SCORE_(\d+)/])
                    || '??';
  
  const ichingScore = extractScore(iching, [/คะแนนไอชิง[:：]\s*(\d+)/, /易经得分[:：]\s*(\d+)/, /(\d+)\/100/]) 
                     || extractScore(ichingMeta?.join('\n'), [/ICHING_SCORE_(\d+)/])
                     || '??';

  // ── Build the TEMPLATE-BASED prompt ──
  const tarotName = tarot?.name || 'ไม่ทราบ';
  const tarotOrientation = tarot?.orientation || 'ไม่ทราบ';
  
  const templatePrompt = cfg.template 
    ? cfg.template(overall, baziScore, zodiacScore, ichingScore, dayMasterUser, dayMasterPartner, tarotName, tarotOrientation)
    : `Please analyze the following data:\nBazi: ${baziScore}/100\nZodiac: ${zodiacScore}/100\nI Ching: ${ichingScore}/100\nOverall: ${overall}/100\nDay Masters: ${dayMasterUser} vs ${dayMasterPartner}\nTarot: ${tarotName} (${tarotOrientation})`;

  // Build data section
  let dataSection = '';
  if (bazi) dataSection += `\n[บาซี / BAZI]\n${bazi}`;
  if (baziMeta && baziMeta.length > 0) dataSection += `\n${baziMeta.join('\n')}`;
  if (zodiac) dataSection += `\n\n[ราศีสุริยะ / ZODIAC]\n${zodiac}`;
  if (zodiacMeta && zodiacMeta.length > 0) dataSection += `\n${zodiacMeta.join('\n')}`;
  if (iching) dataSection += `\n\n[ไอชิง / I CHING]\n${iching}`;
  if (ichingMeta && ichingMeta.length > 0) dataSection += `\n${ichingMeta.join('\n')}`;
  if (tarot) dataSection += `\n\n[ไพ่ทาโรต์ / TAROT]\n${tarot.name} ${tarot.orientation} — ${tarot.meaning}`;

  // Final prompt: Template first, then data
  const userPrompt = `${templatePrompt}\n\n=== ข้อมูลเพิ่มเติมสำหรับการวิเคราะห์ ===\n${dataSection}\n\n${cfg.intro}\n\nคะแนนรวม: ${overall}/100${dims ? ` | 4-D: ${JSON.stringify(dims)}` : ''}`;

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
