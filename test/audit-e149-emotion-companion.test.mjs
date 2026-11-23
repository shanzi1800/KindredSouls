/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌗 E149 闸门：灵魂陪伴内核升级——5 角色人设分化（含 Me）× Plutchik 八大
 *    情绪正向转译 × L1 次日轻复盘闭环（第 21 道防线）
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（主公军令 2026-11-20：《E149 军令》5 角色完整定稿版）
 *   —— 「吸其神（情绪正向转译＋行动复盘闭环），去其壳（不碰硬件、去临床
 *      心理味）」，全部装进首页唯一对话窗，不新增页面。
 *
 * 五路取证（刻意避让既有射程：e40a 第五形态 inert 隔离、e110 四象人设锁、
 * e115 代词红线、e142 有序话题队列、e148 P1 当日硬门）：
 *   A 白名单：me（self）独立路由命中——E149_CHAT_RELATION_MODES 五键＋
 *     FAMILIAR_CHAT_RELATION_MODES 扩 self＋adopt 通路四象锁零破坏；
 *   B 行为级：self prompt 独立语态（绝不静默降级 Milo/Sophia/girlfriend）；
 *   C 情绪核：Plutchik 八情绪正向映射——键集恰 8、六语全量、行为级注入；
 *   D 语调铁律：零焦虑词/零临床术语/E130 零商业词字面扫描（宁窄勿宽）；
 *   E L1 闭环：last_micro_action 形状守卫＋48h 过期＋followed_up 单次死锁
 *     ＋done 帧随行＋companionTopicQueue P1-P4 顺位不串台。
 *
 * 运行：node --test test/audit-e149-emotion-companion.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const SERVER_SRC = read('server.js');
const PICKER_SRC = read('web/src/components/FamiliarPicker.tsx');
const QUEUE_PATH = 'web/src/lib/companionTopicQueue.mjs';
const MEMORY_PATH = 'web/src/lib/microActionMemory.mjs';

const E149_EMOTIONS = ['joy', 'sadness', 'trust', 'disgust', 'fear', 'anger', 'surprise', 'anticipation'];
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const ROLES = ['girlfriend', 'bestie', 'buddy', 'boyfriend', 'self'];
const NOW = Date.parse('2026-11-20T10:00:00Z');

// ── VM 抽取式搬运（e110 同源纪律）──
function sliceBraced(src, marker, skipParams = false) {
  const i = src.indexOf(marker);
  assert.notEqual(i, -1, `未找到 ${marker}`);
  let start;
  if (skipParams) {
    // 解构参数签名：自 marker 起找首个 '(' 后匹配到首个 '){'
    const open = src.indexOf('(', i);
    let depth = 0, j = open;
    for (; j < src.length; j++) {
      if (src[j] === '(') depth++;
      else if (src[j] === ')') { depth--; if (depth === 0) break; }
    }
    start = src.indexOf('{', j);
  } else {
    start = src.indexOf('{', i);
  }
  let depth = 0, end = start;
  for (; end < src.length; end++) {
    if (src[end] === '{') depth++;
    else if (src[end] === '}') { depth--; if (depth === 0) break; }
  }
  let e = end + 1;
  while (src[e] === ')' || src[e] === ';') e++;
  return src.slice(i, e);
}

const PERSONA_SRC = sliceBraced(SERVER_SRC, 'const FAMILIAR_CHAT_PERSONA =');
const LOCK_SRC = sliceBraced(SERVER_SRC, 'const FAMILIAR_PERSONA_LOCK =');
const SIGNZH_SRC = sliceBraced(SERVER_SRC, 'const FAM_SIGN_ZH =');
const LANGNAME_SRC = sliceBraced(SERVER_SRC, 'const FAM_LANG_NAME =');
const E115_SRC = SERVER_SRC.slice(
  SERVER_SRC.indexOf('const E115_GENDER_MATRIX'),
  SERVER_SRC.indexOf('function _e115RetryHint'),
);
const PROMPTFN_SRC = sliceBraced(SERVER_SRC, 'function buildFamiliarChatSystemPrompt(', true);
const vmFactory = new Function(
  `${PERSONA_SRC}\n${LOCK_SRC}\n${SIGNZH_SRC}\n${LANGNAME_SRC}\n${E115_SRC}\n${PROMPTFN_SRC}\nreturn buildFamiliarChatSystemPrompt;`,
);
const buildPrompt = vmFactory();

