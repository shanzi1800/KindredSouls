// 🛠️ V421-fix2 回归门：启动烟测
// 捕捉「顶层初始化引用后置声明常量」类 TDZ/ReferenceError —— 语法检查(node --check)查不出，
// 只在真正加载时才炸（2026-09-10 已在生产实际踩到：_VI_SIGN_UNIQ 引用后置的 SUN_SIGN_VI → 全站 502）
// 🛡️ 45-D2b 追加：/auth/callback 路由投递回归门（与启动烟测同段，不新增段位）
import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const READY = 'Railway server running on port';

test('启动烟测：server.js 必须能加载并成功监听（拦顶层 TDZ/初始化异常）', async () => {
  const PORT = 39876;
  const child = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '', err = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { err += d; });

  const ok = await new Promise((res) => {
    const hard = setTimeout(() => res(false), 25000);
    const iv = setInterval(() => {
      if (out.includes(READY)) { clearInterval(iv); clearTimeout(hard); res(true); }
    }, 150);
    child.on('exit', () => { clearInterval(iv); clearTimeout(hard); res(false); });
  });

  // 🛡️ 45-D2b 回归门：/auth/callback「无扩展名路径」必须投递 auth/callback.html，
  //    严禁被 SPA 通吃回退吞成 index.html —— 否则 callback.html 里的
  //    exchangeCodeForSession 永不执行 ⇒ ks_auth_success_trigger 永不写入
  //    ⇒ 付费墙 polling 30s 超时、支付意图丢失（2026-10-12 线上实锤）。
  let cbStatus = 0, cbCache = '', cbBody = '', spaBody = '', probeErr = '';
  try {
    const cbRes = await fetch(`http://127.0.0.1:${PORT}/auth/callback`);
    cbStatus = cbRes.status;
    cbCache = String(cbRes.headers.get('cache-control') || '');
    cbBody = await cbRes.text();
    spaBody = await (await fetch(`http://127.0.0.1:${PORT}/wealth`)).text();
  } catch (e) { probeErr = String((e && e.message) || e); }

  try { child.kill('SIGKILL'); } catch { /* noop */ }
  assert.ok(ok, `server.js 启动失败（未监听）。\n--- stderr (末 1200 字) ---\n${err.slice(-1200)}\n--- stdout (末 400 字) ---\n${out.slice(-400)}`);
  assert.ok(!/ReferenceError|Cannot access '.*' before initialization/.test(err), `启动期引用错误：\n${err.slice(-600)}`);
  assert.strictEqual(probeErr, '', `/auth/callback 探测异常：${probeErr}`);
  assert.strictEqual(cbStatus, 200, `/auth/callback 未返回 200（实际 ${cbStatus}）`);
  assert.ok(/exchangeCodeForSession/.test(cbBody), '/auth/callback 被 SPA 回退吞成 index.html（应投递 auth/callback.html）');
  assert.strictEqual(cbCache, 'no-store', `/auth/callback 必须 no-store 防缓存（实际 "${cbCache}"）`);
  assert.ok(!/exchangeCodeForSession/.test(spaBody), '/wealth 不应返回回调页（SPA 回退须完好）');
});
