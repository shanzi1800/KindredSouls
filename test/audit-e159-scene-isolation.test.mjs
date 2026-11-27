// 🤝 E159（主公军令 2026-11-27）：三场景权益物理隔离 · 二次刷新黑屏根治 · 出生时空全参透传 闸门。
//   军令六刀：①撤销「一次付费通开三场景」（权益/订单/缓存键/前端状态全部按 pairFingerprint + scene 隔离）；
//             ②八字/星座/易经三模块按场景分流（商道/挚友严禁情爱穿帮词）；③/result 二次刷新黑屏根治（禁止「消费一次即删恢复标记」）；
//             ④月报/年报完整透传出生城市/经纬度/时区/时辰（杜绝静默回退曼谷）；⑤已解锁月/年报直达态＋塔罗正/逆位切片＋placeholder 防裁切；
//             ⑥六语字典逐字增补。
//   纪律：零网络 / 零 LLM / 零子进程；TS 算法层内存内 transpile（不落盘）；server 装配器沿 E40「源码抽取 + new Function + 依赖注入」消费。
//   🔴 VM 抽取式消费者铁律：被抽取函数体内零外部 helper、常量置函数体内。
//   🔴 封存守卫：下一役标识 e160/E160 在本役落盘前不得出现（后继化时把本守卫改为 e161）。

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(REPO, p), 'utf8');
const exists = (p) => existsSync(resolve(REPO, p));
const mod = (p) => import(pathToFileURL(resolve(REPO, p)).href);

const SERVER = read('server.js');
const APP = read('web/src/App.tsx');
const APP_CSS = read('web/src/App.css');
const SBPAY = read('lib/sandboxPayment.mjs');
const SB_TS = read('web/src/lib/supabase.ts');
const ENT = await mod('web/src/lib/compatSceneEntitlement.mjs');
const TAROT_S = await mod('web/src/lib/tarotScenes.mjs');
const DICT = await mod('web/src/lib/resonanceI18n.mjs');
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

const count = (src, lit) => src.split(lit).length - 1;

/* ── 内存内 TS 算法层加载（algos 目录自包含，相对 import ⇒ 递归转译为 CJS） ── */
function loadAlgos() {
  const ts = createRequire(join(REPO, 'package.json'))('typescript');
  const DIR = join(REPO, 'web/src/lib/algos');
  const cache = new Map();
  const load = (name) => {
    const file = resolve(DIR, name.endsWith('.ts') ? name : name + '.ts');
    if (cache.has(file)) return cache.get(file).exports;
    const out = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const m = { exports: {} };
    cache.set(file, m);
    const req = (spec) => (spec.startsWith('.') ? load(spec.replace(/^\.\//, '')) : createRequire(import.meta.url)(spec));
    new Function('exports', 'require', 'module', '__filename', '__dirname', out)(m.exports, req, m, file, DIR);
    return m.exports;
  };
  return load('index');
}

/* ── 花括号配平抽取（沿 E40；保留 async 前缀） ── */
function extractFn(src, name) {
  const i = src.indexOf(`function ${name}(`);
  if (i === -1) return null;
  const asyncPrefix = src.slice(Math.max(0, i - 6), i) === 'async ' ? 'async ' : '';
  let depth = 0;
  let j = src.indexOf('{', i);
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return asyncPrefix + src.slice(i, j + 1); }
  }
  return null;
}

/* ═══════ 一 · 刀一：会话级权益纯核（三场景物理隔离） ═══════ */
const mkStore = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _m: m,
  };
};

test('E159-1 场景白名单：非法/缺省 ⇒ 情爱；绝不回显原始入参', () => {
  assert.deepEqual([...ENT.COMPAT_SCENES], ['romance', 'business', 'friendship'], '场景白名单漂移');
  assert.ok(Object.isFrozen(ENT.COMPAT_SCENES), '场景白名单须冻结');
  for (const raw of [undefined, null, '', 'x', 'romance ', 'BUSINESS', '__proto__', 'constructor', 0, {}]) {
    assert.equal(ENT.normalizePairScene(raw), 'romance', `非法场景未落情爱：${String(raw)}`);
  }
  assert.equal(ENT.normalizePairScene('business'), 'business');
  assert.equal(ENT.normalizePairScene('friendship'), 'friendship');
  assert.equal(ENT.normalizePairScene('business#friendship'), 'romance', '复合格式不得穿透');
  // 键名契约（App 字面锁定 ⇒ 测试锚点）
  assert.equal(ENT.ROMANCE_UNLOCK_KEY, 'ks_compat_session_unlocked', 'E85 契约键漂移');
  assert.equal(ENT.SESSION_SCENES_KEY, 'ks_compat_session_unlocked_scenes');
  assert.equal(ENT.PURCHASE_SCENE_KEY, 'ks_e159_purchase_scene');
  assert.equal(ENT.ARCHIVE_SLOT_PREFIX, 'ks_e158_report_archive_e159_');
  assert.deepEqual(ENT.COMPAT_SCENE_PLAN_LISTS, { monthly: 'compatibility_monthly_scenes', yearly: 'compatibility_yearly_scenes' });
});

test('E159-2 一次付费只解锁「购买的那个场景」：商道付讫 ⇒ 情爱/挚友仍锁；严格口径撤回闸门旧字面误写的情爱键', () => {
  const s = mkStore();
  // 闸门锁定的旧字面会在 once 付讫时无条件写情爱键（App #320/#1622）——商道购买场景下必须被撤回
  s.setItem('ks_compat_session_unlocked', '1');
  ENT.markSessionSceneUnlocked(s, 'business');
  assert.equal(ENT.sessionSceneUnlocked(s, 'business'), true);
  assert.equal(ENT.sessionSceneUnlocked(s, 'romance'), false, '商道付讫后情爱被串开（闸门旧字面泄漏）');
  assert.equal(ENT.sessionSceneUnlocked(s, 'friendship'), false, '商道付讫后挚友被串开');
  assert.equal(s.getItem('ks_compat_session_unlocked'), null, '情爱旧键未被撤回');
  assert.deepEqual(JSON.parse(s.getItem('ks_compat_session_unlocked_scenes')), ['business']);
  // 再买情爱 ⇒ 两场景并存、旧键同写（E85 契约）
  ENT.markSessionSceneUnlocked(s, 'romance');
  assert.deepEqual(ENT.readSessionScenes(s), ['business', 'romance']);
  assert.equal(s.getItem('ks_compat_session_unlocked'), '1');
  // 情爱已解锁时再买商道 ⇒ 情爱旧键保留（不得误撤）
  ENT.markSessionSceneUnlocked(s, 'business');
  assert.equal(s.getItem('ks_compat_session_unlocked'), '1', '情爱确已解锁时旧键被误撤');
  // 幂等
  ENT.markSessionSceneUnlocked(s, 'friendship');
  ENT.markSessionSceneUnlocked(s, 'friendship');
  const sorted = (arr) => [...arr].sort();
  assert.deepEqual(sorted(ENT.readSessionScenes(s)), ['business', 'friendship', 'romance'], '三场景解锁集合漂移');
  assert.equal(ENT.sessionSceneUnlocked(s, 'friendship'), true);
  // 无档/坏档 ⇒ fail-closed
  assert.equal(ENT.sessionSceneUnlocked(mkStore(), 'romance'), false);
  const bad = mkStore(); bad.setItem('ks_compat_session_unlocked_scenes', '{not json');
  assert.equal(ENT.sessionSceneUnlocked(bad, 'romance'), false);
  ENT.markSessionSceneUnlocked(bad, 'friendship');
  assert.deepEqual(ENT.readSessionScenes(bad), ['friendship'], '坏档须被重建');
  // 数组内非法项被剔除
  const dirty = mkStore(); dirty.setItem('ks_compat_session_unlocked_scenes', JSON.stringify(['business', 'hacker', 'business']));
  assert.deepEqual(ENT.readSessionScenes(dirty), ['business']);
});

