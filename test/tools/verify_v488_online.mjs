// V488 线上验收（跨 ≥2 盘）: 非月段「流年太阳」真值核查 + 生产锁离线复算自校验
// 用法: node test/tools/verify_v488_online.mjs [--offline <产物文件> ...]
//
// 判据（每盘 / 汇总）:
//   ① 月标题 12 条（真值权威, 也是本脚本真值表来源）
//   ② 非月段「流年太阳引用」可判样本错误数 = 0（独立核查, 不复用生产函数）
//   ③ 生产锁离线复算: 对线上产物再跑一次 ⇒ 纠正数应为 0（= 线上已生效且产物已正确）
//   ④ 幂等（连跑两次输出一致）
//   ⑤ 若有纠正: diff 只允许落在星座词/宫位词上（V484 类造词风险白名单）
//   ⑥ 内部字段泄漏 0
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');

// ── 生产锁（离线复算, 与线上同一份源码）──
function loadProd() {
  const { source: code } = closureDecls(SRC, ['lockYearlyNonMonthSunRef', 'auditYearlyNonMonthSunRef'], []);
  const logs = [];
  const ctx = { console: { log: (...a) => logs.push(a.map(String).join(' ')) }, __exports: {} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n__exports.lock = lockYearlyNonMonthSunRef;'
    + '\n__exports.audit = auditYearlyNonMonthSunRef;', ctx);
  ctx.__exports.logs = logs;
  return ctx.__exports;
}

const ZH_SIGN = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
const EN_SIGN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_ALT = ZH_SIGN.map((x) => x.replace('座', '')).join('|');
const ZH_NUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12 };
const dec = new TextDecoder('utf-8');

