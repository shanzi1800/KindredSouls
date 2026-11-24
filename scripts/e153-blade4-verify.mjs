/**
 * e153-blade4-verify.mjs —— E153-刀四 军令真页验收（一次性，不入编 test:astro）
 * 军令刀四核心：P2 今日情绪优先权焊死＋六语单语纯净锁。
 *   ① P2 优先权：注入当日 ks_mood_of_day=radiant（不点主 CTA）→点灵宠→气泡
 *      「与TA聊聊」开舱 ⇒ 首句必须命中 E150_P2_RECALL.radiant 六语逐字
 *      （严禁 helloDaily 通用星图问候压盖）；六语遍历。
 *   ② 纯净锁：zh 开舱首句落档（用户零消息）→关舱→LangModal 切 fr/en/es/th/vi
 *      →重开舱 ⇒ 首句按新语种重水合（only-hello 路径），零 CJK 汉字残留
 *      （/[\u4e00-\u9fff]/ 严格为 false，昵称已剔除）。
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(REPO, 'dev-artifacts', 'e153-blade4-verify');
fs.mkdirSync(OUT, { recursive: true });
const AB_BIN = process.env.KS_AB_BIN || '/Users/apple/.workbuddy/binaries/node/workspace/node_modules/.bin';
const BASE = process.env.KS_BASE || 'http://127.0.0.1:4180';
const SIG = '1976-12-03|12:00|22.5431|114.0579|Asia/Shanghai';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
/* E150_P2_RECALL.radiant 六语逐字（队列真源 companionTopicQueue.mjs） */
const P2_RADIANT = {
  zh: '早上那份明亮的好心情，还亮着吗？我一直替你收着这份暖呢。',
  en: 'That bright mood from this morning — is it still glowing? I\u2019ve been keeping its warmth safe for you.',
  fr: 'Cette humeur lumineuse de ce matin — brille-t-elle encore ? J\u2019en garde la chaleur pour toi.',
  es: 'Ese ánimo luminoso de esta mañana, ¿sigue brillando? He guardado su calidez para ti.',
  th: 'อารมณ์สดใสตอนเช้า ยังสว่างอยู่ไหม ฉันเก็บความอบอุ่นนั้นไว้ให้เธอนะ',
  vi: 'Tinh thần rạng ngời sáng nay còn sáng không? Mình vẫn cất giữ hơi ấm đó giúp bạn đấy.',
};

let AB_SESSION = `kse153b4-${process.pid}-${Date.now().toString(36)}`;
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
const waitFor = (sel, ms = 12000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (abEval(`!!document.querySelector(${JSON.stringify(sel)})`) === true) return true; } catch (_) { /* retry */ }
    sleep(400);
  }
  return false;
};
function seedFamiliar() {
  abEval(`localStorage.setItem('ks_familiar', JSON.stringify({profile:{name:'大壮',relation_mode:'buddy',sun:'狮子座',moon:'双子座',asc:'天蝎座'},triad:{sun:'狮子座'},persisted:true,adoptedAt:new Date().toISOString(),chartSig:'${SIG}'})); 'OK'`);
}
function seedMoodOfDay() {
  /* 当日情绪档（readMoodOfDay 契约：mood 白名单＋timestamp＋date=当日） */
  abEval(`localStorage.setItem('ks_mood_of_day', JSON.stringify({mood:'radiant',timestamp:Date.now(),date:new Date().toISOString().slice(0,10)})); 'OK'`);
}
function openChatViaBubble() {
  /* 完整漏斗：点灵宠头部 ⇒ 气泡 ⇒ 气泡按钮二开舱（禁直开） */
  abEval(`document.querySelector('.ks-fam-zone-head').click(); 'C1'`);
  const bubble = waitFor('.ks-fam-bubble', 4000);
  if (!bubble) return false;
  return !!abEval(`(function(){const b=document.querySelector('.ks-fam-bubble [data-testid="familiar-chat-cta"]'); if(!b) return false; b.click(); return true;})()`);
}
const FIRST_LINE_PROBE = `(() => {
  const bubbles = document.querySelectorAll('.ks-chat-bubble');
  const first = bubbles.length ? bubbles[0] : null;
  return first ? { text: (first.textContent || '').trim(), n: bubbles.length } : null;
})()`;
function shot(name) { try { ab('screenshot', path.join(OUT, name)); console.log(`📸 ${name}`); } catch (e) { console.log(`📸 ${name} 失败: ${e.message}`); } }

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`${ok ? '✅' : '❌'} ${name}${detail !== undefined && detail !== '' ? ' — ' + detail : ''}`); };

