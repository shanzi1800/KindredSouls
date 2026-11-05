/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E125-UNIVERSAL-TYPOGRAPHY（主公军令 2026-11-05）：三卡通用安全排字引擎
 * ═══════════════════════════════════════════════════════════════════════════
 * 病灶实录（image_9.png 实锤）：星语卡 prose 为服务端动态生成的**中英混排文本**
 * （「…把心里那句欣赏发给 与 TA——好状态值得被看见…」）。旧 wrapLines 见文本
 * 含空格即走空格分词路径，25 个连排中文被 split(/\s+/) 视作**一个不可拆分的
 * 超宽「单词」**（42px×25≈1050px > 画布可用宽），首词 line 为空被整词放行 ⇒
 * 单行穿透双侧暗金边框。三卡（星语/密函/穿搭/路书）共用同构复制粘贴的旧引擎，
 * 一处病灶处处中招。
 *
 * 本引擎军规（1080×1748 画布基准）：
 *   · 全局安全内缩 insetX=140 ⇒ 文本行宽硬上限 maxTextWidth=800（x∈[140,940]）；
 *   · 脚本感知 token 化：zh 的 CJK 连排逐字成 token（空格边界记忆——中文不插
 *     空格、拉丁按词），混排根治；超宽 token 字符簇级回溯兜底；
 *   · 泰/越组合字符成簇折行（调号永不孤立成行首）；
 *   · zh 单行硬帽 18 字（军令钦定）；标点避头尾（行首禁句读/行尾禁开引）；
 *   · 垂直动态居中：行数自适应 startY（轻量下沉 clamp——禁悬空/禁压顶）。
 * node:test 兼容：measureText 缺席 ⇒ 保守估宽（与旧引擎同口径，语义断言不受影响）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 画布文本安全边界（军令钦定——1080 宽画布，左右内缩 140 ⇒ [140, 940]） */
export const CANVAS_TEXT_SAFE_BOUNDS = Object.freeze({
  insetX: 140,
  maxTextWidth: 800,
  centerInX: 540,
  boundMinX: 140,
  boundMaxX: 940,
  /** zh 单行字符硬帽（军令钦定 18 字——42px×18=756 ≤ 800 自洽） */
  zhMaxCharsPerLine: 18,
  /** 垂直动态居中：轻量下沉上限（防短文案悬空漂浮/长文案压顶） */
  verticalDriftMax: 120,
});

/** 组合字符标记（零宽调号跟随基字符——折行永不孤立调号） */
const CLUSTER_MARKS = /[\u0300-\u036F\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u093C\u09BE]/;

/** CJK 字符（含全角标点区——逐字可断） */
const CJK_CHAR_RE = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3000-\u303F\uFF00-\uFFEF]/;

/** 行首禁字（句读/省略/连接——军令「避头尾法则」） */
const NO_LINE_HEAD = new Set(
  '。，、；：？！…—·,.!?;:」』）)〉】〕》”’‥「『（〈'.split('')
);

/** 行尾禁字（开引/开括——不得孤悬行尾） */
const NO_LINE_TAIL = new Set('「『（(〈【〔《“‘'.split(''));

/** 度量（measureText 缺席 ⇒ 保守估宽 18px/字——与旧引擎同口径） */
function measureW(ctx, text) {
  try {
    if (typeof ctx.measureText === 'function') {
      const w = ctx.measureText(text).width;
      if (typeof w === 'number' && Number.isFinite(w)) return w;
    }
  } catch { /* fallthrough */ }
  return text.length * 18;
}

/** 字符簇切分（基字符＋组合标记成簇；CJK/拉丁单字符成簇） */
function splitClusters(text) {
  const out = [];
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const cur = chars[i];
    if (out.length && CLUSTER_MARKS.test(cur)) {
      out[out.length - 1] += cur; // 调号并入前一簇
    } else {
      out.push(cur);
    }
  }
  return out;
}

/**
 * 脚本感知 token 化（zh 军令刀锋）：CJK 单字各成一 token；连续非 CJK 段
 * （拉丁词/数字/破折号串）合并成一 token。空格边界由 tokenizeEntry 层记忆。
 */
function scriptTokens(text) {
  const clusters = splitClusters(text);
  const out = [];
  let buf = '';
  for (const c of clusters) {
    if (CJK_CHAR_RE.test(c)) {
      if (buf) { out.push(buf); buf = ''; }
      out.push(c);
    } else {
      buf += c;
    }
  }
  if (buf) out.push(buf);
  return out;
}

/** CJK 计数（zh 字帽判据） */
function countCJK(s) {
  let n = 0;
  for (const ch of Array.from(s)) if (CJK_CHAR_RE.test(ch)) n += 1;
  return n;
}

/**
 * 超宽 token 字符簇级回溯拆分（兜底——拉丁超长词/超长泰文串最后手段硬切；
 * 军令「严禁单词中途切断」于词宽≤maxWidth 时严格成立，词自身超宽必须切）
 */
function splitOversizedToken(ctx, token, maxWidth) {
  const clusters = splitClusters(token);
  const parts = [];
  let cur = '';
  for (const c of clusters) {
    const next = cur + c;
    if (measureW(ctx, next) > maxWidth && cur) { parts.push(cur); cur = c; }
    else cur = next;
  }
  if (cur) parts.push(cur);
  return parts;
}

/**
 * 通用安全折行主入口（军令钦定接口——三卡单一事实源）
 * @param {object} ctx Canvas 2D 上下文（或 node mock 桩）
 * @param {string} text 待折行文本（支持 \n 段落）
 * @param {number} [maxWidth=800] 行宽上限（缺省军令锁死 800）
 * @param {string} [locale='en'] 六语之一（zh/en/fr/es/th/vi）
 * @returns {string[]} 折行结果（每行渲染宽度均 ≤ maxWidth）
 */
