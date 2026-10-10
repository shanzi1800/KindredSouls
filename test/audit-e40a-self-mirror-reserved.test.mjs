/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🪞 E40-A 闸门：灵宠第五形态「数字自己 / 本我镜映」inert 保留层（第 20 道防线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（2026-10-10 军师《E40-A 灵宠第五形态「数字自己」底层架构与算子静默预留战役》开工令）
 *   —— 主公圣意：为高认知 / 内省型 / 自我探索与孤独创业期用户，预留
 *      「看清自己、接纳自己、与另一个自己对话」的第五形态通路。
 *
 * 四路取证（**刻意避让 13 / 16 / 18 / 19 既有射程**：不重复四象真值、两槽契约、门控阵列）：
 *   A 契约级：第五形态保留层齐备 + 军师真值 + **inert 物理隔离**（生产四表键集恒为 4）
 *   B 行为级：真实 CLI 镜像短路（虚拟盘 1:1 重合 / 0° 全合相 / 闭合 10/10 不旁路 / 别名等价）
 *   C 注入级：泄漏进生产表 / 破坏镜像投影 / 篡改保留算子真值 ⇒ 判据必红
 *   D 零回归：生产四象 fit_mode 与真值未漂移 + 生产面（SQL / server.js / 前端）零泄漏
 *   E 文档：北极星含 §4.7 / §5.2，既有 §4.4~4.6 与四协议索引零回归
 *
 * 运行：node --test test/audit-e40a-self-mirror-reserved.test.mjs
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

const ENGINE_PATH = path.join(ROOT, 'astro', 'familiar_engine.py');
const SYN_PATH = path.join(ROOT, 'astro', 'synastry_engine.py');
const ENGINE_SRC = read('astro/familiar_engine.py');
const SYN_SRC = read('astro/synastry_engine.py');
const SERVER_SRC = read('server.js');
const SQL_SRC = read('db/familiar_profiles.sql');
const SPEC_SRC = read('docs/SOUL_OS_OPEN_SPEC.md');
const PICKER_SRC = read('web/src/components/FamiliarPicker.tsx');

const MODES = ['girlfriend', 'buddy', 'bestie', 'boyfriend'];
const SELF_ALIASES = ['self', 'twin_self', 'higher_self'];
const SELF_MAIN = 'self';
const BASE_TRIAD = ['--sun', 'Scorpio', '--moon', 'Pisces', '--asc', 'Taurus'];

// 🔴 军师真值（E40-A 指令一）—— 任何漂移必须在此显式改并同步军师口径
const EXPECT_SELF_OP = {
  intent_zh: '本我镜映与觉醒自愈',
  primary_factors: ['sun', 'moon', 'ascendant'],
  emphasis_houses: [1],
  element_preference: ['identity'],
  tone: 'mirror',
};

// 真实本命十星绝对黄经（1990-08-05 14:30 @ 13.75N,100.5E Asia/Bangkok · SwissEph 实算）
const SY_SAMPLE = {
  Sun: 132.6353, Moon: 297.4658, Mercury: 159.148, Venus: 109.5248, Mars: 45.3241,
  Jupiter: 117.1864, Saturn: 290.4838, Uranus: 276.2446, Neptune: 282.4049, Pluto: 224.9988,
};

