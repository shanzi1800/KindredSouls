#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// E93 极限压测探针（军令 2026-10-26）——5 大极限工况 × 三档报告 × 6 语
//   四大支柱：①命理计算内核准确性（八字硬锁+瑞士星历+DST+高纬度分宫）
//            ②6 语文学素养（LLM-as-judge 评分）
//            ③分层深度 Tier Depth（字数/结构/塔罗解耦/时效颗粒度）
//            ④跨报告关联性 Cohesion（基调/嵌套/主线贯穿）
//   构造器以「文本抽取 + VM 注入」消费（闸门同源口径）；密钥经环境变量不回显。
//   产物：/tmp/e93/*.txt（报告文本）+ /tmp/e93/audit.json（程序化审计）
//   运行：PATH=venv… DEEPSEEK_API_KEY=… node scripts/e93-extreme-probe.mjs
// ═══════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = '/tmp/e93';
fs.mkdirSync(OUT, { recursive: true });
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const TAROT_TS = fs.readFileSync(path.join(ROOT, 'web/src/lib/tarot.ts'), 'utf8');

// ── 5 组极限样本（军令矩阵逐字） ──
const CASES = [
  { id: 1, tag: '跨半球夏令时', dA: '1988-11-23', tA: '14:15', cityA: '悉尼', latA: -33.8688, lonA: 151.2093, tzA: 'Australia/Sydney',
    dB: '1992-05-12', tB: '08:30', cityB: '伦敦', latB: 51.5074, lonB: -0.1278, tzB: 'Europe/London',
    expSunA: 'Sagittarius', expSunB: 'Taurus', expOffA: 11, expOffB: 1 },
  { id: 2, tag: '闰年子时跨日', dA: '2000-02-29', tA: '23:55', cityA: '上海', latA: 31.2304, lonA: 121.4737, tzA: 'Asia/Shanghai',
    dB: '1996-02-29', tB: '00:05', cityB: '巴黎', latB: 48.8566, lonB: 2.3522, tzB: 'Europe/Paris',
    expSunA: 'Pisces', expSunB: 'Pisces', expOffA: 8, expOffB: 1 },
  { id: 3, tag: '高纬度极点', dA: '1991-06-21', tA: '00:01', cityA: '雷克雅未克', latA: 64.1466, lonA: -21.9426, tzA: 'Atlantic/Reykjavik',
    dB: '1995-12-22', tB: '18:20', cityB: '曼谷', latB: 13.7563, lonB: 100.5018, tzB: 'Asia/Bangkok',
    expSunA: 'Cancer', expSunB: 'Capricorn', expOffA: 0, expOffB: 7 },
  { id: 4, tag: '跨代际大年差', dA: '1968-08-08', tA: '05:40', cityA: '纽约', latA: 40.7128, lonA: -74.0060, tzA: 'America/New_York',
    dB: '1996-10-10', tB: '17:15', cityB: '河内', latB: 21.0285, lonB: 105.8542, tzB: 'Asia/Ho_Chi_Minh',
    expSunA: 'Leo', expSunB: 'Libra', expOffA: -4, expOffB: 7 },
  { id: 5, tag: '春分秋分大轴', dA: '1994-03-20', tA: '20:28', cityA: '北京', latA: 39.9042, lonA: 116.4074, tzA: 'Asia/Shanghai',
    dB: '1999-09-23', tB: '07:30', cityB: '布宜诺斯艾利斯', latB: -34.6037, lonB: -58.3816, tzB: 'America/Argentina/Buenos_Aires',
    expSunA: 'equinox', expSunB: 'equinox', expOffA: 8, expOffB: -3 },
];

// ── VM 抽取（server.js 构造器链） ──
function sliceFrom(anchor, endMarker) {
  const i = SERVER.indexOf(anchor);
  if (i === -1) throw new Error(`anchor missing: ${anchor}`);
  const j = SERVER.indexOf(endMarker, i);
  if (j === -1) throw new Error(`end marker missing after ${anchor}`);
  return SERVER.slice(i, j);
}
function fnBody(anchor) {
  const i = SERVER.indexOf(anchor);
  if (i === -1) throw new Error(`fn anchor missing: ${anchor}`);
  let depth = 0, started = false;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) return SERVER.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}
