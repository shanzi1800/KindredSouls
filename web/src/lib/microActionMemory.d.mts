/** E149 microActionMemory.mjs 类型声明（tsc 消费面） */
export type MicroActionLike = {
  emotion_key: string;
  action_summary: string;
  created_date: string;
  followed_up: boolean;
} | null;

export function microActionKey(chartSig: string): string;
export const MICRO_EMOTION_KEYS: readonly string[];
export const MICRO_ACTION_TTL_MS: number;
export function guardMicroAction(v: unknown, nowTs?: number): MicroActionLike;
export function readMicroAction(ls: Storage | null, chartSig: string, nowTs?: number): MicroActionLike;
export function writeMicroAction(
  ls: Storage | null,
  chartSig: string,
  microAction: { emotion_key?: unknown; action_summary?: unknown; created_date?: unknown } | null | undefined,
  nowTs?: number,
): boolean;
export function markMicroActionFollowedUp(ls: Storage | null, chartSig: string, nowTs?: number): boolean;
export function microActionTodayKey(nowTs?: number): string;
