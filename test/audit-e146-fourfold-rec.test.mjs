// ═══ E146 闸门：FOUR-FOLD-REC（四维校准军令 2026-11-19 全守备）═══
// 军令：吃喝与穿搭推荐严格按 ①即时时令季节 → ②用户真实星盘 → ③当下情绪/
// 场景 → ④时段 四维顺位生成；克制触发（默认不输出）；单次聚焦（吃喝或
// 穿搭二选一）；吃喝矩阵（时令寒热燥湿×星盘五行×时段情绪＋换饮理由）；
// 穿搭矩阵（日主锚定×场景版型微调＋解释）；60–80 字双段留白语感。
//   锁1 军令词条六语逐字（四维顺时校准/时令节气底色/饮膳暖润调理/气场穿搭微调）；
//   锁2 四维解析（时令二档 fail-closed＋星盘四档＋时段四档军令边界＋聚焦映射）；
//   锁3 真值合成（resolveFourFoldTruth：北/南半球镜像季节＋natal 五星元素众数＋月亮单元素）；
//   锁4 触发形态（food 聚焦四维行＋换饮理由；outfit 聚焦锚定同源＋场景版型律＋品牌红线）；
//   锁5 静默形态（默认零推荐纯克制铁令——未触发零真值注入）；
//   锁6 六语完整性＋泰/越长文本行宽防溢出（行长 sanity 上限）；
//   锁7 server 挂载（三挂＋E145-刀二让位守卫）＋链位（114 段＋node-only 113＋e146 紧居 e145 后）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const FF = await import(join(ROOT, 'web/src/lib/astralFourFoldRecEngine.mjs'));
const SR = await import(join(ROOT, 'web/src/lib/astralSmartRecEngine.mjs'));

const SERVER = read('server.js');
const PKG = JSON.parse(read('package.json'));
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

/* ═══ 锁1：军令词条六语逐字 ═══ */

test('E146-锁1 军令词条：四维对照表六语逐字（title/seasonal/nourish/aura）', () => {
  const cases = [
    ['title', '四维顺时校准', 'Four-Fold Astral Alignment', 'Alignement Quadruple', 'Alineación Cuádruple', 'ปรับสมดุลสี่มิติ', 'Căn Chỉnh Tứ Chiều'],
    ['seasonal', '时令节气底色', 'Seasonal & Solar Tone', 'Ton Saisonnier', 'Tono Estacional', 'โทนตามฤดูกาลและราศี', 'Sắc Thái Theo Mùa'],
    ['nourish', '饮膳暖润调理', 'Nourishment & Warmth', 'Infusion & Réconfort', 'Nutrición y Calidez', 'การกินและการดื่มประคองใจ', 'Ẩm Thực & Thức Uống An Hòa'],
    ['aura', '气场穿搭微调', 'Aura Styling Tuning', 'Ajustement d’Aura', 'Ajuste de Aura', 'ปรับสไตล์ตามวาระ', 'Điều Chỉnh Phối Đồ Theo Bối Cảnh'],
  ];
  for (const [key, ...words] of cases) {
    const row = FF.L_FOURFOLD_TERMS[key];
    LANGS.forEach((l, i) => {
      assert.equal(row[l], words[i], `${key}/${l} 须军令逐字「${words[i]}」`);
    });
  }
});

/* ═══ 锁2：四维解析 ═══ */

test('E146-锁2a 时令调质（cool⇒moisten 润燥暖身；mild/warm⇒clear 清润理气；非法 null）', () => {
  assert.equal(FF.seasonalToneOf('cool'), 'moisten', '秋冬 cool ⇒ 润燥暖身');
  assert.equal(FF.seasonalToneOf('mild'), 'clear', 'mild ⇒ 清润理气');
  assert.equal(FF.seasonalToneOf('warm'), 'clear', '春夏 warm ⇒ 清润理气');
  assert.equal(FF.seasonalToneOf(''), null, '空 ⇒ null fail-closed');
  assert.equal(FF.seasonalToneOf(null), null, 'null ⇒ null fail-closed');
  assert.equal(FF.seasonalToneOf('fog'), null, '非法 mode ⇒ null fail-closed');
});

test('E146-锁2b 星盘调质（fire 降火/water 温润/月亮水土安神优先/其余 steady）', () => {
  assert.equal(FF.natalToneOf('fire', null), 'cooling', '火旺 ⇒ cooling 降火');
  assert.equal(FF.natalToneOf('water', null), 'warming', '水土寒凉 ⇒ warming 温润');
  assert.equal(FF.natalToneOf('water', 'water'), 'soothing', '月亮水象 ⇒ soothing 安神（优先级高）');
  assert.equal(FF.natalToneOf('fire', 'earth'), 'soothing', '月亮土象 ⇒ soothing 安神（优先级高）');
  assert.equal(FF.natalToneOf('earth', null), 'steady', '土 ⇒ steady 平和');
  assert.equal(FF.natalToneOf('air', null), 'steady', '风 ⇒ steady 平和');
  assert.equal(FF.natalToneOf('balanced', null), 'steady', 'balanced ⇒ steady');
  assert.equal(FF.natalToneOf(null, null), 'steady', '坏形状 ⇒ steady fail-closed');
});