test('E159-3 清场/购买场景/归档槽位：新测算三键全清；购买场景跨 reload 记忆；每场景一槽互不串读', () => {
  const s = mkStore();
  ENT.markSessionSceneUnlocked(s, 'romance');
  ENT.markSessionSceneUnlocked(s, 'business');
  ENT.rememberPurchaseScene(s, 'business');
  ENT.writeSceneArchive(s, { scene: 'business', monthly: { text: 'B-M' } });
  ENT.writeSceneArchive(s, { scene: 'romance', monthly: { text: 'R-M' }, scene2: 1 });
  assert.equal(ENT.sceneArchiveKey('romance'), 'ks_e158_report_archive_e159_romance');
  assert.equal(ENT.sceneArchiveKey('business'), 'ks_e158_report_archive_e159_business');
  assert.equal(ENT.readSceneArchive(s, 'business').monthly.text, 'B-M');
  assert.equal(ENT.readSceneArchive(s, 'romance').monthly.text, 'R-M');
  assert.equal(ENT.readSceneArchive(s, 'friendship'), null, '未解锁场景读到他人归档');
  assert.equal(ENT.readSceneArchive(s, 'x').monthly.text, 'R-M', '非法场景须落情爱槽');
  assert.equal(ENT.readPurchaseScene(s), 'business');
  // 归档槽内自带 scene 字段（读侧二次核对）
  assert.equal(JSON.parse(s.getItem('ks_e158_report_archive_e159_business')).scene, 'business');
  ENT.clearSessionScenes(s);
  assert.equal(s.getItem('ks_compat_session_unlocked'), null, '新测算须清情爱旧键');
  assert.equal(s.getItem('ks_compat_session_unlocked_scenes'), null, '新测算须清场景数组键');
  assert.equal(ENT.readPurchaseScene(s), null, '新测算须清购买场景键');
  assert.equal(ENT.sessionSceneUnlocked(s, 'romance'), false);
  assert.equal(ENT.sessionSceneUnlocked(s, 'business'), false);
  // 归档槽位由 App.handleCalculate 按场景逐槽清除（不随 clearSessionScenes，以免重置演练误删历史报告）
  assert.ok(APP.includes('for (const _s of COMPAT_SCENES) { try { sessionStorage.removeItem(sceneArchiveKey(_s)); } catch'), '新测算未逐槽清三场景归档');
  for (const raw of ['', 'x', 'BUSINESS', 'romance#x']) {
    const t = mkStore(); t.setItem('ks_e159_purchase_scene', raw);
    assert.equal(ENT.readPurchaseScene(t), null, `购买场景坏档未回落 null：${raw}`);
  }
});

/* ═══════ 二 · 刀一：账号级权益纯核 + 服务端同口径（VM 抽取式） ═══════ */
const NOW = new Date('2026-11-27T00:00:00Z'); // 可注入时钟（铁律 19：相对断言，不消费真实时钟）
const SIG = '1990-08-05~1992-03-14';

test('E159-4 账号级 once：情爱裸签名 / 商道·挚友「签名#场景」；名单非空时互不串台；老账号（位 true 名单空）仅覆盖情爱', () => {
  const biz = { compatibility_once: true, compatibility_once_charts: ['1990-08-05~1992-03-14#business'] };
  assert.equal(ENT.accountSceneEntitled(biz, 'once', 'business', { comboSig: SIG, now: NOW }), true);
  assert.equal(ENT.accountSceneEntitled(biz, 'once', 'romance', { comboSig: SIG, now: NOW }), false, '商道 once 串开情爱');
  assert.equal(ENT.accountSceneEntitled(biz, 'once', 'friendship', { comboSig: SIG, now: NOW }), false);
  assert.equal(ENT.accountSceneEntitled(biz, 'once', 'business', { comboSig: '1991-01-01~1992-03-14', now: NOW }), false, '换盘仍命中');
  const rom = { compatibility_once: true, compatibility_once_charts: [SIG] };
  assert.equal(ENT.accountSceneEntitled(rom, 'once', 'romance', { comboSig: SIG, now: NOW }), true);
  assert.equal(ENT.accountSceneEntitled(rom, 'once', 'business', { comboSig: SIG, now: NOW }), false, '情爱 once 串开商道');
  const legacy = { compatibility_once: true, compatibility_once_charts: [] };
  assert.equal(ENT.accountSceneEntitled(legacy, 'once', 'romance', { comboSig: SIG, now: NOW }), true, '老账号情爱权益须逐字节兼容');
  assert.equal(ENT.accountSceneEntitled(legacy, 'once', 'business', { comboSig: SIG, now: NOW }), false, '老账号不得白送商道');
  assert.equal(ENT.accountSceneEntitled(legacy, 'once', 'romance', { now: NOW }), false, '缺签名 fail-closed');
  assert.equal(ENT.accountSceneEntitled({ compatibility_once: false }, 'once', 'romance', { comboSig: SIG, now: NOW }), false);
  assert.equal(ENT.compatEntitlementKey(SIG, 'business'), SIG + '#business');
  assert.equal(ENT.compatEntitlementKey(SIG, 'romance'), SIG);
  assert.equal(ENT.compatEntitlementKey('', 'business'), '');
});

