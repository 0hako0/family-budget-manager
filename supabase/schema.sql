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
  invite_code text unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  icon_url text,
  burden_rule text not null default 'fifty_fifty' check (burden_rule in ('fifty_fifty', 'custom', 'income_ratio')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.household_groups add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.household_groups add column if not exists invite_code text unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
alter table public.household_groups add column if not exists icon_url text;
alter table public.household_groups alter column invite_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
update public.household_groups
set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where invite_code is null;

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
update public.household_members
set role = case
  when role = 'self' then 'owner'
  when role = 'partner' then 'member'
  when role in ('owner', 'member') then role
  else 'member'
end
where role is distinct from case
  when role = 'self' then 'owner'
  when role = 'partner' then 'member'
  when role in ('owner', 'member') then role
  else 'member'
end;
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

create or replace function public.ensure_default_categories(group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if group_id is null then
    return;
  end if;

  if exists (select 1 from public.categories where household_group_id = group_id) then
    return;
  end if;

  insert into public.categories (household_group_id, kind, name, icon, color, sort_order, favorite)
  select group_id, 'expense', name, icon, color, sort_order, favorite
  from (
    values
      ('食費', '🍚', '#2f8f6b', 1, true),
      ('外食', '🍽️', '#e0984f', 2, true),
      ('日用品', '🧴', '#4b8fbe', 3, true),
      ('交通費', '🚃', '#5f7fd6', 4, false),
      ('ガソリン', '⛽', '#b7791f', 5, false),
      ('車', '🚗', '#607d8b', 6, false),
      ('医療', '💊', '#d65f7f', 7, false),
      ('美容', '✨', '#c06bcf', 8, false),
      ('服', '👕', '#6f8bd6', 9, false),
      ('趣味', '🎮', '#8a6fd6', 10, false),
      ('交際費', '🤝', '#d68b6f', 11, false),
      ('ペット', '🐾', '#7a9f52', 12, false),
      ('コンビニ', '🏪', '#2d9cdb', 13, false),
      ('カフェ', '☕', '#8b6f47', 14, false),
      ('旅行', '✈️', '#38a6a5', 15, false),
      ('プレゼント', '🎁', '#d65f9f', 16, false),
      ('その他', '・', '#7a807a', 17, false)
  ) as defaults(name, icon, color, sort_order, favorite);

  insert into public.categories (household_group_id, kind, name, icon, color, sort_order)
  select group_id, 'fixed_cost', name, icon, color, sort_order
  from (
    values
      ('家賃', '🏠', '#2f8f6b', 1),
      ('光熱費', '💡', '#e0a52f', 2),
      ('通信費', '📱', '#4b8fbe', 3),
      ('保険', '🛡️', '#607d8b', 4),
      ('サブスク', '▶️', '#8a6fd6', 5),
      ('車関連', '🚗', '#b7791f', 6),
      ('税金', '📄', '#d65f7f', 7),
      ('教育', '📚', '#5f7fd6', 8),
      ('その他', '・', '#7a807a', 9)
  ) as defaults(name, icon, color, sort_order);

  insert into public.categories (household_group_id, kind, name, icon, color, sort_order)
  select group_id, 'income', name, icon, color, sort_order
  from (
    values
      ('給与', '💼', '#2f8f6b', 1),
      ('副収入', '➕', '#4b8fbe', 2),
      ('ボーナス', '🎉', '#e0a52f', 3),
      ('臨時収入', '💰', '#7a9f52', 4),
      ('その他', '・', '#7a807a', 5)
  ) as defaults(name, icon, color, sort_order);

  insert into public.categories (household_group_id, kind, name, icon, color, sort_order)
  select group_id, 'saving', name, icon, color, sort_order
  from (
    values
      ('貯金', '🏦', '#2f8f6b', 1),
      ('NISA', '📈', '#4b8fbe', 2),
      ('投資信託', '📊', '#5f7fd6', 3),
      ('旅行積立', '✈️', '#38a6a5', 4),
      ('車費用', '🚗', '#b7791f', 5),
      ('特別費', '⭐', '#e0a52f', 6),
      ('その他', '・', '#7a807a', 7)
  ) as defaults(name, icon, color, sort_order);
end;
$$;

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

create or replace function public.is_household_creator(group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_groups
    where id = group_id
      and created_by = auth.uid()
  );
$$;

create or replace function public.create_household_group(
  group_name text,
  display_name text,
  burden_rule_value text default 'fifty_fifty',
  share_ratio_value numeric default 0.5
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  new_group_id uuid;
  new_invite_code text;
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  select email into current_email from auth.users where id = current_user_id;

  insert into public.users (id, email, display_name)
  values (current_user_id, coalesce(current_email, ''), display_name)
  on conflict (id) do update
  set display_name = excluded.display_name,
      email = excluded.email;

  insert into public.household_groups (name, invite_code, burden_rule, created_by)
  values (
    coalesce(nullif(group_name, ''), 'わが家の家計'),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
    case
      when burden_rule_value in ('fifty_fifty', 'custom', 'income_ratio') then burden_rule_value
      else 'fifty_fifty'
    end,
    current_user_id
  )
  returning id, invite_code into new_group_id, new_invite_code;

  insert into public.household_members (household_group_id, user_id, display_name, role, custom_share_ratio)
  values (
    new_group_id,
    current_user_id,
    coalesce(nullif(display_name, ''), '自分'),
    'owner',
    least(1, greatest(0, coalesce(share_ratio_value, 0.5)))
  )
  on conflict (household_group_id, user_id) do nothing;

  perform public.ensure_default_categories(new_group_id);

  return new_invite_code;
end;
$$;

create or replace function public.join_household_by_invite_code(
  code text,
  display_name text,
  share_ratio_value numeric default 0.5
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
  target_group_id uuid;
  existing_member_id uuid;
  normalized_code text := upper(regexp_replace(coalesce(code, ''), '[^a-zA-Z0-9]', '', 'g'));
  member_display_name text := coalesce(nullif(display_name, ''), 'パートナー');
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  select id into target_group_id
  from public.household_groups
  where invite_code = normalized_code
  limit 1;

  if target_group_id is null then
    raise exception '招待コードが見つかりません';
  end if;

  select email into current_email from auth.users where id = current_user_id;

  insert into public.users (id, email, display_name)
  values (current_user_id, coalesce(current_email, ''), display_name)
  on conflict (id) do update
  set display_name = excluded.display_name,
      email = excluded.email;

  select id into existing_member_id
  from public.household_members
  where household_group_id = target_group_id
    and user_id = current_user_id
  limit 1;

  if existing_member_id is null then
    insert into public.household_members (household_group_id, user_id, display_name, role, custom_share_ratio)
    values (
      target_group_id,
      current_user_id,
      member_display_name,
      'member',
      least(1, greatest(0, coalesce(share_ratio_value, 0.5)))
    );
  else
    update public.household_members
    set display_name = member_display_name,
        custom_share_ratio = least(1, greatest(0, coalesce(share_ratio_value, 0.5)))
    where id = existing_member_id;
  end if;
end;
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
using (public.is_household_member(id) or created_by = auth.uid());
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
with check (
  user_id = auth.uid()
  and (
    public.is_household_member(household_group_id)
    or public.is_household_creator(household_group_id)
  )
);
drop policy if exists "owners can manage members" on public.household_members;
create policy "owners can manage members" on public.household_members for update to authenticated using (public.is_household_owner(household_group_id)) with check (public.is_household_owner(household_group_id));

drop policy if exists "members can read invitations" on public.household_invitations;
create policy "members can read invitations" on public.household_invitations for select to authenticated using (public.is_household_member(household_group_id) or (used_at is null and expires_at > now()));
drop policy if exists "owners can create invitations" on public.household_invitations;
create policy "owners can create invitations" on public.household_invitations for insert to authenticated with check (public.is_household_owner(household_group_id));
drop policy if exists "invite users can update invitations" on public.household_invitations;
create policy "invite users can update invitations" on public.household_invitations for update to authenticated using (used_at is null and expires_at > now()) with check (true);

grant execute on function public.create_household_group(text, text, text, numeric) to authenticated;
grant execute on function public.join_household_by_invite_code(text, text, numeric) to authenticated;
grant execute on function public.ensure_default_categories(uuid) to authenticated;

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
