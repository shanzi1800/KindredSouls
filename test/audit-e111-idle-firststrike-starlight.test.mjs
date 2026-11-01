/**
 * audit-e111-idle-firststrike-starlight.test.mjs —— E111 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E111：PC端灵宠活体动效打磨 · 对话舱首语情境破冰 · 灵犀星每日留存系统】
 * 三刀八段（源码级 + 六语资产级，不烧算力、不连外网）：
 *   刀一（S1~S3）：Sophia 踩奶式微拱背待机动效（双爪不离宝石 scale 0.96/背抬
 *     -3px/闭眼月牙/粉金呼吸光 2.4s）＋Milo 尾尖轻扬＋金色星芒粒子；35~45s
 *     JS 调度；趴键几何基准（E65g/E82）绝对不动。
 *   刀二（S4~S6）：对话舱首语彻底拔除「幸运色/数字」复读 ⇒ 合盘情境第一击
 *     （恋人牌/三合→甜句；六冲/低分→慰句；当日首开或带路回首页触发一次）。
 *   刀三（S7~S8）：微运势卡负向闸门（永不复活）＋每日灵犀星打卡
 *     （localStorage.ks_starlight_count {count, day}，身侧徽章＋+1 飘字）。
 * 🔴 纪律：新增段随 test:astro 全量入编（e110 之后、e40-compat 收口位之前）；
 *    i18n 基准 112 → 115（chatHelloSoothe/starBadge/starGain 三键）已同步。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/* ═══════════ 刀一：待机活体微动效 ═══════════ */

test('E111 S1 刀一调度器：待机触发活体循环 2.4s（E113 后继：首触发 15~20s、后续 25~30s；reduced-motion 静默）', () => {
  const s = read('web/src/components/FamiliarHomeCard.tsx');
  // ① JS 调度器在场：E112-刀一 军令真值——首触发 15~20s（idleFirstRef）；
  //    E113-刀一 后继：后续循环 25~30s 恒定（军令钦定区间）
  assert.ok(s.includes('scheduleIdle'), '缺待机调度器 scheduleIdle');
  assert.ok(/15000 \+ Math\.floor\(Math\.random\(\) \* 5001\)/.test(s), '首触发区间须为 15~20s（E112 军令真值）');
  assert.ok(/25000 \+ Math\.floor\(Math\.random\(\) \* 5001\)/.test(s), '后续循环须为 25~30s（E113 军令钦定区间）');
  assert.ok(s.includes('idleFirstRef'), '缺首触发标记 idleFirstRef');
  assert.ok(s.includes('2400'), '活体循环时长须为 2.4s（军令真值）');
  // ② 交互重置：点灵宠（tapFamiliar）与开舱 CTA 都重置计程
  assert.ok(/scheduleIdle\(\); \/\/ 🌟 E111-刀一：点触＝交互/.test(s), '点灵宠未重置待机计程');
  assert.ok(/scheduleIdle\(\); setChatOpen\(true\)/.test(s), '开舱 CTA 未重置待机计程');
  // ③ reduced-motion 降级：matchMedia 判定 ⇒ 不播（用户偏好优先）
  assert.ok(s.includes("window.matchMedia('(prefers-reduced-motion: reduce)').matches"), '缺 reduced-motion 静默降级');
  // ④ idle 态 class 挂 breakout（摘除即回落，禁卸载抖动）
  assert.ok(/\$\{idleAct \? ' ks-fam-idle' : ''\}/.test(s), 'idle class 未挂 breakout');
});

