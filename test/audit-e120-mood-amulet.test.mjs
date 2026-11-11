/**
 * audit-e120-mood-amulet.test.mjs —— E120 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E120-AMULET：灵宠五维情绪天象罗盘与 1:1.618 破冰密函 Canvas 渲染引擎】
 * 五组核心断言（军令钦定）＋链位自保（S6）：
 *   E120-01 五维情绪天象归因与正面行动闭环（语调铁律守备——正向行动词命中
 *          ＋违规词全语零命中）；
 *   E120-02 Canvas 宽高比绝对黄金比例 1:1.618（1080×1748 像素锁死，容差 <0.001）；
 *   E120-03 权威域名 kindredsouls.online 与防伪哈希 KS-AMULET- 前缀装配
 *          （Mock Canvas Context 语义断言——零图形环境依赖）；
 *   E120-04 僵局意图命中与密函自动代写触发器识别（正例/负例/fail-closed 三面）
 *          ＋24 套六语模板完整性；
 *   E120-05 单日打卡原子写入与灵犀星账本 DAILY_PULSE +1 校验（同日幂等）。
 *   S6 链位自保：e120 入编（e118 后、e40-compat 前；全链 91→92 段；
 *      i18n 零新键）＋前端接线（App.tsx DEV 守卫路由/FamiliarHomeCard 罗盘挂载/
 *      Playground 战报行）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）；
 *    渲染器 node 桩降级（无 DOM ⇒ drawImage no-op，fillText 语义不受影响）。
 * 执行命令：node --test test/audit-e120-mood-amulet.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/* ── 模块加载（pathToFileURL：中文仓路径铁律）────────────────────────── */
const MODD = await import(pathToFileURL(join(ROOT, 'web/src/lib/companionMoodData.mjs')).href);
const TPL = await import(pathToFileURL(join(ROOT, 'web/src/lib/amuletTemplates.mjs')).href);
const REN = await import(pathToFileURL(join(ROOT, 'web/src/lib/amuletCanvasRenderer.mjs')).href);
const SCR = await import(pathToFileURL(join(ROOT, 'web/src/lib/companionScribeTrigger.mjs')).href);
const LED = await import(pathToFileURL(join(ROOT, 'web/src/lib/starlightLedger.mjs')).href);
const POU = await import(pathToFileURL(join(ROOT, 'web/src/lib/dailyPouchStore.mjs')).href);
// 🏆 E123-12：情绪记忆贯通核＋星语灵犀实体卡导出器
const MOO = await import(pathToFileURL(join(ROOT, 'web/src/lib/companionMoodGreetings.mjs')).href);
const SWE = await import(pathToFileURL(join(ROOT, 'web/src/lib/starWhisperCardExport.mjs')).href);

/** Mock Canvas Context（军师钦定语义断言方案——零图形环境依赖） */
function mockCanvas() {
  const calls = { fillText: [], drawImage: 0 };
  const ctx = {
    fillText: (text) => { calls.fillText.push(String(text)); },
    drawImage: () => { calls.drawImage += 1; },
    measureText: (t) => ({ width: Math.min(String(t).length * 20, 700) }),
    fillRect: () => {}, strokeRect: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
    stroke: () => {}, fill: () => {}, arc: () => {}, closePath: () => {},
    save: () => {}, restore: () => {}, setTransform: () => {},
  };
  return { width: 0, height: 0, getContext: () => ctx, calls };
}

/* ═══════════ E120-01：五维情绪与语调铁律 ═══════════ */
test('E120-01 五维情绪天象归因与正面行动闭环（语调铁律守备）', () => {
  // ① 五维徽章齐备（五行元素全覆盖＋六语标签全在）
  assert.equal(MODD.MOOD_ARCHETYPES.length, 5, '五维情绪徽章须恰好 5 枚');
  const elements = new Set(MODD.MOOD_ARCHETYPES.map((m) => m.element));
  for (const el of ['fire', 'water', 'metal', 'wood', 'earth']) {
    assert.ok(elements.has(el), `五行元素缺 ${el}`);
  }
  for (const m of MODD.MOOD_ARCHETYPES) {
    for (const l of LANGS) {
      assert.ok(String(m.label[l] || '').trim(), `${m.archetype} ${l} 标签缺失`);
      assert.ok(String(m.description[l] || '').trim(), `${m.archetype} ${l} 描述缺失`);
    }
  }
  // ② zh 抚慰文本：正向行动词命中（喝水/散步/发消息/早睡级粒度）＋违规词零命中
  for (const arch of ['radiant', 'longing', 'melancholy', 'agitated', 'grateful']) {
    const row = MODD.MOOD_ATTRIBUTIONS[arch];
    assert.ok(row, `情绪归因缺 ${arch}`);
    for (const l of LANGS) {
      const a = row[l];
      assert.ok(a && a.companionComfort && a.actionableAdvice, `${arch} ${l} 归因字段缺失`);
      // 违规词全语扫面（铁律③——恐慌话术零容忍）
      for (const banned of MODD.BANNED_PANIC_WORDS) {
        assert.ok(!a.companionComfort.includes(banned), `${arch} ${l} 抚慰含违规词「${banned}」`);
        assert.ok(!a.actionableAdvice.includes(banned), `${arch} ${l} 行动建议含违规词「${banned}」`);
      }
    }
    // zh 正向行动闭环（军令断言 1 正例面）
    const guardZh = MODD.toneGuard(row.zh.companionComfort, 'zh');
    assert.equal(guardZh.bannedHit, null, `${arch} zh 违规词须零命中`);
    assert.ok(guardZh.actionWord, `${arch} zh 抚慰缺正向行动词（语调铁律②）`);
    assert.equal(guardZh.positive, true, `${arch} zh toneGuard 须过闸`);
  }
  // ③ toneGuard 恐慌话术拦截（负例面——守卫必须真拦）
  assert.ok(MODD.toneGuard('你们八字相克，会有冲突', 'zh').bannedHit === '相克', 'toneGuard 未拦截「相克」恐慌话术');
  assert.equal(MODD.toneGuard('你们八字相克', 'zh').positive, false, '恐慌话术必须不过闸');
  // ④ moodAttribution fail-closed（未知输入返回 null）
  assert.equal(MODD.moodAttribution('nonexistent', 'zh'), null, '未知情绪必须 fail-closed');
  console.log('  [PASS] E120-01: 五维情绪天象归因与正面行动闭环（语调铁律守备）');
});