// ── 真实 CLI 运行器（两引擎均无 swisseph 依赖 ⇒ 裸 python3 即可）──
function cliJson(args, scriptAbs) {
  const out = execFileSync('python3', [scriptAbs || ENGINE_PATH, ...args],
    { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
  return JSON.parse(out);
}
function synCli(args, scriptAbs) {
  const out = execFileSync('python3', [scriptAbs || SYN_PATH, ...args],
    { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
  return JSON.parse(out);
}
function exitCode(args, scriptAbs) {
  try {
    execFileSync('python3', [scriptAbs || SYN_PATH, ...args],
      { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 30000 });
    return 0;
  } catch (e) { return Number(e.status); }
}
function pyJson(code) {
  const out = execFileSync('python3', ['-c', code], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
  return JSON.parse(out);
}
/** 用改写后的引擎源码跑真实 CLI（落临时目录，不污染仓） */
function runMutatedEngine(src, args) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e40a-eng-'));
  const f = path.join(dir, 'familiar_engine.py');
  fs.writeFileSync(f, src, 'utf8');
  try { return cliJson(args, f); }
  finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ } }
}
/** 用改写后的合婚源码跑真实 CLI（真源 familiar_engine 一并落到临时目录） */
function runMutatedSynastry(src, args) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e40a-syn-'));
  fs.copyFileSync(ENGINE_PATH, path.join(dir, 'familiar_engine.py'));
  fs.writeFileSync(path.join(dir, 'synastry_engine.py'), src, 'utf8');
  try { return synCli(args, path.join(dir, 'synastry_engine.py')); }
  finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ } }
}
const synOf = (mode, lons) => synCli(
  ['--mode', 'synergy', '--relation-mode', mode, '--natal-longitudes', JSON.stringify(lons || SY_SAMPLE)]);

// ═══════════════════════════════════════════════════════════
// 真值判据（**同一份判据**同时服务正向断言与注入自测 —— 与实现同源、射程完整）
// ═══════════════════════════════════════════════════════════

/** 生产四表源码块解析：`NAME = {` ⇒ 首个 `\n}\n`（射程收窄到表体，不吃下方注释） */
function tableBlock(src, name) {
  const start = src.indexOf(`${name} = {`);
  assert.notEqual(start, -1, `未解析到 ${name}（唯一真源缺失？）`);
  const end = src.indexOf('\n}\n', start);
  assert.notEqual(end, -1, `${name} 收尾未解析到（结构被改？）`);
  return src.slice(start, end);
}

/** 🔴 A 组核心判据：第五形态 inert 物理隔离 —— 别名零泄漏进生产四表（源码级） */
function assertReservedIsolationHolds(src) {
  for (const name of ['RELATION_MODES', 'RELATION_PALETTE',
    'RELATION_DECISION_OPERATORS', 'RELATION_VOICE_MATRIX']) {
    const blk = tableBlock(src, name);
    for (const alias of SELF_ALIASES) {
      assert.ok(!blk.includes(`'${alias}'`),
        `${alias} 泄漏进生产表 ${name}（E40-A inert 隔离铁律被破 ⇒ 生产契约被破）`);
    }
  }
  assert.ok(src.includes('def _assert_self_reserved_invariants'),
    '引擎缺第五形态保留层不变式（inert 隔离无守卫）');
  assert.ok(src.includes('_assert_self_reserved_invariants()'),
    '第五形态不变式定义了却未被调用 ⇒ 形同虚设');
}

/** 🪞 B 组核心判据：镜像短路合规（虚拟盘 1:1 重合 / 0° 全合相 / 闭合不旁路） */
function assertSelfMirrorCompliant(res) {
  assert.ok(res && typeof res === 'object', '缺合婚结果');
  assert.equal(res.fit_mode, 'identity_mapping', '第五形态必须走镜像投影（fit_mode 漂移）');
  // ① 虚拟盘 ≡ 用户本命盘（逐星 1:1 重合）
  assert.deepEqual(res.virtual_chart.longitudes, res.user_longitudes,
    '虚拟盘必须与用户本命盘逐星重合（Identity Mapping 被破）');
  assert.deepEqual(res.virtual_chart.dropped, [], '真值齐备时不得缺星');
  assert.equal(res.fit_assignments.length, Object.keys(res.user_longitudes).length,
    '同命星对数量与真值星数不符');
  // ② 同命星对全为 0° 紧密合相，锚 = 自身，元素 100% 同频
  for (const a of res.fit_assignments) {
    assert.equal(a.anchor, a.planet, `${a.planet} 锚必须为自身（同源共振）`);
    assert.equal(a.aspect, 'conjunction', `${a.planet} 必须为 0° 合相，实得 ${a.aspect}`);
    assert.equal(a.longitude, res.user_longitudes[a.planet], `${a.planet} 投影黄经漂移`);
    assert.equal(a.element_preferred, true, `${a.planet} 100% 同频应恒为真`);
  }
  // ③ 闭合校验**独立生效**（不走特殊断言旁路）
  assert.equal(res.closure.ok, true, `闭合校验未通过: ${JSON.stringify(res.closure)}`);
  assert.deepEqual(res.closure.missing, [], '预测相位未被独立复现（闭合失败）');
  assert.equal(res.closure.predicted, res.closure.harmonic_predicted,
    '第五形态预测相位应全为调和相（0° 全合相）');
  // ④ 张量键契约不变 + 调和度闭环
  assert.deepEqual(Object.keys(res.tensor).sort(),
    ['aspects', 'counts', 'hard', 'harmonious', 'matrix', 'total'], '张量键契约漂移');
  assert.ok(res.tensor.total > 0, '相位张量为空');
  assert.ok(res.tensor.harmonious >= res.fit_assignments.length,
    '调和相数量应 ≥ 同命星对数（0° 全合相）');
  assert.ok(res.harmony.score > 0, '第五形态调和度应为正（闭环高分）');
  // ⑤ 算子快照 = 保留层真值
  assert.deepEqual(res.decision_operators.emphasis_houses, EXPECT_SELF_OP.emphasis_houses);
  assert.deepEqual(res.decision_operators.primary_factors, EXPECT_SELF_OP.primary_factors);
  assert.deepEqual(res.decision_operators.element_preference, EXPECT_SELF_OP.element_preference);
  assert.equal(res.schema_version, '1.0', '契约版本漂移');
}

