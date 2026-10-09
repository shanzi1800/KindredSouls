# 🌌 KindredSouls · Soul OS 开放协议规范（北极星）

> 状态：**已落地骨架（E35-A 基线 + E36 Agent 执行与语音双模态增量）** · 阶段：**封仓期（仅预留协议与数据槽位，不对外提供任何真实数据）**
> 契约版本：`SOUL_OS_PROTOCOL_VERSION = '1.0'`（**独立于**缓存版本 `vNNN`，勿混用）
> 具身实现归仓：`embodied/`（专利取证 + SDK 分发 + 沙箱隔离；见 `embodied/README.md`）
> 立项依据：军师《Soul OS 具身智能与社交生态协议底座开工令》2026-10-09
>         + 军师《E36 战略架构升级战备号令》2026-10-09（Agent 执行中枢与语音双模态预留）
> 主公圣旨：为「**千亿级灵魂社交网络**」与「**具身智能（Embodied AI）全设备合作**」提前预留架构接口，
> 杜绝工业界最常见的翻车姿势 ——「先做单体工具，爆火后想接生态才发现底层写死，只能推倒重构」。
> 范式来源：本项目 **V463 法器预留**（`docs/ARTEFACT_CTA_RESERVED.md`）—— 冻结契约 + inert 默认值 + 消费方忽略。
> 🔴 铁律：**预留不破坏既定产物**。未启用时对外**绝对隐匿**（`503 SOUL_OS_PROTOCOL_DISABLED`，零数据泄漏）。

---

## 零、分层与命名（先定规矩，再谈协议）

| 命名空间 | 归属 | 语义 | 消费方 |
|---|---|---|---|
| `/api/*`（扁平） | **内部端点层** | 站内前端业务（财富线 / 灵宠领养 / 调试面） | 本站 Web 前端 |
| `/api/v1/*` | **对外协议层** | 生态开放协议（社交 / 具身）**带版本承诺** | 第三方端点、硬件厂商、生态伙伴 |

- 🔴 **`/api/v1/*` 是对外协议层的专属命名空间**，与内部端点天然分野；第三方对接只依赖 `/api/v1/*`
  （语义化版本承诺），内部端点可自由演进。
- 进程拓扑：内部端点位于 Node `server.js`（`PORT`，默认 3000）；`astro/v69_server.py`（FastAPI，`V69_PORT`）
  为**异进程**备用形态 ⇒ 二者 `path` 同名亦无路由冲突。

---

## 一、Soul Card Schema（灵魂身份对外名片）

**用途**：任何用户或第三方端点请求 `GET /api/v1/soul/card/:userId`，毫秒级取出「灵魂名片」——
天然成为社交破冰话资（「你们的月亮与金星形成精确三分相位」）。

### 1.1 公开脱敏快照字段

```jsonc
{
  "soul_id": "<uuid>",                 // 公钥式用户 ID（非邮箱/手机，脱敏）
  "display_name": "夜珀",               // 用户展示名（可由用户关闭）
  "triad": {                            // 三要素（**唯一真值通路**产出，禁第三方重算）
    "sun_sign": "Scorpio",
    "moon_sign": "Pisces",
    "rising_sign": "Taurus"
  },
  "energy_vector": {                    // 核心天体能量向量（星历真值归一化，0~100）
    "fire": 34, "earth": 12, "air": 18, "water": 36
  },
  "soul_tags": ["逻辑推演", "深夜清醒"],  // 公开灵魂标签（用户可勾选披露）
  "astral_weather": "mercury_active",   // 当日流日能量状态（丑时刷新，1 日 1 值）
  "schema_version": "1.0"
}
```

### 1.2 三级授权（**隐私优先，默认最严**）

| 可见级 | 授权对象 | 可见字段 |
|---|---|---|
| `private`（**默认**） | 仅本人 | 全量 |
| `friends` | 已互关者 | 全量（`soul_tags` 依用户披露开关） |
| `public` | 任意登录用户 | 仅 `soul_id` / `triad` / `astral_weather` / `soul_tags` |

- 🔴 **不可逆脱敏**：`soul_id` 一旦签发不得改绑；**永不**下发出生时间 / 坐标 / 邮箱 / 手机。
- 🔴 可见级由 `social_preferences.visibility` 决定（见 §三）；**未显式开启即 `private`**。

