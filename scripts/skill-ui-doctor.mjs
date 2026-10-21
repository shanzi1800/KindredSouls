#!/usr/bin/env node
/**
 * skill-ui-doctor.mjs —— UI 几何碰撞 / 视线镜像 / 入口去重 三合一巡检（E80）
 * ═══════════════════════════════════════════════════════════════════════════
 * 主公军令（2026-10-21）：把「人类主公拿眼睛看屏幕」固化成一键工具 ——
 *   ① 双视口强制快照：390×844（iPhone 14 设备模拟）＋ 1440×900（Desktop）
 *   ② 遮挡碰撞检测：灵宠气泡 vs 主标题/副标题/测算按钮，Overlap > 0 即报错
 *   ③ 视线镜像：Sophia 悬浮舱必须在左（gapLeft≈24），Milo 必须在右（gapRight≈24）
 *   ④ DOM 去重：灵宠入口全页唯一（认领卡 1、带路按钮 ≤1、禁「已就位」中条回潮）
 *
 * 引擎：agent-browser（Chromium + 设备模拟）。本机 Playwright/WebKit 被安全中心
 *   拦截临时 profile 删除（SIGTERM），故统一走已验证可用的 agent-browser；
 *   **射程声明**：移动视口＝Chromium 设备模拟（UA/touch/viewport/DPR），
 *   不是真 WebKit 内核 ⇒ 弹窗拦截类差异以 skill-mobile-check.mjs 的 UA+行为断言补足。
 *
 * 用法：
 *   node scripts/skill-ui-doctor.mjs                  # 自带静态服务（web/dist + mock API）
 *   node scripts/skill-ui-doctor.mjs --base https://kindredsouls.online
 *   node scripts/skill-ui-doctor.mjs --self-test      # 注入人造遮挡，验证检测器有牙
 *   node scripts/skill-ui-doctor.mjs --json           # 只输出 JSON 摘要
 *
 * 退出码：0 全绿；1 有违规；2 崩溃。截图落 dev-artifacts/ui-doctor/。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(REPO, 'web', 'dist');
const OUT = path.join(REPO, 'dev-artifacts', 'ui-doctor');
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d = '') => { const i = argv.indexOf(n); return i > -1 ? (argv[i + 1] || d) : d; };
const JSON_OUT = flag('--json');
const SELF_TEST = flag('--self-test');
const BASE = opt('--base', '');

const BIRTH_QS = 'birth=1976-12-03&time=12:00&lat=22.5431&lon=114.0579&tz=Asia/Shanghai';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

/* ── agent-browser 驱动（argv 直传，零 shell 引号地雷） ── */
// 🧯 每次运行唯一会话名：守护进程启动时需删旧 sock/pid，本机安全中心一律拒删
//   ⇒ 复用同名会话必「Daemon process exited」。唯一名＝永远干净的冷启动（E80 实测）。
let AB_SESSION = process.env.KS_AB_SESSION || `ksdoctor-${process.pid}-${Date.now().toString(36)}`;
const rotateSession = () => { AB_SESSION = `${process.env.KS_AB_SESSION || 'ksdoctor'}-${process.pid}-${Date.now().toString(36)}`; };
function ab(...args) {
  // 🧯 隔离会话：默认会话的 sock/pid 残留会被安全中心拒删 ⇒ 守护进程起不来；
  //    独立 --session 自带干净状态目录，是本机唯一稳定通路（E80 实测）。
  return execFileSync(path.join(AB_BIN, 'agent-browser'), ['--session', AB_SESSION, ...args], {
    encoding: 'utf8',
    env: { ...process.env, PATH: `${AB_BIN}:${process.env.PATH}` },
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
  }).trim();
}
function abEval(js) {
  const out = ab('eval', js);
  if (!out) return null;
  try { return JSON.parse(out); } catch (_) { return out; }
}
const sleep = (ms) => { try { execFileSync('sleep', [String(ms / 1000)]); } catch (_) { /* noop */ } };
// 有界轮询：agent-browser 的 wait 无超时参数，元素永不出现会死等（E80 实测 7min 挂死）
const waitFor = (sel, ms = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (abEval(`!!document.querySelector(${JSON.stringify(sel)})`) === true) return true; } catch (_) { /* retry */ }
    sleep(400);
  }
  return false;
};

