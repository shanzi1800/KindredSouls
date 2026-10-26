/**
 * sseParser.mjs — SSE 帧解析纯逻辑核（Gate 43 · 甲线）
 * ─────────────────────────────────────────────────────────────────────────────
 * 职责：把 `fetch()` + ReadableStream 读到的**任意切分**文本块，按 SSE 线格式
 *      （帧以空行分隔、行前缀 `data:` / `:` 注释）切帧，并逐帧 JSON 解析。
 *
 * 🔴 纯逻辑核纪律：零 DOM / 零网络 / 零 React / 零计时器 —— 端到端可单测（Node 直跑）。
 *      「怎么读流」属前端接线（App.tsx）；「怎么切帧」属本模块，二者严格分离。
 *
 * 🔴 降级纪律：任何解析失败 ⇒ 该帧**丢弃**（返回 undefined），绝不抛出中断整个流；
 *      `[DONE]` 哨兵 ⇒ `{ done:true }`；空帧/心跳注释 ⇒ 无声忽略。
 *      切帧缓冲**不截断**（半帧滞留缓冲区等后续 chunk 补齐）—— 这是流式解析零丢帧的关键。
 */

/** 单帧解析：返回 `{data}` / `{done:true}` / `undefined`（忽略） */
export function parseSSEFrame(raw) {
  const text = String(raw == null ? '' : raw);
  const lines = text.split('\n');
  const dataLines = [];
  for (const ln of lines) {
    if (ln.startsWith(':')) continue;              // 注释 / 心跳（`: ping`）
    if (!ln.startsWith('data:')) continue;         // 当前协议不使用 event:/id:/retry:，一律忽略
    // SSE 规范：`data:` 后**至多**一个前导空格属分隔符
    dataLines.push(ln.slice(5).replace(/^ /, ''));
  }
  if (dataLines.length === 0) return undefined;
  const payload = dataLines.join('\n');
  if (payload.trim() === '[DONE]') return { done: true };
  try {
    return { data: JSON.parse(payload) };
  } catch (e) {
    return undefined;                              // 坏帧丢弃（绝不中断流）
  }
}

/**
 * 增量切帧器：喂入 chunk ⇒ 吐出**完整帧**数组（半帧滞留内部缓冲）。
 * 兼容 CRLF（先把 `\r\n` 归一为 `\n`）。
 */
export function createSSEParser() {
  let buf = '';
  return {
    push(chunk) {
      buf += String(chunk == null ? '' : chunk).replace(/\r\n/g, '\n');
      const out = [];
      let idx;
      while ((idx = buf.indexOf('\n\n')) !== -1) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        const ev = parseSSEFrame(raw);
        if (ev !== undefined) out.push(ev);
      }
      return out;
    },
    /** 流结束：冲刷残余缓冲（无尾随空行的末帧不丢） */
    flush() {
      const raw = buf;
      buf = '';
      if (!raw.trim()) return [];
      const ev = parseSSEFrame(raw);
      return ev === undefined ? [] : [ev];
    },
  };
}

/**
 * 帧分类：把解析结果归一为前端可消费的五类语义。
 *   · stage  —— 进度帧（含 label/pct/index/total）
 *   · ready  —— 终帧（携带报告载体）
 *   · error  —— 失败帧（fail-closed）
 *   · done   —— `[DONE]` 哨兵
 *   · text   —— 正文增量帧（E96-② 真流式：data: {"text": "..."}，逐 delta 边收边显）
 *   · ignore —— 未知形状（**绝不**误当 ready，防契约漂移静默通过）
 */
export function classifySSEFrame(ev) {
  if (!ev || typeof ev !== 'object') return { type: 'ignore' };
  if (ev.done === true) return { type: 'done' };
  const d = ev.data;
  if (!d || typeof d !== 'object') return { type: 'ignore' };
  if (d.stage === 'ready' && typeof d.insight === 'string') return { type: 'ready', body: d };
  if (d.stage === 'failed' || typeof d.error === 'string') return { type: 'error', body: d };
  if (typeof d.stage === 'string' && typeof d.label === 'string') return { type: 'stage', body: d };
  // 🛡️ E96-②（主公军令 2026-10-26）：正文增量帧（无 stage 字段、text 为字符串；
  //   与财富线流式正文帧 {"text": "..."} 同构）。ready/error/stage 判定在前 ⇒ 零误判。
  if (typeof d.text === 'string') return { type: 'text', body: d };
  return { type: 'ignore' };
}

/**
 * 把一组帧归约为「进度快照 + 终局载体 + 错误」。
 * 纯函数（不依赖调用顺序之外的状态）；最后出现的 ready/error 胜出（服务端单终帧纪律）。
 */
export function reduceSSEFrames(events) {
  let stage = null;
  let ready = null;
  let error = null;
  let done = false;
  for (const ev of (Array.isArray(events) ? events : [])) {
    const c = classifySSEFrame(ev);
    if (c.type === 'stage') {
      const pct = Number(c.body.pct);
      stage = {
        label: String(c.body.label || ''),
        title: String(c.body.title || ''),
        pct: Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0,
        index: Number.isFinite(Number(c.body.index)) ? Number(c.body.index) : 0,
        total: Number.isFinite(Number(c.body.total)) ? Number(c.body.total) : 0,
      };
    } else if (c.type === 'ready') {
      ready = { insight: c.body.insight, payload: c.body.payload || null, reportId: c.body.reportId || null, cached: c.body.cached === true };
    } else if (c.type === 'error') {
      error = { error: String(c.body.error || ''), code: c.body.code || null };
    } else if (c.type === 'done') {
      done = true;
    }
  }
  return { stage, ready, error, done };
}