test('E111 S2 刀一动效层：Sophia 踩奶拱背＋宝石粉金光 / Milo 尾摆＋星芒气泡（E113 后继：2.4s 全家·振幅再强化版）', () => {
  const css = read('web/src/App.css');
  // ① Sophia 踩奶微拱背：scale 0.96 ＋ 背抬 -10px（E113 军令强化真值）覆盖 breathe 层
  assert.ok(css.includes('ksFamSophiaKnead'), '缺 Sophia 踩奶拱背动画');
  const knead = (css.match(/@keyframes ksFamSophiaKnead \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/scale\(0\.96\)/.test(knead), '踩奶微压须 scale 0.96（双爪不离宝石）');
  assert.ok(/translateY\(-10px\)/.test(knead), '背抬须 -10px（E113 军令强化真值）');
  assert.ok(css.includes('.ks-fam-sophia.ks-fam-idle .ks-fam-breathe'), '踩奶动画未挂 breathe 层（禁动几何层）');
  // ② 闭眼月牙：idle 期 blink 层常态显（Sophia＋Milo 坏笑眯眼双挂）
  assert.ok(css.includes('ksFamIdleBlink'), '缺 idle 闭眼月牙动画');
  assert.ok(css.includes('.ks-fam-sophia.ks-fam-idle .ks-fam-img-blink'), '闭眼未挂 blink 叠加层');
  assert.ok(css.includes('.ks-fam-milo.ks-fam-idle .ks-fam-img-blink'), 'Milo 坏笑眯眼未挂 blink 叠加层（E112 少年气）');
  // ③ 宝石微光（E113 强化）：多层 drop-shadow 高光脉冲＋与 gem 命中区同框
  assert.ok(css.includes('ksFamGemGlow'), '缺宝石呼吸光动画');
  const glow = (css.match(/@keyframes ksFamGemGlow \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/drop-shadow\(0 0 20px rgba\(244, ?184, ?206, ?1\)\)/.test(glow), '缺第一层高光 drop-shadow 20px 1（E113 军令真值）');
  assert.ok(/drop-shadow\(0 0 35px rgba\(232, ?199, ?154, ?0\.85\)\)/.test(glow), '缺第二层粉金光 drop-shadow 35px 0.85（E113 军令真值）');
  assert.ok(/\.ks-fam-gemglow\s*\{[^}]*left: 17\.9%[^}]*top: 35\.4%[^}]*width: 28\.3%/.test(css), 'gemglow 须与 gem 命中区同框（E65 真值）');
  // ④ Milo 尾巴大弧度甩动 22deg 弹性阻尼回弹（E113 军令）＋星芒气泡 22px 晶蓝金边→斜上漂 50px 破裂 5 金尘（E114-刀三 后继）
  assert.ok(css.includes('ksFamMiloTailFlick'), '缺 Milo 尾摆动画');
  assert.ok(/rotate\(22deg\)/.test(css) && /rotate\(-9deg\)/.test(css), '尾摆须 22deg＋弹性回弹（E113 军令钦定）');
  assert.ok(css.includes('.ks-fam-milo.ks-fam-idle .ks-fam-tail'), '尾摆未挂尾层');
  assert.ok(css.includes('ksFamPopBub'), '缺星芒气泡动画（E112 少年活力神态）');
  assert.ok(css.includes('ksFamPopDust'), '缺气泡破裂金尘动画');
  assert.ok(/\.ks-fam-pop\s*\{[^}]*width: 22px;[\s\S]{0,120}height: 22px/.test(css), '星芒气泡须 22px（E114-刀三 军令钦定 14→22px）');
  // ⑤ 光效层物理穿透（pointer-events:none 铁律不破）
  assert.ok(/\.ks-fam-gemglow\s*\{[^}]*pointer-events: none/.test(css), 'gemglow 缺 pointer-events:none');
  assert.ok(/\.ks-fam-pop\s*\{[^}]*pointer-events: none/.test(css), 'pop 气泡缺 pointer-events:none');
  // ⑥ reduced-motion：E111/E112 层全部降级
  assert.ok(/\.ks-fam-gemglow, \.ks-fam-pop \{ display: none; \}/.test(css), 'reduced-motion 缺光效层静默');
});

