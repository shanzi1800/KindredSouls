/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🐾 E34 闸门：灵宠 B1 关系层（四象人格 · 记忆骨架 · 无时间盘降级 · 端点 fail-closed）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（2026-10-09 军师 E34 开工令 + 主公圣旨）：
 *   ① 全站**只有 2 个 IP 名**（Milo / Sophia），四象只是「同一 IP 的两种关系人格」；
 *      刻意不采集用户性别 ⇒ 由用户直接选关系（军师裁决「方案 b」）。
 *   ② 无精准出生时间 ⇒ 上升不可信 ⇒ 外观层**显式降级**，严禁伪造上升出盘（V490b / V492-D2）。
 *   ③ 落库 fail-closed：无 token / 未配 Supabase ⇒ 只算不存；**严禁任何前端可控 bypass**（防重造 E32-A 收入洞）。
 *   ④ 入参**通用解耦**（无财富线专有字段名）⇒ 合婚线字段对齐后可直接复用。
 *   ⑤ 灵魂记忆三层架构**骨架预留**（memory_summary / intimacy_level / familiar_memories + RLS）。
 *
 * 六路取证：
 *   A 契约级：relation_mode 四值**四侧同源**（Python / SQL / server.js / 前端）
 *   B 行为级：真实 CLI 跑四象 + 2-IP 铁律 + 无时间盘降级 + 防伪造 + 记忆出厂值
 *   C 契约级：SQL 记忆槽位 + familiar_memories 表 + RLS
 *   D 结构级：端点复用真值通路 + 严禁 bypass + 入参通用性 + upsert 不清空记忆
 *   E 行为级：真实启动 server.js，五档 HTTP 断言（健康 / 领养 / 降级 / 非法模式 / 非法坐标）
 *   F 注入自测：塞回 Fire 兜底 / 删四值副本 / 端点加 bypass ⇒ 对应判据必红
 *
 * 运行：node --test test/audit-e34-familiar-b1-relation.test.mjs
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
const V69_SERVER_SRC = read('astro/v69_server.py');
const SERVER_SRC = read('server.js');
const CLIENT_SRC = read('v69_client.js');
const SQL_SRC = read('db/familiar_profiles.sql');
const PICKER_SRC = read('web/src/components/FamiliarPicker.tsx');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

const MODES = ['girlfriend', 'buddy', 'bestie', 'boyfriend'];
const EXPECT_IP = { girlfriend: 'Sophia', bestie: 'Sophia', buddy: 'Milo', boyfriend: 'Milo' };

// ── 真实 CLI 调用（familiar_engine 无 swisseph 依赖 ⇒ 裸 python3 即可）──
function cli(args) {
  return execFileSync('python3', [path.join('astro', 'familiar_engine.py'), ...args], {
    cwd: ROOT, encoding: 'utf8', timeout: 30000,
  });
}
function cliJson(args) {
  return JSON.parse(cli(args));
}

