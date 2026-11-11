// ═══ E136 闸门：漫游路书沙盘外框两端拉齐＋上下等距纵向扩容（主公军令 2026-11-11）═══
// 刀一（左右齐平）：1080×1748 漫游路书卡 2.5D 沙盘外框左右两翼锚定正文 ink 基准
//   （prose＋whisper 全行极值 measureLineExtremes 真源）——mapX = textLeft、
//   mapWidth = textWidth（Δleft = Δright = 0px）；canvasSafeX [141,933] 严守。
// 刀二（上下等距纵向扩容）：Y 带恒 [hostLineY+40, proseTopY-32]（上/下呼吸各 32px
//   ——沙盘高度 328→450）；等高线 sc 缩放比新画幅重算；三路牌/小罗盘 ZONE 相对化。
// 刀三（双渲染域同源）：对话舱 SVG（RoadtripRouteMap）继续消费 ROADTRIP_MAP_SPEC
//   单源（nodes/viewBox）；ChatSheet 零改动红线（E134-08 承袭）。
// 链位：e136 入编 e135 后、e40-compat 前；全链 103→104 段。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const REN = await import(join(ROOT, 'web/src/lib/lifestyleCanvasRenderer.mjs'));
const DATA = await import(join(ROOT, 'web/src/lib/lifestyleMuseData.mjs'));
const SAFE = DATA.ROADTRIP_MAP_SPEC.canvasSafeX; // { minX: 141, maxX: 933 }（E134 钦定）

/* ═══ E136-A 刀一：computeRoadtripMapZone 纯函数——左右两端像素齐平（Δ=0）═══ */
test('E136-A 沙盘外框锚正文 ink 基准：两端 Δ=0px＋安全区 [141,933] clamp 严守', () => {
  assert.equal(typeof REN.computeRoadtripMapZone, 'function', 'computeRoadtripMapZone 单源纯函数缺失');

  // ① 正文 ink 基准原样透传（zh 真浏览器典型 ≈ [162,918]）——两端 Δ=0（军令断言 1）
  const z1 = REN.computeRoadtripMapZone({ minX: 162, maxX: 918 });
  assert.equal(z1.x0, 162, 'mapX 须 === textLeft（Δleft=0）');
  assert.equal(z1.x1, 918, 'mapRight 须 === textRight（Δright=0）');
  assert.equal(z1.x1 - z1.x0, 918 - 162, 'mapWidth 须 === textWidth');

  // ② 安全区严守：超宽 ink 被 [141,933] 双侧 clamp（军令断言 2）
  const z2 = REN.computeRoadtripMapZone({ minX: 100, maxX: 960 });
  assert.equal(z2.x0, SAFE.minX, '左溢须 clamp 到安全区 minX');
  assert.equal(z2.x1, SAFE.maxX, '右溢须 clamp 到安全区 maxX');
  assert.ok(z2.x0 >= SAFE.minX && z2.x1 <= SAFE.maxX, '外框须 100% 落 [141,933]');

  // ③ fail-closed：坏基准（null/undefined/倒置）退全幅安全区
  for (const bad of [null, undefined, {}, { minX: NaN, maxX: 900 }, { minX: 500, maxX: 400 }]) {
    const zb = REN.computeRoadtripMapZone(bad);
    assert.equal(zb.x0, SAFE.minX, `坏基准 ${JSON.stringify(bad)} 须退安全区左沿`);
    assert.equal(zb.x1, SAFE.maxX, `坏基准 ${JSON.stringify(bad)} 须退安全区右沿`);
  }

  // ④ 部分溢出：只 clamp 溢出侧，齐平侧 Δ=0 保持
  const z3 = REN.computeRoadtripMapZone({ minX: 180, maxX: 950 });
  assert.equal(z3.x0, 180, '未溢出侧须原样齐平');
  assert.equal(z3.x1, SAFE.maxX, '溢出侧单边 clamp');
});

