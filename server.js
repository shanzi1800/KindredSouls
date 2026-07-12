// KindredSouls Railway Server - V97at
// Serves static frontend + all API routes on port 3000
import express from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getAstroMatrix, buildFactSheet, buildPerMonthData, buildAspectsData, v69HealthCheck } from './v69_client.js';
import { LEXICON } from './lexicon.js';
import { buildAstroTruth, SIGN_ARCHETYPE, getSignToHouseMap, SIGN_ORDER_ZH } from './astro-truth.js';
import { validateAstroLogic } from './astro-validator.js';
import https from 'https';
import { Buffer } from 'buffer';
import { getSystemPromptByLocale } from './src/prompts/loader.js';

// ── safeFetch: 替代全局 fetch，跳过 Node undici ByteString 缺陷 ──
// undici（Node 内置 fetch）在 body/header 含非 ASCII 字符时抛 TypeError:
//   "Cannot convert argument to a ByteString because the character at index X has a value of YYYY"
// ── Latin-1 清洗：Headers 含非 ASCII → 用 ? 替换（防 ByteString 死锁）──
function sanitizeLatin1(v) {
  if (typeof v !== 'string') return String(v);
  let out = '';
  for (let i = 0; i < v.length; i++) {
    const c = v.charCodeAt(i);
    out += c > 255 ? '?' : v[i];
  }
  return out;
}

// ── 全局 env var 污染诊断（启动时打一次）──
(function checkEnvForNonASCII() {
  const dirtyVars = [];
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v !== 'string') continue;
    for (let i = 0; i < v.length; i++) {
      if (v.charCodeAt(i) > 255) {
        // 只记录前 4 个损坏字符的位置
        dirtyVars.push(`${k}[pos=${i}]=${v.charCodeAt(i)}`);
        break;
      }
    }
  }
  if (dirtyVars.length > 0) {
    console.log('[ENV-DIAG] ⚠️ 发现非 ASCII 环境变量★', dirtyVars.join(' | '));
  } else {
    console.log('[ENV-DIAG] ✅ 所有环境变量 ASCII 干净');
  }
})();

// ── V97r: DeepSeek key 从文件读（防 Railway Dashboard 老 key 覆盖）──
function getDeepSeekKey() {
  try {
    if (existsSync('/app/.deepseek-key')) {
      const k = readFileSync('/app/.deepseek-key', 'utf-8').trim();
      if (k.length > 10) return k;
    }
  } catch(e) { /* fall through */ }
  return process.env.DEEPSEEK_API_KEY;
}

// ── V97bd: Supabase keys 从文件读（防 Railway Dashboard 老 key 覆盖，同 DeepSeek 方案）──
try {
  if (existsSync('/app/.supabase-url')) {
    const u = readFileSync('/app/.supabase-url', 'utf-8').trim();
    if (u.length > 10) process.env.SUPABASE_URL = u;
  }
  if (existsSync('/app/.supabase-key')) {
    const k = readFileSync('/app/.supabase-key', 'utf-8').trim();
    if (k.length > 10) process.env.SUPABASE_SERVICE_KEY = k;
  }
} catch(e) { /* fall through */ }

// https.request 直接处理字节流，不受此限制
async function safeFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const method = options.method || 'GET';
    let bodyBuf;
    if (options.body != null) {
      bodyBuf = options.body instanceof Uint8Array ? Buffer.from(options.body) : Buffer.from(options.body);
    }

    // ── Headers 强制 Latin-1 清洗（防 Key 里混入 …）──
    const cleanHeaders = {};
    if (options.headers) {
      for (const [hk, hv] of Object.entries(options.headers)) {
        cleanHeaders[sanitizeLatin1(hk)] = sanitizeLatin1(hv);
      }
    }

    const req = https.request({
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      method,
      headers: cleanHeaders,
      rejectUnauthorized: false,
    }, (res) => {
      const chunks = [];
      let ended = false;
      let waiter = null;

      res.on('data', (chunk) => {
        // 🐛V97r-BUG: 曾经 chunks.push(chunk) + waiter 双发，导致每段 text 发两遍
        if (waiter) {
          const w = waiter; waiter = null;
          w({ done: false, value: new Uint8Array(chunk) });
        } else {
          chunks.push(chunk);
        }
      });
      res.on('end', () => {
        ended = true;
        if (waiter) {
          const w = waiter; waiter = null;
          w({ done: true, value: undefined });
        }
      });

      const response = {
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        headers: res.headers,
        body: {
          getReader() {
            let pos = 0;
            return {
              read() {
                if (pos < chunks.length) {
                  return Promise.resolve({ done: false, value: new Uint8Array(chunks[pos++]) });
                }
                if (ended) return Promise.resolve({ done: true, value: undefined });
                return new Promise((r) => { waiter = r; });
              },
            };
          },
        },
        json: async () => {
          if (!ended) await new Promise((r) => res.once('end', r));
          try { return JSON.parse(Buffer.concat(chunks).toString('utf-8')); }
          catch(e) { throw new Error(`safeFetch json parse error: ${e.message}`); }
        },
        text: async () => {
          if (!ended) await new Promise((r) => res.once('end', r));
          return Buffer.concat(chunks).toString('utf-8');
        },
      };

      resolve(response);
    });

    req.on('error', reject);
    if (options.signal) {
      options.signal.addEventListener('abort', () => req.destroy(), { once: true });
    }
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

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
function stripLoneSurrogates(str) {
  if (!str) return str;
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF) {            // 高代理
      const n = str.charCodeAt(i + 1);
      if (n >= 0xDC00 && n <= 0xDFFF) { out += str[i] + str[i + 1]; i++; } // 合法对→保留
      // 否则半截高代理→丢弃
    } else if (c >= 0xDC00 && c <= 0xDFFF) {     // 半截低代理→丢弃
      /* drop */
    } else {
      out += str[i];
    }
  }
  return out;
}

