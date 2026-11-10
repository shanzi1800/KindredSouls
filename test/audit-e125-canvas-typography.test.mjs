/**
 * audit-e125-canvas-typography.test.mjs —— E125 军令闸门
 * ═══════════════════════════════════════════════════════════════════════════
 * 【军令 E125-UNIVERSAL-TYPOGRAPHY：三卡（星语/密函/穿搭/路书）全语言安全
 *   边界统规与智能排字引擎重构】
 * 病灶真因（image_9.png 实锤）：星语卡 prose 为服务端中英混排动态文本（「…
 * 把心里那句欣赏发给 与 TA——好状态值得被看见…」），旧 wrapLines 走空格
 * 分词路径时把 25 个连排中文当作一个不可拆「单词」整词放行 ⇒ 单行 1050px
 * 穿透双侧暗金边框。
 * 断言组（军令钦定 DoD）：
 *   E125-01 安全边界常量（insetX 140 / maxTextWidth 800 / bound [140,940]）；
 *   E125-02 三渲染器接线：AMULET/LIFESTYLE textMaxWidth 均 === 800；
 *   E125-03 病灶复现根治：军师混排原文（含「与 TA」空格）逐行宽 ≤800、
 *          minX≥140、maxX≤940；
 *   E125-04 旧病灶死亡断言：无任何行 CJK 字数 ≥19（旧病首行 25 字）；
 *   E125-05 zh 单行 18 字帽（军令钦定）；
 *   E125-06 zh 无空格长文逐字折行安全；
 *   E125-07 en/fr/es 词完整性（折行 join(' ') === 空白归一原文——严禁词中断）；
 *   E125-08 th 无空格长文折行安全（逐簇回溯 ≤800）；
 *   E125-09 th/vi 组合调号永不孤立行首；
 *   E125-10 标点避头尾（行首禁句读/行尾禁开引）；
 *   E125-11 3×6 矩阵：密函 4 型 × 6 语 ＋ 生活 2 型 × 6 语 ＋ 星语混排
 *          6 语（36+6 组），每语按 LOCALE_CANVAS_CONFIG 真源字号逐行断言
 *          width≤800 / minX≥140 / maxX≤940（穿透发生率 0）；
 *   E125-12 垂直动态居中（clamp ≤120：短文下沉/长文贴顶/永不悬空）；
 *   E125-13 渲染端到端：mock 度量与折行同源自洽（管线 fillText 正文行
 *          全部落在安全区）。
 *   E125-15 标牌宽度闸（热修 2026-11-05）：windowPlate（吉时/共振窗）
 *          mono 直排穿透实锤（style-fr ink 至 x=988 距金边 62px＜军令
 *          90px）⇒ shrinkPlateFontSize 缩字号＋折行兜底；mono 严格度量
 *          模型（0.62×字号）全矩阵（密函 24＋生活 12 套）＋style-fr 管线
 *          端到端全行 ≤800。
 *   S14 链位自保：e125 入编（e124 后、e40-compat 前；全链 93→94 段）。
 * 🔴 纪律：模块导入一律 pathToFileURL（中文仓路径 percent-encode 防坑）。
 * 执行命令：node --test test/audit-e125-canvas-typography.test.mjs
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
const ENG = await import(pathToFileURL(join(ROOT, 'web/src/lib/canvasTypographyEngine.mjs')).href);
const AMU = await import(pathToFileURL(join(ROOT, 'web/src/lib/amuletCanvasRenderer.mjs')).href);
const LIF = await import(pathToFileURL(join(ROOT, 'web/src/lib/lifestyleCanvasRenderer.mjs')).href);
const TPL = await import(pathToFileURL(join(ROOT, 'web/src/lib/amuletTemplates.mjs')).href);
const LMD = await import(pathToFileURL(join(ROOT, 'web/src/lib/lifestyleMuseData.mjs')).href);

const { CANVAS_TEXT_SAFE_BOUNDS, wrapCanvasText, measureLineExtremes, verticalCenteredStartY } = ENG;
const { LOCALE_CANVAS_CONFIG, AMULET_LAYOUT_ANCHORS } = AMU;
const { LIFESTYLE_LAYOUT_ANCHORS } = LIF;

/* ── 度量模型（字号感知——CJK/全角=fontSize、泰文=fontSize、拉丁≈0.55×）── */
function isCJKCode(ch) {
  const cp = ch.codePointAt(0);
  return (cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF)
    || (cp >= 0xF900 && cp <= 0xFAFF) || (cp >= 0x3000 && cp <= 0x303F)
    || (cp >= 0xFF00 && cp <= 0xFFEF);
}
function isThaiCode(ch) {
  const cp = ch.codePointAt(0);
  return cp >= 0x0E00 && cp <= 0x0E7F;
}
function estimateWidth(text, fontSize) {
  let w = 0;
  for (const ch of Array.from(String(text))) {
    if (isCJKCode(ch)) w += fontSize;
    else if (isThaiCode(ch)) w += fontSize * 0.92;
    else w += fontSize * 0.55;
  }
  return w;
}
/** mock ctx（字号感知 measureText——折行与断言同源自洽） */
function mockCtxOf(fontSize) {
  return { measureText: (t) => ({ width: estimateWidth(t, fontSize) }) };
}
function countCJK(s) {
  return Array.from(String(s)).filter(isCJKCode).length;
}

