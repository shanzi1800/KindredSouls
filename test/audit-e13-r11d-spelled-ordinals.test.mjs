// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E13/R11d: 拼写式序数宫位完备化 + HIT 路径加固 + 偏移坐标系铁律 —— 回归闸门
// 事故背景（2026-10-03 E12/v511 上线复验范围外新发现）:
//   E12 补齐「Nasal 四式」后，英文稿仍存**第五类盲区**：拼写式序数宫位
//     `in the seventh house` / `in your first house` —— 四式正则全部只认阿拉伯数字 ⇒ 零匹配；
//   同时 HIT（缓存命中）路径只跑 applyTruthLocksEnEsZh、未挂 _v432LockLeadingNatal
//     ⇒ 轴点/称谓锁在缓存命中时失效（响应与落库文本可能不一致）。
// 治本（军师最高裁决 E13/R11d）:
//   R11d-1 en cfg 补第五式（_V432_EN_SPELLED 表 + cfg.houseSpelled + Finder spelled 分支 +
//          PatchZone 路由 + _v512NormalizeHouseOrdinal 拼写式归一第二式）；
//   R11d-2 Prompt 侧 STRICT NUMERIC ORDINAL RULE 强约束（yearlySystemEN.txt + langInstructions.en）；
//   R11d-3 CRITIC 判据 10 扩面到拼写式残留，并与归一化**同源**（共用正则源码，杜绝双盲）；
//   R11d-4 HIT 路径补挂前导锁（+ opts.skipAdjudicate 保证幂等：HIT 响应 == 缓存落库文本）；
//   R11d-5 缓存 v511 → v512。
// 本战役另擒两大硬缺陷（v511 真实生产稿实证）:
//   🔴 偏移坐标系铁律（第 2 例）：多段替换+区间坐标**必须按位置倒序应用** ——
//      旧循环「从数组尾部往前」时 bwd 先应用、改变串长 ⇒ fwd 区间失效 ⇒
//      `The Aquarius Sun in your 2nd House` 被改成 `The Sagittarius  in your 12th House`（吃掉 Sun）。
//   🔴 流年一致性否决的**自证补丁**：_v432Clause 的 bwd 是未按句界截断的 70 字符窗口，
//      跨界吃到上一个月标题的 `20\d{2}` 会被 transitMark 清空 ⇒ 前置定语型流年句
//      （`The Aquarius Sun in your 2nd House`）claim.sign=null ⇒ 第 6 否决静默失效。
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
const yearlyEN = fs.readFileSync(path.join(__dirname, '..', 'src', 'prompts', 'yearlySystemEN.txt'), 'utf-8');

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
test('① R11d-1: 拼写式序数第五式全链补齐（表 / cfg / Finder / PatchZone / 归一化第二式）', () => {
  // ①-a 拼写→数值映射表（closed set，first~twelfth）
  const tbl = src.match(/const\s+_V432_EN_SPELLED\s*=\s*\{[\s\S]*?\};/);
  assert.ok(tbl, '_V432_EN_SPELLED 拼写序数表缺失');
  for (const w of ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth']) {
    assert.ok(new RegExp('\\b' + w + '\\s*:').test(tbl[0]), `拼写表缺 ${w}`);
  }
  // ①-b en cfg 第五式 + 保形写回
  const cfg = src.match(/const\s+_V432_CFG\s*=\s*\{[\s\S]*?\n\};/);
  assert.ok(cfg, '_V432_CFG 声明不完整');
  assert.ok(/houseSpelled:\s*\/[^\n]*\(\?<=/.test(cfg[0]), 'en cfg 缺 houseSpelled（第五式拼写序数，须用后顾排除前缀以保形）');
  assert.ok(/houseSpelledFmt:\s*\(n\)\s*=>/.test(cfg[0]), '缺 houseSpelledFmt（拼写式保形写回 Nth House）');
  // ①-c Finder 第五分支
  const finder = stripComments(fnBody('_v432FindHouse'));
  assert.ok(/cfg\.houseSpelled/.test(finder), '_v432FindHouse 缺 houseSpelled 分支（真值锁仍认不出拼写式）');
  assert.ok(/ord:\s*'spelled'/.test(finder), 'houseSpelled 分支未标注 ord:spelled');
  assert.ok(/_V432_EN_SPELLED/.test(finder), '拼写式取值未走 _V432_EN_SPELLED 表');
  // ①-d PatchZone 四态路由
  const patch = stripComments(fnBody('_v432PatchZone'));
  assert.ok(/h\.ord === 'spelled' \? cfg\.houseSpelledFmt\(house\)/.test(patch),
    'PatchZone 未把 spelled 路由到 houseSpelledFmt');
  // ①-e 归一化第二式（形态收口，共用一个正则常量 ⇒ 判据同源的基础）
  const norm = stripComments(fnBody('_v512NormalizeHouseOrdinal'));
  assert.ok(/_V512_SPELLED_HOUSE/.test(norm), '归一化未挂拼写式第二式');
  const decl = src.match(/const\s+_V512_SPELLED_HOUSE\s*=\s*\/[^\n]*\n/);
  assert.ok(decl, '缺 _V512_SPELLED_HOUSE 常量');
  assert.ok(/the\|your\|my\|his\|her\|its\|our\|their/.test(decl[0]), '归一化前缀面未覆盖冠词/物主（crosses your fourth house 类会漏）');
});

test('② R11d-2: Prompt 侧 STRICT NUMERIC ORDINAL RULE 双通道注入', () => {
  const hits = [...yearlyEN.matchAll(/STRICT NUMERIC ORDINAL RULE/g)].length;
  assert.ok(hits >= 2, `yearlySystemEN.txt 强约束注入不足 2 处: ${hits}`);
  assert.ok(/NEVER write spelled-out house names/i.test(yearlyEN), 'yearlySystemEN.txt 缺「禁止拼写式」明确禁令');
  const en = [...src.matchAll(/STRICT NUMERIC ORDINAL RULE/g)].length;
  assert.ok(en >= 2, `server.js langInstructions.en 强约束注入不足 2 处: ${en}`);
});

test('③ R11d-3: CRITIC 判据 10 拼写式扩面且与归一化同源 + 判据 12 补传 astroMatrix', () => {
  const cc = stripComments(fnBody('wealthCriticCheck'));
  assert.ok(/拼写式序数宫位残留/.test(cc), '判据 10 未扩面到拼写式残留');
  // 🔴 同源纪律：判据必须复用归一化的正则**源码**，否则「归一漏了、CRITIC 也看不见」再次双盲
  assert.ok(/new RegExp\(_V512_SPELLED_HOUSE\.source, 'gi'\)/.test(cc),
    '判据 10 未复用 _V512_SPELLED_HOUSE.source（判据与归一化不同源 ⇒ 双盲风险）');
  // 判据 12 计数器调用点必须补传 astroMatrix（否则第 6 否决在判据侧失效 ⇒ 合法流年句被误报）
  const counter = stripComments(fnBody('_v512CountNatalClaimMismatch'));
  assert.ok(/clause,\s*astroMatrix\)\)\s*continue;/.test(counter),
    '判据 12 调用 _v512PossessiveNatal 时漏传 astroMatrix（流年一致性否决在判据侧静默失效）');
  // 第 6 否决的自证补丁必须存在（bwd 被 transitMark 清空时须自主取紧邻星座词）
  const poss = stripComments(fnBody('_v512PossessiveNatal'));
  assert.ok(/pre\.endsWith\(String\(w\)\.toLowerCase\(\)\)/.test(poss),
    '第 6 否决缺「自主取紧邻星座词」回退（前置定语型流年句 claim.sign=null 时否决失效）');
  assert.ok(/replace\(\/\\s\+\$\/,\s*''\)/.test(poss), '回退提取未 trim 尾空白（endsWith 恒不命中）');
});