const EMPTY_NATAL = { sun: null, moon: null, asc: null, venus: null, mars: null, source: 'none' };
const call = (over = {}) => buildPrompt({
  ip: 'Sophia', name: 'Sophia', lang: 'zh', mode: 'girlfriend',
  natal: EMPTY_NATAL, fortune: null, tarot: null, trine: null, ...over,
});

// 前端纯核动态 import
const TQ = await import(path.join(ROOT, QUEUE_PATH).replace(/\\/g, '/'));
const MEM = await import(path.join(ROOT, MEMORY_PATH).replace(/\\/g, '/'));

// ═══════════════ F. 自由输入全 8 类情绪识别（2026-11-23 主公确认锚点）═══════════════

test('F1 自由输入识别器在场＋窄词典全 8 键（宁窄勿宽）', () => {
  assert.ok(SERVER_SRC.includes('function _e149DetectEmotionFromText(text)'), '缺自由输入识别器');
  assert.ok(SERVER_SRC.includes('const E149_TEXT_EMOTION_LEXICON = Object.freeze('), '缺窄词典');
  const lex = SERVER_SRC.slice(SERVER_SRC.indexOf('const E149_TEXT_EMOTION_LEXICON'),
    SERVER_SRC.indexOf('function _e149DetectEmotionFromText'));
  for (const emo of E149_EMOTIONS) {
    assert.ok(lex.includes(`${emo}: [`), `窄词典缺 ${emo} 键（全 8 类识别军令）`);
  }
});

test('F2 行为级：三级顺位解析（显式随行＞罗盘映射＞自由文本）', () => {
  // VM 抽取从 E149_EMOTION_KEYS 起切（resolve 闭包消费该白名单＋映射表）
  const fnSrc = SERVER_SRC.slice(SERVER_SRC.indexOf('const E149_EMOTION_KEYS'),
    SERVER_SRC.indexOf('/** 🆕 E149-刀二'));
  const factory = new Function(`${fnSrc}\nreturn { resolve: _e149ResolveEmotionSignal, detect: _e149DetectEmotionFromText };`);
  const { resolve, detect } = factory();
  // ① 显式随行优先
  assert.equal(resolve({ emotionSignal: 'joy' }, 'melancholy', '我好生气'), 'joy');
  // ② 罗盘映射次之
  assert.equal(resolve({}, 'agitated', ''), 'fear');
  assert.equal(resolve({}, 'longing', ''), 'trust');
  // ③ 自由文本兕底：愤怒/恐惧/排斥/惊讶/期待全 8 类抽验
  assert.equal(detect('他今天真的把我气死了，太生气了'), 'anger');
  assert.equal(detect('I am so worried about the exam, really anxious'), 'fear');
  assert.equal(detect('我很讨厌这种被忽视的感觉，好反感'), 'disgust');
  assert.equal(detect('居然升职了？完全没想到，太惊讶了'), 'surprise');
  assert.equal(detect('好期待下周的旅行，迫不及待了'), 'anticipation');
  assert.equal(detect('今天好开心啊，高兴'), 'joy');
  assert.equal(detect('心里很难过，想哭'), 'sadness');
  assert.equal(detect('很感恩大家帮我，心里很踏实安心'), 'trust');
  // 无情绪文本 ⇒ null（零破坏回退）
  assert.equal(detect('今天天气怎么样'), null);
  assert.equal(detect(''), null);
  assert.equal(resolve({}, null, '今天天气怎么样'), null);
});

test('F3 chat 路由接线：末条 user 文本作为第三顺位识别源', () => {
  assert.ok(SERVER_SRC.includes("_e149ResolveEmotionSignal(body, _e123Mood,"), '路由未换三参签名');
  assert.ok(SERVER_SRC.includes("messages[messages.length - 1].content"), '路由未喂末条 user 文本');
});

