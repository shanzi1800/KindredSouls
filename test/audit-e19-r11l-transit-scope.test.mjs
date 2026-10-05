// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E19/R11l: 年报流年锁「越界改写本命句」回归闸门
// 事故背景（2026-10-05 生产端 s2/en Adelaide 盘, CRITIC 判据12 余警真因）:
//   A. en 年报章节标题是 `### Chapter III~V`（三级）, 而 V482 lockYearlyTransitSigns
//      的段尾守卫只认 `## `（二级）⇒ 守卫形同虚设, 末月段(June 2027)一路吞到文末,
//      第三/四章正文被按末月流年真值改写。
//   B. 本命句 `Saturn in Aquarius in your 4th House`(真值 H2) 被改成流年 `Aries`;
//      Aries 恰跨该盘第4宫 ⇒ 下游本命锁门控 _v512PossessiveNatal ⑥「流年一致性否决」
//      判 false ⇒ 本命锁集体弃权 ⇒ 错值 H4/H1 终局落库。
//      离线把库内文本喂本命锁却能修(星座已是本命值 ⇒ 门控 true) ⇒ 「本地能修线上不修」假象。
// 修复(双保险): ① 段尾守卫升级 = 任何【非月标题】标题行终止月段;
//              ② V482 回调内本命星座豁免(匹配星座 ≡ 本命星座 ⇒ 弃权, 宁漏不改)。
// 本测试: 源码级结构断言 + 假矩阵行为验证(零 python) + 【注入缺陷自测】(双层)。
// ⚠️ 教训: 断言源码用 String.includes / 纯字符串替换, 不用带 \s 转义的正则
//    (正则里 `\s` 是空白符, 字面 `\s` 须 `\\s`, 极易写错 ⇒ 判据静默失真)。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../astro-truth.js';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

/** 取函数体(大括号配平, 跳过字符串/注释里的花括号; 签名默认参须先配平圆括号) */
function fnBody(name, source = src) {
  const at = source.indexOf(`function ${name}(`);
  assert.ok(at > 0, `未找到函数 ${name}`);
  let p = source.indexOf('(', at), pd = 0, j = p, inQ = null;
  for (; j < source.length; j++) {
    const c = source[j];
    if (inQ) { if (c === '\\') { j++; continue; } if (c === inQ) inQ = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inQ = c; continue; }
    if (c === '(') pd++;
    else if (c === ')') { pd--; if (!pd) break; }
  }
  const open = source.indexOf('{', j);
  let d = 0, i = open, inS = null, inC = null;
  for (; i < source.length; i++) {
    const c = source[i];
    if (inC) { if (c === '\n') inC = null; continue; }
    if (inS) { if (c === '\\') { i++; continue; } if (c === inS) inS = null; continue; }
    if (c === '/' && source[i + 1] === '/') { inC = 1; continue; }
    if (c === '/' && source[i + 1] === '*') { const e = source.indexOf('*/', i); i = e + 1; continue; }
    if (c === '"' || c === "'" || c === '`') { inS = c; continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) break; }
  }
  return source.slice(at, i + 1);
}

// 源码字面量(与 server.js 逐字一致; 判据与注入自测共用, 保证「自测证明判据会红」)
const GUARD_NEW = 'if (/^\\s*#{1,6}\\s/.test(lines[k]) && !_v516MonthHeadKey(lines[k].trim(), lang)) { end = k; break; }';
const GUARD_OLD = 'if (/^\\s*##\\s/.test(lines[k])) { end = k; break; }';
const EXEMPT_LINE = 'if (_natalSignRe[key] && _natalSignRe[key].test(signWord)) return full;';
const TRUTH_CALL = "_v432Truth(lang, astroMatrix, 'natal')";

