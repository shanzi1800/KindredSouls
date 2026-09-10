import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ── 导入 getAstroMatrix / buildNatalAnchors（v69_client.js，不触发后端初始化）──
import { getAstroMatrix, buildNatalAnchors } from '../v69_client.js';

/**
 * V420 本命盘锚点真值审计（军令 P0 · 回归门）
 * ─────────────────────────────────────────────
 * 病根（2026-09-10 诊断）：
 *   1) server.js 报头取本命月亮时写了 astroMatrix.natal_planets?.Moon?.sign —— 该键不存在
 *      → undefined → optional chaining 静默回落 first.moon（流月月亮）→ 本命月亮逐月漂移。
 *   2) monthlySystem 从未注入任何本命锚点/fact sheet，而 prompt 却要求
 *      「see NATAL CHART ANCHORS in the fact sheet」→ 模型只能编本命月亮。
 *   实测：1990-08-05 07:00 HCMC 真值 Ma Kết(Capricorn) 第5宫，被编成 Bọ Cạp(Scorpio) 第3·8宫，且自相矛盾。
 *
 * 真值来源：astro/astro_matrix.py --mode natal（SwissEph 实测，非人工录入）
 */
const CASE = { birthDate: '1990-08-05', birthTime: '07:00', lat: 10.8231, lon: 106.6297, tz: 'Asia/Ho_Chi_Minh' };
const TRUTH = { sun: 'Leo', sunHouse: 12, moon: 'Capricorn', moonHouse: 5, rising: 'Virgo' };

describe('V420 本命盘锚点真值审计（SwissEph 真值 · 禁流月冒充）', () => {
  test('锚点块必须逐字引用本命真值，且流月月亮不得混入', async () => {
    const m = await getAstroMatrix(CASE.birthDate, CASE.birthTime, CASE.lat, CASE.lon, CASE.tz);

    // 1) 键名铁律：真值必须在 meta.natal_moon（键名漂移 = 下游静默回落流月的起因）
    assert.ok(m?.meta?.natal_moon, 'meta.natal_moon 缺失：键名一旦漂移，optional chaining 会静默回落流月');
    assert.equal(m.meta.natal_moon.sign, TRUTH.moon, '本命月亮星座与 SwissEph 真值不符');
    assert.equal(m.meta.natal_moon.house, TRUTH.moonHouse, '本命月亮宫位与 SwissEph 真值不符');
    assert.equal(m.meta.sun_sign, TRUTH.sun, '本命太阳星座与 SwissEph 真值不符');
    assert.equal(m.meta.rising_sign, TRUTH.rising, '上升星座与 SwissEph 真值不符');

    // 2) 锚点块内容必须写真值（月报 monthlySystem 直接注入这段）
    const anchors = buildNatalAnchors(m);
    assert.match(anchors, /Your Natal Moon: Capricorn in House 5/, `锚点未写真值:\n${anchors}`);
    assert.match(anchors, /Your Natal Sun: Leo \(House 12\)/, `锚点太阳不对:\n${anchors}`);
    assert.ok(!anchors.includes('Your Natal Moon: ?'), '锚点本命月亮取值失败（回落成了 "?"）');

    // 3) 流月月亮绝不可冒充本命月亮
    const transitMoon = m.months?.[0]?.moon?.sign;
    if (transitMoon) {
      assert.notEqual(transitMoon, TRUTH.moon,
        `用例失效：该生日流月(${transitMoon})与本命月亮同值，无法检出流月污染，请换用例`);
      const natalLine = anchors.split('\n').find(l => l.startsWith('Your Natal Moon'));
      assert.ok(!natalLine.includes(transitMoon),
        `本命月亮行被流月(${transitMoon})污染：${natalLine}`);
    }

    // 4) 🛠️ V423: 10 行星全量 —— 锚点块必须逐项写真值（此前仅日/月，其余 8 星在正文任由模型发挥）
    const P_VI = { Sun:'Mặt Trời', Moon:'Mặt Trăng', Mercury:'Sao Thủy', Venus:'Sao Kim', Mars:'Sao Hỏa',
      Jupiter:'Sao Mộc', Saturn:'Sao Thổ', Uranus:'Sao Thiên Vương', Neptune:'Sao Hải Vương', Pluto:'Sao Diêm Vương' };
    const ORDER = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
    const ch = m?.meta?.computed_houses || {};
    for (const p of ORDER) {
      const info = p === 'Moon' ? (m.meta.natal_moon || ch.Moon) : ch[p];
      assert.ok(info, `computed_houses.${p} 缺失：10 行星真值必须齐全`);
      if (p === 'Sun') {
        assert.match(anchors, new RegExp(`Your Natal Sun: ${info.sign} \\(House ${info.house}\\)`), anchors);
      } else if (p === 'Moon') {
        assert.match(anchors, new RegExp(`Your Natal Moon: ${info.sign} in House ${info.house}`), anchors);
      } else {
        assert.match(anchors, new RegExp(`Your Natal ${p} \\(${P_VI[p]}\\): ${info.sign} in House ${info.house}`),
          `锚点缺 ${p} 真值行:\n${anchors}`);
      }
    }
  });
});
