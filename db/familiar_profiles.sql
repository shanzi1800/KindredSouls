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

  -- ── 身份层 ──
  name         VARCHAR(64) DEFAULT 'Milo',  -- 灵宠名称（用户可自定义，默认由星盘生成）
  name_source  VARCHAR(16) DEFAULT 'auto',  -- 'auto'(星盘生成) | 'custom'(用户自定义)

  -- ── 轻养成预留（L1 仅骨架，不开放 API）──
  stardust     INTEGER NOT NULL DEFAULT 0,  -- 星尘余额（喂养成货币）
  level        INTEGER NOT NULL DEFAULT 1,  -- 灵宠等级

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
