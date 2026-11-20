// ═══ E142 闸门：ORDERED-TOPIC-QUEUE-AND-CONTRACT-LOCKS（主公军令 2026-11-16）═══
// 病根（军令产线亲测四病灶）：
//   ① 首句退化——soulRecentReport 写入侧年报 tier='annual' 与消费端 '_yearly'
//      错位 ⇒ 模式落空跌 plain 兜底；报告第一击仅「当日新解锁」有效，隔日 P1 丢。
//   ② 财富月/年报按钮无金额——未与姻缘 $2.99/$29.99 沙盒付费墙对齐。
//   ③ 灵宠时间感知失准——后端跑云端 UTC，未注入用户终端本地时钟。
//   ④ 「改新坏旧」工程病灶——首句逻辑/付费按钮文案散落大组件。
// 治法：五模块落码＋本闸门五锁挂 FULL_EXIT——任何未来提交破坏任意一锁即
//   阻断构建：锁1 话题队列防退化｜锁2 跨模块话题序｜锁3 姓名记忆唤醒｜
//   锁4 财富价格与沙盒｜锁5 终端时钟同步。
// 链位：e142 入编 e141 后、e40-compat 前；全链 109→110 段。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const TQ = await import(join(ROOT, 'web/src/lib/companionTopicQueue.mjs'));
const PC = await import(join(ROOT, 'web/src/lib/paywallPriceContract.mjs'));
const CT = await import(join(ROOT, 'web/src/lib/clientTimeContext.mjs'));
const UN = await import(join(ROOT, 'web/src/lib/userNameMemory.mjs'));

const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
const WRP = read('web/src/pages/WealthReportPage.tsx');
const PAYWALL = read('web/src/components/WealthUpgradePaywall.tsx');
const SERVER = read('server.js');
const PKG = JSON.parse(read('package.json'));

/* ── 测试基建：注入式 mock storage（纯函数契约，零 DOM）── */
function mockStorage(initial) {
  const m = new Map(Object.entries(initial || {}));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(k); },
    _map: m,
  };
}

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

// 🆕 E148-刀一后继化：注入式时钟（铁律 19：断言消费真实时钟的 fixture 禁用
//    绝对日期——P1 当日硬门需 unlockedAt 落注入时钟今日，全部 fixture 携带）
const NOW = Date.now();
const TODAY_RR = (cat, tier) => ({ category: cat, tier, unlockedAt: NOW });

/** VM 抽取式：从 server.js 源码抽 _e142ClientTime 函数体实跑（铁律：new Function 参数包裹） */
function vmE142ClientTime() {
  const m = SERVER.match(/function _e142ClientTime\(v\) \{[\s\S]*?\n\}/);
  assert.ok(m, 'server.js 须含 _e142ClientTime 形状守卫（锁5 服务端闸门）');
  return new Function('v', m[0].replace(/^function _e142ClientTime\(v\) \{/, '').replace(/\n\}$/, ''));
}

/* ═══ 锁1：话题队列防退化锁（首句 P1+P2 双串联，严禁冷启动兜底）═══ */

test('E142-锁1a P1+P2 双串联：姻缘核心报告+低落情绪 ⇒ 首句含塔罗/姻缘特征词＋情绪特征词，非兜底语', () => {
  const q = TQ.resolveCompanionGreetingAndQueue({
    recentReport: TODAY_RR('love', 'core'), activeMood: 'melancholy', lang: 'zh', now: NOW,
  });
  assert.ok(q && q.firstLine, '串联首句须产出');
  assert.ok(/合盘|塔罗|牌/.test(q.firstLine), '首句须含 P1 塔罗/姻缘特征词');
  assert.ok(/低落/.test(q.firstLine), '首句须含 P2 情绪特征词（低落）');
  assert.ok(!q.firstLine.includes('我在呢') && !q.firstLine.includes('今天想聊点什么'),
    '军令红线：严禁跌回冷启动兜底语「我在呢。今天想聊点什么？」');
});

test('E142-锁1b tier 归一化根修：年报档 annual 与 yearly 双形态均可命中（消费端错位病灶根治）', () => {
  assert.equal(TQ.normalizeReportTier('annual'), 'yearly');
  assert.equal(TQ.normalizeReportTier('yearly'), 'yearly');
  assert.equal(TQ.normalizeReportTier('monthly'), 'monthly');
  assert.equal(TQ.normalizeReportTier('core'), 'core');
  assert.equal(TQ.normalizeReportTier('bogus'), '');
  for (const tier of ['annual', 'yearly']) {
    const key = TQ.normalizeReportKey({ category: 'love', tier });
    assert.equal(key, 'love_yearly', `年报档 tier=${tier} 须归一命中 love_yearly`);
  }
  assert.equal(TQ.normalizeReportKey({ category: 'wealth', tier: 'annual' }), 'wealth_yearly');
  assert.equal(TQ.normalizeReportKey(null), null, '坏形状 ⇒ null（fail-closed）');
});

