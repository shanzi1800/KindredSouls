/** E123 星语灵犀实体卡导出器类型声明（starWhisperCardExport.mjs） */
export const STAR_WHISPER_FILENAME_PREFIX: string;
export const STAR_WHISPER_CARD_TYPE: Readonly<Record<string, string | undefined>>;
export interface StarWhisperTemplate {
  title: string;
  subtitle: string;
  prose: string;
  companionWhisper: string;
  bestWindowPrefix: string;
  defaultTiming: string;
}
export function buildStarWhisperTemplate(pouch: unknown, lang: string): StarWhisperTemplate | null;
export function starWhisperFileName(dateKey: string): string;
export function downloadStarWhisperCard(pouch: unknown, lang: string): Promise<boolean>;
