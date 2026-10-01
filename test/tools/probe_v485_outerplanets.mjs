// V485 探针: lockYearlyOuterPlanetsYear 行为验证(假 astroMatrix, 零外部依赖)
import fs from 'node:fs';
import vm from 'node:vm';
import { closureDecls } from './extract_decls.mjs';

const src = fs.readFileSync(new URL('../../server.js', import.meta.url), 'utf-8');
const DEPS = ['lockYearlyOuterPlanetsYear', '_V485_OUTER_KEYS', '_V482_TVERB', '_V432_NAME',
  '_v444Signs', '_v432AllSignWords', '_v444Esc', 'SUN_SIGN_EN'];
const { source } = closureDecls(src, DEPS, []);
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(source + '\n__f = lockYearlyOuterPlanetsYear;', ctx);
const f = ctx.__f;

// 假矩阵: 1997-10-18 盘的真值(全 12 月恒定)
const MK = (J, S, U, N, P) => ({ months: Array.from({ length: 12 }, () => ({
  positions: {
    Jupiter: { sign: J, house: 9 }, Saturn: { sign: S, house: 5 }, Uranus: { sign: U, house: 7 },
    Neptune: { sign: N, house: 5 }, Pluto: { sign: P, house: 3 },
  },
})) });
const M = MK('Leo', 'Aries', 'Gemini', 'Aries', 'Aquarius');

let bad = 0;
const chk = (n, c, e = '') => { if (!c) bad++; console.log(`  ${c ? '✅' : '❌'} ${n}${e ? ' — ' + e : ''}`); };
const run = (t, lang = 'zh', rt = 'yearly', m = M) => f(t, lang, m, rt);

console.log('\n── ① 军师 P2 实证句: 木星双子座 → 狮子座 ──');
const c1 = '在2026-2027年，木星进入双子座第9宫，这会放大你的"表演性消费"倾向。';
const o1 = run(c1);
chk('星座纠正为狮子座', o1.includes('木星进入狮子座第9宫'), JSON.stringify(o1));
chk('宫位保持第9宫', !/第\d+宫/.test(o1.replace(/[^第\d宫]/g, '')) || o1.includes('第9宫'));

console.log('\n── ② 宫位在前形态 ──');
const c2 = '当流年木星进入第9宫双子座时，财富之门开启。';
const o2 = run(c2);
chk('宫位在前也能纠正', o2.includes('第9宫狮子座'), JSON.stringify(o2));

console.log('\n── ③ 本命句必须豁免 ──');
const c3 = '你的本命木星落在水瓶座第三宫，本命冥王星落在射手座第一宫。';
chk('本命句零改动', run(c3) === c3, JSON.stringify(run(c3)));

console.log('\n── ④ 真值恒定的正确句零 diff ──');
const c4 = '土星在白羊座第5宫对你的创造力施压，冥王星在水瓶座第3宫重塑思维。';
chk('正确句零改动', run(c4) === c4, JSON.stringify(run(c4)));

console.log('\n── ⑤ 幂等 ──');
const once = run(c1);
chk('二次运行零 diff', run(once) === once, JSON.stringify(run(once)));

console.log('\n── ⑥ 护栏 ──');
chk('月报(reportType=monthly)不动', run(c1, 'zh', 'monthly') === c1);
chk('非 zh(es)不动', run(c1, 'es', 'yearly') === c1);
chk('矩阵少于12月不动', run(c1, 'zh', 'yearly', { months: [] }) === c1);
chk('年内换座 → 弃权不误改', run('木星进入双子座第9宫',
  'zh', 'yearly', { months: Array.from({ length: 12 }, (_, i) => ({ positions: { Jupiter: { sign: i < 6 ? 'Leo' : 'Virgo', house: i < 6 ? 9 : 10 } } })) })
  === '木星进入双子座第9宫');

console.log('\n── ⑦ 多行星批量 ──');
const c7 = '天王星在双鱼座第7宫逆行，海王星在狮子座第5宫顺行，冥王星在射手座第3宫。';
const o7 = run(c7);
chk('天王星 双鱼→双子', o7.includes('天王星在双子座第7宫'), JSON.stringify(o7));
chk('海王星 狮子→白羊', o7.includes('海王星在白羊座第5宫'));
chk('冥王星 射手→水瓶', o7.includes('冥王星在水瓶座第3宫'));

console.log('\n=== 结果:', bad ? `${bad} 项异常` : '全绿', '===');
process.exitCode = bad ? 1 : 0;
