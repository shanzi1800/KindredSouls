/**
 * audit-e134-aesthetic-25d-route-map.test.mjs —— E134 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E134-AESTHETIC-25D-ROUTE-MAP：对话舱路书卡原位升维 2.5D 暗金等高线
 *   意境地图、三段式星轨路牌与一键唤醒原生地图导航】
 * 九组断言（军令钦定 DoD）：
 *   E134-01 军师词表六语逐字（5 键 × 6 语——对照表逐字录入零再创作）；
 *   E134-02 waypoints 数据结构（10 套 roadtrip 模板 × 3 站：name/query 非空＋
 *          sponsor_badge/secret_code 槽位预埋恒 null）；
 *   E134-03 一键原生导航深链行为（google.com/maps/dir/ 三途经完整参数＋
 *          encodeURIComponent；fail-closed：残站/空 query ⇒ null）；
 *   E134-04 沙盘几何单源（ROADTRIP_MAP_SPEC：等高线色军令钦定＋三节点＋
 *          画布安全区 [141,933]）；
 *   E134-05 SVG 沙盘组件锚（viewBox/贝塞尔航线/呼吸 animate/三路牌
 *          data-testid/双侧防溢出 clamp/地名截断）；
 *   E134-06 插槽升维锚（roadtrip 分支挂 RoadtripRouteMap＋导航 <a
 *          target="_blank" rel="noopener noreferrer"＋E126 三处取卡锚不破＋
 *          style 分支 E124 版式零改动）；
 *   E134-07 画布沙盘锚（drawRouteMapEmblem 接线＋路牌 fillText 语义落布＋
 *          安全区 clamp 源码锚＋mock 降级兼容）；
 *   E134-08 零收银红线（沙盘/插槽零价格字眼零 sponsor 渲染——E130 对话舱
 *          纯净纪律；ChatSheet 零改动零回归）；
 *   E134-S 链位自保（e134 入编：e133 后、e40-compat 前；全链 101→102 段）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）。
 * 执行命令：node --test test/audit-e134-aesthetic-25d-route-map.test.mjs
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const LANGS = ['zh', 'en', 'es', 'fr', 'th', 'vi'];

/* ── 模块加载（pathToFileURL：中文仓路径铁律）────────────────────────── */
const DATA = await import(pathToFileURL(join(ROOT, 'web/src/lib/lifestyleMuseData.mjs')).href);
const LINK = await import(pathToFileURL(join(ROOT, 'web/src/lib/nativeMapDeepLink.mjs')).href);
const REN = await import(pathToFileURL(join(ROOT, 'web/src/lib/lifestyleCanvasRenderer.mjs')).href);

/* ── 军师词表真值（军令对照表逐字）────────────────────────────── */
const CHIEF_TABLE = {
  zh: { w1: '启程·醒神', w2: '驻足·纳气', w3: '归宿·枕星', nav: '✦ 导入原生地图，开启导航', sub: '2.5D 星轨气场漫游沙盘' },
  en: { w1: 'Dawn Awakening', w2: 'Aura Absorption', w3: 'Starlit Sanctuary', nav: '✦ Open Route in Maps', sub: '2.5D Celestial Aura Route' },
  fr: { w1: "Éveil de l'Aube", w2: 'Immersion Astrale', w3: 'Sanctuaire Étoilé', nav: "✦ Ouvrir l'itinéraire dans Plans", sub: "Carte Astrale d'Itinéraire 2.5D" },
  es: { w1: 'Despertar del Alba', w2: 'Absorción de Aura', w3: 'Santuario Estelar', nav: '✦ Abrir ruta en Mapas', sub: 'Mapa de Ruta Astral 2.5D' },
  th: { w1: 'จุดเริ่มต้น·ปลุกพลัง', w2: 'จุดพัก·รับพลังจักรวาล', w3: 'จุดหมาย·พักพิงใต้ดาว', nav: '✦ เปิดเส้นทางในแอปแผนที่', sub: 'แผนที่เส้นทางพลังงานดวงดาว 2.5D' },
  vi: { w1: 'Khởi Hành · Tỉnh Thức', w2: 'Dừng Chân · Nạp Khí', w3: 'Điểm Đến · Gối Sao', nav: '✦ Mở lộ trình trong Bản đồ', sub: 'Bản Đồ Lộ Trình Khí Trường 2.5D' },
};