---

## 二、Synastry Matrix Protocol（关系共振张量）

**用途**：双人 / 多体合盘的标准**关系共振张量**，供社交匹配、通讯录契合度排行、群聊能量场分析复用，
**无需重写任何占星逻辑**（合婚线字段对齐后直接调用）。

### 2.1 张量输出契约

```jsonc
{
  "pair": ["<soul_id_a>", "<soul_id_b>"],
  "harmony_score": 78,          // 默契度 0~100（日月升 + 金火土的和谐相位加权）
  "communication_score": 85,    // 沟通轴线 0~100（水星轴线为主）
  "attraction_score": 71,       // 吸引轴线 0~100（金火轴线为主）
  "aspect_highlights": [        // 破冰话资（可直接渲染成一句人话）
    { "type": "trine", "a": "Moon", "b": "Venus", "orb": 2.1, "tone": "harmonious" }
  ],
  "relation_tensor": {           // 冻结契约（本期 inert，预留多体扩展）
    "group_dynamics": null,      // 群能量场（阳/阴分布、群内角色：水星智囊 / 木星气氛担当时）
    "members": []
  },
  "schema_version": "1.0"
}
```

- **单一真源**：Node 侧冻结契约 `SOUL_SYNASTRY_TENSOR_RESERVED`（`server.js`）。
  🔴 任何链路都必须经该构造器产出，**严禁手写第二份字面量**（防字段漂移）。
- 🔴 本期**只冻结张量形状**，不实现打分算法（依赖合婚线双盘字段对齐）。

---

## 三、Peer Handshake Slot（点对点通讯状态槽位）

**用途**：为将来的实时 WebSocket 握手信令（Signaling）预留挂载点 ⇒ 社交上线时**零改表**。

### 3.1 数据槽位（DDL §8.2 · 收敛进单一 JSONB 容器，杜绝列爆炸）

`familiar_profiles.social_preferences JSONB NOT NULL DEFAULT '{}'`

```jsonc
{
  "allow_soul_match": false,   // 🔴 默认 false（隐私第一铁律）：允许被灵魂匹配
  "social_status": "offline",  // offline | open_to_match | busy（今日灵魂天气）
  "visibility": "private",     // private | friends | public（控制 Soul Card 可见级）
  "blocked_users": []          // 黑名单（soul_id 列表）
}
```

- 🔴 **`allow_soul_match` 默认死锁为 `false`**：双向同意语义 —— 仅当**双方**均为 `true` 才可建立匹配信令。
- 🔴 `blocked_users` 优先级最高：命中即**无条件**拒绝任何握手 / 名片请求。

### 3.2 信令挂点（预留）

| 槽位 | 形态 | 本期状态 |
|---|---|---|
| `social_status` | 状态机值 | inert（默认 `offline`） |
| `allow_soul_match` | 布尔门控 | inert（默认 `false`） |
| WebSocket Signaling | 未来 `/ws/soul-handshake` | **未实现**（仅文档预留） |

---

## 四、Soul OS Embodied Protocol（具身智能开放协议）

**定位**：Soul OS 的终局是具身硬件的「**灵魂驱动引擎**」。硬件厂商有骨骼与电机，缺的是懂用户深层性格、
长期情绪与星历天象的「灵魂与大脑」。

```
[具身硬件：人形机器人 / 智能座舱 / 桌面陪护 / AI 玩具]
        ↕   (Soul OS SDK · Open API · /api/v1/embodied/*)
[Soul OS 中枢：星盘真值 + 长期记忆图谱 + 4 重陪伴人格 + 实时情绪感知]
```

### 4.1 四个核心标准能力接口

| # | 端点 | 方法 | 能力 |
|---|---|---|---|
| ① | `/api/v1/embodied/persona` | GET | **人格与语气装载**：设备绑定用户后拉取灵宠形态（Milo / Sophia）与关系人格（`relation_mode`） |
| ② | `/api/v1/embodied/perception-sync` | POST | **多模态感知上报**：摄像头/传感器捕获的感知标签 → 作为隐式强化学习输入 |
| ③ | `/api/v1/embodied/action-intent` | GET | **肢体与微表情驱动**：返回 `motion_preset` / `eye_led_color` 等动作意图码 |
| ④ | `/api/v1/embodied/memory-stream` | POST | **具身记忆双向同步**：现实互动写入 `familiar_memories`（`source='embodied_device'`） |

