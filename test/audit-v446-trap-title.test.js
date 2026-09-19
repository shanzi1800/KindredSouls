// V446-trap 回归门：陷阱段标题归一——吃掉任意外层 [✦/⚠ 信封与多余 ]，归一到规范头
// 治「[✦ ⚠[⚠️ 消费陷阱：2026年9月] ]」等套框畸形（前端会原样渲染成 [✦ ⚠[⚠️ ...] ]）。
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

// 切片 1：依赖常量 + getMonthLabel（位于 fixMonthlySectionTitles 之前）
const depStart = SRC.indexOf('const SECTION_PLACEHOLDERS');
const fnStart = SRC.indexOf('function fixMonthlySectionTitles');
if (depStart < 0 || fnStart < 0 || fnStart <= depStart) throw new Error('[V446] 切片依赖块失败');
const DEPS = SRC.slice(depStart, fnStart);

// 切片 2：fixMonthlySectionTitles 本体（到 _v433DumpPrompt 前结束）
const fnEnd = SRC.indexOf('function _v433DumpPrompt');
if (fnEnd < 0) throw new Error('[V446] 切片函数体失败');
const FN = SRC.slice(fnStart, fnEnd);

const F = new Function(DEPS + '\n' + FN + '\nreturn { fixMonthlySectionTitles };');
const { fixMonthlySectionTitles } = F();

// ── V446-trap2 追加：cleanMonthlyBrackets 幂等门（与服务端同源抽取）────────────
function _grabFn(name) {
  const i = SRC.search(new RegExp('(^|\\n)\\s*function\\s+' + name + '\\s*\\('));
  if (i < 0) throw new Error('[V446] 未找到函数 ' + name);
  const j = SRC.indexOf('{', i);
  let d = 0, s = false, k = j;
  for (; k < SRC.length; k++) { if (SRC[k] === '{') { d++; s = true; } else if (SRC[k] === '}') { d--; if (s && d === 0) { k++; break; } } }
  return SRC.slice(j + 1, k - 1);
}
const F2 = new Function(DEPS + '\n' + FN
  + '\nfunction _stripEmoji(s){return s;}'
  + '\nfunction cleanMonthlyBrackets(text, lang="zh"){' + _grabFn('cleanMonthlyBrackets') + '}'
  + '\nreturn { fixMonthlySectionTitles, cleanMonthlyBrackets };');
const { cleanMonthlyBrackets } = F2();

// 用「干净输入归一结果」做基准（规避当前月份依赖：函数内部用 new Date() 生成月份标签）
const canon = fixMonthlySectionTitles('[⚠️ 消费陷阱：2026年9月]', true, 'zh');
assert.ok(canon.startsWith('✦ [⚠️ 消费陷阱：'), '[V446] 基准 canonical 形态异常: ' + canon);
assert.ok(canon.endsWith('] ✦'), '[V446] 基准 canonical 尾形态异常: ' + canon);

describe('V446-trap：陷阱段标题健壮归一', () => {
  const malformed = [
    ['用户精确串', '[✦ ⚠[⚠️ 消费陷阱：2026年9月] ]'],
    ['嵌套 []', '✦ [⚠️ [消费陷阱：2026年9月]]'],
    ['外层 [] 前置', '[✦ ⚠️ 消费陷阱：2026年9月]'],
    ['双 ⚠️', '✦ [⚠️ ⚠️ 消费陷阱：2026年9月] ✦'],
    ['无 ✦', '[⚠️ 消费陷阱：2026年9月]'],
    ['sectionB 换行', '✦\n[⚠️ 消费陷阱：2026年9月]'],
    ['多空格', '[ ✦  ⚠️ 消费陷阱：2026年9月 ]'],
    ['英文', '✦ [⚠️ Spending Trap: 2026年9月] ✦'],
    ['法文', '✦ [⚠️ Pièges Financiers: 2026年9月] ✦'],
    ['Financial Shadow', '✦ [Financial Shadow: 2026年9月] ✦'],
  ];

  for (const [name, input] of malformed) {
    test(`① ${name} → 归一到规范头（无套框残留）`, () => {
      const out = fixMonthlySectionTitles(input, true, 'zh');
      assert.strictEqual(out, canon, `${name} 未归一: 期望=${canon} 实际=${out}`);
      // 额外硬约束：不得残留外层 [✦ 信封 / 多余 ]
      assert.ok(!out.includes('[✦'), `${name} 残留外层 [✦ 信封: ${out}`);
      assert.ok(out.startsWith('✦ [⚠️ 消费陷阱：'), `${name} 头部不规范: ${out}`);
      assert.ok(out.endsWith('] ✦'), `${name} 尾部不规范: ${out}`);
    });
  }

  test('② 幂等：规范串复跑不变', () => {
    assert.strictEqual(fixMonthlySectionTitles(canon, true, 'zh'), canon);
  });

  test('③ 正文含「消费陷阱」但不带 []/⚠️ 信封 → 不误伤', () => {
    const body = '本月消费陷阱多，需注意。';
    assert.strictEqual(fixMonthlySectionTitles(body, true, 'zh'), body);
  });

  test('④ 尾随正文时只归一标题、正文保留', () => {
    const input = `✦ [⚠️ 消费陷阱：2026年9月] ✦\n本月需警惕冲动消费`;
    const out = fixMonthlySectionTitles(input, true, 'zh');
    assert.strictEqual(out, `✦ [⚠️ 消费陷阱：${canon.match(/消费陷阱：(.+?)\]/)[1]}] ✦\n本月需警惕冲动消费`);
  });

  test('⑤ 空串/undefined 安全', () => {
    assert.strictEqual(fixMonthlySectionTitles('', true, 'zh'), '');
    assert.strictEqual(fixMonthlySectionTitles(undefined, true, 'zh'), undefined);
  });
});

