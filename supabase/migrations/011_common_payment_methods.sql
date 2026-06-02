create table if not exists public.common_payment_methods (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  type text not null default 'shared_credit_card' check (type in ('shared_wallet', 'shared_credit_card', 'household_account')),
  name text not null,
  closing_day integer check (closing_day between 1 and 31),
  withdrawal_day integer check (withdrawal_day between 1 and 31),
  withdrawal_account text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses
add column if not exists payment_method_type text not null default 'personal'
check (payment_method_type in ('personal', 'shared_wallet', 'shared_credit_card', 'household_account'));

alter table public.expenses
add column if not exists payment_method_id uuid references public.common_payment_methods(id) on delete set null;

alter table public.expenses drop constraint if exists expenses_payment_method_id_fkey;
alter table public.expenses
add constraint expenses_payment_method_id_fkey
foreign key (payment_method_id) references public.common_payment_methods(id) on delete set null;

update public.expenses
set payment_method_type = case
  when paid_by_type = 'shared_wallet' then 'shared_wallet'
  else coalesce(payment_method_type, 'personal')
end;

alter table public.common_payment_methods enable row level security;

drop policy if exists "household data select" on public.common_payment_methods;
create policy "household data select" on public.common_payment_methods
for select to authenticated
using (public.is_household_member(household_group_id));

drop policy if exists "household data insert" on public.common_payment_methods;
create policy "household data insert" on public.common_payment_methods
for insert to authenticated
with check (public.is_household_member(household_group_id));

drop policy if exists "household data update" on public.common_payment_methods;
create policy "household data update" on public.common_payment_methods
for update to authenticated
using (public.is_household_member(household_group_id))
with check (public.is_household_member(household_group_id));

drop policy if exists "household data delete" on public.common_payment_methods;
create policy "household data delete" on public.common_payment_methods
for delete to authenticated
using (public.is_household_member(household_group_id));

create index if not exists idx_common_payment_methods_household_group_id
on public.common_payment_methods(household_group_id, type);

create index if not exists idx_expenses_payment_method_id
on public.expenses(payment_method_id);

drop trigger if exists set_common_payment_methods_updated_at on public.common_payment_methods;
create trigger set_common_payment_methods_updated_at
before update on public.common_payment_methods
for each row execute function public.set_updated_at();
