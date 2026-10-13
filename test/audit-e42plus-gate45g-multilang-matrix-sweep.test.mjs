/**
 * Gate 45-G（E42+ 45-G）· 「12 黄金样本三板块全语言真值穿透大阅兵」闸门
 *
 * 【战役背景】军师 2026-10-13 攻坚令。12 组黄金样本 × 6 语 × 3 板块实弹压测（216 份真生成），
 *   暗雷全谱捕获，其中**根因级**四条（本闸门逐一固化）：
 *
 *   🔴 Mine A · **致命极限环**（v69_client.js `_ksScanHouseClaims` 第③段）
 *      原式 `(_ctx GAP2 planet | planet GAP2 _ctx) GAP2 house` 把**宫主星句式**误读为**落宫句式**：
 *        · zh「**你的**死穴是「第1宫主星**木星**落陷+第1宫主星火星在第1宫」」——`_ctx` 含「你的」且
 *          GAP2 宽 10 字，可越过「第1宫主星」把「木星」接上**后一句**的宫位令牌；
 *        · en「Mercury **rules your** 8th house」——`planet GAP2 _ctx` 以 `rules your` 为桥。
 *      一旦改写即与**宫主星锁**互为逆运算 ⇒ **2-周期极限环**，撞 4 轮上限必然带病交付。
 *      另：`m[0].indexOf(hTok)` 取**首次**出现，正则实匹**末次** ⇒ 改写落错位置，凭空造新幻觉。
 *      治法（三重守卫，宁漏不改）：① 头窗 ② 桥窗 ③ 末次定位。
 *
 *   🔴 Mine D · **cusp 裸式误读轨迹记号**（同函数第②段）
 *      月报「the transiting Moon … Libra **(House 10→House 11→House 12)**」的**过境轨迹括号**被
 *      `Sign (House N)` 裸式读作宫头声称 ⇒ 审计假阳；若月报启用宫位锁会**篡改轨迹句**。
 *
 *   🔴 Mine C · **双轨主星被误判矛盾**（`lintHouseRulersAndCups`）
 *      「H11=火星/冥王」「H2=土星/天王」等**古典/现代双轨**合规叙述被冲突检测误报为同篇自相矛盾
 *      （大阅兵实测 8 例假阳）。治法：ruler 类矛盾须**至少一值落在该宫合法双轨集之外**。
 *
 *   🔴 Mine B · **非中文语种夹中文功能词**（server.js `stripForeignChineseGlue`）
 *      th 报告混入「因为你」×2 /「主导」/「因为它」，踩 Gate 39「小语种禁夹中文」红线。
 *      既有 V477 仅守「zh 报告不被吃字」，**非中文语种夹中文零守卫**（射程缺口）。
 *
 *   🔴 Mine F · **本命星座锁射程缺口**（server.js `applyOnceNatalSignLock`）
 *      S07 en monthly 实测「your natal Mercury in **Scorpio**」（真值 Leo）——月报/年报的
 *      本命星座幻觉**批量留存**，根因即该锁门控只认 `once`。
 *
 * 【闸门纪律】
 *   · 禁词/计数扫描**只扫真值块**（剥注释后再扫）；存在性断言用原始源码。
 *   · 注入反漂移：谓词主测与注入自测**同源取用**；E 组以**真实源码篡改 ⇒ 判据必红**。
 *   · 段位守备：**下界 + 相对位置**（禁精确段数 —— Gate41 血训）。
 *   · 行为真值优先：能跑实现的就**跑实现**（直接 import / 源码抽取 + `new Function`）。
 *   · 期望值：星座/行星名取 astroTerms.js 唯一真值源；中文功能词本地化**词表即契约**（无共享字典）。
 *
 * 【纯 Node 运行】无网络 / 无 LLM / 无 Python。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SERVER = readFileSync(join(ROOT, 'server.js'), 'utf8');
const CLIENT = readFileSync(join(ROOT, 'v69_client.js'), 'utf8');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

/* ── 剥离注释（真值块）——「禁词/计数扫描只扫真值块」铁律 ──
   ⚠️ V318 血训：本文件内含「失衡 `/*`」形态 ⇒ stripJs 只用于**已切片的小段**，禁跑整份 server.js。 */
