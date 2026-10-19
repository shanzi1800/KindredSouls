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
    // V491: 新增 4 个错误文案 key（errInvalidCoordinates/errInvalidTimezone/errInvalidBirthTime/errTimezoneAdjusted）
    // 46 → 50，键集合全等校验（p.ok）不变，仍是主防线
    // 🛍️ E24⑥②（2026-10-07）: 新增 1 个算力护栏文案 key（wealthReport.dailyRateLimitExceeded）
    // 50 → 51（6 语种同步新增，键集合全等不变）
    // 🐾 E34-B5（2026-10-09）: 新增 familiar.* 命名空间 16 个 key（灵宠选择器六语文案）
    // 51 → 67（6 语种同步新增，键集合全等不变）
    // 🛡️ P0（2026-10-14）: 新增 wealthReport.locked* 7 个 key（周期锁体面锁定卡六语文案）
    // 67 → 74（6 语种同步新增，键集合全等不变）
    // 🐾 E34-D5（2026-10-14）: 新增灵宠首页座位卡 29 个 key（familiar.home* 19 ＋ axis* 5 ＋ whisper* 5）
    // 74 → 103（6 语种同步新增，键集合全等不变）
    // 103 → 104（E48 主公亲令 2026-10-14: familiar.needUnlock 未付费拦截 Toast，6 语种同步）
    // 104 → 105（E52 主公亲令 2026-10-15: familiar.leadHomeShe/He 性别化带路两键入列、leadHome 退役，6 语种同步）
    // 105 → 81（E53-1 主公亲令 2026-10-15: 首页净化白名单 —— familiar 首页认领表单/折叠条/
    //   座位卡/换一位伙伴 24 个死键退役（home* 19 ＋ axis* 5），6 语种同步删除）
    // 81 → 87（E54-2 主公亲令 2026-10-15: 今日运势内容**灵魂融合**进灵宠交互池 ——
    //   familiar.luckLead/luckNum/luckColor/luckFlower/luckDir/luckSeed 6 键入列，6 语种同步）
    // 87 → 93（E59 主公雷霆军令 2026-10-16: 商业阶梯漏斗门禁 —— 权益严格按 SKU 解耦，
    //   月光/年报**专属升阶付费墙**六语入列：wealthReport.upgradeTitle / upgradeMonthlyDesc /
    //   upgradeYearlyDesc / upgradeCta / sandboxPayMonthly / sandboxPayYearly 6 键，6 语种同步）
    // 93 → 94（E59b 主公亲令 2026-10-17: 年报生成静默期体感治理 —— 骨架期状态行
    //   wealthReport.generatingHint 1 键入列，6 语种同步）
    // 94 → 110（E66 主公军令 2026-10-18: 灵魂兽对话抽屉舱 —— familiar.chat* 16 键入列
    //   （chatCta/chatStatus/chatHello/chatHelloPlain/chatClose/chatPlaceholder/chatSend/
    //   chatThinking/chatMicSoon/chatNetErr/chatNeedLogin/chatNeedUnlock/chatTooFast/
    //   chatQ1/chatQ2/chatQ3），6 语种同步新增，键集合全等不变）
    // 110 → 109（E75 主公亲令 2026-10-19: 三份报告骨架期「推演中」状态行退役 ——
    //   wealthReport.generatingHint 1 键六语同步删除，loadingHint 调用点三处同删，键集合全等不变）
    assert.strictEqual(p.total, 109, 'E75 骨架期推演提示退役后基准键数应为 109');
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
