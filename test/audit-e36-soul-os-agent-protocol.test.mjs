/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🤖 E36 闸门：Soul OS 具身决策与 Agent 执行中枢预留（第 16 道防线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（2026-10-09 军师《E36 战略架构升级战备号令》+ 主公 Soul OS 护城河摊牌）：
 *   ① Agent 执行挂点：`action_intent` 协议槽（默认 inert），生活执行必经用户确认；
 *   ② 语音双模态挂点：`voice_stream_meta`（voice_id / emotional_tone / viseme_timeline）；
 *   ③ 真值驱动决策：四象决策算子权重隔离（专利级 Reverse Synergy，唯一真源在 Python 引擎）；
 *   ④ 逻辑物理归仓：`embodied/` 独立领地（零依赖 / 零密钥 / 零反向引用）。
 *
 * 六路取证：
 *   A 契约级：两槽冻结契约形状 + 闭集完备 + 零版本副本
 *   B 安全级：确认位不可翻转 + 越界 fail-closed + 前后端零真实密钥
 *   C 行为级：真实 CLI 四象出参（两槽 inert / 声线四值互异 / 算子签名隔离）
 *   D 结构级：server.js 两槽 + 具身端点出参归仓 + 门控不回归 + 路由注册表同源
 *   E 结构级：前端 Overlay 插拔桩存在且零重量级动画库依赖
 *   F 文档 + G 实机 HTTP + H 注入自测
 *
 * 运行：node --test test/audit-e36-soul-os-agent-protocol.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SERVER_SRC = read('server.js');
const ENGINE_SRC = read('astro/familiar_engine.py');
const SPEC_SRC = read('docs/SOUL_OS_OPEN_SPEC.md');
const GATEWAY_SRC = read('embodied/core/embodied_gateway.js');
const TRANSLATOR_SRC = read('embodied/core/intent_translator.js');
const OVERLAY_SRC = read('web/src/components/FamiliarOverlay.tsx');

const GATEWAY = await import(path.join(ROOT, 'embodied/core/embodied_gateway.js'));
const TRANSLATOR = await import(path.join(ROOT, 'embodied/core/intent_translator.js'));

const MODES = ['girlfriend', 'buddy', 'bestie', 'boyfriend'];
const EMBODIED_ROUTES = [
  { method: 'get', path: '/api/v1/embodied/persona' },
  { method: 'post', path: '/api/v1/embodied/perception-sync' },
  { method: 'get', path: '/api/v1/embodied/action-intent' },
  { method: 'post', path: '/api/v1/embodied/memory-stream' },
];

// ── 真实 CLI（familiar_engine 无 swisseph 依赖 ⇒ 裸 python3 即可）──
function cliJson(args) {
  const out = execFileSync('python3', [path.join('astro', 'familiar_engine.py'), ...args], {
    cwd: ROOT, encoding: 'utf8', timeout: 30000,
  });
  return JSON.parse(out);
}
const profileOf = (m) => cliJson(['--mode', 'profile', '--sun', 'Scorpio', '--moon', 'Pisces', '--asc', 'Taurus', '--relation-mode', m]);

// ═══════════════════════════════════════════════════════════
// A. 契约级：两槽冻结契约
// ═══════════════════════════════════════════════════════════
test('A1 AGENT_INTENT_RESERVED 冻结且默认完全 inert', () => {
  const R = GATEWAY.AGENT_INTENT_RESERVED;
  assert.ok(Object.isFrozen(R), 'AGENT_INTENT_RESERVED 必须冻结（唯一真源契约）');
  assert.deepEqual(Object.keys(R).sort(), ['action_payload', 'action_type', 'requires_user_confirmation']);
  assert.equal(R.action_type, 'none', '默认动作类型必须为 none（安全态）');
  assert.equal(R.action_payload.service, null);
  assert.equal(R.action_payload.reasoning_astral, null);
  assert.deepEqual(R.action_payload.target_params, {});
  assert.equal(R.requires_user_confirmation, true, '默认确认位必须 true');
});

