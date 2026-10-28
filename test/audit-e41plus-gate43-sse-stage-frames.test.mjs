/**
 * Gate 43 — 状态机接 SSE 进度帧（推演仪式感 · 双模优雅降级）
 * ═══════════════════════════════════════════════════════════════════════════
 * 真值源：astro/astro_terms_dict.json（pipelineStages 域 · 六语阶段文案 + 标题）
 * 被测核：lib/stageFrames.mjs（服务端造帧纯逻辑核）
 *         web/src/lib/sseParser.mjs（前端切帧/归约纯逻辑核）
 *
 * 断言分组：
 *   A 阶段序列与真值取词（序列闭集 / 六语同源 / 缺语降级 / 刻度单调）
 *   B 帧构造与线格式（阶段帧 / ready 白名单注入 / 失败帧 / SSE 线格式）
 *   C 前端解析核（整块消费 / 极端切分零丢帧 / CRLF+坏帧容错 / 误判守卫）
 *   D 服务端接线铁律（402/403/429 先于建流 / 里程碑次序 / JSON 旁置保留 / fail-closed / 引渡纪律）
 *   E 前端守备（进度卡 testid + 零硬编码 / App 双模分流 + 降级回退 / 条件渲染）
 *   F 段位守备（Gate 43 居收口位之前 · 段数 ≥ 42）
 *   G 注入反漂移（篡改字典文案 / 篡改刻度 ⇒ 判据必红）
 *
 * 纯 Node 运行（无 DOM / 无网络 / 无 LLM / 不起 python）。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import os from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const DICT = JSON.parse(readFileSync(join(ROOT, 'astro', 'astro_terms_dict.json'), 'utf8'));
const LANGS = DICT.meta.langs;
const STAGE_DOMAIN = DICT.domains.pipelineStages;
const STAGE_KEYS = ['EphemerisFetch', 'TensorFusion', 'ContractResolve', 'ReportAssemble'];
const TITLE_KEY = 'PipelineRunning';

const SF = await import(pathToFileURL(join(ROOT, 'lib/stageFrames.mjs')).href);
const SP = await import(pathToFileURL(join(ROOT, 'web/src/lib/sseParser.mjs')).href);

const readSrc = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const SERVER = readSrc('server.js');
const BRANCH_START = "if (reportType === 'monthly' || reportType === 'yearly' || reportType === 'once') {";
const BRANCH_END = '// ── 普通合盘洞察(旧逻辑)──';
const BRANCH = SERVER.slice(
  SERVER.indexOf(BRANCH_START),
  SERVER.indexOf(BRANCH_END, SERVER.indexOf(BRANCH_START)),
);

/* ═══════════════════════════ 判据（供 G 组注入复用）═══════════════════════════ */

/** 判据①：序列键集 == 闭集，且每键在字典域中存在 */
function judgeStageKeys(mod, dict) {
  const bad = [];
  const keys = mod.STAGE_SEQUENCE.map((s) => s.key);
  if (keys.length !== STAGE_KEYS.length) bad.push(`阶段数 ${keys.length} ≠ ${STAGE_KEYS.length}`);
  for (let i = 0; i < STAGE_KEYS.length; i++) if (keys[i] !== STAGE_KEYS[i]) bad.push(`第${i}阶 ${keys[i]} ≠ ${STAGE_KEYS[i]}`);
  for (const k of keys) if (!dict.domains.pipelineStages[k]) bad.push(`字典缺词条 ${k}`);
  for (const s of mod.STAGE_SEQUENCE) if (s.state !== 'calculating' && s.state !== 'assembling') bad.push(`非法状态归属 ${s.state}`);
  return bad;
}

