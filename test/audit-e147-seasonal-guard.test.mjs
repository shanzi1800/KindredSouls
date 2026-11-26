// ═══ E147 闸门：SEASONAL-GUARD（餐饮零地名＋着装三维硬锁＋年鉴双门槛军令 2026-11-19 全守备）═══
// 军令三刀（主公三张产线截图病灶根治）：
//   刀二 餐饮「零地名/零菜系前缀」硬规则＋出流清洗锁（潮汕清炖牛腩 → 清炖牛腩）；
//   刀三 着装「季节 × 所在地气候 × 年龄段」三维硬锁＋反季面料拦截＋四级无感
//        定位顺位（L1 城市词典 → L2 国家头 → L3 时区 → null 回退）——出生地/
//        现居地彻底解耦（气候解析不吃任何 birth 参数）；跨半球用例：出生宜昌
//        现居墨尔本 ⇒ south ⇒ 南半球暖季——北半球冬大衣被硬锁拦下；
//   刀四 《灵魂成长年鉴》统一总册分篇章＋双门槛防空壳门控（权益 × 时间≥30
//        天 × 轨迹≥5 条）——蓄能态「⏳ 编纂蓄能中」＋导出按钮置灰。
//   锁1 餐饮零地名出流清洗（六语词典窄收＋幂等＋CJK 空格归一）；
//   锁2 四级无感定位顺位＋气候三档＋跨半球防误判（出生地解耦铁律）；
//   锁3 年龄段三档边界＋反季面料拦截替换（凉季黑名单）；
//   锁4 纪律块双形态（food 零地名铁令／outfit 三维硬锁＋气候真值行＋年龄锚）六语；
//   锁5 年鉴双门槛四态（locked/charging/charging-轨迹不足/unlocked）＋蓄能态
//        六语逐字＋readChronicleState fail-closed＋组件导出置灰；
//   锁6 server 挂载（五挂：模块缓存/路由加载/路由级气候解析/E147 IIFE/emitDelta
//        四层清洗链＋done 帧 chronicle 随行＋懒回填 PATCH）；
//   锁7 链位与段数（114→115：e147 紧居 e146 后、e40-compat 前）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const SG = await import(join(ROOT, 'web/src/lib/astralSeasonalGuardEngine.mjs'));
const CE = await import(join(ROOT, 'web/src/lib/soulChronicleEntitlement.mjs'));

const SERVER = read('server.js');
const CARD = read('web/src/components/SoulChronicleCard.tsx');
const PKG = JSON.parse(read('package.json'));
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

/* ═══ 锁1：餐饮零地名出流清洗 ═══ */

test('E147-锁1a 餐饮地名剥离（产线实锤病灶：潮汕清炖牛腩 → 清炖牛腩）', () => {
  assert.equal(SG.washFoodRegionPrefix('潮汕清炖牛腩'), '清炖牛腩', '潮汕前缀剥离');
  assert.equal(SG.washFoodRegionPrefix('喝碗广式老火汤吧'), '喝碗老火汤吧', '广式前缀剥离');
  assert.equal(SG.washFoodRegionPrefix('试试日式寿喜锅'), '试试寿喜锅', '日式前缀剥离');
  assert.equal(SG.washFoodRegionPrefix('来份兰州牛肉面'), '来份牛肉面', '兰州前缀剥离');
  assert.equal(SG.washFoodRegionPrefix('Cantonese-style roast duck'), 'roast duck', 'en 菜系连缀剥离');
  assert.equal(SG.washFoodRegionPrefix('泰国冬阴功汤'), '泰国冬阴功汤', '「泰国」国名不在窄词典（宁窄勿宽——防误伤）');
});

test('E147-锁1b 清洗幂等＋CJK 空格归一＋fail-closed 透传', () => {
  const once = SG.washFoodRegionPrefix('潮汕 清炖牛腩汤最暖');
  assert.equal(once, '清炖牛腩汤最暖', '剥离后 CJK 间空格归一');
  assert.equal(SG.washFoodRegionPrefix(once), once, '幂等：二次清洗同结果');
  assert.equal(SG.washFoodRegionPrefix(''), '', '空串透传');
  assert.equal(SG.washFoodRegionPrefix(null), '', 'null ⇒ 空串 fail-closed');
  assert.equal(SG.washFoodRegionPrefix('今天喝温水就好'), '今天喝温水就好', '无地名原样透传');
});

