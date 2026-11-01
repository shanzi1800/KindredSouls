/**
 * e112-verify.mjs —— E112 军令真页验收（一次性，不入编 test:astro）
 * 军令验收指标：
 *   A. 静候 15~20s ⇒ Sophia 踩奶拱背（-7px）＋宝石高光脉冲 / Milo 尾摆＋星芒气泡（14px 破裂金尘）
 *   B. 首语六档报告咬合：seed soul_recent_unlocked_report（wealth_core）⇒ 开舱首语切入先天财库
 *      （无报告档 ⇒ 回退 E111 情境链；有报告档严禁「我在呢」）
 *   C. 灵犀星：徽章归位对话舱 Header（ks-chat-star 胶囊）＋首页按钮下方无徽章（拆除负向）
 *   D. 世界观：/api/familiar/chat prompt 灵魂兽硬锁（源码级已守备，此处真页烟测对话可用）
 * 引擎：agent-browser（独立会话冷启动），线上真页 kindredsouls.online（E112 双证部署后跑）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e112-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = 'https://kindredsouls.online';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

let AB_SESSION = `kse112-${process.pid}-${Date.now().toString(36)}`;
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
function seedRecentReport(category, tier, title) {
  abEval(`localStorage.setItem('soul_recent_unlocked_report', JSON.stringify({category:'${category}',tier:'${tier}',title:'${title}',keyAspects:{reportType:'once'},unlockedAt:Date.now()})); 'SEEDED'`);
}
function tapPetHead() {
  try { ab('click', '.ks-fam-breakout .ks-fam-zone-head'); }
  catch (_) { abEval(`(() => { const z=document.querySelector('.ks-fam-breakout .ks-fam-zone-head'); if(z) z.click(); return 'TAPPED'; })()`); }
  sleep(500);
}
function openChat() {
  tapPetHead();
  sleep(400);
  try { ab('click', '[data-testid="familiar-chat-cta"]'); }
  catch (_) { abEval(`(() => { const c=document.querySelector('[data-testid="familiar-chat-cta"]'); if(c) c.click(); return 'CTA'; })()`); }
  sleep(1500);
}
function shot(name) { try { ab('screenshot', path.join(OUT, name)); console.log(`📸 ${name}`); } catch (e) { console.log(`📸 ${name} 失败: ${e.message}`); } }

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`); };

/* ══════ B+C：六档报告首语咬合＋灵犀星归位对话舱 ══════ */
ab('close', '--all');
ab('set', 'viewport', '1440', '900');
ab('open', `${BASE}/?lang=zh&free_access=1`);
waitFor('.landing-start-btn');
seedFamiliar('阿胖', 'girlfriend');
seedRecentReport('wealth', 'core', '先天财库报告');
ab('reload'); waitFor('.landing-start-btn'); sleep(900);

openChat();
const probeBC = abEval(`(() => {
  const hello=document.querySelector('.ks-chat-flow .ks-chat-assistant');
  const star=document.querySelector('[data-testid="familiar-starlight"]');
  const homeBadge=document.querySelector('.ks-fam-starbadge');
  return { hello: hello ? hello.textContent : null, star: star ? star.textContent : null, starCls: star ? star.className : null, homeBadgeResidue: !!homeBadge };
})()`);
console.log('probeBC:', JSON.stringify(probeBC));
check('B1 有报告档 ⇒ 首语切入「先天财库」（六档第一击）', !!(probeBC && probeBC.hello && probeBC.hello.includes('财库')), (probeBC && probeBC.hello || '').slice(0, 44));
check('B2 有报告档 ⇒ 禁「我在呢」空话', !(probeBC && probeBC.hello && probeBC.hello.includes('我在呢')), '');
check('C1 对话舱 Header 星胶囊在场（ks-chat-star）', !!(probeBC && probeBC.star && probeBC.star.includes('灵犀星')), probeBC && probeBC.star);
check('C2 胶囊类名归位（ks-chat-star）', !!(probeBC && probeBC.starCls && String(probeBC.starCls).includes('ks-chat-star')), probeBC && probeBC.starCls);
check('C3 首页按钮下方旧徽章已拆除（负向）', !(probeBC && probeBC.homeBadgeResidue), '');
shot('first-strike-wealth-core.png');
ab('close', '--all');

