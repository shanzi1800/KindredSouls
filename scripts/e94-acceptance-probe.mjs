#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔴 E94 验收实弹探针（军令 5 条验收口径）
//   ① 非中语（fr/th/vi）年报：全文完整收束（长度下界＋句尾完整度），不撞 maxTokens 截断
//   ② zh 月报/年报：「的TA」复合代称 ≤2 次
//   ③ zh 年报：Q1~Q4 季度基调在场（宏微咬合同源词表）
//   ④ zh 月报：流月定力串联句在场；zh 年报：精神主轴串联句在场
//   ⑤ 数据锁忠实：盘中有刑冲时正文不得写「无刑冲」（zh 年报抽检）
// 判据：prompt 真源＝本仓 server.js（VM 抽取构造器，与生产逐字同源）；
//       maxTokens 语种分流镜像生产（zh 7500/非中语 12000/月 3000）。
// ═══════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const KEY = process.env.DEEPSEEK_API_KEY || fs.readFileSync('/tmp/.e94k', 'utf8').trim();
const OUT = '/tmp/e94';
fs.mkdirSync(OUT, { recursive: true });

// ── VM 抽取（同 e93 探针口径） ──
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
const yearlyTables = sliceFrom('const _E88_YEARLY_LANG_LOCK', '\n\n// ═══');
const fnMonthly = fnBody('function buildCompatMonthlyFourModulePrompt(');
const fnYearly = fnBody('function buildCompatYearlyFiveChapterPrompt(');
const fnBaziLock = fnBody('function _E92CompatBaziLock(');

const { computeCompatScores, buildCompatTimeContext, renderSynastryBlock } = await import(path.join(ROOT, 'api/ai-advisor.js'));
const vmFactory = new Function(
  'computeCompatScores', 'buildCompatTimeContext', 'renderSynastryBlock',
  `${monthlyTables}\n${yearlyTables}\n${fnMonthly}\n${fnYearly}\n${fnBaziLock}\n` +
  'return { buildCompatMonthlyFourModulePrompt, buildCompatYearlyFiveChapterPrompt, _E92CompatBaziLock };'
);
const { buildCompatMonthlyFourModulePrompt, buildCompatYearlyFiveChapterPrompt, _E92CompatBaziLock } =
  vmFactory(computeCompatScores, buildCompatTimeContext, renderSynastryBlock);

async function ds(system, user, maxTokens) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'deepseek-flash', thinking: { type: 'disabled' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: maxTokens, temperature: 0 }),
  });
  const data = await res.json();
  return { text: data?.choices?.[0]?.message?.content || '', finish: data?.choices?.[0]?.finish_reason || '', tokens: data?.usage?.completion_tokens || 0 };
}
function maxT(tier, lang) { // E94-② 生产镜像
  if (tier === 'yearly') return /^zh/i.test(String(lang || 'zh')) ? 7500 : 12000;
  if (tier === 'monthly') return 3000;
  return 12000;
}

// 军令测试用例（E92 原案：盘中有真实刑冲）
const D1 = '1976-12-03', D2 = '1997-10-18', T1 = '03:00', T2 = '12:00';
const bl = _E92CompatBaziLock(D1, D2, T1, T2);
const SCORES = { bazi: { a: 6, b: 4 }, zodiac: { a: 5, b: 5 }, iching: { a: 7, b: 3 } };
function buildFor(tier, lang) {
  const extras = { bazi: SCORES.bazi, zodiac: SCORES.zodiac, iching: SCORES.iching, tarot: { name: lang === 'zh' ? '星星（逆位）' : 'The Star (reversed)', orientation: 'reversed' }, zodiacMeta: ['Sagittarius', 'Libra'], baziLock: bl, userBirthDate: D1 };
  return tier === 'monthly'
    ? buildCompatMonthlyFourModulePrompt(D1, D2, lang, extras)
    : buildCompatYearlyFiveChapterPrompt(D1, D2, lang, extras);
}

const JOBS = [
  { tier: 'yearly', lang: 'fr' }, { tier: 'yearly', lang: 'th' }, { tier: 'yearly', lang: 'vi' },
  { tier: 'yearly', lang: 'zh' }, { tier: 'monthly', lang: 'zh' },
];
console.log('═══════ E94 验收实弹（5 发） ═══════');
const results = {};
for (const j of JOBS) {
  const p = buildFor(j.tier, j.lang);
  const r = await ds(p.system, p.user, maxT(j.tier, j.lang));
  const file = path.join(OUT, `${j.tier}_${j.lang}.txt`);
  fs.writeFileSync(file, r.text);
  const check = { chars: r.text.length, tokens: r.tokens, finish: r.finish };
  // ① 非中语完整收束：finish=stop 且长度下界（≥3000 字符）
  if (j.lang !== 'zh') check.complete = (r.finish === 'stop' && r.text.length >= 3000);
  // ② TA 复合代称计数（zh）
  if (j.lang === 'zh') check.taCount = (r.text.match(/的TA/g) || []).length + (r.text.match(/年长沉稳的|灵动明亮的/g) || []).length;
  // ③④ 串联句与季度基调（zh）
  if (j.lang === 'zh' && j.tier === 'yearly') {
    check.quarterKeys = ['起势与磨合', '升温与试探', '考验与深化', '收束与沉淀'].every((k) => r.text.includes(k));
    check.thread = r.text.includes('主轴') || r.text.includes('灵魂');
  }
  if (j.lang === 'zh' && j.tier === 'monthly') check.thread = r.text.includes('定力');
  // ⑤ 数据锁忠实（zh 年报：盘中有辰戌冲 ⇒ 禁「无刑冲」）
  if (j.lang === 'zh' && j.tier === 'yearly') check.lockFidelity = !/无刑冲|毫无冲突|没有.*冲克/.test(r.text);
  results[`${j.tier}_${j.lang}`] = check;
  const _brief = Object.fromEntries(Object.entries(check).filter(([k]) => (k !== 'chars' && k !== 'tokens')));
  console.log(`${j.tier}(${j.lang}): ${r.finish} ${r.text.length}字 ${r.tokens}tok`, JSON.stringify(_brief));
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));

// ── 军令验收裁决 ──
console.log('\n═══════ 验收裁决 ═══════');
let fail = 0;
const fr = results['yearly_fr'], th = results['yearly_th'], vi = results['yearly_vi'];
const zy = results['yearly_zh'], zm = results['monthly_zh'];
const v = (name, ok, detail) => { console.log(`${ok ? '✅' : '❌'} ${name} ${detail || ''}`); if (!ok) fail++; };
v('①-1 fr 年报完整收束', fr.complete, `${fr.finish}/${fr.chars}字`);
v('①-2 th 年报完整收束', th.complete, `${th.finish}/${th.chars}字`);
v('①-3 vi 年报完整收束', vi.complete, `${vi.finish}/${vi.chars}字`);
v('②-1 zh 年报 TA ≤2', zy.taCount <= 2, `实测 ${zy.taCount} 次`);
v('②-2 zh 月报 TA ≤2', zm.taCount <= 2, `实测 ${zm.taCount} 次`);
v('③ zh 年报 Q1~Q4 基调齐', zy.quarterKeys);
v('④-1 zh 年报串联句', zy.thread);
v('④-2 zh 月报串联句', zm.thread);
v('⑤ zh 年报数据锁忠实', zy.lockFidelity, bl.lock.includes('辰戌相冲') ? '（盘中有辰戌冲）' : '');
console.log(fail === 0 ? '\n[E94 验收] 全部通过 ✅' : `\n[E94 验收] ${fail} 项未过 ❌`);
process.exit(fail === 0 ? 0 : 1);
