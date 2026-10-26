#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E95 验收实弹探针（军令 ③ 口径：$4.99 once 幻觉回潮根除）
//   军令用例：男 1976-12-03 03:00（宜昌）／女 1997-10-18 12:00（青岛）
//   验收：
//     ① 正文严禁出现「亥卯未」与「丑未相冲/丑未之冲」（盘中无卯无未）
//     ② E94 轻量契约：正文字数 300~500 字区间
//     ③ 数据锁忠实：锁内真支（辰戌/亥巳冲、己丑/癸巳）不被正反向否认
//   管道：buildCompatPrompt（once 真源，import 本仓 api/ai-advisor.js）
//        ＋ _E92CompatBaziLock（VM 抽取 server.js，与生产逐字同源）。
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const KEY = process.env.DEEPSEEK_API_KEY || fs.readFileSync('/tmp/.e95k', 'utf8').trim();
const OUT = '/tmp/e95';
fs.mkdirSync(OUT, { recursive: true });

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
const fnBaziLock = fnBody('function _E92CompatBaziLock(');
const _E92CompatBaziLock = new Function(`${fnBaziLock}\nreturn _E92CompatBaziLock;`)();

const { buildCompatPrompt } = await import(path.join(ROOT, 'api/ai-advisor.js'));

async function ds(system, user, maxTokens) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'deepseek-flash', thinking: { type: 'disabled' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: maxTokens, temperature: 0 }),
  });
  const data = await res.json();
  return { text: data?.choices?.[0]?.message?.content || '', finish: data?.choices?.[0]?.finish_reason || '', tokens: data?.usage?.completion_tokens || 0 };
}

// 军令用例
const D1 = '1976-12-03', D2 = '1997-10-18', T1 = '03:00', T2 = '12:00';
const bl = _E92CompatBaziLock(D1, D2, T1, T2);
console.log('锁生成:', bl ? 'OK（lock ' + bl.lock.length + ' 字 / guard ' + bl.guard.length + ' 字）' : 'NULL ⚠️');
console.log('锁内真支抽查: 己丑=' + bl.lock.includes('己丑') + ' 癸巳=' + bl.lock.includes('癸巳') + ' 辰戌冲=' + /辰.{0,12}戌/.test(bl.lock) + ' 亥巳冲=' + /亥.{0,12}巳/.test(bl.lock));

const JOBS = [
  { lang: 'zh', tarot: { name: '审判（逆位）', orientation: 'reversed' } },
  { lang: 'en', tarot: { name: 'Judgement (reversed)', orientation: 'reversed' } },
];
console.log('═══════ E95 验收实弹（once 档 2 发：军令用例） ═══════');
const results = {};
for (const j of JOBS) {
  const p = buildCompatPrompt({
    lang: j.lang, reportType: 'once',
    scores: { bazi: { a: 6, b: 4 }, zodiac: { a: 5, b: 5 }, iching: { a: 7, b: 3 } },
    tarot: j.tarot, zodiacMeta: ['Sagittarius', 'Libra'],
    baziLock: bl, userBirthDate: D1,
  });
  // 锁注入复核（管道层；实际前缀＝「[BAZI DATA LOCK / 八字命理数据锁 — …]」）
  const lockInjected = p.user.includes('[BAZI DATA LOCK') && p.user.includes('己丑') && p.user.includes('癸巳');
  const guardInjected = p.system.includes('BAZI') || p.system.includes('红线');
  const r = await ds(p.system, p.user, 12000);
  fs.writeFileSync(path.join(OUT, `once_${j.lang}.txt`), r.text);
  const text = r.text;
  // ① 幻觉扫描（军令红线：严禁亥卯未/丑未冲——盘中无卯无未）
  const halluc = ['亥卯未', '丑未相冲', '丑未之冲', '三合木局', '卯未'].filter((k) => text.includes(k));
  // ② E94 轻量契约字数（zh 用字数、en 用词数粗计）
  const zhChars = j.lang === 'zh' ? (text.match(/[\u4e00-\u9fff]/g) || []).length : null;
  const enWords = j.lang === 'en' ? (text.trim().split(/\s+/).length) : null;
  // ③ 数据锁忠实：正反向否认扫描（「无刑冲」「没有冲」）
  const denial = ['无刑冲', '没有刑冲', '并无刑冲', '没有冲'].filter((k) => text.includes(k));
  const lockConsistent = !(denial.length > 0); // 盘中确有刑冲 ⇒ 任何「无刑冲」即违背数据锁
  results[j.lang] = {
    lockInjected, guardInjected, finish: r.finish, tokens: r.tokens,
    chars: text.length, zhChars, enWords, halluc, denial, lockConsistent,
  };
  console.log(`once(${j.lang}): lock注入=${lockInjected} guard注入=${guardInjected} finish=${r.finish} tokens=${r.tokens} 长度=${text.length}${zhChars !== null ? `（汉字 ${zhChars}）` : ''}`);
  console.log(`  幻觉扫描: ${halluc.length === 0 ? '无 ✅' : '命中 ' + JSON.stringify(halluc) + ' ❌'}`);
  console.log(`  数据锁忠实: ${lockConsistent ? '✅（无「无刑冲」否认断言）' : '❌ ' + JSON.stringify(denial)}`);
  if (zhChars !== null) console.log(`  E94 字数契约（300~500）: ${zhChars >= 300 && zhChars <= 500 ? '✅' : '⚠️ ' + zhChars}`);
  if (enWords !== null) console.log(`  en 词量参考: ${enWords} words`);
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ jobs: results, case: { d1: D1, d2: D2, t1: T1, t2: T2 } }, null, 2));
const allPass = Object.values(results).every((r) => r.halluc.length === 0 && r.lockInjected && r.lockConsistent && r.finish === 'stop');
console.log('═══════ E95 军令验收: ' + (allPass ? '全过 ✅（产物 /tmp/e95/）' : '存在未过项 ❌') + ' ═══════');
