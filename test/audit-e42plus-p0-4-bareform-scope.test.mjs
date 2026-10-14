/**
 * P0-4 闸门（E42+ · P0-4）—— 「本命锁射程攻坚 A＋C」闸门
 *
 * 【战役背景】军师 2026-10-14 朱批：主攻 **A**（跨标点主星槽）＋ **C**（倒装式/无锚行星式），
 *   **严厉否决 B（歧义强行判定）/ D（dignity 锁）/ E（补远日星）**。
 *   立项依据：1979-11-11 上海盘 once 报告——引擎三锁**全绿**，独立探针却量出 **zh 15 ＋ en 6** 处硬违背，
 *   双锁**实际纠偏 0 处（完全空转）**。根因即锁的射程缺口（详见铁律 22「五类盲区」）。
 *
 *   🔴 A 组 · 宫主星槽被**逗号阻断**（v69_client.js `_ksHouseClaimRes`）
 *     「第10宫宫头是天蝎座**，**主星本命水星」——原窗 `G` 显式排除 `，,、；;` ⇒ 整条弃权。
 *     治法：新增 `GL`（放行分句标点 `，,、；;：:`，仍禁句末标点与 `—–`），
 *      **仅**御 order-2（H→主星）与 order-5（H→宫头）两式；并配「复合句守卫」`_headClaimRe`
 *      （跨标点时标点前片段须含宫头槽 CK 或星座令牌，否则判越界桥接 ⇒ 弃权）。
 *     另补词表「古典主星 / 现代主星」（en `classical/modern/traditional ruler`）。
 *
 *   🔴 C 组 · 星座锁**只认「本命」锚**（v69_client.js `_ksScanNatalSigns`）
 *     中文最常用修辞恰恰是**倒装**（「天秤座月亮」）与**无锚**（「金星天蝎座」），英文写 `Mercury in Scorpio`
 *     ⇒ 缺锚即整体弃权、纠偏量 0。治法：`opts.bareForms` 开启后纳入两式，**十重守卫**缺一弃权。
 *
 *   🔴 射程铁律：`bareForms` **线上升级只开 `once`**。
 *     离线取证：monthly/yearly 通篇流年叙述，无修饰词句式与流年句**结构同形**
 *     ⇒ 全开会误改 `transiting Mars and Jupiter in Leo`、`2027年5月: 太阳金牛座`、`June 2027: Sun in Gemini`。
 *     ⇒ server.js 两把锁统一以 `{ bareForms: reportType === 'once' }` 传入（宁漏不改，monthly/yearly 另立挂账）。
 *
 * 【闸门纪律】
 *   · 源码级断言**只扫真值块**（剥注释后）；锚点**逐字取自真实源码**（禁臆造 —— 铁律 15③）。
 *   · 注入反漂移：**每一组判据都要有牙** —— 篡改真实源码 ⇒ 判据必红（铁律 13「可判别」）。
 *   · 行为真值优先：能跑实现就**跑实现**（源码抽取 + `new Function` / 临时夹具 `import`）。
 *   · 段位守备：**下界 + 相对位置**（禁精确段数 —— Gate41 血训）。
 *
 * 【纯 Node 运行】无网络 / 无 LLM / 无 Python。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SERVER = readFileSync(join(ROOT, 'server.js'), 'utf8');
const CLIENT = readFileSync(join(ROOT, 'v69_client.js'), 'utf8');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const M = await import(pathToFileURL(join(ROOT, 'v69_client.js')).href);

/* ── 源码抽取器（VM 抽取式消费者：常量须在函数体内，禁改 import）── */
const extractFn = (src, name) => {
  const i = src.indexOf('function ' + name + '(');
  if (i < 0) return null;
  const e = src.indexOf('\n}\n', i);
  return e < 0 ? null : src.slice(i, e + 3);
};
const fakeConsole = { log() {}, warn() {} };

