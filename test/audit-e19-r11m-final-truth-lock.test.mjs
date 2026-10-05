// ═══════════════════════════════════════════════════════════════════
// 🛡️ E19/R11m: 「真值锁最终话语权」末道回归闸门（E19 收官 P0 闭环）
//
// 事故背景（2026-10-05 E19 批测 s2/en Adelaide 盘, CRITIC 判据12 余警 5 处）:
//   A. `_v432LockLeadingNatal`（本命真值链）挂在链**中段**（V492b 位置）。其「物主本命句」
//      准入 = `_v512PossessiveNatal` 四重否决, 其中
//        ① `_v432SentTransitMarked` → `_V492B_LEAD_TRANSIT.en` 命中**任意 `20\d{2}` 年份**
//        ② `_V512_MONTH_TOK` → 命中月名词
//      ⇒ 只要句窗里有年份/月份词（链中段文本仍带时间线残渣/标题粘连）, 该句即被判为「流年语境」
//        而弃权（宁漏不改）。
//   B. 这些残渣随后被 `cleanYearlyTimeline`/`dedupYearlyMonthTitles` 清掉 ⇒ **落库文本的句窗
//      反而干净** ⇒ 「离线把库内文本喂真值锁能修、线上产物却保留错值」——E18/E19 两次
//      「离线能修线上不修」之谜的真因。
//   C. 终局形态: `Saturn in Aquarius in your 4th House`(真值 H2)、`Pluto in Scorpio in your
//      1st House`(真值 H11) 错值落库 ⇒ CRITIC 判据12 报 5 处。
//
// 修复: 在**所有文本清洗/去重之后**追加「真值锁最终话语权」末道（非流式 + 流式两链同源）。
//   实测: 12 盘落盘文本追加一次 ⇒ 11/12 盘零 churn（Δ=0），残差盘恰好修好（Δ=2, 判据12 5→0），
//   且二次施加严格幂等（12/12 Δ=0）。
//
// 本测试: 结构级（两链接线位置）+ 行为级（假矩阵, 零 python）+ 阻塞机制复刻 + 注入自测。
// ⚠️ 纪律: 断言源码一律用 String.includes / indexOf 切片, 不用带 `\s` 的正则（转写天坑）。
// ═══════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../astro-truth.js';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

// —— 两链末道调用的逐字源码（判据与注入自测共用同一字面量, 保证「自测证明判据会红」）——
const FINAL_CALL_NONSTREAM = "if (reportType === 'yearly') {\n          reportContent = _v432LockLeadingNatal(reportContent, lang, astroMatrix, reportType);\n        }";
const FINAL_CALL_STREAM = "if (reportType === 'yearly') cleanedText = _v432LockLeadingNatal(cleanedText, lang, astroMatrix, reportType);";

function region(startMarker, endMarker) {
  const i = SRC.indexOf(startMarker);
  assert.ok(i >= 0, `未找到起点标记: ${startMarker.slice(0, 40)}`);
  const j = SRC.indexOf(endMarker, i);
  assert.ok(j > i, `未找到终点标记: ${endMarker.slice(0, 40)}`);
  return SRC.slice(i, j);
}

// 非流式链区间 / 流式链区间
const NONSTREAM = () => region('const _e10PostProcess = (aiResult) => {', '};  // ── end _e10PostProcess ──');
const STREAM = () => region("cleanedText = lockYearlyNonMonthSunRef(", "if (reportType === 'monthly') cleanedText = fixMoonHouseParens(cleanedText);");

/** 判据: 末道调用必须存在, 且位于「全部清洗/去重」之后 */
function hasFinalPass(body, callLiteral, afterMarker, beforeMarker) {
  if (!body.includes(callLiteral)) return false;
  const p = body.indexOf(callLiteral);
  const a = body.indexOf(afterMarker);
  const b = body.indexOf(beforeMarker);
  if (a < 0 || b < 0) return false;
  return a < p && p < b;
}

test('① 结构级: 非流式链（_e10PostProcess）真值锁末道 —— 在 dedupYearlyMonthTitles 之后、injectHighLatitudeNotice 之前', () => {
  const b = NONSTREAM();
  assert.ok(hasFinalPass(b, FINAL_CALL_NONSTREAM, 'dedupYearlyMonthTitles(reportContent, lang, reportType)', 'injectHighLatitudeNotice(reportContent, astroMatrix, lang)'),
    '非流式链缺「真值锁最终话语权」末道（或接线位置错误: 必须在全部清洗/去重之后）');
});

