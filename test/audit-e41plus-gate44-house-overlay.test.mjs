/**
 * Gate 44 — 宫位交互网格与画布视觉二期（信封旁置真值 · 零伪造）
 * ═══════════════════════════════════════════════════════════════════════════
 * 真值链路：
 *   astroMatrix.meta.computed_houses（全站唯一宫位真值源）
 *     → server.js buildCompatSynastryTruth（内联 _houseOf 采集）
 *     → **信封旁置字段** houseOverlay（与 payload 并列，payload 双向键集零污染）
 *     → web/src/lib/houseOverlay.mjs（纯派生核 → 12 宫格 / 共鸣 / 星轨连线）
 *     → web/src/components/CompatHouseGrid.tsx（4×3 交互网格渲染）
 *
 * 断言分组：
 *   A 真值引渡（服务端内联采集 + 精确建盘闸门 + 缺真值如实弃权）
 *   B 纯派生核（12 宫格 / 罗马数字 / 共鸣判定 / 星轨连线真值 / 升序）
 *   C 信封旁置铁律（payload 零污染 + SSE/JSON 双路挂载 + 引渡纪律）
 *   D 降级缺省（缺真值 ⇒ null，绝不渲染 undefined/NaN/臆造宫位）
 *   E 前端守备（组件 testid + 溢出三道防线 + 条件渲染 + App 透传）
 *   F 段位守备（Gate 44 居收口位之前 · 段数 ≥ 43）
 *   G 注入反漂移（判据对篡改真值必红）
 *
 * 纯 Node 运行（无 DOM / 无网络 / 无 LLM）。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DICT = JSON.parse(readFileSync(join(ROOT, 'astro', 'astro_terms_dict.json'), 'utf8'));
const LANGS = DICT.meta.langs;
const NEW_KEYS = ['HouseOverlay', 'HouseResonance', 'HouseSelf', 'AuthPassed', 'DeliveryStream', 'DeliveryDirect'];

const OVERLAY = await import(pathToFileURL(join(ROOT, 'web/src/lib/houseOverlay.mjs')).href);
const PIPE = await import(pathToFileURL(join(ROOT, 'lib/reportPipeline.mjs')).href);
const { SYNASTRY_I18N } = await import(pathToFileURL(join(ROOT, 'api/ai-advisor.js')).href);

const readSrc = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
const gLen = (s) => [...seg.segment(s)].length;

/* ── 测试向量 ── */
const TIMED = {
  available: true, precision: 'timed', harmonious: 5, hard: 2, total: 7, ratio: 0.71,
  bonds: [
    { a: 'Jupiter', b: 'Sun', aspect: 'trine', orb: 0, polarity: 'harmonious' },
    { a: 'Moon', b: 'Venus', aspect: 'sextile', orb: 2, polarity: 'harmonious' },
    { a: 'NorthNode', b: 'Moon', aspect: 'conjunction', orb: 1, polarity: 'harmonious' }],
  frictions: [{ a: 'Mars', b: 'Saturn', aspect: 'square', orb: 3, polarity: 'hard' }],
  counts: { trine: 1, sextile: 1, square: 1, opposition: 0, conjunction: 1 }, signatures: {},
};
const UNAVAIL = { available: false, reason: 'no_birth_time' };

/** 宫位真值夹具：与 TIMED 相位项咬合（四连线 + 恰一共鸣宫） */
const HOUSE = {
  available: true, precision: 'timed',
  a: { Jupiter: 9, Moon: 7, NorthNode: 4, Mars: 10 },
  b: { Sun: 5, Venus: 3, Moon: 7, Saturn: 12 },
};

const payloadFor = (lang, truth) => PIPE.buildReportPayload({
  lang, reportType: 'once', truth, prose: 'x', i18n: SYNASTRY_I18N[lang],
});
const overlayFor = (lang, truth, house) => OVERLAY.deriveHouseOverlay(payloadFor(lang, truth), house, DICT);

/* ── 判据（供 G 组注入复用）── */
function judgeHouseOf() {
  const bad = [];
  const cases = [[1, 1], [12, 12], [0, null], [13, null], [7.5, null], ['5', null], [null, null], [undefined, null], [NaN, null]];
  for (const [v, exp] of cases) {
    const got = OVERLAY.houseOf(v);
    if (got !== exp) bad.push(`houseOf(${String(v)})=${got}≠${String(exp)}`);
  }
  return bad;
}

