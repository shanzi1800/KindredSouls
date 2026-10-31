// ═══ E105 闸门：测试先行 · 六语金卡折行断言、灵宠伴读共鸣与全链路离线导出 ═══
// 主公军令（2026-10-30）：刀零 TDD 前置——六语折行/排版断言必须先于业务码落位（红脸确认）。
// 刀一 灵宠双端伴读共鸣状态机（五态 FSM＋零异步台词）
// 刀二 深空黑金命盘金卡纯前端离线导出（Canvas 375×667×dpr3）
// 刀三 流式承接骨架屏（Shimmer＋CLS=0）
// 刀四 闸门入编军规链 79→80 段
// 军令适配裁决：tests/*.test.ts（pnpm/Vitest）→ 仓内 test/audit-e105-*.test.mjs（npm/node:test）；
//   纯函数引擎落 .mjs（houseOverlay.mjs 先例）⇒ node:test 直接 ESM import 行为级实测。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const APP = read('web/src/App.tsx');
const APPCSS = read('web/src/App.css');
const PKG = JSON.parse(read('package.json'));
const TRUTH = read('web/src/i18n/metaphysicsTruthTable.ts');

// ── 动态加载纯函数引擎（.mjs 真源——红脸阶段缺文件即各段独立报红）──
const loadLayout = async () => import('../web/src/lib/goldCardLayout.mjs');
const loadQuotes = async () => import('../web/src/lib/goldCardQuotes.mjs');
const loadLines = async () => import('../web/src/components/companion/companionLines.mjs');

// ── measureText 桩（刀零军令：支持不同语言字宽阶梯）──
//   CJK 全宽 1.0；拉丁/泰/越 0.55；按 fontSize 线性缩放（模拟 ctx.measureText 语义）
const CHAR_W = (ch) =>
  /[\u2e80-\u9fff\u3000-\u303f\uff00-\uffef\u2018-\u201f]/.test(ch) ? 1.0 : 0.55;
const measureStub = (text, fontSize) => {
  let w = 0;
  for (const ch of String(text)) w += CHAR_W(ch);
  return w * (fontSize || 1);
};

// ── 军令钦定金句（三原型六语逐字——防字典漂移的测试侧真源）──
const Q_EMPEROR = {
  zh: '爱不是束缚的利爪，而是坚固的城堡，在护佑中予你自由呼吸的苍穹。',
  en: 'Love is not a cage of control, but a fortress of grace where souls breathe freely.',
  fr: '« L\'amour n\'est point une forteresse de contrôle, mais un sanctuaire de paix. »',
  es: 'El amor no es una jaula de dominio, sino un castillo sagrado que da libertad.',
  th: 'ความรักไม่ใช่กรงเล็บแห่งการควบคุม แต่เป็นปราสาทที่ให้ที่พักพิงอย่างเสรี',
  vi: 'Tình yêu không phải xiềng xích kiểm soát, mà là thành trì dung dưỡng tự do.',
};
const Q_PRIESTESS = {
  zh: '静默的直觉胜过万千喧嚣，宇宙在无声处为你校准命运罗盘。',
  en: 'Stillness holds more wisdom than noise; the cosmos realigns your compass in silence.',
  fr: '« L\'intuition silencieuse dépasse le bruit du monde ; l\'univers vous guide en paix. »',
  es: 'La intuición serena supera el ruido; el cosmos calibra tu brújula en silencio.',
  th: 'เสียงกระซิบจากภายในเปี่ยมปัญญายิ่งกว่าเสียงรบกวน จักรวาลกำลังนำทางคุณอย่างสงบ',
  vi: 'Trực giác tĩnh lặng sâu sắc hơn vạn lời ồn ã; vũ trụ đang âm thầm dẫn lối tâm hồn.',
};
const Q_FIRE = {
  zh: '命带烈焰星火，差异非隔阂之墙，皆是点亮彼此生命的金石。',
  en: 'Flames united across the stars; differences are not walls, but bridges of light.',
  fr: '« Des flammes unies par le destin ; les différences ne sont que des ponts de lumière. »',
  es: 'Llamas unidas por el destino; las diferencias no son muros, sino puentes de luz.',
  th: 'เปลวไฟแห่งโชคชะตาหลอมรวม ความต่างไม่ใช่กำแพงแต่คือสะพานที่ทอดหากัน',
  vi: 'Ngọn lửa duyên định tương phùng; dị biệt không phải bức tường, mà là nhịp cầu ánh sáng.',
};
const LANGS = ['zh', 'en', 'fr', 'es', 'th', 'vi'];

