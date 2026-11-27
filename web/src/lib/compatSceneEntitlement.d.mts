/** 🤝 E159-刀一：三场景权益纯逻辑核（与 compatSceneEntitlement.mjs 同步；storage 由调用方注入） */
export interface KVLike { getItem(key: string): string | null; setItem(key: string, v: string): void; removeItem(key: string): void; }
export type PairScene = 'romance' | 'business' | 'friendship';
export const COMPAT_SCENES: readonly PairScene[];
export function normalizePairScene(raw: unknown): PairScene;
export const ROMANCE_UNLOCK_KEY: string;
export const SESSION_SCENES_KEY: string;
export const PURCHASE_SCENE_KEY: string;
export const ARCHIVE_SLOT_PREFIX: string;
export const COMPAT_SCENE_PLAN_LISTS: { readonly monthly: string; readonly yearly: string };
export function readSessionScenes(store: KVLike | null | undefined): string[];
export function sessionSceneUnlocked(store: KVLike | null | undefined, scene: string): boolean;
export function markSessionSceneUnlocked(store: KVLike | null | undefined, scene: string): boolean;
export function clearSessionScenes(store: KVLike | null | undefined): void;
export function rememberPurchaseScene(store: KVLike | null | undefined, scene: string): void;
export function readPurchaseScene(store: KVLike | null | undefined): PairScene | null;
export function sceneArchiveKey(scene: string): string;
export function readSceneArchive(store: KVLike | null | undefined, scene: string): { scene?: string; monthly?: string; yearly?: string; last?: string } | null;
export function writeSceneArchive(store: KVLike | null | undefined, a: { scene: string; monthly?: string; yearly?: string; last: string }): boolean;
export function allPassActive(plans: any, now?: Date | number): boolean;
export function compatEntitlementKey(sig: string, scene: string): string;
export function scenePlanListed(plans: any, listKey: string, scene: string): boolean;
export function accountSceneEntitled(plans: any, kind: 'once' | 'monthly' | 'yearly', scene: string, ctx?: { comboSig?: string; now?: Date }): boolean;
