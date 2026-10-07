// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E12/R11: 全章真值锁演进与 CRITIC 强规则收拢 —— 回归闸门
// 事故背景（2026-10-03 E11 上线复验范围外新发现）:
//   E11 洗净 CRITIC 假阳性后，首稿不再必然被拦截 ⇒ **直入缓存**，失去「强约束重试稿」兜底，
//   II~V 章暴露三类漏网（v510 线上实证）：
//     ① 畸形宫位 `in the 5 House`（数字在前、缺序数后缀）7 处 —— 宫位四式盲区：
//        houseNum 要 `House 5` / houseOrd 要 `5th House` / houseBare 要 `in the 5th` ⇒ 三不匹配；
//     ② 月锚点之后的无标记本命声称 `Your Moon is in Leo, a Fire sign, in the 7th House.`（真值 8th）
//        与 `Jupiter in Leo occupies your 7th House`（真值 Libra 10th）—— 非前导段须 natal 定语 ⇒ 弃权；
//     ③ LLM 自纠 artifact `…in the 7th House — wait, no. Let us be precise.` 无清洗链剥离。
// 治本（军师最高裁决 E12/R11）:
//   R11a-1 畸形宫位形态归一（补序数后缀 + 走 numHouse 分支纠真值）；
//   R11a-2 artifact 剥离（只吃明确元话语标记，绝不碰正文破折号）；
//   R11b   前导锁扩至全章 —— 月锚点之后以「物主本命语境」准入（四重否决 + 物主贴附，宁漏不改）；
//   R11c   三类漏洞写入 wealthCriticCheck 正告警判据（＋判据 12 全章本命声称真值错配）；
//   缓存 v510 → v511。
// 本测试: 源码级结构断言 + vm 抽取行为验证（零 python）+ 【注入缺陷自测】。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
const purgeSrc = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'purge-tz-poison-cache.mjs'), 'utf-8');

