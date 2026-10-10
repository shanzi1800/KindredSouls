/**
 * bgQueue — 首页背景「插拔式轮播容器」的数据模型与纯逻辑核
 *
 * 设计定性（军师令）：首页背景不是「几张壁纸切换」，而是**全天候可插拔的动态内容投放容器**：
 *   - ambient  默认星空底（兜底态，永不空场）
 *   - story    15s 短剧切片（Milo / Sophia IP 宣发）
 *   - ad       30s 商业广告位
 *
 * 本模块只做纯计算（无 DOM / 无副作用 / 无网络），便于确定性自测与静态审计。
 * 运行时行为（预加载、双槽交叉淡入、定时切换）由 CelestialBackground.tsx 承担。
 *
 * 插拔方式（运营侧，二选一，均无需改组件内核）：
 *   ① 编译期：直接在本文件 BG_VIDEOS 数组增删条目；
 *   ② 运行期热插拔：改 web/public/bg-queue.json（{ "version":1, "items":[...] }），
 *      刷新即生效 —— 组件启动时拉取并校验，空/非法则回退 BG_VIDEOS。
 */

export type BgItemType = 'ambient' | 'story' | 'ad';

export interface BgItem {
  id: string;
  src: string;
  holdMs: number;
  type: BgItemType;
}

/** 停留时长护栏：过短会闪、过长会看腻 */
export const MIN_HOLD_MS = 5_000;
export const MAX_HOLD_MS = 300_000;
/** 未声明 holdMs 时的默认停留时长 */
export const DEFAULT_HOLD_MS = 30_000;
/** 队列长度上限（防误配置把首屏流量打爆） */
export const MAX_QUEUE_ITEMS = 12;
/** 合法内容类型闭集 */
export const BG_ITEM_TYPES: readonly BgItemType[] = ['ambient', 'story', 'ad'];

/**
 * 默认声明式队列 —— 唯一兜底态：1 支 → 引擎自动退化为「单支常驻循环」，
 * 与改造前行为逐字一致（零额外请求、零轮播定时器）。
 */
export const BG_VIDEOS: BgItem[] = [
  { id: 'default-cosmic', src: '/cosmic_bg.mp4', holdMs: 30_000, type: 'ambient' },
];

/** 运行期热插拔配置文件的约定路径（放 web/public/ 下） */
export const BG_QUEUE_CONFIG_PATH = '/bg-queue.json';

/** 时长合法化：非法/缺省 → fallback；越界 → 夹取到 [MIN, MAX] */
export function resolveHoldMs(item: BgItem | undefined | null, fallback: number = DEFAULT_HOLD_MS): number {
  const v = item?.holdMs;
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  if (v < MIN_HOLD_MS) return MIN_HOLD_MS;
  if (v > MAX_HOLD_MS) return MAX_HOLD_MS;
  return Math.round(v);
}

/** 固定列表顺序循环（Queue Loop）：越界/负数/非法一律归一后取下一支 */
export function nextQueueIndex(cur: number, len: number): number {
  if (!Number.isFinite(len) || len <= 0) return 0;
  const n = Math.trunc(len);
  const c = Number.isFinite(cur) ? ((Math.trunc(cur) % n) + n) % n : 0;
  return (c + 1) % n;
}

/** 安全取件：越界自动夹取；队列为空则回退默认队列首支 */
export function pickQueueItem(queue: BgItem[], index: number): BgItem {
  const items = queue.length > 0 ? queue : BG_VIDEOS;
  const raw = Number.isFinite(index) ? Math.trunc(index) : 0;
  const i = Math.min(Math.max(raw, 0), items.length - 1);
  return items[i];
}

/**
 * 省流/无障碍降级判据：命中则**只保留首支**（退化为单支常驻），
 * 保证主干逻辑完整、不阻断首屏（弱网开关不阻断主线 —— 军师令）。
 */
export function shouldDegradeToSingle(
  queue: BgItem[],
  opts: { saveData?: boolean; reducedMotion?: boolean; allowOnSlow?: boolean } = {},
): boolean {
  if (queue.length <= 1) return false;
  if (opts.allowOnSlow) return false;
  return Boolean(opts.saveData || opts.reducedMotion);
}

function isUsableSrc(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  const s = src.trim();
  if (s.length === 0) return false;
  return s.startsWith('/') || /^https?:\/\//i.test(s);
}

function isBgItemType(t: unknown): t is BgItemType {
  return typeof t === 'string' && (BG_ITEM_TYPES as readonly string[]).includes(t);
}

/**
 * 校验并归一化外部队列（运行期 JSON / 未来远端下发）。
 * 逐条过滤非法项（缺 src / src 非法 / 非对象），不做任何静默伪造：
 * 任何一条不合格即整条剔除，绝不臆造 src 或时长。
 * 返回空数组表示「配置不可用」⇒ 调用方回退 BG_VIDEOS。
 */
export function sanitizeBgQueue(raw: unknown): BgItem[] {
  const list: unknown = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : null;
  if (!list) return [];

  const out: BgItem[] = [];
  const seen = new Set<string>();
  for (const entry of list as unknown[]) {
    if (out.length >= MAX_QUEUE_ITEMS) break;
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as { id?: unknown; src?: unknown; holdMs?: unknown; type?: unknown };
    if (!isUsableSrc(e.src)) continue;
    const src = (e.src as string).trim();
    let id = typeof e.id === 'string' && e.id.trim().length > 0 ? e.id.trim() : `bg-${out.length + 1}`;
    if (seen.has(id)) id = `${id}-${out.length + 1}`;
    seen.add(id);
    out.push({
      id,
      src,
      holdMs: resolveHoldMs({ id, src, holdMs: e.holdMs as number, type: 'ambient' }),
      type: isBgItemType(e.type) ? e.type : 'ambient',
    });
  }
  return out;
}