test('E142-锁1c（🆕 E148 后继化）当日六档六语：unlockedAt 落注入时钟今日 ⇒ 首句恒含 P1 话题', () => {
  for (const lang of LANGS) {
    for (const [cat, tier] of [['love', 'core'], ['love', 'monthly'], ['love', 'annual'],
      ['wealth', 'core'], ['wealth', 'monthly'], ['wealth', 'annual']]) {
      const q = TQ.resolveCompanionGreetingAndQueue({ recentReport: TODAY_RR(cat, tier), activeMood: null, lang, now: NOW });
      assert.ok(q && q.firstLine && q.firstLine.length > 10, `六档六语首句须产出 lang=${lang} ${cat}_${tier}`);
    }
  }
  // 🆕 E148-刀一新锁：隔日历史牌面 ⇒ P1 静默（合成器 fail-closed 防串台）
  const stale = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'love', tier: 'core', unlockedAt: NOW - 26 * 3600 * 1000 },
    activeMood: null, lang: 'zh', now: NOW,
  });
  assert.equal(stale, null, '隔日报告档无情绪 ⇒ 合成器 null（P3 兜底交还调用方）');
  const staleMood = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'love', tier: 'core', unlockedAt: NOW - 26 * 3600 * 1000 },
    activeMood: 'radiant', lang: 'zh', now: NOW,
  });
  assert.ok(staleMood && /发光|气色|气场|好事/.test(staleMood.firstLine) && !/合盘|塔罗|牌面/.test(staleMood.firstLine),
    '隔日牌面静默：首句仅 P2 情绪特征词，严禁 P1 报告特征词（串台根治）');
  assert.equal(TQ.isRecentReportToday(TODAY_RR('love', 'core'), NOW), true, '当日档 ⇒ true');
  assert.equal(TQ.isRecentReportToday({ category: 'love', tier: 'core', unlockedAt: NOW - 26 * 3600 * 1000 }, NOW), false, '隔日档 ⇒ false');
  assert.equal(TQ.isRecentReportToday({ category: 'love', tier: 'core' }, NOW), false, '无 unlockedAt ⇒ false（fail-closed）');
  assert.equal(TQ.isRecentReportToday(null, NOW), false, '坏形状 ⇒ false');
});

test('E142-锁1d 合成器兜底红线：无 P1 无 P2 ⇒ null（绝不臆造兜底句）；纯 P2 亦可单发', () => {
  assert.equal(TQ.resolveCompanionGreetingAndQueue({ recentReport: null, activeMood: null, lang: 'zh' }), null);
  const q = TQ.resolveCompanionGreetingAndQueue({ recentReport: null, activeMood: 'radiant', lang: 'zh' });
  assert.ok(q && q.firstLine, '纯 P2 情绪句须产出');
  assert.ok(!q.firstLine.startsWith('...') && !q.firstLine.startsWith('…'), '纯 P2 不得带省略号前缀');
});

test('E142-锁1e（🆕 E148 后继化）消费端源码锚：p1queue 仅当日承接＋隔日分支拆除＋合成器消费', () => {
  assert.ok(SHEET.includes("'p1queue'"), 'HelloMode 须含 p1queue');
  assert.ok(SHEET.includes('resolveCompanionGreetingAndQueue'), 'helloFor 须消费合成器');
  // 🆕 E148-刀一：隔日 P1 持久锚分支已拆除（隔日首句串台根治——严禁复活）
  assert.ok(!/else if \(rr && normalizeReportKey\(rr\)\)/.test(SHEET), '隔日 P1 持久锚分支须拆除（E148-刀一）');
  assert.ok(!/mode = 'p1queue';\s*\n\s*} else if \(_e142Mood\)/.test(SHEET), 'p1queue 赋值严禁在隔日分支复活');
  assert.ok(SHEET.includes("mode = (_e142Mood && normalizeReportKey(rr)) ? 'p1queue'"), '当日新解锁+情绪 ⇒ 须升级 P1+P2 串联');
  assert.ok(SHEET.includes('freshReport'), '当日判定锚 freshReport 须在场（E113 同源双保险）');
});

/* ═══ 锁2：跨模块话题序锁（P1 报告话题恒首位；财富进则先天财富话题）═══ */

test('E142-锁2a 队列序：P1 恒首位、P2 情绪随其后（queue 数组契约）', () => {
  const q = TQ.resolveCompanionGreetingAndQueue({
    recentReport: TODAY_RR('wealth', 'core'), activeMood: 'agitated', lang: 'zh', now: NOW,
  });
  assert.deepEqual(q.queue, ['wealth_core', 'mood:agitated'], '财富进则队列首键=先天财富报告，情绪第二位');
  assert.ok(/财库/.test(q.firstLine), '财富 P1 首句须含先天财库特征词（八字财库）');
});

