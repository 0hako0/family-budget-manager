-- レシートOCRで読み取った商品明細（商品名・金額）を支出に紐づけて保存する。
-- 1件の支出につき明細は少数なので、別テーブルにはせずJSONBで持つ。

alter table public.expenses
add column if not exists receipt_items jsonb not null default '[]'::jsonb;

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
    receipt_compressed_size = null,
    receipt_items = '[]'::jsonb
  where receipt_expires_at is not null
    and receipt_expires_at < now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;
