/**
 * e153-p4-verify.mjs —— E153-P4「强制落地」终结军令真页验收（一次性，不入编 test:astro）
 * 军令硬断言（1440×900＋390×844，双朝向 Milo/Sophia，全 6 语种）：
 *   ① petBox.bottom ∈ [ctaTop, ctaTop+6]（实现值 bottom:-3px ⇒ 落点 ctaTop+3）
 *   ② |petCenterX − ctaCenterX| ≤ 4（E153-P1 严格居中守成）
 *   ③ petBox.bottom < ctaTextBox.top（爪不压按钮文字）
 * 追加守备（P4 真凶＝尾巴悬空）：
 *   ④ 尾底贴沿：静止帧 tailRect.bottom ≈ petBox.bottom（bottom:0 与爪线齐平）
 *   ⑤ 图盒＝实像素盒：裁后图自然尺寸 720×550 / 720×530，img 盒底＝宠盒底（不再溢出 36px 透明死区）
 *   ⑥ 实像素零遮挡：摆动 5 帧（-3deg…+4deg）尾图 alpha>60 落入按钮文字 bbox 的像素数 === 0
 *      ——动画帧 computed matrix 按 CSS 变换链正向映射尾图 alpha（含祖先 breathe 合成）
 *      （替代 P3 的旋转 bbox 保守判据：bbox 四角是空的）。
 *   ⑦ P3 图层序守成：computed zIndex(tail) < zIndex(body) < zIndex(blink)
 * 引擎：agent-browser；目标 KS_BASE（默认本地 dist 静态服务 4180，产线可切换）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e153-p4-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = process.env.KS_BASE || 'http://127.0.0.1:4180';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

const LANGS = (process.env.KS_LANGS || 'zh,en,fr,es,th,vi').split(',');
const VIEWPORTS = (process.env.KS_VP || '1440x900desktop,390x844mobile').split(',').map((v) => { const m = /^(\d+)x(\d+)([a-z]+)$/.exec(v); return [m[1], m[2], m[3]]; });
const PETS = [
  { ip: 'Milo', name: '大壮', mode: 'buddy', cx: 0.6368, nat: [720, 550] },
  { ip: 'Sophia', name: '阿胖', mode: 'girlfriend', cx: 0.3597, nat: [720, 530] },
];
const FRAMES = [0, 1200, 2400, 3600, 4800];

let AB_SESSION = `kse153p4-${process.pid}-${Date.now().toString(36)}`;
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

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail !== undefined && detail !== '' ? ' — ' + detail : ''}`);
};

/* ①~⑦ 合并探针：几何＋静止尾底＋图盒＋实像素采样＋图层序 */
const PROBE = `(() => {
  const pet = document.querySelector('.ks-fam-breakout');
  const btn = document.querySelector('.landing-start-btn');
  if (!pet || !btn) return { missing: true };
  const tail = pet.querySelector('.ks-fam-tail');
  const body = pet.querySelector('.ks-fam-img');
  const blink = pet.querySelector('.ks-fam-img-blink');
  const r2 = (x) => Math.round(x * 100) / 100;
  const box = (e) => { const r = e.getBoundingClientRect(); return { l: r2(r.left), t: r2(r.top), b: r2(r.bottom), w: r2(r.width), h: r2(r.height) }; };
  const pr = box(pet), br = box(btn);
  const rng = document.createRange(); rng.selectNodeContents(btn);
  const tr = rng.getBoundingClientRect();
  const text = { l: r2(tr.left), t: r2(tr.top), r: r2(tr.right), b: r2(tr.bottom) };

  /* ⑦ 图层序（computed） */
  const z = (e) => parseInt(getComputedStyle(e).zIndex, 10);
  const zIndex = { tail: z(tail), body: z(body), blink: z(blink) };

  /* ④ 静止帧尾底（animation:none）＋⑤ 图盒 */
  const all = pet.getAnimations({ subtree: true });
  const tailAnims = tail.getAnimations();
  tailAnims.forEach((a) => { a.pause(); });
  const breathe = pet.querySelector('.ks-fam-breathe');
  const brAnims = breathe.getAnimations(); brAnims.forEach((a) => a.pause());
  const restBreathe = breathe.style.animation; breathe.style.animation = 'none';
  const restTail = tail.style.animation; tail.style.animation = 'none';
  const st = box(tail), sb = box(body), sp = box(pet);
  breathe.style.animation = restBreathe; tail.style.animation = restTail;
  const staticGeo = {
    tailBottom: st.b, tailHeight: st.h, tailWidth: st.w,
    bodyBottom: sb.b, bodyHeight: sb.h, petBottom: sp.b, petHeight: sp.h, petWidth: sp.w,
    nat: [body.naturalWidth, body.naturalHeight], blinkNat: [blink.naturalWidth, blink.naturalHeight],
    tailComplete: tail.complete && tail.naturalWidth > 0,
  };

  /* ⑥ 实像素采样：每帧把尾动画 seek 到 FRAMES（其余动画置于呼吸峰档），读 computed matrix，
     按 CSS 变换链正向映射：呼吸层 scale(s)·rotate(φ)（origin 50% 88%）→ 尾层 rotate(θ)（origin 军令锚）。
     尾图 alpha>60 的源像素逐点映射到视口，统计落入按钮文字 bbox 的像素数与最低实像素行。 */
  const frames = ${JSON.stringify(FRAMES)};
  const samples = [];
  all.forEach((a) => a.pause());
  const stB = box(breathe);
  let src = null;
  if (tail.complete && tail.naturalWidth > 0) {
    const cv = document.createElement('canvas'); cv.width = tail.naturalWidth; cv.height = tail.naturalHeight;
    const cx = cv.getContext('2d'); cx.drawImage(tail, 0, 0);
    src = cx.getImageData(0, 0, cv.width, cv.height);
  }
  if (src) {
    const mat = (str) => { const m = /matrix\\(([^)]+)\\)/.exec(str || ''); return m ? m[1].split(',').map(Number) : [1, 0, 0, 1, 0, 0]; };
    const originX = parseFloat(getComputedStyle(tail).transformOrigin);
    for (const f of frames) {
      tailAnims.forEach((a) => { a.currentTime = f; });
      all.forEach((a) => { if (!tailAnims.includes(a)) { try { a.currentTime = (a.effect.getTiming().duration || 1000) * 0.5; } catch (_) { /* noop */ } } });
      const bm = mat(getComputedStyle(breathe).transform), tm = mat(getComputedStyle(tail).transform);
      const bOx = stB.l + stB.w / 2, bOy = stB.t + stB.h * 0.88;
      const B = (x, y) => {
        const qx = x - bOx, qy = y - bOy;
        return [bOx + bm[0] * qx + bm[2] * qy + bm[4], bOy + bm[1] * qx + bm[3] * qy + bm[5]];
      };
      const tOx0 = st.l + originX, tOy0 = st.t + st.h * 0.85;
      const [tOx, tOy] = B(tOx0, tOy0);
      const theta = Math.atan2(tm[1], tm[0]);
      let lowest = -1e9, inText = 0, opaque = 0;
      for (let v = 0; v < src.height; v++) {
        const y0 = st.t + ((v + 0.5) / src.height) * st.h;
        for (let u = 0; u < src.width; u++) {
          if (src.data[(v * src.width + u) * 4 + 3] <= 60) continue;
          opaque++;
          const [bx, by] = B(st.l + ((u + 0.5) / src.width) * st.w, y0);
          const dx = bx - tOx, dy = by - tOy;
          const px = tOx + Math.cos(theta) * dx - Math.sin(theta) * dy;
          const py = tOy + Math.sin(theta) * dx + Math.cos(theta) * dy;
          if (py > lowest) lowest = py;
          if (px > text.l && px < text.r && py > text.t && py < text.b) inText++;
        }
      }
      samples.push({ f, theta: r2(theta * 180 / Math.PI), lowest: r2(lowest), inText, opaque,
        diag: { bm: bm.join(','), tm: tm.join(','), st: [st.l, st.t, st.w, st.h], stB: [stB.l, stB.t, stB.w, stB.h], src: [src.width, src.height], ox: originX, playState: tailAnims.map((a) => a.playState).join('/') } });
    }
    tailAnims.forEach((a) => { a.currentTime = 0; a.play(); });
    all.forEach((a) => { if (!tailAnims.includes(a)) a.play(); });
  }
  return {
    ip: pet.classList.contains('ks-fam-milo') ? 'Milo' : 'Sophia',
    pet: pr, btn: br, text,
    rawCenterX: r2(pr.l + pr.w / 2), petLeft: pr.l, petW: pr.w,
    zIndex, staticGeo, samples,
  };
})()`;