test('④ E13/R11d-4→E18/R11k: HIT 路径**不再**补挂前导锁（命中即终局，结构幂等）', () => {
  // 🛡️ E18/R11k（军师裁决② Clean HIT Pipeline）: HIT 侧收拢为「命中即终局，不再跑锁链」。
  //   旧 E13/R11d-4 的「HIT 补挂 applyTruthLocksEnEsZh + _v432LockLeadingNatal(+skipAdjudicate)」
  //   已被**结构**取代（命中文本 ≡ 写链终局）⇒ 以下两处挂载**必须不存在**
  //   （否则二次施加非幂等：`Sagittarius…— Sun, Moon,` 被抠成 `SagittLeo…—Moon,`，s2 en 实证）。
  assert.ok(/Clean HIT Pipeline/.test(src), '缺 E18/R11k Clean HIT Pipeline 段（HIT 收拢未落地）');
  assert.ok(!/_hitFinal = applyTruthLocksEnEsZh\(/.test(src), 'HIT 侧不得再挂 applyTruthLocksEnEsZh（E18/R11k 命中即终局）');
  assert.ok(!/_v432LockLeadingNatal\(_hitFinal/.test(src), 'HIT 侧不得再挂 _v432LockLeadingNatal（E18/R11k 命中即终局）');
  // 幂等契约仍有效（函数级，与 HIT 无关）: applyTruthLocksEnEsZh 须把 opts 透传给 _v432LockNatal
  const wire = stripComments(fnBody('applyTruthLocksEnEsZh'));
  assert.ok(/opts\.skipAdjudicate/.test(wire), 'applyTruthLocksEnEsZh 未把 skipAdjudicate 透传给 _v432LockNatal');
  const lock = stripComments(fnBody('_v432LockNatal'));
  assert.ok(/!opts\.leading && !opts\.natalScope && !opts\.skipAdjudicate/.test(lock),
    '_v432LockNatal 未按 skipAdjudicate 跳定语裁定');
});

test('⑤ 偏移坐标系铁律: 四处「多段替换 + 区间坐标」均已按位置倒序应用', () => {
  // 第 2 例（_v432LockNatal）为真缺陷；其余三处为同构同病的防御性对齐
  for (const fn of ['_v432LockNatal', 'lockNatalTruthVi', 'lockNatalTruthFr', 'v426EnforceNatalRetrograde']) {
    const b = stripComments(fnBody(fn));
    assert.ok(/hits\.sort\(\(a,\s*b\)\s*=>\s*b\[0\]\s*-\s*a\[0\]\)/.test(b),
      `${fn} 的 hits 未按位置倒序应用（前缀替换会令后续区间坐标失效）`);
    assert.ok(/for\s*\(let i = 0; i < hits\.length; i\+\+\)/.test(b),
      `${fn} 的 hits 循环未与倒序排序配套（须正序遍历已倒序数组）`);
  }
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
  const ctx = { getSignToHouseMap: undefined, SIGN_ORDER_ZH: undefined, console: { log() {}, warn() {} }, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
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

// 前导段（第 1 章本命建筑）—— 走 leading 模式（强本命语境）
const LEADED = (body) => [
  '### WEALTH ORACLE · FINANCIAL REVELATION', '',
  'O child of Sagittarius, born December 15, 1992, with the Sun blazing in the 12th House.', '',
  body, '',
  '### July 2026: Sun in Cancer · 7th House · The Partnership Audit',
  'Transiting Sun enters Cancer this month.', '',
].join('\n');

// 月锚点之后（Ch II~V）—— 走 possessive 模式。
//   变体 A（TAILED_NEAR）：body 紧邻锚点，bwd 的 70 字符窗口**不含**年份 ⇒ clause.bwd 正常。
//   变体 B（TAILED_2026）：body 与锚点之间再插一个月（其标题含 20\d{2}）⇒ bwd 窗口跨界吃到年份
//     ⇒ _v432Clause 依 V492b 设计把 bwd 清空 ⇒ claim.sign 缺失 ⇒ 第 6 否决必须靠自证补丁兜住。
const TAILED_NEAR = (body) => [
  '### WEALTH ORACLE · FINANCIAL REVELATION', '',
  'O child of Sagittarius, born December 15, 1992, with the Sun blazing in the 12th House.', '',
  '### July 2026: Sun in Cancer · 7th House · The Partnership Audit',
  'Transiting Sun enters Cancer this month.', '',
  '### Chapter III: The Emotional Ledger', '', body, '',
].join('\n');
const TAILED_2026 = (body) => [
  '### WEALTH ORACLE · FINANCIAL REVELATION', '',
  'O child of Sagittarius, born December 15, 1992, with the Sun blazing in the 12th House.', '',
  '### August 2026: Sun in Leo · 8th House · The Creative Surge',
  'The Sun moves into Leo this month.', '',
  '### Chapter III: The Emotional Ledger', '', body, '',
].join('\n');

const lockLead = (t) => F._v432LockLeadingNatal(t, 'en', M_ADL, 'yearly');
const bodyOf = (out, n) => out.split('\n')[n];
const MISS = (t) => F._v432LockLeadingNatal(F.applyTruthLocksEnEsZh(t, 'en', M_ADL, 'yearly'), 'en', M_ADL, 'yearly');
const HIT = (t) => F._v432LockLeadingNatal(F.applyTruthLocksEnEsZh(t, 'en', M_ADL, 'yearly', { skipAdjudicate: true }), 'en', M_ADL, 'yearly');

test('⑥ 行为级 R11d-1: 拼写式归一全覆盖（first~twelfth → Nth House）', () => {
  const ord = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th') + ' House';
  const W = [['first', 1], ['second', 2], ['third', 3], ['fourth', 4], ['fifth', 5], ['sixth', 6],
    ['seventh', 7], ['eighth', 8], ['ninth', 9], ['tenth', 10], ['eleventh', 11], ['twelfth', 12]];
  for (const [w, n] of W) {
    assert.strictEqual(F._v512NormalizeHouseOrdinal(`in the ${w} house`, 'en'), `in the ${ord(n)}`,
      `拼写式归一失败: ${w}`);
  }
  // 变异形态（你/我的）
  assert.strictEqual(F._v512NormalizeHouseOrdinal('transits Cancer in your seventh house', 'en'), 'transits Cancer in your 7th House');
  assert.strictEqual(F._v512NormalizeHouseOrdinal('moves through the twelfth house', 'en'), 'moves through the 12th House');
  // 幂等：数字式不再被二次处理
  assert.strictEqual(F._v512NormalizeHouseOrdinal('in the 8th House of debt', 'en'), 'in the 8th House of debt');
});

test('⑦ 行为级 R11d-1: 拼写式归一零误伤（非序数 / 行首无冠词 / 数字式 / 连字符 / 复数）', () => {
  for (const t of [
    'the White House issued a statement',
    'first house rules, second house follows',
    'House 1 and House 12 are angular',
    'your seventh-house native',
    'seventh and eighth houses rise together',
    'the twelfth of never',
  ]) assert.strictEqual(F._v512NormalizeHouseOrdinal(t, 'en'), t, `拼写式归一误伤: ${t}`);
});

test('⑧ 行为级 R11d-1: 前导锁认拼写式并纠值（值对时只纠形态由归一化负责，本锁不动值）', () => {
  const cases = [
    ['Pluto in Scorpio in your first house.', /Pluto in Scorpio in your 11th House\./],     // 1 → 真值 11
    ['Saturn in Aquarius in the eleventh house.', /Saturn in Aquarius in the 2nd House\./], // 11 → 真值 2
    ['The Moon in Leo in the seventh house.', /The Moon in Leo in the 8th House\./],        // 7 → 真值 8
  ];
  for (const [inp, re] of cases) {
    const out = lockLead(LEADED(inp));
    assert.ok(re.test(out), `拼写式未被认出错值: ${inp} ⇒ ${JSON.stringify(bodyOf(out, 4))}`);
  }
  // 值本来就对 ⇒ 锁**不改值**（形态归一由 _v512NormalizeHouseOrdinal 负责，不属本锁职责）
  const keep = lockLead(LEADED('Jupiter in Libra in the tenth house.'));
  assert.ok(/Jupiter in Libra in the tenth house\./.test(keep), '正确值的拼写式被锁误改: ' + JSON.stringify(bodyOf(keep, 4)));
});

test('⑨ 行为级 偏移坐标系铁律: 单行星 fwd+bwd 双命中逐字正确（不吃字/不复制）', () => {
  // 旧缺陷实测输出 `The Sagittarius  in your 12th House.`（吃掉 Sun、尾部复制 or or）
  const out = lockLead(LEADED('The Aquarius Sun in your 7th House.'));
  assert.ok(/The Sagittarius Sun in your 12th House\./.test(out),
    '偏移坐标系缺陷复发（fwd/bwd 双命中应用顺序错误）: ' + JSON.stringify(bodyOf(out, 4)));
});

test('⑩ 行为级 流年一致性否决: 前置定语型流年句弃权（含 bwd 被 transitMark 清空的路径）', () => {
  // 等宫制: Capricorn 上升 ⇒ Aquarius = 本命第 2 宫。`The Aquarius Sun in your 2nd House`
  //   = 流年太阳行至水瓶座（＝本命 2 宫）⇒ 流年语境 ⇒ 必须弃权（宁漏不改）。
  //   变体 A: bwd 窗口干净（claim.sign=Aquarius 可得）
  const a = lockLead(TAILED_NEAR('The Aquarius Sun in your 2nd House.'));
  assert.ok(/The Aquarius Sun in your 2nd House\./.test(a), '变体 A: 流年句被误改: ' + JSON.stringify(bodyOf(a, 8)));
  //   变体 B: bwd 窗口跨界吃到上一个月标题的 2026 ⇒ _v432Clause 清空 bwd ⇒ claim.sign=null
  //           ⇒ 第 6 否决必须靠「自主取紧邻星座词」补丁兜住
  const b = lockLead(TAILED_2026('The Aquarius Sun in your 2nd House.'));
  assert.ok(/The Aquarius Sun in your 2nd House\./.test(b),
    '变体 B: bwd 被清空时第 6 否决失效、流年句被误改: ' + JSON.stringify(bodyOf(b, 8)));
  // 对照: 星座与其本命宫位**不吻合** ⇒ 不是流年式 ⇒ 准入并纠值（house 应被纠到 Sun 真值 12）
  const c = lockLead(TAILED_NEAR('The Aquarius Sun in your 7th House.'));
  assert.ok(/in your 12th House\./.test(c), '对照: 非流年式前置定语句未被纠值: ' + JSON.stringify(bodyOf(c, 8)));
});

test('⑪ 行为级 R11d-4: HIT 路径 == 缓存落库文本（幂等）', () => {
  const FIX = [
    '### WEALTH ORACLE · FINANCIAL REVELATION', '',
    'O child of Sagittarius, born December 15, 1992, with the Sun blazing in the 7th House.', '',
    '### July 2026: Sun in Cancer · 7th House · The Partnership Audit',
    'The Sun transits Cancer in your 7th House.', '',
    '### Chapter III: The Emotional Ledger', '',
    'The Moon in Libra sits in the 3rd House.', '',
  ].join('\n');
  const cached = MISS(FIX);
  assert.notStrictEqual(cached, FIX, '夹具未被处理（断言无效）');
  assert.strictEqual(HIT(cached), cached, 'HIT 路径返回与缓存落库文本不一致（用户刷新会看到不同结果）');
});

test('⑫ 行为级 R11d-3: 判据 10 报拼写式残留 / 判据 12 不误报合法流年句', () => {
  const dirty = 'Sagittarius '.repeat(60) + '\n### June 2027: Sun in Gemini\n### July 2026: Sun in Cancer\n'
    + 'Your Moon is in Leo, a Fire sign, in the seventh house.\n';
  const iss = F.wealthCriticCheck(dirty, '1992-12-15', '射手座', 'en', M_ADL);
  assert.ok(iss.some((s) => /拼写式序数宫位残留/.test(s)), '判据 10 未报拼写式残留: ' + JSON.stringify(iss));
  // 判据 12: 合法流年句不得被算作「本命声称真值错配」
  const flow = '### Chapter III: The Emotional Ledger\n\nThe Aquarius Sun in your 2nd House.\n';
  assert.strictEqual(F._v512CountNatalClaimMismatch(flow, 'en', M_ADL), 0, '合法流年句被判定为真值错配');
  // 第 6 否决对 astroMatrix 的**依赖关系**（判据 12 必须把真值盘传下去才有意义）
  const fi = flow.indexOf('Sun');
  const fcl = F._v432Clause(F._V432_CFG.en, 'en', flow, fi, 3, true, {});
  assert.strictEqual(F._v512PossessiveNatal(F._V432_CFG.en, 'en', flow, fi, 3, fcl, M_ADL), false,
    '有真值盘时前置定语型流年句未弃权（第 6 否决失灵）');
  assert.strictEqual(F._v512PossessiveNatal(F._V432_CFG.en, 'en', flow, fi, 3, fcl, undefined), true,
    '闸门失效: 无真值盘时第 6 否决仍生效（说明该断言测不到 astroMatrix 的必要性）');
});

// ═══════════════ 【注入缺陷自测】 ═══════════════
test('⑬ 注入自测: 复刻旧版 hits 应用顺序 → ⑨ 必红（偏移坐标系缺陷复发）', () => {
  // ⚠️ 注入的正确姿势是**复刻旧缺陷**（不排序 + 倒序循环），而非仅剥离排序：
  //   剥离排序后 hits 恰为 [靠后, 靠前]，配正序循环仍等价于倒序应用 ⇒ 测不出缺陷。
  const orig = map.get('_v432LockNatal');
  const hacked = orig.replace(
    'hits.sort((a, b) => b[0] - a[0]);\n  for (let i = 0; i < hits.length; i++) {',
    'for (let i = hits.length - 1; i >= 0; i--) {');
  assert.notStrictEqual(hacked, orig, '注入失败：未找到 hits.sort + 正序循环锚点');
  const F1 = buildWith({ _v432LockNatal: hacked });
  const out = F1._v432LockLeadingNatal(LEADED('The Aquarius Sun in your 7th House.'), 'en', M_ADL, 'yearly');
  assert.ok(!/The Sagittarius Sun in your 12th House\./.test(out),
    '闸门失效: 复刻旧循环后仍产出正确文本（说明该断言测不到偏移坐标系缺陷）');
});

test('⑭ 注入自测: 剥离第 6 否决的自证补丁 → ⑩ 变体 B 必红', () => {
  const orig = map.get('_v512PossessiveNatal');
  const FB = `      let signTok = claim && claim.sign ? claim.sign : null;
      if (!signTok) {
        const pre = text.slice(Math.max(0, i - 24), i).replace(/\\s+$/, '').toLowerCase();
        for (const w of _v432AllSignWords(lang)) {
          if (w && pre.endsWith(String(w).toLowerCase())) { signTok = w; break; }
        }
      }`;
  const hacked = orig.replace(FB, `      let signTok = claim && claim.sign ? claim.sign : null;`);
  assert.notStrictEqual(hacked, orig, '注入失败：未找到回退提取锚点');
  const F1 = buildWith({ _v512PossessiveNatal: hacked });
  const out = F1._v432LockLeadingNatal(TAILED_2026('The Aquarius Sun in your 2nd House.'), 'en', M_ADL, 'yearly');
  assert.ok(!/The Aquarius Sun in your 2nd House\./.test(out),
    '闸门失效: 剥离自证补丁后仍不误改（说明该断言测不到 bwd 清空路径）');
});

test('⑮ 注入自测: 剥离 HIT 路径前导锁 → 轴点纠偏能力丢失', () => {
  // 模拟「缓存文本轴点错误」（旧版落库 / 上游异常）：带前导锁必须纠回真值
  const bad = LEADED('The Moon in Libra sits in the 3rd House.').replace('O child of Sagittarius', 'O child of Leo')
    .replace('with the Sun blazing in the 12th House', 'with the Sun blazing in the 12th House');
  const withLead = HIT(bad);
  assert.ok(/O child of Sagittarius/.test(withLead), '带前导锁仍不纠称谓轴点（HIT 路径防线缺失）: ' + JSON.stringify(withLead.slice(0, 200)));
  const noLead = F.applyTruthLocksEnEsZh(bad, 'en', M_ADL, 'yearly', { skipAdjudicate: true });
  assert.ok(/O child of Leo/.test(noLead), '闸门失效: 未挂前导锁时轴点仍被纠（说明断言无效）');
});

test('⑯ 缓存 v515（server.js 四站点 + purge 补 v514 双形态）', () => {
  const sites = [...src.matchAll(/wealth:v522/g)].length;
  assert.ok(sites >= 4, `server.js v522 站点不足 4: ${sites}`);
  assert.ok(!src.includes('wealth:v520'), 'server.js 残留 v520（漏改一站）');
  assert.ok(/wealth:v520:\*/.test(purgeSrc) && /wealth:v520-v2:\*/.test(purgeSrc), 'purge 脚本未补 v520 双形态');
});
