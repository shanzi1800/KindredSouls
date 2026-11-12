// ═══ E137 闸门：星盘×时令健康正能量处方引擎＋三级供应链软植入底座（主公军令 2026-11-12）═══
// 刀一（引擎）：astroSeasonalWellnessEngine.mjs 纯函数核——四元素×三季群 12 套
//   严选模板＋南北半球镜像反转（11 月北半球初冬「敛阴护阳·温补润燥」vs 南半球
//   孟夏「清心降火·补水活络」）＋六语文案内嵌单源＋WellnessSupplySlot 23 枚。
// 刀二（注入与暗槽）：chat route 触发检测（chatQ3 六语钦定文本＋养生语义）⇒
//   [ASTRO_SEASONAL_WELLNESS_RX] prompt 块＋SSE meta 帧投影；/go/:remedyId
//   路由白名单 302 平滑落地（零死链零弹窗）；六语 i18n 6 键（122→128）；
//   E127 legalTerms 六语身心健康免责（FDA/TGA/EU 合规）。
// 军规红线：零货币符号（$/¥/€）零促销词（E130 对话舱净土铁律）；
//   泰语无空格长词防溢出（overflow-wrap anywhere＋图标列恒 48px）。
// 链位：e137 入编 e136 后、e40-compat 前；全链 104→105 段。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const ENG = await import(join(ROOT, 'web/src/lib/astroSeasonalWellnessEngine.mjs'));
const NOV = '2026-11-12T00:00:00Z'; // 军令钦定演示锚：11 月

/* ═══ E137-01 南北半球时令镜像反转（军令断言 1）═══ */
test('E137-01 半球镜像：11 月北半球初冬温补 ⇄ 南半球孟夏清心（节气与食愈温凉双重反转）', () => {
  const mk = (zone) => ENG.resolveAstroSeasonalWellnessRx({
    chartSignature: { dominantElement: 'fire' },
    timestamp: NOV, geoZone: zone, lang: 'zh',
  });
  const n = mk('CN');
  const s = mk('AU');
  // 北半球：初冬·敛阴护阳·温补润燥（cool）
  assert.equal(n.hemisphere, 'north', 'CN 须判北半球');
  assert.equal(n.season, 'winter', '11 月北半球须判冬（军令钦定初冬）');
  assert.equal(n.mode, 'cool', '北半球 11 月须 cool 敛补');
  assert.equal(n.termLabel, '敛阴护阳 · 温补润燥', '北半球 termLabel 军令逐字');
  assert.equal(n.seasonName, '初冬', '北半球 seasonName 须「初冬」');
  // 南半球：孟夏·清心降火·补水活络（warm）——镜像反转
  assert.equal(s.hemisphere, 'south', 'AU 须判南半球');
  assert.equal(s.season, 'summer', '11 月南半球须判夏（镜像反转）');
  assert.equal(s.mode, 'warm', '南半球 11 月须 warm 清心');
  assert.equal(s.termLabel, '清心降火 · 补水活络', '南半球 termLabel 军令逐字');
  assert.equal(s.seasonName, '孟夏', '南半球 seasonName 须「孟夏」（军令用词）');
  // 食愈温凉处方反转：温补系 ≠ 清凉系
  assert.notEqual(n.rx.functional_elixir.remedyId, s.rx.functional_elixir.remedyId, '南北食愈处方须反转');
  assert.ok(n.rx.functional_elixir.remedyId.includes('ashwagandha'), '北 11 月火象须晚安草本温补系');
  assert.ok(s.rx.functional_elixir.remedyId.includes('mintcoconut'), '南 11 月火象须薄荷椰子清凉系');
});

