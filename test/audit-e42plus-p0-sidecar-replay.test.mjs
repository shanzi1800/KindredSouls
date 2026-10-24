/**
 * P0-1 — read-through 旁置真值回放（客户端本地留存通路 · 零 DDL · 零算力）
 * ═══════════════════════════════════════════════════════════════════════════
 * 待办池硬约束原文：
 *   · Gate 41 read-through 命中为**零算力路径**（不重跑引擎、不扣配额）；
 *   · Gate 44 宫位真值走**响应信封旁置**（`houseOverlay`），**未入库**；
 *   · 🔴 `ai_context` **五键被精确锁定** ⇒ 旁置真值**不可入库**；只能走**外部旁置回放**
 *      （客户端本地留存 / 独立轻量旁置表），且**不得**触碰 `persistVersion` / `schemaVersion` 双哨兵。
 *   · 验收：命中路径仍**零算力、零配额消耗**；`reportId + userId` 双键复读不变；
 *      新增断言沿「下界 + 相对位置」范式。
 *
 * 本渠实现（客户端本地留存）：
 *   MISS 生成成功 ⇒ `saveHouseOverlay(reportId, 真值四键)`；
 *   HIT 秒回（响应无 houseOverlay）⇒ `loadHouseOverlay(reportId)` 回放 ⇒ 网格照常渲染。
 *
 * 断言分组：
 *   A 纯核契约（版本哨兵 / 键前缀 / 有界上限 / 零 import / 只存真值四键）
 *   B 行为（留存回放幂等 · 形状守卫 · 键空间守卫 · 自愈清除 · fail-safe · 有界淘汰）
 *   C 接线守备（导入纪律 · MISS 留存 · HIT 回放 · 次序 · 五键锁死不破）
 *   D 段位守备（下界 + 相对位置：居收口位之前）
 *   E 注入反漂移（真实源码篡改 ⇒ 判据必红）
 *
 * 纯 Node 运行（无 DOM / 无网络 / 无 LLM；storage 以夹具注入）。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const REL_STORE = 'web/src/lib/houseOverlayStore.mjs';
const readSrc = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const STORE_SRC = readSrc(REL_STORE);
const STORE = await import(pathToFileURL(join(ROOT, REL_STORE)).href);
const PIPE = await import(pathToFileURL(join(ROOT, 'lib/reportPipeline.mjs')).href);

const RID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';   // 32 位 hex（sha256 截取形态）
const OK_OVERLAY = {
  available: true, precision: 'timed',
  a: { Sun: 1, Moon: 8, Jupiter: 4 }, b: { Venus: 12, Mars: 11 },
};

/* ── 夹具：Storage 桩（可注入；含 length/key 能力） ── */
function makeStorage(seed) {
  const m = new Map(Object.entries(seed || {}));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    key: (i) => (i >= 0 && i < m.size ? Array.from(m.keys())[i] : null),
    get length() { return m.size; },
    _map: m,
  };
}
const THROWING = {
  getItem() { throw new Error('quota/private-mode'); },
  setItem() { throw new Error('quota/private-mode'); },
  removeItem() { throw new Error('quota/private-mode'); },
  get length() { return 0; },
  key() { return null; },
};

/* ── 判据（供 E 组注入复用；返回违规列表，空 = 通过） ── */
function judgeShapeGuard(M) {
  const bad = [];
  const cases = [
    ['available:false', { available: false, precision: 'timed', a: { Sun: 1 }, b: { Moon: 2 } }],
    ['缺 available', { precision: 'timed', a: { Sun: 1 }, b: { Moon: 2 } }],
    ['空映射 a', { available: true, precision: 'timed', a: {}, b: { Moon: 2 } }],
    ['空映射 b', { available: true, precision: 'timed', a: { Sun: 1 }, b: {} }],
    ['缺 a', { available: true, precision: 'timed', b: { Moon: 2 } }],
    ['越界宫位 13', { available: true, precision: 'timed', a: { Sun: 13 }, b: { Moon: 2 } }],
    ['越界宫位 0', { available: true, precision: 'timed', a: { Sun: 0 }, b: { Moon: 2 } }],
    ['非整数 7.5', { available: true, precision: 'timed', a: { Sun: 7.5 }, b: { Moon: 2 } }],
    ['数组渗入', { available: true, precision: 'timed', a: [1, 2], b: { Moon: 2 } }],
    ['null 入参', null],
  ];
  for (const [name, v] of cases) {
    if (M.normalizeOverlay(v) !== null) bad.push(`normalizeOverlay 放行非法形状：${name}`);
    const S = makeStorage();
    if (M.saveHouseOverlay(RID, v, S) !== false) bad.push(`saveHouseOverlay 放行非法形状：${name}`);
    if (S.length !== 0) bad.push(`非法形状被写入存储：${name}`);
  }
  return bad;
}

