/**
 * e159-verify.mjs —— E159「三场景权益物理隔离 · 二次刷新黑屏根治 · 出生时空全参透传」军令真页验收（一次性，不入编 test:astro）。
 *   A 刀五：双人输入页昵称 placeholder（en/es/fr/vi 精简措辞＋12px/移动 11.5px）六语零裁切（真实字体 canvas 量宽 ≤ 内宽）。
 *   B 刀一：/result 付费墙态切换条——切到未解锁场景 ⇒ 该场景专属付费墙（月/年报按钮＝该场景字典带价）＋今日塔罗门禁；零报告串出。
 *   C 刀一门禁（核心）：解锁情爱 once＋情爱月报 ⇒ 切商道 ⇒ 商道付费墙＋塔罗锁定、不串情爱月报/深报；
 *      解锁商道 once ⇒ 商道深报零情爱穿帮词（zh 零 element）＋易经标题「商道解读」；切回情爱 ⇒ 只还原情爱自己的报告；
 *      切挚友 ⇒ 仍付费墙（商道解锁不串台）；切回商道 ⇒ 商道报告还原。
 *   D 刀三：匿名态 /result `reload()`×3 非黑屏（报告/场景/解锁态稳定同步）。
 *   E 刀三：登录态 /result `reload()`×3 非黑屏（权益/报告/塔罗稳定同步；不带任何回场标志——军令「禁止消费一次即删」）。
 *   F 刀四：月报生成期间服务端日志 `[E159] compat timeTruth side=A|B` 携真实城市/经纬度/时区（非默认参考地）＋未填时辰显式降级。
 *   G 刀五：情爱月报已解锁 ⇒ 年鉴月报按钮＝「✓ 标题 · 已解锁 · 点击查看」直达态（撤价签）。
 *   H 双视口（1440×900／390×844）× 六语（zh/en/fr/es/th/vi）：scrollWidth <= clientWidth。
 * 引擎：agent-browser；目标 KS_BASE（默认本地 4181，产线可切换）。
 * 环境开关：KS_E159_QUICK=1 ⇒ 仅 desktop/zh＋mobile/th 走全链（排障用）。
 *   KS_SERVER_LOG＝本地服务端日志路径（F 段读 [E159] 行；产线无此文件 ⇒ F 段记 info 跳过）。
 *   KS_RWY_VARS（默认 /tmp/ks-rwy-vars.json＝`railway variables --service KindredSouls --json` 产出）：E 段为沙盒白名单测试账号现铸会话。
 * 🔴 agent-browser 血训（E158）：页内 eval 严禁执行「能匹配到非 BMP emoji 的正则」（含运行时 new RegExp 拼出）⇒ daemon 卡死 30s。
 *    涉 emoji 的归一/比对一律 Node 侧。测试会话每注入必现铸（refresh_token 一次一换）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { resT, resReportBtn, resReportTitle, resAlmanacBtn, splitReopenLabel } from '../web/src/lib/resonanceI18n.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e159-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = (process.env.KS_BASE || 'http://127.0.0.1:4181').replace(/\/$/, '');
const QUICK = process.env.KS_E159_QUICK === '1';
const SERVER_LOG = process.env.KS_SERVER_LOG || '';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const SCENES = ['romance', 'business', 'friendship'];
const VIEWPORTS = QUICK ? [['1440', '900', 'desktop', 'zh'], ['390', '844', 'mobile', 'th']]
  : [['1440', '900', 'desktop'], ['390', '844', 'mobile']];
const UNLOCK_WORD = { zh: '立即解锁', en: 'Unlock Now', fr: 'Débloquer Maintenant', es: 'Desbloquear Ahora', th: 'ปลดล็อกเลย', vi: 'Mở khóa ngay' };
const BAN = {
  zh: /感情|恋|爱人|伴侣|情侣|婚姻|情人|浪漫|另一半|桃花|姻缘|合婚|夫妻|爱情/,
  en: /\b(romance|romantic|love|loves|loved|lover|lovers|soulmate|valentine|flirt|affair|marriage|married|dating|couple|couples|beloved|intimate|intimacy)\b/i,
  fr: /\b(amour|amoureux|amoureuse|romance|romantique|couple|couples|mariage|amant|valentin|flirt)\b/i,
  es: /\b(amor|amores|enamora\w*|romance|romantic\w*|pareja\b|(?<![\w])(?:las|unas|dos|ambas|estas|esas|varias)\s+parejas|matrimonio|novio|novia|amante|flirt\w*|alma gemela)\b/i,
  th: /ความรัก|คู่รัก|แฟน|คนรัก|คู่ครอง|แต่งงาน|วิวาห์|ชอบกัน/,
  vi: /\b(tình yêu|người yêu|hôn nhân|luyến du|luyến ái|bạn tình|đôi lứa|vợ chồng|say đắm)\b/i,
};

let AB_SESSION = `kse159-${process.pid}-${Date.now().toString(36)}`;
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
      /* 非幂等命令（键入/填充/导航/reload）超时直接抛，绝不重放；只对只读命令重试。 */
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
const f1 = (n) => Math.round(n * 10) / 10;
/** 穿帮词命中明细（Node 侧）：词×次数＋首三处上下文 */
const banHits = (lang, text) => {
  const re = new RegExp(BAN[lang].source, 'gi'); const m = new Map(); const ctx = [];
  for (const x of String(text || '').matchAll(re)) {
    m.set(x[0], (m.get(x[0]) || 0) + 1);
    if (ctx.length < 3) ctx.push('…' + String(text).slice(Math.max(0, x.index - 14), x.index + x[0].length + 14).replace(/\s+/g, ' ') + '…');
  }
  return { hits: [...m.entries()].map(([w, n]) => w + '×' + n).join(','), ctx: ctx.join(' / ') };
};
const isolationDetail = (lang, r, pt, HD) => {
  if (!r) return 'TIMEOUT';
  const b = banHits(lang, r); const np = norm(pt);
  return '穿帮=[' + (b.hits || '无') + ']' + (b.ctx ? ' ' + b.ctx : '')
    + ' | element=' + (lang === 'zh' ? /element/i.test(r) : 'n/a')
    + ' | 含本场景标题=' + np.includes(HD.business) + ' | 含情爱标题=' + np.includes(HD.romance);
};
/** 按钮文案归一（Node 侧）：去首枚日历/王冠 emoji＋压空白（页内禁 emoji 正则）。 */
const normBtn = (t) => String(t || '').replace(/^[\u{1F4C5}\u{1F451}]\s*/u, '').replace(/\s+/g, ' ').trim();

