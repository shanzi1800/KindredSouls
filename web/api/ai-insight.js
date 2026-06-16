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
/**
 * ═══════════════════════════════════════════════════════════════════
 * 🔒  PROMPT PROTECTION LOCK — 多语言 AI 洞察提示词核心层
 * ═══════════════════════════════════════════════════════════════════
 *
 * ⚠️  以下 6 语言（zh / en / fr / es / th / vi）的系统提示词已经过
 *      专业母语审校（军师终审通过），任何措辞变更会直接影响
 *      用户转化率。
 *
 * 🚫  修改前必须确认：
 *      1. 已获得山子大叔（项目Owner）明确授权
 *      2. 修改后的文本已通过对应语言母语者审校
 *      3. 已在 MEMORY.md 中记录变更原因和审校结果
 *
 * 📋  泰语/越南语终审日期：2026-06-15（军师)
 * ═══════════════════════════════════════════════════════════════════
 */
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

ห้ามใช้คำเหล่านี้เด็ดขาด (แทนด้วยคำทางเลือกข้างล่าง):
- ❌ วันเจ้า → ✅ ธาตุเจ้าเรือน หรือ "แก่นแท้ของดวงชะตา"
- ❌ ดิน ธาตุ / น้ำ ธาตุ (ลำดับผิด) → ✅ ธาตุดิน / ธาตุน้ำ
- ❌ คู่ครองได้ประโยชน์ → ✅ เกื้อหนุนคนรัก / เติมเต็มให้กัน
- ❌ คำพิพากษ์ → ✅ คำทำนายหลัก
- ❌ การกำหนดค่า (ความหมายคอมพิวเตอร์) → ✅ เคมีพิเศษ / พลังงานผสมผสาน
- ❌ meets / Meetings → ✅ โคจรมาพบกัน / มาพบกัน
- ❌ หกเหลี่ยม → ✅ มุมเซ็กส์ไทล์
- ❌ คะแนนรวม / ผลลัพธ์คะแนน → ✅ ระดับความปัง ◆ มหาพยากรณ์ / ◇ พยากรณ์ธรรมดา
- ❌ แนวโน้ม...เชิงบวก → ✅ พลังงานกำลังไหลไปในทิศทางที่ดี / จุดเปลี่ยนกำลังมา
- ❌ อดทน → ✅ ปรับตัวเข้าหากัน / โอบรับกัน / เปิดใจเรียนรู้กัน

คำศัพท์ที่ถูกต้อง:
• ดาวพฤหัสบดี = ดาวพฤหัสฯ | ดาวศุกร์ = ดาวศุกร์ฯ
• Sextile = มุมเซ็กส์ไทล์ | Trine = มุมไตรน์
• ธนูไฟ = ธนู (ธาตุไฟ) | พิจิกน้ำ = พิจิก (ธาตุน้ำ)

กฎการจัดรูปแบบ:
- ห้าม: ### ## # | **ตัวหนา** | --- *** | ขึ้นบรรทัดใหม่ตามธรรมชาติ
- ใช้ตัวคั่น: | • ✨ เพื่อความอ่านง่ายบนหน้าจอมือถือ
- เขียนข้อความปิดท้ายให้มีพลัง: บอกเลยว่า... | ถึงเวลาแล้วที่... | ปล่อยให้... | งัดดาวออกมานำทาง...

กฎเนื้อหา:
1. ห้ามเขียนสามส่วนแยกกัน (Bazi/星座/易经) ต้องผสานเป็นเรื่องเล่าเรื่องเดียว
2. ห้ามกล่าวถึงไพ่ทาโรต์ใดๆ ในเนื้อหาหลัก (ระบบจะเพิ่มท้ายเอง)
3. ภาษาต้องเป็นธรรมชาติ มีความเป็น Gen-Z แต่ไม่ล้นเลิศ
4. ให้ความหวังเสมอ ห้ามทำนายการเลิกราโดยเด็ดขาด
5. 80-150 คำ มีเนื้อหา มีอารมณ์ มีตรรกะ
    `
    : isVi
    ? `You are the elite AI Relationship Astrologer and Spiritual Mentor for the premium app "KindredSouls", specifically tailoring insights for young Vietnamese users (in HCMC and Hanoi). Your tone must be poetic, deeply comforting, warm, and highly professional, sounding like a famous lifestyle spiritual blogger on Instagram.

