import {
  getJSTDayOfMonth,
  getLastDayOfMonth,
  getMonthBudgetPeriod,
  getReferenceDateFromMonthKey,
  getTodayJSTDateString,
  isDateInMonthJST,
  shiftMonthKey
} from "./date";
import type { BudgetData, BurdenRule, CategoryKind, CompareTarget, Expense, Income, MonthlySummary, PaymentMethodType } from "./types";

export function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((total, item) => total + getValue(item), 0);
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function dateInRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

function dateFromMonthDay(monthKey: string, day: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const safeDay = Math.min(day, getLastDayOfMonth(year, month));
  return `${monthKey}-${pad2(safeDay)}`;
}

export function getCategory(data: BudgetData, categoryId: string) {
  return data.categories.find((category) => category.id === categoryId);
}

export function getCategoriesByKind(data: BudgetData, kind: CategoryKind) {
  return data.categories
    .filter((category) => category.kind === kind && !category.archived && !category.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getBudgetDays(referenceDate = new Date()) {
  return getMonthBudgetPeriod(referenceDate).totalDays;
}

export function getRemainingDays(referenceDate = new Date()) {
  const period = getMonthBudgetPeriod(referenceDate);
  return Math.max(1, period.totalDays - getJSTDayOfMonth(referenceDate) + 1);
}

export function getPlannedIncomes(data: BudgetData, referenceDate = new Date()): Income[] {
  const period = getMonthBudgetPeriod(referenceDate);
  return data.incomes
    .map((income) => {
      if (!income.recurring) return income;
      const day = Math.min(Number(income.paidOn.slice(8, 10)) || 1, getLastDayOfMonth(period.year, period.month));
      return { ...income, paidOn: `${period.monthKey}-${pad2(day)}` };
    })
    .filter((income) => isDateInMonthJST(income.paidOn, referenceDate));
}

export function getMonthScopedData(data: BudgetData, referenceDate = new Date()) {
  return {
    ...data,
    incomes: getPlannedIncomes(data, referenceDate),
    savings: data.savings,
    fixedCosts: data.fixedCosts,
    loans: data.loans,
    expenses: data.expenses.filter((expense) => isDateInMonthJST(expense.date, referenceDate)),
    sharedWalletTransactions: data.sharedWalletTransactions.filter((row) => isDateInMonthJST(row.occurredOn, referenceDate))
  };
}

export function getPaidIncomes(data: BudgetData, referenceDate = new Date()) {
  const today = getTodayJSTDateString(referenceDate);
  return getPlannedIncomes(data, referenceDate).filter((income) => income.paidOn <= today);
}

export function getNextIncome(data: BudgetData, referenceDate = new Date()) {
  const today = getTodayJSTDateString(referenceDate);
  return getPlannedIncomes(data, referenceDate)
    .filter((income) => income.paidOn >= today)
    .sort((a, b) => a.paidOn.localeCompare(b.paidOn))[0];
}

export function groupExpensesByCategory(expenses: Expense[]) {
  const map = new Map<string, number>();
  expenses.forEach((expense) => {
    if (!expense.categoryId) return;
    map.set(expense.categoryId, (map.get(expense.categoryId) ?? 0) + expense.amount);
  });
  return Array.from(map, ([categoryId, value]) => ({ categoryId, value }));
}

export function calculateCategorySpending(expenses: Expense[], referenceDate = new Date()) {
  return new Map(groupExpensesByCategory(expenses.filter((expense) => isDateInMonthJST(expense.date, referenceDate))).map((item) => [item.categoryId, item.value]));
}

export function getMonthlyCategoryBudgetProgress(data: BudgetData, referenceDate = new Date()) {
  const expenseTotals = calculateCategorySpending(data.expenses, referenceDate);
  return getCategoriesByKind(data, "expense")
    .filter((category) => typeof category.monthlyBudget === "number")
    .map((category) => {
      const used = expenseTotals.get(category.id) ?? 0;
      const budget = category.monthlyBudget ?? 0;
      return { category, used, budget, rate: budget === 0 ? 0 : used / budget, remaining: budget - used };
    })
    .sort((a, b) => {
      if (b.rate !== a.rate) return b.rate - a.rate;
      if (b.used !== a.used) return b.used - a.used;
      if (Number(b.category.favorite) !== Number(a.category.favorite)) return Number(b.category.favorite) - Number(a.category.favorite);
      return a.category.sortOrder - b.category.sortOrder;
    });
}

export const getCategoryBudgetUsage = getMonthlyCategoryBudgetProgress;

export function getVariableExpenseBudgetTotal(data: BudgetData) {
  return getCategoriesByKind(data, "expense").reduce((total, category) => total + (category.monthlyBudget ?? 0), 0);
}

export function getMonthEndForecast(data: BudgetData, referenceDate = new Date()) {
  const scoped = getMonthScopedData(data, referenceDate);
  const incomeTotal = sumBy(scoped.incomes, (income) => income.amount);
  const savingTotal = sumBy(scoped.savings, (saving) => saving.amount);
  const fixedCostTotal = sumBy(scoped.fixedCosts, (cost) => cost.amount);
  const loanTotal = sumBy(scoped.loans, (loan) => loan.monthlyPayment);
  const variableExpenseTotal = sumBy(scoped.expenses, (expense) => expense.amount);
  const fixedOutflow = savingTotal + fixedCostTotal + loanTotal;
  const elapsedDays = Math.max(1, getJSTDayOfMonth(referenceDate));
  const variableBudgetTotal = getVariableExpenseBudgetTotal(data);
  const paceVariableExpense = (variableExpenseTotal / elapsedDays) * getBudgetDays(referenceDate);
  return {
    fixedOutflow,
    variableBudgetTotal,
    paceVariableExpense,
    budgetBasedLanding: incomeTotal - fixedOutflow - variableBudgetTotal,
    paceBasedLanding: incomeTotal - fixedOutflow - paceVariableExpense,
    isEarlyMonth: elapsedDays <= 3
  };
}

export function getTotals(data: BudgetData, referenceDate = new Date()) {
  const scoped = getMonthScopedData(data, referenceDate);
  const incomeTotal = sumBy(scoped.incomes, (income) => income.amount);
  const paidIncomeTotal = sumBy(getPaidIncomes(data, referenceDate), (income) => income.amount);
  const savingTotal = sumBy(scoped.savings, (saving) => saving.amount);
  const fixedCostTotal = sumBy(scoped.fixedCosts, (cost) => cost.amount);
  const loanTotal = sumBy(scoped.loans, (loan) => loan.monthlyPayment);
  const variableExpenseTotal = sumBy(scoped.expenses, (expense) => expense.amount);
  const livingBudget = incomeTotal - savingTotal - fixedCostTotal - loanTotal;
  const remainingBudget = livingBudget - variableExpenseTotal;
  const dailyGuide = remainingBudget / getRemainingDays(referenceDate);
  const forecast = getMonthEndForecast(data, referenceDate);
  return {
    incomeTotal,
    paidIncomeTotal,
    savingTotal,
    fixedCostTotal,
    loanTotal,
    variableExpenseTotal,
    livingBudget,
    remainingBudget,
    dailyGuide,
    projectedVariableExpense: forecast.paceVariableExpense,
    projectedLanding: forecast.budgetBasedLanding,
    paceBasedLanding: forecast.paceBasedLanding,
    budgetBasedLanding: forecast.budgetBasedLanding,
    isEarlyMonthForecast: forecast.isEarlyMonth,
    isOverspending: forecast.budgetBasedLanding < 0 || dailyGuide < 0,
    savingRate: incomeTotal === 0 ? 0 : savingTotal / incomeTotal,
    fixedCostRate: incomeTotal === 0 ? 0 : fixedCostTotal / incomeTotal,
    variableExpenseRate: incomeTotal === 0 ? 0 : variableExpenseTotal / incomeTotal
  };
}

export function getBudgetConsumption(data: BudgetData, referenceDate = new Date()) {
  const totals = getTotals(data, referenceDate);
  const used = totals.fixedCostTotal + totals.loanTotal + totals.savingTotal + totals.variableExpenseTotal;
  return { used, plannedIncome: totals.incomeTotal, rate: totals.incomeTotal === 0 ? 0 : used / totals.incomeTotal };
}

export function getMonthlyExpenseSummary(data: BudgetData, referenceDate = new Date()) {
  const scoped = getMonthScopedData(data, referenceDate);
  const previousReferenceDate = getReferenceDateFromMonthKey(shiftMonthKey(getMonthBudgetPeriod(referenceDate).monthKey, -1));
  const previousScoped = getMonthScopedData(data, previousReferenceDate);
  const variableExpenseTotal = sumBy(scoped.expenses, (expense) => expense.amount);
  const fixedCostTotal = sumBy(scoped.fixedCosts, (cost) => cost.amount);
  const sharedCreditCardTotal = sumBy(scoped.expenses.filter(isSharedCreditCardExpense), (expense) => expense.amount);
  const total = variableExpenseTotal + fixedCostTotal;
  const previousTotal = sumBy(previousScoped.expenses, (expense) => expense.amount) + sumBy(previousScoped.fixedCosts, (cost) => cost.amount);
  return {
    total,
    variableExpenseTotal,
    fixedCostTotal,
    sharedCreditCardTotal,
    expenseCount: scoped.expenses.length,
    previousTotal,
    previousDiffRate: previousTotal === 0 ? undefined : (total - previousTotal) / previousTotal
  };
}

export function getExpensePaymentMethodType(expense: Expense): PaymentMethodType {
  if (expense.paymentMethodType) return expense.paymentMethodType;
  if (expense.paidByType === "shared_wallet" || expense.payer === "共通財布") return "shared_wallet";
  return "personal";
}

export function isSharedWalletExpense(expense: Expense) {
  return getExpensePaymentMethodType(expense) === "shared_wallet";
}

export function isSharedCreditCardExpense(expense: Expense) {
  return getExpensePaymentMethodType(expense) === "shared_credit_card";
}

export function getPaymentMethodLabel(data: BudgetData, expense: Expense) {
  const type = getExpensePaymentMethodType(expense);
  if (type === "personal") return `${expense.payer || "個人"}個人支払い`;
  if (type === "shared_wallet") return "共通財布";
  if (type === "household_account") return "家計口座";
  return data.commonPaymentMethods.find((item) => item.id === expense.paymentMethodId)?.name ?? "共通クレカ";
}

export function getExpensePayerLabel(expense: Expense) {
  return expense.paidByType === "shared_wallet" || expense.payer === "共通" ? "共通" : expense.payer || "支払者未設定";
}

export function getMonthlyPayerBreakdown(data: BudgetData, referenceDate = new Date()) {
  const scoped = getMonthScopedData(data, referenceDate);
  const memberRows = data.members.map((member) => ({
    id: member.id,
    label: member.name,
    amount: sumBy(scoped.expenses.filter((expense) => getExpensePaymentMethodType(expense) === "personal" && expense.payer === member.name), (expense) => expense.amount)
  }));
  return [
    ...memberRows,
    { id: "shared_wallet", label: "共通財布", amount: sumBy(scoped.expenses.filter((expense) => getExpensePaymentMethodType(expense) === "shared_wallet"), (expense) => expense.amount) },
    { id: "shared_credit_card", label: "共通クレカ", amount: sumBy(scoped.expenses.filter((expense) => getExpensePaymentMethodType(expense) === "shared_credit_card"), (expense) => expense.amount) },
    { id: "household_account", label: "家計口座", amount: sumBy(scoped.expenses.filter((expense) => getExpensePaymentMethodType(expense) === "household_account"), (expense) => expense.amount) }
  ];
}

export function getMonthlyPaymentMethodBreakdown(data: BudgetData, referenceDate = new Date()) {
  const map = new Map<string, { id: string; label: string; type: PaymentMethodType; amount: number }>();
  getMonthScopedData(data, referenceDate).expenses.forEach((expense) => {
    const type = getExpensePaymentMethodType(expense);
    const id = type === "shared_credit_card" && expense.paymentMethodId ? expense.paymentMethodId : type === "personal" ? `personal-${expense.payer}` : type;
    const current = map.get(id) ?? { id, label: getPaymentMethodLabel(data, expense), type, amount: 0 };
    current.amount += expense.amount;
    map.set(id, current);
  });
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

export function getSharedWalletBalance(data: BudgetData) {
  const transactionTotal = sumBy(data.sharedWalletTransactions, (row) => (row.type === "withdrawal" ? -row.amount : row.amount));
  return transactionTotal - sumBy(data.expenses.filter(isSharedWalletExpense), (expense) => expense.amount);
}

export function getMonthlySharedWalletUsage(data: BudgetData, referenceDate = new Date()) {
  return sumBy(getMonthScopedData(data, referenceDate).expenses.filter(isSharedWalletExpense), (expense) => expense.amount);
}

export function getCreditCardBillingSummaries(data: BudgetData, referenceDate = new Date()) {
  const current = getMonthBudgetPeriod(referenceDate);
  const today = getTodayJSTDateString(referenceDate);
  return data.commonPaymentMethods
    .filter((method) => method.type === "shared_credit_card" && !method.archived)
    .map((card) => {
      const closingDay = card.closingDay ?? current.totalDays;
      const withdrawalDay = card.withdrawalDay ?? 27;
      const currentClose = dateFromMonthDay(current.monthKey, closingDay);
      const billingCloseMonth = today <= currentClose ? current.monthKey : shiftMonthKey(current.monthKey, 1);
      const previousCloseMonth = shiftMonthKey(billingCloseMonth, -1);
      const previousClose = dateFromMonthDay(previousCloseMonth, closingDay);
      const billingStart = shiftDateKey(previousClose, 1);
      const billingEnd = dateFromMonthDay(billingCloseMonth, closingDay);
      const withdrawalMonth = shiftMonthKey(billingCloseMonth, 1);
      const withdrawalDate = dateFromMonthDay(withdrawalMonth, withdrawalDay);
      const expenses = data.expenses.filter((expense) => expense.paymentMethodId === card.id || (isSharedCreditCardExpense(expense) && !expense.paymentMethodId));
      const billedExpenses = expenses.filter((expense) => dateInRange(expense.date, billingStart, billingEnd));
      const monthlyExpenses = expenses.filter((expense) => isDateInMonthJST(expense.date, referenceDate));
      return {
        card,
        billingStart,
        billingEnd,
        withdrawalDate,
        monthlyUsage: sumBy(monthlyExpenses, (expense) => expense.amount),
        nextBillingAmount: sumBy(billedExpenses, (expense) => expense.amount)
      };
    });
}

export function getSharedCreditCardSummary(data: BudgetData, referenceDate = new Date()) {
  const summaries = getCreditCardBillingSummaries(data, referenceDate);
  const first = summaries[0];
  return {
    amount: sumBy(summaries, (summary) => summary.monthlyUsage),
    nextWithdrawalAmount: sumBy(summaries, (summary) => summary.nextBillingAmount),
    withdrawalDate: first?.withdrawalDate.replaceAll("-", "/") ?? "未設定",
    cardName: first?.card.name ?? "共通クレカ",
    withdrawalAccount: first?.card.withdrawalAccount ?? "未設定"
  };
}

export function getUpcomingPayments(data: BudgetData, referenceDate = new Date()) {
  const period = getMonthBudgetPeriod(referenceDate);
  const today = getTodayJSTDateString(referenceDate);
  const rows: Array<{ date: string; type: "income" | "fixed_cost" | "loan" | "credit_card" | "saving"; label: string; amount: number; tone?: "income" | "outflow" }> = [];
  getPlannedIncomes(data, referenceDate).forEach((income) => rows.push({ date: income.paidOn, type: "income", label: `給与・収入: ${income.name}`, amount: income.amount, tone: "income" }));
  data.fixedCosts.forEach((cost) => rows.push({ date: dateFromMonthDay(period.monthKey, cost.paidOn), type: "fixed_cost", label: `固定費: ${cost.name}`, amount: cost.amount, tone: "outflow" }));
  data.loans.forEach((loan) => rows.push({ date: dateFromMonthDay(period.monthKey, loan.paidOn), type: "loan", label: `ローン: ${loan.name}`, amount: loan.monthlyPayment, tone: "outflow" }));
  data.savings.forEach((saving) => rows.push({ date: period.startDate, type: "saving", label: `貯金積立: ${saving.name}`, amount: saving.amount, tone: "outflow" }));
  getCreditCardBillingSummaries(data, referenceDate).forEach((summary) => rows.push({ date: summary.withdrawalDate, type: "credit_card", label: `クレカ引落: ${summary.card.name}`, amount: summary.nextBillingAmount, tone: "outflow" }));
  return rows.filter((row) => row.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
}

export function getSubscriptionCandidates(data: BudgetData) {
  const groups = new Map<string, Expense[]>();
  data.expenses.forEach((expense) => {
    const key = `${expense.amount}-${expense.location || expense.memo || expense.categoryId}`;
    groups.set(key, [...(groups.get(key) ?? []), expense]);
  });
  return Array.from(groups.values())
    .map((expenses) => {
      const months = new Set(expenses.map((expense) => expense.date.slice(0, 7)));
      const latest = expenses.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
      return { latest, count: months.size, months: Array.from(months).sort() };
    })
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function createCurrentMonthlySummary(data: BudgetData, referenceDate = new Date()): MonthlySummary {
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
    landingResult: totals.budgetBasedLanding,
    categoryExpenses: Object.fromEntries(groupExpensesByCategory(scoped.expenses).map((item) => [item.categoryId, item.value])),
    memo: "月締め前のプレビューです。",
    closedAt: ""
  };
}

export function getMonthlyTrend(data: BudgetData, referenceDate = new Date()) {
  const current = createCurrentMonthlySummary(data, referenceDate);
  const summaries = data.monthlySummaries.filter((summary) => summary.month !== current.month);
  return [...summaries, current]
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((summary) => ({
      month: summary.month.slice(5),
      income: summary.incomeTotal,
      spending: summary.fixedCostTotal + summary.loanTotal + summary.savingTotal + summary.variableExpenseTotal,
      remaining: summary.remainingBudget,
      saving: summary.savingTotal,
      fixedCost: summary.fixedCostTotal,
      variableExpense: summary.variableExpenseTotal
    }));
}

export function getComparisonSummary(data: BudgetData, target: CompareTarget, referenceDate = new Date()) {
  const currentMonthKey = getMonthBudgetPeriod(referenceDate).monthKey;
  const summaries = [...data.monthlySummaries].sort((a, b) => b.month.localeCompare(a.month));
  if (target === "last_month") return summaries.find((summary) => summary.month === shiftMonthKey(currentMonthKey, -1));
  if (target === "two_months_ago") return summaries.find((summary) => summary.month === shiftMonthKey(currentMonthKey, -2));
  if (target === "six_months_ago") return summaries.find((summary) => summary.month === shiftMonthKey(currentMonthKey, -6));
  if (target === "same_month_last_year") return summaries.find((summary) => summary.month === shiftMonthKey(currentMonthKey, -12));
  const keys = [shiftMonthKey(currentMonthKey, -1), shiftMonthKey(currentMonthKey, -2), shiftMonthKey(currentMonthKey, -3)];
  const lastThree = summaries.filter((summary) => keys.includes(summary.month));
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
    categoryExpenses: Object.fromEntries(Array.from(categoryIds).map((categoryId) => [categoryId, average(summaries.map((summary) => summary.categoryExpenses[categoryId] ?? 0))])),
    memo: "過去3か月の平均です。",
    closedAt: ""
  };
}

function average(values: number[]) {
  return values.length === 0 ? 0 : sumBy(values, (value) => value) / values.length;
}

export function getMonthlyComparison(data: BudgetData, target: CompareTarget = "last_month", referenceDate = new Date()) {
  const current = createCurrentMonthlySummary(data, referenceDate);
  const compared = getComparisonSummary(data, target, referenceDate);
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
    rows: rows.map(([label, currentValue, comparedValue]) => ({ label, currentValue, comparedValue, diff: currentValue - comparedValue })),
    categoryRows: getCategoriesByKind(data, "expense").map((category) => {
      const currentValue = current.categoryExpenses[category.id] ?? 0;
      const comparedValue = compared?.categoryExpenses[category.id] ?? 0;
      return { category, currentValue, comparedValue, diff: currentValue - comparedValue };
    })
  };
}

export function getCalendarDaySummaries(data: BudgetData, referenceDate = new Date()) {
  const period = getMonthBudgetPeriod(referenceDate);
  const dailyTotals = new Map<string, number>();
  const dailyExpenses = new Map<string, Expense[]>();
  getMonthScopedData(data, referenceDate).expenses.forEach((expense) => {
    dailyTotals.set(expense.date, (dailyTotals.get(expense.date) ?? 0) + expense.amount);
    dailyExpenses.set(expense.date, [...(dailyExpenses.get(expense.date) ?? []), expense]);
  });
  const firstWeekday = new Date(Date.UTC(period.year, period.month - 1, 1)).getUTCDay();
  const cells: Array<{ date: string; day: number | null; total: number; expenses: Expense[]; inMonth: boolean }> = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push({ date: "", day: null, total: 0, expenses: [], inMonth: false });
  for (let day = 1; day <= period.totalDays; day += 1) {
    const date = `${period.monthKey}-${pad2(day)}`;
    cells.push({ date, day, total: dailyTotals.get(date) ?? 0, expenses: dailyExpenses.get(date) ?? [], inMonth: true });
  }
  return { period, cells };
}

export function getReferenceDateForMonthKey(monthKey: string) {
  return getReferenceDateFromMonthKey(monthKey);
}

export function getMemberBurdenShares(data: BudgetData, rule: BurdenRule = data.settings.burdenRule) {
  if (data.members.length === 0) return {};
  if (rule === "fifty_fifty") return Object.fromEntries(data.members.map((member) => [member.id, 1 / data.members.length]));
  if (rule === "custom") return normalizeShares(Object.fromEntries(data.members.map((member) => [member.id, data.settings.customShares[member.id] ?? member.shareRatio])));
  const incomeByName = new Map<string, number>();
  getPlannedIncomes(data).forEach((income) => incomeByName.set(income.earner, (incomeByName.get(income.earner) ?? 0) + income.amount));
  const totalIncome = sumBy(data.members, (member) => incomeByName.get(member.name) ?? 0);
  return normalizeShares(Object.fromEntries(data.members.map((member) => [member.id, totalIncome === 0 ? member.shareRatio : (incomeByName.get(member.name) ?? 0) / totalIncome])));
}

export function calculateSharedBurden(expense: Expense, data: BudgetData) {
  if (expense.target !== "shared") {
    const member = data.members.find((item) => item.name === expense.payer);
    return Object.fromEntries(data.members.map((item) => [item.id, item.id === member?.id ? expense.amount : 0]));
  }
  const shares = getMemberBurdenShares(data);
  return Object.fromEntries(data.members.map((member) => [member.id, expense.amount * (shares[member.id] ?? 0)]));
}

function normalizeShares(shares: Record<string, number>) {
  const entries = Object.entries(shares).map(([id, value]) => [id, Number.isFinite(value) && value > 0 ? value : 0] as const);
  const total = sumBy(entries, ([, value]) => value);
  if (entries.length === 0) return {};
  if (total <= 0) return Object.fromEntries(entries.map(([id]) => [id, 1 / entries.length]));
  return Object.fromEntries(entries.map(([id, value]) => [id, value / total]));
}

function shiftDateKey(dateKey: string, offsetDays: number) {
  const date = new Date(`${dateKey}T00:00:00+09:00`);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
