// ═══ E140 闸门：FIX-HOMEPAGE-FAMILIAR-PERSISTENCE（主公军令 2026-11-15）═══
// 病根（军令线上实测）：姻缘 /result 付 $4.99 解锁→认领灵宠→返回首页灵宠消失。
//   真因＝跨线签名误杀——首页 FamiliarHomeCard 挂载拿**财富线留痕**
//   （ks_last_wealth_report / ks_oauth_back_url）校验**姻缘线认领档**
//   （compat 常无出生时间 ⇒ 签名必然不匹配）⇒ 挂载即 clearFamiliarRecord 删档。
//   同族反向误杀两处：AdoptFamiliarCTA（姻缘盘误杀财富档）、WealthReportPage
//   （财富盘误杀姻缘档）。
// 治法：认领档增 line（romance/wealth 闭集）业务线溯源——三处校验升级线感知
//   （shouldKeepFamiliarRecord / shouldKeepFamiliarOnHome）：同线换盘清洗照旧
//   （E49 保真），异线跨线豁免不误杀；「🔄 重置沙盒演练」双按钮联动清灵宠档
//   （军令：重置恢复初始未解锁态）。骑键几何 E54 冻结不动（军令 24px 角锚与
//   冻结几何相反，按铁律「军令笔误以真码为准」核定不采纳）。零 i18n 扰动、
//   零 server.js 改动；链位：e140 入编 e139 后、e40-compat 前；全链 107→108 段。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const FH = await import(join(ROOT, 'web/src/lib/familiarHome.mjs'));
const ST = await import(join(ROOT, 'web/src/lib/sandboxTester.mjs'));

const APP = read('web/src/App.tsx');
const CTA = read('web/src/components/AdoptFamiliarCTA.tsx');
const HOME = read('web/src/components/FamiliarHomeCard.tsx');
const WRP = read('web/src/pages/WealthReportPage.tsx');
const CSS = read('web/src/App.css');
const PKG = JSON.parse(read('package.json'));

/* ── 测试基建：注入式 mock storage（纯函数契约，零 DOM）── */
function mockStorage(initial) {
  const m = new Map(Object.entries(initial || {}));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    _map: m,
  };
}

/** 姻缘 /result 认领写档仿真（AdoptFamiliarCTA.adopt 落码同形） */
function romanceClaim(storage, name, mode, chart) {
  storage.setItem(FH.FAMILIAR_HOME_LS_KEY, JSON.stringify({
    profile: { name, relation_mode: mode },
    triad: null,
    persisted: true,
    adoptedAt: '2026-11-15T04:00:00.000Z',
    chartSig: FH.familiarChartSig(chart),
    line: 'romance',
  }));
}

/** 财富线留痕仿真（lastReportUrl.saveLastReport 落码同形：异盘＋带默认时间） */
const WEALTH_LEFTOVER_URL = '/wealth/report?birthDate=1985-03-03&time=12:00&lat=31.23&lon=121.47&tz=Asia%2FShanghai';

/** 姻缘盘（compat 常无出生时间——与财富留痕必然异签的病根形态） */
const ROMANCE_CHART = { birthDate: '1990-05-01', birthTime: '', lat: 13.75, lon: 100.5, tz: 'Asia/Bangkok' };