test('E159-5 账号级月报/年报：场景名单互不串台；全通不受场景限制；星月卡配额通道不变', () => {
  const p = { compatibility_monthly_report: true, compatibility_monthly_scenes: ['business'],
    compatibility_yearly_report: true, compatibility_yearly_scenes: ['romance'] };
  assert.equal(ENT.accountSceneEntitled(p, 'monthly', 'business', { now: NOW }), true);
  assert.equal(ENT.accountSceneEntitled(p, 'monthly', 'romance', { now: NOW }), false, '商道月报串开情爱');
  assert.equal(ENT.accountSceneEntitled(p, 'monthly', 'friendship', { now: NOW }), false);
  assert.equal(ENT.accountSceneEntitled(p, 'yearly', 'romance', { now: NOW }), true);
  assert.equal(ENT.accountSceneEntitled(p, 'yearly', 'business', { now: NOW }), false, '情爱年报串开商道');
  assert.equal(ENT.accountSceneEntitled(p, 'once', 'romance', { comboSig: SIG, now: NOW }), false, 'kind 越界');
  const legacyM = { compatibility_monthly_report: true };
  assert.equal(ENT.accountSceneEntitled(legacyM, 'monthly', 'romance', { now: NOW }), true, '老账号月报位 true 名单空 ⇒ 仅情爱');
  assert.equal(ENT.accountSceneEntitled(legacyM, 'monthly', 'business', { now: NOW }), false);
  const pass = { all_pass_yearly: true, all_pass_expires_at: '2099-01-01T00:00:00Z' };
  for (const sc of ['romance', 'business', 'friendship']) for (const k of ['once', 'monthly', 'yearly']) {
    assert.equal(ENT.accountSceneEntitled(pass, k, sc, { comboSig: SIG, now: NOW }), true, `全通须全场景可用 ${k}/${sc}`);
  }
  assert.equal(ENT.accountSceneEntitled({ all_pass_yearly: true, all_pass_expires_at: '2020-01-01T00:00:00Z' }, 'monthly', 'business', { now: NOW }), false, '过期全通仍生效');
  const star = { star_monthly_vip: true, star_monthly_compatibility_allowance: 2, star_monthly_compatibility_used: 1 };
  assert.equal(ENT.accountSceneEntitled(star, 'monthly', 'business', { now: NOW }), true, '星月卡配额通道被误伤');
  assert.equal(ENT.accountSceneEntitled({ ...star, star_monthly_compatibility_used: 2 }, 'monthly', 'business', { now: NOW }), false);
});

test('E159-6 服务端场景键与前端纯核逐字同口径（VM 抽取式：compatKeyFor / compatSceneListed / compatSceneEntitledByType）', () => {
  const NAMES = ['compatSceneOf', 'compatKeyFor', 'compatSceneListed', 'compatSceneListPush', 'compatOnceComboListed', 'compatibilityEntitledByType', 'compatSceneEntitledByType'];
  const parts = NAMES.map((n) => extractFn(SERVER, n));
  parts.forEach((p, i) => assert.ok(p, `server.js 缺函数或锚点漂移：${NAMES[i]}`));
  const S = new Function(parts.join('\n') + `\nreturn { ${NAMES.join(', ')} };`)();
  for (const sc of ['romance', 'business', 'friendship']) {
    assert.equal(S.compatKeyFor(SIG, sc), ENT.compatEntitlementKey(SIG, sc), `服务端/前端 once 键不同口径：${sc}`);
  }
  const plansFixtures = [{}, { compatibility_monthly_scenes: [] }, { compatibility_monthly_scenes: ['romance'] },
    { compatibility_monthly_scenes: ['business'] }, { compatibility_monthly_scenes: ['business', 'friendship'] },
    { compatibility_monthly_scenes: ['business', 'friendship', 'romance'] }, { compatibility_monthly_scenes: [null, 1, 'business'] }];
  for (const p of plansFixtures) for (const sc of ['romance', 'business', 'friendship', undefined]) {
    assert.equal(S.compatSceneListed(p, 'compatibility_monthly_scenes', sc), ENT.scenePlanListed(p, 'compatibility_monthly_scenes', sc),
      `服务端/前端名单判定不同口径：${JSON.stringify(p)}/${sc}`);
  }
  assert.deepEqual(S.compatSceneListPush(['business'], 'friendship'), ['business', 'friendship']);
  assert.deepEqual(S.compatSceneListPush(['business'], 'business'), ['business']);
  assert.deepEqual(S.compatSceneListPush(null, 'x'), ['romance']);
  // once 名单
  const biz = { compatibility_once: true, compatibility_once_charts: [SIG + '#business'] };
  assert.equal(S.compatOnceComboListed(biz, SIG, 'business'), true);
  assert.equal(S.compatOnceComboListed(biz, SIG, 'romance'), false, '服务端商道 once 串开情爱');
  assert.equal(S.compatOnceComboListed(biz, SIG, 'friendship'), false);
  assert.equal(S.compatOnceComboListed(biz, '', 'business'), false);
  // 按类型：月报/年报须场景名单命中；全通不受限
  const pm = { compatibility_monthly_report: true, compatibility_monthly_scenes: ['business'] };
  assert.equal(S.compatSceneEntitledByType(pm, 'monthly', NOW, 'business'), 'compatibility_monthly_report');
  assert.equal(S.compatSceneEntitledByType(pm, 'monthly', NOW, 'romance'), null, '服务端商道月报串开情爱');
  assert.equal(ENT.accountSceneEntitled(pm, 'monthly', 'romance', { now: NOW }), false);
  assert.equal(ENT.accountSceneEntitled(pm, 'monthly', 'business', { now: NOW }), true);
  const pass = { all_pass_yearly: true, all_pass_expires_at: '2099-01-01T00:00:00Z' };
  assert.equal(S.compatSceneEntitledByType(pass, 'monthly', NOW, 'friendship'), 'all_pass_yearly');
});

test('E159-7 服务端/沙盒通道/收银台字面：权益校验、落库键、缓存键、会话钥匙全部按场景隔离', () => {
  const anchors = [
    "console.log('[E159] compat scene NOT listed => NO_ENTITLEMENT type='", // 权益校验落 NO_ENTITLEMENT
    'compatSceneEntitledByType(plans, reportType, new Date(), _e159Scene)',
    '!compatOnceComboListed(paidPlans, comboSig, _e159Scene)',
    '!compatOnceComboListed(paidPlans, comboSig, _e159Scene)',
    "if (plan === 'compatibility_monthly_report') updatedPlans.compatibility_monthly_scenes = compatSceneListPush(currentPlans.compatibility_monthly_scenes, _e159Scene)",
    "if (plan === 'compatibility_yearly_report') updatedPlans.compatibility_yearly_scenes = compatSceneListPush(currentPlans.compatibility_yearly_scenes, _e159Scene)",
    'compatKeyFor(_e148ComboSig, _e159Scene)',
    'compatKeyFor(_e131ChartSig, _e159Scene)',
    "const _e159Scene = compatSceneOf(session.metadata && session.metadata.scene)",
    "scene: _e159Scene,",
    "{ scene: _e159Scene } : {}",
    "scene: _e159Scene,", // 第二处（收银台会话 metadata）
    'sceneMod.tarotOrientSlice(sceneMeaning, lang, draw.reversed)',
  ];
  for (const a of anchors) {
    assert.ok(SERVER.includes(a), `server.js 缺锚：${a}`);
  }
  assert.equal(count(SERVER, 'scene: _e159Scene,'), 1, '沙盒通道会话 scene 字段须恰一处');
  assert.equal(count(SERVER, "{ scene: _e159Scene } : {}"), 1, 'live 同源会话 metadata 场景须恰一处');
  assert.ok(SERVER.includes('_e159SceneRebuy'), '月报/年报重购判定缺场景维度');
  assert.ok(SERVER.includes('_e156Overlay && reportType === \'compatibility\''), 'E156 洞察档分支须保留');
  // 沙盒支付纯核：场景透传白名单
  assert.ok(SBPAY.includes("const _e159SceneRaw = typeof it.scene === 'string' ? it.scene.trim() : String(meta.scene || '').trim();"), '沙盒纯核缺场景透传读取');
  assert.ok(SBPAY.includes("scene: it.scene,"), '沙盒派发缺 scene 字段');
});

