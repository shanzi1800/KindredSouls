/**
 * e157-verify.mjs —— E157「澳洲与国际合规护栏」军令真页验收（一次性，不入编 test:astro）。
 *   ① 刀一：双人输入页「你的称呼 / TA 的称呼」placeholder＝`nickname_self_placeholder`／`nickname_partner_placeholder`（六语字典单源）；
 *      input `autocomplete="off"`＋`data-purpose="nickname"`（非实名身份字段）。
 *   ② 刀三：三处 `compliance_disclaimer_short` 常驻声明（输入页主按钮正下方／`/result` 坐标卡下方／财富报告尾坐标卡下方）——
 *      12px、浅香槟灰 #D9CFB8、可见、不隐藏、零截断、`scrollWidth <= clientWidth`、不越视口；泰语 line-height 1.55。
 *   ③ 条款：输入页「服务条款」原位弹窗＋`/terms-of-service` 政策页均含末章 `tos_prohibited_use_notice`（逐字）且零横向溢出。
 *   ④ 刀二真页抽测：解锁后的商道报告经 `detectComplianceViolations` 零命中（诽谤／误导性预测／无牌指令）。
 *   ⑤ 双视口（1440×900／390×844）× 六语（zh/en/fr/es/th/vi）：页面零横向溢出。
 * 引擎：agent-browser；目标 KS_BASE（默认本地 4181，产线可切换）。
 * 环境开关：KS_E157_QUICK=1 ⇒ 仅 desktop/zh＋mobile/th 走全链（排障用）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { resT } from '../web/src/lib/resonanceI18n.mjs';
import { detectComplianceViolations } from '../lib/resonance/resonancePrompt.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e157-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = (process.env.KS_BASE || 'http://127.0.0.1:4181').replace(/\/$/, '');
const QUICK = process.env.KS_E157_QUICK === '1';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const VIEWPORTS = QUICK ? [['1440', '900', 'desktop', 'zh'], ['390', '844', 'mobile', 'th']]
  : [['1440', '900', 'desktop'], ['390', '844', 'mobile']];
const CHAMPAGNE = 'rgb(217, 207, 184)'; // #D9CFB8
const WEALTH_QS = 'birth=1976-12-03&time=12:00&birthLat=22.5431&birthLon=114.0579&birthTz=Asia/Shanghai';

let AB_SESSION = `kse157-${process.pid}-${Date.now().toString(36)}`;
function ab(...args) {
  return execFileSync(path.join(AB_BIN, 'agent-browser'), ['--session', AB_SESSION, ...args], {
    encoding: 'utf8', env: { ...process.env, PATH: `${AB_BIN}:${process.env.PATH}` },
    stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, timeout: 120000,
  }).trim();
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

/* ── 溢出探针：E156/E157 元素左右不越视口＋页面/容器无横向滚动＋按钮/输入文字不内溢 ── */
const OVERFLOW = `(() => {
  const vw = window.innerWidth;
  const bad = [];
  const sel = '[data-testid^="e156-"], [data-testid^="e157-"], .ks-hcard, .ks-hcard-btn, .ks-hcard-preview, .dim-row, .dim-label, .mode-option, .mode-label, .mode-desc';
  for (const el of document.querySelectorAll(sel)) {
    const b = el.getBoundingClientRect();
    if (b.width === 0) continue;
    if (b.right > vw + 1 || b.left < -1) bad.push((el.dataset.testid || el.className) + ':' + Math.round(b.left) + '~' + Math.round(b.right));
  }
  const txt = [];
  for (const el of document.querySelectorAll('[data-testid^="e156-pills"] button, .ks-hcard-btn, [data-testid="e156-cta"], [data-testid="e156-name-a"], [data-testid="e156-name-b"]')) {
    if (el.scrollWidth > el.clientWidth + 1) txt.push((el.dataset.testid || el.className) + ':' + el.scrollWidth + '>' + el.clientWidth);
  }
  const scrollers = [];
  for (const el of document.querySelectorAll('.page, .page > div, .ks-hcard')) {
    if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) scrollers.push((el.className || 'div') + ':' + el.scrollWidth + '>' + el.clientWidth);
  }
  return { vw, sw: document.documentElement.scrollWidth, bad, txt, scrollers };
})()`;
const overflowChecks = (tag, m) => {
  if (!m) { check(`${tag} 溢出探针`, false, 'NO-PROBE'); return; }
  const ok = m.sw <= m.vw + 1 && m.bad.length === 0 && m.txt.length === 0 && m.scrollers.length === 0;
  check(`${tag} 零横向溢出（页面/元素/文字）`, ok, `vw=${m.vw} sw=${m.sw} bad=${m.bad.join('|')} txt=${m.txt.join('|')} sc=${m.scrollers.join('|')}`);
};