/* ── 军师病灶原文（生产实弹语料——中英混排含空格）───────────────────── */
const POUCH_PROSE_ZH = '你自带光泽。趁着这股顺滑的金星能量，把心里那句欣赏发给 与 TA——好状态值得被看见，也值得被回应。';
const POUCH_WHISPER_ZH = '今晚 21:00 前发一句真诚的赞赏给 TA。';
const STAR_WHISPER_CORPUS = {
  zh: { prose: POUCH_PROSE_ZH, whisper: POUCH_WHISPER_ZH },
  en: 'You carry a quiet radiance tonight. Venus is gliding through your charm sector, so say the appreciation you have been holding back out loud — good energy deserves a witness, and a reply.'.slice(0, 180),
  fr: 'Tu portes une lueur discrète ce soir. Vénus glisse à travers ton secteur de charme, alors dis à voix haute cette admiration que tu gardes pour toi — une belle énergie mérite un témoin, et une réponse.'.slice(0, 180),
  es: 'Llevas un brillo sereno esta noche. Venus se desliza por tu sector de encanto, así que di en voz alta esa admiración que guardabas — la buena energía merece un testigo, y una respuesta.'.slice(0, 180),
  th: 'คืนนี้คุณมีแสงเรืองรองนุ่มนวล ดาวศุกร์เลื่อนผ่านช่องเสน่ห์ของคุณ จงพูดคำชื่นชมที่เก็บไว้ในใจออกมาดังๆ เพราะพลังงาม ๆ สมควรได้รับการมองเห็นและตอบรับ'.slice(0, 180),
  vi: 'Tối nay bạn mang một ánh dịu dàng. Sao Kim trượt qua cung quyến rũ của bạn, hãy nói lớn lời ngưỡng mộ vẫn giữ trong lòng — năng lượng đẹp xứng đáng được nhìn thấy và được đáp trả.'.slice(0, 180),
};

/* ═══════════ E125-01：安全边界常量 ═══════════ */
test('E125-01 安全边界常量（insetX 140 / maxTextWidth 800 / bound [140,940] / zh 帽 18）', () => {
  assert.equal(CANVAS_TEXT_SAFE_BOUNDS.insetX, 140);
  assert.equal(CANVAS_TEXT_SAFE_BOUNDS.maxTextWidth, 800);
  assert.equal(CANVAS_TEXT_SAFE_BOUNDS.centerInX, 540);
  assert.equal(CANVAS_TEXT_SAFE_BOUNDS.boundMinX, 140);
  assert.equal(CANVAS_TEXT_SAFE_BOUNDS.boundMaxX, 940);
  assert.equal(CANVAS_TEXT_SAFE_BOUNDS.zhMaxCharsPerLine, 18);
  assert.equal(CANVAS_TEXT_SAFE_BOUNDS.verticalDriftMax, 120);
});