/* ═══ E140-01 完整路径闭环（军令断言1：$4.99 解锁→认领→返首页绝不消失）═══ */
test('E140-01 路径闭环：姻缘认领档（Sophia/Milo 双态）vs 财富线留痕异盘 ⇒ 首页恒保留不删档', () => {
  for (const [name, mode] of [['Sophia', 'girlfriend'], ['Milo', 'buddy']]) {
    // ① /result 付讫认领（写档带 line 'romance'）
    const store = mockStorage({
      ks_last_wealth_report: JSON.stringify({ url: WEALTH_LEFTOVER_URL, type: 'monthly', at: 1 }),
    });
    romanceClaim(store, name, mode, ROMANCE_CHART);
    // ② 返回首页（带路 URL 干净无出生参数）⇒ 真值只能取自财富线留痕（病根触发位）
    const tr = FH.extractBirthTruth('', store);
    assert.equal(tr.source, 'lastReport', '首页真值须落到财富线留痕（军令病根形态）');
    assert.notEqual(tr.birthDate, ROMANCE_CHART.birthDate, '留痕盘须与姻缘盘异签（复现前提）');
    // ③ E140 根治断言：旧代码此处 recordMatchesChart=false ⇒ 删档；新判别恒保留
    const rec = FH.readFamiliarRecord(store);
    assert.ok(rec, '认领档须可读');
    assert.equal(rec.profile.name, name, `认领档须为 ${name}`);
    assert.equal(rec.line, 'romance', '档业务线须为 romance');
    assert.equal(FH.shouldKeepFamiliarOnHome(rec, tr), true, `${name} 返首页须跨线豁免保留（军令：绝不消失）`);
    // ④ 首页挂载源码锚：FamiliarHomeCard 挂载判别已换线感知真源（非裸 recordMatchesChart）
    assert.ok(HOME.includes('shouldKeepFamiliarOnHome(r, tr)'), '首页挂载须用线感知判别（E140 真源）');
    assert.ok(!HOME.includes('!recordMatchesChart(r,'), '首页挂载禁残留裸 recordMatchesChart 清洗');
  }
  // ⑤ 两挂载点业务线传参（姻缘 /result ·romance ／ 财富报告页 ·wealth）
  assert.ok(APP.includes('familiarLine="romance"'), 'App.tsx 姻缘挂载须传 familiarLine="romance"');
  assert.ok(WRP.includes('familiarLine="wealth"'), 'WealthReportPage 挂载须传 familiarLine="wealth"');
});

