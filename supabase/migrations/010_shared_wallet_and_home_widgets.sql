alter table public.household_groups
add column if not exists home_widgets jsonb not null default '{
  "monthEnd": true,
  "payerBreakdown": true,
  "categoryBudget": true,
  "sharedWallet": true,
  "incomeSchedule": true,
  "burdenRatio": false
}'::jsonb;

create table if not exists public.shared_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  member_id uuid references public.household_members(id) on delete set null,
  type text not null default 'deposit' check (type in ('deposit', 'withdrawal', 'adjustment')),
  amount integer not null check (amount >= 0),
  occurred_on date not null,
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shared_wallet_transactions enable row level security;

drop policy if exists "household data select" on public.shared_wallet_transactions;
create policy "household data select" on public.shared_wallet_transactions
for select
to authenticated
using (public.is_household_member(household_group_id));

drop policy if exists "household data insert" on public.shared_wallet_transactions;
create policy "household data insert" on public.shared_wallet_transactions
for insert
to authenticated
with check (public.is_household_member(household_group_id));

drop policy if exists "household data update" on public.shared_wallet_transactions;
create policy "household data update" on public.shared_wallet_transactions
for update
to authenticated
using (public.is_household_member(household_group_id))
with check (public.is_household_member(household_group_id));

drop policy if exists "household data delete" on public.shared_wallet_transactions;
create policy "household data delete" on public.shared_wallet_transactions
for delete
to authenticated
using (public.is_household_member(household_group_id));

create index if not exists idx_shared_wallet_transactions_household_group_id
on public.shared_wallet_transactions(household_group_id, occurred_on);

drop trigger if exists set_shared_wallet_transactions_updated_at on public.shared_wallet_transactions;
create trigger set_shared_wallet_transactions_updated_at
before update on public.shared_wallet_transactions
for each row execute function public.set_updated_at();
