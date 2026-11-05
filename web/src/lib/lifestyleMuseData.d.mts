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
export function getLifestyleTemplate(type: string, lang: string): LifestyleTemplateRow | null;
