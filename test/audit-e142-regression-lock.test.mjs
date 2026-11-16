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

/** VM 抽取式：从 server.js 源码抽 _e142ClientTime 函数体实跑（铁律：new Function 参数包裹） */
function vmE142ClientTime() {
  const m = SERVER.match(/function _e142ClientTime\(v\) \{[\s\S]*?\n\}/);
  assert.ok(m, 'server.js 须含 _e142ClientTime 形状守卫（锁5 服务端闸门）');
  return new Function('v', m[0].replace(/^function _e142ClientTime\(v\) \{/, '').replace(/\n\}$/, ''));
}

/* ═══ 锁1：话题队列防退化锁（首句 P1+P2 双串联，严禁冷启动兜底）═══ */

test('E142-锁1a P1+P2 双串联：姻缘核心报告+低落情绪 ⇒ 首句含塔罗/姻缘特征词＋情绪特征词，非兜底语', () => {
  const q = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'love', tier: 'core' }, activeMood: 'melancholy', lang: 'zh',
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

test('E142-锁1c 隔日持久锚：报告档在场（不限当日）⇒ 首句恒含 P1 话题（六语全覆盖）', () => {
  for (const lang of LANGS) {
    for (const [cat, tier] of [['love', 'core'], ['love', 'monthly'], ['love', 'annual'],
      ['wealth', 'core'], ['wealth', 'monthly'], ['wealth', 'annual']]) {
      const q = TQ.resolveCompanionGreetingAndQueue({ recentReport: { category: cat, tier }, activeMood: null, lang });
      assert.ok(q && q.firstLine && q.firstLine.length > 10, `六档六语首句须产出 lang=${lang} ${cat}_${tier}`);
    }
  }
});

test('E142-锁1d 合成器兜底红线：无 P1 无 P2 ⇒ null（绝不臆造兜底句）；纯 P2 亦可单发', () => {
  assert.equal(TQ.resolveCompanionGreetingAndQueue({ recentReport: null, activeMood: null, lang: 'zh' }), null);
  const q = TQ.resolveCompanionGreetingAndQueue({ recentReport: null, activeMood: 'radiant', lang: 'zh' });
  assert.ok(q && q.firstLine, '纯 P2 情绪句须产出');
  assert.ok(!q.firstLine.startsWith('...') && !q.firstLine.startsWith('…'), '纯 P2 不得带省略号前缀');
});

test('E142-锁1e 消费端源码锚：FamiliarChatSheet 挂 p1queue 模式＋隔日 P1 持久分支＋合成器消费', () => {
  assert.ok(SHEET.includes("'p1queue'"), 'HelloMode 须含 p1queue');
  assert.ok(SHEET.includes('resolveCompanionGreetingAndQueue'), 'helloFor 须消费合成器');
  assert.ok(/else if \(rr && normalizeReportKey\(rr\)\)/.test(SHEET), '须含隔日 P1 持久锚分支（严禁跌回兜底）');
  assert.ok(SHEET.includes("mode = (_e142Mood && normalizeReportKey(rr)) ? 'p1queue'"), '当日新解锁+情绪 ⇒ 须升级 P1+P2 串联');
});

/* ═══ 锁2：跨模块话题序锁（P1 报告话题恒首位；财富进则先天财富话题）═══ */

test('E142-锁2a 队列序：P1 恒首位、P2 情绪随其后（queue 数组契约）', () => {
  const q = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'wealth', tier: 'core' }, activeMood: 'agitated', lang: 'zh',
  });
  assert.deepEqual(q.queue, ['wealth_core', 'mood:agitated'], '财富进则队列首键=先天财富报告，情绪第二位');
  assert.ok(/财库/.test(q.firstLine), '财富 P1 首句须含先天财库特征词（八字财库）');
});

test('E142-锁2b 快捷话题胶囊序：P1 话题胶囊置首（塔罗/姻缘→先天财富），chatQ1/Q3 原样保留', () => {
  assert.ok(TQ.topicPillLabel({ category: 'love', tier: 'core' }, 'zh').includes('姻缘'), 'love P1 胶囊须落「塔罗/姻缘」序位');
  assert.ok(TQ.topicPillLabel({ category: 'wealth', tier: 'core' }, 'zh').includes('财库'), 'wealth P1 胶囊须落「先天财富」序位');
  for (const lang of LANGS) {
    assert.ok(TQ.topicPillLabel({ category: 'love', tier: 'monthly' }, lang), `love 胶囊六语 lang=${lang}`);
    assert.ok(TQ.topicPillLabel({ category: 'wealth', tier: 'annual' }, lang), `wealth 胶囊六语 lang=${lang}`);
  }
  assert.equal(TQ.topicPillLabel(null, 'zh'), null, '无 P1 ⇒ 胶囊不出场（现行为零破坏）');
  const pillAnchor = SHEET.match(/const pills = _e142P1Pill\s*\?\s*\[_e142P1Pill, t\('familiar\.chatQ1'\), t\('familiar\.chatQ3'\)\]/);
  assert.ok(pillAnchor, 'pills 组装须 P1 胶囊置首（军令钦定有序展开）');
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
    recentReport: { category: 'love', tier: 'core' }, activeMood: 'melancholy', lang: 'zh', userName: '江山',
  });
  assert.ok(q.firstLine.startsWith('江山，'), 'zh 姓名前缀「江山，」');
  const qEn = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'wealth', tier: 'core' }, activeMood: null, lang: 'en', userName: 'North',
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
