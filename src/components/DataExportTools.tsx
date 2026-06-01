"use client";

import { useMemo, useState } from "react";
import { getMonthBudgetPeriod, getReferenceDateFromMonthKey, shiftMonthKey } from "@/lib/date";
import type { BudgetData } from "@/lib/types";

type Dataset = "expenses" | "incomes" | "fixedCosts" | "loans" | "savings";
type Period = "current" | "last" | "year" | "custom";

const datasetLabels: Record<Dataset, string> = {
  expenses: "支出",
  incomes: "収入",
  fixedCosts: "固定費",
  loans: "ローン",
  savings: "貯金・投資"
};

export function DataExportTools({ data }: { data: BudgetData }) {
  const currentMonth = getMonthBudgetPeriod().monthKey;
  const [dataset, setDataset] = useState<Dataset>("expenses");
  const [period, setPeriod] = useState<Period>("current");
  const [startDate, setStartDate] = useState(`${currentMonth}-01`);
  const [endDate, setEndDate] = useState(getMonthBudgetPeriod().endDate);
  const rows = useMemo(() => buildRows(data, dataset, period, startDate, endDate), [data, dataset, period, startDate, endDate]);

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-sm font-bold text-ink/65">
          対象
          <select className="mobile-input" value={dataset} onChange={(event) => setDataset(event.target.value as Dataset)}>
            {Object.entries(datasetLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold text-ink/65">
          期間
          <select className="mobile-input" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
            <option value="current">今月</option>
            <option value="last">先月</option>
            <option value="year">年間</option>
            <option value="custom">カスタム</option>
          </select>
        </label>
      </div>
      {period === "custom" ? (
        <div className="grid grid-cols-2 gap-3">
          <input className="mobile-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input className="mobile-input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>
      ) : null}
      <p className="text-xs font-bold text-ink/50">{rows.length}件を書き出します</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="min-h-12 rounded-2xl bg-leaf px-4 py-3 text-sm font-black text-white transition active:scale-[0.98]" onClick={() => downloadCsv(dataset, rows)}>
          CSV出力
        </button>
        <button type="button" className="min-h-12 rounded-2xl border border-leaf/30 px-4 py-3 text-sm font-black text-leaf transition active:scale-[0.98]" onClick={() => downloadJson(data)}>
          JSONバックアップ
        </button>
      </div>
    </div>
  );
}

function buildRows(data: BudgetData, dataset: Dataset, period: Period, startDate: string, endDate: string) {
  const range = getRange(period, startDate, endDate);
  if (dataset === "expenses") {
    return data.expenses
      .filter((item) => inRange(item.date, range))
      .map((item) => ({
        date: item.date,
        amount: item.amount,
        category: data.categories.find((category) => category.id === item.categoryId)?.name ?? "",
        payer: item.payer,
        paidByType: item.paidByType ?? "member",
        target: item.target,
        location: item.location ?? "",
        memo: item.memo
      }));
  }
  if (dataset === "incomes") {
    return data.incomes
      .filter((item) => inRange(item.paidOn, range))
      .map((item) => ({ date: item.paidOn, name: item.name, amount: item.amount, earner: item.earner, recurring: item.recurring }));
  }
  if (dataset === "fixedCosts") {
    return data.fixedCosts.map((item) => ({ name: item.name, amount: item.amount, paidOn: item.paidOn, payer: item.payer, recurring: item.recurring, reviewMemo: item.reviewMemo ?? "" }));
  }
  if (dataset === "loans") {
    return data.loans.map((item) => ({ name: item.name, monthlyPayment: item.monthlyPayment, paidOn: item.paidOn, remainingBalance: item.remainingBalance, interestRate: item.interestRate, payoffDate: item.payoffDate, memo: item.memo }));
  }
  return data.savings.map((item) => ({ name: item.name, amount: item.amount, recurring: item.recurring }));
}

function getRange(period: Period, startDate: string, endDate: string) {
  const current = getMonthBudgetPeriod();
  if (period === "last") {
    const last = getMonthBudgetPeriod(getReferenceDateFromMonthKey(shiftMonthKey(current.monthKey, -1)));
    return { start: last.startDate, end: last.endDate };
  }
  if (period === "year") {
    return { start: `${current.year}-01-01`, end: `${current.year}-12-31` };
  }
  if (period === "custom") return { start: startDate, end: endDate };
  return { start: current.startDate, end: current.endDate };
}

function inRange(date: string, range: { start: string; end: string }) {
  return date >= range.start && date <= range.end;
}

function downloadCsv(dataset: Dataset, rows: Array<Record<string, unknown>>) {
  const headers = Object.keys(rows[0] ?? { empty: "" });
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n");
  download(`${dataset}-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function downloadJson(data: BudgetData) {
  download(`family-budget-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), "application/json");
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