/* ═══ 锁2：四级无感定位顺位＋跨半球防误判 ═══ */

test('E147-锁2a 四级顺位（L1 城市 ＞ L2 国家头 ＞ L3 时区 ＞ null）', () => {
  // L1 城市词典（当轮 user 文本命中）
  assert.deepEqual(SG.resolveCurrentClimate({ locationText: '我现在人在墨尔本呢', timezone: 'Asia/Shanghai' }),
    { climate: 'south', source: 'L1-city' }, 'L1 城市压过 L3 时区');
  assert.deepEqual(SG.resolveCurrentClimate({ locationText: '人在新加坡出差' }),
    { climate: 'tropical', source: 'L1-city' }, 'L1 热带城市');
  // L2 国家头
  assert.deepEqual(SG.resolveCurrentClimate({ countryHeader: 'AU', timezone: 'Asia/Shanghai' }),
    { climate: 'south', source: 'L2-country' }, 'L2 AU ⇒ south');
  assert.deepEqual(SG.resolveCurrentClimate({ countryHeader: 'SG' }),
    { climate: 'tropical', source: 'L2-country' }, 'L2 SG ⇒ tropical');
  // L3 时区
  assert.deepEqual(SG.resolveCurrentClimate({ timezone: 'Australia/Melbourne' }),
    { climate: 'south', source: 'L3-timezone' }, 'L3 墨尔本时区 ⇒ south');
  assert.deepEqual(SG.resolveCurrentClimate({ timezone: 'Asia/Singapore' }),
    { climate: 'tropical', source: 'L3-timezone' }, 'L3 新加坡时区 ⇒ tropical');
  assert.deepEqual(SG.resolveCurrentClimate({ timezone: 'Europe/Paris' }),
    { climate: 'north', source: 'L3-timezone' }, 'L3 有效时区 ⇒ north 兜底（现行语义）');
  // 全缺 ⇒ null 零破坏
  assert.deepEqual(SG.resolveCurrentClimate({}), { climate: null, source: null }, '全缺 ⇒ null');
  assert.deepEqual(SG.resolveCurrentClimate(null), { climate: null, source: null }, 'null 输入 fail-closed');
});

test('E147-锁2b 跨半球军令用例：出生宜昌现居墨尔本 ⇒ south——出生地彻底解耦', () => {
  // 军令钦定用例：resolveCurrentClimate 不吃任何 birth 参数——宜昌出生
  // 不入气候判定；墨尔本时区/城市/国家头命中 ⇒ south（南半球镜像暖季）
  const byTz = SG.resolveCurrentClimate({ timezone: 'Australia/Melbourne' });
  const byCity = SG.resolveCurrentClimate({ locationText: '刚从宜昌搬到墨尔本' });
  assert.equal(byTz.climate, 'south', '时区顺位 ⇒ south');
  assert.equal(byCity.climate, 'south', '城市词典 ⇒ south（提及出生地城市不劫持——墨尔本命中优先词典 south 组）');
  const ov = SG.climateSeasonOverride('south');
  assert.equal(ov.geoZoneOverride, 'AU', 'south ⇒ E146 季节镜像喂 AU（防北半球冬大衣）');
  assert.equal(ov.seasonModeOverride, null, 'south 季节交给镜像引擎');
  const ovT = SG.climateSeasonOverride('tropical');
  assert.equal(ovT.seasonModeOverride, 'warm', 'tropical ⇒ 常夏 warm 清润');
  assert.deepEqual(SG.climateSeasonOverride('north'), { geoZoneOverride: null, seasonModeOverride: null }, 'north ⇒ 沿用现行零破坏');
  assert.deepEqual(SG.climateSeasonOverride(null), { geoZoneOverride: null, seasonModeOverride: null }, 'null ⇒ 零破坏');
});

/* ═══ 锁3：年龄段三档＋反季面料拦截 ═══ */

