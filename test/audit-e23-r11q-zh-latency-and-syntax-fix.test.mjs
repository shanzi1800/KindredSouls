// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ E23/R11q 闸门：中文首刷重试根治（astro-validator 误报窄化）+ 语法残影收网
// ═══════════════════════════════════════════════════════════════════════════
// 【立案背景】（2026-10-06 军师密令）
//   s1/s7 zh 的 MISS 稳定为其他语种的 2~3 倍（116~121s vs 51~85s）。军师原判「CRITIC 误报
//   + R3 重试」，**本地复现后推翻**：真凶是 `astro-validator.js`（V97f Astro-Logic Validator
//   断路器）—— 它每失败一次就**整篇重生成**（最多 3 次）。本地起 server.js（零 DB 隔离）
//   复现 s1 zh：MISS **128.9s**，日志 `[Validator] attempt 1/3 → 2/3 → 3/3 FAILED ⇒ 降级交付`
//   （三次完整生成），**而 `[CRITIC] 预缓存校验通过 ✅`** —— CRITIC 根本没拦。
//   五处误报（均以线上/本地实证病句为据，逐条窄化；检出目标与检出能力全部保留）：
//     ① 规则1 外行星：拿**流年**年度主题（硬编码 木星狮子/土星白羊/冥王水瓶）比对，
//        而报告合法同时陈述**本命**盘位置 ⇒ s1「木星在水瓶座第3宫」（本命真值 = Aquarius/H3）
//        被判「星座矛盾 + 宫位矛盾」⇒ 每稿必挂。治法：接受集合扩张为「流年 ∪ 本命」**成对**一致。
//     ② 规则6 未提供行星：硬编码「火星不在 AstroMatrix 中」**与事实相反**（引擎提供 Mars、
//        FACT_SHEET `Mars: <sign> House <n>`、buildPerMonthData 逐月 mars_sign/mars_house）
//        ⇒ prompt 教写火星、校验器禁止写火星。治法：`truth.providedPlanets` **数据驱动**。
//     ③ 规则「4 硬校验」：用 `indexOf(月份标签)` 取**首次出现**（散文句），再扫其后 300 字
//        ⇒ 撞上**邻月标题**的太阳 ⇒ 误报。治法：**锚定月份标题行**。
//     ④ 星座 token `([\u4e00-\u9fa5]{1,3}座)` 过宽：把「土星在**同一星座**」捕获成「同一星座」
//        ⇒ 与真值比对必错。治法：改用真 12 星座词表（`SIGN_ORDER_ZH`，同源）。
//     ⑤ 规则2 太阳重复：统计**全文任意** `太阳在/进入 X座` ⇒ 正文多处提及同月即被计 3 次。
//        治法：只统计**月份标题行**（判据原意 = 12 个月标题太阳各不相同）。
//   实证结果（本地，零 DB）：**s1 = 44.2s / 单次生成 / 零重试**（128.9s → 44.2s）。
//
// 【E23①b】（2026-10-06，第二轮打点）s7 zh（1978-07-04 安克雷奇，上升天蝎）**仍三连重生成**
//   （本地复现 **111.7s**，日志 `[Validator] yearly attempt 1/3 → 2/3 → 3/3 FAILED`，三稿报错
//   完全相同：土/木/冥「宫位矛盾」）。抓到的**新维度**：等宫粗映射（整星座）与**引擎真值**
//   （Placidus 真宫头，含度数）在「星座起始段跨宫头」时每个宫号差 1 ——
//   土星 等宫6 vs 引擎5 / 木星 等宫10 vs 引擎9 / 冥王 等宫4 vs 引擎3。
//   而**生产提示词**（V82 `houseLock` = `astroMatrix.months[0].<planet>.house`）给 LLM 的
//   正是**引擎真值** ⇒ validator 拿等宫值比对 ⇒ 每稿必挂。治法：把引擎真值纳入接受集合
//   （`truth.outerPlanetsEngine`，**与 houseLock 同源同取材**）。
//
// 【E23②】射程外语法残影收网（E22 时期「只报不拦」的两类）：
//   · 分隔符式标签 `12th House, Marriage, and Allies` ⇒ 窄触发剪枝（他宫主题词才剪）
//     + 三重护栏（月段标题行豁免 / 主题词锚定 / 本宫主题合法）。
//   · 序数笔误 `2th House` / `12st House` ⇒ 确定性后缀归一。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

