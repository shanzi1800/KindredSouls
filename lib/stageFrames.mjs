/**
 * stageFrames.mjs — 合盘「推演进度帧」纯逻辑核（Gate 43 · 甲线）
 * ─────────────────────────────────────────────────────────────────────────────
 * 职责：把 Gate 40 状态机（pending → calculating → assembling → ready）的**真实里程碑**
 *      映射为可下发的 SSE 事件对象；阶段文案**一律**取自唯一真值源
 *      astro/astro_terms_dict.json 的 pipelineStages 域（六语），**绝不硬编码**。
 *
 * 🔴 纯逻辑核纪律（与 lib/reportPipeline.mjs 同源）：
 *      零网络 / 零子进程 / 零 LLM / 零 DOM / 零 setTimeout —— 端到端可单测。
 *      本文件只「造帧」，不「写流」；写流由 server.js 适配层承担（关注点分离）。
 *
 * 🔴 真值纪律：缺真值 ⇒ 显式降级（回退 zh）或抛错，**绝不静默编造**新文案。
 *      帧的 pct 是**声明式里程碑刻度**（非真实耗时百分比），前端据此做确定性动画插值；
 *      任何阶段都不得宣称完成度高于真实里程碑。
 */
import { TERMS_DICT } from '../astroTerms.js';

/** SSE 响应头 Content-Type（适配层与闸门共用同一常量，防漂移） */
export const SSE_CONTENT_TYPE = 'text/event-stream; charset=utf-8';

/** SSE 终止哨兵帧（与既有 wealth/yearly 流式端点同构） */
export const SSE_DONE = 'data: [DONE]\n\n';

/** 心跳注释帧（Nginx/代理层保活；SSE 规范中 `:` 起手即注释，前端解析器应忽略） */
export const SSE_HEARTBEAT = ': ping\n\n';

/** 进度标题词条键（「星盘推演中…」的真值源键） */
export const STAGE_TITLE_KEY = 'PipelineRunning';

/**
 * 推演阶段序列 —— 顺序即真实里程碑顺序（**禁乱序、禁跳阶**）。
 *   · state：Gate 40 状态机状态名（仅作归属标注，不改状态机语义）
 *   · key  ：字典 pipelineStages 域词条键
 *   · pct  ：声明式里程碑刻度
 */
export const STAGE_SEQUENCE = Object.freeze([
  Object.freeze({ state: 'calculating', key: 'EphemerisFetch',  pct: 15 }),
  Object.freeze({ state: 'calculating', key: 'TensorFusion',    pct: 45 }),
  Object.freeze({ state: 'assembling',  key: 'ContractResolve', pct: 70 }),
  Object.freeze({ state: 'assembling',  key: 'ReportAssemble',  pct: 90 }),
]);

/** 阶段总数（前端 `index/total` 计数真值） */
export const STAGE_TOTAL = STAGE_SEQUENCE.length;

/** ready 终帧刻度 */
export const STAGE_READY_PCT = 100;

/**
 * 取阶段文案：域/键缺真值 ⇒ 抛错（防拼写错造成静默假绿）；语种缺该语 ⇒ 回退 zh（显式降级）。
 * 与 reportPipeline.termCard 的「缺键抛错」纪律一致。
 */
export function stageLabel(key, lang) {
  const dom = TERMS_DICT.domains.pipelineStages;
  if (!dom) throw new Error('stageFrames: 字典缺 pipelineStages 域（真值源被破坏）');
  const entry = dom[key];
  if (!entry) throw new Error(`stageFrames: 未知阶段词条 "${key}"（拼写错？）`);
  const v = entry[lang];
  if (typeof v === 'string' && v.length > 0) return v;
  const zh = entry.zh;
  if (typeof zh === 'string' && zh.length > 0) return zh;
  throw new Error(`stageFrames: 词条 "${key}" 缺 ${lang} 且缺 zh 兜底`);
}

/** 进度标题（「星盘推演中」）—— 同 stageLabel 纪律 */
export function stageTitle(lang) {
  return stageLabel(STAGE_TITLE_KEY, lang);
}

/**
 * 构造第 index 阶（0-based）阶段帧。
 * 越界 / 非整数 ⇒ null（**不抛错**：越界即「无此帧」，由调用方按需忽略）。
 */
export function buildStageFrame(index, lang) {
  const i = index;
  if (typeof i !== 'number' || !Number.isInteger(i) || i < 0 || i >= STAGE_TOTAL) return null;
  const st = STAGE_SEQUENCE[i];
  return {
    stage: st.state,
    index: i,
    total: STAGE_TOTAL,
    pct: st.pct,
    title: stageTitle(lang),
    label: stageLabel(st.key, lang),
  };
}

/** 构造 ready 终帧：附带报告正文载体（insight / cached / payload / reportId），字段按存在性注入 */
export function buildReadyFrame(lang, body) {
  const out = {
    stage: 'ready',
    index: STAGE_TOTAL,
    total: STAGE_TOTAL,
    pct: STAGE_READY_PCT,
    title: stageTitle(lang),
    label: stageLabel('ReportAssemble', lang),
  };
  const b = (body && typeof body === 'object') ? body : {};
  // 🔴 白名单注入：只透传契约字段，杜绝把内部对象（如 _g41Replay 整行）泄漏给前端
  if (typeof b.insight === 'string') out.insight = b.insight;
  if (typeof b.cached === 'boolean') out.cached = b.cached;
  if (b.payload && typeof b.payload === 'object') out.payload = b.payload;
  if (typeof b.reportId === 'string' && b.reportId.length > 0) out.reportId = b.reportId;
  return out;
}

/** 构造失败帧（fail-closed：绝不伪造成 ready） */
export function buildErrorFrame(code, message) {
  return {
    stage: 'failed',
    error: String(message == null ? '' : message),
    code: (code == null ? null : String(code)),
  };
}

/** SSE 线格式序列化；传入 null/undefined ⇒ null（表示「无帧可发」，调用方忽略） */
export function sseData(obj) {
  if (obj === null || obj === undefined) return null;
  return `data: ${JSON.stringify(obj)}\n\n`;
}

/** 帧类型判别（前端 / 闸门共用；未知形状一律 'ignore'，绝不误当 ready） */
export function classifyStageFrame(obj) {
  if (!obj || typeof obj !== 'object') return { type: 'ignore' };
  if (obj.stage === 'ready') return { type: 'ready', body: obj };
  if (obj.stage === 'failed' || typeof obj.error === 'string') return { type: 'error', body: obj };
  if (typeof obj.stage === 'string') return { type: 'stage', body: obj };
  return { type: 'ignore' };
}
