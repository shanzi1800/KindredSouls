/** E120-CHAIN 今日感应锦囊合璧持久化核类型声明（dailyPouchStore.mjs） */
export type DailyPouchStepLiteral = 'IDLE' | 'MOOD_SELECTING' | 'REVEALED';
export type PouchMoodLiteral = 'radiant' | 'longing' | 'melancholy' | 'agitated' | 'grateful';
export interface FusedPouchRecord {
  date: string;
  mood: PouchMoodLiteral;
  transitAttribution: {
    summary: string;
    companionComfort: string;
    actionableAdvice: string;
  };
  luckyAttributes: {
    colorName: string;
    colorHex: string;
    bestWindow: string;
    direction: string;
  };
  vibe: string;
  claimedStarlight: boolean;
}
export interface PouchUiDict {
  openCta: string;
  title: string;
  pouchLead: string;
  moodLead: string;
  luckyLead: string;
  colorLead: string;
  windowLead: string;
  dirLead: string;
  starNote: string;
  starDone: string;
  close: string;
  /** 🏆 E122-刀二（军令 2026-11-03）：入袋三态＋全局 Toast 新键（自容字典零 i18n） */
  stowDone: string;
  stowDisabled: string;
  toast: string;
}
export interface ComposePouchOptions {
  mood: string;
  attribution: {
    transitSummary: string;
    companionComfort: string;
    actionableAdvice: string;
  };
  lang?: string;
  sunSign?: string;
  dateKey?: string;
  date?: Date | string;
}
export const POUCH_STORAGE_PREFIX: string;
export const POUCH_MOODS: readonly PouchMoodLiteral[];
export const POUCH_STEPS: Readonly<Record<'IDLE' | 'MOOD_SELECTING' | 'REVEALED', DailyPouchStepLiteral>>;
export const POUCH_UI: Readonly<Record<'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi', PouchUiDict>>;
export function normalizePouchSig(chartSig: string | null | undefined): string;
export function pouchStorageKey(chartSig: string | null | undefined, dateKey: string): string;
export function normalizeFusedPouch(raw: unknown): FusedPouchRecord | null;
export function readFusedPouch(
  store: { getItem(k: string): string | null; setItem(k: string, v: string): void } | null | undefined,
  chartSig: string | null | undefined,
  dateKey: string
): FusedPouchRecord | null;
export function writeFusedPouch(
  store: { getItem(k: string): string | null; setItem(k: string, v: string): void } | null | undefined,
  chartSig: string | null | undefined,
  pouch: FusedPouchRecord
): boolean;
export function resolvePouchEntry(existing: FusedPouchRecord | null): 'MOOD_SELECTING' | 'REVEALED';
export function dailyBestWindow(date?: Date | string): string;
export function composeCombinedFortune(opts: ComposePouchOptions): FusedPouchRecord | null;
