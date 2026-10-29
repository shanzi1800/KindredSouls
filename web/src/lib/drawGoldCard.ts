/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E105（主公军令 2026-10-30 刀二）：深空黑金「命盘金卡」纯前端离线导出
 * 🏆 E106（主公军令 2026-10-30 刀一）：金卡艺术级排版重构
 * ═══════════════════════════════════════════════════════════════════════════
 * 画布军令锚：逻辑尺寸 375×667；exportPixelRatio = 3 ⇒ 物理分辨率 1125×2001。
 * 纯离线 Canvas 2D 流水线（🔴 零 fetch/XHR/远程图——绝对规避 Canvas Tainted）：
 *   ① 底层：深空黑径向渐变（#161922 → #08090C）叠加 3% 噪点（确定性 PRNG）；
 *   ② 边框：双层烫金细线（外 #D4AF37 1.5px / 内 #F3E5AB 0.75px 香槟金发丝线）；
 *   ③ 六爻暗金衬底框：卦象六线谱（solid/bar 断续）＋卦名卦序（天火同人·第十三卦）；
 *   ④ 干支对称矩阵：乾造（你）／坤造（对方）三柱并列（E106 结构化真值——
 *      🔴 拔除 engines.bazi.detail 调试串直通通道——payload 只收结构化字段）；
 *   ⑤ 居中格局徽记：【炽热与共生 · 八字三合火局】（双盘三合局判定）；
 *   ⑥ 图腾：韦特塔罗世界牌矢量线稿（椭圆花环＋四象徽记——替换旧圆环四芒星）；
 *   ⑦ 字体阶梯：Cinzel / Noto Serif 衬线体系（离线系统栈逐级降级）；
 *   ⑧ 文本：六语折行引擎（goldCardLayout.mjs）居中绘制主/副标＋塔罗当头牌＋年度金句；
 *   ⑨ 防伪底栏：✦ SOUL OS | COSMIC IMMUTABLE ARCHIVE ＋ 唯一命盘 Hash 码（FNV-1a）。
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

/** 金卡绘制入参（由报告 AST 就地装配——零异步）
 *  🏆 E106-刀一：pillarRows/trineBadge/hexLabel/hexLines 结构化真值取代旧调试串通道 */
export interface GoldCardPayload {
  locale: 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';
  cardId: number | null;
  isReversed: boolean;
  tarotName: string;
  tarotOrientation: string;
  overall: number;
  d1: string;
  d2: string;
  /** 干支对称矩阵六语格式行（goldCardChart.formatPillarRows 真值） */
  pillarRows: { labelA: string; rowA: string; labelB: string; rowB: string };
  /** 居中格局徽记（goldCardChart.deriveCardTrine 真值） */
  trineBadge: string;
  /** 卦名卦序（goldCardChart.composeHexCardLabel 真值，如「天火同人 · 第十三卦」） */
  hexLabel: string;
  /** 六爻线谱（goldCardChart.hexLinePattern 真值——自底向上 6 位；缺卦 ⇒ null 装饰降级） */
  hexLines: number[] | null;
}

