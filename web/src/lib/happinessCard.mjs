// 🤝 E155-刀三（主公军令 2026-11-25）：统一高定 Canvas「幸福坐标卡」
//   同一母版兼容四主题：romance / business / friendship / wealth_abundance。
//   规格：1080×1920（9:16 @2x）PNG；深空暗奢丝绒黑金＋金缮刻度＋动态主题徽标；
//   要素：顶部场景坐标标 → 双人/个人星历坐标印记 → 核心契合关键词 → 底部印刻金句
//        → 品牌水印 → 动态二维码（裂变卡 /invite/:token，个人财富卡首页）。
//   🔴 折行复用金卡引擎 wrapCardText（zh 逐字避头尾 / 空格语种按词 / 泰语 Intl.Segmenter
//      字簇折行）；金句块自二维码上沿向上排版 ⇒ 永不撞二维码区。
//   🔴 纯离线：零 fetch/XHR/远程图（Canvas 永不 Tainted）。QR 由 qrcode-generator（零依赖）本地生成。

import { wrapCardText, chartHash } from './goldCardLayout.mjs';
import { RES_SIGNS } from './resonanceI18n.mjs';
import qrcode from 'qrcode-generator';

export const HAPPINESS_CARD_WIDTH = 1080;
export const HAPPINESS_CARD_HEIGHT = 1920;

const GOLD = '#D4AF37';
const CHAMPAGNE = '#F3E5AB';
const IVORY = '#FAF4E4';
const MUTED = 'rgba(243,229,171,0.62)';

const SERIF = {
  zh: '"Noto Serif SC","Songti SC","STSong","SimSun",serif',
  en: '"Cinzel","Times New Roman",Georgia,serif',
  fr: '"Cinzel","Times New Roman",Georgia,serif',
  es: '"Cinzel","Times New Roman",Georgia,serif',
  th: '"Noto Serif Thai","Noto Sans Thai","Sukhumvit Set",serif',
  vi: '"Cinzel","Times New Roman",Georgia,serif',
};

export const HAPPINESS_THEMES = Object.freeze(['romance', 'business', 'friendship', 'wealth_abundance']);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function thSegmenter() {
  try { return new Intl.Segmenter('th', { granularity: 'word' }); } catch (e) { return undefined; }
}

