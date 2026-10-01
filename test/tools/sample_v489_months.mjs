// V489 决策前置：月度章节完整性「低成本跨盘抽样观测」（不做高压测）
// 用法: node test/tools/sample_v489_months.mjs [--count N] [--start N] [--force]
//
// 目的（军师指令）：随机抽样抓 15~20 个不同生辰盘的线上年报产物，统计「月标题数量 < 12」的概率，
//   据此判定是否触发 V489（Server 层 12 月完整性校验 + 缺月重试）条件立项。
//
// 度量口径（与生产/验收脚本一致，避免自造口径）:
//   ① headsSun  = `^#{1,6}\s*\d{4}年\d{1,2}月 … 太阳<星>座 第N宫`  → 真值权威形态（lockYearlyMonthTitles 出口）
//   ② headsAny  = `^#{1,6}\s*\d{4}年\d{1,2}月`                      → 宽松口径（生产 verify 现用）
//   ③ monthKeys = 去重后的 年-月 集合，应为财年窗口 2026-07 ~ 2027-06 共 12 个
//
// 病根判别（本次观测的核心价值，决定 V489 方向）:
//   hasDone = SSE 流里是否出现 `data: [DONE]`
//     · hasDone=false ⇒ 流中途断（网络/网关/超时截断）⇒ 指向「传输层完整性保护」
//     · hasDone=true 但缺月 ⇒ 模型自己收尾了 ⇒ 指向「Prompt/生成侧早退」⇒ 才是 V489 的适用面
//
// 缺月盘自动「重抓一次」验证是否「重试即恢复」（军师判定门槛所需证据）。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');

// 生产审计探针（离线加载, 与线上同一份 server.js）——用于量化 Prompt 4d 的「只降不升」
function loadProd() {
  const { source: code } = closureDecls(SRC, ['lockYearlyNonMonthSunRef', 'auditYearlyNonMonthSunRef'], []);
  const ctx = { console: { log: () => {} }, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.lock = lockYearlyNonMonthSunRef;'
    + '\n__exports.audit = auditYearlyNonMonthSunRef;', ctx);
  return ctx.__exports;
}
const prod = loadProd();

