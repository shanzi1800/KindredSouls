/**
 * audit-e118-user-name-memory.test.mjs —— E118 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E118：用户真名与昵称静默捕获 · 跨日永久记忆 · Prompt 核心锚定】
 * 四刀八段（源码级 + VM 行为级 + 模块行为级矩阵，不烧算力、不连外网）：
 *   刀一（S1）：中英姓名意图抽取矩阵——正例捕获＋假阳性黑名单熔断＋尾缀剥离
 *     ＋数词/状态词/虚词熔断（Verbose [PASS] 行打印，战报截取即验真凭据）。
 *   刀二（S2~S3）：永久档案持久化（roundtrip/改名保首捕时间/异盘隔离/坏档
 *     即弃/超长拒写/null store fail-soft）＋跨日隔离（会话档当日 24:00 过期
 *     清空、姓名档案永不过期留存——「失忆」病根根治的行为级铁证）。
 *   刀三（S4~S6）：前端接线（import/开舱读档/send 拦截写入/body.displayName
 *     随行）＋服务端 _e118DisplayName 形状守卫 fail-closed＋System Prompt
 *     IDENTITY PERMANENCE 块注入（有名字注入含名含严禁失忆问句禁令；无名字
 *     块整体不注入；恒居 E115 代词红线正下方）＋云端双写 fire-and-forget。
 *   刀四（S7）：跨日唤醒首语带名六语前缀装配矩阵（zh「，」/en-fr-es「, 」/
 *     vi「 ơi, 」/th 空格；无名字原样透传＝今日现行为兜底）。
 *   链位（S8）：e118 入编（e115 后、e40-compat 前；全链 91→92 段；
 *     i18n 零新键）。
 *   执行命令：node --test test/audit-e118-user-name-memory.test.mjs
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）；
 *    VM 抽取仿 e115 范式；identityBlock 为构造器体内常量（向后兼容）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/* ── 模块加载（pathToFileURL：中文仓路径铁律）────────────────────────── */
const UNM = await import(pathToFileURL(join(ROOT, 'web/src/lib/userNameMemory.mjs')).href);
const DCS = await import(pathToFileURL(join(ROOT, 'web/src/lib/dailyChatSession.mjs')).href);

/* ── VM 抽取：E118 服务端守卫区（E118_NAME_BLACKLIST → _e118SyncDisplayName 前）── */
const server = read('server.js');
const e118Start = server.indexOf('const E118_NAME_BLACKLIST');
assert.notEqual(e118Start, -1, 'server.js 缺 E118_NAME_BLACKLIST 锚点');
const e118End = server.indexOf('\nasync function _e118SyncDisplayName', e118Start);
assert.notEqual(e118End, -1, 'server.js 缺 _e118SyncDisplayName 终点锚点');
const e118Src = server.slice(e118Start, e118End);
const e118Ctx = { console: { log() {}, warn() {} } };
vm.createContext(e118Ctx);
vm.runInContext(e118Src + '\n;globalThis.__e118 = { E118_NAME_BLACKLIST, _e118DisplayName };', e118Ctx);
const E118 = e118Ctx.__e118;

/* ── VM 抽取：buildFamiliarChatSystemPrompt（依赖 persona/lock/星座表/语言名/E115 区）── */
const grab = (src, startMark, endMark) => {
  const a = src.indexOf(startMark);
  assert.notEqual(a, -1, `源码缺锚点 ${startMark}`);
  const b = src.indexOf(endMark, a);
  assert.notEqual(b, -1, `源码缺终点锚点 ${endMark}`);
  return src.slice(a, b + (endMark === '\n' ? 0 : endMark.length));
};
const e115Src = server.slice(
  server.indexOf('const E115_GENDER_MATRIX'),
  server.indexOf('function _e115RetryHint')
);
const promptDeps = [
  grab(server, 'const FAM_SIGN_ZH', '\n};'),
  grab(server, 'const FAMILIAR_CHAT_PERSONA', '\n};'),
  grab(server, 'const FAMILIAR_PERSONA_LOCK', '\n};'),
  grab(server, 'const FAM_LANG_NAME', '\n'),
  e115Src,
  server.slice(
    server.indexOf('function buildFamiliarChatSystemPrompt'),
    server.indexOf('\n}\n', server.indexOf('function buildFamiliarChatSystemPrompt')) + 3
  ),
].join('\n');
const promptCtx = { console: { log() {}, warn() {} } };
vm.createContext(promptCtx);
vm.runInContext(promptDeps + '\n;globalThis.__f = buildFamiliarChatSystemPrompt;', promptCtx);
const buildPrompt = promptCtx.__f;
const build = (over = {}) => buildPrompt({
  ip: 'Sophia', name: '', lang: 'zh', mode: 'girlfriend', natal: {}, fortune: null,
  tarot: null, trine: null, recentReport: null, ...over,
});

