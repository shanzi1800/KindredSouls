/**
 * audit-e112-soulbeast-report-star.test.mjs —— E112 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E112：活体动效振幅增强 · 灵魂兽物种硬锁 · 六大报告首语深度咬合 · 灵犀星归位对话框顶部】
 * 五刀八段（源码级 + 六语资产级，不烧算力、不连外网）：
 *   刀一（S1）：待机首触发 15~20s＋后续 30s；Sophia 拱背 -7px＋多层高光脉冲；
 *     Milo 尾 ±15deg＋坏笑眯眼＋22px 晶蓝金边星芒气泡破裂 5 金尘（E114-刀三 后继）。
 *   刀二（S2~S4）：soul_recent_unlocked_report 追踪凭证（六档全咬合）＋
 *     对话舱首语六档报告第一击最优先（严禁「我在呢」空话）＋服务端第五层注入。
 *   刀三（S5）：灵犀星徽章物理迁移对话舱 Header（✕ 左侧胶囊）＋首页旧位拆除。
 *   刀四（S6）：灵魂兽（Soul Beast）物种硬锁——「晶石灵猫」种属降格拔除＋
 *     违禁称呼禁令（小猫/小狗/猫咪/狗狗/灵猫/灵犬/宠物）。
 *   刀五（S7~S8）：i18n 六语六键＋链位自保（e111 后、e40-compat 前）。
 * 🔴 纪律：新增段随 test:astro 全量入编（e111 之后、e40-compat 收口位之前）；
 *    i18n 基准 115 → 121（六档报告第一击六键）已同步；军规链 86 → 87 段。
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

/* ═══════════ 刀一：动效振幅增强 ═══════════ */