// ═══════════════ A. me（self）独立路由命中 ═══════════════

test('A1 E149 chat 白名单五键（四象＋self；adopt 通路四象锁零破坏）', () => {
  assert.ok(SERVER_SRC.includes("const E149_CHAT_RELATION_MODES = new Set(['girlfriend', 'bestie', 'buddy', 'boyfriend', 'self'])"),
    '缺 E149_CHAT_RELATION_MODES 五键白名单');
  assert.ok(SERVER_SRC.includes("const FAMILIAR_CHAT_RELATION_MODES = new Set(['girlfriend', 'bestie', 'buddy', 'boyfriend', 'self'])"),
    'chat 绿道② 白名单须扩 self（me 档在场即付费证明形制延续）');
  // adopt/合盘通路（e40a A4 射程）恒四象——严禁扩 self
  const adopt = SERVER_SRC.match(/const FAMILIAR_RELATION_MODES = new Set\(\[([^\]]*)\]\)/);
  assert.ok(adopt, 'server.js 缺 FAMILIAR_RELATION_MODES');
  const vals = adopt[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean).sort();
  assert.deepEqual(vals, ['bestie', 'boyfriend', 'buddy', 'girlfriend'],
    'adopt 通路四象锁被破坏（e40a inert 隔离铁律）');
  // 前端选择器静默铁律（e40a A4）零回归——self 字面严禁入 FamiliarPicker
  assert.ok(!PICKER_SRC.includes("'self'") && !PICKER_SRC.includes('"self"'),
    '前端选择器出现 self（用户可见选择项 ⇒ 违背前端静默铁律）');
});

test('A2 chat 路由入参守卫换 E149 白名单（400 拒发形态保全）', () => {
  assert.ok(SERVER_SRC.includes('if (!E149_CHAT_RELATION_MODES.has(mode))'),
    'chat 路由入参守卫须消费 E149_CHAT_RELATION_MODES');
  assert.ok(!SERVER_SRC.includes('if (!FAMILIAR_RELATION_MODES.has(mode))'),
    'chat 路由严禁再消费 adopt 四象白名单（self 会 400 静默降级）');
  assert.ok(SERVER_SRC.includes("code: 'BAD_RELATION_MODE'"), 'BAD_RELATION_MODE 400 拒发形态漂移');
});

test('A3 第五语态锁齐备（FAMILIAR_PERSONA_LOCK.self ＋ E149_SELF_PERSONA）', () => {
  assert.ok(LOCK_SRC.includes('self: {'), 'FAMILIAR_PERSONA_LOCK 缺 self 第五语态键');
  assert.ok(LOCK_SRC.includes('另一个自己（Me）'), 'self 锁缺钦定称谓');
  assert.ok(LOCK_SRC.includes('我们'), 'self 锁缺「我们」镜面对话语感锚');
  assert.ok(SERVER_SRC.includes('const E149_SELF_PERSONA ='), '缺 E149_SELF_PERSONA 常量');
  // 别名闭集不入 chat 白名单（宁窄勿宽——铁律 19）
  assert.ok(!SERVER_SRC.includes("'twin_self'"), '别名 twin_self 严禁入生产白名单');
  assert.ok(!SERVER_SRC.includes("'higher_self'"), '别名 higher_self 严禁入生产白名单');
});

test('A4 行为级：self prompt 独立语态命中（绝不静默降级 Milo/Sophia/girlfriend）', () => {
  const p = call({ mode: 'self' });
  assert.ok(p.includes('另一个自己'), 'self prompt 缺「另一个自己」身份命中');
  assert.ok(p.includes('我们'), 'self prompt 缺「我们」镜面对话语感');
  assert.ok(!p.includes('善良女友'), 'self prompt 静默降级为 girlfriend（军令红线）');
  assert.ok(!p.includes('贴心闺蜜') && !p.includes('帅气男友') && !p.includes('铁哥们儿'),
    'self prompt 串入四象称谓（人设漂移）');
  assert.ok(!p.includes('你是「Milo」') && !p.includes('你是「Sophia」'),
    'self prompt 不得自称 Milo/Sophia IP 名');
  // 元问题应答特例
  assert.ok(p.includes('我是住在你心里的另一个自己'), 'self 元问题应答特例缺失');
  // 四象回归（零破坏）
  for (const [mode, role] of [['girlfriend', '善良女友'], ['bestie', '贴心闺蜜'], ['boyfriend', '帅气男友'], ['buddy', '铁哥们儿']]) {
    const q = call({ mode });
    assert.ok(q.includes(role), `${mode} 四象语态零回归破坏`);
    assert.ok(!q.includes('另一个自己（Me）'), `${mode} 串入 self 称谓`);
  }
});

