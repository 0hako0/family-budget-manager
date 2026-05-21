import { Field, FormCard, inputClass } from "@/components/FormCard";
import { ListSection, Table, Td } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { MobileCard, MobileCards } from "@/components/MobileCards";
import { getCategory } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { yen } from "@/lib/format";

export default async function FixedCostsPage() {
  const data = await getBudgetData();
  const total = data.fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const reviewTargets = data.fixedCosts.filter((cost) => cost.reviewTarget);

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">固定費</h1>
        <p className="mt-1 text-sm text-ink/60">Supabaseに登録された固定費だけを表示します。</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="月額合計" value={yen(total)} />
        <MetricCard label="年間換算" value={yen(total * 12)} />
        <MetricCard label="見直し候補" value={`${reviewTargets.length}件`} tone="accent" />
      </section>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">固定費を登録</summary>
        <div className="mt-3">
          <FormCard title="入力">
            <Field label="名称"><input className={inputClass} /></Field>
            <Field label="金額"><input className={inputClass} type="number" inputMode="numeric" /></Field>
            <Field label="支払日"><input className={inputClass} type="number" inputMode="numeric" min={1} max={31} /></Field>
            <Field label="支払者"><input className={inputClass} /></Field>
            <Field label="カテゴリ">
              <select className={inputClass}>
                {data.categories
                  .filter((category) => category.kind === "fixed_cost")
                  .map((category) => (
                    <option key={category.id}>{category.name}</option>
                  ))}
              </select>
            </Field>
            <Field label="見直しメモ"><input className={inputClass} /></Field>
          </FormCard>
        </div>
      </details>

      <ListSection title="見直しメモ">
        {reviewTargets.length === 0 ? <p className="text-sm font-bold text-ink/60">まだ登録されていません</p> : null}
        <div className="grid gap-2">
          {reviewTargets.slice(0, 3).map((cost) => (
            <div key={cost.id} className="rounded-2xl bg-cream/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-ink">{cost.name}</p>
                <p className="font-black text-ink">{yen(cost.amount)}</p>
              </div>
              <p className="mt-1 text-sm text-ink/60">{cost.reviewMemo}</p>
            </div>
          ))}
        </div>
      </ListSection>

      <ListSection title="固定費一覧">
        {data.fixedCosts.length === 0 ? <p className="text-sm font-bold text-ink/60">まだ登録されていません</p> : null}
        <MobileCards>
          {data.fixedCosts.slice(0, 5).map((cost) => (
            <MobileCard key={cost.id} title={cost.name} amount={yen(cost.amount)}>
              <p>{getCategory(data, cost.categoryId)?.name} / {cost.paidOn}日 / {cost.payer}</p>
              {cost.reviewMemo ? <p>{cost.reviewMemo}</p> : null}
            </MobileCard>
          ))}
        </MobileCards>
        <Table headers={["名称", "金額", "支払日", "カテゴリ", "メモ"]}>
          {data.fixedCosts.map((cost) => (
            <tr key={cost.id}>
              <Td>{cost.name}</Td>
              <Td>{yen(cost.amount)}</Td>
              <Td>{cost.paidOn}日</Td>
              <Td>{getCategory(data, cost.categoryId)?.name}</Td>
              <Td>{cost.reviewMemo ?? ""}</Td>
            </tr>
          ))}
        </Table>
      </ListSection>
    </div>
  );
}
