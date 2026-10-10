/**
 * Gate 40 — 甲线 · 灵宠合盘报告生成管线（多语言标准化 Report Payload）
 * ═══════════════════════════════════════════════════════════════════════════
 * 真值源：
 *   · astro/astro_terms_dict.json                       —— 术语唯一真值（Gate 39 锁死）
 *   · api/ai-advisor.js  SYNASTRY_I18N                  —— 报告字段名 / 相位槽位真值资产
 *   · astro/synastry_engine.py::dual_synastry_tensor    —— 结构化张量（唯一量尺）
 *   · lib/reportPipeline.mjs                            —— 本闸门被测的纯逻辑核
 *
 * 断言分组：
 *   A 状态机（pending→calculating→assembling→ready ／ failed 旁路；fail-closed；终态锁定；视图模型零泄漏）
 *   B Payload 契约（schemaVersion 锁定 · 键集精确 · truth 逐字映射 · prose 不得污染结构化字段）
 *   C 字典取词（卡内每项必回查字典命中 · labels 取自注入资产 · 相位词条零内联字面量）
 *   D 槽位预算（字素 ≤ 预算 · 泰/越组合符不劈裂 · 渲染层三道防线齐备）
 *   E 端到端向量（V1 timed ／ V2 date_level ／ V3 无真值零引擎 ／ V4 同张量 × 六语）
 *   F 注入反漂移（派生物手改 / 相位词漂移 / 间隔符漂移 / 降级标记被抹 / 不可用仍造卡 ⇒ 必红）
 *   G 段位守备（已入编 test:astro，且位于收口位 audit-e40-compat 之前）
 *
 * 纯 Node 运行（无 DOM / 无网络 / 无 LLM）；仅 E 组调用 synastry_engine 纯函数 CLI。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const readSrc = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const DICT = JSON.parse(readSrc('astro/astro_terms_dict.json'));
const PKG = JSON.parse(readSrc('package.json'));
const PIPE_PATH = path.join(ROOT, 'lib', 'reportPipeline.mjs');
const SYN_PATH = path.join(ROOT, 'astro', 'synastry_engine.py');

const LANGS = DICT.meta.langs;
const ASPECTS_SHORT = DICT.domains.aspectsShort;
const HARD_CAP = DICT.slots.budgets.hardCap.maxGraphemes;

const PIPE = await import(pathToFileURL(PIPE_PATH).href);
const ADV_PATH = path.join(ROOT, 'api', 'ai-advisor.js');
const ADV = await import(pathToFileURL(ADV_PATH).href);
const I18N = ADV.SYNASTRY_I18N;

/* ── 工具 ── */
const SEG = new Intl.Segmenter('en', { granularity: 'grapheme' });
const gLen = (s) => [...SEG.segment(String(s == null ? '' : s))].length;
const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF]/;
const THAI = /[\u0E00-\u0E7F]/;