test('E111 S3 刀一几何不变式：趴键基准（E65g/E82）绝对不动——idle 动效只叠加子层', () => {
  const css = read('web/src/App.css');
  // ① 趴键几何真值逐字在位（E111 前后零漂移）
  assert.equal((css.match(/width: min\(98px, 70%\)/g) || []).length, 2, '体型锁 98px 双在（E82 契约）');
  assert.ok(css.includes('left: calc(44% - 62.3px)'), 'Milo 球心锚漂移');
  assert.ok(css.includes('left: calc(56% - 35.3px)'), 'Sophia 球心锚漂移');
  assert.ok(css.includes('translateY(calc(38.9% + 6px))'), 'Milo 趴键 translateY 漂移');
  assert.ok(css.includes('translateY(calc(39.2% + 6px))'), 'Sophia 趴键 translateY 漂移');
  // ② E111 新增规则禁触碰 breakout 顶层几何：idle 规则块内禁 left/width/translateY 布局改写
  for (const m of css.match(/\.ks-fam-(?:milo|sophia)\.ks-fam-idle [^{]*\{[^}]*\}/g) || []) {
    assert.ok(!/[\s;](left|width|margin):/.test(m), `idle 规则禁改布局几何（只准动子层动画）：${m.slice(0, 80)}`);
  }
  // ③ 组件侧：E111/E112 渲染层为纯叠加（gemglow/pop/span），禁触碰 img/尾层结构
  const s = read('web/src/components/FamiliarHomeCard.tsx');
  // 🏆 E114-刀五 后继化：gemglow 渲染条件扩为 idleAct || chatLive（SSE 吐字期 4Hz 共鸣常驻）
  assert.ok(/\(idleAct \|\| chatLive\) && ip === 'Sophia' && <span className="ks-fam-gemglow"/.test(s), 'gemglow 渲染层缺失');
  assert.ok(/idleAct && ip === 'Milo' && \(\s*<span className="ks-fam-pop"/.test(s), 'Milo 星芒气泡渲染层缺失（E112）');
  assert.ok(/ks-fam-pop-dust/.test(s), '气泡破裂金尘粒子层缺失（E112）');
});

/* ═══════════ 刀二：对话舱首语情境破冰 ═══════════ */

test('E111 S4 刀二前端：helloFor 三分支装配＋当日首开一次契约（greetingVars 复读通道物理拔除）', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  // ① 三分支首语装配器（甜/慰/中性）
  assert.ok(sheet.includes('helloFor'), '缺 helloFor 情境首语装配器');
  for (const k of ['chatHello', 'chatHelloSoothe', 'chatHelloPlain']) {
    assert.ok(sheet.includes(`t('familiar.${k}'`), `首语三分支缺 ${k}`);
  }
  // ② 当日首开一次：ks_familiar_firststrike_day 日标记（同日再开 ⇒ plain）
  assert.ok(sheet.includes('ks_familiar_firststrike_day'), '缺当日首开日标记');
  assert.ok(/sessionStorage\.getItem\(key\) === day\) mode = 'plain'/.test(sheet), '同日再开未回退 plain（军令「随后进入自由多轮」）');
  // ③ 复读通道物理拔除：greetingVars（dailyFortune color/num 注入）严禁回潮
  assert.ok(!sheet.includes('greetingVars'), 'greetingVars 复读通道回潮（E111 军令死罪）');
  // ④ props 契约：greetingMode 分支真值
  assert.ok(/greetingMode\?: 'sweet' \| 'soothe' \| 'plain'/.test(sheet), '缺 greetingMode props 契约');
});

