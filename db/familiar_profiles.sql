-- ═══════════════════════════════════════════════════════════════
-- KindredSouls 灵宠 · L1 底层数据结构预留 DDL
-- 版本: V461-Familiar-Foundation
-- 日期: 2026-09-21
-- 军师指令: 先出草案审计，确认"允许落库"后执行
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. 灵宠主表：familiar_profiles
--    1:1 绑定用户（user_id 即主键），一张星盘孵一只灵宠
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS familiar_profiles (
  -- 主键 = 用户 ID（1:1，不可多孵）
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 孵化时星盘快照 Hash（用于检测星盘数据是否变更，如改生日则需重新孵化）
  natal_hash VARCHAR(64) NOT NULL,

  -- ── 外观层（由星盘 → 元素/星座映射生成）──
  species      VARCHAR(32) NOT NULL DEFAULT 'crystal_cat',  -- 基准物种（L1 锁定晶猫）
  crystal_color VARCHAR(16) NOT NULL,   -- 主体晶石色 (HEX, 由太阳星座→元素映射)
  eye_color    VARCHAR(16) NOT NULL,    -- 眼睛颜色 (HEX, 由月亮星座映射)
  body_type    VARCHAR(32) NOT NULL,    -- 体型轮廓+耳尾姿态 (由上升星座映射)
  texture      VARCHAR(32) NOT NULL,    -- 表面质感 (由四元素映射)
  totem        VARCHAR(32) NOT NULL,    -- 内在图腾兽 (由元素+守护行星推算)

  -- ── 性格层（5 维向量，0-100，由太阳0.5/月亮0.3/上升0.2加权+元素修正）──
  personality  JSONB NOT NULL DEFAULT '{
    "talkative": 50,
    "clingy": 50,
    "moody": 50,
    "sarcastic": 50,
    "healing": 50
  }'::jsonb,

  -- ── 关系层（E34-B1：四象陪伴人格 · 2026-10-09 军师开工令）──
  --   ⚠️ 全站只有 2 个 IP 角色名（Milo / Sophia）；本字段决定「呈现为哪一重人格」：
  --     girlfriend = 善良女友   （男用户 × Sophia）
  --     buddy      = 铁哥们儿   （男用户 × Milo）
  --     bestie     = 闺蜜       （女用户 × Sophia）
  --     boyfriend  = 帅气男友   （女用户 × Milo）
  --   🛡️ 刻意不采集用户性别 —— 由用户直接选关系（军师裁决「方案 b」）。
  --   命名层 name 与关系层解耦：name 默认由所选 IP 决定（Sophia / Milo）。
  relation_mode VARCHAR(16) NOT NULL DEFAULT 'girlfriend'
    CHECK (relation_mode IN ('girlfriend', 'buddy', 'bestie', 'boyfriend')),

  -- ── 真值完整性标记（E34-B1）──
  --   true = 用户未提供精准出生时间 ⇒ 上升星座不可信 ⇒ 外观层显式降级
  --          （body_type / texture = 'standard'），严禁静默伪造上升出盘。
  --   依据：V490b（argparse 非法坐标 → 伪造 Cancer rising）+ V492/D2（真值缺失显示 ?）。
  time_uncertain BOOLEAN NOT NULL DEFAULT FALSE,

  -- ── 身份层 ──
  name         VARCHAR(64) DEFAULT 'Milo',  -- 灵宠名称（用户可自定义，默认由星盘生成）
  name_source  VARCHAR(16) DEFAULT 'auto',  -- 'auto'(星盘生成) | 'custom'(用户自定义)

  -- ── 轻养成预留（L1 仅骨架，不开放 API）──
  stardust     INTEGER NOT NULL DEFAULT 0,  -- 星尘余额（喂养成货币）
  level        INTEGER NOT NULL DEFAULT 1,  -- 灵宠等级

  -- ── 灵魂记忆层（E34-B1 骨架预留 · 2026-10-09 军师「认知进化与记忆系统」号令）──
  --   三层记忆架构（严禁把全部历史塞进上下文）：
  --     第 1 层 星历出厂底色 = personality(5 维) + relation_mode（本表既有列，不可动摇）
  --     第 2 层 语义画像 / 记忆图谱 = memory_summary（本列，Key-Value / 语义标签摘要）
  --     第 3 层 短程流动上下文 = familiar_memories 表最近 N 轮（见 §5，滑动窗口，不入本表）
  --   ⚠️ 本期**只建槽位、不写入、不开放 API**（避免未来二次大改 DDL）。
  memory_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  --   结构约定（文档，非约束）：
  --   {
  --     "user_trait":     ["熬夜", "做量化交易"],          -- 用户特征/职业
  --     "speech_style":   ["干练", "不喜欢废话"],          -- 言谈举止口癖
  --     "comfort_trigger":["疲惫时喜欢被倾听"],            -- 情绪安抚触发点
  --     "likes":          ["手冲咖啡"], "dislikes": ["吵闹"],-- 喜好厌恶
  --     "strengths":      ["逻辑推演"],                     -- 擅长领域
  --     "updated_at":     "2026-10-09T00:00:00Z"           -- 摘要生成时间
  --   }

  --   亲密度等级（隐式/显式反馈的**累积结果**，1 起；仅作权重调制的粗粒度轴）
  intimacy_level INTEGER NOT NULL DEFAULT 1,

  --   最近一次互动时间（隐式反馈奖励信号的时间锚；RL 异步批次按此排序/衰减）
  last_interaction_at TIMESTAMPTZ,

  -- ── 时间戳 ──
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引：按创建时间排序（后台管理用）
CREATE INDEX IF NOT EXISTS idx_familiar_profiles_created_at
  ON familiar_profiles (created_at DESC);

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_familiar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_familiar_updated_at ON familiar_profiles;
CREATE TRIGGER trg_familiar_updated_at
  BEFORE UPDATE ON familiar_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_familiar_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 2. ai_insights_cache 扩展：familiar_meta 预留列