const monthlyTables = sliceFrom('const _E89_MONTHLY_LANG_LOCK', '\n\n// ═══');
const yearlyTables = sliceFrom('const _E88_YEARLY_LANG_LOCK', '\n\n// ═══');
const fnMonthly = fnBody('function buildCompatMonthlyFourModulePrompt(');
const fnYearly = fnBody('function buildCompatYearlyFiveChapterPrompt(');
const fnBaziLock = fnBody('function _E92CompatBaziLock(');
const fnTimeSide = fnBody('function _compatTimeTruthSide(');
const fnSynTruth = fnBody('async function buildCompatSynastryTruth(');

const { computeCompatScores, buildCompatTimeContext, renderSynastryBlock, buildCompatPrompt } = await import(
  path.join(ROOT, 'api/ai-advisor.js')
);
const { getAstroMatrix, extractNatalTriad, getDualSynastryTensor } = await import(path.join(ROOT, 'v69_client.js'));
const { resolveTimeZone } = await import(path.join(ROOT, 'src/tz-resolver.js'));
const { resolveCoordinates } = await import(path.join(ROOT, 'src/coord-validator.js'));

const vmFactory = new Function(
  'computeCompatScores', 'buildCompatTimeContext', 'renderSynastryBlock',
  'getAstroMatrix', 'extractNatalTriad', 'getDualSynastryTensor', 'resolveTimeZone', 'resolveCoordinates',
  `${monthlyTables}\n${yearlyTables}\n${fnMonthly}\n${fnYearly}\n${fnBaziLock}\n${fnTimeSide}\n${fnSynTruth}\n` +
  'return { buildCompatMonthlyFourModulePrompt, buildCompatYearlyFiveChapterPrompt, _E92CompatBaziLock, buildCompatSynastryTruth };'
);
const { buildCompatMonthlyFourModulePrompt, buildCompatYearlyFiveChapterPrompt, _E92CompatBaziLock, buildCompatSynastryTruth } = vmFactory(
  computeCompatScores, buildCompatTimeContext, renderSynastryBlock,
  getAstroMatrix, extractNatalTriad, getDualSynastryTensor, resolveTimeZone, resolveCoordinates
);

// ── 塔罗（复刻前端 getTarot：hash + scope 盐 + CARDS 表运行时抽取） ──
const CARDS = [];
{
  const re = /id:(\d+), emoji:'[^']*', name:\{zh:'((?:\\.|[^'])*)',en:'((?:\\.|[^'])*)',es:'((?:\\.|[^'])*)',fr:'((?:\\.|[^'])*)',th:'((?:\\.|[^'])*)',vi:'((?:\\.|[^'])*)'\}/g;
  let m; const unesc = (s) => s.replace(/\\'/g, "'");
  while ((m = re.exec(TAROT_TS)) !== null) {
    CARDS[Number(m[1])] = { zh: unesc(m[2]), en: unesc(m[3]), es: unesc(m[4]), fr: unesc(m[5]), th: unesc(m[6]), vi: unesc(m[7]) };
  }
}
const ORIENT = { zh: (r) => r ? '（逆位）' : '（正位）', en: (r) => r ? ' (Reversed)' : ' (Upright)', es: (r) => r ? ' (Invertido)' : ' (Normal)', fr: (r) => r ? ' (Inversé)' : ' (Droit)', th: (r) => r ? ' (กลับด้าน)' : ' (ตั้งตรง)', vi: (r) => r ? ' (Ngược)' : ' (Thuận)' };
function tarotOf(d1, d2, lang, scope) {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const sorted = [d1, d2].sort();
  const str = sorted[0] + '|' + sorted[1] + '|' + today + '|' + (scope || 'insight');
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  const id = Math.abs(hash) % 22;
  const rev = Math.floor(Math.abs(hash) / 22) % 2 === 1;
  const c = CARDS[id] || CARDS[0];
  const L = c && c[lang] ? lang : 'zh';
  return { id, reversed: rev, name: c[L], orientation: (ORIENT[L] || ORIENT.zh)(rev), meaning: '' };
}

