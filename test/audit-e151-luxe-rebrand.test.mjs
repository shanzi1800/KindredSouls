/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🥂 E151 闸门：PC 端国际轻奢 UI 精修 × 品牌词库换血 × 信任合规护栏
 * ═══════════════════════════════════════════════════════════════════════════
 * 立项（主公军令 2026-11-24，合伙人品牌定位文档融合）：
 *   桌面端（≥1024px）五大视觉病灶精修＋全站入口文案换血为
 *   「何时何地，一见如故 / 个人幸福坐标」轻奢语系＋数据最小化护栏。
 *
 * 七路取证：
 *   A 六语品牌词库（新键值逐字＋旧占卜词清除＋引擎镜像同源＋i18n 基准 141）；
 *   B Hero 重影根治（landing 副标消费 input.subtitle 非 app.name）；
 *   C PC 轻奢 CSS（1024 块：CTA 香槟金／语言切换器归位／对话舱 clamp／
 *     泰语 overflow-wrap／罗盘 clamp——E77 朝向镜像＋E65 趴键零触碰）；
 *   D 罗盘 5 情绪零增删（枚举冻结）＋Milo 右锚/Sophia 左锚方向锁；
 *   E 合规护栏（隐私承诺组件＋一键清除两击形制＋sb- 认证不触碰；
 *     server 危机转介＋非投资建议＋老友语感字面验真）；
 *   F 零回归锚（E130 商业词红线／E149 闭环／E150 水合——抽锚不重测）；
 *   G 链位自保（e151 入编＋全链 119 段＋node-only 118）。
 *
 * 运行：node --test test/audit-e151-luxe-rebrand.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
const APP_SRC = read('web/src/App.tsx');
const CSS_SRC = read('web/src/App.css');
const SHEET_SRC = read('web/src/components/FamiliarChatSheet.tsx');
const COMPASS_SRC = read('web/src/components/companion/MoodCompassModal.tsx');
const PRIVACY_SRC = read('web/src/components/BirthPrivacyNote.tsx');
const WEALTH_SRC = read('web/src/pages/WealthPage.tsx');
const SERVER_SRC = read('server.js');
const WEALTH_ENG_SRC = read('web/src/lib/astroWealthAdvisoryEngine.mjs');
const WELLNESS_ENG_SRC = read('web/src/lib/astroSeasonalWellnessEngine.mjs');
const loc = (l) => JSON.parse(read(`web/src/i18n/locales/${l}.json`));

// ═══════════════ A. 六语品牌词库换血（刀二） ═══════════════

test('A1 六语新品牌核心词键完整非空（title/subtitle/start/privacyNote/clearData 三键）', () => {
  for (const l of LANGS) {
    const L = loc(l);
    const inp = L.input || {};
    for (const k of ['title', 'subtitle', 'start', 'privacyNote', 'clearDataBtn', 'clearDataConfirm']) {
      assert.ok(typeof inp[k] === 'string' && inp[k].trim().length > 0,
        `locales[${l}].input.${k} 缺失或空`);
    }
    assert.ok(typeof (L.familiar || {}).chatQ1 === 'string' && L.familiar.chatQ1.includes('💰'),
      `locales[${l}].familiar.chatQ1 缺失或失 💰 前缀`);
    assert.ok(typeof (L.familiar || {}).chatQ3 === 'string' && L.familiar.chatQ3.includes('🔮'),
      `locales[${l}].familiar.chatQ3 缺失或失 🔮 前缀`);
  }
});

test('A2 军令定稿表 zh 锚逐字（一见如故主标＋坐标副标＋CTA＋快捷词）', () => {
  const zh = loc('zh');
  assert.equal(zh.input.title, '何时何地，一见如故', 'Hero 主标须军令逐字');
  assert.equal(zh.input.subtitle, '用你的出生坐标，定位幸福的方位', 'Hero 副标须军令逐字');
  assert.equal(zh.input.start, '定位我的坐标', '主 CTA 须军令逐字');
  assert.equal(zh.familiar.chatQ1, '💰 今日财富节奏校准', '快捷词 1 须军令逐字');
  assert.equal(zh.familiar.chatQ3, '🔮 今日坐标与心境校准', '快捷词 2 须军令逐字');
  const en = loc('en');
  assert.equal(en.input.title, 'Born When. Born Where. Known Everywhere.', 'en Hero 主标须军令逐字');
  assert.equal(en.input.start, 'Locate My Coordinates', 'en CTA 须军令逐字');
});

