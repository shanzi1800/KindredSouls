/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🌌 E105（主公军令 2026-10-30 刀零/刀二）：六语金卡排版引擎（纯函数 · 离线）
 * 🏆 E107（主公军令 2026-10-31 刀一）：画布升神圣黄金比例 400×648（1:1.618）
 * ═══════════════════════════════════════════════════════════════════════════
 * Canvas 2D fillText 无 CSS 盒模型自动换行 ⇒ 本引擎按语系分词 + 逐词/逐字累加
 * measureText 测量折行（军令 Word Wrap Contract）：
 *   · zh   逐字符切分 + 避头尾禁则（行首不得出现收尾标点）；
 *   · 西欧（en/fr/es/vi）空格词元切分；超行宽长词连字符降级（单词绝不无声劈裂）；
 *   · th   优先 Intl.Segmenter('th',{granularity:'word'})，环境缺位则音节簇兜底
 *          （辅音+声调组合禁截断——声调标记恒随前位字符）；
 *   · 行数硬上限 maxLines=3：超限先缩容字号（阶梯 1px），仍超限硬夹断＋末行省略号。
 * 🔴 离线铁律：零网络请求、零 DOM 依赖（measure 由调用方注入——浏览器传
 *    ctx.measureText 派生、测试传字宽阶梯桩）；node:test 直接 ESM import 实测。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 金卡画布几何与语系排版矩阵
 *  🏆 E107-刀一（主公军令 2026-10-31）：画布废除 375×667 狭长手机屏比例，
 *  改**神圣黄金比例 1 : 1.618**——逻辑 400×648（648/400=1.62 落 1.615~1.625 窗），
 *  exportPixelRatio=3 ⇒ 物理导出 1200×1944 超清（比例不变）。 */
export const GOLD_CARD_LAYOUT = Object.freeze({
  canvasWidth: 400,
  canvasHeight: 648,
  safeZoneWidth: 320, // 400 * 0.8
  centerX: 200,
  maxLines: 3,
  /** 导出物理分辨率倍率（400×648 → 1200×1944 超清） */
  exportPixelRatio: 3,
  locales: Object.freeze({
    zh: Object.freeze({ fontSize: 13, lineHeight: 22, letterSpacing: 1 }),
    en: Object.freeze({ fontSize: 12, lineHeight: 18, letterSpacing: 0 }),
    fr: Object.freeze({ fontSize: 11, lineHeight: 17, letterSpacing: 0 }),
    es: Object.freeze({ fontSize: 11, lineHeight: 17, letterSpacing: 0 }),
    th: Object.freeze({ fontSize: 12, lineHeight: 24, letterSpacing: 0 }), // 泰语高行高防声调削顶
    vi: Object.freeze({ fontSize: 11, lineHeight: 20, letterSpacing: 0 }), // 越南语防复合成音重合
  }),
});

/**
 * 六语金卡标题层级（军令核准锚定：主标宇宙档案属性 / 副标个人命盘特征）。
 * fr/es 字符较长 ⇒ 字号降 16px；en 大写小型字效；th 行高 1.6 防削顶。
 */
export const GOLD_CARD_TITLES = Object.freeze({
  zh: Object.freeze({ primary: '宇宙命盘金卡', sub: '灵魂印记 · 宿命共鸣档案' }),
  en: Object.freeze({ primary: 'Cosmic Destiny Blueprint', sub: 'Soul Imprint · Natal Resonance Archive' }),
  fr: Object.freeze({ primary: "Carte d'Or du Destin Cosmique", sub: "Empreinte de l'Âme · Résonance Céleste" }),
  es: Object.freeze({ primary: 'Tarjeta Dorada del Destino Astral', sub: 'Impronta del Alma \u00b7 Archivo de Resonancia' }),
  th: Object.freeze({ primary: 'บัตรทองคำแห่งจักรวาล', sub: 'ตราประทับจิตวิญญาณ · บันทึกชะตาสวรรค์' }),
  vi: Object.freeze({ primary: 'Kim Thẻ Mệnh Bàn Vũ Trụ', sub: 'Dấu Ấn Linh Hồn · Lưu Trữ Duyên Định' }),
});

