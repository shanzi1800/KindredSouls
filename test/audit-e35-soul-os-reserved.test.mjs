/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 E35 闸门：Soul OS 开放协议预留（社交 + 具身智能底座）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（2026-10-09 军师《Soul OS 具身智能与社交生态协议底座开工令》+ 主公圣旨）：
 *   ① 对外协议层命名空间 `/api/v1/…`（与内部 `/api/…` 天然分野，第三方依赖版本承诺）；
 *   ② 门控默认关（fail-closed）：SOUL_OS_OPEN_PROTOCOL === '1' 才可能返回数据，
 *      未启用一律 503 SOUL_OS_PROTOCOL_DISABLED，且在任何数据读取之前返回；
 *   ③ 启用后仍须设备 API Key 常量时间鉴权；未配 / 未带 / 不匹配一律 401；
 *   ④ 出参设备中立：统一预留 motion_intent / emotion_state / display_palette + schema_version；
 *   ⑤ 数据槽位预留：device_bindings / social_preferences / familiar_memories.source；
 *   ⑥ 北极星文档封仓：docs/SOUL_OS_OPEN_SPEC.md。
 *
 * 六路取证：
 *   A 契约级：契约版本三侧同源 + source 枚举三值三侧同源
 *   B 行为级：真实 CLI 出参四槽 + display_palette 与 relation.palette 逐值同源 + 单一真源
 *   C 契约级：DDL §8 三列 + 幂等 ALTER + CHECK 幂等守卫 + 索引
 *   D 结构级：5 端点注册 + 首行门控 + 无 bypass + 设备中立 + 常量时间鉴权 + 冻结契约
 *   E 行为级：真实 spawn server.js 三档（门控关 503 / 开无 Key 401 / 开有 Key 200 inert）
 *   F 文档 + 注入自测：北极星四协议索引；注入缺陷 ⇒ 对应判据必红
 *
 * 运行：node --test test/audit-e35-soul-os-reserved.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const ENGINE_SRC = read('astro/familiar_engine.py');
const SERVER_SRC = read('server.js');
const SQL_SRC = read('db/familiar_profiles.sql');
const SPEC_SRC = read('docs/SOUL_OS_OPEN_SPEC.md');

// ── E35 代码块切片（源码级断言的射程）──
const E35_MARK = "const SOUL_OS_PROTOCOL_VERSION = '1.0';";
const E35_START = SERVER_SRC.indexOf(E35_MARK);
const E35_SRC = E35_START === -1
  ? ''
  : SERVER_SRC.slice(E35_START, SERVER_SRC.indexOf('🛍️ V463：爆款/物理法器', E35_START));

const SOURCES = ['app', 'embodied_device', 'im_chat'];
const ENDPOINTS = [
  { method: 'GET', path: '/api/v1/soul/card/:userId' },
  { method: 'GET', path: '/api/v1/embodied/persona' },
  { method: 'POST', path: '/api/v1/embodied/perception-sync' },
  { method: 'GET', path: '/api/v1/embodied/action-intent' },
  { method: 'POST', path: '/api/v1/embodied/memory-stream' },
];
const MODES = ['girlfriend', 'buddy', 'bestie', 'boyfriend'];

// ── 真实 CLI（familiar_engine 无 swisseph 依赖 ⇒ 裸 python3 即可）──
function cliJson(args) {
  const out = execFileSync('python3', [path.join('astro', 'familiar_engine.py'), ...args], {
    cwd: ROOT, encoding: 'utf8', timeout: 30000,
  });
  return JSON.parse(out);
}

