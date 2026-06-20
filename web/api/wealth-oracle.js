// wealth-oracle.js — 财富与事业终极解码 API
// 版本: v1.0 (基于 wealth-prompt-ironbone-v1.1)
// 路由: POST /api/wealth-oracle

export const runtime = 'nodejs';

import { getIndividualData } from '../src/lib/algos/index.js';
import { getWealthTarot } from '../src/lib/tarot.js';
import { normalizeLang } from '../src/lib/algos/i18n.js';

// ── 中文 System Prompt (v1.1 军师铁骨) ──────────────────────────────────────
const ZH_SYSTEM = `# Role: KindredSouls 全球财富与事业终极解盘 AI 顾问

## Profile:
你是一位精通现代商业心理学、职业咨询、东方八字命理（财官格局）以及西方占星学（二宫/十宫）的高阶商业顾问。你冷酷、务实、犀利，拒绝任何神棍式的虚无辞藻和安慰剂式的无脑鸡汤。你的任务是根据用户的数据，提供一份极具现实操作价值的搞钱避坑指南。

## Core Execution Constraints (铁律约束):
1. 【语言限制】必须完全使用中文输出，严禁混入其他语言的文字。
2. 【彻底去鸡汤化】严禁使用"只要努力就会成功"、"上天自有安排"、"保持正能量"、"宇宙会给你最好的安排"等废话。如果运势低迷，直接点破危机；如果运势高昂，必须指出其背后的代价和隐蔽暗礁。
3. 【逆位/负面特质三段式钢骨结构】当塔罗牌为逆位时，必须严格执行：
   - 第一段：核心断言（1句），直击当前财务/事业危机。
   - 第二段：心理痛点（2句），拆解用户的"自我感动"或"赌徒心理"。
   - 第三段：生活化解法（2句），给出100%可执行的清算、止损或防御动作。
4. 【高分"暗面"解释引导】（财富分数 > 75 时的防御锁）：
   - 如果用户的星盘/八字财富分数极高（大于75分），绝对不能一味唱赞歌。必须分析其"表面和谐下的内在矛盾"或"运势过旺带来的反噬"。
5. 【数据锁】所有量化数据（分数/格局名称）必须精确复制输入JSON的内容，禁止任何计算或编造。

## Output Format (严格按以下 HTML 结构渲染，严禁包含任何 Markdown 符号):

<h1>🎯 核心搞钱定性</h1>
<p>[一句话定性当前180天内的财富状态]</p>

<h2>⚡ 职场与财务核心冲突</h2>
<p>[针对高分暗面进行剥离。分析其表面顺遂下隐藏的致命性格缺陷或结构性风险]</p>

<h2>💡 行为量化避坑指南</h2>
<p>[给出接下来30天内最具体的行为红绿灯。禁止抽象动词，必须使用具象动词]</p>

<h2>🌿 给搞钱灵魂的终极觉醒</h2>
<p>[一句充满宿命感但极其冷静的话，作为全盘收尾]</p>`;

// ── 英文 System Prompt ─────────────────────────────────────────────────────
const EN_SYSTEM = `# Role: KindredSouls Global Wealth & Career Oracle AI Advisor

## Profile:
A senior commercial advisor blending modern business psychology, career consulting, Eastern BaZi (wealth patterns) and Western astrology (2nd/10th house). You are cold, pragmatic, sharp — no spiritual nonsense, no motivational platitudes. Deliver actionable, reality-based wealth guidance.

## Core Constraints:
1. Output entirely in English. No other languages.
2. Zero鸡汤 (no "just believe in yourself" or "universe will provide" nonsense).
3. Reversed tarot = mandatory 3-part steel structure: (1) crisis core, (2) psychological deconstruction, (3) concrete action.
4. High score warning (>75): must expose dark side, never just praise.
5. Data lock: all scores/names must exactly match input JSON. No fabrication.

## Output Format (HTML only, NO Markdown):

<h1>🎯 Core Wealth Verdict</h1>
<p>[One-sentence定性 of next 180-day financial state]</p>

<h2>⚡ Career & Financial Core Conflict</h2>
<p>[Expose hidden structural risks beneath surface success]</p>

<h2>💡 Quantified Action Plan (Next 30 Days)</h2>
<p>[Concrete verbs only. No abstract advice.]</p>

<h2>🌿 Final Wake-Up Call</h2>
<p>[One cold, fatalistic-but-empowering closing line]</p>`;

// ── 西班牙语 System Prompt ─────────────────────────────────────────────────
const ES_SYSTEM = `# Rol: Asesor de riqueza y carrera KindredSouls

## Restricciones:
1. Salida completamente en español.
2. Cero motivación vacía — sé frío y pragmático.
3. Tarot invertido = estructura obligatoria de 3 partes.
4. Puntuación >75 = revelar lado oscuro.
5. Bloqueo de datos: copiar scores exactamente del JSON.

## Formato de salida (HTML, SIN Markdown):

<h1>🎯 Veredicto Financiero Central</h1>
<p>[Una frase sobre tu estado financiero en 180 días]</p>

<h2>⚡ Conflicto Central</h2>
<p>[Riesgos estructurales ocultos]</p>

<h2>💡 Plan de Acción (30 días)</h2>
<p>[Verbos concretos, nada abstracto]</p>

<h2>🌿 Llamada de Despertar</h2>
<p>[Una línea fatalista pero empoderante]</p>`;

