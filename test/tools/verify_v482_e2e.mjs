// ═══════════════════════════════════════════════════════════════════
// V482 线上端到端真值验证（不做本地改写，只看**生产端产物本身**是否已合规）
// 用法: PATH=<swisseph venv>:$PATH node test/tools/verify_v482_e2e.mjs
//
// 判据（全部对**线上返回的干净产物**打分, 而非对本地锁的输出打分）:
//   ① 月亮真值: 不得出现「射手座月亮」(sign-bleed); 任何「<星座>月亮」必须是双鱼座。
//   ② 跨月串染: 每个月份段内流年行星的星座必须等于该月真值(火星 2026-10 起不得再是巨蟹座)。
//   ③ 第五章括号残渣: 「卧室/厨房/财务室 区域」标签必须是规范写法, 无 `))`/重复宫位残渣。
//   ④ 收敛性(单调判据, 不写死版本): 对线上正文再跑一次 lockYearlyTransitSigns → **零 diff**。
//      (线上若已应用该锁, 二次应用必为不动点; 线上仍是旧码则会有 diff。)
// ═══════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../../astro-truth.js';
import { getAstroMatrix } from '../../v69_client.js';
import { closureDecls } from './extract_decls.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const SEEDS = ['lockYearlyTransitSigns', 'lockYearlyMonthTitles', '_v482SignAdjacent', '_v432Clause',
  '_v432LockNatal', '_v432AdjudicateDescriptors', '_v432Normalize', '_v432Truth', '_v432TruthMatch',
  '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse', '_v432AllSignWords', '_v432Signs',
  '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS', '_V432_EN2LOC', '_v432Esc',
  '_V482_FWD_BREAK', '_V482_FWD_CONJ', '_V482_TRANSIT_KEYS', '_V482_TVERB', '_V478_EN_MONTHS', 'SUN_SIGN_EN',
  '_v444Signs', '_v444Esc', '_v479IsMonthTitleLine'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch { map.delete(n); } }
const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
vm.createContext(ctx);
vm.runInContext([...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map(e => e[1]).join('\n\n')
  + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
const F = ctx.__exports;

const birthDate = '1999-12-15', birthTime = '14:30', lat = '69.6492', lon = '18.9553', tz = 'Europe/Oslo', lang = 'zh';

// ── 1. 清缓存(精确到该盘该语言该类型) ──
try {
  const cr = await fetch(`https://kindredsouls.online/api/clear-cache/${birthDate}/${lang}/yearly`);
  console.log('clear-cache:', cr.status, await cr.text());
} catch (e) { console.log('clear-cache 失败(忽略):', e.message); }

// ── 2. 拉生产端年报(真流式) ──
const res = await fetch('https://kindredsouls.online/api/wealth-oracle/stream', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ free_access: 1, ...({ birthDate, birthTime, lat, lon, tz, lang, reportType: 'yearly', nocache: true }) }),
});
let buf = '', full = '', sanitized = '';
const dec = new TextDecoder();
for await (const v of res.body) {
  buf += dec.decode(v, { stream: true });
  const ls = buf.split('\n'); buf = ls.pop() || '';
  for (const l of ls) {
    const t = l.trim();
    if (!t.startsWith('data: ')) continue;
    const d = t.slice(6).trim();
    if (d === '[DONE]') continue;
    try { const p = JSON.parse(d); if (p.text) full = (full && p.text.startsWith(full)) ? p.text : full + p.text; if (p.sanitized) sanitized = p.sanitized; } catch {}
  }
}
const text = sanitized || full;
fs.writeFileSync('/tmp/ks1999_v482_e2e.txt', text);
console.log(`生产端年报: ${text.length} 字 → /tmp/ks1999_v482_e2e.txt`);

const M = await getAstroMatrix(birthDate, birthTime, +lat, +lon, tz, { reportType: 'yearly' });   // 🛡️ V483: 年报走财年窗口
const ch = M?.meta?.computed_houses || {};
console.log(`\n[真值盘] 太阳=${ch.Sun?.sign}第${ch.Sun?.house}宫 | 月亮=${ch.Moon?.sign}第${ch.Moon?.house}宫 | 上升=${M?.meta?.rising_sign}`);

const fail = [];
const ok = (cond, msg) => { console.log(`  ${cond ? '✅' : '❌'} ${msg}`); if (!cond) fail.push(msg); };