--    月报/年报生成时顺手存"灵宠伴随语/一句话吐槽"
--    后续灵宠上线后可调取历史所有报告的灵宠寄语，无需重新请求大模型
-- ─────────────────────────────────────────────────────────────

ALTER TABLE ai_insights_cache
  ADD COLUMN IF NOT EXISTS familiar_meta JSONB DEFAULT '{}'::jsonb;

-- familiar_meta JSON 结构约定（文档，非约束）：
-- {
--   "greeting": "夜珀抖了抖耳朵，盯着你的第二宫...",  -- 灵宠开报点题语
--   "weekly_snippet": {                              -- 每周灵宠一句话
--     "w1": "水星淬火，让你的爪子痒痒的——是时候磨磨技能了。",
--     "w2": "海王迷雾来了，别闻那个味道，会上头。",
--     "w3": "土星压着尾巴，慢点走，不丢人。",
--     "w4": "木星照你头顶，金光灿灿——张嘴接。"
--   },
--   "trap_reaction": "夜珀炸毛了：350块？你认真的？",  -- 灵宠对消费陷阱的反应
--   "closing": "下个月，夜珀会在天蝎座的新月里等。"  -- 月末结语
-- }

-- ─────────────────────────────────────────────────────────────
-- 3. Row Level Security（生产安全铁律）
-- ─────────────────────────────────────────────────────────────

ALTER TABLE familiar_profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能 CRUD 自己的灵宠
CREATE POLICY "users_manage_own_familiar" ON familiar_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ai_insights_cache 的 familiar_meta 列继承该表现有 RLS 策略
-- （如果 ai_insights_cache 已有 RLS，familiar_meta 自动受保护，无需额外策略）

-- ─────────────────────────────────────────────────────────────
-- 4. 增量迁移 · E34-B1 关系层（表若已先行建好时补齐）
--    说明：上方 §1 的 CREATE TABLE 只对**新库**生效。若生产表在本指令下发前
--    已按 L1 版建好，则下方的 ALTER 才是唯一生效路径。全部幂等，可重复执行。
-- ─────────────────────────────────────────────────────────────

ALTER TABLE familiar_profiles
  ADD COLUMN IF NOT EXISTS relation_mode VARCHAR(16) NOT NULL DEFAULT 'girlfriend';

ALTER TABLE familiar_profiles
  ADD COLUMN IF NOT EXISTS time_uncertain BOOLEAN NOT NULL DEFAULT FALSE;

-- CHECK 约束无 IF NOT EXISTS ⇒ 先探测 pg_constraint 再添加（幂等）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'familiar_profiles_relation_mode_check'
      AND conrelid = 'familiar_profiles'::regclass
  ) THEN
    ALTER TABLE familiar_profiles
      ADD CONSTRAINT familiar_profiles_relation_mode_check
      CHECK (relation_mode IN ('girlfriend', 'buddy', 'bestie', 'boyfriend'));
  END IF;
END $$;

-- 关系层分布索引（后台按人格统计用）
CREATE INDEX IF NOT EXISTS idx_familiar_profiles_relation_mode
  ON familiar_profiles (relation_mode);

-- ─────────────────────────────────────────────────────────────
-- 5. 增量迁移 · E34-B1 灵魂记忆层（表若已先行建好时补齐）
--    同上：全部幂等，可重复执行。
-- ─────────────────────────────────────────────────────────────

-- 第 2 层：语义画像摘要（Key-Value / 语义标签）
ALTER TABLE familiar_profiles
  ADD COLUMN IF NOT EXISTS memory_summary JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 亲密度等级（1 起；仅作交互权重的粗粒度调制轴）
ALTER TABLE familiar_profiles
  ADD COLUMN IF NOT EXISTS intimacy_level INTEGER NOT NULL DEFAULT 1;

