create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('household_groups', 'household_invitations')
      and (
        lower(btrim(coalesce(qual, ''))) in ('true', '(true)')
        or lower(btrim(coalesce(with_check, ''))) in ('true', '(true)')
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

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
create policy "owners can update groups" on public.household_groups
for update
to authenticated
using (public.is_household_owner(id))
with check (public.is_household_owner(id));

drop policy if exists "members can read invitations" on public.household_invitations;
create policy "members can read invitations" on public.household_invitations
for select
to authenticated
using (public.is_household_member(household_group_id));

drop policy if exists "owners can create invitations" on public.household_invitations;
create policy "owners can create invitations" on public.household_invitations
for insert
to authenticated
with check (public.is_household_owner(household_group_id));

drop policy if exists "invite users can update invitations" on public.household_invitations;
create policy "invite users can update invitations" on public.household_invitations
for update
to authenticated
using (public.is_household_member(household_group_id) and used_at is null and expires_at > now())
with check (public.is_household_member(household_group_id));

revoke execute on function public.set_updated_at() from public, anon;
revoke execute on function public.create_household_group(text, text, text, numeric) from public, anon;
revoke execute on function public.join_household_by_invite_code(text, text, numeric) from public, anon;
revoke execute on function public.ensure_default_categories(uuid) from public, anon;
revoke execute on function public.cleanup_expired_receipt_refs() from public, anon;
revoke execute on function public.is_household_member(uuid) from public, anon;
revoke execute on function public.is_household_owner(uuid) from public, anon;
revoke execute on function public.is_household_creator(uuid) from public, anon;

grant execute on function public.create_household_group(text, text, text, numeric) to authenticated;
grant execute on function public.join_household_by_invite_code(text, text, numeric) to authenticated;
grant execute on function public.ensure_default_categories(uuid) to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;
grant execute on function public.is_household_creator(uuid) to authenticated;