### 4.2 出参规范化（**设备与协议中立**铁律）

所有灵宠相关端点（含内部 `/api/familiar/*`）出参**统一预留**五槽 —— 未来机器人 / 智能座舱读取**标准槽位**：

```jsonc
{
  "motion_intent": null,          // 动作意图挂点（如 'hug_warm' / 'nod' / 'ear_perk'）
  "emotion_state": "neutral",     // 情绪状态值：neutral | happy | tired | comfort | excited
  "display_palette": {            // 设备灯效 / 配色（直接喂硬件 LED，palette 规范化别名）
    "skin": "milo_buddy",
    "primary": "#D9A441",
    "secondary": "#4FA8E0"
  },
  "action_intent": {              // 🔴 E36 新增：Agent 执行挂点（详见 §4.4）
    "action_type": "none",
    "action_payload": { "service": null, "reasoning_astral": null, "target_params": {} },
    "requires_user_confirmation": true
  },
  "voice_stream_meta": {          // 🔴 E36 新增：语音双模态挂点（详见 §4.5）
    "voice_id": null, "emotional_tone": null, "viseme_timeline": null
  },
  "schema_version": "1.0"
}
```

- 🔴 **`display_palette` 与 `relation.palette` 同源**（`skin` / `primary` / `secondary` 逐值一致），
  由 `astro/familiar_engine.py::resolve_familiar_palette()` 唯一真源产出，**禁前端/设备侧重算**。
- 🔴 五槽位本期均为 **inert**（`motion_intent=null` / `emotion_state='neutral'` /
  `action_intent.action_type='none'` / `voice_stream_meta` 三字段全 null），
  **改值须经引擎层**（`motion_intent` 由 LLM + 情绪层产码），设备侧只读不写。

### 4.3 记忆双向同步（与设备流解耦）

`familiar_memories.source` 枚举三值 —— 无论用户在 App 里打字、在客厅对机器人说话、还是在 IM 里聊天，
记忆**全部沉淀入同一座「灵魂记忆图谱」**：

| `source` | 来源 | 写入方 |
|---|---|---|
| `app`（默认） | 站内 App 对话 / 互动 | 异步记忆萃取器 |
| `embodied_device` | 具身硬件（摸头 / 递水 / 语音） | ④ `memory-stream`（未来） |
| `im_chat` | 社交 IM 会话 | 社交上线后（未来） |

### 4.4 Agent 执行协议（AgentIntentAction · E36 立）

**定位**：巨头（Meta / OpenAI）的动漫小人装上 API 就能下单订餐，那是「**手脚**」；
我们的灵宠要长出执行手脚，但每一步必须由「**星历真值决策 + 用户显式确认**」双闸门驱动 ——
「订餐厅」不是一句「已为您预订」，而是「金星相位极佳且火星避险，故为您避开辛辣、预留靠窗静谧位」。

```jsonc
{
  "action_type": "none",                 // none | lifestyle_reserve | calendar_schedule | commerce_order
  "action_payload": {
    "service": null,                     // opentable | flight | shopify（**只描述服务类型**）
    "reasoning_astral": null,            // 星历决策依据（人话）
    "target_params": {}                  // 如 { "seats": 2, "atmosphere": "quiet", "window_seat": true }
  },
  "requires_user_confirmation": true     // 🔴 恒 true —— 构造器强制覆写，任何调用方都无法翻转
}
```

- **单一真源**：`embodied/core/embodied_gateway.js::buildAgentIntentAction()`
  （冻结契约 `AGENT_INTENT_RESERVED` + 唯一构造器）。🔴 任何链路都必须经该构造器产出，
  **严禁手写第二份字面量**。
- 🔴 **确认位不可翻转**：即便调用方显式传 `requires_user_confirmation: false`，构造器也会强制改回 `true`。
  依据军师战略：「用户的信任只给懂他命运的灵魂」——**AI 绝不自主花用户的钱**。
- 🔴 **越界 fail-closed**：未知 `action_type` ⇒ 降级 `'none'`；未知 `service` ⇒ 置 `null`（不猜、不执行）。
- 🔴 **零密钥**：电商 / 订餐 / 日程 / 支付凭据一律由 B 端服务方持有，本仓**永不落地**；
  本层只描述**意图**，绝不代理支付。
