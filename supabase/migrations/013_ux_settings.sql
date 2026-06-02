alter table public.household_groups
add column if not exists receipt_retention_policy text not null default 'none'
check (receipt_retention_policy in ('none', '30_days', '90_days', 'forever'));

alter table public.household_groups
add column if not exists improvement_notes text not null default '';

alter table public.expenses
add column if not exists receipt_expires_at timestamptz;

alter table public.expenses
add column if not exists receipt_compressed_size integer check (receipt_compressed_size is null or receipt_compressed_size >= 0);

update public.household_groups
set receipt_retention_policy = 'none'
where receipt_retention_policy is null;

create or replace function public.cleanup_expired_receipt_refs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer;
begin
  update public.expenses
  set
    receipt_image_url = null,
    receipt_ocr_text = null,
    receipt_confidence = null,
    receipt_expires_at = null,
    receipt_compressed_size = null
  where receipt_expires_at is not null
    and receipt_expires_at < now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;