// ═══════════════ B. Plutchik 八情绪正向映射 ═══════════════

test('B1 E149_EMOTION_KEYS 白名单恰 8 键（与构造器字典同源）', () => {
  assert.ok(SERVER_SRC.includes("const E149_EMOTION_KEYS = new Set(['joy', 'sadness', 'trust', 'disgust', 'fear', 'anger', 'surprise', 'anticipation'])"),
    'E149_EMOTION_KEYS 白名单八键漂移');
});

test('B2 E149_PLUTCHIK_MAP 八情绪 × 六语全量（signal＋micro 双字段齐备）', () => {
  const fnBody = PROMPTFN_SRC;
  assert.ok(fnBody.includes('const E149_PLUTCHIK_MAP = {'), '构造器缺 E149_PLUTCHIK_MAP');
  // 逐情绪逐语抽验：zh/en/fr/es/th/vi 的 signal 与 micro 键须齐备
  for (const emo of E149_EMOTIONS) {
    const seg = fnBody.slice(fnBody.indexOf(`${emo}: {`), fnBody.indexOf(`${emo}: {`) + 2400);
    assert.ok(fnBody.includes(`${emo}: {`), `字典缺情绪键 ${emo}`);
    for (const l of LANGS) {
      assert.ok(new RegExp(`${l}: \\{ signal:`).test(seg), `${emo} 缺 ${l} signal（六语对齐铁律）`);
      assert.ok(new RegExp(`${l}: \\{ signal:[\\s\\S]*?micro:`).test(seg), `${emo} 缺 ${l} micro（六语对齐铁律）`);
    }
  }
});

test('B3 行为级：emotionSignal 命中 ⇒ 情绪转译块注入（zh 直给＋他语 signal 喂料）', () => {
  const p = call({ mode: 'girlfriend', emotionSignal: 'anger' });
  assert.ok(p.includes('EMOTION SIGNAL TRANSLATION'), '情绪转译块未注入');
  assert.ok(p.includes('愤怒'), 'anger zh 标签未注入');
  assert.ok(p.includes('捍卫'), 'anger 正向信号（捍卫边界的能量）未注入');
  assert.ok(p.includes('EMOTION COMPANION TONE LAWS'), '四条语调铁律块未注入');
  // TONE LAWS 恒注入（无情绪信号也在场）
  const q = call({ mode: 'girlfriend', emotionSignal: null });
  assert.ok(q.includes('EMOTION COMPANION TONE LAWS'), '铁律块须恒注入');
  assert.ok(!q.includes('EMOTION SIGNAL TRANSLATION'), '无信号 ⇒ 转译块不注入（零破坏）');
  // 非白名单信号 ⇒ 块不注入（fail-closed 在路由侧；构造器直喂非法键亦不炸）
  const bad = call({ mode: 'girlfriend', emotionSignal: 'hacking' });
  assert.ok(!bad.includes('EMOTION SIGNAL TRANSLATION'), '非法信号须不注入');
});

