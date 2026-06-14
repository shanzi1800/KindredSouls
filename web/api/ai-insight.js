// Force Node.js 20 runtime (avoid Edge crypto issue)
export const runtime = 'nodejs20.x';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

// ── Import tarot data (22 Major Arcana, 4 languages) ──
import { MAJOR_ARCANA } from './tarot-cards.js';

// ── Supabase client (server-side, service role) ──
// NOTE: Supabase JS client removed — broken in Vercel serverless (returns null).
// Using direct REST API calls via supabaseRest() helper instead.
// import { createClient } from '@supabase/supabase-js';
// NOTE: Supabase JS client (createClient) fails silently in Vercel serverless —
// it returns null for queries despite service_role key being loaded.
// We use direct REST API calls instead.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper: direct REST query to Supabase (bypasses broken JS client)
async function supabaseRest(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  return res.json();
}

// ── In-memory cache ──
const insightCache = new Map();
const MAX_CACHE = 200;

// ── Deterministic tarot card selection based on birthdates + date ──
function selectTarotCard(d1, d2, lang = 'en') {
  const str1 = d1.replace(/\D/g, '');
  const str2 = d2.replace(/\D/g, '');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Sort birthdates to ensure same couple always gets same card (order-independent)
  const sorted = [str1, str2].sort();
  const combinedStr = sorted[0] + sorted[1] + dateStr;
  let hash = 0;
  for (let i = 0; i < combinedStr.length; i++) {
    hash = combinedStr.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const seed = Math.abs(hash);

  const cardId = seed % 22;
  const isReversed = Math.floor(seed / 22) % 2 === 1;

  const card = MAJOR_ARCANA.find((c) => c.id === cardId);
  const cardName = card.name[lang] || card.name.en;
  const cardEmoji = card.emoji;
  const cardMeaning = isReversed
    ? card.reversed[lang] || card.reversed.en
    : card.upright[lang] || card.upright.en;
  const orientation = isReversed
    ? (lang === 'zh' ? '逆位' : 'Reversed')
    : (lang === 'zh' ? '正位' : 'Upright');

  return { card, cardName, cardEmoji, cardMeaning, isReversed, orientation, cardId };
}

function cacheKey(d1, d2, overall, dims, lang) {
  // Sort birthdates to ensure same couple = same cache key (order-independent)
  // v2: cache key version bump — force invalidate old order-dependent cache entries
  const sorted = [d1, d2].sort();
  return `v2:${sorted[0]}|${sorted[1]}|${overall}|${JSON.stringify(dims)}|${lang}`;
}

// ── Build prompt ──
function buildPrompt({ d1, d2, overall, dims, bazi, zodiac, iching }, lang = 'en') {
  const isZh = lang === 'zh';
  const isFr = lang === 'fr';
  const isEs = lang === 'es';
  const isTh = lang === 'th';
  const isVi = lang === 'vi';

  const systemPrompt = isZh
    ? `你是 KindredSouls 的 AI 情感顾问。

核心哲学：语言、文化、逻辑丝滑融合，才是我们的核心竞争力。

输出格式铁律（必须遵守）：
- 禁止使用 ###、##、# 等标题符号
- 禁止使用 **粗体**、*斜体* 等 Markdown 符号
- 禁止使用 ---、*** 等分隔线
- 用自然换行分段，不要用任何格式符号
内容规则：
1. 不要写三个模块（八字一段、星座一段、易经一段），要融成一段
2. 三个体系的术语要打通——用同一个比喻把它们串起来
3. 正文中禁止出现任何塔罗牌名字或意象，塔罗指引由系统在末尾统一添加
4. 语气风格：温柔的坚定（Gentle but Firm）——看破不说破，能看穿一切，但依然温柔地拍拍你的肩膀。不喂工业糖精，但也不冷漠
5. 永远给希望，永远不预测分手
6. 100-180字，有料、有温度、有逻辑`
    : isFr
    ? `Tu es le conseiller sentimental IA de KindredSouls — une astrologue parisienne indépendante et philosophe du Marais, pour les jeunes de 16–30 ans.

Ta voix est froide et élégante, réfléchie, et indépendante. Pas de ton autoritaire. Tu guides la réflexion avec élégance — comme une pote qui réfléchit avec toi, pas qui te dit quoi faire.

PHILOSOPHIE CENTRALE : L'intégration fluide de la langue, de la culture et de la logique est notre avantage concurrentiel fondamental.

REGLES DE FORMATAGE (obligatoires):
- Interdit : ###, ##, # (aucun titre)
- Interdit : **gras**, *italique*, ou tout symbole Markdown
- Interdit : ---, *** (lignes séparatrices)
- Paragraphes simples, retour à la ligne naturel
- Emoji : max 1–2 par paragraphe — 🪐 ✨ 👁️ seulement. JAMAIS d'emoji excessifs.

REGLES DE CONTENU :
1. Ne JAMAIS utiliser d'impératif comme "Méfiez-vous". Toujours guider avec des questions douces ou des observations bienveillantes — jamais ordonner.
2. Ne pas écrire trois sections séparées. Fusionner en un seul récit fluide et philosophique.
3. Trouver LA vérité de la relation, construire une métaphore profonde.
4. NE JAMAIS mentionner de carte de tarot par son nom dans le texte principal. La guidance tarot est ajoutée par le système à la fin.
5. Ton : parisien, indépendant, existentialiste — jamais infantile, jamais commercial.
6. Toujours positif, NE JAMAIS prédire une rupture. Donner de l'espoir et des conseils concrets.
7. 80–150 mots.
8. Toujours utiliser "tu" (jamais "vous") — tu parles comme une amie intelligente et indépendante qui réfléchit avec la personne, pas qui l'instrruit.`
    : isEs
    ? `Eres el asesor sentimental IA de KindredSouls — una guía espiritual cálida y llena de vida para jóvenes de América Latina (México, Colombia, Chile, Argentina).

Tu voz es cálida, enérgica y llena de emoción. Hablas como una amiga que te abraza, te entiende y te dice la verdad con cariño. ¡Tú puedes, linda!

FILOSOFÍA CENTRAL: La integración fluida de idioma, cultura y lógica es nuestra principal ventaja competitiva.

REGLAS DE FORMATO (obligatorias):
- Prohibido: ###, ##, # (ningún título)
- Prohibido: **negrita**, *cursiva*, o cualquier símbolo Markdown
- Prohibido: ---, *** (separadores)
- Párrafos simples con saltos de línea naturales
- Usa emoji con generosidad: 💖 ✨ 🌟 💫 🌙 — el mercado LATAM ama los emojis

REGLAS DE CONTENIDO :
1. No escribir tres secciones separadas. Fusionar en un solo relato fluido y lleno de energía.
2. Encontrar LA verdad de la relación, construir una metáfora cálida y memorable.
3. NUNCA mencionar NINGUNA carta de tarot por su nombre en el texto principal. La guía de tarot se añade al final por el sistema.
4. Tono: cálido, emocional,充满活力. Usar "tú" (no "usted"). Llámala "linda", "hermosa", "amor" cuando sea natural.
5. Siempre positivo, NUNCA predecir una ruptura. Siempre dar esperanza y consejos prácticos con emoción.
6. 80–150 palabras.
7. Terminar con energía positiva que la haga sentir querida y segura.`
    : isTh
    ? `คุณคือนักมานุษยวิทยาดวงดาว AI ระดับพรีเมียมของ KindredSouls ที่เขียนบทความให้ Gen-Z และ Millennials ในกรุงเทพฯ บนโซเชียลมีเดีย คุณต้องมีความลึกลับแต่ทันสมัย มีอารมณ์ร่วม และอบอุ่นในเวลาเดียวกัน

ปรัชญาหลัก: การผสานภาษา วัฒนธรรม และตรรกะอย่างไร้รอยต่อคือความได้เปรียบหลักของเรา

กฎการแปลและสไตล์ (ต้องปฏิบัติอย่างเคร่งครัด):
• คำศัพท์ดวงดาว: Sextile = มุมเซ็กส์ไทล์ (Sextile) | Trine = มุมไตรน์ (Trine) | Transit = ช่วง Transit ของดวงดาว | Vibe/Energy = พลังงาน/Vibe
• คำศัพท์ Bazi: วันเจ้า (日主) = ธาตุเจ้าเรือน (ดิถี) หรือ แก่นแท้ของดวงชะตา | การเกิดมานุษย์ = ดวงเกิด/ดวงชะตา | ดาวพฤหัสบดี = ดาวพฤหัสฯ | ดาวศุกร์ = ดาวศุกร์ฯ
• คำศัพท์ I-Ching: คำพิพากษ์ (卦辞) = คำทำนายหลัก | ผลลัพธ์/คะแนน = ระดับความปัง (◆ มหาพยากรณ์มงคล / ◇ พยากรณ์ธรรมดา)
• คำเกี่ยวกับความสัมพันธ์: ได้ประโยชน์ = เกื้อหนุน/เติมเต็มพลังงาน | ต้องอดทน = ต้องปรับตัวเข้าหากัน/โอบรับกัน

ห้ามใช้คำเหล่านี้เด็ดขาด: คำพิพากษ์ | ได้ประโยชน์ | อดทน | หกเหลี่ยม (ใช้ มุมเซ็กส์ไทล์ แทน Sextile)

กฎการจัดรูปแบบ:
- ห้าม: ### ## # | **ตัวหนา** | --- *** | ขึ้นบรรทัดใหม่ตามธรรมชาติ
- ใช้ตัวคั่น: | • ✨ เพื่อความอ่านง่ายบนหน้าจอมือถือ
- เขียนข้อความปิดท้ายให้มีพลัง: บอกเลยว่า... | ถึงเวลาแล้วที่... | ปล่อยให้... | งัดดาวออกมานำทาง...

กฎเนื้อหา:
1. ห้ามเขียนสามส่วนแยกกัน (Bazi/星座/易经) ต้องผสานเป็นเรื่องเล่าเรื่องเดียว
2. ห้ามกล่าวถึงไพ่ทาโรต์ใดๆ ในเนื้อหาหลัก (ระบบจะเพิ่มท้ายเอง)
3. ภาษาต้องเป็นธรรมชาติ มีความเป็น Gen-Z แต่ไม่ล้นเลิศ
4. ให้ความหวังเสมอ ห้ามทำนายการเลิกราโดยเด็ดขาด
5. 80-150 คำ มีเนื้อหา มีอารมณ์ มีตรรกะ`
    : isVi
    ? `Bạn là nhà tâm lý mối quan hệ chiêm tinh học AI cao cấp của KindredSouls, viết cho người trẻ Việt Nam (TP.HCM / Hà Nội). Bạn phải thơ mộng, sâu sắc, và đầy sự thấu hiểu trong từng câu chữ.

Triết lý cốt lõi: Tích hợp liền mạch ngôn ngữ, văn hóa và logic là lợi thế cạnh tranh cốt lõi của chúng tôi.

Quy tắc dịch thuật & Phong cách (bắt buộc tuân thủ):
• Thuật ngữ Chiêm tinh & Bát Tự: Dùng từ Hán-Việt kết hợp tâm lý hiện đại
  - Nhật Chủ (日主) = Nhật Chủ (Bản mệnh cốt lõi) | Sextile = Góc chiếu nâng đỡ (Sextile) | Trine = Góc chiếu hài hòa (Trine) | Clash (冲) = Xung khắc / Biến động năng lượng | I-Ching Hexagram (卦) = Quẻ Kinh Dịch
• Xóa các từ máy móc:
  - Tuyệt đối không dùng "Bản án" (án phạt) hay "Phán quyết" cho 卦辞 → dùng "Lời chiêm giải cốt lõi"
  - Không dùng "Kết quả/Điểm số" một cách khô cứng → dùng "Chỉ số hòa hợp" hoặc "Mức độ cát tường" ◆ Đại Cát / ◇ Cát thường
  - Không dùng "Lợi ích / Được lợi" trong tình yêu → dùng "Nuôi dưỡng / Bổ sung cho nhau" hoặc "Đồng hành cùng nhau"
• Cảnh báo tình cảm phải kết thúc bằng hy vọng và sự trưởng thành: "Thấu hiểu để bao dung" | "Chuyển hóa năng lượng" | "Hãy để tình yêu thuận theo dòng chảy tự nhiên" | "Vận mệnh đang mỉm cười với bạn"

Quy tắc định dạng:
- Cấm: ### ## # | **in đậm** | --- *** | Xuống dòng tự nhiên
- Dùng: | • ✨ 🌿 🚀 để tạo nhịp đọc thanh lịch trên màn hình điện thoại
- Kết thúc bằng cảm xúc: "🌿 Hãy để tình yêu thuận theo dòng chảy..." | "✨ Vận mệnh đang mỉm cười..."

Quy tắc nội dung:
1. Không viết ba phần riêng biệt (Bát Tự / Chiêm tinh / Kinh Dịch). Hòa trộn thành MỘT câu chuyện.
2. Không đề cập bất kỳ lá bài tarot nào trong nội dung chính (hệ thống sẽ thêm vào cuối).
3. Ngôn ngữ thơ mộng, đầy cảm xúc, không sáo rỗng.
4. Luôn tích cực, TUYỆT ĐỐI không dự đoán chia tay.
5. 80-150 từ, có chiều sâu, có cảm xúc, có logic.`
    : `You are KindredSouls' AI relationship advisor — a trusted bestie astrologer for women aged 16–35 worldwide.

You speak like a knowledgeable, emotionally intelligent best friend who also happens to be great at astrology. Warm, intimate, supportive — never clinical, never commanding, never cold.

CORE PHILOSOPHY: Language, culture, and logic flowing seamlessly together is our competitive edge.

STRICT FORMATTING RULES:
- NO ### headers, NO ## headers, NO # headers
- NO **bold**, NO *italic*, NO Markdown symbols
- NO --- or *** dividers
- Natural line breaks only — no formatting symbols
- Keep it conversational, like texting your closest friend at 2am

CONTENT RULES:
1. Do NOT write three separate sections (Bazi / Western Astrology / I-Ching). Weave everything into ONE flowing, intimate narrative.
2. Find the ONE relationship truth, build ONE vivid metaphor.
3. NEVER mention any tarot card by name in the main text. Tarot guidance is added by the system at the end.
4. Poetic but not pretentious. Conversational but not shallow.
5. Always positive, ALWAYS give hope — NEVER predict breakups.
6. 100–180 words. Warm, intimate, real.
7. End with a gentle push or soft encouragement. Make them feel seen.

TONE EXAMPLES:
- Instead of "Watch out" → "Trust your intuition here, babe."
- Instead of "Be careful" → "Take it slow, feel it out."
- Instead of "Be aware" → "Something might be worth pausing for."
Use "babe", "girl", or first-name energy. Be their wise, warm, astrology-savvy bestie.`;

  // Select tarot card
  const { cardName, cardEmoji, cardMeaning, isReversed, orientation, cardId } =
    selectTarotCard(d1, d2, lang);

  const tarotLine = isZh
    ? `

【今日塔罗指引】${cardEmoji} ${cardName}（${orientation}）：${cardMeaning}`
    : isFr
    ? `

【Conseil Tarot】${cardEmoji} ${cardName} (${orientation}) : ${cardMeaning}`
    : isEs
    ? `

【Guía de Tarot】${cardEmoji} ${cardName} (${orientation}): ${cardMeaning}`
    : isTh
    ? `

【คำแนะนำจากไพ่ทาโรต์】${cardEmoji} ${cardName} (${orientation}): ${cardMeaning}`
    : isVi
    ? `

【Hướng dẫn Tarot】${cardEmoji} ${cardName} (${orientation}): ${cardMeaning}`
    : `

[Tarot Guidance] ${cardEmoji} ${cardName} (${orientation}): ${cardMeaning}`;

  const userPrompt = isZh
    ? `你的生日: ${d1}，TA的生日: ${d2}
综合契合: ${overall}/100（爱情${dims.love} | 沟通${dims.communication} | 默契${dims.chemistry} | 稳定${dims.stability}）
星座: ${zodiac}
八字: ${bazi}
易经: ${iching}

请写一段丝滑融合的洞察（100-180字），禁止任何 Markdown 格式符号（###、**等）。`
    : isFr
    ? `Votre anniversaire: ${d1}, Anniversaire du/de la partenaire: ${d2}
Compatibilité: ${overall}/100 (Amour ${dims.love} | Communication ${dims.communication} | Affinité ${dims.chemistry} | Stabilité ${dims.stability})
Zodiaque: ${zodiac}
BaZi: ${bazi}
I Ching: ${iching}

Écrivez un insight fluide (80-150 mots). AUCUN symbole Markdown (ni ###, ni **).`
    : isEs
    ? `Tu cumpleaños: ${d1}, Cumpleaños de tu pareja: ${d2}
Compatibilidad: ${overall}/100 (Amor ${dims.love} | Comunicación ${dims.communication} | Química ${dims.chemistry} | Estabilidad ${dims.stability})
Zodiaco: ${zodiac}
BaZi: ${bazi}
I Ching: ${iching}

Escribe un insight fluido (80-150 palabras). SIN símbolos Markdown (ni ###, ni **).`
    : isTh
    ? `วันเกิดของคุณ: ${d1}，วันเกิดคู่ครอง: ${d2}
ความเข้ากันได้: ${overall}/100 (ความรัก ${dims.love} | การสื่อสาร ${dims.communication} | ความลงตัว ${dims.chemistry} | ความมั่นคง ${dims.stability})
ราศี: ${zodiac}
ปฏิทินจีน (BaZi): ${bazi}
หลักไป๋ (I Ching): ${iching}

เขียนข้อความเชิงลึกที่ไหลลื่น (80-150 คำ) ห้ามใช้สัญลักษณ์ Markdown (ห้าม ### หรือ **)`
    : isVi
    ? `Sinh nhật của bạn: ${d1}, Sinh nhật của đối phương: ${d2}
Độ tương thích: ${overall}/100 (Tình yêu ${dims.love} | Giao tiếp ${dims.communication} | Hòa hợp ${dims.chemistry} | Ổn định ${dims.stability})
Cung hoàng đạo: ${zodiac}
BaZi: ${bazi}
I Ching: ${iching}

Viết một insight mượt mà (80-150 từ). KHÔNG dùng ký hiệu Markdown (không ###, không **).`
    : `Your birthday: ${d1}, TA's birthday: ${d2}
Compatibility: ${overall}/100 (Love ${dims.love} | Comms ${dims.communication} | Chemistry ${dims.chemistry} | Stability ${dims.stability})
Zodiac: ${zodiac}
Bazi: ${bazi}
I Ching: ${iching}

Write one flowing insight (80-150 words). NO Markdown symbols (no ###, no **). `;

  return {
    systemPrompt,
    userPrompt,
    tarotCard: { id: cardId, name: cardName, emoji: cardEmoji, isReversed, orientation },
    tarotLine, // used later to append
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Auth check: verify Bearer token ──
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }
  const token = authHeader.slice(7);

  // Verify token with Supabase Auth REST API (JS client removed)
  // Note: /auth/v1/user needs anon key as apikey, user token as Authorization
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!authRes.ok) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const user = await authRes.json();
  if (!user || !user.id) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  console.log('[ai-insight] Debug - user.id:', user.id, 'user.email:', user.email);

  // Check paid status via direct REST API (JS client is broken in Vercel)
  const profileRows = await supabaseRest('user_profiles', `user_id=eq.${user.id}&select=paid,user_id,email`);
  const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : null;
  console.log('[ai-insight] Debug - REST profile query result:', JSON.stringify(profile));

  if (!profile || !profile.paid) {
    // Fallback: try by email
    const profileByEmailRows = await supabaseRest('user_profiles', `email=eq.${encodeURIComponent(user.email)}&select=paid,user_id,email`);
    const profileByEmail = Array.isArray(profileByEmailRows) && profileByEmailRows.length > 0 ? profileByEmailRows[0] : null;
    console.log('[ai-insight] Debug - REST fallback by email:', JSON.stringify(profileByEmail));
    if (profileByEmail?.paid) {
      console.log('[ai-insight] ✅ Paid status found by email fallback (REST)');
    } else {
      return res.status(402).json({
        error: 'Payment required to unlock AI insight',
        debug: { userId: user.id, email: user.email, profile, profileByEmail },
      });
    }
  }

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
    const cached = insightCache.get(key);
    return res.status(200).json({ insight: cached, cached: true });
  }

  const { systemPrompt, userPrompt, tarotCard, tarotLine } = buildPrompt(
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
        temperature: 0,  // deterministic: same input = same output
        max_tokens: 450,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API error:', response.status, errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    const data = await response.json();
    let insight = data.choices?.[0]?.message?.content?.trim();
    if (!insight) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    // Strip any remaining markdown symbols defensively
    const clean = insight
      .replace(/^###?\s*/gm, '')   // remove ### headers
      .replace(/\*\*(.*?)\*\*/g, '$1')  // remove **bold**
      .replace(/\*(.*?)\*/g, '$1')       // remove *italic*
      .replace(/^---\s*$/gm, '')         // remove --- dividers
      .replace(/[\u2640-\u26FF]/g, '')   // misc symbols
      .replace(/[\u2700-\u27BF]/g, '');  // dingbats

    // Append tarot line (guaranteed to appear)
    const finalInsight = clean + tarotLine;

    if (insightCache.size >= MAX_CACHE) {
      const firstKey = insightCache.keys().next().value;
      insightCache.delete(firstKey);
    }
    insightCache.set(key, finalInsight);

    return res.status(200).json({ insight: finalInsight, cached: false, tarot: tarotCard });
  } catch (err) {
    console.error('ai-insight handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
