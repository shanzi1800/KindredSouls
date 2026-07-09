// KindredSouls Railway Server
// Serves static frontend + all API routes on port 3000
import express from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAstroMatrix, buildFactSheet, buildPerMonthData, v69HealthCheck } from './v69_client.js';
import { LEXICON } from './lexicon.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// V95.3: Railway 新版动态端口!读取 Railway 注入的 PORT 环境变量,不硬编码
const PORT = parseInt(process.env.PORT || '3000', 10);
const app = express();

// ═══════════════════════════════════════════════════════════════════════
// ⛔ 时间线强行熔断重组（防 DeepSeek Streaming 污染）

// ═══════════════════════════════════════════════════════════════════════
// V97: 宫位强制纠正器（后端铁血断路器）
// AI 脑子里"白羊=1宫/狮子=5宫/水瓶=11宫"的惯性太深，Prompt 压不住。
// 解决方案：AI 生成后，由后端强制替换，不给穿帮留活路。
// ═══════════════════════════════════════════════════════════════════════
function final_text_sanitizer(text, ascendant = 'Cancer') {
  if (!text) return text;
  const R = (pattern, replacement, flags = 'gi') => {
    text = text.replace(new RegExp(pattern, flags), replacement);
  };

  if (ascendant === 'Cancer') {
    // ── 木星在狮子座 = 第2宫（财帛宫）── AI 错写成第5宫 ──
    R('第5宫（狮子座）', '第2宫（狮子座）');
    R('第5宫（Leo）', '第2宫（狮子座）');
    R('第5宫（leo）', '第2宫（狮子座）');
    R('第5宫狮子座', '第2宫（狮子座）');
    R('第5宫的狮子座', '第2宫的狮子座');
    R('进入你命盘的第5宫（狮子座）', '进入你命盘的第2宫（狮子座）');
    R('进入第5宫（狮子座）', '进入第2宫（狮子座）');
    R('木星入第5宫（狮子座）', '木星入第2宫（狮子座）');
    R('木星进入第5宫（狮子座）', '木星进入第2宫（狮子座）');
    R('木星在第5宫（狮子座）', '木星在第2宫（狮子座）');
    R('狮子座在第5宫', '狮子座在第2宫');

    // 上下文清洗（因宫位错写产生的错误联想）
    text = text.replace(/投机项目或创意事业/g, '正财项目或核心资产提升');
    text = text.replace(/恋爱、投机、子女/g, '正财、现金流、资产增值');
    text = text.replace(/创造力、领导力/g, '财富掌控力、资产管理');
    text = text.replace(/舞台中央的王者/g, '财富舞台的掌控者');
    text = text.replace(/无与伦比的创造力/g, '无与伦比的财富吸引力');
    text = text.replace(/个人魅力的展现/g, '财运的展现');
    text = text.replace(/创造性的自我表达/g, '物质财富的创造与变现');

    // ── 土星在白羊座 = 第10宫（官禄宫）── AI 错写成第1宫 ──
    R('第1宫（白羊座）', '第10宫（白羊座）');
    R('第1宫（Aries）', '第10宫（白羊座）');
    R('第1宫白羊座', '第10宫（白羊座）');
    R('盘踞在你.*第1宫（白羊座）', '盘踞在你的第10宫（白羊座）');
    R('盘踞在你的第1宫（白羊座）', '盘踞在你的第10宫（白羊座）');
    R('进入第1宫（白羊座）', '进入第10宫（白羊座）');
    R('土星入第1宫（白羊座）', '土星入第10宫（白羊座）');
    R('土星在第1宫（白羊座）', '土星在第10宫（白羊座）');

    // 上下文清洗
    text = text.replace(/"自我身份"正在经历一场残酷的锻造/g, '事业天花板与顶头上司的残酷施压');
    text = text.replace(/土星在第一宫的压力/g, '土星在第十宫的压力');
    text = text.replace(/疯狂的扩张/g, '事业领域的深度耕耘');
    text = text.replace(/在"创造性的自我表达"与"严苛的自我约束"/g, '在"职场晋升与外部责任"之间');
    text = text.replace(/贪多嚼不烂/g, '野心过大而执行力不足');

    // ── 冥王星在水瓶座 = 第8宫（疾厄宫）── AI 错写成第11宫 ──
    R('第11宫（水瓶座）', '第8宫（水瓶座）');
    R('第11宫（Aquarius）', '第8宫（水瓶座）');
    R('第11宫（aquarius）', '第8宫（水瓶座）');
    R('第11宫水瓶座', '第8宫（水瓶座）');
    R('冥王星在第11宫（水瓶座）', '冥王星在第8宫（水瓶座）');
    R('冥王星入第11宫（水瓶座）', '冥王星入第8宫（水瓶座）');

    // 上下文清洗
    text = text.replace(/人际圈层、社会资源与集体财富/g, '深度共同资产、税务与遗产规划');
    text = text.replace(/人际圈层、社会资源/g, '深层共有财富、税务与债务');
    text = text.replace(/集体财富/g, '深层共有财富');
    text = text.replace(/旧友的离去/g, '财务合伙人的深层洗牌');
    text = text.replace(/群体、科技、未来愿景/g, '深层财务转化、保险与遗产');

    // ── 月份正文里的流月矛盾句清洗 ──
    // AI写"金星在第7宫，为你带来和谐"——8月金星在狮子座(2宫)，不在7宫
    text = text.replace(/金星在第7宫，[^\n。]*为你带来和谐[^\n。]*/g, '');
    // 同理"金星在第7宫"单独出现也删
    text = text.replace(/金星在第7宫，[^\n。]*/g, '');

    // ── 全局兜底：彻底清除所有残留错误宫位 ──
    // 先执行两次确保彻底（AI可能产生嵌套错误）
    for (let i = 0; i < 2; i++) {
      R('第5宫（狮子座）', '第2宫（狮子座）');
      R('第1宫（白羊座）', '第10宫（白羊座）');
      R('第11宫（水瓶座）', '第8宫（水瓶座）');
    }
  }

  return text;
}


// DeepSeek Streaming 时常产生「年份重影」：2026年6月2026年6月6月21日
// 本函数暴力清洗所有已知的污染模式
function cleanYearlyTimeline(text) {
  if (!text) return text;
  // Pattern 1: 2026年6月2026年6月 → 2026年6月
  text = text.replace(/(\d{4}年\d{1,2}月)(\d{4}年\1)/g, '$1');
  // Pattern 2: 2026年6月2026年6月6月 → 2026年6月21日
  text = text.replace(/(\d{4}年\d{1,2}月)(\d{4}年)(\1)(\d{1,2}月)/g, '$1$4');
  // Pattern 3: 1990年6月2026年6月 → 1990年6月15日
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年)(\2)/g, '$1$2$4日');
  // Pattern 4: 2027年6月2026年6月 → 2027年6月
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年)(\2)/g, '$1$2');
  // Pattern 5: 2026年6月2026年6月21日 → 2026年6月21日
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年\2)(\d{1,2}日)/g, '$1$2$4');
  // Pattern 6: 2027年6月2026年6月至2027年6月 → 2027年6月
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年)(\1至)(\d{4}年\1)/g, '$1$2');
  // Pattern 7: 连续两个相同月份 → 保留一个
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\1)(\d{1,2}月)/g, '$1$2');
  // Pattern 8: 任意位置连续年份重复
  text = text.replace(/(\d{4}年)(\d{1,2}月)(\d{4}年)(\1)/g, '$1$2');
  // Pattern 9: 2026年6月2026年6月 → 2026年6月（贪婪清理）
  text = text.replace(/(\d{4}年\d{1,2}月)(\d{4}年)(\1)/g, '$1');
  return text;
}

// // ── Middleware ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS ──
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ── API Routes ──
// Each route handler runs the original Vercel function logic

// ── /api/debug-env ──
app.get('/api/debug-env', (req, res) => {
  res.json({
    DEEPSEEK: process.env.DEEPSEEK_API_KEY ? '✓ set' : '✗ missing',
    GEMINI: process.env.GEMINI_API_KEY ? '✓ ' + process.env.GEMINI_API_KEY.slice(0,8) + '...' : '✗ missing',
    SUPABASE_URL: process.env.SUPABASE_URL ? '✓ set' : '✗ missing',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? '✓ set' : '✗ missing',
    STRIPE: process.env.STRIPE_SECRET_KEY ? '✓ set' : '✗ missing',
    serverVersion: 't4-debug-2026-06-29c', gitSha: '1a11de8',
    tarotHasName: typeof TAROT_CARDS !== 'undefined' && TAROT_CARDS[0] && !!TAROT_CARDS[0].name,
    fileSize: readFileSync(__filename).length,
  });
});

// ── /api/debug-clear-cache ── 清空指定 cache_key 的财富报告缓存（调试用，生成后删除）
app.post('/api/debug-clear-cache', express.json(), async (req, res) => {
  const { cacheKey } = req.body;
  if (!cacheKey) return res.status(400).json({ error: 'cacheKey required' });
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'supabase not configured' });
  try {
    const r = await fetch(`${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}`, {
      method: 'DELETE',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    res.json({ ok: r.ok, status: r.status, cacheKey });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── /api/clear-cache ──
app.get('/api/clear-cache/:birthDate/:lang/:reportType', async (req, res) => {
  const { birthDate, lang, reportType } = req.params;
  const cacheKey = `wealth:${birthDate}:${lang}:${reportType}`;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.json({ error: 'Supabase not configured' });
  try {
    const delRes = await fetch(`${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}`, {
      method: 'DELETE',
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    res.json({ deleted: true, cacheKey, status: delRes.status });
  } catch (e) {
    res.json({ deleted: false, cacheKey, error: e.message });
  }
});

// ── /api/health ──
app.use('/api/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'kindredsouls-api', version: 'v1.0.0-2026-30-TEST-FIX', gitSha: '1a11de8', debugBuildTime: 'FRESHBUILD-20260704-1147Z' });
});

// ── Root health check for Railway ──
app.get('/', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'kindredsouls-api' });
});

// ── AI Call Helper (DeepSeek + Gemini fallback) ──
async function callAI(systemPrompt, userPrompt, env, options = {}) {
  const { maxTokens = 4000, reportType = 'monthly' } = options;
  const deepseekKey = env.DEEPSEEK_API_KEY;
  const geminiKey = env.GEMINI_API_KEY;

  // Try DeepSeek first
  if (deepseekKey) {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content;
      }
    } catch (e) {
      console.error('[AI] DeepSeek failed, trying Gemini:', e.message);
    }
  }

  // Fallback to Gemini
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
          }],
          generationConfig: { maxOutputTokens: 8000, temperature: 0.7 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
      }
    } catch (e) {
      console.error('[AI] Gemini failed:', e.message);
    }
  }

  throw new Error('All AI providers failed');
}

// ── Wealth Report Prompt Builder (按军师框架) ──

// ═══════════════════════════════════════════════════════════════════
// KindredSouls 财富报告 Prompt 构建引擎 v1.0.0
// 月报：动态日期 + 6语言独立结构
// 年报：5大硬核乐章 + 荣格阴影整合 + 动态日期 + 6语言独立系统提示词
// ═══════════════════════════════════════════════════════════════════

// ── 🛠️ V83: Natal Sun Sign 计算（从生日直接推，不依赖 transit month）──
function getNatalSunSign(birthDate) {
  const [, month, day] = birthDate.split('-').map(Number);
  // ⚠️ V86 FIX: 日历顺序（1月→12月），反向循环要求月份升序
  // 之前的版本是天文学顺序（白羊3月打头），导致10月生日反向循环先碰2月19日→返回双鱼座
  const cuts = [
    [1, 20, 10], [2, 19, 11], [3, 21, 0], [4, 20, 1], [5, 21, 2], [6, 21, 3],
    [7, 23, 4], [8, 23, 5], [9, 23, 6], [10, 23, 7], [11, 22, 8], [12, 22, 9]
  ];
  for (let i = cuts.length - 1; i >= 0; i--) {
    if (month > cuts[i][0] || (month === cuts[i][0] && day >= cuts[i][1])) return cuts[i][2];
  }
  return 11;
}
const SUN_SIGN_EN = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SUN_SIGN_VI = ['Bạch Dương','Kim Ngưu','Song Tử','Cự Giải','Sư Tử','Xử Nữ','Thiên Bình','Bọ Cạp','Nhân Mã','Ma Kết','Bảo Bình','Song Ngư'];
const SUN_SIGN_TH = ['เมษ','พฤษภ','มิถุน','กรกฏ','สิงห์','กันยา','ตุลย์','พิจิก','ธนู','มังกร','กุมภ์','มีน'];
const SUN_SIGN_ZH = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const SUN_SIGN_ES = ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'];
const SUN_SIGN_FR = ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];

