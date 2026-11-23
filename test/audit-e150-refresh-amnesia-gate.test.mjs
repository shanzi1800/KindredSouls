/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌗 E150 闸门：彻底斩断「刷新直聊」失忆静态兜底（第 22 道防线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（主公军令 2026-11-23，线上实锤路径）：
 *   早间已选今日情绪 → 下午刷新 → 不点「开始测算」→ 爱心 → 与TA聊聊
 *   ⇒ 吐出无记忆静态兜底句「我在呢。今天想聊点什么？」＋15:15 状态栏仍
 *   显「☀️ 晨曦星轨同频」。
 *
 * 根因（侦察实锤）：
 *   ① 罗盘情绪存 sessionStorage（2h 窗）——刷新即丢＋下午超窗 ⇒ P2 掉线；
 *   ② ks_familiar_firststrike_day 也在 sessionStorage——刷新丢 ⇒ mode 链
 *      落 'plain' ⇒ chatHelloPlain 静态句；
 *   ③ L_CIRCADIAN 只两档——白天 06:00-17:59 一律「晨曦」粗档。
 *
 * 五路取证：
 *   A 当日档水合（writeMoodOfDay 双写＋ChatSheet 水合锚＋回访判据锚）；
 *   B 行为级（P2 回忆层／P4 老友问候／E142 原契约零破坏／顺位不串台）；
 *   C 时段状态栏四档（circadianBandOf 边界＋composeCircadianStatus 词面
 *     ——e144 锁1 兼容：morning/night 词面不变）；
 *   D 线上故障路径全链模拟（刷新＝sessionStorage 空＋localStorage 当日档
 *     在＋认领档在 ⇒ 首句命中 P2 回忆，绝不静态占位）；
 *   E 字面扫描（E130 零商业词／零焦虑词——宁窄勿宽）。
 *
 * 运行：node --test test/audit-e150-refresh-amnesia-gate.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SHEET_SRC = read('web/src/components/FamiliarChatSheet.tsx');
const COMPASS_SRC = read('web/src/components/companion/MoodCompassModal.tsx');
const QUEUE_PATH = 'web/src/lib/companionTopicQueue.mjs';

const TQ = await import(path.join(ROOT, QUEUE_PATH).replace(/\\/g, '/'));
const MG = await import(path.join(ROOT, 'web/src/lib/companionMoodGreetings.mjs').replace(/\\/g, '/'));
const RA = await import(path.join(ROOT, 'web/src/lib/astralRhythmAction.mjs').replace(/\\/g, '/'));

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const ROLES = ['girlfriend', 'bestie', 'buddy', 'boyfriend', 'self'];
const MOODS = ['melancholy', 'agitated', 'longing', 'radiant', 'grateful'];
/** 下午 15:15 GMT+8（主公截图时刻——刷新直聊失忆现场） */
const NOW = Date.parse('2026-11-23T07:15:00Z');

/** 假想 Storage（Map 形制——e111/e142 同源） */
const fakeStore = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _m: m,
  };
};

// ═══════════════ A. 当日档水合链（刀二） ═══════════════

test('A1 罗盘确认双写：sessionStorage 即时窗＋localStorage 当日档（刷新不丢）', () => {
  assert.ok(COMPASS_SRC.includes('import { writeActiveMood, writeMoodOfDay }'),
    '罗盘须双导入 writeMoodOfDay');
  assert.ok(COMPASS_SRC.includes('writeMoodOfDay(') && COMPASS_SRC.includes('writeActiveMood(sessionStorage'),
    'handleConfirm 须双写（即时窗＋当日档）');
});

test('A2 ChatSheet 水合锚：todayMoodRef＋returningUserRef＋readMoodOfDay 消费', () => {
  assert.ok(SHEET_SRC.includes("import { readActiveMood, readMoodOfDay, moodGreetingLine }"),
    'Sheet 须导入 readMoodOfDay');
  assert.ok(SHEET_SRC.includes('todayMoodRef = useRef'), '缺 todayMoodRef 锚');
  assert.ok(SHEET_SRC.includes('returningUserRef = useRef'), '缺 returningUserRef 锚');
  assert.ok(SHEET_SRC.includes('readMoodOfDay(store)'), '开窗须从 localStorage 水合当日情绪档');
  assert.ok(SHEET_SRC.includes('topicSnapshotRef.current = { rr, mood: _e142Mood, todayMood: _e150TodayMood }'),
    '话题快照须随行 todayMood');
});

