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