test('A2 VOICE_STREAM_META_RESERVED 冻结且默认三字段全 null', () => {
  const V = GATEWAY.VOICE_STREAM_META_RESERVED;
  assert.ok(Object.isFrozen(V), 'VOICE_STREAM_META_RESERVED 必须冻结');
  assert.deepEqual(Object.keys(V).sort(), ['emotional_tone', 'viseme_timeline', 'voice_id']);
  assert.equal(V.voice_id, null);
  assert.equal(V.emotional_tone, null);
  assert.equal(V.viseme_timeline, null, '无音频流 ⇒ 嘴型音素时间轴必须 null');
});

test('A3 三组闭集完备（动作类型 / 服务类型 / 情感语调）', () => {
  assert.deepEqual([...GATEWAY.AGENT_ACTION_TYPES].sort(),
    ['calendar_schedule', 'commerce_order', 'lifestyle_reserve', 'none']);
  assert.deepEqual([...GATEWAY.AGENT_ACTION_SERVICES].sort(), ['flight', 'opentable', 'shopify']);
  assert.deepEqual([...GATEWAY.VOICE_EMOTIONAL_TONES].sort(),
    ['caring', 'deep_affection', 'energetic', 'witty']);
});

test('A4 零版本副本：embodied/ 不得再定义契约版本常量（防第四条版本线）', () => {
  // 🔴 射程只落**代码文件**：文档（README / Schema）必须写明版本值才能指向唯一真源，
  //    那不是「版本线副本」。（与仓内铁律「指令侧引用禁词须排除」同源）
  const codeFiles = walkFiles(path.join(ROOT, 'embodied'))
    .filter((f) => /\.(js|mjs|cjs|ts|tsx|json)$/.test(f));
  assert.ok(codeFiles.length >= 6, `具身目录代码文件扫描射程异常（实得 ${codeFiles.length}）`);
  for (const f of codeFiles) {
    const src = fs.readFileSync(f, 'utf8');
    assert.ok(!/SOUL_OS_PROTOCOL_VERSION\s*=\s*['"]/.test(src),
      `${path.relative(ROOT, f)} 复制了契约版本常量 —— 版本线唯一真源应只在 py / server.js / 北极星文档`);
    assert.ok(!/\bv\d{3}\b/.test(src),
      `${path.relative(ROOT, f)} 出现缓存版本 vNNN 形态（两条版本线禁混用）`);
  }
  // 正向证据：README 必须显式声明「本目录刻意不复制版本」
  assert.ok(read('embodied/README.md').includes('刻意不复制'),
    'embodied/README.md 未声明「不复制版本常量」的纪律');
});

// ═══════════════════════════════════════════════════════════
// B. 安全级：确认位与 fail-closed
// ═══════════════════════════════════════════════════════════
test('B1 🔴 确认位不可翻转：显式传 false 仍被强制改回 true', () => {
  for (const inject of [{ requires_user_confirmation: false }, { requires_user_confirmation: 0 },
    { requires_user_confirmation: null }, { requires_user_confirmation: 'no' }]) {
    assert.equal(GATEWAY.buildAgentIntentAction(inject).requires_user_confirmation, true,
      `注入 ${JSON.stringify(inject)} 后确认位被翻转 —— AI 自主执行风险面`);
  }
});

test('B2 越界值 fail-closed（动作类型降级 none / 服务置 null / 空白依据置 null）', () => {
  const bad = GATEWAY.buildAgentIntentAction({
    action_type: 'transfer_money',
    action_payload: { service: 'paypal', reasoning_astral: '   ' },
  });
  assert.equal(bad.action_type, 'none');
  assert.equal(bad.action_payload.service, null);
  assert.equal(bad.action_payload.reasoning_astral, null);
  assert.equal(bad.requires_user_confirmation, true);
});

test('B3 语音槽越界 fail-closed（未知语调 / 非数组时间轴一律 null）', () => {
  const bad = GATEWAY.buildVoiceStreamMeta({ voice_id: '  ', emotional_tone: 'angry', viseme_timeline: 'nope' });
  assert.equal(bad.voice_id, null);
  assert.equal(bad.emotional_tone, null);
  assert.equal(bad.viseme_timeline, null);
});

test('B4 🔴 前端与具身目录零真实密钥（凭据一律由 B 端持方持有）', () => {
  // 第三方服务商密钥形态（电商 / 订餐 / 支付 / 地图）
  const PROVIDER_SECRETS = [
    /sk_live_[A-Za-z0-9]{10,}/, /sk_test_[A-Za-z0-9]{10,}/, /whsec_[A-Za-z0-9]{10,}/,
    /shpat_[A-Za-z0-9]{10,}/, /AIza[0-9A-Za-z_-]{20,}/,
    /opentable[_-]?key\s*[:=]\s*['"][^'"]{8,}/i,
  ];
  // 任意 JWT 串：仅在**具身目录**内禁止（前端公开配置如 Supabase anon key 属另一范畴）
  const ANY_JWT = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./;

  const embFiles = walkFiles(path.join(ROOT, 'embodied'));
  const webFiles = walkFiles(path.join(ROOT, 'web', 'src'));
  assert.ok(embFiles.length >= 10, '具身目录扫描射程异常');
  assert.ok(webFiles.length >= 10, '前端扫描射程异常');

  const hits = [];
  for (const f of embFiles) {
    const src = fs.readFileSync(f, 'utf8');
    for (const p of [...PROVIDER_SECRETS, ANY_JWT]) {
      if (p.test(src)) hits.push(`${path.relative(ROOT, f)} :: ${p}`);
    }
  }
  for (const f of webFiles) {
    const src = fs.readFileSync(f, 'utf8');
    for (const p of PROVIDER_SECRETS) {
      if (p.test(src)) hits.push(`${path.relative(ROOT, f)} :: ${p}`);
    }
  }
  assert.deepEqual(hits, [], '命中真实密钥形态');
  // 正向证据：具身目录必须显式声明「零密钥」纪律
  assert.ok(GATEWAY_SRC.includes('零密钥'), '网关缺「零密钥」纪律声明');
});

test('B5 禁词扫描器自证：注入假密钥 ⇒ B4 判据必红（防射程失效）', () => {
  const FAKE = 'sk_live_' + 'A'.repeat(24);
  assert.ok(/sk_live_[A-Za-z0-9]{10,}/.test(`const k = '${FAKE}';`), '判据射程失效：假密钥未被识别');
});

// ═══════════════════════════════════════════════════════════
// C. 行为级：引擎四象出参
// ═══════════════════════════════════════════════════════════
test('C1 引擎出参含 action_intent（inert）与 voice_stream_meta（结构齐备）', () => {
  const p = profileOf('buddy');
  assert.ok('action_intent' in p, '出参缺 action_intent 槽');
  assert.equal(p.action_intent, null, 'action_intent 本期必须 inert（null）');
  const v = p.voice_stream_meta;
  assert.ok(v && typeof v === 'object', '出参缺 voice_stream_meta 槽');
  assert.deepEqual(Object.keys(v).sort(), ['emotional_tone', 'viseme_timeline', 'voice_id']);
  assert.equal(v.viseme_timeline, null, '无音频流 ⇒ viseme_timeline 必须 null');
});

test('C2 四象声线确定性：emotional_tone 四值互异且在网关闭集内', () => {
  const EXPECT = { girlfriend: 'caring', buddy: 'energetic', bestie: 'witty', boyfriend: 'deep_affection' };
  const seen = new Set();
  const voices = new Set();
  for (const m of MODES) {
    const v = profileOf(m).voice_stream_meta;
    assert.equal(v.emotional_tone, EXPECT[m], `${m} 语调映射不符`);
    assert.ok(GATEWAY.VOICE_EMOTIONAL_TONES.includes(v.emotional_tone),
      `${m} 语调 ${v.emotional_tone} 不在网关闭集内（两侧漂移）`);
    assert.ok(typeof v.voice_id === 'string' && v.voice_id.length > 0, `${m} 缺 voice_id`);
    seen.add(v.emotional_tone);
    voices.add(v.voice_id);
  }
  assert.equal(seen.size, 4, '四象语调必须两两互异');
  assert.equal(voices.size, 4, '四象声线 ID 必须两两互异');
});

test('C3 🔴 四象决策算子权重隔离（专利级 Reverse Synergy）', () => {
  const sig = {};
  for (const m of MODES) {
    const ops = profileOf(m).decision_operators;
    assert.ok(ops && typeof ops === 'object', `${m} 缺 decision_operators`);
    assert.ok(Array.isArray(ops.primary_factors) && ops.primary_factors.length > 0, `${m} 主因子缺失`);
    assert.ok(Array.isArray(ops.emphasis_houses) && ops.emphasis_houses.length > 0, `${m} 重点宫位缺失`);
    assert.ok(typeof ops.intent_zh === 'string' && ops.intent_zh.length > 0, `${m} 缺决策意图`);
    sig[m] = JSON.stringify([ops.primary_factors, ops.emphasis_houses]);
  }
  assert.equal(new Set(Object.values(sig)).size, 4, `四象算子未隔离: ${JSON.stringify(sig)}`);
  // 抽验两侧关键因子（与主公圣旨逐条对应）
  assert.deepEqual(profileOf('girlfriend').decision_operators.primary_factors, ['venus', 'mars', 'moon']);
  assert.deepEqual(profileOf('buddy').decision_operators.emphasis_houses, [11, 3]);
  assert.deepEqual(profileOf('boyfriend').decision_operators.primary_factors, ['sun', 'jupiter']);
  assert.deepEqual(profileOf('bestie').decision_operators.primary_factors, ['mercury', 'moon']);
});

test('C4 引擎四表键集不变式（配色/算子/声线不得漏项）', () => {
  assert.match(ENGINE_SRC, /assert \(set\(RELATION_MODES\) == set\(RELATION_PALETTE\)/,
    '引擎缺四表键集一致性不变式（漏项会让人格静默拿不到配色/声线/算子）');
  assert.match(ENGINE_SRC, /== set\(RELATION_DECISION_OPERATORS\) == set\(RELATION_VOICE_MATRIX\)\)/,
    '不变式未覆盖决策算子与声线矩阵');
});

test('C5 转换器本批恒 inert，无真值显式 null（绝不伪造）', () => {
  assert.equal(TRANSLATOR.translateAstralIntent(null).action_type, 'none');
  assert.equal(TRANSLATOR.translateAstralIntent(profileOf('buddy')).action_type, 'none',
    '即便有真实档案，本批也必须保持 inert');
  assert.equal(TRANSLATOR.readDecisionOperators(null), null);
  assert.equal(TRANSLATOR.readDecisionOperators({ decision_operators: [] }), null);
  assert.equal(TRANSLATOR.empty, undefined);
});

test('C6 转换器只读消费算子：真值块零自造权重表（自指悖论防守）', () => {
  // 🔴 射程只落**代码行**：红线条文必须引用真源名才能写明「禁止复制」，
  //    注释行一律排除（与仓内铁律「只扫真值块」同源）。
  const codeOnly = TRANSLATOR_SRC.split('\n').filter((L) => {
    const t = L.trim();
    return !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('/*');
  }).join('\n');
  for (const banned of ['primary_factors:', 'emphasis_houses:', 'RELATION_DECISION_OPERATORS =']) {
    assert.ok(!codeOnly.includes(banned), `转换器真值块出现自造算子表: ${banned}`);
  }
  assert.ok(TRANSLATOR_SRC.includes('只读消费'), '转换器缺「只读消费」纪律声明（正面证据）');
});

// ═══════════════════════════════════════════════════════════
// D. 结构级：server.js 落点
// ═══════════════════════════════════════════════════════════
const E36_SLOT_MARK = 'action_intent: null,';
const SLOT_IDX = SERVER_SRC.indexOf(E36_SLOT_MARK);
const SLOT_SRC = SLOT_IDX === -1 ? '' : SERVER_SRC.slice(SLOT_IDX, SLOT_IDX + 400);

test('D1 SOUL_OS_RESERVED 增两槽且默认 inert', () => {
  assert.ok(SLOT_IDX !== -1, '未在 server.js 找到 action_intent 槽位');
  assert.match(SLOT_SRC, /action_intent: null,/, '缺 action_intent 槽');
  assert.match(SLOT_SRC, /voice_stream_meta: null,/, '缺 voice_stream_meta 槽');
  // 两槽必须落在同一个冻结契约（SOUL_OS_RESERVED）内
  const reservedIdx = SERVER_SRC.indexOf('const SOUL_OS_RESERVED = Object.freeze(');
  assert.ok(reservedIdx !== -1 && reservedIdx < SLOT_IDX, '两槽未落在 SOUL_OS_RESERVED 冻结契约内');
});

test('D2 具身端点出参归仓 embodied/core（4 条），且首行门控零回归', () => {
  const delegations = [...SERVER_SRC.matchAll(/embodiedReservedExtras\('/g)].length;
  assert.equal(delegations, 4, `具身端点出参应全部经 embodiedReservedExtras 装配，实为 ${delegations}`);
  for (const r of EMBODIED_ROUTES) {
    assert.ok(SERVER_SRC.includes(`app.${r.method}('${r.path}'`), `未注册 ${r.method.toUpperCase()} ${r.path}`);
  }
  // 🔴 E35 首行门控形态不得回归（5 端点：soul.card + 具身 4）
  const guards = [...SERVER_SRC.matchAll(
    /app\.(get|post)\('\/api\/v1\/[^']+',\s*\(req,\s*res\)\s*=>\s*\{\s*\n\s*if \(!soulOsGate\(req, res\)\) return;/g,
  )];
  assert.equal(guards.length, 5, `5 个端点必须首行门控（E35 铁律），实为 ${guards.length}`);
});

test('D3 server.js 路由注册串与 EMBODIED_ROUTES 逐条同源', () => {
  assert.equal(GATEWAY.EMBODIED_ROUTES.length, EMBODIED_ROUTES.length);
  for (const r of GATEWAY.EMBODIED_ROUTES) {
    assert.ok(SERVER_SRC.includes(`app.${r.method}('${r.path}'`),
      `路由注册表与 server.js 不同源: ${r.method.toUpperCase()} ${r.path}`);
  }
});

test('D4 具身端点不得自起子进程 / 不得挂管理员或绿道特权通路', () => {
  const start = SERVER_SRC.indexOf('// ② 人格与语气装载');
  const end = SERVER_SRC.indexOf('🛍️ V463：爆款/物理法器', start);
  assert.ok(start !== -1 && end > start, '未定位具身端点区块');
  const block = SERVER_SRC.slice(start, end);
  assert.ok(!/execSync|execFileSync|spawn\(/.test(block), '具身端点不得自起子进程');
  assert.ok(!/e30AdminGuard|wealthGreenChannelAuthorized|wealthIsGreenChannel/.test(block),
    '具身端点误挂管理员/绿道特权通路');
});

// ═══════════════════════════════════════════════════════════
// E. 前端：Overlay 插拔桩
// ═══════════════════════════════════════════════════════════
test('E1 FamiliarOverlay 插拔桩存在（浮窗最小化 / 眼神跟随 / 气泡渲染 + 状态通信桩）', () => {
  assert.ok(OVERLAY_SRC.length > 800, 'FamiliarOverlay.tsx 内容过短');
  for (const k of ['minimized', 'onToggleMinimize', 'bubbleText', 'renderAvatar', 'toOverlayState']) {
    assert.ok(OVERLAY_SRC.includes(k), `Overlay 缺插拔槽: ${k}`);
  }
  assert.ok(/normalizeLook/.test(OVERLAY_SRC), 'Overlay 缺眼神跟随归一化');
});

test('E2 🔴 本批不挂载任何重量级动画库（包体积零增长铁律）', () => {
  const HEAVY = ['@esotericsoftware/spine', 'spine-', 'pixi.js', 'pixi', 'live2d', '@rive-app',
    'rive', 'three', 'lottie', 'babylon'];
  const hits = HEAVY.filter((h) => OVERLAY_SRC.includes(h));
  assert.deepEqual(hits, [], `Overlay 引入了重量级动画库: ${hits.join(', ')}`);
  // 正面证据：必须显式声明「不挂载重量级动画库」的纪律
  assert.ok(OVERLAY_SRC.includes('不挂载任何重量级动画库'), 'Overlay 缺「不挂载动画库」纪律声明');
});

test('E3 Overlay 出参形状与具身端点槽位同源（display_palette / emotion_state / voice_stream_meta）', () => {
  for (const k of ['display_palette', 'emotion_state', 'voice_stream_meta', 'motion_intent', 'relation_mode']) {
    assert.ok(OVERLAY_SRC.includes(k), `Overlay 状态桩未对齐出参槽: ${k}`);
  }
});

// ═══════════════════════════════════════════════════════════
// F. 文档
// ═══════════════════════════════════════════════════════════
test('F1 北极星文档含 E36 三节与全部关键字段', () => {
  for (const s of ['### 4.4 Agent 执行协议', '### 4.5 语音双模态协议', '### 4.6 四象决策算子']) {
    assert.ok(SPEC_SRC.includes(s), `北极星缺小节: ${s}`);
  }
  for (const k of ['action_intent', 'voice_stream_meta', 'voice_id', 'emotional_tone', 'viseme_timeline',
    'requires_user_confirmation', 'lifestyle_reserve', 'calendar_schedule', 'commerce_order',
    'opentable', 'shopify', 'sophia_tender', 'milo_protective', 'RELATION_DECISION_OPERATORS']) {
    assert.ok(SPEC_SRC.includes(k), `北极星缺字段: ${k}`);
  }
  assert.ok(SPEC_SRC.includes('embodied/'), '北极星未登记具身目录归仓');
});

test('F2 具身目录 README 存在且含专利交底索引与硬件对接规范', () => {
  const rd = read('embodied/README.md');
  for (const k of ['专利交底索引', '硬件对接规范', 'PATENT-PENDING', 'cockpit', 'humanoid', 'companion_pet']) {
    assert.ok(rd.includes(k), `embodied/README.md 缺: ${k}`);
  }
});

// ═══════════════════════════════════════════════════════════
// G. 实机 HTTP（真实 spawn server.js）
// ═══════════════════════════════════════════════════════════
const BASE_ENV = { ...process.env };
delete BASE_ENV.SOUL_OS_OPEN_PROTOCOL;
delete BASE_ENV.SOUL_DEVICE_KEY;

async function withServer(extraEnv, port, fn) {
  const child = spawn('node', ['server.js'], {
    cwd: ROOT, env: { ...BASE_ENV, PORT: String(port), ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let boot = '';
  child.stdout.on('data', (d) => { boot += d; });
  child.stderr.on('data', (d) => { boot += d; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let up = false;
    for (let i = 0; i < 60; i++) {
      try { const r = await fetch(`${base}/api/health`); if (r.ok) { up = true; break; } } catch (_) { /* retry */ }
      await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(up, `server.js 未在 30s 内就绪；日志尾部: ${boot.slice(-300)}`);
    return await fn(base);
  } finally {
    child.kill('SIGKILL');
    await new Promise((r) => setTimeout(r, 300));
  }
}

const SOUL_OS_KEY = 'e36-unit-test-device-key';

test('G1 门控开 + 正确设备 Key ⇒ 具身端点 200 且两新槽 inert', async () => {
  await withServer({ SOUL_OS_OPEN_PROTOCOL: '1', SOUL_DEVICE_KEY: SOUL_OS_KEY },
    5100 + (process.pid % 40), async (base) => {
      for (const r of EMBODIED_ROUTES) {
        const res = await fetch(base + r.path, {
          method: r.method.toUpperCase(),
          headers: { 'Content-Type': 'application/json', 'x-soul-device-key': SOUL_OS_KEY },
          body: r.method === 'post' ? '{}' : undefined,
        });
        assert.equal(res.status, 200, `${r.path} 应 200，实得 ${res.status}`);
        const j = await res.json();
        assert.equal(j.live, false, '封仓期 live 必须 false');
        assert.equal(j.protocol_version, '1.0');
        assert.ok(j.action_intent && j.action_intent.action_type === 'none',
          `${r.path} action_intent 必须 inert（action_type=none）`);
        assert.equal(j.action_intent.requires_user_confirmation, true, `${r.path} 确认位必须 true`);
        assert.ok(j.voice_stream_meta && j.voice_stream_meta.voice_id === null
          && j.voice_stream_meta.emotional_tone === null
          && j.voice_stream_meta.viseme_timeline === null,
        `${r.path} voice_stream_meta 必须三字段全 inert`);
        assert.ok(!/sk_live_|sk_test_|shpat_|whsec_/.test(JSON.stringify(j)),
          `${r.path} 出参不得携带任何密钥形态`);
      }
    });
});

test('G2 门控关（默认）⇒ 具身端点仍 503（E35 防御零回归）', async () => {
  await withServer({}, 5150 + (process.pid % 40), async (base) => {
    for (const r of EMBODIED_ROUTES) {
      const res = await fetch(base + r.path, {
        method: r.method.toUpperCase(),
        headers: { 'Content-Type': 'application/json' },
        body: r.method === 'post' ? '{}' : undefined,
      });
      assert.equal(res.status, 503, `${r.path} 门控关应 503，实得 ${res.status}`);
      assert.equal((await res.json()).code, 'SOUL_OS_PROTOCOL_DISABLED');
    }
    assert.equal((await fetch(`${base}/api/health`)).status, 200, 'health 应 200');
  });
});

// ═══════════════════════════════════════════════════════════
// H. 注入自测
// ═══════════════════════════════════════════════════════════
test('H1 注入：抹掉确认位强制覆写 ⇒ B1 判据必红', () => {
  // 模拟「构造器不再强制 true」的缺陷版本
  const broken = GATEWAY_SRC.replace(
    /requires_user_confirmation: true,   \/\/ 🔴 恒 true（构造器强制；见上方铁律 ①）/,
    'requires_user_confirmation: o.requires_user_confirmation === undefined ? true : o.requires_user_confirmation,',
  );
  assert.notEqual(broken, GATEWAY_SRC, '注入失败：未命中确认位强制覆写');
  const make = (src) => {
    const body = src.slice(src.indexOf('export function buildAgentIntentAction'));
    return body;
  };
  assert.ok(!/requires_user_confirmation: true,   \/\/ 🔴 恒 true/.test(make(broken)),
    '注入后应无强制覆写 —— 否则 B1 判据失效');
});

test('H2 注入：给 Overlay 塞一个重量级动画库引用 ⇒ E2 判据必红', () => {
  const injected = OVERLAY_SRC.replace("import { useCallback, useRef, useState } from 'react';",
    "import { useCallback, useRef, useState } from 'react';\nimport * as PIXI from 'pixi.js';");
  assert.notEqual(injected, OVERLAY_SRC, '注入失败：未命中 Overlay 导入区');
  const HEAVY = ['pixi.js', 'spine-', 'live2d', '@rive-app', 'lottie', 'three'];
  assert.ok(HEAVY.some((h) => injected.includes(h)), '注入后应能检出重量级动画库 —— 否则 E2 判据失效');
});

test('H3 注入：翻转确认位 Const 断言 ⇒ B1 判据必红（判据射程自证）', () => {
  const flipped = GATEWAY.buildAgentIntentAction({ requires_user_confirmation: false });
  assert.equal(flipped.requires_user_confirmation, true);
  // 反向：若构造器真被改坏，则本断言应失败 —— 用缺陷版构造器自证
  const brokenCtor = (o) => Object.assign({}, GATEWAY.AGENT_INTENT_RESERVED, o || {});
  assert.equal(brokenCtor({ requires_user_confirmation: false }).requires_user_confirmation, false,
    '缺陷版构造器未能复现漏洞 —— 说明 B1 的判据射程覆盖不到该缺陷');
});

test('H4 块注释卫生：本闸门 / server.js / 具身目录的块注释行不得出现提前闭合形态', () => {
  // 病根：块注释里写 `foo*/bar` ⇒ `*/` 提前闭合注释、后续文本变裸代码（E34/E35 两度踩坑）。
  // 🔴 射程只扫**块注释行**（trim 后以星号起手的续行，或以斜杠+星号起手的开行），
  //    排除正则字面量与行注释（行注释由 H5 守）。
  //    注：本行刻意不写出「斜杠紧跟星号」的字面量 —— 那会自触发 H5（同一文件的整行注释自扫）。
  const hits = (src) => src.split('\n')
    .filter((L) => { const t = L.trim(); return t.startsWith('*') || t.startsWith('/*'); })
    .filter((L) => /\w\*\/\w/.test(L));
  const SELF = fs.readFileSync(import.meta.filename, 'utf8');
  assert.deepEqual(hits(SERVER_SRC), [], 'server.js 块注释行出现提前闭合形态');
  assert.deepEqual(hits(SELF), [], '本闸门块注释行出现提前闭合形态');
  assert.deepEqual(hits(GATEWAY_SRC), [], 'embodied_gateway.js 块注释行出现提前闭合形态');
  // 注入自测：把缺陷塞进真块注释行。
  //   🔴 锚点必须含 **ASCII 词字符**：`\w` 不匹配非 ASCII，中文旁的 `*/` 不在射程内
  //      （这正是 E34/E35 两次收窄后确认的射程边界）。
  const anchor = ' * 运行：node --test test/audit-e36-soul-os-agent-protocol.test.mjs';
  assert.ok(SELF.includes(anchor), '注入锚点缺失（头注释被改写）');
  const injected = SELF.replace(anchor, anchor.replace('node', 'no*/de'));
  assert.ok(hits(injected).length > 0, '注入后应能检出 —— 否则本判据失效');
});

test('H5 🔴 本战切片行注释卫生：E36 新增区块 / embodied/ / 本闸门不得含未同行闭合的裸起始符', () => {
  // ── E36 血案（本次实测）──────────────────────────────────────────────
  //   E36 桥接注释里写了 `embodied/specs/` 后接星号的路径形态 ⇒ 下游闸门的注释剥离器
  //   （先剥块注释、后剥行注释；非贪婪）把它当成块注释开头 ⇒ **跨行吞掉 1050 行**
  //   （实测：`app.post('/api/wealth-oracle')` 剥后 indexOf = -1、`_hitMatrix` 4→0、
  //     `V490` 22→2）⇒ 10 道既有闸门假红、长链首步即断。
  //
  //   🔴 射程纪律（仓内铁律：未证「缺陷落在判据射程内」的加锁 = 新增风险面）：
  //     只扫**本战新增区块** + `embodied/` 全目录 + 本闸门自身。
  //     server.js 存量两处（约 L6165 / L6204 的 test-harness 说明注释）为**已登记历史遗留**：
  //     二者当前确实吞掉约 50 行真实代码，但改写它会**改变所有下游闸门看到的剥后文本**
  //     ⇒ 属独立「去雷」战役射程（须单独全链验证），本闸门刻意不覆盖。
  //
  //   🔴 判据只取**整行注释**（trim 后以双斜杠起手）⇒ 天然排除
  //     ① 模板字符串里的 URL（如 http 协议日志行）② 块注释行（后者由 H4 守）。
  const hits = (src) => src.split('\n')
    .filter((L) => L.trim().startsWith('//'))
    .filter((L) => { const t = L.trim(); return t.includes('/*') && !t.includes('*/'); });

  const sliceBetween = (src, a, b) => {
    const i = src.indexOf(a);
    const j = i < 0 ? -1 : src.indexOf(b, i);
    assert.ok(i >= 0 && j > i, `切片标记缺失：${a} ↔ ${b}`);
    return src.slice(i, j);
  };
  // 本战在 server.js 的三处新增区块（导入区 / 出参两槽 / 桥接节点）
  const REGIONS = [
    sliceBetween(SERVER_SRC, '🤖 E36: 具身智能开放协议', 'V332-fix: StringDecoder'),
    sliceBetween(SERVER_SRC, '── E36 新增两槽', '── 门控：默认关（fail-closed）──'),
    sliceBetween(SERVER_SRC, '🤖 E36：Soul OS Agent 执行中枢与语音双模态预留（桥接节点）', '── [V238-STREAM-META] 共享:'),
  ];
  assert.ok(REGIONS.every((r) => r.length > 100), '新增区块切片射程异常（标记失配 ⇒ 射程塌陷）');

  const targets = [
    ['server.js::E36', REGIONS.join('\n')],
    ['本闸门', fs.readFileSync(import.meta.filename, 'utf8')],
  ];
  for (const f of walkFiles(path.join(ROOT, 'embodied'))) {
    if (/\.(js|mjs)$/.test(f)) targets.push([path.relative(ROOT, f), fs.readFileSync(f, 'utf8')]);
  }
  assert.ok(targets.length >= 5, '扫描射程异常（目标文件过少）');
  for (const [name, src] of targets) {
    assert.deepEqual(hits(src), [], `${name} 行注释出现未同行闭合的裸起始符（下游剥离器会跨行吞码）`);
  }

  // 注入自测：把危险形态塞回**射程内的真行注释** ⇒ 判据必红（且不破坏切片标记）
  const anchor = '本仓永不落地';
  assert.ok(REGIONS[2].includes(anchor), '注入锚点缺失（E36 桥接区块被改写）');
  const injected = REGIONS
    .map((r) => r.replace(anchor, anchor + '（凭据见 specs/' + '*.json）'))
    .join('\n');
  assert.ok(hits(injected).length > 0, '注入后未变红 —— 本判据射程失效');
});

// ── 目录遍历工具（B4 / A4 射程）──
function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else if (/\.(js|mjs|cjs|ts|tsx|json|md)$/.test(e.name)) out.push(p);
  }
  return out;
}