/* ═══════════ E120-02：Canvas 绝对黄金比例 ═══════════ */
test('E120-02 Canvas 宽高比绝对黄金比例 1:1.618（1080×1748 像素锁死）', async () => {
  assert.equal(REN.AMULET_DIMENSIONS.width, 1080, '画布宽须锁死 1080');
  assert.equal(REN.AMULET_DIMENSIONS.height, 1748, '画布高须锁死 1748');
  assert.ok(Math.abs(1748 / 1080 - 1.618) < REN.GOLDEN_RATIO_TOLERANCE, '黄金比例容差越界（须 <0.001）');
  // 渲染器执行后画布尺寸断言（mock 桩——语义层验证）
  const canvas = mockCanvas();
  const tpl = TPL.getAmuletTemplate('apology', 'zh');
  await REN.renderAmuletToCanvas(canvas, tpl, 'zh', { type: 'apology' });
  assert.equal(canvas.width, 1080, '渲染后画布宽须为 1080');
  assert.equal(canvas.height, 1748, '渲染后画布高须为 1748');
  assert.ok(REN.isGoldenRatioCanvas(canvas), 'isGoldenRatioCanvas 须判定通过');
  assert.equal(REN.isGoldenRatioCanvas({ width: 1080, height: 1747 }), false, '非军令尺寸必须不过闸');
  // 六语排版参数表（军令钦定真值——泰文行高 1.8 / 越文 topPadding +8）
  assert.equal(REN.LOCALE_CANVAS_CONFIG.th.lineHeight, 1.8, '泰文行高须为 1.8（防调号被切）');
  assert.equal(REN.LOCALE_CANVAS_CONFIG.th.topPaddingOffset, -10, '泰文 topPaddingOffset 军令真值漂移');
  assert.equal(REN.LOCALE_CANVAS_CONFIG.vi.topPaddingOffset, 8, '越文顶部内边距须 +8px（声调堆叠容差）');
  assert.equal(REN.LOCALE_CANVAS_CONFIG.zh.proseFontSize, 42, 'zh 正文字号军令真值漂移');
  assert.equal(REN.LOCALE_CANVAS_CONFIG.vi.proseFontSize, 35, 'vi 正文字号军令真值漂移');
  console.log('  [PASS] E120-02: Canvas 宽高比绝对黄金比例 1:1.618（1080×1748 像素锁死）');
});

/* ═══════════ E120-03：防伪水印与域名绝对装配 ═══════════ */
test('E120-03 权威域名 kindredsouls.online 与防伪哈希 KS-AMULET- 前缀装配', async () => {
  assert.equal(REN.AMULET_OFFICIAL_DOMAIN, 'kindredsouls.online', '官方域名锁死（严禁改写）');
  const canvas = mockCanvas();
  const tpl = TPL.getAmuletTemplate('longing', 'th');
  await REN.renderAmuletToCanvas(canvas, tpl, 'th', { type: 'longing', hostName: 'Jiangshan' });
  const texts = canvas.calls.fillText;
  // ① 域名水印居中压印
  assert.ok(texts.some((s) => s.includes('kindredsouls.online')), '防伪域名 kindredsouls.online 未装配');
  // ② 防伪哈希前缀 KS-AMULET-（右下等宽章）
  const stamp = texts.find((s) => s.startsWith('KS-AMULET-'));
  assert.ok(stamp, '防伪哈希 KS-AMULET- 前缀未装配');
  assert.ok(stamp.includes('LNG') && stamp.includes('TH'), `防伪章须含类型与语种（实得 ${stamp}）`);
  // ③ 章合成纯函数（军令格式 KS-AMULET-{TYP}-{LOCALE}）
  assert.equal(REN.composeAmuletStamp('apology', 'th'), 'KS-AMULET-APL-TH', '道歉密函泰文版章式漂移');
  assert.equal(REN.composeAmuletStamp('support', 'vi'), 'KS-AMULET-PWR-VI', '鼓励密函越文版章式漂移');
  assert.equal(REN.composeAmuletStamp('weather', 'zh'), 'KS-AMULET-WTH-ZH', '天气密函中文版章式漂移');
  // ④ 版面 Y 轴军令锚（吉时 1540 / 分隔 1640 / 域名 1680）
  assert.equal(REN.AMULET_LAYOUT_ANCHORS.windowPlateY, 1540, '吉时标牌 Y 轴军令锚漂移');
  assert.equal(REN.AMULET_LAYOUT_ANCHORS.separatorY, 1640, '分隔线 Y 轴军令锚漂移');
  assert.equal(REN.AMULET_LAYOUT_ANCHORS.domainY, 1682, '域名水印 Y 轴军令锚漂移');
  // ⑤ 模板文案真绘上卡（泰文正文/灵宠密语上卡）
  assert.ok(texts.some((s) => s.includes('คิดถึง') || s.includes('ดวงดาว')), '泰文模板文案未上卡');
  console.log('  [PASS] E120-03: 权威域名 kindredsouls.online 与防伪哈希印戳装配');
});

/* ═══════════ E120-04：意图识别与 24 套模板完整性 ═══════════ */
test('E120-04 僵局意图命中与密函自动代写触发器识别', () => {
  // ① 军令正例（三例钦定）
  const a = SCR.detectScribeIntent('我们吵架了不知怎么开口');
  assert.ok(a && a.type === 'apology', '「吵架…不知怎么开口」须命中 apology');
  const b = SCR.detectScribeIntent('今天很想他');
  assert.ok(b && b.type === 'longing', '「今天很想他」须命中 longing');
  // ② 军令负例（fail-closed——非僵局语料严禁强推密函）
  assert.equal(SCR.detectScribeIntent('今天天气不错'), null, '「今天天气不错」必须返回 null（严禁误触）');
  assert.equal(SCR.detectScribeIntent(''), null, '空文本必须返回 null');
  assert.equal(SCR.detectScribeIntent(null), null, 'null 输入必须返回 null');
  // ③ 全关键词映射覆盖
  for (const kw of ['吵架', '冷战', '不理我', '道歉', '尴尬']) {
    assert.equal(SCR.detectScribeIntent(`我们${kw}了`).type, 'apology', `「${kw}」须映射 apology`);
  }
  for (const kw of ['想他', '想她']) {
    assert.equal(SCR.detectScribeIntent(`好${kw}`).type, 'longing', `「${kw}」须映射 longing`);
  }
  // ④ 代写推荐气泡句式（军令钦定句式锚）
  const line = SCR.scribeSuggestionLine(SCR.AMULET_DISPLAY_NAMES.apology.zh);
  assert.ok(line.includes('解冻道歉密函') && line.includes('Sophia'), '推荐气泡句式须含密函名与灵宠名');
  // ⑤ 24 套六语模板完整性（4 类 × 6 语全字段非空）
  assert.equal(TPL.listAmuletTemplateKeys().length, 24, '模板键须恰好 24 套');
  for (const type of TPL.AMULET_TYPES) {
    for (const locale of TPL.AMULET_LOCALES) {
      const tpl = TPL.getAmuletTemplate(type, locale);
      assert.ok(tpl, `${type}/${locale} 模板缺失`);
      for (const f of ['title', 'subtitle', 'prose', 'companionWhisper', 'bestWindowPrefix', 'tarotCard', 'tarotNumber', 'defaultTiming']) {
        assert.ok(String(tpl[f] || '').trim(), `${type}/${locale} 字段 ${f} 空缺`);
      }
    }
  }
  // ⑥ 塔罗图腾 cardId 军令锚（恋人 6 / 节制 14 / 星星 17 / 太阳 19）
  assert.equal(TPL.AMULET_CARD_ID.apology, 14, '道歉密函须配节制 NO.14');
  assert.equal(TPL.AMULET_CARD_ID.longing, 17, '想念密函须配星星 NO.17');
  assert.equal(TPL.AMULET_CARD_ID.support, 19, '鼓励密函须配太阳 NO.19');
  assert.equal(TPL.AMULET_CARD_ID.weather, 6, '天气密函须配恋人 NO.06');
  // ⑦ 模板取值 fail-closed
  assert.equal(TPL.getAmuletTemplate('unknown', 'zh'), null, '未知类型必须 fail-closed');
  console.log('  [PASS] E120-04: 僵局意图命中与密函自动代写触发器识别');
});

