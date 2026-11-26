/**
 * e156-verify.mjs —— E156「架构瘦身与主干融合」军令真页验收（一次性，不入编 test:astro）。
 *   ① 模式弹窗「缘分密码」六语改名；双人输入页（无「缘分密码 →」链接、三选一胶囊、称呼选填、单主按钮随胶囊换词）。
 *   ② /result 黄金漏斗零破坏：付费墙（$4.99＋限时塔罗加赠／$2.99 月报／$29.99 年报）在场；四维标签／卖点／月报年报字样随场景换词。
 *   ③ 沙盒 $4.99 解锁 ⇒ 原地展开分场景报告（商道/挚友四模块【】＋称呼融入）⇒ 切换坐标条重生 ⇒ 幸福坐标卡预览＋高清 PNG（1080×1920 非空）。
 *   ④ /resonance、/invite/:token 不再渲染专属页；零 window.open。
 *   ⑤ 财富报告页底部坐标卡（wealth_abundance）。
 * 引擎：agent-browser；目标 KS_BASE（默认本地 4181，产线可切换）；双视口 × 六语零溢出。
 * 环境开关：KS_E156_QUICK=1 ⇒ 仅 desktop/zh＋mobile/th 走全链（排障用）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { resT, resAlmanacBtn } from '../web/src/lib/resonanceI18n.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e156-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = (process.env.KS_BASE || 'http://127.0.0.1:4181').replace(/\/$/, '');
const QUICK = process.env.KS_E156_QUICK === '1';
const DL_DIR = '/tmp/e156-dl'; // 真下载落点（每次校验后清空；不污染仓库）
fs.mkdirSync(DL_DIR, { recursive: true });

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const VIEWPORTS = QUICK ? [['1440', '900', 'desktop', 'zh'], ['390', '844', 'mobile', 'th']]
  : [['1440', '900', 'desktop'], ['390', '844', 'mobile']];
const MODE_LABEL = {
  zh: '缘分密码', en: 'Resonance Code', fr: 'Code de Résonance', es: 'Código de Resonancia', th: 'รหัสคลื่นชะตา', vi: 'Mật Mã Nhân Duyên',
};
const DIM_ROMANCE = {
  zh: ['爱情', '沟通', '默契', '稳定'], en: ['Love', 'Communication', 'Chemistry', 'Stability'],
  es: ['Amor', 'Comunicación', 'Química', 'Estabilidad'], fr: ['Amour', 'Communication', 'Chimie', 'Stabilité'],
  th: ['ความรัก', 'ความเข้าใจกัน', 'เคมี', 'รากฐานความรัก'], vi: ['Tình yêu', 'Thấu hiểu', 'Sức hút', 'Nền tảng'],
};
const NAMES = (lang) => (lang === 'zh' ? ['山子', '北辰'] : ['Alex', 'Sam']);
/* 称呼融入判定：泰语模型按惯例音译（Alex→อเล็กซ์ / Sam→แซม）⇒ 拉丁原名或泰译任一命中即算融入 */
const NAME_ALT = { Alex: 'Alex|อเล็กซ์|แอลเจ็กซ์|แอเล็กซ์|เอเล็กซ์|เอเล็ก', Sam: 'Sam|แซม' };
const hasName = (text, name, lang) => (lang === 'th' ? new RegExp(NAME_ALT[name] || name).test(text) : text.includes(name));
const OLD_MODE_WORDS = ['姻缘密码', 'Marriage Code', 'Code Marriage', 'Marital'];

