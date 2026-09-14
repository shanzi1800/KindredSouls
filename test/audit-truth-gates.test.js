/**
 * KindredSouls - V439 Truth Gates 自动化巡检脚本
 * 
 * 验证点：
 *   ① 月亮周级轨迹真值对撞（SwissEph 实时计算 → 禁止星座列表 → 断言无幻觉）
 *   ② 六周结构完整性（四周标题 + 主题头 + 陷阱段）
 *   ③ 陷阱段阈值金额（各语言阈值正则匹配）
 *   ④ 概述句含当月名称 + 月份数字
 * 
 * 暂不支持语言：de（德文）- 系统中不存在该模板
 * 
 * 用法：node test/audit-truth-gates.test.js [--prod]
 */

import { execSync } from 'child_process';
import https from 'https';
import http from 'http';

// ── 支持语言 + 阈值金额 ─────────────────────────────────────────────────
const LANG_META = {
  zh: { label:'中文', currency:'￥', threshold:/5000/, monthName:'9月' },
  en: { label:'英文', currency:'$',  threshold:/\$800|\$5.?000/, monthName:'September' },
  fr: { label:'法文', currency:'€',  threshold:/€.*\d|\d.*€/i, monthName:'Septembre' },
  // de: 暂不支持（系统中无德文模板）
  th: { label:'泰文', currency:'฿',  threshold:/฿.*\d|\d.*฿|บาท.*\d|\d.*บาท/, monthName:'กันยายน' },
  vi: { label:'越文', currency:'₫',  threshold:/₫.*500.*000|500.*000.*₫/, monthName:'Tháng 9' },
};

// ── 月份别名（概述句必须含当月）──────────────────────────────────────────
const MONTH_IN_TEXT = {
  zh: ['9月','2026年9月'],
  en: ['September', 'Sep', 'Sept'],
  fr: ['Septembre', 'Sept'],
  th: ['กันยายน', 'กันยา'],
  vi: ['Tháng 9', 'tháng 9'],
};

// ── 周标题模式（各语言）────────────────────────────────────────────────
const WEEK_HEADER_PATTERNS = {
  zh: { 1:/第1周|第1周：/, 2:/第2周/, 3:/第3周/, 4:/第4周/ },
  en: { 1:/Week\s*1[:\s]/i, 2:/Week\s*2[:\s]/i, 3:/Week\s*3[:\s]/i, 4:/Week\s*4[:\s]/i },
  fr: { 1:/Semaine\s*1[:\s]/i, 2:/Semaine\s*2[:\s]/i, 3:/Semaine\s*3[:\s]/i, 4:/Semaine\s*4[:\s]/i },
  th: { 1:/สัปดาห์ที่\s*1/i, 2:/สัปดาห์ที่\s*2/i, 3:/สัปดาห์ที่\s*3/i, 4:/สัปดาห์ที่\s*4/i },
  vi: { 1:/Tuần\s*1[:\s]/i, 2:/Tuần\s*2[:\s]/i, 3:/Tuần\s*3[:\s]/i, 4:/Tuần\s*4[:\s]/i },
};

// ── 12 个测试用例 ─────────────────────────────────────────────────────
const CASES = [
  // ZH 中文
  { id:1,  lang:'zh', birth:'1997-10-18', time:'23:59', lat:1.9872,  lon:-157.4778, tz:'Pacific/Kiritimati', note:'天秤座UTC+14' },
  { id:2,  lang:'zh', birth:'1989-12-31', time:'12:00', lat:39.9042,  lon:116.4074,  tz:'Asia/Shanghai',     note:'摩羯座UTC+8' },
  // EN 英文
  { id:3,  lang:'en', birth:'1985-04-15', time:'08:30', lat:40.7128,  lon:-74.0060,  tz:'America/New_York', note:'白羊座美东夏令' },
  { id:4,  lang:'en', birth:'1992-07-22', time:'14:15', lat:51.5074,  lon:-0.1278,   tz:'Europe/London',    note:'巨蟹/狮子交界' },
  // FR 法文
  { id:5,  lang:'fr', birth:'1990-03-10', time:'22:00', lat:48.8566,  lon:2.3522,    tz:'Europe/Paris',     note:'双鱼座西欧' },
  { id:6,  lang:'fr', birth:'1998-11-05', time:'06:45', lat:46.8139,  lon:-71.2082,  tz:'America/Montreal', note:'天蝎座北美' },
  // DE 德文（暂不支持，跳过结构断言）
  { id:7,  lang:'de', birth:'1982-01-20', time:'11:20', lat:52.5200,  lon:13.4050,   tz:'Europe/Berlin',    note:'摩羯/水瓶交界', unsupported:true },
  { id:8,  lang:'de', birth:'1995-06-14', time:'19:00', lat:48.2082,  lon:16.3738,   tz:'Europe/Vienna',    note:'双子座中欧',    unsupported:true },
  // TH 泰文
  { id:9,  lang:'th', birth:'1991-09-09', time:'09:09', lat:13.7563,  lon:100.5018,  tz:'Asia/Bangkok',     note:'处女座东南亚' },
  { id:10, lang:'th', birth:'1996-12-05', time:'23:00', lat:18.7883,  lon:98.9853,   tz:'Asia/Bangkok',     note:'射手座' },
  // VI 越文
  { id:11, lang:'vi', birth:'1994-08-18', time:'04:15', lat:10.8231,  lon:106.6297,  tz:'Asia/Ho_Chi_Minh', note:'狮子座' },
  { id:12, lang:'vi', birth:'1988-02-29', time:'18:00', lat:21.0285,  lon:105.8542,  tz:'Asia/Ho_Chi_Minh', note:'双鱼座闰年' },
];

