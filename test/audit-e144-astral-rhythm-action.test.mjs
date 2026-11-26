// ═══ E144 闸门：ASTRAL-RHYTHM-ACTION（星灵短句留白＋昼夜色温＋跨日重逢＋日历锁＋嘴替）═══
// 军令（主公 2026-11-18）：五模块落码＋本闸门六锁挂 FULL_EXIT——任何未来提交
// 破坏任意一锁即阻断构建。最高准则「零新增卡片、零新增弹窗、零底栏膨胀」：
// 所有展示与交互 100% 融入 FamiliarChatSheet 既有气泡流与 11px 微标体系。
//   锁1 留白分段（60-80 字双段 \n\n 引擎＋emitDelta 三层串联＋终帧兜底 reset 重发）；
//   锁2 零卡片膨胀（📅/✨ 复用 .ks-chat-badge 11px 形制；嘴替行长在气泡内；
//     i18n 139 键零扰动——六语自容 L_ 字典）；
//   锁3 昼夜色温＋跨日重逢（06:00-17:59/18:00-05:59 相位＋状态栏合成＋≥6h 或
//     跨日 ⇒ ✨ 微标＋ks_last_active_ts 白名单键）；
//   锁4 天时日历锁（时窗提取 fail-closed＋RFC-5545 .ics 五要素＋VALARM 15min）；
//   锁5 嘴替三档（六语意图网＋三档前缀逐字＋parseProxyLine 剥壳＋轻点复制默契+5）；
//   锁6 server 挂载＋链位（111→112 段；e144 居 e143 后、e40-compat 前）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const RA = await import(join(ROOT, 'web/src/lib/astralRhythmAction.mjs'));
const SB = await import(join(ROOT, 'web/src/lib/soulBondState.mjs'));

const SHEET = read('web/src/components/FamiliarChatSheet.tsx');
const CSS = read('web/src/App.css');
const SERVER = read('server.js');
const PKG = JSON.parse(read('package.json'));
const I18N = existsSync(join(ROOT, 'web/src/i18n/index.ts')) ? read('web/src/i18n/index.ts') : '';

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

function mockStorage(initial) {
  const m = new Map(Object.entries(initial || {}));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(String(k)); },
    _map: m,
  };
}

/* ═══ 锁1：星灵短句留白分段锁 ═══ */

test('E144-锁1a 终帧分段器纯函数：超阈值无留白 ⇒ 双段；短句/已有留白/无句界 ⇒ 透传', () => {
  // zh 70 字无 \n\n ⇒ 中位最佳句界拆双段（60-80 字铁律结构兜底）
  const longZh = '今晚的星轨格外温柔，月亮落在你的命宫，把积累了一周的心事慢慢化开。塔罗底牌提示你近期的犹豫其实源于对自己的不信任。喝一碗热汤，早点休息，明天会有新的转机等你去接住。';
  const splitZh = RA.splitAstralBreathingText(longZh, 'zh');
  assert.ok(splitZh.includes('\n\n'), '超阈值 zh 须拆出双段留白 \\n\\n');
  const parts = splitZh.split('\n\n');
  assert.equal(parts.length, 2, '必须恰两段（第一段底牌共情＋第二段叮嘱轻问）');
  assert.ok(parts[0].length >= 8 && parts[1].length >= 8, '两段均须非空有实义');
  // 短句（< 55 字）⇒ 原样透传（严禁强拆）
  const shortZh = '我在呢，星轨都记着你的心事。';
  assert.equal(RA.splitAstralBreathingText(shortZh, 'zh'), shortZh, '短句严禁强拆（透传）');
  // 已有 \n\n ⇒ 仅归一透传（不二次拆分）
  const already = '第一段已经留白。\n\n第二段也齐了。';
  assert.equal(RA.splitAstralBreathingText(already, 'zh'), already, '已有双段严禁重拆');
  // 无句读边界（无 。！？）⇒ 透传 fail-soft
  const noPunct = '一'.repeat(70);
  assert.equal(RA.splitAstralBreathingText(noPunct, 'zh'), noPunct, '无句界 ⇒ 透传（绝不腰斩）');
  // en 60 词超阈值 ⇒ 双段（中位句界在场——句界缺席时纯核正确透传不腰斩）
  const mkEn = (n, stem) => Array.from({ length: n }, (_, i) => `${stem}${i}`).join(' ') + '.';
  const longEn = `${mkEn(30, 'star')} ${mkEn(30, 'moon')}`;
  const splitEn = RA.splitAstralBreathingText(longEn, 'en');
  assert.ok(splitEn.includes('\n\n'), 'en 超阈值（40 词）须拆双段');
  assert.equal(splitEn.split('\n\n').length, 2, 'en 亦须恰两段');
});

