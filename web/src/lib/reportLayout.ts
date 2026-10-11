/**
 * reportLayout.ts —— 合盘报告画布「排版与溢出防御」纯布局层（Gate 40）
 * ─────────────────────────────────────────────────────────────────────────
 * 职责（军师令：三层溢出防御）：
 *   ① 降语域 —— 真值层已由 lib/reportPipeline.mjs 完成（labelCard → chip → hardCap）；
 *   ② 字素裁剪 —— 本文件 fitGraphemes()（Intl.Segmenter，泰/越组合符不劈裂）；
 *   ③ CSS 兜底 —— 渲染层 overflow-wrap:anywhere / line-clamp / min-width:0。
 *
 * 🔴 单一真值：槽位预算**不手写**，一律取自 ../../.. 派生物 ASTRO_TERMS.slots.budgets
 *    （真值源 astro/astro_terms_dict.json）。
 * 🔴 零机翻：本文件不含任何行星/星座/相位/学说术语字面量；一切词条由 Payload 注入。
 * 🔴 无态渲染：本层只做纯函数布局，不持有流水线状态（前端只识 available / degraded）。
 */
import { ASTRO_TERMS, type TermLang } from './algos/astroTerms.generated';

export type CompatReportLang = TermLang;

/** 报告 Payload 契约版本（与 lib/reportPipeline.mjs 的 REPORT_PAYLOAD_SCHEMA 同源锁定） */
export const REPORT_PAYLOAD_SCHEMA = 'report_payload.v1';

/** 槽位预算（唯一真值源：字典 slots.budgets） */
export const SLOT_BUDGETS = ASTRO_TERMS.slots.budgets;

/** 绝对上限：任何槽位任何语种不得超过 */
export const HARD_CAP = SLOT_BUDGETS.hardCap?.maxGraphemes ?? 40;

// ── Payload 契约类型（与 lib/reportPipeline.mjs 的 buildReportPayload 出参一一对应）──
export interface PayloadTermRef {
  domain: string;
  key: string;
  label: string;
  slot: string;
}

export interface CompatPayloadAspectItem {
  id: string;
  a: PayloadTermRef;
  b: PayloadTermRef;
  aspect: PayloadTermRef;
  orb: number | null;
  polarity: 'harmonious' | 'hard' | null;
  text: string;
  tagId?: string;
}

export interface CompatPayloadCard {
  id: string;
  kind: string;
  titleKey: string;
  title: string;
  items: CompatPayloadAspectItem[];
}

export interface CompatPayloadTruth {
  available: boolean;
  degraded: boolean;
  precision: 'timed' | 'date_level' | null;
  degradedReason: string | null;
  harmonious: number;
  hard: number;
  total: number;
  ratio: number | null;
  counts: Record<string, number>;
  unknown: PayloadTermRef[];
}

export interface CompatPayloadSection {
  icon: string;
  text: string;
}

export interface CompatReportPayload {
  schemaVersion: string;
  lang: CompatReportLang;
  reportType: string | null;
  generatedAt: string | null;
  truth: CompatPayloadTruth;
  /** 灵宠学说词条（dict.domains.familiar 派生；localized 命名层，与数值真值层分离） */
  terms: Record<string, PayloadTermRef>;
  labels: Record<string, string>;
  cards: CompatPayloadCard[];
  sections: CompatPayloadSection[];
}

// ── Gate 42 画布三卡视图模型（**前端派生**，非 payload 契约字段；守 payload 顶层键集零污染）──
export interface CompatCanvasSignature {
  tierKey: string | null;
  tier: PayloadTermRef | null;
  ratioPct: number | null;
  chips: CompatPayloadAspectItem[];
}

export interface CompatCanvasContract {
  sealed: boolean;
  state: PayloadTermRef | null;
  points: PayloadTermRef[];
  quote: CompatPayloadAspectItem | null;
}

export interface CompatCanvasEnergyAxis {
  id: string;
  axis: PayloadTermRef | null;
  known: boolean;
  harmonious: number;
  hard: number;
  value: number | null;
}

export interface CompatCanvasModel {
  signature: CompatCanvasSignature;
  contract: CompatCanvasContract;
  energy: CompatCanvasEnergyAxis[];
}

// ── Gate 44 宫位交互网格（**信封旁置真值**，非 payload 契约字段；守 payload 双向键集零污染）──
/** 服务端信封旁置字段 `houseOverlay`（真源 astroMatrix.meta.computed_houses） */
export interface CompatHouseTruthSidecar {
  available: boolean;
  precision: string | null;
  /** 甲侧行星英文键 → 宫位号（1..12）；缺值/非精确建盘 ⇒ {} */
  a: Record<string, number>;
  b: Record<string, number>;
}

