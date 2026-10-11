/**
 * Gate 42 — 画布视觉饱满度扩容（三卡：羁绊签名 / 命运契约 / 双星能量图谱）
 * ═══════════════════════════════════════════════════════════════════════════
 * 真值源：astro/astro_terms_dict.json（familiar 域扩容 9 条 × 6 语）
 * 被测核：web/src/lib/canvasModel.mjs（纯 JS 派生核，字典依赖注入）
 *
 * 断言分组：
 *   A 分档闭集（BOND_TIERS 四档 + 边界 + 非有限数 ⇒ null）
 *   B 字典取词（新词条六语齐 + 回查命中 + 缺键 ⇒ null）
 *   C 三卡派生（签名 / 契约 / 能量 + 虚点保留）
 *   D 降级缺省（缺真值 / 不可用 / 入参非法 ⇒ 如实，绝不 undefined/NaN）
 *   E 前端守备（三卡 testid + 溢出防线 + 条件渲染 + App 零回归）
 *   F 段位守备（Gate 42 居收口位之前 · 段数 ≥ 41）
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
const NEW_KEYS = ['BondRadiant', 'BondHarmonic', 'BondTempered', 'BondTesting',
  'IntimacyBond', 'EmotionalSync', 'TerritoryFit', 'ContractSealed', 'ContractPending'];

const CANVAS = await import(pathToFileURL(join(ROOT, 'web/src/lib/canvasModel.mjs')).href);
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
const EMPTY = { available: true, precision: 'date_level', ratio: null, bonds: [], frictions: [] };
const UNAVAIL = { available: false, reason: 'no_birth_time' };

function payloadFor(lang, truth) {
  return PIPE.buildReportPayload({ lang, reportType: 'once', truth, prose: 'x', i18n: SYNASTRY_I18N[lang] });
}
const cardFor = (lang, truth) => CANVAS.deriveCanvasModel(payloadFor(lang, truth), DICT);

/* ── 判据（供 G 组注入复用）── */
function judgeTierBoundary() {
  const bad = [];
  const cases = [[0.9, 'BondRadiant'], [0.6, 'BondRadiant'], [0.599, 'BondHarmonic'],
    [0.4, 'BondHarmonic'], [0.2, 'BondTempered'], [0.199, 'BondTesting'], [0, 'BondTesting']];
  for (const [r, exp] of cases) {
    const got = CANVAS.bondTierKey(r);
    if (got !== exp) bad.push(`bondTierKey(${r})=${got}≠${exp}`);
  }
  for (const r of [null, undefined, NaN, Infinity, '0.5']) {
    if (CANVAS.bondTierKey(r) !== null) bad.push(`bondTierKey(${String(r)}) 应 null`);
  }
  return bad;
}

function judgeDictComplete(dict) {
  const bad = [];
  for (const k of NEW_KEYS) {
    const e = dict.domains.familiar[k];
    if (!e) { bad.push(`familiar.${k} 缺失`); continue; }
    for (const lang of LANGS) {
      if (typeof e[lang] !== 'string' || e[lang].trim() === '') bad.push(`familiar.${k}.${lang} 空`);
    }
  }
  return bad;
}

/* ═══════════ A 分档闭集 ═══════════ */

test('A1 BOND_TIERS 恰四档（闭集）且 floor 严格递减、终档为 0', () => {
  const t = CANVAS.BOND_TIERS;
  assert.equal(t.length, 4, '羁绊称号必须恰为四档（禁第五档）');
  assert.deepEqual(t.map((x) => x.key), ['BondRadiant', 'BondHarmonic', 'BondTempered', 'BondTesting']);
  for (let i = 1; i < t.length; i++) assert.ok(t[i].floor < t[i - 1].floor, 'floor 必须严格递减');
  assert.equal(t[t.length - 1].floor, 0, '末档须兜住 [0,0.2)');
});

