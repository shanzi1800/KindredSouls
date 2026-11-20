/** E148-刀二 compatComboSig.mjs 类型声明（tsc 消费面） */
export const COMPAT_COMBO_SIG_MAX: number;

export type CityLike = { lat?: number | string; lon?: number | string; tz?: string } | null | undefined;

export function compatPersonBlock(birthDate: unknown, birthTime: unknown, lat: unknown, lon: unknown, tz: unknown): string;
export function compatComboSigOf(
  d1: unknown, d2: unknown, t1: unknown, t2: unknown, c1: CityLike, c2: CityLike,
): string;
export function normalizeCompatComboSig(raw: unknown): string;
export function compatOnceComboListed(paidPlans: unknown, comboSig: string): boolean;
export function compatComboSigFromSearch(search: string): string;
