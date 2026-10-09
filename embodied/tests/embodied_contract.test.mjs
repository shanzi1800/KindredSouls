/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KindredSouls / Soul OS Embodied Intelligence Open Protocol
 * © 2026 KindredSouls. All rights reserved.
 * PATENT-PENDING —— 双母 PCT 国际专利实施例证据链组成部分。
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🧪 embodied_contract.test.mjs —— 具身智能协议专属契约测试套件
 *
 * 职责（E36 立 · 纳入 test:astro 长链）：
 *   ① 三份 JSON Schema 合法且必填字段齐备；
 *   ② Agent 执行槽位与语音槽位的**冻结契约形状**正确；
 *   ③ 🔴 安全硬约束：确认位**不可翻转**、越界值 fail-closed 降级；
 *   ④ 路由注册表与命名空间自洽；
 *   ⑤ 目录纪律：专利头齐备 / 零密钥 / 零反向依赖。
 *
 * 运行：node --test embodied/tests/embodied_contract.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const EMB = path.join(ROOT, 'embodied');
const read = (p) => fs.readFileSync(path.join(EMB, p), 'utf8');

const GATEWAY = await import(path.join(EMB, 'core', 'embodied_gateway.js'));
const TRANSLATOR = await import(path.join(EMB, 'core', 'intent_translator.js'));

// ── 目录清单（结构纪律的射程）──
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const ALL_FILES = walk(EMB).map((p) => path.relative(ROOT, p).split(path.sep).join('/'));

// ═══════════════════════════════════════════════════════════
// A. JSON Schema 契约
// ═══════════════════════════════════════════════════════════
test('A1 三份协议 Schema 存在且为合法 JSON', () => {
  for (const name of ['persona.schema.json', 'motion.schema.json', 'perception.schema.json']) {
    const raw = read(path.join('specs', name));
    let doc;
    assert.doesNotThrow(() => { doc = JSON.parse(raw); }, `${name} 不是合法 JSON`);
    assert.equal(doc.$schema, 'https://json-schema.org/draft/2020-12/schema', `${name} $schema 不符`);
    assert.ok(Array.isArray(doc.required) && doc.required.length > 0, `${name} 缺 required`);
    assert.ok(typeof doc.$comment === 'string' && doc.$comment.includes('PATENT-PENDING'),
      `${name} 缺专利归属声明（$comment 须含 PATENT-PENDING）`);
  }
});

test('A2 persona Schema 显式冻结 Agent 执行与语音双模态两槽', () => {
  const doc = JSON.parse(read(path.join('specs', 'persona.schema.json')));
  const defs = doc.$defs || {};
  assert.ok(defs.agentIntentAction, 'persona Schema 缺 agentIntentAction 定义');
  assert.ok(defs.voiceStreamMeta, 'persona Schema 缺 voiceStreamMeta 定义');
  assert.deepEqual(
    Object.keys(defs.agentIntentAction.properties).sort(),
    ['action_payload', 'action_type', 'requires_user_confirmation'],
    'agentIntentAction 键集不符契约',
  );
  assert.deepEqual(
    Object.keys(defs.voiceStreamMeta.properties).sort(),
    ['emotional_tone', 'viseme_timeline', 'voice_id'],
    'voiceStreamMeta 键集不符契约',
  );
  assert.equal(defs.agentIntentAction.properties.requires_user_confirmation.const, true,
    'Schema 未把确认位钉死为 const true');
});

test('A3 motion Schema 内置动作安全闸（幅度上限 + 永不自主消费）', () => {
  const doc = JSON.parse(read(path.join('specs', 'motion.schema.json')));
  const safety = doc.properties.safety;
  assert.ok(safety, 'motion Schema 缺 safety 安全闸');
  assert.equal(safety.properties.requires_user_confirmation.const, true, '安全闸确认位未钉死');
  assert.equal(safety.properties.never_autonomous_spend.const, true, '安全闸缺「永不自主消费」');
});

test('A4 perception Schema 只收脱敏标签，禁原始音视频与精确坐标', () => {
  const doc = JSON.parse(read(path.join('specs', 'perception.schema.json')));
  assert.ok(doc.properties.labels, 'perception Schema 缺 labels');
  assert.equal(doc.properties.labels.items.type, 'string', 'labels 应为结构化标签（非原始数据）');
  assert.ok(doc.properties.zone_radius_km, '缺 zone_radius_km（区域模糊半径）');
  assert.ok(!JSON.stringify(doc).includes('"video"'), 'perception 不得接收原始视频');
});

// ═══════════════════════════════════════════════════════════
// B. Agent 执行槽位（冻结契约 + 安全硬约束）
// ═══════════════════════════════════════════════════════════
test('B1 AGENT_INTENT_RESERVED 冻结且键集/默认值完全 inert', () => {
  const R = GATEWAY.AGENT_INTENT_RESERVED;
  assert.ok(Object.isFrozen(R), 'AGENT_INTENT_RESERVED 必须冻结');
  assert.deepEqual(Object.keys(R).sort(), ['action_payload', 'action_type', 'requires_user_confirmation']);
  assert.equal(R.action_type, 'none', '默认动作类型必须为 none（安全态）');
  assert.equal(R.action_payload.service, null, '默认 service 必须 null');
  assert.equal(R.action_payload.reasoning_astral, null, '默认星历依据必须 null');
  assert.deepEqual(R.action_payload.target_params, {}, '默认 target_params 必须为空对象');
  assert.equal(R.requires_user_confirmation, true, '默认确认位必须 true');
});

