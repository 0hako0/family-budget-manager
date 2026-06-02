"use client";

import { useEffect, useMemo, useState } from "react";
import { closeCurrentMonth } from "@/app/actions";
import { CategoryBudgetList } from "@/components/CategoryBudgetList";
import { CategoryPieChart, MonthlyTrendChart, RatioBarChart } from "@/components/Charts";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import {
  getCalendarDaySummaries,
  getCategory,
  getMonthScopedData,
  getMonthlyCategoryBudgetProgress,
  getMonthlyComparison,
  getMonthlyPaymentMethodBreakdown,
  getMonthlyTrend,
  getExpensePayerLabel,
  getPaymentMethodLabel,
  getTotals,
  groupExpensesByCategory
} from "@/lib/budget";
import { getCurrentMonthPeriodJST, getMonthBudgetPeriod, getReferenceDateFromMonthKey, shiftMonthKey } from "@/lib/date";
import { percent, yen } from "@/lib/format";
import type { BudgetData, CompareTarget, ExpenseTarget } from "@/lib/types";
import { MetricCard } from "./MetricCard";

const tabs = ["カテゴリ別", "月別推移", "比率", "年比較", "カレンダー"] as const;
const compareTargets: Array<{ value: CompareTarget; label: string }> = [
  { value: "last_month", label: "先月" },
  { value: "two_months_ago", label: "先々月" },
  { value: "three_month_average", label: "3か月平均" },
  { value: "six_months_ago", label: "半年前" },
  { value: "same_month_last_year", label: "1年前同月" }
];

const targetLabels: Record<ExpenseTarget, string> = {
  shared: "共有",
  self_only: "自分のみ",
  partner_only: "パートナーのみ"
};

