/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KindredSouls / Soul OS Embodied Intelligence Open Protocol
 * © 2026 KindredSouls. All rights reserved.
 * PATENT-PENDING —— 双母 PCT 国际专利（SwissEph 物理真值锁 + 反向相位拟合）
 * 本文件为专利实施例（Embodiment）证据链组成部分，供授权合作方按许可范围使用。
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 🌌 embodied_gateway.js —— 具身设备网关层（Device-Agnostic · 零依赖）
 *
 * E36 立（军师《Soul OS 具身决策与 Agent 执行中枢预留战备号令》2026-10-09）：
 *   ① 具身路由注册表唯一真源 `EMBODIED_ROUTES`（server.js 与第 16 道闸门同源引用）；
 *   ② Agent 执行协议槽位 `AGENT_INTENT_RESERVED`（生活执行「手脚」，本期 inert）；
 *   ③ 语音双模态协议槽位 `VOICE_STREAM_META_RESERVED`（声线 + 情感语调 + 嘴型音素时间轴）。
 *
 * 🔴 三条不可动摇的纪律：
 *   ① **零依赖**：不 import 任何业务线私有模块（财富线 / 合婚线 / 前端），
 *      保证本目录可作为独立 SDK（npm package / git submodule）对外分发。
 *   ② **零密钥**：电商 / 订餐 / 日程 / 支付凭据一律由 B 端服务方持有；
 *      本层只描述**意图**，绝不代理支付、绝不落任何密钥。
 *   ③ **零版本副本**：契约版本唯一真源仍是
 *      astro/familiar_engine.py ↔ server.js::SOUL_OS_PROTOCOL_VERSION ↔ docs/SOUL_OS_OPEN_SPEC.md。
 *      此处再写一份 = 第四条版本线 = 漂移风险，故**刻意不定义**。
 *
 * 「巨头做手脚，我们做脑核」——手脚谁都能装，信任只有真值能给。
 * 故本层任何动作默认 `action_type='none'`，且**必须经用户显式确认**方可执行。
 */

/** 协议标识（对外声明用；**非**版本号） */
export const EMBODIED_PROTOCOL_ID = 'KindredSouls/SoulOS-Embodied-Open-Protocol';

// ═══════════════════════════════════════════════════════════════
// 一、Agent 执行协议（Tool / Function Calling 槽位）
// ═══════════════════════════════════════════════════════════════

/** 执行动作类型**闭集**：越界一律 fail-closed 降级为 'none'（不猜、不执行） */
export const AGENT_ACTION_TYPES = Object.freeze([
  'none',                // 无动作（默认 · 安全态）
  'lifestyle_reserve',   // 生活预订（餐厅 / 座位 / 场馆）
  'calendar_schedule',   // 日程编排（会议 / 提醒 / 出行）
  'commerce_order',      // 商品下单（须二次确认 + 支付网关托管）
]);

/** 执行服务标识**闭集**（仅描述「服务类型」，不含任何凭据 / 端点 / 密钥） */
export const AGENT_ACTION_SERVICES = Object.freeze([
  'opentable',   // 餐厅预订
  'flight',      // 航班 / 出行
  'shopify',     // 商品下单
]);

/** 执行意图冻结契约（本期 inert · 设备中立） */
export const AGENT_INTENT_RESERVED = Object.freeze({
  action_type: 'none',
  action_payload: Object.freeze({
    service: null,            // 服务类型（闭集内；缺省 null）
    reasoning_astral: null,   // 🔴 星历决策依据（人话，如「金星相位极佳且火星避险」）
    target_params: Object.freeze({}),
  }),
  requires_user_confirmation: true,
});

/**
 * 构造 Agent 执行意图（唯一真源出口）。
 *
 * 🔴 两条硬约束，构造器**强制覆写**，任何调用方都无法绕过：
 *   ① `requires_user_confirmation` **恒为 true** —— 即便调用方显式传 false 也会被改回 true。
 *      依据军师战略：「用户的信任只给懂他命运的灵魂」，AI 绝不能自主花用户的钱。
 *   ② `action_type` 越界（不在闭集内）⇒ fail-closed 降级为 'none'；
 *      `action_payload.service` 越界 ⇒ 置 null。**绝不猜测、绝不透传未知值**。
 *
 * @param {object} [overrides] 可选覆盖（仅服务描述与星历依据；确认位不可覆盖）
 * @returns {{action_type: string, action_payload: object, requires_user_confirmation: boolean}}
 */
export function buildAgentIntentAction(overrides) {
  const o = (overrides && typeof overrides === 'object') ? overrides : {};
  const type = AGENT_ACTION_TYPES.includes(o.action_type) ? o.action_type : 'none';

  const rawPayload = (o.action_payload && typeof o.action_payload === 'object') ? o.action_payload : {};
  const service = AGENT_ACTION_SERVICES.includes(rawPayload.service) ? rawPayload.service : null;
  const reasoning = typeof rawPayload.reasoning_astral === 'string' && rawPayload.reasoning_astral.trim()
    ? rawPayload.reasoning_astral
    : null;
  const targetParams = (rawPayload.target_params && typeof rawPayload.target_params === 'object')
    ? Object.assign({}, rawPayload.target_params)
    : {};

  return {
    action_type: type,
    action_payload: {
      service,
      reasoning_astral: reasoning,
      target_params: targetParams,
    },
    requires_user_confirmation: true,   // 🔴 恒 true（构造器强制；见上方铁律 ①）
  };
}

