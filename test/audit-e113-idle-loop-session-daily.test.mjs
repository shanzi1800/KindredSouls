/**
 * audit-e113-idle-loop-session-daily.test.mjs —— E113 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E113：待机动效全工况常驻循环 · 会话日终持久化 · 次日锦囊流转与首语多语润色】
 * 五刀八段（源码级＋逻辑核行为级＋六语资产级，不烧算力、不连外网）：
 *   刀一（S1~S2）：scheduleIdle 循环断链根治（回落终点自续＋绝不清 off 计时器
 *     ＋与 chatOpen/锦囊气泡零依赖）＋振幅再强化（-10px／20px35px 光晕／
 *     22deg 弹性回弹／smirk 坏笑层／气泡斜上 25px）。
 *   刀二（S3）：六语六档首语灵魂兽共情润色（helloLoveCore 军令定版逐字核）。
 *   刀三（S4~S5）：dailyChatSession.mjs 按日会话固化核（行为级：写读复原／
 *     过期清理／跨日标记）＋ ChatSheet 实时落档接线。
 *   刀四（S6）：跨自然日首语流转 helloDaily（{{color}}/{{num}} 插值）＋
 *     当日新解锁报告 freshReport 重置。
 *   刀五（S7）：灵犀星胶囊静默化（title 悬浮提示＋cursor:default＋零点击）。
 *   S8：i18n 六语新键＋链位自保（e112 后、e40-compat 前；全链 87→88 段）。
 * 🔴 纪律：e111/e112 段内 -7px/30s/±15deg/16px30px 真值断言已随 E113 军令
 *    后继化（-10px/25~30s/22deg/20px35px）；i18n familiar 段 57→59 键。
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

/* ═══════════ 刀一：待机动效全工况常驻循环 ═══════════ */

test('E113 S1 刀一调度器根治：回落终点自续循环＋绝不清 off 计时器＋零 UI 状态依赖', () => {
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  // ① 断链根治核心：scheduleIdle 函数体内禁清 idleOffTimer（E112 掐死回落
  //    计时器 ⇒ class 永驻动画熄火的病根），循环计程移至回落终点
  const fnStart = card.indexOf('const scheduleIdle = useCallback(() => {');
  const fnBody = card.slice(fnStart, card.indexOf('}, []);', fnStart));
  assert.ok(fnStart !== -1 && fnBody.length > 0, '缺 scheduleIdle 调度器');
  assert.ok(!fnBody.includes('clearTimeout(idleTimer.current);\n    if (idleOffTimer.current) clearTimeout(idleOffTimer.current)'), 'scheduleIdle 内严禁清回落计时器（E113 断链根治）');
  assert.ok(/setIdleAct\(false\);[^\n]*\n\s*scheduleIdle\(\);/.test(fnBody), '循环计程须在 2.4s 回落终点自续');
  // ② 军令钦定区间：首触发 15~20s＋后续 25~30s 恒定（全工况无限循环）
  assert.ok(/15000 \+ Math\.floor\(Math\.random\(\) \* 5001\)/.test(fnBody), '首触发须 15~20s');
  assert.ok(/25000 \+ Math\.floor\(Math\.random\(\) \* 5001\)/.test(fnBody), '后续循环须 25~30s（军令钦定区间）');
  // ③ 军令「定时器绝对解耦」：调度 useEffect 依赖只准锚点/门禁/稳定回调
  //    （与 isChatOpen/锦囊气泡任何 UI 抽屉状态零依赖——开舱照常触发）
  const fx = card.slice(card.indexOf('🌟 E111-刀一：待机调度接线'), card.indexOf('}, [anchorEl, showBreakout, scheduleIdle]);'));
  assert.ok(/\[anchorEl, showBreakout, scheduleIdle\]/.test(card), '调度依赖数组须零 UI 抽屉状态');
  assert.ok(!fx.includes('chatOpen') && !fx.includes('famBubble'), '调度接线禁绑 chatOpen/气泡状态');
});