ab('close', '--all');
ab('set', 'viewport', '1440', '900');

/* ══ 断言 A：六语 P2 优先权（注入 radiant 直聊命中）══ */
for (const lang of LANGS) {
  ab('open', `${BASE}/?lang=${lang}&free_access=1`);
  waitFor('.landing-start-btn');
  seedFamiliar(); seedMoodOfDay();
  ab('reload'); waitFor('.landing-start-btn'); sleep(1500);
  const opened = openChatViaBubble();
  const tag = `P2/${lang}`;
  if (!opened) { check(`${tag} 漏斗开舱（点灵宠→气泡→与TA聊聊）`, false, 'NO-CHAT'); continue; }
  const chatReady = waitFor('.ks-chat-bubble', 6000);
  if (!chatReady) { check(`${tag} 舱内首句在位`, false, 'NO-FIRSTLINE'); continue; }
  sleep(700);
  const m = abEval(FIRST_LINE_PROBE);
  const got = m ? String(m.text) : '';
  /* 军令核心：P2 情绪召回句逐字命中（严禁 helloDaily 通用星图问候压盖） */
  check(`${tag} 首句命中 P2 radiant 六语逐字`, got === P2_RADIANT[lang], got.slice(0, 46));
  check(`${tag} 非 helloDaily 通用问候`, !got.includes('新的一天，星轨又为你转动') && !got.includes('star wheel'), 'ok');
  if (lang === 'zh' || lang === 'fr') shot(`e153b4-p2-${lang}.png`);
  /* 关舱（进入断言 B 场景） */
  abEval(`document.querySelector('.ks-chat-close')?.click(); 'CLOSED'`);
  sleep(500);
}

/* ══ 断言 B：切语言纯净锁（zh 预存未回复首句 → 切语种重开零 CJK）══ */
{
  /* zh 开舱落档（仅系统首句零用户消息） */
  ab('open', `${BASE}/?lang=zh&free_access=1`);
  waitFor('.landing-start-btn');
  seedFamiliar(); seedMoodOfDay();
  ab('reload'); waitFor('.landing-start-btn'); sleep(1500);
  const opened = openChatViaBubble();
  check('纯净锁/zh 预存首句落档（开舱）', !!opened, opened ? 'ok' : 'NO-CHAT');
  if (opened) {
    sleep(700);
    const zhLine = abEval(FIRST_LINE_PROBE);
    check('纯净锁/zh 首句为 P2 召回句', zhLine && String(zhLine.text) === P2_RADIANT.zh, zhLine ? String(zhLine.text).slice(0, 30) : 'null');
    abEval(`document.querySelector('.ks-chat-close')?.click(); 'CLOSED'`);
    sleep(500);
    /* LangModal UI 切语言（点 .lang-switch → 点目标语选项） */
    for (const lang of ['fr', 'en', 'es', 'th', 'vi']) {
      abEval(`document.querySelector('.lang-switch').click(); 'LM'`);
      const modal = waitFor('.lang-modal-option', 3000);
      if (!modal) { check(`纯净锁/${lang} LangModal 弹出`, false, 'NO-MODAL'); continue; }
      const clicked = abEval(`(function(){const opts=[...document.querySelectorAll('.lang-modal-option')];const t=opts.find(o=>o.textContent.includes('${lang === 'en' ? 'English' : lang === 'fr' ? 'Français' : lang === 'es' ? 'Español' : lang === 'th' ? 'ไทย' : 'Tiếng Việt'}'));if(!t)return false;t.click();return true;})()`);
      sleep(800);
      /* 重开舱：复原分支 only-hello ⇒ 按新语种重水合首句 */
      const reopened = openChatViaBubble();
      if (!reopened) { check(`纯净锁/${lang} 重开舱`, false, 'NO-CHAT'); continue; }
      waitFor('.ks-chat-bubble', 6000); sleep(700);
      const m = abEval(FIRST_LINE_PROBE);
      const got = m ? String(m.text) : '';
      const cjk = /[\u4e00-\u9fff]/.test(got);
      check(`纯净锁/${lang} 首句按新语种重水合`, got === P2_RADIANT[lang], got.slice(0, 46));
      check(`纯净锁/${lang} 零 CJK 汉字残留`, !cjk, cjk ? 'CJK!' : 'clean');
      abEval(`document.querySelector('.ks-chat-close')?.click(); 'CLOSED'`);
      sleep(400);
    }
  }
}
ab('close', '--all');

const pass = results.filter((r) => r.ok).length;
console.log(`\n🧪 E153-刀四 真页验收：${pass}/${results.length} 通过`);
process.exit(pass === results.length ? 0 : 1);
