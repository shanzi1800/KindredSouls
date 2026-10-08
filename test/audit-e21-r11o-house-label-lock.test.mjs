// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E21/R11o 闸门：宫位语义标签契约锁（House Semantic Label Lock）+ CRITIC 判据14
// ═══════════════════════════════════════════════════════════════════════════
// 背景（2026-10-06，1993-12-15 Adelaide en 年报线上实证，军师终审 88/B+）：
//   「数字保真、文义乱套」新类别 —— `12th House of Partnership`（Partnership=7 宫）/
//   `2nd House of Home and Roots`（Home/Roots=4 宫）：宫位数字 vs SwissEph **全对**
//   ⇒ 13 条标量判据全部空转（c12=0 实证），标签盲区直达落库。
//   治法 = 白名单契约锁（保数字、剪错配标签，V488d 哲学）+ CRITIC 判据14（与锁**同源**）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO = path.join(__dirname, '..');
const SRC = readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const PURGE = readFileSync(path.join(REPO, 'scripts/purge-tz-poison-cache.mjs'), 'utf-8');
const YEARLY_TEST = readFileSync(path.join(REPO, 'test/audit-yearly-stream.test.js'), 'utf-8');
const PROMPT_EN = readFileSync(path.join(REPO, 'src/prompts/yearlySystemEN.txt'), 'utf-8');

// ── 挂载点字面量（非流式 MISS / 流式落库前 各一处） ──
// 链末真值收口（⚠️ 必须用 **带 if(yearly) 包裹** 的字面量：裸 `reportContent = _v432LockLeadingNatal(…)`
//   在链中段（V492b 位置）另有一处 ⇒ indexOf 会取到中段，顺序断言失真 —— e20 同约定）
const STRIP_NS = 'reportContent = stripYearlyElementCoordLeak(reportContent, lang, reportType);';
const LOCK_NS = 'reportContent = stripHouseSemanticLabelMismatch(reportContent, lang, reportType);';
const FINAL_NS = "if (reportType === 'yearly') {\n          reportContent = _v432LockLeadingNatal(reportContent, lang, astroMatrix, reportType);\n        }";
const STRIP_ST = 'cleanedText = stripYearlyElementCoordLeak(cleanedText, lang, reportType);';
const LOCK_ST = 'cleanedText = stripHouseSemanticLabelMismatch(cleanedText, lang, reportType);';
const FINAL_ST = "if (reportType === 'yearly') cleanedText = _v432LockLeadingNatal(cleanedText, lang, astroMatrix, reportType);";
const C14_PUSH = "issues.push('宫位语义标签错配(House-Semantic Misalignment): ' + _c14 + ' 处');";

function mountsOk(src) {
  const a = src.indexOf(STRIP_NS);
  const b = src.indexOf(LOCK_NS);
  const c = src.indexOf(FINAL_NS);
  const d = src.indexOf(STRIP_ST);
  const e = src.indexOf(LOCK_ST);
  const f = src.indexOf(FINAL_ST);
  return a >= 0 && b >= 0 && c >= 0 && d >= 0 && e >= 0 && f >= 0 && a < b && b < c && d < e && e < f;
}

// ── vm 同源抽取（复刻 e20/batch harness 手法） ──
const SEEDS = ['stripHouseSemanticLabelMismatch', '_e21LabelAllowed', '_E21_HOUSE_LABEL_CONTRACT',
  '_E21_HOUSE_LABEL_RE', '_e21CountHouseLabelMismatch'];
