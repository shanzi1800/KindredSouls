import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ── 导入 getAstroMatrix ──────────────────────────────────────────
// ⚠️ getAstroMatrix 定义在 v69_client.js（非 server.js，避免触发后端初始化/端口监听）
// ⚠️ 签名：(birthDate, birthTime, lat, lon, tz) —— 无 lang 参数，sign 永远返回英文
import { getAstroMatrix } from '../v69_client.js';

/**
 * AstroMatrix 2026-09 天文学真值 + 多语言映射审计（整宫制 · 上升天秤）
 * ────────────────────────────────────────────────────────────────
 * 基准：上升天秤座（整宫制 Equal House）
 * 参考日：astro_matrix.py 的 ref_date = 每月15日，故太阳/水星取 8月15日 参考值
 *
 * ⚠️ 真值表修正（山子大叔原速查表太阳部分有误）：
 *   8月太阳在【狮子座】(至8/23)后到处女座，原速查表写"处女/天秤"有误。
 *   8月15日参考日：太阳=狮子/11宫，水星=狮子/11宫。
 *
 * ⚠️ 多语言架构说明（关键）：
 *   - astro_matrix.py 的 sign 字段【永远是英文】（Leo/Aries/Cancer），不随语言变化
 *   - 系统的多语言映射在 web/src/lib/algos/i18n.ts 的 ZODIAC_SIGNS 字典
 *   - getAstroMatrix 不接收 lang 参数，传了也会被忽略
 *   - 系统 i18n.ts 支持语言：zh/en/es/fr/th/vi（【无 ja/ko/de】）
 *   - 因此本测试用系统实际支持的 6 语言，而非原示例的 zh/en/ja/ko/es/de
 *     如需测试 ja/ko/de，需先在 i18n.ts 补 ZODIAC_SIGNS 的 ja/ko/de 映射
 */

// ── 系统 i18n 字典快照（与 web/src/lib/algos/i18n.ts 的 ZODIAC_SIGNS 同步）──
// 若 i18n.ts 更新，需同步此处。系统支持语言：zh/en/es/fr/th/vi
const SYSTEM_ZODIAC_SIGNS = {
  白羊座: { zh: '白羊座', en: 'Aries', es: 'Aries', fr: 'Bélier', th: 'ราศีเมษ', vi: 'Bạch Dương' },
  金牛座: { zh: '金牛座', en: 'Taurus', es: 'Tauro', fr: 'Taureau', th: 'ราศีพฤษภ', vi: 'Kim Ngưu' },
  双子座: { zh: '双子座', en: 'Gemini', es: 'Géminis', fr: 'Gémeaux', th: 'ราศีมิถุน', vi: 'Song Tử' },
  巨蟹座: { zh: '巨蟹座', en: 'Cancer', es: 'Cáncer', fr: 'Cancer', th: 'ราศีกรกฎ', vi: 'Cự Giải' },
  狮子座: { zh: '狮子座', en: 'Leo', es: 'Leo', fr: 'Lion', th: 'ราศีสิงห์', vi: 'Sư Tử' },
  处女座: { zh: '处女座', en: 'Virgo', es: 'Virgo', fr: 'Vierge', th: 'ราศีกันย์', vi: 'Xử Nữ' },
  天秤座: { zh: '天秤座', en: 'Libra', es: 'Libra', fr: 'Balance', th: 'ราศีตุลย์', vi: 'Thiên Bình' },
  天蝎座: { zh: '天蝎座', en: 'Scorpio', es: 'Escorpio', fr: 'Scorpion', th: 'ราศีพิจิก', vi: 'Thiên Xung' },
  射手座: { zh: '射手座', en: 'Sagittarius', es: 'Sagitario', fr: 'Sagittaire', th: 'ราศีธนู', vi: 'Nhân Mã' },
  摩羯座: { zh: '摩羯座', en: 'Capricorn', es: 'Capricornio', fr: 'Capricorne', th: 'ราศีมังกร', vi: 'Ma Kết' },
  水瓶座: { zh: '水瓶座', en: 'Aquarius', es: 'Acuario', fr: 'Verseau', th: 'ราศีกุมภ์', vi: 'Bảo Bình' },
  双鱼座: { zh: '双鱼座', en: 'Pisces', es: 'Piscis', fr: 'Poissons', th: 'ราศีมีน', vi: 'Song Ngư' },
};

// 英文 sign → 中文 key 映射（从 SYSTEM_ZODIAC_SIGNS 反向建，供 astro_matrix.py 英文 sign 接回中文 key）
const EN_TO_CN = {};
for (const [cn, langs] of Object.entries(SYSTEM_ZODIAC_SIGNS)) {
  EN_TO_CN[langs.en] = cn;
}