/* ── 全部 10 套 roadtrip 模板键（6 基准＋4 geo 变体）────────────────── */
const ALL_ROADTRIP_KEYS = [
  ...LANGS.map((l) => [l, undefined]),
  ['zh', 'NA'], ['zh', 'AU'], ['fr', 'AU'], ['en', 'SEA'],
];

/* ═══════════ E134-01：军师词表六语逐字 ═══════════ */
test('E134-01 军师词表六语逐字（5 键 × 6 语零再创作）', () => {
  for (const l of LANGS) {
    const ui = DATA.ROADTRIP_ROUTE_UI[l];
    assert.ok(ui, `${l} 语词表缺失`);
    const t = CHIEF_TABLE[l];
    assert.equal(ui.waypoint_1_tag, t.w1, `${l} waypoint_1_tag 逐字不符`);
    assert.equal(ui.waypoint_2_tag, t.w2, `${l} waypoint_2_tag 逐字不符`);
    assert.equal(ui.waypoint_3_tag, t.w3, `${l} waypoint_3_tag 逐字不符`);
    assert.equal(ui.open_native_map, t.nav, `${l} open_native_map 逐字不符`);
    assert.equal(ui.route_map_subtitle, t.sub, `${l} route_map_subtitle 逐字不符`);
  }
  // 零 i18n 新键（基准 123 不动——自容字典先例 E121+）
  const i18n = read('web/src/i18n/index.ts');
  assert.ok(!i18n.includes('WAYPOINT_1_TAG') && !i18n.includes('OPEN_NATIVE_MAP'), 'i18n 真源混入 E134 新键（须自容字典）');
});

/* ═══════════ E134-02：waypoints 数据结构 ═══════════ */
test('E134-02 waypoints 三站结构（10 套 roadtrip 全配备＋赞助槽位预埋 null）', () => {
  for (const [l, zone] of ALL_ROADTRIP_KEYS) {
    const tpl = DATA.getLifestyleTemplate('roadtrip', l, zone);
    const key = zone ? `${l}@${zone}` : l;
    assert.ok(tpl, `${key} roadtrip 模板缺失`);
    assert.ok(Array.isArray(tpl.waypoints) && tpl.waypoints.length >= 3, `${key} waypoints 须 ≥3 站`);
    for (let i = 0; i < 3; i++) {
      const w = tpl.waypoints[i];
      assert.ok(w && String(w.name || '').trim(), `${key} 第 ${i + 1} 站 name 缺失`);
      assert.ok(String(w.query || '').trim(), `${key} 第 ${i + 1} 站 query 导航串缺失`);
      assert.strictEqual(w.sponsor_badge, null, `${key} 第 ${i + 1} 站 sponsor 槽位须默认 null`);
      assert.strictEqual(w.secret_code, null, `${key} 第 ${i + 1} 站 secret_code 槽位须默认 null`);
    }
  }
  // geo 变体真实坐标（zh@NA 三站全北美——E126 精神沿袭：无中国地名倒灌）
  const zhNA = DATA.getLifestyleTemplate('roadtrip', 'zh', 'NA');
  const zhNAQ = zhNA.waypoints.map((w) => w.query).join('|');
  assert.ok(/Big Sur/.test(zhNAQ) && /Catskills/.test(zhNAQ), 'zh@NA 三站须北美真实坐标');
  assert.ok(!/Moganshan|Anji/.test(zhNAQ), 'zh@NA 严禁中国坐标倒灌');
  // roadtripWaypointsOf 同源取站（fail-closed）
  assert.equal(LINK.roadtripWaypointsOf(null), null, '坏模板须 null');
  assert.equal(LINK.roadtripWaypointsOf({ waypoints: [{ query: 'x' }] }), null, '不足三站须 null');
  const wp = LINK.roadtripWaypointsOf(DATA.getLifestyleTemplate('roadtrip', 'zh'));
  assert.equal(wp.length, 3, 'zh 基准三站须完整');
});