const stripJs = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/* ═══════════ 源码抽取器（VM 抽取式消费者：禁改 import，保内联字面量）═══════════ */
const extractFn = (src, name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return null;
  const e = src.indexOf('\n}\n', i);
  return e < 0 ? null : src.slice(i, e + 3);
};
/* Mine B 抽取：表 + 函数（二者相邻，同段截取） */
const extractGlueScrubber = (src) => {
  const iTab = src.indexOf('const _FOREIGN_GLUE_TABLE = [');
  const iFn = src.indexOf('function stripForeignChineseGlue(');
  if (iTab < 0 || iFn < 0 || iFn < iTab) return null;
  const e = src.indexOf('\n}\n', iFn);
  return e < 0 ? null : src.slice(iTab, iFn) + src.slice(iFn, e + 3);
};

/* ═══════════ 源码判据（主测与注入自测同源取用）═══════════ */

/* A1 Mine A（一/二）：头窗 + 桥窗守卫 */
const hasPlanetHouseWindowGuard = (src) =>
  src.includes('const _guardWinRe = (() => {')
  && src.includes("new RegExp('(?:' + RW + '|' + CK + '|' + _KS_HNUM_SRC[lex.lang] + ')')")
  && src.includes("const head = '(?:(?<w1>' + _ctx + GAP2 + pEsc + ')|(?<w2>' + pEsc + GAP2 + _ctx + '))';")
  && src.includes("const re = new RegExp(head + '(?<br>' + GAP2 + ')(?<hh>' + _KS_HNUM_SRC[lex.lang] + ')', 'gi');")
  && src.includes("if (_guardWinRe && _guardWinRe.test((g2.w1 || '') + '\\u0000' + (g2.w2 || '') + '\\u0000' + (g2.br || ''))) continue;")
  && src.includes("const hTok = g2.hh || '';");

/* A1b Mine A（三）：末次定位 */
const hasLastOccurrenceAnchor = (src) =>
  src.includes('const relH = mm[0].length - hTok.length;')
  && !src.includes('const relH = mm[0].indexOf(hTok);');

/* A2 Mine D：括号 / 箭头轨迹记号守卫 */
const hasTrajectoryMarkGuard = (src) =>
  src.includes('const _gap = m[0].slice(m[0].indexOf(sTok) + sTok.length, m[0].lastIndexOf(hTok));')
  && src.includes('const _af = text.slice(m.index + m[0].length, m.index + m[0].length + 2);')
  && src.includes('if (/[(（]/.test(_gap) || /^(?:→|->)/.test(_af)) continue;')
  && src.includes('if (bareS) {');

/* A3 Mine C：双轨主星冲突豁免 */
const hasDualTrackExemption = (src) =>
  src.includes('const _hrAll = (astroMatrix && astroMatrix.meta && astroMatrix.meta.house_rulers) || null;')
  && src.includes("for (const t of ['classical', 'modern']) {")
  && src.includes('if (_valid.length && vals.every((v) => _valid.indexOf(v) >= 0)) continue;');

/* A4 Mine B：本地化核（闭集 + zh 射程外 + split/join） */
const hasForeignGlueScrubber = (src) => {
  const body = extractFn(src, 'stripForeignChineseGlue') || '';
  return src.includes('const _FOREIGN_GLUE_TABLE = [')
    && body.includes("if (!lang || lang === 'zh') return text;")
    && body.includes('out = out.split(cn).join(rep);')
    && body.includes('if (!rep || out.indexOf(cn) < 0) continue;');
};

/* A5 Mine B：双通路接线（与 vi 清洗同位） */
const hasForeignGlueWiring = (src) => {
  const iS = src.indexOf("app.post('/api/wealth-oracle/stream'");
  if (iS < 0) return false;
  const a = src.slice(0, iS), b = src.slice(iS);
  return a.includes('reportContent = stripForeignChineseGlue(reportContent, lang);')
    && b.includes('cleanedText = stripForeignChineseGlue(cleanedText, lang);');
};

/* A6 Mine F：本命星座锁三板块门控 */
const hasSignLockWideScope = (src) => {
  const body = extractFn(src, 'applyOnceNatalSignLock') || '';
  return body.includes("if (reportType !== 'once' && reportType !== 'monthly' && reportType !== 'yearly') return text;")
    && !/if \(reportType !== 'once'\) return text;/.test(body);
};

