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

  perform public.ensure_default_categories(new_group_id);

  return new_invite_code;
end;
$$;

do $$
declare
  group_record record;
begin
  for group_record in select id from public.household_groups loop
    perform public.ensure_default_categories(group_record.id);
  end loop;
end $$;

grant execute on function public.ensure_default_categories(uuid) to authenticated;
grant execute on function public.create_household_group(text, text, text, numeric) to authenticated;
