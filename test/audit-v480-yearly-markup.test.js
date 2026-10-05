// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V480: 年报「Markdown 结构归一」回归闸门
// 事故背景(2026-09-30 生产端 1989-08-15 zh 年报, 端到端跑线上同一份前端解析器复现):
//   ① 【已引爆】LLM 该次用**全角冒号**「### 2026年9月：太阳在处女座第十一宫」,
//      而前端月卡正则 `[·::-|]` 只认半角 → parseYearlyReport 实测 months=0
//      → 12 个月卡整体消失、流年矩阵容器空白。
//   ② 层级漂移: Prompt 锁定标题模板是 `#### … Sun in …`(英文), LLM 实际输出时 ## 时 ###,
//      写死 `###\s*\d{4}年` 的老清洗正则静默漏网。
//   ③ 半吊子章节锚点 + 0 字空壳卡(前端侧, 见 web/test)。
//   ④ 中文年报残留 [Peak Revenue Window]×12 / [Financial Black Swan Day]×12。
//   ⑤ 头部块: ◇ 漂移 emoji + `> * **X` 粗体星号不成对。
// 本测试: 源码级结构断言 + 假数据行为验证(零 python 依赖) + 注入缺陷自测。
// ═══════════════════════════════════════════════════════════════════════
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { getSignToHouseMap, SIGN_ORDER_ZH } from '../astro-truth.js';
import { closureDecls } from './tools/extract_decls.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf-8');

function fnBody(name) {
  const at = src.indexOf(`function ${name}(`);
  assert.ok(at > 0, `未找到函数 ${name}`);
  const open = src.indexOf('{', at);
  let d = 0, i = open, inS = null, inC = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inC) { if (c === '\n') inC = null; continue; }
    if (inS) { if (c === '\\') { i++; continue; } if (c === inS) inS = null; continue; }
    if (c === '/' && src[i + 1] === '/') { inC = 1; continue; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i); i = e + 1; continue; }
    if (c === '"' || c === "'" || c === '`') { inS = c; continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) break; }
  }
  return src.slice(at, i + 1);
}
function callSites(name) {
  const re = new RegExp(name + '\\(', 'g');
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    const lineStart = src.lastIndexOf('\n', m.index) + 1;
    const line = src.slice(lineStart, src.indexOf('\n', m.index));
    if (/^\s*(async\s+)?function\s/.test(line)) continue;
    out.push(line.trim());
  }
  return out;
}