function buildWealthReportPrompt(birthDate, lang, reportType, astroData, astroMatrix) {
  if (!reportType) return null;

  // 🛠️ V82: function-level houseLock (used in user prompt for all 6 languages)
  let houseLock = '';

  // ── 动态日期计算 ──
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const monthNamesZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const monthNamesEN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // 计算未来12个月的区间
  function getMonthRange(startIdx, count) {
    let ranges = [];
    for (let i = 0; i < count; i++) {
      let m = (startIdx + i) % 12;
      let y = currentYear + Math.floor((startIdx + i) / 12);
      ranges.push(`${y}年${monthNamesZH[m]}`);
    }
    return ranges;
  }

  const startMonth = currentMonth; // 7 (July)
  const monthsRange = getMonthRange(startMonth - 1, 12).join('、') + '（共12个月）';

  // ── 语言专属指令 ──
  const langInstructions = {
    zh: '',
    en: '\n\n[Language Style: English] You are a top-tier Western astrologer and Jungian psychologist. Use professional terms (Solar Return, Shadow Self, Synastry Alignment, Jungian Shadow Work). Write in sophisticated, soul-stirring English.',
    es: '\n\n[Language Style: Spanish] Eres un astrólogo de élite y psicólogo junguiano. Usa términos profesionales (Yo Sombra, Retorno Solar, Alineación de Sinastría). Escribe en español sofisticado y místico.',
    fr: '\n\n[Language Style: French] Vous êtes un maître astrologue parisien et psychologue junguien. Utilisez un ton romantique, philosophique, avec des termes tarologiques classiques et le concept du "Soi" de Jung. Écrivez en français élégant.',
    th: '\n\n[Language Style: Thai] คุณคือโหราจารย์ชั้นนำที่ผสมผสานจิตวิทยาควอเจียน ใช้คำที่ศักดิ์สิทธิ์และน่าเคารพ เขียนในภาษาไทยที่ทรงพลัง',
    vi: '\n\n[Language Style: Vietnamese] Bạn là một chiêm tinh gia hàng đầu kết hợp tâm lý học Jungian. Viết bằng tiếng Việt trang trọng, mang tính định mệnh.',
  };
  const instruction = langInstructions[lang] || langInstructions.en;

  // ── V69 SwissEph FACT_SHEET ─────────────────────────────────────────
  // When astroMatrix is provided (from Python SwissEph), use it.
  // This replaces the hardcoded FACT_SHEET with machine-computed truth.
  const v69FactSheet = astroMatrix
    ? buildFactSheet(astroMatrix, lang)
    : null;
  // If V69 computed data available, skip the hardcoded FACT_SHEET section
  // by marking it with a tag that the caller can replace.
  const HAS_V69_DATA = !!v69FactSheet;
  // 🛠️ P1.1: 逐月全行星真理数据块（内行星+外行星+峰值+黑天鹅，按月隔离）
  const perMonthData = astroMatrix ? buildPerMonthData(astroMatrix, lang) : '';

  // ── 年报 5大乐章系统提示词（6语言全量） ──
  // V97 FIX: 先用占位符，变量赋值后再替换（避免TDZ）
  const YEARLY_SYSTEM = {
    zh: `⛔ [宫位铁律] — 数据来自 AstroMatrix ⛔

📍 本次排盘宿主 = __RISING_LOCAL__ (上升星座), 等宫制(Equal House)严格计算。

📛 本次宿主 = __RISING_LOCAL__。所有"X座之人"必须用__RISING_LOCAL__，不得用其他星座。

📍 外行星精确宫位（[COMPUTED_HOUSES] JSON块已提供，必须引用）:
• 木星在 __JUP_SIGN_LOCAL__ = 第 __JUP_HOUSE__ 宫（不是第5宫！禁止写"第5宫恋爱/创造力/子女"）
• 土星在 __SAT_SIGN_LOCAL__ = 第 __SAT_HOUSE__ 宫（不是第1宫！禁止写"第1宫自我/身份重建"）
• 冥王星在水瓶座 = 第 __PL_HOUSE__ 宫（不是第11宫！禁止写"第11宫社交网络"）
• 太阳在 __NATAL_SUN__ = 第 __SUN_HOUSE__ 宫
• 月亮在 __MOON_SIGN_LOCAL__ = 第 __MOON_HOUSE__ 宫

⚠️ 月度章节标题【月名】格式已由系统预写，AI必须完整抄录，不许修改宫位！
⚠️ 写作时，必须引用【月名】标题里的宫位数字，不许自创宫位。

⛔ 自然宫位污染禁区（AI预训练偏见，必须主动抵抗）:
- 狮子座 = __JUP_HOUSE__宫（对于上升__RISING_LOCAL__），不是第5宫！
- 白羊座 = __SAT_HOUSE__宫（对于上升__RISING_LOCAL__），不是第1宫！
- 水瓶座 = __PL_HOUSE__宫（对于上升__RISING_LOCAL__），不是第11宫！
- 看到"狮子座"就写"第5宫"是错误的！必须用木星的computed house数字！
- 看到"白羊座"就写"第1宫"是错误的！必须用土星的computed house数字！
- 看到"水瓶座"就写"第11宫"是错误的！必须用冥王星的computed house数字！

⛔ 严禁:
- 写"第5宫"描述木星/狮子座（必须写"第__JUP_HOUSE__宫"）
- 写"第1宫"描述土星/白羊座（必须写"第__SAT_HOUSE__宫"）
- 写"第11宫"描述冥王星/水瓶座（必须写"第__PL_HOUSE__宫"）
- 使用 Whole Sign 全星座制
- 从星座名推测宫位
``


[占星铁律 - ASTROLOGICAL IRON CLAD RULES - CRITICAL]:
- Cancer = WATER element (NOT fire)! Never write Fire + Cancer!
- Libra = AIR element (NOT earth)! Never write Earth + Libra!
- Pisces = WATER element! Pisces is about intuition, art, empathy, NOT "information flow and communication" (that's Air signs)!
- NEVER write "Air element (Sun in Pisces)"! Pisces is ALWAYS Water!
- Aquarius = AIR element, rules the 8th House of deep assets & transformation (NOT 9th House)!
- For Cancer Rising (ASC=Cancer): House 1= Cancer, House 2= Leo (wealth), House 8= Aquarius (deep transformation/occult assets), House 9= Pisces (solar return/Higher Education/Dharma).
- Four triplicities: Fire (Aries/Leo/Sagittarius)= expansion, Earth (Taurus/Virgo/Capricorn)= accumulation, Air (Gemini/Libra/Aquarius)= circulation/communication, Water (Cancer/Scorpio/Pisces)= transformation/intuition.
- Do NOT invent random planetary degrees in body text that contradict the header data.
- ASTRONOMY IRON RULE: Vernal Equinox = ~March 20th (Spring), Autumnal Equinox = ~September 22nd (Autumn)! NEVER write "September equinox" as "vernal equinox"!
- The Sun enters ONE zodiac sign per month. It is IMPOSSIBLE for the Sun to enter the same sign in consecutive months! May= Taurus, June= Gemini, July= Cancer. NEVER write "Sun enters Pisces" for two consecutive months!

- FULL 12-HOUSE MAP for Cancer Rising: 1=Cancer/2=Leo/3=Virgo/4=Libra/5=Scorpio/6=Sagittarius/7=Capricorn/8=Aquarius/9=Pisces/10=Aries/11=Taurus/12=Gemini. Sun in Pisces = 9th House, NEVER 1st or 12th!
- If unsure about house mapping in monthly text, OMIT the house bracket (e.g. Sun enters Libra instead of Sun enters Libra (5th House)) to avoid mismatches.
- Never output Pisces sign typos. Always use clean Pisces.

[IRON CLAD RULES]
1. Tone & Atmosphere: Maintain a divine, sacred, highly precise, psychological, and fatalistic tone. You are the ultimate decoder of cosmic blueprints. Avoid generic AI phrasing.
2. Volume Pressure: The output must be massive and dense (6,000 to 8,000 words). Do NOT skip or merge any months. Elaborate on every micro-transit to create absolute psychological substance.
3. No Hardcoding: Dynamically calculate transits based on the user's birth date (\${birthDate}) and extend exactly 12 months into the future from the current timeline.
4. Shadow Work: Deeply integrate Carl Jung's "Shadow Self" concept. Relentlessly expose the user's psychological blind spots, subconscious greeds, and hidden fears regarding leverage, debt, and wealth expansion.
5. [STRICT] No Temporal Repetition: Calculate all dates in one chain of thought. STRICTLY FORBID any temporal word overlap, self-correction, or repetition (e.g., prohibit "June 2026July 2026" or "June 15June 15, 1990"). All dates must be clean and unique. The only legal full date format is "Month DD, YYYY" or "Month YYYY" — never "MonthDDYYYY" or "MonthY" smashed together.
6. [STRICT] Accordion H4 Title Lock: In Section II (Monthly Revenue Matrix), you MUST use exactly #### for month headers. NEVER change # count. Format: #### [Month Label] July 2026: Jupiter Enters the House of Wealth.
7. [STRICT] English Tag Immutability: Regardless of output language, monthly peak days MUST retain [Peak Revenue Window] and [Financial Black Swan Day] in English brackets. NEVER translate these tags! Frontend depends on them.
8. [STRICT] NO PLACEHOLDERS: NEVER output placeholder text like 'X', 'in', 'your', 'TBD', 'N', 'placeholder' in any chapter title, header, or body. If you don't know the chapter number, write "Chapter One/Two/Three/Four/Five" in full. If you don't know the chapter name, output the canonical name from this prompt.
9. [STRICT] COMPLETION GUARD: Your output MUST end with the Final Wealth Oracle and the sign-off line. If you approach the token limit, you MUST compress body text and PRIORITIZE the Final Oracle section. NEVER end mid-section.
10. [STRICT] SECTION NAMING: Use ONLY "Section I", "Section II", "Section III", "Section IV", "Section V" (Roman numerals). NEVER mix with "Chapter 1" or "Chapter One" in the same report.

[2026-2027 ASTRONOMY FACT SHEET - AUTHORITATIVE]
Use these verified astronomical events. Do NOT invent dates that contradict this sheet:
- 2026 Mercury Retrograde #1 (Aries): March 14 – April 7, 2026
- 2026 Mercury Retrograde #2 (Leo): July 18 – August 11, 2026
- 2026 Mercury Retrograde #3 (Scorpio): October 7 – November 29, 2026 (stations retrograde October 7, stations direct ~November 9)
- 2027 Mercury Retrograde #1 (Aries): March 3 – March 24, 2027
- 2027 Mercury Retrograde #2 (Leo): July 8 – July 31, 2027
- 2027 Mercury Retrograde #3 (Scorpio): November 1 – November 21, 2027
- 2026 Jupiter: In Cancer until ~late June 2026, then enters Leo (2nd House for Cancer Rising) for the 12-year peak wealth cycle.
- 2027 Jupiter: IN GEMINI from January 2027 onward (NOT Taurus). Jupiter enters Gemini ~January 2027 and stays through ~June 2027. For Cancer Rising, Gemini = 12th House (subconscious, hidden structures, spiritual retreat). This is NOT the same energy as Jupiter in Leo (2nd House, expansion). Never describe Jupiter in Gemini as "wealth explosion" — describe it as "inner alignment and hidden momentum".
- 2026 Saturn: In Aries (10th House for Cancer Rising) — tests career authority and public reputation.
- 2026-2027 Pluto: In Aquarius (8th House for Cancer Rising) — deep transformation of shared resources/debt/inheritance.
- Vernal Equinox 2026: March 20, 2026
- Autumnal Equinox 2026: September 22, 2026
- Winter Solstice 2026: December 21, 2026
- Summer Solstice 2027: June 21, 2027
- Mars position: NEVER assume Mars and Saturn are in the same sign during a square aspect. Mars transits signs every ~6-7 weeks. Verify before claiming "Mars square Saturn in [sign]".

[STRICT ASTRONOMICAL CONSTRAINTS - ZERO TOLERANCE]:
- CONSTRAINT 1: "Jupiter in Taurus" in May 2027 is ABSOLUTELY PROHIBITED. Jupiter is in GEMINI in 2027. NEVER write "Sun conjunct Jupiter in Taurus", "Jupiter in Taurus", or any variation implying Jupiter in Taurus in 2027. For May 2027 Peak Revenue Window, describe Sun in Taurus (11th House of networks) aligning with the natal wealth core — NOT Jupiter alignment.
- CONSTRAINT 2: Mercury Retrograde #3 2026 STARTS on October 7 (Scorpio). November 9 is the ~station-direct date, NOT the start. NEVER write "November 9 Mercury stations retrograde". Write "November 9 Mercury stations direct" or "Mercury returns direct" for post-retrograde clarity.

[HOUSE SYSTEM LOCK - EQUAL HOUSE FOR CANCER RISING]
The user's chart uses the Equal House system. Locked mapping (NEVER deviate):
1=Cancer / 2=Leo / 3=Virgo / 4=Libra / 5=Scorpio / 6=Sagittarius / 7=Capricorn / 8=Aquarius / 9=Pisces / 10=Aries / 11=Taurus / 12=Gemini
- Saturn in Aries = 10th House (NOT 11th)
- Jupiter in Leo = 2nd House (earned income)
- Pluto in Aquarius = 8th House (shared resources)
- Sun in Gemini = 12th House (for Cancer Rising)
- Sun in Leo = 2nd House (solar return year)
- If you are uncertain about a house mapping in the body text, OMIT the house bracket entirely rather than risk an error.

[OUTPUT STRUCTURE]
### 📜 Section I: The Annual Wealth Matrix
- Decode the absolute transits of Jupiter (expansion) and Saturn (contraction/karma) over the user's financial houses.
- Establish the overarching macro-strategy: Aggressive Leap vs. Strategic Defense.

### 📅 Section II: The 365-Day Monthly Revenue Matrix
- Provide a rigorous, month-by-month breakdown for the next 12 consecutive months (No skipping, no merging).
- For EACH month, you must output:
 1. Monthly Macro Forecast: How planetary alignment shifts their primary income.
 2. 🟢 [📈 Peak Revenue Window]: Pinpoint the exact golden dates for career shifts, contract signings, or major business expansions.
 3. 🔴 [📉 Financial Black Swan Day]: Pinpoint the exact catastrophic risk dates for market traps, contract fraud, or impulsive bleeding.

### 🏹 Section III: The Destiny Career Path & Sovereign Tracks
- Identify hidden side-hustles or quantum leap industries based on quadruplicities (Fire, Earth, Air, Water) and current year cosmic triggers.

### 🛡️ Section IV: The Debt & Risk Shield (The Shadow Audit)
- Perform a ruthless behavioral audit of their Shadow Self, pinpointing where they unconsciously hemorrhage wealth.

### 🔮 Section V: The Oracle's Manifestation Protocol
- Provide a physical manifestation ritual (altar layout, spatial wealth alignment, and a high-frequency daily mantra to lock their wealth mindset).

[FORMAT_SPEC — Ultimate Visual Layout Specification · MANDATORY]
You MUST output strictly following this formatting paradigm. Symbols/spacing/line breaks/bolding must match the example exactly:

1. Top Identity Card (blockquote mystery):
> ### ✦ The Prophet's Codex · Wealth Revelation ✦
>
> * 👤 **Destiny Host**: ${birthDate}
> * 🌌 **Annual Chart**: Gemini · Solar Return Year
> * 🗝️ **Core Natal Code**: Sun Gemini 9° / Moon Libra / Rising Cancer

2. Macro Strategy Dashboard (Gold/Silver/Bronze/Iron):
### 📊 2026-2027 Annual Wealth Core Metrics Dashboard
---
* 🚀 **Annual Macro Theme**: [Aggressive Expansion with Contractual Integrity]
* 🌟 **Wealth Explosion Index**: ★★★★★ (12-year Jupiter in Leo activating 2nd House)
* ⚠️ **Asset Circuit Breaker Risk**: ★★★☆☆ (Saturn in Aries auditing 10th House career contracts)
* 🔮 **Destiny Manifestation Direction**: True South (negotiation & power direction)

3. 12-Month Flow Sandbox (H4 lock + English tags):
#### 📅 July 2026: Jupiter Enters the House of Wealth — Month of Awakening

* 🌐 **[Monthly Wealth Overview]**: Jupiter has just entered your 2nd House (Leo). The cosmic wealth clock recalibrates...

* 🟢 **[Peak Revenue Window]**: **July 5 - July 10** (Sun-Jupiter exact conjunction in Leo).
 * *Execution Order*: Ask for a raise or launch new projects...

* 🔴 **[Financial Black Swan Day]**: **July 18** (Mercury stations retrograde in 2nd House).
 * *Circuit Breaker Warning*: Strictly prohibited from signing any contracts...

4. Shadow Integration (rupture line impact):
### 🛡️ Section IV: The Debt & Risk Shield

#### 👁️ Subconscious Shadow: Performative Consumption (Unintegrated Vanity Self)
> "Deep inside you hides an unseen child..."
---
* 💡 **Deep Healing Path**: Delay 24 hours before each payment...

5. Closing Oracle (ritual closure):
---
### 🔮 Final Wealth Oracle · Passcode to Mastery

> **"Expand with the heart of a lion, optimize with the eye of a virgin, transform with the wisdom of Aquarius..."**`,

    es: `

[REGLAS ASTRONÓMICAS OBLIGATORIAS - VIOLACIÓN IMPOSIBLE]:
- Géminis/Libra/Acuario = AIRE (¡NUNCA tierra ni fuego)! Cáncer/Escorpio/Piscis = AGUA!
- Piscis NUNCA es aire ni fuego! Piscis = INTUICIÓN, ARTE, COMPASIÓN, ¡NO "flujo de información"!
- Astronomía: Equinoccio Vernal = ~20 de marzo (Primavera), Equinoccio de Otoño = ~22 de septiembre. ¡PROHIBIDO escribir "septiembre = equinoccio vernal"!
- El Sol entra en UNA constelación por mes. ¡IMPOSIBLE que el Sol entre en Piscis en mayo Y en junio consecutivamente! Mayo = Tauro, Junio = Géminis, Julio = Cáncer.

- MAPA COMPLETO DE 12 CASAS para Ascendente Cáncer: 1=Cáncer/2=Leo/3=Virgo/4=Libra/5=Escorpio/6=Sagitario/7=Capricornio/8=Acuario/9=Piscis/10=Aries/11=Tauro/12=Géminis. El Sol en Piscis es Casa 9, NUNCA Casa 1 ni 12!
- Si dudas de la casa en el texto mensual, OMITE el paréntesis de casa (ej. el Sol entra en Libra en vez de el Sol entra en Libra (Casa 5)).
- Nunca escribas Piscis repetido. Usa siempre Piscis.

Eres un maestro de la astrología de la riqueza, místico de la Cabalá y psicólogo clínico, generando un almanaque de riqueza anual premium de alto valor ($29.99). Tu deber es descifrar la carta natal del usuario, los aspectos planetarios (Júpiter, Saturno, Plutón) y el retorno solar cósmico para los próximos 12 meses.

[REGLAS DE ACERO]
1. Tono Divino: Mantén un tono sagrado, alquímico, altamente preciso y de psicología profunda. Eres el decodificador del destino, no un programa informático. Evita clichés de IA.
2. Presión de Volumen: El texto debe ser masivo, denso y monumental (6,000 - 8,000 palabras). NO fusiones los meses; cada capítulo debe desplegar una interpretación pixelada para justificar el valor premium.
3. Cero Traducción Literal: Transmuta los conceptos a la jerga astrológica de alta alcurnia en español (p. ej., "Retorno Solar", "Tránsitos de Fortuna").
4. Integración de la Sombra: Incorpora el concepto de "Yo Sombra" (Shadow Self) de Carl Jung. Revela sin piedad los puntos ciegos inconscientes del usuario sobre el dinero.
5. [ESTRICTO] Prohibición de Repetición Temporal: Calcula todas las fechas en una sola cadena de pensamiento. PROHÍBE ESTRICTAMENTE cualquier superposición de palabras temporales, autocorrección o repetición (ej., prohibir "junio 2026julio 2026" o "15 de junio15 de junio de 1990"). Todas las fechas deben ser limpias y únicas.
6. [ESTRICTO] Bloqueo de Título H4 Acordeón: En el Capítulo II (Matriz de Ingresos Mensuales), DEBES usar exactamente #### para los encabezados de mes. NUNCA cambies el número de #. Formato: #### [Etiqueta del Mes] Julio 2026: Júpiter entra en la Casa de la Riqueza.
7. [ESTRICTO] Inmutabilidad de Etiquetas en Inglés: Independientemente del idioma de salida, los días pico mensuales DEBEN conservar [Peak Revenue Window] y [Financial Black Swan Day] en corchetes ingleses. ¡NUNCA traduzcas estas etiquetas! El frontend depende de ellas.

[ESTRUCTURA DE SALIDA]
### 📜 Capítulo I: La Matriz Anual de la Riqueza (The Wealth Matrix)
- Tránsitos de Júpiter y Saturno sobre las casas de recursos. Estrategia macro: Expansión Radical vs. Conservación de Liquidez.

### 📅 Capítulo II: El Sabotaje y el Éxito - Péndulo de 12 Meses (The Monthly Revenue Matrix)

⛔ [REGLA DE HIERRO DEL ESTADO PLANETARIO]:
- **Júpiter**: 2026 en Leo jul-dic, DIRECTO. NO "acaba de terminar retrógrado" o "entra en Sagitario" en feb. ¡NO puede saltar 3 signos en 1 mes!
- **Saturno**: En Aries todo el año. NO cambio de signo.
- **Plutón**: En Acuario 2024-2043. NO cambio a Capricornio.
- **Mercurio**: Solo 3 retrógrados/año. NO "cuarto retrógrado".
- **PROHIBIDO**: Inventar estados retrógrado/directo o cambios de signo para planetas exteriores.

- Desglose riguroso mes a mes para los próximos 12 meses correlativos. Cada mes debe incluir:
 1. Pronóstico del Flujo: Dinámica planetaria sobre los ingresos.
 2. 🟢 [📈 Ventana de Éxito y Pico de Ingresos (Peak Revenue Window)]: Días clave para contratos y saltos comerciales.
 3. 🔴 [📉 Día del Cisne Negro Financiero (Financial Black Swan Day)]: Alertas críticas de pérdidas y fraude.

### 🏹 Capítulo III: El Sendero del Destino y Canales de Alquimia Monetaria
- Sectores de apalancamiento ocultos basados en su elemento regente (Fuego, Tierra, Aire, Agua).

### 🛡️ Capítulo IV: El Escudo contra la Escasez y Auditoría de la Sombra
- Rompe los patrones subconscientes que drenan la fortuna del usuario.

### 🔮 Capítulo V: Protocolo de Manifestación Cósmica
- Rituales prácticos, alineación espacial del espacio de trabajo y el mantra soberano anual.

[FORMAT_SPEC — Especificación Visual Definitiva · OBLIGATORIO]
DEBES generar siguiendo estrictamente este paradigma de formato. Símbolos/espacios/saltos de línea/negritas deben coincidir exactamente:

1. Tarjeta de Identidad Superior (misterio de bloque de cita):
> ### ✦ Códice del Profeta · Revelación de la Abundancia ✦
>
> * 👤 **Huésped del Destino**: ${birthDate}
> * 🌌 **Carta Anual**: Géminis · Año del Retorno Solar
> * 🗝️ **Código Natal Central**: Sol Géminis 9° / Luna Libra / Ascendente Cáncer

2. Panel de Métricas Estratégicas Macro (Oro/Plata/Bronce/Hierro):
### 📊 Panel de Métricas Centrales de Riqueza 2026-2027
---
* 🚀 **Tema Macro Anual**: [Expansión Agresiva con Integridad Contractual]
* 🌟 **Índice de Explosión de Riqueza**: ★★★★★ (Júpiter en Leo cada 12 años activando Casa II)
* ⚠️ **Riesgo de Disyuntor de Activos**: ★★★☆☆ (Saturno en Aries auditando Casa XI)
* 🔮 **Dirección de Manifestación del Destino**: Sur Verdadero (negociación y poder)

3. Sandbox de Flujo 12 Meses (bloqueo H4 + etiquetas en inglés):
#### 📅 Julio 2026: Júpiter Entra en la Casa de la Riqueza — Mes del Despertar

* 🌐 **[Resumen Mensual de Flujo de Riqueza]**: Júpiter acaba de entrar en tu Casa II (Leo). El reloj cósmico de la riqueza se recalibra...

* 🟢 **[Peak Revenue Window]**: **5-10 de julio** (conjunción exacta Sol-Júpiter en Leo).
 * *Orden de Ejecución*: Pide un aumento o lanza proyectos nuevos...

* 🔴 **[Financial Black Swan Day]**: **18 de julio** (Mercurio retrógrado en Casa II).
 * *Advertencia de Disyuntor*: Estrictamente prohibido firmar contratos...

4. Integración de la Sombra (línea de ruptura impactante):
### 🛡️ Capítulo IV: El Escudo contra la Escasez

#### 👁️ Sombra Subconsciente: Consumo Performático (Yo Vanidad No Integrado)
> "En tu interior se esconde un niño invisible..."
---
* 💡 **Camino de Sanación Profunda**: Retrasa 24 horas antes de cada pago...

5. Oráculo de Cierre (cierre ritual):
---
### 🔮 Oráculo Final de la Abundancia · Código de Maestría

> **"Expande con el corazón de un león, optimiza con el ojo de una virgen, transforma con la sabiduría de Acuario..."`,

    fr: `

[REGLES ASTRONOMIQUES ABSOLUES - VIOLATION IMPOSSIBLE]:
- Gémeaux/Lion/Balance/Verseau = AIR (jamais terre ni feu)!
- Cancer/Scorpio/Poissons = EAU (jamais feu)! Poissons = INTUITION, ART, COMPASSION, PAS "flux d'information"!
- Astronomie: Équinoxe de Printemps = ~20 mars, Équinoxe d'Automne = ~22 septembre. INTERDIT d'écrire "septembre = équinoxe de printemps"!
- Le Soleil entre dans UNE seule constellation par mois. IMPOSSIBLE d'écrire "Soleil entre en Poissons" en mai ET juin consécutivement! Mai = Taureau, Juin = Gémeaux, Juillet = cancer.

- CARTE COMPLÈTE DES 12 MAISONS pour Ascendant Cancer: 1=Cancer/2=Lion/3=Vierge/4=Balance/5=Scorpion/6=Sagittaire/7=Capricorne/8=Verseau/9=Poissons/10=Bélier/11=Taureau/12=Gémeaux. Le Soleil en Poissons = Maison 9, JAMAIS Maison 1 ou 12!
- En cas de doute sur la maison dans le texte mensuel, OMETS la parenthèse de maison (ex. le Soleil entre en Balance au lieu de le Soleil entre en Balance (Maison 5)).
- N'écris jamais Poissons répété. Utilise toujours Poissons.

Vous êtes un maître astrologue de l'abondance, mystique de la Cabbale et psychologue clinicien. Vous générez un almanach de richesse annuel de prestige (valeur $29.99). Votre mission est de décoder le thème natal de l'utilisateur, les aspects planétaires (Jupiter, Saturne, Pluton) et sa révolution solaire pour les 12 prochains mois.

[RÈGLES D'OR]
1. Ton & Posture: Adoptez un ton sacré, philosophique, d'une précision chirurgicale et teinté de psychologie jungienne. Évitez absolument les structures robotiques d'une IA standard.
2. Volume Impératif: Le texte doit posséder une densité monumentale (6 000 à 8 000 mots). Ne fusionnez AUCUN mois. Chaque transit doit être détaillé avec une profondeur absolue.
3. Précision Terminologique: Utilisez le vocabulaire noble de l'astrologie et de la psychanalyse française (e.g., "Maison de l'argent personnel", "L'Ombre / Shadow Self", "Révolution Solaire").
4. [STRICT] Interdiction de Répétition Temporelle: Calculez toutes les dates en une seule chaîne de pensée. INTERDISEZ STRICTEMENT toute superposition de mots temporels, autocorrection ou répétition (ex., interdire "juin 2026juillet 2026" ou "15 juin15 juin 1990"). Toutes les dates doivent être propres et uniques.
5. [STRICT] Verrouillage Titre H4 Accordéon: Dans le Chapitre II (Matrice de Revenus Mensuels), vous DEVEZ utiliser exactement #### pour les en-têtes de mois. NE CHANGEZ JAMAIS le nombre de #. Format: #### [Étiquette du Mois] Juillet 2026 : Jupiter entre dans la Maison de la Richesse.
6. [STRICT] Immutabilité des Étiquettes Anglaises: Quelle que soit la langue de sortie, les jours de pic mensuels DOIVENT conserver [Peak Revenue Window] et [Financial Black Swan Day] entre crochets anglais. NE TRADUISEZ JAMAIS ces étiquettes ! Le frontend en dépend.

[STRUCTURE DE L'ALMANACH]
### 📜 Chapitre I : La Matrice Annuelle de l'Abondance (The Wealth Matrix)
- Analyse de Jupiter et Saturne. Détermination de la stratégie macro : Expansion Audacieuse vs. Préservation Souveraine.

### 📅 Chapitre II : Le Cadran Temporel des 12 Mois (The Monthly Revenue Matrix)

⛔ [RÈGLE DE FER DE L'ÉTAT PLANÉTAIRE]:
- **Jupiter**: 2026 en Lion juil-déc, DIRECT. PAS "vient de terminer rétrograde" ou "entre en Sagittaire" en fév. NE PEUT PAS sauter 3 signes en 1 mois!
- **Saturne**: En Bélier toute l'année. PAS de changement.
- **Pluton**: En Verseau 2024-2043. PAS de changement vers Capricorne.
- **Mercure**: Seulement 3 rétrogrades/an. PAS "quatrième rétrograde".
- **INTERDIT**: Inventer états rétrograde/direct ou changements de signe pour planètes extérieures.

- Analyse mois par mois sans exception pour les 12 prochains mois. Chaque mois exige :
 1. Climat Financier Mensuel : Impact des mouvements planétaires sur les actifs.
 2. 🟢 [📈 Fenêtre de Revenu Sommet (Peak Revenue Window)] : Dates exactes pour négocier ou pivoter.
 3. 🔴 [📉 Jour du Cygne Noir Financier (Financial Black Swan Day)] : Alertes de pertes, contrats toxiques ou impulsions de l'Ombre.

### 🏹 Chapitre III : Les Voies de Destinée et Carrières Clés
- Les vecteurs cachés d'alignement financier basés sur les éléments (Feu, Terre, Air, Eau).

### 🛡️ Chapitre IV : Le Bouclier Anti-Risque et Audit de l'Ombre
- Analyse des failles psychologiques qui causent la fuite des capitaux inconsciente.

### 🔮 Chapitre V : Protocole de Manifestation de l'Oracle
- Rituels de matérialisation, géométrie sacrée du bureau et mantra d'ancrage vibratoire.

[FORMAT_SPEC — Spécification Visuelle Ultime · OBLIGATOIRE]
Vous DEVEZ générer en suivant strictement ce paradigme de format. Symboles/espaces/sauts de ligne/gras doivent correspondre exactement:

1. Carte d'Identité Supérieure (mystère du bloc de citation):
> ### ✦ Codex du Prophète · Révélation de l'Abondance ✦
>
> * 👤 **Hôte du Destin**: ${birthDate}
> * 🌌 **Carte Annuelle**: Gémeaux · Année de la Révolution Solaire
> * 🗝️ **Code Natal Central**: Soleil Gémeaux 9° / Lune Balance / Ascendant Cancer

2. Tableau de Bord Stratégique Macro (Or/Argent/Bronze/Fer):
### 📊 Tableau de Bord des Métriques Centrales de Richesse 2026-2027
---
* 🚀 **Thème Macro Annuel**: [Expansion Audacieuse avec Intégrité Contractuelle]
* 🌟 **Indice d'Explosion de Richesse**: ★★★★★ (Jupiter en Lion tous les 12 ans activant Maison II)
* ⚠️ **Risque de Disjoncteur d'Actifs**: ★★★☆☆ (Saturne en Bélier auditant Maison XI)
* 🔮 **Direction de Manifestation du Destin**: Sud Vrai (négociation et pouvoir)

3. Bac à Sable de Flux 12 Mois (verrouillage H4 + étiquettes anglaises):
#### 📅 Juillet 2026 : Jupiter Entre dans la Maison de l'Abondance — Mois de l'Éveil

* 🌐 **[Aperçu Mensuel du Flux de Richesse]**: Jupiter vient d'entrer dans votre Maison II (Lion). L'horloge cosmique de la richesse se recalibre...

* 🟢 **[Peak Revenue Window]**: **5-10 juillet** (conjonction exacte Soleil-Jupiter en Lion).
 * *Ordre d'Exécution*: Demandez une augmentation ou lancez de nouveaux projets...

* 🔴 **[Financial Black Swan Day]**: **18 juillet** (Mercure rétrograde en Maison II).
 * *Avertissement de Disjoncteur*: Strictement interdit de signer des contrats...

4. Intégration de l'Ombre (ligne de rupture impactante):
### 🛡️ Chapitre IV : Le Bouclier Anti-Risque et Audit de l'Ombre

#### 👁️ Ombre Subconsciente : Consommation Performative (Soi Vanité Non Intégré)
> "Au fond de vous se cache un enfant invisible..."
---
* 💡 **Chemin de Guérison Profonde**: Retardez 24 heures avant chaque paiement...

5. Oracle de Clôture (fermeture rituelle):
---
### 🔮 Oracle Final de l'Abondance · Code de Maîtrise

> **"Étendez-vous avec le cœur d'un lion, optimisez avec l'œil d'une vierge, transformez avec la sagesse du Verseau..."`,

    th: `

[กฎดาราศาสตร์เด็ดขาด - ห้ามละเมิด]:
- ราศีมิถุน/ราศีพิจิก/ราศีธนู = ธาตุไฟ (ไม่ใช่ธาตุน้ำ)! ราศีเมถุน/ราศีธาตุไม้/ราศีควอนแทรี่ = ธาตุลม (ไม่ใช่ธาตุดิน)! ราศีกรกฏ/ราศีเมษ/ราศีธนู = ธาตุไฟ!
- ราศีมิถุน (Pisces) = ธาตุน้ำเสมอ! ไม่ใช่ธาตุลม! มิถุน = สัญชาตญาณ ศิลปะ ความเห็นอกเห็นใจ ไม่ใช่ "การไหลของข้อมูล"!
- ดาราศาสตร์: วสันตวิษุวัต = ~20 มีนาคม (ฤดูใบไม้ผลิ), ศารทวิษุวัต = ~22 กันยายน (ฤดูใบไม้ร่วง)! ห้ามเขียน "กันยายน = วสันตวิษุวัต" เด็ดขาด!
- ดวงอาทิตย์เข้าสู่ราศีหนึ่งราศีต่อเดือน! เป็นไปไม่ได้ที่จะเข้าราศีมิถุนทั้งพ.ค.และมิ.ย.ติดต่อกัน! พ.ค.=ราศีพฤกษภาณมิถุน, มิ.ย.=ราศีมิถุน, ก.ค.=ราศีกรกฏ

- ระบบเรือน 12 หลังสำหรับ ASC=ราศีกรกฏ: เรือนที่ 1=กรกฏ, 9=มีน, 10=เมษ, 11=พฤษภ, 12=มิถุน. ดวงอาทิตย์ในราศีมีน = เรือนที่ 9 ไม่ใช่ 1 หรือ 12!
- หากไม่แน่ใจเรื่องเรือนในข้อความรายเดือน ให้ละวงเล็บเรือน (เช่น ดวงอาทิตย์เข้าสู่ราศีธนู แทน (เรือนที่ 5))
- ห้ามพิมพ์ ราศีมีน ซ้ำซ้อน เขียน ราศีมีน เสมอ

คุณคือมหาปราชญ์แห่งโหราศาสตร์ความมั่งคั่งตะวันตก ผู้หยั่งรู้ความลี้ลับแห่งคัมภีร์คับบาลาห์ และนักจิตวิทยาคลินิกขั้นสูง กำลังสร้างรายงานความมั่งคั่งประจำปีระดับพรีเมียมสูงสุด (มูลค่า $29.99) หน้าที่ของคุณคือการถอดรหัสแผนผังดวงดาวแต่กำเนิด ประสานมุมดวงดาว (ดาวพฤหัสบดี, ดาวเสาร์, ดาวพลูโต) และวงโคจรสุริยยาตร์ (Solar Return) สำหรับ 12 เดือนข้างหน้า

[กฎเหล็กและพันธนาการ]
1. น้ำเสียงและพลังงาน: ต้องใช้ภาษาที่ "ทรงพลัง ศักดิ์สิทธิ์ แม่นยำระดับพิกเซล เต็มไปด้วยความลี้ลับแห่งโชคชะตา และการเยียวยาทางจิตวิทยา" ห้ามใช้ภาษาตื้นเขินหรือคำพูดที่ดูเป็นหุ่นยนต์ AI เด็ดขาด
2. ความหนาแน่นของเนื้อหา: เพื่อความคุ้มค่าระดับพรีเมียม เนื้อหาต้องมีความยาวและทรงพลังอย่างยิ่ง (6,000 - 8,000 คำในภาษาไทย) ห้ามรวบเดือน ห้ามตัดทอน ต้องขยายความให้ละเอียดหนาแน่นจนผู้ใช้อ่านแล้วรู้สึกถึงความศักดิ์สิทธิ์และยอมรับในคำพยากรณ์
3. การปรับเปลี่ยนทางวัฒนธรรม: ห้ามแปลตรงตัว! ให้ใช้คำศัพท์โหราศาสตร์สากลชั้นสูงที่ผสานกับแนวคิดเรื่อง "กรรมเก่า (Karmic)" และ "ตัวตนในเงา (Shadow Self)" ที่ลึกซึ้ง
4. [เข้มงวด] ห้ามซ้ำคำบอกเวลา: คำนวณวันที่ทั้งหมดในหนึ่งลำดับความคิด ห้ามเด็ดขาดการทับซ้อนของคำบอกเวลา การแก้ไขตัวเอง หรือการซ้ำ (เช่น ห้าม "มิถุนายน 2026กรกฎาคม 2026" หรือ "15 มิถุนายน15 มิถุนายน 1990") วันที่ทั้งหมดต้องสะอาดและไม่ซ้ำ
5. [เข้งวด] ล็อคหัวข้อ H4 แอคคอร์เดียน: ในบทที่ 2 (แผนผังรายได้รายเดือน) คุณต้องใช้ #### อย่างเคร่งครัดสำหรับหัวข้อเดือน ห้ามเปลี่ยนจำนวน # รูปแบบ: #### [ป้ายกำกับเดือน] กรกฎาคม 2026: ดาวพฤหัสบดีเข้าเรือนชะตาการเงิน
6. [เข้มงวด] ห้ามแปลป้ายกำกับภาษาอังกฤษ: ไม่ว่าภาษาผลลัพธ์จะเป็นอะไร วันพีครายเดือนต้องคง [Peak Revenue Window] และ [Financial Black Swan Day] ไว้ในวงเล็บเหลี่ยมภาษาอังกฤษ ห้ามแปลป้ายกำกับเหล่านี้! ส่วนหน้าขึ้นอยู่กับป้ายกำกับเหล่านี้

[โครงสร้างคัมภีร์ประจำปี]
### 📜 บทที่ 1: ผังโครงสร้างดวงดาวความมั่งคั่งประจำปี (The Wealth Matrix)
- วิเคราะห์มุมสัมพันธ์ของดาวพฤหัสบดี (การขยายตัว) และดาวเสาร์ (กรรม/แรงกดดัน) ในเรือนชะตาการเงิน กำหนดกลยุทธ์มหภาค: "บุกทะลวงขยายทัพ" หรือ "ตั้งรับเก็บกระสุน"

### 📅 บทที่ 2: ดวงเมืองการเงินและแผนผัง 12 เดือน (The Monthly Revenue Matrix)

⛔ [กฎเหล็กสถานะดาวเคราะห์]:
- **ดาวพฤหัสบดี**: 2026 อยู่ราศีสิงห์ ก.ค.-ธ.ค. เคลื่อนตรง ห้าม "เพิ่งหยุดย้อนกลับ" หรือ "เข้าสู่ราศีธนู" ก.พ. ข้าม 3 ราศีใน 1 เดือนไม่ได้!
- **ดาวเสาร์**: อยู่ราศีเมษตลอดปี ห้ามย้ายราศี
- **ดาวพลูโต**: อยู่ราศีกุมภ์ 2024-2043 ห้ามย้ายไปราศีมังกร
- **ดาวพุธ**: ย้อนกลับแค่ 3 ครั้ง/ปี ห้าม "ครั้งที่สี่"
- **ห้าม**: ปลอมแปลงสถานะย้อน/ตรง หรือการเปลี่ยนราศีของดาวเคราะห์ภายนอก

- แจกแจงรายละเอียดแบบเดือนต่อเดือน ครบทั้ง 12 เดือนนับจากปัจจุบัน โดยห้ามข้ามแม้แต่เดือนเดียว ทุกเดือนต้องประกอบด้วย:
 1. บทสรุปกระแสเงินตราประจำเดือน: ผลกระทบของดวงดาวต่อรายได้หลัก
 2. 🟢 [📈 ช่วงเวลาทองคำเปิดคลังทรัพย์ (Peak Revenue Window)]: ระบุวันที่แม่นยำสำหรับการเจรจา ย้ายงาน หรือลงทุนใหญ่
 3. 🔴 [📉 วันวิกฤตตัดกระแสเงิน (Financial Black Swan Day)]: ระบุวันที่อันตรายที่สุด ห้ามเซ็นสัญญา ห้ามให้กู้ ป้องกันการรั่วไหลจากกิเลสในเงา

### 🏹 บทที่ 3: เส้นทางอาชีพลิขิตฟ้าและช่องทางรายได้ลับ
- เจาะลึกธาตุประจำตัว (ไฟ, ดิน, ลม, น้ำ) เพื่อชี้เป้าธุรกิจหรือบุคคลเกื้อหนุนที่จะช่วยยกระดับฐานะ

### 🛡️ บทที่ 4: เกราะป้องกันหนี้สินและการชำระล้างจิตใต้สำนึก (The Shadow Audit)
- กระชากหน้ากาก "Shadow Self" (เงาในใจ) ที่ทำให้ผู้ใช้สูญเสียเงินโดยไม่รู้ตัว เพื่อสร้างระบบป้องกันความเสี่ยงระยะยาว

### 🔮 บทที่ 5: คัมภีร์เรียกทรัพย์เปิดทิศโชคลาภ (The Oracle's Manifestation Protocol)
- พิธีกรรมจัดวางโต๊ะทำงาน สิ่งของนำโชค และมนตราศักดิ์สิทธิ์ประจำปีเพื่อล็อคคลื่นสมองให้อยู่ในแรงสั่นสะเทือนของความมั่งคั่ง

[FORMAT_SPEC — ข้อกำหนดการจัดรูปแบบภาพสูงสุด · บังคับ]
คุณต้องสร้างโดยปฏิบัติตามรูปแบบนี้อย่างเคร่งครัด สัญลักษณ์/ช่องว่าง/การขึ้นบรรทัด/ตัวหนาต้องตรงกับตัวอย่าง:

1. บัตรประจำตัวด้านบน (ความลึกลับของบล็อกคำพูด):
> ### ✦ คัมภีร์ผู้พยากรณ์ · การเปิดเผยความมั่งคั่ง ✦
>
> * 👤 **เจ้าภาพแห่งโชคชะตา**: ${birthDate}
> * 🌌 **ผังประจำปี**: ราศีเมถุน · ปีสุริยะครอบดวงชะตา
> * 🗝️ **รหัสชะตากำเนิดหลัก**: ดวงอาทิตย์ราศีเมถุน 9° / ดวงจันทร์ราศีตุลย์ / ขึ้นราศีกรกฎ

2. แดชบอร์ดกลยุทธ์มหภาค (ทอง/เงิน/ทองแดง/เหล็ก):
### 📊 แดชบอร์ดตัวชี้วัดความมั่งคั่งหลัก 2026-2027
---
* 🚀 **ธีมมหภาคประจำปี**: [การขยายตัวอย่างกล้าหาญพร้อมความซื่อสัตย์ต่อสัญญา]
* 🌟 **ดัชนีการระเบิดของความมั่งคั่ง**: ★★★★★ (ดาวพฤหัสบดีในราศีสิงห์ทุก 12 ปี เปิดเรือนชะตาที่ 2)
* ⚠️ **ความเสี่ยงตัวตัดวงจรสินทรัพย์**: ★★★☆☆ (ดาวเสาร์ในราศีเมษตรวจสอบเรือนชะตาที่ 11)
* 🔮 **ทิศทางการแสดงออกแห่งโชคชะตา**: ทิศใต้ที่แท้จริง (การเจรจาและอำนาจ)

3. แซนด์บ็อกซ์กระแส 12 เดือน (ล็อค H4 + ป้ายกำกับภาษาอังกฤษ):
#### 📅 กรกฎาคม 2026: ดาวพฤหัสบดีเข้าเรือนชะตาการเงิน — เดือนแห่งการตื่นรู้

* 🌐 **[ภาพรวมกระแสความมั่งคั่งประจำเดือน]**: ดาวพฤหัสบดีเพิ่งเข้าสู่เรือนชะตาที่ 2 (ราศีสิงห์) ของคุณ นาฬิกาจักรวาลแห่งความมั่งคั่งกำลังปรับเทียบใหม่...

* 🟢 **[Peak Revenue Window]**: **5-10 กรกฎาคม** (ดวงอาทิตย์ร่วมกับดาวพฤหัสบดีอย่างแม่นยำในราศีสิงห์).
 * *คำสั่งปฏิบัติ*: ขอขึ้นเงินเดือนหรือเริ่มโครงการใหม่...

* 🔴 **[Financial Black Swan Day]**: **18 กรกฎาคม** (ดาวพุธวงในเรือนชะตาที่ 2).
 * *คำเตือนตัวตัดวงจร*: ห้ามเซ็นสัญญาใดๆ อย่างเด็ดขาด...

4. การบูรณาการเงา (เส้นแบ่งที่สร้างแรงกระแทก):
### 🛡️ บทที่ 4: เกราะป้องกันหนี้สินและการชำระล้างจิตใต้สำนึก

#### 👁️ เงาในใต้สำนึก: การบริโภคเชิงแสดง (ตัวตนหยิ่งผยองที่ยังไม่ได้บูรณาการ)
> "ลึกภายในคุณซ่อนเด็กที่ไม่มีใครเห็น..."
---
* 💡 **เส้นทางการรักษาอย่างลึกซึ้ง**: หน่วงเวลา 24 ชั่วโมงก่อนการชำระเงินแต่ละครั้ง...

5. คำพยากรณ์ปิดท้าย (การปิดฉากแบบพิธีกรรม):
---
### 🔮 คำพยากรณ์ความมั่งคั่งสุดท้าย · รหัสแห่งความเชี่ยวชาญ

> **"ขยายตัวด้วยหัวใจสิงห์ ปรับแต่งด้วยตาเวอร์จิน แปรสภาพด้วยสติปัญญาราศีกรกฎ..."`,

    vi: `

[QUY TẮC THÉP CHIÊM TINH - TUYỆT ĐỐI NGHIÊM CẤM]:
- Song Tử/Thiên Bình/Bảo Bình = NGƯ HÀNH (không phải Thổ hay Hỏa)! Cự Giải/Bọ Cạp/Song Ngư = THỦY HÀNH!
- Song Ngư (Pisces) = THỦY HÀNH! Không phải Ngư Hành! Song Ngư = TRỰC GIÁC, NGHỆ THUẬT, ĐỒNG CẢM, KHÔNG PHẢI "dòng chảy thông tin"!
- Thiên văn: Xuân Phân = ~20/3, Thu Phân = ~22/9. TUYỆT ĐỐI KHÔNG viết "tháng 9 = Xuân Phân"!
- Mặt Trời vào MỘT cung mỗi tháng. KHÔNG THỂ vào Song Ngư tháng 5 VÀ 6 liên tiếp! Tháng 5 = Kim Ngưu, Tháng 6 = Song Tử, Tháng 7 = Cự Giải.

- BẢN ĐỒ 12 NHÀ cho ASC=Cự Giải: 1=Cự Giải/9=Sông Ngư/10=Bạch Dương/11=Kim Ngưu/12=Song Tử. Mặt Trời tại Sông Ngư = Nhà 9, KHÔNG PHẢI Nhà 1 hay 12!
- Nếu không chắc nhà trong văn bản tháng, BỎ qua ngoặc nhà (vd Mặt Trời vào Thiên Bình thay vì (Nhà 5)).
- Tuyệt đối không viết Song Ngư lặp lại. Luôn dùng Song Ngư.

Bạn là bậc thầy chiêm tinh tài lộc phương Tây, nhà huyền học Kabbalah và chuyên gia tâm lý học lâm sàng, chịu trách nhiệm tạo ra Bản niên giám tài lộc cao cấp trọn gói 12 tháng (Trị giá $29.99). Nhiệm vụ của bạn là giải mã bản đồ sao ngày sinh, các gócchiếu hành tinh vĩ mô (Sao Mộc, Sao Thổ, Sao Diêm Vương) và điểm Cách mạng Mặt Trời (Solar Return) của người dùng.

[QUY TẮC THÉP]
1. Văn phong và Khí chất: Phải duy trì văn phong "huyền bí, thần thánh, chính xác tuyệt đối, mang đậm tính định mệnh và chữa lành tâm lý sâu sắc". Tuyệt đối không dùng các câu từ sáo rỗng của AI thông thường.
2. Áp lực khối lượng: Tổng lượng văn bản phải đạt từ 6.000 đến 8.000 từ tiếng Việt. KHÔNG gộp tháng, KHÔNG viết tắt, mọi chương mục phải được triển khai sâu sắc từng chi tiết nhỏ nhất để tạo cảm giác đồ sộ xứng đáng với mức giá cao cấp.
3. Không dịch thô: Sử dụng các thuật ngữ chiêm tinh học và tâm lý học học thuật thuần Việt (Ví dụ: "Nhà tài chính", "Bản ngã bóng tối / Shadow Self", "Gócchiếu Nghiệp lực").
4. [NGHIÊM NGẶT] Cấm Lặp Lại ThờI Gian: Tính toán tất cả ngày tháng trong một chuỗi suy nghĩ duy nhất. NGHIÊM CẤM bất kỳ sự chồng chéo từ ngữ thờI gian, tự sửa lỗi hoặc lặp lại nào (ví dụ: cấm "tháng 6 2026tháng 7 2026" hoặc "15 tháng 615 tháng 6 1990"). Tất cả ngày tháng phải sạch và duy nhất.
5. [NGHIÊM NGẶT] Khóa Tiêu Đề H4 Accordion: Trong Chương II (Ma Trận Thu Nhập Hàng Tháng), bạn PHẢI sử dụng chính xác #### cho tiêu đề tháng. KHÔNG BAO GIỜ thay đổi số lượng #. Định dạng: #### [Nhãn Tháng] Tháng 7 2026: Sao Mộc vào Nhà Tài Lộc.
6. [NGHIÊM NGẶT] Bất Biến Nhãn Tiếng Anh: Bất kể ngôn ngữ đầu ra, các ngày đỉnh hàng tháng PHẢI giữ nguyên [Peak Revenue Window] và [Financial Black Swan Day] trong dấu ngoặc vuông tiếng Anh. KHÔNG BAO GIỜ dịch các nhãn này! Frontend phụ thuộc vào chúng.

[CẤU TRÚC ĐẦU RA CHUẨN]
### 📜 Chương I: Ma Trận Tài Lộc Định Mệnh Năm (The Wealth Matrix)
- Xác định gócchiếu vị trí Sao Mộc (mở rộng) và Sao Thổ (áp lực/khế ước) tại cung tài lộc. Định hình chiến lược vĩ mô: Đại nhảy vọt bùng nổ hay Phòng thủ tích lũy tiền mặt.

### 📅 Chương II: Sa Bàn 12 Lưu Tháng Tài Chính Chi Tiết (The Monthly Revenue Matrix)

⛔ [QUY TẮC SẮT VỀ TRẠNG THÁI HÀNH TINH - TUYỆT ĐỐI TUÂN THỦ]:
- **Sao Mộc (Jupiter)**: Trong năm 2026, Sao Mộc ở Sư Tử từ tháng 7 đến tháng 12, vẫn đang DI CHUYỂN THUẬN (Direct). KHÔNG ĐƯỢC viết "Sao Mộc vừa kết thúc nghịch hành" hoặc "Sao Mộc di chuyển vào Nhân Mã" trong tháng 2. Sao Mộc KHÔNG THỂ nhảy qua 3 cung trong 1 tháng! Sao Mộc ở 1 cung khoảng 1 năm.
- **Sao Thổ (Saturn)**: Ở Bạch Dương (Aries) suốt năm 2026-2027. KHÔNG ĐƯỢC viết Sao Thổ chuyển sang cung khác.
- **Sao Diêm Vương (Pluto)**: Ở Bảo Bình (Aquarius) từ 2024-2043. KHÔNG ĐƯỢC viết chuyển sang Ma Kết.
- **Sao Thủy (Mercury)**: Chỉ nghịch hành 3 lần mỗi năm. KHÔNG ĐƯỢC viết "nghịch hành lần thứ tư".
- **CẤM TUYỆT ĐỐI**: Tự bịa trạng thái nghịch/thuận hoặc di chuyển sang chòm sao mới của các hành tinh lớn. Chỉ tập trung vào GÓC CHIẾU (aspect) và NHÀ (house) tác động!

- Phân tích nghiêm ngặt, chi tiết từng tháng một cho 12 tháng liên tiếp. Mỗi tháng BẮT BUỘC phải có:
 1. Tổng quan dòng tiền tháng: Đánh giá sự biến động của hành tinh lên thu nhập chính.
 2. 🟢 [📈 Cửa Sổ Vàng Tăng Trưởng Tài Lộc (Peak Revenue Window)]: Ngày chính xác để chốt hợp đồng, nhảy việc hoặc mở rộng kinh doanh.
 3. 🔴 [📉 Ngày Thiên Nga Đen Nguy Cơ Sụt Giảm (Financial Black Swan Day)]: Ngày kích hoạt khủng hoảng, cảnh báo cấm ký kết, cấm cho vay, phòng bẫy hợp đồng.

### 🏹 Chương III: Lộ Trình Sự Nghiệp Thiên Mệnh & Nghề Tay Trái
- Chỉ ra các lĩnh vực ngách dễ bứt phá dựa trên các yếu tố nguyên tố (Lửa, Đất, Khí, Nước) và quý nhân tương hợp.

### 🛡️ Chương IV: Lá Chắn Phòng Thủ Tài Sản & Kiểm Toán Bản Ngã Bóng Tối
- Mổ xẻ "Shadow Self" để bóc trần những lỗ hổng tâm lý khiến người dùng chi tiêu vô thức hoặc đầu tư mù quáng.

### 🔮 Chương V: Cẩm Nang Hiển Hóa Tài Lộc Thần Thánh (The Oracle's Manifestation Protocol)
- Hướng dẫn thực hành hiển hóa (Manifest), cách sắp xếp không gian làm việc vật lý chiêu tài và câu thần chú kích hoạt tần số thịnh vượng suốt 365 ngày.

[FORMAT_SPEC — Thông Số Bố Cục Hình Ảnh Tối Thượng · BẮT BUỘC]
Bạn PHẢI tạo ra bằng cách tuân thủ nghiêm ngặt mô hình định dạng này. Ký hiệu/khoảng trắng/ngắt dòng/in đậm phải khớp chính xác:

1. Thẻ Nhận Dạng Đầu Trang (huyền bí của khối trích dẫn):
> ### ✦ Bộ Sách Tiên Tri · Khải Thị Tài Lộc ✦
>
> * 👤 **Chủ Nhân Vận Mệnh**: ${birthDate}
> * 🌌 **Bảng Vận Niên**: Song Tử · Năm Cách Mạng Mặt TrờI
> * 🗝️ **Mã Bản Đồ Sao Chính**: Mặt TrờI Song Tử 9° / Mặt Trăng Thiên Bình / Mọc Cự Giải

2. Bảng Điều Khiển Chiến Lược Vĩ Mô (Vàng/Bạc/Đồng/Sắt):
### 📊 Bảng Điều Khiển Chỉ Số Tài Lộc Chính 2026-2027
---
* 🚀 **Chủ Đề Vĩ Mô Năm**: [Mở Rộng Táo Bạo với Tính Toàn Vẹn Hợp Đồng]
* 🌟 **Chỉ Số Bùng Nổ Tài Lộc**: ★★★★★ (Sao Mộc tại Sư Tử 12 năm một lần kích hoạt cung tài lộc)
* ⚠️ **Rủi Ro Ngắt Mạch Tài Sản**: ★★★☆☆ (Sao Thổ tại Bạch Dương kiểm toán cung XI)
* 🔮 **Hướng Thể Hiện Vận Mệnh**: Nam Chân (đàm phán và quyền lực)

3. Hộp Cát Dòng Chảy 12 Tháng (khóa H4 + nhãn tiếng Anh):
#### 📅 Tháng 7 2026: Sao Mộc Vào Cung Tài Lộc — Tháng Thức Tỉnh

* 🌐 **[Tổng Quan Dòng Tiền Tháng]**: Sao Mộc vừa vào cung tài lộc (Sư Tử) của bạn. Đồng hồ vũ trụ tài lộc đang hiệu chuẩn lại...

* 🟢 **[Peak Revenue Window]**: **5-10 tháng 7** (Mặt TrờI hợp chính xác với Sao Mộc tại Sư Tử).
 * *Lệnh Thực Thi*: Yêu cầu tăng lương hoặc khởi động dự án mới...

* 🔴 **[Financial Black Swan Day]**: **18 tháng 7** (Sao Thủy nghịch tại cung tài lộc).
 * *Cảnh Báo Ngắt Mạch*: Nghiêm cấm ký bất kỳ hợp đồng nào...

4. Tích Hợp Bóng Tối (đường phân cách gây chấn động):
### 🛡️ Chương IV: Lá Chắn Phòng Thủ Tài Sản & Kiểm Toán Bản Ngã Bóng Tối

#### 👁️ Bóng Tối Tiềm Thức: Tiêu Dùng Biểu Diễn (Bản Ngã Phù Phiếm Chưa Tích Hợp)
> "Sâu trong bạn ẩn giấu một đứa trẻ vô hình..."
---
* 💡 **Con Đường Chữa Lành Sâu Sắc**: Trì hoãn 24 giờ trước mỗi lần thanh toán...

5. Thần Khẩu Kết Thúc (nghi thức đóng):
---
### 🔮 Thần Khẩu Tài Lộc Cuối Cùng · Mật Mã Chinh Phục

> **"Mở rộng bằng trái tim sư tử, tối ưu bằng con mắt xử nữ, chuyển hóa bằng trí tuệ bảo bình..."`,
  };

  // ════════════════════════════════
  // 分支：月报
  // ════════════════════════════════
  if (reportType === 'monthly') {
    // 计算当前月的英文名称
    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    const curMonthName = monthNames[currentMonth - 1];
    const nextMonthName = monthNames[currentMonth % 12];

    // 月报系统提示词（6语言）
    const MONTHLY_SYSTEM = {
      zh: `You are a master wealth astrologer and clinical psychologist generating a monthly financial report.${instruction}\n\nCRITICAL: You MUST write at least 1200 words. If you write less than 1200 words, the report will be rejected.`,
      en: `You are a wealth astrologer and Jungian psychologist generating a monthly financial report.${instruction}\n\nCRITICAL: You MUST write at least 1200 words.`,
      es: `Eres un astrólogo de riqueza y psicólogo junguiano generando un informe financiero mensual.${instruction}\n\nCRÍTICO: Debes escribir al menos 1200 palabras.`,
      fr: `Vous êtes un astrologue de la richesse et psychologue junguien générant un rapport financier mensuel.${instruction}\n\nCRITIQUE: Vous devez écrire au moins 1200 mots.`,
      th: `คุณคือโหราจารย์ด้านความมั่งคั่งและนักจิตวิทยาจุงเกียน สร้างรายงานการเงินรายเดือน${instruction}\n\nสำคัญ: คุณต้องเขียนอย่างน้อย 1200 คำ`,
      vi: `Bạn là nhà chiêm tinh giàu có và nhà tâm lý học Jungian tạo báo cáo tài chính hàng tháng.${instruction}\n\nQUAN TRỌNG: Bạn phải viết ít nhất 1200 từ.`,
    };

    const monthlySystem = MONTHLY_SYSTEM[lang] || MONTHLY_SYSTEM.en;

    return {
      system: monthlySystem,
      user: `
ASTROGRAPHIC RULES (MUST FOLLOW):
• MERCURY Rx 2026: starts July 18 in Leo — NEVER write July 18 as a good financial day before that date
• JUPITER: in Leo all July 2026 — NEVER write Jupiter in Pisces
• NO NEW MOON on July 1 or July 31 — real new moon is ~July 14

[THAI ASTRO RULES]:
• MERCURY Rx: ดาวพุธวงในเริ่ม 18 กรกฎาคม 2026 — ห้ามเขียนก่อนวันที่ 18
• JUPITER: ดาวพฤหัสบดีในราศีสิงห์ตลอดกรกฎาคม 2026
• NEW MOON จริง: ~14 กรกฎาคม 2026

[VIETNAMESE ASTRO RULES]:
• MERCURY Rx: Sao Thủy nghịch bắt đầu 18/7/2026 — cấm viết trước ngày 18/7
• WEEK 3 (Jul 15-21): Ngày 18/7 là ngày Sao Thủy nghịch BẮT ĐẦU — tuyệt đối CẤM đặt ngày 18/7 làm ngày vàng tài chính
• SỐ TIỀN: Dùng cùng một đơn vị (VND hoặc triệu đồng), không thay đổi linh tinh
• CẤM: "TÌNH TRẠNG GIỜI NGUYỆT TÀI CHÍNH" — dùng tiếng Việt tự nhiên

Generate a ${lang} monthly wealth report for birth date ${birthDate} (${curMonthName} ${currentYear}).

CRITICAL REQUIREMENTS:
1. Total length: 700-900 words (${lang}) — be concise, no fluff
2. Style: Fast-consuming, card-style, actionable
3. MUST have 4 weeks

OUTPUT FORMAT (STRICT JSON):
{
  "headline": "...",
  "weeks": [
    {"type": "peak", "tag": "🟢 Peak Week", "dateRange": "${curMonthName} 1-7", "text": "...(minimum 100 words)", "keyDay": "${curMonthName} 3"},
    {"type": "risk", "tag": "🔴 High-Risk Week", "dateRange": "${curMonthName} 8-14", "text": "...(minimum 100 words)", "keyDay": "${curMonthName} 11"},
    {"type": "flow", "tag": "🔵 Flow Week", "dateRange": "${curMonthName} 15-21", "text": "...(minimum 100 words)", "keyDay": "${curMonthName} 18"},
    {"type": "peak", "tag": "🟢 Peak Week", "dateRange": "${curMonthName} 22-31", "text": "...(minimum 100 words)", "keyDay": "${curMonthName} 28"}
  ],
  "expense_trap": {"tag": "⚠️ Expense Trap", "dateRange": "${curMonthName} 10-13", "text": "...(minimum 60 words)"}
}

IMPORTANT:
- Each week's text: minimum 100 words — be sharp and dense
- Write in ${lang} with native astrological terms
- NO markdown formatting in text fields (no **, ##, etc)
- NO English words in Chinese version (except astrological terms)
- Week 3 (${curMonthName} 15-21) keyDay ${curMonthName} 18 is Mercury Rx START — never frame it as a good financial day`,
    };
  }

  // ════════════════════════════════
  // 分支：年报
  // ════════════════════════════════
  if (reportType === 'yearly') {
    const PLUTO_IRON = {
      zh: '\n\n[冥王星天文铁律 - PLUTO IRON RULE]: 冥王星（Pluto）已于2024年进入水瓶座（Aquarius），停留至2043年。2026-2027年报中冥王星绝对位于第8宫水瓶座，绝不可写摩羯座（Capricorn）！所有语言 Pluto 必须写 Aquarius/水瓶座。',
      en: '\n\n[PLUTO ASTRONOMY IRON RULE]: Pluto entered Aquarius in 2024 and remains until 2043. In 2026-2027 reports Pluto MUST be in Aquarius (8th House). NEVER write Capricorn for Pluto in any language!',
      es: '\n\n[REGLA DE HIERRO DE PLUTÓN]: Plutón entró en Acuario en 2024 y permanece hasta 2043. En informes 2026-2027 Plutón DEBE estar en Acuario. ¡NUNCA escribas Capricornio para Plutón!',
      fr: '\n\n[RÈGLE DE PLUTON]: Pluton est entré en Verseau en 2024 et y reste jusqu\'en 2043. Dans les rapports 2026-2027 Pluton DOIT être en Verseau. N\'écrivez jamais Capricorne pour Pluton !',
      th: '\n\n[กฎเหล็กดาวพลูโต]: ดาวพลูโตเข้าสู่ราศีกุมภ์ในปี 2024 และจะอยู่ถึง 2043 ในรายงาน 2026-2027 ดาวพลูโตต้องอยู่ราศีกุมภ์ ห้ามเขียนราศีมังกรสำหรับดาวพลูโต',
      vi: '\n\n[QUY TẮC SẮT DIÊM VƯƠNG]: Sao Diêm Vương đã vào Bảo Bình năm 2024 và ở đó đến 2043. Trong báo cáo 2026-2027 Sao Diêm Vương PHẢI ở Bảo Bình. Tuyệt đối không viết Ma Kết cho Sao Diêm Vương!'
    };
    let yearlySystem = (YEARLY_SYSTEM[lang] || YEARLY_SYSTEM.zh) + (PLUTO_IRON[lang] || PLUTO_IRON.zh);

    // ── V97 TDZ FIX: Replace placeholders with actual variable values ──
    yearlySystem = yearlySystem
      .replace(/__RISING_LOCAL__/g, risingLocal)
      .replace(/__JUP_HOUSE__/g, String(jupHouse))
      .replace(/__SAT_HOUSE__/g, String(satHouse))
      .replace(/__PL_HOUSE__/g, String(plHouse))
      .replace(/__SUN_HOUSE__/g, String(sunHouse))
      .replace(/__MOON_HOUSE__/g, String(moonHouse))
      .replace(/__NATAL_SUN__/g, natalSunSign)
      .replace(/__JUP_SIGN_LOCAL__/g, jupSignLocal)
      .replace(/__SAT_SIGN_LOCAL__/g, satSignLocal)
      .replace(/__MOON_SIGN_LOCAL__/g, moonSignLocal)
      .replace(/__NATAL_SUN_EN__/g, natalSunSignEN);

    // ── V69 SwissEph Override: Replace hardcoded FACT_SHEET with computed truth ──
    if (v69FactSheet) {
      const FACT_START = yearlySystem.indexOf('[2026-2027 ASTRONOMY FACT SHEET');
      const FACT_END = yearlySystem.indexOf('Sun in Leo = 2nd House (solar return year)');
      if (FACT_START !== -1 && FACT_END !== -1) {
        const factSheetBlock = yearlySystem.slice(FACT_START, FACT_END + 'Sun in Leo = 2nd House (solar return year)'.length);
        // Replace the entire block with V69 truth
        yearlySystem = yearlySystem.replace(
          factSheetBlock,
          v69FactSheet + '\n\n[NOTE: Above is V69 SwissEph computed. This takes precedence over any conflicting hardcoded data.]'
        );
        console.log('[V69] FACT_SHEET injected, V69 data overrides hardcoded facts');
      }
    }

    // ── 🛠️ V80 FIX: Thai/Vietnamese 动态宫位替换 ──
    // 删除旧硬编码 house mapping（ASC=Cancer），注入 AstroMatrix 真值
    if ((lang === 'th' || lang === 'vi') && astroMatrix && astroMatrix.months && astroMatrix.months[0]) {
      const first = astroMatrix.months[0];
      const rising = astroMatrix.meta?.rising_sign || 'Cancer';
      // V96 FIX: 所有 fallback 改为 1（未知），强制 AI 从 monthly data 读取正确值
      // 旧 fallback（暴露错误值）：jupHouse=2, satHouse=10, plHouse=8
      const jupHouse = first.jupiter?.house ?? 1;
      const satHouse = first.saturn?.house ?? 1;
      const plHouse = first.pluto?.house ?? 1;
      const sunHouse = first.sun?.house ?? 1;
      const moonHouse = first.moon?.house ?? 1;

      // P1.2 Fixed Lexicon: 从 lexicon.js 读取泰语/越南语星座和宫位
      const TH_SIGN = LEXICON.th.signs;
      // 🛡️ 军师修正：泰文宫位用 ภพ（梵文 bhava）而非 เรือน
      const TH_HOUSE = {}; for (let i=1;i<=12;i++) TH_HOUSE[i] = 'ภพที่ ' + i;
      const VI_SIGN = LEXICON.vi.signs;

      const signMap = lang === 'th' ? TH_SIGN : VI_SIGN;
      const jupSignTH = signMap[first.jupiter?.sign] || first.jupiter?.sign || 'Leo';
      const satSignTH = signMap[first.saturn?.sign] || first.saturn?.sign || 'Aries';

      if (lang === 'th') {
        // ① 替换 ASTRO RULES 里的硬编码 ASC=Cancer house mapping
        const OLD_HOUSE_RULES = 'ระบบเรือน 12 หลังสำหรับ ASC=ราศีกรกฏ: เรือนที่ 1=กรกฏ, 9=มีน, 10=เมษ, 11=พฤษภ, 12=มิถุน. ดวงอาทิตย์ในราศีมีน = เรือนที่ 9 ไม่ใช่ 1 หรือ 12!';
        const NEW_HOUSE_RULES = `ระบบเรือน 12 หลังสำหรับ ASC=${signMap[rising] || rising} (Equal House คำนวณจากวันเกิดจริง): ดาวพฤหัสบดีในราศี${jupSignTH} = ${TH_HOUSE[jupHouse]}, ดาวเสาร์ในราศี${satSignTH} = ${TH_HOUSE[satHouse]}, ดาวพลูโตในราศีกุมภ์ = ${TH_HOUSE[plHouse]}, ดวงอาทิตย์ = ${TH_HOUSE[sunHouse]}. ห้ามใช้ house mapping อื่นเด็ดขาด!`;
        yearlySystem = yearlySystem.replace(OLD_HOUSE_RULES, NEW_HOUSE_RULES);

        // ② 替换 FORMAT_SPEC 里的硬编码宫位描述
        yearlySystem = yearlySystem.replace(
          /ดาวพฤหัสบดีในราศีสิงห์ทุก 12 ปี เปิดเรือนชะตาที่ 2/g,
          `ดาวพฤหัสบดีในราศี${jupSignTH} เปิด${TH_HOUSE[jupHouse]}ทุก 12 ปี`
        );
        yearlySystem = yearlySystem.replace(
          /ดาวเสาร์ในราศีเมษตรวจสอบเรือนชะตาที่ 11/g,
          `ดาวเสาร์ในราศี${satSignTH}ตรวจสอบ${TH_HOUSE[satHouse]}`
        );
        console.log(`[V80] Thai house context injected: Jup=${jupHouse} House(${jupSignTH}), Sat=${satHouse} House(${satSignTH}), Rising=${rising}`);
      } else if (lang === 'vi') {
        // ── 🛠️ V81 FIX: 替换越南文 ASTRO RULES（P1.2: 从 lexicon 读取）──
        const VI_HOUSE = {}; for (let i=1;i<=12;i++) VI_HOUSE[i] = 'Nhà ' + i;
        const VI_SIGNS = LEXICON.vi.signs;
        const risingVI = VI_SIGNS[rising] || rising;
        const jupSignVI = VI_SIGNS[first.jupiter?.sign] || first.jupiter?.sign || 'Leo';
        const satSignVI = VI_SIGNS[first.saturn?.sign] || first.saturn?.sign || 'Aries';
        const OLD_VI_HOUSE = 'BẢN ĐỒ 12 NHÀ cho ASC=Cự Giải: 1=Cự Giải/9=Sông Ngư/10=Bạch Dương/11=Kim Ngưu/12=Song Tử. Mặt Trời tại Sông Ngư = Nhà 9, KHÔNG PHẢI Nhà 1 hay 12!';
        const NEW_VI_HOUSE = `BẢN ĐỒ 12 NHÀ cho ASC=${risingVI} (Equal House tính từ ngày sinh): Sao Mộc tại ${jupSignVI} = ${VI_HOUSE[jupHouse]}, Sao Thổ tại ${satSignVI} = ${VI_HOUSE[satHouse]}, Sao Diêm Vương tại Bảo Bình = ${VI_HOUSE[plHouse]}, Mặt Trời = ${VI_HOUSE[sunHouse]}. TUYỆT ĐỐI KHÔNG dùng Bản Đồ Whole Sign khác!`;
        yearlySystem = yearlySystem.replace(OLD_VI_HOUSE, NEW_VI_HOUSE);
        console.log(`[V81] Vietnamese house context injected: Jup=${jupHouse}(${jupSignVI}), Sat=${satHouse}(${satSignVI}), Rising=${risingVI}`);
      }


    }

    // ── 🛠️ V91: 把 if 块内声明的常量提升到外层 let，供 V89 HEADER_ENFORCE 访问 ──
    let natalSunSign = '', natalSunSignEN = '', risingLocal = '', jupSignLocal = '', satSignLocal = '';
    let jupHouse = 0, satHouse = 0, plHouse = 0, sunHouse = 0, moonHouse = 0;

    if (astroMatrix && astroMatrix.months && astroMatrix.months[0]) {
      const first = astroMatrix.months[0];
      const rising = astroMatrix.meta?.rising_sign || 'Cancer';
      jupHouse = first.jupiter?.house || 2;
      satHouse = first.saturn?.house || 10;
      plHouse = first.pluto?.house || 8;
      sunHouse = first.sun?.house || 1;
      moonHouse = first.moon?.house || 1;
      const jupSign = first.jupiter?.sign || 'Leo';
      const satSign = first.saturn?.sign || 'Aries';

      // 🛠️ V83: 计算 natal Sun Sign（不依赖 transit month）
      const natalSunIdx = getNatalSunSign(birthDate);
      const natalSunMap = {
        en: SUN_SIGN_EN[natalSunIdx], vi: SUN_SIGN_VI[natalSunIdx], th: SUN_SIGN_TH[natalSunIdx],
        zh: SUN_SIGN_ZH[natalSunIdx], es: SUN_SIGN_ES[natalSunIdx], fr: SUN_SIGN_FR[natalSunIdx]
      };
      natalSunSign = natalSunMap[lang] || SUN_SIGN_EN[natalSunIdx];
      natalSunSignEN = SUN_SIGN_EN[natalSunIdx];
      const plSignEN = 'Aquarius';

      // P1.2 Fixed Lexicon: 从 lexicon.js 读取 6 语言星座名
      const signMap = LEXICON[lang]?.signs || LEXICON.en.signs;
      risingLocal = signMap[rising] || rising;
      jupSignLocal = signMap[jupSign] || jupSign;
      satSignLocal = signMap[satSign] || satSign;

      // 🌐 6语言 STRICT HOUSE LOCK 模板
      const locks = {
        vi: `⛔ [QUY TẮC CUNG ĐỊA BÀN BẮT BUỘC] — Dữ liệu từ AstroMatrix + computed_houses.json ⛔

⛔ BẮT BUỘC: Khi viết về nhà của Sao Mộc/Sao Thổ/Sao Diêm Vương, BẮT BUỘC phải dùng số nhà từ khối JSON [COMPUTED_HOUSES] trong FACT SHEET. Không viết 'Nhà 5' cho Sư Tử trừ khi [COMPUTED_HOUSES] nói vậy.
\n\n📛 THÔNG TIN BẢN NGÃ (CẤM DÙNG DỮ LIỆU NGƯỜI KHÁC):\n• Mặt Trời = ${natalSunSign} (SUN SIGN CỦA NGƯỜI DÙNG NÀY, ngày sinh ${birthDate})\n• Mọi câu 'Hỡi người con của X' phải dùng ${natalSunSign} — KHÔNG ĐƯỢC dùng cung khác\n\n📍 Dựa trên Ascendant = ${risingLocal} (Equal House tính từ ngày sinh), các hành tinh BẮT BUỘC phải viết đúng cung sau:\n• Sao Mộc tại ${jupSignLocal} = Nhà ${jupHouse}\n• Sao Thổ tại ${satSignLocal} = Nhà ${satHouse}\n• Sao Diêm Vương tại Bảo Bình = Nhà ${plHouse}\n• Mặt Trời = Nhà ${sunHouse}\n• Mặt Trăng = Nhà ${moonHouse}\n\n⛔ CẤM TUYỆT ĐỐI:\n- Tự suy luận cung từ chòm sao (PHẢI dùng dữ liệu trên)\n- Dùng Bản Đồ Whole Sign — SAI\n- Viết Sao Mộc = Nhà 5 (phải là Nhà ${jupHouse})\n- Viết Sao Thổ = Nhà 11 (phải là Nhà ${satHouse})\n- Viết Sao Diêm Vương = Nhà 3 hoặc Nhà 11 (phải là Nhà ${plHouse})\n- Viết 'Mặt Trời Song Tử' nếu người dùng sinh tháng 10 (PHẢI là ${natalSunSign})`,
        th: `⛔ [กฎเหล็กเรือนดาราศาสตร์] — ข้อมูลจาก AstroMatrix + computed_houses.json ⛔

⛔ บังคับ: เมื่อเขียนเรือนของดาวพฤหัสบดี/ดาวเสาร์/ดาวพลูโต ต้องใช้หมายเลขเรือนจากบล็อก JSON [COMPUTED_HOUSES] ใน FACT SHEET ข้างบน ห้ามเขียน 'เรือนที่ 5' สำหรับราศีสิงห์ หาก [COMPUTED_HOUSES] ไม่ได้บอก!
\n\n📛 ข้อมูลส่วนตัว (ห้ามใช้ข้อมูลผู้ใช้อื่น):\n• ดวงอาทิตย์ = ${natalSunSign} (ดวงอาทิตย์ของผู้ใช้นี้, เกิดวันที่ ${birthDate})\n• ทุกข้อความ 'โอ้บุตรแห่งราศี X' ต้องใช้ ${natalSunSign} — ห้ามใช้ราศีอื่น\n\n📍 อ้างอิง Ascendant = ${risingLocal} (Equal House คำนวณจากวันเกิดจริง), ดาวเหล่านี้ต้องเขียนเรือนให้ถูกต้อง:\n• ดาวพฤหัสบดีที่ ${jupSignLocal} = ภพที่ ${jupHouse}\n• ดาวเสาร์ที่ ${satSignLocal} = ภพที่ ${satHouse}\n• ดาวพลูโตที่ กุมภ์ = ภพที่ ${plHouse}\n• ดวงอาทิตย์ = ภพที่ ${sunHouse}\n• ดวงจันทร์ = ภพที่ ${moonHouse}\n\n⛔ ห้ามเด็ดขาด:\n- อนุมานเรือนจากราศี (ต้องใช้ข้อมูลข้างบน)\n- ใช้แผนที่ Whole Sign\n- เขียนภพที่ผิด\n- เขียน 'ดวงอาทิตย์ราศีเมถุน' ให้ผู้ใช้ที่เกิดเดือนตุลาคม (ต้องเป็น ${natalSunSign})`,
        zh: `⛔ [宫位铁律] — 数据来自 AstroMatrix ⛔\n\n📛 个人信息强制（禁止用别人数据）:\n• 太阳 = ${natalSunSign} (本用户的太阳星座, 生日 ${birthDate})\n• 所有 'X座之人' 必须用 ${natalSunSign} — 不得用其他星座\n\n📍 基于上升星座 = ${risingLocal} (Equal House 从生日计算), 行星必须使用以下精确宫位:\n• 木星在 ${jupSignLocal} = 第 ${jupHouse} 宫\n• 土星在 ${satSignLocal} = 第 ${satHouse} 宫\n• 冥王星在水瓶座 = 第 ${plHouse} 宫\n• 太阳 = 第 ${sunHouse} 宫\n• 月亮 = 第 ${moonHouse} 宫\n\n⚠️ 强制引用规则：全文所有涉及木星/土星/冥王星/太阳的宫位描写，必须引用 [COMPUTED_HOUSES] JSON 块里的精确 house 数值！\n  禁止：看到"狮子座"就写第5宫、看到"白羊座"就写第1宫、看到"水瓶座"就写第11宫。\n  正确：以 [COMPUTED_HOUSES] JSON 里的 computed_house 数值为准。\n\n⛔ 严禁:\n- 从星座推算宫位（必须用上面数据）\n- 使用 Whole Sign 全星座制\n- 写错宫位\n- 写'太阳在双子座'给10月生日的用户（必须用 ${natalSunSign}）`,
        en: `⛔ [HOUSE MAPPING IRON RULE] — Data from AstroMatrix ␦ STRICTLY VERIFIED ␦\n\n📛 PERSONAL IDENTITY (do NOT use other users' data):\n• Sun = ${natalSunSignEN} (this user's Sun Sign, birth date ${birthDate})\n• All 'O child of X' must use ${natalSunSignEN} — NOT other signs\n\n📍 Based on Ascendant = ${risingLocal} (Equal House from birth date), planets MUST use these exact houses:\n• Jupiter in ${jupSignLocal} = House ${jupHouse}\n• Saturn in ${satSignLocal} = House ${satHouse}\n• Pluto in Aquarius = House ${plHouse}\n• Sun = House ${sunHouse}\n• Moon = House ${moonHouse}\n\n⛔ STRICTLY FORBIDDEN:\n- Inferring houses from signs (USE THE DATA ABOVE)\n- Using Whole Sign house system\n- Writing Jupiter = House 5 (must be House ${jupHouse})\n- Writing Saturn = House 11 (must be House ${satHouse})\n- Writing 'Sun in Gemini' for an October-born user (MUST be ${natalSunSignEN})`,
        es: `⛔ [REGLA DE HIERRO DE CASAS] — Datos de AstroMatrix + computed_houses.json ⛔

⛔ OBLIGATORIO: Al escribir sobre las casas de Júpiter/Saturno/Plutón, DEBES usar el número de casa del bloque JSON [COMPUTED_HOUSES] en la FACT SHEET. No escribir 'Casa 5' para Leo sin que [COMPUTED_HOUSES] lo indique.
\n\n📛 IDENTIDAD PERSONAL (no usar datos de otros usuarios):\n• Sol = ${natalSunSign} (el Sol de ESTE usuario, fecha de nacimiento ${birthDate})\n• Todo 'Oh hijo de X' debe usar ${natalSunSign} — NO otros signos\n\n📍 Basado en Ascendente = ${risingLocal} (Equal House desde fecha de nacimiento), los planetas DEBEN usar estas casas exactas:\n• Júpiter en ${jupSignLocal} = Casa ${jupHouse}\n• Saturno en ${satSignLocal} = Casa ${satHouse}\n• Plutón en Acuario = Casa ${plHouse}\n• Sol = Casa ${sunHouse}\n• Luna = Casa ${moonHouse}\n\n⛔ ESTRICTAMENTE PROHIBIDO:\n- Inferir casas desde signos (usar datos arriba)\n- Usar sistema Whole Sign\n- Escribir Júpiter = Casa 5 (debe ser Casa ${jupHouse})\n- Escribir 'Sol en Géminis' para usuarios nacidos en octubre (DEBE ser ${natalSunSign})`,
        fr: `⛔ [RÈGLE DE FER DES MAISONS] — Données d'AstroMatrix + computed_houses.json ⛔

⛔ OBLIGATOIRE: En écrivant sur les maisons de Jupiter/Saturne/Pluton, vous DEVEZ utiliser le numéro de maison du bloc JSON [COMPUTED_HOUSES] dans la FACT SHEET. Ne pas écrire 'Maison 5' pour Léo sans que [COMPUTED_HOUSES] l'indique.
\n\nBasé sur Ascendant = ${risingLocal} (Equal House depuis date de naissance), les planètes DOIVENT utiliser ces maisons exactes:\n• Jupiter en ${jupSignLocal} = Maison ${jupHouse}\n• Saturne en ${satSignLocal} = Maison ${satHouse}\n• Pluton en Verseau = Maison ${plHouse}\n• Soleil = Maison ${sunHouse}\n• Lune = Maison ${moonHouse}\n\n⛔ STRICTEMENT INTERDIT:\n- Inférer les maisons depuis les signes\n- Utiliser le système Whole Sign\n- Écrire Jupiter = Maison 5 (doit être Maison ${jupHouse})`
      };
      houseLock = locks[lang] || locks.en;
      console.log(`[V82] houseLock built for ${lang}: Jup=${jupHouse}, Sat=${satHouse}, Pluto=${plHouse}, Sun=${sunHouse}, Rising=${risingLocal}`);
    }

    // ⛔ V89: 注入强制头部模板到 system prompt（system > user 层级更高）
    const HEADER_ENFORCE = lang === 'vi' ? `

⛔ [MANDATORY HEADER VALUES — DO NOT CHANGE, COPY VERBATIM]:
The user's Natal Sun Sign is ${natalSunSign} (computed by Swiss Ephemeris for birth date ${birthDate}).
YOUR OUTPUT HEADER MUST use exactly:
🌌 Bảng Vận Niên: ${natalSunSign} · Năm Cách Mạng Mặt Trời
🗝️ Mã Bản Đồ Sao Chính: Mặt Trời ${natalSunSign} ...
Mọi câu 'Hỡi người con của...' PHẢI dùng: ${natalSunSign}
TUYỆT ĐỐI KHÔNG được output 'Song Ngư' hoặc bất kỳ cung nào khác cho Mặt Trời.
Nếu output chứa 'Song Ngư' trong metadata header, generation sẽ bị từ chối!` : '';
    yearlySystem += HEADER_ENFORCE;

    return {
      system: yearlySystem,
      user: `${houseLock ? houseLock + '\n\n' : ''}\n\n⛔ CRITICAL — AI MUST NOT output any chapter heading or title line in your output. Chapter structure and gold titles are handled by the frontend rendering system. Only output raw content. DO NOT include lines like 'Chương I: ...', 'Chapter I', 'บทที่ 1', '第X章' or similar headings.

Generate a ${lang} ultra-premium yearly wealth almanac for birth date ${birthDate}.

⛔ [CRITICAL — DO NOT COMPUTE SUN SIGN]: The user's Natal Sun Sign has been pre-computed by Swiss Ephemeris and provided in the [HOUSE MAPPING IRON RULE] section above. The per-month data below is TRANSIT data for the 12 forecast months — NOT natal chart data. DO NOT use transit Sun positions to compute or replace the user's natal Sun Sign. If the Sun Sign is explicitly stated above, USE THAT VALUE. In output, include the header 'Bảng Vận Niên: {natalSunSign} · Năm Cách Mạng Mặt Trời' and 'Mã Bản Đồ Sao Chính: Mặt Trời {natalSunSign}' using the exact natalSunSign value, NOT computed from transit data.

[P1.1 SWISSEPH PER-MONTH TRUTH DATA — DO NOT ALTER]:
All planet positions, houses, and aspects below are COMPUTED by Swiss Ephemeris.
Use this data DIRECTLY. Do NOT recalculate, re-assign houses, or invent positions.
${perMonthData || '    [SwissEph data unavailable — use your best astrological judgement]'}

DYNAMIC DATE CALCULATION (CRITICAL):
• Report cycle starts from current month: ${currentYear}年${monthNamesZH[currentMonth-1]}
• Report covers exactly 12 months: ${monthsRange}
• The user's Solar Return cycle anchors the annual forecast
• ALL dates must be dynamically calculated — ZERO hardcoded dates allowed

⛔ MERCURY RETROGRADE 2026 (FIXED — reference these, but adapt to user's Solar Return):
• MR#2: June 12 - July 7, 2026 (partially overlaps current cycle)
• MR#3: July 18 - August 11, 2026 (CRITICAL: July 18 is the real H2 Mercury Rx start!)
• MR#4: October 7 - October 28, 2026

⛔ NEVER write dates like "2026年6月2026年6月" or duplicated/corrupted dates.
⛔ NEVER repeat the year inside month descriptions.

REQUIREMENTS:
• Total length: 6,000-8,000 words (${lang})
• Style: Epic, destiny-filled, ultra-premium ($29.99 value)
• MUST include 5 complete chapters (each chapter ≥1,000 words):
  1. Annual Wealth Matrix
  2. 12-Month Revenue Matrix (strictly 12 months, NO merging)
  3. Destiny Career Path
  4. Debt & Risk Shield
  5. Oracle's Manifestation Guide

OUTPUT FORMAT: Clean Markdown with exactly 5 chapters.

Write in ${lang}. Use native ${lang} astrological and Jungian psychological terms.`,
    };
  }

  return null;
}