test('A3 旧占卜词彻底清除（缘分天定/开始测算/破财避坑/输入双方生日，测算缘分指数）', () => {
  for (const l of LANGS) {
    const L = loc(l);
    const flat = JSON.stringify(L);
    assert.ok(!flat.includes('缘分天定'), `locales[${l}] 残留「缘分天定」`);
    assert.ok(!flat.includes('开始测算'), `locales[${l}] 残留「开始测算」`);
    assert.ok(!flat.includes('破财避坑'), `locales[${l}] 残留「破财避坑」`);
  }
  const zh = loc('zh');
  assert.ok(!zh.input.subtitle.includes('测算'), 'zh 副标不得残留「测算」占卜味');
  // 例外侦察：app.name 品牌名（zh 品牌锚沿袭）与报告内部词不在本刀口径
  assert.ok(SERVER_SRC.includes('『定位我的坐标』'), 'server 指路句须已换血');
  assert.ok(!SERVER_SRC.includes('『开始测算』'), 'server 指路句残留旧 CTA');
});

test('A4 引擎镜像同源（E139 Q1 / E137 Q3 触发锚与 locales 逐字）', () => {
  for (const l of LANGS) {
    const q1 = loc(l).familiar.chatQ1;
    assert.ok(WEALTH_ENG_SRC.includes(JSON.stringify(q1).slice(1, -1)),
      `E139 引擎缺 locales[${l}] chatQ1 逐字镜像`);
    const q3 = loc(l).familiar.chatQ3;
    assert.ok(WELLNESS_ENG_SRC.includes(JSON.stringify(q3).slice(1, -1)),
      `E137 引擎缺 locales[${l}] chatQ3 逐字镜像`);
  }
});

test('A5 i18n 基准 141（E151 合规三键入列）＋六语键集合全等', () => {
  const gateSrc = read('test/audit-i18n-keys.test.js');
  assert.ok(gateSrc.includes('assert.strictEqual(p.total, 142'), 'V448 基准未后继化 141');
  const base = Object.keys(flatten(loc('zh'))).sort().join(',');
  for (const l of LANGS.slice(1)) {
    assert.equal(Object.keys(flatten(loc(l))).sort().join(','), base,
      `locales[${l}] 键集合与 zh 不全等`);
  }
});

