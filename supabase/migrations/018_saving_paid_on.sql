-- 積立に引き落とし日を持たせる。
-- これまで引き落とし日がなく、支払予定では月初日として扱っていたため、
-- 「次の支払予定」に毎月1日しか並ばなかった。

alter table public.savings add column if not exists paid_on integer not null default 1;

alter table public.savings drop constraint if exists savings_paid_on_check;
alter table public.savings add constraint savings_paid_on_check check (paid_on between 1 and 31);