/* ── 声明探针：真实 getComputedStyle ＋ getBoundingClientRect（铁律 4：grep 自写数值皆假绿） ── */
const PROBE = (sel) => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null;
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { text: el.textContent, fs: s.fontSize, lh: s.lineHeight, color: s.color, opacity: s.opacity, vis: s.visibility, disp: s.display,
    h: r.height, left: r.left, right: r.right, vw: innerWidth, sw: el.scrollWidth, cw: el.clientWidth, ow: s.overflowWrap, ws: s.whiteSpace,
    to: s.textOverflow, clamp: s.webkitLineClamp, lang: el.getAttribute('lang'), after: (() => { const n = el.nextElementSibling; return n ? n.tagName + ':' + (n.textContent || '').slice(0, 24) : null; })(),
    before: (() => { const n = el.previousElementSibling; return n ? n.tagName + ':' + (n.dataset.testid || n.className || '') : null; })() };
})()`;
function disclaimerChecks(tag, which, m, lang) {
  if (!m) { check(`${tag} ${which} 声明在场`, false, 'MISSING'); return null; }
  const want = norm(resT(lang, 'compliance_disclaimer_short'));
  check(`${tag} ${which} 声明逐字＝字典 compliance_disclaimer_short`, norm(m.text) === want, norm(m.text) === want ? `${want.length} 字` : `DOM=${norm(m.text).slice(0, 60)}…`);
  check(`${tag} ${which} 12px＋浅香槟灰 #D9CFB8`, m.fs === '12px' && m.color === CHAMPAGNE, `fs=${m.fs} color=${m.color}`);
  check(`${tag} ${which} 绝不隐藏（可见/不透明/有高度/不省略不夹行）`, m.opacity === '1' && m.vis === 'visible' && m.disp !== 'none' && m.h > 0 && m.to === 'clip' && m.clamp === 'none',
    `op=${m.opacity} vis=${m.vis} disp=${m.disp} h=${f1(m.h)} to=${m.to} clamp=${m.clamp}`);
  const lhWant = lang === 'th' ? 12 * 1.55 : 12 * 1.6;
  check(`${tag} ${which} 行距＝${lang === 'th' ? '1.55' : '1.6'}（泰语强制 1.55）`, Math.abs(parseFloat(m.lh) - lhWant) <= 0.35, `lh=${m.lh} want≈${f1(lhWant)} lang=${m.lang}`);
  check(`${tag} ${which} 零截断零横向溢出（scrollWidth<=clientWidth＋不越视口＋overflow-wrap:anywhere）`, m.sw <= m.cw + 1 && m.left >= -1 && m.right <= m.vw + 1 && m.ow === 'anywhere',
    `sw=${m.sw} cw=${m.cw} left=${f1(m.left)} right=${f1(m.right)} vw=${m.vw} ow=${m.ow}`);
  return m;
}