test('E147-锁3a 年龄段三档边界（<28 youth / 28–45 prime / >45 mature；坏年份 null）', () => {
  assert.equal(SG.ageTierOf('1999-05-20', 2026), 'youth', '27 岁 ⇒ 青春灵动');
  assert.equal(SG.ageTierOf('1998-05-20', 2026 - 0), SG.ageTierOf('1998-01-01', 2026), '年内稳定');
  assert.equal(SG.ageTierOf('1995-06-01', 2026), 'prime', '31 岁 ⇒ 从容精进');
  assert.equal(SG.ageTierOf('1981-01-01', 2026), 'prime', '45 岁 ⇒ prime 上界含');
  assert.equal(SG.ageTierOf('1980-12-31', 2026), 'mature', '46 岁 ⇒ 成熟沉稳');
  assert.equal(SG.ageTierOf('1970-03-03', 2026), 'mature', '>45 ⇒ mature');
  assert.equal(SG.ageTierOf('', 2026), null, '空生日 ⇒ null fail-closed');
  assert.equal(SG.ageTierOf('abc', 2026), null, '坏年份 ⇒ null');
  assert.equal(SG.ageTierOf('1899-01-01', 2026), null, '越界年份 ⇒ null');
  assert.equal(SG.ageTierOf('1990-01-01', NaN), null, '坏当前年 ⇒ null');
});

test('E147-锁3b 反季面料拦截（凉季黑名单替换保暖材质；非凉季透传）', () => {
  // 产线实锤病灶：11 月冬季「素色立领麻衫」→ 保暖材质替换
  assert.ok(SG.guardSeasonalFabric('素色立领麻衫最配你', true).includes('软针织衫'), '麻衫 ⇒ 软针织衫');
  assert.equal(SG.guardSeasonalFabric('一件亚麻衬衫就好', true), '一件软针织衬衫就好', '亚麻衬衫替换');
  assert.ok(SG.guardSeasonalFabric('雪纺裙吧', true).includes('软呢'), '雪纺替换');
  assert.ok(SG.guardSeasonalFabric('linen shirt is fine', true).includes('soft-knit'), 'en linen shirt 替换');
  assert.equal(SG.guardSeasonalFabric('短袖最舒服', true), '长袖最舒服', '短袖 ⇒ 长袖');
  // 非凉季 ⇒ 原文透传（南半球暖季可推春夏面料）
  assert.equal(SG.guardSeasonalFabric('素色立领麻衫最配你', false), '素色立领麻衫最配你', '暖季透传');
  assert.equal(SG.guardSeasonalFabric('麻衫', true), SG.guardSeasonalFabric(SG.guardSeasonalFabric('麻衫', true), true), '幂等');
  // 合成入口：food 地名剥离无条件＋面料拦截按 cold 开关
  assert.equal(SG.washE147Outbound('潮汕清炖牛腩配麻衫', false), '清炖牛腩配麻衫', '非凉季：地名剥离仍生效');
  assert.ok(SG.washE147Outbound('潮汕清炖牛腩配麻衫', true).includes('软针织衫'), '凉季：双清洗齐效');
});

/* ═══ 锁4：纪律块双形态六语 ═══ */

test('E147-锁4a 纪律块 food 形态：零地名铁令（六语）＋fail-closed 静默', () => {
  const zh = SG.buildE147GuardBlock('zh', { focus: 'food' });
  assert.ok(zh.includes('E147 饮膳零地名铁令'), 'zh food head');
  assert.ok(zh.includes('零地名'), '零地名铁令在');
  assert.ok(zh.includes('潮汕'), '产线病灶词在纪律示例（禁连缀示例）');
  assert.ok(zh.includes('清炖牛腩汤'), '正确形态示例在');
  assert.ok(!zh.includes('三维硬锁'), 'food 形态 ⇒ 严禁 outfit 块（单次聚焦对齐）');
  for (const l of ['en', 'fr', 'es', 'th', 'vi']) {
    const b = SG.buildE147GuardBlock(l, { focus: 'food' });
    assert.ok(b.includes('E147'), `${l} food head 在`);
    assert.ok(b.length > 80, `${l} food 纪律行宽 sanity`);
  }
  // fail-closed：focus null/坏形状 ⇒ '' 零注入
  assert.equal(SG.buildE147GuardBlock('zh', { focus: null }), '', 'focus null ⇒ 静默');
  assert.equal(SG.buildE147GuardBlock('zh', {}), '', 'ctx 缺 ⇒ 静默');
  assert.equal(SG.buildE147GuardBlock('zh', null), '', 'null ctx ⇒ 静默');
});

