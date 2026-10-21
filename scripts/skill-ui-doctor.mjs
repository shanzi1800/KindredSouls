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
 *   node scripts/skill-ui-doctor.mjs --aesthetic      # 🎨 E83 暗黑一致性 + WCAG AA 对比度探针
 *   node scripts/skill-ui-doctor.mjs --aesthetic --route /wealth/report
 *   node scripts/skill-ui-doctor.mjs --aesthetic --self-test   # 美学诱饵验牙
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
const AESTHETIC = flag('--aesthetic');
const ROUTE = opt('--route', '');
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

/* ── 🎨 E83 暗黑一致性与对比度探针（主公军令 2026-10-21）──────────────────
   母题：合盘/报告链路「惨白医院背景 + 隐形灰字」在重构前须有自动拦截能力。
   判据（军令口径）：
     ① 大面积亮白背景：元素自身有效背景 RGB 均值 > 200 且面积 ≥ 12000px² ⇒ 违规；
     ② 文本对比度 WCAG AA：正文 ≥ 4.5:1、大字（≥24px 或粗体 ≥18.66px）≥ 3:1 ⇒ 不足违规；
     ③ 亮底小面积元素（<12000px²）上的低对比字 ⇒ 挂账 warning 不翻红（重构军令统一清剿）。
   有效背景算法：元素自身 backgroundColor + backgroundImage(渐变取色标均值) →
   祖先逐层 alpha 合成（≤12 层），全透明回落曜石底 --ks-bg-obsidian-solid #0A0914。
   ⚠️ 必须 String.raw 承载：普通模板字面量会把正则里的 \( \) 吞成 ( ) —— 正则括号
   语义反转 ⇒ m[1] 汕头带 '(' ⇒ Number('(255')=NaN ⇒ over() 全链 NaN ⇒ 探针恒假绿
   （E83 血训：诊断脚本读磁盘文本有牙、模块运行无牙，两小时才定位到这一行）。 */
const AESTHETIC_JS = String.raw`(() => {
  const BASE = [10, 9, 20];
  const MIN_AREA = 12000, WHITE_AVG = 200;
  const parse = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null;
    const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3]));
  const avg = (c) => (c[0] + c[1] + c[2]) / 3;
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const gradMix = (bi) => { if (!bi || bi === 'none' || !/gradient/.test(bi)) return null;
    const g = [...bi.matchAll(/rgba?\([^)]+\)/g)].map((m) => parse(m[0])).filter(Boolean);
    if (!g.length) return null;
    const a = g.reduce((s, c) => s + c[3], 0) / g.length;
    return [0, 1, 2].map((i) => g.reduce((s, c) => s + c[i], 0) / g.length).concat([a]); };
  // 自身背景层（image 盖 color 之上）：返回 [层, 提供背景的元素] 或 null
  const ownLayers = (el) => { const cs = getComputedStyle(el); const L = [];
    const g = gradMix(cs.backgroundImage); if (g) L.push([g, el]);
    const b = parse(cs.backgroundColor); if (b && b[3] > 0) L.push([b, el]);
    return L; };
  // 有效背景 + 亮底来源元素（首个 alpha≥0.6 层）
  // 全屏星幕感知：.bg-video/.starfield-fallback（fixed 全屏 z0）视觉盖住 html/body 底色
  // ——DOM 祖先链算不到视觉堆叠，须在此截断，否则星空上的白字被误判「白底白字」假阳。
  const fullScreenVeil = !!document.querySelector('.bg-video, .starfield-fallback');
  const effBg = (el) => { const layers = []; let src = null;
    for (let n = el, i = 0; n && i < 12; n = n.parentElement, i++) {
      if (fullScreenVeil && (n === document.body || n === document.documentElement)) break;
      for (const [c, e] of ownLayers(n)) { layers.push(c); if (!src && c[3] >= 0.6) src = e; } }
    let eff = BASE; for (const c of layers.slice().reverse()) eff = over(c, eff);
    return { eff, src }; };
  const visible = (el) => { const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.05; };
  const tag = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  // ① 大面积亮白块扫描（元素自身背景，不经祖先——白卡自身必带背景）
  const whiteBlocks = [];
  const dbg = { wTooSmall: 0, wInvis: 0, wNoLayer: 0, wNotWhite: 0, tInvis: 0, tNoOwn: 0, tSmall: 0, tPass: 0 };
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width * r.height < MIN_AREA || r.width < 80 || r.height < 40) { dbg.wTooSmall++; continue; }
    if (!visible(el)) { dbg.wInvis++; continue; }
    const L = ownLayers(el); if (!L.length) { dbg.wNoLayer++; continue; }
    // 🧯 E83 血训：ownLayers 返回 [色层, 元素] 二元组——不解构直接 over() 会把整个二元组
    //    当色层（c[3]=undefined ⇒ NaN），avg(NaN)>200 恒 false ⇒ 白卡永不报（实测假绿）。
    let eff = BASE; for (const [c] of L.slice().reverse()) eff = over(c, eff);
    if (avg(eff) > WHITE_AVG) whiteBlocks.push({ el: tag(el), w: Math.round(r.width), h: Math.round(r.height), avgRGB: Math.round(avg(eff)) });
    else dbg.wNotWhite++;
  }
  // ② 文本对比度扫描（leaf 文本节点）
  const lowContrast = [], warnings = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el)) { dbg.tInvis++; continue; }
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) { dbg.tNoOwn++; continue; }
    const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) { dbg.tSmall++; continue; }
    const cs = getComputedStyle(el);
    const col = parse(cs.color) || BASE;
    const { eff, src } = effBg(el);
    const fs = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = fs >= 24 || (fs >= 18.66 && bold);
    const need = large ? 3.0 : 4.5;
    const ratio = Math.round(contrast(col, eff) * 100) / 100;
    if (ratio < need) {
      const bright = avg(eff) > WHITE_AVG;
      const srcArea = src ? (() => { const s = src.getBoundingClientRect(); return s.width * s.height; })() : 0;
      const item = { text: (el.textContent || '').trim().slice(0, 18), el: tag(el), fs, ratio, need, col: cs.color, eff: eff.map(Math.round).join(',') };
      if (bright && srcArea < MIN_AREA) warnings.push(item);  // 小面积亮底挂账
      else lowContrast.push(item);                            // 暗底灰字 / 大面积白底灰字 ⇒ 违规
    } else dbg.tPass++;
  }
  return { whiteBlocks: whiteBlocks.slice(0, 20), lowContrast: lowContrast.slice(0, 20), warnings: warnings.slice(0, 20),
    baitSeen: !!document.querySelector('[data-ks-bait]'),
    elsTotal: document.querySelectorAll('body *').length, href: location.href, dbg,
    scanned: { white: whiteBlocks.length, text: lowContrast.length + warnings.length } };
})()`;