test('E113 S2 刀一振幅再强化：-10px 拱背＋rotate 仰角＋20px35px 光晕＋22deg 回弹＋smirk 层＋斜上 25px', () => {
  const css = read('web/src/App.css');
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  // ① Sophia：拱背 -10px（军令钦定）＋头颈仰角 rotate＋双耳微摇 skewY
  const knead = (css.match(/@keyframes ksFamSophiaKnead \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/translateY\(-10px\)/.test(knead), '拱背须 -10px（军令钦定 7px→10px）');
  assert.ok(/rotate\(1\.4deg\)/.test(knead), '缺头颈仰角微抬 rotate');
  // ② 宝石光晕军令钦定真值逐字：20px rgba(244,184,206,1) + 35px rgba(232,199,154,0.85)
  const glow = (css.match(/@keyframes ksFamGemGlow \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/drop-shadow\(0 0 20px rgba\(244, ?184, ?206, ?1\)\) drop-shadow\(0 0 35px rgba\(232, ?199, ?154, ?0\.85\)\)/.test(glow), '光晕须军令钦定双层 20px/35px 逐字');
  // ③ Milo 尾 22deg＋弹性阻尼回弹序列
  const tail = (css.match(/@keyframes ksFamMiloTailFlick \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/rotate\(22deg\)/.test(tail), '尾摆须 22deg（军令钦定）');
  assert.ok(/rotate\(-9deg\)/.test(tail) && /rotate\(12deg\)/.test(tail) && /rotate\(-4deg\)/.test(tail), '缺弹性阻尼回弹衰减序列');
  // ④ Milo 坏笑/自信挑眉微表情 smirk 层（军令「必须注入」）
  assert.ok(css.includes('ksFamMiloSmirk'), '缺 Milo smirk 坏笑挑眉层（E113 军令）');
  assert.ok(css.includes('.ks-fam-milo.ks-fam-idle .ks-fam-breathe'), 'smirk 须挂 breathe 叠加层（禁动几何）');
  // ⑤ 星芒气泡斜上漂 50px＋金尘破裂点随迁（E114-刀三 后继）
  const bub = (css.match(/@keyframes ksFamPopBub \{[\s\S]*?\n\}/) || [''])[0];
  assert.ok(/translate\(28px, -41px\)/.test(bub), '气泡须斜上漂 50px 破裂（E114-刀三 军令钦定）');
  assert.ok(/top: -41px;/.test(css), '金尘破裂点须随迁 -41px（斜上漂 50px 终点）');
  // ⑥ reduced-motion 降级守备不破（E111/E112 层全静默）
  assert.ok(/\.ks-fam-gemglow, \.ks-fam-pop \{ display: none; \}/.test(css), 'reduced-motion 缺光效层静默');
  // ⑦ 趴键几何铁律（E65g/E82）零漂移
  assert.equal((css.match(/width: min\(98px, 70%\)/g) || []).length, 2, '体型锁 98px 双在（E82 契约）');
  assert.ok(css.includes('translateY(calc(38.9% + 6px))') && css.includes('translateY(calc(39.2% + 6px))'), '趴键 translateY 漂移');
});

/* ═══════════ 刀二：六语首语灵魂兽共情润色 ═══════════ */

test('E113 S3 刀二润色：helloLoveCore 军令定版逐字核＋六语六档在场＋helloDaily/starTooltip 六语', () => {
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    const f = o.familiar;
    for (const k of ['helloLoveCore', 'helloLoveMonthly', 'helloLoveYearly', 'helloWealthCore', 'helloWealthMonthly', 'helloWealthYearly']) {
      assert.ok(typeof f[k] === 'string' && f[k].length > 0, `${l}.json 缺 familiar.${k}`);
    }
    // 🏆 E113-刀四新键：helloDaily（锦囊流转）＋starTooltip（灵犀星悬浮提示）
    assert.ok(typeof f.helloDaily === 'string' && f.helloDaily.length > 0, `${l}.json 缺 familiar.helloDaily`);
    assert.ok(f.helloDaily.includes('{{color}}') && f.helloDaily.includes('{{num}}'), `${l} helloDaily 缺 {{color}}/{{num}} 插值`);
    assert.ok(typeof f.starTooltip === 'string' && f.starTooltip.length > 0, `${l}.json 缺 familiar.starTooltip`);
  }
  const zh = JSON.parse(read('web/src/i18n/locales/zh.json')).familiar;
  // zh 军令定版句逐字核（刀二钦定新句——温柔灵动灵魂兽共情风）
  assert.ok(zh.helloLoveCore.includes('星轨的微光还在我手心跳动'), 'zh helloLoveCore 须军令定版句首（星轨的微光）');
  assert.ok(zh.helloLoveCore.includes('《{{tarotCard}}》牌与{{trinePattern}}'), 'zh helloLoveCore 须含 {{tarotCard}}/{{trinePattern}} 动态插值（E114-刀一 拔硬编码）');
  assert.ok(zh.helloLoveCore.includes('想先听我慢慢说给你听吗'), 'zh helloLoveCore 须军令定版句尾');
  // zh 六档情境核保留（e112 断言口径不破）
  assert.ok(zh.helloLoveCore.includes('合盘'), 'zh helloLoveCore 须含合盘（e112 口径）');
  assert.ok(zh.helloLoveMonthly.includes('30'), 'zh helloLoveMonthly 须含 30 天口径');
  assert.ok(zh.helloLoveYearly.includes('365'), 'zh helloLoveYearly 须含 365 天口径');
  assert.ok(zh.helloWealthCore.includes('财库'), 'zh helloWealthCore 须含先天财库口径');
  assert.ok(zh.helloWealthMonthly.includes('破耗'), 'zh helloWealthMonthly 须含破耗口径');
  assert.ok(zh.helloWealthYearly.includes('四季') && zh.helloWealthYearly.includes('逐季'), 'zh helloWealthYearly 须含四季/逐季口径');
  // zh helloDaily 军令定版（跨日锦囊流转）
  assert.ok(zh.helloDaily.includes('新的一天，星轨又为你转动啦'), 'zh helloDaily 须军令定版句首');
  assert.ok(zh.helloDaily.includes('幸运色') && zh.helloDaily.includes('幸运数字'), 'zh helloDaily 须幸运色/数字锦囊口径');
  // zh starTooltip 军令定版
  assert.ok(zh.starTooltip === '灵犀星：累计可在 2.0 版本兑换专属灵魂兽装扮', 'zh starTooltip 须军令钦定原文');
  // 🔴 chatHello 复读禁令不破（e66 A2 反向断言守备的键不动）
  assert.ok(!zh.chatHello.includes('{{color}}') && !zh.chatHello.includes('{{num}}'), 'zh chatHello 禁运势复读插值（e66 契约）');
});

/* ═══════════ 刀三：会话按日持久化（行为级） ═══════════ */

test('E113 S4 刀三逻辑核行为：写读复原／过期清理／跨日标记／sender 口径（dailyChatSession.mjs）', async () => {
  const M = await import(pathToFileURL(join(ROOT, 'web/src/lib/dailyChatSession.mjs')).href);
  // ① 内存 store 模拟（Storage 接口形状）
  const mkStore = () => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, _m: m };
  };
  const SIG = '2000-01-01|08:30|31.2304|121.4737|Asia/Shanghai';
  const DAY = '2026-11-01';
  // ② 键名军令钦定：ks_chat_session_${chartSig}_${YYYY-MM-DD}
  assert.equal(M.chatSessionKey(SIG, DAY), `ks_chat_session_${SIG}_${DAY}`, '缓存键须军令钦定 ks_chat_session_${chartSig}_${date}');
  // ③ 写→读复原：role→sender 军令口径转换＋空文本流式壳不落档
  const store = mkStore();
  const ok = M.saveDailyChatSession(store, SIG, DAY, [
    { id: 'hello', role: 'assistant', text: '星轨的微光…', timestamp: 1000 },
    { id: 'u-1', role: 'user', text: '在吗', timestamp: 2000 },
    { id: 'a-1', role: 'assistant', text: '' },           // 流式空壳 ⇒ 不落档
    { id: 'a-1', role: 'assistant', text: '我在呢', timestamp: 3000 },
    { id: 'bad', role: 'system', text: 'x' },             // 非法 role ⇒ 不落档
  ]);
  assert.equal(ok, true, '写档须成功');
  const sess = M.loadDailyChatSession(store, SIG, DAY, new Date('2026-11-01T12:00:00').getTime());
  assert.ok(sess, '当日 12:00 读档须在（未过 24:00）');
  assert.equal(sess.messages.length, 3, '复原须 3 条（空壳/非法 role 剔除）');
  assert.equal(sess.messages[1].sender, 'user', 'user 消息 sender 口径（军令钦定）');
  assert.equal(sess.messages[0].sender, 'familiar', 'assistant ⇒ familiar 口径（军令钦定）');
  assert.equal(sess.messages[2].timestamp, 3000, 'timestamp 须保真');
  // ④ expireAt＝当日 23:59:59.999（本地自然日 24:00 为界）
  assert.equal(sess.expireAt, new Date(2026, 10, 1, 23, 59, 59, 999).getTime(), 'expireAt 须当日 23:59:59.999');
  // ⑤ 过期失效自动清理（now > expireAt ⇒ null 且物理删除）
  const stale = M.loadDailyChatSession(store, SIG, DAY, new Date(2026, 10, 2, 0, 0, 1).getTime());
  assert.equal(stale, null, '跨 24:00 读档须 null（军令失效清理）');
  assert.ok(!store._m.has(M.chatSessionKey(SIG, DAY)), '过期档须物理清理');
  // ⑥ 跨日判定真源：lastChatDay 标记随写档维护
  assert.equal(M.readLastChatDay(store), DAY, '写档须顺带维护 lastChatDay');
  // ⑦ 键值不匹配（换盘）⇒ 不串档（即弃即清）
  const other = M.loadDailyChatSession(store, '1999-12-31|00:00|1|2|UTC', DAY, new Date('2026-11-01T12:00:00').getTime());
  assert.equal(other, null, '换盘 chartSig 不得串档');
  // ⑧ 坏档/无档/坏日期 ⇒ null（fail-soft）
  assert.equal(M.loadDailyChatSession(mkStore(), SIG, DAY), null, '无档 ⇒ null');
  const bad = mkStore();
  bad.setItem(M.chatSessionKey(SIG, DAY), '{oops');
  assert.equal(M.loadDailyChatSession(bad, SIG, DAY), null, '坏 JSON ⇒ null');
  assert.equal(M.loadDailyChatSession(store, SIG, 'not-a-date'), null, '坏日期格式 ⇒ null');
  // ⑨ sessionToChatMsgs 复原转换（sender → role）
  const msgs = M.sessionToChatMsgs(sess);
  assert.deepEqual(msgs.map((m) => m.role), ['assistant', 'user', 'assistant'], '复原转换 role 口径');
});