/* ═══════════ E125-02：三渲染器接线 ═══════════ */
test('E125-02 三渲染器安全接线：textMaxWidth 均 === 800（AMULET/LIFESTYLE）', () => {
  assert.equal(AMULET_LAYOUT_ANCHORS.textMaxWidth, 800);
  assert.equal(LIFESTYLE_LAYOUT_ANCHORS.textMaxWidth, 800);
  const amuSrc = read('web/src/lib/amuletCanvasRenderer.mjs');
  const lifSrc = read('web/src/lib/lifestyleCanvasRenderer.mjs');
  assert.ok(amuSrc.includes('canvasTypographyEngine.mjs'), 'AMULET 须引通用排字引擎');
  assert.ok(lifSrc.includes('canvasTypographyEngine.mjs'), 'LIFESTYLE 须引通用排字引擎');
  assert.ok(amuSrc.includes('verticalCenteredStartY'), 'AMULET 须接垂直动态居中');
  assert.ok(lifSrc.includes('verticalCenteredStartY'), 'LIFESTYLE 须接垂直动态居中');
  assert.ok(!amuSrc.includes('textMaxWidth: 860') && !lifSrc.includes('textMaxWidth: 860'), '旧 860 须绝迹');
});

/* ═══════════ E125-03：病灶复现根治 ═══════════ */
test('E125-03 病灶根治：军师混排原文逐行宽 ≤800、minX≥140、maxX≤940', () => {
  const zh42 = LOCALE_CANVAS_CONFIG.zh.proseFontSize;
  const ctx = mockCtxOf(zh42);
  const lines = wrapCanvasText(ctx, POUCH_PROSE_ZH, 800, 'zh');
  assert.ok(lines.length >= 3, `折行数须 ≥3（自然四行流式；实为 ${lines.length}）`);
  const ex = measureLineExtremes(ctx, lines);
  assert.equal(ex.overflow, false, `穿透复发：widths=${JSON.stringify(ex.widths)}`);
  assert.ok(ex.widths.every((w) => w <= 800), `存在超宽行：${JSON.stringify(ex.widths)}`);
  assert.ok(ex.minX >= 140 && ex.maxX <= 940, `越界：minX=${ex.minX} maxX=${ex.maxX}`);
});

/* ═══════════ E125-04：旧病灶死亡断言 ═══════════ */
test('E125-04 旧病灶死亡：无任何行 CJK 字数 ≥19（旧病首行 25 字整词放行）', () => {
  const ctx = mockCtxOf(LOCALE_CANVAS_CONFIG.zh.proseFontSize);
  const corpus = [
    POUCH_PROSE_ZH,
    '无空格超长中文测试' + '。把心里那句欣赏发给'.repeat(2),
    `${'极长连排中文'.repeat(4)} 与 TA 以及 precious 这样的英文词混排共存于同一段落里。`,
  ];
  for (const text of corpus) {
    const lines = wrapCanvasText(ctx, text, 800, 'zh');
    for (const line of lines) {
      assert.ok(countCJK(line) <= 18, `超 18 字帽：「${line}」（${countCJK(line)} 字）`);
    }
    for (const line of lines) {
      assert.ok(estimateWidth(line, 42) <= 800, `超宽行：「${line.slice(0, 24)}…」`);
    }
  }
});

/* ═══════════ E125-05：zh 18 字帽 ═══════════ */
test('E125-05 zh 单行 18 字帽（六语中唯 zh 施帽；宽度与字数双闸）', () => {
  const ctx = mockCtxOf(42);
  const longZh = '这是一个特别漫长的中文句子用来验证单行十八个汉字的硬性上限规则是否真正生效并且持续生效';
  const lines = wrapCanvasText(ctx, longZh, 800, 'zh');
  assert.ok(lines.every((l) => countCJK(l) <= 18), '存在超帽行');
  // 42px×18=756 ≤ 800 —— 宽度闸与字帽自洽
  assert.ok(lines.every((l) => estimateWidth(l, 42) <= 800), '存在超宽行');
});

