/**
 * 🚨 E62 闸门：年报月标题「形态盲区」回归防线（audit-e62-month-head-form）
 *
 * 主公令（2026-10-17）：「确保不管模型带不带 # 号，流年太阳与流年水星真值锁 100% 强制命中」。
 *
 * 病根（1977-03-27 深圳 zh 盘离线复现实锤）：月标题行不一定是 `#` 前缀：
 *   ① `### 2027年6月: 太阳双子座 第3宫 · …`   （标准形态）
 *   ② `**2027年6月: 太阳白羊座 第3宫** · …`   （整行加粗）
 *   ③ `2027年6月: 太阳白羊座 第3宫 · …`       （纯文本）
 * 旧判据只认 ① ⇒ ②③ 形态下 月标题锁 / 流年行星锁 / 去重锁 等全部消费方集体静默失效
 * （不报错、不改字、错值原样落库），且 normalizeYearlyMarkup 不会把 ②③ 转成 ①。
 *
 * 治法（本闸门锁死）：
 *   R1 识别真源 `_v516MonthHeadKey` 去装饰前置（`_e62StripHeadDecor`）：# 前缀与整行强调
 *      包裹剥壳后识别；纯文本形态必须过 `_e62PlainHeadShape` 自证标题形（月词贴行首 +
 *      标题分隔符），正文散文「2026年7月，木星进入狮子座…」不构成段界（宁漏不误）。
 *   R2 两把月锁（标题锁 / 流年行星锁）不再自带 `#` 门禁，识别全权交唯一真源。
 *   R3 流年行星锁的段尾守卫同步补「整行加粗」形态（`**第三章 …**` 不得被末月段吞掉）。
 *
 * 运行：node --test test/audit-e62-month-head-form.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { closureDecls } from './tools/extract_decls.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');

// ───────────────────────── 一、结构级 ─────────────────────────

function fnBody(name) {
  const at = SRC.indexOf(`function ${name}(`);
  assert.ok(at > 0, `找不到 ${name}`);
  const open = SRC.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < SRC.length; i++) {
    const c = SRC[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return SRC.slice(at, i + 1); }
  }
  throw new Error(`${name} 花括号不配平`);
}

const KEY_FN = fnBody('_v516MonthHeadKey');

test('E62-S1 识别真源已去装饰前置（StripDecor + PlainShape 双件套在位）', () => {
  assert.ok(/_e62StripHeadDecor\(/.test(KEY_FN), '_v516MonthHeadKey 未调用 _e62StripHeadDecor');
  assert.ok(/_e62PlainHeadShape\(/.test(KEY_FN), '_v516MonthHeadKey 未调用 _e62PlainHeadShape（纯文本形态未设防）');
  assert.ok(/function _e62StripHeadDecor\(/.test(SRC), '缺少 _e62StripHeadDecor 定义');
  assert.ok(/function _e62PlainHeadShape\(/.test(SRC), '缺少 _e62PlainHeadShape 定义');
});

test('E62-S2 旧「井号门禁」已从识别真源移除', () => {
  const old = 'if (!/^#{1,6}\\s/.test(s.trim())) return null;';
  assert.ok(!SRC.includes(old), '识别真源仍保留旧井号门禁（加粗/纯文本月标题依旧失明）');
});

test('E62-S3 两把月锁不再自带井号门禁（识别全权交唯一真源）', () => {
  for (const fn of ['lockYearlyMonthTitles', 'lockYearlyTransitSigns']) {
    const body = fnBody(fn);
    assert.ok(!/if \(!\/\^\#\{1,6\}\\s\/\.test\(ln\)\) continue;/.test(body),
      `${fn} 仍自带井号门禁（绕过唯一真源）`);
    assert.ok(/_v516MonthHeadKey\(/.test(body), `${fn} 未走 _v516MonthHeadKey 识别`);
  }
});

test('E62-S4 流年行星锁段尾守卫已补整行加粗形态', () => {
  const body = fnBody('lockYearlyTransitSigns');
  assert.ok(/_isHeadLike/.test(body), '段尾守卫未含 _isHeadLike（加粗章节标题会被末月段吞掉）');
  assert.ok(body.includes('\\*\\*[^*]') && body.includes('__[^_]'),
    '段尾守卫未覆盖整行加粗形态（`**…**` 章节标题）');
});

// ───────────────────────── 二、行为级（vm 抽真实函数） ─────────────────────────

const SEEDS = ['_v516MonthHeadKey'];
const EXTERNAL = ['_v444Esc'];
const { map } = closureDecls(SRC, SEEDS, EXTERNAL);
const dropped = [];
for (const n of [...map.keys()]) {
  try { new vm.Script(map.get(n)); } catch { dropped.push(n); map.delete(n); }
}
assert.strictEqual(dropped.length, 0, `VM 抽取的声明有语法不完整项: ${dropped.join(', ')}`);
assert.ok(map.has('_v516MonthHeadKey'), 'VM 未能抽取 _v516MonthHeadKey');

function build(hack) {
  const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, Buffer, process, __exports: {} };
  vm.createContext(ctx);
  const bodySrc = [...map.entries()]
    .sort((a, b) => SRC.indexOf(a[1]) - SRC.indexOf(b[1]))
    .map((e) => (hack && hack[e[0]] ? hack[e[0]] : e[1]))
    .join('\n\n');
  vm.runInContext(
    bodySrc + '\n' + SEEDS.map((n) => `__exports[${JSON.stringify(n)}] = typeof ${n} !== 'undefined' ? ${n} : undefined;`).join('\n'),
    ctx,
  );
  return ctx.__exports;
}
const F = build();
const key = (line, lang) => F._v516MonthHeadKey(line, lang);
// ⚠️ vm 上下文里的对象原型 ≠ 本上下文 ⇒ deepStrictEqual 会因原型不同假红; 一律字段比较。
const isKey = (got, y, mo) => !!got && got.y === y && got.mo === mo;
const ZH_KEY = { y: 2027, mo: 6 };

test('E62-B1 zh 三形态全命中（标准 / 加粗 / 纯文本 + 叠加形态）', () => {
  const cases = [
    '### 2027年6月: 太阳白羊座 第3宫 · 财年收官',
    '**2027年6月: 太阳白羊座 第3宫** · 财年收官',
    '__2027年6月: 太阳白羊座 第3宫__',
    '### **2027年6月: 太阳白羊座 第3宫**',
    '2027年6月: 太阳白羊座 第3宫 · 财年收官',
    '2027年6月：太阳白羊座 第3宫（全角冒号）',
  ];
  for (const c of cases) {
    assert.ok(isKey(key(c, 'zh'), 2027, 6), `未识别: ${c}`);
  }
  assert.ok(isKey(key('#### 2026年9月: 太阳处女座 第6宫 · x', 'zh'), 2026, 9), '多级井号回退');
});

test('E62-B2 zh 正文散文不构成段界（宁漏不误）', () => {
  const prose = [
    '2027年6月，流年木星进入狮子座，扩张的浪潮涌来。',
    '今天是2027年6月里难得的好日子。',
    '等到 2027年6月，一切自会明朗。',
  ];
  for (const c of prose) {
    assert.strictEqual(key(c, 'zh'), null, `散文被误判为月标题: ${c}`);
  }
});

test('E62-B3 en 三形态全命中 + 英文散文不误判', () => {
  assert.ok(isKey(key('### July 2026: Sun in Leo 7th House', 'en'), 2026, 7));
  assert.ok(isKey(key('**July 2026: Sun in Leo**', 'en'), 2026, 7));
  assert.ok(isKey(key('July 2026: Sun in Leo', 'en'), 2026, 7), '纯文本 en 月标题');
  assert.strictEqual(key('In July 2026, Mars enters Leo.', 'en'), null, 'en 散文误判');
});

test('E62-B4 多语回归不破（vi Tháng 11 长词优先 / th 佛历）', () => {
  assert.ok(isKey(key('### Tháng 11 Năm 2026: x', 'vi'), 2026, 11), 'E16 长词优先回归');
  assert.ok(isKey(key('**Tháng 11 2026: x**', 'vi'), 2026, 11), 'vi 加粗形态');
  assert.ok(isKey(key('### กรกฎาคม พ.ศ. 2569: x', 'th'), 2026, 7), 'th 佛历回归');
  assert.ok(isKey(key('**กรกฎาคม 2026: x**', 'th'), 2026, 7), 'th 加粗形态');
});

// ───────────────────────── 三、注入自测 ─────────────────────────

test('E62-J1 把识别真源改回旧井号门禁 ⇒ 加粗/纯文本必失明（B1 必红）', () => {
  const degraded = new Map(map);
  const fnSrc = degraded.get('_v516MonthHeadKey');
  const hacked = fnSrc.replace(
    'const s = _d.bare;',
    "const s = String(line); if (!/^#{1,6}\\s/.test(s.trim())) return null;",
  );
  assert.notStrictEqual(hacked, fnSrc, '注入锚点失配');
  degraded.set('_v516MonthHeadKey', hacked);
  const G = build({ _v516MonthHeadKey: hacked });
  assert.strictEqual(G._v516MonthHeadKey('**2027年6月: 太阳白羊座 第3宫**', 'zh'), null,
    '闸门失效: 加粗形态回退未被判据识别');
  assert.strictEqual(G._v516MonthHeadKey('2027年6月: 太阳白羊座 第3宫', 'zh'), null,
    '闸门失效: 纯文本形态回退未被判据识别');
  assert.ok(isKey(G._v516MonthHeadKey('### 2027年6月: x', 'zh'), 2027, 6), '标准形态不应受影响');
});

test('E62-J2 纯文本自证判据放宽（逗号也算分隔）⇒ B2 必红', () => {
  const shapeSrc = map.get('_e62PlainHeadShape');
  const hacked = shapeSrc.replace('月\\s*(?:[:：', '月\\s*(?:[，,：');
  assert.notStrictEqual(hacked, shapeSrc, '注入锚点失配（_e62PlainHeadShape 形态已变）');
  const G = build({ _e62PlainHeadShape: hacked });
  assert.ok(G._v516MonthHeadKey('2027年6月，流年木星进入狮子座，扩张的浪潮涌来。', 'zh'),
    '闸门失效: 散文逗号形态未被拦截');
});

// ───────────────────────── 四、段位 ─────────────────────────

test('E62-C 闸门已接入 test:astro 长链，且 e40-compat 仍居倒数第二位', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const segs = pkg.scripts['test:astro'].split('&&').map((s) => s.trim()).filter(Boolean);
  const iSelf = segs.findIndex((s) => s.includes('audit-e62-month-head-form'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.ok(iSelf >= 0, 'E62 闸门未接入 test:astro');
  assert.ok(iCap === segs.length - 2, `e40-compat 段位漂移：${iCap} / len=${segs.length}（须为 len-2）`);
  assert.ok(iSelf < iCap, 'E62 闸门须排在 e40-compat 之前');
});
