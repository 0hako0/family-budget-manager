-- レシート画像を保存するストレージバケットを追加する。
-- 家計データなので非公開バケットにし、オブジェクトパスの先頭セグメント（household_group_id）で
-- 家計メンバーだけがアクセスできるように制限する。パス例: {household_group_id}/{uuid}.jpg

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "household members can read receipts" on storage.objects;
create policy "household members can read receipts" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'receipts'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "household members can upload receipts" on storage.objects;
create policy "household members can upload receipts" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "household members can delete receipts" on storage.objects;
create policy "household members can delete receipts" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'receipts'
    and public.is_household_member((storage.foldername(name))[1]::uuid)
  );