function flatten(o, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

// ═══════════════ B. Hero 重影根治（刀一 ①＋刀二 接线） ═══════════════

test('B1 落地页副标消费 input.subtitle（根治 title/app.name 同文叠排重影）', () => {
  const landing = APP_SRC.slice(APP_SRC.indexOf('landing-container'), APP_SRC.indexOf('<FamiliarHomeCard />'));
  assert.ok(landing.includes("{t('input.title')}"), '主标须 input.title');
  assert.ok(landing.includes("{t('input.subtitle')}"), '副标须 input.subtitle（重影根治位）');
  assert.ok(!landing.includes("{t('app.name')}"), '落地页副标禁再消费 app.name（重影回潮）');
});

// ═══════════════ C. PC 轻奢 CSS（≥1024px 块，刀一） ═══════════════

test('C1 1024 块在位＋关键钦定声明逐字（CTA/切换器/舱/胶囊/罗盘）', () => {
  const i = CSS_SRC.indexOf('@media (min-width: 1024px)');
  assert.ok(i > -1, '缺 1024px 轻奢断点块');
  const block = CSS_SRC.slice(i, i + 4200);
  // ② CTA 丝缎香槟金胶囊（🥂 E152-刀一 换血：缎面三段金渐变＋曜石黑字＋顶缘高光）
  assert.ok(/\.landing-start-btn\s*\{[^}]*min-width:\s*248px/.test(block), 'CTA 须 min-width 248px（E152）');
  assert.ok(/\.landing-start-btn\s*\{[^}]*padding:\s*14px 40px/.test(block), 'CTA 须 padding 14px 40px（E152）');
  assert.ok(/\.landing-start-btn\s*\{[^}]*linear-gradient\(135deg,\s*#F0D99C 0%,\s*#D9B45B 52%,\s*#C59B3E 100%\)/.test(block), 'CTA 须丝缎香槟金三段渐变（E152）');
  assert.ok(/\.landing-start-btn\s*\{[^}]*color:\s*#181324/.test(block), 'CTA 须深曜石黑字 #181324（E152）');
  assert.ok(/\.landing-start-btn\s*\{[^}]*inset 0 1px 0 rgba\(255,\s*251,\s*235,\s*0\.65\)/.test(block), 'CTA 须顶缘微高光（E152）');
  // ④ 语言切换器右上角安全区＋磨砂玻璃
  assert.ok(/\.lang-switch\s*\{[^}]*top:\s*24px[^}]*right:\s*28px/.test(block), '切换器须 top24/right28 归位');
  assert.ok(/\.lang-switch\s*\{[^}]*rgba\(15,\s*12,\s*24,\s*0\.58\)/.test(block), '切换器须暗夜磨砂底');
  // ⑤ 对话舱宽高（≥1024 块内覆盖 768 基线）
  assert.ok(/\.ks-chat-sheet\s*\{[^}]*width:\s*clamp\(400px,\s*30vw,\s*460px\)/.test(block), '舱宽须 clamp(400px,30vw,460px)');
  assert.ok(/\.ks-chat-sheet\s*\{[^}]*height:\s*min\(680px,\s*76vh\)/.test(block), '舱高须 min(680px,76vh)');
  assert.ok(/\.ks-chat-sheet\s*\{[^}]*rgba\(16,\s*13,\s*26,\s*0\.80\)/.test(block), '舱底须深空毛玻璃 0.80');
  // ⑥ 胶囊受控换行＋泰语防截断
  assert.ok(/\.ks-chat-pill\s*\{[^}]*overflow-wrap:\s*anywhere/.test(block), '胶囊须 overflow-wrap anywhere');
  // ① 主标衬线轻奢字距（🥂 E152-刀二：0.1em＋#FAF4E8＋clamp 放大＋暗影）
  assert.ok(/\.input-page \.title\s*\{[^}]*letter-spacing:\s*0\.1em/.test(block), '主标须字距 0.1em（E153）');
  assert.ok(/\.input-page \.title\s*\{[^}]*#FAF4E8/.test(block), '主标须象牙金白 #FAF4E8（E153）');
  assert.ok(/\.input-page \.title\s*\{[^}]*font-size:\s*clamp\(26px,\s*2\.2vw,\s*34px\)/.test(block), '主标须 clamp(26px,2.2vw,34px)（E153-刀一 分流）');
  assert.ok(/html\[lang="zh"\] \.input-page \.title\s*\{[^}]*font-size:\s*clamp\(30px,\s*2\.5vw,\s*38px\)/.test(block), 'zh 主标须 clamp(30px,2.5vw,38px)（E153-刀一 单行档）');
});

test('C2 768 基线零破坏（E135 477×638 仍在位＋E77 流内镜像零触碰）', () => {
  const i = CSS_SRC.indexOf('@media (min-width: 768px)');
  const block = CSS_SRC.slice(i, i + 2400);
  assert.ok(/\.ks-chat-sheet\s*\{[^}]*width:\s*477px[^}]*height:\s*638px/.test(block), '768 基线 477×638 被扰动');
  assert.ok(/\.ks-chat-layer\[data-familiar="sophia"\]\s*\{[^}]*justify-content:\s*flex-start/.test(block),
    'E77 Sophia 左锚镜像被扰动');
  const b1024 = CSS_SRC.slice(CSS_SRC.indexOf('@media (min-width: 1024px)'), CSS_SRC.indexOf('@media (min-width: 1024px)') + 4200);
  assert.ok(!/data-familiar/.test(b1024), '1024 块禁触碰朝向镜像定位');
  assert.ok(!/\.ks-chat-sheet\[[^{]*\{[^}]*\b(left|right):/.test(b1024), '1024 块禁给 sheet 加 left/right 绝对定位');
  // 移动端基座零扰动
  const baseSheet = (CSS_SRC.match(/\.ks-chat-sheet\s*\{([^}]*)\}/) || [])[1] || '';
  assert.ok(/width:\s*100%/.test(baseSheet), '移动端全宽抽屉被扰动');
});

test('C3 罗盘 PC 比例（组件自容 style：clamp 宽＋32/36 内边距＋5 卡热区）', () => {
  assert.ok(COMPASS_SRC.includes('ks-mood-card'), '罗盘卡缺 className 锚');
  assert.ok(COMPASS_SRC.includes('ks-mood-badge'), '情绪卡缺 className 锚');
  const styleWin = COMPASS_SRC.slice(COMPASS_SRC.indexOf('<style>'), COMPASS_SRC.indexOf('</style>'));
  assert.ok(styleWin.includes('@media (min-width: 1024px)'), '罗盘缺 1024 媒体查询');
  assert.ok(styleWin.includes('width: clamp(480px, 38vw, 560px) !important'), '罗盘宽须 clamp(480px,38vw,560px)');
  assert.ok(styleWin.includes('padding: 32px 36px !important'), '罗盘内边距须 32px 36px');
  assert.ok(styleWin.includes('.ks-mood-badge:hover'), '情绪卡须细金边 hover 微光');
  // 移动端基线 360px 仍在（内联）
  assert.ok(COMPASS_SRC.includes("width: '360px', maxWidth: 'calc(100vw - 32px)'"), '移动端 360px 基线被扰动');
});

// ═══════════════ D. 罗盘 5 情绪零增删＋方向锁（冻结铁律） ═══════════════

test('D1 罗盘五情绪枚举冻结（E149 军令：灿烂/想念/低落/焦躁/感恩零增删）', () => {
  const DATA = read('web/src/lib/companionMoodData.mjs');
  const m = DATA.match(/MOOD_ARCHETYPES\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/);
  assert.ok(m, '缺 MOOD_ARCHETYPES 枚举');
  const ids = (m[1].match(/archetype:\s*'(\w+)'/g) || []).map((s) => s.replace(/.*'(\w+)'/, '$1'));
  assert.equal(ids.length, 5, `情绪卡须恰 5 项（实得 ${ids.length}）`);
  assert.deepEqual([...ids].sort(), ['agitated', 'grateful', 'longing', 'melancholy', 'radiant'].sort(),
    '五原型键集漂移');
  const zhLabels = (m[1].match(/label:\s*\{\s*zh:\s*'([^']+)'/g) || []).map((s) => s.replace(/label:\s*\{\s*zh:\s*'([^']+)'/, '$1'));
  assert.deepEqual(zhLabels, ['灿烂', '想念', '低落', '焦躁', '感恩'], '五情绪 zh 词面漂移');
});

test('D2 Milo 右锚 / Sophia 左锚方向锁（ChatSheet data-familiar 唯一定位真源）', () => {
  assert.ok(SHEET_SRC.includes('data-familiar={ip === \'Milo\' ? \'milo\' : \'sophia\'}'),
    'data-familiar 唯一定位真源被扰动');
  assert.ok(CSS_SRC.includes('.ks-chat-layer[data-familiar="sophia"] { justify-content: flex-start'),
    'Sophia 左锚 CSS 被扰动');
});

// ═══════════════ E. 信任合规护栏（刀三） ═══════════════

test('E1 隐私承诺组件挂载双表单（App 姻缘双星卡＋WealthPage 财富生辰）', () => {
  assert.ok(exists('web/src/components/BirthPrivacyNote.tsx'), '缺隐私组件');
  assert.ok(APP_SRC.includes('<BirthPrivacyNote />'), '姻缘表单未挂隐私护栏');
  assert.ok(WEALTH_SRC.includes('<BirthPrivacyNote />'), '财富表单未挂隐私护栏');
});

test('E2 一键清除两击形制＋清除范围（ks_/soul_ 全族）＋sb- 认证豁免', () => {
  assert.ok(PRIVACY_SRC.includes('data-testid="birth-clear-data"'), '缺清除按钮锚');
  assert.ok(PRIVACY_SRC.includes('armed ? wipeLocalArchives() : setArmed(true)'), '须两击轻量确认形制');
  assert.ok(PRIVACY_SRC.includes("k.startsWith('ks_') || k.startsWith('soul_')"), '清除范围须 ks_/soul_ 前缀族');
  assert.ok(!/removeItem\('sb-/.test(PRIVACY_SRC) && !PRIVACY_SRC.includes("startsWith('sb-')"),
    '禁触碰 sb- 认证会话');
  assert.ok(PRIVACY_SRC.includes('window.location.reload()'), '清除后须 reload 回纯净态');
});

test('E3 server 护栏字面验真（危机转介＋非投资建议＋老友语感——恒注入 TONE_LAW）', () => {
  const win = SERVER_SRC.slice(SERVER_SRC.indexOf('const E149_TONE_LAW'), SERVER_SRC.indexOf('const e149ToneLaw'));
  assert.ok(win.includes('危机转介铁律'), '缺危机转介铁律');
  assert.ok(win.includes('专业心理援助'), '危机转介须指向专业援助');
  assert.ok(win.includes('非投资建议铁律'), '缺非投资建议铁律');
  assert.ok(win.includes('严禁推荐任何具体投资标的'), '非投资建议须禁标的/点位/收益');
  assert.ok(win.includes('老友语感'), '缺老友语感约束');
  assert.ok(win.includes('不评判、也不敷衍哄人'), '老友语感须军令词面');
});

// ═══════════════ F. 零回归锚（E130/E149/E150 抽锚） ═══════════════

test('F1 零回归抽锚（E130 红线／E149 闭环／E150 水合在位）', () => {
  assert.ok(SERVER_SRC.includes('【SUBTLE WHISPER（E130 军令'), 'E130 whisper 块漂移');
  assert.ok(SERVER_SRC.includes('const E149_TONE_LAW'), 'E149 语调铁律块漂移');
  assert.ok(SHEET_SRC.includes('readMoodOfDay(store)'), 'E150 当日情绪水合漂移');
  const TQ = read('web/src/lib/companionTopicQueue.mjs');
  assert.ok(TQ.includes('E150_P4_OPENERS') && TQ.includes('E150_P2_RECALL'), 'E150 队列字典漂移');
  const RA = read('web/src/lib/astralRhythmAction.mjs');
  assert.ok(RA.includes('L_CIRCADIAN_BANDS') && RA.includes('circadianBandOf'), 'E150 时段四档漂移');
});

// ═══════════════ G. 链位自保 ═══════════════

test('G1 链位：e151 居 e150 后 e40-compat 前＋全链 120 段＋node-only 119', () => {
  const pkg = JSON.parse(read('package.json'));
  const script = pkg.scripts['test:astro'];
  const all = script.split('&&').map((s) => s.trim());
  const segs = all.filter((s) => s.startsWith('node --test'));
  assert.equal(all.length, 121, `全链总段须 120（E152 插链后继化；实得 ${all.length}）`);
  assert.equal(segs.length, 120, `node --test 段须 119（E152 插链后继化；实得 ${segs.length}）`);
  assert.ok(all[all.length - 1].startsWith('python3 '), 'python3 恒链尾');
  const names = segs.map((s) => (s.match(/test\/([\w.-]+)\.test\.mjs/) || [])[1] || '');
  const i150 = names.indexOf('audit-e150-refresh-amnesia-gate');
  const i151 = names.indexOf('audit-e151-luxe-rebrand');
  const iE40 = names.findIndex((n) => n.startsWith('audit-e40-compat'));
  assert.ok(i150 > -1 && i151 > -1 && iE40 > -1, '三锚段须在链');
  assert.ok(i151 === i150 + 1, 'e151 须紧居 e150 后');
  assert.ok(i151 < iE40, 'e151 须在 e40-compat 前');
});
