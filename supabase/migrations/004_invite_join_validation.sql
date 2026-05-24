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
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  select id into target_group_id
  from public.household_groups
  where invite_code = upper(trim(code))
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

  insert into public.household_members (household_group_id, user_id, display_name, role, custom_share_ratio)
  values (
    target_group_id,
    current_user_id,
    coalesce(nullif(display_name, ''), 'パートナー'),
    'member',
    least(1, greatest(0, coalesce(share_ratio_value, 0.5)))
  )
  on conflict (household_group_id, user_id) do update
  set display_name = excluded.display_name,
      custom_share_ratio = excluded.custom_share_ratio;
end;
$$;

grant execute on function public.join_household_by_invite_code(text, text, numeric) to authenticated;