/* ═══════════ E134-03：一键原生导航深链行为 ═══════════ */
test('E134-03 深链行为：Google Maps 多途经完整参数＋fail-closed', () => {
  const wp = DATA.getLifestyleTemplate('roadtrip', 'zh').waypoints;
  const url = LINK.buildMultiStopMapsUrl(wp);
  assert.ok(url, 'zh 三站须出 URL');
  // 军令钦定 URL 形态逐段断言
  assert.ok(url.startsWith('https://www.google.com/maps/dir/?api=1'), 'URL 前缀形态不符（军令钦定）');
  assert.ok(url.includes(`&origin=${encodeURIComponent(wp[0].query)}`), 'origin 参数不符（第一站）');
  assert.ok(url.includes(`&destination=${encodeURIComponent(wp[2].query)}`), 'destination 参数不符（第三站）');
  assert.ok(url.includes(`&waypoints=${encodeURIComponent(wp[1].query)}`), 'waypoints 参数不符（第二站途经）');
  assert.ok(url.endsWith('&travelmode=driving'), 'travelmode 须 driving');
  // encodeURIComponent 真实生效：含空格/逗号的 query 必须 percent-encode（严禁裸拼）
  assert.ok(!/[ ]/.test(url), 'URL 严禁裸空格（须 %20 percent-encode）');
  assert.ok(url.includes(encodeURIComponent(wp[0].query)), 'query 须 encodeURIComponent 全形');
  // fail-closed 三象
  assert.equal(LINK.buildMultiStopMapsUrl(null), null, 'null 须弃权');
  assert.equal(LINK.buildMultiStopMapsUrl([{ query: 'a' }, { query: 'b' }]), null, '两站须弃权');
  assert.equal(LINK.buildMultiStopMapsUrl([{ query: 'a' }, { query: '' }, { query: 'c' }]), null, '空导航串须弃权');
  // openNativeMapUrl 白名单守卫（node 无 window ⇒ false 降级不炸）
  assert.equal(LINK.openNativeMapUrl(url), false, 'node 无 window 须安全降级 false');
  assert.equal(LINK.openNativeMapUrl('https://evil.example.com/dir/'), false, '非 Maps dir 白名单须拒');
  // 六语三站全量出链（E126 变体含内）
  for (const [l, zone] of ALL_ROADTRIP_KEYS) {
    const u = LINK.buildMultiStopMapsUrl(DATA.getLifestyleTemplate('roadtrip', l, zone).waypoints);
    assert.ok(u && u.includes('google.com/maps/dir/'), `${zone ? l + '@' + zone : l} 须出深链`);
  }
});

/* ═══════════ E134-04：沙盘几何单源 ═══════════ */
test('E134-04 ROADTRIP_MAP_SPEC 几何单源（军令钦定色＋三节点＋安全区）', () => {
  const spec = DATA.ROADTRIP_MAP_SPEC;
  assert.equal(spec.viewBoxWidth, 320, 'SVG viewBox 宽须 320');
  assert.equal(spec.viewBoxHeight, 210, 'SVG viewBox 高须 210');
  assert.equal(spec.contourColor, 'rgba(212,175,55,0.16)', '等高线色须军令钦定 rgba(212,175,55,0.16)');
  assert.ok(spec.contourLayers >= 4 && spec.contourLayers <= 5, '等高线层数须 4~5 层（军令钦定）');
  assert.equal(spec.routeColor, '#D4AF37', '航线色须金色 #D4AF37');
  assert.equal(spec.nodes.length, 3, '须恰三节点');
  // 三节点方向语义：起点左下（nx<0.3 且 ny>0.6）、转折中右、终点右上（nx>0.7 且 ny<0.3）
  const [n1, n2, n3] = spec.nodes;
  assert.ok(n1.nx < 0.3 && n1.ny > 0.6, '① 启程路牌须左下');
  assert.ok(n2.nx > 0.45 && n2.nx < 0.75, '② 驻足路牌须中右');
  assert.ok(n3.nx > 0.7 && n3.ny < 0.3, '③ 归宿路牌须右上');
  // 画布安全区（军令钦定 x∈[141,933]）
  assert.deepEqual({ ...spec.canvasSafeX }, { minX: 141, maxX: 933 }, '画布路牌安全区须 [141,933]');
});

