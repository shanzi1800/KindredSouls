/**
 * Gate 41 — 甲线 · 合盘报告持久化闭环（双盘真实闭环攻坚令 · read-through 复读）
 * ═══════════════════════════════════════════════════════════════════════════
 * 战役目标（军师红线 ①–⑤）：
 *   report_payload.v1 须具备唯一 Report ID 并持久化，支持刷新/二次回访时
 *   无须重新消耗算力即可秒级复读；402 权益闸门寸步不让；fail-safe 落库不阻断。
 *
 * 真值源：
 *   · lib/reportPipeline.mjs   —— 持久化三件套纯逻辑核（deriveCompatReportId /
 *                                 planPersistRow / deserializePersistedPayload）
 *   · server.js 付费分支       —— read-through 接线（次序铁律：402 → 复读 → 周期锁/配额）
 *   · compatibility_results   —— 落点表（ai_context/ai_insight 零占用列，零 DDL）
 *
 * 断言分组：
 *   A Report ID 派生（确定性 / 键序不敏感 / 输入隔离 / 形态锁定）
 *   B 行构造（四列齐 + 上下文五键 / 缺真值 ⇒ null 不落库）
 *   C 反序列化守卫（双版本 + 最小形状；历史/异构/被篡改行一律 null）
 *   D server.js 接线（次序铁律 / 回执契约 / fail-safe / 引渡行独立 / 归属双键）
 *   E 注入反漂移（稳定排序被摘 / 版本守卫被摘 ⇒ 必红）
 *   F 段位守备（40 段 · Gate 41 居收口位 audit-e40-compat 之前 · 链尾 python）
 *
 * 纯 Node 运行（无 DOM / 无网络 / 无 LLM）。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const readSrc = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const PIPE = await import(pathToFileURL(path.join(ROOT, 'lib', 'reportPipeline.mjs')).href);
const SERVER = readSrc('server.js');
const PKG = JSON.parse(readSrc('package.json'));

const USER = 'c1612ba0-9ec4-4910-b6f0-cdaf70bc4b1f';
const BASE_INPUT = Object.freeze({
  reportType: 'once', lang: 'zh',
  d1: '1996-01-23 12:00|北京', d2: '1999-12-15 09:30|上海',
  bazi: { year: '丙子', day: '甲子' }, zodiac: ['rat'], iching: { hexagram: 1 },
  tarot: { name: 'The Magician' }, zodiacMeta: [{ sign: 'Aquarius' }],
  userBirthDate: '1996-01-23',
});

/** 合法 report_payload.v1 最小样例（反序列化闭环用） */
function validPayload(lang = 'zh') {
  return {
    schemaVersion: 'report_payload.v1', lang, reportType: 'once',
    generatedAt: '2026-10-11T01:00:00.000Z',
    truth: { available: true, degraded: false },
    terms: { synastry: { label: 'x' } }, labels: { a: 'b' },
    cards: [], sections: ['🎯 s1', '⚡ s2'],
  };
}

/* ══════════════════ A 组 · Report ID 派生 ══════════════════ */
test('A1 确定性：同输入两次派生必相同（复读幂等根基）', () => {
  assert.equal(PIPE.deriveCompatReportId(BASE_INPUT), PIPE.deriveCompatReportId(BASE_INPUT));
});
test('A2 键序不敏感：嵌套对象键序抖动 ⇒ 同 ID（稳定序列化）', () => {
  const a = PIPE.deriveCompatReportId({ ...BASE_INPUT, bazi: { year: '丙子', day: '甲子' } });
  const b = PIPE.deriveCompatReportId({ ...BASE_INPUT, bazi: { day: '甲子', year: '丙子' } });
  assert.equal(a, b, '嵌套对象键序导致 ID 抖动 ⇒ 复读失效');
});
test('A3 输入隔离：lang/reportType/d1/d2/bazi 任一变化 ⇒ 必不同 ID（绝不串报告）', () => {
  const base = PIPE.deriveCompatReportId(BASE_INPUT);
  for (const [k, v] of [['lang', 'en'], ['reportType', 'monthly'], ['d1', 'x'], ['d2', 'y'], ['bazi', null]]) {
    assert.notEqual(PIPE.deriveCompatReportId({ ...BASE_INPUT, [k]: v }), base, `${k} 变化未隔离`);
  }
});
test('A4 形态锁定：32 位小写 hex（REPORT_ID_HEX_LEN 真源）', () => {
  const id = PIPE.deriveCompatReportId(BASE_INPUT);
  assert.equal(id.length, PIPE.REPORT_ID_HEX_LEN);
  assert.match(id, /^[0-9a-f]{32}$/);
});