let AB_SESSION = `kse156-${process.pid}-${Date.now().toString(36)}`;
function ab(...args) {
  return execFileSync(path.join(AB_BIN, 'agent-browser'), ['--session', AB_SESSION, ...args], {
    encoding: 'utf8', env: { ...process.env, PATH: `${AB_BIN}:${process.env.PATH}`, AGENT_BROWSER_DOWNLOAD_PATH: DL_DIR },
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
function shot(name) { try { ab('screenshot', path.join(OUT, name)); console.log(`📸 ${name}`); } catch (e) { console.log(`📸 ${name} 失败: ${e.message}`); } }
/* 输入页/结果页是 fixed 自滚容器：先滚入视口再点（元素在折叠线下时原生点击落空） */
const click = (sel) => {
  try { abEval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'nearest' }); return 'SCROLLED'; })()`); } catch (_) { /* noop */ }
  return ab('click', sel);
};

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail !== undefined && detail !== '' ? ' — ' + detail : ''}`);
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── 溢出探针：E156 元素左右不越视口＋页面/容器无横向滚动＋胶囊/按钮文字不内溢 ── */
const OVERFLOW = `(() => {
  const vw = window.innerWidth;
  const bad = [];
  const sel = '[data-testid^="e156-"], .ks-hcard, .ks-hcard-btn, .ks-hcard-preview, .dim-row, .dim-label, .mode-option, .mode-label, .mode-desc';
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
  check(`${tag} 零溢出（页面/元素/文字）`, ok, `vw=${m.vw} sw=${m.sw} bad=${m.bad.join('|')} txt=${m.txt.join('|')} sc=${m.scrollers.join('|')}`);
};
const DIMS = `[...document.querySelectorAll('.dim-label')].map((e) => e.innerText.trim())`;
const CTA = `(document.querySelector('[data-testid="e156-cta"]') || {}).innerText || ''`;
const REPORT = `((document.querySelector('[data-testid="compat-once-metal-frame"]') || {}).innerText || '')`;
const BTN_HAS = (s) => `[...document.querySelectorAll('button')].some((b) => (b.innerText || '').includes(${JSON.stringify(s)}))`;

/* ── PNG 物证：1080×1920＋非空（解压像素字节多样性） ── */
function pngInfo(buf) {
  if (!buf || buf.length < 33 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const idat = []; let off = 8;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
  let distinct = 0;
  try {
    const raw = zlib.inflateSync(Buffer.concat(idat)); const set = new Set();
    for (let i = 0; i < raw.length; i += 37) set.add(raw[i]);
    distinct = set.size;
  } catch (_) { /* 保留 0 */ }
  return { w, h, size: buf.length, distinct };
}
/* 一键保存高清 PNG 物证：真点击「保存 / 分享」⇒ 截获 blob（渲染真产出）＋下载锚点（blob:＋download 文件名）＋真下载落盘；零 window.open 计数。
   移动端（≤768px）下载后另开大图浮层供长按保存 ⇒ 验收在场即关闭（不遮挡后续操作）。 */
function grabPng(stem, sel = '[data-testid="ks-hcard-save"]') {
  // 挂钩幂等：同页多次保存只装一次（重复包装 ⇒ 锚点重复计数的假红）；每次仅重置计数
  abEval(`(() => { window.__e156blob = null; window.__e156dl = []; window.__e156open = 0;
    if (!window.__e156hooked) {
      const c = URL.createObjectURL; URL.createObjectURL = (b) => { window.__e156blob = b; return c.call(URL, b); };
      window.open = () => { window.__e156open++; return null; };
      const ac = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { window.__e156dl.push(String(this.download) + '@' + String(this.href).slice(0, 5)); return ac.apply(this, arguments); };
      window.__e156hooked = true;
    }
    try { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); } catch (_) {}
    return 'ARMED'; })()`);
  const pngs = () => (fs.existsSync(DL_DIR) ? fs.readdirSync(DL_DIR).filter((f) => f.endsWith('.png')) : []);
  const before = pngs().length;
  click(sel); // ✦ E158-刀三：/result 改点合规声明下方唯一「保存 / 分享幸福坐标卡」（goldcard-export-cta）；财富页仍为 ks-hcard-save
  const dataUrl = waitForFn(() => {
    const r = abEval(`(async () => { const b = window.__e156blob; if (!b) return 'NOBLOB'; const u = await new Promise((res) => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); }); return u; })()`);
    return typeof r === 'string' && r.startsWith('data:image/png') ? r : null;
  }, 30000);
  const buf = dataUrl ? Buffer.from(dataUrl.split(',')[1], 'base64') : null;
  if (buf) fs.writeFileSync(path.join(OUT, `${stem}.png`), buf);
  // 真下载落盘：新浏览器档的首次下载明显偏慢（实测首张卡 15s 窗内未完成搬运）⇒ 等待窗放宽到 45s；判据不变（必须真落盘且大小与 blob 吻合）
  try { fs.mkdirSync(DL_DIR, { recursive: true }); } catch (_) {}
  waitForFn(() => (pngs().length > before ? true : null), 45000, 500);
  const layer = !!has('[data-testid="ks-hcard-layer-img"]', 2500);
  if (layer) click('.ks-hcard-layer');
  /* ✦ E158-刀三后继化：/result 幸福坐标卡改走 GoldCardExporter（移动端＝下载锚点＋全屏黑金浮层 .ks-goldcard-modal）。
     浮层不关 ⇒ 遮挡其后「切挚友」真点击（点击落浮层＝只关浮层，场景不变 ⇒ 假红，mobile/th 实锤）。 */
  const goldModal = !!has('.ks-goldcard-modal', 2500);
  if (goldModal) {
    abEval(`(() => { const m = document.querySelector('.ks-goldcard-modal'); if (m) m.click(); return 'CLOSED'; })()`);
    waitForFn(() => abEval(`!document.querySelector('.ks-goldcard-modal')`) === true ? true : null, 6000, 300);
  }
  const dl = abEval('JSON.stringify(window.__e156dl || [])');
  const real = pngs();
  const realOk = real.length - before >= 1 && real.some((f) => Math.abs(fs.statSync(path.join(DL_DIR, f)).size - (buf ? buf.length : 0)) <= 64);
  return { info: pngInfo(buf), opens: abEval('window.__e156open'), anchors: Array.isArray(dl) ? dl : JSON.parse(dl || '[]'), realOk, layer,
    err: abEval(`document.querySelectorAll('.ks-hcard-err').length`) };
}
function pngChecks(tag, g, stem) {
  const i = g.info;
  check(`${tag} 一键保存高清 PNG 1080×1920 非空`, !!i && i.w === 1080 && i.h === 1920 && i.distinct >= 16, i ? `${i.w}×${i.h} ${Math.round(i.size / 1024)}KB 像素多样性=${i.distinct}` : 'NO-PNG');
  check(`${tag} 下载锚点（blob:＋文件名）＋真下载落盘＋零 window.open＋零错误态`, g.anchors.length === 1 && g.anchors[0] === `${stem}.png@blob:` && g.opens === 0 && g.realOk && g.err === 0, `anchors=${JSON.stringify(g.anchors)} opens=${g.opens} 真下载=${g.realOk} err=${g.err}`);
  fs.rmSync(DL_DIR, { recursive: true, force: true });
}

function freshOpen(url) {
  ab('open', url);
  waitForFn(() => abEval('!!document.body && document.body.innerText.length > 20'), 20000);
  abEval(`(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (_) {} return 'CLEARED'; })()`);
  ab('open', url);
  waitForFn(() => abEval('!!document.body && document.body.innerText.length > 20'), 20000);
}

/* ════ 公共步骤 ════ */
/** 首页 → 模式弹窗 → 缘分密码 → 双人输入页 */
function toInputPage(lang, tag) {
  has('.landing-start-btn', 20000);
  click('.landing-start-btn');
  if (!has('.mode-option', 10000)) { check(`${tag} 模式弹窗`, false, 'NO-MODAL'); return false; }
  const labels = abEval(`[...document.querySelectorAll('.mode-option')].map((b) => (b.querySelector('.mode-label') || {}).innerText || '')`);
  const descs = abEval(`[...document.querySelectorAll('.mode-option')].map((b) => (b.querySelector('.mode-desc') || {}).innerText || '')`);
  check(`${tag} 模式弹窗「缘分密码」六语改名`, Array.isArray(labels) && labels.some((l) => l.includes(MODE_LABEL[lang])), `${labels}`);
  check(`${tag} 模式弹窗旧名「姻缘密码」绝迹`, Array.isArray(labels) && !labels.concat(descs).some((l) => OLD_MODE_WORDS.some((w) => l.includes(w))));
  check(`${tag} 副标体现双人关系坐标`, Array.isArray(descs) && descs.some((d) => d.includes('·')), `${descs}`);
  click('.mode-option');
  if (!has('[data-testid="e156-cta"]', 15000)) { check(`${tag} 双人输入页`, false, 'NO-CTA'); return false; }
  return true;
}
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
/** 输入页 E156 元件＋胶囊换词（不提交） */
function inputPageChecks(lang, tag) {
  check(`${tag} 「缘分密码 →」链接已删`, abEval(`document.querySelectorAll('#rs-entry-link, a[href="/resonance"]').length`) === 0);
  const pills = abEval(`[...document.querySelectorAll('[data-testid="e156-pills-input"] button')].map((b) => b.getAttribute('data-testid').replace('e156-pills-input-', '') + ':' + b.getAttribute('aria-checked'))`);
  check(`${tag} 三选一胶囊（情爱默认）`, eq(pills, ['romance:true', 'business:false', 'friendship:false']), `${pills}`);
  const cta0 = abEval(CTA);
  check(`${tag} 情爱主按钮＝刀八字典 cta_unlock_romance（E158-刀一：「测算缘分」退役，三场景同构）`, cta0.includes(resT(lang, 'cta_unlock_romance')), cta0);
  const names = NAMES(lang);
  ab('fill', '[data-testid="e156-name-a"]', names[0]);
  ab('fill', '[data-testid="e156-name-b"]', names[1]);
  const got = abEval(`[document.querySelector('[data-testid="e156-name-a"]').value, document.querySelector('[data-testid="e156-name-b"]').value]`);
  check(`${tag} 选填称呼输入`, eq(got, names), `${got}`);
  const ctaB = resT(lang, 'cta_unlock_business'), ctaF = resT(lang, 'cta_unlock_friendship'); // ✦ E158-刀一/刀八：三场景 CTA 字典
  click('[data-testid="e156-pills-input-business"]');
  const c1 = abEval(CTA);
  check(`${tag} 商道 ⇒ 主按钮换词`, c1.includes(ctaB) && c1 !== cta0, c1);
  click('[data-testid="e156-pills-input-friendship"]');
  const c2 = abEval(CTA);
  check(`${tag} 挚友 ⇒ 主按钮换词`, c2.includes(ctaF) && c2 !== c1, c2);
  click('[data-testid="e156-pills-input-romance"]');
  check(`${tag} 回情爱 ⇒ 主按钮复原`, abEval(CTA) === cta0);
  check(`${tag} 单一主按钮（无第二提交键）`, abEval(`document.querySelectorAll('[data-testid="e156-cta"], button.btn-primary').length`) === 1);
}

ab('close', '--all');
const shotsTaken = new Set();

for (const [w, h, vname, onlyLang] of VIEWPORTS) {
  ab('set', 'viewport', w, h);
  const desktop = vname === 'desktop';
  for (const lang of LANGS) {
    if (onlyLang && lang !== onlyLang) continue;
    const names = NAMES(lang);
    const tag = `${vname}/${lang}`;

    /* ── R：情爱路径预付费（黄金漏斗原样：四维＝既有标签、付费墙原卖点） ── */
    if (desktop) {
      freshOpen(`${BASE}/?lang=${lang}`);
      if (toInputPage(lang, `${tag} R`)) {
        const d = typeDates(lang);
        check(`${tag} R 双生日键入`, Array.isArray(d) && d[0].includes('1990') && d[1].includes('1992'), `${d}`);
        click('[data-testid="e156-cta"]');
        if (has('.result-page', 60000)) {
          waitForFn(() => (abEval(DIMS) || []).length === 4 ? true : null, 8000);
          const dims = abEval(DIMS);
          check(`${tag} R 情爱四维＝既有标签逐字`, eq(dims, DIM_ROMANCE[lang]), `${dims}`);
          const feats = abEval(`(document.body.innerText || '')`);
          check(`${tag} R 情爱付费墙原卖点在场（非场景词条）`, typeof feats === 'string' && !feats.includes(resT(lang, 'feat_business')[0]) && !feats.includes(resT(lang, 'feat_friendship')[0]));
          check(`${tag} R 付费墙三档在场（$4.99/$2.99/$29.99）`, typeof feats === 'string' && /\$4[.,]99/.test(feats) && /\$2[.,]99/.test(feats) && /\$29[.,]99/.test(feats));
          overflowChecks(`${tag} R 付费墙`, abEval(OVERFLOW));
        } else check(`${tag} R 结果页`, false, 'NO-RESULT');
      }
    }

    /* ── S：场景全链（输入页 → /result 付费墙 → 沙盒解锁 → 报告 → 切换 → 坐标卡） ── */
    freshOpen(`${BASE}/?lang=${lang}`);
    if (!toInputPage(lang, `${tag} S`)) continue;
    inputPageChecks(lang, `${tag} S`);
    const d = typeDates(lang);
    check(`${tag} S 双生日键入`, Array.isArray(d) && d[0].includes('1990') && d[1].includes('1992'), `${d}`);
    click('[data-testid="e156-pills-input-business"]');
    overflowChecks(`${tag} S 输入页（商道）`, abEval(OVERFLOW));
    if (desktop ? lang === 'zh' || lang === 'fr' : lang === 'th' || lang === 'fr') {
      shot(`e156-${vname}-${lang}-input-business.png`); shotsTaken.add(`input-${vname}`);
    }
    click('[data-testid="e156-cta"]');
    if (!has('.result-page', 60000)) { check(`${tag} S 结果页`, false, 'NO-RESULT'); continue; }
    waitForFn(() => (abEval(DIMS) || []).length === 4 ? true : null, 8000);
    const dimsB = abEval(DIMS);
    check(`${tag} S 商道四维标签`, eq(dimsB, resT(lang, 'dim_business')), `${dimsB}`);
    const bodyB = abEval(`(document.body.innerText || '')`);
    check(`${tag} S 付费墙 4 条卖点随商道换词`, typeof bodyB === 'string' && resT(lang, 'feat_business').every((f) => bodyB.includes(f.replace(/^\S+\s/, ''))) && !resT(lang, 'feat_friendship').some((f) => bodyB.includes(f.replace(/^\S+\s/, ''))));
    check(`${tag} S 付费墙三档在场（$4.99/$2.99/$29.99）`, typeof bodyB === 'string' && /\$4[.,]99/.test(bodyB) && /\$2[.,]99/.test(bodyB) && /\$29[.,]99/.test(bodyB));
    check(`${tag} S 月报/年报按钮随商道换词`, abEval(BTN_HAS(resT(lang, 'btn_monthly_business'))) === true && abEval(BTN_HAS(resT(lang, 'btn_annual_business'))) === true);
    overflowChecks(`${tag} S 付费墙（商道）`, abEval(OVERFLOW));
    if (desktop ? lang === 'zh' || lang === 'fr' : lang === 'th' || lang === 'fr') {
      shot(`e156-${vname}-${lang}-paywall-business.png`); shotsTaken.add(`paywall-${vname}`);
    }

    /* 沙盒 $4.99 解锁 */
    const unlockWord = lang === 'zh' ? '立即解锁' : lang === 'en' ? 'Unlock Now' : lang === 'es' ? 'Desbloquear Ahora' : lang === 'fr' ? 'Débloquer Maintenant' : lang === 'th' ? 'ปลดล็อกเลย' : 'Mở khóa ngay';
    const clicked = abEval(`(() => { const b = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes(${JSON.stringify(unlockWord)})); if (!b) return 'NO-BTN'; b.click(); return 'CLICKED'; })()`);
    check(`${tag} S $4.99 主按钮可点`, clicked === 'CLICKED', String(clicked));
    if (!has('[data-testid="sandbox-cashier"] [data-testid="sandbox-pay-btn"]', 20000)) { check(`${tag} S 沙盒收银台唤起`, false, String(abEval('document.body.innerText.slice(0, 160)')).replace(/\n/g, ' / ')); continue; }
    check(`${tag} S 沙盒收银台唤起`, true);
    click('[data-testid="sandbox-pay-btn"]');
    const reportReady = waitForFn(() => {
      const t = abEval(REPORT);
      return typeof t === 'string' && t.length > 200 ? t : null;
    }, 240000, 1500);
    if (!reportReady) { check(`${tag} S 解锁后报告渲染`, false, String(abEval('document.body.innerText.slice(0, 300)')).replace(/\n/g, ' / ')); shot(`e156-${vname}-${lang}-FAIL.png`); continue; }
    const bizText = waitForFn(() => { const t = abEval(REPORT); return typeof t === 'string' && (t.match(/【/g) || []).length >= 4 ? t : null; }, 60000, 1500) || reportReady;
    const modules = (bizText.match(/【[^】\n]{1,40}】/g) || []);
    check(`${tag} S 商道报告四模块【】原地展开`, modules.length >= 4, `${modules.length} 模块 / ${bizText.length} 字：${modules.join(' ')}`);
    check(`${tag} S 称呼融入报告`, hasName(bizText, names[0], lang) && hasName(bizText, names[1], lang), hasName(bizText, names[0], lang) && hasName(bizText, names[1], lang) ? '' : `缺 ${[names[0], names[1]].filter((n) => !hasName(bizText, n, lang)).join('/')}`);
    check(`${tag} S 报告零占位/零对象串`, !/undefined|\[object Object\]|\bnull\b/.test(bizText));
    if (lang !== 'zh') {
      const cjk = (bizText.match(/[\u4e00-\u9fff]/g) || []).length + (lang !== 'th' ? (bizText.match(/[\u0e00-\u0e7f]/g) || []).length : 0);
      check(`${tag} S 单语纯净（零 CJK${lang !== 'th' ? '/零泰文' : ''}）`, cjk === 0, `异种字符=${cjk}`);
    }
    check(`${tag} S 解锁后切换坐标条在场`, has('[data-testid="e156-scene-switch"]', 8000));
    check(`${tag} S 年鉴按钮随商道换词`, abEval(BTN_HAS(resAlmanacBtn(lang, 'business', 'monthly'))) === true && abEval(BTN_HAS(resAlmanacBtn(lang, 'business', 'yearly'))) === true);
    check(`${tag} S 付费墙已退场`, !/\$4[.,]99/.test(String(abEval(`(document.querySelector('[data-testid="compat-once-metal-frame"]') || document.body).innerText.slice(0, 400)`))));

    /* 坐标卡（商道） */
    const cardOk = waitForFn(() => abEval(`(() => { const c = document.querySelector('[data-testid="ks-hcard-result"]'); const i = c && c.querySelector('[data-testid="ks-hcard-preview-img"]'); return !!(i && i.complete && i.naturalWidth > 0); })()`) === true ? true : null, 30000);
    check(`${tag} S 坐标卡预览非空`, cardOk);
    check(`${tag} S 坐标卡主题＝商道`, abEval(`(document.querySelector('[data-testid="ks-hcard-result"]') || { dataset: {} }).dataset.scene`) === 'business');
    overflowChecks(`${tag} S 报告＋坐标卡（商道）`, abEval(OVERFLOW));
    if (desktop ? lang === 'zh' || lang === 'fr' : lang === 'th' || lang === 'fr') {
      shot(`e156-${vname}-${lang}-report-business.png`); shotsTaken.add(`report-${vname}`);
    }
    pngChecks(`${tag} S 商道`, grabPng(`e156-card-${vname}-${lang}-business`, '[data-testid="goldcard-export-cta"]'), 'kindredsouls-business-card');

    /* 原地切换：挚友 */
    click('[data-testid="e156-pills-result-friendship"]');
    const frText = waitForFn(() => { const t = abEval(REPORT); return typeof t === 'string' && (t.match(/【/g) || []).length >= 4 && t !== bizText ? t : null; }, 240000, 1500);
    if (!frText) { check(`${tag} S 切挚友 ⇒ 报告重生`, false, 'TIMEOUT'); shot(`e156-${vname}-${lang}-FAIL-friendship.png`); continue; }
    const fMods = (frText.match(/【[^】\n]{1,40}】/g) || []);
    check(`${tag} S 切挚友 ⇒ 四模块重生（同一权益零二次收费；模块标题军令钦定同名，正文必换）`, fMods.length >= 4 && frText !== bizText, `${fMods.join(' ')}`);
    check(`${tag} S 挚友报告称呼融入＋零占位`, hasName(frText, names[0], lang) && hasName(frText, names[1], lang) && !/undefined|\[object Object\]/.test(frText));
    check(`${tag} S 挚友四维标签`, eq(abEval(DIMS), resT(lang, 'dim_friendship')));
    overflowChecks(`${tag} S 报告（挚友）`, abEval(OVERFLOW));
    pngChecks(`${tag} S 挚友`, grabPng(`e156-card-${vname}-${lang}-friendship`, '[data-testid="goldcard-export-cta"]'), 'kindredsouls-friendship-card');
    if (desktop ? lang === 'en' : lang === 'fr') { shot(`e156-${vname}-${lang}-report-friendship.png`); shotsTaken.add(`friend-${vname}`); }

    /* 原地切换：情爱（既有链回归；桌面全语种） */
    if (desktop) {
      click('[data-testid="e156-pills-result-romance"]');
      const roText = waitForFn(() => { const t = abEval(REPORT); return typeof t === 'string' && t.length > 150 && t !== frText ? t : null; }, 240000, 1500);
      check(`${tag} S 切情爱 ⇒ 既有报告链回归`, !!roText, roText ? `${roText.length} 字` : 'TIMEOUT');
      check(`${tag} S 情爱四维＝既有标签`, eq(abEval(DIMS), DIM_ROMANCE[lang]), `${abEval(DIMS)}`);
      check(`${tag} S 情爱年鉴按钮复原（非场景词条）`, abEval(BTN_HAS(resAlmanacBtn(lang, 'business', 'monthly'))) === false);
    }
  }
}

/* ════ 退役路由 ════ */
ab('set', 'viewport', '1440', '900');
for (const p of ['/resonance', '/invite/abc123def456']) {
  freshOpen(`${BASE}${p}?lang=zh`);
  const rs = abEval(`document.querySelectorAll('[data-testid^="rs-"]').length`);
  const txt = String(abEval(`(document.body.innerText || '').slice(0, 600)`));
  check(`退役路由 ${p} 零专属页元件`, rs === 0, `rs-*=${rs}`);
  check(`退役路由 ${p} 不落「邀请函」中转文案`, !txt.includes('邀请函') && !txt.includes('认领'));
  check(`退役路由 ${p} 应用仍渲染（非白屏）`, txt.trim().length > 20, txt.replace(/\n/g, ' / ').slice(0, 120));
}

/* ════ 财富报告页底部坐标卡（wealth_abundance） ════ */
for (const [w, h, vname, langs2] of [['1440', '900', 'desktop', ['zh', 'en']], ['390', '844', 'mobile', ['zh', 'th']]]) {
  ab('set', 'viewport', w, h);
  for (const lang of (QUICK ? ['zh'] : langs2)) {
    const tag = `${vname}/${lang} W`;
    freshOpen(`${BASE}/wealth/report?birth=1976-12-03&time=12:00&birthLat=22.5431&birthLon=114.0579&birthTz=Asia/Shanghai&lang=${lang}&free_access=1`);
    const cardOk = waitForFn(() => abEval(`(() => { const c = document.querySelector('[data-testid="ks-hcard-wealth"]'); const i = c && c.querySelector('[data-testid="ks-hcard-preview-img"]'); return !!(i && i.complete && i.naturalWidth > 0); })()`) === true ? true : null, 240000, 1500);
    check(`${tag} 财富报告底部坐标卡预览非空`, cardOk, cardOk ? '' : String(abEval('document.body.innerText.slice(0, 200)')).replace(/\n/g, ' / '));
    if (!cardOk) { shot(`e156-${vname}-${lang}-wealth-FAIL.png`); continue; }
    check(`${tag} 坐标卡主题＝wealth_abundance`, abEval(`document.querySelector('[data-testid="ks-hcard-wealth"]').dataset.scene`) === 'wealth_abundance');
    overflowChecks(`${tag} 财富坐标卡`, abEval(OVERFLOW));
    shot(`e156-${vname}-${lang}-wealth-card.png`); shotsTaken.add(`wealth-${vname}`);
    pngChecks(`${tag} W`, grabPng(`e156-card-${vname}-${lang}-wealth`), 'kindredsouls-wealth-card');
  }
}
ab('close', '--all');

// QUICK 子集（desktop/zh＋mobile/th）不经过挚友页命名场景（desktop/en＋mobile/fr）⇒ 该模式下不强求挚友截图；全量模式清单不变
const KEY_SHOTS = ['input-desktop', 'input-mobile', 'paywall-desktop', 'paywall-mobile', 'report-desktop', 'report-mobile', 'friend-desktop', 'friend-mobile', 'wealth-desktop', 'wealth-mobile'].filter((k) => !(QUICK && k.startsWith('friend-')));
check('关键截图齐（输入页/付费墙/报告/挚友/财富 × 双视口）', KEY_SHOTS.every((k) => shotsTaken.has(k)), [...shotsTaken].join(' | '));

const pass = results.filter((r) => r.ok).length;
const fails = results.filter((r) => !r.ok);
console.log(`\n🧪 E156 真页验收：${pass}/${results.length} 通过`);
for (const f of fails) console.log(`   ❌ ${f.name}`);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ base: BASE, pass, total: results.length, results }, null, 2));
process.exit(pass === results.length ? 0 : 1);
