/** E120 1:1.618 破冰密函 Canvas 离屏渲染引擎类型声明（amuletCanvasRenderer.mjs） */
import type { AmuletTemplateContentRow } from './amuletTemplates.d.mts';
export interface AmuletDimensions { width: number; height: number; }
export interface AmuletLayoutAnchors {
  titleY: number; subtitleY: number; hostLineY: number;
  totemCenterY: number; totemSize: number;
  proseTopY: number; textSafeBottomY: number;
  windowPlateY: number; separatorY: number; domainY: number; stampY: number;
  frameOuterInset: number; frameInnerInset: number; textMaxWidth: number;
}
export interface LocaleCanvasConfigRow {
  proseFontSize: number;
  whisperFontSize: number;
  lineHeight: number;
  fontFamily: string;
  topPaddingOffset: number;
  stack: string;
}
export interface AmuletRenderOptions {
  hostName?: string;
  partnerName?: string;
  type?: string;
  hashId?: string;
}
export const AMULET_DIMENSIONS: AmuletDimensions;
export const GOLDEN_RATIO_TOLERANCE: number;
export const AMULET_OFFICIAL_DOMAIN: string;
export const AMULET_STAMP_PREFIX: string;
export const AMULET_LAYOUT_ANCHORS: AmuletLayoutAnchors;
export const LOCALE_CANVAS_CONFIG: Readonly<Record<string, LocaleCanvasConfigRow>>;
export function composeAmuletStamp(type: string | null | undefined, locale: string, hashId?: string): string;
export function renderAmuletToCanvas(
  canvas: HTMLCanvasElement,
  template: AmuletTemplateContentRow,
  locale: string,
  options?: AmuletRenderOptions
): Promise<HTMLCanvasElement>;
export function createAmuletCanvas(): HTMLCanvasElement;
export function isGoldenRatioCanvas(canvas: { width: number; height: number }): boolean;
