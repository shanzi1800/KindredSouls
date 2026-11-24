/**
 * e153-blade3-verify.mjs —— E153-刀三 军令真页验收（一次性，不入编 test:astro）
 * 军令刀三核心：悬浮气泡卡防溢出＋清 Lucky 残留＋聊天顶栏状态无截断。
 *   ① 气泡容器 rect：宽 ∈ [223, 314]（min 224 / max min(312,86vw)）；
 *   ② 所有子元素 right ≤ card.right 且 bottom ≤ card.bottom（按钮零破框）；
 *   ③ 卡片 textContent 六语无 Lucky 词（Lucky number/color/幸运数字/幸运色 全语种表）；
 *   ④ 六语新文案在场（顶标/按钮一/按钮二 军令定稿表逐字）；
 *   ⑤ 状态栏（对话舱开舱后）scrollWidth ≤ clientWidth（flex-wrap 折行根治截断）。
 * 引擎：agent-browser；目标 KS_BASE（默认本地 dist 静态服务 4180）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e153-blade3-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = process.env.KS_BASE || 'http://127.0.0.1:4180';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const VIEWPORTS = [['1440', '900', 'desktop'], ['390', '844', 'mobile']];
const PETS = [['Milo', '大壮', 'buddy'], ['Sophia', '阿胖', 'girlfriend']];

/* 军令「悬浮气泡卡 6 语种轻奢替换定稿表」逐字（验收基准） */
const TOP = { zh: '✦ 今日坐标校准', en: '✦ Daily Alignment', fr: '✦ Alignement du Jour', es: '✦ Calibración de Hoy', th: '✦ พิกัดประจำวัน', vi: '✦ Hiệu Chỉnh Hôm Nay' };
const CTA1 = { zh: '✦ 今日情绪天象', en: '✦ Mood Compass', fr: "✦ Boussole d'Humeur", es: '✦ Brújula Emocional', th: '✦ เข็มทิศอารมณ์วันนี้', vi: '✦ La Bàn Tâm Trạng' };
const CTA2 = { zh: '✦ 与 TA 聊聊', en: '✦ Talk to Me', fr: '✦ Me parler', es: '✦ Hablar conmigo', th: '✦ คุยกับฉัน', vi: '✦ Trò chuyện cùng tôi' };
/* Lucky 旧词全语种残留表（E152 漏清点——军令额外抓包 1） */
const LUCKY = ['Lucky number', 'Lucky color', "Today's Fortune", '幸运数字', '幸运色', '今日运势锦囊',
  'Numéro porte-bonheur', 'Couleur porte-bonheur', 'Fortune du Jour',
  'Número de suerte', 'Color de suerte', 'Fortuna de Hoy',
  'เลขนำโชค', 'สีนำโชค', 'ดวงวันนี้', 'Số may mắn', 'Màu may mắn', 'Vận May Hôm Nay'];

let AB_SESSION = `kse153b3-${process.pid}-${Date.now().toString(36)}`;
function ab(...args) {
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
const waitFor = (sel, ms = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (abEval(`!!document.querySelector(${JSON.stringify(sel)})`) === true) return true; } catch (_) { /* retry */ }
    sleep(400);
  }
  return false;
};
function seedFamiliar(name, mode) {
  abEval(`localStorage.setItem('ks_familiar', JSON.stringify({profile:{name:'${name}',relation_mode:'${mode}',sun:'狮子座',moon:'双子座',asc:'天蝎座'},triad:{sun:'狮子座'},persisted:true,adoptedAt:new Date().toISOString(),chartSig:'${SIG}'})); 'SEEDED'`);
}
function shot(name) { try { ab('screenshot', path.join(OUT, name)); console.log(`📸 ${name}`); } catch (e) { console.log(`📸 ${name} 失败: ${e.message}`); } }

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`${ok ? '✅' : '❌'} ${name}${detail !== undefined && detail !== '' ? ' — ' + detail : ''}`); };

/* 气泡探针：卡片 rect＋子元素越界检测＋文本三件套 */
const BUBBLE_PROBE = `(() => {
  const card = document.querySelector('.ks-fam-bubble');
  if (!card) return { missing: true };
  const cr = card.getBoundingClientRect();
  const cs = getComputedStyle(card);
  let overflow = [];
  for (const el of card.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > cr.right + 0.5 || r.bottom > cr.bottom + 0.5 || r.left < cr.left - 0.5) {
      overflow.push(el.className + ' r=' + Math.round(r.right) + ' vs ' + Math.round(cr.right));
    }
  }
  const b1 = card.querySelector('[data-testid="pouch-open"]');
  const b2 = card.querySelector('[data-testid="familiar-chat-cta"]');
  const r2 = (x) => (x == null ? null : Math.round(x * 10) / 10);
  const b2r = b2 ? b2.getBoundingClientRect() : null;
  return {
    w: r2(cr.width), h: r2(cr.height),
    pad: cs.padding, minW: cs.minWidth, maxW: cs.maxWidth,
    overflow,
    text: card.textContent,
    b1Text: b1 ? b1.textContent : null,
    b2Text: b2 ? b2.textContent : null,
    b2W: b2r ? r2(b2r.width) : null,
    b2Wraps: b2 ? (b2.scrollHeight > b2.clientHeight + 1 ? 'CLIP' : 'OK') : null,
  };
})()`;

