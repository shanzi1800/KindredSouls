/** E139 星盘财商智库与破财避坑引擎类型声明（astroWealthAdvisoryEngine.mjs） */
export const WEALTH_RX_LOCALES: readonly string[];
export const WEALTH_LIFE_STAGES: readonly string[];
export const WEALTH_PILLARS: readonly string[];
export const WEALTH_ELEMENTS: readonly string[];
export const WEALTH_TEMPLATE_COUNT: number;
/** chatQ1 六语钦定文本（军令触发锚——与 locales familiar.chatQ1 逐字同源） */
export const WEALTH_CHATQ1_TEXTS: readonly string[];
/** 灵宠真名追问句六语模板（{name} 占位——组件手动 replace） */
export const WEALTH_ASK_TEMPLATES: Readonly<Record<'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi', string>>;
/** 人生五阶分类器（显式年龄；null/坏形状 ⇒ 默认筑基三明治期） */
export function classifyWealthLifeStage(age: number | null | undefined): string;
/** 财富意图触发检测（chatQ1 六语钦定文本＋财富语义六语白名单） */
export function detectWealthIntent(text: string): boolean;
/** 本命元素众数解析（多形状兼容 fail-closed ⇒ balanced 兜底） */
export function deriveWealthDominantElement(
  chartSummary: unknown,
  deriveDominantElementFn?: (signs: string[]) => string
): string;
/** 四维处方行（prescription＝按 locale 取出的当语文案） */
export interface WealthRxDimensionRow {
  category: string;
  prescription: string;
}
export interface WealthPrescriptionResult {
  ok: boolean;
  lang: string;
  stageKey: string;
  stageName: string;
  age: number | null;
  ageSource: 'birth' | 'explicit' | 'default';
  dominantElement: string;
  rx: {
    cashflow_stage: WealthRxDimensionRow;
    asset_spectrum: WealthRxDimensionRow;
    credit_leverage: WealthRxDimensionRow;
    cut_and_legacy: WealthRxDimensionRow;
  };
}
/** 主入口：星盘财商处方（纯函数——零网络零 LLM 零臆造） */
export function computeAstroWealthPrescription(input: {
  birthData?: string | { date?: string; year?: number } | number | null;
  chartSummary?: unknown;
  age?: number | null;
  locale?: string;
  lang?: string;
  queryText?: string;
} | null | undefined): WealthPrescriptionResult;
/** prompt 注入块（server 端 buildFamiliarChatSystemPrompt 消费；无效 ⇒ null） */
export function buildWealthSystemPromptBlock(
  prescription: WealthPrescriptionResult | null | undefined,
  locale?: string
): string | null;