test('E146-锁2c 时段四档（军令边界 06-10:59/11-16:59/17-23:59/00-05:59＋非法兜底）', () => {
  assert.equal(FF.fourFoldSlotOf(6), 'morning', '06 ⇒ 晨间');
  assert.equal(FF.fourFoldSlotOf(10), 'morning', '10 ⇒ 晨间');
  assert.equal(FF.fourFoldSlotOf(11), 'afternoon', '11 ⇒ 午后');
  assert.equal(FF.fourFoldSlotOf(16), 'afternoon', '16 ⇒ 午后');
  assert.equal(FF.fourFoldSlotOf(17), 'duskNight', '17 ⇒ 傍晚夜间');
  assert.equal(FF.fourFoldSlotOf(23), 'duskNight', '23 ⇒ 傍晚夜间');
  assert.equal(FF.fourFoldSlotOf(0), 'lateNight', '00 ⇒ 深夜');
  assert.equal(FF.fourFoldSlotOf(5), 'lateNight', '05 ⇒ 深夜');
  assert.equal(FF.fourFoldSlotOf('x'), 'duskNight', '非法 ⇒ duskNight fail-closed 兜底');
  assert.equal(FF.fourFoldSlotOf(NaN), 'duskNight', 'NaN ⇒ fail-closed');
});

test('E146-锁2d 单次聚焦映射（intent 显式→场景/情绪映射→日首；未触发 null）', () => {
  assert.equal(FF.resolveRecFocus('outfit', false), 'outfit', '穿搭意图 ⇒ outfit');
  assert.equal(FF.resolveRecFocus('food', false), 'food', '吃喝意图 ⇒ food');
  assert.equal(FF.resolveRecFocus('social', false), 'outfit', '社交约见 ⇒ outfit（穿搭先行）');
  assert.equal(FF.resolveRecFocus('mood', false), 'food', '情绪波动 ⇒ food（温润抚慰）');
  assert.equal(FF.resolveRecFocus(null, true), 'food', '日首破冰 ⇒ food（温润开嗓）');
  assert.equal(FF.resolveRecFocus(null, false), null, '未触发 ⇒ null 静默');
  assert.equal(FF.resolveRecFocus('', false), null, '空意图 ⇒ null');
});

test('E146-锁2e 意图网单一真源（re-export E145 detectSmartRecIntent 同行为）', () => {
  assert.equal(FF.detectFourFoldIntent('今天穿什么好', 'zh'), 'outfit', 'zh 穿搭 ⇒ outfit');
  assert.equal(FF.detectFourFoldIntent('中午吃什么', 'zh'), 'food', 'zh 吃喝 ⇒ food');
  assert.equal(FF.detectFourFoldIntent('今天天气不错', 'zh'), null, '寒暄 ⇒ null（宁窄勿宽）');
  assert.equal(FF.detectFourFoldIntent(null, 'zh'), null, 'null 零抛错');
  // 同源一致性：E145 真源同输入同输出
  assert.equal(FF.detectFourFoldIntent('約了客戶談合作', 'zh'), SR.detectSmartRecIntent('約了客戶談合作', 'zh'), '须与 E145 意图网同源');
});

/* ═══ 锁3：真值合成 ═══ */

test('E146-锁3 真值合成（北半球冬 cool/南半球 AU 镜像＋natal 元素众数＋月亮单元素）', () => {
  // 北半球 2026-01（冬）⇒ cool
  const north = FF.resolveFourFoldTruth({ timestamp: Date.parse('2026-01-15T12:00:00Z'), geoZone: null, natalSigns: ['Aries', 'Leo', 'Sagittarius', 'Taurus', 'Cancer'], moonSign: 'Cancer' });
  assert.equal(north.seasonMode, 'cool', '北半球 1 月 ⇒ cool');
  assert.equal(north.natalElement, 'fire', '火三星 ⇒ fire 众数');
  assert.equal(north.moonElement, 'water', '月亮 Cancer ⇒ water');
  // 南半球 AU 同刻镜像（夏）⇒ warm
  const south = FF.resolveFourFoldTruth({ timestamp: Date.parse('2026-01-15T12:00:00Z'), geoZone: 'AU', natalSigns: [], moonSign: null });
  assert.equal(south.seasonMode, 'warm', '南半球 1 月 ⇒ warm 镜像');
  assert.equal(south.natalElement, 'balanced', '空盘 ⇒ balanced 兜底');
  assert.equal(south.moonElement, null, '无月亮 ⇒ null');
  // 坏形状零抛错
  const bad = FF.resolveFourFoldTruth(null);
  assert.ok(bad && typeof bad.seasonMode === 'string', 'null 入参 ⇒ 兜底真值零抛错');
});

