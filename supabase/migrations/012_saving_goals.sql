create table if not exists public.saving_goals (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  name text not null,
  target_amount integer not null check (target_amount >= 0),
  current_amount integer not null default 0 check (current_amount >= 0),
  due_date date,
  memo text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.saving_goals enable row level security;

drop policy if exists "household data select" on public.saving_goals;
create policy "household data select" on public.saving_goals
for select to authenticated
using (public.is_household_member(household_group_id));

drop policy if exists "household data insert" on public.saving_goals;
create policy "household data insert" on public.saving_goals
for insert to authenticated
with check (public.is_household_member(household_group_id));

drop policy if exists "household data update" on public.saving_goals;
create policy "household data update" on public.saving_goals
for update to authenticated
using (public.is_household_member(household_group_id))
with check (public.is_household_member(household_group_id));

drop policy if exists "household data delete" on public.saving_goals;
create policy "household data delete" on public.saving_goals
for delete to authenticated
using (public.is_household_member(household_group_id));

create index if not exists idx_saving_goals_household_group_id
on public.saving_goals(household_group_id, archived);

drop trigger if exists set_saving_goals_updated_at on public.saving_goals;
create trigger set_saving_goals_updated_at
before update on public.saving_goals
for each row execute function public.set_updated_at();