/* ═══════════ 合成真值盘（确定性 · 无需 Python）═══════════
   上升射手 ⇒ H1 宫头射手 ⇒ 法定主星木星（Mine A 的「合法宫主星句」载体）。
   双轨差异宫：H3 水瓶（土星/天王）、H4 双鱼（木星/海王）、H12 天蝎（火星/冥王）。
   真值落座刻意避开与宫头星座相撞的歧义：木星 = 巨蟹 H8（非 H1）。 */
const CUSP_SIGNS = ['Sagittarius', 'Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus',
  'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio'];
const CLAS_RULERS = ['Jupiter', 'Saturn', 'Saturn', 'Jupiter', 'Mars', 'Venus',
  'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars'];
const MODN_RULERS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Mars', 'Venus',
  'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Pluto'];
const NATAL_SEAT = {
  Sun: { sign: 'Leo', house: 9 }, Moon: { sign: 'Cancer', house: 8 },
  Mercury: { sign: 'Gemini', house: 7 }, Venus: { sign: 'Libra', house: 11 },
  Mars: { sign: 'Scorpio', house: 12 }, Jupiter: { sign: 'Cancer', house: 8 },
  Saturn: { sign: 'Capricorn', house: 2 }, Uranus: { sign: 'Aquarius', house: 3 },
  Neptune: { sign: 'Pisces', house: 4 }, Pluto: { sign: 'Scorpio', house: 12 },
};
const MX = {
  meta: {
    rising_sign: 'Sagittarius', sun_sign: 'Leo',
    computed_houses: NATAL_SEAT,
    natal_moon: { sign: 'Cancer', house: 8 },
    house_cusps_full: CUSP_SIGNS.reduce((a, s, i) => {
      a['house_' + (i + 1)] = { sign: s, cusp_degree: i * 30, degree_in_sign: 0 };
      return a;
    }, {}),
    house_rulers: CUSP_SIGNS.reduce((a, s, i) => {
      const c = CLAS_RULERS[i], mm = MODN_RULERS[i];
      a['house_' + (i + 1)] = {
        cusp_sign: s,
        classical: { planet: c, ...(NATAL_SEAT[c] || { sign: '?', house: 1 }) },
        modern: { planet: mm, ...(NATAL_SEAT[mm] || { sign: '?', house: 1 }) },
      };
      return a;
    }, {}),
  },
};

const fakeConsole = { log() {}, warn() {}, error() {} };
const loadClient = () => import(pathToFileURL(join(ROOT, 'v69_client.js')).href);

/* ═══════════ 行为判据（供 B/C 两组同源取用；返回违规列表，空 = 通过）═══════════ */

/* Mine A：宫主星句式不得被误读为「行星落宫」声称（否则产出 planet_house 违背 + 错位改写） */
function judgeRulerAsHouseOverread(mod) {
  const bad = [];
  const cases = [
    ['zh', '你的死穴是「第1宫主星木星落陷+第1宫主星火星在第1宫」的冲动与赌性。'],
    ['en', 'Mercury rules your 8th house, which colours your mind.'],
  ];
  for (const [lang, src] of cases) {
    const l = mod.lintHouseRulersAndCups(src, lang, MX);
    const ph = l.violations.filter((v) => v.kind === 'planet_house');
    if (ph.length) bad.push(`[${lang}] 宫主星句式被误读为落宫句式（planet_house 违背 ${ph.length} 处）：${src}`);
  }
  // 错位改写判据：合法「第1宫主星木星」（H1 射手 ⇒ 真值木星）不得被改写
  const zh = cases[0][1];
  const r = mod.correctHouseRulersAndCups(zh, 'zh', MX);
  if (!r.text.includes('第1宫主星木星落陷')) bad.push('[zh] 合法宫主星句被错位改写：' + r.text);
  // en 侧：宫号必须留在原地（H8），不得被落宫锁挪走
  const re = mod.correctHouseRulersAndCups(cases[1][1], 'en', MX);
  if (!/rules your 8th house/.test(re.text)) bad.push('[en] 宫号被落宫锁错位改写：' + re.text);
  return bad;
}

/* Mine D：轨迹/落座括号记号 ⇒ 零声称 + 原句零改动 */
function judgeTrajectoryMark(mod) {
  const bad = [];
  const cases = [
    ['en', 'The transiting Moon passes through Virgo (House 10), Libra (House 10→House 11→House 12), Scorpio (House 12).'],
    ['zh', '流月月亮依次行经处女座（第10宫）、天秤座（第10宫→第11宫→第12宫）。'],
  ];
  for (const [lang, src] of cases) {
    const l = mod.lintHouseRulersAndCups(src, lang, MX);
    if (l.checked !== 0) bad.push(`[${lang}] 轨迹记号被读作宫头声称（checked=${l.checked}）`);
    const r = mod.correctHouseRulersAndCups(src, lang, MX);
    if (r.text !== src) bad.push(`[${lang}] 轨迹句被擅改：${r.text}`);
  }
  return bad;
}

