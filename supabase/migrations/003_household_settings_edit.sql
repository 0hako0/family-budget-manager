alter table public.household_groups
add column if not exists icon_url text;

drop policy if exists "members can update own member settings" on public.household_members;
create policy "members can update own member settings"
on public.household_members
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_household_owner(household_group_id)
)
with check (
  user_id = auth.uid()
  or public.is_household_owner(household_group_id)
);
