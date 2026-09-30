// ═══════════════════════════════════════════════════════════════════════
// 🛡️ V479: 年报「月标题措辞归一」回归闸门
// 事故背景: 2026-09-30 生产端 1989-08-15 奥斯陆盘年报 12 个月标题里，
//   唯独「### 2027年8月: 本命太阳狮子座 第10宫」多了「本命」前缀，其余 11 个月
//   均为「太阳X座 第N宫」→ 措辞不统一。
// 根因: 月标题措辞极简(无「流年/进入」这类 transitMark)，而 8 月流月太阳恰与
//   本命太阳同 sign+house(狮子座第10宫) → _v432AdjudicateDescriptors 的 B 类
//   「本命事实被写成流月格式 → 补本命标识」误判成立 → 补出「本命太阳狮子座」。
// 修法: ① 治本 _v479IsMonthTitleLine —— 月标题行豁免 B 类补标识(月标题的太阳永远是流月值);
//       ② 兜底 lockYearlyMonthTitles 内剥离标题行指代前缀(应对 LLM 原稿自带)。
// 本测试: 源码级结构断言 + 假矩阵行为验证 + 【注入缺陷自测】。
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

/** 取函数体(按大括号配平，跳过字符串/注释里的花括号) */
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

// ── ① 源码级: 治本豁免必须存在且被 B 类条件引用 ──
test('① _v479IsMonthTitleLine 必须存在(月标题行识别)', () => {
  assert.ok(/function\s+_v479IsMonthTitleLine\s*\(/.test(src), '缺少 _v479IsMonthTitleLine');
  const b = fnBody('_v479IsMonthTitleLine');
  assert.ok(/\^\\s\*#\{1,6\}\\s/.test(b) || /#\{1,6\}/.test(b), '未做 markdown 标题行(#{1,6})判定');
  assert.ok(/\\d\{4\}/.test(b), '未做年月判定(缺 \\d{4})');
});

test('② B 类「补本命标识」必须挂上标题行豁免(否则 8 月标题再被补「本命」)', () => {
  const b = fnBody('_v432AdjudicateDescriptors');
  // B 类条件行: if (!hasDesc && !hasTDesc && isN && !isT && !cfg.transitMark.test(slot) && !_v479IsMonthTitleLine(text, m.index)) {
  const condRe = /if\s*\(\s*!hasDesc\s*&&\s*!hasTDesc\s*&&\s*isN\s*&&\s*!isT[^\n]*/;
  const m = b.match(condRe);
  assert.ok(m, '未定位到 B 类补标识条件');
  assert.ok(/_v479IsMonthTitleLine\s*\(\s*text\s*,\s*m\.index\s*\)/.test(m[0]),
    'B 类条件缺少 `&& !_v479IsMonthTitleLine(text, m.index)` —— 月标题会被误补本命前缀');
});

// ── ③ 源码级: 兜底措辞归一 ──
test('③ lockYearlyMonthTitles 必须含标题措辞归一(剥指代前缀)', () => {
  const b = fnBody('lockYearlyMonthTitles');
  assert.ok(/(?:\\\\u4f60\\\\u7684|你的)/.test(b) && /(?:\\\\u672c\\\\u547d|本命)/.test(b),
    '缺少 zh 指代前缀(你的/本命)剥离');
  assert.ok(/wording\s*\+\+/.test(b), '缺少 wording 计数(剥离未生效时无感知)');
});

// ── ④ 行为级: vm 抽取 + 假矩阵(零 python 依赖) ──
const SEEDS = ['_v479IsMonthTitleLine', 'lockYearlyMonthTitles'];
const { map } = closureDecls(src, SEEDS, ['getSignToHouseMap', 'SIGN_ORDER_ZH']);
const dropped = [];
for (const n of [...map.keys()]) {
  try { new vm.Script(map.get(n)); } catch { dropped.push(n); map.delete(n); }
}
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
for (const n of SEEDS) assert.ok(map.has(n), `VM 未能抽取 ${n}`);

function build(hack) {
  const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()]
    .sort((a, b) => src.indexOf(a[1]) - src.indexOf(b[1]))
    .map(e => (hack && hack[e[0]] ? hack[e[0]] : e[1]))
    .join('\n\n');
  vm.runInContext(bodySrc + '\n' + SEEDS.map(n => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'), ctx);
  return ctx.__exports;
}
const F = build();

const SIGNS_EN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const ZH = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
// 12 个月快照: i=11 (2027-08) 复刻事故 —— 流月太阳=狮子座第10宫 = 本命太阳值
const months = Array.from({ length: 12 }, (_, i) => ({ sun: { sign: SIGNS_EN[(5 + i) % 12], house: (i % 12) + 1 } }));
months[11].sun = { sign: 'Leo', house: 10 };
const M = { months, meta: {} };
const mkLines = (mut) => Array.from({ length: 12 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 8 + i, 1));
  const s = months[i].sun;
  let ln = `### ${d.getUTCFullYear()}\u5e74${d.getUTCMonth() + 1}\u6708: \u592a\u9633${ZH[SIGNS_EN.indexOf(s.sign)]} \u7b2c${s.house}\u5bab \u00b7 \u526f\u6807\u9898`;
  return mut ? mut(i, ln) : ln;
});

test('④ 月标题行识别: 标题行含年月 → true; 正文句 → false', () => {
  const isT = F._v479IsMonthTitleLine;
  assert.strictEqual(isT('text\n### 2027年8月: 太阳狮子座 第10宫', 'text\n### 2027年8月: 太阳狮子座 第10宫'.indexOf('太阳')), true);
  assert.strictEqual(isT('## August 2027: Sun in Leo', '## August 2027: Sun in Leo'.indexOf('Leo')), true);
  assert.strictEqual(isT('正文里说你的太阳在狮子座第10宫。', 6), false, '正文句被误判成标题行');
  assert.strictEqual(isT('### 月度财富概览\n太阳在狮子座', '### 月度财富概览\n太阳在狮子座'.length - 1), false, '无年月的标题行被误判');
});

test('⑤ 措辞归一: 12 行标题输出零「本命」+ 已定稿幂等', () => {
  const text = mkLines().join('\n');
  const out = F.lockYearlyMonthTitles(text, 'zh', M, 'yearly');
  assert.strictEqual((out.match(/本命/g) || []).length, 0, '输出仍含本命');
  assert.strictEqual(out.split('\n').length, 12, '行数被改变');
  const again = F.lockYearlyMonthTitles(out, 'zh', M, 'yearly');
  assert.strictEqual(again, out, '非幂等: 二次调用有变化');
});

test('⑥ 兜底剥离: 原稿自带「本命/你的」前缀也必须被拉齐', () => {
  for (const pre of ['本命', '你的', '命中']) {
    const text = mkLines((i, ln) => (i === 11 ? ln.replace('太阳', pre + '太阳') : ln)).join('\n');
    const out = F.lockYearlyMonthTitles(text, 'zh', M, 'yearly');
    assert.strictEqual((out.match(/本命|你的太阳|命中太阳/g) || []).length, 0, `前缀「${pre}」未被剥离`);
    assert.ok(/太阳狮子座/.test(out), '剥离时误伤了行星名');
  }
});

test('⑦ 月报零影响: reportType!=yearly 原样返回', () => {
  const text = mkLines((i, ln) => ln.replace('太阳', '本命太阳')).join('\n');
  assert.strictEqual(F.lockYearlyMonthTitles(text, 'zh', M, 'monthly'), text, '月报路径被污染');
});

// ═══════════════ 注入缺陷自测(证明闸门会红) ═══════════════
test('【注入缺陷自测】删掉标题行豁免条件 → 判据② 必须红', () => {
  const degraded = fnBody('_v432AdjudicateDescriptors')
    .replace(/\s*&&\s*!_v479IsMonthTitleLine\(text,\s*m\.index\)/, '');
  const m = degraded.match(/if\s*\(\s*!hasDesc\s*&&\s*!hasTDesc\s*&&\s*isN\s*&&\s*!isT[^\n]*/);
  assert.ok(m && !/_v479IsMonthTitleLine/.test(m[0]), '闸门失效: 豁免被删未被识别');
});

test('【注入缺陷自测】删掉措辞归一逻辑 → 判据⑥ 必须红(行为级)', () => {
  const degradedFn = map.get('lockYearlyMonthTitles')
    .replace(/const _w0 = line;[\s\S]*?if \(line !== _w0\) wording\+\+;/, 'const _w0 = line;');
  assert.notStrictEqual(degradedFn, map.get('lockYearlyMonthTitles'), '未成功注入缺陷(正则没匹配到剥离块)');
  const G = build({ lockYearlyMonthTitles: degradedFn });
  const text = mkLines((i, ln) => (i === 11 ? ln.replace('太阳', '本命太阳') : ln)).join('\n');
  const out = G.lockYearlyMonthTitles(text, 'zh', M, 'yearly');
  assert.ok(/本命太阳狮子座/.test(out), '闸门失效: 归一逻辑被删后「本命」仍被剥离(判据⑥ 未红)');
});

test('【注入缺陷自测】把标题行识别退化为「永远 false 以外」→ 判据④ 必须红', () => {
  const degradedFn = map.get('_v479IsMonthTitleLine')
    .replace(/if\s*\(!\/\^\\s\*#\{1,6\}\\s\/\.test\(line\)\)\s*return false;/, 'return true;');
  assert.notStrictEqual(degradedFn, map.get('_v479IsMonthTitleLine'), '未成功注入缺陷(正则没匹配到标题行判定)');
  const G = build({ _v479IsMonthTitleLine: degradedFn });
  assert.strictEqual(G._v479IsMonthTitleLine('纯正文一句。', 2), true, '闸门失效: 退化未被识别');
});
