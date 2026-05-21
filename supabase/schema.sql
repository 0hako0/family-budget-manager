create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  burden_rule text not null default 'income_ratio' check (burden_rule in ('fifty_fifty', 'custom', 'income_ratio')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_group_id uuid not null references public.household_groups(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  display_name text not null,
  role text not null default 'partner' check (role in ('self', 'partner')),
  custom_share_ratio numeric(5, 4) not null default 0.5,
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

create index if not exists idx_categories_household_group_id_kind on public.categories(household_group_id, kind);
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

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();

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
