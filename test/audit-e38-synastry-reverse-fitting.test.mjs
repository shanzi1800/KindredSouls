/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐾 E38 闸门：合婚双盘真值与反向合盘实体化 · 第一期
 *            「E38-A 四象算子精准化 + 宫位微调层」（第 18 道防线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（2026-10-09 军师《E38 合婚双盘真值与反向合盘实体化》开工令 · 三裁全准）：
 *   ① D1/D2/D3 三处口径差异闭合 —— 唯一真源 `RELATION_DECISION_OPERATORS` 精准化；
 *   ② 灵宠人格 5 维引入 `emphasis_houses` 微调（House Modifier，纯函数 0.10~0.20）；
 *   ③ 宫内星真值通路复用（`computed_houses` → 引擎），缺真值**零微调**，绝不伪造。
 *
 * 四路取证（**刻意避让 E32/E36 既有射程**：不重复声线矩阵、两槽契约、门控阵列）：
 *   A 源码级：算子精准化独立解析 + 三裁字面量正面证据 + 系数区间与牵引值域
 *   B 行为级：真实 CLI 出参（算子快照四象合规 + house_modifier 两态 + 幂等 + 降级）
 *   C 链路级：server.js → v69_client.js → familiar_engine.py 宫内星真值贯通（含真 spawn）
 *   D 注入级：改回旧口径 / 同质化元素 / 越界系数 / 越界牵引 / 拆掉宫位过滤 ⇒ 必红
 *
 * 运行：node --test test/audit-e38-synastry-reverse-fitting.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const ENGINE_SRC = read('astro/familiar_engine.py');
const CLIENT_SRC = read('v69_client.js');
const SERVER_SRC = read('server.js');

const MODES = ['girlfriend', 'buddy', 'bestie', 'boyfriend'];
const DIMS = ['clingy', 'healing', 'moody', 'sarcastic', 'talkative'];
const ELEMENT_DOMAIN = ['fire', 'earth', 'air', 'water'];

// ── 军师三裁真值（唯一真值期望；任何漂移都必须在此处显式改，并同步军师口径）──
const EXPECT_OPS = {
  girlfriend: { primary_factors: ['venus', 'mars', 'moon'], emphasis_houses: [7, 5], element_preference: ['water', 'earth'] },
  buddy: { primary_factors: ['sun', 'mars'], emphasis_houses: [11, 3], element_preference: ['fire', 'air'] },
  bestie: { primary_factors: ['mercury', 'moon'], emphasis_houses: [3, 11], element_preference: ['air', 'water'] },
  boyfriend: { primary_factors: ['sun', 'jupiter', 'venus'], emphasis_houses: [7, 5], element_preference: ['fire', 'earth'] },
};

const BASE_TRIAD = ['--sun', 'Scorpio', '--moon', 'Pisces', '--asc', 'Taurus'];

// ═══════════════════════════════════════════════════════════
// 真值判据函数（**同一份判据**同时服务正向断言与注入自测 —— 与实现同源、射程完整）
// ═══════════════════════════════════════════════════════════

/** 四象算子合规判据：逐值 + 闭集 + 恰 2 项 + 签名两两互异 */
function assertOperatorsCompliant(byMode) {
  const sigs = new Set();
  for (const m of MODES) {
    const ops = byMode[m];
    assert.ok(ops && typeof ops === 'object', `${m} 缺 decision_operators`);
    assert.deepEqual(ops.primary_factors, EXPECT_OPS[m].primary_factors, `${m} 主因子未闭合（D2）`);
    assert.deepEqual(ops.emphasis_houses, EXPECT_OPS[m].emphasis_houses, `${m} 重点宫位未闭合（D1）`);
    assert.deepEqual(ops.element_preference, EXPECT_OPS[m].element_preference, `${m} 元素偏好未闭合（D3）`);
    assert.equal(ops.element_preference.length, 2, `${m} 元素偏好必须恰 2 项`);
    assert.ok(ops.element_preference.every((e) => ELEMENT_DOMAIN.includes(e)),
      `${m} 元素越出闭集: ${JSON.stringify(ops.element_preference)}`);
    sigs.add(JSON.stringify([ops.primary_factors, ops.emphasis_houses, ops.element_preference]));
  }
  assert.equal(sigs.size, 4, '四象算子签名必须两两互异（同质化 ⇒ 专利实施例退化）');
}

