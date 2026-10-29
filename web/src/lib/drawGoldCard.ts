/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E105（主公军令 2026-10-30 刀二）：深空黑金「命盘金卡」纯前端离线导出
 * ═══════════════════════════════════════════════════════════════════════════
 * 画布军令锚：逻辑尺寸 375×667；exportPixelRatio = 3 ⇒ 物理分辨率 1125×2001。
 * 纯离线 Canvas 2D 流水线（🔴 零 fetch/XHR/远程图——绝对规避 Canvas Tainted）：
 *   ① 底层：深空黑径向渐变（#161922 → #08090C）叠加 3% 噪点（确定性 PRNG）；
 *   ② 边框：双层暗金细线（rgba(212,175,55,0.45) / 0.15）＋四角十字星标 ✦；
 *   ③ 图腾：内联 data:image/svg+xml 矢量（塔罗纹章＋地山谦卦象），禁远程跨域；
 *   ④ 文本：六语折行引擎（goldCardLayout.mjs 军令 Word Wrap Contract）居中绘制
 *      主/副标（军令标题层级）＋称号（决策树主题）＋八字局名＋塔罗当头牌＋年度金句；
 *   ⑤ 防伪底栏：✦ SOUL OS | COSMIC IMMUTABLE ARCHIVE ＋ 唯一命盘 Hash 码（FNV-1a）。
 * ═══════════════════════════════════════════════════════════════════════════
 */
import {
  GOLD_CARD_LAYOUT,
  GOLD_CARD_TITLES,
  TITLE_FONT,
  wrapCardText,
  chartHash,
} from './goldCardLayout.mjs';
import { pickGoldCardQuote } from './goldCardQuotes.mjs';

/** 金卡绘制入参（由报告 AST 就地装配——零异步） */
export interface GoldCardPayload {
  locale: 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';
  cardId: number | null;
  isReversed: boolean;
  tarotName: string;
  tarotOrientation: string;
  baziPattern: string;
  overall: number;
  d1: string;
  d2: string;
}

/** 语系字体栈（Canvas 离线排版） */
const FONT_STACK: Record<string, string> = {
  zh: '"PingFang SC", "Noto Sans SC", sans-serif',
  en: '"Segoe UI", "Helvetica Neue", sans-serif',
  fr: '"Segoe UI", "Helvetica Neue", sans-serif',
  es: '"Segoe UI", "Helvetica Neue", sans-serif',
  th: '"Noto Sans Thai", "Sukhumvit Set", sans-serif',
  vi: '"Segoe UI", "Noto Sans", sans-serif',
};