test('E147-锁4b 纪律块 outfit 形态：三维硬锁＋气候真值行＋年龄锚＋面料黑名单', () => {
  const zh = SG.buildE147GuardBlock('zh', { focus: 'outfit', climate: 'south', ageTier: 'prime' });
  assert.ok(zh.includes('E147 着装三维硬锁'), 'zh outfit head');
  assert.ok(zh.includes('主人此刻所在地气候'), '③ 所在地维度在（非出生地）');
  assert.ok(zh.includes('南半球温带'), '南半球气候真值行注入（跨半球防误判）');
  assert.ok(zh.includes('年龄段气质锚：从容精进'), 'prime 年龄锚注入');
  assert.ok(zh.includes('亚麻'), '反季面料黑名单在');
  assert.ok(!zh.includes('零地名铁令'), 'outfit 形态 ⇒ 严禁 food 块');
  // tropical 真值行
  const t = SG.buildE147GuardBlock('zh', { focus: 'outfit', climate: 'tropical' });
  assert.ok(t.includes('热带常夏'), 'tropical 真值行注入');
  assert.ok(t.includes('严禁厚重保暖材质'), 'tropical 反向黑名单（禁冬装）');
  // 气候缺 ⇒ 无真值行但三维硬锁仍在（L4 万金油形态）
  const n = SG.buildE147GuardBlock('zh', { focus: 'outfit' });
  assert.ok(n.includes('三维硬锁') && !n.includes('南半球'), '气候缺 ⇒ 真值行省略零破坏');
  // 年龄缺 ⇒ 锚省略
  const na = SG.buildE147GuardBlock('zh', { focus: 'outfit', climate: 'south' });
  assert.ok(na.includes('南半球') && !na.includes('气质锚：'), '年龄缺 ⇒ 锚省略');
});

/* ═══ 锁5：年鉴双门槛防空壳门控 ═══ */

test('E147-锁5a 双门槛四态（locked/charging-时间/charging-轨迹/unlocked）', () => {
  const plans = { wealth_yearly_report: true, chronicle_anchor_at: '2026-01-01T00:00:00.000Z', chronicle_sessions: 9 };
  const now = new Date('2026-11-19T12:00:00Z').getTime();
  // 双门槛齐过 ⇒ unlocked
  assert.equal(CE.chronicleModuleGate(plans, 'wealth', 9, now).status, 'unlocked', '满 30 天＋轨迹≥5 ⇒ 启封');
  // 轨迹不足 ⇒ charging
  const lowTraj = CE.chronicleModuleGate(plans, 'wealth', 4, now);
  assert.equal(lowTraj.status, 'charging', '轨迹 4 ＜ 5 ⇒ 蓄能');
  assert.equal(lowTraj.trajectory, 4, '轨迹数回传');
  // 时间不足 ⇒ charging（unlockDate＝anchor+30d）
  const early = CE.chronicleModuleGate(
    { wealth_yearly_report: true, chronicle_anchor_at: '2026-11-10T00:00:00.000Z', chronicle_sessions: 9 },
    'wealth', 9, now);
  assert.equal(early.status, 'charging', '锚后 9 天 ＜ 30 ⇒ 蓄能');
  assert.equal(early.unlockDateISO, '2026-12-10', '启封日＝锚＋30 天');
  // 锚缺失 ⇒ 以 now+30d 预估（服务端将懒回填真锚）
  const noAnchor = CE.chronicleModuleGate({ wealth_yearly_report: true }, 'wealth', 9, now);
  assert.equal(noAnchor.status, 'charging', '无锚 ⇒ 蓄能（预估 now+30d）');
  assert.equal(noAnchor.unlockDateISO, '2026-12-19', '预估启封日');
  // 无权益 ⇒ locked（双门槛之外）
  const locked = CE.chronicleModuleGate({}, 'wealth', 9, now);
  assert.equal(locked.status, 'locked', '无权益 ⇒ locked');
  assert.equal(locked.unlockDateISO, null, 'locked 无启封日');
  // 姻缘篇与财富篇各自独立（单买对应篇章）
  assert.equal(CE.chronicleModuleGate(plans, 'romance', 9, now).status, 'locked', '财富单买 ⇒ 姻缘篇 locked');
  assert.equal(CE.chronicleModuleGate(
    { compatibility_yearly_report: true, chronicle_anchor_at: '2026-01-01T00:00:00.000Z', chronicle_sessions: 7 },
    'romance', 7, now).status, 'unlocked', '姻缘单买 ⇒ 姻缘篇启封');
  // 常量军令值
  assert.equal(CE.CHRONICLE_RIPEN_DAYS, 30, '启封周期军令钦定 30 天');
  assert.equal(CE.CHRONICLE_MIN_TRAJECTORY, 5, '有效轨迹军令钦定 5 条');
});

