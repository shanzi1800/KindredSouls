/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐾 E38 闸门：合婚双盘真值与反向合盘实体化（第 18 道防线）
 *   第一期「E38-A 四象算子精准化 + 宫位微调层」
 *   第二期「E38-B 黄经真值贯通 + E38-C 相位张量 + E38-D 反向拟合闭环」
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（2026-10-09 军师《E38 合婚双盘真值与反向合盘实体化》开工令 · 三裁全准）：
 *   ① D1/D2/D3 三处口径差异闭合 —— 唯一真源 `RELATION_DECISION_OPERATORS` 精准化；
 *   ② 灵宠人格 5 维引入 `emphasis_houses` 微调（House Modifier，纯函数 0.10~0.20）；
 *   ③ 宫内星真值通路复用（`computed_houses` → 引擎），缺真值**零微调**，绝不伪造。
 * 第二期（军师三阶段）：① 黄经真值贯通（`planet_longitudes` → 合婚引擎）
 *   ② 双盘 Synastry 相位张量（Conj/Sxt/Sqr/Tri/Opp）③ 反向拟合实体化 ⇒ Virtual Natal Chart。
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

// ═══════════════════════════════════════════════════════════════════════════
// ═══ 第二期：E38-B 黄经真值贯通 + E38-C 相位张量 + E38-D 反向拟合闭环 ═══
// ═══════════════════════════════════════════════════════════════════════════

const SYN_SRC = read('astro/synastry_engine.py');
const MATRIX_SRC = read('astro/astro_matrix.py');
const SYN_PATH = path.join(ROOT, 'astro', 'synastry_engine.py');
const FAMILIAR_PATH = path.join(ROOT, 'astro', 'familiar_engine.py');

// 真实本命十星绝对黄经（1990-08-05 14:30 @ 13.75N,100.5E Asia/Bangkok · SwissEph 实算）
const SY_SAMPLE = {
  Sun: 132.6353, Moon: 297.4658, Mercury: 159.148, Venus: 109.5248, Mars: 45.3241,
  Jupiter: 117.1864, Saturn: 290.4838, Uranus: 276.2446, Neptune: 282.4049, Pluto: 224.9988,
};

// ── 独立几何真源（**与引擎各写一份**，互为独立判据；否则同源=自证自洽）──
const SY_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SY_ELEMENTS = ['fire', 'earth', 'air', 'water'];
const SY_SWAP2 = { fire: 'air', air: 'fire', earth: 'water', water: 'earth' };
const SY_HARMONIOUS = ['conjunction', 'sextile', 'trine'];
const syIdx = (lon) => Math.floor((((lon % 360) + 360) % 360) / 30) % 12;
const sySignOf = (lon) => SY_SIGNS[syIdx(lon)];
const syElemOf = (lon) => SY_ELEMENTS[syIdx(lon) % 4];
const syReachable = (elem) => [elem, SY_SWAP2[elem]].sort();

/**
 * 合婚结果合规判据（**同一份判据**服务正向断言与注入自测）。
 * ① 闭合校验必须通过且预测相位零缺失；② 拟合**只采信调和相**；
 * ③ 虚拟星元素必落在锚的「调和可达集」内；④ 偏好调和可达时必被采纳；
 * ⑤ 快照（signs/elements/longitudes/assignments）互相一致。
 */
