/** E124 生活方式静态模板库类型声明（lifestyleMuseData.mjs） */
export interface LifestylePaletteRow { hex: string; name: string; }
export interface LifestyleHeading { deg: number; name: string; }
export interface LifestyleTemplateRow {
  title: string;
  subtitle: string;
  prose: string;
  companionWhisper: string;
  bestWindowPrefix: string;
  defaultTiming: string;
  palette?: LifestylePaletteRow[];
  heading?: LifestyleHeading;
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