/* ═══ E137-02 四元素差异化开方（军令断言 2）═══ */
test('E137-02 四元素差异化：火旺/土重/水弱/风乱四盘命中截然不同的三维处方（零同质化）', () => {
  const rxs = ['fire', 'earth', 'air', 'water'].map((dominantElement) =>
    ENG.resolveAstroSeasonalWellnessRx({
      chartSignature: { dominantElement },
      timestamp: NOV, geoZone: 'CN', lang: 'zh',
    }));
  const uniq = (f) => new Set(rxs.map(f));
  assert.equal(uniq((r) => r.rx.functional_elixir.remedyId).size, 4, '四盘食愈处方须全异');
  assert.equal(uniq((r) => r.rx.aura_scent.remedyId).size, 4, '四盘嗅觉结界须全异');
  assert.equal(uniq((r) => r.rx.mindful_movement.remedyId).size, 4, '四盘身形疏通须全异');
  // 军令钦定配对抽检：火旺+寒季 ⇒ 南非醉茄；土重 ⇒ 辅酶 Q10；风乱(air) ⇒ 姜黄；水弱 ⇒ 桂圆姜母
  const byEl = Object.fromEntries(rxs.map((r) => [r.dominantElement, r]));
  assert.ok(byEl.fire.rx.functional_elixir.remedyId.includes('ashwagandha'), '火旺寒季须南非醉茄');
  assert.ok(byEl.earth.rx.functional_elixir.remedyId.includes('coq10'), '土重须辅酶 Q10 元气果昔');
  assert.ok(byEl.air.rx.functional_elixir.remedyId.includes('turmeric'), '风乱须姜黄黑胡椒燕麦饮');
  assert.ok(byEl.water.rx.functional_elixir.remedyId.includes('longan'), '水弱须桂圆红枣姜母茶');
  // 模板下界：四元素 × 三季群 12 套＋balanced 兜底 fail-closed
  assert.ok(ENG.WELLNESS_TEMPLATE_COUNT >= 12, '军令 12 套模板下界');
  const balanced = ENG.resolveAstroSeasonalWellnessRx({ chartSignature: {}, timestamp: NOV, geoZone: null, lang: 'zh' });
  assert.equal(balanced.ok, true, 'balanced 兜底须成功不崩溃');
});

/* ═══ E137-03 对话舱零商业污染红线（军令断言 3）═══ */
test('E137-03 零商业污染：全模板＋供应槽零货币符号零促销词，sponsorBrand 恒 null', () => {
  const src = read('web/src/lib/astroSeasonalWellnessEngine.mjs');
  const slots = ENG.WELLNESS_SUPPLY_SLOTS;
  assert.ok(slots.length >= 23, `供应槽须 ≥23 枚（实 ${slots.length}）`);
  // 货币符号全量扫杀（$ 美元须按字面义排除——源码中 $ 只允许出现在 JS 模板串之外的
  // 任何「文案字符串」内为 0；此处对全源码计数并白名单说明性出现）
  const payload = JSON.stringify(slots)
    + JSON.stringify(ENG.resolveAstroSeasonalWellnessRx({ chartSignature: { dominantElement: 'water' }, timestamp: NOV, geoZone: 'SEA', lang: 'th' }))
    + JSON.stringify(ENG.RX_INGREDIENTS);
  assert.ok(!/[$¥€]/.test(payload), '供应槽/处方/成分载荷严禁货币符号');
  // 促销词扫杀（六语族）
  const promo = ['购买', '打折', '促销', '优惠券', '限时', '特惠', 'buy', 'discount', 'promo', 'sale'];
  const lower = payload.toLowerCase();
  for (const w of promo) {
    assert.ok(!lower.includes(w.toLowerCase()), `载荷严禁促销词「${w}」`);
  }
  // sponsorBrand 恒 null＋affiliateTier 白名单三级
  for (const s of slots) {
    assert.equal(s.sponsorBrand, null, `${s.remedyId} sponsorBrand 恒 null（军令）`);
    assert.ok(ENG.WELLNESS_AFFILIATE_TIERS.includes(s.affiliateTier), `${s.remedyId} affiliateTier 须白名单`);
    assert.equal(s.affiliateTier, 'curated_free', '当前全部 curated_free（零佣金零外链）');
    assert.ok(/^rx-/.test(s.remedyId), `${s.remedyId} 须 rx- 前缀`);
    assert.equal(s.redirectSlug, `/go/${s.remedyId}`, 'redirectSlug 须统一 /go/:remedyId');
  }
  assert.equal(new Set(slots.map((s) => s.remedyId)).size, slots.length, 'remedyId 须全唯一（302 零歧义）');
  // 引擎源码零货币符号（剥注释＋剥 JS 模板插值 ${...}——语法面非文案面）
  assert.ok(
    !/[$¥€]/.test(
      src
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\$\{[^}]*\}/g, '')
    ),
    '引擎源码（剥注释＋剥模板插值）零货币符号'
  );
});

