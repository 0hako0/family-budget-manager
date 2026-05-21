import { Field, FormCard, inputClass } from "@/components/FormCard";
import { ListSection, Table, Td } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { MobileCard, MobileCards } from "@/components/MobileCards";
import { PageHeader } from "@/components/PageHeader";
import { yen } from "@/lib/format";
import { budgetData } from "@/lib/mock-data";

export default function LoansPage() {
  const monthlyTotal = budgetData.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  const balanceTotal = budgetData.loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);

  return (
    <div className="grid gap-6">
      <PageHeader title="ローン管理" description="住宅、車、奨学金、カード分割などを固定費とは別に管理します。" />
      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="毎月返済額合計" value={yen(monthlyTotal)} />
        <MetricCard label="残債合計" value={yen(balanceTotal)} tone="accent" />
      </section>
      <FormCard title="ローンを登録">
        <Field label="ローン名"><input className={inputClass} placeholder="車ローン" /></Field>
        <Field label="毎月返済額"><input className={inputClass} type="number" inputMode="numeric" placeholder="42000" /></Field>
        <Field label="支払日"><input className={inputClass} type="number" inputMode="numeric" min={1} max={31} placeholder="26" /></Field>
        <Field label="残債"><input className={inputClass} type="number" inputMode="numeric" placeholder="1340000" /></Field>
        <Field label="金利"><input className={inputClass} type="number" step="0.1" placeholder="2.1" /></Field>
        <Field label="完済予定日"><input className={inputClass} type="date" /></Field>
        <Field label="ボーナス払い"><select className={inputClass}><option>あり</option><option>なし</option></select></Field>
        <Field label="メモ"><input className={inputClass} placeholder="ボーナス月の追加返済など" /></Field>
      </FormCard>
      <ListSection title="ローン一覧">
        <MobileCards>
          {budgetData.loans.map((loan) => (
            <MobileCard key={loan.id} title={loan.name} amount={yen(loan.monthlyPayment)}>
              <p>残債 {yen(loan.remainingBalance)} / 金利 {loan.interestRate}%</p>
              <p>完済予定 {loan.payoffDate} / ボーナス払い {loan.hasBonusPayment ? "あり" : "なし"}</p>
            </MobileCard>
          ))}
        </MobileCards>
        <Table headers={["ローン名", "毎月返済額", "支払日", "残債", "金利", "完済予定日", "ボーナス", "メモ"]}>
          {budgetData.loans.map((loan) => (
            <tr key={loan.id}><Td>{loan.name}</Td><Td>{yen(loan.monthlyPayment)}</Td><Td>{loan.paidOn}日</Td><Td>{yen(loan.remainingBalance)}</Td><Td>{loan.interestRate}%</Td><Td>{loan.payoffDate}</Td><Td>{loan.hasBonusPayment ? "あり" : "なし"}</Td><Td>{loan.memo}</Td></tr>
          ))}
        </Table>
      </ListSection>
    </div>
  );
}
