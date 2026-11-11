/**
 * audit-e124-lifestyle-muse.test.mjs —— E124 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E124-LIFESTYLE-MUSE：全语言生活区认知注入、意图探测拓展与 Canvas
 *   穿搭/路书双模板】
 * 十二组断言（军令钦定 DoD）：
 *   E124-01 意图网正例：六语 STYLE_INTENT 语料逐条命中（穿什么/what to wear/
 *          quoi porter/qué ponerme/แต่งตัว/mặc gì…）；
 *   E124-02 意图网正例：六语 ROADTRIP_INTENT 语料逐条命中（自驾/road trip/
 *          escapade/escapada/ทริปขับรถ/phượt…）；
 *   E124-03 fail-closed 静默：日常寒暄语料（今天天气不错/早安/thanks…）一律
 *          null 严禁误触；
 *   E124-04 12 套六语模板完整性（style/roadtrip × 6 语全字段齐备）；
 *   E124-05 style 色盘真值：3 组 hex＋名称（# 十六进制形状守卫）；
 *   E124-06 roadtrip 吉方真值：heading 度数＋六语名称；
 *   E124-07 Canvas 黄金比例 1080×1748（复用 AMULET 常量——容差 <0.001）；
 *   E124-08 防伪章前缀 KS-STYLE-/KS-ROADTRIP- 装配（Mock Canvas 语义断言）；
 *   E124-09 渲染语义：title/subtitle/prose/whisper/吉时标牌/域名全落画布；
 *   E124-10 六语插槽字典完整性（军令 7 键对照表逐键逐语）；
 *   E124-11 server 侧锚：LIFESTYLE_GROUNDING 六语块＋prompt 数组注入＋
 *          「小众质感」红线在籍；
 *   E124-12 前端接线锚：ChatSheet detectLifestyleIntent 链（密函静默接管）＋
 *          LifestyleMuseSlotCard/LifestylePreviewModal 挂载＋零 i18n 新键
 *          （i18n 基准 123 不动）＋导出文件名军令格式。
 *   S13 链位自保：e124 入编（e120 后、e40-compat 前；全链 92→93 段）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）；
 *    渲染器 node 桩降级（无 DOM ⇒ 语义断言不受影响）。
 * 执行命令：node --test test/audit-e124-lifestyle-muse.test.mjs
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
const INT = await import(pathToFileURL(join(ROOT, 'web/src/lib/detectLifestyleIntent.mjs')).href);
const DATA = await import(pathToFileURL(join(ROOT, 'web/src/lib/lifestyleMuseData.mjs')).href);
const REN = await import(pathToFileURL(join(ROOT, 'web/src/lib/lifestyleCanvasRenderer.mjs')).href);

/** Mock Canvas Context（语义断言——零图形环境依赖） */
function mockCanvas() {
  const calls = { fillText: [], drawImage: 0, fill: 0 };
  const ctx = {
    fillText: (text) => { calls.fillText.push(String(text)); },
    drawImage: () => { calls.drawImage += 1; },
    measureText: (t) => ({ width: Math.min(String(t).length * 20, 700) }),
    fillRect: () => {}, strokeRect: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    beginPath: () => {}, moveTo: () => {}, lineTo: () => {},
    stroke: () => {}, fill: () => { calls.fill += 1; }, arc: () => {}, closePath: () => {},
    arcTo: () => {}, save: () => {}, restore: () => {}, setTransform: () => {},
    roundRect: () => {},
  };
  return { width: 0, height: 0, getContext: () => ctx, calls };
}

/* ═══════════ E124-01：六语 STYLE_INTENT 命中 ═══════════ */
test('E124-01 意图网正例：六语穿搭语料逐条命中 STYLE_INTENT', () => {
  const cases = [
    ['明天第一次约会穿什么合适', '穿什么'],
    ['What should I wear for an important interview?', 'what should i wear'],
    ['Quoi porter pour un premier rendez-vous ?', 'quoi porter'],
    ['¿Qué me pongo para la cena de mañana?', 'qué me pongo'],
    ['พรุ่งนี้มีงานสัมมนา แต่งตัวยังไงดี', 'แต่งตัว'],
    ['Ngày mai đi hẹn hò nên mặc gì nhỉ?', 'mặc gì'],
  ];
  for (const [text] of cases) {
    const hit = INT.detectLifestyleIntent(text);
    assert.ok(hit && hit.type === 'style', `STYLE_INTENT 未命中：「${text}」`);
  }
});

