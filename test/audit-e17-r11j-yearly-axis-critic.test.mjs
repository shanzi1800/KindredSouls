// ═══════════════════════════════════════════════════════════════════════════
// E17/R11j 闸门：年报「上升锚点」零守卫 · 四锁治本 + CRITIC 判据 13
// 线上 v516 实证 P0（2026-10-05，盘 s1 特罗姆瑟 1997-10-18 zh 年报，军师终审 78 分）：
//   同一篇报告**同时出现 3 个不同上升星座**：
//     报头 `核心本命代码: … 上升射手座`（真值）
//     正文 `你的上升金牛座赋予你向外扩张的视野`（幻觉）
//     正文 `对于上升水瓶座而言，第3宫是你的…`（幻觉）
//   另有本命宫位错配：`月亮在金牛座第十二宫`（真值 H6）、`太阳在双子座第七宫`（真值天秤 H11）、
//   `你的冥王星在水瓶座第3宫`（真值射手 H1）；标签残句 `本命太阳在天秤座你的本命太阳，`；
//   头/尾组件行（`ℹ️ 检测到您的出生地位于高纬度极圈区域…` / `© 2026 KINDREDSOULS…`）。
// 根因链（三层，本闸门逐层钉死）：
//   ① `lockNatalAnchorRole` 首行 `if (reportType === 'yearly') return text;`（V478-guard 整体关断）
//      ⇒ 年报「上升X座」零纠错；
//   ② 替代防线 `_v432LockNatal` 只管 10 行星、**不含「上升」锚点**；
//      `_v492cLockAxisSalutation` 只作用于前导段（月段刻意不碰）；
//   ③ CRITIC 12 条判据**无一条管上升** ⇒ 写错无人纠、无人拦，直接写库。
// 治法：轴点窄锁 + 裸本命句锁 + 标签残句清洗 + 落款硬剥离 + CRITIC 判据 13 + 高纬告知 meta 化。
// 方法论铁律：行为判据必须配「注入复刻旧缺陷」自测 —— 注入后必须复现线上坏版，否则判据无判别力。
// ═══════════════════════════════════════════════════════════════════════════
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');
const INTEGRITY = fs.readFileSync(path.join(__dirname, '..', 'lib', 'yearly_integrity.mjs'), 'utf-8');
const PURGE = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'purge-tz-poison-cache.mjs'), 'utf-8');

// ── 抽取器（括号配平 + 字符串/注释跳越）──
function grabFn(source, name) {
  const at = source.indexOf(`function ${name}(`);
  if (at < 0) throw new Error(`no fn ${name}`);
  let i = source.indexOf('{', at), pd = 0;
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === '{') pd++;
    else if (c === '}') { pd--; if (pd === 0) break; }
    else if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      for (; i < source.length; i++) { if (source[i] === '\\') { i++; continue; } if (source[i] === q) break; }
    } else if (c === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i) + 1; }
    else if (c === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); }
  }
  return source.slice(at, i + 1);
}
function grabBrace(source, name) {
  const at = source.indexOf(`const ${name} `);
  if (at < 0) throw new Error(`no const ${name}`);
  let i = source.indexOf('{', at), pd = 0;
  for (; i < source.length; i++) {
    const c = source[i];
    if (c === '{') pd++;
    else if (c === '}') { pd--; if (pd === 0) { i++; break; } }
    else if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      for (; i < source.length; i++) { if (source[i] === '\\') { i++; continue; } if (source[i] === q) break; }
    }
  }
  return source.slice(at, i);
}
function grabLine(source, name) {
  const at = source.indexOf(`const ${name} `);
  if (at < 0) throw new Error(`no line ${name}`);
  return source.slice(at, source.indexOf('\n', at));
}

