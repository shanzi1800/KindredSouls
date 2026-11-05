/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E124-LIFESTYLE-MUSE 刀三（主公军令 2026-11-05）：生活方式卡 Canvas 引擎
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚：画布 1080×1748（1:1.618 黄金矩形锁死——常量直接复用 AMULET 引擎）；
 * 纯前端离屏渲染（🔴 零 fetch/XHR/远程图——离线铁律沿袭 E105/E120）。
 * 四层绘制管线（E120 同构）：
 *   Layer 1 维多利亚星轨暗金底纹（#0B0B0E＋局域金晕＋确定性星点＋双层金框）；
 *   Layer 2 徽记区（Y:480）——style ⇒ 三组能量色盘色块（hex＋名称）；
 *          roadtrip ⇒ 吉方罗盘几何徽记（外环＋方位十字＋金针指 heading）；
 *   Layer 3 六语文案排版（LOCALE_CANVAS_CONFIG 自适应＋折行引擎＋吉时标牌）；
 *   Layer 4 底部防伪水印（分隔线/官方域名/右下 KS-STYLE-|KS-ROADTRIP- 章）。
 * node:test 兼容：mock ctx 语义断言不受影响（measureText 缺席保守整段）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { AMULET_DIMENSIONS, GOLDEN_RATIO_TOLERANCE, AMULET_OFFICIAL_DOMAIN, LOCALE_CANVAS_CONFIG } from './amuletCanvasRenderer.mjs';
import { LIFESTYLE_STAMP } from './lifestyleMuseData.mjs';
import { CANVAS_TEXT_SAFE_BOUNDS, wrapCanvasText, verticalCenteredStartY, shrinkPlateFontSize } from './canvasTypographyEngine.mjs';

/** 版面绝对锚点（E120 同构——徽记区 Y:480 三分区） */
export const LIFESTYLE_LAYOUT_ANCHORS = Object.freeze({
  titleY: 148,
  subtitleY: 204,
  hostLineY: 258,
  emblemCenterY: 470,
  emblemSize: 400,
  proseTopY: 780,
  textSafeBottomY: 1512,
  windowPlateY: 1540,
  separatorY: 1640,
  domainY: 1682,
  stampY: 1698,
  frameOuterInset: 28,
  frameInnerInset: 40,
  textMaxWidth: CANVAS_TEXT_SAFE_BOUNDS.maxTextWidth, // E125 军令锁死 800（x∈[140,940]）
});

const GOLD = '#D4AF37';
const CHAMPAGNE = '#F3E5AB';
const PROSE_COLOR = '#E8D9A8';
const WHISPER_COLOR = '#D4BC7A';
const MONO_STACK = '"JetBrains Mono","SF Mono",Menlo,Consolas,monospace';
const SEAL_STACK = '"Cinzel","Trajan Pro","Times New Roman",Georgia,serif';

/* ── 确定性 PRNG（mulberry32——E120 同款，同参数恒出同图）── */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 折行引擎——E125 起统一走 canvasTypographyEngine（通用安全排字：中英混排
 * 两级 token 化＋zh 18 字帽＋标点避头尾）。行为真源在 wrapCanvasText。
 */
function wrapLines(ctx, text, maxWidth, locale) {
  return wrapCanvasText(ctx, text, maxWidth, locale || 'en');
}

function fontOf(sizePx, stack) { return `${sizePx}px ${stack}`; }

function trySet(ctx, key, value) {
  try { ctx[key] = value; } catch { /* 静默降级 */ }
}

/** 防伪章合成（KS-STYLE-{TYP}-{SUFFIX} / KS-ROADTRIP-{TYP}-{SUFFIX}） */
export function composeLifestyleStamp(type, locale, hashId) {
  const meta = LIFESTYLE_STAMP[type === 'roadtrip' ? 'roadtrip' : 'style'];
  let suffix = String(hashId == null ? '' : hashId).trim();
  if (suffix.startsWith(meta.prefix)) suffix = suffix.slice(meta.prefix.length);
  if (!suffix) suffix = String(locale || 'XX').toUpperCase();
  return `${meta.prefix}${meta.typ}-${suffix.toUpperCase()}`;
}

/** 四角星芒饰（E120 同款笔法） */
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