/* Mine C：双轨合规零矛盾零改动 + 双轨集外真矛盾仍必判 */
function judgeDualTrackRuler(mod) {
  const bad = [];
  const okCases = [
    '水瓶座第3宫由土星主管，第3宫的主星也可以是天王星。',
    '天蝎座第12宫由火星主管，第12宫的主星也可以是冥王星。',
  ];
  for (const s of okCases) {
    const l = mod.lintHouseRulersAndCups(s, 'zh', MX);
    if (l.conflicts.length) bad.push('双轨主星被误报为同篇矛盾：' + s + ' → ' + JSON.stringify(l.conflicts));
    if (!l.passed) bad.push('双轨主星被误报为违背：' + s);
    const r = mod.correctHouseRulersAndCups(s, 'zh', MX);
    if (r.text !== s) bad.push('合规双轨主星被擅改：' + r.text);
  }
  // 真矛盾（双轨集外）：H12 天蝎 ⇒ 火星/冥王，太阳/月亮皆外 ⇒ 必判
  const badCase = '第12宫由太阳主管，第12宫的主星是月亮。';
  const l2 = mod.lintHouseRulersAndCups(badCase, 'zh', MX);
  if (!l2.conflicts.some((x) => x.kind === 'ruler' && x.key === 'H12')) {
    bad.push('双轨集外的真矛盾未被判出（豁免过宽 ⇒ 漏掉真幻觉）');
  }
  return bad;
}

/* Mine B：中文功能词本地化契约（词表即契约；无共享字典 ⇒ 期望值直书） */
function judgeForeignGlue(fn, warns) {
  const bad = [];
  const CJK = /[\u4e00-\u9fff]/;
  // ① 纯闭集输入 ⇒ 输出零 CJK，且命中该语种译文
  const pure = [
    ['th', 'แต่因为你มีดาวเนปจูนในเรือนที่ 2', 'เพราะคุณ'],
    ['th', 'สอดคล้องกับธาตุไฟ主导ในดวงของคุณ', 'หลัก'],
    ['th', 'คุณอาจถูกกระตุ้นให้ใช้จ่ายเกินตัวเพื่อ填补ความไม่มั่นใจ', 'เติมเต็ม'],
    ['en', 'You feel it because you care.', 'because you'],
    ['en', 'Take it或者 leave it.', 'or'],
    ['es', 'Sientes porque tú te importa.', 'porque tú'],
    ['fr', 'Tu le sens parce que vous aimez.', 'parce que vous'],
    ['vi', 'Bạn cảm thấy bởi vì bạn quan tâm.', 'bởi vì bạn'],
  ];
  for (const [lang, src, want] of pure) {
    const out = fn(src, lang);
    if (CJK.test(out)) bad.push(`[${lang}] 闭集功能词未本地化，仍夹中文：${out}`);
    if (!out.includes(want)) bad.push(`[${lang}] 未按词表本地化为「${want}」：${out}`);
  }
  // ② 长词优先（「因为你」不得被「因为」拆成两段替换）
  if (fn('因为你', 'th') !== 'เพราะคุณ') bad.push('长词优先失守：因为你 → ' + fn('因为你', 'th'));
  if (fn('因为它', 'en') !== 'because it') bad.push('长词优先失守：因为它 → ' + fn('因为它', 'en'));
  // ②b 全量替换（同篇重复出现须逐次替换 —— 线上 th 实录恰为同一功能词出现 2 次）
  if (fn('因为你因为你', 'th') !== 'เพราะคุณเพราะคุณ') bad.push('重复出现未全量替换：' + fn('因为你因为你', 'th'));
  // ③ 闭集外残留 CJK **只告警、绝不静默删字**（吞字铁律）
  const leftover = fn('因为它很重要', 'th');
  if (!leftover.includes('很重要')) bad.push('闭集外中文被静默删除（吞字）：' + leftover);
  // ④ zh 射程外（中文即母语 ⇒ 一字不动）
  for (const s of ['因为你很重要', '其实主导一切，因此所以但是']) {
    if (fn(s, 'zh') !== s) bad.push('[zh] 射程外文本被改动：' + s);
  }
  // ⑤ 未知语言 / 空 / 非串 ⇒ 原样返回（绝不崩）
  if (fn('因为你', 'xx') !== '因为你') bad.push('未知语言未零动作');
  if (fn('', 'th') !== '') bad.push('空串未原样返回');
  if (fn(null, 'th') !== null) bad.push('null 未原样返回（崩）');
  if (fn(undefined, 'th') !== undefined) bad.push('undefined 未原样返回（崩）');
  if (fn(123, 'th') !== 123) bad.push('非字符串未原样返回');
  // ⑥ 告警通路在位（闭集外残留须留痕）
  if (!warns.length) bad.push('闭集外残留未告警（留痕缺口）');
  return bad;
}

