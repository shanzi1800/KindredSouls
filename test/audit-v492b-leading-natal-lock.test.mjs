// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V492b/E9（R8）: 年报前导段（第 1 章「本命建筑」）本命真值强锁 —— 回归闸门
// 事故背景（2026-10-02 Adelaide 盘线上实证）:
//   真值(SwissEph/Placidus): Sun Sag 12宫 · Moon Leo 8宫 · Jupiter Libra 10宫 ·
//   Saturn Aqu 2宫 · Pluto Sco 11宫。
//   线上第 1 章把 2026 行运位伪装成本命位: Sun→7th / Moon→7th / Jupiter→Leo 7th /
//   Saturn→Aries 4th / Pluto→Aqu 1st；而第 2 章逐月全对 ⇒ 同篇自相矛盾。
//   三层防线全漏: ① house_linter 只处理月锚点之后段落（前导段透传）；
//   ② lockNatalAnchorRole V478-guard 年报整体禁用（防流年句被强改，不能解除）；
//   ③ _v432LockNatal 非显式本命句弃权（要求 natal/native/of birth 定语）。
// 治本（军师裁决·方案A）: _v432LockLeadingNatal —— 前导段子串整体视为本命语境重跑
//   _v432LockNatal(opts.leading)；唯一豁免=句内流年标记（无月份锚点⇒无流年真值⇒绝不碰）。
// 本测试: 源码级结构断言 + 假矩阵行为验证(零 python) + 【注入缺陷自测】。
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
const v69src = fs.readFileSync(path.join(__dirname, '..', 'v69_client.js'), 'utf-8');

/** 取函数体(大括号配平, 跳过字符串/注释里的花括号)
 *  🛡️ V492b: 签名含默认参 `opts = {}` ⇒ 必须先配平参数表的圆括号, 再找体首 `{`
 *  （否则 indexOf('{') 命中参数表内的 `{}`, 体只剩 58 字符 ⇒ 判据全部空转）。 */