/* ═══════════ E134-05：SVG 沙盘组件锚 ═══════════ */
test('E134-05 SVG 沙盘组件锚（贝塞尔＋呼吸光晕＋三路牌＋防溢出）', () => {
  const src = read('web/src/components/companion/RoadtripRouteMap.tsx');
  assert.ok(src.includes('data-testid="roadtrip-route-map"'), '沙盘容器 testid 缺失');
  assert.ok(/M \$\{P\[0\]\.x\},\$\{P\[0\]\.y\} C /.test(src) || src.includes('C ${c1.x},${c1.y}'), '金色三次贝塞尔航线缺失（军令钦定）');
  assert.ok(src.includes('<animate attributeName="opacity"'), '呼吸光晕 animate 缺失（军令钦定）');
  assert.ok(src.includes('feGaussianBlur'), '航线 glow filter 缺失');
  assert.ok(src.includes('ROADTRIP_MAP_SPEC.contourColor'), '等高线色未走 ROADTRIP_MAP_SPEC 单源');
  // 三路牌 testid 模板（data-testid={`roadtrip-waypoint-plate-${i + 1}`}——一条锁三牌）
  assert.ok(src.includes('roadtrip-waypoint-plate-${i + 1}'), '三路牌 testid 模板缺失');
  assert.ok(src.includes('VW - w - 6'), '路牌双侧防溢出 clamp 缺失');
  assert.ok(src.includes('clipPlaceName'), '超长地名截断缺失（军令钦定）');
  assert.ok(src.includes('waypoint_1_tag') && src.includes('route_map_subtitle'), '词表消费缺失');
  // 🔴 零 sponsor 渲染（100K 槽位在场不渲染）
  assert.ok(!src.includes('sponsor_badge &&'), '沙盘严禁 sponsor 条件渲染（100K 前纯净）');
});

/* ═══════════ E134-06：插槽升维锚（style 零改动＋导航 <a>）═══════════ */
test('E134-06 插槽升维锚：roadtrip 挂沙盘＋导航 <a>；style E124 版式零改动', () => {
  const src = read('web/src/components/companion/LifestyleMuseSlot.tsx');
  // roadtrip 分支升维锚
  assert.ok(src.includes('<RoadtripRouteMap'), 'roadtrip 分支未挂 2.5D 沙盘');
  assert.ok(src.includes("import RoadtripRouteMap from './RoadtripRouteMap'"), '沙盘组件 import 缺失');
  assert.ok(src.includes('buildMultiStopMapsUrl'), '深链组装消费缺失');
  assert.ok(src.includes('roadtripWaypointsOf'), '三站安全取值消费缺失');
  assert.ok(src.includes('target="_blank"'), '导航须新标签页（iOS WebKit 兼容）');
  assert.ok(src.includes('rel="noopener noreferrer"'), '导航须 noopener noreferrer（对话舱零跳出）');
  assert.ok(src.includes('data-testid="roadtrip-native-nav-btn"'), '导航按钮 testid 缺失');
  assert.ok(src.includes('open_native_map'), '按钮文案未走军师词表');
  // E126 三处取卡锚不破（GEO_ZONE 三参形态 ≥3 处）
  const calls = (src.match(/getLifestyleTemplate\(type, \(lang as Lang\), GEO_ZONE \|\| undefined\)/g) || []).length;
  assert.ok(calls >= 3, `插槽三处取卡锚须 ≥3（实为 ${calls}）`);
  // style 分支 E124 版式零改动：横排徽章三色盘＋l.viewStyle CTA 仍在
  assert.ok(src.includes('l.viewStyle'), 'style CTA 军令句式须保留');
  assert.ok(src.includes('display: \'flex\', alignItems: \'center\', gap: 12'), 'style 横排版式须零改动');
  assert.ok(src.includes('l.renderFail'), 'E124 字典全量须保留（fail 文案在）');
  // E124-10 军令句式仍全在字典
  for (const s of ['气场穿搭灵感笺', 'Aura Style Capsule', '漫游自驾避坑路书', 'Soul Roadtrip Guide', '保存高清卡片', 'Save High-Res Card']) {
    assert.ok(src.includes(s), `E124 军令字典句式缺失：「${s}」`);
  }
});

