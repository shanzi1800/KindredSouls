-- ═══════════════════════════════════════════════════════════════════════════
-- 🤝 E155-刀一（主公军令 2026-11-25）：Resonance Code 缘分密码订单表
--   「一人付费 · 双方各得专属第一视角报告」的订单 / 邀请 / 认领 / 报告四合一真源。
--   🔴 执行方式：Supabase SQL Editor 手工执行（本项目迁移一律手工，Railway 启动链不跑迁移）。
--   🔴 幂等：可重跑（create if not exists / drop policy if exists 再建）。
--   隐私：person_*_profile 与 report_*_json 含生辰与报告全文 —— 仅服务端 service_key
--         读写（/api/resonance/*）；RLS 只放 payer 本人读写、claimant 本人只读，
--         第三方零可见（「已被认领」提示由服务端投影，绝不透出 A/B 任何隐私）。
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.resonance_orders (
  id                  uuid primary key default gen_random_uuid(),
  -- 邀请令牌：24 位 URL-safe 高熵随机串（服务端 crypto 生成），全局唯一，仅可认领一次
  invite_token        text not null,
  scene               text not null check (scene in ('romance', 'business', 'friendship')),
  locale              text not null default 'zh' check (locale in ('zh', 'en', 'fr', 'es', 'th', 'vi')),
  payer_user_id       uuid not null references auth.users (id) on delete cascade,
  claimed_by_user_id  uuid references auth.users (id) on delete set null,
  person_a_profile    jsonb not null default '{}'::jsonb,
  person_b_profile    jsonb,
  payment_status      text not null default 'pending'
                        check (payment_status in ('pending', 'paid')),
  -- 军令三态 awaiting_partner / generating / ready；外加 awaiting_payment（建单初态）与
  -- failed（生成失败 fail-closed，绝不落伪造报告）
  report_status       text not null default 'awaiting_payment'
                        check (report_status in ('awaiting_payment', 'awaiting_partner', 'generating', 'ready', 'failed')),
  report_a_json       jsonb,
  report_b_json       jsonb,
  claimed_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.resonance_orders is 'E155 Resonance Code：一人付费双方各得报告的订单/邀请/认领真源';

-- 邀请令牌唯一索引（防刷幂等第一闸：同 token 不可能存在两张单）
create unique index if not exists resonance_orders_invite_token_uidx
  on public.resonance_orders (invite_token);
create index if not exists resonance_orders_payer_idx
  on public.resonance_orders (payer_user_id);
create index if not exists resonance_orders_claimant_idx
  on public.resonance_orders (claimed_by_user_id);

-- ── RLS：payer 读写自己的单；claimant 只读已认领的单；其余一律不可见 ──
alter table public.resonance_orders enable row level security;

drop policy if exists resonance_orders_payer_rw on public.resonance_orders;
create policy resonance_orders_payer_rw on public.resonance_orders
  for all
  using (auth.uid() = payer_user_id)
  with check (auth.uid() = payer_user_id);

drop policy if exists resonance_orders_claimant_ro on public.resonance_orders;
create policy resonance_orders_claimant_ro on public.resonance_orders
  for select
  using (auth.uid() = claimed_by_user_id);

-- ── updated_at 触发器（幂等挂载）──
create or replace function public.resonance_orders_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_resonance_orders_updated_at on public.resonance_orders;
create trigger trg_resonance_orders_updated_at
  before update on public.resonance_orders
  for each row execute function public.resonance_orders_touch_updated_at();