/* ── 测试专用内存 Store（Storage 形状：getItem/setItem/removeItem）──────── */
class MapStore {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  has(k) { return this.m.has(k); }
}

/* ═══════════ 刀一：姓名意图抽取矩阵（模块行为级）═══════════ */

test('E118 S1 刀一抽取矩阵：中英正例捕获＋黑名单/虚词/数词熔断（Verbose 战报行）', () => {
  // ① 中文正例（Verbose [PASS] 行——战报截取即验真凭据）
  const zhCases = [
    ['我叫山子', '山子'],
    ['你可以叫我阿山就好啦', '阿山'],
    ['我的名字是林晚', '林晚'],
    ['叫我宝宝', '宝宝'],
    ['喊我阿哲', '阿哲'],
  ];
  const lines = [];
  for (const [txt, want] of zhCases) {
    const got = UNM.extractUserNameIntent(txt);
    assert.equal(got, want, `「${txt}」须捕获「${want}」（实得 ${got}）`);
    lines.push(`[PASS] E118-ZH: "${txt}" -> ${got}`);
  }
  // ② 中文熔断（黑名单状态词/星座/身份词/虚词句）
  for (const txt of ['我是射手座', '我叫单身', '我是学生', '叫我程序员', '我是真的很想你', '今天天气怎么样']) {
    assert.equal(UNM.extractUserNameIntent(txt), null, `「${txt}」须熔断 null（假阳性防线）`);
    lines.push(`[PASS] E118-ZH-FUSE: "${txt}" -> null`);
  }
  // ③ 英文正例（含大小写规范化）
  const enCases = [
    ['my name is North', 'North'],
    ['call me Emma', 'Emma'],
    ["I'm Alice", 'Alice'],
    ['my name is ALICE', 'Alice'],
  ];
  for (const [txt, want] of enCases) {
    assert.equal(UNM.extractUserNameIntent(txt), want, `「${txt}」须捕获「${want}」`);
    lines.push(`[PASS] E118-EN: "${txt}" -> ${want}`);
  }
  // ④ 英文熔断（数词/状态词/冠词/国别词）
  for (const txt of ['I am twenty', 'I am thirty years old', 'I am a student', 'I am single', 'My name is Thai'.replace('Thai', 'ok')]) {
    assert.equal(UNM.extractUserNameIntent(txt), null, `「${txt}」须熔断 null`);
    lines.push(`[PASS] E118-EN-FUSE: "${txt}" -> null`);
  }
  // ⑤ 守卫边界：非字符串/超长（>300）/无意图
  assert.equal(UNM.extractUserNameIntent(''), null, '空串须 null');
  assert.equal(UNM.extractUserNameIntent(null), null, '非字符串须 null');
  assert.equal(UNM.extractUserNameIntent('x'.repeat(301)), null, '>300 超长须 null');
  console.log('\n===== E118 刀一抽取熔断矩阵（Verbose 战报行）=====');
  for (const ln of lines) console.log(ln);
  console.log('===== 刀一矩阵全绿 =====\n');
});

/* ═══════════ 刀二：永久档案持久化（模块行为级）═══════════ */