test('E111 S5 刀二引擎：Context First-Strike 判定真值（恋人牌/三合六合→甜；六冲/低分→慰）', () => {
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  // ① 判定引擎在场：塔罗恋人（id 6）＋三合/六合甜核
  assert.ok(card.includes('chatGreetingMode'), '缺 chatGreetingMode 判定引擎');
  assert.ok(/Number\(rt\.id\) === 6/.test(card), '缺恋人牌判定（id 6）');
  assert.ok(/m\.startsWith\('SANHE_'\)/.test(card) && card.includes("m === 'LIUHE_DAY_STEM'"), '缺三合局/天干六合甜核判定');
  // ② 慰核：六冲/日主相克/低分磨合（overall<70）
  assert.ok(/m\.startsWith\('LIUCHONG_'\)/.test(card) && card.includes("m === 'DM_CONTROL'"), '缺六冲/相克慰核判定');
  assert.ok(/overall < 70/.test(card), '缺低分磨合判定（overall<70）');
  // ③ 判定源＝当次报告 sessionStorage（一盘一清同 E109 契约）
  assert.ok(card.includes("sessionStorage.getItem('ks_compat_report_tarot')"), '甜核判定源缺报告塔罗档');
  assert.ok(card.includes("sessionStorage.getItem('ks_result')"), '判定源缺合盘结果档');
  // ④ 旧 chatGreeting（dailyFortune color/num 注入）通道严禁回潮
  assert.ok(!/const chatGreeting = React\.useMemo/.test(card), '旧 chatGreeting 复读通道回潮（E111 军令死罪）');
  assert.ok(!card.includes('greetingVars='), 'greetingVars 传参回潮');
});

