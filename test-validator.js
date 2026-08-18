// test-validator.js — 验证 Astro-Logic Validator 能抓到军师尸检的三类错误
import { buildAstroTruth } from './astro-truth.js';
import { validateAstroLogic } from './astro-validator.js';

// 宿主：1995-03-08，上升摩羯座
const truth = buildAstroTruth('1995-03-08', '摩羯座', 'zh', 2026, 7);
console.log('=== 真值表（上升摩羯）===');
console.log(truth.monthlyTruthText);
console.log('外行星:', JSON.stringify(truth.outerPlanets));
console.log('');

const cases = [
  {
    name: 'CASE1: 土星宫位矛盾（报告原罪：又10宫又4宫+闪现水瓶）',
    text: `土星在白羊座第10宫（官禄宫）。土星此时已经进入你的第4宫（田宅宫）。金星在金牛座第5宫四分土星在水瓶座第2宫。`,
  },
  {
    name: 'CASE2: 双鱼夺舍（报告原罪：双鱼套双子台词）',
    text: `太阳在双鱼座，拥抱你内在的双鱼座原型——那个灵活多变、善于学习、能够同时处理多重信息、并擅长沟通与连接的自己。`,
  },
  {
    name: 'CASE3: 流月太阳重复（报告原罪：一年两次双鱼）',
    text: `2027年3月：太阳进入双鱼座第3宫。2027年6月：太阳进入双鱼座第6宫。`,
  },
  {
    name: 'CASE4: 干净文本（应通过）',
    text: `土星在白羊座第4宫（田宅宫）。木星在狮子座第8宫。冥王星在水瓶座第2宫。2027年3月：太阳进入双鱼座第3宫。2027年4月：太阳进入白羊座第4宫。`,
  },
];

for (const c of cases) {
  const r = validateAstroLogic(c.text, truth, 'zh');
  console.log(`\n=== ${c.name} ===`);
  console.log('PASS:', r.pass);
  if (!r.pass) r.errors.forEach((e) => console.log('  ', e));
}