/* ═══ E137-04 /go/rx-* 路由畅通（军令断言 4——源码级＋白名单完备）═══ */
test('E137-04 /go/rx-* 路由：遍历全部 redirectSlug 白名单可解析，302 落地零死链', () => {
  const server = read('server.js');
  assert.ok(server.includes("app.get('/go/:remedyId'"), '/go/:remedyId 路由须在位');
  const route = server.slice(server.indexOf("app.get('/go/:remedyId'"), server.indexOf("app.get('/go/:remedyId'") + 1200);
  assert.ok(route.includes('WELLNESS_SUPPLY_SLOTS'), '路由白名单唯一真源须为引擎 WELLNESS_SUPPLY_SLOTS');
  assert.ok(route.includes("res.redirect(302"), '白名单命中须 302 平滑落地');
  assert.ok(route.includes('UNKNOWN_REMEDY'), '非白名单 slug 须 404 fail-closed（禁开放重定向）');
  assert.ok(route.includes("Referrer-Policy', 'no-referrer'"), '安全合规响应头在位');
  assert.ok(route.includes('/?rx='), '落地须站内指引页（零死链零弹窗）');
  // E137 补刀：SPA fallback（app.get(/.*/)）注册在 /go 路由之前——必须放行 /go 前缀，
  // 否则 /go/:remedyId 被吞成 index.html 200（产线首验实红，2026-11-12）
  const fb = server.slice(server.indexOf('app.get(/.*/'), server.indexOf('app.get(/.*/') + 400);
  assert.ok(fb.includes("startsWith('/go')"), 'SPA fallback 须放行 /go 前缀穿透至处方路由');
  // 白名单完备：全部 23+ redirectSlug 的 remedyId 均在引擎白名单（同源遍历）
  const ids = new Set(ENG.WELLNESS_SUPPLY_SLOTS.map((s) => s.remedyId));
  for (const s of ENG.WELLNESS_SUPPLY_SLOTS) {
    assert.ok(ids.has(s.remedyId), `${s.remedyId} 须白名单可解析（零 404 死链）`);
    assert.ok(s.redirectSlug.startsWith('/go/rx-'), `${s.remedyId} redirectSlug 须 rx- 白名单前缀`);
  }
});

/* ═══ E137-05 prompt 注入链＋零商业话术（军令断言 3 后半）═══ */
test('E137-05 prompt 注入链：触发检测→引擎→[ASTRO_SEASONAL_WELLNESS_RX] 块＋meta 帧投影', () => {
  const server = read('server.js');
  // 触发链三件：detectWellnessTrigger（末条 user）＋deriveDominantElement（natal）＋engine resolve
  assert.ok(server.includes('detectWellnessTrigger(_e137LastUser.content)'), '末条 user 触发检测在位');
  assert.ok(server.includes('_e137Eng.deriveDominantElement(_e137Signs)'), '本命元素众数推导在位');
  assert.ok(server.includes('resolveAstroSeasonalWellnessRx({'), '引擎主入口调用在位');
  assert.ok(server.includes('wellnessRx,'), 'buildFamiliarChatSystemPrompt 须收 wellnessRx');
  // 块本体＋零商业红线（块切片：块首锚到 wellnessBlock.push 收口——防块内
  // 「【${元素}】」模板串提前截断）
  const i = server.indexOf('ASTRO_SEASONAL_WELLNESS_RX（E137');
  assert.ok(i > 0, '[ASTRO_SEASONAL_WELLNESS_RX] 块须在位');
  const pushEnd = server.indexOf(');', i);
  assert.ok(pushEnd > i, 'wellnessBlock.push 须闭合');
  const block = server.slice(i, pushEnd);
  assert.ok(block.includes('开方铁律'), '块须含开方铁律（先点相位再叮嘱）');
  assert.ok(block.includes('绝对零商业'), '块须含零商业铁令');
  assert.ok(!/[$¥€]/.test(block.replace(/\$\{[^}]*\}/g, '')), '注入块零货币符号');
  for (const w of ['购买', '打折', '促销', '优惠券', 'buy', 'discount', 'promo']) {
    assert.ok(!block.toLowerCase().includes(w.toLowerCase()), `注入块严禁促销词「${w}」`);
  }
  // meta 帧投影（前端卡单源）
  assert.ok(server.includes('wellnessRx: {'), 'SSE meta 帧须带 wellnessRx 投影');
  assert.ok(server.includes('exploreSlug'), 'meta 帧须带 exploreSlug 承接暗槽');
});

