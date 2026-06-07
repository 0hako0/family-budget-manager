revoke execute on function public.ensure_default_categories(uuid) from authenticated;
revoke execute on function public.cleanup_expired_receipt_refs() from authenticated;

comment on function public.ensure_default_categories(uuid) is
  'Internal helper called by create_household_group. Direct authenticated RPC execution is intentionally disabled.';

comment on function public.cleanup_expired_receipt_refs() is
  'Maintenance helper for receipt metadata cleanup. Direct authenticated RPC execution is intentionally disabled.';

comment on function public.create_household_group(text, text, text, numeric) is
  'SECURITY DEFINER is required to create a household group, owner membership, user profile, and default categories atomically while RLS is enabled. The function checks auth.uid().';

comment on function public.join_household_by_invite_code(text, text, numeric) is
  'SECURITY DEFINER is required so a signed-in user can join by invite_code without being able to broadly read other household groups. The function checks auth.uid() and inserts only the caller as a member.';

comment on function public.is_household_member(uuid) is
  'SECURITY DEFINER is required for RLS policies to check membership without recursive household_members policy evaluation. The function is scoped to auth.uid().';

comment on function public.is_household_owner(uuid) is
  'SECURITY DEFINER is required for RLS policies to check owner role without recursive household_members policy evaluation. The function is scoped to auth.uid().';

comment on function public.is_household_creator(uuid) is
  'SECURITY DEFINER is used during first owner membership creation while RLS is enabled. The function is scoped to auth.uid().';
