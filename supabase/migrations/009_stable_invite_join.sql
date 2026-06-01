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
    raise exception 'ログイン状態を確認できませんでした。もう一度ログインしてください。';
  end if;

  if normalized_code = '' then
    raise exception '家計コードを入力してください。';
  end if;

  select id into target_group_id
  from public.household_groups
  where invite_code = normalized_code
  limit 1;

  if target_group_id is null then
    raise exception '家計コードが見つかりません。コードを確認してください。';
  end if;

  select id into existing_member_id
  from public.household_members
  where household_group_id = target_group_id
    and user_id = current_user_id
  limit 1;

  select email into current_email from auth.users where id = current_user_id;

  insert into public.users (id, email, display_name)
  values (current_user_id, coalesce(current_email, ''), member_display_name)
  on conflict (id) do update
  set display_name = excluded.display_name,
      email = excluded.email;

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

grant execute on function public.join_household_by_invite_code(text, text, numeric) to authenticated;