/* ═══════ 三 · 刀二：三模块按场景分流（内存内编译算法层） ═══════ */
const ALGOS = loadAlgos();
const ZH_LEAK = ['姻缘解读', '感情生活', '恋爱者', '旧情换新颜', '姻缘', '合婚', '感情中', '恋人', '最深沉的爱', '夫妻', '情侣', '爱情', '桃花'];
const userText = (r) => [r.engines.bazi, r.engines.zodiac, r.engines.iching]
  .flatMap((e) => [e.title, e.summary, e.detail])
  .concat((r.luckyAspects || []).map((a) => (typeof a === 'string' ? a : a && (a.text || a.label) || '')),
    (r.challengingAspects || []).map((a) => (typeof a === 'string' ? a : a && (a.text || a.label) || '')))
  .filter((s) => typeof s === 'string');

test('E159-8 商道/挚友中文：零情爱穿帮词、用户可见文本零 element；非中文零 CJK', () => {
  for (const scene of ['business', 'friendship']) for (const lang of LANGS) {
    const r = ALGOS.calculateCompatibility('1990-08-05', '1992-03-14', lang, scene);
    assert.equal(r.error, undefined, `${scene}/${lang} 算法报错`);
    const texts = userText(r);
    assert.ok(texts.length >= 9, `${scene}/${lang} 用户可见文本不足`);
    if (lang === 'zh') {
      for (const w of ZH_LEAK) assert.equal(texts.some((s) => s.includes(w)), false, `${scene} 中文出现情爱穿帮词「${w}」`);
      assert.equal(texts.some((s) => /element/i.test(s)), false, `${scene} 中文用户可见文本出现 element`);
    } else {
      assert.equal(texts.some((s) => CJK.test(s)), false, `${scene}/${lang} 出现 CJK 残留（单语纯净锁）`);
    }
  }
});

test('E159-9 情爱路径逐字节不变；商道/挚友解读确与情爱分流；易经解读标题按场景（姻缘/商道/挚友解读）', () => {
  for (const lang of LANGS) {
    const base = ALGOS.calculateCompatibility('1990-08-05', '1992-03-14', lang);
    const rom = ALGOS.calculateCompatibility('1990-08-05', '1992-03-14', lang, 'romance');
    assert.equal(JSON.stringify(rom), JSON.stringify(base), `${lang} 显式情爱与无场景结果不一致`);
    for (const scene of ['business', 'friendship']) {
      const r = ALGOS.calculateCompatibility('1990-08-05', '1992-03-14', lang, scene);
      assert.notEqual(JSON.stringify(r), JSON.stringify(base), `${lang}/${scene} 未与情爱分流`);
      assert.equal(r.overall, base.overall, `${lang}/${scene} 分数不得随场景漂移（场景只换文案）`);
    }
  }
  const zh = (scene) => ALGOS.calculateCompatibility('1990-08-05', '1992-03-14', 'zh', scene).engines.iching.detail;
  assert.ok(zh('romance').includes('【姻缘解读】'), '情爱易经缺【姻缘解读】');
  assert.ok(zh('business').includes('【商道解读】'), '商道易经缺【商道解读】');
  assert.ok(zh('friendship').includes('【挚友解读】'), '挚友易经缺【挚友解读】');
  assert.equal(zh('business').includes('姻缘'), false);
  assert.equal(zh('friendship').includes('姻缘'), false);
});