- 🔴 本期**恒 inert**（`action_type='none'`），真实落地依赖：① 引擎决策算子就位；
  ② 服务方授权；③ 用户二次确认弹窗。

### 4.5 语音双模态协议（voice_stream_meta · E36 立）

**定位**：声音是情感传递效率最高的介质。灵宠语音不是「把文字念出来」，而是
「**星盘性格声线 + 情绪驱动语调 + 实时嘴型对齐**」。

```jsonc
{
  "voice_id": null,          // 声线 ID（由 relation_mode 确定性映射，见下表）
  "emotional_tone": null,    // caring | energetic | deep_affection | witty
  "viseme_timeline": null    // 🔴 嘴型音素时间轴（前端 Spine 2D 骨骼张合驱动槽；无音频 ⇒ null）
}
```

**四象声线矩阵**（唯一真源：`astro/familiar_engine.py::RELATION_VOICE_MATRIX`）：

| `relation_mode` | 灵宠 | `voice_id` | `emotional_tone` | 听感 |
|---|---|---|---|---|
| `girlfriend` | Sophia · 女友 | `sophia_tender` | `caring` | 温润治愈 |
| `buddy` | Milo · 哥们儿 | `milo_upright` | `energetic` | 阳光干劲 |
| `bestie` | Sophia · 闺蜜 | `sophia_lively` | `witty` | 灵动俏皮 |
| `boyfriend` | Milo · 男友 | `milo_protective` | `deep_affection` | 沉稳偏爱 |

- 🔴 本层**不合成音频、不持有 TTS 凭据**：音频合成与音素时间轴由前端渲染层承接
  （`web/src/components/FamiliarOverlay.tsx` 插拔桩 + 未来 Spine 2D skin swap）。
- 🔴 `emotional_tone` 值域闭集**四值齐备**（`embodied/core/embodied_gateway.js::VOICE_EMOTIONAL_TONES`
  ↔ 上表 ↔ 引擎矩阵），越界一律 fail-closed 置 `null`。

### 4.6 四象决策算子（真值驱动决策 · Reverse Synergy）

**唯一真源**：`astro/familiar_engine.py::RELATION_DECISION_OPERATORS`。
引擎出参 `decision_operators` 为该表的**只读快照**；`embodied/core/intent_translator.js`
**只读消费**，全仓**禁止**第二份权重表（复制 = 漂移 = 专利实施例证据链被污染）。

| `relation_mode` | 决策意图 | 抬高权重的因子 | 重点宫位 |
|---|---|---|---|
| `girlfriend` | 情感互补与吸引 | `venus` / `mars` / `moon` | 7 |
| `buddy` | 同频义气与事业共振 | `sun` / `mars` | 11 / 3 |
| `bestie` | 敏锐共鸣与情绪解压 | `mercury` / `moon` | 3 / 11 |
| `boyfriend` | 庇护偏爱与安全感 | `sun` / `jupiter` | 7 / 5 |

- 🔴 四象签名（主因子集合 + 重点宫位）**两两互异**，闸门逐项断言「算子隔离」。
- 🔴 输入恒为**用户 SwissEph 本命盘真值**；无真值 ⇒ 显式 `null`，**绝不伪造**。
- ⚠️ 本期仅冻结**算子权重结构**，真实相位求解依赖**合婚线双盘字段对齐**（E35-C 前置）。


---

## 五、四项接口预留铁律（军师号令 · 落点表）

| 铁律 | 要求 | 工程落点 | 验收判据 |
|---|---|---|---|
| ① **设备与协议中立** | 入参/出参走标准 REST JSON，**禁写死 Web 前端专属字段**；出参统一预留三槽 | 引擎出参四槽位 + 端点契约 + 禁词扫描 | 闸门 B / D |
| ② **数据模型扩展槽** | 预留 `device_bindings` / `social_preferences` | DDL §8.1 / §8.2 | 闸门 C |
| ③ **记忆与设备流解耦** | `familiar_memories.source` 枚举 `app`/`embodied_device`/`im_chat` | DDL §8.3 | 闸门 A / C |
| ④ **文档与 Schema 封仓** | 顶层构想入库为全仓架构北极星 | 本文件 | 闸门 E |

