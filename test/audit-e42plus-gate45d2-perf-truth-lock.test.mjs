/**
 * Gate 45-D2（E42+ 45-D2）· 「性能提速 + 真值反幻觉死锁」双战闸门
 *
 * 【战役背景】军师 2026-10-12 攻坚令，两路并行：
 *   ① 先锋战（P1·性能）—— `/data/cities.json` **6.9MB 明文裸传**（`max-age=0` 连缓存都没有）
 *      ⇒ 首屏城市检索 31~56s 不可用。治法：构建期 gzip/brotli 预压缩 + `immutable` 强缓存
 *      + **内容指纹 URL**（immutable 必须配指纹，否则升级城市库后老用户被一年缓存永久钉死）。
 *   ② 主力战（P1·模型）—— once 先天报告**本命行星幻觉**：
 *      线上实捕「本命木星狮子座」（真值双子座）、「你的金星天蝎座」（真值天秤座）；
 *      两个幻觉值**恰等于流年值**（本命/流年混淆）。
 *      治法：**前置锁**（Prompt 注入《本命行星×星座×宫位死锁表》+ ZERO TOLERANCE 负向规则）
 *          + **后置锁**（服务端确定性 Linter：`correctNatalPlanetSigns` 纠偏 → `lintNatalPlanetSigns` 复检归零）。
 *          + **交付链根因**：`WealthReportPage.tsx` 的 `_sanMap` 终稿登记原先只写在 yearly/monthly
 *            分支内 ⇒ once 通道 `_sanFinal=''` ⇒ `_final` 回退**流式原文** ⇒ 后端真值锁**形同虚设**。
 *   ③ 顺带修正：月报周卡片标题日期区间越窗（线上「第1周：11月13日–7日」，且 W3/W4 口径漂移）。
 *
 * 【闸门纪律】
 *   · 禁词/计数扫描**只扫真值块**（`stripJs` 剥注释后再扫）。
 *   · 注入反漂移：谓词主测与注入自测**同源取用**（防射程断层）。
 *   · 段位守备：**下界 + 相对位置**（禁精确段数 —— Gate41 血训：写 `===40` 被 Gate42 入编连坐撞红）。
 *   · 行为真值优先：能跑实现的就**跑实现**（VM 抽取 / 直接 import），不做纯文本猜测。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SERVER = readFileSync(join(ROOT, 'server.js'), 'utf8');
const CLIENT = readFileSync(join(ROOT, 'v69_client.js'), 'utf8');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const WEBPKG = JSON.parse(readFileSync(join(ROOT, 'web', 'package.json'), 'utf8'));
const VITE = readFileSync(join(ROOT, 'web', 'vite.config.ts'), 'utf8');
const CITY_TS = readFileSync(join(ROOT, 'web', 'src', 'hooks', 'useCitySearch.ts'), 'utf8');
const PAGE_TSX = readFileSync(join(ROOT, 'web', 'src', 'pages', 'WealthReportPage.tsx'), 'utf8');
const PY_SRC = readFileSync(join(ROOT, 'astro', 'astro_matrix.py'), 'utf8');

/* ── 剥离注释（真值块）——「禁词扫描只扫真值块」铁律 ── */
const stripJs = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

/* ═══════════ 谓词（主测与注入自测同源取用）═══════════ */

/* ① 先锋战 —— ⚠️ 必须先**切片再剥注释**：整份 server.js 上跑 stripJs 会被
   「字符串/正则内的失衡 `/*`」吃掉大段（实测 L15641 预压缩层整段被吞）⇒ 假红。 */
