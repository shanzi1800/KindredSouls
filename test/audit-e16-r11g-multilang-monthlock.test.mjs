// ═══════════════════════════════════════════════════════════════════════
// 🛡️ E16/R11g: 六语月标题真值锁解封 + 输出卫生 —— 回归闸门
// 立项依据（2026-10-04 v513 线上 12 盘六语批测, astro_matrix 真值逐格核对 **54 处错项**）:
//   🔴 缺陷 1（正确性, P0）月标题行识别的**语言盲区**
//     `lockYearlyMonthTitles`(:5734) / `lockYearlyTransitSigns`(:5908) /
//     `dedupYearlyMonthTitles`(:7423) 的标题行识别**只认 zh `2026年7月` 与 lang==='en'
//     的 `July 2026`** ⇒ es `Julio 2026` / fr `Juillet 2026` / th `กรกฎาคม 2026` /
//     vi `Tháng 7 Năm 2026` 全部认不出 ⇒ 段数 <2 ⇒ 三把锁**静默 return text 集体失效**。
//     实测后果：fr 12/12 标题星座全写 `Cancer`（首月值）、th 12/12 写**本命太阳**；
//     es/vi 星座侥幸正确但**宫位零纠错**（各 3/12 错）。合计 54 处。
//   🔴 缺陷 2（正确性）en 标题宫位锁失效：`houseRe` 只认 `House N`，而实际产出是
//     **序数前置** `7th House` ⇒ Adelaide「12 月标题 12/12」只验了星座，宫位靠 LLM 自觉。
//   🔴 缺陷 3（本地化）th 两处写回表与产出不符：`ดาวอาทิตย์`(行星/星期) 应为
//     `ดวงอาทิตย์`(太阳)；`บ้าน N`(房屋) 应为 `ภพที่ N`(=宫位)。
//   🔴 缺陷 4（正确性）本命豁免只有中文四词 ⇒ en/es 的「物主代词 + 太阳」本命叙述被
//     当作流年值改写（实测 s2/en Adelaide `Your Sun in Sagittarius` 本命射手 → `Gemini`）。
//   🔴 缺陷 5（本地化/观感）en 吞空格粘连 `CancerJupiter`/`GeminiMoon`（4 处）、
//     es 英文宫位混入 `en el 7 House`（9 处）。
//   ⚠️ 泰语专有风险：星座简写是月份名的**前缀**（`กรกฎ` ⊂ `กรกฎาคม`）⇒ 星座写回必须排除
//     月份名内部，否则 `กรกฎาคม 2026: …ในตุลย์` 被写成 `ตุลย์าคม 2026`（月份名被写坏）。
// 本测试: 源码级结构断言 + 块内 vm 抽取行为验证（复刻 test/audit-en-es-zh-lock 的抽取方式）
//        + 【注入缺陷自测】（须复刻旧缺陷, 否则判据无判别力）。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { matchBracket, closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

// ── 与 test/audit-en-es-zh-lock.test.js 同款抽取：SIGNS + BLOCK ──
const SIGNS = ['EN', 'VI', 'TH', 'ZH', 'ES', 'FR'].map((k) => {
  const m = src.match(new RegExp('const SUN_SIGN_' + k + ' = \\[[^\\]]*\\];'));
  if (!m) throw new Error('缺少 SUN_SIGN_' + k);
  return m[0];
}).join('\n');
const BLOCK = src.slice(src.indexOf('const _EN2ZIDX'), src.indexOf('function cleanConsumerTrapAndBrackets'));
if (!BLOCK || BLOCK.length < 10000) throw new Error('未能提取真值锁源码块');

// ⚠️ `_v444Signs` 定义在抽取区间(`_EN2ZIDX`~`cleanConsumerTrapAndBrackets`)之外(`:8133`),
//   而 `lockYearlyMonthTitles`/`lockYearlyTransitSigns` 内部会调用它 ⇒ 必须**手动补抽**,
//   否则 ReferenceError(实测: 5 条判据因此报 '_v444Signs is not defined')。
//   它只引用 SUN_SIGN_*(已在 SIGNS 注入) ⇒ 可安全前置。
const V444_SIGNS_SRC = (() => {
  const m = src.match(/function _v444Signs\(lang\) \{[\s\S]*?\n\}/);
  if (!m) throw new Error('未能抽取 _v444Signs（lockYearlyMonthTitles 依赖它）');
  return m[0];
})();

const EXPORTS = ['_v516MonthHeadKey', '_v516RewriteMonthYear', '_v516SignAlt', '_v516OutputHygiene',
  'lockYearlyMonthTitles', 'lockYearlyTransitSigns', '_V516_MONTHS', '_V516_TH_SIGN_EXCL', '_V516_TH_BE_OFFSET'];