function final_text_sanitizer(text, ascendant = 'Cancer') {
  if (!text) return text;

  // ── V97ab: 清除 AI 幻觉 [object Object]（只删脏数据，不伤正常星座词）──
  text = text.replace(/\[object Object\]/g, ' ').replace(/\s{2,}/g, ' ');

  // ── V97ap: 清除渲染失败的乱码方块（U+FFFD 和空 Emoji 占位）──
  text = text.replace(/�/g, '').replace(/\uFFFD/g, '').replace(/\s{2,}/g, ' ');

  // ── V97ar: 清理隐身脏字符（Emoji 变体选择符/零宽字符/不可见 Unicode）──
  // U+FE0F → Emoji 变体选择符（表现为不可见方块）
  // U+200B → 零宽空格，U+FEFF → BOM，U+200D → 零宽连字
  text = text.replace(/[\u200B-\u200D\uFE0F\uFEFF\uFFFE\uFFF0-\uFFFF]/g, '');

  // ── V97aq: 12个月太阳星座全面校订（防止AI把本命太阳写成流年太阳）──
  // 流年太阳按公历月份固定：7月巨蟹、8月狮子…6月双子
  text = text
    .replace(/(2026年7月[：:]\s*)太阳(?!巨蟹)[^座\n]*座/g, '$1太阳巨蟹座')
    .replace(/(2026年8月[：:]\s*)太阳(?!狮子)[^座\n]*座/g, '$1太阳狮子座')
    .replace(/(2026年9月[：:]\s*)太阳(?!处女)[^座\n]*座/g, '$1太阳处女座')
    .replace(/(2026年10月[：:]\s*)太阳(?!天秤)[^座\n]*座/g, '$1太阳天秤座')
    .replace(/(2026年11月[：:]\s*)太阳(?!天蝎)[^座\n]*座/g, '$1太阳天蝎座')
    .replace(/(2026年12月[：:]\s*)太阳(?!射手)[^座\n]*座/g, '$1太阳射手座')
    .replace(/(2027年1月[：:]\s*)太阳(?!摩羯)[^座\n]*座/g, '$1太阳摩羯座')
    .replace(/(2027年2月[：:]\s*)太阳(?!水瓶)[^座\n]*座/g, '$1太阳水瓶座')
    .replace(/(2027年3月[：:]\s*)太阳(?!双鱼)[^座\n]*座/g, '$1太阳双鱼座')
    .replace(/(2027年4月[：:]\s*)太阳(?!白羊)[^座\n]*座/g, '$1太阳白羊座')
    .replace(/(2027年5月[：:]\s*)太阳(?!金牛)[^座\n]*座/g, '$1太阳金牛座')
    .replace(/(2027年6月[：:]\s*)太阳(?!双子)[^座\n]*座/g, '$1太阳双子座');

  // ── V97m2: 火星/凯龙/北交点主动过滤（validator 已校验，但 AI 重试仍犯，只能强洗）──
  // 删除整句含"火星在XX座"或"火星在第X宫"的句子（黑天鹅日描述火星相位冲突）
  text = text
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      // 如果行内含"火星在XX座"且紧跟宫位描述，删掉整行
      if (/(?:火星|凯龙|北交点)在[^。\n]{0,20}(?:座|第[一二三四五六七八九十百\d]+宫)/.test(trimmed)) return false;
      // 如果是描述火星相位冲突的行（整段描述火星+土星/天王星冲突）
      if (/火星[^。\n]{0,40}(?:四分|三分|六分|对分|合相).+?(?:土星|天王星)/.test(trimmed)) return false;
      return true;
    })
    .join('\n');

  // ── 通用宫位纠正（治本：按实际上升星座算 Equal House，替代写死 Cancer 映射）──
  // 旧逻辑只对 Cancer 生效且写死映射，导致非 Cancer 用户被错误纠正（如摩羯用户白羊被纠成第10宫）。
  const houseMap = getSignToHouseMap(ascendant);
  if (houseMap) {
    const fixes = [
      { sign: '狮子座', h: houseMap[SIGN_ORDER_ZH.indexOf('狮子座')] },
      { sign: '白羊座', h: houseMap[SIGN_ORDER_ZH.indexOf('白羊座')] },
      { sign: '水瓶座', h: houseMap[SIGN_ORDER_ZH.indexOf('水瓶座')] },
    ];
    for (const f of fixes) {
      text = text.replace(new RegExp(`第(\d+)宫（${f.sign}）`, 'g'), `第${f.h}宫（${f.sign}）`);
      text = text.replace(new RegExp(`${f.sign}在第(\d+)宫`, 'g'), `${f.sign}在第${f.h}宫`);
    }
  }
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


  // 🛡️ V97h2: 防御性清洗——移除编码崩坏的孤立代理对 + U+FFFD 替换符（保留合法 emoji 对）
  text = stripLoneSurrogates(text).replace(/\uFFFD/g, '');
  return text;
}