/* ── 溢出探针：页面无横向滚动＋E156/E157/E158/E159 元素不越视口＋文字不内溢 ── */
const OVERFLOW = `(() => {
  const vw = window.innerWidth;
  const bad = [];
  const sel = '[data-testid^="e156-"], [data-testid^="e157-"], [data-testid^="e158-"], [data-testid^="e159-"], .ks-e158-bar, .ks-hcard, .ks-hcard-preview, .ks-hcard-head, .dim-row, .dim-label, .mode-option, .mode-label, .mode-desc';
  for (const el of document.querySelectorAll(sel)) {
    const b = el.getBoundingClientRect();
    if (b.width === 0) continue;
    if (b.right > vw + 1 || b.left < -1) bad.push((el.dataset.testid || el.className) + ':' + Math.round(b.left) + '~' + Math.round(b.right));
  }
  const txt = [];
  for (const el of document.querySelectorAll('.ks-e158-bar, .ks-e158-bar-title, .ks-e158-bar-reopen, .ks-e158-bar-unlocked, .ks-hcard-head, [data-testid="e156-cta"], [data-testid="e156-name-a"], [data-testid="e156-name-b"], [data-testid="e159-scene-switch-paywall"] button, [data-testid="e158-almanac"] button')) {
    if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) txt.push((el.dataset.testid || el.className) + ':' + el.scrollWidth + '>' + el.clientWidth);
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

/* placeholder 截断实测（刀五）：以 ::placeholder 真实计算字体 canvas 量宽 vs 可视内宽；并读计算字号 */
const PH_MEASURE = `(() => ['[data-testid="e156-name-a"]', '[data-testid="e156-name-b"]'].map((q) => {
  const el = document.querySelector(q); if (!el) return null; const s = getComputedStyle(el); const ps = getComputedStyle(el, '::placeholder');
  const c = document.createElement('canvas').getContext('2d');
  c.font = ps.fontStyle + ' ' + ps.fontWeight + ' ' + ps.fontSize + ' ' + ps.fontFamily;
  const inner = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
  return { ph: el.placeholder, textW: Math.round(c.measureText(el.placeholder).width), innerW: Math.round(inner), w: Math.round(el.getBoundingClientRect().width), fs: ps.fontSize };
}))()`;

function tagDates(idx, key) {
  return abEval(`(() => { const all = document.querySelectorAll('.date-manual'); const el = all[${idx}]; if (!el) return 'MISSING'; el.querySelector('.date-part').setAttribute('data-e156', ${JSON.stringify(key)}); return 'OK'; })()`);
}
function typeDates(lang) {
  const seq = lang === 'zh' ? ['19900615', '19920620'] : ['15061990', '20061992'];
  tagDates(0, 'dateA'); click('[data-e156="dateA"]'); ab('keyboard', 'type', seq[0]);
  waitForFn(() => tagDates(1, 'dateB') === 'OK', 8000);
  click('[data-e156="dateB"]'); ab('keyboard', 'type', seq[1]);
}
/** 选出生城市（深圳）：展开「时辰＋城市」折叠区 → 键入 → 点选首项。今日塔罗卡仅在真实出生城市在场时挂载。 */
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
const E_LANGS = QUICK ? ['zh', 'th'] : ['zh', 'en', 'th', 'vi'];
const SB_STORAGE_KEY = 'sb-wfkxqhlcgrikxoofjvas-auth-token';
const SESSION_FILE = process.env.KS_SESSION_FILE || '/tmp/ks-e159-session.json';
const RWY_VARS = process.env.KS_RWY_VARS || '/tmp/ks-rwy-vars.json';
const TESTER_EMAIL = process.env.KS_TESTER_EMAIL || 'northgu916@gmail.com';
/** 沙盒白名单测试账号的真实会话（admin generate_link → verify；须含 refresh_token）。每次注入必现铸（见 E158 血训）。 */
const ok = (x) => !!(x && x.access_token && x.refresh_token && Number(x.expires_at) * 1000 > Date.now() + 15 * 60 * 1000);
async function ensureTesterSession(fresh = false) {
  try { if (!fresh && fs.existsSync(SESSION_FILE)) { const x = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); if (ok(x)) return x; } } catch (_) { /* 重铸 */ }
  for (let attempt = 1; attempt <= 3; attempt++) {
  const minted = await mintTesterSession();
  if (minted) return minted;
  sleep(2500 * attempt);
  }
  return null;
}
async function mintTesterSession() {
  try {
    const v = JSON.parse(fs.readFileSync(RWY_VARS, 'utf8'));
    const SB = v.SUPABASE_URL, SK = v.SUPABASE_SERVICE_KEY;
    if (!SB || !SK) { console.log('   ⚠️ 会话铸造：缺 SUPABASE_URL/SERVICE_KEY'); return null; }
    const r1 = await fetch(`${SB}/auth/v1/admin/generate_link`, { method: 'POST', headers: { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', email: TESTER_EMAIL }) });
    const j1 = await r1.json();
    if (!r1.ok || !j1.hashed_token) { console.log(`   ⚠️ 会话铸造 generate_link 失败：HTTP ${r1.status} ${String(j1.error_description || j1.msg || j1.message || j1.error || '').slice(0, 120)}`); return null; }
    const r2 = await fetch(`${SB}/auth/v1/verify`, { method: 'POST', headers: { apikey: SK, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'magiclink', token_hash: j1.hashed_token }) });
    const j2 = await r2.json();
    if (!r2.ok || !j2.access_token) { console.log(`   ⚠️ 会话铸造 verify 失败：HTTP ${r2.status} ${String(j2.error_description || j2.msg || j2.error || '').slice(0, 120)}`); return null; }
    const sess = { access_token: j2.access_token, refresh_token: j2.refresh_token, expires_at: j2.expires_at, expires_in: j2.expires_in, token_type: j2.token_type, user: j2.user };
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sess), { mode: 0o600 });
    return ok(sess) ? sess : null;
  } catch (e) { console.log('   ⚠️ 会话铸造异常：' + String((e && e.message) || e).slice(0, 160) + ' cause=' + String((e && e.cause && e.cause.code) || '')); return null; }
}

const REPORT = `((document.querySelector('[data-testid="compat-once-metal-frame"]') || {}).innerText || '')`;
const PAGE_TEXT = `((document.querySelector('.result-page') || {}).textContent || '')`;
/* 被收起的报告为 display:none，innerText 退化 ⇒ 以与布局无关的 textContent 对账 */
const SCROLL_TC = `((document.querySelector('[data-testid="compat-report-scroll"]') || {}).textContent || '')`;
const COUNT = (needle) => abEval(`performance.getEntriesByType('resource').filter((e) => e.name.includes(${JSON.stringify(needle)})).length`);
/** 页面状态快照 */
const STATE = `(() => {
  const q = (s) => document.querySelector(s);
  const on = (p) => { const b = q('[data-testid="' + p + '"]'); return !!(b && b.dataset.on === 'true'); };
  const scene = ['romance', 'business', 'friendship'];
  const txt = (s) => ((q(s) || {}).innerText || '');
  const nb = (b) => (b.innerText || '').replace(/\\s+/g, ' ').trim();
  const tb = q('[data-testid="tarot-daily-buy"]');
  return {
    resultPage: !!q('.result-page'), bodyLen: (document.body.innerText || '').length,
    paywallSwitch: !!q('[data-testid="e159-scene-switch-paywall"]'),
    resultSwitch: !!q('[data-testid="e156-scene-switch"]'),
    scene: scene.find((k) => on('e156-pills-result-' + k)) || scene.find((k) => on('e156-pills-paywall-' + k)) || null,
    gateHint: !!q('[data-testid="e158-tarot-gate-hint"]'),
    tarotBuyDisabled: !!(tb && tb.disabled),
    onceLen: txt('[data-testid="compat-once-metal-frame"]').length,
    scrollLen: txt('[data-testid="compat-report-scroll"]').length,
    bars: ['once', 'monthly', 'yearly', 'tarot'].filter((k) => !!q('[data-testid="e158-bar-' + k + '"]')),
    tarotCard: !!q('[data-testid="tarot-daily-card"]'),
    cashier: !!q('[data-testid="sandbox-cashier"]'),
    moneyBtns: [...document.querySelectorAll('button')].map(nb).filter((t) => t.indexOf('$') >= 0),
    almanacBtns: [...document.querySelectorAll('[data-testid="e158-almanac"] button')].map(nb),
    tok: (sessionStorage.getItem('ks_access_token') || '').length,
  };
})()`;
const REPORT_STATE = `(() => {
  const f = document.querySelector('[data-testid="compat-once-metal-frame"]');
  const t = f ? (f.innerText || '') : '';
  const sc = ['romance', 'business', 'friendship'].find((k) => { const b = document.querySelector('[data-testid="e156-pills-result-' + k + '"]'); return !!(b && b.dataset.on === 'true'); });
  return { t, sc, busy: !!(f && f.querySelector('.ks-report-cursor')) };
})()`;
/** 深报落定：长度>300 且（商道/挚友 ≥4 个「【」小节 ／ 情爱沿用旧逻辑 ⇒ 长度>400），无光标且长度三拍稳定。 */
const onceReady = (ms = 300000) => {
  const t0 = Date.now(); let last = -1; let stable = 0;
  while (Date.now() - t0 < ms) {
    let st = null; try { st = abEval(REPORT_STATE); } catch (_) { /* 导航中 */ }
    const len = st && typeof st.t === 'string' ? st.t.length : 0;
    const shaped = !!st && len > 300 && (st.sc === 'romance' ? len > 400 : (st.t.match(/【/g) || []).length >= 4);
    if (shaped && !st.busy && len === last) { stable += 1; if (stable >= 2) return st.t; } else stable = 0;
    last = len; sleep(1500);
  }
  return null;
};
/** 场景落定：付费墙态切换条在场（未解锁）或结果态切换条在场（已解锁）＋场景胶囊选中 */
const settleScene = (scene, wantPaywall, ms = 60000) => waitForFn(() => {
  const s = abEval(STATE);
  return s && s.resultPage && s.scene === scene && s.paywallSwitch === wantPaywall ? s : null;
}, ms, 600);
/** 展开详盘三模块（默认折叠；标题断言前置）。幂等：已展开零点击。 */
function ensureDetails(tag) {
  try {
    abEval(`(() => { const t = document.querySelector('.ks-detail-toggle'); if (t && !t.classList.contains('ks-detail-open')) t.click(); return 'OK'; })()`);
    waitForFn(() => abEval(`(() => { const t = document.querySelector('.ks-detail-toggle'); return !!(t && t.classList.contains('ks-detail-open')); })()`) === true ? true : null, 8000, 300);
  } catch (e) { console.log(`   ⚠️ ${tag} 详盘展开失败：${String(e && e.message || e).slice(0, 120)}`); }
}
/** 沙盒付讫：点含解锁词的按钮 → 收银台 → 支付（触发 reload） */
function payViaCashier(tag, clickRes, what) {
  check(`${tag} ${what} 购买入口可点`, clickRes === 'CLICKED', String(clickRes));
  if (clickRes !== 'CLICKED') return false;
  if (!has('[data-testid="sandbox-cashier"] [data-testid="sandbox-pay-btn"]', 20000)) { check(`${tag} ${what} 沙盒收银台唤起`, false, 'NO-CASHIER'); return false; }
  click('[data-testid="sandbox-pay-btn"]');
  return true;
}
/** 长卷落定：滚动槽在场、非空、无打字光标 */
function waitScrollDone(ms = 300000) {
  let stable = 0, last = null;
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const m = abEval(`(() => { const el = document.querySelector('[data-testid="compat-report-scroll"]'); if (!el) return null; return { t: el.innerText.length, cursor: !!el.querySelector('.ks-report-cursor'), loading: !!document.querySelector('[data-testid="e158-almanac"] button[disabled]') }; })()`);
    if (m && m.t > 300 && !m.cursor && !m.loading) { if (m.t === last) { stable++; if (stable >= 3) return m.t; } else { stable = 0; last = m.t; } }
    sleep(1000);
  }
  return null;
}
/* ── F 段：服务端日志里的出生时空真值行（本地服务端；产线无日志文件 ⇒ info 跳过） ── */
const logSize = () => { try { return SERVER_LOG && fs.existsSync(SERVER_LOG) ? fs.statSync(SERVER_LOG).size : -1; } catch (_) { return -1; } };
function truthLinesSince(off) {
  if (off < 0 || !SERVER_LOG || !fs.existsSync(SERVER_LOG)) return null;
  const fd = fs.openSync(SERVER_LOG, 'r');
  const size = fs.statSync(SERVER_LOG).size;
  const buf = Buffer.alloc(Math.max(0, size - off));
  fs.readSync(fd, buf, 0, buf.length, off); fs.closeSync(fd);
  return String(buf).split('\n').filter((l) => l.includes('[E159] compat timeTruth side='));
}
const num = (line, key) => { const m = line.match(new RegExp('\\b' + key + '=(-?\\d+(?:\\.\\d+)?)')); return m ? Number(m[1]) : null; };
const ownedLabel = (lang, scene, kind) => norm(`✓ ${resReportTitle(lang, scene, kind)} · ${resT(lang, 'btn_unlocked_view')}`);

ab('close', '--all');
const shotsTaken = new Set();

for (const [w, h, vname, onlyLang] of VIEWPORTS) {
  ab('set', 'viewport', w, h);
  for (const lang of LANGS) {
    if (onlyLang && lang !== onlyLang) continue;
    const tag = `${vname}/${lang}`;
    const names = lang === 'zh' ? ['山子', '北辰'] : ['Alex', 'Sam'];
    const HD = Object.fromEntries(SCENES.map((s) => [s, resT(lang, `iching_heading_${s}`)]));
    const expFs = vname === 'desktop' ? '12px' : '11.5px';

    /* ── A：双人输入页（刀五 placeholder） ── */
    freshOpen(`${BASE}/?lang=${lang}`);
    if (!toInputPage(`${tag} A`)) continue;
    const pm = abEval(PH_MEASURE);
    const phOk = (pm || []).length === 2 && pm.every((x) => x && x.textW <= x.innerW && x.fs === expFs);
    check(`${tag} A 昵称 placeholder 六语零裁切（字宽<=内宽）＋字号 ${expFs}（::placeholder computed）`, phOk, (pm || []).map((x) => x && `"${x.ph}" ${x.textW}px<=${x.innerW}px(框${x.w}px,${x.fs})`).join(' | '));
    check(`${tag} A placeholder 措辞＝军令字典（己方 nickname_self_placeholder／TA nickname_partner_placeholder）`, (pm || []).length === 2 && norm(pm[0].ph) === norm(resT(lang, 'nickname_self_placeholder')) && norm(pm[1].ph) === norm(resT(lang, 'nickname_partner_placeholder')), (pm || []).map((x) => x && x.ph).join(' / '));
    overflowChecks(`${tag} A 输入页`, abEval(OVERFLOW));
    shot(`e159-${vname}-${lang}-input.png`, '[data-testid="e156-cta"]'); shotsTaken.add(`input-${vname}`);

    /* ── B：/result 付费墙态切换条（刀一） ── */
    freshOpen(`${BASE}/?lang=${lang}`);
    if (!toInputPage(`${tag} B`)) continue;
    ab('fill', '[data-testid="e156-name-a"]', names[0]);
    ab('fill', '[data-testid="e156-name-b"]', names[1]);
    typeDates(lang);
    selectCities(`${tag} B`, lang);
    clickJs('[data-testid="e156-cta"]');
    if (!has('.result-page', 60000)) { check(`${tag} B 结果页`, false, 'NO-RESULT'); continue; }
    const s0 = settleScene('romance', true, 30000);
    check(`${tag} B 初态＝情爱付费墙＋切换条在场＋今日塔罗锁定＋零报告`, !!s0 && s0.gateHint === true && s0.tarotBuyDisabled === true && s0.onceLen === 0 && s0.bars.length === 0, JSON.stringify(s0 && { scene: s0.scene, pw: s0.paywallSwitch, gate: s0.gateHint, once: s0.onceLen, bars: s0.bars }));
    for (const sc of ['business', 'friendship', 'romance']) {
      clickJs(`[data-testid="e156-pills-paywall-${sc}"]`);
      const s = settleScene(sc, true, 30000);
      const _mn = normBtn(resReportBtn(lang, sc, 'monthly'));
      const _yn = normBtn(resReportBtn(lang, sc, 'yearly'));
      const btnOk = !!s && s.moneyBtns.map(normBtn).includes(_mn) && s.moneyBtns.map(normBtn).includes(_yn);
      check(`${tag} B 切「${sc}」（未解锁）⇒ ${sc} 专属付费墙（月/年报按钮＝${sc} 字典带价）＋塔罗仍锁定＋零报告串出`, !!s && btnOk && s.gateHint === true && s.tarotBuyDisabled === true && s.onceLen === 0 && s.bars.length === 0, s ? `scene=${s.scene} btns=${s.moneyBtns.join(' | ')} gate=${s.gateHint} once=${s.onceLen}` : 'TIMEOUT');
    }
    clickJs('[data-testid="e156-pills-paywall-business"]');
    settleScene('business', true, 30000);
    overflowChecks(`${tag} B 商道付费墙＋切换条`, abEval(OVERFLOW));
    shot(`e159-${vname}-${lang}-paywall-business.png`, '[data-testid="e159-scene-switch-paywall"]'); shotsTaken.add(`paywall-${vname}`);
    clickJs('[data-testid="e156-pills-paywall-romance"]');
    if (!settleScene('romance', true, 30000)) { check(`${tag} C 回情爱付费墙`, false, 'TIMEOUT'); continue; }

    /* ── C：刀一门禁（核心） ── */
    const advisor0 = COUNT('/api/ai-advisor');
    if (!payViaCashier(tag, clickJs(null, UNLOCK_WORD[lang]), '$4.99 情爱深度报告')) continue;
    if (!has('.result-page', 60000)) { check(`${tag} C1 付讫回场`, false, 'NO-RESULT'); continue; }
    const rRom = onceReady();
    const stR = abEval(STATE);
    ensureDetails(tag);
    const ptR = abEval(PAGE_TEXT) || '';
    check(`${tag} C1 情爱 $4.99 解锁 ⇒ 情爱深度报告原地展开（易经标题＝姻缘解读；情爱场景可含情爱词）`, !!rRom && !!stR && stR.paywallSwitch === false && stR.scene === 'romance' && norm(ptR).includes(HD.romance) && !norm(ptR).includes(HD.business), rRom ? `${rRom.length} 字` : 'TIMEOUT');
    check(`${tag} C1 解锁态切换条在场（e156-scene-switch；可随时切场景）`, !!stR && stR.resultSwitch === true, '');
    /* 情爱月报（刀四：本地服务端日志须见真实城市/经纬度/时区透传＋未填时辰显式降级） */
    const logOff = logSize();
    if (!payViaCashier(tag, clickJs('[data-testid="e158-almanac"] button'), '情爱月报')) continue;
    if (!has('.result-page', 60000)) { check(`${tag} C2 月报付讫回场`, false, 'NO-RESULT'); continue; }
    const mLen = waitScrollDone();
    if (!mLen) { check(`${tag} C2 情爱月报生成落定`, false, 'TIMEOUT'); shot(`e159-${vname}-${lang}-FAIL-monthly.png`); continue; }
    check(`${tag} C2 情爱月报生成落定`, true, `${mLen} 字`);
    const monthlyTC = abEval(SCROLL_TC);
    const stM = abEval(STATE);
    /* G：已解锁月报按钮直达态（撤价签） */
    const ownM = stM && stM.almanacBtns.map(normBtn).includes(ownedLabel(lang, 'romance', 'monthly'));
    const mBtnHasPrice = !!stM && stM.almanacBtns.some((t) => normBtn(t) === ownedLabel(lang, 'romance', 'monthly') && t.indexOf('$') >= 0);
    check(`${tag} G 情爱月报已解锁 ⇒ 年鉴月报按钮＝「✓ 标题 · ${resT(lang, 'btn_unlocked_view')}」直达态（零价签）`, ownM && !mBtnHasPrice, (stM && stM.almanacBtns.join(' | ')) || 'NO-STATE');
    check(`${tag} G 年报（未解锁）按钮仍为带价购买态（未被直达态误伤）`, !!stM && stM.almanacBtns.map(normBtn).includes(normBtn(resAlmanacBtn(lang, 'romance', 'yearly'))), '');
    /* F：服务端真值行 */
    const lines = truthLinesSince(logOff);
    if (lines === null) info(`${tag} F 服务端出生时空真值行`, '无本地服务端日志（KS_SERVER_LOG 未设或产线）⇒ 本段由闸门 E159-17~20 覆盖');
    else {
      const A = lines.filter((l) => l.includes('side=A')), B = lines.filter((l) => l.includes('side=B'));
      const good = (arr) => arr.length > 0 && arr.every((l) => {
        const lat = num(l, 'lat'), lon = num(l, 'lon');
        return lat !== null && lon !== null && Math.abs(lat - 22.5) < 0.4 && Math.abs(lon - 114.05) < 0.6 && /tz=Asia\/Shanghai\b/.test(l) && /city=(深圳|Shenzhen)(\s|$)/.test(l);
      });
      check(`${tag} F 月报建盘吃到真实出生地（lat≈22.5/lon≈114.05/tz=Asia/Shanghai/city=深圳；非默认参考地）`, good(A) && good(B), `A×${A.length} B×${B.length} ${String(lines[0] || '').slice(0, 190)}`);
      const degraded = A.concat(B).length > 0 && A.concat(B).every((l) => /time=missing/.test(l) && /precision=date_level/.test(l) && /birth time missing => date_level/.test(l));
      check(`${tag} F 未填时辰 ⇒ 显式降级声明（time=missing＋date_level＋degrade=[birth time missing…]）`, degraded, String((A[0] || '')).match(/precision=[^ ]+( degrade=\[[^\]]*\])?/) ? String(A[0]).slice(String(A[0]).indexOf('precision='), String(A[0]).indexOf('precision=') + 150) : 'NO-LINE');
    }
    overflowChecks(`${tag} C2 情爱月报展开＋直达态按钮`, abEval(OVERFLOW));

    /* C3：切商道（未解锁）⇒ 商道付费墙＋塔罗锁定；不串情爱月报/深报 */
    clickJs('[data-testid="e156-pills-result-business"]');
    const sBz = settleScene('business', true, 30000);
    const _bzmn = normBtn(resReportBtn(lang, 'business', 'monthly'));
    const _bzyn = normBtn(resReportBtn(lang, 'business', 'yearly'));
    const bzBtnsOk = !!sBz && sBz.moneyBtns.map(normBtn).includes(_bzmn) && sBz.moneyBtns.map(normBtn).includes(_bzyn);
    const scrollBz = abEval(SCROLL_TC);
    check(`${tag} C3 解锁情爱 once＋月报后切商道 ⇒ 商道专属付费墙（商道字典带价）＋今日塔罗锁定`, !!sBz && bzBtnsOk && sBz.gateHint === true && sBz.tarotBuyDisabled === true, sBz ? `scene=${sBz.scene} gate=${sBz.gateHint} btns=${sBz.moneyBtns.join(' | ')}` : 'TIMEOUT');
    check(`${tag} C3 绝不串用情爱报告：情爱深报/情爱月报/折叠条零残留（归档槽按场景隔离）`, !!sBz && sBz.onceLen === 0 && sBz.bars.length === 0 && scrollBz !== monthlyTC, sBz ? `once=${sBz.onceLen} bars=${sBz.bars} 情爱月报同文=${scrollBz === monthlyTC}` : 'TIMEOUT');
    shot(`e159-${vname}-${lang}-isolation-business-paywall.png`, '[data-testid="e159-scene-switch-paywall"]'); shotsTaken.add(`isolation-${vname}`);
    /* C4：解锁商道 once ⇒ 商道深报（详盘隔离） */
    if (!payViaCashier(tag, clickJs(null, UNLOCK_WORD[lang]), '$4.99 商道深度报告')) continue;
    if (!has('.result-page', 60000)) { check(`${tag} C4 商道付讫回场`, false, 'NO-RESULT'); continue; }
    const rBz = onceReady();
    ensureDetails(tag);
    const ptBz = abEval(PAGE_TEXT) || '';
    check(`${tag} C4 商道深度报告原地展开（付费墙撤除；商道场景选中）`, !!rBz && !abEval(STATE).paywallSwitch && abEval(STATE).scene === 'business', rBz ? `${rBz.length} 字` : 'TIMEOUT');
    check(`${tag} C4 详盘隔离：商道深报零情爱穿帮词${lang === 'zh' ? '＋零 element' : ''}`, !!rBz && !BAN[lang].test(rBz) && (lang !== 'zh' || !/element/i.test(rBz)) && !norm(ptBz).includes(HD.romance) && norm(ptBz).includes(HD.business), isolationDetail(lang, rBz, ptBz, HD));
    const barsBz = abEval(`(() => [...document.querySelectorAll('.ks-e158-bar, .ks-e158-bar-reopen')].map((x) => (x.innerText || '').replace(/\\s+/g, ' ').trim()))()`) || [];
    check(`${tag} C4 折叠栏箭头单枚（零 ▼▼／▲）`, barsBz.every((t) => (t.split('▼').length - 1) <= 1 && !t.includes('▲')), barsBz.join(' | ').slice(0, 160));
    check(`${tag} C4 商道月报未购 ⇒ 年鉴月报按钮仍带价（商道解锁不白送月报）`, (abEval(STATE).almanacBtns.map(normBtn).includes(normBtn(resAlmanacBtn(lang, 'business', 'monthly')))), abEval(STATE).almanacBtns.join(' | '));
    overflowChecks(`${tag} C4 商道深报＋切换条`, abEval(OVERFLOW));
    shot(`e159-${vname}-${lang}-business-report.png`, '[data-testid="e156-scene-switch"]'); shotsTaken.add(`report-${vname}`);
    info(`${tag} C AI 请求计数（情爱 once＋月报＋商道 once 三次生成）`, `ai-advisor ${advisor0}→${COUNT('/api/ai-advisor')}`);
    /* C5：切回情爱 ⇒ 只还原情爱自己的报告（月报归档无损）；零商道文案；零付费墙 */
    clickJs('[data-testid="e156-pills-result-romance"]');
    const rBack = onceReady();
    const sBack = waitForFn(() => { const s = abEval(STATE); return s && !s.paywallSwitch && s.scene === 'romance' && (s.bars.includes('monthly') || abEval(SCROLL_TC) === monthlyTC) ? s : null; }, 60000, 800);
    ensureDetails(tag);
    const ptBack = abEval(PAGE_TEXT) || '';
    check(`${tag} C5 切回情爱 ⇒ 免费墙撤除＋情爱深报/情爱月报各自还原（月报全文与切换前逐字一致）`, !!rBack && !!sBack && !sBack.paywallSwitch && sBack.cashier === false && (sBack.bars.includes('monthly') || abEval(SCROLL_TC) === monthlyTC), rBack ? `深报 ${rBack.length} 字；bars=${sBack ? sBack.bars : '-'} 月报同文=${abEval(SCROLL_TC) === monthlyTC}` : 'TIMEOUT');
    check(`${tag} C5 情爱页零商道文案（易经标题＝姻缘解读，无商道解读）`, norm(ptBack).includes(HD.romance) && !norm(ptBack).includes(HD.business), '');
    /* C6：切挚友 ⇒ 仍付费墙（商道/情爱解锁均不串台） */
    clickJs('[data-testid="e156-pills-result-friendship"]');
    const sFr = settleScene('friendship', true, 30000);
    check(`${tag} C6 切挚友（未解锁）⇒ 挚友专属付费墙＋塔罗锁定（情爱/商道解锁均不串台；零报告）`, !!sFr && sFr.gateHint === true && sFr.tarotBuyDisabled === true && sFr.onceLen === 0 && sFr.bars.length === 0 && sFr.moneyBtns.map(normBtn).includes(normBtn(resReportBtn(lang, 'friendship', 'monthly'))), sFr ? `scene=${sFr.scene} gate=${sFr.gateHint} btns=${sFr.moneyBtns.join(' | ')}` : 'TIMEOUT');
    /* C7：切回商道 ⇒ 已解锁 ⇒ 只还原商道报告 */
    clickJs('[data-testid="e156-pills-paywall-business"]');
    const rBz2 = onceReady();
    ensureDetails(tag);
    const ptBz2 = abEval(PAGE_TEXT) || '';
    check(`${tag} C7 切回商道（已解锁）⇒ 免费墙撤除＋商道深报还原（零情爱月报、零情爱标题）`, !!rBz2 && norm(rBz2) === norm(rBz) && !norm(ptBz2).includes(HD.romance) && abEval(SCROLL_TC) !== monthlyTC && abEval(STATE).bars.indexOf('monthly') === -1, rBz2 ? `同文=${norm(rBz2) === norm(rBz)}` : 'TIMEOUT');

    /* ── D：刀三——匿名态 /result reload ×3 非黑屏 ── */
    for (let i = 1; i <= 3; i++) {
      ab('reload');
      if (!has('.result-page', 60000)) { check(`${tag} D 匿名 reload #${i}`, false, 'NO-RESULT（黑屏）'); shot(`e159-${vname}-${lang}-FAIL-reload${i}.png`); continue; }
      const r = onceReady(180000);
      const s = abEval(STATE);
      check(`${tag} D 匿名 reload #${i} 非黑屏：结果页在场、场景＝商道、解锁态同步（零付费墙）、商道深报稳定渲染`, !!r && !!s && s.bodyLen > 200 && s.scene === 'business' && s.paywallSwitch === false && norm(r) === norm(rBz), s ? `body=${s.bodyLen} scene=${s.scene} pw=${s.paywallSwitch} 报告同文=${norm(r) === norm(rBz)}` : 'NO-STATE');
    }
    shot(`e159-${vname}-${lang}-reload3.png`, '[data-testid="e156-scene-switch"]'); shotsTaken.add(`reload-${vname}`);

    /* ── E：刀三——登录态 /result reload ×3（现铸会话；不带任何回场标志） ── */
    if (!E_LANGS.includes(lang)) { info(`${tag} E 登录态 reload`, '本语种不在 E 段抽样内（见 E_LANGS）'); continue; }
    for (let i = 0; i < 3; i++) {
      const sessNow = await ensureTesterSession(true);
      if (!sessNow) { check(`${tag} E 测试会话就绪（沙盒白名单账号）reload #${i + 1}`, false, 'NO-SESSION'); break; }
      abEval(`(() => { localStorage.setItem(${JSON.stringify(SB_STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(sessNow))}); sessionStorage.removeItem('ks_just_logged_in'); localStorage.removeItem('ks_just_logged_in'); sessionStorage.removeItem('ks_payment_success'); return 'INJECTED'; })()`);
      ab('reload');
      if (!has('.result-page', 60000)) { check(`${tag} E 登录态 reload #${i + 1}`, false, 'NO-RESULT（黑屏）'); shot(`e159-${vname}-${lang}-FAIL-login-reload${i + 1}.png`); continue; }
      const r = onceReady(240000);
      const s = waitForFn(() => { const x = abEval(STATE); return x && x.tok > 20 && (x.tarotCard || x.bars.includes('tarot')) ? x : null; }, 240000, 1500);
      const alive = waitForFn(() => Number(abEval(`(sessionStorage.getItem('ks_access_token') || '').length`)) > 20 ? true : null, 30000, 700);
      check(`${tag} E 登录态 reload #${i + 1} 非黑屏：会话到位、场景＝商道、零付费墙、商道深报稳定还原`, !!alive && !!r && !!abEval(STATE) && abEval(STATE).scene === 'business' && abEval(STATE).paywallSwitch === false && norm(r) === norm(rBz), `token=${alive ? '到位' : '缺位'} 报告同文=${r ? norm(r) === norm(rBz) : 'TIMEOUT'}`);
      check(`${tag} E 塔罗稳定同步（登录态已解锁场景 ⇒ 今日塔罗卡在场或收起为折叠条）`, !!s, s ? `card=${s.tarotCard} bars=${s.bars}` : 'TIMEOUT');
    }
    overflowChecks(`${tag} E 登录态商道报告＋塔罗`, abEval(OVERFLOW));
    shot(`e159-${vname}-${lang}-login-reload3.png`, '[data-testid="e156-scene-switch"]'); shotsTaken.add(`login-${vname}`);
    /* 清会话（下轮 freshOpen 亦清库） */
    abEval(`(() => { for (const k of Object.keys(localStorage)) if (k.indexOf('sb-') === 0) localStorage.removeItem(k); return 'CLEARED'; })()`);
  }
}
ab('close', '--all');

const KEY_SHOTS = ['input-desktop', 'input-mobile', 'paywall-desktop', 'paywall-mobile', 'isolation-desktop', 'isolation-mobile', 'report-desktop', 'report-mobile'];
check('关键截图齐（输入页/付费墙/隔离/商道报告 × 双视口）', KEY_SHOTS.every((k) => shotsTaken.has(k)), [...shotsTaken].join(' | '));

const pass = results.filter((r) => r.ok).length;
const fails = results.filter((r) => !r.ok);
console.log(`\n🧪 E159 真页验收：${pass}/${results.length} 通过`);
for (const f of fails) console.log(`   ❌ ${f.name}`);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ base: BASE, pass, total: results.length, results, infos }, null, 2));
console.log(`VERIFY_EXIT ${pass === results.length ? 0 : 1}`);
process.exit(pass === results.length ? 0 : 1);