function buildF(source) {
  const block = source.slice(source.indexOf('const _EN2ZIDX'), source.indexOf('function cleanConsumerTrapAndBrackets'));
  const fn = new Function(`${SIGNS}\n${V444_SIGNS_SRC}\n${block}\nreturn { ${EXPORTS.join(', ')} };`);
  return fn();
}
const F = buildF(src);

// ── 假矩阵（复刻引擎产出口径；零 python）──
const _SIGNS_CYCLE = ['Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini'];
function fakeMatrix(houseBase = 5) {
  return { months: _SIGNS_CYCLE.map((s, i) => {
    const mo = ((7 + i - 1) % 12) + 1, y = (7 + i <= 12) ? 2026 : 2027;
    return { month_key: y + '-' + String(mo).padStart(2, '0'), positions: { Sun: { sign: s, house: ((houseBase + i - 1) % 12) + 1 } } };
  }) };
}
const M = fakeMatrix();
const TRUE = (i) => ({ sign: _SIGNS_CYCLE[i], house: ((5 + i - 1) % 12) + 1 });

// ═══════════════════════════════════════════════════════════════════════
// ① 六语月标题识别
// ═══════════════════════════════════════════════════════════════════════
test('① _v516MonthHeadKey 必须识别六语月标题（含泰语佛历）+ 拒非标题行', () => {
  const cases = [
    ['zh', '### 2026年7月: 太阳巨蟹座 第8宫', 2026, 7],
    ['en', '### July 2026: Sun in Cancer · 7th House', 2026, 7],
    ['es', '### Julio 2026: Sol en Cáncer · Casa 5', 2026, 7],
    ['fr', '### Juillet 2026: Soleil en Cancer · Maison 10', 2026, 7],
    ['th', '### กรกฎาคม 2026: ดวงอาทิตย์ในตุลย์ ภพที่ 11', 2026, 7],
    ['th', '### กรกฎาคม พ.ศ. 2569: ดวงอาทิตย์ในตุลย์ ภพที่ 11', 2026, 7],   // 佛历 −543
    ['vi', '### Tháng 7 Năm 2026: Mặt Trời trong Cự Giải · Nhà 10', 2026, 7],
    ['fr', '### Janvier 2027: Soleil en Capricorne · Maison 4', 2027, 1],
    ['vi', '### Tháng 12 Năm 2026: Mặt Trời trong Nhân Mã · Nhà 3', 2026, 12],
  ];
  const bad = [];
  for (const [lang, line, y, mo] of cases) {
    const k = F._v516MonthHeadKey(line, lang);
    if (!k || k.y !== y || k.mo !== mo) bad.push(`${lang}: ${line.slice(0, 40)} → ${JSON.stringify(k)} (期望 ${y}-${mo})`);
  }
  // 非标题行 / 非法月号必须返回 null（否则正文会被误当标题切段）
  for (const [lang, line] of [['fr', 'Soleil en Cancer · Maison 10'], ['es', 'Julio es el mes'],
    ['en', 'July was hard'], ['zh', '2026年7月的财富'], ['fr', '### Maison 10 et plus']]) {
    if (F._v516MonthHeadKey(line, lang) !== null) bad.push(`${lang} 非标题行不应识别: ${line}`);
  }
  assert.deepStrictEqual(bad, [], '识别失败：\n  ' + bad.join('\n  '));
});

// ①' 泰语星座排除：`กรกฎ` 不得吃掉 `กรกฎาคม`
test("①' _v516SignAlt 必须排除泰语月份名内部（กรกฎ ⊄ กรกฎาคม）", () => {
  const re = new RegExp('(' + ['กรกฎ', 'ตุลย์', 'พิจิก'].map((w) => F._v516SignAlt('th', w)).join('|') + ')');
  const line = '### กรกฎาคม 2026: ดวงอาทิตย์ในตุลย์ ภพที่ 11';
  const m = line.match(re);
  assert.ok(m, '应能匹配到星座词');
  assert.strictEqual(m[1], 'ตุลย์', `必须命中「太阳所在的ตุลย์」而非月份名里的กรกฎ，实得 ${m[1]}`);
  assert.ok(!/กรกฎ(?!าคม)/.test(''), '守卫无意义');
  // 反向：単独 `กรกฎ`（真星座）仍必须能匹配
  const m2 = 'ดวงอาทิตย์ในกรกฎ'.match(re);
  assert.ok(m2 && m2[1] === 'กรกฎ', '单独出现的กรกฎ(Cancer)必须仍能匹配');
});

