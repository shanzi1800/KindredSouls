// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E18/R11k 闸门: 锁链幂等化（Strict Idempotency）+ Clean HIT Pipeline · 治本回归
//
// 事故背景（2026-10-05 v517 线上 12 盘批测 + 离线逐字复刻）:
//   P0-A「拼接吃字」—— s2 阿德莱德 en 库内**正确**句
//        `Sagittarius 12th House emphasis in your chart — Sun, Moon,`
//      HIT 响应被改成 `SagittLeo 8th House emphasis in your chart —Moon,`。
//      根因（偏移坐标系铁律 · 第 4 例）: `_v432Clause` 的
//        `cfg.bodyAny = /(?:^|[\s(])(?:Sun|Moon|…)\b/` 会**吞掉前导分隔符**
//      ⇒ `bwd = tail.slice(0, bm)` 与锚点之间还隔着 `" Sun, "` ⇒ 调用方
//        `backStart = m.index - bwd.length` 的「bwd 必紧贴锚点」前提失效 ⇒ 起点右移。
//   P0-C「月标题反写」—— `lockYearlyBareNatalPlanets`（E17 引入）对月标题行零豁免
//      ⇒ 12 个月标题星座被反写成 natal Sun（宫位却是正确的流年值）。
//   另: `standardizeReport` 的 `###`/`---` 换行注入**非幂等** ⇒ HIT 侧二次施加必劣化。
//
// 治法（本闸门逐条钉死）:
//   ① `_v432Clause` 回传 **`bwdOff` 绝对起点** + **`bwdOther`**（窗被另一颗行星名截断即弃权）；
//   ② HIT 链收拢为「命中即终局，不再跑锁链」（结构保证 HIT 响应 ≡ 落库文本）；
//   ③ 月标题行豁免（判据同源 `_v516MonthHeadKey`，与 `lockYearlyMonthTitles` 同口径）。
//
// 方法论铁律: 每条判据都配「注入复刻旧缺陷」自测 —— 注入后必须复现线上 artifact, 否则判据无判别力。
// ═══════════════════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
const PURGE = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'purge-tz-poison-cache.mjs'), 'utf-8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/** 取函数体（大括号配平, 跳过字符串/注释里的花括号）; 签名默认参须先配平参数表圆括号 */
function fnBody(name, source = SRC) {
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
  return SRC.slice(at, i + 1);
}
function grabFn(source, name) {
  const at = source.indexOf(`function ${name}(`);
  if (at < 0) throw new Error(`no fn ${name}`);
  let i = source.indexOf('{', at), pd = 0;
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === '{') pd++;
    else if (c === '}') { pd--; if (pd === 0) break; }
    else if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      for (; i < source.length; i++) { if (source[i] === '\\') { i++; continue; } if (source[i] === q) break; }
    } else if (c === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i) + 1; }
    else if (c === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); }
  }
  return source.slice(at, i + 1);
}
function grabBrace(source, name) {
  const at = source.indexOf(`const ${name} `) >= 0 ? source.indexOf(`const ${name} `) : source.indexOf(`let ${name} `);
  if (at < 0) throw new Error(`no const ${name}`);
  let i = source.indexOf('{', at), pd = 0;
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === '{') pd++;
    else if (c === '}') { pd--; if (pd === 0) { i++; break; } }
    else if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      for (; i < source.length; i++) { if (source[i] === '\\') { i++; continue; } if (source[i] === q) break; }
    }
  }
  return source.slice(at, i);
}
function grabLine(source, name) {
  const at = source.indexOf(`const ${name} `);
  if (at < 0) throw new Error(`no line ${name}`);
  return source.slice(at, source.indexOf('\n', at));
}