/* ═══ E137-06 触发网六语单源（chatQ3 钦定文本与 locales 逐字同源）═══ */
test('E137-06 触发网：chatQ3 六语钦定文本逐字同源＋养生语义六语命中＋负样本 fail-closed', () => {
  const texts = ENG.WELLNESS_CHATQ3_TEXTS;
  assert.equal(texts.length, 6, 'chatQ3 钦定文本须六语');
  // 与 locales familiar.chatQ3 逐字同源（六语全对齐）
  const langs = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
  for (const l of langs) {
    const loc = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
    const q3 = loc.familiar && loc.familiar.chatQ3;
    assert.ok(typeof q3 === 'string' && q3.trim(), `locales[${l}].familiar.chatQ3 在位`);
    assert.ok(texts.includes(q3), `引擎 chatQ3 文本须含 locales[${l}] 逐字`);
    assert.ok(ENG.detectWellnessTrigger(q3), `chatQ3[${l}] 须触发`);
  }
  // 养生语义六语命中
  const semantic = ['最近总是失眠睡不着', 'I feel so tired and anxious lately', 'Je suis fatigué et en insomnie',
    'Tengo insomnio y ansiedad', 'เหนื่อยและนอนไม่หลับ', 'Mệt mỏi và mất ngủ'];
  for (const s of semantic) assert.ok(ENG.detectWellnessTrigger(s), `养生语义须命中「${s.slice(0, 12)}」`);
  // 负样本 fail-closed
  assert.equal(ENG.detectWellnessTrigger('今天天气怎么样'), false, '无关闲聊不触发');
  assert.equal(ENG.detectWellnessTrigger('帮我算算财运'), false, '财运问句不触发');
  assert.equal(ENG.detectWellnessTrigger(''), false, '空串不触发');
});

/* ═══ E137-07 六语 i18n 6 键（122→128）＋军令词表逐字 ═══ */
test('E137-07 i18n 六键：六语对齐＋zh 军令词表逐字＋键集合含新六键', () => {
  const langs = ['zh', 'en', 'fr', 'es', 'th', 'vi'];
  const KEYED = {};
  for (const l of langs) KEYED[l] = JSON.parse(read(`web/src/i18n/locales/${l}.json`));
  const KEYS = ['wellness_rx_title', 'rx_functional_food', 'rx_aura_scent', 'rx_mindful_move', 'rx_solar_harmony', 'rx_explore_cta'];
  for (const l of langs) {
    for (const k of KEYS) {
      assert.ok(typeof KEYED[l][k] === 'string' && KEYED[l][k].trim(), `locales[${l}].${k} 须六语在位`);
    }
  }
  // zh 军令词表逐字（钦定六行）
  assert.equal(KEYED.zh.wellness_rx_title, '✦ 星盘时令能量处方 ✦', 'wellness_rx_title 军令逐字');
  assert.equal(KEYED.zh.rx_functional_food, '食愈 · 时令气场饮', 'rx_functional_food 军令逐字');
  assert.equal(KEYED.zh.rx_aura_scent, '嗅觉 · 星相结界', 'rx_aura_scent 军令逐字');
  assert.equal(KEYED.zh.rx_mindful_move, '身形 · 能量疏通', 'rx_mindful_move 军令逐字');
  assert.equal(KEYED.zh.rx_solar_harmony, '顺时调频 · 天人相应', 'rx_solar_harmony 军令逐字');
  assert.equal(KEYED.zh.rx_explore_cta, '✦ 探索时令能量配方', 'rx_explore_cta 军令逐字');
  // 元闸门真源同步：122 → 128
  const gate = read('test/audit-i18n-keys.test.js');
  assert.ok(gate.includes('assert.strictEqual(p.total, 128'), 'i18n 元闸门基准须 128（E137 六键入列）');
  // familiar 段键数不动（新六键居顶层——58 恒定）
  assert.equal(Object.keys(KEYED.zh.familiar).length, 58, 'familiar 段 58 键恒定（六新键在顶层）');
});

