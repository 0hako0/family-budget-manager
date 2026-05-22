create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  burden_rule text not null default 'fifty_fifty' check (burden_rule in ('fifty_fifty', 'custom', 'income_ratio')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.household_groups add column if not exists created_by uuid references auth.users(id) on delete set null;

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  custom_share_ratio numeric(5, 4) not null default 0.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_group_id, user_id)
);

alter table public.household_members drop constraint if exists household_members_role_check;
alter table public.household_members add constraint household_members_role_check check (role in ('owner', 'member'));

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  code text unique not null,
  invited_email text,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  kind text not null check (kind in ('expense', 'fixed_cost', 'income', 'saving')),
  name text not null,
  color text not null default '#2f8f6b',
  icon text not null default '・',
  sort_order integer not null default 1,
  hidden boolean not null default false,
  archived boolean not null default false,
  monthly_budget integer check (monthly_budget >= 0),
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  target_month text not null,
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_group_id, category_id, target_month)
);

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  member_id uuid references public.household_members(id) on delete set null,
  name text not null,
  amount integer not null check (amount >= 0),
  paid_on date not null,
  earner_name text not null,
  income_type text not null default 'other' check (income_type in ('salary', 'side_income', 'bonus', 'temporary', 'other')),
  category_id uuid references public.categories(id) on delete set null,
  recurring boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.savings (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  name text not null,
  amount integer not null check (amount >= 0),
  saving_type text not null default 'other' check (saving_type in ('cash_saving', 'nisa', 'mutual_fund', 'travel', 'car', 'special', 'other')),
  category_id uuid references public.categories(id) on delete set null,
  recurring boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fixed_costs (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  member_id uuid references public.household_members(id) on delete set null,
  name text not null,
  amount integer not null check (amount >= 0),
  paid_on integer not null check (paid_on between 1 and 31),
  payer_name text not null,
  category text not null default 'other' check (category in ('rent', 'utilities', 'telecom', 'insurance', 'subscription', 'car', 'tax', 'other')),
  category_id uuid references public.categories(id) on delete set null,
  recurring boolean not null default true,
  review_target boolean not null default false,
  review_memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  name text not null,
  monthly_payment integer not null check (monthly_payment >= 0),
  paid_on integer not null check (paid_on between 1 and 31),
  remaining_balance integer not null check (remaining_balance >= 0),
  interest_rate numeric(5, 2) not null default 0,
  payoff_date date,
  has_bonus_payment boolean not null default false,
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  member_id uuid references public.household_members(id) on delete set null,
  amount integer not null check (amount >= 0),
  spent_on date not null,
  category text not null default 'other' check (category in ('food', 'dining', 'daily_goods', 'transport', 'hobby', 'clothing', 'medical', 'social', 'pet', 'other')),
  category_id uuid references public.categories(id) on delete set null,
  payer_name text not null,
  target text not null default 'shared' check (target in ('shared', 'self_only', 'partner_only')),
  share_rule text not null default 'group_default' check (share_rule in ('group_default', 'fifty_fifty', 'custom', 'income_ratio')),
  payer_share_ratio numeric(5, 4),
  partner_share_ratio numeric(5, 4),
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monthly_summaries (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  target_month text not null,
  income_total integer not null default 0,
  fixed_cost_total integer not null default 0,
  loan_total integer not null default 0,
  variable_expense_total integer not null default 0,
  saving_total integer not null default 0,
  remaining_budget integer not null default 0,
  landing_result integer not null default 0,
  category_expenses jsonb not null default '{}'::jsonb,
  memo text not null default '',
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_group_id, target_month)
);

alter table public.users enable row level security;
alter table public.household_groups enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;
alter table public.categories enable row level security;
alter table public.category_budgets enable row level security;
alter table public.incomes enable row level security;
alter table public.savings enable row level security;
alter table public.fixed_costs enable row level security;
alter table public.loans enable row level security;
alter table public.expenses enable row level security;
alter table public.monthly_summaries enable row level security;

create or replace function public.is_household_member(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_group_id = group_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_group_id = group_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

drop policy if exists "users can read self" on public.users;
create policy "users can read self" on public.users for select to authenticated using (id = auth.uid());
drop policy if exists "users can upsert self" on public.users;
create policy "users can upsert self" on public.users for insert to authenticated with check (id = auth.uid());
drop policy if exists "users can update self" on public.users;
create policy "users can update self" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "members can read groups" on public.household_groups;
drop policy if exists "Users can view their household groups" on public.household_groups;
create policy "Users can view their household groups" on public.household_groups
for select
to authenticated
using (public.is_household_member(id));
drop policy if exists "authenticated can create groups" on public.household_groups;
drop policy if exists "Users can create household groups" on public.household_groups;
create policy "Users can create household groups" on public.household_groups
for insert
to authenticated
with check (created_by = auth.uid());
drop policy if exists "owners can update groups" on public.household_groups;
create policy "owners can update groups" on public.household_groups for update to authenticated using (public.is_household_owner(id)) with check (public.is_household_owner(id));

drop policy if exists "members can read members" on public.household_members;
drop policy if exists "Users can view household members in their groups" on public.household_members;
create policy "Users can view household members in their groups" on public.household_members
for select
to authenticated
using (public.is_household_member(household_group_id) or user_id = auth.uid());
drop policy if exists "users can join households" on public.household_members;
drop policy if exists "Users can join household members as themselves" on public.household_members;
create policy "Users can join household members as themselves" on public.household_members
for insert
to authenticated
with check (user_id = auth.uid());
drop policy if exists "owners can manage members" on public.household_members;
create policy "owners can manage members" on public.household_members for update to authenticated using (public.is_household_owner(household_group_id)) with check (public.is_household_owner(household_group_id));

drop policy if exists "members can read invitations" on public.household_invitations;
create policy "members can read invitations" on public.household_invitations for select to authenticated using (public.is_household_member(household_group_id) or (used_at is null and expires_at > now()));
drop policy if exists "owners can create invitations" on public.household_invitations;
create policy "owners can create invitations" on public.household_invitations for insert to authenticated with check (public.is_household_owner(household_group_id));
drop policy if exists "invite users can update invitations" on public.household_invitations;
create policy "invite users can update invitations" on public.household_invitations for update to authenticated using (used_at is null and expires_at > now()) with check (true);

drop policy if exists "household data select" on public.categories;
create policy "household data select" on public.categories for select to authenticated using (public.is_household_member(household_group_id));
drop policy if exists "household data insert" on public.categories;
create policy "household data insert" on public.categories for insert to authenticated with check (public.is_household_member(household_group_id));
drop policy if exists "household data update" on public.categories;
create policy "household data update" on public.categories for update to authenticated using (public.is_household_member(household_group_id)) with check (public.is_household_member(household_group_id));
drop policy if exists "household data delete" on public.categories;
create policy "household data delete" on public.categories for delete to authenticated using (public.is_household_owner(household_group_id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array['category_budgets', 'incomes', 'savings', 'fixed_costs', 'loans', 'expenses', 'monthly_summaries']
  loop
    execute format('drop policy if exists "household data select" on public.%I', table_name);
    execute format('create policy "household data select" on public.%I for select to authenticated using (public.is_household_member(household_group_id))', table_name);
    execute format('drop policy if exists "household data insert" on public.%I', table_name);
    execute format('create policy "household data insert" on public.%I for insert to authenticated with check (public.is_household_member(household_group_id))', table_name);
    execute format('drop policy if exists "household data update" on public.%I', table_name);
    execute format('create policy "household data update" on public.%I for update to authenticated using (public.is_household_member(household_group_id)) with check (public.is_household_member(household_group_id))', table_name);
    execute format('drop policy if exists "household data delete" on public.%I', table_name);
    execute format('create policy "household data delete" on public.%I for delete to authenticated using (public.is_household_member(household_group_id))', table_name);
  end loop;
end $$;

create index if not exists idx_household_members_user_id on public.household_members(user_id);
create index if not exists idx_household_invitations_code on public.household_invitations(code);
create index if not exists idx_categories_household_group_id_kind on public.categories(household_group_id, kind);
create index if not exists idx_category_budgets_household_group_id on public.category_budgets(household_group_id);
create index if not exists idx_incomes_household_group_id on public.incomes(household_group_id);
create index if not exists idx_savings_household_group_id on public.savings(household_group_id);
create index if not exists idx_fixed_costs_household_group_id on public.fixed_costs(household_group_id);
create index if not exists idx_loans_household_group_id on public.loans(household_group_id);
create index if not exists idx_expenses_household_group_id_spent_on on public.expenses(household_group_id, spent_on);
create index if not exists idx_monthly_summaries_household_group_id on public.monthly_summaries(household_group_id);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.set_updated_at();
drop trigger if exists set_household_groups_updated_at on public.household_groups;
create trigger set_household_groups_updated_at before update on public.household_groups for each row execute function public.set_updated_at();
drop trigger if exists set_household_members_updated_at on public.household_members;
create trigger set_household_members_updated_at before update on public.household_members for each row execute function public.set_updated_at();
drop trigger if exists set_household_invitations_updated_at on public.household_invitations;
create trigger set_household_invitations_updated_at before update on public.household_invitations for each row execute function public.set_updated_at();
drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists set_category_budgets_updated_at on public.category_budgets;
create trigger set_category_budgets_updated_at before update on public.category_budgets for each row execute function public.set_updated_at();
drop trigger if exists set_incomes_updated_at on public.incomes;
create trigger set_incomes_updated_at before update on public.incomes for each row execute function public.set_updated_at();
drop trigger if exists set_savings_updated_at on public.savings;
create trigger set_savings_updated_at before update on public.savings for each row execute function public.set_updated_at();
drop trigger if exists set_fixed_costs_updated_at on public.fixed_costs;
create trigger set_fixed_costs_updated_at before update on public.fixed_costs for each row execute function public.set_updated_at();
drop trigger if exists set_loans_updated_at on public.loans;
create trigger set_loans_updated_at before update on public.loans for each row execute function public.set_updated_at();
drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();
drop trigger if exists set_monthly_summaries_updated_at on public.monthly_summaries;
create trigger set_monthly_summaries_updated_at before update on public.monthly_summaries for each row execute function public.set_updated_at();