// ═══════════════════════════════════════════════════════════
// A. 契约级：保留层齐备 + 军师真值 + inert 物理隔离
// ═══════════════════════════════════════════════════════════

test('A1 第五形态保留层齐备（常量 / 保留算子 / 单一消费入口 / 两面函数）', () => {
  for (const k of ['SELF_RELATION_MODE', 'SELF_MODE_ALIASES', 'SELF_ELEMENT_SENTINEL',
    'RELATION_SELF_OPERATOR_RESERVED', 'def resolve_relation_operators',
    'def is_self_mirror_mode', 'def _assert_self_reserved_invariants']) {
    assert.ok(ENGINE_SRC.includes(k), `引擎缺第五形态保留层要素: ${k}`);
  }
  // 别名闭集逐值（主标识必须在内）
  const ali = pyJson('import sys,json;sys.path.insert(0,"astro");'
    + 'from familiar_engine import SELF_MODE_ALIASES, SELF_RELATION_MODE, SELF_ELEMENT_SENTINEL;'
    + 'print(json.dumps({"aliases":list(SELF_MODE_ALIASES),"main":SELF_RELATION_MODE,"sentinel":SELF_ELEMENT_SENTINEL}))');
  assert.deepEqual(ali.aliases, SELF_ALIASES, '第五形态别名闭集与军师令不符');
  assert.equal(ali.main, SELF_MAIN, '主标识必须为 self');
  assert.equal(ali.sentinel, 'identity', '元素偏好哨兵必须为 identity');
});

test('A2 第五形态算子军师真值（行为级出参 + 与生产算子键集逐键同构）', () => {
  const ops = synOf('self').decision_operators;
  assert.equal(ops.intent_zh, EXPECT_SELF_OP.intent_zh, '决策意图不符');
  assert.deepEqual(ops.primary_factors, EXPECT_SELF_OP.primary_factors, '主因子不符（日月升三位一体）');
  assert.deepEqual(ops.emphasis_houses, EXPECT_SELF_OP.emphasis_houses, '重点宫位不符（第 1 宫命宫）');
  assert.deepEqual(ops.element_preference, EXPECT_SELF_OP.element_preference, '元素偏好哨兵不符');
  assert.equal(ops.tone, EXPECT_SELF_OP.tone, '语调不符');
  // 键集与生产四象**逐键同构**（结构性，防字段漏项）
  const liveKeys = Object.keys(synOf('girlfriend').decision_operators).sort();
  assert.deepEqual(Object.keys(ops).sort(), liveKeys, '第五形态算子与生产算子键集不同构');
  // ⑥ 别名等价（twin_self / higher_self 与 self 逐值一致）
  const selfR = synOf('self');
  for (const alias of ['twin_self', 'higher_self']) {
    const a = synOf(alias);
    assert.equal(a.fit_mode, 'identity_mapping', `${alias} 别名未走镜像投影`);
    assert.deepEqual(a.virtual_chart, selfR.virtual_chart, `${alias} 虚拟盘与 self 不一致`);
    assert.deepEqual(a.tensor, selfR.tensor, `${alias} 张量与 self 不一致`);
    assert.deepEqual(a.closure, selfR.closure, `${alias} 闭合与 self 不一致`);
  }
});