test('E142-锁2b（🆕 E142.1 重写）冗余胶囊清除锁：姻缘胶囊退役＋P1 前置形态拔除＋chatQ1/Q3 恰两颗', () => {
  // ① 话题胶囊字典与导出函数须退役（军令刀二：删「💑 姻缘与塔罗」快捷胶囊）
  assert.ok(!('topicPillLabel' in TQ), 'companionTopicQueue 严禁再导出 topicPillLabel（E142.1 退役）');
  const tqSrc = read('web/src/lib/companionTopicQueue.mjs');
  // 注释退役说明行可提，代码行严禁复活（剥离注释后零命中）
  const tqCode = tqSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!tqCode.includes('TOPIC_PILL_LABELS'), '胶囊字典 TOPIC_PILL_LABELS 代码面须物理拔除（注释退役说明除外）');
  const dmts = read('web/src/lib/companionTopicQueue.d.mts');
  assert.ok(!dmts.includes('topicPillLabel'), '类型声明 d.mts 严禁残留 topicPillLabel');
  // ② ChatSheet 消费面零引用（注释退役说明行除外——剥离注释后代码面零命中）
  const sheetCode = SHEET.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  assert.ok(!sheetCode.includes('_e142P1Pill'), 'ChatSheet 代码面严禁残留 _e142P1Pill 前置变量');
  assert.ok(!sheetCode.includes('topicPillLabel'), 'ChatSheet 代码面严禁残留 topicPillLabel 调用');
  // ③ pills 恒恰两颗（chatQ1 财运＋chatQ3 指引——军令钦定保留对）
  assert.ok(/const pills = \[t\('familiar\.chatQ1'\), t\('familiar\.chatQ3'\)\];/.test(SHEET),
    'pills 数组须恰两颗 [chatQ1, chatQ3]（E142.1 冗余胶囊清除终态）');
});

test('E142-锁2c 服务端 rk 归一化锚：REPORT_KIND 咬合修复（annual⇒yearly）', () => {
  assert.ok(SERVER.includes('_e142TierKey'), 'server.js 须含 tier 归一化（rk 咬合根修）');
  assert.ok(/const rk = recentReport \? `\$\{String\(recentReport\.category\)\}_\$\{_e142TierKey\(recentReport\.tier\)\}` : ''/.test(SERVER),
    'rk 须走归一化键（年报解锁后 recentBlock 不得再落空）');
});

/* ═══ 锁3：姓名记忆唤醒锁（永久档案＋首句带名＋后续回复含名）═══ */

test('E142-锁3a 六语正则识别：「我叫江山/叫我小雅」提取＋黑名单熔断', () => {
  assert.equal(UN.extractUserNameIntent('我叫江山'), '江山');
  assert.equal(UN.extractUserNameIntent('以后叫我小雅啦'), '小雅');
  assert.equal(UN.extractUserNameIntent('My name is Emma'), 'Emma');
  assert.equal(UN.extractUserNameIntent('Call me North'), 'North');
  assert.equal(UN.extractUserNameIntent('I am a student'), null, '状态词黑名单须熔断');
  assert.equal(UN.extractUserNameIntent('我是射手座'), null, '星座黑名单须熔断');
});

test('E142-锁3b 档案持久化＋唤醒：writeUserNameProfile ⇒ readUserNameProfile 回读含名（按盘隔离键）', () => {
  const store = mockStorage();
  assert.equal(UN.writeUserNameProfile(store, 'sig123', '江山'), true);
  const p = UN.readUserNameProfile(store, 'sig123');
  assert.ok(p && p.displayName === '江山', '永久档案须可回读（ks_familiar_profile_${chartSig}）');
  assert.equal(UN.readUserNameProfile(store, 'sig999'), null, '异盘隔离（E49 铁律）');
});

test('E142-锁3c 首句带名：P1 串联句以用户名前缀开场（六语同构）', () => {
  const q = TQ.resolveCompanionGreetingAndQueue({
    recentReport: TODAY_RR('love', 'core'), activeMood: 'melancholy', lang: 'zh', userName: '江山', now: NOW,
  });
  assert.ok(q.firstLine.startsWith('江山，'), 'zh 姓名前缀「江山，」');
  const qEn = TQ.resolveCompanionGreetingAndQueue({
    recentReport: TODAY_RR('wealth', 'core'), activeMood: null, lang: 'en', userName: 'North', now: NOW,
  });
  assert.ok(qEn.firstLine.startsWith('North, '), 'en 姓名前缀同构');
  // 服务端 IDENTITY 永久记忆块链锚（E118 沿袭——姓名随行 prompt 注入）
  assert.ok(SERVER.includes('IDENTITY PERMANENCE'), 'server IDENTITY 块须在场（后续回复含名）');
  assert.ok(SHEET.includes('displayName,'), 'body 须随行 displayName');
});

/* ═══ 锁4：财富月/年报价格与沙盒锁（六语含金额＋点击必触发沙盒弹窗）═══ */

test('E142-锁4a 军令钦定译表：六语按钮文案全覆盖（locked 含 $2.99/$29.99；unlocked「查看」）', () => {
  assert.equal(PC.wealthReportButtonLabel('wealth_monthly', 'zh', false), '🗓️ 解锁财富月报 $2.99');
  assert.equal(PC.wealthReportButtonLabel('wealth_yearly', 'zh', false), '📈 解锁财富年报 $29.99');
  for (const lang of LANGS) {
    const m = PC.wealthReportButtonLabel('wealth_monthly', lang, false);
    const y = PC.wealthReportButtonLabel('wealth_yearly', lang, false);
    assert.ok(m && /\$2[.,]99/.test(m), `月报六语含 $2.99 lang=${lang}`);
    assert.ok(y && /\$29[.,]99/.test(y), `年报六语含 $29.99 lang=${lang}`);
    assert.ok(PC.wealthReportButtonLabel('wealth_monthly', lang, true), `月报已解锁「查看」六语 lang=${lang}`);
    assert.ok(PC.wealthReportButtonLabel('wealth_yearly', lang, true), `年报已解锁「查看」六语 lang=${lang}`);
  }
  // fr/es 小数逗号形态（E103-③ 铁律）
  assert.ok(PC.wealthReportButtonLabel('wealth_monthly', 'fr', false).includes('$2,99'), 'fr 小数逗号');
  assert.ok(PC.wealthReportButtonLabel('wealth_yearly', 'es', false).includes('$29,99'), 'es 小数逗号');
  assert.equal(PC.wealthReportButtonLabel('bogus', 'zh', false), null, '非白名单 plan ⇒ null fail-closed');
});