test('E111 S6 刀二服务端：prompt 输出铁律第 8 条——禁主动复读幸运数字/颜色（主人问才答；E112 后继：报告情境优先）', () => {
  const s = read('server.js');
  const promptFn = s.slice(s.indexOf('function buildFamiliarChatSystemPrompt'));
  const body = promptFn.slice(0, 6000);
  assert.ok(/'8\. 开场与破冰优先结合主人最近解锁的报告或合盘情境/.test(body), '缺输出铁律第 8 条（E112 后继：报告情境破冰）');
  assert.ok(body.includes('严禁主动复读幸运数字、幸运色或贵人方位'), '缺禁复读硬约束');
  assert.ok(body.includes('主人主动问运势时才回答'), '缺「问才答」边界');
  // E111 交付后 prompt 六层结构仍在（人设锁/身份/本命/运势/塔罗/三合）
  for (const anchor of ['FAMILIAR_PERSONA_LOCK', '本命底牌', '今日运势真值', '今日塔罗真值']) {
    assert.ok(body.includes(anchor) || s.includes(anchor), `prompt 层 ${anchor} 缺失`);
  }
});

/* ═══════════ 刀三：微运势卡负向闸门＋每日灵犀星 ═══════════ */

test('E111 S7 刀三灵犀星：每日首点 +1（day 翻新）＋徽章归位对话舱＋飘字（E112 后继：ks_starlight_count）', () => {
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  // ① 存储契约：军令钦定 key ＋ {count, day} 形状守卫
  assert.ok(card.includes('ks_starlight_count'), '缺灵犀星存储 key（军令钦定 ks_starlight_count）');
  assert.ok(/localStorage\.getItem\('ks_starlight_count'/.test(card) && /localStorage\.setItem\('ks_starlight_count'/.test(card), '灵犀星读写双通道缺失');
  assert.ok(/Number\.isInteger\(raw\.count\)/.test(card), '缺形状守卫（count 整数）');
  // ② 每日 +1：day !== today 才加（同日复点不加）
  assert.ok(/st\.day !== today/.test(card), '缺每日判定（同日复点不加）');
  assert.ok(/count: st\.count \+ 1/.test(card), '缺 +1 逻辑');
  // ③ 渲染层（E112 后继）：徽章归位对话舱 Header（✕ 左侧）＋首页飘字保留；
  //    首页身侧旧徽章物理拆除（主公实机验收「贴在开始测算按钮下方」实锤）
  assert.ok(/className="ks-chat-star"[^>]*data-testid="familiar-starlight"/.test(sheet), '对话舱 Header 缺灵犀星徽章（familiar-starlight）');
  assert.ok(sheet.includes("t('familiar.starBadge'"), '徽章未走 i18n 字典');
  assert.ok(/data-testid="familiar-star-gain"/.test(card), '缺 +1 飘字（familiar-star-gain）');
  assert.ok(card.includes("t('familiar.starGain'"), '飘字未走 i18n 字典');
  assert.ok(!card.includes('ks-fam-starbadge'), '首页身侧旧徽章残留（E112-刀三 物理拆除令）');
  assert.ok(/starCount=\{starCount\}/.test(card), 'starCount 未传对话舱（徽章真值断链）');
  // ④ CSS（E112 后继）：对话舱胶囊徽章＋首页飘字上飘消散 2.2s（均 pointer-events:none）
  const css = read('web/src/App.css');
  assert.ok(/\.ks-chat-star\s*\{[^}]*pointer-events: none/.test(css), '对话舱徽章缺 pointer-events:none');
  assert.ok(css.includes('.ks-chat-star'), '缺对话舱灵犀星胶囊样式（E112-刀三 归位）');
  assert.ok(/\.ks-fam-starfloat\s*\{[^}]*pointer-events: none/.test(css), '飘字缺 pointer-events:none');
  assert.ok(css.includes('ksFamStarFloat'), '缺飘字上飘消散动画');
});

test('E111 S8 刀三负向：微运势卡永不复活＋六语三键入列＋链位自保（e110 后、e40-compat 前）', () => {
  // ① 微运势卡（E107 居中大 Modal 幸运卡，E108 已废）严禁生成/展示/下载代码回潮
  const app = read('web/src/App.tsx');
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  for (const src of [app, card]) {
    assert.ok(!/download.*微运势|微运势.*download/i.test(src), '微运势卡下载代码回潮');
    assert.ok(!/fortuneCard|miniFortune/i.test(src), '微运势卡组件残留（功能重叠：金卡＋锦囊已覆盖）');
  }
  // 居中大 Modal「今日幸运卡片」断头台：breakout 外不得再有 luck card 容器渲染
  assert.ok(!/<div className="ks-luck-modal/.test(card), 'E107 居中幸运卡 Modal 回潮（E108 已物理废除）');

  // ② 六语三键（chatHelloSoothe/starBadge/starGain）在场非空＋chatHello 恒为军令甜句原文
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    for (const k of ['chatHelloSoothe', 'starBadge', 'starGain']) {
      assert.ok(typeof o.familiar[k] === 'string' && o.familiar[k].length > 0, `${l}.json 缺 familiar.${k}`);
    }
    assert.ok(o.familiar.starBadge.includes('{{count}}'), `${l} starBadge 缺 {{count}} 插值`);
  }
  const zh = JSON.parse(read('web/src/i18n/locales/zh.json'));
  // 🏆 E114-刀一 后继化：chatHello 硬编码《恋人》已拔除改 {{tarotCard}} 动态插值
  assert.ok(zh.familiar.chatHello.includes('{{tarotCard}}'), 'zh chatHello 须含 {{tarotCard}} 动态插值（E114 军令钦定）');
  assert.ok(zh.familiar.chatHelloSoothe.includes('磨合'), 'zh chatHelloSoothe 须含磨合规慰核（军令钦定慰句）');

  // ③ 链位自保：E111 闸门挂入 test:astro（e110 之后、收口位 e40-compat 之前；
  //    e40 恒 len-2、python 恒链尾——入编后全链 86 段）
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i111 = segs.findIndex((x) => x.includes('audit-e111-idle-firststrike-starlight'));
  const i110 = segs.findIndex((x) => x.includes('audit-e110-persona-lock-focus'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((x) => x.trim().startsWith('python3'));
  assert.notEqual(i111, -1, 'E111 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i110 < i111 && i111 < iCap, 'E111 须按序排在 e110 之后、收口位之前（E 版本序铁律）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
});