// 真值表 = 月标题（由 lockYearlyMonthTitles 按 months[i] 重写, 是已锁定权威）
function truthFromHeads(text) {
  const truth = new Map();          // 月号 → {sign, house}
  const headLines = new Set();
  const months = [];
  const seen = new Set();
  text.split('\n').forEach((l, i) => {
    const m = l.match(/^#{1,6}\s*(\d{4})年(\d{1,2})月[^\n]*?太阳\s*([\u4e00-\u9fa5]{2,3}座)\s*第\s*(\d+)\s*宫/);
    if (!m) return;
    const mo = Number(m[2]);
    if (!truth.has(mo)) truth.set(mo, { sign: m[3], house: Number(m[4]) });
    headLines.add(i);
    const key = Number(m[1]) * 12 + mo;
    if (seen.has(key)) return;
    seen.add(key);
    const zi = ZH_SIGN.indexOf(m[3]);
    if (zi >= 0) months.push({ month_key: `${m[1]}-${String(mo).padStart(2, '0')}`, sun: { sign: EN_SIGN[zi], house: Number(m[4]) } });
  });
  return { truth, headLines, matrix: { months } };
}

// 独立核查: 非月段流年太阳引用 vs 前置月份真值（独立实现, 同口径）
//   ⚠️ 首版用「太阳后 24 字内找星座」会漏报「承前省略」形态(如 L218 的后两处引用)
//      ⇒ 改为「句内任意引用 + 归属护栏(引用前最近行星名必须是太阳)」, 与生产同口径但独立实现。
//   自校验: 对 V487 旧产物(1985 盘)应报 8 处错 —— 与立项书原型一致, 否则核查器本身假绿。
function independentCheck(text, truth, headLines) {
  const lines = text.split('\n');
  const headIdx = [...headLines].sort((a, b) => a - b);
  const inMonth = new Set();
  headIdx.forEach((h, n) => {
    let end = n + 1 < headIdx.length ? headIdx[n + 1] : lines.length;
    for (let k = h + 1; k < end; k++) if (/^\s*##\s/.test(lines[k])) { end = k; break; }
    for (let k = h; k < end; k++) inMonth.add(k);
  });
  const refRe = new RegExp(`(${SIGN_ALT})座(?:\\s*第\\s*([\\d一二三四五六七八九十]{1,3})\\s*宫)?`, 'g');
  const PLANET = /(太阳|月亮|水星|金星|火星|木星|土星|天王星|海王星|冥王星|上升|中天)/g;
  let bad = 0, ok = 0, unjudge = 0;
  const detail = [];
  for (let i = 0; i < lines.length; i++) {
    if (headLines.has(i) || inMonth.has(i)) continue;
    for (const s of lines[i].split(/(?<=[。！？])/)) {
      if (!/太阳/.test(s) || !/流年|行运/.test(s)) continue;
      const anchors = [...s.matchAll(/(?:\d{4}\s*年)?\s*(\d{1,2})\s*月(?:份)?/g)]
        .map((m) => ({ end: m.index + m[0].length, mo: Number(m[1]) }));
      for (const m of s.matchAll(new RegExp(refRe.source, 'g'))) {
        const sign = m[1] + '座';
        const house = m[2] ? (ZH_NUM[m[2]] ?? Number(m[2])) : null;
        const before = s.slice(0, m.index);
        let last = null;
        for (const p of before.matchAll(new RegExp(PLANET.source, 'g'))) last = { name: p[1], idx: p.index };
        if (!last || last.name !== '太阳') continue;                                   // 归属护栏
        if (/本命|出生|原生|本盘/.test(before.slice(Math.max(0, last.idx - 2), last.idx))) continue;
        let a = null;
        for (const x of anchors) if (x.end <= m.index && (!a || x.end > a.end)) a = x;
        if (!a || m.index - a.end > 24) { unjudge++; detail.push(`○ L${i + 1} 无前置月份锚点 → 只能审计: 「${sign}${house ? ' 第' + house + '宫' : ''}」`); continue; }
        const tv = truth.get(a.mo);
        if (!tv) { unjudge++; continue; }
        if (sign !== tv.sign || (house != null && tv.house && house !== tv.house)) {
          bad++;
          detail.push(`❌ L${i + 1} 前置 ${a.mo} 月真值「${tv.sign} 第${tv.house}宫」vs 正文「${sign}${house ? ' 第' + house + '宫' : ''}」`);
        } else ok++;
      }
    }
  }
  return { bad, ok, unjudge, detail };
}

const norm = (s) => s
  .replace(/[白羊金牛双子巨蟹狮子处女天秤天蝎射手摩羯水瓶双鱼]座?/g, '#SIGN#')
  .replace(/第\s*(?:\d+|[一二三四五六七八九十]{1,3})\s*宫/g, '#HOUSE#');

async function fetchYearly(birthDate, birthTime, lat, lon, tz) {
  const t0 = Date.now();
  const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ free_access: 1, ...({ birthDate, birthTime, lat, lon, tz, lang: 'zh', reportType: 'yearly', nocache: true }) }),
    signal: AbortSignal.timeout(900000),
  });
  let raw = '';
  for await (const v of res.body) raw += dec.decode(v, { stream: true });
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
  return { text: best, sec: ((Date.now() - t0) / 1000).toFixed(0) };
}

// ── 主流程 ──
const prod = loadProd();
try {
  const h = await (await fetch('https://kindredsouls.online/api/health', { signal: AbortSignal.timeout(30000) })).json();
  console.log(`[健康] deploymentId=${h.deploymentId || h.deployment_id || '(none)'}  版本=${h.version || '-'}`);
} catch (e) { console.log('[健康] 取用失败:', e.message); }

const PLATES = [
  { name: 'A·1997-10-18', birthDate: '1997-10-18', birthTime: '14:30' },
  { name: 'B·1985-06-20', birthDate: '1985-06-20', birthTime: '09:15' },
];
const LAT = '69.6492', LON = '18.9553', TZ = 'Europe/Oslo';

const offline = process.argv.indexOf('--offline');
const rows = [];
let allBad = 0, allFixed = 0, allLeak = 0, allHeads = 0, plateN = 0;

const inputs = [];
if (offline > 0) {
  for (const f of process.argv.slice(offline + 1)) inputs.push({ name: path.basename(f), text: fs.readFileSync(f, 'utf8') });
} else {
  for (const p of PLATES) {
    console.log(`→ 抓取 ${p.name} ...`);
    const r = await fetchYearly(p.birthDate, p.birthTime, LAT, LON, TZ);
    console.log(`  ← ${r.sec}s · ${r.text.length} 字`);
    fs.writeFileSync(`/tmp/ks_v488_${p.birthDate}.txt`, r.text);
    inputs.push({ name: p.name, text: r.text });
  }
}