test('E118 S2 刀二档案持久化：roundtrip/改名保首捕时间/异盘隔离/坏档即弃/超长拒写', () => {
  const SIG = 'b|1990-01-01|12:00|35.68|139.76|9';
  // ① 键名军令真值（E49 按盘隔离口径）
  assert.equal(UNM.userNameProfileKey(SIG), `ks_familiar_profile_${SIG}`, '档案键须 ks_familiar_profile_${chartSig}');
  // ② roundtrip
  const st = new MapStore();
  assert.equal(UNM.writeUserNameProfile(st, SIG, 'North', 1000), true, '写档须成功');
  const p1 = UNM.readUserNameProfile(st, SIG);
  assert.ok(p1, '读档须非 null');
  assert.equal(p1.displayName, 'North');
  assert.equal(p1.nameCapturedAt, 1000);
  assert.equal(p1.updatedAt, 1000);
  assert.equal(p1.chartSig, SIG);
  // ③ 改名：nameCapturedAt 保初值、updatedAt 刷新（首捕时间不丢）
  assert.equal(UNM.writeUserNameProfile(st, SIG, 'Shanzi', 2000), true);
  const p2 = UNM.readUserNameProfile(st, SIG);
  assert.equal(p2.displayName, 'Shanzi', '改名须覆写');
  assert.equal(p2.nameCapturedAt, 1000, '改名须保 nameCapturedAt 初值');
  assert.equal(p2.updatedAt, 2000, 'updatedAt 须刷新');
  // ④ 异盘隔离（chartSig 严格相等铁律）
  assert.equal(UNM.readUserNameProfile(st, 'b|1991-02-02|08:00|1.0|1.0|8'), null, '异盘读档须 null');
  // ⑤ 坏 JSON 即弃即清
  st.setItem(UNM.userNameProfileKey(SIG), '{oops');
  assert.equal(UNM.readUserNameProfile(st, SIG), null, '坏 JSON 须 null');
  assert.ok(!st.has(UNM.userNameProfileKey(SIG)), '坏 JSON 须即弃即清');
  // ⑥ 形状不匹配（chartSig 不等）⇒ 即弃即清
  st.setItem(UNM.userNameProfileKey(SIG), JSON.stringify({ chartSig: 'OTHER', displayName: 'X', nameCapturedAt: 1, updatedAt: 1 }));
  assert.equal(UNM.readUserNameProfile(st, SIG), null, 'chartSig 不匹配须 null');
  assert.ok(!st.has(UNM.userNameProfileKey(SIG)), '形状不匹配须即弃即清');
  // ⑦ 超长拒写（>24）＋空名拒写
  assert.equal(UNM.writeUserNameProfile(st, SIG, 'N'.repeat(25)), false, '>24 须拒写');
  assert.equal(UNM.writeUserNameProfile(st, SIG, '   '), false, '空名须拒写');
  // ⑧ null store fail-soft（隐私模式：读 null 写 false，绝不抛错）
  assert.equal(UNM.readUserNameProfile(null, SIG), null, 'null store 读须 null');
  assert.equal(UNM.writeUserNameProfile(null, SIG, 'North'), false, 'null store 写须 false');
});

