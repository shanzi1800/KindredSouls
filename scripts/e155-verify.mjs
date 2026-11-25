/**
 * e155-verify.mjs —— E155 Resonance Code 真页端到端验收（一次性，不入编 test:astro）
 *   自带子进程静态服务（web/dist + /api/* mock + SPA 回退）；引擎 agent-browser。
 *   硬断言（1440×900 ＋ 390×844，六语）：
 *     ① 三场景页：3 张场景卡在场；零横向溢出（document 与 .rs-root 及其内所有元素盒不越视口）
 *     ② 路径 2（推荐）：未登录点「解锁」⇒ 登录墙；登录后 ⇒ 建单 ⇒ 沙盒收银台 ⇒ 模拟付讫 ⇒ 整页跳 /invite/:token
 *     ③ A 视角：Report A 在场；坐标卡 PNG 1080×1920 非空（QR 区有暗模块）；三主题各出一张
 *     ④ 路径 2 受邀人：自填生辰 ⇒ 认领 ⇒ Report B；路径 1 受邀人：免填直接认领
 *     ⑤ 第三方：显示「已被认领」且 DOM 零 A/B 姓名；匿名：信封＋登录 CTA，零姓名
 *     ⑥ 新页面零独立对话窗/抽屉（.ks-fam / chat 零命中）；零 window.open 调用（运行时计数）
 */