/** 圆角矩形（色块/罗盘底盘用） */
function roundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/* ══ Layer 2 徽记区：style ⇒ 三组能量色盘 ══ */
function drawPaletteEmblem(ctx, W, template, cfg) {
  const CX = W / 2;
  const CY = LIFESTYLE_LAYOUT_ANCHORS.emblemCenterY;
  const swatch = 178;
  const gap = 58;
  const totalW = swatch * 3 + gap * 2;
  const startX = CX - totalW / 2;
  const palette = Array.isArray(template.palette) ? template.palette.slice(0, 3) : [];
  palette.forEach((p, i) => {
    const x = startX + i * (swatch + gap);
    // 色块
    ctx.save();
    roundRect(ctx, x, CY - swatch / 2, swatch, swatch, 18);
    ctx.fillStyle = p && p.hex ? p.hex : '#2A2620';
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // 色块下名称（香槟金小字）
    ctx.textAlign = 'center';
    ctx.font = fontOf(26, cfg.stack);
    ctx.fillStyle = CHAMPAGNE;
    ctx.globalAlpha = 0.92;
    ctx.fillText(String(p && p.name ? p.name : ''), x + swatch / 2, CY + swatch / 2 + 44);
    // 色块上 hex（等宽微字）
    ctx.font = fontOf(19, MONO_STACK);
    ctx.fillStyle = WHISPER_COLOR;
    ctx.globalAlpha = 0.72;
    ctx.fillText(String(p && p.hex ? p.hex.toUpperCase() : ''), x + swatch / 2, CY - swatch / 2 - 18);
    ctx.globalAlpha = 1;
  });
}