/** 取函数体(大括号配平, 跳过字符串/注释里的花括号); 签名默认参须先配平参数表圆括号 */
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
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// ═══════════════ 源码级结构断言 ═══════════════
test('① R11a-1: 畸形宫位第三盲区已补（CFG.houseBareNum + Fmt + finder 分支 + PatchZone 路由 + 归一函数）', () => {
  const cfg = src.match(/const\s+_V432_CFG\s*=\s*\{[\s\S]*?\n\};/);
  assert.ok(cfg, '_V432_CFG 声明不完整');
  assert.ok(/houseBareNum:\s*\/\\b\(\\d\{1,2\}\)\\s\+House\\b\/i/.test(cfg[0]),
    'en cfg 缺 houseBareNum（数字在前 + House，缺序数后缀的形态）');
  assert.ok(/houseBareNumFmt:\s*\(n\)\s*=>/.test(cfg[0]), '缺 houseBareNumFmt（保形补序数后缀）');
  const finder = stripComments(fnBody('_v432FindHouse'));
  assert.ok(/cfg\.houseBareNum/.test(finder), '_v432FindHouse 缺 houseBareNum 分支（真值纠偏认不出该形态）');
  assert.ok(/ord:\s*'numHouse'/.test(finder), 'houseBareNum 分支未标注 ord:numHouse');
  assert.ok(/v\s*>=\s*1\s*&&\s*v\s*<=\s*12/.test(finder), 'houseBareNum 分支缺 1~12 值域钳制');
  const patch = stripComments(fnBody('_v432PatchZone'));
  assert.ok(/h\.ord === 'numHouse' \? cfg\.houseBareNumFmt\(house\)/.test(patch),
    'PatchZone 未把 numHouse 路由到 houseBareNumFmt（会退化成长出 House）');
  assert.ok(/function\s+_v512NormalizeHouseOrdinal\s*\(/.test(src), '缺 _v512NormalizeHouseOrdinal（值本对但形态畸形的归一）');
  const norm = stripComments(fnBody('_v512NormalizeHouseOrdinal'));
  assert.ok(/v\s*>=\s*1\s*&&\s*v\s*<=\s*12/.test(norm), '归一函数缺 1~12 值域钳制（年份/数量会误伤）');
  assert.ok(/cfg\.houseBareNumFmt/.test(norm), '归一函数未复用 houseBareNumFmt');
});

test('② R11a-2: LLM 自纠 artifact 剥离存在且已挂入 applyTruthLocksEnEsZh（早于真值锁）', () => {
  assert.ok(/function\s+stripLLMSelfCorrection\s*\(/.test(src), '缺 stripLLMSelfCorrection');
  // `correction` 必须只在**句首 + 冒号**形态才删 —— 否则金融常用词 market correction 恒误伤
  const corrDecl = src.match(/const\s+_V512_META_CORR\s*=\s*\/[^\n]*\n/);
  assert.ok(corrDecl, '缺 _V512_META_CORR 声明');
  assert.ok(/Correction\\s\*\[:：\]/.test(corrDecl[0]), 'Correction 判据未收窄到「后随冒号」');
  assert.ok(/\(\^\|\[\.!\?/.test(corrDecl[0]), 'Correction 判据未收窄到句首（market correction 会误伤）');
  const body = stripComments(fnBody('stripLLMSelfCorrection'));
  assert.ok(/_V512_META_PAREN[\s\S]*?_V512_META_PLAIN/.test(body),
    '括号形态必须先于裸形态处理（否则 (wait, no) 留下空括号）');
  // 「破折号 + wait, no」= 明确撤回 ⇒ 必须连同被撤回的句子一起删（只删标记会留下自相矛盾）
  assert.ok(/const\s+_V512_META_RETRACT\s*=/.test(src), '缺 _V512_META_RETRACT（破折号撤回形态）');
  assert.ok(/_V512_SENT_CUT/.test(body), '撤回删除未按句界定位（会牵连过多正文）');
  const wire = stripComments(fnBody('applyTruthLocksEnEsZh'));
  const iNorm = wire.indexOf('_v512NormalizeHouseOrdinal(');
  const iMeta = wire.indexOf('stripLLMSelfCorrection(');
  const iNatal = wire.indexOf('_v432LockNatal(');
  assert.ok(iNorm > 0, 'applyTruthLocksEnEsZh 未挂畸形宫位归一');
  assert.ok(iMeta > 0, 'applyTruthLocksEnEsZh 未挂 artifact 剥离');
  assert.ok(iMeta < iNatal && iNorm < iNatal, '形态收口必须早于 _v432LockNatal（否则真值窗口读到脏形态）');
});

test('③ R11b: 前导锁扩至全章（possessive 准入）且轴点锁不随之扩展', () => {
  const lead = stripComments(fnBody('_v432LockLeadingNatal'));
  assert.ok(/natalScope:\s*'possessive'/.test(lead), '_v432LockLeadingNatal 未把月锚点之后的段落送入 possessive 模式');
  assert.ok(/_v432LockNatal\(text\.slice\(cut\)/.test(lead), 'possessive 模式未作用于月锚点之后的文本');
  // 轴点锁仍只作用于前导段（月段的 Ascendant 可能指太阳返照 → 强制本命值=主动污染）
  assert.ok(/locked = _v492cLockAxisSalutation\(locked, lang, astroMatrix\);/.test(lead),
    '轴点锁挂载被改动（须仍作用于前导段）');
  const b = stripComments(fnBody('_v432LockNatal'));
  assert.ok(/admitByScope\s*=\s*opts\.natalScope === 'possessive'/.test(b), '_v432LockNatal 缺 admitByScope');
  assert.ok(/explicit \|\| !!opts\.leading \|\| admitByScope/.test(b), 'possessive 模式未解除 natalAny 弃权（裸声称进不了 clause）');
  // 🛡️ E13/R11d: 签名补第 7 参 astroMatrix（流年一致性否决须真值盘）——断言随签名同步
  assert.ok(/!_v512PossessiveNatal\(cfg, lang, text, m\.index, m\[0\]\.length, clause, astroMatrix\)\) continue;/.test(b),
    '缺物主本命语境准入裁定（possessive 模式会变成「月段一律锁」=主动污染）');
  // 非前导段不得再跑定语裁定（它会插写 natal 限定词，破坏幂等）
  assert.ok(/!opts\.leading && !opts\.natalScope/.test(b), 'possessive 模式未跳过定语裁定');
});

test('④ R11c: wealthCriticCheck 三类新判据 + astroMatrix 形参（判据 12）', () => {
  const cc = stripComments(fnBody('wealthCriticCheck'));
  assert.ok(/astroMatrix/.test(cc), 'wealthCriticCheck 缺 astroMatrix（判据 12 无法取真值盘）');
  assert.ok(/_v512CountNatalClaimMismatch\(text,\s*lang/.test(cc), '判据 12 未接真值错配计数器');
  assert.ok(/畸形宫位格式/.test(cc), '判据 10 缺失（畸形宫位 N House 未入告警）');
  assert.ok(/\(\\d\{1,2\}\)\\s\+House\\b/.test(cc), '判据 10 未用「数字在前」形态（会误伤我方 houseFmt 的 House N）');
  // 🛡️ E13/R11d-3: 判据 10 扩面到拼写式序数残留，且必须与归一化**同源**（杜绝双盲）
  assert.ok(/拼写式序数宫位残留/.test(cc), '判据 10 未扩面到拼写式序数残留（R11d-3）');
  assert.ok(/_V512_SPELLED_HOUSE/.test(cc), '判据 10 未复用 _V512_SPELLED_HOUSE 正则源码 ⇒ 归一化与 CRITIC 可能再次双盲');
  assert.ok(/自纠\/元话语 artifact 残留/.test(cc), '判据 11 缺失（artifact 未入告警）');
  assert.ok(/本命行星\/宫位声称与 SwissEph 真值错配/.test(cc), '判据 12 缺失');
  // 无尽言句不得计入错配（否则 CRITIC 恒误报 —— E11 空数组坑的同类事故面）
  const counter = stripComments(fnBody('_v512CountNatalClaimMismatch'));
  assert.ok(/if \(!claim\.sign && claim\.house === null\) continue;/.test(counter),
    '判据 12 未排除「既无星座也无宫位」的无尽言句（会把无尽言句全记成错配）');
  // 端点调用点必须把真值盘传进去
  assert.ok(/wealthCriticCheck\(txt,\s*birthDate,\s*natalSunSign,\s*lang,\s*astroMatrix\)/.test(src),
    '端点调用点未传 astroMatrix ⇒ 判据 12 形同虚设');
});

test('⑤ 缓存 bump v515（server.js 四站点 + purge 补 v514 双形态 + 基线前移）', () => {
  const sites = [...src.matchAll(/wealth:v531/g)].length;
  assert.ok(sites >= 4, `server.js v523 站点不足 4: ${sites}`);
  assert.ok(!src.includes('wealth:v520'), 'server.js 残留 v520（漏改一站）');
  assert.ok(/wealth:v520:\*/.test(purgeSrc) && /wealth:v520-v2:\*/.test(purgeSrc), 'purge 脚本未补 v520 双形态');
  const yearly = fs.readFileSync(path.join(__dirname, 'audit-yearly-stream.test.js'), 'utf-8');
  assert.ok(/MIN_CACHE_VER = 531/.test(yearly), 'yearly 流式闸门基线未前移至 v523');
});

// ═══════════════ 行为级: vm 抽取 + Adelaide 假矩阵(零 python) ═══════════════
const SEEDS = ['_v432LockLeadingNatal', '_v432LockNatal', '_v432SentTransitMarked', '_V492B_LEAD_TRANSIT',
  '_V492B_SENT_BREAK', '_v482SignAdjacent', '_v432Clause', '_v432AdjudicateDescriptors', '_v432Normalize',
  '_v432Truth', '_v432TruthMatch', '_v432SlotOf', '_v432ClaimOf', '_v432PatchZone', '_v432FindHouse',
  '_v432AllSignWords', '_v432Signs', '_v432SignAlts', '_V432_CFG', '_V432_NAME', '_V432_ORDER',
  '_V432_LANGS', '_V432_EN2LOC', '_V432_ZH_NUM', '_V432_ES_ORD', '_V432_ES_ORD_FORMAT', '_v432Esc',
  '_V482_FWD_BREAK', '_V482_FWD_CONJ', 'SUN_SIGN_EN', '_EN2ZIDX',
  '_v492cLockAxisSalutation', '_v432EnOrdSuf', 'wealthCriticCheck', '_e11SignIndex', '_e11SignLocal',
  '_E11_SIGN_IDX_CACHE', 'SUN_SIGN_ZH', 'SUN_SIGN_TH', 'SUN_SIGN_VI', 'SUN_SIGN_ES', 'SUN_SIGN_FR',
  '_v512NormalizeHouseOrdinal', 'stripLLMSelfCorrection', '_v512PossessiveNatal', '_v512PossessiveTouch',
  '_v512SentWindow', '_v512CountNatalClaimMismatch', '_V512_POSS', '_V512_MONTH_TOK', '_V512_POSS_NEAR',
  '_V512_TIME_QUAL', '_V512_PLACE_AFTER', '_V512_MALFORMED_HOUSE', '_V512_META_RETRACT', '_V512_SENT_CUT',
  '_V432_EN_SPELLED', '_V512_SPELLED_HOUSE',
  '_V512_META_PLAIN', '_V512_META_DECL', '_V512_META_CORR', '_V512_META_SENT', '_V512_META_PAREN',
  'applyTruthLocksEnEsZh', '_v432LockTransit', '_v433LockMoonWeek', 'applyV434Locks', 'v426EnforceNatalRetrograde'];

const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); } }
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
for (const n of SEEDS) assert.ok(map.has(n), `VM 未能抽取 ${n}`);

function buildWith(hack) {
  const ctx = { getSignToHouseMap: undefined, SIGN_ORDER_ZH: undefined, console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()].sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map((e) => (hack && hack[e[0]] ? hack[e[0]] : e[1])).join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = buildWith(null);

const CH_ADL = {
  Sun: { sign: 'Sagittarius', house: 12 }, Moon: { sign: 'Leo', house: 8 },
  Mercury: { sign: 'Sagittarius', house: 11 }, Venus: { sign: 'Scorpio', house: 12 },
  Mars: { sign: 'Cancer', house: 7 }, Jupiter: { sign: 'Libra', house: 10 },
  Saturn: { sign: 'Aquarius', house: 2 }, Uranus: { sign: 'Capricorn', house: 1 },
  Neptune: { sign: 'Capricorn', house: 1 }, Pluto: { sign: 'Scorpio', house: 11 },
};
const M_ADL = { months: [], meta: { computed_houses: CH_ADL, sun_sign: 'Sagittarius', rising_sign: 'Capricorn' } };

// 月锚点之后 = possessive 模式作用域；两会话标题复刻真实年报结构
const TAILED = (body) => [
  '### WEALTH ORACLE · FINANCIAL REVELATION', '',
  'O child of Sagittarius, born December 15, 1992, with the Sun blazing in the 12th House.', '',
  '### July 2026: Sun in Cancer · 7th House · The Partnership Audit',
  'Transiting Sun enters Cancer this month.', '',
  '### August 2026: Sun in Leo · 8th House · The Creative Surge',
  'The Sun moves into Leo this month.', '',
  '### Chapter III: The Emotional Ledger', '', body,
].join('\n');

test('⑥ 行为级 R11a-1: 畸形宫位形态归一（保形补序数后缀）+ 值域钳制', () => {
  assert.strictEqual(F._v512NormalizeHouseOrdinal('Your natal Moon in Leo in the 5 House.', 'en'),
    'Your natal Moon in Leo in the 5th House.');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('in the 5 House of shared resources', 'en'),
    'in the 5th House of shared resources');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('your 1 House rules money', 'en'), 'your 1st House rules money');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('the 8 House and the 12 House', 'en'),
    'the 8th House and the 12th House');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('3 House is empty', 'en'), '3rd House is empty');
});