test('A3 回访判据五源（认领档/本命档/永久姓名/历史聊天日/当日情绪档/L1）', () => {
  assert.ok(SHEET_SRC.includes('sig !== \'anon\' || profileNameRef.current'),
    '回访判据须罩认领档/本命档（sig≠anon）＋永久姓名');
  assert.ok(SHEET_SRC.includes('readLastChatDay(store) || _e150TodayMood'),
    '回访判据须罩历史聊天日＋当日情绪档');
  assert.ok(SHEET_SRC.includes('readMicroAction(store, sig)'), '回访判据须罩 L1 微动作档');
});

test('A4 回访用户 mode 链交 p1queue（静态占位句仅纯新客可触达）', () => {
  assert.ok(SHEET_SRC.includes('} else if (_e150TodayMood || _e150Returning) {'),
    'mode 链须有回访分支（当日情绪档/回访判据 ⇒ p1queue）');
  assert.ok(SHEET_SRC.includes('mode = \'p1queue\';'), '回访分支须落 p1queue');
  // p4 回访上下文装配（helloFor p1queue 分支随行）
  assert.ok(SHEET_SRC.includes('p4: (returningUserRef.current && relationMode) ? {'),
    'helloFor p1queue 分支须装配 p4 回访上下文');
});

// ═══════════════ B. 行为级（纯核直测） ═══════════════

test('B1 当日档读写：白名单/跨天失效/刷新不丢/坏档 null/未来时间戳熔断', () => {
  const ls = fakeStore();
  // 刷新不丢：写入后换全新 Storage 读（同一 localStorage 持久语义）
  assert.equal(MG.writeMoodOfDay(ls, 'melancholy', Date.parse('2026-11-23T01:00:00Z')), true, '合法写入须成功');
  assert.equal(MG.readMoodOfDay(ls, NOW), 'melancholy', '早 9 点写入（01:00Z）下午 15:15 读——当天刷新不丢');
  // 跨天失效
  const nextDay = Date.parse('2026-11-24T03:00:00Z');
  assert.equal(MG.readMoodOfDay(ls, nextDay), null, '跨天须自动失效');
  // 白名单外不写
  assert.equal(MG.writeMoodOfDay(ls, 'hacking', NOW), false, '白名单外不写 fail-closed');
  assert.equal(MG.writeMoodOfDay(null, 'joy', NOW), false, '无 storage fail-soft');
  assert.equal(MG.readMoodOfDay(null, NOW), null, '无 storage 读 null');
  // 坏档 null
  const ls2 = fakeStore();
  ls2.setItem('ks_mood_of_day', 'not-json');
  assert.equal(MG.readMoodOfDay(ls2, NOW), null, '坏 JSON 档 null');
  ls2.setItem('ks_mood_of_day', JSON.stringify({ mood: 'melancholy', timestamp: NOW + 9e9, date: '2026-11-23' }));
  assert.equal(MG.readMoodOfDay(ls2, NOW), null, '未来时间戳熔断');
  // 六语白名单五原型全覆盖抽验
  for (const m of MOODS) {
    const ls3 = fakeStore();
    MG.writeMoodOfDay(ls3, m, NOW);
    assert.equal(MG.readMoodOfDay(ls3, NOW), m, `五原型 ${m} 须可写可读`);
  }
});