// ═══════════════════════════════════════════════════════════
// A. 契约级：版本与枚举同源
// ═══════════════════════════════════════════════════════════
test('A1 SOUL_OS_PROTOCOL_VERSION 三侧同源（py / server.js / 北极星文档）', () => {
  const py = ENGINE_SRC.match(/^SOUL_OS_PROTOCOL_VERSION\s*=\s*'([^']+)'/m);
  assert.ok(py, 'familiar_engine.py 缺 SOUL_OS_PROTOCOL_VERSION 常量');
  const js = SERVER_SRC.match(/const SOUL_OS_PROTOCOL_VERSION = '([^']+)';/);
  assert.ok(js, 'server.js 缺 SOUL_OS_PROTOCOL_VERSION 常量');
  const doc = SPEC_SRC.match(/SOUL_OS_PROTOCOL_VERSION\s*=\s*'([^']+)'/);
  assert.ok(doc, '北极星文档缺 SOUL_OS_PROTOCOL_VERSION');
  assert.equal(py[1], js[1], 'py 与 server.js 契约版本不同源');
  assert.equal(js[1], doc[1], 'server.js 与北极星文档契约版本不同源');
  // 契约版本 ≠ 缓存版本（两条独立版本线，禁混用）
  assert.ok(!/^v\d+/.test(py[1]), '契约版本不应是 vNNN 缓存版本形态');
});

test('A2 familiar_memories.source 三值同源（SQL CHECK ↔ server.js ↔ 北极星文档）', () => {
  const sql = SQL_SRC.match(/CHECK\s*\(\s*source\s+IN\s*\(([^)]*)\)/i);
  assert.ok(sql, 'SQL 缺 source CHECK 约束');
  const sqlVals = sql[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).sort();
  assert.deepEqual(sqlVals, [...SOURCES].sort(), 'SQL CHECK 三值与约定不符');

  const jsSet = SERVER_SRC.match(/const SOUL_OS_MEMORY_SOURCES = new Set\(\[([^\]]*)\]\)/);
  assert.ok(jsSet, 'server.js 缺 SOUL_OS_MEMORY_SOURCES');
  const jsVals = jsSet[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean).sort();
  assert.deepEqual(jsVals, [...SOURCES].sort(), 'server.js 三值与 SQL 不同源');

  for (const v of SOURCES) {
    assert.ok(SPEC_SRC.includes(v), `北极星文档未列出 source 枚举值 ${v}`);
  }
});

// ═══════════════════════════════════════════════════════════
// B. 行为级：引擎出参四槽
// ═══════════════════════════════════════════════════════════
test('B1 引擎出参含 Soul OS 四槽（真实 CLI，设备中立）', () => {
  const p = cliJson(['--mode', 'profile', '--sun', 'Scorpio', '--moon', 'Pisces', '--asc', 'Taurus', '--relation-mode', 'buddy']);
  assert.equal(p.schema_version, '1.0', 'schema_version 应为 1.0');
  assert.ok('motion_intent' in p, '出参缺 motion_intent 槽');
  assert.equal(p.motion_intent, null, 'motion_intent 本期应 inert（null）');
  assert.equal(p.emotion_state, 'neutral', 'emotion_state 本期应 neutral');
  assert.ok(p.display_palette && typeof p.display_palette === 'object', '出参缺 display_palette 槽');
});

test('B2 display_palette 与 relation.palette 逐值同源（四象全量）', () => {
  for (const m of MODES) {
    const p = cliJson(['--mode', 'profile', '--sun', 'Scorpio', '--moon', 'Pisces', '--asc', 'Taurus', '--relation-mode', m]);
    for (const k of ['skin', 'primary', 'secondary']) {
      assert.equal(p.display_palette[k], p.relation.palette[k],
        `${m} display_palette.${k} 与 relation.palette 不同源`);
    }
  }
});

