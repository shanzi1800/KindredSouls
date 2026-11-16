/** E142 clientTimeContext.mjs 类型声明（tsc 消费面） */
export function buildClientTimeContext(
  now?: Date,
  timezone?: string,
  lang?: string,
): { localISO: string; timezone: string; formattedLocalTime: string };