test('B2 P2 回忆层：今日早间情绪超 2h 也记得（军令「严禁装作没发生过」）', () => {
  // 刷新场景：2h 即时窗 miss（sessionStorage 丢/超窗）⇒ todayMood 兜底
  const q = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, todayMood: 'melancholy', lang: 'zh', now: NOW,
  });
  assert.ok(q && q.firstLine.includes('早上那份'), 'P2 回忆句须产出（「早上那份…」句式）');
  assert.ok(!q.firstLine.includes('我在呢') && !q.firstLine.includes('今天想聊点什么'),
    '回忆句严禁静态占位形态（锁1 红线）');
  assert.ok(q.queue.includes('mood:melancholy'), '回忆层话题标记须入队');
  // 即时窗在场 ⇒ 回忆层让位（即时共情优先）
  const q2 = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: 'radiant', todayMood: 'melancholy', lang: 'zh', now: NOW,
  });
  assert.ok(q2 && q2.firstLine.includes('明亮') && !q2.firstLine.includes('早上那份'),
    '即时窗在场 ⇒ 回忆层让位（顺位 P2即时＞P2回忆）');
  // 坏 todayMood ⇒ 静默（五原型白名单外）
  const q3 = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, todayMood: 'hacking', lang: 'zh', now: NOW,
  });
  assert.equal(q3, null, '白名单外 todayMood ⇒ null fail-closed');
});

test('B3 P4 老友问候：五角色 × 六语 × 时段四档全量产出（绝不静态占位）', () => {
  for (const role of ROLES) {
    for (const lang of LANGS) {
      const q = TQ.resolveCompanionGreetingAndQueue({
        recentReport: null, activeMood: null, lang, now: NOW,
        p4: { relationMode: role, hour: 15 },
      });
      assert.ok(q && q.firstLine && q.firstLine.length > 20, `P4 须产出 role=${role} lang=${lang}`);
      assert.ok(!q.firstLine.includes('我在呢') && !q.firstLine.includes('今天想聊点什么'),
        `P4 严禁静态占位形态 role=${role} lang=${lang}`);
      assert.equal(q.p4Band, 'afternoon', `15 点 ⇒ afternoon role=${role}`);
      assert.equal(q.followedUp, false, `P4 不带 followedUp role=${role}`);
    }
  }
  // 时段四档切换（hour 注入）
  for (const [hour, band] of [[9, 'morning'], [15, 'afternoon'], [18, 'dusk'], [22, 'night'], [3, 'night']]) {
    const q = TQ.resolveCompanionGreetingAndQueue({
      recentReport: null, activeMood: null, lang: 'zh', now: NOW,
      p4: { relationMode: 'girlfriend', hour },
    });
    assert.equal(q && q.p4Band, band, `hour=${hour} ⇒ ${band}`);
  }
  // 角色口吻分化抽验（zh 首词）
  const of = (role) => TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW, p4: { relationMode: role, hour: 15 },
  }).firstLine;
  assert.ok(of('boyfriend').startsWith('我一直都在。'), 'boyfriend 开场须为「我一直都在。」');
  assert.ok(of('self').startsWith('我们碰个面吧。'), 'self 开场须为「我们碰个面吧。」');
  // 坏角色 ⇒ null（p4 缺席/白名单外——E142 原契约）
  assert.equal(TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW, p4: { relationMode: 'hacker', hour: 15 },
  }), null, '坏角色 ⇒ null fail-closed');
  // userName 门控前缀（调用方判定后传名）
  const named = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW,
    p4: { relationMode: 'girlfriend', userName: 'North', hour: 22 },
  });
  assert.ok(named.firstLine.startsWith('North，'), 'P4 称呼前缀须拼接（门控由调用方）');
});

test('B4 E142 原契约零破坏：不传 todayMood/p4 ⇒ null（e142 锁1d／e149 E1 断言零后继化）', () => {
  assert.equal(TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW, relationMode: 'boyfriend',
  }), null, '无料无 p4 ⇒ null（原契约不变）');
  const stale = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'love', tier: 'core', unlockedAt: NOW - 26 * 3600 * 1000 },
    activeMood: null, lang: 'zh', now: NOW,
  });
  assert.equal(stale, null, '隔日报告无情绪 ⇒ null（e142 锁1c 兼容）');
});