// 🛡️ 种子自检铁律（E16/R11i 教训：种子与生产不一致 ⇒ 全闸门假绿）：
//   六语星座表**全部从产品源码抽取**，绝不手抄。
function buildChain(source) {
  const parts = [
    grabLine(source, 'SUN_SIGN_EN'),
    grabLine(source, 'SUN_SIGN_ZH'),
    grabLine(source, 'SUN_SIGN_ES'),
    grabLine(source, 'SUN_SIGN_FR'),
    grabLine(source, 'SUN_SIGN_TH'),
    grabLine(source, 'SUN_SIGN_VI'),
    grabFn(source, '_v444Esc'),
    grabFn(source, '_v444Signs'),
    grabBrace(source, '_V517_TRANSIT_MARK'),
    grabFn(source, '_v517AxisRe'),
    grabFn(source, '_v517LocalSign'),
    grabFn(source, 'lockYearlyAxisAnchor'),
    grabFn(source, 'auditYearlyAxisAnchor'),
    grabLine(source, '_V517_PLANET_ZH'),
    grabLine(source, '_V517_PLANET_EN'),
    grabLine(source, '_V517_PLANET_KEY_ORDER'),
    grabFn(source, '_v517BareNatalRe'),
    grabFn(source, 'lockYearlyBareNatalPlanets'),
    grabFn(source, '_v517Int2Cn'),
    grabFn(source, '_v517Cn2Int'),
    grabFn(source, 'stripYearlyLabelResidue'),
    grabFn(source, 'stripYearlySignature'),
    grabFn(source, '_v517YearlyFinalLocks'),
    grabBrace(source, '_V517_HL_NOTICE'),
    grabFn(source, 'buildHighLatitudeMeta'),
    grabFn(source, 'injectHighLatitudeNotice'),
  ].join('\n');
  const F = new Function(parts + '\nreturn { lockYearlyAxisAnchor, auditYearlyAxisAnchor, lockYearlyBareNatalPlanets, stripYearlyLabelResidue, stripYearlySignature, _v517YearlyFinalLocks, buildHighLatitudeMeta, injectHighLatitudeNotice, _v444Signs };')();
  return { F };
}

// ── 真值（s1 特罗姆瑟 1997-10-18，Placidus→高纬 WholeSignFallback）──
const MATRIX = {
  meta: {
    rising_sign: 'Sagittarius',
    sun_sign: 'Libra',
    is_high_latitude_fallback: true,
    house_system: 'Whole Sign',
    computed_houses: {
      Sun: { sign: 'Libra', house: 11 }, Moon: { sign: 'Taurus', house: 6 },
      Mercury: { sign: 'Libra', house: 11 }, Venus: { sign: 'Libra', house: 12 },
      Mars: { sign: 'Leo', house: 9 }, Jupiter: { sign: 'Libra', house: 10 },
      Saturn: { sign: 'Aquarius', house: 2 }, Uranus: { sign: 'Aquarius', house: 1 },
      Neptune: { sign: 'Capricorn', house: 12 }, Pluto: { sign: 'Sagittarius', house: 1 },
    },
  },
};

// ── 夹具：v516 线上坏盘**逐字复刻**（军师终审引用的原句）──
const V516_BAD = [
  '> * 核心本命代码: 太阳天秤座 · 月亮金牛座 · 上升射手座',
  '',
  'O child of 天秤座，你生于秋分之后。你的上升金牛座赋予你向外扩张的视野。',
  '',
  '对于上升水瓶座而言，第3宫是你的「沟通」宫位。',
  '',
  '你的冥王星在水瓶座第3宫。',
  '',
  '月亮在金牛座第十二宫，要求你把一件事做到极致。',
  '',
  '太阳在双子座第七宫，要求你成为节点。',
  '',
  '本命太阳在天秤座你的本命太阳，与木星形成强烈共振。',
  '',
  '*本报告由 KINDREDSOULS 财富先知系统生成 · 基于 SwissEph 精确计算*',
  '*报告周期：2026年7月 - 2027年6月*',
  '*© 2026 KINDREDSOULS. All rights reserved.*',
].join('\n');