test('E147-锁5b 蓄能态六语逐字（⏳ 编纂蓄能中·已沉淀 N 条轨迹·预计 YYYY-MM-DD 启封）', () => {
  const meta = { trajectory: 3, unlockDateISO: '2026-12-10' };
  assert.equal(CE.chronicleChargingLabel('zh', meta), '⏳ 编纂蓄能中·已沉淀 3 条轨迹·预计 2026-12-10 启封', 'zh 军令逐字');
  const en = CE.chronicleChargingLabel('en', meta);
  assert.ok(en.includes('⏳') && en.includes('3') && en.includes('2026-12-10'), 'en 帧全要素');
  for (const l of ['fr', 'es', 'th', 'vi']) {
    const s = CE.chronicleChargingLabel(l, meta);
    assert.ok(s.includes('⏳') && s.includes('3') && s.includes('2026-12-10'), `${l} 帧全要素`);
  }
  assert.equal(CE.chronicleChargingLabel('zh', null), '⏳ 编纂蓄能中·已沉淀 0 条轨迹·预计 — 启封', 'null meta fail-closed');
});

test('E147-锁5c readChronicleState fail-closed（隐私模式 null ⇒ 全空；坏档归零）', () => {
  assert.deepEqual(CE.readChronicleState(null), { anchorAt: null, sessions: 0 }, 'null ls ⇒ 全空');
  const fake = {
    getItem: (k) => (k === 'ks_chronicle_state' ? '{"anchorAt":"2026-01-01","sessions":6}' : null),
    setItem: () => {},
  };
  assert.deepEqual(CE.readChronicleState(fake), { anchorAt: '2026-01-01', sessions: 6 }, '合法档读取');
  const bad = { getItem: () => 'not-json', setItem: () => {} };
  assert.deepEqual(CE.readChronicleState(bad), { anchorAt: null, sessions: 0 }, '坏 JSON ⇒ 归零');
  const bad2 = { getItem: () => '{"anchorAt":"xyz","sessions":-3}', setItem: () => {} };
  assert.deepEqual(CE.readChronicleState(bad2), { anchorAt: null, sessions: 0 }, '坏形状 ⇒ 归零');
});

test('E147-锁5d 组件蓄能态：置灰禁用防空壳导出（SoulChronicleCard）', () => {
  assert.ok(CARD.includes('chronicleModuleGate'), '组件须消费双门槛门控');
  assert.ok(CARD.includes('readChronicleState'), '组件须读 ks_chronicle_state 档案');
  assert.ok(CARD.includes('chronicleChargingLabel'), '组件须装配蓄能态文案');
  assert.ok(CARD.includes('data-testid="soul-chronicle-charging"'), '蓄能态探针槽位');
  assert.ok(CARD.includes('is-charging'), '蓄能态置灰类名');
  assert.ok(CARD.includes('disabled'), '导出按钮须 disabled 置灰');
  assert.ok(read('web/src/App.css').includes('.ks-chronicle-cta.is-charging'), '置灰样式在册');
  // FamiliarChatSheet done 帧回写通路
  assert.ok(read('web/src/components/FamiliarChatSheet.tsx').includes('ks_chronicle_state'), 'done 帧须回写 ks_chronicle_state');
});

