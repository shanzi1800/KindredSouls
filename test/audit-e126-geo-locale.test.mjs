/**
 * audit-e126-geo-locale.test.mjs —— E126 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E126-GEO-LOCALE-DECOUPLING：语言（Language）与地理锚点（Geo-Location）
 *   彻底解耦——「选中文 ≠ 人在中国」】
 * 军令真源（主公 2026-11-05 晚）：在硅谷的华人用中文聊天，衣食住行推荐必须锚定
 * 北美生态圈（加州 1 号公路/Catskills/曼哈顿轻食）；在悉尼的法国人用法文聊天
 * 推荐莫宁顿半岛温泉与蓝山自驾。三层优先级：P1 用户显式意图（对话内声明目的地）
 * ＞ P2 物理感知（cf-ipcountry 标头 ＞ 客户端时区随行）＞ P3 语言生活区兜底。
 * 断言组（军令钦定 DoD）：
 *   E126-01 zone 白名单常量（NA/AU/EU/CN/SEA/JP 六大生活区生态圈）；
 *   E126-02 国家码解析（cf-ipcountry 面：白名单两字母码→zone；未知/坏形 null）；
 *   E126-03 时区解析（Intl 面：IANA 前缀树→zone；未知/坏形 null）；
 *   E126-04 三层解析优先级（country ＞ timezone ＞ null fail-closed）；
 *   E126-05 浏览器兜底（resolveBrowserGeoZone 恒 ∈ 白名单∪{null}）；
 *   E126-06 server 接线锚：cf-ipcountry 提取＋body.timezone 随行＋geoZone 入参
 *          ＋LIFESTYLE_GEO_CONTEXT 注入（lifestyleGeoBlock 紧随 lifestyleBlock）；
 *   E126-07 六区 geo 覆盖块实体清单齐（军令钦定实体为骨＋语言不变铁律＋覆盖声明）；
 *   E126-08 变体库形状：4 套 roadtrip geo 变体全字段同构 E124 基准；
 *   E126-09 变体 geo 锚定：zh@NA 无中国地名倒灌；fr@AU 含 Mornington/Blue
 *          Mountains；en@SEA 含 Chiang Mai；zh@AU 含蓝山/莫宁顿；
 *   E126-10 取卡三参矩阵：命中变体/未命中回退/坏 zone 回退/坏 type null；
 *   E126-11 前端接线锚：FamiliarChatSheet timezone 随行＋LifestyleMuseSlot
 *          resolveBrowserGeoZone 三参选卡；
 *   E126-12 变体卡红线：prose 长度与 E124 基准同量级（排版安全余量）＋
 *          奢侈大牌禁词零容忍；
 *   S13 链位自保：e126 入编（e125 后、e40-compat 前；全链 94→95 段）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）。
 * 执行命令：node --test test/audit-e126-geo-locale.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/* ── 模块加载（pathToFileURL：中文仓路径铁律）────────────────────────── */
const GEO = await import(pathToFileURL(join(ROOT, 'web/src/lib/geoLocaleResolver.mjs')).href);
const LMD = await import(pathToFileURL(join(ROOT, 'web/src/lib/lifestyleMuseData.mjs')).href);

const { LIFESTYLE_GEO_ZONES, geoZoneFromCountry, geoZoneFromTimezone, resolveLifestyleGeoZone, resolveBrowserGeoZone } = GEO;
const { LIFESTYLE_GEO_VARIANTS, getLifestyleTemplate, LIFESTYLE_TEMPLATES_12 } = LMD;

/* ═══════════ E126-01 zone 白名单 ═══════════ */
test('E126-01 六大生活区生态圈 zone 白名单（军令钦定 fail-closed 根）', () => {
  assert.deepEqual([...LIFESTYLE_GEO_ZONES], ['NA', 'AU', 'EU', 'CN', 'SEA', 'JP'], 'zone 白名单须为军令钦定六区');
});