/* ── 锁装配（与 45-G 闸门同源手法）── */
const buildSignLock = (serverSrc) => {
  const body = extractFn(serverSrc, 'applyOnceNatalSignLock');
  assert.ok(body, 'applyOnceNatalSignLock 抽取失败（收口位锚点漂移）');
  return new Function('correctNatalPlanetSigns', 'lintNatalPlanetSigns', 'console',
    body + '\n; return applyOnceNatalSignLock;')(
    M.correctNatalPlanetSigns, M.lintNatalPlanetSigns, fakeConsole);
};
const buildHouseLock = (serverSrc) => {
  const body = extractFn(serverSrc, 'applyOnceHouseLock');
  assert.ok(body, 'applyOnceHouseLock 抽取失败（收口位锚点漂移）');
  return new Function('correctHouseRulersAndCups', 'lintHouseRulersAndCups',
    'correctNatalPlanetSigns', 'lintNatalPlanetSigns', 'console',
    body + '\n; return applyOnceHouseLock;')(
    M.correctHouseRulersAndCups, M.lintHouseRulersAndCups,
    M.correctNatalPlanetSigns, M.lintNatalPlanetSigns, fakeConsole);
};
const signLock = buildSignLock(SERVER);
const houseLock = buildHouseLock(SERVER);
/** 完整收口链（与线上同序：星座锁 → 宫位锁的不动点收口） */
const chain = (t, lang, mx, ty) => houseLock(signLock(t, lang, mx, ty), lang, mx, ty);