function assertSynastryCompliant(res) {
  assert.ok(res && typeof res === 'object', '缺合婚结果');
  assert.ok(res.closure && res.closure.ok === true, `闭合校验未通过: ${JSON.stringify(res.closure)}`);
  assert.deepEqual(res.closure.missing, [], '预测相位未被独立复现（闭合失败）');
  assert.ok(res.tensor && res.tensor.total > 0, '相位张量为空');
  const vc = res.virtual_chart;
  assert.ok(vc && vc.longitudes && Object.keys(vc.longitudes).length === 10, '虚拟星盘不齐备');
  assert.deepEqual(vc.dropped, [], '真值齐备时不得有缺星');
  const pref = res.decision_operators.element_preference;
  for (const a of res.fit_assignments) {
    assert.ok(SY_HARMONIOUS.includes(a.aspect), `${a.planet} 采信了非调和相 ${a.aspect}（调和优先被破坏）`);
    const anchorLon = res.user_longitudes[a.anchor];
    assert.equal(typeof anchorLon, 'number', `锚 ${a.anchor} 缺黄经真值`);
    const reach = syReachable(syElemOf(anchorLon));
    assert.ok(reach.includes(a.element),
      `${a.planet} 结果元素 ${a.element} 越出调和可达集 ${JSON.stringify(reach)}（疑似硬相凑元素）`);
    if (pref.some((e) => reach.includes(e))) {
      assert.ok(pref.includes(a.element), `${a.planet} 偏好 ${JSON.stringify(pref)} 可达却未被采纳`);
    }
    assert.equal(a.element, syElemOf(a.longitude), `${a.planet} element 快照与黄经不一致`);
    assert.equal(a.longitude, vc.longitudes[a.planet], `${a.planet} 分配黄经与虚拟盘不一致`);
  }
  for (const [p, lon] of Object.entries(vc.longitudes)) {
    assert.equal(vc.elements[p], syElemOf(lon), `虚拟盘 ${p} element 快照漂移`);
    assert.equal(vc.signs[p], sySignOf(lon), `虚拟盘 ${p} sign 快照漂移`);
  }
}

/** 合婚源码不变式：唯一真源复用（禁第二份算子表）+ 调和优先的结构性保证 */
function assertSourceSynastryInvariants(src) {
  // ① 唯一真源：只**导入** familiar_engine.RELATION_DECISION_OPERATORS，禁复制第二份字面量
  assert.ok(src.includes('from familiar_engine import'), '未复用 familiar_engine 唯一真源');
  assert.ok(/RELATION_DECISION_OPERATORS/.test(src), '未引用唯一真源算子表');
  assert.ok(!/^RELATION_DECISION_OPERATORS\s*[:=]/m.test(src),
    '出现第二份 RELATION_DECISION_OPERATORS 字面量（复制=漂移=专利实施例证据链污染）');
  // ② 元素几何真源
  assert.ok(src.includes('ELEMENT_SWAP2'), '缺元素互换对真源');
  assert.ok(src.includes('def harmonious_element_reachable'), '缺调和可达性纯函数');
  // ③ 调和优先的**结构性**保证：硬相权重 × 元素加成 必须小于合相权重
  const blk = src.slice(src.indexOf('ASPECT_FIT_WEIGHT'), src.indexOf('}', src.indexOf('ASPECT_FIT_WEIGHT')) + 1);
  const w = (k) => { const m = blk.match(new RegExp(`'${k}':\\s*([0-9.]+)`)); return m ? Number(m[1]) : NaN; };
  const bonusM = src.match(/ELEMENT_BONUS\s*=\s*([0-9.]+)/);
  assert.ok(bonusM, '缺 ELEMENT_BONUS');
  const bonus = Number(bonusM[1]);
  assert.ok(bonus >= 1.0, `元素加成不得低于 1.0（实得 ${bonus}）`);
  for (const k of ['conjunction', 'trine', 'sextile']) {
    assert.ok(Number.isFinite(w(k)) && w(k) > 0, `ASPECT_FIT_WEIGHT.${k} 解析失败`);
  }
  for (const k of ['square', 'opposition']) {
    assert.ok(Number.isFinite(w(k)), `ASPECT_FIT_WEIGHT.${k} 解析失败`);
    assert.ok(w(k) * bonus < w('conjunction'),
      `硬相 ${k} 权重 ${w(k)} × 加成 ${bonus} 不小于合相权重 ⇒ 「拟合只用调和相」不再结构性成立`);
  }
  assert.ok(src.includes('CLOSURE_MIN_HARMONIOUS'), '缺闭合校验调和相下界常量');
}

