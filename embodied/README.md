# 🌌 KindredSouls / Soul OS · Embodied Intelligence Open Protocol

> **KindredSouls / Soul OS Embodied Intelligence Open Protocol**
> © 2026 KindredSouls. All rights reserved.
> **PATENT-PENDING** —— 双母 PCT 国际专利（SwissEph 物理真值锁 + 反向相位拟合 / 自进化灵魂图谱）。
> 本目录全部文件均为**专利实施例（Embodiment）证据链**组成部分，供授权合作方按许可范围使用。

---

## 零、为什么要有这个独立目录（主公最高指示）

主公 2026-10-09 钦定：**「涉及与具身智能所有设备合作的代码，单独建一个文件夹，便于后面专利的整理和合作。」**

四大战术价值：

| # | 价值 | 说明 |
|---|---|---|
| ① | **专利申报极速取证** | 律师 / 专利代理人撰写与补交国际发明专利交底书时，直接打包本目录作为实施例证据链，无需在业务逻辑中翻找 |
| ② | **SDK / API 极简分发** | 与座舱、人形机器人、桌面陪护硬件等 B 端厂商合作时，本目录即天然 SDK（npm package / git submodule），无需侵入式解耦 |
| ③ | **主工程零污染与安全沙箱** | 具身协议的演进、测试与 Mock 全在本目录闭环，与财富线 / 合婚线 / 灵宠 C 端业务**绝对隔离** |
| ④ | **权限与开源控制灵活** | 便于日后对特定合作伙伴开放只读权限，或实施针对性加密 |

---

## 一、目录结构

```
embodied/
├── README.md                   # 本文件：协议总览 + 专利交底索引 + 硬件对接规范
├── specs/                      # 协议与数据结构契约（JSON Schema）
│   ├── persona.schema.json     # 人格、声线与情绪状态契约
│   ├── motion.schema.json      # 肢体意图、微表情与灯效驱动契约
│   └── perception.schema.json  # 多模态感知输入与同步契约
├── core/                       # 具身协议核心转换器与适配层（Device-Agnostic）
│   ├── intent_translator.js    # 星历 / 运势决策 ➜ 具身动作意图转换器
│   └── embodied_gateway.js     # 具身专属协议槽位、路由注册表与出参装配
├── adapters/                   # 典型硬件设备适配器预留槽（Mock / Drivers）
│   ├── cockpit/                # 智能座舱场景适配（车载 NOMI 模式）
│   ├── humanoid/               # 人形机器人 / 机械臂动作驱动映射
│   └── companion_pet/          # 桌面交互机器人 / 全息玩具驱动映射
└── tests/                      # 具身智能协议专属测试套件（纳入 test:astro 长链）
    └── embodied_contract.test.mjs
```

---

## 二、工程执行守则（军师指令 · 硬约束）

1. 🔴 **纯净无依赖**：本目录代码保持低耦合，**只依赖抽象接口**；严禁 `import` 任何业务线私有逻辑
   （`../server.js`、财富线 / 合婚线 / 前端组件等一律禁止反向引用）。
2. 🔴 **专利资产标记**：本目录**所有文件**头部统一携带版权与专利权属声明
   （`KindredSouls / Soul OS` + `PATENT-PENDING`），标明归属公司与专利保护标记。
3. 🔴 **路由引用解耦**：`server.js` 里 `/api/v1/embodied/*` 处理函数的出参装配，
   **一律从 `core/embodied_gateway.js` 引入**，实现协议逻辑物理归仓。
4. 🔴 **零密钥**：本目录**永不**存放任何第三方电商 / 订餐 / 日程 / 支付凭据。
   凭据由 B 端服务方自行持有，本层只描述**意图**，绝不代理支付。
5. 🔴 **零版本副本**：契约版本唯一真源仍为
   `astro/familiar_engine.py` ↔ `server.js::SOUL_OS_PROTOCOL_VERSION` ↔ `docs/SOUL_OS_OPEN_SPEC.md`。
   本目录**不得**再定义第四份版本常量（多一条版本线 = 多一处漂移）。

---

## 三、专利交底索引（本目录对应的实施例）

| 专利要点 | 实施例落点 | 状态 |
|---|---|---|
| 基于确定性天文真值反向拟合虚拟生命体 | `core/intent_translator.js`（消费引擎决策算子，不自造真值） | 骨架已就位 |
| 四象关系人格的决策算子隔离 | `astro/familiar_engine.py::RELATION_DECISION_OPERATORS`（唯一真源，本目录只读消费） | 已落地 |
| 星盘真值驱动 TTS 声线频段与情感语气参数 | `specs/persona.schema.json`（`voice_stream_meta`）+ 引擎 `RELATION_VOICE_MATRIX` | 契约已冻结 |
| 从数字灵魂到物理硬件（座舱 / 全息）的具身迁移 | `adapters/{cockpit,humanoid,companion_pet}/` | 预留槽 |
| 具身动作意图的安全确认链（真人确认先于执行） | `core/embodied_gateway.js::buildAgentIntentAction`（确认位**不可翻转**） | 已落地 |

---

## 四、硬件对接规范（B 端合作方接入指引）

### 4.1 接入形态

```
[具身硬件：人形机器人 / 智能座舱 / 桌面陪护 / AI 玩具]
        ↕   Soul OS SDK · Open API · /api/v1/embodied/*
[Soul OS 中枢：星历真值 + 长期记忆图谱 + 4 重陪伴人格 + 实时情绪感知]
```

- 传输：标准 REST JSON（`/api/v1/*` 对外协议层，带语义化版本承诺）。
- 鉴权：`x-soul-device-key` 头或 `Authorization: Bearer <key>`（**常量时间**比对）。
- 门控：协议默认**关闭**（fail-closed）。未启用时一律 `503 SOUL_OS_PROTOCOL_DISABLED`，
  且在**任何数据读取之前**返回，绝不泄漏任何用户数据。

### 4.2 设备侧只读边界

| 槽位 | 方向 | 说明 |
|---|---|---|
| `motion_intent` | 中枢 ➜ 设备 | 动作意图码（本期 inert） |
| `emotion_state` | 中枢 ➜ 设备 | 情绪状态值（本期恒 `neutral`） |
| `display_palette` | 中枢 ➜ 设备 | 灯效 / 配色（与 `relation.palette` 同源，**禁设备侧重算**） |
| `action_intent` | 中枢 ➜ 设备 | 生活执行意图（本期恒 `action_type='none'`） |
| `voice_stream_meta` | 中枢 ➜ 设备 | 声线 ID / 情感语调 / 嘴型音素时间轴（本期 inert） |
| `perception` | 设备 ➜ 中枢 | 多模态感知标签（见 `specs/perception.schema.json`） |

🔴 **设备侧只读不写**：任何 `motion_intent` / `action_intent` / `display_palette` 的改值
必须经中枢引擎层，设备不得直接构造。

---

## 五、契约版本

| 项 | 值 |
|---|---|
| 协议契约版本 | `SOUL_OS_PROTOCOL_VERSION`（当前值 `1.0`；**唯一真源**在 `astro/familiar_engine.py` / `server.js` / `docs/SOUL_OS_OPEN_SPEC.md`，本目录**刻意不复制**） |
| 协议标识 | `KindredSouls/SoulOS-Embodied-Open-Protocol` |
| 版本独立线 | 契约版本**独立于**缓存版本 `vNNN`，二者不得混用 |

*目录建立：2026-10-09 · E36 · 主公圣旨 + 军师架构隔离指令*