export function ReportsTabs({ data }: { data: BudgetData }) {
  const currentPeriod = getCurrentMonthPeriodJST();
  const [tab, setTab] = useState<(typeof tabs)[number]>("カテゴリ別");
  const [target, setTarget] = useState<CompareTarget>("last_month");
  const [monthKey, setMonthKey] = useState(currentPeriod.monthKey);
  const referenceDate = useMemo(() => getReferenceDateFromMonthKey(monthKey), [monthKey]);
  const period = useMemo(() => (currentPeriod.monthKey === monthKey ? currentPeriod : getMonthBudgetPeriod(referenceDate)), [currentPeriod, monthKey, referenceDate]);
  const scopedData = useMemo(() => getMonthScopedData(data, referenceDate), [data, referenceDate]);
  const totals = useMemo(() => getTotals(data, referenceDate), [data, referenceDate]);
  const comparison = useMemo(() => getMonthlyComparison(data, target, referenceDate), [data, target, referenceDate]);
  const categoryBudgetItems = useMemo(() => getMonthlyCategoryBudgetProgress(data, referenceDate), [data, referenceDate]);
  const paymentBreakdown = useMemo(() => getMonthlyPaymentMethodBreakdown(data, referenceDate), [data, referenceDate]);
  const categoryData = useMemo(
    () => groupExpensesByCategory(scopedData.expenses).map((item) => ({ name: getCategory(data, item.categoryId)?.name ?? "未分類", value: item.value })),
    [data, scopedData.expenses]
  );
  const ratioData = useMemo(
    () => [
      { name: "固定費", value: totals.fixedCostRate * 100 },
      { name: "変動費", value: totals.variableExpenseRate * 100 },
      { name: "貯金", value: totals.savingRate * 100 }
    ],
    [totals.fixedCostRate, totals.savingRate, totals.variableExpenseRate]
  );
  const visibleCategoryRows = useMemo(() => comparison.categoryRows.filter((row) => row.currentValue > 0 || row.comparedValue > 0), [comparison.categoryRows]);

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">レポート</h1>
        <p className="mt-1 text-sm text-ink/60">家計の予算消化、月次比較、支払い方法別の内訳を確認します。</p>
      </section>

      <section className="rounded-[18px] bg-white p-3 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <button className="min-h-11 rounded-2xl bg-cream px-4 text-sm font-black text-ink transition active:scale-[0.98]" type="button" onClick={() => setMonthKey((value) => shiftMonthKey(value, -1))}>前月</button>
          <div className="text-center">
            <p className="text-base font-black text-ink">{period.monthLabel}</p>
            <p className="text-[11px] font-bold text-ink/45">{period.startLabel}〜{period.endLabel}</p>
          </div>
          <button className="min-h-11 rounded-2xl bg-cream px-4 text-sm font-black text-ink transition active:scale-[0.98]" type="button" onClick={() => setMonthKey((value) => shiftMonthKey(value, 1))}>次月</button>
        </div>
        <button className="mt-2 min-h-10 w-full rounded-2xl border border-leaf/20 text-sm font-black text-leaf transition active:scale-[0.98]" type="button" onClick={() => setMonthKey(currentPeriod.monthKey)}>今月に戻る</button>
      </section>

      <div className="grid grid-cols-5 gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {tabs.map((item) => (
          <button key={item} className={tab === item ? "min-h-11 rounded-xl bg-leaf text-[11px] font-black text-white" : "min-h-11 rounded-xl text-[11px] font-bold text-ink/60"} type="button" onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {tab === "カテゴリ別" ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-ink">カテゴリ予算</h2>
          <div className="mt-3"><CategoryBudgetList items={categoryBudgetItems} /></div>
          {categoryData.length > 0 ? <CategoryPieChart data={categoryData} /> : <p className="mt-4 rounded-2xl bg-cream/60 p-4 text-sm font-bold text-ink/60">この月の支出はまだありません</p>}
        </section>
      ) : null}

      {tab === "月別推移" ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-ink">月別推移</h2>
          {data.monthlySummaries.length > 0 || scopedData.expenses.length > 0 ? <MonthlyTrendChart data={getMonthlyTrend(data, referenceDate)} /> : <p className="mt-3 text-sm font-bold text-ink/60">まだ月次履歴がありません</p>}
        </section>
      ) : null}

      {tab === "比率" ? (
        <section className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="固定費比率" value={percent(totals.fixedCostRate)} />
            <MetricCard label="変動費比率" value={percent(totals.variableExpenseRate)} />
            <MetricCard label="貯金・投資率" value={percent(totals.savingRate)} tone="accent" />
          </div>
          <section className="rounded-[22px] bg-white p-4 shadow-sm"><RatioBarChart data={ratioData} /></section>
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">支払い方法別</h2>
            {paymentBreakdown.length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">まだ支出がありません</p> : null}
            <div className="mt-3 grid gap-2">
              {paymentBreakdown.map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-2xl bg-cream/60 px-3 py-3 text-sm">
                  <span className="font-bold text-ink">{row.label}</span>
                  <strong className="text-leaf">{yen(row.amount)}</strong>
                </div>
              ))}
            </div>
          </section>
        </section>
      ) : null}

      {tab === "年比較" ? (
        <section className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {compareTargets.map((item) => <button key={item.value} className={target === item.value ? "min-h-11 rounded-2xl bg-leaf text-sm font-black text-white" : "min-h-11 rounded-2xl bg-white text-sm font-bold text-ink"} type="button" onClick={() => setTarget(item.value)}>{item.label}</button>)}
          </div>
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-leaf">月締めプレビュー</p>
            <p className="mt-2 text-3xl font-black text-ink">{comparison.current.month}</p>
            <p className="mt-1 text-sm text-ink/60">残額 {yen(comparison.current.remainingBudget)} / 着地 {yen(comparison.current.landingResult)}</p>
            <form action={closeCurrentMonth} className="mt-3 grid gap-3">
              <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
              <textarea className="min-h-20 rounded-2xl border border-emerald-900/10 bg-cream/60 px-4 py-3 text-base outline-none transition focus:border-leaf" name="memo" placeholder="今月のメモ" />
              <FormSubmitButton idleLabel="この月を締める" pendingLabel="保存中..." />
            </form>
          </section>
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">比較</h2>
            <div className="mt-3 grid gap-2">{comparison.rows.map((row) => <ComparisonRow key={row.label} label={row.label} current={row.currentValue} compared={row.comparedValue} diff={row.diff} target={compareTargets.find((item) => item.value === target)?.label ?? ""} />)}</div>
          </section>
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">カテゴリ別支出</h2>
            {visibleCategoryRows.length === 0 ? <p className="mt-3 text-sm font-bold text-ink/60">まだカテゴリ別支出がありません</p> : null}
            <div className="mt-3 grid gap-2">{visibleCategoryRows.map((row) => <ComparisonRow key={row.category.id} label={`${row.category.icon} ${row.category.name}`} current={row.currentValue} compared={row.comparedValue} diff={row.diff} target={compareTargets.find((item) => item.value === target)?.label ?? ""} />)}</div>
          </section>
        </section>
      ) : null}

      {tab === "カレンダー" ? <ExpenseCalendar data={data} referenceDate={referenceDate} /> : null}
    </div>
  );
}

