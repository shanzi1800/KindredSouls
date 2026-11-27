// ═══ E145 闸门：ASTRAL-SUITE（六刀军令 2026-11-19 全守备）═══
// 军令六刀：①状态栏精简去冗（chatStatus 三族退役）②智慧吃喝穿搭推荐引擎
// ③破财守门人（立即开通）④灵魂成长年鉴＋权益免费解锁 ⑤C2M 预埋（10 万门控
// 锁死零挂载）⑥.ics 四项微调＋L0-L2 记忆异步蒸馏核。
//   锁1 刀一 chatStatus 退役（组件/CSS/六语 locales 三族零回流）；
//   锁2 刀二 推荐引擎（意图网 fail-closed＋日主锚定日内恒定＋时段匹配＋
//     双形态纪律块：触发带真值锚、静默纯克制铁令）；
//   锁3 刀三 守门人（六语触发网＋三步结构＋双红线零合同零法律）；
//   锁4 刀四 年鉴（权益四档判定＋双页挂载＋HTML 导出）；
//   锁5 刀五 C2M（10 万阈值门控 dormant 锁死＋全仓零挂载预埋）；
//   锁6 刀六 ics 富字段（SUMMARY 前缀/LOCATION/DESCRIPTION 三段＋回流/URL
//     ＋降级兼容）＋蒸馏核（L0→L1→L2＋fold＋fail-closed）＋server fire-and-forget；
//   锁7 链位与段数（113→114；e145 层 e144 后、e40-compat 前；node-only 112）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const RA = await import(join(ROOT, 'web/src/lib/astralRhythmAction.mjs'));
const SR = await import(join(ROOT, 'web/src/lib/astralSmartRecEngine.mjs'));
const GK = await import(join(ROOT, 'web/src/lib/wealthGatekeeperAction.mjs'));
const CH = await import(join(ROOT, 'web/src/lib/soulChronicleEntitlement.mjs'));
const C2 = await import(join(ROOT, 'web/src/lib/c2mCommerceCore.mjs'));
const DI = await import(join(ROOT, 'web/src/lib/astralDistillCore.mjs'));

const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
const CSS = read('web/src/App.css');
const SERVER = read('server.js');
const APP = read('web/src/App.tsx');
const WRP = read('web/src/pages/WealthReportPage.tsx');
const PKG = JSON.parse(read('package.json'));
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const LOCALE = (l) => read(`web/src/i18n/locales/${l}.json`);

/* ═══ 锁1：刀一 chatStatus 三族退役 ═══ */