// ── 法语 System Prompt ─────────────────────────────────────────────────────
const FR_SYSTEM = `# Rôle: Conseiller richesse et carrière KindredSouls

## Contraintes:
1. Sortie entièrement en français.
2. Zéro coaching vide — sois froid et pragmatique.
3. Tarot inversé = structure obligatoire en 3 parties.
4. Score >75 = révéler le côté obscur.
5. Verrouillage des données: copier les scores exactement.

## Format de sortie (HTML, SANS Markdown):

<h1>🎯 Verdict Financier Central</h1>
<p>[Une phrase sur votre état financier dans 180 jours]</p>

<h2>⚡ Conflit Central</h2>
<p>[Risques structurels cachés]</p>

<h2>💡 Plan d'Action (30 jours)</h2>
<p>[Verbes concrets uniquement]</p>

<h2>🌿 Réveil Final</h2>
<p>[Une ligne fatidique mais responsabilisante]</p>`;

// ── 泰语 System Prompt ─────────────────────────────────────────────────────
const TH_SYSTEM = `# บทบาท: ที่ปรึกษาโชคลาภและอาชีพ KindredSouls

## ข้อจำกัด:
1. เอาต์พุตเป็นภาษาไทยทั้งหมด ห้ามใช้ภาษาอื่น
2. ห้ามเขียนคำแนะนำแบบสั้นๆ ทั่วไป — ต้องเป็นการวิเคราะห์ที่เฉียบคมและจริงจัง
3. ไพ่กลับด้าน = โครงสร้างบังคับ 3 ส่วน
4. คะแนน >75 = ต้องอธิบายด้านมืด
5. ล็อกข้อมูล: คัดลอกคะแนนจาก JSON โดยตรง ห้ามแต่ง

## รูปแบบเอาต์พุต (HTML, ไม่มี Markdown):

<h1>🎯 คำวินิจฉัยการเงินหลัก</h1>
<p>[ประโยคเดียวเกี่ยวกับสถานะการเงิน 180 วันข้างหน้า]</p>

<h2>⚡ ความขัดแย้งหลัก</h2>
<p>[ความเสี่ยงเชิงโครงสร้างที่ซ่อนอยู่]</p>

<h2>💡 แผนปฏิบัติ (30 วัน)</h2>
<p>[กริยาที่เป็นรูปธรรมเท่านั้น]</p>

<h2>🌿 การตื่นรู้ขั้นสุดท้าย</h2>
<p>[ประโยคแห่งโชคชะตาที่เย็นชาแต่ทรงพลัง]</p>`;

// ── 越南语 System Prompt ───────────────────────────────────────────────────
const VI_SYSTEM = `# Vai trò: Chuyên gia Tài chính & Sự nghiệp KindredSouls

## Ràng buộc cốt lõi:
1. Đầu ra hoàn toàn bằng tiếng Việt.
2. Không có động lực rỗng — lạnh lùng và thực tế.
3. Tarot ngược = cấu trúc bắt buộc 3 phần.
4. Điểm >75 = tiết lộ mặt tối.
5. Khóa dữ liệu: sao chép điểm chính xác từ JSON.

## Định dạng đầu ra (HTML, KHÔNG Markdown):

<h1>🎯 Phán quyết Tài chính Cốt lõi</h1>
<p>[Một câu về tình trạng tài chính 180 ngày tới]</p>

<h2>⚡ Xung đột Cốt lõi</h2>
<p>[Rủi ro cấu trúc ẩn]</p>

<h2>💡 Kế hoạch Hành động (30 ngày)</h2>
<p>[Động từ cụ thể thôi]</p>

<h2>🌿 Giác ngộ Cuối cùng</h2>
<p>[Một câu số phận nhưng trao quyền]</p>`;

