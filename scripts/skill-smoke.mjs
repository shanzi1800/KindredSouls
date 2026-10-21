#!/usr/bin/env node
/**
 * skill-smoke.mjs —— 生产环境黄金链路自检（E80）
 * ═══════════════════════════════════════════════════════════════════════════
 * 主公军令（2026-10-21）④：部署完不必来回问一句查一句 —— 一键出结论。
 *
 * 检查项：
 *   ① 线上首页可达（HTTP 200 + 响应时间）
 *   ② /api/health 状态 ok 且回传 deploymentId（部署双证之一）
 *   ③ 线上 bundle 指纹：index.html 引用的 JS 可取回（HTTP 200 + 体积）
 *   ④ 六语词条抽检：中/英/法/西/泰/越 各 2 条核心文案必须出现在 bundle 内
 *   ⑤ Gemini 流式首字延迟（TTFT）：需 KS_SMOKE_TOKEN（登录态 access token）才实测；
 *      未提供 ⇒ 明确 SKIP（铁律 3：未测不报绿，也不伪红）
 *
 * 用法：
 *   node scripts/skill-smoke.mjs
 *   node scripts/skill-smoke.mjs --url https://kindredsouls.online --expect-bundle index-XXXX.js
 *   KS_SMOKE_TOKEN=ey... node scripts/skill-smoke.mjs          # 含 TTFT 实测
 *
 * 退出码：0 全绿（SKIP 不算失败）；1 有硬失败；2 崩溃。
 * ═══════════════════════════════════════════════════════════════════════════
 */
const argv = process.argv.slice(2);
const opt = (n, d = '') => { const i = argv.indexOf(n); return i > -1 ? (argv[i + 1] || d) : d; };
const BASE = opt('--url', 'https://kindredsouls.online').replace(/\/$/, '');
const EXPECT = opt('--expect-bundle', '');
const TOKEN = process.env.KS_SMOKE_TOKEN || '';

const results = [];
function rec(status, name, detail) {
  results.push({ status, name, detail });
  const icon = status === 'PASS' ? '✅' : status === 'SKIP' ? '⚪' : '❌';
  console.log(`${icon} ${name}${detail ? ' — ' + detail : ''}`);
}

async function timed(url, init) {
  const t0 = Date.now();
  const res = await fetch(url, init);
  const body = await res.text();
  return { res, body, ms: Date.now() - t0 };
}

/* 六语抽检词：各语 2 条——1 条模式弹窗（E79）＋1 条品牌/报告核心词 */
const I18N_MARKERS = {
  zh: ['姻缘密码', '财富密码'],
  en: ['Destiny Love Code', 'Wealth Code'],
  fr: ['Clé du Destin Amoureux', 'Clé de la Richesse'],
  es: ['Código del Destino Amoroso', 'Código de la Riqueza'],
  th: ['รหัสลับบุพเพสันนิวาส', 'รหัสลับความมั่งคั่ง'],
  vi: ['Mật Mã Nhân Duyên', 'Mật Mã Tài Lộc'],
};

(async () => {
  /* ① 首页 */
  let home;
  try { home = await timed(BASE + '/'); }
  catch (e) { rec('FAIL', '首页可达', `网络错误：${e.message}`); process.exit(1); }
  rec(home.res.ok ? 'PASS' : 'FAIL', '首页可达', `HTTP ${home.res.status} · ${home.ms}ms`);

  /* ② health */
  let health = null;
  try {
    const h = await timed(BASE + '/api/health');
    health = JSON.parse(h.body);
    rec(health.status === 'ok' ? 'PASS' : 'FAIL', 'health 状态', `status=${health.status} · ${h.ms}ms`);
    rec(health.deploymentId ? 'PASS' : 'FAIL', '部署 ID', String(health.deploymentId || '缺失'));
  } catch (e) { rec('FAIL', '/api/health', e.message); }

  /* ③ bundle 指纹 */
  const m = home.body.match(/assets\/index-[A-Za-z0-9_-]+\.js/);
  if (!m) { rec('FAIL', 'bundle 指纹', 'index.html 未引用 index-*.js'); }
  else {
    const bundlePath = m[0];
    rec(!EXPECT || bundlePath === EXPECT ? 'PASS' : 'FAIL', 'bundle 指纹', EXPECT && bundlePath !== EXPECT ? `期望 ${EXPECT} 实得 ${bundlePath}` : bundlePath);
    let js = null;
    try {
      const t0 = Date.now();
      const r = await fetch(`${BASE}/${bundlePath}`);
      js = await r.text();
      rec(r.ok ? 'PASS' : 'FAIL', 'bundle 可取回', `HTTP ${r.status} · ${(js.length / 1024 / 1024).toFixed(2)}MB · ${Date.now() - t0}ms`);
    } catch (e) { rec('FAIL', 'bundle 可取回', e.message); }

    /* ④ 六语抽检 */
    if (js) {
      const missing = [];
      for (const [lang, words] of Object.entries(I18N_MARKERS)) {
        for (const w of words) if (!js.includes(w)) missing.push(`${lang}:${w}`);
      }
      rec(missing.length === 0 ? 'PASS' : 'FAIL', '六语词条抽检（12 条）', missing.length ? `缺 ${missing.join(' / ')}` : 'zh/en/fr/es/th/vi 各 2 条齐');
    }
  }

  /* ⑤ TTFT（需登录态；未提供则明确 SKIP） */
  if (!TOKEN) {
    rec('SKIP', 'Gemini 流式首字延迟（TTFT）', '未提供 KS_SMOKE_TOKEN ⇒ 未测（不计为通过）。设置测试账号 access token 后复跑');
  } else {
    try {
      const t0 = Date.now();
      const r = await fetch(BASE + '/api/familiar/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: '你好' }], lang: 'zh' }),
      });
      if (!r.ok || !r.body) { rec('FAIL', 'Gemini TTFT', `HTTP ${r.status}`); }
      else {
        const reader = r.body.getReader();
        const { value } = await reader.read();
        const ttft = Date.now() - t0;
        await reader.cancel().catch(() => {});
        rec(value ? 'PASS' : 'FAIL', 'Gemini TTFT（首字）', `${ttft}ms · ${value ? '首帧到达' : '首帧为空'}`);
      }
    } catch (e) { rec('FAIL', 'Gemini TTFT', e.message); }
  }

  const fails = results.filter((r) => r.status === 'FAIL');
  const skips = results.filter((r) => r.status === 'SKIP');
  const measured = results.length - skips.length;
  console.log(`\n🧪 ${measured - fails.length}/${measured} 通过 · ${skips.length} 项未测（SKIP）${fails.length ? ` · ${fails.length} 项失败` : ''}`);
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('💥 生产自检崩溃：', e.message); process.exit(2); });