/* ── 动态主题徽标（纯 Canvas 矢量线稿，金线勾边）── */
function drawEmblem(ctx, cx, cy, theme) {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(212,175,55,0.45)';
  ctx.shadowBlur = 18;
  const r = 78;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.shadowBlur = 0;
  if (theme === 'romance') {
    // 两圆相交（面对面）＋ 交叠处一颗星
    ctx.beginPath(); ctx.arc(cx - 30, cy, 42, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 30, cy, 42, 0, Math.PI * 2); ctx.stroke();
    star(ctx, cx, cy, 9, 4.2, GOLD, true);
  } else if (theme === 'business') {
    // 两条平行射线指向同一方位
    for (const dy of [-18, 18]) {
      ctx.beginPath(); ctx.moveTo(cx - 46, cy + dy); ctx.lineTo(cx + 40, cy + dy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 22, cy + dy - 14); ctx.lineTo(cx + 40, cy + dy); ctx.lineTo(cx + 22, cy + dy + 14); ctx.stroke();
    }
    star(ctx, cx + 50, cy, 5, 2.2, CHAMPAGNE, true);
  } else if (theme === 'friendship') {
    // 两个相扣六边形（无需设防的旧识）
    for (const dx of [-22, 22]) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 6 + (Math.PI / 3) * i;
        const x = cx + dx + Math.cos(a) * 38, y = cy + Math.sin(a) * 38;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    }
  } else {
    // wealth_abundance：三道同心波纹向外舒展（财随善流）＋ 中心实心点
    for (const rr of [18, 34, 50]) {
      ctx.beginPath(); ctx.arc(cx, cy, rr, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, rr, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
    ctx.fillStyle = CHAMPAGNE; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function star(ctx, cx, cy, ro, ri, color, fill) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? ro : ri;
    const a = -Math.PI / 2 + (Math.PI / 5) * i;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke(); }
  ctx.restore();
}

/* ── 金缮刻度（内外框之间的 72 道刻度；四角为长刻度）── */
function drawFrame(ctx, W, H) {
  const o = 46, i = 66;
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3;
  ctx.strokeRect(o, o, W - o * 2, H - o * 2);
  ctx.strokeStyle = CHAMPAGNE; ctx.lineWidth = 1.2;
  ctx.strokeRect(i, i, W - i * 2, H - i * 2);
  ctx.strokeStyle = 'rgba(212,175,55,0.55)';
  ctx.lineWidth = 1.5;
  const N = 72;
  for (let k = 0; k < N; k++) {
    const long = k % 18 === 0;
    const len = long ? 12 : 6;
    const t = k / N;
    ctx.beginPath();
    if (t < 0.25) { const x = o + (W - 2 * o) * (t / 0.25); ctx.moveTo(x, o); ctx.lineTo(x, o + len); }
    else if (t < 0.5) { const y = o + (H - 2 * o) * ((t - 0.25) / 0.25); ctx.moveTo(W - o, y); ctx.lineTo(W - o - len, y); }
    else if (t < 0.75) { const x = W - o - (W - 2 * o) * ((t - 0.5) / 0.25); ctx.moveTo(x, H - o); ctx.lineTo(x, H - o - len); }
    else { const y = H - o - (H - 2 * o) * ((t - 0.75) / 0.25); ctx.moveTo(o, y); ctx.lineTo(o + len, y); }
    ctx.stroke();
  }
}

function wrap(ctx, text, locale, opts) {
  const measure = (t, fs) => { ctx.font = `${fs}px ${SERIF[locale] || SERIF.en}`; return ctx.measureText(t).width; };
  return wrapCardText(String(text == null ? '' : text), locale, measure, Object.assign({ segmenter: locale === 'th' ? thSegmenter() : undefined, minFontSize: 20 }, opts));
}

function drawWrapped(ctx, lines, x, y, lineHeight, font, color, align) {
  ctx.save();
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'top';
  lines.forEach((ln, k) => ctx.fillText(ln, x, y + k * lineHeight));
  ctx.restore();
  return y + lines.length * lineHeight;
}

function signText(lang, person, t) {
  const sign = person && person.sunSign ? resSign(t, person.sunSign) : '';
  return sign;
}
// 字典取词（避免循环依赖：仅取星座名）
function resSign(t, signEn) {
  const idx = RES_SIGNS.en.indexOf(String(signEn || ''));
  const L = RES_SIGNS[t.lang] ? t.lang : 'zh';
  return idx === -1 ? '' : RES_SIGNS[L][idx];
}

/**
 * 绘制主入口。
 * @param {HTMLCanvasElement} canvas 1080×1920
 * @param {object} p {theme, lang, sceneTitle, sceneSub, self:{label,name,sunSign}, partner:{label,name,sunSign}|null,
 *                    keywordsLabel, keywords:[], quote, qrUrl, cardTitle, brand, degraded:boolean}
 */
export function drawHappinessCard(canvas, p) {
  const W = HAPPINESS_CARD_WIDTH, H = HAPPINESS_CARD_HEIGHT;
  const lang = SERIF[p.lang] ? p.lang : 'en';
  const theme = HAPPINESS_THEMES.indexOf(p.theme) !== -1 ? p.theme : 'romance';
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas2d_unavailable');

  // ① 丝绒黑底＋星尘
  const g = ctx.createRadialGradient(W / 2, H * 0.38, 80, W / 2, H * 0.5, H * 0.75);
  g.addColorStop(0, '#12101A'); g.addColorStop(0.55, '#0A090F'); g.addColorStop(1, '#05050A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const rnd = mulberry32(chartHash(`${p.sceneTitle}|${p.self && p.self.name}|${p.partner && p.partner.name}|${theme}`));
  for (let k = 0; k < 220; k++) {
    const x = rnd() * W, y = rnd() * H, rr = rnd() * 1.6 + 0.3, a = rnd() * 0.5 + 0.08;
    ctx.fillStyle = `rgba(243,229,171,${a.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
  }
  drawFrame(ctx, W, H);

  const cx = W / 2;
  const safe = W - 2 * 150;
  const t = { lang };

  // ② 品牌水印（顶部小字）
  drawWrapped(ctx, [String(p.brand || 'KINDREDSOULS')], cx, 112, 30, `22px ${SERIF[lang]}`, MUTED);
  ctx.strokeStyle = 'rgba(212,175,55,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - 120, 150); ctx.lineTo(cx + 120, 150); ctx.stroke();

  // ③ 场景坐标标
  const title = wrap(ctx, p.sceneTitle, lang, { fontSize: 58, lineHeight: 70, maxLines: 2, maxWidth: safe });
  let y = drawWrapped(ctx, title.lines, cx, 196, title.lineHeight, `${title.fontSize}px ${SERIF[lang]}`, IVORY);
  const sub = wrap(ctx, p.sceneSub, lang, { fontSize: 30, lineHeight: 44, maxLines: 3, maxWidth: safe });
  y = drawWrapped(ctx, sub.lines, cx, y + 14, sub.lineHeight, `${sub.fontSize}px ${SERIF[lang]}`, MUTED);

  // ④ 动态主题徽标
  drawEmblem(ctx, cx, Math.max(y + 110, 560), theme);

  // ⑤ 星历坐标印记（双人左右对称；单人居中）
  const ey = Math.max(y + 110, 560) + 78 + 92;
  const self = p.self || {};
  const partner = p.partner || null;
  const nameOf = (x) => (x && x.name) ? x.name : '';
  if (partner) {
    for (const [side, person, label] of [[-1, self, p.selfLabel], [1, partner, p.partnerLabel]]) {
      const x = cx + side * 250;
      drawWrapped(ctx, [String(person.label || label || '')], x, ey, 32, `24px ${SERIF[lang]}`, MUTED);
      const nm = wrap(ctx, nameOf(person), lang, { fontSize: 40, lineHeight: 50, maxLines: 2, maxWidth: 380 });
      let ny = drawWrapped(ctx, nm.lines, x, ey + 40, nm.lineHeight, `${nm.fontSize}px ${SERIF[lang]}`, IVORY);
      const sg = signText(lang, person, t);
      if (sg) ny = drawWrapped(ctx, [`☉ ${sg}`], x, ny + 6, 44, `34px ${SERIF[lang]}`, CHAMPAGNE);
      if (p.degraded) drawWrapped(ctx, [String(p.degradedBadge || '')], x, ny + 4, 28, `20px ${SERIF[lang]}`, MUTED);
    }
    star(ctx, cx, ey + 90, 14, 6, GOLD, true);
  } else {
    drawWrapped(ctx, [String(self.label || p.selfLabel || '')], cx, ey, 32, `24px ${SERIF[lang]}`, MUTED);
    const nm = wrap(ctx, nameOf(self), lang, { fontSize: 44, lineHeight: 56, maxLines: 2, maxWidth: 700 });
    let ny = drawWrapped(ctx, nm.lines, cx, ey + 40, nm.lineHeight, `${nm.fontSize}px ${SERIF[lang]}`, IVORY);
    const sg = signText(lang, self, t);
    if (sg) ny = drawWrapped(ctx, [`☉ ${sg}`], cx, ny + 6, 48, `38px ${SERIF[lang]}`, CHAMPAGNE);
  }

  // ⑥ 二维码区（右下固定；金句自其上沿向上排版 ⇒ 零碰撞）
  const QR = 250, qx = W - 120 - QR, qy = H - 130 - QR;
  ctx.fillStyle = '#FAF4E4';
  roundRect(ctx, qx - 14, qy - 14, QR + 28, QR + 28, 14); ctx.fill();
  drawQr(ctx, String(p.qrUrl || ''), qx, qy, QR);

  // ⑦ 底部印刻金句（自 qrTop-70 向上）
  const quote = wrap(ctx, p.quote, lang, { fontSize: 36, lineHeight: 54, maxLines: 4, maxWidth: safe - 40, minFontSize: 26 });
  const quoteTop = qy - 70 - quote.lines.length * quote.lineHeight;
  drawWrapped(ctx, quote.lines, cx, quoteTop, quote.lineHeight, `${quote.fontSize}px ${SERIF[lang]}`, IVORY);

  // ⑧ 核心关键词（金句上方；至多 3 行）
  const kws = Array.isArray(p.keywords) ? p.keywords.filter((k) => typeof k === 'string' && k.trim()).slice(0, 6) : [];
  let ky = quoteTop - 60;
  if (kws.length > 0) {
    const kw = wrap(ctx, kws.join('  ·  '), lang, { fontSize: 34, lineHeight: 50, maxLines: 3, maxWidth: safe, minFontSize: 26 });
    // 紧随星历印记之下（ey+250）居中带；若金句块上沿更低则贴其上方 ⇒ 永不碰撞
    ky = Math.min(quoteTop - 44 - kw.lines.length * kw.lineHeight, ey + 250);
    drawWrapped(ctx, kw.lines, cx, ky, kw.lineHeight, `${kw.fontSize}px ${SERIF[lang]}`, CHAMPAGNE);
    if (p.keywordsLabel) drawWrapped(ctx, [String(p.keywordsLabel)], cx, ky - 46, 34, `22px ${SERIF[lang]}`, MUTED);
  }

  // ⑨ 左下防伪底栏
  const hash = chartHash(`${theme}|${p.sceneTitle}|${self.sunSign || ''}|${partner && partner.sunSign}|${p.qrUrl || ''}`);
  ctx.font = `22px ${SERIF[lang]}`; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = MUTED;
  ctx.fillText(String(p.cardTitle || ''), 120, H - 130 - 96);
  ctx.fillText('✦ ' + String(p.brand || '') + ' ✦', 120, H - 130 - 60);
  ctx.fillStyle = GOLD;
  ctx.fillText('HASH · ' + hash, 120, H - 130 - 24);
  return { width: W, height: H, hash };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawQr(ctx, url, x, y, size) {
  if (!url) { // 无链接 ⇒ 画一枚金缮菱形占位（绝不画伪码）
    ctx.strokeStyle = GOLD; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x + size / 2, y + 30); ctx.lineTo(x + size - 30, y + size / 2); ctx.lineTo(x + size / 2, y + size - 30); ctx.lineTo(x + 30, y + size / 2); ctx.closePath(); ctx.stroke();
    return false;
  }
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const n = qr.getModuleCount();
  const cell = size / n;
  ctx.fillStyle = '#0B0A10';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(x + c * cell, y + r * cell, Math.ceil(cell), Math.ceil(cell));
  return true;
}

/** 导出 PNG Blob（调用前须 `await document.fonts.ready`） */
export function happinessCardToBlob(p) {
  const canvas = document.createElement('canvas');
  drawHappinessCard(canvas, p);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode_failed'))), 'image/png');
  });
}
