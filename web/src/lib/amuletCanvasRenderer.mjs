/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120-刀三（主公军令 2026-11-03）：1:1.618 破冰密函 Canvas 离屏渲染引擎
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：画布绝对尺寸 1080 × 1748 px（1:1.618 黄金矩形锁死，比例容差 <0.001）；
 * 纯前端原生 Canvas 离屏渲染（🔴 零 fetch/XHR/远程图——离线铁律沿袭 E105 金卡）。
 * 四层绝对绘制管线：
 *   Layer 1 维多利亚星轨暗金底纹（#0B0B0E 底色 + 径向暗金晕 #1A1721 + 4px
 *          双层几何细金框 #D4AF37/#F3E5AB + 四角星芒饰）；
 *   Layer 2 韦特大阿卡纳正统矢量线稿（goldCardTotems.mjs cardId 分发：
 *          恋人 6 / 节制 14 / 星星 17 / 太阳 19——金卡 E107 资产复用，防过度工程化）；
 *   Layer 3 灵宠代写文案排版（六语自适应 LOCALE_CANVAS_CONFIG＋折行引擎＋
 *          天文破冰吉时标牌 Y:1540）；
 *   Layer 4 底部权威防伪水印（Y:1640 细金分隔线 / Y:1680 居中
 *          kindredsouls.online / 右下 KS-AMULET-{TYP}-{LOCALE} 22px 等宽字）。
 * 性能军令：整张高清图离屏绘制导出 < 200ms、体积 < 1.2MB（PNG）。
 * node:test 兼容：无 DOM 环境自动降级桩图（drawImage no-op，fillText 语义
 * 断言不受影响——军师钦定 Mock Canvas Context 方案）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { AMULET_CARD_ID, AMULET_TYPE_STAMP } from './amuletTemplates.mjs';
import { goldCardTotemUri } from './goldCardTotems.mjs';
import { CANVAS_TEXT_SAFE_BOUNDS, wrapCanvasText, verticalCenteredStartY, shrinkPlateFontSize } from './canvasTypographyEngine.mjs';

/** 画布绝对尺寸（军令锁死——1:1.618 黄金矩形；1748/1080=1.61852 容差 0.0005<0.001） */
export const AMULET_DIMENSIONS = Object.freeze({ width: 1080, height: 1748 });

/** 黄金比例容差（军令断言 2 锚） */
export const GOLDEN_RATIO_TOLERANCE = 0.001;

/** 官方域名（军令锁死——严禁改写） */
export const AMULET_OFFICIAL_DOMAIN = 'kindredsouls.online';

/** 防伪章前缀（军令断言 3 锚：合法前缀 KS-AMULET-） */
export const AMULET_STAMP_PREFIX = 'KS-AMULET-';

/** 版面绝对锚点（军令钦定 Y 轴像素位） */
export const AMULET_LAYOUT_ANCHORS = Object.freeze({
  titleY: 148,
  subtitleY: 204,
  hostLineY: 258,
  totemCenterY: 480,
  totemSize: 420,
  proseTopY: 800,
  textSafeBottomY: 1512, // 文本安全区下界（防与吉时标牌重叠）
  windowPlateY: 1540,
  separatorY: 1640,
  domainY: 1682,
  stampY: 1698,
  frameOuterInset: 28,
  frameInnerInset: 40,
  textMaxWidth: CANVAS_TEXT_SAFE_BOUNDS.maxTextWidth, // E125 军令锁死 800（x∈[140,940]）
});

/**
 * 六语排版自适应参数（军令钦定表——泰文行高 1.8 防上下调号被切；
 * 越文 topPaddingOffset +8 容纳声调堆叠；法西 34px 防长词膨胀折行过多）
 * @type {Record<string, {proseFontSize:number, whisperFontSize:number, lineHeight:number, fontFamily:string, topPaddingOffset:number, stack:string, sansStack:string}>}
 */
