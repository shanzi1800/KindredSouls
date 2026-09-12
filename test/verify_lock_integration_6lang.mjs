// 🌍 六语种硬锁集成回归 — V433 / V434-1 / V434-2 / V435 真值自证
//
// 【真值轴】真值 100% 来自 astro/astro_matrix.py（SwissEph 实算）→ astroMatrix.months[0].moon_weeks
// 【断言】① 坏样本必须被改（防「静默失效」：只验好样本会掩盖「根本没匹配」）
//          ② 好样本必须零改动（防误杀）
//          ③ 幂等：应用两次 == 一次
//          ④ 交叉检查：替换产物语种正确性（防英文 House 注入法语正文）
//          ⑤ 段落管辖探针：V434-2 只吃「无周号 ✦ 段落」，样本必须包段
// 运行: node test/verify_lock_integration_6lang.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAstroMatrix } from '../v69_client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const _from = SRC.indexOf('const _EN2ZIDX');
const _to = SRC.indexOf('function cleanConsumerTrapAndBrackets');
if (_from < 0 || _to < 0) throw new Error('未能从 server.js 提取真值锁源码块');
const BLOCK = SRC.slice(_from, _to);
const SIGNS = ['EN', 'ES', 'ZH', 'FR', 'TH', 'VI']
  .map((k) => { const m = SRC.match(new RegExp('const SUN_SIGN_' + k + '\\s*=\\s*\\[[^\\]]*\\];')); return m ? m[0] : ''; })
  .join('\n');
const F = new Function(`${SIGNS}\n${BLOCK}\nreturn { _v433LockMoonWeek, _v434LockQualifiers, _v434LockGlobalMoonScope, _v435LockMoonDailyRanges, _v435DailyMap, _v435RangeTruth, applyV434Locks, _EN2ZIDX, SUN_SIGN_EN, SUN_SIGN_ES, SUN_SIGN_ZH, SUN_SIGN_FR, SUN_SIGN_TH, SUN_SIGN_VI };`)();

const L = { en: F.SUN_SIGN_EN, es: F.SUN_SIGN_ES, zh: F.SUN_SIGN_ZH, fr: F.SUN_SIGN_FR, th: F.SUN_SIGN_TH, vi: F.SUN_SIGN_VI };
const EN2IDX = F._EN2ZIDX;
const EN = Object.keys(EN2IDX);

const LANG = {
  zh: { wk: '第1周', ov: '本月概览', moon: '月亮', be: '在', house: (n) => `（第${n}宫）`, lum: '太阳', retro: '逆行', mercury: '水星', persist: '主要停留在', pad: '', stop: '。', natal: '本命' },
  en: { wk: 'Week 1', ov: 'Monthly Overview', moon: 'the Moon', be: 'in', house: (n) => `, House ${n}`, lum: 'Sun', retro: 'retrograde', mercury: 'Mercury', persist: 'spends most of the month in', pad: ' the', stop: '.', natal: 'natal' },
  es: { wk: 'Semana 1', ov: 'Panorama', moon: 'la Luna', be: 'en', house: (n) => `, Casa ${n}`, lum: 'Sol', retro: 'retrógrado', mercury: 'Mercurio', persist: 'permanece', pad: ' en', stop: '.', natal: 'natal' },
  fr: { wk: 'Semaine 1', ov: 'Aperçu', moon: 'la Lune', be: 'en', house: (n) => `, Maison ${n}`, lum: 'Soleil', retro: 'rétrograde', mercury: 'Mercure', persist: 'reste dans', pad: '', stop: '.', natal: 'natal' },
  th: { wk: 'สัปดาห์ที่ 1', ov: 'ภาพรวม', moon: 'ดวงจันทร์', be: 'ใน', house: (n) => ` บ้าน ${n}`, lum: 'ดวงอาทิตย์', retro: 'ถอยหลัง', mercury: 'ดาวพุธ', persist: 'ตลอดทั้งเดือน', pad: '', stop: '.', natal: 'กำเนิด' },
  vi: { wk: 'Tuần 1', ov: 'Tổng quan', moon: 'Mặt Trăng', be: 'ở', house: (n) => `, Nhà ${n}`, lum: 'Mặt Trời', retro: 'nghịch hành', mercury: 'Sao Thủy', persist: 'suốt tháng', pad: ' ở', stop: '.', natal: 'bản mệnh' },
};

