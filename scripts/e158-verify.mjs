/**
 * e158-verify.mjs —— E158「全站视觉、三场景一致性与交互精修」军令真页验收（一次性，不入编 test:astro）。
 *   ① 刀一：双人输入页——无重复紫色副标；主按钮香槟金渐变＋深黑字；CTA 三场景文案随胶囊切换＝刀八字典；
 *      同意句＝consent_continue_note（条款/隐私两枚链接原位）；精简 placeholder 六语零截断（桌面 304px／移动 259px）。
 *   ② 刀二：$4.99 未解锁 ⇒ 付费墙下「今日塔罗 $1.99」门禁（买按钮置灰不可点＋🔒＋tarot_gate_hint；零探测请求）；解锁后放行。
 *   ③ 刀三：幸福坐标卡 Canvas 无二维码（旧码区亮度采样）；标题 13px；预览放大；页面仅 1 枚「保存 / 分享幸福坐标卡」且可触发保存/分享。
 *   ④ 刀四：商道场景报告附带塔罗行＋今日塔罗读牌零情感穿帮词；付费墙加赠副标题＝商道词条。
 *   ⑤ 刀五：付费墙＋年鉴月/年报按钮＝三场景字典（带价）。
 *   ⑥ 刀七：同页生成月报/年报/今日塔罗 ⇒ 先前报告自动收起为「已解锁 · 点击展开重温」折叠条；点击无损重开；零重复计费/零重复请求。
 *   ⑦ 刀六：情爱场景亲填称呼 ⇒ 报告正文逐字带入（zh/en）。
 *   ⑧ 双视口（1440×900／390×844）× 六语（zh/en/fr/es/th/vi）：scrollWidth <= clientWidth。
 * 引擎：agent-browser；目标 KS_BASE（默认本地 4181，产线可切换）。
 * 环境开关：KS_E158_QUICK=1 ⇒ 仅 desktop/zh＋mobile/th 走全链（排障用）。
 * 前置（E 段登录态闭环）：
 *   · 本地服务须带真 key 启动（.env.local 的 AI／Supabase service key 皆空占位）：真源＝Railway variables，
 *     落 /tmp（0600）；且本地 SUPABASE_ANON_KEY（已停用的旧版 JWT）须置空，服务端才回落 service key（与产线同形）。
 *   · KS_RWY_VARS（默认 /tmp/ks-rwy-vars.json＝`railway variables --service KindredSouls --json` 产出）：
 *     据此为沙盒白名单测试账号铸会话（admin generate_link → verify），KS_SESSION_FILE 落盘缓存。
 * 🔴 agent-browser 血训：页内 eval 严禁执行「能匹配到非 BMP emoji 的正则」（含运行时 new RegExp 拼出）
 *    ⇒ daemon 卡死 30s、该会话所有 eval 排队超时（表现为同一表达式时通时卡）。涉 emoji 的正则一律 Node 侧做。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { resT, resReportBtn, resAlmanacBtn, splitReopenLabel } from '../web/src/lib/resonanceI18n.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e158-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = (process.env.KS_BASE || 'http://127.0.0.1:4181').replace(/\/$/, '');
const QUICK = process.env.KS_E158_QUICK === '1';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const VIEWPORTS = QUICK ? [['1440', '900', 'desktop', 'zh'], ['390', '844', 'mobile', 'th']]
  : [['1440', '900', 'desktop'], ['390', '844', 'mobile']];
const BAN = {
  zh: /感情|恋|爱|伴侣|情侣|心动|婚姻|情人|浪漫|另一半|桃花/,
  en: /\b(romance|romantic|love|loves|loved|lover|lovers|soulmate|valentine|flirt|affair|marriage|married|dating|couple|couples|beloved|intimate|intimacy)\b/i,
  fr: /\b(amour|amoureux|amoureuse|romance|romantique|couple|couples|mariage|amant|valentin|flirt)\b/i,
  es: /\b(amor|amores|enamora\w*|romance|romantic\w*|parejas?|matrimonio|novio|novia|amante|flirt\w*|alma gemela)\b/i,
  th: /ความรัก|คู่รัก|แฟน|คนรัก|คู่ครอง|แต่งงาน|วิวาห์|ชอบกัน/,
  vi: /\b(tình yêu|người yêu|hôn nhân|luyến du|luyến ái|bạn tình|đôi lứa|vợ chồng|say đắm)\b/i,
};

let AB_SESSION = `kse158-${process.pid}-${Date.now().toString(36)}`;
function ab(...args) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return execFileSync(path.join(AB_BIN, 'agent-browser'), ['--session', AB_SESSION, ...args], {
        encoding: 'utf8', env: { ...process.env, PATH: `${AB_BIN}:${process.env.PATH}` },
        stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, timeout: 60000,
      }).trim();
    } catch (e) {
      lastErr = e;
      /* 非幂等命令（键入/填充/导航）超时直接抛，绝不重放；只对只读命令重试。
       * 🔴 血训：页内 eval 若执行「能匹配到非 BMP emoji 的正则」（含运行时 new RegExp 拼出）⇒ agent-browser daemon
       *   卡死 30s，期间该会话所有 eval 排队超时 ⇒ 假红（表现为同一表达式时通时卡）。凡涉 emoji 的正则一律 Node 侧做。 */
      const idempotent = ['eval', 'screenshot', 'set', 'get'].includes(args[0]);
      if (!idempotent || !/ETIMEDOUT|ECONNRESET|EPIPE/.test(String(e.code || e.message))) throw e;
      console.log(`   ⚠️ agent-browser ${args[0]} 超时，第 ${attempt + 1} 次重试…`);
    }
  }
  throw lastErr;
}
function abEval(js) {
  const out = ab('eval', js);
  if (!out) return null;
  try { return JSON.parse(out); } catch (_) { return out; }
}
const sleep = (ms) => { try { execFileSync('sleep', [String(ms / 1000)]); } catch (_) { /* noop */ } };
function waitForFn(fn, ms = 15000, step = 500) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const v = fn(); if (v) return v; } catch (_) { /* retry（导航中 eval 可能抛） */ }
    sleep(step);
  }
  return null;
}
const has = (sel, ms = 15000) => waitForFn(() => (abEval(`!!document.querySelector(${JSON.stringify(sel)})`) === true ? true : null), ms);
function shot(name, sel) {
  if (sel) { try { abEval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'nearest' }); return 'SCROLLED'; })()`); } catch (_) { /* noop */ } }
  try { ab('screenshot', path.join(OUT, name)); console.log(`📸 ${name}`); } catch (e) { console.log(`📸 ${name} 失败: ${e.message}`); }
}
const click = (sel) => {
  try { abEval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'nearest' }); return 'SCROLLED'; })()`); } catch (_) { /* noop */ }
  return ab('click', sel);
};
/** 页内点击（遮挡免疫）：选择器或文本匹配 */
const clickJs = (sel, text) => abEval(`(() => {
  let el = ${sel ? `document.querySelector(${JSON.stringify(sel)})` : `[...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes(${JSON.stringify(text || '')}))`};
  if (!el) return 'NO-EL'; if (el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'nearest' }); el.click(); return 'CLICKED';
})()`);
function freshOpen(url) {
  ab('open', url);
  waitForFn(() => abEval('!!document.body && document.body.innerText.length > 20'), 20000);
  abEval(`(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (_) {} return 'CLEARED'; })()`);
  ab('open', url);
  waitForFn(() => abEval('!!document.body && document.body.innerText.length > 20'), 20000);
}

