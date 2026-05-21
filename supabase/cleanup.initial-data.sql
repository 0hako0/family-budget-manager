-- Remove only the initial development sample records that were inserted by older schema.sql versions.
-- This file is safe to run in Supabase SQL Editor when you want a clean production database.

delete from public.monthly_summaries
where household_group_id = '10000000-0000-0000-0000-000000000001';

delete from public.expenses
where household_group_id = '10000000-0000-0000-0000-000000000001';

delete from public.loans
where household_group_id = '10000000-0000-0000-0000-000000000001';

delete from public.fixed_costs
where household_group_id = '10000000-0000-0000-0000-000000000001';

delete from public.savings
where household_group_id = '10000000-0000-0000-0000-000000000001';

delete from public.incomes
where household_group_id = '10000000-0000-0000-0000-000000000001';

delete from public.categories
where household_group_id = '10000000-0000-0000-0000-000000000001';

delete from public.household_members
where household_group_id = '10000000-0000-0000-0000-000000000001';

delete from public.household_groups
where id = '10000000-0000-0000-0000-000000000001';

delete from public.users
where id in (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
)
or email in ('husband@example.com', 'wife@example.com');