test('② 结构级: 流式链同源接线 —— 在 dedupYearlyMonthTitles 之后', () => {
  const b = STREAM();
  assert.ok(b.includes(FINAL_CALL_STREAM),
    '流式链缺「真值锁最终话语权」末道（前端走 /stream, 必须两链同源）');
  const p = b.indexOf(FINAL_CALL_STREAM);
  const d = b.indexOf('cleanedText = dedupYearlyMonthTitles(cleanedText, lang, reportType);');
  assert.ok(d >= 0 && d < p, '流式链末道必须接在 dedupYearlyMonthTitles 之后');
});

// ═══════════════ 行为级: vm 抽取 + 假矩阵（零 python） ═══════════════
const SEEDS = ['_v432LockLeadingNatal', '_v432LockNatal', '_v492cLockAxisSalutation', '_v432Clause',
  '_v432ClaimOf', '_v432PatchZone', '_v432Truth', '_v432TruthMatch', '_v432SlotOf', '_v432Signs',
  '_v432SignAlts', '_v432AllSignWords', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS',
  '_V432_EN2LOC', '_V432_ZH_NUM', '_V432_ES_ORD', '_V432_ES_ORD_FORMAT', '_v432Esc', '_v432FindHouse',
  '_v432AdjudicateDescriptors', '_v432Normalize', '_v512PossessiveNatal', '_v512PossessiveTouch',
  '_v512SentWindow', '_V512_POSS', '_V512_MONTH_TOK', '_V512_POSS_NEAR', '_v432ResolveOverlaps',
  '_v432SentTransitMarked', 'SUN_SIGN_EN', '_EN2ZIDX', '_v432EnOrdSuf', '_v436InThMonth',
  '_V512_TIME_QUAL', '_V512_PLACE_AFTER', '_v512SignSpanHouses', '_v516SignAlt', '_V516_HOUSE_WORD',
  '_V492B_SENT_BREAK', '_V492B_LEAD_TRANSIT'];
const { map } = closureDecls(SRC, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); } }
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
for (const n of SEEDS) assert.ok(map.has(n), `VM 未能抽取 ${n}`);

