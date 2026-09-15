// V448 回归门：i18n Key 门禁
//
// 保护的失效模式：i18next 找不到 key 时**返回 key 字面量**（不是空串），
// 于是 `t('missing.key') || '兜底'` 永远不触发兜底，直接把 key 名渲染上屏。
//
// 历史战绩（本门的判据可捕获）：
//   ① `wealthReport.loading` —— 真实路径是 `wealth.loading`，build 前 dry-run 拦下
//   ② `wealthReport.alreadyGeneratedYearlyEn` —— 该 key 从不存在，非中文用户年报配额报错时上屏
import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  checkI18nKeys,
  checkKeySetParity,
  hasKey,
  loadLocales,
  collectUsedKeys,
  keyPaths,
  LANGS,
} from '../web/scripts/check-i18n-keys.mjs';

describe('V448 i18n Key 门禁', () => {
  test('① 代码静态引用的 key 在 6 语种全部存在（零回退）', () => {
    const r = checkI18nKeys();
    if (!r.ok) {
      const lines = r.missing.map((m) => `[${m.lang}] ${m.key} <- ${m.ref}`).join('\n');
      assert.fail(`发现 ${r.missing.length} 处 i18n 缺口（会渲染 key 字面量）:\n${lines}`);
    }
    assert.ok(r.keyCount > 0, '扫描到的 key 数应大于 0（否则说明扫描规则失效）');
  });

  test('② 门禁判据自证：能识别历史两个 bug key', () => {
    const L = loadLocales();
    // 正确路径必须存在
    assert.strictEqual(hasKey(L.zh, 'wealth.loading'), true, 'wealth.loading 应存在');
    assert.strictEqual(
      hasKey(L.zh, 'wealthReport.alreadyGeneratedYearly'),
      true,
      'wealthReport.alreadyGeneratedYearly 应存在'
    );
    // 历史误用路径必须判为不存在（否则门禁形同虚设）
    assert.strictEqual(
      hasKey(L.zh, 'wealthReport.loading'),
      false,
      'wealthReport.loading 不存在 —— 这正是上轮差点上屏的路径'
    );
    assert.strictEqual(
      hasKey(L.zh, 'wealthReport.alreadyGeneratedYearlyEn'),
      false,
      'alreadyGeneratedYearlyEn 不存在 —— 这正是非中文用户的死键'
    );
  });

  test('③ 扫描规则不误伤：自带局部 t() 的文件必须被排除', () => {
    const used = collectUsedKeys();
    const keys = [...used.keys()];
    // PolicyPage 用自带内联多语字典（含 section1Title 等），不走 i18n
    for (const k of keys) {
      assert.ok(
        !/^section[1-9]/.test(k),
        `PolicyPage 的局部 t() key「${k}」不应被纳入 i18n 扫描（假阳性）`
      );
    }
    // 真 i18n 调用点必须被抓到
    assert.ok(used.has('wealth.loading'), 'wealth.loading 应被扫描到');
  });

  test('④ 6 语种 JSON 均可解析且语种齐备', () => {
    const L = loadLocales();
    assert.deepStrictEqual(Object.keys(L).sort(), [...LANGS].sort());
  });

  test('⑤ 第二道防线：6 语种键集合绝对全等（死键已清）', () => {
    const p = checkKeySetParity();
    if (!p.ok) {
      const lines = p.mismatches
        .map((m) => `[${m.lang}] 缺 ${m.missing.join(', ') || '-'} | 多 ${m.extra.join(', ') || '-'}`)
        .join('\n');
      assert.fail(`键集合不对称（非中英用户会看到回退/空串）:\n${lines}`);
    }
    assert.strictEqual(p.total, 46, '清理死键后基准键数应为 46');
  });

  test('⑥ 死键已彻底清除（防回流）', () => {
    const L = loadLocales();
    const dead = [
      'app.tagline',
      'nav.language',
      'nav.settings',
      'wealth.title',
      'wealth.subtitle',
      'wealth.cta',
      'wealth.reportTitle',
      'wealth.paywallTitle',
      'wealth.priceMonthly',
      'wealth.priceYearly',
      'wealth.unlock',
      'wealth.inputLabel',
      'wealthInput.birthdayPh',
      'wealthReport.yearlyReportTitle',
      'result.title',
      'result.score',
      'result.engines.aiInsight',
      'input.placeholder1',
      'input.placeholder2',
      'input.legalFooter',
      'input.termsOfService',
      'input.privacyPolicy',
    ];
    for (const l of LANGS) {
      const paths = new Set(keyPaths(L[l]));
      for (const k of dead) {
        assert.ok(!paths.has(k), `${l}.json 不应再含死键 ${k}`);
      }
      // th 曾有的根层错位副本
      assert.ok(!paths.has('challengingAspects'), `${l}.json 不应含根层错位键 challengingAspects`);
      assert.ok(!paths.has('luckyAspects'), `${l}.json 不应含根层错位键 luckyAspects`);
      // 正确路径必须保留
      assert.ok(paths.has('result.challengingAspects'), `${l}.json 应保留 result.challengingAspects`);
      assert.ok(paths.has('result.luckyAspects'), `${l}.json 应保留 result.luckyAspects`);
    }
  });
});
