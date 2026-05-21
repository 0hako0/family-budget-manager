import { getMonthBudgetPeriod } from "./date";
import type { BudgetData, BurdenRule, CategoryKind, CompareTarget, Expense, MonthlySummary } from "./types";

const appToday = new Date();

export function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

export function getCategory(data: BudgetData, categoryId: string) {
  return data.categories.find((category) => category.id === categoryId);
}

export function getCategoriesByKind(data: BudgetData, kind: CategoryKind) {
  return data.categories
    .filter((category) => category.kind === kind && !category.archived && !category.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function isInMonth(dateValue: string, referenceDate = appToday) {
  const period = getMonthBudgetPeriod(referenceDate);
  const date = new Date(`${dateValue}T00:00:00+09:00`);
  return date >= period.start && date <= period.end;
}

export function getBudgetDays(referenceDate = appToday) {
  return getMonthBudgetPeriod(referenceDate).totalDays;
}

export function getRemainingDays(referenceDate = appToday) {
  const period = getMonthBudgetPeriod(referenceDate);
  return Math.max(1, period.totalDays - referenceDate.getDate() + 1);
}

export function getMonthScopedData(data: BudgetData, referenceDate = appToday) {
  return {
    incomes: data.incomes.filter((income) => isInMonth(income.paidOn, referenceDate)),
    savings: data.savings,
    fixedCosts: data.fixedCosts,
    loans: data.loans,
    expenses: data.expenses.filter((expense) => isInMonth(expense.date, referenceDate))
  };
}

export function getTotals(data: BudgetData, referenceDate = appToday) {
  const scoped = getMonthScopedData(data, referenceDate);
  const incomeTotal = sumBy(scoped.incomes, (income) => income.amount);
  const savingTotal = sumBy(scoped.savings, (saving) => saving.amount);
  const fixedCostTotal = sumBy(scoped.fixedCosts, (cost) => cost.amount);
  const loanTotal = sumBy(scoped.loans, (loan) => loan.monthlyPayment);
  const variableExpenseTotal = sumBy(scoped.expenses, (expense) => expense.amount);
  const livingBudget = incomeTotal - savingTotal - fixedCostTotal - loanTotal;
  const remainingBudget = livingBudget - variableExpenseTotal;
  const dailyGuide = remainingBudget / getRemainingDays(referenceDate);
  const elapsedDays = Math.max(1, referenceDate.getDate());
  const averageDailyExpense = variableExpenseTotal / elapsedDays;
  const projectedVariableExpense = averageDailyExpense * getBudgetDays(referenceDate);
  const projectedLanding = livingBudget - projectedVariableExpense;

  return {
    incomeTotal,
    savingTotal,
    fixedCostTotal,
    loanTotal,
    variableExpenseTotal,
    livingBudget,
    remainingBudget,
    dailyGuide,
    projectedVariableExpense,
    projectedLanding,
    isOverspending: projectedLanding < 0 || dailyGuide < 0,
    savingRate: incomeTotal === 0 ? 0 : savingTotal / incomeTotal,
    fixedCostRate: incomeTotal === 0 ? 0 : fixedCostTotal / incomeTotal,
    variableExpenseRate: incomeTotal === 0 ? 0 : variableExpenseTotal / incomeTotal
  };
}

export function createCurrentMonthlySummary(data: BudgetData, referenceDate = appToday): MonthlySummary {
  const totals = getTotals(data, referenceDate);
  const period = getMonthBudgetPeriod(referenceDate);
  const scoped = getMonthScopedData(data, referenceDate);
  return {
    id: `${period.monthKey}-draft`,
    month: period.monthKey,
    incomeTotal: totals.incomeTotal,
    fixedCostTotal: totals.fixedCostTotal,
    loanTotal: totals.loanTotal,
    variableExpenseTotal: totals.variableExpenseTotal,
    savingTotal: totals.savingTotal,
    remainingBudget: totals.remainingBudget,
    landingResult: totals.projectedLanding,
    categoryExpenses: Object.fromEntries(groupExpensesByCategory(scoped.expenses).map((item) => [item.categoryId, item.value])),
    memo: "月締め前のプレビューです。",
    closedAt: ""
  };
}

export function groupExpensesByCategory(expenses: Expense[]) {
  const map = new Map<string, number>();
  expenses.forEach((expense) => {
    map.set(expense.categoryId, (map.get(expense.categoryId) ?? 0) + expense.amount);
  });
  return Array.from(map, ([categoryId, value]) => ({ categoryId, value }));
}

export function getCategoryBudgetUsage(data: BudgetData, referenceDate = appToday) {
  const scoped = getMonthScopedData(data, referenceDate);
  const expenseTotals = new Map(groupExpensesByCategory(scoped.expenses).map((item) => [item.categoryId, item.value]));
  return getCategoriesByKind(data, "expense")
    .filter((category) => typeof category.monthlyBudget === "number")
    .map((category) => {
      const used = expenseTotals.get(category.id) ?? 0;
      const budget = category.monthlyBudget ?? 0;
      return {
        category,
        used,
        budget,
        rate: budget === 0 ? 0 : used / budget,
        remaining: budget - used
      };
    });
}

export function getMonthlyTrend(data: BudgetData) {
  const current = createCurrentMonthlySummary(data);
  return [...data.monthlySummaries, current]
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((summary) => ({
      month: summary.month.slice(5),
      income: summary.incomeTotal,
      spending: summary.fixedCostTotal + summary.loanTotal + summary.savingTotal + summary.variableExpenseTotal
    }));
}

export function getComparisonSummary(data: BudgetData, target: CompareTarget) {
  const summaries = [...data.monthlySummaries].sort((a, b) => b.month.localeCompare(a.month));
  if (target === "last_month") return summaries.find((summary) => summary.month === getShiftedMonthKey(-1));
  if (target === "two_months_ago") return summaries.find((summary) => summary.month === getShiftedMonthKey(-2));
  if (target === "six_months_ago") return summaries.find((summary) => summary.month === getShiftedMonthKey(-6));
  if (target === "same_month_last_year") return summaries.find((summary) => summary.month === getShiftedMonthKey(-12));

  const lastThreeKeys = [getShiftedMonthKey(-1), getShiftedMonthKey(-2), getShiftedMonthKey(-3)];
  const lastThree = summaries.filter((summary) => lastThreeKeys.includes(summary.month));
  if (lastThree.length === 0) return undefined;
  return averageSummaries("3か月平均", lastThree);
}

function averageSummaries(month: string, summaries: MonthlySummary[]): MonthlySummary {
  const categoryIds = new Set(summaries.flatMap((summary) => Object.keys(summary.categoryExpenses)));
  return {
    id: `summary-${month}`,
    month,
    incomeTotal: average(summaries.map((summary) => summary.incomeTotal)),
    fixedCostTotal: average(summaries.map((summary) => summary.fixedCostTotal)),
    loanTotal: average(summaries.map((summary) => summary.loanTotal)),
    variableExpenseTotal: average(summaries.map((summary) => summary.variableExpenseTotal)),
    savingTotal: average(summaries.map((summary) => summary.savingTotal)),
    remainingBudget: average(summaries.map((summary) => summary.remainingBudget)),
    landingResult: average(summaries.map((summary) => summary.landingResult)),
    categoryExpenses: Object.fromEntries(
      Array.from(categoryIds).map((categoryId) => [
        categoryId,
        average(summaries.map((summary) => summary.categoryExpenses[categoryId] ?? 0))
      ])
    ),
    memo: "過去3か月の平均です。",
    closedAt: ""
  };
}

function average(values: number[]) {
  return values.length === 0 ? 0 : sumBy(values, (value) => value) / values.length;
}

function getShiftedMonthKey(offset: number, referenceDate = appToday) {
  const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthlyComparison(data: BudgetData, target: CompareTarget = "last_month") {
  const current = createCurrentMonthlySummary(data);
  const compared = getComparisonSummary(data, target);

  const rows = [
    ["収入", current.incomeTotal, compared?.incomeTotal ?? 0],
    ["固定費", current.fixedCostTotal, compared?.fixedCostTotal ?? 0],
    ["ローン", current.loanTotal, compared?.loanTotal ?? 0],
    ["変動費", current.variableExpenseTotal, compared?.variableExpenseTotal ?? 0],
    ["貯金・投資", current.savingTotal, compared?.savingTotal ?? 0],
    ["残額", current.remainingBudget, compared?.remainingBudget ?? 0]
  ] as const;

  return {
    current,
    compared,
    target,
    rows: rows.map(([label, currentValue, comparedValue]) => ({
      label,
      currentValue,
      comparedValue,
      diff: currentValue - comparedValue
    })),
    categoryRows: getCategoriesByKind(data, "expense").map((category) => {
      const currentValue = current.categoryExpenses[category.id] ?? 0;
      const comparedValue = compared?.categoryExpenses[category.id] ?? 0;
      return { category, currentValue, comparedValue, diff: currentValue - comparedValue };
    })
  };
}

export function getMemberBurdenShares(data: BudgetData, rule: BurdenRule = data.settings.burdenRule) {
  if (data.members.length === 0) return {};

  if (rule === "fifty_fifty") {
    return Object.fromEntries(data.members.map((member) => [member.id, 1 / data.members.length]));
  }

  if (rule === "custom") {
    return data.settings.customShares;
  }

  const incomeByName = new Map<string, number>();
  data.incomes.forEach((income) => {
    incomeByName.set(income.earner, (incomeByName.get(income.earner) ?? 0) + income.amount);
  });
  const totalIncome = sumBy(data.members, (member) => incomeByName.get(member.name) ?? 0);

  return Object.fromEntries(
    data.members.map((member) => [member.id, totalIncome === 0 ? member.shareRatio : (incomeByName.get(member.name) ?? 0) / totalIncome])
  );
}

export function calculateSharedBurden(expense: Expense, data: BudgetData) {
  if (expense.target !== "shared") {
    const member = data.members.find((item) => item.name === expense.payer);
    return Object.fromEntries(data.members.map((item) => [item.id, item.id === member?.id ? expense.amount : 0]));
  }

  const shares = getMemberBurdenShares(data);
  return Object.fromEntries(data.members.map((member) => [member.id, expense.amount * (shares[member.id] ?? 0)]));
}
