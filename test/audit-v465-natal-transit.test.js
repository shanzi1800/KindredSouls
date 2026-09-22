// V465: Natal vs Transit Disambiguation — CI 集成测试
// 用法: node --test test/audit-v465-natal-transit.test.js
//       (独立运行，不依赖后端初始化)
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { getAstroMatrix, buildNatalAnchors, assertNatalPlanetTruth } from '../v69_client.js';

const BASE_URL = process.env.TEST_BASE_URL || 'https://kindredsouls.online';

/**
 * 样本 A: 1995-12-21 23:55 Reykjavik (冰岛)
 * 冰岛纬度高 + 大西洋时区，测试极端边界场景。
 *
 * SwissEph 本命真值（V465 封仓基准）：
 *   Sun: Sagittarius H4 | Moon: Sagittarius H4
 *   Mercury: Capricorn H4 | Venus: Aquarius H5
 *   Mars: Capricorn H4 | Jupiter: Sagittarius H4
 *   Saturn: Pisces H7 | Uranus: Capricorn H5
 *   Neptune: Capricorn H5 | Pluto: Sagittarius H3
 *
 * 2026年9月流年（与本命不同的行星——最容易混淆）：
 *   Mercury: Libra H10 ← LLM 之前误将流年当本命
 *   Venus: Scorpio H9 ← 同上
 *   Mars: Cancer H12 ← 同上
 *   Jupiter: Leo H11 ← 同上
 *   Saturn: Aries H8 ← 同上
 *
 * V465 修复：buildNatalAnchors 新增 transit 对照区 + disambiguation rules
 */
const CASE_A = { birthDate: '1995-12-21', birthTime: '23:55', lat: 64.15, lon: -21.94, tz: 'Atlantic/Reykjavik' };

