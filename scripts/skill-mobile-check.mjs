#!/usr/bin/env node
/**
 * skill-mobile-check.mjs —— 移动端支付/登录链路巡检（E80）
 * ═══════════════════════════════════════════════════════════════════════════
 * 主公军令（2026-10-21）②：移动端不得再出现「请允许浏览器弹窗」式卡死。
 *
 * 射程声明（铁律 3）：
 *   本机 Playwright/WebKit 被安全中心拦截临时 profile 删除（SIGTERM），无法跑真 WebKit；
 *   本巡检＝**Chromium + iPhone 14 设备模拟**（UA / 触屏 / viewport / DPR），
 *   断言的是「代码层是否试图弹窗」与「移动端链路是否可达登录门」，不是 Safari 内核差异。
 *
 * 检查项：
 *   ① 首页移动端无横向溢出（scrollWidth ≤ clientWidth+1）
 *   ② 页面无未捕获 JS 错误
 *   ③ 报告页点 $4.99：window.open 调用数必须为 0（E72 铁律）
 *   ④ 点击后 5s 内必须出现登录门（E73）或发生整页跳转 —— 严禁静默无反应
 *   ⑤ 全程零 alert / confirm 弹窗
 *
 * 用法：node scripts/skill-mobile-check.mjs [--base https://kindredsouls.online] [--json]
 * 退出码：0 通过；1 违规；2 环境/网络不可达。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'mobile-check');
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d = '') => { const i = argv.indexOf(n); return i > -1 ? (argv[i + 1] || d) : d; };
const JSON_OUT = flag('--json');
const BASE = opt('--base', 'https://kindredsouls.online').replace(/\/$/, '');
const BIRTH_QS = 'birth=1976-12-03&time=12:00&lat=22.5431&lon=114.0579&tz=Asia/Shanghai';

let AB_SESSION = `ksmobile-${process.pid}-${Date.now().toString(36)}`;
function ab(...args) {
  return execFileSync(path.join(AB_BIN, 'agent-browser'), ['--session', AB_SESSION, ...args], {
    encoding: 'utf8', env: { ...process.env, PATH: `${AB_BIN}:${process.env.PATH}` },
    stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024,
  }).trim();
}
function abEval(js) { const o = ab('eval', js); if (!o) return null; try { return JSON.parse(o); } catch (_) { return o; } }
const sleep = (ms) => { try { execFileSync('sleep', [String(ms / 1000)]); } catch (_) { /* noop */ } };