/** 长字符语系主标降档（军令：fr/es 杜绝换行 ⇒ 16px；余 18px） */
export const TITLE_FONT = Object.freeze({
  zh: 18, en: 18, fr: 16, es: 16, th: 18, vi: 18,
});

/** 行首禁则标点（避头尾：收尾标点不得出现在行首） */
const NO_START = '，。！？；：、）】」》』〉…％%·.,;:!?)]}»›';
/** 行尾禁则标点（避头尾：开启标点不得留在行尾） */
const NO_END = '（【「『《〈([{«‹';

/** 泰语结合标记（声调/元音符号——恒随前位字符，禁拆到词元首） */
const TH_COMBINING = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;

/** 泰语音节簇兜底拆分（无 Intl.Segmenter 环境仍不劈裂声调组合） */
function thClusters(text) {
  const out = [];
  let cur = '';
  for (const ch of String(text)) {
    if (TH_COMBINING.test(ch) && cur) cur += ch;
    else { if (cur) out.push(cur); cur = ch; }
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * 分词与换行前置切词（军令 Word Wrap Contract）。
 * @param {string} text 原文
 * @param {string} locale 六语码
 * @param {{ segment(s: string): Iterable<{ segment: string }> }} [segmenter]
 *        泰语词元拆分器（浏览器传 new Intl.Segmenter('th',{granularity:'word'})；缺位走音节簇兜底）
 * @returns {string[]} 词元序列（join 语义与语系折行模式配套）
 */
export function tokenizeForWrap(text, locale, segmenter) {
  const s = String(text == null ? '' : text);
  if (!s) return [];
  if (locale === 'zh') return Array.from(s);
  if (locale === 'th') {
    if (segmenter && typeof segmenter.segment === 'function') {
      const parts = [];
      for (const it of segmenter.segment(s)) {
        if (it && it.segment) parts.push(it.segment);
      }
      if (parts.length > 0) return parts;
    }
    return thClusters(s);
  }
  // 西欧语系（en/fr/es/vi）：空格词元（保留多音节复合词完整性）
  return s.split(' ').filter((w) => w.length > 0);
}

/** 超行宽长词连字符降级（单词绝不无声劈裂——折断处必带 '-'） */
function hyphenateWord(word, fontSize, maxWidth, measure, letterSpacing) {
  const m = (t) => measure(t, fontSize) + Math.max(0, t.length - 1) * letterSpacing;
  const pieces = [];
  let rest = word;
  while (m(rest) > maxWidth && rest.length > 1) {
    let n = rest.length - 1;
    while (n > 1 && m(rest.slice(0, n) + '-') > maxWidth) n--;
    if (n < 1) n = 1;
    pieces.push(rest.slice(0, n) + '-');
    rest = rest.slice(n);
  }
  if (rest) pieces.push(rest);
  return pieces;
}

/**
 * 六语折行主入口。
 * @param {string} text 文本
 * @param {string} locale 六语码
 * @param {(text: string, fontSize: number) => number} measure 宽度测量（注入式）
 * @param {{fontSize?: number, lineHeight?: number, maxLines?: number,
 *          maxWidth?: number, minFontSize?: number, letterSpacing?: number,
 *          segmenter?: object}} [opts] 覆盖默认布局
 * @returns {{lines: string[], fontSize: number, lineHeight: number, scaled: boolean}}
 */
export function wrapCardText(text, locale, measure, opts) {
  const cfg = GOLD_CARD_LAYOUT.locales[locale] || GOLD_CARD_LAYOUT.locales.en;
  const o = {
    fontSize: (opts && opts.fontSize != null) ? opts.fontSize : cfg.fontSize,
    lineHeight: (opts && opts.lineHeight != null) ? opts.lineHeight : cfg.lineHeight,
    maxLines: (opts && opts.maxLines != null) ? opts.maxLines : GOLD_CARD_LAYOUT.maxLines,
    maxWidth: (opts && opts.maxWidth != null) ? opts.maxWidth : GOLD_CARD_LAYOUT.safeZoneWidth,
    minFontSize: (opts && opts.minFontSize != null) ? opts.minFontSize : 10,
    letterSpacing: (opts && opts.letterSpacing != null) ? opts.letterSpacing : (cfg.letterSpacing || 0),
    segmenter: opts && opts.segmenter,
  };
  const ls = o.letterSpacing;
  const width = (t, fs) => measure(t, fs) + Math.max(0, t.length - 1) * ls;

  function layoutAt(fsz) {
    const tokens = tokenizeForWrap(text, locale, o.segmenter);
    const isZ = locale === 'zh';
    const isTh = locale === 'th';
    const lines = [];
    let cur = '';
    const pushLine = () => { if (cur.length > 0) { lines.push(cur); cur = ''; } };
    /** 西欧长词连字符降级入行（各折断 piece 恒起新行——'-' 即断点标记，禁无声拼回） */
    const placeHyphenated = (word) => {
      for (const piece of hyphenateWord(word, fsz, o.maxWidth, measure, ls)) {
        if (cur.length === 0) cur = piece;
        else { pushLine(); cur = piece; }
      }
    };
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (isZ || isTh) {
        // 逐字/簇拼接模式
        const cand = cur + tok;
        if (width(cand, fsz) <= o.maxWidth || cur.length === 0) {
          if (cur.length === 0 && width(tok, fsz) > o.maxWidth && tok.length > 1) {
            // 泰语超宽簇硬拆（按簇内字符）
            cur = '';
            for (const ch of tok) {
              const c2 = cur + ch;
              if (width(c2, fsz) <= o.maxWidth || cur.length === 0) cur = c2;
              else { pushLine(); cur = ch; }
            }
            continue;
          }
          cur = cand;
        } else {
          pushLine();
          // 避头尾：新行首字符为禁则标点 ⇒ 前行末字下推（禁则字符随行）
          if (isZ && NO_START.includes(tok) && lines.length > 0) {
            const prev = lines[lines.length - 1];
            if (prev.length > 1) {
              const lastCh = prev.charAt(prev.length - 1);
              if (!NO_END.includes(lastCh)) {
                lines[lines.length - 1] = prev.slice(0, -1);
                cur = lastCh + tok;
                continue;
              }
            }
          }
          cur = tok;
        }
      } else {
        // 西欧空格词元模式（单词绝不无声劈裂；超行宽长词连字符降级）
        if (cur.length === 0) {
          if (width(tok, fsz) > o.maxWidth && tok.length > 1) placeHyphenated(tok);
          else cur = tok;
        } else {
          const cand = cur + ' ' + tok;
          if (width(cand, fsz) <= o.maxWidth) cur = cand;
          else {
            pushLine();
            if (width(tok, fsz) > o.maxWidth && tok.length > 1) placeHyphenated(tok);
            else cur = tok;
          }
        }
      }
    }
    pushLine();
    return lines.map((l) => l.replace(/\s+$/, ''));
  }

  let fontSize = o.fontSize;
  let scaled = false;
  let lines = layoutAt(fontSize);
  while (lines.length > o.maxLines && fontSize > o.minFontSize) {
    fontSize = Math.max(o.minFontSize, fontSize - 1);
    scaled = true;
    lines = layoutAt(fontSize);
  }
  if (lines.length > o.maxLines) {
    // 硬夹断（3 行上限强制）＋末行省略号收口
    lines = lines.slice(0, o.maxLines);
    let last = lines[lines.length - 1];
    while (last.length > 1 && width(last + '\u2026', fontSize) > o.maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = last.replace(/[\s-]+$/, '') + '\u2026';
  }
  return { lines, fontSize, lineHeight: o.lineHeight, scaled };
}

/** 唯一命盘 Hash 码（确定性 FNV-1a——防伪底栏指纹） */
export function chartHash(seed) {
  const s = String(seed == null ? '' : seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, '0');
}