test('B4 E123 罗盘五原型 → 八情绪映射真源在场（2026-11-23 主公确认锚点校准版）', () => {
  assert.ok(SERVER_SRC.includes("melancholy: 'sadness'"), 'melancholy 映射漂移');
  assert.ok(SERVER_SRC.includes("agitated: 'fear'"), 'agitated 映射漂移');
  assert.ok(SERVER_SRC.includes("longing: 'trust'"), 'longing 映射漂移（想念→信任联结路线，主公钦定）');
  assert.ok(SERVER_SRC.includes("radiant: 'joy'"), 'radiant 映射漂移');
  assert.ok(SERVER_SRC.includes("grateful: 'trust'"), 'grateful 映射漂移');
  // 前端罗盘 UI 冻结铁律（2026-11-23 锁死）：严禁增删卡片或改文案
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(!sheet.includes("'anticipation'") || !sheet.includes('emotionSignal'),
    '前端严禁新增 emotionSignal 显式随行（罗盘 5 气泡 UI＋映射全在服务端）');
});

// ═══════════════ C. 四条语调铁律字面扫描（宁窄勿宽）═══════════════

test('C1 E149 产出文案零临床术语（去临床味铁律；扫描窗避开负向清单引用区）', () => {
  // 扫描窗①：E149_EMOTION_LABELS＋E149_PLUTCHIK_MAP（TONE_LAW 负向清单之前）
  const win1 = PROMPTFN_SRC.slice(PROMPTFN_SRC.indexOf('E149 刀一'), PROMPTFN_SRC.indexOf('const E149_TONE_LAW'));
  // 扫描窗②：emotionBlock＋microActionBlock（TONE_LAW 之后、E129 之前）
  const win2 = PROMPTFN_SRC.slice(PROMPTFN_SRC.indexOf('const emotionBlock'), PROMPTFN_SRC.indexOf('🆕 E129-刀二'));
  for (const e149Scan of [win1, win2]) {
    for (const banned of ['认知重构', '情绪归因', 'CBT', '心理模式', '心理咨询']) {
      assert.ok(!e149Scan.includes(banned), `E149 文案出现临床术语「${banned}」`);
    }
  }
});

test('C2 E149 产出文案零焦虑词（零绝对化恐吓铁律）', () => {
  const e149Scan = PROMPTFN_SRC.slice(PROMPTFN_SRC.indexOf('E149 刀一'), PROMPTFN_SRC.indexOf('🆕 E129-刀二'))
    + JSON.stringify(Object.values({}));
  // 字典与块文案扫描（signal/micro/回访句——front lib 同扫）
  const queueSrc = read(QUEUE_PATH);
  const e149Queue = queueSrc.slice(queueSrc.indexOf('E149-刀三'));
  for (const banned of ['完蛋了', '必死', '崩盘', '注定']) {
    assert.ok(!e149Queue.includes(banned), `E149 首句字典出现恐吓词「${banned}」`);
  }
  // 铁律块内引用的违禁词清单本身除外（负向清单＝纪律不是产出）——只扫 E149_MOOD_TRANSLATIONS/E149_MICRO_FOLLOWUPS/E149_ROLE_OPENERS 字典行
  const dictStart = queueSrc.indexOf('const E149_ROLE_OPENERS');
  const dictEnd = queueSrc.indexOf('六语称谓前缀分隔符');
  const dictSrc = queueSrc.slice(dictStart, dictEnd);
  for (const banned of ['一定', '肯定', '绝对', '注定', '完蛋了']) {
    assert.ok(!dictSrc.includes(banned), `E149 角色字典出现绝对化词「${banned}」（军令零焦虑词）`);
  }
});

test('C3 E149 产出文案零商业词（E130 红线）', () => {
  const queueSrc = read(QUEUE_PATH);
  const dictSrc = queueSrc.slice(queueSrc.indexOf('const E149_ROLE_OPENERS'), queueSrc.indexOf('六语称谓前缀分隔符'));
  for (const banned of ['价格', '付费', '购买', '订阅', '解锁', '$', '¥', 'USD', 'CNY']) {
    assert.ok(!dictSrc.includes(banned), `E149 首句字典出现商业词「${banned}」（E130 红线）`);
  }
});

// ═══════════════ D. L1 行动回访闭环 ═══════════════

