/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 E40+ 闸门：合婚星历张量注入四段骨架终极融合（第 21 道防线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（2026-10-10 军师《E40+ 合婚星历张量注入四段骨架终极融合战备令》）：
 *   把 E38 的 SwissEph 物理相位张量熔铸进 E39 的六语四段深报，达成
 *   「东方数理 + 瑞士星历物理天体羁绊」的终极真值融合。
 *
 * 四断言映射（军师令 → 闸门组）：
 *   断言A 真值跨域贯通 → A 组（引擎双盘 CLI 契约 + 同一把量尺 + server 接线 + 注入层真值落地）
 *   断言B 缺真值降级   → B 组（装配器三态行为 + 真引擎 date_level 剔除 + 显式未知零数值）
 *   断言C 契约与六语   → C 组（六语字段完备 + 无中英夹杂 + 纯文本契约 + 免费层零注入）
 *   断言D 注入必红     → D 组（拆注入 / 删早退 / 删剔除 三处注入必红 + 长链段数）
 *
 * 同源铁律（E37/F4 教训）：D 组注入自测与 A/B 组正向断言**共用同一判据函数** ——
 *   注入后判据必须变红，防「注入无效却掩盖闸门失效」的假绿。
 * 真值纪律（E38 同源）：缺真值 ⇒ 显式 unknown / available:false，**禁静默伪造**。
 *
 * 运行：node --test test/audit-e40-compat-synastry-tensor-fusion.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SERVER = read('server.js');
const ASSET = read('api/ai-advisor.js');
const ASSET_MIRROR = read('web/api/ai-advisor.js');
const CLIENT = read('v69_client.js');
const SYN_SRC = read('astro/synastry_engine.py');
const PKG = JSON.parse(read('package.json'));

const SYN_PATH = path.join(ROOT, 'astro', 'synastry_engine.py');
const FAM_PATH = path.join(ROOT, 'astro', 'familiar_engine.py');
const require2 = createRequire(path.join(ROOT, 'package.json'));

// ── 注释剥离（真值块扫描；带 u 语义的 emoji 判定在下方另行处理）──
function stripJs(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/(?<![:'"])\/\/(?!\/).*$/gm, '');
}
const SERVER_TRUTH = stripJs(SERVER);
const ASSET_TRUTH = stripJs(ASSET);

// ── 函数体抽取（花括号配平；**保留 async 前缀** —— 否则 await 在被抽出的片段里变成标识符）──
function extractFn(src, name) {
  const i = src.indexOf(`function ${name}(`);
  if (i === -1) return null;
  const asyncPrefix = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  let depth = 0;
  let j = src.indexOf('{', i);
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return asyncPrefix + src.slice(i, j + 1); }
  }
  return null;
}

// ── 确定性双盘真值样例（两套互异本命盘 ⇒ 交叉相位必然非空）──
const CHART_A = { Sun: 213.4, Moon: 348.9, Mercury: 226.1, Venus: 175.3, Mars: 250.7,
  Jupiter: 340.2, Saturn: 349.8, Uranus: 275.5, Neptune: 272.3, Pluto: 215.9 };
const CHART_B = { Sun: 100.2, Moon: 44.6, Mercury: 112.9, Venus: 130.5, Mars: 20.4,
  Jupiter: 8.8, Saturn: 288.1, Uranus: 245.7, Neptune: 265.0, Pluto: 222.6 };

const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];
const PLANETS10 = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ASPECTS5 = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
const TENSOR_KEYS = ['aspects', 'matrix', 'counts', 'total', 'harmonious', 'hard'];
const DUAL_KEYS = ['mode', 'precision', 'unknown', 'side_a_planets', 'side_b_planets', 'tensor', 'harmony', 'summary', 'schema_version'];