// ── 真实 CLI（synastry 纯函数，无 swisseph 依赖 ⇒ 裸 python3 即可）──
function synCli(args, scriptAbs) {
  const out = execFileSync('python3', [scriptAbs || SYN_PATH, ...args],
    { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
  return JSON.parse(out);
}
const synOf = (mode, lons) => synCli(
  ['--mode', 'synergy', '--relation-mode', mode, '--natal-longitudes', JSON.stringify(lons || SY_SAMPLE)]);

/** 用**改写后的源码**跑真实合婚引擎（注入自测用；连同真源一起落在临时目录，不污染仓） */
function runMutatedSynastry(src, args) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e38-syn-inject-'));
  fs.copyFileSync(FAMILIAR_PATH, path.join(dir, 'familiar_engine.py'));
  fs.writeFileSync(path.join(dir, 'synastry_engine.py'), src, 'utf8');
  try {
    return synCli(args, path.join(dir, 'synastry_engine.py'));
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
  }
}
function synExitCode(args, scriptAbs) {
  try {
    execFileSync('python3', [scriptAbs || SYN_PATH, ...args], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    return 0;
  } catch (e) { return Number(e.status); }
}

/** 以指定脚本为入口的退出码运行器（正向用真脚本，注入用变异脚本副本） */
function synRunner(scriptAbs) {
  return (args) => synExitCode(args, scriptAbs);
}

/** 真值纪律 fail-closed 判据（**同一份判据**服务正向断言与注入自测） */
function assertTruthGuardedSynastry(run) {
  const c1 = run(['--mode', 'synergy', '--natal-longitudes', '{}']);
  assert.equal(c1, 2, `空黄经必须退出码 2 fail-closed（实得 ${c1} ⇒ 伪造虚拟星盘）`);
  const c2 = run(['--mode', 'synergy', '--natal-longitudes', '{"Nibiru":1}']);
  assert.equal(c2, 2, `闭集外行星必须退出码 2（实得 ${c2}）`);
  const c3 = run(['--mode', 'synergy', '--relation-mode', 'pet', '--natal-longitudes', JSON.stringify(SY_SAMPLE)]);
  assert.equal(c3, 2, `非法 relation_mode 必须退出码 2（实得 ${c3}）`);
}

// ═══════════════════════════════════════════════════════════
// E. E38-C/D 源码级：唯一真源复用 + 调和优先结构性不变式
// ═══════════════════════════════════════════════════════════

test('E1 合婚引擎存在且源码不变式成立（禁第二份算子表 / 调和优先结构性成立）', () => {
  assert.ok(SYN_SRC.includes('def reverse_synergy'), '缺反向拟合主入口');
  assert.ok(SYN_SRC.includes('def compute_synastry_tensor'), '缺相位张量测量函数');
  assert.ok(SYN_SRC.includes('def fit_virtual_chart'), '缺虚拟星盘拟合函数');
  assert.ok(SYN_SRC.includes('def verify_closure'), '缺闭合校验函数');
  assertSourceSynastryInvariants(SYN_SRC);
});

test('E2 五相闭集与退出码契约落盘（Conj/Sxt/Sqr/Tri/Opp + 0/2/1）', () => {
  for (const a of ['conjunction', 'sextile', 'square', 'trine', 'opposition']) {
    assert.ok(SYN_SRC.includes(`'${a}'`), `相位闭集缺 ${a}`);
  }
  assert.ok(SYN_SRC.includes('SynastryInputError'), '缺输入非法异常类型');
  assert.ok(/return 2/.test(SYN_SRC), '缺输入非法退出码 2（fail-closed）');
  // 无参数运行 = 引擎自测（与 familiar_engine 同形态）
  assert.ok(SYN_SRC.includes('_self_test()'), '缺引擎自测入口');
});

test('E3 引擎自测真实通过（相位闭集/真值纪律/反向拟合/闭合/算子实体化）', () => {
  const out = execFileSync('python3', [SYN_PATH], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
  assert.ok(out.includes('全部自测通过'), `引擎自测未通过:\n${out.slice(-600)}`);
});

// ═══════════════════════════════════════════════════════════
// F. E38-B/C/D 行为级：真实 CLI 出参
// ═══════════════════════════════════════════════════════════

test('F1 四象反向拟合真实出参合规（闭合 + 调和可达 + 偏好采纳）', () => {
  for (const m of MODES) assertSynastryCompliant(synOf(m));
});

test('F2 四象虚拟星盘互异 + 调和分隔离（算子实体化非空转）', () => {
  const lons = {};
  const scores = {};
  for (const m of MODES) {
    const r = synOf(m);
    lons[m] = JSON.stringify(r.virtual_chart.longitudes);
    scores[m] = r.harmony.score;
  }
  assert.equal(new Set(Object.values(lons)).size, 4, '四象必须拟合出互异虚拟星盘');
  assert.equal(new Set(Object.values(scores)).size, 4, `四象调和分未隔离: ${JSON.stringify(scores)}`);
});

test('F3 幂等 + 真值纪律 fail-closed（缺/非法黄经 ⇒ 退出码 2，绝不伪造）', () => {
  assert.deepEqual(synOf('girlfriend'), synOf('girlfriend'), '反向拟合必须幂等');
  assertTruthGuardedSynastry(synRunner(SYN_PATH));
  assert.equal(synExitCode(['--mode', 'synergy']), 2, '缺 --natal-longitudes 必须退出码 2');
  assert.equal(synExitCode(['--mode', 'synergy', '--natal-longitudes', '{bad']), 2, '非法 JSON 必须退出码 2');
});

// ═══════════════════════════════════════════════════════════
// G. E38-B 链路级：astro_matrix → v69_client → 合婚引擎 黄经真值贯通
// ═══════════════════════════════════════════════════════════

test('G1 astro_matrix.py 本命出参新增 planet_longitudes（[0,360) 绝对黄经）', () => {
  assert.ok(MATRIX_SRC.includes("'planet_longitudes': planet_longitudes"),
    '本命出参未携带 planet_longitudes（E38-B 链路断点）');
  assert.ok(/planet_longitudes\[name\] = round\(deg % 360\.0, 4\)/.test(MATRIX_SRC),
    '黄经必须直取 SwissEph deg 归一化（不得由 sign+degree 反算）');
});

test('G2 v69_client 真值提取与合并（禁前端反算）', () => {
  assert.ok(CLIENT_SRC.includes('export function extractPlanetLongitudes'), '缺黄经真值提取函数');
  assert.ok(CLIENT_SRC.includes('planetLongitudes: extractPlanetLongitudes(meta.planet_longitudes)'),
    'extractNatalTriad 未回传 planetLongitudes（链路断点）');
  assert.ok(CLIENT_SRC.includes('matrix.meta.planet_longitudes = natalData.planet_longitudes'),
    '未把引擎实算黄经合并进 meta（唯一真值通路）');
  assert.ok(CLIENT_SRC.includes('export async function getSynastryProfile'), '缺合婚引擎调用封装');
});

test('G3 server.js 合婚端点透传黄经真值（预留 · 只读不落库）', () => {
  assert.ok(SERVER_SRC.includes("app.post('/api/synastry/reverse-fit'"), '未预留合婚端点');
  assert.ok(SERVER_SRC.includes('planetLongitudes: triad2.planetLongitudes'),
    '合婚端点未透传黄经真值（E38-B 链路断点）');
  assert.ok(SERVER_SRC.includes('getSynastryProfile'), '合婚端点未调用引擎封装');
});

test('G4 端到端：真实本命盘（SwissEph）→ 黄经 → 合婚引擎回传闭合虚拟星盘', async () => {
  const client = await import(path.join(ROOT, 'v69_client.js'));
  // 单元：黄经提取（闭集过滤 / 非有限数丢弃 / 400 归一化）
  assert.deepEqual(client.extractPlanetLongitudes(null), {});
  assert.deepEqual(client.extractPlanetLongitudes({ Sun: 400, Nibiru: 10, Moon: 'x', Venus: 90 }),
    { Sun: 40, Venus: 90 }, '非法条目必须丢弃、越界必须归一化（绝不伪造）');
  // 端到端：真实 spawn 引擎
  const r = await client.getSynastryProfile({ planetLongitudes: SY_SAMPLE, relationMode: 'girlfriend' });
  assertSynastryCompliant(r);
  assert.deepEqual(r.decision_operators.element_preference, ['water', 'earth']);
  // 空真值 ⇒ 引擎 fail-closed 上抛（绝不返回伪造虚拟星盘）
  await assert.rejects(() => client.getSynastryProfile({ planetLongitudes: {}, relationMode: 'girlfriend' }),
    (e) => e && e.code === 'SYNASTRY_INVALID_INPUT');
});

// ═══════════════════════════════════════════════════════════
// H. 注入级：破坏调和优先 / 偏好参与 / 闭合 / 真值纪律 / 唯一真源 ⇒ 必红
// ═══════════════════════════════════════════════════════════

test('H1 注入：square 权重抬到 5.0 ⇒ 硬相凑元素，行为判据 + 源码不变式双双必红', () => {
  const broken = SYN_SRC.replace("'square':      0.35,", "'square':      5.00,");
  assert.notEqual(broken, SYN_SRC, '注入未生效（square 权重锚点漂移？）');
  assert.throws(() => assertSourceSynastryInvariants(broken), '源码不变式失效: 硬相权重越界未被识别');
  assert.throws(() => assertSynastryCompliant(runMutatedSynastry(broken,
    ['--mode', 'synergy', '--relation-mode', 'boyfriend', '--natal-longitudes', JSON.stringify(SY_SAMPLE)])),
    '行为判据失效: 拟合采信硬相未被识别');
});

test('H2 注入：ELEMENT_BONUS 抹平为 1.0 ⇒ 元素偏好空转，判据必红', () => {
  const broken = SYN_SRC.replace('ELEMENT_BONUS = 1.60', 'ELEMENT_BONUS = 1.00');
  assert.notEqual(broken, SYN_SRC, '注入未生效（元素加成锚点漂移？）');
  assert.throws(() => assertSynastryCompliant(runMutatedSynastry(broken,
    ['--mode', 'synergy', '--relation-mode', 'boyfriend', '--natal-longitudes', JSON.stringify(SY_SAMPLE)])),
    '判据失效: 偏好调和可达却未被采纳（元素偏好空转未被识别）');
});

test('H3 注入：闭合校验预测三元组序对调 ⇒ 闭合判据必红（自证自洽防线）', () => {
  const broken = SYN_SRC.replace(
    "predicted = [(a['anchor'], a['planet'], a['aspect']) for a in assignments]",
    "predicted = [(a['planet'], a['anchor'], a['aspect']) for a in assignments]");
  assert.notEqual(broken, SYN_SRC, '注入未生效（闭合预测序锚点漂移？）');
  assert.throws(() => assertSynastryCompliant(runMutatedSynastry(broken,
    ['--mode', 'synergy', '--relation-mode', 'girlfriend', '--natal-longitudes', JSON.stringify(SY_SAMPLE)])),
    '判据失效: 闭合缺失未被识别（假绿）');
});

test('H4 注入：真值守卫被拆（空黄经 ⇒ 伪造一颗星）⇒ fail-closed 判据必红', () => {
  const broken = SYN_SRC.replace(
    "    lons = normalize_longitudes(raw)\n    if not lons:",
    "    lons = normalize_longitudes(raw)\n    if not lons:\n        return {'Sun': 0.0}\n    if False:");
  assert.notEqual(broken, SYN_SRC, '注入未生效（真值守卫锚点漂移？）');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e38-syn-inject-'));
  fs.copyFileSync(FAMILIAR_PATH, path.join(dir, 'familiar_engine.py'));
  fs.writeFileSync(path.join(dir, 'synastry_engine.py'), broken, 'utf8');
  try {
    const run = synRunner(path.join(dir, 'synastry_engine.py'));
    // 正向：注入后引擎对空真值不再 fail-closed（改出假绿）
    assert.equal(run(['--mode', 'synergy', '--natal-longitudes', '{}']), 0,
      '注入未生效: 空黄经仍被拒绝');
    // 判据必须咬住这个假绿
    assert.throws(() => assertTruthGuardedSynastry(run),
      '判据失效: 空黄经伪装成成功未被识别（fail-closed 防线被突破）');
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
  }
});

test('H5 注入：新增第二份 RELATION_DECISION_OPERATORS 字面量 ⇒ 唯一真源判据必红', () => {
  const broken = `${SYN_SRC}\n\nRELATION_DECISION_OPERATORS = {'pet': {}}\n`;
  assert.throws(() => assertSourceSynastryInvariants(broken),
    '判据失效: 第二份算子表未被识别（唯一真源被污染）');
});

