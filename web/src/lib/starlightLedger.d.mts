/** E120 灵犀星原子账本类型声明（starlightLedger.mjs） */
export interface StarlightLedgerShape { count: number; day: string; }
export interface StarlightTransactionShape {
  type: 'DAILY_PULSE';
  delta: 1;
  balance: number;
  date: string;
}
export const STARLIGHT_STORAGE_KEY: string;
export function claimDailyStarlight(
  ledger: StarlightLedgerShape | null | undefined,
  todayDateStr: string
): { granted: boolean; ledger: StarlightLedgerShape; transaction: StarlightTransactionShape | null };
export function normalizeLedger(raw: unknown): StarlightLedgerShape;
export function readStarlightStore(store?: { getItem(k: string): string | null }): StarlightLedgerShape;
export function writeStarlightStore(store: { setItem(k: string, v: string): void } | undefined, ledger: StarlightLedgerShape): boolean;
