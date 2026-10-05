// ═══════════════════════════════════════════════════════════════════
// E19/R11l ②: CRITIC 判据8「幽灵相位」窄化闸门
// 背景: E18 批测 s1 zh 实证误报——「流年太阳进入狮子座第九宫，与流年木星形成合相」
//       是合法对偶句，但旧守卫 /[日月水火木金土]星.*与[日月水火木金土]星/ 要求
//       「与」前的行星必须带「星」尾 ⇒「太阳」漏配 ⇒ 误报。
// 修复: 守卫扩展「太阳/太阴/月亮」形态 + 正则提为命名常量（闸门同源抽取）。
// 纪律: 本闸门的两个正则**从 server.js 源码抽取**（同源），杜绝「闸门自抄一套」双盲。
//       注入自测: 守卫回退/触发移除必红。
// ═══════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

// —— E18 批测真实误报句（逐字取自 raw-s1-zh.md）——
const FP_SENTENCE =
  '* 🌐 **[月度财富概览]**: 本月的长期资产配置比例需要重新审视，因为流年太阳进入狮子座第九宫，与流年木星形成合相——这是"视野扩张"的能量高峰';

const GHOST_BARE = '本月在事业宫火星形成刑克相位，投资决策容易冲动，需要谨慎评估风险';      // 真幽灵: 无对偶
const GHOST_NONPLANET = '火星与事业版图形成刑克相位，本月的合作谈判可能出现摩擦';            // 真幽灵: 「与」后非行星
const PAIR_CLASSIC = '太阳与木星形成合相，这是本季度最重要的扩张窗口';                       // 合法: 经典星+星
const PAIR_MOON = '月亮与金星形成六分相位，家庭财务氛围温和';                                // 合法: 月亮形态
const PAIR_PREFIX = FP_SENTENCE;                                                            // 合法: 流年前缀+太阳形态
// —— E19 批测 s7 zh 真实误报句（逐字取自 raw-s7-zh.md）: 第二行星是【外行星】冥王星 ——
const FP_OUTER = '流年太阳进入水瓶座第三宫，与冥王星形成合相——这是"知识权力"被激活的月份';

// 同源抽取 server.js 的两个判据8 正则（indexOf 切片，避开 RegExp 构造器转义天坑）
function extractRegex(name) {
  const key = 'var ' + name + ' = /';
  const i = SRC.indexOf(key);
  assert.ok(i >= 0, `server.js 缺少命名常量 ${name}（判据8 窄化修复被移除?）`);
  const j = SRC.indexOf('/;', i + key.length);
  assert.ok(j >= 0, `server.js 中 ${name} 的正则字面量未正常收尾`);
  return new RegExp(SRC.slice(i + key.length, j)); // 正文（去两侧 /）
}

// 复刻 server.js 判据8 判定（逻辑 5 行，正则同源）
function hasGhost(text) {
  const aspect = extractRegex('_c8Aspect');
  const pair = extractRegex('_c8Pair');
  for (const s of text.split(/[。\n]/)) {
    if (aspect.test(s) && !pair.test(s)) return s;
  }
  return null;
}

test('① 结构级: 判据8 守卫已提为命名常量 _c8Aspect/_c8Pair，旧粗放正则已移除', () => {
  assert.ok(SRC.includes('var _c8Aspect ='), '判据8 触发正则未提为 _c8Aspect');
  assert.ok(SRC.includes('var _c8Pair ='), '判据8 守卫正则未提为 _c8Pair');
  assert.ok(SRC.includes('if (_c8Aspect.test(s) && !_c8Pair.test(s))'),
    '判据8 判定式未接命名常量（守卫未生效）');
  assert.ok(!SRC.includes('[日月水火木金土]星.*与[日月水火木金土]星'),
    '旧粗放守卫正则仍残留在 server.js');
});

test('② 行为级: E18 批测 s1 zh 真实误报句必须 0 告警（修复主目标）', () => {
  assert.equal(hasGhost(FP_SENTENCE), null,
    '「流年太阳…与流年木星形成合相」仍被误报为幽灵相位');
});

