import { createLoan } from "@/app/actions";
import { Field, FormCard, inputClass } from "@/components/FormCard";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { ListSection, Table, Td } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { MobileCard, MobileCards } from "@/components/MobileCards";
import { PageHeader } from "@/components/PageHeader";
import { getBudgetData } from "@/lib/data";
import { yen } from "@/lib/format";

export default async function LoansPage({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  const monthlyTotal = data.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  const balanceTotal = data.loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);

  return (
    <div className="grid gap-6">
      <PageHeader title="ローン管理" description="固定費とは別に、ローン返済を共有管理します。" />
      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="毎月返済額合計" value={yen(monthlyTotal)} />
        <MetricCard label="残債合計" value={yen(balanceTotal)} tone="accent" />
      </section>
      <FormCard title="ローンを登録">
        <form action={createLoan} className="contents">
          <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
          <Field label="ローン名"><input className={inputClass} name="name" required /></Field>
          <Field label="毎月返済額"><input className={inputClass} name="monthlyPayment" type="number" inputMode="numeric" required /></Field>
          <Field label="支払日"><input className={inputClass} name="paidOn" type="number" inputMode="numeric" min={1} max={31} defaultValue={1} /></Field>
          <Field label="残債"><input className={inputClass} name="remainingBalance" type="number" inputMode="numeric" defaultValue={0} /></Field>
          <Field label="金利"><input className={inputClass} name="interestRate" type="number" step="0.1" defaultValue={0} /></Field>
          <Field label="完済予定日"><input className={inputClass} name="payoffDate" type="date" /></Field>
          <Field label="ボーナス払い"><select className={inputClass} name="hasBonusPayment"><option value="false">なし</option><option value="true">あり</option></select></Field>
          <Field label="メモ"><input className={inputClass} name="memo" /></Field>
          {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
          <FormSubmitButton />
        </form>
      </FormCard>
      <ListSection title="ローン一覧">
        {data.loans.length === 0 ? <p className="text-sm font-bold text-ink/60">まだ登録されていません</p> : null}
        <MobileCards>{data.loans.map((loan) => <MobileCard key={loan.id} title={loan.name} amount={yen(loan.monthlyPayment)}><p>残債 {yen(loan.remainingBalance)} / 金利 {loan.interestRate}%</p><p>{loan.memo}</p></MobileCard>)}</MobileCards>
        <Table headers={["ローン名", "毎月返済額", "支払日", "残債", "金利", "メモ"]}>{data.loans.map((loan) => <tr key={loan.id}><Td>{loan.name}</Td><Td>{yen(loan.monthlyPayment)}</Td><Td>{loan.paidOn}日</Td><Td>{yen(loan.remainingBalance)}</Td><Td>{loan.interestRate}%</Td><Td>{loan.memo}</Td></tr>)}</Table>
      </ListSection>
    </div>
  );
}