// ── 真实 CLI（synastry_engine 纯函数，无 swisseph 依赖 ⇒ 裸 python3 即可）──
function pyJson(code) {
  return JSON.parse(execFileSync('python3', ['-c', code], { cwd: ROOT, encoding: 'utf8', timeout: 30000 }));
}
function dualCli(a, b, precision, unknown) {
  const args = [SYN_PATH, '--mode', 'dual-tensor',
    '--natal-longitudes', JSON.stringify(a), '--partner-longitudes', JSON.stringify(b),
    '--precision', precision];
  if (unknown) args.push('--unknown', JSON.stringify(unknown));
  return JSON.parse(execFileSync('python3', args, { cwd: ROOT, encoding: 'utf8', timeout: 30000 }));
}
/** 用改写后的引擎源码跑真实 CLI（临时目录；familiar_engine 原样随行 ⇒ 导入链不断） */
function runMutatedSyn(src) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e40p-inject-'));
  fs.writeFileSync(path.join(dir, 'synastry_engine.py'), src, 'utf8');
  fs.copyFileSync(FAM_PATH, path.join(dir, 'familiar_engine.py'));
  const script = path.join(dir, 'synastry_engine.py');
  try {
    return JSON.parse(execFileSync('python3', [script, '--mode', 'dual-tensor',
      '--natal-longitudes', JSON.stringify(CHART_A), '--partner-longitudes', JSON.stringify(CHART_B),
      '--precision', 'date_level'], { cwd: ROOT, encoding: 'utf8', timeout: 30000 }));
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
  }
}

// ═══════════════════════════════════════════════════════════════
// 判据函数（正向断言与注入自测**共用** ⇒ 同源、射程完整）
// ═══════════════════════════════════════════════════════════════

/** A/B 组共用：date_level 降级必须如实 —— unknown 含月亮、两侧均剔除月亮、相位条数下降 */
function isDateLevelHonest(out, timedTotal) {
  return Array.isArray(out.unknown) && out.unknown.includes('Moon')
    && !out.side_a_planets.includes('Moon') && !out.side_b_planets.includes('Moon')
    && out.tensor.total < timedTotal;
}

/** B 组共用：无时空真值 ⇒ 显式失败且**零星历/引擎调用**（绝不静默伪造兜底） */
function isNoTruthHonest(res, calls) {
  return !!res && res.available === false && res.reason === 'no_time_truth'
    && calls.astro.length === 0 && calls.dual.length === 0;
}

/** A 组共用：注入层真值落地（可用盘的比值/相位名/映射令必须进提示词） */
function assetInjectsTruth(mod, lang, ratioText) {
  const t = mod.SYNASTRY_I18N[lang];
  const tc = mod.buildCompatTimeContext('once', new Date(), null, lang);
  const scores = mod.computeCompatScores('78/100', '82/100', '71/100');
  const p = mod.buildCompatPrompt({ lang, reportType: 'once', scores, timeCtx: tc, synastry: SYNASTRY_FIXTURE });
  return p.user.includes(ratioText)
    && p.user.includes(t.planets.Mars) && p.user.includes(t.planets.Saturn)
    && p.user.includes(t.aspects.square)
    && p.system.includes(t.mapClause)
    && p.synastry && p.synastry.available === true;
}

// 注入层夹具（值由 A1 的真实引擎结果回填，保证真值同源）
let SYNASTRY_FIXTURE = null;

// ═══════════════════════════════════════════════════════════════
// A 组 · 真值跨域贯通（军师断言 A）
// ═══════════════════════════════════════════════════════════════
const DUAL_TIMED = dualCli(CHART_A, CHART_B, 'timed', null);
SYNASTRY_FIXTURE = {
  available: true,
  precision: DUAL_TIMED.precision,
  harmonious: DUAL_TIMED.harmony.harmonious,
  hard: DUAL_TIMED.harmony.hard,
  total: DUAL_TIMED.harmony.total,
  ratio: DUAL_TIMED.harmony.ratio,
  unknown: DUAL_TIMED.unknown,
  bonds: DUAL_TIMED.summary.bonds,
  frictions: DUAL_TIMED.summary.frictions,
  signatures: DUAL_TIMED.summary.signatures,
};
const RATIO_TEXT = Number(DUAL_TIMED.harmony.ratio).toFixed(3);