test('③ 行为级: 真幽灵必须仍然拦截（宁报勿漏）', () => {
  assert.ok(hasGhost(GHOST_BARE), '裸幽灵句「火星形成刑克相位」未被拦截——守卫过宽');
  assert.ok(hasGhost(GHOST_NONPLANET), '「与」后接非行星的幽灵句未被拦截——守卫过宽');
});

test('④ 行为级: 合法对偶三形态全部 0 告警', () => {
  for (const [name, s] of [['经典星尾', PAIR_CLASSIC], ['月亮形态', PAIR_MOON], ['流年前缀+太阳形态', PAIR_PREFIX]]) {
    assert.equal(hasGhost(s), null, `合法对偶句（${name}）被误报: ${s.slice(0, 30)}`);
  }
});

// ── 🛡️ E19/R11m: 外行星（冥王星/海王星/天王星）对偶形态 —— 原字符类 `[日月水火木金土]星`
//    首字不含 冥/海/天 ⇒ 认不出「冥王星」⇒ s7 zh 真实误报。──
test('⑦ 行为级: E19 批测 s7 zh 外行星对偶句必须 0 告警（R11m 主目标）', () => {
  assert.equal(hasGhost(FP_OUTER), null,
    '「流年太阳…与冥王星形成合相」仍被误报为幽灵相位（守卫未含外行星）');
  for (const [name, p] of [['海王星', '海王星'], ['天王星', '天王星']]) {
    const s = `流年金星与${name}形成三分相位，这是柔和的支持能量`;
    assert.equal(hasGhost(s), null, `外行星对偶句（${name}）被误报`);
  }
});

test('⑤ 注入自测: 守卫回退到旧正则 ⇒ ② 必红（修复是承重的）', () => {
  const oldGuard = /[日月水火木金土]星.*与[日月水火木金土]星/;
  const pair = extractRegex('_c8Pair');
  // 旧守卫对真实误报句不匹配（这正是当初误报根因）——证明若有人回退守卫，误报复发
  assert.ok(!oldGuard.test(FP_SENTENCE), '前提失效: 旧守卫居然匹配了误报句（注入场景不再成立）');
  assert.ok(pair.test(FP_SENTENCE), '新守卫未匹配真实误报句——修复无效');
});

// ── 🛡️ E19/R11m 注入自测: 复刻「R11l 版守卫」（已含 太阳/太阴/月亮，但**无**外行星）──
test('⑧ 注入自测: 守卫退回 R11l 版（无外行星）⇒ ⑦ 必红（R11m 是承重的）', () => {
  const r11lGuard = /(太阳|太阴|月亮|[日月水火木金土]星)[^。\n]{0,30}与[^。\n]{0,30}(太阳|太阴|月亮|[日月水火木金土]星)/;
  const pair = extractRegex('_c8Pair');
  assert.ok(!r11lGuard.test(FP_OUTER), '前提失效: R11l 守卫居然匹配了外行星句（注入场景不成立）');
  assert.ok(pair.test(FP_OUTER), 'R11m 守卫未匹配外行星对偶句——修复无效');
  // 结构性: 守卫源码必须显式含外行星字符类（防「改回旧版」静默回退）
  assert.ok(SRC.includes('[冥海天]王星'), '判据8 守卫缺外行星字符类 [冥海天]王星');
});

test('⑥ 注入自测: 触发正则缺失/失配 ⇒ ③ 必红（拦截是承重的）', () => {
  const aspect = extractRegex('_c8Aspect');
  assert.ok(aspect.test(GHOST_BARE), '触发正则未命中幽灵句——判据8 已空转');
  // 模拟「触发被移除」: 若 hasGhost 无 aspect 前置，则任何句子都不报 ⇒ 此处用恒假正则对照
  const deadAspect = /形成(合相X不可能存在)/;
  assert.ok(!deadAspect.test(GHOST_BARE), '对照注入未生效');
});