/* ═══════════ A 组：修复在位（源码级真值）═══════════ */

test('A1 Mine A · 落宫声称扫描的「头窗 + 桥窗」守卫在位（三重守卫之一二）', () => {
  assert.ok(hasPlanetHouseWindowGuard(CLIENT),
    '头窗/桥窗守卫任一要素缺失（守卫正则 / 命名组 w1·w2·br·hh / NUL 分隔调用）');
});

test('A1b Mine A · 「末次定位」在位（宫位捕捉组恒在式末；禁 indexOf 首现）', () => {
  assert.ok(hasLastOccurrenceAnchor(CLIENT),
    '末次定位失效：同窗同令牌出现两次即改写错位 ⇒ 凭空造新幻觉');
});

test('A2 Mine D · 宫头裸声称式的「括号 / 箭头轨迹记号」守卫在位', () => {
  assert.ok(hasTrajectoryMarkGuard(CLIENT),
    '轨迹记号守卫缺失或未限定 Sign 先式（bareS）⇒ 月报过境轨迹句会被当宫头声称（假阳 + 篡改）');
});

test('A3 Mine C · 双轨主星冲突豁免（须与检出核同源取用 house_rulers 真值）', () => {
  assert.ok(hasDualTrackExemption(CLIENT),
    '双轨豁免缺失（须取 classical/modern 双轨集，且「全部值皆落在集内」才豁免 ⇒ 真矛盾仍必判）');
});