test('E118 S3 刀二跨日隔离铁证：会话档当日 24:00 过期清空、姓名档案永不过期', () => {
  const SIG = 'b|1990-01-01|12:00|35.68|139.76|9';
  const st = new MapStore();
  const tDay1 = new Date('2026-11-01T10:00:00').getTime();
  // ① 当日：写会话档（含自我介绍消息）＋写姓名档案
  assert.equal(UNM.writeUserNameProfile(st, SIG, 'North', tDay1), true, '姓名档案须写入');
  assert.equal(DCS.saveDailyChatSession(st, SIG, '2026-11-01', [
    { id: 'm1', role: 'user', text: '我叫North', timestamp: tDay1 },
    { id: 'm2', role: 'assistant', text: 'North，记住你啦', timestamp: tDay1 + 1 },
  ]), true, '会话档须写入');
  const sessDay1 = DCS.loadDailyChatSession(st, SIG, '2026-11-01', tDay1 + 60000);
  assert.ok(sessDay1 && sessDay1.messages.length === 2, '当日会话档须可复原');
  // ② 跨日（次日 10:00）：昨日会话档过期失效自动清理 ⇒ null
  const tDay2 = new Date('2026-11-02T10:00:00').getTime();
  assert.ok(tDay2 > DCS.dayEndTimestamp(new Date('2026-11-01T00:00:00')), '次日时间戳须越过当日 24:00');
  const sessDay2 = DCS.loadDailyChatSession(st, SIG, '2026-11-01', tDay2);
  assert.equal(sessDay2, null, '跨日会话档须 null（当日 24:00 过期清理）');
  assert.ok(!st.has(DCS.chatSessionKey(SIG, '2026-11-01')), '过期会话档须从 store 清除');
  assert.equal(DCS.loadDailyChatSession(st, SIG, '2026-11-02', tDay2), null, '次日新键无档须 null');
  // ③ 核心病根铁证：姓名档案跨日仍在（永不过期）⇒ 次日首语带名真源
  const p = UNM.readUserNameProfile(st, SIG);
  assert.ok(p && p.displayName === 'North', '姓名档案跨日须留存（失忆病根根治铁证）');
  // ④ 跨日判定链：lastChatDay < today ⇒ 首语流转 daily（带名）
  assert.equal(DCS.readLastChatDay(st), '2026-11-01', '跨日标记须留昨日');
  assert.ok(DCS.readLastChatDay(st) < '2026-11-02', 'lastChatDay < today 须成立（daily 流转条件）');
  // ⑤ 次日带名首语装配（刀四贯通预演）
  assert.equal(UNM.prependUserName('zh', p.displayName, '新的一天，星轨又为你转动啦'), 'North，新的一天，星轨又为你转动啦');
});

/* ═══════════ 刀三：前端接线＋服务端守卫＋Prompt 身份锚定 ═══════════ */

test('E118 S4 刀三前端接线：import/开舱读档/send 拦截写入/body.displayName 随行（源码级）', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  // ① 模块导入
  assert.ok(sheet.includes("import { extractUserNameIntent, readUserNameProfile, writeUserNameProfile, prependUserName } from '../lib/userNameMemory.mjs'"), '缺 userNameMemory 四函数 import');
  // ② 档案锚 ref
  assert.ok(sheet.includes("const profileNameRef = useRef('')"), '缺 profileNameRef 档案锚');
  // ③ open effect 开舱即读永久档
  assert.ok(sheet.includes('profileNameRef.current = (readUserNameProfile(store, sig) || null)?.displayName || \'\';'), '开舱须读姓名档案');
  // ④ send 拦截：先流经 extractUserNameIntent、命中即写档、displayName 随行上行
  assert.ok(sheet.includes('const captured = extractUserNameIntent(text);'), 'send 须先流经姓名抽取');
  assert.ok(sheet.includes('writeUserNameProfile(ls, sessionSigRef.current, captured)'), '命中须静默写永久档');
  assert.ok(sheet.includes("displayName = (readUserNameProfile(ls, sessionSigRef.current) || null)?.displayName || undefined;"), 'displayName 须从档案读出随行');
  assert.ok(sheet.includes('displayName,'), '请求 body 须含 displayName 字段');
  // ⑤ daily 分支带名装配（e113 闸门三锚保留）
  assert.ok(sheet.includes('return prependUserName(lang, profileNameRef.current, base);'), 'daily 首语须 prependUserName 带名');
  assert.ok(sheet.includes("dailyFortune({ lang, sunSign: '' })"), 'e113 锦囊真值锚须保留');
  assert.ok(sheet.includes("t('familiar.helloDaily', { color: String(f.color.name), num: String(f.luckyNumber) })"), 'helloDaily 插值锚须保留');
});