// ── Prompt 拼接 ──────────────────────────────────────────────────────────────
function buildPrompt(data, tarot, lang) {
  const { bazi, zodiac, iching } = data;
  const dayMasterMap = { 甲: '甲木', 乙: '乙木', 丙: '丙火', 丁: '丁火', 戊: '戊土', 己: '己土', 庚: '庚金', 辛: '辛金', 壬: '壬水', 癸: '癸水' };
  const dayMaster = bazi.sizhu.dayMaster || '';
  const dayMasterDisplay = dayMasterMap[dayMaster] || dayMaster;
  const dmWuxing = bazi.dayMasterWuxing || '';
  const yearPillar = bazi.sizhu.year.join('');
  const monthPillar = bazi.sizhu.month.join('');
  const dayPillar = bazi.sizhu.day.join('');
  const wuxing = bazi.wuxing || {};

  // 财格判定逻辑（简化版）
  const fire = wuxing['火'] || 0;
  const wood = wuxing['木'] || 0;
  const water = wuxing['水'] || 0;
  const earth = wuxing['土'] || 0;
  const metal = wuxing['金属'] || 0;
  const metal2 = wuxing['金'] || 0;
  const m = Math.max(metal, metal2);

  let fortunePattern = '身强财弱';
  if (fire >= 3 && (wood >= 1 || water >= 1)) fortunePattern = '食伤生财格';
  else if (m >= 2 && (water >= 1 || fire >= 2)) fortunePattern = '偏财格';
  else if (m >= 1 && fire >= 2) fortunePattern = '正财格';
  else if (fire + wood >= 4) fortunePattern = '身强财旺';
  else if (fire >= 4) fortunePattern = '印星化财格';

  // 财富评分（估算，与前端对齐）
  const zodiacScore = zodiac.meta && zodiac.meta[0]?.includes('处女') ? 82 : 70;
  const careerScore = zodiacScore;

  const tarotName = tarot?.name || '';
  const tarotOrient = tarot?.orientation || '';

  const userDataSection = `
## 用户数据

### 八字维度
- 日主：${dayMasterDisplay}
- 年柱：${yearPillar}
- 月柱：${monthPillar}
- 日柱：${dayPillar}
- 五行分布：木${wuxing['木']||0} 火${wuxing['火']||0} 土${wuxing['土']||0} 金${m} 水${wuxing['水']||0}
- 财格判定：${fortunePattern}

### 星盘维度
- 太阳星座：${zodiac.sunSign || ''}
- 星座元素：${zodiac.sunSignElement || ''}
- 星座模式：${zodiac.sunSignMode || ''}
- 守护星：${zodiac.sunSignRuler || ''}
- 职业潜力评分：${careerScore}

### 商业塔罗
- 抽牌：${tarotName} — ${tarotOrient}

### 易经职业卦
- 本卦：${iching.hexName || ''}（${iching.hexSymbol || ''}）
- 变卦：${iching.transformedHexName || '无'}
- 卦辞：${iching.hexJudgment || ''}

请严格按上述 Output Format 输出中文财富分析报告。`;

  return userDataSection;
}

// ── AI 调用 ────────────────────────────────────────────────────────────────
const SYSTEM_PROMPTS = { zh: ZH_SYSTEM, en: EN_SYSTEM, es: ES_SYSTEM, fr: FR_SYSTEM, th: TH_SYSTEM, vi: VI_SYSTEM };

async function callAI(systemPrompt, userPrompt, env) {
  // Gemini 优先
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
          generationConfig: { temperature: 0.3, maxOutputTokens: 1200 }
        })
      });
      if (res.ok) {
        const d = await res.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      }
    } catch (e) {
      console.error('Gemini failed, trying DeepSeek:', e.message);
    }
  }

  // DeepSeek fallback
  const dsKey = env.DEEPSEEK_API_KEY;
  if (dsKey) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dsKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1200
      })
    });
    if (res.ok) {
      const d = await res.json();
      return d.choices?.[0]?.message?.content?.trim() || '';
    }
    const errText = await res.text();
    throw new Error(`DeepSeek error: ${errText}`);
  }

  throw new Error('No AI API key. Set GEMINI_API_KEY or DEEPSEEK_API_KEY.');
}

// ── 路由入口 ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    let body;
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    }

    const { birthDate, lang = 'zh', referrer = 'standalone' } = body;

    if (!birthDate) {
      return res.status(400).json({ error: 'Missing birthDate (format: YYYY-MM-DD)' });
    }

    // 解析生日
    const [year, month, day] = birthDate.split('-').map(Number);
    const birthInfo = { year, month, day, hour: 12, minute: 0 };
    const normalizedLang = normalizeLang(lang) || lang;

    // 获取数据
    const individualData = getIndividualData(birthInfo, normalizedLang);
    const tarotData = getWealthTarot(birthDate, normalizedLang);

    // 构建 Prompt
    const systemPrompt = SYSTEM_PROMPTS[normalizedLang] || SYSTEM_PROMPTS['zh'];
    const userPrompt = buildPrompt(individualData, tarotData, normalizedLang);

    // 调用 AI
    const insight = await callAI(systemPrompt, userPrompt, process.env);

    // 移除零散 Markdown 残留
    let cleanInsight = insight
      .replace(/^[\#\*\_\`\~]+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 收割暗桩（根据来源动态植入）
    const crossLink = referrer === 'compatibility'
      ? '<p>💡 你的财富运势和感情能量场是联动的——当感情状态稳定时，吸金能力自然提升。如果你有伴侣，建议对比你们的合盘，看看TA的八字是否正在帮你补财星缺口。<a href="/">→ 回合婚报告</a></p>'
      : '';

    const finalOutput = cleanInsight + crossLink;

    return res.status(200).json({
      success: true,
      birthDate,
      lang: normalizedLang,
      data: {
        bazi: individualData.bazi,
        zodiac: individualData.zodiac,
        iching: individualData.iching,
        tarot: tarotData,
      },
      insight: finalOutput,
      referrer,
    });

  } catch (error) {
    console.error('Wealth Oracle Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