// ═══════════════════════ 夹具 ═══════════════════════
// Adelaide Placidus 真值（与 §七 基准盘一致）
const CH_ADL = {
  Sun: { sign: 'Sagittarius', house: 12 }, Moon: { sign: 'Leo', house: 8 },
  Mercury: { sign: 'Sagittarius', house: 11 }, Venus: { sign: 'Scorpio', house: 12 },
  Mars: { sign: 'Cancer', house: 7 }, Jupiter: { sign: 'Libra', house: 10 },
  Saturn: { sign: 'Aquarius', house: 2 }, Uranus: { sign: 'Capricorn', house: 1 },
  Neptune: { sign: 'Capricorn', house: 1 }, Pluto: { sign: 'Scorpio', house: 11 },
};
const M_ADL = { months: [], meta: { computed_houses: CH_ADL, sun_sign: 'Sagittarius', rising_sign: 'Capricorn' } };

// s2 阿德莱德 en 库内文本的**关键句**（2026-10-05 线上 `ai_insights_cache` 逐字摘录）
const KILLER = 'Sagittarius 12th House emphasis in your chart — Sun, Moon, and Jupiter all tenants of this house — cannot be overstated.';
// 前导段 + 月锚点行（`_v432LockLeadingNatal` 的 cut<=0 ⇒ 夹具必须含月份锚点行）
const FIX = [
  '### WEALTH ORACLE · FINANCIAL REVELATION', '',
  'O child of Sagittarius, born December 15, 1992, with the Sun blazing in the 12th House.', '',
  '### Chapter I: The Natal Blueprint', '',
  KILLER, '',
  '### July 2026: Sun in Cancer · 7th House · The Partnership Audit',
  'Transiting Sun enters Cancer this month.',
].join('\n');

// ═══════════════════ A. `_v432Clause` 坐标 + `_v432LockLeadingNatal` 幂等 ═══════════════════
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

const { map } = closureDecls(SRC, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) { try { new vm.Script(map.get(n)); } catch (e) { dropped.push(`${n}(${e.message.slice(0, 40)})`); map.delete(n); } }
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
for (const n of SEEDS) assert.ok(map.has(n), `VM 未能抽取 ${n}`);

function buildWith(hack) {
  const ctx = { getSignToHouseMap: undefined, SIGN_ORDER_ZH: undefined, console: { log() {}, warn() {} }, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()].sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1]))
    .map((e) => (hack && hack[e[0]] ? hack[e[0]] : e[1])).join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = buildWith(null);

test('① 结构级: `_v432Clause` 回传 bwdOff/bwdOther；`_v432LockNatal` 必须使用绝对坐标 + 截断弃权', () => {
  const cl = stripComments(fnBody('_v432Clause'));
  assert.ok(/return \{ fwd, bwd, bwdOff, bwdOther, fwd2, fwd2Off \};/.test(cl),
    '_v432Clause 必须回传 bwdOff（绝对起点）与 bwdOther（被另一颗行星名截断标记）');
  assert.ok(/bwdOff = bwdBase \+ lo;/.test(cl), 'bwdOff 必须 = 窗口起点 + 从句起点（不得再用长度反推）');
  const lock = stripComments(fnBody('_v432LockNatal'));
  assert.ok(/const backStart = \(typeof bwdOff === 'number'\) \? bwdOff : \(m\.index - bwd\.length\);/.test(lock),
    '_v432LockNatal 必须优先使用 builder 回传的 bwdOff 绝对坐标');
  assert.ok(/const skipB = bwdOther;/.test(lock),
    'bwd 被另一颗行星名截断时必须弃权（skipB = bwdOther）—— 否则张冠李戴 + 二次施加不稳定');
});

test('② 几何前置: 夹具必须触发「bwd 不紧贴锚点」+「被另一颗行星名截断」（否则本闸门无判别力）', () => {
  const iMoon = FIX.indexOf('Sun, Moon,') + 'Sun, '.length;
  assert.ok(iMoon > 0, '夹具未含 `Sun, Moon,`（无法定位 Moon 锚点）');
  const clause = F._v432Clause(F._V432_CFG.en, 'en', FIX, iMoon, 4, true, { wide: true });
  assert.ok(clause, '夹具未产从句（几何前置失败）');
  assert.strictEqual(clause.bwdOther, true, '夹具必须触发 bwdOther（`— Sun, Moon,` 的 ` Sun, ` 截断）');
  assert.notStrictEqual(clause.bwdOff, iMoon - clause.bwd.length,
    '夹具必须触发「bwd 不紧贴锚点」（bwdOff ≠ i - bwd.length）—— 这正是旧长度反推的失效条件');
});