/** 剥注释（只看真值块；Python 版另加三引号） */
function stripJs(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^[ \t]*\/\/.*$/gm, ' ')
    .replace(/(?<![:'"])\/\/(?!\/).*$/gm, ' ');
}

/* ── 端到端确定性双盘（与 E40+ 同源样本；两盘互异 ⇒ 交叉相位非空）── */
const CHART_A = { Sun: 213.4, Moon: 348.9, Mercury: 226.1, Venus: 175.3, Mars: 250.7,
  Jupiter: 340.2, Saturn: 349.8, Uranus: 275.5, Neptune: 272.3, Pluto: 215.9 };
const CHART_B = { Sun: 100.2, Moon: 44.6, Mercury: 112.9, Venus: 130.5, Mars: 20.4,
  Jupiter: 8.8, Saturn: 288.1, Uranus: 245.7, Neptune: 265.0, Pluto: 222.6 };

/** 真实引擎 CLI（synastry_engine 纯函数，无 swisseph 依赖 ⇒ 裸 python3 即可） */
function dualCli(longitudesA, longitudesB, precision) {
  return JSON.parse(execFileSync('python3', [SYN_PATH, '--mode', 'dual-tensor',
    '--natal-longitudes', JSON.stringify(longitudesA),
    '--partner-longitudes', JSON.stringify(longitudesB),
    '--precision', precision], { cwd: ROOT, encoding: 'utf8', timeout: 30000 }));
}

/** 引擎出参 → 装配器（buildCompatSynastryTruth）出参形状（逐字映射，禁二次算法） */
function synFromDual(dual) {
  const h = dual.harmony || {};
  const s = dual.summary || {};
  return {
    available: true,
    precision: dual.precision,
    harmonious: h.harmonious,
    hard: h.hard,
    total: h.total,
    ratio: h.ratio,
    unknown: Array.isArray(dual.unknown) ? dual.unknown : [],
    counts: (dual.tensor && dual.tensor.counts) ? dual.tensor.counts : {},
    bonds: Array.isArray(s.bonds) ? s.bonds : [],
    frictions: Array.isArray(s.frictions) ? s.frictions : [],
    signatures: (s.signatures && typeof s.signatures === 'object') ? s.signatures : {},
  };
}

const DUAL_TIMED = dualCli(CHART_A, CHART_B, 'timed');
const DUAL_DATE = dualCli(CHART_A, CHART_B, 'date_level');
const SYN_TIMED = synFromDual(DUAL_TIMED);
const SYN_DATE = synFromDual(DUAL_DATE);

const PROSE_OK = '🎯 核心结论段。\n\n⚡ 命运冲突段。\n\n💡 破局建议段。\n\n🌿 灵性指引段。';

function payloadFor(lang, truth, prose) {
  return PIPE.buildReportPayload({
    lang, reportType: 'once', truth: truth || SYN_TIMED, prose: prose || PROSE_OK, i18n: I18N[lang],
  });
}

/* ── 判据函数（正向断言与注入自测**共用** ⇒ 同源、射程完整）── */

/** 相位词条对齐判据：六语 × 五相位，值必须 ≡ 字典词干 + 该语种内联间隔符约定 */
const SPACED_LANGS = new Set(['en', 'es', 'fr', 'vi']);
function expectedAspects(lang) {
  const out = {};
  for (const [K, entry] of Object.entries(ASPECTS_SHORT)) {
    const core = entry[lang];
    out[K.toLowerCase()] = SPACED_LANGS.has(lang) ? ` ${core} ` : core;
  }
  return out;
}
/** 返回不一致清单（空 = 全对齐）；供 F 组注入自测复用 */
function judgeAspectsAligned(advisorMod) {
  const bad = [];
  const Z = advisorMod && advisorMod.SYNASTRY_I18N;
  if (!Z) return ['SYNASTRY_I18N 缺失'];
  for (const lang of LANGS) {
    const got = (Z[lang] && Z[lang].aspects) || null;
    if (!got) { bad.push(`${lang}.aspects 缺失`); continue; }
    const exp = expectedAspects(lang);
    for (const k of Object.keys(exp)) {
      const a = got[k];
      if (a !== exp[k]) bad.push(`${lang}.aspects.${k}=${JSON.stringify(a)}≠${JSON.stringify(exp[k])}`);
    }
  }
  return bad;
}

/** 卡内词条字典一致性判据（payload → 字典）；返回不一致清单 */
function judgeCardTerms(payload) {
  const bad = [];
  const refs = [];
  for (const c of payload.cards || []) {
    if (!c.title || typeof c.title !== 'string') bad.push(`card ${c.id} 无标题`);
    for (const it of c.items || []) { refs.push(it.a, it.b, it.aspect); }
  }
  for (const u of payload.truth.unknown || []) refs.push(u);
  for (const t of Object.values(payload.terms || {})) refs.push(t);
  for (const r of refs) {
    const dom = DICT.domains[r.domain];
    if (!dom || !dom[r.key]) { bad.push(`词条未回查字典命中：${r.domain}.${r.key}`); continue; }
    if (dom[r.key][payload.lang] !== r.label) {
      bad.push(`词条偏离字典：${r.domain}.${r.key}.${payload.lang}=${JSON.stringify(r.label)}`);
    }
    const slot = DICT.slots.budgets[r.slot];
    if (!slot) bad.push(`槽位未登记：${r.slot}`);
    else if (gLen(r.label) > Math.min(slot.maxGraphemes, HARD_CAP)) {
      bad.push(`词条越槽位预算：${r.domain}.${r.key}.${payload.lang} ${gLen(r.label)}>${slot.maxGraphemes}`);
    }
  }
  return bad;
}

/** 相位短语判据：text ≡ pairFmt × 注入相位槽位 × 字典行星词（禁自由机译） */
function judgePairText(payload, i18n) {
  const bad = [];
  for (const c of payload.cards || []) {
    for (const it of c.items || []) {
      const key = String(it.aspect.key).toLowerCase();
      const exp = i18n.pairFmt
        .replace('{a}', it.a.label)
        .replace('{asp}', i18n.aspects[key])
        .replace('{b}', it.b.label)
        .replace('{orb}', it.orb === null ? '?' : String(it.orb));
      if (it.text !== exp) bad.push(`${c.id} 短语偏离模板：${JSON.stringify(it.text)} ≠ ${JSON.stringify(exp)}`);
    }
  }
  return bad;
}

/* ═══════════ A 状态机 ═══════════ */

test('A1 状态机：合法链路 pending→calculating→assembling→ready，终态不可迁出', () => {
  const p = PIPE.createReportPipeline();
  assert.equal(p.state, 'pending');
  assert.equal(p.isTerminal(), false);
  assert.equal(p.advance('calculating'), true);
  assert.equal(p.advance('assembling'), true);
  assert.equal(p.advance('ready'), true);
  assert.equal(p.isTerminal(), true);
  assert.equal(p.advance('calculating'), false, 'ready 是终态，不得迁出');
  assert.equal(p.fail('late'), false, 'ready 是终态，不得再 fail');
  assert.deepEqual(p.snapshot().failures, []);
  assert.deepEqual(PIPE.PIPELINE_STATES, ['pending', 'calculating', 'assembling', 'ready', 'failed']);
  assert.deepEqual(PIPE.TERMINAL_STATES, ['ready', 'failed']);
});

test('A2 fail-closed：跳步 / 回退一律拒绝（状态不变），未知状态名抛错', () => {
  const p = PIPE.createReportPipeline();
  assert.equal(p.advance('ready'), false, 'pending 不得直接跳 ready');
  assert.equal(p.advance('assembling'), false, 'pending 不得直接跳 assembling');
  assert.equal(p.state, 'pending', '被拒迁移不得改变状态');
  assert.equal(p.advance('calculating'), true);
  assert.equal(p.advance('pending'), false, '不得回退');
  assert.equal(p.advance('ready'), false, '不得跨步');
  assert.equal(p.state, 'calculating');
  assert.throws(() => p.advance('calculatoin'), /未知状态/, '拼写错的状态名必须抛错（防静默假绿）');
  assert.equal(p.state, 'calculating');
});

test('A3 fail-closed 旁路：任意非终态可 fail，记录原因并永久锁定', () => {
  for (const hops of [[], ['calculating'], ['calculating', 'assembling']]) {
    const p = PIPE.createReportPipeline();
    for (const h of hops) p.advance(h);
    assert.equal(p.fail('engine_error'), true);
    assert.equal(p.state, 'failed');
    assert.equal(p.isTerminal(), true);
    assert.equal(p.advance('ready'), false, 'failed 是终态，不得复活');
    assert.equal(p.fail('again'), false);
    assert.deepEqual(p.snapshot().failures, ['engine_error']);
  }
  // 缺省原因不得留空串（可诊断性）
  const q = PIPE.createReportPipeline();
  q.fail('');
  assert.deepEqual(q.snapshot().failures, ['unknown']);
});

test('A4 视图模型只输出 available/degraded —— 内部瞬态零泄漏', () => {
  const vm = PIPE.toViewModel(payloadFor('zh'));
  assert.deepEqual(Object.keys(vm).sort(), ['available', 'degraded'], '视图模型键集必须恰为 available/degraded');
  const dump = JSON.stringify(vm);
  for (const s of ['pending', 'calculating', 'assembling', 'ready', 'failed']) {
    assert.ok(!dump.includes(s), `视图模型泄漏流水线内部状态：${s}`);
  }
  assert.deepEqual(PIPE.toViewModel({ truth: { available: false, degraded: false } }), { available: false, degraded: false });
  assert.deepEqual(PIPE.toViewModel(null), { available: false, degraded: false });
  assert.deepEqual(PIPE.toViewModel(undefined), { available: false, degraded: false });
});

/* ═══════════ B Payload 契约 ═══════════ */

const PAYLOAD_KEYS = ['schemaVersion', 'lang', 'reportType', 'generatedAt', 'truth', 'terms', 'labels', 'cards', 'sections'];
const TRUTH_KEYS = ['available', 'degraded', 'precision', 'degradedReason', 'harmonious', 'hard', 'total',
  'ratio', 'counts', 'unknown'];

test('B1 【契约锁定】schemaVersion=report_payload.v1 且顶层/truth 键集精确', () => {
  assert.equal(PIPE.REPORT_PAYLOAD_SCHEMA, 'report_payload.v1');
  for (const lang of LANGS) {
    const pl = payloadFor(lang);
    assert.equal(pl.schemaVersion, 'report_payload.v1');
    assert.deepEqual(Object.keys(pl).sort(), [...PAYLOAD_KEYS].sort(), `顶层键集漂移（${lang}）`);
    assert.deepEqual(Object.keys(pl.truth).sort(), [...TRUTH_KEYS].sort(), `truth 键集漂移（${lang}）`);
    assert.equal(pl.lang, lang);
    assert.equal(pl.reportType, 'once');
    // 🔴 降级不是状态：Payload 内不存在 state 字段（只有 ready 才有 Payload）
    assert.ok(!('state' in pl), 'Payload 不得携带流水线状态字段');
    // 🔴 真值层（数值/结构）与命名层（学说词条）分栏，禁混装
    assert.ok(!('terms' in pl.truth), '学说词条不得混入数值真值层');
    assert.ok(pl.terms && pl.terms.synastry && pl.terms.synastry.label, '缺学说词条层（terms）');
  }
});

test('B2 truth 逐字映射引擎张量摘要：prose 无权干涉结构化字段', () => {
  const a = payloadFor('zh', SYN_TIMED, '🎯 甲');
  const b = payloadFor('zh', SYN_TIMED, '🌿 完全不同的正文，毫不相干');
  assert.deepEqual(a.truth, b.truth, 'truth 被 LLM 正文污染（结构化真值不得由 prose 反推）');
  assert.notDeepEqual(a.sections, b.sections, 'sections 必须随正文变化（四段壳通路未生效）');
  assert.equal(a.truth.harmonious, DUAL_TIMED.tensor.harmonious);
  assert.equal(a.truth.hard, DUAL_TIMED.tensor.hard);
  assert.equal(a.truth.total, DUAL_TIMED.tensor.total);
  assert.equal(a.truth.ratio, DUAL_TIMED.harmony.ratio);
  assert.deepEqual(a.truth.counts, DUAL_TIMED.tensor.counts, 'counts 未逐字映射引擎张量');
  assert.equal(a.truth.precision, 'timed');
  assert.equal(a.truth.degraded, false);
  assert.equal(a.truth.degradedReason, null);
  // generatedAt 缺省为 null ⇒ 幂等
  assert.equal(a.generatedAt, null);
});

test('B3 缺 i18n 真值资产 ⇒ 抛错（拒绝伪造本地化字段名 / 相位槽位）', () => {
  assert.throws(() => PIPE.buildReportPayload({ lang: 'zh', truth: SYN_TIMED }), /i18n/);
  assert.throws(() => PIPE.buildReportPayload({ lang: 'zh', truth: SYN_TIMED, i18n: {} }), /i18n/);
  assert.throws(() => PIPE.buildReportPayload({ lang: 'zh', truth: SYN_TIMED, i18n: { labels: {} } }), /i18n/);
  assert.throws(() => PIPE.buildReportPayload({ lang: 'zh', truth: SYN_TIMED, i18n: { aspects: {} } }), /i18n/);
});

test('B4 四段壳解析：🎯⚡💡🌿 各归其位，粒度与前端 split 契约同源', () => {
  const secs = PIPE.parseCompatSections(PROSE_OK);
  assert.deepEqual(secs.map((s) => s.icon), PIPE.SECTION_ICONS, '四段锚漂移');
  assert.deepEqual(secs.map((s) => s.text), ['核心结论段。', '命运冲突段。', '破局建议段。', '灵性指引段。']);
  assert.deepEqual(PIPE.parseCompatSections(''), []);
  assert.deepEqual(PIPE.parseCompatSections(null), []);
  assert.deepEqual(PIPE.parseCompatSections('   '), []);
  // 无前导图标 ⇒ icon='' 且不吞正文（续写段落不作四段锚）
  const cont = PIPE.parseCompatSections('🎯 甲\n\n续写段落');
  assert.deepEqual(cont.map((s) => s.icon), ['🎯', '']);
  assert.equal(cont[1].text, '续写段落');
  // 禁第四轴：四段锚恰 4 个且不可扩张
  assert.deepEqual([...PIPE.SECTION_ICONS], ['🎯', '⚡', '💡', '🌿']);
});

/* ═══════════ C 字典取词 ═══════════ */

test('C1 【唯一取词入口】cards[] 与 truth.terms/unknown 每一项必回查字典命中', () => {
  for (const lang of LANGS) {
    const pl = payloadFor(lang);
    assert.ok(pl.cards.length > 0, `${lang}：可用真值却零张量卡`);
    assert.deepEqual(judgeCardTerms(pl), [], `${lang}：卡内词条偏离字典`);
    assert.deepEqual(judgePairText(pl, I18N[lang]), [], `${lang}：相位短语偏离模板`);
  }
});

test('C2 报告字段名（labels）逐字取自注入真值资产 —— 本模块零本地化文案', () => {
  for (const lang of LANGS) {
    const pl = payloadFor(lang);
    for (const k of Object.keys(pl.labels)) {
      const src = I18N[lang].labels[k];
      if (src == null) continue;
      assert.equal(pl.labels[k], src, `labels.${k} 非取自注入资产（${lang}）`);
    }
    for (const k of ['ratio', 'bonds', 'frictions', 'signatures', 'unknown', 'timed', 'dateLevel']) {
      assert.ok(pl.labels[k] && pl.labels[k].length > 0, `${lang}：labels.${k} 缺失`);
    }
  }
});

test('C3 五相位词条零内联：ai-advisor 六语全部由字典派生物取词', () => {
  const code = stripJs(readSrc('api/ai-advisor.js'));
  assert.ok(/from\s+'\.\/synastry-terms\.generated\.js'/.test(code), 'ai-advisor 未引字典派生物');
  assert.ok(/SYNASTRY_ASPECTS/.test(code), 'ai-advisor 未消费 SYNASTRY_ASPECTS');
  // 六语必须全部走派生函数，不得再出现内联相位对象字面量
  const calls = code.match(/_synAspectTerms\('(zh|en|es|fr|th|vi)'\)/g) || [];
  assert.equal(calls.length, 6, `相位取词调用应为 6 次（六语），实为 ${calls.length}`);
  for (const lang of LANGS) {
    assert.ok(code.includes(`_synAspectTerms('${lang}')`), `${lang} 未走字典派生`);
  }
  assert.ok(!/aspects:\s*\{/.test(code), 'ai-advisor 仍存在内联相位对象字面量（硬编码飞地复辟）');
});

test('C4 【相位槽位锁定】六语 aspects ≡ 字典词干 ± 语种内联间隔符', () => {
  assert.deepEqual(judgeAspectsAligned(ADV), [], '相位槽位偏离字典（或间隔符约定漂移）');
  // 与字典派生物逐字同源
  const G = JSON.parse(JSON.stringify(ASPECTS_SHORT));
  for (const lang of LANGS) {
    for (const k of Object.keys(G)) {
      const core = G[k][lang];
      assert.ok(I18N[lang].aspects[k.toLowerCase()].includes(core), `${lang}.${k} 未含字典词干`);
      assert.equal(I18N[lang].aspects[k.toLowerCase()].trim(), core, `${lang}.${k} 词干被改动`);
    }
  }
});

/* ═══════════ D 槽位预算 ═══════════ */

test('D1 槽位预算：卡内词条 ≤ 所属槽位预算（六语，泰/越重点）', () => {
  const domains = Object.keys(DICT.slots.assignment);
  for (const lang of LANGS) {
    const pl = payloadFor(lang);
    assert.deepEqual(judgeCardTerms(pl), [], `${lang}：词条越预算或偏离字典`);
    // terms 槽位亦须受预算约束
    for (const t of Object.values(pl.terms)) {
      const cap = DICT.slots.budgets[t.slot].maxGraphemes;
      assert.ok(gLen(t.label) <= Math.min(cap, HARD_CAP), `${lang}：${t.domain}.${t.key} 越 ${t.slot} 预算`);
    }
  }
  assert.ok(domains.includes('familiar'), 'familiar 域未声明槽位归属');
});

test('D2 字素裁剪不劈裂组合字素簇（泰语声调符 / 越语变音符号）', () => {
  // 字素 ≠ UTF-16 码元：ว(U+0E27) + ั(U+0E31) 合成 1 个字素簇
  assert.equal(gLen('วั'), 1);
  assert.equal('วั'.length, 2);
  assert.equal(gLen('วันดี'), 3);
  assert.equal(PIPE.graphemes('วันดี'), 3);
  assert.equal(PIPE.fitGraphemes('วันดี', 2), 'วั…', '裁剪劈裂了组合字素簇');
  assert.equal(PIPE.graphemes(PIPE.fitGraphemes('วันดี', 2)), 2);
  // 未超预算 ⇒ 原样返回（绝不无谓截断）
  const thai = DICT.domains.planets.Jupiter.th;
  assert.equal(PIPE.fitGraphemes(thai, 999), thai);
  assert.equal(PIPE.fitGraphemes('', 3), '');
  assert.equal(PIPE.fitGraphemes(null, 3), '');
  // 越语（拉丁 + 变音符）亦按字素计数
  const vi = DICT.domains.planets.Uranus.vi;
  assert.ok(PIPE.graphemes(vi) <= gLen(vi) + 1);
  assert.equal(PIPE.graphemes(PIPE.fitGraphemes(vi, 5)), 5);
});

test('D3 渲染层三道防线齐备：预算取自字典派生物 + 字素裁剪 + CSS 兜底', () => {
  const layout = readSrc('web/src/lib/reportLayout.ts');
  const canvas = readSrc('web/src/components/CompatReportCanvas.tsx');
  const pkgApp = readSrc('web/src/App.tsx');
  assert.ok(/from '\.\/algos\/astroTerms\.generated'/.test(layout), 'reportLayout 未引字典派生物');
  assert.ok(/ASTRO_TERMS\.slots\.budgets/.test(layout), '槽位预算未从字典派生');
  assert.ok(/HARD_CAP\s*=\s*SLOT_BUDGETS\.hardCap/.test(layout), 'hardCap 未从字典派生');
  assert.ok(/Intl\.Segmenter/.test(layout), '缺字素分割器');
  assert.ok(/export function fitGraphemes/.test(layout) && /export function clampToSlot/.test(layout),
    '缺字素裁剪 / 槽位裁剪导出');
  assert.ok(/REPORT_PAYLOAD_SCHEMA = 'report_payload\.v1'/.test(layout), '前端契约版本未锁定');
  assert.ok(/isCompatReportPayload/.test(layout), '缺运行时形状守卫');
  // 防线 ③：CSS 断行 / 截断兜底
  assert.ok(/overflowWrap: 'anywhere'/.test(canvas), '画布缺 overflow-wrap 兜底');
  assert.ok(/wordBreak: 'break-word'/.test(canvas), '画布缺 word-break 兜底');
  assert.ok(/minWidth: 0/.test(canvas), '画布缺 flex 收缩兜底（长词撑爆网格）');
  assert.ok(/clampToSlot\(/.test(canvas), '画布未做字素裁剪');
  // 前端接线：有 Payload ⇒ 画布；无 ⇒ 纯文本零回归
  assert.ok(/isCompatReportPayload\(data\.payload\)/.test(pkgApp), 'App 未做 Payload 形状守卫');
  assert.ok(/<CompatReportCanvas/.test(pkgApp), 'App 未渲染合盘画布');
  assert.ok(/reportText\.split\('\\n\\n'\)/.test(pkgApp), '无 Payload 时的回退渲染被误删（零回归契约）');
});

/* ═══════════ E 端到端向量 V1–V4 ═══════════ */

test('E1 【V1 双侧精确建盘 timed】Payload truth ≡ 引擎张量，卡片词条全查字典命中', () => {
  const pl = payloadFor('zh');
  assert.equal(pl.truth.available, true);
  assert.equal(pl.truth.degraded, false);
  assert.equal(pl.truth.precision, 'timed');
  assert.deepEqual(pl.truth.unknown, [], 'timed 档不得出现未知因子');
  assert.deepEqual(judgeCardTerms(pl), []);
  assert.deepEqual(judgePairText(pl, I18N.zh), []);
  const kinds = pl.cards.map((c) => c.id);
  assert.ok(kinds.includes('bonds'), '缺柔和相位卡');
  assert.ok(kinds.includes('frictions'), '缺张力相位卡');
  for (const c of pl.cards) {
    assert.ok(c.items.length > 0, `${c.id} 空卡（不得产出空壳）`);
    assert.ok(c.title.length > 0, `${c.id} 无标题`);
  }
});

test('E2 【V2 单侧缺时 date_level】如实降级：剔月亮 + degraded 标记（非状态）', () => {
  const pl = payloadFor('en', SYN_DATE);
  assert.equal(pl.truth.available, true);
  assert.equal(pl.truth.degraded, true, 'date_level 未如实标记降级');
  assert.equal(pl.truth.precision, 'date_level');
  assert.equal(pl.truth.degradedReason, 'date_level');
  const keys = pl.truth.unknown.map((u) => u.key);
  assert.ok(keys.includes('Moon'), 'date_level 未如实剔除月亮');
  assert.ok(!keys.includes('Sun'), '太阳不应被剔除');
  assert.equal(pl.truth.unknown[0].label, DICT.domains.planetsShort.Moon.en, '未知因子未按字典取词');
  assert.ok(pl.truth.total < DUAL_TIMED.tensor.total, 'date_level 相位条数未随剔星下降');
  assert.deepEqual(judgeCardTerms(pl), []);
  const vm = PIPE.toViewModel(pl);
  assert.deepEqual(vm, { available: true, degraded: true }, '视图模型未如实反映降级');
});

test('E3 【V3 全无真值】available:false / 零数值断言 / 零张量卡 / 纯逻辑核零外部调用', () => {
  const pl = PIPE.buildReportPayload({
    lang: 'zh', reportType: 'once',
    truth: { available: false, reason: 'no_time_truth' },
    prose: '🌿 退回传统合盘论述。', i18n: I18N.zh,
  });
  assert.equal(pl.truth.available, false);
  assert.equal(pl.truth.degraded, false);
  assert.equal(pl.truth.precision, null);
  assert.equal(pl.truth.degradedReason, 'no_time_truth');
  assert.equal(pl.truth.total, 0);
  assert.equal(pl.truth.harmonious, 0);
  assert.equal(pl.truth.hard, 0);
  assert.equal(pl.truth.ratio, null);
  assert.deepEqual(pl.cards, [], '不可用却产出了张量卡（静默伪造）');
  assert.deepEqual(pl.truth.counts,
    { conjunction: 0, sextile: 0, square: 0, trine: 0, opposition: 0 });
  assert.ok(pl.sections.length > 0, '无真值不得阻断报告交付（四段壳仍应产出）');
  assert.deepEqual(PIPE.toViewModel(pl), { available: false, degraded: false });
  // 🔴 纯逻辑核：零子进程 / 零网络（源码级）
  const src = stripJs(readSrc('lib/reportPipeline.mjs'));
  for (const bad of ['child_process', 'execFileSync', 'execSync', 'spawn(', 'node:http', 'node:https', 'fetch(']) {
    assert.ok(!src.includes(bad), `纯逻辑核掺入外部调用：${bad}`);
  }
  // 🔴 禁静默伪造：缺相位名/缺星球键的条目必须整条剔除，不得补 0 冒充
  const junk = PIPE.buildReportPayload({
    lang: 'zh', reportType: 'once', i18n: I18N.zh,
    truth: { available: true, precision: 'timed', harmonious: 1, hard: 0, total: 1, ratio: 1,
      bonds: [{ a: 'Venus', b: 'Nibiru', aspect: 'trine', orb: 1 },
        { a: 'Venus', b: 'Mars', aspect: 'quincunx', orb: 1 },
        { a: 'Venus', b: 'Mars', aspect: 'trine', orb: 1 }] },
  });
  const items = junk.cards.reduce((n, c) => n + c.items.length, 0);
  assert.equal(items, 1, '未登记星球/相位名的条目未被剔除（静默伪造风险）');
});

test('E4 【V4 同张量 × 六语】词条逐语 ≡ 字典，短语零自由机译，语种不得串写', () => {
  for (const lang of LANGS) {
    const i18n = I18N[lang];
    const pl = payloadFor(lang);
    assert.deepEqual(judgeCardTerms(pl), [], `${lang}：词条偏离字典`);
    assert.deepEqual(judgePairText(pl, i18n), [], `${lang}：短语偏离模板（疑似自由机译）`);
    assert.deepEqual(judgeAspectsAligned(ADV), []);
    for (const c of pl.cards) {
      for (const it of c.items) {
        if (lang !== 'zh') assert.ok(!CJK.test(it.text), `${lang} 卡内短语串入汉字`);
        if (lang === 'th') assert.ok(THAI.test(it.text), `${lang} 卡内短语缺泰文`);
        assert.ok(!THAI.test(it.a.label) || lang === 'th', `${lang}：非泰语词条串入泰文`);
      }
    }
  }
  // 同张量 ⇒ 六语的结构化真值必须完全一致（只有命名/词条语言不同）
  // 🔴 判据射程：只比**数值与结构**投影（unknown 取 key、cards 取 key 三元组）；
  //    本地化 label 天然随语种变化，不得混入本条（否则会把正确行为误判为「本地化污染」）。
  const structural = (pl) => JSON.stringify({
    available: pl.truth.available,
    degraded: pl.truth.degraded,
    precision: pl.truth.precision,
    degradedReason: pl.truth.degradedReason,
    harmonious: pl.truth.harmonious,
    hard: pl.truth.hard,
    total: pl.truth.total,
    ratio: pl.truth.ratio,
    counts: pl.truth.counts,
    unknownKeys: pl.truth.unknown.map((u) => u.key),
    cards: pl.cards.map((c) => ({ id: c.id, items: c.items.map((it) => [it.a.key, it.aspect.key, it.b.key, it.orb, it.polarity]) })),
  });
  const projections = LANGS.map((l) => structural(payloadFor(l)));
  for (const p of projections) assert.equal(p, projections[0], '六语结构化真值不一致（本地化污染了真值层）');
  // 而命名层（词条/字段名）必须逐语不同（否则等于没本地化）
  const names = LANGS.map((l) => payloadFor(l).terms.synastry.label);
  assert.equal(new Set(names).size, LANGS.length, '六语学说词条未各自本地化');
});

/* ═══════════ F 注入反漂移（同源判据）═══════════ */

/** 把资产复制进临时目录做**变异导入**（相对引用链完整保留） */
function loadAdvisorMutated(mutateGenerated, mutateAdvisor) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g40-inject-'));
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}', 'utf8');
  fs.writeFileSync(path.join(dir, 'synastry-terms.generated.js'),
    (mutateGenerated || ((s) => s))(readSrc('api/synastry-terms.generated.js')), 'utf8');
  fs.writeFileSync(path.join(dir, 'ai-advisor.js'),
    (mutateAdvisor || ((s) => s))(readSrc('api/ai-advisor.js')), 'utf8');
  return import(pathToFileURL(path.join(dir, 'ai-advisor.js')).href);
}

/** 同上，针对纯逻辑核（复制 astroTerms.js + 字典以保持相对布局） */
function loadPipelineMutated(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g40-inject-'));
  fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'astro'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}', 'utf8');
  fs.copyFileSync(path.join(ROOT, 'astroTerms.js'), path.join(dir, 'astroTerms.js'));
  fs.copyFileSync(path.join(ROOT, 'astro', 'astro_terms_dict.json'),
    path.join(dir, 'astro', 'astro_terms_dict.json'));
  fs.writeFileSync(path.join(dir, 'lib', 'reportPipeline.mjs'), mutate(readSrc('lib/reportPipeline.mjs')), 'utf8');
  return import(pathToFileURL(path.join(dir, 'lib', 'reportPipeline.mjs')).href);
}

test('F1 注入：字典派生物相位词被手改 ⇒ C4 判据必红（还原后复绿）', async () => {
  assert.deepEqual(judgeAspectsAligned(ADV), [], '前置：当前基线必须全对齐');
  const mod = await loadAdvisorMutated((s) => s.replace('"ตรีโกณ"', '"ตรีโกณX"'));
  const bad = judgeAspectsAligned(mod);
  assert.ok(bad.some((x) => x.startsWith('th.aspects.trine')), `注入未被击落：${JSON.stringify(bad)}`);
  // ② 间隔符约定漂移（拉丁语族丢失内联空格）—— 变异必须打在**消费者源码**上
  const mod2 = await loadAdvisorMutated(null,
    (s) => s.replace("new Set(['en', 'es', 'fr', 'vi'])", "new Set(['en', 'es', 'fr'])"));
  assert.ok(judgeAspectsAligned(mod2).some((x) => x.startsWith('vi.aspects.')), 'vi 间隔符漂移未被击落');
  assert.deepEqual(judgeAspectsAligned(ADV), [], '还原校对：基线须复绿');
});

test('F2 注入：降级标记被抹 / 不可用仍造卡 ⇒ B、E 判据必红', async () => {
  const m1 = await loadPipelineMutated((s) => s.replace(
    "const degraded = available && precision === 'date_level';", 'const degraded = false;'));
  const p1 = m1.buildReportPayload({ lang: 'en', reportType: 'once', truth: SYN_DATE, prose: PROSE_OK, i18n: I18N.en });
  assert.equal(p1.truth.degraded, false, '注入生效确认');
  assert.equal(payloadFor('en', SYN_DATE).truth.degraded, true, '基线判据未锁定降级标记（判据失能）');
  assert.deepEqual(PIPE.toViewModel(payloadFor('en', SYN_DATE)), { available: true, degraded: true });

  const m2 = await loadPipelineMutated((s) => s.replace(
    'cards: available ? _buildCards(truth, i18n, lang) : []', 'cards: _buildCards(truth, i18n, lang)'));
  const noTruth = { available: false, reason: 'no_time_truth', bonds: [{ a: 'Venus', b: 'Mars', aspect: 'trine', orb: 1 }] };
  const p2 = m2.buildReportPayload({ lang: 'zh', reportType: 'once', prose: '🎯 基线', i18n: I18N.zh, truth: noTruth });
  assert.ok(p2.cards.length > 0, '注入生效确认');
  assert.deepEqual(
    PIPE.buildReportPayload({ lang: 'zh', reportType: 'once', prose: '🎯 基线', i18n: I18N.zh, truth: noTruth }).cards,
    [], '基线判据未拒绝「不可用却造卡」');
});

test('F3 注入：真值映射被替换为常量 ⇒ B2 判据必红（禁二次算法/伪造）', async () => {
  const m = await loadPipelineMutated((s) => s.replace(
    'harmonious: _num(truth.harmonious),', 'harmonious: 0,'));
  const pl = m.buildReportPayload({ lang: 'zh', reportType: 'once', truth: SYN_TIMED, prose: PROSE_OK, i18n: I18N.zh });
  assert.equal(pl.truth.harmonious, 0, '注入生效确认');
  assert.notEqual(pl.truth.harmonious, DUAL_TIMED.tensor.harmonious, '注入未改变读数（无法证明判据射程）');
  assert.equal(payloadFor('zh').truth.harmonious, DUAL_TIMED.tensor.harmonious, '基线判据未锁定真值映射');
});

/* ═══════════ G 段位守备 ═══════════ */

test('G1 长链守备：Gate 40 已入编 test:astro，且位于收口位（e40-compat）之前', () => {
  const segs = String(PKG.scripts['test:astro']).split(' && ');
  const iGate = segs.findIndex((s) => s.includes('audit-e41plus-gate40-report-pipeline'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((s) => s.includes('audit_v492_peak_window.py'));
  assert.notEqual(iGate, -1, 'Gate 40 未入编 test:astro');
  assert.ok(segs.length >= 39, `段数须 ≥ 39（38 + Gate 40），实为 ${segs.length}`);
  assert.ok(iGate < iCap, 'Gate 40 必须插在收口位（e40-compat）之前，否则段位冲突');
  assert.equal(iCap, segs.length - 2, 'e40-compat 必须保持收口位（倒数第二段）');
  assert.equal(iPy, segs.length - 1, '链尾必须为 python 段');
  // 派生物双镜像同源（Gate 39 md5 铁律的延续）
  assert.equal(readSrc('api/synastry-terms.generated.js'), readSrc('web/api/synastry-terms.generated.js'),
    '合婚术语派生物双份必须逐字节一致');
});