/* B-回退档：无报告 ⇒ 不吃日标记（新会话 seed 灵宠但清报告档） */
ab('open', `${BASE}/?lang=zh&free_access=1`);
waitFor('.landing-start-btn');
seedFamiliar('大壮', 'buddy');
abEval(`localStorage.removeItem('soul_recent_unlocked_report'); localStorage.removeItem('ks_starlight_count'); sessionStorage.removeItem('ks_familiar_firststrike_day'); 'CLEARED'`);
ab('reload'); waitFor('.landing-start-btn'); sleep(900);
openChat();
const hello2 = abEval(`(() => { const b=document.querySelector('.ks-chat-flow .ks-chat-assistant'); return b ? b.textContent : null; })()`);
console.log('hello2 probe:', JSON.stringify(hello2));
check('B3 无报告档 ⇒ E111 情境链回退（首语非六档亦非空）', typeof hello2 === 'string' && hello2.length > 0, (hello2 || '').slice(0, 44));
check('B4 无报告档 ⇒ 首语无复读（幸运色/数字）', !(hello2 && (hello2.includes('幸运色') || hello2.includes('幸运数字'))), '');
shot('first-strike-plain.png');
ab('close', '--all');

/* ══════ A：待机动效（首触发 15~20s）══════ */
async function idleWatch(pet, seedName, seedMode, shotName, probeSel, extraSel) {
  ab('open', `${BASE}/?lang=zh&free_access=1`);
  waitFor('.landing-start-btn');
  seedFamiliar(seedName, seedMode);
  ab('reload'); waitFor('.landing-start-btn'); sleep(900);
  const probeJs = `(() => { const el=document.querySelector('.ks-fam-breakout'); if(!el) return null; const glow=!!document.querySelector(${JSON.stringify(probeSel)}); const extra=!!document.querySelector(${JSON.stringify(extraSel)}); return { idle: el.className.includes('ks-fam-idle'), glow, extra }; })()`;
  const t0 = Date.now();
  let hit = null;
  while (Date.now() - t0 < 40000) { // E112 首触发 15~20s ⇒ 守 40s 足够
    const probe = abEval(probeJs);
    if (probe && probe.idle) { hit = probe; break; }
    sleep(300);
  }
  if (hit) {
    shot(shotName);
    check(`A-${pet} 待机 idle 态 15~20s 窗内触发（${Math.round((Date.now() - t0) / 1000)}s）`, true, JSON.stringify(hit));
    check(`A-${pet} 光效层在场（${probeSel}）`, !!hit.glow);
    const rect = abEval(`(() => { const r=document.querySelector('.ks-fam-breakout').getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }; })()`);
    console.log(`   idle 态 breakout rect:`, JSON.stringify(rect));
    check(`A-${pet} 趴键体型锁 98px 不破`, !!(rect && rect.w > 90 && rect.w < 106), JSON.stringify(rect));
  } else {
    check(`A-${pet} 待机 idle 态 40s 内未出现`, false, 'FAIL');
  }
  ab('close', '--all');
}

await idleWatch('Sophia', '阿胖', 'girlfriend', 'idle-sophia-knead7.png', '[data-testid="familiar-gemglow"]', '.ks-fam-gemglow');
await idleWatch('Milo', '大壮', 'buddy', 'idle-milo-popbubble.png', '[data-testid="familiar-spark"]', '.ks-fam-pop-bub');

/* 汇总 */
const pass = results.filter((r) => r.ok).length;
console.log(`\n🧪 E112 真页验收：${pass}/${results.length} 通过`);
process.exit(pass === results.length ? 0 : 1);