export const LOCALE_CANVAS_CONFIG = Object.freeze({
  zh: Object.freeze({ proseFontSize: 42, whisperFontSize: 34, lineHeight: 1.5, fontFamily: 'Noto Serif SC', topPaddingOffset: 0, stack: '"Noto Serif SC","Songti SC","STSong","SimSun",serif' }),
  en: Object.freeze({ proseFontSize: 38, whisperFontSize: 32, lineHeight: 1.45, fontFamily: 'Cormorant Garamond', topPaddingOffset: 0, stack: '"Cormorant Garamond","Cinzel","Times New Roman",Georgia,serif' }),
  fr: Object.freeze({ proseFontSize: 34, whisperFontSize: 30, lineHeight: 1.4, fontFamily: 'Cormorant Garamond', topPaddingOffset: 0, stack: '"Cormorant Garamond","EB Garamond","Times New Roman",Georgia,serif' }),
  es: Object.freeze({ proseFontSize: 34, whisperFontSize: 30, lineHeight: 1.4, fontFamily: 'Cormorant Garamond', topPaddingOffset: 0, stack: '"Cormorant Garamond","Georgia","Times New Roman",serif' }),
  th: Object.freeze({ proseFontSize: 36, whisperFontSize: 31, lineHeight: 1.8, fontFamily: 'Kanit', topPaddingOffset: -10, stack: '"Kanit","Noto Sans Thai","Noto Serif Thai","Sukhumvit Set",sans-serif' }),
  vi: Object.freeze({ proseFontSize: 35, whisperFontSize: 31, lineHeight: 1.65, fontFamily: 'Noto Serif', topPaddingOffset: 8, stack: '"Noto Serif","Cormorant Garamond","Times New Roman",Georgia,serif' }),
});

/** 等宽字体栈（时空窗口标牌与防伪哈希——肃穆权威感） */
const MONO_STACK = '"JetBrains Mono","SF Mono",Menlo,Consolas,monospace';

/** 域名印章字体栈（Cinzel / Trajan 体系——离线系统栈逐级降级） */
const SEAL_STACK = '"Cinzel","Trajan Pro","Times New Roman",Georgia,serif';

/** 色阶（金卡同源暗金体系） */
const GOLD = '#D4AF37';
const CHAMPAGNE = '#F3E5AB';
const PROSE_COLOR = '#E8D9A8';
const WHISPER_COLOR = '#D4BC7A';

/* ── 确定性 PRNG（mulberry32——星点可复现，同参数恒出同图）────────────── */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 图腾装载（离线 data:URI；node 无 DOM ⇒ 桩图降级，drawImage 语义免测） */
function loadTotemImage(uri) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      resolve({ width: 130, height: 130, __nodeStub: true });
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve({ width: 130, height: 130, __fallback: true });
    img.src = uri;
  });
}

/**
 * 折行引擎——E125 起统一走 canvasTypographyEngine（通用安全排字：中英混排
 * 两级 token 化＋zh 18 字帽＋标点避头尾）。本函数保留为薄转发壳，防既有
 * 内部调用点漂移；行为真源在 wrapCanvasText。
 */
function wrapLines(ctx, text, maxWidth, locale) {
  return wrapCanvasText(ctx, text, maxWidth, locale || 'en');
}

/** 字体串装配（weight 省略——衬线优雅优先） */
function fontOf(sizePx, stack) {
  return `${sizePx}px ${stack}`;
}

/** 防伪章合成（KS-AMULET-{TYP}-{SUFFIX}——军令断言 3 前缀锚） */
export function composeAmuletStamp(type, locale, hashId) {
  const typ = AMULET_TYPE_STAMP[type] || 'GEN';
  let suffix = String(hashId == null ? '' : hashId).trim();
  if (suffix.startsWith(AMULET_STAMP_PREFIX)) suffix = suffix.slice(AMULET_STAMP_PREFIX.length);
  if (!suffix) suffix = String(locale || 'XX').toUpperCase();
  return `${AMULET_STAMP_PREFIX}${typ}-${suffix.toUpperCase()}`;
}

/**
 * 密函渲染主入口（军令刀三——浏览器生产与批量导出单一事实源）
 * @param {object} canvas 目标画布（浏览器 HTMLCanvasElement / node 测试桩）
 * @param {object} template 六语密函模板（amuletTemplates.mjs 真源）
 * @param {string} locale 六语之一
 * @param {{hostName?:string, partnerName?:string, type?:string, hashId?:string}} options
 *   type 密函类型（防伪章与图腾分发必需）；hashId 自定义章尾（缺省用 locale）
 * @returns {Promise<object>} 渲染后的画布（toBlob/toDataURL 由调用方消费）
 */