/* ═══════════════ ① 行为级：四锁一键修复 v516 坏盘 ═══════════════ */

test('① 轴点锁: 3 个不同上升归零, 报头真值逐字保留', () => {
  const { F } = buildChain(SRC);
  const out = F.lockYearlyAxisAnchor(V516_BAD, 'zh', MATRIX, 'yearly');
  assert.ok(!out.includes('上升金牛座'), '「你的上升金牛座」必须被纠正');
  assert.ok(!out.includes('上升水瓶座'), '「对于上升水瓶座而言」必须被纠正');
  assert.ok(!/上升(?!射手座)(白羊座|金牛座|双子座|巨蟹座|狮子座|处女座|天秤座|天蝎座|摩羯座|水瓶座|双鱼座)/.test(out),
    '全篇不得残留任何非真值上升星座');
  assert.ok((out.match(/上升射手座/g) || []).length >= 3, '三处上升声明应统一为真值射手座');
  assert.ok(out.includes('> * 核心本命代码: 太阳天秤座 · 月亮金牛座 · 上升射手座'), '报头行必须逐字保留');
  assert.equal((out.match(/\n/g) || []).length, (V516_BAD.match(/\n/g) || []).length, '不得改动行结构（保形写回）');
});

test("①' 注入自测: 轴点锁替换退化 ⇒ 坏串必须复现（判据有判别力）", () => {
  const anchor = '    return m.slice(0, j) + trueLoc + m.slice(j + tok.length);';
  assert.ok(SRC.includes(anchor), '产品源码须含轴点替换行');
  const INJ = SRC.replace(anchor, '    return m;');
  assert.notEqual(INJ, SRC, '注入未生效');
  const { F } = buildChain(INJ);
  const out = F.lockYearlyAxisAnchor(V516_BAD, 'zh', MATRIX, 'yearly');
  assert.ok(out.includes('上升金牛座') && out.includes('上升水瓶座'), '注入后必须复现线上坏版（3 个上升并存）');
});

test('② 轴点锁: 泛指句「你的上升星座与命宫」零误伤 + 幂等', () => {
  const { F } = buildChain(SRC);
  const s = '流年太阳进入射手座第1宫，这是你的上升星座与命宫。\n';
  assert.equal(F.lockYearlyAxisAnchor(s, 'zh', MATRIX, 'yearly'), s, '泛指句（捕获非星座词）绝不能被改写');
  const good = '报头: 上升射手座。你的上升射手座稳定。\n';
  assert.equal(F.lockYearlyAxisAnchor(good, 'zh', MATRIX, 'yearly'), good, '值==真值 ⇒ 原样返回（幂等）');
});

test("②' 轴点锁: 「命宫X座」同样硬锁为真值 ASC（军师①「上升X座 / 命宫X座」双形态）", () => {
  const { F } = buildChain(SRC);
  const s = '你的命宫水瓶座，事业宫位活跃。\n';
  const out = F.lockYearlyAxisAnchor(s, 'zh', MATRIX, 'yearly');
  assert.ok(out.includes('命宫射手座'), `「命宫水瓶座」应纠为命宫射手座, 实得: ${out.trim()}`);
  assert.ok(!out.includes('命宫水瓶座'), '命宫错串必须被纠正');
});

test('③ 轴点锁: 流年豁免 —— 「流年上升在水瓶座」不得被强改', () => {
  const { F } = buildChain(SRC);
  const s = '流年上升在水瓶座，这是太阳返照盘的上升。\n';
  assert.equal(F.lockYearlyAxisAnchor(s, 'zh', MATRIX, 'yearly'), s, '流年语境下的上升不得被改成本命值（防主动污染）');
});