/* ═══ 锁4：触发形态（双聚焦分野）═══ */

test('E146-锁4a 触发形态 food 聚焦（四维真值行＋换饮理由＋单次聚焦铁律）', () => {
  const blk = FF.buildFourFoldPromptBlock('zh', {
    dateISO: '2026-11-19', hour: 15, intent: 'food', dayFirst: false,
    seasonMode: 'cool', natalElement: 'fire', moonElement: null,
  });
  assert.ok(blk.includes('E146 四维顺时校准'), 'head 军令词条在');
  assert.ok(blk.includes('单次聚焦'), '单次聚焦铁律在');
  assert.ok(blk.includes('本轮锁定：饮膳暖润调理'), '本轮锁定吃喝一项');
  assert.ok(blk.includes('时令节气底色【敛阴护阳'), '① 时令行（cool ⇒ 润燥暖身）');
  assert.ok(blk.includes('星盘能量调质【火象偏旺】'), '② 星盘行（fire ⇒ 降火）');
  assert.ok(blk.includes('时段侧重【午后 11:00–16:59】'), '④ 时段行（军令四档边界）');
  assert.ok(blk.includes('更换饮品或汤水时，须结合当下时段或主人状态给出一句自然理由'), '换饮自然理由律');
  assert.ok(!blk.includes('当日穿搭主锚定'), 'food 聚焦 ⇒ 严禁穿搭锚定真值（单次聚焦）');
  assert.ok(blk.includes('60–80 字'), '60–80 字双段留白语感律');
});

test('E146-锁4b 触发形态 outfit 聚焦（锚定同源嵌入＋场景版型律＋品牌红线＋聚焦互斥）', () => {
  const blk = FF.buildFourFoldPromptBlock('zh', {
    dateISO: '2026-11-19', hour: 9, intent: 'social', dayFirst: false,
    seasonMode: 'cool', natalElement: 'water', moonElement: null,
  });
  assert.ok(blk.includes('本轮锁定：气场穿搭微调'), 'social ⇒ 本轮锁定穿搭（场景映射）');
  // 锚定句同源（E145 outfitDayAnchorLine 单一真源）
  assert.ok(blk.includes(SR.outfitDayAnchorLine('2026-11-19', 'zh')), '锚定句须与 E145 同源嵌入');
  assert.ok(blk.includes('气场穿搭微调（场景版型律）'), '场景版型微调律在');
  assert.ok(blk.includes('居家独处/见客户商务/约会小聚/情绪波动'), '军令四场景在');
  assert.ok(blk.includes('保留当日主色系与材质底色，仅微调版型剪裁或外层层次'), '日主锚定恒定＋版型微调');
  assert.ok(blk.includes('用一句自然的话说明缘由'), '场景切换解释律');
  assert.ok(blk.includes('严禁任何商业品牌名称'), '品牌红线（E142.1 挂钩）');
  assert.ok(!blk.includes('更换饮品或汤水时'), 'outfit 聚焦 ⇒ 严禁吃喝矩阵行（单次聚焦互斥）');
  assert.ok(blk.includes('时段侧重【晨间 06:00–10:59】'), 'hour=9 ⇒ 晨间侧重');
});

/* ═══ 锁5：静默形态 ═══ */

test('E146-锁5 静默形态（未触发 ⇒ 纯克制铁令零真值零推荐）', () => {
  const blk = FF.buildFourFoldPromptBlock('zh', {
    dateISO: '2026-11-19', hour: 15, intent: null, dayFirst: false,
    seasonMode: 'cool', natalElement: 'fire', moonElement: null,
  });
  assert.ok(blk.includes('克制铁令'), '静默 ⇒ 克制铁令在');
  assert.ok(blk.includes('默认不输出'), '默认零推荐语义');
  assert.ok(!blk.includes('时令节气底色【'), '静默 ⇒ 严禁时令真值');
  assert.ok(!blk.includes('星盘能量调质【'), '静默 ⇒ 严禁星盘真值');
  assert.ok(!blk.includes('时段侧重【'), '静默 ⇒ 严禁时段真值');
  assert.ok(!blk.includes('当日穿搭主锚定'), '静默 ⇒ 严禁穿搭锚定');
  assert.ok(!blk.includes('本轮锁定'), '静默 ⇒ 严禁聚焦锁');
  // dayFirst 破冰 ⇒ 触发形态（军令触发面①）
  const first = FF.buildFourFoldPromptBlock('zh', { intent: null, dayFirst: true, seasonMode: 'cool', natalElement: 'balanced', moonElement: null, hour: 8 });
  assert.ok(first.includes('本轮锁定：饮膳暖润调理'), '日首破冰 ⇒ food 聚焦触发');
});