/* ── 自带静态服务：**独立子进程** serve web/dist + mock /api ──
   ⚠️ 必须在子进程：本脚本用 execFileSync 同步调 CLI，会阻塞事件循环；
      同进程 http server 将永远无法响应 ⇒ 页面导航超时（E80 实测 os error 35 死锁）。 */
function startServer() {
  const child = spawn(process.execPath, ['--input-type=module', '-e', SERVER_SRC], {
    stdio: ['ignore', 'pipe', 'inherit'],
    env: { ...process.env, KS_DIST: DIST },
  });
  return new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('内置静态服务启动超时')), 15000);
    child.stdout.on('data', (d) => {
      buf += d.toString();
      const m = buf.match(/PORT=(\d+)/);
      if (m) { clearTimeout(t); resolve({ child, port: Number(m[1]) }); }
    });
    child.on('exit', (code) => { clearTimeout(t); reject(new Error(`内置静态服务退出 code=${code}`)); });
  });
}

const SERVER_SRC = `
import fs from 'node:fs';
import path from 'node:path';
const DIST = process.env.KS_DIST;
const PARAS = [
  '✦ 先天财富格局总览',
  '你的本命盘中，财帛宫落入摩羯座，宫内坐镇本命土星，此为「大器晚成、以耐心换厚利」的格局。',
  '二十八岁之后，木星进入你的迁移宫，财运开始由守转攻。',
];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/api/wealth-oracle' && req.method === 'POST') {
    req.resume(); req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      // 结构须与 E76 已验证 mock 逐字同构（reportData 解析依赖嵌套字段，扁平化会进错误态）
      res.end(JSON.stringify({ success: true, birthDate: '1976-12-03', lang: 'zh', referrer: 'standalone',
        data: { bazi: { sizhu: { dayMaster: '甲·木', dayPillar: '甲午' }, dayMasterWuxing: '木' }, zodiac: { animal: '虎', element: '火' }, iching: { hexagram: '乾为天', number: 1 }, tarot: { card: '星币九' } } }));
    });
    return;
  }
  if (url.pathname === '/api/wealth-oracle/stream' && req.method === 'POST') {
    req.resume(); req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache' });
      for (const p of PARAS) res.write('data: ' + JSON.stringify({ text: p + '\\n\\n' }) + '\\n\\n');
      res.write('data: [DONE]\\n\\n'); res.end();
    });
    return;
  }
  // 与 E76 验证服务同构：未命中业务 API 的 /api/* 一律空对象 200（页面并行探测端点不得 404）
  if (url.pathname.startsWith('/api/')) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}'); return; }
  // SPA 回退：深链（/wealth/report 等）无对应静态文件 ⇒ 交 index.html 由前端路由接管
  let rel = decodeURIComponent(url.pathname);
  let file = path.join(DIST, rel);
  if (rel === '/' || !file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0, '127.0.0.1', function () { console.log('PORT=' + this.address().port); });
`;