test('D1 server _e149MicroAction 形状守卫（fail-closed 形制）', () => {
  assert.ok(SERVER_SRC.includes('function _e149MicroAction(v, nowMs)'), '缺 _e149MicroAction 守卫');
  assert.ok(SERVER_SRC.includes('_e149MicroAction(body.lastMicroAction)'), 'chat 路由未消费 lastMicroAction 守卫');
  assert.ok(SERVER_SRC.includes('lastMicroAction: _e149LastMicro'), '构造调用未传 lastMicroAction');
});

test('D2 行为级：48h 过期＋followed_up 单次死锁（防翻旧账）', () => {
  // 从 server 源码 VM 抽取守卫函数（零模块副作用；闭花括号须完整截取）
  const fnStart = SERVER_SRC.indexOf('function _e149MicroAction');
  const fnSrc = SERVER_SRC.slice(fnStart, SERVER_SRC.indexOf('\n}', fnStart) + 2);
  const guard = new Function(`${fnSrc}\nconst E149_EMOTION_KEYS = new Set(['joy', 'sadness', 'trust', 'disgust', 'fear', 'anger', 'surprise', 'anticipation']);\nreturn _e149MicroAction;`)();
  const ok = { emotion_key: 'anger', action_summary: '先稳住情绪再平静立下边界', created_date: '2026-11-20', followed_up: false };
  const g = guard(ok, NOW);
  assert.ok(g && g.emotion_key === 'anger', '合法档须放行');
  assert.equal(guard({ ...ok, followed_up: true }, NOW), null, 'followed_up=true 须死锁（单次回访）');
  assert.equal(guard({ ...ok, created_date: '2026-11-17', followed_up: false }, NOW), null,
    '超 48h 须过期（2026-11-17 12:00Z 距 11-20 10:00Z＝70h＞48h）');
  assert.equal(guard({ ...ok, created_date: '2026-11-18T', followed_up: false }, NOW), null, '坏日期格式 fail-closed');
  assert.ok(guard({ ...ok, created_date: '2026-11-19', followed_up: false }, NOW), '48h 窗内档放行（11-19 12:00Z 距今 22h）');
  assert.equal(guard({ ...ok, emotion_key: 'hacking' }, NOW), null, '非法 emotion_key fail-closed');
  assert.equal(guard({ ...ok, action_summary: 'x'.repeat(121) }, NOW), null, '超长摘要 fail-closed');
  assert.equal(guard({ ...ok, action_summary: '带\n换行' }, NOW), null, '换行注入 fail-closed');
});

test('D3 done 帧 microAction 随行（emotionSignal 命中 ⇒ 摘要六语随行）', () => {
  assert.ok(SERVER_SRC.includes('microAction: (_e149EmotionSignal'), 'done 帧缺 microAction 随行');
  assert.ok(SERVER_SRC.includes('E149_MICRO_ACTION_SUMMARY'), '缺微动作摘要字典');
  // 六语全量抽验（anger 行内六语键齐备）
  const seg = SERVER_SRC.slice(SERVER_SRC.indexOf('  anger: { zh:'), SERVER_SRC.indexOf('  anger: { zh:') + 500);
  for (const l of LANGS) {
    // fr/es 含搬音字符摘要用双引号形制——两种引号形态均合法
    assert.ok(new RegExp(`${l}: ['"]`).test(seg), `E149_MICRO_ACTION_SUMMARY.anger 缺 ${l}`);
  }
});

