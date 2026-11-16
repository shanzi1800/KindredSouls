/** E142 paywallPriceContract.mjs 类型声明（tsc 消费面） */
export const PAYWALL_PRICE_CONTRACT: Readonly<Record<string, number>>;
export function priceLabel(plan: string, lang: string): string | null;
export function wealthReportButtonLabel(plan: string, lang: string, unlocked: boolean): string | null;
export function vipUnlockedHintLabel(lang: string): string;