test('A1 引擎 dual-tensor 契约锁定：键集精确 / harmony 与 tensor 自洽 / 确定性幂等', () => {
  assert.deepEqual(Object.keys(DUAL_TIMED).sort(), [...DUAL_KEYS].sort(), 'dual-tensor 出参键集漂移');
  assert.deepEqual(Object.keys(DUAL_TIMED.tensor).sort(), [...TENSOR_KEYS].sort(), '张量键契约漂移（E38 锁定）');
  const h = DUAL_TIMED.harmony;
  assert.equal(h.harmonious, DUAL_TIMED.tensor.harmonious, 'harmony.harmonious 与张量不自洽');
  assert.equal(h.hard, DUAL_TIMED.tensor.hard, 'harmony.hard 与张量不自洽');
  assert.equal(h.total, DUAL_TIMED.tensor.total, 'harmony.total 与张量不自洽');
  assert.ok(h.total > 0, `真实双盘交叉相位不得为空（实得 ${h.total}）`);
  assert.equal(h.harmonious + h.hard, h.total, '调和 + 硬相 ≠ 总数（极性分类有漏）');
  const again = dualCli(CHART_A, CHART_B, 'timed', null);
  assert.deepEqual(again, DUAL_TIMED, 'dual-tensor 非确定性（同盘两次读数不一致）');
});

test('A2 同一把量尺：dual-tensor 张量 ≡ 直接 compute_synastry_tensor（禁另起一把尺）', () => {
  const direct = pyJson(`import sys, json; sys.path.insert(0, 'astro');
from synastry_engine import compute_synastry_tensor
print(json.dumps(compute_synastry_tensor(json.loads(${JSON.stringify(JSON.stringify(CHART_A))}), json.loads(${JSON.stringify(JSON.stringify(CHART_B))}))))`);
  assert.deepEqual(DUAL_TIMED.tensor, direct, '真实双盘张量与基础量尺读数不一致（尺子被偷换）');
  assert.equal(DUAL_TIMED.tensor.aspects.length, direct.total, 'aspects 条数与 total 不一致');
});

test('A3 server.js 接线：三档 branch 装配真值 + 委托链转发（源码级）', () => {
  // ⚠️ 财富域存在同构 branch 串（跨域同构陷阱，E39 同款）⇒ 以**真值装配行**为唯一锚反推本域 branch
  const iTruth = SERVER_TRUTH.indexOf('const _compatSyn = await buildCompatSynastryTruth(');
  assert.notEqual(iTruth, -1, '合婚域真值装配行缺失（buildCompatSynastryTruth 未接入端点）');
  const iBranch = SERVER_TRUTH.lastIndexOf("if (reportType === 'monthly' || reportType === 'yearly' || reportType === 'once') {", iTruth);
  assert.notEqual(iBranch, -1, '合婚三档分流 branch 缺失（真值）');
  const iFree = SERVER_TRUTH.indexOf('const cacheKey =', iTruth);
  const seg = SERVER_TRUTH.slice(iBranch, iFree);
  assert.ok(seg.includes('buildCompatSynastryTruth('), '三档 branch 未装配真实双盘张量真值');
  assert.ok(seg.includes('synastry: _compatSyn'), '真值未以 synastry 键传入骨架构建器');
  // 委托链：buildCompatibilityReportPrompt ⇒ buildCompatPrompt 必须转发 synastry
  const deleg = extractFn(SERVER, 'buildCompatibilityReportPrompt');
  assert.ok(deleg, '委托函数 buildCompatibilityReportPrompt 缺失');
  assert.ok(/synastry:\s*x\.synastry/.test(deleg), '委托函数未把 synastry 转发给 buildCompatPrompt');
  // 次序铁律（E24g B10）：权益闸门必须早于 await callAI
  const entPos = seg.indexOf("resolveReportEntitlement(req, 'compatibility'");
  const aiPos = seg.indexOf('await callAI(');
  assert.ok(entPos !== -1 && aiPos !== -1 && entPos < aiPos, '权益闸门不再早于 await callAI（E24g B10 被破）');
});

test('A4 注入层行为级：可用盘 ⇒ 比值 + 真实相位名入 user，映射令入 system', () => {
  const mod = require2(path.join(ROOT, 'api', 'ai-advisor.js'));
  assert.ok(assetInjectsTruth(mod, 'zh', RATIO_TEXT), 'zh：真值未落地提示词（比值/相位名/映射令缺一）');
});