let shotN = 0;
async function main() {
  let shotN = 0;
  for (const [vw, vh, vname] of VIEWPORTS) {
    for (const lang of LANGS) {
      ab('open', `${BASE}/?free_access=1&lang=${lang}`);
      ab('set', 'viewport', vw, vh);
      for (const pet of PETS) {
        abEval(`localStorage.setItem('ks_familiar', JSON.stringify({profile:{name:'${pet.name}',relation_mode:'${pet.mode}',sun:'狮子座',moon:'双子座',asc:'天蝎座'},triad:{sun:'狮子座'},persisted:true,adoptedAt:new Date().toISOString(),chartSig:'${SIG}'})); 'SEEDED'`);
        abEval('location.reload(); "R"');
        const ready = waitFor('.ks-fam-breakout', 15000);
        const tag = `${vname}-${lang}-${pet.ip}`;
        if (!ready) { check(`${tag} 灵宠挂载`, false, 'timeout'); continue; }
        // 等图片解码完成（naturalWidth 就绪）后再探针
        for (let i = 0; i < 20; i++) {
          const nat = abEval(`(()=>{const i=document.querySelector('.ks-fam-breakout .ks-fam-img');return i&&i.naturalWidth>0&&document.querySelector('.ks-fam-breakout .ks-fam-tail').naturalWidth>0?1:0})()`);
          if (nat === 1) break; sleep(300);
        }
        const r = abEval(PROBE);
        if (!r || r.missing) { check(`${tag} 探针`, false, 'missing'); continue; }
        const ctaTop = r.btn.t;
        const visCenterX = Math.round((r.petLeft + pet.cx * r.petW) * 100) / 100;
        const ctaCenterX = Math.round((r.btn.l + r.btn.w / 2) * 100) / 100;
        const dBottom = Math.round((r.pet.b - ctaTop) * 100) / 100;
        const dX = Math.round(Math.abs(visCenterX - ctaCenterX) * 100) / 100;
        const g = r.staticGeo;
        check(`${tag} ① 宠盒底落按钮上沿 [ctaTop, ctaTop+6]`, r.pet.b >= ctaTop - 0.01 && r.pet.b <= ctaTop + 6, `Δ=${dBottom}px`);
        check(`${tag} ② 可见重心居中 |ΔX|≤4`, dX <= 4, `ΔX=${dX}px`);
        check(`${tag} ③ 宠盒底不压按钮文字`, r.pet.b < r.text.t, `petBottom−textTop=${(r.pet.b - r.text.t).toFixed(2)}px`);
        check(`${tag} ④ 静止尾底与爪线齐平`, Math.abs(g.tailBottom - g.petBottom) <= 0.6 && g.tailBottom >= ctaTop - 0.01 && g.tailBottom <= ctaTop + 6,
          `tail−pet=${(g.tailBottom - g.petBottom).toFixed(2)}px`);
        check(`${tag} ⑤ 图盒＝实像素盒（自然尺寸＋img 盒底＝宠盒底）`,
          g.nat[0] === pet.nat[0] && g.nat[1] === pet.nat[1] && g.blinkNat[0] === pet.nat[0] && g.blinkNat[1] === pet.nat[1] && Math.abs(g.bodyBottom - g.petBottom) <= 1 && Math.abs(g.bodyHeight - g.petHeight) <= 1,
          `nat=${g.nat.join('×')} blink=${g.blinkNat.join('×')} bodyH=${g.bodyHeight} petH=${g.petHeight}`);
        const bad = (r.samples || []).filter((s) => !s || !Number.isFinite(s.theta) || !Number.isFinite(s.lowest) || s.lowest < -1e8 || !(s.opaque > 1000) || s.inText !== 0);
        const lowest = Math.max(...(r.samples || []).map((s) => s.lowest ?? -1e9));
        check(`${tag} ⑥ 摆动 5 帧尾实像素零压文字`, r.samples.length === FRAMES.length && bad.length === 0,
          (process.env.KS_DEBUG ? ` diag=${JSON.stringify((r.samples || [])[1] || (r.samples || [])[0]).slice(0, 700)} | ` : '') + `θ=[${(r.samples || []).map((s) => s.theta ?? 'NA').join(',')}°] inText=[${(r.samples || []).map((s) => s.inText ?? 'NA').join(',')}] 尾最低实像素−按钮顶=[${(r.samples || []).map((s) => s.lowest === undefined ? 'NA' : (s.lowest - ctaTop).toFixed(1)).join(',')}]px`);
        check(`${tag} ⑦ 图层序 tail<body<blink`, r.zIndex.tail < r.zIndex.body && r.zIndex.body < r.zIndex.blink, JSON.stringify(r.zIndex));
        if (lang === 'zh') {
          try { ab('screenshot', path.join(OUT, `e153p4-${tag}.png`)); shotN++; } catch (_) { /* noop */ }
        }
      }
    }
  }
  const pass = results.filter((x) => x.ok).length;
  console.log(`\n📊 E153-P4 真页验收：${pass}/${results.length} 通过（${BASE}）`);
  fs.writeFileSync(path.join(OUT, `results-${process.pid}.json`), JSON.stringify(results, null, 2));
  try { ab('close'); } catch (_) { /* noop */ }
  process.exit(pass === results.length ? 0 : 1);
}
main().catch((e) => { console.error('FATAL', e.message); process.exit(2); });