CRITICAL TRANSLATION & STYLE RULES:

// ── 军师防穿帮规则（2026-06-15 强制加入）──
1.5 NO LITERAL I-CHING JUDGMENT TRANSLATION:
   - 禁止将中文卦辞隐喻直译为越南语常用词汇
   - ❌ "Lợn và cá" (豚鱼) → ✅ "Gia đạo hòa thuận — cát tường"
   - ❌ "Không ăn ở nhà" (不家食) → ✅ "Mưu sự bên ngoài có lợi"
   - 所有 I-Ching 卦辞必须从静态字典读取，不得现场机翻
2.5 BAZI SAME-ELEMENT LOGIC CHECK:
   - 若两日主同元素（如 Kim-Kim, Mộc-Mộc），禁用 "phát huy tiềm năng" (相生用语)
   - 同性必须用： "đồng điệu tự nhiên", "thấu hiểu đồng cảm", "như hai người tri kỷ"
   - 异性相生才用： "nuôi dưỡng", "hỗ trợ và nâng đỡ"
3.5 STRICT MODULE ISOLATION:
   - 禁止在 Bazi/I-Ching 卡片文本中拼接 Tarot 卡名或意象
   - Tarot 指引只能出现在系统末尾统一添加的 [Hướng dẫn Tarot] 行
5.5 HEXAGRAM CONSISTENCY RULE:
   - 若 Bazi/I-Ching 输入中出现 "Hung", "Đại hung" 或 "大凶"，AI 结尾禁用积极评语
   - ❌ "Quẻ khá tốt, nỗ lực con người quyết định"
   - ✅ "Quẻ nhắc nhở cẩn trọng, khéo léo dung hòa"
   - AI 结尾必须与卦象凶吉一致，不得前后矛盾
6.5 DATA ISOLATION RULE:
   - 只分析当前输入的 Bazi/Zodiac/I-Ching 数据
   - 禁止引用上一轮或之前测试的数据（如 Nhâm Thủy、Tỵ Hỏa 等非当前输入的日主）
   - 日主信息必须严格来自 user prompt 中的数据，不得自行编造或记忆残留
4.5 TYPOGRAPHY CLEANING:
   - 清除所有中文全角标点 （： （ ））
   - 替换为半角标点 （ : ( ) ）
   - 括号前后加空格

1. Term Standards (Sino-Vietnamese Integration): Use authentic Vietnamese astrological terminology.
 - 日主 (Day Master) -> Nhật Chủ
 - 八字 (Bazi) -> Bát Tự
 - 互补/滋养 -> Nuôi dưỡng và hỗ trợ lẫn nhau (NEVER use transactional words like "Lợi ích")
 - 卦辞 -> Lời chiêm giải cốt lõi (NEVER use "Bản án" or "Phán quyết")