// ── 独立核验表（与实现同源数学、独立复算） ──
const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
const LIUHE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
const SANHE = [['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑']];
const XING = [['寅', '巳'], ['巳', '申'], ['寅', '申'], ['丑', '戌'], ['戌', '未'], ['丑', '未'], ['子', '卯']];
const jdn = (y, m, d) => { const a = Math.floor((14 - m) / 12); const yy = y + 4800 - a; const mm = m + 12 * a - 3; return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045; };
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// ── 支柱一：内核审计 ──
const audit = { cases: [] };
function parsePillars(lockText, which) {
  const re = new RegExp(`${which}（[^）]+）四柱：(.+)`);
  const m = lockText.match(re);
  if (!m) return null;
  return m[1].trim().split(/\s+/).map((tok) => {
    const mm = tok.match(/^(.)(.)（(年柱|月柱|日柱|时柱)）$/);
    return mm ? { stem: mm[1], branch: mm[2], label: mm[3] } : null;
  }).filter(Boolean);
}
function expectedRelations(pA, pB) {
  const rels = [];
  const push = (a, b, kind, extra) => rels.push({ a: a.branch, b: b.branch, kind, extra: extra || '' });
  for (const pa of pA) for (const pb of pB) {
    const ba = pa.branch, bb = pb.branch;
    if (CHONG[ba] === bb) push(pa, pb, '冲');
    else if (LIUHE[ba] === bb) push(pa, pb, '六合');
    else if (SANHE.some((g) => g.includes(ba) && g.includes(bb))) push(pa, pb, '半合', SANHE.find((g) => g.includes(ba) && g.includes(bb)).join(''));
    else if (XING.some((pr) => (pr[0] === ba && pr[1] === bb) || (pr[0] === bb && pr[1] === ba))) push(pa, pb, '刑');
  }
  return rels;
}
const getUTCHour = (y, mo, d, h, mi, tz) => {
  // Node Intl 求该地该刻的 UTC 偏移（IANA 数据库，含 DST）
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const parts = dtf.formatToParts(new Date(Date.UTC(y, mo - 1, d, h, mi)));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
  return ((asUTC - Date.UTC(y, mo - 1, d, h, mi)) / 3600000);
};

