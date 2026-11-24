/**
 * e153-p1-verify.mjs —— E153-P1 热补丁军令真页验收（一次性，不入编 test:astro）
 * 军令核心（主公实拍两病灶）：灵宠精准居中＋贴合按钮上缘「落座」。
 *   ① 水平居中硬断言：|petCenterX − ctaCenterX| ≤ 4px（双视口×双朝向×六语）；
 *     petCenterX = 宠盒.left + PIL 可见轮廓 cx × 宠盒.width（Milo 0.6368 / Sophia 0.3597）。
 *   ② 文字零遮挡硬断言：宠盒底缘（= 裁切盒可见爪底）≤ 按钮文字节点 bbox 顶 + 0.5px。
 *   ③ 贴沿落座：btnTop − 2 ≤ petBottom ≤ btnTop + 6（零悬空、爪尖轻压边框）。
 *   ④ 体型锁 sanity：宠盒宽 ∈ [96, 100]（E82 98px 契约）。
 * 引擎：agent-browser；目标 KS_BASE（默认本地 dist 静态服务 4180，产线可切换）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e153-p1-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = process.env.KS_BASE || 'http://127.0.0.1:4180';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const VIEWPORTS = [['1440', '900', 'desktop'], ['390', '844', 'mobile']];
const PETS = [['Milo', '大壮', 'buddy', 0.6368], ['Sophia', '阿胖', 'girlfriend', 0.3597]];

let AB_SESSION = `kse153p1-${process.pid}-${Date.now().toString(36)}`;
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

/* 宠位探针：宠盒/按钮/按钮文字节点（Range 精确量，e152 同款形制） */
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
           pl: r2(pr.left), pw: r2(pr.width), pb: r2(pr.bottom),
           bl: r2(br.left), bw: r2(br.width), bt: r2(br.top),
           tl: r2(tr.top), tw: r2(tr.width) };
})()`;

ab('close', '--all');

const shotsTaken = new Set();
for (const [w, h, vname] of VIEWPORTS) {
  ab('set', 'viewport', w, h);
  const desktop = vname === 'desktop';
  for (const [pet, seedName, seedMode, cx] of PETS) {
    for (const lang of LANGS) {
      ab('open', `${BASE}/?lang=${lang}&free_access=1`);
      waitFor('.landing-start-btn');
      seedFamiliar(seedName, seedMode);
      ab('reload'); waitFor('.landing-start-btn');
      const petReady = waitFor('.ks-fam-breakout', 8000);
      const tag = `${vname}/${pet}/${lang}`;
      if (!petReady) { check(`${tag} 灵宠在位`, false, 'NO-PET'); continue; }
      sleep(800);
      const m = abEval(PET_PROBE);
      if (!m || m.missing) { check(`${tag} 宠位探针`, false, JSON.stringify(m)); continue; }
      const petCenterX = m.pl + cx * m.pw;
      const ctaCenterX = m.bl + m.bw / 2;
      const dx = Math.round((petCenterX - ctaCenterX) * 10) / 10;
      /* ① 军令硬断言：水平严格居中 ≤4px */
      check(`${tag} 水平严格居中 |Δ|≤4px`, Math.abs(dx) <= 4, `Δ=${dx}px (pet=${Math.round(petCenterX*10)/10} cta=${Math.round(ctaCenterX*10)/10})`);
      /* ③ 贴沿落座：零悬空（petBottom ≥ btnTop−2）＋爪尖轻压（≤ btnTop+6） */
      const overlap = Math.round((m.pb - m.bt) * 10) / 10;
      check(`${tag} 贴沿落座（零悬空/轻压≤6px）`, m.pb >= m.bt - 2 && m.pb <= m.bt + 6, `压边=${overlap}px`);
      /* ② 军令硬断言：文字零遮挡（宠底 ≤ 文字 bbox 顶） */
      const gapText = Math.round((m.tl - m.pb) * 10) / 10;
      check(`${tag} 文字零重叠（宠底≤文字顶）`, m.pb <= m.tl + 0.5, `间距=${gapText}px`);
      /* ④ 体型锁 sanity */
      check(`${tag} 宠盒宽 98px 契约`, m.pw >= 96 && m.pw <= 100, `w=${m.pw}px`);
      const wantShot = desktop && lang === 'zh' && (pet === 'Milo' || pet === 'Sophia');
      const wantShot2 = desktop && pet === 'Milo' && (lang === 'en' || lang === 'fr');
      const wantShot3 = !desktop && lang === 'fr' && pet === 'Sophia';
      if (wantShot || wantShot2 || wantShot3) {
        shot(`e153p1-${vname}-${lang}${pet === 'Sophia' ? '-sophia' : ''}.png`);
        shotsTaken.add(`${tag}`);
      }
    }
  }
}
check('关键截图齐（zh 双宠/en/fr/fr-mobile）', shotsTaken.size >= 5, [...shotsTaken].join(' | '));
ab('close', '--all');

const pass = results.filter((r) => r.ok).length;
console.log(`\n🧪 E153-P1 真页验收：${pass}/${results.length} 通过`);
process.exit(pass === results.length ? 0 : 1);