test('④ 轴点锁: 真值缺失（无出生时间）⇒ 整锁跳过, 绝不编造', () => {
  const { F } = buildChain(SRC);
  const s = '你的上升金牛座赋予你视野。\n';
  const noRising = { meta: { sun_sign: 'Libra' } };
  assert.equal(F.lockYearlyAxisAnchor(s, 'zh', noRising, 'yearly'), s, '真值缺失必须整锁跳过（V102s 纪律）');
  assert.equal(F.lockYearlyAxisAnchor(s, 'zh', MATRIX, 'monthly'), s, '非年报必须早退（本锁 yearly 专属）');
});

test('⑤ 轴点锁六语: en/es/fr/th/vi 均能把错串纠回真值', () => {
  const { F } = buildChain(SRC);
  const cases = [
    ['en', 'Your Rising Sign is Taurus.', 'Sagittarius'],
    ['es', 'Tu Ascendente es Tauro.', 'Sagitario'],
    ['fr', 'Votre Ascendant est Taureau.', 'Sagittaire'],
    ['th', 'ลัคนาของคุณอยู่ในเมษ', 'ธนู'],
    ['vi', 'Ascendant của bạn là Bạch Dương.', 'Nhân Mã'],
  ];
  for (const [lg, src, want] of cases) {
    const out = F.lockYearlyAxisAnchor(src, lg, MATRIX, 'yearly');
    assert.ok(out.includes(want), `[${lg}] 应纠正为 ${want}, 实得: ${out}`);
  }
});

/* ═══════════════ ② 行为级：裸本命句锁 + 流年豁免 ═══════════════ */

test('⑥ 裸本命句锁: 「月亮在金牛座第十二宫」→ 第六宫（真值）', () => {
  const { F } = buildChain(SRC);
  const out = F.lockYearlyBareNatalPlanets('月亮在金牛座第十二宫，要求你…\n', 'zh', MATRIX, 'yearly');
  assert.ok(out.includes('第六宫'), `宫位必须纠正为 6, 实得: ${out.trim()}`);
  assert.ok(!out.includes('第十二宫'), '不得残留错误宫位');
});

test('⑦ 裸本命句锁: 「太阳在双子座第七宫」→ 天秤座 11 宫；「你的冥王星在水瓶座第3宫」→ 射手座 1 宫', () => {
  const { F } = buildChain(SRC);
  const out = F.lockYearlyBareNatalPlanets(
    '太阳在双子座第七宫，要求你成为节点。\n你的冥王星在水瓶座第3宫。\n', 'zh', MATRIX, 'yearly');
  // ⚠️ 保形写回：原文是中文数字宫位（第七宫）⇒ 输出仍为中文数字（第十一宫），不得改形态
  assert.ok(out.includes('太阳在天秤座第十一宫'), `太阳句应纠为 天秤座第十一宫（保形）, 实得: ${out.trim()}`);
  assert.ok(out.includes('冥王星在射手座第1宫'), `冥王句应纠为 射手座第1宫, 实得: ${out.trim()}`);
});

test("⑦' 注入自测: 删流年豁免 ⇒ 流年句必被误改（豁免判别力）", () => {
  const anchor = '    if (mark && mark.test(text.slice(Math.max(0, off - 30), off))) return m;   // 流年豁免';
  assert.ok(SRC.includes(anchor), '产品源码须含裸本命句的流年豁免行');
  const INJ = SRC.replace(anchor, '    // 流年豁免已删');
  assert.notEqual(INJ, SRC, '注入未生效');
  const { F } = buildChain(INJ);
  const s = '流年太阳在双鱼座第4宫，家庭财务…\n';
  const out = F.lockYearlyBareNatalPlanets(s, 'zh', MATRIX, 'yearly');
  assert.ok(out.includes('天秤座'), '注入后流年句被误改（复现过度纠正缺陷）');
});