// ═══════════════ 刀零 · 六语排版离线断言（测试先行）═══════════════

test('①-1 布局常量军令锚定（CARD_LAYOUT_TOKENS 逐值）', async () => {
  const { GOLD_CARD_LAYOUT: L } = await loadLayout();
  // 🏆 E107-刀一 后继化：神圣黄金比例 1:1.618 —— 375×667 → 400×648（1200×1944 物理）
  assert.equal(L.canvasWidth, 400, 'canvasWidth 须 400（E107 黄金比例）');
  assert.equal(L.canvasHeight, 648, 'canvasHeight 须 648（E107 黄金比例）');
  assert.equal(L.safeZoneWidth, 320, 'safeZoneWidth 须 320（400*0.8）');
  assert.equal(L.centerX, 200, 'centerX 须 200');
  assert.equal(L.maxLines, 3, 'maxLines 须 3');
  assert.equal(L.exportPixelRatio, 3, '导出物理分辨率倍率须 3（1200×1944）');
  assert.equal(L.locales.zh.fontSize, 13, 'zh fontSize 13');
  assert.equal(L.locales.zh.lineHeight, 22, 'zh lineHeight 22');
  assert.equal(L.locales.zh.letterSpacing, 1, 'zh letterSpacing 1');
  assert.equal(L.locales.en.fontSize, 12, 'en fontSize 12');
  assert.equal(L.locales.en.lineHeight, 18, 'en lineHeight 18');
  assert.equal(L.locales.fr.fontSize, 11, 'fr fontSize 11');
  assert.equal(L.locales.fr.lineHeight, 17, 'fr lineHeight 17');
  assert.equal(L.locales.es.fontSize, 11, 'es fontSize 11');
  assert.equal(L.locales.es.lineHeight, 17, 'es lineHeight 17');
  // 🔴 泰语高行高防声调削顶（军令硬约束 lineHeight >= 24）
  assert.ok(L.locales.th.lineHeight >= 24, `th lineHeight 须 >= 24（实得 ${L.locales.th.lineHeight}）`);
  assert.equal(L.locales.th.fontSize, 12, 'th fontSize 12');
  assert.equal(L.locales.vi.fontSize, 11, 'vi fontSize 11');
  assert.equal(L.locales.vi.lineHeight, 20, 'vi lineHeight 20');
});

test('①-2 金卡标题层级（六语主/副标＋长字符语系降 16px）', async () => {
  const { GOLD_CARD_TITLES: T, wrapCardText } = await loadLayout();
  for (const l of LANGS) {
    assert.ok(T[l] && T[l].primary && T[l].sub, `${l} 缺主/副标`);
  }
  assert.equal(T.zh.primary, '宇宙命盘金卡');
  assert.equal(T.en.primary, 'Cosmic Destiny Blueprint');
  assert.equal(T.en.sub, 'Soul Imprint · Natal Resonance Archive');
  assert.equal(T.fr.primary, 'Carte d\'Or du Destin Cosmique');
  assert.equal(T.fr.sub, 'Empreinte de l\'Âme · Résonance Céleste');
  assert.equal(T.es.primary, 'Tarjeta Dorada del Destino Astral');
  assert.equal(T.es.sub, 'Impronta del Alma · Archivo de Resonancia');
  assert.equal(T.th.primary, 'บัตรทองคำแห่งจักรวาล');
  assert.equal(T.vi.primary, 'Kim Thẻ Mệnh Bàn Vũ Trụ');
  // 副标 zh 宿命共鸣档案军令锚
  assert.equal(T.zh.sub, '灵魂印记 · 宿命共鸣档案');
  // 单行契约：es 主标 33 字在 18px 超安全宽 ⇒ 缩容 16px 仍单行
  const r = wrapCardText(T.es.primary, 'es', measureStub,
    { fontSize: 18, lineHeight: 17, maxLines: 1, maxWidth: 300, minFontSize: 14 });
  assert.equal(r.lines.length, 1, 'es 主标必须单行');
  assert.equal(r.fontSize, 16, 'es 主标应缩容至 16px（军令钦定）');
});