test('A6 六语注入齐备：每语均见羁绊锁真值块 + 四段映射令 + 本地化相位名', () => {
  const mod = require2(path.join(ROOT, 'api', 'ai-advisor.js'));
  for (const lang of LANGS) {
    assert.ok(assetInjectsTruth(mod, lang, RATIO_TEXT), `${lang}：星历张量真值未落地（六语守备缺口）`);
  }
});

// ═══════════════════════════════════════════════════════════════
// B 组 · 缺真值降级（军师断言 B）
// ═══════════════════════════════════════════════════════════════
test('B1 available:false ⇒ 仅显式未知声明，零数值相位断言（禁编造度数）', () => {
  const mod = require2(path.join(ROOT, 'api', 'ai-advisor.js'));
  for (const lang of LANGS) {
    const block = mod.renderSynastryBlock({ available: false, reason: 'no_time_truth' }, lang);
    assert.equal(block, mod.SYNASTRY_I18N[lang].unavailableNote, `${lang}：降级块未收敛为显式未知声明`);
    assert.ok(!/[0-9]/.test(block), `${lang}：降级声明出现数字（疑似编造度数）`);
  }
  // 免费层（reportType 非报告档）即便传真值也不注入
  const tc = mod.buildCompatTimeContext('compatibility', new Date(), null, 'zh');
  const free = mod.buildCompatPrompt({ lang: 'zh', reportType: 'compatibility',
    scores: mod.computeCompatScores('78/100', '82/100', '71/100'), timeCtx: tc, synastry: SYNASTRY_FIXTURE });
  assert.ok(!free.user.includes(mod.SYNASTRY_I18N.zh.lockHead), '免费层被注入星历真值块（射程越界）');
  assert.ok(!free.system.includes(mod.SYNASTRY_I18N.zh.mapClause), '免费层被注入四段映射令（射程越界）');
});

test('B2 装配器源码级：无真值早退 + 异常收敛（绝不 rethrow 拖垮报告）', () => {
  const main = extractFn(SERVER, 'buildCompatSynastryTruth');
  assert.ok(main, 'server.js 缺 buildCompatSynastryTruth 装配器');
  assert.ok(/reason:\s*'no_time_truth'/.test(main), '缺「无时空真值 ⇒ 显式不可用」早退判据');
  const catchSeg = main.slice(main.lastIndexOf('catch'));
  assert.ok(/available:\s*false/.test(catchSeg), 'catch 分支未收敛为 available:false');
  assert.ok(!/throw\s+e/.test(catchSeg), 'catch 分支仍在 rethrow（会把报告拖垮）');
});

// ── 装配器行为级（源码抽取 + 依赖注入 ⇒ 真实走三态分支）──
const ASSEMBLY_DEPS = ['resolveTimeZone', 'resolveCoordinates', 'getAstroMatrix',
  'extractNatalTriad', 'getDualSynastryTensor', 'console'];
function makeAssembler(serverSrc, opts) {
  const o = opts || {};
  const side = extractFn(serverSrc, '_compatTimeTruthSide');
  const main = extractFn(serverSrc, 'buildCompatSynastryTruth');
  assert.ok(side && main, '装配器源码抽取失败（函数锚点漂移？）');
  const calls = { astro: [], dual: [] };
  const deps = {
    resolveTimeZone: (tz) => ({ ok: true, tz: tz ? String(tz) : 'Asia/Bangkok', tier: tz ? 1 : 0 }),
    resolveCoordinates: (lat, lon) => ({ ok: true, lat, lon,
      tier: (lat !== undefined && lat !== null && lon !== undefined && lon !== null) ? 'explicit' : 'default' }),
    getAstroMatrix: async (bd, bt, lat, lon, tz) => {
      calls.astro.push({ bd, bt, lat, lon, tz });
      if (o.astroThrows) throw new Error('astro engine down');
      return { meta: { planet_longitudes: CHART_A } };
    },
    extractNatalTriad: (m) => ({ planetLongitudes: (m.meta && m.meta.planet_longitudes) || {} }),
    getDualSynastryTensor: async (p) => {
      calls.dual.push(p);
      if (o.dualThrows) { const e = new Error('engine boom'); e.code = 'SYNASTRY_INVALID_INPUT'; throw e; }
      return { precision: p.precision, unknown: p.precision === 'date_level' ? ['Moon'] : [],
        harmony: { harmonious: 18, hard: 16, total: 34, ratio: 0.529 },
        summary: { bonds: [], frictions: [], signatures: {} } };
    },
    console: { log() {}, warn() {} },
  };
  const factory = new Function(...ASSEMBLY_DEPS,
    `${side}\n${main}\nreturn { buildCompatSynastryTruth };`);
  return { fn: factory(...ASSEMBLY_DEPS.map((k) => deps[k])).buildCompatSynastryTruth, calls };
}
const TIME_TRUTH_TIMED = { timeTruth: {
  a: { birthTime: '14:30', tz: 'Asia/Bangkok', lat: 13.75, lon: 100.5 },
  b: { birthTime: '09:00', tz: 'Asia/Shanghai', lat: 31.23, lon: 121.47 } } };