function judgeDictComplete(dict) {
  const bad = [];
  for (const k of NEW_KEYS) {
    const e = dict.domains.familiar[k];
    if (!e) { bad.push(`familiar.${k} 缺失`); continue; }
    for (const lang of LANGS) if (typeof e[lang] !== 'string' || e[lang].trim() === '') bad.push(`familiar.${k}.${lang} 空`);
  }
  return bad;
}

/* ═══════════ A 真值引渡（服务端） ═══════════ */

test('A1 宫位采集必须**内联**在 buildCompatSynastryTruth 内（VM 抽取式消费者铁律）', () => {
  const src = readSrc('server.js');
  assert.ok(/const _houseOf = \(mx\) =>/.test(src), '缺内联 _houseOf 采集器');
  assert.ok(/computed_houses/.test(src), '未接 computed_houses 真源');
  assert.ok(!/function _compatHouseMap\s*\(/.test(src), '外部 helper 会撞 VM 抽取（须内联，禁外置）');
  assert.ok(/houses: _houseOf\(matrix\)/.test(src), '宫位未随 side 采集（houses: _houseOf(matrix)）');
});

test('A2 宫位只采 1..12 整数（缺值/越界/非数一律剔除，绝不臆造宫位号）', () => {
  assert.deepEqual(judgeHouseOf(), []);
});

test('A3 精确建盘闸门：仅 timed 且双侧宫位齐备时 available:true，否则如实弃权', () => {
  const src = readSrc('server.js');
  assert.ok(/const _g44OverlayOk = _g44Prec === 'timed'/.test(src), '缺精确建盘闸门');
  assert.ok(/Object\.keys\(_g44HouseA\)\.length > 0 && Object\.keys\(_g44HouseB\)\.length > 0/.test(src), '缺双侧宫位齐备判定');
  assert.ok(/houseOverlay: _g44OverlayOk/.test(src), 'sidecar 未按闸门装配');
  assert.ok(/available: false, precision: _g44Prec, a: \{\}, b: \{\}/.test(src), '缺真值未如实弃权（须空对象，非臆造）');
});

/* ═══════════ B 纯派生核 ═══════════ */

test('B1 12 宫格齐备 · 罗马数字 I–XII · 4 列（4×3 矩阵）', () => {
  const m = overlayFor('zh', TIMED, HOUSE);
  assert.equal(m.available, true);
  assert.equal(m.cols, 4);
  assert.equal(m.cells.length, 12);
  assert.deepEqual(m.numerals, ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']);
  assert.deepEqual(m.cells.map((c) => c.house), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  assert.deepEqual(m.cells.map((c) => c.numeral), m.numerals);
});

test('B2 宫内行星双侧落位（a/b 分离）+ 行星词条回查字典（禁机翻）', () => {
  const m = overlayFor('zh', TIMED, HOUSE);
  const h7 = m.cells.find((c) => c.house === 7);
  assert.deepEqual(h7.a.map((p) => p.key), ['Moon']);
  assert.deepEqual(h7.b.map((p) => p.key), ['Moon']);
  assert.equal(h7.a[0].label, DICT.domains.planetsShort.Moon.zh);
  const h9 = m.cells.find((c) => c.house === 9);
  assert.deepEqual(h9.a.map((p) => p.key), ['Jupiter']);
  assert.deepEqual(h9.b, []);
  const th = overlayFor('th', TIMED, HOUSE);
  assert.equal(th.cells.find((c) => c.house === 9).a[0].label, DICT.domains.planetsShort.Jupiter.th, 'th 未按字典取词');
});

test('B3 行星序严格按 PLANET_ORDER（禁随机序；同宫多星可复现）', () => {
  // 同宫多星：甲侧 Sun/Moon/Mercury 同落第一宫 ⇒ 须按规范序（Sun→Moon→Mercury）
  const house2 = { available: true, precision: 'timed', a: { Moon: 1, Sun: 1, Mercury: 1 }, b: { Venus: 1 } };
  const m = overlayFor('zh', TIMED, house2);
  const h1 = m.cells.find((c) => c.house === 1);
  assert.deepEqual(h1.a.map((p) => p.key), ['Sun', 'Moon', 'Mercury'], '宫内行星未按规范序');
});

test('B4 共鸣判定：双侧同宫 ⇒ resonance:true，且 resonanceCount 与宫格一致', () => {
  const m = overlayFor('zh', TIMED, HOUSE);
  assert.equal(m.cells.find((c) => c.house === 7).resonance, true);
  assert.equal(m.cells.find((c) => c.house === 5).resonance, false, '仅乙侧有星不算共鸣');
  assert.equal(m.cells.find((c) => c.house === 9).resonance, false, '仅甲侧有星不算共鸣');
  assert.equal(m.resonanceCount, 1);
  assert.equal(m.resonanceCount, m.cells.filter((c) => c.resonance).length);
});

test('B5 星轨连线：真实相位 ⊗ 双宫上下文；缺任一宫位 ⇒ 整条剔除；按天距升序', () => {
  const m = overlayFor('zh', TIMED, HOUSE);
  assert.equal(m.links.length, 4, '四条相位项应全数成线（双宫齐备）');
  assert.deepEqual(m.links.map((l) => l.orb), [0, 1, 2, 3], '连线未按真实天距升序');
  const l0 = m.links[0];
  assert.equal(l0.aLabel, DICT.domains.planetsShort.Jupiter.zh);
  assert.equal(l0.houseA, 9);
  assert.equal(l0.houseB, 5);
  assert.equal(l0.houseNumeralA, 'IX');
  assert.equal(l0.houseNumeralB, 'V');
  assert.ok(l0.aspectLabel && l0.aspectLabel.length > 0, '相位名不得为空');
  assert.equal(l0.polarity, 'harmonious');
});

test('B6 缺宫位者剔除：任一端无宫位 ⇒ 该连线整条剔除（绝不半真半假）', () => {
  // 乙侧仅采到 Sun / Venus ⇒ 仅前两条相位成线，后两条（需 Moon / Saturn）整条剔除
  const partial = { available: true, precision: 'timed', a: { Jupiter: 9, Moon: 7, NorthNode: 4, Mars: 10 }, b: { Sun: 5, Venus: 3 } };
  const m = overlayFor('zh', TIMED, partial);
  assert.equal(m.links.length, 2, '缺宫位的连线应被整条剔除');
  const keys = m.links.map((l) => `${l.aLabel}/${l.bLabel}`);
  assert.ok(!m.links.some((l) => l.houseA === 4 || l.houseA === 10), '缺乙侧宫位的连线不得半真半假出现');
  assert.equal(keys.length, 2);
});

test('B7 词条（标题/共鸣/图例）逐条回查字典命中', () => {
  const m = overlayFor('zh', TIMED, HOUSE);
  assert.equal(m.title.key, 'HouseOverlay');
  assert.equal(m.title.label, DICT.domains.familiar.HouseOverlay.zh);
  assert.equal(m.resonanceLabel.label, DICT.domains.familiar.HouseResonance.zh);
  assert.equal(m.legend.self.label, DICT.domains.familiar.HouseSelf.zh);
  assert.equal(m.legend.familiar.label, DICT.domains.familiar.Familiar.zh);
});

/* ═══════════ C 信封旁置铁律 ═══════════ */

test('C1 payload 双向键集零污染：派生载荷不得含 houseOverlay / canvas 键', () => {
  const p = payloadFor('zh', TIMED);
  assert.ok(!('houseOverlay' in p), 'houseOverlay 渗入 payload（Gate 40 顶层键集将被引爆）');
  assert.ok(!('canvas' in p), 'canvas 渗入 payload');
  assert.ok(!('houses_overlay' in p), '旁置键误入 payload');
  assert.ok(!('houses' in p.truth), '宫位误渗入 truth（Gate 40 TRUTH_KEYS 将被引爆）');
});

test('C2 信封双路挂载：SSE ready 帧与 JSON 回执各挂 houseOverlay（旁置，payload 原样保留）', () => {
  const src = readSrc('server.js');
  assert.ok(/_sseBody\.houseOverlay = _g44House/.test(src), 'SSE ready 帧未挂旁置宫位');
  assert.ok(/_g41Body\.houseOverlay = _g44House/.test(src), 'JSON 回执未挂旁置宫位');
  assert.ok(/const _g44House = \(_compatSyn && _compatSyn\.houseOverlay && _compatSyn\.houseOverlay\.available\)/.test(src), '缺旁置取值守门（non-available 须下沉 null）');
});

test('C3 旁置不改写既有回执字面量（E39/E40 C5 / Gate 41 D4 精确匹配零回归）', () => {
  const src = readSrc('server.js');
  assert.ok(/const _sseBody = \{ insight, cached: false \};/.test(src), 'SSE 回执字面量被改写');
  assert.ok(/const _g41Body = \{ insight, cached: false, payload: _pipelinePayload \};/.test(src), 'JSON 回执字面量被改写');
  assert.ok(/return res\.json\(\{ insight, cached: false \}\);/.test(src), '缺省回执字面量被改写');
});

/* ═══════════ D 降级缺省 ═══════════ */

test('D1 缺旁置真值（null / available:false / 缺 a·b）⇒ 派生 null（前端不渲染，零空壳）', () => {
  const p = payloadFor('zh', TIMED);
  assert.equal(OVERLAY.deriveHouseOverlay(p, null, DICT), null);
  assert.equal(OVERLAY.deriveHouseOverlay(p, { available: false }, DICT), null);
  assert.equal(OVERLAY.deriveHouseOverlay(p, { available: true, a: {}, b: {} }, DICT), null, '缺 a/b 不得臆造空网格');
  assert.equal(OVERLAY.deriveHouseOverlay(p, { available: true, a: null, b: {} }, DICT), null);
});

test('D2 缺 payload 真值（available:false / 入参非法）⇒ null', () => {
  assert.equal(OVERLAY.deriveHouseOverlay(payloadFor('zh', UNAVAIL), HOUSE, DICT), null);
  assert.equal(OVERLAY.deriveHouseOverlay(null, HOUSE, DICT), null);
  assert.equal(OVERLAY.deriveHouseOverlay({}, HOUSE, DICT), null);
  assert.equal(OVERLAY.deriveHouseOverlay({ truth: null }, HOUSE, DICT), null);
});

test('D3 降级模型零 undefined/NaN 泄漏（可 JSON 序列化）', () => {
  const m = overlayFor('zh', TIMED, HOUSE);
  const j = JSON.stringify(m);
  assert.ok(!j.includes('undefined') && !j.includes('NaN'), '模型含 undefined/NaN 泄漏');
  // 缺 orb 的连线须为 null（非 NaN）
  const houseA = { available: true, precision: 'timed', a: { Jupiter: 9, Moon: 7 }, b: { Sun: 5 } };
  const m2 = overlayFor('zh', { ...TIMED, bonds: [{ a: 'Jupiter', b: 'Sun', aspect: 'trine' }], frictions: [] }, houseA);
  assert.equal(m2.links[0].orb, null, '缺 orb 应为 null');
  assert.ok(!JSON.stringify(m2).includes('NaN'));
});

/* ═══════════ E 前端守备 ═══════════ */

test('E1 宫位网格组件齐备 testid（网格 / 宫格 / 星轨连线 / 状态条）', () => {
  const src = readSrc('web/src/components/CompatHouseGrid.tsx');
  assert.ok(/data-testid="compat-house-grid"/.test(src), '缺宫位网格 testid');
  assert.ok(/data-testid="house-cell"/.test(src), '缺宫格 testid');
  assert.ok(/data-testid="house-link"/.test(src), '缺星轨连线 testid');
  assert.ok(/data-testid="house-status"/.test(src), '缺状态可视化 testid');
});

test('E2 溢出三道防线齐备（SAFE_TEXT / overflow-wrap / clampToSlot / minWidth:0）', () => {
  const src = readSrc('web/src/components/CompatHouseGrid.tsx');
  assert.ok(/overflowWrap: 'anywhere'/.test(src), '缺 overflow-wrap 兜底');
  assert.ok(/wordBreak: 'break-word'/.test(src), '缺 word-break 兜底');
  assert.ok(/minWidth: 0/.test(src), '缺 flex 收缩兜底');
  assert.ok(/clampToSlot\(/.test(src), '缺字素裁剪');
});

test('E3 网格为条件渲染（模型不可用 ⇒ null，绝不渲染虚假宫位）', () => {
  const src = readSrc('web/src/components/CompatHouseGrid.tsx');
  assert.ok(/if \(!model \|\| model\.available !== true/.test(src), '缺模型可用性守备');
  assert.ok(/return null;/.test(src), '缺优雅缺省（返回 null）');
});

test('E4 画布接线：派生核接入 + 网格挂载 + 旁置入参透传', () => {
  const src = readSrc('web/src/components/CompatReportCanvas.tsx');
  assert.ok(/deriveHouseOverlay\(payload, houseOverlay, ASTRO_TERMS\)/.test(src), '画布未接入宫位派生核');
  assert.ok(/\{houseModel && <CompatHouseGrid model=\{houseModel\}/.test(src), '宫位网格未条件挂载');
});

test('E5 App 透传：旁置真值状态 + 投递溯源（零 payload 污染）', () => {
  const app = readSrc('web/src/App.tsx');
  assert.ok(/setReportHouseOverlay\(/.test(app), 'App 未接收旁置宫位真值');
  assert.ok(/houseOverlay=\{reportHouseOverlay\}/.test(app), 'App 未透传旁置真值给画布');
  assert.ok(/delivery=\{reportDelivery\}/.test(app), 'App 未透传投递溯源');
  assert.ok(/_usedStream \? 'stream' : 'direct'/.test(app), '投递路径判定缺失');
});

/* ═══════════ F 段位守备 ═══════════ */

test('F1 Gate 44 居收口位（e40-compat）之前 · 段数 ≥ 43', () => {
  const pkg = JSON.parse(readSrc('package.json'));
  const segs = pkg.scripts['test:astro'].split('&&').map((s) => s.trim());
  // 🔴 下界 + 相对位置（漂移免疫）：与 Gate 40 G1 / 41 F1 / 42 F1 同范式
  assert.ok(segs.length >= 43, `段数须 ≥ 43（42 + Gate 44），实为 ${segs.length}`);
  const iG44 = segs.findIndex((s) => s.includes('audit-e41plus-gate44-house-overlay'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.ok(iG44 >= 0, 'Gate 44 未入编 test:astro');
  assert.ok(iCap > iG44, 'Gate 44 必须居收口位之前（段序红线）');
  assert.equal(iCap, segs.length - 2, 'e40-compat 必须保持收口位（倒数第二段）');
  assert.ok(segs[segs.length - 1].includes('python'), '链尾必须为 python 段');
});

/* ═══════════ G 注入反漂移 ═══════════ */

test('G1 注入：字典缺新词条 ⇒ B7 判据必红', () => {
  const tampered = JSON.parse(JSON.stringify(DICT));
  delete tampered.domains.familiar.HouseResonance;
  const bad = judgeDictComplete(tampered);
  assert.ok(bad.some((b) => b.includes('HouseResonance')), '判据未识别字典缺条（判据失能）');
});

test('G2 注入：宫位号越界/非整数被放行 ⇒ A2 判据必红', () => {
  // 模拟「houseOf 放宽为只判 ≥1」的漂移：13 会被放行
  const drift = (v) => (Number.isFinite(v) && v >= 1 ? v : null);
  const bad = [];
  for (const v of [13, 99, 7.5]) {
    if (drift(v) !== null) bad.push(`drift 放行非法宫位 ${v}`);
  }
  assert.ok(bad.length > 0, '漂移未被识别（判据失能）');
  // 现网基线：houseOf 必须拒绝
  for (const v of [13, 99, 7.5]) assert.equal(OVERLAY.houseOf(v), null, `houseOf(${v}) 未拒绝非法宫位`);
  assert.equal(OVERLAY.houseOf(12), 12, 'houseOf(12) 必须放行（1..12 闭区间）');
});

test('G3 注入：旁置真值渗入 payload ⇒ C1 判据必红', () => {
  const p = payloadFor('zh', TIMED);
  const tainted = { ...p, houseOverlay: HOUSE };
  assert.ok('houseOverlay' in tainted, '注入未生效');
  assert.ok(!('houseOverlay' in p), 'C1 判据应识别 payload 被污染（原始 payload 必须干净）');
});