/* ═══════════ E125-06：zh 无空格长文 ═══════════ */
test('E125-06 zh 无空格长文逐字折行安全（旧行为等价回归）', () => {
  const ctx = mockCtxOf(42);
  const text = '水星顺行逆行皆有时序而人心亦如潮汐涨落唯愿你在这流转之中守住自己内心的节奏与光芒不被外物裹挟';
  const lines = wrapCanvasText(ctx, text, 800, 'zh');
  assert.ok(lines.length >= 3, `折行数异常：${lines.length}`);
  assert.ok(lines.length * 18 >= Array.from(text).length, `行数不足以容纳全部字符：${lines.length} 行 vs ${Array.from(text).length} 字`);
  const ex = measureLineExtremes(ctx, lines);
  assert.equal(ex.overflow, false, '无空格长文穿透');
  assert.equal(lines.join(''), text, '逐字折行不得吞字');
});

/* ═══════════ E125-07：拉丁词完整性 ═══════════ */
test('E125-07 en/fr/es 词完整性（join 复原原文——严禁词中途切断）', () => {
  const cases = [
    ['en', 'You carry a quiet radiance tonight, and Venus is gliding through your charm sector with uncommon smoothness.'],
    ['fr', 'Tu portes une lueur discrète ce soir, et Vénus glisse à travers ton secteur de charme avec une douceur rare.'],
    ['es', 'Llevas un brillo sereno esta noche, y Venus se desliza por tu sector de encanto con una suavidad poco común.'],
  ];
  for (const [locale, text] of cases) {
    const fs = LOCALE_CANVAS_CONFIG[locale].proseFontSize;
    const ctx = mockCtxOf(fs);
    const lines = wrapCanvasText(ctx, text, 800, locale);
    assert.ok(lines.length >= 2, `${locale} 折行数异常`);
    const rejoined = lines.join(' ');
    const normalized = text.trim().replace(/\s+/g, ' ');
    assert.equal(rejoined, normalized, `${locale} 折行吞改词（词中断/吞空格）`);
    assert.ok(lines.every((l) => estimateWidth(l, fs) <= 800), `${locale} 存在超宽行`);
  }
});

/* ═══════════ E125-08：th 无空格长文 ═══════════ */
test('E125-08 th 无空格长文逐簇折行安全', () => {
  const fs = LOCALE_CANVAS_CONFIG.th.proseFontSize;
  const ctx = mockCtxOf(fs);
  const text = 'คืนนี้คุณมีแสงเรืองรองนุ่มนวลดาวศุกร์เลื่อนผ่านช่องเสน่ห์ของคุณจงพูดคำชื่นชมที่เก็บไว้ในใจออกมาดังๆเพราะพลังงามๆสมควรได้รับการมองเห็น';
  const lines = wrapCanvasText(ctx, text, 800, 'th');
  assert.ok(lines.length >= 5, `th 折行数异常：${lines.length}`);
  const ex = measureLineExtremes(ctx, lines);
  assert.equal(ex.overflow, false, 'th 长文穿透');
  assert.equal(lines.join(''), text, 'th 逐簇折行不得吞字');
});