/* ═══════════ E120-05：灵犀星原子入账 ═══════════ */
test('E120-05 单日打卡原子写入与灵犀星账本 DAILY_PULSE +1 校验', () => {
  // ① 首次打卡：DAILY_PULSE 交易＋余额 +1
  const today = '2026-11-03';
  const r1 = LED.claimDailyStarlight({ count: 3, day: '2026-11-02' }, today);
  assert.equal(r1.granted, true, '跨日首记须放行');
  assert.ok(r1.transaction, '须产生 DAILY_PULSE 交易');
  assert.equal(r1.transaction.type, 'DAILY_PULSE', '交易类型须为 DAILY_PULSE');
  assert.equal(r1.transaction.delta, 1, '交易增量须为 +1');
  assert.equal(r1.transaction.balance, 4, '余额须 3→4');
  assert.equal(r1.ledger.day, today, '账本日期须翻新');
  // ② 同日复记：幂等拒绝（原子性——不重复 +1、不产生交易）
  const r2 = LED.claimDailyStarlight(r1.ledger, today);
  assert.equal(r2.granted, false, '同日复记必须拒绝');
  assert.equal(r2.transaction, null, '同日复记不得产生交易');
  assert.equal(r2.ledger.count, 4, '同日复记不得加星');
  // ③ 坏档视零档重建（fail-soft）
  const r3 = LED.claimDailyStarlight(null, today);
  assert.equal(r3.transaction.balance, 1, '零档重建首记须为 1');
  const r4 = LED.claimDailyStarlight({ count: -5, day: 42 }, today);
  assert.ok(r4.granted === true && r4.transaction.balance === 1, '坏档须视零档重建');
  // ④ 存储键真源沿用（E111 白名单键）
  assert.equal(LED.STARLIGHT_STORAGE_KEY, 'ks_starlight_count', '灵犀星存储键须沿用 E111 真源');
  console.log('  [PASS] E120-05: 单日打卡原子写入与灵犀星账本 +1 校验');
});

/* ═══════════ E120-06（CHAIN 刀一断言）：前置拦截与流转 ═══════════ */
test('E120-06 今日锦囊前置拦截与流转（未打卡优先唤罗盘；未选情绪结果层不得渲染）', () => {
  // ① 未打卡 ⇒ MOOD_SELECTING（唤罗盘——军令断言 6 正例）
  assert.equal(POU.resolvePouchEntry(null), 'MOOD_SELECTING', '未打卡必须唤起情绪罗盘');
  assert.equal(POU.resolvePouchEntry(null), POU.POUCH_STEPS.MOOD_SELECTING, '未打卡流转字面量漂移');
  // ② 坏档/跨日档视未打卡（fail-soft 重建）
  const badStore = { __data: { [POU.pouchStorageKey('SIG', '20261103')]: '{"mood":"hacked","date":"20261103"}' } };
  badStore.getItem = (k) => (k in badStore.__data ? badStore.__data[k] : null);
  badStore.setItem = (k, v) => { badStore.__data[k] = v; };
  assert.equal(POU.readFusedPouch(badStore, 'SIG', '20261103'), null, '坏档必须视未打卡（形状守卫 fail-soft）');
  assert.equal(POU.resolvePouchEntry(POU.readFusedPouch(badStore, 'SIG', '20261103')), 'MOOD_SELECTING', '坏档流转须回罗盘');
  // ③ 源码结构断言：controller 仅 MOOD_SELECTING 渲罗盘、仅 REVEALED 渲结果层
  //    （未选情绪前锦囊结果层不得渲染——军令断言 6 铁律）
  //    🏆 E122：分支前缀升为 `{open && step === …`（body portal/Toast 宿主重构后锚点同步）
  const controller = read('web/src/components/companion/DailyPouchController.tsx');
  assert.ok(controller.includes('step === POUCH_STEPS.MOOD_SELECTING') && controller.includes('<MoodCompassModal'), '缺 MOOD_SELECTING⇒罗盘分支');
  assert.ok(controller.includes('step === POUCH_STEPS.REVEALED') && controller.includes('<CombinedPouchModal'), '缺 REVEALED⇒合璧笺分支');
  const moodBranch = controller.split('{open && step === POUCH_STEPS.MOOD_SELECTING && (')[1]?.split('{/* 第二阶段')[0] || '';
  assert.ok(moodBranch.includes('MoodCompassModal') && !moodBranch.includes('CombinedPouchModal'), '罗盘阶段严禁渲染结果层（未选情绪不得见笺）');
  // ④ 首页唯一入口：严禁并列独立情绪气泡（mood-compass-open 微章物理拔除）
  const homeCard = read('web/src/components/FamiliarHomeCard.tsx');
  assert.ok(!homeCard.includes('mood-compass-open'), '首页残留独立罗盘微章（军令严禁并列情绪气泡）');
  assert.ok(homeCard.includes('pouch-open'), '缺今日感应锦囊入口按钮（pouch-open 唯一锦囊入口）');
  console.log('  [PASS] E120-06: 前置拦截与流转（未打卡优先唤罗盘；结果层不得抢跑）');
});