-- 最近互动时间（隐式反馈信号的时间锚）
ALTER TABLE familiar_profiles
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────
-- 6. 第 3 层：familiar_memories —— 短程/长程记忆条目表（E34-B1 骨架预留）
--    定位：**记忆的明细落盘**，非「全量对话流水」。异步萃取器只写「已提炼的事实」，
--          不写原始 transcript（原始流式响应留在前端，从不落这里）。
--    读取：滑动窗口（最近 10~20 条 kind='turn'）+ 长程语义（kind='fact'）。
-- ⚠️ 本期**只建表、不写入、不开放 API**。
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS familiar_memories (
  id           BIGSERIAL PRIMARY KEY,

  -- 归属：直接绑 auth.users(id)（同时冗余 familiar_user），保证 RLS 判定无需 JOIN
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  familiar_user UUID NOT NULL REFERENCES familiar_profiles(user_id) ON DELETE CASCADE,

  -- 记忆种类：turn=短程对话轮 · fact=异步萃取的语义事实 · feedback=显式反馈打标
  kind         VARCHAR(16) NOT NULL DEFAULT 'fact'
    CHECK (kind IN ('turn', 'fact', 'feedback')),

  -- 记忆正文（已提炼的摘要，非原始流水）+ 语义标签
  summary      TEXT NOT NULL DEFAULT '',
  tags         JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- 权重（RL 用：隐式/显式反馈累积；越大越优先注入 Few-Shot）
  weight       REAL NOT NULL DEFAULT 1.0,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 按用户 + 时间倒序取滑动窗口（唯一高频查询路径）
CREATE INDEX IF NOT EXISTS idx_familiar_memories_user_time
  ON familiar_memories (user_id, created_at DESC);

-- 按种类取长程语义（异步萃取器去重时用）
CREATE INDEX IF NOT EXISTS idx_familiar_memories_kind
  ON familiar_memories (kind);

-- ─────────────────────────────────────────────────────────────
-- 7. RLS（记忆隐私铁律：仅本人可读写，零跨租户泄漏）
-- ─────────────────────────────────────────────────────────────

ALTER TABLE familiar_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_familiar_memories" ON familiar_memories;
CREATE POLICY "users_manage_own_familiar_memories" ON familiar_memories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 8. 增量迁移 · E35 Soul OS 开放协议预留（社交 + 具身智能）
--    军师号令 2026-10-09（主公圣旨：为社交帝国与具身智能全设备合作预留架构）。
--    🔴 沿用 V463 法器预留范式：**只建槽位、不写入、不开放 API**（封仓期 inert）。
--    全部幂等，可重复执行。
--    北极星文档：docs/SOUL_OS_OPEN_SPEC.md（契约版本 SOUL_OS_PROTOCOL_VERSION = '1.0'）
-- ─────────────────────────────────────────────────────────────

-- 8.1 生态扩展槽：具身设备绑定（未来挂各种硬件 UUID，一份灵魂可绑多设备）
ALTER TABLE familiar_profiles
  ADD COLUMN IF NOT EXISTS device_bindings JSONB NOT NULL DEFAULT '[]'::jsonb;
--   结构约定（文档，非约束）：
--   [{ "device_id": "...", "vendor": "...", "model": "...",
--      "api_key_ref": "...", "bound_at": "...", "revoked_at": null }, ...]

-- 8.2 社交偏好与隐私域（Peer Handshake Slot 容器 · 杜绝列爆炸）
ALTER TABLE familiar_profiles
  ADD COLUMN IF NOT EXISTS social_preferences JSONB NOT NULL DEFAULT '{}'::jsonb;
--   结构约定（文档，非约束）：
--   { "allow_soul_match": false,     -- 🔴 默认 false（隐私第一铁律）：允许被灵魂匹配
--     "social_status": "offline",    -- offline | open_to_match | busy
--     "visibility": "private",       -- private | friends | public（控制 Soul Card 可见级）
--     "blocked_users": [] }          -- 黑名单（命中即无条件拒绝握手 / 名片）

-- 8.3 记忆来源解耦（App / 具身设备 / IM 会话 → 同一座「灵魂记忆图谱」）
ALTER TABLE familiar_memories
  ADD COLUMN IF NOT EXISTS source VARCHAR(24) NOT NULL DEFAULT 'app';

-- CHECK 约束无 IF NOT EXISTS ⇒ 先探测 pg_constraint 再添加（幂等）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'familiar_memories_source_check'
      AND conrelid = 'familiar_memories'::regclass
  ) THEN
    ALTER TABLE familiar_memories
      ADD CONSTRAINT familiar_memories_source_check
      CHECK (source IN ('app', 'embodied_device', 'im_chat'));
  END IF;
END $$;

-- 记忆来源分布索引（异步萃取器/后台按来源统计用）
CREATE INDEX IF NOT EXISTS idx_familiar_memories_source
  ON familiar_memories (source);

