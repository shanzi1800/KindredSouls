// ════════════════════════════════════════════════════════════════════════════
// 🛡️ E30 第 11 道闸门：clear-cache 端点强鉴权（架构加固战）
//
// 【病根】
//   `POST /api/debug-clear-cache` 与 `GET /api/clear-cache/...` 曾在**零鉴权**下暴露：
//   任意外部者可用脚本遍历清空付费用户缓存 ⇒ 缓存命中率坍塌 / 缓存投毒 /
//   倒逼系统重调 LLM 产生高额 API 成本（DoS 面）。
//
// 【治法（server.js · E30-AUTH-GUARD 块）】
//   两处端点入口统一挂 `e30AdminGuard`：
//     · 校验 `x-admin-token` 或 `Authorization: Bearer <key>`；
//     · 与 `process.env.DEBUG_ADMIN_KEY`（回落 `ADMIN_TOKEN`）**常量时间**比对；
//     · 密钥未配置 / 未携带 / 不匹配 ⇒ 一律 401，且在**任何 DB/缓存读写之前**返回。
//   🔴 fail-closed：绝不因「服务端未配置密钥」而放行。
//
// 【本套件验什么】
//   A 行为级（逐字抽取产品守卫函数体 → 真实执行）：未携带/错误/正确 token · fail-closed · 长度守卫 · 中间件语义
//   B 接线级：两处端点均挂守卫且为第一参数 · 守卫先于 DB/缓存读写 · 常量时间/环境变量/fail-closed 三要素齐全
//   C 注入自测：摘除守卫 ⇒ B 必红；改成 fail-open ⇒ A 必红（证明判据是同源、射程内的）
//   D 真实启动：`node server.js` 起服务后双端点实测（无 token⇒401 · 错 token⇒401 · 正 token⇒非 401）
// ════════════════════════════════════════════════════════════════════════════
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

const G1 = '// ═══ E30-AUTH-GUARD-1 ═══';
const GEND = '// ═══ E30-AUTH-GUARD-END ═══';

/** 抽出守卫声明切片（不含首尾注释行）——供行为级执行与注入自测共用 */
function guardBlock(src = SERVER) {
  const a = src.indexOf(G1);
  const b = src.indexOf(GEND);
  assert.ok(a >= 0 && b > a, 'server.js 缺少 E30-AUTH-GUARD 标记块');
  return src.slice(a + G1.length, b);
}

/** 把产品守卫函数逐字装进沙箱执行（process/Buffer/timingSafeEqual/console 显式注入） */
function loadGuard(src = SERVER) {
  const body = guardBlock(src);
  const warnLog = [];
  const fn = new Function(
    'process', 'Buffer', 'timingSafeEqual', 'console',
    `${body}
     return { e30RequireAdminToken, e30AdminGuard, _e30ExtractToken, _e30SafeEqual, _e30AdminExpectedKey };`
  );
  const api = fn(process, Buffer, timingSafeEqual, { warn: (m) => warnLog.push(String(m)), log: () => {} });
  api._warnLog = warnLog;
  return api;
}

function mkRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
  };
}
function mkReq(headers = {}) { return { headers }; }

