/**
 * e152-verify.mjs —— E152 军令真页验收（一次性，不入编 test:astro）
 * 军令刀四核心：真实 DOM 盒模型防遮挡断言——灵宠 boundingBox（含尾层）
 *   与主按钮「文字节点」（Range 精确盒）零像素重叠；
 *   双视口（390×844 / 1440×900）× 六语（zh/en/fr/es/th/vi）× 双宠（Milo/Sophia）。
 * 附加：桌面 CTA 丝缎香槟金 computed style 验真＋径向托底在场＋条件间距类在位。
 * 引擎：agent-browser 独立会话冷启动；目标：本地 dist 静态服务
 *   （KS_BASE 覆写，默认 http://127.0.0.1:4180；产线复验可指 https://kindredsouls.online）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e152-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = process.env.KS_BASE || 'http://127.0.0.1:4180';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const VIEWPORTS = [['390', '844', 'mobile'], ['1440', '900', 'desktop']];
const PETS = [['Milo', '大壮', 'buddy'], ['Sophia', '阿胖', 'girlfriend']];

let AB_SESSION = `kse152-${process.pid}-${Date.now().toString(36)}`;
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

/* 真页量测探针：灵宠盒（含尾层/本体）＋按钮文字节点 Range 精确盒＋computed style */
const PROBE = `(() => {
  const btn = document.querySelector('.landing-start-btn');
  const fam = document.querySelector('[data-testid="familiar-breakout"]');
  if (!btn || !fam) return { missing: true, btn: !!btn, fam: !!fam };
  const fr = fam.getBoundingClientRect();
  const tail = fam.querySelector('.ks-fam-tail');
  const img = fam.querySelector('.ks-fam-img');
  const tr = tail ? tail.getBoundingClientRect() : null;
  const ir = img ? img.getBoundingClientRect() : null;
  const range = document.createRange();
  range.selectNodeContents(btn);
  const tb = range.getBoundingClientRect();
  const br = btn.getBoundingClientRect();
  const cs = getComputedStyle(btn);
  const sub = document.querySelector('.landing-container .subtitle');
  const ttl = document.querySelector('.landing-container .title');
  const sr = sub ? sub.getBoundingClientRect() : null;
  const r2 = (x) => (x == null ? null : Math.round(x * 10) / 10);
  return {
    famTop: r2(fr.top), famBottom: r2(fr.bottom),
    tailBottom: r2(tr ? tr.bottom : null), imgBottom: r2(ir ? ir.bottom : null),
    textTop: r2(tb.top), textBottom: r2(tb.bottom),
    btnTop: r2(br.top), btnW: r2(br.width), btnH: r2(br.height),
    subBottom: r2(sr ? sr.bottom : null),
    bg: String(cs.backgroundImage).slice(0, 120),
    color: cs.color,
    subColor: sub ? getComputedStyle(sub).color : null,
    titleColor: ttl ? getComputedStyle(ttl).color : null,
    titleSize: ttl ? getComputedStyle(ttl).fontSize : null,
    ridden: document.body.classList.contains('ks-fam-ridden'),
  };
})()`;

ab('close', '--all');

const shotsTaken = new Set();
for (const [w, h, vname] of VIEWPORTS) {
  ab('set', 'viewport', w, h);
  const desktop = vname === 'desktop';
  for (const lang of LANGS) {
    for (const [pet, seedName, seedMode] of PETS) {
      ab('open', `${BASE}/?lang=${lang}&free_access=1`);
      waitFor('.landing-start-btn');
      seedFamiliar(seedName, seedMode);
      ab('reload'); waitFor('.landing-start-btn'); sleep(900);
      const m = abEval(PROBE);
      const tag = `${vname}/${lang}/${pet}`;
      if (!m || m.missing) { check(`${tag} 探针在位`, false, JSON.stringify(m)); continue; }
      const famMax = Math.max(m.famBottom ?? -1, m.tailBottom ?? -1, m.imgBottom ?? -1);
      // 军令核心断言：灵宠底缘（含尾）≤ 按钮文字节点顶缘（零像素重叠）
      check(`${tag} 灵宠底缘≤文字顶缘（零遮挡）`, famMax <= m.textTop, `famMax=${famMax} textTop=${m.textTop} gap=${Math.round((m.textTop - famMax) * 10) / 10}`);
      check(`${tag} 灵宠不压副标`, m.subBottom == null || m.famTop >= m.subBottom, `famTop=${m.famTop} subBottom=${m.subBottom}`);
      check(`${tag} 条件间距类在位（ks-fam-ridden）`, m.ridden === true);
      if (desktop) {
        check(`${tag} CTA 缎面香槟金 computed`, String(m.bg).includes('240, 217, 156') && String(m.bg).includes('217, 180, 91'), m.bg);
        check(`${tag} CTA 曜石黑字 computed`, m.color === 'rgb(24, 19, 36)', m.color);
        check(`${tag} CTA min-width 248 生效`, m.btnW >= 248, `btnW=${m.btnW}`);
        // 🥂 E152-刀二：Hero computed 真值（防 .input-page 老款 specificity 压制回潮）
        check(`${tag} 副标象牙金 computed`, String(m.subColor).includes('246, 240, 228'), m.subColor);
        check(`${tag} 主标象牙金白 computed`, m.titleColor === 'rgb(250, 244, 232)', m.titleColor);
        check(`${tag} 主标 clamp≥30px computed`, parseFloat(m.titleSize) >= 30, m.titleSize);
      }
      const wantShot = (lang === 'zh' && ((desktop && pet === 'Milo') || (!desktop && pet === 'Sophia')))
        || (lang === 'en' && desktop && pet === 'Milo') || (lang === 'th' && !desktop && pet === 'Milo');
      if (wantShot) { shot(`e152-${vname}-${lang}-${pet.toLowerCase()}.png`); shotsTaken.add(tag); }
    }
  }
}
check('关键截图齐（zh双视口＋en/th 补充）', shotsTaken.size >= 4, [...shotsTaken].join(' | '));
ab('close', '--all');

const pass = results.filter((r) => r.ok).length;
console.log(`\n🧪 E152 真页验收：${pass}/${results.length} 通过`);
process.exit(pass === results.length ? 0 : 1);