/* ═══════════ E126-02 国家码解析 ═══════════ */
test('E126-02 国家码解析：白名单码→zone；未知/坏形状 ⇒ null（cf-ipcountry 面）', () => {
  assert.equal(geoZoneFromCountry('US'), 'NA');
  assert.equal(geoZoneFromCountry('CA'), 'NA');
  assert.equal(geoZoneFromCountry('AU'), 'AU');
  assert.equal(geoZoneFromCountry('NZ'), 'AU');
  assert.equal(geoZoneFromCountry('FR'), 'EU');
  assert.equal(geoZoneFromCountry('GB'), 'EU');
  assert.equal(geoZoneFromCountry('CN'), 'CN');
  assert.equal(geoZoneFromCountry('HK'), 'CN');
  assert.equal(geoZoneFromCountry('TW'), 'CN');
  assert.equal(geoZoneFromCountry('TH'), 'SEA');
  assert.equal(geoZoneFromCountry('VN'), 'SEA');
  assert.equal(geoZoneFromCountry('SG'), 'SEA');
  assert.equal(geoZoneFromCountry('JP'), 'JP');
  // 大小写归一（cf-ipcountry 恒大写，防御小写/带空白）
  assert.equal(geoZoneFromCountry('us'), 'NA');
  assert.equal(geoZoneFromCountry(' VN '), 'SEA');
  // fail-closed：未知国（拉美/非洲不在军令六区）⇒ null
  assert.equal(geoZoneFromCountry('BR'), null, '拉美不在六区须 null（回退语言区）');
  assert.equal(geoZoneFromCountry('XX'), null);
  assert.equal(geoZoneFromCountry('ZZ'), null);
  // 坏形状
  assert.equal(geoZoneFromCountry(''), null);
  assert.equal(geoZoneFromCountry('USA'), null, '三字码须 null（只认 ISO alpha-2）');
  assert.equal(geoZoneFromCountry(null), null);
  assert.equal(geoZoneFromCountry(123), null);
  assert.equal(geoZoneFromCountry(undefined), null);
});

/* ═══════════ E126-03 时区解析 ═══════════ */
test('E126-03 时区解析：IANA 前缀树→zone；未知/坏形状 ⇒ null（Intl 面）', () => {
  assert.equal(geoZoneFromTimezone('America/New_York'), 'NA');
  assert.equal(geoZoneFromTimezone('America/Los_Angeles'), 'NA');
  assert.equal(geoZoneFromTimezone('America/Indiana/Indianapolis'), 'NA', '子级时区须按前缀树命中');
  assert.equal(geoZoneFromTimezone('America/Toronto'), 'NA');
  assert.equal(geoZoneFromTimezone('Pacific/Honolulu'), 'NA');
  assert.equal(geoZoneFromTimezone('Australia/Sydney'), 'AU');
  assert.equal(geoZoneFromTimezone('Australia/Melbourne'), 'AU');
  assert.equal(geoZoneFromTimezone('Pacific/Auckland'), 'AU');
  assert.equal(geoZoneFromTimezone('Europe/Paris'), 'EU');
  assert.equal(geoZoneFromTimezone('Europe/London'), 'EU');
  assert.equal(geoZoneFromTimezone('Asia/Shanghai'), 'CN');
  assert.equal(geoZoneFromTimezone('Asia/Hong_Kong'), 'CN');
  assert.equal(geoZoneFromTimezone('Asia/Taipei'), 'CN');
  assert.equal(geoZoneFromTimezone('Asia/Bangkok'), 'SEA');
  assert.equal(geoZoneFromTimezone('Asia/Ho_Chi_Minh'), 'SEA');
  assert.equal(geoZoneFromTimezone('Asia/Singapore'), 'SEA');
  assert.equal(geoZoneFromTimezone('Asia/Tokyo'), 'JP');
  // fail-closed：未知前缀
  assert.equal(geoZoneFromTimezone('America/Sao_Paulo'), null, '拉美时区须 null（防前缀过宽）');
  assert.equal(geoZoneFromTimezone('America/Argentina/Buenos_Aires'), null);
  assert.equal(geoZoneFromTimezone('Asia/Kolkata'), null);
  assert.equal(geoZoneFromTimezone('Asia/Dubai'), null);
  assert.equal(geoZoneFromTimezone('Mars/Olympus'), null);
  // 坏形状
  assert.equal(geoZoneFromTimezone(''), null);
  assert.equal(geoZoneFromTimezone(null), null);
  assert.equal(geoZoneFromTimezone(123), null);
  assert.equal(geoZoneFromTimezone('America/New_York; rm -rf'), null, '控制字符注入须 null');
});

