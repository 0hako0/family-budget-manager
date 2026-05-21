"use client";

import { useMemo, useState } from "react";
import { CategoryBudgetList } from "@/components/CategoryBudgetList";
import { CategoryPieChart, MonthlyTrendChart, RatioBarChart } from "@/components/Charts";
import { createCurrentMonthlySummary, getCategory, getCategoryBudgetUsage, getMonthlyComparison, getMonthlyTrend, getTotals, groupExpensesByCategory } from "@/lib/budget";
import { percent, yen } from "@/lib/format";
import type { BudgetData, CompareTarget } from "@/lib/types";
import { MetricCard } from "./MetricCard";

const tabs = ["カテゴリ別", "月別推移", "比率", "年比較"] as const;
const compareTargets: Array<{ value: CompareTarget; label: string }> = [
  { value: "last_month", label: "先月" },
  { value: "two_months_ago", label: "先々月" },
  { value: "three_month_average", label: "3か月平均" },
  { value: "six_months_ago", label: "半年前" },
  { value: "same_month_last_year", label: "1年前同月" }
];

export function ReportsTabs({ data }: { data: BudgetData }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("カテゴリ別");
  const [target, setTarget] = useState<CompareTarget>("last_month");
  const totals = getTotals(data);
  const currentSummary = createCurrentMonthlySummary(data);
  const comparison = getMonthlyComparison(data, target);
  const categoryData = groupExpensesByCategory(data.expenses).map((item) => ({
    name: getCategory(data, item.categoryId)?.name ?? "未分類",
    value: item.value
  }));
  const ratioData = [
    { name: "固定費", value: totals.fixedCostRate * 100 },
    { name: "変動費", value: totals.variableExpenseRate * 100 },
    { name: "貯金", value: totals.savingRate * 100 }
  ];
  const visibleCategoryRows = useMemo(() => comparison.categoryRows.filter((row) => row.currentValue > 0 || row.comparedValue > 0), [comparison.categoryRows]);

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">レポート</h1>
        <p className="mt-1 text-sm text-ink/60">家計の予算消化と月次比較を確認します。</p>
      </section>

      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {tabs.map((item) => (
          <button key={item} className={tab === item ? "min-h-11 rounded-xl bg-leaf text-xs font-black text-white" : "min-h-11 rounded-xl text-xs font-bold text-ink/60"} type="button" onClick={() => setTab(item)}>
            {item}
          </button>
        ))}
      </div>

      {tab === "カテゴリ別" ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-ink">カテゴリ予算</h2>
          <div className="mt-3">
            <CategoryBudgetList items={getCategoryBudgetUsage(data).slice(0, 4)} />
          </div>
          {categoryData.length > 0 ? <CategoryPieChart data={categoryData} /> : null}
        </section>
      ) : null}

      {tab === "月別推移" ? (
        <section className="rounded-[22px] bg-white p-4 shadow-sm">
          <h2 className="text-base font-black text-ink">月別推移</h2>
          {data.monthlySummaries.length > 0 ? <MonthlyTrendChart data={getMonthlyTrend(data)} /> : <p className="mt-3 text-sm font-bold text-ink/60">まだ月次履歴がありません</p>}
        </section>
      ) : null}

      {tab === "比率" ? (
        <section className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="固定費比率" value={percent(totals.fixedCostRate)} />
            <MetricCard label="変動費比率" value={percent(totals.variableExpenseRate)} />
            <MetricCard label="貯金・投資率" value={percent(totals.savingRate)} tone="accent" />
          </div>
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <RatioBarChart data={ratioData} />
          </section>
        </section>
      ) : null}

      {tab === "年比較" ? (
        <section className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {compareTargets.map((item) => (
              <button key={item.value} className={target === item.value ? "min-h-11 rounded-2xl bg-leaf text-sm font-black text-white" : "min-h-11 rounded-2xl bg-white text-sm font-bold text-ink"} onClick={() => setTarget(item.value)}>
                {item.label}
              </button>
            ))}
          </div>
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-leaf">月締めプレビュー</p>
            <p className="mt-2 text-3xl font-black text-ink">{currentSummary.month}</p>
            <p className="mt-1 text-sm text-ink/60">残額 {yen(currentSummary.remainingBudget)} / 着地 {yen(currentSummary.landingResult)}</p>
          </section>
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">比較</h2>
            <div className="mt-3 grid gap-2">
              {comparison.rows.map((row) => (
                <ComparisonRow key={row.label} label={row.label} current={row.currentValue} compared={row.comparedValue} diff={row.diff} target={compareTargets.find((item) => item.value === target)?.label ?? ""} />
              ))}
            </div>
          </section>
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <h2 className="text-base font-black text-ink">カテゴリ別支出</h2>
            {visibleCategoryRows.length === 0 ? <p className="mt-3 text-sm font-bold text-ink/60">まだカテゴリ別支出がありません</p> : null}
            <div className="mt-3 grid gap-2">
              {visibleCategoryRows.map((row) => (
                <ComparisonRow key={row.category.id} label={`${row.category.icon} ${row.category.name}`} current={row.currentValue} compared={row.comparedValue} diff={row.diff} target={compareTargets.find((item) => item.value === target)?.label ?? ""} />
              ))}
            </div>
          </section>
        </section>
      ) : null}
    </div>
  );
}

function ComparisonRow({ label, current, compared, diff, target }: { label: string; current: number; compared: number; diff: number; target: string }) {
  return (
    <div className="rounded-2xl bg-cream/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-ink">{label}</p>
        <p className={diff >= 0 ? "font-black text-warn" : "font-black text-leaf"}>{diff >= 0 ? "+" : ""}{yen(diff)}</p>
      </div>
      <p className="mt-1 text-sm text-ink/60">今月 {yen(current)} / {target} {yen(compared)}</p>
    </div>
  );
}
