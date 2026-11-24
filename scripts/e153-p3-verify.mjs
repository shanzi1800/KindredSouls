/**
 * e153-p3-verify.mjs —— E153-P3「尾层纠偏」军令真页验收（一次性，不入编 test:astro）
 * 军令核心（盖脸事故纠偏·死数字焊死）：
 *   ① 严锁图层：computed zIndex(tail) < zIndex(body) < zIndex(blink)（尾 z1/本体 z2/眨眼 z3）。
 *   ② 缩正比例：尾层宽 ∈ [1.04, 1.16]×本体宽（军令锁 1.05W–1.15W，CSS 108%）。
 *   ③ 中心侧契约：Milo tailCenterX < bodyCenterX（尾向左）；Sophia tailCenterX > bodyCenterX（尾向右）。
 *   ④ 尾层 bbox 与按钮文字 bbox 零重叠（静止＋摆动采样 4 帧，全 6 语种）。
 *   ⑤ 尾底轻贴按钮上沿（视觉零悬空）＋尾根藏臀（origin 落本体横向范围内且下半身低位）。
 *   ⑥ P1 守成复验：水平严格居中 |Δ|≤4px＋宠底贴沿 [−2,+6]＋宠盒宽 98 契约。
 * 引擎：agent-browser；目标 KS_BASE（默认本地 dist 静态服务 4180，产线可切换）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e153-p3-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = process.env.KS_BASE || 'http://127.0.0.1:4180';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const VIEWPORTS = [['1440', '900', 'desktop'], ['390', '844', 'mobile']];
const PETS = [['Milo', '大壮', 'buddy', 0.6368], ['Sophia', '阿胖', 'girlfriend', 0.3597]];

let AB_SESSION = `kse153p3-${process.pid}-${Date.now().toString(36)}`;
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
           tl: r2(tr.top), tw: r2(tr.width), tleft: r2(tr.left), tright: r2(tr.right) };
})()`;

/* ② 图层序＋几何探针（computed zIndex 硬断言——军令钦定形制） */
const Z_ORDER_PROBE = `(() => {
  const pet = document.querySelector('.ks-fam-breakout');
  const tail = pet && pet.querySelector('.ks-fam-tail');
  const body = pet && pet.querySelector('.ks-fam-img');
  const blink = pet && pet.querySelector('.ks-fam-img-blink');
  if (!pet || !tail || !body) return { missing: true };
  const zt = Number(getComputedStyle(tail).zIndex);
  const zb = Number(getComputedStyle(body).zIndex);
  const zk = blink ? Number(getComputedStyle(blink).zIndex) : -1;
  const r2 = (x) => Math.round(x * 10) / 10;
  const tr = tail.getBoundingClientRect(), br = body.getBoundingClientRect();
  return { zt, zb, zk,
           tw: r2(tr.width), tleft: r2(tr.left), tcenter: r2(tr.left + tr.width / 2), tbot: r2(tr.bottom), ttop: r2(tr.top),
           bleft: r2(br.left), bcenter: r2(br.left + br.width / 2), bw: r2(br.width), btop: r2(br.top), bh: r2(br.height) };
})()`;

/* ③ 静止帧探针：禁动画（等 transition 0.45s 落定）后量；origin 用显式百分比参数
   （血训：computed transformOrigin 返回 px 形制，parseFloat 假装百分比＝假数据） */
const TAIL_STILL_PROBE = `(() => {
  const tail = document.querySelector('.ks-fam-breakout .ks-fam-tail');
  if (!tail) return { missing: true };
  tail.style.animation = 'none';
  'STILL';
})()`;
const TAIL_RESTORE = `(() => {
  const tail = document.querySelector('.ks-fam-breakout .ks-fam-tail');
  if (tail) tail.style.animation = '';
  'RESTORED';
})()`;
/* ④ 摆动帧零重叠采样探针（动画运行中：尾 bbox 与文字 bbox 逐帧相交判定） */
const TAIL_FRAME_PROBE = `(() => {
  const pet = document.querySelector('.ks-fam-breakout');
  const tail = pet && pet.querySelector('.ks-fam-tail');
  const btn = document.querySelector('.landing-start-btn');
  if (!pet || !tail || !btn) return { missing: true };
  const tr = tail.getBoundingClientRect();
  const rng = document.createRange();
  rng.selectNodeContents(btn);
  const xr = rng.getBoundingClientRect();
  const overlap = !(tr.right < xr.left || tr.left > xr.right || tr.bottom < xr.top || tr.top > xr.bottom);
  const r2 = (x) => Math.round(x * 10) / 10;
  return { overlap, tbot: r2(tr.bottom), tleft: r2(tr.left), tright: r2(tr.right),
           xleft: r2(xr.left), xright: r2(xr.right), xtop: r2(xr.top) };
})()`;

ab('close', '--all');