/* ══ Layer 2 徽记区：roadtrip ⇒ 吉方罗盘徽记 ══ */
function drawCompassEmblem(ctx, W, template) {
  const CX = W / 2;
  const CY = LIFESTYLE_LAYOUT_ANCHORS.emblemCenterY;
  const R = 190;
  // 外环（双环金晕）
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.arc(CX, CY, R + 22, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 1;
  // 方位十字刻度（N/E/S/W 四芒＋细刻）
  ctx.strokeStyle = CHAMPAGNE;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 16; k++) {
    const ang = (Math.PI * 2 * k) / 16;
    const inner = k % 4 === 0 ? R - 34 : R - 16;
    ctx.beginPath();
    ctx.moveTo(CX + Math.sin(ang) * inner, CY - Math.cos(ang) * inner);
    ctx.lineTo(CX + Math.sin(ang) * (R - 6), CY - Math.cos(ang) * (R - 6));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // 金针（指向 heading.deg）
  const deg = Number(template.heading && template.heading.deg) || 0;
  const rad = (deg * Math.PI) / 180 - Math.PI / 2;
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(CX - Math.cos(rad) * 40, CY - Math.sin(rad) * 40);
  ctx.lineTo(CX + Math.cos(rad) * (R - 42), CY + Math.sin(rad) * (R - 42));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CX + Math.cos(rad) * (R - 42), CY + Math.sin(rad) * (R - 42), 9, 0, Math.PI * 2);
  ctx.fill();
  // 中心枢点
  ctx.beginPath(); ctx.arc(CX, CY, 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = CHAMPAGNE; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(CX, CY, 20, 0, Math.PI * 2); ctx.stroke();
}

/**
 * 生活方式卡渲染主入口（浏览器生产与批量导出单一事实源）
 * @param {object} canvas 目标画布
 * @param {object} template 六语模板（lifestyleMuseData.mjs 真源）
 * @param {string} locale 六语之一
 * @param {{type?:string, hostName?:string, hashId?:string}} options
 * @returns {Promise<object>} 渲染后的画布
 */
export async function renderLifestyleToCanvas(canvas, template, locale, options = {}) {
  if (!canvas || typeof canvas.getContext !== 'function') {
    throw new Error('lifestyle renderer: canvas unavailable');
  }
  if (!template || !template.prose) {
    throw new Error('lifestyle renderer: template missing (fail-closed)');
  }
  const type = options.type === 'roadtrip' ? 'roadtrip' : 'style';
  const cfg = LOCALE_CANVAS_CONFIG[locale] || LOCALE_CANVAS_CONFIG.en;
  const A = LIFESTYLE_LAYOUT_ANCHORS;

  canvas.width = AMULET_DIMENSIONS.width;
  canvas.height = AMULET_DIMENSIONS.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('lifestyle renderer: 2d context unavailable');
  const W = AMULET_DIMENSIONS.width;
  const H = AMULET_DIMENSIONS.height;
  const CX = W / 2;

  /* ══ Layer 1：维多利亚星轨暗金底纹（E120 同构）══ */
  ctx.fillStyle = '#0B0B0E';
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createRadialGradient(CX, A.emblemCenterY, 60, CX, A.emblemCenterY, 520);
  if (grad && typeof grad.addColorStop === 'function') {
    grad.addColorStop(0, '#1A1721');
    grad.addColorStop(1, '#0B0B0E');
    ctx.fillStyle = grad;
    ctx.fillRect(90, 200, W - 180, 760);
  }
  const seed = [...`${locale}:${template.title}`].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
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
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.strokeRect(A.frameOuterInset, A.frameOuterInset, W - A.frameOuterInset * 2, H - A.frameOuterInset * 2);
  ctx.strokeStyle = CHAMPAGNE;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(A.frameInnerInset, A.frameInnerInset, W - A.frameInnerInset * 2, H - A.frameInnerInset * 2);
  drawCornerStar(ctx, A.frameOuterInset + 22, A.frameOuterInset + 22);
  drawCornerStar(ctx, W - A.frameOuterInset - 22, A.frameOuterInset + 22);
  drawCornerStar(ctx, A.frameOuterInset + 22, H - A.frameOuterInset - 22);
  drawCornerStar(ctx, W - A.frameOuterInset - 22, H - A.frameOuterInset - 22);

  /* ══ Layer 2：徽记区（style 色盘 / roadtrip 罗盘）══ */
  if (type === 'style') drawPaletteEmblem(ctx, W, template, cfg);
  else drawCompassEmblem(ctx, W, template);

  /* ══ Layer 3：六语文案排版（E120 同构自适应降字号）══ */
  ctx.textAlign = 'center';
  trySet(ctx, 'letterSpacing', '4px');
  ctx.font = fontOf(48, cfg.stack);
  ctx.fillStyle = CHAMPAGNE;
  ctx.globalAlpha = 0.96;
  ctx.fillText(template.title, CX, A.titleY);
  trySet(ctx, 'letterSpacing', '3px');
  ctx.font = fontOf(25, cfg.stack);
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.9;
  ctx.fillText(template.subtitle, CX, A.subtitleY);
  trySet(ctx, 'letterSpacing', '1px');
  const host = String(options.hostName || '').trim();
  if (host) {
    ctx.font = fontOf(27, cfg.stack);
    ctx.fillStyle = PROSE_COLOR;
    ctx.globalAlpha = 0.78;
    ctx.fillText(`✦ ${host} ✦`, CX, A.hostLineY);
  }
  ctx.globalAlpha = 1;
  trySet(ctx, 'letterSpacing', '0px');

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
  y += gapBetween - proseSize * cfg.lineHeight + whisperSize * cfg.lineHeight * 0.35;
  ctx.font = fontOf(whisperSize, cfg.stack);
  ctx.fillStyle = WHISPER_COLOR;
  ctx.globalAlpha = 0.92;
  for (const line of whisperLines) {
    ctx.fillText(line, CX, y);
    y += whisperSize * cfg.lineHeight;
  }
  ctx.globalAlpha = 1;

  // 吉时/共振窗标牌（Y:1540 等宽暗金）
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

  /* ══ Layer 4：底部防伪水印（E120 同构）══ */
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(140, A.separatorY);
  ctx.lineTo(W - 140, A.separatorY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  trySet(ctx, 'letterSpacing', '3px');
  ctx.font = fontOf(26, SEAL_STACK);
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.95;
  ctx.fillText(AMULET_OFFICIAL_DOMAIN, CX, A.domainY);
  ctx.globalAlpha = 1;
  trySet(ctx, 'letterSpacing', '0px');
  const stamp = composeLifestyleStamp(type, locale, options.hashId);
  ctx.textAlign = 'right';
  ctx.font = fontOf(22, MONO_STACK);
  ctx.fillStyle = GOLD;
  ctx.globalAlpha = 0.6;
  ctx.fillText(stamp, W - 40, A.stampY);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  return canvas;
}

/** 画布工厂（浏览器——离屏 1080×1748 锁死） */
export function createLifestyleCanvas() {
  if (typeof document === 'undefined') {
    throw new Error('createLifestyleCanvas: browser only（node 测试请自备桩画布）');
  }
  const canvas = document.createElement('canvas');
  canvas.width = AMULET_DIMENSIONS.width;
  canvas.height = AMULET_DIMENSIONS.height;
  return canvas;
}

/** 黄金比例校验（军令断言直用——与 AMULET 同源常量） */
export function isLifestyleGoldenRatio(canvas) {
  const { width, height } = canvas || {};
  if (width !== AMULET_DIMENSIONS.width || height !== AMULET_DIMENSIONS.height) return false;
  return Math.abs(height / width - 1.618) < GOLDEN_RATIO_TOLERANCE;
}