/* ── 浏览器内几何测量（返回纯对象；由 agent-browser eval 直接序列化） ── */
const MEASURE_JS = `(() => {
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
  const overlap = (a, b) => { if (!a || !b) return 0; const w = Math.min(a.right, b.right) - Math.max(a.left, b.left); const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return w > 0 && h > 0 ? Math.round(w * h) : 0; };
  const petCls = ['.ks-fam-milo', '.ks-fam-sophia'].find((s) => document.querySelector(s)) || null;
  const bubble = rect(document.querySelector('.ks-fam-bubble'));
  const title = rect(document.querySelector('.title'));
  const subtitle = rect(document.querySelector('.subtitle'));
  const startBtn = rect(document.querySelector('.landing-start-btn'));
  const pet = rect(petCls ? document.querySelector(petCls) : null);
  const chatLayer = document.querySelector('.ks-chat-layer');
  const sheet = rect(document.querySelector('.ks-chat-sheet'));
  const cw = document.documentElement.clientWidth;
  const ch = document.documentElement.clientHeight;
  const leadBtns = [...document.querySelectorAll('button')].filter((b) => /带路开始互动吧/.test(b.textContent || ''));
  const text = document.body.innerText || '';
  return {
    viewport: { w: cw, h: ch },
    pet: petCls,
    bubble, title, subtitle, startBtn, pet,
    // 🧯 E80 自检血训：锚点缺失时 overlap() 返回 0 ⇒「0px²」= 假绿（铁律 3：无射程的 0 即未测）。
    //    故三个锚点存在性必须单独回传，由判据端强制「锚点在 ∧ overlap===0」双条件。
    anchors: { title: !!title, subtitle: !!subtitle, startBtn: !!startBtn },
    overlaps: {
      bubbleVsTitle: overlap(bubble, title),
      bubbleVsSubtitle: overlap(bubble, subtitle),
      bubbleVsStartBtn: overlap(bubble, startBtn),
      petVsTitle: overlap(pet, title),
      petVsStartBtn: overlap(pet, startBtn)
    },
    outOfView: [['bubble', bubble], ['pet', pet], ['title', title]].filter(([, r]) => r && (r.left < -1 || r.right > cw + 1)).map(([n]) => n),
    chat: sheet ? { gapLeft: sheet.left, gapRight: Math.round(cw - sheet.right), gapBottom: Math.round(ch - sheet.bottom), w: sheet.w, h: sheet.h, mode: chatLayer ? chatLayer.getAttribute('data-familiar') : null } : null,
    counts: {
      adoptCards: document.querySelectorAll('.ks-adopt-card').length,
      leadHomeBtns: leadBtns.length,
      chatSheets: document.querySelectorAll('.ks-chat-sheet').length,
      pets: document.querySelectorAll('.ks-fam-breakout').length
    },
    texts: { midBadge: text.includes('灵宠已就位'), bottomBadge: text.includes('灵宠已认领'), paywall: !!document.querySelector('[class*="paywall" i], [data-testid*="paywall" i]') }
  };
})()`;

const results = [];
function check(name, ok, detail, kind = '') {
  results.push({ name, ok: !!ok, detail: detail === undefined ? '' : detail, kind });
  if (!JSON_OUT) console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
}

function seedFamiliar(name, mode) {
  abEval(`localStorage.setItem('ks_familiar', JSON.stringify({profile:{name:'${name}',relation_mode:'${mode}',sun:'狮子座',moon:'双子座',asc:'天蝎座'},triad:{sun:'狮子座'},persisted:true,adoptedAt:new Date().toISOString(),chartSig:'${SIG}'})); 'SEEDED'`);
}
function openFlag() { abEval(`sessionStorage.setItem('ks_open_familiar_chat','1'); 'FLAG'`); }
function tapPetHead() {
  // 气泡靠「点击灵宠头部」唤出（E54-2 轮播）；失败则回退 DOM click
  try { ab('click', '.ks-fam-breakout .ks-fam-zone-head'); }
  catch (_) { abEval(`(() => { const z=document.querySelector('.ks-fam-breakout .ks-fam-zone-head'); if(z) z.click(); return 'TAPPED'; })()`); }
  sleep(700);
}

const shots = [];
function shot(name) { try { ab('screenshot', path.join(OUT, name)); shots.push(name); } catch (_) { /* 截图失败不阻断判据 */ } }