console.log('═══════ 支柱一：命理内核审计（程序化） ═══════');
for (const c of CASES) {
  const rec = { id: c.id, tag: c.tag, bazi: {}, astroA: {}, astroB: {}, syn: {} };
  // ① 八字硬锁
  const bl = _E92CompatBaziLock(c.dA, c.dB, c.tA, c.tB);
  rec.bazi.lockAvailable = !!bl;
  const pA = parsePillars(bl.lock, 'A'), pB = parsePillars(bl.lock, 'B');
  rec.bazi.pillarsA = pA.map((p) => p.stem + p.branch).join(' ');
  rec.bazi.pillarsB = pB.map((p) => p.stem + p.branch).join(' ');
  // 日柱 JDN 独立复算（闰日/跨日/换轨核验）
  const [ya, ma, da] = c.dA.split('-').map(Number);
  const [yb, mb, db] = c.dB.split('-').map(Number);
  const expDA = DZ[(jdn(ya, ma, da) + 1) % 12];
  const expDB = DZ[(jdn(yb, mb, db) + 1) % 12];
  rec.bazi.dayPillarAJDNok = pA[2].branch === expDA;
  rec.bazi.dayPillarBJDNok = pB[2].branch === expDB;
  rec.bazi.case2_noDayJump = c.id === 2 ? (pA[2].branch === expDA && pA[2].label === '日柱') : null;
  rec.bazi.hourA = pA[3] ? pA[3].branch : null;
  rec.bazi.hourB = pB[3] ? pB[3].branch : null;
  // 刑冲合害独立复算（检出率+误报率）
  const exp = expectedRelations(pA, pB);
  const gotText = bl.lock.split('跨盘真实刑冲合害：')[1].split('\n（除本锁列出')[0];
  const got = [...gotText.matchAll(/A(\w+)支?([子丑寅卯辰巳午未申酉戌亥])↔B(\w+)支?([子丑寅卯辰巳午未申酉戌亥])（([子丑寅卯辰巳午未申酉戌亥]{2}相冲|[子丑寅卯辰巳午未申酉戌亥]{2}六合|[子丑寅卯辰巳午未申酉戌亥]{2}半合|[子丑寅卯辰巳午未申酉戌亥]{2}相刑)/g)]
    .map((m) => ({ a: m[2], b: m[4], kind: m[5].includes('相冲') ? '冲' : m[5].includes('六合') ? '六合' : m[5].includes('半合') ? '半合' : '刑' }));
  const key = (r) => `${r.a}-${r.b}-${r.kind}`;
  const expSet = new Set(exp.map(key));
  const gotSet = new Set(got.map(key));
  const miss = [...expSet].filter((k) => !gotSet.has(k));
  const extra = [...gotSet].filter((k) => !expSet.has(k));
  rec.bazi.relationRecall = exp.length === 0 ? 1 : 1 - miss.length / expSet.size;
  rec.bazi.relationFP = extra.length;
  rec.bazi.relations = got.map((r) => `${r.a}${r.b}${r.kind}`).join('、');
  rec.bazi.branchesInChart = [...new Set([...pA, ...pB].map((p) => p.branch))];
  // 幻觉硬扫：锁内关系用字 ⊄ 盘中地支 ⇒ 幻觉
  const lockBranchSet = new Set(rec.bazi.branchesInChart);
  let hallucBranch = [];
  for (const r of got) { if (!lockBranchSet.has(r.a) || !lockBranchSet.has(r.b)) hallucBranch.push(`${r.a}${r.b}`); }
  rec.bazi.lockHallucination = hallucBranch.length === 0;
  rec.bazi.relationCount = got.length;

  // ② 星历（双方真盘：DST/符号/高纬度/两分点）
  for (const side of ['A', 'B']) {
    const d = side === 'A' ? c.dA : c.dB, t = side === 'A' ? c.tA : c.tB;
    const lat = side === 'A' ? c.latA : c.latB, lon = side === 'A' ? c.lonA : c.lonB, tz = side === 'A' ? c.tzA : c.tzB;
    const mx = await getAstroMatrix(d, t, lat, lon, tz, {});
    const target = rec[`astro${side}`];
    if (!mx) { target.available = false; continue; }
    const meta = mx.meta || {};
    target.available = true;
    target.sunSign = meta.sun_sign || null;
    target.rising = meta.rising_sign || null;
    target.risingSource = meta.rising_sign_source || null;
    target.birthTimeKnown = meta.birth_time_known;
    target.houseCount = Object.values(meta.computed_houses || {}).filter((h) => Number.isInteger(Number(h && h.house))).length;
    const sunLong = (meta.planet_longitudes || {}).Sun;
    target.sunLong = typeof sunLong === 'number' ? Number(sunLong.toFixed(3)) : null;
    target.hasNaN = JSON.stringify(mx).includes('NaN');
    // UTC 偏移核验（DST 硬指标：Node Intl IANA vs 军令预期）
    const [yy, mm2, dd] = d.split('-').map(Number);
    const [hh, mi] = t.split(':').map(Number);
    target.tzOffsetIntl = getUTCHour(yy, mm2, dd, hh, mi, tz);
    target.tzOffsetExpected = side === 'A' ? c.expOffA : c.expOffB;
    target.dstOK = target.tzOffsetIntl === target.tzOffsetExpected;
    // 符号核验
    if (typeof sunLong === 'number') {
      const sign = SIGNS[Math.floor(((sunLong % 360) + 360) % 360 / 30)];
      if ((side === 'A' ? c.expSunA : c.expSunB) === 'equinox') {
        const deg = ((sunLong % 360) + 360) % 360;
        const distTo0 = Math.min(deg, 360 - deg);
        const distTo180 = Math.abs(deg - 180);
        target.equinoxOK = Math.min(distTo0, distTo180) <= 2.5;
        target.equinoxDeg = Math.min(distTo0, distTo180).toFixed(3);
      } else {
        target.sunSignOK = sign === (side === 'A' ? c.expSunA : c.expSunB) && (target.sunSign === sign || target.sunSign === null);
      }
      target.sunSignByLong = sign;
    }
    target.planetCount = Object.keys(meta.planet_longitudes || {}).length;
  }
  // DST 差分试验（Case1 双侧 + Case2A）：+1h ⇒ 太阳黄经 +≈0.0417°
  for (const [cid, side] of [[1, 'A'], [1, 'B'], [2, 'A']]) {
    if (c.id !== cid) continue;
    const d = side === 'A' ? c.dA : c.dB, t = side === 'A' ? c.tA : c.tB;
    const lat = side === 'A' ? c.latA : c.latB, lon = side === 'A' ? c.lonA : c.lonB, tz = side === 'A' ? c.tzA : c.tzB;
    const [hh, mi] = t.split(':').map(Number);
    const t2 = `${String(hh + 1).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
    const mx2 = await getAstroMatrix(d, t2, lat, lon, tz, {});
    const s1 = (await getAstroMatrix(d, t, lat, lon, tz, {}) || {}).meta?.planet_longitudes?.Sun;
    const s2 = mx2?.meta?.planet_longitudes?.Sun;
    rec[`astro${side}`].dstDiffDelta = (typeof s1 === 'number' && typeof s2 === 'number') ? Number((s2 - s1).toFixed(4)) : null;
    rec[`astro${side}`].dstDiffOK = typeof s1 === 'number' && typeof s2 === 'number' && Math.abs((s2 - s1) - 0.0417) <= 0.01;
  }
  // ③ 双盘张量
  const syn = await buildCompatSynastryTruth({ timeTruth: { a: { birthTime: c.tA, tz: c.tzA, lat: c.latA, lon: c.lonA }, b: { birthTime: c.tB, tz: c.tzB, lat: c.latB, lon: c.lonB } } }, c.dA, c.dB);
  rec.syn.available = syn.available;
  rec.syn.precision = syn.precision || null;
  rec.syn.harmonious = syn.harmonious; rec.syn.hard = syn.hard; rec.syn.total = syn.total;
  rec.syn.ratio = syn.ratio;
  rec.syn.bondsCount = (syn.bonds || []).length;
  rec.syn.frictionsCount = (syn.frictions || []).length;
  rec.syn.houseOverlay = syn.houseOverlay ? syn.houseOverlay.available : false;
  rec.synTextBlock = renderSynastryBlock(syn.available ? syn : null, 'zh');
  audit.cases.push(rec);
  console.log(`Case ${c.id} ${c.tag}｜日柱A ${rec.bazi.dayPillarAJDNok ? '✓' : '✗'}｜关系复算 recall=${rec.bazi.relationRecall.toFixed(2)} fp=${rec.bazi.relationFP}｜DST ${rec.astroA.dstOK && rec.astroB.dstOK ? '✓' : '✗'}｜张量 ${rec.syn.available ? `total=${rec.syn.total} ratio=${rec.syn.ratio}` : '不可用'}`);
}
fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(audit, null, 2));

// ── 支柱二/三/四：报告生成（真弹 DeepSeek） ──
const KEY = process.env.DEEPSEEK_API_KEY;
if (!KEY) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1); }
async function ds(messages, maxTokens) {
  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'deepseek-flash', thinking: { type: 'disabled' }, messages, max_tokens: maxTokens, temperature: 0 }),
  });
  const data = await res.json();
  return { text: data?.choices?.[0]?.message?.content || '', status: res.status, tokens: data?.usage?.completion_tokens || 0 };
}
const TIER_SPECS = {
  once: { maxTokens: 12000, label: '4.99 洞察' },
  monthly: { maxTokens: 3000, label: '2.99 月报' },
  yearly: { maxTokens: 7000, label: '29.99 年报' },
};
const SCORE_FIX = [ // 分数固定具（同案三档一致＝生产同源口径；文档注明）
  { bazi: { a: 6, b: 4 }, zodiac: { a: 5, b: 5 }, iching: { a: 7, b: 3 } },
  { bazi: { a: 5, b: 5 }, zodiac: { a: 6, b: 4 }, iching: { a: 4, b: 6 } },
  { bazi: { a: 7, b: 3 }, zodiac: { a: 4, b: 6 }, iching: { a: 6, b: 4 } },
  { bazi: { a: 4, b: 6 }, zodiac: { a: 7, b: 3 }, iching: { a: 5, b: 5 } },
  { bazi: { a: 6, b: 4 }, zodiac: { a: 5, b: 5 }, iching: { a: 7, b: 3 } },
];
function buildPromptFor(c, tier, lang) {
  const tarot = tarotOf(c.dA, c.dB, lang, tier === 'once' ? 'insight' : tier);
  const zodiacMeta = [audit.cases[c.id - 1].astroA.sunSignByLong || 'Aries', audit.cases[c.id - 1].astroB.sunSignByLong || 'Taurus'];
  const sc = SCORE_FIX[c.id - 1];
  const scores = computeCompatScores(sc.bazi, sc.zodiac, sc.iching);
  const baziLock = _E92CompatBaziLock(c.dA, c.dB, c.tA, c.tB);
  const synastry = (tier === 'once')
    ? null // 生产口径：$4.99 洞察请求不带 timeTruth ⇒ 显式未知（分层深度审计点）
    : (() => { const a = audit.cases[c.id - 1]; return a.syn.available ? { available: true, precision: a.syn.precision, harmonious: a.syn.harmonious, hard: a.syn.hard, total: a.syn.total, ratio: a.syn.ratio, counts: {}, unknown: [], bonds: [], frictions: [], signatures: {} } : null; })();
  const extras = {
    bazi: sc.bazi, zodiac: sc.zodiac, iching: sc.iching,
    tarot: { name: tarot.name, orientation: tarot.orientation, meaning: tarot.meaning },
    zodiacMeta, userBirthDate: c.dA, synastry, baziLock,
  };
  if (tier === 'monthly') return { p: buildCompatMonthlyFourModulePrompt(c.dA, c.dB, lang, extras), tarot };
  if (tier === 'yearly') return { p: buildCompatYearlyFiveChapterPrompt(c.dA, c.dB, lang, extras), tarot };
  return { p: buildCompatPrompt({ lang, reportType: 'oracle', scores, tarot: extras.tarot, zodiacMeta, baziLock }), tarot };
}
console.log('═══════ 报告生成（真弹 DeepSeek） ═══════');
const texts = {}; // key: `${caseId}_${tier}_${lang}`
for (const c of CASES) {
  for (const tier of ['once', 'monthly', 'yearly']) {
    const { p } = buildPromptFor(c, tier, 'zh');
    const r = await ds([{ role: 'system', content: p.system }, { role: 'user', content: p.user }], TIER_SPECS[tier].maxTokens);
    texts[`${c.id}_${tier}_zh`] = r.text;
    fs.writeFileSync(path.join(OUT, `case${c.id}_${tier}_zh.txt`), r.text);
    console.log(`Case${c.id} ${tier}(zh): ${r.status} ${r.text.length}字 ${r.tokens}tok`);
  }
}
for (const lang of ['en', 'fr', 'es', 'th', 'vi']) {
  const c = CASES[0];
  for (const tier of ['once', 'monthly', 'yearly']) {
    const { p } = buildPromptFor(c, tier, lang);
    const r = await ds([{ role: 'system', content: p.system }, { role: 'user', content: p.user }], TIER_SPECS[tier].maxTokens);
    texts[`1_${tier}_${lang}`] = r.text;
    fs.writeFileSync(path.join(OUT, `case1_${tier}_${lang}.txt`), r.text);
    console.log(`Case1 ${tier}(${lang}): ${r.status} ${r.text.length}字 ${r.tokens}tok`);
  }
}
fs.writeFileSync(path.join(OUT, 'texts_index.json'), JSON.stringify(Object.fromEntries(Object.entries(texts).map(([k, v]) => [k, { chars: v.length, path: `/tmp/e93/${k.replace(/_(\w+)$/, '_$&')}.txt` }]))));

// ── 程序化评分（支柱一文本幻觉扫 + 支柱三分层深度 + 支柱四程序化关联） ──
const BRANCH_PAIR_RE = /[子丑寅卯辰巳午未申酉戌亥]{2,}/g;
const tierDepth = {}, cohesion = {}, hallucScan = {};
for (const c of CASES) {
  for (const tier of ['once', 'monthly', 'yearly']) {
    const t = texts[`${c.id}_${tier}_zh`] || '';
    const k = `${c.id}_${tier}`;
    // 幻觉扫：文本中相邻地支序列须全部由盘中地支构成
    const branches = new Set(audit.cases[c.id - 1].bazi.branchesInChart);
    const seqs = [...t.matchAll(BRANCH_PAIR_RE)].map((m) => m[0]);
    const bad = seqs.filter((s) => [...s].some((ch) => !branches.has(ch)));
    hallucScan[k] = { seqCount: seqs.length, badSeqs: bad.slice(0, 8) };
    // 分层深度
    const dates = (t.match(/\d{1,2}月\d{1,2}日/g) || []).length;
    const months = new Set((t.match(/(?:19|20)\d{2}年\d{1,2}月|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/g) || []));
    tierDepth[k] = {
      chars: t.length,
      window: tier === 'once' ? '800-1200' : tier === 'monthly' ? '2500-3500' : '7500-9000',
      inWindow: tier === 'once' ? (t.length >= 800 && t.length <= 1200) : tier === 'monthly' ? (t.length >= 2500 && t.length <= 3500) : (t.length >= 7500 && t.length <= 9000),
      datesMentioned: dates,
      monthsMentioned: months.size,
      hasStructure: tier === 'monthly' ? ['第一章', '第二章', '第三章', '第四章'].every((x) => t.includes(x)) : tier === 'yearly' ? ['第一章', '第二章', '第三章', '第四章', '第五章'].every((x) => t.includes(x)) : true,
    };
  }
  // 塔罗三档异卡
  const cards = { once: tarotOf(c.dA, c.dB, 'zh', 'insight'), monthly: tarotOf(c.dA, c.dB, 'zh', 'monthly'), yearly: tarotOf(c.dA, c.dB, 'zh', 'yearly') };
  tierDepth[`case${c.id}_tarot`] = { once: `${cards.once.name}${cards.once.reversed ? '逆' : '正'}(${cards.once.id})`, monthly: `${cards.monthly.name}${cards.monthly.reversed ? '逆' : '正'}(${cards.monthly.id})`, yearly: `${cards.yearly.name}${cards.yearly.reversed ? '逆' : '正'}(${cards.yearly.id})`, distinct: new Set([cards.once.id, cards.monthly.id, cards.yearly.id]).size };
  // 程序化关联：核心刑冲支对在三档文本中的贯穿
  const relBranches = [...new Set(audit.cases[c.id - 1].bazi.relations.split('、').flatMap((x) => [x[0], x[1]]))];
  const echo = {};
  for (const tier of ['once', 'monthly', 'yearly']) {
    const t = texts[`${c.id}_${tier}_zh`] || '';
    echo[tier] = relBranches.filter((b) => t.includes(b));
  }
  cohesion[`case${c.id}_echo`] = { relBranches, echo, overlap: relBranches.filter((b) => echo.once.includes(b) && echo.monthly.includes(b) && echo.yearly.includes(b)) };
}
fs.writeFileSync(path.join(OUT, 'scoring.json'), JSON.stringify({ tierDepth, cohesion, hallucScan }, null, 2));

// ── LLM-as-judge（支柱二文学 + 支柱四关联） ──
const LANG_RUBRIC = {
  zh: '意境深邃、四字成语对称、消除机械代词（如「XXXX年一方」）、无地摊八字低俗口癖。',
  en: 'Orthodox modern-serious astrology vocabulary (Synastry, Solar Return, Cardinal Cusps, Trine, Square), literary polish, rhythmic sentence flow.',
  fr: 'Rigueur grammaticale (accord genre/nombre), lexique ésotérique classique (Clé du Destin, Révolution Solaire, Synastrie Karmique), jamais de traduction littérale.',
  es: 'Vocabulario esotérique castillan idiomatique (Carta Astral, Sinastría Cósmica, Bóveda Celeste), forte résonance émotionnelle.',
  th: 'คำศัพท์กรรม/พรหมลิขิตที่มีวัฒนธรรม (บุพเพสันนิวาส, วาสนาผูกพัน, ชะตาลิขิต) ภาษาสละสลวย (แก้ไขให้สอดคล้อง: ใช้ศัพท์บุพเพสันนิวาส/วาสนาผูกพัน/ชะตาลิขิต เรียบเรียงสละสลวย)',
  vi: 'Thuật ngữ Hán-Nôm uy nghiêm (Thiên Định Nhân Duyên, Bản Đồ Sao, Tử Vi Hợp Hôn, Khí Số Vận Trình), giọng văn trang trọng cao quý.',
};
const judges = {};
for (const lang of ['zh', 'en', 'fr', 'es', 'th', 'vi']) {
  const body = [`4.99 洞察：\n${(texts[`1_once_${lang}`] || '').slice(0, 3000)}`, `2.99 月报：\n${(texts[`1_monthly_${lang}`] || '').slice(0, 6000)}`, `29.99 年报：\n${(texts[`1_yearly_${lang}`] || '').slice(0, 9000)}`].join('\n\n———\n\n');
  const sys = `You are a strict multilingual editorial judge for premium astrology reports written in ${lang}. Rubric: ${LANG_RUBRIC[lang]} Score each tier 0-100. Output ONLY compact JSON: {"once":n,"monthly":n,"yearly":n,"highlight":"<one best quoted sentence from the yearly text>","issues":["..."]}`;
  const r = await ds([{ role: 'system', content: sys }, { role: 'user', content: body.slice(0, 18000) }], 500);
  try { judges[`lang_${lang}`] = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); } catch { judges[`lang_${lang}`] = { raw: r.text.slice(0, 200) }; }
  console.log(`judge lang=${lang}:`, JSON.stringify(judges[`lang_${lang}`]).slice(0, 160));
}
for (const c of CASES) {
  const body = [`【$4.99 深度洞察】\n${(texts[`${c.id}_once_zh`] || '').slice(0, 3000)}`, `【$2.99 当月月报】\n${(texts[`${c.id}_monthly_zh`] || '').slice(0, 6000)}`, `【$29.99 年度年报】\n${(texts[`${c.id}_yearly_zh`] || '').slice(0, 9000)}`].join('\n\n———\n\n');
  const sys = '你是严苛的高级命理产品总编。对同一对情侣的三档报告评估「跨报告关联性」三维度：①anchor=底层命理基调一致性（人格/优劣势是否打架）；②nesting=宏微时空咬合（月报当月基调与年报对应月份走势是否对齐）；③echo=主线课题贯穿回响（核心矛盾是否被三档递进承接：发现→当月战术→全年立宪）。各0-100分。只输出紧凑JSON：{"anchor":n,"nesting":n,"echo":n,"conflicts":["如有事实性矛盾逐条列出"],"quote":"一处最能体现主线贯穿的对照摘录（≤80字）"}';
  const r = await ds([{ role: 'system', content: sys }, { role: 'user', content: body.slice(0, 18000) }], 500);
  try { judges[`cohesion_case${c.id}`] = JSON.parse(r.text.match(/\{[\s\S]*\}/)[0]); } catch { judges[`cohesion_case${c.id}`] = { raw: r.text.slice(0, 200) }; }
  console.log(`judge cohesion case${c.id}:`, JSON.stringify(judges[`cohesion_case${c.id}`]).slice(0, 160));
}
fs.writeFileSync(path.join(OUT, 'judges.json'), JSON.stringify(judges, null, 2));
console.log('═══════ E93 压测完成：产物在 /tmp/e93/ ═══════');
