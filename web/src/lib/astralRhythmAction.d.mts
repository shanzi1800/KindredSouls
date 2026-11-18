/** E144 星灵节律与干活能力类型声明（astralRhythmAction.mjs） */
export const ASTRAL_RHYTHM_LOCALES: ReadonlyArray<string>;
export const L_CIRCADIAN: Readonly<Record<string, Readonly<Record<string, string>>>>;
export const L_ASTRAL_REUNION_BADGE: Readonly<Record<string, string>>;
export const L_CALENDAR_LOCK_PILL: Readonly<Record<string, string>>;
export const L_PROXY_TIERS: Readonly<Record<string, Readonly<Record<string, string>>>>;
export const L_COPY_DONE: Readonly<Record<string, string>>;
export function resolveCircadianPhase(hour: number, minute?: number): 'day' | 'night';
export function circadianStatusLabel(lang: string, phase: string): string;
export function composeCircadianStatus(bondLabel: string, hour: number, minute: number | undefined, lang: string): string;
export const ASTRAL_REUNION_GAP_MS: number;
export const ASTRAL_LAST_ACTIVE_KEY: string;
export function readLastActiveTs(store: unknown): number | null;
export function writeLastActiveTs(store: unknown, ts: number): boolean;
export interface AstralReunionContext { reunion: boolean; dayCrossed: boolean; gapHours: number; }
export function computeAstralReunionContext(input?: { lastActiveTs?: number | null; nowTs?: number; localISO?: string } | null): AstralReunionContext;
export function astralReunionBadgeLabel(lang: string): string;
export function normalizeAstralBreathingChunk(text: string): string;
export function splitAstralBreathingText(text: string, lang: string): string;
export interface AstralCalendarEvent { dateOffset: 0 | 1; startHH: number; startMM: number; endHH: number; endMM: number; kind: 'lucky' | 'caution'; }
export function detectAstralCalendarEvent(text: string): AstralCalendarEvent | null;
export function calendarLockPillLabel(lang: string): string;
export function calendarEventSummary(lang: string, kind: string): string;
export function buildAstralCalendarICS(ev: {
  dateISO: string; startHH: number; startMM: number; endHH: number; endMM: number;
  summary: string; description?: string; uidSalt?: string;
}): string;
export function astralCalendarFilename(dateISO: string): string;
export interface ProxyIntentHit { lang: string; keyword: string; }
export function detectReplyProxyIntent(text: string): ProxyIntentHit | null;
export function proxyTierPrefix(lang: string, tier: string): string;
export function copyDoneLabel(lang: string): string;
export interface ProxyLineParse { tier: string; content: string; }
export function parseProxyLine(line: string): ProxyLineParse | null;
export function buildAstralBreathingPromptBlock(lang: string): string;
export function buildAstralReplyProxyPromptBlock(lang: string): string;