### 5.1 E36 增量铁律（Agent 执行与语音双模态 · 落点表）

| 铁律 | 要求 | 工程落点 | 验收判据 |
|---|---|---|---|
| ⑤ **动作须人确认** | `requires_user_confirmation` **恒 true**，构造器强制覆写，不可翻转 | `embodied/core/embodied_gateway.js::buildAgentIntentAction` | `embodied/tests` B2 / 闸门 16 |
| ⑥ **越界 fail-closed** | 未知 `action_type` 降级 `none`；未知 `service` 置 `null` | 同上 | `embodied/tests` B3 |
| ⑦ **零密钥** | 电商 / 订餐 / 日程 / 支付凭据一律由 B 端持有，本仓永不落地 | `embodied/**` 全目录扫描 | `embodied/tests` E3 / 闸门 16 |
| ⑧ **逻辑物理归仓** | 具身协议演进 / 测试 / Mock 全在 `embodied/` 内闭环，**零反向依赖**业务线 | `embodied/` 目录 + 路由解耦 | `embodied/tests` E4 / 闸门 16 |
| ⑨ **算子唯一真源** | 四象决策算子权重**只此一份**，转换器只读消费 | `astro/familiar_engine.py::RELATION_DECISION_OPERATORS` | `embodied/tests` D4 / 闸门 16 |

---

## 六、安全与 fail-closed（封仓期硬约束）

1. 🔴 **环境门控默认关**：仅当 `SOUL_OS_OPEN_PROTOCOL === '1'` 时端点才可能返回数据；
   未配置 ⇒ 一律 `503 SOUL_OS_PROTOCOL_DISABLED`，**在任何数据读取之前**返回。
2. 🔴 **设备 API Key 鉴权**（启用后）：`x-soul-device-key` 头或 `Authorization: Bearer <key>`
   与 `SOUL_DEVICE_KEY` **常量时间**比对（复用 `_e30SafeEqual`）；密钥未配 / 未携带 / 不匹配 ⇒ `401`。
3. 🔴 **零前端可控 bypass**：请求体**严禁**出现任何特权开关（`free_access` / `bypass` / `isAdmin` …），
   防重造 E32-A `free_access:1` 那样的白名单式 fail-open 活体漏洞。
4. 🔴 **生产库 DDL 时机**：§8 槽位**本批只落仓内 SQL**，生产 Supabase 由主公在 SQL Editor 择机执行
   （槽位暂无写入方，可随社交/具身批次一起上，减少人工操作）。

---

## 七、版本与演进

| 批次 | 内容 | 状态 |
|---|---|---|
| **E35-A** | 本文档 + DDL §8 槽位 + 引擎出参四槽 + 5 端点骨架（env 门控）+ 第 15 道闸门 | ✅ 已封盘结项（`e322905`） |
| **E36** | Agent 执行槽（`action_intent`）+ 语音双模态槽（`voice_stream_meta`）+ 四象决策算子 + `embodied/` 独立领地 + 第 16 道闸门 | ✅ 本批 |
| E35-B | Soul Card 真实实现（脱敏 + 三级授权） | 待排期 |
| E35-C | Synastry 张量引擎（依赖合婚线双盘字段对齐） | 待排期 |
| E35-D | Embodied 真实实现（人格装载 / 感知回流 / 动作意图 / 记忆同步） | 待排期 |
| E35-E | 对外协议版本冻结（`1.0` 转正） | 待排期 |
| E36-B | 生活执行真实接入（OpenTable / 航班 / 下单，凭据由 B 端持有） | 待排期 |
| E36-C | 语音真实落地（流式 TTS + Spine 2D Lip-Sync 音素对齐） | 待排期 |

> **缓存版本策略**：Soul OS 协议骨架属**纯新增**（无 LLM prompt / 无报告输出变更）⇒ **不 bump `vNNN`**，
> 不清全站缓存。`SOUL_OS_PROTOCOL_VERSION` 是**契约版本**，与缓存版本是两条独立的版本线。

---

*文档建立：2026-10-09 · E35-A · 契约版本 `SOUL_OS_PROTOCOL_VERSION = '1.0'`*
*最近修订：2026-10-09 · E36（新增 §4.4 Agent 执行协议 / §4.5 语音双模态协议 / §4.6 四象决策算子 / §5.1 增量铁律）*
