/**
 * ═══════════════════════════════════════════════════════════════════════
 * 年报解析层 · 最小真行为单测 (V474)
 * ═══════════════════════════════════════════════════════════════════════
 * 跑法:  cd web && npm run test:report
 *        (Node 22 原生 --test + 原生 TS 类型剥离, 零测试框架依赖)
 *
 * 目的:
 *   ① 给 parseYearlyReport / cleanYearlyTimeline 上「真行为」锁 ——
 *      不 mock、不造假,直接 import 线上跑的同一份源码;
 *   ② 专项回归 V474 地雷:cleanYearlyTimeline 收到非空文本必抛
 *      SyntaxError: Unterminated group(字符串构造的坏正则,tsc 看不见);
 *   ③ 防「整块渲染代码被注释掉还能通过编译」——解析层一旦被掏空,
 *      这些断言会立刻变红。
 * ═══════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanYearlyTimeline, parseYearlyReport } from '../src/lib/yearly-report-parser.ts';

// ── 一份贴近真实年报的样例(章节锚点 + 月份锚点齐全) ──────────────────
const MOCK_YEARLY = `# 2026-2027 财富年鉴

## 先知神谕:年度财富天启
天命宿主已锁定,盘口如下。

## 第一章 年度宿命财运
正文一。

## 2026年7月 · 巨蟹座新月
7月正文。

## 第二章 12个月收入矩阵
正文二。

## 2027年1月 · 摩羯座新月
1月正文。

## 第五章 黄金爆发与显化锦囊
正文五。`;

// ═══════════════════════════════════════════════════════════════════════
// 一、V474 地雷专项回归(最重要)
// ═══════════════════════════════════════════════════════════════════════
test('V474 回归:cleanYearlyTimeline 收到非空文本不得抛异常', () => {
  // 修复前:内嵌 new RegExp('(([^)\\n]*?)(\\s*)(?=\\n|$)') 少一个右括号,
  //        任何非空输入都会抛 SyntaxError: Unterminated group,
  //        直接打断年报渲染链 ->「没有流式文字内容输出」。
  assert.doesNotThrow(() => cleanYearlyTimeline('随便一段非空文本'), '非空文本不得抛异常');
  assert.doesNotThrow(() => cleanYearlyTimeline('2026年7月2026年7月'), '重复日期不得抛异常');
  assert.doesNotThrow(() => cleanYearlyTimeline(MOCK_YEARLY), '完整年报不得抛异常');
});

test('解析层源码内不得再出现运行时构造正则的地雷', async () => {
  const fs = await import('node:fs');
  const url = await import('node:url');
  const path = await import('node:path');
  const { createRequire } = await import('node:module');
  const ts = createRequire(import.meta.url)('typescript');

  const here = path.dirname(url.fileURLToPath(import.meta.url));
  const file = path.join(here, '../src/lib/yearly-report-parser.ts');
  const src = fs.readFileSync(file, 'utf8');
  // 用 AST 判定,而不是字符串匹配 —— 否则注释里提到 new RegExp( 也会被误判
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const hits = [];
  (function walk(node) {
    const isRegExpCtor =
      (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
      node.expression &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'RegExp';
    if (isRegExpCtor) hits.push(sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1);
    ts.forEachChild(node, walk);
  })(sf);

  assert.deepEqual(
    hits,
    [],
    '解析层不允许在运行时用字符串构造正则(tsc 校验不到,极易留残缺括号);命中行: ' + hits.join(', '),
  );
});

// ═══════════════════════════════════════════════════════════════════════
// 二、cleanYearlyTimeline 真行为
// ═══════════════════════════════════════════════════════════════════════
test('cleanYearlyTimeline: 空输入原样返回空串', () => {
  assert.equal(cleanYearlyTimeline(''), '');
});

test('cleanYearlyTimeline: 三连年份去重', () => {
  assert.equal(cleanYearlyTimeline('2026年7月2026年7月2026年7月'), '2026年7月');
});

test('cleanYearlyTimeline: 重复年份 + 新月份', () => {
  assert.equal(cleanYearlyTimeline('2026年7月2026年7月2027年1月'), '2026年7月2027年1月');
});

test('cleanYearlyTimeline: 行内未闭合左括号在行尾补右括号', () => {
  assert.equal(cleanYearlyTimeline('本月注意(合同风险'), '本月注意(合同风险)');
});

test('cleanYearlyTimeline: 已闭合的括号不得被重复补', () => {
  assert.equal(cleanYearlyTimeline('本月注意(合同风险)'), '本月注意(合同风险)');
});

// ═══════════════════════════════════════════════════════════════════════
// 三、parseYearlyReport 真行为
// ═══════════════════════════════════════════════════════════════════════
test('parseYearlyReport: 空输入返回完整空结构', () => {
  assert.deepEqual(parseYearlyReport('', ''), {
    title: '',
    chapters: [],
    months: [],
    rawContent: '',
  });
});

test('parseYearlyReport: 提取 H1 标题', () => {
  const r = parseYearlyReport(MOCK_YEARLY, '1976-12-03');
  assert.equal(r.title, '2026-2027 财富年鉴');
});

test('parseYearlyReport: 切出 5 张章节卡(先知神谕 / 一 / 二 / 五)', () => {
  const r = parseYearlyReport(MOCK_YEARLY, '1976-12-03');
  assert.equal(r.chapters.length, 5);
  const titles = r.chapters.map((c) => c.title);
  assert.ok(titles.some((t) => t.includes('先知')), '缺先知神谕卡');
  assert.ok(titles.some((t) => t.includes('第一章')), '缺第一章');
  assert.ok(titles.some((t) => t.includes('第二章')), '缺第二章');
  assert.ok(titles.some((t) => t.includes('第五章')), '缺第五章');
});

test('parseYearlyReport: 切出 12 个月矩阵锚点(本样例 2 个月)', () => {
  const r = parseYearlyReport(MOCK_YEARLY, '1976-12-03');
  assert.equal(r.months.length, 2);
  assert.deepEqual(
    r.months.map((m) => m.month),
    ['2026年7月', '2027年1月'],
  );
  assert.equal(r.months[0].zodiac, '巨蟹座新月');
  assert.equal(r.months[0].state, 'flow');
});

test('parseYearlyReport: 月份状态三态识别(高峰/高风险/顺流)', () => {
  const r = parseYearlyReport(
    ['## 2026年8月 · 高风险熔断', 'x', '## 2026年9月 · 高峰充能', 'y', '## 2026年10月 · 平稳', 'z'].join('\n'),
    '',
  );
  const byMonth = Object.fromEntries(r.months.map((m) => [m.month, m]));
  assert.equal(byMonth['2026年8月'].state, 'risk');
  assert.equal(byMonth['2026年8月'].stateLabel, '🔴 高危熔断月');
  assert.equal(byMonth['2026年9月'].state, 'peak');
  assert.equal(byMonth['2026年9月'].stateLabel, '🟢 财富充能月');
  assert.equal(byMonth['2026年10月'].state, 'flow');
  assert.equal(byMonth['2026年10月'].stateLabel, '🔵 顺流蓄力月');
});

test('parseYearlyReport: === 滑坡标题强制降级为 ## 并被识别', () => {
  const r = parseYearlyReport('### 第一章 年度宿命财运\n只有半', '');
  assert.ok(r.chapters.some((c) => c.title.includes('第一章')));
});

test('parseYearlyReport: 流式半截文本不抛异常且结构完整', () => {
  const r = parseYearlyReport('## 第一章 年度宿命财运\n只有半', '');
  assert.equal(r.title, '年度财富报告');
  assert.ok(Array.isArray(r.chapters));
  assert.ok(Array.isArray(r.months));
  assert.equal(r.rawContent, '## 第一章 年度宿命财运\n只有半');
});

test('parseYearlyReport: rawContent 原样透传(供流式打字机复用)', () => {
  const r = parseYearlyReport(MOCK_YEARLY, '1976-12-03');
  assert.equal(r.rawContent, MOCK_YEARLY);
});

test('parseYearlyReport: 全程不抛异常(喂 5 种脏文本)', () => {
  const dirty = ['', ' ', '\n\n\n', '<unknown>\uFFFD\u0000', '## 第五章\n🔴🟢✨'];
  for (const d of dirty) {
    assert.doesNotThrow(() => parseYearlyReport(d, ''), `脏文本应安全: ${JSON.stringify(d)}`);
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 四、V480 —— 生产端真值故障回归（2026-09-30 1989-08-15 zh 年报实测）
//   ① 全角冒号导致月卡全丢: months=0, 流年矩阵容器整体空白
//   ② 干扰标题行 → 半吊子锚点「### 先知神谕:年度财富天启」→ 沦为正文残渣
//   ③ 首个章节锚点处强行 push 一张 0 字空壳兜底卡
// ═══════════════════════════════════════════════════════════════════════
test('V480: 全角冒号月标题必须被识别成月卡(旧字符类只认半角 → 实测 months=0)', () => {
  const r = parseYearlyReport('## 第二章 月度矩阵\n### 2026年9月：太阳在处女座第十一宫 · 精算社交', '');
  assert.equal(r.months.length, 1, '全角冒号月标题未被识别 —— 会整块丢失流年矩阵');
  assert.equal(r.months[0].month, '2026年9月');
  assert.ok(r.months[0].zodiac.includes('太阳在处女座'), '副标题解析错误: ' + r.months[0].zodiac);
});

test('V480: 分隔符全覆盖(全角冒号/竖线/破折号) + 层级放宽到 ####', () => {
  const t = [
    '### 2026年9月：太阳在处女座',
    '#### 2026年10月｜太阳在天秤座',
    '## 2026年11月—太阳在天蝎座',
    '###### 2026年12月·太阳在射手座',
  ].join('\n');
  const r = parseYearlyReport(t, '');
  assert.equal(r.months.length, 4, '有分隔符/层级未被识别: ' + JSON.stringify(r.months.map((m) => m.month)));
  assert.deepEqual(r.months.map((m) => m.month), ['2026年9月', '2026年10月', '2026年11月', '2026年12月']);
});

test('V480: 不得产出 0 字空壳章节卡(首个锚点处强行 push 兜底卡的旧缺陷)', () => {
  const r = parseYearlyReport(
    '## 先知神谕:年度财富天启\n正文一\n## 第一章 矩阵\n正文二',
    '',
  );
  const empties = r.chapters.filter((c) => c.content.trim().length === 0);
  assert.equal(empties.length, 0, '存在空壳卡: ' + empties.map((c) => c.title).join(', '));
  assert.equal(r.chapters.length, 2);
});

test('V480: 干扰标题行(### 📊 YYYY-YYYY …)不得留下半吊子锚点', () => {
  const r = parseYearlyReport('### 📊 2026-2027 年度财富核心指标仪表盘\n正文一\n## 第一章 矩阵\n正文二', '');
  assert.ok(
    !r.chapters.some((c) => c.title.includes('指标仪表盘')),
    '干扰标题残留成章节: ' + r.chapters.map((c) => c.title).join(' | '),
  );
  assert.ok(r.chapters.every((c) => c.content.trim().length > 0), '出现空壳卡');
});

