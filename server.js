// KindredSouls Railway Server - V116bc (FORCE REBUILD 1783756901)
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
import { exec } from 'child_process';

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

// ── V116: Gemini key 从文件读（防 Railway Dashboard 覆盖）──
function getGeminiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10) return process.env.GEMINI_API_KEY;
  try {
    if (existsSync('/app/.gemini-key')) {
      const k = readFileSync('/app/.gemini-key', 'utf-8').trim();
      if (k.length > 10) return k;
    }
  } catch(e) { /* fall through */ }
  return null;
}

// ── DeepSeek 直连流式（OpenAI 兼容格式，SSE 逐字吐出）──
// 🛠️ V131: Node.js 原生 fetch 流式（Railway 实测 https.request 在流式场景丢数据，fetch 完美）
async function callDeepSeekStream(systemText, userText, controller, res, onChunk, astroMatrix, realSunSign, lang) {
  console.log('[callDeepSeek] START, res.type=', typeof res, 'res.write=', typeof res?.write, 'res.flush=', typeof res?.flush);
  const deepseekKey = getDeepSeekKey();
  let resp;
  try {
    console.log('[callDeepSeek] → api.deepseek.com (native fetch)');
    resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }], max_tokens: 48000, temperature: 0, stream: true }),
      signal: controller.signal,
    });
    console.log('[callDeepSeek] HTTP', resp.status);
  } catch(e) { console.error('[callDeepSeek] fetch threw:', e.name, e.message); throw e; }
  if (!resp.ok) { const body = await resp.text(); console.error('[callDeepSeek] HTTP!ok:', resp.status, body.slice(0,200)); throw new Error('DeepSeek HTTP '+resp.status); }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '', fullText = '';
  const FLUSH_SIZE = 50;
  let pending = '';
  let chunkCount = 0;
  const heartbeat = setInterval(() => { try { if (typeof res?.write === 'function') { res.write(': heartbeat\n\n'); if (typeof res.flush === 'function') res.flush(); } } catch(e){} }, 20000);
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines2 = buf.split('\n');
      buf = lines2.pop() || '';
      for (const line of lines2) {
        if (!line.startsWith('data: ')) continue;
        const d = line.slice(6).trim();
        if (d === '[DONE]') { clearInterval(heartbeat); continue; }
        try {
          const parsed = JSON.parse(d);
          const txt = parsed.choices?.[0]?.delta?.content || '';
          if (!txt) continue;
          chunkCount++;
          let clean = txt.replace(/\\n/g, '\n').replace(/ \n/g, '\n').replace(/  +/g, ' ').replace(/\uFFFD/g,'').replace(/�/g,'');
          fullText += clean;
          pending += clean;
          if (pending.length >= FLUSH_SIZE) {
            try {
              const _a = astroMatrix?.meta?.rising_sign||'Cancer';
              let pc = natal_sun_linter(astro_phase_linter(final_text_sanitizer(pending,_a)),realSunSign,_a);
              pc = applyMonthLockSanitizer(pc,astroMatrix,null,null,lang).replace(/\uFFFD/g,'').replace(/�/g,'');
              res.write(Buffer.from(`data: ${JSON.stringify({ text: pc })}\n\n`, 'utf-8'));
              onChunk && onChunk(pc);
            } catch(e2) {
              res.write(Buffer.from(`data: ${JSON.stringify({ text: pending })}\n\n`, 'utf-8'));
              onChunk && onChunk(pending);
            }
            if (typeof res.flush === 'function') res.flush();
            pending = '';
          }
        } catch(e) {}
      }
    }
  } catch(e) { clearInterval(heartbeat); console.error('[callDeepSeek] stream read error:', e.message); throw e; }
  clearInterval(heartbeat);
  if (pending) {
    try {
      const _a = astroMatrix?.meta?.rising_sign||'Cancer';
      let pc = natal_sun_linter(astro_phase_linter(final_text_sanitizer(pending,_a)),realSunSign,_a);
      pc = applyMonthLockSanitizer(pc,astroMatrix,null,null,lang).replace(/\uFFFD/g,'').replace(/�/g,'');
      res.write(Buffer.from(`data: ${JSON.stringify({ text: pc })}\n\n`, 'utf-8'));
      onChunk && onChunk(pc);
    } catch(e) {
      res.write(Buffer.from(`data: ${JSON.stringify({ text: pending })}\n\n`, 'utf-8'));
      onChunk && onChunk(pending);
    }
    if (typeof res.flush === 'function') res.flush();
  }
  console.log('[callDeepSeek] RETURN fullText.length=' + fullText.length + ' chunks=' + chunkCount);
  return fullText;
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

// V116-Bug4b-fix: 英文星座名 → 中文（报头回归，前置Map + 后置清洗双保险）
function englishSignToChinese(text){
  if(!text)return text;
  const EN_ZH = {
    'Aries':'白羊座','Taurus':'金牛座','Gemini':'双子座','Cancer':'巨蟹座','Leo':'狮子座','Virgo':'处女座',
    'Libra':'天秤座','Scorpio':'天蝎座','Sagittarius':'射手座','Capricorn':'摩羯座','Aquarius':'水瓶座','Pisces':'双鱼座',
    'aries':'白羊座','taurus':'金牛座','gemini':'双子座','cancer':'巨蟹座','leo':'狮子座','virgo':'处女座',
    'libra':'天秤座','scorpio':'天蝎座','sagittarius':'射手座','capricorn':'摩羯座','aquarius':'水瓶座','pisces':'双鱼座'
  };
  let t = text;
  for(const [en,zh] of Object.entries(EN_ZH)){
    t = t.replace(new RegExp('\\b'+en+'\\b','g'), zh);
  }
  return t;
}

// V116-Bug1-fix: 空间宫位模糊匹配（抓关键词前后任意宫位，强制归位到产品固定隐喻）
// 产品固定规则（山子大叔裁决）：卧室=第四宫（田宅宫），厨房=第二宫（财帛宫）与第八宫（共享资源），财务室=第八宫（共享资源）
function forceSpaceHouseSanitizer(text){
  if(!text)return text;
  let t = text;
  // 卧室 → 第四宫（田宅宫）
  t = t.replace(/卧室[^\n]{0,40}?第[一二三四五六七八九十百0-9]{1,3}宫[^\n]{0,20}?/g, '卧室区域：第四宫（田宅宫）');
  t = t.replace(/卧室[^\n]{0,20}?（第[一二三四五六七八九十百0-9]{1,3}宫[^）]{0,12}）[^\n]{0,20}?/g, '卧室区域：第四宫（田宅宫）');
  // 厨房 → 第二宫（财帛宫）与第八宫（共享资源）
  t = t.replace(/厨房[^\n]{0,40}?第[一二三四五六七八九十百0-9]{1,3}宫[^\n]{0,20}?/g, '厨房区域：第二宫（财帛宫）与第八宫（共享资源）');
  t = t.replace(/厨房[^\n]{0,20}?（第[一二三四五六七八九十百0-9]{1,3}宫[^）]{0,12}）[^\n]{0,20}?/g, '厨房区域：第二宫（财帛宫）与第八宫（共享资源）');
  // 财务室 → 第八宫（共享资源）
  t = t.replace(/财务室[^\n]{0,40}?第[一二三四五六七八九十百0-9]{1,3}宫[^\n]{0,20}?/g, '财务室区域：第八宫（共享资源）');
  t = t.replace(/财务室[^\n]{0,20}?（第[一二三四五六七八九十百0-9]{1,3}宫[^）]{0,12}）[^\n]{0,20}?/g, '财务室区域：第八宫（共享资源）');
  return t;
}

// V116-Bug4-fix
function cleanGarbageCharacters(text){if(!text)return text;return text.replace(/\uFFFD/g,'').replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g,'').replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,'').replace(/[\u200B-\u200D\uFE0F\uFEFF]/g,'');}

function final_text_sanitizer(text, ascendant = 'Cancer') {
  if (!text) return text;

  // ── V97ab: 清除 AI 幻觉 [object Object]（只删脏数据，不伤正常星座词）──
  // V103-fix7: 用 / {2,}/g 替代 /\s{2,}/g，只折叠多个空格，保留换行符不伤段落结构
  text = text.replace(/\[object Object\]/g, ' ').replace(/ {2,}/g, ' ');

  // ── V97ap: 清除渲染失败的乱码方块（U+FFFD 和空 Emoji 占位）──
  text = text.replace(/�/g, '').replace(/\uFFFD/g, '').replace(/ {2,}/g, ' ');

  // ── V120-fix: 清理军师审计发现的空括号污染（AI 变量填充残留）──
  text = text.replace(/（）/g, '').replace(/\(\)/g, '');
  // 🛠️ V122-fix: 跨块残留空括号（流式拆块时 "第N宫" 与 "（XX座）" 分离，
  //   每块单独处理会留下 "第五宫" 后面跟 "（）狮子座" 或 "（英文）中文" 错位）
  // 解决：删除 "任意中文" + 孤立左括号 + 英文/中文 + 孤立的 "）" 后接 "中文" 的组合
  // 例1: 第五宫（）狮子座 → 第五宫狮子座
  text = text.replace(/([\u4e00-\u9fa5])（）([\u4e00-\u9fa5])/g, '$1$2');
  // 例2: （Jupiter Return）开启 → 开启 （首尾孤立括号包裹英文，被嵌入中文段落）
  text = text.replace(/[（(][A-Za-z][A-Za-z0-9 ,.'":;\-]{0,40}?[）)](?=[\u4e00-\u9fa5])/g, '');
  // 例3: 末尾有 "（" 但无配对 "）"（流式块被截断），等待下一块配对；当前块先不处理
  //   这条会导致脏输出但跨块时由后处理块清理

  // ── V97ar: 清理隐身脏字符（Emoji 变体选择符/零宽字符/不可见 Unicode）──
  // ── V100r: 清理模板污染残留（军师审计：AI将互联网金句与章节标记混合）──
  // ── V100r: 清理互联网金句与章节标记混合污染（军师2026-07-12审计发现）──
  // 直接字符串替换，避免regex转义问题
  if (text.includes('Do not compare your') && text.includes('Chapter 1') && text.includes('Chapter 20')) {
    text = text.replace(/Do not compare your[\s\S]{10,250}?Chapter \d+[\s\S]{5,100}?Chapter \d+/gi,
      'Do not compare your Chapter 1 to someone else\'s Chapter 20. Your foundation is being laid.');
  }

  // ── V101a: 清理灵性毒鸡汤模板词（军师2026-07-12审计：金融神谕禁塞"前世"）──
  // 金融报告调性=硬核风控，禁止 past lives / karma 等地摊占卜词
  text = text
    .replace(/,?\s*(and\s+)?from\s+past lives\b/gi, '')
    .replace(/,?\s*(y|and)?\s*(de\s+)?vidas pasadas\b/gi, '')
    .replace(/,?\s*(et\s+)?de\s+vies antérieures\b/gi, '')
    .replace(/[，、]?\s*甚至前世\b/g, '')
    .replace(/[，、]?\s*来自前世\b/g, '');
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
      // 🛠️ V102t: 停用火星整行删除——星座+相位是真天文(不依赖出生时间)，只有宫位号穿帮。
      // 宫位号交由下方 V102s 降维单独砍除，保留完整黑天鹅内容(星座/相位/日期)。
      return true;
    })
    .join('\n');

  // ── V102s: 行内"非锁定行星"宫位降维 ──
  // 只砍火星/天王/海王/水星/金星在正文里瞎写的宫位号（保留星座）；太阳/月亮/木星/土星/冥王的锁定宫位绝不碰。
  // 中文：行星+在+X座+第N宫 → 保留"行星在X座"，砍宫位
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)(在[\u4e00-\u9fa5]{1,3}座)第[一二三四五六七八九十百零\d]+宫/g, '$1$2');
  // 中文：行星+在(你/您)的+第N宫（无星座）→ 砍"在…第N宫"
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)在[\u4e00-\u9fa5你您]{0,6}?第[一二三四五六七八九十百零\d]+宫/g, '$1');
  // 中文兜底：行星+任意描述(逆行/发生在你的/四分相等动词引导)+第N宫 → 砍宫位（补 V102s 仅要求紧接"在"的缺口，覆盖动词引导句式）
  // 🛠️ V106-fix2: 原 [^。\n]{0,20}? 会吞掉外层闭合括号里的 ） ，导致相位句出现无头）
  // 修复：加 ） 到禁止字符集，确保匹配在括号对边界停止
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)[^。\n）]{0,20}?第[一二三四五六七八九十百零0-9]+宫/g, '$1');
  // 🛠️ V106-fix2b: 上述替换后若句中出现"行星）第N宫（"（内层括号被连宫位一起删），补闭合并清星座
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)）（第[一二三四五六七八九十百零0-9]+宫）/g, '$1$2');
  // 🛠️ Issue B 终级 fix: 贪婪捕获"在你的第N宫（XX座）"型复杂嵌套句式 → 砍宫位+括号内星座，保留行星和"在你的"引导
  // 匹配：火星在你的第3宫（处女座）、水星在第5宫（狮子座）、冥王星在你的第12宫（水瓶座）等所有变体
  text = text.replace(/(行星|[\u4e00-\u9fa5星曜]+星?)(在你|在他|在她|在|的)(第[一二三四五六七八九十百零0-9]+宫)(（[^）]+座）|\([^)]+座\))/g, '$1$2$3');
  // 🛠️ Issue B 兜底："第N宫（XX座）"仍在句中 → 砍括号内星座（保留第N宫描述，但括号内星座必删，因与本命冲突）
  text = text.replace(/第([一二三四五六七八九十百零0-9]+)宫（([^）]+)座）/g, '第$1宫');
  text = text.replace(/第([一二三四五六七八九十百零0-9]+)宫\(([^)]+)座\)/g, '第$1宫');
  // 🛠️ Issue B 兜底：行星+你的+第N宫（无括号）→ 砍"你的第N宫"保留行星
  text = text.replace(/(火星|天王星|海王星|水星|金星|凯龙星?|北交点)在你的第[一二三四五六七八九十百零0-9]+宫/g, '$1');
  // 英/西/法：Planet [in Sign] + House/Casa/Maison N → 保留 Planet in Sign
  text = text.replace(/\b(Mars|Uranus|Neptune|Mercury|Venus|Chiron)(\s+in\s+[A-Z][a-z]+)?(\s*(?:\(|,|\bin\b)?\s*(?:the\s+)?(?:\d+(?:st|nd|rd|th)\s+House|House\s+\d+|Casa\s+\d+|Maison\s+\d+)\)?)/g, '$1$2');
  // 泰：ดาว... + ภพที่/เรือนที่ N
  text = text.replace(/(ดาวอังคาร|ดาวยูเรนัส|ดาวเนปจูน|ดาวพุธ|ดาวศุกร์)([^\n]{0,12}?)(?:ภพที่|เรือนที่)\s*\d+/g, '$1$2');
  // 越：Sao Hỏa/Thiên Vương/Hải Vương/Thủy/Kim + Nhà N
  text = text.replace(/(Sao Hỏa|Sao Thiên Vương|Sao Hải Vương|Sao Thủy|Sao Kim)([^\n]{0,12}?)\s*Nhà\s*\d+/g, '$1$2');
  // 降维收尾：仅合并多余空格（不碰换行，保护 markdown 段落）
  text = text.replace(/ {2,}/g, ' ');

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
      text = text.replace(new RegExp(`第([一二三四五六七八九十百零\d]+)宫（${f.sign}）`, 'g'), `第${f.h}宫（${f.sign}）`);
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

    // V103-fix16: 处女座归风元素——AI 幻觉把处女座（土象）归入风元素，正则物理矫正
    R('风元素（处女座', '土元素（处女座');
    R('风元素路径：处女座', '土元素路径：处女座');

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


  // 🛠️ V104b: 水星断头句修复——AI常漏写「水星在XX座逆行」中的「逆行」两字
  // 模式：「2月9日至3月3日，水星，财务文件需要格外小心」→补逆行
  text = text.replace(/(\d月\d日[^。\n]{0,20}?)水星，([^。\n]{0,5}?财务[^。\n]{0,20}?[。\n])/g, '$1水星在双鱼座逆行，$2');
  text = text.replace(/(\d月\d日[^。\n]{0,20}?)水星，([^。\n]{0,30}?[。\n])/g, function(m, p1, p2) {
    if (p2.indexOf('逆行') === -1 && p2.indexOf('顺行') === -1) {
      return p1 + '水星在双鱼座逆行，' + p2;
    }
    return m;
  });

  // 🛠️ V104c: 长括号自动闭合——段落结尾有（无）时自动补
  // 匹配结尾字符不是）」等且前面有未闭合（的段落
  var sections = text.split('\n');
  for (var si = 0; si < sections.length; si++) {
    var sec = sections[si];
    var openC = (sec.match(/\uff08/g) || []).length;
    var closeC = (sec.match(/\uff09/g) || []).length;
    if (openC > closeC && !sec.match(/[）　]\s*$/)) {
      sections[si] = sec + '）';
    }
  }
  text = sections.join('\n');

  // 🛡️ V97h2: 防御性清洗——移除编码崩坏的孤立代理对 + U+FFFD 替换符（保留合法 emoji 对）
  text = stripLoneSurrogates(text).replace(/\uFFFD/g, '');
  // V104d: 斩杀文本中字面的 \n 串
  text = text.replace(/\\n/g, '');
  return text;
}