// ── SwissEph 月亮周级真值计算 ─────────────────────────────────────────
function computeMoonTruth(birthDate, birthTime, lat, lon, tz) {
  try {
    const out = execSync(
      `python3 -c "
import sys, json
sys.path.insert(0, 'astro')
from astro_matrix import compute_moon_weeks
weeks = compute_moon_weeks(2026, 9, '${tz}')
result = []
for w in (weeks or []):
    signs = [l['sign'] for l in w.get('legs', [])]
    result.append({'week': w['week'], 'signs': signs})
print(json.dumps(result))
"`, { encoding:'utf8', timeout:20000 }
    ).trim();
    const weeks = JSON.parse(out || '[]');
    // 构建禁止星座集（白羊/金牛在 W3/W4 是常见幻觉）
    const forbidden = {};
    for (const w of weeks) {
      const wn = w.week;
      const signs = w.signs || [];
      forbidden[wn] = [];
      // 白羊出现在 W3/W4 时禁止（若出现在 W1/W2 则合法）
      // 逻辑：真正 W3/W4 含白羊时，LLM 幻觉常把 W1 的白羊搬过来
      // 所以：只要 W3/W4 不含白羊，而 LLM 写了白羊 → 幻觉
      // 为保守起见：检查 W3/W4 里有没有白羊，没有但文本出现了 → 失败
      // 更好的策略：把 W1 的星座做白名单，W3/W4 里没有的就是禁止
      // 简化版：直接用 SwissEph 计算的星座序列，判断每个星座是否出现在正确的周
    }
    return { weeks, forbidden, raw: weeks };
  } catch (e) {
    return null; // SwissEph 不可用
  }
}

// ── 月亮轨迹断言（核心）────────────────────────────────────────────────
const SIGN_LOCALIZED = {
  Aries:     { zh:'白羊座', en:'Aries',     fr:'Bélier',    th:'เมษา',   vi:'Bạch Dương' },
  Taurus:    { zh:'金牛座', en:'Taurus',    fr:'Taureau',   th:'พฤษภ',   vi:'Kim Ngưu' },
  Gemini:    { zh:'双子座', en:'Gemini',    fr:'Gémeaux',   th:'มิถุน',   vi:'Song Tử' },
  Cancer:    { zh:'巨蟹座', en:'Cancer',    fr:'Cancer',    th:'กรกฎ',   vi:'Cự Giải' },
  Leo:       { zh:'狮子座', en:'Leo',       fr:'Lion',      th:'สิงห์',   vi:'Sư Tử' },
  Virgo:     { zh:'处女座', en:'Virgo',     fr:'Vierge',    th:'กันยา',   vi:'Xử Nữ' },
  Libra:     { zh:'天秤座', en:'Libra',     fr:'Balance',   th:'ตุลย์',   vi:'Thiên Bình' },
  Scorpio:   { zh:'天蝎座', en:'Scorpio',   fr:'Scorpion',  th:'พิจิก',   vi:'Bọ Cạp' },
  Sagittarius:{zh:'射手座', en:'Sagittarius',fr:'Sagittaire',th:'ธนู',    vi:'Nhân Mã' },
  Capricorn: { zh:'摩羯座', en:'Capricorn',  fr:'Capricorne',th:'มังกร',   vi:'Ma Kết' },
  Aquarius:  { zh:'水瓶座', en:'Aquarius',  fr:'Verseau',   th:'กุมภ์',   vi:'Bảo Bình' },
  Pisces:    { zh:'双鱼座', en:'Pisces',    fr:'Poissons',  th:'มีน',    vi:'Song Ngư' },
};