test('E144-锁1b 流中留白归一（chunk-safe 幂等）：\\r\\n 归一＋3+ 连续换行收敛＋幂等', () => {
  const dirty = 'hello\r\nworld\r\n\r\n\r\nagain';
  const once = RA.normalizeAstralBreathingChunk(dirty);
  assert.ok(!once.includes('\r'), '\\r 必须清除');
  assert.ok(!/\n{3,}/.test(once), '3+ 连续换行必须收敛为 \\n\\n');
  assert.equal(RA.normalizeAstralBreathingChunk(once), once, '幂等：二遍清洗零变化（跨分片安全）');
  assert.equal(RA.normalizeAstralBreathingChunk('  edge  '), 'edge', '首尾空白剥离');
  assert.equal(RA.normalizeAstralBreathingChunk(''), '', '空串透传零抛错');
  assert.equal(RA.normalizeAstralBreathingChunk(null), '', 'null 透传零抛错（fail-soft）');
});

test('E144-锁1c server emitDelta 三层串联＋终帧兜底（reset 清屏＋重发双段先于唤名计数）', () => {
  // 三层清洗链形制：留白归一 ⇒ 品牌清洗 ⇒ 封印清洗（军令钦定串联序）
  // 🆕 E147-刀二/刀三（军令 2026-11-19）：E147 出流守卫清洗内一层（餐饮零
  //    地名剥离＋凉季反季面料拦截）——四层串联，E144 留白归一仍恒外层。
  assert.ok(SERVER.includes('_e144BreathingSplitSync(_e144Rhythm, _e147OutWashSync(_e147Guard, _e1421BrandWash(_e143VeilWashSync(_e143Veil, t)), _e147ColdClimate))'),
    'emitDelta 须四层串联（E144 留白归一外层 ⇒ E147 出流守卫 ⇒ E142.1 品牌 ⇒ E143 封印）');
  // 模块缓存动态 import 纯核（fail-soft：核缺席 ⇒ 透传零破坏）
  assert.ok(SERVER.includes('_e144RhythmMod = await import(\'./web/src/lib/astralRhythmAction.mjs\')'),
    'server 须动态 import 纯核（E143 同形制模块缓存）');
  assert.ok(SERVER.includes('function _e144BreathingSplitSync(mod, t)'),
    '流中归一须独立 sync 函数（emitDelta 唯一挂点消费）');
  // 终帧兜底：无 \n\n ⇒ reset 帧＋重发分段（E115 reset 契约复用）
  assert.ok(SERVER.includes('splitAstralBreathingText(text, lang)'),
    '终帧兜底须调用 splitAstralBreathingText');
  const iEnsure = SERVER.indexOf("splitAstralBreathingText(text, lang)");
  const iNameCount = SERVER.indexOf('_e1421DoneQuota');
  assert.ok(iEnsure > 0 && iNameCount > iEnsure, '终帧分段须先于 E142.1 唤名计数收口（nameQuota 基于终文本）');
});

/* ═══ 锁2：零卡片膨胀锁（最高准则）═══ */