test('A4 Mine B · 非中文语种「中文粘连词」本地化核在位（闭集 + 长词优先 + split/join + zh 射程外）', () => {
  assert.ok(hasForeignGlueScrubber(SERVER), '本地化核要素缺失（表 / 函数 / zh 射程外 / split-join / 缺映射守卫）');
  const GLUE = ['因为你', '因为它', '因为', '所以', '但是', '而且', '以及', '并且', '或者', '如果', '主导', '填补', '其实', '因此'];
  for (const g of GLUE) assert.ok(SERVER.includes("['" + g + "',"), '词表缺成员：' + g);
  const iLong = SERVER.indexOf("['因为你',");
  const iShort = SERVER.indexOf("['因为',");
  assert.ok(iLong > 0 && iShort > iLong, '词表顺序失守（长词「因为你」必须先于短词「因为」）');
  for (const lang of ['en', 'es', 'fr', 'th', 'vi']) {
    assert.ok(SERVER.includes(lang + ": '"), '词表缺语种映射：' + lang);
  }
  // 闭集外的中文残留**只告警不删字**：真值块内须有告警分支
  const body = stripJs(extractFn(SERVER, 'stripForeignChineseGlue') || '');
  assert.ok(/console\.warn\(/.test(body), '缺闭集外残留在位告警（留痕缺口）');
  assert.ok(!/\.replace\(|\.replaceAll\(/.test(body), '出现正则式替换（split/join 纪律失守）');
});

test('A5 Mine B · 双通路接线（非流式 + 流式，且与 vi 清洗同位）', () => {
  assert.ok(hasForeignGlueWiring(SERVER),
    '双通路接线缺失（非流式 reportContent / 流式 cleanedText 任一断链）');
  const iS = SERVER.indexOf("app.post('/api/wealth-oracle/stream'");
  const a = SERVER.slice(0, iS), b = SERVER.slice(iS);
  assert.ok(a.indexOf('reportContent = stripForeignChineseGlue') > a.lastIndexOf('reportContent = fixVietnameseCorruption('),
    '非流式通道次序错误（须与 vi 清洗同位、居其后）');
  assert.ok(b.indexOf('cleanedText = stripForeignChineseGlue') > b.lastIndexOf('cleanedText = fixVietnameseCorruption('),
    '流式通道次序错误（须与 vi 清洗同位、居其后）');
});

test('A6 Mine F · 本命星座锁射程由 once 扩至三板块（月报/年报同级硬锁）', () => {
  assert.ok(hasSignLockWideScope(SERVER),
    '射程未扩至 monthly/yearly（或旧「只认 once」门控残留）⇒ 月报/年报本命星座幻觉继续批量留存');
});

/* ═══════════ B 组：行为真值（跑实现，不做纯文本猜测）═══════════ */

test('B1 行为·Mine A 极限环根治：宫主星句式不得被误读为落宫句式（zh + en 双证）', async () => {
  const mod = await loadClient();
  assert.deepEqual(judgeRulerAsHouseOverread(mod), []);
});

test('B2 行为·Mine D 轨迹记号：过境轨迹括号句零声称 + 原句零改动', async () => {
  const mod = await loadClient();
  assert.deepEqual(judgeTrajectoryMark(mod), []);
});

test('B3 行为·Mine C 双轨主星：合规零矛盾零改动 / 双轨集外真矛盾仍必判', async () => {
  const mod = await loadClient();
  assert.deepEqual(judgeDualTrackRuler(mod), []);
});

test('B4 行为·Mine B 中文粘连词本地化：五语替换 + zh 射程外 + 闭集外只告警', () => {
  const src = extractGlueScrubber(SERVER);
  assert.ok(src, 'Mine B 抽取失败（表 / 函数锚点漂移）');
  const warns = [];
  const fn = new Function('console',
    src + '\n; return stripForeignChineseGlue;')({ log() {}, warn(...a) { warns.push(a.join(' ')); } });
  assert.equal(typeof fn, 'function', 'stripForeignChineseGlue 未产出可执行函数');
  assert.deepEqual(judgeForeignGlue(fn, warns), []);
});

test('B5 行为·Mine F 本命星座锁：monthly / yearly 生效，未知板块透传（fail-safe）', async () => {
  const M = await loadClient();
  const body = extractFn(SERVER, 'applyOnceNatalSignLock');
  assert.ok(body, 'applyOnceNatalSignLock 抽取失败');
  const fn = new Function('correctNatalPlanetSigns', 'lintNatalPlanetSigns', 'console',
    body + '\n; return applyOnceNatalSignLock;')(
    M.correctNatalPlanetSigns, M.lintNatalPlanetSigns, fakeConsole);
  // 真值木星 = 巨蟹座；幻觉句写「天蝎座」⇒ 三板块皆须纠偏（同语域替换，句内其余一字不动）
  const bad = '你的本命木星在天蝎座落陷。';
  const good = '你的本命木星在巨蟹座落陷。';
  for (const t of ['once', 'monthly', 'yearly']) {
    assert.equal(fn(bad, 'zh', MX, t), good, `[${t}] 本命星座幻觉未纠偏（射程缺口）`);
    assert.equal(fn(good, 'zh', MX, t), good, `[${t}] 合规句被擅改（假阳）`);
  }
  for (const t of ['oracle', '', undefined, null]) {
    assert.equal(fn(bad, 'zh', MX, t), bad, `[${String(t)}] 未知板块越权介入`);
  }
  assert.equal(fn(bad, 'zh', null, 'monthly'), bad, '缺真值未透传（禁伪造）');
  assert.equal(fn(null, 'zh', MX, 'monthly'), null, 'null 入参未透传（崩）');
});

test('B6 行为·收敛式收口（applyOnceHouseLock）：Mine A 句求不动点 Δ=0 + 双锁归零', async () => {
  const M = await loadClient();
  const body = extractFn(SERVER, 'applyOnceHouseLock');
  assert.ok(body, 'applyOnceHouseLock 抽取失败（收口位锚点漂移）');
  const fn = new Function('correctHouseRulersAndCups', 'lintHouseRulersAndCups',
    'correctNatalPlanetSigns', 'lintNatalPlanetSigns', 'console',
    body + '\n; return applyOnceHouseLock;')(
    M.correctHouseRulersAndCups, M.lintHouseRulersAndCups,
    M.correctNatalPlanetSigns, M.lintNatalPlanetSigns, fakeConsole);
  const cases = [
    ['zh', '你的死穴是「第1宫主星木星落陷+第1宫主星火星在第1宫」的冲动与赌性。'],
    ['en', 'Mercury rules your 8th house, which colours your mind.'],
  ];
  for (const [lang, src] of cases) {
    const out = fn(src, lang, MX, 'once');
    assert.ok(M.lintHouseRulersAndCups(out, lang, MX).passed, `[${lang}] 宫位/主星未归零：${out}`);
    assert.ok(M.lintNatalPlanetSigns(out, lang, MX).passed, `[${lang}] 连带星座未归零：${out}`);
    assert.equal(fn(out, lang, MX, 'once'), out, `[${lang}] 收口未达不动点（二次施加仍有变更）`);
  }
  // 射程守备：月报/年报不得越权介入（宫位锁仍限定 once —— E19 血训）
  const src = cases[0][1];
  assert.equal(fn(src, 'zh', MX, 'monthly'), src, 'monthly 通道越权介入（宫位锁射程红线）');
  assert.equal(fn(src, 'zh', MX, 'yearly'), src, 'yearly 通道越权介入（宫位锁射程红线）');
});

/* ═══════════ C 组：注入反漂移（真实源码篡改 ⇒ 判据必红）═══════════ */

/* v69_client.js 以 `data:` URL 形态加载需重写三处「非相对可解析」锚点：
   · 两处 `'./astroTerms.js'`（相对规格符在 data: 下不可解析）
   · `fileURLToPath(import.meta.url)` / `createRequire(import.meta.url)`（data: 非 file: scheme）
   重写仅限「模块头三行」，**被篡改段逐字未改** ⇒ 仍是「真实源码篡改」。 */
const ABS_TERMS = pathToFileURL(join(ROOT, 'astroTerms.js')).href;
const ABS_SELF = pathToFileURL(join(ROOT, 'v69_client.js')).href;
const ABS_STUB = pathToFileURL(join(ROOT, 'package.json')).href;
const rewriteHeader = (s) => s
  .split("'./astroTerms.js'").join("'" + ABS_TERMS + "'")
  .split('fileURLToPath(import.meta.url)').join("fileURLToPath('" + ABS_SELF + "')")
  .split('createRequire(import.meta.url)').join("createRequire('" + ABS_STUB + "')");

async function loadClientVariant(tampered) {
  assert.notEqual(tampered, CLIENT, '注入锚点漂移（未命中目标实现）');
  const url = 'data:text/javascript;base64,' + Buffer.from(rewriteHeader(tampered), 'utf8').toString('base64');
  return import(url);
}

test('C1 注入：摘掉头窗/桥窗守卫 ⇒ A1 判据必红 + B1 行为必变（复刻致命极限环）', async () => {
  const tampered = CLIENT.replace(
    "        if (_guardWinRe && _guardWinRe.test((g2.w1 || '') + '\\u0000' + (g2.w2 || '') + '\\u0000' + (g2.br || ''))) continue;\n", '');
  assert.ok(!hasPlanetHouseWindowGuard(tampered), 'A1 判据失能（注入后仍判为守卫在位）');
  const M = await loadClientVariant(tampered);
  assert.ok(judgeRulerAsHouseOverread(M).length > 0,
    'B1 判据失能（未识别守卫缺失 ⇒ 宫主星句式被误读为落宫句式）');
});

test('C2 注入：末次定位回退 indexOf 首现 ⇒ A1b 判据必红（复刻错位伪造）', async () => {
  const tampered = CLIENT.replace(
    'const relH = mm[0].length - hTok.length;   // ③ 末次定位（禁 indexOf 首现）',
    'const relH = mm[0].indexOf(hTok);');
  assert.ok(!hasLastOccurrenceAnchor(tampered), 'A1b 判据失能（注入后仍判为末次定位在位）');
  const M = await loadClientVariant(tampered);
  assert.equal(typeof M.lintHouseRulersAndCups, 'function', '变体加载失败');
});

test('C3 注入：摘掉轨迹记号守卫 ⇒ A2 判据必红 + B2 行为必变（复刻轨迹句被篡改）', async () => {
  const tampered = CLIENT.replace(
    '          if (/[(（]/.test(_gap) || /^(?:→|->)/.test(_af)) continue;\n', '');
  assert.ok(!hasTrajectoryMarkGuard(tampered), 'A2 判据失能（注入后仍判为守卫在位）');
  const M = await loadClientVariant(tampered);
  assert.ok(judgeTrajectoryMark(M).length > 0, 'B2 判据失能（未识别轨迹记号守卫缺失）');
});

test('C4 注入：摘掉双轨豁免 ⇒ A3 判据必红 + B3 行为必变（复刻 8 例假阳）', async () => {
  const tampered = CLIENT.replace(
    '        if (_valid.length && vals.every((v) => _valid.indexOf(v) >= 0)) continue;   // 纯双轨 ⇒ 非矛盾',
    '        if (false) continue;');
  assert.ok(!hasDualTrackExemption(tampered), 'A3 判据失能（注入后仍判为豁免在位）');
  const M = await loadClientVariant(tampered);
  assert.ok(judgeDualTrackRuler(M).length > 0,
    'B3 判据失能（未识别双轨豁免缺失 ⇒ 合规双轨被误报矛盾）');
});

test('C5 注入：摘掉 zh 射程外守卫 ⇒ A4 判据必红（中文母语落入射程）', () => {
  const tampered = SERVER.replace("if (!lang || lang === 'zh') return text;", 'if (!lang) return text;');
  assert.notEqual(tampered, SERVER, '注入锚点漂移（未命中 zh 射程外守卫）');
  assert.ok(!hasForeignGlueScrubber(tampered), 'A4 判据失能（注入后仍判为 zh 射程外）');
});

test('C5b 注入：本地化改 `replace`（只换首处）⇒ B4 判据必红（复刻线上同篇重复未换）', () => {
  const src = extractGlueScrubber(SERVER);
  const tampered = src.split('out = out.split(cn).join(rep);').join('out = out.replace(cn, rep);');
  assert.notEqual(tampered, src, '注入锚点漂移（未命中 split/join 全量替换）');
  const warns = [];
  const fn = new Function('console',
    tampered + '\n; return stripForeignChineseGlue;')({ log() {}, warn(...a) { warns.push(a.join(' ')); } });
  assert.ok(judgeForeignGlue(fn, warns).length > 0, 'B4 判据失能（未识别「只换首处」缺陷）');
});

test('C6 注入：摘掉非流式接线 ⇒ A5 判据必红（客户端终稿与落库文本失守）', () => {
  const tampered = SERVER.replace('        reportContent = stripForeignChineseGlue(reportContent, lang);\n', '');
  assert.ok(!hasForeignGlueWiring(tampered), 'A5 判据失能（注入后仍判为已接线）');
});

test('C7 注入：本命星座锁门控回退 once ⇒ A6 判据必红 + B5 行为必变', async () => {
  const tampered = SERVER.replace(
    "    if (reportType !== 'once' && reportType !== 'monthly' && reportType !== 'yearly') return text;",
    "    if (reportType !== 'once') return text;");
  assert.ok(!hasSignLockWideScope(tampered), 'A6 判据失能（注入后仍判为射程已扩）');
  const M = await loadClient();
  const body = extractFn(tampered, 'applyOnceNatalSignLock');
  assert.ok(body, '注入后函数抽取失败');
  const fn = new Function('correctNatalPlanetSigns', 'lintNatalPlanetSigns', 'console',
    body + '\n; return applyOnceNatalSignLock;')(
    M.correctNatalPlanetSigns, M.lintNatalPlanetSigns, fakeConsole);
  const bad = '你的本命木星在天蝎座落陷。';
  assert.equal(fn(bad, 'zh', MX, 'monthly'), bad,
    'B5 判据失能（未识别射程回退：月报本命星座幻觉未被纠偏）');
});

/* ═══════════ D 组：段位守备（下界 + 相对位置，禁精确段数）═══════════ */

test('D1 段位守备：下界 ≥50 且 e40-compat 仍居收口位 len-2（禁精确段数）', () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim());
  assert.ok(segs.length >= 50, `test:astro 段数下界应 ≥50（49 + Gate45G），实得 ${segs.length}`);
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.equal(iCap, segs.length - 2, 'e40-compat 收口位漂移（应紧邻 python 段，居 len-2）');
  const iMe = segs.findIndex((s) => s.includes('audit-e42plus-gate45g-multilang-matrix-sweep'));
  assert.ok(iMe !== -1, 'Gate45G 未入编 test:astro（写好不接线 = 永不运行）');
  assert.ok(iMe < iCap, 'Gate45G 未置于收口位之前');
  assert.ok(segs[segs.length - 1].startsWith('python3 '), '链尾必须仍为 python 段');
});