function fnBody(name, source = src) {
  const at = source.indexOf(`function ${name}(`);
  assert.ok(at > 0, `未找到函数 ${name}`);
  let p = source.indexOf('(', at), pd = 0, j = p, inS2 = null;
  for (; j < source.length; j++) {
    const c = source[j];
    if (inS2) { if (c === '\\') { j++; continue; } if (c === inS2) inS2 = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inS2 = c; continue; }
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

/** 剥掉注释 —— 结构断言只看代码 */
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

// ═══════════════ 源码级结构断言 ═══════════════
test('① 前导段本命锁必须存在：_v432LockLeadingNatal（yearly 护栏 + leading 透传 + 边界切分）', () => {
  assert.ok(/function\s+_v432LockLeadingNatal\s*\(/.test(src), '缺少 _v432LockLeadingNatal');
  const b = fnBody('_v432LockLeadingNatal');
  assert.ok(/reportType\s*!==\s*'yearly'/.test(b), '缺少 yearly 护栏(月报不得被触碰)');
  assert.ok(/leading:\s*true/.test(b), '未以 opts.leading 调用 _v432LockNatal');
  assert.ok(/_V432_LANGS\.includes\(lang\)/.test(b), '缺少语言门控(en/es/zh)');
  // 前导段边界：zh 数字月锚点 + 英文月锚点（与 house_linter 同口径）
  assert.ok(/\\d\{4\}年\\d\{1,2\}月:/.test(b), '缺少 zh 数字月锚点边界');
  assert.ok(/Jan\|Feb\|Mar\|Apr\|May\|Jun\|Jul\|Aug\|Sep\|Oct\|Nov\|Dec/.test(b), '缺少英文月锚点边界');
});

test('② _v432LockNatal 必须支持 leading 模式：弃权解除 + 流年句豁免', () => {
  const b = stripComments(fnBody('_v432LockNatal'));
  assert.ok(/opts\s*=\s*\{\}/.test(b), '_v432LockNatal 未加 opts 参数');
  assert.ok(/explicit\s*\|\|\s*!!opts\.leading/.test(b), 'leading 模式未解除非显式句弃权');
  assert.ok(/opts\.leading && !explicit && _v432SentTransitMarked\(/.test(b), '缺少流年句豁免(前导段无流年真值⇒绝不碰)');
});

test('③ 流年句识别必须收窄口径（Transit / 2026 / In 2026 / 流年），不得沿用宽动词表', () => {
  assert.ok(/_V492B_LEAD_TRANSIT\s*=/.test(src), '缺少 _V492B_LEAD_TRANSIT 表');
  const decl = src.match(/const\s+_V492B_LEAD_TRANSIT\s*=\s*\{[\s\S]*?\n\};/);
  assert.ok(decl, '_V492B_LEAD_TRANSIT 声明不完整');
  assert.ok(/transit\\w\*/.test(decl[0]) && /20\\d\{2\}/.test(decl[0]), 'en 口径须含 transit*/年份');
  assert.ok(/流年|流月/.test(decl[0]), 'zh 口径须含 流年/流月');
  // 豁免只看句窗（_v432SentTransitMarked），不得整段放弃
  const b = stripComments(fnBody('_v432SentTransitMarked'));
  assert.ok(/_V492B_SENT_BREAK/.test(b), '流年句识别未按句窗断句');
});

test('④ 三链挂载齐全（非流式 / 流式 HIT / 流式落库前）且均排在 V488 之后', () => {
  const calls = [...src.matchAll(/_v432LockLeadingNatal\(/g)].length;
  assert.ok(calls >= 4, `挂载点不足(定义1+调用≥3): ${calls}`);
  const v488s = [...src.matchAll(/lockYearlyNonMonthSunRef\([^)]*\);/g)].map((m) => m.index);
  const locks = [...src.matchAll(/= _v432LockLeadingNatal\(/g)].map((m) => m.index);
  assert.ok(locks.length >= 3, `链上调用不足 3 处: ${locks.length}`);
  for (const li of locks) {
    const prev = v488s.filter((v) => v < li).pop();
    assert.ok(prev !== undefined, '存在未排在 V488 之后的挂载点（V488-zh 会回改前导段太阳）');
    assert.ok(li - prev < 400, `挂载点距 V488 过远(可能被中间链回改): ${li - prev}`);
  }
});

test('⑤ Prompt 侧必须补「第 1 章仅本命、严禁混入流年」强约束', () => {
  assert.ok(/CHAPTER 1\s*—\s*NATAL PLACEMENTS ONLY/.test(v69src), 'v69_client 缺少第 1 章本命专属铁律');
  assert.ok(/MUST NOT mix 2026 transits into the natal analysis/.test(v69src), '缺少「严禁混入流年」条文');
});

// ═══════════════ 行为级: vm 抽取 + Adelaide 假矩阵(零 python) ═══════════════
const SEEDS = ['_v432LockLeadingNatal', '_v432LockNatal', '_v432SentTransitMarked', '_V492B_LEAD_TRANSIT',
  '_V492B_SENT_BREAK', '_v482SignAdjacent', '_v432Clause', '_v432AdjudicateDescriptors', '_v432Normalize',
  '_v432Truth', '_v432TruthMatch', '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse',
  '_v432AllSignWords', '_v432Signs', '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER',
  '_V432_LANGS', '_V432_EN2LOC', '_V432_ZH_NUM', '_V432_ES_ORD', '_V432_ES_ORD_FORMAT', '_v432Esc',
  '_V482_FWD_BREAK', '_V482_FWD_CONJ', 'SUN_SIGN_EN', '_EN2ZIDX'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); } }
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
for (const n of SEEDS) assert.ok(map.has(n), `VM 未能抽取 ${n}`);

function buildWith(hack) {
  const ctx = { getSignToHouseMap, SIGN_ORDER_ZH, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map((e) => (hack && hack[e[0]] ? hack[e[0]] : e[1])).join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = buildWith(null);

// Adelaide 真值夹具（SwissEph/Placidus 实算五行星 + 其余取合理值；断言只用五行星）
const CH_ADL = {
  Sun: { sign: 'Sagittarius', house: 12 }, Moon: { sign: 'Leo', house: 8 },
  Mercury: { sign: 'Sagittarius', house: 11 }, Venus: { sign: 'Scorpio', house: 12 },
  Mars: { sign: 'Cancer', house: 7 }, Jupiter: { sign: 'Libra', house: 10 },
  Saturn: { sign: 'Aquarius', house: 2 }, Uranus: { sign: 'Capricorn', house: 1 },
  Neptune: { sign: 'Capricorn', house: 1 }, Pluto: { sign: 'Scorpio', house: 11 },
};
const M_ADL = { months: [], meta: { computed_houses: CH_ADL, sun_sign: 'Sagittarius', rising_sign: 'Capricorn' } };

// 线上第 1 章原文逐句复刻（Adelaide 2026-10-02 实测）+ 英文月锚点月段
const PREAMBLE = [
  'Chapter I — Your Natal Architecture',
  '',
  'To understand how you relate to money, we begin with your natal architecture.',
  'Your Sun sits in Sagittarius in the 7th House — the House of Partnership — shaping how you attract resources through others.',
  'Your Moon in Leo, also in the 7th House, deepens this emotional signature.',
  'Jupiter, your ruling planet as a Sagittarian, sits in Leo in the 7th House.',
  'Saturn, the lord of your Capricorn Ascendant, sits in Aries in the 4th House.',
  'Pluto in Aquarius in the 1st House is the final piece of this foundation.',
  'In 2026, transiting Jupiter crosses your 2nd House of earned income, bringing expansion through bold moves.',
].join('\n');
const MONTH_SEC = '\n\n### July 2026: Sun in Leo House 1\nTransiting Jupiter enters Leo this month and lights up your 2nd House of income.\n';
const FULL = PREAMBLE + MONTH_SEC;

test('⑥ 行为级: 第 1 章五行星必须被硬改回 SwissEph 真值（Adelaide 复刻盘）', () => {
  const out = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(/Sun sits in Sagittarius in the 12th House/.test(out), 'Sun 宫位未被纠为 12th: ' + out.slice(0, 400));
  assert.ok(/Moon in Leo, also in the 8th House/.test(out), 'Moon 宫位未被纠为 8th');
  assert.ok(/sits in Libra in the 10th House/.test(out), 'Jupiter 未被纠为 Libra 10th');
  assert.ok(/sits in Aquarius in the 2nd House/.test(out), 'Saturn 未被纠为 Aquarius 2nd');
  assert.ok(/Pluto in Scorpio in the 11th House/.test(out), 'Pluto 未被纠为 Scorpio 11th');
  assert.ok(!/sits in Leo in the 7th House/.test(out), 'Jupiter 流年伪装残留');
  assert.ok(!/sits in Aries in the 4th House/.test(out), 'Saturn 流年伪装残留');
  assert.ok(!/Pluto in Aquarius in the 1st House/.test(out), 'Pluto 流年伪装残留');
  assert.ok(/Capricorn Ascendant/.test(out), '上升被误伤(应为 Capricorn)');
});

test('⑦ 行为级: 前导段内的流年句必须原样保留（2026 + transiting 豁免）', () => {
  const out = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(out.includes('In 2026, transiting Jupiter crosses your 2nd House of earned income, bringing expansion through bold moves.'),
    '前导段流年句被误改（应整句豁免）');
});

test('⑧ 行为级: 月段正文零影响（首个英文月锚点之后不在锁的作用域）', () => {
  const out = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(out.includes('### July 2026: Sun in Leo House 1'), '月段标题被误改');
  assert.ok(out.includes('enters Leo this month and lights up your 2nd House of income'), '月段流年正文被误改');
});

test('⑨ 行为级: 月报(reportType=monthly)完全豁免 + 幂等', () => {
  const mo = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'monthly');
  assert.strictEqual(mo, FULL, '月报被误触碰');
  const once = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  const twice = F._v432LockLeadingNatal(once, 'en', M_ADL, 'yearly');
  assert.strictEqual(twice, once, '不幂等');
});

test('⑩ 行为级: zh 前导段同样生效（中文数字月锚点边界）', () => {
  const zhFull = '本命盘的建筑：你的太阳在白羊座第3宫，赋予你开创财富的底色。\n\n### 2026年7月: 太阳在狮子座第1宫\n流年太阳行经狮子座。';
  const out = F._v432LockLeadingNatal(zhFull, 'zh', M_ADL, 'yearly');
  assert.ok(!out.includes('白羊座'), 'zh 太阳星座未被纠: ' + out);
  assert.ok(!out.includes('第3宫'), 'zh 太阳宫位未被纠');
  assert.ok(out.includes('射手座'), 'zh 太阳未落真值星座');
  assert.ok(out.includes('### 2026年7月: 太阳在狮子座第1宫'), 'zh 月段被误改');
});

test('⑪ 行为级: 显式本命句即使含年份也照锁（natal 定语优先级最高）', () => {
  const t = 'In 2026 you will feel it strongly — your natal Sun in Sagittarius in the 7th House anchors your earnings style.\n\n### July 2026: Sun in Leo House 1\nx';
  const out = F._v432LockLeadingNatal(t, 'en', M_ADL, 'yearly');
  assert.ok(/natal Sun in Sagittarius in the 12th House/.test(out), '显式本命句未被纠(错被流年豁免): ' + out);
});

test('⑫ 行为级: 轴点星座不得被行星真值侵占（Capricorn Ascendant 必须原样）', () => {
  const out = F._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(/the lord of your Capricorn Ascendant/.test(out), '上升星座被行星真值侵占(伪造轴点): ' + out.slice(0, 500));
  assert.ok(!/Aquarius Ascendant/.test(out), '产出 Aquarius Ascendant = 轴点被改写');
});

// ═══════════════ 【注入缺陷自测】判据必须具备灵敏度 ═══════════════
test('【注入缺陷自测】去掉弃权解除(explicit||leading) → ⑥ 必须红', () => {
  const orig = map.get('_v432LockNatal');
  const hacked = orig.replace('explicit || !!opts.leading', 'explicit');
  assert.notStrictEqual(hacked, orig, '未成功注入缺陷(未匹配到弃权解除表达式)');
  const F1 = buildWith({ _v432LockNatal: hacked });
  const out = F1._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(!/Sun sits in Sagittarius in the 12th House/.test(out), '闸门失效: 弃权解除被剥离后仍判绿');
});

test('【注入缺陷自测】去掉流年句豁免 → ⑦ 必须红', () => {
  const orig = map.get('_v432LockNatal');
  const hacked = orig.replace(/if \(opts\.leading && !explicit && _v432SentTransitMarked\([^)]*\)\) continue;/, '');
  assert.notStrictEqual(hacked, orig, '未成功注入缺陷(未匹配到豁免语句)');
  const F1 = buildWith({ _v432LockNatal: hacked });
  const out = F1._v432LockLeadingNatal(FULL, 'en', M_ADL, 'yearly');
  assert.ok(!out.includes('In 2026, transiting Jupiter crosses your 2nd House of earned income, bringing expansion through bold moves.'),
    '闸门失效: 流年句豁免被剥离后仍判绿(流年句被改)');
});

test('【注入缺陷自测】去掉 yearly 护栏 → ⑨ 必须红', () => {
  const orig = map.get('_v432LockLeadingNatal');
  const hacked = orig.replace("if (reportType !== 'yearly') return text;", '');
  assert.notStrictEqual(hacked, orig, '未成功注入缺陷(未匹配到 yearly 护栏)');
  const F1 = buildWith({ _v432LockLeadingNatal: hacked });
  const out = F1._v432LockLeadingNatal(FULL, 'en', M_ADL, 'monthly');
  assert.notStrictEqual(out, FULL, '闸门失效: monthly 护栏被剥离后仍判绿');
});
