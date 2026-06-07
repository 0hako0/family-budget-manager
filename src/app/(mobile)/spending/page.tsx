import Link from "next/link";
import { getMonthlyPaymentMethodBreakdown, getMonthlySpendingInsight } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { getMonthBudgetPeriod } from "@/lib/date";
import { yen } from "@/lib/format";

export default async function SpendingPage() {
  const data = await getBudgetData();
  const referenceDate = new Date();
  const period = getMonthBudgetPeriod(referenceDate);
  const insight = getMonthlySpendingInsight(data, referenceDate);
  const paymentMethods = getMonthlyPaymentMethodBreakdown(data, referenceDate);

  return (
    <div className="grid gap-4">
      <div>
        <Link href="/" prefetch className="text-sm font-black text-leaf transition active:scale-[0.98]">
          ← ホーム
        </Link>
        <h1 className="mt-3 text-2xl font-black tracking-normal text-ink">今月の支出詳細</h1>
        <p className="mt-1 text-sm font-bold text-ink/50">{period.monthLabel} / {period.startLabel}〜{period.endLabel}</p>
      </div>

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-ink/55">変動費合計</p>
        <p className="mt-1 text-4xl font-black text-ink">{yen(insight.summary.variableExpenseTotal)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-ink/55">
          <p>固定費 {yen(insight.summary.fixedCostTotal)}</p>
          <p>共通クレカ {yen(insight.summary.sharedCreditCardTotal)}</p>
          <p>支出件数 {insight.summary.expenseCount}件</p>
          <p>
            先月比{" "}
            {insight.summary.previousDiffRate === undefined
              ? "-"
              : `${insight.summary.previousDiffRate <= 0 ? "▲" : "+"}${Math.abs(Math.round(insight.summary.previousDiffRate * 100))}%`}
          </p>
        </div>
      </section>

      {insight.summary.variableExpenseTotal === 0 ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <p className="text-base font-black text-ink">まだ変動費の支出はありません</p>
          <p className="mt-2 text-sm font-bold leading-6 text-ink/55">支出を入力すると、カテゴリ別・店舗別・支払い方法別に表示されます。</p>
          <Link href="/expenses" prefetch className="mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-leaf px-4 py-3 text-sm font-black text-white transition active:scale-[0.98]">
            支出を入力
          </Link>
        </section>
      ) : (
        <>
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">カテゴリ別内訳</h2>
            <div className="mt-3 grid gap-2">
              {[...insight.topCategories, ...(insight.otherCategoryTotal > 0 ? [{ id: "other", name: "その他", icon: "・", color: "#7a807a", amount: insight.otherCategoryTotal }] : [])].map((item) => (
                <div key={item.id} className="rounded-2xl bg-cream/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base" style={{ backgroundColor: `${item.color}22` }}>
                        {item.icon}
                      </span>
                      <span className="truncate text-sm font-black text-ink">{item.name}</span>
                    </div>
                    <strong className="shrink-0 text-sm text-ink">{yen(item.amount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">店舗別内訳</h2>
            <div className="mt-3 grid gap-2">
              {insight.locations.slice(0, 5).map((item) => (
                <div key={item.location} className="rounded-2xl bg-cream/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-ink">{item.location}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs font-bold text-ink/50">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.categoryColor }} />
                        {item.categoryName}
                      </p>
                    </div>
                    <strong className="shrink-0 text-sm text-ink">{yen(item.amount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">今月の支出TOP5</h2>
            <div className="mt-3 grid gap-2">
              {insight.topExpenses.map((item) => (
                <Link key={item.expense.id} href="/expenses" prefetch className="block rounded-2xl bg-cream/60 p-3 transition active:scale-[0.98]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-ink">{item.location}</p>
                      <p className="mt-1 text-xs font-bold text-ink/50">{item.expense.date.replaceAll("-", "/")} / {item.categoryName} / {item.paymentMethod}</p>
                    </div>
                    <strong className="shrink-0 text-base text-ink">{yen(item.expense.amount)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">支払い方法別</h2>
            <div className="mt-3 grid gap-2">
              {paymentMethods.length === 0 ? <p className="rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/55">まだ支払い方法別の支出はありません</p> : null}
              {paymentMethods.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold">
                  <span className="min-w-0 truncate text-ink">{item.label}</span>
                  <strong className="shrink-0 text-ink">{yen(item.amount)}</strong>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