test('⑦ 行为级 R11a-1: 畸形归一零误伤（House 5 / 日期序数 / 越值域 / 复数 / 楼层）', () => {
  for (const t of ['House 5 is the house of pleasure', 'July 7th marks a shift', 'in the 8th House of debt',
    'sat in the 13 House of ghosts', 'the 12th floor of the tower', '5 houses on the street']) {
    assert.strictEqual(F._v512NormalizeHouseOrdinal(t, 'en'), t, `畸形归一误伤: ${t}`);
  }
});

// ═══ 🛡️ E13/R11d-1: 英文拼写式序数（第五类盲区）—— 军师裁决要求在本闸门补拼写式用例 ═══
test('⑦b 行为级 R11d-1: 拼写式序数归一（in the seventh house → in the 7th House，形态收口不含纠值）', () => {
  // ⚠️ 本函数是**形态归一器**（不知真值）：只把拼写式收口成 `<N>th House` 数字式，**保留原写值**；
  //   值的真值纠正由随后的真值锁完成（见 ⑧b）。切勿在此期望纠值（否则等于把归一器当成锁）。
  assert.strictEqual(F._v512NormalizeHouseOrdinal('your natal Sun burns in the seventh house of your chart.', 'en'),
    'your natal Sun burns in the 7th House of your chart.');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('Pluto in Scorpio in your first house.', 'en'),
    'Pluto in Scorpio in your 1st House.');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('the Moon in Leo in the seventh house', 'en'),
    'the Moon in Leo in the 7th House');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('transits Cancer in your seventh house', 'en'),
    'transits Cancer in your 7th House');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('moves through the twelfth house', 'en'),
    'moves through the 12th House');
  // 幂等：数字式不再被本式二次处理
  assert.strictEqual(F._v512NormalizeHouseOrdinal('in the 8th House of debt', 'en'), 'in the 8th House of debt');
});