/* ═══ 锁6：server 挂载（五挂＋出流链＋done 帧随行＋懒回填）═══ */

test('E147-锁6 server 五挂＋emitDelta 四层清洗链＋done 帧随行＋懒回填 PATCH', () => {
  assert.ok(SERVER.includes('_e147GuardCore'), '挂1：模块缓存');
  assert.ok(SERVER.includes("await import('./web/src/lib/astralSeasonalGuardEngine.mjs')"), '纯核动态 import');
  assert.ok(SERVER.includes('const _e147Guard = await _e147GuardCore()'), '挂2：路由加载');
  assert.ok(SERVER.includes('resolveCurrentClimate'), '挂3：路由级四级顺位气候解析');
  assert.ok(SERVER.includes('_e146GeoFeed || geoZone || null'), 'E146 季节真值喂料接线（south ⇒ AU 镜像）');
  assert.ok(SERVER.includes('seasonMode: _e146SeasonFeed || _e146Truth.seasonMode'), 'tropical ⇒ warm 喂料接线');
  assert.ok(SERVER.includes('buildE147GuardBlock'), '挂4：E147 纪律块 IIFE');
  assert.ok(SERVER.includes('[E147] guard prompt block'), 'E147 日志');
  assert.ok(SERVER.includes('_e147OutWashSync(_e147Guard, _e1421BrandWash'), '挂5：emitDelta 四层清洗链（E147 内一层）');
  assert.ok(SERVER.includes('chronicle: _e147ChronicleMeta'), 'done 帧年鉴档案随行');
  assert.ok(SERVER.includes('chronicle_anchor_at'), '懒回填锚字段');
  assert.ok(SERVER.includes('chronicle_sessions'), '轨迹持久化字段');
  assert.ok(SERVER.includes('patchWealthPlans(auth.userId, _e147Delta)'), '懒回填走读-合并-写 PATCH');
  // 出生地解耦铁律：路由级气候解析不吃 body.birth（只 birth.date 推年龄档）
  const iClimate = SERVER.indexOf('resolveCurrentClimate({');
  const iBirth = SERVER.indexOf('_e147Guard.ageTierOf(');
  assert.ok(iClimate > 0 && iBirth > iClimate, '气候解析先于年龄档（birth 只入年龄不入气候）');
});

/* ═══ 锁7：链位与段数（114→115）═══ */

test('E147-锁7 链位：e147 紧居 e146 后、e40-compat 前；全链 115 段＋node-only 114＋python 恒总链尾', () => {
  const script = String(PKG.scripts['test:astro'] || '');
  assert.ok(script.length > 100, 'test:astro 脚本须在册');
  const chain = script.split('&&').map((s) => s.trim()).filter(Boolean);
  const segs = chain.map((s) => (s.match(/audit-[a-z0-9-]+\.(?:test\.)?(?:mjs|js)/g) || []).pop()).filter(Boolean);
  const i146 = segs.indexOf('audit-e146-fourfold-rec.test.mjs');
  const i147 = segs.indexOf('audit-e147-seasonal-guard.test.mjs');
  const i40 = segs.indexOf('audit-e40-compat-synastry-tensor-fusion.test.mjs');
  assert.ok(i146 > 0, 'e146 段须在链');
  assert.ok(i147 === i146 + 1, 'e147 须紧居 e146 之后（版本序铁律）');
  assert.ok(i40 > i147, 'e40-compat 须恒居 node 链尾（e147 不得插其后）');
  // 总段计数（含 python 尾）＝115（E147 插链后继化）
  assert.equal(chain.length, 123, `链总段必须为 115（实际 ${chain.length}）`);
  const nodeOnly = chain.filter((s) => !/python/.test(s));
  assert.equal(nodeOnly.length, 122, `node-only 段必须为 114（实际 ${nodeOnly.length}）`);
  assert.ok(/python/.test(chain[chain.length - 1]), 'python 段须恒为总链尾');
  assert.equal(i40, segs.length - 1, 'e40 须恒 node 链尾');
});
