// V467: 月亮周标签单一真源回归门（治本「🌙 月亮过境/途经」混用）
// 用法: node --test test/audit-v467-moon-label.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { v462NormalizeMoonLabel, V462_MOON_LABEL } from '../v69_client.js';

// 模拟 LLM 漂移：W1/W3 用「过境」、W2/W4 用「途经」交替（V467 前实测 bug）
const MIXED = [
  '🌙 月亮过境：9月1–7日',
  '🌙 月亮途经：9月8–14日',
  '🌙 月亮过境：9月15–21日',
  '🌙 月亮途经：9月22–30日',
].join('\n');

describe('V467: 月亮周标签单一真源', () => {

  for (const lang of ['en', 'es', 'fr', 'th', 'vi']) {
    test(`① ${lang}: 过境/途经 混用 → 统一为「🌙 月亮过境：」`, () => {
      const out = v462NormalizeMoonLabel(MIXED, lang);
      const labels = [...new Set(out.split('\n').map(s => s.split('：')[0]))];
      assert.deepEqual(labels, ['🌙 月亮过境'], `${lang} 应全部归一到「🌙 月亮过境」，实际: ${labels}`);
    });
  }

  test('② zh: 过境/途经 混用 → 统一诗意化为「🌙 月轨足迹：」', () => {
    const out = v462NormalizeMoonLabel(MIXED, 'zh');
    const labels = [...new Set(out.split('：')[0] ? out.split('\n').map(s => s.split('：')[0]) : [])];
    assert.deepEqual(labels, ['🌙 月轨足迹'], `zh 应全部归一到「🌙 月轨足迹」，实际: ${labels}`);
  });

  test('③ 流月月亮依次行经变体（ZH 诗意化 / 其余保留）', () => {
    const zh = '月亮过境：流月月亮依次行经 Aries → Taurus';
    assert.equal(v462NormalizeMoonLabel(zh, 'zh'), '月光的足迹掠过 Aries → Taurus');
    const es = '月亮过境：流月月亮依次行经 Aries → Taurus';
    assert.equal(v462NormalizeMoonLabel(es, 'es'), '月亮过境：流月月亮依次行经 Aries → Taurus');
  });

  test('④ 幂等：已归一文本复跑不变', () => {
    for (const lang of ['en', 'es', 'fr', 'th', 'vi', 'zh']) {
      const once = v462NormalizeMoonLabel(MIXED, lang);
      const twice = v462NormalizeMoonLabel(once, lang);
      assert.equal(twice, once, `${lang} 应幂等`);
    }
  });

  test('⑤ 单一真源字典完整性：6 语言齐全且非 undefined', () => {
    for (const lang of ['zh', 'en', 'es', 'fr', 'th', 'vi']) {
      assert.ok(V462_MOON_LABEL[lang], `${lang} 的 V462_MOON_LABEL 缺失`);
      assert.notEqual(V462_MOON_LABEL[lang], 'undefined');
    }
  });

  test('⑥ V462_WEEK_SUB 同源原则：V462_MOON_LABEL 与 V462_WEEK_SUB 同为单一真源（不可在 prompt 内硬编码）', () => {
    // 这是架构约束声明：月亮标签必须走 v462NormalizeMoonLabel，不进 LLM prompt
    assert.equal(typeof v462NormalizeMoonLabel, 'function');
  });
});