console.log('\n' + '═'.repeat(78));
for (const { name, text } of inputs) {
  plateN++;
  const { truth, headLines, matrix } = truthFromHeads(text);
  const heads = (text.match(/^#{1,6}\s*\d{4}年\d{1,2}月/gm) || []).length;
  const ind = independentCheck(text, truth, headLines);
  prod.logs.length = 0;
  const fixedDoc = prod.lock(text, 'zh', matrix, 'yearly');
  const lockLogs = [...prod.logs];
  const twice = prod.lock(fixedDoc, 'zh', matrix, 'yearly');
  const a = prod.audit(text, 'zh', matrix, 'yearly');
  const leak = (text.match(/风控(?:切入)?(?:主线|角度|视角|重点)|叙述镜头分配表|表达框架分配表/g) || []).length;

  // diff 白名单
  const A = text.split('\n'), B = fixedDoc.split('\n');
  let diffOk = true, diffLines = 0;
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    if ((A[i] || '') === (B[i] || '')) continue;
    diffLines++;
    if (norm(A[i] || '') !== norm(B[i] || '')) { diffOk = false; console.log(`  ⚠️ 越界改动 L${i + 1}: ${A[i]} → ${B[i]}`); }
  }
  const eq = fixedDoc !== text;
  const fixedCount = eq ? diffLines : 0;

  console.log(`\n盘 ${name}: ${text.length} 字 · 真值表 ${truth.size} 月 · 月标题 ${heads} 条`);
  console.log(`  ② 独立核查: ❌错 ${ind.bad} / ✅对 ${ind.ok} / ○不可判 ${ind.unjudge}`);
  ind.detail.slice(0, 12).forEach((d) => console.log(`      ${d}`));
  console.log(`  ③ 生产锁复算: 纠正 ${fixedCount} 行${eq ? '（❌ 线上产物尚有未锁值）' : '（✅ 线上产物已全对）'}`);
  lockLogs.filter((l) => /一级纠正|告警/.test(l)).slice(0, 12).forEach((l) => console.log(`      ${l}`));
  console.log(`  ④ 幂等: ${twice === fixedDoc ? '✅' : '❌'}   ⑤ diff 白名单: ${diffOk ? '✅' : '❌'}   ⑥ 内部字段泄漏: ${leak}`);
  console.log(`  ℹ️ 审计(只检不改): 二级 ${a ? a.warn2 : '-'} / 三级 ${a ? a.warn3 : '-'}`);

  rows.push([
    ['月标题 12 条', heads === 12],
    ['非月段真值核查 0 错', ind.bad === 0],
    ['生产锁复算 0 纠正', fixedCount === 0],
    ['幂等', twice === fixedDoc],
    ['diff 白名单', diffOk],
    ['内部字段泄漏 0', leak === 0],
  ].map(([n, p]) => `${p ? '✅' : '❌'} ${n}`).join('  |  '));
  allBad += ind.bad; allFixed += fixedCount; allLeak += leak; allHeads += (heads === 12 ? 1 : 0);
}
console.log('\n' + '═'.repeat(78));
rows.forEach((r, i) => console.log(` ${inputs[i].name}\n   ${r}`));
console.log('═'.repeat(78));
// ⚠️ 判据分两组: 「月标题 12 条」是**样本有效性**(真值表来源), 不满足 ⇒ 该盘复验力度不足;
//   V488 核心判据(0 错 / 0 未锁残留 / 幂等 / 白名单 / 泄漏 0)与之独立, 不得混为一谈。
const corePass = allBad === 0 && allFixed === 0 && allLeak === 0;
console.log(`核心判据汇总: 盘数 ${plateN} · 非月段错误 ${allBad} · 未锁残留 ${allFixed} · 字段泄漏 ${allLeak}`);
console.log(`样本有效性: 12 月齐备盘 ${allHeads}/${plateN}`);
if (allHeads < plateN) {
  console.log(`⚠️ 有 ${plateN - allHeads} 个盘的月度章节不足 12 条(LLM 偶发漏月, 与 V488 无关)`
    + ` ⇒ 该盘真值表覆盖不全, 建议重抓复验后再下结论`);
}
console.log(corePass ? '✅ V488 核心判据跨盘全绿' : '❌ V488 核心判据未通过');
process.exit(corePass ? 0 : 1);