test('B2 🔴 确认位不可翻转：显式传 false 仍被构造器强制改回 true', () => {
  const flipped = GATEWAY.buildAgentIntentAction({ requires_user_confirmation: false });
  assert.equal(flipped.requires_user_confirmation, true,
    '构造器未强制覆写确认位 —— 存在「AI 自主执行」风险面');
});

test('B3 越界值 fail-closed：未知 action_type 降级 none，未知 service 置 null', () => {
  const bad = GATEWAY.buildAgentIntentAction({
    action_type: 'transfer_money',
    action_payload: { service: 'paypal', reasoning_astral: '   ' },
  });
  assert.equal(bad.action_type, 'none', '未知 action_type 未降级为 none');
  assert.equal(bad.action_payload.service, null, '未知 service 未置 null');
  assert.equal(bad.action_payload.reasoning_astral, null, '空白星历依据未置 null');
  assert.equal(bad.requires_user_confirmation, true, '降级路径也必须保留确认位');
});

test('B4 合法值透传且闭集完备（四动作类型 / 三服务类型）', () => {
  assert.deepEqual([...GATEWAY.AGENT_ACTION_TYPES].sort(),
    ['calendar_schedule', 'commerce_order', 'lifestyle_reserve', 'none']);
  assert.deepEqual([...GATEWAY.AGENT_ACTION_SERVICES].sort(), ['flight', 'opentable', 'shopify']);
  const ok = GATEWAY.buildAgentIntentAction({
    action_type: 'lifestyle_reserve',
    action_payload: { service: 'opentable', reasoning_astral: '金星相位极佳且火星避险', target_params: { seats: 2, window_seat: true } },
  });
  assert.equal(ok.action_type, 'lifestyle_reserve');
  assert.equal(ok.action_payload.service, 'opentable');
  assert.equal(ok.action_payload.target_params.seats, 2);
  assert.equal(ok.requires_user_confirmation, true);
});

// ═══════════════════════════════════════════════════════════
// C. 语音双模态槽位
// ═══════════════════════════════════════════════════════════
test('C1 VOICE_STREAM_META_RESERVED 冻结且默认全 inert', () => {
  const V = GATEWAY.VOICE_STREAM_META_RESERVED;
  assert.ok(Object.isFrozen(V), 'VOICE_STREAM_META_RESERVED 必须冻结');
  assert.deepEqual(Object.keys(V).sort(), ['emotional_tone', 'viseme_timeline', 'voice_id']);
  assert.equal(V.voice_id, null);
  assert.equal(V.emotional_tone, null);
  assert.equal(V.viseme_timeline, null, '无音频流 ⇒ 嘴型音素时间轴必须 null');
});

test('C2 语调闭集四值齐备（与引擎四象一一对应）', () => {
  assert.deepEqual([...GATEWAY.VOICE_EMOTIONAL_TONES].sort(),
    ['caring', 'deep_affection', 'energetic', 'witty']);
});

test('C3 语音槽越界 fail-closed（未知语调/非法时间轴一律 null）', () => {
  const bad = GATEWAY.buildVoiceStreamMeta({ voice_id: '  ', emotional_tone: 'angry', viseme_timeline: 'nope' });
  assert.equal(bad.voice_id, null);
  assert.equal(bad.emotional_tone, null);
  assert.equal(bad.viseme_timeline, null);
});

// ═══════════════════════════════════════════════════════════
// D. 路由注册表与出参装配
// ═══════════════════════════════════════════════════════════
test('D1 EMBODIED_ROUTES 冻结且四条全在 /api/v1/embodied/ 命名空间', () => {
  const R = GATEWAY.EMBODIED_ROUTES;
  assert.ok(Object.isFrozen(R), 'EMBODIED_ROUTES 必须冻结');
  assert.equal(R.length, 4, `具身路由应为 4 条，实为 ${R.length}`);
  for (const r of R) {
    assert.ok(r.path.startsWith('/api/v1/embodied/'), `${r.path} 未使用对外协议层命名空间`);
    assert.ok(['get', 'post'].includes(r.method), `${r.path} 方法非法`);
    assert.ok(r.endpoint.startsWith('embodied.'), `${r.path} endpoint 标识前缀不符`);
  }
  assert.deepEqual(R.map((r) => r.endpoint).sort(),
    ['embodied.action-intent', 'embodied.memory-stream', 'embodied.perception-sync', 'embodied.persona']);
});