test('⑧ 裸本命句锁: 流年标记句一律不动（真防御）', () => {
  const { F } = buildChain(SRC);
  for (const s of ['流年太阳在双鱼座第4宫，家庭财务…\n', '本月木星在金牛座第6宫。\n', '返照盘的月亮在双子座第7宫。\n']) {
    assert.equal(F.lockYearlyBareNatalPlanets(s, 'zh', MATRIX, 'yearly'), s, `流年/本月/返照句不得被改: ${s.trim()}`);
  }
});

/* ═══════════════ ③ 行为级：标签残句 + 落款 ═══════════════ */

test('⑨ 标签残句: 删「紧跟星座词、以逗号结尾」的插入语，保留独立指代', () => {
  const { F } = buildChain(SRC);
  const out = F.stripYearlyLabelResidue('本命太阳在天秤座你的本命太阳，与木星形成强烈共振。\n', 'zh', 'yearly');
  assert.ok(!out.includes('你的本命太阳'), `标签残句必须清除, 实得: ${out.trim()}`);
  assert.ok(out.includes('本命太阳在天秤座，'), '删除后语句须自然衔接');
  const keep = '流年太阳进入射手座第1宫，这是你的上升星座与命宫。\n';
  assert.equal(F.stripYearlyLabelResidue(keep, 'zh', 'yearly'), keep, '独立指代用法（后接「与」非逗号）不得误删');
});

test('⑩ 落款硬剥离: 三行落款整行清除, 正文零损伤', () => {
  const { F } = buildChain(SRC);
  const out = F.stripYearlySignature(V516_BAD, 'zh', 'yearly');
  assert.ok(!out.includes('KINDREDSOULS'), `落款必须清除, 实得尾部: ${out.slice(-120)}`);
  assert.ok(!out.includes('报告周期'), '报告周期行一并清除');
  assert.ok(out.includes('本命太阳在天秤座你的本命太阳，与木星形成强烈共振。'), '正文不得被误删');
  assert.ok(!/\n\s*\*\s*$/.test(out), '不得残留孤立 * 行');
});

test("⑩' 注入自测: 落款正则退化 ⇒ 落款残留（判据有判别力）", () => {
  const anchor = "'\\u00a9[^\\\\n]*|'";   // 源码内为字面 \u00a9 + 双反斜杠 n
  assert.ok(SRC.includes(anchor), '产品源码须含版权行分支');
  const INJ = SRC.replace(anchor, "'ZZZZNEVERMATCH|'");
  assert.notEqual(INJ, SRC, '注入未生效');
  const { F } = buildChain(INJ);
  const out = F.stripYearlySignature(V516_BAD, 'zh', 'yearly');
  assert.ok(out.includes('© 2026 KINDREDSOULS'), '注入后版权行必须残留（复现旧缺陷）');
});

/* ═══════════════ ④ 行为级：统一入口 + 高纬 meta 化 ═══════════════ */

test('⑪ 统一入口: 一次调用即完成四锁（v516 坏盘全属性归零）', () => {
  const { F } = buildChain(SRC);
  const out = F._v517YearlyFinalLocks(V516_BAD, 'zh', MATRIX, 'yearly');
  assert.ok(!out.includes('上升金牛座') && !out.includes('上升水瓶座'), '上升错串归零');
  assert.ok(!out.includes('你的冥王星在水瓶座'), '冥王句错串归零');
  assert.ok(!out.includes('第十二宫') && !out.includes('双子座第七宫'), '裸本命句宫位归零');
  assert.ok(!out.includes('你的本命太阳，'), '标签残句归零');
  assert.ok(!out.includes('KINDREDSOULS'), '落款归零');
  assert.ok(out.includes('上升射手座'), '真值必须保留');
  // 幂等：二跑零改动
  assert.equal(F._v517YearlyFinalLocks(out, 'zh', MATRIX, 'yearly'), out, '必须幂等（二跑零改动）');
});

