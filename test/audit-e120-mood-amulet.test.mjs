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
  const controller = read('web/src/components/companion/DailyPouchController.tsx');
  assert.ok(controller.includes('step === POUCH_STEPS.MOOD_SELECTING') && controller.includes('<MoodCompassModal'), '缺 MOOD_SELECTING⇒罗盘分支');
  assert.ok(controller.includes('step === POUCH_STEPS.REVEALED') && controller.includes('<CombinedPouchModal'), '缺 REVEALED⇒合璧笺分支');
  const moodBranch = controller.split('{step === POUCH_STEPS.MOOD_SELECTING && (')[1]?.split('{/* 第二阶段')[0] || '';
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
  assert.equal(segs.length, 92, `军规链段数须为 92（E120 入编后 91→92；实为 ${segs.length}）`);
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