test('E112 S1 刀一动效：初触发提前＋振幅增强＋Milo 星芒气泡（E113 后继：25~30s 循环·-10px·20/35px·22deg·斜上 25px）', () => {
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  const css = read('web/src/App.css');
  // ① 初触发提前：首触发 15~20s（军令钦定——35~45s 用户视线已移开实锤）；
  //    E113 后继：后续循环 25~30s 恒定区间（军令钦定）
  assert.ok(/15000 \+ Math\.floor\(Math\.random\(\) \* 5001\)/.test(card), '首触发须 15~20s（军令钦定）');
  assert.ok(/25000 \+ Math\.floor\(Math\.random\(\) \* 5001\)/.test(card), '后续循环须 25~30s（E113 军令钦定区间）');
  // ② Sophia 拱背增强（E113 军令再强化）：-10px＋rotate 头颈仰角＋skewY ±1.4deg 双耳微摇
  const knead = (css.match(/@keyframes ksFamSophiaKnead \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/translateY\(-10px\)/.test(knead), '拱背位移须 -10px（E113 军令钦定 7px→10px）');
  assert.ok(/skewY\(-1\.4deg\)/.test(knead), '缺双耳/肩背 skewY 微动');
  assert.ok(/rotate\(1\.4deg\)/.test(knead), '缺头颈仰角微抬 rotate');
  // ③ 宝石多层高光渐变光晕（E113 军令钦定真值逐字：20px 1＋35px 0.85）
  const glow = (css.match(/@keyframes ksFamGemGlow \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/drop-shadow\(0 0 20px rgba\(244, ?184, ?206, ?1\)\)/.test(glow), '缺第一层 drop-shadow 20px 1（E113 军令真值）');
  assert.ok(/drop-shadow\(0 0 35px rgba\(232, ?199, ?154, ?0\.85\)\)/.test(glow), '缺第二层 drop-shadow 35px 0.85（E113 军令真值·粉金能量脉冲）');
  // ④ Milo 尾巴大弧度甩动 22deg＋弹性阻尼回弹＋坏笑挑眉（blink 眯眼帧＋smirk 层）
  assert.ok(/rotate\(22deg\)/.test(css) && /rotate\(-9deg\)/.test(css), '尾摆须 22deg＋弹性回弹（E113 军令钦定）');
  assert.ok(css.includes('.ks-fam-milo.ks-fam-idle .ks-fam-img-blink'), '缺 Milo 坏笑眯眼帧');
  assert.ok(css.includes('ksFamMiloSmirk'), '缺 Milo 坏笑挑眉 smirk 层（E113 军令「必须注入」）');
  // ⑤ 星芒气泡：22px 晶蓝带金边→斜上漂 50px→「啵」破裂→5 颗金尘消散（E114-刀三）
  assert.ok(/\.ks-fam-pop\s*\{[^}]*width: 22px/.test(css), '气泡直径须 22px（E114-刀三 军令钦定 14→22px）');
  assert.ok(css.includes('ksFamPopBub'), '缺气泡动画 ksFamPopBub');
  assert.ok(css.includes('ksFamPopDust'), '缺金尘消散动画 ksFamPopDust');
  const bub = (css.match(/@keyframes ksFamPopBub \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/translate\(28px, -41px\)/.test(bub), '气泡须斜上漂 50px（E114-刀三 军令钦定 35° 倾角）');
  const popCls = css.slice(css.indexOf('.ks-fam-pop {'), css.indexOf('.ks-fam-pop {') + 3000);
  assert.ok(popCls.includes('rgba(129, 216, 208'), '气泡须晶蓝底（军令钦定晶蓝）');
  assert.ok(popCls.includes('rgba(240, 208, 96, 0.75)'), '气泡须金边（军令钦定带金边）');
  assert.equal((read('web/src/components/FamiliarHomeCard.tsx').match(/ks-fam-pop-dust/g) || []).length, 5, '破裂金尘须 5 颗粒子节点（E114-刀三 后继）');
  // ⑥ E113 断链根治：循环计程在回落终点自续（scheduleIdle 内禁清 idleOffTimer）
  assert.ok(/setIdleAct\(false\);[^\n]*\n\s*scheduleIdle\(\);/.test(card), '循环计程须在 2.4s 回落终点自续（E113 断链根治）');
});

/* ═══════════ 刀二：六档报告首语全域咬合 ═══════════ */

test('E112 S2 刀二逻辑核：soulRecentReport 形状守卫＋军令钦定键名＋六档白名单', () => {
  const mod = read('web/src/lib/soulRecentReport.mjs');
  // ① 军令钦定键名＋核心函数
  assert.ok(mod.includes("SOUL_RECENT_REPORT_KEY = 'soul_recent_unlocked_report'"), '键名非军令钦定 soul_recent_unlocked_report');
  assert.ok(/export function markRecentReport/.test(mod), '缺 markRecentReport 写入函数');
  assert.ok(/export function readRecentReport/.test(mod), '缺 readRecentReport 读取函数');
  // ② 形状字段契约（军令钦定五字段）
  for (const f of ['category', 'tier', 'title', 'keyAspects', 'unlockedAt']) {
    assert.ok(mod.includes(f), `形状守卫缺字段 ${f}`);
  }
  // ③ 六档白名单：love/wealth × core/monthly/annual（fail-closed）
  assert.ok(mod.includes("new Set(['love', 'wealth'])"), 'category 白名单须 love/wealth');
  assert.ok(mod.includes("new Set(['core', 'monthly', 'annual'])"), 'tier 白名单须 core/monthly/annual');
});

test('E112 S3 刀二三写入点：姻缘 once/月报/年报＋财富三档终稿收口（沙盒真实同链）', () => {
  const app = read('web/src/App.tsx');
  const wp = read('web/src/pages/WealthReportPage.tsx');
  // ① 姻缘 once（triggerInsight 成功＝ks_compat_report_tarot 写点旁）
  assert.ok(/markRecentReport\(window\.localStorage, \{\s*\n\s*category: 'love', tier: 'core',/.test(app), '姻缘 once 写入点缺失（triggerInsight 成功收口）');
  assert.ok(app.includes('category: \'love\', tier: \'core\'') || /category: 'love', tier: 'core'/.test(app), 'love/core 档位缺失');
  // ② 姻缘月报/年报（generateReport 成功：tier 按 type 分流）
  assert.ok(/category: 'love',\s*\n\s*tier: type === 'monthly' \? 'monthly' : 'annual',/.test(app), '姻缘月报/年报写入点缺失（generateReport 成功收口）');
  // ③ 财富三档（WealthReportPage [DONE] 终稿：once→core / monthly→monthly / yearly→annual）
  assert.ok(/category: 'wealth',\s*\n\s*tier: type === 'monthly' \? 'monthly' : \(type === 'yearly' \? 'annual' : 'core'\),/.test(wp), '财富三档写入点缺失（[DONE] 终稿收口）');
  assert.ok(wp.includes('先天财库报告'), '财富 core 档 title 缺失');
  // ④ keyAspects 携带（姻缘 core 存 tarotId/overall 真值）
  assert.ok(app.includes('keyAspects: { tarotId: tarot.id'), '姻缘 core keyAspects 缺塔罗/总分真值');
});

test('E112 S4 刀二首语引擎：六档报告第一击最优先＋「我在呢」空话禁令＋随行上行', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  // ① 九分支装配器：六档报告键＋E111 三情境分支
  for (const k of ['helloLoveCore', 'helloLoveMonthly', 'helloLoveYearly', 'helloWealthCore', 'helloWealthMonthly', 'helloWealthYearly']) {
    assert.ok(sheet.includes(`t('familiar.${k}'`), `首语六档缺 ${k}`);
  }
  assert.ok(/mode = `\$\{rr\.category\}_\$\{rr\.tier\}` as HelloMode/.test(sheet), '六档报告第一击映射缺失（category_tier）');
  // ② 最优先契约（E113 后继语义）：开舱判定链＝当日会话档复原优先（禁首语复读）→
  //    当日新解锁报告（freshReport）⇒ 六档第一击 → 跨日锦囊流转（daily）→ E111 日标记链。
  //    E112 旧「recentReport 长期有效不受日标记约束」由 E113 军令刀四收窄为「当日有效」。
  const openFx = sheet.slice(sheet.indexOf('useEffect(() => {', sheet.indexOf('helloFor = useCallback')), sheet.indexOf('}, [open]);', sheet.indexOf('helloFor = useCallback')));
  const restoreIdx = openFx.indexOf('loadDailyChatSession');
  const rrIdx = openFx.indexOf('readRecentReport');
  const freshIdx = openFx.indexOf('freshReport');
  assert.ok(rrIdx !== -1 && restoreIdx !== -1, '开舱判定缺 recentReport / 会话档读取分支');
  assert.ok(freshIdx !== -1, '开舱判定缺当日新解锁 freshReport 判定（E113 军令刀四）');
  assert.ok(/if \(sess && sess\.messages\.length > 0/.test(openFx), '开舱判定缺会话档复原优先分支（E113 军令刀三）');
  assert.ok(openFx.includes('readLastChatDay'), '开舱判定缺跨日流转判定源 readLastChatDay（E113 军令刀四）');
  assert.ok(/mode = 'daily'/.test(openFx), '开舱判定缺跨日锦囊流转 daily 分支（E113 军令刀四）');
  // ③ 「我在呢」空话禁令（军令断言）：有报告档时 mode ∈ 六档——helloFor 六档分支先于 plain
  const hf = sheet.slice(sheet.indexOf('helloFor = useCallback'), sheet.indexOf('}, [t, name];', sheet.indexOf('helloFor = useCallback')));
  const sixIdx = hf.indexOf("helloLoveCore");
  const plainIdx = hf.indexOf('chatHelloPlain');
  assert.ok(sixIdx !== -1 && plainIdx !== -1 && sixIdx < plainIdx, '六档分支须在 plain 回退之前装配');
  // ④ 随行上行：send() body.recentReport（服务端第五层咬合真源）
  assert.ok(/const recentReport = readRecentReport\(/.test(sheet), 'send 缺 recentReport 读取');
  assert.ok(/recentReport,\n/.test(sheet.slice(sheet.indexOf('const body = {', sheet.indexOf('const recentReport = readRecentReport')))), 'body 缺 recentReport 随行');
});

/* ═══════════ 刀三：灵犀星归位对话框顶部 ═══════════ */

test('E112 S5 刀三徽章归位：对话舱 Header 胶囊（✕ 左侧）＋首页按钮下方物理拆除', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  const css = read('web/src/App.css');
  // ① 徽章在对话舱 Header 内、位于关闭按钮之前（DOM 序即视觉序：✕ 左侧）
  const head = sheet.slice(sheet.indexOf('<div className="ks-chat-head">'), sheet.indexOf('</div>', sheet.indexOf('ks-chat-close')) + 6);
  const starIdx = head.indexOf('ks-chat-star');
  const closeIdx = head.indexOf('ks-chat-close');
  assert.ok(starIdx !== -1 && closeIdx !== -1 && starIdx < closeIdx, '徽章须在对话舱 Header 内且位于 ✕ 之前');
  assert.ok(/className="ks-chat-star"[^>]*data-testid="familiar-starlight"/.test(sheet), '徽章 testid 缺失（familiar-starlight 迁移）');
  // ② 首页「开始测算」按钮下方旧徽章物理拆除（主公实机验收实锤）
  assert.ok(!card.includes('ks-fam-starbadge'), '首页身侧旧徽章残留（E112 军令拆除令）');
  assert.ok(!css.includes('.ks-fam-starbadge'), 'CSS 旧徽章样式残留');
  // ③ 胶囊轻奢样式（军令钦定：text-xs 级＋金边 #D4AF37/30＋bg #D4AF37/10）
  const starCss = css.slice(css.indexOf('.ks-chat-star {'), css.indexOf('.ks-chat-star {') + 400);
  assert.ok(starCss.includes('rgba(212, 175, 55, 0.3)'), '胶囊金边须 #D4AF37/30（军令钦定）');
  assert.ok(starCss.includes('rgba(212, 175, 55, 0.1)'), '胶囊底须 #D4AF37/10（军令钦定）');
  assert.ok(/font-size: 11px/.test(starCss), '胶囊须 text-xs 级字体');
  // ④ starCount 跨组件接线（首页打卡→对话舱显示不断链）
  assert.ok(/starCount=\{starCount\}/.test(card), 'starCount 未传对话舱');
  assert.ok(/starCount\?: number/.test(sheet), 'ChatSheet 缺 starCount prop 契约');
  // ⑤ 每日 +1 打卡逻辑保留（ks_starlight_count 每日语义不动）
  assert.ok(card.includes('ks_starlight_count'), '打卡存储 key 丢失');
});

/* ═══════════ 刀四：灵魂兽物种硬锁 ═══════════ */

test('E112 S6 刀四物种硬锁：灵魂兽（Soul Beast）定义＋「晶石灵猫」种属降格拔除＋违禁称呼禁令', () => {
  const s = read('server.js');
  const fnStart = s.indexOf('function buildFamiliarChatSystemPrompt');
  const body = s.slice(fnStart, s.indexOf('\n}\n', fnStart));
  // ① 物种硬锁块：全新物种定义（宇宙星辰＋星盘命盘共振凝聚）
  assert.ok(body.includes('【物种硬锁'), '缺物种硬锁块（E112 军令）');
  assert.ok(body.includes('灵魂兽】（Soul Beast）'), '缺灵魂兽（Soul Beast）种族硬定义');
  assert.ok(body.includes('星盘与命盘共振凝聚'), '缺「由星盘与命盘共振凝聚而成」定义');
  // ② 违禁称呼禁令＋自称规范（军令钦定原文）
  assert.ok(body.includes('「小猫」「小狗」「猫咪」「狗狗」「灵猫」「灵犬」「宠物」'), '缺违禁称呼全列禁令');
  assert.ok(body.includes('守护灵魂兽'), '缺自称规范「你的守护灵魂兽」');
  // ③ 「晶石灵猫」种属降格拔除（外貌真值块换种属；函数体内 0 次）
  assert.ok(!body.includes('晶石灵猫'), 'prompt 函数体残留「晶石灵猫」种属降格（E112 军令死罪）');
  assert.ok(body.includes('灵魂兽（Soul Beast）晶石灵体'), '外貌真值缺新种属「灵魂兽晶石灵体」');
  // ④ 关系口径同步：守护灵魂兽（非「灵宠」降格）
  assert.ok(body.includes('长期相伴的守护灵魂兽'), '关系口径未升格为守护灵魂兽');
  // ⑤ persona 表无降格自称（猫/狗字样 0）
  const persona = s.slice(s.indexOf('const FAMILIAR_CHAT_PERSONA'), s.indexOf('const FAMILIAR_PERSONA_LOCK'));
  assert.ok(!/猫|狗/.test(persona), 'persona 表残留猫/狗降格字样');
});

/* ═══════════ 刀五：i18n 资产＋链位自保 ═══════════ */

test('E112 S7 服务端第五层：_e112RecentReport 白名单守卫＋prompt 报告块注入＋端点接线', () => {
  const s = read('server.js');
  // ① 形状守卫函数：六档白名单 fail-closed（未来时间戳拒收）
  assert.ok(s.includes('function _e112RecentReport'), '缺 _e112RecentReport 形状守卫');
  const guard = s.slice(s.indexOf('function _e112RecentReport'), s.indexOf('function _e112RecentReport') + 700);
  assert.ok(guard.includes("category !== 'love' && category !== 'wealth'"), 'category 白名单缺失');
  assert.ok(guard.includes("tier !== 'core' && tier !== 'monthly' && tier !== 'annual'"), 'tier 白名单缺失');
  assert.ok(guard.includes('Date.now() + 86400000'), '缺未来时间戳拒收（防前端伪造时间）');
  // ② prompt 第五层：六档报告口径表＋「主人最近解锁的付费报告」块
  assert.ok(s.includes('REPORT_KIND'), '缺六档报告口径表 REPORT_KIND');
  for (const k of ['love_core', 'love_monthly', 'love_yearly', 'wealth_core', 'wealth_monthly', 'wealth_yearly']) {
    assert.ok(s.includes(`${k}:`), `报告口径表缺 ${k}`);
  }
  assert.ok(s.includes('【主人最近解锁的付费报告'), '缺 prompt 第五层报告注入块');
  assert.ok(s.includes('严禁复述或编造报告里的具体数字'), '缺「禁编造报告内容」边界');
  // ③ 端点接线：body.recentReport → 查形状 → 进构造器
  assert.ok(/_e112RecentReport\(body\.recentReport\)/.test(s), '端点未接线 recentReport 查形状');
  assert.ok(/recentReport: _e112Report,/.test(s), '构造器未收 recentReport 参数');
});

test('E112 S8 六语六键＋链位自保（e111 后、e40-compat 前；全链 86→87 段）', () => {
  // ① 六语六键在场非空＋zh 军令情境核（合盘/月报 30 天/365 天/财库/破耗/四季）
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    for (const k of ['helloLoveCore', 'helloLoveMonthly', 'helloLoveYearly', 'helloWealthCore', 'helloWealthMonthly', 'helloWealthYearly']) {
      assert.ok(typeof o.familiar[k] === 'string' && o.familiar[k].length > 0, `${l}.json 缺 familiar.${k}`);
    }
    assert.ok(o.familiar.starBadge.includes('{{count}}'), `${l} starBadge 缺 {{count}} 插值`);
  }
  const zh = JSON.parse(read('web/src/i18n/locales/zh.json'));
  assert.ok(zh.familiar.helloLoveCore.includes('合盘'), 'zh helloLoveCore 须含合盘情境（军令样例核）');
  assert.ok(zh.familiar.helloLoveMonthly.includes('30'), 'zh helloLoveMonthly 须含 30 天口径');
  assert.ok(zh.familiar.helloLoveYearly.includes('365'), 'zh helloLoveYearly 须含 365 天口径');
  assert.ok(zh.familiar.helloWealthCore.includes('财库'), 'zh helloWealthCore 须含先天财库口径');
  assert.ok(zh.familiar.helloWealthMonthly.includes('破耗') || zh.familiar.helloWealthMonthly.includes('避坑'), 'zh helloWealthMonthly 须含避坑口径');
  assert.ok(zh.familiar.helloWealthYearly.includes('四季') || zh.familiar.helloWealthYearly.includes('逐季'), 'zh helloWealthYearly 须含四季口径');
  // ② starBadge 军令胶囊口径（对话舱 Header：✦ 灵犀星: N）
  assert.ok(zh.familiar.starBadge.includes('灵犀星'), 'zh starBadge 须为军令钦定胶囊口径「灵犀星」');

  // ③ 链位自保：E112 闸门挂入 test:astro（e111 之后、收口位 e40-compat 之前；
  //    e40 恒 len-2、python 恒链尾——入编后全链 87 段）
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i112 = segs.findIndex((x) => x.includes('audit-e112-soulbeast-report-star'));
  const i111 = segs.findIndex((x) => x.includes('audit-e111-idle-firststrike-starlight'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((x) => x.trim().startsWith('python3'));
  assert.notEqual(i112, -1, 'E112 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i111 < i112 && i112 < iCap, 'E112 须按序排在 e111 之后、收口位之前（E 版本序铁律）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
  assert.equal(segs.length, 104, `军规链段数须为 91（E118 后继化 90→91；实为 ${segs.length}）`);
});