test('E142-锁4b 价格契约表：五档数字真源', () => {
  assert.equal(PC.PAYWALL_PRICE_CONTRACT.love_core, 4.99);
  assert.equal(PC.PAYWALL_PRICE_CONTRACT.love_monthly, 2.99);
  assert.equal(PC.PAYWALL_PRICE_CONTRACT.love_yearly, 29.99);
  assert.equal(PC.PAYWALL_PRICE_CONTRACT.wealth_core, 4.99);
  assert.equal(PC.PAYWALL_PRICE_CONTRACT.wealth_monthly, 2.99);
  assert.equal(PC.PAYWALL_PRICE_CONTRACT.wealth_yearly, 29.99);
  assert.equal(PC.priceLabel('wealth_monthly', 'zh'), '$2.99');
  assert.equal(PC.priceLabel('wealth_yearly', 'fr'), '$29,99');
});

test('E142-锁4c 按钮消费＋沙盒弹窗链锚：未购点击必触发 WealthUpgradePaywall 沙盒支付', () => {
  // WealthReportPage 四处按钮文案须走契约模块（月/年 × 购/未购）
  const uses = (WRP.match(/wealthReportButtonLabel\(/g) || []).length;
  assert.ok(uses >= 4, `WealthReportPage 须四处消费契约文案（实测 ${uses}）`);
  assert.ok(WRP.includes("data-testid=\"wealth-upgrade-open-monthly\""), '未购月报按钮 testid 须保留（唤起沙盒弹窗）');
  assert.ok(WRP.includes("data-testid=\"wealth-upgrade-open-yearly\""), '未购年报按钮 testid 须保留（唤起沙盒弹窗）');
  assert.ok(WRP.includes('openUpgradePaywall(\'wealth_monthly_report\')'), '月报点击须 openUpgradePaywall');
  assert.ok(WRP.includes('openUpgradePaywall(\'wealth_yearly_report\')'), '年报点击须 openUpgradePaywall');
  assert.ok(WRP.includes('onSandboxPay={runUpgradeSandboxPay}'), '弹窗须挂沙盒支付回调（一键模拟支付）');
  assert.ok(PAYWALL.includes('UPGRADE_SANDBOX_BTN_TESTID'), 'WealthUpgradePaywall 须含沙盒按钮 testid');
  assert.ok(WRP.includes('vipUnlockedHintLabel(currentLang)'), '已解锁提示行须走契约模块（拔旧「免费生成」误导）');
});

/* ═══ 锁5：终端时钟同步锁（payload 三件套＋System Prompt 置顶注入）═══ */

test('E142-锁5a 军令例逐字：2026-11-16 15:31（周一/午后）三件套', () => {
  const c = CT.buildClientTimeContext(new Date(2026, 10, 16, 15, 31), 'Asia/Shanghai', 'zh');
  assert.equal(c.formattedLocalTime, '2026年11月16日 星期一 15:31（午后）', '军令钦定例句逐字');
  assert.equal(c.localISO, '2026-11-16T15:31');
  assert.equal(c.timezone, 'Asia/Shanghai');
});

test('E142-锁5b 三件套六语形状＋时段全覆盖（清晨/上午/午后/傍晚/深夜）', () => {
  for (const lang of LANGS) {
    const c = CT.buildClientTimeContext(new Date(2026, 10, 16, 15, 31), 'Asia/Shanghai', lang);
    assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(c.localISO), `localISO 形状 lang=${lang}`);
    assert.ok(c.formattedLocalTime.includes('15:31'), `时分随行 lang=${lang}`);
    assert.ok(c.formattedLocalTime.length > 10 && c.formattedLocalTime.length <= 80, `长度防注入 lang=${lang}`);
  }
  const hrs = [[3, '深夜'], [7, '清晨'], [10, '上午'], [15, '午后'], [20, '傍晚'], [23, '深夜']];
  for (const [h, label] of hrs) {
    const c = CT.buildClientTimeContext(new Date(2026, 10, 16, h, 5), 'Asia/Shanghai', 'zh');
    assert.ok(c.formattedLocalTime.includes(label), `时段 ${label}（hour=${h}）`);
  }
});