test('⑦c 行为级 R11d-1: 拼写式归一零误伤（非序数 / 行首无冠词 / 我方数字式 / 连字符 / 复数）', () => {
  for (const t of [
    'the White House issued a statement',           // 非序数词 ⇒ 不动
    'first house rules, second house follows',      // 行首 / 逗号后无冠词·物主 ⇒ 不动
    'House 1 and House 12 are angular',             // 我方 houseFmt 合法产物 ⇒ 不动
    'your seventh-house native',                    // 连字符复合形容词（`-` 非空白）⇒ 不动
    'seventh and eighth houses rise together',      // 并列复数（`\s+house\b` 不匹配 `houses`）⇒ 不动
    'the twelfth of never',                         // 非 house 搭配 ⇒ 不动
  ]) {
    assert.strictEqual(F._v512NormalizeHouseOrdinal(t, 'en'), t, `拼写式归一误伤: ${t}`);
  }
});

test('⑦d 域假设边界: 纯冠词引导 <序数> house 亦归一（只换形态、绝不改值）', () => {
  // 📌 域假设（已在上游常量注释显式声明）：本产品正文无房产/乐理语义面，
  //    「the/your + 序数 + house」恒指占星宫位；且归一**绝不改值** ⇒ 语义零风险。
  //    本用例把该假设固化为闸门断言，防止未来被无声改动。
  assert.strictEqual(F._v512NormalizeHouseOrdinal('the seventh house is your partnership sector.', 'en'),
    'the 7th House is your partnership sector.');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('he sold the first house in the seventh year.', 'en'),
    'he sold the 1st House in the seventh year.');
});