test('②-1 中文逐字折行＋避头尾（行首禁则标点零出现）', async () => {
  const { tokenizeForWrap, wrapCardText } = await loadLayout();
  // 9 字恰满一行（125px≤130）；第 10 字符为「，」⇒ 裸贪心会让行首出现「，」⇒ 避头尾推字
  const T1 = '一二三四五六七八九，十一十二十三十四';
  const toks = tokenizeForWrap(T1, 'zh');
  assert.equal(toks.length, T1.length, 'zh 须逐字切分');
  const r = wrapCardText(T1, 'zh', measureStub,
    { fontSize: 13, lineHeight: 22, maxLines: 3, maxWidth: 130, minFontSize: 10 });
  assert.ok(r.lines.length >= 1 && r.lines.length <= 3, `行数越界（${r.lines.length}）`);
  for (const line of r.lines) {
    assert.ok(!/^[，。！？；：、）】」》…%·]/.test(line), `行首出现禁则标点：「${line}」`);
  }
  assert.equal(r.lines.join(''), T1, '折行不得丢字/改字');
});

test('②-2 西欧语系空格词元换行（单词绝不中途劈裂）', async () => {
  const { tokenizeForWrap, wrapCardText } = await loadLayout();
  for (const l of ['en', 'fr', 'es']) {
    const toks = tokenizeForWrap('cosmic destiny architecture', l);
    assert.deepEqual(toks, ['cosmic', 'destiny', 'architecture'], `${l} 须按空格词元切分`);
  }
  const r = wrapCardText('cosmic destiny architecture', 'en', measureStub,
    { fontSize: 12, lineHeight: 18, maxLines: 3, maxWidth: 100, minFontSize: 10 });
  for (const line of r.lines) {
    for (const w of line.split(' ')) {
      // 每个词要么完整原词、要么长词连字符降级形态（以 - 收尾）
      assert.ok('cosmic destiny architecture'.includes(w) || w.endsWith('-'),
        `en 单词被中途劈裂：「${w}」`);
    }
  }
});

test('②-3 长词连字符降级（超行宽单词强制折断带连字符）', async () => {
  const { wrapCardText } = await loadLayout();
  // 11 字符长词宽 72.6px > maxWidth 40 ⇒ 必须连字符降级
  const r = wrapCardText('magnificent', 'en', measureStub,
    { fontSize: 12, lineHeight: 18, maxLines: 3, maxWidth: 40, minFontSize: 10 });
  assert.ok(r.lines.length > 1, '长词未被降级折断');
  assert.equal(r.lines.join('').replace(/-/g, ''), 'magnificent', '连字符降级不得丢字母');
  for (const line of r.lines) {
    assert.ok(measureStub(line, r.fontSize) <= 40 + 7,
      `降级行仍超宽：「${line}」`);
  }
});

