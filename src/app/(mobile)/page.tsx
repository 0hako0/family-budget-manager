import Link from "next/link";
import { CategoryBudgetList } from "@/components/CategoryBudgetList";
import { IntroTutorial } from "@/components/IntroTutorial";
import { LastUpdated } from "@/components/LastUpdated";
import { MonthlySnapshotRunner } from "@/components/MonthlySnapshotRunner";
import {
  getBudgetConsumption,
  getMonthlyCategoryBudgetProgress,
  getMonthlyExpenseSummary,
  getRemainingDays,
  getSharedCreditCardSummary,
  getTotals,
  getUpcomingPayments
} from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { getCurrentMonthPeriodJST } from "@/lib/date";
import { yen } from "@/lib/format";

export default async function Home({ searchParams }: { searchParams?: { error?: string } }) {
  const data = await getBudgetData();
  const period = getCurrentMonthPeriodJST();
  const referenceDate = new Date();
  const totals = getTotals(data, referenceDate);
  const remainingDays = getRemainingDays(referenceDate);
  const budgetUsage = getMonthlyCategoryBudgetProgress(data, referenceDate).slice(0, 3);
  const upcomingPayments = getUpcomingPayments(data, referenceDate).slice(0, 3);
  const sharedCard = getSharedCreditCardSummary(data, referenceDate);
  const consumption = getBudgetConsumption(data, referenceDate);
  const monthlyExpense = getMonthlyExpenseSummary(data, referenceDate);
  const consumptionPercent = Math.round(consumption.rate * 100);
  const consumptionTone = consumption.rate >= 1 ? "bg-warn" : consumption.rate >= 0.8 ? "bg-amber-400" : "bg-leaf";
  const widgets = data.settings.homeWidgets;

  return (
    <div className="grid gap-4">
      <MonthlySnapshotRunner enabled={Boolean(data.householdGroupId)} />
      <IntroTutorial />
      {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}

      <section className="rounded-[22px] border border-leaf/20 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-leaf">{period.monthLabel}</p>
          <LastUpdated />
        </div>
        <p className="mt-1 text-[11px] font-bold text-ink/45">期間: {period.startLabel}〜{period.endLabel}</p>
        <p className="mt-3 text-sm font-bold text-ink/60">今月あと使える金額</p>
        <p className="mt-1 text-5xl font-black tracking-normal text-ink">{yen(totals.remainingBudget)}</p>

        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl bg-cream/70 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ink/65">今月の支出</p>
                <p className="mt-1 text-3xl font-black text-ink">{yen(monthlyExpense.total)}</p>
              </div>
              {monthlyExpense.previousDiffRate !== undefined ? (
                <p className={monthlyExpense.previousDiffRate <= 0 ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-leaf" : "rounded-full bg-red-50 px-3 py-1 text-xs font-black text-warn"}>
                  先月比 {monthlyExpense.previousDiffRate <= 0 ? "▲" : "+"}
                  {Math.abs(Math.round(monthlyExpense.previousDiffRate * 100))}%
                </p>
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-ink/55">
              <p>変動費 {yen(monthlyExpense.variableExpenseTotal)}</p>
              <p>固定費 {yen(monthlyExpense.fixedCostTotal)}</p>
              <p>共通クレカ {yen(monthlyExpense.sharedCreditCardTotal)}</p>
              <p>{monthlyExpense.expenseCount}件</p>
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-3">
            <p className="text-sm font-bold text-leaf">今日使える目安</p>
            <p className="mt-1 text-2xl font-black text-ink">{yen(totals.dailyGuide)}</p>
            <p className="mt-1 text-xs text-ink/55">残り{remainingDays}日で自動計算</p>
          </div>

          {widgets.monthEnd ? (
            <div className={totals.budgetBasedLanding < 0 ? "rounded-2xl bg-red-50 p-3 text-warn" : "rounded-2xl bg-cream/70 p-3 text-leaf"}>
              <p className="text-sm font-bold">月末見込み</p>
              <p className="mt-1 text-xl font-black">
                {totals.budgetBasedLanding >= 0 ? "+" : ""}
                {yen(totals.budgetBasedLanding)}
              </p>
              <p className="mt-1 text-xs text-ink/55">
                現在ペースの場合 {totals.paceBasedLanding >= 0 ? "+" : ""}
                {yen(totals.paceBasedLanding)}
              </p>
            </div>
          ) : null}

          <div className="rounded-2xl bg-cream/70 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-ink">今月予算消化率</p>
              <p className={consumption.rate >= 1 ? "text-xl font-black text-warn" : "text-xl font-black text-leaf"}>{consumptionPercent}%</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div className={`h-full rounded-full ${consumptionTone}`} style={{ width: `${Math.min(100, consumptionPercent)}%` }} />
            </div>
          </div>
        </div>

        <Link href="/expenses" prefetch className="mt-4 flex min-h-14 w-full items-center justify-center rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-sm transition active:scale-[0.98]">
          支出を入力
        </Link>
      </section>

      {widgets.categoryBudget ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-ink">カテゴリ予算</h2>
            <Link href="/reports" prefetch className="text-sm font-bold text-leaf">詳しく見る</Link>
          </div>
          <CategoryBudgetList items={budgetUsage} compact />
        </section>
      ) : null}

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-ink">次の支払予定</h2>
          <Link href="/schedule" prefetch className="text-sm font-bold text-leaf">一覧</Link>
        </div>
        {upcomingPayments.length === 0 ? <p className="rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">直近の予定はありません</p> : null}
        <div className="grid gap-2">
          {upcomingPayments.map((item) => (
            <div key={`${item.type}-${item.date}-${item.label}`} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/60 px-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-black text-ink">{item.label}</p>
                <p className="text-xs font-bold text-ink/50">{item.date.replaceAll("-", "/")}</p>
              </div>
              <strong className={item.tone === "income" ? "shrink-0 text-leaf" : "shrink-0 text-warn"}>
                {item.tone === "income" ? "+" : "-"}
                {yen(item.amount)}
              </strong>
            </div>
          ))}
        </div>
      </section>

      {widgets.sharedWallet ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-black text-ink">共通クレカ利用額</h2>
            <Link href="/payments" prefetch className="text-sm font-bold text-leaf">詳細</Link>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-ink">{sharedCard.cardName}</span>
              <strong className="text-xl text-leaf">{yen(sharedCard.amount)}</strong>
            </div>
            <p className="mt-1 text-xs font-bold text-ink/55">
              次回引き落とし予定: {yen(sharedCard.nextWithdrawalAmount)} / {sharedCard.withdrawalDate}
            </p>
          </div>
        </section>
      ) : null}

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-ink">もっと見る</h2>
        <div className="mt-3 grid gap-2">
          <Shortcut href="/schedule" label="支払予定を見る" />
          <Shortcut href="/payments" label="共通支払い方法を見る" />
          <Shortcut href="/payments#credit-card-bills" label="クレカ請求を見る" />
          <Shortcut href="/goals" label="貯金目標を見る" />
          <Shortcut href="/reports" label="支払内訳を見る" />
          <Shortcut href="/reports" label="サブスク候補を見る" />
        </div>
        <p className="mt-3 text-[11px] font-bold text-ink/35">currentPeriod: {period.startDate} to {period.endDate}</p>
      </section>
    </div>
  );
}

function Shortcut({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} prefetch className="flex min-h-12 items-center justify-between rounded-2xl bg-cream/60 px-4 py-3 text-sm font-black text-ink transition active:scale-[0.98]">
      {label}
      <span className="text-leaf">›</span>
    </Link>
  );
}