function judgeKeyGuard(M) {
  const bad = [];
  const cases = ['', '  ', 'a1b2c3', 'zzzzzzzzzzzzzzzzzzzz', '../../etc/passwd', null, 42, {}];
  for (const v of cases) {
    if (M.overlayStoreKey(v) !== null) bad.push(`overlayStoreKey 放行非法 reportId：${String(v)}`);
  }
  if (M.overlayStoreKey(RID) !== M.OVERLAY_STORE_KEY_PREFIX + RID) bad.push('合法 reportId 派生键错误');
  // 首尾空白按归一处理（同键复读；非「放行非法串」）
  if (M.overlayStoreKey('  ' + RID + '  ') !== M.OVERLAY_STORE_KEY_PREFIX + RID) bad.push('首尾空白未归一');
  return bad;
}

function judgeSelfHeal(M) {
  const bad = [];
  const broken = [
    ['非 JSON', 'not-json-at-all'],
    ['版本哨兵失配', JSON.stringify({ v: 'houseOverlayStore.v0', ts: Date.now(), o: OK_OVERLAY })],
    ['ts 非数', JSON.stringify({ v: M.OVERLAY_STORE_VERSION, ts: 'x', o: OK_OVERLAY })],
    ['记录形状不合', JSON.stringify({ v: M.OVERLAY_STORE_VERSION, ts: Date.now(), o: { available: false } })],
  ];
  for (const [name, raw] of broken) {
    const S = makeStorage({ [M.OVERLAY_STORE_KEY_PREFIX + RID]: raw });
    if (M.loadHouseOverlay(RID, S) !== null) bad.push(`坏记录被回放：${name}`);
    if (S.length !== 0) bad.push(`坏记录未被自愈清除：${name}`);
  }
  return bad;
}

function judgeFailSafe(M) {
  const bad = [];
  const r1 = M.saveHouseOverlay(RID, OK_OVERLAY, null);
  const r2 = M.loadHouseOverlay(RID, null);
  if (r1 !== false) bad.push('storage 缺省时 save 未降级 false');
  if (r2 !== null) bad.push('storage 缺省时 load 未降级 null');
  const r3 = M.saveHouseOverlay(RID, OK_OVERLAY, THROWING);
  const r4 = M.loadHouseOverlay(RID, THROWING);
  if (r3 !== false) bad.push('storage 抛错时 save 未吞错');
  if (r4 !== null) bad.push('storage 抛错时 load 未吞错');
  return bad;
}

/* ═══════════ A 纯核契约 ═══════════ */

test('A1 纯逻辑核：零 import / 零网络 / 零 DOM（Node 可直接单测）', () => {
  const stripped = STORE_SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/^\s*import\s/m.test(stripped), '纯核内出现 import（应零依赖）');
  assert.ok(!/\bfetch\s*\(/.test(stripped), '纯核内出现 fetch（应零网络）');
  assert.ok(!/\bdocument\b|\bwindow\./.test(stripped), '纯核内出现 DOM 依赖');
});

test('A2 契约哨兵：版本号 / 键前缀 / 有界上限 三常量齐备且互洽', () => {
  assert.equal(STORE.OVERLAY_STORE_VERSION, 'houseOverlayStore.v1');
  assert.equal(STORE.OVERLAY_STORE_KEY_PREFIX, 'ksHouseOverlay:v1:');
  assert.ok(Number.isInteger(STORE.OVERLAY_STORE_MAX_ENTRIES) && STORE.OVERLAY_STORE_MAX_ENTRIES > 0, '上限须为正整数');
  assert.ok(STORE.OVERLAY_STORE_MAX_ENTRIES <= 50, '上限过大（防 localStorage 膨胀）');
});

test('A3 只存真值四键：正文/载荷等业务字段一律不可穿透（体积与隐私双守）', () => {
  const S = makeStorage();
  const fat = { ...OK_OVERLAY, insight: '报告正文', payload: { sections: [] }, reportText: 'x', score: 9 };
  assert.equal(STORE.saveHouseOverlay(RID, fat, S), true);
  const back = STORE.loadHouseOverlay(RID, S);
  assert.deepEqual(Object.keys(back).sort(), ['a', 'available', 'b', 'precision'], '回放字段越界（真值四键之外不得留存）');
  assert.ok(!JSON.stringify(back).includes('报告正文'), '正文渗入留存');
  assert.ok(!('payload' in back) && !('reportText' in back) && !('score' in back), '业务字段渗入留存');
});