/* ═══════════ E134-07：画布沙盘锚（1080×1748 同步绘制＋安全区）═══════════ */
test('E134-07 画布沙盘：drawRouteMapEmblem 接线＋路牌语义落布＋安全区锁', () => {
  const src = read('web/src/lib/lifestyleCanvasRenderer.mjs');
  assert.ok(src.includes('function drawRouteMapEmblem'), '画布沙盘函数缺失');
  assert.ok(src.includes('drawRouteMapEmblem(ctx, W, template, cfg, locale)'), '沙盘未接线 roadtrip 分支（Layer 2）');
  assert.ok(src.includes('bezierCurveTo'), '画布航线须三次贝塞尔（军令钦定）');
  assert.ok(src.includes('ROADTRIP_MAP_SPEC.canvasSafeX.minX'), '安全区 minX 锚缺失');
  assert.ok(src.includes('ROADTRIP_MAP_SPEC.canvasSafeX.maxX - pw'), '安全区 maxX clamp 锚缺失');
  assert.ok(src.includes('ROADTRIP_ROUTE_UI[locale]'), '画布路牌 tag 未走六语词表');
  assert.ok(src.includes('typeof ctx.ellipse') && src.includes('typeof ctx.bezierCurveTo'), 'mock ctx 能力降级守卫缺失（node:test 兼容）');
  // 行为：mock 画布渲染 roadtrip ⇒ 三路牌 tag＋地名＋沙盘副题全落布
  const calls = { fillText: [] };
  const ctx = {
    fillText: (t) => { calls.fillText.push(String(t)); },
    drawImage: () => {}, measureText: (t) => ({ width: Math.min(String(t).length * 20, 700) }),
    fillRect: () => {}, strokeRect: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
    stroke: () => {}, fill: () => {}, arc: () => {}, closePath: () => {},
    arcTo: () => {}, save: () => {}, restore: () => {}, setTransform: () => {},
    roundRect: () => {},
    // 🔴 无 ellipse/bezierCurveTo ⇒ 能力降级路径（折线/圆弧）必须不炸
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  return REN.renderLifestyleToCanvas(canvas, DATA.getLifestyleTemplate('roadtrip', 'zh'), 'zh', { type: 'roadtrip', hostName: '山子' })
    .then(() => {
      const all = calls.fillText.join('\n');
      assert.ok(all.includes('启程·醒神') && all.includes('驻足·纳气') && all.includes('归宿·枕星'), '三路牌 tag 未落画布');
      assert.ok(all.includes('莫干山'), '路牌地名未落画布');
      assert.ok(all.includes('2.5D 星轨气场漫游沙盘'), '沙盘副题未落画布');
      // E124-09 既有语义不回归（title/prose/域名/章仍在）
      assert.ok(all.includes('漫游自驾避坑路书') || all.includes('✦ 漫游自驾避坑路书 ✦'), 'E124 title 语义回归');
      assert.ok(all.includes('kindredsouls.online'), '官方域名回归');
      assert.ok(all.includes('KS-ROADTRIP-'), '防伪章回归');
    });
});

/* ═══════════ E134-08：零收银红线（E130 对话舱纯净）═══════════ */
test('E134-08 零收银红线：沙盘/插槽零价格字眼＋ChatSheet 零改动', () => {
  const slotSrc = read('web/src/components/companion/LifestyleMuseSlot.tsx');
  const mapSrc = read('web/src/components/companion/RoadtripRouteMap.tsx');
  const linkSrc = read('web/src/lib/nativeMapDeepLink.mjs');
  for (const [name, src] of [['slot', slotSrc], ['map', mapSrc], ['link', linkSrc]]) {
    assert.ok(!/\$\d/.test(src), `${name} 严禁价格字眼（E130）`);
    assert.ok(!src.includes('sponsor_badge &&'), `${name} 严禁 sponsor 条件渲染（100K 前纯净）`);
    assert.ok(!/广告|sponsor logo|AD badge/i.test(src), `${name} 严禁广告字样`);
  }
  // ChatSheet 零改动锚（E124-12 既有锚原样在）
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(sheet.includes('lifestyleSlot && !scribeSlot && !streaming'), 'ChatSheet 互斥守卫被扰动（零回归红线）');
  assert.ok(!sheet.includes('RoadtripRouteMap'), 'ChatSheet 严禁直接挂沙盘（升维封装在插槽内部）');
});

/* ═══════════ E134-S：链位自保 ═══════════ */
test('E134-S 链位自保：e134 入编（e133 后、e40-compat 前；全链 101→102 段）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 102, `军规链段数须为 102（E134 入编后 101→102；实为 ${segs.length}）`);
  const iE134 = segs.findIndex((s) => s.includes('audit-e134-aesthetic-25d-route-map'));
  const iE133 = segs.findIndex((s) => s.includes('audit-e133-romance-paywall-parity'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat'));
  const iPy = segs.findIndex((s) => s.includes('audit_v492_peak_window.py'));
  assert.ok(iE134 !== -1, 'e134 未入编 test:astro');
  assert.ok(iE133 !== -1 && iE134 === iE133 + 1, 'e134 须紧随 e133（版本序）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 须恒为链尾');
  assert.ok(iE134 < iCap, 'e134 须居 e40-compat 之前');
});
