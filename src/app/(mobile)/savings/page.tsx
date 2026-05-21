import { Field, FormCard, inputClass } from "@/components/FormCard";
import { ListSection, Table, Td } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { MobileCard, MobileCards } from "@/components/MobileCards";
import { PageHeader } from "@/components/PageHeader";
import { getCategory } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { yen } from "@/lib/format";

export default async function SavingsPage() {
  const data = await getBudgetData();
  const total = data.savings.reduce((sum, saving) => sum + saving.amount, 0);

  return (
    <div className="grid gap-6">
      <PageHeader title="先取り貯金・投資管理" description="Supabaseに登録された貯金・投資だけを表示します。" />
      <MetricCard label="先取り貯金・投資合計" value={yen(total)} tone="accent" />
      <FormCard title="貯金・投資を登録">
        <Field label="名称"><input className={inputClass} /></Field>
        <Field label="金額"><input className={inputClass} type="number" inputMode="numeric" /></Field>
        <Field label="カテゴリ"><select className={inputClass}>{data.categories.filter((c) => c.kind === "saving").map((category) => <option key={category.id}>{category.name}</option>)}</select></Field>
        <Field label="毎月繰り返し"><select className={inputClass}><option>あり</option><option>なし</option></select></Field>
      </FormCard>
      <ListSection title="先取り貯金・投資一覧">
        {data.savings.length === 0 ? <p className="text-sm font-bold text-ink/60">まだ登録されていません</p> : null}
        <MobileCards>
          {data.savings.map((saving) => (
            <MobileCard key={saving.id} title={saving.name} amount={yen(saving.amount)}>
              <p>{getCategory(data, saving.categoryId)?.name}</p>
              <p>毎月繰り返し: {saving.recurring ? "あり" : "なし"}</p>
            </MobileCard>
          ))}
        </MobileCards>
        <Table headers={["名称", "金額", "カテゴリ", "繰り返し"]}>
          {data.savings.map((saving) => (
            <tr key={saving.id}><Td>{saving.name}</Td><Td>{yen(saving.amount)}</Td><Td>{getCategory(data, saving.categoryId)?.name}</Td><Td>{saving.recurring ? "あり" : "なし"}</Td></tr>
          ))}
        </Table>
      </ListSection>
    </div>
  );
}
