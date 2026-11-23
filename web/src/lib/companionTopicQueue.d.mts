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
  /** 🆕 E149-刀三：L1 行动回访标记档（48h＋!followed_up 已在核内判定） */
  lastMicroAction?: { emotion_key?: unknown; action_summary?: unknown; created_date?: unknown; followed_up?: unknown } | null | undefined;
  /** 🆕 E149-刀三：当前角色（P3 轻复盘口吻分化；白名单五键，坏值 ⇒ P3 静默） */
  relationMode?: string;
  /** 🆕 E150-刀三：今日早间已选情绪（当日档——超 2h 也记得；P2 回忆层真源） */
  todayMood?: string | null;
  /** 🆕 E150-刀三：P4 回访上下文（在场才产出老友问候；缺席 ⇒ null 原契约不变） */
  p4?: { relationMode?: string; userName?: string; hour?: number } | null;
}): { firstLine: string; queue: string[]; p1Key: string; followedUp?: boolean; p4Band?: string } | null;
