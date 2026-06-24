export const runtime = 'nodejs';

// ── Cache config ──
const CACHE_TTL_HOURS = 336; // 14天
const PROMPT_VERSION = 'v1.0';

function cacheKey(d1, d2, lang) {
  return `compat:${d1}|${d2}|${lang}`;
}

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

// 2. 塔罗牌意过滤：根据 orientation 截取正位或逆位部分
function filterTarotMeaning(meaning, orientation, lang) {
  if (!meaning) return '';
  
  // 判断是否为逆位
  const reversedKeywords = {
    vi: ['Ngược', 'ngược'],
    th: ['กลับด้าน'],
    zh: ['逆位', '逆'],
    en: ['Reversed', 'reversed'],
    es: ['Invertido', 'invertido'],
    fr: ['Inversé', 'inversé']
  };
  
  const keywords = reversedKeywords[lang] || [];
  const isReversed = keywords.some(k => orientation.includes(k));
  
  // 逆位关键词（各语言）
  const reversedMarkers = {
    vi: ['Nếu xuất hiện ngược', 'Nếu lá bài xuất hiện ngược', 'ngược', 'Nếu ngược'],
    th: ['เมื่ออยู่ในตำแหน่งกลับด้าน', 'กลับด้าน', 'หากกลับด้าน'],
    zh: ['逆位时', '逆位', '如果逆位'],
    en: ['Reversed,', 'Reversed.', 'If reversed', 'When reversed'],
    es: ['Invertido,', 'Invertido.', 'Si aparece invertido', 'Cuando está invertido'],
    fr: ['Inversé,', 'Inversé.', 'Si inversé', 'Quand inversé']
  };
  
  const markers = reversedMarkers[lang] || [];
  
  if (isReversed) {
    // 逆位：从第一个逆位标记开始截取，并改写成直接陈述
    for (const marker of markers) {
      const idx = meaning.indexOf(marker);
      if (idx !== -1) {
        let reversedText = meaning.substring(idx).trim();
        // 去掉假设性语句，改写成直接陈述
        // 越南语: "Nếu xuất hiện ngược, hãy..." -> "Hiện tại..."
        // 泰语: "เมื่ออยู่ในตำแหน่งกลับด้าน..." -> "ขณะนี้..."
        // 英语: "If reversed..." / "Reversed, it..." -> "Currently..."
        // 西班牙语: "Si aparece invertido..." -> "Actualmente..."
        // 法语: "Si inversé..." -> "Actuellement..."
        // 中文: "如果逆位..." / "逆位时..." -> "当前..."
        const rewriteRules = [
          { pattern: /^Nếu xuất hiện ngược, /i, replacement: 'Hiện tại, ' },
          { pattern: /^Nếu lá bài xuất hiện ngược, /i, replacement: 'Hiện tại, ' },
          { pattern: /^Nếu ngược, /i, replacement: 'Hiện tại, ' },
          { pattern: /^เมื่ออยู่ในตำแหน่งกลับด้าน,?/i, replacement: 'ขณะนี้,' },
          { pattern: /^หากกลับด้าน,?/i, replacement: 'ขณะนี้,' },
          { pattern: /^If reversed,?\s*/i, replacement: 'Currently, ' },
          { pattern: /^When reversed,?\s*/i, replacement: 'Currently, ' },
          { pattern: /^Reversed,?\s*/i, replacement: 'Currently, ' },
          { pattern: /^Si aparece invertido,?\s*/i, replacement: 'Actualmente, ' },
          { pattern: /^Cuando está invertido,?\s*/i, replacement: 'Actualmente, ' },
          { pattern: /^Invertido,?\s*/i, replacement: 'Actualmente, ' },
          { pattern: /^Si inversé,?\s*/i, replacement: 'Actuellement, ' },
          { pattern: /^Quand inversé,?\s*/i, replacement: 'Actuellement, ' },
          { pattern: /^Inversé,?\s*/i, replacement: 'Actuellement, ' },
          { pattern: /^如果逆位[，,]?\s*/i, replacement: '当前，' },
          { pattern: /^逆位时[，,]?\s*/i, replacement: '当前，' },
        ];
        for (const rule of rewriteRules) {
          reversedText = reversedText.replace(rule.pattern, rule.replacement);
        }
        return reversedText;
      }
    }
    // 如果找不到逆位标记，返回原文
    return meaning;
  } else {
    // 正位：截取到第一个逆位标记之前
    for (const marker of markers) {
      const idx = meaning.indexOf(marker);
      if (idx !== -1) {
        return meaning.substring(0, idx).trim();
      }
    }
    // 如果找不到逆位标记，返回原文
    return meaning;
  }
}
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
  // orientation 字段格式：" (Ngược)" 或 " (Thuận)"（越南语）
  // 需要判断是否包含逆位关键词
  const orient = tarot?.orientation || '';
  const isReversed = ['Ngược','Reversed','กลับด้าน','Inversé','Invertido','逆位'].some(s => orient.includes(s));
  return isReversed ? m.rev : m.up;
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
    systemPrompt: "คุณเป็นปรมาจารย์ด้านโหราศาสตร์และจิตวิญญาณระดับสูง เขียนบทวิเคราะห์เชิงลึกโดยใช้โครงสร้าง 4 ส่วนที่กำหนดอย่างเคร่งครัด ห้ามเขียนคำนำ ห้ามเขียนหัวข้อเกิน ห้ามพร่ำเพ้อ ย่อหน้าละ 2-3 ประโยค ห้ามเปลี่ยนตัวเลข ห้ามเปลี่ยนสถานะไพ่จากที่ระบุ ห้ามเขียน (ตั้งตรง) เองโดยเด็ดขาดต้องใช้งานสถานะไพ่จากข้อมูลที่ให้มาทุกตัวอักษร ห้ามเขียนคำแนะนำพิธีกรรมทางศาสนาหรือไสยศาสตร์เด็ดขาด เช่น นั่งสมาธิ สวดมนต์ บูชาวิญญาณ ให้เน้นคำแนะนำการใช้ชีวิตร่วมกันในโลกจริงที่มนุษย์พูดคุยกันได้ รวมความยาวไม่เกิน 200 คำ\n\n[บังคับการสะกดคำ] ตรวจสอบการสะกดภาษาไทยก่อนตอบ ห้ามใช้คำผิด\n\n[บังคับราศีคะแนนสูง] หากราศีได้คะแนนสูง (>75) แต่อธิบายว่ายังมีความขัดแย้ง กรุณาอธิบายด้านมืด (dark side) ของมุมมองนั้น: ความกลมกลืนที่ผิวเผินซ่อนความขัดแย้งภายใน หรือพลังงานที่เหมือนกันเกินไปขาดแรงกระตุ้น",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot, zodiacMeta, luckyAspects, challengingAspects) => {
      const statusText = getOrientText(tarot, 'th');
      const cardName = tarot?.name || '';
      const coreKeyword = getTarotCoreKeyword(tarot?.meaning, 'th');
      const sign1 = zodiacMeta?.[0] || '';
      const sign2 = zodiacMeta?.[1] || '';
      const luckyText = (luckyAspects && luckyAspects.length > 0) ? luckyAspects.join(', ') : '';
      const challengeText = (challengingAspects && challengingAspects.length > 0) ? challengingAspects.join(', ') : '';
      return [
        `[ข้อมูลบังคับ] คะแนนรวม=${overall}, บาซี=${baziScore}, ราศี=${zodiacScore}, อี้จิง=${ichingScore}, ไพ่=${cardName}, สถานะไพ่=${statusText}`,
        `ไพ่เชิงลึก: ${tarot?.meaning || ''}`,
        `แก่นไพ่(ต้องใช้ใน💡): ${coreKeyword}`,
        `ราศีจริง: ${sign1} และ ${sign2}`,
        luckyText ? `ด้านที่เกื้อหนุน: ${luckyText}` : '',
        challengeText ? `ด้านที่ต้องระวัง: ${challengeText}` : '',
        ``,
        `[คำสั่งบังคับเด็ดขาด — อ่านก่อนเขียน]`,
        `- 🔴 CRITICAL ด้านสถานะไพ่ (Orientation Lock):`,
        `  - ห้ามคิดคำว่า (ตั้งตรง) เองเด็ดขาด! ต้องอ่านสถานะไพ่จาก [ข้อมูลบังคับ] ว่า=${statusText} แล้วเขียนสถานะนั้นทุกตัวอักษร`,
        `  - หาก ${statusText} = "กลับด้าน" (Reversed): ห้ามเขียน "ตั้งตรง" เด็ดขาด`,
        `  - หาก ${statusText} = "ตั้งตรง" (Upright): ห้ามเขียน "กลับด้าน" หรือ "หากกลับด้าน" เด็ดขาด! ต้องวิเคราะห์แต่ด้านตั้งตรงเท่านั้น`,
        `  - ตรวจสอบสถานะไพ่ก่อนเขียนทุกย่อหน้า`,
        `- 🔴 CRITICAL ด้านราศี (Zodiac Lock):`,
        `  - ห้ามใช้ราศีอื่นนอกจาก ${sign1} และ ${sign2} เด็ดขาด!`,
        `  - ห้ามนำราศีจากรอบก่อนหน้ามาใช้`,
        `- ห้ามแนะนำพิธีกรรมทางศาสนาหรือไสยศาสตร์เด็ดขาด`,
        `- หาก baziScore === zodiacScore ห้ามใช้คำว่าขัดแย้ง แต่ให้เขียนว่าพลังงานสมดุล`,
        `${zodiacScore >= 75 ? `[หมายเหตุพิเศษ] ราศี ${zodiacScore} คะแนนสูงแต่ต้องวิเคราะห์ด้านมืดของมุมมองนี้ — เช่น ความกลมกลืนผิวเผินซ่อนความขัดแย้งภายใน หรือพลังงานเหมือนกันเกินไปขาดแรงกระตุ้น` : ''}`,
        ``,
        `[โครงสร้างบังคับ — เขียนตามนี้ทุกประการ ห้ามเปลี่ยน emoji หรือหัวข้อ]`,
        `🎯 **บทสรุปหลัก:** [1 ประโยคสรุปความสัมพันธ์จากคะแนนรวม ${overall} ให้ตรงกับข้อมูลจริง]`,
        ``,
        `⚡ **จุดขัดแย้ง:** [2 ประโยค: ทำไมบาซี ${baziScore} กับราศี ${zodiacScore} (${sign1} vs ${sign2}) สะท้อนความตึงเครียดในชีวิตจริง${luckyText ? ` แม้จะมีด้านเกื้อหนุนเช่น ${luckyText}` : ''}${challengeText ? ` แต่ด้านที่ต้องระวังคือ ${challengeText}` : ''}]`,
        ``,
        `💡 **ทางออก:** ใช้อี้จิง ${ichingScore} กับไพ่${cardName}(${statusText}) [2 ประโยคต่อจากนี้โดยอิงจากแก่นไพ่"${coreKeyword}"${luckyText ? `. บังคับเน้นด้านเกื้อหนุน: ${luckyText}` : ''}${challengeText ? `. บังคับแก้ไขด้านที่ต้องระวัง: ${challengeText}` : ''} ให้คำแนะนำการอยู่ร่วมกันในชีวิตประจำวันที่จับต้องได้จริง ห้ามมีพิธีกรรมทางไสยศาสตร์]`,
        ``,
        `🌿 **พลังจิตวิญญาณ:** [1 ประโยคปิดท้ายให้กำลังใจและดึงสติ] 🌿 ✨ 🔮`,
      ].filter(Boolean).join('\n');
    }
  },
  zh: {
    systemPrompt: `你是精通八字、占星与易经的命理导师。严格按照4段结构输出，每段2-3句话，总字数不超过200字。第一句直接给结论，不要废话前缀，不要标题序号（如"4、"），严禁在🎯前加任何其他标题或前缀。严禁篡改任何分数。严禁写错塔罗牌正逆位状态。严禁写任何迷信仪式（如烧纸、做法、诵经）。`,
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot, zodiacMeta, luckyAspects, challengingAspects) => {
      const statusText = getOrientText(tarot, 'zh');
      const cardName = tarot?.name || '';
      const coreKeyword = getTarotCoreKeyword(tarot?.meaning, 'zh');
      const sign1 = zodiacMeta?.[0] || '';
      const sign2 = zodiacMeta?.[1] || '';
      return [
        `[强制数据锁] 综合评分=${overall}, 八字=${baziScore}, 星座=${zodiacScore}, 易经=${ichingScore}, 塔罗=${cardName}, 正逆位=${statusText}`,
        `牌意: ${tarot?.meaning || ''}`,
        `牌核(用于💡): ${coreKeyword}`,
        `实际星座: ${sign1} 和 ${sign2}`,
        ``,
        `[关键规则]`,
        `- 正位时牌意段落严禁出现“逆位”字样`,
        `- 冲突分析必须用 ${sign1} 和 ${sign2}, 严禁用其他星座`,
        ``,
        `[输出结构 — 严格执行]`,
        `🎯 **核心结论:** [1句话，根据综合评分${overall}直接定性这段关系]`,
        ``,
        `⚡ **命运冲突:** [2句话：八字${baziScore}与星座${zodiacScore}(${sign1} vs ${sign2})暴露的核心矛盾]`,
        ``,
        `💡 **破局建议:** 易经${ichingScore}与塔罗${cardName}(${statusText}) [写2句话继续，围绕"${coreKeyword}"给出在现实生活中的具体相处建议，严禁迷信仪式]`,
        ``,
        `🌿 **灵性指引:** [1句话收尾祝福] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  vi: {
    systemPrompt: "Bạn là bậc thầy chiêm tinh cấp cao. Viết theo cấu trúc 4 phần, mỗi phần 2-3 câu, tổng không quá 200 từ. KHÔNG được thay đổi bất kỳ con số nào. CRITICAL: Nếu trạng thái bài Tarot là \"Ngược\", bài học là về mặt hạn chế, ảo tưởng, hoặc sự suy giảm — không phải là 'tạm thời có mây che'. Phân tích đúng nghĩa thực sự của lá bài khi ngược. CẤM ĐOẠN tuyệt đối không được viết từ \"Xuôi\" hoặc bất kỳ từ nào có nghĩa là vị trí bình thường. Nếu trạng thái là \"Xuôi\", CẤM ĐOẠN tuyệt đối không được viết \"Ngược\". PHẢI kiểm tra trạng thái bài trước khi viết từng đoạn. Không viết lễ nghi mê tín (đốt vàng mã, tụng kinh, làm phép). Tập trung vào lời khuyên thực tế cho đời sống thật. Kiểm tra chính tả kỹ trước khi trả lời — đặc biệt: 'nhàm chán' (không phải 'nhàm chám'), 'trì trệ' (không phải 'tồi tệ'), 'ý nghĩa' (đúng chính tả). Nếu Cung Hoàng Đạo điểm cao (>75) nhưng vẫn có xung đột, hãy giải thích mặt tối của góc chiếu: phân tích mặt hạn chế trong sự hài hòa bề mặt.",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot, zodiacMeta, luckyAspects, challengingAspects) => {
      const statusText = getOrientText(tarot, 'vi');
      const cardName = tarot?.name || '';
      const coreKeyword = tarot?.meaning?.split('—')[0]?.trim() || '';
      const sign1 = zodiacMeta?.[0] || '';
      const sign2 = zodiacMeta?.[1] || '';
      // 军师要求：Tag 融入建议段落
      const luckyText = (luckyAspects && luckyAspects.length > 0) ? luckyAspects.join(', ') : '';
      const challengeText = (challengingAspects && challengingAspects.length > 0) ? challengingAspects.join(', ') : '';
      return [
        `[Khóa dữ liệu] Tổng=${overall} (điểm tổng kết = Bát Tự*0.4 + Cung Hoàng Đạo*0.4 + Kinh Dịch*0.2), Bát Tự=${baziScore}, Cung Hoàng Đạo=${zodiacScore}, Kinh Dịch=${ichingScore}, Tarot=${cardName}, Trạng thái=${statusText}`,
        `Ý nghĩa: ${tarot?.meaning || ''}`,
        `Lõi bài: ${coreKeyword}`,
        `Cung hoàng đạo thực tế: ${sign1} và ${sign2}`,
        luckyText ? `Khía cạnh thuận lợi: ${luckyText}` : '',
        challengeText ? `Khía cạnh cần lưu ý: ${challengeText}` : '',
        ``,
        `[KHÓA TRẠNG THÁI BÀI TAROT — đọc kỹ trước khi viết]`,
        `- Nếu Trạng thái = "Ngược": CẤM ĐOẠN tuyệt đối cấm dùng từ "Xuôi" hoặc bất kỳ từ nào có nghĩa là vị trí bình thường. Mọi nhắc đến bài tarot phải dùng đúng trạng thái: ${statusText}.`,
        `- Nếu Trạng thái = "Xuôi": CẤM ĐOẠN tuyệt đối cấm dùng từ "Ngược" hoặc "Nếu xuất hiện ngược". Khi lá bài ở trạng thái Xuôi, TOÀN BỘ đoạn giải thích牌意 PHẢI chỉ nói về ý nghĩa Xuôi, CẤM ĐOẠN nhắc đến "ngược" hoặc "nếu ngược".`,
        `- Kiểm tra kỹ trạng thái bài trước khi viết từng đoạn.`,
        ``,
        `[QUAN TRỌNG: Cung hoàng đạo]`,
        `- Khi phân tích xung đột, BẮT BUỘC dùng đúng hai cung hoàng đạo đã cho: ${sign1} và ${sign2}.`,
        `- CẤM ĐOẠN dùng cung hoàng đạo khác hoặc tự bịa ra.`,
        ``,
        `[Cấu trúc bắt buộc — không đổi emoji hay tiêu đề]`,
        `🎯 **Kết luận cốt lõi:** [1 câu tóm tắt mối quan hệ dựa trên điểm ${overall}]`,
        ``,
        `⚡ **Điểm xung đột:** [2 câu: Bát Tự ${baziScore} và Cung Hoàng Đạo ${zodiacScore} (${sign1} vs ${sign2}) phản ánh mâu thuẫn gì]`,
        `${zodiacScore >= 75 ? `[LƯU Ý: Cung Hoàng Đạo ${zodiacScore} điểm cao nhưng cần phân tích mặt tối của góc chiếu — ví dụ: sự hài hòa bề mặt che giấu mâu thuẫn nội tại, hoặc năng lượng quá đồng nhất thiếu kích thích]` : ''}`,
        ``,
        `💡 **Đề xuất thực tế:** Kinh Dịch ${ichingScore} và Tarot ${cardName}(${statusText}) [2 câu tiếp theo, dựa trên lõi "${coreKeyword}"${luckyText ? `. BẮT BUỘC tập trung vào khía cạnh thuận lợi: ${luckyText}` : ''}${challengeText ? `. BẮT BUỘC giải quyết khía cạnh cần lưu ý: ${challengeText}` : ''}. Đưa ra gợi ý kết nối thực tế trong cuộc sống hằng ngày, không có nghi lễ mê tín]`,
        ``,
        `🌿 **Hướng dẫn tâm linh:** [1 câu chúc phúc kết thúc] 🌿 ✨ 🔮`,
      ].filter(Boolean).join('\n');
    }
  },
  en: {
    systemPrompt: "You are an elite spiritual astrologer. Write in exactly 4 sections, 2-3 sentences each, under 200 words total. No preamble, no numbering. Never alter any scores. Never change the tarot orientation — if Orientation is \"Reversed\", you are STRICTLY FORBIDDEN from writing the word \"upright\" anywhere in your analysis. All references to the tarot card must exactly match the given Orientation status. Never suggest superstitious rituals (burning paper, chanting, spells, meditation). Focus on practical relationship advice for real life.",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot, zodiacMeta, luckyAspects, challengingAspects) => {
      const statusText = getOrientText(tarot, 'en');
      const cardName = tarot?.name || '';
      const coreKeyword = tarot?.meaning?.split('—')[0]?.trim() || '';
      const sign1 = zodiacMeta?.[0] || '';
      const sign2 = zodiacMeta?.[1] || '';
      return [
        `[DATA LOCK] Overall=${overall}, Bazi=${baziScore}, Zodiac=${zodiacScore}, IChing=${ichingScore}, Tarot=${cardName}, Orientation=${statusText}`,
        `Meaning: ${tarot?.meaning || ''}`,
        `Core keyword (for 💡): ${coreKeyword}`,
        `Actual zodiac signs: ${sign1} and ${sign2}`,
        ``,
        `[CRITICAL RULES]`,
        `- If Orientation = "Upright": Entire card explanation MUST ONLY describe upright meaning. BAN all "Reversed" or "if reversed" sentences.`,
        `- Zodiac analysis MUST use ${sign1} and ${sign2} only. BAN other signs from previous rounds.`,
        ``,
        `[MANDATORY STRUCTURE — do not change emojis or headers]`,
        `🎯 **Core Verdict:** [1 sentence summarizing the relationship based on score ${overall}]`,
        ``,
        `⚡ **Tension Points:** [2 sentences: how Bazi ${baziScore} and Zodiac ${zodiacScore} (${sign1} vs ${sign2}) reveal core friction]`,
        ``,
        `💡 **Path Forward:** IChing ${ichingScore} and Tarot ${cardName}(${statusText}) [2 sentences continuing from here, based on core "${coreKeyword}" — give practical relationship advice for real life. No superstitious rituals.]`,
        ``,
        `🌿 **Spiritual Guidance:** [1 closing blessing] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  es: {
    systemPrompt: "Eres un maestro astrólogo espiritual. Escribe en exactamente 4 secciones, 2-3 oraciones cada una, bajo 200 palabras. Sin preámbulo, sin numeración. Nunca alteres ninguna puntuación. CRÍTICO — Si la Orientación del tarot es \"Invertido\": QUEDA TERMINANTEMENTE PROHIBIDO usar las palabras \"en derecho\", \"al derecho\" o cualquier término que signifique posición normal. Si la Orientación es \"Derecho\": QUEDA TERMINANTEMENTE PROHIBIDO usar \"invertido\". Nunca sugieras rituales supersticiosos (quemar papel, rezar, hacer hechizos).",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot, zodiacMeta, luckyAspects, challengingAspects) => {
      const statusText = getOrientText(tarot, 'es');
      const cardName = tarot?.name || '';
      const coreKeyword = tarot?.meaning?.split('—')[0]?.trim() || '';
      const sign1 = zodiacMeta?.[0] || '';
      const sign2 = zodiacMeta?.[1] || '';
      return [
        `[BLOQUEO DE DATOS] General=${overall}, Bazi=${baziScore}, Horóscopo=${zodiacScore}, IChing=${ichingScore}, Tarot=${cardName}, Orientación=${statusText}`,
        `Significado: ${tarot?.meaning || ''}`,
        `Palabra clave central: ${coreKeyword}`,
        `Signos zodiacales reales: ${sign1} y ${sign2}`,
        ``,
        `[REGLAS CRÍTICAS]`,
        `- Si Orientación = "Derecho": Todo la explicación de la carta DEBE describir SOLO el significado derecho. PROHIBIDO escribir "Invertido" o "si aparece invertido".`,
        `- Análisis zodiacal DEBE usar solo ${sign1} y ${sign2}. PROHIBIDO usar otros signos.`,
        ``,
        `[ESTRUCTURA OBLIGATORIA — no cambiar emojis ni títulos]`,
        `🎯 **Veredicto central:** [1 oración resumiendo la relación según puntuación ${overall}]`,
        ``,
        `⚡ **Puntos de tensión:** [2 oraciones: cómo Bazi ${baziScore} y Horóscopo ${zodiacScore} (${sign1} vs ${sign2}) revelan fricción]`,
        ``,
        `💡 **Camino adelante:** IChing ${ichingScore} y Tarot ${cardName}(${statusText}) [2 oraciones continuando desde aquí, basado en "${coreKeyword}" — dar consejo práctico de relación real. Sin rituales supersticiosos.]`,
        ``,
        `🌿 **Guía espiritual:** [1 bendición final] 🌿 ✨ 🔮`,
      ].join('\n');
    }
  },
  fr: {
    systemPrompt: "Vous êtes un astrologue spirituel d'élite. Écrivez en exactement 4 sections, 2-3 phrases chacune, sous 200 mots. Pas de préambule, pas de numérotation. Ne modifiez aucun score. Ne changez jamais l'orientation du tarot. Ne suggérez jamais de rituels superstitieux (brûler du papier, prières, sorts).",
    buildPrompt: (overall, baziScore, zodiacScore, ichingScore, tarot, zodiacMeta, luckyAspects, challengingAspects) => {
      const statusText = getOrientText(tarot, 'fr');
      const cardName = tarot?.name || '';
      const coreKeyword = tarot?.meaning?.split('—')[0]?.trim() || '';
      const sign1 = zodiacMeta?.[0] || '';
      const sign2 = zodiacMeta?.[1] || '';
      return [
        `[VERROUILLAGE DES DONNÉES] Global=${overall}, Bazi=${baziScore}, Horoscope=${zodiacScore}, YiJing=${ichingScore}, Tarot=${cardName}, Orientation=${statusText}`,
        `Signification: ${tarot?.meaning || ''}`,
        `Mot-clé central: ${coreKeyword}`,
        `Signes zodiacaux réels: ${sign1} et ${sign2}`,
        ``,
        `[RÈGLES CRITIQUES]`,
        `- Si Orientation = "Droit": Toute l'explication de la carte DOIT décrire UNIQUEMENT le sens droit. INTERDIT d'écrire "Inversé" ou "si inversé".`,
        `- L'analyse zodiacale DOIT utiliser uniquement ${sign1} et ${sign2}. INTERDIT d'utiliser d'autres signes.`,
        ``,
        `[STRUCTURE OBLIGATOIRE — ne pas modifier emojis ni titres]`,
        `🎯 **Verdict central:** [1 phrase résumant la relation selon le score ${overall}]`,
        ``,
        `⚡ **Points de tension:** [2 phrases: comment Bazi ${baziScore} et Horoscope ${zodiacScore} (${sign1} vs ${sign2}) révèlent des frictions]`,
        ``,
        `💡 **Voie à suivre:** YiJing ${ichingScore} et Tarot ${cardName}(${statusText}) [2 phrases continuant depuis ici, basé sur "${coreKeyword}" — donner des conseils relationnels pratiques. Pas de rituels superstitieux.]`,
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

  // ── Per-plan access control: compatibility AI insight ──
  let paidPlans = {};
  let currentUserId = null;
  let usingMonthlyAllowance = false;
  let usingStarVip = false;

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': anonKey || serviceKey },
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const { id: userId } = await userRes.json();
    currentUserId = userId;

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${userId}&select=paid_plans&limit=1`,
      { headers: { 'Authorization': `Bearer ${serviceKey}`, 'apikey': serviceKey } }
    );
    const profiles = await profileRes.json();
    paidPlans = profiles?.[0]?.paid_plans || {};

    const now = new Date();
    let hasAccess = false;

    // 1. Direct one-time access
    if (paidPlans.compatibility_once === true || paidPlans.insight_once === true) {
      hasAccess = true;
    }

    // 2. Legacy monthly subscription (the old 'monthly' plan)
    if (!hasAccess && paidPlans.monthly === true) {
      hasAccess = true;
    }

    // 3. All-pass yearly (not expired)
    if (!hasAccess && paidPlans.all_pass_yearly === true) {
      const expiresAt = paidPlans.all_pass_expires_at;
      if (!expiresAt || now < new Date(expiresAt)) {
        hasAccess = true;
      }
    }

    // 4. Star VIP monthly has a monthly allowance for compatibility readings
    if (!hasAccess && paidPlans.star_monthly_vip === true) {
      const used = paidPlans.star_monthly_compatibility_used || 0;
      const allowance = paidPlans.star_monthly_compatibility_allowance || 0;
      const resetsAt = paidPlans.star_monthly_resets_at;
      if (used < allowance && resetsAt && now < new Date(resetsAt)) {
        hasAccess = true;
        usingMonthlyAllowance = true;
        usingStarVip = true;
      }
    }

    // 5. Wealth monthly has a monthly allowance for compatibility readings
    if (!hasAccess && paidPlans.wealth_monthly === true) {
      const used = paidPlans.compatibility_monthly_used || 0;
      const allowance = paidPlans.compatibility_monthly_allowance || 0;
      const resetsAt = paidPlans.compatibility_monthly_resets_at;
      if (used < allowance && resetsAt && now < new Date(resetsAt)) {
        hasAccess = true;
        usingMonthlyAllowance = true;
      }
    }

    if (!hasAccess) {
      return res.status(402).json({ error: 'Payment required', requiredPlan: 'compatibility_once' });
    }

    // If access is via monthly allowance, increment the used counter before proceeding
    if (usingMonthlyAllowance && currentUserId) {
      const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));

      if (usingStarVip) {
        // star_monthly_vip — uses star_monthly_compatibility_* fields
        const updatedPlans = {
          ...paidPlans,
          star_monthly_compatibility_used: (paidPlans.star_monthly_compatibility_used || 0) + 1,
          star_monthly_resets_at: paidPlans.star_monthly_resets_at || nextMonthStart.toISOString(),
        };
        try {
          await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(currentUserId)}`, {
            method: 'PATCH',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ paid_plans: updatedPlans }),
          });
        } catch (incrErr) {
          console.error('[ai-advisor] Failed to increment star_monthly_compatibility_used:', incrErr.message);
        }
      } else {
        // wealth_monthly — uses compatibility_monthly_* fields
        const updatedPlans = {
          ...paidPlans,
          compatibility_monthly_used: (paidPlans.compatibility_monthly_used || 0) + 1,
          compatibility_monthly_resets_at: paidPlans.compatibility_monthly_resets_at || nextMonthStart.toISOString(),
        };
        try {
          await fetch(`${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${encodeURIComponent(currentUserId)}`, {
            method: 'PATCH',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({ paid_plans: updatedPlans }),
          });
        } catch (incrErr) {
          console.error('[ai-advisor] Failed to increment compatibility_monthly_used:', incrErr.message);
        }
      }
    }
  } catch (err) {
    console.error('[ai-advisor] access check error:', err);
    return res.status(500).json({ error: 'Access check failed' });
  }

  try {
    const body = await parseRequestBody(req);
    const { bazi, zodiac, iching, tarot, lang = 'th', zodiacMeta, luckyAspects, challengingAspects } = body;

    if (!body.d1 || !body.d2) {
      return res.status(400).json({ error: 'Missing d1 or d2' });
    }

    // V9: 后端重算总分，不用前端传来的 overall（防止前端传错）
    const baziScore = extractScore(bazi);
    const zodiacScore = extractScore(zodiac);
    const ichingScore = extractScore(iching);
    // 三维度加权重算: 八字40% + 星座40% + 易经20%（与前端 algos/index.ts 保持一致）
    const computedOverall = Math.round(baziScore * 0.40 + zodiacScore * 0.40 + ichingScore * 0.20);

    const config = LANGUAGE_CONFIGS[lang] || LANGUAGE_CONFIGS['th'];
    console.log('[DEBUG] lang=', lang, 'luckyAspects=', luckyAspects, 'challengingAspects=', challengingAspects);
    
    // 过滤塔罗牌意：正位只保留正位部分，逆位只保留逆位部分
    const filteredTarot = tarot ? { ...tarot, meaning: filterTarotMeaning(tarot.meaning, tarot.orientation, lang) } : tarot;
    
    const finalPrompt = config.buildPrompt(computedOverall, baziScore, zodiacScore, ichingScore, filteredTarot, zodiacMeta, luckyAspects, challengingAspects);

    // ── Check Supabase cache (before AI call) ──
    const cKey = cacheKey(body.d1, body.d2, lang);
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;
    if (supabaseUrl && serviceKey) {
      try {
        const cacheCutoff = new Date(Date.now() - CACHE_TTL_HOURS * 3600000).toISOString();
        const cacheRes = await fetch(
          `${supabaseUrl}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cKey)}&created_at=gte.${encodeURIComponent(cacheCutoff)}&select=insight,prompt_version&limit=1`,
          { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
        );
        if (cacheRes.ok) {
          const rows = await cacheRes.json();
          const cached = rows?.[0];
          if (cached?.insight && cached?.prompt_version === PROMPT_VERSION) {
            console.log('[ai-advisor] Cache HIT:', cKey);
            return res.status(200).json({
              insight: cached.insight,
              cached: true,
              tarot: tarot || null,
              tarotLine: filteredTarot?.meaning || '',
            });
          }
        }
      } catch (cacheErr) {
        console.warn('[ai-advisor] Cache check failed, falling through:', cacheErr.message);
      }
    }

    const aiText = await callAI(config.systemPrompt, finalPrompt, process.env);

    let finalInsight = aiText || 'Unable to generate insight at this time.';
    finalInsight = finalInsight.replace(/(🎯|⚡|💡|🌿)/g, '\n\n$1').trim();
    finalInsight = finalInsight.replace(/^[\d]+[、.．]\s*/, '');
    finalInsight = finalInsight.replace(/\n*🦋[\s\S]*$/, '');

    // ── Save to Supabase cache ──
    if (supabaseUrl && serviceKey) {
      try {
        await fetch(
          `${supabaseUrl}/rest/v1/ai_insights_cache`,
          {
            method: 'POST',
            headers: {
              'apikey': serviceKey,
              'Authorization': `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
              cache_key: cKey,
              insight: finalInsight,
              prompt_version: PROMPT_VERSION,
            })
          }
        );
        console.log('[ai-advisor] Cache saved:', cKey);
      } catch (saveErr) {
        console.warn('[ai-advisor] Cache save failed:', saveErr.message);
      }
    }

    return res.status(200).json({
      insight: finalInsight,
      cached: false,
      tarot: tarot || null,
      tarotLine: filteredTarot?.meaning || '',
    });

  } catch (error) {
    console.error('AI Advisor Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