// ═══════════════════════════════════════════════════════════
// A. 四值唯一真源（四侧同源契约）
// ═══════════════════════════════════════════════════════════
test('A1 relation_mode 四值：Python ↔ SQL ↔ server.js ↔ 前端 四侧完全一致', () => {
  // ① Python 真源（真实 import，非字面量 grep）
  const py = JSON.parse(execFileSync('python3', ['-c',
    'import sys,json;sys.path.insert(0,"astro");'
    + 'from familiar_engine import RELATION_MODES, RELATION_PALETTE;'
    + 'print(json.dumps({"modes":sorted(RELATION_MODES),"ips":sorted({v["pet_name"] for v in RELATION_MODES.values()}),'
    + '"skins":{k:v["skin"] for k,v in RELATION_PALETTE.items()},'
    + '"ipMap":{k:v["pet_name"] for k,v in RELATION_MODES.items()}}))',
  ], { cwd: ROOT, encoding: 'utf8' }).trim());
  assert.deepEqual(py.modes, [...MODES].sort(), 'Python RELATION_MODES 四值与约定不符');
  assert.deepEqual(py.ipMap, EXPECT_IP, 'Python 四象 → IP 映射与约定不符');

  // ② SQL CHECK 约束
  const sqlCheck = SQL_SRC.match(/CHECK\s*\(\s*relation_mode\s+IN\s*\(([^)]*)\)/i);
  assert.ok(sqlCheck, 'SQL 缺少 relation_mode CHECK 约束');
  const sqlModes = sqlCheck[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).sort();
  assert.deepEqual(sqlModes, [...MODES].sort(), 'SQL CHECK 四值与 Python 不同源');

  // ③ server.js 早拒副本
  const srvSet = SERVER_SRC.match(/const FAMILIAR_RELATION_MODES = new Set\(\[([^\]]*)\]\)/);
  assert.ok(srvSet, 'server.js 缺少 FAMILIAR_RELATION_MODES');
  const srvModes = srvSet[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean).sort();
  assert.deepEqual(srvModes, [...MODES].sort(), 'server.js 四值与 Python 不同源');

  // ④ 前端卡片
  const pickerModes = [...PICKER_SRC.matchAll(/mode:\s*'([a-z]+)'/g)].map((m) => m[1]).sort();
  assert.deepEqual(pickerModes, [...MODES].sort(), '前端 RELATION_CARDS 四值与 Python 不同源');
});

test('A2 前端卡片 skin 与 Python RELATION_PALETTE 逐值同源', () => {
  const py = JSON.parse(execFileSync('python3', ['-c',
    'import sys,json;sys.path.insert(0,"astro");'
    + 'from familiar_engine import RELATION_PALETTE;'
    + 'print(json.dumps({k:{"skin":v["skin"],"primary":v["primary"],"secondary":v["secondary"]} for k,v in RELATION_PALETTE.items()}))',
  ], { cwd: ROOT, encoding: 'utf8' }).trim());
  for (const m of MODES) {
    const re = new RegExp(`mode:\\s*'${m}'[^}]*skin:\\s*'([^']+)'`);
    const hit = PICKER_SRC.match(re);
    assert.ok(hit, `前端缺 ${m} 的 skin`);
    assert.equal(hit[1], py[m].skin, `${m} skin 与 Python 不同源`);
    assert.ok(PICKER_SRC.includes(py[m].primary), `${m} 主色 ${py[m].primary} 未出现在前端`);
  }
});

test('A3 六语 i18n 全部具备 familiar 命名空间（16 键）', () => {
  const keys = ['title', 'subtitle', 'girlfriend', 'girlfriendDesc', 'bestie', 'bestieDesc',
    'buddy', 'buddyDesc', 'boyfriend', 'boyfriendDesc', 'adopting', 'adopted', 'leadHome',
    'skip', 'degradedNote', 'error'];
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.ok(o.familiar, `${l}.json 缺 familiar 命名空间`);
    for (const k of keys) assert.ok(o.familiar[k], `${l}.json 缺 familiar.${k}`);
  }
});

// ═══════════════════════════════════════════════════════════
// B. 行为级：真实引擎（四象 / 2-IP / 降级 / 防伪造 / 记忆出厂值）
// ═══════════════════════════════════════════════════════════
test('B1 四象人格：默认名 / skin / 记忆出厂值', () => {
  for (const m of MODES) {
    const p = cliJson(['--mode', 'profile', '--sun', 'Scorpio', '--moon', 'Pisces', '--asc', 'Taurus', '--relation-mode', m]);
    assert.equal(p.name, EXPECT_IP[m], `${m} 默认名应为 ${EXPECT_IP[m]}`);
    assert.equal(p.relation_mode, m);
    assert.ok(p.relation.palette.skin.startsWith(EXPECT_IP[m].toLowerCase()), `${m} skin 前缀错`);
    assert.equal(p.relation.palette.source, 'relation', `${m} 调色板 source 应为 relation（transit 层预留）`);
    assert.deepEqual(p.memory_summary, {}, `${m} memory_summary 出厂应为空对象`);
    assert.equal(p.intimacy_level, 1, `${m} intimacy_level 出厂应为 1`);
    assert.equal(p.last_interaction_at, null, `${m} last_interaction_at 出厂应为 null`);
  }
});