/** 宫位微调判据：维度齐备 + 单维上限 + 强调宫位过滤 + 来源标记 */
function assertHouseModifierCompliant(prof, expectContributors) {
  const hm = prof.house_modifier;
  assert.ok(hm && typeof hm === 'object', '缺 house_modifier 快照');
  assert.deepEqual(Object.keys(hm.delta).sort(), DIMS, '增量维度不齐备');
  for (const d of DIMS) {
    assert.ok(Number.isInteger(hm.delta[d]), `${d} 增量必须为整数`);
    assert.ok(Math.abs(hm.delta[d]) <= 20, `${d} 增量越出上限 20: ${hm.delta[d]}`);
  }
  assert.deepEqual(hm.contributors, expectContributors,
    `强调宫位过滤失效: ${JSON.stringify(hm.contributors)}`);
  assert.equal(hm.source, 'natal', '有宫内星真值参与时 source 必须为 natal');
}

const ZERO_DELTA = { talkative: 0, clingy: 0, moody: 0, sarcastic: 0, healing: 0 };

/** 缺真值零回归判据：不得有任何微调痕迹（B2 ① 与 D7 共用同一份判据） */
function assertZeroModifierWhenNoTruth(prof) {
  assert.deepEqual(prof.house_modifier.delta, ZERO_DELTA, '缺真值时增量必须全 0');
  assert.equal(prof.house_modifier.source, 'none', '缺真值时 source 必须 none');
  assert.deepEqual(prof.house_modifier.contributors, [], '缺真值时来源清单必须为空');
}

/** 源码不变式：系数区间 / CAP / 牵引值域 */
function assertSourceInvariants(src) {
  const mc = src.match(/HOUSE_MODIFIER_COEFF\s*=\s*([0-9.]+)/);
  assert.ok(mc, '引擎缺 HOUSE_MODIFIER_COEFF');
  const coeff = Number(mc[1]);
  assert.ok(coeff >= 0.10 && coeff <= 0.20,
    `宫位微调系数越出军师令区间 0.10~0.20（实得 ${coeff}）`);
  const mcap = src.match(/HOUSE_MODIFIER_CAP\s*=\s*([0-9]+)/);
  assert.ok(mcap, '引擎缺 HOUSE_MODIFIER_CAP');
  const cap = Number(mcap[1]);
  assert.ok(cap > 0 && cap <= 25, `宫位微调上限异常: ${cap}`);

  const pullStart = src.indexOf('PLANET_DIM_PULL: Dict');
  const pullEnd = src.indexOf('_PULL_DOMAIN', pullStart);
  assert.ok(pullStart !== -1 && pullEnd > pullStart, '未解析到 PLANET_DIM_PULL 表');
  const pullBlock = src.slice(pullStart, pullEnd);
  const ALLOWED = [1, 0.5, -0.5, -1, 0];
  const nums = [...pullBlock.matchAll(/[-+]?\d+(?:\.\d+)?/g)]
    .map((x) => Number(x[0]))
    .filter((n) => !Number.isInteger(n));
  assert.ok(nums.length > 0, 'PLANET_DIM_PULL 未解析到牵引值（解析器漂移？）');
  for (const n of nums) {
    assert.ok(ALLOWED.includes(n), `PLANET_DIM_PULL 出现闭集外牵引值 ${n}（只允许 0 / ±0.5 / ±1）`);
  }
}

// ── 真实 CLI（familiar_engine 纯函数，无 swisseph 依赖 ⇒ 裸 python3 即可）──
function cliJson(args, scriptAbs) {
  const script = scriptAbs || path.join(ROOT, 'astro', 'familiar_engine.py');
  const out = execFileSync('python3', [script, '--mode', 'profile', ...args], {
    cwd: ROOT, encoding: 'utf8', timeout: 30000,
  });
  return JSON.parse(out);
}
const profileOf = (m) => cliJson([...BASE_TRIAD, '--relation-mode', m]);