// DeepSeek Streaming 时常产生「年份重影」：2026年6月2026年6月6月21日
// 本函数暴力清洗所有已知的污染模式
// 🛠️ V97w: 后处理硬替换——逐月检查标题的太阳星座，用锁表修正AI胡编（治本：Prompt锁不住就后门堵死）
function applyMonthLockSanitizer(text, astroMatrix, currentYear = null, currentMonth = null) {
  if (currentYear === null) currentYear = new Date().getFullYear();
  if (currentMonth === null) currentMonth = new Date().getMonth() + 1;
  console.log('[V97w-MARKER] applyMonthLockSanitizer invoked, astroMatrix.months=' + (astroMatrix?.months?.length || 0));
  if (!text || !astroMatrix || !astroMatrix.months) return text;

  const ZH_SIGN = {Aries:'白羊座', Taurus:'金牛座', Gemini:'双子座', Cancer:'巨蟹座', Leo:'狮子座', Virgo:'处女座', Libra:'天秤座', Scorpio:'天蝎座', Sagittarius:'射手座', Capricorn:'摩羯座', Aquarius:'水瓶座', Pisces:'双鱼座'};

  // Build correct entries: [{ key: "2026年7月", sign: "巨蟹座", house: 9 }]
  const entries = [];
  astroMatrix.months.forEach((m, i) => {
    const sun = m.sun || {};
    const signZh = ZH_SIGN[sun.sign] || sun.sign || '';
    const house = sun.house || '';
    const mi = currentMonth - 1 + i;
    const year = currentYear + (mi >= 12 ? 1 : 0);
    const month = (mi % 12) + 1;
    entries.push({ year, month, key: `${year}年${month}月`, sign: signZh, house });
  });

  // Process each month: find the title line and fix the sun sign
  for (const entry of entries) {
    // Target: "2026年7月：太阳[WRONG_SIGN]座[第X宫] · "
    // Replace with: "2026年7月：太阳[CORRECT_SIGN]座第[HOUSE]宫 · "
    const ymEscaped = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match month title y-m：太阳ANYTHING座, e.g.: 2026年7月：太阳水瓶座 ·
    const titleRe = new RegExp(`(${ymEscaped}[：:])太阳[^·座\n]*座`, 'gi');
    text = text.replace(titleRe, (match, prefix) => {
      return `${prefix}太阳${entry.sign}座`;
    });

    // Also fix "太阳进入[WRONG]座" in the body text for same month
    // e.g.: "六月，太阳进入水瓶座" → "六月，太阳进入双子座"
    if (entry.month >= 1 && entry.month <= 12) {
      const monthNames = ['', '一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
      const cnMonth = monthNames[entry.month];
      if (cnMonth) {
        const bodyRe = new RegExp(`(${cnMonth}[，,、\s]{0,5})太阳(?:\s*进入|\s*在|\s*行经|\s*来到|\s*进|\s*抵)[^座\n]*座`, 'gi');
        text = text.replace(bodyRe, (match, prefix) => {
          return `${prefix}太阳进入${entry.sign}座`;
        });
      }
    }
  }

  return text;
}

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
// ── /api/debug-thai-prompt: 检查泰语 system prompt 是否正确加载 ──
app.get('/api/debug-thai-prompt', async (req, res) => {
  try {
    const { buildWealthReportPrompt } = await import('./server.js').catch(() => ({}));
    const thPrompt = await import('./src/prompts/yearlySystemTH.ts').catch(() => null);
    const loader = await import('./src/prompts/loader.js').catch(() => null);
    const sysPrompt = loader?.getSystemPromptByLocale?.('th') || '';
    // Check for problem markers
    const checks = {
      length: sysPrompt.length,
      hasASTRONOMY_MARKER: sysPrompt.includes('[2026-2027 ASTRONOMY FACT SHEET'),
      hasASPECTS_MARKER: sysPrompt.includes('[ASPECTS_DATA]'),
      hasRisingLocal: sysPrompt.includes('__RISING_LOCAL__'),
      hasJupHouse: sysPrompt.includes('__JUP_HOUSE__'),
      hasOBJECT_OBJECT: sysPrompt.includes('[object Object]'),
      first200: sysPrompt.slice(0, 200),
    };
    res.json(checks);
  } catch(e) {
    res.json({ error: e.message });
  }
});

app.get('/api/debug-env', (req, res) => {
  // 🛠️ V100e: 临时加 debug 看实际 prompt 语言
  if (req.query.lang) {
    try {
      const lang = req.query.lang.toString();
      const prompt = buildWealthReportPrompt('1992-12-21', lang, 'yearly', null, null);
      const sys = prompt?.system || '';
      return res.json({
        lang,
        sysLen: sys.length,
        sysFirst300: sys.slice(0, 300),
        sysLast300: sys.slice(-300),
        sysHasChinese: /[\u4E00-\u9FFF]/.test(sys),
        sysHasEnglish: /[A-Za-z]/.test(sys),
        fileSize: readFileSync(__filename).length,
      });
    } catch (e) {
      return res.json({ error: e.message, stack: e.stack?.slice(0, 500) });
    }
  }
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


// ── V98: Supabase连通性诊断端点 ──
app.get('/api/debug-supabase-test', async (req, res) => {
  // https 已在顶部 import
    const tests = [];
  
  // Test 1: 直接 HTTP ping
  const t1 = Date.now();
  try {
    const r1 = await Promise.race([
      new Promise((resolve, reject) => {
        const req = https.request(
          { hostname: 'wfkxqhlcgrikxoofjvas.supabase.co', path: '/', port: 443, method: 'HEAD' },
          (r) => resolve(r.statusCode)
        );
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('timeout')));
        req.setTimeout(5000);
        req.end();
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout 5s')), 5000))
    ]);
    tests.push({ name: 'HTTPS ping', ok: true, status: r1, ms: Date.now() - t1 });
  } catch(e) {
    tests.push({ name: 'HTTPS ping', ok: false, error: e.message, ms: Date.now() - t1 });
  }
  
  // Test 2: REST API with anon key
  const t2 = Date.now();
  try {
    const r2 = await Promise.race([
      new Promise((resolve, reject) => {
        const req = https.request(
          { hostname: 'wfkxqhlcgrikxoofjvas.supabase.co', path: '/rest/v1/ai_insights_cache?cache_key=eq.wealth:1996-01-23:zh:yearly&select=insight&limit=1', port: 443, method: 'GET',
            headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY } },
          (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => resolve({ status: r.statusCode, body: d.slice(0, 200) }));
          }
        );
        req.on('error', reject);
        req.end();
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout 10s')), 10000))
    ]);
    tests.push({ name: 'REST API (anon key)', ok: r2.status === 200, status: r2.status, body: r2.body, ms: Date.now() - t2 });
  } catch(e) {
    tests.push({ name: 'REST API (anon key)', ok: false, error: e.message, ms: Date.now() - t2 });
  }
  
  // Test 3: env vars
  tests.push({ 
    name: 'env vars', 
    SB_URL: !!process.env.SUPABASE_URL, 
    SB_KEY_len: (process.env.SUPABASE_SERVICE_KEY || '').length,
    V69_HOST: process.env.V69_HOST,
    V69_PORT: process.env.V69_PORT,
    DEEPSEEK: !!process.env.DEEPSEEK_API_KEY
  });
  
  res.json({ tests, timestamp: new Date().toISOString() });
  return;
  
  // 试 anon key
    
  const options = {
    hostname: url.hostname, port: 443, path: url.pathname + url.search,
    method: 'GET',
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  };
  
  const p = new Promise((resolve) => {
    const req2 = https.request(options, (r) => {
      let data = '';
      r.on('data', d => data += d);
      r.on('end', () => resolve({ status: r.statusCode, data: data.slice(0, 500) }));
    });
    req2.on('error', e => resolve({ error: e.message }));
    req2.end();
  });
  
  const result = await p;
  res.json(result);
});

app.post('/api/debug-clear-cache', express.json(), async (req, res) => {
  const { cacheKey } = req.body;
  if (!cacheKey) return res.status(400).json({ error: 'cacheKey required' });
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SB_URL || !SB_KEY) return res.status(500).json({ error: 'supabase not configured' });
  try {
    const r = await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}`, {
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
    const delRes = await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}`, {
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
  // V99n: 动态读取 git SHA（而非硬编码死值）
  let gitSha = 'unknown';
  try {
    const { execSync } = require('child_process');
    gitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  } catch(e) {}
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'kindredsouls-api', version: 'v1.0.0-2026-30-TEST-FIX', gitSha, debugBuildTime: 'FRESHBUILD-20260711-1720Z' });
});

// ── Root health check for Railway ──
app.get('/', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'kindredsouls-api' });
});