test('B2 2-IP 铁律：恰好 2 个名字，且无第三/第四角色名', () => {
  const ips = new Set(MODES.map((m) => cliJson(['--sun', 'Leo', '--moon', 'Aries', '--asc', 'Gemini', '--relation-mode', m]).name));
  assert.equal(ips.size, 2, `IP 名应恰 2 个，实得 ${[...ips].join(',')}`);
  assert.ok(ips.has('Milo') && ips.has('Sophia'), 'IP 名应为 Milo / Sophia');
  // 🔴 禁词扫描**自指悖论**铁律：禁止某名 ⇒ 源码里必然出现该名（负断言要用它）。
  //    故不能扫全源，只能扫「真值块」——此处即 pet_name / persona 字段的实际取值。
  const py = JSON.parse(execFileSync('python3', ['-c',
    'import sys,json;sys.path.insert(0,"astro");'
    + 'from familiar_engine import RELATION_MODES, RELATION_PALETTE;'
    + 'print(json.dumps({"names":sorted({v["pet_name"] for v in RELATION_MODES.values()}),'
    + '"personas":sorted([v["persona_zh"] for v in RELATION_MODES.values()] + [v["persona_en"] for v in RELATION_MODES.values()]),'
    + '"skins":sorted({v["skin"] for v in RELATION_PALETTE.values()})}))',
  ], { cwd: ROOT, encoding: 'utf8' }).trim());
  assert.deepEqual(py.names, ['Milo', 'Sophia'], '真值块出现第三/第四角色名');
  const truthBlock = JSON.stringify(py);
  for (const banned of ['Eros', 'Kael', 'Chloe', 'Maya']) {
    assert.ok(!truthBlock.includes(banned), `真值块（pet_name/persona/skin）出现被作废的角色名: ${banned}`);
  }
  // 前端卡片同样只允许 2 个 IP
  const pickerIps = [...new Set([...PICKER_SRC.matchAll(/ip:\s*'([A-Za-z]+)'/g)].map((m) => m[1]))].sort();
  assert.deepEqual(pickerIps, ['Milo', 'Sophia'], '前端卡片出现第三/第四 IP');
});

test('B3 无精准出生时间 ⇒ 外观层显式降级（不伪造上升）', () => {
  const p = cliJson(['--sun', 'Scorpio', '--moon', 'Pisces', '--asc', 'Taurus', '--time-uncertain']);
  assert.equal(p.time_uncertain, true);
  assert.equal(p.body_type, 'standard', 'body_type 应降级为 standard');
  assert.equal(p.texture, 'standard', 'texture 应降级为 standard');
  assert.ok(p.degraded.includes('time_uncertain') && p.degraded.includes('body_type'), '降级项未记录');
  // 太阳可信 ⇒ 晶石色不受影响
  const pFull = cliJson(['--sun', 'Scorpio', '--moon', 'Pisces', '--asc', 'Taurus']);
  assert.equal(p.crystal_color, pFull.crystal_color, '太阳已知 ⇒ 晶石色不应降级');
});

