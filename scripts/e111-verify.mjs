/**
 * e111-verify.mjs —— E111 军令真页验收（一次性，不入编 test:astro）
 * 军令验收三指标：
 *   A. PC 端静候 35~45s ⇒ Sophia 踩奶拱背＋宝石粉金微光（gemglow）/ Milo 尾尖轻扬＋星芒粒子
 *   B. 开舱首语：无「幸运色/幸运数字」复读，按情境分支（恋人甜句/慰句/plain）
 *   C. 灵犀星：首点 +1（飘字＋徽章＋localStorage.ks_starlight_count）
 * 引擎：agent-browser（独立会话冷启动），线上真页 kindredsouls.online（E111 已双证部署）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e111-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = 'https://kindredsouls.online';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

let AB_SESSION = `kse111-${process.pid}-${Date.now().toString(36)}`;
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
function tapPetHead() {
  try { ab('click', '.ks-fam-breakout .ks-fam-zone-head'); }
  catch (_) { abEval(`(() => { const z=document.querySelector('.ks-fam-breakout .ks-fam-zone-head'); if(z) z.click(); return 'TAPPED'; })()`); }
  sleep(500);
}
function shot(name) { try { ab('screenshot', path.join(OUT, name)); console.log(`📸 ${name}`); } catch (e) { console.log(`📸 ${name} 失败: ${e.message}`); } }

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`); };

/* ══════ Sophia 场 ══════ */
ab('close', '--all');
ab('set', 'viewport', '1440', '900');
ab('open', `${BASE}/?lang=zh&free_access=1`);
waitFor('.landing-start-btn');
seedFamiliar('阿胖', 'girlfriend');
ab('reload'); waitFor('.landing-start-btn'); sleep(900);

/* 验收 C：灵犀星首点 +1 */
tapPetHead();
const starGain = abEval(`(() => { const f=document.querySelector('[data-testid="familiar-star-gain"]'); const b=document.querySelector('[data-testid="familiar-starlight"]'); const s=localStorage.getItem('ks_starlight_count'); return { float: f ? f.textContent : null, badge: b ? b.textContent : null, store: s }; })()`);
console.log('starGain probe:', JSON.stringify(starGain));
check('C1 灵犀星 +1 飘字在场', !!(starGain && starGain.float && starGain.float.includes('+1')), starGain && starGain.float);
check('C2 灵宠身侧徽章在场', !!(starGain && starGain.badge && starGain.badge.includes('灵犀羁绊')), starGain && starGain.badge);
let storeOk = false;
try { const s = JSON.parse((starGain && starGain.store) || 'null'); storeOk = s && Number.isInteger(s.count) && s.count >= 1 && typeof s.day === 'string'; } catch (_) {}
check('C3 ks_starlight_count 形状 {count, day} 且 count≥1', storeOk, starGain && starGain.store);
shot('star-gain-sophia.png');
sleep(2300); // 飘字消散后再验首语

/* 验收 B：开舱首语（无复读） */
try { ab('click', '[data-testid="familiar-chat-cta"]'); }
catch (_) { abEval(`(() => { const c=document.querySelector('[data-testid="familiar-chat-cta"]'); if(c) c.click(); return 'CTA'; })()`); }
sleep(1500);
const hello = abEval(`(() => { const b=document.querySelector('.ks-chat-flow .ks-chat-assistant'); return b ? b.textContent : null; })()`);
console.log('hello probe:', JSON.stringify(hello));
check('B1 首语无「幸运色/幸运数字」复读', !(hello && (hello.includes('幸运色') || hello.includes('幸运数字') || /lucky (color|number)/i.test(hello || ''))), (hello || '').slice(0, 40));
check('B2 首语在场（非空）', typeof hello === 'string' && hello.length > 0, (hello || '').slice(0, 40));
shot('first-strike-sophia.png');
ab('close', '--all');

/* 验收 A：待机活体动效（Sophia 踩奶拱背＋gemglow；Milo 尾尖轻扬＋spark） */
async function idleWatch(pet, seedName, seedMode, shotName, probeSel) {
  ab('open', `${BASE}/?lang=zh&free_access=1`);
  waitFor('.landing-start-btn');
  seedFamiliar(seedName, seedMode);
  ab('reload'); waitFor('.landing-start-btn'); sleep(900);
  const probeJs = `(() => { const el=document.querySelector('.ks-fam-breakout'); if(!el) return null; const glow=!!document.querySelector(${JSON.stringify(probeSel)}); return { idle: el.className.includes('ks-fam-idle'), glow: glow }; })()`;
  const t0 = Date.now();
  let hit = null;
  while (Date.now() - t0 < 90000) { // 35~45s 触发＋缓冲，最多守 90s
    const probe = abEval(probeJs);
    if (probe && probe.idle) { hit = probe; break; }
    sleep(400);
  }
  if (hit) {
    shot(shotName);
    check(`A-${pet} 待机 idle 态出现（${Math.round((Date.now() - t0) / 1000)}s 触发）`, true, JSON.stringify(hit));
    check(`A-${pet} 光效层在场（${probeSel}）`, !!hit.glow);
    // idle 窗内量几何不变式：趴键 translateY 不漂移（breakout rect 与非态一致性由 CSS 断言守备，此处补运行时 rect 抽样）
    const rect = abEval(`(() => { const r=document.querySelector('.ks-fam-breakout').getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }; })()`);
    console.log(`   idle 态 breakout rect:`, JSON.stringify(rect));
  } else {
    check(`A-${pet} 待机 idle 态 90s 内未出现`, false, 'FAIL');
  }
  ab('close', '--all');
}

await idleWatch('Sophia', '阿胖', 'girlfriend', 'idle-sophia-knead.png', '[data-testid="familiar-gemglow"]');
await idleWatch('Milo', '大壮', 'buddy', 'idle-milo-spark.png', '[data-testid="familiar-spark"]');

/* 汇总 */
const pass = results.filter((r) => r.ok).length;
console.log(`\n🧪 E111 真页验收：${pass}/${results.length} 通过`);
process.exit(pass === results.length ? 0 : 1);