const TIME_TRUTH_DATELESS = { timeTruth: {
  a: { tz: 'Asia/Bangkok', lat: 13.75, lon: 100.5 },
  b: { tz: 'Asia/Shanghai', lat: 31.23, lon: 121.47 } } };

test('B3 装配器行为级 · 双人完整时空 ⇒ precision=timed 且两侧均带出生时间建盘', async () => {
  const h = makeAssembler(SERVER);
  const res = await h.fn(TIME_TRUTH_TIMED, '1990-08-05', '1992-03-14');
  assert.equal(res.available, true, '完整时空真值未产出可用张量');
  assert.equal(h.calls.astro.length, 2, '应各建一次本命盘（A/B）');
  assert.equal(h.calls.astro[0].bt, '14:30', 'A 侧出生时间未进入建盘');
  assert.equal(h.calls.astro[1].bt, '09:00', 'B 侧出生时间未进入建盘');
  assert.equal(h.calls.dual.length, 1, '引擎调用次数异常');
  assert.equal(h.calls.dual[0].precision, 'timed', '双人完整时空未判为 timed');
});

test('B4 装配器行为级 · 仅日期无时间 ⇒ precision=date_level 且建盘不带时间（如实降级）', async () => {
  const h = makeAssembler(SERVER);
  const res = await h.fn(TIME_TRUTH_DATELESS, '1990-08-05', '1992-03-14');
  assert.equal(res.available, true, '日期级降级不应整体失效（慢速星真值仍可用）');
  assert.equal(h.calls.dual[0].precision, 'date_level', '缺出生时间未降级为 date_level');
  for (const c of h.calls.astro) {
    assert.equal(c.bt, undefined, '降级档仍把时间送进建盘（伪造精度）');
  }
});

test('B5 装配器行为级 · 完全无时空真值 ⇒ 显式不可用且零引擎/零建盘调用', async () => {
  const h = makeAssembler(SERVER);
  const res = await h.fn({ d1: '1990-08-05', d2: '1992-03-14' }, '1990-08-05', '1992-03-14');
  assert.ok(isNoTruthHonest(res, h.calls), `无真值未显式失败：${JSON.stringify(res)}`);
});

test('B6 装配器行为级 · 引擎故障 ⇒ 收敛 available:false（不抛、不拖垮报告）', async () => {
  const h = makeAssembler(SERVER, { dualThrows: true });
  const res = await h.fn(TIME_TRUTH_TIMED, '1990-08-05', '1992-03-14');
  assert.equal(res.available, false, '引擎故障未收敛为不可用');
  assert.equal(res.reason, 'SYNASTRY_INVALID_INPUT', '未透传引擎错误码');
});

test('B7 真引擎 date_level 语义：剔除月亮 + 如实标注 unknown + 相位条数下降', () => {
  const dl = dualCli(CHART_A, CHART_B, 'date_level', null);
  assert.equal(dl.precision, 'date_level', '引擎未如实标注降级精度');
  assert.ok(isDateLevelHonest(dl, DUAL_TIMED.tensor.total),
    `date_level 未如实剔除月亮：unknown=${JSON.stringify(dl.unknown)} total=${dl.tensor.total}`);
});

