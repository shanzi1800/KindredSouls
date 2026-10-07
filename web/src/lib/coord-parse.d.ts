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
/** E24⑥③(P1③)：时辰值域校验（HH:MM，h∈[0,23]、m∈[0,59]）；非法/非字符串 ⇒ false */
export declare function isValidBirthTime(t: unknown): boolean;