test('⑫ 高纬告知: injectHighLatitudeNotice 已停用正文拼接（改为 JSON meta）', () => {
  const { F } = buildChain(SRC);
  assert.equal(F.injectHighLatitudeNotice('正文开头\n', MATRIX, 'zh'), '正文开头\n', '正文不得再注入告知');
  const meta = F.buildHighLatitudeMeta(MATRIX, 'zh');
  assert.ok(meta && meta.is_high_latitude_fallback === true && meta.notice.includes('高纬度'), 'meta 字段须携带告知文案');
  assert.equal(F.buildHighLatitudeMeta({ meta: {} }, 'zh'), null, '非高纬盘不得返回 meta');
  assert.ok(!SRC.includes("return line + '\\n\\n' + text;"), '旧拼接语句必须已删除');
});

/* ═══════════════ ⑤ 审计出口 / CRITIC 判据 13 ═══════════════ */

test('⑬ auditYearlyAxisAnchor: 坏盘 mismatch≥2, 修复后 mismatch=0（与锁同源）', () => {
  const { F } = buildChain(SRC);
  const bad = F.auditYearlyAxisAnchor(V516_BAD, 'zh', MATRIX, 'yearly');
  assert.ok(bad.mismatch.length >= 2, `坏盘应报 ≥2 处错配, 实得 ${bad.mismatch.length}`);
  assert.equal(bad.trueSign, '射手座');
  const fixed = F.auditYearlyAxisAnchor(F._v517YearlyFinalLocks(V516_BAD, 'zh', MATRIX, 'yearly'), 'zh', MATRIX, 'yearly');
  assert.equal(fixed.mismatch.length, 0, '修复后必须 0 错配');
  // 泛指句不得计入（避免 CRITIC 误报）
  const vague = F.auditYearlyAxisAnchor('这是你的上升星座与命宫。\n', 'zh', MATRIX, 'yearly');
  assert.equal(vague.mismatch.length, 0, '泛指句绝不计数');
});