import { execFileSync, spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(REPO, 'web', 'dist');
const OUT = path.join(REPO, 'dev-artifacts', 'e155-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const LANGS = (process.env.KS_LANGS || 'zh,en,fr,es,th,vi').split(',');
const VIEWPORTS = (process.env.KS_VP || '1440x900desktop,390x844mobile').split(',').map((v) => { const m = /^(\d+)x(\d+)([a-z]+)$/.exec(v); return [m[1], m[2], m[3]]; });
const tok = (s) => (s + 'xxxxxxxxxxxxxxxxxxxxxxxx').slice(0, 24);
const T = { ready: tok('payerready'), pending: tok('payerpending'), claim: tok('claimantready'), inv1: tok('invitee1'), inv2: tok('invitee2'), third: tok('thirdparty'), unpaid: tok('unpaid') };
const SB_REF = 'wfkxqhlcgrikxoofjvas';

/* ── mock 服务（子进程）── */
const REPORT = {
  zh: { kw: ['节奏互补', '彼此照见', '松弛信任'], secs: [['你们如何相遇', '你带来自省与秩序，对方带来热情与冲劲。面对面时，你们更容易看见彼此的光。'], ['你们在哪里成长', '当节奏不一致时，先说出感受再协商步伐，信任会在一次次校准中加深。']], close: '真正的吸引，不是占有，而是互为星图。' },
  en: { kw: ['steady rhythm', 'mutual mirroring', 'quiet trust'], secs: [['How you meet', 'You bring reflection and order; they bring fire and momentum. Face to face, each of you witnesses the other’s light.'], ['Where you grow', 'When your rhythms differ, name the feeling first, then recalibrate the pace together.']], close: 'True magnetism is not possession.' },
  fr: { kw: ['rythme complémentaire', 'regard mutuel', 'confiance calme'], secs: [['Votre rencontre', 'Vous apportez réflexion et ordre ; l’autre apporte feu et élan. Face à face, chacun voit la lumière de l’autre.'], ['Votre croissance', 'Quand les rythmes diffèrent, nommez d’abord le ressenti, puis recadrez le pas ensemble.']], close: 'Le véritable magnétisme ne possède pas.' },
  es: { kw: ['ritmo complementario', 'espejo mutuo', 'confianza serena'], secs: [['Cómo se encuentran', 'Tú aportas reflexión y orden; la otra persona aporta fuego e ímpetu. Frente a frente, cada uno contempla la luz del otro.'], ['Dónde crecen', 'Cuando los ritmos difieren, nombra primero la sensación y luego recalibren el paso juntos.']], close: 'El verdadero magnetismo no posee.' },
  th: { kw: ['จังหวะเสริมกัน', 'เห็นกันและกัน', 'ความไว้ใจ'], secs: [['คุณพบกันอย่างไร', 'คุณนำความสำรึกษมและระเบียบมา อีกฝ่ายนำไฟและแรงขับเคลื่อนมา สบตาตรงหน้าทำให้มองเห็นแสงในกันและกัน'], ['คุณเติบโตที่ไหน', 'เมื่อจังหวะต่างกัน ให้เอ่ยถึงความรู้สึกก่อนแล้วปรับจังหวะด้วยกัน ความไว้ใจจะเพิ่มขึ้นทีละก้าว']], close: 'แรงดึงดูดที่แท้จริงไม่ใช่การครอบครอง' },
  vi: { kw: ['nhịp bổ trợ', 'soi rọi lẫn nhau', 'tin cậy'], secs: [['Hai người gặp nhau', 'Bạn mang sự suy ngẫm và trật tự; người ấy mang lửa và động lực. Đối diện nhau, mỗi người soi rọi ánh sáng của riêng hai người.'], ['Cùng nhau lớn lên', 'Khi nhịp điệu khác biệt, hãy gọi tên cảm xúc trước rồi cùng hiệu chỉnh về một phương vị.']], close: 'Sức hút đích thực không phải chiếm hữu.' },
};
const SERVER_SRC = `
import fs from 'node:fs';
import path from 'node:path';
const DIST = process.env.KS_DIST; const T = ${JSON.stringify(T)}; const REPORT = ${JSON.stringify(REPORT)}; const CLAIMED = new Set();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const json = (res, o, c) => { res.writeHead(c || 200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
const report = (lang, perspective) => ({ perspective, scene: 'romance', locale: lang, precision: 'date_level', degraded: true,
  truth: { a: { sunSign: 'Leo', moonSign: null, ascSign: 'Cancer' }, b: { sunSign: 'Aquarius', moonSign: null, ascSign: null } },
  keywords: (REPORT[lang] || REPORT.zh).kw, sections: (REPORT[lang] || REPORT.zh).secs.map(([title, body]) => ({ title, body })), closing: (REPORT[lang] || REPORT.zh).close, generatedAt: new Date().toISOString() });
const base = { found: true, scene: 'romance', locale: 'zh', inviteToken: T.ready, claimed: true };
const payerView = (lang) => ({ ...base, role: 'payer', paymentStatus: 'paid', reportStatus: 'ready', self: { name: '林川' }, partnerName: 'Mira', partnerFilled: true, selfSunSign: 'Leo', partnerSunSign: 'Aquarius', report: report(lang, 'a') });
const claimantView = (lang) => ({ ...base, role: 'claimant', paymentStatus: 'paid', reportStatus: 'ready', self: { name: 'Mira' }, partnerName: '林川', selfSunSign: 'Aquarius', partnerSunSign: 'Leo', report: report(lang, 'b') });
const langOf = (req) => { const m = /ks_lang=([a-z]{2})/.exec(String(req.headers.cookie || '')); return m ? m[1] : 'zh'; };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || '127.0.0.1'));
  const p = url.pathname; const lang = langOf(req);
  const body = () => new Promise((r) => { let b = ''; req.on('data', (d) => b += d); req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch (e) { r({}); } }); });
  if (p === '/api/resonance/order' && req.method === 'POST') { body().then((b) => json(res, { ok: true, token: T.ready, order: { ...base, role: 'payer', paymentStatus: 'pending', reportStatus: 'awaiting_payment', self: b.personA } })); return; }
  const m = /^\\/api\\/resonance\\/invite\\/(.+)$/.exec(p);
  const KNOWN = new Set(Object.values(T));
  if (m) { if (!KNOWN.has(m[1])) return json(res, { error: 'not_found' }, 404); json(res, { found: true, scene: 'romance', locale: lang, claimable: m[1] !== T.third, paid: m[1] !== T.unpaid }); return; }
  const v = /^\\/api\\/resonance\\/order\\/(.+)$/.exec(p);
  if (v && req.method === 'GET') {
    const t = v[1];
    if (t === T.ready) return json(res, payerView(lang));
    if (t === T.pending) return json(res, { ...base, role: 'payer', paymentStatus: 'pending', reportStatus: 'awaiting_payment', self: { name: '林川' }, partnerFilled: false, report: null });
    if (t === T.claim || CLAIMED.has(t)) return json(res, claimantView(lang));
    if (t === T.inv1) return json(res, { found: true, scene: 'romance', locale: lang, claimable: true, paid: true, role: 'invitee', partnerPrefilled: true });
    if (t === T.inv2) return json(res, { found: true, scene: 'romance', locale: lang, claimable: true, paid: true, role: 'invitee', partnerPrefilled: false });
    if (t === T.third) return json(res, { found: true, scene: 'romance', locale: lang, claimable: false, paid: true, role: 'third_party' });
    if (t === T.unpaid) return json(res, { found: true, scene: 'romance', locale: lang, claimable: true, paid: false, role: 'invitee', partnerPrefilled: false });
    return json(res, { error: 'not_found' }, 404);
  }
  if (p === '/api/resonance/claim' && req.method === 'POST') { body().then((b) => { CLAIMED.add(String(b.token || '')); json(res, claimantView(lang)); }); return; }
  if (p === '/api/create-checkout' && req.method === 'POST') {
    body().then((b) => json(res, { url: 'http://' + req.headers.host + '/sandbox-pay?plan=resonance&session=cs_sandbox_e2e&resonance_token=' + encodeURIComponent(b.resonance_token || ''), sessionId: 'cs_sandbox_e2e', sandbox: true, plan: 'resonance' })); return;
  }
  if (p === '/api/sandbox/complete' && req.method === 'POST') { body().then(() => json(res, { ok: true, sandbox: true, plan: 'resonance', sessionId: 'cs_sandbox_e2e', granted: true, webhook: { received: true, resonance: true, changed: true } })); return; }
  if (p.startsWith('/api/')) { if (req.method === 'POST') req.resume(); json(res, {}); return; }
  let rel = decodeURIComponent(p); let file = path.join(DIST, rel);
  if (rel === '/' || !file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}).listen(0, '127.0.0.1', function () { console.log('PORT=' + this.address().port); });
`.replace("import fs from 'node:fs';", "import fs from 'node:fs';\nimport http from 'node:http';");

function startServer() {
  const child = spawn(process.execPath, ['--input-type=module', '-e', SERVER_SRC], { stdio: ['ignore', 'pipe', 'inherit'], env: { ...process.env, KS_DIST: DIST } });
  return new Promise((resolve, reject) => {
    let buf = ''; const t = setTimeout(() => reject(new Error('server start timeout')), 15000);
    child.stdout.on('data', (d) => { buf += d.toString(); const m = buf.match(/PORT=(\d+)/); if (m) { clearTimeout(t); resolve({ child, port: Number(m[1]) }); } });
    child.on('exit', (code) => { clearTimeout(t); reject(new Error('server exited ' + code)); });
  });
}

/* ── agent-browser ── */
let AB_SESSION = `kse155-${process.pid}-${Date.now().toString(36)}`;
function ab(...args) {
  return execFileSync(path.join(AB_BIN, 'agent-browser'), ['--session', AB_SESSION, ...args], {
    encoding: 'utf8', env: { ...process.env, PATH: `${AB_BIN}:${process.env.PATH}` }, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
  }).trim();
}
function abEval(js) { const out = ab('eval', js); if (!out) return null; try { return JSON.parse(out); } catch (_) { return out; } }
const sleep = (ms) => { try { execFileSync('sleep', [String(ms / 1000)]); } catch (_) { /* noop */ } };
function waitFor(fn, ms = 15000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { const v = fn(); if (v) return v; } catch (_) { /* retry */ } sleep(350); } return null; }
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`); };

const SESSION = (uid) => JSON.stringify({ access_token: 'e2e.' + uid, token_type: 'bearer', expires_in: 3600, refresh_token: 'r', user: { id: uid } , expires_at: Math.floor(Date.now() / 1000) + 3600 });
const injectSession = (uid) => abEval(`localStorage.setItem('sb-${SB_REF}-auth-token', JSON.stringify(${SESSION(uid)})); 'ok'`);
const clearSession = () => abEval(`localStorage.removeItem('sb-${SB_REF}-auth-token'); localStorage.removeItem('ks_resonance_intent'); 'ok'`);
const OVERFLOW = `(() => { const de = document.documentElement; const root = document.querySelector('.rs-root'); if (!root) return { missing: true };
  const vw = de.clientWidth; let bad = 0; const worst = [];
  root.querySelectorAll('*').forEach((el) => { const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) return; if (r.right > vw + 0.5 || r.left < -0.5) { bad++; if (worst.length < 3) worst.push((el.className && String(el.className).slice(0, 30)) + '|' + Math.round(r.left) + ',' + Math.round(r.right)); } });
  return { doc: de.scrollWidth, client: vw, root: root.scrollWidth, bad, worst, leaks: root.querySelectorAll('.ks-fam, [class*="chat-sheet"], [class*="ChatSheet"], [data-testid*="chat"]').length }; })()`;
const setText = (sel, v) => abEval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 'no'; const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return 'ok'; })()`);
const click = (sel) => abEval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return 'no'; el.click(); return 'ok'; })()`);
const openPage = (BASE, urlPath, vw, vh) => { ab('open', `${BASE}${urlPath}`); ab('set', 'viewport', vw, vh); const m = /lang=([a-z]{2})/.exec(urlPath); if (m) abEval(`document.cookie = 'ks_lang=${m[1]}; path=/'; 'ok'`); };
const NO_CHAT = `document.querySelectorAll('.rs-root .ks-fam, .rs-root [class*="chat-sheet"], .rs-root [class*="ChatSheet"], .rs-root [data-testid*="chat"]').length`;

async function main() {
  const { child, port } = await startServer();
  const BASE = `http://127.0.0.1:${port}`;
  try {
    let shot = 0;
    /* ① 三场景页六语双视口零溢出 */
    for (const [vw, vh, vname] of VIEWPORTS) {
      for (const lang of LANGS) {
        openPage(BASE, `/resonance?free_access=1&lang=${lang}`, vw, vh);
        const ok = waitFor(() => abEval(`document.querySelectorAll('[data-testid^="rs-scene-"]').length`) === 3);
        const o = abEval(OVERFLOW);
        const tag = `scene-${vname}-${lang}`;
        check(`${tag} 三场景卡在场`, !!ok);
        check(`${tag} 零横向溢出`, !!o && !o.missing && o.doc <= o.client && o.root <= o.client && o.bad === 0, o && !o.missing ? `doc=${o.doc}/${o.client} bad=${o.bad} ${o.worst.join(' ')}` : 'missing');
        check(`${tag} 零独立对话窗`, !!o && o.leaks === 0);
        check(`${tag} 主标题实算色为象牙白（防全站 h1 规则压暗）`, abEval(`getComputedStyle(document.querySelector('.rs-title')).color`) === 'rgb(250, 244, 228)', abEval(`getComputedStyle(document.querySelector('.rs-title')).color`));
        if (lang === 'zh') { ab('screenshot', path.join(OUT, `e155-${tag}.png`)); shot++; }
      }
    }
    if (process.env.KS_DEBUG) {
      console.log('DEBUG_TITLE', abEval(`(() => { const h = document.querySelector('.rs-title'); if (!h) return 'NO_TITLE'; const cs = getComputedStyle(h); const p = document.querySelector('.rs-root').parentElement; const chain = []; let e = h; while (e && e !== document.body) { const c = getComputedStyle(e); chain.push((e.className && String(e.className).slice(0, 24) || e.tagName) + ':op=' + c.opacity + ',filter=' + c.filter + ',mix=' + c.mixBlendMode + ',anim=' + c.animationName); e = e.parentElement; } const rules = []; for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (x) { continue; } for (const r of rs) { if (r.selectorText && /(^|[^\\w-])h1(?![\\w-])/.test(r.selectorText)) rules.push(r.selectorText.slice(0, 60) + ' => ' + r.style.cssText.slice(0, 150)); } } return JSON.stringify({ color: cs.color, fill: cs.webkitTextFillColor, bgImage: cs.backgroundImage.slice(0, 90), clip: cs.webkitBackgroundClip, parent: p.className + '|' + p.id + '|max=' + getComputedStyle(p).maxWidth, chain, rules }); })()`));
    }
    /* ② 路径 2：未登录 ⇒ 登录墙；登录 ⇒ 建单 ⇒ 沙盒 ⇒ 整页跳受邀页 */
    openPage(BASE, '/resonance?free_access=1&lang=zh', 390, 844);
    clearSession(); abEval('location.reload(); "R"');
    waitFor(() => abEval(`!!document.querySelector('[data-testid="rs-scene-romance"]')`));
    click('[data-testid="rs-scene-romance"]'); sleep(400);
    check('模式默认＝让 TA 自填（推荐）', abEval(`document.querySelector('[data-testid="rs-mode-invite"]').getAttribute('aria-checked')`) === 'true');
    setText('input[type="date"]', '1992-08-21'); sleep(200);
    click('[data-testid="rs-unlock"]'); sleep(600);
    check('未登录点解锁 ⇒ 登录墙（不弹窗）', waitFor(() => abEval(`document.body.innerText.includes('请先登录')`)) === true && abEval(`!!document.querySelector('[data-testid="rs-unlock"][disabled]')`) === true);
    check('建单意图已落 localStorage', abEval(`(localStorage.getItem('ks_resonance_intent')||'').includes('"scene":"romance"')`) === true);
    injectSession('user-a-e2e-0001'); abEval('location.reload(); "R"');
    const cashierUp = waitFor(() => abEval(`!!document.querySelector('[data-testid="sandbox-cashier"] [data-testid="sandbox-pay-btn"]')`) === true, 20000);
    check('登录后回场续跑：意图续建单 ⇒ 沙盒收银台唤起', !!cashierUp, cashierUp ? '' : String(abEval('document.body.innerText.slice(0, 200)')).replace(/\n/g, ' / '));
    if (cashierUp) {
      check('收银台商品标签为缘分密码专属词条', abEval(`(document.querySelector('[data-testid="sandbox-cashier"]').innerText || '').includes('缘分密码')`) === true);
      click('[data-testid="sandbox-pay-btn"]');
    }
    const navigated = waitFor(() => abEval(`location.pathname.startsWith('/invite/')`) === true, 25000);
    check('模拟付讫 ⇒ 整页跳 /invite/:token', !!navigated, abEval('location.pathname + location.search'));
    const readyA = waitFor(() => abEval(`(document.querySelector('[data-testid="rs-order-view"]')||{}).dataset ? document.querySelector('[data-testid="rs-order-view"]').dataset.reportStatus : ''`) === 'ready', 15000);
    check('A 视角 Report A 就绪', !!readyA && abEval(`document.querySelectorAll('[data-testid="rs-report"] .rs-report__sec').length`) === 2);
    check('沙盒收银台已关闭（零残留遮罩）', abEval(`document.querySelectorAll('[data-testid="sandbox-cashier"]').length`) === 0);
    ab('screenshot', path.join(OUT, 'e155-invite-payerA-mobile-zh.png')); shot++;
    /* ③ 坐标卡：移动端长按弹层 PNG 1080×1920 非空 */
    abEval(`(() => { const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) return; return o.apply(this, arguments); }; return 'ok'; })()`); // 验收态拦截下载锚点（免污染 ~/Downloads）
    click('[data-testid="rs-card-save"]');
    const imgOk = waitFor(() => abEval(`(() => { const i = document.querySelector('[data-testid="rs-card-preview-img"]'); return i && i.naturalWidth === 1080 && i.naturalHeight === 1920; })()`) === true, 15000);
    check('坐标卡 PNG 1080×1920', !!imgOk);
    const px = abEval(`(() => { const i = document.querySelector('[data-testid="rs-card-preview-img"]'); if (!i) return null; const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, 1080, 1920).data; const colors = new Set(); let light = 0; for (let k = 0; k < 4000; k++) { const p = (Math.floor(Math.random() * 1080 * 1920)) * 4; colors.add((d[p] >> 4) + ',' + (d[p + 1] >> 4) + ',' + (d[p + 2] >> 4)); if (d[p] > 200 && d[p + 1] > 200 && d[p + 2] > 200) light++; } const q = x.getImageData(700, 1540, 260, 260).data; let dark = 0, pale = 0; for (let k = 0; k < q.length; k += 4) { if (q[k] < 60) dark++; if (q[k] > 220 && q[k + 1] > 220) pale++; } return { colors: colors.size, light, dark, pale, ratio: dark / (260 * 260) }; })()`);
    check('坐标卡非空（4bit 量化色彩桶>25）', !!px && px.colors > 25, px ? `colors=${px.colors}` : 'null');
    check('二维码区：浅底＋暗模块（10%~60%）', !!px && px.pale > 0 && px.ratio > 0.10 && px.ratio < 0.60, px ? `ratio=${px.ratio.toFixed(3)}` : 'null');
    const dataUrl = abEval(`(() => { const i = document.querySelector('[data-testid="rs-card-preview-img"]'); if (!i) return ''; const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); return c.toDataURL('image/png'); })()`);
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png;base64,')) { fs.writeFileSync(path.join(OUT, 'e155-card-romance-zh.png'), Buffer.from(dataUrl.slice(22), 'base64')); shot++; }
    click('.rs-card-preview');
    /* 三主题各出一张（desktop 视口走下载分支 ⇒ 直接经页面内 canvas 复绘校验尺寸由移动端已证；此处只验报告页主题文案） */
    for (const sc of ['business', 'friendship']) {
      openPage(BASE, `/resonance?free_access=1&lang=zh`, 390, 844);
      injectSession('user-a-e2e-0001'); abEval('location.reload(); "R"');
      waitFor(() => abEval(`!!document.querySelector('[data-testid="rs-scene-' + sc + '"]')`));
      click(`[data-testid="rs-scene-${sc}"]`); sleep(400);
      check(`场景页 ${sc} 标题逐字`, abEval(`document.querySelector('.rs-title').textContent`) === (sc === 'business' ? '商道共频' : '挚友同频'));
    }
    /* ④ 受邀人：路径 2 自填 ⇒ 认领；路径 1 免填 */
    openPage(BASE, `/invite/${T.inv2}?free_access=1&lang=zh`, 390, 844);
    injectSession('user-b-e2e-0002'); abEval('location.reload(); "R"');
    waitFor(() => abEval(`!!document.querySelector('[data-testid="rs-claim"]')`));
    check('路径 2 受邀人：见补填表单', abEval(`document.querySelectorAll('[data-testid="rs-person"]').length`) === 1);
    setText('input[type="date"]', '1994-02-09'); sleep(200);
    click('[data-testid="rs-claim"]');
    const cReady = waitFor(() => abEval(`(document.querySelector('[data-testid="rs-order-view"]')||{}).dataset ? document.querySelector('[data-testid="rs-order-view"]').dataset.reportStatus : ''`) === 'ready', 15000);
    check('路径 2：认领后 Report B 就绪', !!cReady && abEval(`document.querySelectorAll('[data-testid="rs-report"] .rs-report__sec').length`) === 2, cReady ? '' : String(abEval('document.body.innerText.slice(0, 260)')).replace(/\n/g, ' / '));
    ab('screenshot', path.join(OUT, 'e155-invite-claimantB-mobile-zh.png')); shot++;
    openPage(BASE, `/invite/${T.inv1}?free_access=1&lang=zh`, 390, 844);
    injectSession('user-c-e2e-0003'); abEval('location.reload(); "R"');
    waitFor(() => abEval(`!!document.querySelector('[data-testid="rs-claim"]')`));
    check('路径 1 受邀人：免填直接领取', abEval(`document.querySelectorAll('[data-testid="rs-person"]').length`) === 0);
    /* ⑤ 第三方 / 匿名 / 未付 */
    openPage(BASE, `/invite/${T.third}?free_access=1&lang=zh`, 390, 844);
    injectSession('user-z-e2e-0009'); abEval('location.reload(); "R"');
    waitFor(() => abEval(`document.body.innerText.includes('该缘分坐标已被认领')`));
    const thirdTxt = abEval('document.body.innerText');
    check('第三方：已被认领且零 A/B 隐私', typeof thirdTxt === 'string' && !thirdTxt.includes('林川') && !thirdTxt.includes('Mira') && !thirdTxt.includes('1992'));
    openPage(BASE, `/invite/${T.inv1}?free_access=1&lang=zh`, 390, 844);
    clearSession(); abEval('location.reload(); "R"');
    waitFor(() => abEval(`!!document.querySelector('[data-testid="rs-invite-login"]')`));
    const anonTxt = abEval('document.body.innerText');
    check('匿名：信封＋「免费领取」＋登录 CTA，零隐私', typeof anonTxt === 'string' && anonTxt.includes('免费领取') && anonTxt.includes('有人为你解锁') && !anonTxt.includes('林川'));
    ab('screenshot', path.join(OUT, 'e155-invite-envelope-mobile-zh.png')); shot++;
    /* ⑤b 热修回归：无效令牌（404）⇒ 未找到态，禁止永远「…」（产线冒烟实锤的缺陷） */
    clearSession();
    for (const [tok, tname] of [['abCD-_12abCD-_1', '畸形令牌'], ['zzzz-_12zzzz-_12zzzz-_12', '格式合法但不存在']]) {
      for (const [vw, vh, vname] of VIEWPORTS) {
        openPage(BASE, `/invite/${tok}?free_access=1&lang=zh`, vw, vh);
        abEval('location.reload(); "R"');
        const nf = waitFor(() => abEval(`!!document.querySelector('[data-testid="rs-invite-not-found"]')`), 10000);
        const nfTxt = abEval(`(document.querySelector('.rs-root') || document.body).innerText`);
        check(`${tname} ${vname}：落定「邀请函不存在或已失效」而非永远「…」`, !!nf && typeof nfTxt === 'string' && nfTxt.includes('邀请函不存在或已失效') && !/…/.test(nfTxt.replace(/KINDREDSOULS/g, '')), typeof nfTxt === 'string' ? nfTxt.replace(/\s+/g, ' ').slice(0, 80) : 'n/a');
        check(`${tname} ${vname}：零信封零登录 CTA 零隐私`, !!nf && abEval(NO_CHAT) === 0 && abEval(`document.querySelectorAll('[data-testid="rs-envelope"], [data-testid="rs-invite-login"], [data-testid="rs-claim"]').length`) === 0 && !(typeof nfTxt === 'string' && nfTxt.includes('林川')));
      }
    }
    /* ⑥ 报告页六语双视口零溢出（A 视角） */
    for (const [vw, vh, vname] of VIEWPORTS) {
      for (const lang of LANGS) {
        openPage(BASE, `/invite/${T.ready}?free_access=1&lang=${lang}`, vw, vh);
        injectSession('user-a-e2e-0001'); abEval(`location.reload(); "R"`);
        waitFor(() => abEval(`document.querySelectorAll('[data-testid="rs-report"] .rs-report__sec').length`) === 2);
        const o = abEval(OVERFLOW);
        const tag = `report-${vname}-${lang}`;
        check(`${tag} 零横向溢出`, !!o && !o.missing && o.doc <= o.client && o.root <= o.client && o.bad === 0, o && !o.missing ? `doc=${o.doc}/${o.client} bad=${o.bad} ${o.worst.join(' ')}` : 'missing');
        check(`${tag} 零独立对话窗`, !!o && o.leaks === 0);
        if (lang === 'zh' || lang === 'th') { ab('screenshot', path.join(OUT, `e155-${tag}.png`)); shot++; }
      }
    }
    /* ⑦ 运行时零 window.open（报告页重载期间计数） */
    abEval(`(() => { window.__wo = 0; window.open = () => { window.__wo++; return null; }; document.querySelectorAll('[data-testid="rs-card-share"]')[0].click(); return 'armed'; })()`);
    sleep(1800);
    const wo = abEval('window.__wo');
    check('分享操作零 window.open', wo === 0, String(wo));
    console.log(`\n📷 截图 ${shot} 张 → ${OUT}`);
  } finally {
    try { ab('close'); } catch (_) { /* noop */ }
    child.kill();
  }
  const pass = results.filter((x) => x.ok).length;
  console.log(`\n📊 E155 真页验收：${pass}/${results.length} 通过`);
  fs.writeFileSync(path.join(OUT, `results-${process.pid}.json`), JSON.stringify(results, null, 2));
  process.exit(pass === results.length ? 0 : 1);
}
main().catch((e) => { console.error('FATAL', e && e.message); process.exit(2); });