test('E142-锁5c 服务端形状守卫实跑（VM 抽取式）：好形状放行/坏形状熔断', () => {
  const guard = vmE142ClientTime();
  const ok = guard({ localISO: '2026-11-16T15:31', timezone: 'Asia/Shanghai', formattedLocalTime: '2026年11月16日 星期一 15:31（午后）' });
  assert.equal(ok.timezone, 'Asia/Shanghai', '好形状须放行');
  assert.equal(guard(null), null);
  assert.equal(guard({}), null);
  assert.equal(guard({ localISO: '2026-11-16 15:31', timezone: 'x', formattedLocalTime: 'x' }), null, 'localISO 非 ISO 形状须熔断');
  assert.equal(guard({ localISO: '2026-11-16T15:31', timezone: 'a'.repeat(65), formattedLocalTime: 'x' }), null, '超长时区须熔断');
  assert.equal(guard({ localISO: '2026-11-16T15:31', timezone: 'x', formattedLocalTime: 'bad\nbreak' }), null, '换行注入须熔断');
});

test('E142-锁5d 前后端注入链锚：body 随行三件套＋System Prompt 置顶高优块', () => {
  assert.ok(SHEET.includes('buildClientTimeContext'), '前端须消费三件套构造器');
  assert.ok(SHEET.includes('clientTimeContext,'), 'body 须随行 clientTimeContext');
  assert.ok(SERVER.includes('body.clientTimeContext'), 'chat 路由须解析 body.clientTimeContext');
  assert.ok(SERVER.includes('clientTime: _e142Time,'), 'prompt 装配须传入 clientTime');
  assert.ok(SERVER.includes('【CLIENT TIME SYNC（E142 军令，违反即失败·置顶高优）】'), 'prompt 须含置顶时钟块标题');
  assert.ok(SERVER.includes('当前用户所在地精确时间：'), 'prompt 须含军令钦定时间注入句式');
  // 置顶性：timeBlock 须排在 pronounBlock 之前（System Prompt 顶部高优）
  const ti = SERVER.indexOf('...timeBlock,');
  const pi = SERVER.indexOf('...pronounBlock,');
  assert.ok(ti > 0 && pi > 0 && ti < pi, 'timeBlock 须置顶于代词红线块之前');
});

/* ═══ 链位锁：e142 入编全链（109→110 段）═══ */

test('E142-链位 e142 段入编 test:astro（e141 后、e40-compat 前）', () => {
  const s = JSON.stringify(PKG.scripts['test:astro']);
  assert.ok(s.includes('audit-e142-regression-lock.test.mjs'), 'test:astro 须含 e142 段');
  const i142 = s.indexOf('audit-e142-regression-lock');
  const i141 = s.indexOf('audit-e141-forward-window-purity');
  const i40 = s.indexOf('audit-e40-compat');
  assert.ok(i141 > 0 && i142 > i141, 'e142 须居 e141 之后（版本序）');
  assert.ok(i40 > 0 && i142 < i40, 'e142 须居 e40-compat 之前（e40 恒 node 链尾前）');
});

/* ══════════════════════════════════════════════════════════════════
 * 🆕 E142.1（主公军令 2026-11-17）：SUMMARY-FIX 五锁
 *   病灶：①关窗重开首句失忆 ②冗余胶囊 ③唤名复读机 ④穿搭品牌 ⑤财富免付短路。
 *   锁A 开关弹窗持久｜锁B 胶囊清除（并入锁2b 重写）｜锁C 姓名频次情绪门禁｜
 *   锁D 穿搭零品牌｜锁E 零注入财富沙盒。
 * ══════════════════════════════════════════════════════════════════ */

const DCS = await import(join(ROOT, 'web/src/lib/dailyChatSession.mjs'));
const ST = await import(join(ROOT, 'web/src/lib/sandboxTester.mjs'));

/* ── E142.1-锁A：开关弹窗持久锁（首句禁「阅后即焚」）── */

test('E142.1-锁A1 问候模式白名单闭集：HELLO_MODES 12 模式冻结（含 p1queue＋六档报告第一击）', () => {
  assert.equal(DCS.HELLO_MODES.length, 12, '军令钦定 12 模式闭集');
  assert.deepEqual([...DCS.HELLO_MODES], [
    'sweet', 'soothe', 'plain', 'daily', 'mood', 'p1queue',
    'love_core', 'love_monthly', 'love_yearly',
    'wealth_core', 'wealth_monthly', 'wealth_yearly',
  ], '模式枚举须逐字冻结（存/读两侧同源净化）');
});

test('E142.1-锁A2 存读 roundtrip：greetingMode 随档固化＋旧档无字段容错＋坏值剥除（fail-closed）', () => {
  const store = mockStorage();
  const msgs = [{ role: 'assistant', text: '首句', timestamp: 1 }];
  // 🛡️ E144 时弹修复（铁律 19：断言消费真实时钟的 fixture 禁用绝对日期）：
  //    loadDailyChatSession 第 4 参注入固定 now（档日当日正午）——旧实跑真实
  //    时钟，2026-11-18 起 2026-11-17 档恒过期引爆（e59 A3 同型时间炸弹）。
  const NOW = new Date('2026-11-17T12:00:00').getTime();
  // ① 写档带模式 ⇒ 回读还原
  DCS.saveDailyChatSession(store, 'sig1', '2026-11-17', msgs, 'p1queue');
  const sess = DCS.loadDailyChatSession(store, 'sig1', '2026-11-17', NOW);
  assert.equal(sess.greetingMode, 'p1queue', 'greetingMode 须随档持久（关窗重开吃档）');
  // ② 旧档无字段 ⇒ undefined（组件兜底本重算值，禁抛错）
  DCS.saveDailyChatSession(store, 'sig2', '2026-11-17', msgs);
  assert.equal(DCS.loadDailyChatSession(store, 'sig2', '2026-11-17', NOW).greetingMode, undefined, '旧档无字段 ⇒ undefined 容错');
  // ③ 坏模式写档 ⇒ 剥除不落档
  DCS.saveDailyChatSession(store, 'sig3', '2026-11-17', msgs, 'bogus');
  assert.equal(DCS.loadDailyChatSession(store, 'sig3', '2026-11-17', NOW).greetingMode, undefined, '白名单外模式须剥除（fail-closed）');
});