test('⑭ CRITIC 判据 13 已接入 wealthCriticCheck（结构级 + 注入自测）', () => {
  const critic = grabFn(SRC, 'wealthCriticCheck');
  assert.ok(/auditYearlyAxisAnchor\(text, lang \|\| 'zh', astroMatrix, 'yearly'\)/.test(critic), '判据 13 必须调用同源审计出口');
  assert.ok(/issues\.push\('上升锚点真值错配/.test(critic), '判据 13 必须把错配推入 issues（触发重试）');
  const INJ = SRC.replace(/issues\.push\('上升锚点真值错配[^\n]*\n/, '/* 判据13已删 */\n');
  assert.notEqual(INJ, SRC, '注入未生效');
  assert.ok(!/issues\.push\('上升锚点真值错配/.test(grabFn(INJ, 'wealthCriticCheck')), '注入后判据必须消失（断言有判别力）');
});

test('⑮ integrity 度量已接入（可观测, 且**不**并入 ok 判定）', () => {
  assert.ok(INTEGRITY.includes('metrics.axisMismatch = opts.axisMismatch'), 'integrity 须输出 axisMismatch 度量');
  const seg = INTEGRITY.slice(INTEGRITY.indexOf('metrics.axisMismatch'), INTEGRITY.indexOf('return { ok:'));
  assert.ok(!/reasons\.push/.test(seg), '轴点度量**绝不**并入 reasons（否则 skipCache 拒库 ⇒ 永 MISS，E15 教训）');
  assert.ok(/axisMismatch: a\.mismatch\.length/.test(SRC), 'server 侧须用 auditYearlyAxisAnchor 统一计算后传入（判据同源）');
});

/* ═══════════════ ⑥ 接线完整性 ═══════════════ */

test('⑯ 结构级: 写链三路（非流式 MISS / 流式落库 / 补全）挂载 _v517YearlyFinalLocks；HIT 侧零锁', () => {
  const calls = [...SRC.matchAll(/_v517YearlyFinalLocks\(/g)].length;
  assert.ok(calls >= 4, `应含 1 处定义 + ≥3 处写链调用, 实得 ${calls}`);
  for (const [tag, pat] of [
    ['非流式 MISS', /reportContent = _v517YearlyFinalLocks\(reportContent/],
    ['流式落库', /cleanedText = _v517YearlyFinalLocks\(cleanedText/],
    ['补全链', /if \(ft\) ft = _v517YearlyFinalLocks\(ft/],
  ]) {
    assert.ok(pat.test(SRC), `[${tag}] 写链挂载缺失 —— 同名缓存键由写链统一产出`);
  }
  // 🛡️ E18/R11k（军师裁决② Clean HIT Pipeline）: HIT 侧收拢为「命中即终局，不再跑锁链」
  //   ⇒ HIT 侧**不得**再出现任何真值锁挂载（否则同一缓存键产出两份不同报告）。
  assert.ok(!/_hitFinal = _v517YearlyFinalLocks\(_hitFinal/.test(SRC), '非流式 HIT 侧不得再挂 _v517YearlyFinalLocks');
  assert.ok(!/streamText = _v517YearlyFinalLocks\(streamText/.test(SRC), '流式 HIT 侧不得再挂 _v517YearlyFinalLocks');
});

test("⑯' 注入自测: 抽掉写链一路挂载 ⇒ 接线断言必须变红", () => {
  const INJ = SRC.replace('reportContent = _v517YearlyFinalLocks(reportContent, lang, astroMatrix, reportType);', '');
  assert.notEqual(INJ, SRC, '注入未生效');
  assert.ok(!/reportContent = _v517YearlyFinalLocks\(reportContent/.test(INJ), '注入后 MISS 侧挂载必须消失');
});

test('⑰ 结构级: 缓存版本 v523（4 站点）+ purge 回收 v520/v522 + 旧闸门基线前移', () => {
  const sites = [...SRC.matchAll(/wealth:v535/g)].length;
  assert.equal(sites, 4, `4 个缓存站点须全部为 v523, 实得 ${sites}`);
  assert.ok(!/wealth:v524/.test(SRC), 'server.js 内不得残留 v522 键');
  assert.ok(PURGE.includes("'wealth:v524:*'") && PURGE.includes("'wealth:v524-v2:*'"), 'purge 须双形态回收 v522');
  for (const f of ['audit-e10-r9-natal-coverage.test.mjs', 'audit-e11-r10-critic-precision.test.mjs',
    'audit-e12-r11-whole-report-lock.test.mjs', 'audit-e13-r11d-spelled-ordinals.test.mjs',
    'audit-e15-r11f-multilang-uncage.test.mjs']) {
    const t = fs.readFileSync(path.join(__dirname, f), 'utf-8');
    // 🛡️ 基线前移判据只锁「站点计数正则」（matchAll(/wealth:vNNN/g)）；
    //    旧闸门内的 purge 回收断言（wealth:vNNN:\*）与残留检查字符串是**合法**字面量，不得误伤。
    // ⚠️ E19/R11m 修正：此处曾留缺陷 —— 两条断言**同用 v520**（「须不存在」∧「须存在」自相矛盾），
    //    且因 `test:astro` 是 `&&` 长链、上轮大批有红 ⇒ 短路从未跑到 ⇒ 缺陷潜伏。
    //    改用纯字符串 includes（零正则转义坑）并显式断言新旧基线不同，绝不再写歪。
    const OLD_BASE = 'matchAll(/wealth:v525/g)';
    const NEW_BASE = 'matchAll(/wealth:v535/g)';
    assert.notStrictEqual(OLD_BASE, NEW_BASE, '判据自检：新旧基线串不得相同（否则两条断言自相矛盾）');
    assert.ok(!t.includes(OLD_BASE), `${f} 站点计数基线须前移至 v523`);
    assert.ok(t.includes(NEW_BASE), `${f} 站点计数须为 v523`);
  }
});