const { closureDecls } = await import(pathToFileURL(path.join(REPO, 'test/tools/extract_decls.mjs')));
function extract(src) {
  const { map, names } = closureDecls(src, SEEDS);
  const ctx = { console, __exports: {} };
  vm.createContext(ctx);
  const body = [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1])).map((e) => e[1]).join('\n\n');
  vm.runInContext(body + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return { X: ctx.__exports, names };
}
const { X, names } = extract(SRC);
for (const n of ['stripHouseSemanticLabelMismatch', '_e21CountHouseLabelMismatch', '_e21LabelAllowed']) {
  assert.equal(typeof X[n], 'function', `VM 未能抽取 ${n}（切片不完整或声明缺失），实抽: ${names.join(',')}`);
}
const S = (t, lang, rt) => X.stripHouseSemanticLabelMismatch(t, lang || 'en', rt || 'yearly');

// 1993 盘线上实证的两处病句 + 合法对照组
const BAD_12TH = 'Your Sun resides in the 12th House of Partnership.';
const BAD_2ND = 'Saturn sits in the 2nd House of Home and Roots.';
const OK_10TH = 'Jupiter expands in the 10th House of Career and Public Standing.';
const OK_12TH = 'Your path lives in the 12th House of the Subconscious.';
const OK_8TH = 'This energy flows through the 8th House of Shared Resources.';