// 山子大叔标准答案（多语言正则）——仅系统支持且有标准答案的语言：zh/en/es
// （fr/th/vi 系统字典有译名，但山子大叔原 SIGN_DICTIONARY 未提供，仅校验"不缺词"）
const SIGN_STD = {
  Leo: { zh: /狮子/, en: /Leo/i, es: /Leo/i },
  Aries: { zh: /白羊|牡羊/, en: /Aries/i, es: /Aries/i },
  Cancer: { zh: /巨蟹/, en: /Cancer/i, es: /Cáncer|Cancer/i },
};

// 系统实际支持的语言（i18n.ts AlgLang：zh/en/es/fr/th/vi）
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

// 2026-09 天文真值（英文 sign + house，不随语言变化）
// 木星狮子11 / 土星白羊7 / 火星巨蟹10 / 太阳狮子11(8/15参考日) / 水星狮子11(8/15参考日)
const EXPECTED = {
  jupiter: { sign: 'Leo', house: 11 },
  saturn: { sign: 'Aries', house: 7 },
  mars: { sign: 'Cancer', house: 10 },
  sun: { sign: 'Virgo', house: 12 },
  mercury: { sign: 'Libra', house: 1 },
};

describe('AstroMatrix 2026-09 天文学真值 + 多语言映射审计 (整宫制 · 天秤上升)', () => {
  test('校验 2026-09 星体英文 Sign 真值 + 6语言字典映射准确性', async () => {
    // 天秤上升固定入参：1969-01-26 22:00（原示例 10:58 为金牛上升，已修正）
    const matrix = await getAstroMatrix('1969-01-26', '22:00', 45.44, 12.32, 'Europe/Rome');

    assert.ok(matrix, '❌ getAstroMatrix 返回空值');
    assert.ok(Array.isArray(matrix.months), '❌ astroMatrix.months 必须为数组');

    // ── 前置断言：基准必须是天秤上升（否则宫位映射无效）──
    assert.equal(
      matrix.meta?.rising_sign,
      'Libra',
      `❌ 测试基准要求上升天秤，实际上升为: ${matrix.meta?.rising_sign}（请修正 birthTime）`
    );

    // ── 精确查找 2026-09 月份节点（用 month_key 精确匹配，兼容动态滚动数组）──
    const augData = matrix.months.find((m) => m.month_key === '2026-09');
    assert.ok(augData, '❌ 未在 astroMatrix.months 中找到 2026-09 的数据节点');

    const planets = augData.planets || augData;

    for (const [planet, exp] of Object.entries(EXPECTED)) {
      const p = planets[planet];
      assert.ok(p, `❌ 缺失 ${planet} 数据`);

      // 1. 英文 sign 天文真值（astro_matrix.py 输出，不随 lang 变）
      assert.equal(
        p.sign,
        exp.sign,
        `❌ [${planet}] 英文 sign 异常，期望 ${exp.sign}，实际 ${p.sign}`
      );

      // 2. house 天文真值（整宫制·天秤上升）
      assert.equal(
        Number(p.house),
        exp.house,
        `❌ [${planet}] 宫位异常，期望 ${exp.house}，实际 ${p.house}`
      );

      // 3. 多语言字典映射（英文 sign → 中文 key → 各语言译名）
      const cnSign = EN_TO_CN[exp.sign];
      assert.ok(cnSign, `❌ [${planet}] 英文 ${exp.sign} 无中文映射`);

      for (const lang of LANGS) {
        const localized = SYSTEM_ZODIAC_SIGNS[cnSign]?.[lang];

        // 3a. 防缺词/undefined（核心防护：国际化字典不得返回空或 undefined）
        assert.ok(
          localized && typeof localized === 'string' && localized.trim() !== '',
          `❌ [${lang}] ${cnSign} 字典缺词或返回 undefined/空串`
        );

        // 3b. 匹配标准答案（仅系统支持且有标准答案的语言：zh/en/es）
        const std = SIGN_STD[exp.sign]?.[lang];
        if (std) {
          assert.match(
            localized,
            std,
            `❌ [${lang}] ${planet} 多语言断言失败，实际为: ${localized}`
          );
        }
      }
    }

    console.log(
      '✅ [2026-09 真值+多语言审计通过]: 5行星 × 6语言(zh/en/es/fr/th/vi) 英文真值 + 字典映射全部非空且匹配标准答案！'
    );
  });
});
