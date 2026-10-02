/** V491 · WP-2：coord-parse.js 的类型声明（tsc -b 需要） */
export interface ResolveCoordinatesResult {
  ok: boolean;
  lat?: number;
  lon?: number;
  tier?: number;
  code?: string;
  reason?: string;
}
export declare function resolveCoordinates(lat: unknown, lon: unknown): ResolveCoordinatesResult;
