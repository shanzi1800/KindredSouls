#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// E92 生成质量探针（一次性，不入闸门）——军令测试用例（男 1976-12-03 03:00 /
// 女 1997-10-18 12:00）真弹 DeepSeek，验收四条：
//   ① 八字论述严禁出现「亥卯未三合 / 丑未相冲」幻觉；须识别真实「辰戌相冲/寅午合」；
//   ② 塔罗三档解耦（insight/monthly/yearly 三 scope 互不覆盖）；
//   ③ 代词不再机械刷屏「XXXX年一方」；
//   ④ 月报四模块完整。
// 构造器以「文本抽取 + VM 注入」消费（闸门同源口径）；密钥经环境变量注入不回显。
// 用法：DEEPSEEK_API_KEY=... node scripts/e92-bazi-probe.mjs [monthly|oracle]
// ═══════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const MODE = (process.argv[2] === 'oracle') ? 'oracle' : 'monthly';

function sliceFrom(anchor, endMarker) {
  const i = SERVER.indexOf(anchor);
  if (i === -1) throw new Error(`anchor missing: ${anchor}`);
  const j = SERVER.indexOf(endMarker, i);
  if (j === -1) throw new Error(`end marker missing after ${anchor}`);
  return SERVER.slice(i, j);
}
function fnBody(anchor) {
  const i = SERVER.indexOf(anchor);
  if (i === -1) throw new Error(`fn anchor missing: ${anchor}`);
  let depth = 0, started = false;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) return SERVER.slice(i, j + 1); }
  }
  throw new Error(`unbalanced fn: ${anchor}`);
}

const monthlyTables = sliceFrom('const _E89_MONTHLY_LANG_LOCK', '\n\n// ═══');
const fnMonthly = fnBody('function buildCompatMonthlyFourModulePrompt(');
const fnBaziLock = fnBody('function _E92CompatBaziLock(');

const { computeCompatScores, buildCompatTimeContext, renderSynastryBlock, buildCompatPrompt } = await import(
  path.join(ROOT, 'api/ai-advisor.js')
);

const vmFactory = new Function(
  'computeCompatScores', 'buildCompatTimeContext', 'renderSynastryBlock',
  `${monthlyTables}\n${fnMonthly}\n${fnBaziLock}\nreturn { buildCompatMonthlyFourModulePrompt, _E92CompatBaziLock };`
);
const { buildCompatMonthlyFourModulePrompt, _E92CompatBaziLock } = vmFactory(
  computeCompatScores, buildCompatTimeContext, renderSynastryBlock
);

// ── 军令测试用例 ──
const d1 = '1976-12-03', d2 = '1997-10-18', t1 = '03:00', t2 = '12:00';
const baziLock = _E92CompatBaziLock(d1, d2, t1, t2);
console.log('=== BAZI LOCK 预检 ===');
console.log(baziLock.lock);
console.log('幻觉检查：亥卯未 =', baziLock.lock.includes('亥卯未'), '| 丑未相冲 =', baziLock.lock.includes('丑未相冲'));

// ── 塔罗三档解耦预检（scope 盐行为验证：复刻前端 hash 逻辑）──
const hashOf = (a, b, scope) => {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const sorted = [a, b].sort();
  const str = sorted[0] + '|' + sorted[1] + '|' + today + '|' + scope;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return [Math.abs(hash) % 22, Math.floor(Math.abs(hash) / 22) % 2 === 1];
};
const cards = { insight: hashOf(d1, d2, 'insight'), monthly: hashOf(d1, d2, 'monthly'), yearly: hashOf(d1, d2, 'yearly') };
console.log('=== 塔罗三档卡槽 ===');
console.log('insight card =', cards.insight, '| monthly card =', cards.monthly, '| yearly card =', cards.yearly);
const uniq = new Set(Object.values(cards).map((c) => c.join('/')));
console.log('三档去重数 =', uniq.size, '(≥2 即解耦生效；同卡=撞车)');

// ── prompt 装配 ──
const extras = {
  bazi: { a: 7, b: 3 }, zodiac: { a: 2, b: 8 }, iching: { a: 6, b: 5 },
  tarot: { name: cards.monthly[0] === 3 ? 'The Empress' : 'The Lovers', orientation: cards.monthly[1] ? '（逆位）' : '（正位）', meaning: 'union' },
  zodiacMeta: ['Sagittarius', 'Libra'], userBirthDate: d1, synastry: null, baziLock,
};
const prompt = MODE === 'oracle'
  ? buildCompatPrompt({ lang: 'zh', reportType: 'oracle', scores: { overall: 78, bazi: 64, zodiac: 79, iching: 90 }, tarot: extras.tarot, zodiacMeta: extras.zodiacMeta, baziLock })
  : buildCompatMonthlyFourModulePrompt(d1, d2, 'zh', extras);

console.log(`=== PROMPT（${MODE}）===`);
console.log('system chars:', prompt.system.length, '| user chars:', prompt.user.length);
console.log('lock 注入 =', prompt.user.includes('[BAZI DATA LOCK'), '| guard 注入 =', prompt.system.includes('八字命理绝对红线'));

const KEY = process.env.DEEPSEEK_API_KEY;
if (!KEY) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1); }
const t0 = Date.now();
const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
  body: JSON.stringify({
    model: 'deepseek-flash',
    thinking: { type: 'disabled' },
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    max_tokens: MODE === 'oracle' ? 2000 : 3000, temperature: 0,
  }),
});
console.log('=== DeepSeek 网关 ===');
console.log('HTTP', res.status, '| elapsed', ((Date.now() - t0) / 1000).toFixed(1) + 's');
const data = await res.json();
const out = data?.choices?.[0]?.message?.content || '';
console.log('chars:', out.length, '| finish:', data?.choices?.[0]?.finish_reason, '| tokens:', data?.usage?.completion_tokens);

console.log('=== 军令验收四条 ===');
console.log('① 幻觉：亥卯未 =', out.includes('亥卯未'), '（须 false）| 丑未相冲 =', out.includes('丑未相冲'), '（须 false）');
console.log('① 真实关系：辰戌 =', /[辰戌]{2}|辰.{0,6}戌|戌.{0,6}辰/.test(out), '（须 true）| 寅午 =', /寅.{0,6}午|午.{0,6}寅/.test(out), '（须 true）');
console.log('③ 机械代词「年一方」出现次数 =', (out.match(/年一方/g) || []).length, '（须 0）');
if (MODE === 'monthly') {
  for (const t of ['第一章 · 当月合盘能量总纲', '第二章 · 四维情感能量雷达', '第三章 · 30天高能吉凶日历', '第四章 · 月度易经调频锦囊']) {
    console.log('  ', out.includes(t) ? '✓' : '✗', t);
  }
}
fs.writeFileSync(`/tmp/e92_probe_${MODE}.txt`, out);
console.log(`全文已存 /tmp/e92_probe_${MODE}.txt`);