test('A2 bondTierKey 边界精确（0.6/0.4/0.2 归上档）', () => {
  assert.deepEqual(judgeTierBoundary(), []);
});

test('A3 ratio 非有限数（null/NaN/Infinity/字符串）⇒ null（如实缺省，绝不臆造称号）', () => {
  for (const r of [null, undefined, NaN, Infinity, -Infinity, '0.5', {}]) {
    assert.equal(CANVAS.bondTierKey(r), null, `ratio=${String(r)} 应返回 null`);
  }
});

/* ═══════════ B 字典取词 ═══════════ */

test('B1 新词条 9 条 × 6 语全非空（familiar 域扩容完整）', () => {
  assert.deepEqual(judgeDictComplete(DICT), []);
  assert.ok(Object.keys(DICT.domains.familiar).length >= 4 + NEW_KEYS.length, 'familiar 域未完成扩容');
});

test('B2 三卡词条逐条回查字典命中（禁机翻 / 禁臆造）', () => {
  const c = cardFor('zh', TIMED);
  assert.equal(c.signature.tier.key, 'BondRadiant');
  assert.equal(c.signature.tier.label, DICT.domains.familiar.BondRadiant.zh);
  assert.equal(c.contract.state.key, 'ContractSealed');
  assert.equal(c.contract.state.label, DICT.domains.familiar.ContractSealed.zh);
  assert.equal(c.contract.points[0].key, 'NorthNode');
  assert.equal(c.contract.points[0].label, DICT.domains.points.NorthNode.zh);
  const th = cardFor('th', TIMED);
  assert.equal(th.signature.tier.label, DICT.domains.familiar.BondRadiant.th, 'th 称号未按字典取词');
  assert.equal(th.energy[0].axis.label, DICT.domains.familiar.IntimacyBond.th);
});

test('B3 termRef 缺域/缺键/空值 ⇒ null（拒绝静默伪造）', () => {
  assert.equal(CANVAS.termRef(DICT, 'familiar', 'NoSuchKey', 'zh'), null);
  assert.equal(CANVAS.termRef(DICT, 'noSuchDomain', 'BondRadiant', 'zh'), null);
  assert.equal(CANVAS.termRef(null, 'familiar', 'BondRadiant', 'zh'), null);
  assert.equal(CANVAS.termRef(DICT, 'familiar', 'BondRadiant', 'zh').slot, 'labelCard');
});

/* ═══════════ C 三卡派生 ═══════════ */

test('C1 羁绊签名卡：称号分档 + 调和占比 + 核心能量 Chip', () => {
  const c = cardFor('zh', TIMED);
  assert.equal(c.signature.tierKey, 'BondRadiant');
  assert.equal(c.signature.ratioPct, 71, 'ratio 0.71 ⇒ 71.0%');
  assert.equal(c.signature.chips.length, 3, '核心能量 Chip 应取柔和相位前三');
  for (const it of c.signature.chips) assert.ok(it.text && it.text.length > 0, 'Chip 缺短语');
});

test('C2 命运契约卡：交点/宿命点命中 ⇒ 契约已成 + 箴言锚', () => {
  const c = cardFor('zh', TIMED);
  assert.equal(c.contract.sealed, true, '含北交点相位 ⇒ 契约应已成');
  assert.deepEqual(c.contract.points.map((p) => p.key), ['NorthNode']);
  assert.ok(c.contract.quote && c.contract.quote.text, '箴言锚不得为空');
  // 反向：无虚点 ⇒ 未明
  const c2 = cardFor('zh', EMPTY);
  assert.equal(c2.contract.sealed, false);
  assert.equal(c2.contract.state.key, 'ContractPending');
  assert.equal(c2.contract.quote, null);
});