function runViewport(base, vp) {
  const tag = vp.device ? vp.device.replace(/\s+/g, '') : `${vp.w}x${vp.h}`;
  rotateSession();
  ab('close', '--all');
  if (vp.device) ab('set', 'device', vp.device); else ab('set', 'viewport', String(vp.w), String(vp.h));

  /* ① 首页 · Sophia 认领态 */
  ab('open', base + '/?lang=zh&free_access=1'); waitFor('.landing-start-btn');
  seedFamiliar('Sophia', 'girlfriend');
  ab('reload'); waitFor('.landing-start-btn'); sleep(900);
  tapPetHead();
  if (SELF_TEST) {
    // 🧯 E80 自检血训 v1：直接 position:fixed + left/top 挪气泡 —— 气泡落在带 transform 的祖先
    //    坐标系里，整块被甩出视口（实测 112×18 出屏、与标题 overlap=0px²）⇒ 诱饵自身失效。
    //    v2 改「transform 增量 + 三次迭代校正」：transform 在本元素坐标系内生效，
    //    getBoundingClientRect 忠实反映，与祖先 transform 无关 ⇒ 落点确定可复现。
    abEval(`(() => {
      const m = document.querySelector('.ks-fam-bubble');
      const t = document.querySelector('.title');
      if (!m || !t) return 'NO_TARGET';
      let cx = 0, cy = 0;
      for (let i = 0; i < 3; i++) {
        const b = m.getBoundingClientRect();
        const r = t.getBoundingClientRect();
        if (!b.width || !b.height) return 'ZERO_RECT';
        cx += (r.left + 6) - b.left;
        cy += (r.top + 6) - b.top;
        m.style.setProperty('transform', 'translate(' + cx + 'px,' + cy + 'px)', 'important');
      }
      return 'BAIT';
    })()`);
    sleep(500);
  }
  const home = abEval(MEASURE_JS);
  shot(`home-sophia-${tag}.png`);

  check(`[${tag}] 首页灵宠在位`, !!home.pet, home.pet || '未渲染灵宠（ks_familiar 注入未生效）');
  check(`[${tag}] 气泡已唤出（碰撞检测射程成立）`, !!home.bubble, home.bubble ? `${home.bubble.w}×${home.bubble.h}` : '气泡未唤出 ⇒ 碰撞三项均为未测');
  // 🧯 三条件：锚点在 ∧ 气泡在 ∧ overlap===0。缺任一锚点即判「未测」并报红（禁 0px² 假绿）。
  check(`[${tag}] 气泡不遮主标题`, home.anchors.title && !!home.bubble && home.overlaps.bubbleVsTitle === 0,
    !home.anchors.title ? '锚点 .title 缺失 ⇒ 本项未测' : `overlap=${home.overlaps.bubbleVsTitle}px²`, 'collision');
  check(`[${tag}] 气泡不遮副标题`, home.anchors.subtitle && !!home.bubble && home.overlaps.bubbleVsSubtitle === 0,
    !home.anchors.subtitle ? '锚点 .subtitle 缺失 ⇒ 本项未测' : `overlap=${home.overlaps.bubbleVsSubtitle}px²`, 'collision');
  check(`[${tag}] 气泡不遮测算按钮`, home.anchors.startBtn && !!home.bubble && home.overlaps.bubbleVsStartBtn === 0,
    !home.anchors.startBtn ? '锚点 .landing-start-btn 缺失 ⇒ 本项未测' : `overlap=${home.overlaps.bubbleVsStartBtn}px²`, 'collision');
  check(`[${tag}] 无元素出屏`, home.outOfView.length === 0, home.outOfView.join(',') || 'ok');
  check(`[${tag}] 首页灵宠入口唯一`, home.counts.pets <= 1, `pets=${home.counts.pets}`);

  if (!vp.device) {
    openFlag(); ab('reload'); waitFor('.landing-start-btn'); sleep(1600);
    const cs = abEval(MEASURE_JS);
    check(`[${tag}] Sophia 舱在左下（gapLeft≈24）`, !!cs.chat && Math.abs(cs.chat.gapLeft - 24) <= 2, cs.chat && `gapLeft=${cs.chat.gapLeft} gapRight=${cs.chat.gapRight} ${cs.chat.w}×${cs.chat.h}`);
    check(`[${tag}] Sophia 舱 data-familiar=sophia`, !!cs.chat && cs.chat.mode === 'sophia', cs.chat && cs.chat.mode);
    shot(`chat-sophia-${tag}.png`);

    seedFamiliar('Milo', 'buddy'); openFlag(); ab('reload'); waitFor('.landing-start-btn'); sleep(1600);
    const cm = abEval(MEASURE_JS);
    check(`[${tag}] Milo 舱在右下（gapRight≈24）`, !!cm.chat && Math.abs(cm.chat.gapRight - 24) <= 2, cm.chat && `gapLeft=${cm.chat.gapLeft} gapRight=${cm.chat.gapRight}`);
    check(`[${tag}] Milo 舱 data-familiar=milo`, !!cm.chat && cm.chat.mode === 'milo', cm.chat && cm.chat.mode);
    shot(`chat-milo-${tag}.png`);
  }

  /* ② 报告页 · 认领态 */
  ab('open', `${base}/wealth/report?${BIRTH_QS}&free_access=1&lang=zh`);
  waitFor('.ks-adopt-card, .landing-start-btn'); sleep(1200);
  seedFamiliar('Sophia', 'girlfriend'); ab('reload'); waitFor('.ks-adopt-card'); sleep(1500);
  const rep = abEval(MEASURE_JS);
  shot(`report-sophia-${tag}.png`);
  if (rep.texts.paywall) {
    check(`[${tag}] 报告页（付费墙态）无重复灵宠入口`, rep.counts.leadHomeBtns <= 1, `lead=${rep.counts.leadHomeBtns} adopt=${rep.counts.adoptCards}`);
  } else {
    check(`[${tag}] 报告页认领卡唯一`, rep.counts.adoptCards === 1, `adoptCards=${rep.counts.adoptCards}`);
    check(`[${tag}] 报告页带路按钮唯一`, rep.counts.leadHomeBtns === 1, `leadHomeBtns=${rep.counts.leadHomeBtns}`);
    check(`[${tag}] 无「灵宠已就位」中条`, rep.texts.midBadge === false, `midBadge=${rep.texts.midBadge}`);
    check(`[${tag}] 底部认领卡在位`, rep.texts.bottomBadge === true, `bottomBadge=${rep.texts.bottomBadge}`);
  }

  /* ③ 报告页 · 未认领态 */
  abEval(`localStorage.removeItem('ks_familiar'); 'CLEARED'`);
  ab('reload'); waitFor('.ks-adopt-card'); sleep(1200);
  const rep0 = abEval(MEASURE_JS);
  shot(`report-unclaimed-${tag}.png`);
  if (!rep0.texts.paywall) {
    check(`[${tag}] 未认领态带路按钮为 0`, rep0.counts.leadHomeBtns === 0, `leadHomeBtns=${rep0.counts.leadHomeBtns}`);
    check(`[${tag}] 未认领态无中条`, rep0.texts.midBadge === false, `midBadge=${rep0.texts.midBadge}`);
  }
  ab('close', '--all');
}