// ── Compatibility Report Prompt Builder ──
function buildCompatibilityReportPrompt(d1, d2, lang, reportType) {
  if (reportType === 'monthly') {
    return `Generate a ${lang} monthly compatibility report for two people (birth dates: ${d1} and ${d2}) for July 2026.\n\nREQUIREMENTS:\n1. Total length: 1200-1500 words\n2. Style: Romantic, card-style\n3. MUST have 4 weeks\n\nOUTPUT FORMAT (JSON): {\n  \"headline\": \"...\",\n  \"weeks\": [...]\n}`;
  }
  return `分析 ${d1} 和 ${d2} 的命理合盘。`;
}

// ── Stripe Price ID 映射表 ──
// ⚠️ 需要替换为真实的 Stripe Price ID（从 Stripe Dashboard 获取）
const STRIPE_PRICE_MAP = {
  wealth_once:           'price_1Tl4pBRnHNva8hys1s5WC3uR',  // $4.99 财富单次
  wealth_monthly_report: 'price_1Tl56VRnHNva8hysQBWuVd5t',  // $2.99 财富月报
  wealth_yearly_report:  'price_1Tl5BCRnHNva8hysRm3BfIHs',  // $29.99 财富年报
  compatibility_once:    'price_1Tl4lGRnHNva8hysp2Q17TfN',  // $4.99 合婚单次
  compatibility_monthly_report: 'price_1Tl51rRnHNva8hysoA4erWmn',  // $2.99 合婚月报
  compatibility_yearly_report:  'price_1Tl59QRnHNva8hysEXDUGyEI',  // $29.99 合婚年报
  star_monthly_vip:      'price_1Tl5EjRnHNva8hysoVOryjQN',  // $9.99 双引擎月卡
  all_pass_yearly:       'price_1Tl5IFRnHNva8hysWa0ndl9A',  // $99.99 全通年卡
};
// ── /api/create-checkout ──
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { plan, successUrl, cancelUrl } = req.body;
    const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));
    
    // 🛡️ 映射计划名 → Stripe Price ID
    const priceId = STRIPE_PRICE_MAP[plan] || plan; // 兼容直接传 Price ID 的情况
    if (!STRIPE_PRICE_MAP[plan] && !plan.startsWith('price_')) {
      console.error('[create-checkout] Unknown plan:', plan);
      return res.status(400).json({ error: 'Unknown plan: ' + plan });
    }
    
    // 🛡️ 根据 plan 决定 mode：单次产品用 payment，订阅用 subscription
    const SUBSCRIPTION_PLANS = new Set(['star_monthly_vip', 'all_pass_yearly']);
    const sessionParams = {
      mode: SUBSCRIPTION_PLANS.has(plan) ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.origin || 'https://kindredsouls.com'}/result?session_id={CHECKOUT_SESSION_ID}&paid=true`,
      cancel_url: cancelUrl || `${req.headers.origin || 'https://kindredsouls.com'}/result?canceled=true`,
    };
    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[create-checkout]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/webhook ──
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripeSig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY));
    const event = stripe.webhooks.constructEvent(req.body, stripeSig, webhookSecret);
    console.log('[webhook] Event:', event.type);
    // Handle events here (same logic as original webhook.js)
    if (event.type === 'checkout.session.completed' || event.type === 'customer.subscription.created') {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;
      console.log('[webhook] Payment from:', email, 'plan:', session.metadata?.plan || session.subscription);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[webhook]', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ── /api/save-result ──
app.post('/api/save-result', async (req, res) => {
  try {
    const { userId, resultType, resultData } = req.body;
    // 直接用 REST API 写入
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    const insRes = await fetch(
      `${SB_URL}/rest/v1/compatibility_results`,
      {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ user_id: userId, result_type: resultType, result_data: resultData })
      }
    );
    if (!insRes.ok) throw new Error(`Supabase insert failed: ${insRes.status}`);
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[save-result]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── /api/wealth-oracle ──
app.post('/api/wealth-oracle', async (req, res) => {
  try {
    // 🛠️ V91+: 出生时间/经纬度/时区（默认 Bangkok 中午）
    const {
      birthDate,
      birthTime = '12:00',
      lat = 13.75,
      lon = 100.5,
      tz = 'Asia/Bangkok',
      lang = 'zh',
    } = req.body;
    if (!birthDate) return res.status(400).json({ success: false, error: 'birthDate required' });

    // ═══ 军师缓存键：wealth:{生日}:{语言}:{类型} ═══
    const reportType = req.body.reportType || 'oracle';
    const cacheKey = `wealth:${birthDate}:${lang}:${reportType}`;
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

    // ═══ 第一道拦截：Cache Hit ═══
    if (SB_URL && SB_KEY && reportType !== 'oracle') {
      try {
        const cacheRes = await fetch(
          `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=insight&order=created_at.desc&limit=1`,
          { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
        );
        const cacheRows = await cacheRes.json();
        const cachedText = cacheRows?.[0]?.insight;

        if (cachedText && cachedText.length > 100) {
          console.log(`[wealth-oracle] [HIT] Cache HIT: ${cacheKey}, length=${cachedText.length}`);
          // 返回缓存数据（包装成前端期望的格式）
          if (reportType === 'monthly') {
            try {
              const parsed = JSON.parse(cachedText);
              return res.json({ success: true, cached: true, report: JSON.stringify(parsed) });
            } catch (e) {
              return res.json({ success: true, cached: true, report: cachedText });
            }
          } else {
            return res.json({ success: true, cached: true, report: cachedText });
          }
        }
      } catch (e) {
        console.warn('[wealth-oracle] Cache check error:', e.message);
      }
    }

    const TIANGAN = { zh:['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'], en:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], es:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], fr:['Jia','Yi','Bing','Ding','Wu','Ji','Geng','Xin','Ren','Gui'], th:['เจีย','อี้','ปิง','ติง','อู๋','จี','เกิง','ซิน','เหริน','กุ่ย'], vi:['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'] };
    const DIZHI = { zh:['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'], en:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], es:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], fr:['Zi','Chou','Yin','Mao','Chen','Si','Wu','Wei','Shen','You','Xu','Hai'], th:['จื่อ','โฉ่ว','อิน','เม้า','เฉิน','ซื่อ','อู๋','เว่ย','เซิน','โย่ว','สวี่','ไห่'], vi:['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'] };
    const WUXING = { zh:['金','木','水','火','土'], en:['Metal','Wood','Water','Fire','Earth'], es:['Metal','Madera','Agua','Fuego','Tierra'], fr:['Métal','Bois','Eau','Feu','Terre'], th:['โลหะ','ไม้','น้ำ','ไฟ','ดิน'], vi:['Kim','Mộc','Thủy','Hỏa','Thổ'] };
    const WUXING_TG = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const WUXING_DZ = { '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水' };
    const DAY_MASTER_EL = { '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水' };
    const t = (dict, key, lang) => (dict[lang] && dict[lang][key] !== undefined) ? dict[lang][key] : (dict.zh ? dict.zh[key] : dict[key]);

    // ── 1. 八字 ──
    const [year, month, day] = birthDate.split('-').map(Number);
    const yTG = TIANGAN.zh[(year - 4) % 10]; const yTGDisplay = t(TIANGAN, (year - 4) % 10, lang);
    const yDZ = DIZHI.zh[(year - 4) % 12]; const yDZDisplay = t(DIZHI, (year - 4) % 12, lang);
    const mTG = TIANGAN.zh[(month + 1) % 10]; const mTGDisplay = t(TIANGAN, (month + 1) % 10, lang);
    const mDZ = DIZHI.zh[(month + 1) % 12]; const mDZDisplay = t(DIZHI, (month + 1) % 12, lang);
    const dTGIdx = ((year - 1900) * 5 + (month - 1) * 30 + day - 15) % 10; const dTG = TIANGAN.zh[dTGIdx]; const dTGDisplay = t(TIANGAN, dTGIdx, lang);
    const dDZIdx = ((year - 1900) * 12 + (month - 1) * 30 + day - 15) % 12; const dDZ = DIZHI.zh[dDZIdx]; const dDZDisplay = t(DIZHI, dDZIdx, lang);
    const dayMasterEl = DAY_MASTER_EL[dTG];
    const dayMasterName = `${dTG}·${dayMasterEl}`;

    const wuxing = { '金':0,'木':0,'水':0,'火':0,'土':0 };
    [yTG, mTG, dTG].forEach(el => { if (WUXING_TG[el]) wuxing[WUXING_TG[el]]++; });
    [yDZ, mDZ, dDZ].forEach(el => { if (WUXING_DZ[el]) wuxing[WUXING_DZ[el]]++; });

    const score = Math.floor((wuxing['土'] + wuxing['金']) * 12 + wuxing['水'] * 15 + wuxing['木'] * 10);

    // ── 2. 星座 ──
    const signs = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
    const signsEn = ['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'];
    const elements = ['土','风','水','火','土','风','水','火','土','风','水','火'];
    const modalities = ['基本','固定','变动','基本','固定','变动','基本','固定','变动','基本','固定','变动'];
    const rulers = ['土星','天王星','海王星','火星','金星','水星','月亮','太阳','水星','金星','冥王星','木星'];

    // 星座查表：每个元素是 [月, 切换日, 星座索引]
    // 切换日当天及之后，属于新星座
    // 摩羯座：12月22日-1月19日 | 水瓶座：1月20日-2月18日 | 双鱼座：2月19日-3月20日
    // 白羊座：3月21日-4月19日 | 金牛座：4月20日-5月20日 | 双子座：5月21日-6月21日
    // 巨蟹座：6月22日-7月22日 | 狮子座：7月23日-8月22日 | 处女座：8月23日-9月22日
    // 天秤座：9月23日-10月23日 | 天蝎座：10月24日-11月21日 | 射手座：11月22日-12月21日
    function getZodiacIdx(m, d) {
      const cuts = [[1,20,1],[2,19,2],[3,21,3],[4,20,4],[5,21,5],[6,22,6],[7,23,7],[8,23,8],[9,23,9],[10,24,10],[11,22,11],[12,22,0]];
      for (let i = cuts.length - 1; i >= 0; i--) {
        if (m > cuts[i][0] || (m === cuts[i][0] && d >= cuts[i][1])) {
          return cuts[i][2];
        }
      }
      return 0;
    }
    const zodiacIdx = getZodiacIdx(month, day);
    const sunSign = signs[zodiacIdx];
    const sunSignEn = signsEn[zodiacIdx];
    const sunSignElement = elements[zodiacIdx];
    const sunSignMode = modalities[zodiacIdx];
    const sunSignRuler = rulers[zodiacIdx];

    // ── 3. 易经 ──
    const HEXNAMES = { zh:['乾','兑','离','震','巽','坎','艮','坤'], en:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], es:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], fr:['Qian','Dui','Li','Zhen','Xun','Kan','Gen','Kun'], th:['เฉียน','ตุ้ย','หลี่','เจิ้น','ซุน','ขั้น','เคิ่น','คุ่น'], vi:['Càn','Đoái','Ly','Chấn','Tốn','Khảm','Cấn','Khôn'] };
    const HEXNATURES = { zh:['天','泽','火','雷','风','水','山','地'], en:['Heaven','Lake','Fire','Thunder','Wind','Water','Mountain','Earth'], es:['Cielo','Lago','Fuego','Trueno','Viento','Agua','Montaña','Tierra'], fr:['Ciel','Lac','Feu','Tonnerre','Vent','Eau','Montagne','Terre'], th:['สวรรค์','บึง','ไฟ','ฟ้าร้อง','ลม','น้ำ','ภูเขา','ดิน'], vi:['Trờ','Đầm','Lửa','Sấm','Gió','Nước','Núi','Đất'] };
    const hash = (year + month + day) % 64 + 1;
    const upper = Math.floor((hash - 1) / 8) + 1;
    const lower = (hash - 1) % 8 + 1;
    const hexName = HEXNAMES[lang] ? HEXNAMES[lang][upper - 1] : HEXNAMES.zh[upper - 1];
    const hexNameEn = HEXNAMES.en[upper - 1];
    const hexNature = HEXNATURES[lang] ? HEXNATURES[lang][upper - 1] : HEXNATURES.zh[upper - 1];
    const changingLine = ((year + month + day) % 6) + 1;
    const transformedHex = upper === 8 ? 2 : upper + 1;
    const transformedHexName = HEXNAMES[lang] ? HEXNAMES[lang][transformedHex - 1] : HEXNAMES.zh[transformedHex - 1];
    const transformedHexNameEn = HEXNAMES.en[transformedHex - 1];

    // ── 4. 塔罗 ──
    const tarotId = ((year * 13 + month * 3 + day) % 22);
    const tarotReversed = (year + month + day) % 3 === 0;

    // 22张大阿卡纳：id → {name(中), nameEn(英), emoji, meaning(中), meaningEn(英)}
    const TAROT_CARDS = [
      { id:0, emoji:'🃏', name:{zh:'愚人',en:'The Fool',es:'El Loco',fr:'Le Mat',th:'ไพ่คนบ้า',vi:'Kẻ Khờ'}, meaning:{zh:'新的财务冒险即将开始，适合小额试错。',en:'A new financial adventure begins. Calculated risks favor you today.',es:'Nueva aventura financiera — toma riesgos calculados.',fr:'Nouvelle aventure financière — prends des risques calculés.',th:'การเสี่ยงทางการเงินใหม่ — คำนวณความเสี่ยงก่อน',vi:'Cuộc phiêu lưu tài chính mới — tính toán rủi ro trước。'} },
      { id:1, emoji:'🎩', name:{zh:'魔术师',en:'The Magician',es:'El Mago',fr:'Le Bateleur',th:'ไพ่จอมเวทย์',vi:'Ảo Thuật Gia'}, meaning:{zh:'你手头资源足以搅动一个项目，直接动手。',en:'Your financial tools are ready. Manifest wealth with focus.',es:'Manifiesta riqueza ahora — tus talentos están listos.',fr:'Manifester la richesse maintenant — vos talents sont prêts.',th:'สร้างความมั่งคั่งตอนนี้ — พรสวรรค์พร้อมแล้ว',vi:'Thể hiện của cải ngay bây giờ — tài năng sẵn sàng。'} },
      { id:2, emoji:'🌙', name:{zh:'女祭司',en:'The High Priestess',es:'La Sacerdotisa',fr:'La Papesse',th:'ไพ่นักบวชหญิง',vi:'Nữ Tư Tế'}, meaning:{zh:'直觉今天比财报准，信任你第六感。',en:'Financial intuition peaks. Trust your money gut today.',es:'Confía en tu intuición financiera — oportunidades ocultas te esperan.',fr:'Faites confiance à votre intuition — des opportunités vous attendent.',th:'ไว้ใจสัญชาตญาณ — โอกาสซ่อนอยู่รอคุณอยู่',vi:'Tin vào trực giác tài chính — cơ hội ẩn đang chờ bạn。'} },
      { id:3, emoji:'👑', name:{zh:'女皇',en:'The Empress',es:'La Emperatriz',fr:'L\'Impératrice',th:'ไพ่จักรพรรดินี',vi:'Nữ Hoàng'}, meaning:{zh:'适合收割之前种下的项目，果实该摘了。',en:'Financial abundance flows. Harvest what you planted.',es:'La abundancia fluye — la riqueza crece con paciencia.',fr:'L\'abondance circule — la richesse grandit avec patience.',th:'เงินไหลมา — ความมั่งคั่งเติบโตด้วยความอดทน',vi:'Cải tạo dồi dào — của cải lớn lên nhờ kiên nhẫn。'} },
      { id:4, emoji:'🏛️', name:{zh:'皇帝',en:'The Emperor',es:'El Emperador',fr:'L\'Empereur',th:'ไพ่จักรพรรดิ',vi:'Hoàng Đế'}, meaning:{zh:'拍板一个决策，把人管住，钱理清。',en:'Solid financial foundation. Build wealth with clear rules.',es:'Construye estructura de riqueza — base financiera sólida.',fr:'Construire la structure financière — base solide établie.',th:'สร้างโครงสร้างความมั่งคั่ง — ฐานะมั่นคงแล้ว',vi:'Xây dựng cấu trúc tài sản — nền tảng vững chắc rồi。'} },
      { id:5, emoji:'📜', name:{zh:'教皇',en:'The Hierophant',es:'El Papa',fr:'Le Pape',th:'ไพ่สมเด็จพระสังฆราช',vi:'Giáo Hoàng'}, meaning:{zh:'找个比你赚得多的人聊，问题可能出在认知圈。',en:'Seek a wealth mentor. Your money path needs guidance.',es:'Riqueza alineada con valores — camino ético claro.',fr:'Richesse alignée avec vos valeurs — chemin éthique clair.',th:'ความมั่งคั่งสอดคล้องค่านิยม — ทางที่ถูกต้องชัดเจน',vi:'Củả phù hợp giá trị — con đường kiếm tiền đạo đức rõ ràng。'} },
      { id:6, emoji:'💞', name:{zh:'恋人',en:'The Lovers',es:'Los Enamorados',fr:'Les Amoureux',th:'ไพ่คู่รัก',vi:'Tình Nhân'}, meaning:{zh:'跟钱有关的选择，选让你心跳加速的那条。',en:'Financial choice point. Follow your money heart.',es:'Punto de decisión financiera — sigue tu corazón.',fr:'Point de choix financier — suivez votre cœur.',th:'จุดตัดสินใจเรื่องเงิน — ทำตามหัวใจ',vi:'Điểm quyết định tài chính — theo trái tim tài chính của bạn。'} },
      { id:7, emoji:'🏇', name:{zh:'战车',en:'The Chariot',es:'El Carro',fr:'Le Chariot',th:'ไพ่รถศึก',vi:'Chiến Xe'}, meaning:{zh:'全速推进，犹豫一秒都是对财运的不尊重。',en:'Unstoppable financial momentum. Execute with confidence.',es:'El carro de la riqueza avanza — la acción decisiva gana.',fr:'Le char de la richesse avance — l\'action déterminée gagne.',th:'รถม้าความมั่งคั่งวิ่ง — ความมุ่งมั่นชนะ',vi:'Xe tài chính tiến — hành động kiên quyết thắng。'} },
      { id:8, emoji:'🦁', name:{zh:'力量',en:'Strength',es:'La Fuerza',fr:'La Force',th:'ไพ่พละกำลัง',vi:'Sức Mạnh'}, meaning:{zh:'今天要么搞定那笔钱，要么搞定那个不敢谈价的人。',en:'Inner financial power. Gentle wealth strength awakens.',es:'Fortaleza financiera interior — poder gentil despierta.',fr:'Force financière intérieure — pouvoir doux s\'éveille.',th:'พลังการเงินภายใน — พลังอ่อนโยนตื่น',vi:'Sức mạnh tài chính bên trong — năng lượng dịu dàng thức tỉnh。'} },
      { id:9, emoji:'🏮', name:{zh:'隐士',en:'The Hermit',es:'El Ermitaño',fr:'L\'Ermite',th:'ไพ่ฤาษี',vi:'Ẩn Sĩ'}, meaning:{zh:'关掉消息提醒，花30分钟盘你的财务底牌。',en:'Financial wisdom within. Solitude brings money insights.',es:'Sabiduría financiera interior — la soledad trae perspectivas.',fr:'Sagesse financière intérieure — la solitude apporte des perspectives.',th:'ปัญญาความมั่งคั่งภายใน — ความสันโดษให้มุมมองใหม่',vi:'Trí tuệ giàu có bên trong — một mình mang lại góc nhìn mới。'} },
      { id:10, emoji:'🎡', name:{zh:'命运之轮',en:'Wheel of Fortune',es:'La Rueda de la Fortuna',fr:'La Roue de Fortune',th:'วีลออฟฟอร์จูน',vi:'Bánh Xe Số Phận'}, meaning:{zh:'你的财运拐点到了，今天必须做一次主动出击。',en:'Financial cycle turning. Fortune favors bold money moves.',es:'El ciclo de riqueza gira — la fortuna favorece movimientos audaces.',fr:'Le cycle de richesse tourne — la fortune favorise les audacieux.',th:'วงจรความมั่งคั่งหมุน — โชคสนับสนุนผู้กล้า',vi:'Chu kỳ giàu có quay — vận may ủng hộ người dám làm。'} },
      { id:11, emoji:'⚖️', name:{zh:'正义',en:'Justice',es:'La Justicia',fr:'La Justice',th:'จัสติซ',vi:'Công Lý'}, meaning:{zh:'做一件正确但难开口的事，跟合伙人谈分成。',en:'Financial karma balancing. Money justice arrives.',es:'Justicia financiera — el karma del dinero se equilibra.',fr:'Justice financière — le karma de l\'argent s\'équilibre.',th:'ความยุติธรรมทางการเงิน — กรรมเงินสมดุล',vi:'Công lý tài chính — nghiệp tiền cân bằng hoàn hảo。'} },
      { id:12, emoji:'🙃', name:{zh:'倒吊人',en:'The Hanged Man',es:'El Colgado',fr:'Le Pendu',th:'ไพ่คนแขวน',vi:'Ngước Treo'}, meaning:{zh:'停下来的勇气比冲的勇气值钱。',en:'Financial perspective shift. New money vision needed.',es:'Cambio de perspectiva financiera — nueva visión del dinero.',fr:'Changement de perspective — nouvelle vision nécessaire.',th:'มุมมองทางการเงินเปลี่ยน — ต้องการวิสัยทัศน์ใหม่',vi:'Góc nhìn tài chính chuyển đổi — cần tầm nhìn mới về tiền。'} },
      { id:13, emoji:'💀', name:{zh:'死神',en:'Death',es:'La Muerte',fr:'La Mort',th:'เดธ',vi:'Cái Chết'}, meaning:{zh:'清理一个拖你后腿的财务包袱，结束才有新生。',en:'Financial transformation. Old you dies, new emerges.',es:'Transformación de riqueza — el viejo tú financiero muere.',fr:'Transformation financière — le vieil vous meurt.',th:'การเปลี่ยนแปลงความมั่งคั่ง — ตายแล้วเกิดใหม่',vi:'Chuyển đổi giàu có — người tài chính cũ chết, người mới ra đời。'} },
      { id:14, emoji:'🍷', name:{zh:'节制',en:'Temperance',es:'La Templanza',fr:'La Tempérance',th:'เทมเปอแรนซ์',vi:'Điều Độ'}, meaning:{zh:'今天最适合做资产配置的一步调整。',en:'Financial balance. Moderate money approach wins.',es:'Equilibrio financiero — la moderación gana.',fr:'Équilibre financier — la modération gagne.',th:'สมดุลความมั่งคั่ง — ทางเลือกปานกลางชนะ',vi:'Cân bằng giàu có — chiến lược tiền bạc vừa phải thắng。'} },
      { id:15, emoji:'😈', name:{zh:'恶魔',en:'The Devil',es:'El Diablo',fr:'Le Diable',th:'ไพ่ปีศาจ',vi:'Ác Ma'}, meaning:{zh:'直视你最上瘾的那笔消费或投资。',en:'Financial shadow work. Face money demons to win.',es:'Trabajo con la sombra financiera — enfrenta tus demonios.',fr:'Travail sur l\'ombre — affrontez vos démons.',th:'ทำงานกับเงาทางการเงิน — เผชิญปีศาจเงิน',vi:'Làm việc với bóng tối tài chính — đối mặt quỷ tiền bạc để thắng。'} },
      { id:16, emoji:'🗼', name:{zh:'高塔',en:'The Tower',es:'La Torre',fr:'La Maison Dieu',th:'ไพ่หอคอย',vi:'Tháp Đổ'}, meaning:{zh:'打破一个旧的收入结构，制造一次主动破坏。',en:'Financial breakthrough. Sudden money shift incoming.',es:'Quiebre financiero — cambio repentino de dinero.',fr:'Percée financière — changement soudain.',th:'การทะลุทางการเงิน — เงินเปลี่ยนทิศฉับพลัน',vi:'Đột phá tài chính — chuyển đổi tiền bạc đột ngột。'} },
      { id:17, emoji:'⭐', name:{zh:'星星',en:'The Star',es:'La Estrella',fr:'L\'Étoile',th:'ไพ่ดาว',vi:'Ngôi Sao'}, meaning:{zh:'今天适合定下一个长期目标。',en:'Financial hope returns. Wealth star guides your journey.',es:'La estrella financiera guía — la esperanza regresa.',fr:'L\'étoile financière guide — l\'espoir revient.',th:'ดาวนำทางความมั่งคั่ง — ความหวังกลับมา',vi:'Ngôi sao dẫn đường giàu có — hy vọng quay lại。'} },
      { id:18, emoji:'🌕', name:{zh:'月亮',en:'The Moon',es:'La Luna',fr:'La Lune',th:'ไพ่จันทร์',vi:'Mặt Trăng'}, meaning:{zh:'赚钱机会藏在模糊信息里。',en:'Financial intuition peaks. Lunar money magic works.',es:'Intuición financiera en su punto máximo — magia lunar.',fr:'Intuition financière à son apogée — magie lunaire.',th:'สัญชาตญาณทางการเงินสูงสุด — เวทมนตร์จันทรคติ',vi:'Trực giác tài chính đạt đỉnh — phép thuật trăng tròn。'} },
      { id:19, emoji:'☀️', name:{zh:'太阳',en:'The Sun',es:'El Sol',fr:'Le Soleil',th:'ไพ่อาทิตย์',vi:'Mặt Trời'}, meaning:{zh:'今天是亮牌日，把价值show出来。',en:'Financial success bright ahead. Wealth sunshine blesses you.',es:'El sol financiero brilla — éxito brillante adelante.',fr:'Le soleil financier brille — succès brillant devant.',th:'ดวงอาทิตย์ทางการเงินส่อง — ความสำเร็จรุ่งโรจน์',vi:'Ánh dương tài chính chiếu sáng — thành công rực rỡ phía trước。'} },
      { id:20, emoji:'📯', name:{zh:'审判',en:'Judgement',es:'El Juicio',fr:'Le Jugement',th:'จัดเมนต์',vi:'Phán Xét'}, meaning:{zh:'复盘一次过去的财务失误。',en:'Financial rebirth. Wealth calling heard.',es:'El llamado de la riqueza es escuchado — renacimiento.',fr:'L\'appel de la richesse entendu — renaissance.',th:'เสียงเรียกความมั่งคั่งดังแล้ว — การเกิดใหม่ใกล้',vi:'Tiếng gọi giàu có được nghe — tái sinh đang đến gần。'} },
      { id:21, emoji:'🌍', name:{zh:'世界',en:'The World',es:'El Mundo',fr:'Le Monde',th:'ไพ่โลก',vi:'Thế Giới'}, meaning:{zh:'一个财务周期结束了，今天奖励自己。',en:'Financial cycle complete. Wealth world transforms.',es:'Ciclo financiero completo — transformación total.',fr:'Cycle financier complet — transformation mondiale.',th:'วงจรความมั่งคั่งสมบูรณ์ — โลกการเงินเปลี่ยน',vi:'Chu kỳ giàu có hoàn tất — thế giới tài chính chuyển đổi。'} }
    ];
    const card = TAROT_CARDS[tarotId];
    const cardMeaning = (card.meaning[lang] || card.meaning.en);
    const cardName = (card.name[lang] || card.name.en);

    const result = {
      success: true,
      birthDate, lang,
      score,
      cached: false,
      message: lang === 'zh' ? '财富格局已生成' : 'Wealth pattern generated',
      data: {
        bazi: {
          sizhu: {
            yearPillar: `${yTGDisplay}${yDZDisplay}`,
            monthPillar: `${mTGDisplay}${mDZDisplay}`,
            dayPillar: `${dTGDisplay}${dDZDisplay}`,
            dayMaster: dTGDisplay,
            dayMasterWuxing: dayMasterEl
          },
          wuxing
        },
        zodiac: { sunSign, sunSignEn, sunSignElement, sunSignMode, sunSignRuler },
        iching: { hexName, hexNameEn, hexNum: hash, hexNature, changingLine, transformedHexName, transformedHexNameEn },
        tarot: {
          id: tarotId,
          name: cardName,
          nameEn: card.name.en,
          emoji: card.emoji,
          meaning: cardMeaning,
          orientation: tarotReversed ? 'Reversed' : 'Upright'
        }
      }
    };
    // ── 报告生成（月报/年报）──
    const { includeInsight } = req.body || {};
    if (reportType === 'monthly' || reportType === 'yearly') {
      // ── V69 SwissEph: Fetch computed astro matrix ──
      let astroMatrix = null;
      try {
        astroMatrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz); // 🛠️ V91: 传精确时间/坐标/时区
        if (astroMatrix) console.log(`[Wealth Oracle] [V69] Got matrix (asc=${astroMatrix.meta?.rising_sign})`);
      } catch (e) {
        console.warn('[Wealth Oracle] [V69] Fetch failed:', e.message);
      }

      try {
        console.log('[Wealth Oracle] Generating report:', { birthDate, lang, reportType });
        const prompt = buildWealthReportPrompt(birthDate, lang, reportType, {
          dayMaster: dTGDisplay,
          wuxing,
          sunSign,
          hexName,
          cardName,
        }, astroMatrix);
        
        if (!prompt) {
          return res.status(400).json({ success: false, error: 'Invalid reportType' });
        }

        const maxTokens = reportType === 'yearly' ? 48000 : 4000;
        const aiResult = await callAI(prompt.system, prompt.user, process.env, { maxTokens, reportType });

        // ── V97 宫位强制纠正器（铁血断路）──
        const ascendant = astroMatrix?.meta?.rising_sign || 'Cancer';
        const sanitizedAI = final_text_sanitizer(aiResult, ascendant);

        // Parse AI result
        let reportContent = sanitizedAI;

        // ── ⛔ 时间线强行熔断重组（防 DeepSeek Streaming 污染）──
        if (reportType === 'yearly') {
          reportContent = cleanYearlyTimeline(sanitizedAI);
        }

        if (reportType === 'monthly') {
          // Try to parse as JSON, if fails return as markdown
          try {
            const parsed = JSON.parse(sanitizedAI);
            reportContent = JSON.stringify(parsed); // Send JSON to frontend
          } catch (e) {
            // Not JSON, treat as markdown
            reportContent = sanitizedAI;
          }
        }
        
        console.log('[Wealth Oracle] Report generated successfully, length:', aiResult.length);
        
        // ═══ 写入缓存（非流式端点）═══
        if (SB_URL && SB_KEY && reportContent && reportContent.length > 100) {
          try {
            await fetch(`${SB_URL}/rest/v1/ai_insights_cache`, {
              method: 'POST',
              headers: {
                'apikey': SB_KEY,
                'Authorization': `Bearer ${SB_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=ignore-duplicates'
              },
              body: JSON.stringify({
                cache_key: cacheKey,
                insight: reportContent,
                prompt_version: `v1.0.0-${reportType}-${lang}`,
                created_at: new Date().toISOString(),
              })
            });
            console.log(`[wealth-oracle] [WRITE] Cache write: ${cacheKey}, length=${reportContent.length}`);
          } catch (e) {
            console.warn('[wealth-oracle] Cache write error:', e.message);
          }
        }
        
        return res.json({ ...result, report: reportContent, insight: '' });
      } catch (aiError) {
        console.error('[Wealth Oracle] AI generation failed:', aiError.message);
        return res.status(500).json({ success: false, error: 'AI generation failed: ' + aiError.message });
      }
    }

    res.json(result);
  } catch (err) {
    console.error('[wealth-oracle]', err.message, err.stack);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── /api/test-gemini ──
app.get('/api/test-gemini', async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.json({ error: 'GEMINI_API_KEY not set' });
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 50 } }),
      }
    );
    const data = await r.json();
    res.json({ status: r.status, data });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ── /api/ai-advisor (REST API版，无Supabase客户端依赖) ──