// ═══════════════════════════════════════════════════════════════════════
// ② 年份/月份号写回（各语原生形态 + 泰语保持原历法）
// ═══════════════════════════════════════════════════════════════════════
test('② _v516RewriteMonthYear 必须按各语形态写回（泰语保持原历法）', () => {
  const c = [
    ['zh', '### 2026年9月: 太阳处女座 第3宫', 2026, 7, '2026年7月'],
    ['en', '### September 2026: Sun in Virgo', 2026, 7, 'July 2026'],
    ['es', '### Septiembre 2026: Sol en Virgo', 2026, 7, 'Julio 2026'],
    ['fr', '### Septembre 2026: Soleil en Vierge', 2026, 7, 'Juillet 2026'],
    ['th', '### กันยายน 2026: ดวงอาทิตย์ในกันยา', 2026, 7, 'กรกฎาคม 2026'],
    ['th', '### กันยายน พ.ศ. 2569: ดวงอาทิตย์ในกันยา', 2026, 7, 'กรกฎาคม พ.ศ. 2569'],   // 保持佛历
    ['vi', '### Tháng 9 Năm 2026: Mặt Trời trong Xử Nữ', 2026, 7, 'Tháng 7 Năm 2026'],
  ];
  const bad = [];
  for (const [lang, line, y, mo, want] of c) {
    const out = F._v516RewriteMonthYear(line, lang, y, mo);
    if (!out.includes(want)) bad.push(`${lang}: ${out} 应含「${want}」`);
    // 幂等
    if (F._v516RewriteMonthYear(out, lang, y, mo) !== out) bad.push(`${lang} 幂等失败: ${out}`);
  }
  assert.deepStrictEqual(bad, [], '年份写回失败：\n  ' + bad.join('\n  '));
});

// ── 六语月标题的**原生书写形态**（真源口径；与服务端 SUN_SIGN_* / _V516_MONTHS 同序）──
const ORD = (n) => n + ((n % 10 === 1 && n !== 11) ? 'st' : (n % 10 === 2 && n !== 12) ? 'nd' : (n % 10 === 3 && n !== 13) ? 'rd' : 'th');
// ⚠️ 六语星座名表一律 **Aries 起序**（与 SUN_SIGN_* 一致）。en 不得直接复用 `_SIGNS_CYCLE`
//   —— 后者是「财年 7 月起」的月份序（首元素是 Cancer），用作本地名表会整体错位 3 位。
const SIGN_LOC = {
  zh: ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'],
  en: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  es: ['Aries', 'Tauro', 'Géminis', 'Cáncer', 'Leo', 'Virgo', 'Libra', 'Escorpio', 'Sagitario', 'Capricornio', 'Acuario', 'Piscis'],
  fr: ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'],
  th: ['เมษ', 'พฤษภ', 'มิถุน', 'กรกฎ', 'สิงห์', 'กันยา', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน'],
  vi: ['Bạch Dương', 'Kim Ngưu', 'Song Tử', 'Cự Giải', 'Sư Tử', 'Xử Nữ', 'Thiên Bình', 'Bọ Cạp', 'Nhân Mã', 'Ma Kết', 'Bảo Bình', 'Song Ngư'],
};
const MNAME = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
  th: ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'],
};
// 标题里的「月 + 年」前缀（各语原生形态）—— 也用于校验「星座写回是否误伤月份名」
const MONTH_HEAD = {
  zh: (y, mo) => `${y}年${mo}月`,
  en: (y, mo) => `${MNAME.en[mo - 1]} ${y}`,
  es: (y, mo) => `${MNAME.es[mo - 1]} ${y}`,
  fr: (y, mo) => `${MNAME.fr[mo - 1]} ${y}`,
  th: (y, mo) => `${MNAME.th[mo - 1]} ${y}`,
  vi: (y, mo) => `Tháng ${mo} Năm ${y}`,
};
const SUN_TXT = { zh: '太阳', en: 'Sun in', es: 'Sol en', fr: 'Soleil en', th: 'ดวงอาทิตย์ใน', vi: 'Mặt Trời trong' };
const HOUSE_TXT = {
  zh: (n) => `第${n}宫`, en: (n) => `${ORD(n)} House`, es: (n) => `Casa ${n}`,
  fr: (n) => `Maison ${n}`, th: (n) => `ภพที่ ${n}`, vi: (n) => `Nhà ${n}`,
};
const HOUSE_RE = {
  zh: /第(\d+)宫/, en: /(\d{1,2})(?:st|nd|rd|th)\s+House/, es: /Casa\s*(\d+)/,
  fr: /Maison\s*(\d+)/, th: /ภพที่\s*(\d+)/, vi: /Nhà\s*(\d+)/,
};
// 全 12 月都写成**同一个错值**（末位星座 Pisces + 第 1 宫），复刻线上「首月值/本命值沿用」的真实病态
const WRONG_SIGN = 11, WRONG_HOUSE = 1;
const headLine = (lang, y, mo, signTxt, h) => `### ${MONTH_HEAD[lang](y, mo)}: ${SUN_TXT[lang]} ${signTxt} · ${HOUSE_TXT[lang](h)}`;

