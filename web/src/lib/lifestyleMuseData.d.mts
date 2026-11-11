/** E124 生活方式静态模板库类型声明（lifestyleMuseData.mjs） */
export interface LifestylePaletteRow { hex: string; name: string; }
export interface LifestyleHeading { deg: number; name: string; }
/** E134 三段式星轨路牌（name 本地语显示 / query 原生地图导航串；100K 赞助槽位预埋） */
export interface LifestyleWaypoint {
  name: string;
  query: string;
  sponsor_badge: string | null;
  secret_code: string | null;
}
export interface LifestyleTemplateRow {
  title: string;
  subtitle: string;
  prose: string;
  companionWhisper: string;
  bestWindowPrefix: string;
  defaultTiming: string;
  palette?: LifestylePaletteRow[];
  heading?: LifestyleHeading;
  /** E134：roadtrip 三站路牌（10 套 roadtrip 模板全配备） */
  waypoints?: LifestyleWaypoint[];
}
export const LIFESTYLE_LOCALES: readonly string[];
export const LIFESTYLE_TYPES: readonly string[];
export const LIFESTYLE_STAMP: Readonly<Record<string, { prefix: string; typ: string }>>;
export const LIFESTYLE_FILENAME: Readonly<Record<string, string>>;
export const LIFESTYLE_TEMPLATES_12: Readonly<Record<string, Readonly<Record<string, LifestyleTemplateRow>>>>;
/** E126-Geo-Locale：roadtrip geo 变体（key＝`${lang}@${zone}`） */
export const LIFESTYLE_GEO_VARIANTS: Readonly<Record<string, Readonly<Record<string, LifestyleTemplateRow>>>>;
/** E126 第三参 zone 可选：命中 `${lang}@${zone}` 变体优先；未命中回退语言基准 */
export function getLifestyleTemplate(type: string, lang: string, zone?: string): LifestyleTemplateRow | null;
/** E134 军师钦定六语词表（5 键：三路牌 tag/一键导航/沙盘副题） */
export const ROADTRIP_ROUTE_UI: Readonly<Record<string, Readonly<{
  waypoint_1_tag: string;
  waypoint_2_tag: string;
  waypoint_3_tag: string;
  open_native_map: string;
  route_map_subtitle: string;
}>>>;
/** E134 2.5D 沙盘几何单源（SVG 与 Canvas 双渲染域同源） */
export const ROADTRIP_MAP_SPEC: Readonly<{
  viewBoxWidth: number;
  viewBoxHeight: number;
  nodes: readonly { readonly nx: number; readonly ny: number }[];
  contourColor: string;
  contourLayers: number;
  routeColor: string;
  canvasSafeX: Readonly<{ minX: number; maxX: number }>;
}>;
