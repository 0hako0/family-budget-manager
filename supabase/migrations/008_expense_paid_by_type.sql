alter table public.expenses add column if not exists paid_by_type text not null default 'member'
  check (paid_by_type in ('member', 'shared_wallet'));

alter table public.expenses add column if not exists paid_by_user_id uuid references auth.users(id) on delete set null;

update public.expenses
set paid_by_type = 'member'
where paid_by_type is null;