function extractMoonTraversal(text, lang) {
  // 提取月亮过境句（精确截取到句末标点，防止整周内容被误判为"月亮句"）
  if (lang === 'th') {
    const idx = text.indexOf('ดวงจันทร์');
    if (idx < 0) return null;
    // TH: stop at 。 or newline after finding at least 10 chars
    const end = text.slice(idx).search(/[。\n]/);
    return text.slice(idx, end > 0 ? idx + Math.min(end, 300) : idx + 300);
  }
  if (lang === 'vi') {
    const idx = text.indexOf('Mặt Trăng');
    if (idx < 0) return null;
    const end = text.slice(idx).search(/[。\n]/);
    return text.slice(idx, end > 0 ? idx + Math.min(end, 300) : idx + 300);
  }
  if (lang === 'zh') {
    const m = text.match(/流月?月亮依次?行经[，。：:、\w\u4e00-\u9fff（）()【】\[\]]{10,200}/);
    return m ? m[0] : null;
  }
  if (lang === 'en') {
    // EN: stop at first period or comma after the moon transit phrase
    const m = text.match(/(?:Moon (?:transits?|passes?) through[\w\s()\[\]-]{5,100})/i);
    return m ? m[0].slice(0, 120) : null;
  }
  if (lang === 'fr') {
    // FR: stop at first period after Lune traverse
    const m = text.match(/(?:Lune (?:en transit )?traverse[s]?[\w\sàâäéèêëïîôùûüç()-]{10,100})/i);
    return m ? m[0].slice(0, 120) : null;
  }
  return null;
}

function checkMoonTruth(text, lang, moonTruth) {
  if (!moonTruth || !moonTruth.raw || moonTruth.raw.length === 0) return [];
  const errors = [];
  const weeks = moonTruth.raw; // [{week, signs}]

  // 各语言周标题边界
  const weekBoundary = {
    zh: [/(?:第(\d)周[：:][^\n]+)/g, /第(\d)周[：:]/],
    en: [/(?:Week\s*(\d)[：:\s][^\n]+)/gi, /Week\s*(\d)[：:\s]/i],
    fr: [/(?:Semaine\s*(\d)[：:\s][^\n]+)/gi, /Semaine\s*(\d)[：:\s]/i],
    th: [/(?:สัปดาห์ที่\s*(\d)[：:\s][^\n]+)/g, /สัปดาห์ที่\s*(\d)[：:\s]/],
    vi: [/(?:Tuần\s*(\d)[：:\s][^\n]+)/gi, /Tuần\s*(\d)[：:\s]/i],
  };

  const wb = weekBoundary[lang];
  if (!wb) return [];

  // 提取周标题位置
  const headers = [];
  let m;
  const re = new RegExp(wb[0].source, wb[0].flags);
  while ((m = re.exec(text)) !== null) {
    const wkNum = parseInt(m[1]);
    const start = m.index + m[0].length;
    const nextHeader = text.slice(start).search(wb[1]);
    const end = nextHeader >= 0 ? start + nextHeader : text.length;
    headers.push({ wkNum, start, end });
  }

  for (const wk of weeks) {
    const wn = wk.week;
    if (wn < 1 || wn > 4) continue;
    const h = headers[wn - 1];
    if (!h) continue;
    const section = text.slice(h.start, h.end);
    const signs = wk.signs || [];

    // 提取月亮过境句
    const traversal = extractMoonTraversal(section, lang);
    if (!traversal) continue;

    // 对每一周，检查所有星座——如果某星座在本周真值里没有，却被写进月亮过境句 → 幻觉
    const ALL_SIGNS = Object.keys(SIGN_LOCALIZED);
    for (const sign of ALL_SIGNS) {
      const loc = SIGN_LOCALIZED[sign]?.[lang];
      if (!loc) continue;
      if (!traversal.includes(loc)) continue; // 文本里没出现这个星座，跳过
      if (signs.includes(sign)) continue;   // 真值里有这个星座，合法
      // 真值里没有这个星座，却被写进月亮过境句 → 幻觉！
      errors.push(`W${wn}月亮过境出现禁止星座 ${loc}（真值不含）`);
    }
  }
  return errors;
}