const results = [];
const infos = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail !== undefined && detail !== '' ? ' — ' + detail : ''}`);
};
const info = (name, detail) => { infos.push({ name, detail }); console.log(`ℹ️ ${name} — ${detail}`); };
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const f1 = (n) => Math.round(n * 10) / 10;
/** 按钮文案归一（Node 侧）：去首枚日历/王冠 emoji＋压空白。
 *  🔴 血训（E158）：页内 eval 若执行「能匹配到非 BMP emoji 的正则」（含运行时 new RegExp 拼出）⇒ agent-browser daemon
 *  卡死 30s，期间该会话所有 eval 排队超时 ⇒ 假红。页内只取原始 innerText，凡涉 emoji 的正则一律在 Node 侧做。 */
const normBtn = (t) => String(t || '').replace(/^[\u{1F4C5}\u{1F451}]\s*/u, '').replace(/\s+/g, ' ').trim();

/* ── 溢出探针：E156/E157/E158 元素左右不越视口＋页面无横向滚动＋文字不内溢 ── */
const OVERFLOW = `(() => {
  const vw = window.innerWidth;
  const bad = [];
  const sel = '[data-testid^="e156-"], [data-testid^="e157-"], [data-testid^="e158-"], .ks-e158-bar, .ks-hcard, .ks-hcard-preview, .ks-hcard-head, .dim-row, .dim-label, .mode-option, .mode-label, .mode-desc';
  for (const el of document.querySelectorAll(sel)) {
    const b = el.getBoundingClientRect();
    if (b.width === 0) continue;
    if (b.right > vw + 1 || b.left < -1) bad.push((el.dataset.testid || el.className) + ':' + Math.round(b.left) + '~' + Math.round(b.right));
  }
  const txt = [];
  for (const el of document.querySelectorAll('.ks-e158-bar, .ks-e158-bar-title, .ks-e158-bar-reopen, .ks-hcard-head, [data-testid="e156-cta"], [data-testid="e156-name-a"], [data-testid="e156-name-b"], [data-testid="e158-consent-note"], [data-testid="e158-tarot-gate-hint"]')) {
    if (el.scrollWidth > el.clientWidth + 1) txt.push((el.dataset.testid || el.className) + ':' + el.scrollWidth + '>' + el.clientWidth);
  }
  const scrollers = [];
  for (const el of document.querySelectorAll('.page, .page > div, .ks-hcard, [data-testid="e158-almanac"]')) {
    if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) scrollers.push((el.className || 'div') + ':' + el.scrollWidth + '>' + el.clientWidth);
  }
  return { vw, sw: document.documentElement.scrollWidth, bad, txt, scrollers };
})()`;
const overflowChecks = (tag, m) => {
  if (!m) { check(`${tag} 溢出探针`, false, 'NO-PROBE'); return; }
  const ok = m.sw <= m.vw + 1 && m.bad.length === 0 && m.txt.length === 0 && m.scrollers.length === 0;
  check(`${tag} 零横向溢出（scrollWidth<=clientWidth：页面/元素/文字）`, ok, `vw=${m.vw} sw=${m.sw} bad=${m.bad.join('|')} txt=${m.txt.join('|')} sc=${m.scrollers.join('|')}`);
};

/* placeholder 截断实测：以输入框真实字体 canvas 量宽 vs 可视内宽 */
const PH_MEASURE = `(() => ['[data-testid="e156-name-a"]', '[data-testid="e156-name-b"]'].map((q) => {
  const el = document.querySelector(q); if (!el) return null; const s = getComputedStyle(el);
  const c = document.createElement('canvas').getContext('2d');
  c.font = s.fontStyle + ' ' + s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily;
  const inner = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
  return { ph: el.placeholder, textW: Math.round(c.measureText(el.placeholder).width), innerW: Math.round(inner), w: el.getBoundingClientRect().width };
}))()`;

/* 刀一探针：输入页主按钮 computed 样式＋标题邻接＋同意句链接 */
const CTA_PROBE = `(() => {
  const b = document.querySelector('[data-testid="e156-cta"]'); if (!b) return null; const s = getComputedStyle(b); const r = b.getBoundingClientRect();
  const h1 = [...document.querySelectorAll('h1.title')].find((x) => /text-align/.test(x.getAttribute('style') || ''));
  const note = document.querySelector('[data-testid="e158-consent-note"]');
  const links = note ? [...note.querySelectorAll('a')].map((a) => a.getAttribute('href') + '|' + a.textContent) : [];
  return { text: b.innerText, bgImage: s.backgroundImage, bgColor: s.backgroundColor, color: s.color, w: r.width, h: r.height, nextCls: h1 && h1.nextElementSibling ? h1.nextElementSibling.className : null,
    nextText: h1 && h1.nextElementSibling ? h1.nextElementSibling.innerText.slice(0, 40) : null, subtitleDup: !!h1 && [...(h1.parentElement.querySelectorAll('p.subtitle'))].some((p) => /一见如故|KindredSouls|kindredsouls\\.online/.test(p.innerText)),
    note: note ? note.innerText : null, links, orderOk: !!note && (b.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 };
})()`;

function tagDates(idx, key) {
  return abEval(`(() => { const all = document.querySelectorAll('.date-manual'); const el = all[${idx}]; if (!el) return 'MISSING'; el.querySelector('.date-part').setAttribute('data-e156', ${JSON.stringify(key)}); return 'OK'; })()`);
}
function typeDates(lang) {
  const seq = lang === 'zh' ? ['19900615', '19920620'] : ['15061990', '20061992'];
  tagDates(0, 'dateA'); click('[data-e156="dateA"]'); ab('keyboard', 'type', seq[0]);
  waitForFn(() => tagDates(1, 'dateB') === 'OK', 8000);
  click('[data-e156="dateB"]'); ab('keyboard', 'type', seq[1]);
}
/** 选出生城市（展开第 idx 张卡的「时辰＋城市」折叠区 → 键入城市 → 点选首项）。
 *  今日塔罗卡片仅在真实出生城市 c1 在场时挂载（手输日期不选城市 ⇒ c1 为空 ⇒ 不挂载）。 */
function pickCity(idx, lang) {
  const q = lang === 'zh' ? '深圳' : 'Shenzhen';
  const fold = `[...document.querySelectorAll('.ks-fold')][${idx}]`;
  const opened = abEval(`(() => { const t = [...document.querySelectorAll('.ks-fold-trigger')][${idx}]; if (!t) return 'NO-TRIG'; if (t.getAttribute('aria-expanded') !== 'true') t.click(); return 'OK'; })()`);
  if (opened !== 'OK') return opened;
  waitForFn(() => abEval(`(() => { const f = ${fold}; return !!(f && f.dataset.settled === 'true' && f.dataset.open === 'true'); })()`) === true ? true : null, 8000);
  abEval(`(() => { const i = ${fold}.querySelector('.ks-fold-inner input'); if (!i) return 'NO-INPUT'; i.scrollIntoView({ block: 'center' }); i.focus(); return document.activeElement === i ? 'FOCUSED' : 'NOT-FOCUSED'; })()`);
  ab('keyboard', 'type', q);
  const opt = waitForFn(() => abEval(`(() => { const o = (${fold}.querySelector('.ks-fold-inner .celestial-scrollbar > div')); return o ? o.innerText : null; })()`), 10000, 300);
  if (!opt) return 'NO-DROPDOWN';
  const picked = abEval(`(() => { const o = ${fold}.querySelector('.ks-fold-inner .celestial-scrollbar > div'); if (!o) return 'NO-OPT'; o.click(); return o.innerText.replace(/\\s+/g, ' ').trim(); })()`);
  /* 收起折叠区（还原真实用户路径的版面；城市已落 c1/c2） */
  waitForFn(() => abEval(`!${fold}.querySelector('.ks-fold-inner .celestial-scrollbar')`) === true ? true : null, 5000, 200);
  abEval(`(() => { const t = [...document.querySelectorAll('.ks-fold-trigger')][${idx}]; if (t && t.getAttribute('aria-expanded') === 'true') t.click(); return 'OK'; })()`);
  return picked;
}
function selectCities(tag, lang) {
  for (const [idx, who] of [[0, '己方'], [1, 'TA']]) {
    const r = pickCity(idx, lang);
    if (r !== 'OK' && /NO-/.test(String(r))) check(`${tag} ${who}出生城市选中`, false, String(r));
  }
}
function toInputPage(tag) {
  has('.landing-start-btn', 20000);
  click('.landing-start-btn');
  if (!has('.mode-option', 10000)) { check(`${tag} 模式弹窗`, false, 'NO-MODAL'); return false; }
  click('.mode-option');
  if (!has('[data-testid="e156-cta"]', 15000)) { check(`${tag} 双人输入页`, false, 'NO-CTA'); return false; }
  return true;
}
const LOCK = String.fromCodePoint(0x1F512); // 🔒（页内正则禁配 emoji ⇒ Node 侧比对）
const TAROT_TEXT = `((document.querySelector('[data-testid="tarot-daily-card"]') || {}).innerText || '')`;
/** E 段（今日塔罗登录态闭环）抽样语种：全量跑 zh/en/th/vi，快跑随视口限定语种；其余语种 A–D 已覆盖零溢出 */
const E_LANGS = QUICK ? ['zh', 'th'] : ['zh', 'en', 'th', 'vi'];
const SB_STORAGE_KEY = 'sb-wfkxqhlcgrikxoofjvas-auth-token';
const SESSION_FILE = process.env.KS_SESSION_FILE || '/tmp/ks-e158-session.json';
const RWY_VARS = process.env.KS_RWY_VARS || '/tmp/ks-rwy-vars.json';
const TESTER_EMAIL = process.env.KS_TESTER_EMAIL || 'northgu916@gmail.com';
/** 沙盒白名单测试账号的真实会话（admin generate_link → verify；会话须含 refresh_token）。
 *  今日塔罗卡按既有产品逻辑须登录态才呈牌（游客只有买按钮）⇒ E 段用它注入本页后原址重载。
 *  service key 真源＝Railway variables（/tmp 落盘件，0600）；失败回 null 不抛。
 *  🔴 血训（E158 真页验收）：App 在 INITIAL_SESSION（triggerSaveResult）与 generateReport 里主动 `refreshSession()`，
 *  Supabase refresh_token 一次一换（rotation）。浏览器每开新档/freshOpen 清库 ⇒ 轮换后的会话不留存，再把同一份
 *  旧 refresh_token 注回去 ⇒ /auth/v1/token 400（Already Used）⇒ supabase-js 当场抹掉本地会话 ⇒ 塔罗卡回 locked 态、
 *  第二次重载零探测（假红）。故每次注入必须**现铸**会话（fresh），文件缓存仅作排障留档。 */
async function ensureTesterSession(fresh = false) {
  const ok = (x) => !!(x && x.access_token && x.refresh_token && Number(x.expires_at) * 1000 > Date.now() + 15 * 60 * 1000);
  try { if (!fresh && fs.existsSync(SESSION_FILE)) { const x = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); if (ok(x)) return x; } } catch (_) { /* 重铸 */ }
  try {
    const v = JSON.parse(fs.readFileSync(RWY_VARS, 'utf8'));
    const SB = v.SUPABASE_URL, SK = v.SUPABASE_SERVICE_KEY;
    if (!SB || !SK) return null;
    const r1 = await fetch(`${SB}/auth/v1/admin/generate_link`, { method: 'POST', headers: { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', email: TESTER_EMAIL }) });
    const j1 = await r1.json();
    if (!r1.ok || !j1.hashed_token) return null;
    const r2 = await fetch(`${SB}/auth/v1/verify`, { method: 'POST', headers: { apikey: SK, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', token_hash: j1.hashed_token }) });
    const j2 = await r2.json();
    if (!r2.ok || !j2.access_token) return null;
    const sess = { access_token: j2.access_token, refresh_token: j2.refresh_token, expires_at: j2.expires_at, expires_in: j2.expires_in, token_type: j2.token_type, user: j2.user };
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sess), { mode: 0o600 });
    return ok(sess) ? sess : null;
  } catch (_) { return null; }
}

const REPORT = `((document.querySelector('[data-testid="compat-once-metal-frame"]') || {}).innerText || '')`;
const SCROLL_TEXT = `((document.querySelector('[data-testid="compat-report-scroll"]') || {}).innerText || '')`;
/* 无损比对用 textContent：被收起的报告为 display:none，其 innerText 会退化为无换行文本（布局相关）⇒ 须以与布局无关的 textContent 对账 */
const SCROLL_TC = `((document.querySelector('[data-testid="compat-report-scroll"]') || {}).textContent || '')`;
const COUNT = (needle) => abEval(`performance.getEntriesByType('resource').filter((e) => e.name.includes(${JSON.stringify(needle)})).length`);
const FOLD = `(() => Object.fromEntries(['once', 'monthly', 'yearly', 'tarot'].map((k) => [k, {
  bar: !!document.querySelector('[data-testid="e158-bar-' + k + '"]'),
  barText: (document.querySelector('[data-testid="e158-bar-' + k + '"]') || {}).innerText || null,
  body: (() => { const b = document.querySelector('[data-testid="e158-fold-' + k + '"] > .ks-e158-fold-body') || document.querySelector('[data-testid="e158-fold-report"]'); if (!b) return 'ABSENT'; return getComputedStyle(b).display; })(),
}])))()`;
/** 沙盒付讫：点含 unlockWord 的按钮 → 收银台 → 支付（触发 reload） */
function payViaCashier(tag, clickRes, what) {
  check(`${tag} ${what} 购买入口可点`, clickRes === 'CLICKED', String(clickRes));
  if (clickRes !== 'CLICKED') return false;
  if (!has('[data-testid="sandbox-cashier"] [data-testid="sandbox-pay-btn"]', 20000)) { check(`${tag} ${what} 沙盒收银台唤起`, false, 'NO-CASHIER'); return false; }
  check(`${tag} ${what} 沙盒收银台唤起`, true);
  click('[data-testid="sandbox-pay-btn"]');
  return true;
}
/** 长卷落定：滚动槽在场、非空、无打字光标 */
function waitScrollDone(tag, ms = 300000) {
  let stable = 0, last = null;
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const m = abEval(`(() => { const el = document.querySelector('[data-testid="compat-report-scroll"]'); if (!el) return null; return { t: el.innerText.length, cursor: !!el.querySelector('.ks-report-cursor'), loading: !!document.querySelector('[data-testid="e158-almanac"] button[disabled]') }; })()`);
    if (m && m.t > 300 && !m.cursor && !m.loading) { if (m.t === last) { stable++; if (stable >= 3) return m.t; } else { stable = 0; last = m.t; } }
    sleep(1000);
  }
  return null;
}
const installDownloadHook = () => abEval(`(() => {
  if (window.__e158Dl) return 'HOOKED';
  window.__e158Dl = [];
  window.__e158Open = 0;
  const ow = window.open; window.open = function () { window.__e158Open++; return ow ? ow.apply(this, arguments) : null; };
  const orig = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__e158Dl.push(this.download + '|' + String(this.href).slice(0, 5)); return; } return orig.call(this); };
  return 'HOOKED';
})()`);

/* ── Canvas 无二维码采样：旧码区（右下 W-120-278~W-106 × H-130-278~H-116）若仍有二维码 ⇒ 亮米色方块（高亮占比高） ── */
const QR_SAMPLE = `(async () => {
  const img = document.querySelector('[data-testid="ks-hcard-result"] [data-testid="ks-hcard-preview-img"]'); if (!img) return null;
  const W = img.naturalWidth, H = img.naturalHeight; if (!W) return null;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  const zone = (x0, y0, x1, y1) => { const d = x.getImageData(x0, y0, x1 - x0, y1 - y0).data; let s = 0, bright = 0, n = 0; for (let i = 0; i < d.length; i += 4) { const l = lum(d, i); s += l; if (l > 170) bright++; n++; } return { mean: Math.round(s / n), brightFrac: +(bright / n).toFixed(3) }; };
  return { W, H, qrZone: zone(W - 398, H - 408, W - 106, H - 116), urlZone: zone(W - 620, H - 254, W - 120, H - 200) };
})()`;

ab('close', '--all');
const shotsTaken = new Set();

for (const [w, h, vname, onlyLang] of VIEWPORTS) {
  ab('set', 'viewport', w, h);
  for (const lang of LANGS) {
    if (onlyLang && lang !== onlyLang) continue;
    const tag = `${vname}/${lang}`;
    const names = lang === 'zh' ? ['山子', '北辰'] : ['Alex', 'Sam'];
    const [reopenLeft] = splitReopenLabel(lang);

    /* ── A：双人输入页（刀一＋刀八） ── */
    freshOpen(`${BASE}/?lang=${lang}`);
    if (!toInputPage(`${tag} A`)) continue;
    const cta0 = abEval(CTA_PROBE);
    if (!cta0) { check(`${tag} A 主按钮在场`, false, 'MISSING'); continue; }
    check(`${tag} A 无重复副标（大标题下一元素＝说明，零 subtitle 重影）`, cta0.nextCls === 'desc' && cta0.subtitleDup === false, `next=${cta0.nextCls} "${cta0.nextText}" dup=${cta0.subtitleDup}`);
    check(`${tag} A 主按钮香槟金渐变＋深黑字（computed）`, /240, 217, 156/.test(cta0.bgImage) && /217, 180, 91/.test(cta0.bgImage) && /197, 155, 62/.test(cta0.bgImage) && cta0.color === 'rgb(13, 13, 26)', `bg=${cta0.bgImage.slice(0, 90)} color=${cta0.color}`);
    const ctaByScene = { romance: norm(cta0.text) };
    for (const scene of ['business', 'friendship', 'romance']) {
      clickJs(`[data-testid="e156-pills-input-${scene}"]`);
      ctaByScene[scene] = norm(abEval(`(document.querySelector('[data-testid="e156-cta"]') || {}).innerText`));
    }
    const ctaOk = ['romance', 'business', 'friendship'].every((s) => ctaByScene[s] === resT(lang, `cta_unlock_${s}`));
    check(`${tag} A CTA 三场景文案＝刀八字典 cta_unlock_*（情爱「测算缘分」退役）`, ctaOk && cta0.text !== undefined, `${ctaByScene.romance} | ${ctaByScene.business} | ${ctaByScene.friendship}`);
    check(`${tag} A 同意句＝consent_continue_note（条款/隐私两链接原位，位于主按钮之后）`, norm(cta0.note) === norm(resT(lang, 'consent_continue_note')) && cta0.links.length === 2 && cta0.links[0].startsWith('/terms-of-service|') && cta0.links[1].startsWith('/privacy-policy|') && cta0.orderOk === true, `"${norm(cta0.note)}" links=${cta0.links.join(' ; ')}`);
    const pm = abEval(PH_MEASURE);
    const phOk = (pm || []).every((x) => x && x.textW <= x.innerW);
    check(`${tag} A 精简 placeholder 六语零截断（字宽<=内宽）`, phOk, (pm || []).map((x) => x && `"${x.ph}" ${x.textW}px<=${x.innerW}px(框${Math.round(x.w)}px)`).join(' | '));
    overflowChecks(`${tag} A 输入页`, abEval(OVERFLOW));
    clickJs('[data-testid="e156-pills-input-romance"]');
    shot(`e158-${vname}-${lang}-input.png`, '[data-testid="e156-cta"]'); shotsTaken.add(`input-${vname}`);

    /* ── B：/result 付费墙（刀二＋刀四＋刀五；商道场景） ── */
    freshOpen(`${BASE}/?lang=${lang}`);
    if (!toInputPage(`${tag} B`)) continue;
    ab('fill', '[data-testid="e156-name-a"]', names[0]);
    ab('fill', '[data-testid="e156-name-b"]', names[1]);
    typeDates(lang);
    selectCities(`${tag} B`, lang); /* 今日塔罗卡片仅在真实出生城市在场时挂载 */
    clickJs('[data-testid="e156-pills-input-business"]');
    clickJs('[data-testid="e156-cta"]');
    if (!has('.result-page', 60000)) { check(`${tag} B 结果页`, false, 'NO-RESULT'); continue; }
    waitForFn(() => abEval(`(() => { const h = document.querySelector('[data-testid="e158-tarot-gate-hint"]'); return h && h.innerText.length > 4 ? true : null; })()`) === true ? true : null, 15000);
    const gate = abEval(`(() => { const btn = document.querySelector('[data-testid="tarot-daily-buy"]'); const hint = document.querySelector('[data-testid="e158-tarot-gate-hint"]'); const s = btn ? getComputedStyle(btn) : null;
      return { disabled: !!btn && btn.disabled === true, cursor: s && s.cursor, text: btn ? btn.innerText : null, hint: hint ? norm(hint.innerText) : null, probe: performance.getEntriesByType('resource').filter((e) => e.name.includes('/api/tarot/daily')).length }; function norm(x) { return String(x || '').replace(/✦\\s*/, '').replace(/\\s+/g, ' ').trim(); } })()`);
    check(`${tag} B $4.99 未解锁 ⇒ 今日塔罗买按钮置灰不可点＋🔒`, !!gate && gate.disabled === true && gate.cursor === 'not-allowed' && /🔒/.test(String(gate.text)), `disabled=${gate && gate.disabled} cursor=${gate && gate.cursor} "${gate && gate.text}"`);
    check(`${tag} B 门禁提示＝tarot_gate_hint（刀八字典逐字）`, !!gate && gate.hint === norm(resT(lang, 'tarot_gate_hint')), `"${gate && gate.hint}"`);
    check(`${tag} B 门禁态零探测请求（/api/tarot/daily 计数＝0）`, !!gate && gate.probe === 0, `probe=${gate && gate.probe}`);
    const pwBtns = (abEval(`[...document.querySelectorAll('button')].map((b) => b.innerText)`) || []).map(normBtn);
    check(`${tag} B 付费墙月/年报按钮＝商道场景字典（带价）`, pwBtns.includes(resReportBtn(lang, 'business', 'monthly')) && pwBtns.includes(resReportBtn(lang, 'business', 'yearly')), pwBtns.filter((t) => /\$/.test(t)).join(' | '));
    const bonus = norm(abEval(`((document.querySelector('[data-testid="e158-tarot-bonus-detail"]') || {}).innerText || '')`));
    check(`${tag} B 付费墙加赠副标题＝商道词条（零情感读心文案）`, bonus === norm(resT(lang, 'tarot_bonus_detail_business')), `"${bonus}"`);
    overflowChecks(`${tag} B 付费墙＋塔罗门禁`, abEval(OVERFLOW));
    shot(`e158-${vname}-${lang}-paywall.png`, '[data-testid="e158-tarot-gate-hint"]'); shotsTaken.add(`paywall-${vname}`);

    /* ── C：解锁后 /result（刀三＋刀四＋刀七） ── */
    installDownloadHook();
    if (!payViaCashier(tag, clickJs(null, lang === 'zh' ? '立即解锁' : lang === 'en' ? 'Unlock Now' : lang === 'es' ? 'Desbloquear Ahora' : lang === 'fr' ? 'Débloquer Maintenant' : lang === 'th' ? 'ปลดล็อกเลย' : 'Mở khóa ngay'), '$4.99 深度报告')) continue;
    if (!has('.result-page', 60000)) { check(`${tag} C 付讫回场`, false, 'NO-RESULT'); continue; }
    installDownloadHook();
    const reportReady = waitForFn(() => { const t = abEval(REPORT); return typeof t === 'string' && (t.match(/【/g) || []).length >= 4 && /EOF|/.test(t) ? t : null; }, 300000, 1500);
    if (!reportReady) { check(`${tag} C 解锁后商道报告原地展开`, false, 'TIMEOUT'); shot(`e158-${vname}-${lang}-FAIL.png`); continue; }
    check(`${tag} C 解锁后商道报告原地展开`, true, `${reportReady.length} 字`);
    const tarotLine = norm(abEval(`((document.querySelector('.ks-tarot-line') || {}).innerText || '')`));
    check(`${tag} C 报告附带塔罗行＝商道语境（零情感穿帮词）`, tarotLine.length > 20 && !BAN[lang].test(tarotLine), `${tarotLine.slice(0, 60)}…`);
    const cardM = abEval(`(() => {
      const root = document.querySelector('[data-testid="ks-hcard-result"]'); if (!root) return null;
      const img = root.querySelector('[data-testid="ks-hcard-preview-img"]'); const head = root.querySelector('.ks-hcard-head'); const pv = root.querySelector('[data-testid="ks-hcard-preview"]');
      const btns = [...document.querySelectorAll('button')].filter((b) => b.innerText.replace(/\\s+/g, ' ').trim() === ${JSON.stringify(resT(lang, 'btn_save_share_card'))});
      const note = document.querySelector('[data-testid="e157-disclaimer-result"]');
      const rs = getComputedStyle(root), rr = root.getBoundingClientRect(), pr = pv ? pv.getBoundingClientRect() : null;
      const padL = parseFloat(rs.paddingLeft) || 0, padR = parseFloat(rs.paddingRight) || 0;
      return { headFs: head ? getComputedStyle(head).fontSize : null, pw: pr ? Math.round(pr.width * 10) / 10 : null, ph: pr ? Math.round(pr.height * 10) / 10 : null,
        imgOk: !!(img && img.complete && img.naturalWidth > 0), saveInCard: !!root.querySelector('[data-testid="ks-hcard-save"]'), saveBtns: btns.length, saveTestId: btns[0] ? btns[0].dataset.testid : null,
        afterNote: !!(btns[0] && note && (note.compareDocumentPosition(btns[0]) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0),
        /* 预览框须落在坐标卡根盒的「内容盒」内（左右内边距实测，不猜数值） */
        fits: !!pr && pr.left >= rr.left + padL - 0.5 && pr.right <= rr.right - padR + 0.5, containerW: Math.round((root.clientWidth - padL - padR) * 10) / 10 };
    })()`);
    check(`${tag} C 坐标卡标题字号 13px`, !!cardM && cardM.headFs === '13px', `fs=${cardM && cardM.headFs}`);
    check(`${tag} C 坐标卡预览等比放大（撑满坐标卡内容盒：桌面 300px／移动≥260px，E157 为 216px）`, !!cardM && cardM.pw >= (vname === 'desktop' ? 300 : 260) - 0.5 && cardM.pw <= (vname === 'desktop' ? 300.5 : cardM.containerW + 0.5) && cardM.fits === true && Math.abs(cardM.pw * 16 / 9 - cardM.ph) < 2, `w=${cardM && cardM.pw} h=${cardM && cardM.ph} 内容盒宽=${cardM && cardM.containerW} fits=${cardM && cardM.fits}`);
    check(`${tag} C 页面仅 1 枚「保存 / 分享幸福坐标卡」（预览框下零重复按钮；位于合规声明下方）`, !!cardM && cardM.saveBtns === 1 && cardM.saveInCard === false && cardM.saveTestId === 'goldcard-export-cta' && cardM.afterNote === true, `btns=${cardM && cardM.saveBtns} inCard=${cardM && cardM.saveInCard} testid=${cardM && cardM.saveTestId} afterNote=${cardM && cardM.afterNote}`);
    waitForFn(() => abEval(`(() => { const i = document.querySelector('[data-testid="ks-hcard-result"] [data-testid="ks-hcard-preview-img"]'); return !!(i && i.complete && i.naturalWidth > 0); })()`) === true ? true : null, 15000);
    const qr = abEval(QR_SAMPLE);
    check(`${tag} C Canvas 卡片无二维码（旧码区无亮色方块；品牌网址区有金字铭刻）`, !!qr && qr.qrZone.brightFrac < 0.25 && qr.urlZone.brightFrac > 0.005, qr ? `码区 mean=${qr.qrZone.mean} 亮占比=${qr.qrZone.brightFrac}；网址区 亮占比=${qr.urlZone.brightFrac}（${qr.W}×${qr.H}）` : 'NO-IMG');
    abEval(`window.__e158Dl = []`);
    /* 一键保存：验收环境统一关掉 navigator.share ⇒ 走确定性的「下载锚点＋（移动端）长按浮层」兜底路径；
       原生分享分支（支持文件分享的移动环境）由 E158-4 闸门钉源码契约。 */
    const env0 = abEval(`(() => { const had = typeof navigator.share; try { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); } catch (_) { /* noop */ } return { share: had, mobile: window.matchMedia('(max-width: 768px)').matches }; })()`);
    info(`${tag} C 保存环境`, `navigator.share=${env0 && env0.share} 移动视口=${env0 && env0.mobile}`);
    const saveClick = clickJs('[data-testid="goldcard-export-cta"]');
    const dl = waitForFn(() => { const d = abEval(`window.__e158Dl || []`); return Array.isArray(d) && d.length ? d : null; }, 20000, 400);
    check(`${tag} C 「保存 / 分享幸福坐标卡」一键触发高清 PNG（下载锚点：kindredsouls-business-card.png，零 window.open）`, saveClick === 'CLICKED' && !!dl && dl[0].startsWith('kindredsouls-business-card.png|blob:') && abEval(`window.__e158Open || 0`) === 0, `${dl && dl[0]}`);
    if (env0 && env0.mobile) {
      const layerOk = has('.ks-goldcard-modal', 6000);
      check(`${tag} C 移动端另开长按浮层（WebView 下载属性失效时兜底）`, layerOk === true, layerOk ? '' : 'NO-LAYER');
      if (layerOk) abEval(`(() => { const b = document.querySelector('.ks-goldcard-modal button'); if (b) b.click(); return 'CLOSED'; })()`);
    }
    const gate2 = abEval(`(() => { const btn = document.querySelector('[data-testid="tarot-daily-buy"]'); return { hint: !!document.querySelector('[data-testid="e158-tarot-gate-hint"]'), disabled: !!(btn && btn.disabled), probe: performance.getEntriesByType('resource').filter((e) => e.name.includes('/api/tarot/daily')).length }; })()`);
    // 游客态（未登录、无 accessToken）按既有逻辑走 locked 态：门禁撤除 ⇒ 买按钮恢复可点、零探测（探测需登录态）
    check(`${tag} C $4.99 解锁后今日塔罗门禁撤除（提示消失、按钮恢复可点）`, gate2.hint === false && gate2.disabled === false && !/🔒/.test(String(abEval(`((document.querySelector('[data-testid="tarot-daily-buy"]') || {}).innerText || '')`))), `hint=${gate2.hint} disabled=${gate2.disabled} probe=${gate2.probe}`);
    info(`${tag} C 解锁后探测计数（游客态应为 0；登录态才探测）`, String(gate2.probe));
    const f0 = abEval(FOLD);
    check(`${tag} C 初始单活＝单次深度报告展开（零折叠条）`, !!f0 && f0.once.bar === false && f0.once.body === 'block' && f0.monthly.bar === false && f0.tarot.bar === false, JSON.stringify(f0));
    overflowChecks(`${tag} C 报告＋坐标卡＋保存按钮`, abEval(OVERFLOW));
    shot(`e158-${vname}-${lang}-result.png`, '[data-testid="goldcard-export-cta"]'); shotsTaken.add(`result-${vname}`);

    /* ── D：刀七——同页月报 ⇒ 先前报告收起为折叠条；点击无损重开；零重复计费/请求 ── */
    const advisor0 = COUNT('/api/ai-advisor');
    installDownloadHook();
    if (!payViaCashier(tag, clickJs(`[data-testid="e158-almanac"] button`), '场景月报')) continue;
    if (!has('.result-page', 60000)) { check(`${tag} D 月报付讫回场`, false, 'NO-RESULT'); continue; }
    installDownloadHook();
    const mLen = waitScrollDone(`${tag} D`);
    if (!mLen) { check(`${tag} D 场景月报生成落定`, false, 'TIMEOUT'); shot(`e158-${vname}-${lang}-FAIL-monthly.png`); continue; }
    check(`${tag} D 场景月报生成落定`, true, `${mLen} 字`);
    const fm = abEval(FOLD);
    check(`${tag} D 月报展开 ⇒ 先前单次深度报告自动收起为折叠条（✦ 标题 · 已解锁 ｜ 展开重温 ▼）`, !!fm && fm.monthly.body !== 'ABSENT' && fm.monthly.body === 'block' && fm.once.bar === true && fm.once.body === 'none' && norm(fm.once.barText).includes(reopenLeft) && /展开重温|Reopen|Rouvrir|Reabrir|อ่านอีกครั้ง|xem lại/.test(norm(fm.once.barText)), JSON.stringify(fm));
    const monthlyText = abEval(SCROLL_TC);
    const monthlyLen = (abEval(SCROLL_TEXT) || '').length;
    overflowChecks(`${tag} D 月报展开＋折叠条`, abEval(OVERFLOW));
    shot(`e158-${vname}-${lang}-accordion-monthly.png`, '[data-testid="e158-bar-once"]'); shotsTaken.add(`accordion-${vname}`);
    const advisorA = COUNT('/api/ai-advisor');
    clickJs('[data-testid="e158-bar-once"]');
    const fo = abEval(FOLD);
    check(`${tag} D 点击折叠条 ⇒ 单次深度报告原地重开，月报收起为折叠条`, !!fo && fo.once.bar === false && fo.once.body === 'block' && fo.monthly.bar === true && fo.monthly.body === 'none', JSON.stringify(fo));
    check(`${tag} D 月报全文无损留存（DOM 常驻，重开零请求）`, abEval(SCROLL_TC) === monthlyText && COUNT('/api/ai-advisor') === advisorA, `len=${monthlyLen} advisor ${advisor0}→${advisorA}→${COUNT('/api/ai-advisor')}`);
    const cash0 = abEval(`!!document.querySelector('[data-testid="sandbox-cashier"]')`);
    clickJs('[data-testid="e158-bar-monthly"]');
    const fb = abEval(FOLD);
    check(`${tag} D 点击月报折叠条 ⇒ 月报原地重开（全文一致；零收银台/零重复计费/零新请求）`, !!fb && fb.monthly.bar === false && fb.monthly.body === 'block' && fb.once.bar === true && abEval(SCROLL_TC) === monthlyText && COUNT('/api/ai-advisor') === advisorA && cash0 === false, JSON.stringify(fb));
    /* 年鉴卡月报按钮＝纯金额词条（如「📅 解锁商道月报 $2.99」，不带周期后缀）——与付费墙「…$2.99/月」不同词条 */
    clickJs('[data-testid="e158-bar-once"]');
    clickJs(null, resAlmanacBtn(lang, 'business', 'monthly'));
    const fr = abEval(FOLD);
    check(`${tag} D 年鉴「月报」按钮（已生成）⇒ 直接重开而非再收银台（严禁重复付费/重复请求）`, !!fr && fr.monthly.bar === false && fr.monthly.body === 'block' && COUNT('/api/ai-advisor') === advisorA && !abEval(`!!document.querySelector('[data-testid="sandbox-cashier"]')`), JSON.stringify(fr));

    /* ── E：刀七——今日塔罗（登录态）＋刀四读牌语境 ──
       说明：今日塔罗卡按既有产品逻辑须登录态才呈牌（游客态只有买按钮；门禁与放行已由 B/C 验证）。
       ⭐ 本段模拟＝「登录账号的付讫回场」（真实沙盒付讫 reload 的原样键组，见下 inject）：注入沙盒白名单测试账号
       真实会话＋付讫回场键组后同页重载 ⇒ 现场恢复、once 洞察自动复活（服务端复读秒回）⇒ 塔罗卡带 token 探测、
       按会员日额直接呈牌，并因单次报告占焦点而收起为折叠条（带当日牌名＋正/逆位）。随后加写「付讫回场焦点标志」
       ks_e158_focus_panel='tarot'（与真实塔罗购买入口 onPurchase 所写键值逐字相同，E158-8 闸门钉源码）再重载 ⇒ 焦点落塔罗。
       ks_just_logged_in（sessionStorage＋localStorage）＝真实登录流程所写的现场恢复标志（App 同款双写）：
       /result 冷加载只有带该标志才恢复现场，否则 result 为空 ⇒ 黑屏（既有行为，已上报主公裁决，E158 不动）。 */
    if (!E_LANGS.includes(lang)) { info(`${tag} E 今日塔罗登录态闭环`, '本语种不在 E 段抽样内（见 E_LANGS）'); continue; }
    const sess = await ensureTesterSession();
    if (!sess) { check(`${tag} E 测试会话就绪（沙盒白名单账号）`, false, 'NO-SESSION'); continue; }
    /* 上面只验「可铸」；真正注入用的是现铸会话（见 ensureTesterSession 血训注） */
    const href = abEval('location.href');
    /* 回场键组＝产品付讫回场所写原样三键（App 278/1621 onGranted、2774 登录流程）：
     *   ks_payment_success ⇒ ResultPage 分诊 pendingInsightTrigger ⇒ once 洞察自动复活（E84 链）⇒ 塔罗卡随之挂载。
     *   🔴 不带 ks_payment_success 的「纯登录重载」⇒ once 洞察缺场，页面落既有「生成 AI 洞察」重试入口
     *   （E85-① 合法重入口；基线 9334e6f 同形，塔罗卡在 insight 前不挂载）⇒ 非本段射程，勿当回归。 */
    const inject = async (focus) => { const sessNow = await ensureTesterSession(true); return sessNow ? abEval(`(() => { localStorage.setItem(${JSON.stringify(SB_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(sessNow))}); sessionStorage.setItem('ks_just_logged_in', '1'); localStorage.setItem('ks_just_logged_in', '1'); sessionStorage.setItem('ks_payment_success', '1'); ${focus ? "sessionStorage.setItem('ks_e158_focus_panel', 'tarot');" : ''} return 'INJECTED'; })()`) : 'NO-SESSION'; };
    /* 塔罗就位＝折叠条在场（被单次报告占焦点）或卡片正文已呈 */
    const tarotShown = () => { const f = abEval(FOLD); const t = abEval(TAROT_TEXT); return (f && f.tarot.bar === true) || (typeof t === 'string' && t.length > 80 && t.indexOf(LOCK) < 0) ? true : null; };
    const onceReady = () => waitForFn(() => { const t = abEval(REPORT); return typeof t === 'string' && (t.match(/【/g) || []).length >= 4 ? t : null; }, 300000, 1500);
    await inject(false);
    ab('open', String(href));
    if (!has('.result-page', 60000)) { check(`${tag} E 登录态重载回场`, false, 'NO-RESULT'); continue; }
    installDownloadHook();
    check(`${tag} E 登录态重载回场（会话 token 到位；匿名解锁态留存 ⇒ 零付费墙、零塔罗门禁）`, !!waitForFn(() => { const tok = Number(abEval(`(sessionStorage.getItem('ks_access_token') || '').length`)); const gate = abEval(`!!document.querySelector('[data-testid="e158-tarot-gate-hint"]')`); return tok > 20 && gate !== true ? true : null; }, 30000, 700), `token=${Number(abEval(`(sessionStorage.getItem('ks_access_token') || '').length`)) > 20 ? '到位' : '缺位'} 门禁=${abEval(`!!document.querySelector('[data-testid="e158-tarot-gate-hint"]')`) === true ? '在' : '无'}`);
    const shown0 = waitForFn(tarotShown, 300000, 1500);
    if (!shown0) { check(`${tag} E 今日塔罗呈牌`, false, 'TIMEOUT'); shot(`e158-${vname}-${lang}-FAIL-tarot.png`); continue; }
    check(`${tag} E 今日塔罗呈牌（登录态已放行探测）`, COUNT('/api/tarot/daily') >= 1, `tarot/daily=${COUNT('/api/tarot/daily')}`);
    const repOk = onceReady();
    const fA = abEval(FOLD) || {};
    const barA = norm(fA.tarot && fA.tarot.barText);
    /* 塔罗折叠条＝「✦ 今日塔罗 · 牌名 · 正/逆位 ＋ 展开重温 ▼」（三段＋重开标）；「已解锁」属 once/月报/年报条，塔罗条不带 */
    check(`${tag} E 重载后默认焦点＝单次深度报告展开，今日塔罗收起为折叠条（带当日牌名＋正/逆位）`, !!repOk && fA.once.bar === false && fA.once.body === 'block' && fA.tarot.bar === true && barA.split('·').length === 3 && barA.split('·').slice(1).every((x) => x.trim().length > 0) && barA.includes(splitReopenLabel(lang)[1]) && !/▼\s*▼/.test(barA), barA);
    const tarotReq0 = COUNT('/api/tarot/daily');
    const advisorE = COUNT('/api/ai-advisor');
    clickJs('[data-testid="e158-bar-tarot"]');
    const ft1 = abEval(FOLD);
    const tarotTxt = norm(abEval(TAROT_TEXT) || '');
    check(`${tag} E 点击塔罗折叠条 ⇒ 塔罗原地展开、单次深度报告收起为折叠条（零新请求）`, !!ft1 && ft1.tarot.bar === false && ft1.once.bar === true && ft1.once.body === 'none' && tarotTxt.length > 80 && COUNT('/api/tarot/daily') === tarotReq0 && COUNT('/api/ai-advisor') === advisorE, JSON.stringify(ft1));
    check(`${tag} E 今日塔罗读牌＝商道语境（零情感穿帮词）`, !BAN[lang].test(tarotTxt), tarotTxt.slice(0, 80));
    clickJs('[data-testid="e158-bar-once"]');
    const ft2 = abEval(FOLD);
    check(`${tag} E 再点单次折叠条 ⇒ 单次深度报告原地重开、塔罗收起为折叠条（牌名一致；零新请求）`, !!ft2 && ft2.once.bar === false && ft2.once.body === 'block' && ft2.tarot.bar === true && norm(ft2.tarot.barText) === barA && COUNT('/api/tarot/daily') === tarotReq0 && COUNT('/api/ai-advisor') === advisorE, `${ft2 && norm(ft2.tarot.barText)} tarot/daily ${tarotReq0}→${COUNT('/api/tarot/daily')}`);

    /* 付讫回场焦点标志重载（模拟今日塔罗购买回场：onPurchase 写同一键值） */
    await inject(true);
    ab('open', String(href));
    if (!has('.result-page', 60000)) { check(`${tag} E 焦点标志重载回场`, false, 'NO-RESULT'); continue; }
    installDownloadHook();
    const tarotReady2 = waitForFn(() => { const t = abEval(TAROT_TEXT); return t.length > 80 && t.indexOf(LOCK) < 0 ? t : null; }, 300000, 1500);
    check(`${tag} E 付讫回场焦点标志 ⇒ 焦点落塔罗（塔罗展开、零塔罗折叠条；同盘当日复读一致）`, !!tarotReady2 && norm(tarotReady2) === tarotTxt && !!abEval(FOLD) && abEval(FOLD).tarot.bar === false, tarotReady2 ? `复读${norm(tarotReady2) === tarotTxt ? '一致' : '不一致'}` : 'TIMEOUT');
    const repOk2 = onceReady();
    waitForFn(() => abEval(`(() => { const b = document.querySelector('[data-testid="e158-bar-once"]'); return b && getComputedStyle(b).display !== 'none' ? true : null; })()`) === true ? true : null, 30000, 700);
    const ft3 = abEval(FOLD);
    check(`${tag} E 先前单次深度报告自动收起为折叠条（✦ 标题 · 已解锁 ｜ 展开重温 ▼）`, !!repOk2 && !!ft3 && ft3.once.bar === true && ft3.once.body === 'none' && ft3.tarot.bar === false && norm(ft3.once.barText).includes(reopenLeft), JSON.stringify(ft3));
    const tarotReq1 = COUNT('/api/tarot/daily');
    check(`${tag} E 重载仅一次探测（同盘当日复读：零重新抽牌）`, tarotReq1 === 1, `tarot/daily=${tarotReq1}`);
    clickJs('[data-testid="e158-bar-once"]');
    const ft4 = abEval(FOLD);
    check(`${tag} E 展开单次深度报告 ⇒ 今日塔罗收起为折叠条（牌名一致；零新请求）`, !!ft4 && ft4.once.bar === false && ft4.once.body === 'block' && ft4.tarot.bar === true && norm(ft4.tarot.barText) === barA && COUNT('/api/tarot/daily') === tarotReq1, `${ft4 && norm(ft4.tarot.barText)}`);
    clickJs('[data-testid="e158-bar-tarot"]');
    const ft5 = abEval(FOLD);
    check(`${tag} E 点击塔罗折叠条 ⇒ 原地重开（零新请求）`, !!ft5 && ft5.tarot.bar === false && ft5.once.bar === true && ft5.once.body === 'none' && COUNT('/api/tarot/daily') === tarotReq1, `tarot/daily ${tarotReq1}→${COUNT('/api/tarot/daily')}`);
    overflowChecks(`${tag} E 塔罗展开＋折叠条`, abEval(OVERFLOW));
    shot(`e158-${vname}-${lang}-accordion-tarot.png`, '[data-testid="tarot-daily-card"]'); shotsTaken.add(`tarot-${vname}`);
  }
}

/* ════ 刀六：情爱场景亲填称呼 ⇒ 报告正文逐字带入（desktop zh/en） ════ */
ab('set', 'viewport', '1440', '900');
for (const lang of (QUICK ? ['zh'] : ['zh', 'en'])) {
  const tag = `desktop/${lang} 刀六`;
  const names = lang === 'zh' ? ['山子', '北辰'] : ['Alex', 'Sam'];
  freshOpen(`${BASE}/?lang=${lang}`);
  if (!toInputPage(tag)) continue;
  ab('fill', '[data-testid="e156-name-a"]', names[0]);
  ab('fill', '[data-testid="e156-name-b"]', names[1]);
  typeDates(lang);
  clickJs('[data-testid="e156-cta"]');
  if (!has('.result-page', 60000)) { check(`${tag} 结果页`, false, 'NO-RESULT'); continue; }
  const pwBtns = (abEval(`[...document.querySelectorAll('button')].map((b) => b.innerText)`) || []).map(normBtn);
  check(`${tag} 情爱场景付费墙月/年报＝「解锁情爱月报/年报」（「姻缘月报/年报」退役）`, pwBtns.includes(resReportBtn(lang, 'romance', 'monthly')) && pwBtns.includes(resReportBtn(lang, 'romance', 'yearly')) && !pwBtns.some((t) => /姻缘/.test(t)), pwBtns.filter((t) => /\$/.test(t)).join(' | '));
  const rBonus = norm(abEval(`((document.querySelector('[data-testid="e158-tarot-bonus-detail"]') || {}).innerText || '')`));
  check(`${tag} 情爱场景加赠副标题不串场（非商道/挚友词条）`, rBonus.length > 4 && rBonus !== norm(resT(lang, 'tarot_bonus_detail_business')) && rBonus !== norm(resT(lang, 'tarot_bonus_detail_friendship')), `"${rBonus.slice(0, 60)}"`);
  if (!payViaCashier(tag, clickJs(null, lang === 'zh' ? '立即解锁' : 'Unlock Now'), '$4.99 深度报告')) continue;
  if (!has('.result-page', 60000)) { check(`${tag} 付讫回场`, false, 'NO-RESULT'); continue; }
  const txt = waitForFn(() => { const t = abEval(REPORT); return typeof t === 'string' && t.length > 160 && names.every((n) => t.includes(n)) ? t : (typeof t === 'string' && t.length > 400 ? 'MISSING' : null); }, 240000, 1500);
  check(`${tag} 情爱深度报告正文逐字带入双方称呼（严禁音译/意译）`, typeof txt === 'string' && txt !== 'MISSING' && names.every((n) => txt.includes(n)), typeof txt === 'string' && txt !== 'MISSING' ? `${names.join(' / ')} ×${names.map((n) => txt.split(n).length - 1).join('/')}` : `正文未逐字出现：${String(abEval(REPORT)).slice(0, 120)}`);
}
ab('close', '--all');

const KEY_SHOTS = ['input-desktop', 'input-mobile', 'paywall-desktop', 'paywall-mobile', 'result-desktop', 'result-mobile', 'accordion-desktop', 'accordion-mobile', 'tarot-desktop', 'tarot-mobile'];
check('关键截图齐（输入页/付费墙/结果页/手风琴/塔罗 × 双视口）', KEY_SHOTS.every((k) => shotsTaken.has(k)), [...shotsTaken].join(' | '));

const pass = results.filter((r) => r.ok).length;
const fails = results.filter((r) => !r.ok);
console.log(`\n🧪 E158 真页验收：${pass}/${results.length} 通过`);
for (const f of fails) console.log(`   ❌ ${f.name}`);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ base: BASE, pass, total: results.length, results, infos }, null, 2));
console.log(`VERIFY_EXIT ${pass === results.length ? 0 : 1}`);
process.exit(pass === results.length ? 0 : 1);