test('E145-锁1 刀一：状态栏尾缀退役（组件 span＋CSS＋六语 locales 三族零回流）', () => {
  // 组件族：span 与 t() 键双双退役
  assert.ok(!SHEET.includes('ks-chat-status-text'), '组件 chatStatus span 须退役');
  assert.ok(!SHEET.includes("t('familiar.chatStatus'"), '组件 chatStatus t() 键须退役');
  // CSS 族：样式规则退役（注释提及非规则——锁选择器形态非字面量）
  assert.ok(!/\.ks-chat-status-text\s*\{/.test(CSS), 'CSS chatStatus 样式规则须退役');
  // 六语 locales：键零回流
  for (const l of LANGS) {
    assert.ok(!LOCALE(l).includes('"chatStatus"'), `${l} locales chatStatus 键须零回流`);
  }
  // 状态栏主文案（E144 昼夜合成）不受刀一影响——仍在册
  assert.ok(SHEET.includes('composeCircadianStatus'), 'E144 昼夜状态栏合成须不受刀一牵连');
});

/* ═══ 锁2：刀二 智慧吃喝穿搭推荐引擎 ═══ */

test('E145-锁2a 刀二：意图侦测网（六语触发＋寒暄 fail-closed null）', () => {
  assert.equal(SR.detectSmartRecIntent('今天穿什么好', 'zh'), 'outfit', 'zh 穿搭 ⇒ outfit');
  assert.equal(SR.detectSmartRecIntent('晚上吃什么？想喝点汤', 'zh'), 'food', 'zh 吃喝 ⇒ food');
  assert.equal(SR.detectSmartRecIntent('what to wear today', 'en'), 'outfit', 'en 穿搭 ⇒ outfit');
  assert.equal(SR.detectSmartRecIntent('what to eat tonight', 'en'), 'food', 'en 吃喝 ⇒ food');
  assert.equal(SR.detectSmartRecIntent('今天天气真不错呀', 'zh'), null, '纯寒暄 ⇒ null（克制铁令）');
  assert.equal(SR.detectSmartRecIntent('', 'zh'), null, '空文本 ⇒ null');
  assert.equal(SR.detectSmartRecIntent(null, 'zh'), null, 'null 零抛错');
});

test('E145-锁2b 刀二：穿搭日主锚定（五行轮转日内恒定＋六语锚定句＋坏日期 fail-closed）', () => {
  const e1 = SR.outfitDayElement('2026-11-20');
  const e2 = SR.outfitDayElement('2026-11-20');
  assert.ok(['wood', 'fire', 'earth', 'metal', 'water'].includes(e1), '元素须在五行闭集');
  assert.equal(e1, e2, '同日期 ⇒ 恒同元素（日内恒定·军令钦定）');
  assert.equal(SR.outfitDayElement('bad-date'), null, '坏日期 ⇒ null fail-closed');
  // 锚定句：六语自容（同日同元素 ⇒ 同锚定句——推荐乱跳病灶根治）
  const zhLine = SR.outfitDayAnchorLine('2026-11-20', 'zh');
  const zhLine2 = SR.outfitDayAnchorLine('2026-11-20', 'zh');
  assert.ok(zhLine.includes('今日能量底色'), 'zh 锚定句须在');
  assert.equal(zhLine, zhLine2, '同日同语 ⇒ 恒同锚定句（零跳变）');
  for (const l of LANGS) {
    assert.ok(SR.outfitDayAnchorLine('2026-11-20', l).length > 10, `${l} 锚定句须自容产出`);
  }
  assert.equal(SR.outfitDayAnchorLine('bad', 'zh'), '', '坏日期锚定句 ⇒ 空 fail-closed');
});

test('E145-锁2c 刀二：吃喝时段匹配（晨/午/晚三段＋非法小时兜底）', () => {
  assert.equal(SR.nourishSlotOf(9), 'morning', '9 点 ⇒ morning');
  assert.equal(SR.nourishSlotOf(15), 'afternoon', '15 点 ⇒ afternoon');
  assert.equal(SR.nourishSlotOf(21), 'evening', '21 点 ⇒ evening');
  assert.equal(SR.nourishSlotOf(99), 'evening', '非法小时 ⇒ evening 兜底');
  assert.ok(SR.nourishSlotLine(15, 'zh').includes('午后'), 'zh 15 点指令句须含午后时段');
});

test('E145-锁2d 刀二：纪律块双形态（触发带真值锚＋静默纯克制铁令零硬塞）', () => {
  // 静默形态（intent 未命中非日首）：只含克制铁令——零锚定零时段零硬塞
  const silent = SR.buildSmartRecPromptBlock('zh', { dateISO: '2026-11-20', hour: 15, intent: null, dayFirst: false });
  assert.ok(silent.includes('克制铁令'), '静默形态须含克制铁令');
  assert.ok(!silent.includes('当日穿搭主锚定'), '静默形态严禁注入锚定真值');
  assert.ok(!silent.includes('吃喝时段匹配'), '静默形态严禁注入时段真值');
  // 触发形态（intent 命中）：锚定＋场景解释律＋时段＋品牌红线四律齐备
  const trig = SR.buildSmartRecPromptBlock('zh', { dateISO: '2026-11-20', hour: 15, intent: 'outfit', dayFirst: false });
  assert.ok(trig.includes('当日穿搭主锚定（真值·日内恒定'), '触发形态须含锚定真值头');
  assert.ok(trig.includes(SR.outfitDayAnchorLine('2026-11-20', 'zh')), '触发形态须嵌同源锚定句');
  assert.ok(trig.includes('场景解释律'), '触发形态须含场景变体解释律');
  assert.ok(trig.includes('吃喝时段匹配'), '触发形态须含时段匹配');
  assert.ok(trig.includes('品牌红线'), '触发形态须含品牌红线（E142.1 挂钩）');
  // dayFirst 破冰亦触发（军令：日首可给但同日恒定）
  const first = SR.buildSmartRecPromptBlock('zh', { dateISO: '2026-11-20', hour: 15, intent: null, dayFirst: true });
  assert.ok(first.includes('当日穿搭主锚定'), '日首破冰 ⇒ 触发形态');
  // server 挂载：模块缓存＋路由内后缀拼接（E143/E144 同形制零锚破坏）
  assert.ok(SERVER.includes('_e145SmartRecCore'), 'server 须挂 smartRec 模块缓存');
  assert.ok(SERVER.includes('buildSmartRecPromptBlock'), 'server 须消费纪律块');
});

/* ═══ 锁3：刀三 破财守门人 ═══ */

test('E145-锁3a 刀三：触发网（六语命中＋寒暄 fail-closed）', () => {
  assert.equal(GK.detectGatekeeperTrigger('这个包买不买，帮我看看', 'zh'), true, 'zh 买不买 ⇒ 触发');
  assert.equal(GK.detectGatekeeperTrigger('要不要跟他合伙开店', 'zh'), true, 'zh 合伙 ⇒ 触发');
  assert.equal(GK.detectGatekeeperTrigger('今天天气不错', 'zh'), false, '寒暄 ⇒ 不触发');
  assert.equal(GK.detectGatekeeperTrigger('should I invest in this now', 'en'), true, 'en 投资 ⇒ 触发');
  assert.equal(GK.detectGatekeeperTrigger('', 'zh'), false, '空文本 ⇒ false');
  assert.equal(GK.detectGatekeeperTrigger(null, 'zh'), false, 'null 零抛错');
});

test('E145-锁3b 刀三：三步守财块（标题军令逐字＋天时/识人/拦冲动＋双红线）', () => {
  const zh = GK.buildGatekeeperPromptBlock('zh');
  assert.ok(zh.includes('破财守门人'), 'zh 块标题须军令逐字「破财守门人」');
  assert.ok(zh.includes('① 天时') || zh.includes('① 天时——'), '三步须含天时');
  assert.ok(zh.includes('② 识人') || zh.includes('② 读'), '三步须含识人');
  assert.ok(zh.includes('③ 拦冲动') || zh.includes('③ Frein') || zh.includes('③'), '三步须含拦冲动');
  assert.ok(zh.includes('双红线'), '双红线须在');
  assert.ok(zh.includes('严禁要求或引导主人粘贴商业合同'), '红线一：零合同粘贴');
  assert.ok(zh.includes('严禁给出执业法律'), '红线二：零法律建议');
  // 军令六语标题逐字
  assert.equal(GK.L_GATEKEEPER_TITLE.zh, '破财守门人');
  assert.equal(GK.L_GATEKEEPER_TITLE.en, 'Wealth Gatekeeper');
  assert.equal(GK.L_GATEKEEPER_TITLE.fr, 'Gardien du Trésor');
  assert.equal(GK.L_GATEKEEPER_TITLE.es, 'Guardián del Tesoro');
  assert.equal(GK.L_GATEKEEPER_TITLE.th, 'ผู้พิทักษ์คลังทรัพย์');
  assert.equal(GK.L_GATEKEEPER_TITLE.vi, 'Người Giữ Kho Tài Lộc');
  // server 挂载（军令「立即开通」）
  assert.ok(SERVER.includes('_e145GatekeeperCore'), 'server 须挂守门人模块缓存');
  assert.ok(SERVER.includes('detectGatekeeperTrigger'), 'server 须挂触发侦测');
  assert.ok(SERVER.includes('buildGatekeeperPromptBlock'), 'server 须挂三步块注入');
});

/* ═══ 锁4：刀四 灵魂成长年鉴＋权益免费解锁 ═══ */

test('E145-锁4a 刀四：权益四档判定（姻缘年报/财富年报/月订满6月/年度全通＋fail-closed）', () => {
  assert.deepEqual(
    CH.chronicleEntitlementFor({ compatibility_yearly_report: true }),
    { romance: true, wealth: false, basis: 'compatibility_yearly_report' },
    '① $29.99 姻缘年报 ⇒ 姻缘模块（真源键）');
  assert.deepEqual(
    CH.chronicleEntitlementFor({ love_yearly: true }),
    { romance: true, wealth: false, basis: 'compatibility_yearly_report' },
    'love_yearly 容错双认 ⇒ 姻缘模块');
  assert.deepEqual(
    CH.chronicleEntitlementFor({ wealth_yearly_report: true }),
    { romance: false, wealth: true, basis: 'wealth_yearly_report' },
    '② $29.99 财富年报 ⇒ 财富模块');
  assert.deepEqual(
    CH.chronicleEntitlementFor({ all_pass_monthly: true, all_pass_monthly_streak: 6 }),
    { romance: true, wealth: true, basis: 'monthly_streak6' },
    '③ $9.99 月订连续 6 月 ⇒ 双模块');
  assert.deepEqual(
    CH.chronicleEntitlementFor({ all_pass_monthly: true, all_pass_monthly_streak: 5 }),
    { romance: false, wealth: false, basis: null },
    'streak 5（差一月）⇒ 不解锁（军令钦定满 6）');
  assert.deepEqual(
    CH.chronicleEntitlementFor({ all_pass_yearly: true }),
    { romance: true, wealth: true, basis: 'all_pass_yearly' },
    '④ $99.99 年度全通 ⇒ 双模块');
  assert.deepEqual(
    CH.chronicleEntitlementFor(null),
    { romance: false, wealth: false, basis: null },
    '空档 ⇒ fail-closed 不解锁');
});

test('E145-锁4b 刀四：组件双页挂载＋HTML 导出（标题军令逐字＋域名）', () => {
  // 军令六语标题逐字
  assert.equal(CH.L_CHRONICLE_TITLE.zh, '灵魂成长年鉴');
  assert.equal(CH.L_CHRONICLE_TITLE.en, 'Soul Growth Chronicle');
  assert.equal(CH.L_CHRONICLE_TITLE.fr, 'Chronique de l’Âme');
  assert.equal(CH.L_CHRONICLE_TITLE.es, 'Crónica del Alma');
  assert.equal(CH.L_CHRONICLE_TITLE.th, 'บันทึกการเติบโตของจิตวิญญาณ');
  assert.equal(CH.L_CHRONICLE_TITLE.vi, 'Biên Niên Tăng Trưởng Tâm Hồn');
  // 双页挂载（姻缘 romance＝App 首页；wealth＝WealthReportPage）
  assert.ok(APP.includes('SoulChronicleCard'), 'App.tsx 须挂姻缘模块年鉴卡');
  assert.ok(APP.includes("module=\"romance\""), 'App.tsx 年鉴卡须为 romance 模块');
  assert.ok(WRP.includes('SoulChronicleCard'), 'WealthReportPage 须挂财富模块年鉴卡');
  assert.ok(WRP.includes('module="wealth"'), '财富页年鉴卡须为 wealth 模块');
  assert.ok(CSS.includes('.ks-chronicle-card'), 'CSS 须含年鉴卡样式');
  // HTML 导出：空数据 fail-closed；合法档含标题/段落/域名
  assert.equal(CH.buildSoulChronicleHTML({ sections: [] }), '', '空章节 ⇒ 空载荷');
  assert.equal(CH.buildSoulChronicleHTML(null), '', 'null ⇒ 空载荷');
  const html = CH.buildSoulChronicleHTML({
    lang: 'zh', companion: 'Sophia',
    sections: [{ heading: '星轨足迹', lines: ['与灵宠同行的第一个月。'] }],
  });
  assert.ok(html.includes('灵魂成长年鉴') && html.includes('Sophia'), 'HTML 须含军令标题与灵宠名');
  assert.ok(html.includes('星轨足迹'), 'HTML 须含章节');
  assert.ok(html.includes('kindredsouls.online'), 'HTML footer 须带品牌域名');
  // server webhook streak 维护（月订续费 ⇒ streak+1；断订重开 ⇒ 重置 1）
  assert.ok(SERVER.includes('all_pass_monthly_streak'), 'webhook 须维护月订 streak 字段');
});

/* ═══ 锁5：刀五 C2M 能量开运预埋（10 万门控锁死）═══ */

test('E145-锁5 刀五：C2M 门控（10 万阈值＋dormant 零迁跃＋全仓零挂载预埋）', () => {
  assert.equal(C2.C2M_USER_THRESHOLD, 100000, '军令钦定阈值＝注册满 10 万');
  assert.equal(C2.c2mGateStatus({ registeredUsers: 99999 }), 'dormant', '差 1 人 ⇒ dormant 锁死');
  assert.equal(C2.c2mGateStatus({ registeredUsers: 100000 }), 'open', '满 10 万 ⇒ open');
  assert.equal(C2.c2mGateStatus({ registeredUsers: 200000, masterSwitch: false }), 'dormant', '总开关关闭 ⇒ 恒 dormant');
  assert.equal(C2.c2mGateStatus(null), 'dormant', '坏形状 ⇒ dormant fail-closed');
  // dormant 零迁跃（预埋状态机休眠铁律——非法迁跃一律 null fail-closed）
  for (const to of C2.C2M_STATES) {
    assert.equal(C2.c2mTransition('dormant', to), null, `dormant ⇒ ${to} 严禁迁跃`);
  }
  // 元素匹配分数闭集
  assert.ok(C2.elementMatchScore('wood', 'fire') > 0 && C2.elementMatchScore('wood', 'fire') <= 100, '分数须在 (0,100]');
  assert.equal(C2.elementMatchScore('wood', 'junk'), 0, '非法元素 ⇒ 0 fail-closed');
  // dormant 门控下匹配恒空（null 锁死——10 万前零露出）
  assert.equal(C2.c2mElementMatches({ registeredUsers: 99999 }, 'wood', [{ productId: 'p1', element: 'fire' }]), null,
    'dormant ⇒ 匹配 null 锁死（10 万前零露出）');
  // open 门控：相生高亲和命中（木生火 90 ≥75）
  const hits = C2.c2mElementMatches({ registeredUsers: 100000 }, 'wood', [{ productId: 'p1', element: 'fire' }, { productId: 'p2', element: 'junk' }]);
  assert.ok(Array.isArray(hits) && hits.length === 1 && hits[0].productId === 'p1' && hits[0].score === 90,
    'open ⇒ 相生候选命中且分数 90');
  // 全仓零挂载（预埋锁死：纯核在 lib 零消费端）
  assert.ok(!SERVER.includes('c2mCommerceCore'), 'server 严禁挂载 C2M（预埋期）');
  assert.ok(!APP.includes('c2mCommerceCore'), 'App 严禁挂载 C2M');
  assert.ok(!SHEET.includes('c2mCommerceCore'), '对话舱严禁挂载 C2M');
});

/* ═══ 锁6：刀六 .ics 四项微调＋L0-L2 蒸馏核 ═══ */

test('E145-锁6a 刀六：ics 富字段四微调（SUMMARY 前缀/LOCATION 宜忌/DESCRIPTION 三段＋回流/URL）', () => {
  const rich = RA.buildAstralCalendarRichFields('zh', 'caution', '今日避坑窗内暂缓大额买单', { startHH: 20, endHH: 22 });
  assert.ok(rich && rich.actionCore && rich.fortuneLine && rich.tiLine && rich.actionLine && rich.whisperLine,
    '富字段五件套须齐');
  assert.ok(rich.tiLine.includes('天时底牌') && rich.tiLine.includes('20:00-22:00'), '天时段须含提醒窗');
  assert.ok(rich.actionLine.includes('开运实操') && rich.actionLine.includes('今日避坑窗内暂缓大额买单'), '实操段须含回复核心句');
  const ics = RA.buildAstralCalendarICS({
    dateISO: '2026-11-20', startHH: 20, startMM: 0, endHH: 22, endMM: 0,
    summary: 'x', description: 'x', uidSalt: 'sig-1',
    lang: 'zh', whisperName: 'Sophia', actionCore: rich.actionCore,
    fortuneLine: rich.fortuneLine, tiLine: rich.tiLine, actionLine: rich.actionLine, whisperLine: rich.whisperLine,
  });
  // ① 标题带灵宠名与核心动作
  assert.ok(ics.includes('SUMMARY:✨ 灵宠叮嘱 · Sophia：守住财库缓买单'), 'SUMMARY 须军令形态（前缀·名·核心动作）');
  // ② LOCATION 一句话宜忌
  assert.ok(ics.includes('LOCATION:宜：稳步守财 · 忌：冲动买单'), 'LOCATION 须展示宜忌');
  // ③ DESCRIPTION 三段＋回流链接
  assert.ok(ics.includes('DESCRIPTION:天时底牌：'), 'DESCRIPTION 须以天时底牌开段');
  assert.ok(ics.includes('开运实操：今日避坑窗内暂缓大额买单'), 'DESCRIPTION 须含开运实操段');
  assert.ok(ics.includes('灵宠寄语：'), 'DESCRIPTION 须含灵宠寄语段');
  assert.ok(ics.includes(`轻点返回星盘舱 ${RA.ASTRAL_BACK_URL}`), 'DESCRIPTION 尾须附回流链接');
  // ④ URL 字段
  assert.ok(ics.includes(`URL:${RA.ASTRAL_BACK_URL}`), 'URL 字段须同步写入');
  assert.equal(RA.ASTRAL_BACK_URL, 'https://kindredsouls.online', '回流域名军令钦定');
  // CRLF 行尾守恒（RFC 5545）
  assert.ok(ics.includes('\r\n') && !/(?<!\r)\n/.test(ics), '严禁裸 \\n 行尾');
  // 军令六语前缀/回流文案逐字
  assert.equal(RA.L_ICS_PREFIX.zh, '✨ 灵宠叮嘱');
  assert.equal(RA.L_ICS_PREFIX.en, '✨ Astral Note');
  assert.equal(RA.L_ICS_PREFIX.fr, '✨ Note Astrale');
  assert.equal(RA.L_ICS_PREFIX.es, '✨ Nota Astral');
  assert.equal(RA.L_ICS_PREFIX.th, '✨ คำเตือนดวงดาว');
  assert.equal(RA.L_ICS_PREFIX.vi, '✨ Lời Dặn Tinh Linh');
  assert.equal(RA.L_ICS_BACK_LINK.zh, '轻点返回星盘舱');
  assert.equal(RA.L_ICS_BACK_LINK.en, 'Tap to Return');
  // en 形态（冒号半角＋英文回流）
  const richEn = RA.buildAstralCalendarRichFields('en', 'lucky', '', null);
  const icsEn = RA.buildAstralCalendarICS({
    dateISO: '2026-11-20', startHH: 14, endHH: 16, summary: 's', lang: 'en',
    whisperName: 'Milo', actionCore: richEn.actionCore, fortuneLine: richEn.fortuneLine,
    tiLine: richEn.tiLine, actionLine: richEn.actionLine, whisperLine: richEn.whisperLine,
  });
  assert.ok(icsEn.includes('SUMMARY:✨ Astral Note · Milo: Ride the auspicious hour'), 'en SUMMARY 形态');
  assert.ok(icsEn.includes('Tap to Return https://kindredsouls.online'), 'en 回流文案');
  // 组件接线：handleCalendarLock 消费富字段（纯核单源）
  assert.ok(SHEET.includes('buildAstralCalendarRichFields'), '组件须消费富字段装配');
  assert.ok(SHEET.includes('whisperName: name'), '组件须传灵宠名');
});

test('E145-锁6b 刀六：ics 降级兼容（富字段缺席 ⇒ e144 现行为零破坏）', () => {
  const ics = RA.buildAstralCalendarICS({
    dateISO: '2026-11-20', startHH: 9, startMM: 30, endHH: 11, endMM: 0,
    summary: '签约吉时', description: '星轨叮嘱', uidSalt: 'sig-123',
  });
  assert.ok(!ics.includes('LOCATION:'), '降级严禁 LOCATION');
  assert.ok(!ics.includes('URL:'), '降级严禁 URL');
  assert.ok(ics.includes('SUMMARY:签约吉时') && ics.includes('DESCRIPTION:星轨叮嘱'), '旧摘要/备注形态守恒');
  assert.ok(ics.includes('BEGIN:VALARM') && ics.includes('TRIGGER:-PT15M'), 'VALARM 守恒');
  // 坏形状 fail-closed 守恒
  assert.equal(RA.buildAstralCalendarICS(null), '', 'null ⇒ 空载荷');
  assert.equal(RA.buildAstralCalendarICS({ dateISO: 'bad' }), '', '坏日期 ⇒ 空载荷');
});

test('E145-锁6c 刀六：L0-L2 蒸馏核（管线纯函数＋fold 半衰＋fail-closed）', () => {
  // L0 归一：截长封顶＋坏形状零抛错
  assert.deepEqual(DI.distillL0Events('junk'), [], '非数组 ⇒ []');
  const l0 = DI.distillL0Events([{ role: 'user', content: '今天穿什么' }, { role: 'assistant', content: '暖金针织' }]);
  assert.equal(l0.length, 2, '合法轮 ⇒ 归一入册');
  // 全管线：五域话题命中＋L2 权重归一
  const d = DI.distillSession([
    { role: 'user', content: '今天穿什么好' },
    { role: 'assistant', content: '暖金色调针织。' },
    { role: 'user', content: '晚上吃什么？想喝汤' },
    { role: 'user', content: '最近有点累睡不好' },
  ], { lang: 'zh', mode: 'companion', dayFirst: true, ts: 1732000000000 });
  assert.ok(d, '零用户轮以外 ⇒ 产出');
  assert.equal(d.l1.topics.style, 1, 'style 话题命中 1');
  assert.equal(d.l1.topics.nourish, 1, 'nourish 话题命中 1');
  assert.equal(d.l1.topics.wellbeing, 1, 'wellbeing 话题命中 1');
  assert.equal(d.l1.userTurnCount, 3, '用户轮 3');
  assert.ok(d.l2.weights.style > 0 && d.l2.weights.style <= 0.99, '权重须归一 (0,0.99]');
  assert.equal(d.l1.dayFirst, true, '日首标志须贯通');
  // fail-closed 三态
  assert.equal(DI.distillSession([], {}), null, '零事件 ⇒ null');
  assert.equal(DI.distillSession(null, {}), null, 'null ⇒ null');
  assert.equal(DI.distillSession([{ role: 'assistant', content: 'hi' }], {}), null, '零用户轮 ⇒ null');
  // fold：sessions 递增＋旧权重半衰
  const m1 = DI.mergeDistilledProfile(null, d);
  const m2 = DI.mergeDistilledProfile(m1, d);
  assert.equal(m2.sessions, 2, '折叠会话数须 2');
  assert.ok(m2.l2.weights.style >= m1.l2.weights.style, '同源叠加不衰减');
  // 摘要：工程记号零用户原文（隐私）
  const s = DI.distillProfileSummary(m2);
  assert.ok(s.includes('sessions=2') && !s.includes('穿什么'), '摘要须零用户原文泄露');
  // server 挂载：fire-and-forget（setImmediate＋fail-closed＋内存仓封顶）
  assert.ok(SERVER.includes('_e145DistillCore'), 'server 须挂蒸馏模块缓存');
  assert.ok(SERVER.includes('E145_DISTILL_PROFILES'), 'server 须挂画像内存仓');
  assert.ok(SERVER.includes('setImmediate'), '蒸馏须异步 setImmediate（不阻塞出流）');
  assert.ok(SERVER.includes('[E145] astral distill'), '蒸馏须落日志摘要');
  assert.ok(SERVER.includes('distillSession('), 'server 须消费全管线');
});

/* ═══ 锁7：链位与段数（112→113）═══ */

test('E145-锁7 链位：e145 居 e144 后、e40-compat 前；全链 114 段＋node-only 112＋python 恒总链尾', () => {
  const script = String(PKG.scripts['test:astro'] || '');
  assert.ok(script.length > 100, 'test:astro 脚本须在册');
  const chain = script.split('&&').map((s) => s.trim()).filter(Boolean);
  const segs = chain.map((s) => (s.match(/audit-[a-z0-9-]+\.(?:test\.)?(?:mjs|js)/g) || []).pop()).filter(Boolean);
  const i144 = segs.indexOf('audit-e144-astral-rhythm-action.test.mjs');
  const i145 = segs.indexOf('audit-e145-astral-suite.test.mjs');
  const i40 = segs.indexOf('audit-e40-compat-synastry-tensor-fusion.test.mjs');
  assert.ok(i144 > 0, 'e144 段须在链');
  assert.ok(i145 === i144 + 1, 'e145 须紧居 e144 之后（版本序铁律）');
  assert.ok(i40 > i145, 'e40-compat 须恒居 node 链尾（e145 不得插其后）');
  // 总段计数（含 python 尾）＝113（E146 插链后继化）
  assert.equal(chain.length, 125, `链总段必须为 115（实际 ${chain.length}）`);   // 🔴 后继化（E158 入编）：123→124   // 🔴 后继化（E159 入编）：124→125
  const nodeOnly = chain.filter((s) => !/python/.test(s));
  assert.equal(nodeOnly.length, 124, `node-only 段必须为 114（实际 ${nodeOnly.length}）`);   // 🔴 后继化（E158 入编）：122→123   // 🔴 后继化（E159 入编）：123→124
  assert.ok(/python/.test(chain[chain.length - 1]), 'python 段须恒为总链尾');
  assert.equal(i40, segs.length - 1, 'e40 须恒 node 链尾');
});
