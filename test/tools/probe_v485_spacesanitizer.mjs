// V485 验收探针: forceSpaceHouseSanitizer 修复后必须满足
//   ① 规范输入零 diff(不许再撕碎标签/吞正文) ② 跨行不吞并 ③ 幂等
//   ④ 误写形态仍能归位(保留原有能力) ⑤ 正文提及「卧室/厨房」不被误伤
import fs from 'node:fs';
import vm from 'node:vm';
import { closureDecls } from './extract_decls.mjs';

const src = fs.readFileSync(new URL('../../server.js', import.meta.url), 'utf-8');
const { source } = closureDecls(src, ['forceSpaceHouseSanitizer'], []);
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(source + '\n__f = forceSpaceHouseSanitizer;', ctx);
const f = ctx.__f;

let bad = 0;
const chk = (name, cond, extra = '') => {
  if (!cond) bad++;
  console.log(`  ${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
};

const CANON = [
  '* **卧室区域:第四宫(田宅宫)**',
  '你的第四宫落在双鱼座，这是一个关于"根基"的宫位，请保持整洁。',
  '* **厨房区域:第二宫(财帛宫)与第八宫(共享资源)**',
  '你的第二宫落在摩羯座，第八宫落在巨蟹座，代表食禄。',
  '* **财务室区域:第八宫(共享资源)**',
  '你的第八宫落在巨蟹座，保持私密。',
].join('\n');

console.log('\n── ① 规范输入必须零 diff ──');
const outCanon = f(CANON);
chk('规范文本零改动', outCanon === CANON, outCanon === CANON ? '' : JSON.stringify(outCanon.slice(0, 180)));

console.log('\n── ② 跨行不得吞并正文(旧缺陷场景) ──');
const CROSS = '避免在卧室中放置任何与工作相关的物品，因为\n**厨房区域:第二宫(财帛宫)与第八宫(共享资源)**\n你的厨房是你财富滋养的象征。';
const outCross = f(CROSS);
chk('保留「因为」后的换行结构', outCross.split('\n').length === CROSS.split('\n').length,
  `行数 ${CROSS.split('\n').length} → ${outCross.split('\n').length}`);
chk('未把厨房标签改写成卧室标签', !/卧室区域[^\n]*\n[^\n]*卧室区域/.test(outCross));
chk('厨房正文完整保留', outCross.includes('你的厨房是你财富滋养的象征'));

console.log('\n── ③ 同一「正常输入」旧正则制造断层 / 新正则不制造(对照式) ──');
// 正常输入: LLM 按规范书写(标签行 + 正文行)
const NORMAL = [
  '* **卧室区域:第四宫(田宅宫)**',
  '你的卧室是你财富根基的象征。保持整洁。',
  '* **厨房区域:第二宫(财帛宫)与第八宫(共享资源)**',
  '你的厨房是你财富滋养的象征。',
].join('\n');
// 旧正则(修复前, 逐字复刻)内联对照
const _ZH = '一二三四五六七八九十百0-9';
const oldFn = (t) => {
  t = t.replace(new RegExp('卧室[^✦]{0,40}?第[' + _ZH + ']{1,3}宫[^\\n]{0,20}?', 'g'), '卧室区域:第四宫(田宅宫)');
  t = t.replace(new RegExp('卧室[^\\n]{0,20}?(第[' + _ZH + ']{1,3}宫[^)]{0,12})[^\\n]{0,20}?', 'g'), '卧室区域:第四宫(田宅宫)');
  t = t.replace(new RegExp('厨房[^\\n]{0,40}?第[' + _ZH + ']{1,3}宫[^\\n]{0,20}?', 'g'), '厨房区域:第二宫(财帛宫)与第八宫(共享资源)');
  t = t.replace(/卧室区域\s*[:：]?\s*[^\n，。；、*]{0,60}宫[^\n，。；、*]{0,60}/g, '卧室区域:第四宫(田宅宫)');
  return t;
};
const oldOut = oldFn(NORMAL);
const newOut = f(NORMAL);
chk('旧正则确实制造断层(证明缺陷真实)', oldOut !== NORMAL && !oldOut.includes('是你财富根基的象征'),
  JSON.stringify(oldOut.slice(0, 150)));
chk('新正则对同一输入零改动(不再制造)', newOut === NORMAL,
  newOut === NORMAL ? '' : JSON.stringify(newOut.slice(0, 150)));
chk('新正则未吞掉任何正文', newOut.includes('是你财富根基的象征') && newOut.includes('你的厨房是你财富滋养的象征'));

console.log('\n── ④ 误写形态仍能归位(保留原有能力) ──');
const cases = [
  ['**卧室在第四宫**', '卧室区域:第四宫(田宅宫)'],
  ['你的厨房位于第八宫，象征食禄。', '厨房区域:第二宫(财帛宫)与第八宫(共享资源)'],
  ['**财务室:第8宫**', '财务室区域:第八宫(共享资源)'],
  ['**卧室区域:第11宫(田宅宫)**', '卧室区域:第四宫(田宅宫)'],
];
for (const [inp, want] of cases) {
  const o = f(inp);
  chk(`归位 ${JSON.stringify(inp)}`, o.includes(want), JSON.stringify(o));
}

console.log('\n── ⑤ 幂等 ──');
for (const [n, inp] of [[`规范`, CANON], [`跨行`, CROSS], [`正常输入`, NORMAL]]) {
  const a = f(inp), b = f(a);
  chk(`${n} 幂等`, a === b, a === b ? '' : JSON.stringify(b.slice(0, 120)));
}

console.log('\n=== 结果:', bad ? `${bad} 项异常` : '全绿', '===');
process.exitCode = bad ? 1 : 0;
