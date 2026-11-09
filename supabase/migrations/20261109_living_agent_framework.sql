-- ═══════════════════════════════════════════════════════════════
-- KindredSouls · E129-LIVING-SOUL-COMMERCE 节律与记忆三表预埋 DDL
-- 版本: E129-Foundation（军令原文号 E128，号段冲突改称 E129）
-- 日期: 2026-11-09
-- 军师指令: 主动伴生智能体节律底座 —— 未决事件记忆 / 情绪心流 / 月相天象时钟
-- 真源: astro/gen_lunar_calendar.py（Swiss Ephemeris 2.10, Moshier 模式）
--       军令原文写 Meeus；仓内天文真值一律 Swiss Ephemeris（与 astro_matrix.py 同规）
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. user_unresolved_loops：未决事件记忆表（挂账）
--    记录用户倾诉的未决痛点（如「明天要见前任」「周五有重大晋升面试」），
--    供伴侣下次打开对话时主动回溯关心（chat 首击检索 ≤48h pending 事件）。
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_unresolved_loops (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 未决事件一句话摘要（用户视角，供 prompt 注入）
  event_summary     TEXT NOT NULL,
  -- 事件牵涉对象（可空：面试/体检类事件无对象）
  target_person_name TEXT DEFAULT '',
  -- 结构化上下文（文档约定，非约束）：{"mentioned_at": "...", "channel": "..."}
  event_context     JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- pending = 挂账中（主动回溯候选）· resolved = 已了结（不再打扰）
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved')),

  -- 建议回访时刻（超过此时刻不再主动询问，fail-soft；NULL = 由 ≤48h 规则兜底）
  check_in_after    TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 唯一高频查询路径：某用户 pending 事件按时间倒序取最近一条
CREATE INDEX IF NOT EXISTS idx_user_unresolved_loops_user_status_time
  ON user_unresolved_loops (user_id, status, created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 2. user_mood_logs：情绪心流时间序列表
--    用户在首页情绪罗盘点击时静默入库一条（为月度心流画卷蓄水）。
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_mood_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 情绪罗盘键（E123 ks_active_mood 白名单：joy/sad/anxious/calm/angry/low 之类，以罗盘真源为准）
  mood_key           TEXT NOT NULL,
  -- 入库时刻月相（new_moon/full_moon/waxing/waning…，可空 = 服务端未取到）
  moon_phase         TEXT,
  -- 入库时刻行运相位锚（可空：无相位上下文）
  transit_aspect_id  TEXT,
  -- 情绪发生日（按用户本地日期记；时间戳细节走 created_at）
  log_date           DATE NOT NULL DEFAULT CURRENT_DATE,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 时间序列主查询：某用户按日取情绪流
CREATE INDEX IF NOT EXISTS idx_user_mood_logs_user_date
  ON user_mood_logs (user_id, log_date DESC);

-- ─────────────────────────────────────────────────────────────
-- 3. lunar_calendar_events：月相与天象异动字典（全局共享，非用户数据）
--    伴侣主动唤醒仪式的定时时钟：新月 ±24h 显化种植 · 满月 ±24h 释放 · 水逆窗口。
--    预置 2026-2027 全量新月/满月（62 行，由 astro/gen_lunar_calendar.py 生成）。
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lunar_calendar_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- new_moon = 新月（显化仪式）· full_moon = 满月（释放仪式）· mercury_retrograde = 水逆起/止
  event_type          TEXT NOT NULL
    CHECK (event_type IN ('new_moon', 'full_moon', 'mercury_retrograde')),
  -- 事件发生星座（新月/满月 = 月亮星座；水逆 = 水星留驻星座）
  zodiac_sign         TEXT NOT NULL,
  -- 事件精确峰值时刻（UTC；新月/满月 = 精确相位时刻，水逆 = 留（station）时刻）
  peak_time           TIMESTAMPTZ NOT NULL,
  -- 仪式语义（文档约定，非约束）：
  --   新月 {"ritual": "manifestation"} · 满月 {"ritual": "release"}
  --   水逆 {"phase": "start"|"end"}
  manifestation_theme JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 幂等预置：同一事件（类型+时刻）唯一
  CONSTRAINT uq_lunar_event UNIQUE (event_type, peak_time)
);

-- 服务端查询主路径：按时刻窗取近邻事件（±24h 判定）
CREATE INDEX IF NOT EXISTS idx_lunar_events_peak_time
  ON lunar_calendar_events (peak_time);

-- ─────────────────────────────────────────────────────────────
-- 4. RLS（生产安全铁律：仅本人可读写用户数据；字典表 fail-closed 仅服务角色）
-- ─────────────────────────────────────────────────────────────

ALTER TABLE user_unresolved_loops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_manage_own_unresolved_loops" ON user_unresolved_loops;
CREATE POLICY "users_manage_own_unresolved_loops" ON user_unresolved_loops
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_mood_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_manage_own_mood_logs" ON user_mood_logs;
CREATE POLICY "users_manage_own_mood_logs" ON user_mood_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 字典表：RLS 开 + 零策略 = 匿名/ authenticated 均不可读（fail-closed），
-- 服务端 PostgREST service key 走 service role 旁路不受 RLS 限制。
ALTER TABLE lunar_calendar_events ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 5. 预置数据：2026-2027 新月/满月/水逆（62 行，幂等可重复执行）
--    生成器：astro/gen_lunar_calendar.py（Swiss Ephemeris Moshier）
--    抽验锚点：2026-01-18T19:52:02Z 新月（摩羯）· 2026-02-26~03-20 水逆（双鱼全程）
--            2026-11-09T07:02:07Z 新月（天蝎，即军令当日）· 2026-12-24T01:28:16Z 满月（巨蟹）
-- ─────────────────────────────────────────────────────────────

INSERT INTO lunar_calendar_events (event_type, zodiac_sign, peak_time, manifestation_theme) VALUES
  ('full_moon', 'cancer', '2026-01-03T10:02:55Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'capricorn', '2026-01-18T19:52:02Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'leo', '2026-02-01T22:09:15Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'aquarius', '2026-02-17T12:01:10Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'pisces', '2026-02-26T06:48:14Z', '{"phase": "start"}'::jsonb),
  ('full_moon', 'virgo', '2026-03-03T11:37:56Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'pisces', '2026-03-19T01:23:29Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'pisces', '2026-03-20T19:32:54Z', '{"phase": "end"}'::jsonb),
  ('full_moon', 'libra', '2026-04-02T02:12:00Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'aries', '2026-04-17T11:51:49Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'scorpio', '2026-05-01T17:23:11Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'taurus', '2026-05-16T20:01:04Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'sagittarius', '2026-05-31T08:45:12Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'gemini', '2026-06-15T02:54:12Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'cancer', '2026-06-29T17:35:59Z', '{"phase": "start"}'::jsonb),
  ('full_moon', 'capricorn', '2026-06-29T23:56:43Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'cancer', '2026-07-14T09:43:36Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'cancer', '2026-07-23T22:57:55Z', '{"phase": "end"}'::jsonb),
  ('full_moon', 'aquarius', '2026-07-29T14:35:46Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'leo', '2026-08-12T17:36:44Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'pisces', '2026-08-28T04:18:33Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'virgo', '2026-09-11T03:27:01Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'aries', '2026-09-26T16:49:01Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'libra', '2026-10-10T15:50:07Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'scorpio', '2026-10-24T07:12:48Z', '{"phase": "start"}'::jsonb),
  ('full_moon', 'taurus', '2026-10-26T04:11:47Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'scorpio', '2026-11-09T07:02:07Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'scorpio', '2026-11-13T15:53:57Z', '{"phase": "end"}'::jsonb),
  ('full_moon', 'gemini', '2026-11-24T14:53:36Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'sagittarius', '2026-12-09T00:51:51Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'cancer', '2026-12-24T01:28:16Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'capricorn', '2027-01-07T20:24:25Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'leo', '2027-01-22T12:17:22Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'aquarius', '2027-02-06T15:56:09Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'pisces', '2027-02-09T17:36:09Z', '{"phase": "start"}'::jsonb),
  ('full_moon', 'virgo', '2027-02-20T23:23:38Z', '{"ritual": "release"}'::jsonb),
  ('mercury_retrograde', 'aquarius', '2027-03-03T12:32:06Z', '{"phase": "end"}'::jsonb),
  ('new_moon', 'pisces', '2027-03-08T09:29:30Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'libra', '2027-03-22T10:43:49Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'aries', '2027-04-06T23:51:09Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'scorpio', '2027-04-20T22:27:11Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'taurus', '2027-05-06T10:58:37Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'scorpio', '2027-05-20T10:59:02Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'gemini', '2027-06-04T19:40:21Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'cancer', '2027-06-10T18:15:19Z', '{"phase": "start"}'::jsonb),
  ('full_moon', 'sagittarius', '2027-06-19T00:44:20Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'cancer', '2027-07-04T03:02:04Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'gemini', '2027-07-04T19:39:28Z', '{"phase": "end"}'::jsonb),
  ('full_moon', 'capricorn', '2027-07-18T15:44:56Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'leo', '2027-08-02T10:05:13Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'aquarius', '2027-08-17T07:28:43Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'virgo', '2027-08-31T17:41:12Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'pisces', '2027-09-15T23:03:32Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'libra', '2027-09-30T02:36:06Z', '{"ritual": "manifestation"}'::jsonb),
  ('mercury_retrograde', 'scorpio', '2027-10-07T14:37:09Z', '{"phase": "start"}'::jsonb),
  ('full_moon', 'aries', '2027-10-15T13:46:59Z', '{"ritual": "release"}'::jsonb),
  ('mercury_retrograde', 'libra', '2027-10-28T14:10:43Z', '{"phase": "end"}'::jsonb),
  ('new_moon', 'scorpio', '2027-10-29T13:36:35Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'taurus', '2027-11-14T03:25:55Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'sagittarius', '2027-11-28T03:24:26Z', '{"ritual": "manifestation"}'::jsonb),
  ('full_moon', 'gemini', '2027-12-13T16:08:50Z', '{"ritual": "release"}'::jsonb),
  ('new_moon', 'capricorn', '2027-12-27T20:12:20Z', '{"ritual": "manifestation"}'::jsonb)
ON CONFLICT (event_type, peak_time) DO NOTHING;