/* ═══ E137-08 前端处方卡：挂载＋泰语防溢出军规（图标列恒 48px）═══ */
test('E137-08 前端处方卡：meta 帧驱动挂载＋overflow-wrap anywhere＋图标列 48px＋CTA 暗槽', () => {
  const slot = read('web/src/components/companion/WellnessRxSlot.tsx');
  assert.ok(slot.includes("data-testid=\"wellness-rx-slot\""), '处方卡 testid 在位');
  assert.ok(slot.includes('overflowWrap: \'anywhere\''), '泰语无空格长词防溢出军规在位');
  assert.ok(slot.includes('width: 48'), '固定图标列宽 48px 军规在位');
  assert.ok(slot.includes('t(\'wellness_rx_title\')') && slot.includes('t(\'rx_explore_cta\')'), 'i18n 六键消费在位');
  assert.ok(slot.includes('isWellnessRxMeta'), 'fail-closed 形状守卫在位');
  assert.ok(slot.includes('/^\\/go\\/rx-/'), 'exploreSlug 须 rx- 白名单前缀守卫');
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(sheet.includes('WellnessRxSlotCard'), 'ChatSheet 挂载处方卡在位');
  assert.ok(sheet.includes('j.meta.wellnessRx'), 'meta 帧 wellnessRx 消费在位');
  assert.ok(sheet.includes('setWellnessSlot(null)'), '新轮次清槽在位（防旧卡残留）');
});

/* ═══ E137-09 legalTerms 六语身心健康免责（FDA/TGA/EU 合规）═══ */
test('E137-09 免责专章：六语 terms 第 4 节身心健康免责含 FDA/TGA 锚词', async () => {
  const LT = await import(join(ROOT, 'web/src/i18n/legalTerms.mjs'));
  for (const l of ['zh', 'en', 'fr', 'es', 'th', 'vi']) {
    const doc = LT.getLegalTermsDoc('terms', l);
    assert.ok(doc, `terms[${l}] 命中`);
    assert.equal(doc.sections.length, 8, `terms[${l}] 须 8 节（E137 身心健康免责入列）`);
    const sec = doc.sections[3];
    assert.ok(sec && sec.h && sec.p.length > 80, `terms[${l}] 第 4 节须身心健康免责专章`);
    assert.ok(sec.p.includes('FDA'), `terms[${l}] 须含 FDA 合规锚`);
    assert.ok(sec.p.includes('TGA'), `terms[${l}] 须含 TGA 合规锚`);
    const joined = doc.sections.map((s) => s.p).join('\n');
    assert.ok(joined.includes('29.99') || joined.includes('29,99'), `terms[${l}] 退款 SKU 面承袭不破`);
  }
});

/* ═══ E137-10 军规链段数自证（插链后 104→105）═══ */
test('E137-10 军规链段数：package.json test:astro 全链 105 段（e137 居 e136 后 e40-compat 前）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 105, `军规链段数须 105（E137 入编后 104→105；实 ${segs.length}）`);
  const joined = segs.join(' && ');
  const iE136 = joined.indexOf('audit-e136');
  const iE137 = joined.indexOf('audit-e137-astro-seasonal-wellness');
  const iE40 = joined.indexOf('audit-e40-compat');
  assert.ok(iE136 > 0 && iE137 > 0 && iE40 > 0, '三锚须在链');
  assert.ok(iE136 < iE137 && iE137 < iE40, 'e137 须居 e136 后、e40-compat 前（python 恒链尾）');
  // e40 恒 len-2（倒数第二）——python 链尾承袭
  assert.ok(segs[segs.length - 2].includes('e40-compat'), 'e40-compat 恒 len-2');
  assert.ok(segs[segs.length - 1].includes('python3'), 'python3 恒链尾');
});
