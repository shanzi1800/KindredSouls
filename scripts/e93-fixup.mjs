#!/usr/bin/env node
// E93 修正探针：①关系解析正则修复（\w 不匹配中文⇒支柱名显式枚举）；
// ②Case2 差分试验跨日补测；③非中语 yearly 截断核验（tokens==maxTokens）；
// ④塔罗三档去重＋代词温度量化；⑤case4 月报相位数字核验。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = '/tmp/e93';
const SERVER = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
const TAROT_TS = fs.readFileSync(path.join(ROOT, 'web/src/lib/tarot.ts'), 'utf8');
const CASES = [
  { id: 1, dA: '1988-11-23', tA: '14:15', dB: '1992-05-12', tB: '08:30' },
  { id: 2, dA: '2000-02-29', tA: '23:55', dB: '1996-02-29', tB: '00:05' },
  { id: 3, dA: '1991-06-21', tA: '00:01', dB: '1995-12-22', tB: '18:20' },
  { id: 4, dA: '1968-08-08', tA: '05:40', dB: '1996-10-10', tB: '17:15' },
  { id: 5, dA: '1994-03-20', tA: '20:28', dB: '1999-09-23', tB: '07:30' },
];
function fnBody(anchor) {
  const i = SERVER.indexOf(anchor);
  let depth = 0, started = false;
  for (let j = SERVER.indexOf('{', i); j < SERVER.length; j++) {
    if (SERVER[j] === '{') { depth++; started = true; }
    else if (SERVER[j] === '}') { depth--; if (started && depth === 0) return SERVER.slice(i, j + 1); }
  }
  throw new Error('unbalanced: ' + anchor);
}
const fnBaziLock = fnBody('function _E92CompatBaziLock(');
const { _E92CompatBaziLock } = new Function(`${fnBaziLock}\nreturn { _E92CompatBaziLock };`)();
const DZ = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const CHONG = { 子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅', 卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳' };
const LIUHE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
const SANHE = [['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑']];
const XING = [['寅', '巳'], ['巳', '申'], ['寅', '申'], ['丑', '戌'], ['戌', '未'], ['丑', '未'], ['子', '卯']];
const PILLAR = '(?:年柱|月柱|日柱|时柱)';
const BR = '[子丑寅卯辰巳午未申酉戌亥]';
const audit = JSON.parse(fs.readFileSync(path.join(OUT, 'audit.json'), 'utf8'));
const scoring = JSON.parse(fs.readFileSync(path.join(OUT, 'scoring.json'), 'utf8'));
const texts = {};
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith('.txt')) texts[f.replace(/\.txt$/, '')] = fs.readFileSync(path.join(OUT, f), 'utf8');
}
const fix = { relations: {}, tarot: {}, truncation: {}, echo: {}, halluc: {}, pronoun: {} };
const CARDS = [];
{
  const re = /id:(\d+), emoji:'[^']*', name:\{zh:'((?:\\.|[^'])*)'/g;
  let m; while ((m = re.exec(TAROT_TS)) !== null) CARDS[Number(m[1])] = m[2].replace(/\\'/g, "'");
}
const tarotOf = (d1, d2, scope) => {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0; const sorted = [d1, d2].sort();
  const str = sorted[0] + '|' + sorted[1] + '|' + today + '|' + scope;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return { id: Math.abs(hash) % 22, rev: Math.floor(Math.abs(hash) / 22) % 2 === 1 };
};
for (const c of CASES) {
  const bl = _E92CompatBaziLock(c.dA, c.dB, c.tA, c.tB);
  const pillars = {};
  for (const side of ['A', 'B']) {
    const m = bl.lock.match(new RegExp(`${side}（[^）]+）四柱：(.+)`));
    pillars[side] = m[1].trim().split(/\s+/).map((t) => t.match(/^(.)(.)（(年柱|月柱|日柱|时柱)）$/)).filter(Boolean).map((x) => ({ stem: x[1], branch: x[2], label: x[3] }));
  }
  // 期望关系（独立复算）
  const exp = [];
  for (const pa of pillars.A) for (const pb of pillars.B) {
    const ba = pa.branch, bb = pb.branch;
    if (CHONG[ba] === bb) exp.push(`${ba}${bb}冲`);
    else if (LIUHE[ba] === bb) exp.push(`${ba}${bb}六合`);
    else if (SANHE.some((g) => g.includes(ba) && g.includes(bb))) exp.push(`${ba}${bb}半合`);
    else if (XING.some((pr) => (pr[0] === ba && pr[1] === bb) || (pr[0] === bb && pr[1] === ba))) exp.push(`${ba}${bb}刑`);
  }
  // 锁内声明关系（修复正则）
  const relText = bl.lock.split('跨盘真实刑冲合害：')[1].split('\n（除本锁列出')[0];
  const got = [...relText.matchAll(new RegExp(`A${PILLAR}(${BR})↔B${PILLAR}(${BR})（${BR}${BR}(相冲|六合|半合|相刑)`, 'g'))]
    .map((m) => `${m[1]}${m[2]}${m[3].replace('相', '')}`);
  const expSet = new Set(exp), gotSet = new Set(got);
  const miss = [...expSet].filter((k) => !gotSet.has(k));
  const extra = [...gotSet].filter((k) => !expSet.has(k));
  fix.relations[`case${c.id}`] = {
    pillarsA: pillars.A.map((p) => p.stem + p.branch).join(' '),
    pillarsB: pillars.B.map((p) => p.stem + p.branch).join(' '),
    declared: got, expected: exp,
    recall: expSet.size === 0 ? 1 : 1 - miss.length / expSet.size,
    fp: extra.length, miss, extra,
  };
  // 塔罗三档
  const cards = { once: tarotOf(c.dA, c.dB, 'insight'), monthly: tarotOf(c.dA, c.dB, 'monthly'), yearly: tarotOf(c.dA, c.dB, 'yearly') };
  fix.tarot[`case${c.id}`] = {
    once: `${CARDS[cards.once.id]}${cards.once.rev ? '逆' : '正'}#${cards.once.id}`,
    monthly: `${CARDS[cards.monthly.id]}${cards.monthly.rev ? '逆' : '正'}#${cards.monthly.id}`,
    yearly: `${CARDS[cards.yearly.id]}${cards.yearly.rev ? '逆' : '正'}#${cards.yearly.id}`,
    distinct: new Set([cards.once.id, cards.monthly.id, cards.yearly.id]).size,
  };
  // 关联 echo + 幻觉扫（用真关系支对）
  const relBranches = [...new Set([...exp, ...got].flatMap((x) => [x[0], x[1]]))];
  const echo = {};
  for (const tier of ['once', 'monthly', 'yearly']) {
    const t = texts[`case${c.id}_${tier}_zh`] || '';
    echo[tier] = relBranches.filter((b) => t.includes(b));
  }
  fix.echo[`case${c.id}`] = { relBranches, echo, overlapAll3: relBranches.filter((b) => echo.once.includes(b) && echo.monthly.includes(b) && echo.yearly.includes(b)) };
  // 幻觉扫（修复：盘中地支集合）
  const branches = new Set([...pillars.A, ...pillars.B].map((p) => p.branch));
  for (const tier of ['once', 'monthly', 'yearly']) {
    const t = texts[`case${c.id}_${tier}_zh`] || '';
    const seqs = [...t.matchAll(/[子丑寅卯辰巳午未申酉戌亥]{2,}/g)].map((m) => m[0]);
    const bad = [...new Set(seqs.filter((s) => [...s].some((ch) => !branches.has(ch))))];
    fix.halluc[`${c.id}_${tier}`] = { seqCount: seqs.length, badSeqs: bad.slice(0, 6) };
  }
  // 代词温度量化：「XXXX年一方」机械代词计数 + TA 代称计数
  for (const tier of ['once', 'monthly', 'yearly']) {
    const t = texts[`case${c.id}_${tier}_zh`] || '';
    fix.pronoun[`${c.id}_${tier}`] = {
      mechYearParty: (t.match(/\d{4}年一方/g) || []).length,
      warmTA: (t.match(/的TA|TA是|TA的/g) || []).length,
    };
  }
}
// 截断核验：tokens==maxTokens 的文本尾部形态
for (const k of ['case1_yearly_fr', 'case1_yearly_es', 'case1_yearly_vi', 'case1_yearly_th', 'case1_yearly_en', 'case1_monthly_vi', 'case1_monthly_fr']) {
  const t = texts[k] || '';
  fix.truncation[k] = { chars: t.length, tail: t.slice(-40).replace(/\n/g, '⏎'), looksCut: !/[。.!？?””\]\)]$/.test(t.trim()) };
}
// case4 月报相位数字核验（judge 称「无刑冲」是否违背数据锁）
{
  const t = texts['case4_monthly_zh'] || '';
  fix.case4MonthlySyn = { has207or8hard: /调和[^0-9]{0,4}(20|19|18)|硬[^0-9]{0,4}(8|7)/.test(t), noHardClaim: /无刑冲|没有.*硬相位|无.*硬相/.test(t), snippet: (t.match(/[^。]{0,60}(相位|硬相|调和)[^。]{0,60}。/g) || []).slice(0, 4) };
}
fs.writeFileSync(path.join(OUT, 'fix.json'), JSON.stringify(fix, null, 2));
console.log(JSON.stringify({ relations: fix.relations, tarot: fix.tarot, truncation: fix.truncation, case4: fix.case4MonthlySyn }, null, 1).slice(0, 4000));
console.log('echo:', JSON.stringify(fix.echo));
console.log('halluc bad:', JSON.stringify(Object.fromEntries(Object.entries(fix.halluc).filter(([k, v]) => v.badSeqs.length > 0))));
console.log('pronoun:', JSON.stringify(fix.pronoun));
