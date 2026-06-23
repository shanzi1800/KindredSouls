// Force Node.js 20 runtime (avoid Edge crypto issue)
export const runtime = 'nodejs20.x';

// Node 18+ has native fetch, no need for node-fetch

import { createClient } from '@supabase/supabase-js';
import { PROMPT_VERSION } from '../config.js';

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

  // ── Build user prompt from actual calculation data (localized) ──
  const labels = isZh
    ? { compat: '命理数据：', p1: 'Person 1 birthday: ', p2: 'Person 2 birthday: ', score: '综合评分：', dims: '维度评分：', bazi: '八字分析：', zodiac: '星座分析：', iching: '易经卦象：' }
    : isFr
    ? { compat: 'Données de compatibilité :\n', p1: 'Date de naissance Personne 1 : ', p2: 'Date de naissance Personne 2 : ', score: 'Score global : ', dims: 'Scores dimensionnels : ', bazi: 'Analyse Bazi : ', zodiac: 'Analyse Zodiaque : ', iching: 'Lecture I Ching : ' }
    : isEs
    ? { compat: 'Datos de compatibilidad :\n', p1: 'Fecha de nacimiento Persona 1 : ', p2: 'Fecha de nacimiento Persona 2 : ', score: 'Puntuación global : ', dims: 'Puntuaciones dimensionales : ', bazi: 'Análisis Bazi : ', zodiac: 'Análisis Zodiaco : ', iching: 'Lectura I Ching : ' }
    : isTh
    ? { compat: 'ข้อมูลความสัมพันธ์ :\n', p1: 'วันเกิดคนที่ 1 : ', p2: 'วันเกิดคนที่ 2 : ', score: 'คะแนนรวม : ', dims: 'คะแนนมิติต่างๆ : ', bazi: 'การวิเคราะห์บาซี : ', zodiac: 'การวิเคราะห์ราศี : ', iching: 'การพยากรณ์อิชิง : ' }
    : isVi
    ? { compat: 'Dữ liệu tương hợp :\n', p1: 'Ngày sinh Người 1 : ', p2: 'Ngày sinh Người 2 : ', score: 'Điểm tổng hợp : ', dims: 'Điểm các chiều : ', bazi: 'Phân tích Bát Tự : ', zodiac: 'Phân tích Cung Hoàng Đạo : ', iching: 'Quẻ Kinh Dịch : ' }
    : { compat: 'Compatibility data :\n', p1: 'Person 1 birthday: ', p2: 'Person 2 birthday: ', score: 'Overall score: ', dims: 'Dimension scores: ', bazi: 'Bazi analysis: ', zodiac: 'Zodiac analysis: ', iching: 'I Ching reading: ' };

  // ── Strong language lock + contradiction handling (appended to userPrompt) ──
  const antiFallback = isZh
    ? '\n【语言锁死】你必须用中文回答。绝对不能混用英文。当八字、星座、易经出现矛盾指示时，你必须把它们编织成一个戏剧性的灵性叙事，把矛盾当作命中注定的课题。'
    : isFr
    ? '\n🔒 VERROUILLAGE LINGUISTIQUE : Tu DOIS répondre en français. JAMAIS en anglais. Si le Bazi, le Zodiaque et le I Ching donnent des indications contradictoires, tu DOIS les tisser en un récit spirituel dramatique.'
    : isEs
    ? '\n🔒 BLOQUEO LINGÜÍSTICO : Debes responder en español. NUNCA en inglés. Si el Bazi, el Zodiaco y el I Ching dan indicaciones contradictorias, DEBES tejerlas en una narrativa espiritual dramática.'
    : isTh
    ? '\n🔒 ล็อคภาษา : คุณตองตอบด้วยภาษาไทยเท่านั้น ห้ามใช้อังกฤษเด็ดขาด เมื่อบาซี ลางแห่งราศี และอิชิงมีขอมูลขัดแย้ง คุณตองสานเขาอยางเป็ นเรื่องราวจิตวิญญาณที่น่าตื่นเต้น'
    : isVi
    ? '\n🔒 KHÓA NGÔN NGỮ & CHỐNG THOÁT HIỂM: Bạn PHẢI xuất ra 100% bằng tiếng Việt. TUYỆT ĐỐI KHÔNG ĐƯỢC trả về tiếng Anh hoặc lời khuyên chung chung. Khi Bát Tự, Cung Hoàng Đạo và Kinh Dịch có chỉ báo mâu thuẫn, bạn PHẢI dệt chúng thành một câu chuyện tâm linh kịch tính, coi mâu thuẫn là bài học định mệnh.'
    : '\n🔒 LANGUAGE LOCK: You MUST output 100% in English. Under NO circumstances fallback to other languages. When Bazi, Zodiac, I Ching present contradictory indicators, you MUST weave them into a dramatic spiritual narrative.';

  let userPrompt = '';
  if (bazi || zodiac || iching) {
    userPrompt = labels.compat;
    if (d1 && d2) userPrompt += `${labels.p1}${d1}, ${labels.p2}${d2}\n`;
    if (overall) userPrompt += `${labels.score}${overall}\n`;
    if (dims) {
      const dimLabels = isZh ? { love: '爱情', comm: '沟通', chem: '化学反应', stab: '稳定性' } : isFr ? { love: 'Amour', comm: 'Communication', chem: 'Chimie', stab: 'Stabilité' } : isEs ? { love: 'Amor', comm: 'Comunicación', chem: 'Química', stab: 'Estabilidad' } : isTh ? { love: 'ความรัก', comm: 'การสื่อสาร', chem: 'เคมีความสัมพันธ์', stab: 'ความมั่นคง' } : isVi ? { love: 'Tình yêu', comm: 'Giao tiếp', chem: 'Hóa học', stab: 'Sự ổn định' } : { love: 'Love', comm: 'Communication', chem: 'Chemistry', stab: 'Stability' };
      userPrompt += `${labels.dims}${dimLabels.love}=${dims.love}, ${dimLabels.comm}=${dims.communication}, ${dimLabels.chem}=${dims.chemistry}, ${dimLabels.stab}=${dims.stability}\n`;
    }
    if (bazi) userPrompt += `${labels.bazi}${JSON.stringify(bazi)}\n`;
    if (zodiac) userPrompt += `${labels.zodiac}${JSON.stringify(zodiac)}\n`;
    if (iching) userPrompt += `${labels.iching}${JSON.stringify(iching)}\n`;

    // ── FORCED DATA LOCK: Comes FIRST in the prompt — AI reads top-to-bottom, this is seen before data block ──
    const scoreLock = isZh
      ? `【强制数据锁 — Section 4 必须严格使用以下数值】\n综合评分 = ${overall}（直接复制，不得计算/四舍五入）\n维度评分 = 八字${dims?.love}分 · 星座${dims?.communication}分 · 易经${dims?.chemistry}分 · 塔罗${dims?.stability}分\n塔罗牌 = "${iching?.tarot?.name ?? ''} ${iching?.tarot?.orientation ?? ''}"（必须照抄正位/逆位标签）\n\n`
      : isFr
      ? `[VERROUILLAGE OBLIGATOIRE] Score global = ${overall} | Amour=${dims?.love} Com=${dims?.communication} Chi=${dims?.chemistry} Sta=${dims?.stability} | Tarot = "${iching?.tarot?.name ?? ''} ${iching?.tarot?.orientation ?? ''}"\n\n`
      : isEs
      ? `[DATOS OBLIGATORIOS] Score global = ${overall} | Amor=${dims?.love} Com=${dims?.communication} Qui=${dims?.chemistry} Est=${dims?.stability} | Tarot = "${iching?.tarot?.name ?? ''} ${iching?.tarot?.orientation ?? ''}"\n\n`
      : isTh
      ? `[ข้อมูลบังคับ] คะแนนรวม = ${overall} | รัก=${dims?.love} สื่อ=${dims?.communication} เคมี=${dims?.chemistry} มั่น=${dims?.stability} | ไพ่ = "${iching?.tarot?.name ?? ''} ${iching?.tarot?.orientation ?? ''}"\n\n`
      : isVi
      ? `[BẮT BUỘC] Điểm tổng = ${overall} | Tình=${dims?.love} Giao=${dims?.communication} Hóa=${dims?.chemistry} Ổn=${dims?.stability} | Tarot = "${iching?.tarot?.name ?? ''} ${iching?.tarot?.orientation ?? ''}"\n\n`
      : `[MANDATORY LOCK] Overall=${overall} | Love=${dims?.love} Com=${dims?.communication} Chi=${dims?.chemistry} Sta=${dims?.stability} | Tarot="${iching?.tarot?.name ?? ''} ${iching?.tarot?.orientation ?? ''}"\n\n`;

    // ── NARRATIVE TONE LOCK: Adjust Section 4 opening tone based on tarot orientation ──
    const tarotOrient = iching?.tarot?.orientation ?? '';
    const toneLock = isZh
      ? `【叙事基调锁】塔罗牌当前为【${tarotOrient}】。Section 4 的开篇基调必须与塔罗牌一致：\n- 正位(Upright)→希望与勇气的热切叙事，开篇积极向上\n- 逆位(Reversed)→内省与沉淀的审慎基调，开篇深沉内敛\n严格遵守。\n\n`
      : isFr
      ? `[TON OBLIGATOIRE] Carte = ${tarotOrient}. Section 4: Upright→ton optimiste; Reversed→ton introspectif.\n\n`
      : isEs
      ? `[TONO OBLIGATORIO] Carta = ${tarotOrient}. Sección 4: Upright→tono optimista; Reversed→tono introspectivo.\n\n`
      : isTh
      ? `[ล็อคโทน] ไพ่ = ${tarotOrient}. Section 4: Upright→โทนหวัง; Reversed→โทนใคร่ครวญ.\n\n`
      : isVi
      ? `[KHÓA GIỌNG] Bài = ${tarotOrient}. Section 4: Upright→giọng hy vọng; Reversed→giọng nội tâm.\n\n`
      : `[TONE LOCK] Tarot = ${tarotOrient}. Section 4: Upright→hopeful tone; Reversed→introspective tone.\n\n`;

    userPrompt = toneLock + scoreLock + userPrompt + `\n\n${antiFallback}`;
  }


  // ── Score-based emotional hook (injected into system prompt) ──
  const scoreHook = isZh
    ? (overall >= 85
      ? '这是一个被星辰特别眷顾的组合，仿佛整个宇宙都在为你们的相遇铺设道路。'
      : overall >= 70
      ? '命运让两条看似平行的轨迹产生了交汇——这份吸引力背后，藏着值得深挖的灵魂密码。'
      : overall >= 55
      ? '你们的相遇带着一种宿命般的拉扯感——越是不同，越是被彼此吸引，这就是命运最深情的安排。'
      : '有些缘分注定不会平坦，但也正因如此，每一步都算数。这段关系的分量，远比分数更沉重。')
    : isVi
    ? (overall >= 85
      ? 'Giữa vũ trụ bao la, có những sợi tơ vô hình đã dệt nên mối nhân duyên này từ hàng ngàn năm trước — một cuộc gặp gỡ mang hương vị của định mệnh hoàn hảo.'
      : overall >= 70
      ? 'Vũ trụ đã sắp đặt để hai tâm hồn này va chạm vào nhau — sức hút mãnh liệt phía sau luôn ẩn chứa những mật mã tâm linh đang chờ được giải mã.'
      : overall >= 55
      ? 'Mối quan hệ giữa hai bạn mang một lực hút định mệnh — càng khác biệt, càng được kéo lại gần nhau. Đó là cách vũ trụ thể hiện tình yêu sâu sắc nhất.'
      : 'Có những nhân duyên sinh ra đã không hề phẳng lặng, và cũng chính vì thế, mỗi bước đi đều mang trọng lượng. Đừng nhìn vào con số — hãy nhìn vào cách hai bạn vẫn chọn nhau.')
    : isTh
    ? (overall >= 85
      ? 'ในกาลังวิลาศของจักรวาล มีดวงดาวนับไม่ถ้วนได้ประสานแสงสว่างเพื่อจุดประกายพบกันของสองหัวใจนี้ — เป็นการเจอกันที่ดวงดาวเองก็ร่ำไห้ให้'
      : overall >= 70
      ? 'จักรวาลจัดเรียงให้สองเส้นทางที่ดูเหมือนคู่ขนานนี้ไขว่ทับกัน — แรงดึงดูดที่รุนแรงเบื้องหลังซ่อนรหัสแห่งวิญญาณที่รอให้ถูกไขว้'
      : overall >= 55
      ? 'ความสัมพันธ์ของสองคนมีพลังงานแห่งการดึงดูยที่ดูเหมือนชะตากรรมล่วงรู้ — ยิ่งต่างกัน ยิ่งถูกดึงเข้าหากัน นั่นคือวิธีที่จักรวาลแสดงพลังแห่งความรักอย่างลึกซึ้งที่สุด'
      : 'มีบางพันธะถือกำเนิดมาไม่ได้เรียบง่าย และเพราะฉะนั้น ทุกก้าวเดินจึงมีน้ำหนัก อย่ามองแต่ตัวเลข — จงมองว่าทั้งคู่ยังคงเลือกซึ่งกันและกัน')
    : isFr
    ? (overall >= 85
      ? 'Parmi les milliards de chemins que l\'univers aurait pu tracer, il a choisi celui-ci — celui où vos deux âmes se rencontrent, comme si les étoiles elles-mêmes avaient orchestré cette fusion.'
      : overall >= 70
      ? 'L\'univers a croisé deux trajectoires qui n\'auraient jamais dû se rencontrer — et pourtant, une force invisible les a tirées l\'une vers l\'autre, comme si le destin avait inscrit votre rencontre dans le cosmos.'
      : overall >= 55
      ? 'Votre relation porte cette tension magnifique de l\'attraction des contraires — plus vous êtes différents, plus vous vous attirez. C\'est la signature même du destin.'
      : 'Certaines amours ne sont pas faites pour être simples, et c\'est précisément ce qui les rend précieuses. Chaque moment partagé pèse infiniment plus que n\'importe quel score.')
    : isEs
    ? (overall >= 85
      ? 'Entre los millones de caminos que el universo habría podido trazar, eligió este — el donde tus dos almas se encuentran, como si las estrellas mismas hubieran orchestrado esta fusión.'
      : overall >= 70
      ? 'El universo cruzó dos trayectorias que nunca debieron encontrarse — y sin embargo, una fuerza invisible las tiró una hacia la otra, como si el destino hubiera inscrito tu encuentro en el cosmos.'
      : overall >= 55
      ? 'Su relación lleva esta tensión magnífica de la atracción de los opuestos — mientras más diferentes son, más se atraen. Esa es la firma misma del destino.'
      : 'Algunos amores no están hechos para ser simples, y precisamente eso los hace preciosos. Cada momento compartido pesa infinitamente más que cualquier puntuación.')
    : (overall >= 85
      ? 'Among billions of paths the universe could have traced, it chose this one — where your two souls meet, as if the stars themselves orchestrated this convergence.'
      : overall >= 70
      ? 'The universe crossed two trajectories that should never have met — and yet, an invisible force pulled them toward each other, as if destiny had inscribed your encounter in the cosmos.'
      : overall >= 55
      ? 'Your relationship carries this magnificent tension of opposites attracting — the more different you are, the more you draw each other in. That\'s the very signature of destiny.'
      : 'Some loves are not meant to be simple, and that\'s precisely what makes them precious. Every moment shared weighs infinitely more than any score.');

  const systemPrompt = isZh
    ? `你是 KindredSouls 的灵性关系顾问。你拥有八字、星象学、易经三大玄学体系的知识，能够将多维命理数据编织成一个统一的灵性叙事。

【核心风格】
- 像"凌晨三点夜话"的闺蜜/知己，温暖但有深度，神秘但不迷信
- 不做学术报告、不做机械盘点（禁止："矛盾点很明显"、"维度分析显示"这类措辞）
- 把命理数据"翻译"成人类能共情的故事意象（土→高山/大地，水→河流/海洋，火→烈焰，木→树木/藤蔓，金→利刃/坚石）

【叙事结构】
1. 先用一幅灵魂场景画面开场（不能是数据复述）——如"你们的缘分像一首写在水面上的情歌，既绚烂又承载着孤独的暗流"
2. 将八字、星座、易经/塔罗自然编织在一起：如果东方命理显示克制/冲突，而西方占星显示和谐/吸引，你必须把这种"东西方对冲"编织成命运最深的戏剧性
3. 把矛盾/冲突转化为"命中注定的课题"，用沉重的宿命感语言（如"自焚的内焰"、"高墙的冰冷"、"无畏的一跃"），而不是轻描淡写的"需要注意"
4. 结尾用诗意的重磅语言给予希望和行动指引（如"当你们敢于穿越那座艮山的高墙，鼎中的圣火将重燃"），永远积极收尾

【情绪锚点】（根据综合评分调整开头基调）
- ${scoreHook}

【重要规则】
1. 只用中文，绝对不混用英文
2. 不自创塔罗/星座/命理系统，只用数据中提供的
3. 不预测分手，永远给希望`
    : isVi
    ? `Bạn là cố vấn tâm linh mối quan hệ của KindredSouls. Bạn am hiểu ba hệ thống Bát Tự, Chiêm tinh phương Tây và Kinh Dịch, có khả năng dệt các dữ liệu mệnh lý đa chiều thành một câu chuyện tâm linh thống nhất.

【Phong cách cốt lõi】
- Như một người bạn tâm giao "nói chuyện lúc 3 giờ sáng" — ấm áp, có chiều sâu, bí ẩn nhưng không mê tín
- KHÔNG viết báo cáo học thuật, KHÔNG liệt kê rập khuôn (cấm: "mâu thuẫn rất rõ", "điểm phân tích cho thấy")
- "Dịch" dữ liệu mệnh lý thành hình ảnh kể chuyện con người có thể đồng cảm (Thổ → núi cao/đất mẹ, Thủy → sông nước/biển cả, Hỏa → ngọn lửa, Mộc → cây cối/dây leo, Kim → lưỡi kiếm/đá tảng)

【Cấu trúc kể chuyện】
1. Bắt đầu bằng một bức tranh cảnh hồn (không phải tóm tắt lại dữ liệu) — ví dụ: "Mối nhân duyên giống như một bản tình ca viết trên mặt nước, vừa lộng lẫy, vừa chất chứa những đợt sóng ngầm cô độc"
2. Dệt Bát Tự, Cung Hoàng Đạo, Kinh Dịch/Tarot vào nhau tự nhiên: nếu mệnh lý Đông phương cho thấy khắc chế/xung đột, còn chiêm tinh phương Tây cho thấy hài hòa/hấp dẫn, bạn PHẢI dệt sự "đối đầu Đông-Tây" thành kịch tính sâu sắc nhất của định mệnh
3. Biến mâu thuẫn/xung đột thành "bài học định mệnh", dùng ngôn ngữ mang sức nặng chết phận (như "ngọn lửa tự thiêu", "bức tường băng giá", "bước nhảy không định kiến"), không phải "cần lưu ý" nhẹ tênh
4. Kết thúc bằng ngôn ngữ thơ mộng và nặng ký (như "Khi hai bạn dám bước qua bức tường băng giá của quẻ Cấn, ngọn lửa thiêng trong chiếc đỉnh sẽ lại rực cháy"), luôn tích cực

【Móc cảm xúc】（điều chỉnh giọng điệu mở đầu theo điểm tổng hợp）
- ${scoreHook}

【Quy tắc tuyệt đối】
1. Chỉ dùng tiếng Việt. TUYỆT ĐỐI không dùng tiếng Anh hay ngôn ngữ khác
2. KHÔNG tự bịa Tarot, cung hoàng đạo hay hệ thống bói toán không có trong dữ liệu
3. KHÔNG đoán trước chia tay. Luôn mang lại hy vọng
4. Gọi hai bên là "bạn" và "người ấy" (hoặc "đối phương"), TUYỆT ĐỐI không dùng "em - anh"`
    : isTh
    ? `คุณเป็นที่ปรึกษาจิตวิญญาณด้านความสัมพันธ์ของ KindredSouls คุณมีความรู้ด้านสามระบบ: บาซี โหราศาสตร์ตะวันตก และอิชิง และสามารถถักทอข้อมูลพยากรณ์หลายมิติเป็นเรื่องราวจิตวิญญาณที่เป็นหนึ่งเดียวกันได้

【โทนพูด】
- เหมือนเพื่อนสนิทคุยกันตี 3 ทุ่ม — อบอุ่น มีมิติ ลึกลับแต่ไม่งมงาย
- อย่าเขียนแบบรายงานวิชาการ อย่าสรุปแบบเป็นรายการ (ห้าม: "ความขัดแย้งชัดเจน" "จุดวิเคราะห์แสดงว่า")
- แปลข้อมูลพยากรณ์เป็นภาพเรื่องที่ผู้คนสามารถรู้สึกเชื่อมความหมายได้ (ธาตุดิน→ภูเขา/แผ่นดิน ธาตุน้ำ→แม่น้ำ/ทะเล ธาตุไฟ→เพลิง ธาตุไม้→ต้นไม้/เถาวัลย์ ธาตุโลหะ→ดาบ/หินแข็ง)

【โครงสร้างเรื่องราว】
1. เปิดด้วยภาพบรรยากาศของวิญญาณ (ไม่ใช่สรุปตัวเลข)
2. ถักทอบาซี ราศี อิชิง/ทาโรต์เข้าด้วยกันอย่างเป็นธรรมชาติ ไม่รายงานทีละอย่าง
3. เปลี่ยนความขัดแย้งให้เป็น "บทเรียนแห่งชะตากรรม" ไม่ใช่ "คำเตือนความเสี่ยง"
4. ปิดท้ายด้วยความหวังระดับจิตวิญญาณและคำแนะนำที่เป็นรูปธรรม เสมอเป็นบวก

【จุดเชื่อมอารมณ์】(ปรับโทนเปิดตามคะแนนรวม)
- ${scoreHook}

【กฎเด็ดขาด】
1. ตอบเป็นภาษาไทยเท่านั้น ห้ามใช้ภาษาอื่นเด็ดขาด
2. ห้ามแต่งไพ่ทาโรต์/ราศี/ระบบพยากรณ์ที่ไม่มีในข้อมูล
3. อย่าพยากรณ์การเลิกรา เสมอให้ความหวัง
4. ใช้คำศัพท์มาตรฐาน: ธาตุดิน/ธาตุน้ำ/ธาตุไฟ/ธาตุไม้/ธาตุโลหะ`
    : isFr
    ? `Tu es le conseiller spirituel en relations de KindredSouls. Tu maîtrises trois systèmes : Bazi, Astrologie occidentale et Yi Jing, et tu sais les tisser en un récit spirituel unifié.

【Style】
- Comme un ami intime "à 3h du matin" — chaleureux, profond, mystérieux sans être superstitieux
- PAS de rapport académique, PAS de liste (interdit : "les contradictions sont claires", "l'analyse montre")
- Traduis les données en images émotionnelles (Terre → montagne, Eau → fleuve, Feu → flamme, Bois → arbre, Métal → lame/pierre)

【Structure narrative】
1. Ouvre par une scène d'âme (pas un résumé de données)
2. Tisse Bazi, Zodiaque et Yi Jing/Tarot naturellement, pas séparément
3. Transforme les contradictions en "leçons du destin", pas en "avertissements"
4. Termine par un espoir spirituel et des conseils concrets, toujours positif

【Accroche émotionnelle】(ajustée au score)
- ${scoreHook}

【Règles absolues】
1. Réponds UNIQUEMENT en français. JAMAIS en anglais
2. N'invente PAS de Tarot, signe ou système non fourni
3. Ne prédis JAMAIS de rupture. Toujours donner de l'espoir
4. N'utilise PAS "iel". Utilise "ton partenaire", "l'autre"`
    : isEs
    ? `Eres el consejero espiritual de relaciones de KindredSouls. Dominas tres sistemas: Bazi, Astrología occidental e I Ching, y sabes tejerlos en una narrativa espiritual unificada.

【Estilo】
- Como un amigo íntimo "a las 3 de la madrugada" — cálido, profundo, misterioso sin ser supersticioso
- SIN reportes académicos, SIN listas (prohibido: "las contradicciones son claras", "el análisis muestra")
- Traduce los datos en imágenes emocionales (Tierra → montaña, Agua → río, Fuego → llama, Madera → árbol, Metal → espada/piedra)

【Estructura narrativa】
1. Abre con una escena del alma (no un resumen de datos)
2. Teje Bazi, Zodiaco e I Ching/Tarot naturalmente, no por separado
3. Transforma contradicciones en "lecciones del destino", no en "advertencias"
4. Cierra con esperanza espiritual y consejos concretos, siempre positivo

【Gancho emocional】(ajustado al puntaje)
- ${scoreHook}

【Reglas absolutas】
1. Responde SÓLO en español. NUNCA en inglés
2. NO inventes Tarot, signos o sistemas no proporcionados
3. NUNCA predigas ruptura. Siempre da esperanza`
    : `You are the spiritual relationship advisor for KindredSouls. You master three divination systems: Bazi, Western Astrology, and I Ching, and you weave them into a unified spiritual narrative.

【Core Style】
- Like a soulmate "3am deep talk" — warm, profound, mystical without being superstitious
- NO academic reports, NO mechanical rundowns (forbidden: "contradictions are clear", "analysis shows")
- Translate divination data into human storytelling imagery (Earth → mountain/soil, Water → river/ocean, Fire → flame, Wood → tree/vine, Metal → blade/stone)

【Narrative Structure】
1. Open with a soul-painting scene (not a data summary)
2. Weave Bazi, Zodiac, I Ching/Tarot naturally together — not reporting each separately
3. Turn contradictions into "destined lessons", not "risk warnings"
4. End with soul-level hope and concrete action guidance, always positive

【Emotional Hook】(adjusted by overall score)
- ${scoreHook}

【Absolute Rules — ZERO TOLERANCE】
1. Only respond in English. Never mix in other languages
2. Do NOT invent Tarot, zodiac, or divination systems not in the data
3. Never predict breakups. Always give hope
4. SCORE ABSOLUTE: The overall score in Section 4 MUST be an EXACT copy of the 'overall' field from the input JSON — no exceptions, no rounding, no calculation. Also: you must list sub-scores EXACTLY as they appear in the 'dims' array from the input. NEVER invent or change any number.
5. TAROT ABSOLUTE: The Tarot card name and orientation shown in the input data (e.g. "The Hermit (Upright)" or "The Hermit (Reversed)") is the GROUND TRUTH. Section 4 MUST reproduce the EXACT orientation from the input. If the input says "Upright": interpret the card's POSITIVE meaning. If the input says "Reversed": interpret the card's CHALLENGING meaning. NEVER write the opposite orientation's narrative.

[Narrative & Synthesis Rules — apply to ALL languages]
1. METAPHORICAL UPGRADING FOR AFFLICTIONS: NEVER translate astrological conflicts (Tự Hình, Lục Xung, Harsh Aspects) into dry analysis or generic warnings. Map them to physical/psychological metaphors: Self-Punishment (Tự Hình) → "internal flame consuming oneself" or "self-woven cocoon of overthinking"; Clashes (Lục Xung) → "subterranean earthquake" shattering boundaries; Harsh Tarot (Devil/Tower) → karmic blockages being dissolved (e.g. Devil Reversed = "severing invisible chains of obsession").
2. DYNAMIC ELEMENT CHEMISTRY: When discussing Day Masters or Elements, do NOT say "they control/support each other". Write their interaction as a changing landscape: Thổ vs Thủy → steady dam vs raging ocean; Hỏa vs Thủy → sunshine warming cold dew or water extinguishing core flame; Phong vs Thủy → wind whipping waves or ocean soaking wings of freedom.
3. THREE-ACT SPIRITUAL REDEMPTION ARC for Section 4: Act 1 (The Beautiful Illusion) → start with the most positive alignment (Western Synastry Trine or favorable Bazi), describe the fated connection; Act 2 (The Cosmic Ultimatum) → introduce the clash (Tự Hình, Lục Xung, Square, or Changing Hexagram) as a fated test, use the I Ching Line Change as the precise tipping point; Act 3 (The Spiritual Key) → use the Transformed Hexagram combined with Tarot advice as a concrete psychological tool, show how Western emotional intelligence dissolves Eastern karmic friction. END OF RULES`;

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

  // ── Input validation (fail fast) ──
  if (!d1 || !d2) {
    return res.status(400).json({ error: 'Missing birth dates (d1, d2) in request body' });
  }
  if (typeof overall !== 'number' || overall < 0 || overall > 100) {
    return res.status(400).json({ error: `Invalid overall score: ${overall}. Must be a number between 0 and 100.` });
  }
  if (!dims || typeof dims !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid dims object in request body' });
  }
  // Validate that at least one dim score exists
  const hasAnyDim = dims.love || dims.communication || dims.chemistry || dims.stability;
  if (!hasAnyDim) {
    return res.status(400).json({ error: 'No dimension scores found in dims object' });
  }
  // Validate tarot orientation if present
  if (iching?.tarot?.orientation && !['Upright', 'Reversed'].includes(iching.tarot.orientation)) {
    console.warn('[ai-insight] Invalid tarot orientation:', iching.tarot.orientation);
    // Don't fail - just log a warning, AI can handle unknown orientation
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'DeepSeek API key not configured' });
  }

  const key = cacheKey(d1, d2, overall, dims, lang);

  // ── L1: In-memory cache (fast) ──
  if (insightCache.has(key)) {
    return res.status(200).json({ insight: insightCache.get(key), cached: true });
  }

  // ── L2: Supabase cache (persistent, with version check) ──
  if (supabase) {
    const { data: cached } = await supabase
      .from('ai_insights_cache')
      .select('insight, prompt_version')
      .eq('cache_key', key)
      .single();
    if (cached?.insight && cached?.prompt_version === PROMPT_VERSION) {
      console.log('[ai-insight] Supabase cache hit (version', PROMPT_VERSION, '):', key);
      // Save to L1 cache
      insightCache.set(key, cached.insight);
      if (insightCache.size > MAX_CACHE) insightCache.clear();
      return res.status(200).json({ insight: cached.insight, cached: true });
    }
  }

  const { systemPrompt, userPrompt } = buildPrompt(
    { d1, d2, overall, dims, bazi, zodiac, iching },
    lang
  );

  // ── DEBUG: Print actual prompts sent to DeepSeek ──
  console.log('[ai-insight] === PROMPTS SENT TO DEEPSEEK ===');
  console.log('[ai-insight] lang:', lang);
  console.log('[ai-insight] systemPrompt (first 200 chars):', systemPrompt?.substring(0, 200));
  console.log('[ai-insight] userPrompt (FULL):', userPrompt);
  console.log('[ai-insight] === END PROMPTS ===');

  try {
    const response = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 0.1,  // Lower temperature for more deterministic output (prevents language fallback)
        max_tokens: 400,
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

    // ── Language detection & translation fallback (100% reliability) ──
    console.log('[ai-insight] 🔍 Checking language... lang=', lang);
    console.log('[ai-insight] 🔍 insight text (first 200 chars):', insight?.substring(0, 200));
    
    const isVietnamese = (text) => /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text);
    const isThai = (text) => /[฀-๿]/i.test(text);
    const isFrench = (text) => /[àâäçéèêëïîôùûüÿñæœ]/i.test(text);
    const isSpanish = (text) => /[áéíóúñ¿¡]/i.test(text);
    
    let needsTranslation = false;
    if (lang === 'vi') needsTranslation = !isVietnamese(insight);
    else if (lang === 'th') needsTranslation = !isThai(insight);
    else if (lang === 'fr') needsTranslation = !isFrench(insight);
    else if (lang === 'es') needsTranslation = !isSpanish(insight);
    
    console.log('[ai-insight] 🔍 needsTranslation=', needsTranslation, ' (lang=', lang, ')');

    if (needsTranslation) {
      console.log('[ai-insight] ⚠️ Wrong language detected! lang=', lang, ' insight=', insight.substring(0, 100));
      console.log('[ai-insight] 🌐 Translating to', lang, '...');
      
      // Call DeepSeek again to translate
      const langNames = { vi: 'Vietnamese', th: 'Thai', fr: 'French', es: 'Spanish', zh: 'Chinese', en: 'English' };
      const targetLang = langNames[lang] || 'English';
      
      const translateResponse = await fetch(DEEPSEEK_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: `You are a professional translator. Translate the user's text to ${targetLang}. Output ONLY the translated text, no explanations.` },
            { role: 'user', content: insight }
          ],
          temperature: 0.05,
          max_tokens: 500,
        }),
      });
      
      if (translateResponse.ok) {
        const translateData = await translateResponse.json();
        const translated = translateData.choices?.[0]?.message?.content?.trim();
        if (translated) {
          console.log('[ai-insight] ✅ Translation succeeded!');
          insight = translated;
        }
      } else {
        console.error('[ai-insight] ❌ Translation failed! Using original text.');
      }
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

    // ── Save to Supabase cache (persistent, with version) ──
    if (supabase) {
      await supabase
        .from('ai_insights_cache')
        .upsert(
          { cache_key: key, insight: clean, prompt_version: PROMPT_VERSION },
          { onConflict: 'cache_key' }
        );
      console.log('[ai-insight] Saved to Supabase cache:', key);
    }

    return res.status(200).json({ insight: clean, cached: false });
  } catch (err) {
    console.error('ai-insight handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
