import { Field, FormCard, inputClass } from "@/components/FormCard";
import { ListSection, Table, Td } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { MobileCard, MobileCards } from "@/components/MobileCards";
import { PageHeader } from "@/components/PageHeader";
import { getCategory } from "@/lib/budget";
import { yen } from "@/lib/format";
import { budgetData } from "@/lib/mock-data";

export default function IncomesPage() {
  const total = budgetData.incomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="grid gap-6">
      <PageHeader title="収入管理" description="夫婦それぞれの収入を登録し、今月の家計原資を確認します。" />
      <MetricCard label="収入合計" value={yen(total)} tone="accent" />
      <FormCard title="収入を登録">
        <Field label="収入名"><input className={inputClass} placeholder="夫の給与" /></Field>
        <Field label="金額"><input className={inputClass} type="number" inputMode="numeric" placeholder="300000" /></Field>
        <Field label="入金日"><input className={inputClass} type="date" /></Field>
        <Field label="収入者"><input className={inputClass} placeholder="夫" /></Field>
        <Field label="カテゴリ"><select className={inputClass}>{budgetData.categories.filter((c) => c.kind === "income").map((category) => <option key={category.id}>{category.name}</option>)}</select></Field>
        <Field label="毎月繰り返し"><select className={inputClass}><option>あり</option><option>なし</option></select></Field>
      </FormCard>
      <ListSection title="収入一覧">
        <MobileCards>
          {budgetData.incomes.map((income) => (
            <MobileCard key={income.id} title={income.name} amount={yen(income.amount)}>
              <p>{income.paidOn} / {income.earner} / {getCategory(budgetData, income.categoryId)?.name}</p>
              <p>毎月繰り返し: {income.recurring ? "あり" : "なし"}</p>
            </MobileCard>
          ))}
        </MobileCards>
        <Table headers={["収入名", "金額", "入金日", "収入者", "カテゴリ", "繰り返し"]}>
          {budgetData.incomes.map((income) => (
            <tr key={income.id}><Td>{income.name}</Td><Td>{yen(income.amount)}</Td><Td>{income.paidOn}</Td><Td>{income.earner}</Td><Td>{getCategory(budgetData, income.categoryId)?.name}</Td><Td>{income.recurring ? "あり" : "なし"}</Td></tr>
          ))}
        </Table>
      </ListSection>
    </div>
  );
}