test('③ 行为级: s2 库内文本 replay ⇒ 零 `SagittLeo` 拼接 artifact，关键句逐字保留', () => {
  const out = F._v432LockLeadingNatal(FIX, 'en', M_ADL, 'yearly');
  assert.ok(!/SagittLeo/.test(out), `产出拼接残串 SagittLeo（线上 v517 HIT artifact 复现）:\n${out.slice(0, 400)}`);
  assert.ok(out.includes(KILLER), `关键句被改写（bwd 截断时须**弃权**）:\n${out.slice(0, 400)}`);
});

test('④ 幂等级: f(f(x)) === f(x)（二次施加零改动 Δ=0）', () => {
  const once = F._v432LockLeadingNatal(FIX, 'en', M_ADL, 'yearly');
  const twice = F._v432LockLeadingNatal(once, 'en', M_ADL, 'yearly');
  assert.strictEqual(twice, once, `非幂等（Δ=${twice.length - once.length}）—— 二次施加会继续改写`);
  assert.strictEqual(twice.length - once.length, 0, 'Δ 必须强等于 0');
});

test("⑤ 注入自测: 回退 bwd 起点为长度反推 + 取消截断弃权 ⇒ 必须复现 `SagittLeo`（判据有判别力）", () => {
  const hacked = buildWith({
    '_v432LockNatal': fnBody('_v432LockNatal')
      .replace("const backStart = (typeof bwdOff === 'number') ? bwdOff : (m.index - bwd.length);",
        'const backStart = m.index - bwd.length;')
      .replace('const skipB = bwdOther;', 'const skipB = false;'),
  });
  const out = hacked._v432LockLeadingNatal(FIX, 'en', M_ADL, 'yearly');
  assert.ok(/SagittLeo/.test(out), `注入回退后必须复现线上 artifact（否则 ③ 判据无判别力）:\n${out.slice(0, 400)}`);
});

test("⑤' 注入自测: 仅取消截断弃权 ⇒ 关键句被改写（③ 判据变红，证明弃权守卫必需）", () => {
  const hacked = buildWith({
    '_v432LockNatal': fnBody('_v432LockNatal').replace('const skipB = bwdOther;', 'const skipB = false;'),
  });
  const out = hacked._v432LockLeadingNatal(FIX, 'en', M_ADL, 'yearly');
  assert.ok(!out.includes(KILLER),
    `仅取消弃权、保留 bwdOff 绝对坐标 ⇒ 关键句仍被改写（张冠李戴），证明「弃权」是独立且必需的守卫:\n${out.slice(0, 400)}`);
  assert.ok(!/SagittLeo/.test(out), '坐标已正确 ⇒ 不得产生拼接 artifact（artifact 只源于坐标错位）');
});

// ═══════════════════ B. 月标题行豁免（判据同源 `_v516MonthHeadKey`） ═══════════════════
function buildBare(source) {
  const parts = [
    grabLine(source, 'SUN_SIGN_EN'), grabLine(source, 'SUN_SIGN_ZH'), grabLine(source, 'SUN_SIGN_ES'),
    grabLine(source, 'SUN_SIGN_FR'), grabLine(source, 'SUN_SIGN_TH'), grabLine(source, 'SUN_SIGN_VI'),
    grabFn(source, '_v444Esc'), grabFn(source, '_v444Signs'),
    grabBrace(source, '_V517_TRANSIT_MARK'),
    grabFn(source, '_v517LocalSign'),
    grabLine(source, '_V517_PLANET_ZH'), grabLine(source, '_V517_PLANET_EN'), grabLine(source, '_V517_PLANET_KEY_ORDER'),
    grabFn(source, '_v517BareNatalRe'),
    grabFn(source, '_v516Esc'),
    grabBrace(source, '_V516_MONTHS'), grabLine(source, '_V516_TH_BE_OFFSET'), grabLine(source, '_V516_TH_SIGN_EXCL'),
    grabFn(source, '_v516MonthHeadKey'),
    grabFn(source, 'lockYearlyBareNatalPlanets'),
  ].join('\n');
  return new Function(parts + '\nreturn { lockYearlyBareNatalPlanets, _v516MonthHeadKey };')();
}
const FB = buildBare(SRC);