// ═══════════════════════════════════════════════════════════════
// 二、语音双模态协议（TTS 声线 + Lip-Sync 音素时间轴槽位）
// ═══════════════════════════════════════════════════════════════

/** 情感语调闭集（与 astro/familiar_engine.py::RELATION_VOICE_MATRIX 的 emotional_tone 同值域） */
export const VOICE_EMOTIONAL_TONES = Object.freeze([
  'caring',          // 温润治愈 —— Sophia · 女友形态
  'energetic',       // 阳光干劲 —— Milo · 铁哥们儿形态
  'deep_affection',  // 深情宠爱 —— Milo · 帅气男友形态
  'witty',           // 灵动俏皮 —— Sophia · 女闺蜜形态
]);

/** 语音流元数据冻结契约（本期 inert · 设备中立） */
export const VOICE_STREAM_META_RESERVED = Object.freeze({
  voice_id: null,         // 声线 ID（由 relation_mode 确定性映射，本期 inert）
  emotional_tone: null,   // 情感语调（闭集内；本期 inert）
  viseme_timeline: null,  // 🔴 嘴型音素时间轴（前端 Spine 2D 骨骼张合驱动槽 · 无音频 ⇒ null）
});

/**
 * 构造语音流元数据。
 *
 * 🔴 本层**不合成音频**、**不持有 TTS 凭据**：声线由中枢按 `relation_mode` 确定性映射，
 *    音频与音素时间轴由前端渲染层（`web/src/components/FamiliarOverlay.tsx`）承接。
 *    越界值一律 fail-closed 置 null。
 *
 * @param {object} [overrides]
 * @returns {{voice_id: (string|null), emotional_tone: (string|null), viseme_timeline: (Array|null)}}
 */
export function buildVoiceStreamMeta(overrides) {
  const o = (overrides && typeof overrides === 'object') ? overrides : {};
  const voiceId = (typeof o.voice_id === 'string' && o.voice_id.trim()) ? o.voice_id : null;
  const tone = VOICE_EMOTIONAL_TONES.includes(o.emotional_tone) ? o.emotional_tone : null;
  const viseme = Array.isArray(o.viseme_timeline) ? o.viseme_timeline : null;
  return { voice_id: voiceId, emotional_tone: tone, viseme_timeline: viseme };
}

// ═══════════════════════════════════════════════════════════════
// 三、具身路由注册表（唯一真源 · server.js 只做薄胶水）
// ═══════════════════════════════════════════════════════════════

/**
 * 具身协议路由注册表。
 * 🔴 `server.js` 的 `app.get/post(...)` 注册串必须与本表**逐条同源**；
 *    第 16 道闸门（test/audit-e36-soul-os-agent-protocol.test.mjs）逐条比对。
 */
export const EMBODIED_ROUTES = Object.freeze([
  Object.freeze({
    endpoint: 'embodied.persona', method: 'get', path: '/api/v1/embodied/persona',
    capability: 'persona_load', desc: '人格与语气装载（设备绑定用户后拉取灵宠形态与关系人格）',
  }),
  Object.freeze({
    endpoint: 'embodied.perception-sync', method: 'post', path: '/api/v1/embodied/perception-sync',
    capability: 'perception_intake', desc: '多模态感知上报（标签 → 隐式强化学习输入）',
  }),
  Object.freeze({
    endpoint: 'embodied.action-intent', method: 'get', path: '/api/v1/embodied/action-intent',
    capability: 'motion_drive', desc: '肢体与微表情驱动指令（动作意图码联动机械臂/表情）',
  }),
  Object.freeze({
    endpoint: 'embodied.memory-stream', method: 'post', path: '/api/v1/embodied/memory-stream',
    capability: 'memory_sync', desc: '具身记忆双向同步（source=embodied_device）',
  }),
]);

/**
 * 具身端点出参装配：把网关层的两个新槽位注入既有 Soul OS 出参骨架。
 *
 * 用法（server.js，handler 首行门控**保持不动**，仅第 3 行委托）：
 *   `res.json(buildSoulOsReserved(embodiedReservedExtras('embodied.persona')))`
 *
 * @param {string} endpoint 端点标识（取自 EMBODIED_ROUTES[].endpoint）
 * @returns {{endpoint: string, action_intent: object, voice_stream_meta: object}}
 */
export function embodiedReservedExtras(endpoint) {
  return {
    endpoint: String(endpoint || ''),
    action_intent: buildAgentIntentAction(),
    voice_stream_meta: buildVoiceStreamMeta(),
  };
}