function ExpenseCalendar({ data, referenceDate }: { data: BudgetData; referenceDate: Date }) {
  const { period, cells } = useMemo(() => getCalendarDaySummaries(data, referenceDate), [data, referenceDate]);
  const [selectedDate, setSelectedDate] = useState(period.startDate);
  useEffect(() => setSelectedDate(period.startDate), [period.startDate]);
  const selectedCell = cells.find((cell) => cell.date === selectedDate);
  const selectedExpenses = selectedCell?.expenses ?? [];
  const maxDailyTotal = Math.max(1, ...cells.map((cell) => cell.total));

  return (
    <section className="grid gap-4">
      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-ink">支出カレンダー</h2>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-black text-ink/45">{["日", "月", "火", "水", "木", "金", "土"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((cell, index) => cell.inMonth ? (
            <button key={cell.date} type="button" onClick={() => setSelectedDate(cell.date)} className={selectedDate === cell.date ? "min-h-[62px] rounded-xl border-2 border-leaf bg-emerald-50 p-1 text-left transition active:scale-[0.98]" : cell.total / maxDailyTotal > 0.7 ? "min-h-[62px] rounded-xl border border-warn/30 bg-red-50 p-1 text-left transition active:scale-[0.98]" : cell.total > 0 ? "min-h-[62px] rounded-xl border border-emerald-900/10 bg-white p-1 text-left transition active:scale-[0.98]" : "min-h-[62px] rounded-xl bg-cream/45 p-1 text-left transition active:scale-[0.98]"}>
              <span className="block text-xs font-black text-ink">{cell.day}</span>
              {cell.total > 0 ? <span className={cell.total / maxDailyTotal > 0.7 ? "mt-1 block text-[10px] font-black text-warn" : "mt-1 block text-[10px] font-black text-leaf"}>{yen(cell.total)}</span> : null}
            </button>
          ) : <div key={`blank-${index}`} />)}
        </div>
      </section>
      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between"><h3 className="text-base font-black text-ink">{selectedDate.replaceAll("-", "/")}</h3><p className="text-sm font-black text-leaf">合計 {yen(selectedCell?.total ?? 0)}</p></div>
        {selectedExpenses.length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 p-4 text-sm font-bold text-ink/60">この日の支出はありません</p> : null}
        <div className="mt-3 grid gap-3">
          {selectedExpenses.map((expense) => {
            const category = getCategory(data, expense.categoryId);
            return (
              <article key={expense.id} className="rounded-2xl bg-cream/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-ink">{category?.icon} {category?.name ?? "未分類"}</p>
                    <p className="mt-1 text-xs font-bold text-ink/55">{expense.location || expense.memo || "場所・メモなし"} / {getExpensePayerLabel(expense)} / {getPaymentMethodLabel(data, expense)} / {targetLabels[expense.target]}</p>
                  </div>
                  <p className="shrink-0 text-sm font-black text-ink">{yen(expense.amount)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function ComparisonRow({ label, current, compared, diff, target }: { label: string; current: number; compared: number; diff: number; target: string }) {
  return (
    <div className="rounded-2xl bg-cream/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-ink">{label}</p>
        <p className={diff >= 0 ? "font-black text-warn" : "font-black text-leaf"}>{diff >= 0 ? "+" : ""}{yen(diff)}</p>
      </div>
      <p className="mt-1 text-sm text-ink/60">対象月 {yen(current)} / {target} {yen(compared)}</p>
    </div>
  );
}