/* ══════════════════ B 组 · 行构造 ══════════════════ */
test('B1 完整行：四列齐 + ai_context 五键 + payload 原样内嵌', () => {
  const row = PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: '正文', payload: validPayload(), userId: USER });
  assert.ok(row, '合法输入被拒');
  assert.deepEqual(Object.keys(row).sort(), ['ai_context', 'ai_insight', 'language', 'user_id']);
  assert.equal(row.user_id, USER);
  assert.equal(row.language, 'zh');
  assert.equal(row.ai_insight, '正文');
  assert.deepEqual(Object.keys(row.ai_context).sort(),
    ['payload', 'persistVersion', 'reportId', 'reportType', 'schemaVersion']);
  assert.equal(row.ai_context.persistVersion, PIPE.COMPAT_PERSIST_VERSION);
  assert.equal(row.ai_context.schemaVersion, 'report_payload.v1');
  assert.deepEqual(row.ai_context.payload, validPayload());
});
test('B2 缺 userId（绿道/无 Supabase）⇒ null（不落库，fail-safe）', () => {
  assert.equal(PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: 'x', payload: validPayload(), userId: null }), null);
  assert.equal(PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: 'x', payload: validPayload(), userId: '  ' }), null);
});
test('B3 payload 结构不合（schemaVersion 不符）⇒ null（绝不落未知结构）', () => {
  const bad = { ...validPayload(), schemaVersion: 'report_payload.v0' };
  assert.equal(PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: 'x', payload: bad, userId: USER }), null);
  assert.equal(PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: 'x', payload: null, userId: USER }), null);
});
test('B4 insight 空白 / reportId 缺失 ⇒ null', () => {
  assert.equal(PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: '   ', payload: validPayload(), userId: USER }), null);
  assert.equal(PIPE.planPersistRow({ reportId: '', reportType: 'once', lang: 'zh', insight: 'x', payload: validPayload(), userId: USER }), null);
});

/* ══════════════════ C 组 · 反序列化守卫 ══════════════════ */
test('C1 合法行闭环：payload 深等回放 + reportId 透出', () => {
  const row = PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: '正文', payload: validPayload(), userId: USER });
  const back = PIPE.deserializePersistedPayload(row);
  assert.ok(back, '合法行被拒');
  assert.equal(back.insight, '正文');
  assert.deepEqual(back.payload, validPayload());
  assert.equal(back.reportId, 'a'.repeat(32));
});
test('C2 persistVersion 不符（历史/异构行）⇒ null', () => {
  const row = PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: 'x', payload: validPayload(), userId: USER });
  const forged = { ...row, ai_context: { ...row.ai_context, persistVersion: 'compat_report.v0' } };
  assert.equal(PIPE.deserializePersistedPayload(forged), null);
});
test('C3 payload schemaVersion 不符 / 结构缺失 ⇒ null', () => {
  const row = PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: 'x', payload: validPayload(), userId: USER });
  assert.equal(PIPE.deserializePersistedPayload({ ...row, ai_context: { ...row.ai_context, payload: { ...validPayload(), schemaVersion: 'v9' } } }), null);
  for (const k of ['truth', 'sections', 'cards', 'labels']) {
    const broken = { ...validPayload() }; delete broken[k];
    assert.equal(PIPE.deserializePersistedPayload({ ...row, ai_context: { ...row.ai_context, payload: broken } }), null, `缺 ${k} 未拒`);
  }
});
test('C4 空行 / 空对象 / insight 缺失 ⇒ null（fail-closed）', () => {
  assert.equal(PIPE.deserializePersistedPayload(null), null);
  assert.equal(PIPE.deserializePersistedPayload({}), null);
  assert.equal(PIPE.deserializePersistedPayload({ ai_insight: '', ai_context: { persistVersion: PIPE.COMPAT_PERSIST_VERSION, payload: validPayload() } }), null);
  assert.equal(PIPE.deserializePersistedPayload({ ai_insight: 'x', ai_context: 'str' }), null);
  assert.equal(PIPE.deserializePersistedPayload({ ai_insight: 'x', ai_context: [1] }), null);
});

