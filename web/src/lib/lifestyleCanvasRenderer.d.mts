/** E124 生活方式卡 Canvas 引擎类型声明（lifestyleCanvasRenderer.mjs） */
export const LIFESTYLE_LAYOUT_ANCHORS: Readonly<Record<string, number>>;
export function composeLifestyleStamp(type: string, locale: string, hashId?: string): string;
export function renderLifestyleToCanvas(
  canvas: HTMLCanvasElement,
  template: object,
  locale: string,
  options?: { type?: string; hostName?: string; hashId?: string }
): Promise<HTMLCanvasElement>;
export function createLifestyleCanvas(): HTMLCanvasElement;
export function isLifestyleGoldenRatio(canvas: HTMLCanvasElement): boolean;