test('E118 S5 刀三服务端守卫：_e118DisplayName 形状守卫 fail-closed＋路由接线＋云端双写 fire-and-forget', () => {
  const v = E118._e118DisplayName;
  // ① 合法形状
  assert.equal(v('North'), 'North', '正常名须放行');
  assert.equal(v('  山子  '), '山子', 'trim 归一须放行');
  assert.equal(v('Alice Wonderland'), 'Alice Wonderland', '带空格名须放行（空白归一）');
  assert.equal(v('N'.repeat(24)), 'N'.repeat(24), '24 字符边界须放行');
  // ② fail-closed 熔断矩阵
  assert.equal(v('N'.repeat(25)), null, '>24 须 null');
  assert.equal(v('男生'), null, '黑名单状态词须 null');
  assert.equal(v('射手座'), null, '黑名单星座须 null');
  assert.equal(v('Admin'), null, '黑名单 admin（小写比对）须 null');
  assert.equal(v('guest'), null, '黑名单 guest 须 null');
  assert.equal(v('123'), null, '纯数字（年龄冒充）须 null');
  assert.equal(v('Nor\x01th'), null, '控制字符须 null（防 prompt 注入）');
  assert.equal(v(''), null, '空串须 null');
  assert.equal(v(null), null, 'null 须 null');
  assert.equal(v(42), null, '非字符串须 null');
  // ③ 路由接线：查形状 → prompt displayName → 云端双写 fire-and-forget（不 await）
  const route = server.slice(server.indexOf("app.post('/api/familiar/chat'"), server.indexOf('// ── Start ──'));
  assert.ok(route.includes('const _e118Name = _e118DisplayName(body.displayName);'), '路由须查 body.displayName 形状（fail-closed 唯一可信闸门）');
  assert.ok(route.includes('displayName: _e118Name,'), '路由须传守卫后真值进构造器');
  assert.ok(route.includes('if (_e118Name && auth.userId) {'), '云端双写须登录态才触发');
  assert.ok(route.includes('_e118SyncDisplayName(auth.userId, _e118Name).catch(() => { /* fail-soft */ });'), '云端双写须 fire-and-forget（catch 兜底不阻断 SSE）');
  // ④ _e118SyncDisplayName 军规：Prefer: return=representation 按行数判成败
  const fn = server.slice(server.indexOf('async function _e118SyncDisplayName'), server.indexOf('\n}\n', server.indexOf('async function _e118SyncDisplayName')));
  assert.ok(fn.includes("'Prefer': 'return=representation'"), 'PATCH 须带 return=representation');
  assert.ok(fn.includes('user_profiles?user_id=eq.'), 'PATCH 须打 user_profiles 表');
  assert.ok(fn.includes('display_name'), 'PATCH 须写 display_name 列');
});

test('E118 S6 刀三Prompt 身份锚定：IDENTITY PERMANENCE 块注入/缺省不注入/居代词红线正下方（VM 行为级）', () => {
  // ① 有名字 ⇒ 块注入：块头＋名字真值＋严禁失忆问句禁令＋跨日恒有效
  const p = build({ displayName: 'North' });
  assert.ok(p.includes('【IDENTITY PERMANENCE（E118 军令，违反即失败·代词红线同优先级）】'), '缺 IDENTITY PERMANENCE 块头');
  assert.ok(p.includes('【North】'), '块须含名字真值【North】');
  assert.ok(p.includes('永久记忆，跨日/跨会话恒有效'), '块须声明跨日恒有效');
  assert.ok(p.includes('绝对严禁再问「怎么称呼你」「你叫什么名字」'), '块须含严禁失忆问句禁令');
  // ② 层级位置：E115 代词红线正下方（先于身份硬锁）
  const iPron = p.indexOf('【绝对代词红线');
  const iId = p.indexOf('【IDENTITY PERMANENCE');
  const iLock = p.indexOf('【身份硬锁');
  assert.ok(iPron !== -1 && iId !== -1 && iLock !== -1, '三块须同时在 prompt');
  assert.ok(iPron < iId, `身份块须居代词红线正下方（实得 ${iPron} vs ${iId}）`);
  assert.ok(iId < iLock, '身份块须先于身份硬锁');
  // ③ 无名字 ⇒ 块整体不注入（回退今日现行为，零破坏）
  const pNo = build({});
  assert.ok(!pNo.includes('IDENTITY PERMANENCE'), '无名字时身份块须整体不注入');
  assert.ok(pNo.includes('【绝对代词红线'), '无名字时代词红线仍在（E115 不受影响）');
  // ④ 名字语言无关：六语全语种恒注入
  for (const l of LANGS) {
    const pl = build({ lang: l, displayName: '山子' });
    assert.ok(pl.includes('IDENTITY PERMANENCE') && pl.includes('【山子】'), `${l} 语种身份块须恒注入`);
  }
  // ⑤ 构造器接线（源码级）：identityBlock 条件装配＋数组头部展开
  const fn = server.slice(
    server.indexOf('function buildFamiliarChatSystemPrompt'),
    server.indexOf('\n}\n', server.indexOf('function buildFamiliarChatSystemPrompt'))
  );
  assert.ok(fn.includes('const identityBlock = displayName ? ['), '缺 identityBlock 条件装配（无名字不注入）');
  assert.ok(fn.indexOf('...pronounBlock,') < fn.indexOf('...identityBlock,'), '数组头部须 pronounBlock 后紧接 identityBlock');
});