// ── V104e: 本命太阳断言器 + 反向括号补丁 ──
// 1) 正文中「你的太阳在X座」但X不是本命太阳 → 替换为本命太阳
// 2) 反向残括号：「但水星）」「而天王星）」等（有）无（前）→ 补前
// 3) 「（巨蟹座形成强大的支持相位」漏）→ 补）
function natal_sun_linter(text, natalSunSign, ascendant) {
  if (!text || !natalSunSign) return text;

  // 🛠️ V110-fix1: 报头本命太阳硬覆盖（AI幻觉把摩羯写成双鱼，pat1只覆盖正文"你的太阳在X座"漏了报头）
  //   报头两处：年度星盘: X座 / 核心本命代码: 太阳X座 · 月亮Y座
  const _allSigns = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
  text = text.replace(new RegExp('年度星盘[^座]*(' + _allSigns.join('|') + ')', 'g'), '年度星盘: ' + natalSunSign);
  text = text.replace(new RegExp('核心本命代码[^座]*太阳(' + _allSigns.join('|') + ')', 'g'), '核心本命代码: 太阳' + natalSunSign);

  // 1) 本命太阳断言：匹配「你的太阳在X座」或「太阳在X座第Y宫」等显式引用
  //    只修正文中的本命表述，不修月度标题（月锁已保证正确）
  const SUN_SIGNS = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
  for (const wrongSign of SUN_SIGNS) {
    if (wrongSign === natalSunSign) continue;
    // 模式 1：你的太阳在双子座第12宫 → 你的太阳在狮子座第X宫
    // 但保留「太阳进入双子座」（月度 transit 语境）
    // 「太阳在X座」且前面 20 字内有「你的」→ 视为本命引用
    const pat1 = new RegExp('你的(?:本命)?太阳在' + wrongSign, 'g');
    text = text.replace(pat1, '你的太阳在' + natalSunSign);

    // 模式 2：前面无「你的」但有明显的本命上下文（如风元素路径章节）
    // 谨慎处理：只替换明确的前缀模式
    const pat2 = new RegExp('太阳在' + wrongSign + '第', 'g');
    // 替换前先检查上下文：如果上一句是「你的」领起，或前300字内第一次出现
    text = text.replace(pat2, '太阳在' + natalSunSign + '第');

    // 🛠️ V107-fix1: AI 把相位目标星座（如巨蟹座四分相 白羊座）错写为本命星座
    // 模式：与你的本命白羊座太阳形成四分相（用户本命射手座时，白羊座是 aspect target 不是本命）
    // 匹配：与你的本命[WRONG]座太阳/月亮形成[相位]
    const pat3 = new RegExp('与你的本命' + wrongSign + '(太阳|月亮)形成', 'g');
    text = text.replace(pat3, '与你的本命' + natalSunSign + '$1形成');

    // 🛠️ V110-fix2: 本命太阳句式扩面（pat1只覆盖"你的太阳在X座"，漏了带"本命"间隔和"之人"句式）
    //   "你的本命太阳在X座" / "本命太阳在X座" / "作为X座之人" / "X座之人"
    text = text.replace(new RegExp('你的本命太阳在' + wrongSign, 'g'), '你的本命太阳在' + natalSunSign);
    text = text.replace(new RegExp('本命太阳在' + wrongSign + '座', 'g'), '本命太阳在' + natalSunSign + '座');
    text = text.replace(new RegExp('作为' + wrongSign + '之人', 'g'), '作为' + natalSunSign + '之人');
    text = text.replace(new RegExp('(^|[\\s，。、])' + wrongSign + '之人', 'g'), '$1' + natalSunSign + '之人');
  }

  // 2) 反向残括号：但水星）→ 但水星（逆行） 或补前（
  //   「但[行星名]）」 → 「但[行星名]（逆行）」
  //   「而[行星名]）」 → 「而[行星名]（逆行）」
  const PLANETS = ['水星','金星','火星','木星','土星','天王星','海王星','冥王星'];
  for (const p of PLANETS) {
    const revPat = new RegExp('但' + p + '）', 'g');
    text = text.replace(revPat, '但' + p + '（逆行）');
    const revPat2 = new RegExp('而' + p + '）', 'g');
    text = text.replace(revPat2, '而' + p + '（逆行）');
    const revPat3 = new RegExp('，' + p + '）', 'g');
    text = text.replace(revPat3, '，' + p + '（逆行）');
  }

  // 🛠️ V108-fix4: 第五章本命宫位硬编码——AI 自行推算本命太阳宫位时常写".2e6.79bb.121宫"
  // 根据上升星座和本命太阳星座，用整宫制计算正确宫位
  try {
    const _vm = getSignToHouseMap(ascendant);
    const _si = SIGN_ORDER_ZH.indexOf(natalSunSign);
    if (_vm && _si >= 0 && _vm[_si]) {
      const _ch = _vm[_si];
      text = text.replace(/你的本命太阳在第[一二三四五六七八九十百零\d]{1,3}宫/g, '你的本命太阳在第' + _ch + '宫');
      text = text.replace(/本命太阳在第[一二三四五六七八九十百零\d]{1,3}宫/g, '本命太阳在第' + _ch + '宫');

      // 🛠️ V108-fix7: 第五章家居对齐硬编码宫位解耦
      const _homeStart = text.indexOf('家居财富对齐');
      const _officeStart = text.indexOf('办公室财富对齐');
      if (_homeStart >= 0) {
        const _homeEnd = _officeStart >= 0 ? _officeStart : text.length;
        const _before = text.substring(0, _homeStart);
        let _home = text.substring(_homeStart, _homeEnd);
        const _after = text.substring(_homeEnd);
        _home = _home.replace(/第([一二三四五六七八九十百零\d]+)宫/g, '第' + _ch + '宫');
        text = _before + _home + _after;
      }
    }
  } catch(e) {
    console.warn('[natal_sun_linter] house fix failed:', e.message);
  }


  // ═══ V113-fix6: 月度爆发窗口星座强锁 ═══
  // 根因：Gemini偷懒套7月模板，Peak Revenue Window里"太阳在X座"全写成本命星座
  // 解法：按月章节切分，提取标题当月天象星座，正文"太阳在X座"全部强制对齐
  try {
    const _alls = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
    const _secs = text.split(/(?=###\s*\d{4}年\d{1,2}月)/g);
    const _proc = _secs.map(_s => {
      const _m = _s.match(/###\s*\d{4}年\d{1,2}月\s*:\s*太阳([^\s座]+座)/);
      if (!_m) return _s;
      const _transit = _m[1];
      const _ti = _s.indexOf('\n', _s.indexOf('###'));
      if (_ti < 0) return _s;
      const _hdr = _s.substring(0, _ti + 1);
      let _body = _s.substring(_ti + 1);
      _body = _body.replace(/太阳在([^\s座]+)座/g, (_mm, _sg) => {
        if (_alls.includes(_sg + '座') && _sg + '座' !== _transit) {
          return '太阳在' + _transit.replace('座','') + '座';
        }
        return _mm;
      });
      return _hdr + _body;
    });
    text = _proc.join('');
  } catch(e) {
    console.warn('[natal_sun_linter] transit sun lock failed:', e.message);
  }

  return text;
}
// 校验AI生成的相位描述是否符合天文学规则。
// 星座-相位关系是有限且确定的，用查表法100%拦截错误配对。
function astro_phase_linter(text) {
  if (!text) return text;

  // 相位规则表：12星座，每类相位只能与指定星座形成
  const PHASE_RULES = {
    '对分相':  { '白羊座':'天秤座','天秤座':'白羊座','金牛座':'天蝎座','天蝎座':'金牛座','双子座':'射手座','射手座':'双子座','巨蟹座':'摩羯座','摩羯座':'巨蟹座','狮子座':'水瓶座','水瓶座':'狮子座','处女座':'双鱼座','双鱼座':'处女座' },
    '四分相':  { '白羊座':['巨蟹座','摩羯座'],'金牛座':['狮子座','水瓶座'],'双子座':['处女座','双鱼座'],'巨蟹座':['白羊座','天秤座'],'狮子座':['金牛座','天蝎座'],'处女座':['双子座','射手座'],'天秤座':['巨蟹座','摩羯座'],'天蝎座':['狮子座','水瓶座'],'射手座':['处女座','双鱼座'],'摩羯座':['白羊座','天秤座'],'水瓶座':['金牛座','天蝎座'],'双鱼座':['双子座','射手座'] },
    '三分相':  { '白羊座':['狮子座','射手座'],'狮子座':['白羊座','射手座'],'射手座':['白羊座','狮子座'],'金牛座':['处女座','摩羯座'],'处女座':['金牛座','摩羯座'],'摩羯座':['金牛座','处女座'],'双子座':['天秤座','水瓶座'],'天秤座':['双子座','水瓶座'],'水瓶座':['双子座','天秤座'],'巨蟹座':['天蝎座','双鱼座'],'天蝎座':['巨蟹座','双鱼座'],'双鱼座':['巨蟹座','天蝎座'] },
    '六分相':  { '白羊座':['双子座','水瓶座'],'双子座':['白羊座','狮子座'],'狮子座':['双子座','天秤座'],'天秤座':['狮子座','射手座'],'射手座':['天秤座','水瓶座'],'水瓶座':['射手座','白羊座'],'金牛座':['巨蟹座','双鱼座'],'巨蟹座':['金牛座','处女座'],'处女座':['巨蟹座','天蝎座'],'天蝎座':['处女座','摩羯座'],'摩羯座':['天蝎座','金牛座'],'双鱼座':['摩羯座','巨蟹座'] },
  };
  const SIGN_ZH = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
  const PHASE_ZH = ['对分相','四分相','三分相','六分相'];
  const SIGN_RE = new RegExp(SIGN_ZH.join('|'), 'g');
  const PHASE_RE = new RegExp(PHASE_ZH.join('|'), 'g');
  const lines = text.split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const phaseMatches = [...line.matchAll(PHASE_RE)];
    if (phaseMatches.length === 0) continue;

    const signMatches = [...line.matchAll(SIGN_RE)];
    if (signMatches.length < 2) continue;

    for (const pm of phaseMatches) {
      const phase = pm[0];
      const rules = PHASE_RULES[phase];
      if (!rules) continue;

      // 找离相位词最近的2个星座（不区分前后，中文句式两个星座通常都在前面）
      const sorted = signMatches
        .map(function(m) { return { sign: m[0], idx: m.index, dist: Math.abs(m.index - pm.index) }; })
        .sort(function(a, b) { return a.dist - b.dist; });

      const closest = sorted[0];
      const second = sorted[1];
      if (!closest || !second) continue;

      const signA = closest.sign;
      const signB = second.sign;

      const validForA = rules[signA];
      if (!validForA) continue;

      let isValid = false;
      if (typeof validForA === 'string') {
        isValid = (validForA === signB);
      } else if (Array.isArray(validForA)) {
        isValid = validForA.indexOf(signB) !== -1;
      }

      if (!isValid) {
        console.log('[astro_linter] DETECTED: ' + signA + ' ' + phase + ' ' + signB);
        var validForB = rules[signB];
        var corrected = null;
        if (typeof validForB === 'string') {
          corrected = validForB;
        } else if (Array.isArray(validForB) && validForB.length > 0) {
          corrected = validForB[0];
        }
        if (corrected && corrected !== signA) {
          lines[i] = lines[i].replace(signA, corrected);
          modified = true;
          console.log('[astro_linter] FIXED: ' + signA + ' -> ' + corrected);
        }
      }
    }
  }

  return modified ? lines.join('\n') : text;
}

// DeepSeek Streaming 时常产生「年份重影」：2026年6月2026年6月6月21日
// 本函数暴力清洗所有已知的污染模式
// 🛠️ V97w: 后处理硬替换——逐月检查标题的太阳星座，用锁表修正AI胡编（治本：Prompt锁不住就后门堵死）
function applyMonthLockSanitizer(text, astroMatrix, currentYear = null, currentMonth = null, lang = 'zh') {
  text = forceSpaceHouseSanitizer(text); // 🛠️ V116-final: 空间宫位清洗挂到月度锁内，V1/V2所有清洗路径自动受益
  // 🛠️ V114-fix: Python positions.Sun accessor（顶层 m.sun 永远空）
  const _sunOf = (m) => {
  if (m.sun && m.sun.sign) return m.sun;
  if (m.positions?.Sun) return {sign: m.positions.Sun.sign, house: m.positions.Sun.house};
  if (m.sunSignZH) return {sign: m.sunSignZH, house: m.sunHouse};  // astro-truth.js format
  return {sign:'', house:undefined};
};
  if (currentYear === null) currentYear = new Date().getFullYear();
  if (currentMonth === null) currentMonth = new Date().getMonth() + 1;
  console.log('[V97w-MARKER] applyMonthLockSanitizer invoked, astroMatrix.months=' + (astroMatrix?.months?.length || 0));
  if (!text || !astroMatrix || !astroMatrix.months) return text;

  // 🛠️ V106-fix3: 最早期清洗——在任何标题/星座替换之前，先清乱码+修复孤闭括号
  // 这两刀走在 applyMonthLockSanitizer 最前，确保进入主循环前文本已干净
  text = text.replace(/\uFFFD/g, '').replace(/�/g, '');
  // ═══════════════════════════════════════════════════════════
  // 🛠️ V115-fix1: 月度标题全量精准锁（一次性替换12个月，不依赖正则分组）
  // 根因：V114 的 titleRe 只处理 ### 标题，漏了 #### 加粗标题 + 句式变体。
  // 治法：直接遍历12个月，精准替换"年N月：太阳[错误]座"→"年N月：太阳[正确]座"
  // ═══════════════════════════════════════════════════════════
  const _ZS = {Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座'};
  const _sunSignMap = {};
  if (astroMatrix && astroMatrix.months) {
    astroMatrix.months.forEach((m, i) => {
      const sun = _sunOf(m);
      const signZh = _ZS[sun.sign] || sun.sign || '';
      if (!signZh) return;
      const mi = currentMonth - 1 + i;
      const year = currentYear + (mi >= 12 ? 1 : 0);
      const month = (mi % 12) + 1;
      _sunSignMap[`${year}年${month}月`] = signZh;
    });
  }
  Object.keys(_sunSignMap).forEach(key => {
    const correctSign = _sunSignMap[key];
    // 全量替换：key + 冒号/冒号 + 任意内容 + 星座名 → 正确星座名
    // 匹配：2027年6月：/：+ 太阳 + 任意 + 星座名
    const wrongSigns = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
    wrongSigns.forEach(wrong => {
      if (wrong === correctSign) return;
      // Pattern A: 冒号+空格+太阳+任意+星座名（标题格式）
      const reA = new RegExp(`(${key}[：:]\s*太阳[^\n]*?)${wrong}`, 'g');
      // Pattern B: 冒号+星座名（简洁标题，如"太阳双鱼座"）
      const reB = new RegExp(`(${key}[：:]\s*)${wrong}`, 'g');
      text = text.replace(reA, `$1${correctSign}`);
      text = text.replace(reB, `$1${correctSign}`);
    });
  });
  // 通用孤闭括号兜底（无头）→ 清掉；有头括号链交给 natal_sun_linter / V104c 处理
  text = text.replace(/（([^）\n]*?)(?=\n|$)/g, '（$1）');

  const ZH_SIGN = {Aries:'白羊座', Taurus:'金牛座', Gemini:'双子座', Cancer:'巨蟹座', Leo:'狮子座', Virgo:'处女座', Libra:'天秤座', Scorpio:'天蝎座', Sagittarius:'射手座', Capricorn:'摩羯座', Aquarius:'水瓶座', Pisces:'双鱼座'};

  // Build correct entries: [{ key: "2026年7月", sign: "巨蟹座", house: 9 }]
  const entries = [];
  astroMatrix.months.forEach((m, i) => {
    const sun = _sunOf(m);
    const signZh = ZH_SIGN[sun.sign] || sun.sign || '';
    const house = sun.house || '';
    const mi = currentMonth - 1 + i;
    const year = currentYear + (mi >= 12 ? 1 : 0);
    const month = (mi % 12) + 1;
    entries.push({ year, month, key: `${year}年${month}月`, sign: signZh, house, monthIdx: i });
  });

  // Process each month: find the title line and fix the sun sign
  for (const entry of entries) {
    // Target: "2026年7月：太阳[WRONG_SIGN]座[第X宫] · "
    // Replace with: "2026年7月：太阳[CORRECT_SIGN]座第[HOUSE]宫 · "
    const ymEscaped = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // 标题锚点死锁：年-月-冒号(含冒号后可选空格)-太阳 起到第一个空格/·/换行之前
    // 统一重注为 太阳{sign}{第house宫}，截断时以·或换行为界，保护后续主题文本
    // 🛠️ V106-fix1: 去掉 [^·\n\s] 里的 \s，允许 NBSP/全角空格参与匹配；替换时规范化为"太阳{sign}{house}·"（截断后续）
    const houseStr = entry.house ? `第${entry.house}宫` : '';
    const titleRe = new RegExp(`(${ymEscaped}[：:]\s*)太阳[^·\n]*`, 'gi');
    text = text.replace(titleRe, (match, prefix) => {
      // 去掉 match 末尾超过"太阳{sign}{house}"的部分（贪婪匹配吞了主题），只保留标题前缀
      const norm = match
        .replace(/\u00A0/g, ' ')  // 干掉 NBSP
        .replace(/座座/g, '座')    // 干掉重复座
        .replace(/第\d+宫座/g, m => m.replace(/座$/, '')) // 干掉"第N宫座"
        .replace(/\s*·.+$/, '');  // 以 · 为界截断，保护后续
      return norm.replace(/太阳.+$/, `太阳${entry.sign}${houseStr}`);
    });

    

    // 🛠️ V102u: 语言感知标题锁（仅 zh 报告）——AI 偶尔把月度标题写成 "Sun in 巨蟹座第7宫" 等英文/混杂格式，
    // 强制转回中文 "太阳{sign}座第{house}宫"，值仍从 SwissEph 死锁（杜绝英文词混进中文报告，且不依赖 AI 听话）。
    if (lang === 'zh') {
      const enTitleRe = new RegExp(`(${ymEscaped}[：:]\s*)Sun\s+in\s*[^·\n]{0,30}?(?=\s*[·\n]|$)`, 'gi');
      text = text.replace(enTitleRe, (match, prefix) => {
        return `${prefix}太阳${entry.sign}${houseStr}`;
      });
    }

    // Also fix "太阳进入[WRONG]座" in the body text for same month
    // e.g.: "六月，太阳进入水瓶座" → "六月，太阳进入双子座"
    if (entry.month >= 1 && entry.month <= 12) {
      const monthNames = ['', '一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
      const cnMonth = monthNames[entry.month];
      if (cnMonth) {
        // 🛠️ Issue A fix: 贪婪捕获"6月，太阳/木星/土星在处女座"所有变体
        // 覆盖：太阳在处女座 / 太阳进入处女座 / 太阳行经处女座 / 木星在处女座 等
        const bodyRe = new RegExp(`(${cnMonth}[，,、\s]{0,5})(?:太阳|木星|土星|冥王星|月亮|火星|水星|金星)(?:\s*进入|\s*在|\s*行经|\s*来到|\s*进|\s*抵|\s*位于)?\s*[^座\n]*?座(?:\s*座)?`, 'gi');
        text = text.replace(bodyRe, (match, prefix) => {
          // 提行星名：逐个匹配前缀中的行星关键词
          const planets = ['太阳','木星','土星','冥王星','月亮','火星','水星','金星'];
          let planet = '太阳';
          for (const p of planets) {
            if (match.includes(p)) { planet = p; break; }
          }
          return `${prefix}${planet}进入${entry.sign}`;
        });

        // 🛠️ Issue A fix #2: 英文月份 body — "June, Sun in Virgo" → "June, Sun in Gemini"
        const enMonths = ['','January','February','March','April','May','June','July','August','September','October','November','December'];
        const enMonth = enMonths[entry.month];
        if (enMonth) {
          const enBodyRe = new RegExp(`(${enMonth}[,\s]{0,5})(Sun|Mars|Saturn|Jupiter|Moon|Mercury|Venus|Pluto)(?:\s+in|\s+enters|\s+entering)?\s+[^\n,]{3,30}?(?:sign|座)?`, 'gi');
          text = text.replace(enBodyRe, (m, p, planet) => `${p}${planet} in ${entry.sign}`);
        }
      }

      // 🛠️ V107-fix2: 修复 Peak Window/Black Swan 行星位置幻觉
      // AI 常忽略 SwissEph 数据，用自己的训练知识写行星位置（7月写「太阳在射手座」）
      // 用 astroMatrix 真实数据覆盖 Peak Window 描述中的行星位置
      if (entry.monthIdx !== undefined) {
        const _md = astroMatrix.months[entry.monthIdx];
        if (_md) {
          // 取各行星的真实星座中文名
          const ZH_SIGN_PL = {Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座'};
          const _realSun = ZH_SIGN_PL[_sunOf(_md).sign] || _sunOf(_md).sign || '';
          const _realJup = ZH_SIGN_PL[_md.jupiter?.sign] || _md.jupiter?.sign || '';
          const _realSat = ZH_SIGN_PL[_md.saturn?.sign] || _md.saturn?.sign || '';
          const _realMar = ZH_SIGN_PL[_md.mars?.sign] || _md.mars?.sign || '';
          const _realMerc = ZH_SIGN_PL[_md.mercury?.sign] || _md.mercury?.sign || '';
          const _realVen = ZH_SIGN_PL[_md.venus?.sign] || _md.venus?.sign || '';

          // 找本月份章节（用 entry.key 定位）：2026年7月: ...
          // 在章节内做精确的行星际替换：
          const _monthKeyEsc = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const _sectionRe = new RegExp(`(${_monthKeyEsc}[：:][\s\S]*?)(太阳|木星|土星|火星|水星|金星|月亮|冥王星)在([白羊金牛双子巨蟹狮子处女天秤天蝎射手摩羯水瓶双鱼]+)座第\\d+宫(?=与|形成|，|\.|。|）)`, 'g');
          text = text.replace(_sectionRe, function(match, prefix, planetChar) {
            // 根据行星名选真实星座
            let realSign = '';
            if ((planetChar === '太阳' || planetChar === 'Sun') && _realSun) realSign = _realSun;
            else if (planetChar === '木星' && _realJup) realSign = _realJup;
            else if (planetChar === '土星' && _realSat) realSign = _realSat;
            else if (planetChar === '火星' && _realMar) realSign = _realMar;
            else if (planetChar === '水星' && _realMerc) realSign = _realMerc;
            else if (planetChar === '金星' && _realVen) realSign = _realVen;
            else if (planetChar === '月亮' && _md.moon?.sign) realSign = _md.moon.sign.replace(/座$/, '') || '';
            if (!realSign) return match; // 没数据不动
            // 提取宫位号
            const _houseMatch = match.match(/第([一二三四五六七八九十百零\d]+)宫/);
            const _house = _houseMatch ? _houseMatch[1] : '';
            const _signCore = realSign.replace(/座$/, '');
            return `${prefix}${planetChar}在${_signCore}第${_house}宫`;
          });

          // 🛠️ V111: 火星相位死循环硬锁（章节隔离 + 真值替换）
          // 根因：AI 在 Black Swan 段写"火星在X座刑克天王星在Y座"，长文本复制粘贴到所有月份。
          //       V107-fix2 的 _sectionRe 只锁"X座第N宫"格式，漏了"X座刑克Y座"相位句式 → 跨月死循环。
          // 治本：用 astroMatrix 每月真实火星/天王星星座，按章节隔离替换（不依赖 AI 听话）。
          const ZH_SIGN_PL2 = {Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座'};
          // 🛠️ V115-fix2: 火星/天王星全量真值替换（不依赖段隔离，一次遍历全局替换）
          // 根因：AI 写"火星在狮子座刑克天王星在双子座"跨月复制，sanitizer 段隔离逻辑漏截
          // 治法：读每月真值，全局逐月替换，斩断复读冲动
          // ⚠️ 注意：_wrongZodiacs 在月度循环内定义，此处用 _ZS（月度循环外专用）
          const _wrongZodiacs = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
          if (astroMatrix && astroMatrix.months) {
            const _marsCache = {};
            const _uraCache = {};
            astroMatrix.months.forEach((m2, i2) => {
              const marSign = m2.mars?.sign || m2.positions?.Mars?.sign || '';
              const uraSign = m2.uranus?.sign || m2.positions?.Uranus?.sign || '';
              _marsCache[i2] = ZH_SIGN_PL2[marSign]?.replace(/座$/,'') || marSign.replace(/座$/,'') || '';
              _uraCache[i2] = ZH_SIGN_PL2[uraSign]?.replace(/座$/,'') || uraSign.replace(/座$/,'') || '';
            });
            // 替换：火星在X座 → 火星在当月真值座（只替换"火星在"+非真值+座）
            const _allMarsSigns = Object.values(_marsCache).filter(Boolean);
            const _allUraSigns = Object.values(_uraCache).filter(Boolean);
            _allMarsSigns.forEach(ms => {
              if (!ms) return;
              _wrongZodiacs.forEach(ws => {
                if (ws === ms) return;
                const _mr = new RegExp(`火星在${ws}`, 'g');
                text = text.replace(_mr, `火星在${ms}`);
              });
            });
            _allUraSigns.forEach(us => {
              if (!us) return;
              _wrongZodiacs.forEach(ws => {
                if (ws === us) return;
                const _ur = new RegExp(`天王星在${ws}`, 'g');
                text = text.replace(_ur, `天王星在${us}`);
              });
            });
          }
          const _realMar2 = ZH_SIGN_PL2[_md.mars?.sign] || _md.mars?.sign || '';
          const _realUra2 = ZH_SIGN_PL2[_md.uranus?.sign] || _md.uranus?.sign || '';
          const _marCore = _realMar2.replace(/座$/, '');
          const _uraCore = _realUra2.replace(/座$/, '');
          if (_marCore && _uraCore) {
            const _mkEsc = entry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const _titleRe = new RegExp('\\n#{2,4}\\s*' + _mkEsc + '[：:]');
            const _titleMatch = _titleRe.exec(text);
            if (_titleMatch) {
              const _mkStart = _titleMatch.index;
              const _nextEntry = entries.find(e => e.monthIdx > entry.monthIdx);
              let _mkEnd = text.length;
              if (_nextEntry) {
                const _nextEsc = _nextEntry.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const _nextRe = new RegExp('\\n#{2,4}\\s*' + _nextEsc + '[：:]');
                const _nextMatch = _nextRe.exec(text.slice(_mkStart + 1));
                if (_nextMatch) _mkEnd = _mkStart + 1 + _nextMatch.index;
              }
              const _section = text.slice(_mkStart, _mkEnd);
              // V112: 鲁棒——章节内所有"火星在X座"和"天王星在Y座"强制真值替换，覆盖所有格式变体（简式/带宫位/带括注）
              let _fixed = _section
                .replace(/火星在[^。\n]*?座/g, `火星在${_marCore}座`)
                .replace(/天王星在[^。\n]*?座/g, `天王星在${_uraCore}座`);
              text = text.slice(0, _mkStart) + _fixed + text.slice(_mkEnd);
            }
          }
        }
      }
    }
  }

  // 🛠️ V112: 头部/尾部 BlackSwan 段硬锁（AI 抽到月度章节外的汇总段，V111 月度隔离漏不掉这里）
  if (astroMatrix && astroMatrix.months && astroMatrix.months.length >= 12) {
    const _marM = {}, _uraM = {};
    astroMatrix.months.forEach((m, i) => {
      if (m?.mars?.sign) _marM[i] = ZH_SIGN[m.mars.sign]?.replace(/座$/, '') || '';
      if (m?.uranus?.sign) _uraM[i] = ZH_SIGN[m.uranus.sign]?.replace(/座$/, '') || '';
    });
    const _mtRe = /#{2,4}\s*\d{4}年\d{1,2}月[：:]/g;
    const _titles = [];
    let _mt;
    while ((_mt = _mtRe.exec(text))) _titles.push(_mt.index);
    if (_titles.length) {
      const _process = (seg) => {
        const _dayRe = /\*\*?(\d{4})年(\d{1,2})月(\d{1,2})日[前后]?\*\*?/g;
        const _days = [];
        let _dm;
        while ((_dm = _dayRe.exec(seg))) {
          const _mi = parseInt(_dm[2], 10) - 1;
          if (_mi >= 0 && _mi < 12) _days.push({ idx: _dm.index, mi: _mi });
        }
        if (!_days.length) return seg;
        let _out = '';
        let _last = 0;
        for (let k = 0; k < _days.length; k++) {
          const _d = _days[k];
          const _nextIdx = (k + 1 < _days.length) ? _days[k + 1].idx : seg.length;
          const _s = seg.slice(_last, _nextIdx);
          const _mc = _marM[_d.mi] || '';
          const _uc = _uraM[_d.mi] || '';
          let _sf = _s;
          if (_mc) _sf = _sf.replace(/火星在[^。\n]*?座/g, `火星在${_mc}座`);
          if (_uc) _sf = _sf.replace(/天王星在[^。\n]*?座/g, `天王星在${_uc}座`);
          _out += _sf;
          _last = _nextIdx;
        }
        return _out + seg.slice(_last);
      };
      const _head = _process(text.slice(0, _titles[0]));
      const _tail = _process(text.slice(_titles[_titles.length - 1]));
      text = _head + text.slice(_titles[0], _titles[_titles.length - 1]) + _tail;
      // 汇总段特判：风险（火星在X座）：日期 → 用第一个日期月份真值
      text = text.replace(/(风险[^\n（]*?)\（火星在[^。\n]*?座[^。\n]*?）\s*[：:]\s*(\d{4})年(\d{1,2})月(\d{1,2})日/g,
        (m, pre, marsPart, y, mo, d) => {
          const _mi = parseInt(mo, 10) - 1;
          const _mc = _marM[_mi] || '';
          const _uc = _uraM[_mi] || '';
          let _nm = marsPart;
          if (_mc) _nm = _nm.replace(/火星在[^。\n]*?座/, `火星在${_mc}座`);
          if (_uc) _nm = _nm.replace(/天王星在[^。\n]*?座/, `天王星在${_uc}座`);
          return `${pre}（${_nm}）：${y}年${mo}月${d}日`;
        });
    }
  }

  // 🛠️ V108-fix3: 6月标题本命魂穿兜底——当 AI 在6月写了本命太阳而非双子座时强制纠正
  // 🛠️ V108-fix5: Gemini 输出的 "Sun in 双子座第X宫" 格式转为 "太阳双子座第X宫"
  if (lang === 'zh') {
    text = text.replace(/(2027年6月[：:]\s*)太阳(?!双子座)[^·\n座]*座/g, '$1太阳双子座');
    // 修复 Gemini 输出的 "Sun in X座" 格式（全部12个月）
    text = text.replace(/(\d{4}年\d{1,2}月[：:]\s*)Sun\s+in\s+([^·\n]{1,10})(?=\s*[·\n]|$)/g, '$1太阳$2');
  }

  // ═══ V114-fix: 月度天文星座强锁（治Gemini偷懒/换座期幻觉）═══
  // 根因：AI写正文时，遇到换座期/长文本后半段，偷懒套已生成的星座模式
  //        applyMonthLockSanitizer 的正则只匹配"太阳进入X座"等标准格式，
  //        漏了"太阳在X座"/"X座能量"/"当你看到X座"等变体 → 月度星座错乱
  // 解法：章节隔离——以月度标题为锚，正文里所有出现"X座"的句子里，
  //        若X座≠标题星座 → 强制替换为标题星座（不限格式/句式）
  try {
    const _all12 = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
    // 按月份章节切分
    const _secs2 = text.split(/(?=###\s*\d{4}年\d{1,2}月)/g);
    const _fixed2 = _secs2.map(_sec => {
      // 提取当月标题星座
      const _tm = _sec.match(/###\s*\d{4}年\d{1,2}月\s*[：:]\s*太阳([^\s·\n]+座)/);
      if (!_tm) return _sec;
      const _correctSign = _tm[1]; // 如"射手座"
      const _signCore = _correctSign.replace('座','');
      // 定位正文（跳过标题行）
      const _ti = _sec.indexOf('\n', _sec.indexOf('###'));
      if (_ti < 0) return _sec;
      const _hdr2 = _sec.substring(0, _ti + 1);
      let _bod = _sec.substring(_ti + 1);
      // 遍历正文里所有 12 星座，把不是标题星座的强制替换
      // 但排除"本命太阳在X座"/"你的太阳在X座"等本命句式（那是 natal_sun_linter 的活）
      // 简单策略：正文里出现"星座"+"[WRONG]座"→"[CORRECT]座"
      // 更精准：找"太阳在X座"/"太阳进入X座"/"[星座名]座的"等月度语境
      for (const _ws of _all12) {
        if (_ws === _correctSign) continue;
        const _wc = _ws.replace('座','');
        // 跳过含"本命"/"你的"/"此人"/"之人"的行（那是本命语境，不归这里管）
        const _skipLinePat = /(本命太阳|你的太阳|此人|之人|星座是|属于)/;
        const _lines = _bod.split('\n');
        const _newLines = _lines.map(_ln => {
          if (_skipLinePat.test(_ln)) return _ln;
          if (!_ln.includes(_ws)) return _ln;
          // 替换：太阳在[WRONG]座 / 太阳进入[WRONG]座 / [WRONG]座能量 / [WRONG]座的光芒
          return _ln
            .replace(new RegExp('太阳在' + _ws, 'g'), '太阳在' + _correctSign)
            .replace(new RegExp('太阳进入' + _ws, 'g'), '太阳进入' + _correctSign)
            .replace(new RegExp('太阳行经' + _ws, 'g'), '太阳行经' + _correctSign)
            .replace(new RegExp(_ws + '能量', 'g'), _correctSign + '能量')
            .replace(new RegExp(_ws + '的光芒', 'g'), _correctSign + '的光芒')
            .replace(new RegExp('进入' + _ws, 'g'), '进入' + _correctSign)
            .replace(new RegExp('看到' + _ws, 'g'), '看到' + _correctSign);
        });
        _bod = _newLines.join('\n');
      }
      return _hdr2 + _bod;
    });
    text = _fixed2.join('');
  } catch(e) {
    console.warn('[MonthAstroLock] failed:', e.message);
  }

  return text;
}

// 🛠️ V107-方案A: 轻量级预缓存校验器（写缓存前拦截质量问题）
function wealthCriticCheck(text, birthDate, natalSunSign) {
  const issues = [];
  if (!text || text.length < 500) issues.push('内容过短');
  
  // 1. 验证本命太阳星座是否正确出现在前2000字
  if (natalSunSign) {
    const header = text.slice(0, 2000);
    if (!header.includes(natalSunSign)) {
      issues.push('报头缺少' + natalSunSign);
    }
  }
  
  // 2. 验证乱码
  const fffd = (text.match(/\ufffd/g) || []).length + (text.match(/�/g) || []).length;
  if (fffd > 0) issues.push('FFFD残块: ' + fffd);
  
  // 3. 验证孤括号
  if (text.match(/[^（]）》/)) issues.push('孤闭括号');
  
  // 4. 验证关键月份：6月标题必须有双子座
  const juneHeader = text.match(/6月[：:].{0,40}?太阳[^座]*座/);
  if (juneHeader && !juneHeader[0].includes('双子座')) {
    issues.push('6月标题星座错误: ' + juneHeader[0].slice(0, 30));
  }
  
  // 5. 验证 7月 Peak Window 不含射手座
  const julyPeak = text.match(/2026年7月[^🔴🟢]*(?:🟢|🔴)[^。]*?太阳在[^座]*座/g);
  if (julyPeak && julyPeak.some(m => m.includes('射手座'))) {
    issues.push('7月Peak/W太阳座错误(含射手座)');
  }
  
  // 6. 🛠️ 军师审计·P0: 玄秘宫误用——本命太阳非天秤座时不得写"玄秘宫"
  // 天秤座=第3宫(沟通宫)对于上升狮子座；"玄秘宫"=第12宫(巨蟹座)
  if (natalSunSign === '天秤座' && text.slice(0, 3000).includes('玄秘宫')) {
    issues.push('本命天秤座被误归玄秘宫(第12宫)');
  }
  
  // 7. 🛠️ 军师审计·P1: 11月/12月星座串线——正文第一句与标题不符
  // 11月标题天秤座但正文写"太阳进入摩羯座"
  const monthBodies = text.match(/2026年1[12]月[：:][^。]*?太阳进入[^座]{1,3}座/g);
  if (monthBodies) {
    for (const mb of monthBodies) {
      const titleSign = mb.match(/(天蝎座|射手座|天秤座|摩羯座|水瓶座)第/);
      const bodySign = mb.match(/太阳进入[^座]{1,3}(座)/);
      if (titleSign && bodySign && titleSign[1] !== bodySign[1]) {
        issues.push('月度正文星座与标题不匹配:' + mb.slice(0, 40));
      }
    }
  }
  
  // 8. 🛠️ 军师审计·P2: 幽灵相位——"火星形成刑克相位"缺行星对象
  // 在完整句子内检查：含'形成刑克/三分/六分/对分'但同一句内无'与+行星名'
  var sents = text.split(/[。\n]/);
  for (var si = 0; si < sents.length; si++) {
    var s = sents[si];
    if (/形成(刑克|对分|三分|六分|合相)/.test(s) && !/[日月水火木金土]星.*与[日月水火木金土]星/.test(s)) {
      issues.push('幽灵相位:' + s.slice(0, 50));
      break;
    }
  }

  // 9. 🛠️ 军师审计·P3: 双子座元素错——归入土元素
  // 用分割行方式绕过\n在character class中的逃逸问题
  const badElement = text.split('\n').filter(function(l){return l.indexOf('土元素')>=0 && l.indexOf('双子座')>=0;});
  if (badElement) issues.push('双子座被错误归入土元素:' + badElement.join('|'));

  return issues;
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

  // V103-fix18: 断头括号兜底——AI 流式截断导致行星名+）独立成句，替换为逗号
  text = text.replace(/(火星|水星|天王星|冥王星|金星|木星|土星)(？！)(?!在)/g, "$1，");

  // V103-fix21: 通用括号平衡——行内中文左括号（无闭合）→ 行尾补）
  text = text.replace(/（([^）\n]*?)(\s*)(?=\n|$)/g, '（$1$2）');

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
    GEMINI: (() => { const k = getGeminiKey(); return k ? '✓ ' + k.slice(0,8) + '...' : '✗ missing'; })(),
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
  const cacheKey = `wealth:v120:${birthDate}:${lang}:${reportType}`;
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
  // 🛠️ V121-fix: 1月1-19日属于摩羯座（12月22日-1月19日）
  // 反向循环从12月开始，1月早期的日期会漏掉
  if (month === 1 && day < 20) return 9; // 摩羯座
  
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

function buildWealthReportPrompt(birthDate, lang, reportType, astroData, astroMatrix, hasBirthTime = false) {
  if (!reportType) return null;
// 🛠️ V114-fix: Python monthly matrix 太阳在 positions.Sun（非顶层 m.sun），统一 accessor
const _sunOf = (m) => {
  if (m.sun && m.sun.sign) return m.sun;
  if (m.positions?.Sun) return {sign: m.positions.Sun.sign, house: m.positions.Sun.house};
  if (m.sunSignZH) return {sign: m.sunSignZH, house: m.sunHouse};  // astro-truth.js format
  return {sign:'', house:undefined};
};


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
  // 🛠️ V100f: 多语言版（按 lang 选字）
  const SIGN_LOCKS = {
    zh: {Aries:'白羊座', Taurus:'金牛座', Gemini:'双子座', Cancer:'巨蟹座', Leo:'狮子座', Virgo:'处女座', Libra:'天秤座', Scorpio:'天蝎座', Sagittarius:'射手座', Capricorn:'摩羯座', Aquarius:'水瓶座', Pisces:'双鱼座'},
    en: {Aries:'Aries', Taurus:'Taurus', Gemini:'Gemini', Cancer:'Cancer', Leo:'Leo', Virgo:'Virgo', Libra:'Libra', Scorpio:'Scorpio', Sagittarius:'Sagittarius', Capricorn:'Capricorn', Aquarius:'Aquarius', Pisces:'Pisces'},
  };
  const HOUSE_LOCKS = {
    zh: {1:'第1宫',2:'第2宫',3:'第3宫',4:'第4宫',5:'第5宫',6:'第6宫',7:'第7宫',8:'第8宫',9:'第9宫',10:'第10宫',11:'第11宫',12:'第12宫'},
    en: {1:'1st House',2:'2nd House',3:'3rd House',4:'4th House',5:'5th House',6:'6th House',7:'7th House',8:'8th House',9:'9th House',10:'10th House',11:'11th House',12:'12th House'},
  };
  const SIGN_LOCK = SIGN_LOCKS[lang] || SIGN_LOCKS.zh;
  const HOUSE_LOCK = HOUSE_LOCKS[lang] || HOUSE_LOCKS.zh;
  const MONTH_FMT = lang === 'en'
    ? { yearPrefix: (y, m) => `${monthNamesEN[m - 1]} ${y}`, prefix: (y, m) => `${monthNamesEN[m - 1]} ${y}` }
    : { yearPrefix: (y, m) => `${y}年${m}月`, prefix: (y, m) => `${y}年${m}月` };
  const lockedTitles = astroMatrix && astroMatrix.months
    ? astroMatrix.months.map((m, i) => {
        // 🛠️ V114-fix: Python返回positions.Sun，fallback防止空对象
      const sun = m.sun || (m.positions?.Sun ? {sign: m.positions.Sun.sign, house: m.positions.Sun.house} : {});
        const signName = SIGN_LOCK[sun.sign] || sun.sign || '';
        const houseName = HOUSE_LOCK[sun.house] || `House ${sun.house}`;
        const mi = currentMonth - 1 + i;
        const yearPrefix = (currentYear + (mi >= 12 ? 1 : 0));
        const monthNum = (mi % 12) + 1;
        return `#### ${MONTH_FMT.yearPrefix(yearPrefix, monthNum)}: Sun in ${signName} ${houseName} · __[Fill 4-word theme]__`;
      }).join('\n')
    : '';
  const monthLockTable = astroMatrix && astroMatrix.months
    ? '\n⛔ [12-Month Sun Sign Hard-Lock Table — Month titles MUST use exact values below, strictly forbidden to tamper]:\n' +
      'All month titles【Sun Sign】and【House】MUST strictly follow the table below. Forbidden to use other data to extrapolate monthly Sun sign.\n' +
      astroMatrix.months.map((m, i) => {
        const sun = _sunOf(m);
        const signName = SIGN_LOCK[sun.sign] || sun.sign || '';
        const mi = currentMonth - 1 + i;
        const yearPrefix = (currentYear + (mi >= 12 ? 1 : 0));
        const monthNum = (mi % 12) + 1;
        return `  ● ${MONTH_FMT.yearPrefix(yearPrefix, monthNum)}: Sun in ${signName} · House ${sun.house}`;
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
    const monthNamesZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const curMonthName = monthNames[currentMonth - 1];
    const curMonthZH = `${currentYear}年${monthNamesZH[currentMonth-1]}`;

    // ── 月报系统提示词（6语言·Markdown格式·2026-07-19）──
    const MONTHLY_SYSTEM = {
      zh: `You are a master wealth astrologer and clinical psychologist generating a monthly financial report.${instruction}\n\nCRITICAL: You MUST write at least 1200 words.`,
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
• Total length: 1,200-1,500 words (${lang}) — be rich and dense, no fluff
• Style: Epic, destiny-filled, premium quality
• MUST have 6 sections exactly

OUTPUT FORMAT — CLEAN MARKDOWN (6 sections, no JSON):

✦ 🔮 本月命运主题 ✦
[Write 1-2 sentences about the overall monthly financial theme, incorporating the planetary lineup and the native's natal chart]

🟢 第1周 ${curMonthZH}（财富充能）
核心天机：第X日
[Write 150-200 words: describe the financial energy of week 1, key opportunities, recommended actions, important dates. Be specific and actionable.]

🔴 第2周 ${curMonthZH}（高危熔断）
核心天机：第X日
[Write 150-200 words: describe high-risk financial days, potential pitfalls, danger zones. Be specific about which days to avoid major financial decisions.]

🔵 第3周 ${curMonthZH}（顺流蓄力）
核心天机：第X日
[Write 150-200 words: describe the flow state period, gradual momentum building, optimal strategies for this phase.]

🟢 第4周 ${curMonthZH}（财富爆发）
核心天机：第X日
[Write 150-200 words: describe the peak wealth window, maximum financial potential, final push strategies.]

⚠️ 消费陷阱熔断区 ${curMonthZH}
[Write 100-150 words: identify specific spending traps, psychological pitfalls, and provide a concrete "熔断指令" — a clear rule like "单笔消费超过X元必须等24小时冷静期"]

IMPORTANT:
• Write in ${lang} with native astrological and financial terminology
• Use ✦ for section dividers
• Each section must be rich with specific astrological context
• NO English in Chinese output (except universal astrological terms)
• Be dramatic and destiny-filled, not clinical
• ⛔ [句子完整性铁律]: 每个句子必须有完整主语+谓语。禁止句子碎片。`
    };
  }
if (reportType === 'yearly') {
    // ── V97f: 后端天文真值引擎（治本：算死流月太阳/外行星/原型字典，AI 只准抄录）──
    const risingSignZH = astroMatrix?.meta?.rising_sign || 'Cancer';
    // 🛠️ V116 CLEAN: 彻底移除流月真值表、星座原型字典、防幻觉咆哮
    // 数据来源已迁移至 astrology_engine.py 季度 JSON Schema，Prompt 只负责文笔翻译
    // ── 数据消费最高准则（军师V116注入）──
    const DATA_CONSUMPTION_RULE_ZH = `
[数据消费最高准则 - 必须绝对服从]
1. 你的唯一数据源是后端传入的 quarterly_forecast JSON。禁止任何天文计算与星座推导。
2. 撰写某月运势时，该月【太阳星座】与【宫位】必须 100% 提取自 JSON 的 sun_transit.sign 和 sun_transit.house，即使与本命星座冲突也必须以 JSON 为准。
3. active_aspects 数组中每个相位，只能按给定的 formula 进行修辞展开，禁止凭空创造未给出的相位。
4. financial_black_swan 节点包含精确日期与御敌指南，必须原样翻译成叙事体。
`;
    const DATA_CONSUMPTION_RULE_EN = `
[Data Consumption Supreme Guideline - MUST OBEY]
1. Your SOLE data source is the quarterly_forecast JSON from the backend. NO astronomical calculation or sign derivation is permitted.
2. When writing any month's forecast, the Sun sign and House MUST be extracted 100% from JSON's sun_transit.sign and sun_transit.house — even if it conflicts with the user's natal sign.
3. Each aspect in active_aspects MUST be narrated using the given formula only. Never invent unlisted planetary aspects.
4. financial_black_swan contains exact dates and action guidelines — translate verbatim into narrative prose.
`;
    const DATA_CONSUMPTION_RULE_TH = `
[กฎบริโภคข้อมูลสูงสุด - ต้องปฏิบัติตาม]
1. แหล่งข้อมูลเดียวของคุณคือ JSON จาก backend ห้ามคำนวณดาราศาสตร์ด้วยตัวเอง
2. เมื่อเขียนรายเดือน ดวงอาทิตย์และบ้านต้องมาจาก JSON เท่านั้น
3. ดาวเคราะห์ใน active_aspects ต้องใช้สูตรที่ให้มาเท่านั้น ห้ามแต่งเพิ่ม
4. financial_black_swan มีวันที่และคำแนะนำต้องแปลตรงตามที่ให้มา
`;
    const DATA_CONSUMPTION_RULE_VI = `
[Quy Tắc Tiêu Thụ Dữ Liệu Tối Cao - PHẢI TUÂN THỦ]
1. Nguồn dữ liệu duy nhất của bạn là JSON từ backend. Cấm tính toán thiên văn.
2. Khi viết báo cáo hàng tháng, Mặt Trời và Cung phải từ JSON. Tuyệt đối không suy luận riêng.
3. Mỗi góc chiếu trong active_aspects phải theo công thức đã cho, cấm bịa đặt.
4. financial_black_swan có ngày và hướng dẫn phải viết y nguyên.
`;
    const DATA_CONSUMPTION_RULES = {
        zh: DATA_CONSUMPTION_RULE_ZH,
        en: DATA_CONSUMPTION_RULE_EN,
        th: DATA_CONSUMPTION_RULE_TH,
        vi: DATA_CONSUMPTION_RULE_VI,
    };
    const dataRule = DATA_CONSUMPTION_RULES[lang] || DATA_CONSUMPTION_RULE_EN;

    // 简单重建 yearlySystem（只保留系统叙事prompt + 数据消费铁律）
    let yearlySystem = (YEARLY_SYSTEM[lang] || YEARLY_SYSTEM.zh) + '\n' + dataRule;

    // ── V97at: 注入 [ASPECTS_DATA] 块 ──
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
      // 🛠️ V100o FIX: AstroMatrix house 可能是嵌套对象，递归提取数值
      const getHouse = (v) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'object' && v !== null) return v.house ?? v.natal_house ?? v[0] ?? 1;
        return 1;
      };
      const jupHouse = getHouse(first.jupiter?.house);
      const satHouse = getHouse(first.saturn?.house);
      const plHouse = getHouse(first.pluto?.house);
      const sunHouse = getHouse(_sunOf(first).house);
      const moonHouse = getHouse(first.moon?.house);

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
    // 🛠️ V102s: 本命月亮（区别于流月 moonSignLocal），用于报头核心本命代码硬锁
    let natalMoonSign = '', natalMoonSignEN = '';
    let jupHouse = 0, satHouse = 0, plHouse = 0, sunHouse = 0, moonHouse = 0;

    if (astroMatrix && astroMatrix.months && astroMatrix.months[0]) {
      const first = astroMatrix.months[0];
      const rising = astroMatrix.meta?.rising_sign || 'Cancer';
      const getH2 = (v) => typeof v === 'number' ? v : (v?.house ?? v?.natal_house ?? v?.[0] ?? 1);
      jupHouse = getH2(first.jupiter?.house);
      satHouse = getH2(first.saturn?.house);
      plHouse = getH2(first.pluto?.house);
      sunHouse = getH2(_sunOf(first).house);
      moonHouse = getH2(first.moon?.house);
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
      // 🛠️ V100g: LEXICON[lang].signs 返回 SIGNS 对象（12个星座），不是语言名
      const SIGNS_TABLE = LEXICON[lang]?.signs || LEXICON.en.signs;
      // SIGNS[signKey][lang] 返回该语言名
      const signName = (signKey, fallback) => {
        const entry = SIGNS_TABLE[signKey];
        if (entry && typeof entry === 'object' && entry[lang]) return entry[lang];
        return entry && entry.en ? entry.en : (signKey || fallback);
      };
      risingLocal = signName(rising, 'Cancer');
      jupSignLocal = signName(jupSign, 'Leo');
      satSignLocal = signName(satSign, 'Aries');
      moonSignLocal = signName(first.moon?.sign, 'Cancer');
      // 🛠️ V102s: 本命月亮从 SwissEph natal_planets 取真值（报头用），非流月月亮
      const natalMoonEN = astroMatrix.natal_planets?.Moon?.sign || first.moon?.sign || 'Cancer';
      natalMoonSignEN = natalMoonEN;
      natalMoonSign = signName(natalMoonEN, natalMoonEN);

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
    // 🛠️ V102s: 核心本命代码硬锁（太阳+月亮 SwissEph 算死；无出生时间→砍上升，杜绝编造）
    const _mZH = natalMoonSign ? ` · 月亮${natalMoonSign}` : '';
    const _mEN = natalMoonSignEN ? ` · Moon ${natalMoonSignEN}` : '';
    const _mES = natalMoonSign ? ` · Luna ${natalMoonSign}` : '';
    const _mFR = natalMoonSign ? ` · Lune ${natalMoonSign}` : '';
    const _mTH = natalMoonSign ? ` · ดวงจันทร์${natalMoonSign}` : '';
    const _mVI = natalMoonSign ? ` · Mặt Trăng ${natalMoonSign}` : '';
    const _rHB = hasBirthTime && risingLocal;
    const NATAL_CODE = {
      zh: `太阳${natalSunSign}${_mZH}${_rHB?` · 上升${risingLocal}`:''}`,
      en: `Sun ${natalSunSignEN}${_mEN}${_rHB?` · Rising ${risingLocal}`:''}`,
      es: `Sol ${natalSunSign}${_mES}${_rHB?` · Ascendente ${risingLocal}`:''}`,
      fr: `Soleil ${natalSunSign}${_mFR}${_rHB?` · Ascendant ${risingLocal}`:''}`,
      th: `ดวงอาทิตย์${natalSunSign}${_mTH}${_rHB?` · ราศีขึ้น${risingLocal}`:''}`,
      vi: `Mặt Trời ${natalSunSign}${_mVI}${_rHB?` · Cung Mọc ${risingLocal}`:''}`,
    };
    const NO_RISING = {
      zh: hasBirthTime ? '' : '\n⛔ 未提供出生时间：绝对禁止在头部或全文声称任何"上升星座/Ascendant"。核心本命代码只写太阳与月亮，不得追加上升字段。',
      en: hasBirthTime ? '' : '\n⛔ Birth time NOT provided: NEVER state any "Rising/Ascendant" sign anywhere. Core Natal Code contains ONLY Sun and Moon — do NOT append a Rising field.',
      es: hasBirthTime ? '' : '\n⛔ Sin hora de nacimiento: NUNCA indiques un "Ascendente". El Código Natal solo lleva Sol y Luna.',
      fr: hasBirthTime ? '' : '\n⛔ Heure de naissance absente : NE JAMAIS indiquer un "Ascendant". Le Code Natal ne contient que Soleil et Lune.',
      th: hasBirthTime ? '' : '\n⛔ ไม่มีเวลาเกิด: ห้ามระบุ "ราศีขึ้น/Ascendant" เด็ดขาด รหัสดวงชะตาแกนกลางมีแค่ดวงอาทิตย์และดวงจันทร์.',
      vi: hasBirthTime ? '' : '\n⛔ Không có giờ sinh: TUYỆT ĐỐI không nêu "Cung Mọc/Ascendant". Mã Bản Đồ Sao chỉ gồm Mặt Trời và Mặt Trăng.',
    };
    const HE_MAP = {
      zh: `\n\n⛔ [强制头部值 — 不得更改，原样抄录]:\n本用户的本命太阳星座是 ${natalSunSign}（由出生日期 ${birthDate} 经天文计算确定，绝对正确）。\n你的输出头部【元数据】必须精确使用:\n🌌 年度星盘: ${natalSunSign} · 太阳回归年\n🗝️ 核心本命代码: ${NATAL_CODE.zh}\n所有 'X座之人' 必须用 ${natalSunSign}，绝对不得输出其他星座。${NO_RISING.zh}\n若头部元数据出现错误的太阳/月亮星座，生成将被拒绝！`,
      en: `\n\n⛔ [MANDATORY HEADER — DO NOT CHANGE, COPY VERBATIM]:\nThe user's Natal Sun Sign is ${natalSunSignEN} (Swiss Ephemeris, birth date ${birthDate}).\nYOUR HEADER MUST use exactly:\n🌌 Annual Solar Chart: ${natalSunSignEN} · Solar Return\n🗝️ Core Natal Code: ${NATAL_CODE.en}\nAll 'O child of X' MUST use ${natalSunSignEN} — NEVER other signs.${NO_RISING.en}\nIf the header contains a WRONG Sun/Moon Sign, generation will be REJECTED!`,
      es: `\n\n⛔ [CABECERA OBLIGATORIA — NO CAMBIAR, COPIAR VERBATIM]:\nEl Signo Solar Natal del usuario es ${natalSunSign} (Efemérides Suizas, fecha ${birthDate}).\nTU CABECERA DEBE usar exactamente:\n🌌 Carta Solar Anual: ${natalSunSign} · Retorno Solar\n🗝️ Código Natal Central: ${NATAL_CODE.es}\nTodo 'Hijo de X' DEBE usar ${natalSunSign} — NUNCA otros signos.${NO_RISING.es}\nSi la cabecera contiene un Signo ERRÓNEO, la generación será RECHAZADA!`,
      fr: `\n\n⛔ [EN-TÊTE OBLIGATOIRE — NE PAS CHANGER, COPIER VERBATIM]:\nLe Signe Solaire Natal de l'utilisateur est ${natalSunSign} (Éphémérides Suisses, date ${birthDate}).\nTON EN-TÊTE DOIT utiliser exactement:\n🌌 Thème Solaire Annuel: ${natalSunSign} · Retour Solaire\n🗝️ Code Natal Central: ${NATAL_CODE.fr}\nTout 'Enfant de X' DOIT utiliser ${natalSunSign} — JAMAIS d'autres signes.${NO_RISING.fr}\nSi l'en-tête contient un Signe ERRONÉ, la génération sera REJETÉE!`,
      th: `\n\n⛔ [ส่วนหัวบังคับ — ห้ามเปลี่ยน คัดลอกตรงๆ]:\nดวงอาทิตย์ประจำตัวของผู้ใช้คือ ${natalSunSign} (Efemerides Suizas, วันเกิด ${birthDate}).\nส่วนหัวของคุณต้องใช้ตรงๆ:\n🌌 เวลาราศีประจำปี: ${natalSunSign} · การกลับมาของดวงอาทิตย์\n🗝️ รหัสดวงชะตาแกนกลาง: ${NATAL_CODE.th}\nทุกคำว่า 'โอ้บุตรแห่งราศี X' ต้องใช้ ${natalSunSign} — ห้ามใช้ราศีอื่น.${NO_RISING.th}\nหากส่วนหัวมีราศีผิด การสร้างจะถูกปฏิเสธ!`,
      vi: `\n\n⛔ [MANDATORY HEADER — DO NOT CHANGE, COPY VERBATIM]:\nThe user's Natal Sun Sign is ${natalSunSign} (Swiss Ephemeris, birth date ${birthDate}).\nYOUR HEADER MUST use exactly:\n🌌 Bảng Vận Niên: ${natalSunSign} · Năm Cách Mạng Mặt Trời\n🗝️ Mã Bản Đồ Sao Chính: ${NATAL_CODE.vi}\nAll 'O child of X' MUST use ${natalSunSign} — NEVER other signs.${NO_RISING.vi}\nIf header contains wrong Sun/Moon Sign, generation will be REJECTED!`,
    };
    yearlySystem += (HE_MAP[lang] || HE_MAP.en);

    return {
      system: yearlySystem,
      user: `
⛔ [天文真值铁律]: 只准使用 AstroMatrix 提供的外行星数据（木星/土星/冥王星/太阳/月亮）。未提供的行星（火星/凯龙/北交点等）不得写具体星座或宫位，只能描述原型特质（"行动力强"/"开创精神"），禁止"火星在XX座"或"火星在第X宫"。

⛔ [火星/凯龙禁则]: 绝对禁止在年报正文（除 Black Swan Day 断路器警告外）写"火星在XX座"或"火星在第X宫"。

⛔ [Black Swan Day 火星 Transit 规则]: 火星不在 AstroMatrix 固定外行星列表中，但其 2026-2027 年真实 Transit 位置有明确天文学事实，可以写入。具体规则：
- 2026年7月-8月：火星在狮子座（6月21日离开巨蟹进入狮子，9月23日才进处女）
- 2026年11月30日-12月：火星在处女座（9月23日进处女，2027年1月中旬才离）
- 2027年2月-3月：火星在处女座/天秤座（1月中旬进天秤）
- 2027年5月：火星在狮子座（4月中旬进狮子，6月中旬离）
若 Black Swan Day 涉及火星相位，**必须**按上述真实 Transit 位置写，例如："（火星在狮子座与XX形成XX相位）"。绝对不得写"火星在处女座"给7月/8月的日子，也不得写"火星在XX座"给任何不在上述窗口的日子。
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


DYNAMIC DATE CALCULATION (CRITICAL):
• Report cycle starts from current month: ${currentYear}年${monthNamesZH[currentMonth-1]}
• Report covers exactly 12 months: ${monthsRange}
• The user's Solar Return cycle anchors the annual forecast
• ALL dates must be dynamically calculated — ZERO hardcoded dates allowed

⛔ MERCURY RETROGRADE 2026 (FIXED — reference these, but adapt to user's Solar Return):
• MR#2: June 12 - July 7, 2026 (partially overlaps current cycle)
• MR#3: July 18 - August 11, 2026 (CRITICAL: July 18 is the real H2 Mercury Rx start!)
• MR#4: October 7 - October 28, 2026

⛔ [Mercury Rx 周期句式铁律]: 当描述 Mercury 逆行周期时，**必须**构成完整句，主语+谓语齐全。正确示范："水星逆行期间（2月9日至3月3日），财务文件签署需格外谨慎，你的沟通可能出现误解。" 错误示范（截断/缺谓语）："2月9日至3月3日，水星，财务文件需要格外小心。" 禁止将日期范围+"水星"单独成句后不接谓语。

⛔ NEVER write dates like "2026年6月2026年6月" or duplicated/corrupted dates.
⛔ NEVER repeat the year inside month descriptions.

REQUIREMENTS:
• Total length: 6,000-8,000 words (${lang})
• Style: Epic, destiny-filled, ultra-premium ($29.99 value)
• ⛔ [句子完整性铁律]: 每个句子必须有完整主语+谓语。禁止逗号/句号后直接跟名词性短语不接谓语（如"X，财务文件需要格外小心"或"Y，沟通可能出现误解"都是病句）。月度和章节段落的每句话都必须读起来完整，不允许"句子碎片"。
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
    // 🛠️ V102s: 是否真提供出生时间（未提供→报头不声称上升）
    const hasBirthTime = typeof req.body.birthTime === 'string' && req.body.birthTime.trim().length > 0;
    if (!birthDate) return res.status(400).json({ success: false, error: 'birthDate required' });

    // ═══ 军师缓存键：wealth:{生日}:{语言}:{类型} ═══
    const reportType = req.body.reportType || 'oracle';
    const cacheKey = `wealth:v120:${birthDate}:${lang}:${reportType}`;
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
          // V103-fix6: 标准化旧缓存，确保格式统一
          const stdCached = standardizeReport(cachedText);
          // 返回缓存数据（包装成前端期望的格式）
          // 🛠️ V120: 月报返回 markdown 纯文本
          return res.json({ success: true, cached: true, report: stdCached });
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
        }, astroMatrix, hasBirthTime);
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
    // 🛠️ V115-fix3: Body 正文本命太阳全护（在 linter 前全量扫射）
    // 根因：AI 在长文后半段偶发"作为X座之人"等句式，natal_sun_linter 只护句式骨架
    // 治法：在 linter 前全量替换12星座名 → 本命真值（覆盖所有句式变体）
    if (realSunSign) {
      ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].forEach(wrong => {
        if (wrong === realSunSign) return;
        // 斩断所有句式变体
        const _patterns = [
          new RegExp(`作为${wrong}之人`, 'g'),
          new RegExp(`${wrong}之人`, 'g'),
          new RegExp(`你是${wrong}`, 'g'),
          new RegExp(`${wrong}的你`, 'g'),
          new RegExp(`双鱼座(?!座)`, 'g'),  // 防止双鱼座座
        ];
        _patterns.forEach(p => { cleanedText = cleanedText.replace(p, realSunSign); });
      });
    }
        const sanitizedAI = natal_sun_linter(astro_phase_linter(final_text_sanitizer(aiResult, ascendant)), natalSunSign);

        // 🛠️ V107-fix3: MISS 路径补全 applyMonthLockSanitizer（此前只跑了 MISS 的 HIT 和流式端点，非流式 MISS 漏了）
        const monthLocked = (reportType === 'yearly' && astroMatrix)
          ? applyMonthLockSanitizer(sanitizedAI, astroMatrix, null, null, lang)
          : sanitizedAI;

        // Parse AI result
        let reportContent = monthLocked;

        // ── ⛔ 时间线强行熔断重组（防 DeepSeek Streaming 污染）──
        if (reportType === 'yearly') {
          reportContent = cleanYearlyTimeline(monthLocked);
        }

        if (reportType === 'monthly') {
          // 🛠️ V120: 月报返回 markdown 纯文本（前端正名为流式打字机）
          reportContent = sanitizedAI; // 月报 prompt 已改为 markdown 格式，直接发送
        }
        
        console.log('[Wealth Oracle] Report generated successfully, length:', aiResult.length);
        
        // 🛠️ V107-方案A: 预缓存校验器（硬拦截——发现问题就不写缓存，触发重刷）
        let skipCache = false;
        if (reportType === 'yearly') {
          const criticIssues = wealthCriticCheck(reportContent, birthDate, natalSunSign);
          if (criticIssues.length > 0) {
            console.error('[CRITIC] 🚨 缓存前校验发现问题, 跳过缓存写入:', JSON.stringify(criticIssues));
            skipCache = true;
          } else {
            console.log('[CRITIC] 预缓存校验通过 ✅');
          }
        }
        
        // ═══ 写入缓存（非流式端点）═══
        if (SB_URL && SB_KEY && reportContent && reportContent.length > 100 && !skipCache) {
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
                insight: standardizeReport(reportContent),
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

    // ── V9 塔罗方向锁 prompt（从 web/api/ai-advisor.js 迁移，2026-07-19）──
    const tarotOrient = (req.body.tarot && req.body.tarot.orientation) ? req.body.tarot.orientation : '';
    const isReversed = tarotOrient.includes('Reversed') || tarotOrient.includes('Invertido') || tarotOrient.includes('Inversé') || tarotOrient.includes('กลับด้าน') || tarotOrient.includes('Ngược');
    const isUpright  = tarotOrient.includes('Upright')  || tarotOrient.includes('Derecho')   || tarotOrient.includes('Droit')     || tarotOrient.includes('ตั้งตรง') || tarotOrient.includes('Xuôi');

    // 各语言塔罗正逆位强制锁（从 V9 迁移）
    const tarotLock =
      lang === 'zh' ? (isReversed ? '【强制】塔罗牌为逆位，全程禁止出现"正位"或"Upright"字样。' : isUpright ? '【强制】塔罗牌为正位，全程禁止出现"逆位"或"Reversed"字样。' : '') :
      lang === 'en' ? (isReversed ? '[LOCK] Tarot is Reversed. FORBIDDEN: upright, Upright, 正位. ALWAYS say Reversed.' : isUpright ? '[LOCK] Tarot is Upright. FORBIDDEN: reversed, Reversed, 逆位. ALWAYS say Upright.' : '') :
      lang === 'es' ? (isReversed ? '[BLOQUEO] La carta es Invertido. PROHIBIDO: upright, Derecho.' : isUpright ? '[BLOQUEO] La carta es Derecho. PROHIBIDO: inverted, Invertido.' : '') :
      lang === 'fr' ? (isReversed ? '[VERROU] La carte est Inversé. DÉFENDU: upright, Droit.' : isUpright ? '[VERROU] La carte est Droit. DÉFENDU: reversed, Inversé.' : '') :
      lang === 'th' ? (isReversed ? '[🔒] ไพ่กลับด้าน ห้ามพูด"ตั้งตรง"หรือ"Upright"แม้แต่คำเดียว' : isUpright ? '[🔒] ไพ่ตั้งตรง ห้ามพูด"กลับด้าน"หรือ"Reversed"แม้แต่คำเดียว' : '') :
      lang === 'vi' ? (isReversed ? '[KHOÁ] Lá bài là Ngược. CẤM: Xuôi, Upright. Luôn nói Ngược.' : isUpright ? '[KHOÁ] Lá bài là Xuôi. CẤM: Ngược, Reversed. Luôn nói Xuôi.' : '') :
      '';

    const bazi = req.body.bazi || '未知';
    const zodiac = req.body.zodiac || '未知';
    const iching = req.body.iching || '未知';

    const prompt = reportType === 'compatibility'
      ? (lang === 'zh' ? `${tarotLock}${tarotLock ? ' ' : ''}你是一位资深命理情感顾问。综合八字${bazi}、星座${zodiac}、易经${iching}的数据，对 ${d1} 和 ${d2} 的合盘给出温暖、专业、积极的4句话情感洞察。只用中文输出，不预测分手或负面结局，始终给予希望和具体行动建议。` :
        lang === 'en' ? `${tarotLock}${tarotLock ? ' ' : ''}You are the AI relationship advisor for KindredSouls. Based on: Bazi=${bazi}, Zodiac=${zodiac}, I Ching=${iching}. Give 4 warm, professional, positive sentences of relationship insight for ${d1} and ${d2}. Only English. Never predict breakups. Always give hope and specific actionable advice.` :
        lang === 'es' ? `${tarotLock}${tarotLock ? ' ' : ''}Eres el consejero sentimental IA de KindredSouls. Basado en: Bazi=${bazi}, Zodiaco=${zodiac}, I Ching=${iching}. Da 4 frases cálidas y positivas sobre ${d1} y ${d2}. Solo español. Nunca predigas ruptura.` :
        lang === 'fr' ? `${tarotLock}${tarotLock ? ' ' : ''}Tu es le conseiller sentimental IA de KindredSouls. Basé sur: Bazi=${bazi}, Zodiac=${zodiac}, I Ching=${iching}. Donne 4 phrases chaleureuses et positives sur ${d1} et ${d2}. Seulement français. Ne prédis jamais de rupture.` :
        lang === 'th' ? `${tarotLock}${tarotLock ? ' ' : ''}คุณเป็นที่ปรึกษาความสัมพันธ์ AI ของ KindredSouls จากข้อมูล: บาซี=${bazi}, ราศี=${zodiac}, อี้จิง=${iching} ให้ 4 ประโยคที่อบอุ่นและเชิงบวกเกี่ยวกับความสัมพันธ์ระหว่าง ${d1} และ ${d2} เป็นภาษาไทยเท่านั้น` :
        lang === 'vi' ? `${tarotLock}${tarotLock ? ' ' : ''}Bạn là cố vấn mối quan hệ AI của KindredSouls. Dựa trên: Bazi=${bazi}, Zodiac=${zodiac}, I Ching=${iching}. Đưa ra 4 câu ấm áp, tích cực về mối quan hệ giữa ${d1} và ${d2}. Chỉ tiếng Việt. Không dự đoán chia tay.` :
        `分析 ${d1} 和 ${d2} 的命理合盘。温暖、积极的情感解读。`)
      : `分析 ${d1} 的财富格局。专业财富建议，禁止输出其他语言。`;


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

// ───────────────────────────────────────────────────────────────────────
// V103-fix6: 报告内容标准化（统一章节格式，解决缓存/实时生成不一致）
// 写入缓存前调用，确保所有缓存数据格式统一
// ───────────────────────────────────────────────────────────────────────
function standardizeReport(text) {
  if (!text || typeof text !== 'string') return text;
  let t = text;

  // 0. 蒸发图片残留碎屑
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, '');  // ![](...)
  t = t.replace(/!\[[^\]]*\]/g, '');              // 裸 ![alt]

  // 1. 主标题头拆分——命运宿主从标题行剥离（若有）
  // 处理 "## ✦ 先知神谕 · 财富启示录 ✦ * ◆ **命运宿主**" 单行问题
  t = t.replace(/(\s)\* ◆ \*\*命运宿主\*\*:?\s*/g, '\n命运宿主：');

  // 2. 章节标题统一注入 ✦（主要章节：第一章~第五章 + 最终财富神谕）
  // 模式：## [emoji]? 第X章/最终财富神谕 + 可选内容
  // 只处理还没有 ✦ 的行，避免重复注入
  const chapterMap = [
    // 第一章~第五章
    [/^(\s*)(## [\p{Emoji}]*\s*)(第一章：[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    [/^(\s*)(## [\p{Emoji}]*\s*)(第二章：[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    [/^(\s*)(## [\p{Emoji}]*\s*)(第三章：[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    [/^(\s*)(## [\p{Emoji}]*\s*)(第四章：[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    [/^(\s*)(## [\p{Emoji}]*\s*)(第五章：[^✦\n]*?)(\s*)$/um,  '$1✦\n$2$3 ✦\n$4'],
    // 最终财富神谕
    [/^(\s*)(## [\p{Emoji}]*\s*)(最终财富[^✦\n]*?)(\s*)$/um, '$1✦\n$2$3 ✦\n$4'],
  ];
  for (const [pattern, replacement] of chapterMap) {
    if (!pattern.test(t)) { pattern.lastIndex = 0; if (pattern.test(t)) {} } // reset
    t = t.replace(pattern, replacement);
  }

  // 3. 换行修复：月份标题前 + 子章节前 + 分割线前后
  t = t.replace(/####\s*📅/g, '\n#### 📅');
  t = t.replace(/###\s+/g, '\n### ');
  t = t.replace(/---/g, '\n---\n');

  // V103-fix14: 清理月份标题中的 "Sun in"（不依赖 ### 📅，覆盖所有格式）
  t = t.replace(/(\d{4}年\d{1,2}月):\s*Sun\s+in\s+/g, '$1: ');

  // V103-fix17: 末尾 trim + 消除章节标题前的残留空格
  // Step3 的 `###\s+` 注入换行，但若文本本身以空格开头会变成 "\\n 第一章"；此行兜底清理
  t = t.replace(/\n +(\*{0,2}\s*(?:第[一二三四五六七八九十\d]+章|最终财富|通关密令))/g, '\n$1');

  // 🛠️ V107-fixB3: 终极乱码清洗——standardizeReport 的 emoji regex 和 ✦ 注入在 Unicode 处理中
  // 可能产生二次 FFFD 乱码。此刀作为返回前最后一道防线，不依赖之前的位置标记，直接通杀
  t = t.replace(/[\uFFFD]/g, '').replace(/[\uFFFE\uFFFF]/g, '').trim();

  return t;
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
  // 🛠️ V102s: 是否真提供出生时间（未提供→报头不声称上升）
  const hasBirthTime = typeof req.body.birthTime === 'string' && req.body.birthTime.trim().length > 0;
  console.log(`[wealth-stream] [STREAM] Stream request: ${birthDate}/${lang}/${reportType}`);

  // 🛠️ V122-fix: SSE 心跳保活——Railway hikari 代理在 AI 首字延迟/生成停顿期会因 idle 掐断长连接 (curl 92 / ERR_HTTP2_PROTOCOL_ERROR)；每 8s 发注释事件保活
  const _hb = setInterval(() => {
    try { res.write(': heartbeat\n\n'); if (typeof res.flush === 'function') res.flush(); } catch (e) {}
  }, 8000);
  res.on('close', () => {
    try { clearInterval(_hb); } catch (e) {}
    console.warn('[wealth-stream] ⚠️ 连接关闭:', { destroyed: res.destroyed, writableEnded: res.writableEnded, writableFinished: res.writableFinished });
  });
  res.on('error', (e) => console.error('[wealth-stream] ❌ res error:', e && e.message));


  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-Deploy-Marker', 'V124-keep-alive');
  res.setHeader('Connection', 'keep-alive'); // V121 原生，防 Railway hikari 提前 RST


  // 🔥 军师缓存键：wealth:{生日}:{语言}:{类型}
  const cacheKey = `wealth:v120:${birthDate}:${lang}:${reportType}`;
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
        // ── V113: 缓存命中 → 完美终稿直传（写入时已清洗，读取时零处理）──
        console.log(`[wealth-stream] [HIT] Cache HIT: ${cacheKey}, length=${cachedText.length}, instant response`);
        // V113: 写入时已跑完全套清洗，缓存=完美终稿；读取时零处理直接分块 SSE 输出
        // V113-fix: 缓存已是完美终稿，直接分块 SSE 输出，跳过双重清洗
        // V113-fix3: HIT路径补全全套处理链，与MISS client内容完全一致
        // HIT路径重新计算 realSunSign（定义在MISS路径，不在HIT路径作用域）
        const [_, bm2, bd2] = birthDate.split('-').map(Number);
        const _signs2 = ['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座'];
        const _cuts2 = [[1,20,1],[2,19,2],[3,21,3],[4,20,4],[5,21,5],[6,22,6],[7,23,7],[8,23,8],[9,23,9],[10,24,10],[11,22,11],[12,22,0]];
        let _si = 0;
        for (let _ci = _cuts2.length-1; _ci>=0; _ci--) { if (bm2>_cuts2[_ci][0]||(bm2===_cuts2[_ci][0]&&bd2>=_cuts2[_ci][1])) {_si=_cuts2[_ci][2]; break;} }
        const _rs = _signs2[_si];
        const streamText = cachedText;  // V113-fix5: 缓存已是cleanedText，零处理直接用
        // V103: 瞬时分块流（Instant Chunking）——放弃单次巨量事件，按 ~2000字切片，骗过 Railway 代理避免截断
        // 前端 sacredText += chunk 累加缓冲区本就支持多事件，完美兼容
        const CHUNK_SIZE = 2000;
        const totalChunks = Math.ceil(streamText.length / CHUNK_SIZE);
        for (let i = 0; i < streamText.length; i += CHUNK_SIZE) {
          const chunk = streamText.slice(i, i + CHUNK_SIZE);
          res.write(Buffer.from(`data: ${JSON.stringify({ text: chunk })}\n\n`, 'utf-8'));
          if (typeof res.flush === 'function') res.flush();
        }
        // V113-fix2: 发送 sanitized 事件，确保前端与 MISS 路径一致
        res.write(Buffer.from(`data: ${JSON.stringify({ sanitized: streamText })}\n\n`, 'utf-8'));
        res.write('data: [DONE]\n\n');
        if (typeof res.flush === 'function') res.flush();
        res.end();
        console.log(`[wealth-stream] [OK] Cache instant chunked complete, ${streamText.length} chars`);
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
          insight: text,  // V113-fix4: 写入不洗，读取洗，彻底消除双次标准化差异
          prompt_version: `v1.0.0-stream-${reportType}-${lang}`,
          created_at: new Date().toISOString(),
        })
      });
      console.log(`[wealth-stream] [WRITE] Cache write: ${cacheKey}, length=${text.length}, status=${res2.status}`);
    } catch (e) {
      console.error('[wealth-stream] [WRITE-ERROR] ' + (cacheKey||'?') + ': ' + (e && e.message) + (e && e.stack ? ' | ' + e.stack.split('\n')[1] : ''));
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
    }, astroMatrix, hasBirthTime);  // ← Pass V69 matrix + hasBirthTime to prompt builder

    // ── V97r: prompt 脏字符清洗（… → ...，防 ByteString 死锁）──
    if (prompt) {
      prompt.system = prompt.system.replace(/[\u2026]/g, '...');

      // 🛠️ V116-final: V1端点加第五章空间宫位前置铁律（V2已加，V1漏了）
      prompt.system += '\n\n【⚠️ 空间财富对齐硬性铁律 —— 严禁幻觉】\n在撰写第五章时，你必须像执行编译器代码一样，毫无保留地严格遵守以下物理空间与占星宫位的固定隐喻，严禁将其替换为任何流年行运宫位：\n1. 卧室区域：必须且只能描述为“第四宫（田宅宫）”，代表财富根基与守藏。\n2. 厨房区域：必须且只能描述为“第二宫（财帛宫）与第八宫（共享资源）”，代表食禄与滋养之源。\n3. 财务室/保险柜：必须且只能描述为“第八宫（共享资源）”，代表核心资产与偏财。\n\n【输出格式控制】：每一个空间的标题行必须严格使用以下加粗纯文本，严禁夹杂任何斜杠或自行脑补的星座（如白羊座/土星等杂质）：\n* **卧室区域：第四宫（田宅宫）**\n* **厨房区域：第二宫（财帛宫）与第八宫（共享资源）**\n* **财务室/保险柜：第八宫（共享资源）**';
      prompt.user = prompt.user.replace(/[\u2026]/g, '...');
    }

    if (!prompt) {
      res.write(Buffer.from(`data: ${JSON.stringify({ error: 'Invalid reportType' })}

`, "utf-8"));
      return res.end();
    }

    const deepseekKey = getDeepSeekKey();
    const geminiKey = process.env.GEMINI_API_KEY;
    // 🔧 V75 fix: 64000 彻底解除年报截断
    // 🛠️ V125-final: 删除所有 OpenRouter 残留，纯 DeepSeek 直连
    let maxTokens = reportType === 'yearly' ? 48000 : 4000;
    const controller = new AbortController();
    try { aiTimeout = setTimeout(() => controller.abort(), 600000); } catch(e){}

    // 🛠️ V108-fix2: 年报优先走 Gemini 2.5 Pro（输出上限高），非年报走 DeepSeek（快）
    let usedGemini = false;
    let aiRes = null;
    let aiStream = false;
    let geminiFullText = '';

    // 🛠️ V131-final: 统一走 callDeepSeekStream（native fetch），废弃所有 Gemini/https.request 降级路径
    if (!deepseekKey) {
      clearTimeout(aiTimeout);
      res.write(Buffer.from(`data: ${JSON.stringify({ error: 'AI service unavailable (no key)' })}\n\n`, 'utf-8'));
      return res.end();
    }
    try {
      geminiFullText = await callDeepSeekStream(prompt.system, prompt.user, controller, res, (chunk) => {
        fullTextCollector += chunk;
        }, astroMatrix, realSunSign, lang);
      if (geminiFullText && geminiFullText.trim().length > 0) {
        aiStream = true;
      }
    } catch(e) {
      console.error('[wealth-stream] [V131] DeepSeek stream FAILED: ' + (e.message || String(e)));
    }

    // V100i: 英文标点清洗（去除中文全角标点污染）
    // V103-fix8: 清理 DeepSeek AI 输出时在换行前加的多余空格（"word \n" → "word\n"）
    const langPunctuationClean = (text, lang) => {
      // 通用清理：先清 literal \\n，再清换行前空格，再清多余空格
      text = text.replace(/\\n/g, '\n'); // literal \n 转实际换行
      text = text.replace(/ \n/g, '\n'); // 清理换行前空格
      text = text.replace(/  +/g, ' ');   // 清理连续多余空格
      if (lang === 'en') {
        return text
          .replace(/——/g, ' — ')
          .replace(/——/g, ' -- ')
          .replace(/·/g, ' | ')
          .replace(/　/g, ' '); // 全角空格
      }
      return text;
    };
    let cleanedText = langPunctuationClean(fullTextCollector, lang);
    // 🛠️ V102s: 流式端点接入完整清洗器（此前只跑 langPunctuationClean，漏了宫位降维/月锁/前世清洗）
    const _ascStream = astroMatrix?.meta?.rising_sign || 'Cancer';
    // 🛠️ V104e: 本命太阳断言器 + 反向括号补丁
    // 🛠️ V115-fix3: MISS流式路径 Body 正文本命太阳全护
    if (realSunSign) {
      ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].forEach(wrong => {
        if (wrong === realSunSign) return;
        const _r1 = new RegExp(`作为${wrong}之人`, 'g');
        const _r2 = new RegExp(`${wrong}之人`, 'g');
        const _r3 = new RegExp(`你是${wrong}`, 'g');
        cleanedText = cleanedText.replace(_r1, realSunSign).replace(_r2, realSunSign).replace(_r3, realSunSign);
      });
    }
    cleanedText = natal_sun_linter(astro_phase_linter(final_text_sanitizer(cleanedText, _ascStream)), realSunSign, _ascStream);
    cleanedText = applyMonthLockSanitizer(cleanedText, astroMatrix, null, null, lang);

    // 🛠️ V122-fix: 终极空括号清理（final_text_sanitizer 可能漏 “（）” 跨块，
    //   完整文本这里再扣一遍）
    cleanedText = cleanedText.replace(/（）/g, '').replace(/\(\)/g, '');
    cleanedText = cleanedText.replace(/([\u4e00-\u9fa5])（）([\u4e00-\u9fa5])/g, '$1$2');
    cleanedText = cleanedText.replace(/[（(][A-Za-z][A-Za-z0-9 ,.'":;\-]{0,40}?[）)](?=[\u4e00-\u9fa5])/g, '');

    // 🛠️ V108-fix8: MISS 流式路径补 standardizeReport（HIT 路径已调用，此处漏掉导致章节 ✦ 注入缺失）
    cleanedText = standardizeReport(cleanedText);

    // 🛠️ V108-fix1: 终极乱码清洗——sanitized 事件前最后一次 FFFD 清扫
    cleanedText = cleanedText.replace(/\uFFFD/g, '').replace(/�/g, '');

    // V100i2: 用清洗后的完整文本替换显示（清除中文标点污染）
    // V113-fix5: client sanitized 和 writeToCache 都用 cleanedText（标准化后），同一终稿
    if (cleanedText !== fullTextCollector) {
      try {
        res.write(Buffer.from(`data: ${JSON.stringify({ sanitized: cleanedText })}\n\n`, 'utf-8'));
      } catch(e) {}
    }

    // 流式结束，发送 [DONE]
    res.write('data: [DONE]\n\n');
    if (typeof res.flush === 'function') res.flush();

    // 🛠️ V125-fix: streaming结束立即写缓存（不依赖completion是否成功）
    if (cleanedText.length > 100) {
      console.log(`[wealth-stream] [WRITE-CACHE] Streaming done, writing ${cleanedText.length} chars to cache: ${cacheKey}`);
      writeToCache(cleanedText).catch((e) => {
        console.error('[wealth-stream] [WRITE-CACHE-ERROR] ' + cacheKey + ': ' + (e && e.message));
      });
    } else {
      console.warn('[wealth-stream] [WRITE-CACHE-SKIP] cleanedText too short: ' + cleanedText.length + ' chars');
    }

    res.end();

    // 后台补全（非必须，不影响缓存）
    // 年报完成判断：英文用 'Final Wealth Oracle'，中文用 '最终财富神谕'
    const hasFinalOracle = fullTextCollector.includes('Final Wealth Oracle') ||
      fullTextCollector.includes('The Final Wealth Oracle') ||
      fullTextCollector.includes('最终财富神谕');
    const isComplete = reportType === 'yearly'
      ? (hasFinalOracle && fullTextCollector.length > 8000)
      : (fullTextCollector.length > 500);

    if (!isComplete && fullTextCollector.length > 100) {
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
            max_tokens: 64000,
            temperature: 0,
            seed: seedFromUserPrompt(prompt.user),
          })),
        });
        if (fullRes.ok) {
          const fdata = await fullRes.json();
          let ft = fdata.choices?.[0]?.message?.content || '';
          // 🛠️ V102s: 补全文本也过一道完整清洗再落库（防脏缓存）
          if (ft) ft = applyMonthLockSanitizer(astro_phase_linter(final_text_sanitizer(langPunctuationClean(ft, lang), _ascStream)), astroMatrix, null, null, lang);
          // 🛠️ V104e: 也有反向括号隐患
          // 🛠️ V115-fix3: Completion路径 Body 正文本命太阳全护
          if (realSunSign) {
            ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].forEach(wrong => {
              if (wrong === realSunSign) return;
              const _r1 = new RegExp(`作为${wrong}之人`, 'g');
              const _r2 = new RegExp(`${wrong}之人`, 'g');
              ft = ft.replace(_r1, realSunSign).replace(_r2, realSunSign);
            });
          }
          if (ft) ft = natal_sun_linter(ft, realSunSign, _ascStream);
          if (ft && ft.length > cleanedText.length) {
            console.log(`[wealth-stream] [OK] Completion success, ${ft.length} chars > ${cleanedText.length}, caching full text`);
            writeToCache(ft).catch(() => {});
          } else {
            console.log(`[wealth-stream] [WARN] Completion returned ${ft.length} chars (stream had ${cleanedText.length}), caching cleaned stream`);
            writeToCache(cleanedText).catch(() => {});
          }
        } else {
          const errBody = await fullRes.text().catch(() => '');
          console.error(`[wealth-stream] [ERROR] Completion failed ${fullRes.status}: ${errBody.slice(0, 200)}`);
          writeToCache(cleanedText).catch(() => {});
        }
      } catch (e) {
        console.error('[wealth-stream] 补全失败，落库清洗版本:', e.message);
        writeToCache(cleanedText).catch(() => {});
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

// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// 🌊 V116: /api/wealth-oracle/v2 — 分片滚动年报引擎
// 架构：V69月度数据 → JS季度聚合 → 4×Gemini实时SSE流 → 缓存落库
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/wealth-oracle/v2', async (req, res) => {
  const {
    birthDate,
    birthTime = '12:00',
    lat = 13.75,
    lon = 100.5,
    tz = 'Asia/Bangkok',
    lang = 'zh',
  } = req.body;
  if (!birthDate) return res.status(400).json({ error: 'birthDate required' });

  // ── SSE Headers ──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('X-Deploy-Marker', 'V124-keep-alive');
  res.setHeader('Connection', 'keep-alive');

  const send = (obj) => {
    try {
      const data = typeof obj === 'string' ? obj : JSON.stringify(obj);
      res.write(Buffer.from('data: ' + data + '\n\n', 'utf-8'));
      if (typeof res.flush === 'function') res.flush();
    } catch(e) {}
  };
  const flush = () => { try { if (typeof res.flush === 'function') res.flush(); } catch(e) {} };
  const heartbeat = setInterval(() => { send(': heartbeat\n\n'); flush(); }, 20000);

  const sendStatus = (text) => { send(JSON.stringify({ type: 'status', text })); flush(); };
  const sendChunk = (text) => { send(JSON.stringify({ type: 'chunk', text })); flush(); };
  const sendText = (text) => { send(JSON.stringify({ type: 'text', text })); flush(); };

  let allText = '';

  try {
    // ── Step 1: V69 月度数据（通过HTTP调用Python引擎）──
    sendStatus('🔮 命运推演引擎启动...');
    const matrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz);
    if (!matrix || !matrix.months || matrix.months.length === 0) {
      throw new Error('V69 engine unavailable — 无法获取星盘数据');
    }
    console.log('[V2] V69 OK: ' + matrix.months.length + ' months, rising=' + (matrix.meta && matrix.meta.rising_sign));

    // ── Step 2: 月度→季度聚合 ──
    const months = matrix.months;
    const meta = matrix.meta || {};
    const risingSign = meta.rising_sign || 'Cancer';

    const SIGN_MAP_ZH = { Aries:'白羊',Taurus:'金牛',Gemini:'双子',Cancer:'巨蟹',Leo:'狮子',Virgo:'处女',Libra:'天秤',Scorpio:'天蝎',Sagittarius:'射手',Capricorn:'摩羯',Aquarius:'水瓶',Pisces:'双鱼' };

    // ── Step 3: System Prompt ──
    const localeMap = { zh: 'zh', en: 'en', fr: 'fr', es: 'es', th: 'th', vi: 'vi' };
    const locale = localeMap[lang] || 'zh';
    const sysPrompt = getSystemPromptByLocale(locale);

    // 🛠️ V116-Bug1-fix: 第五章空间宫位前置锁死（不在事后擦屁股，前置约束）
    const CHAPTER5_CONSTRAINT = `

【第五章：空间财富对齐硬性格式规范】
在撰写第五章（空间/家居/办公室财富对齐）时，你必须严格且毫无例外地遵守以下产品设计隐喻，严禁自行更换宫位或添加其他星座杂质：
1. 卧室区域：必须且只能描述为"第四宫（田宅宫）"，代表财富根基与安全感。
2. 厨房区域：必须且只能描述为"第二宫（财帛宫）与第八宫（共享资源）"。
3. 财务室/保险柜：必须且只能描述为"第八宫（共享资源）"。
4. 客厅/入口/前台/工位/会议室等区域：保持与前述章节一致的宫位描述，不得自行发明宫位。

【强制输出格式模板】：每一个空间的开头必须严格使用如下纯文本结构（用于前端渲染）：
* **卧室区域：第四宫（田宅宫）**
* **厨房区域：第二宫（财帛宫）与第八宫（共享资源）**
* **财务室区域：第八宫（共享资源）**
严禁添加任何括号外的星座名或宫位变体。`;
    const v2SysPrompt = sysPrompt + CHAPTER5_CONSTRAINT;

    // ── Step 4: 年度引言 ──
    // 🛠️ V121-fix: Python 服务未返回本命太阳星座，用 JavaScript 计算覆盖 fallback
    const birthParts = birthDate.split('-');
    const birthYear = parseInt(birthParts[0]);
    const birthMonth = parseInt(birthParts[1]);
    const birthDay = parseInt(birthParts[2]);
    
    // JavaScript 星座计算函数（同 getZodiacIdx）
    const getNatalSunIdx = (m, d) => {
      const cuts = [[1,20,1],[2,19,2],[3,21,3],[4,20,4],[5,21,5],[6,22,6],[7,23,7],[8,23,8],[9,23,9],[10,24,10],[11,22,11],[12,22,0]];
      for (let i = cuts.length - 1; i >= 0; i--) {
        if (m > cuts[i][0] || (m === cuts[i][0] && d >= cuts[i][1])) return cuts[i][2];
      }
      return 0;
    };
    const SIGNS_EN = ['Capricorn','Aquarius','Pisces','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius'];
    const jsNatalSunSign = SIGNS_EN[getNatalSunIdx(birthMonth, birthDay)];
    
    const natalSunSign = jsNatalSunSign || meta.sun_sign || 'Pisces';
    const natalMoonSign = meta.moon_sign || 'Cancer';
    const natalRising = risingSign;
    const natalSunZH = SIGN_MAP_ZH[natalSunSign] || natalSunSign;
    const natalMoonZH = SIGN_MAP_ZH[natalMoonSign] || natalMoonSign;
    const natalRisingZH = SIGN_MAP_ZH[natalRising] || natalRising;
    // 用第1个月的数据取年度主星
    const m0Jup = months[0] && months[0].jupiter ? months[0].jupiter.sign : 'Leo';
    const m0Sat = months[0] && months[0].saturn ? months[0].saturn.sign : 'Aries';
    const jupSignZH = SIGN_MAP_ZH[m0Jup] || m0Jup;
    const satSignZH = SIGN_MAP_ZH[m0Sat] || m0Sat;

    sendStatus('✨ 正在书写年度宏观战略...');
    const factSheet = buildFactSheet(matrix, locale) || '';

    // ── 格式化生日（1997-03-18 → 1997年3月18日）──
    const birthDateFormatted = (function() {
      const parts = birthDate.split('-');
      return parts[0] + '年' + parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
    })();

    const introPrompt = v2SysPrompt + '\n\n[V116-V2 INTRO]: 生成年报开场章节（500-800字）。\n\n★ 用户出生日期（必须写入报头，不得虚构）：' + birthDateFormatted + '\n★ 年度星盘（报头必须精确引用）：\n太阳' + natalSunZH + '座 / 月亮' + natalMoonZH + '座 / 上升' + natalRisingZH + '座\n木星' + jupSignZH + '座（年度机遇主星）/ 土星' + satSignZH + '座（年度业力考验）\n\n【报头铁律】：以上星座必须100%使用中文（如双鱼座、摩羯座），严禁使用英文（如Pisces、Capricorn）。\n\n' + factSheet + '\n\n请生成包含报头和年度宏观战略简介的章节，以[V116-V2 INTRO]标签标注。';

    const introText = await streamGeminiChunk(introPrompt, sendChunk);
    allText += introText + '\n\n';
    sendText(introText);
    console.log('[V2] 引言: ' + introText.length + '字');

    // ── Step 5: 逐月滚动（12个月）──
    for (let i = 0; i < months.length; i++) {
      const m = months[i];
      const monthName = m.month_name || ('Month ' + (i + 1));
      const sun = m.sun || {};
      const jupiter = m.jupiter || {};
      const saturn = m.saturn || {};
      const pluto = m.pluto || {};
      const sunSignZH = SIGN_MAP_ZH[sun.sign] || sun.sign || '';
      const jupSignZH_m = SIGN_MAP_ZH[jupiter.sign] || jupiter.sign || '';
      const satSignZH_m = SIGN_MAP_ZH[saturn.sign] || saturn.sign || '';
      const pluSignZH = SIGN_MAP_ZH[pluto.sign] || pluto.sign || '';
      const peakWindows = m.peak_windows || [];
      const crisisDays = m.black_swan_days || [];

      const transition = '\n\n---\n\n## ✦ ' + monthName + '\n\n';
      send(JSON.stringify({ type: 'transition', text: transition }));
      flush();
      allText += transition;

      sendStatus('🔮 ' + monthName + ' 运势撰写中...（' + (i+1) + '/12）');

      // 峰值窗口
      var peakBlock = '';
      if (peakWindows.length > 0) {
        for (var pi = 0; pi < Math.min(2, peakWindows.length); pi++) {
          var pw = peakWindows[pi];
          peakBlock += '★ 峰值窗口：' + (pw.date || '') + '（' + (pw.type || '收入高峰') + ' in ' + (pw.sign || '') + '）\n';
        }
      }
      // 黑天鹅
      var crisisBlock = '';
      if (crisisDays.length > 0) {
        for (var ci = 0; ci < Math.min(1, crisisDays.length); ci++) {
          var cd = crisisDays[ci];
          crisisBlock += '★ 危机警示日：' + (cd.date || '') + ' ' + (cd.aspect || '') + '\n';
        }
      }

      var mPrompt = v2SysPrompt + '\n\n[V116-V2-M' + (i+1) + ']: 生成' + monthName + '月度章节（800-1200字）。\n\n★ 月份：' + monthName + '\n★ 太阳行运：' + sunSignZH + '座第' + (sun.house || '?') + '宫\n★ 木星行运：' + jupSignZH_m + '座第' + (jupiter.house || '?') + '宫\n★ 土星行运：' + satSignZH_m + '座第' + (saturn.house || '?') + '宫\n★ 冥王行运：' + pluSignZH + '座第' + (pluto.house || '?') + '宫\n' + peakBlock + crisisBlock + factSheet + '\n\n请以[V116-V2-M' + (i+1) + ']标签标注输出本章。';

      const mText = await streamGeminiChunk(mPrompt, sendChunk);
      // 🔒 V116-step8-fix: 月度标题即时锁（applyMonthLockSanitizer的regex不匹配V2格式）
      let mTextLocked = mText;
      if (m.sun && m.sun.sign) {
        const sunSignCorrect = { Aries:'白羊',Taurus:'金牛',Gemini:'双子',Cancer:'巨蟹',Leo:'狮子',Virgo:'处女',Libra:'天秤',Scorpio:'天蝎',Sagittarius:'射手',Capricorn:'摩羯',Aquarius:'水瓶',Pisces:'双鱼' }[m.sun.sign] || m.sun.sign;
        // V116-Bug3-fix
      let mTextLocked = mText;
      if(m.sun&&m.sun.sign){
        const monthEscaped=monthName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const signMap={Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座'};
        const correctSun=signMap[m.sun.sign]||(m.sun.sign+'座');
        const titleRe=new RegExp('(##\\s*[\\u2606*]\\s*'+monthEscaped+'\\s*[:：]\\s*太阳)[^\n]{1,30}?(座)','g');
        mTextLocked=mText.replace(titleRe,'$1'+correctSun);
      }
      }
      allText += mTextLocked + '\n\n';
      // Bug4实时锁
      let mTextSanitized=mTextLocked;
      try{mTextSanitized=natal_sun_linter(astro_phase_linter(final_text_sanitizer(mTextLocked,natalRising)),natalSunSign,natalRising);mTextSanitized=cleanGarbageCharacters(mTextSanitized);}catch(e){mTextSanitized=mTextLocked;}
      sendText(mTextSanitized);
      console.log('[V2] M' + (i+1) + ' (' + monthName + '): ' + mText.length + '字');
    }

    // ── Step 6: 结语 ──
    const outroText = '\n\n---\n\n## 🌌 结语\n\n年报至此终结。愿你在星辰的指引下，握紧属于你的财富主权。\n\n*KindredSouls V116 · 命运主权觉醒系统*\n';
    sendText(outroText);
    allText += outroText;

    // ── Step 7: V116八层清洗链(Bug1~Bug4全硬锁) ──
    allText = englishSignToChinese(allText);      // 刀0(报头英文→中文回归)
    allText = cleanGarbageCharacters(allText);    // 刀1(Bug4)
    allText = forceSpaceHouseSanitizer(allText);  // 刀2(Bug1)
    allText = final_text_sanitizer(allText, natalRising);
    allText = astro_phase_linter(allText);
    allText = natal_sun_linter(allText, natalSunSign, natalRising);
    allText = applyMonthLockSanitizer(allText, matrix, null, null, lang);
    allText = v2_monthly_title_lock(allText, matrix.months);
    allText = impossible_aspect_guard(allText);
    allText = standardizeReport(allText);
    allText = cleanGarbageCharacters(allText);    // 刀10(Bug4)

    // ── Step 8: DONE ──
    send(JSON.stringify({ sanitized: allText }));
    send('data: [DONE]\n\n');
    res.end();
    clearInterval(heartbeat);

    // ── Step 8: 缓存落库（异步）──
    const SB_URL = process.env.SUPABASE_URL;
    const SB_KEY = process.env.SUPABASE_SERVICE_KEY;
    const v2CacheKey = 'wealth:v116-v2:' + birthDate + ':' + lang + ':yearly';
    if (SB_URL && SB_KEY && allText.length > 500) {
      try {
        await safeFetch(SB_URL + '/rest/v1/ai_insights_cache?cache_key=eq.' + encodeURIComponent(v2CacheKey), {
          method: 'DELETE',
          headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
        });
        await safeFetch(SB_URL + '/rest/v1/ai_insights_cache', {
          method: 'POST',
          headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ cache_key: v2CacheKey, insight: allText, prompt_version: 'v116-v2-rolling', created_at: new Date().toISOString() })
        });
        console.log('[V2] 缓存写入: ' + v2CacheKey + ' (' + allText.length + '字)');
      } catch(e) { console.warn('[V2] 缓存写入失败: ' + e.message); }
    }
    console.log('[V2] ✅ 完成: ' + birthDate + '/' + lang + '，总字数: ' + allText.length);

  } catch (err) {
    console.error('[V2] ❌ 错误: ' + err.message);
    clearInterval(heartbeat);
    send(JSON.stringify({ error: err.message }));
    try { res.end(); } catch(e2) {}
  }
});

// ── Gemini流式调用辅助函数 ──
async function streamGeminiChunk(prompt, onChunk) {
  const geminiKey = getGeminiKey();
  if (!geminiKey) throw new Error('GEMINI_API_KEY not configured');
  let attempt = 0;
  let fullText = '';

  // ── Step 1: 尝试 Gemini 2.0 Flash ──
  while (attempt < 2) {
    attempt++;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);
      const response = await safeFetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:streamGenerateContent?alt=sse&key=' + geminiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: new TextEncoder().encode(JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 4096, temperature: 0.75 }  // V116-step8b: 8192→4096，留足余量防截断
          })),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (!response.ok) throw new Error('Gemini HTTP ' + response.status);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            const txt = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (txt) { fullText += txt; onChunk(txt); }
          } catch(e) {}
        }
      }
      // 🔒 V116-step8-fix: flush末尾无\n的最后一个SSE event（防末段截断）
      if (buffer.trim()) {
        const t = buffer.trim();
        if (t.startsWith('data: ')) {
          try {
            const p = JSON.parse(t.slice(6));
            const tx = p?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (tx) { fullText += tx; onChunk(tx); }
          } catch(e) {}
        }
      }
      console.log('[V2] Gemini成功: ' + fullText.length + '字');
      return fullText;
    } catch(err) {
      console.warn('[V2] Gemini尝试' + attempt + '失败: ' + err.message);
      // 429 = 配额耗尽 → 立即切 DeepSeek，不重试
      if (err.message.includes('429') || err.message.includes('429')) {
        console.warn('[V2] Gemini配额耗尽，切换DeepSeek兜底...');
        break;
      }
      if (attempt >= 2) throw new Error('Gemini连续失败: ' + err.message);
      await new Promise(function(r) { setTimeout(r, 2000); });
    }
  }

  // ── Step 2: DeepSeek 兜底（Gemini 429 或 Gemini 连续失败）──
  if (!fullText) {
    const deepseekKey = getDeepSeekKey();
    if (!deepseekKey) throw new Error('Gemini配额耗尽，DeepSeek也不可用');
    console.warn('[V2] 使用DeepSeek兜底...');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);
      const res = await safeFetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + deepseekKey },
        body: new TextEncoder().encode(JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 8192,
          temperature: 0.6,
          stream: true,
        })),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('DeepSeek HTTP ' + res.status);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            const txt = parsed.choices?.[0]?.delta?.content || '';
            if (txt) { fullText += txt; onChunk(txt); }
          } catch(e) {}
        }
      }
      // 🔒 V116-step8-fix: DeepSeek流同理flush末尾残留buffer
      if (buffer.trim()) {
        const t = buffer.trim();
        if (t.startsWith('data: ')) {
          try {
            const p = JSON.parse(t.slice(6));
            const tx = p?.choices?.[0]?.delta?.content || '';
            if (tx) { fullText += tx; onChunk(tx); }
          } catch(e3) {}
        }
      }
      console.log('[V2] DeepSeek成功: ' + fullText.length + '字');
    } catch(e2) {
      throw new Error('Gemini配额耗尽，DeepSeek也失败: ' + e2.message);
    }
  }
  return fullText;
}

// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V116 Impossible Aspect Guard
// 修复 Bug3（军师）："火星在双子座与天王星在双子座形成四分相"
// 天文学：同星座两天体只能形成合相，四分相/对分相/六分相必须跨星座
// 本函数检测"行星A在X座与行星B在X座[非合相相位]"并移除非法相位描述
// ═══════════════════════════════════════════════════════════════════════
function impossible_aspect_guard(text) {
  if (!text || !text.includes('座与') && !text.includes('座和')) return text;
  // 匹配：行星在X座[与/和]行星在X座[相位名]
  // 只处理：X座 ≠ X座（同星座），且相位 ≠ 合相/同宫
  const RE_SAME_SIGN_ASPECT = /([\u4e00-\u9fa5星曜]+星?)(在[\u4e00-\u9fa5]{1,3}座)(?:与|和)([\u4e00-\u9fa5星曜]+星?)(在)([\u4e00-\u9fa5]{1,3}座)((?:精准)?(?:四分相|对分相|六分相|三分相|刑克|拱照|三分|六分))(：?)/g;
  return text.replace(RE_SAME_SIGN_ASPECT, function(match, p1, sign1, p2, _kw, sign2, aspect, colon) {
    if (sign1 !== sign2) return match; // 不同星座，不处理
    // 同星座但写的是非合相相位 → 移除非法相位描述
    const conj = (aspect.includes('合相') || aspect.includes('同宫')) ? aspect : '（合相）';
    return p1 + sign1 + '与' + p2 + sign2 + conj + colon;
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 🔒 V2 Monthly Title Lock（V116-step8补丁）
// Bug2 根因：applyMonthLockSanitizer 匹配 "## 2027年6月：太阳XX座"
// 但 V2 月度标题是 "## ✦ 2027年6月：太阳XX座"，regex 不命中
// 本函数直接对 allText 做 12 个月针对性替换
// ═══════════════════════════════════════════════════════════════════════
function v2_monthly_title_lock(text, months) {
  if (!text || !months || !Array.isArray(months)) return text;
  const SIGN_ZH = { Aries:'白羊座',Taurus:'金牛座',Gemini:'双子座',Cancer:'巨蟹座',Leo:'狮子座',Virgo:'处女座',Libra:'天秤座',Scorpio:'天蝎座',Sagittarius:'射手座',Capricorn:'摩羯座',Aquarius:'水瓶座',Pisces:'双鱼座' };
  const SIGNS = ['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座','Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  const signRe = new RegExp('(' + SIGNS.join('|') + ')', 'g');
  let t = text;
  for (const m of months) {
    const monthName = m.month_name;
    if (!monthName || !m.sun) continue;
    const correctSign = SIGN_ZH[m.sun.sign] || (m.sun.sign + '座');
    const correctHouse = m.sun.house ? ('第' + m.sun.house + '宫') : '';
    const idx = t.indexOf(monthName);
    if (idx === -1) continue;
    const lineEnd = t.indexOf('\n', idx);
    const segEnd = lineEnd === -1 ? Math.min(idx + 80, t.length) : lineEnd;
    const seg = t.slice(idx, segEnd);
    let newSeg = seg.replace(signRe, correctSign);
    if (correctHouse) {
      newSeg = newSeg.replace(/第[一二三四五六七八九十百0-9]{1,3}宫/g, correctHouse);
    }
    t = t.slice(0, idx) + newSeg + t.slice(segEnd);
  }
  return t;
}

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

// ── Groq API Test Endpoint ──────────────────────────────────────────────────
// GET /api/test-groq?key=YOUR_KEY
// 测试 Railway → Groq 是否可达 + key 是否有效
app.get('/api/test-groq', async (req, res) => {
  const groqKey = req.query.key || process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.json({ error: 'No Groq key provided. Add ?key=YOUR_KEY' });
  }
  try {
    const start = Date.now();
    const apiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say "GROQ_OK" in exactly that format.' }],
        max_tokens: 10,
        temperature: 0,
      }),
    });
    const latency = Date.now() - start;
    const data = await apiRes.json();
    if (!apiRes.ok) {
      return res.json({ ok: false, status: apiRes.status, error: data.error?.message || data, latency_ms: latency });
    }
    return res.json({ ok: true, latency_ms: latency, model: data.model, response: data.choices[0].message.content });
  } catch (e) {
    return res.json({ ok: false, error: e.message });
  }
});