test('A3 🔴 第五形态 inert 物理隔离（生产四表键集恒为 4，别名零泄漏）', () => {
  assertReservedIsolationHolds(ENGINE_SRC);
  // 行为级：真实 CLI 读回生产四表 —— 恰 4 键，且不含任何别名
  const live = pyJson('import sys,json;sys.path.insert(0,"astro");'
    + 'from familiar_engine import (RELATION_MODES, RELATION_PALETTE,'
    + 'RELATION_DECISION_OPERATORS, RELATION_VOICE_MATRIX);'
    + 'print(json.dumps({"modes":sorted(RELATION_MODES),"palette":sorted(RELATION_PALETTE),'
    + '"ops":sorted(RELATION_DECISION_OPERATORS),"voice":sorted(RELATION_VOICE_MATRIX)}))');
  for (const [name, keys] of [['RELATION_MODES', live.modes], ['RELATION_PALETTE', live.palette],
    ['RELATION_DECISION_OPERATORS', live.ops], ['RELATION_VOICE_MATRIX', live.voice]]) {
    assert.deepEqual(keys, [...MODES].sort(), `${name} 生产键集漂移（必须恰为四象）`);
    for (const alias of SELF_ALIASES) {
      assert.ok(!keys.includes(alias), `${name} 出现第五形态 ${alias}（inert 铁律被破）`);
    }
  }
});

test('A4 🔴 生产 profile 通路刻意不开放第五形态（前端静默 / 端点零泄漏）', () => {
  // 引擎 profile 白名单仍为四象 ⇒ 第五形态一律退出码 2
  for (const alias of SELF_ALIASES) {
    assert.equal(exitCode([...BASE_TRIAD, '--relation-mode', alias], ENGINE_PATH), 2,
      `profile 通路不得开放第五形态 ${alias}（inert 铁律被破）`);
  }
  // 生产面三处白名单仍为四值（SQL CHECK / server.js 早拒副本 / 前端联合类型）
  const sql = SQL_SRC.match(/relation_mode\s+VARCHAR\(16\)[\s\S]{0,120}?CHECK\s*\(\s*relation_mode\s+IN\s*\(([^)]*)\)/);
  assert.ok(sql, 'SQL 缺 relation_mode CHECK 约束');
  const sqlVals = sql[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).sort();
  assert.deepEqual(sqlVals, [...MODES].sort(), 'SQL CHECK 四值与约定不符');
  const srv = SERVER_SRC.match(/const FAMILIAR_RELATION_MODES = new Set\(\[([^\]]*)\]\)/);
  assert.ok(srv, 'server.js 缺 FAMILIAR_RELATION_MODES');
  assert.deepEqual(srv[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean).sort(),
    [...MODES].sort(), 'server.js 早拒副本四值与约定不符');
  for (const alias of SELF_ALIASES) {
    assert.ok(!PICKER_SRC.includes(`'${alias}'`) && !PICKER_SRC.includes(`"${alias}"`),
      `前端选择器出现第五形态 ${alias}（用户可见选择项 ⇒ 违背前端静默铁律）`);
  }
});

