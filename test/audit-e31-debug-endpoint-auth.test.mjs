// ════════════════════════════════════════════════════════════════════════════
// 🛡️ E31 第 12 道闸门：全站 debug/test 调试面 7 端点强鉴权（架构扫尾战）
//
// 【病根】
//   E30 只封锁了 clear-cache 双端点；仓内仍余 7 个**零鉴权** debug/test 端点：
//     · debug-env        —— 回吐各密钥「是否配置」+ Gemini key 前 8 位；
//                           带 ?lang= 时**实跑** buildWealthReportPrompt 抽取 system prompt 首/末 300 字（🔴 高危）
//     · debug-dump-cache —— 以 service_role 键对**任意** cacheKey 枚举缓存元数据（🔴 高危）
//     · debug-source     —— 源码片段(200字) + 文件 md5/byteLen/mtime（版本指纹）
//     · debug-thai-prompt—— TH system prompt 长度 + 首 200 字 + 标记探测
//     · debug-supabase-test —— SB_KEY 长度 / V69_HOST/PORT / env 存在性 + 真实 REST 出站
//     · test-gemini / test-groq —— 用 env key 真实出站（烧配额）
//
// 【治法（server.js）】
//   复用 E30-AUTH-GUARD 块的 `e30AdminGuard`，为 7 端点**首位**挂载（先于一切处理器/DB/出站）。
//   🔴 关键陷阱：`e30AdminGuard` 原为 `const` 箭头；而 `debug-thai-prompt`/`debug-env` 的**注册位置
//      早于**守卫块 ⇒ 模块加载期求值 `e30AdminGuard` 会触发 TDZ
//      （`ReferenceError: Cannot access 'e30AdminGuard' before initialization`）⇒ 服务启动即崩。
//      治法：改为**函数声明**（提升，已验证）。本闸门 B5 专门锁死此形态。
//   🔴 `/api/health` 必须保持开放（Railway 探活），不得被误挂。
//
// 【本套件验什么】
//   A 接线级：7 端点均挂 `e30AdminGuard` 且为第一参数
//   B 覆盖完整性：全量枚举 `/api/{debug,test}*` 路由 ⇒ 无一漏挂（防新增未加门）+ 守卫为函数声明（防 TDZ 回归）
//   C 边界：`/api/health` 保持开放（不得被误挂）
//   D 注入自测：摘除任一端点守卫 ⇒ B 判据必红（判据同源、射程内）
//   E 真实启动：无/错 token ⇒ 401（全 7）；正 token ⇒ 非 401（代表性端点）；health ⇒ 非 401
// ════════════════════════════════════════════════════════════════════════════
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

// 7 个待加固端点（均为 GET）
const ENDPOINTS = [
  '/api/debug-thai-prompt',
  '/api/debug-env',
  '/api/debug-supabase-test',
  '/api/debug-source',
  '/api/debug-dump-cache',
  '/api/test-gemini',
  '/api/test-groq',
];
// 正 token 探针仅取「零副作用」端点（不触发出站/配额），其余 4 个由「无/错 token ⇒ 401」覆盖
const CHEAP_RIGHT_TOKEN = ['/api/debug-thai-prompt', '/api/debug-env', '/api/debug-source'];

/** 全量枚举 /api/{debug,test}* 路由，返回 { path, guarded } 列表 */
function enumerateDebugTestRoutes(src = SERVER) {
  const RX = /app\.(get|post)\('(\/api\/(?:debug|test)[^']+)'([^\n]*)/g;
  const out = [];
  for (const m of src.matchAll(RX)) {
    out.push({ path: m[2], guarded: /\be30AdminGuard\b/.test(m[3]) });
  }
  return out;
}

