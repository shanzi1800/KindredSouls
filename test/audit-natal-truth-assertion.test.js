// V461-STEP3: Natal Planet Truth Assertion — CI 回归门
// 用法: node --test test/audit-natal-truth-assertion.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { assertNatalPlanetTruth } from '../v69_client.js';

// ── 模拟 astroMatrix（1985-11-11 09:20 伦敦盘，SwissEph 真值）──
const am = {
  meta: {
    computed_houses: {
      Sun: { sign: 'Scorpio', house: 11 },
      Moon: { sign: 'Scorpio', house: 10 },
      Mercury: { sign: 'Scorpio', house: 11 },
      Venus: { sign: 'Libra', house: 9 },
      Mars: { sign: 'Cancer', house: 8 },
      Jupiter: { sign: 'Aquarius', house: 2 },
      Saturn: { sign: 'Pisces', house: 3 },
      Uranus: { sign: 'Capricorn', house: 1 },
      Neptune: { sign: 'Capricorn', house: 1 },
      Pluto: { sign: 'Scorpio', house: 11 },
    },
  },
};

describe('V461-STEP3: Natal Planet Truth Assertion', () => {

  test('① 正确的本命行星引用 → 零违背', () => {
    const text = 'Your natal Sun in Scorpio, House 11 illuminates your path. Your natal Jupiter in Aquarius, House 2 brings expansion.';
    const r = assertNatalPlanetTruth(text, 'en', am);
    assert.equal(r.passed, true, 'should pass with correct natal refs');
    assert.equal(r.checked, 2, 'should check 2 planets');
    assert.equal(r.violations.length, 0);
  });

  test('② 错误的本命木星（Leo H8 vs 真值 Aquarius H2）→ 1 违背', () => {
    const text = 'Your natal Jupiter in Leo, House 8 creates overconfidence.';
    const r = assertNatalPlanetTruth(text, 'en', am);
    assert.equal(r.passed, false);
    assert.equal(r.violations.length, 1);
    assert.equal(r.violations[0].planet, 'Jupiter');
    assert.equal(r.violations[0].expectedSign, 'Aquarius');
    assert.equal(r.violations[0].foundSign, 'Leo');
    assert.equal(r.violations[0].foundHouse, 8);
  });

  test('③ 纯流年引用（无 natal 修饰）→ 零违背（不误伤 transit）', () => {
    const text = 'Transit Jupiter in Leo, House 8 moves forward. The Moon in Scorpio, House 10 is intense.';
    const r = assertNatalPlanetTruth(text, 'en', am);
    assert.equal(r.passed, true, 'transit refs should not trigger natal assertion');
    assert.equal(r.checked, 0);
  });

  test('④ 混合：正确 Sun + 错误 Jupiter → 1 违背', () => {
    const text = 'Your natal Sun in Scorpio, House 11 and your natal Jupiter in Leo, House 8 both active.';
    const r = assertNatalPlanetTruth(text, 'en', am);
    assert.equal(r.passed, false);
    assert.equal(r.violations.length, 1);
    assert.equal(r.violations[0].planet, 'Jupiter');
  });

  test('⑤ 紧凑格式（H12 无空格）→ 正确检测', () => {
    const text = 'Your Sun in Scorpio H12 is powerful.';
    const r = assertNatalPlanetTruth(text, 'en', am);
    // Sun 真值是 H11，这里写 H12 → 违背
    assert.equal(r.passed, false);
    assert.equal(r.violations[0].planet, 'Sun');
    assert.equal(r.violations[0].foundHouse, 12);
    assert.equal(r.violations[0].expectedHouse, 11);
  });

  test('⑥ 空 text / 空 astroMatrix → 不崩溃，返回 passed=true', () => {
    assert.equal(assertNatalPlanetTruth('', 'en', am).passed, true);
    assert.equal(assertNatalPlanetTruth('text', 'en', null).passed, true);
    assert.equal(assertNatalPlanetTruth(null, 'en', am).passed, true);
  });

  test('⑦ 多行星同时错误 → 多违背', () => {
    const text = 'Your natal Sun in Aries, House 1 and your natal Moon in Taurus, House 2 and your natal Mars in Leo, House 5.';
    const r = assertNatalPlanetTruth(text, 'en', am);
    assert.equal(r.passed, false);
    assert.equal(r.violations.length, 3);
  });

  test('⑧ 幂等：对同一文本多次调用结果一致', () => {
    const text = 'Your natal Jupiter in Leo, House 8 is wrong.';
    const r1 = assertNatalPlanetTruth(text, 'en', am);
    const r2 = assertNatalPlanetTruth(text, 'en', am);
    assert.deepEqual(r1, r2);
  });

  test('⑨ 生产实测已知 bug：Jupiter Aquarius H2 → Leo H8（军师 84 分丢分项）', () => {
    // 军师打 84 分的报告里，本命木星 Aquarius H2 被写成 Leo H8
    const text = 'With your natal Jupiter in Leo, House 8, this week brings expansion and overconfidence.';
    const r = assertNatalPlanetTruth(text, 'en', am);
    assert.equal(r.passed, false, 'must catch the 84-score bug');
    assert.equal(r.violations[0].planet, 'Jupiter');
    assert.equal(r.violations[0].expectedSign, 'Aquarius');
    assert.equal(r.violations[0].expectedHouse, 2);
    assert.equal(r.violations[0].foundSign, 'Leo');
    assert.equal(r.violations[0].foundHouse, 8);
  });

});
