/** E147 tsc 声明（E146 astralFourFoldRecEngine.d.mts 同形制）——纯 JS 逻辑核形状 */
export declare const CHRONICLE_LOCALES: readonly string[];
export declare const L_CHRONICLE_TITLE: Readonly<Record<string, string>>;
export declare const L_CHRONICLE_STATE: {
  module: Readonly<Record<string, Readonly<Record<string, string>>>>;
  unlocked: Readonly<Record<string, string>>;
  locked: Readonly<Record<string, string>>;
  exportCta: Readonly<Record<string, string>>;
};
export declare const L_CHRONICLE_CHARGING: Readonly<Record<string, string>>;
export declare const CHRONICLE_RIPEN_DAYS: number;
export declare const CHRONICLE_MIN_TRAJECTORY: number;
export declare const CHRONICLE_STATE_KEY: string;
export declare function chronicleEntitlementFor(paidPlans: unknown): {
  romance: boolean;
  wealth: boolean;
  basis: string | null;
};
export declare function readChronicleState(ls: unknown): {
  anchorAt: string | null;
  sessions: number;
};
export declare function chronicleModuleGate(
  paidPlans: unknown,
  module: string,
  trajectoryCount?: number,
  nowMs?: number,
): {
  status: 'locked' | 'charging' | 'unlocked';
  entitled: boolean;
  unlockDateISO: string | null;
  trajectory: number;
  basis: string | null;
};
export declare function chronicleChargingLabel(
  lang: string,
  meta: { trajectory?: number; unlockDateISO?: string | null },
): string;
export declare function buildSoulChronicleHTML(data: {
  title?: string;
  lang?: string;
  companion?: string;
  sections?: Array<{ heading: string; lines: string[] }>;
}): string;