test('B5 顺位不串台：P1＞P2即时＞P2回忆＞P3＞P4', () => {
  const todayRR = { category: 'love', tier: 'core', unlockedAt: NOW - 1000 };
  // P1 优先（今日新牌在场 ⇒ P1 承接，回忆让位）
  const p1 = TQ.resolveCompanionGreetingAndQueue({
    recentReport: todayRR, activeMood: null, todayMood: 'melancholy', lang: 'zh', now: NOW,
    lastMicroAction: { emotion_key: 'anger', action_summary: 'x', created_date: '2026-11-22', followed_up: false },
    relationMode: 'boyfriend', p4: { relationMode: 'boyfriend', hour: 15 },
  });
  assert.ok(p1 && p1.firstLine.includes('塔罗牌面'), 'P1 须恒首位');
  assert.equal(p1.followedUp, false, 'P1 在场时 P3/P4 严禁并发');
  // 全静默＋P3 与 p4 并发 ⇒ P3 优先（L1 微动作 48h 内）
  const p3 = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW,
    lastMicroAction: { emotion_key: 'anger', action_summary: 'x', created_date: '2026-11-22', followed_up: false },
    relationMode: 'boyfriend', p4: { relationMode: 'boyfriend', hour: 15 },
  });
  assert.ok(p3 && p3.queue.includes('micro:anger') && p3.followedUp, 'P3 ＞ P4（L1 回访优先）');
});

// ═══════════════ C. 时段状态栏四档（刀三后半） ═══════════════

test('C1 circadianBandOf 四档边界（05–11 晨／12–17 午／18–19 暮／20–04 夜）', () => {
  const cases = [
    [5, 0, 'morning'], [11, 59, 'morning'],
    [12, 0, 'afternoon'], [15, 15, 'afternoon'], [17, 59, 'afternoon'],
    [18, 0, 'dusk'], [19, 59, 'dusk'],
    [20, 0, 'night'], [23, 59, 'night'], [0, 0, 'night'], [4, 59, 'night'],
    [99, 0, 'night'], [-1, 0, 'night'],
  ];
  for (const [h, m, band] of cases) {
    assert.equal(RA.circadianBandOf(h, m), band, `${h}:${String(m).padStart(2, '0')} ⇒ ${band}`);
  }
});

test('C2 composeCircadianStatus 四档词面（15:15 ⇒ 午后暖阳共振——主公实锤根治）', () => {
  const bond = '灵犀默契 Lv.2 星轨同频 · 62';
  // e144 锁1 兼容：morning/night 词面不变
  const morning = RA.composeCircadianStatus(bond, 9, 0, 'zh');
  assert.ok(morning.includes('☀️ 晨曦星轨同频'), `9:00 仍须晨曦（e144 兼容；实得 ${morning}）`);
  const night = RA.composeCircadianStatus(bond, 21, 30, 'zh');
  assert.ok(night.includes('🌙 星夜守护磁场'), `21:30 须星夜（e144 兼容；实得 ${night}）`);
  // 🆕 E150 四档根治
  const afternoon = RA.composeCircadianStatus(bond, 15, 15, 'zh');
  assert.ok(afternoon.includes('☀️ 午后暖阳共振'), `15:15 须午后暖阳（主公截图病灶根治；实得 ${afternoon}）`);
  assert.ok(!afternoon.includes('晨曦'), '15:15 严禁再显晨曦');
  const dusk = RA.composeCircadianStatus(bond, 18, 30, 'zh');
  assert.ok(dusk.includes('🌆 暮色微光同频'), `18:30 须暮色（实得 ${dusk}）`);
  // 四档六语全量
  for (const lang of LANGS) {
    assert.ok(RA.composeCircadianStatus(bond, 15, 0, lang).includes('☀️'), `afternoon 六语 ${lang} 须有词`);
    assert.ok(RA.composeCircadianStatus(bond, 18, 30, lang).includes('🌆'), `dusk 六语 ${lang} 须有词`);
  }
});

test('C3 状态栏实时刷新锚：60s interval 重算＋关窗清理（不被开窗快照锁死）', () => {
  assert.ok(SHEET_SRC.includes('setCircadianClock({ hour: d.getHours(), minute: d.getMinutes() })'),
    '开窗快照 setCircadianClock 须在场');
  const i = SHEET_SRC.indexOf('_e150Timer');
  assert.ok(i > 0, '缺 60s interval 刷新锚');
  const seg = SHEET_SRC.slice(i, i + 700);
  assert.ok(seg.includes('60 * 1000'), 'interval 须 60 秒档');
  assert.ok(seg.includes('clearInterval'), '关窗须清理零泄漏');
});

