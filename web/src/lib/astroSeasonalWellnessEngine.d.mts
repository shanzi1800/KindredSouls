/** E137 星盘×时令健康正能量处方引擎类型声明（astroSeasonalWellnessEngine.mjs） */
export const WELLNESS_RX_LOCALES: readonly string[];
export const WELLNESS_ELEMENTS: readonly string[];
export const WELLNESS_SEASON_MODES: readonly string[];
export const WELLNESS_RX_CATEGORIES: readonly string[];
export const WELLNESS_AFFILIATE_TIERS: readonly string[];
export const WELLNESS_TEMPLATE_COUNT: number;
/** chatQ3 六语钦定文本（军令触发锚——与 locales familiar.chatQ3 逐字同源） */
export const WELLNESS_CHATQ3_TEXTS: readonly string[];
/** 核心天然成分六语词典（ingredientsKey 真源） */
export const RX_INGREDIENTS: Readonly<Record<string, Readonly<Record<string, string>>>>;
/** 供应链软植入槽（/go/:remedyId 路由白名单唯一真源；sponsorBrand 恒 null） */
export const WELLNESS_SUPPLY_SLOTS: readonly {
  readonly remedyId: string;
  readonly category: string;
  readonly ingredientsKey: string;
  readonly redirectSlug: string;
  readonly affiliateTier: string;
  readonly sponsorBrand: string | null;
}[];
export function resolveHemisphere(geoZone: string | null | undefined): 'north' | 'south';
export function resolveSeasonMode(
  timestamp: number | string | Date | null | undefined,
  hemisphere: 'north' | 'south'
): { month: number; season: string; mode: string };
/** 星盘元素推导（natal 五星英文星座名 → 四元素众数；空/坏形状 ⇒ balanced） */
export function deriveDominantElement(natalSigns: string[] | null | undefined): string;
/** 触发检测（chatQ3 六语钦定文本＋养生语义六语白名单） */
export function detectWellnessTrigger(text: string): boolean;
/** 四维处方行（prescription＝按 lang 取出的当语文案；ingredients＝成分行当语） */
export interface WellnessRxDimensionRow {
  category: string;
  remedyId: string;
  ingredientsKey: string;
  prescription: string;
  ingredients: string;
}
export interface WellnessRxResult {
  ok: boolean;
  hemisphere: 'north' | 'south';
  geoZone: string | null;
  month: number;
  season: string;
  seasonName: string;
  mode: string;
  termLabel: string;
  dominantElement: string;
  skyEvent: string | null;
  rx: {
    functional_elixir: WellnessRxDimensionRow;
    aura_scent: WellnessRxDimensionRow;
    mindful_movement: WellnessRxDimensionRow;
    seasonal_outing: WellnessRxDimensionRow;
    skyNote?: string;
  };
  supplyChainMeta: {
    remedyId: string;
    category: string;
    ingredientsKey: string;
    redirectSlug: string;
    affiliateTier: string;
    sponsorBrand: string | null;
  }[];
}
/** 主入口：星盘×时令能量处方（纯函数——零网络零 LLM 零臆造） */
export function resolveAstroSeasonalWellnessRx(input: {
  chartSignature?: { dominantElement?: string; weakElement?: string; skyEvent?: string };
  timestamp?: number | string | Date;
  geoZone?: string | null;
  lang?: string;
} | null | undefined): WellnessRxResult;

/* ═══ E137.1-RX-MONOGRAPH-DRAWER（手札数据层声明）═══ */
/** 四类「顺时调频仪式与配比」六语单源（手札仪式区块） */
export const RX_RITUAL_GUIDES: Readonly<Record<'elixir' | 'scent' | 'movement' | 'outing', Readonly<Record<'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi', string>>>>;
/** 伴侣追问句六语模板（{ingredients} 占位） */
export const RX_ASK_TEMPLATES: Readonly<Record<'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi', string>>;
/** 手札白名单查询（?rx= 承接唯一真源；未命中 null fail-closed） */
export interface WellnessRemedyMonograph {
  remedyId: string;
  category: string;
  element: string | null;
  seasonKey: string | null;
  ingredients: string;
  prescription: string;
  ritualGuide: string;
  askTemplate: string;
  affiliateTier: string;
  sponsorBrand: string | null;
}
export function getWellnessRemedyById(remedyId: string | null | undefined, lang?: string): WellnessRemedyMonograph | null;
