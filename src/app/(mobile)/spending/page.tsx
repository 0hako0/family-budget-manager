import Link from "next/link";
import { deleteExpense } from "@/app/actions";
import { getMonthlyPaymentMethodBreakdown, getMonthlySpendingInsight } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { getMonthBudgetPeriod } from "@/lib/date";
import { yen } from "@/lib/format";

type SpendingTab = "categories" | "locations" | "expenses" | "payments";

const tabs: { id: SpendingTab; label: string }[] = [
  { id: "categories", label: "カテゴリ" },
  { id: "locations", label: "店舗" },
  { id: "expenses", label: "支出一覧" },
  { id: "payments", label: "支払い方法" }
];

export default async function SpendingPage({ searchParams }: { searchParams?: { tab?: string; q?: string } }) {
  const data = await getBudgetData();
  const referenceDate = new Date();
  const period = getMonthBudgetPeriod(referenceDate);
  const insight = getMonthlySpendingInsight(data, referenceDate);
  const paymentMethods = getMonthlyPaymentMethodBreakdown(data, referenceDate);
  const activeTab = tabs.some((tab) => tab.id === searchParams?.tab) ? (searchParams?.tab as SpendingTab) : "categories";
  const query = (searchParams?.q ?? "").trim().toLowerCase();
  const filteredCategories = insight.categories.filter((item) => item.name.toLowerCase().includes(query));
  const filteredLocations = insight.locations.filter((item) => `${item.location} ${item.categoryName}`.toLowerCase().includes(query));
  const filteredExpenses = insight.expenses.filter((item) => `${item.location} ${item.categoryName} ${item.expense.memo}`.toLowerCase().includes(query));

  return (
    <div className="grid gap-4">
      <div>
        <Link href="/" prefetch className="text-sm font-black text-leaf transition active:scale-[0.98]">← ホーム</Link>
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
          <form className="rounded-[22px] bg-white p-3 shadow-sm" action="/spending">
            <input type="hidden" name="tab" value={activeTab} />
            <label className="text-xs font-black text-ink/50" htmlFor="spending-search">検索</label>
            <input
              id="spending-search"
              className="mobile-input mt-2"
              name="q"
              placeholder="店舗名・カテゴリ・メモ"
              defaultValue={searchParams?.q ?? ""}
            />
          </form>

          <nav className="grid grid-cols-4 gap-1 rounded-[20px] bg-white p-1 shadow-sm" aria-label="支出詳細タブ">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/spending?tab=${tab.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                prefetch
                className={
                  activeTab === tab.id
                    ? "flex min-h-11 items-center justify-center rounded-2xl bg-leaf px-2 text-xs font-black text-white transition active:scale-[0.98]"
                    : "flex min-h-11 items-center justify-center rounded-2xl px-2 text-xs font-black text-ink/60 transition active:scale-[0.98]"
                }
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          {activeTab === "categories" ? (
            <section className="rounded-[22px] bg-white p-4 shadow-sm">
              <h2 className="text-base font-black text-ink">カテゴリ別内訳</h2>
              <div className="mt-3 grid gap-2">
                {filteredCategories.length === 0 ? <EmptyFiltered /> : null}
                {filteredCategories.map((item) => (
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
          ) : null}

          {activeTab === "locations" ? (
            <section className="rounded-[22px] bg-white p-4 shadow-sm">
              <h2 className="text-base font-black text-ink">店舗別内訳</h2>
              <div className="mt-3 grid gap-2">
                {filteredLocations.length === 0 ? <EmptyFiltered /> : null}
                {filteredLocations.map((item) => (
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
          ) : null}

          {activeTab === "expenses" ? (
            <section className="rounded-[22px] bg-white p-4 shadow-sm">
              <h2 className="text-base font-black text-ink">今月の支出一覧</h2>
              <div className="mt-3 grid gap-2">
                {filteredExpenses.length === 0 ? <EmptyFiltered /> : null}
                {filteredExpenses.map((item) => (
                  <div key={item.expense.id} className="rounded-2xl bg-cream/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-ink">{item.location}</p>
                        <p className="mt-1 text-xs font-bold text-ink/50">{item.expense.date.replaceAll("-", "/")} / {item.categoryName}</p>
                        <p className="mt-1 text-xs font-bold text-ink/50">{item.paymentMethod}</p>
                        {item.expense.memo ? <p className="mt-1 text-xs font-bold text-ink/50">{item.expense.memo}</p> : null}
                      </div>
                      <strong className="shrink-0 text-base text-ink">{yen(item.expense.amount)}</strong>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <Link href="/expenses" prefetch className="flex min-h-10 items-center rounded-xl border border-emerald-900/10 bg-white px-4 text-xs font-black text-leaf transition active:scale-[0.98]">
                        編集
                      </Link>
                      <form action={deleteExpense}>
                        <input type="hidden" name="id" value={item.expense.id} />
                        <button className="min-h-10 rounded-xl bg-red-50 px-4 text-xs font-black text-warn transition active:scale-[0.98]" type="submit">
                          削除
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "payments" ? (
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
          ) : null}
        </>
      )}
    </div>
  );
}

function EmptyFiltered() {
  return <p className="rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/55">条件に合う支出はありません</p>;
}
