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
/** 🆕 E150-刀三：时段四档（状态栏词面与 P4 问候时段句真源） */
export const L_CIRCADIAN_BANDS: Readonly<Record<string, Readonly<Record<string, string>>>>;
export function circadianBandOf(hour: number, minute?: number): 'morning' | 'afternoon' | 'dusk' | 'night';
export function circadianBandLabel(lang: string, band: string): string;
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
/** E144.1-刀二：语义宽域日历意图（军令锁B——财运/避坑/指引等命中即触发）。 */
export function detectAstralCalendarIntent(text: string): 'caution' | 'lucky' | null;
/** E144.1-刀二：无钟点智能时段兜底窗（午后 14-16/晚间 20-22 高发窗）。 */
export function defaultAstralWindow(nowHour: number): { dateOffset: 0; startHH: number; startMM: 0; endHH: number; endMM: 0 };
export function calendarLockPillLabel(lang: string): string;
export function calendarEventSummary(lang: string, kind: string): string;
export function buildAstralCalendarICS(ev: {
  dateISO: string; startHH: number; startMM: number; endHH: number; endMM: number;
  summary: string; description?: string; uidSalt?: string;
  /** 🆕 E145-刀六：锁屏日历富字段（四项微调——缺席 ⇒ 降级现行为零破坏） */
  lang?: string; whisperName?: string; actionCore?: string; fortuneLine?: string;
  tiLine?: string; actionLine?: string; whisperLine?: string;
}): string;
export function astralCalendarFilename(dateISO: string): string;
/** 🆕 E145-刀六：日历富字段装配（标题前缀/宜忌/三段/回流链接——组件消费纯核单源）。 */
export const L_ICS_PREFIX: Readonly<Record<string, string>>;
export const L_ICS_BACK_LINK: Readonly<Record<string, string>>;
export const ASTRAL_BACK_URL: string;
export interface AstralCalendarRichFields { actionCore: string; fortuneLine: string; tiLine: string; actionLine: string; whisperLine: string; }
export function buildAstralCalendarRichFields(lang: string, kind: string, note: string, win?: { startHH?: number; endHH?: number } | null): AstralCalendarRichFields | null;
export interface ProxyIntentHit { lang: string; keyword: string; }
export function detectReplyProxyIntent(text: string): ProxyIntentHit | null;
export function proxyTierPrefix(lang: string, tier: string): string;
export function copyDoneLabel(lang: string): string;
export interface ProxyLineParse { tier: string; content: string; }
export function parseProxyLine(line: string): ProxyLineParse | null;
export function buildAstralBreathingPromptBlock(lang: string): string;
export function buildAstralReplyProxyPromptBlock(lang: string): string;