function datePhrase(lang, d, sign) {
  switch (lang) {
    case 'zh': return `9月${d}日，月亮在${sign}。`;
    case 'en': return `On September ${d}, the Moon in ${sign}.`;
    case 'es': return `El Día ${d}, la Luna en tránsito en ${sign}.`;
    case 'fr': return `Le ${d} septembre, la Lune en transit en ${sign}.`;
    case 'th': return `วันที่ ${d} ดวงจันทร์ใน${sign}.`;
    case 'vi': return `ngày ${d}, Mặt Trăng ở ${sign}.`;
  }
}

const astro = await getAstroMatrix('1990-08-05', '07:00', 10.8231, 106.6297, 'Asia/Ho_Chi_Minh');
const weeks = astro.months[0].moon_weeks;
const legs = weeks.flatMap((w) => w.legs);
const wk1 = new Set(weeks[0].legs.map((l) => l.sign));
const wk1First = weeks[0].legs[0];
const outSign = EN.find((s) => !wk1.has(s));
const outHouse = (legs.find((l) => l.sign === outSign) || {}).house || 1;   // 越界星座的真实宫位（避免走「宫位修正」路径掩盖星座缺口）
const dm = F._v435DailyMap(astro);
const DAY = 12;
const dayTruth = F._v435RangeTruth(dm, DAY, DAY);

console.log(`真值基准 1990-08-05 胡志明市 | 报告月 ${dm.year}-${dm.month}`);
console.log(`第1周真值 [${[...wk1].join(', ')}] | 越界取样 ${outSign}(宫${outHouse}) | 日${DAY} 真值 [${[...dayTruth.valid].join(', ')}] 主导 ${dayTruth.dom}`);

let pass = 0, fail = 0; const fails = [];
function check(lang, lock, name, got, want) {
  const ok = got === want; ok ? pass++ : fail++;
  if (!ok) { fails.push(`[${lang}] ${lock} ${name}: 期望 ${want} / 实得 ${got}`); }
  return ok;
}

for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
  const C = LANG[lang], S = (en) => L[lang][EN2IDX[en]];
  console.log(`\n── ${lang.toUpperCase()} ──`);

  // ① V433 周级锁：越界星座 + 真值宫位（防宫位路径掩盖）
  const wkBad = `✦ [🔵 ${C.wk}: Test]${C.pad}\n${C.moon} ${C.be} ${S(outSign)}${C.house(outHouse)}${C.stop}`;
  const wkGood = `✦ [🔵 ${C.wk}: Test]${C.pad}\n${C.moon} ${C.be} ${S(wk1First.sign)}${C.house(wk1First.house)}${C.stop}`;
  const outBad = F._v433LockMoonWeek(wkBad, lang, astro);
  const outGood = F._v433LockMoonWeek(wkGood, lang, astro);
  const signFixed = outBad.includes(S(wk1First.sign));
  check(lang, 'V433', '越界星座→本周真值', signFixed, true);
  check(lang, 'V433', '合法周声明零改动', outGood === wkGood, true);
  const enInject = / House /.test(outBad) && lang === 'fr';
  if (enInject) fails.push(`[${lang}] V433 替换产物注入了英文「House」（应为 Maison）`);

  // ①b 法国语隔离探针：把周标记换成已被识别的 "Week 1" → 看星座路径是否复活
  let frProbe = null;
  if (lang === 'fr') {
    const iso = `✦ [🔵 Week 1: Test]\n${C.moon} ${C.be} ${S(outSign)}${C.house(outHouse)}${C.stop}`;
    const isoOut = F._v433LockMoonWeek(iso, 'fr', astro);
    frProbe = { signFixed: isoOut.includes(S(wk1First.sign)), enInject: / House /.test(isoOut), out: isoOut.slice(0, 120) };
  }

  // ② V434-1
  const r1bad = `${C.lum} ${C.retro}`;
  const r1keep = `${C.mercury} ${C.retro}`;
  check(lang, 'V434-1', '日月逆行必须剥离', F._v434LockQualifiers(r1bad, lang) !== r1bad, true);
  check(lang, 'V434-1', '水星逆行零误杀', F._v434LockQualifiers(r1keep, lang) === r1keep, true);

  // ③ V434-2（必须包在「无周号 ✦ 段落」内才受管辖）
  const pBad = `✦ [🔵 ${C.ov}]\n${C.moon}${C.pad ? C.pad : ' '}${C.persist} ${S(outSign)}${C.stop}`;
  const pNatal = `✦ [🔵 ${C.ov}]\n${C.moon} ${C.natal}${C.pad ? '' : ''} ${C.persist} ${S(outSign)}${C.stop}`;
  const pBadOut = F._v434LockGlobalMoonScope(pBad, lang, astro);
  const pNatalOut = F._v434LockGlobalMoonScope(pNatal, lang, astro);
  check(lang, 'V434-2', '整月停留断言必须改', pBadOut !== pBad, true);
  check(lang, 'V434-2', '本命月亮句零误杀', pNatalOut === pNatal, true);

  // ④ V435
  const badEn = EN.find((e) => !dayTruth.valid.has(e));
  const v5bad = datePhrase(lang, DAY, S(badEn));
  const v5good = datePhrase(lang, DAY, L[lang][EN2IDX[dayTruth.dom]]);
  check(lang, 'V435', '日期越界星座必须改', F._v435LockMoonDailyRanges(v5bad, lang, astro) !== v5bad, true);
  check(lang, 'V435', '日期合法声明零改动', F._v435LockMoonDailyRanges(v5good, lang, astro) === v5good, true);

  // ⑤ 幂等
  const once = F.applyV434Locks(pBad, lang, astro);
  check(lang, '幂等', 'applyV434Locks 二次零漂移', F.applyV434Locks(once, lang, astro) === once, true);

  console.log(`  V433 星座归正=${signFixed} 英文注入=${enInject ? '❌ 是' : '否'}` + (frProbe ? ` | 隔离探针(Week 1): 星座归正=${frProbe.signFixed} 英文注入=${frProbe.enInject ? '❌ 是' : '否'}` : ''));
}