/* ═══════ 四 · 刀五：塔罗正/逆位切片（264 条六语标记全量校验） ═══════ */
const ORIENT = {
  zh: [/正位[时]?[，,:：]/, /逆位[时]?[，,:：]/],
  en: [/Upright:/, /Reversed:/],
  fr: [/À l'endroit :/, /Sens inverse :/],
  es: [/Al derecho:/, /En sentido inverso:/],
  th: [/ตำแหน่งตรง:/, /ตำแหน่งกลับด้าน:/],
  vi: [/Thuận:/, /Ngược:/],
};

test('E159-10 tarotOrientSlice：逆位只取逆位启示、正位不含逆位段；未传方位 ⇒ 整段原样（旧调用零变）', () => {
  let n = 0;
  for (const scene of ['business', 'friendship']) for (let id = 0; id <= 21; id++) for (const lang of LANGS) {
    const m = TAROT_S.tarotSceneMeaning(id, lang, scene);
    if (!m) continue;
    n++;
    const M = ORIENT[lang];
    assert.ok(M[1].test(m), `${scene}#${id}/${lang} 缺逆位标记`);
    const rev = TAROT_S.tarotOrientSlice(m, lang, true);
    const up = TAROT_S.tarotOrientSlice(m, lang, false);
    assert.ok(rev.length > 0 && up.length > 0, `${scene}#${id}/${lang} 切片为空`);
    assert.equal(M[0].test(rev), false, `${scene}#${id}/${lang} 逆位切片混入正位标记`);
    assert.equal(M[1].test(up), false, `${scene}#${id}/${lang} 正位切片混入逆位标记`);
    assert.equal(m.includes(rev), true, `${scene}#${id}/${lang} 逆位切片非原文子串`);
    assert.equal(m.includes(up), true, `${scene}#${id}/${lang} 正位切片非原文子串`);
    assert.equal(TAROT_S.tarotOrientSlice(m, lang), m, '未传方位须整段原样');
  }
  assert.equal(n, 264, `场景牌义条数漂移：${n}`);
  assert.equal(TAROT_S.tarotOrientSlice('无标记文本', 'zh', true), '无标记文本', '无方位标记须 fail-soft');
  assert.equal(TAROT_S.tarotOrientSlice('正位，A。逆位，B。', 'en', true), '正位，A。逆位，B。', '语种无标记 ⇒ 整段');
});

/* ═══════ 五 · 刀三：/result 二次刷新黑屏根治（App 字面） ═══════ */
test('E159-11 刀三：/result 直载稳定恢复；恢复标记不再「消费一次即删」；checkPaidStatus 空 URL 根因修复', () => {
  const must = [
    "const _e159OnResultRoute = /^\\/result\\/?$/.test(window.location.pathname);",
    'const _e159PlainRestore = _e159OnResultRoute && !isOAuthCallback && !justLoggedIn && !paymentSuccess;',
    'if (savedResult && (isOAuthCallback || justLoggedIn || paymentSuccess || _e159OnResultRoute)) {',
    "if (_e159OnResultRoute) { _setPage('input'); window.history.replaceState({}, '', '/'); }",
    'const _e159SessUnlocked = (() => { try { return sessionSceneUnlocked(sessionStorage, e156Scene); } catch { return false; } })();',
    'if (isCompatibilityPaid || _e159SessUnlocked) {',
  ];
  for (const a of must) assert.ok(APP.includes(a), `App.tsx 缺锚：${a}`);
  assert.ok(APP.includes('try { _e99AnonUnlocked = sessionSceneUnlocked(sessionStorage, e156SceneOfSavedResult()); } catch'), '匿名旁路须按场景判解锁');
  assert.ok(APP.includes("import { SUPABASE_REST_URL } from './lib/supabase';"), 'checkPaidStatus 空 URL 根因：须改用硬兜底 REST URL');
  assert.equal(APP.includes("VITE_SUPABASE_URL || ''"), false, 'App.tsx 残留空串兜底的 REST URL');
  assert.equal(count(APP, 'const supabaseUrl = SUPABASE_REST_URL;'), 2, '两处 REST URL 须同源硬兜底');
  assert.ok(SB_TS.includes("import.meta.env.VITE_SUPABASE_URL || 'https://wfkxqhlcgrikxoofjvas.supabase.co'"), 'supabase.ts 须硬兜底产线 URL');
  // 场景随 ks_result 持久化 ⇒ 刷新后落回同一场景（权益/报告/塔罗同步）
  assert.ok(APP.includes('function e159PersistScene(scene: string)'), '缺场景持久化');
  assert.ok(APP.includes('e159PersistScene(e156Scene);'), '场景切换未持久化');
  assert.ok(APP.includes('function e156SceneOfSavedResult()'), '缺已落盘场景读取');
  // 自动触发：登录态直接重载 /result ⇒ 已解锁场景自动生成（每场景一次）
  assert.ok(APP.includes("const e159AutoRef = useRef<string>('');"), '缺自动触发 ref');
  assert.ok(APP.includes('if (e159AutoRef.current === e156Scene) return;'), '自动触发须按场景去重');
  // 登录态权益（checkPaidStatus）与收银前预检两处同口径：直通键改按「场景＋双盘签名」判定（旧布尔位不看场景 ⇒ 他场景误撤墙）
  assert.equal(count(APP, "if (accountSceneEntitled(_e159CompatOnly, 'once', e156Scene, { comboSig: _e159ComboSig })) return true;"), 2, 'once 场景判定须两处');
  assert.equal(count(APP, "if (accountSceneEntitled(_e159CompatOnly, 'monthly', e156Scene)) return true;"), 2, '月报场景判定须两处');
  assert.equal(count(APP, "if (accountSceneEntitled(_e159CompatOnly, 'yearly', e156Scene)) return true;"), 2, '年报场景判定须两处');
  assert.equal(APP.includes("const directKeys = ['compatibility_once'"), false, '旧直通键（不看场景）残留违令');
  // 全通/星月卡配额既有分支保留（不掺入场景判定）
  assert.equal(count(APP, 'if (planMap.all_pass_monthly === true) {'), 2, '全通月订分支须两处保留');
  // 洞察缓存「24h 后永不命中」潜伏缺陷（实测 2026-11-27：行存在但 created_at 超窗 ⇒ 读 MISS；纯 POST 插入撞主键静默失败
  //   ⇒ 每次刷新/切回重生成、报告漂移）。治法：合盘两分支写缓存一律 upsert＋显式刷新 created_at。
  const e156Write = betweenE159(SERVER, 'await safeFetch(`${SB_URL_E156}/rest/v1/ai_insights_cache`, {', 'return res.json({ insight: _e156Text, cached: false });');
  assert.ok(e156Write.includes("'Prefer': 'resolution=merge-duplicates'"), 'E156 场景分支缓存写须 upsert（merge-duplicates）');
  assert.ok(e156Write.includes('created_at: new Date().toISOString()'), 'E156 场景分支缓存写须显式刷新 created_at（重启 24h 窗）');
  const legacyWrite = betweenE159(SERVER, '// ── 写入缓存(直接 REST)──', 'prompt_version: `v1.0.0-');
  assert.ok(legacyWrite.includes("'Prefer': 'resolution=merge-duplicates'"), '旧逻辑分支缓存写须 upsert（merge-duplicates）');
  const legacyBody = betweenE159(SERVER, '// ── 写入缓存(直接 REST)──', "res.json({ insight, cached: false });");
  assert.ok(legacyBody.includes('created_at: new Date().toISOString()'), '旧逻辑分支缓存写须显式刷新 created_at');
  assert.equal((betweenE159(SERVER, 'if (_e156Overlay && reportType === \'compatibility\') {', '// ── 普通合盘洞察(旧逻辑)──').match(/'Prefer': 'return=minimal'/g) || []).length, 0, 'E156 场景分支残留 return=minimal 纯插入写法');
});
/** E159 局部助手：两锚点之间的源码切片（锚缺失即抛，杜绝假绿） */
function betweenE159(src, a, b) {
  const i = src.indexOf(a); const j = src.indexOf(b, i + 1);
  assert.ok(i >= 0 && j > i, `server.js 切片锚缺失：${a.slice(0, 40)} … ${b.slice(0, 40)}`);
  return src.slice(i, j);
}

/* ═══════ 六 · 刀一/五：前端隔离与直达态（App/CSS/字典 字面） ═══════ */
test('E159-12 付费墙态场景切换条 + 切换归档让位 + 已解锁直达态 + 单箭头', () => {
  const must = [
    'import { sessionSceneUnlocked, markSessionSceneUnlocked, clearSessionScenes, rememberPurchaseScene, readPurchaseScene, readSceneArchive, writeSceneArchive, sceneArchiveKey, accountSceneEntitled, normalizePairScene, COMPAT_SCENES } from \'./lib/compatSceneEntitlement.mjs\';',
    'data-testid="e159-scene-switch-paywall"',
    'testId="e156-pills-paywall"',
    'const e159SwitchGuardRef = React.useRef(false);',
    'e159SwitchGuardRef.current = true;',
    'if (e159SwitchGuardRef.current) { e159SwitchGuardRef.current = false; return; }',
    'try { writeSceneArchive(sessionStorage, a); } catch',
    'if (!reportLoading && e159KindUnlocked(kind)) { generateReport(kind); return true; }',
    "resT(lang, 'btn_unlocked_view')",
    "resT(lang, 'iching_heading_' + normalizeCardScene(liveScene))",
    'const res = calculateCompatibility(d1, d2, lang, normalizeCardScene(meta && meta.scene));',
    'try { rememberPurchaseScene(sessionStorage, e156Scene); } catch',
  ];
  for (const a of must) assert.ok(APP.includes(a), `App.tsx 缺锚：${a}`);
  assert.ok(APP.includes('_e159BodyScene()'), 'create-checkout 请求体须携场景');
  assert.ok(APP.includes('const e159KindUnlocked = (kind: \'monthly\' | \'yearly\'): boolean =>'), '缺已解锁判定');
  assert.ok(APP.includes('try { clearSessionScenes(sessionStorage); } catch (_) { /* noop */ }'), '新测算须清场景键');
  assert.ok(APP.includes("onChange={(s) => { if (s !== e156Scene && !loading && !reportLoading) onSceneChange(s); }}"), '生成中切场景须禁切');
  assert.equal(/[▼▲]/.test(APP), false, 'App.tsx 不得出现双箭头/三箭头字符（统一折叠栏箭头）');
  assert.ok(APP.includes("'✓ ' + resReportTitle(lang, e156Scene, kind) + ' · ' + resT(lang, 'btn_unlocked_view')"), '直达态文案须「✓ 标题 · 已解锁 · 点击查看」');
  // 已解锁月报/年报按钮：价签退场（直达态优先于价签文案）
  assert.equal(count(APP, "e159OwnedLabel('monthly') ||"), 1);
  assert.equal(count(APP, "e159OwnedLabel('yearly') ||"), 1);
  assert.ok(/e159OwnedLabel\('monthly'\) \|\| \(e156IsScene \? resAlmanacBtn\(lang, e156Scene, 'monthly'\)/.test(APP), '情爱/旧价签通道须保留给未解锁态');
  assert.ok(/e159OwnedLabel\('yearly'\) \|\| \(e156IsScene \? resAlmanacBtn\(lang, e156Scene, 'yearly'\)/.test(APP), '情爱/旧价签通道须保留给未解锁态（年报）');
});

test('E159-13 付讫落「购买场景」：三处 mark 均以购买场景为准（绝不落当前场景）', () => {
  assert.equal(count(APP, 'markSessionSceneUnlocked(sessionStorage, readPurchaseScene(sessionStorage) ||'), 4, '付讫/回场解锁须 4 处均按购买场景');
});

test('E159-14 placeholder 防裁切：昵称框类名 + 12px/11.5px 字号 + 精简措辞', () => {
  assert.ok(APP.includes('className="ks-e159-nickname-input"'), '昵称输入框缺防裁切类名');
  assert.ok(APP.includes('data-purpose="nickname"') && APP.includes('autoComplete="off"'), '去真名化引导契约须保留');
  assert.ok(APP_CSS.includes('.ks-e159-nickname-input::placeholder { font-size: 12px; letter-spacing: 0; }'), '缺 placeholder 12px');
  assert.ok(/@media \(max-width: 480px\)\s*\{\s*\.ks-e159-nickname-input::placeholder \{ font-size: 11\.5px; \}/.test(APP_CSS), '缺移动端 11.5px');
  assert.ok(exists('web/src/lib/compatSceneEntitlement.d.mts'), '缺 tsc 声明（compatSceneEntitlement）');
  assert.ok(exists('web/src/lib/tarotScenes.d.mts'), '缺 tsc 声明（tarotScenes）');
});

test('E159-15 刀六：六语字典逐字增补（易经三场景标题 / 直达态 / TA 昵称精简版）；单语纯净', () => {
  const row = (k) => LANGS.map((L) => DICT.resT(L, k));
  for (const k of ['iching_heading_romance', 'iching_heading_business', 'iching_heading_friendship', 'btn_unlocked_view', 'nickname_partner_placeholder', 'nickname_self_placeholder']) {
    const vals = row(k);
    assert.ok(vals.every((v) => typeof v === 'string' && v.length > 0), `字典缺键或空值：${k}`);
    assert.equal(vals.length, 6, `字典 ${k} 须六语`);
  }
  const hd = (k) => row(k);
  assert.equal(hd('iching_heading_romance')[0], '姻缘解读');
  assert.equal(hd('iching_heading_business')[0], '商道解读');
  assert.equal(hd('iching_heading_friendship')[0], '挚友解读');
  assert.equal(hd('btn_unlocked_view')[0], '已解锁 · 点击查看');
  for (const k of ['iching_heading_romance', 'iching_heading_business', 'iching_heading_friendship', 'btn_unlocked_view', 'nickname_partner_placeholder', 'nickname_self_placeholder']) {
    const vals = row(k);
    for (let i = 1; i < 6; i++) {
      assert.equal(CJK.test(vals[i]), false, `${k}[${i}] 出现 CJK`);
      assert.equal(/password/i.test(vals[i]), false, `${k}[${i}] 出现 Password 机翻`);
    }
    assert.equal(new Set(vals).size, 6, `${k} 六语须互异`);
  }
  assert.deepEqual(row('nickname_partner_placeholder').slice(1), ['Their nickname (opt.)', 'Surnom (facultatif)', 'Su apodo (opc.)', 'ชื่อเล่นอีกฝ่าย (ไม่บังคับ)', 'Biệt danh họ (tùy chọn)']);
  const partner = row('nickname_partner_placeholder');
  // 军令逐字措辞（en 19 / fr 20 / vi 24 字符）；防裁切由 12px/11.5px 字号 + 真页实测（e159-verify）保证
  for (const [i, max] of [[1, 21], [2, 21], [5, 25]]) assert.ok(partner[i].length <= max, `${LANGS[i]} TA 昵称超出军令措辞长度：${partner[i]}`);
  // 键数基准：新增键不得挤掉军令键
  for (const k of ['iching_heading_romance', 'iching_heading_business', 'iching_heading_friendship', 'btn_unlocked_view']) {
    assert.equal(DICT.RESONANCE_MANDATED_KEYS.includes(k), false, `${k} 不得擅入军令键集（军令未动）`);
  }
});

test('E159-16 封存守卫：下一役标识 e160/E160 落盘前不得出现（后继化时改为 e161）', () => {
  for (const bad of ['e160', 'E160']) {
    assert.equal(APP.includes(bad), false, `App.tsx 出现下一役标识：${bad}`);
    assert.equal(SERVER.includes(bad), false, `server.js 出现下一役标识：${bad}`);
  }
});

/* ═══════ 七 · 刀四：出生时空全参透传（VM 抽取式装配器 · 宜昌 30.7°N 111.3°E） ═══════ */
const ASSEMBLY_DEPS = ['resolveTimeZone', 'resolveCoordinates', 'getAstroMatrix', 'extractNatalTriad', 'getDualSynastryTensor', 'console'];
const CHART_A = { Sun: 143.2, Moon: 210.5, Mercury: 150.1, Venus: 170.4, Mars: 95.3, Jupiter: 200.2, Saturn: 310.8, Uranus: 70.5, Neptune: 320.1, Pluto: 250.9 };
const CHART_B = { Sun: 353.7, Moon: 80.2, Mercury: 10.4, Venus: 300.9, Mars: 220.6, Jupiter: 160.3, Saturn: 280.2, Uranus: 120.7, Neptune: 318.5, Pluto: 245.1 };
function makeAssembler(serverSrc) {
  const side = extractFn(serverSrc, '_compatTimeTruthSide');
  const main = extractFn(serverSrc, 'buildCompatSynastryTruth');
  assert.ok(side && main, '装配器源码抽取失败（函数锚点漂移？）');
  const calls = { astro: [] };
  const deps = {
    resolveTimeZone: (tz, lat, lon) => {
      if (tz) return { ok: true, tz: String(tz), tier: 1 };
      if (lat != null && lon != null) return { ok: true, tz: 'Etc/GMT-8', tier: 2 };
      return { ok: true, tz: 'Asia/Bangkok', tier: 0 };
    },
    resolveCoordinates: (lat, lon) => ({ ok: true, lat, lon, tier: (lat != null && lon != null) ? 'explicit' : 'default' }),
    getAstroMatrix: async (bd, bt, lat, lon, tz) => { calls.astro.push({ bd, bt, lat, lon, tz }); return { meta: { planet_longitudes: CHART_A } }; },
    extractNatalTriad: (m) => ({ planetLongitudes: (m.meta && m.meta.planet_longitudes) || {} }),
    getDualSynastryTensor: async (p) => ({ precision: p.precision, unknown: p.precision === 'date_level' ? ['Moon'] : [],
      harmony: { harmonious: 18, hard: 16, total: 34, ratio: 0.529 }, summary: { bonds: [], frictions: [], signatures: {} } }),
    console: { log() {}, warn() {} },
  };
  const factory = new Function(...ASSEMBLY_DEPS, `${side}\n${main}\nreturn { buildCompatSynastryTruth };`);
  return { fn: factory(...ASSEMBLY_DEPS.map((k) => deps[k])).buildCompatSynastryTruth, calls };
}
const YICHANG = { birthTime: '14:30', tz: 'Asia/Shanghai', lat: 30.7, lon: 111.3, city: '宜昌' };
const BANGKOK = { birthTime: '09:00', tz: 'Asia/Bangkok', lat: 13.75, lon: 100.5, city: '曼谷' };

test('E159-17 刀四 · 宜昌全参透传：建盘吃到 lat=30.7 / lon=111.3 / tz=Asia/Shanghai / 时辰；真值行逐字含城市与坐标', async () => {
  const h = makeAssembler(SERVER);
  const res = await h.fn({ timeTruth: { a: YICHANG, b: BANGKOK } }, '1990-08-05', '1992-03-14');
  assert.equal(res.available, true);
  const a = h.calls.astro[0];
  assert.equal(a.bt, '14:30', 'A 侧时辰未进建盘');
  assert.equal(a.lat, 30.7, 'A 侧纬度未透传（静默回退曼谷 13.75）');
  assert.equal(a.lon, 111.3, 'A 侧经度未透传（静默回退曼谷 100.5）');
  assert.equal(a.tz, 'Asia/Shanghai', 'A 侧时区未透传（静默回退曼谷）');
  assert.equal(h.calls.astro[1].lat, 13.75);
  assert.equal(typeof res.birthTruthLine, 'string');
  assert.ok(res.birthTruthLine.includes('[BIRTH TIME-SPACE TRUTH A] date=1990-08-05 time=14:30 city=宜昌 tz=Asia/Shanghai lat=30.7 lon=111.3'), res.birthTruthLine.split('\n')[0]);
  assert.ok(res.birthTruthLine.includes('[BIRTH TIME-SPACE TRUTH B] date=1992-03-14 time=09:00 city=曼谷 tz=Asia/Bangkok lat=13.75 lon=100.5'), res.birthTruthLine.split('\n')[1]);
  assert.equal(res.birthTruthLine.includes('EXPLICIT DEGRADATION'), false, '全参齐备不得出现降级声明');
  assert.ok(res.birthTruthLine.includes('NEVER invent, rename, translate, or substitute a birthplace'), '真值行缺「禁止臆造/改名/翻译出生地」令');
  assert.equal(res.precision, 'timed', '双人完整时空未判为 timed');
});

test('E159-18 刀四 · 未填时辰显式降级：bt 仍为 undefined（绝不伪造精度），经纬度/时区照常透传', async () => {
  const h = makeAssembler(SERVER);
  const noTime = { tz: 'Asia/Shanghai', lat: 30.7, lon: 111.3, city: '宜昌' };
  const res = await h.fn({ timeTruth: { a: noTime, b: BANGKOK } }, '1990-08-05', '1992-03-14');
  assert.equal(res.available, true);
  const a = h.calls.astro[0];
  assert.equal(a.bt, undefined, '未填时辰仍把时间送进建盘');
  assert.equal(a.lat, 30.7); assert.equal(a.lon, 111.3); assert.equal(a.tz, 'Asia/Shanghai');
  assert.ok(res.birthTruthLine.includes('time=unknown city=宜昌 tz=Asia/Shanghai lat=30.7 lon=111.3 | EXPLICIT DEGRADATION: birth time missing => date_level'), res.birthTruthLine.split('\n')[0]);
  assert.equal(res.precision, 'date_level');
});

test('E159-19 刀四 · 时区/坐标缺省 ⇒ 显式声明「默认参考地」，绝不静默冒充出生地；时辰缺 ⇒ t1/t2 兜底', async () => {
  const h = makeAssembler(SERVER);
  // ① 时辰有、地点不可解析 ⇒ 沿既有建盘资格（时间 + 可定位时区）如实降级为 date_level，且不造坐标/时区
  const res = await h.fn({ timeTruth: { a: { birthTime: '14:30' }, b: BANGKOK }, t1: '08:15' }, '1990-08-05', '1992-03-14');
  assert.equal(res.available, true);
  const a = h.calls.astro[0];
  assert.equal(a.lat, undefined, '未给坐标却凭空造坐标');
  assert.equal(a.tz, undefined, '未给时区却凭空造时区');
  assert.equal(a.bt, undefined, '地点不可解析仍把时间送进建盘（伪造精度）');
  const lineA = res.birthTruthLine.split('\n')[0];
  assert.ok(lineA.includes('time zone not provided => default reference zone'), lineA);
  assert.ok(lineA.includes('coordinates not provided => default reference place (NOT the real birthplace)'), lineA);
  assert.ok(lineA.includes('birth place unresolvable => date_level'), lineA);
  assert.ok(lineA.includes('time=unknown'), lineA);
  assert.equal(/Bangkok|曼谷/.test(lineA), false, 'A 侧真值行把默认参考地冒充成出生地');
  assert.ok(lineA.includes('city=n/a'), '缺城市须如实 n/a，绝不伪造城市名');
  // ② 时辰兜底：timeTruth.a 无 birthTime ⇒ 取 body.t1（地点可解析 ⇒ timed）
  const h2 = makeAssembler(SERVER);
  const r2 = await h2.fn({ timeTruth: { a: { tz: 'Asia/Shanghai', lat: 30.7, lon: 111.3 }, b: BANGKOK }, t1: '08:15' }, '1990-08-05', '1992-03-14');
  assert.equal(h2.calls.astro[0].bt, '08:15', '时辰兜底 t1 未进建盘');
  assert.ok(r2.birthTruthLine.includes('time=08:15 city=n/a tz=Asia/Shanghai lat=30.7 lon=111.3'), '兜底时辰未如实入真值行');
  assert.equal(h2.calls.astro[0].lat, 30.7);
  assert.equal(r2.birthTruthLine.includes('EXPLICIT DEGRADATION'), false, '兜底后全参齐备不得声明降级');
});

test('E159-20 刀四 · 月报/年报 prompt 的 DATA LOCK 注入出生时空真值行（两处 lockLines；once 档不动）', () => {
  const TOTAL = "(syn && typeof syn.birthTruthLine === 'string') ? syn.birthTruthLine : ''";
  assert.equal(count(SERVER, TOTAL), 2, '月报/年报 DATA LOCK 真值行须恰两处');
  const yearly = extractFn(SERVER, 'buildCompatYearlyFiveChapterPrompt');
  const monthly = extractFn(SERVER, 'buildCompatMonthlyFourModulePrompt');
  const once = extractFn(SERVER, 'buildCompatibilityReportPrompt');
  assert.ok(yearly && monthly && once, 'prompt builder 抽取失败（函数锚点漂移？）');
  for (const [name, body] of [['yearly', yearly], ['monthly', monthly]]) {
    assert.equal(count(body, TOTAL), 1, `${name} prompt 须恰注入一处出生时空真值行`);
    const iP = body.indexOf('`Partners: ${d1} and ${d2}`');
    const iT = body.indexOf(TOTAL);
    assert.ok(iP !== -1 && iT > iP && iT - iP < 200, `${name} 真值行须紧随 Partners 行（DATA LOCK 同块）`);
  }
  assert.equal(count(once, 'birthTruthLine'), 0, 'once/免费档 prompt 不得越界注入（本轮不动镜像链）');
  assert.ok(APP.includes("city: e159CityName(c1, lang)"), '前端未上送出生城市名（洞察/月报年报两处）');
  assert.equal(count(APP, "city: e159CityName(c1, lang)"), 2, '城市名须两处上送');
  assert.ok(APP.includes("names[lang] || names.en"), '城市名须按报告语种本地名 ⇒ 英文名');
});

test('E159-21 既有契约零破坏：E157 合规护栏 / SwissEph 显式降级 / 称呼原样 / 泰语防溢出 逐字仍在', () => {
  // E157 合规护栏 / 称呼原样 / 泰语防溢出
  assert.ok(read('lib/resonance/resonancePrompt.mjs').includes('LEGAL_COMPLIANCE_GUARDRAILS'), 'E157 合规护栏常量缺失');
  assert.ok(APP.includes('data-testid="e157-disclaimer-input"'), 'E157 显性定位声明（输入页）缺失');
  assert.ok(SERVER.includes('buildSceneOverlay'), 'E157 四引擎注入缺失');
  assert.ok(read('lib/resonance/resonancePrompt.mjs').includes('washSceneReport'), 'E156 称呼原样锁（掩埋防误杀）缺失');
  assert.ok(APP_CSS.includes('html[lang="th"] .input-page .title { overflow-wrap: anywhere; }'), '泰语标题防溢出缺失');
  assert.ok(APP_CSS.includes('.ks-e158-bar[lang="th"], .ks-e158-bar[lang="th"] * { line-height: 1.55; overflow-wrap: anywhere; }'), '折叠栏泰语防溢出（1.55 + anywhere）缺失');
  // E158 归档旧键字面须保留（情爱镜像写；E158 闸门锚定 get/set 两行）
  assert.equal(count(APP, "sessionStorage.getItem('ks_e158_report_archive')"), 1);
  assert.equal(count(APP, "sessionStorage.setItem('ks_e158_report_archive', JSON.stringify(a));"), 1);
  // 封存守卫：E157/E158 闸门不得被改红（它们仍在链上；此处只验文件存在）
  assert.ok(exists('test/audit-e157-compliance-guardrails.test.mjs') && exists('test/audit-e158-visual-consistency.test.mjs'));
});

test('E159-22 【链位自保】闸门挂入 test:astro 且不顶飞收口位（插在 e158 之后、e40-compat 恒 len-2、python 恒链尾）', () => {
  const pkg = JSON.parse(read('package.json'));
  const segs = pkg.scripts['test:astro'].split(/\s*&&\s*|\s*\|\|\s*/).map((x) => x.trim()).filter(Boolean);
  const me = segs.findIndex((x) => x.includes('audit-e159-scene-isolation'));
  assert.ok(me !== -1, '未入编 test:astro');
  assert.equal(count(segs[me], 'node --test test/audit-e159-scene-isolation.test.mjs'), 1, 'e159 段须恰一处');
  assert.ok(segs.length >= 125, `链段数下界（实为 ${segs.length}）`);   // 🔴 后继化（E160 入编）：125→126
  const i158 = segs.findIndex((x) => x.includes('audit-e158-visual-consistency'));
  const iCap = segs.findIndex((x) => x.includes('audit-e40-compat-synastry-tensor-fusion'));
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.ok(i158 !== -1 && i158 < me && me < iCap, `e159 须居 e158 后、e40-compat 前（实为 ${i158}/${me}/${iCap}）`);
  assert.ok(/python3 scripts\/audit_v492_peak_window\.py$/.test(segs[segs.length - 1]), 'python3 须恒为链尾');
});