/* ═══ E140-02 刷新持久化（军令断言2：page.reload 后灵宠依然在位）═══ */
test('E140-02 刷新持久化：档跨 reload 存续＋带路整页导航＋权益熔断（档在场＝付费证明）', () => {
  // ① 认领→返首页（无留痕的纯净会话：truth null ⇒ 保留）
  const store = mockStorage({});
  romanceClaim(store, 'Milo', 'buddy', ROMANCE_CHART);
  const tr = FH.extractBirthTruth('', store);
  assert.equal(tr, null, '纯净会话无真值可校验');
  assert.equal(FH.shouldKeepFamiliarOnHome(FH.readFamiliarRecord(store), tr), true, 'truth null ⇒ 恒保留（E49 沿袭）');
  // ② 模拟 F5 整页刷新：localStorage 档仍在 ⇒ 判别幂等恒保留（判别纯函数无副作用）
  const again = FH.readFamiliarRecord(store);
  assert.equal(FH.shouldKeepFamiliarOnHome(again, FH.extractBirthTruth('', store)), true, '刷新后判别幂等保留');
  assert.equal(again.line, 'romance', 'writeFamiliarRecord→readFamiliarRecord 往返 line 不丢');
  // ③ 带路按钮源码锚：整页导航 '/' ＋ 落一次性开舱意图（刷新链路＝localStorage 单源真值）
  const iBtn = CTA.indexOf('data-testid="adopt-lead-home"');
  assert.ok(iBtn > -1, '带路按钮须在');
  const seg = CTA.slice(iBtn, iBtn + 1800);
  assert.ok(seg.includes("window.location.href = '/'"), '带路须整页导航回首页（禁 history.back）');
  assert.ok(seg.includes("sessionStorage.setItem('ks_open_familiar_chat', '1')"), '带路须落开舱意图标记');
  // ④ E106-刀三熔断锚：认领档在场即 paidOk（沙盒演练态正常渲染灵宠与对话舱）
  assert.ok(HOME.includes('readFamiliarRecord(famStore, FAMILIAR_LS_KEY)'), 'E106 熔断（档在场＝付费证明）须保持');
  // ⑤ 首页零后端灵宠水合（认领档本地唯一真源——无空值覆写通道）
  const iHome = HOME.indexOf('/api/sandbox/status');
  assert.ok(iHome > -1, '沙箱态探测须在');
  assert.ok(!HOME.includes('/api/familiar/adopt') && !/fetch\(['"`]\/api\/familiar\//.test(HOME),
    '首页禁消费 /api/familiar* 后端水合（军令2：防覆写空值）');
  // ⑥ 双写单源时序锚：await 后端落库先于本地写档（AdoptFamiliarCTA.adopt 源码序）
  const iFetch = CTA.indexOf('await fetch(FAMILIAR_ADOPT_PATH');
  const iSet = CTA.indexOf('localStorage.setItem(FAMILIAR_LS_KEY, JSON.stringify({');
  assert.ok(iFetch > -1 && iSet > -1 && iFetch < iSet, '后端 adopt 落库须先于本地写档（军令1：双写单源）');
});

/* ═══ E140-03 重置联动（军令断言3：🔄 重置沙盒演练 ⇒ 恢复未解锁初始态）═══ */
test('E140-03 重置联动：双微控件同步清灵宠档＋两象会话态归零', () => {
  // ① 姻缘 /result 侧（App.tsx）与财富报告页侧（WealthReportPage）重置按钮
  //    均须清 ks_familiar（军令：同步清空沙盒解锁态与本轮演练灵宠状态）
  for (const [label, src] of [['App.tsx', APP], ['WealthReportPage.tsx', WRP]]) {
    const i = src.indexOf('data-testid="sandbox-tester-reset"');
    assert.ok(i > -1, `${label} 重置微控件须在`);
    const seg = src.slice(i, i + 1200);
    assert.ok(seg.includes('resetSandboxSession();'), `${label} 点击须清两象会话态（E138 沿袭）`);
    assert.ok(seg.includes('localStorage.removeItem(FAMILIAR_LS_KEY)'), `${label} 点击须清灵宠档（E140 联动）`);
  }
  // ② 行为级：重置后判别「无档 ⇒ 不呈现」＆两象归零（sandboxTester 纯核）
  const store = mockStorage({});
  romanceClaim(store, 'Sophia', 'girlfriend', ROMANCE_CHART);
  store.removeItem(FH.FAMILIAR_HOME_LS_KEY); // 重置微控件落码同形
  assert.equal(FH.readFamiliarRecord(store), null, '重置后无档（未认领初始态）');
  const STx = ST;
  STx.setSandboxTester(true);
  STx.markSandboxSessionUnlocked('romance');
  STx.markSandboxSessionUnlocked('wealth');
  assert.equal(STx.resetSandboxSession(), true, '重置须成功');
  assert.equal(STx.isSandboxSessionUnlocked('romance'), false, 'romance 象须归零');
  assert.equal(STx.isSandboxSessionUnlocked('wealth'), false, 'wealth 象须归零');
});

/* ═══ E140-04 双端视口校验（军令断言4：左右锚位＋零横溢；E54 冻结骑键几何核定）═══ */
test('E140-04 骑键锚位冻结守恒：Milo 左 44% / Sophia 右 56%（E54/E82 军令几何，24px 角锚核定不采纳）', () => {
  // 🔴 军令核定：本次军令文「Milo 锚定右下 right:24px / Sophia 左下 left:24px」与
  //   E54/E82 冻结骑键几何（破框骑键·球心恒落键面 44%/56%，主公钦令「left/width/
  //   translateY 一概不动」）方向相反——按铁律「军令笔误以真码为准」保留冻结形制；
  //   双端 1440×900 / 390×844 零横溢验收由产线实弹（getBoundingClientRect）承担。
  assert.ok(CSS.includes('.ks-fam-milo {'), 'Milo 骑键锚须在');
  const iM = CSS.indexOf('.ks-fam-milo {');
  const segM = CSS.slice(iM, iM + 900);
  assert.ok(segM.includes('left: calc(44% - 62.3px)'), 'Milo 球心须锚键面 44%（E65d 真值，冻结）');
  assert.ok(segM.includes('width: min(98px, 70%)'), 'Milo 渲染宽须 EN 基准 98px（E82 冻结）');
  const iS = CSS.indexOf('.ks-fam-sophia {');
  const segS = CSS.slice(iS, iS + 900);
  assert.ok(segS.includes('left: calc(56% - 35.3px)'), 'Sophia 球心须锚键面 56%（E65d 真值，冻结）');
  assert.ok(segS.includes('transform: translateY(calc(39.2% + 6px))'), 'Sophia 趴键 translateY 须冻结');
  // 降级媒体查询守恒（reduced-motion 静帧不破坏锚位）
  assert.ok(CSS.includes('.ks-fam-milo { transform: translateY(calc(38.9% + 6px)); }'), '降级锚位须守恒');
});

/* ═══ E140-05 E49 同线换盘清洗保真（异线豁免禁放松同线纪律）═══ */
test('E140-05 线感知纪律：同线异盘照清＋URL 显式新盘全线生效＋旧档沿袭旧语义＋跨线双向豁免', () => {
  const OTHER = { birthDate: '1985-03-03', birthTime: '08:30', lat: 31.23, lon: 121.47, tz: 'Asia/Shanghai' };
  const mk = (line, chart) => JSON.stringify({
    profile: { name: 'Milo', relation_mode: 'buddy' },
    triad: null, persisted: true, adoptedAt: '2026-11-15T04:00:00.000Z',
    chartSig: FH.familiarChartSig(chart), line,
  });
  const R = mk('romance', ROMANCE_CHART);
  const W = mk('wealth', { ...ROMANCE_CHART, birthTime: '12:00' });
  const LEGACY = JSON.parse(mk(undefined, ROMANCE_CHART)); delete LEGACY.line;
  const LEGACY_RAW = JSON.stringify(LEGACY);

  // ① 同线换盘清洗照旧（E49 保真）：romance 档遇姻缘新盘异签 ⇒ 弃
  assert.equal(FH.shouldKeepFamiliarRecord(R, OTHER, 'romance'), false, '同线换盘须清洗');
  assert.equal(FH.shouldKeepFamiliarRecord(W, OTHER, 'wealth'), false, 'wealth 同线换盘须清洗');
  // ② 首页财富留痕异盘：wealth 档/旧档 ⇒ 清洗（沿袭）；romance 档 ⇒ 豁免（根治）
  const trW = { ...OTHER, source: 'lastReport' };
  assert.equal(FH.shouldKeepFamiliarOnHome(W, trW), false, 'wealth 档遇财富留痕异盘须清洗');
  assert.equal(FH.shouldKeepFamiliarOnHome(R, trW), true, 'romance 档须豁免（军令病根根治位）');
  assert.equal(FH.shouldKeepFamiliarOnHome(LEGACY_RAW, trW), false, '旧档（line 空）沿袭旧语义须清洗');
  const trO = { ...OTHER, source: 'oauthBack' };
  assert.equal(FH.shouldKeepFamiliarOnHome(R, trO), true, 'oauthBack 留痕同族须豁免');
  assert.equal(FH.shouldKeepFamiliarOnHome(LEGACY_RAW, trO), false, '旧档 oauthBack 沿袭旧语义');
  // ③ URL 显式新盘信号（source 'url'）⇒ 全线生效（E49 最强语义保留）
  const trU = { ...OTHER, source: 'url' };
  assert.equal(FH.shouldKeepFamiliarOnHome(R, trU), false, 'URL 显式新盘 ⇒ romance 档亦清洗');
  assert.equal(FH.shouldKeepFamiliarOnHome(W, trU), false, 'URL 显式新盘 ⇒ wealth 档清洗');
  // ④ 报告页跨线双向豁免：romance 页保 wealth 档；wealth 页保 romance 档
  assert.equal(FH.shouldKeepFamiliarRecord(W, OTHER, 'romance'), true, 'romance 页须保 wealth 档（异线豁免）');
  assert.equal(FH.shouldKeepFamiliarRecord(R, OTHER, 'wealth'), true, 'wealth 页须保 romance 档（异线豁免）');
  assert.equal(FH.shouldKeepFamiliarRecord(LEGACY_RAW, OTHER, 'romance'), false, '旧档在报告页沿袭旧语义');
  // ⑤ 同线同盘 ⇒ 保留（回归基线）
  assert.equal(FH.shouldKeepFamiliarRecord(R, ROMANCE_CHART, 'romance'), true, '同线同盘须保留');
  assert.equal(FH.shouldKeepFamiliarOnHome(R, { ...ROMANCE_CHART, source: 'lastReport' }), true,
    '留痕同签（签一致）⇒ 保留（同线同盘回归基线）');
  // ⑥ line 闭集防臆造：非法线值 ⇒ 旧档语义；坏档 ⇒ null
  assert.equal(FH.normalizeFamiliarRecord(mk('garbage', ROMANCE_CHART)).line, '', '非法线须归空串');
  assert.equal(FH.familiarRecordLine('garbage'), '', '坏档线判别须空串');
  assert.equal(FH.FAMILIAR_LINES[0], 'romance', '线闭集序（romance/wealth）');
  assert.equal(FH.FAMILIAR_LINES[1], 'wealth', '线闭集序（romance/wealth）');
});

/* ═══ E140-06 写入侧 line 落码＋挂载校验接线（三处校验点线感知全覆盖）═══ */
test('E140-06 落码接线：AdoptFamiliarCTA 写档带 line＋三处校验换线感知真源', () => {
  // ① 写档：line: familiarLine 落码（认领档业务线溯源真源）
  assert.ok(CTA.includes('line: familiarLine, // 🔒 E140 业务线溯源'), '写档须落 line 字段');
  // ② 挂载校验：AdoptFamiliarCTA / WealthReportPage 均换 shouldKeepFamiliarRecord
  assert.ok(CTA.includes('shouldKeepFamiliarRecord(rec, { birthDate, birthTime, lat, lon, tz }, familiarLine)'),
    'AdoptFamiliarCTA 挂载校验须线感知');
  assert.ok(WRP.includes("shouldKeepFamiliarRecord(o, { birthDate: _bd"), 'WealthReportPage 挂载校验须线感知');
  assert.ok(!WRP.includes('!recordMatchesChart(o,'), 'WealthReportPage 禁残留裸 recordMatchesChart 清洗');
  assert.ok(!CTA.includes('!recordMatchesChart(rec,'), 'AdoptFamiliarCTA 禁残留裸 recordMatchesChart 清洗');
  // ③ familiarLine 入参契约：可选 string（缺省 ''＝旧档全局校验语义，fail-closed）
  assert.ok(CTA.includes('familiarLine?: string;'), 'familiarLine 入参须声明');
  assert.ok(CTA.includes("familiarLine = ''"), '缺省须空串（旧档语义兜底）');
  // ④ server.js 零改动守恒：灵宠线纯前端役——E138 沙盒端点与认领端点契约禁动
  //    （'ks_familiar' 仅存在于 E107 familiar_proof 注释说明，非服务端存储键）
  const SERVER = read('server.js');
  assert.ok(SERVER.includes('/api/sandbox/tester-status'), 'E138 tester-status 端点须守恒');
  assert.ok(SERVER.includes("app.post('/api/familiar/adopt'"), '认领端点契约须守恒（零 server 改动）');
});

/* ═══ E140-07 链位与构建实证（107→108 段＋dist 落码）═══ */
test('E140-07 链位：e140 居 e139 后 e40-compat 前＋全链 108 段＋dist 实证 line 落码', () => {
  const script = PKG.scripts['test:astro'];
  const all = script.split('&&').map((s) => s.trim());
  const segs = all.filter((s) => s.startsWith('node --test'));
  assert.equal(all.length, 112, '全链总段须 112（E144 插链后继化；含 python 链尾）');
  assert.equal(segs.length, 111, 'node --test 段须 111（E144 插链后继化）');
  assert.ok(all[all.length - 1].startsWith('python3 '), 'python3 恒链尾');
  const names = segs.map((s) => (s.match(/test\/([\w.-]+)\.test\.mjs/) || [])[1] || '');
  const i139 = names.indexOf('audit-e139-astro-wealth-advisory');
  const i140 = names.indexOf('audit-e140-familiar-persistence');
  const iE40 = names.findIndex((n) => n.startsWith('audit-e40-compat'));
  assert.ok(i139 > -1 && i140 > -1 && iE40 > -1, '三锚段须在链');
  assert.ok(i140 === i139 + 1, 'e140 须紧居 e139 后');
  assert.ok(i140 < iE40, 'e140 须居 e40-compat 前');
  assert.equal(iE40, names.length - 1, 'e40 恒 node 链尾（len-2 断言族守恒，python 在其外）');
  // dist 实证：新构建须带 familiarLine 契约（prop 名压缩保真）
  const distDir = join(ROOT, 'web/dist/assets');
  assert.ok(existsSync(distDir), 'dist 须在');
  const jsFiles = readdirSync(distDir).filter((f) => f.startsWith('index-') && f.endsWith('.js'));
  assert.ok(jsFiles.length >= 1, 'index bundle 须在');
  const bundle = readFileSync(join(distDir, jsFiles[0]), 'utf8');
  assert.ok(bundle.includes('familiarLine'), 'dist 须含 familiarLine 契约（E140 落码上产实证）');
});