import { buildAstroTruth } from '../astro-truth.js';
import { validateAstroLogic } from '../astro-validator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(__dirname, '..');
const SRC = readFileSync(path.join(REPO, 'server.js'), 'utf-8');
const PURGE = readFileSync(path.join(REPO, 'scripts/purge-tz-poison-cache.mjs'), 'utf-8');
const YEARLY_TEST = readFileSync(path.join(REPO, 'test/audit-yearly-stream.test.js'), 'utf-8');
const SWEEP_ONLINE = readFileSync(path.join(REPO, 'test/tools/sweep-online.mjs'), 'utf-8');

// ── s1（特罗姆瑟 1997-10-18 14:30）引擎实算本命真值（`astro_matrix.py --mode natal`） ──
const NATAL_S1 = {
  Sun: { sign: 'Libra', house: 11 }, Moon: { sign: 'Taurus', house: 6 }, Mercury: { sign: 'Libra', house: 11 },
  Venus: { sign: 'Sagittarius', house: 1 }, Mars: { sign: 'Sagittarius', house: 1 },
  Jupiter: { sign: 'Aquarius', house: 3 }, Saturn: { sign: 'Aries', house: 5 }, Uranus: { sign: 'Aquarius', house: 3 },
  Neptune: { sign: 'Capricorn', house: 2 }, Pluto: { sign: 'Sagittarius', house: 1 },
};
const T = buildAstroTruth('1997-10-18', '射手座', 'zh', 2026, 7,
  { natalHouses: NATAL_S1, providedPlanets: Object.keys(NATAL_S1) });
const T_BARE = buildAstroTruth('1997-10-18', '射手座', 'zh', 2026, 7);   // 不传 opts = 历史行为
const V = (t, truth) => validateAstroLogic(t, truth || T, 'zh');

// ── vm 同源抽取（复刻 e21/e22/batch harness 手法） ──
const SEEDS = ['stripHouseSemanticLabelMismatch', '_e21CountHouseLabelMismatch', 'fixHouseOrdinalSuffix',
  '_e23CountHouseOrdinalTypos'];