/* ═══════════ E120-07（CHAIN 刀二断言）：合璧数据完整性 ═══════════ */
test('E120-07 合璧数据完整性（transitAttribution 与 luckyAttributes 同对象在位）', () => {
  const attr = MODD.moodAttribution('melancholy', 'zh');
  assert.ok(attr, 'melancholy zh 归因缺失（上游真源断链）');
  const combined = POU.composeCombinedFortune({
    mood: 'melancholy', attribution: attr, lang: 'zh', sunSign: 'leo', dateKey: '20261103',
  });
  // ① 军令断言 7 双字段同对象：companionComfort 与 colorHex 必须同时在位
  assert.ok(combined, '合璧组装 fail-closed（合法输入必须成笺）');
  assert.ok(combined.transitAttribution.companionComfort.length > 0, '合璧笺缺 transitAttribution.companionComfort');
  assert.ok(/^#[0-9A-Fa-f]{6}$/.test(combined.luckyAttributes.colorHex), `合璧笺 luckyAttributes.colorHex 非法（实得 ${combined.luckyAttributes.colorHex}）`);
  for (const f of ['colorName', 'bestWindow', 'direction']) {
    assert.ok(String(combined.luckyAttributes[f] || '').trim(), `合璧笺 luckyAttributes.${f} 空缺`);
  }
  assert.ok(/\d{2}:\d{2} - \d{2}:\d{2}/.test(combined.luckyAttributes.bestWindow), '助运吉时须为 HH:MM - HH:MM 确定性窗');
  // ② 确定性：同输入 ⇒ 同输出（禁随机抖动）
  const again = POU.composeCombinedFortune({
    mood: 'melancholy', attribution: attr, lang: 'zh', sunSign: 'leo', dateKey: '20261103',
  });
  assert.equal(again.luckyAttributes.colorHex, combined.luckyAttributes.colorHex, '幸运色须确定性（同日恒定）');
  // ③ fail-closed：mood 非白名单/归因缺失 ⇒ null（严禁默认回退）
  assert.equal(POU.composeCombinedFortune({ mood: 'unknown', attribution: attr, lang: 'zh' }), null, '未知情绪必须 fail-closed');
  assert.equal(POU.composeCombinedFortune({ mood: 'radiant', attribution: null, lang: 'zh' }), null, '归因缺失必须 fail-closed');
  // ④ 持久化往返（军令键格式 ks_daily_fused_pouch_${chartSig}_${YYYYMMDD}）
  const store = { __data: {} };
  store.getItem = (k) => (k in store.__data ? store.__data[k] : null);
  store.setItem = (k, v) => { store.__data[k] = v; };
  assert.ok(POU.writeFusedPouch(store, 'SIG', combined), '合璧档落盘失败');
  assert.ok(POU.pouchStorageKey('SIG', '20261103') in store.__data, `存储键须为军令格式（实得 ${Object.keys(store.__data)[0]}）`);
  assert.ok(Object.keys(store.__data)[0].startsWith('ks_daily_fused_pouch_SIG_20261103'), '军令键前缀/签名/日期三段漂移');
  const reread = POU.readFusedPouch(store, 'SIG', '20261103');
  assert.ok(reread && reread.mood === 'melancholy' && reread.transitAttribution.companionComfort === combined.transitAttribution.companionComfort, '落盘往返失真（读档≠写档）');
  // ⑤ 无盘纯首页会话兜底（E49 按盘隔离沿袭——空 sig 回落 home）
  assert.equal(POU.normalizePouchSig(''), 'home', '空 chartSig 须回落 home 桶');
  assert.ok(POU.pouchStorageKey('', '20261103').startsWith('ks_daily_fused_pouch_home_'), 'home 兜底键漂移');
  console.log('  [PASS] E120-07: 合璧数据完整性（companionComfort 与 colorHex 同对象）');
});

/* ═══════════ E120-08（CHAIN 刀三断言）：跨次点击幂等只读 ═══════════ */
test('E120-08 跨次点击幂等只读（已打卡直入 REVEALED 不唤罗盘；账本交易数不增）', () => {
  // ① 已打卡当日档在位 ⇒ 直入 REVEALED（跳过情绪选择不唤罗盘——军令断言 8）
  const attr = MODD.moodAttribution('radiant', 'zh');
  const combined = POU.composeCombinedFortune({ mood: 'radiant', attribution: attr, lang: 'zh', sunSign: 'virgo', dateKey: '20261103' });
  assert.ok(combined, '合璧笺组装失败（前置断链）');
  const store = { __data: {} };
  store.getItem = (k) => (k in store.__data ? store.__data[k] : null);
  store.setItem = (k, v) => { store.__data[k] = v; };
  POU.writeFusedPouch(store, 'SIG', combined);
  const existing = POU.readFusedPouch(store, 'SIG', '20261103');
  assert.equal(POU.resolvePouchEntry(existing), 'REVEALED', '已打卡必须直入 REVEALED（不唤罗盘）');
  // ② 幂等只读：同档跨日残留 ⇒ 不串昨日心境（视未打卡）
  assert.equal(POU.readFusedPouch(store, 'SIG', '20261104'), null, '跨日档必须失效（昨日心境不得串味）');
  // ③ 账本交易数不增（E111 真源账本幂等——同日复记零交易）
  const today = '2026-11-03';
  const r1 = LED.claimDailyStarlight({ count: 9, day: '2026-11-02' }, today);
  assert.equal(r1.transaction.balance, 10, '首次揭示须 +1（3→10 错例防呆：9→10）');
  const r2 = LED.claimDailyStarlight(r1.ledger, today);
  assert.equal(r2.granted, false, '同日复看必须拒绝发星');
  assert.equal(r2.ledger.count, 10, '账本交易数不得增加');
  // ④ 源码断言：controller 入账仅存在于 handleMoodCommit 路径（open 解析分支零入账）
  const controller = read('web/src/components/companion/DailyPouchController.tsx');
  const openBranch = controller.split('useEffect(() => {')[1]?.split('}, [open, chartSig]);')[0] || '';
  assert.ok(!openBranch.includes('onClaimStarlight('), '入口解析分支严禁触发入账（只读复看零交易）');
  const commitBranch = controller.split('const handleMoodCommit =')[1]?.split('}, [lang')[0] || '';
  assert.ok(commitBranch.includes('onClaimStarlight('), '合笺揭示路径缺唯一入账点（onClaimStarlight）');
  // ⑤ 首页唯一入账回调接线（E111 真源账本——同日判定原文在位）
  const homeCard = read('web/src/components/FamiliarHomeCard.tsx');
  assert.ok(homeCard.includes('claimPouchStarlight'), '首页缺 claimPouchStarlight 入账回调（E111 真源断链）');
  assert.ok(/st\.day !== today/.test(homeCard) && /count: st\.count \+ 1/.test(homeCard), 'E111 同日判定/+1 逻辑漂移（断言原文保真铁律）');
  console.log('  [PASS] E120-08: 跨次点击幂等只读（直入 REVEALED；账本交易数不增）');
});

/* ═══════════ S6：链位自保与前端接线 ═══════════ */
test('E120 S6 链位自保：e120 入编（e118 后、e40-compat 前；全链 91→92 段；i18n 零新键）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i120 = segs.findIndex((x) => x.includes('audit-e120-mood-amulet'));
  const i118 = segs.findIndex((x) => x.includes('audit-e118-user-name-memory'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((x) => x.trim().startsWith('python3'));
  assert.notEqual(i120, -1, 'E120 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i118 < i120 && i120 < iCap, 'E120 须按序排在 e118 之后、收口位之前（E 版本序铁律）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
  assert.equal(segs.length, 102, `军规链段数须为 92（E120 入编后 91→92；实为 ${segs.length}）`);
  // i18n 零新键（familiar 段 59 键＋全站 123 基准不变）
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.equal(Object.keys(o.familiar).length, 59, `${l} familiar 段须 59 键（E120 零新键——自容六语字典）`);
  }
  const i18nGate = read('test/audit-i18n-keys.test.js');
  assert.ok(i18nGate.includes('assert.strictEqual(p.total, 123'), 'V448 全站键数基准 123 须保持（E120 零新键）');
  // 前端接线四面：DEV 守卫路由 / 锦囊前置罗盘控制器 / Playground 战报行 /
  //    E120-CHAIN 入口收拢（罗盘微章拔除，唯一锦囊入口 pouch-open）
  const app = read('web/src/App.tsx');
  assert.ok(app.includes("import.meta.env.DEV"), 'App.tsx 缺 import.meta.env.DEV 环境守卫');
  assert.ok(app.includes('/dev/amulet-preview'), 'App.tsx 缺 /dev/amulet-preview 开发路由');
  const homeCard = read('web/src/components/FamiliarHomeCard.tsx');
  assert.ok(homeCard.includes('DailyPouchController'), '首页灵宠视窗未挂载 DailyPouchController（E120-CHAIN 前置罗盘）');
  assert.ok(homeCard.includes('pouch-open'), '缺今日感应锦囊入口按钮（pouch-open）');
  assert.ok(!homeCard.includes('mood-compass-open'), '首页残留独立罗盘微章（军令严禁并列情绪气泡）');
  const controller = read('web/src/components/companion/DailyPouchController.tsx');
  assert.ok(controller.includes('MoodCompassModal') && controller.includes('CombinedPouchModal'), '控制器缺罗盘/合璧笺双模态组件');
  assert.ok(read('web/src/components/companion/CombinedPouchModal.tsx').length > 0, '合璧笺弹层组件缺失（E120-CHAIN 刀二）');
  const typesChain = read('web/src/types/companionEmotion.ts');
  assert.ok(typesChain.includes('DailyPouchStep') && typesChain.includes('CombinedDailyFortune'), 'CHAIN 契约类型缺失（刀一状态机/合璧笺契约）');
  const pouchStore = read('web/src/lib/dailyPouchStore.mjs');
  assert.ok(pouchStore.includes('ks_daily_fused_pouch'), '合璧档存储键前缀漂移（军令钦定 ks_daily_fused_pouch）');
  const playground = read('web/src/pages/dev/AmuletPlayground.tsx');
  assert.ok(playground.includes('[AmuletPlayground] 24/24 templates rendered successfully'), 'Playground 缺战报确认行');
  assert.ok(!/(import|require)[^;\n]{0,120}(napi-rs|node-canvas)/.test(playground), 'Playground 严禁引入 C++ 原生 Canvas 依赖（import/require 级检测）');
  // 类型契约在位（刀一）
  const types = read('web/src/types/companionEmotion.ts');
  for (const t of ["MoodArchetype", "AmuletType", "AstroMoodAttribution", "IcebreakerAmuletConfig", "MoodOptionConfig"]) {
    assert.ok(types.includes(t), `类型契约缺 ${t}`);
  }
  console.log('  [PASS] E120 S6: 链位自保（92 段；e118 后 e40 前；i18n 零新键；前端三面接线）');
});

/* ═══════════ E121-10（军令 E121-SCRIBE-SLOT 断言 10）：ChatSheet 消费端插槽链路 ═══════════ */test('E121-10 ChatSheet 消费端密函插槽链路（意图命中/寒暄放行/Canvas 大图/接线四防）', async () => {
  // ① 行为级：吵架语料 ⇒ 插槽数据结构严格为 apology（关键词优先级——解冻为第一诉求）
  const hit = SCR.detectScribeIntent('吵架了不知怎么开口');
  assert.ok(hit, '吵架语料须命中代写意图（E121 刀一触发器消费）');
  assert.equal(hit.type, 'apology', '密函插槽类型须严格为 apology（实为 ' + String(hit.type) + '）');
  // ② 行为级：寒暄 fail-closed——严禁无意图强推（打扰红线）
  assert.equal(SCR.detectScribeIntent('你好呀'), null, '寒暄语料密函插槽须为 null（fail-closed）');
  // ③ 桩级：插槽点击 ⇒ Canvas 渲染引擎调用并输出有效 1080×1748 Data URL
  const canvas = mockCanvas();
  canvas.toDataURL = () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg'; // PNG 签名桩
  const tpl = TPL.AMULET_TEMPLATES_24.apology.zh;
  await REN.renderAmuletToCanvas(canvas, tpl, 'zh', { type: 'apology' });
  assert.equal(canvas.width, 1080, '大图渲染宽度须锁 1080（军令刀二）');
  assert.equal(canvas.height, 1748, '大图渲染高度须锁 1748（军令刀二）');
  assert.ok(REN.isGoldenRatioCanvas(canvas), '大图须过黄金比例校验（1:1.618 容差 <0.001）');
  const url = canvas.toDataURL('image/png');
  assert.ok(String(url).startsWith('data:image/png'), '须输出有效 PNG Data URL（实为 ' + String(url).slice(0, 30) + '）');
  // ④ 文本级：ChatSheet 消费端接线四防——触发器调用/插槽渲染/大图弹层/单轮防刷
  const chat = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(chat.includes('detectScribeIntent'), 'ChatSheet 未消费意图探测器（E121 刀一——最后一公里病灶）');
  assert.ok(chat.includes('AmuletScribeSlotCard'), 'ChatSheet 未挂载密函微缩插槽（刀一）');
  assert.ok(chat.includes('AmuletPreviewModal'), 'ChatSheet 未挂载大图预览弹层（刀二）');
  assert.ok(/setScribeSlot\(\s*scribeIntent\s*\?\s*\{\s*aid\b/.test(chat), '插槽未绑定本轮消息 ID（刀三单轮防刷）');
  assert.ok(chat.includes("scribeSlot.aid"), '插槽渲染未做本轮 aid 精确匹配（防重绘重复追加）');
  // ⑤ 插槽组件零 i18n 红线：文案自容字典＋模板真源；禁 t('familiar. 新键
  const slot = read('web/src/components/companion/AmuletScribeSlot.tsx');
  assert.ok(slot.length > 4000, '密函插槽组件缺失或过薄（E121 刀一/刀二载体）');
  assert.ok(slot.includes('AMULET_TEMPLATES_24') || slot.includes('getAmuletTemplate'), '插槽文案未取模板真源（刀二零 i18n）');
  assert.ok(!slot.includes("t('familiar."), '插槽严禁 i18n 新键（familiar 59 键红线）');
  assert.ok(slot.includes('amulet-scribe-slot'), '微缩插槽缺 data-testid（amulet-scribe-slot）');
  assert.ok(slot.includes('amulet-preview-modal'), '大图弹层缺 data-testid（amulet-preview-modal）');
  assert.ok(slot.includes('renderAmuletToCanvas'), '插槽未复用渲染引擎单一事实源（军令刀二）');
  assert.ok(slot.includes('isGoldenRatioCanvas'), '大图渲染后未做黄金比例校验（fail-closed）');
  // ⑥ i18n 键数复验（S6 已锁——S7 复核防 E121 回归）：familiar 59＋全站 123
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.equal(Object.keys(o.familiar).length, 59, `${l} familiar 段须 59 键（E121 零新键）`);
  }
  const i18nGate2 = read('test/audit-i18n-keys.test.js');
  assert.ok(i18nGate2.includes('assert.strictEqual(p.total, 123'), 'V448 全站键数基准 123 须保持（E121 零新键）');
  console.log('  [PASS] E121-10: ChatSheet 消费端插槽链路（触发器/插槽/大图/单轮防刷/零 i18n）');
});

/* ═══════════ E122-11（军令 E122-EXPERIENCE-POLISH 断言 11）：五刀整肃 ═══════════ */
test('E122-11 体验整肃五刀（破冰语料命中/命名解耦/z-index 归正/入袋闭环/prompt 人称与禁词）', () => {
  // ══ 刀五：破冰语义网泛化——军令钦定语料 100% 命中插槽触发链 ══
  const icebreakers = [
    '不知道怎么跟他说第一句话',   // 军令钦定主公实弹语料（DoD 断言原文）
    '不知道怎么开口',
    '不知怎么说第一句话',
    '想找他和好',
    '想找她和好',
    '想发消息又不敢',
    '怎么破冰',
    '怕尴尬',
    '僵持不知道说什么',
  ];
  for (const s of icebreakers) {
    const hit = SCR.detectScribeIntent(s);
    assert.ok(hit, `破冰语料「${s}」必须命中（E122 刀五——严禁被当闲聊吞掉）`);
    assert.equal(hit.type, 'apology', `「${s}」须映射 apology（破冰/和解为第一诉求）`);
  }
  // fail-closed 保真：寒暄语料扩充后仍严禁误触（打扰红线）
  for (const s of ['你好呀', '今天天气不错', '早安，吃了吗']) {
    assert.equal(SCR.detectScribeIntent(s), null, `寒暄语料「${s}」必须返回 null（词典扩充不得误伤）`);
  }
  // ══ 刀二：命名层级解耦——POUCH_UI 军令六语表逐字入典 ══
  const zhUi = POU.POUCH_UI.zh;
  assert.equal(zhUi.openCta, '✦ 今日星象气场', '外层浮窗须为「今日星象气场」（军令六语表 zh 逐字）');
  assert.equal(zhUi.title, '✦ 今日星语灵犀 ✦', '内层弹窗须为「✦ 今日星语灵犀 ✦」');
  assert.equal(zhUi.close, '收入星语袋', '按键初始态须为「收入星语袋」');
  assert.equal(zhUi.stowDone, '✓ 已收入星语袋', '按键成功态须为「✓ 已收入星语袋」');
  assert.equal(zhUi.stowDisabled, '今日已收入星语袋', '置灰态须为「今日已收入星语袋」（E123 军令钦定——✓ 前缀消费端拼接）');
  assert.equal(zhUi.toast, '✦ 今日灵犀已入袋，可随时在个人中心查阅 ✦', '全局 Toast 军令文案逐字');
  // 六语新键全字段非空（含六语弹性排版容器由消费端 overflowWrap 承担）
  for (const l of LANGS) {
    const u = POU.POUCH_UI[l];
    assert.ok(u, `POUCH_UI ${l} 段缺失`);
    for (const k of ['openCta', 'title', 'close', 'stowDone', 'stowDisabled', 'toast', 'pouchLead']) {
      assert.ok(String(u[k] || '').trim(), `POUCH_UI ${l}.${k} 空缺（E122 刀二六语表）`);
    }
  }
  // zh 命名面彻底去「锦囊」（双重套娃根治）
  for (const k of ['openCta', 'title', 'close', 'pouchLead']) {
    assert.ok(!zhUi[k].includes('锦囊'), `zh ${k} 残留「锦囊」字样（命名套娃未根除）`);
  }
  // ══ 刀一：z-index 归正——body portal 逃逸层叠笼＋遮罩加深＋Slogan 锁基底层 ══
  const controller = read('web/src/components/companion/DailyPouchController.tsx');
  assert.ok(controller.includes('createPortal'), '罗盘/合璧笺须 body portal（逃逸 .ks-pet-card z-2 层叠笼——穿透根因）');
  assert.ok(controller.includes('document.body'), 'portal 落点须为 document.body');
  const pouchModal = read('web/src/components/companion/CombinedPouchModal.tsx');
  const compassModal = read('web/src/components/companion/MoodCompassModal.tsx');
  assert.ok(pouchModal.includes('rgba(4,4,8,0.72)'), '合璧笺遮罩须加深至 0.72（军令 bg-black/70 语义）');
  assert.ok(compassModal.includes('rgba(4,4,8,0.72)'), '罗盘遮罩须加深至 0.72');
  // 首页 Slogan 及父容器锁死 z-0~z-10（军令背景降权域）
  const appCss = read('web/src/App.css');
  const petCardZ = Number((appCss.match(/\.ks-pet-card\s*\{[^}]*z-index:\s*(\d+)/) || [])[1]);
  const titleZ = Number((appCss.match(/\.input-page \.title\s*\{[^}]*z-index:\s*(\d+)/) || [])[1]);
  assert.ok(Number.isInteger(petCardZ) && petCardZ <= 10, `.ks-pet-card z-index 须 ≤10（实为 ${petCardZ}）`);
  assert.ok(Number.isInteger(titleZ) && titleZ <= 10, `.input-page .title z-index 须 ≤10（实为 ${titleZ}）`);
  // ══ 刀三：入袋微交互闭环——三态按钮＋shimmer＋淡出＋Toast（生硬 onClose 根除） ══
  assert.ok(pouchModal.includes('pouch-stow-shimmer'), '缺 300ms 金色 shimmer 扫掠层（pouch-stow-shimmer）');
  assert.ok(pouchModal.includes('ks-pouch-stow-shimmer'), '缺 shimmer keyframes（ks-pouch-stow-shimmer）');
  assert.ok(/onClick=\{handleStow\}/.test(pouchModal), 'pouch-stow 按钮严禁生硬 onClick={onClose}（须走 handleStow 三态时序）');
  assert.ok(pouchModal.includes('ui.stowDisabled') && pouchModal.includes('ui.stowDone'), '按钮缺置灰态/成功态文案接线');
  assert.ok(pouchModal.includes('onStowed'), '缺 onStowed 上抛（全局 Toast 宿主链）');
  assert.ok(controller.includes('pouch-stow-toast'), '控制器缺全局 Toast（pouch-stow-toast）');
  assert.ok(/setTimeout\(\(\) => setToastOn\(false\), 2500\)/.test(controller), 'Toast 须停留 2.5s（军令钦定）');
  assert.ok(/setFading\(true\), 400\)/.test(pouchModal), '须延迟 400ms 后平滑淡出（军令时序）');
  // ══ 刀四：server prompt 第一人称锁＋合盘禁词（静态源断言——单句结论铁律） ══
  const server = read('server.js');
  assert.ok(server.includes('【人称与合盘禁词（E122 军令'), 'server 缺 E122 人称与合盘禁词宪法块');
  assert.ok(server.includes('第一人称「我」'), '缺第一人称强制法则（日常陪伴恒以「我」自称）');
  assert.ok(server.includes('我是陪伴在你身边的灵宠伙伴'), '缺元问题被动亮明身份句式（仅追问时挑明）');
  assert.ok(server.includes('绝对禁词：「合盘」'), '缺合盘最高级负向禁词声明');
  assert.ok(!server.includes('提及自身时用「你的守护灵魂兽」'), '旧第三人称自称病灶残留（E112 原句必须拔除）');
  assert.ok(!server.includes('姻缘核心合盘报告'), 'REPORT_KIND 词面残留「合盘报告」（模型复读通道）');
  // ══ i18n 零新键复核（E122 自容字典——全站 123/familiar 59 双基准） ══
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.equal(Object.keys(o.familiar).length, 59, `${l} familiar 段须 59 键（E122 零新键）`);
  }
  console.log('  [PASS] E122-11: 体验整肃五刀（破冰命中/命名解耦/z-index/入袋闭环/人称与禁词）');
});

/* ═══════════ E123-12（军令 E123-ASTRAL-TOUCH 断言 12）：四刀整肃 ═══════════ */
test('E123-12 体验四刀（置灰对比度/实体卡下载/✕关闭/情绪记忆贯通）', () => {
  /* ══ 刀一：置灰态暗金琉璃微光（「死黑不可辨」根治）══ */
  const pouchModal = read('web/src/components/companion/CombinedPouchModal.tsx');
  assert.ok(pouchModal.includes('rgba(69,26,3,0.45)'), '置灰底须为 amber-950 微透（rgba(69,26,3,0.45)——旧暗金半透×黑字近同色病灶拔除）');
  assert.ok(pouchModal.includes('rgba(253,230,138,0.85)'), '置灰文字须为 amber-200 浅香槟金（黑字 rgba(20,17,10,0.55) 严禁回潮）');
  assert.ok(!pouchModal.includes('rgba(20,17,10,0.55)'), '旧置灰黑字残留（E123 刀一未根治）');
  assert.ok(pouchModal.includes('not-allowed'), '置灰态 cursor 须 not-allowed');
  assert.ok(/✓ \$\{ui\.stowDisabled\}/.test(pouchModal), '置灰文案须带 ✓ 前缀（达成感——军令「✓ 今日已收入星语袋」）');
  assert.equal(POU.POUCH_UI.zh.stowDisabled, '今日已收入星语袋', 'zh 置灰文案军令钦定「今日已收入星语袋」');

  /* ══ 刀二：Canvas 实体卡本地静默下载（社交裂变物料落盘）══ */
  assert.ok(pouchModal.includes('downloadStarWhisperCard(pouch, lang)'), '入袋须并行触发实体卡下载（fire-and-forget）');
  // 🏆 E123-刀二补刀：PNG 编码须走 toBlob 异步通道（toDataURL 同步编码阻塞
  // 主线程 5s+⇒三态时序整体推迟——实弹诊断实锤）
  const swExport = read('web/src/lib/starWhisperCardExport.mjs');
  assert.ok(swExport.includes('canvas.toBlob(resolve'), 'PNG 编码须 toBlob 异步通道（主线程零阻塞）');
  assert.ok(!swExport.includes('toDataURL'), '严禁 toDataURL 同步编码回潮（主线程阻塞病灶）');
  assert.equal(SWE.STAR_WHISPER_FILENAME_PREFIX, 'KindredSouls-星语灵犀-', '文件名前缀军令钦定');
  assert.equal(SWE.starWhisperFileName('20261104'), 'KindredSouls-星语灵犀-20261104.png', '文件名格式军令钦定（YYYYMMDD）');
  const tplOk = SWE.buildStarWhisperTemplate({
    mood: 'melancholy', date: '20261104',
    transitAttribution: { summary: 's', companionComfort: '安慰文案', actionableAdvice: '建议文案' },
    luckyAttributes: { colorName: '金', colorHex: '#D4AF37', bestWindow: '19:00 - 19:45', direction: '东' },
  }, 'zh');
  assert.ok(tplOk && tplOk.title === '✦ 今日星语灵犀 ✦' && tplOk.prose === '安慰文案', '合璧笺真值须装配为引擎 template 形状');
  assert.equal(SWE.buildStarWhisperTemplate(null, 'zh'), null, '坏档 fail-closed null');
  assert.equal(SWE.buildStarWhisperTemplate({ mood: 'xxx' }, 'zh'), null, '白名单外情绪 fail-closed null');
  assert.ok(pouchModal.includes('navigator.canShare') || read('web/src/lib/starWhisperCardExport.mjs').includes('navigator.canShare'), '移动端须有 Web Share 降级链');
  // 情绪→图腾四型键分发（零引擎改动）
  assert.equal(SWE.STAR_WHISPER_CARD_TYPE.melancholy, 'longing', '低落→星星线稿（17）');
  assert.equal(SWE.STAR_WHISPER_CARD_TYPE.agitated, 'apology', '焦躁→节制线稿（14）');
  assert.equal(SWE.STAR_WHISPER_CARD_TYPE.longing, 'weather', '想念→恋线稿（6）');
  assert.equal(SWE.STAR_WHISPER_CARD_TYPE.radiant, 'support', '灿烂→太阳线稿（19）');
  assert.ok(SWE.STAR_WHISPER_CARD_TYPE.grateful === undefined, '感恩→世界牌（缺省 21）');

  /* ══ 刀三：右上角物理关闭 ✕＋Esc 键盘监听 ══ */
  assert.ok(pouchModal.includes('data-testid="pouch-close-x"'), '缺右上角 ✕ 关闭按钮（pouch-close-x）');
  assert.ok(/top: 12, right: 12/.test(pouchModal), '✕ 须卡片内 absolute 右上角（top 12/right 12）');
  assert.ok(pouchModal.includes("e.key === 'Escape'"), '缺 Esc 键盘关闭监听');

  /* ══ 刀四：情绪记忆贯通（罗盘→ChatSheet 首语→server prompt）══ */
  // ① 六语字典军令句式逐字（zh 全五情绪＋六语非空）
  assert.equal(MOO.COMPANION_MOOD_GREETINGS.melancholy.zh, '我感应到你今天有些低落……别一个人扛着，把心里的委屈或烦恼说给我听听吧，我一直都在这里陪着你。', '低落首句军令钦定逐字');
  assert.equal(MOO.COMPANION_MOOD_GREETINGS.agitated.zh, '感觉到你此刻有些心烦焦躁……先深呼吸一下，把手给我，慢慢跟我说，有我在呢。', '焦躁首句军令钦定逐字');
  assert.equal(MOO.COMPANION_MOOD_GREETINGS.longing.zh, '心里是不是正牵挂着谁呢？如果这份想念无处安放，悄悄跟我倾诉吧，我替你守着这份心意。', '想念首句军令钦定逐字');
  assert.equal(MOO.COMPANION_MOOD_GREETINGS.radiant.zh, '感应到你今天气场发光、状态很棒呢！有什么开心的好事，快跟我分享分享！', '灿烂首句军令钦定逐字');
  assert.equal(MOO.COMPANION_MOOD_GREETINGS.grateful.zh, '今天的心境格外温润平静呢……能这样静静陪伴着你，也是我很幸福的时刻。', '感恩首句军令钦定逐字');
  for (const mood of Object.keys(MOO.COMPANION_MOOD_GREETINGS)) {
    for (const l of LANGS) {
      assert.ok(String(MOO.COMPANION_MOOD_GREETINGS[mood][l] || '').trim(), `COMPANION_MOOD_GREETINGS ${mood}.${l} 空缺（E123 刀四五情绪×六语军令表）`);
    }
  }
  // ② 落盘/读取/时效语义（Mock sessionStorage）
  const mem = new Map();
  const ss = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.equal(MOO.ACTIVE_MOOD_KEY, 'ks_active_mood', 'sessionStorage 键军令钦定 ks_active_mood');
  assert.equal(MOO.writeActiveMood(ss, 'melancholy'), true, '合法情绪落盘 true');
  assert.equal(MOO.readActiveMood(ss), 'melancholy', '当日内 2h 时效命中');
  assert.equal(MOO.readActiveMood(ss, new Date(Date.now() + 3 * 3600 * 1000)), null, '超 2h 时效窗须 null（军令钦定）');
  assert.equal(MOO.writeActiveMood(ss, 'hacker'), false, '白名单外情绪 fail-closed 不写');
  assert.equal(MOO.writeActiveMood(null, 'low'), false, 'null 存储不写');
  assert.equal(MOO.moodGreetingLine('melancholy', 'fr').startsWith('Je ressens'), true, '六语取值（fr 情绪首句）');
  assert.equal(MOO.moodGreetingLine('xxx', 'zh'), null, '坏 key 字典取值 null（严禁默认回退）');
  // ③ 罗盘确认时刻写入（源码断言）
  const compass = read('web/src/components/companion/MoodCompassModal.tsx');
  assert.ok(compass.includes('writeActiveMood(sessionStorage, selected)'), '罗盘确认须落盘 ks_active_mood（情绪表达时刻）');
  // ④ ChatSheet 首语拦截＋随行（源码断言）
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(sheet.includes("mode = 'mood'"), 'ChatSheet 缺 mood 分支插层（默认冷淡招呼拦截）');
  assert.ok(sheet.includes('readActiveMood(sessionStorage)'), 'ChatSheet 缺 ks_active_mood 读取');
  assert.ok(sheet.includes('activeMood,'), 'send body 缺 activeMood 随行');
  assert.ok(sheet.includes('moodGreetingLine(activeMoodRef.current, lang)'), 'helloFor 缺六语字典查表');
  // ⑤ server prompt 注入＋白名单守卫（源码断言）
  const server = read('server.js');
  assert.ok(server.includes('【User Emotional Context（E123 军令'), 'server 缺 E123 情绪上下文宪法块');
  assert.ok(server.includes('E123_MOOD_ZH'), 'server 缺情绪中文标签映射');
  assert.ok(server.includes('function _e123ActiveMood(v)'), 'server 缺 _e123ActiveMood 形状守卫（fail-closed）');
  assert.ok(server.includes("E123_MOOD_WHITELIST = new Set(['melancholy', 'agitated', 'longing', 'radiant', 'grateful'])"), 'server 情绪白名单五原型缺失');
  assert.ok(server.includes('activeMood: _e123Mood'), 'chat 端点缺 activeMood 接线');
  // ⑥ i18n 零新键复核（E123 自容字典——全站 123/familiar 59 双基准）
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.equal(Object.keys(o.familiar).length, 59, `${l} familiar 段须 59 键（E123 零新键）`);
  }
  console.log('  [PASS] E123-12: 体验四刀（置灰对比度/实体卡下载/✕关闭/情绪记忆贯通）');
});