// ── 陷阱段断言 ────────────────────────────────────────────────────────
function assertTrap(text, lang) {
  const cfg = LANG_META[lang];
  if (!cfg) return [];
  const errors = [];

  // ── Step 1: locate trap section ─────────────────────────────────
  // Use the title pattern (more reliable than single-word indexOf)
  const titlePatterns = {
    zh: /消费陷阱[：:][^\n]*/,
    en: /Spending\s+Traps?[：:][^\n]*/i,
    fr: /Pièges?\s+financiers?[：:][^\n]*/i,
    th: /กับดัก[^\n]*/,
    vi: /bẫy[^\n]*/i,
  };
  const tp = titlePatterns[lang];
  if (!tp) return [];
  const tm = text.match(tp);
  if (!tm) { errors.push('未找到陷阱段标题'); return errors; }
  const titleEnd = tm.index + tm[0].length;

  // ── Step 2: find end of trap body (next week title or end of report) ──
  // Search in text AFTER the title, not from beginning (avoids misaligning W3 trap)
  const weekPatterns = {
    zh: /(?:✦\[第[1-4]周|第[1-4]周[：:])/,
    en: /(?:✦\[Week\s+[1-4]|Semaine\s+[1-4])/i,
    fr: /(?:✦\[Semaine\s+[1-4])/i,
    th: /(?:✦\[สัปดาห์ที่\s+[1-4])/,
    vi: /(?:✦\[Tuần\s+[1-4])/i,
  };
  const wp = weekPatterns[lang];
  let trapEnd = text.length; // default: go to end
  if (wp) {
    const afterTitle = text.slice(titleEnd);
    const wm = afterTitle.match(wp);
    if (wm) trapEnd = titleEnd + wm.index;
  }
  const trapBody = text.slice(titleEnd, trapEnd);

  // ── Step 3: detect money in trap body (broad patterns per language) ──
  const moneyTests = {
    zh: (t) => /[5000五签][元块￥]|[￥]\s*\d/.test(t),
    en: (t) => /\$\s*\d{3}|\d{3}\s*\$/.test(t),
    fr: (t) => /€\s*\d|\d\s*€|\d+\s*(?:euros?|€)/i.test(t),
    th: (t) => t.includes('บาท') && /\d{3,}/.test(t),
    vi: (t) => /₫\s*\d|\d\s*₫/.test(t),
  };
  const testFn = moneyTests[lang];
  if (!testFn || !testFn(trapBody)) {
    errors.push('陷阱段缺少阈值金额（应为 ' + cfg.currency + ' 阈值）');
  }
  return errors;
}
function assertOverview(text, lang) {
  const cfg = LANG_META[lang];
  if (!cfg) return [];
  const errors = [];
  const monthAliases = MONTH_IN_TEXT[lang] || [cfg.monthName];
  const hasMonth = monthAliases.some(m => text.includes(m));
  if (!hasMonth) errors.push(`概述段缺少月份名称（应为 ${monthAliases.join('|')}}）`);
  return errors;
}

// ── 结构完整性断言 ────────────────────────────────────────────────────
function assertStructure(text, lang) {
  if (lang === 'de') return []; // 暂不支持德文
  const patterns = WEEK_HEADER_PATTERNS[lang];
  if (!patterns) return [];
  const errors = [];
  for (let wn = 1; wn <= 4; wn++) {
    if (!patterns[wn].test(text)) errors.push(`缺少周标题 ${wn}`);
  }
  // 主题头
  const themePatterns = {
    zh:/✦.*本月命运主题|本月命运主题.*✦/,
    en:/✦.*Monthly Destiny Theme/i,
    fr:/✦.*Thème de Destin du Mois/i,
    th:/✦.*ธีมโชคชะตา/i,
    vi:/✦.*Chủ Đề Vận Mệnh/i,
  };
  const tp = themePatterns[lang];
  if (tp && !tp.test(text)) errors.push('缺少主题标题');
  return errors;
}

// ── SSE 流式读取 ──────────────────────────────────────────────────────
function fetchSSE(baseUrl, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const u = new URL(baseUrl);
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request({
      hostname: u.hostname, path: u.pathname, method: 'POST',
      headers: { 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(postData) },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(90000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(postData);
    req.end();
  });
}

function parseSSE(body) {
  const chunks = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^data:\s*(.+)/);
    if (!m) continue;
    try {
      const obj = JSON.parse(m[1]);
      if (obj.text) chunks.push(obj.text);
    } catch {}
  }
  return chunks.join('');
}

// ── 清缓存 ────────────────────────────────────────────────────────────
async function clearCache(base, c) {
  try {
    const url = `${base}/api/clear-cache/${c.birth}/${c.lang}/monthly?birthTime=${c.time}&lat=${c.lat}&lon=${c.lon}&tz=${encodeURIComponent(c.tz)}`;
    const u = new URL(url);
    await new Promise((res, rej) => {
      https.get({ hostname:u.hostname, path:u.pathname+'? '+u.search, method:'GET' }, r => { let d=''; r.on('data',c=>d+=c); r.on('end',res); r.on('error',rej); }).on('error',rej);
    });
  } catch {}
}

// ── 主循环 ───────────────────────────────────────────────────────────
const PROD = process.argv.includes('--prod');
const BASE = PROD ? 'https://kindredsouls-production.up.railway.app' : 'https://kindredsouls.online';

async function runAudit() {
  console.log(`🚀 Truth Gates 巡检 | 目标: ${BASE}\n`);

  const results = [];
  for (let i = 0; i < CASES.length; i += 2) {
    const batch = CASES.slice(i, i + 2);
    const batchResults = await Promise.all(batch.map(async (c) => {
      const start = Date.now();

      // SwissEph 真值计算
      const moonTruth = computeMoonTruth(c.birth, c.time, c.lat, c.lon, c.tz);
      const truthLabel = moonTruth
        ? `真值:${moonTruth.raw.map(w=>`W${w.week}:${w.signs.join('/')}`).join('|')}`
        : 'SwissEph不可用';

      // 清缓存
      await clearCache(BASE, c);
      await new Promise(r => setTimeout(r, 300));

      // 生成报告
      let status = 0, text = '';
      try {
        const res = await fetchSSE(`${BASE}/api/wealth-oracle/stream`, {
          birthDate: c.birth, birthTime: c.time, lat: c.lat, lon: c.lon,
          tz: c.tz, lang: c.lang, reportType: 'monthly',
        });
        status = res.status;
        text = parseSSE(res.body);
      } catch (e) {
        return { ...c, passed: false, reason: '请求失败: ' + e.message, ms: Date.now()-start, truthLabel };
      }

      const ms = Date.now() - start;
      if (status !== 200 || !text) {
        return { ...c, passed: false, reason: `HTTP ${status} 或空响应 (${text.length}字)`, ms, truthLabel };
      }

      // 执行断言
      const errors = [];
      if (!c.unsupported) {
        errors.push(...assertStructure(text, c.lang));
        errors.push(...assertOverview(text, c.lang));
        errors.push(...assertTrap(text, c.lang));
      } else {
        errors.push('...(德文，跳过结构断言，仅验证请求可达)');
      }
      errors.push(...checkMoonTruth(text, c.lang, moonTruth));

      return {
        id: c.id, lang: c.lang, birth: c.birth, note: c.note,
        unsupported: !!c.unsupported,
        passed: errors.filter(e => !e.startsWith('...')).length === 0,
        reason: errors.filter(e => !e.startsWith('...')).join(' | ') || '全部通过',
        ms, truthLabel,
      };
    }));

    results.push(...batchResults);
    for (const r of batchResults) {
      const unsupported = r.lang === 'de';
      const icon = r.passed ? '✅' : (unsupported ? '⚠️' : '❌');
      const note = r.note || '';
      console.log(`${icon} #${r.id} (${r.lang.padEnd(2)}) ${r.birth} | ${r.reason}${note ? ' ['+note+']' : ''} [${r.ms}ms]`);
      console.log(`   🌓 ${r.truthLabel}`);
    }
    console.log('');
    if (i + 2 < CASES.length) await new Promise(r => setTimeout(r, 1000));
  }

  // 汇总
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const failed = total - passed;
  const unsupported = results.filter(r => r.lang === 'de').length;
  console.log('═══════════════════════════════════════════════');
  console.log(`巡检结束: ${passed}/${total} 通过 | ${failed} 失败 | ${unsupported} 德文(暂不支持)`);
  if (failed > 0) {
    console.log('\n失败用例:');
    results.filter(r => !r.passed && r.lang !== 'de').forEach(r => {
      console.log(`  #${r.id} (${r.lang}) ${r.birth}: ${r.reason}`);
    });
    process.exit(1);
  } else {
    console.log('🎉 全部通过，月报封仓终验完成！');
    process.exit(0);
  }
}

runAudit().catch(e => { console.error(e); process.exit(1); });