/* ═══════════ B 行为 ═══════════ */

test('B1 留存 → 回放闭环：深等真值 + 非同一引用（防外部篡改回流）', () => {
  const S = makeStorage();
  assert.equal(STORE.saveHouseOverlay(RID, OK_OVERLAY, S), true);
  const back = STORE.loadHouseOverlay(RID, S);
  assert.deepEqual(back, OK_OVERLAY);
  assert.notEqual(back, OK_OVERLAY, '回放须为副本（非原引用）');
  assert.notEqual(back.a, OK_OVERLAY.a, 'a 映射须为副本');
});

test('B2 形状守卫：available≠true / 缺 a·b / 空映射 {} / 宫位越界非整 ⇒ 拒存拒放（零臆造）', () => {
  assert.deepEqual(judgeShapeGuard(STORE), []);
});

test('B3 键空间守卫：reportId 非法（空/短/非 hex/注入符/非串）⇒ 拒存拒放', () => {
  assert.deepEqual(judgeKeyGuard(STORE), []);
});

test('B4 自愈：版本哨兵失配 / 记录损坏 ⇒ 回放 null 且键被清除（绝不回放未知结构）', () => {
  assert.deepEqual(judgeSelfHeal(STORE), []);
});

test('B5 fail-safe：storage 缺省或抛错（隐私模式/配额满）⇒ 静默降级，绝不抛错', () => {
  assert.deepEqual(judgeFailSafe(STORE), []);
  // 未注入 storage 时亦不得抛错（真实环境回落 globalThis.localStorage）
  assert.doesNotThrow(() => STORE.saveHouseOverlay(RID, OK_OVERLAY));
  assert.doesNotThrow(() => STORE.loadHouseOverlay(RID));
});

test('B6 有界淘汰：超上限按键 ts 升序淘汰最旧，且绝不误删非本核前缀键', () => {
  const S = makeStorage({ 'otherKey:1': 'keep-me', 'sb-auth-token': 'keep-me-too' });
  for (let i = 0; i < STORE.OVERLAY_STORE_MAX_ENTRIES + 7; i++) {
    const rid = String(i).padStart(16, '0');
    S.setItem(STORE.OVERLAY_STORE_KEY_PREFIX + rid, JSON.stringify({ v: STORE.OVERLAY_STORE_VERSION, ts: 1000 + i, o: OK_OVERLAY }));
  }
  const removed = STORE.pruneHouseOverlayStore(STORE.OVERLAY_STORE_MAX_ENTRIES, S);
  assert.equal(removed, 7, '淘汰条数不符');
  let kept = 0;
  for (let i = 0; i < S.length; i++) if (S.key(i).indexOf(STORE.OVERLAY_STORE_KEY_PREFIX) === 0) kept++;
  assert.equal(kept, STORE.OVERLAY_STORE_MAX_ENTRIES, '留存未被压到上限');
  // 最旧的 7 条（ts 1000..1006）须先出
  for (let i = 0; i < 7; i++) {
    const rid = String(i).padStart(16, '0');
    assert.equal(S.getItem(STORE.OVERLAY_STORE_KEY_PREFIX + rid), null, `最旧条目未淘汰：${i}`);
  }
  assert.equal(S.getItem('otherKey:1'), 'keep-me', '误删他人键');
  assert.equal(S.getItem('sb-auth-token'), 'keep-me-too', '误删他人键');
});

test('B7 幂等：同键重复留存 ⇒ 单条记录（覆盖写，不累积）', () => {
  const S = makeStorage();
  STORE.saveHouseOverlay(RID, OK_OVERLAY, S);
  STORE.saveHouseOverlay(RID, OK_OVERLAY, S);
  let n = 0;
  for (let i = 0; i < S.length; i++) if (S.key(i).indexOf(STORE.OVERLAY_STORE_KEY_PREFIX) === 0) n++;
  assert.equal(n, 1, '同键重复留存出现多份');
  assert.deepEqual(STORE.loadHouseOverlay(RID, S), OK_OVERLAY);
});

/* ═══════════ C 接线守备（App.tsx · E85 合盘退役版） ═══════════ */