export function wrapCanvasText(ctx, text, maxWidth = CANVAS_TEXT_SAFE_BOUNDS.maxTextWidth, locale = 'en') {
  const limit = Number(maxWidth) > 0 ? Number(maxWidth) : CANVAS_TEXT_SAFE_BOUNDS.maxTextWidth;
  const out = [];
  const paragraphs = String(text || '').split('\n');
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) { out.push(''); continue; }
    // ① 空白 token 化（空格边界记忆：首 token 无前导空格，其余有）
    const rawTokens = trimmed.split(/\s+/).filter(Boolean);
    const tokens = [];
    rawTokens.forEach((raw, idx) => {
      const leadingSpace = idx > 0;
      let pieces;
      if (locale === 'zh' && CJK_CHAR_RE.test(Array.from(raw).find((c) => CJK_CHAR_RE.test(c)) || '')) {
        // zh 且含 CJK：脚本感知逐字化（18 字帽由组行精确执行）
        pieces = scriptTokens(raw);
      } else if (measureW(ctx, raw) > limit) {
        // 超宽兜底（拉丁超长词/泰文长串——字符簇级回溯）
        pieces = splitOversizedToken(ctx, raw, limit);
      } else {
        pieces = [raw];
      }
      pieces.forEach((p, j) => tokens.push({ t: p, space: leadingSpace && j === 0 }));
    });
    // ② 贪心组行（空格边界按真源拼装；zh 18 字帽；宽度硬闸）
    const zhCap = locale === 'zh' ? CANVAS_TEXT_SAFE_BOUNDS.zhMaxCharsPerLine : Infinity;
    const lines = [];
    let line = '';
    let lineHas = false;
    for (const tok of tokens) {
      const next = lineHas && tok.space ? `${line} ${tok.t}` : line + tok.t;
      const tooWide = measureW(ctx, next) > limit;
      const tooMany = lineHas && locale === 'zh' && countCJK(next) > zhCap;
      if ((tooWide || tooMany) && lineHas) {
        lines.push(line);
        line = tok.t;
      } else {
        line = next;
      }
      lineHas = true;
    }
    if (line || !lines.length) lines.push(line);
    // ③ 标点避头尾（宽度守恒复核——宁可微小不完美，绝不允许超宽）
    applyPunctuationRules(ctx, lines, limit);
    out.push(...lines);
  }
  return out;
}

/** 标点避头尾后处理（行首句读借字下压/行尾开引随行下移——宽度守恒校验） */
function applyPunctuationRules(ctx, lines, maxWidth) {
  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1];
    const cur = lines[i];
    const head = Array.from(cur)[0] || '';
    if (NO_LINE_HEAD.has(head) && Array.from(prev).length > 1) {
      const borrowed = Array.from(prev).pop();
      const moved = borrowed + cur;
      if (measureW(ctx, moved) <= maxWidth) {
        lines[i - 1] = Array.from(prev).slice(0, -1).join('');
        lines[i] = moved;
      }
      continue;
    }
    const tail = Array.from(prev).pop() || '';
    if (NO_LINE_TAIL.has(tail) && cur.length > 0) {
      const moved = tail + cur;
      if (measureW(ctx, moved) <= maxWidth) {
        lines[i - 1] = Array.from(prev).slice(0, -1).join('');
        lines[i] = moved;
      }
    }
  }
  return lines;
}

/**
 * 行宽极值测绘（闸门断言直用——居中锚定推算 minX/maxX）
 * @param {object} ctx Canvas 2D 上下文（或 mock 桩）
 * @param {string[]} lines 折行结果
 * @param {number} [centerX=540] 居中锚点
 * @returns {{widths:number[], minX:number, maxX:number, overflow:boolean}}
 */
export function measureLineExtremes(ctx, lines, centerX = CANVAS_TEXT_SAFE_BOUNDS.centerInX) {
  const widths = [];
  let minX = Infinity;
  let maxX = -Infinity;
  for (const line of lines) {
    if (!line) continue;
    const w = measureW(ctx, line);
    widths.push(w);
    minX = Math.min(minX, centerX - w / 2);
    maxX = Math.max(maxX, centerX + w / 2);
  }
  if (!widths.length) { minX = centerX; maxX = centerX; }
  return {
    widths,
    minX,
    maxX,
    overflow: widths.some((w) => w > CANVAS_TEXT_SAFE_BOUNDS.maxTextWidth)
      || minX < CANVAS_TEXT_SAFE_BOUNDS.boundMinX
      || maxX > CANVAS_TEXT_SAFE_BOUNDS.boundMaxX,
  };
}

/**
 * 垂直动态居中偏移（军令 Y 轴平衡——轻量下沉 clamp 防悬空/压顶）
 * @param {number} contentHeight 文本块总高（lines×lineHeight 等累加）
 * @param {number} availTop 可用区顶（proseTopY）
 * @param {number} availBottom 可用区底（textSafeBottomY）
 * @returns {number} 实际绘制起点 Y（∈ [availTop, availTop+verticalDriftMax]）
 */
export function verticalCenteredStartY(contentHeight, availTop, availBottom) {
  const avail = Math.max(0, availBottom - availTop);
  const slack = avail - contentHeight;
  const drift = Math.min(
    CANVAS_TEXT_SAFE_BOUNDS.verticalDriftMax,
    Math.max(0, slack * 0.35),
  );
  return availTop + Math.round(drift);
}