const results = [];
// 三态：PASS / FAIL / SKIP（SKIP＝射程不覆盖，明确不计为通过 —— 铁律 3）
function check(name, ok, detail, opts = {}) {
  const status = opts.skip ? 'SKIP' : (ok ? 'PASS' : 'FAIL');
  results.push({ name, status, ok: !!ok, detail: detail ?? '' });
  if (!JSON_OUT) {
    const icon = status === 'PASS' ? '✅' : status === 'SKIP' ? '⚪' : '❌';
    console.log(`${icon} ${name}${detail ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
  }
}

/* 反弹窗探针：hook window.open / alert / confirm（在任何业务脚本之前注入不了，故在首帧后立即打补丁；
   若代码在更早阶段弹窗，则 ⑤ 的 alert 计数兜不住 ⇒ 另以「点击后页面无变化」兜底判失败）
   🧯 E80 血训：eval 的返回值由 CLI 统一 JSON 编码一次。若脚本内再 JSON.stringify 一层，
      parse 后得到的是**字符串**而非对象，`home.btn` 恒 undefined ⇒ 全项假红/假绿。
      故这里一律返回裸对象，交给 CLI 序列化。 */
const HOOK_JS = `(() => {
  if (window.__ksHook) return 'ALREADY';
  window.__ksHook = { open: 0, alert: 0, confirm: 0, urls: [], errors: [] };
  const o = window.open;
  window.open = function (...a) { window.__ksHook.open++; window.__ksHook.urls.push(String(a[0] || '')); return o.apply(this, a); };
  const al = window.alert;
  window.alert = function (...a) { window.__ksHook.alert++; return al.apply(this, a); };
  const cf = window.confirm;
  window.confirm = function (...a) { window.__ksHook.confirm++; return cf.apply(this, a); };
  window.addEventListener('error', (e) => { if (window.__ksHook.errors.length < 5) window.__ksHook.errors.push(String(e.message || e.type)); });
  return 'HOOKED';
})()`;

function waitForSel(sel, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (abEval(`!!document.querySelector(${JSON.stringify(sel)})`) === true) return true; } catch (_) { /* retry */ }
    sleep(400);
  }
  return false;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  try { ab('close', '--all'); } catch (_) { /* noop */ }
  try { ab('set', 'device', 'iPhone 14'); }
  catch (e) { console.error(`💥 设备模拟不可用：${e.message}\n   先确认 agent-browser 可用：agent-browser --version`); process.exit(2); }

  /* ① 首页移动端可承载 */
  ab('open', `${BASE}/?lang=zh&free_access=1`);
  if (!waitForSel('.landing-start-btn', 30000)) {
    console.error(`💥 首页未挂载（${BASE}）——网络不可达或部署异常，本次判定为「未测」而非通过`);
    process.exit(2);
  }
  abEval(HOOK_JS);
  // ⚠️ 返回裸对象（勿再 JSON.stringify，否则 parse 出字符串）
  const home = abEval(`({
    cw: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth,
    vw: innerWidth, ua: navigator.userAgent.slice(0, 60), touch: 'ontouchstart' in window,
    touchPoints: navigator.maxTouchPoints || 0,
    btn: !!document.querySelector('.landing-start-btn'), title: (document.querySelector('.title') || {}).textContent || null,
    errors: (window.__ksHook || {}).errors || []
  })`);
  if (!JSON_OUT) ab('screenshot', path.join(OUT, 'home-iphone14.png'));
  check('[移动] 首页已挂载', home && home.btn === true, `title=${home && home.title}`);
  check('[移动] 无横向溢出', !!home && home.sw <= home.cw + 1, home && `scrollWidth=${home.sw} clientWidth=${home.cw}`);
  check('[移动] iPhone UA 生效', !!home && /iPhone/.test(home.ua), home && home.ua);
  // 触屏：agent-browser 的 device 描述符不含 hasTouch（实测 maxTouchPoints=0）⇒ 触屏专有交互
  // 不在射程，如实 SKIP，绝不冒充通过（铁律 3）。
  const touchOn = !!home && (home.touch === true || home.touchPoints > 0);
  check('[移动] 触屏模拟生效', touchOn,
    touchOn ? `ontouchstart=${home.touch} maxTouchPoints=${home.touchPoints}` : `maxTouchPoints=${home && home.touchPoints} ⇒ 设备描述符未开触屏，触屏专有交互未测（非产品违规）`,
    { skip: !touchOn });
  // 射程声明：hook 在首帧后安装，早于 hook 的报错不在射程内（不做假绿宣称）
  check('[移动] 载入后零未捕获 JS 错误', !!home && (home.errors || []).length === 0, home ? `errors=${JSON.stringify(home.errors || [])}` : '未测得');

  /* ② 报告页 · 付费墙 → 点 $4.99 */
  ab('open', `${BASE}/wealth/report?${BIRTH_QS}&lang=zh`);
  waitForSel('.landing-start-btn, .ks-adopt-card, button', 20000);
  sleep(2500);
  abEval(HOOK_JS);
  const pre = abEval(`({
    url: location.href,
    onceBtn: !!([...document.querySelectorAll('button')].find(b => /4\\.99/.test(b.textContent || ''))),
    gate: !!document.querySelector('[data-testid=wealth-login-gate]'),
    paywall: !!document.querySelector('[class*="paywall" i]'),
    textLen: (document.body.innerText || '').length
  })`);
  check('[移动] 报告页可见 $4.99 入口或已解锁', !!pre && (pre.onceBtn === true || pre.gate === true || pre.paywall === true), pre && `once=${pre.onceBtn} gate=${pre.gate} paywall=${pre.paywall} len=${pre.textLen}`);
  if (!JSON_OUT) ab('screenshot', path.join(OUT, 'report-before-click.png'));

  const clicked = abEval(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => /4\\.99/.test(x.textContent || ''));
    if (!b) return 'NO_BTN';
    b.click();
    return 'CLICKED';
  })()`);
  check('[移动] 已点击 $4.99', clicked === 'CLICKED', String(clicked));

  const gateAppeared = waitForSel('[data-testid=wealth-login-gate]', 6000);
  const post = abEval(`({
    url: location.href,
    gate: !!document.querySelector('[data-testid=wealth-login-gate]'),
    hook: window.__ksHook || null
  })`);
  if (!JSON_OUT) ab('screenshot', path.join(OUT, 'report-after-click.png'));

  const hook = post.hook || { open: 0, alert: 0, confirm: 0 };
  check('[移动] 零 window.open 弹窗（E72 铁律）', hook.open === 0, `open=${hook.open} urls=${JSON.stringify(hook.urls || [])}`);
  check('[移动] 零 alert/confirm', hook.alert === 0 && hook.confirm === 0, `alert=${hook.alert} confirm=${hook.confirm}`);
  const navigated = post.url !== pre.url;
  check('[移动] 点击后不静默：登录门现身或整页跳转', gateAppeared || post.gate || navigated, `gate=${post.gate} navigated=${navigated} url=${post.url.slice(0, 80)}`);

  ab('close', '--all');
  const fails = results.filter((r) => r.status === 'FAIL');
  const skips = results.filter((r) => r.status === 'SKIP');
  const measured = results.length - skips.length;
  const summary = { base: BASE, engine: 'agent-browser / Chromium + iPhone 14 device emulation (NOT WebKit)', total: measured, pass: measured - fails.length, fail: fails.length, skip: skips.length, fails };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ ...summary, results }, null, 2));
  if (JSON_OUT) console.log(JSON.stringify(summary, null, 2));
  else console.log(`\n📸 ${OUT}\n🧪 ${summary.pass}/${summary.total} 通过${skips.length ? ` · ${skips.length} 项未测（SKIP）` : ''}${fails.length ? `，${fails.length} 项违规` : '，全绿'}`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('💥 移动巡检崩溃：', e.message); process.exit(2); });