/* ═══════════ E125-09：调号不孤行首 ═══════════ */
test('E125-09 th/vi 组合调号永不孤立行首', () => {
  const corpus = [
    ['th', 'อารมณ์ของคุณวันนี้ทรงพลังมากการไหลของดาวศุกร์ช่วยเรื่องความรักและการแสดงออกของความรู้สึกให้กลมกลืนงดงาม'],
    ['vi', 'Quỹ đạo của các vì sao có thể dao động và thủy triều cảm xúc có lúc vơi đầy; nhưng sự trân quý chân thành sẽ luôn tìm được bến đỗ.'],
  ];
  const MARKS = /[\u0300-\u036F\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;
  for (const [locale, text] of corpus) {
    const fs = LOCALE_CANVAS_CONFIG[locale].proseFontSize;
    const ctx = mockCtxOf(fs);
    const lines = wrapCanvasText(ctx, text, 800, locale);
    for (const line of lines) {
      const head = Array.from(line)[0] || '';
      assert.ok(!MARKS.test(head), `${locale} 行首孤立调号：「${line.slice(0, 8)}」`);
    }
  }
});

/* ═══════════ E125-10：标点避头尾 ═══════════ */
test('E125-10 标点避头尾（行首禁句读；折行吞改字零容忍）', () => {
  const ctx = mockCtxOf(42);
  const NO_HEAD = '。，、；：？！…—」』）>';
  for (const text of [POUCH_PROSE_ZH, '行首标点压测文本，逗号之后还有很长很长的内容继续延伸直到必须折行为止。分号；冒号：问号？全都不能出现在行首。']) {
    const lines = wrapCanvasText(ctx, text, 800, 'zh');
    for (const line of lines) {
      const head = Array.from(line)[0] || '';
      assert.ok(!NO_HEAD.includes(head), `行首句读违例：「${line.slice(0, 10)}」`);
    }
  }
});

/* ═══════════ E125-11：3×6 矩阵（36＋6 组穿透发生率 0）═══════════ */
test('E125-11 三卡全矩阵：密函 4 型×6 语＋生活 2 型×6 语＋星语混排 6 语全绿', () => {
  const failures = [];
  // 卡一/二：密函 4 型 × 6 语（amuletTemplates 真源 24 套）
  for (const type of TPL.AMULET_TYPES) {
    for (const locale of TPL.AMULET_LOCALES) {
      const t = TPL.getAmuletTemplate(type, locale);
      if (!t) { failures.push(`amulet ${type}/${locale} 模板缺席`); continue; }
      const fs = LOCALE_CANVAS_CONFIG[locale].proseFontSize;
      const ctx = mockCtxOf(fs);
      for (const field of ['prose', 'companionWhisper']) {
        const lines = wrapCanvasText(ctx, t[field], 800, locale);
        const ex = measureLineExtremes(ctx, lines);
        if (ex.overflow) failures.push(`amulet ${type}/${locale}/${field}: ${JSON.stringify(ex.widths)}`);
      }
    }
  }
  // 卡三：生活 2 型 × 6 语（lifestyleMuseData 真源 12 套）
  const LMD_TEMPLATES = LMD.LIFESTYLE_TEMPLATES_12 || LMD.LIFESTYLE_TEMPLATES;
  const lTypes = Object.keys(LMD_TEMPLATES || {});
  for (const type of lTypes) {
    const row = LMD_TEMPLATES[type] || {};
    for (const locale of LANGS) {
      const t = row[locale];
      if (!t || !t.prose) { failures.push(`lifestyle ${type}/${locale} 模板缺席`); continue; }
      const fs = LOCALE_CANVAS_CONFIG[locale].proseFontSize;
      const ctx = mockCtxOf(fs);
      for (const field of ['prose', 'companionWhisper']) {
        const lines = wrapCanvasText(ctx, t[field], 800, locale);
        const ex = measureLineExtremes(ctx, lines);
        if (ex.overflow) failures.push(`lifestyle ${type}/${locale}/${field}: ${JSON.stringify(ex.widths)}`);
      }
    }
  }
  // 星语动态混排 6 语（生产病灶同源语料——server 动态文本形状）
  for (const locale of LANGS) {
    const corpus = STAR_WHISPER_CORPUS[locale];
    const prose = typeof corpus === 'string' ? corpus : corpus.prose;
    const whisper = typeof corpus === 'string' ? 'Reply with one honest sentence tonight.' : corpus.whisper;
    const fs = LOCALE_CANVAS_CONFIG[locale].proseFontSize;
    const ctx = mockCtxOf(fs);
    for (const text of [prose, whisper]) {
      const lines = wrapCanvasText(ctx, text, 800, locale);
      const ex = measureLineExtremes(ctx, lines);
      if (ex.overflow) failures.push(`starwhisper ${locale}: ${JSON.stringify(ex.widths)}`);
    }
  }
  assert.deepEqual(failures, [], `矩阵穿透 ${failures.length} 组：\n${failures.join('\n')}`);
});

/* ═══════════ E125-12：垂直动态居中 ═══════════ */
test('E125-12 垂直动态居中（clamp ≤120 / 短文下沉 / 长文贴顶）', () => {
  // 长文（占满可用区 712px）：贴顶零漂移
  assert.equal(verticalCenteredStartY(712, 800, 1512), 800);
  assert.equal(verticalCenteredStartY(800, 800, 1512), 800);
  // 短文（130px，slack=582×0.35=203.7 → clamp 120）
  assert.equal(verticalCenteredStartY(130, 800, 1512), 920);
  // 中等（slack=200 → drift=70）
  assert.equal(verticalCenteredStartY(512, 800, 1512), 870);
  // 永不超出下沉上限
  for (const h of [0, 100, 300, 600, 712, 900]) {
    const y = verticalCenteredStartY(h, 800, 1512);
    assert.ok(y >= 800 && y <= 920, `Y 漂移越界：h=${h} y=${y}`);
  }
});

/* ═══════════ E125-13：渲染管线端到端自洽 ═══════════ */
test('E125-13 渲染端到端：管线 fillText 正文行全部落在安全区（三卡）', async () => {
  async function renderWithProbe(renderFn, template, locale, opts) {
    const fs = LOCALE_CANVAS_CONFIG[locale].proseFontSize;
    const calls = [];
    const ctx = {
      _font: '10px x',
      fillText: (text, x, y) => { calls.push({ text: String(text), x, y, font: ctx._font }); },
      measureText: (t) => {
        const m = /(\d+(?:\.\d+)?)px/.exec(ctx._font);
        const size = m ? Number(m[1]) : 10;
        return { width: estimateWidth(t, size) };
      },
      fillRect: () => {}, strokeRect: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {},
      arc: () => {}, closePath: () => {}, arcTo: () => {}, save: () => {}, restore: () => {},
      roundRect: () => {}, drawImage: () => {},
    };
    Object.defineProperty(ctx, 'font', {
      get: () => ctx._font,
      set: (v) => { ctx._font = String(v); },
    });
    const canvas = { width: 0, height: 0, getContext: () => ctx };
    await renderFn(canvas, template, locale, opts);
    return { calls, proseFontSize: fs };
  }

  const violations = [];
  // 密函卡（zh 混排极端语料——军师原文形状注入模板）
  const zhTpl = TPL.getAmuletTemplate('support', 'zh');
  const mixedTpl = { ...zhTpl, prose: POUCH_PROSE_ZH, companionWhisper: POUCH_WHISPER_ZH };
  const amuRes = await renderWithProbe(AMU.renderAmuletToCanvas, mixedTpl, 'zh', { type: 'support' });
  // 生活卡（style zh / roadtrip th）
  const LMD_TEMPLATES = LMD.LIFESTYLE_TEMPLATES_12 || LMD.LIFESTYLE_TEMPLATES;
  const styleZh = LMD_TEMPLATES.style ? LMD_TEMPLATES.style.zh : null;
  if (styleZh) {
    const lifRes = await renderWithProbe(LIF.renderLifestyleToCanvas, styleZh, 'zh', { type: 'style' });
    checkCalls(lifRes, 'lifestyle-style/zh', violations);
  }
  const roadTh = LMD_TEMPLATES.roadtrip ? LMD_TEMPLATES.roadtrip.th : null;
  if (roadTh) {
    const lifRes2 = await renderWithProbe(LIF.renderLifestyleToCanvas, roadTh, 'th', { type: 'roadtrip' });
    checkCalls(lifRes2, 'lifestyle-roadtrip/th', violations);
  }
  checkCalls(amuRes, 'amulet/zh-mixed', violations);

  function checkCalls(res, tag, violationsAcc) {
    // 只审正文/密语行（prose 区 y∈[760,1530]、字号 ≥26——排除题头/标牌/水印）
    for (const c of res.calls) {
      const m = /(\d+(?:\.\d+)?)px/.exec(c.font);
      const size = m ? Number(m[1]) : 10;
      if (c.y < 760 || c.y > 1530 || size < 26) continue;
      const w = estimateWidth(c.text, size);
      if (w > 800) violationsAcc.push(`${tag} 超宽行(${Math.round(w)}px@${size}px)：「${c.text.slice(0, 22)}」`);
    }
  }
  assert.deepEqual(violations, [], `渲染管线穿透：\n${violations.join('\n')}`);
});

/* ═══════════ E125-15：吉时/共振窗标牌宽度闸（热修 2026-11-05）═══════════ */
test('E125-15 windowPlate 宽度闸：mono 严格模型下缩字号/折行恒 ≤800（真源全矩阵）', async () => {
  const { shrinkPlateFontSize } = ENG;
  // mono 严格度量模型（浏览器真实等宽 ≈0.62×字号/字符＋1px/字符字距——E125
  // 实弹像素审计校准；旧 mock 0.55 低估致 style-fr 标牌 890px 穿透逃逸，
  // 字距逃逸（度量不含 letterSpacing ⇒ 绘制增宽 ~50px）亦堵死，本闸以严格模型堵口）
  const monoWidth = (t, fs) => {
    let w = 0;
    for (const ch of Array.from(String(t))) {
      if (isCJKCode(ch)) w += fs;
      else if (isThaiCode(ch)) w += fs * 0.92;
      else w += fs * 0.62;
      w += 1; // 标牌 letterSpacing 1px/字符（绘制真宽）
    }
    return w;
  };
  const monoCtxOf = () => {
    const ctx = { _font: '28px mono' };
    ctx.measureText = (t) => {
      const m = /(\d+(?:\.\d+)?)px/.exec(ctx._font);
      const size = m ? Number(m[1]) : 28;
      return { width: monoWidth(t, size) };
    };
    Object.defineProperty(ctx, 'font', {
      get: () => ctx._font,
      set: (v) => { ctx._font = String(v); },
    });
    return ctx;
  };
  // ① 源码接线门禁：两渲染器均须接缩字号闸＋折行兜底
  for (const src of ['web/src/lib/amuletCanvasRenderer.mjs', 'web/src/lib/lifestyleCanvasRenderer.mjs']) {
    const s = read(src);
    assert.ok(s.includes('shrinkPlateFontSize'), `${src} 须接标牌缩字号闸`);
    assert.ok(s.includes('wrapCanvasText(ctx, windowPlate'), `${src} 须有折行兜底`);
  }
  // ② 真源全矩阵：密函 24 套＋生活 12 套（bestWindowPrefix＋defaultTiming 拼装）
  const plates = [];
  for (const type of TPL.AMULET_TYPES) {
    for (const locale of TPL.AMULET_LOCALES) {
      const t = TPL.getAmuletTemplate(type, locale);
      if (t && t.bestWindowPrefix && t.defaultTiming) {
        plates.push([`amulet/${type}/${locale}`, `${t.bestWindowPrefix}: ${t.defaultTiming}`]);
      }
    }
  }
  const LMD_TEMPLATES = LMD.LIFESTYLE_TEMPLATES_12 || LMD.LIFESTYLE_TEMPLATES;
  for (const type of Object.keys(LMD_TEMPLATES || {})) {
    for (const locale of LANGS) {
      const t = LMD_TEMPLATES[type] && LMD_TEMPLATES[type][locale];
      if (t && t.bestWindowPrefix && t.defaultTiming) {
        plates.push([`lifestyle/${type}/${locale}`, `${t.bestWindowPrefix}: ${t.defaultTiming}`]);
      }
    }
  }
  assert.ok(plates.length >= 30, `标牌样本须 ≥30（实为 ${plates.length}——真源字段缺席须暴露）`);
  const violations = [];
  for (const [tag, plate] of plates) {
    const ctx = monoCtxOf();
    const fit = shrinkPlateFontSize(ctx, plate, 800, (s) => { ctx.font = `${s}px mono`; }, 28, 19);
    if (fit.fits) {
      if (monoWidth(plate, fit.size) > 800) {
        violations.push(`${tag}: fits 谎报 ${Math.round(monoWidth(plate, fit.size))}px@${fit.size}px`);
      }
      continue;
    }
    const lines = wrapCanvasText(ctx, plate, 800, 'en');
    for (const ln of lines) {
      if (monoWidth(ln, 19) > 800) violations.push(`${tag}: 折行后仍超宽「${ln.slice(0, 20)}」`);
    }
  }
  assert.deepEqual(violations, [], `标牌穿透：\n${violations.join('\n')}`);
  // ③ 病灶复现根治：style-fr 法语标牌严格 mono 超宽 ⇒ 缩字号收纳（raw>800 触发）
  const frPlate = plates.find(([tag]) => tag === 'lifestyle/style/fr');
  if (frPlate) {
    const raw = monoWidth(frPlate[1], 28);
    const ctx = monoCtxOf();
    const fit = shrinkPlateFontSize(ctx, frPlate[1], 800, (s) => { ctx.font = `${s}px mono`; }, 28, 19);
    if (raw > 800) {
      assert.ok(fit.fits && fit.size < 28, `style-fr 标牌须缩字号收纳（raw=${Math.round(raw)}px → ${fit.size}px）`);
    } else {
      assert.ok(fit.fits, 'style-fr 标牌恒须收纳');
    }
  }
  // ④ 渲染端到端：style-fr 真管线（严格 mono 度量）全部居中 fillText 行 ≤800
  const frTpl = LMD_TEMPLATES.style ? LMD_TEMPLATES.style.fr : null;
  if (frTpl) {
    const calls = [];
    const ctx = { _font: '10px x' };
    Object.assign(ctx, {
      fillText: (text, x, y) => { calls.push({ text: String(text), x, y, font: ctx._font }); },
      measureText: (t) => {
        const m = /(\d+(?:\.\d+)?)px/.exec(ctx._font);
        const size = m ? Number(m[1]) : 10;
        return { width: monoWidth(t, size) };
      },
      fillRect: () => {}, strokeRect: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {},
      arc: () => {}, closePath: () => {}, arcTo: () => {}, save: () => {}, restore: () => {},
      roundRect: () => {}, drawImage: () => {},
    });
    Object.defineProperty(ctx, 'font', {
      get: () => ctx._font,
      set: (v) => { ctx._font = String(v); },
    });
    const canvas = { width: 0, height: 0, getContext: () => ctx };
    await LIF.renderLifestyleToCanvas(canvas, frTpl, 'fr', { type: 'style' });
    const e2eViolations = [];
    for (const c of calls) {
      // 只对标牌带（y∈[1500,1600] 居中行）施 mono+字距严格模型——正文行无字距，
      // 由 E125-13 以同源度量覆盖（严禁混用口径致假红）
      if (c.x !== 540 || c.y < 1500 || c.y > 1600) continue;
      const m = /(\d+(?:\.\d+)?)px/.exec(c.font);
      const size = m ? Number(m[1]) : 10;
      const w = monoWidth(c.text, size);
      if (w > 800) e2eViolations.push(`style-fr 标牌管线超宽(${Math.round(w)}px@${size}px)：「${c.text.slice(0, 26)}」`);
    }
    assert.deepEqual(e2eViolations, [], `style-fr 管线穿透：\n${e2eViolations.join('\n')}`);
    // 标牌行必在（防「零调用假绿」）
    const plateCalls = calls.filter((c) => c.x === 540 && c.y >= 1500 && c.y <= 1600);
    assert.ok(plateCalls.length >= 1, 'style-fr 标牌行缺席（管线未绘制标牌须暴露）');
  }
});

/* ═══════════ S14 链位自保 ═══════════ */
test('E125-S14 链位自保：e125 入编（e124 后、e40-compat 前；全链 93→94 段）', () => {
  const pkg = JSON.parse(read('package.json'));
  const chain = pkg.scripts['test:astro'];
  const segs = chain.split('&&').map((s) => s.trim()).filter(Boolean);
  assert.equal(segs.length, 101, `军规链段数须为 94（E125 入编后 93→94；实为 ${segs.length}）`);
  const iE125 = segs.findIndex((s) => s.includes('audit-e125-canvas-typography'));
  const iE124 = segs.findIndex((s) => s.includes('audit-e124-lifestyle-muse'));
  const iCompat = segs.findIndex((s) => s.includes('audit-e40-compat'));
  assert.ok(iE125 > iE124, 'e125 须居 e124 之后');
  assert.ok(iE125 < iCompat, 'e125 须居 e40-compat 之前');
  assert.ok(iCompat === segs.length - 2, 'e40-compat 恒 len-2');
});