/** 无痛设置/还原环境变量 */
function withEnv(vars, fn) {
  const saved = {};
  for (const k of Object.keys(vars)) {
    saved[k] = Object.prototype.hasOwnProperty.call(process.env, k) ? process.env[k] : undefined;
    if (vars[k] === undefined) delete process.env[k];
    else process.env[k] = vars[k];
  }
  try { return fn(); }
  finally {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

const KEY = 'E30-local-token-7f3a';

describe('E30 clear-cache 端点强鉴权', () => {

  // ───────── A 行为级（真实执行抽取的函数体）─────────
  test('A1 未携带 token ⇒ 401 且不放行', () => {
    withEnv({ DEBUG_ADMIN_KEY: KEY, ADMIN_TOKEN: undefined }, () => {
      const g = loadGuard();
      const res = mkRes();
      const passed = g.e30RequireAdminToken(mkReq({}), res);
      assert.strictEqual(passed, false, '未携带 token 竟被放行');
      assert.strictEqual(res.statusCode, 401, '未携带 token 应返回 401');
      assert.strictEqual(res.body && res.body.error, 'unauthorized');
    });
  });

  test('A2 token 错误 ⇒ 401 且不放行', () => {
    withEnv({ DEBUG_ADMIN_KEY: KEY, ADMIN_TOKEN: undefined }, () => {
      const g = loadGuard();
      for (const bad of ['WRONG', 'E30-local-token-7f3b', 'e30-LOCAL-TOKEN-7F3A', '']) {
        const res = mkRes();
        const passed = g.e30RequireAdminToken(mkReq({ 'x-admin-token': bad }), res);
        assert.strictEqual(passed, false, `错误 token ${JSON.stringify(bad)} 竟被放行`);
        assert.strictEqual(res.statusCode, 401);
      }
    });
  });

  test('A3 x-admin-token 正确 ⇒ 放行（且未写 401）', () => {
    withEnv({ DEBUG_ADMIN_KEY: KEY, ADMIN_TOKEN: undefined }, () => {
      const g = loadGuard();
      const res = mkRes();
      const passed = g.e30RequireAdminToken(mkReq({ 'x-admin-token': KEY }), res);
      assert.strictEqual(passed, true, '正确 token 未放行');
      assert.strictEqual(res.statusCode, 200, '正确 token 不应写 401');
      assert.strictEqual(res.body, undefined);
    });
  });

  test('A4 Authorization: Bearer <key> 正确 ⇒ 放行（含大小写/空格容错）', () => {
    withEnv({ DEBUG_ADMIN_KEY: KEY, ADMIN_TOKEN: undefined }, () => {
      const g = loadGuard();
      for (const hv of [`Bearer ${KEY}`, `bearer ${KEY}`, `  Bearer   ${KEY}  `]) {
        const res = mkRes();
        const passed = g.e30RequireAdminToken(mkReq({ authorization: hv }), res);
        assert.strictEqual(passed, true, `Authorization 形态未放行: ${JSON.stringify(hv)}`);
      }
    });
  });

  test('A5 fail-closed：服务端未配置密钥 ⇒ 即便携带任意 token 亦 401', () => {
    withEnv({ DEBUG_ADMIN_KEY: undefined, ADMIN_TOKEN: undefined }, () => {
      const g = loadGuard();
      for (const got of ['', 'anything', KEY]) {
        const res = mkRes();
        const passed = g.e30RequireAdminToken(mkReq({ 'x-admin-token': got }), res);
        assert.strictEqual(passed, false, '未配置密钥时竟放行（fail-open 严重缺陷）');
        assert.strictEqual(res.statusCode, 401);
      }
    });
  });

  test('A6 长度不等不抛异常（timingSafeEqual 长度守卫）', () => {
    withEnv({ DEBUG_ADMIN_KEY: KEY, ADMIN_TOKEN: undefined }, () => {
      const g = loadGuard();
      assert.doesNotThrow(() => g._e30SafeEqual('short', 'a-much-longer-token-value'));
      assert.strictEqual(g._e30SafeEqual('short', 'a-much-longer-token-value'), false);
      assert.strictEqual(g._e30SafeEqual(KEY, KEY), true);
    });
  });

  test('A7 中间件语义：失败不 next()，成功才 next()', () => {
    withEnv({ DEBUG_ADMIN_KEY: KEY, ADMIN_TOKEN: undefined }, () => {
      const g = loadGuard();
      let nextCalls = 0;
      const next = () => { nextCalls++; };
      const r1 = mkRes();
      g.e30AdminGuard(mkReq({}), r1, next);
      assert.strictEqual(nextCalls, 0, '未鉴权竟放行到 next()');
      assert.strictEqual(r1.statusCode, 401);
      const r2 = mkRes();
      g.e30AdminGuard(mkReq({ 'x-admin-token': KEY }), r2, next);
      assert.strictEqual(nextCalls, 1, '鉴权通过却未 next()');
    });
  });

  // ───────── B 接线级（source-level）─────────
  test('B1 两处端点均已挂 e30AdminGuard，且为第一参数（先于 body 解析）', () => {
    assert.ok(
      SERVER.includes("app.post('/api/debug-clear-cache', e30AdminGuard, express.json(),"),
      'POST /api/debug-clear-cache 未挂守卫（或未置于首位）'
    );
    assert.ok(
      SERVER.includes("app.get('/api/clear-cache/:birthDate/:lang/:reportType', e30AdminGuard,"),
      'GET /api/clear-cache/... 未挂守卫'
    );
  });

  test('B2 守卫先于一切 DB/缓存读写（Supabase / safeFetch 之前）', () => {
    for (const prefix of [
      "app.post('/api/debug-clear-cache',",
      "app.get('/api/clear-cache/:birthDate/:lang/:reportType',",
    ]) {
      const i = SERVER.indexOf(prefix);
      assert.ok(i >= 0, `未找到路由 ${prefix}`);
      const win = SERVER.slice(i, i + 1500);
      const gAt = win.indexOf('e30AdminGuard');
      const dbAt = win.indexOf('process.env.SUPABASE_URL');
      const fetchAt = win.indexOf('safeFetch(');
      assert.ok(gAt >= 0, `${prefix} 窗口内未见守卫`);
      assert.ok(dbAt === -1 || gAt < dbAt, `${prefix} 守卫晚于 SUPABASE_URL 读取`);
      assert.ok(fetchAt === -1 || gAt < fetchAt, `${prefix} 守卫晚于 safeFetch`);
    }
  });

  test('B3 三要素齐全：常量时间比较 + 环境变量对齐 + fail-closed 分支', () => {
    const body = guardBlock();
    assert.ok(/timingSafeEqual\s*\(/.test(body), '未使用常量时间比较（timingSafeEqual）');
    assert.ok(/process\.env\.DEBUG_ADMIN_KEY/.test(body), '未对齐 DEBUG_ADMIN_KEY 环境变量');
    assert.ok(/if\s*\(\s*!expected\s*\)/.test(body), '缺少「密钥未配置」判据');
    assert.ok(/res\.status\(401\)/.test(body), '缺少 401 拒绝路径');
    // fail-closed 反证：未配置分支内必须是「拒绝」，绝不能出现「放行」
    const unsetBranch = body.slice(body.indexOf('if (!expected)'), body.indexOf('if (!expected)') + 260);
    assert.ok(/return false;/.test(unsetBranch), '未配置密钥分支未返回 false（fail-open）');
    assert.ok(!/return true;/.test(unsetBranch), '未配置密钥分支出现 return true（fail-open）');
  });

  // ───────── C 注入自测（判据必须能抓到缺陷）─────────
  test('C1 注入自测：摘除 POST 守卫 ⇒ B1 判据必红', () => {
    const broken = SERVER.replace(
      "app.post('/api/debug-clear-cache', e30AdminGuard, express.json(),",
      "app.post('/api/debug-clear-cache', express.json(),"
    );
    assert.notStrictEqual(broken, SERVER, '注入未生效（未找到 POST 守卫装配点）');
    const b1 = (src) =>
      src.includes("app.post('/api/debug-clear-cache', e30AdminGuard, express.json(),") &&
      src.includes("app.get('/api/clear-cache/:birthDate/:lang/:reportType', e30AdminGuard,");
    assert.strictEqual(b1(SERVER), true);
    assert.strictEqual(b1(broken), false, '闸门失效：摘除守卫未被 B1 识别');
  });

  test('C2 注入自测：把鉴权改成 fail-open ⇒ A2 反例必红', () => {
    const brokenSrc = guardBlock().replace(
      'if (!got || !_e30SafeEqual(got, expected))',
      'if (false)'
    );
    assert.notStrictEqual(brokenSrc, guardBlock(), '注入未生效（未找到比对判据）');
    withEnv({ DEBUG_ADMIN_KEY: KEY, ADMIN_TOKEN: undefined }, () => {
      const g = loadGuard(`/*inject*/${G1}${brokenSrc}${GEND}`);
      const res = mkRes();
      const passed = g.e30RequireAdminToken(mkReq({ 'x-admin-token': 'WRONG' }), res);
      assert.strictEqual(passed, true, '注入 fail-open 未被复现 ⇒ A2 判据无从生效');
    });
  });

  test('C3 注入自测：删掉 fail-closed 分支 ⇒ B3 判据必红', () => {
    const brokenSrc = guardBlock().replace(/if\s*\(\s*!expected\s*\)\s*\{[\s\S]*?\n  \}/, '/* removed */');
    assert.notStrictEqual(brokenSrc, guardBlock(), '注入未生效');
    assert.strictEqual(/if\s*\(\s*!expected\s*\)/.test(brokenSrc), false, '闸门失效：删除未配置分支未被 B3 识别');
  });

  // ───────── D 真实启动行为测 ─────────
  test('D1 真实启动：无 token ⇒ 401；错 token ⇒ 401；正 token ⇒ 非 401（双端点）', async () => {
    const PORT = 39877;
    const LIVE_KEY = 'E30-live-token-9c1';
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
      assert.ok(ready, `server.js 未启动。stderr 末 600 字：\n${err.slice(-600)}`);
      const base = `http://127.0.0.1:${PORT}`;
      const G = (headers) => fetch(`${base}/api/clear-cache/1900-01-01/en/monthly`, { headers });
      const P = (headers) => fetch(`${base}/api/debug-clear-cache`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ cacheKey: 'wealth:v0:E30-PROBE-DOES-NOT-EXIST' }),
      });

      // GET 端点
      assert.strictEqual((await G({})).status, 401, 'GET 无 token 应 401');
      assert.strictEqual((await G({ authorization: 'Bearer WRONG' })).status, 401, 'GET 错 token 应 401');
      assert.notStrictEqual((await G({ 'x-admin-token': LIVE_KEY })).status, 401, 'GET 正 token 应放行');

      // POST 端点
      assert.strictEqual((await P({})).status, 401, 'POST 无 token 应 401');
      assert.strictEqual((await P({ 'x-admin-token': 'WRONG' })).status, 401, 'POST 错 token 应 401');
      assert.notStrictEqual((await P({ 'x-admin-token': LIVE_KEY })).status, 401, 'POST 正 token 应放行');
      assert.notStrictEqual((await P({ authorization: `Bearer ${LIVE_KEY}` })).status, 401, 'POST Bearer 应放行');
    } finally {
      try { child.kill('SIGKILL'); } catch { /* noop */ }
    }
  });
});