/* placeholder 截断实测：以输入框真实字体做 canvas 量宽 vs 可视内宽（原生 placeholder 无法从 DOM 读截断态 ⇒ 量宽判读，仅呈报不改军令字典） */
const PH_MEASURE = `(() => ['[data-testid="e156-name-a"]', '[data-testid="e156-name-b"]'].map((q) => {
  const el = document.querySelector(q); if (!el) return null; const s = getComputedStyle(el);
  const c = document.createElement('canvas').getContext('2d');
  c.font = s.fontStyle + ' ' + s.fontWeight + ' ' + s.fontSize + ' ' + s.fontFamily;
  const inner = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
  return { ph: el.placeholder, auto: el.getAttribute('autocomplete'), purpose: el.getAttribute('data-purpose'), textW: Math.round(c.measureText(el.placeholder).width), innerW: Math.round(inner) };
}))()`;
const PLACEHOLDER_TEXT = `[document.querySelector('[data-testid="e156-name-a"]').placeholder, document.querySelector('[data-testid="e156-name-b"]').placeholder]`;
const DIMS = `[...document.querySelectorAll('.dim-label')].map((e) => e.innerText.trim())`;
const REPORT = `((document.querySelector('[data-testid="compat-once-metal-frame"]') || {}).innerText || '')`;

function tagDates(idx, key) {
  /* TA 卡在「我」生日填满后按 key 重挂（jumpToD2）⇒ 每次键入前现查现打标 */
  return abEval(`(() => { const all = document.querySelectorAll('.date-manual'); const el = all[${idx}]; if (!el) return 'MISSING'; el.querySelector('.date-part').setAttribute('data-e156', ${JSON.stringify(key)}); return 'OK'; })()`);
}
function typeDates(lang) {
  const seq = lang === 'zh' ? ['19900615', '19920620'] : ['15061990', '20061992'];
  tagDates(0, 'dateA'); click('[data-e156="dateA"]'); ab('keyboard', 'type', seq[0]);
  waitForFn(() => tagDates(1, 'dateB') === 'OK', 8000);
  click('[data-e156="dateB"]'); ab('keyboard', 'type', seq[1]);
  return abEval(`[...document.querySelectorAll('.date-manual')].map((d) => [...d.querySelectorAll('.date-part')].map((i) => i.value).join('-'))`);
}
/** 首页 → 模式弹窗 → 缘分密码 → 双人输入页 */
function toInputPage(lang, tag) {
  has('.landing-start-btn', 20000);
  click('.landing-start-btn');
  if (!has('.mode-option', 10000)) { check(`${tag} 模式弹窗`, false, 'NO-MODAL'); return false; }
  click('.mode-option');
  if (!has('[data-testid="e156-cta"]', 15000)) { check(`${tag} 双人输入页`, false, 'NO-CTA'); return false; }
  return true;
}

/** 条款末章：弹窗（原位）＋政策页 —— 逐字在场、零横向溢出、可滚动查阅 */
function termsChecks(lang, tag, where, scopeSel, openFn) {
  const title = norm(resT(lang, 'tos_prohibited_use_title'));
  const notice = norm(resT(lang, 'tos_prohibited_use_notice'));
  if (openFn) openFn();
  /* 章节锚＝标题元素（弹窗 .ks-legal-h／政策页 .policy-content h2，后者为 Fragment 无包裹 div） */
  const headSel = scopeSel + (where === '政策页' ? ' .policy-content h2' : ' .ks-legal-scroll .ks-legal-h');
  const m = waitForFn(() => {
    const r = abEval(`(() => {
      const N = (x) => (x ? x.textContent.replace(/\\s+/g, ' ').trim() : '');
      const root = document.querySelector(${JSON.stringify(scopeSel)}); if (!root) return null;
      const all = [...root.querySelectorAll(${JSON.stringify(headSel)})];
      const ps = [...root.querySelectorAll('p')];
      const p = ps.find((x) => N(x) === ${JSON.stringify(notice)}); if (!p) return { found: false, n: all.length };
      const heading = p.previousElementSibling;
      const s = getComputedStyle(p);
      const sc = p.closest('.ks-legal-scroll') || root; const mr = (p.closest('.ks-legal-modal') || root).getBoundingClientRect();
      const over = ps.filter((x) => x.scrollWidth > x.clientWidth + 1).map((x) => x.scrollWidth + '>' + x.clientWidth);
      return { found: true, n: all.length, h: N(heading), ow: s.overflowWrap, lh: s.lineHeight, fs: s.fontSize, lang: (p.closest('[lang]') || document.documentElement).getAttribute('lang'),
        sw: sc.scrollWidth, cw: sc.clientWidth, left: mr.left, right: mr.right, vw: innerWidth, over, isLast: all.length > 0 && all[all.length - 1] === heading };
    })()`);
    return r && r.found ? r : null;
  }, 10000);
  if (!m) {
    const n = abEval('document.querySelectorAll(' + JSON.stringify(headSel) + ').length');
    check(`${tag} ${where} 末章 tos_prohibited_use_notice 逐字在场`, false, `sections=${n}`); return;
  }
  check(`${tag} ${where} 末章 tos_prohibited_use_notice 逐字在场`, true, `${notice.length} 字`);
  check(`${tag} ${where} 条款章节数＝9（末章＝禁限章）`, m.n === 9 && m.isLast, `sections=${m.n} isLast=${m.isLast}`);
  check(`${tag} ${where} 末章标题逐字`, m.h === title, `h=${m.h}`);
  check(`${tag} ${where} 条款零横向溢出（滚动容器 scrollWidth<=clientWidth＋段落不内溢＋卡不越视口）`, m.sw <= m.cw + 1 && m.over.length === 0 && m.left >= -1 && m.right <= m.vw + 1,
    `sc=${m.sw}>${m.cw} over=${m.over.join('|')} card=${f1(m.left)}~${f1(m.right)} vw=${m.vw}`);
  info(`${tag} ${where} 末章排版`, `fs=${m.fs} lh=${m.lh} overflow-wrap=${m.ow} lang=${m.lang}`);
}