app.use('/api/ai-advisor', async (req, res) => {
  try {
    const { d1, d2, lang = 'zh', reportType = 'compatibility' } = req.body || {};
    
    // ── 月报/年报生成（AI 调用）──
    if (reportType === 'monthly' || reportType === 'yearly') {
      try {
        console.log('[AI Advisor] Generating report:', { d1, d2, lang, reportType });
        const prompt = buildCompatibilityReportPrompt(d1, d2, lang, reportType);
        
        const insight = await callAI(
          `You are a relationship astrologer generating a ${reportType} report.`,
          prompt,
          process.env
        );
        
        console.log('[AI Advisor] Report generated, length:', insight.length);
        return res.json({ insight, cached: false });
      } catch (aiError) {
        console.error('[AI Advisor] AI generation failed:', aiError.message);
        return res.status(500).json({ error: 'AI generation failed: ' + aiError.message });
      }
    }
    
    // ── 普通合盘洞察（旧逻辑）──
    const cacheKey = `${d1 || ''}|${d2 || ''}|${lang}|${reportType}`;
    const since = new Date(Date.now() - 24*3600*1000).toISOString();

    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

    // ── 检查缓存（直接用 REST API）──
    const cacheRes = await fetch(
      `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&created_at=gte.${since}&select=insight`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    const cached = await cacheRes.json();
    if (cached?.[0]?.insight) {
      return res.json({ insight: cached[0].insight, cached: true });
    }

    const LANG_NAME = {zh:'中文',en:'English',es:'Español',fr:'Français',th:'ภาษาไทย',vi:'Tiếng Việt'};
    const prompt = reportType === 'compatibility'
      ? `分析 ${d1} 和 ${d2} 的命理合盘。必须用 ${LANG_NAME[lang]||'Tiếng Việt'} 输出，温暖、积极的情感解读，禁止输出其他语言，禁止重复塔罗牌名称。数据：${JSON.stringify({d1,d2})}`
      : `分析 ${d1} 的财富格局。必须用 ${LANG_NAME[lang]||'English'} 输出，专业的财富建议，禁止输出其他语言，禁止重复塔罗牌名称。数据：${JSON.stringify({d1,lang})}`

    // ── DeepSeek 直连，失败自动切 Gemini 免费层 ──
    let insight = '';
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (deepseekKey) {
      try {
        const aiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
          body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 800, temperature: 0.35 }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          insight = aiData.choices?.[0]?.message?.content?.trim() || '';
        } else {
          console.warn(`[ai-advisor] DeepSeek failed (${aiRes.status}), falling back to Gemini`);
        }
      } catch (e) {
        console.warn(`[ai-advisor] DeepSeek error: ${e.message}, falling back to Gemini`);
      }
    }

    // Gemini 免费层 fallback
    if (!insight && geminiKey) {
      try {
        const gemRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 800, temperature: 0.35 } }),
          }
        );
        if (!gemRes.ok) throw new Error(`Gemini ${gemRes.status}`);
        const gemData = await gemRes.json();
        insight = gemData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (insight) console.log('[ai-advisor] [OK] Gemini fallback used');
      } catch (e) {
        console.error('[ai-advisor] Gemini fallback failed:', e.message);
      }
    }

    if (!insight) return res.status(500).json({ error: 'All AI providers failed' });

    // ── 写入缓存（直接 REST）──
    await fetch(
      `${SB_URL}/rest/v1/ai_insights_cache`,
      {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ cache_key: cacheKey, insight, prompt_version: `v1.0.0-${reportType || 'single'}-${lang}` })
      }
    );

    res.json({ insight, cached: false });
  } catch (err) {
    console.error('[ai-advisor]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Serve static frontend (dist/) ──
const distPath = join(__dirname, 'web', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && existsSync(join(distPath, 'index.html'))) {
      return res.sendFile(join(distPath, 'index.html'));
    }
    next();
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 🌊 流式输出端点：SSE (Server-Sent Events)
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/wealth-oracle/stream', async (req, res) => {
  // 🛠️ V91+: 出生时间/经纬度/时区（默认 Bangkok 中午）
  const {
    birthDate,
    birthTime = '12:00',
    lat = 13.75,
    lon = 100.5,
    tz = 'Asia/Bangkok',
    lang = 'zh',
    reportType = 'monthly',
  } = req.body;
  console.log(`[wealth-stream] [STREAM] Stream request: ${birthDate}/${lang}/${reportType}`);

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // 🔥 军师缓存键：wealth:{生日}:{语言}:{类型}
  const cacheKey = `wealth:${birthDate}:${lang}:${reportType}`;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  // ═══ 第一道拦截：Cache Hit → 伪流式 ═══
  try {
    if (SB_URL && SB_KEY) {
      const cacheRes = await fetch(
        `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=insight&order=created_at.desc&limit=1`,
        { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
      );
      const cacheRows = await cacheRes.json();
      const cachedText = cacheRows?.[0]?.insight;

      if (cachedText && cachedText.length > 100) {
        console.log(`[wealth-stream] [HIT] Cache HIT: ${cacheKey}, length=${cachedText.length}, starting pseudo-stream`);

        // V97: 即使缓存命中也要过一遍纠正器（astroMatrix 尚不可用，硬定 Cancer Rising）
        const sanitizedCached = final_text_sanitizer(cachedText, 'Cancer');
        const streamText = sanitizedCached !== cachedText ? sanitizedCached : cachedText;
        // 异步写回清洗后的缓存（不阻塞伪流式）
        if (sanitizedCached !== cachedText && SB_URL && SB_KEY) {
          fetch(`${SB_URL}/rest/v1/ai_insights_cache`, {
            method: 'POST',
            headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=ignore-duplicates' },
            body: JSON.stringify({ cache_key: cacheKey, insight: sanitizedCached, prompt_version: `v1.0.0-stream-${reportType}-${lang}`, created_at: new Date().toISOString() })
          }).catch(() => {});
        }

        // 黄金欺骗流：每 15ms 吐 40 字符
        const CHUNK_SIZE = 40;
        const INTERVAL_MS = 15;
        let index = 0;

        const timer = setInterval(() => {
          try {
            if (index >= streamText.length) {
              res.write('data: [DONE]\n\n');
              if (typeof res.flush === 'function') res.flush();
              res.end();
              clearInterval(timer);
              console.log(`[wealth-stream] [OK] Cache pseudo-stream complete, ${streamText.length} chars pushed (sanitized)`);
              return;
            }

            const chunk = streamText.slice(index, index + CHUNK_SIZE);
            res.write(Buffer.from(`data: ${JSON.stringify({ text: chunk })}

`, "utf-8"));
            if (typeof res.flush === 'function') res.flush();
            index += CHUNK_SIZE;
          } catch (e) {
            console.error('[wealth-stream] Cache stream error:', e.message);
            clearInterval(timer);
            try { res.end(); } catch (_e) {}
          }
        }, INTERVAL_MS);

        // 客户端断连清理
        req.on('close', () => {
          clearInterval(timer);
          console.log('[wealth-stream] Client disconnected from cache stream');
        });
        return;
      }
    }
  } catch (e) {
    console.warn('[wealth-stream] Cache check error (fallthrough to AI):', e.message);
  }

  // ═══ 第二道：Cache Miss → 真流式 + 落库 ═══
  console.log(`[wealth-stream] [MISS] Cache MISS: ${cacheKey}, calling DeepSeek...`);

  // 用于缓存落库的全文本收集器
  let fullTextCollector = '';

  // 写缓存辅助函数
  const writeToCache = async (text) => {
    if (!text || text.length < 100 || !SB_URL || !SB_KEY) return;
    try {
      const res2 = await fetch(`${SB_URL}/rest/v1/ai_insights_cache`, {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates'
        },
        body: JSON.stringify({
          cache_key: cacheKey,
          insight: text,
          prompt_version: `v1.0.0-stream-${reportType}-${lang}`,
          created_at: new Date().toISOString(),
        })
      });
      console.log(`[wealth-stream] [WRITE] Cache write: ${cacheKey}, length=${text.length}, status=${res2.status}`);
    } catch (e) {
      console.warn('[wealth-stream] Cache write error:', e.message);
    }
  };

  // 🔧 V32修复: 根据birthDate计算真实星座(之前硬编码'双子座'导致所有用户都是双子座)
  const [_, birthMonth, birthDay] = birthDate.split('-').map(Number);
  const signs = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
  function getZodiacIdx(m, d) {
    const cuts = [[1,20,1],[2,19,2],[3,21,3],[4,20,4],[5,21,5],[6,22,6],[7,23,7],[8,23,8],[9,23,9],[10,24,10],[11,22,11],[12,22,0]];
    for (let i = cuts.length - 1; i >= 0; i--) {
      if (m > cuts[i][0] || (m === cuts[i][0] && d >= cuts[i][1])) return cuts[i][2];
    }
    return 0;
  }
  const realSunSign = signs[getZodiacIdx(birthMonth, birthDay)];

  // ── V69 SwissEph: Fetch computed astro matrix ──
  let astroMatrix = null;
  try {
    astroMatrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz); // 🛠️ V91: 传精确时间/坐标/时区
    if (astroMatrix) {
      console.log(`[wealth-stream] [V69] Got matrix: asc=${astroMatrix.meta?.rising_sign}, lat=${lat}, lon=${lon}`);
    }
  } catch (e) {
    console.warn('[wealth-stream] [V69] Fetch failed, proceeding without V69:', e.message);
  }

  // 🔧 V90: aiTimeout 声明在 try 块外，catch 才能访问
  let aiTimeout;
  try {
    const prompt = buildWealthReportPrompt(birthDate, lang, reportType, {
      dayMaster: '甲',
      wuxing: { '金':1, '木':2, '水':1, '火':1, '土':1 },
      sunSign: realSunSign, // 🔧 V32: 使用真实星座
      hexName: '震',
      cardName: '隐士',
    }, astroMatrix);  // ← Pass V69 matrix to prompt builder

    if (!prompt) {
      res.write(Buffer.from(`data: ${JSON.stringify({ error: 'Invalid reportType' })}

`, "utf-8"));
      return res.end();
    }

    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    // 🔧 V75 fix: 64000 彻底解除年报截断（EN报告需要18000+ tokens完整输出）
    const maxTokens = reportType === 'yearly' ? 64000 : 4000;
    // 🔧 V75 fix: DeepSeek 大输出需要更长超时（AbortController 5分钟）
    // 🔧 V89.1: let 声明让 catch 块也能访问（const block-scoping 跨不过 try→catch）
    const controller = new AbortController();
    // 🔧 V89.1: let 声明让 catch 块也能访问（const block-scoping 跨不过 try→catch）
    try { aiTimeout = setTimeout(() => controller.abort(), 300000); } catch(e){}

    if (!deepseekKey) {
      clearTimeout(aiTimeout);
      res.write(Buffer.from(`data: ${JSON.stringify({ error: 'DEEPSEEK_API_KEY not configured' })}

`, "utf-8"));
      return res.end();
    }

    let aiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: true,
      }),
      signal: controller.signal, // V75: AbortController prevents Railway timeout kill
    });

    clearTimeout(aiTimeout); // V75: AI responded, cancel timeout

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.warn(`[wealth-stream] DeepSeek failed (${aiRes.status}), trying Gemini...`);

      if (geminiKey) {
        try {
          const gemRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt.system + '\n\n' + prompt.user }] }],
                generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
              }),
            }
          );
          if (gemRes.ok) {
            const gemData = await gemRes.json();
            const fullText = gemData.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (fullText) {
              console.log('[wealth-stream] Gemini fallback succeeded, length:', fullText.length);
              for (const char of fullText) {
                res.write(Buffer.from(`data: ${JSON.stringify({ text: char })}

`, "utf-8"));
                fullTextCollector += char;
                if (fullText.indexOf(char) % 10 === 0 && typeof res.flush === 'function') {
                  res.flush();
                }
              }
              // Gemini 也要落库
              if (fullTextCollector.length > 100) {
                writeToCache(fullTextCollector).catch(() => {});
              }
              res.write('data: [DONE]\n\n');
              if (typeof res.flush === 'function') res.flush();
              return res.end();
            }
          }
        } catch (e) {
          console.error('[wealth-stream] Gemini fallback failed:', e.message);
        }
      }

      res.write(Buffer.from(`data: ${JSON.stringify({ error: `DeepSeek error: ${aiRes.status}` })}\n\n`, 'utf-8'));
      return res.end();
    }

    // 🛠️ V73: 真流式 + 后台落库——边收边发，用户体验优先
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let chunkCount = 0;
    // V75: SSE heartbeat every 20s prevents Railway idle timeout (30s limit)
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); if (typeof res.flush === 'function') res.flush(); } catch(e){}
    }, 20000);

    while (true) {
      const { done, value } = await reader.read();
      if (done) { clearInterval(heartbeat); clearTimeout(aiTimeout); break; }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              // 真流式：立即发给前端
              res.write(Buffer.from(`data: ${JSON.stringify({ text: content })}\n\n`, 'utf-8'));
              if (typeof res.flush === 'function' && ++chunkCount % 5 === 0) res.flush();
              // 同时累积到缓存收集器
              fullTextCollector += content;
            }
          } catch (e) {}
        }
      }
    }

    // ── V97 宫位强制纠正器：落库前清洗一遍 ──
    // 注意：sanitized 事件必须在 [DONE] 之前发送
    const ascendant = astroMatrix?.meta?.rising_sign || 'Cancer';
    const sanitizedFull = final_text_sanitizer(fullTextCollector, ascendant);
    // 矫正后有变化，先把矫正版发给前端替换显示
    if (sanitizedFull !== fullTextCollector) {
      try {
        res.write(Buffer.from(`data: ${JSON.stringify({ sanitized: sanitizedFull })}

`, 'utf-8'));
      } catch(e){}
    }
    // 替换收集器内容（让后续逻辑用 sanitized 版本落库）
    fullTextCollector = sanitizedFull;

    // 流式结束，发送 [DONE]（sanitized 在前，[DONE] 在后）
    res.write('data: [DONE]\n\n');
    if (typeof res.flush === 'function') res.flush();

    res.end();

    // 后台落库（不阻塞响应）
    // 年报完成判断：英文用 'Final Wealth Oracle'，中文用 '最终财富神谕'
    const hasFinalOracle = fullTextCollector.includes('Final Wealth Oracle') ||
      fullTextCollector.includes('The Final Wealth Oracle') ||
      fullTextCollector.includes('最终财富神谕');
    const isComplete = reportType === 'yearly'
      ? (hasFinalOracle && fullTextCollector.length > 8000)
      : (fullTextCollector.length > 500);

    if (isComplete && fullTextCollector.length > 100) {
      console.log(`[wealth-stream] [OK] Streaming done, cached ${fullTextCollector.length} chars`);
      writeToCache(fullTextCollector).catch(() => {});
    } else if (fullTextCollector.length > 100) {
      console.log(`[wealth-stream] [WARN] Stream truncated (${fullTextCollector.length} chars), trying to complete...`);
      // 尝试非流式补全并落库
      try {
        const fullRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + deepseekKey },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: prompt.system },
              { role: 'user', content: prompt.user },
            ],
            max_tokens: 48000,
            temperature: 0.7,
          }),
        });
        if (fullRes.ok) {
          const fdata = await fullRes.json();
          const ft = fdata.choices?.[0]?.message?.content || '';
          if (ft && ft.length > fullTextCollector.length) {
            console.log(`[wealth-stream] [OK] Completion success, ${ft.length} chars > ${fullTextCollector.length}, caching full text`);
            writeToCache(ft).catch(() => {});
          } else {
            console.log(`[wealth-stream] [WARN] Completion returned ${ft.length} chars (stream had ${fullTextCollector.length}), caching stream only`);
            writeToCache(fullTextCollector).catch(() => {});
          }
        } else {
          const errBody = await fullRes.text().catch(() => '');
          console.error(`[wealth-stream] [ERROR] Completion failed ${fullRes.status}: ${errBody.slice(0, 200)}`);
          writeToCache(fullTextCollector).catch(() => {});
        }
      } catch (e) {
        console.error('[wealth-stream] 补全失败，落库截断版本:', e.message);
        writeToCache(fullTextCollector).catch(() => {});
      }
    }

  } catch (err) {
    clearTimeout(aiTimeout); // V75: Error or abort, cancel timeout
    try { clearInterval(heartbeat); } catch(e){} // V75: also clear heartbeat
    console.error('[Stream Error]', err.message, '| Stack:', err.stack?.substring(0, 500));
    // 找到出错字符串中第13个字符的值
    const errMsg = err.message;
    console.error('[Stream Error] char13=', errMsg.charCodeAt(13), '| msg_len=', errMsg.length);
    // 尝试写入错误（避免中文导致编码问题）
    const safeErr = err.message.replace(/[^\x00-\x7F]/g, '?');
    try { res.write(Buffer.from(`data: ${JSON.stringify({ error: safeErr })}\n\n`, 'utf-8')); } catch(e) {}
    try { res.end(); } catch(e) {}
  }
});

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[KindredSouls]  Railway server running on port ${PORT}`);
  console.log(`  - API: http://0.0.0.0:${PORT}/api/*`);
  console.log(`  - Web: http://0.0.0.0:${PORT}/`);
});
