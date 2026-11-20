/** E142 companionTopicQueue.mjs 类型声明（tsc 消费面） */
export type RecentReportLike = { category?: string; tier?: string; unlockedAt?: number } | null | undefined;

export function normalizeReportTier(tier: string | undefined): string;
export function normalizeReportKey(recentReport: RecentReportLike): string | null;
/** 🆕 E148-刀一：P1 当日校验（unlockedAt 落注入时钟本地今日才放行；fail-closed） */
export function isRecentReportToday(recentReport: RecentReportLike, now?: number): boolean;
export function resolveCompanionGreetingAndQueue(p: {
  recentReport: RecentReportLike;
  activeMood: string | null | undefined;
  lang: string;
  userName?: string;
  /** 🆕 E148-刀一：注入时钟（缺省 Date.now()——P1 当日硬门真源） */
  now?: number;
}): { firstLine: string; queue: string[]; p1Key: string } | null;
