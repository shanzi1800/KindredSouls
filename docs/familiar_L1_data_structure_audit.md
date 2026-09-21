# 灵宠 L1 底层数据结构预留 · 军师审计文档

**日期**: 2026-09-21
**军师指令**: 先出 SQL 和算法骨架代码，审完后再直接落库与上线代码
**状态**: [待军师审计]

---

## 一、交付物清单

| # | 文件 | 位置 | 说明 |
|---|---|---|---|
| 1 | `db/familiar_profiles.sql` | KindredSouls源代码/db/ | Supabase DDL：建表 + 扩展列 + RLS |
| 2 | `astro/familiar_engine.py` | KindredSouls源代码/astro/ | 性格与外观映射纯函数模块 |

---

## 二、SQL DDL 要点

### 2.1 新建表：`familiar_profiles`

| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | UUID PK | 1:1 绑定 auth.users，不可多孵 |
| `natal_hash` | VARCHAR(64) | 星盘快照 Hash（改生日则需重新孵化） |
| `species` | VARCHAR(32) | 基准物种，默认 `crystal_cat` |
| `crystal_color` | VARCHAR(16) | 主体晶石色 HEX |
| `eye_color` | VARCHAR(16) | 眼睛颜色 HEX |
| `body_type` | VARCHAR(32) | 体型轮廓+耳尾姿态 |
| `texture` | VARCHAR(32) | 表面质感 |
| `totem` | VARCHAR(32) | 内在图腾兽 |
| `personality` | JSONB | 5 维向量 (talkative/clingy/moody/sarcastic/healing) |
| `name` | VARCHAR(64) | 灵宠名称，默认 `Milo` |
| `name_source` | VARCHAR(16) | `auto` 或 `custom` |
| `stardust` | INTEGER | 星尘余额（养成货币预留） |
| `level` | INTEGER | 灵宠等级预留 |
| `created_at` / `updated_at` | TIMESTAMPTZ | 自动维护（触发器） |

**安全**：
- `ON DELETE CASCADE`：用户删号自动清灵宠
- RLS 启用：用户只能 CRUD 自己的灵宠
- `updated_at` 触发器自动更新

### 2.2 扩展列：`ai_insights_cache.familiar_meta`

```sql
ALTER TABLE ai_insights_cache
  ADD COLUMN IF NOT EXISTS familiar_meta JSONB DEFAULT '{}'::jsonb;
```

**用途**：月报/年报生成时顺手存灵宠伴随语（greeting / weekly_snippet / trap_reaction / closing），后续灵宠上线后可调取历史所有报告的灵宠寄语，无需重新请求大模型。

**JSON 结构约定**（文档，非约束）：
```json
{
  "greeting": "夜珀抖了抖耳朵，盯着你的第二宫...",
  "weekly_snippet": {
    "w1": "水星淬火，让你的爪子痒痒的...",
    "w2": "海王迷雾来了，别闻那个味道...",
    "w3": "土星压着尾巴，慢点走...",
    "w4": "木星照你头顶，金光灿灿..."
  },
  "trap_reaction": "夜珀炸毛了：350块？你认真的？",
  "closing": "下个月，夜珀会在天蝎座的新月里等。"
}
```

---

## 三、算法骨架要点

### 3.1 文件：`astro/familiar_engine.py`

**纯函数，零外部依赖**（不 import swisseph / supabase / fetch），输入三个星座字符串，输出完整 Profile dict。

### 3.2 算法链路

```
输入: sun_sign, moon_sign, asc_sign, natal_hash, user_name(可选)
  │
  ├─ 外观层
  │   ├─ crystal_color ← 太阳星座 → 元素 → CRYSTAL_COLOR_MAP
  │   ├─ eye_color     ← 月亮星座 → EYE_COLOR_MAP
  │   ├─ body_type     ← 上升星座 → 元素 → BODY_TYPE_MAP
  │   ├─ texture       ← 太阳星座 → 元素 → TEXTURE_MAP
  │   └─ totem         ← 太阳元素 + 守护行星 → TOTEM_MAP
  │
  ├─ 性格层 (5维 0-100)
  │   └─ base = sun_base * 0.5 + moon_base * 0.3 + asc_base * 0.2
  │      result = clamp(round(base + element_modifier[sun_element]))
  │
  └─ 命名层
      └─ 太阳元素意象 + 月亮情绪意象 → 两字名 (如 "汐渺")
         用户可自定义覆盖
```

