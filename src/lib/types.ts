export type CategoryKind = "expense" | "fixed_cost" | "income" | "saving";

export type Category = {
  id: string;
  kind: CategoryKind;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  hidden: boolean;
  archived: boolean;
  monthlyBudget?: number;
  favorite?: boolean;
};

export type ExpenseTarget = "共有" | "自分のみ" | "パートナーのみ";
export type BurdenRule = "50:50" | "任意割合" | "収入比率";
export type CompareTarget = "先月" | "先々月" | "3か月平均" | "半年前" | "1年前同月";

export type HouseholdMember = {
  id: string;
  name: string;
  role: "自分" | "パートナー";
  shareRatio: number;
};

export type HouseholdSettings = {
  groupName: string;
  burdenRule: BurdenRule;
  customShares: Record<string, number>;
};

export type Income = {
  id: string;
  name: string;
  amount: number;
  paidOn: string;
  earner: string;
  categoryId: string;
  recurring: boolean;
};

export type Saving = {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  recurring: boolean;
};

export type FixedCost = {
  id: string;
  name: string;
  amount: number;
  paidOn: number;
  payer: string;
  categoryId: string;
  recurring: boolean;
  reviewTarget: boolean;
  reviewMemo?: string;
};

export type Loan = {
  id: string;
  name: string;
  monthlyPayment: number;
  paidOn: number;
  remainingBalance: number;
  interestRate: number;
  payoffDate: string;
  hasBonusPayment: boolean;
  memo: string;
};

export type Expense = {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
  payer: string;
  target: ExpenseTarget;
  memo: string;
};

export type MonthlySummary = {
  id: string;
  month: string;
  incomeTotal: number;
  fixedCostTotal: number;
  loanTotal: number;
  variableExpenseTotal: number;
  savingTotal: number;
  remainingBudget: number;
  landingResult: number;
  categoryExpenses: Record<string, number>;
  memo: string;
  closedAt: string;
};

export type NotificationRule = {
  id: string;
  type: "category_80" | "category_over" | "monthly_pace_over" | "fixed_cost_review";
  enabled: boolean;
  threshold?: number;
};

export type BudgetData = {
  members: HouseholdMember[];
  settings: HouseholdSettings;
  categories: Category[];
  incomes: Income[];
  savings: Saving[];
  fixedCosts: FixedCost[];
  loans: Loan[];
  expenses: Expense[];
  monthlySummaries: MonthlySummary[];
  notificationRules: NotificationRule[];
};