// ── 确定性种子：从用户 Prompt 中提取生日算 seed，确保同用户出同结果 ──
function seedFromUserPrompt(userPrompt) {
  if (!userPrompt) return 42;
  // 匹配各种格式的出生日期
  const m = userPrompt.match(/birth(?:Date|day)?[=:\s]*['"]?(\d{4})[-年](\d{1,2})[-月](\d{1,2})/i)
    || userPrompt.match(/['"]?(\d{4})[-年](\d{1,2})[-月](\d{1,2})['"]?/);
  if (m) {
    const d = parseInt(m[1]) * 10000 + parseInt(m[2]) * 100 + parseInt(m[3]);
    return d % 2147483647; // DeepSeek seed 最大 int32
  }
  return 42;
}

// ── AI Call Helper (DeepSeek + Gemini fallback) ──
async function callAI(systemPrompt, userPrompt, env, options = {}) {
  const { maxTokens = 4000, reportType = 'monthly' } = options;
  const deepseekKey = getDeepSeekKey();
  const geminiKey = env.GEMINI_API_KEY;

  // Try DeepSeek first
  if (deepseekKey) {
    try {
      const res = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
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
          temperature: 0,
          seed: seedFromUserPrompt(userPrompt),
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
      const res = await safeFetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
          }],
          generationConfig: { maxOutputTokens: 8000, temperature: 0 },
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
  try {

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
    en: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN ENGLISH. Ignore any Chinese text in the system prompt. Write in sophisticated, soul-stirring English. You are a top-tier Western astrologer and Jungian psychologist. Use professional terms (Solar Return, Shadow Self, Synastry Alignment, Jungian Shadow Work, 8th House, 11th House, Square, Trine). ALL OUTPUT MUST BE IN ENGLISH ONLY.',
    es: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN SPANISH. Ignore any Chinese text in the system prompt. Eres un astrólogo de élite y psicólogo junguiano. Usa términos profesionales (Yo Sombra, Retorno Solar, Alineación de Sinastría). Escribe en español sofisticado y místico. TODA LA SALIDA DEBE ESTAR EN ESPAÑOL ÚNICAMENTE.',
    fr: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN FRENCH. Ignore any Chinese text in the system prompt. Vous êtes un maître astrologue parisien et psychologue junguien. Utilisez un ton romantique, philosophique, avec des termes tarologiques classiques et le concept du "Soi" de Jung. Écrivez en français élégant. TOUTE LA SORTIE DOIT ÊTRE EN FRANÇAIS UNIQUEMENT.',
    th: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN THAI. Ignore any Chinese text in the system prompt. คุณคือโหราจารย์ชั้นนำที่ผสมผสานจิตวิทยาคววเจียน ใช้คำที่ศักดิ์สิทธิ์และน่าเคารพ เขียนในภาษาไทยที่ทรงพลัง ผลลัพธ์ทั้งหมดต้องเป็นภาษาไทยเท่านั้น',
    vi: '\n\n[CRITICAL LANGUAGE INSTRUCTION] YOU MUST WRITE THE ENTIRE REPORT IN VIETNAMESE. Ignore any Chinese text in the system prompt. Bạn là một chiêm tinh gia hàng đầu kết hợp tâm lý học Jungian. Viết bằng tiếng Việt trang trọng, mang tính định mệnh. TOÀN BỘ ĐẦU RA PHẢI BẰNG TIẾNG VIỆT CHỈ.',
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
  const aspectsData = astroMatrix ? buildAspectsData(astroMatrix, lang) : '';

  // 🛠️ V97x 治本：代码算死12个月锁死标题（星座+宫位由 SwissEph 算死，AI 只填四字主题）
  const ZH_SIGN_LOCK = {Aries:'白羊座', Taurus:'金牛座', Gemini:'双子座', Cancer:'巨蟹座', Leo:'狮子座', Virgo:'处女座', Libra:'天秤座', Scorpio:'天蝎座', Sagittarius:'射手座', Capricorn:'摩羯座', Aquarius:'水瓶座', Pisces:'双鱼座'};
  const ZH_HOUSE_LOCK = {1:'第1宫',2:'第2宫',3:'第3宫',4:'第4宫',5:'第5宫',6:'第6宫',7:'第7宫',8:'第8宫',9:'第9宫',10:'第10宫',11:'第11宫',12:'第12宫'};
  const lockedTitles = astroMatrix && astroMatrix.months
    ? astroMatrix.months.map((m, i) => {
        const sun = m.sun || {};
        const signZh = ZH_SIGN_LOCK[sun.sign] || sun.sign || '未知座';
        const houseZh = ZH_HOUSE_LOCK[sun.house] || `第${sun.house}宫`;
        const mi = currentMonth - 1 + i;
        const yearPrefix = (currentYear + (mi >= 12 ? 1 : 0)) + '年';
        const monthNum = (mi % 12) + 1;
        return `#### ${yearPrefix}${monthNum}月：太阳${signZh}${houseZh} · __[填四字主题]__`;
      }).join('\n')
    : '';
  const monthLockTable = astroMatrix && astroMatrix.months
    ? '\n⛔ [12个月太阳星座硬锁死表 — 月标题必须精确使用下表数值，严禁篡改]:\n' +
      '所有月份标题的【太阳星座】和【宫位】必须严格按下表。禁止使用其他数据推算月份太阳星座。\n' +
      astroMatrix.months.map((m, i) => {
        const sun = m.sun || {};
        const signZh = ZH_SIGN_LOCK[sun.sign] || sun.sign || '';
        const mi = currentMonth - 1 + i;
        const yearPrefix = (currentYear + (mi >= 12 ? 1 : 0)) + '年';
        const monthNum = (mi % 12) + 1;
        return `  ● ${yearPrefix}${monthNum}月: 太阳${signZh} · 第${sun.house}宫`;
      }).join('\n')
    : '';

  // ═══════════════════════════════════════════════════════════════
  // V99n: 多语言 Prompt 架构重构 - 独立语种 Map
  // 彻底根除语种混淆，为全球化铺平道路
  // ═══════════════════════════════════════════════════════════════
  
  // 根据用户语言动态加载纯净系统提示词
  const YEARLY_SYSTEM = {
    zh: getSystemPromptByLocale('zh'),
    en: getSystemPromptByLocale('en'),
    fr: getSystemPromptByLocale('fr'),
    es: getSystemPromptByLocale('es'),
    th: getSystemPromptByLocale('th'),
    vi: getSystemPromptByLocale('vi'),
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
    // ── V97f: 后端天文真值引擎（治本：算死流月太阳/外行星/原型字典，AI 只准抄录）──
    const risingSignZH = astroMatrix?.meta?.rising_sign || 'Cancer';
    const astroTruth = buildAstroTruth(birthDate, risingSignZH, lang, currentYear, currentMonth);
    const archetypeDict = SIGN_ARCHETYPE[lang] || SIGN_ARCHETYPE.zh;
    const astroTruthBlock = `
⛔ [ASTRO-LOGIC HARD TRUTH — 后端算死，AI 必须原样抄录，不得自行推算或改写]：
【流月太阳真值表（12个月，逐月锁定，不得改写宫位或星座）】
${astroTruth.monthlyTruthText}
【外行星年度主题（2026-2027 固定天文事实，全年唯一，不得变更）】
• 木星在${astroTruth.outerPlanets.jupiter.signZH}第${astroTruth.outerPlanets.jupiter.house}宫
• 土星在${astroTruth.outerPlanets.saturn.signZH}第${astroTruth.outerPlanets.saturn.house}宫
• 冥王星在${astroTruth.outerPlanets.pluto.signZH}第${astroTruth.outerPlanets.pluto.house}宫
【12星座原型字典（描写X座必须用此精确描述，严禁张冠李戴/星座夺舍）】
${Object.entries(archetypeDict).map(([k, v]) => `• ${k}：${v}`).join('\n')}
`;
    const PLUTO_IRON = {
      zh: '\n\n[冥王星天文铁律 - PLUTO IRON RULE]: 冥王星（Pluto）已于2024年进入水瓶座（Aquarius），停留至2043年。2026-2027年报中冥王星绝对位于第8宫水瓶座，绝不可写摩羯座（Capricorn）！所有语言 Pluto 必须写 Aquarius/水瓶座。',
      en: '\n\n[PLUTO ASTRONOMY IRON RULE]: Pluto entered Aquarius in 2024 and remains until 2043. In 2026-2027 reports Pluto MUST be in Aquarius (8th House). NEVER write Capricorn for Pluto in any language!',
      es: '\n\n[REGLA DE HIERRO DE PLUTÓN]: Plutón entró en Acuario en 2024 y permanece hasta 2043. En informes 2026-2027 Plutón DEBE estar en Acuario. ¡NUNCA escribas Capricornio para Plutón!',
      fr: '\n\n[RÈGLE DE PLUTON]: Pluton est entré en Verseau en 2024 et y reste jusqu\'en 2043. Dans les rapports 2026-2027 Pluton DOIT être en Verseau. N\'écrivez jamais Capricorne pour Pluton !',
      th: '\n\n[กฎเหล็กดาวพลูโต]: ดาวพลูโตเข้าสู่ราศีกุมภ์ในปี 2024 และจะอยู่ถึง 2043 ในรายงาน 2026-2027 ดาวพลูโตต้องอยู่ราศีกุมภ์ ห้ามเขียนราศีมังกรสำหรับดาวพลูโต',
      vi: '\n\n[QUY TẮC SẮT DIÊM VƯƠNG]: Sao Diêm Vương đã vào Bảo Bình năm 2024 và ở đó đến 2043. Trong báo cáo 2026-2027 Sao Diêm Vương PHẢI ở Bảo Bình. Tuyệt đối không viết Ma Kết cho Sao Diêm Vương!'
    };
    let yearlySystem = (YEARLY_SYSTEM[lang] || YEARLY_SYSTEM.zh) + (PLUTO_IRON[lang] || PLUTO_IRON.zh);

    // ── V97at: 注入 [ASPECTS_DATA] 块 ──
    if (aspectsData) {
      yearlySystem = aspectsData + '\n' + yearlySystem;
      console.log('[V97at] ASPECTS_DATA injected with real SwissEph aspects');
    }

    // ── V97 TDZ FIX: placeholder replacement REMOVED from here (was in TDZ zone) ──
    // ── it is re-inserted AFTER variable assignment (see below, before V89) ──

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
    let natalSunSign = '', natalSunSignEN = '', risingLocal = '', jupSignLocal = '', satSignLocal = '', moonSignLocal = '';
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
      moonSignLocal = signMap[first.moon?.sign] || first.moon?.sign || 'Cancer';

      // 🌐 6语言 STRICT HOUSE LOCK 模板
      const locks = {
        vi: `⛔ [QUY TẮC CUNG ĐỊA BÀN BẮT BUỘC] — Dữ liệu từ AstroMatrix + computed_houses.json ⛔

⛔ BẮT BUỘC: Khi viết về nhà của Sao Mộc/Sao Thổ/Sao Diêm Vương, BẮT BUỘC phải dùng số nhà từ khối JSON [COMPUTED_HOUSES] trong FACT SHEET. Không viết 'Nhà 5' cho Sư Tử trừ khi [COMPUTED_HOUSES] nói vậy.
\n\n📛 THÔNG TIN BẢN NGÃ (CẤM DÙNG DỮ LIỆU NGƯỜI KHÁC):\n• Mặt Trời = ${natalSunSign} (SUN SIGN CỦA NGƯỜI DÙNG NÀY, ngày sinh ${birthDate})\n• Mọi câu 'Hỡi người con của X' phải dùng ${natalSunSign} — KHÔNG ĐƯỢC dùng cung khác\n\n📍 Dựa trên Ascendant = __RISING_LOCAL__ (Equal House tính từ ngày sinh), các hành tinh BẮT BUỘC phải viết đúng cung sau:\n• Sao Mộc tại ${jupSignLocal} = Nhà ${jupHouse}\n• Sao Thổ tại ${satSignLocal} = Nhà ${satHouse}\n• Sao Diêm Vương tại Bảo Bình = Nhà ${plHouse}\n• Mặt Trời = Nhà ${sunHouse}\n• Mặt Trăng = Nhà ${moonHouse}\n\n⛔ CẤM TUYỆT ĐỐI:\n- Tự suy luận cung từ chòm sao (PHẢI dùng dữ liệu trên)\n- Dùng Bản Đồ Whole Sign — SAI\n- Viết Sao Mộc = Nhà 5 (phải là Nhà ${jupHouse})\n- Viết Sao Thổ = Nhà 11 (phải là Nhà ${satHouse})\n- Viết Sao Diêm Vương = Nhà 3 hoặc Nhà 11 (phải là Nhà ${plHouse})\n- Viết 'Mặt Trời Song Tử' nếu người dùng sinh tháng 10 (PHẢI là ${natalSunSign})`,
        th: `⛔ [กฎเหล็กเรือนดาราศาสตร์] — ข้อมูลจาก AstroMatrix + computed_houses.json ⛔

⛔ บังคับ: เมื่อเขียนเรือนของดาวพฤหัสบดี/ดาวเสาร์/ดาวพลูโต ต้องใช้หมายเลขเรือนจากบล็อก JSON [COMPUTED_HOUSES] ใน FACT SHEET ข้างบน ห้ามเขียน 'เรือนที่ 5' สำหรับราศีสิงห์ หาก [COMPUTED_HOUSES] ไม่ได้บอก!
\n\n📛 ข้อมูลส่วนตัว (ห้ามใช้ข้อมูลผู้ใช้อื่น):\n• ดวงอาทิตย์ = ${natalSunSign} (ดวงอาทิตย์ของผู้ใช้นี้, เกิดวันที่ ${birthDate})\n• ทุกข้อความ 'โอ้บุตรแห่งราศี X' ต้องใช้ ${natalSunSign} — ห้ามใช้ราศีอื่น\n\n📍 อ้างอิง Ascendant = __RISING_LOCAL__ (Equal House คำนวณจากวันเกิดจริง), ดาวเหล่านี้ต้องเขียนเรือนให้ถูกต้อง:\n• ดาวพฤหัสบดีที่ ${jupSignLocal} = ภพที่ ${jupHouse}\n• ดาวเสาร์ที่ ${satSignLocal} = ภพที่ ${satHouse}\n• ดาวพลูโตที่ กุมภ์ = ภพที่ ${plHouse}\n• ดวงอาทิตย์ = ภพที่ ${sunHouse}\n• ดวงจันทร์ = ภพที่ ${moonHouse}\n\n⛔ ห้ามเด็ดขาด:\n- อนุมานเรือนจากราศี (ต้องใช้ข้อมูลข้างบน)\n- ใช้แผนที่ Whole Sign\n- เขียนภพที่ผิด\n- เขียน 'ดวงอาทิตย์ราศีเมถุน' ให้ผู้ใช้ที่เกิดเดือนตุลาคม (ต้องเป็น ${natalSunSign})`,
        zh: `⛔ [宫位铁律] — 数据来自 AstroMatrix ⛔\n\n📛 个人信息强制（禁止用别人数据）:\n• 太阳 = ${natalSunSign} (本用户的太阳星座, 生日 ${birthDate})\n• 所有 'X座之人' 必须用 ${natalSunSign} — 不得用其他星座\n\n📍 基于上升星座 = __RISING_LOCAL__ (Equal House 从生日计算), 行星必须使用以下精确宫位:\n• 木星在 ${jupSignLocal} = 第 ${jupHouse} 宫\n• 土星在 ${satSignLocal} = 第 ${satHouse} 宫\n• 冥王星在水瓶座 = 第 ${plHouse} 宫\n• 太阳 = 第 ${sunHouse} 宫\n• 月亮 = 第 ${moonHouse} 宫\n\n⚠️ 强制引用规则：全文所有涉及木星/土星/冥王星/太阳的宫位描写，必须引用 [COMPUTED_HOUSES] JSON 块里的精确 house 数值！\n  禁止：看到"狮子座"就写第5宫、看到"白羊座"就写第1宫、看到"水瓶座"就写第11宫。\n  正确：以 [COMPUTED_HOUSES] JSON 里的 computed_house 数值为准。\n\n⛔ 严禁:\n- 从星座推算宫位（必须用上面数据）\n- 使用 Whole Sign 全星座制\n- 写错宫位\n- 写'太阳在双子座'给10月生日的用户（必须用 ${natalSunSign}）`,
        en: `⛔ [HOUSE MAPPING IRON RULE] — Data from AstroMatrix ␦ STRICTLY VERIFIED ␦\n\n📛 PERSONAL IDENTITY (do NOT use other users' data):\n• Sun = ${natalSunSignEN} (this user's Sun Sign, birth date ${birthDate})\n• All 'O child of X' must use ${natalSunSignEN} — NOT other signs\n\n📍 Based on Ascendant = __RISING_LOCAL__ (Equal House from birth date), planets MUST use these exact houses:\n• Jupiter in ${jupSignLocal} = House ${jupHouse}\n• Saturn in ${satSignLocal} = House ${satHouse}\n• Pluto in Aquarius = House ${plHouse}\n• Sun = House ${sunHouse}\n• Moon = House ${moonHouse}\n\n⛔ STRICTLY FORBIDDEN:\n- Inferring houses from signs (USE THE DATA ABOVE)\n- Using Whole Sign house system\n- Writing Jupiter = House 5 (must be House ${jupHouse})\n- Writing Saturn = House 11 (must be House ${satHouse})\n- Writing 'Sun in Gemini' for an October-born user (MUST be ${natalSunSignEN})`,
        es: `⛔ [REGLA DE HIERRO DE CASAS] — Datos de AstroMatrix + computed_houses.json ⛔

⛔ OBLIGATORIO: Al escribir sobre las casas de Júpiter/Saturno/Plutón, DEBES usar el número de casa del bloque JSON [COMPUTED_HOUSES] en la FACT SHEET. No escribir 'Casa 5' para Leo sin que [COMPUTED_HOUSES] lo indique.
\n\n📛 IDENTIDAD PERSONAL (no usar datos de otros usuarios):\n• Sol = ${natalSunSign} (el Sol de ESTE usuario, fecha de nacimiento ${birthDate})\n• Todo 'Oh hijo de X' debe usar ${natalSunSign} — NO otros signos\n\n📍 Basado en Ascendente = __RISING_LOCAL__ (Equal House desde fecha de nacimiento), los planetas DEBEN usar estas casas exactas:\n• Júpiter en ${jupSignLocal} = Casa ${jupHouse}\n• Saturno en ${satSignLocal} = Casa ${satHouse}\n• Plutón en Acuario = Casa ${plHouse}\n• Sol = Casa ${sunHouse}\n• Luna = Casa ${moonHouse}\n\n⛔ ESTRICTAMENTE PROHIBIDO:\n- Inferir casas desde signos (usar datos arriba)\n- Usar sistema Whole Sign\n- Escribir Júpiter = Casa 5 (debe ser Casa ${jupHouse})\n- Escribir 'Sol en Géminis' para usuarios nacidos en octubre (DEBE ser ${natalSunSign})`,
        fr: `⛔ [RÈGLE DE FER DES MAISONS] — Données d'AstroMatrix + computed_houses.json ⛔

⛔ OBLIGATOIRE: En écrivant sur les maisons de Jupiter/Saturne/Pluton, vous DEVEZ utiliser le numéro de maison du bloc JSON [COMPUTED_HOUSES] dans la FACT SHEET. Ne pas écrire 'Maison 5' pour Léo sans que [COMPUTED_HOUSES] l'indique.
\n\nBasé sur Ascendant = __RISING_LOCAL__ (Equal House depuis date de naissance), les planètes DOIVENT utiliser ces maisons exactes:\n• Jupiter en ${jupSignLocal} = Maison ${jupHouse}\n• Saturne en ${satSignLocal} = Maison ${satHouse}\n• Pluton en Verseau = Maison ${plHouse}\n• Soleil = Maison ${sunHouse}\n• Lune = Maison ${moonHouse}\n\n⛔ STRICTEMENT INTERDIT:\n- Inférer les maisons depuis les signes\n- Utiliser le système Whole Sign\n- Écrire Jupiter = Maison 5 (doit être Maison ${jupHouse})`
      };
      houseLock = locks[lang] || locks.en;
      console.log(`[V82] houseLock built for ${lang}: Jup=${jupHouse}, Sat=${satHouse}, Pluto=${plHouse}, Sun=${sunHouse}, Rising=${risingLocal}`);
    }

    // V97ac: V69 Python引擎失败时（astroMatrix=null），risingLocal为空 → fallback为太阳星座
    if (!risingLocal) {
      const SUN_ZH_FB = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
      const sunIdx = getNatalSunSign(birthDate);
      risingLocal = SUN_ZH_FB[sunIdx] || '天蝎座';
      console.warn(`[V97ac] V69 failed, risingLocal fallback → ${risingLocal}`);
    }

    // ── V97 TDZ FIX: placeholder replacement (runs AFTER all vars assigned, safe) ──
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
      .replace(/__NATAL_SUN_EN__/g, natalSunSignEN)
      .replace(/__NATAL_SUN__/g, natalSunSign)
      .replace(/__SUN_HOUSE_NUM__/g, String(sunHouse))
      .replace(/__LOCKED_TITLES_BLOCK__/g, lockedTitles);
    if (!lockedTitles) {
      console.warn('[V97x] lockedTitles empty — astroMatrix.months missing, AI may hallucinate month titles');
    } else {
      console.log('[V97x] lockedTitles injected, 12 titles locked');
    }

    // ⛔ V89: 注入强制头部模板到 system prompt（system > user 层级更高）
    // ── V97h: 本命太阳星座头部锁（全语言，治本：zh/en/es/fr/th/vi 均强制锁死本命太阳，防止 AI 幻觉改写头部元数据）──
    const HE_MAP = {
      zh: `\n\n⛔ [强制头部值 — 不得更改，原样抄录]:\n本用户的本命太阳星座是 ${natalSunSign}（由出生日期 ${birthDate} 经天文计算确定，绝对正确）。\n你的输出头部【元数据】必须精确使用:\n🌌 年度星盘: ${natalSunSign} · 太阳回归年\n🗝️ 核心本命代码: 太阳${natalSunSign}...\n所有 'X座之人' 必须用 ${natalSunSign}，绝对不得输出其他星座。\n若头部元数据出现错误的太阳星座（如写成'双子座'），生成将被拒绝！`,
      en: `\n\n⛔ [MANDATORY HEADER — DO NOT CHANGE, COPY VERBATIM]:\nThe user's Natal Sun Sign is ${natalSunSignEN} (Swiss Ephemeris, birth date ${birthDate}).\nYOUR HEADER MUST use exactly:\n🌌 Annual Solar Chart: ${natalSunSignEN} · Solar Return\n🗝️ Core Natal Code: Sun ${natalSunSignEN}...\nAll 'O child of X' MUST use ${natalSunSignEN} — NEVER other signs.\nIf the header contains a WRONG Sun Sign, generation will be REJECTED!`,
      es: `\n\n⛔ [CABECERA OBLIGATORIA — NO CAMBIAR, COPIAR VERBATIM]:\nEl Signo Solar Natal del usuario es ${natalSunSign} (Efemérides Suizas, fecha ${birthDate}).\nTU CABECERA DEBE usar exactamente:\n🌌 Carta Solar Anual: ${natalSunSign} · Retorno Solar\n🗝️ Código Natal Central: Sol ${natalSunSign}...\nTodo 'Hijo de X' DEBE usar ${natalSunSign} — NUNCA otros signos.\nSi la cabecera contiene un Signo Solar ERRÓNEO, la generación será RECHAZADA!`,
      fr: `\n\n⛔ [EN-TÊTE OBLIGATOIRE — NE PAS CHANGER, COPIER VERBATIM]:\nLe Signe Solaire Natal de l'utilisateur est ${natalSunSign} (Éphémérides Suisses, date ${birthDate}).\nTON EN-TÊTE DOIT utiliser exactement:\n🌌 Thème Solaire Annuel: ${natalSunSign} · Retour Solaire\n🗝️ Code Natal Central: Soleil ${natalSunSign}...\nTout 'Enfant de X' DOIT utiliser ${natalSunSign} — JAMAIS d'autres signes.\nSi l'en-tête contient un Signe Solaire ERRONÉ, la génération sera REJETÉE!`,
      th: `\n\n⛔ [ส่วนหัวบังคับ — ห้ามเปลี่ยน คัดลอกตรงๆ]:\nดวงอาทิตย์ประจำตัวของผู้ใช้คือ ${natalSunSign} (Efemerides Suizas, วันเกิด ${birthDate}).\nส่วนหัวของคุณต้องใช้ตรงๆ:\n🌌 เวลาราศีประจำปี: ${natalSunSign} · การกลับมาของดวงอาทิตย์\n🗝️ รหัสดวงชะตาแกนกลาง: ดวงอาทิตย์${natalSunSign}...\nทุกคำว่า 'โอ้บุตรแห่งราศี X' ต้องใช้ ${natalSunSign} — ห้ามใช้ราศีอื่น.\nหากส่วนหัวมีราศีดวงอาทิตย์ผิด การสร้างจะถูกปฏิเสธ!`,
      vi: `\n\n⛔ [MANDATORY HEADER — DO NOT CHANGE, COPY VERBATIM]:\nThe user's Natal Sun Sign is ${natalSunSign} (Swiss Ephemeris, birth date ${birthDate}).\nYOUR HEADER MUST use exactly:\n🌌 Bảng Vận Niên: ${natalSunSign} · Năm Cách Mạng Mặt Trời\n🗝️ Mã Bản Đồ Sao Chính: Mặt Trời ${natalSunSign}...\nAll 'O child of X' MUST use ${natalSunSign} — NEVER other signs.\nIf header contains wrong Sun Sign, generation will be REJECTED!`,
    };
    yearlySystem += (HE_MAP[lang] || HE_MAP.en);

    return {
      system: yearlySystem,
      user: `
⛔ [天文真值铁律]: 只准使用 AstroMatrix 提供的外行星数据（木星/土星/冥王星/太阳/月亮）。未提供的行星（火星/凯龙/北交点等）不得写具体星座或宫位，只能描述原型特质（"行动力强"/"开创精神"），禁止"火星在XX座"或"火星在第X宫"。⛔ [火星/凯龙禁则]: 绝对禁止在财富年报中写"火星在XX座"或"火星在第X宫"。行星只有木星/土星/冥王星/太阳/月亮参与了2026-2027年度财富叙事。
⛔ [缝合怪禁则]: 绝对禁止将两个星座名直接连接（如"处女座金牛座"、"双子座白羊座"）。每段只描述一个星座，宫位从 AstroMatrix 的 computed_houses 引用，不得自创。
⛔ [月内宫位一致性]: 同一月内太阳描述必须唯一（如5月=金牛座，不得同时说双子座）。若发现矛盾，以流月数据为准。
⛔ [本命盘 vs Transit 严格区分 — 核心区分规则]:
本报告包含两类本质不同的占星数据：
【本命盘固定数据】由出生日期算死，绝不随月份变化：
  - 太阳星座 = ${natalSunSign}（如：太阳水瓶座）
  - 太阳宫位 = 第${sunHouse}宫（请勿写成"点亮第1宫"或"落在第X宫"）
  - 上升星座 = __RISING_LOCAL__
  - 木星 = ${jupSignLocal}座第${jupHouse}宫
  - 土星 = ${satSignLocal}座第${satHouse}宫
  - 冥王星 = 水瓶座第${plHouse}宫
【Transit 流月数据】随月份变化，由 [P1.1 SWISSEPH PER-MONTH TRUTH DATA] 提供：
  - 例：2026年7月Transit太阳 = 巨蟹座；2027年6月Transit太阳 = 双子座
  - Transit数据仅在当月正文内有效，禁止跨月引用
【绝对禁止】：
  1. 将 Transit 月份的太阳星座写成"你的太阳是XX座"（那是本命太阳，已锁死）
  2. 将2月Transit水瓶座写成"本命太阳水瓶座的能量"（本命太阳永远不变）
  3. 在任何月份正文里写"太阳水瓶点亮你的第1宫"（本命太阳在第${sunHouse}宫，不是第1宫）
  4. 将某月的 Transit 星座（如2月水瓶座）的内容复制到其他月份

例如：对于1996-01-23的用户，Transit太阳2月=水瓶座≠本命太阳水瓶在第4宫（不是第1宫）。写2月正文只能说Transit水瓶座，不得写"点亮第1宫"。
— AI MUST output the five chapter headings explicitly using '第X章' (中文) / 'Chapter X' (英文) format, e.g. '第一章：年度财富矩阵', '第二章：365天月度收入矩阵', '第三章：命运职业路径', '第四章：债务与风险护盾', '第五章：神谕显化仪式'. These headings are REQUIRED — the frontend renders them as gold chapter cards. 绝对禁止写成'第X节'或'Section X'。

Generate a ${lang} ultra-premium yearly wealth almanac for birth date ${birthDate}.

⛔ [CRITICAL — DO NOT COMPUTE SUN SIGN]: The user's Natal Sun Sign has been pre-computed by Swiss Ephemeris and provided in the [HOUSE MAPPING IRON RULE] section above. The per-month data below is TRANSIT data for the 12 forecast months — NOT natal chart data. DO NOT use transit Sun positions to compute or replace the user's natal Sun Sign. If the Sun Sign is explicitly stated above, USE THAT VALUE. In output, include the header 'Bảng Vận Niên: {natalSunSign} · Năm Cách Mạng Mặt Trời' and 'Mã Bản Đồ Sao Chính: Mặt Trời {natalSunSign}' using the exact natalSunSign value, NOT computed from transit data.

[P1.1 SWISSEPH PER-MONTH TRUTH DATA — DO NOT ALTER]:
All planet positions, houses, and aspects below are COMPUTED by Swiss Ephemeris.
Use this data DIRECTLY. Do NOT recalculate, re-assign houses, or invent positions.
${perMonthData || '    [SwissEph data unavailable — use your best astrological judgement]'}
${monthLockTable}

${astroTruthBlock}

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

  } catch (e) {
    throw e;
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
    const insRes = await safeFetch(
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
    const cacheKey = `wealth:v99:${birthDate}:${lang}:${reportType}`;
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

    // ═══ 第一道拦截：Cache Hit ═══
    if (SB_URL && SB_KEY && reportType !== 'oracle') {
      try {
        const cacheRes = await safeFetch(
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
        let prompt;
        try {
          prompt = buildWealthReportPrompt(birthDate, lang, reportType, {
          dayMaster: dTGDisplay,
          wuxing,
          sunSign,
          hexName,
          cardName,
        }, astroMatrix);
        } catch (promptErr) {
          console.error('[Wealth Oracle] buildWealthReportPrompt CRASHED:', promptErr.message);
          console.error('[Wealth Oracle] Stack:', promptErr.stack);
          return res.status(500).json({ success: false, error: 'Prompt construction failed: ' + promptErr.message });
        }

        if (!prompt) {
          return res.status(400).json({ success: false, error: 'Invalid reportType' });
        }

        const maxTokens = reportType === 'yearly' ? 48000 : 4000;
        const ascendant = astroMatrix?.meta?.rising_sign || 'Cancer';

        // ── V97f: Astro-Logic Validator 断路器（通不过熔断重调，最多3次）──
        let aiResult = null;
        let _lastRaw = null;
        if (reportType === 'yearly') {
          const astroTruth = buildAstroTruth(birthDate, ascendant, lang, new Date().getFullYear(), new Date().getMonth() + 1);
          const MAX_RETRY = 3;
          for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
            const r = await callAI(prompt.system, prompt.user, process.env, { maxTokens, reportType });
            _lastRaw = r;
            const v = validateAstroLogic(r, astroTruth, lang);
            if (v.pass) { aiResult = r; break; }
            console.warn(`[Validator] yearly attempt ${attempt + 1}/${MAX_RETRY} FAILED:`, v.errors);
          }
          if (!aiResult) {
            console.error('[Validator] yearly 所有重试均失败，降级交付（含潜在逻辑错误）');
            aiResult = _lastRaw;
          }
        } else {
          aiResult = await callAI(prompt.system, prompt.user, process.env, { maxTokens, reportType });
        }

        // ── V97 宫位强制纠正器（铁血断路）──
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
            await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache`, {
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
    const r = await safeFetch(
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
    const cacheRes = await safeFetch(
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
    const deepseekKey = getDeepSeekKey();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (deepseekKey) {
      try {
        const aiRes = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
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
        const gemRes = await safeFetch(
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
    await safeFetch(
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
  // 🛠️ V97r 部署验证标识：真生产 KindredSouls 日志里看到这个 = V97r 代码已生效
  console.log('[V97r-DEPLOY-MARKER] stream endpoint hit, body-encoding=TextEncoder');

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
  const cacheKey = `wealth:v99:${birthDate}:${lang}:${reportType}`;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

  // ═══ 第一道拦截：Cache Hit → 伪流式 ═══
  try {
    if (SB_URL && SB_KEY) {
      const cacheRes = await safeFetch(
        `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=insight&order=created_at.desc&limit=1`,
        { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
      );
      const cacheRows = await cacheRes.json();
      const cachedText = cacheRows?.[0]?.insight;

      if (cachedText && cachedText.length > 100) {
        // ── V98: 缓存命中 → 纠正后直接秒回完整内容（不再伪流式）──
        console.log(`[wealth-stream] [HIT] Cache HIT: ${cacheKey}, length=${cachedText.length}, instant response`);
        // V99c: 缓存命中直接返回原始内容，跳过 sanitizer（避免删除大量行导致截断）
        const streamText = cachedText;
        // 一次性发送完整内容（避免分块被 Railway 代理截断）
        res.write(Buffer.from(`data: ${JSON.stringify({ text: streamText })}\n\n`, 'utf-8'));
        if (typeof res.flush === 'function') res.flush();
        res.write('data: [DONE]\n\n');
        if (typeof res.flush === 'function') res.flush();
        res.end();
        console.log(`[wealth-stream] [OK] Cache instant complete, ${streamText.length} chars`);
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
      // 🛠️ V98k: 写入前先删除该 cache_key 旧记录，避免多条脏数据堆积（无 UNIQUE 约束时尤其关键）
      await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}`, {
        method: 'DELETE',
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
      });
      const res2 = await safeFetch(`${SB_URL}/rest/v1/ai_insights_cache`, {
        method: 'POST',
        headers: {
          'apikey': SB_KEY,
          'Authorization': `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
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

    // ── V97r: prompt 脏字符清洗（… → ...，防 ByteString 死锁）──
    if (prompt) {
      prompt.system = prompt.system.replace(/[\u2026]/g, '...');
      prompt.user = prompt.user.replace(/[\u2026]/g, '...');
    }

    if (!prompt) {
      res.write(Buffer.from(`data: ${JSON.stringify({ error: 'Invalid reportType' })}

`, "utf-8"));
      return res.end();
    }

    const deepseekKey = getDeepSeekKey();
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

    let aiRes = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekKey}`,
      },
      body: new TextEncoder().encode(JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        max_tokens: maxTokens,
        temperature: 0,
        seed: seedFromUserPrompt(prompt.user),
        stream: true,
      })),
      signal: controller.signal, // V75: AbortController prevents Railway timeout kill
    });

    clearTimeout(aiTimeout); // V75: AI responded, cancel timeout

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.warn(`[wealth-stream] DeepSeek failed (${aiRes.status}), trying Gemini...`);

      if (geminiKey) {
        try {
          const gemRes = await safeFetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: new TextEncoder().encode(JSON.stringify({
                contents: [{ parts: [{ text: prompt.system + '\n\n' + prompt.user }] }],
                generationConfig: { maxOutputTokens: maxTokens, temperature: 0 }
              })),
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

    // V99e: 跳过 sanitizer（避免删除大量行导致前端截断）
    // SwissEph V69 已提供真数据，无需后处理矫正
    const sanitizedFull = fullTextCollector;


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
        const fullRes = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + deepseekKey },
          body: new TextEncoder().encode(JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: prompt.system },
              { role: 'user', content: prompt.user },
            ],
            max_tokens: 48000,
            temperature: 0,
            seed: seedFromUserPrompt(prompt.user),
          })),
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

// ── /api/debug-dump-cache ── 只读诊断：返回某 cache_key 的所有记录（时间+版本，不含正文避免超长）
app.get('/api/debug-dump-cache', async (req, res) => {
  const cacheKey = req.query.cacheKey || req.query.key;
  if (!cacheKey) return res.status(400).json({ error: 'cacheKey required' });
  try {
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    const r = await safeFetch(
      `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=created_at,prompt_version&order=created_at.desc`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    const rawRows = await r.json();
    const rows = Array.isArray(rawRows) ? rawRows : [];
    const cRes = await safeFetch(
      `${SB_URL}/rest/v1/ai_insights_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=count`,
      { headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` } }
    );
    const cRaw = await cRes.json();
    const count = (Array.isArray(cRaw) && cRaw[0] && cRaw[0].count) ? cRaw[0].count : rows.length;
    res.json({ cacheKey, status: r.status, ok: r.ok, isArray: Array.isArray(rawRows), count, rows: rows.slice(0, 20) });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[KindredSouls]  Railway server running on port ${PORT}`);
  console.log(`  - API: http://0.0.0.0:${PORT}/api/*`);
  console.log(`  - Web: http://0.0.0.0:${PORT}/`);
});
// FORCE REBUILD 1783756900
