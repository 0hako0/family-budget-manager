import Link from "next/link";
import { CategoryBudgetList } from "@/components/CategoryBudgetList";
import { MetricCard } from "@/components/MetricCard";
import { getCategoryBudgetUsage, getRemainingDays, getTotals } from "@/lib/budget";
import { getMonthBudgetPeriod } from "@/lib/date";
import { yen } from "@/lib/format";
import { budgetData } from "@/lib/mock-data";

const referenceDate = new Date("2026-05-21T00:00:00+09:00");

export default function Home() {
  const totals = getTotals(budgetData, referenceDate);
  const remainingDays = getRemainingDays(referenceDate);
  const period = getMonthBudgetPeriod(referenceDate);
  const budgetUsage = getCategoryBudgetUsage(budgetData, referenceDate).slice(0, 3);

  return (
    <div className="grid gap-5">
      <section className="rounded-[22px] border border-leaf/20 bg-white p-5 shadow-soft">
        <p className="text-xs font-bold text-leaf">{period.startLabel} 〜 {period.endLabel}</p>
        <p className="mt-3 text-sm font-bold text-ink/60">今月あと使える金額</p>
        <p className="mt-2 text-5xl font-black tracking-normal text-ink">{yen(totals.remainingBudget)}</p>
        <div className="mt-5 grid gap-3">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-sm font-bold text-leaf">今日使える目安</p>
            <p className="mt-1 text-2xl font-black text-ink">{yen(totals.dailyGuide)}</p>
            <p className="mt-1 text-xs text-ink/55">残り{remainingDays}日で自動計算</p>
          </div>
          <div className={totals.isOverspending ? "rounded-2xl bg-red-50 p-4 text-warn" : "rounded-2xl bg-cream/70 p-4 text-leaf"}>
            <p className="text-sm font-bold">月末予測</p>
            <p className="mt-1 text-xl font-black">{totals.projectedLanding >= 0 ? "+" : ""}{yen(totals.projectedLanding)}</p>
          </div>
        </div>
        <Link href="/expenses" className="mt-5 flex min-h-14 w-full items-center justify-center rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-sm">
          支出を入力
        </Link>
      </section>

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-black text-ink">カテゴリ予算</h2>
          <Link href="/reports" className="text-sm font-bold text-leaf">レポートへ</Link>
        </div>
        <CategoryBudgetList items={budgetUsage} compact />
      </section>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">もっと見る</summary>
        <section className="mt-3 grid gap-3 sm:grid-cols-2">
          <MetricCard label="収入" value={yen(totals.incomeTotal)} />
          <MetricCard label="固定費" value={yen(totals.fixedCostTotal)} />
          <MetricCard label="ローン" value={yen(totals.loanTotal)} />
          <MetricCard label="貯金・投資" value={yen(totals.savingTotal)} tone="accent" />
        </section>
      </details>
    </div>
  );
}