/* ── 临时夹具：篡改版 `v69_client.js` 落盘 → 动态 import（铁律 12/14 同族：须并 copy 兄弟依赖）── */
const withVariant = async (mutated, fn) => {
  const d = mkdtempSync(join(tmpdir(), 'ks-p04-'));
  try {
    writeFileSync(join(d, 'v69_client.js'), mutated);
    copyFileSync(join(ROOT, 'astroTerms.js'), join(d, 'astroTerms.js'));
    // 🔴 铁律 14 血训：`astroTerms.js` 会 `require('./astro/astro_terms_dict.json')`
    //   ⇒ 夹具**必须并 copy 兄弟依赖**（否则 `MODULE_NOT_FOUND` 假红）。
    mkdirSync(join(d, 'astro'), { recursive: true });
    copyFileSync(join(ROOT, 'astro', 'astro_terms_dict.json'), join(d, 'astro', 'astro_terms_dict.json'));
    writeFileSync(join(d, 'package.json'), JSON.stringify({ type: 'module' }));
    const mod = await import(pathToFileURL(join(d, 'v69_client.js')).href + '?v=' + Date.now());
    return await fn(mod);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
};

/* ══════════════════════════════════════════════════════════════════════════
   真值盘（**逐宫核对后写死** —— 铁律：「合成真值盘必逐宫核对再写用例」）
   源：S02 盘（1997-10-18 · 引擎实算 `/tmp/ksp04_matrices.json`），此处固化其 meta 三表。
   ══════════════════════════════════════════════════════════════════════════ */
const MX = {
  meta: {
    house_cusps_full: {
      house_1: { sign: 'Capricorn' }, house_2: { sign: 'Aquarius' }, house_3: { sign: 'Pisces' },
      house_4: { sign: 'Aries' }, house_5: { sign: 'Taurus' }, house_6: { sign: 'Gemini' },
      house_7: { sign: 'Cancer' }, house_8: { sign: 'Leo' }, house_9: { sign: 'Virgo' },
      house_10: { sign: 'Libra' }, house_11: { sign: 'Scorpio' }, house_12: { sign: 'Sagittarius' },
    },
    house_rulers: {
      house_1: { classical: { planet: 'Saturn' }, modern: { planet: 'Saturn' } },
      house_2: { classical: { planet: 'Saturn' }, modern: { planet: 'Uranus' } },
      house_3: { classical: { planet: 'Jupiter' }, modern: { planet: 'Neptune' } },
      house_4: { classical: { planet: 'Mars' }, modern: { planet: 'Mars' } },
      house_5: { classical: { planet: 'Venus' }, modern: { planet: 'Venus' } },
      house_6: { classical: { planet: 'Mercury' }, modern: { planet: 'Mercury' } },
      house_7: { classical: { planet: 'Moon' }, modern: { planet: 'Moon' } },
      house_8: { classical: { planet: 'Sun' }, modern: { planet: 'Sun' } },
      house_9: { classical: { planet: 'Mercury' }, modern: { planet: 'Mercury' } },
      house_10: { classical: { planet: 'Venus' }, modern: { planet: 'Venus' } },
      house_11: { classical: { planet: 'Mars' }, modern: { planet: 'Pluto' } },
      house_12: { classical: { planet: 'Jupiter' }, modern: { planet: 'Jupiter' } },
    },
    computed_houses: {
      Sun: { sign: 'Sagittarius', house: 12 }, Moon: { sign: 'Leo', house: 8 },
      Mercury: { sign: 'Sagittarius', house: 11 }, Venus: { sign: 'Aquarius', house: 1 },
      Mars: { sign: 'Cancer', house: 7 }, Jupiter: { sign: 'Libra', house: 10 },
      Saturn: { sign: 'Aquarius', house: 2 }, Uranus: { sign: 'Capricorn', house: 12 },
      Neptune: { sign: 'Capricorn', house: 12 }, Pluto: { sign: 'Scorpio', house: 11 },
    },
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   A 组：源码级 —— 射程开关接线（bareForms 仅 once）+ A/C 改造件齐备
   ══════════════════════════════════════════════════════════════════════════ */
test('A1 接线：两把锁体内均有 `_signOpts = { bareForms: reportType === \'once\' }`', () => {
  const SW = "const _signOpts = { bareForms: reportType === 'once' };";
  const bSign = extractFn(SERVER, 'applyOnceNatalSignLock') || '';
  const bHouse = extractFn(SERVER, 'applyOnceHouseLock') || '';
  assert.ok(bSign.includes(SW), 'applyOnceNatalSignLock 体内缺射程开关（线上升级不生效）');
  assert.ok(bHouse.includes(SW), 'applyOnceHouseLock 体内缺射程开关（不动点内口径分立）');
});

test('A2 接线：4 处调用点均传 `_signOpts`', () => {
  const bSign = extractFn(SERVER, 'applyOnceNatalSignLock') || '';
  const bHouse = extractFn(SERVER, 'applyOnceHouseLock') || '';
  assert.ok(bSign.includes('correctNatalPlanetSigns(text, lang, astroMatrix, _signOpts)'), '星座锁纠偏未传开关');
  assert.ok(bSign.includes('lintNatalPlanetSigns(r.text, lang, astroMatrix, _signOpts)'), '星座锁复检未传开关');
  assert.ok(bHouse.includes('correctNatalPlanetSigns(cur, lang, astroMatrix, _signOpts)'), '宫位锁不动点内星座锁未传开关');
  assert.ok(bHouse.includes('lintNatalPlanetSigns(cur, lang, astroMatrix, _signOpts)'), '宫位锁终局复检未传开关');
});

test('A3 A 组改造件齐备（复合句条件**内建于正则** + 词表补齐）', () => {
  assert.ok(CLIENT.includes("const GL = '[^。\\\\n！？!?—–]{0,16}?';"), 'GL 声明缺失');
  assert.ok(CLIENT.includes("const SEP = '[，,、；;：:]';"), 'SEP 声明缺失');
  // 🔴 order-2 必须保持**严格窗 G**（不跨分句标点）—— 无约束宽窗会吞掉后续合法声称（回归血训）
  assert.ok(CLIENT.includes("|(?<h2>' + H + ')' + G + RW + G + '(?<p2>' + planetAlt + ')"),
    'order-2 未保持严格窗 G');
  assert.ok(!CLIENT.includes("|(?<h2>' + H + ')' + GL + RW + GL + '(?<p2>' + planetAlt + ')"),
    'order-2 仍为无约束宽窗 ⇒ 存在「整段吞噬后续声称」风险（gate45f B4③ 回归形态）');
  // 🔴 order-2b 复合句分支：条件**内建于正则本体**
  assert.ok(CLIENT.includes("|(?<h2b>' + H + ')' + GL + '(?:' + CK + '|' + signAlt + ')' + GL + SEP + GL + RW + GL + '(?<p2b>' + planetAlt + ')"),
    'order-2b 复合句分支缺失（或未内建「分句标点前须为宫头声称」条件）');
  // order-5 宫头同理保持严格窗 G
  assert.ok(CLIENT.includes("'(?<h5>' + H + ')' + G + CK + G + '(?<s5>' + signAlt + ')'"),
    'order-5 未保持严格窗 G（同类吞噬风险）');
  // 新具名组必须被扫描核消费
  assert.ok(CLIENT.includes("const hTok = g.h1 || g.h2 || g.h2b || g.h3 || g.h4 || g.h8 || '';"),
    'h2b 未纳入宫位令牌提取');
  assert.ok(CLIENT.includes("const pTok = g.p1 || g.p2 || g.p2b || g.p3 || g.p4 || g.p5 || '';"),
    'p2b 未纳入行星令牌提取');
  // 已被替代的事后守卫不得残留（死代码）
  assert.ok(!CLIENT.includes('_headClaimRe'), '_headClaimRe 事后守卫残留（条件应内建于正则）');
  // 词表补齐「古典/现代主星」
  assert.ok(CLIENT.includes("zh: '(?:古典主星|现代主星|宫主星|主管|主星|守护星|主宰|统辖)',"),
    'zh 主星词表未补「古典主星/现代主星」');
  assert.ok(CLIENT.includes('classical\\\\s+ruler') && CLIENT.includes('traditional\\\\s+ruler'),
    'en 主星词表未补 classical/traditional ruler');
});

test('A4 C 组改造件齐备（bareForms 门控 + 两张守卫表 + 十重守卫谓词）', () => {
  assert.ok(CLIENT.includes('function _ksScanNatalSigns(text, lang, astroMatrix, opts) {'), '扫描核未加 opts');
  assert.ok(CLIENT.includes('if (opts && opts.bareForms) {'), '裸式块未门控在 opts.bareForms ⇒ 默认行为被改');
  assert.ok(CLIENT.includes('export function lintNatalPlanetSigns(text, lang, astroMatrix, opts) {'), 'lint 未加 opts');
  assert.ok(CLIENT.includes('export function correctNatalPlanetSigns(text, lang, astroMatrix, opts) {'), 'correct 未加 opts');
  assert.ok((CLIENT.match(/const \{ hits, checked \} = _ksScanNatalSigns\(text, lang, astroMatrix, opts\);/g) || []).length === 2,
    'opts 未同时透传到 lint / correct 两通道');
  assert.ok(CLIENT.includes('const _KS_CONJ = {'), '_KS_CONJ 连词表缺失（幂等守卫）');
  assert.ok(CLIENT.includes("zh: '(?:以及|及|和|与|跟|同)',"), '_KS_CONJ zh 项缺失');
  assert.ok(CLIENT.includes('const _KS_SIGN_LINK = {'), '_KS_SIGN_LINK 虚词白名单缺失（防越界桥接）');
  assert.ok(CLIENT.includes('zh: /^(?:|在|是|为|落|落入|落在|落于|位于|处于|临|的|之|也是|便是|则为|即)$/,'),
    '_KS_SIGN_LINK zh 项缺失');
  assert.ok(CLIENT.includes('const _KS_ORBIT_WORDS = ['), '顺逆行/过境动状词表缺失');
});

/* ══════════════════════════════════════════════════════════════════════════
   B 组：行为级 —— 跑实现（收口链）
   ══════════════════════════════════════════════════════════════════════════ */
test('B1 A 组·跨逗号主星槽：`第N宫宫头是X座，主星Y` 被纠偏', () => {
  const src = '第10宫宫头是天秤座，主星是火星。';
  const out = chain(src, 'zh', MX, 'once');
  assert.ok(out.includes('主星是金星'), `跨逗号主星槽未纠偏（真值 H10=金星）⇒ ${out}`);
  assert.ok(!/主星是火星/.test(out), `纠偏后仍残留错误主星 ⇒ ${out}`);
});

test('B2 A 组·复合句守卫：越界桥接（前置分句非宫头声称）必须弃权', () => {
  const src = '第4宫代表家庭，其主星是金星。';
  assert.equal(chain(src, 'zh', MX, 'once'), src,
    '复合句守卫失能：前置分句「第4宫代表家庭」无宫头槽/星座令牌，却被当作主星声称');
});

test('B3 A 组·词表形态覆盖：`第N宫古典主星是Y` 被纠偏（判别力在 C5 源码级）', () => {
  const src = '第10宫古典主星是火星。';
  const out = chain(src, 'zh', MX, 'once');
  assert.ok(out.includes('古典主星是金星'), `「古典主星」词表未生效 ⇒ ${out}`);
});

test('B4 C 组·once 倒装式 `<星座>座<行星>` 被纠偏', () => {
  const src = '天蝎座金星让你优雅迷人，狮子座月亮令你情感丰沛。';
  const out = chain(src, 'zh', MX, 'once');
  assert.ok(out.includes('水瓶座金星'), `once 倒装式未纠偏（金星真值水瓶）⇒ ${out}`);
  assert.ok(out.includes('狮子座月亮'), `月亮本已正确却被擅改 ⇒ ${out}`);
});

test('B5 C 组·once 无锚行星式 `<行星><星座>` 被纠偏', () => {
  const src = '金星天蝎座，让你在人际关系中极具吸引力。';
  const out = chain(src, 'zh', MX, 'once');
  assert.ok(out.includes('金星水瓶座'), `once 无锚行星式未纠偏 ⇒ ${out}`);
});

test('B6 C 组·once en `Planet in Sign` 被纠偏', () => {
  const src = 'Mercury in Leo sharpens your intellect, while Mars in Aries drives you.';
  const out = chain(src, 'en', MX, 'once');
  assert.ok(out.includes('Mercury in Sagittarius'), `en 无锚式未纠偏（Mercury 真值 Sagittarius）⇒ ${out}`);
  assert.ok(out.includes('Mars in Cancer'), `Mars 真值 Cancer 未纠偏 ⇒ ${out}`);
});

test('B7 射程锁死：monthly / yearly 的裸式句**逐字透传**（宁漏不改，防流年误伤）', () => {
  const cases = [
    ['zh', '天蝎座金星让你优雅迷人。'],
    ['zh', '金星天蝎座，让你极具吸引力。'],
    ['en', 'Mercury in Leo sharpens your intellect.'],
    ['en', 'Leo Mercury colours your thinking.'],
    // 真实流年语料形态（离线取证：全开时曾被误改）
    ['en', 'Your transiting Mars and Jupiter in Leo bring momentum.'],
    ['zh', '2027年5月: 太阳金牛座 第五宫。'],
    ['en', 'June 2027: Sun in Gemini brings a fresh start.'],
  ];
  for (const [lang, src] of cases) {
    for (const ty of ['monthly', 'yearly']) {
      assert.equal(chain(src, lang, MX, ty), src,
        `[${lang}/${ty}] 裸式射程越界（monthly/yearly 被擅自改动）⇒ ${chain(src, lang, MX, ty)}`);
    }
  }
});

test('B8 零回归：monthly 锚定式（45-G 既有射程）仍正常纠偏', () => {
  const src = '你的本命金星落在天蝎座，带来了深情的特质。';
  const out = chain(src, 'zh', MX, 'monthly');
  assert.ok(out.includes('水瓶座'), `monthly 锚定式射程回归受损 ⇒ ${out}`);
});

test('B9 幂等：once 收口链二次施加 Δ=0', () => {
  const cases = [
    '天蝎座金星让你优雅迷人。',
    '金星天蝎座，让你极具吸引力。',
    '你的本命金星落在天蝎座，带来了深情的特质。',
    '第10宫宫头是天秤座，主星是火星。',
    '第10宫古典主星是火星。',
    'Mercury in Leo sharpens your intellect, while Mars in Aries drives you.',
    'Leo Mercury colours your thinking.',
  ];
  for (const src of cases) {
    const a = chain(src, 'zh', MX, 'once');
    const b = chain(a, 'zh', MX, 'once');
    assert.equal(a, b, `once 幂等 Δ≠0：${JSON.stringify(a)} → ${JSON.stringify(b)}`);
    const a2 = chain(src, 'en', MX, 'once');
    const b2 = chain(a2, 'en', MX, 'once');
    assert.equal(a2, b2, `once(en) 幂等 Δ≠0：${JSON.stringify(a2)} → ${JSON.stringify(b2)}`);
  }
});

test('B10 收敛：宫位锁不动点循环一轮内到点（A 组句零 churn）', () => {
  const src = '第10宫宫头是天秤座，主星是火星。';
  assert.equal(M.lintHouseRulersAndCups(chain(src, 'zh', MX, 'once'), 'zh', MX).passed, true,
    '收口后仍残留宫位违背（不动点未收敛）');
  assert.equal(M.lintNatalPlanetSigns(chain(src, 'zh', MX, 'once'), 'zh', MX, { bareForms: true }).passed, true,
    '收口后仍残留星座违背');
});

test('B11 默认关闭：`opts` 缺省时（三参调用）行为与历史一致', () => {
  const src = '天蝎座金星让你优雅迷人。';
  assert.equal(M.correctNatalPlanetSigns(src, 'zh', MX).text, src, 'opts 缺省仍改写裸式（默认行为被破）');
  assert.equal(M.lintNatalPlanetSigns(src, 'zh', MX).passed, true, 'opts 缺省仍报裸式违背（默认行为被破）');
  assert.equal(M.correctNatalPlanetSigns(src, 'zh', MX, { bareForms: true }).text, '水瓶座金星让你优雅迷人。',
    'bareForms=true 未生效');
});

test('B12 零吞噬（回归守备）：同一分句内的两条宫位声称必须**同时**检出（同篇矛盾审计不死）', () => {
  // 🔴 2026-10-14 血训：A 组一度把 order-2 换成无约束宽窗 `GL`，
  //   「第11宫由月亮主管**，**第11宫的主星其实是金星」被整段吞成一个匹配 ⇒ order-4 永不触发 ⇒
  //   gate45f B4③「同宫双主星」判据由 V2/C1 静默跌至 V0/C0。本用例为该回归的**常驻守备**。
  const cases = [
    ['第11宫由月亮主管，第11宫的主星其实是金星。', 'ruler', 'H11'],
    ['第10宫的宫头是射手座，第10宫宫头又是双鱼座。', 'cusp', 'H10'],
    ['你的本命月亮在第11宫发光，你的本命月亮也在第1宫。', 'planet_house', 'Moon'],
  ];
  for (const [src, kind, key] of cases) {
    const l = M.lintHouseRulersAndCups(src, 'zh', MX);
    assert.ok(l.conflicts.some((x) => x.kind === kind && x.key === key),
      `零吞噬失守（[${kind}:${key}] 同篇矛盾未检出）⇒ ${src}`);
  }
});

test('B13 越界桥接仍弃权（A 组放宽不得把「H 主管<宾语>，<另一分句>」读成主星声称）', () => {
  const cases = [
    '第4宫代表家庭，其主星是金星。',
    '第7宫主管婚姻与伴侣关系，金星在此闪耀。',
    '第2宫的钱财领域，主星是水星。',
  ];
  for (const src of cases) {
    assert.equal(M.correctHouseRulersAndCups(src, 'zh', MX).text, src, `越界桥接被误改 ⇒ ${src}`);
  }
});

test('B14 违背对象契约：`violations[]` 四字段齐备（foundSign 不得为 undefined —— 可观测性）', () => {
  // 🔴 历史遗留：两条 loop 均漏设 `foundSign` ⇒ 报告恒 `X:undefined(期望 Y)`。
  //   P0-4 新增了整条违背产出通道（裸式），此契约必须守死，否则线上告警无法定位。
  const cases = [
    ['zh', '你的本命金星落在天蝎座。', undefined],
    ['zh', '天蝎座金星让你优雅迷人。', { bareForms: true }],
    ['zh', '金星天蝎座，让你极具吸引力。', { bareForms: true }],
    ['en', 'Mercury in Leo sharpens your intellect.', { bareForms: true }],
  ];
  for (const [lang, src, opts] of cases) {
    const vs = M.lintNatalPlanetSigns(src, lang, MX, opts).violations;
    assert.ok(vs.length >= 1, `[${lang}] 用例未产出违背 ⇒ 用例失效：${src}`);
    for (const v of vs) {
      assert.equal(typeof v.planet, 'string', `[${lang}] planet 缺失`);
      assert.equal(typeof v.expectedSign, 'string', `[${lang}] expectedSign 缺失`);
      assert.equal(typeof v.foundSign, 'string', `[${lang}] foundSign 缺失（undefined）⇒ ${src}`);
      assert.equal(typeof v.context, 'string', `[${lang}] context 缺失`);
    }
  }
});

test('B15 违背对象契约守备（注入有牙）：摘掉裸式 `foundSign` ⇒ B14 必红', async () => {
  const anchor = 'foundSign: SIGN_KEYS[foundIdx],   // 🔴 P0-4 顺带修复：同锚定式，补 `foundSign`（见上注）';
  assert.ok(CLIENT.includes(anchor), '裸式 foundSign 锚点未命中');
  await withVariant(CLIENT.replace(anchor, ''), async (mod) => {
    const src = '天蝎座金星让你优雅迷人。';
    const vs = mod.lintNatalPlanetSigns(src, 'zh', MX, { bareForms: true }).violations;
    assert.ok(vs.length >= 1, '注入后用例未产出违背（前置失败）');
    assert.equal(vs[0].foundSign, undefined, '判据无牙：摘掉 foundSign 后仍非 undefined');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   C 组：注入反漂移 —— 篡改真实源码 ⇒ 判据必红（有牙证明）
   ══════════════════════════════════════════════════════════════════════════ */
test('C1 注入·射程开关：把 `reportType === \'once\'` 改 `true` ⇒ monthly 裸式被改（判据有牙）', () => {
  const tampered = SERVER.replace(
    "const _signOpts = { bareForms: reportType === 'once' };",
    'const _signOpts = { bareForms: true };');
  assert.notEqual(tampered, SERVER, '注入锚点未命中（开关形态漂移）');
  const lock = buildSignLock(tampered);
  const src = '天蝎座金星让你优雅迷人。';
  const orig = signLock(src, 'zh', MX, 'monthly');
  const inj = lock(src, 'zh', MX, 'monthly');
  assert.equal(orig, src, '原实现 monthly 已被改动（前置断言失败）');
  assert.ok(inj.includes('水瓶座'), `判据无牙：射程开关被放开后 monthly 仍未改裸式 ⇒ ${inj}`);
});

test('C2 注入·v69 门控：把 `if (opts && opts.bareForms)` 改 `if (true)` ⇒ 缺省调用被改（判据有牙）', async () => {
  const src = '天蝎座金星让你优雅迷人。';
  // 原实现（缺省 opts）必须不动（前置基线）
  assert.equal(M.correctNatalPlanetSigns(src, 'zh', MX).text, src, '原实现缺省已被改动（前置基线失败）');
  const tampered = CLIENT.replace('if (opts && opts.bareForms) {', 'if (true) {');
  assert.notEqual(tampered, CLIENT, '注入锚点未命中（bareForms 门控形态漂移）');
  await withVariant(tampered, async (mod) => {
    assert.equal(mod.correctNatalPlanetSigns(src, 'zh', MX).text, '水瓶座金星让你优雅迷人。',
      '判据无牙：门控被拆除后默认仍未覆盖裸式 ⇒ B11 不是有效判据');
  });
});

const GOOD_H2B = "|(?<h2b>' + H + ')' + GL + '(?:' + CK + '|' + signAlt + ')' + GL + SEP + GL + RW + GL + '(?<p2b>' + planetAlt + ')";

test('C3 注入·复合句条件（A 组）：把 order-2b 退化为无约束宽窗 ⇒ 吞噬后续声称（判据有牙）', async () => {
  const src = '第11宫由月亮主管，第11宫的主星其实是金星。';
  assert.ok(CLIENT.includes(GOOD_H2B), 'order-2b 锚点未命中');
  // 原实现（条件内建）必须同时检出两条声称 ⇒ 同篇矛盾成立（前置基线）
  assert.equal(M.lintHouseRulersAndCups(src, 'zh', MX).conflicts.some((x) => x.kind === 'ruler' && x.key === 'H11'),
    true, '原实现已失效（前置基线失败）');
  const degraded = CLIENT.replace(GOOD_H2B, "|(?<h2b>' + H + ')' + GL + RW + GL + '(?<p2b>' + planetAlt + ')");
  assert.notEqual(degraded, CLIENT, '注入锚点未命中');
  await withVariant(degraded, async (mod) => {
    assert.equal(mod.lintHouseRulersAndCups(src, 'zh', MX).conflicts.length, 0,
      '判据无牙：退化为宽窗后仍能检出同篇矛盾 ⇒ B12 不是有效判据');
  });
});

test('C4 注入·复合句分支（A 组）：摘掉 order-2b ⇒ 跨逗号主星槽失效（判据有牙）', async () => {
  const src = '第10宫宫头是天秤座，主星是火星。';
  assert.ok(CLIENT.includes(GOOD_H2B), 'order-2b 锚点未命中');
  assert.ok(M.correctHouseRulersAndCups(src, 'zh', MX).text.includes('主星是金星'),
    '原实现已失效（前置基线失败）');
  await withVariant(CLIENT.replace(GOOD_H2B, ''), async (mod) => {
    assert.equal(mod.correctHouseRulersAndCups(src, 'zh', MX).text, src,
      '判据无牙：摘掉 order-2b 后跨逗号句仍被纠偏 ⇒ B1 不是有效判据');
  });
});

test('C5 注入·词表（A 组 · **源码级判据**）：摘掉「古典主星/现代主星」⇒ 判据必红（有牙）', () => {
  // 🔴 铁律 13 同族处置（45-G C5 反例复现）：本项**行为层不可判别** ——
  //   zh 表内 `主星` 是 `古典主星` 的**子串**，en 表内 `ruler of`/`ruler is` 亦覆盖 `classical ruler`
  //   ⇒ 摘掉新词条后，「第10宫古典主星是火星」**仍**被纠偏（regex 扫描落到 `主星` 上）。
  //   故按军师旧例改判**源码级**判据：判据本体 = 「真值块内可见新词条」，注入后必翻转。
  // 🔴 铁律 7「禁词扫描只扫真值块」：注释里也写着「古典主星/现代主星」⇒ 判据必须**先切片再判**。
  const sliceTable = (src) => {
    const i = src.indexOf('const _KS_RULER_KW = {');
    if (i < 0) return '';
    const e = src.indexOf('};', i);
    return e < 0 ? '' : src.slice(i, e + 2);
  };
  const judge = (src) => {
    const t = sliceTable(src);
    return t.includes('古典主星') && t.includes('现代主星');
  };
  assert.equal(judge(CLIENT), true, '判据基线失败：真值表内未见「古典主星/现代主星」');
  const anchor = "zh: '(?:古典主星|现代主星|宫主星|主管|主星|守护星|主宰|统辖)',";
  assert.ok(CLIENT.includes(anchor), 'zh 主星词表锚点未命中');
  const tampered = CLIENT.replace(anchor, "zh: '(?:宫主星|主管|主星|守护星|主宰|统辖)',");
  assert.notEqual(tampered, CLIENT, '注入锚点未命中（词表形态漂移）');
  assert.equal(judge(tampered), false, '判据无牙：摘掉新词条后判据仍为真');
  // en 侧同族（同样取源码级 + 切片：注释内亦含该词条字面量）
  const judgeEn = (src) => sliceTable(src).includes('classical\\\\s+ruler') && sliceTable(src).includes('traditional\\\\s+ruler');
  assert.equal(judgeEn(CLIENT), true, '判据基线失败：en 真值表内未见 classical/traditional ruler');
  assert.equal(judgeEn(CLIENT.replace('classical\\\\s+ruler|', '')), false, '判据无牙：en 词条摘除后仍为真');
});

/* ══════════════════════════════════════════════════════════════════════════
   D 组：段位守备（下界 + 相对位置；禁精确段数）
   ══════════════════════════════════════════════════════════════════════════ */
test('D1 段位守备：下界 ≥51 且 e40-compat 仍居收口位 len-2（禁精确段数）', () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim());
  assert.ok(segs.length >= 51, `test:astro 段数下界应 ≥51（50 + P0-4），实得 ${segs.length}`);
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.equal(iCap, segs.length - 2, 'e40-compat 收口位漂移（应紧邻 python 段，居 len-2）');
  const iMe = segs.findIndex((s) => s.includes('audit-e42plus-p0-4-bareform-scope'));
  assert.ok(iMe !== -1, 'P0-4 闸门未入编 test:astro（写好不接线 = 永不运行）');
  assert.ok(iMe < iCap, 'P0-4 闸门未置于收口位之前');
  assert.ok(segs[segs.length - 1].startsWith('python3 '), '链尾必须仍为 python 段');
});