test('B4 防伪造：未知星座不得静默兜底 Fire / Leo', () => {
  // 仅太阳未知
  const p1 = cliJson(['--sun', 'Unknown', '--moon', 'Pisces', '--asc', 'Taurus']);
  assert.equal(p1.crystal_color, '#808080', '未知太阳 ⇒ 必须中性灰');
  assert.notEqual(p1.crystal_color, '#FF5722', '不得兜底 Fire 红玛瑙');
  assert.equal(p1.totem, 'unknown', '未知太阳元素 ⇒ 图腾必须 unknown');
  assert.ok(p1.degraded.includes('crystal_color') && p1.degraded.includes('totem'));
  // 月/升未知
  const p2 = cliJson(['--sun', 'Scorpio', '--moon', 'Unknown', '--asc', 'Unknown']);
  assert.equal(p2.crystal_color, '#7E57C2', '太阳已知 ⇒ 晶石色保持真值');
  assert.equal(p2.eye_color, '#808080', '未知月亮 ⇒ 瞳色中性灰');
  assert.equal(p2.body_type, 'standard', '未知上升 ⇒ 体型 standard');
  assert.equal(p2.texture, '流纹透光', '质感由太阳元素决定 ⇒ 未知上升不应牵连');
  // 三要素全缺失 ⇒ 非零退出（绝不伪造档案）
  let code = 0, stderr = '';
  try { cli(['--sun', 'Unknown', '--moon', 'Unknown', '--asc', 'Unknown']); }
  catch (e) { code = e.status; stderr = String(e.stderr || ''); }
  assert.equal(code, 2, '三要素全缺失 ⇒ 必须退出码 2');
  assert.match(stderr, /FAMILIAR_INVALID_INPUT/, 'stderr 应含 FAMILIAR_INVALID_INPUT');
});

test('B5 引擎源码：四要素兜底已删除（Fire / Leo 静默兜底不复存在）', () => {
  assert.ok(!/SIGN_ELEMENTS\.get\(s\)\s*\|\|\s*'Fire'/.test(ENGINE_SRC), '仍存在 `|| Fire` 兜底');
  assert.ok(!/_element_of\([^)]*\)\s*or\s*'Fire'/.test(ENGINE_SRC), '仍存在 `or Fire` 兜底');
  assert.match(ENGINE_SRC, /def _element_of\(sign: str\) -> Optional\[str\]/, '_element_of 应返回 Optional');
  assert.match(ENGINE_SRC, /REFUSES|拒绝生成/, '三要素全缺失应显式拒绝');
});

// ═══════════════════════════════════════════════════════════
// C. 契约级：SQL 记忆槽位 + 表 + RLS
// ═══════════════════════════════════════════════════════════
test('C1 灵魂记忆槽位（第二/三层）与亲密度字段齐备且幂等', () => {
  assert.match(SQL_SRC, /memory_summary\s+JSONB\s+NOT NULL\s+DEFAULT\s+'\{\}'::jsonb/, '缺 memory_summary');
  assert.match(SQL_SRC, /intimacy_level\s+INTEGER\s+NOT NULL\s+DEFAULT\s+1/, '缺 intimacy_level');
  assert.match(SQL_SRC, /last_interaction_at\s+TIMESTAMPTZ/, '缺 last_interaction_at');
  // 幂等增量迁移（兼容表已先行建好的情形）
  for (const col of ['relation_mode', 'time_uncertain', 'memory_summary', 'intimacy_level', 'last_interaction_at']) {
    const re = new RegExp(`ADD COLUMN IF NOT EXISTS ${col}\\b`);
    assert.match(SQL_SRC, re, `缺 ${col} 的幂等 ALTER`);
  }
});

test('C2 familiar_memories 记忆明细表 + RLS 仅本人', () => {
  assert.match(SQL_SRC, /CREATE TABLE IF NOT EXISTS familiar_memories/, '缺 familiar_memories 表');
  assert.match(SQL_SRC, /kind\s+VARCHAR\(16\)[\s\S]{0,80}CHECK \(kind IN \('turn', 'fact', 'feedback'\)\)/, 'kind 枚举不全');
  assert.match(SQL_SRC, /ALTER TABLE familiar_memories ENABLE ROW LEVEL SECURITY/, 'familiar_memories 未启用 RLS');
  assert.match(SQL_SRC, /CREATE POLICY "users_manage_own_familiar_memories"[\s\S]{0,120}auth\.uid\(\) = user_id/, 'RLS 策略未绑 uid');
  assert.match(SQL_SRC, /CREATE POLICY "users_manage_own_familiar"[\s\S]{0,120}auth\.uid\(\) = user_id/, 'familiar_profiles RLS 策略缺失');
});