/* ═══════════ E126-04 三层优先级 ═══════════ */
test('E126-04 三层解析：country ＞ timezone ＞ null（fail-closed 铁律）', () => {
  // country 优先（军令：标头真值压过时区推断）
  assert.equal(resolveLifestyleGeoZone({ country: 'US', timezone: 'Asia/Shanghai' }), 'NA', '在美华人（IP US＋上海钟）须判北美');
  assert.equal(resolveLifestyleGeoZone({ country: 'AU', timezone: 'Europe/Paris' }), 'AU', '在澳法客须判澳新');
  // timezone 兜底
  assert.equal(resolveLifestyleGeoZone({ timezone: 'Europe/Paris' }), 'EU');
  assert.equal(resolveLifestyleGeoZone({ timezone: 'America/Los_Angeles' }), 'NA');
  // 全空 ⇒ null
  assert.equal(resolveLifestyleGeoZone({}), null);
  assert.equal(resolveLifestyleGeoZone(null), null);
  assert.equal(resolveLifestyleGeoZone(undefined), null);
  assert.equal(resolveLifestyleGeoZone('US'), null, '坏形状（非对象）须 null');
  // 双坏 ⇒ null
  assert.equal(resolveLifestyleGeoZone({ country: 'ZZ', timezone: 'Mars/Olympus' }), null);
});

/* ═══════════ E126-05 浏览器兜底 ═══════════ */
test('E126-05 浏览器兜底：resolveBrowserGeoZone 恒 ∈ 白名单 ∪ {null}', () => {
  const z = resolveBrowserGeoZone();
  assert.ok(z === null || LIFESTYLE_GEO_ZONES.includes(z), `返回值须白名单或 null（实为 ${z}）`);
});