/** 确定性 PRNG（mulberry32——噪点与星点可复现，同一命盘恒出同图） */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 地山谦卦象内联矢量（上坤三断／下艮一阳——data: URI，零跨域） */
function hexagramDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">`
    + `<g stroke="#D4AF37" stroke-width="5" stroke-linecap="round" opacity="0.9">`
    + `<line x1="20" y1="18" x2="100" y2="18" stroke-dasharray="27 6"/>`
    + `<line x1="20" y1="36" x2="100" y2="36" stroke-dasharray="27 6"/>`
    + `<line x1="20" y1="54" x2="100" y2="54" stroke-dasharray="27 6"/>`
    + `<line x1="20" y1="72" x2="100" y2="72" stroke-dasharray="27 6"/>`
    + `<line x1="20" y1="90" x2="100" y2="90" stroke-dasharray="27 6"/>`
    + `<line x1="20" y1="108" x2="100" y2="108"/>`
    + `</g></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 塔罗纹章内联矢量（圆环＋四芒星——data: URI，零跨域） */
function tarotEmblemDataUri(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">`
    + `<circle cx="60" cy="60" r="44" fill="none" stroke="#D4AF37" stroke-width="2" opacity="0.55"/>`
    + `<circle cx="60" cy="60" r="52" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.25"/>`
    + `<path d="M60 26 L66 54 L94 60 L66 66 L60 94 L54 66 L26 60 L54 54 Z" fill="#F3E5AB" opacity="0.85"/>`
    + `<path d="M60 44 L62.5 57.5 L76 60 L62.5 62.5 L60 76 L57.5 62.5 L44 60 L57.5 57.5 Z" fill="#D4AF37" opacity="0.9"/>`
    + `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** data: URI 图腾装载（离线——仅矢量内联，恒不走网络） */
function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('totem decode failed'));
    img.src = uri;
  });
}

/**
 * 金卡绘制主入口（同步流水线——无 await 网络依赖，图腾均为内联矢量）。
 * @param canvas 目标画布（调用方创建；物理分辨率由本函数按 exportPixelRatio=3 设定）
 * @param payload 命盘 AST 装配的入参
 */
export async function drawGoldCard(canvas: HTMLCanvasElement, payload: GoldCardPayload): Promise<HTMLCanvasElement> {
  const L = GOLD_CARD_LAYOUT;
  const locale = payload.locale;
  const dpr = L.exportPixelRatio; // 3 ⇒ 1125×2001 超清物理分辨率
  canvas.width = L.canvasWidth * dpr;
  canvas.height = L.canvasHeight * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d unavailable');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // ① 底层：深空黑径向渐变（#161922 → #08090C）
  const grad = ctx.createRadialGradient(L.centerX, 220, 40, L.centerX, 420, 520);
  grad.addColorStop(0, '#161922');
  grad.addColorStop(1, '#08090C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, L.canvasWidth, L.canvasHeight);

  // ①' 3% 噪点（确定性 PRNG——同盘同图）
  const hashHex = chartHash(`${payload.d1}|${payload.d2}|${payload.baziPattern}|${payload.cardId}`);
  const rand = mulberry32(parseInt(hashHex.slice(0, 8), 16) || 1);
  ctx.fillStyle = 'rgba(243, 229, 171, 0.05)';
  const noiseBudget = Math.floor(L.canvasWidth * L.canvasHeight * 0.03);
  for (let i = 0; i < noiseBudget; i++) {
    const x = rand() * L.canvasWidth;
    const y = rand() * L.canvasHeight;
    if (rand() < 0.34) ctx.fillRect(x, y, 1, 1);
  }

  // ② 边框：双层暗金细线＋四角十字星标 ✦
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 14, L.canvasWidth - 28, L.canvasHeight - 28);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, L.canvasWidth - 44, L.canvasHeight - 44);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
  ctx.textAlign = 'center';
  for (const [cx, cy] of [[30, 30], [L.canvasWidth - 30, 30], [30, L.canvasHeight - 30], [L.canvasWidth - 30, L.canvasHeight - 30]]) {
    ctx.fillText('✦', cx, cy + 4);
  }

  // ③ 图腾：内联矢量（卦象＋塔罗纹章，data:image/svg+xml 零跨域）
  try {
    const [hex, emblem] = await Promise.all([loadImage(hexagramDataUri()), loadImage(tarotEmblemDataUri())]);
    ctx.globalAlpha = 0.55;
    ctx.drawImage(hex, L.centerX - 34, 96, 68, 68);
    ctx.globalAlpha = 1;
    ctx.drawImage(emblem, L.centerX - 44, 400, 88, 88);
  } catch { /* 图腾缺失不拖垮主文本（纯装饰降级） */ }

  // ④ 文本：六语折行引擎（注入 ctx.measureText 派生测量）
  const fontStack = FONT_STACK[locale] || FONT_STACK.en;
  const segmenter = (locale === 'th' && typeof Intl !== 'undefined' && (Intl as any).Segmenter)
    ? new (Intl as any).Segmenter('th', { granularity: 'word' }) : undefined;
  const measure = (t: string, fs: number) => {
    ctx.font = `${fs}px ${fontStack}`;
    return ctx.measureText(t).width;
  };
  const drawWrapped = (text: string, y: number, opts: Record<string, number>, color: string, weight: string) => {
    const r = wrapCardText(text, locale, measure, { ...opts, segmenter });
    ctx.fillStyle = color;
    let yy = y;
    for (const line of r.lines) {
      ctx.font = `${weight} ${r.fontSize}px ${fontStack}`;
      ctx.fillText(line, L.centerX, yy);
      yy += r.lineHeight;
    }
    return yy - y - r.lineHeight + r.fontSize;
  };

  const GOLD_SOFT = '#F3E5AB';
  const GOLD_DIM = 'rgba(243, 229, 171, 0.66)';

  // 主标（军令标题层级：单行居中；fr/es 16px 降档防换行）
  const T = GOLD_CARD_TITLES[locale] || GOLD_CARD_TITLES.en;
  const titleResult = wrapCardText(T.primary, locale, measure, {
    fontSize: TITLE_FONT[locale] || 18, lineHeight: 26, maxLines: 1,
    maxWidth: L.safeZoneWidth, minFontSize: 13,
  });
  ctx.fillStyle = GOLD_SOFT;
  ctx.font = `bold ${titleResult.fontSize}px ${fontStack}`;
  if (locale === 'en') { ctx.save(); (ctx as any).letterSpacing = '1px'; }
  ctx.fillText(titleResult.lines[0] || T.primary, L.centerX, 66);
  if (locale === 'en') { ctx.restore(); }
  // 副标
  drawWrapped(T.sub, 88, { fontSize: 12, lineHeight: 18, maxLines: 2, maxWidth: L.safeZoneWidth }, GOLD_DIM, '');

  // 称号（决策树主题——用户称号）
  const picked = pickGoldCardQuote(payload.cardId, payload.isReversed, locale);
  ctx.font = `bold 15px ${fontStack}`;
  ctx.fillStyle = '#D4AF37';
  ctx.fillText(`✦ ${picked.theme}`, L.centerX, 210);

  // 八字局名
  drawWrapped(payload.baziPattern || '-', 236, { fontSize: 12, lineHeight: 18, maxLines: 2, maxWidth: L.safeZoneWidth }, GOLD_DIM, '');

  // 塔罗当头牌
  ctx.font = `bold 14px ${fontStack}`;
  ctx.fillStyle = GOLD_SOFT;
  ctx.fillText(payload.tarotName ? `${payload.tarotName} · ${payload.tarotOrientation}` : '—', L.centerX, 516);

  // 年度金句（1~3 行居中，行宽 ≤ 300 安全线）
  drawWrapped(picked.quote, 548, {
    fontSize: (L.locales[locale] || L.locales.en).fontSize,
    lineHeight: (L.locales[locale] || L.locales.en).lineHeight,
    maxLines: 3, maxWidth: L.safeZoneWidth, minFontSize: 10,
  }, GOLD_SOFT, '');

  // ⑤ 防伪底栏：✦ SOUL OS | COSMIC IMMUTABLE ARCHIVE ＋ 唯一命盘 Hash 码
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.75)';
  ctx.fillText('✦ SOUL OS | COSMIC IMMUTABLE ARCHIVE', L.centerX, L.canvasHeight - 52);
  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = 'rgba(243, 229, 171, 0.5)';
  ctx.fillText(`HASH ${hashHex}`, L.centerX, L.canvasHeight - 34);

  return canvas;
}

/** 导出 Blob（canvas.toBlob——纯本地编码，零网络） */
export function goldCardToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}