// ═══════════════════════════════════════════════════════════
// D. 结构级：端点契约
// ═══════════════════════════════════════════════════════════
const EP_START = SERVER_SRC.indexOf("app.post('/api/familiar/adopt'");
const EP_SRC = EP_START === -1 ? '' : SERVER_SRC.slice(EP_START, SERVER_SRC.indexOf('\n});', EP_START) + 4);

test('D1 端点存在且复用唯一真值通路（getAstroMatrix + extractNatalTriad）', () => {
  assert.ok(EP_START !== -1, '未注册 POST /api/familiar/adopt');
  assert.match(EP_SRC, /await getAstroMatrix\(/, '端点未复用 getAstroMatrix 真值通路');
  assert.match(EP_SRC, /extractNatalTriad\(astroMatrix\)/, '端点未复用 extractNatalTriad');
  assert.ok(!/execSync|execFileSync|spawn/.test(EP_SRC), '端点不得自起子进程推导星盘（禁另起一套）');
  assert.match(CLIENT_SRC, /export function extractNatalTriad/, 'v69_client 缺 extractNatalTriad');
  assert.match(CLIENT_SRC, /export async function getFamiliarProfile\(/, 'v69_client 缺 getFamiliarProfile');
  // 与 buildNatalAnchors 逐字同源的三个表达式
  assert.match(CLIENT_SRC, /sunSign:\s*meta\.sun_sign \|\| ch\.Sun\?\.sign/, 'sun 表达式与 buildNatalAnchors 不同源');
  assert.match(CLIENT_SRC, /ascSign:\s*meta\.rising_sign \|\| astroMatrix\?\.rising_sign/, 'asc 表达式与 buildNatalAnchors 不同源');
});

test('D2 严禁前端可控 bypass（防重造 E32-A 收入洞）', () => {
  // 请求体不得出现任何特权开关
  for (const bad of ['free_access', 'freeAccess', 'bypass', 'isAdmin', 'is_admin', 'debug', 'godmode', 'whitelist']) {
    assert.ok(!EP_SRC.includes(bad), `端点出现前端可控特权字段/开关: ${bad}`);
  }
  // 端点不得挂管理员门（匿名可用是产品设计），也不得挂绿道判定
  assert.ok(!/e30AdminGuard|e30RequireAdminToken|wealthGreenChannelAuthorized|wealthIsGreenChannel/.test(EP_SRC),
    '端点误挂绿道/管理员特权通路');
});

test('D3 fail-closed：无 Supabase / 无 token / token 无效 ⇒ persisted:false', () => {
  assert.match(EP_SRC, /!SB_URL \|\| !SB_KEY[\s\S]{0,160}persisted: false, reason: 'no_supabase_configured'/, '缺未配 Supabase 降级');
  assert.match(EP_SRC, /if \(!token\)[\s\S]{0,120}persisted: false, reason: 'no_token'/, '缺无 token 降级');
  assert.match(EP_SRC, /if \(!userId\)[\s\S]{0,120}persisted: false, reason: 'invalid_token'/, '缺 token 无效降级');
  // 🔴 fail-closed：不得存在任何「检查失败即放行落库」的路径
  assert.ok(!/catch[\s\S]{0,80}persisted: true/.test(EP_SRC), '异常分枝不得标记 persisted:true');
});

test('D4 upsert 只写本期可确定列 —— 刻意不写记忆列（防清空灵魂记忆）', () => {
  const rowBlock = EP_SRC.slice(EP_SRC.indexOf('const row = {'));
  for (const must of ['user_id', 'natal_hash', 'species', 'crystal_color', 'eye_color', 'body_type',
    'texture', 'totem', 'personality', 'relation_mode', 'time_uncertain', 'name', 'name_source']) {
    assert.ok(new RegExp(`\\b${must}\\s*:`).test(rowBlock), `upsert row 缺列 ${must}`);
  }
  for (const forbidden of ['memory_summary', 'intimacy_level', 'last_interaction_at', 'stardust', 'level']) {
    assert.ok(!new RegExp(`\\b${forbidden}\\s*:`).test(rowBlock), `upsert row 不得写 ${forbidden}（须保留既有值）`);
  }
  assert.match(EP_SRC, /Prefer: 'resolution=merge-duplicates/, '缺 merge-duplicates upsert 语义');
  assert.match(EP_SRC, /if \(!w\.ok\)[\s\S]{0,240}persisted: false/, '落库失败须如实回 reported persisted:false');
});

test('D5 入参通用解耦（无财富线专有字段名）⇒ 合婚线可复用', () => {
  // 端点只收「出生时空 + 关系模式」
  assert.match(EP_SRC, /body\.birthDate/, '缺通用入参 birthDate');
  assert.match(EP_SRC, /body\.relationMode/, '缺通用入参 relationMode');
  // 财富专有字段不得出现在端点（reportType / free_access / plan / sku / entitlement）
  for (const w of ['reportType', 'requiredPlan', 'paid_plans', 'entitlement', 'wealth_']) {
    assert.ok(!EP_SRC.includes(w), `端点绑定了财富线专有概念: ${w}`);
  }
  // 交接层同样通用：getFamiliarProfile 入参不得含业务线名
  const gpStart = CLIENT_SRC.indexOf('export async function getFamiliarProfile(');
  const gpSig = CLIENT_SRC.slice(gpStart, CLIENT_SRC.indexOf('} = {}', gpStart) + 6);
  for (const w of ['wealth', 'reportType', 'compat', 'free_access']) {
    assert.ok(!gpSig.includes(w), `getFamiliarProfile 入参绑定了业务线概念: ${w}`);
  }
});

test('D6 FastAPI 备用路由形态对齐（军师指定形态）', () => {
  assert.match(V69_SERVER_SRC, /@app\.post\("\/api\/v1\/familiar-profile"\)/, '缺 POST /api/v1/familiar-profile');
  assert.match(V69_SERVER_SRC, /from familiar_engine import calculate_familiar_profile, RELATION_MODES/, '未复用引擎（禁另起一套）');
  assert.match(V69_SERVER_SRC, /class FamiliarRequest\(BaseModel\)/, '缺 FamiliarRequest 模型');
});

// ═══════════════════════════════════════════════════════════
// E. 行为级：真实启动 server.js（离线 ⇒ persisted:false 路径）
// ═══════════════════════════════════════════════════════════
function hasSwisseph() {
  try { execFileSync('python3', ['-c', 'import swisseph'], { cwd: ROOT, stdio: 'ignore' }); return true; }
  catch { return false; }
}
const SWISSEPH_OK = hasSwisseph();

test('E 真实端点五档（health / 领养 / 降级 / 非法模式 / 非法坐标）', async (t) => {
  const PORT = 4300 + (process.pid % 500);
  const child = spawn('node', ['server.js'], {
    cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let boot = '';
  child.stdout.on('data', (d) => { boot += d; });
  child.stderr.on('data', (d) => { boot += d; });

  const base = `http://127.0.0.1:${PORT}`;
  const post = (body) => fetch(`${base}/api/familiar/adopt`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });

  try {
    // 等启动（最多 25s）
    let up = false;
    for (let i = 0; i < 50; i++) {
      try { const r = await fetch(`${base}/api/health`); if (r.ok) { up = true; break; } } catch (_) {}
      await new Promise((r) => setTimeout(r, 500));
    }
    assert.ok(up, `server.js 未在 25s 内就绪；日志尾部: ${boot.slice(-400)}`);

    // E1 health
    const h = await fetch(`${base}/api/health`);
    assert.equal(h.status, 200, 'health 应 200（探活端点永不加门）');

    // E2 正常领养
    const r2 = await post({ birthDate: '1990-06-15', birthTime: '12:00', lat: 13.75, lon: 100.5, tz: 'Asia/Bangkok', relationMode: 'buddy' });
    const j2 = await r2.json();
    if (SWISSEPH_OK) {
      assert.equal(r2.status, 200, `正常领养应 200，实得 ${r2.status} / ${JSON.stringify(j2).slice(0, 200)}`);
      assert.equal(j2.success, true);
      assert.equal(j2.persisted, false, '离线（未配 Supabase）应 persisted:false');
      assert.equal(j2.profile.name, 'Milo', 'buddy ⇒ Milo');
      assert.equal(j2.profile.relation_mode, 'buddy');
      assert.equal(j2.profile.relation.palette.skin, 'milo_buddy');
      assert.deepEqual(j2.profile.memory_summary, {}, '出厂记忆摘要应为空对象');
      assert.equal(j2.triad.timeUncertain, false, '有出生时间 ⇒ timeUncertain=false');
    } else {
      // 无 swisseph ⇒ 引擎不可用；但**绝不伪造档案**
      assert.ok(r2.status === 503 || r2.status === 200, `环境缺 swisseph 时不得返回 200 伪档案之外的异常: ${r2.status}`);
      if (r2.status === 503) {
        assert.equal(j2.code, 'ASTRO_ENGINE_UNAVAILABLE');
        assert.ok(!j2.profile, '引擎不可用时绝不能返回伪造档案');
      }
      t.diagnostic('环境无 swisseph：仅验证 fail-closed 不伪造分支');
    }

    // E3 无出生时间 ⇒ 降级
    const r3 = await post({ birthDate: '1997-10-18', lat: 13.75, lon: 100.5, tz: 'Asia/Bangkok', relationMode: 'bestie' });
    const j3 = await r3.json();
    if (SWISSEPH_OK) {
      assert.equal(r3.status, 200);
      assert.equal(j3.profile.name, 'Sophia', 'bestie ⇒ Sophia');
      assert.equal(j3.triad.timeUncertain, true, '无出生时间 ⇒ timeUncertain=true');
      assert.equal(j3.profile.body_type, 'standard', '无出生时间 ⇒ 外观层降级');
      assert.ok(j3.profile.degraded.includes('time_uncertain'));
    }

    // E4 非法 relationMode
    const r4 = await post({ birthDate: '1990-06-15', birthTime: '12:00', lat: 13.75, lon: 100.5, tz: 'Asia/Bangkok', relationMode: 'pet' });
    assert.equal(r4.status, 400, '非法关系模式应 400');
    assert.equal((await r4.json()).code, 'INVALID_RELATION_MODE');

    // E5 非法坐标（首选闸门：坐标不可被 Tier-2 救回，而非法 tz 可被坐标推定救回）
    const r5 = await post({ birthDate: '1990-06-15', birthTime: '12:00', lat: 91, lon: 100.5, tz: 'Asia/Bangkok', relationMode: 'buddy' });
    assert.equal(r5.status, 400, '越界纬度应 400');
    assert.equal((await r5.json()).code, 'INVALID_COORDINATES');

    // E6 非法生日
    const r6 = await post({ birthDate: '1990/06/15', birthTime: '12:00', lat: 13.75, lon: 100.5, tz: 'Asia/Bangkok', relationMode: 'buddy' });
    assert.equal(r6.status, 400, '非法生日格式应 400');
    assert.equal((await r6.json()).code, 'INVALID_BIRTH_DATE');
  } finally {
    child.kill('SIGKILL');
  }
});

// ═══════════════════════════════════════════════════════════
// F. 注入自测（判据射程内缺陷 ⇒ 必红）
// ═══════════════════════════════════════════════════════════
test('F1 注入：把 Fire 兜底塞回引擎 ⇒ B4/B5 判据必红', () => {
  const broken = ENGINE_SRC.replace(
    "    return SIGN_ELEMENTS.get(s)",
    "    return SIGN_ELEMENTS.get(s) or 'Fire'",
  );
  assert.notEqual(broken, ENGINE_SRC, '注入失败：未命中 _element_of 返回点');
  const hasFireFallback = /SIGN_ELEMENTS\.get\(s\)\s*or\s*'Fire'/.test(broken) || /SIGN_ELEMENTS\.get\(s\)\s*\|\|\s*'Fire'/.test(broken);
  assert.ok(hasFireFallback, '注入后应能检出 Fire 兜底 —— 否则 B5 判据失效');
  // 且真值源码必须无该形态
  assert.ok(!/SIGN_ELEMENTS\.get\(s\)\s*or\s*'Fire'/.test(ENGINE_SRC), '真源码不应含 Fire 兜底');
});

test('F2 注入：删 server.js 四值副本 ⇒ A1 判据必红', () => {
  const broken = SERVER_SRC.replace(/const FAMILIAR_RELATION_MODES = new Set\(\[[^\]]*\]\);/, '');
  assert.notEqual(broken, SERVER_SRC, '注入失败：未命中四值副本');
  const m = broken.match(/const FAMILIAR_RELATION_MODES = new Set\(\[([^\]]*)\]\)/);
  assert.equal(m, null, '删除后不应再能抽出四值副本 —— 否则 A1 判据失效');
});

test('F3 注入：端点加前端可控 bypass ⇒ D2 判据必红', () => {
  const broken = EP_SRC.replace(
    'const body = req.body || {};',
    'const body = req.body || {};\n    if (body.bypass === 1 || body.free_access === 1) { /* 特权直通 */ }',
  );
  assert.notEqual(broken, EP_SRC, '注入失败：未命中端点入口');
  const hit = ['free_access', 'bypass'].find((b) => broken.includes(b));
  assert.ok(hit, '注入后应能检出前端可控特权字段 —— 否则 D2 判据失效');
});

test('F4 注入回归锚：`*/` 若落在**块注释行**内 ⇒ 提前闭合（本战役两度踩坑）', () => {
  // 病根：块注释（`/* … */` / JSDoc）里写 `wealth*/compat*` / `test/**/*.{js,mjs}`
  //       ⇒ 其中 `*/` 提前闭合注释，后续文本变裸代码 ⇒ 语法错误。
  //       本战役在 v69_client.js 与本闸门之外的 bump 脚本各踩一次。
  // 🔴 射程收窄（两次收窄，均为消除假阳性）：
  //    ① 正则**字面量**里的 `\s*/g` 是合法代码 ⇒ 只扫注释行；
  //    ② `//` 行注释里的 `*/` **无害**（不闭合任何块）⇒ 只扫块注释行（`*` / `/*` 起手）。
  const blockCommentHits = (src) => {
    const out = [];
    src.split('\n').forEach((L, i) => {
      const t = L.trim();
      const isBlockCommentLine = t.startsWith('*') || t.startsWith('/*');
      if (isBlockCommentLine && /\w\*\/\w/.test(L)) out.push(`${i + 1}: ${t.slice(0, 80)}`);
    });
    return out;
  };
  for (const [name, src] of [['server.js', SERVER_SRC], ['v69_client.js', CLIENT_SRC],
    ['audit-e34', fs.readFileSync(import.meta.filename, 'utf8')]]) {
    assert.deepEqual(blockCommentHits(src), [], `${name} 块注释行出现 \`*/\` 紧跟词字符的危险形态`);
  }
  // 注入自测：把缺陷塞回 v69_client.js 的 JSDoc 块注释行 ⇒ 判据必红
  const ANCHOR = ' *    真值完整性标记」，**不含任何业务线专有字段名**（如 wealth / compat 前缀）⇒';
  assert.ok(CLIENT_SRC.includes(ANCHOR), '注入锚点缺失（JSDoc 行被改写）');
  const injected = CLIENT_SRC.replace(ANCHOR, ANCHOR.replace('wealth / compat 前缀', 'wealth*/compat*'));
  assert.notEqual(injected, CLIENT_SRC, '注入失败');
  assert.ok(blockCommentHits(injected).length > 0, '注入后应能检出 —— 否则本判据失效');
});