describe('E31 全站 debug/test 调试面强鉴权', () => {

  // ───────── A 接线级 ─────────
  test('A1 7 端点均挂 e30AdminGuard，且为路由第一参数', () => {
    assert.strictEqual(ENDPOINTS.length, 7, '端点基线应为 7');
    for (const ep of ENDPOINTS) {
      assert.ok(
        SERVER.includes(`app.get('${ep}', e30AdminGuard,`),
        `${ep} 未挂 e30AdminGuard 或未置于首位`
      );
    }
  });

  // ───────── B 覆盖完整性 ─────────
  test('B1 全量枚举：/api/{debug,test}* 路由无一漏挂守卫', () => {
    const routes = enumerateDebugTestRoutes();
    assert.ok(routes.length >= 8, `debug/test 路由枚举数异常：${routes.length}（基线 8 = 7 新增 + clear-cache）`);
    const unguarded = routes.filter((r) => !r.guarded).map((r) => r.path);
    assert.deepStrictEqual(unguarded, [], `以下 debug/test 端点漏挂守卫：${unguarded.join(', ')}`);
  });

  test('B2 枚举覆盖到全部 7 个目标端点（防端点改名/错写而判据空转）', () => {
    const paths = enumerateDebugTestRoutes().map((r) => r.path);
    for (const ep of ENDPOINTS) {
      assert.ok(paths.includes(ep), `枚举未覆盖目标端点 ${ep}`);
    }
  });

  test('B3 防 TDZ 回归：e30AdminGuard 必须是函数声明（非 const 箭头）', () => {
    assert.ok(
      /function\s+e30AdminGuard\s*\(/.test(SERVER),
      'e30AdminGuard 非函数声明 ⇒ 早于守卫块注册的端点会在加载期 TDZ 崩溃'
    );
    assert.ok(
      !/const\s+e30AdminGuard\s*=/.test(SERVER),
      'e30AdminGuard 仍以 const 声明 ⇒ debug-thai-prompt/debug-env 触发 TDZ'
    );
  });

  // ───────── C 边界 ─────────
  test('C1 /api/health 保持开放（不得被误挂守卫，否则 Railway 探活失败）', () => {
    assert.ok(SERVER.includes("app.get('/api/health', async (req, res) => {"), '/api/health 路由签名变化');
    assert.ok(!SERVER.includes("app.get('/api/health', e30AdminGuard"), '/api/health 被误挂守卫');
  });

  // ───────── D 注入自测 ─────────
  test('D1 注入自测：摘除 debug-env 守卫 ⇒ B1 判据必红', () => {
    const broken = SERVER.replace(
      "app.get('/api/debug-env', e30AdminGuard, (req, res) => {",
      "app.get('/api/debug-env', (req, res) => {"
    );
    assert.notStrictEqual(broken, SERVER, '注入未生效（未定位到 debug-env 守卫装配点）');
    const unguarded = enumerateDebugTestRoutes(broken).filter((r) => !r.guarded).map((r) => r.path);
    assert.ok(unguarded.includes('/api/debug-env'), '闸门失效：摘除守卫未被 B1 判据识别');
    assert.ok(unguarded.length >= 1);
  });

  test('D2 注入自测：把函数声明改回 const ⇒ B3 判据必红', () => {
    const broken = SERVER.replace(
      'function e30AdminGuard(req, res, next) {',
      'const e30AdminGuard = (req, res, next) => {'
    );
    assert.notStrictEqual(broken, SERVER, '注入未生效');
    assert.strictEqual(!/function\s+e30AdminGuard\s*\(/.test(broken), true, '闸门失效：TDZ 回退未被 B3 识别');
  });

  // ───────── E 真实启动行为测 ─────────
  test('E1 真实启动：无/错 token ⇒ 401（全 7）；正 token ⇒ 非 401（代表性端点）；health 非 401', async () => {
    const PORT = 39878;
    const LIVE_KEY = 'E31-live-token-5d9';
    const child = spawn(process.execPath, ['server.js'], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', DEBUG_ADMIN_KEY: LIVE_KEY },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    const ready = await new Promise((res) => {
      const hard = setTimeout(() => res(false), 30000);
      const iv = setInterval(() => {
        if (out.includes('Railway server running on port')) { clearInterval(iv); clearTimeout(hard); res(true); }
      }, 150);
      child.on('exit', () => { clearInterval(iv); clearTimeout(hard); res(false); });
    });
    try {
      assert.ok(ready, `server.js 未启动（若为 TDZ 崩溃则 B3 已拦）。stderr 末 600 字：\n${err.slice(-600)}`);
      const base = `http://127.0.0.1:${PORT}`;
      const hit = (ep, headers) => fetch(`${base}${ep}`, { headers });

      // 无 token / 错 token ⇒ 一律 401（守卫先于处理器 ⇒ 无副作用）
      for (const ep of ENDPOINTS) {
        assert.strictEqual((await hit(ep, {})).status, 401, `${ep} 无 token 应 401`);
        assert.strictEqual((await hit(ep, { 'x-admin-token': 'WRONG' })).status, 401, `${ep} 错 token 应 401`);
      }

      // 正 token ⇒ 放行（仅取零副作用端点，证明守卫不误拦）
      for (const ep of CHEAP_RIGHT_TOKEN) {
        const st = (await hit(ep, { 'x-admin-token': LIVE_KEY })).status;
        assert.notStrictEqual(st, 401, `${ep} 正 token 应放行（实为 ${st}）`);
      }
      const stBearer = (await hit(CHEAP_RIGHT_TOKEN[0], { authorization: `Bearer ${LIVE_KEY}` })).status;
      assert.notStrictEqual(stBearer, 401, `Bearer 形态应放行（实为 ${stBearer}）`);

      // health 保持开放
      assert.notStrictEqual((await hit('/api/health', {})).status, 401, '/api/health 被误拦');
    } finally {
      try { child.kill('SIGKILL'); } catch { /* noop */ }
    }
  });
});
