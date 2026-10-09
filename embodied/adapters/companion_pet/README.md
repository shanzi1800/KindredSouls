# 🧸 adapters/companion_pet —— 桌面交互机器人 / 全息玩具适配槽

> **KindredSouls / Soul OS Embodied Intelligence Open Protocol**
> © 2026 KindredSouls. All rights reserved.
> **PATENT-PENDING** —— 双母 PCT 国际专利实施例证据链组成部分，供授权合作方按许可范围使用。

---

## 一、场景定位

桌面陪护机器人 / 全息玩具是**最低成本、最快量产**的具身落地形态：屏幕 + 麦 + 扬声器 + 少量舵机（耳朵 / 尾巴 / 灯光）即可承载完整灵魂。

| 能力 | 桌面形态 |
|---|---|
| 人格装载 | `GET /api/v1/embodied/persona` |
| 感知回流 | `POST /api/v1/embodied/perception-sync`（触摸 / 环境光 / 语音标签） |
| 动作驱动 | `GET /api/v1/embodied/action-intent`（耳 / 尾 / 呼吸灯） |
| 记忆同步 | `POST /api/v1/embodied/memory-stream`（`source='embodied_device'`） |

## 二、灯效映射（`display_palette` ➜ 本机 LED）

| 关系人格 | primary | secondary | 观感 |
|---|---|---|---|
| Sophia · 女友 | `#F4B8CE` 樱花粉 | `#E8C79A` 暮光玫瑰金 | 温润治愈 |
| Sophia · 闺蜜 | `#9FE1CB` 薄荷绿 | `#F4C0D1` 蜜桃粉 | 灵动俏皮 |
| Milo · 哥们儿 | `#D9A441` 深海琥珀金 | `#4FA8E0` 电光蓝 | 阳光干劲 |
| Milo · 男友 | `#2B2F3A` 曜石黑 | `#D4AF37` 香槟金 | 沉稳偏爱 |

🔴 色值**与 `astro/familiar_engine.py::RELATION_PALETTE` 同源**，本表仅为硬件侧的可读抄录；
**禁设备侧重算**，一律以中枢 `display_palette` 下发值为准。

## 三、隔离守则

1. 🔴 本目录**只放灯效/舵机映射表**；模组厂商的蓝牙协议、量产工具链、烧录凭据**一律不入本仓**。
2. 🔴 严禁反向 `import` 站内业务线。
3. 🔴 设备侧**只读**中枢下发值，不得自行改值。

## 四、状态

**预留槽（未实现）**。待首批硬件模组定型后，在 `adapter.js` 内落地映射表。