ab('close', '--all');
const shotsTaken = new Set();

for (const [w, h, vname, onlyLang] of VIEWPORTS) {
  ab('set', 'viewport', w, h);
  for (const lang of LANGS) {
    if (onlyLang && lang !== onlyLang) continue;
    const tag = `${vname}/${lang}`;
    const names = lang === 'zh' ? ['山子', '北辰'] : ['Alex', 'Sam'];

    /* ── A：双人输入页（刀一＋刀三①＋条款弹窗） ── */
    freshOpen(`${BASE}/?lang=${lang}`);
    if (!toInputPage(lang, `${tag} A`)) continue;
    const ph = abEval(PLACEHOLDER_TEXT);
    const phWant = [resT(lang, 'nickname_self_placeholder'), resT(lang, 'nickname_partner_placeholder')];
    check(`${tag} A 称呼 placeholder＝昵称/代号引导（六语字典单源）`, eq(ph, phWant), `${ph}`);
    const attrs = abEval(`[...document.querySelectorAll('[data-testid="e156-name-a"], [data-testid="e156-name-b"]')].map((el) => el.getAttribute('autocomplete') + '/' + el.getAttribute('data-purpose'))`);
    check(`${tag} A 称呼输入 autocomplete=off＋data-purpose=nickname（非实名身份字段）`, eq(attrs, ['off/nickname', 'off/nickname']), `${attrs}`);
    const pm = abEval(PH_MEASURE);
    for (const x of (Array.isArray(pm) ? pm : [])) if (x) info(`${tag} A placeholder 量宽（${x.textW > x.innerW ? '⚠️ 可能被原生 input 裁切' : '完整可显'}）`, `"${x.ph.slice(0, 28)}…" 字宽=${x.textW}px 内宽=${x.innerW}px`);
    const dIn = disclaimerChecks(`${tag} A`, '输入页（主按钮正下方）', abEval(PROBE('[data-testid="e157-disclaimer-input"]')), lang);
    // ✦ E158-刀一/刀八：同意句改通用表述 consent_continue_note（zh「点击上方按钮…」/en「By continuing…」等）
    if (dIn) check(`${tag} A 输入页声明位置＝主按钮之后、条款同意句之前`, dIn.before === 'BUTTON:e156-cta' && /^P:点击上方按钮|^P:By continuing|^P:Al continuar|^P:En continuant|^P:การดำเนินการต่อ|^P:Tiếp tục/.test(String(dIn.after)), `before=${dIn.before} after=${String(dIn.after).slice(0, 18)}`);
    overflowChecks(`${tag} A 输入页`, abEval(OVERFLOW));
    shot(`e157-${vname}-${lang}-input.png`, '[data-testid="e157-disclaimer-input"]'); shotsTaken.add(`input-${vname}`);
    termsChecks(lang, `${tag} A`, '服务条款弹窗', '.ks-legal-modal', () => {
      abEval(`(() => { const a = document.querySelector('a[href="/terms-of-service"]'); if (!a) return 'NO-LINK'; a.click(); return 'OPENED'; })()`);
      has('.ks-legal-modal .ks-legal-scroll', 8000);
    });
    if (lang === 'zh' || lang === 'th' || lang === 'fr') { shot(`e157-${vname}-${lang}-terms-modal.png`, '.ks-legal-modal .ks-legal-section:last-child'); shotsTaken.add(`terms-${vname}`); }
    abEval(`(() => { const b = document.querySelector('.ks-legal-close'); if (b) b.click(); return 'CLOSED'; })()`);

    /* ── B：/result 解锁后报告尾（刀三②＋刀二真页抽测） ── */
    freshOpen(`${BASE}/?lang=${lang}`);
    if (!toInputPage(lang, `${tag} B`)) continue;
    ab('fill', '[data-testid="e156-name-a"]', names[0]);
    ab('fill', '[data-testid="e156-name-b"]', names[1]);
    typeDates(lang);
    click('[data-testid="e156-pills-input-business"]');
    click('[data-testid="e156-cta"]');
    if (!has('.result-page', 60000)) { check(`${tag} B 结果页`, false, 'NO-RESULT'); continue; }
    waitForFn(() => (abEval(DIMS) || []).length === 4 ? true : null, 8000);
    check(`${tag} B 解锁前结果页零声明（声明只随报告/坐标卡出现，付费墙零扰动）`, abEval(`document.querySelectorAll('[data-testid^="e157-disclaimer"]').length`) === 0);
    overflowChecks(`${tag} B 付费墙`, abEval(OVERFLOW));
    const unlockWord = lang === 'zh' ? '立即解锁' : lang === 'en' ? 'Unlock Now' : lang === 'es' ? 'Desbloquear Ahora' : lang === 'fr' ? 'Débloquer Maintenant' : lang === 'th' ? 'ปลดล็อกเลย' : 'Mở khóa ngay';
    const clicked = abEval(`(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes(${JSON.stringify(unlockWord)})); if (!b) return 'NO-BTN'; b.click(); return 'CLICKED'; })()`);
    check(`${tag} B $4.99 主按钮可点（付费流零改动）`, clicked === 'CLICKED', String(clicked));
    if (!has('[data-testid="sandbox-cashier"] [data-testid="sandbox-pay-btn"]', 20000)) { check(`${tag} B 沙盒收银台唤起`, false, 'NO-CASHIER'); continue; }
    check(`${tag} B 沙盒收银台唤起`, true);
    click('[data-testid="sandbox-pay-btn"]');
    const reportReady = waitForFn(() => { const t = abEval(REPORT); return typeof t === 'string' && (t.match(/【/g) || []).length >= 4 ? t : null; }, 300000, 1500);
    if (!reportReady) { check(`${tag} B 解锁后报告渲染`, false, 'TIMEOUT'); shot(`e157-${vname}-${lang}-FAIL.png`); continue; }
    check(`${tag} B 解锁后商道报告原地展开`, true, `${reportReady.length} 字`);
    const hits = detectComplianceViolations(reportReady);
    check(`${tag} B 商道报告零合规命中（诽谤/误导性预测/无牌指令）`, hits.length === 0, hits.length ? hits.map((x) => `${x.kind}:${x.hit}`).join(' | ') : '0 hits');
    if (!has('[data-testid="e157-disclaimer-result"]', 30000)) { disclaimerChecks(`${tag} B`, '结果页（坐标卡下方）', null, lang); continue; }
    waitForFn(() => abEval(`(() => { const c = document.querySelector('[data-testid="ks-hcard-result"]'); const i = c && c.querySelector('[data-testid="ks-hcard-preview-img"]'); return !!(i && i.complete && i.naturalWidth > 0); })()`) === true ? true : null, 30000);
    const dRs = disclaimerChecks(`${tag} B`, '结果页（坐标卡下方）', abEval(PROBE('[data-testid="e157-disclaimer-result"]')), lang);
    if (dRs) check(`${tag} B 结果页声明位置＝坐标卡之后`, String(dRs.before).startsWith('DIV') && abEval(`(() => { const p = document.querySelector('[data-testid="e157-disclaimer-result"]'); return !!p.parentElement.querySelector('[data-testid="ks-hcard-result"]'); })()`) === true, `before=${dRs.before}`);
    overflowChecks(`${tag} B 报告＋坐标卡＋声明`, abEval(OVERFLOW));
    shot(`e157-${vname}-${lang}-result.png`, '[data-testid="e157-disclaimer-result"]'); shotsTaken.add(`result-${vname}`);

    /* ── C：财富报告页尾（刀三③） ── */
    freshOpen(`${BASE}/wealth/report?${WEALTH_QS}&lang=${lang}&free_access=1`);
    const wOk = waitForFn(() => (abEval(`!!document.querySelector('[data-testid="e157-disclaimer-wealth"]')`) === true ? true : null), 240000, 1500);
    if (!wOk) { check(`${tag} C 财富报告尾声明在场`, false, 'TIMEOUT'); shot(`e157-${vname}-${lang}-wealth-FAIL.png`); continue; }
    waitForFn(() => abEval(`(() => { const c = document.querySelector('[data-testid="ks-hcard-wealth"]'); const i = c && c.querySelector('[data-testid="ks-hcard-preview-img"]'); return !!(i && i.complete && i.naturalWidth > 0); })()`) === true ? true : null, 30000);
    const dW = disclaimerChecks(`${tag} C`, '财富报告页尾（坐标卡下方）', abEval(PROBE('[data-testid="e157-disclaimer-wealth"]')), lang);
    if (dW) check(`${tag} C 财富页声明位置＝坐标卡之后`, String(dW.before).startsWith('DIV') && abEval(`(() => { const p = document.querySelector('[data-testid="e157-disclaimer-wealth"]'); return !!p.parentElement.querySelector('[data-testid="ks-hcard-wealth"]'); })()`) === true, `before=${dW.before}`);
    overflowChecks(`${tag} C 财富报告页`, abEval(OVERFLOW));
    shot(`e157-${vname}-${lang}-wealth.png`, '[data-testid="e157-disclaimer-wealth"]'); shotsTaken.add(`wealth-${vname}`);
  }
}

