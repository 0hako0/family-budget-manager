import { createSaving } from "@/app/actions";
import { Field, FormCard, inputClass } from "@/components/FormCard";
import { ListSection, Table, Td } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { MobileCard, MobileCards } from "@/components/MobileCards";
import { PageHeader } from "@/components/PageHeader";
import { getCategory } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { yen } from "@/lib/format";

export default async function SavingsPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  const total = data.savings.reduce((sum, saving) => sum + saving.amount, 0);
  const categories = data.categories.filter((category) => category.kind === "saving");

  return (
    <div className="grid gap-6">
      <PageHeader title="貯金・投資管理" description="収入から先に差し引く貯金・投資を共有します。" />
      <MetricCard label="貯金・投資合計" value={yen(total)} tone="accent" />
      <FormCard title="貯金・投資を登録">
        <form action={createSaving} className="contents">
          <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
          <Field label="名称"><input className={inputClass} name="name" required /></Field>
          <Field label="金額"><input className={inputClass} name="amount" type="number" inputMode="numeric" required /></Field>
          <Field label="カテゴリ"><select className={inputClass} name="categoryId" defaultValue=""><option value="">未選択</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
          <Field label="毎月繰り返し"><select className={inputClass} name="recurring"><option value="true">あり</option><option value="false">なし</option></select></Field>
          {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
          <button className="min-h-12 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white" type="submit">登録する</button>
        </form>
      </FormCard>
      <ListSection title="貯金・投資一覧">
        {data.savings.length === 0 ? <p className="text-sm font-bold text-ink/60">まだ登録されていません</p> : null}
        <MobileCards>{data.savings.map((saving) => <MobileCard key={saving.id} title={saving.name} amount={yen(saving.amount)}><p>{getCategory(data, saving.categoryId)?.name ?? "未分類"}</p></MobileCard>)}</MobileCards>
        <Table headers={["名称", "金額", "カテゴリ"]}>{data.savings.map((saving) => <tr key={saving.id}><Td>{saving.name}</Td><Td>{yen(saving.amount)}</Td><Td>{getCategory(data, saving.categoryId)?.name ?? "未分類"}</Td></tr>)}</Table>
      </ListSection>
    </div>
  );
}