/* ══════════════════ D 组 · server.js 接线（次序铁律）══════════════════ */
test('D1 次序铁律：402 权益闸门 → 复读 read-through → 周期锁（复读绝不绕过 402）', () => {
  const i402 = SERVER.indexOf('requiredPlan: requiredPlanForCompat(reportType)');
  const iReplay = SERVER.indexOf('const _g41Replay = await replayCompatReportRow');
  const iGreen = SERVER.indexOf("if (_cEnt.method !== 'green_channel'");
  assert.notEqual(i402, -1, '402 权益闸门缺失');
  assert.notEqual(iReplay, -1, 'Gate41 复读接线缺失');
  assert.ok(i402 < iReplay && iReplay < iGreen,
    `次序破坏：402(${i402}) → 复读(${iReplay}) → 周期锁(${iGreen})`);
});
test('D2 复读命中回执契约：cached:true + payload + reportId（零算力秒回）', () => {
  const i = SERVER.indexOf('return res.json({ insight: _g41Replay.insight');
  assert.notEqual(i, -1, '复读命中回执缺失');
  const line = SERVER.slice(i, SERVER.indexOf('});', i));
  assert.ok(line.includes('cached: true'), '复读回执未标 cached:true');
  assert.ok(line.includes('payload: _g41Replay.payload'), '复读回执缺 payload');
  assert.ok(line.includes('reportId:'), '复读回执缺 reportId');
});
test('D3 落库位置：payload ready 之后、生成周期时间戳补写之前（MISS 全链尾部落库）', () => {
  const iReady = SERVER.indexOf("_pipe.advance('ready')");
  const iPersist = SERVER.indexOf('planPersistRow({ reportId: _g41ReportId');
  const iPatch = SERVER.indexOf('生成成功 ⇒ 补写合婚生成周期时间戳');
  assert.ok(iReady > 0 && iReady < iPersist && iPersist < iPatch,
    `次序破坏：ready(${iReady}) → 落库(${iPersist}) → 补写(${iPatch})`);
});
test('D4 fail-safe：落库异常捕获 + reportId 仅在落库成功时附带（报告永不阻断）', () => {
  assert.ok(SERVER.includes('let _g41Persisted = false;'), '落库结果标记缺失');
  assert.ok(SERVER.includes('} catch (_g41Err) {'), '落库异常捕获缺失');
  assert.ok(SERVER.includes('if (_g41Persisted) _g41Body.reportId = _g41ReportId;'),
    'reportId 未按落库结果条件附带');
  assert.ok(SERVER.includes('console.warn(\'[Gate41] persist error:\''), '落库失败静默（须留痕）');
});
test('D5 引渡纪律：Gate 40 契约行字节级原样 + Gate 41 名字独立成行（不稀释既有闸门）', () => {
  assert.ok(SERVER.includes("import { buildReportPayload, createReportPipeline, REPORT_PAYLOAD_SCHEMA } from './lib/reportPipeline.mjs';"),
    'Gate 40 引渡契约行被污染');
  assert.ok(SERVER.includes("import { deriveCompatReportId, deserializePersistedPayload, planPersistRow } from './lib/reportPipeline.mjs';"),
    'Gate 41 引渡行缺失');
});
test('D6 归属双键：user_id + ai_context->>reportId 双过滤 + 缺任一早退（隐私守恒）', () => {
  const iFn = SERVER.indexOf('async function replayCompatReportRow');
  assert.notEqual(iFn, -1, '复读取数适配器缺失');
  const iNext = SERVER.indexOf('async function', iFn + 10);
  const fn = SERVER.slice(iFn, iNext > iFn ? iNext : undefined);
  assert.ok(fn.includes('user_id=eq.'), '复读未按 user_id 归属过滤（越权风险）');
  assert.ok(fn.includes('ai_context->>reportId=eq.'), '复读未按 reportId 索引过滤');
  assert.ok(fn.includes('if (!userId || !reportId) return null;'), '缺参早退缺失');
  assert.ok(fn.includes('deserializePersistedPayload('), '复读未过反序列化守卫');
});