/** 判据②：六语逐阶 label（含标题）必须与字典真值**逐字节同源**（防硬编码） */
function judgeLabelsFromDict(mod, dict) {
  const bad = [];
  for (const lang of dict.meta.langs) {
    const title = mod.stageTitle(lang);
    if (title !== dict.domains.pipelineStages[TITLE_KEY][lang]) bad.push(`title.${lang} 非字典同源`);
    for (let i = 0; i < mod.STAGE_TOTAL; i++) {
      const f = mod.buildStageFrame(i, lang);
      const want = dict.domains.pipelineStages[mod.STAGE_SEQUENCE[i].key][lang];
      if (!f || f.label !== want) bad.push(`${lang}#${i} label 非字典同源`);
    }
  }
  return bad;
}

/** 判据③：刻度单调递增且 ≤ 100（防越界/乱序/倒挂） */
function judgePctScale(mod) {
  const bad = [];
  const pcts = mod.STAGE_SEQUENCE.map((s) => s.pct);
  for (let i = 1; i < pcts.length; i++) if (!(pcts[i] > pcts[i - 1])) bad.push(`刻度非严格递增 @${i}`);
  for (const p of pcts) if (!(Number.isFinite(p) && p > 0 && p <= 100)) bad.push(`刻度越界 ${p}`);
  if (!(mod.STAGE_READY_PCT === 100)) bad.push('ready 刻度 ≠ 100');
  if (!(mod.STAGE_SEQUENCE[pcts.length - 1].pct < mod.STAGE_READY_PCT)) bad.push('末阶刻度未低于 ready');
  return bad;
}

/** 判据④：ready 帧白名单（绝不泄漏内部对象） */
function judgeReadyWhitelist(mod) {
  const bad = [];
  const f = mod.buildReadyFrame('zh', { insight: 'i', cached: true, payload: { a: 1 }, reportId: 'r1', _g41Replay: { secret: 1 }, userId: 'u1', plans: {} });
  for (const k of Object.keys(f)) {
    if (!['stage', 'index', 'total', 'pct', 'title', 'label', 'insight', 'cached', 'payload', 'reportId'].includes(k)) bad.push(`越白名单键 ${k}`);
  }
  if (f.stage !== 'ready' || f.pct !== 100) bad.push('ready 帧标识/刻度异常');
  return bad;
}

/* ═══════════════════════════ 注入夹具 ═══════════════════════════ */

