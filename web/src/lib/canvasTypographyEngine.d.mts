/** E125 通用安全排字引擎类型声明（canvasTypographyEngine.mjs） */
export const CANVAS_TEXT_SAFE_BOUNDS: Readonly<{
  insetX: number;
  maxTextWidth: number;
  centerInX: number;
  boundMinX: number;
  boundMaxX: number;
  zhMaxCharsPerLine: number;
  verticalDriftMax: number;
}>;
export function wrapCanvasText(
  ctx: CanvasRenderingContext2D | { measureText?: unknown },
  text: string,
  maxWidth?: number,
  locale?: string
): string[];
export function measureLineExtremes(
  ctx: CanvasRenderingContext2D | { measureText?: unknown },
  lines: string[],
  centerX?: number
): { widths: number[]; minX: number; maxX: number; overflow: boolean };
export function verticalCenteredStartY(
  contentHeight: number,
  availTop: number,
  availBottom: number
): number;