/* 状态栏探针：scrollWidth vs clientWidth（flex-wrap 折行后应相等） */
const STATUS_PROBE = `(() => {
  const st = document.querySelector('.ks-chat-status');
  if (!st) return { missing: true };
  const cs = getComputedStyle(st);
  return {
    sw: st.scrollWidth, cw: st.clientWidth,
    wrap: cs.flexWrap, rowGap: cs.rowGap,
    text: (st.textContent || '').trim().slice(0, 60),
  };
})()`;

ab('close', '--all');

const shotsTaken = new Set();
for (const [w, h, vname] of VIEWPORTS) {
  ab('set', 'viewport', w, h);
  const desktop = vname === 'desktop';
  for (const lang of LANGS) {
    /* 单宠抽样（Milo 桌面/Sophia 移动——覆盖双宠双视口矩阵面） */
    const [pet, seedName, seedMode] = desktop ? PETS[0] : PETS[1];
    ab('open', `${BASE}/?lang=${lang}&free_access=1`);
    waitFor('.landing-start-btn');
    seedFamiliar(seedName, seedMode);
    ab('reload'); waitFor('.landing-start-btn'); sleep(1200);
    /* 点灵宠头部 ⇒ 气泡（完整漏斗：禁直开） */
    abEval(`(document.querySelector('.ks-fam-zone-head') || {}).click ? document.querySelector('.ks-fam-zone-head').click() : document.querySelector('.ks-fam-zone-head').dispatchEvent(new MouseEvent('click',{bubbles:true})); 'CLICKED'`);
    const appeared = waitFor('.ks-fam-bubble', 4000);
    const tag = `${vname}/${lang}`;
    if (!appeared) { check(`${tag} 气泡出现（点头部触发）`, false, 'NO-BUBBLE'); continue; }
    const m = abEval(BUBBLE_PROBE);
    if (!m || m.missing) { check(`${tag} 气泡探针`, false, JSON.stringify(m)); continue; }
    check(`${tag} 气泡宽度防溢出（223~314 + 86vw 钳制）`,
      m.w >= 223 && m.w <= Math.min(314, Math.round(0.86 * Number(w)) + 2), `w=${m.w}`);
    check(`${tag} 子元素零越界（right/bottom ≤ 卡缘）`, (m.overflow || []).length === 0, (m.overflow || []).join(' | ') || `b2W=${m.b2W} wraps=${m.b2Wraps}`);
    const luckyHit = LUCKY.filter((s) => (m.text || '').includes(s));
    check(`${tag} 卡片零 Lucky 旧词（六语全表）`, luckyHit.length === 0, luckyHit.join(',') || 'clean');
    check(`${tag} 顶标新文案（${TOP[lang]}）`, (m.text || '').includes(TOP[lang]), (m.text || '').slice(0, 40));
    check(`${tag} 按钮一 ${CTA1[lang]}`, m.b1Text === CTA1[lang], String(m.b1Text));
    check(`${tag} 按钮二 ${CTA2[lang]}`, m.b2Text === CTA2[lang], String(m.b2Text));
    /* 桌面：六语开舱验状态栏折行（点气泡按钮二开舱） */
    if (desktop) {
      abEval(`document.querySelector('.ks-fam-bubble [data-testid="familiar-chat-cta"]').click(); 'OPEN'`);
      const chatReady = waitFor('.ks-chat-status', 6000);
      if (chatReady) {
        sleep(600);
        const st = abEval(STATUS_PROBE);
        check(`${tag} 状态栏无截断（scrollW ≤ clientW）`, st && st.sw <= st.cw + 1, `sw=${st.sw} cw=${st.cw} wrap=${st.wrap}`);
        check(`${tag} 状态栏 flex-wrap 生效`, st && /wrap/.test(String(st.wrap)), `wrap=${st.wrap} text=${st && st.text}`);
        abEval(`document.querySelector('.ks-chat-close') ? document.querySelector('.ks-chat-close').click() : document.querySelector('[data-testid="chat-close"]')?.click(); 'CLOSE'`);
        sleep(500);
      } else {
        check(`${tag} 状态栏在位（开舱）`, false, 'NO-STATUS');
      }
    }
    const wantShot = (lang === 'zh' || lang === 'en' || lang === 'fr') && ((desktop && pet === 'Milo') || (!desktop && lang === 'fr'));
    if (wantShot) { shot(`e153b3-${vname}-${lang}.png`); shotsTaken.add(tag); }
  }
}
check('关键截图齐（zh/en/fr）', shotsTaken.size >= 3, [...shotsTaken].join(' | '));
ab('close', '--all');

const pass = results.filter((r) => r.ok).length;
console.log(`\n🧪 E153-刀三 真页验收：${pass}/${results.length} 通过`);
process.exit(pass === results.length ? 0 : 1);