// ── Groq 内容质量对比测试端点 ─────────────────────────────────────────────
// GET /api/compare-llm
// 用同一份 prompt 分别测 Groq 和 DeepSeek，输出内容和耗时用于对比
app.get('/api/compare-llm', async (req, res) => {
  const GROQ_KEY = process.env.GROQ_API_KEY || process.env.GROQ_KEY || req.query.groq_key;
  const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
  
  // 诊断：环境变量状态
  const envDiag = {
    GROQ_API_KEY_exists: !!process.env.GROQ_API_KEY,
    GROQ_API_KEY_length: process.env.GROQ_API_KEY?.length || 0,
    GROQ_KEY_exists: !!process.env.GROQ_KEY,
    DEEPSEEK_API_KEY_exists: !!process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_API_KEY_length: process.env.DEEPSEEK_API_KEY?.length || 0,
  };
  const testPrompt = req.query.prompt || 
    '请为以下星盘写一段200字的中文财富月报：\n太阳星座：射手座 | 上升星座：天蝎座 | 月亮星座：双子座\n要求：专业有深度，像真正的占星师在说话，直接输出不要废话。';

  const results = {};

  // 测 Groq
  if (GROQ_KEY) {
    const start = Date.now();
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: testPrompt }], max_tokens: 512, temperature: 0.7 }),
      });
      const d = await r.json();
      results.groq = { ok: r.ok, latency_ms: Date.now() - start, status: r.status, text: d.choices?.[0]?.message?.content || d.error?.message, chars: (d.choices?.[0]?.message?.content || '').length };
    } catch(e) { results.groq = { ok: false, latency_ms: Date.now() - start, error: e.message }; }
  } else { results.groq = { ok: false, error: 'GROQ_KEY not set' }; }

  // 测 DeepSeek
  if (DEEPSEEK_KEY) {
    const start = Date.now();
    try {
      // 强制 ASCII 编码，防止 Unicode 字符导致 header 错误
      const cleanKey = Buffer.from(DEEPSEEK_KEY).toString('ascii');
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cleanKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: testPrompt }], max_tokens: 512, temperature: 0.7 }),
      });
      const d = await r.json();
      results.deepseek = { ok: r.ok, latency_ms: Date.now() - start, status: r.status, text: d.choices?.[0]?.message?.content || d.error?.message, chars: (d.choices?.[0]?.message?.content || '').length };
    } catch(e) { results.deepseek = { ok: false, latency_ms: Date.now() - start, error: e.message }; }
  } else { results.deepseek = { ok: false, error: 'DEEPSEEK_API_KEY not set' }; }

  res.json({ results, env_diag: envDiag, prompt_length: testPrompt.length });
});