// ═══════════════════════════════════════════════════════════════════════
// ③ 月标题逐月真值锁 —— 六语行为（原缺陷：四语静默失效）
// ═══════════════════════════════════════════════════════════════════════
test('③ lockYearlyMonthTitles 必须对 es/fr/th/vi 逐月真值重写（原为静默失效）', () => {
  const bad = [];
  // 真值星座的**本地化**形态：Aries 起序（⚠️ 不能用 _SIGNS_CYCLE —— 它是财年 7 月起序，
  //   用作「本地名表」会整体错位 3 位，首版闸门即因此 en 行全红）
  const ZI = (sign) => ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].indexOf(sign);
  const verify = (lang, lines, rows, tag) => {
    for (const r of rows) {
      const l = lines[r.i] || '';
      const t = TRUE(r.i);
      const wantSign = SIGN_LOC[lang][ZI(t.sign)];
      if (ZI(t.sign) < 0) bad.push(`${tag} ${lang} 第${r.i + 1}行 无法定位真值星座 ${t.sign}`);
      else if (!l.includes(wantSign)) bad.push(`${tag} ${lang} 第${r.i + 1}行缺真值星座 ${wantSign}: ${l}`);
      const hm = l.match(HOUSE_RE[lang]);
      if (!hm || Number(hm[1]) !== t.house) bad.push(`${tag} ${lang} 第${r.i + 1}行宫位应 ${t.house}, 实得 ${hm ? hm[1] : 'null'}: ${l}`);
      // ⚠️ 泰语专有风险：星座写回不得误伤月份名（`กรกฎ` ⊂ `กรกฎาคม` 一类）
      if (!l.startsWith('### ' + MONTH_HEAD[lang](r.y, r.mo))) bad.push(`${tag} ${lang} 第${r.i + 1}行月名被写坏: ${l}`);
    }
  };
  for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
    const rows = [];
    for (let i = 0; i < 12; i++) {
      const mo = ((7 + i - 1) % 12) + 1, y = (7 + i <= 12) ? 2026 : 2027;
      rows.push({ i, mo, y, line: headLine(lang, y, mo, SIGN_LOC[lang][WRONG_SIGN], WRONG_HOUSE) });
    }
    // ① 全 12 月写**同一个错值**（复刻线上「首月值/本命值沿用」病态）⇒ 必须逐月纠为真值
    const out = F.lockYearlyMonthTitles(rows.map((r) => r.line).join('\n'), lang, M, 'yearly');
    verify(lang, out.split('\n'), rows, '错值输入');
    // ② 幂等
    if (F.lockYearlyMonthTitles(out, lang, M, 'yearly') !== out) bad.push(`${lang} 幂等失败`);
    // ③ 反向：**真值输入**不得被改值（防「无脑重写」二次污染；只比真值, 不比字符串 ——
    //   装饰符归一 e.g. 「星座 · 第N宫」→「星座 第N宫」是 V482c 既定行为, 不算误改）
    const cleanRows = rows.map((r) => ({ ...r, line: headLine(lang, r.y, r.mo, SIGN_LOC[lang][ZI(TRUE(r.i).sign)], TRUE(r.i).house) }));
    const out2 = F.lockYearlyMonthTitles(cleanRows.map((r) => r.line).join('\n'), lang, M, 'yearly');
    verify(lang, out2.split('\n'), cleanRows, '真值输入');
  }
  assert.deepStrictEqual(bad, [], '逐月真值重写失败：\n  ' + bad.join('\n  '));
});

// ③' en 序数形态 `7th House` 必须被纠值且后缀重算
test("③' lockYearlyMonthTitles 必须吃 en 序数前置形态并重算后缀", () => {
  const text = ['### July 2026: Sun in Cancer · 1st House', '### August 2026: Sun in Leo · 1st House'].join('\n');
  const out = F.lockYearlyMonthTitles(text, 'en', M, 'yearly');
  const l0 = out.split('\n')[0];
  assert.ok(/5th House/.test(l0), `7 月真值宫位 5 应写成 5th House，实得: ${l0}`);
  assert.ok(!/1th House/.test(out), `后缀未重算(出现 1th House): ${out}`);
});