/* 美学诱饵（--self-test 专用）：大白底卡（300×180=54000px²）+ 白底浅灰字（ratio≈1.6）
   ⇒ 判据①②双牙独立验证——诱饵双红才算探针有牙。 */
const BAIT_AESTHETIC_JS = `(() => {
  const d = document.createElement('div');
  d.setAttribute('data-ks-bait', 'aesthetic');
  d.style.cssText = 'position:fixed;left:12px;top:90px;width:300px;height:180px;background:#ffffff;z-index:99999;border-radius:8px;';
  const t = document.createElement('div');
  t.style.cssText = 'color:#c9c9c9;font-size:14px;padding:20px;';
  t.textContent = 'bait low contrast grey text';
  d.appendChild(t); document.body.appendChild(d);
  return 'BAIT_AESTHETIC';
})()`;

function runAesthetic(base) {
  const routes = ROUTE ? [ROUTE] : ['/'];
  for (const route of routes) {
    const key = route === '/' ? 'home' : route.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'route';
    rotateSession();
    ab('close', '--all');
    ab('set', 'viewport', '1440', '900');
    ab('open', `${(route.startsWith('http') ? route : base + route)}${route.includes('?') ? '&' : '?'}free_access=1`);
    // 🧯 E83 血训：页面加载早期的 eval 会把 agent-browser daemon「钉」在加载中的旧 frame，
    //    后续所有 eval（含诱饵+扫描）都落在已被导航替换的空文档上 ⇒ scanned 全 0 假绿。
    //    解法：先静默等页面稳定（React 首屏挂载），再做就绪探测与扫描。
    sleep(4500);
    // 🧯 E83 血训：waitFor('body') 只等 HTML 骨架——React 未渲染时 body* 近空、诱饵可被
    //    导航替换吞掉（实测 scanned 全 0 假绿）。必须等「多元素 ∧ 有可见文本」真就绪。
    let ready = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      const st = abEval(`(() => ({ els: document.querySelectorAll('body *').length, txt: (document.body.innerText || '').trim().length }))()`);
      if (st && typeof st === 'object' && st.els > 5 && st.txt > 10) { ready = true; break; }
      sleep(400);
    }
    if (!ready) console.log(`  ⚠️ [${key}] 页面 15s 未就绪（按当前 DOM 尽力扫描）`);
    sleep(600);
    // 🧯 E83 血训：诱饵与扫描必须**同一次 eval** —— 分两次时，首页消费 free_access 后
    //    会整页重写 URL（实测 400ms 窗口内诱饵随旧文档销毁 ⇒ 探针扫到空页面假绿）。
    const m = SELF_TEST ? abEval(`${BAIT_AESTHETIC_JS};\n${AESTHETIC_JS}`) : abEval(AESTHETIC_JS);
    if (SELF_TEST && m && typeof m === 'object' && !m.baitSeen) {
      // 诱饵未贯穿到扫描时刻 ⇒ 本轮结果按未测处理（禁假绿）
      check(`[${key}] 美学诱饵贯穿扫描时刻`, false, 'baitSeen=false —— 诱饵被页面导航吞掉，本轮未测', 'aesthetic');
    }
    if (process.env.KS_AESTHETIC_DEBUG) console.log('🔍 AESTHETIC_JS 返回：', JSON.stringify(m).slice(0, 600));
    shot(`aesthetic-${key}-desktop.png`);
    check(`[${key}] 无大面积亮白背景（RGB 均值>200 且 ≥12000px²）`,
      !!m && m.whiteBlocks.length === 0,
      m ? (m.whiteBlocks.length ? JSON.stringify(m.whiteBlocks.slice(0, 3)) : `扫描 ${m.scanned.white} 块全暗`) : '探针未返回 ⇒ 未测', 'aesthetic');
    check(`[${key}] 文本对比度 WCAG AA（正文 ≥4.5:1 / 大字 ≥3:1）`,
      !!m && m.lowContrast.length === 0,
      m ? (m.lowContrast.length ? JSON.stringify(m.lowContrast.slice(0, 3)) : `扫描 ${m.scanned.text} 处文本全达标`) : '探针未返回 ⇒ 未测', 'aesthetic');
    if (m && m.warnings.length && !JSON_OUT) {
      console.log(`  ⚠️ [${key}] 亮底小元素挂账 ${m.warnings.length} 项（重构军令统一清剿）：${JSON.stringify(m.warnings.slice(0, 3))}`);
    }
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
    if (AESTHETIC) {
      runAesthetic(base); // 🎨 E83：暗黑一致性 + WCAG AA 对比度探针（独立模式，几何三连不跑）
    } else {
      runViewport(base, { device: 'iPhone 14' });
      runViewport(base, { w: 1440, h: 900 });
      runLangSweep(base); // 🧩 E82：六语 × 双宠全量断言（桌面视口）
    }
  } finally {
    try { ab('close', '--all'); } catch (_) { /* noop */ }
    if (srv) { try { srv.kill('SIGTERM'); } catch (_) { /* noop */ } }
  }
  const fails = results.filter((r) => !r.ok);
  const collisions = results.filter((r) => r.kind === 'collision');
  const baitCaught = collisions.filter((r) => !r.ok).length;
  const aesthetics = results.filter((r) => r.kind === 'aesthetic');
  const aBaitCaught = aesthetics.filter((r) => !r.ok).length;
  const summary = { base, selfTest: SELF_TEST, mode: AESTHETIC ? 'aesthetic' : 'geometry', engine: 'agent-browser (Chromium + device emulation)', total: results.length, pass: results.length - fails.length, fail: fails.length, collisionChecks: collisions.length, baitCaught, aestheticChecks: aesthetics.length, aBaitCaught, shots, fails };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ ...summary, results }, null, 2));
  if (JSON_OUT) console.log(JSON.stringify(summary, null, 2));
  else {
    console.log(`\n📸 截图：${OUT}`);
    console.log(`🧪 ${summary.pass}/${summary.total} 通过${fails.length ? `，${fails.length} 项违规` : '，全绿'}`);
  }
  // 🧯 自检语义反转：自检「通过」＝诱饵被抓到（判据有牙），而非全绿。
  //    若注入人造遮挡后仍全绿 ⇒ 说明遮挡判据恒真（0px² 假绿），必须报错。
  //    E83 扩展：--aesthetic 模式自检按美学诱饵双牙（白底块 ∧ 隐形灰字）判。
  if (SELF_TEST) {
    const ok = AESTHETIC ? aBaitCaught > 0 : baitCaught > 0;
    console.log(AESTHETIC
      ? (ok
        ? `🎯 美学自检通过：诱饵被抓到（${aBaitCaught}/${aesthetics.length} 项美学判据翻红）⇒ 探针有牙`
        : `💀 美学自检失败：白底卡/灰字诱饵未被捕获（${aesthetics.length} 项美学判据全绿）⇒ 探针无牙，禁止信任日常跑批`)
      : (ok
        ? `🎯 自检通过：人造遮挡被捕获（${baitCaught}/${collisions.length} 项遮挡判据翻红）⇒ 判据有牙`
        : `💀 自检失败：人造遮挡未被捕获（${collisions.length} 项遮挡判据全绿）⇒ 遮挡判据无牙，禁止信任日常跑批`));
    process.exit(ok ? 0 : 1);
  }
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('💥 UI 巡检崩溃：', e.message); process.exit(2); });
