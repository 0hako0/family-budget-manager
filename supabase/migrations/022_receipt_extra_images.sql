-- 長いレシートを複数枚に分けて撮影した場合の、2枚目以降の画像パスを保存する。
-- 1枚目は既存の receipt_image_url を使い続け、これは「続きの写真」のみを保持する。

alter table public.expenses
add column if not exists receipt_extra_image_urls text[] not null default '{}'::text[];

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
    receipt_extra_image_urls = '{}'::text[],
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