// ═══ V446-trap2：并段回归 + cleanMonthlyBrackets 幂等 ═══
describe('V446-trap2：标题前空行保留 + cleanMonthlyBrackets 幂等', () => {
  test('⑥ 标题前空行必须保留（治贪婪吃 \\n\\n 并段回归）', () => {
    const input = '正文段落结束。\n\n✦ [⚠️ 消费陷阱：2026年9月] ✦\n危险行星为流年金星。';
    const out = fixMonthlySectionTitles(input, true, 'zh');
    assert.ok(out.includes('结束。\n\n✦ [⚠️ 消费陷阱：'), '标题前 \\n\\n 被吞（并段回归）: ' + JSON.stringify(out));
    assert.ok(!out.includes('结束。✦'), '标题被并进上一段: ' + JSON.stringify(out));
  });

  test('⑦ cleanMonthlyBrackets 对规范标题幂等（无双层信封、无多余 ]）', () => {
    const out = cleanMonthlyBrackets(canon, 'zh');
    assert.ok(!out.includes('[✦'), '双层信封残留: ' + JSON.stringify(out));
    assert.ok(!/✦\]/.test(out), '尾部多余 ] 残留: ' + JSON.stringify(out));
  });

  test('⑧ 全链 fixMonthly→cleanMonthly→fixMonthly = 规范头且不并段', () => {
    const input = '正文段落结束。\n\n✦ [⚠️ 消费陷阱：2026年9月] ✦\n危险行星为流年金星。';
    const out = fixMonthlySectionTitles(cleanMonthlyBrackets(fixMonthlySectionTitles(input, true, 'zh'), 'zh'), true, 'zh');
    assert.ok(out.includes('✦ [⚠️ 消费陷阱：'), '未归一: ' + JSON.stringify(out));
    assert.ok(!/✦\]/.test(out), '尾部多余 ]: ' + JSON.stringify(out));
    assert.ok(!out.includes('结束。✦'), '并段: ' + JSON.stringify(out));
  });
});

// ═══ V458：es/th/vi trap 标题词统一（对齐 _TRAP_TITLE 权威规范）═══
describe('V458：es/th/vi trap 标题词统一', () => {
  const cases = [
    ['es', '[⚠️ Trampas de Gasto: Septiembre 2026]', 'Trampas Financieras'],
    ['th', '[⚠️ กับดักการใช้จ่าย: กันยายน 2026]', 'กับดักทางการเงิน'],
    ['vi', '[⚠️ Bẫy Chi Tiêu: Tháng 9, 2026]', 'Cạm bẫy Tài chính'],
  ];
  for (const [lang, input, expect] of cases) {
    test(`① ${lang} 畸形 trap 标题 → 归一到规范词 ${expect}`, () => {
      const out = fixMonthlySectionTitles(input, true, lang);
      assert.ok(out.includes('✦ [⚠️ ' + expect + ':'), `${lang} 未归一到 ${expect}: ${out}`);
      assert.ok(out.endsWith('] ✦'), `${lang} 尾部不规范: ${out}`);
    });
    test(`② ${lang} 幂等：规范串复跑不变`, () => {
      const norm = fixMonthlySectionTitles(input, true, lang);
      assert.strictEqual(fixMonthlySectionTitles(norm, true, lang), norm);
    });
  }
});
