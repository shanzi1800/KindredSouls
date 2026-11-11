/** E134 nativeMapDeepLink.mjs 声明（铁律 9：.mjs 声明须 .d.mts） */
export interface RoadtripWaypoint {
  name: string;
  query: string;
}
export declare function buildMultiStopMapsUrl(waypoints: Array<{ name?: string; query?: string }>): string | null;
export declare function roadtripWaypointsOf(template: { waypoints?: Array<{ name?: string; query?: string }> } | null | undefined): RoadtripWaypoint[] | null;
export declare function openNativeMapUrl(url: string): boolean;