// ═══════════════ D. 线上故障路径全链模拟（军令刀四钦定路径） ═══════════════

test('D1 刷新直聊路径：早间情绪已落库＋刷新（sessionStorage 空）＋点与TA聊聊 ⇒ P2 回忆命中非占位', () => {
  // ── 早间：罗盘确认（双写落 localStorage 当日档）──
  const ls = fakeStore();
  const morningTs = Date.parse('2026-11-23T01:30:00Z'); // 早 9:30 GMT+8
  assert.equal(MG.writeMoodOfDay(ls, 'melancholy', morningTs), true, '早间罗盘确认须落当日档');
  // ── 下午 15:15：刷新 ⇒ sessionStorage 全空（新会话）──
  const freshSS = fakeStore();
  assert.equal(MG.readActiveMood(freshSS, new Date(NOW)), null, '刷新后 2h 即时窗须 miss');
  // ── 水合：开窗从 localStorage 当日档读回 ──
  const todayMood = MG.readMoodOfDay(ls, NOW);
  assert.equal(todayMood, 'melancholy', '当日档水合须读回早间情绪（刷新不丢）');
  // ── 首句路由：queue 消费 ──
  const q = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, todayMood, lang: 'zh', now: NOW,
    relationMode: 'girlfriend',
    p4: { relationMode: 'girlfriend', hour: 15 },
  });
  assert.ok(q && q.firstLine, '水合后首句须产出');
  assert.ok(!q.firstLine.includes('我在呢') && !q.firstLine.includes('今天想聊点什么'),
    '军令铁律：绝不输出静态无记忆占位句（线上故障根治断言）');
  assert.ok(q.firstLine.includes('早上那份沉甸甸'), 'P2 回忆须自然承接早间情绪（记得发生过）');
});

test('D2 刷新直聊无情绪档路径：认领档在 ⇒ 回访判据命中 ⇒ P4 老友问候（非占位）', () => {
  // 刷新后：无情绪档、无牌、无 L1、无即时窗——但有认领档（回访用户）
  const q = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, todayMood: null, lang: 'zh', now: NOW,
    relationMode: 'boyfriend',
    p4: { relationMode: 'boyfriend', hour: 15 }, // returningUser ⇒ hour 15
  });
  assert.ok(q && q.firstLine.includes('我一直都在') && q.firstLine.includes('午后'),
    '回访用户全静默 ⇒ P4 带记忆老友问候（角色口吻＋实时时段）');
  assert.ok(!q.firstLine.includes('我在呢'), '绝不静态占位');
});

// ═══════════════ E. 字面扫描（宁窄勿宽） ═══════════════

test('E1 E150 新字典零商业词＋零焦虑词（E130 红线＋军令零焦虑铁律）', () => {
  const queueSrc = read(QUEUE_PATH);
  // 纯字典窗（E150_P2_RECALL → E142 根修注释——避开模板字面量 ${} 的 $ 误伤）
  const e150 = queueSrc.slice(queueSrc.indexOf('const E150_P2_RECALL'), queueSrc.indexOf('🔧 E142 根修'));
  for (const banned of ['价格', '付费', '购买', '订阅', '解锁', '$', '¥']) {
    assert.ok(!e150.includes(banned), `E150 字典出现商业词「${banned}」（E130 红线）`);
  }
  for (const banned of ['一定', '肯定', '绝对', '注定', '完蛋了']) {
    assert.ok(!e150.includes(banned), `E150 字典出现绝对化词「${banned}」（零焦虑铁律）`);
  }
  // 时段四档词表同扫
  const raSrc = read('web/src/lib/astralRhythmAction.mjs');
  const bands = raSrc.slice(raSrc.indexOf('L_CIRCADIAN_BANDS'), raSrc.indexOf('/** 昼夜状态前缀词条'));
  for (const banned of ['$', '¥', '价格', '付费']) {
    assert.ok(!bands.includes(banned), `时段词表出现商业词「${banned}」`);
  }
});