/* ═══════════ E124-02：六语 ROADTRIP_INTENT 命中 ═══════════ */
test('E124-02 意图网正例：六语出行语料逐条命中 ROADTRIP_INTENT', () => {
  const cases = [
    ['I need a weekend road trip to clear my mind', 'road trip'],
    ['这周末想自驾去山里散心', '自驾'],
    ['Une escapade en voiture ce week-end ?', 'escapade'],
    ['Quiero una escapada de fin de semana', 'escapada'],
    ['อยากได้ทริปขับรถสุดสัปดาห์', 'ทริปขับรถ'],
    ['Cuối tuần này đi phượt Đà Lạt', 'phượt'],
  ];
  for (const [text] of cases) {
    const hit = INT.detectLifestyleIntent(text);
    assert.ok(hit && hit.type === 'roadtrip', `ROADTRIP_INTENT 未命中：「${text}」`);
  }
});

/* ═══════════ E124-03：fail-closed 静默 ═══════════ */
test('E124-03 fail-closed：日常寒暄一律 null 严禁误触', () => {
  const noise = ['今天天气不错', '早安，吃了吗', '谢谢你的陪伴', 'Good morning!', 'Merci beaucoup', 'Hola, ¿cómo estás?', 'สวัสดีตอนเช้า', 'Chào buổi sáng'];
  for (const t of noise) {
    assert.equal(INT.detectLifestyleIntent(t), null, `寒暄误触：「${t}」`);
  }
  assert.equal(INT.detectLifestyleIntent(''), null, '空文本须 null');
  assert.equal(INT.detectLifestyleIntent(null), null, 'null 须 null');
});

/* ═══════════ E124-04：12 套模板完整性 ═══════════ */
test('E124-04 12 套六语模板完整性（style/roadtrip × 6 语全字段）', () => {
  for (const type of ['style', 'roadtrip']) {
    for (const l of LANGS) {
      const tpl = DATA.getLifestyleTemplate(type, l);
      assert.ok(tpl, `${type} ${l} 模板缺失`);
      for (const f of ['title', 'subtitle', 'prose', 'companionWhisper', 'bestWindowPrefix', 'defaultTiming']) {
        assert.ok(String(tpl[f] || '').trim(), `${type} ${l} 字段 ${f} 缺失`);
      }
    }
  }
  // fail-closed：坏类型 null；坏语种回退 en 兜底（AMULET getAmuletTemplate 先例）
  assert.equal(DATA.getLifestyleTemplate('apology', 'zh'), null, '坏类型须 null');
  const fb = DATA.getLifestyleTemplate('style', 'xx');
  assert.ok(fb && String(fb.title || '').includes('AURA'), '坏语种须回退 en 兜底模板');
});

