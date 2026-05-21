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

export type ExpenseTarget = "shared" | "self_only" | "partner_only";
export type BurdenRule = "fifty_fifty" | "custom" | "income_ratio";
export type CompareTarget = "last_month" | "two_months_ago" | "three_month_average" | "six_months_ago" | "same_month_last_year";

export type HouseholdMember = {
  id: string;
  userId?: string;
  name: string;
  role: "owner" | "member";
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
  householdGroupId?: string;
  currentUserId?: string;
  currentMemberId?: string;
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
