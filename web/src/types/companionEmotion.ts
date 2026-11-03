/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏆 E120（主公军令 2026-11-03 刀一）：灵宠五维情绪与破冰密函强类型契约
 * ═══════════════════════════════════════════════════════════════════════════
 * 军令锚（E120-AMULET）：0525 文档「心情打卡 → 灵宠气象共鸣站」逆向收编——
 * 五维情绪天象罗盘（MoodArchetype）＋四类单向破冰密函（AmuletType）。
 * 纯类型契约（零运行时代码）——运行时真值见：
 *   · web/src/lib/companionMoodData.mjs（五维情绪六语归因数据＋语调铁律守卫）
 *   · web/src/lib/amuletTemplates.mjs（24 套六语密函模板）
 *   · web/src/lib/amuletCanvasRenderer.mjs（1080×1748 离屏 Canvas 引擎）
 *   · web/src/lib/companionScribeTrigger.mjs（对话僵局意图识别器）
 *   · web/src/lib/starlightLedger.mjs（灵犀星原子账本 DAILY_PULSE）
 * 🔴 语调铁律（0525 原文 2.2）：每条抚慰必须积极正面收尾＋具体微小行动闭环；
 *    严禁「相克/倒霉/灾祸」等消极恐慌结论（toneGuard 守卫）。
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** 五维情绪原型（五行微光徽章） */
export type MoodArchetype = 'radiant' | 'longing' | 'melancholy' | 'agitated' | 'grateful';

/** 四类破冰密函（0525 原案 3.2 互动卡片逆向收编——单向外溢，不做双人站内推送） */
export type AmuletType = 'apology' | 'longing' | 'support' | 'weather';

/** 官方六语（Soul OS 语言底座锁死） */
export type SupportedLocale = 'zh' | 'en' | 'fr' | 'es' | 'th' | 'vi';

/** 罗盘情绪徽章配置（五行元素＋六语标签） */
export interface MoodOptionConfig {
  archetype: MoodArchetype;
  element: 'fire' | 'water' | 'metal' | 'wood' | 'earth';
  icon: string;
  label: Record<string, string>;
  description: Record<string, string>;
}

/** 天象归因（灵宠抚慰——严格遵守正面语调铁律） */
export interface AstroMoodAttribution {
  transitSummary: string;
  energyAspect: string;
  companionComfort: string;
  actionableAdvice: string;
}

/** 破冰密函卡面配置（离屏 Canvas 渲染入参） */
export interface IcebreakerAmuletConfig {
  id: string;
  type: AmuletType;
  hostName: string;
  partnerName?: string;
  bestTimingWindow: string;
  coreProse: string;
  tarotCardName: string;
  tarotCardPosition: 'upright' | 'reversed';
  officialDomain: string;
}

/** 密函模板内容（24 套六语静态资产——amuletTemplates.mjs 真源） */
export interface AmuletTemplateContent {
  title: string;
  subtitle: string;
  prose: string;
  companionWhisper: string;
  bestWindowPrefix: string;
  tarotCard: string;
  tarotNumber: string;
  defaultTiming: string;
}

/** 灵犀星原子入账交易（DAILY_PULSE——单日打卡幂等） */
export interface StarlightTransaction {
  type: 'DAILY_PULSE';
  delta: 1;
  balance: number;
  date: string;
}

/** 灵犀星账本形状（localStorage.ks_starlight_count {count, day}——E111 真源沿用） */
export interface StarlightLedger {
  count: number;
  day: string;
}