function build() {
  const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const body = [...map.entries()].sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1])).map(e => e[1]).join('\n\n');
  vm.runInContext(body + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = build();

// 假盘（Adelaide 形态）: 本命 土星=水瓶座第2宫 / 冥王=天蝎座第11宫; 上升=摩羯座
const CH = {
  Sun: { sign: 'Sagittarius', house: 12 }, Moon: { sign: 'Leo', house: 8 }, Mercury: { sign: 'Capricorn', house: 2 },
  Venus: { sign: 'Scorpio', house: 11 }, Mars: { sign: 'Sagittarius', house: 12 }, Jupiter: { sign: 'Libra', house: 10 },
  Saturn: { sign: 'Aquarius', house: 2 }, Uranus: { sign: 'Capricorn', house: 1 }, Neptune: { sign: 'Capricorn', house: 1 },
  Pluto: { sign: 'Scorpio', house: 11 },
};
const M = { months: [], meta: { computed_houses: CH, sun_sign: 'Sagittarius', rising_sign: 'Capricorn' } };

const HEAD0 = '### July 2026: Sun in Cancer · 7th House · The Contract That Feeds You';
const HEAD1 = '### August 2026: Sun in Leo · 8th House · The Deep Asset Awakens';
// ⚠️ 前导段不可缺: `_v432LockLeadingNatal` 以「首个 月锚点」为 cut, 若月标题落在文本 0 位则
//    cut<=0 ⇒ 整函数 return（夹具会「平凡通过」假绿）。
const LEAD = '**Core Natal Code: natal Sun Sagittarius · natal Moon Leo · Rising Capricorn**';
const SENT_SATURN = 'Saturn in Aquarius in your 4th House forms a demanding angle to this Virgo Sun, giving you a sobering checkpoint.';
// ⚠️ 物主句不得含时间限定词（this month/year/now…）—— 门控⑤ _V512_TIME_QUAL 会正当弃权（宁漏不改）
const SENT_PLUTO = 'Pluto in Scorpio in your 1st House is rebuilding your sense of self.';
// 清洗之后的链尾文本（句窗干净）= 末道的输入
const CLEAN = [LEAD, HEAD0, SENT_SATURN, HEAD1, SENT_PLUTO].join('\n');
// 链中段形态（复刻阻塞机制）: 句窗内带年份 ⇒ 门控① `20\d{2}` 命中 ⇒ 物主本命句弃权
const BLOCKED = [LEAD, HEAD0, SENT_SATURN.replace(' in your 4th House', ' in your 4th House in 2026'), HEAD1, SENT_PLUTO].join('\n');

test('③ 行为级: 清洗后的链尾文本 ⇒ 末道必须把物主本命句纠回真值', () => {
  const out = F._v432LockLeadingNatal(CLEAN, 'en', M, 'yearly');
  assert.ok(out.includes('Saturn in Aquarius in your 2nd House'), '土星物主句未纠回本命第2宫（真值 H2）');
  assert.ok(out.includes('Pluto in Scorpio in your 11th House'), '冥王物主句未纠回本命第11宫（真值 H11）');
  assert.ok(!out.includes('in your 4th House forms a demanding angle'), '土星错值 4th 残留');
  assert.ok(!out.includes('in your 1st House is rebuilding'), '冥王错值 1st 残留');
});

test('④ 阻塞机制复刻: 句窗内含年份 ⇒ 真值锁必须弃权（宁漏不改）——这正是「链中段漏纠」的成因', () => {
  const out = F._v432LockLeadingNatal(BLOCKED, 'en', M, 'yearly');
  assert.ok(out.includes('in your 4th House in 2026'), '年份残留场景下仍被改写 ⇒ 隐藏了回归风险（判据③不再承重）');
  // 对照: 清掉年份后同一句必须被纠回 ⇒ 证明末道「清洗之后收口」是有效治法
  const fixed = F._v432LockLeadingNatal(CLEAN, 'en', M, 'yearly');
  assert.ok(fixed.includes('in your 2nd House'), '对照失效: 无年份残留时未纠回');
});

test('⑤ 幂等: 末道二次施加零改动 f(f(x)) === f(x)', () => {
  const once = F._v432LockLeadingNatal(CLEAN, 'en', M, 'yearly');
  const twice = F._v432LockLeadingNatal(once, 'en', M, 'yearly');
  assert.strictEqual(twice, once, '末道二次施加有改动, 破坏幂等（HIT ≡ MISS 逐字契约风险）');
});

// ═══════════════ 注入缺陷自测: 证明判据①②是「会红的」 ═══════════════
test('⑥ 注入自测: 摘除非流式末道 ⇒ 判据① 必红（修法是承重的）', () => {
  const b = NONSTREAM();
  assert.ok(hasFinalPass(b, FINAL_CALL_NONSTREAM, 'dedupYearlyMonthTitles(reportContent, lang, reportType)', 'injectHighLatitudeNotice(reportContent, astroMatrix, lang)'),
    '前提失效: 真实源码未通过判据①（与实现脱钩）');
  const injected = b.replace(FINAL_CALL_NONSTREAM, '');
  assert.ok(injected !== b, '注入失败: 未能在源码副本中摘除末道调用');
  assert.ok(!hasFinalPass(injected, FINAL_CALL_NONSTREAM, 'dedupYearlyMonthTitles(reportContent, lang, reportType)', 'injectHighLatitudeNotice(reportContent, astroMatrix, lang)'),
    '注入后判据①仍绿 ⇒ 判据不承重（假绿）');
});

test('⑦ 注入自测: 摘除流式末道 ⇒ 判据② 必红（修法是承重的）', () => {
  const b = STREAM();
  assert.ok(b.includes(FINAL_CALL_STREAM), '前提失效: 真实源码缺流式末道');
  const injected = b.replace(FINAL_CALL_STREAM, '');
  assert.ok(injected !== b, '注入失败: 未能在源码副本中摘除流式末道');
  assert.ok(!injected.includes(FINAL_CALL_STREAM), '注入后判据②仍绿 ⇒ 判据不承重（假绿）');
});
