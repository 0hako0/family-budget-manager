import Link from "next/link";
import { CategoryBudgetList } from "@/components/CategoryBudgetList";
import { MetricCard } from "@/components/MetricCard";
import { getBudgetConsumption, getMemberBurdenShares, getMonthlyCategoryBudgetProgress, getNextIncome, getRemainingDays, getTotals } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { getCurrentMonthPeriodJST } from "@/lib/date";
import { yen } from "@/lib/format";

export default async function Home() {
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

  return (
    <div className="grid gap-5">
      <section className="rounded-[22px] border border-leaf/20 bg-white p-5 shadow-soft">
        <p className="text-xs font-bold text-leaf">{period.monthLabel}</p>
        <p className="mt-1 text-[11px] font-bold text-ink/45">
          期間: {period.startLabel}〜{period.endLabel}
        </p>
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
            <p className="mt-2 text-xs text-ink/55">
              使用済み: {yen(consumption.used)} / 今月の収入予定: {yen(consumption.plannedIncome)}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm font-bold text-leaf">今日使える目安</p>
            <p className="mt-1 text-2xl font-black text-ink">{yen(totals.dailyGuide)}</p>
            <p className="mt-1 text-xs text-ink/55">残り{remainingDays}日で自動計算</p>
          </div>
          <div className={totals.budgetBasedLanding < 0 ? "rounded-2xl bg-red-50 p-4 text-warn" : "rounded-2xl bg-cream/70 p-4 text-leaf"}>
            <p className="text-sm font-bold">月末見込み</p>
            <p className="mt-1 text-xl font-black">
              {totals.budgetBasedLanding >= 0 ? "+" : ""}
              {yen(totals.budgetBasedLanding)}
            </p>
            <p className="mt-1 text-xs text-ink/55">現在ペースの場合 {totals.paceBasedLanding >= 0 ? "+" : ""}{yen(totals.paceBasedLanding)}</p>
            {totals.isEarlyMonthForecast ? <p className="mt-2 text-xs font-bold text-ink/60">月初は現在ペース予測が大きくブレます。予算ベースで表示しています。</p> : null}
          </div>
        </div>
        <div className="mt-4 grid gap-1 rounded-2xl bg-cream/60 p-3 text-xs font-bold text-ink/60">
          <p>入金予定: {yen(totals.incomeTotal)}</p>
          <p>入金済み: {yen(totals.paidIncomeTotal)}</p>
          <p>次の入金日: {nextIncome ? nextIncome.paidOn.replaceAll("-", "/") : "予定なし"}</p>
        </div>
        <Link href="/expenses" prefetch className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-sm transition active:scale-[0.98]">
          支出を入力
        </Link>
      </section>

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black text-ink">カテゴリ予算</h2>
          <Link href="/reports" prefetch className="text-sm font-bold text-leaf">
            レポートへ
          </Link>
        </div>
        <CategoryBudgetList items={budgetUsage} compact />
      </section>

      {data.members.length > 0 ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-ink">負担割合</h2>
          <div className="mt-3 grid gap-2">
            {data.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-2xl bg-cream/60 px-3 py-3 text-sm">
                <span className="font-bold text-ink">{member.name}</span>
                <strong className="text-leaf">{Math.round((shares[member.id] ?? member.shareRatio) * 100)}%</strong>
              </div>
            ))}
          </div>
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
        <p className="mt-3 text-[11px] font-bold text-ink/35">
          currentPeriod: {period.startDate} to {period.endDate}
        </p>
      </details>
    </div>
  );
}