/* ═══ E136-B 刀二：上下等距纵向扩容——Y 带恒定＋上下呼吸留白各 32px ═══ */
test('E136-B 沙盘 Y 带纵向扩容：[hostLineY+40, proseTopY-32] 恒锚＋上下呼吸各 32px', () => {
  const z = REN.computeRoadtripMapZone({ minX: 162, maxX: 918 });
  assert.equal(z.y0, 298, '上框须 hostLineY+40（host 基线 258＋字形底 ≈266 ⇒ 上呼吸 32px）');
  assert.equal(z.y1, 748, '下框须 proseTopY-32（下呼吸 32px——军令断言 3）');
  assert.equal(z.y1 - z.y0, 450, '沙盘高度须 328→450 纵向舒展（2.5D 景深呼吸）');
  // 上下呼吸留白量化（对 hostLine 基线 258 / proseTopY 780）
  assert.ok(z.y0 - 266 >= 32, '上呼吸留白须 ≥32px');
  assert.ok(780 - z.y1 >= 32, '下呼吸留白须 ≥32px');
  assert.equal(z.y0 - 266, 780 - z.y1, '上下留白须均匀等距（军令钦定）');
});

/* ═══ E136-C 渲染器源级锚：旧硬编码拔除＋ink 真源消费＋内部元素相对化 ═══ */
test('E136-C 渲染器源级：旧 ZONE 硬编码拔除＋measureLineExtremes 接线＋相对化锚', () => {
  const src = read('web/src/lib/lifestyleCanvasRenderer.mjs');
  // ① E134 旧绝对值硬编码全数拔除（防回潮）
  assert.ok(!src.includes('x0: 190'), '旧 ZONE.x0=190 残留');
  assert.ok(!src.includes('x1: 890'), '旧 ZONE.x1=890 残留');
  assert.ok(!src.includes('y0: 306'), '旧 ZONE.y0=306 残留');
  assert.ok(!src.includes('y1: 634'), '旧 ZONE.y1=634 残留');
  assert.ok(!src.includes('cx: 281') && !src.includes('cx: 610') && !src.includes('cx: 792'), '旧路牌绝对坐标残留');
  assert.ok(!src.includes('compX = 845') && !src.includes('compY = 345'), '旧小罗盘绝对坐标残留');
  // ② ink 真源消费＋签名随行（E134-07 同步锚）
  assert.ok(src.includes('measureLineExtremes'), '正文 ink 极值未走 canvasTypographyEngine 真源');
  assert.ok(src.includes('drawRouteMapEmblem(ctx, W, template, cfg, locale, textExtremes)'), '沙盘未随行正文 ink 基准');
  assert.ok(src.includes('computeRoadtripMapZone(textExtremes)'), 'ZONE 未走单源纯函数');
  // ③ 内部元素相对化锚（等高线/三路牌/小罗盘随新画幅自适应）
  assert.ok(/const sc = Math\.min\(ZW \/ 700, ZH \/ 328\)/.test(src), '等高线缩放比锚缺失（新画幅重算）');
  assert.ok(src.includes('ZONE.x0 + geo.fx * ZW'), '三路牌未 ZONE 相对化');
  assert.ok(src.includes('ZONE.x1 - 45'), '小罗盘未 ZONE 相对化');
  // ④ 排版预计算提前（字距先归零——E125 血训锚承袭）
  assert.ok(src.indexOf('measureLineExtremes(ctx, proseLines)') < src.indexOf('else drawRouteMapEmblem('),
    'ink 基准须先于沙盘绘制算出（Layer 2 预计算）');
});

