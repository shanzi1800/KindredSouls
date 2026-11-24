/**
 * e153-p2-verify.mjs —— E153-P2「平摊翘尾」军令真页验收（一次性，不入编 test:astro）
 * 军令核心（军师新素材 942×460 横构图双宠镜像）：
 *   ① 尾层在位＋平摊宽度契约：尾层宽 ≈ 170%×宠盒宽（±10%）。
 *   ② 尾沿按钮上沿平摊（静止帧）：尾 bbox 底 ∈ [btnTop−2, btnTop+8]（贴沿轻压）。
 *   ③ 任意帧零遮挡六语文字（摆动帧采样 3 帧取最坏）：尾 bbox 底 max ≤ 文字 bbox 顶 + 0.5px。
 *   ④ 尾根锚臀部低位（严禁与耳齐平）：transform-origin 点 y ≥ 宠盒顶 + 0.45×宠盒高。
 *   ⑤ P1 守成复验：水平严格居中 |Δ|≤4px＋宠底贴沿 [−2,+6]＋宠盒宽 98 契约。
 * 引擎：agent-browser；目标 KS_BASE（默认本地 dist 静态服务 4180，产线可切换）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e153-p2-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = process.env.KS_BASE || 'http://127.0.0.1:4180';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const VIEWPORTS = [['1440', '900', 'desktop'], ['390', '844', 'mobile']];
const PETS = [['Milo', '大壮', 'buddy', 0.6368], ['Sophia', '阿胖', 'girlfriend', 0.3597]];

let AB_SESSION = `kse153p2-${process.pid}-${Date.now().toString(36)}`;
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

/* ① P1 守成探针（宠盒/按钮/文字 Range 精确量，e153-p1 同款形制） */
const PET_PROBE = `(() => {
  const pet = document.querySelector('.ks-fam-breakout');
  const btn = document.querySelector('.landing-start-btn');
  if (!pet || !btn) return { missing: true };
  const pr = pet.getBoundingClientRect(), br = btn.getBoundingClientRect();
  const rng = document.createRange();
  rng.selectNodeContents(btn);
  const tr = rng.getBoundingClientRect();
  const r2 = (x) => Math.round(x * 10) / 10;
  return { ip: pet.dataset.ip || null,
           pl: r2(pr.left), pw: r2(pr.width), pb: r2(pr.bottom), pt: r2(pr.top),
           bl: r2(br.left), bw: r2(br.width), bt: r2(br.top),
           tl: r2(tr.top), tw: r2(tr.width) };
})()`;

/* ② 尾层静止探针：禁动画（等 transition 0.45s 落定）量静止 bbox＋origin 点（显式百分比
   避 computed transformOrigin px/百分比混形），量毕复原 */
const TAIL_STILL_PROBE = `(() => {
  const pet = document.querySelector('.ks-fam-breakout');
  const tail = pet && pet.querySelector('.ks-fam-tail');
  if (!tail) return { missing: true };
  tail.style.animation = 'none';
  'STILL';
})()`;
const TAIL_MEASURE = (oyPct) => `(() => {
  const pet = document.querySelector('.ks-fam-breakout');
  const tail = pet.querySelector('.ks-fam-tail');
  const pr = pet.getBoundingClientRect(), tr2 = tail.getBoundingClientRect();
  const originY = tr2.top + ${oyPct} * tr2.height;
  const r2 = (x) => Math.round(x * 10) / 10;
  return { tw: r2(tr2.width), tb: r2(tr2.bottom), tt: r2(tr2.top),
           pw: r2(pr.width), pth: r2(pr.height), pt: r2(pr.top),
           oyRatio: Math.round((originY - pr.top) / Math.max(pr.height, 1) * 1000) / 1000 };
})()`;
const TAIL_RESTORE = `(() => {
  const tail = document.querySelector('.ks-fam-breakout .ks-fam-tail');
  if (tail) tail.style.animation = '';
  'RESTORED';
})()`;
/* ③ 摆动帧采样探针（动画运行中，量当前渲染 bbox 与文字顶） */
const TAIL_FRAME_PROBE = `(() => {
  const pet = document.querySelector('.ks-fam-breakout');
  const tail = pet.querySelector('.ks-fam-tail');
  const btn = document.querySelector('.landing-start-btn');
  const rng = document.createRange();
  rng.selectNodeContents(btn);
  const tr = rng.getBoundingClientRect();
  const tb = tail.getBoundingClientRect().bottom;
  const r2 = (x) => Math.round(x * 10) / 10;
  return { tb: r2(tb), tl: r2(tr.top) };
})()`;