/* ── 🧩 E82 六语巡检（主公亲令 2026-10-21）：六语 × 双宠全量断言 ──
   军令：①灵宠体型锁 98px（EN 基准，六语零缩放跳变）；②气泡 vs 标题 overlap===0
   且边缘间隙 ≥24px（E71 静态 44px 只按中文 4 字标定，真页实测 EN 947px²/fr 5580px² 重叠）。 */
function runLangSweep(base) {
  rotateSession();
  ab('close', '--all');
  ab('set', 'viewport', '1440', '900');
  const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
  const petWs = [];
  for (const lang of LANGS) {
    for (const [name, mode] of [['Sophia', 'girlfriend'], ['Milo', 'buddy']]) {
      const key = `${lang}/${mode === 'girlfriend' ? 'sophia' : 'milo'}`;
      ab('open', `${base}/?lang=${lang}&free_access=1`);
      waitFor('.landing-start-btn');
      seedFamiliar(name, mode);
      ab('reload'); waitFor('.landing-start-btn'); sleep(900);
      tapPetHead();
      const m = abEval(MEASURE_JS);
      shot(`e82-${key}.png`);
      check(`[${key}] 灵宠在位`, !!m.pet, m.pet || '未渲染（seed 未生效）', 'lang-sweep');
      if (m.pet && m.pet.w > 0) petWs.push(m.pet.w);
      // 军令①：体型锁 —— 桌面恒 98px（EN 基准），禁语言切换缩放跳变
      check(`[${key}] 灵宠体型锁 98px（EN 基准）`, !!m.pet && m.pet.w > 0 && Math.abs(m.pet.w - 98) <= 2,
        m.pet ? `petW=${m.pet.w}` : '未测（灵宠缺失）', 'lang-sweep');
      check(`[${key}] 气泡已唤出`, !!m.bubble, m.bubble ? `${m.bubble.w}×${m.bubble.h}` : '未唤出 ⇒ 碰撞未测', 'lang-sweep');
      check(`[${key}] 气泡不遮主标题`, m.anchors.title && !!m.bubble && m.overlaps.bubbleVsTitle === 0,
        !m.anchors.title ? '锚点 .title 缺失 ⇒ 未测' : `overlap=${m.overlaps.bubbleVsTitle}px²`, 'collision');
      // 军令②：与标题文字边缘间距 ≥24px（水平或垂直抬升其一成立）
      if (m.bubble && m.title) {
        const hGap = m.bubble.right <= m.title.left ? m.title.left - m.bubble.right
          : (m.bubble.left >= m.title.right ? m.bubble.left - m.title.right : -1);
        const vGap = m.bubble.bottom <= m.title.top ? m.title.top - m.bubble.bottom : -1;
        check(`[${key}] 气泡与标题边缘间距 ≥24px`, Math.max(hGap, vGap) >= 24, `hGap=${hGap} vGap=${vGap}`, 'lang-sweep');
      } else {
        check(`[${key}] 气泡与标题边缘间距 ≥24px`, false, '气泡或标题缺失 ⇒ 未测', 'lang-sweep');
      }
      check(`[${key}] 无元素出屏`, m.outOfView.length === 0, m.outOfView.join(',') || 'ok', 'lang-sweep');
    }
  }
  if (petWs.length === LANGS.length * 2) {
    const spread = Math.max(...petWs) - Math.min(...petWs);
    check('[lang-sweep] 六语体型极差 ≤2px（语言切换零缩放跳变）', spread <= 2,
      `min=${Math.min(...petWs)} max=${Math.max(...petWs)} spread=${spread}`, 'lang-sweep');
  }
  ab('close', '--all');
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let srv = null;
  let base = BASE;
  if (!base) {
    if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('web/dist 不存在，请先 npm run build');
    const s = await startServer();
    srv = s.child; base = `http://127.0.0.1:${s.port}`;
  }
  try {
    runViewport(base, { device: 'iPhone 14' });
    runViewport(base, { w: 1440, h: 900 });
    runLangSweep(base); // 🧩 E82：六语 × 双宠全量断言（桌面视口）
  } finally {
    try { ab('close', '--all'); } catch (_) { /* noop */ }
    if (srv) { try { srv.kill('SIGTERM'); } catch (_) { /* noop */ } }
  }
  const fails = results.filter((r) => !r.ok);
  const collisions = results.filter((r) => r.kind === 'collision');
  const baitCaught = collisions.filter((r) => !r.ok).length;
  const summary = { base, selfTest: SELF_TEST, engine: 'agent-browser (Chromium + device emulation)', total: results.length, pass: results.length - fails.length, fail: fails.length, collisionChecks: collisions.length, baitCaught, shots, fails };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ ...summary, results }, null, 2));
  if (JSON_OUT) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`\n📸 截图：${OUT}`);
    console.log(`🧪 ${summary.pass}/${summary.total} 通过${fails.length ? `，${fails.length} 项违规` : '，全绿'}`);
  }
  // 🧯 自检语义反转：自检「通过」＝诱饵被抓到（判据有牙），而非全绿。
  //    若注入人造遮挡后仍全绿 ⇒ 说明遮挡判据恒真（0px² 假绿），必须报错。
  if (SELF_TEST) {
    const ok = baitCaught > 0;
    console.log(ok
      ? `🎯 自检通过：人造遮挡被捕获（${baitCaught}/${collisions.length} 项遮挡判据翻红）⇒ 判据有牙`
      : `💀 自检失败：人造遮挡未被捕获（${collisions.length} 项遮挡判据全绿）⇒ 遮挡判据无牙，禁止信任日常跑批`);
    process.exit(ok ? 0 : 1);
  }
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('💥 UI 巡检崩溃：', e.message); process.exit(2); });