test('A5 算子单一消费入口（下游禁直接下标生产算子表）', () => {
  assert.ok(SYN_SRC.includes('from familiar_engine import'), '合婚引擎未复用唯一真源');
  assert.ok(SYN_SRC.includes('resolve_relation_operators'), '合婚引擎未经单一消费入口取算子');
  assert.ok(!/RELATION_DECISION_OPERATORS\[/.test(SYN_SRC),
    '合婚引擎仍直接下标生产算子表（保留层形同虚设）');
  // 引擎自身主函数亦须经入口（本战前为直接下标）
  const fnStart = ENGINE_SRC.indexOf('def calculate_familiar_profile(');
  const fnEnd = ENGINE_SRC.indexOf('def _cli(', fnStart);
  assert.ok(fnStart !== -1 && fnEnd > fnStart, '未定位 profile 主函数体');
  assert.ok(!/RELATION_DECISION_OPERATORS\[/.test(ENGINE_SRC.slice(fnStart, fnEnd)),
    'profile 主函数仍直接下标生产算子表');
});

// ═══════════════════════════════════════════════════════════
// B. 行为级：真实 CLI 镜像短路
// ═══════════════════════════════════════════════════════════

test('B1 🔴 第五形态虚拟盘 = 本命盘 1:1 投影（0° 全合相 · 100% 同频）', () => {
  assertSelfMirrorCompliant(synOf('self'));
});

test('B2 命宫（H1）强调宫位关联：宫内日/月/金 ⇒ 话痨/黏人/治愈同升', () => {
  const r = pyJson('import sys,json;sys.path.insert(0,"astro");'
    + 'from familiar_engine import resolve_relation_operators, house_modifier_delta;'
    + 'op=resolve_relation_operators("self");'
    + 'd,c=house_modifier_delta(op["emphasis_houses"],{"Sun":1,"Moon":1,"Venus":1,"Mars":5});'
    + 'print(json.dumps({"houses":op["emphasis_houses"],"contributors":c,"delta":d}))');
  assert.deepEqual(r.houses, [1], '第五形态强调宫位必须为 [1]（命宫）');
  assert.deepEqual(r.contributors, ['Moon@H1', 'Sun@H1', 'Venus@H1'],
    `命宫内行星关联错: ${JSON.stringify(r.contributors)}`);
  assert.ok(r.delta.talkative > 0 && r.delta.clingy > 0 && r.delta.healing > 0,
    `命宫日月金应提升话痨/黏人/治愈: ${JSON.stringify(r.delta)}`);
});

test('B3 镜像拟合幂等 + 缺星如实记入 dropped（绝不臆造位置）', () => {
  assert.deepEqual(synOf('self'), synOf('self'), '第五形态镜像拟合必须幂等');
  const partial = { Sun: 132.6353, Moon: 297.4658, Venus: 109.5248 };
  const r = synOf('self', partial);
  assert.deepEqual(r.virtual_chart.longitudes, partial, '缺星时虚拟盘仍须与真值 1:1 重合');
  assert.deepEqual(r.virtual_chart.dropped.sort(), ['Jupiter', 'Mars', 'Mercury', 'Neptune',
    'Pluto', 'Saturn', 'Uranus'], '缺星必须如实记入 dropped');
  assert.ok(r.closure.ok, '缺星时闭合校验仍须独立通过');
});

// ═══════════════════════════════════════════════════════════
// C. 注入级：三类缺陷 ⇒ 判据必红
// ═══════════════════════════════════════════════════════════

test('C1 注入：第五形态泄漏进生产表 ⇒ inert 隔离判据必红（且引擎 fail-fast）', () => {
  const broken = ENGINE_SRC.replace('RELATION_MODES = {',
    "RELATION_MODES = {\n    'self': {\n        'pet_name': 'Self',\n        'persona_zh': 'x',\n        'persona_en': 'x',\n        'viewer': 'self',\n    },");
  assert.notEqual(broken, ENGINE_SRC, '注入未生效（RELATION_MODES 锚点漂移？）');
  // 正向对照：干净源码必须放行（证明判据不是恒红）
  assertReservedIsolationHolds(ENGINE_SRC);
  // ① 源码级隔离判据必红
  assert.throws(() => assertReservedIsolationHolds(broken), undefined,
    '判据失效: 泄漏进生产表未被识别');
  // ② 引擎导入期守卫必咬（脏生产表 ⇒ 拒绝启动，绝不静默带病运行）
  assert.throws(() => runMutatedEngine(broken, [...BASE_TRIAD, '--relation-mode', 'girlfriend']),
    undefined, '泄漏版引擎未 fail-fast（生产表脏化后仍可运行）');
});

test('C2 注入：镜像投影偏移 1° ⇒ 镜像合规判据必红', () => {
  const broken = SYN_SRC.replace('virtual[planet] = round(float(lon), 4)',
    'virtual[planet] = round(float(lon) + 1.0, 4)');
  assert.notEqual(broken, SYN_SRC, '注入未生效（镜像投影锚点漂移？）');
  assert.throws(() => assertSelfMirrorCompliant(runMutatedSynastry(broken,
    ['--mode', 'synergy', '--relation-mode', 'self', '--natal-longitudes', JSON.stringify(SY_SAMPLE)])),
    undefined, '判据失效: 虚拟盘偏移未被识别（假绿）');
});

test('C3 注入：篡改第五形态算子真值（命宫 [1] → [7]）⇒ 契约判据必红', () => {
  const broken = ENGINE_SRC.replace("'emphasis_houses': [1],", "'emphasis_houses': [7],");
  assert.notEqual(broken, ENGINE_SRC, '注入未生效（保留算子锚点漂移？）');
  // 判据（**同一份**服务正向与注入）
  const judge = (ops) => assert.deepEqual(ops.emphasis_houses, EXPECT_SELF_OP.emphasis_houses,
    '第五形态重点宫位必须为 [1]（命宫 / 自我意识 / 存在本质）');
  judge(synOf('self').decision_operators);
  assert.throws(() => judge({ ...synOf('self').decision_operators, emphasis_houses: [7] }), undefined,
    '判据失效: 篡改后的命宫未被识别');
  // 真实加载篡改源，确认注入确实改变了行为（射程自证 + 拒绝假注入）
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e40a-tamper-'));
  const f = path.join(dir, 'familiar_engine.py');
  fs.writeFileSync(f, broken, 'utf8');
  try {
    const tampered = pyJson('import json, importlib.util as u;'
      + `s=u.spec_from_file_location("t", ${JSON.stringify(f)});m=u.module_from_spec(s);s.loader.exec_module(m);`
      + 'print(json.dumps(m.resolve_relation_operators("self")["emphasis_houses"]))');
    assert.deepEqual(tampered, [7], '篡改版保留算子未被真实加载（注入射程自证失败）');
    assert.throws(() => judge({ ...synOf('self').decision_operators, emphasis_houses: tampered }), undefined,
      '判据失效: 真实篡改值未被识别');
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
  }
});

// ═══════════════════════════════════════════════════════════
// D. 零回归：生产四象未漂移
// ═══════════════════════════════════════════════════════════

test('D1 生产四象仍走反向相位拟合（fit_mode 标记 + 四象隔离不变）', () => {
  const charts = new Set();
  const scores = new Set();
  for (const m of MODES) {
    const r = synOf(m);
    assert.equal(r.fit_mode, 'reverse_synergy', `${m} 生产四象 fit_mode 漂移`);
    charts.add(JSON.stringify(r.virtual_chart.longitudes));
    scores.add(r.harmony.score);
    assert.ok(r.closure.ok, `${m} 生产四象闭合校验回归`);
  }
  assert.equal(charts.size, 4, '四象必须拟合出互异虚拟星盘（隔离回归）');
  assert.equal(scores.size, 4, '四象调和分必须两两互异（隔离回归）');
});

test('D2 生产四象算子真值未被污染（逐值复核 E38-A 三裁）', () => {
  const EXPECT = {
    girlfriend: { primary_factors: ['venus', 'mars', 'moon'], emphasis_houses: [7, 5], element_preference: ['water', 'earth'] },
    buddy: { primary_factors: ['sun', 'mars'], emphasis_houses: [11, 3], element_preference: ['fire', 'air'] },
    bestie: { primary_factors: ['mercury', 'moon'], emphasis_houses: [3, 11], element_preference: ['air', 'water'] },
    boyfriend: { primary_factors: ['sun', 'jupiter', 'venus'], emphasis_houses: [7, 5], element_preference: ['fire', 'earth'] },
  };
  const sigs = new Set();
  for (const m of MODES) {
    const ops = synOf(m).decision_operators;
    assert.deepEqual(ops.primary_factors, EXPECT[m].primary_factors, `${m} 主因子漂移`);
    assert.deepEqual(ops.emphasis_houses, EXPECT[m].emphasis_houses, `${m} 重点宫位漂移`);
    assert.deepEqual(ops.element_preference, EXPECT[m].element_preference, `${m} 元素偏好漂移`);
    sigs.add(JSON.stringify([ops.primary_factors, ops.emphasis_houses, ops.element_preference]));
  }
  assert.equal(sigs.size, 4, '四象算子签名必须两两互异');
});

test('D3 存量注入锚点未被本战破坏（既有闸门射程完好）', () => {
  // audit-e38 D1/D2/D3/D5 锚点
  for (const a of ["'emphasis_houses': [7, 5],", "'primary_factors': ['sun', 'jupiter', 'venus'],",
    "'element_preference': ['air', 'water'],", "'Sun':     {'talkative': +1.0,",
    'HOUSE_MODIFIER_COEFF = 0.15']) {
    assert.ok(ENGINE_SRC.includes(a), `引擎存量锚点缺失（既有闸门将假红）: ${a}`);
  }
  // audit-e38 H1/H2/H3/H4 锚点
  for (const a of ["'square':      0.35,", 'ELEMENT_BONUS = 1.60',
    "predicted = [(a['anchor'], a['planet'], a['aspect']) for a in assignments]",
    '    lons = normalize_longitudes(raw)\n    if not lons:']) {
    assert.ok(SYN_SRC.includes(a), `合婚存量锚点缺失（既有闸门将假红）: ${JSON.stringify(a.slice(0, 40))}`);
  }
  // 四表键集不变式（生产四象）原样保留
  assert.ok(ENGINE_SRC.includes('assert (set(RELATION_MODES) == set(RELATION_PALETTE)'),
    '四表键集不变式被改写');
  assert.ok(ENGINE_SRC.includes('== set(RELATION_DECISION_OPERATORS) == set(RELATION_VOICE_MATRIX))'),
    '四表键集不变式未覆盖算子/声线');
});

// ═══════════════════════════════════════════════════════════
// E. 文档
// ═══════════════════════════════════════════════════════════

test('E1 北极星文档含第五形态章节与增量铁律', () => {
  for (const a of ['### 4.7 第五形态', '§5.2', '五重灵魂形态', '四外一内',
    'RELATION_SELF_OPERATOR_RESERVED', 'resolve_relation_operators',
    'fit_identity_mirror', '本我镜映', 'Identity Mapping', 'inert']) {
    assert.ok(SPEC_SRC.includes(a), `北极星缺第五形态要素: ${a}`);
  }
});

test('E2 既有协议索引与 4.4~4.6 零回归', () => {
  for (const a of ['Soul Card', 'Synastry', 'Peer Handshake', 'Embodied',
    '### 4.4 Agent 执行协议', '### 4.5 语音双模态协议', '### 4.6 四象决策算子',
    'RELATION_DECISION_OPERATORS', 'harmony_score', 'communication_score', 'attraction_score']) {
    assert.ok(SPEC_SRC.includes(a), `北极星既有索引回归: ${a}`);
  }
});

// ═══════════════════════════════════════════════════════════
// F. 注释卫生（E34/E35/E36 三次踩坑的跨行吞码防线）
// ═══════════════════════════════════════════════════════════

test('F1 本闸门块注释行不得出现提前闭合形态', () => {
  const hits = (src) => src.split('\n')
    .filter((L) => { const t = L.trim(); return t.startsWith('*') || t.startsWith('/*'); })
    .filter((L) => /\w\*\/\w/.test(L));
  const SELF = fs.readFileSync(import.meta.filename, 'utf8');
  assert.deepEqual(hits(SELF), [], '本闸门块注释行出现提前闭合形态');
});

test('F2 本闸门行注释不得含未同行闭合的裸起始符', () => {
  const SELF = fs.readFileSync(import.meta.filename, 'utf8');
  const bad = SELF.split('\n').filter((L) => L.trim().startsWith('//'))
    .filter((L) => { const t = L.trim(); return t.includes('/*') && !t.includes('*/'); });
  assert.deepEqual(bad, [], '本闸门行注释出现未同行闭合的裸起始符（下游剥离器会跨行吞码）');
});