test('②-4 泰语词元拆分（Segmenter 注入＋音节兜底双路）', async () => {
  const { tokenizeForWrap } = await loadLayout();
  const TH = 'เปลวไฟแห่งโชคชะตาหลอมรวม';
  // 路 A：注入 Segmenter 桩（2 字符词元对）
  const fakeSeg = { segment: (s) => Array.from(String(s).matchAll(/(..?)/g), (m) => ({ segment: m[0] })) };
  const toksSeg = tokenizeForWrap(TH, 'th', fakeSeg);
  assert.equal(toksSeg.join(''), TH, 'Segmenter 路不得丢字');
  // 路 B：无 Segmenter ⇒ 泰语音节簇兜底
  const toksFallback = tokenizeForWrap(TH, 'th');
  assert.equal(toksFallback.join(''), TH, '兜底路不得丢字');
  // 音标不可被拆到下一词元开头（辅音+声调组合禁截断）
  for (const t of toksFallback) {
    assert.ok(!/^[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(t), `泰语音标被截断到词元首：「${t}」`);
  }
});

test('②-5 越南语复合音节完整性（多音节词不破裂）', async () => {
  const { wrapCardText } = await loadLayout();
  const r = wrapCardText('Ngọn lửa duyên định tương phùng', 'vi', measureStub,
    { fontSize: 11, lineHeight: 20, maxLines: 3, maxWidth: 90, minFontSize: 10 });
  for (const line of r.lines) {
    for (const w of line.split(' ')) {
      assert.ok('Ngọn lửa duyên định tương phùng'.includes(w) || w.endsWith('-'),
        `vi 复合音节词被破裂：「${w}」`);
    }
  }
});

test('②-6 军令金句全矩阵折行边界（六语×三原型 1≤lines≤3、行宽≤300、零 NaN/空行）', async () => {
  const { wrapCardText, GOLD_CARD_LAYOUT: L } = await loadLayout();
  const MATRIX = [Q_EMPEROR, Q_PRIESTESS, Q_FIRE];
  for (const quote of MATRIX) {
    for (const l of LANGS) {
      const cfg = L.locales[l];
      const r = wrapCardText(quote[l], l, measureStub, {
        fontSize: cfg.fontSize, lineHeight: cfg.lineHeight,
        maxLines: L.maxLines, maxWidth: L.safeZoneWidth, minFontSize: 10,
      });
      assert.ok(r.lines.length >= 1 && r.lines.length <= 3,
        `${l} 金句行数越界（${r.lines.length}）`);
      for (const line of r.lines) {
        assert.ok(line.length > 0, `${l} 出现空行`);
        assert.ok(!/NaN|undefined/.test(line), `${l} 行内出现 NaN/undefined`);
        const w = measureStub(line, r.fontSize) + (line.length - 1) * (cfg.letterSpacing || 0);
        // 🏆 E107-刀一 后继化：safeZone 320（400*0.8）——旧 300 字面量随黄金比例升维
        assert.ok(w <= L.safeZoneWidth + 1, `${l} 行宽 ${w} > ${L.safeZoneWidth}：「${line.slice(0, 24)}…」`);
      }
      if (l === 'zh') assert.equal(r.lines.join(''), quote[l], 'zh 折行丢字');
    }
  }
});

test('②-7 超长文本硬夹断（3 行上限强制＋尾行省略号收口）', async () => {
  const { wrapCardText } = await loadLayout();
  const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
  const r = wrapCardText(long, 'en', measureStub,
    { fontSize: 12, lineHeight: 18, maxLines: 3, maxWidth: 300, minFontSize: 10 });
  assert.equal(r.lines.length, 3, '硬夹断必须锁 3 行');
  assert.ok(r.lines[r.lines.length - 1].endsWith('…'), '末行须省略号收口');
  assert.ok(long.startsWith(r.lines.join(' ').replace(/…$/, '').replace(/\s*$/, '')),
    '夹断结果必须是原文前缀');
});

// ═══════════════ 刀二 · 金句库与决策树（六语真值）═══════════════

test('③-1 金句库三原型六语逐字（军令钦定零漂移）', async () => {
  const { GOLD_CARD_QUOTES: Q } = await loadQuotes();
  for (const l of LANGS) {
    assert.equal(Q.emperor.quote[l], Q_EMPEROR[l], `emperor ${l} 金句漂移`);
    assert.equal(Q.high_priestess.quote[l], Q_PRIESTESS[l], `high_priestess ${l} 金句漂移`);
    assert.equal(Q.fire_trine.quote[l], Q_FIRE[l], `fire_trine ${l} 金句漂移`);
  }
  assert.equal(Q.emperor.cardId, 4, 'emperor cardId 须 4（tarot.ts 真源）');
  assert.equal(Q.high_priestess.cardId, 2, 'high_priestess cardId 须 2');
  assert.equal(Q.fire_trine.fallback, true, 'fire_trine 须标记 fallback');
});

test('③-2 金句提取决策树（塔罗命中→八字三合兜底）', async () => {
  const { pickGoldCardQuote } = await loadQuotes();
  assert.equal(pickGoldCardQuote(4, false, 'zh').key, 'emperor', '皇帝正位须走原型 A');
  assert.equal(pickGoldCardQuote(2, false, 'fr').key, 'high_priestess', '女祭司正位须走原型 B');
  assert.equal(pickGoldCardQuote(4, true, 'zh').key, 'fire_trine', '皇帝逆位不在库⇒三合兜底');
  assert.equal(pickGoldCardQuote(9, false, 'en').key, 'fire_trine', '隐士（未收录）⇒三合兜底');
  assert.equal(pickGoldCardQuote(null, false, 'th').key, 'fire_trine', '缺数据⇒三合兜底');
  assert.equal(pickGoldCardQuote(2, false, 'vi').quote, Q_PRIESTESS.vi, '决策树出参须六语真值');
});

test('③-3 金句库 ↔ 真值字典 parity（cardId 与 E104 真源对齐）', async () => {
  const { GOLD_CARD_QUOTES: Q } = await loadQuotes();
  const truthEmperor = /emperor:\s*\{\s*cardId:\s*4/.test(TRUTH);
  const truthPriestess = /high_priestess:\s*\{\s*cardId:\s*2/.test(TRUTH);
  assert.ok(truthEmperor, '真值字典 emperor cardId≠4（parity 破）');
  assert.ok(truthPriestess, '真值字典 high_priestess cardId≠2（parity 破）');
  assert.equal(Q.emperor.cardId, 4, '金句库 emperor cardId 漂移');
  assert.equal(Q.high_priestess.cardId, 2, '金句库 high_priestess cardId 漂移');
});

// ═══════════════ 刀二 · drawGoldCard 源码契约（离线与视觉军令）═══════════════

test('④-1 金卡画布军令锚（400×648×3 黄金比例／深空渐变／噪点／双层暗金框）', async () => {
  const SRC = read('web/src/lib/drawGoldCard.ts');
  // 🏆 E107-刀一 后继化：375×667 → 400×648（神圣黄金比例 1:1.618）
  assert.ok(SRC.includes('400'), '缺逻辑宽 400（E107 黄金比例）');
  assert.ok(SRC.includes('648'), '缺逻辑高 648（E107 黄金比例）');
  assert.ok(/exportPixelRatio|devicePixelRatio|,\s*3\b/.test(SRC), '缺 dpr=3 超清导出');
  assert.ok(SRC.includes('#161922'), '缺深空黑渐变起点 #161922');
  assert.ok(SRC.includes('#08090C'), '缺深空黑渐变终点 #08090C');
  assert.ok(/0\.03|3%/.test(SRC), '缺 3% 噪点');
  assert.ok(SRC.includes('212, 175, 55, 0.45'), '缺暗金外框 rgba(212,175,55,0.45)');
  // 🏆 E106-刀一 后继化：内框升级香槟金发丝线 rgba(243,229,171,0.55)（军令字体阶梯同款色阶）
  assert.ok(SRC.includes('243, 229, 171, 0.55'), '缺香槟金内框 rgba(243,229,171,0.55)（E106 升级）');
  assert.ok(SRC.includes('✦'), '缺四角十字星标/印章 ✦');
  assert.ok(SRC.includes('SOUL OS'), '缺防伪底栏 SOUL OS');
  assert.ok(SRC.includes('COSMIC IMMUTABLE ARCHIVE'), '缺防伪底栏 COSMIC IMMUTABLE ARCHIVE');
  assert.ok(/hash|Hash/.test(SRC), '缺唯一命盘 Hash 码');
});

test('④-2 离线安全铁律（零远程请求·零跨域图·仅 data: 图腾）', async () => {
  const SRC = read('web/src/lib/drawGoldCard.ts');
  assert.ok(!SRC.includes('fetch('), '金卡绘制混入 fetch（违离线铁律）');
  assert.ok(!SRC.includes('XMLHttpRequest'), '金卡绘制混入 XHR');
  assert.ok(!/https?:\/\/[^'"\s]+\.(png|jpe?g|webp|svg)/i.test(SRC), '金卡引用远程位图（Canvas Tainted 风险）');
  // 🏆 E107-刀一 后继化：图腾真源迁 goldCardTotems.mjs（22 张按 cardId 分发）——
  //    data: URI 出口随迁；drawGoldCard 经 goldCardTotemUri 消费（离线铁律不变）
  const TOTEMS = read('web/src/lib/goldCardTotems.mjs');
  assert.ok(TOTEMS.includes('data:image/svg+xml'), '图腾库缺内联 data: SVG 真源');
  assert.ok(SRC.includes('goldCardTotemUri'), '金卡绘制未接图腾库 URI 出口');
  const EXP = read('web/src/components/exporter/GoldCardExporter.tsx');
  assert.ok(!EXP.includes('fetch('), '导出器混入 fetch（违离线铁律）');
  assert.ok(EXP.includes('toBlob'), '导出器缺 canvas.toBlob');
  assert.ok(EXP.includes('revokeObjectURL'), '导出器缺 revokeObjectURL 显存释放');
  assert.ok(EXP.includes('blob:'), '移动端缺 blob: URL 弹层');
});

test('④-3 移动端 WebKit 下载分流（桌面 a download／移动长按保存弹层）', async () => {
  const EXP = read('web/src/components/exporter/GoldCardExporter.tsx');
  assert.ok(/download/.test(EXP), '桌面端缺 <a download> 落盘');
  assert.ok(/768|matchMedia/.test(EXP), '缺视口分流判定（>768px 桌面）');
  // 六语长按保存提示（军令：提示「长按图片保存至相册」）
  for (const l of LANGS) {
    assert.ok(new RegExp(`\\b${l}\\s*:`).test(EXP), `导出器缺 ${l} 语种文案`);
  }
});

// ═══════════════ 刀一 · 灵宠伴读共鸣状态机源码契约 ═══════════════

test('⑤-1 五态 FSM 与时序军令（300ms 唤醒／4s 自退／IO 60% 阈）', async () => {
  const SRC = read('web/src/components/companion/CompanionResonance.tsx');
  for (const st of ['IDLE', 'AWAKEN', 'RESONATING', 'EXPANDED', 'MINIMIZED']) {
    assert.ok(SRC.includes(st), `FSM 缺状态 ${st}`);
  }
  assert.ok(/300/.test(SRC), '缺 AWAKEN 300ms 延迟');
  assert.ok(/4000|4_000/.test(SRC), '缺 RESONATING 4s 自动隐退');
  assert.ok(SRC.includes('IntersectionObserver'), '缺 IntersectionObserver 视口监听');
  assert.ok(/0\.6|60%/.test(SRC), '缺 60% 视口阈值');
});

test('⑤-2 双端几何军令（桌面 24px 双角 z-40／移动 48px 徽章＋Drawer）', async () => {
  const SRC = read('web/src/components/companion/CompanionResonance.tsx');
  assert.ok(/right:\s*24/.test(SRC), '缺 Milo 右下 24px');
  assert.ok(/left:\s*24/.test(SRC), '缺 Sophia 左下 24px');
  assert.ok(/bottom:\s*24/.test(SRC), '缺 bottom 24px');
  assert.ok(/zIndex:\s*40|z-index:\s*40/.test(SRC), '缺 z-index 40');
  assert.ok(/48/.test(SRC), '缺移动端 48px 徽章');
  assert.ok(/[Dd]rawer/.test(SRC), '缺移动端半屏抽屉');
  assert.ok(SRC.includes('rgba(11, 12, 16, 0.85'), '缺深空黑金玻璃气泡底');
  assert.ok(/blur\(12px\)|backdropFilter/.test(SRC), '缺 12px 毛玻璃');
  assert.ok(/320/.test(SRC), '缺气泡最大宽 320px');
});

test('⑤-3 零异步台词铁律（本地规则匹配·禁远程 LLM）', async () => {
  const SRC = read('web/src/components/companion/CompanionResonance.tsx');
  const LINES = read('web/src/components/companion/companionLines.mjs');
  assert.ok(!SRC.includes('fetch('), '伴读状态机混入 fetch（违 <16ms 本地铁律）');
  assert.ok(!LINES.includes('fetch('), '台词引擎混入 fetch');
  assert.ok(!LINES.includes('XMLHttpRequest'), '台词引擎混入 XHR');
  // 台词引擎消费命盘 AST（牌名/五行局）本地匹配
  assert.ok(/tarot|cardId|bazi|trine/i.test(LINES), '台词引擎未接命盘 AST');
});

test('⑤-4 伴读台词六语行为级（决策树本地直出）', async () => {
  const { pickCompanionLine } = await loadLines();
  const zhA = pickCompanionLine({ cardId: 4, isReversed: false, stage: 'AWAKEN' }, 'zh');
  assert.ok(typeof zhA === 'string' && zhA.length > 4, 'zh AWAKEN 台词缺场');
  for (const l of LANGS) {
    const s = pickCompanionLine({ cardId: 2, isReversed: false, stage: 'RESONATING' }, l);
    assert.ok(typeof s === 'string' && s.length > 4, `${l} RESONATING 台词缺场`);
    assert.ok(!/[\u4e00-\u9fff]/.test(s) || l === 'zh', `${l} 台词渗漏汉字`);
  }
});

// ═══════════════ 刀三 · 骨架屏源码契约 ═══════════════

test('⑥-1 Shimmer 骨架屏（微光动效＋CLS=0 高度预留）', async () => {
  const SRC = read('web/src/components/SkeletonMountGuard.tsx');
  assert.ok(/[Ss]himmer/.test(SRC), '缺 Shimmer 动效');
  assert.ok(/minHeight|min-height/.test(SRC), '缺固定高度预留（CLS=0）');
  const CSS = APPCSS;
  assert.ok(/ks-shimmer|ks-skeleton/.test(CSS), 'App.css 缺骨架屏样式');
  assert.ok(/@keyframes[^{]*shimmer|ks-shimmer.*animation/s.test(CSS), '缺 shimmer keyframes');
});

// ═══════════════ 挂载与入编（刀四）═══════════════

test('⑦-1 三组件挂载 App.tsx（金卡 CTA／骨架承接＋E106 伴读拔除后继化）', async () => {
  assert.ok(APP.includes('GoldCardExporter'), 'App.tsx 未挂金卡导出器');
  assert.ok(APP.includes('SkeletonMountGuard'), 'App.tsx 未挂骨架承接');
  // 🧹 E106-刀二 后继化（主公军令 2026-10-30 交流收拢首页铁律）：伴读共鸣状态机
  //    挂载位物理拔除——App.tsx 不得再 import/实例化伴读组件（组件文件保留备复活）；
  //    IO 共鸣锚点 data-companion-anchor 同步退役（无监听者即死属性）。
  assert.ok(!APP.includes('CompanionResonance'), 'E106-刀二违例：App.tsx 仍挂伴读状态机');
  assert.ok(!APP.includes('data-companion-anchor'), 'E106-刀二违例：残留 IO 共鸣锚点');
  // 挂载位：付费墙收起⇒报告挂载链（$4.99 once 洞察区）
  assert.ok(APP.includes('<GoldCardExporter'), '金卡导出器未实例化');
  assert.ok(APP.includes('<SkeletonMountGuard'), '骨架屏未实例化');
});

test('⑦-2 军规链段数入编（E108 后继化：83 段／e105 居 e106 前）', async () => {
  const segs = PKG.scripts['test:astro'].split('&&').map((s) => s.trim()).filter(Boolean);
  // 🏆 E107-刀四 后继化：E106 基线 81 段 → E107 升 82 段（e107 插 e106 后 e40 前）
  assert.equal(segs.length, 85, `军规链段数异常（实得 ${segs.length}，基线 85（E110 升 85 段））`);
  assert.ok(segs[segs.length - 1].includes('audit_v492_peak_window.py'), 'python 恒链尾被破');
  assert.ok(segs[segs.length - 2].includes('audit-e40-compat'), 'e40-compat 恒 len-2 被破');
  assert.ok(segs[segs.length - 6].includes('audit-e107'), 'e107 须居 len-6（e108 后）');
  assert.ok(segs[segs.length - 7].includes('audit-e106'), 'e106 须居 len-7（e107 后）');
  assert.ok(segs[segs.length - 8].includes('audit-e105'), 'e105 须居 len-8');
  assert.ok(segs[segs.length - 9].includes('audit-e104'), 'e104 须居 len-9');
});

test('⑦-3 双端视口防重叠（断言守卫源码级：无绝对重叠几何）', async () => {
  const SRC = read('web/src/components/companion/CompanionResonance.tsx');
  // 双宠对角布局（Milo 右/Sophia 左）＋单宠时不共角
  assert.ok(/Milo/.test(SRC) && /Sophia/.test(SRC), '缺双宠实例');
  const CSS = APPCSS;
  assert.ok(/ks-companion/.test(CSS), 'App.css 缺伴读样式');
  // 移动端断点（≤768 单宠徽章）
  assert.ok(/max-width:\s*768px/.test(CSS), '缺移动端 768px 断点分流');
});
