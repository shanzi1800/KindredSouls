/**
 * audit-e115-pronoun-guard.test.mjs —— E115 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E115：全语种性别映射推导器 · 伴侣第三人称代词硬锁 · 根除性别穿帮】
 * 三刀八段（源码级 + VM 行为级矩阵，不烧算力、不连外网）：
 *   刀一（S1~S2）：resolveGenderContext 四象映射（fail-closed）＋六语代词字典。
 *   刀二（S3~S5）：System Prompt 代词红线宪法——置顶注入＋24 组（4 象 × 6 语）
 *     伴侣代词矩阵全绿＋Few-Shot 正反示范按伴侣性别动态。
 *   刀三（S6~S7）：_e115PronounViolation 输出侧拦截器行为级（模拟 LLM 输出校验，
 *     违规 ⇒ true 触发弃流重试）＋路由接线（deltaGuard/reset 帧/一次为限）。
 *   刀四（S8）：链位自保（e114 后、e40-compat 前；全链 89→90 段）。
 * 🔴 纪律：新增段随 test:astro 全量入编（e114 之后、e40-compat 收口位之前）；
 *    i18n 零新键（服务端确定性推导，不动前端词条）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];
const MODES = ['girlfriend', 'boyfriend', 'bestie', 'buddy'];

/* VM 抽取：E115 常量＋函数区（刀一刀三纯函数区，自包含零外部依赖） */
const server = read('server.js');
const e115Src = server.slice(
  server.indexOf('const E115_GENDER_MATRIX'),
  server.indexOf('function _e115RetryHint')
    ? server.indexOf('function _e115RetryHint')
    : server.indexOf('function _e115RetryHint', server.indexOf('const E115_GENDER_MATRIX'))
);
const e115Ctx = { console: { log() {}, warn() {} } };
vm.createContext(e115Ctx);
vm.runInContext(
  e115Src + '\n;globalThis.__e115 = { E115_GENDER_MATRIX, E115_PARTNER_PRONOUNS, _e115ResolveGenderContext, _e115PronounViolation };',
  e115Ctx
);
const E115 = e115Ctx.__e115;