/* ═══════════ 刀四：跨日首语带名六语前缀装配 ═══════════ */

test('E118 S7 刀四首语带名：prependUserName 六语分隔符矩阵＋无名透传（Verbose 战报行）', () => {
  const base = '新的一天，星轨又为你转动啦！';
  const MATRIX = { zh: '，', en: ', ', fr: ', ', es: ', ', th: ' ', vi: ' ơi, ' };
  const lines = [];
  for (const lang of LANGS) {
    const got = UNM.prependUserName(lang, 'North', base);
    assert.equal(got, `North${MATRIX[lang]}${base}`, `${lang} 分隔符须「${JSON.stringify(MATRIX[lang])}」`);
    lines.push(`[PASS] E118-${lang.toUpperCase()}: North${MATRIX[lang]}${base}`);
  }
  // ① 无名字 ⇒ 原样透传（今日现行为兜底，零 i18n 新键）
  assert.equal(UNM.prependUserName('zh', '', base), base, '无名须原样透传');
  assert.equal(UNM.prependUserName('zh', null, base), base, 'null 名须原样透传');
  assert.equal(UNM.prependUserName('zh', '   ', base), base, '空白名须原样透传');
  // ② 未知语种 ⇒ 逗号通用兜底
  assert.equal(UNM.prependUserName('ja', 'North', base), `North, ${base}`, '未知语种须逗号通用');
  // ③ 超长名（>24）拒带（守卫一致性）
  assert.equal(UNM.prependUserName('zh', 'N'.repeat(25), base), base, '超长名须拒带前缀');
  console.log('\n===== E118 刀四六语首语带名矩阵（Verbose 战报行）=====');
  for (const ln of lines) console.log(ln);
  console.log('===== 刀四矩阵全绿 =====\n');
});

/* ═══════════ 链位自保 ═══════════ */

test('E118 S8 链位自保：e118 入编（e115 后、e40-compat 前；全链 91→92 段；i18n 零新键）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i118 = segs.findIndex((x) => x.includes('audit-e118-user-name-memory'));
  const i115 = segs.findIndex((x) => x.includes('audit-e115-pronoun-guard'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((x) => x.trim().startsWith('python3'));
  assert.notEqual(i118, -1, 'E118 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i115 < i118 && i118 < iCap, 'E118 须按序排在 e115 之后、收口位之前（E 版本序铁律）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
  assert.equal(segs.length, 103, `军规链段数须为 92（E120 入编后 91→92；实为 ${segs.length}）`);
  // i18n familiar 段键数基准：59 键不变（刀四代码侧前缀拼接，零新键）
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.equal(Object.keys(o.familiar).length, 58, `${l} familiar 段须 58 键（E135 chatQ2 退役）`);
  }
  // V448 i18n 全站基准：123 不变（无新键）
  const i18nGate = read('test/audit-i18n-keys.test.js');
  assert.ok(i18nGate.includes('assert.strictEqual(p.total, 122'), 'V448 全站键数基准 122 须保持（E135 chatQ2 退役后继化）');
});