// ③'' V479 后置本命定语必须剥离（fr/es 习惯 `Soleil natal`）
test("③'' V479 必须剥离后置本命定语（Soleil natal / Sol natal）", () => {
  const text = ['### Juillet 2026: Soleil natal en Cancer · Maison 1', '### Août 2026: Soleil en Lion · Maison 1'].join('\n');
  const out = F.lockYearlyMonthTitles(text, 'fr', M, 'yearly');
  assert.ok(!/Soleil natal/.test(out), `后置 natal 未剥离: ${out.split('\n')[0]}`);
  assert.ok(/Soleil en Cancer/.test(out), `星座被改坏: ${out.split('\n')[0]}`);
});

// ═══════════════════════════════════════════════════════════════════════
// ④ 输出卫生（吞空格粘连 + es 英文宫位混入）
// ═══════════════════════════════════════════════════════════════════════
test('④ _v516OutputHygiene 必须拆粘连、归 es 宫位形态，且零误伤', () => {
  const c = [
    ['en', 'also sextiles The CancerJupiter in Leo (12th House)', 'Cancer Jupiter'],
    ['en', 'also trine The GeminiMoon in Gemini', 'Gemini Moon'],
    ['es', 'Júpiter en el 7 House puede traer', 'en la Casa 7'],
    ['es', 'Con el Sol natal en Aries en el 6 House, tu carrera', 'en la Casa 6'],
    ['es', 'desde el 5 House y hasta', 'desde la Casa 5'],
  ];
  const bad = [];
  for (const [lang, s, want] of c) {
    const o = F._v516OutputHygiene(s, lang);
    if (!o.includes(want)) bad.push(`${lang}: ${o} 应含「${want}」`);
    if (F._v516OutputHygiene(o, lang) !== o) bad.push(`${lang} 幂等失败: ${o}`);
  }
  // 零误伤：正常文本必须原样
  for (const [lang, s] of [['en', 'AstroMatrix · KindredSouls'], ['en', '7th House and 12th House'],
    ['es', 'Júpiter en Leo, Casa 8 natal'], ['es', 'en la 7ª Casa del dinero'], ['zh', '太阳在狮子座第5宫']]) {
    if (F._v516OutputHygiene(s, lang) !== s) bad.push(`误伤: [${lang}] ${s} → ${F._v516OutputHygiene(s, lang)}`);
  }
  assert.deepStrictEqual(bad, [], '输出卫生失败：\n  ' + bad.join('\n  '));
});

