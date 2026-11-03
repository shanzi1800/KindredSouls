/** E120 全六语 24 套破冰密函模板库类型声明（amuletTemplates.mjs） */
export type AmuletTypeKey = 'apology' | 'longing' | 'support' | 'weather';
export type AmuletLocaleKey = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';
export interface AmuletTemplateContentRow {
  title: string;
  subtitle: string;
  prose: string;
  companionWhisper: string;
  bestWindowPrefix: string;
  tarotCard: string;
  tarotNumber: string;
  defaultTiming: string;
}
export const AMULET_LOCALES: readonly string[];
export const AMULET_TYPES: readonly string[];
export const AMULET_CARD_ID: Readonly<Record<AmuletTypeKey, number>>;
export const AMULET_TYPE_STAMP: Readonly<Record<AmuletTypeKey, string>>;
export const AMULET_TEMPLATES_24: Readonly<
  Record<AmuletTypeKey, Readonly<Record<AmuletLocaleKey, AmuletTemplateContentRow>>>
>;
export function listAmuletTemplateKeys(): string[];
export function getAmuletTemplate(type: string, locale: string): AmuletTemplateContentRow | null;