/* ══════════════════ E 组 · 注入反漂移 ══════════════════ */
/** 复制纯逻辑核进临时目录做变异导入（相对引用链完整保留） */
async function loadPipelineMutated(mutate) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'g41-inject-'));
  fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'astro'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}', 'utf8');
  fs.copyFileSync(path.join(ROOT, 'astroTerms.js'), path.join(dir, 'astroTerms.js'));
  fs.copyFileSync(path.join(ROOT, 'astro', 'astro_terms_dict.json'),
    path.join(dir, 'astro', 'astro_terms_dict.json'));
  fs.writeFileSync(path.join(dir, 'lib', 'reportPipeline.mjs'), mutate(readSrc('lib/reportPipeline.mjs')), 'utf8');
  return import(pathToFileURL(path.join(dir, 'lib', 'reportPipeline.mjs')).href);
}

test('E1 注入：稳定排序被摘（嵌套键序不再归一）⇒ A2 判据必红', async () => {
  const m = await loadPipelineMutated((s) => s.replace(
    'const keys = Object.keys(v).sort();', 'const keys = Object.keys(v);'));
  const a = m.deriveCompatReportId({ ...BASE_INPUT, bazi: { year: '丙子', day: '甲子' } });
  const b = m.deriveCompatReportId({ ...BASE_INPUT, bazi: { day: '甲子', year: '丙子' } });
  assert.notEqual(a, b, '注入生效确认');
  assert.equal(PIPE.deriveCompatReportId({ ...BASE_INPUT, bazi: { year: '丙子', day: '甲子' } }),
    PIPE.deriveCompatReportId({ ...BASE_INPUT, bazi: { day: '甲子', year: '丙子' } }),
    '基线判据失能：键序抖动未被稳定排序吸收');
});
test('E2 注入：persistVersion 版本守卫被摘 ⇒ C2 判据必红（异构行被回放）', async () => {
  const m = await loadPipelineMutated((s) => s.replace(
    'if (ctx.persistVersion !== COMPAT_PERSIST_VERSION) return null;', ''));
  const row = PIPE.planPersistRow({ reportId: 'a'.repeat(32), reportType: 'once', lang: 'zh', insight: 'x', payload: validPayload(), userId: USER });
  const forged = { ...row, ai_context: { ...row.ai_context, persistVersion: 'compat_report.v0' } };
  assert.ok(m.deserializePersistedPayload(forged), '注入生效确认');
  assert.equal(PIPE.deserializePersistedPayload(forged), null, '基线判据失能：异构行未拒');
});

/* ══════════════════ F 组 · 段位守备 ══════════════════ */
test('F1 段位：test:astro 40 段 · Gate 41 居收口位（e40-compat）之前 · 链尾 python', () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim());
  assert.equal(segs.length, 40, `段数漂移：${segs.length}`);
  const iG41 = segs.findIndex((s) => s.includes('audit-e41plus-gate41-persist-loop'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.ok(iG41 > 0, 'Gate 41 段未入编');
  assert.ok(iG41 < iCap, `Gate 41 必须插在收口位（e40-compat）之前：g41=${iG41} cap=${iCap}`);
  assert.match(segs[segs.length - 1], /^python3?\s+scripts\//, '链尾必为 python 段');
});