test('⑧ 行为级 R11a-1: 真值锁必须认得畸形形态并同时纠值（in the 12 House → 8th House）', () => {
  const t = TAILED('Your natal Moon in Leo in the 12 House.');
  const out = F._v432LockLeadingNatal(t, 'en', M_ADL, 'yearly');
  assert.ok(/Your natal Moon in Leo in the 8th House\./.test(out), '畸形形态未走 numHouse 分支纠值: ' + out.slice(out.indexOf('Chapter III')));
});

// 🛡️ E13/R11d-1: 前导锁必须认得**拼写式**并纠值（finder 层的第五式覆盖，独立于归一化）
test('⑧b 行为级 R11d-1: 前导锁认得拼写式序数并纠值（in your first house → 11th House）', () => {
  const LEADED = (body) => [
    '### WEALTH ORACLE · FINANCIAL REVELATION', '',
    'O child of Sagittarius, born December 15, 1992, with the Sun blazing in the 12th House.', '',
    body, '',
    '### July 2026: Sun in Cancer · 7th House · The Partnership Audit',
    'Transiting Sun enters Cancer this month.', '',
  ].join('\n');
  const out = F._v432LockLeadingNatal(LEADED('Pluto in Scorpio in your first house.'), 'en', M_ADL, 'yearly');
  assert.ok(/Pluto in Scorpio in your 11th House\./.test(out), '拼写式形态未被 finder 认出（第五式盲区）: ' + out.slice(0, 400));
  // 正确值 + 拼写式 ⇒ 锁不动值（形态收口由 _v512NormalizeHouseOrdinal 负责，不属本锁职责）
  const keep = F._v432LockLeadingNatal(LEADED('The Sun blazing in the twelfth house.'), 'en', M_ADL, 'yearly');
  assert.ok(/The Sun blazing in the twelfth house\./.test(keep), '正确值的拼写式被锁误改: ' + keep.slice(0, 400));
});