test('① 结构级: 契约锁定义 + 双链挂载 + 顺序（E20 剪枝之后、E19 真值收口之前）+ 三重注入自测', () => {
  assert.ok(/function stripHouseSemanticLabelMismatch\s*\(/.test(SRC), '契约锁函数未定义');
  assert.ok(/function _e21CountHouseLabelMismatch\s*\(/.test(SRC), 'c14 计数函数未定义');
  assert.ok(mountsOk(SRC), '双链挂载缺失或顺序错误（须：E20 剪枝 → E21 标签剪枝 → E19 真值收口）');
  // 注入自测 A: 摘除非流式挂载 ⇒ 必红
  const injA = SRC.replace(LOCK_NS, '');
  assert.notEqual(injA, SRC, '注入未生效（非流式）');
  assert.equal(mountsOk(injA), false, '注入自测失败: 摘除非流式挂载未被判红');
  // 注入自测 B: 摘除流式挂载 ⇒ 必红
  const injB = SRC.replace(LOCK_ST, '');
  assert.notEqual(injB, SRC, '注入未生效（流式）');
  assert.equal(mountsOk(injB), false, '注入自测失败: 摘除流式挂载未被判红');
  // 注入自测 C: 调换顺序（标签锁跑到 E20 剪枝之前）⇒ 必红
  const swapped = SRC.replace(STRIP_NS, '@@TMP@@').replace(LOCK_NS, STRIP_NS).replace('@@TMP@@', LOCK_NS);
  assert.notEqual(swapped, SRC, '注入未生效（顺序）');
  assert.equal(mountsOk(swapped), false, '注入自测失败: 顺序调换未被判红');
});

test('② 行为级: 两处线上病句剪枝保数字 + 合法标签零误伤 + 自然定界 + 幂等 + 语言守卫', () => {
  // 病句（1993 盘实证）: 剪 ` of <label>`、保数字
  assert.equal(S(BAD_12TH), 'Your Sun resides in the 12th House.', '12th House of Partnership 未剪枝');
  assert.equal(S(BAD_2ND), 'Saturn sits in the 2nd House.', '2nd House of Home and Roots 未剪枝');
  // 合法对照组: 契约内标签零误伤
  assert.equal(S(OK_10TH), OK_10TH, '合法 10 宫标签被误剪!');
  assert.equal(S(OK_12TH), OK_12TH, '合法 12 宫「the Subconscious」被误剪!');
  assert.equal(S(OK_8TH), OK_8TH, '合法 8 宫「Shared Resources」被误剪!');
  // 自然定界: 小写后缀绝不吞入（标签只到 Partnership 为止）
  assert.equal(S('in the 12th House of Partnership in your chart.'),
    'in the 12th House in your chart.', '自然定界失败: 标签吞掉了小写后缀');
  assert.equal(S('in the 10th House of Career in your chart.'), 'in the 10th House of Career in your chart.',
    '自然定界失败: 合法标签被连坐剪枝');
  // 越界宫号: 弃权不动
  assert.equal(S('the 13th House of Partnership'), 'the 13th House of Partnership', '越界宫号未弃权');
  // 语言守卫: en 形态仅 en 生效；es 走**独立西语契约**（英文形态在 es 下零动作）；
  //   zh/fr/th/vi 一律零动作（宁漏不改）。
  for (const lg of ['zh', 'es', 'fr', 'th', 'vi']) {
    assert.equal(S('你的太阳位于 12th House of Partnership。', lg, 'yearly'),
      '你的太阳位于 12th House of Partnership。', `${lg} 不应改动（en 形态仅 en 生效）`);
  }
  // ⚠️ E24/R11r②：es 自有契约分支（`Nª Casa de <错配主题>` ⇒ 剪标签**保数字**），
  //    且**不得**误伤 es 合法标签（本宫主题命中即放行）—— 与 en 契约对称无双盲。
  const esBad = S('Tu Saturno en Géminis 5ª Casa de Hogar y Raíces.', 'es', 'yearly');
  assert.ok(!esBad.includes('Hogar') && esBad.includes('5ª') && !esBad.includes('4ª'),
    'es 错配标签未剪（或数字未保真）: ' + esBad);
  assert.equal(S('Tu Saturno en Géminis 4ª Casa de Hogar y Raíces.', 'es', 'yearly'),
    'Tu Saturno en Géminis 4ª Casa de Hogar y Raíces.', 'es 合法标签被误剪');
  // 多病句同篇: 全部剪除
  const doc = [BAD_12TH, BAD_2ND, OK_10TH].join('\n');
  const out = S(doc, 'en', 'yearly');
  assert.ok(!out.includes('House of Partnership') && !out.includes('House of Home and Roots'), '同篇多病句未全剪');
  assert.ok(out.includes('10th House of Career and Public Standing'), '同篇合法标签被误剪!');
  // 幂等: 二次施加零变化
  assert.equal(S(out, 'en', 'yearly'), out, '二次施加非幂等');
  // 月报同锁（无 reportType 门控 ⇒ 月报同样受保护）
  assert.equal(S('Moon transits your 12th House of Partnership.', 'en', 'monthly'),
    'Moon transits your 12th House.', '月报未受保护');
});

test('③ 契约表: 12 宫齐全 + 军师禁项（2nd 无 Home/Partnership; 12th 无 Partnership）+ 关键主题在册', () => {
  const C = X._E21_HOUSE_LABEL_CONTRACT;
  assert.equal(C.length, 12, '契约表须覆盖 12 宫');
  C.forEach((rows, i) => {
    assert.ok(Array.isArray(rows) && rows.length > 0, `第 ${i + 1} 宫主题词表为空`);
    for (const w of rows) assert.ok(typeof w === 'string' && w.length > 1, `第 ${i + 1} 宫存在非法主题词`);
  });
  const has = (i, w) => C[i - 1].some((x) => {
    const re = new RegExp('\\b' + x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    return re.test(w);
  });
  // 军师铁律禁项（错配本体）
  assert.ok(!has(2, 'Home'), '2 宫不得含 Home');
  assert.ok(!has(2, 'Partnership'), '2 宫不得含 Partnership');
  assert.ok(!has(12, 'Partnership'), '12 宫不得含 Partnership');
  // 关键主题在册（正向保证：剪枝不会误伤同宫合法标签）
  assert.ok(has(1, 'Self') && has(1, 'Identity') && has(1, 'Vitality'), '1 宫主题缺失');
  assert.ok(has(2, 'Wealth') && has(2, 'Resources') && has(2, 'Assets'), '2 宫主题缺失');
  assert.ok(has(4, 'Home') && has(4, 'Roots') && has(4, 'Family'), '4 宫主题缺失');
  assert.ok(has(7, 'Partnership') && has(7, 'Marriage') && has(7, 'Allies'), '7 宫主题缺失');
  assert.ok(has(10, 'Career') && has(10, 'Legacy') && has(10, 'Public Standing'), '10 宫主题缺失');
  assert.ok(has(12, 'Subconscious') && has(12, 'Unseen') && has(12, 'Karma'), '12 宫主题缺失');
});

test('④ 判据 c14: 与锁同源（唯一正则 + 唯一契约表）+ 病句计数 + 干净文本归零 + 位于 wealthCriticCheck 体内', () => {
  // 判据本体位置: 必须在 wealthCriticCheck 函数体内（下一个顶层函数之前）
  const ci = SRC.indexOf('function wealthCriticCheck');
  const c14 = SRC.indexOf(C14_PUSH);
  const next = SRC.indexOf('function cleanYearlyTimeline');
  assert.ok(ci > 0 && next > ci, '锚点函数未找到');
  assert.ok(c14 > ci && c14 < next, 'c14 未落在 wealthCriticCheck 函数体内');
  // ⚠️ E24④/R11t（2026-10-06）：生效语种由 en+es 再扩 **vi**（越语 `Nhà N, ngôi nhà của <标签>`
  //    契约锁上线）⇒ 「三处同源」整体前移：调用形态 + c14 语言门（en|es|vi） + 计数门控（en|es|vi）。
  //    纪律：**锁的射程扩到哪，判据与批测就必须跟到哪**（sweep `labelMismatch` 直接回调计数函数）。
  assert.ok(SRC.includes("const _c14 = _e21CountHouseLabelMismatch(text, lang || 'zh');"),
    'c14 计数调用缺失（须传 lang —— 计数函数按语种选形态）');
  assert.ok(SRC.includes("if ((lang || 'zh') === 'en' || (lang || 'zh') === 'es' || (lang || 'zh') === 'vi') {"),
    'c14 语言门缺失（须为 en|es|vi）');
  // ⚠️ E24④/R11t（2026-10-06）：越语语义标签锁上线（`_E24_VI_HOUSE_CONTRACT` + `_E24_VI_GLOSS_RE`）
  //    ⇒ 生效语种由 en+es 再扩 **vi**，计数函数门控随之**前移**（不变式：计数门 ≡ 锁门 ≡ c14 语言门）。
  assert.ok(SRC.includes("if (L && L !== 'en' && L !== 'es' && L !== 'vi') return 0;"),
    'c14 计数函数门控未与语言门同源（须同为 en|es|vi）');
  // 判据同源: 正则字面量全库唯一 + 契约表被锁与计数共用
  assert.equal(SRC.split('Houses?\\s+of').length - 1, 1, '宫位标签正则出现多份（判据与锁不同源）');
  assert.equal(SRC.split('_E21_HOUSE_LABEL_RE').length - 1, 3,
    '正则引用数须为 3（定义 + 锁 + 计数），实得 ' + (SRC.split('_E21_HOUSE_LABEL_RE').length - 1));
  // ⚠️ E23/R11q ②（2026-10-06）：契约表引用数 3 → 6 —— 新增的 3 处来自**分隔符式**剪枝
  //    `_e23ThemeHouses`（头注 + `length` 遍历 + 逐词遍历），它**复用同一张契约表**
  //    （同源铁律：宽度扩展必须共享唯一真源，绝不另起一份表）⇒ 判据随同源扩展前移。
  assert.equal(SRC.split('_E21_HOUSE_LABEL_CONTRACT').length - 1, 6,
    '契约表引用数须为 6（契约注释 + 定义 + _e21LabelAllowed + E23 `_e23ThemeHouses` 头注 + 其 2 处引用），实得 '
    + (SRC.split('_E21_HOUSE_LABEL_CONTRACT').length - 1));
  // 计数行为: 病句 2 / 干净 0 / 合法 0
  const bad = [BAD_12TH, BAD_2ND].join(' ');
  assert.equal(X._e21CountHouseLabelMismatch(bad), 2, 'c14 病句计数漏报');
  assert.equal(X._e21CountHouseLabelMismatch([OK_10TH, OK_12TH, OK_8TH].join(' ')), 0, 'c14 对合法标签误报');
  assert.equal(X._e21CountHouseLabelMismatch('12th House of Partnership'), 1, 'c14 单句计数错误');
});

test('⑤ 注入自测（判据有区分力）: 污染契约表两个方向 ⇒ ② 的断言必红', () => {
  // 方向 A（漏报面）: 给 12 宫塞入 Partnership ⇒ 病句不再被剪
  const poisonA = SRC.replace("/* 12th */ ['Subconscious'", "/* 12th */ ['Partnership', 'Subconscious'");
  assert.notEqual(poisonA, SRC, '注入未生效（A）');
  const A = extract(poisonA).X;
  assert.equal(A.stripHouseSemanticLabelMismatch(BAD_12TH, 'en', 'yearly'), BAD_12TH,
    '注入自测失败: 契约被污染后病句仍被剪（②的剪枝断言无区分力）');
  // 方向 B（误伤面）: 从 7 宫摘掉 Partnership ⇒ 合法标签被误剪
  const poisonB = SRC.replace("/* 7th */ ['Partnership', 'Partnerships',", "/* 7th */ ['Partnerships',");
  assert.notEqual(poisonB, SRC, '注入未生效（B）');
  const B = extract(poisonB).X;
  const LEGIT_7TH = 'Your Venus dances in the 7th House of Partnership.';
  assert.notEqual(B.stripHouseSemanticLabelMismatch(LEGIT_7TH, 'en', 'yearly'), LEGIT_7TH,
    '注入自测失败: 契约缺项后合法标签未被误剪（②的零误伤断言无区分力）');
});

test('⑥ v523 基线: server.js 4 站点 + 无 v522 残留 + purge 双形态回收 v522 + MIN_CACHE_VER=523 + prompt 契约', () => {
  const sites = [...SRC.matchAll(/wealth:v532/g)].length;
  assert.equal(sites, 4, `4 个缓存站点须全部为 v523, 实得 ${sites}`);
  assert.ok(!SRC.includes('wealth:v524'), 'server.js 内不得残留 v522 键');
  assert.ok(PURGE.includes("'wealth:v524:*'") && PURGE.includes("'wealth:v524-v2:*'"), 'purge 须双形态回收 v522');
  assert.ok(/MIN_CACHE_VER = 532/.test(YEARLY_TEST), 'yearly 流式闸门基线未前移至 v523');
  // ⚠️ E22/R11p 补充：`MIN_CACHE_VER` 是**纯数字形态**（无 v 前缀）⇒ 字符串映射 v522→v523 覆盖不到，
  //    必须单独补丁（E20 实测 7 红，E22 复现同坑）。断言值与实际常量同时前移，杜绝"漏改但断言也漏"。
  // prompt 侧禁昵称契约（第三管）
  assert.ok(PROMPT_EN.includes('HOUSE LABEL CONTRACT RULE'), 'EN 年报 prompt 缺宫位标签契约规则');
  assert.ok(PROMPT_EN.includes('12th House of Partnership'), 'prompt 契约未点名两处实证反例');
  // 旧闸门基线前移（判据随版本走，漏一个即红）
  for (const f of ['audit-e10-r9-natal-coverage.test.mjs', 'audit-e11-r10-critic-precision.test.mjs',
    'audit-e12-r11-whole-report-lock.test.mjs', 'audit-e13-r11d-spelled-ordinals.test.mjs',
    'audit-e15-r11f-multilang-uncage.test.mjs']) {
    const t = readFileSync(path.join(__dirname, f), 'utf-8');
    assert.ok(t.includes('matchAll(/wealth:v532/g)'), `${f} 站点计数基线未前移至 v523`);
    assert.ok(!t.includes('matchAll(/wealth:v525/g)'), `${f} 残留 v522 站点计数基线`);
  }
});