test('E142.1-锁A3 复原分支源码锚：吃档模式禁跌 plain 兜底＋存档随行 helloMode＋单 hello 重写同模式', () => {
  // ① 复原分支吃存档 greetingMode（|| mode 兜底＝同输入确定性重算）
  assert.ok(SHEET.includes("setHelloMode((sess && (sess as { greetingMode?: HelloMode }).greetingMode) || mode);"),
    '复原分支须吃档模式（严禁 setHelloMode(\'plain\') 兜底退场）');
  // ② 存档随行 helloMode（deps 三件套）
  // 🆕 E143 后继化：存档增第 6 参 badgeLog（星光微标会话去重随档——E142.1 同形制）
  assert.ok(/saveDailyChatSession\(store, sessionSigRef\.current, sessionDateRef\.current, msgs, helloMode(, badgeLogRef\.current)?\)/.test(SHEET),
    '存档调用须随行 helloMode（E142.1-刀一）＋badgeLog（E143-刀三）');
  assert.ok(SHEET.includes('}, [msgs, open, helloMode]);'), '落档 effect 须监听 helloMode');
  // ③ 单 hello 档重写效应须按 helloMode 重生（关窗重开同文本）
  assert.ok(/id === 'hello'/.test(SHEET) || /'hello'/.test(SHEET), 'hello 首条重写效应须在场');
  // ④ onClose 严禁重置消息流（军令：禁丢弃历史）
  assert.ok(!/setMsgs\(\[\]\)[\s\S]{0,120}onClose/.test(SHEET), 'onClose 路径严禁清空 msgs');
});

/* ── E142.1-锁C：姓名频次与情绪门禁锁（三重熔断）── */

test('E142.1-锁C1 极值情绪门：罗盘五原型放行（非常失落/非常兴奋）＋普通态全禁', () => {
  assert.equal(UN.NAME_CALL_LIMIT, 2, '军令钦定每日唤名配额=2');
  for (const m of ['melancholy', 'agitated', 'longing', 'radiant', 'grateful']) {
    assert.equal(UN.extremeMoodForName(m), true, `极值情绪须放行唤名 mood=${m}`);
  }
  for (const m of [null, undefined, '', 'calm', 'bogus', 'daily']) {
    assert.equal(UN.extremeMoodForName(m), false, `非极值态须禁唤名 mood=${String(m)}`);
  }
});

test('E142.1-锁C2 配额记账 roundtrip：bump 累计＋跨日重置＋sync 仅向上取 max（防服务端重启清零拉低）', () => {
  const store = mockStorage();
  // ① bump 累计至配额上限
  assert.equal(UN.readNameCallCount(store, '2026-11-17'), 0, '无档 ⇒ 0');
  assert.equal(UN.bumpNameCallCount(store, '2026-11-17'), 1, 'bump 1');
  assert.equal(UN.bumpNameCallCount(store, '2026-11-17'), 2, 'bump 2（到顶）');
  assert.equal(UN.readNameCallCount(store, '2026-11-17'), 2, '当日累计=2');
  // ② 跨自然日重置（配额随本地日翻转）
  assert.equal(UN.readNameCallCount(store, '2026-11-18'), 0, '次日档须归零重计');
  // ③ sync 仅向上：服务端 1 不拉低本地 2；服务端 3 向上顶格
  assert.equal(UN.syncNameCallCount(store, '2026-11-17', 1), 2, '向下不写（权威计数防回退）');
  assert.equal(UN.syncNameCallCount(store, '2026-11-17', 3), 3, '向上取 max');
  assert.equal(UN.readNameCallCount(store, '2026-11-17'), 3, '顶格回读');
  // ④ 坏形状容错
  assert.equal(UN.syncNameCallCount(store, '2026-11-17', -1), 3, '负数须拒');
  assert.equal(UN.readNameCallCount(store, 'bogus-date'), 0, '坏日期键 ⇒ 0');
});

