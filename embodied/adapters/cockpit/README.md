# 🚗 adapters/cockpit —— 智能座舱适配槽（车载 NOMI 模式）

> **KindredSouls / Soul OS Embodied Intelligence Open Protocol**
> © 2026 KindredSouls. All rights reserved.
> **PATENT-PENDING** —— 双母 PCT 国际专利实施例证据链组成部分，供授权合作方按许可范围使用。

---

## 一、场景定位

车主双手在方向盘上，只能双向**语音**交互 —— 座舱是「灵宠具身化」最高频、最高粘性的入口。

| 维度 | 座舱形态 |
|---|---|
| 交互通道 | 实时双向语音（打断 / 自然停顿 / 语气词） |
| 呈现形态 | 中控 3D 悬浮 Soulmate（后续可上车机 HUD 角落轻量态） |
| 关系人格 | Sophia（柔情疏导 · 情绪舒缓） / Milo（硬核决策 · 事业点拨） |
| 真值输入 | 车主本命盘 + 当日行运盘（Transit） |

## 二、契约落点（复用，不新增协议）

| 槽位 | 来源 | 用途 |
|---|---|---|
| `voice_stream_meta.voice_id` | `embodied/core/embodied_gateway.js` | 专属声线（Sophia / Milo） |
| `voice_stream_meta.emotional_tone` | 同上（闭集） | 语调随行运与语义起伏 |
| `display_palette` | `relation.palette`（同源） | 氛围灯 / 仪表配色 |
| `action_intent` | 同上（封仓期 `none`） | 导航 / 日程 / 充电预约意图（**须用户确认**） |
| `motion_intent` | 同上（封仓期 `null`） | 中控形象动作码 |

## 三、隔离守则

1. 🔴 本目录**只放适配映射**（intent 码 → 车机指令），**不放**任何车厂 CAN 报文解析、车型私有协议或车厂凭据。
2. 🔴 严禁反向 `import` 站内业务线（财富线 / 合婚线 / 前端）。
3. 🔴 车机侧**只读**中枢下发的 intent / palette，不得自行改值。

## 四、状态

**预留槽（未实现）**。待与车厂完成协议对接评审后，在 `adapter.js` 内落地映射表。