ab('close', '--all');

const shotsTaken = new Set();
for (const [w, h, vname] of VIEWPORTS) {
  ab('set', 'viewport', w, h);
  const desktop = vname === 'desktop';
  for (const [pet, seedName, seedMode, cx] of PETS) {
    const oyPct = pet === 'Milo' ? '0.615' : '0.613';
    for (const lang of LANGS) {
      ab('open', `${BASE}/?lang=${lang}&free_access=1`);
      waitFor('.landing-start-btn');
      seedFamiliar(seedName, seedMode);
      ab('reload'); waitFor('.landing-start-btn');
      const petReady = waitFor('.ks-fam-breakout', 8000);
      const tag = `${vname}/${pet}/${lang}`;
      if (!petReady) { check(`${tag} 灵宠在位`, false, 'NO-PET'); continue; }
      sleep(800);
      /* ⑤ P1 守成三查 */
      const m = abEval(PET_PROBE);
      if (!m || m.missing) { check(`${tag} 宠位探针`, false, JSON.stringify(m)); continue; }
      const petCenterX = m.pl + cx * m.pw;
      const ctaCenterX = m.bl + m.bw / 2;
      const dx = Math.round((petCenterX - ctaCenterX) * 10) / 10;
      check(`${tag} P1 守成·水平严格居中 |Δ|≤4px`, Math.abs(dx) <= 4, `Δ=${dx}px`);
      check(`${tag} P1 守成·贴沿落座 [−2,+6]`, m.pb >= m.bt - 2 && m.pb <= m.bt + 6, `压边=${Math.round((m.pb - m.bt) * 10) / 10}px`);
      check(`${tag} P1 守成·宠盒宽 98px 契约`, m.pw >= 96 && m.pw <= 100, `w=${m.pw}px`);
      /* ①②④ 尾层静止帧量（禁动画→等过渡→量→复原） */
      abEval(TAIL_STILL_PROBE);
      sleep(700);
      const t = abEval(TAIL_MEASURE(oyPct));
      abEval(TAIL_RESTORE);
      if (!t || t.missing) { check(`${tag} 尾层探针`, false, JSON.stringify(t)); continue; }
      const widthRatio = Math.round((t.tw / t.pw) * 100) / 100;
      check(`${tag} 尾层平摊宽 170% 契约`, widthRatio >= 1.53 && widthRatio <= 1.87, `ratio=${widthRatio}`);
      const tailOverlap = Math.round((t.tb - m.bt) * 10) / 10;
      check(`${tag} 尾沿按钮上沿平摊（静止 [−2,+3] 轻触）`, t.tb >= m.bt - 2 && t.tb <= m.bt + 3, `压边=${tailOverlap}px`);
      check(`${tag} 尾根锚臀部低位（≥0.45H）`, t.oyRatio >= 0.45, `originY=${t.oyRatio}H`);
      /* ③ 任意帧零遮挡：摆动采样 3 帧（恢复动画后 4.8s alternate 周期内散布）取最坏 */
      let maxBottom = -Infinity, textTop = 0;
      for (let i = 0; i < 4; i++) {
        sleep(850);
        const f = abEval(TAIL_FRAME_PROBE);
        if (f && !f.missing) { maxBottom = Math.max(maxBottom, f.tb); textTop = f.tl; }
      }
      const worstGap = Math.round((textTop - maxBottom) * 10) / 10;
      check(`${tag} 任意帧零遮挡文字（4 帧最坏）`, maxBottom <= textTop + 0.5, `最坏间距=${worstGap}px`);
      const wantShot = desktop && lang === 'zh';
      const wantShot2 = desktop && pet === 'Milo' && (lang === 'en' || lang === 'fr');
      const wantShot3 = !desktop && lang === 'fr' && pet === 'Sophia';
      if (wantShot || wantShot2 || wantShot3) {
        shot(`e153p2-${vname}-${lang}${pet === 'Sophia' ? '-sophia' : ''}.png`);
        shotsTaken.add(tag);
      }
    }
  }
}
check('关键截图齐（zh 双宠/en/fr/fr-mobile）', shotsTaken.size >= 5, [...shotsTaken].join(' | '));
ab('close', '--all');

const pass = results.filter((r) => r.ok).length;
console.log(`\n🧪 E153-P2 真页验收：${pass}/${results.length} 通过`);
process.exit(pass === results.length ? 0 : 1);