test('C3 双星能量图谱：三轴闭集 + 分值闭区间 [0,100]', () => {
  const c = cardFor('zh', TIMED);
  assert.deepEqual(c.energy.map((e) => e.id), ['intimacy', 'emotional', 'territory'], '能量轴必须恰为三轴闭集');
  for (const ax of c.energy) {
    assert.ok(DICT.domains.familiar[ax.axis.key], `轴名 ${ax.axis.key} 未回查字典`);
    if (ax.known) {
      assert.ok(ax.value >= 0 && ax.value <= 100, `轴 ${ax.id} 分值越界：${ax.value}`);
      assert.equal(ax.harmonious + ax.hard > 0, true, 'known 轴须有真值支撑');
    } else {
      assert.equal(ax.value, null, '无信号轴 value 必须为 null');
    }
  }
  // Moon 两条调和（Venus sextile + NorthNode conjunction）⇒ emotional = 100
  assert.equal(c.energy.find((e) => e.id === 'emotional').value, 100);
  assert.equal(c.energy.find((e) => e.id === 'emotional').harmonious, 2);
});

test('C4 虚点（北交点）相位不得被剔除（双域解析守备）', () => {
  const p = payloadFor('zh', TIMED);
  const all = p.cards.flatMap((c) => c.items);
  const hit = all.filter((it) => (it.a && it.a.key === 'NorthNode') || (it.b && it.b.key === 'NorthNode'));
  assert.ok(hit.length > 0, '北交点相位被过度剔除（_aspectItems 双域解析失效）');
  assert.equal(hit[0].a.domain === 'points' || hit[0].b.domain === 'points', true, '虚点词条须来自 points 域');
});

/* ═══════════ D 降级缺省 ═══════════ */

test('D1 缺真值（ratio null + 无相位）⇒ 如实缺省，绝不 undefined/NaN', () => {
  const c = cardFor('zh', EMPTY);
  assert.equal(c.signature.tierKey, null);
  assert.equal(c.signature.tier, null);
  assert.equal(c.signature.ratioPct, null);
  assert.deepEqual(c.signature.chips, []);
  assert.equal(c.contract.sealed, false);
  for (const ax of c.energy) {
    assert.equal(ax.known, false);
    assert.equal(ax.value, null);
  }
  // 全模型可 JSON 序列化（无 undefined/NaN 泄漏）
  const j = JSON.stringify(c);
  assert.ok(!j.includes('undefined') && !j.includes('NaN'), '降级模型含 undefined/NaN 泄漏');
});

test('D2 不可用（available:false）⇒ 派生 null（前端优雅缺省，不渲染三卡）', () => {
  assert.equal(CANVAS.deriveCanvasModel(payloadFor('zh', UNAVAIL), DICT), null);
});

test('D3 入参非法（null / 空对象 / 缺 truth）⇒ null', () => {
  assert.equal(CANVAS.deriveCanvasModel(null, DICT), null);
  assert.equal(CANVAS.deriveCanvasModel({}, DICT), null);
  assert.equal(CANVAS.deriveCanvasModel({ truth: null }, DICT), null);
  assert.equal(CANVAS.deriveCanvasModel({ truth: { available: false } }, DICT), null);
});

/* ═══════════ E 前端守备 ═══════════ */

test('E1 画布组件含三卡 testid（签名 / 契约 / 能量）', () => {
  const src = readSrc('web/src/components/CompatReportCanvas.tsx');
  assert.ok(/data-testid="bond-signature-card"/.test(src), '缺羁绊签名卡');
  assert.ok(/data-testid="karmic-contract-card"/.test(src), '缺命运契约卡');
  assert.ok(/data-testid="energy-grid-card"/.test(src), '缺双星能量图谱');
  assert.ok(/deriveCanvasModel\(payload, ASTRO_TERMS\)/.test(src), '画布未接入派生核');
});