// ── 判据① 月亮真值 ──
console.log('\n=== 判据① 月亮真值(反 sign-bleed) ===');
const SIGNS_ZH = ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'];
const moonMentions = [...text.matchAll(new RegExp('(' + SIGNS_ZH.join('|') + ')座月亮', 'g'))].map(m => m[1] + '座');
const moonSet = [...new Set(moonMentions)];
console.log('  正文出现的「<星座>月亮」:', moonSet.length ? moonSet.join(', ') : '(无)');
ok(!/射手座月亮/.test(text), '不得出现「射手座月亮」(月亮被串用太阳星座)');
ok(moonSet.every(s => s === '双鱼座'), `所有「<星座>月亮」必须是双鱼座, 实得: ${moonSet.join(', ') || '(无)'}`);

// ── 判据② 跨月流年行星星座 ──
console.log('\n=== 判据② 逐月流年行星星座(反跨月沿用) ===');
const lines = text.split('\n');
const heads = [];
for (let i = 0; i < lines.length; i++) {
  const ym = lines[i].trim().match(/^#{1,6}\s.*?(\d{4})年(\d{1,2})月/);
  if (ym) heads.push({ line: i, key: +ym[1] * 12 + +ym[2] });
}
console.log(`  月标题行数: ${heads.length}`);
ok(heads.length >= 12, `年报必须有 ≥12 个月标题行, 实得 ${heads.length}`);
heads.sort((a, b) => a.key - b.key);
const base = heads[0]?.key ?? 0;
const ZH = { Sun: '太阳', Mercury: '水星', Venus: '金星', Mars: '火星', Jupiter: '木星', Saturn: '土星', Uranus: '天王星', Neptune: '海王星', Pluto: '冥王星' };
const wrong = [];
for (let h = 0; h < heads.length; h++) {
  const idx = heads[h].key - base;
  const m = M.months?.[idx]; if (!m) continue;
  const start = heads[h].line + 1;
  let end = (h + 1 < heads.length) ? heads[h + 1].line : lines.length;
  for (let k = start; k < end; k++) { if (/^\s*##\s/.test(lines[k])) { end = k; break; } }
  for (let li = start; li < end; li++) {
    const ln = lines[li] || ''; if (!ln) continue;
    for (const [key, zh] of Object.entries(ZH)) {
      const pm = m[key.toLowerCase()]; if (!pm?.sign) continue;
      const trueSign = {
        Aries: '白羊', Taurus: '金牛', Gemini: '双子', Cancer: '巨蟹', Leo: '狮子', Virgo: '处女',
        Libra: '天秤', Scorpio: '天蝎', Sagittarius: '射手', Capricorn: '摩羯', Aquarius: '水瓶', Pisces: '双鱼',
      }[pm.sign];
      // ⚠️ 只查「行星+动词+星座」这一形态(与产品锁 lockYearlyTransitSigns 同构)，
      //    并镜像其**本命守卫**: 行星名前 12 字含 本命/出生/原生/本盘 → 本命句, 不参与流年判据。
      const re = new RegExp(zh + '(?:在|行经|进入|入驻|落入|位于|走到|移至|来到|抵达)\\s*([\\u4e00-\\u9fa5]{2,3}座)', 'g');
      for (const mm of ln.matchAll(re)) {
        const pre = ln.slice(Math.max(0, mm.index - 12), mm.index);
        if (/(?:本命|出生|原生|本盘)/.test(pre)) continue;   // 本命句归本命锁
        if (mm[1].replace(/座$/, '') !== trueSign) wrong.push(`第${idx + 1}月段(标题行${heads[h].line}): ${zh} 真值=${trueSign}座, 正文写=${mm[1]} | ${ln.slice(0, 70)}`);
      }
    }
  }
}
ok(wrong.length === 0, `逐月流年行星星座零矛盾, 实得 ${wrong.length} 处`);
wrong.slice(0, 12).forEach(w => console.log('     · ' + w));

// ── 判据⑤ 中文年报月标题不得残留英文(V482b) ──
console.log('\n=== 判据⑤ 月标题英文残留(V482b) ===');
const monthTitleLines = lines.filter(l => /^#{1,6}\s.*(\d{4})年(\d{1,2})月/.test(l));
const latinTitles = monthTitleLines.filter(l => /[A-Za-z]/.test(l));
latinTitles.slice(0, 12).forEach(l => console.log('     · ' + l.slice(0, 100)));
ok(latinTitles.length === 0, `zh 月标题不得含拉丁字母(如 Sun in / House N), 实得 ${latinTitles.length} 行`);
ok(monthTitleLines.every(l => /太阳/.test(l)), 'zh 月标题必须含本地引导词「太阳」');

// ── 判据⑥ 同月重复标题行必须为 0(V482b) ──
console.log('\n=== 判据⑥ 同月重复标题(V482b) ===');
const keyCount = new Map();
for (const l of monthTitleLines) {
  const mm = l.match(/(\d{4})年(\d{1,2})月/);
  if (!mm) continue;
  const k = mm[1] + '-' + mm[2];
  keyCount.set(k, (keyCount.get(k) || 0) + 1);
}
const dups = [...keyCount.entries()].filter(([, c]) => c > 1);
dups.forEach(([k, c]) => console.log(`     · ${k} 出现 ${c} 次`));
ok(dups.length === 0, `同一个月不得出现多行标题, 实得 ${dups.length} 个月重复`);
ok(monthTitleLines.length === 12, `月标题必须恰好 12 行, 实得 ${monthTitleLines.length}`);

// ── 判据⑦ 财年窗口（V483）──
console.log('\n=== 判据⑦ 时间窗口 = 当年 7 月至次年 6 月(V483) ===');
const ymKeys = monthTitleLines.map((l) => { const m = l.match(/(\d{4})年(\d{1,2})月/); return m ? `${m[1]}-${String(+m[2]).padStart(2, '0')}` : null; }).filter(Boolean);
const uniqSorted = [...new Set(ymKeys)].sort();
const expKeys = []; { let y = M?.meta?.report_window?.start_year, mo = M?.meta?.report_window?.start_month;
  for (let i = 0; i < 12; i++) { expKeys.push(`${y}-${String(mo).padStart(2, '0')}`); mo++; if (mo > 12) { mo = 1; y++; } } }
console.log(`  服务器窗口: ${expKeys[0]} ~ ${expKeys[11]} | 正文实得: ${uniqSorted[0] || '?'} ~ ${uniqSorted[uniqSorted.length - 1] || '?'}`);
ok(expKeys[0].endsWith('-07'), `财年起点必须是 7 月, 实得 ${expKeys[0]}`);
ok(uniqSorted.length === 12 && uniqSorted.every((k, i) => k === expKeys[i]),
  `正文 12 个月必须严格等于财年窗口 ${expKeys[0]}~${expKeys[11]}, 实得 ${uniqSorted.join(',')}`);

// ── 判据③ 第五章括号/宫位残渣 ──
console.log('\n=== 判据③ 第五章空间标签括号残渣 ===');
const CANON = { 卧室区域: '卧室区域:第四宫(田宅宫)', 厨房区域: '厨房区域:第二宫(财帛宫)与第八宫(共享资源)', 财务室区域: '财务室区域:第八宫(共享资源)' };
const badLabels = lines.filter(l => Object.keys(CANON).some(k => l.includes(k + ':') || l.includes(k + '：'))
  && !Object.values(CANON).some(c => l.includes(c)));
badLabels.forEach(l => console.log('     · ' + l.slice(0, 120)));
ok(badLabels.length === 0, `空间标签行必须为规范写法, 实得 ${badLabels.length} 行异常`);
ok(!/\)\)/.test(text), '不得出现「))」双右括号残渣');
// ⚠️ 只在**紧邻**重复时才算残渣：规范写法「第二宫(财帛宫)与第八宫(共享资源)」里
//    「财帛宫)…共享资源」是合法结构, 不能误伤(实测被误报过一次)。
ok(!/(田宅宫|财帛宫|共享资源)[)）]\s*[)）]?\s*(田宅宫|财帛宫|共享资源)/.test(text), '不得出现宫位名紧邻重复残渣');

// ── 判据④ 收敛性(单调判据) ──
console.log('\n=== 判据④ 幂等收敛(线上产物再跑一次锁 → 必须零 diff) ===');
const out = F.lockYearlyTransitSigns(text, lang, M, 'yearly');
const A = text.split('\n'), B = out.split('\n');
let diffs = 0;
for (let i = 0; i < Math.max(A.length, B.length); i++) {
  if (A[i] !== B[i]) { diffs++; if (diffs <= 8) console.log(`  [行${i}]\n    - ${A[i]}\n    + ${B[i]}`); }
}
ok(diffs === 0, `线上产物已是该锁的不动点, 实得 ${diffs} 处 diff`);

// ── 结论 ──
console.log('\n' + '='.repeat(60));
if (fail.length === 0) { console.log('✅ V482 线上端到端真值验证：全部通过'); }
else { console.log(`❌ V482 线上端到端真值验证：${fail.length} 项未过`); fail.forEach(f => console.log('   - ' + f)); process.exitCode = 1; }