/* ═══ 锁6：六语完整性＋泰/越长文本行宽防溢出 ═══ */

test('E146-锁6 六语块完整性＋长文本行宽 sanity（泰/越防溢出）', () => {
  for (const l of LANGS) {
    const blk = FF.buildFourFoldPromptBlock(l, {
      dateISO: '2026-11-19', hour: 15, intent: 'food', dayFirst: false,
      seasonMode: 'cool', natalElement: 'fire', moonElement: null,
    });
    assert.ok(blk.length > 200, `${l} 触发形态块须完整（>200 chars）`);
    assert.ok(blk.toLowerCase().includes(FF.L_FOURFOLD_TERMS.title[l].toLowerCase()), `${l} head 军令词条`);
    // 四维行齐备（时令/星盘/时段三真值行）
    assert.ok(blk.includes('①') || blk.includes('①'), `${l} ① 时令行在`);
    assert.ok(blk.includes('②'), `${l} ② 星盘行在`);
    assert.ok(blk.includes('④'), `${l} ④ 时段行在`);
    // 行宽 sanity：单行 ≤ 400 字符（泰/越长组合文本不挤一行溢出）
    for (const line of blk.split('\n')) {
      assert.ok(line.length <= 400, `${l} 行宽 sanity（实际 ${line.length}）`);
    }
    // 静默形态六语同样齐备
    const silent = FF.buildFourFoldPromptBlock(l, { intent: null, dayFirst: false });
    assert.ok(silent.length > 80 && silent.length < 700, `${l} 静默块长度 sanity`);
  }
});

/* ═══ 锁7：server 挂载＋链位 ═══ */

test('E146-锁7 server 挂载（三挂＋E145-刀二让位守卫）＋链位（114 段＋node-only 113）', () => {
  // 模块缓存＋路由加载＋IIFE 消费三挂
  assert.ok(SERVER.includes('_e146FourFoldCore'), 'server 须挂 fourFold 模块缓存');
  assert.ok(SERVER.includes('const _e146FourFold = await _e146FourFoldCore()'), '路由须加载核');
  assert.ok(SERVER.includes('buildFourFoldPromptBlock'), 'server 须消费四维纪律块');
  assert.ok(SERVER.includes('resolveFourFoldTruth'), 'server 须消费四维真值合成');
  // E145-刀二让位守卫（E146 在座 ⇒ E145 块跳过防双块真值重复）
  assert.ok(SERVER.includes('if (_e146FourFold) return \'\';'), 'E145 smart-rec 块须有 E146 让位守卫');
  // 四维真源接线：natal 五星＋geoZone＋E142 客户端时钟
  assert.ok(SERVER.includes('moonSign: (truth.natal && truth.natal.moon && truth.natal.moon.sign)'), '星盘月亮真源接线');
  assert.ok(SERVER.includes('geoZone: geoZone || null'), '南北半球 geoZone 接线');
  // 链位：114 段＋node-only 113＋e146 紧居 e145 后＋e40 恒 node 尾＋python 恒总链尾
  const script = String(PKG.scripts['test:astro'] || '');
  const chain = script.split('&&').map((s) => s.trim()).filter(Boolean);
  const segs = chain.map((s) => (s.match(/audit-[a-z0-9-]+\.(?:test\.)?(?:mjs|js)/g) || []).pop()).filter(Boolean);
  const i145 = segs.indexOf('audit-e145-astral-suite.test.mjs');
  const i146 = segs.indexOf('audit-e146-fourfold-rec.test.mjs');
  const i40 = segs.indexOf('audit-e40-compat-synastry-tensor-fusion.test.mjs');
  assert.ok(i145 > 0, 'e145 段须在链');
  assert.ok(i146 === i145 + 1, 'e146 须紧居 e145 之后（版本序铁律）');
  assert.ok(i40 > i146, 'e40-compat 须恒居 node 链尾');
  assert.equal(chain.length, 124, `链总段必须为 115（实际 ${chain.length}）`);   // 🔴 后继化（E158 入编）：123→124
  const nodeOnly = chain.filter((s) => !/python/.test(s));
  assert.equal(nodeOnly.length, 123, `node-only 段必须为 114（实际 ${nodeOnly.length}）`);   // 🔴 后继化（E158 入编）：122→123
  assert.ok(/python/.test(chain[chain.length - 1]), 'python 段须恒为总链尾');
  assert.equal(i40, segs.length - 1, 'e40 须恒 node 链尾');
});