### 3.3 星座基础分（SIGN_PERSONALITY_BASE）

12 星座在 5 维上的基础分，基于占星学共识设定（火象毒舌高/水象情绪高/风象话痨高/土象治愈高）。

### 3.4 自测验证（已通过）

| 测试项 | 输入 | 结果 |
|---|---|---|
| 示例1 | Sun=Scorpio, Moon=Pisces, Asc=Taurus | 紫晶+雾蓝眼+敦实盘坐+流纹透光+龟图腾；毒舌57/情绪83/治愈74；名"汐渺" ✅ |
| 示例2 | Sun=Leo, Moon=Aries, Asc=Gemini | 红玛瑙+金眸+轻盈悬空+熔岩孔纹+凤图腾；话痨80/毒舌74；名"炎锋" ✅ |
| 示例3 | Sun=Aquarius, Moon=Libra, Asc=Sagittarius | 白水晶+粉晶眼+昂扬立耳+抛光玻感+鸮图腾；话痨74/毒舌70；名"风衡" ✅ |
| 幂等性 | 同输入两次调用 | 结果完全一致 ✅ |
| 边界 | 未知星座 | 不崩，兜底 Fire 系 ✅ |

### 3.5 与 L1 草案对照

| L1 草案条款 | 实现状态 |
|---|---|
| 太阳星座→主体晶石色+主色系 | ✅ CRYSTAL_COLOR_MAP (4元素×HEX) |
| 月亮星座→眼睛颜色+眼神气质 | ✅ EYE_COLOR_MAP (12星座×HEX+描述) |
| 上升星座→体型轮廓+耳/尾姿态 | ✅ BODY_TYPE_MAP (4元素) |
| 四元素→表面质感 | ✅ TEXTURE_MAP (4元素) |
| 元素+守护行星→内在图腾兽 | ✅ TOTEM_MAP (12组合) + 兜底 |
| 5维性格: 太阳0.5/月亮0.3/上升0.2+元素修正 | ✅ _personality_vector() |
| 个体名: 星盘生成 or 用户自定义 | ✅ _generate_name() + name_source |
| 纯函数，可单元测试 | ✅ 零外部依赖，已自测 |
| 算法算真值，AI只填文案 | ✅ 沿用 KindredSouls 防穿帮铁律 |

---

## 四、军师建议的两处优化 · 落实情况

### 4.1 familiar_meta 扩展列
- ✅ 已在 SQL DDL 中 `ALTER TABLE ai_insights_cache ADD COLUMN IF NOT EXISTS familiar_meta JSONB`
- ✅ JSON 结构约定写在 SQL 注释中（greeting / weekly_snippet / trap_reaction / closing）

### 4.2 性格向量纯函数封装
- ✅ `familiar_engine.py` 是纯函数模块，零外部依赖
- ✅ `calculate_familiar_profile()` 是主入口，输入星座字符串，输出 Profile dict
- ✅ 可直接被 `astro_matrix.py` import 或被 server.js 通过 subprocess 调用
- ✅ 自测入口 `if __name__ == '__main__'` 已验证 4 个用例

---

## 五、待军师审计要点

1. **SQL DDL**：表结构、RLS 策略、触发器是否 OK？
2. **familiar_meta JSON 结构约定**：字段是否够用？需不需要加？
3. **性格基础分 (SIGN_PERSONALITY_BASE)**：12 星座 × 5 维的数值是否符合军师预期？
4. **命名规则**：元素意象 + 月亮情绪意象拼两字名，是否需要改？
5. **stardust / level 预留字段**：L1 先不开放 API，字段留着是否 OK？

---

**等军师回复"允许落库"后**：
1. 执行 SQL 建表（Supabase Dashboard 或 psql）
2. `astro/familiar_engine.py` 已在仓库中，git commit 推送
3. 后续月报生成时可开始向 `familiar_meta` 写入伴随语（不等灵宠 API 上线）