// ═══════════════════════════════════════════════════════════════════════
// ⑤ 源码结构断言
// ═══════════════════════════════════════════════════════════════════════
test('⑤ 源码: 三处调用点必须共用 _v516MonthHeadKey（判据同源纪律）', () => {
  const code = stripComments(src);
  const uses = [...code.matchAll(/_v516MonthHeadKey\(ln,\s*lang\)/g)].length;
  assert.ok(uses >= 3, `lockYearlyMonthTitles / lockYearlyTransitSigns / dedupYearlyMonthTitles 必须共用识别真源, 实得 ${uses} 处`);
  // 旧 zh/en-only 识别写法不得残留
  assert.ok(!/_V478_EN_MONTHS\.indexOf\(em\[1\]\) \+ 1/.test(code), '仍残留「lang === en 才识别」的旧写法');
  assert.ok(/function _v516Esc\(s\)/.test(code), '缺少自带转义器 _v516Esc（复用 _v444Esc 会在抽取区间外 ReferenceError）');
  assert.ok(!/_v516GlueRe[\s\S]{0,600}?_v444Esc\(/.test(code), '_v516GlueRe 不得复用 _v444Esc');
  // lockYearlyTransitSigns 本命豁免必须多语（否则物主句被当流年值改写）
  assert.ok(/本命\|出生\|原生\|本盘/.test(code), '本命豁免缺中文四词');
  assert.ok(/natale\?s\?/.test(code) && /\\bnative/.test(code) && /of birth/.test(code), '本命豁免缺拉丁语形态');
  assert.ok(/\\btu/.test(code) && /\\bvotre/.test(code) && /\\bnotre/.test(code), '本命豁免缺罗曼语物主代词');
  // th 写回表拼写（三张写作表：标题引导词 / 标题宫位词 / 提示词月锁表）
  assert.ok(/th: 'ดวงอาทิตย์ใน'/.test(src), '_V482B_TITLE_LEAD.th 必须为 ดวงอาทิตย์ใน');
  assert.ok(/th: \(n\) => 'ภพที่ ' \+ n/.test(src), '_V482B_TITLE_HOUSE.th 必须为 ภพที่ N');
  assert.ok(/th: 'ดวงอาทิตย์ใน '/.test(src), '_V482B_SUN_LEAD.th 必须为 ดวงอาทิตย์ใน ');
  assert.ok(src.replace(/\s+/g, ' ').includes("[i + 1, 'ภพที่ ' + (i + 1)]"), 'HOUSE_LOCKS.th 必须为 ภพที่ N');
  // 输出卫生守卫必须挂在 _v432Normalize 之前（否则归一化先跑, 粘连已成形）
  const hygienAt = code.indexOf('_v516OutputHygiene(out, lang)');
  const normAt = code.indexOf('_v432Normalize(out, lang)');
  assert.ok(hygienAt > 0 && normAt > hygienAt, '_v516OutputHygiene 必须先于 _v432Normalize');
});

// ═══════════════════════════════════════════════════════════════════════
// ⑥ house_linter 月锚点必须覆盖 es/fr 全 12 月名（原表只有英文 12 月 ⇒ 跨月串段）
//   实测依据（2026-10-04 v513 线上 raw 产物）：es 命中 8/12、fr 命中 **5/12**；
//   未命中月份的正文被并入上一个命中月的段 ⇒ 用错月数据改写宫位
//   （fr：Décembre←Novembre 的值、Février←Janvier、Avril/Mai←Mars）。
// ═══════════════════════════════════════════════════════════════════════
function buildHL(source) {
  const seeds = ['house_linter', '_v483bMonthYM', '_sunOf'];
  const { map } = closureDecls(source, seeds, ['getH', 'fromCN', 'toCN', 'forceSpaceHouseSanitizer']);
  const missing = seeds.filter((n) => !map.has(n));
  if (missing.length) throw new Error('VM 未能抽取 ' + missing.join(', '));
  const ctx = { console, setTimeout, clearTimeout, Buffer, __exports: {} };
  vm.createContext(ctx);
  const body = [...map.entries()]
    .sort((a, b) => source.indexOf(a[1]) - source.indexOf(b[1])).map((e) => e[1]).join('\n\n');
  vm.runInContext(body + '\n' + seeds.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
// house_linter 的月锚点分支：每段用「本节月份的太阳真值」改写行星宫位
const HL_SUNHOUSE = { es: (mo) => `Sol en Leo · Casa ${9}`, fr: (mo) => `Soleil en Lion · Maison 9` };
function hlFixture(lang) {
  const rows = [];
  for (let i = 0; i < 12; i++) {
    const mo = ((7 + i - 1) % 12) + 1, y = (7 + i <= 12) ? 2026 : 2027;
    rows.push(`### ${MONTH_HEAD[lang](y, mo)}: ${HL_SUNHOUSE[lang]()}\nCuerpo del mes: ${HL_SUNHOUSE[lang]()} y más texto de relleno para el mes.`);
  }
  return rows.join('\n');
}
test('⑥ house_linter 月锚点必须覆盖 es/fr 全 12 月名（否则跨月串段用错月数据）', () => {
  const H = buildHL(src);
  const bad = [];
  for (const lang of ['es', 'fr']) {
    const M2 = fakeMatrix();   // 每月太阳宫位：5,6,7,...,12,1,2,3,4
    const out = H.house_linter(hlFixture(lang), M2, null, { strictAnchor: true });
    const lines = out.split('\n');
    for (let i = 0; i < 12; i++) {
      const t = TRUE(i);
      const bodyLine = lines[i * 2 + 1] || '';
      const hm = bodyLine.match(HOUSE_RE[lang]);
      if (!hm || Number(hm[1]) !== t.house) {
        bad.push(`${lang} 第${i + 1}月正文宫位应 ${t.house}, 实得 ${hm ? hm[1] : 'null'}: ${bodyLine.slice(0, 80)}`);
      }
    }
  }
  assert.deepStrictEqual(bad, [], '月锚点覆盖不足（跨月串段）：\n  ' + bad.join('\n  '));
});

// ═══════════════════════════════════════════════════════════════════════
// ⑦ 六语行星词表覆盖: house_linter 三张识别表 × 六语 必须零缺口
//   真源：en/es/zh ← _V432_NAME；fr ← _FR_PLANET；th ← _TH_PLANET；vi ← _VI_PLANET
//   实测缺口（2026-10-04 批测）：th 太阳/月亮只有 `ดาว-` 形态（产出为 `ดวง-` ⇒ 整体空转）、
//   es 缺 `Mercurio`/`Marte`（原表只有法语 `Mercure`）。
// ═══════════════════════════════════════════════════════════════════════
function grabObj(source, name) {
  const at = source.indexOf('const ' + name + ' = {');
  if (at < 0) throw new Error('缺少 ' + name);
  const open = source.indexOf('{', at);
  return new Function('return ' + source.slice(open, matchBracket(source, open)))();
}
const CAP_KEY = { sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto' };
function coverageGaps(source) {
  const V432 = grabObj(source, '_V432_NAME');
  const TRUTH = { zh: V432.zh, en: V432.en, es: V432.es, fr: grabObj(source, '_FR_PLANET'), th: grabObj(source, '_TH_PLANET'), vi: grabObj(source, '_VI_PLANET') };
  const bad = [];
  for (const tn of ['NAME_MAP_ALL', 'NAME_MAP', 'NAME_MAP2']) {
    const tab = grabObj(source, tn);
    for (const k of Object.keys(CAP_KEY)) {
      const row = tab[k];
      if (!row) continue;                       // RULES 未用到的行星行可缺（如 NAME_MAP 的 mercury/venus/mars）
      for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
        const want = TRUTH[lang][CAP_KEY[k]];
        if (want === undefined) continue;
        // th 木星允许口语短形
        if (!row.includes(want) && !(k === 'jupiter' && lang === 'th' && row.includes('ดาวพฤหัส'))) {
          bad.push(`${tn}.${k} 缺 ${lang}「${want}」 现有=[${row.join(', ')}]`);
        }
      }
    }
  }
  return bad;
}
test('⑦ 六语行星词表覆盖: NAME_MAP 三表 × 六语 必须零缺口', () => {
  const bad = coverageGaps(src);
  assert.deepStrictEqual(bad, [], '行星识别词表有缺口（对应行星的宫位纠偏整体空转）：\n  ' + bad.join('\n  '));
});

// ═══════════════════════════════════════════════════════════════════════
// ⑧ 注入缺陷自测（每一条都必须复刻旧缺陷 ⇒ 判据必红）
// ═══════════════════════════════════════════════════════════════════════
test('【注入】禁掉 _v516MonthHeadKey 的泰语分支 → ① 泰语识别必红', () => {
  // 复刻旧缺陷 = 泰语**整体失明** ⇒ 必须同时禁掉 ② 泰语专用分支 与 ④ 通用月名兜底。
  // ⚠️ 只禁 ② 不足以复刻：④ 的 `_V516_MONTHS[lang]` 对 th 非空 ⇒ `กรกฎาคม 2026` 仍被兜底认出
  //    （首版闸门即因此假红 —— 注入成功却仍识别 ⇒ 判据看似「无判别力」）。
  const deg = src.replace('  if (lang === \'th\') {\n    for (let i = 0; i < 12; i++) {\n      if (s.indexOf(_V516_MONTHS.th[i]) < 0) continue;',
    '  if (false) {\n    for (let i = 0; i < 12; i++) {\n      if (s.indexOf(_V516_MONTHS.th[i]) < 0) continue;');
  assert.notStrictEqual(deg, src, '未成功注入（未匹配泰语专用分支）');
  const deg2 = deg.replace('const words = _V516_MONTHS[lang];', "const words = (lang === 'th') ? null : _V516_MONTHS[lang];");
  assert.notStrictEqual(deg2, deg, '未成功注入（未匹配通用月名兜底）');
  const G = buildF(deg2);
  assert.strictEqual(G._v516MonthHeadKey('### กรกฎาคม 2026: ดวงอาทิตย์ในตุลย์ ภพที่ 11', 'th'), null,
    '闸门失效：泰语分支被禁后仍识别成功');
  // 佛历形态是 ② 专用分支唯一能处理的行 —— 一并必须失明（判据对 ② 有判别力）
  assert.strictEqual(G._v516MonthHeadKey('### กรกฎาคม พ.ศ. 2569: ดวงอาทิตย์ในตุลย์ ภพที่ 11', 'th'), null,
    '佛历形态未被禁 ⇒ 判据对泰语专用分支无判别力');
});

test('【注入】把识别强制为 en → ③ es/fr/th/vi 逐月锁必红', () => {
  const deg = src.replace("const _vk = _v516MonthHeadKey(ln, lang);\n    if (!_vk) continue;\n    const y = _vk.y, mo = _vk.mo;\n    const key = y * 12 + mo;\n    let g = keyOf.get(key);",
    "const _vk = _v516MonthHeadKey(ln, 'en');\n    if (!_vk) continue;\n    const y = _vk.y, mo = _vk.mo;\n    const key = y * 12 + mo;\n    let g = keyOf.get(key);");
  assert.notStrictEqual(deg, src, '未成功注入（未匹配 lockYearlyMonthTitles 识别点）');
  const G = buildF(deg);
  const text = ['### Juillet 2026: Soleil en Cancer · Maison 1', '### Août 2026: Soleil en Cancer · Maison 1'].join('\n');
  const out = G.lockYearlyMonthTitles(text, 'fr', M, 'yearly');
  assert.ok(out.includes('Soleil en Cancer'), '闸门失效：强制 en 后 fr 标题竟仍被改写');
});

test("【注入】去掉泰语星座排除 → ①' 月份名被写坏必红", () => {
  const deg = src.replace('const ex = (lang === \'th\' && _V516_TH_SIGN_EXCL[word]) ? (\'(?!\' + _V516_TH_SIGN_EXCL[word] + \')\') : \'\';',
    'const ex = \'\';');
  assert.notStrictEqual(deg, src, '未成功注入（未匹配泰语排除构造）');
  const G = buildF(deg);
  const re = new RegExp('(' + ['กรกฎ', 'ตุลย์'].map((w) => G._v516SignAlt('th', w)).join('|') + ')');
  const m = '### กรกฎาคม 2026: ดวงอาทิตย์ในตุลย์ ภพที่ 11'.match(re);
  assert.strictEqual(m && m[1], 'กรกฎ', '闸门失效：去掉排除后仍未误吃月份名（判据无判别力）');
});

test('【注入】禁掉吞空格粘连拆合 → ④ en 粘连必红', () => {
  const deg = src.replace("  let t = text.replace(_v516GlueRe(), '$1 ');", '  let t = text;');
  assert.notStrictEqual(deg, src, '未成功注入（未匹配粘连拆合调用）');
  const G = buildF(deg);
  const o = G._v516OutputHygiene('sextiles The CancerJupiter in Leo', 'en');
  assert.ok(o.includes('CancerJupiter'), '闸门失效：拆合被禁后粘连竟被修好');
});

test('【注入】禁掉后置本命定语剥离 → ③\'\' 必红', () => {
  const deg = src.replace("        line = line.replace(new RegExp('\\\\b(Sun|Sol|Soleil|Moon|Luna|Lune|Mercury|Mercure|Venus|Mars|Jupiter|Saturne|Saturn|Uranus|Neptune|Pluton|Pluto)\\\\s+natal(?:e?s)?\\\\b', 'gi'), '$1');",
    '        void 0;');
  assert.notStrictEqual(deg, src, '未成功注入（未匹配后置 natal 剥离）');
  const G = buildF(deg);
  const text = ['### Juillet 2026: Soleil natal en Cancer · Maison 1', '### Août 2026: Soleil en Lion · Maison 1'].join('\n');
  const out = G.lockYearlyMonthTitles(text, 'fr', M, 'yearly');
  assert.ok(/Soleil natal/.test(out), '闸门失效：剥离被禁后 natal 竟仍被剥离');
});

test('【注入】house_linter 月锚点退回「只认英文 12 月名」 → ⑥ 必红', () => {
  const deg = src.replace("for (const _l of ['en', 'es', 'fr']) for (let i = 0; i < 12; i++) _ANCHOR_ALT.push([_V516_MONTHS[_l][i], i + 1]);",
    "for (const _l of ['en']) for (let i = 0; i < 12; i++) _ANCHOR_ALT.push([_V516_MONTHS[_l][i], i + 1]);");
  assert.notStrictEqual(deg, src, '未成功注入（未匹配月锚点词表构造）');
  const H = buildHL(deg);
  const out = H.house_linter(hlFixture('fr'), fakeMatrix(), null, { strictAnchor: true });
  const bodyLine = (out.split('\n')[1] || '');
  const hm = bodyLine.match(HOUSE_RE.fr);
  assert.ok(!hm || Number(hm[1]) !== TRUE(0).house,
    '闸门失效：月锚点退回英文后 fr 正文竟仍被正确纠偏 ⇒ 判据无判别力');
});

test('【注入】从 NAME_MAP_ALL 删掉泰语正字 → ⑦ 必红', () => {
  const deg = src.replace("'ดาวอาทิตย์', 'ดวงอาทิตย์', 'Mặt Trời'", "'ดาวอาทิตย์', 'Mặt Trời'");
  assert.notStrictEqual(deg, src, '未成功注入（未匹配泰语正字词条）');
  const gaps = coverageGaps(deg);
  assert.ok(gaps.length > 0, '闸门失效：删掉泰语正字后六语覆盖判据竟仍通过');
});

test('【注入】HOUSE_LOCKS.th 退回 `บ้าน N` → ⑤ 的泰语宫位词判据必红', () => {
  const deg = src.replace("[i + 1, 'ภพที่ ' + (i + 1)]", "[i + 1, 'บ้าน ' + (i + 1)]");
  assert.notStrictEqual(deg, src, '未成功注入（未匹配 HOUSE_LOCKS.th）');
  assert.ok(!deg.replace(/\s+/g, ' ').includes("[i + 1, 'ภพที่ ' + (i + 1)]"),
    '闸门失效：退回 `บ้าน` 后泰语宫位词判据竟仍通过');
});