test('D4 前端 microActionMemory 纯核（48h 过期＋单次死锁＋隐私 fail-soft）', () => {
  assert.equal(MEM.guardMicroAction({ emotion_key: 'anger', action_summary: 'x', created_date: '2026-11-20', followed_up: false }, NOW) !== null, true, '合法档放行');
  assert.equal(MEM.guardMicroAction({ emotion_key: 'anger', action_summary: 'x', created_date: '2026-11-20', followed_up: true }, NOW), null, '已回访死锁');
  // 假想内存 Storage（48h 过期行为级）
  const store = new Map();
  const ls = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  assert.equal(MEM.writeMicroAction(ls, 'sig1', { emotion_key: 'joy', action_summary: '留住一个开心的小瞬间', created_date: '2026-11-20' }, NOW), true, '写入须成功');
  assert.ok(MEM.readMicroAction(ls, 'sig1', NOW), '写入后可读');
  assert.equal(MEM.readMicroAction(ls, 'sig2', NOW), null, '按盘隔离（sig2 无档）');
  assert.equal(MEM.writeMicroAction(null, 'sig1', { emotion_key: 'joy', action_summary: 'x', created_date: '2026-11-20' }, NOW), false, '隐私模式 fail-soft');
  assert.equal(MEM.readMicroAction(null, 'sig1', NOW), null, '隐私读 fail-soft');
  // 单次死锁写回
  assert.equal(MEM.markMicroActionFollowedUp(ls, 'sig1', NOW), true, '归档须成功');
  assert.equal(MEM.readMicroAction(ls, 'sig1', NOW), null, '归档后读 null（单次死锁）');
  assert.equal(MEM.markMicroActionFollowedUp(ls, 'sig1', NOW), false, '重复归档 fail-soft');
});

// ═══════════════ E. companionTopicQueue P1-P4 顺位 ═══════════════

const TODAY_RR = (cat, tier) => ({ category: cat, tier, unlockedAt: NOW - 1000 });
const MICRO = (ek, created_date, followed_up = false) => ({
  emotion_key: ek, action_summary: '先稳住情绪再平静立下边界', created_date, followed_up,
});

test('E1 顺位 P1＞P2＞P3（不串台）＋P4 兜底 null', () => {
  // P4 兜底：全静默（无牌/无情绪/无回访档）⇒ null（调用方回退纯净问候链）
  assert.equal(TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW,
    relationMode: 'boyfriend',
  }), null, 'P4 全静默 ⇒ null（绝不臆造兜底句）');
  // P1 恒首位
  const p1 = TQ.resolveCompanionGreetingAndQueue({
    recentReport: TODAY_RR('love', 'core'), activeMood: 'radiant', lang: 'zh', now: NOW,
    lastMicroAction: MICRO('anger', '2026-11-20'), relationMode: 'boyfriend',
  });
  assert.ok(p1 && p1.firstLine.includes('塔罗牌面'), 'P1 报告话题须恒首位');
  assert.ok(!p1.followedUp, 'P1+P2 串联时 P3 严禁并发');
  // 纯 P2（隔日牌面＋今日情绪）
  const p2 = TQ.resolveCompanionGreetingAndQueue({
    recentReport: { category: 'love', tier: 'core', unlockedAt: NOW - 26 * 3600 * 1000 },
    activeMood: 'melancholy', lang: 'zh', now: NOW,
    lastMicroAction: MICRO('anger', '2026-11-20'), relationMode: 'boyfriend',
  });
  assert.ok(p2 && p2.firstLine.includes('在乎'), 'P2 升级转译句须产出');
  assert.ok(!p2.firstLine.includes('边界'), 'P2 在场时 P3 严禁并发（顺位不串台）');
});

test('E2 P3 轻复盘：五角色口吻分化＋情绪主体句＋followedUp 标记', () => {
  for (const role of ROLES) {
    const q = TQ.resolveCompanionGreetingAndQueue({
      recentReport: null, activeMood: null, lang: 'zh', now: NOW,
      lastMicroAction: MICRO('anger', '2026-11-20'), relationMode: role,
    });
    assert.ok(q && q.firstLine, `P3 须产出 role=${role}`);
    assert.ok(q.followedUp === true, `P3 须标记 followedUp role=${role}`);
    assert.ok(q.queue.includes('micro:anger'), `P3 队列须含 micro:anger role=${role}`);
    assert.ok(q.firstLine.includes('边界') || q.firstLine.includes('底线'),
      `P3 愤怒回访主体须在场 role=${role}`);
  }
  // 角色开场分化抽验
  const bf = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW,
    lastMicroAction: MICRO('anger', '2026-11-20'), relationMode: 'boyfriend',
  });
  assert.ok(bf.firstLine.startsWith('早啊。'), 'boyfriend 开场须为「早啊。」');
  const sl = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW,
    lastMicroAction: MICRO('anger', '2026-11-20'), relationMode: 'self',
  });
  assert.ok(sl.firstLine.startsWith('早安，我们。'), 'self 开场须为「早安，我们。」');
  const bd = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW,
    lastMicroAction: MICRO('sadness', '2026-11-20'), relationMode: 'buddy',
  });
  assert.ok(bd.firstLine.startsWith('早，兄弟。'), 'buddy 开场须为「早，兄弟。」');
  // P3 首句严禁姓名前缀（E142.1 唤名熔断同源）
  const named = TQ.resolveCompanionGreetingAndQueue({
    recentReport: null, activeMood: null, lang: 'zh', now: NOW,
    lastMicroAction: MICRO('anger', '2026-11-20'), relationMode: 'boyfriend', userName: 'North',
  });
  assert.ok(!named.firstLine.startsWith('North'), 'P3 回访句严禁姓名前缀（唤名熔断）');
});