test('① 段尾守卫: 必须是「任意级别非月标题终止月段」, 旧 `## ` 单级守卫不得残留', () => {
  const b = fnBody('lockYearlyTransitSigns');
  assert.ok(b.includes(GUARD_NEW), 'V482 缺新段尾守卫(任意级别非月标题终止)');
  assert.ok(!b.includes(GUARD_OLD), '旧 `## ` 单级守卫残留');
});
test('② 本命星座豁免接线: _v432Truth(natal) + _natalSignRe 弃权必须存在', () => {
  const b = fnBody('lockYearlyTransitSigns');
  assert.ok(b.includes(TRUTH_CALL), '缺 _v432Truth(natal) 真值源');
  assert.ok(b.includes(EXEMPT_LINE), '缺本命星座豁免弃权行');
});

// ═══════════════ 行为级: vm 抽取 + 假矩阵(零 python) ═══════════════
const SEEDS = ['lockYearlyTransitSigns', '_v432Clause', '_v432Truth', '_v432TruthMatch', '_v432SlotOf',
  '_v432Signs', '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER', '_V432_LANGS', '_V432_EN2LOC',
  '_V432_ZH_NUM', '_v432Esc', '_v444Signs', '_v444Esc', '_V482_TRANSIT_KEYS', '_V482_TVERB',
  '_v432AllSignWords', '_v516SignAlt', '_v516MonthHeadKey', '_V516_HOUSE_WORD', 'SUN_SIGN_EN', '_v432EnOrdSuf'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); } }
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
for (const n of SEEDS) assert.ok(map.has(n), `VM 未能抽取 ${n}`);

