import { createFixedCost, deleteFixedCost } from "@/app/actions";
import { Field, FormCard, inputClass } from "@/components/FormCard";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { ListSection, Table, Td } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { MobileCard, MobileCards } from "@/components/MobileCards";
import { getCategory } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { yen } from "@/lib/format";

export default async function FixedCostsPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  const total = data.fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const reviewTargets = data.fixedCosts.filter((cost) => cost.reviewTarget);
  const categories = data.categories.filter((category) => category.kind === "fixed_cost");

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">固定費</h1>
        <p className="mt-1 text-sm text-ink/60">月額の固定費と見直しメモを管理します。</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="月額合計" value={yen(total)} />
        <MetricCard label="年間換算" value={yen(total * 12)} />
        <MetricCard label="見直し候補" value={`${reviewTargets.length}件`} tone="accent" />
      </section>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">固定費を登録</summary>
        <div className="mt-3">
          <FixedCostForm categories={categories} householdGroupId={data.householdGroupId} memberId={data.currentMemberId} payer={data.members[0]?.name ?? ""} />
          {searchParams?.error ? <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
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
          {data.fixedCosts.slice(0, 8).map((cost) => (
            <MobileCard key={cost.id} title={cost.name} amount={yen(cost.amount)}>
              <p>{getCategory(data, cost.categoryId)?.name ?? "未分類"} / {cost.paidOn}日 / {cost.payer}</p>
              {cost.reviewMemo ? <p>{cost.reviewMemo}</p> : null}
              <details className="mt-2 rounded-xl bg-white p-3">
                <summary className="min-h-10 cursor-pointer list-none text-xs font-bold text-leaf">編集</summary>
                <FixedCostForm categories={categories} householdGroupId={data.householdGroupId} memberId={data.currentMemberId} cost={cost} payer={cost.payer} compact />
              </details>
              <form action={deleteFixedCost}>
                <input type="hidden" name="id" value={cost.id} />
                <button className="mt-2 min-h-10 rounded-xl bg-red-50 px-3 text-xs font-bold text-warn transition active:scale-[0.98]" type="submit">削除</button>
              </form>
            </MobileCard>
          ))}
        </MobileCards>
        <Table headers={["名称", "金額", "支払日", "カテゴリ", "メモ"]}>{data.fixedCosts.map((cost) => <tr key={cost.id}><Td>{cost.name}</Td><Td>{yen(cost.amount)}</Td><Td>{cost.paidOn}日</Td><Td>{getCategory(data, cost.categoryId)?.name ?? "未分類"}</Td><Td>{cost.reviewMemo ?? ""}</Td></tr>)}</Table>
      </ListSection>
    </div>
  );
}

function FixedCostForm({ categories, householdGroupId, memberId, payer, cost, compact = false }: {
  categories: Array<{ id: string; name: string }>;
  householdGroupId?: string;
  memberId?: string;
  payer: string;
  compact?: boolean;
  cost?: { id: string; name: string; amount: number; paidOn: number; payer: string; categoryId: string; reviewTarget: boolean; reviewMemo?: string };
}) {
  return (
    <FormCard title={compact ? "編集" : "入力"}>
      <form action={createFixedCost} className="contents">
        <input type="hidden" name="id" value={cost?.id ?? ""} />
        <input type="hidden" name="householdGroupId" value={householdGroupId ?? ""} />
        <input type="hidden" name="memberId" value={memberId ?? ""} />
        <Field label="名称"><input className={inputClass} name="name" defaultValue={cost?.name ?? ""} required /></Field>
        <Field label="金額"><input className={inputClass} name="amount" type="number" inputMode="numeric" defaultValue={cost?.amount ?? ""} required /></Field>
        <Field label="支払日"><input className={inputClass} name="paidOn" type="number" inputMode="numeric" min={1} max={31} defaultValue={cost?.paidOn ?? 1} /></Field>
        <Field label="支払者"><input className={inputClass} name="payer" defaultValue={payer} /></Field>
        <Field label="カテゴリ"><select className={inputClass} name="categoryId" defaultValue={cost?.categoryId ?? ""}><option value="">未選択</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
        <Field label="見直しメモ"><input className={inputClass} name="reviewMemo" defaultValue={cost?.reviewMemo ?? ""} /></Field>
        <label className="flex min-h-11 items-center gap-3 rounded-2xl bg-cream/60 px-3 text-sm font-bold text-ink">
          <input name="reviewTarget" type="checkbox" defaultChecked={cost?.reviewTarget ?? false} />
          見直し対象にする
        </label>
        <FormSubmitButton idleLabel={cost ? "更新する" : "登録する"} pendingLabel="保存中..." />
      </form>
    </FormCard>
  );
}