test('⑨ 行为级 R11a-2: artifact 剥离命中 / 零误伤', () => {
  const a = 'The Sun burns in your 7th House — wait, no. Let us be precise. The transiting Sun occupies your 8th House.';
  const oa = F.stripLLMSelfCorrection(a);
  assert.ok(!/wait, no|Let us be precise/.test(oa), '集群 artifact 未剥离: ' + oa);
  assert.ok(/The transiting Sun occupies your 8th House/.test(oa), '剥离误伤了正确后句: ' + oa);
  assert.ok(!/House\s+—|\.\s+—/.test(oa), '剥离后残留悬空破折号: ' + oa);
  assert.strictEqual(F.stripLLMSelfCorrection('He said (wait, no) the Sun is there.'), 'He said the Sun is there.');
  assert.strictEqual(F.stripLLMSelfCorrection('Correction: the Moon is in Leo.'), 'the Moon is in Leo.');
  // 零误伤：金融常用词 market correction / 正常破折号
  for (const t of ['A market correction is likely in October.',
    'The price will rise — a clear correction of past excesses.',
    'This is normal text with an em dash — like this — and nothing else.']) {
    assert.strictEqual(F.stripLLMSelfCorrection(t), t, `artifact 剥离误伤: ${t}`);
  }
});

test('⑨b 行为级 R11a-2: 破折号撤回必须连同被撤回句一起删（交付物不得自相矛盾）', () => {
  const a = 'Saturn in Aries in the 4th House — wait, no. Let us be precise. Saturn sits in Aquarius in the 2nd House.';
  const oa = F.stripLLMSelfCorrection(a);
  assert.ok(!/Aries/.test(oa) && !/4th House/.test(oa), '被撤回的错句未被删除（产物自相矛盾）: ' + oa);
  assert.ok(oa.includes('Saturn sits in Aquarius in the 2nd House.'), '纠错后的正确句被误删: ' + oa);
  // 句界对齐：撤回只吃掉前一句，更早的正文必须存活
  const b = 'Pluto in Scorpio rules your shared resources. Venus in Cancer — wait, no. Venus is in Scorpio.';
  const ob = F.stripLLMSelfCorrection(b);
  assert.ok(ob.includes('Pluto in Scorpio rules your shared resources.'), '撤回删除越界（吃了更早的正确句）: ' + ob);
  assert.ok(ob.includes('Venus is in Scorpio.'), '纠错后的正确句被误删: ' + ob);
  // 非破折号形态只删标记，不牵连正文
  const c = 'Correction: the Moon is in Leo.';
  assert.strictEqual(F.stripLLMSelfCorrection(c), 'the Moon is in Leo.');
});

test('⑩ 行为级 R11b: 月锚点之后的无标记本命声称必须被纠回真值', () => {
  const out = F._v432LockLeadingNatal(TAILED([
    'Your Moon is in Leo, a Fire sign, in the 7th House.',
    'Jupiter in Leo occupies your 7th House.',
  ].join('\n')), 'en', M_ADL, 'yearly');
  assert.ok(/Your Moon is in Leo, a Fire sign, in the 8th House\./.test(out), 'Ch III 月亮声称未纠: ' + out.slice(out.indexOf('Chapter III')));
  assert.ok(/Jupiter in Libra occupies your 10th House\./.test(out), 'Ch III 木星声称未纠: ' + out.slice(out.indexOf('Chapter III')));
  assert.ok(!/Jupiter in Leo occupies/.test(out), '木星流年伪装残留');
});