const shotsTaken = new Set();
for (const [w, h, vname] of VIEWPORTS) {
  ab('set', 'viewport', w, h);
  const desktop = vname === 'desktop';
  for (const [pet, seedName, seedMode, cx] of PETS) {
    const oxFrac = pet === 'Milo' ? '0.88' : '0.12';   /* 军令 origin：Milo 88% / Sophia 12% */
    for (const lang of LANGS) {
      ab('open', `${BASE}/?lang=${lang}&free_access=1`);
      waitFor('.landing-start-btn');
      seedFamiliar(seedName, seedMode);
      ab('reload'); waitFor('.landing-start-btn');
      const petReady = waitFor('.ks-fam-breakout', 8000);
      const tag = `${vname}/${pet}/${lang}`;
      if (!petReady) { check(`${tag} 灵宠在位`, false, 'NO-PET'); continue; }
      sleep(800);
      /* ⑥ P1 守成三查 */
      const m = abEval(PET_PROBE);
      if (!m || m.missing) { check(`${tag} 宠位探针`, false, JSON.stringify(m)); continue; }
      const petCenterX = m.pl + cx * m.pw;
      const ctaCenterX = m.bl + m.bw / 2;
      const dx = Math.round((petCenterX - ctaCenterX) * 10) / 10;
      check(`${tag} P1 守成·水平严格居中 |Δ|≤4px`, Math.abs(dx) <= 4, `Δ=${dx}px`);
      check(`${tag} P1 守成·贴沿落座 [−2,+6]`, m.pb >= m.bt - 2 && m.pb <= m.bt + 6, `压边=${Math.round((m.pb - m.bt) * 10) / 10}px`);
      check(`${tag} P1 守成·宠盒宽 98px 契约`, m.pw >= 96 && m.pw <= 100, `w=${m.pw}px`);
      /* ①②③⑤ 图层序＋比例＋静止几何（禁动画→量→复原） */
      const z = abEval(Z_ORDER_PROBE);
      if (!z || z.missing) { check(`${tag} 图层探针`, false, JSON.stringify(z)); continue; }
      check(`${tag} 严锁图层·zIndex(tail)<zIndex(body)`, z.zt < z.zb, `z=${z.zt}/${z.zb}`);
      check(`${tag} 严锁图层·zIndex(body)<zIndex(blink)`, z.zb < z.zk, `z=${z.zb}/${z.zk}`);
      abEval(TAIL_STILL_PROBE);
      sleep(700);
      const s = abEval(Z_ORDER_PROBE);
      abEval(TAIL_RESTORE);
      if (!s || s.missing) { check(`${tag} 尾层静止探针`, false, JSON.stringify(s)); continue; }
      const widthRatio = Math.round((s.tw / s.bw) * 100) / 100;
      check(`${tag} 尾宽缩正 [1.04,1.16]×本体（军令 1.05W–1.15W）`, widthRatio >= 1.04 && widthRatio <= 1.16, `ratio=${widthRatio}`);
      const sideGap = Math.round((s.tcenter - s.bcenter) * 10) / 10;
      check(`${tag} 中心侧契约（${pet === 'Milo' ? '尾左' : '尾右'}）`, pet === 'Milo' ? sideGap < -10 : sideGap > 10, `tailC−bodyC=${sideGap}px`);
      const press = Math.round((s.tbot - m.bt) * 10) / 10;
      check(`${tag} 尾底轻贴按钮上沿 [−4,+6]（零悬空）`, s.tbot >= m.bt - 4 && s.tbot <= m.bt + 6, `压边=${press}px`);
      const rootX = s.tleft + Number(oxFrac) * s.tw;
      check(`${tag} 尾根藏臀·origin 落本体横向范围`, rootX >= s.bleft - 3 && rootX <= s.bleft + s.bw + 3, `rootX=${Math.round(rootX)}px (body ${Math.round(s.bleft)}~${Math.round(s.bleft + s.bw)})`);
      const rootY = s.ttop + 0.85 * (s.tbot - s.ttop);
      check(`${tag} 尾根藏臀·origin 下半身低位（≥0.5H）`, rootY >= s.btop + 0.5 * s.bh, `originY=${Math.round((rootY - s.btop) / Math.max(s.bh, 1) * 100)}%H`);
      /* ④ 静止帧零重叠＋摆动采样 4 帧 */
      const st = abEval(TAIL_FRAME_PROBE);
      let anyOverlap = !!(st && st.overlap);
      for (let i = 0; i < 4; i++) {
        sleep(850);
        const f = abEval(TAIL_FRAME_PROBE);
        if (f && !f.missing && f.overlap) anyOverlap = true;
      }
      check(`${tag} 尾 bbox 与按钮文字 bbox 零重叠（静止＋4 帧）`, !anyOverlap, anyOverlap ? 'OVERLAP' : 'clean');
      const wantShot = desktop && lang === 'zh';
      const wantShot2 = desktop && pet === 'Milo' && lang === 'fr';
      const wantShot3 = !desktop && lang === 'fr' && pet === 'Sophia';
      if (wantShot || wantShot2 || wantShot3) {
        shot(`e153p3-${vname}-${lang}${pet === 'Sophia' ? '-sophia' : ''}.png`);
        shotsTaken.add(tag);
      }
    }
  }
}
check('关键截图齐（zh 双宠/fr 桌面/fr-mobile）', shotsTaken.size >= 4, [...shotsTaken].join(' | '));
ab('close', '--all');

const pass = results.filter((r) => r.ok).length;
console.log(`\n🧪 E153-P3 真页验收：${pass}/${results.length} 通过`);
process.exit(pass === results.length ? 0 : 1);