const PP_START_MARK = 'const _PRECOMPRESS_EXTS';
const PP_END_MARK = 'if (existsSync(distPath))';
const precompressionBlock = (src) => {
  const i0 = src.indexOf(PP_START_MARK);
  if (i0 < 0) return '';
  const i1 = src.indexOf(PP_END_MARK, i0);
  return stripJs(src.slice(i0, i1 > 0 ? i1 : i0 + 4000));
};
const hasPrecompressLayer = (src) => {
  const c = precompressionBlock(src);
  return c.includes('_PRECOMPRESS_EXTS') && c.includes('_pickPrecompressed')
    && c.includes('_isFingerprintedAsset') && c.includes('Content-Encoding')
    && /public,\s*max-age=31536000,\s*immutable/.test(c)
    && c.includes("setHeader('Vary', 'Accept-Encoding')");
};
const hasImmutableCities = (src) =>
  /_IMMUTABLE_PATHS\s*=\s*new Set\(\[\s*'\/data\/cities\.json'\s*\]\)/.test(precompressionBlock(src));
const hasCityFingerprintUrl = (src) => {
  const c = stripJs(src);
  return c.includes('__CITIES_VERSION__') && /cities\.json\?v=\$\{/.test(c);
};

/* ② 主力战·前置锁（死锁表） */
const hasDeadlockTable = (src) => {
  const c = stripJs(src);
  return c.includes('deadlockSection')
    && /DEADLOCK TABLE/.test(c)
    && /ZERO TOLERANCE/.test(c)
    && /\|\s*Planet\s*\|\s*Sign\s*\|\s*House\s*\|\s*Retro\s*\|/.test(c);
};

/* ② 主力战·后置锁（Linter 纠偏 + 两处收口位接入） */
const hasOnceLintExports = (src) =>
  /export function lintNatalPlanetSigns/.test(src) && /export function correctNatalPlanetSigns/.test(src);
const countOnceLockCalls = (src) => (stripJs(src).match(/applyOnceNatalSignLock\(/g) || []).length;
const hasOnceLockBody = (src) => {
  const c = stripJs(src);
  return /function applyOnceNatalSignLock/.test(c)
    && /correctNatalPlanetSigns\(/.test(c) && /lintNatalPlanetSigns\(/.test(c)
    && /reportType\s*!==\s*'once'/.test(c);
};

/* ② 主力战·交付链（前端终稿采纳门）——
   判据 = 「登记行**夹在** sanitized 处理头 与 其后的 yearly/monthly 分支之间」。
   ⚠️ 不可用全局 `indexOf(branch)`：同形分支在文件更早处已出现多次 ⇒ 会取到错误的那个（实测假红）。 */
const hasSanMapAllChannel = (src) => {
  const c = stripJs(src);
  const iDecl = c.indexOf('const fixedText = parsed.sanitized || parsed.text;');
  const iSet = c.indexOf('_sanMap.set(_memKey, fixedText)');
  const iBranch = c.indexOf("if (type === 'yearly' || type === 'monthly')", iDecl);
  return iDecl > 0 && iSet > iDecl && iBranch > iSet && (iBranch - iSet) < 300;
};

/* ③ 顺带修正·周区间口径归一 */
const hasWeekRangeCanonical = (src) => {
  const c = stripJs(src);
  return !c.includes('Week 3 = 15–22') && !c.includes('Week 4 = 23–31')
    && /22–\{LASTDAY\}/.test(c) && !/15–22\]/.test(c) && !/23–\$\{lastDayOfMonth\}/.test(c);
};
const hasLastdayFill = (src) => /split\('\{LASTDAY\}'\)\.join\(/.test(stripJs(src));
const hasWeekRangeLock = (src) => {
  const c = stripJs(src);
  return /function lockMonthlyWeekRanges/.test(c)
    && (c.match(/lockMonthlyWeekRanges\(/g) || []).length >= 3;
};

/* ═══════════ A 组：修复在位（源码级真值）═══════════ */

test('A1 先锋战·预压缩产物齐备（public/ 与生产 dist/ 双侧 br+gz，压缩率 > 70%）', () => {
  const raw = statSync(join(ROOT, 'web', 'public', 'data', 'cities.json')).size;
  for (const dir of [join(ROOT, 'web', 'public', 'data'), join(ROOT, 'web', 'dist', 'data')]) {
    const base = join(dir, 'cities.json');
    assert.ok(existsSync(base), `缺 ${base}`);
    for (const ext of ['.br', '.gz']) {
      const f = base + ext;
      assert.ok(existsSync(f),
        `缺预压缩产物 ${f}（Dockerfile 禁容器内前端 rebuild ⇒ dist 侧必须随仓提交，否则线上永远拿不到压缩包）`);
      const sz = statSync(f).size;
      assert.ok(sz < raw * 0.3, `${f} 压缩率不足（${sz}/${raw}，应 < 30%）`);
    }
  }
});

test('A2 先锋战·服务端预压缩静态层（br/gzip 择优 + immutable + Vary + Content-Encoding）', () => {
  assert.ok(hasPrecompressLayer(SERVER), '预压缩静态层要素缺失（择优/压缩头/强缓存/Vary 任一断链）');
  assert.ok(hasImmutableCities(SERVER), '_IMMUTABLE_PATHS 未含 /data/cities.json');
});

test('A3 先锋战·前端内容指纹链路（vite define → useCitySearch ?v= → 类型声明）', () => {
  assert.ok(/define\s*:/.test(VITE) && VITE.includes('__CITIES_VERSION__'), 'vite 未注入 __CITIES_VERSION__');
  assert.ok(CITY_TS.includes('__CITIES_VERSION__'), 'useCitySearch 未读 __CITIES_VERSION__');
  assert.ok(hasCityFingerprintUrl(CITY_TS), '城市库 URL 未携带内容指纹（immutable 下升级即被旧缓存钉死）');
  assert.ok(existsSync(join(ROOT, 'web', 'src', 'ks-globals.d.ts')), '缺 __CITIES_VERSION__ 全局类型声明');
});

test('A4 先锋战·构建期自动产出预压缩（precompress / prebuild / build:web 三挂钩）', () => {
  for (const k of ['precompress', 'prebuild', 'build:web']) {
    assert.ok(/precompress-data\.mjs/.test(WEBPKG.scripts[k] || ''), `web/package.json scripts.${k} 未挂预压缩脚本`);
  }
});

test('A5 主力战·前置锁（《本命行星×星座×宫位死锁表》+ ZERO TOLERANCE 负向规则）', () => {
  assert.ok(hasDeadlockTable(CLIENT), '死锁表要素缺失（deadlockSection / 表头 / ZERO TOLERANCE 任一断链）');
  const iFn = CLIENT.indexOf('export function buildNatalAnchors');
  assert.ok(iFn > 0, '缺 buildNatalAnchors');
  const seg = CLIENT.slice(iFn, iFn + 20000);
  assert.ok(/deadlockSection,/.test(seg), '死锁表未进入 buildNatalAnchors 返回式（**装配断链** ⇒ 永不注入 Prompt）');
});

test('A6 主力战·后置锁（Linter 纠偏+复检 · 定义+非流式+流式 三处）', () => {
  assert.ok(hasOnceLintExports(CLIENT), 'v69_client 未导出 lintNatalPlanetSigns / correctNatalPlanetSigns');
  assert.ok(hasOnceLockBody(SERVER), 'applyOnceNatalSignLock 本体缺失（或未接纠偏/复检/once 门控）');
  const n = countOnceLockCalls(SERVER);
  assert.ok(n >= 3, `applyOnceNatalSignLock 调用点应 ≥3（1 定义 + 非流式 + 流式），实得 ${n}`);
});

test('A7 主力战·交付链根因（_sanMap 终稿登记上移至全通道，须在 yearly/monthly 分支之前）', () => {
  assert.ok(hasSanMapAllChannel(PAGE_TSX),
    '_sanMap 登记仍在 yearly/monthly 分支之内 ⇒ once 通道终稿不参与采纳 ⇒ 后端真值锁形同虚设（P0 回归）');
});

test('A8 顺带修正·周区间口径归一（模板层零冲突副本）', () => {
  assert.ok(hasWeekRangeCanonical(SERVER),
    '周区间口径未归一（残留 "Week 3 = 15–22" / "Week 4 = 23–31" / `15–22]` / `23–${lastDayOfMonth}` 任一）');
  assert.ok(hasLastdayFill(SERVER), '缺 {LASTDAY} 实填点（SLIM 包周 4 参数化后必须填充）');
  assert.ok(hasWeekRangeLock(SERVER), '缺 lockMonthlyWeekRanges（定义 + ≥2 接入点）');
  assert.ok(/week_ranges\s*=\s*\[\(1,\s*7\),\s*\(8,\s*14\),\s*\(15,\s*21\),\s*\(22,\s*last_day\)\]/.test(PY_SRC),
    '引擎周区间真值源漂移（astro_matrix.py 应为 [(1,7),(8,14),(15,21),(22,last_day)]）');
  assert.ok(/last_day\s*=\s*calendar\.monthrange\(year,\s*month\)\[1\]/.test(PY_SRC), '引擎末日真值源漂移');
});

/* ═══════════ B 组：行为真值（跑实现，不做纯文本猜测）═══════════ */

/* 抽取 lockMonthlyWeekRanges 全域（自包含 · VM 沙箱消费） */
function loadWeekRangeLock() {
  const i0 = SERVER.indexOf('const _MWR_MONTH_ABBR = {');
  const i1 = SERVER.indexOf('// 🛡️ V445：流年行星星座归属锁', i0);
  assert.ok(i0 > 0 && i1 > i0, '周区间锁抽取锚点漂移（连续切片失败）');
  const code = SERVER.slice(i0, i1);
  return new Function(code + '\n; return { lockMonthlyWeekRanges };')().lockMonthlyWeekRanges;
}
const MK = (monthKey, weeks) => ({
  months: [{ month_key: monthKey, month_name: 'X 2026',
    moon_weeks: weeks.map(([a, b], i) => ({ week: i + 1, from_day: a, to_day: b })) }],
});
const OCT = MK('2026-10', [[1, 7], [8, 14], [15, 21], [22, 31]]);

test('B1 行为·周区间锁：线上实捕缺陷整篇纠偏 + 幂等 + 缺真值透传', () => {
  const lock = loadWeekRangeLock();
  const report = [
    '[🟢 第1周：11月13日–7日（水星淬火 · 技能显化之窗）]',
    '[🔴 第2周：10月8日–14日（海王迷雾 · 绝对熔断）]',
    '[🔵 第3周：10月15日–22日（土星沉淀 · 静水深流）]',
    '[🟢 第4周：10月23日–31日（木星高光 · 收割落袋）]',
    '✦ [⚠️ 消费陷阱：2026年10月] ✦',
    '海王迷雾 · 绝对熔断日期区间为1–7日（月相过境第6/7/8/9宫期间）、8–14日（…）、15–21日（…）。',
  ].join('\n');
  const out = lock(report, 'zh', OCT, 'monthly');
  assert.ok(out.includes('第1周：10月1日–7日'), 'W1 月/日双错未纠（线上实捕缺陷形态）');
  assert.ok(out.includes('第3周：10月15日–21日'), 'W3 15–22 未归一为引擎真值 15–21');
  assert.ok(out.includes('第4周：10月22日–31日'), 'W4 23–31 未归一为引擎真值 22–31');
  assert.ok(!out.includes('11月13日'), '幻觉月份 11月 未清除');
  assert.ok(out.includes('区间为1–7日（月相过境第6/7/8/9宫期间）、8–14日（…）、15–21日（…）'),
    '消费陷阱段区间被误伤（射程外内容必须逐字不动）');
  assert.equal(lock(out, 'zh', OCT, 'monthly'), out, '幂等失败（二次施加 Δ≠0）');
  // 缺真值 / 坏真值 / 射程外 ⇒ 原文透传（禁伪造）
  const bad = '[🟢 第1周：11月13日–7日（…）]';
  assert.equal(lock(bad, 'zh', null, 'monthly'), bad, 'astroMatrix=null 未透传');
  assert.equal(lock(bad, 'zh', MK('2026-10', [[1, 7], [8, 14], [15, 21], [22, 5]]), 'monthly'), bad, '坏真值(to<from) 未透传');
  assert.equal(lock(bad, 'zh', OCT, 'once'), bad, 'once 通道越权介入');
  assert.equal(lock(bad, 'zh', OCT, 'yearly'), bad, 'yearly 通道越权介入');
  // 短月：末日随引擎真值
  assert.ok(lock('[🟢 第4周：2月22日–31日（…）]', 'zh', MK('2026-02', [[1, 7], [8, 14], [15, 21], [22, 28]]), 'monthly')
    .includes('第4周：2月22日–28日'), '短月末日未按引擎真值（28 日）');
  // 语域保留：全称月份名不得被降为缩写
  assert.equal(lock('[🟢 Week 1: October 1–7] sub', 'en', OCT, 'monthly'), '[🟢 Week 1: October 1–7] sub',
    'en 全称月份语域被擅改（应对正确文本零 churn）');
  assert.ok(lock('[🔵 Tuần 3: Tháng 10, Ngày 15–22] x', 'vi', OCT, 'monthly').includes('Tháng 10, Ngày 15–21'),
    'vi 全称月份令牌（含空格）未覆盖');
});

test('B2 行为·本命星座 Linter：六语幻觉纠偏归零 + 射程守卫（禁伪造）', async () => {
  const mod = await import(pathToFileURL(join(ROOT, 'v69_client.js')).href);
  const { lintNatalPlanetSigns, correctNatalPlanetSigns } = mod;
  const terms = await import(pathToFileURL(join(ROOT, 'astroTerms.js')).href);
  const { SUN_SIGNS, SIGN_KEYS } = terms;
  assert.equal(typeof correctNatalPlanetSigns, 'function', '缺 correctNatalPlanetSigns 导出');
  assert.equal(typeof lintNatalPlanetSigns, 'function', '缺 lintNatalPlanetSigns 导出');
  // ⚠️ computed_houses 键名 = **大写英文行星名**（引擎口径）；小写键 ⇒ 零检出（假绿陷阱）
  const matrix = { meta: {
    rising_sign: 'Cancer', sun_sign: 'Sagittarius',
    computed_houses: {
      Sun: { sign: 'Sagittarius', house: 12 }, Moon: { sign: 'Taurus', house: 6 },
      Mercury: { sign: 'Capricorn', house: 1 }, Venus: { sign: 'Libra', house: 11 },
      Mars: { sign: 'Cancer', house: 7 }, Jupiter: { sign: 'Gemini', house: 9 },
      Saturn: { sign: 'Aries', house: 7 }, Uranus: { sign: 'Aquarius', house: 5 },
      Neptune: { sign: 'Aquarius', house: 5 }, Pluto: { sign: 'Sagittarius', house: 11 },
    },
    natal_moon: { sign: 'Taurus', house: 6 },
    ascendant: { sign: 'Cancer', degree: 12.5 }, midheaven: null,
  } };
  const iGem = SIGN_KEYS.indexOf('Gemini'), iLib = SIGN_KEYS.indexOf('Libra');
  const cases = [
    ['zh', '你的本命木星在狮子座闪耀。', iGem, 'zh 全文式'],
    ['zh', '你的金星在天蝎座第11宫。', iLib, 'zh 全文式（金星）'],
    ['en', 'your natal Jupiter in Leo brings luck.', iGem, 'en'],
    ['es', 'tu Júpiter natal en Leo brilla.', iGem, 'es'],
    ['fr', 'votre Jupiter natal en Lion brille.', iGem, 'fr'],
    ['vi', 'Sao Mộc natal của bạn ở Sư Tử.', iGem, 'vi（行星在前语序）'],
  ];
  for (const [lang, src, idx, label] of cases) {
    const expected = SUN_SIGNS[lang][idx];   // 期望值取自**唯一术语真值源**（禁硬编码）
    assert.ok(!lintNatalPlanetSigns(src, lang, matrix).passed,
      `${label} 幻觉未检出 ⇒ Linter 射程不全：${src}`);
    const r = correctNatalPlanetSigns(src, lang, matrix);
    assert.ok(r.text.includes(expected), `${label} 未纠偏到真值「${expected}」：${r.text}`);
    assert.ok(lintNatalPlanetSigns(r.text, lang, matrix).passed, `${label} 纠偏后仍有残余违背`);
    assert.equal(correctNatalPlanetSigns(r.text, lang, matrix).text, r.text, `${label} 纠偏非幂等`);
  }
  // 射程守卫：流年语境弃权（宁漏不改）+ 缺真值零动作（绝不伪造）
  const transit = '流年木星在狮子座第6宫，本月人脉扩张。';
  assert.ok(lintNatalPlanetSigns(transit, 'zh', matrix).passed, '流年语境被误判为本命幻觉（越权误伤）');
  assert.equal(correctNatalPlanetSigns('你的本命木星在狮子座。', 'zh', { meta: {} }).text,
    '你的本命木星在狮子座。', '缺 computed_houses 时未零动作（禁伪造）');
  assert.equal(correctNatalPlanetSigns(null, 'zh', matrix).text, null, 'null 入参未原样返回（崩）');
});

test('B3 行为·前置锁死锁表：buildNatalAnchors 实际产出真值行', async () => {
  const mod = await import(pathToFileURL(join(ROOT, 'v69_client.js')).href);
  const matrix = { meta: {
    rising_sign: 'Cancer', sun_sign: 'Sagittarius',
    computed_houses: {
      Sun: { sign: 'Sagittarius', house: 12 }, Moon: { sign: 'Taurus', house: 6 },
      Mercury: { sign: 'Capricorn', house: 1 }, Venus: { sign: 'Libra', house: 11 },
      Mars: { sign: 'Cancer', house: 7 }, Jupiter: { sign: 'Gemini', house: 9 },
      Saturn: { sign: 'Aries', house: 7 }, Uranus: { sign: 'Aquarius', house: 5 },
      Neptune: { sign: 'Aquarius', house: 5 }, Pluto: { sign: 'Sagittarius', house: 11 },
    },
    natal_moon: { sign: 'Taurus', house: 6 },
    ascendant: { sign: 'Cancer', degree: 12.5 }, midheaven: null,
  } };
  const out = mod.buildNatalAnchors(matrix);
  const text = Array.isArray(out) ? out.join('\n') : String(out);
  assert.ok(/DEADLOCK TABLE/.test(text), 'buildNatalAnchors 产物缺死锁表');
  assert.ok(/\|\s*Planet\s*\|\s*Sign\s*\|\s*House\s*\|\s*Retro\s*\|/.test(text), '死锁表缺 Markdown 表头');
  assert.ok(/\|\s*Jupiter\s*\([^)]*\)\s*\|\s*Gemini\s*\|\s*9\s*\|/.test(text),
    '死锁表未含木星真值行（Gemini / H9）—— 前置锁未真正注入真值');
  assert.ok(/\|\s*Venus\s*\([^)]*\)\s*\|\s*Libra\s*\|\s*11\s*\|/.test(text),
    '死锁表未含金星真值行（Libra / H11）—— 线上幻觉的另一半未被锁');
  assert.ok(/ZERO TOLERANCE/.test(text), '缺零容忍负向规则（后置锁失效时无兜底语义）');
  assert.ok(/Your Natal Moon: Taurus in House 6/.test(text), '既有 PROSE 行被稀释（上游闸门射程受损）');
});

/* ═══════════ C 组：注入反漂移（复刻真实缺陷形态 ⇒ 判据必红）═══════════ */

test('C1 注入：摘掉 {LASTDAY} 实填 ⇒ A8 判据必红', () => {
  const broken = SERVER.replace(/\s*\.split\('\{LASTDAY\}'\)\.join\(_pkLastDay\)/, '');
  assert.notEqual(broken, SERVER, '注入锚点漂移（未命中 {LASTDAY} 实填表达式）');
  assert.ok(!hasLastdayFill(broken), '注入后仍检出 {LASTDAY} 填充 ⇒ A8 判据射程不全');
});

test('C2 注入：把 Week 3 口径回退为 15–22 ⇒ A8 判据必红', () => {
  const broken = SERVER.replace('Week 3 = 15–21', 'Week 3 = 15–22');
  assert.notEqual(broken, SERVER, '注入锚点漂移（未命中 "Week 3 = 15–21"）');
  assert.ok(!hasWeekRangeCanonical(broken), '注入后仍判为口径归一 ⇒ A8 判据射程不全');
});

test('C3 注入：把 /data/cities.json 移出 immutable 白名单 ⇒ A2 判据必红', () => {
  const broken = SERVER.replace("new Set(['/data/cities.json'])", 'new Set([])');
  assert.notEqual(broken, SERVER, '注入锚点漂移（未命中 _IMMUTABLE_PATHS 字面量）');
  assert.ok(!hasImmutableCities(broken), '注入后仍检出 immutable 白名单 ⇒ A2 判据射程不全');
});

test('C4 注入：摘掉流式链末 once 真值锁接入点 ⇒ A6 判据必红', () => {
  const broken = SERVER.replace(
    'cleanedText = applyOnceNatalSignLock(cleanedText, lang, astroMatrix, reportType);',
    'cleanedText = cleanedText; /* injected */');
  assert.notEqual(broken, SERVER, '注入锚点漂移（未命中流式接入点）');
  assert.ok(countOnceLockCalls(broken) < 3, '注入后调用点计数未下降 ⇒ A6 判据射程不全');
});

test('C5 注入：把 _sanMap 全通道登记退回 yearly/monthly 分支内 ⇒ A7 判据必红', () => {
  const SET_STMT = 'if (fixedText && fixedText.length >= 1000) _sanMap.set(_memKey, fixedText);';
  const moved = PAGE_TSX
    .replace(SET_STMT, '')
    .replace("if (type === 'yearly' || type === 'monthly') {",
      "if (type === 'yearly' || type === 'monthly') {\n if (fixedText && fixedText.length >= 1000) _sanMap.set(_memKey, fixedText);");
  assert.notEqual(moved, PAGE_TSX, '注入锚点漂移（未命中全通道登记行 / 类型分支）');
  assert.ok(!hasSanMapAllChannel(moved), '注入后仍判为全通道登记 ⇒ A7 判据射程不全');
});

/* ═══════════ D 组：段位守备（下界 + 相对位置，禁精确段数）═══════════ */

test('D1 段位守备：下界 ≥47 且 e40-compat 仍居收口位 len-2（禁精确段数）', () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim());
  assert.ok(segs.length >= 47, `test:astro 段数下界应 ≥47，实得 ${segs.length}`);
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.equal(iCap, segs.length - 2, 'e40-compat 收口位漂移（应紧邻 python 段，居 len-2）');
  const iMe = segs.findIndex((s) => s.includes('audit-e42plus-gate45d2-perf-truth-lock'));
  assert.ok(iMe !== -1 && iMe < iCap, 'Gate45D2 未入编或未置于收口位之前');
  assert.ok(segs[segs.length - 1].startsWith('python3 '), '链尾必须仍为 python 段');
});