test('⑪ 行为级 R11b: 零误伤（流月陈述 / 流年限定 / 远距离物主 / 无物主句 一律不动）', () => {
  const body = [
    'Your 8th House is activated by the Leo Sun.',               // 物主贴宫位但行星非紧跟位置短语 ⇒ 弃权
    'Jupiter in Leo this summer activates your 7th House.',      // 时间限定词 ⇒ 弃权
    'Mercury Retrograde in the 7th House colors your contracts.',// 无物主 ⇒ 不动
    'In September, the transiting Moon in Libra smooths deals.', // 月份 + 流年 ⇒ 不动
    'The Moon in Libra smooths negotiations.',                   // 无物主（月段流月陈述）⇒ 不动
    'Saturn tests your patience in the 3rd House.',              // 物主属 patience ⇒ 弃权
    'The Sun blazing in the 12th House of your natal chart.',    // 真值本已正确 ⇒ 不动
  ].join('\n');
  const out = F._v432LockLeadingNatal(TAILED(body), 'en', M_ADL, 'yearly');
  for (const line of body.split('\n')) {
    assert.ok(out.includes(line), 'R11b 误伤: ' + line + '\n实际: ' + out.slice(out.indexOf('Chapter III')));
  }
  // 月标题 / 流年正文不得被动
  assert.ok(out.includes('### July 2026: Sun in Cancer · 7th House · The Partnership Audit'), '月标题被误改');
  assert.ok(out.includes('Transiting Sun enters Cancer this month.'), '月段流年正文被误改');
});

test('⑫ 行为级 R11b: 幂等 + 月报豁免', () => {
  const once = F._v432LockLeadingNatal(TAILED('Your Moon is in Leo, a Fire sign, in the 7th House.'), 'en', M_ADL, 'yearly');
  const twice = F._v432LockLeadingNatal(once, 'en', M_ADL, 'yearly');
  assert.strictEqual(twice, once, '不幂等');
  const t = TAILED('Your Moon is in Leo, a Fire sign, in the 7th House.');
  assert.strictEqual(F._v432LockLeadingNatal(t, 'en', M_ADL, 'monthly'), t, '月报被 possessive 模式误触碰');
});

test('⑬ 行为级 R11c: 三类漏洞必报 + 合规文本 0 告警 + 无真值盘时判据 12 跳过', () => {
  const dirty = [
    'Sagittarius '.repeat(60),
    '### June 2027: Sun in Gemini · 6th House',
    '### July 2026: Sun in Cancer · 7th House',
    'Your natal Moon in Leo in the 5 House.',
    'Your Moon is in Leo, a Fire sign, in the 7th House.',
    'The Sun shines — wait, no. Let us be precise. The Sun is here.',
  ].join('\n');
  const di = F.wealthCriticCheck(dirty, '1992-12-15', '射手座', 'en', M_ADL);
  assert.ok(di.some((s) => /畸形宫位格式/.test(s)), '判据 10 漏检: ' + JSON.stringify(di));
  assert.ok(di.some((s) => /artifact/.test(s)), '判据 11 漏检: ' + JSON.stringify(di));
  assert.ok(di.some((s) => /真值错配/.test(s)), '判据 12 漏检: ' + JSON.stringify(di));

  const clean = [
    'Sagittarius '.repeat(60),
    '### June 2027: Sun in Gemini · 6th House',
    '### July 2026: Sun in Cancer · 7th House',
    'Your Moon is in Leo, a Fire sign, in the 8th House.',
    'A market correction is likely in October.',
  ].join('\n');
  assert.strictEqual(F.wealthCriticCheck(clean, '1992-12-15', '射手座', 'en', M_ADL).length, 0,
    '合规文本被误报: ' + JSON.stringify(F.wealthCriticCheck(clean, '1992-12-15', '射手座', 'en', M_ADL)));
  assert.strictEqual(F.wealthCriticCheck(clean, '1992-12-15', '射手座', 'en').length, 0,
    '缺 astroMatrix 时判据 12 未跳过（旧调用点会全量误报）');
});

