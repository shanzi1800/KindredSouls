// 🛠️ V421-fix2 回归门：启动烟测
// 捕捉「顶层初始化引用后置声明常量」类 TDZ/ReferenceError —— 语法检查(node --check)查不出，
// 只在真正加载时才炸（2026-09-10 已在生产实际踩到：_VI_SIGN_UNIQ 引用后置的 SUN_SIGN_VI → 全站 502）
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
  try { child.kill('SIGKILL'); } catch { /* noop */ }
  assert.ok(ok, `server.js 启动失败（未监听）。\n--- stderr (末 1200 字) ---\n${err.slice(-1200)}\n--- stdout (末 400 字) ---\n${out.slice(-400)}`);
  assert.ok(!/ReferenceError|Cannot access '.*' before initialization/.test(err), `启动期引用错误：\n${err.slice(-600)}`);
});
