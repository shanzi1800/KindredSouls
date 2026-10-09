/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KindredSouls / Soul OS Embodied Intelligence Open Protocol
 * © 2026 KindredSouls. All rights reserved.
 * PATENT-PENDING —— 双母 PCT 国际专利（SwissEph 物理真值锁 + 反向相位拟合）
 * 本文件为专利实施例（Embodiment）证据链组成部分，供授权合作方按许可范围使用。
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🧭 intent_translator.js —— 星历 / 运势决策 ➜ 具身动作意图转换器
 *
 * 定位（军师 E36 号令 · 专利级「真值驱动决策」）：
 *   巨头的动漫小人能下单订餐，靠的是通用大模型的**概率**；我们的灵宠要长出「执行手脚」，
 *   但每一步都必须由**星历真值决策**驱动 —— 金星相位极佳且火星避险，才推荐静谧低刺激餐厅。
 *
 * 🔴 本批（E36）**恒 inert**。真实映射的准入条件（缺一不可）：
 *     ① `profile.decision_operators` 存在（来自引擎唯一真源，真值锁就位）；
 *     ② 目标动作经 B 端服务方授权（凭据由服务方持有，本层零密钥）；
 *     ③ 用户显式确认（`requires_user_confirmation` 恒 true，前端二次弹窗）。
 *
 * 🔴 唯一真源纪律：四象决策算子权重表**只存在于**
 *    `astro/familiar_engine.py::RELATION_DECISION_OPERATORS`。
 *    本层**只读消费**，绝不复制第二份权重表（复制 = 漂移 = 专利实施例被污染）。
 */

import { buildAgentIntentAction } from './embodied_gateway.js';

/**
 * 读取引擎给出的四象决策算子（**只读回显，零副作用**）。
 *
 * @param {object} profile `astro/familiar_engine.py` 的 CLI 出参
 * @returns {object|null} 决策算子对象；无真值 ⇒ 显式 `null`（绝不伪造）
 */
export function readDecisionOperators(profile) {
  if (!profile || typeof profile !== 'object') return null;
  const ops = profile.decision_operators;
  if (!ops || typeof ops !== 'object' || Array.isArray(ops)) return null;
  return ops;
}

/**
 * 星历决策 ➜ Agent 执行意图。
 *
 * 🔴 E36 封仓期：**恒返回安全 inert**（`action_type='none'` + 确认位恒 true）。
 *    绝不因为"用户已经买了 $4.99 报告"就自动执行任何消费动作。
 *
 * @param {object} _profile 引擎出参（本期不参与运算）
 * @param {object} [_opts] 预留（用户确认凭据 / 服务方授权凭据 —— 均不在本层）
 * @returns {{action_type: string, action_payload: object, requires_user_confirmation: boolean}}
 */
export function translateAstralIntent(_profile, _opts) {
  return buildAgentIntentAction();
}

/**
 * 决策依据的可读化（仅用于调试 / 日志回显，**不产生任何动作**）。
 *
 * @param {object} profile 引擎出参
 * @returns {string|null} 如 '情感互补 · 主因子 [venus, mars, moon] · 重点宫位 [7]'
 */
export function describeAstralReasoning(profile) {
  const ops = readDecisionOperators(profile);
  if (!ops) return null;
  const factors = Array.isArray(ops.primary_factors) ? ops.primary_factors.join(', ') : '';
  const houses = Array.isArray(ops.emphasis_houses) ? ops.emphasis_houses.join(', ') : '';
  const tone = typeof ops.intent_zh === 'string' ? ops.intent_zh : '';
  if (!factors && !houses && !tone) return null;
  return `${tone || '未命名算子'} · 主因子 [${factors}] · 重点宫位 [${houses}]`;
}