// ═══════════════════════════════════════════════════════════════
// C 组 · 契约与六语（军师断言 C）
// ═══════════════════════════════════════════════════════════════
test('C1 SYNASTRY_I18N 六语字段完备（锁头/降级声明/标签/行星/相位/格式/映射令）', () => {
  const mod = require2(path.join(ROOT, 'api', 'ai-advisor.js'));
  const I18N = mod.SYNASTRY_I18N;
  assert.deepEqual(Object.keys(I18N).sort(), [...LANGS].sort(), '六语键集漂移');
  for (const lang of LANGS) {
    const t = I18N[lang];
    for (const k of ['lockHead', 'unavailableNote', 'labels', 'planets', 'aspects', 'pairFmt', 'listSep', 'tenor', 'noHard', 'noSoft', 'mapClause']) {
      assert.ok(t[k], `${lang} 缺字段 ${k}`);
    }
    for (const k of ['precision', 'timed', 'dateLevel', 'harmony', 'hard', 'total', 'ratio', 'unknown', 'none', 'bonds', 'frictions', 'signatures']) {
      assert.ok(t.labels[k], `${lang}.labels 缺字段 ${k}`);
    }
    assert.ok(t.pairFmt.includes('{a}') && t.pairFmt.includes('{asp}') && t.pairFmt.includes('{b}'), `${lang}.pairFmt 占位符残缺`);
  }
});

test('C2 六语无中英夹杂：非中文语零 CJK；六语映射令均含 🎯 与 🌿 四段锚', () => {
  const mod = require2(path.join(ROOT, 'api', 'ai-advisor.js'));
  const I18N = mod.SYNASTRY_I18N;
  const CJK = /[\u4e00-\u9fff\u3040-\u30ff]/;
  for (const lang of LANGS) {
    const t = I18N[lang];
    assert.ok(t.mapClause.includes('🎯') && t.mapClause.includes('🌿'), `${lang}.mapClause 缺四段锚`);
    if (lang === 'zh') continue;
    for (const [k, v] of Object.entries(t)) {
      if (typeof v !== 'string') continue;
      assert.ok(!CJK.test(v), `${lang}.${k} 出现 CJK 夹杂（机翻/串语）`);
    }
    for (const [k, v] of Object.entries(t.labels)) {
      assert.ok(!CJK.test(v), `${lang}.labels.${k} 出现 CJK 夹杂`);
    }
  }
});

test('C3 行星 10 项与相位 5 项六语全量本地化且两两互异', () => {
  const mod = require2(path.join(ROOT, 'api', 'ai-advisor.js'));
  const I18N = mod.SYNASTRY_I18N;
  for (const lang of LANGS) {
    const t = I18N[lang];
    assert.deepEqual(Object.keys(t.planets).sort(), [...PLANETS10].sort(), `${lang}.planets 键集漂移`);
    assert.deepEqual(Object.keys(t.aspects).sort(), [...ASPECTS5].sort(), `${lang}.aspects 键集漂移`);
    assert.equal(new Set(Object.values(t.planets)).size, 10, `${lang}.planets 存在重复译名`);
    assert.equal(new Set(Object.values(t.aspects)).size, 5, `${lang}.aspects 存在重复译名`);
    for (const v of [...Object.values(t.planets), ...Object.values(t.aspects)]) {
      assert.ok(String(v).trim().length > 0, `${lang} 存在空译名`);
    }
  }
});

test('C4 契约不变：\\n\\n 纯文本四段（无 JSON）+ 镜像逐字节同源', () => {
  const mod = require2(path.join(ROOT, 'api', 'ai-advisor.js'));
  const scores = mod.computeCompatScores('78/100', '82/100', '71/100');
  const p = mod.buildCompatPrompt({ lang: 'zh', reportType: 'monthly', scores,
    timeCtx: mod.buildCompatTimeContext('monthly', new Date(), null, 'zh'), synastry: SYNASTRY_FIXTURE });
  assert.equal(typeof p.user, 'string', 'user 必须是字符串（纯文本契约）');
  for (const seg of ['🎯', '⚡', '💡', '🌿']) {
    assert.ok(p.user.includes(seg), `四段骨架缺 ${seg}`);
  }
  assert.ok(!p.user.trim().startsWith('{'), '注入后疑似回退 JSON 契约（前端 split 渲染将崩）');
  assert.equal(ASSET, ASSET_MIRROR, 'api/ 与 web/api/ 资产不同源（镜像漂移）');
});