/* ═══ E136-D mock 行为：沙盘矩形落位（298/450/安全区内）＋e134 语义全不回归 ═══ */
test('E136-D mock 渲染行为：沙盘矩形 Y 带/安全区落位＋三路牌/副题语义不回归', async () => {
  const rects = [];
  const texts = [];
  const ctx = {
    fillText: (t) => { texts.push(String(t)); },
    drawImage: () => {}, measureText: (t) => ({ width: Math.min(String(t).length * 20, 700) }),
    fillRect: (x, y, w, h) => { rects.push(['fill', x, y, w, h]); },
    strokeRect: (x, y, w, h) => { rects.push(['stroke', x, y, w, h]); },
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
    stroke: () => {}, fill: () => {}, arc: () => {}, closePath: () => {},
    arcTo: () => {}, save: () => {}, restore: () => {}, setTransform: () => {},
    roundRect: () => {},
    // 🔴 无 ellipse/bezierCurveTo ⇒ 能力降级路径（折线/圆弧）必须不炸
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  await REN.renderLifestyleToCanvas(canvas, DATA.getLifestyleTemplate('roadtrip', 'zh'), 'zh', {
    type: 'roadtrip', hostName: '山子',
  });
  // 沙盘底矩形识别：y === 298（Y 带恒锚）且宽 ∈ (300, 800)（正文 ink 六语自适应）
  const zoneRects = rects.filter(([k, x, y, w]) => k === 'fill' && y === 298 && w > 300 && w < 800);
  assert.ok(zoneRects.length >= 1, `沙盘底矩形未落 Y 带 298（实得 rects：${JSON.stringify(rects.filter(r => r[0] === 'fill').map(r => r.slice(1)))}）`);
  for (const [, x, y, w, h] of zoneRects) {
    assert.equal(y, 298, '沙盘 y 须 298（hostLineY+40）');
    assert.equal(h, 450, '沙盘高须 450（E136 纵向扩容）');
    assert.ok(x >= SAFE.minX, '沙盘 x 须 ≥ 安全区 minX（141）');
    assert.ok(x + w <= SAFE.maxX, '沙盘右沿须 ≤ 安全区 maxX（933）');
  }
  // E134 语义全不回归（三路牌/地名/副题/标题/域名/防伪章）
  const all = texts.join('\n');
  assert.ok(all.includes('启程·醒神') && all.includes('驻足·纳气') && all.includes('归宿·枕星'), '三路牌 tag 未落画布');
  assert.ok(all.includes('莫干山'), '路牌地名未落画布');
  assert.ok(all.includes('2.5D 星轨气场漫游沙盘'), '沙盘副题未落画布');
  assert.ok(all.includes('漫游自驾避坑路书'), 'E124 title 语义回归');
  assert.ok(all.includes('kindredsouls.online'), '官方域名回归');
  assert.ok(all.includes('KS-ROADTRIP-'), '防伪章回归');
});

/* ═══ E136-E 双渲染域同源：SVG 零改动单源消费＋ChatSheet 红线（E134-08 承袭）═══ */
test('E136-E 双渲染域同源：SVG 继续 ROADTRIP_MAP_SPEC 单源＋ChatSheet 零改动红线', () => {
  const mapSrc = read('web/src/components/companion/RoadtripRouteMap.tsx');
  assert.ok(mapSrc.includes('ROADTRIP_MAP_SPEC.viewBoxWidth'), 'SVG 画幅未走单源 viewBox');
  assert.ok(mapSrc.includes('ROADTRIP_MAP_SPEC.nodes') || /N\.map\(\(n[^\)]*nx[^\)]*ny[^\)]*\)\)/.test(mapSrc),
    'SVG 三节点未走单源归一坐标');
  assert.ok(mapSrc.includes('ROADTRIP_MAP_SPEC.contourColor'), 'SVG 等高线色未走单源');
  assert.ok(!mapSrc.includes('190') && !mapSrc.includes('890'), 'SVG 不得混入 Canvas 绝对锚');
  // ChatSheet 零改动红线（沙盘封装在插槽内部——E134 承袭）
  const sheet = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(!sheet.includes('RoadtripRouteMap'), 'ChatSheet 严禁直接挂沙盘');
  assert.ok(sheet.includes('lifestyleSlot && !scribeSlot && !streaming'), 'ChatSheet 互斥守卫被扰动');
});

/* ═══ E136-S：链位自保 ═══ */
test('E136-S 链位自保：e136 入编（e135 后、e40-compat 前；全链 103→104 段）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 104, `军规链段数须为 104（E136 入编后 103→104；实为 ${segs.length}）`);
  const iE136 = segs.findIndex((s) => s.includes('audit-e136-roadtrip-map-frame-align'));
  const iE135 = segs.findIndex((s) => s.includes('audit-e135-chat-geometry-pills'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat'));
  const iPy = segs.findIndex((s) => s.includes('audit_v492_peak_window.py'));
  assert.ok(iE136 !== -1, 'e136 未入编 test:astro');
  assert.ok(iE135 !== -1 && iE136 === iE135 + 1, 'e136 须紧随 e135（版本序）');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 须恒为链尾');
  assert.ok(iE136 < iCap, 'e136 须居 e40-compat 之前');
});
