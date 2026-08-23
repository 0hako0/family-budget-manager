-- 固定項目（収入・貯金・固定費・ローン）に適用期間を持たせる。
-- これまでは recurring の値に関係なく、登録済みの項目が過去・未来のすべての月に
-- 計上されていたため、単発の項目や、登録前の月のレポートが実態とずれていた。

alter table public.incomes add column if not exists starts_on date;
alter table public.incomes add column if not exists ends_on date;
alter table public.savings add column if not exists starts_on date;
alter table public.savings add column if not exists ends_on date;
alter table public.fixed_costs add column if not exists starts_on date;
alter table public.fixed_costs add column if not exists ends_on date;
alter table public.loans add column if not exists starts_on date;
alter table public.loans add column if not exists ends_on date;

-- 既存データは「登録した月から適用」とみなす。収入は入金日のほうが早ければそちらを優先する。
update public.incomes
set starts_on = least(paid_on, date_trunc('month', created_at)::date)
where starts_on is null;

update public.savings
set starts_on = date_trunc('month', created_at)::date
where starts_on is null;

update public.fixed_costs
set starts_on = date_trunc('month', created_at)::date
where starts_on is null;

update public.loans
set starts_on = date_trunc('month', created_at)::date
where starts_on is null;

alter table public.incomes drop constraint if exists incomes_active_period_check;
alter table public.incomes add constraint incomes_active_period_check check (ends_on is null or starts_on is null or ends_on >= starts_on);
alter table public.savings drop constraint if exists savings_active_period_check;
alter table public.savings add constraint savings_active_period_check check (ends_on is null or starts_on is null or ends_on >= starts_on);
alter table public.fixed_costs drop constraint if exists fixed_costs_active_period_check;
alter table public.fixed_costs add constraint fixed_costs_active_period_check check (ends_on is null or starts_on is null or ends_on >= starts_on);
alter table public.loans drop constraint if exists loans_active_period_check;
alter table public.loans add constraint loans_active_period_check check (ends_on is null or starts_on is null or ends_on >= starts_on);