test('C1 导入纪律退役（E85）：houseOverlayStore 留存核不再由 App 导入（纯 JS 库留作离线资产）', () => {
  // 🧹 E85（主公军令 2026-10-24）：App 的旁置真值消费/回放/留存接线随合盘画布下架；
  //   houseOverlayStore.mjs 纯库与 B 组单元测试保留（离线资产，零运行时挂载）。
  const app = readSrc('web/src/App.tsx');
  assert.ok(!app.includes("loadHouseOverlay, saveHouseOverlay"), 'E85 App 仍导入留存核违令');
  assert.ok(!app.includes('houseOverlayStore.mjs'), 'E85 App 留存核导入行残留违令');
});

test('C2 MISS 留存接线退役（E85）：旁置真值不再由 App 消费（月报/年报走纯文本）', () => {
  const app = readSrc('web/src/App.tsx');
  assert.ok(!/_g44Wire/.test(app), 'E85 旁置真值 wire 判定残留违令');
  assert.ok(!/saveHouseOverlay\(/.test(app), 'E85 MISS 留存调用残留违令');
});

test('C3 HIT 回放接线退役（E85）：回放/下沉零残留（DOM 一根像素不留）', () => {
  const app = readSrc('web/src/App.tsx');
  assert.ok(!/_g44Replayed/.test(app), 'E85 回放守卫残留违令');
  assert.ok(!/loadHouseOverlay\(/.test(app), 'E85 回放调用残留违令');
  assert.ok(!/setReportHouseOverlay\(/.test(app), 'E85 旁置真值状态下沉残留违令');
});

test('C4 wire 判据退役（E85）：data.houseOverlay 消费面零残留（与 Gate 44 同步退役）', () => {
  const app = readSrc('web/src/App.tsx');
  assert.ok(!/data\.houseOverlay/.test(app), 'E85 wire 判据消费残留违令');
});

test('C5 五键锁死不破：ai_context 仍恰五键（本渠禁走入库通路）', () => {
  const row = PIPE.planPersistRow({
    reportId: RID, reportType: 'once', lang: 'zh', insight: '正文',
    payload: { schemaVersion: PIPE.REPORT_PAYLOAD_SCHEMA, lang: 'zh', truth: { available: true }, sections: [], cards: [], labels: {} },
    userId: 'u1',
  });
  assert.deepEqual(Object.keys(row.ai_context).sort(),
    ['payload', 'persistVersion', 'reportId', 'reportType', 'schemaVersion'],
    'ai_context 键集被改动（Gate 41 五键锁死红线）');
  const srv = readSrc('server.js');
  assert.ok(!/ai_context[\s\S]{0,120}houseOverlay/.test(srv), '旁置真值疑似被塞进 ai_context（硬约束：不可入库）');
});

test('C6 服务端 HIT 主通路（SSE 单帧 ready）必须携带 reportId —— 回放的唯一索引入口', () => {
  // 🔴 射程缺口修复：前端 `stream: true` 为默认投递 ⇒ SSE HIT 帧即 P0-1 回放的**主通路**；
  //    原仅有 Gate 41 D2 锚定 JSON 回执字面量 ⇒ SSE HIT 帧无守备（本段补位）。
  const srv = readSrc('server.js');
  const i = srv.indexOf('return _rps.ready(lang, { insight: _g41Replay.insight');
  assert.notEqual(i, -1, 'SSE HIT 单帧 ready 缺失（P0-1 主通路无索引来源）');
  const line = srv.slice(i, srv.indexOf('});', i));
  assert.ok(line.includes('cached: true'), 'SSE HIT 帧未标 cached:true');
  assert.ok(line.includes('payload: _g41Replay.payload'), 'SSE HIT 帧缺 payload');
  assert.ok(line.includes('reportId: _g41Replay.reportId || _g41ReportId'), 'SSE HIT 帧缺 reportId（回放将静默失效）');
  // 双路同源：JSON 回执照旧（Gate 41 D2 锚点）不得被改写
  assert.ok(srv.includes('return res.json({ insight: _g41Replay.insight, cached: true, payload: _g41Replay.payload, reportId: _g41Replay.reportId || _g41ReportId });'),
    'JSON HIT 回执字面量被改写（Gate 41 D2 零回归）');
});

test('C7 命中路径零算力：HIT 分支必须在建流水线/调 AI 之前返回（不重跑引擎、不扣配额）', () => {
  const srv = readSrc('server.js');
  // 🔴 E88-②（主公军令 2026-10-26）语义演进：HIT 分支改挂守卫变量
  //    _g41ReplayUsable（yearly 旧短壳 <2000 字符 ⇒ 忽略复读走 MISS 新生成；
  //    月报/once 复读语义零改动）——锚随演进，零算力红线不变。
  const iReplayBranch = srv.indexOf('if (_g41ReplayUsable) {');
  const iHitJson = srv.indexOf('return res.json({ insight: _g41Replay.insight');
  const iHitSse = srv.indexOf('return _rps.ready(lang, { insight: _g41Replay.insight');
  const iPipe = srv.indexOf('const _pipe = createReportPipeline();');
  const iCallAI = srv.indexOf('const insight = await callAI(');
  assert.ok(iReplayBranch > 0 && iHitJson > iReplayBranch && iHitSse > iReplayBranch, 'HIT 分支接线缺失');
  assert.ok(iPipe > 0 && iCallAI > 0, 'MISS 生成链路锚点缺失');
  assert.ok(iHitJson < iPipe && iHitSse < iPipe, 'HIT 回执未在建流水线之前返回（零算力红线）');
  assert.ok(iHitJson < iCallAI && iHitSse < iCallAI, 'HIT 回执未在调用 AI 之前返回（零算力红线）');
  // 周期锁/日限流/配额递增须仍在 HIT 之后（命中不扣配额）
  const iPeriodLock = srv.indexOf('const _lockC = compatibilityPeriodLock(');
  assert.ok(iPeriodLock > iHitSse, '周期锁位置前移（命中将被误锁）');
});

/* ═══════════ D 段位守备 ═══════════ */

test('D1 P0-1 居收口位（e40-compat）之前 · 段数 ≥ 49', () => {
  const pkg = JSON.parse(readSrc('package.json'));
  const segs = pkg.scripts['test:astro'].split('&&').map((s) => s.trim());
  // 🔴 下界 + 相对位置（漂移免疫）：与 Gate 40 G1 / 41 F1 / 44 F1 / 45-F D 段同范式
  assert.ok(segs.length >= 49, `段数须 ≥ 49（48 + P0-1），实为 ${segs.length}`);
  const iNew = segs.findIndex((s) => s.includes('p0-sidecar-replay'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.ok(iNew >= 0, 'P0-1 闸门未入编 test:astro');
  assert.ok(iCap > iNew, 'P0-1 必须居收口位之前（段序红线）');
  assert.equal(iCap, segs.length - 2, 'e40-compat 必须保持收口位（倒数第二段）');
  assert.ok(segs[segs.length - 1].includes('python'), '链尾必须为 python 段');
});

/* ═══════════ E 注入反漂移（真实源码篡改 ⇒ 判据必红） ═══════════ */

async function loadVariant(tamper) {
  const src = tamper(STORE_SRC);
  assert.notEqual(src, STORE_SRC, '注入锚点漂移（未命中目标实现）');
  const url = 'data:text/javascript;base64,' + Buffer.from(src, 'utf8').toString('base64');
  return import(url);
}

test('E1 注入：摘掉形状守卫（available 检查）⇒ B2 判据必红', async () => {
  const M = await loadVariant((s) => s.replace("  if (o.available !== true) return null;\n", ''));
  assert.ok(judgeShapeGuard(M).some((b) => b.includes('available:false')), 'B2 判据失能（未识别形状守卫缺失）');
});

test('E2 注入：放宽 reportId 校验 ⇒ B3 判据必红（键空间被污染）', async () => {
  const M = await loadVariant((s) => s.replace('const REPORT_ID_RE = /^[0-9a-f]{16,64}$/i;', 'const REPORT_ID_RE = /^[\\s\\S]*$/;'));
  assert.ok(judgeKeyGuard(M).length > 0, 'B3 判据失能（未识别键校验放宽）');
});

test('E3 注入：摘掉坏记录自愈清除 ⇒ B4 判据必红', async () => {
  const M = await loadVariant((s) => s.replace('      try { S.removeItem(key); } catch (e) { /* noop */ }\n', ''));
  assert.ok(judgeSelfHeal(M).some((b) => b.includes('未被自愈清除')), 'B4 判据失能（未识别自愈缺失）');
});

test('E4 注入：storage 抛错不吞 ⇒ B5 判据必红', async () => {
  const M = await loadVariant((s) => s.replace(
    '  } catch (e) {\n    return false;\n  }\n}\n\n/**\n * 旁置回放（HIT 秒回时调用）。',
    '  } catch (e) {\n    throw e;\n  }\n}\n\n/**\n * 旁置回放（HIT 秒回时调用）。',
  ));
  assert.throws(() => judgeFailSafe(M), 'B5 判据失能（未识别吞错缺失）');
});