console.log(`\n════ 合成样本: ${pass} PASS / ${fail} FAIL ════`);
if (fails.length) { console.log('未过项:'); for (const f of fails) console.log('  ❌ ' + f); }
const frGap = fails.some((f) => f.includes('[fr] V433'));
console.log(`\n🇫🇷 V433 法语周段落管辖: ${frGap ? '❌ 缺口（Semaine 未纳入周标记识别表 → wk=0 → 星座越界不纠）' : '✅ 正常'}`);

console.log('\n════ 真实生产文本回放（各文件真实星盘，禁止拿错图当真值）════');
// 生产原文 → 其真实星盘参数（改错图会把「合法零改动」验成「大规模误改」）
const CHARTS = {
  es: ['1988-12-31', '23:59', -43.9536, -176.5463, 'Pacific/Chatham'],
  vi: ['1990-08-05', '07:00', 10.8231, 106.6297, 'Asia/Ho_Chi_Minh'],
  zh: ['1989-11-12', '02:00', 39.9042, 116.4074, 'Asia/Shanghai'],
};
for (const f of fs.readdirSync('/tmp').filter((x) => /^v43[45]_prod_\w+\.txt$/.test(x))) {
  const txt = fs.readFileSync('/tmp/' + f, 'utf8');
  const lang = f.match(/_prod_(\w+)\.txt/)[1];
  const c = CHARTS[lang];
  if (!L[lang] || !c) continue;
  const a = await getAstroMatrix(c[0], c[1], c[2], c[3], c[4]);
  const o1 = F.applyV434Locks(F._v433LockMoonWeek(txt, lang, a), lang, a);
  const o2 = F.applyV434Locks(F._v433LockMoonWeek(o1, lang, a), lang, a);
  console.log(`  ${f} [${lang}] ${txt.length}字符 → 首次 ${o1.length}（${o1 === txt ? '0 改动' : '有改动'}）| 幂等 ${o2 === o1 ? '✅' : '❌ 二次仍漂移'}`);
  if (o1 !== txt) fs.writeFileSync('/tmp/replay_' + f, o1);
}
console.log(`\n总结: 合成样本 ${pass}/${pass + fail} PASS | 法语 V433: ${frGap ? '缺口' : '正常'}`);
