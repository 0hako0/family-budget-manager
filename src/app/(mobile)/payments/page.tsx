import { createSharedWalletTransaction } from "@/app/actions";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import {
  getCreditCardBillingSummaries,
  getMonthlySharedWalletUsage,
  getSharedCreditCardSummary,
  getSharedWalletBalance
} from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { getTodayJSTDateString } from "@/lib/date";
import { yen } from "@/lib/format";

export default async function PaymentsPage() {
  const data = await getBudgetData();
  const referenceDate = new Date();
  const sharedWalletBalance = getSharedWalletBalance(data);
  const sharedWalletUsage = getMonthlySharedWalletUsage(data, referenceDate);
  const sharedCard = getSharedCreditCardSummary(data, referenceDate);
  const creditCardBills = getCreditCardBillingSummaries(data, referenceDate);

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">共通支払い方法</h1>
        <p className="mt-1 text-sm text-ink/60">共通財布、家計口座、共通クレカの利用状況を確認します。</p>
      </section>

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-ink">共通財布</h2>
        <div className="mt-3 rounded-2xl bg-cream/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-ink">残高</span>
            <strong className={sharedWalletBalance < 0 ? "text-warn" : "text-leaf"}>{yen(sharedWalletBalance)}</strong>
          </div>
          <p className="mt-1 text-xs font-bold text-ink/55">今月共通財布利用 {yen(sharedWalletUsage)}</p>
        </div>
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer list-none rounded-2xl border border-leaf/20 px-4 py-3 text-center text-sm font-black text-leaf">共通財布に入金する</summary>
          <form action={createSharedWalletTransaction} className="mt-3 grid gap-3 rounded-2xl bg-cream/60 p-3">
            <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
            <input type="hidden" name="memberId" value={data.currentMemberId ?? ""} />
            <input type="hidden" name="type" value="deposit" />
            <input className="mobile-input" name="amount" type="number" inputMode="numeric" placeholder="入金額" required />
            <input className="mobile-input" name="occurredOn" type="date" defaultValue={getTodayJSTDateString()} />
            <input className="mobile-input" name="memo" placeholder="メモ 例: 給料から入金" />
            <FormSubmitButton idleLabel="入金を登録" pendingLabel="登録中..." />
          </form>
        </details>
      </section>

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-ink">共通クレカ</h2>
        <div className="mt-3 rounded-2xl bg-emerald-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-ink">{sharedCard.cardName}</span>
            <strong className="text-xl text-leaf">{yen(sharedCard.amount)}</strong>
          </div>
          <p className="mt-1 text-xs font-bold text-ink/55">
            次回引き落とし予定: {yen(sharedCard.nextWithdrawalAmount)} / {sharedCard.withdrawalDate}
          </p>
          <p className="mt-1 text-xs font-bold text-ink/45">口座: {sharedCard.withdrawalAccount}</p>
        </div>
      </section>

      <section id="credit-card-bills" className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-ink">クレカ請求管理</h2>
        {creditCardBills.length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">共通クレカがまだ登録されていません。設定から追加できます。</p> : null}
        <div className="mt-3 grid gap-3">
          {creditCardBills.map((bill) => (
            <div key={bill.card.id} className="rounded-2xl bg-cream/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-ink">{bill.card.name}</p>
                  <p className="mt-1 text-xs font-bold text-ink/55">対象: {bill.billingStart.replaceAll("-", "/")}〜{bill.billingEnd.replaceAll("-", "/")}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-ink/50">次回請求</p>
                  <p className="text-lg font-black text-leaf">{yen(bill.nextBillingAmount)}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-ink/60">
                <p>今月利用 {yen(bill.monthlyUsage)}</p>
                <p>引落 {bill.withdrawalDate.replaceAll("-", "/")}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
