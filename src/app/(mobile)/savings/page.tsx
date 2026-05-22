import { createSaving, deleteSaving } from "@/app/actions";
import { Field, FormCard, inputClass } from "@/components/FormCard";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { ListSection, Table, Td } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { MobileCard, MobileCards } from "@/components/MobileCards";
import { PageHeader } from "@/components/PageHeader";
import { getCategory } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { yen } from "@/lib/format";
import type { Saving } from "@/lib/types";

function SavingForm({
  householdGroupId,
  categories,
  saving
}: {
  householdGroupId?: string;
  categories: { id: string; name: string }[];
  saving?: Saving;
}) {
  return (
    <form action={createSaving} className="contents">
      <input type="hidden" name="householdGroupId" value={householdGroupId ?? ""} />
      {saving ? <input type="hidden" name="id" value={saving.id} /> : null}
      <Field label="名称">
        <input className={inputClass} name="name" defaultValue={saving?.name} required />
      </Field>
      <Field label="金額">
        <input
          className={inputClass}
          name="amount"
          type="number"
          inputMode="numeric"
          defaultValue={saving?.amount}
          required
        />
      </Field>
      <Field label="カテゴリ">
        <select className={inputClass} name="categoryId" defaultValue={saving?.categoryId ?? ""}>
          <option value="">未選択</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="毎月繰り返し">
        <select className={inputClass} name="recurring" defaultValue={String(saving?.recurring ?? true)}>
          <option value="true">あり</option>
          <option value="false">なし</option>
        </select>
      </Field>
      <FormSubmitButton idleLabel={saving ? "変更を保存" : "登録する"} pendingLabel="保存中..." />
    </form>
  );
}

export default async function SavingsPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  const total = data.savings.reduce((sum, saving) => sum + saving.amount, 0);
  const categories = data.categories.filter((category) => category.kind === "saving" && !category.archived);

  return (
    <div className="grid gap-6">
      <PageHeader title="貯金・投資管理" description="収入から先に差し引く貯金やNISAを共有管理します。" />

      <MetricCard label="貯金・投資合計" value={yen(total)} tone="accent" />

      <FormCard title="貯金・投資を登録">
        <SavingForm householdGroupId={data.householdGroupId} categories={categories} />
        {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
      </FormCard>

      <ListSection title="貯金・投資一覧">
        {data.savings.length === 0 ? <p className="text-sm font-bold text-ink/60">まだ登録されていません</p> : null}
        <MobileCards>
          {data.savings.map((saving) => (
            <MobileCard key={saving.id} title={saving.name} amount={yen(saving.amount)}>
              <p>{getCategory(data, saving.categoryId)?.name ?? "未分類"}</p>
              <details className="mt-3 rounded-2xl bg-cream/70 p-3">
                <summary className="cursor-pointer text-sm font-bold text-leaf">編集する</summary>
                <div className="mt-3 grid gap-4">
                  <SavingForm householdGroupId={data.householdGroupId} categories={categories} saving={saving} />
                </div>
              </details>
              <form action={deleteSaving}>
                <input type="hidden" name="id" value={saving.id} />
                <button
                  className="mt-3 min-h-11 rounded-xl bg-red-50 px-4 text-sm font-bold text-warn transition active:scale-[0.98]"
                  type="submit"
                >
                  削除
                </button>
              </form>
            </MobileCard>
          ))}
        </MobileCards>
        <Table headers={["名称", "金額", "カテゴリ"]}>
          {data.savings.map((saving) => (
            <tr key={saving.id}>
              <Td>{saving.name}</Td>
              <Td>{yen(saving.amount)}</Td>
              <Td>{getCategory(data, saving.categoryId)?.name ?? "未分類"}</Td>
            </tr>
          ))}
        </Table>
      </ListSection>
    </div>
  );
}