export async function renderAmuletToCanvas(canvas, template, locale, options = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') {
    throw new Error('amulet renderer: canvas unavailable');
  }
  if (!template || !template.prose) {
    throw new Error('amulet renderer: template missing (fail-closed)');
  }
  const cfg = LOCALE_CANVAS_CONFIG[locale] || LOCALE_CANVAS_CONFIG.en;
  const A = AMULET_LAYOUT_ANCHORS;

  // ① 尺寸锁死（军令断言 2：width=1080 / height=1748 / |ratio-1.618|<0.001）
  canvas.width = AMULET_DIMENSIONS.width;
  canvas.height = AMULET_DIMENSIONS.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('amulet renderer: 2d context unavailable');
  const W = AMULET_DIMENSIONS.width;
  const H = AMULET_DIMENSIONS.height;
  const CX = W / 2;

  /* ══ Layer 1：维多利亚星轨暗金底纹 ══ */
  ctx.fillStyle = '#0B0B0E';
  ctx.fillRect(0, 0, W, H);
  // 径向暗金晕（#1A1721 柔和暗金——军令参数；🔴 E120 体积军令（导出 <1.2MB）：
  //    全画布平滑渐变会令 PNG 行级带状压缩劣化（实测单独 +1.1MB），故渐变收拢为
  //    图腾衬底局域光晕（外缘恒 #0B0B0E 无缝衔接），大面纯色底保 PNG 行程压缩）
  const grad = ctx.createRadialGradient(CX, A.totemCenterY, 60, CX, A.totemCenterY, 520);
  if (grad && typeof grad.addColorStop === 'function') {
    grad.addColorStop(0, '#1A1721');
    grad.addColorStop(1, '#0B0B0E');
    ctx.fillStyle = grad;
    ctx.fillRect(90, 200, W - 180, 760);
  }
  // 确定性星轨星点（seed=模板字符码——同参数恒出同图）
  const seed = [...`${locale}:${template.title}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = mulberry32(seed);
  ctx.fillStyle = CHAMPAGNE;
  for (let i = 0; i < 64; i++) {
    const x = 60 + rand() * (W - 120);
    const y = 60 + rand() * (H * 0.55);
    const r = 0.8 + rand() * 1.6;
    ctx.globalAlpha = 0.18 + rand() * 0.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // 双层几何细金框（外 4px #D4AF37 / 内 1.5px #F3E5AB 发丝线）
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.strokeRect(A.frameOuterInset, A.frameOuterInset, W - A.frameOuterInset * 2, H - A.frameOuterInset * 2);
  ctx.strokeStyle = CHAMPAGNE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(A.frameInnerInset, A.frameInnerInset, W - A.frameInnerInset * 2, H - A.frameInnerInset * 2);
  // 四角星芒饰（维多利亚纹样——四芒星 12px）
  drawCornerStar(ctx, A.frameOuterInset + 22, A.frameOuterInset + 22);
  drawCornerStar(ctx, W - A.frameOuterInset - 22, A.frameOuterInset + 22);
  drawCornerStar(ctx, A.frameOuterInset + 22, H - A.frameOuterInset - 22);
  drawCornerStar(ctx, W - A.frameOuterInset - 22, H - A.frameOuterInset - 22);

  /* ══ Layer 2：韦特塔罗大阿卡纳矢量线稿（金卡资产复用）══ */
  const type = options.type;
  const cardId = AMULET_CARD_ID[type] == null ? 21 : AMULET_CARD_ID[type];
  const totemImg = await loadTotemImage(goldCardTotemUri(cardId));
  if (totemImg && !totemImg.__fallback) {
    const size = A.totemSize;
    ctx.globalAlpha = 0.95;
    try {
      ctx.drawImage(totemImg, CX - size / 2, A.totemCenterY - size / 2, size, size);
    } catch { /* 桩图 no-op（node 环境 drawImage 免测） */ }
    ctx.globalAlpha = 1;
  }
  // 图腾衬底光环（双环金晕——压印质感）
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(CX, A.totemCenterY, A.totemSize / 2 + 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CX, A.totemCenterY, A.totemSize / 2 + 34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  /* ══ Layer 3：六语文案排版 ══ */
  ctx.textAlign = 'center';
  // 题头（大写衬线金——letterSpacing 4px 尽力而为，环境不支持则静默）
  trySet(ctx, 'letterSpacing', '4px');
  ctx.font = fontOf(48, cfg.stack);
  ctx.fillStyle = CHAMPAGNE;
  ctx.globalAlpha = 0.96;
  ctx.fillText(template.title, CX, A.titleY);
  // 副题（小号金——间距 3px）
  trySet(ctx, 'letterSpacing', '3px');
  ctx.font = fontOf(25, cfg.stack);
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.9;
  ctx.fillText(template.subtitle, CX, A.subtitleY);
  // 宿主落款（E118 称谓插值——有名字才渲染，无名字零破坏）
  trySet(ctx, 'letterSpacing', '1px');
  const host = String(options.hostName || '').trim();
  const partner = String(options.partnerName || '').trim();
  if (host || partner) {
    ctx.font = fontOf(27, cfg.stack);
    ctx.fillStyle = PROSE_COLOR;
    ctx.globalAlpha = 0.78;
    const signature = host && partner ? `✦ ${host} ✦ ${partner} ✦` : `✦ ${host || partner} ✦`;
    ctx.fillText(signature, CX, A.hostLineY);
  }
  ctx.globalAlpha = 1;
  trySet(ctx, 'letterSpacing', '0px');

  // 诗意正文＋灵宠密语（安全区自适应：超界等比降字号，下限 0.72——防溢出重叠）
  // 🏆 E125：折行走通用引擎（locale 感知）＋行宽军令 800；垂直方向动态居中
  //   （轻量下沉 clamp≤120px——短文案不压顶、长文案不悬空）
  let proseSize = cfg.proseFontSize;
  let whisperSize = cfg.whisperFontSize;
  let proseLines;
  let whisperLines;
  let totalHeight;
  const gapBetween = 46;
  const anchorTopY = A.proseTopY + cfg.topPaddingOffset;
  for (let attempt = 0; attempt < 8; attempt++) {
    ctx.font = fontOf(proseSize, cfg.stack);
    proseLines = wrapLines(ctx, template.prose, A.textMaxWidth, locale);
    ctx.font = fontOf(whisperSize, cfg.stack);
    whisperLines = wrapLines(ctx, template.companionWhisper, A.textMaxWidth, locale);
    totalHeight = proseLines.length * proseSize * cfg.lineHeight
      + gapBetween
      + whisperLines.length * whisperSize * cfg.lineHeight;
    if (anchorTopY + totalHeight <= A.textSafeBottomY) break;
    proseSize = Math.max(30, Math.round(proseSize * 0.94));
    whisperSize = Math.max(26, Math.round(whisperSize * 0.94));
  }
  const topY = verticalCenteredStartY(totalHeight, anchorTopY, A.textSafeBottomY);
  ctx.font = fontOf(proseSize, cfg.stack);
  ctx.fillStyle = PROSE_COLOR;
  ctx.globalAlpha = 0.95;
  let y = topY;
  for (const line of proseLines) {
    ctx.fillText(line, CX, y);
    y += proseSize * cfg.lineHeight;
  }
  // 灵宠密语（强调行——香槟金细体＋前后缀饰）
  y += gapBetween - proseSize * cfg.lineHeight + whisperSize * cfg.lineHeight * 0.35;
  ctx.font = fontOf(whisperSize, cfg.stack);
  ctx.fillStyle = WHISPER_COLOR;
  ctx.globalAlpha = 0.92;
  for (const line of whisperLines) {
    ctx.fillText(line, CX, y);
    y += whisperSize * cfg.lineHeight;
  }
  ctx.globalAlpha = 1;

  // 天文破冰吉时标牌（Y:1540 军令锚——等宽暗金）
  // E125 热修：宽度闸——先置字距再度量（Chromium measureText 含 letterSpacing，
  // 严防「度量不含字距、绘制增宽」逃逸），自适应缩字号，触底仍超宽走引擎折行兜底
  const windowPlate = `${template.bestWindowPrefix}: ${template.defaultTiming}`;
  ctx.font = fontOf(28, MONO_STACK);
  trySet(ctx, 'letterSpacing', '1px');
  const plateFit = shrinkPlateFontSize(
    ctx, windowPlate, CANVAS_TEXT_SAFE_BOUNDS.maxTextWidth,
    (s) => { ctx.font = fontOf(s, MONO_STACK); }
  );
  const plateLines = plateFit.fits
    ? [windowPlate]
    : wrapCanvasText(ctx, windowPlate, CANVAS_TEXT_SAFE_BOUNDS.maxTextWidth, locale || 'en');
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.92;
  if (plateLines.length === 1) {
    ctx.fillText(plateLines[0], CX, A.windowPlateY);
  } else {
    const plateGap = 38;
    const plateY0 = A.windowPlateY - Math.round(((plateLines.length - 1) * plateGap) / 2);
    plateLines.forEach((ln, i) => ctx.fillText(ln, CX, plateY0 + i * plateGap));
  }
  ctx.globalAlpha = 1;
  trySet(ctx, 'letterSpacing', '0px');

  /* ══ Layer 4：底部权威防伪水印（军令 Y 轴绝对锚）══ */
  // Y:1640 维多利亚细金分隔横线（Alpha 0.3）
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(140, A.separatorY);
  ctx.lineTo(W - 140, A.separatorY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  // Y:1680 正中官方域名（Cinzel/Trajan、字距 3px、#D4AF37）
  ctx.textAlign = 'center';
  trySet(ctx, 'letterSpacing', '3px');
  ctx.font = fontOf(26, SEAL_STACK);
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.95;
  ctx.fillText(AMULET_OFFICIAL_DOMAIN, CX, A.domainY);
  ctx.globalAlpha = 1;
  trySet(ctx, 'letterSpacing', '0px');
  // 右下防伪哈希（等宽 22px、Alpha 0.6、右缘内衬 40px）
  const stamp = composeAmuletStamp(type, locale, options.hashId);
  ctx.textAlign = 'right';
  ctx.font = fontOf(22, MONO_STACK);
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.6;
  ctx.fillText(stamp, W - 40, A.stampY);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  return canvas;
}

/** 属性尽力装配（letterSpacing 等新特性——旧环境静默降级） */
function trySet(ctx, key, value) {
  try { ctx[key] = value; } catch { /* 静默降级 */ }
}

/** 四角星芒饰（维多利亚纹样笔法） */
function drawCornerStar(ctx, x, y) {
  const r = 12;
  ctx.strokeStyle = CHAMPAGNE;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const ang = (Math.PI / 2) * k;
    const dx = Math.cos(ang) * r;
    const dy = Math.sin(ang) * r;
    if (k === 0) ctx.moveTo(x + dx, y + dy);
    else ctx.lineTo(x + dx, y + dy);
    const mx = Math.cos(ang + Math.PI / 4) * r * 0.32;
    const my = Math.sin(ang + Math.PI / 4) * r * 0.32;
    ctx.lineTo(x + mx, y + my);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** 画布工厂（浏览器——离屏 1080×1748 锁死；军令刀三配套） */
export function createAmuletCanvas() {
  if (typeof document === 'undefined') {
    throw new Error('createAmuletCanvas: browser only（node 测试请自备桩画布）');
  }
  const canvas = document.createElement('canvas');
  canvas.width = AMULET_DIMENSIONS.width;
  canvas.height = AMULET_DIMENSIONS.height;
  return canvas;
}

/** 黄金比例校验（军令断言 2 直用） */
export function isGoldenRatioCanvas(canvas) {
  const { width, height } = canvas || {};
  if (width !== AMULET_DIMENSIONS.width || height !== AMULET_DIMENSIONS.height) return false;
  return Math.abs(height / width - 1.618) < GOLDEN_RATIO_TOLERANCE;
}