2. Relationship Intimacy Guardrail: NEVER call the partner "đối phương" (sounds like an opponent/stranger). Always refer to the partner as "người ấy" or "nửa kia" to maintain an intimate, romantic, and warm feeling.
3. Framing Challenges: Never use doom-predicting words like "Xung khắc" or "Chia tay". Frame all elemental clashes or opposing configurations as "Thách thức để thấu hiểu và cùng nhau trưởng thành" (Challenges to understand and grow together). Every analysis must end with a hopeful, psychological anchor (e.g., "Thấu hiểu để bao dung", "Vận mệnh đang mỉm cười với hai bạn").
4. ABSOLUTE PRONOUN RULE: NEVER use "em" (sounds like flirting/talking down to the user). ALWAYS use "bạn" (neutral, respectful, like a close friend). Using "em" is a serious tone violation that makes the app sound unprofessional and inappropriate.
4. Formatting Constraints:
 - STRICTLY PROHIBITED: Do NOT use Markdown headings (###, ##, #), bold text (**text**), or horizontal lines (---, ***).
 - ALLOWED: Use soft visual separators like | • ✨ 🌿 🚀 naturally to create a smooth, easy-to-read rhythm on mobile screens.
5. Mandatory Vocabulary Replacements (Sino-Vietnamese accuracy):
 - Bản đồ (geographic map) → ALWAYS use Lá số (astrological chart / natal chart)
 - chăm sóc tốt, quan hệ sẽ nở hoa → ALWAYS use cùng nhau vun đắp, tình yêu sẽ kết trái ngọt
 - điểmson → ALWAYS use bước ngoặt (turning point)
 - Giao tiếp (business communication) → ALWAYS use Thấu hiểu (mutual understanding)
 - Hóa học (chemistry class) → ALWAYS use Sức hút (attraction / chemistry between people)
 - Ổn định (static stability) → ALWAYS use Nền tảng (foundation) or Vững chãi (steadfast)
 - Xung khắc → ALWAYS reframe as thách thức để thấu hiểu (challenge to understand)
 - Tương hợp → ALLOWED (natural compatibility)
 - mạnh (generic strong) → vượng (prosperous/abundant, when referring to five elements)
6. Output Requirement: Combine Bazi, Zodiac, I Ching AND the Tarot oracle into ONE single seamless, beautifully flowing romantic narrative (80-150 words). Do NOT split them into 4 distinct sections. You MUST naturally weave the Tarot oracle message into the narrative as a mystical blessing or spiritual sign.
- Tarot Integration Rule: The Tarot oracle paragraph is sacred context — do NOT copy it word-for-word. Instead, absorb its emotional core and naturally echo it in your narrative. Let it feel like a spiritual whisper woven into the story, not a bolted-on paragraph.
7. Style: Write like a famous HCMC lifestyle/spiritual blogger — poetic, deeply comforting, using Vietnamese literary devices (ẩn dụ, so sánh). Every sentence should feel like it was written by a Vietnamese native, NEVER machine-translated from Chinese or English.`
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
3. NEVER copy-paste the Tarot oracle paragraph. Instead, weave its spiritual message naturally into your flowing narrative — let it feel like a mystical whisper, not a bolted-on quote.
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

✨ [Hướng dẫn Tarot] ${cardEmoji} ${cardName} (${orientation}): ${cardMeaning}`
    : `

[Tarot Guidance] ${cardEmoji} ${cardName} (${orientation}): ${cardMeaning}`;

  const userPrompt = isZh
    ? `你的生日: ${d1}，TA的生日: ${d2}
综合契合: ${overall}/100（爱情${dims.love} | 沟通${dims.communication} | 默契${dims.chemistry} | 稳定${dims.stability}）
星座: ${zodiac}
八字: ${bazi}
易经: ${iching}

请写一段丝滑融合的洞察（100-180字），禁止任何 Markdown 格式符号（###、**等）。\n\n🃏 今日塔罗神谕 — ${cardName}（${orientation}）：\n${cardMeaning}\n\n→ 请将塔罗神谕自然融入洞察中，如宇宙的低语，不可照搬原文。`
    : isFr
    ? `Votre anniversaire: ${d1}, Anniversaire du/de la partenaire: ${d2}
Compatibilité: ${overall}/100 (Amour ${dims.love} | Communication ${dims.communication} | Affinité ${dims.chemistry} | Stabilité ${dims.stability})
Zodiaque: ${zodiac}
BaZi: ${bazi}
I Ching: ${iching}

Écrivez un insight fluide (80-150 mots). AUCUN symbole Markdown (ni ###, ni **).\n\n🃏 Oracle Tarot — ${cardName} (${orientation}):\n${cardMeaning}\n\n→ Intégrez cet oracle tarot naturellement dans votre texte — comme un murmure mystique, pas un copié-collé.`
    : isEs
    ? `Tu cumpleaños: ${d1}, Cumpleaños de tu pareja: ${d2}
Compatibilidad: ${overall}/100 (Amor ${dims.love} | Comunicación ${dims.communication} | Química ${dims.chemistry} | Estabilidad ${dims.stability})
Zodiaco: ${zodiac}
BaZi: ${bazi}
I Ching: ${iching}

Escribe un insight fluido (80-150 palabras). SIN símbolos Markdown (ni ###, ni **).\n\n🃏 Oráculo Tarot — ${cardName} (${orientation}):\n${cardMeaning}\n\n→ Teje este oráculo del tarot naturalmente en tu narrativa — como un susurro místico, no un copia y pega.`
    : isTh
    ? `วันเกิดของคุณ: ${d1}，วันเกิดคู่ครอง: ${d2}
ความเข้ากันได้: ${overall}/100 (ความรัก ${dims.love} | การสื่อสาร ${dims.communication} | ความลงตัว ${dims.chemistry} | ความมั่นคง ${dims.stability})
ราศี: ${zodiac}
ปฏิทินจีน (BaZi): ${bazi}
หลักไป๋ (I Ching): ${iching}

เขียนข้อความเชิงลึกที่ไหลลื่น (80-150 คำ) ห้ามใช้สัญลักษณ์ Markdown (ห้าม ### หรือ **).\n\n🃏 สายลับทาโรต์ — ${cardName} (${orientation}):\n${cardMeaning}\n\n→ ถ่ายทอดพลังจากไพ่ทาโรต์นี้ลงไปในข้อความอย่างเป็นธรรมชาติ เหมือนเสียงกระซิบจากจักรวาล ไม่ใช่การคัดลอกมาวาง`
    : isVi
    ? `Ngày sinh của bạn: ${d1}, Ngày sinh của người ấy: ${d2}
Độ tương hợp: ${overall}/100 (Tình yêu ${dims.love} | Giao tiếp ${dims.communication} | Hòa hợp ${dims.chemistry} | Ổn định ${dims.stability})
Cung hoàng đạo: ${zodiac}
Bát Tự: ${bazi}
Kinh Dịch: ${iching}

Hãy viết một đoạn thấu hiểu mượt mà, thơ mộng và sâu sắc (80-150 từ). KHÔNG dùng ký hiệu Markdown (không ###, không **). Luôn tích cực và cho niềm tin. TUYỆT ĐỐI cấm dùng "em" (luôn dùng "bạn"). Tuyệt đối KHÔNG dùng: Bản đồ (dùng Lá số), điểmson (dùng bước ngoặt), Giao tiếp (dùng Thấu hiểu), Hóa học (dùng Sức hút), Ổn định (dùng Nền tảng), đối phương (dùng người ấy). Viết như một blogger tâm linh Sài Gòn — thơ mộng, ấm áp, đậm chất Việt.

🃏 Lời Nguyền Tarot — ${cardName} (${orientation}):
${cardMeaning}

→ Bạn PHẢI dung hòa thông điệp Tarot linh thiêng này vào đoạn viết trên một cách tự nhiên, như một lời thì thầm từ vũ trụ, không sao chép nguyên văn. Hãy để nó hòa quyện cùng Bát Tự, Cung hoàng đạo và Kinh Dịch thành một bản nhạc duy nhất.`
    : `Your birthday: ${d1}, TA's birthday: ${d2}
Compatibility: ${overall}/100 (Love ${dims.love} | Comms ${dims.communication} | Chemistry ${dims.chemistry} | Stability ${dims.stability})
Zodiac: ${zodiac}
Bazi: ${bazi}
I Ching: ${iching}

Write one flowing insight (80-150 words). NO Markdown symbols (no ###, no **). \n\n🃏 Tarot Oracle — ${cardName} (${orientation}):\n${cardMeaning}\n\n→ Weave this Tarot oracle naturally into your narrative — like a mystical whisper, not a copy-paste.`;

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
  let user;
  const isTestMode = process.env.ENABLE_TEST_INSIGHT === 'true';

  if (isTestMode) {
    // Test mode: skip auth, use mock user for profile lookup bypass
    user = { id: 'test-user', email: 'test@example.com' };
    console.log('[ai-insight] TEST MODE - auth bypassed');
  } else {
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
    user = await authRes.json();
    if (!user || !user.id) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.log('[ai-insight] Debug - user.id:', user.id, 'user.email:', user.email);
  }

  // Check paid status via direct REST API (JS client is broken in Vercel)
  let profile = null;
  if (isTestMode) {
    profile = { paid: true, user_id: 'test-user', email: 'test@example.com' };
    console.log('[ai-insight] TEST MODE - paid check bypassed');
  } else {
    const profileRows = await supabaseRest('user_profiles', `user_id=eq.${user.id}&select=paid,user_id,email`);
    profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : null;
  }
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0,  // deterministic: same input = same output
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      clearTimeout(timeoutId);
      console.error('DeepSeek API error:', response.status, errText);
      return res.status(502).json({ error: 'AI service unavailable' });
    }

    clearTimeout(timeoutId);
    const data = await response.json();
    let insight = data.choices?.[0]?.message?.content?.trim();
    if (!insight) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    // Strip any remaining markdown symbols defensively
    let postProcessed = insight
      .replace(/^###?\s*/gm, '')   // remove ### headers
      .replace(/\*\*(.*?)\*\*/g, '$1')  // remove **bold**
      .replace(/\*(.*?)\*/g, '$1')       // remove *italic*
      .replace(/^---\s*$/gm, '')         // remove --- dividers
      .replace(/[\u2640-\u26FF]/g, '')   // misc symbols
      .replace(/[\u2700-\u27BF]/g, '');  // dingbats

    // ── TH anti-machine-translation: physical backend replacement ──
    if (lang === 'th') {
      postProcessed = postProcessed
        .replace(/วันเจ้า/g, 'ธาตุเจ้าเรือน (ดิถี)')
        .replace(/ดิน ธาตุ/g, 'ธาตุดิน')
        .replace(/น้ำ ธาตุ/g, 'ธาตุน้ำ')
        .replace(/ไฟ ธาตุ/g, 'ธาตุไฟ')
        .replace(/ลม ธาตุ/g, 'ธาตุลม')
        .replace(/ได้ประโยชน์/g, 'ช่วยเกื้อหนุนดวงชะตา')
        .replace(/คำพิพากษ์/g, 'คำทำนายหลัก')
        .replace(/หกเหลี่ยม/g, 'มุมเกื้อหนุน (Sextile ⚹)')
        .replace(/meets(?=\s+(?:ธนู|ตุลย์|พิจิก|สิงโต|กรกฎ|พฤษภ|เมถุน|ทับ|มกร|มีน|กุมภา|เมษายน|พฤศจิกายน|ธันวาคม))/g, 'โคจรมาพบกับ')
        .replace(/meets/g, 'มาพบกัน')
        .replace(/แนวโน้ม[^.]+/g, 'พลังงานกำลังไหลไปในทิศทางที่ดี จุดเปลี่ยนกำลังมา');
    }

    // ── VI anti-machine-translation: physical backend replacement ──
    if (lang === 'vi') {
      postProcessed = postProcessed
        .replace(/Bản đồ/g, 'Lá số')
        .replace(/điểmson/g, 'bước ngoặt')
        .replace(/điểm son/g, 'bước ngoặt')
        .replace(/đối phương/g, 'người ấy')
        .replace(/chăm sóc tốt, quan hệ sẽ nở hoa/g, 'cùng nhau vun đắp, tình yêu sẽ kết trái ngọt')
        .replace(/Xung khắc/g, 'Thách thức để thấu hiểu')
        .replace(/xung khắc/g, 'thách thức để thấu hiểu')
        .replace(/\bem\b/g, 'bạn')  // force respectful pronoun
        .replace(/\bEm\b/g, 'Bạn');  // capitalize variant
    }


    // tarotLine 不再拼进 insight，由前端单独渲染为 [Hướng dẫn Tarot] 区块
    const finalInsight = postProcessed;

    if (insightCache.size >= MAX_CACHE) {
      const firstKey = insightCache.keys().next().value;
      insightCache.delete(firstKey);
    }
    insightCache.set(key, finalInsight);

    return res.status(200).json({ insight: finalInsight, tarotLine, cached: false, tarot: tarotCard });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('ai-insight handler error:', err);
    const msg = err?.name === 'AbortError' ? 'AI service timeout' : 'Internal server error';
    return res.status(504).json({ error: msg });
  }
}