// ── ① 源码级 ──
test('① normalizeYearlyMarkup 必须存在 + 有 reportType 护栏(月报零影响)', () => {
  assert.ok(/function\s+normalizeYearlyMarkup\s*\(/.test(src), '缺少 normalizeYearlyMarkup');
  const b = fnBody('normalizeYearlyMarkup');
  assert.ok(/if\s*\(\s*reportType\s*!==\s*'yearly'\s*\)\s*return\s+text\s*;/.test(b),
    "缺少 `if (reportType !== 'yearly') return text;` —— 会污染月报");
});

test('② 归一函数必须挂在全部年报**写链**路径(至少 3 处, 且都紧随月标题真值锁)', () => {
  const sites = callSites('normalizeYearlyMarkup');
  assert.ok(sites.length >= 3, `调用点不足(仅 ${sites.length} 处)，部分年报写链路径会漏归一`);
  const bad = sites.filter((l) => !/reportType\s*\)/.test(l));
  assert.strictEqual(bad.length, 0, '有调用点漏传 reportType: \n  ' + bad.join('\n  '));
  // 必须与 lockYearlyMonthTitles 成对出现(同一个收尾块)
  const lockSites = callSites('lockYearlyMonthTitles');
  assert.ok(lockSites.length >= 3, 'lockYearlyMonthTitles 调用点异常');
  // 🛡️ E18/R11k（军师裁决② Clean HIT Pipeline）: HIT 命中即终局 ⇒ 不得再挂归一（否则 HIT ≠ 落库文本）
  assert.ok(!/normalizeYearlyMarkup\(stdCached/.test(src), 'HIT 侧不得再挂 normalizeYearlyMarkup');
});

// ── 行为级: vm 抽取 + 假数据 ──
const SEEDS = ['normalizeYearlyMarkup'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) {
  try { new vm.Script(map.get(n)); } catch { dropped.push(n); map.delete(n); }
}
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
assert.ok(map.has('normalizeYearlyMarkup'), 'VM 未能抽取 normalizeYearlyMarkup');

function build(hack) {
  const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()]
    .sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map((e) => (hack && hack[e[0]] ? hack[e[0]] : e[1]))
    .join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = build();
const zh = (t, rt) => F.normalizeYearlyMarkup(t, 'zh', rt || 'yearly');

test('③ 月标题归一: 层级锁 ### 、分隔符锁「半角冒号+空格」(全角冒号必须被吃)', () => {
  const cases = [
    ['### 2026年9月：太阳在处女座第十一宫 · 精算社交', '### 2026年9月: 太阳在处女座第十一宫 · 精算社交'],
    ['#### 2026年9月: 太阳在处女座', '### 2026年9月: 太阳在处女座'],
    ['## 2026年9月·太阳在处女座', '### 2026年9月: 太阳在处女座'],
    ['> ### 2026年9月｜太阳在处女座', '### 2026年9月: 太阳在处女座'],
    ['### 2026年9月——太阳在处女座', '### 2026年9月: 太阳在处女座'],
  ];
  for (const [input, want] of cases) {
    assert.strictEqual(zh(input), want, `归一失败: ${input}`);
  }
});

test('④ 章节锚点归一: 章节关键字一律 `## `, 并剥两端装饰符', () => {
  assert.strictEqual(zh('## ✦ 先知神谕 · 财富启示录 ✦'), '## 先知神谕 · 财富启示录');
  assert.strictEqual(zh('### 📜 第一章：年度财富矩阵'), '## 第一章：年度财富矩阵');
  assert.strictEqual(zh('### 🔮 最终财富神谕 · 精通之钥'), '## 最终财富神谕 · 精通之钥');
  // 非章节标题保持 ### (只看层级是否被锁, 不误判成章节)
  assert.strictEqual(zh('#### 宇宙权力的双重奏：木星加冕'), '### 宇宙权力的双重奏：木星加冕');
});

test('⑤ 干扰行/空引用行必须被删除(前端半吊子锚点与空引用框的根)', () => {
  const out = zh('### 📊 2026-2027 年度财富核心指标仪表盘\n>\n正文');
  assert.ok(!out.includes('指标仪表盘'), '干扰标题未删: ' + out);
  assert.ok(!/^\s*>\s*$/m.test(out), '空引用行未删: ' + JSON.stringify(out));
  assert.ok(out.includes('正文'), '误删正文');
});

test('⑥ 卡标签本地化(zh): 中文年报不得残留英文模板标签', () => {
  assert.ok(zh('**🟢 [Peak Revenue Window]**：**9月14日**').includes('[财富高峰窗口]'));
  assert.ok(zh('**🔴 [Financial Black Swan Day]**：**9月1日**').includes('[财务黑天鹅日]'));
  // 合法中文语境词「个人IP」不得被殃及
  assert.ok(zh('做个人IP的时代').includes('IP'), '合法术语被误删');
});

test('⑦ 头部块: ◇/◆/✦ 漂移符清理 + 粗体星号配对修复', () => {
  const out = zh('> * ◇ **年度星盘: 狮子座 · 太阳回归年\n> * ✦ **核心本命代码: 太阳狮子座');
  assert.ok(!out.includes('◇'), '◇ 未清');
  assert.ok(!out.includes('**'), '不成对粗体星号未被修复: ' + JSON.stringify(out));
  assert.ok(out.includes('年度星盘'), '误删内容');
});

test('⑧ 幂等 + 月报零影响', () => {
  const t = '### 2026年9月：太阳在处女座\n### 📊 2026-2027 年度财富核心指标仪表盘\n> * ◇ **X';
  const once = zh(t);
  assert.strictEqual(zh(once), once, '非幂等');
  assert.strictEqual(F.normalizeYearlyMarkup(t, 'zh', 'monthly'), t, '月报被污染');
  assert.strictEqual(F.normalizeYearlyMarkup(t, 'zh', undefined), t, 'reportType 缺失时被污染');
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】删掉 reportType 护栏 → 判据① 必须红', () => {
  const degraded = fnBody('normalizeYearlyMarkup').replace(/if\s*\(\s*reportType\s*!==\s*'yearly'\s*\)\s*return\s+text\s*;/, '');
  assert.ok(!/if\s*\(\s*reportType\s*!==\s*'yearly'\s*\)\s*return\s+text\s*;/.test(degraded), '闸门失效: 护栏被删未被识别');
});

test('【注入缺陷自测】把分隔符收窄回半角 → 判据③ 必须红(行为级)', () => {
  const sepSrc = map.get('_V480_SEP');
  assert.ok(sepSrc, '未抽到 _V480_SEP');
  const G = build({ _V480_SEP: "const _V480_SEP = '[:\\\\-|]';" });   // 只认半角 → 复刻原始故障
  const out = G.normalizeYearlyMarkup('### 2026年9月：太阳在处女座', 'zh', 'yearly');
  assert.ok(out.includes('：'), '闸门失效: 全角冒号未被兜住(判据③ 未红)');
});

test('【注入缺陷自测】删掉标签本地化 → 判据⑥ 必须红(行为级)', () => {
  const degradedFn = map.get('normalizeYearlyMarkup')
    .replace(/\.replace\(\/\\\[\\s\*Peak\\s\+Revenue\\s\+Window\\s\*\\\]\/gi,[^\n]*\n/, '')
    .replace(/\.replace\(\/\\\[\\s\*Financial[^\n]*\n/, '');
  const G = build({ normalizeYearlyMarkup: degradedFn });
  const out = G.normalizeYearlyMarkup('**🟢 [Peak Revenue Window]**', 'zh', 'yearly');
  assert.ok(out.includes('Peak Revenue Window'), '闸门失效: 标签本地化被删未被识别(判据⑥ 未红)');
});

// ═══════════════ V481-fix: 空标题行(# 残留) ═══════════════
// 事故(2026-09-30 生产端复验 V480 时发现): standardizeReport 的换行注入
//   `t.replace(/###\s+/g, '\n### ')` 会把 `#### 2026年9月：…` 从第 2 个 # 处劈开
//   → `#` + `\n### 2026年9月：…` → 残留的 `#` 被归一补成「# 」空标题行
//   → 真实产物 12 个月份标题前各挂 1 条空 H1(实测 san 里 `^# *$` = 12 条)。
// 双保险: ① 上游换行注入加负向回顾 ② 归一函数丢弃空标题行。
test('⑨ 空标题行(# / # ✦ / 被拆碎的 # 残留) 必须被删除', () => {
  const out = zh('## 第二章：365天月度收入矩阵\n\n# \n### 2026年9月: 太阳处女座 第11宫\n# ✦\n正文段落');
  assert.ok(!/^\s*#\s*$/m.test(out), '空 # 行未删: ' + JSON.stringify(out));
  assert.ok(!/^\s*#\s+✦\s*$/m.test(out), '装饰空标题未删: ' + JSON.stringify(out));
  assert.ok(out.includes('### 2026年9月: 太阳处女座 第11宫'), '误删月份标题');
  assert.ok(out.includes('## 第二章：365天月度收入矩阵'), '误删章节锚点');
  assert.ok(out.includes('正文段落'), '误删正文');
});

test('⑩ 换行注入正则不得劈开多级标题(##### 也不行)', () => {
  // 源码级: 必须存在「前一字符非 #」负向回顾版, 且不得残留裸换行注入写法。
  // ⚠️ 断言用完整调用惯用法 `.replace(/###\s+/g,` —— 不能用裸字面量 /###\s+/g,
  //    否则会误抓下方 V481-fix 注释里**引用**的旧写法(去注释扫描的教训)。
  assert.ok(src.includes('(?<!#)###\\s+'), '缺少 (?<!#) 负向回顾的换行注入修复');
  assert.ok(!/\.replace\(\/###\\s\+\/g\s*,/.test(src), '残留裸换行注入 —— 会把 #### 标题劈成 # + ###');
  // 行为级: 复刻修复后的注入规则, 断言 ####/\#\#\#\#\# 不被劈
  const inject = (t) => t.replace(/(?<!#)###\s+/g, '\n### ');
  assert.strictEqual(inject('#### 2026年9月：太阳在处女座第十一宫'), '#### 2026年9月：太阳在处女座第十一宫', '#### 被劈开');
  assert.strictEqual(inject('##### 五级标题'), '##### 五级标题', '##### 被劈开');
  assert.strictEqual(inject('正文### 子标题'), '正文\n### 子标题', '独立的 ### 仍应换行');
});

test('【注入缺陷自测】删掉空标题兜底 → 判据⑨ 必须红(行为级)', () => {
  const degradedFn = map.get('normalizeYearlyMarkup')
    .replace(/if\s*\(\s*bare\s*===\s*''\s*\)\s*\{\s*dropped\+\+;\s*continue;\s*\}/, '');
  const G = build({ normalizeYearlyMarkup: degradedFn });
  const out = G.normalizeYearlyMarkup('# \n### 2026年9月: 太阳处女座', 'zh', 'yearly');
  assert.ok(/^\s*#\s*$/m.test(out), '闸门失效: 空标题兜底被删未被识别(判据⑨ 未红)');
});

test('【注入缺陷自测】换行注入退回裸写法 → 判据⑩ 必须红', () => {
  const degraded = src.replace(/\(\?<!#\)###\\s\+/g, '###\\s+');   // 退回会被劈开的写法
  assert.ok(!degraded.includes('(?<!#)###\\s+'), '闸门失效: 负向回顾被删未被识别');
  assert.ok(/\.replace\(\/###\\s\+\/g\s*,/.test(degraded), '闸门失效: 裸写法未被识别');
});