test('E142.1-锁C3 服务端三重熔断锚：IDENTITY 唤名铁律＋deltaGuard 流中守卫＋done 帧权威回传', () => {
  // ① IDENTITY 块唤名铁律（平时禁喊＋仅极值情绪 1 次＋配额行）
  assert.ok(SERVER.includes('唤名铁律（E142.1 军令，违反即失败）'), 'IDENTITY 须含唤名铁律显令');
  assert.ok(SERVER.includes('本条及今日后续回复严禁出现'), '配额满 ⇒ 严禁出现显令');
  assert.ok(SERVER.includes('全程自然以此名称呼主人') === false, '旧「全程称呼」过度服从中性令须退役');
  // ② deltaGuard 流中唤名守卫（单条 ≤1 次；配额尽 ⇒ 0 次）
  assert.ok(SERVER.includes('const _e1421Allowed = _e1421QuotaLeft > 0 ? 1 : 0;'), '流中守卫须按配额定上限');
  assert.ok(SERVER.includes('_e1421NameViolated = true;'), '超限须置违规位（弃流重试）');
  assert.ok(SERVER.includes("model = 'gemini-3.5-flash:' + (_e1421IsNameVio ? 'name-retry' : 'pronoun-retry');"),
    '重试槽合并须留痕 name-retry/pronoun-retry');
  // ③ done 帧权威计数回传（客户端向上同步）
  assert.ok(SERVER.includes('nameQuota: _e1421DoneQuota'), 'done 帧须随行 nameQuota');
  assert.ok(SERVER.includes('E1421_NAME_LIMIT = 2'), '服务端限额常量=2');
  // ④ 客户端随行＋回写接线
  assert.ok(SHEET.includes('nameQuotaCount'), 'send body 须随行本地计数');
  assert.ok(SHEET.includes('syncNameCallCount'), 'done 帧须回写权威计数');
  assert.ok(SHEET.includes('nameGateRef'), '客户端唤名门锚须在场（极值情绪＋配额未满才带名）');
  assert.ok(SHEET.includes('extremeMoodForName'), '客户端须消费极值情绪门函数');
});

/* ── E142.1-锁D：穿搭零品牌锁（VM 实跑＋源码零命中）── */

/** VM 抽取式：E1421_BRAND_RE 常量＋_e1421BrandWash 函数体（铁律：new Function 参数包裹） */
function vmE1421BrandWash() {
  const reM = SERVER.match(/const E1421_BRAND_RE = [^\n]+;/);
  assert.ok(reM, 'server.js 须含 E1421_BRAND_RE 品牌黑名单（锁D 服务端闸门）');
  const fnM = SERVER.match(/function _e1421BrandWash\(text\) \{[\s\S]*?\n\}/);
  assert.ok(fnM, 'server.js 须含 _e1421BrandWash 清洗函数');
  const body = `${reM[0]}\n${fnM[0].replace(/^function _e1421BrandWash\(text\) \{/, '').replace(/\n\}$/, '')}`;
  return new Function('text', body);
}

test('E142.1-锁D1 品牌清洗 VM 实跑：黑名单全词清洗＋U 系尾缀连带＋双空格归一＋正常文本无损', () => {
  const wash = vmE1421BrandWash();
  // ① 中文品牌＋U 系尾缀连带清洗
  const zh = wash('可以去翻优衣库U系列的素色衬衫，配麻质长裤。');
  assert.ok(!zh.includes('优衣库') && !zh.includes('U系'), `中文品牌须洗净（实测=${zh}）`);
  assert.ok(zh.includes('素色衬衫'), '正常文案须保留');
  // ② 西文品牌（含 \bCOS 边界）清洗
  const en = wash('A crisp COS shirt or the Uniqlo U line in linen works.');
  assert.ok(!/\bCOS\b/.test(en) && !en.includes('Uniqlo'), `西文品牌须洗净（实测=${en}）`);
  // ③ 双空格归一（清洗后残缝）
  const spaced = wash('去翻 COS 的素色衬衫');
  assert.ok(!spaced.includes('  '), `清洗后双空格须归一（实测=${spaced}）`);
  // ④ 无品牌文本零扰动＋非串/空串透传
  assert.equal(wash('素色立领麻质衬衫，配厚磅针织'), '素色立领麻质衬衫，配厚磅针织', '零品牌文本须无损');
  assert.equal(wash(''), '', '空串透传');
  assert.equal(wash(null), null, 'null 透传');
});