/* VM 抽取：buildFamiliarChatSystemPrompt（依赖 persona/lock/星座表/语言名/E115 区） */
const grab = (src, startMark, endMark) => {
  const a = src.indexOf(startMark);
  assert.notEqual(a, -1, `源码缺锚点 ${startMark}`);
  const b = src.indexOf(endMark, a);
  assert.notEqual(b, -1, `源码缺终点锚点 ${endMark}`);
  // 终点锚一并纳入（VM 执行须完整闭合；单行声明终点 '\n' 时行尾分号已含）
  return src.slice(a, b + (endMark === '\n' ? 0 : endMark.length));
};
const promptDeps = [
  grab(server, 'const FAM_SIGN_ZH', '\n};'),
  grab(server, 'const FAMILIAR_CHAT_PERSONA', '\n};'),
  grab(server, 'const FAMILIAR_PERSONA_LOCK', '\n};'),
  grab(server, 'const FAM_LANG_NAME', '\n'), // 单行声明（行内 };）——终点锚行尾即止
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

const build = (mode, lang) => buildPrompt({
  ip: mode === 'buddy' || mode === 'boyfriend' ? 'Milo' : 'Sophia',
  name: '', lang, mode, natal: {}, fortune: null, tarot: null, trine: null, recentReport: null,
});

/* 军令钦定四象 × 六语伴侣代词期望矩阵 */
const EXPECT = {
  girlfriend: { user: 'male', partner: 'female', zh: '她', en: 'she/her', fr: 'elle', es: 'ella', th: 'เธอ', vi: 'cô ấy/nàng' },
  boyfriend: { user: 'female', partner: 'male', zh: '他', en: 'he/him', fr: 'lui/il', es: 'él', th: 'เขา', vi: 'anh ấy/chàng' },
  bestie: { user: 'female', partner: 'male', zh: '他', en: 'he/him', fr: 'lui/il', es: 'él', th: 'เขา', vi: 'anh ấy/chàng' },
  buddy: { user: 'male', partner: 'female', zh: '她', en: 'she/her', fr: 'elle', es: 'ella', th: 'เธอ', vi: 'cô ấy/nàng' },
};

/* ═══════════ 刀一：性别映射推导器 ═══════════ */

test('E115 S1 刀一推导器：四象映射矩阵（VM 行为级）＋白名单外 fail-closed', () => {
  for (const mode of MODES) {
    const g = E115._e115ResolveGenderContext(mode);
    assert.ok(g, `四象 ${mode} 须可推导`);
    assert.equal(g.userGender, EXPECT[mode].user, `${mode} 用户性别映射错`);
    assert.equal(g.partnerGender, EXPECT[mode].partner, `${mode} 伴侣性别映射错`);
    assert.equal(g.pronouns.zh, EXPECT[mode].zh, `${mode} 中文代词映射错`);
  }
  // fail-closed：白名单四象外一律 null（禁默认回退）
  assert.equal(E115._e115ResolveGenderContext('cat'), null, '非法 mode 须 null（fail-closed）');
  assert.equal(E115._e115ResolveGenderContext(''), null, '空 mode 须 null');
  assert.equal(E115._e115ResolveGenderContext(undefined), null, 'undefined mode 须 null');
});

test('E115 S2 刀一代词字典：六语 12 代词军令真值（源码级）', () => {
  const dict = E115.E115_PARTNER_PRONOUNS;
  assert.equal(Object.keys(dict).length, 6, '字典须六语');
  assert.equal(dict.zh.female, '她');
  assert.equal(dict.zh.male, '他');
  assert.equal(dict.en.female, 'she/her');
  assert.equal(dict.en.male, 'he/him');
  assert.equal(dict.fr.female, 'elle');
  assert.equal(dict.fr.male, 'lui/il');
  assert.equal(dict.es.female, 'ella');
  assert.equal(dict.es.male, 'él');
  assert.equal(dict.th.female, 'เธอ');
  assert.equal(dict.th.male, 'เขา');
  assert.equal(dict.vi.female, 'cô ấy/nàng');
  assert.equal(dict.vi.male, 'anh ấy/chàng');
  // 源码级：矩阵四象真值在场
  for (const m of MODES) assert.ok(server.includes(`${m}: { user: '${EXPECT[m].user}', partner: '${EXPECT[m].partner}' }`), `矩阵缺 ${m}`);
});

/* ═══════════ 刀二：System Prompt 代词红线宪法 ═══════════ */

test('E115 S3 刀二红线块：girlfriend/zh 注入详断（主公截图实锤场景）', () => {
  const p = build('girlfriend', 'zh');
  // ① 红线块头＋置顶最高优先
  assert.ok(p.includes('【绝对代词红线（E115 军令，违反即失败·置顶最高优先）】'), '缺代词红线块头');
  assert.ok(p.includes('主人性别【男】'), 'girlfriend 主人性别须【男】（乾造）');
  assert.ok(p.includes('伴侣性别【女】'), 'girlfriend 伴侣性别须【女】（坤造）');
  // ② 中文代词硬锁句
  assert.ok(p.includes('中文恒用【她】'), '缺「中文恒用【她】」硬锁句');
  // ③ Few-Shot 正反示范（girlfriend：错误「和他」/正确「和她」）
  const wrongLine = p.slice(p.indexOf('错误示范'), p.indexOf('正确示范'));
  assert.ok(wrongLine.includes('你和他之间那道小裂缝'), '缺错误示范「你和他之间那道小裂缝」');
  const rightLine = p.slice(p.indexOf('正确示范'), p.indexOf('正确示范') + 120);
  assert.ok(rightLine.includes('你和她之间那道小裂缝'), '缺正确示范「你和她之间那道小裂缝」');
  // ④ 系统逻辑瘫痪铁令
  assert.ok(p.includes('系统逻辑瘫痪'), '缺「违背此条将直接视为系统逻辑瘫痪」铁令');
});

test('E115 S4 刀二24 组矩阵：4 象 × 6 语伴侣代词注入全绿（VM 行为级）', () => {
  let cases = 0;
  for (const mode of MODES) {
    for (const lang of LANGS) {
      const p = build(mode, lang);
      const e = EXPECT[mode];
      // 每组（mode×lang）生成的 prompt 中六语代词行整条在场（代词按伴侣性别正确）
      assert.ok(p.includes(`中文恒用【${e.zh}】`), `${mode}/${lang} 缺中文代词【${e.zh}】`);
      assert.ok(p.includes(`英文 ${e.en}`), `${mode}/${lang} 缺英文代词 ${e.en}`);
      assert.ok(p.includes(`法文 ${e.fr}`), `${mode}/${lang} 缺法文代词 ${e.fr}`);
      assert.ok(p.includes(`西文 ${e.es}`), `${mode}/${lang} 缺西文代词 ${e.es}`);
      assert.ok(p.includes(`泰文 ${e.th}`), `${mode}/${lang} 缺泰文代词 ${e.th}`);
      assert.ok(p.includes(`越文 ${e.vi}`), `${mode}/${lang} 缺越文代词 ${e.vi}`);
      // Few-Shot 按伴侣性别动态：partner female ⇒ 错误「和他」/正确「和她」；male ⇒ 反转
      if (e.partner === 'female') {
        assert.ok(p.includes('错误示范（严禁出现）：「你和他之间'), `${mode}/${lang} Few-Shot 错误样例须「和他」`);
        assert.ok(p.includes('正确示范：「你和她之间'), `${mode}/${lang} Few-Shot 正确样例须「和她」`);
      } else {
        assert.ok(p.includes('错误示范（严禁出现）：「你和她之间'), `${mode}/${lang} Few-Shot 错误样例须「和她」`);
        assert.ok(p.includes('正确示范：「你和他之间'), `${mode}/${lang} Few-Shot 正确样例须「和他」`);
      }
      cases += 1;
    }
  }
  assert.equal(cases, 24, `须遍历 24 组（实跑 ${cases}）`);
});

test('E115 S5 刀二优先级：红线块置顶（先于身份硬锁/物种硬锁）＋构造器接线', () => {
  const p = build('girlfriend', 'zh');
  const iPron = p.indexOf('【绝对代词红线');
  const iId = p.indexOf('【身份硬锁');
  const iSpecies = p.indexOf('【物种硬锁');
  assert.ok(iPron !== -1 && iId !== -1, '红线块与身份硬锁须同时在 prompt');
  assert.ok(iPron < iId, `红线块须置顶先于身份硬锁（实得 ${iPron} vs ${iId}）`);
  assert.ok(iPron < iSpecies, '红线块须先于物种硬锁');
  // 构造器内部接线：mode → _e115ResolveGenderContext → pronounBlock
  const fn = server.slice(
    server.indexOf('function buildFamiliarChatSystemPrompt'),
    server.indexOf('\n}\n', server.indexOf('function buildFamiliarChatSystemPrompt'))
  );
  assert.ok(fn.includes('_e115ResolveGenderContext(mode)'), '构造器须按 mode 调推导器');
  assert.ok(fn.includes('pronounBlock = g115 ? ['), '缺 pronounBlock 条件装配（非法 mode 缺省不注入）');
  assert.ok(fn.includes('...pronounBlock,'), 'prompt 数组头部须展开 pronounBlock');
});

/* ═══════════ 刀三：输出侧拦截器＋路由接线 ═══════════ */

test('E115 S6 刀三输出拦截器：违规代词检测行为级（模拟 LLM 输出校验，违规 ⇒ 触发阻断重试）', () => {
  const v = E115._e115PronounViolation;
  // ① 主公截图实锤句（girlfriend：伴侣女 ⇒ 「他」违规）
  assert.equal(v('你和他之间那道小裂缝，先别急着补', 'female', 'zh'), true, '「你和他之间」须判违规（主公实锤句）');
  assert.equal(v('你和她之间那道小裂缝，先别急着补', 'female', 'zh'), false, '「你和她之间」须放行');
  // ② 反向（boyfriend：伴侣男 ⇒ 「她」违规）
  assert.equal(v('你和她之间那道小裂缝', 'male', 'zh'), true, '伴侣男时「她」须判违规');
  assert.equal(v('你和他之间那道小裂缝', 'male', 'zh'), false, '伴侣男时「他」须放行');
  // ③ 合法词剥离（防「其他/他人/他乡/他们/她们」假阳）
  assert.equal(v('其他方面要留意，他们说的他人与他乡都不算', 'female', 'zh'), false, '合法词含「他」须剥离放行');
  // ④ en 词边界检测
  assert.equal(v('he will understand you', 'female', 'en'), true, 'en 伴侣女时 he 须违规');
  assert.equal(v('she will understand you both', 'female', 'en'), false, 'en 伴侣女时 she 须放行');
  assert.equal(v('she trusts you', 'male', 'en'), true, 'en 伴侣男时 she 须违规');
  // ⑤ fr/es/th/vi 不阻断（词形歧义防假阳——prompt 硬锁承担）
  assert.equal(v('il y a une chance', 'female', 'fr'), false, 'fr 须不阻断（il 兼作 it，防重试风暴）');
  assert.equal(v('เธอสบายดีไหม', 'male', 'th'), false, 'th 须不阻断（เธอ 兼作第二人称「你」）');
  // ⑥ 空参守卫
  assert.equal(v('', 'female', 'zh'), false, '空文本须放行');
  assert.equal(v('你和他', null, 'zh'), false, '无性别上下文须放行');
});

test('E115 S7 刀三路由接线：deltaGuard 流中守卫＋reset 帧弃流重试一次为限＋前端 reset 清屏', () => {
  // ① 路由侧：g115 推导＋deltaGuard＋reset 帧＋重试一次为限＋纠错铁令 user 轮
  const route = server.slice(server.indexOf("app.post('/api/familiar/chat'"), server.indexOf('// ── Start ──'));
  assert.ok(route.includes('const g115 = _e115ResolveGenderContext(mode);'), '路由须调推导器');
  assert.ok(route.includes('deltaGuard'), '主 Gemini 流 onDelta 须挂 deltaGuard 守卫');
  assert.ok(route.includes('_e115PronounViolation(pronAcc, g115.partnerGender, lang)'), 'deltaGuard 须流中增量检测');
  assert.ok(route.includes("{ reset: true }"), '须发 reset 帧清空前端已显违规文本');
  assert.ok(route.includes('pronViolated && !pronRetried'), '重试须一次为限（防循环）');
  assert.ok(route.includes('_e115RetryHint(lang, g115)'), '重试须以 user 轮注入纠错铁令');
  assert.ok(route.includes('pronoun-retry'), '重试 model 标记须留痕');
  // ② ctrl 替换（let）＋守卫 abort
  assert.ok(/let ctrl = new AbortController\(\);/.test(route), 'ctrl 须 let（重试替换新控制器）');
  assert.ok(/pronViolated = true;[\s\S]{0,200}ctrl\.abort\(\)/.test(route), '守卫命中须 abort 上游');
  // ③ 前端：reset 帧清空流式文本（bufRef＋末条 assistant 双清）
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(sheet.includes('if (j.reset)'), '前端缺 reset 帧处理');
  assert.ok(/if \(j\.reset\) \{[\s\S]{0,300}bufRef\.current = ''/.test(sheet), 'reset 须清 bufRef 流缓冲');
  assert.ok(/if \(j\.reset\) \{[\s\S]{0,600}last\.role === 'assistant'[\s\S]{0,200}text: ''/.test(sheet), 'reset 须清末条 assistant 已显文本');
  // ④ 重试铁令函数在场（双语）
  assert.ok(server.includes('function _e115RetryHint'), '缺 _e115RetryHint 纠错铁令');
});

/* ═══════════ 刀四：链位自保 ═══════════ */

test('E115 S8 链位自保：e115 入编（e114 后、e40-compat 前；全链 89→90 段；i18n 零新键）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(' && ');
  const i115 = segs.findIndex((x) => x.includes('audit-e115-pronoun-guard'));
  const i114 = segs.findIndex((x) => x.includes('audit-e114-interpolation-sfx-live'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  const iPy = segs.findIndex((x) => x.trim().startsWith('python3'));
  assert.notEqual(i115, -1, 'E115 闸门未挂入 test:astro（写好不接线 = 永不运行）');
  assert.ok(i114 < i115 && i115 < iCap, 'E115 须按序排在 e114 之后、收口位之前（E 版本序铁律）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 峰值审计须恒为链尾');
  assert.equal(segs.length, 90, `军规链段数须为 90（E115 入编后 89→90；实为 ${segs.length}）`);
  // i18n familiar 段键数基准：59 键不变（E115 服务端确定性推导，零新键）
  for (const l of LANGS) {
    const o = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    assert.equal(Object.keys(o.familiar).length, 59, `${l} familiar 段须 59 键（E115 零新键）`);
  }
  // V448 i18n 全站基准：123 不变（无新键）
  const i18nGate = read('test/audit-i18n-keys.test.js');
  assert.ok(i18nGate.includes('assert.strictEqual(p.total, 123'), 'V448 全站键数基准 123 须保持（E115 零新键）');
});
