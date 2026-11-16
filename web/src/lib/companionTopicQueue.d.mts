/** E142 companionTopicQueue.mjs 类型声明（tsc 消费面） */
export type RecentReportLike = { category?: string; tier?: string } | null | undefined;

export function normalizeReportTier(tier: string | undefined): string;
export function normalizeReportKey(recentReport: RecentReportLike): string | null;
export function resolveCompanionGreetingAndQueue(p: {
  recentReport: RecentReportLike;
  activeMood: string | null | undefined;
  lang: string;
  userName?: string;
}): { firstLine: string; queue: string[]; p1Key: string } | null;
export function topicPillLabel(recentReport: RecentReportLike, lang: string): string | null;
