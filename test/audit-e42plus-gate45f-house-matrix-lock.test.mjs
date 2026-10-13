/**
 * Gate 45-F（E42+ 45-F）· 「宫位体系与主星归属硬核锁死」闸门
 *
 * 【战役背景】军师 2026-10-12 攻坚令。once 先天财富报告「宫位叙述层」成片幻觉（实兵报告逐字审读实捕）：
 *   ① 宫头星座错   —— 第 10 宫宫头写成射手座（真值摩羯座）；
 *   ② 宫主星串行   —— 「第 11 宫由月亮主管」；真值 H11 宫头水瓶 ⇒ 法定主星土星/天王星，
 *                     月亮实为本盘 H3/H4 主星（把某宫的宫主星安到了别的宫）；
 *   ③ 本命落宫错   —— 月亮第 11 宫 vs 第 1 宫；
 *   ④ 同篇自相矛盾 —— 同一宫位出现两个宫头星座。
 *   45-D2 的 `correctNatalPlanetSigns` 只锁「行星×星座」，**宫位/宫头/主星完全在射程外**。
 *
 * 【治法·三锁】
 *   ① 前置死锁：`buildNatalAnchors` 注入《NATAL HOUSE MATRIX》(12 宫 × 宫头星座 × 法定宫主星
 *      × 主星本命落座) + Part 3 ZERO TOLERANCE 负向规则（禁宫头错 / 禁主星串行 / 禁同篇矛盾）。
 *   ② 后置锁：`correctHouseRulersAndCups`（纠偏）→ `lintHouseRulersAndCups`（复检归零 + 矛盾审计），
 *      由 server.js `applyOnceHouseLock` 挂在 once 双通道**收口位**（星座锁之后）。
 *   ③ 真值源：`meta.house_cusps_full` / `meta.house_rulers` / `meta.computed_houses`（SwissEph 实算）。
 *
 * 【闸门纪律】
 *   · 禁词/计数扫描**只扫真值块**（剥注释后再扫）；存在性断言用原始源码（字符串字面量里的 `//` 会被剥）。
 *   · 注入反漂移：谓词主测与注入自测**同源取用**（防射程断层）。
 *   · 段位守备：**下界 + 相对位置**（禁精确段数 —— Gate41 血训）。
 *   · 行为真值优先：能跑实现的就**跑实现**（直接 import），不做纯文本猜测。
 *   · 期望值一律取自**唯一术语真值源** astroTerms.js（禁硬编码星座/行星名）。
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

/* ── 剥离注释（真值块）——「禁词/计数扫描只扫真值块」铁律 ── */
const stripJs = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/* ═══════════ 谓词（主测与注入自测同源取用）═══════════ */

/* ① 前置矩阵（存在性断言 ⇒ 用原始源码：段头是 `// ` 起手的字符串字面量，stripJs 会误剥） */
const hasHouseMatrixSection = (src) =>
  /const houseMatrixSection\s*=/.test(src)
  && /NATAL HOUSE MATRIX \(12 houses · cusp sign · ruling planet · ruler natal seat\)/.test(src)
  && /\|\s*House\s*\|\s*Cusp Sign\s*\|\s*Classical Ruler\s*\|\s*Modern Ruler\s*\|\s*Classical Ruler Natal Seat\s*\|/.test(src);

/* ② 装配断链：矩阵必须真的进 buildNatalAnchors 的返回式（否则永不注入 Prompt） */
const hasHouseMatrixWired = (src) => {
  const iFn = src.indexOf('export function buildNatalAnchors');
  if (iFn < 0) return false;
  const seg = src.slice(iFn, iFn + 26000);
  return /^ {4}houseMatrixSection,$/m.test(seg);
};

/* ③ Part 3 零容忍负向规则 */
const hasHouseRules = (src) =>
  /NATAL HOUSE MATRIX — CUSPS & RULERS \(45-F · ABSOLUTE · ZERO TOLERANCE\)/.test(src)
  && /FORBIDDEN: giving house N a cusp sign different from that row's Cusp Sign\./.test(src)
  && /FORBIDDEN: calling any planet other than that row's Classical\/Modern Ruler the ruler of house N\./.test(src)
  && /FORBIDDEN: writing "house N is ruled by <planet>" when <planet> is not that row's ruler\./.test(src)
  && /FORBIDDEN: giving the same house two different cusp signs, or two different rulers, in this report\./.test(src)
  && /FORBIDDEN: the "ruler slip" — attaching a house's ruler to the neighbouring house\./.test(src)
  && /FORBIDDEN: giving a natal planet a sign\/house pair that differs from that planet's own seat,/.test(src)
  && /INCLUDING elided-subject phrasings/.test(src)
  && /A house sentence that contradicts the MATRIX is a REJECTED DRAFT — never ship it\./.test(src);

/* ④ 后置锁导出 */
const hasHouseLintExports = (src) =>
  /export function lintHouseRulersAndCups/.test(src) && /export function correctHouseRulersAndCups/.test(src);