/** 用**改写后的源码**跑真实引擎（注入自测用；落在临时目录，不污染仓） */
function runMutated(src, args) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e38-inject-'));
  const f = path.join(dir, 'familiar_engine.py');
  fs.writeFileSync(f, src, 'utf8');
  try {
    return cliJson(args, f);
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
  }
}

// ═══════════════════════════════════════════════════════════
// A. 源码级：算子精准化（独立解析 + 字面量正面证据）
// ═══════════════════════════════════════════════════════════

const OPS_START = ENGINE_SRC.indexOf('RELATION_DECISION_OPERATORS = {');
const OPS_END = ENGINE_SRC.indexOf('\n}\n', OPS_START);
const OPS_BLOCK = ENGINE_SRC.slice(OPS_START, OPS_END === -1 ? OPS_START + 4000 : OPS_END);

function parseModeBlock(block, mode) {
  const i = block.indexOf(`    '${mode}': {`);
  assert.notEqual(i, -1, `源码未解析到 ${mode} 块`);
  const j = block.indexOf('\n    },', i);
  return block.slice(i, j === -1 ? i + 600 : j);
}
function parsePyList(seg, key) {
  const m = seg.match(new RegExp(`'${key}':\\s*\\[([^\\]]*)\\]`));
  assert.ok(m, `未解析到 ${key} 列表`);
  return m[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter((s) => s.length > 0);
}
function sourceOpsOf(block) {
  const out = {};
  for (const m of MODES) {
    const seg = parseModeBlock(block, m);
    out[m] = {
      primary_factors: parsePyList(seg, 'primary_factors'),
      emphasis_houses: parsePyList(seg, 'emphasis_houses').map(Number),
      element_preference: parsePyList(seg, 'element_preference'),
    };
  }
  return out;
}

test('A1 唯一真源算子表四象合规（独立解析 Python 块后逐值核验）', () => {
  assert.notEqual(OPS_START, -1, 'engine 缺 RELATION_DECISION_OPERATORS 唯一真源');
  assert.notEqual(OPS_END, -1, '未解析到算子表收尾（结构被改？）');
  assertOperatorsCompliant(sourceOpsOf(OPS_BLOCK));
});

test('A2 三裁字面量落盘（正面证据 · 防解析器漂移的二次取证）', () => {
  const flat = OPS_BLOCK.replace(/\s/g, '');
  assert.ok(flat.includes("'emphasis_houses':[7,5]"), 'D1（女友补第 5 宫）未落盘');
  assert.ok(flat.includes("'primary_factors':['sun','jupiter','venus']"), 'D2（男友补金星）未落盘');
  for (const m of MODES) {
    const lit = `'element_preference':[${EXPECT_OPS[m].element_preference.map((e) => `'${e}'`).join(',')}]`;
    assert.ok(flat.includes(lit), `${m} 的 D3 元素偏好未落盘: ${lit}`);
  }
});

test('A3 元素偏好闭集不变式（定义 + 被调用 + 闭集常量齐备）', () => {
  assert.ok(ENGINE_SRC.includes('ELEMENT_PREFERENCE_DOMAIN'), '缺元素偏好闭集常量');
  assert.ok(ENGINE_SRC.includes('def _assert_element_preference_invariants'),
    '缺元素偏好不变式函数');
  assert.ok(ENGINE_SRC.includes('_assert_element_preference_invariants()'),
    '元素偏好不变式定义了却未被调用 ⇒ 形同虚设');
});

test('A4 宫位微调层常量不变式（系数区间 / CAP / 牵引值域闭集）', () => {
  assert.ok(ENGINE_SRC.includes('def house_modifier_delta'), '缺宫位微调纯函数');
  assertSourceInvariants(ENGINE_SRC);
});

// ═══════════════════════════════════════════════════════════
// B. 行为级：真实 CLI 出参
// ═══════════════════════════════════════════════════════════

test('B1 四象 decision_operators 真实出参合规（含 element_preference 快照）', () => {
  const byMode = {};
  for (const m of MODES) byMode[m] = profileOf(m).decision_operators;
  assertOperatorsCompliant(byMode);
});

test('B2 house_modifier 两态：缺真值恒 0（零回归）／有真值按强调宫位微调', () => {
  // ① 缺宫内星真值 ⇒ 增量恒 0、source=none，且人格与「无参调用」逐值一致（L1 零回归）
  const noTruth = profileOf('girlfriend');
  assertZeroModifierWhenNoTruth(noTruth);

  // ② 有真值 ⇒ 仅「女友算子强调的 7/5 宫」内行星参与（Saturn@H12 必须被过滤）
  const withTruth = cliJson([...BASE_TRIAD, '--relation-mode', 'girlfriend',
    '--planet-houses', JSON.stringify({ Venus: 7, Moon: 5, Saturn: 12 })]);
  assertHouseModifierCompliant(withTruth, ['Moon@H5', 'Venus@H7']);
  assert.ok(withTruth.house_modifier.delta.clingy > 0, '金星入 7 宫应提升黏人度');
  assert.ok(withTruth.house_modifier.delta.healing > 0, '金/月入 7/5 宫应提升治愈度');
  assert.notDeepEqual(withTruth.personality, noTruth.personality, '有真值时人格必须可见变化');

  // ③ 换关系模式 ⇒ 强调宫位随算子切换（哥们儿 = 11/3 宫）
  const buddy = cliJson([...BASE_TRIAD, '--relation-mode', 'buddy',
    '--planet-houses', JSON.stringify({ Venus: 7, Moon: 11, Sun: 3 })]);
  assert.deepEqual(buddy.house_modifier.contributors, ['Moon@H11', 'Sun@H3'],
    `哥们儿强调宫位应为 11/3，实得 ${JSON.stringify(buddy.house_modifier.contributors)}`);
});

test('B3 house_modifier 幂等 / 上限截断 / 非法值静默跳过（绝不伪造）', () => {
  const A = { Venus: 7, Moon: 5, Saturn: 12 };
  const p1 = cliJson([...BASE_TRIAD, '--relation-mode', 'girlfriend', '--planet-houses', JSON.stringify(A)]);
  const p2 = cliJson([...BASE_TRIAD, '--relation-mode', 'girlfriend', '--planet-houses', JSON.stringify(A)]);
  assert.deepEqual(p1.house_modifier, p2.house_modifier, '宫位微调必须幂等');

  // 上限：十星全挤进 7 宫，单维仍不得越界
  const all = {};
  for (const pl of ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']) all[pl] = 7;
  const cap = cliJson([...BASE_TRIAD, '--relation-mode', 'girlfriend', '--planet-houses', JSON.stringify(all)]);
  for (const d of DIMS) assert.ok(Math.abs(cap.house_modifier.delta[d]) <= 20, `${d} 越出 CAP`);

  // 非法值（非数字宫位 / null / 非字符串行星名）⇒ 静默跳过 ⇒ 零微调
  const bad = cliJson([...BASE_TRIAD, '--relation-mode', 'girlfriend',
    '--planet-houses', JSON.stringify({ Venus: 'H7', Moon: null, 99: 5 })]);
  assert.equal(bad.house_modifier.source, 'none', '非法值不得被当成真值参与微调');

  // 非法 JSON ⇒ 退出码 2（绝不静默忽略成「零微调假档案」）
  let code = 0;
  try {
    execFileSync('python3', [path.join(ROOT, 'astro', 'familiar_engine.py'), '--sun', 'Scorpio', '--planet-houses', '{bad'],
      { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) { code = Number(e.status); }
  assert.equal(code, 2, `非法 --planet-houses 应以退出码 2 fail-closed，实得 ${code}`);
});

// ═══════════════════════════════════════════════════════════
// C. 链路级：server → client → engine 宫内星真值贯通
// ═══════════════════════════════════════════════════════════

test('C1 v69_client 真值提取：extractPlanetHouses 存在且 triad 携带 planetHouses', () => {
  assert.ok(CLIENT_SRC.includes('export function extractPlanetHouses'), '缺宫内星真值提取函数');
  assert.ok(CLIENT_SRC.includes('planetHouses: extractPlanetHouses(ch)'),
    'extractNatalTriad 未回传 planetHouses（链路断点）');
  // 只认 computed_houses（本命实算）—— 不得另起一套推断
  assert.ok(CLIENT_SRC.includes('meta.computed_houses'), '未复用 computed_houses 唯一真值通路');
  // 空对象 ⇒ 不传参（等价「不参与」，避免把 {} 当信号）
  assert.ok(CLIENT_SRC.includes('Object.keys(planetHouses).length > 0'),
    '应仅在有条目时才传 --planet-houses');
});

test('C2 server.js /api/familiar/adopt 透传宫内星真值', () => {
  assert.ok(SERVER_SRC.includes('planetHouses: triad.planetHouses'),
    '灵宠端点未透传 planetHouses（E38-A 链路断点）');
  const idx = SERVER_SRC.indexOf("app.post('/api/familiar/adopt'");
  assert.notEqual(idx, -1, '未找到灵宠领养端点');
});

test('C3 端到端：getFamiliarProfile 真实 spawn 引擎并回传宫位微调', async () => {
  const client = await import(path.join(ROOT, 'v69_client.js'));
  // ① 有真值
  const p = await client.getFamiliarProfile({
    sunSign: 'Scorpio', moonSign: 'Pisces', ascSign: 'Taurus',
    relationMode: 'girlfriend',
    planetHouses: { Venus: 7, Moon: 5, Saturn: 12 },
  });
  assertHouseModifierCompliant(p, ['Moon@H5', 'Venus@H7']);
  assert.deepEqual(p.decision_operators.element_preference, ['water', 'earth']);

  // ② 空对象 ⇒ 不传参 ⇒ 零微调（且人格与「不传」逐值一致）
  const empty = await client.getFamiliarProfile({
    sunSign: 'Scorpio', moonSign: 'Pisces', ascSign: 'Taurus',
    relationMode: 'girlfriend', planetHouses: {},
  });
  const none = await client.getFamiliarProfile({
    sunSign: 'Scorpio', moonSign: 'Pisces', ascSign: 'Taurus', relationMode: 'girlfriend',
  });
  assert.equal(empty.house_modifier.source, 'none', '空真值对象必须退化为零微调');
  assert.deepEqual(empty.personality, none.personality, '空真值对象不得改变人格');

  // ③ extractPlanetHouses 单元行为（缺真值 / 非法宫位）
  assert.deepEqual(client.extractPlanetHouses(null), {});
  assert.deepEqual(client.extractPlanetHouses({ Sun: { house: 4 }, Moon: { house: 0 }, Venus: {} }),
    { Sun: 4 }, '非法/越界宫位必须丢弃（绝不伪造）');
});

// ═══════════════════════════════════════════════════════════
// D. 注入级：改回旧口径 / 同质化 / 越界 ⇒ 判据必须变红
// ═══════════════════════════════════════════════════════════

test('D1 注入：女友 emphasis_houses 改回 [7] ⇒ 四象合规判据必红', () => {
  const broken = ENGINE_SRC.replace("'emphasis_houses': [7, 5],", "'emphasis_houses': [7],");
  assert.notEqual(broken, ENGINE_SRC, '注入未生效（D1 锚点漂移？）');
  const byMode = {};
  for (const m of MODES) byMode[m] = runMutated(broken, [...BASE_TRIAD, '--relation-mode', m]).decision_operators;
  assert.throws(() => assertOperatorsCompliant(byMode), '判据失效: 女友丢第 5 宫未被识别');
});

test('D2 注入：男友 primary_factors 去掉 venus ⇒ 四象合规判据必红', () => {
  const broken = ENGINE_SRC.replace("'primary_factors': ['sun', 'jupiter', 'venus'],",
    "'primary_factors': ['sun', 'jupiter'],");
  assert.notEqual(broken, ENGINE_SRC, '注入未生效（D2 锚点漂移？）');
  const byMode = {};
  for (const m of MODES) byMode[m] = runMutated(broken, [...BASE_TRIAD, '--relation-mode', m]).decision_operators;
  assert.throws(() => assertOperatorsCompliant(byMode), '判据失效: 男友丢金星未被识别');
});

test('D3 注入：闺蜜元素偏好同质化为 water/earth ⇒ 双层必拦（引擎不变式 + 闸门互异判据）', () => {
  const broken = ENGINE_SRC.replace("'element_preference': ['air', 'water'],",
    "'element_preference': ['water', 'earth'],");
  assert.notEqual(broken, ENGINE_SRC, '注入未生效（D3 锚点漂移？）');
  // 第一层：引擎模块级不变式（四象两两互异）应在导入期 fail-fast
  assert.throws(() => runMutated(broken, [...BASE_TRIAD, '--relation-mode', 'bestie']),
    '元素偏好同质化未被引擎不变式拦下');
  // 第二层：闸门判据本身也必须咬住「同质化」（合成真值，直接验判据射程）
  const okay = {};
  for (const m of MODES) okay[m] = profileOf(m).decision_operators;
  okay.bestie = { ...okay.bestie, element_preference: ['water', 'earth'] };
  assert.throws(() => assertOperatorsCompliant(okay), '闸门互异判据失效: 同质化未被识别');
});

test('D4 注入：HOUSE_MODIFIER_COEFF 越界 0.90 ⇒ 源码不变式必红', () => {
  const broken = ENGINE_SRC.replace('HOUSE_MODIFIER_COEFF = 0.15', 'HOUSE_MODIFIER_COEFF = 0.90');
  assert.notEqual(broken, ENGINE_SRC, '注入未生效（系数锚点漂移？）');
  assert.throws(() => assertSourceInvariants(broken), '判据失效: 越界系数未被识别');
});

test('D5 注入：牵引值 1.0 改为 0.7 ⇒ 值域闭集判据必红', () => {
  const broken = ENGINE_SRC.replace("'Sun':     {'talkative': +1.0,", "'Sun':     {'talkative': +0.7,");
  assert.notEqual(broken, ENGINE_SRC, '注入未生效（牵引值锚点漂移？）');
  assert.throws(() => assertSourceInvariants(broken), '判据失效: 闭集外牵引值未被识别');
});

test('D6 注入：拆掉「非强调宫位过滤」⇒ 宫位微调行为判据必红', () => {
  const broken = ENGINE_SRC.replace('        if h not in _emph:\n            continue',
    '        if False:\n            continue');
  assert.notEqual(broken, ENGINE_SRC, '注入未生效（过滤锚点漂移？）');
  const prof = runMutated(broken, [...BASE_TRIAD, '--relation-mode', 'girlfriend',
    '--planet-houses', JSON.stringify({ Venus: 7, Moon: 5, Saturn: 12 })]);
  assert.throws(() => assertHouseModifierCompliant(prof, ['Moon@H5', 'Venus@H7']),
    '判据失效: 非强调宫位行星混入未被识别');
});

test('D7 注入：缺真值守卫被破坏（planet_houses 缺省仍参与）⇒ 零回归判据必红', () => {
  // 把「缺省 ⇒ 返回全 0」改成「缺省 ⇒ 用一颗假星参与」，看 B2 ① 的零回归断言是否咬住
  const broken = ENGINE_SRC.replace(
    '    if not planet_houses or not isinstance(planet_houses, dict):\n        return delta, []',
    "    if not planet_houses or not isinstance(planet_houses, dict):\n        planet_houses = {'Venus': 7}");
  assert.notEqual(broken, ENGINE_SRC, '注入未生效（守卫锚点漂移？）');
  const prof = runMutated(broken, [...BASE_TRIAD, '--relation-mode', 'girlfriend']);
  assert.throws(() => assertZeroModifierWhenNoTruth(prof),
    '判据失效: 缺真值却仍参与微调（零回归防线被突破）');
});