test('E113 S5 刀三接线：ChatSheet 实时落档＋chartSig 锚＋首语复原禁复读', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  // ① 逻辑核四函数接线
  for (const fn of ['loadDailyChatSession', 'saveDailyChatSession', 'readLastChatDay', 'chatSessionDateKey', 'sessionToChatMsgs']) {
    assert.ok(sheet.includes(fn), `ChatSheet 缺 ${fn} 接线`);
  }
  // ② chartSig 锚 ref（open 算定，实时写复用——不逐消息重算）
  assert.ok(sheet.includes('sessionSigRef'), '缺会话 sig 锚 ref');
  assert.ok(/readFamiliarRecord\(store, FAMILIAR_LS_KEY\)/.test(sheet), 'chartSig 须认领档绑定签名优先');
  assert.ok(sheet.includes('familiarChartSig'), 'chartSig 须本命真值 familiarChartSig 兜底');
  // ③ 消息变更实时落档 effect（军令钦定）
  const saveFx = sheet.slice(sheet.indexOf('🏆 E113-刀三：消息变更实时落档'), sheet.indexOf('}, [msgs, open]);', sheet.indexOf('🏆 E113-刀三：消息变更实时落档')) + 20);
  assert.ok(/useEffect\(\(\) => \{/.test(saveFx), '缺实时落档 effect');
  assert.ok(sheet.includes('}, [msgs, open]);'), '落档 effect 须监听 msgs 变更（实时写）');
  // ④ 复原优先：会话档在场且非新解锁 ⇒ 复原全部历史（禁重复首句）
  assert.ok(/if \(sess && sess\.messages\.length > 0/.test(sheet), '缺会话档复原分支');
  assert.ok(/setMsgs\(sessionToChatMsgs\(sess\)\)/.test(sheet), '复原须走 sessionToChatMsgs 转换');
  // ⑤ E112 六档随行上行不破（send body.recentReport 保留）
  assert.ok(/const recentReport = readRecentReport\(/.test(sheet), 'send 缺 recentReport 读取（E112 契约保留）');
});

/* ═══════════ 刀四：跨自然日首语流转 ═══════════ */

test('E113 S6 刀四流转：freshReport 当日判定＋跨日 helloDaily＋新解锁立即重置', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  // ① 当日新解锁判定（unlockedAt 落今日 ⇒ 报告第一击）
  assert.ok(/freshReport = !!\(rr && chatSessionDateKey\(new Date\(Number\(rr\.unlockedAt\)\)\) === today\)/.test(sheet), '缺 freshReport 当日解锁判定');
  assert.ok(/mode = `\$\{rr\.category\}_\$\{rr\.tier\}` as HelloMode/.test(sheet), '当日新解锁须映射六档第一击');
  // ② 新解锁晚于最后一条消息 ⇒ 重置（「立即重置为最新报告第一击」军令钦定）
  assert.ok(/freshReport && Number\(rr\.unlockedAt\) > lastTs/.test(sheet), '缺新解锁重置判定（解锁晚于末条消息⇒重置）');
  // ③ 跨自然日 ⇒ helloDaily 锦囊问候（lastChatDay < today）
  assert.ok(/if \(lastDay && lastDay < today\) \{\s*\n\s*mode = 'daily'/.test(sheet), '缺跨日流转 daily 分支');
  // ④ helloFor daily 分支：dailyFortune 真值插值（与首页锦囊同源）
  const dailyFn = sheet.slice(sheet.indexOf("if (mode === 'daily')"), sheet.indexOf("if (mode === 'sweet')"));
  assert.ok(dailyFn.includes('dailyFortune({ lang, sunSign: \'\' })'), 'daily 分支须 dailyFortune 确定性核真值');
  assert.ok(dailyFn.includes("t('familiar.helloDaily', { color:") && dailyFn.includes('num: String(f.luckyNumber)'), 'daily 分支须 {{color}}/{{num}} 插值装配');
  // ⑤ 日期口径＝本地自然日（chatSessionDateKey，非 UTC toISOString）
  const openFx = sheet.slice(sheet.indexOf('useEffect(() => {\n    if (!open) return;'), sheet.indexOf('}, [open];'));
  assert.ok(!openFx.includes('toISOString().slice(0, 10)'), '开舱判定禁 UTC 日期口径（军令自然日=本地）');
});

/* ═══════════ 刀五：灵犀星胶囊静默化 ═══════════ */

test('E113 S7 刀五静默化：title 悬浮提示＋cursor:default＋零点击绑定（2.0 伏笔锁定）', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  const css = read('web/src/App.css');
  // ① title 走 i18n（starTooltip 六语）——军令钦定原生悬浮提示
  assert.ok(/title=\{t\('familiar\.starTooltip'\)\}/.test(sheet), '胶囊缺 title 悬浮提示（军令钦定）');
  // ② 零点击绑定：胶囊为 div 非按钮、无 onClick（E112 已 pointer-events:none 物理穿透）
  const starTag = sheet.slice(sheet.indexOf('className="ks-chat-star"'), sheet.indexOf('starBadge', sheet.indexOf('className="ks-chat-star"')));
  assert.ok(!starTag.includes('onClick'), '胶囊严禁点击绑定（2.0 未就绪防误触空框）');
  assert.ok(!starTag.includes('<button'), '胶囊须为纯展示 div（非按钮）');
  assert.ok(/\.ks-chat-star\s*\{[^}]*pointer-events: none/.test(css), '胶囊须 pointer-events:none 物理穿透');
  // ③ cursor: default（军令钦定拔手型指针）
  assert.ok(/\.ks-chat-star\s*\{[^}]*cursor: default/.test(css), '胶囊须 cursor:default（拔手型指针）');
  // ④ 黑金视觉不变（E112 军令钦定轻奢胶囊样式守备）
  const starCss = css.slice(css.indexOf('.ks-chat-star {'), css.indexOf('.ks-chat-star {') + 400);
  assert.ok(starCss.includes('rgba(212, 175, 55, 0.3)') && starCss.includes('rgba(212, 175, 55, 0.1)'), '黑金视觉须 E112 原值不变');
  assert.ok(/font-size: 11px/.test(starCss), '胶囊字体 11px 不变');
  // ⑤ 每日 +1 打卡逻辑不动（ks_starlight_count 契约保留）
  const card = read('web/src/components/FamiliarHomeCard.tsx');
  assert.ok(card.includes('ks_starlight_count'), '打卡存储 key 丢失');
});

/* ═══════════ 链位自保＋段数基准 ═══════════ */

test('E113 S8 链位自保：e113 入编（e112 后、e40-compat 前；全链 87→88 段；i18n familiar 57→59 键）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i113 = segs.findIndex((x) => x.includes('audit-e113-idle-loop-session-daily'));
  const i112 = segs.findIndex((x) => x.includes('audit-e112-soulbeast-report-star'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((x) => x.trim().startsWith('python3'));
  assert.notEqual(i113, -1, 'E113 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i112 < i113 && i113 < iCap, 'E113 须按序排在 e112 之后、收口位之前（E 版本序铁律）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
  assert.equal(segs.length, 91, `军规链段数须为 91（E118 入编后 90→91；实为 ${segs.length}）`);
  // i18n familiar 段键数基准：57（E112）→ 59（helloDaily＋starTooltip）
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.equal(Object.keys(o.familiar).length, 59, `${l} familiar 段须 59 键（E113 两新键）`);
  }
});