/* ⑤ 后置锁本体（纠偏 + 复检 + 板块白名单门控 + fail-safe） */
const hasHouseLockBody = (src) =>
  /function applyOnceHouseLock\(/.test(src)
  && /correctHouseRulersAndCups\(/.test(src)
  && /lintHouseRulersAndCups\(/.test(src)
  && /_HOUSE_LOCK_TYPES\.has\(reportType\)/.test(src);

/* ⑥ 调用点计数（1 定义 + 非流式 + 流式）—— 下界判据，注入摘除必降 */
const countHouseLockCalls = (src) => (src.match(/applyOnceHouseLock\(/g) || []).length;

/* ⑦ 主星合法性守卫（modern 主星必须被承认 ⇒ 不得无差别纠偏） */
const hasRulerValidityGuard = (src) => src.includes('if (valid.indexOf(pKey) >= 0) continue;');

/* ⑧ 裸宫头声称式的「行星守卫」双窗（防「行星落座句」被误读为宫头）：
      · 夹窗（致命）：H 与 Sign **之间**出现行星名 ⇒ 落座句 —— 复刻线上「第11宫本命火星水瓶座」
        被读成「H11 宫头=水瓶座」⇒ 纠偏把行星落座篡改为宫头星座（真值火星水瓶）。
      · 左窗三分判：左窗行星真值落座 == 本匹配 (星座,宫位) ⇒ 弃权；紧邻前 5 字含行星名 ⇒
        该行星自己的落座语 ⇒ 弃权；紧邻含本命主语槽 ⇒ **承前省略** ⇒ 继续纠偏
        —— 复刻线上「…第11宫主星是本命土星，本命落在水瓶座第11宫」漏检（真值土星摩羯）。 */
const hasBareCuspPlanetGuard = (src) =>
  /const between = \(ia >= 0 && ib >= 0\)/.test(src)
  && /allPlanetVals\.some\(\(p\) => p && between\.includes\(p\)\)/.test(src)
  && /const _lwTok = allPlanetVals\.filter\(\(p\) => p && lw\.includes\(p\)\)/.test(src)
  && /if \(_seatOk\) continue;/.test(src);

/* ⑧b Sign 在前的裸式 `<星座>第N宫`（中文最常见写法）：
      · 声称式在位（cusp 正则第 4 式 s8/h9 + 紧邻窗 GS）—— 复刻线上漏检的「狮子座第10宫/第11宫」
      · 「落座对歧义豁免」在位（该 (星座,宫位) 确为某行星真值落座 ⇒ 弃权，宁漏不改）
      · ⚠️ 45-G 起该分支由独立 `if` 起手（前置 `_ksIsPlacementSeat` 守卫提前 `continue`）⇒
        判据须同时容纳 `if (...)` 与 `else if (...)` 两形态，禁绑死 `else `。 */
const hasSignFirstClaimForm = (src) =>
  /signAlt \+ '\)' \+ GS \+ '\(\?<h9>' \+ H \+ '\)'/.test(src)
  && /(?:else )?if \(bareS && seatedPairs\.has\(si \+ '\|' \+ num\)\)/.test(src);

/* ⑨ 流年左窗守卫（宁漏不改） */
const hasTransitGuard = (src) => /const _isTransit = \(idx\) => \{/.test(src);

/* ⑩ 单独成行的 import（E39 A3：封仓闸门精确匹配不可稀释） */
const hasStandaloneImport = (src) =>
  /\nimport \{ lintHouseRulersAndCups, correctHouseRulersAndCups \} from '\.\/v69_client\.js';/.test(src);

/* ═══════════ 合成真值盘（无需 Python · 确定性 · 期望值取自术语真值源）═══════════ */

const CUSP_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const CLASS_RULERS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const MODERN_RULERS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Pluto', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
const CLASS_SEAT = {
  Mars: { sign: 'Aquarius', house: 10, dignity: 'peregrine' },
  Venus: { sign: 'Aquarius', house: 10, dignity: 'peregrine' },
  Mercury: { sign: 'Pisces', house: 11, dignity: 'detriment' },
  Moon: { sign: 'Scorpio', house: 6, dignity: 'fall' },
  Sun: { sign: 'Pisces', house: 11, dignity: 'peregrine' },
  Jupiter: { sign: 'Cancer', house: 2, dignity: 'exaltation' },
  Saturn: { sign: 'Capricorn', house: 9, dignity: 'domicile' },
};
const HOUSE_MATRIX = {
  meta: {
    rising_sign: 'Taurus', sun_sign: 'Pisces',
    computed_houses: {
      Sun: { sign: 'Pisces', house: 11 }, Moon: { sign: 'Scorpio', house: 6 },
      Mercury: { sign: 'Pisces', house: 11 }, Venus: { sign: 'Aquarius', house: 10 },
      Mars: { sign: 'Aquarius', house: 10 }, Jupiter: { sign: 'Cancer', house: 2 },
      Saturn: { sign: 'Capricorn', house: 9 }, Uranus: { sign: 'Capricorn', house: 9 },
      Neptune: { sign: 'Capricorn', house: 9 }, Pluto: { sign: 'Scorpio', house: 7 },
    },
    natal_moon: { sign: 'Scorpio', house: 6 },
    house_cusps_full: CUSP_SIGNS.reduce((acc, s, i) => {
      acc['house_' + (i + 1)] = { sign: s, cusp_degree: i * 30 + 12.09, degree_in_sign: 12.09 };
      return acc;
    }, {}),
    house_rulers: CUSP_SIGNS.reduce((acc, s, i) => {
      const c = CLASS_RULERS[i], m = MODERN_RULERS[i];
      const seat = CLASS_SEAT[c] || { sign: '?', house: 1, dignity: '' };
      acc['house_' + (i + 1)] = {
        cusp_sign: s,
        classical: { planet: c, sign: seat.sign, house: seat.house, dignity: seat.dignity },
        modern: { planet: m, sign: seat.sign, house: seat.house, dignity: seat.dignity },
      };
      return acc;
    }, {}),
  },
};

/* 期望值构造器：一律取自 astroTerms.js 唯一真值源 */
const signName = (terms, lang, en) => terms.SUN_SIGNS[lang][terms.SIGN_KEYS.indexOf(en)];
const planetName = (terms, lang, en) => terms.PLANETS[lang][en];

/* ═══════════ A 组：修复在位（源码级真值）═══════════ */

test('A1 前置·《NATAL HOUSE MATRIX》权威矩阵在位（12 宫 × 宫头 × 法定主星）', () => {
  assert.ok(hasHouseMatrixSection(CLIENT),
    '矩阵要素缺失（houseMatrixSection 定义 / 段头 / Markdown 表头任一断链）');
});

test('A2 前置·装配不断链（矩阵已进 buildNatalAnchors 返回式）', () => {
  assert.ok(hasHouseMatrixWired(CLIENT),
    'houseMatrixSection 未进入 buildNatalAnchors 返回式 ⇒ 永不注入 Prompt（纯死代码）');
});

test('A3 前置·Part 3 零容忍负向规则（禁宫头错 / 禁主星串行 / 禁同篇矛盾）', () => {
  assert.ok(hasHouseRules(CLIENT), 'Part 3 宫位零容忍规则缺失或射程不全');
});

test('A4 后置·Linter 导出（纠偏 + 只检不改 + 矛盾审计）', () => {
  assert.ok(hasHouseLintExports(CLIENT), 'v69_client 未导出 lintHouseRulersAndCups / correctHouseRulersAndCups');
});

test('A5 后置·锁本体（纠偏 + 复检 + 板块白名单门控）与双通道接入（≥3 调用点）', () => {
  assert.ok(hasHouseLockBody(SERVER), 'applyOnceHouseLock 本体缺失（或未接纠偏/复检/板块白名单门控）');
  const n = countHouseLockCalls(SERVER);
  assert.ok(n >= 3, `applyOnceHouseLock 调用点应 ≥3（1 定义 + 非流式 + 流式），实得 ${n}`);
});

test('A6 后置·四层护栏在位（主星合法性 / 裸宫头双窗行星守卫 / Sign 先式声称式 / 流年左窗守卫）', () => {
  assert.ok(hasRulerValidityGuard(CLIENT),
    '缺「classical|modern 主星合法性」守卫 ⇒ 会把合法的现代主星误纠（假阳）');
  assert.ok(hasBareCuspPlanetGuard(CLIENT),
    '缺裸宫头声称式的行星守卫（夹窗 / 左窗三分判）⇒「木星在第2宫巨蟹座」「第11宫本命火星水瓶座」会被误判为宫头');
  assert.ok(hasSignFirstClaimForm(CLIENT),
    '缺 Sign 先式 `<星座>第N宫` 声称式（或其落座对歧义豁免）⇒ 线上「狮子座第11宫」整类漏检');
  assert.ok(hasTransitGuard(CLIENT), '缺流年左窗守卫 ⇒ 会误伤流年句（V472/V478 血训）');
});

test('A7 后置·import 单独成行（E39 A3 封仓闸门精确匹配不可稀释）', () => {
  assert.ok(hasStandaloneImport(SERVER),
    '45-F 的 import 未单独成行（与既有 import 同行会被精确匹配断言稀释）');
});

/* ═══════════ B 组：行为真值（跑实现，不做纯文本猜测）═══════════ */

test('B1 行为·前置锁实际产出 12 行矩阵 + 真值行 + 零哨兵字面量', async () => {
  const mod = await import(pathToFileURL(join(ROOT, 'v69_client.js')).href);
  const text = String(mod.buildNatalAnchors(HOUSE_MATRIX));
  assert.ok(/NATAL HOUSE MATRIX/.test(text), 'buildNatalAnchors 产物缺宫位矩阵');
  const rows = text.split('\n').filter((l) => /^\|\s*\d{1,2}\s*\|/.test(l));
  assert.equal(rows.length, 12, `矩阵应为 12 行，实得 ${rows.length}（半真半假 = 反向危险）`);
  const terms = await import(pathToFileURL(join(ROOT, 'astroTerms.js')).href);
  // H10 宫头摩羯 / 法定主星土星（期望值取自术语真值源，禁硬编码）
  const h10 = rows.find((r) => /^\|\s*10\s*\|/.test(r));
  assert.ok(h10.includes('Capricorn'), `H10 行宫头星座错：${h10}`);
  assert.ok(h10.includes('Saturn'), `H10 行法定主星错：${h10}`);
  // H11 宫头水瓶：classical=Saturn / modern=Uranus（现代主星差异必须如实呈现）
  const h11 = rows.find((r) => /^\|\s*11\s*\|/.test(r));
  assert.ok(h11.includes('Aquarius') && h11.includes('Saturn') && h11.includes('Uranus'),
    `H11 行（水瓶 · 土星/天王）不完整：${h11}`);
  assert.ok(/ZERO TOLERANCE/.test(text), '缺 Part 3 零容忍规则（后置锁失效时无兜底语义）');
  assert.ok(/DEADLOCK TABLE/.test(text), '45-D2 死锁表被稀释（上游闸门射程受损）');
  assert.ok(/Your Natal Moon: Scorpio in House 6/.test(text), '既有 PROSE 行被稀释（上游闸门射程受损）');
  // 注入块哨兵铁律：绝不出现 undefined / NaN / null / '?' 哨兵
  assert.ok(!/\bundefined\b/.test(text), '注入块含 undefined 哨兵');
  assert.ok(!/\bNaN\b/.test(text), '注入块含 NaN 哨兵');
  assert.ok(!/\bnull\b/.test(text), '注入块含 null 哨兵');
  assert.equal(terms.SIGN_KEYS.length, 12, '术语真值源星座数漂移');
});

test('B2 行为·六语幻觉纠偏归零 + 幂等 + 合法现代主星零改动', async () => {
  const mod = await import(pathToFileURL(join(ROOT, 'v69_client.js')).href);
  const terms = await import(pathToFileURL(join(ROOT, 'astroTerms.js')).href);
  const { lintHouseRulersAndCups, correctHouseRulersAndCups } = mod;
  assert.equal(typeof correctHouseRulersAndCups, 'function', '缺 correctHouseRulersAndCups 导出');
  assert.equal(typeof lintHouseRulersAndCups, 'function', '缺 lintHouseRulersAndCups 导出');

  const capLocal = (lang) => signName(terms, lang, 'Capricorn');
  const satLocal = (lang) => planetName(terms, lang, 'Saturn');

  // ① 宫头星座幻觉（六语）：第 10 宫写成射手 ⇒ 真值摩羯
  const cuspCases = [
    ['zh', '第10宫的宫头是射手座，事业由外部权威定义。', capLocal('zh')],
    ['en', 'The cusp of the 10th house is Sagittarius, calling you outward.', capLocal('en')],
    ['es', 'La cúspide de la casa 10 es Sagitario.', capLocal('es')],
    ['fr', 'La cuspide de la maison 10 est Sagittaire.', capLocal('fr')],
    ['th', 'ปลายเรือนที่ 10 คือราศีธนู', capLocal('th')],
    ['vi', 'Đỉnh nhà 10 là Nhân Mã.', capLocal('vi')],
  ];
  for (const [lang, src, want] of cuspCases) {
    assert.ok(!lintHouseRulersAndCups(src, lang, HOUSE_MATRIX).passed,
      `[${lang}] 宫头幻觉未检出 ⇒ Linter 射程不全：${src}`);
    const r = correctHouseRulersAndCups(src, lang, HOUSE_MATRIX);
    assert.ok(r.text.includes(want), `[${lang}] 宫头未纠偏到真值「${want}」：${r.text}`);
    assert.ok(lintHouseRulersAndCups(r.text, lang, HOUSE_MATRIX).passed, `[${lang}] 纠偏后仍有残余违背`);
    assert.equal(correctHouseRulersAndCups(r.text, lang, HOUSE_MATRIX).text, r.text, `[${lang}] 纠偏非幂等`);
  }

  // ② 宫主星串行（六语）：第 11 宫由月亮主管 ⇒ 真值土星/天王（合成盘 H11 = 水瓶）
  const rulerCases = [
    ['zh', '第11宫由月亮主管，人脉是你的福地。', satLocal('zh')],
    ['zh', '第11宫的宫主星是木星。', satLocal('zh')],
    ['zh', '火星是第7宫的宫主星。', planetName(terms, 'zh', 'Venus')],   // 合成盘 H7 = 天秤 ⇒ 金星
    ['en', 'The 11th house is ruled by the Moon in this chart.', satLocal('en')],
    ['en', 'The ruler of the 11th house is the Moon.', satLocal('en')],
    ['es', 'El regente de la casa 11 es la Luna.', satLocal('es')],
    ['fr', 'Le 11e maison est gouvernée par la Lune.', satLocal('fr')],
    ['th', 'เจ้าเรือนที่ 11 คือดวงจันทร์', satLocal('th')],
    ['vi', 'Chủ tinh của nhà 11 là Mặt Trăng.', satLocal('vi')],
  ];
  for (const [lang, src, want] of rulerCases) {
    assert.ok(!lintHouseRulersAndCups(src, lang, HOUSE_MATRIX).passed,
      `[${lang}] 宫主星串行未检出：${src}`);
    const r = correctHouseRulersAndCups(src, lang, HOUSE_MATRIX);
    assert.ok(r.text.includes(want), `[${lang}] 主星未纠偏到真值「${want}」：${r.text}`);
    assert.ok(lintHouseRulersAndCups(r.text, lang, HOUSE_MATRIX).passed, `[${lang}] 纠偏后仍有残余违背`);
    assert.equal(correctHouseRulersAndCups(r.text, lang, HOUSE_MATRIX).text, r.text, `[${lang}] 纠偏非幂等`);
  }

  // ③ 本命落宫幻觉：月亮第 11 宫 ⇒ 真值 H6（只换宫号数字，句内其余一字不动）
  const ph = '你的本命月亮在第11宫发光。';
  assert.ok(!lintHouseRulersAndCups(ph, 'zh', HOUSE_MATRIX).passed, '本命落宫幻觉未检出');
  const phFixed = correctHouseRulersAndCups(ph, 'zh', HOUSE_MATRIX);
  assert.equal(phFixed.text, '你的本命月亮在第6宫发光。', '本命落宫未纠偏或误伤句内其他字符');
  assert.equal(correctHouseRulersAndCups(phFixed.text, 'zh', HOUSE_MATRIX).text, phFixed.text, '落宫纠偏非幂等');
  // en 序数形态（6th house）
  const phEn = 'Your natal Moon in the 11th house shines.';
  assert.equal(correctHouseRulersAndCups(phEn, 'en', HOUSE_MATRIX).text,
    'Your natal Moon in the 6th house shines.', 'en 序数宫号纠偏失败');
  // 中文数词形态（第十一宫 → 第六宫）
  const phZhNum = '你的本命月亮在第十一宫发光。';
  assert.equal(correctHouseRulersAndCups(phZhNum, 'zh', HOUSE_MATRIX).text,
    '你的本命月亮在第六宫发光。', 'zh 数词宫号纠偏失败');

  // ④ 合法主星零改动：classical 与 modern 双轨皆须承认（禁无差别纠偏）
  //    合成盘真值：H8 天蝎 ⇒ 火星/冥王；H11 水瓶 ⇒ 土星/天王；H12 双鱼 ⇒ 木星/海王
  for (const legit of ['第11宫由土星主管。', '第11宫由天王星主管。', '第8宫由火星主管。',
                       '第8宫由冥王星主管。', '第12宫由海王星主管。']) {
    assert.ok(lintHouseRulersAndCups(legit, 'zh', HOUSE_MATRIX).passed,
      `合法主星被误判为幻觉（假阳）：${legit}`);
    assert.equal(correctHouseRulersAndCups(legit, 'zh', HOUSE_MATRIX).text, legit,
      `合法主星被擅改（假阳 · modern 主星未获承认）：${legit}`);
  }
  // 合规宫头零改动（合成盘 H9 = 射手 / H10 = 摩羯）
  for (const ok of ['第10宫的宫头在摩羯座。', '第9宫宫头在射手座。']) {
    assert.equal(correctHouseRulersAndCups(ok, 'zh', HOUSE_MATRIX).text, ok, `合规宫头被擅改：${ok}`);
  }
});

test('B3 行为·射程守卫（流年弃权 / 行星落座句弃权 / 缺真值零动作 / 崩防御）', async () => {
  const mod = await import(pathToFileURL(join(ROOT, 'v69_client.js')).href);
  const { lintHouseRulersAndCups, correctHouseRulersAndCups } = mod;

  // ① 流年左窗守卫（宁漏不改）
  for (const t of ['流年木星进入第11宫，人脉扩张。', '流年第10宫由月亮主管，本月人脉旺。']) {
    assert.ok(lintHouseRulersAndCups(t, 'zh', HOUSE_MATRIX).passed, `流年句被越权误伤：${t}`);
    assert.equal(correctHouseRulersAndCups(t, 'zh', HOUSE_MATRIX).text, t, `流年句被擅改：${t}`);
  }
  // ② 行星落座句（宫头裸声称式的左窗行星守卫）——「木星在第2宫巨蟹座」不得被读成宫头/落宫
  const planetSeat = '木星在第2宫巨蟹座入旺。';
  assert.ok(lintHouseRulersAndCups(planetSeat, 'zh', HOUSE_MATRIX).passed,
    '本命落座句被误判为宫头声称（假阳 ⇒ 会破坏正确的行星真值句）');
  assert.equal(correctHouseRulersAndCups(planetSeat, 'zh', HOUSE_MATRIX).text, planetSeat, '落座句被擅改');
  // ②b 本命行星在真值宫位上（合规）零改动
  const okSeat = '你的本命月亮在第6宫，与第1宫形成张力。';
  assert.equal(correctHouseRulersAndCups(okSeat, 'zh', HOUSE_MATRIX).text, okSeat, '合规落宫被擅改');

  // ③ 缺真值 ⇒ 零动作（绝不伪造）
  for (const bad of [{ meta: {} }, { meta: { house_cusps_full: null, house_rulers: null } }, null]) {
    assert.equal(correctHouseRulersAndCups('第10宫的宫头是射手座。', 'zh', bad).text, '第10宫的宫头是射手座。',
      '缺真值未零动作（禁伪造）');
  }
  // ④ 未知语言 / null / 非字符串入参 ⇒ 原样返回（绝不崩）
  assert.ok(lintHouseRulersAndCups('第11宫由月亮主管', 'xx', HOUSE_MATRIX).passed, '未知语言未零动作');
  assert.equal(correctHouseRulersAndCups(null, 'zh', HOUSE_MATRIX).text, null, 'null 入参未原样返回（崩）');
  assert.equal(correctHouseRulersAndCups(undefined, 'zh', HOUSE_MATRIX).text, undefined, 'undefined 入参未原样返回（崩）');
  assert.equal(correctHouseRulersAndCups('', 'zh', HOUSE_MATRIX).text, '', '空串入参未原样返回');
  // ⑤ 板块白名单门控在 applyOnceHouseLock 层（源码抽取断言，避免依赖 server 运行环境）
  //    🔴 45-G 第二轮**反转旧红线**：monthly / yearly 由「不得介入」改为「必须介入」——
  //       大阅兵实弹证伪「不介入更安全」：无锁的 monthly 残余 7 处 / yearly 残余 33 处，
  //       全为「把落在第 N 宫的行星当作第 N 宫宫头/主星」同族伪造；未知板块仍 fail-closed 透传。
  const fnSrc = SERVER.slice(SERVER.indexOf('function applyOnceHouseLock('));
  const body = fnSrc.slice(0, fnSrc.indexOf('\n}\n') + 2);
  const fn = new Function('correctHouseRulersAndCups', 'lintHouseRulersAndCups',
    'correctNatalPlanetSigns', 'lintNatalPlanetSigns', 'console',
    body + '\n; return applyOnceHouseLock;')(correctHouseRulersAndCups, lintHouseRulersAndCups,
    mod.correctNatalPlanetSigns, mod.lintNatalPlanetSigns, console);
  const src = '第10宫的宫头是射手座。';
  assert.ok(fn(src, 'zh', HOUSE_MATRIX, 'monthly').includes('摩羯座'), 'monthly 通道未介入（射程缺口）');
  assert.ok(fn(src, 'zh', HOUSE_MATRIX, 'yearly').includes('摩羯座'), 'yearly 通道未介入（射程缺口）');
  assert.equal(fn(src, 'zh', null, 'once'), src, '缺真值时未透传');
  assert.ok(fn(src, 'zh', HOUSE_MATRIX, 'once').includes('摩羯座'), 'once 通道未生效');
  for (const t of ['oracle', '', undefined, null]) {
    assert.equal(fn(src, 'zh', HOUSE_MATRIX, t), src, `[${String(t)}] 未知板块越权介入（fail-closed 破防）`);
  }
});

test('B4 行为·同篇自相矛盾审计（同一宫两个宫头 / 同一行星两个宫位）', async () => {
  const mod = await import(pathToFileURL(join(ROOT, 'v69_client.js')).href);
  const { lintHouseRulersAndCups, correctHouseRulersAndCups } = mod;
  // ① 同一宫位两个宫头星座
  const c1 = '第10宫的宫头是射手座，第10宫宫头又是双鱼座。';
  const l1 = lintHouseRulersAndCups(c1, 'zh', HOUSE_MATRIX);
  assert.equal(l1.conflicts.length, 1, '同宫双宫头未被判为自相矛盾');
  assert.equal(l1.conflicts[0].kind, 'cusp');
  assert.equal(l1.conflicts[0].key, 'H10');
  assert.equal(l1.conflicts[0].values.length, 2, '矛盾值未如实收集');
  const f1 = correctHouseRulersAndCups(c1, 'zh', HOUSE_MATRIX);
  assert.ok(f1.text.includes('摩羯座'), '矛盾未归真');
  assert.equal(lintHouseRulersAndCups(f1.text, 'zh', HOUSE_MATRIX).conflicts.length, 0,
    '纠偏后仍报自相矛盾（归真失败）');
  // ② 同一本命行星两个宫位
  const c2 = '你的本命月亮在第11宫发光，你的本命月亮也在第1宫。';
  const l2 = lintHouseRulersAndCups(c2, 'zh', HOUSE_MATRIX);
  assert.ok(l2.conflicts.some((x) => x.kind === 'planet_house' && x.key === 'Moon'),
    '同行星双宫位未被判为自相矛盾');
  // ③ 同一宫位两个主星
  const c3 = '第11宫由月亮主管，第11宫的主星其实是金星。';
  const l3 = lintHouseRulersAndCups(c3, 'zh', HOUSE_MATRIX);
  assert.ok(l3.conflicts.some((x) => x.kind === 'ruler' && x.key === 'H11'),
    '同宫双主星未被判为自相矛盾');
});

test('B5 行为·收敛式收口（两锁互相触发 ⇒ 求不动点）+ 落座语防伪造', async () => {
  const mod = await import(pathToFileURL(join(ROOT, 'v69_client.js')).href);
  const { correctHouseRulersAndCups, lintHouseRulersAndCups, correctNatalPlanetSigns, lintNatalPlanetSigns } = mod;

  // ① 🔴 防伪造（2026-10-12 线上实兵血训）：承前省略的**落座语**绝不能被宫头锁当成宫头声称。
  //    「第9宫的主星是木星，本命落在水瓶座第9宫」——H9 宫头=射手座（合成盘），若误判为宫头声称
  //    会把落座语星座篡改为**射手座**（真值木星=巨蟹座 H2）⇒ 凭空造幻觉。必须按**行星真值**改写。
  const seat = '第9宫的主星是木星，本命落在水瓶座第9宫。';
  const seatOut = correctHouseRulersAndCups(seat, 'zh', HOUSE_MATRIX).text;
  assert.ok(!seatOut.includes('射手座'), '宫头锁把落座语星座篡改成宫头星座（伪造幻觉）');
  assert.equal(seatOut, '第9宫的主星是木星，本命落在巨蟹座第2宫。', '承前省略落座语未按行星真值（星座+宫号）纠偏');

  // ② 收敛式收口：宫位锁替换主星令牌 ⇒ 新生成「本命X在Y座」按语须被连带纠偏（单轮不幂等）。
  const cross = '第8宫的主星本命金星在天蝎座第8宫落陷。';
  const one = correctHouseRulersAndCups(cross, 'zh', HOUSE_MATRIX);
  assert.notEqual(one.text, cross, '宫位锁未纠偏（射程失守）');
  assert.ok(!lintHouseRulersAndCups(one.text, 'zh', HOUSE_MATRIX).passed
    || !lintNatalPlanetSigns(one.text, 'zh', HOUSE_MATRIX).passed,
  '单轮即已归零 ⇒ 该用例未复刻「两锁互相触发」形态（用例失效）');

  // ③ 抽取 applyOnceHouseLock（收口位）实际执行 ⇒ 必须一轮内到不动点且幂等
  const fnSrc = SERVER.slice(SERVER.indexOf('function applyOnceHouseLock('));
  const body = fnSrc.slice(0, fnSrc.indexOf('\n}\n') + 2);
  const fn = new Function('correctHouseRulersAndCups', 'lintHouseRulersAndCups',
    'correctNatalPlanetSigns', 'lintNatalPlanetSigns', 'console',
    body + '\n; return applyOnceHouseLock;')(correctHouseRulersAndCups, lintHouseRulersAndCups,
    correctNatalPlanetSigns, lintNatalPlanetSigns, { log() {}, warn() {} });
  const out1 = fn(cross, 'zh', HOUSE_MATRIX, 'once');
  assert.ok(lintHouseRulersAndCups(out1, 'zh', HOUSE_MATRIX).passed, '宫位/主星未归零：' + out1);
  assert.ok(lintNatalPlanetSigns(out1, 'zh', HOUSE_MATRIX).passed, '连带星座未归零：' + out1);
  assert.equal(fn(out1, 'zh', HOUSE_MATRIX, 'once'), out1, '收口未达不动点（二次施加仍有变更）');
});

/* ═══════════ C 组：注入反漂移（复刻真实缺陷形态 ⇒ 判据必红）═══════════ */
test('C1 注入：摘掉矩阵装配行 ⇒ A2 判据必红', () => {
  const broken = CLIENT.replace(/^ {4}houseMatrixSection,$\n/m, '');
  assert.notEqual(broken, CLIENT, '注入锚点漂移（未命中矩阵装配行）');
  assert.ok(!hasHouseMatrixWired(broken), '注入后仍判为已装配 ⇒ A2 判据射程不全');
});

test('C2 注入：摘掉流式链末宫位锁接入点 ⇒ A5 判据必红', () => {
  const broken = SERVER.replace(
    '    cleanedText = applyOnceHouseLock(cleanedText, lang, astroMatrix, reportType);\n', '');
  assert.notEqual(broken, SERVER, '注入锚点漂移（未命中流式接入点）');
  assert.ok(countHouseLockCalls(broken) < 3, '注入后调用点计数未下降 ⇒ A5 判据射程不全');
});

test('C3 注入：摘掉 Part 3 宫位零容忍段头 ⇒ A3 判据必红', () => {
  const broken = CLIENT.replace('NATAL HOUSE MATRIX — CUSPS & RULERS (45-F · ABSOLUTE · ZERO TOLERANCE):',
    'NATAL HOUSE MATRIX (moved):');
  assert.notEqual(broken, CLIENT, '注入锚点漂移（未命中 45-F 规则段头）');
  assert.ok(!hasHouseRules(broken), '注入后仍判为规则在位 ⇒ A3 判据射程不全');
});

test('C4 注入：摘掉主星合法性守卫 ⇒ A6 判据必红（复刻「无差别纠偏」缺陷）', () => {
  const broken = CLIENT.replace('if (valid.indexOf(pKey) >= 0) continue;', 'if (false) continue;');
  assert.notEqual(broken, CLIENT, '注入锚点漂移（未命中主星合法性守卫）');
  assert.ok(!hasRulerValidityGuard(broken), '注入后仍判为守卫在位 ⇒ A6 判据射程不全');
});

test('C5 注入：摘掉裸宫头「夹窗」行星守卫 ⇒ A6 判据必红（复刻「第N宫本命X星座」被误读为宫头）', () => {
  const broken = CLIENT.replace(
    'if (allPlanetVals.some((p) => p && between.includes(p))) continue;', 'if (false) continue;');
  assert.notEqual(broken, CLIENT, '注入锚点漂移（未命中夹窗行星守卫）');
  assert.ok(!hasBareCuspPlanetGuard(broken), '注入后仍判为守卫在位 ⇒ A6 判据射程不全');
});

test('C5b 注入：摘掉裸宫头「左窗三分判」seat 判据 ⇒ A6 判据必红（复刻承前省略主语漏检）', () => {
  const broken = CLIENT.replace('if (_seatOk) continue;', 'if (false) continue;');
  assert.notEqual(broken, CLIENT, '注入锚点漂移（未命中左窗 seat 判据）');
  assert.ok(!hasBareCuspPlanetGuard(broken), '注入后仍判为守卫在位 ⇒ A6 判据射程不全');
});

test('C5c 注入：摘掉 Sign 先式 `<星座>第N宫` 声称式 ⇒ A6 判据必红（复刻线上整类漏检）', () => {
  const broken = CLIENT.replace("+ '|(?<s8>' + signAlt + ')' + GS + '(?<h9>' + H + ')'", '');
  assert.notEqual(broken, CLIENT, '注入锚点漂移（未命中 Sign 先式声称式）');
  assert.ok(!hasSignFirstClaimForm(broken), '注入后仍判为声称式在位 ⇒ A6 判据射程不全');
});

test('C5d 注入：把 45-F 板块白名单门控退化为恒真 ⇒ A5 判据必红（射程口径不可稀释）', () => {
  const broken = SERVER.replace('if (!_HOUSE_LOCK_TYPES.has(reportType)) return text;', 'if (false) return text;');
  assert.notEqual(broken, SERVER, '注入锚点漂移（未命中 45-F 板块白名单门控）');
  assert.ok(!hasHouseLockBody(broken), '注入后仍判为门控在位 ⇒ A5 判据射程不全');
});

test('C6 注入：把 45-F import 并回既有 import 行 ⇒ A7 判据必红（E39 A3）', () => {
  const broken = SERVER.replace(
    "\nimport { lintHouseRulersAndCups, correctHouseRulersAndCups } from './v69_client.js';", '');
  assert.notEqual(broken, SERVER, '注入锚点漂移（未命中 45-F 独立 import 行）');
  assert.ok(!hasStandaloneImport(broken), '注入后仍判为独立 import ⇒ A7 判据射程不全');
});

test('C7 注入：矩阵任一行不完整 ⇒ 行为判据必红（禁「半真半假」注入）', async () => {
  const mod = await import(pathToFileURL(join(ROOT, 'v69_client.js')).href);
  const broken = JSON.parse(JSON.stringify(HOUSE_MATRIX));
  delete broken.meta.house_rulers.house_6;          // 缺一行 ⇒ 整表不得注入
  const text = String(mod.buildNatalAnchors(broken));
  assert.ok(!/NATAL HOUSE MATRIX/.test(text),
    '真值缺行时仍注入矩阵（半真半假）⇒ B1 行数判据射程不全');
});

/* ═══════════ D 组：段位守备（下界 + 相对位置，禁精确段数）═══════════ */

test('D1 段位守备：下界 ≥48 且 e40-compat 仍居收口位 len-2（禁精确段数）', () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim());
  assert.ok(segs.length >= 48, `test:astro 段数下界应 ≥48，实得 ${segs.length}`);
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.equal(iCap, segs.length - 2, 'e40-compat 收口位漂移（应紧邻 python 段，居 len-2）');
  const iMe = segs.findIndex((s) => s.includes('audit-e42plus-gate45f-house-matrix-lock'));
  assert.ok(iMe !== -1, 'Gate45F 未入编 test:astro（写好不接线 = 永不运行）');
  assert.ok(iMe < iCap, 'Gate45F 未置于收口位之前');
  assert.ok(segs[segs.length - 1].startsWith('python3 '), '链尾必须仍为 python 段');
});