// ═══════════════ 【注入缺陷自测】判据必须具备灵敏度 ═══════════════
test('⑭ 注入自测: 剥离 houseBareNum 正则 → ⑧ 必须红（真值纠偏认不出畸形形态）', () => {
  const orig = map.get('_V432_CFG');
  const hacked = orig.replace(/houseBareNum:\s*\/[^\n]+\/i,/, '');
  assert.notStrictEqual(hacked, orig, '注入失败：未找到 houseBareNum 锚点');
  const F1 = buildWith({ _V432_CFG: hacked });
  const t = TAILED('Your natal Moon in Leo in the 12 House.');
  const out = F1._v432LockLeadingNatal(t, 'en', M_ADL, 'yearly');
  assert.ok(!/in the 8th House\./.test(out), '闸门失效: 剥离 houseBareNum 后畸形形态仍被纠值');
});

test('⑮ 注入自测: 物主准入裁定恒真 → ⑪ 必须红（退化「月段一律锁」= 主动污染）', () => {
  const F1 = buildWith({ _v512PossessiveNatal: 'function _v512PossessiveNatal() { return true; }' });
  const out = F1._v432LockLeadingNatal(TAILED('The Moon in Libra smooths negotiations.'), 'en', M_ADL, 'yearly');
  assert.ok(!out.includes('The Moon in Libra smooths negotiations.'),
    '闸门失效: 准入恒真后无物主裸句仍原样（说明准入门槛形同虚设）');
});

test('⑯ 注入自测: 剥离时间限定词否决 → ⑪ 必须红（this summer 的流年句被当本命句）', () => {
  const orig = map.get('_v512PossessiveNatal');
  const hacked = orig.replace('if (_V512_TIME_QUAL[lang] && _V512_TIME_QUAL[lang].test(sent)) return false;', '');
  assert.notStrictEqual(hacked, orig, '注入失败：未找到时间限定词否决锚点');
  const F1 = buildWith({ _v512PossessiveNatal: hacked });
  const out = F1._v432LockLeadingNatal(TAILED('Jupiter in Leo this summer activates your 7th House.'), 'en', M_ADL, 'yearly');
  assert.ok(!out.includes('Jupiter in Leo this summer activates your 7th House.'),
    '闸门失效: 剥离时间限定词否决后流年句未被动（说明该否决形同虚设）');
});

test('⑰ 注入自测: 剥离判据 12 计数器 → ⑬ 必须红', () => {
  const orig = map.get('wealthCriticCheck');
  const hacked = orig.replace(/const _mis = _v512CountNatalClaimMismatch\([^)]*\);/,
    'const _mis = 0;');
  assert.notStrictEqual(hacked, orig, '注入失败：未找到判据 12 计数器锚点');
  const F1 = buildWith({ wealthCriticCheck: hacked });
  const dirty = 'Sagittarius '.repeat(60) + '\n### June 2027: Sun in Gemini\n### July 2026: Sun in Cancer\n'
    + 'Your Moon is in Leo, a Fire sign, in the 7th House.\n';
  const di = F1.wealthCriticCheck(dirty, '1992-12-15', '射手座', 'en', M_ADL);
  assert.ok(!di.some((s) => /真值错配/.test(s)), '闸门失效: 剥离计数器后仍报真值错配（判据未依赖计数器）');
});

test('⑱ 注入自测: 剥离 artifact 挂载（identity 化）→ artifact 必穿透 applyTruthLocksEnEsZh', () => {
  const dirty = 'x'.repeat(600) + '\nSagittarius ·\n\n### July 2026: Sun in Cancer\n'
    + 'The Sun shines — wait, no. Let us be precise. The Sun is here.\n';
  const ok = F.applyTruthLocksEnEsZh(dirty, 'en', M_ADL, 'yearly');
  assert.ok(!/wait, no/.test(ok), '正常路径未剥离 artifact（挂载无效）: ' + ok);
  const F1 = buildWith({ stripLLMSelfCorrection: 'function stripLLMSelfCorrection(text) { return text; }' });
  const bad = F1.applyTruthLocksEnEsZh(dirty, 'en', M_ADL, 'yearly');
  assert.ok(/wait, no/.test(bad), '闸门失效: identity 化后 artifact 仍被剥离（剥离并非出自该函数）');
});
