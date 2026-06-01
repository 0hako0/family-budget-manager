alter table public.expenses add column if not exists location text;
alter table public.expenses add column if not exists receipt_image_url text;
alter table public.expenses add column if not exists receipt_ocr_text text;
alter table public.expenses add column if not exists receipt_confidence numeric;

alter table public.household_groups add column if not exists save_receipt_images boolean not null default false;