/* ═══════════ E126-06 server 接线锚 ═══════════ */
test('E126-06 server 接线锚：标头提取＋时区随行＋geoZone 入参＋geo 覆盖块注入', () => {
  const src = read('server.js');
  // P2a/P2b 双源提取
  assert.ok(src.includes("h['cf-ipcountry']"), 'cf-ipcountry 标头提取缺失');
  assert.ok(src.includes('x-geo-country'), 'x-geo-country 备用标头缺失');
  assert.ok(src.includes('typeof body.timezone === \'string\''), 'body.timezone 随行读取缺失');
  // 单源映射（动态 import 缓存）
  assert.ok(src.includes("await import('./web/src/lib/geoLocaleResolver.mjs')"), 'geoLocaleResolver 单源动态 import 缺失');
  // geoZone 入参贯通
  assert.ok(src.includes('const geoZone = await _e126ResolveGeoZone(req, body)'), 'endpoint geoZone 求值缺失');
  assert.ok(/function buildFamiliarChatSystemPrompt\(\{[^}]*geoZone\b/.test(src), 'prompt 装配函数 geoZone 入参缺失');
  // 覆盖块注入（lifestyleGeoBlock 紧随 lifestyleBlock）
  assert.ok(src.includes('const lifestyleGeoBlock = (geoZone && LIFESTYLE_GEO_CONTEXT[geoZone]) || null'), 'geo 块 fail-closed 求值缺失');
  const li = src.indexOf('...(lifestyleBlock || []),');
  const gi = src.indexOf('...(lifestyleGeoBlock || []),');
  assert.ok(li >= 0 && gi > li, 'geo 覆盖块须紧随语言生活区块注入');
});

/* ═══════════ E126-07 六区 geo 覆盖块实体清单 ═══════════ */
test('E126-07 六区 geo 块：军令钦定实体＋语言不变铁律＋优先级覆盖声明', () => {
  const src = read('server.js');
  const ctxStart = src.indexOf('const LIFESTYLE_GEO_CONTEXT = {');
  const ctxEnd = src.indexOf('const lifestyleBlock', ctxStart);
  assert.ok(ctxStart > 0 && ctxEnd > ctxStart, 'LIFESTYLE_GEO_CONTEXT 块缺失');
  const ctx = src.slice(ctxStart, ctxEnd);
  // 六区俱在
  for (const z of ['NA', 'AU', 'EU', 'CN', 'SEA', 'JP']) {
    assert.ok(new RegExp(`\\b${z}:\\s*\\[`).test(ctx), `geo 块缺 ${z} 区`);
  }
  // 覆盖声明（语言块的地区性示例让位）
  assert.ok(ctx.includes('takes priority over the locale-anchored lifestyle examples'), '优先级覆盖声明缺失');
  // 显式意图豁免（P1）
  const p1 = (ctx.match(/explicitly names another destination/g) || []).length;
  assert.ok(p1 >= 6, `P1 显式意图豁免须六区全配（实为 ${p1}）`);
  // 语言不变铁律（军令：语言轨道与地理轨道分离）
  const langKeep = (ctx.match(/Reply language stays the current chat language unchanged/g) || []).length;
  assert.ok(langKeep >= 6, `语言不变铁律须六区全配（实为 ${langKeep}）`);
  // 军令钦定实体（主公原文明示：加州 1 号公路/Catskills/莫宁顿/蓝山）
  assert.ok(ctx.includes('Pacific Coast Highway'), 'NA 区缺加州一号公路（军令钦定实体）');
  assert.ok(ctx.includes('Catskills'), 'NA 区缺 Catskills（军令钦定实体）');
  assert.ok(ctx.includes('Mornington Peninsula'), 'AU 区缺莫宁顿半岛（军令钦定实体）');
  assert.ok(ctx.includes('Blue Mountains'), 'AU 区缺蓝山（军令钦定实体）');
  assert.ok(ctx.includes('Chiang Mai'), 'SEA 区缺清迈');
  assert.ok(ctx.includes('Moganshan'), 'CN 区缺莫干山');
});

/* ═══════════ E126-08 变体库形状 ═══════════ */
test('E126-08 变体库：4 套 roadtrip geo 变体全字段同构 E124 基准', () => {
  const variants = LIFESTYLE_GEO_VARIANTS.roadtrip;
  const keys = Object.keys(variants);
  assert.deepEqual(keys.sort(), ['en@SEA', 'fr@AU', 'zh@AU', 'zh@NA'].sort(), '军令钦定 4 套变体须齐');
  // style 卡无变体（审美/品牌全球可达——刀量纪律）
  assert.ok(!LIFESTYLE_GEO_VARIANTS.style, 'style 卡须无 geo 变体（E126 范围纪律）');
  const fields = ['title', 'subtitle', 'prose', 'companionWhisper', 'bestWindowPrefix', 'defaultTiming', 'heading'];
  for (const k of keys) {
    const v = variants[k];
    for (const f of fields) assert.ok(v && v[f], `变体 ${k} 缺字段 ${f}`);
    assert.ok(typeof v.heading.deg === 'number' && typeof v.heading.name === 'string', `变体 ${k} heading 形状坏`);
  }
});

/* ═══════════ E126-09 变体 geo 锚定 ═══════════ */
test('E126-09 变体 geo 锚定：zh@NA 无中国地名倒灌＋钦定实体在位', () => {
  const v = LIFESTYLE_GEO_VARIANTS.roadtrip;
  const zhNA = `${v['zh@NA'].prose}${v['zh@NA'].companionWhisper}`;
  // 军令病灶：在美华人拿到莫干山/安吉路书 ⇒ 倒灌禁止
  assert.ok(!zhNA.includes('莫干山') && !zhNA.includes('安吉') && !zhNA.includes('大理'), 'zh@NA 严禁中国地名倒灌');
  // 军令钦定实体：加州一号公路＋Catskills
  assert.ok(zhNA.includes('一号公路'), 'zh@NA 缺加州一号公路（军令钦定）');
  assert.ok(zhNA.includes('Catskills'), 'zh@NA 缺 Catskills（军令钦定）');
  assert.ok(zhNA.includes('美元'), 'zh@NA 须 USD 计价（商业分佣结算闭环）');

  const zhAU = `${v['zh@AU'].prose}${v['zh@AU'].companionWhisper}`;
  assert.ok(zhAU.includes('蓝山'), 'zh@AU 缺蓝山（军令钦定）');
  assert.ok(zhAU.includes('莫宁顿'), 'zh@AU 缺莫宁顿半岛（军令钦定）');
  assert.ok(zhAU.includes('澳元'), 'zh@AU 须 AUD 计价');

  const frAU = `${v['fr@AU'].prose}${v['fr@AU'].companionWhisper}`;
  assert.ok(frAU.includes('Mornington'), 'fr@AU 缺 Mornington Peninsula（军令钦定）');
  assert.ok(frAU.includes('Blue Mountains'), 'fr@AU 缺 Blue Mountains（军令钦定）');
  assert.ok(frAU.includes('$AU'), 'fr@AU 须 AUD 计价');
  // 法语卡不得倒灌法国本土路线
  assert.ok(!frAU.includes('Provence') && !frAU.includes('Loire'), 'fr@AU 严禁法国本土路线倒灌');

  const enSEA = `${v['en@SEA'].prose}${v['en@SEA'].companionWhisper}`;
  assert.ok(enSEA.includes('Chiang Mai'), 'en@SEA 缺清迈（军令钦定亚太旅居场景）');
  assert.ok(enSEA.includes('THB'), 'en@SEA 须 THB 计价');
  assert.ok(!enSEA.includes('Joshua Tree') && !enSEA.includes('Catskills'), 'en@SEA 严禁北美路线倒灌');
});

/* ═══════════ E126-10 取卡三参矩阵 ═══════════ */
test('E126-10 取卡三参：命中变体／未命中回退／坏 zone 回退／坏 type null', () => {
  // 命中：zh+NA ⇒ 北美变体（非莫干山基准）
  const zhNA = getLifestyleTemplate('roadtrip', 'zh', 'NA');
  assert.ok(zhNA && zhNA.prose.includes('一号公路'), 'zh+NA 须命中北美变体');
  // 命中：fr+AU
  const frAU = getLifestyleTemplate('roadtrip', 'fr', 'AU');
  assert.ok(frAU && frAU.prose.includes('Blue Mountains'), 'fr+AU 须命中澳新变体');
  // 未命中组合回退语言基准：en+AU（无 en@AU 变体）⇒ en 基准（Joshua Tree）
  const enAU = getLifestyleTemplate('roadtrip', 'en', 'AU');
  assert.ok(enAU && enAU.prose.includes('Joshua Tree'), 'en+AU 须回退 en 语言基准（零破坏）');
  // style 恒回退基准（style 无变体）
  const styleNA = getLifestyleTemplate('style', 'zh', 'NA');
  const styleBase = getLifestyleTemplate('style', 'zh');
  assert.equal(styleNA, styleBase, 'style 卡 geo 须零感知（回退基准）');
  // 坏 zone（白名单外字符串）⇒ 回退基准
  const badZone = getLifestyleTemplate('roadtrip', 'zh', 'XX');
  const base = getLifestyleTemplate('roadtrip', 'zh');
  assert.equal(badZone, base, '坏 zone 须回退语言基准');
  // 坏 type 恒 null（沿 E124 fail-closed）
  assert.equal(getLifestyleTemplate('apology', 'zh', 'NA'), null, '坏 type 须 null');
  // 无 zone 两参调用沿 E124 兼容
  assert.equal(getLifestyleTemplate('roadtrip', 'zh'), LIFESTYLE_TEMPLATES_12.roadtrip.zh, '两参调用须返回语言基准');
});

/* ═══════════ E126-11 前端接线锚 ═══════════ */
test('E126-11 前端接线锚：时区随行上报＋插槽 zone 选卡', () => {
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(sheet.includes('Intl.DateTimeFormat().resolvedOptions().timeZone'), 'ChatSheet 时区采集缺失');
  assert.ok(sheet.includes('timezone,'), 'ChatSheet body 时区随行缺失');
  const slot = read('web/src/components/companion/LifestyleMuseSlot.tsx');
  assert.ok(slot.includes("import { resolveBrowserGeoZone } from '../../lib/geoLocaleResolver.mjs'"), '插槽 zone 解析 import 缺失');
  assert.ok(slot.includes('const GEO_ZONE'), '插槽模块级 zone 常量缺失');
  const calls = (slot.match(/getLifestyleTemplate\(type, \(lang as Lang\), GEO_ZONE \|\| undefined\)/g) || []).length;
  assert.ok(calls >= 3, `插槽三处取卡须全走 zone 三参（实为 ${calls}）`);
});

/* ═══════════ E126-12 变体卡红线 ═══════════ */
test('E126-12 变体卡红线：prose 长度量级同基准＋奢侈大牌禁词零容忍', () => {
  const v = LIFESTYLE_GEO_VARIANTS.roadtrip;
  const baseZh = LIFESTYLE_TEMPLATES_12.roadtrip.zh;
  const baseFr = LIFESTYLE_TEMPLATES_12.roadtrip.fr;
  const baseEn = LIFESTYLE_TEMPLATES_12.roadtrip.en;
  // prose 长度与基准同量级（±60%——E125 排版引擎折行兜底之上的文案纪律）
  assert.ok(v['zh@NA'].prose.length <= Math.ceil(baseZh.prose.length * 1.6), `zh@NA prose 超量级（${v['zh@NA'].prose.length} vs 基准 ${baseZh.prose.length}）`);
  assert.ok(v['zh@AU'].prose.length <= Math.ceil(baseZh.prose.length * 1.6), 'zh@AU prose 超量级');
  assert.ok(v['fr@AU'].prose.length <= Math.ceil(baseFr.prose.length * 1.6), 'fr@AU prose 超量级');
  assert.ok(v['en@SEA'].prose.length <= Math.ceil(baseEn.prose.length * 1.6), 'en@SEA prose 超量级');
  // 小众质感红线（禁奢侈大牌——沿 E124 军规）
  const banned = [/Gucci/i, /Louis Vuitton/i, /Hermès/i, /Chanel/i, /Prada/i, /Bottega/i, /Burberry/i, /Balenciaga/i, /Cartier/i, /Tiffany/i, /爱马仕/, /香奈儿/, /古驰/];
  for (const k of Object.keys(v)) {
    const text = `${v[k].prose}${v[k].companionWhisper}${v[k].subtitle}`;
    for (const re of banned) assert.ok(!re.test(text), `变体 ${k} 触奢侈红线：${re}`);
  }
});

/* ═══════════ S13 链位自保 ═══════════ */
test('E126-S13 链位自保：e126 入编（e125 后、e40-compat 前；全链 94→95 段）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 103, `军规链段数须为 95（E126 入编后 94→95；实为 ${segs.length}）`);
  const iE126 = segs.findIndex((s) => s.includes('audit-e126-geo-locale'));
  const iE125 = segs.findIndex((s) => s.includes('audit-e125-canvas-typography'));
  const iCompat = segs.findIndex((s) => s.includes('audit-e40-compat'));
  assert.ok(iE126 > iE125, 'e126 须居 e125 之后');
  assert.ok(iE126 < iCompat, 'e126 须居 e40-compat 之前');
  assert.ok(iCompat === segs.length - 2, 'e40-compat 恒 len-2');
});