// 12 个月英文标题（Adelaide 流年真值: Cancer7 … Gemini6）—— 星座是**流月太阳**，非本命
const SIGNS12 = ['Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini'];
const MONTHS12 = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
const TITLES = MONTHS12.map((m, i) => `### ${m} 2026: Sun in ${SIGNS12[i]} · ${[7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6][i]}th House · The Monthly Theme`);
const YEARLY = ['### WEALTH ORACLE · FINANCIAL REVELATION', '', 'O child of Sagittarius, born December 15, 1992.', '',
  ...TITLES, '', 'Your natal Sun in Sagittarius in the 12th House shapes everything.', ''].join('\n');

test('⑥ 结构级: `lockYearlyBareNatalPlanets` 必须含月标题行豁免（判据同源 `_v516MonthHeadKey`）', () => {
  const b = stripComments(fnBody('lockYearlyBareNatalPlanets'));
  assert.ok(/_v517InMonthTitle/.test(b), '缺月标题行豁免设施 `_v517InMonthTitle`');
  assert.ok(/if \(_v517InMonthTitle\(off\)\) return m;/.test(b), '缺月标题行豁免守卫（否则 12 月标题被本命锁反写）');
  assert.ok(/_v516MonthHeadKey\(/.test(b), '豁免必须复用 `_v516MonthHeadKey`（与 lockYearlyMonthTitles 同口径，杜绝双盲）');
});

test('⑦ 行为级: 12 个月标题在 bare 锁下逐字保留（宫位/星座均不得被 natal 反写）', () => {
  const out = FB.lockYearlyBareNatalPlanets(YEARLY, 'en', M_ADL, 'yearly');
  const before = YEARLY.split('\n').filter((l) => l.startsWith('### '));
  const after = out.split('\n').filter((l) => l.startsWith('### '));
  assert.equal(after.length, 13, '标题行数不得减少（1 报头 + 12 月）');
  assert.deepEqual(after, before, '月标题必须逐字保留（真值由 lockYearlyMonthTitles 专职负责）');
});

test("⑦' 注入自测: 删除月标题豁免 ⇒ 必须复现线上 B 版（标题星座全变 natal Sun）", () => {
  const INJ = SRC.replace('if (_v517InMonthTitle(off)) return m;', '');
  assert.notEqual(INJ, SRC, '注入未生效');
  const Fi = buildBare(INJ);
  const out = Fi.lockYearlyBareNatalPlanets(YEARLY, 'en', M_ADL, 'yearly');
  const titles = out.split('\n').filter((l) => /^### (July|August|September|October|November|December|January|February|March|April|May|June) /.test(l));
  const wrong = titles.filter((l) => /Sun in Sagittarius/.test(l));
  assert.ok(wrong.length >= 10, `注入后 ≥10 个月标题星座应被反写成 natal Sun，实得 ${wrong.length}`);
});

// ═══════════════════ C. Clean HIT Pipeline（结构保证 HIT 响应 ≡ 落库文本） ═══════════════════
test('⑧ 结构级: HIT 侧零真值锁（命中即终局）—— 非流式与流式均不得再挂锁', () => {
  assert.ok(/Clean HIT Pipeline/.test(SRC), '缺 E18/R11k Clean HIT Pipeline 段（HIT 收拢未落地）');
  // ⚠️ 须剥注释：源码里保留的历史注记（`（stdCached = lockNatalTruthVi(...)`）不构成真实挂载。
  const CODE = stripComments(SRC);
  for (const [tag, re] of [
    ['非流式 HIT applyTruthLocksEnEsZh', /_hitFinal = applyTruthLocksEnEsZh\(/],
    ['非流式 HIT 前导锁', /_v432LockLeadingNatal\(_hitFinal/],
    ['非流式 HIT 落款锁', /_hitFinal = _v517YearlyFinalLocks\(_hitFinal/],
    ['非流式 HIT 二次卫生', /stdCached = lockNatalTruth/],
    ['流式 HIT 真值锁', /streamText = applyTruthLocksEnEsZh\(/],
    ['流式 HIT 月标题锁', /streamText = lockYearlyMonthTitles\(streamText/],
    ['流式 HIT 落款锁', /streamText = _v517YearlyFinalLocks\(streamText/],
  ]) {
    assert.ok(!re.test(CODE), `[${tag}] 不得存在 —— HIT 命中即终局（否则同一缓存键产出两份不同报告）`);
  }
});

test("⑧' 结构级: HIT 段不再二次 `standardizeReport`（其 `###`/`---` 换行注入非幂等）", () => {
  assert.ok(/let stdCached = cachedText;/.test(SRC), 'HIT 段必须**原样**引用库内文本（不得再 standardizeReport）');
  assert.ok(!/let stdCached = standardizeReport\(cachedText\)/.test(SRC), 'HIT 段不得再对库内文本二次 standardizeReport');
});

test('⑨ 结构级: MISS 响应 ≡ 落库文本（`_finalText` 单次计算、两处共用）', () => {
  assert.ok(/const _finalText = standardizeReport\(reportContent\);/.test(SRC), '缺 `_finalText` 单次计算');
  assert.ok(/report: _finalText/.test(SRC), '响应必须回传 `_finalText`（与落库文本一致）');
  assert.ok(/insight: _finalText/.test(SRC), '落库必须写 `_finalText`（与响应一致）');
});

// ═══════════════════ D. 版本 bump ═══════════════════
test('⑩ 结构级: 缓存 v523（4 站点）+ purge 双形态回收 v522 + 旧闸门基线前移', () => {
  const sites = [...SRC.matchAll(/wealth:v524/g)].length;
  assert.equal(sites, 4, `4 个缓存站点须全部为 v523, 实得 ${sites}`);
  assert.ok(!/wealth:v523/.test(stripComments(SRC)), 'server.js 内不得残留 v522 键（注释历史注记除外）');
  assert.ok(PURGE.includes("'wealth:v523:*'") && PURGE.includes("'wealth:v523-v2:*'"), 'purge 须双形态回收 v522');
  for (const f of ['audit-e10-r9-natal-coverage.test.mjs', 'audit-e11-r10-critic-precision.test.mjs',
    'audit-e12-r11-whole-report-lock.test.mjs', 'audit-e13-r11d-spelled-ordinals.test.mjs',
    'audit-e15-r11f-multilang-uncage.test.mjs']) {
    const t = fs.readFileSync(path.join(__dirname, f), 'utf-8');
    // 🛡️ E19/R11l: 基线前移判据只锁「站点计数正则」——旧闸门内的 purge 回收断言
    //    （wealth:vNNN:\*）与残留检查字符串是合法字面量，粗暴 includes 会误伤（e17⑰ 同修）。
    // ⚠️ E19/R11m 修正：此处曾与 e17⑰ 同病 —— 两条断言**同用 v520**（「须不存在」∧「须存在」
    //    自相矛盾）；因 `test:astro` 是 `&&` 长链、上轮大批有红 ⇒ 短路从未跑到 ⇒ 缺陷潜伏。
    //    改纯字符串 includes（零正则转义坑）+ 显式断言新旧基线不同，绝不再写歪。
    const OLD_BASE = 'matchAll(/wealth:v523/g)';
    const NEW_BASE = 'matchAll(/wealth:v524/g)';
    assert.notStrictEqual(OLD_BASE, NEW_BASE, '判据自检：新旧基线串不得相同（否则两条断言自相矛盾）');
    assert.ok(!t.includes(OLD_BASE), `${f} 站点计数基线须前移至 v523`);
    assert.ok(t.includes(NEW_BASE), `${f} 站点计数须为 v523`);
  }
});
