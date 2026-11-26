// 🤝 E155-刀一 → E156 瘦身（主公军令 2026-11-25）：缘分密码 · 场景/语种归一化纯核
//   零网络 / 零子进程 / 零 LLM / 零 DOM ⇒ node --test 直测。
//   E156 起：三场景长在现有 /api/ai-advisor 黄金漏斗上 —— 订单/令牌/认领/邀请函链
//   整体退役，本文件只留场景白名单与语种归一（供 resonancePrompt.mjs 消费）。

export const RESONANCE_SCENES = Object.freeze(['romance', 'business', 'friendship']);
export const RESONANCE_LOCALES = Object.freeze(['zh', 'en', 'fr', 'es', 'th', 'vi']);

/** 场景归一：白名单外 ⇒ ''（调用方自行兜底情爱） */
export function normalizeScene(raw) {
  return RESONANCE_SCENES.indexOf(String(raw == null ? '' : raw)) !== -1 ? String(raw) : '';
}

/** 语种归一：zh-CN ⇒ zh；白名单外 ⇒ '' */
export function normalizeResonanceLocale(raw) {
  const v = String(raw == null ? '' : raw).toLowerCase().split('-')[0];
  return RESONANCE_LOCALES.indexOf(v) !== -1 ? v : '';
}