/** 复制真值源 + 兄弟依赖（astroTerms.js 读 ./astro/astro_terms_dict.json）到临时目录再变异导入 */
function loadStageFramesMutated({ mutateDict, mutateModule } = {}) {
  const dir = mkdtempSync(join(os.tmpdir(), 'g43-inject-'));
  mkdirSync(join(dir, 'lib'), { recursive: true });
  mkdirSync(join(dir, 'astro'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module' }), 'utf8');
  const dict = mutateDict ? mutateDict(JSON.parse(readSrc('astro/astro_terms_dict.json'))) : JSON.parse(readSrc('astro/astro_terms_dict.json'));
  writeFileSync(join(dir, 'astro', 'astro_terms_dict.json'), JSON.stringify(dict, null, 2), 'utf8');
  writeFileSync(join(dir, 'astroTerms.js'), readSrc('astroTerms.js'), 'utf8');
  const src = readSrc('lib/stageFrames.mjs');
  writeFileSync(join(dir, 'lib', 'stageFrames.mjs'), mutateModule ? mutateModule(src) : src, 'utf8');
  return import(pathToFileURL(join(dir, 'lib', 'stageFrames.mjs')).href);
}

/* ═══════════════════════════ A 阶段序列与真值取词 ═══════════════════════════ */

test('A1 阶段序列为闭集四阶（键集/顺序/状态归属均锁定，且词条在字典域内）', () => {
  assert.deepEqual(judgeStageKeys(SF, DICT), []);
  assert.equal(SF.STAGE_TOTAL, 4);
  assert.equal(SF.STAGE_TITLE_KEY, TITLE_KEY);
});

test('A2 六语逐阶文案（含标题）与字典真值逐字节同源 —— 禁硬编码', () => {
  assert.deepEqual(judgeLabelsFromDict(SF, DICT), []);
  // 反证：字典域内确有 5 条（4 阶段 + 1 标题），且 Gate 43 只用其中 5 条
  assert.equal(Object.keys(STAGE_DOMAIN).length, 5);
});

test('A3 缺语回退 zh（显式降级）；未知词条抛错（防拼写错静默假绿）', () => {
  assert.equal(SF.stageLabel('EphemerisFetch', 'xx'), STAGE_DOMAIN.EphemerisFetch.zh);
  assert.throws(() => SF.stageLabel('NoSuchStageKey', 'zh'), /未知阶段词条/);
});

test('A4 刻度刻度单调递增且 ≤100，ready 恒 100（防越界/倒挂）', () => {
  assert.deepEqual(judgePctScale(SF), []);
});

/* ═══════════════════════════ B 帧构造与线格式 ═══════════════════════════ */

test('B1 阶段帧全形态齐备；越界/非整数 ⇒ null（绝不造伪帧）', () => {
  for (const lang of LANGS) {
    const f = SF.buildStageFrame(2, lang);
    assert.equal(f.stage, 'assembling');
    assert.equal(f.index, 2);
    assert.equal(f.total, 4);
    assert.equal(f.pct, SF.STAGE_SEQUENCE[2].pct);
    assert.equal(f.label, STAGE_DOMAIN.ContractResolve[lang]);
    assert.equal(f.title, STAGE_DOMAIN[TITLE_KEY][lang]);
  }
  assert.equal(SF.buildStageFrame(-1, 'zh'), null);
  assert.equal(SF.buildStageFrame(4, 'zh'), null);
  assert.equal(SF.buildStageFrame('2', 'zh'), null);
  assert.equal(SF.buildStageFrame(null, 'zh'), null);
});

test('B2 ready 帧白名单注入：只透传契约字段，内部对象零泄漏', () => {
  assert.deepEqual(judgeReadyWhitelist(SF), []);
  const f = SF.buildReadyFrame('zh', { insight: '正文', cached: false, reportId: null });
  assert.equal(f.reportId, undefined, '空 reportId 不得注入');
  assert.equal(f.cached, false);
});

test('B3 失败帧 fail-closed：stage=failed，绝不伪造成 ready', () => {
  const f = SF.buildErrorFrame('AI_GENERATION_FAILED', 'boom');
  assert.equal(f.stage, 'failed');
  assert.equal(f.code, 'AI_GENERATION_FAILED');
  assert.notEqual(f.stage, 'ready');
  assert.equal(SF.classifyStageFrame(f).type, 'error');
});

test('B4 SSE 线格式与常量（data: 前缀 / \\n\\n 分隔 / [DONE] 哨兵 / 心跳注释）', () => {
  const wire = SF.sseData(SF.buildStageFrame(0, 'zh'));
  assert.ok(wire.startsWith('data: {') && wire.endsWith('}\n\n'), '线格式漂移');
  assert.ok(JSON.parse(wire.slice(6, -2)).label === STAGE_DOMAIN.EphemerisFetch.zh);
  assert.equal(SF.SSE_DONE, 'data: [DONE]\n\n');
  assert.ok(SF.SSE_HEARTBEAT.startsWith(':'), '心跳必须为注释帧（前端应忽略）');
  assert.match(SF.SSE_CONTENT_TYPE, /^text\/event-stream/);
  assert.equal(SF.sseData(null), null);
});

/* ═══════════════════════════ C 前端解析核 ═══════════════════════════ */

const wireAll = () => {
  let w = SF.SSE_HEARTBEAT;
  for (let i = 0; i < SF.STAGE_TOTAL; i++) w += SF.sseData(SF.buildStageFrame(i, 'zh'));
  w += SF.sseData(SF.buildReadyFrame('zh', { insight: '正文X', cached: false, payload: { schemaVersion: 'report_payload.v1' }, reportId: 'rid9' }));
  return w + SF.SSE_DONE;
};

test('C1 整块消费：帧数/类型/归约结果正确', () => {
  const p = SP.createSSEParser();
  const evs = p.push(wireAll()).concat(p.flush());
  assert.equal(evs.length, 6, `应 4 阶段 + 1 ready + 1 done，实得 ${evs.length}`);
  assert.deepEqual(evs.map((e) => SP.classifySSEFrame(e).type), ['stage', 'stage', 'stage', 'stage', 'ready', 'done']);
  const r = SP.reduceSSEFrames(evs);
  assert.equal(r.ready.insight, '正文X');
  assert.equal(r.ready.reportId, 'rid9');
  assert.equal(r.stage.pct, 90);
  assert.equal(r.done, true);
  assert.equal(r.error, null);
});

test('C2 极端切分（逐字符 / 3 字节）零丢帧 —— 半帧滞留缓冲不截断', () => {
  const wire = wireAll();
  for (const step of [1, 3, 7]) {
    const p = SP.createSSEParser();
    let evs = [];
    for (let i = 0; i < wire.length; i += step) evs = evs.concat(p.push(wire.slice(i, i + step)));
    evs = evs.concat(p.flush());
    const r = SP.reduceSSEFrames(evs);
    assert.equal(evs.length, 6, `step=${step} 丢帧（${evs.length}）`);
    assert.equal(r.ready && r.ready.insight, '正文X', `step=${step} 终帧丢失`);
    assert.equal(r.stage.pct, 90, `step=${step} 末进度偏移`);
  }
});

test('C3 CRLF 兼容 + 坏帧丢弃不中断 + 心跳/空帧静默忽略 + 无尾随空行末帧不丢', () => {
  const p = SP.createSSEParser();
  const evs = p.push('data: {bad json\n\n' + SF.sseData(SF.buildStageFrame(2, 'zh'))).concat(p.flush());
  assert.equal(evs.length, 1, '坏帧未被丢弃');
  assert.equal(SP.classifySSEFrame(evs[0]).type, 'stage');

  const p2 = SP.createSSEParser();
  const evs2 = p2.push(wireAll().replace(/\n/g, '\r\n')).concat(p2.flush());
  assert.equal(evs2.length, 6, 'CRLF 切帧失败');

  // 无尾部空行的末帧（flush 兜底）
  const p3 = SP.createSSEParser();
  const evs3 = p3.push('data: {"stage":"ready","insight":"尾帧"}');
  assert.equal(evs3.length, 0, '未闭合帧被提前吐出');
  assert.equal(p3.flush().length, 1, 'flush 未冲刷尾帧');
});

test('C4 误判守卫：未知形状 / 缺 insight 的 ready / 非对象一律 ignore（绝不误当终帧）', () => {
  assert.equal(SP.classifySSEFrame({ data: { meta: { a: 1 } } }).type, 'ignore');
  assert.equal(SP.classifySSEFrame({ data: { stage: 'ready' } }).type, 'ignore');
  assert.equal(SP.classifySSEFrame(null).type, 'ignore');
  assert.equal(SP.classifySSEFrame({ data: 5 }).type, 'ignore');
  assert.equal(SP.parseSSEFrame(': ping'), undefined);
  assert.equal(SP.parseSSEFrame('event: x'), undefined);
});

/* ═══════════════════════════ D 服务端接线铁律 ═══════════════════════════ */

test('D1 402 权益 / 403 周期锁 / 429 日限流 —— 全部先于建流（fail-closed 不可在建流后）', () => {
  const i402 = BRANCH.indexOf('res.status(402).json');
  const iLock = BRANCH.indexOf('res.status(403).json(compatGuardBody');
  const iRate = BRANCH.indexOf('res.status(429).json(compatGuardBody');
  const iStream = BRANCH.indexOf('const _sse = _stream ? openCompatStream(res) : null;');
  for (const [n, i] of [['402', i402], ['403', iLock], ['429', iRate], ['建流', iStream]]) assert.ok(i > 0, `${n} 锚点缺失`);
  assert.ok(i402 < iStream && iLock < iStream && iRate < iStream, '建流早于 fail-closed 闸门（违反铁律）');
  // 复读命中直出亦须在建流前完成权益判定（复读块早于建流点）
  const iReplayStream = BRANCH.indexOf('const _rps = openCompatStream(res);');
  assert.ok(iReplayStream > 0 && iReplayStream < iStream, '复读直出建流点位置异常');
});

test('D2 里程碑次序：calculating → stage0 → 星历张量 → stage1 → stage2 → callAI → assembling → stage3', () => {
  const iCalc = BRANCH.indexOf("_pipe.advance('calculating')");
  const iStage0 = BRANCH.indexOf('if (_sse) _sse.stage(0, lang);');
  const iSyn = BRANCH.indexOf('const _compatSyn = await buildCompatSynastryTruth(');
  const iStage1 = BRANCH.indexOf('if (_sse) _sse.stage(1, lang);');
  // 🔴 stage2（「解析灵宠羁绊契约能量」）必须**先于** callAI 下发 —— 它宣告的正是最长的那段真实等待（AI 正文生成）
  const iStage2 = BRANCH.indexOf('if (_sse) _sse.stage(2, lang);');
  // 🔴 E100-② 后继化：终帧 CJK 清洗需重赋值 ⇒ const→let（锚随真源，语义不变）
  const iCall = BRANCH.indexOf('let insight = await callAI(');
  const iAsm = BRANCH.indexOf("_pipe.advance('assembling')");
  const iStage3 = BRANCH.indexOf('if (_sse) _sse.stage(3, lang);');
  const seq = [['calculating', iCalc], ['stage0', iStage0], ['synastry', iSyn], ['stage1', iStage1],
    ['stage2', iStage2], ['callAI', iCall], ['assembling', iAsm], ['stage3', iStage3]];
  for (const [n, i] of seq) assert.ok(i > 0, `${n} 锚点缺失`);
  for (let i = 1; i < seq.length; i++) {
    assert.ok(seq[i - 1][1] < seq[i][1], `次序破坏：${seq[i - 1][0]}(${seq[i - 1][1]}) 未先于 ${seq[i][0]}(${seq[i][1]})`);
  }
});

test('D3 终帧 ready 与 JSON 回执逐字段同源（insight/cached/payload/reportId 四字段齐）', () => {
  const i = BRANCH.indexOf('if (_sse) {');
  const seg = BRANCH.slice(i, BRANCH.indexOf('return res.json({ insight, cached: false });'));
  assert.ok(/const _sseBody = \{ insight, cached: false \};/.test(seg), 'ready 载体缺 insight/cached');
  assert.ok(/if \(_pipelinePayload\) _sseBody\.payload = _pipelinePayload;/.test(seg), 'ready 载体缺 payload 条件注入');
  assert.ok(/if \(_pipelinePayload && _g41Persisted\) _sseBody\.reportId = _g41ReportId;/.test(seg), 'ready 载体缺 reportId 条件注入');
});

test('D4 JSON 通路旁置保留（封仓字面量分毫不动）+ 流式失败 fail-closed', () => {
  assert.ok(BRANCH.includes('res.json({ insight, cached: false })'), '三档 JSON 回执契约被改动（E40 C5 锚点）');
  assert.ok(BRANCH.includes('const _g41Body = { insight, cached: false, payload: _pipelinePayload };'), 'Gate 41 回执构造被改动');
  assert.ok(BRANCH.includes('if (_g41Persisted) _g41Body.reportId = _g41ReportId;'), 'Gate 41 reportId 条件附带被改动（D4 锚点）');
  assert.ok(BRANCH.includes("if (_sse) return _sse.fail('AI_GENERATION_FAILED', aiError.message);"), '流式失败未 fail-closed');
  // 流式分支必须**旁置**于 JSON 通路之前，且 JSON 通路仍在流式分支之后（零回归）
  const iSseBranch = BRANCH.indexOf('if (_sse) {');
  const iJsonReturn = BRANCH.indexOf('return res.json({ insight, cached: false });');
  assert.ok(iSseBranch > 0 && iSseBranch < iJsonReturn, '流式分支未旁置于 JSON 通路之前');
});

test('D5 引渡纪律：Gate 40 / Gate 41 契约行字节级原样 + Gate 43 独立成行（不稀释既有闸门）', () => {
  assert.ok(SERVER.includes("import { buildReportPayload, createReportPipeline, REPORT_PAYLOAD_SCHEMA } from './lib/reportPipeline.mjs';"), 'Gate 40 引渡契约行被污染');
  assert.ok(SERVER.includes("import { deriveCompatReportId, deserializePersistedPayload, planPersistRow } from './lib/reportPipeline.mjs';"), 'Gate 41 引渡契约行被污染');
  assert.ok(SERVER.includes("import { buildStageFrame, buildReadyFrame, buildErrorFrame, sseData, SSE_DONE, SSE_HEARTBEAT, SSE_CONTENT_TYPE } from './lib/stageFrames.mjs';"), 'Gate 43 引渡行缺失');
  // 建流器必须定义在端点之前（否则闸门早于建流的次序断言形同虚设）
  const iOpen = SERVER.indexOf('function openCompatStream(res) {');
  assert.ok(iOpen > 0 && iOpen < SERVER.indexOf('app.use(\'/api/ai-advisor\''), '建流器定义位置异常');
});

/* ═══════════════════════════ E 前端守备 ═══════════════════════════ */

test('E1 进度卡组件：testid 齐备 + 文案零硬编码（阶段文案一律来自帧体）', () => {
  const src = readSrc('web/src/components/SynastryProgress.tsx');
  assert.ok(/data-testid="synastry-progress"/.test(src), '缺进度卡 testid');
  assert.ok(/overflowWrap: 'anywhere'/.test(src) && /wordBreak: 'break-word'/.test(src) && /minWidth: 0/.test(src), '进度卡缺断行三道防线');
  // 零硬编码：组件不得内联任何阶段文案（含 zh 与 en 真值）
  for (const lang of ['zh', 'en', 'th', 'vi']) {
    for (const k of STAGE_KEYS.concat([TITLE_KEY])) {
      assert.ok(!src.includes(STAGE_DOMAIN[k][lang]), `进度卡硬编码了 ${k}.${lang} 文案`);
    }
  }
});

test('E2 App 双模分流：SSE 优先 + 一切异常情形回退 JSON（优雅降级，绝不阻塞交付）', () => {
  const app = readSrc('web/src/App.tsx');
  assert.ok(/stream: true/.test(app), 'App 未请求流式模式');
  assert.ok(/content-type/.test(app) && /includes\('text\/event-stream'\)/.test(app), 'App 未做流式响应判定');
  assert.ok(/typeof res\.body\.getReader === 'function'/.test(app), 'App 缺流式能力探测（老浏览器降级）');
  assert.ok(/data = await res\.json\(\);/.test(app), 'JSON 回退通路被误删');
  assert.ok(/function readCompatSSEStream\(/.test(app), '缺读流适配函数');
  assert.ok(/reduceSSEFrames\(seen\)/.test(app), 'App 未接入纯解析核归约');
});

test('E3 进度卡装配退役（E85 合盘板块下架）+ SSE 读流核保留（月报/年报交付零回归）', () => {
  const app = readSrc('web/src/App.tsx');
  // 🧹 E85（主公军令 2026-10-24）：「合盘」整个功能板块及报告退役——进度卡条件渲染、
  //   SynastryProgress 装配、reportStage 态全部下架；SSE 读流核（readCompatSSEStream）
  //   保留供月报/年报流式取数据（onStage 置 noop，进度帧零消费者零渲染）。
  assert.ok(!/\{reportLoading && reportStage && \(/.test(app), 'E85 进度卡条件渲染残留违令');
  assert.ok(!/<SynastryProgress/.test(app), 'E85 进度卡装配残留违令');
  assert.ok(!app.includes('reportStage'), 'E85 reportStage 态残留违令');
  // 🛡️ E96-②（主公军令 2026-10-26）断言后继化：读流核调用新增第三参 onText（正文增量帧
  //   边收边显，TTFT<2s）——原 E85 双参形态随之演进，守卫语义不变（读流核仍在＋真流式消费在线）。
  assert.ok(/readCompatSSEStream\(res\.body, \(\) => \{ \/\* E85: 进度帧无消费者 \*\/ \}, \(t: string\) =>/.test(app), 'E96 后继：SSE 读流核＋真流式 onText 消费缺失（月报/年报交付回归）');
});

/* ═══════════════════════════ F 段位守备 ═══════════════════════════ */

test('F1 Gate 43 居收口位（e40-compat）之前 · 段数 ≥ 42', () => {
  const pkg = JSON.parse(readSrc('package.json'));
  const segs = pkg.scripts['test:astro'].split('&&').map((s) => s.trim());
  // 🔴 下界 + 相对位置（漂移免疫）：与 Gate 40 G1 / Gate 41 F1 / Gate 42 F1 同范式
  assert.ok(segs.length >= 42, `段数须 ≥ 42（41 + Gate 43），实为 ${segs.length}`);
  const iG43 = segs.findIndex((s) => s.includes('audit-e41plus-gate43-sse-stage-frames'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.ok(iG43 >= 0, 'Gate 43 未入编 test:astro');
  assert.ok(iCap > iG43, 'Gate 43 必须居收口位之前（段序红线）');
  assert.equal(iCap, segs.length - 2, 'e40-compat 必须保持收口位（倒数第二段）');
  assert.ok(segs[segs.length - 1].includes('python'), '链尾必须为 python 段');
});

/* ═══════════════════════════ G 注入反漂移 ═══════════════════════════ */

test('G1 注入：篡改字典阶段文案 ⇒ 「六语同源」判据必红（判据与真值同源）', async () => {
  const mod = await loadStageFramesMutated({
    mutateDict: (d) => { d.domains.pipelineStages.TensorFusion.zh = '被篡改的文案'; return d; },
  });
  const bad = judgeLabelsFromDict(mod, DICT);
  assert.ok(bad.length > 0, '文案漂移未被击落（判据失能）');
  assert.ok(bad.some((b) => b.includes('zh#1')), `未定位到 zh 第 1 阶：${bad.join('|')}`);
});

test('G2 注入：篡改刻度（越界 / 倒挂）与删阶 ⇒ 序列与刻度判据必红', async () => {
  const modA = await loadStageFramesMutated({
    mutateModule: (s) => s.replace('key: \'EphemerisFetch\',  pct: 15', 'key: \'EphemerisFetch\',  pct: 150'),
  });
  assert.ok(judgePctScale(modA).length > 0, '刻度越界未被击落');

  const modB = await loadStageFramesMutated({
    mutateModule: (s) => s.replace('key: \'ReportAssemble\',  pct: 90', 'key: \'ReportAssemble\',  pct: 10'),
  });
  assert.ok(judgePctScale(modB).length > 0, '刻度倒挂未被击落');

  const modC = await loadStageFramesMutated({
    mutateModule: (s) => s.replace(/\s*Object\.freeze\(\{ state: 'assembling',\s+key: 'ReportAssemble',\s+pct: 90 \}\),/, ''),
  });
  const dC = judgeStageKeys(modC, DICT);
  assert.ok(dC.length > 0, '删阶未被击落（序列闭集判据失能）');
});
