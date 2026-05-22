import { createIncome } from "@/app/actions";
import { Field, FormCard, inputClass } from "@/components/FormCard";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { ListSection, Table, Td } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { MobileCard, MobileCards } from "@/components/MobileCards";
import { PageHeader } from "@/components/PageHeader";
import { getCategory } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { yen } from "@/lib/format";

export default async function IncomesPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  const total = data.incomes.reduce((sum, income) => sum + income.amount, 0);
  const categories = data.categories.filter((category) => category.kind === "income");

  return (
    <div className="grid gap-6">
      <PageHeader title="収入管理" description="夫婦それぞれの収入を共有データとして登録します。" />
      <MetricCard label="収入合計" value={yen(total)} tone="accent" />
      <FormCard title="収入を登録">
        <form action={createIncome} className="contents">
          <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
          <input type="hidden" name="memberId" value={data.currentMemberId ?? ""} />
          <Field label="収入名"><input className={inputClass} name="name" required /></Field>
          <Field label="金額"><input className={inputClass} name="amount" type="number" inputMode="numeric" required /></Field>
          <Field label="入金日"><input className={inputClass} name="paidOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
          <Field label="収入者"><input className={inputClass} name="earner" defaultValue={data.members[0]?.name ?? ""} /></Field>
          <Field label="カテゴリ"><select className={inputClass} name="categoryId" defaultValue=""><option value="">未選択</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
          <Field label="毎月繰り返し"><select className={inputClass} name="recurring"><option value="true">あり</option><option value="false">なし</option></select></Field>
          {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
          <FormSubmitButton />
        </form>
      </FormCard>
      <ListSection title="収入一覧">
        {data.incomes.length === 0 ? <p className="text-sm font-bold text-ink/60">まだ登録されていません</p> : null}
        <MobileCards>{data.incomes.map((income) => <MobileCard key={income.id} title={income.name} amount={yen(income.amount)}><p>{income.paidOn} / {income.earner} / {getCategory(data, income.categoryId)?.name ?? "未分類"}</p></MobileCard>)}</MobileCards>
        <Table headers={["収入名", "金額", "入金日", "収入者", "カテゴリ"]}>{data.incomes.map((income) => <tr key={income.id}><Td>{income.name}</Td><Td>{yen(income.amount)}</Td><Td>{income.paidOn}</Td><Td>{income.earner}</Td><Td>{getCategory(data, income.categoryId)?.name ?? "未分類"}</Td></tr>)}</Table>
      </ListSection>
    </div>
  );
}