test('B3 调色板单一真源：主函数只调用一次 resolve_familiar_palette（防两处参数漂移）', () => {
  // 🔴 射程必须收窄到**主函数体**：文件下方自测块另有若干次直接调用（非生产路径）。
  const fnStart = ENGINE_SRC.indexOf('def calculate_familiar_profile(');
  const fnEnd = ENGINE_SRC.indexOf('def _cli(', fnStart);
  assert.ok(fnStart !== -1 && fnEnd > fnStart, '未定位到 calculate_familiar_profile 主函数体');
  const body = ENGINE_SRC.slice(fnStart, fnEnd);
  const calls = [...body.matchAll(/resolve_familiar_palette\(/g)].length;
  assert.equal(calls, 1, `主函数应只调用一次 resolve_familiar_palette，实为 ${calls}`);
  assert.match(ENGINE_SRC, /palette = resolve_familiar_palette\(relation_mode, sun_sign=sun_sign\)/,
    '缺 palette 变量提取（display_palette 将无法与 relation.palette 同源）');
});

// ═══════════════════════════════════════════════════════════
// C. 契约级：DDL §8
// ═══════════════════════════════════════════════════════════
test('C1 DDL §8 三列齐备且幂等（生态扩展槽 + 记忆来源解耦）', () => {
  assert.match(SQL_SRC, /ADD COLUMN IF NOT EXISTS device_bindings\s+JSONB\s+NOT NULL\s+DEFAULT\s+'\[\]'::jsonb/,
    '缺 device_bindings 幂等列');
  assert.match(SQL_SRC, /ADD COLUMN IF NOT EXISTS social_preferences\s+JSONB\s+NOT NULL\s+DEFAULT\s+'\{\}'::jsonb/,
    '缺 social_preferences 幂等列');
  assert.match(SQL_SRC, /ADD COLUMN IF NOT EXISTS source\s+VARCHAR\(24\)\s+NOT NULL\s+DEFAULT\s+'app'/,
    '缺 familiar_memories.source 幂等列');
});

test('C2 source CHECK 幂等守卫 + 索引（无 IF NOT EXISTS 的约束须探测 pg_constraint）', () => {
  assert.match(SQL_SRC, /familiar_memories_source_check/, '缺 CHECK 约束名');
  assert.match(SQL_SRC, /WHERE conname = 'familiar_memories_source_check'[\s\S]{0,160}'familiar_memories'::regclass/,
    '缺 pg_constraint 幂等探测（重复执行会报约束已存在）');
  assert.match(SQL_SRC, /CREATE INDEX IF NOT EXISTS idx_familiar_memories_source/, '缺 source 索引');
});

// ═══════════════════════════════════════════════════════════
// D. 结构级：端点契约
// ═══════════════════════════════════════════════════════════
test('D1 五个预留端点存在且方法正确', () => {
  assert.ok(E35_START !== -1, '未找到 E35 端点代码块');
  for (const ep of ENDPOINTS) {
    const needle = `app.${ep.method.toLowerCase()}('${ep.path}'`;
    assert.ok(SERVER_SRC.includes(needle), `未注册 ${ep.method} ${ep.path}`);
  }
  // 对外协议层命名空间：/api/v1/*
  assert.ok(E35_SRC.includes('/api/v1/'), '端点未使用 /api/v1/ 对外协议层命名空间');
});

test('D2 门控默认关 fail-closed + 每个端点首行门控', () => {
  assert.match(E35_SRC, /process\.env\.SOUL_OS_OPEN_PROTOCOL === '1'/, '门控未绑定 SOUL_OS_OPEN_PROTOCOL === 1');
  assert.match(E35_SRC, /code: 'SOUL_OS_PROTOCOL_DISABLED'/, '缺 SOUL_OS_PROTOCOL_DISABLED 响应码');
  assert.match(E35_SRC, /res\.status\(503\)[\s\S]{0,140}SOUL_OS_PROTOCOL_DISABLED/, '未启用须 503');
  // 每个端点 handler 第一句必须是门控（保证「在任何数据读取之前返回」）
  const guards = [...E35_SRC.matchAll(
    /app\.(get|post)\('\/api\/v1\/[^']+',\s*\(req,\s*res\)\s*=>\s*\{\s*\n\s*if \(!soulOsGate\(req, res\)\) return;/g,
  )];
  assert.equal(guards.length, 5, `5 个端点必须首行门控，实为 ${guards.length}`);
});

test('D3 严禁前端可控 bypass（防重造 E32-A 活体收入洞）', () => {
  for (const bad of ['free_access', 'freeAccess', 'bypass', 'isAdmin', 'is_admin', 'godmode', 'whitelist']) {
    assert.ok(!E35_SRC.includes(bad), `Soul OS 端点出现前端可控特权字段: ${bad}`);
  }
});

test('D4 设备与协议中立（无业务线专有字段；不挂管理员/绿道特权通路）', () => {
  for (const w of ['wealth', 'reportType', 'requiredPlan', 'paid_plans', 'entitlement', 'compat', 'sku']) {
    assert.ok(!E35_SRC.includes(w), `Soul OS 端点绑定了业务线概念: ${w}`);
  }
  assert.ok(!/e30AdminGuard|e30RequireAdminToken|wealthGreenChannelAuthorized|wealthIsGreenChannel/.test(E35_SRC),
    '端点误挂管理员/绿道特权通路');
});

test('D5 设备 Key 常量时间鉴权（复用 E30 timingSafeEqual 工具）', () => {
  assert.match(E35_SRC, /process\.env\.SOUL_DEVICE_KEY/, '缺 SOUL_DEVICE_KEY 环境变量');
  assert.match(E35_SRC, /_e30SafeEqual\(got, expected\)/, '设备 Key 未走常量时间比对');
  assert.match(E35_SRC, /if \(!expected\)[\s\S]{0,220}res\.status\(401\)/, '未配 Key 须 401 fail-closed');
});

test('D6 冻结契约唯一真源（构造器形态，禁手写第二份字面量）', () => {
  assert.match(E35_SRC, /const SOUL_SYNASTRY_TENSOR_RESERVED = Object\.freeze\(/, '缺 Synastry 冻结契约');
  assert.match(E35_SRC, /function buildSynastryTensor\(overrides\)/, '缺 buildSynastryTensor 构造器');
  assert.match(E35_SRC, /const SOUL_OS_RESERVED = Object\.freeze\(/, '缺 SOUL_OS_RESERVED 冻结契约');
  assert.match(E35_SRC, /function buildSoulOsReserved\(overrides\)/, '缺 buildSoulOsReserved 构造器');
  for (const k of ['harmony_score', 'communication_score', 'attraction_score']) {
    assert.ok(E35_SRC.includes(k), `Synastry 关系共振张量缺键 ${k}`);
  }
});

test('D7 E35 注释不得含未同行闭合的 `/*`（防下游注释剥离器跨行吞码）', () => {
  // 坑（E35 实测）：test/audit-v490-timezone.test.js 与 audit-v490b-coords.test.js 的 stripJs
  //   先剥块注释、后剥行注释 ⇒ 行注释里的裸起始符会被当成块注释开头，跨行吞掉后续整段代码
  //   （实测 wealth-oracle 端点剥后消失、cacheKey 赋值点 3→2）⇒ 假红。
  //   故 E35 注释一律用「斜杠 + 星号」的文字描述，不写裸起始符。
  const bad = [];
  E35_SRC.split('\n').forEach((L) => {
    const ci = L.indexOf('//');
    if (ci >= 0 && L.slice(ci).includes('/*') && !L.slice(ci).includes('*/')) bad.push(L.trim().slice(0, 90));
  });
  assert.deepEqual(bad, [], 'E35 代码块的行注释出现未同行闭合的 `/*`（会被下游注释剥离器误判为块注释起始）');
});

// ═══════════════════════════════════════════════════════════
// E. 行为级：真实启动 server.js（三档门控）
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

function callEndpoint(base, ep, headers) {
  return fetch(base + ep.path.replace(':userId', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'), {
    method: ep.method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: ep.method === 'POST' ? '{}' : undefined,
  });
}

test('E1 门控关（默认）⇒ 五端点全 503 SOUL_OS_PROTOCOL_DISABLED，绝不泄漏数据', async () => {
  await withServer({}, 4710 + (process.pid % 40), async (base) => {
    for (const ep of ENDPOINTS) {
      const r = await callEndpoint(base, ep);
      assert.equal(r.status, 503, `${ep.method} ${ep.path} 门控关应 503，实得 ${r.status}`);
      const j = await r.json();
      assert.equal(j.code, 'SOUL_OS_PROTOCOL_DISABLED', `${ep.path} 缺 SOUL_OS_PROTOCOL_DISABLED`);
      assert.ok(!j.profile && !j.display_palette && !j.triad,
        `${ep.path} 未启用时绝不得泄漏任何数据`);
    }
    const h = await fetch(`${base}/api/health`);
    assert.equal(h.status, 200, 'health 应 200（探活端点永不加门）');
  });
});

test('E2 门控开 + 未配/未带设备 Key ⇒ 401 fail-closed', async () => {
  await withServer({ SOUL_OS_OPEN_PROTOCOL: '1' }, 4760 + (process.pid % 40), async (base) => {
    const r = await callEndpoint(base, ENDPOINTS[1]);
    assert.equal(r.status, 401, `应 401，实得 ${r.status}`);
    assert.equal((await r.json()).code, 'SOUL_DEVICE_KEY_NOT_CONFIGURED', '未配 Key 应明确 code');
  });
});

test('E3 门控开 + 正确设备 Key ⇒ 200 且 live:false（骨架 inert，无真实数据）', async () => {
  await withServer({ SOUL_OS_OPEN_PROTOCOL: '1', SOUL_DEVICE_KEY: 'e35-unit-test-key' },
    4810 + (process.pid % 40), async (base) => {
      const r = await callEndpoint(base, ENDPOINTS[1], { 'x-soul-device-key': 'e35-unit-test-key' });
      assert.equal(r.status, 200, `应 200，实得 ${r.status}`);
      const j = await r.json();
      assert.equal(j.success, true);
      assert.equal(j.live, false, '封仓期 live 必须 false（骨架 inert）');
      assert.equal(j.protocol_version, '1.0', '回执须带契约版本');
      assert.equal(j.motion_intent, null, '封仓期 motion_intent 必须 inert');
    });
});

test('E4 门控开 + 错误设备 Key ⇒ 401（常量时间比对不放行）', async () => {
  await withServer({ SOUL_OS_OPEN_PROTOCOL: '1', SOUL_DEVICE_KEY: 'e35-unit-test-key' },
    4860 + (process.pid % 40), async (base) => {
      const r = await callEndpoint(base, ENDPOINTS[1], { 'x-soul-device-key': 'wrong-key' });
      assert.equal(r.status, 401, `错误 Key 应 401，实得 ${r.status}`);
      assert.equal((await r.json()).code, 'SOUL_DEVICE_UNAUTHORIZED');
    });
});

// ═══════════════════════════════════════════════════════════
// F. 文档 + 注入自测
// ═══════════════════════════════════════════════════════════
test('F1 北极星文档存在且含四协议索引 + 关键字段', () => {
  assert.ok(SPEC_SRC.length > 1000, 'docs/SOUL_OS_OPEN_SPEC.md 内容过短');
  for (const anchor of ['Soul Card', 'Synastry', 'Peer Handshake', 'Embodied']) {
    assert.ok(SPEC_SRC.includes(anchor), `北极星文档缺协议索引: ${anchor}`);
  }
  for (const k of ['harmony_score', 'communication_score', 'attraction_score',
    'allow_soul_match', 'motion_intent', 'emotion_state', 'display_palette', 'device_bindings', 'social_preferences']) {
    assert.ok(SPEC_SRC.includes(k), `北极星文档缺字段: ${k}`);
  }
  for (const p of ['/api/v1/soul/card', '/api/v1/embodied/persona', '/api/v1/embodied/perception-sync',
    '/api/v1/embodied/action-intent', '/api/v1/embodied/memory-stream']) {
    assert.ok(SPEC_SRC.includes(p), `北极星文档缺端点: ${p}`);
  }
});

test('F2 注入：抹掉门控开关 ⇒ D2 判据必红', () => {
  const broken = E35_SRC.replace(/process\.env\.SOUL_OS_OPEN_PROTOCOL === '1'/, 'true');
  assert.notEqual(broken, E35_SRC, '注入失败：未命中门控开关');
  assert.ok(!/process\.env\.SOUL_OS_OPEN_PROTOCOL === '1'/.test(broken),
    '注入后应无门控绑定 —— 否则 D2 判据失效');
});

test('F3 注入：端点加前端可控 bypass ⇒ D3 判据必红', () => {
  const broken = E35_SRC.replace(
    'if (!soulOsGate(req, res)) return;',
    'if (req.body && req.body.free_access === 1) { /* 特权直通 */ }\n  if (!soulOsGate(req, res)) return;',
  );
  assert.notEqual(broken, E35_SRC, '注入失败：未命中端点入口');
  const hit = ['free_access', 'freeAccess', 'bypass'].find((b) => broken.includes(b));
  assert.ok(hit, '注入后应能检出前端可控特权字段 —— 否则 D3 判据失效');
});

test('F4 注入：引擎出参槽位改名 ⇒ B1 判据必红', () => {
  const broken = ENGINE_SRC.replace("'emotion_state': 'neutral',", "'emotion_mode': 'neutral',");
  assert.notEqual(broken, ENGINE_SRC, '注入失败：未命中 emotion_state 槽');
  assert.ok(!broken.includes("'emotion_state': 'neutral'"),
    '注入后应无 emotion_state —— 否则 B1 判据失效');
});

test('F5 注入回归锚：`*/` 若落在块注释行内 ⇒ 提前闭合（E34 两度踩坑，E35 沿用）', () => {
  // 病根：块注释（JSDoc / 多行注释）里写 `foo*/bar` ⇒ `*/` 提前闭合注释、后续文本变裸代码。
  // 🔴 射程收窄（E34 两次收窄的结论）：只扫**块注释行**（trim 后以 `*` 或 `/*` 起手），
  //    排除正则字面量（如 `\s*/g`）与 `//` 行注释（其中的 `*/` 不闭合任何块）。
  // ⚠️ 射程已知边界：`\w` 不匹配非 ASCII ⇒ 中文字符旁的 `*/` 不在射程内。
  const blockCommentHits = (src) => {
    const out = [];
    src.split('\n').forEach((L, i) => {
      const t = L.trim();
      const isBlockCommentLine = t.startsWith('*') || t.startsWith('/*');
      if (isBlockCommentLine && /\w\*\/\w/.test(L)) out.push(`${i + 1}: ${t.slice(0, 80)}`);
    });
    return out;
  };
  const SELF_SRC = fs.readFileSync(import.meta.filename, 'utf8');
  for (const [name, src] of [['server.js', SERVER_SRC], ['audit-e35', SELF_SRC]]) {
    assert.deepEqual(blockCommentHits(src), [], `${name} 块注释行出现 \`*/\` 紧跟词字符的危险形态`);
  }
  // 注入自测：把缺陷塞回**真块注释行** ⇒ 判据必红。
  //   ⚠️ 不能用 `//` 行注释作锚 —— 其中的 `*/` 不闭合任何块（这正是 E34 结论），判据不该红。
  //   故取本闸门头注释（JSDoc 块）里的一处 ASCII 可注入点。
  const ANCHOR = ' *   ④ 出参设备中立：统一预留 motion_intent / emotion_state / display_palette + schema_version；';
  assert.ok(SELF_SRC.includes(ANCHOR), '注入锚点缺失（头注释被改写）');
  const injected = SELF_SRC.replace(ANCHOR, ANCHOR.replace('motion_intent', 'motion*/intent'));
  assert.notEqual(injected, SELF_SRC, '注入失败');
  assert.ok(blockCommentHits(injected).length > 0, '注入后应能检出 —— 否则本判据失效');
});