export interface CompatHouseCell {
  house: number;
  numeral: string;
  a: { key: string; label: string }[];
  b: { key: string; label: string }[];
  resonance: boolean;
}

export interface CompatHouseLink {
  id: string;
  aLabel: string;
  bLabel: string;
  aspectLabel: string;
  orb: number | null;
  polarity: 'harmonious' | 'hard' | null;
  houseA: number;
  houseB: number;
  houseNumeralA: string;
  houseNumeralB: string;
}

export interface CompatHouseOverlayModel {
  available: boolean;
  precision: string | null;
  title: PayloadTermRef | null;
  resonanceLabel: PayloadTermRef | null;
  legend: { self: PayloadTermRef | null; familiar: PayloadTermRef | null };
  numerals: string[];
  cols: number;
  cells: CompatHouseCell[];
  resonanceCount: number;
  links: CompatHouseLink[];
}

/** 报告投递溯源（真实路径：流式 SSE / 安全直连 JSON；仅供前端状态可视化，真值不落 payload） */
export type CompatDeliveryMode = 'stream' | 'direct';

// ── 字素工具（Intl.Segmenter：泰语声调符/越语变音符号不误判为独立字素）──────────
const SEG: Intl.Segmenter | null = (typeof Intl !== 'undefined' && typeof (Intl as { Segmenter?: unknown }).Segmenter === 'function')
  ? new Intl.Segmenter('en', { granularity: 'grapheme' })
  : null;

/** 字素长度（无 Segmenter 环境退化为码点计数，绝不崩） */
export function graphemes(str: string | null | undefined): number {
  const s = String(str == null ? '' : str);
  if (!SEG) return [...s].length;
  let n = 0;
  for (const _ of SEG.segment(s)) n++;
  return n;
}

/** 字素安全裁剪（超预算以省略号收束；不劈裂组合字素簇） */
export function fitGraphemes(str: string | null | undefined, maxGraphemes: number): string {
  const s = String(str == null ? '' : str);
  const cap = Number.isFinite(maxGraphemes) && maxGraphemes > 0 ? Math.floor(maxGraphemes) : 0;
  if (!SEG) return s.length <= cap ? s : (cap <= 1 ? s.slice(0, cap) : s.slice(0, cap - 1) + '…');
  const parts: string[] = [];
  for (const seg of SEG.segment(s)) parts.push(seg.segment);
  if (parts.length <= cap) return s;
  if (cap <= 1) return parts.slice(0, cap).join('');
  return parts.slice(0, cap - 1).join('') + '…';
}

/** 按槽位预算裁剪（chip / labelCard / degreeOverlay 自动选档；未知槽位退 hardCap） */
export function clampToSlot(str: string | null | undefined, slot: string): string {
  const b = SLOT_BUDGETS[slot];
  const cap = b && Number.isFinite(b.maxGraphemes) ? b.maxGraphemes : HARD_CAP;
  return fitGraphemes(str, Math.min(cap, HARD_CAP));
}

/** 四段壳锚 → 语义强调色（语言中立；🛡️ 禁第四轴） */
const SECTION_ACCENT: Record<string, string> = {
  '🎯': '#D4AF37',
  '⚡': '#FF8A80',
  '💡': '#81D8D0',
  '🌿': '#A5D6A7',
};

export function sectionAccent(icon: string): string {
  return SECTION_ACCENT[icon] || 'rgba(255,255,255,0.72)';
}

/**
 * 运行时形状守卫：只接受本契约版本的 Payload，其余一律判非（前端优雅回退旧渲染）。
 * 🔴 不做字段补全、不做默认值填充 —— 结构不合即不认，杜绝半成品 Payload 污染画布。
 */
export function isCompatReportPayload(v: unknown): v is CompatReportPayload {
  if (!v || typeof v !== 'object') return false;
  const p = v as Partial<CompatReportPayload>;
  if (p.schemaVersion !== REPORT_PAYLOAD_SCHEMA) return false;
  if (!p.truth || typeof p.truth !== 'object') return false;
  if (typeof p.truth.available !== 'boolean' || typeof p.truth.degraded !== 'boolean') return false;
  if (!Array.isArray(p.cards) || !Array.isArray(p.sections)) return false;
  if (!p.labels || typeof p.labels !== 'object') return false;
  return true;
}