/** 语系衬线字体阶梯（Canvas 离线排版——Cinzel/Noto Serif 系统缺失时逐级降级 serif） */
const SERIF_STACK: Record<string, string> = {
  zh: '"Noto Serif SC","Songti SC","STSong","SimSun",serif',
  en: '"Cinzel","Times New Roman",Georgia,serif',
  fr: '"Cinzel","Times New Roman",Georgia,serif',
  es: '"Cinzel","Times New Roman",Georgia,serif',
  th: '"Noto Serif Thai","Noto Sans Thai","Sukhumvit Set",serif',
  vi: '"Cinzel","Times New Roman",Georgia,serif',
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

/** 🏆 E106-刀一：韦特塔罗世界牌图腾（椭圆花环＋四象徽记＋中心饰——data: URI，零跨域）
 *  替换旧「圆环＋四芒星」简陋徽章（军令钦定世界牌矢量线稿） */
function worldCardDataUri(): string {
  // 花环叶饰：沿外环 14 个小 V 形叶刻（手工锚定角度）
  const leaves: string[] = [];
  for (let i = 0; i < 14; i++) {
    const ang = (Math.PI * 2 * i) / 14;
    const cx = 65 + 46 * Math.cos(ang);
    const cy = 58 + 52 * Math.sin(ang);
    const dx = 4 * Math.sin(ang);
    const dy = 4 * Math.cos(ang);
    leaves.push(`<path d="M${cx - dx} ${cy - dy} L${cx + dx * 0.4} ${cy + dy * 0.4} L${cx + dx} ${cy + dy}" fill="none" stroke="#D4AF37" stroke-width="1.2" opacity="0.55"/>`);
  }
  const star = (x: number, y: number, r: number, fill: string, op: number) =>
    `<path d="M${x} ${y - r} L${x + r * 0.32} ${y - r * 0.32} L${x + r} ${y} L${x + r * 0.32} ${y + r * 0.32} L${x} ${y + r} L${x - r * 0.32} ${y + r * 0.32} L${x - r} ${y} L${x - r * 0.32} ${y - r * 0.32} Z" fill="${fill}" opacity="${op}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 130 130">`
    + `<g stroke="#D4AF37" fill="none">`
    + `<ellipse cx="65" cy="58" rx="44" ry="50" stroke-width="2" opacity="0.85"/>`
    + `<ellipse cx="65" cy="58" rx="50" ry="56" stroke-width="0.8" opacity="0.30"/>`
    + `</g>`
    + leaves.join('')
    // 四象徽记：花环四隅菱星（韦特世界牌四活物抽象四方位）
    + star(22, 20, 6, '#F3E5AB', 0.85) + star(108, 20, 6, '#F3E5AB', 0.85)
    + star(22, 96, 6, '#F3E5AB', 0.85) + star(108, 96, 6, '#F3E5AB', 0.85)
    // 中心饰：双星辉（大暗金＋小香槟金）
    + star(65, 58, 14, '#D4AF37', 0.75) + star(65, 58, 7, '#F3E5AB', 0.9)
    // 底部缎带弧（世界牌舞者之环收口）
    + `<path d="M40 112 Q65 122 90 112" fill="none" stroke="#D4AF37" stroke-width="1.4" opacity="0.6"/>`
    + `<path d="M46 104 Q65 112 84 104" fill="none" stroke="#F3E5AB" stroke-width="0.7" opacity="0.35"/>`
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
 * @param payload 命盘 AST 装配的入参（E106 结构化真值）
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
  const serif = SERIF_STACK[locale] || SERIF_STACK.en;

  // ① 底层：深空黑径向渐变（#161922 → #08090C）
  const grad = ctx.createRadialGradient(L.centerX, 240, 40, L.centerX, 420, 560);
  grad.addColorStop(0, '#161922');
  grad.addColorStop(1, '#08090C');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, L.canvasWidth, L.canvasHeight);

  // ①' 3% 噪点（确定性 PRNG——同盘同图）
  const hashHex = chartHash(`${payload.d1}|${payload.d2}|${payload.hexLabel}|${payload.cardId}`);
  const rand = mulberry32(parseInt(hashHex.slice(0, 8), 16) || 1);
  ctx.fillStyle = 'rgba(243, 229, 171, 0.05)';
  const noiseBudget = Math.floor(L.canvasWidth * L.canvasHeight * 0.03);
  for (let i = 0; i < noiseBudget; i++) {
    const x = rand() * L.canvasWidth;
    const y = rand() * L.canvasHeight;
    if (rand() < 0.34) ctx.fillRect(x, y, 1, 1);
  }

  // ② 双层烫金细线：外暗金 #D4AF37 1.5px＋内香槟金 #F3E5AB 0.75px（军令字体阶梯同款色阶）
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, 14, L.canvasWidth - 28, L.canvasHeight - 28);
  ctx.strokeStyle = 'rgba(243, 229, 171, 0.55)';
  ctx.lineWidth = 0.75;
  ctx.strokeRect(22, 22, L.canvasWidth - 44, L.canvasHeight - 44);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
  ctx.textAlign = 'center';
  for (const [cx, cy] of [[30, 30], [L.canvasWidth - 30, 30], [30, L.canvasHeight - 30], [L.canvasWidth - 30, L.canvasHeight - 30]]) {
    ctx.fillText('✦', cx, cy + 4);
  }

  // ③ 六爻暗金衬底框：六线谱（solid 整杠 / broken 断杠）＋卦名卦序
  //    （🔴 hexLines 缺卦 ⇒ 装饰降级为空框不拖垮主文本）
  const HEX_FRAME = { x: L.centerX - 70, y: 104, w: 140, h: 88 };
  ctx.fillStyle = 'rgba(212, 175, 55, 0.07)';
  ctx.fillRect(HEX_FRAME.x, HEX_FRAME.y, HEX_FRAME.w, HEX_FRAME.h);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(HEX_FRAME.x, HEX_FRAME.y, HEX_FRAME.w, HEX_FRAME.h);
  // 内衬发丝线（双层衬底——禁灰线裸露）
  ctx.strokeStyle = 'rgba(243, 229, 171, 0.25)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(HEX_FRAME.x + 5, HEX_FRAME.y + 5, HEX_FRAME.w - 10, HEX_FRAME.h - 10);
  if (payload.hexLines && payload.hexLines.length === 6) {
    // 自底向上 line1..line6 ⇒ 绘制自顶向下反转（六爻线谱：solid 整杠 / broken 断杠）
    const bars = [...payload.hexLines].reverse();
    const BAR_W = 76;
    const BAR_H = 5;
    const STEP = 14; // 杠高 5 + 间隙 9 ⇒ 总高 5×14-9=61，居中于 78px 框内
    let by = HEX_FRAME.y + (HEX_FRAME.h - (6 * STEP - (STEP - BAR_H))) / 2;
    for (const line of bars) {
      const bx = L.centerX - BAR_W / 2;
      ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
      if (line) {
        ctx.fillRect(bx, by, BAR_W, BAR_H);
      } else {
        const seg = (BAR_W - 10) / 2;
        ctx.fillRect(bx, by, seg, BAR_H);
        ctx.fillRect(bx + BAR_W - seg, by, seg, BAR_H);
      }
      by += STEP;
    }
  }
  if (payload.hexLabel) {
    ctx.font = `bold 13px ${serif}`;
    ctx.fillStyle = '#F3E5AB';
    ctx.fillText(payload.hexLabel, L.centerX, HEX_FRAME.y + HEX_FRAME.h + 20);
  }

  // ④ 干支对称矩阵：乾造（你）／坤造（对方）三柱并列（军令钦定格式）
  const P = payload.pillarRows;
  const measure = (t: string, fs: number) => {
    ctx.font = `${fs}px ${serif}`;
    return ctx.measureText(t).width;
  };
  const drawMatrixRow = (label: string, row: string, y: number) => {
    const line = `${label}　${row}`;
    const r = wrapCardText(line, locale, measure,
      { fontSize: 13, lineHeight: 20, maxLines: 1, maxWidth: L.safeZoneWidth, minFontSize: 10 });
    // 标签暗金加粗＋正文香槟金（同行双色分位：整行居中，标签居左段）
    const fs = r.fontSize;
    const labelW = measure(label, fs);
    const spacerW = measure('　', fs);
    const rowW = measure(row, fs);
    const fullW = labelW + spacerW + rowW;
    const start = L.centerX - fullW / 2;
    ctx.font = `bold ${fs}px ${serif}`;
    ctx.fillStyle = '#D4AF37';
    ctx.fillText(label, start + labelW / 2, y);
    ctx.font = `${fs}px ${serif}`;
    ctx.fillStyle = '#F3E5AB';
    ctx.fillText(row, start + labelW + spacerW + rowW / 2, y);
  };
  if (P && P.rowA) drawMatrixRow(P.labelA, P.rowA, 246);
  if (P && P.rowB) drawMatrixRow(P.labelB, P.rowB, 272);

  // ⑤ 居中格局徽记（三合局判定——zh 包【】军令格式）
  if (payload.trineBadge) {
    const badgeText = locale === 'zh' ? `【${payload.trineBadge}】` : payload.trineBadge;
    const r = wrapCardText(badgeText, locale, measure,
      { fontSize: 14, lineHeight: 20, maxLines: 1, maxWidth: L.safeZoneWidth, minFontSize: 10 });
    ctx.font = `bold ${r.fontSize}px ${serif}`;
    ctx.fillStyle = '#F3E5AB';
    ctx.fillText(r.lines[0] || badgeText, L.centerX, 306);
    ctx.font = `bold ${r.fontSize}px ${serif}`;
    ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
    ctx.fillText('✦', L.centerX - measure(r.lines[0] || badgeText, r.fontSize) / 2 - 14, 306 + 4);
    ctx.fillText('✦', L.centerX + measure(r.lines[0] || badgeText, r.fontSize) / 2 + 14, 306 + 4);
  }

  // ⑥ 图腾：韦特塔罗世界牌矢量线稿（椭圆花环＋四象徽记，data:image/svg+xml 零跨域）
  try {
    const world = await loadImage(worldCardDataUri());
    ctx.globalAlpha = 0.92;
    ctx.drawImage(world, L.centerX - 65, 330, 130, 130);
    ctx.globalAlpha = 1;
  } catch { /* 图腾缺失不拖垮主文本（纯装饰降级） */ }

  // ⑦ 主/副标（军令标题层级：衬线字体阶梯；fr/es 16px 降档防换行）
  const T = GOLD_CARD_TITLES[locale] || GOLD_CARD_TITLES.en;
  const titleResult = wrapCardText(T.primary, locale, measure, {
    fontSize: TITLE_FONT[locale] || 18, lineHeight: 26, maxLines: 1,
    maxWidth: L.safeZoneWidth, minFontSize: 13,
  });
  ctx.fillStyle = '#F3E5AB';
  ctx.font = `bold ${titleResult.fontSize}px ${serif}`;
  if (locale === 'en') { ctx.save(); (ctx as any).letterSpacing = '1px'; }
  ctx.fillText(titleResult.lines[0] || T.primary, L.centerX, 66);
  if (locale === 'en') { ctx.restore(); }
  const drawWrapped = (text: string, y: number, opts: Record<string, number>, color: string, weight: string) => {
    const r = wrapCardText(text, locale, measure, { ...opts, segmenter: undefined });
    ctx.fillStyle = color;
    let yy = y;
    for (const line of r.lines) {
      ctx.font = `${weight} ${r.fontSize}px ${serif}`;
      ctx.fillText(line, L.centerX, yy);
      yy += r.lineHeight;
    }
    return yy - y - r.lineHeight + r.fontSize;
  };
  drawWrapped(T.sub, 88, { fontSize: 12, lineHeight: 18, maxLines: 2, maxWidth: L.safeZoneWidth }, 'rgba(243, 229, 171, 0.66)', '');

  // ⑧ 塔罗当头牌＋年度金句（六语折行居中）
  const GOLD_SOFT = '#F3E5AB';
  ctx.font = `bold 14px ${serif}`;
  ctx.fillStyle = GOLD_SOFT;
  ctx.fillText(payload.tarotName ? `${payload.tarotName} · ${payload.tarotOrientation}` : '—', L.centerX, 496);

  const picked = pickGoldCardQuote(payload.cardId, payload.isReversed, locale);
  drawWrapped(picked.quote, 528, {
    fontSize: (L.locales[locale] || L.locales.en).fontSize,
    lineHeight: (L.locales[locale] || L.locales.en).lineHeight,
    maxLines: 3, maxWidth: L.safeZoneWidth, minFontSize: 10,
  }, GOLD_SOFT, '');

  // ⑨ 防伪底栏：✦ SOUL OS | COSMIC IMMUTABLE ARCHIVE ＋ 唯一命盘 Hash 码
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