test('E3 P3 fail-closed：坏角色/坏情绪/已回访/超 48h 一律静默', () => {
  const base = { recentReport: null, activeMood: null, lang: 'zh', now: NOW };
  assert.equal(TQ.resolveCompanionGreetingAndQueue({
    ...base, lastMicroAction: MICRO('anger', '2026-11-20'), relationMode: 'me',
  }), null, '非法角色（me 非 self）⇒ null');
  assert.equal(TQ.resolveCompanionGreetingAndQueue({
    ...base, lastMicroAction: MICRO('anger', '2026-11-20'), relationMode: 'hacker',
  }), null, '非法角色 ⇒ null');
  assert.equal(TQ.resolveCompanionGreetingAndQueue({
    ...base, lastMicroAction: MICRO('jealousy', '2026-11-20'), relationMode: 'self',
  }), null, '非法情绪键 ⇒ null');
  assert.equal(TQ.resolveCompanionGreetingAndQueue({
    ...base, lastMicroAction: MICRO('anger', '2026-11-20', true), relationMode: 'self',
  }), null, 'followed_up=true ⇒ null（单次死锁）');
  assert.equal(TQ.resolveCompanionGreetingAndQueue({
    ...base, lastMicroAction: MICRO('anger', '2026-11-17'), relationMode: 'self',
  }), null, '超 48h ⇒ null（过期）');
});

test('E4 P3 六语全量（五角色 × 六语 × 愤怒/悲伤抽验）', () => {
  for (const role of ROLES) {
    for (const lang of LANGS) {
      const q = TQ.resolveCompanionGreetingAndQueue({
        recentReport: null, activeMood: null, lang, now: NOW,
        lastMicroAction: MICRO('anger', '2026-11-20'), relationMode: role,
      });
      assert.ok(q && q.firstLine && q.firstLine.length > 20, `P3 六语须产出 role=${role} lang=${lang}`);
    }
  }
  // 纯 P2 升级句六语（转译句）
  for (const lang of LANGS) {
    const q = TQ.resolveCompanionGreetingAndQueue({
      recentReport: { category: 'love', tier: 'core', unlockedAt: NOW - 26 * 3600 * 1000 },
      activeMood: 'agitated', lang, now: NOW,
    });
    assert.ok(q && q.firstLine && q.firstLine.length > 20, `P2 升级句六语须产出 lang=${lang}`);
    assert.ok(!q.firstLine.startsWith('…') && !q.firstLine.startsWith('...'), `升级句严禁省略号前缀 lang=${lang}`);
  }
});

test('E5 E40-A inert 隔离零回归（Python 生产四表＋别名不泄漏）', () => {
  const engine = read('astro/familiar_engine.py');
  for (const name of ['RELATION_MODES', 'RELATION_PALETTE', 'RELATION_DECISION_OPERATORS', 'RELATION_VOICE_MATRIX']) {
    const start = engine.indexOf(`${name} = {`);
    const end = engine.indexOf('\n}\n', start);
    const blk = engine.slice(start, end);
    for (const alias of ['self', 'twin_self', 'higher_self']) {
      assert.ok(!blk.includes(`'${alias}'`), `${alias} 泄漏进 ${name}（inert 隔离被破）`);
    }
  }
});