/* ═══════════ E124-05：style 色盘真值 ═══════════ */
test('E124-05 style 三组能量色盘（hex 形状＋名称）', () => {
  for (const l of LANGS) {
    const tpl = DATA.getLifestyleTemplate('style', l);
    assert.ok(Array.isArray(tpl.palette) && tpl.palette.length === 3, `style ${l} 色盘须 3 组`);
    for (const p of tpl.palette) {
      assert.ok(/^#[0-9A-Fa-f]{6}$/.test(String(p.hex)), `style ${l} 色值 ${p.hex} 非法`);
      assert.ok(String(p.name || '').trim(), `style ${l} 色名缺失`);
    }
  }
});

/* ═══════════ E124-06：roadtrip 吉方真值 ═══════════ */
test('E124-06 roadtrip 吉方罗盘（deg 数值＋六语名称）', () => {
  for (const l of LANGS) {
    const tpl = DATA.getLifestyleTemplate('roadtrip', l);
    assert.ok(tpl.heading && typeof tpl.heading.deg === 'number' && tpl.heading.deg >= 0 && tpl.heading.deg < 360, `roadtrip ${l} deg 非法`);
    assert.ok(String(tpl.heading.name || '').trim(), `roadtrip ${l} 方位名缺失`);
  }
});

/* ═══════════ E124-07：黄金比例锁死 ═══════════ */
test('E124-07 Canvas 1080×1748 黄金比例（容差 <0.001）', async () => {
  const { AMULET_DIMENSIONS } = await import(pathToFileURL(join(ROOT, 'web/src/lib/amuletCanvasRenderer.mjs')).href);
  assert.equal(AMULET_DIMENSIONS.width, 1080, '宽须 1080');
  assert.equal(AMULET_DIMENSIONS.height, 1748, '高须 1748');
  const c = mockCanvas();
  const tpl = DATA.getLifestyleTemplate('style', 'zh');
  await REN.renderLifestyleToCanvas(c, tpl, 'zh', { type: 'style' });
  assert.ok(REN.isLifestyleGoldenRatio(c), '黄金比例校验须通过（复用 AMULET 同源常量）');
});

/* ═══════════ E124-08：防伪章前缀 ═══════════ */
test('E124-08 防伪章 KS-STYLE-/KS-ROADTRIP- 前缀装配', () => {
  assert.ok(REN.composeLifestyleStamp('style', 'zh').startsWith('KS-STYLE-'), 'style 章前缀');
  assert.ok(REN.composeLifestyleStamp('roadtrip', 'en').startsWith('KS-ROADTRIP-'), 'roadtrip 章前缀');
  assert.ok(REN.composeLifestyleStamp('style', 'zh').endsWith('-ZH'), '章尾 locale 大写');
  // 类型收敛：坏 type 收敛 style（fail-soft 白名单）
  assert.ok(REN.composeLifestyleStamp('bogus', 'zh').startsWith('KS-STYLE-'), '坏 type 须收敛 style');
});

/* ═══════════ E124-09：渲染语义（文本全落画布） ═══════════ */
test('E124-09 渲染语义：title/subtitle/prose/whisper/吉时/域名全落画布', async () => {
  const c = mockCanvas();
  const tpl = DATA.getLifestyleTemplate('roadtrip', 'zh');
  await REN.renderLifestyleToCanvas(c, tpl, 'zh', { type: 'roadtrip', hostName: '山子' });
  const all = c.calls.fillText.join('\n');
  assert.ok(all.includes(tpl.title), 'title 未落画布');
  assert.ok(all.includes(tpl.subtitle), 'subtitle 未落画布');
  assert.ok(all.includes(String(tpl.prose).split('\n')[0].slice(0, 10)), 'prose 未落画布');
  assert.ok(all.includes('山子'), '宿主落款未落画布');
  assert.ok(all.includes(String(tpl.bestWindowPrefix)), '吉时标牌前缀未落画布');
  assert.ok(all.includes('kindredsouls.online'), '官方域名未落画布');
  assert.ok(all.includes('KS-ROADTRIP-'), '防伪章未落画布');
  // style 徽记语义：色盘 hex 大写落画布
  const c2 = mockCanvas();
  const tpl2 = DATA.getLifestyleTemplate('style', 'en');
  await REN.renderLifestyleToCanvas(c2, tpl2, 'en', { type: 'style' });
  const all2 = c2.calls.fillText.join('\n');
  for (const p of tpl2.palette) {
    assert.ok(all2.includes(p.hex.toUpperCase()), `色值 ${p.hex} 未落画布`);
  }
});

/* ═══════════ E124-10：六语插槽字典（军令 7 键） ═══════════ */
test('E124-10 插槽六语字典完整性（军令 7 键对照表）', () => {
  const src = read('web/src/components/companion/LifestyleMuseSlot.tsx');
  const keySamples = ['气场穿搭灵感笺', 'Aura Style Capsule', '漫游自驾避坑路书', 'Soul Roadtrip Guide', '查看气场穿搭卡', 'View Style Capsule', '能量主色', 'Aura Palette', '纳气吉方', 'Auspicious Heading', '保存高清卡片', 'Save High-Res Card'];
  for (const s of keySamples) {
    assert.ok(src.includes(s), `字典军令句式缺失：「${s}」`);
  }
  for (const l of LANGS) {
    assert.ok(src.includes(`${l}: {`), `${l} 语字典块缺失`);
  }
  // 军令文件名格式（前缀常量真源在 lifestyleMuseData.mjs，插槽消费 LIFESTYLE_FILENAME）
  const dataSrc = read('web/src/lib/lifestyleMuseData.mjs');
  assert.ok(dataSrc.includes("'KindredSouls-Style-'") && dataSrc.includes("'KindredSouls-Roadtrip-'"), '导出文件名前缀军令格式缺失');
  assert.ok(src.includes('LIFESTYLE_FILENAME'), '插槽未消费 LIFESTYLE_FILENAME 真源');
});

/* ═══════════ E124-11：server 侧锚（prompt 注入＋红线） ═══════════ */
test('E124-11 server 锚：LIFESTYLE_GROUNDING 六语块＋注入＋性价比红线', () => {
  const src = read('server.js');
  assert.ok(src.includes('LIFESTYLE_GROUNDING'), 'LIFESTYLE_GROUNDING 常量缺失');
  assert.ok(src.includes('...(lifestyleBlock || [])'), 'lifestyleBlock 未注入 prompt 数组');
  for (const l of LANGS) {
    assert.ok(src.includes(`${l}: [`), `LIFESTYLE_GROUNDING ${l} 语块缺失`);
  }
  // 红线在籍：小众质感·极致性价比（六语同义锚各至少一条）
  assert.ok(/小众质感、极致性价比/.test(src), 'zh 性价比红线缺失');
  assert.ok(/understated & smart value|understated quality, smart value/.test(src), 'en 性价比红线缺失');
  // 负向：严禁奢侈大牌（zh/en 红线词）
  assert.ok(/严禁推荐奢侈大牌/.test(src), 'zh 奢侈大牌禁令缺失');
  assert.ok(/never luxury logos/.test(src), 'en luxury 禁令缺失');
});

/* ═══════════ E124-12：前端接线锚＋零 i18n 新键 ═══════════ */
test('E124-12 ChatSheet 接线锚（密函静默接管＋互斥＋零 i18n 新键）', () => {
  const src = read('web/src/components/FamiliarChatSheet.tsx');
  assert.ok(src.includes("import { detectLifestyleIntent } from '../lib/detectLifestyleIntent.mjs'"), 'detectLifestyleIntent 导入缺失');
  assert.ok(src.includes('const lifestyleIntent = scribeIntent ? null : detectLifestyleIntent(text)'), '密函静默接管链缺失');
  assert.ok(src.includes('setLifestyleSlot(lifestyleIntent ? { aid, type: (lifestyleIntent.type as LifestyleCardType) } : null)'), 'lifestyleSlot 状态写入缺失');
  assert.ok(src.includes('<LifestyleMuseSlotCard'), '微缩插槽渲染缺失');
  assert.ok(src.includes('<LifestylePreviewModal'), '大图预览弹层缺失');
  assert.ok(src.includes('lifestyleSlot && !scribeSlot && !streaming'), '互斥守卫缺失（密函在场时生活卡不渲）');
  // 零 i18n 新键：i18n 真源不动（基准 123）
  const i18n = read('web/src/i18n/index.ts');
  assert.ok(!i18n.includes('SLOT_STYLE_TITLE'), 'i18n 真源混入 E124 新键（须自容字典）');
});

/* ═══════════ S13：链位自保 ═══════════ */
test('E124-S13 链位自保：e124 入编（e120 后、e40-compat 前；全链 92→93 段）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 104, `军规链段数须为 93（E124 入编后 92→93；实为 ${segs.length}）`);
  const iE124 = segs.findIndex((s) => s.includes('audit-e124-lifestyle-muse'));
  const iE120 = segs.findIndex((s) => s.includes('audit-e120-mood-amulet'));
  const iCap = segs.findIndex((s) => s.includes('audit-e40-compat'));
  const iPy = segs.findIndex((s) => s.includes('audit_v492_peak_window.py'));
  assert.ok(iE124 !== -1, 'e124 未入编 test:astro');
  assert.ok(iE120 !== -1 && iE124 > iE120, 'e124 须居 e120 之后');
  assert.equal(iCap, segs.length - 2, `收口位漂移：e40-compat 应为 len-2（实为 ${iCap}/${segs.length}）`);
  assert.equal(iPy, segs.length - 1, 'python 须恒为链尾');
  assert.ok(iE124 < iCap, 'e124 须居 e40-compat 之前（版本序）');
});