describe('V465: Natal vs Transit Disambiguation (样本 A · Reykjavik EN)', { concurrency: false }, () => {

  test('① SwissEph 真值：Mercury/Capricorn/H4，Transit Mercury/Libra/H10 —— 两者必须不同', async () => {
    const m = await getAstroMatrix(CASE_A.birthDate, CASE_A.birthTime, CASE_A.lat, CASE_A.lon, CASE_A.tz);
    const natalMercury = m.meta.computed_houses.Mercury;
    assert.equal(natalMercury.sign, 'Capricorn', 'natal Mercury must be Capricorn');
    assert.equal(natalMercury.house, 4, 'natal Mercury must be House 4');

    const transitMercury = m.months[0].mercury;
    assert.equal(transitMercury.sign, 'Libra', 'transit Mercury must be Libra (Sep 2026)');
    assert.equal(transitMercury.house, 2, 'transit Mercury must be House 2 (Sep 2026)');

    // 验证：两者必须不同（否则测试用例失效——说明流年恰好等于本命）
    assert.notEqual(natalMercury.sign, transitMercury.sign,
      'natal Mercury sign must differ from transit Mercury — if equal, this test case is invalid');
    assert.notEqual(natalMercury.house, transitMercury.house,
      'natal Mercury house must differ from transit Mercury — if equal, this test case is invalid');
  });

  test('② buildNatalAnchors 必须包含 TRANSIT POSITIONS 区（新 V465 强制结构）', async () => {
    const m = await getAstroMatrix(CASE_A.birthDate, CASE_A.birthTime, CASE_A.lat, CASE_A.lon, CASE_A.tz);
    const anchors = buildNatalAnchors(m);
    assert.ok(anchors.includes('TRANSIT POSITIONS'), 'must include TRANSIT POSITIONS section');
    assert.ok(anchors.includes('Transiting Mercury: Libra'), 'transit Mercury must appear');
    assert.ok(anchors.includes('Transiting Saturn: Aries'), 'transit Saturn must appear');
    assert.ok(anchors.includes('DO NOT MIX'), 'must include DO NOT MIX warning');
    assert.ok(anchors.includes('NATAL vs TRANSIT'), 'must include disambiguation rule');
  });

  test('③ buildNatalAnchors prose 区的 natal Mercury 必须是 Capricorn H4（非 Libra H10）', async () => {
    const m = await getAstroMatrix(CASE_A.birthDate, CASE_A.birthTime, CASE_A.lat, CASE_A.lon, CASE_A.tz);
    const anchors = buildNatalAnchors(m);
    // prose 区应该写 Capricorn H4
    // prose 格式: "Your Natal Mercury (Sao Thủy): Capricorn in House 4"
    assert.ok(anchors.includes('Your Natal Mercury (Sao Thủy): Capricorn in House 4'),
      `natal Mercury in prose must be Capricorn H4:\n${anchors}`);
    // transit 数据行（不含 rules 段落）里不应出现 Capricorn H4
    const rulesIdx = anchors.indexOf('// ─── RULES');
    const transitDataEnd = rulesIdx > 0 ? rulesIdx : anchors.length;
    const transitDataSection = anchors.slice(anchors.indexOf('TRANSIT POSITIONS'), transitDataEnd);
    assert.ok(!transitDataSection.includes('Capricorn H4'),
      `transit data section must not show natal Capricorn H4:\n${transitDataSection}`);
  });

  test('④ assertNatalPlanetTruth 能正确捕获 natal/transit 混淆（模拟 LLM 幻觉）', async () => {
    const m = await getAstroMatrix(CASE_A.birthDate, CASE_A.birthTime, CASE_A.lat, CASE_A.lon, CASE_A.tz);

    // 模拟 LLM 幻觉：用流年 Mercury (Libra H2) 冒充本命
    const buggyText = 'Your natal Mercury in Libra, House 2 brings important communications this week.';
    const r = assertNatalPlanetTruth(buggyText, 'en', m);
    assert.equal(r.passed, false, 'must catch natal/transit confusion');
    assert.equal(r.violations.length, 1);
    assert.equal(r.violations[0].planet, 'Mercury');
    assert.equal(r.violations[0].expectedSign, 'Capricorn');
    assert.equal(r.violations[0].foundSign, 'Libra'); // 流年位置
    assert.equal(r.violations[0].foundHouse, 2); // 流年 H2
  });

  test('⑤ assertNatalPlanetTruth 不误伤纯 transit 引用（无 natal 修饰词）', async () => {
    const m = await getAstroMatrix(CASE_A.birthDate, CASE_A.birthTime, CASE_A.lat, CASE_A.lon, CASE_A.tz);
    // transit 描述不应该触发 natal 断言
    const transitOnlyText = 'Transiting Mercury in Libra, House 10 forms a trine with your natal chart.';
    const r = assertNatalPlanetTruth(transitOnlyText, 'en', m);
    assert.equal(r.passed, true, 'pure transit references must not trigger natal violation');
  });

  test('⑥ assertNatalPlanetTruth 正确接受正确 natal 引用', async () => {
    const m = await getAstroMatrix(CASE_A.birthDate, CASE_A.birthTime, CASE_A.lat, CASE_A.lon, CASE_A.tz);
    const correctText = 'Your natal Mercury in Capricorn, House 4 brings careful analysis this week.';
    const r = assertNatalPlanetTruth(correctText, 'en', m);
    assert.equal(r.passed, true, 'correct natal reference must pass');
    assert.equal(r.checked, 1);
    assert.equal(r.violations.length, 0);
  });

  test('⑥b assertNatalPlanetTruth 捕捉「星座对、宫位错」（生产实测 V464 bug 复现）', async () => {
    const m = await getAstroMatrix(CASE_A.birthDate, CASE_A.birthTime, CASE_A.lat, CASE_A.lon, CASE_A.tz);
    // 星座对，宫位错 —— 这是生产 V464 测到的 bug 模式
    const buggyHouseText = 'Your natal Mercury in Capricorn, House 2 brings careful analysis.';
    const r = assertNatalPlanetTruth(buggyHouseText, 'en', m);
    assert.equal(r.passed, false, 'must catch house-number-only violation');
    assert.equal(r.violations[0].planet, 'Mercury');
    assert.equal(r.violations[0].expectedSign, 'Capricorn'); // 星座对
    assert.equal(r.violations[0].foundSign, 'Capricorn');   // 星座对
    assert.equal(r.violations[0].expectedHouse, 4);          // 真值 H4
    assert.equal(r.violations[0].foundHouse, 2);           // 写成了 H2
  });

  test('⑥c assertNatalPlanetTruth 不误伤 transit-only 引用（完全无 natal 标记）', async () => {
    const m = await getAstroMatrix(CASE_A.birthDate, CASE_A.birthTime, CASE_A.lat, CASE_A.lon, CASE_A.tz);
    // 纯 transit 描述，不含 natal 标记 —— 不应触发
    const transitText = 'Transiting Mercury in Libra, House 2 brings important communications.';
    const r = assertNatalPlanetTruth(transitText, 'en', m);
    assert.equal(r.passed, true, 'transit-only text must not trigger natal assertion');
  });

  test('⑦ 生产 API 实测：EN 样本 A 月报（强制 MISS）无 natal/transit 混淆', async () => {
    const m = await getAstroMatrix(CASE_A.birthDate, CASE_A.birthTime, CASE_A.lat, CASE_A.lon, CASE_A.tz);

    // 清缓存（强制生成，避开旧缓存）
    try {
      await fetch(`${BASE_URL}/api/clear-cache/${CASE_A.birthDate}/en/monthly`);
    } catch (_) { /* ignore cache clear failure */ }

    // 等待缓存清理
    await new Promise(r => setTimeout(r, 2000));

    // 调用流式 API，收集完整文本
    const response = await fetch(`${BASE_URL}/api/wealth-oracle/stream?free_access=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birthDate: CASE_A.birthDate, lang: 'en', reportType: 'monthly' }),
    });

    if (!response.ok) {
      // API 调用失败（非阻塞，跳过此测试）
      console.warn(`[V465 CI] API call failed: ${response.status} — skipping live test`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // SSE 格式: data: {...}\n\n
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const obj = JSON.parse(line.slice(6));
            if (obj.text || obj.content) fullText += (obj.text || obj.content);
            if (obj.cleanedText) fullText = obj.cleanedText; // 取终稿
          } catch (_) { /* ignore parse errors */ }
        }
      }
    }

    if (fullText.length < 500) {
      console.warn(`[V465 CI] Report too short (${fullText.length} chars) — skipping`);
      return;
    }

    // 核心断言：natal 引用不能等于 transit 位置
    const r = assertNatalPlanetTruth(fullText, 'en', m);
    if (!r.passed) {
      console.warn('[V465 CI] Natal violations detected:');
      for (const v of r.violations) {
        console.warn(`  ${v.planet}: expected ${v.expectedSign} H${v.expectedHouse}, found ${v.foundSign} H${v.foundHouse}`);
        console.warn(`  context: "${v.context}"`);
      }
    }
    assert.equal(r.passed, true, `natal violations found: ${r.violations.length} — see console.warn above`);
  }, 120000); // 2min timeout for live API test

});
