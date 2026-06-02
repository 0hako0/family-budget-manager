import Link from "next/link";
import { createSharedWalletTransaction } from "@/app/actions";
import { CategoryBudgetList } from "@/components/CategoryBudgetList";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { MetricCard } from "@/components/MetricCard";
import { MonthlySnapshotRunner } from "@/components/MonthlySnapshotRunner";
import {
  getBudgetConsumption,
  getCreditCardBillingSummaries,
  getMemberBurdenShares,
  getMonthlyCategoryBudgetProgress,
  getMonthlyPayerBreakdown,
  getMonthlySharedWalletUsage,
  getNextIncome,
  getRemainingDays,
  getSharedCreditCardSummary,
  getSharedWalletBalance,
  getSubscriptionCandidates,
  getUpcomingPayments,
  getTotals
} from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { getCurrentMonthPeriodJST, getTodayJSTDateString } from "@/lib/date";
import { yen } from "@/lib/format";
import type { BudgetData } from "@/lib/types";

export default async function Home({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  const period = getCurrentMonthPeriodJST();
  const referenceDate = new Date();
  const totals = getTotals(data, referenceDate);
  const remainingDays = getRemainingDays(referenceDate);
  const budgetUsage = getMonthlyCategoryBudgetProgress(data, referenceDate).slice(0, 3);
  const shares = getMemberBurdenShares(data);
  const nextIncome = getNextIncome(data, referenceDate);
  const consumption = getBudgetConsumption(data, referenceDate);
  const consumptionPercent = Math.round(consumption.rate * 100);
  const consumptionTone = consumption.rate >= 1 ? "bg-warn" : consumption.rate >= 0.8 ? "bg-amber-400" : "bg-leaf";
  const payerBreakdown = getMonthlyPayerBreakdown(data, referenceDate);
  const sharedWalletBalance = getSharedWalletBalance(data);
  const sharedWalletUsage = getMonthlySharedWalletUsage(data, referenceDate);
  const sharedCard = getSharedCreditCardSummary(data, referenceDate);
  const creditCardBills = getCreditCardBillingSummaries(data, referenceDate);
  const upcomingPayments = getUpcomingPayments(data, referenceDate);
  const subscriptionCandidates = getSubscriptionCandidates(data);
  const widgets = data.settings.homeWidgets;

  return (
    <div className="grid gap-5">
      <MonthlySnapshotRunner enabled={Boolean(data.householdGroupId)} />
      {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}

      <section className="rounded-[22px] border border-leaf/20 bg-white p-5 shadow-soft">
        <p className="text-xs font-bold text-leaf">{period.monthLabel}</p>
        <p className="mt-1 text-[11px] font-bold text-ink/45">期間: {period.startLabel}〜{period.endLabel}</p>
        <p className="mt-3 text-sm font-bold text-ink/60">今月あと使える金額</p>
        <p className="mt-2 text-5xl font-black tracking-normal text-ink">{yen(totals.remainingBudget)}</p>
        <div className="mt-5 grid gap-3">
          <div className="rounded-2xl bg-cream/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink">今月予算消化率</p>
              <p className={consumption.rate >= 1 ? "text-xl font-black text-warn" : "text-xl font-black text-leaf"}>{consumptionPercent}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className={`h-full rounded-full ${consumptionTone}`} style={{ width: `${Math.min(100, consumptionPercent)}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink/55">使用済み: {yen(consumption.used)} / 今月の収入予定 {yen(consumption.plannedIncome)}</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm font-bold text-leaf">今日使える目安</p>
            <p className="mt-1 text-2xl font-black text-ink">{yen(totals.dailyGuide)}</p>
            <p className="mt-1 text-xs text-ink/55">残り{remainingDays}日で自動計算</p>
          </div>
          {widgets.monthEnd ? (
            <div className={totals.budgetBasedLanding < 0 ? "rounded-2xl bg-red-50 p-4 text-warn" : "rounded-2xl bg-cream/70 p-4 text-leaf"}>
              <p className="text-sm font-bold">月末見込み</p>
              <p className="mt-1 text-xl font-black">{totals.budgetBasedLanding >= 0 ? "+" : ""}{yen(totals.budgetBasedLanding)}</p>
              <p className="mt-1 text-xs text-ink/55">現在ペースの場合 {totals.paceBasedLanding >= 0 ? "+" : ""}{yen(totals.paceBasedLanding)}</p>
              {totals.isEarlyMonthForecast ? <p className="mt-2 text-xs font-bold text-ink/60">月初は現在ペース予測が大きくブレます。予算ベースで表示しています。</p> : null}
            </div>
          ) : null}
        </div>
        {widgets.incomeSchedule ? (
          <div className="mt-4 grid gap-1 rounded-2xl bg-cream/60 p-3 text-xs font-bold text-ink/60">
            <p>入金予定: {yen(totals.incomeTotal)}</p>
            <p>入金済み: {yen(totals.paidIncomeTotal)}</p>
            <p>次の入金日: {nextIncome ? nextIncome.paidOn.replaceAll("-", "/") : "予定なし"}</p>
          </div>
        ) : null}
        <Link href="/expenses" prefetch className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-sm transition active:scale-[0.98]">
          支出を入力
        </Link>
      </section>

      {widgets.sharedWallet ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-ink">共通支払い方法</h2>
          <div className="mt-3 grid gap-3">
            <div className="rounded-2xl bg-cream/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">共通財布残高</span>
                <strong className={sharedWalletBalance < 0 ? "text-warn" : "text-leaf"}>{yen(sharedWalletBalance)}</strong>
              </div>
              <p className="mt-1 text-xs font-bold text-ink/55">今月共通財布利用 {yen(sharedWalletUsage)}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ink">共通クレカ利用額</span>
                <strong className="text-leaf">{yen(sharedCard.amount)}</strong>
              </div>
              <p className="mt-1 text-xs font-bold text-ink/55">次回引き落とし予定: {yen(sharedCard.nextWithdrawalAmount)} / 引き落とし日: {sharedCard.withdrawalDate}</p>
              <p className="mt-1 text-xs font-bold text-ink/45">{sharedCard.cardName} / 口座: {sharedCard.withdrawalAccount}</p>
            </div>
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
      ) : null}

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-ink">今後の支払予定</h2>
        {upcomingPayments.length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">直近の予定はありません</p> : null}
        <div className="mt-3 grid gap-2">
          {upcomingPayments.map((item) => (
            <div key={`${item.type}-${item.date}-${item.label}`} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/60 px-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-black text-ink">{item.label}</p>
                <p className="text-xs font-bold text-ink/50">{item.date.replaceAll("-", "/")}</p>
              </div>
              <strong className={item.tone === "income" ? "shrink-0 text-leaf" : "shrink-0 text-warn"}>{item.tone === "income" ? "+" : "-"}{yen(item.amount)}</strong>
            </div>
          ))}
        </div>
      </section>

      {creditCardBills.length > 0 ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-ink">クレカ請求管理</h2>
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
      ) : null}

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-ink">貯金目標</h2>
        {data.savingGoals.filter((goal) => !goal.archived).length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">まだ貯金目標がありません。設定から追加できます。</p> : null}
        <div className="mt-3 grid gap-3">
          {data.savingGoals.filter((goal) => !goal.archived).slice(0, 3).map((goal) => {
            const rate = goal.targetAmount === 0 ? 0 : goal.currentAmount / goal.targetAmount;
            return (
              <div key={goal.id} className="rounded-2xl bg-cream/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-black text-ink">{goal.name}</p>
                  <p className="font-black text-leaf">{Math.round(rate * 100)}%</p>
                </div>
                <p className="mt-1 text-xs font-bold text-ink/55">現在 {yen(goal.currentAmount)} / 目標 {yen(goal.targetAmount)}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-leaf" style={{ width: `${Math.min(100, Math.round(rate * 100))}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {subscriptionCandidates.length > 0 ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-ink">サブスク候補</h2>
          <p className="mt-1 text-xs font-bold text-ink/55">同じ金額・同じ店舗が複数月に出ています。固定費登録の候補です。</p>
          <div className="mt-3 grid gap-2">
            {subscriptionCandidates.map((item) => (
              <div key={`${item.latest.amount}-${item.latest.location}-${item.latest.memo}`} className="rounded-2xl bg-cream/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-ink">{item.latest.location || item.latest.memo || getCategoryLabel(data, item.latest.categoryId)}</p>
                  <strong className="text-leaf">{yen(item.latest.amount)}</strong>
                </div>
                <p className="mt-1 text-xs font-bold text-ink/55">{item.count}か月で検出</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {widgets.categoryBudget ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black text-ink">カテゴリ予算</h2>
            <Link href="/reports" prefetch className="text-sm font-bold text-leaf">レポートへ</Link>
          </div>
          <CategoryBudgetList items={budgetUsage} compact />
        </section>
      ) : null}

      {widgets.payerBreakdown && data.members.length > 0 ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-ink">今月の支払内訳</h2>
          <div className="mt-3 grid gap-2">
            {payerBreakdown.map((row) => (
              <div key={row.id} className="flex items-center justify-between rounded-2xl bg-cream/60 px-3 py-3 text-sm">
                <span className="font-bold text-ink">{row.label}</span>
                <strong className="text-leaf">{yen(row.amount)}</strong>
              </div>
            ))}
          </div>
          {widgets.burdenRatio ? (
            <details className="mt-3">
              <summary className="min-h-10 cursor-pointer list-none text-sm font-black text-leaf">負担割合を見る</summary>
              <div className="mt-2 grid gap-2">
                {data.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-2xl bg-white px-3 py-3 text-sm">
                    <span className="font-bold text-ink">{member.name}</span>
                    <strong className="text-leaf">{Math.round((shares[member.id] ?? member.shareRatio) * 100)}%</strong>
                  </div>
                ))}
              </div>
            </details>
          ) : null}
        </section>
      ) : null}

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">もっと見る</summary>
        <section className="mt-3 grid gap-3 sm:grid-cols-2">
          <MetricCard label="収入予定" value={yen(totals.incomeTotal)} />
          <MetricCard label="固定費" value={yen(totals.fixedCostTotal)} />
          <MetricCard label="ローン" value={yen(totals.loanTotal)} />
          <MetricCard label="貯金・投資" value={yen(totals.savingTotal)} tone="accent" />
        </section>
        <p className="mt-3 text-[11px] font-bold text-ink/35">currentPeriod: {period.startDate} to {period.endDate}</p>
      </details>
    </div>
  );
}

function getCategoryLabel(data: BudgetData, categoryId: string) {
  return data.categories.find((category) => category.id === categoryId)?.name ?? "未分類";
}