// 用月标题反构真值矩阵（与 verify_v488_online.mjs 同口径）
const ZH_SIGN = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const EN_SIGN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
function matrixFromHeads(text) {
  const months = [];
  const seen = new Set();
  text.split('\n').forEach((l) => {
    const m = l.match(/^#{1,6}\s*(\d{4})年(\d{1,2})月[^\n]*?太阳\s*([\u4e00-\u9fa5]{2,3}座)\s*第\s*(\d+)\s*宫/);
    if (!m) return;
    const key = Number(m[1]) * 12 + Number(m[2]);
    if (seen.has(key)) return;
    seen.add(key);
    const zi = ZH_SIGN.indexOf(m[3]);
    if (zi >= 0) months.push({ month_key: `${m[1]}-${String(m[2]).padStart(2, '0')}`, sun: { sign: EN_SIGN[zi], house: Number(m[4]) } });
  });
  return { months };
}
function auditCounts(text) {
  const a = prod.audit(text, 'zh', matrixFromHeads(text), 'yearly');
  const before = text;
  const after = prod.lock(text, 'zh', matrixFromHeads(text), 'yearly');
  let fixedLines = 0;
  const A = before.split('\n'), B = after.split('\n');
  for (let i = 0; i < Math.max(A.length, B.length); i++) if ((A[i] || '') !== (B[i] || '')) fixedLines++;
  return { warn2: a ? a.warn2 : 0, warn3: a ? a.warn3 : 0, fixed: after === text ? 0 : fixedLines };
}

// 内部字段泄漏计数（V488e 补：把泄漏纳入**每批自动统计**）
//   教训：C 阶段只统计了「审计告警」，漏扫「字段泄漏」⇒ 某批 12/12 月的「本月风控主线聚焦X」
//   直到事后逐文件复算才被发现（覆盖盲区）。同类指标必须一起统计，否则"某版本更干净"的结论会失真。
//   ⚠️ V488f 补：判据**必须与清洗器同口径**（容忍定语与字段名之间插入人称/助词），否则
//      「本月你的风控主线是X」这种变体会被判据漏检 ⇒ 工具输出"0 泄漏"**假绿**（已踩一次）。
const LEAK_RE = /(?:本月|当月|专属|内部)[^，。；：\n]{0,4}?(?:(?:风控|风险)\s*(?:主线|角度|视角|重点|切入点)|(?:叙述|叙事|概览)\s*(?:镜头|视角|切入点))|(?:叙述镜头|风控表达框架|窗口表达框架)分配表/g;
const leakCount = (text) => (text.match(LEAK_RE) || []).length;

const OUT_DIR = (() => {
  const i = process.argv.indexOf('--out');
  return i > 0 ? (process.argv[i + 1] || '/tmp/v489sample') : '/tmp/v489sample';
})();
const RESULT_JSON = path.join(OUT_DIR, 'results.json');
const dec = new TextDecoder('utf-8');
const ENDPOINT = 'https://kindredsouls.online/api/wealth-oracle/stream';

// ── 抽样盘：跨 1955~2003 年、不同时辰、多时区/半球（避开与既有 1997-10-18 / 1985-06-20 重叠）──
const CHARTS = [
  { name: 'S01', birthDate: '1990-03-05', birthTime: '07:20', lat: 31.2304, lon: 121.4737, tz: 'Asia/Shanghai' },
  { name: 'S02', birthDate: '1978-11-22', birthTime: '23:45', lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
  { name: 'S03', birthDate: '2001-07-14', birthTime: '03:10', lat: 23.1291, lon: 113.2644, tz: 'Asia/Shanghai' },
  { name: 'S04', birthDate: '1965-02-09', birthTime: '12:00', lat: 30.5728, lon: 104.0668, tz: 'Asia/Shanghai' },
  { name: 'S05', birthDate: '1995-08-30', birthTime: '18:30', lat: 43.8256, lon: 87.6168, tz: 'Asia/Shanghai' },
  { name: 'S06', birthDate: '1988-12-01', birthTime: '05:50', lat: 45.8038, lon: 126.5349, tz: 'Asia/Shanghai' },
  { name: 'S07', birthDate: '1972-04-17', birthTime: '21:15', lat: 59.9139, lon: 10.7522, tz: 'Europe/Oslo' },
  { name: 'S08', birthDate: '1999-09-09', birthTime: '09:09', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  { name: 'S09', birthDate: '1955-06-06', birthTime: '16:40', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { name: 'S10', birthDate: '2003-01-25', birthTime: '11:05', lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
  { name: 'S11', birthDate: '1981-05-13', birthTime: '02:25', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
  { name: 'S12', birthDate: '1993-10-02', birthTime: '19:55', lat: 52.5200, lon: 13.4050, tz: 'Europe/Berlin' },
  { name: 'S13', birthDate: '1969-03-21', birthTime: '08:00', lat: 13.7563, lon: 100.5018, tz: 'Asia/Bangkok' },
  { name: 'S14', birthDate: '1986-07-07', birthTime: '14:14', lat: 1.3521, lon: 103.8198, tz: 'Asia/Singapore' },
  { name: 'S15', birthDate: '1975-12-25', birthTime: '00:30', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { name: 'S16', birthDate: '1992-02-29', birthTime: '22:40', lat: -23.5505, lon: -46.6333, tz: 'America/Sao_Paulo' },
  { name: 'S17', birthDate: '1958-09-18', birthTime: '06:45', lat: 30.2741, lon: 120.1551, tz: 'Asia/Shanghai' },
  { name: 'S18', birthDate: '1997-04-11', birthTime: '17:35', lat: 30.0444, lon: 31.2357, tz: 'Africa/Cairo' },
  { name: 'S19', birthDate: '2000-06-01', birthTime: '10:20', lat: 22.5431, lon: 114.0579, tz: 'Asia/Shanghai' },
  { name: 'S20', birthDate: '1963-08-08', birthTime: '13:50', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
];

const argv = process.argv.slice(2);
const count = Number((argv[argv.indexOf('--count') + 1]) || 0) || CHARTS.length;
const start = Number((argv[argv.indexOf('--start') + 1]) || 0) || 0;
const force = argv.includes('--force');

const HEADS_SUN = /^#{1,6}\s*(\d{4})年(\d{1,2})月[^\n]*?太阳\s*[\u4e00-\u9fa5]{2,3}座\s*第\s*(\d+)\s*宫/gm;
const HEADS_ANY = /^#{1,6}\s*(\d{4})年(\d{1,2})月/gm;

function measure(text) {
  const sun = [...text.matchAll(HEADS_SUN)].map((m) => `${m[1]}-${String(m[2]).padStart(2, '0')}`);
  const any = [...text.matchAll(HEADS_ANY)].map((m) => `${m[1]}-${String(m[2]).padStart(2, '0')}`);
  const keys = [...new Set(sun.length ? sun : any)].sort();
  const expecting = [];
  for (let i = 0; i < 12; i++) expecting.push(`${i < 6 ? 2026 : 2027}-${String(((6 + i) % 12) + 1).padStart(2, '0')}`);
  const missing = expecting.filter((k) => !keys.includes(k));
  return { headsSun: sun.length, headsAny: any.length, months: keys.length, missing, first: keys.slice(0, 14).join(',') };
}

async function fetchOnce(chart) {
  const t0 = Date.now();
  let httpStatus = 0, raw = '', err = null;
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthDate: chart.birthDate, birthTime: chart.birthTime,
        lat: chart.lat, lon: chart.lon, tz: chart.tz,
        lang: 'zh', reportType: 'yearly', nocache: true,
      }),
      signal: AbortSignal.timeout(900000),
    });
    httpStatus = res.status;
    for await (const v of res.body) raw += dec.decode(v, { stream: true });
  } catch (e) { err = e.message; }

  let best = '';
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('data:')) continue;
    const p = t.slice(5).trim();
    if (!p || p === '[DONE]') continue;
    let d; try { d = JSON.parse(p); } catch { continue; }
    for (const k of ['sanitized', 'text', 'content', 'full', 'report', 'cleaned', 'accumulated']) {
      const v = d[k];
      if (typeof v === 'string' && v.length > best.length) best = v;
    }
  }
  return {
    text: best, raw, httpStatus, err,
    hasDone: /data:\s*\[DONE\]/.test(raw),
    sec: Number(((Date.now() - t0) / 1000).toFixed(0)),
  };
}

function loadResults() {
  try { return JSON.parse(fs.readFileSync(RESULT_JSON, 'utf8')); } catch { return []; }
}
function saveResults(rows) { fs.writeFileSync(RESULT_JSON, JSON.stringify(rows, null, 2)); }

fs.mkdirSync(OUT_DIR, { recursive: true });
const results = loadResults();
const done = new Set(results.map((r) => r.name));

console.log(`[抽样观测] 目标盘数 ${count}${start ? ` (从第 ${start + 1} 盘开始)` : ''} · 输出 ${OUT_DIR}`);
try {
  const h = await (await fetch('https://kindredsouls.online/api/health', { signal: AbortSignal.timeout(30000) })).json();
  console.log(`[健康] deploymentId=${h.deploymentId || '-'}\n`);
} catch (e) { console.log('[健康] 取用失败:', e.message, '\n'); }

const batch = CHARTS.slice(start, start + count);
for (const chart of batch) {
  if (done.has(chart.name) && !force) { console.log(`- ${chart.name} ${chart.birthDate} 已有记录，跳过`); continue; }
  process.stdout.write(`→ ${chart.name} ${chart.birthDate} ${chart.birthTime} @${chart.tz} ... `);
  const r1 = await fetchOnce(chart);
  const m1 = measure(r1.text);
  const a1 = auditCounts(r1.text);
  fs.writeFileSync(path.join(OUT_DIR, `${chart.name}_${chart.birthDate}.txt`), r1.text);
  fs.writeFileSync(path.join(OUT_DIR, `${chart.name}_${chart.birthDate}.raw`), r1.raw);

  const rec = {
    name: chart.name, birthDate: chart.birthDate, birthTime: chart.birthTime, tz: chart.tz,
    httpStatus: r1.httpStatus, err: r1.err, hasDone: r1.hasDone, sec: r1.sec,
    chars: r1.text.length, ...m1, audit: a1, leak: leakCount(r1.text), retry: null,
  };
  console.log(`HTTP ${r1.httpStatus} · ${r1.sec}s · ${r1.text.length} 字 · 月标题 ${m1.headsSun}/${m1.headsAny}`
    + ` · [DONE] ${r1.hasDone ? 'Y' : 'N'} · 探针二级 ${a1.warn2}/三级 ${a1.warn3}/纠正行 ${a1.fixed}`
    + ` · 字段泄漏 ${rec.leak}`);

  const incomplete = m1.headsSun !== 12 || m1.months !== 12;
  if (incomplete) {
    console.log(`  ⚠️ 缺月/异常（缺 ${m1.missing.join(' ') || '—'}）⇒ 立即重抓一次验证「重试即恢复」`);
    const r2 = await fetchOnce(chart);
    const m2 = measure(r2.text);
    fs.writeFileSync(path.join(OUT_DIR, `${chart.name}_${chart.birthDate}.retry.txt`), r2.text);
    rec.retry = { httpStatus: r2.httpStatus, hasDone: r2.hasDone, sec: r2.sec, chars: r2.text.length, ...m2, audit: auditCounts(r2.text) };
    console.log(`  ↻ 重抓 HTTP ${r2.httpStatus} · ${r2.sec}s · ${r2.text.length} 字 · 月标题 ${m2.headsSun}/${m2.headsAny}`
      + ` ⇒ ${m2.headsSun === 12 && m2.months === 12 ? '✅ 重试即恢复' : '❌ 仍缺月'}`);
  }

  const i = results.findIndex((x) => x.name === chart.name);
  if (i >= 0) results[i] = rec; else results.push(rec);
  saveResults(results);
}

// ── 汇总 ──
const all = loadResults();
const valid = all.filter((r) => r.httpStatus === 200 && r.chars > 5000);
const bad = valid.filter((r) => r.headsSun !== 12 || r.months !== 12);
const recovered = bad.filter((r) => r.retry && r.retry.headsSun === 12 && r.retry.months === 12);
const stable = bad.filter((r) => !(r.retry && r.retry.headsSun === 12 && r.retry.months === 12));

console.log('\n' + '═'.repeat(112));
console.log('盘号   生辰          时区              结果   月标题(真值/宽松)  字数   耗时  [DONE]  探针二级/三级  重抓');
for (const r of all) {
  const ok = r.headsSun === 12 && r.months === 12;
  const a = r.audit || { warn2: 0, warn3: 0 };
  console.log(`${r.name}  ${r.birthDate}  ${r.tz.padEnd(17)}${ok ? '✅齐备' : '❌缺月'}  `
    + `${String(r.headsSun).padStart(2)}/${String(r.headsAny).padStart(2)}            `
    + `${String(r.chars).padStart(6)}  ${String(r.sec).padStart(4)}s  ${r.hasDone ? 'Y' : 'N'}      `
    + `${String(a.warn2).padStart(2)}/${String(a.warn3).padStart(2)}            `
    + (r.retry ? (r.retry.headsSun === 12 && r.retry.months === 12 ? '✅恢复' : '❌仍缺') : '-'));
}
console.log('═'.repeat(112));
console.log(`有效盘 ${valid.length} / 抓取 ${all.length}（HTTP≠200 或产物过短者不计入分母）`);
console.log(`初次缺月 ${bad.length} 盘 ⇒ 缺月率 ${valid.length ? (100 * bad.length / valid.length).toFixed(1) : '-'}%`);
console.log(`重抓恢复 ${recovered.length} 盘 · 稳定缺月 ${stable.length} 盘 ⇒ 稳定缺月率 ${valid.length ? (100 * stable.length / valid.length).toFixed(1) : '-'}%`);
const sumW2 = valid.reduce((s, r) => s + ((r.audit && r.audit.warn2) || 0), 0);
const sumW3 = valid.reduce((s, r) => s + ((r.audit && r.audit.warn3) || 0), 0);
const sumFx = valid.reduce((s, r) => s + ((r.audit && r.audit.fixed) || 0), 0);
const hitPlates = valid.filter((r) => r.audit && (r.audit.warn2 + r.audit.warn3) > 0).length;
console.log(`审计探针汇总（Prompt 4d「前堵」有效性指标）: 二级告警 ${sumW2} 处 / 三级告警 ${sumW3} 处`
  + ` / 一级纠正行 ${sumFx} ⇒ 命中盘 ${hitPlates}/${valid.length}（${valid.length ? (100 * hitPlates / valid.length).toFixed(0) : '-'}%）`);
const sumLeak = valid.reduce((s, r) => s + (r.leak || 0), 0);
const leakPlates = valid.filter((r) => (r.leak || 0) > 0).length;
console.log(`字段泄漏汇总（V488e 起纳入每批统计）: 残留字段名 ${sumLeak} 处 ⇒ 泄漏盘 ${leakPlates}/${valid.length}`);
console.log(`  ⚠️ 输出侧清洗器(stripYearlyPromptLeakage)若生效, 该值应为 0 —— 非 0 即「连接符枚举不全」的新变体`);
console.log(`  ⚠️ 该指标「只降不升」才是 4d 收紧生效的证据; 若纠正行上升而最终产物已正确, 属后锁正常接管`);
if (bad.length) {
  console.log('\n缺月明细:');
  for (const r of bad) {
    console.log(` ${r.name} ${r.birthDate} 首次 ${r.headsSun}/12（缺 ${r.missing.join(',') || '—'}）`
      + ` · [DONE]=${r.hasDone} · ${r.chars}字`
      + (r.retry ? ` ｜ 重抓 ${r.retry.headsSun}/12 · [DONE]=${r.retry.hasDone} · ${r.retry.chars}字` : ''));
  }
}
console.log(`\n判别提示: [DONE]=N 者指向传输层截断; [DONE]=Y 且缺月者指向生成侧早退(才是 V489 适用面)`);