/* ════ 政策页 /terms-of-service（独立路由，六语） ════ */
ab('set', 'viewport', '1440', '900');
for (const lang of LANGS) {
  if (QUICK && lang !== 'zh' && lang !== 'th') continue;
  freshOpen(`${BASE}/terms-of-service?lang=${lang}`);
  waitForFn(() => abEval(`document.querySelectorAll('.policy-content h2').length`) >= 9 ? true : null, 10000);
  termsChecks(lang, `policy/${lang}`, '政策页', '.policy-page');
  if (lang === 'zh' || lang === 'th') { shot(`e157-policy-${lang}.png`, '.policy-content h2:last-of-type'); shotsTaken.add(`policy-${lang}`); }
}
ab('close', '--all');

const KEY_SHOTS = ['input-desktop', 'input-mobile', 'result-desktop', 'result-mobile', 'wealth-desktop', 'wealth-mobile', 'terms-desktop', 'terms-mobile'];
check('关键截图齐（输入页/结果页/财富页/条款 × 双视口）', KEY_SHOTS.every((k) => shotsTaken.has(k)), [...shotsTaken].join(' | '));

const pass = results.filter((r) => r.ok).length;
const fails = results.filter((r) => !r.ok);
console.log(`\n🧪 E157 真页验收：${pass}/${results.length} 通过`);
for (const f of fails) console.log(`   ❌ ${f.name}`);
for (const i of infos) if (/⚠️/.test(i.name)) console.log(`   ⚠️ ${i.name} — ${i.detail}`);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ base: BASE, pass, total: results.length, results, infos }, null, 2));
process.exit(pass === results.length ? 0 : 1);