test('C5 server.js 三档 branch 保留 \\n\\n 契约（无 JSON.stringify 包裹出参）', () => {
  const iBranch = SERVER_TRUTH.indexOf("if (reportType === 'monthly' || reportType === 'yearly' || reportType === 'once') {");
  const seg = SERVER_TRUTH.slice(iBranch, SERVER_TRUTH.indexOf('const cacheKey =', iBranch));
  assert.ok(seg.includes('res.json({ insight, cached: false })'), '三档回执契约漂移');
  assert.ok(!/JSON\.stringify\(\s*_compat\.user/.test(seg), '出参被 JSON 化（契约错配复辟）');
});

// ═══════════════════════════════════════════════════════════════
// D 组 · 注入自测必红 + 长链（军师断言 D）
// ═══════════════════════════════════════════════════════════════
test('D1 注入：拆掉 buildCompatPrompt 的真值块注入 ⇒ A 组判据必红（同源判据）', () => {
  const anchor = "const synBlock = (isReport && syn) ? renderSynastryBlock(syn, L) : '';";
  assert.ok(ASSET.includes(anchor), '注入锚点漂移（真值块装配行未找到）');
  const mutated = ASSET.replace(anchor, "const synBlock = '';");
  assert.notEqual(mutated, ASSET, '注入未生效');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e40p-asset-'));
  try {
    const f = path.join(dir, 'mutated.mjs');
    fs.writeFileSync(f, mutated, 'utf8');
    const m = require2(f);
    assert.ok(!assetInjectsTruth(m, 'zh', RATIO_TEXT), '判据失效：真值块已拆掉却仍判绿');
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* noop */ }
  }
});

test('D2 注入：删掉「无真值早退」⇒ B 组判据必红（伪造兜底被识别）', async () => {
  const anchor = "  if (!_provided(specA) && !_provided(specB)) return { available: false, reason: 'no_time_truth' };\n";
  assert.ok(SERVER.includes(anchor), '早退锚点漂移（无真值判据行未找到）');
  const mutated = SERVER.replace(anchor, '');
  assert.notEqual(mutated, SERVER, '注入未生效');
  const h = makeAssembler(mutated);
  const res = await h.fn({ d1: '1990-08-05', d2: '1992-03-14' }, '1990-08-05', '1992-03-14');
  assert.ok(!isNoTruthHonest(res, h.calls), '判据失效：删掉早退后仍在「显式失败」（假绿）');
  assert.equal(res.available, true, '注入射程自证：删掉早退后应退化为默认坐标兜底');
});

test('D3 注入：删掉引擎 date_level 剔除 ⇒ B 组判据必红（月亮不再如实降级）', () => {
  const anchor = 'for planet in DATE_LEVEL_UNRELIABLE:';
  assert.ok(SYN_SRC.includes(anchor), '剔除锚点漂移（date_level 循环未找到）');
  const mutated = SYN_SRC.replace(anchor, 'for planet in ():');
  assert.notEqual(mutated, SYN_SRC, '注入未生效');
  const out = runMutatedSyn(mutated);
  assert.ok(!isDateLevelHonest(out, DUAL_TIMED.tensor.total),
    '判据失效：剔除逻辑已删却仍判「如实降级」（假绿）');
  assert.ok(out.side_a_planets.includes('Moon'), '注入射程自证：月亮应残留在盘中');
});

test('D4 长链守备：本闸门已接入 test:astro 且总段数 ≥ 36', () => {
  const chain = PKG.scripts['test:astro'];
  assert.ok(chain.includes('audit-e40-compat-synastry-tensor-fusion'), '本闸门未接入长链');
  const segs = chain.split(' && ');
  assert.ok(segs.length >= 36, `长链段数不足 36（实得 ${segs.length}）`);
  assert.ok(segs[segs.length - 2].includes('audit-e40-compat-synastry-tensor-fusion'),
    '本闸门未置于长链末段（收口位）');
});