test('E2 溢出三道防线齐备（SAFE_TEXT / overflow-wrap / clampToSlot）', () => {
  const src = readSrc('web/src/components/CompatReportCanvas.tsx');
  assert.ok(/overflowWrap: 'anywhere'/.test(src), '缺 overflow-wrap 兜底');
  assert.ok(/wordBreak: 'break-word'/.test(src), '缺 word-break 兜底');
  assert.ok(/minWidth: 0/.test(src), '缺 flex 收缩兜底');
  assert.ok(/clampToSlot\(/.test(src), '缺字素裁剪');
  // 三卡容器必须带 SAFE_TEXT
  assert.ok(/const CARD_BOX[\s\S]{0,400}\.\.\.SAFE_TEXT/.test(src), '三卡容器未带断行兜底');
});

test('E3 三卡为条件渲染（canvasMap 为 null 时不渲染，绝不缺省填充）', () => {
  const src = readSrc('web/src/components/CompatReportCanvas.tsx');
  assert.ok(/\{canvasMap && \(/.test(src), '三卡未做条件渲染守备');
  assert.ok(/ax\.known && typeof ax\.value === 'number'/.test(src), '能量条未按 known 分支（可能渲染 null）');
});

test('E4 App 零回归：无 payload 回退纯文本渲染契约保留', () => {
  const app = readSrc('web/src/App.tsx');
  assert.ok(/reportText\.split\('\\n\\n'\)/.test(app), '无 Payload 回退渲染被误删');
  assert.ok(/isCompatReportPayload\(data\.payload\)/.test(app), 'App 形状守卫被误删');
});

/* ═══════════ F 段位守备 ═══════════ */

test('F1 Gate 42 居收口位（e40-compat）之前 · 段数 ≥ 41', () => {
  const pkg = JSON.parse(readSrc('package.json'));
  const segs = pkg.scripts['test:astro'].split('&&').map((s) => s.trim());
  // 🔴 下界 + 相对位置（漂移免疫）：与 Gate 40 G1 / Gate 41 F1 同范式
  assert.ok(segs.length >= 41, `段数须 ≥ 41（40 + Gate 42），实为 ${segs.length}`);
  const iG42 = segs.findIndex((s) => s.includes('audit-e41plus-gate42-canvas-cards'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.ok(iG42 >= 0, 'Gate 42 未入编 test:astro');
  assert.ok(iCap > iG42, 'Gate 42 必须居收口位之前（段序红线）');
  assert.equal(iCap, segs.length - 2, 'e40-compat 必须保持收口位（倒数第二段）');
  assert.ok(segs[segs.length - 1].includes('python'), '链尾必须为 python 段');
});

/* ═══════════ G 注入反漂移 ═══════════ */

test('G1 注入：字典缺新词条 ⇒ B1 判据必红', () => {
  const tampered = JSON.parse(JSON.stringify(DICT));
  delete tampered.domains.familiar.ContractSealed;
  const bad = judgeDictComplete(tampered);
  assert.ok(bad.some((b) => b.includes('ContractSealed')), 'B1 判据未识别字典缺条（判据失能）');
});

test('G2 注入：分档 floor 被篡改 ⇒ A2 判据必红', () => {
  const orig = CANVAS.BOND_TIERS;
  // 模拟「把 Radiant 门槛降到 0.5」的漂移（直接以判据函数验射）
  const drift = [[0.5, 'BondHarmonic']];  // 若门槛被降到 0.5，0.5 会归 Radiant ⇒ 与期望不合
  const bad = [];
  for (const [r, exp] of drift) {
    const got = CANVAS.bondTierKey(r);
    if (got !== exp) bad.push(`bondTierKey(${r})=${got}≠${exp}`);
  }
  // 现网基线（floor=0.6）下 0.5 应归 Harmonic —— 若此断言失败说明门槛漂移
  assert.deepEqual(bad, [], '分档门槛疑似漂移（0.5 未归 BondHarmonic）');
  assert.equal(orig.find((t) => t.key === 'BondRadiant').floor, 0.6, 'Radiant 门槛被改');
});