test('D2 embodiedReservedExtras 装配两槽且保持 inert', () => {
  const extras = GATEWAY.embodiedReservedExtras('embodied.persona');
  assert.equal(extras.endpoint, 'embodied.persona');
  assert.equal(extras.action_intent.action_type, 'none');
  assert.equal(extras.action_intent.requires_user_confirmation, true);
  assert.deepEqual(Object.keys(extras.voice_stream_meta).sort(),
    ['emotional_tone', 'viseme_timeline', 'voice_id']);
});

test('D3 转换器本批恒 inert，且无真值时显式 null（绝不伪造）', () => {
  assert.equal(TRANSLATOR.translateAstralIntent(null).action_type, 'none', '无档案时未保持 inert');
  assert.equal(TRANSLATOR.translateAstralIntent({ relation_mode: 'buddy' }).action_type, 'none',
    '有档案但无算子时未保持 inert');
  assert.equal(TRANSLATOR.readDecisionOperators(null), null, '无档案应显式 null');
  assert.equal(TRANSLATOR.readDecisionOperators({ decision_operators: [] }), null, '数组不是算子对象 ⇒ null');
  assert.equal(TRANSLATOR.describeAstralReasoning(null), null);
});

test('D4 转换器只读消费算子，不自造权重表（防真值漂移）', () => {
  // 🔴 自指悖论防守：红线文案**必须引用**真源名才能写明「不得复制」
  //   ⇒ 禁词扫描的射程只能落在**真值块（代码行）**，注释行一律排除
  //      （与仓内铁律「只扫真值块，指令侧改用正面证据」同源）。
  const src = read(path.join('core', 'intent_translator.js'));
  const codeOnly = src.split('\n').filter((L) => {
    const t = L.trim();
    return !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('/*');
  }).join('\n');
  for (const banned of ['primary_factors:', 'emphasis_houses:', 'RELATION_DECISION_OPERATORS =']) {
    assert.ok(!codeOnly.includes(banned), `转换器真值块出现自造算子表痕迹: ${banned}`);
  }
  // 正面证据：转换器在注释中已明示「不复制第二份权重表」的纪律
  assert.ok(src.includes('只读消费'), '转换器缺少「只读消费」纪律声明');
  // 真实算子表只应存在于 Python 引擎（唯一真源）
  const engine = fs.readFileSync(path.join(ROOT, 'astro', 'familiar_engine.py'), 'utf8');
  assert.ok(engine.includes('RELATION_DECISION_OPERATORS'), 'Python 引擎缺决策算子唯一真源');
});

// ═══════════════════════════════════════════════════════════
// E. 目录纪律（专利头 / 零密钥 / 零反向依赖）
// ═══════════════════════════════════════════════════════════
test('E1 目录结构齐备（README + 3 Schema + 2 core + 3 adapters + 1 test）', () => {
  const need = [
    'embodied/README.md',
    'embodied/specs/persona.schema.json',
    'embodied/specs/motion.schema.json',
    'embodied/specs/perception.schema.json',
    'embodied/core/embodied_gateway.js',
    'embodied/core/intent_translator.js',
    'embodied/adapters/cockpit/README.md',
    'embodied/adapters/humanoid/README.md',
    'embodied/adapters/companion_pet/README.md',
    'embodied/tests/embodied_contract.test.mjs',
  ];
  for (const f of need) assert.ok(ALL_FILES.includes(f), `缺文件: ${f}`);
});

test('E2 全部文件携带专利归属声明（KindredSouls / Soul OS + PATENT-PENDING）', () => {
  for (const f of ALL_FILES) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.ok(src.includes('KindredSouls / Soul OS'), `${f} 缺「KindredSouls / Soul OS」归属声明`);
    assert.ok(src.includes('PATENT-PENDING'), `${f} 缺 PATENT-PENDING 专利保护标记`);
  }
});

test('E3 零密钥：目录内不得出现任何真实凭据形态', () => {
  const SECRET_PATTERNS = [
    /sk_live_[A-Za-z0-9]{10,}/, /sk_test_[A-Za-z0-9]{10,}/, /whsec_[A-Za-z0-9]{10,}/,
    /shpat_[A-Za-z0-9]{10,}/, /AIza[0-9A-Za-z_-]{20,}/, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  ];
  for (const f of ALL_FILES) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const p of SECRET_PATTERNS) {
      assert.ok(!p.test(src), `${f} 命中密钥形态 ${p}`);
    }
  }
});

test('E4 零反向依赖：core 与 adapters 不得引用业务线私有模块', () => {
  const BANNED = [/from\s+['"][^'"]*server\.js['"]/, /from\s+['"][^'"]*\/wealth[^'"]*['"]/,
    /from\s+['"][^'"]*web\/src[^'"]*['"]/, /require\(\s*['"][^'"]*server\.js['"]/];
  for (const f of ALL_FILES) {
    if (!f.endsWith('.js') && !f.endsWith('.mjs')) continue;
    if (f.endsWith('embodied_contract.test.mjs')) continue;   // 测试自带 ROOT 读取，不算依赖
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const p of BANNED) assert.ok(!p.test(src), `${f} 出现反向依赖: ${p}`);
  }
});
