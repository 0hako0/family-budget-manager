alter table public.household_groups
add column if not exists invite_code text;

alter table public.household_groups
alter column invite_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

update public.household_groups
set invite_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where invite_code is null;

create unique index if not exists household_groups_invite_code_key
on public.household_groups(invite_code);

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
    case when burden_rule_value in ('fifty_fifty', 'custom', 'income_ratio') then burden_rule_value else 'fifty_fifty' end,
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

  insert into public.household_members (household_group_id, user_id, display_name, role, custom_share_ratio)
  select
    id,
    current_user_id,
    coalesce(nullif(display_name, ''), 'パートナー'),
    'member',
    least(1, greatest(0, coalesce(share_ratio_value, 0.5)))
  from public.household_groups
  where invite_code = upper(trim(code))
  on conflict (household_group_id, user_id) do nothing;
end;
$$;

grant execute on function public.create_household_group(text, text, text, numeric) to authenticated;
grant execute on function public.join_household_by_invite_code(text, text, numeric) to authenticated;