test('E144-锁2a 零新增卡片/弹窗/底栏：📅 复用 .ks-chat-badge 11px 形制；嘴替行长在气泡内', () => {
  // 📅 日历锁微胶囊＝button 复用 .ks-chat-badge 类（零新增卡片框）
  assert.ok(SHEET.includes('ks-chat-badge ks-chat-cal-pill'),
    '日历锁微胶囊须复用 .ks-chat-badge 11px 毛玻璃形制（零新增卡片）');
  // ✨ 重逢微标＝复用 .ks-chat-badge 类（E143 同槽）
  assert.ok(SHEET.includes('data-testid="astral-reunion-badge"'),
    '重逢微标须挂 E143 微标同槽（data-testid 在册）');
  // 零新增弹窗：PreviewModal 组件数恒 2（E121 密函＋E124 生活——E144 零新增）
  const modalCount = (SHEET.match(/PreviewModal/g) || []).length;
  assert.ok(modalCount <= 6, `PreviewModal 引用面不得膨胀（实得 ${modalCount} 处 import/JSX，E144 零新增弹窗）`);
  // 零底栏膨胀：胶囊栏恒 chatQ1/chatQ3 基底两颗（E142.1 钦定铁律原样）
  assert.ok(SHEET.includes("const pills = [t('familiar.chatQ1'), t('familiar.chatQ3')];"),
    '胶囊栏须恒两颗基底（E142.1 铁律——E144 严禁加底栏按钮）');
  // 嘴替交互＝行级 div 长在既有气泡内（非独立卡片组件）
  assert.ok(SHEET.includes('ks-chat-proxy-line'), '嘴替行须为气泡内行级元素（非卡片组件）');
  assert.ok(!/E144\w*Card|E144\w*Modal|E144\w*Sheet/.test(SHEET), '严禁新增 E144 卡片/弹窗/抽屉组件');
  // CSS 零新增卡片框：E144 样式仅行级/胶囊级/色温变量
  assert.ok(CSS.includes('.ks-chat-proxy-line') && CSS.includes('.ks-chat-cal-pill'),
    'CSS 须含行级/胶囊级 E144 形制');
  assert.ok(!/\.ks-e144[\w-]*\s*\{/.test(CSS), '严禁新增 .ks-e144* 独立卡片框类');
});

test('E144-锁2b i18n 139 键零扰动：六语自容 L_ 字典（E144 全量词条不进 i18n 真源）', () => {
  // E144 词条零 i18n 注入（六语自容字典唯一真源 astralRhythmAction.mjs）
  assert.ok(!I18N.includes('circadian') && !I18N.includes('astralRhythm') && !I18N.includes('proxyTier'),
    'i18n 真源严禁混入 E144 词条（audit-i18n-keys 139 基线零扰动）');
  // 组件内 E144 文案全走纯核字典（零 t() 新键）
  assert.ok(!/t\('familiar\.(cal|proxy|circadian|reunion|breathing)/.test(SHEET),
    '组件严禁为 E144 新增 i18n t() 键（六语自容 L_ 字典单源）');
  // 纯核六语闭集守卫
  assert.deepEqual([...RA.ASTRAL_RHYTHM_LOCALES], LANGS, '语言白名单须六语闭集');
});

/* ═══ 锁3：昼夜色温＋跨日重逢锁 ═══ */

test('E144-锁3a 昼夜相位判定边界（06:00/17:59 暖金；18:00/05:59 星夜）＋状态栏合成形态', () => {
  assert.equal(RA.resolveCircadianPhase(6, 0), 'day', '06:00 ⇒ day');
  assert.equal(RA.resolveCircadianPhase(17, 59), 'day', '17:59 ⇒ day');
  assert.equal(RA.resolveCircadianPhase(18, 0), 'night', '18:00 ⇒ night');
  assert.equal(RA.resolveCircadianPhase(5, 59), 'night', '05:59 ⇒ night');
  assert.equal(RA.resolveCircadianPhase(0, 0), 'night', '00:00 ⇒ night');
  assert.equal(RA.resolveCircadianPhase(23, 59), 'night', '23:59 ⇒ night');
  assert.equal(RA.resolveCircadianPhase(99, 0), 'night', '非法输入 ⇒ night 兜底（fail-closed）');
  // 状态栏合成：「灵犀默契 Lv.2 星轨同频 · 78/100 · 🌙 星夜守护磁场」军令形态
  const bond = SB.bondStatusBarLabel('zh', { resonanceScore: 78, bondLevel: 'lv2', updatedAt: 1 });
  const composed = RA.composeCircadianStatus(bond, 21, 30, 'zh');
  assert.ok(composed.includes('78/100') && composed.includes('🌙 星夜守护磁场'),
    `状态栏须含默契分＋星夜词条（实得 ${composed}）`);
  const dayComposed = RA.composeCircadianStatus(bond, 9, 0, 'zh');
  assert.ok(dayComposed.includes('☀️ 晨曦星轨同频'), `白昼前缀须拼接（实得 ${dayComposed}）`);
  assert.ok(dayComposed.indexOf('78/100') < dayComposed.indexOf('☀️'), '色温前缀须拼在默契基底之后');
  // 六语昼夜词条全量产出
  for (const lang of LANGS) {
    assert.ok(RA.circadianStatusLabel(lang, 'day'), `${lang} day 词条须产出`);
    assert.ok(RA.circadianStatusLabel(lang, 'night'), `${lang} night 词条须产出`);
  }
});

test('E144-锁3b 组件昼夜挂载：舱体色温 class＋状态栏 composeCircadianStatus＋CSS 呼吸光', () => {
  assert.ok(SHEET.includes('composeCircadianStatus(bondStatusBarLabel(lang, bondState)'),
    '状态栏须走 composeCircadianStatus 昼夜合成');
  assert.ok(SHEET.includes('ks-circadian-night'), '舱体须挂星夜色温 class（相位驱动）');
  assert.ok(SHEET.includes('resolveCircadianPhase(circadianClock.hour'),
    '相位判定须以开舱时钟快照为单源');
  // CSS：色温变量单源＋::after 呼吸柔光（z-index:-1 沉底不遮字）
  assert.ok(CSS.includes('--ks-circadian: 232, 190, 90'), '暖金色温变量须在册（06:00-17:59 默认）');
  assert.ok(CSS.includes('--ks-circadian: 158, 126, 255'), '星夜紫色温变量须在册（.ks-circadian-night）');
  assert.ok(CSS.includes('ksCircadianBreath'), '昼夜呼吸关键帧须在册（纯 CSS 零算力）');
  assert.ok(/z-index:\s*-1/.test(CSS), '柔光层须 z-index:-1 沉底（不遮字不截交互）');
});

test('E144-锁3c 跨日重逢：≥6h 或跨本地自然日 ⇒ reunion；读写档 roundtrip＋组件挂点', () => {
  const HOUR = 60 * 60 * 1000;
  // 输入自洽基线（localISO 须与 nowTs 同一本地日——纯核按此契约判跨日）
  const BASE = Date.UTC(2026, 10, 18, 10, 0);
  // 7h 间隔同日 ⇒ 重逢
  assert.equal(RA.computeAstralReunionContext({
    lastActiveTs: BASE - 7 * HOUR, nowTs: BASE, localISO: '2026-11-18T10:00:00',
  }).reunion, true, '≥6h 间隔须重逢');
  // 1h 间隔同日 ⇒ 非重逢
  assert.equal(RA.computeAstralReunionContext({
    lastActiveTs: BASE - HOUR, nowTs: BASE, localISO: '2026-11-18T10:00:00',
  }).reunion, false, '<6h 同日严禁误报重逢');
  // 跨日（2h 间隔但本地日不同）⇒ 重逢
  const crossed = RA.computeAstralReunionContext({
    lastActiveTs: Date.UTC(2026, 10, 17, 23, 0), nowTs: Date.UTC(2026, 10, 18, 1, 0),
    localISO: '2026-11-18T01:00:00',
  });
  assert.equal(crossed.dayCrossed, true, '本地自然日跨日须判定');
  assert.equal(crossed.reunion, true, '跨日须重逢（<6h 亦然）');
  // 未来时间戳/坏输入 ⇒ fail-closed 非重逢
  assert.equal(RA.computeAstralReunionContext({
    lastActiveTs: BASE + 5 * HOUR, nowTs: BASE, localISO: '2026-11-18T10:00:00',
  }).reunion, false, '未来活跃时刻（时钟漂移）严禁误报');
  assert.equal(RA.computeAstralReunionContext(null).reunion, false, 'null 输入零抛错兜底');
  // 读写档 roundtrip（ks_last_active_ts 白名单键）
  assert.equal(RA.ASTRAL_LAST_ACTIVE_KEY, 'ks_last_active_ts', '军令钦定存储键');
  const st = mockStorage({});
  assert.equal(RA.readLastActiveTs(st), null, '无档 ⇒ null');
  assert.equal(RA.writeLastActiveTs(st, 12345), true);
  assert.equal(RA.readLastActiveTs(st), 12345, '写档回读一致');
  assert.equal(RA.writeLastActiveTs(st, -1), false, '非法时间戳拒写');
  assert.equal(RA.writeLastActiveTs(null, 1), false, '无 storage 零抛错 fail-soft');
  // 组件挂点：开舱判定＋写档＋微标渲染（E143 同槽）
  assert.ok(SHEET.includes('computeAstralReunionContext('), '开舱须判定重逢上下文');
  assert.ok(SHEET.includes('writeLastActiveTs(store'), '开舱须写最后活跃时刻');
  assert.ok(SHEET.includes('astralReunionBadgeLabel(lang)'), '重逢微标词条须按 lang 查六语字典');
  // 六语重逢词条
  for (const lang of LANGS) {
    assert.ok(RA.astralReunionBadgeLabel(lang).includes('✨'), `${lang} 重逢微标须带 ✨ 星光标`);
  }
  assert.equal(RA.astralReunionBadgeLabel('xx'), RA.astralReunionBadgeLabel('en'), '白名单外 lang ⇒ en 兜底（lang 守卫设计；类型守卫才 fail-closed 空串）');
});

/* ═══ 锁4：天时日历锁（RFC-5545 .ics）═══ */

test('E144-锁4a 时窗提取 fail-closed（宁窄勿宽）：吉时/避坑命中；无时窗/无关键词 ⇒ null', () => {
  // 命中：明日吉时窗
  const ev = RA.detectAstralCalendarEvent('星轨显示明日签约吉时在 09:30-11:00，记得提前准备。');
  assert.ok(ev, '明日吉时须提取出事件');
  assert.equal(ev.dateOffset, 1, '「明日」须偏移 +1 天');
  assert.equal(ev.startHH, 9); assert.equal(ev.startMM, 30);
  assert.equal(ev.endHH, 11); assert.equal(ev.endMM, 0);
  assert.equal(ev.kind, 'lucky', '无避坑词 ⇒ lucky');
  // 避坑语义
  const caution = RA.detectAstralCalendarEvent('今天 14:00-16:00 是破财避坑窗，不宜冲动消费。');
  assert.ok(caution && caution.kind === 'caution', '破财/避坑/不宜 ⇒ caution');
  assert.equal(caution.dateOffset, 0, '无明日词 ⇒ 当日');
  // fail-closed：无时窗
  assert.equal(RA.detectAstralCalendarEvent('今天的吉时请留意星轨指引'), null, '无 HH:MM 时窗 ⇒ null');
  // fail-closed：有时窗无关键词（日常寒暄零误挂）
  assert.equal(RA.detectAstralCalendarEvent('我们 19:00-20:00 开会可以吗'), null, '无吉时/避坑关键词 ⇒ null');
  // fail-closed：倒窗
  assert.equal(RA.detectAstralCalendarEvent('签约吉时 22:00-10:00'), null, '结束早于开始 ⇒ null');
  assert.equal(RA.detectAstralCalendarEvent(''), null, '空文本 ⇒ null');
});

test('E144-锁4b RFC-5545 .ics 五要素（VCALENDAR/VEVENT/VALARM 15min/DTSTART 浮届/CRLF）＋文件名', () => {
  const ics = RA.buildAstralCalendarICS({
    dateISO: '2026-11-20', startHH: 9, startMM: 30, endHH: 11, endMM: 0,
    summary: '签约吉时', description: '星轨叮嘱', uidSalt: 'sig-123',
  });
  assert.ok(ics.includes('BEGIN:VCALENDAR') && ics.includes('END:VCALENDAR'), 'VCALENDAR 包络须在');
  assert.ok(ics.includes('BEGIN:VEVENT') && ics.includes('END:VEVENT'), 'VEVENT 须在');
  assert.ok(ics.includes('BEGIN:VALARM') && ics.includes('TRIGGER:-PT15M'), 'VALARM 须提前 15 分钟');
  assert.ok(ics.includes('DTSTART:20261120T093000'), 'DTSTART 须本地浮届 YYYYMMDDTHHMMSS');
  assert.ok(ics.includes('DTEND:20261120T110000'), 'DTEND 须本地浮届');
  assert.ok(/DTSTAMP:\d{8}T\d{6}Z/.test(ics), 'DTSTAMP 须 UTC 规范形态（修复后单零不畸形）');
  assert.ok(ics.includes('@kindredsouls'), 'UID 须带品牌域盐');
  assert.ok(ics.includes('\r\n'), 'CRLF 行尾（RFC 钦定）');
  assert.ok(!/(?<!\r)\n/.test(ics), '严禁裸 \\n 行尾（RFC 5545 违例）');
  // 坏形状 fail-closed
  assert.equal(RA.buildAstralCalendarICS(null), '', 'null ⇒ 空载荷');
  assert.equal(RA.buildAstralCalendarICS({ dateISO: 'bad' }), '', '坏日期 ⇒ 空载荷');
  assert.equal(RA.buildAstralCalendarICS({ dateISO: '2026-11-20', startHH: 22, endHH: 10 }), '', '倒窗 ⇒ 空载荷');
  // 文件名钦定
  assert.equal(RA.astralCalendarFilename('2026-11-20'), 'KindredSouls-AstralLock-20261120.ics', '军令钦定文件名');
  assert.equal(RA.astralCalendarFilename('bad'), 'KindredSouls-AstralLock.ics', '坏日期 ⇒ 兜底名');
  // 组件挂点：Blob 下载＋text/calendar＋testid
  assert.ok(SHEET.includes('text/calendar'), '下载须走 text/calendar MIME');
  assert.ok(SHEET.includes('astralCalendarFilename('), '文件名须走纯核单源');
  assert.ok(SHEET.includes('data-testid="astral-calendar-lock"'), '日历锁微胶囊 testid 须在册');
  // 六语微胶囊词条
  for (const lang of LANGS) {
    assert.ok(RA.calendarLockPillLabel(lang).includes('📅'), `${lang} 日历锁词条须带 📅`);
  }
  // 摘要词典（lucky/caution 双形态）
  assert.ok(RA.calendarEventSummary('zh', 'lucky') && RA.calendarEventSummary('zh', 'caution'),
    '摘要 lucky/caution 双形态须产出');
});

/* ═══ E144.1（补刀军令 2026-11-18）：双保险触发＋头部双行分层 ═══ */

test('E144.1-锁4c 财运避坑必出日历锁：主公实测回复（无钟点）⇒ 意图命中＋兜底窗＋组件双保险挂点', () => {
  // 主公产线实测真实回复文本（军令钦定断言语料——无任何具体钟点）
  const REPLY = '今天太阳落第2宫，财库能量是充足的，但要提防冲动消费。\n\n月亮白羊容易情绪化买单，别因一时上头或赌气去花钱，暂时用不上的大件先放进购物车冷一冷。';
  assert.equal(RA.detectAstralCalendarIntent(REPLY), 'caution',
    '主公实测回复须命中 caution（防冲动消费/情绪化买单——锁B 语义宽域）');
  // 锁B 语义宽域命中面（军令钦定关键词族）＋寒暄 fail-closed
  assert.equal(RA.detectAstralCalendarIntent('今天财运怎么样'), 'lucky', '财运 ⇒ lucky');
  assert.equal(RA.detectAstralCalendarIntent('帮我看看结合星盘的今日指引'), 'lucky', '指引 ⇒ lucky');
  assert.equal(RA.detectAstralCalendarIntent('今晚吉时出门谈签约'), 'lucky', '吉时/约见 ⇒ lucky');
  assert.equal(RA.detectAstralCalendarIntent('今天天气真不错呀'), null, '日常寒暄严禁误触');
  assert.equal(RA.detectAstralCalendarIntent(''), null, '空文本 fail-closed');
  assert.equal(RA.detectAstralCalendarIntent(null), null, 'null 零抛错');
  // 智能时段兜底窗（军令钦定：午后 14:00-16:00 / 晚间 20:00-22:00 高发窗）
  assert.deepEqual(RA.defaultAstralWindow(10), { dateOffset: 0, startHH: 14, startMM: 0, endHH: 16, endMM: 0 }, '上午 ⇒ 午后高发窗');
  assert.deepEqual(RA.defaultAstralWindow(15), { dateOffset: 0, startHH: 20, startMM: 0, endHH: 22, endMM: 0 }, '午后 ⇒ 晚间高发窗');
  const late = RA.defaultAstralWindow(21);
  assert.ok(late.endHH > late.startHH, '深夜退化窗须守卫非零时长');
  assert.equal(RA.defaultAstralWindow(99).startHH, 20, '非法小时 ⇒ fail-closed 晚间窗');
  // 兜底窗 + 回复文本 ⇒ 合法 .ics（100% 必出闭环实锤）
  const w = RA.defaultAstralWindow(11);
  const ics = RA.buildAstralCalendarICS({
    dateISO: '2026-11-18', startHH: w.startHH, startMM: w.startMM, endHH: w.endHH, endMM: w.endMM,
    summary: RA.calendarEventSummary('zh', 'caution'), description: REPLY.slice(0, 200), uidSalt: 'sig-1',
  });
  assert.ok(ics.includes('BEGIN:VEVENT') && ics.includes('TRIGGER:-PT15M'), '兜底窗须产合法 VEVENT＋VALARM');
  assert.ok(ics.includes('避坑'), '回复核心句须写入 DESCRIPTION（日历备注）');
  // 组件双保险挂点（send 收口）：锁A 胶囊直通＋锁B 语义网＋兜底窗＋备注入历
  assert.ok(SHEET.includes("_e144UserText === t('familiar.chatQ1')"), '锁A 须比对 chatQ1 胶囊文案（点击直通 100% 必出）');
  assert.ok(SHEET.includes("=== t('familiar.chatQ3')"), '锁A 须比对 chatQ3 胶囊文案（Q3 ⇒ lucky）');
  assert.ok(SHEET.includes('detectAstralCalendarIntent('), '锁B 语义网须挂 send 收口探测');
  assert.ok(SHEET.includes('defaultAstralWindow(new Date().getHours())'), '无钟点须走本地时间智能兜底窗');
  assert.ok(SHEET.includes('note: _e144LastA'), '回复核心句须随槽入历（note 字段）');
  assert.ok(SHEET.includes('description: (slot.note || summary)'), '日历备注须优先回复核心句');
});

test('E144.1-锁7 头部双行分层锁：灵犀星与名称同排对齐＋状态栏独立整行（零遮挡零截断）', () => {
  // 组件结构：row1（头像＋名称＋灵犀星＋✕）与 row2（状态栏）彻底分层
  assert.ok(SHEET.includes('ks-chat-head-row'), '头部第一行须独立 .ks-chat-head-row 双行分层');
  const headIdx = SHEET.indexOf('<div className="ks-chat-head">');
  const rowIdx = SHEET.indexOf('ks-chat-head-row', headIdx);
  const nameIdx = SHEET.indexOf('ks-chat-name', headIdx);
  const starIdx = SHEET.indexOf('className="ks-chat-star"', headIdx);
  const closeIdx = SHEET.indexOf('ks-chat-close', headIdx);
  const statusIdx = SHEET.indexOf('ks-chat-status"', headIdx);
  assert.ok(headIdx >= 0 && rowIdx > headIdx && nameIdx > rowIdx, 'row1 须含灵宠名称');
  assert.ok(nameIdx < starIdx && starIdx < closeIdx, '名称（左）⇒灵犀星⇒✕（右）须同排次序');
  assert.ok(statusIdx > closeIdx, '状态栏须独立第二行（row1 之后——与灵犀星零交集）');
  assert.ok(!SHEET.includes('ks-chat-who'), '旧 .ks-chat-who 单行包裹结构须退役');
  // CSS 军令钦定字面：row1 flex/space-between＋状态栏 width:100% 整行
  const rowCss = CSS.slice(CSS.indexOf('.ks-chat-head-row'), CSS.indexOf('.ks-chat-head-row') + 280);
  assert.ok(/display:\s*flex/.test(rowCss) && /align-items:\s*center/.test(rowCss)
    && /justify-content:\s*space-between/.test(rowCss), 'row1 须 flex/center/space-between（军令钦定字面）');
  const statusCss = CSS.slice(CSS.indexOf('.ks-chat-status {'), CSS.indexOf('.ks-chat-status {') + 260);
  assert.ok(/width:\s*100%/.test(statusCss), '状态栏须占满头部可用宽度（width:100%——昼夜词条零截断）');
  assert.ok(!CSS.includes('.ks-chat-who'), '旧 who 样式须同步退役');
  // head 须 column 分层（双行彻底分层——禁回归单行 center）
  const headCss = CSS.slice(CSS.indexOf('.ks-chat-head {'), CSS.indexOf('.ks-chat-head {') + 200);
  assert.ok(/flex-direction:\s*column/.test(headCss), '.ks-chat-head 须 flex-direction:column 双行分层');
});

/* ═══ 锁5：情感高情商嘴替三档锁 ═══ */

test('E144-锁5a 嘴替意图侦测六语命中/miss（fail-closed 寒暄零误触）＋服务端 prompt 分支', () => {
  assert.ok(RA.detectReplyProxyIntent('TA说想我了，不知道回什么好'), 'zh 命中（TA说/不知道回什么）');
  assert.ok(RA.detectReplyProxyIntent('how should i reply to this message'), 'en 命中');
  assert.ok(RA.detectReplyProxyIntent('il a dit qu\'il me manque, je réponds quoi'), 'fr 命中');
  assert.ok(RA.detectReplyProxyIntent('me escribió esto, cómo respondo'), 'es 命中');
  assert.ok(RA.detectReplyProxyIntent('เขาส่งมาว่าแบบนี้ ตอบยังไงดี'), 'th 命中');
  assert.ok(RA.detectReplyProxyIntent('anh ấy nói vậy thì mình trả lời sao'), 'vi 命中');
  assert.equal(RA.detectReplyProxyIntent('今天天气真不错呀'), null, '日常寒暄严禁误触');
  assert.equal(RA.detectReplyProxyIntent('hi'), null, '过短文本严禁误触');
  assert.equal(RA.detectReplyProxyIntent(''), null, '空文本 fail-closed');
  // 服务端 prompt 分支：末条 user 命中 ⇒ 嘴替块；否则呼吸块（路由内后缀拼接零锚破坏）
  assert.ok(SERVER.includes('detectReplyProxyIntent(_e144LastUser)'), 'chat 路由须侦测末条 user 嘴替意图');
  assert.ok(SERVER.includes('buildAstralReplyProxyPromptBlock(lang)'), '命中须注入嘴替戒律块');
  assert.ok(SERVER.includes('buildAstralBreathingPromptBlock(lang)'), '未命中须注入呼吸留白戒律块');
});

test('E144-锁5b 三档前缀六语逐字＋parseProxyLine 剥壳＋✓ 已复制反馈', () => {
  // 三档前缀六语全量（军令译表表2 逐字）
  for (const tier of ['warm', 'poise', 'exit']) {
    for (const lang of LANGS) {
      const p = RA.proxyTierPrefix(lang, tier);
      assert.ok(p && p.startsWith('▫️'), `${lang}/${tier} 前缀须以 ▫️ 起头（实得 ${p}）`);
    }
  }
  assert.equal(RA.proxyTierPrefix('zh', 'warm'), '▫️ 柔光破冰：', 'zh warm 军令译表逐字');
  assert.equal(RA.proxyTierPrefix('zh', 'poise'), '▫️ 高位笃定：', 'zh poise 军令译表逐字');
  assert.equal(RA.proxyTierPrefix('zh', 'exit'), '▫️ 体面退守：', 'zh exit 军令译表逐字');
  assert.equal(RA.proxyTierPrefix('zh', 'bogus'), '', '白名单外档位 ⇒ 空串');
  // 剥壳：▫️ 前缀行 ⇒ {tier, content}
  const parsed = RA.parseProxyLine('▫️ 柔光破冰：今晚月色很美，说给你听正合适。');
  assert.ok(parsed, '嘴替行须可剥壳');
  assert.equal(parsed.tier, 'warm');
  assert.equal(parsed.content, '今晚月色很美，说给你听正合适。', '剥壳后须为纯话术（前缀零残留）');
  // 非嘴替行 ⇒ null（普通文本行零交互 fail-closed）
  assert.equal(RA.parseProxyLine('普通的一句话'), null, '非 ▫️ 行 ⇒ null');
  assert.equal(RA.parseProxyLine('▫️ 未知前缀的话术'), null, '▫️ 起头但未知前缀 ⇒ null（宁窄勿宽）');
  assert.equal(RA.parseProxyLine(''), null, '空行 ⇒ null');
  // ✓ 已复制反馈六语
  for (const lang of LANGS) {
    assert.ok(RA.copyDoneLabel(lang).startsWith('✓'), `${lang} 复制反馈须以 ✓ 起头`);
  }
  assert.equal(RA.copyDoneLabel('zh'), '✓ 已复制', 'zh 军令译表逐字');
});

test('E144-锁5c 组件轻点复制动线：clipboard 主＋execCommand 兜底＋默契 +5＋✓ 闪现 1.5s', () => {
  assert.ok(SHEET.includes('navigator.clipboard'), '剪贴板主通道须在');
  assert.ok(SHEET.includes('document.execCommand(\'copy\')'), 'execCommand 兜底须在（http 环境）');
  assert.ok(SHEET.includes('handleProxyCopy'), '轻点复制处理函数须在');
  assert.ok(SHEET.includes('applyBondDelta(bondStateRef.current, 5)'), '复制须默契 +5（军令钦定增量）');
  assert.ok(SHEET.includes('proxy-copy-done'), '✓ 已复制内联闪现 testid 须在册');
  assert.ok(SHEET.includes('1500'), '闪现复位须 1.5s（军令钦定）');
  // 阶段块词条逐字（zh 90-110 字四行铁律）
  const zhBlock = RA.buildAstralReplyProxyPromptBlock('zh');
  assert.ok(zhBlock.includes('▫️ 柔光破冰：') && zhBlock.includes('▫️ 高位笃定：') && zhBlock.includes('▫️ 体面退守：'),
    '嘴替戒律块须嵌入三档前缀逐字（模型按钦定前缀输出）');
  assert.ok(zhBlock.includes('90–110 字'), 'zh 嘴替块须锁 90–110 字总篇幅');
  // 呼吸戒律块（zh 独块 60-80 字铁律）
  const breathZh = RA.buildAstralBreathingPromptBlock('zh');
  assert.ok(breathZh.includes('60–80 个汉字'), 'zh 呼吸块须锁 60-80 字');
  assert.ok(breathZh.includes('两个自然段'), 'zh 呼吸块须锁双段结构');
  const breathEn = RA.buildAstralBreathingPromptBlock('en');
  assert.ok(breathEn.includes('40-55 words'), 'en 呼吸块须锁 40-55 词');
});

/* ═══ 锁6：链位与段数（111→112）═══ */

test('E144-锁6 链位：e144 居 e143 后、e40-compat 前；全链 112 段＋node-only 111＋python 恒总链尾', () => {
  const script = String(PKG.scripts['test:astro'] || '');
  assert.ok(script.length > 100, 'test:astro 脚本须在册');
  const chain = script.split('&&').map((s) => s.trim()).filter(Boolean);
  // e144 紧居 e143 后（版本序铁律）
  const segs = chain.map((s) => (s.match(/audit-[a-z0-9-]+\.(?:test\.)?(?:mjs|js)/g) || []).pop()).filter(Boolean);
  const i143 = segs.indexOf('audit-e143-soulbond-veil.test.mjs');
  const i144 = segs.indexOf('audit-e144-astral-rhythm-action.test.mjs');
  const i40 = segs.indexOf('audit-e40-compat-synastry-tensor-fusion.test.mjs');
  assert.ok(i143 > 0, 'e143 段须在链');
  assert.ok(i144 === i143 + 1, 'e144 须紧居 e143 之后（版本序铁律）');
  assert.ok(i40 > i144, 'e40-compat 须恒居 node 链尾（e144 不得插其后）');
  // 总段计数（含 python 尾）＝113（E146 插链后继化）
  assert.equal(chain.length, 124, `链总段必须为 115（实际 ${chain.length}）`);   // 🔴 后继化（E158 入编）：123→124
  const nodeOnly = chain.filter((s) => !/python/.test(s));
  assert.equal(nodeOnly.length, 123, `node-only 段必须为 114（实际 ${nodeOnly.length}）`);   // 🔴 后继化（E158 入编）：122→123
  assert.ok(/python/.test(chain[chain.length - 1]), 'python 段须恒为总链尾');
  // e40 恒 node 链尾（len-2 断言族守恒，python 在其外）
  assert.equal(i40, segs.length - 1, 'e40 须恒 node 链尾');
});
