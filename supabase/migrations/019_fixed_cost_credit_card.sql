-- 固定費を共通クレカ払いにできるようにする。
-- クレカ払いの固定費は、共通クレカの利用額・次回引き落とし予定・今月の実支出（現金ベース）
-- のいずれからも漏れていたため、支出（expenses）と同じ支払い方法の考え方を持たせる。

alter table public.fixed_costs add column if not exists payment_method_id uuid references public.common_payment_methods(id) on delete set null;
alter table public.fixed_costs add column if not exists payment_method_type text;

alter table public.fixed_costs drop constraint if exists fixed_costs_payment_method_type_check;
alter table public.fixed_costs add constraint fixed_costs_payment_method_type_check check (payment_method_type is null or payment_method_type = 'shared_credit_card');

create index if not exists idx_fixed_costs_payment_method_id on public.fixed_costs(payment_method_id);
