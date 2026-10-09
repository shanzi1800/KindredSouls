# 🤖 adapters/humanoid —— 人形机器人 / 机械臂适配槽

> **KindredSouls / Soul OS Embodied Intelligence Open Protocol**
> © 2026 KindredSouls. All rights reserved.
> **PATENT-PENDING** —— 双母 PCT 国际专利实施例证据链组成部分，供授权合作方按许可范围使用。

---

## 一、场景定位

人形机器人与机械臂是「灵魂 ➜ 物理动作」的最深一层：中枢下发**动作意图码**，本适配器负责把意图码映射为具体关节轨迹。

```
motion_intent ('hug_warm' / 'nod' / 'ear_perk' / 'lean_close')
        │
        ▼  adapters/humanoid （本槽 · 意图码 ➜ 关节轨迹序列）
[关节角度序列 / 力矩曲线 / 执行时序]
```

## 二、安全闸（🔴 最高优先级）

| 约束 | 值 | 依据 |
|---|---|---|
| `requires_user_confirmation` | **恒 `true`** | 见 `core/embodied_gateway.js::buildAgentIntentAction`（构造器强制覆写，不可翻转） |
| `max_intensity` | 接触类动作恒 `gentle` | 见 `specs/motion.schema.json` |
| `never_autonomous_spend` | **恒 `true`** | 设备侧永不自主产生任何消费 / 支付行为 |

**意图码 → 轨迹映射必须内置物理限位**（速度 / 力矩 / 行程上下限），任何越界意图码一律 fail-closed 降级为 `idle_breathe`。

## 三、隔离守则

1. 🔴 本目录**只放映射表与限位参数**；机体厂商的固件协议、SDK 凭据、私有补偿算法**一律不入本仓**。
2. 🔴 严禁反向 `import` 站内业务线。
3. 🔴 涉及人体接触的动作必须在 B 端厂商侧完成安全认证后才可启用本槽。

## 四、状态

**预留槽（未实现）**。待机型与安全认证确定后，在 `adapter.js` 内落地映射表与限位参数。