test('E142.1-锁D2 源码零品牌锁：前端词库/组件零命中；server 品牌词仅存活于黑名单正则与注释', () => {
  // COS 三字母子串撞西语 COSTA ⇒ 用词边界正则；其余长词用 includes
  const BRANDS = ['优衣库', 'Uniqlo', '无印良品', 'MUJI', 'Zara', 'Lululemon', '露露乐蒙', 'Everlane', 'Aritzia'];
  const hasBrand = (src) => BRANDS.some((b) => src.includes(b)) || /\bCOS\b/.test(src);
  // ① 前端词库（companionWhisper 耳语面）零命中
  const muse = read('web/src/lib/lifestyleMuseData.mjs');
  assert.ok(!hasBrand(muse), 'lifestyleMuseData 严禁残留品牌（词边界 COS）');
  // ② ChatSheet 组件零命中
  assert.ok(!hasBrand(SHEET), 'FamiliarChatSheet 严禁残留品牌（词边界 COS）');
  // ③ server.js：品牌词存活行须为 E1421_BRAND_RE 定义行或 E142.1 注释/清洗块内行
  const lines = SERVER.split('\n');
  lines.forEach((ln, i) => {
    if (BRANDS.some((b) => ln.includes(b)) || /\bCOS\b/.test(ln)) {
      const isComment = /^\s*(\/\*|\*|\/\/)/.test(ln);
      assert.ok(isComment || ln.includes('E1421_BRAND_RE') || ln.includes('E142.1') || ln.includes('BrandWash'),
        `server.js L${i + 1} 品牌词仅许存活于 E142.1 清洗黑名单/注释（实测行=${ln.slice(0, 80)}`);
    }
  });
  // ④ emitDelta 唯一出流口前置清洗（主流/续写/降级/重试全路径覆盖）
  // 🆕 E143 后继化：品牌清洗后串联星灵封印清洗（机械腔＋内部标识脱敏——
  //    E142.1 品牌清洗仍为首层，双空格归一收口不变）
  assert.ok(/delta: _e1421BrandWash\(_e143VeilWashSync\(_e143Veil, t\)\)/.test(SERVER) || SERVER.includes('delta: _e1421BrandWash(t)')
    || /delta: _e144BreathingSplitSync\(_e144Rhythm, _e1421BrandWash\(_e143VeilWashSync\(_e143Veil, t\)\)\)/.test(SERVER)
    // 🆕 E147 后继化：四层串联（E147 出流守卫插在品牌清洗外层——餐饮零地名/反季面料）
    || /delta: _e144BreathingSplitSync\(_e144Rhythm, _e147OutWashSync\(_e147Guard, _e1421BrandWash\(_e143VeilWashSync\(_e143Veil, t\)\), _e147ColdClimate\)\)/.test(SERVER),
    'emitDelta 须前置品牌清洗（全路径收口；E143 串联/E144 三层/E147 四层包裹形态亦可）');
});

/* ── E142.1-锁E：零故障注入财富沙盒锁（会话档位解锁键）── */

test('E142.1-锁E1 会话档位键 roundtrip：mark⇒is 同档放行异档拒＋reset 双键清＋坏档容错', () => {
  const store = mockStorage();
  // ① mark ⇒ is（档位隔离）
  assert.equal(ST.isWealthTierSessionUnlocked(store, 'monthly'), false, '未标记 ⇒ 锁定');
  ST.markWealthTierSessionUnlocked(store, 'monthly');
  assert.equal(ST.isWealthTierSessionUnlocked(store, 'monthly'), true, '标记月报 ⇒ 解锁');
  assert.equal(ST.isWealthTierSessionUnlocked(store, 'yearly'), false, '月报标记不外溢年报（档位隔离）');
  ST.markWealthTierSessionUnlocked(store, 'yearly');
  assert.equal(ST.isWealthTierSessionUnlocked(store, 'yearly'), true, '标记年报 ⇒ 解锁');
  // ② reset 双键清（重置沙盒演练联动）
  ST.resetWealthTierSessionUnlocks(store);
  assert.equal(ST.isWealthTierSessionUnlocked(store, 'monthly'), false, 'reset 后月报须重锁');
  assert.equal(ST.isWealthTierSessionUnlocked(store, 'yearly'), false, 'reset 后年报须重锁');
  // ③ 坏形状容错（fail-closed）
  assert.equal(ST.isWealthTierSessionUnlocked(null, 'monthly'), false, 'null store ⇒ 锁定');
  assert.equal(ST.isWealthTierSessionUnlocked(store, 'bogus'), false, '非白名单档 ⇒ 锁定');
  ST.markWealthTierSessionUnlocked(null, 'monthly'); // 静默不抛
});

test('E142.1-锁E2 年鉴门改走会话键源码锚：IIFE 门控替代 paid_plans 免付短路＋付讫双标记＋重置联动', () => {
  // ① 年鉴门：绿道或会话档位键（财富月/年报对齐姻缘沙盒契约）
  assert.ok(WRP.includes("const _canMonthly = _greenChannel || isWealthTierSessionUnlocked(_e1421SessStore, 'monthly');"),
    '月报门须走会话档位键（废除 paid_plans 跨测算免付短路）');
  assert.ok(WRP.includes("const _canYearly = _greenChannel || isWealthTierSessionUnlocked(_e1421SessStore, 'yearly');"),
    '年报门须走会话档位键');
  // ② 免付短路废除：paid_plans wealth_monthly/yearly 真值不再直通年鉴门
  const iife = WRP.slice(WRP.indexOf('_canMonthly ='), WRP.indexOf('_canMonthly =') + 900);
  assert.ok(!iife.includes('wealthEntitledFor'), '年鉴 IIFE 门严禁 wealthEntitledFor 免付短路（E142.1 刀三）');
  // ③ 付讫双标记（沙盒授予路径全收口）
  const marks = (WRP.match(/markWealthTierSessionUnlocked\(/g) || []).length;
  assert.ok(marks >= 2, `付讫标记须 ≥2 处（applyWealthGrant＋runUpgradeSandboxPay；实测 ${marks}）`);
  // ④ 重置沙盒演练联动清档位键
  assert.ok(WRP.includes('resetWealthTierSessionUnlocks('), '重置演练须联动清会话档位键');
  // ⑤ sandboxTester 三函数与键名真源
  const stSrc = read('web/src/lib/sandboxTester.mjs');
  assert.ok(stSrc.includes("'ks_wealth_monthly_unlocked'"), '月报会话键名真源');
  assert.ok(stSrc.includes("'ks_wealth_yearly_unlocked'"), '年报会话键名真源');
});