function build(hack) {
  const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map(e => (hack && hack[e[0]] ? hack[e[0]] : e[1])).join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = build();

const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
// 假盘: 本命 土星=金牛座第11宫 / 冥王=天蝎座第6宫; 各月流年 土星=白羊第10宫 / 冥王=水瓶第8宫
const CH = {
  Sun: { sign: 'Sagittarius', house: 6 }, Moon: { sign: 'Pisces', house: 9 }, Mercury: { sign: 'Sagittarius', house: 6 },
  Venus: { sign: 'Scorpio', house: 5 }, Mars: { sign: 'Aquarius', house: 8 }, Jupiter: { sign: 'Aries', house: 10 },
  Saturn: { sign: 'Taurus', house: 11 }, Uranus: { sign: 'Aquarius', house: 8 }, Neptune: { sign: 'Aquarius', house: 8 },
  Pluto: { sign: 'Scorpio', house: 6 },
};
const months = Array.from({ length: 12 }, (_, i) => ({
  sun: { sign: SIGNS_EN[(5 + i) % 12], house: (i % 12) + 1 },
  mars: { sign: 'Cancer', house: 1 }, uranus: { sign: 'Gemini', house: 12 },
  jupiter: { sign: 'Leo', house: 2 }, saturn: { sign: 'Aries', house: 10 }, pluto: { sign: 'Aquarius', house: 8 },
  mercury: { sign: 'Sagittarius', house: 6 }, venus: { sign: 'Libra', house: 4 },
}));
const M = { months, meta: { computed_houses: CH, sun_sign: 'Sagittarius', rising_sign: 'Cancer' } };

const EN_MONTHS = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
const EN_HEAD = (i) => `### ${EN_MONTHS[i]} ${i < 6 ? 2026 : 2027}: Sun in ${SIGNS_EN[(6 + i) % 12]} · ${(i + 7) % 12 + 1}th House`;

// ⚠️ 夹具必须 ≥2 个月头(单月头 ⇒ heads.length<2 ⇒ 整体 return ⇒ 断言「平凡通过」假绿)
const NATAL_SENT = 'Deep within your chart, Saturn in Taurus in your 11th House of structure grounds your ambitions.';
const DRIFT_SENT = 'Mars in Leo is draining your budget.';          // 月真值 Mars=Cancer ⇒ 必须被纠正

// en 夹具: 12 个月头 + 【三级】章节标题(复刻生产 `### Chapter III` 形态) + 章节正文
const FIXTURE = [
  EN_HEAD(0), DRIFT_SENT,
  EN_HEAD(1), 'August narrative body.',
  EN_HEAD(2), 'September narrative body.',
  EN_HEAD(3), 'October narrative body.',
  EN_HEAD(4), 'November narrative body.',
  EN_HEAD(5), 'December narrative body.',
  EN_HEAD(6), 'January narrative body.',
  EN_HEAD(7), 'February narrative body.',
  EN_HEAD(8), 'March narrative body.',
  EN_HEAD(9), 'April narrative body.',
  EN_HEAD(10), 'May narrative body.',
  EN_HEAD(11), 'June narrative body.',
  '### Chapter III: Destiny Career Path', // ← 三级标题, 旧守卫认不出 ⇒ 末月段吞到这里
  'The Career Mandate. Saturn in Gemini in your 9th House of expansion is a backdrop for your ambitions.',
  '### Chapter IV: Debt & Risk Shield (Shadow Audit)',
  '**The Shadow of the 11th House: The Network Debt.** Saturn in Gemini in your 9th House of beliefs speaks to inherited patterns.',
].join('\n');

// 判据谓词(行为): 章节正文里的错值句必须原样保留
const chapterKept = (t) => t.includes('Saturn in Gemini in your 9th House');
const chapterCorrupted = (t) => t.includes('Saturn in Aries in your 9th House');

test('③ 行为: 三级章节标题终止月段 —— 章节正文不得被末月流年真值改写', () => {
  const out = F.lockYearlyTransitSigns(FIXTURE, 'en', M, 'yearly');
  assert.ok(chapterKept(out), '章节正文被改写');
  assert.ok(!chapterCorrupted(out), '章节正文被按末月流年真值改写(Aries 串染)');
  // 守卫升级不得伤及正常职责: 月段内的流年串染仍须纠正
  assert.ok(out.includes('Mars in Cancer'), '月段流年串染未被纠正(守卫升级误伤正常职责)');
});
test('④ 行为: 月段内「行星 + 本命星座 + your Nth House」本命陈述句必须弃权', () => {
  const t = [EN_HEAD(0), NATAL_SENT, DRIFT_SENT, EN_HEAD(1), 'August body.'].join('\n');
  const out = F.lockYearlyTransitSigns(t, 'en', M, 'yearly');
  assert.ok(out.includes('Saturn in Taurus in your 11th House'), '本命句被流年真值污染');
  assert.ok(out.includes('Mars in Cancer'), '流年串染未被纠正 ⇒ 夹具失效(假绿)');
});
test('⑤ 幂等: f(f(x)) === f(x)', () => {
  const once = F.lockYearlyTransitSigns(FIXTURE, 'en', M, 'yearly');
  const twice = F.lockYearlyTransitSigns(once, 'en', M, 'yearly');
  assert.strictEqual(twice, once, '二次施加改动非零, 非幂等');
});

// ═══════════════ 注入缺陷自测(双层): 证明判据③④是「会红的」 ═══════════════
test('⑥ 注入自测: 段尾守卫回退为旧 `## ` 单级 ⇒ 三级章节正文必须被改写(判据③会红)', () => {
  const b = fnBody('lockYearlyTransitSigns');
  assert.ok(b.includes(GUARD_NEW), '注入失败: 未找到新段尾守卫(与实现脱钩)');
  const H = build({ lockYearlyTransitSigns: b.replace(GUARD_NEW, GUARD_OLD) });
  const out = H.lockYearlyTransitSigns(FIXTURE, 'en', M, 'yearly');
  assert.ok(chapterCorrupted(out), '注入后章节正文未被改写 ⇒ 判据③证明失效');
});
test('⑦ 注入自测: 删除本命星座豁免 ⇒ 月段内本命句必须被改写(判据④会红)', () => {
  const b = fnBody('lockYearlyTransitSigns');
  assert.ok(b.includes(EXEMPT_LINE), '注入失败: 未找到本命星座豁免(与实现脱钩)');
  const H = build({ lockYearlyTransitSigns: b.replace(EXEMPT_LINE + '\n', '') });
  const t = [EN_HEAD(0), NATAL_SENT, EN_HEAD(1), 'August body.'].join('\n');
  const out = H.lockYearlyTransitSigns(t, 'en', M, 'yearly');
  assert.ok(out.includes('Saturn in Aries'), '注入后本命句未被改写 ⇒ 判据④证明失效');
});
