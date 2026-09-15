import { getAstroMatrix } from './v69_client.js';
const m = await getAstroMatrix('1989-12-31','12:00',39.9042,116.4074,'Asia/Shanghai');
const m0 = m.months && m.months[0];
console.log('=== meta ===');
console.log(JSON.stringify({ sun_sign:m.meta?.sun_sign, rising:m.meta?.rising_sign, natal_moon:m.meta?.natal_moon?.sign, month_name:m0?.month_name }, null, 0));
console.log('=== 流年行星 months[0] ===');
for (const k of ['sun','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto']) {
  const p = m0 && m0[k]; if (p) console.log('  ' + k + ': ' + p.sign + ' house=' + p.house + (p.retrograde?' Rx':''));
}
console.log('=== moon_weeks 真值 ===');
const mw = m0 && m0.moon_weeks;
if (Array.isArray(mw)) {
  for (const w of mw) {
    const legs = (w.legs||[]).map(l=>l.sign+'/'+l.house).join(' ');
    console.log('  W' + w.week + ' (' + w.from_day + '-' + w.to_day + '): ' + legs);
  }
} else console.log('  (无 moon_weeks)');
