import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ── 导入 getAstroMatrix ──────────────────────────────────────────
// ⚠️ 注意：getAstroMatrix 定义在 v69_client.js（非 server.js，避免触发后端初始化/端口监听）
import { getAstroMatrix } from '../v69_client.js';

/**
 * AstroMatrix 2026-08 天文学真值审计（整宫制 · 上升天秤）
 * ────────────────────────────────────────────────────────────────
 * 基准：上升天秤座（整宫制 Equal House）
 * 参考日：astro_matrix.py 的 ref_date = 每月15日，故太阳/水星取 8月15日 参考值
 *
 * ⚠️ 真值表修正说明（山子大叔速查表太阳部分有误，已按实际天文修正）：
 *   原速查表：太阳 8/1–22 处女座、8/23–31 天秤座 → 第12/1宫
 *   实际天文：太阳 7/23–8/22 狮子座、8/23–9/22 处女座
 *            8月15日参考日太阳在【狮子座】（第11宫，天秤上升）
 *            8月23日后才进处女座（第12宫，天秤上升），9月23日才进天秤座
 *   本测试校验 8月15日参考日真值：太阳=狮子/11宫
 *
 * 木星/土星/火星 速查表正确（狮子11/白羊7/巨蟹10），直接沿用。
 */
describe('AstroMatrix 2026-08 天文学真值审计 (整宫制 · 上升天秤)', () => {
  test('校验 2026-08 月份流年星体 Sign 与 House 正确性', async () => {
    // 测试基准参数：上升天秤座
    // ⚠️ 原示例 birthTime='10:58' 实际为【金牛上升】，已修正为 '22:00'（天秤上升）
    const birthDate = '1969-01-26';
    const birthTime = '22:00';
    const lat = 45.44;
    const lon = 12.32;
    const tz = 'Europe/Rome';

    // ⚠️ 修正：getAstroMatrix 签名是展开参数 (birthDate, birthTime, lat, lon, tz)，非对象
    const matrix = await getAstroMatrix(birthDate, birthTime, lat, lon, tz);

    assert.ok(matrix, '❌ getAstroMatrix 返回空值');
    assert.ok(Array.isArray(matrix.months), '❌ astroMatrix.months 必须为数组');

    // ── 前置断言：基准必须是天秤上升（否则宫位映射无效）──
    assert.equal(
      matrix.meta?.rising_sign,
      'Libra',
      `❌ 测试基准要求上升天秤，实际上升为: ${matrix.meta?.rising_sign}（请修正 mockParams 的 birthTime）`
    );

    // ── 精确查找 2026-08 月份节点（用 month_key 精确匹配，兼容动态滚动数组）──
    const augData = matrix.months.find((m) => m.month_key === '2026-08');
    assert.ok(augData, '❌ 未在 astroMatrix.months 中找到 2026-08 的数据节点');

    // month 对象直接挂 jupiter/saturn/... 不带 planets 子对象（兜底兼容）
    const planets = augData.planets || augData;

    // 1. 木星 (Jupiter) -> 狮子座 / 第 11 宫 ✅ 真值表正确
    const jupiter = planets.jupiter;
    assert.ok(jupiter, '❌ 缺失木星 (jupiter) 数据');
    assert.match(String(jupiter.sign), /狮子|Leo/i, `木星星座异常，实际为: ${jupiter.sign}`);
    assert.equal(Number(jupiter.house), 11, `木星宫位异常 (应为 11)，实际为: ${jupiter.house}`);

    // 2. 土星 (Saturn) -> 白羊座 / 第 7 宫 ✅ 真值表正确
    const saturn = planets.saturn;
    assert.ok(saturn, '❌ 缺失土星 (saturn) 数据');
    assert.match(String(saturn.sign), /白羊|Aries/i, `土星座异常，实际为: ${saturn.sign}`);
    assert.equal(Number(saturn.house), 7, `土星宫位异常 (应为 7)，实际为: ${saturn.house}`);

    // 3. 火星 (Mars) -> 巨蟹座 / 第 10 宫 ✅ 真值表正确
    const mars = planets.mars;
    assert.ok(mars, '❌ 缺失火星 (mars) 数据');
    assert.match(String(mars.sign), /巨蟹|Cancer/i, `火星座异常，实际为: ${mars.sign}`);
    assert.equal(Number(mars.house), 10, `火星宫位异常 (应为 10)，实际为: ${mars.house}`);

    // 4. 太阳 (Sun) -> 狮子座 (8/15参考日) / 第 11 宫
    //    ⚠️ 修正：原速查表写"处女/天秤"有误，8月太阳在狮子座(至8/23)后到处女座
    const sun = planets.sun;
    assert.ok(sun, '❌ 缺失太阳 (sun) 数据');
    assert.match(
      String(sun.sign),
      /狮子|Leo/i,
      `太阳星座异常（8月15日参考日应在狮子座），实际为: ${sun.sign}`
    );
    assert.equal(
      Number(sun.house),
      11,
      `太阳宫位异常 (天秤上升·狮子=11宫)，实际为: ${sun.house}`
    );

    // 5. 水星 (Mercury) -> 狮子座 (8/15参考日) / 第 11 宫
    //    水星 8月全月在狮子/处女移动，8/15参考日在狮子座（第11宫）
    const mercury = planets.mercury;
    assert.ok(mercury, '❌ 缺失水星 (mercury) 数据');
    assert.match(
      String(mercury.sign),
      /狮子|Leo|处女|Virgo/i,
      `水星星座异常，实际为: ${mercury.sign}`
    );
    assert.equal(
      Number(mercury.house),
      11,
      `水星宫位异常 (天秤上升·狮子=11宫)，实际为: ${mercury.house}`
    );

    console.log(
      '✅ [2026-08 真值审计通过]: 木星(11宫/狮子)、土星(7宫/白羊)、火星(10宫/巨蟹)、太阳(11宫/狮子)、水星(11宫/狮子) 全部与天文学真值完全吻合！'
    );
  });
});