const { closureDecls } = await import(pathToFileURL(path.join(REPO, 'test/tools/extract_decls.mjs')));
const { map, names } = closureDecls(SRC, SEEDS);
const ctx = { console, __exports: {} };
vm.createContext(ctx);
const body = [...map.entries()].sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1])).map((e) => e[1]).join('\n\n');
vm.runInContext(body + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
const X = ctx.__exports;
for (const n of SEEDS) assert.equal(typeof X[n], 'function', `VM 未能抽取 ${n}（切片不完整），实抽: ${names.join(',')}`);
const S = (t, lang) => X.stripHouseSemanticLabelMismatch(t, lang || 'en', 'yearly');
const C = (t, lang) => X._e21CountHouseLabelMismatch(t, lang);
const F = (t) => X.fixHouseOrdinalSuffix(t);
const O = (t) => X._e23CountHouseOrdinalTypos(t);

// ═══════════════════════════════════════════════════════════════════════════
test('① validator 窄化①: 外行星接受「流年 ∪ 本命」成对一致 + 检出能力不减（含注入自测）', () => {
  // 实证病句（s1 zh 首稿，本命木星真值 = Aquarius/H3）—— 修复后必须放行
  assert.equal(V('你的本命木星在水瓶座第3宫，这是你知识视野的根基。').pass, true, '本命木星合法声明被误判');
  // 注入自测：清空本命真值 ⇒ 同一句必红（证明「本命接受集合」是生效的必要条件）
  const T0 = buildAstroTruth('1997-10-18', '射手座', 'zh', 2026, 7, { providedPlanets: Object.keys(NATAL_S1) });
  assert.equal(V('你的本命木星在水瓶座第3宫。', T0).pass, false, '注入自测失败: 无本命真值时应判红');
  // 向后兼容：不传 opts（历史行为）⇒ 仍按流年真值判红
  assert.equal(V('你的本命木星在水瓶座第3宫。', T_BARE).pass, false, '不传 opts 时行为已变（向后兼容破坏）');
  // 检出能力守卫（必须保留）：纯幻觉 / 流年星座 + 本命宫位（松耦合放行是禁止的）
  assert.equal(V('木星在双子座第7宫，主导你的一生。').pass, false, '纯幻觉未判红（检出能力丢失）');
  assert.equal(V('木星在水瓶座第9宫，这是年度的核心。').pass, false, '「本命星座+流年宫位」混合幻觉被放行');
  // 合法流年声明仍放行（星座+宫位成对）
  assert.equal(V('流年木星在狮子座第9宫，扩张之年。').pass, true, '合法流年声明被误判');
});

test('①b validator 窄化①b: 「引擎实算流年宫位」纳入接受集合（等宫粗映射差 1 不再误报）', () => {
  // s7 实证（安克雷奇 1978-07-04，上升天蝎）：等宫粗映射 vs 引擎真值（Placidus 真宫头）逐个差 1
  const ENG = { jupiter: { sign: 'Leo', house: 9 }, saturn: { sign: 'Aries', house: 5 }, pluto: { sign: 'Aquarius', house: 3 } };
  const T7 = buildAstroTruth('1978-07-04', 'Scorpio', 'zh', 2026, 7, { engineFirstMonth: ENG });
  // 病根自证：等宫真值 = 6/10/4，引擎真值 = 5/9/3（差 1）
  assert.equal(T7.outerPlanets.saturn.house, 6, '等宫映射应为第6宫（病根自证）');
  assert.equal(T7.outerPlanetsEngine.saturn.house, 5, '引擎真值应为第5宫（接受集合第三源）');
  assert.equal(T7.outerPlanetsEngine.jupiter.house, 9, '引擎真值木星应为第9宫');
  assert.equal(T7.outerPlanetsEngine.pluto.house, 3, '引擎真值冥王应为第3宫');
  // 实证病句（生产提示词给 LLM 的就是引擎值）⇒ 必须放行
  assert.equal(V('流年土星在白羊座第5宫，压力落在日常领域。', T7).pass, true, '引擎实算流年宫位仍被误判（土星）');
  assert.equal(V('流年木星在狮子座第9宫，扩张之年。', T7).pass, true, '引擎实算流年宫位仍被误判（木星）');
  assert.equal(V('流年冥王星在水瓶座第3宫，深层重塑。', T7).pass, true, '引擎实算流年宫位仍被误判（冥王）');
  // 等宫值亦接受（同一星座、宫号差 1 —— 双源共存，宁漏不改）
  assert.equal(V('流年土星在白羊座第6宫。', T7).pass, true, '等宫值被误判（两源应共存）');
  // 检出能力不减：真错值仍红
  assert.equal(V('流年土星在白羊座第11宫。', T7).pass, false, '真错值未判红（检出能力丢失）');
  assert.equal(V('流年木星在双子座第9宫。', T7).pass, false, '星座错值未判红');
  // 向后兼容：不传 engineFirstMonth ⇒ 等宫值放行、引擎值判红（历史行为）
  const T7Bare = buildAstroTruth('1978-07-04', 'Scorpio', 'zh', 2026, 7);
  assert.equal(T7Bare.outerPlanetsEngine.saturn, undefined, '不传引擎数据时不应凭空造真值');
  assert.equal(V('流年土星在白羊座第6宫。', T7Bare).pass, true, '不传引擎真值时等宫行为已变');
  assert.equal(V('流年土星在白羊座第5宫。', T7Bare).pass, false, '不传引擎真值时行为已变（向后兼容破坏）');
});

test('② validator 窄化②: 未提供行星禁则**数据驱动**（火星实为已供给）+ 凯龙/北交点仍守', () => {
  assert.equal(V('火星在射手座，你的行动力持续燃烧。').pass, true, '引擎已供给火星，却仍被禁（结构性矛盾未修）');
  assert.equal(V('火星在射手座，你的行动力持续燃烧。', T_BARE).pass, false, '不传 providedPlanets 时应保持历史行为（判红）');
  assert.equal(V('凯龙在白羊座，带来旧伤。').pass, false, '凯龙（真未供给）应仍判红');
  assert.equal(V('北交点在天秤座，是今生的功课。').pass, false, '北交点（真未供给）应仍判红');
  // 证据链守卫：prompt 侧确实供给火星（v69_client FACT_SHEET / 逐月数据）
  const V69 = readFileSync(path.join(REPO, 'v69_client.js'), 'utf-8');
  assert.match(V69, /Mars:\s*\$\{m\.mars\?\.sign/, 'FACT_SHEET 应逐行星供给 Mars（本窄化的事实前提）');
  assert.match(V69, /mars_sign:\s*m\.mars\?\.sign/, 'buildPerMonthData 应逐月供给 mars_sign');
});

test('③ validator 窄化③: 流月太阳硬校验**锚定月份标题行**（含病根自证 + 真错值仍红）', () => {
  const FP = [
    '## 第一章：本命核心',
    '2026年10月将回到这个位置。这是你的"太阳回归"时刻。',
    '',
    '### 2026年7月: 太阳巨蟹座 第8宫 · 暗流涌动之月',
    '本月的资金周转速度明显放缓。',
    '',
    '### 2026年10月: 太阳天秤座 第11宫 · 社群共振之月',
    '副业与新渠道的变现测试将在本月进入关键验证期。',
  ].join('\n');
  assert.equal(V(FP).pass, true, '散文提及撞邻月标题的误报未修');
  // 病根自证：旧定位法（indexOf 首次出现 + 300 字窗）**必然**捞到邻月标题的「巨蟹座」
  const li = FP.indexOf('2026年10月');
  const hit = FP.slice(li, li + 300).match(/太阳在?([\u4e00-\u9fa5]{1,3}座)/);
  assert.ok(hit && hit[1] === '巨蟹座', '病根自证失败（旧定位法应捞到巨蟹座）');
  // 真错值（标题行写错）必须仍判红
  assert.equal(V('### 2026年10月: 太阳巨蟹座 第8宫 · 暗流涌动之月\n正文。').pass, false, '标题行真错值未判红');
});

test('④ validator 窄化④⑤: 星座 token 用真 12 星座词表 + 太阳重复只计月标题', () => {
  // 实证病句：`土星在同一星座` —— 旧式 `[一-龥]{1,3}座` 会把「同一星座」当星座名
  assert.equal(V('土星在同一星座意味着旧有的责任模式在重演。').pass, true, '「同一星座」仍被误当星座名');
  assert.equal(V('土星在同一天王星与海王星的合力下缓慢推进。').pass, true, '无星座名句不应触发外行星判据');
  assert.equal(V('流年土星在水瓶座，压力落到社群宫。').pass, false, '真错值（土星非水瓶）未判红');
  // 太阳重复：正文多处提及同一星座 ≠ 天文矛盾；只有**月标题**重复才算
  const body = '### 2026年7月: 太阳巨蟹座 第8宫 · 暗流涌动之月\n'
    + '流年太阳在双鱼座带来灵感。\n流年太阳在双鱼座再次强化直觉。\n流年太阳在双鱼座第三次提示。\n'
    + '### 2026年8月: 太阳狮子座 第9宫 · 之火\n正文。';
  assert.equal(V(body).pass, true, '正文多处提及同一星座被误计为「太阳重复」');
  const dup = '### 2026年7月: 太阳巨蟹座 第8宫 · 甲\n### 2026年8月: 太阳巨蟹座 第9宫 · 乙';
  assert.equal(V(dup).pass, false, '月标题太阳重复未判红（判据原意丢失）');
});

test('⑤ server.js 调用点**同源取材**: 真值窗口/本命盘/已供给行星/引擎流年全部取自 astroMatrix', () => {
  assert.match(SRC, /const _v524RW = \(astroMatrix && astroMatrix\.meta && astroMatrix\.meta\.report_window\)/,
    '真值窗口未取自 meta.report_window（财年对齐）');
  assert.match(SRC, /const _v524CH = \(astroMatrix && astroMatrix\.meta && astroMatrix\.meta\.computed_houses\)/,
    '本命盘未取自 meta.computed_houses');
  // 🛡️ E23/R11q ①b：引擎流年外行星须与生产 houseLock **同源同取材**（astroMatrix.months[0]）
  assert.match(SRC, /const _v524EF = \(astroMatrix && astroMatrix\.months && astroMatrix\.months\[0\]\)/,
    '引擎流年外行星未取自 astroMatrix.months[0]（与 V82 houseLock 不同源）');
  assert.match(SRC, /natalHouses: _v524CH, providedPlanets: _v524CH \? Object\.keys\(_v524CH\) : null, engineFirstMonth: _v524EF/,
    'buildAstroTruth 未拿到本命盘/已供给行星/引擎流年（窄化①② 将失效）');
  assert.match(SRC, /_v524RW \? _v524RW\.start_year : new Date\(\)\.getFullYear\(\)/,
    '窗口起点未用 report_window.start_year（与报告月标题 1:1 对齐）');
  // 与 V82 houseLock 同源：houseLock 的宫位即取自同一 `months[0].<planet>.house`
  assert.match(SRC, /jupHouse = getH2\(first\.jupiter\?\.house\)/,
    'houseLock 宫位来源已变（同源前提失效）');
  // 财年窗口与报告一致：buildAstroTruth(…, 2026, 7) 的 12 个标签须为 2026年7月…2027年6月
  assert.equal(T.months[0].label, '2026年7月', '真值窗口首月应为 2026年7月（财年）');
  assert.equal(T.months[11].label, '2027年6月', '真值窗口末月应为 2027年6月（财年）');
});

test('⑥ E23② 分隔符式标签剪枝: 真错配剪除保数字 + 三类护栏零误伤 + 幂等 + 语言守卫', () => {
  // 真错配（13 盘 v523 落库文本实证：Marriage/Allies 是 7 宫主题）
  const BAD = 'Your natal Sun in Sagittarius occupies the 12th House, Marriage, and Allies. This is a critical placement.';
  assert.equal(S(BAD), 'Your natal Sun in Sagittarius occupies the 12th House. This is a critical placement.',
    '逗号式错配未剪枝');
  assert.equal(C(BAD, 'en'), 1, 'c14 同源计数未识别逗号式错配');
  // 护栏①·月份标题行（12 处实证；含 V487 自由副标题，**绝不能剪**）
  for (const h of [
    '### September 2026: Sun in Virgo · 2nd House · The Harvest of Worth',
    '### March 2027: Sun in Pisces · 8th House · The Alchemy of Shared Resources',
    '### May 2027: Sun in Taurus · 10th House · The Harvest of Legacy',
    '### December 2026: Sun in Sagittarius · 12th House · The Sacred Pause',
    '### August 2026: Sun in Leo · 1st House · The Sovereign Emerges',
    '### October 2026: Sun in Scorpio · 11th House · The Network Effect',
  ]) assert.equal(S(h), h, `月份标题被误剪: ${h.slice(0, 40)}`);
  // 护栏②·星座-宫位对（4 处实证）
  const PAIRS = 'the Virgo 2nd House, the Taurus 10th House, the Capricorn 6th House — provides the grounding.';
  assert.equal(S(PAIRS), PAIRS, '星座-宫位对被误剪');
  const PAIRS2 = 'the Cancer 12th House, the Scorpio 4th House, the Pisces 8th House — provides the depth.';
  assert.equal(S(PAIRS2), PAIRS2, '星座-宫位对被误剪（水元素组）');
  // 护栏③·非主题词标签（行星名）
  const SAT = 'in the 12th House, Saturn in Aquarius rules your career.';
  assert.equal(S(SAT), SAT, '行星名标签被误剪');
  // 本宫主题词 ⇒ 合法保留
  const OK = 'in the 12th House, Karma, and Solitude.';
  assert.equal(S(OK), OK, '本宫主题词被误剪');
  // 幂等 + 语言守卫（仅 en）
  const once = S(BAD);
  assert.equal(S(once), once, '二次施加非幂等');
  for (const lg of ['zh', 'es', 'fr', 'th', 'vi']) {
    assert.equal(S(BAD, lg), BAD, `${lg} 不应改动（仅 en 生效）`);
    assert.equal(C(BAD, lg), 0, `${lg} 的 c14 计数必须为 0（与生产锁同源：非 en 不判）`);
  }
});

test('⑦ E23② 序数后缀笔误归一: 两处实证病句 + 窄形态 + 幂等 + 计数同源', () => {
  assert.equal(F('Your Saturn in Aquarius in the 2th House is the karmic weight of your career.'),
    'Your Saturn in Aquarius in the 2nd House is the karmic weight of your career.', '2th→2nd 未修');
  assert.equal(F('The career path of the Jupiter in Cancer 12st House involves expansion.'),
    'The career path of the Jupiter in Cancer 12th House involves expansion.', '12st→12th 未修');
  // 通用尾数规则（1→st / 2→nd / 3→rd / 其余 th）+ 11/12/13 例外 + 越界宫号弃权
  //   ⚠️ 断言形态必须与实现**同源**：实现只认 `数字+后缀+ House` 三连（窄形态）⇒ 断言亦须带 House。
  assert.equal(F('the 1th House and the 3th House and the 4th House'),
    'the 1st House and the 3rd House and the 4th House', '通用序数规则未生效');
  assert.equal(F('the 11th House and the 12th House'),
    'the 11th House and the 12th House', '11/12 例外被改错（不得变 11st/12nd）');
  // 窄形态：非 `Nth House` 的散文序数绝不碰
  assert.equal(F('She finished 1st place in the 3th race.'), 'She finished 1st place in the 3th race.',
    '越界形态被改（应只认 `数字+后缀+ House`）');
  // 越界宫号弃权（13 / 22 均 > 12）
  assert.equal(F('the 13th House and the 2th House'), 'the 13th House and the 2nd House', '越界宫号未弃权');
  assert.equal(F('the 22th House'), 'the 22th House', '越界宫号（22）未弃权');
  // 正确后缀零改动 + 幂等
  assert.equal(F('Saturn in the 2nd House and the 12th House'), 'Saturn in the 2nd House and the 12th House');
  const f1 = F('the 2th House');
  assert.equal(F(f1), f1, '序数归一非幂等');
  // 计数与归一**同源**：残留计数为 0 ⇔ 归一零改动
  assert.equal(O('the 2th House'), 1, '计数函数未识别笔误');
  assert.equal(O('the 2nd House'), 0, '计数函数把合法形态误计');
  assert.equal(O('the 13th House'), 0, '计数函数把越界宫号误计');
  assert.equal(O(F('the 2th House and 12st House')), 0, '归一后残留计数应为 0（同源证明）');
});

test('⑧ 结构级: 序数归一两链各 2 处挂载、且在标签锁**之前** + 三重注入自测', () => {
  const ORD_NS = 'reportContent = fixHouseOrdinalSuffix(reportContent);';
  const LOCK_NS = 'reportContent = stripHouseSemanticLabelMismatch(reportContent, lang, reportType);';
  const ORD_ST = 'cleanedText = fixHouseOrdinalSuffix(cleanedText);';
  const LOCK_ST = 'cleanedText = stripHouseSemanticLabelMismatch(cleanedText, lang, reportType);';
  const ordN = (SRC.match(new RegExp(ORD_NS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const ordS = (SRC.match(new RegExp(ORD_ST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  assert.equal(ordN, 2, `非流式应收数 2 处（链中 + 链末），实得 ${ordN}`);
  assert.equal(ordS, 2, `流式应收数 2 处（链中 + 链末），实得 ${ordS}`);
  const orderOk = (src) => {
    const pairs = [];
    let i = -1;
    while ((i = src.indexOf(ORD_NS, i + 1)) !== -1) pairs.push([i, src.indexOf(LOCK_NS, i)]);
    let j = -1;
    while ((j = src.indexOf(ORD_ST, j + 1)) !== -1) pairs.push([j, src.indexOf(LOCK_ST, j)]);
    return pairs.length === 4 && pairs.every(([a, b]) => b > a && b - a < 400);
  };
  assert.ok(orderOk(SRC), '序数归一未紧邻标签锁之前（形态须先行）');
  // 注入自测 A/B：摘除非流式 / 流式各一处 ⇒ 必红
  assert.notEqual(SRC.replace(ORD_NS, ''), SRC, '注入未生效（非流式）');
  assert.equal(orderOk(SRC.replace(ORD_NS, '')), false, '注入自测失败: 摘除非流式挂载未被判红');
  assert.equal(orderOk(SRC.replace(ORD_ST, '')), false, '注入自测失败: 摘除流式挂载未被判红');
  // 注入自测 C：把序数归一挪到标签锁**之后** ⇒ 必红
  //   ⚠️ 两行之间夹着「E23/R11q ②」行内注释 ⇒ 必须用**含注释的整行**做锚（曾按裸相邻写 ⇒ 注入静默不生效）。
  const ORD_LINE = '        reportContent = fixHouseOrdinalSuffix(reportContent);   // 🛡️ E23/R11q ②: 序数后缀笔误归一(形态先行)\n';
  const LOCK_LINE = '        reportContent = stripHouseSemanticLabelMismatch(reportContent, lang, reportType);\n';
  const swapped = SRC.replace(ORD_LINE + LOCK_LINE, LOCK_LINE + ORD_LINE);
  assert.notEqual(swapped, SRC, '注入未生效（顺序）');
  assert.equal(orderOk(swapped), false, '注入自测失败: 顺序调换未被判红');
});

test('⑨ 批测工具升格: E22 咨询探针已收网为硬判据 + 同源计数接入', () => {
  assert.ok(!/function advisoryProbes/.test(SWEEP_ONLINE), 'advisoryProbes 应已移除（两类形态已收网）');
  assert.ok(!/row\.delimLabels/.test(SWEEP_ONLINE), 'delimLabels 咨询项应已移除');
  assert.match(SWEEP_ONLINE, /_e23CountHouseOrdinalTypos/, '序数笔误判据未接入批测工具（须同源）');
  assert.match(SWEEP_ONLINE, /row\.ordinalTypos === 0/, '序数笔误未纳入 ok 判据（仍只报不拦）');
  assert.match(SWEEP_ONLINE, /X\._e21CountHouseLabelMismatch\(miss\.text, d\.lang\)/,
    '标签错配须传 lang（与生产锁同源：非 en 不判）');
});

test('⑩ v525 基线: server.js 4 站点 + 无 v524 残留 + purge 双形态回收 v524 + MIN_CACHE_VER=525', () => {
  const sites = [...SRC.matchAll(/wealth:v538/g)].length;
  assert.equal(sites, 4, `4 个缓存站点须全部为 v525，实得 ${sites}`);
  assert.ok(!SRC.includes('wealth:v524'), 'server.js 内不得残留 v524 键');
  assert.ok(PURGE.includes("'wealth:v524:*'") && PURGE.includes("'wealth:v524-v2:*'"),
    'purge 须双形态回收 v524');
  assert.ok(/MIN_CACHE_VER = 538/.test(YEARLY_TEST), 'yearly 流式闸门基线未前移至 525');
  assert.ok(!/MIN_CACHE_VER = 525/.test(YEARLY_TEST), 'MIN_CACHE_VER 纯数字形态仍停留在 524');
  const linter = readFileSync(path.join(REPO, 'test/audit-v492-monthly-house-linter.test.mjs'), 'utf-8');
  assert.ok(linter.includes("LATEST_CACHE_VER = 'v538'"), 'v492 linter LATEST_CACHE_VER 未前移至 v525');
  // 旧闸门站点计数基线须已前移（10 个闸门；e22 单列，见下）
  for (const f of ['audit-e10-r9-natal-coverage.test.mjs', 'audit-e11-r10-critic-precision.test.mjs',
    'audit-e12-r11-whole-report-lock.test.mjs', 'audit-e13-r11d-spelled-ordinals.test.mjs',
    'audit-e15-r11f-multilang-uncage.test.mjs', 'audit-e17-r11j-yearly-axis-critic.test.mjs',
    'audit-e18-r11k-idempotent-lock.test.mjs', 'audit-e20-r11n-element-coord-strip.test.mjs',
    'audit-e21-r11o-house-label-lock.test.mjs',
    'audit-sweep-matrix.test.mjs']) {
    const t = readFileSync(path.join(__dirname, f), 'utf-8');
    assert.ok(t.includes('matchAll(/wealth:v538/g)'), `${f} 站点计数基线未前移至 v525`);
    assert.ok(!t.includes('matchAll(/wealth:v522/g)'), `${f} 仍引用 v522 基线（前移链断裂）`);
  }
  // ⚠️ e22 特例：体内明列「前移链指纹」（`!t.includes('matchAll(/wealth:v522/g)')`、
  //   `const OLD_BASE = 'matchAll(/wealth:v521/g)'` 的**否定式**断言）⇒ v521/v522 字面量是
  //   **合法保留**（它正是拿这些串断言其他闸门；若一并清除则判据失去锚点）。
  //   故对 e22 只做**正向**前移断言，不做旧版残留判据（残留由 e22 自身判据负责）。
  {
    const t22 = readFileSync(path.join(__dirname, 'audit-e22-r11p-chain-end-label-lock.test.mjs'), 'utf-8');
    assert.ok(t22.includes('matchAll(/wealth:v538/g)'), 'e22 站点计数基线未前移至 v525');
  }
  // 批测工具缓存键同源
  assert.match(SWEEP_ONLINE, /wealth:v538:\$\{d\.birth\}/, 'sweep-online cacheKeyOf 未前移至 v525');
});

test('⑪ 交付纪律: 临时诊断（E23-DIAG）不得残留于 server.js', () => {
  assert.ok(!SRC.includes('E23-DIAG'), '临时诊断代码未撤除（E23-DIAG 残留）');
});

test('⑫ E23③ 完整性密度阈值标定: 20 → 15（退化仍拦 / 被误拦稿放行 / 截断三重防线）', async () => {
  const { assessYearlyReportIntegrity } = await import(pathToFileURL(path.join(REPO, 'lib', 'yearly_integrity.mjs')).href);
  const INTEG = readFileSync(path.join(REPO, 'lib', 'yearly_integrity.mjs'), 'utf-8');

  // 结构断言（防回退）：阈值字面量须为 15，旧值 20 不得残留于判据行
  assert.match(INTEG, /if \(astroDensity < 15\)/, '密度阈值未标定为 15（回退即红）');
  assert.ok(!/if \(astroDensity < 20\)/.test(INTEG), '旧阈值 20 仍在（临界抖动未根治）');

  const garbled = readFileSync(path.join(__dirname, 'fixtures/yearly-zh-garbled-20260929.txt'), 'utf-8');
  const healthy = readFileSync(path.join(__dirname, 'fixtures/yearly-zh-healthy-sample.txt'), 'utf-8');

  // ① 事故样本（缺字退化，实测 11.0）⇒ 仍必须被拦（检出能力不减）
  const g = assessYearlyReportIntegrity(garbled, { lang: 'zh' });
  assert.equal(g.ok, false, '缺字退化稿未被拦（检出能力丢失）');
  assert.ok(g.metrics.astroDensityPerK < 15, `事故样本密度须 <15，实得 ${g.metrics.astroDensityPerK}`);

  // ② 健康样本 ⇒ 必须放行（未误伤）
  const h = assessYearlyReportIntegrity(healthy, { lang: 'zh' });
  assert.equal(h.ok, true, `健康样本误杀: ${h.reasons.join(' | ')}`);

  // ③ 标定样本：用健康稿稀释到「旧阈值被拦 / 新阈值放行」的区间（= s7 首稿 19.8 所在带）
  const hd = h.metrics.astroDensityPerK;
  const TARGET = 19.0;
  const synth = healthy + '的'.repeat(Math.ceil(healthy.length * (hd / TARGET - 1)));
  const s = assessYearlyReportIntegrity(synth, { lang: 'zh' });
  const d = s.metrics.astroDensityPerK;
  assert.ok(d >= 15 && d < 20, `标定样本密度须落在 [15,20)，实得 ${d}`);
  // 判据敏感度自证：同一稿在旧阈值(20)下必拦、在新阈值(15)下必过 —— 等价于「注入回退即红」
  assert.ok(d < 20, `标定样本须落在旧阈值被拦区间，实得 ${d}`);
  assert.equal(d >= 15, true, `标定样本须落在新阈值放行区间，实得 ${d}`);
  assert.equal(s.ok, true, `新阈值下 [15,20) 区间仍被误拦: ${s.reasons.join(' | ')}`);

  // ④ 截断仍有三重独立防线（长度 / 结构 / 密度）
  const cut = assessYearlyReportIntegrity(healthy.slice(0, 5200), { lang: 'zh' });
  assert.equal(cut.ok, false, '截断稿须被长度判据拦下');
  assert.ok(cut.reasons.some((r) => r.includes('长度')), '长度判据缺失（截断防线被削弱）');
});
