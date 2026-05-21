import { supabase } from "./supabase";
import type { BudgetData, BurdenRule, CategoryKind, ExpenseTarget, HouseholdMember } from "./types";

const defaultSettings = {
  groupName: "未設定",
  burdenRule: "50:50" as BurdenRule,
  customShares: {}
};

export const emptyBudgetData: BudgetData = {
  members: [],
  settings: defaultSettings,
  categories: [],
  incomes: [],
  savings: [],
  fixedCosts: [],
  loans: [],
  expenses: [],
  monthlySummaries: [],
  notificationRules: []
};

export async function getBudgetData(): Promise<BudgetData> {
  if (!supabase) {
    return emptyBudgetData;
  }

  const { data: group } = await supabase
    .from("household_groups")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!group) {
    return emptyBudgetData;
  }

  const groupId = group.id as string;
  const [membersResult, categoriesResult, incomesResult, savingsResult, fixedCostsResult, loansResult, expensesResult, summariesResult] =
    await Promise.all([
      supabase.from("household_members").select("*").eq("household_group_id", groupId).order("created_at", { ascending: true }),
      supabase.from("categories").select("*").eq("household_group_id", groupId).order("sort_order", { ascending: true }),
      supabase.from("incomes").select("*").eq("household_group_id", groupId).order("paid_on", { ascending: false }),
      supabase.from("savings").select("*").eq("household_group_id", groupId).order("created_at", { ascending: true }),
      supabase.from("fixed_costs").select("*").eq("household_group_id", groupId).order("paid_on", { ascending: true }),
      supabase.from("loans").select("*").eq("household_group_id", groupId).order("paid_on", { ascending: true }),
      supabase.from("expenses").select("*").eq("household_group_id", groupId).order("spent_on", { ascending: false }),
      supabase.from("monthly_summaries").select("*").eq("household_group_id", groupId).order("target_month", { ascending: false })
    ]);

  const members = (membersResult.data ?? []).map((member: Record<string, unknown>): HouseholdMember => ({
    id: String(member.id),
    name: String(member.display_name ?? ""),
    role: member.role === "self" ? "自分" : "パートナー",
    shareRatio: Number(member.custom_share_ratio ?? 0)
  }));

  return {
    members,
    settings: {
      groupName: String(group.name ?? "未設定"),
      burdenRule: mapBurdenRule(String(group.burden_rule ?? "fifty_fifty")),
      customShares: Object.fromEntries(members.map((member) => [member.id, member.shareRatio]))
    },
    categories: (categoriesResult.data ?? []).map((category: Record<string, unknown>) => ({
      id: String(category.id),
      kind: String(category.kind) as CategoryKind,
      name: String(category.name ?? ""),
      color: String(category.color ?? "#2f8f6b"),
      icon: String(category.icon ?? "・"),
      sortOrder: Number(category.sort_order ?? 1),
      hidden: Boolean(category.hidden),
      archived: Boolean(category.archived),
      monthlyBudget: category.monthly_budget == null ? undefined : Number(category.monthly_budget),
      favorite: Boolean(category.favorite)
    })),
    incomes: (incomesResult.data ?? []).map((income: Record<string, unknown>) => ({
      id: String(income.id),
      name: String(income.name ?? ""),
      amount: Number(income.amount ?? 0),
      paidOn: String(income.paid_on ?? ""),
      earner: String(income.earner_name ?? ""),
      categoryId: String(income.category_id ?? ""),
      recurring: Boolean(income.recurring)
    })),
    savings: (savingsResult.data ?? []).map((saving: Record<string, unknown>) => ({
      id: String(saving.id),
      name: String(saving.name ?? ""),
      amount: Number(saving.amount ?? 0),
      categoryId: String(saving.category_id ?? ""),
      recurring: Boolean(saving.recurring)
    })),
    fixedCosts: (fixedCostsResult.data ?? []).map((cost: Record<string, unknown>) => ({
      id: String(cost.id),
      name: String(cost.name ?? ""),
      amount: Number(cost.amount ?? 0),
      paidOn: Number(cost.paid_on ?? 1),
      payer: String(cost.payer_name ?? ""),
      categoryId: String(cost.category_id ?? ""),
      recurring: Boolean(cost.recurring),
      reviewTarget: Boolean(cost.review_target),
      reviewMemo: String(cost.review_memo ?? "")
    })),
    loans: (loansResult.data ?? []).map((loan: Record<string, unknown>) => ({
      id: String(loan.id),
      name: String(loan.name ?? ""),
      monthlyPayment: Number(loan.monthly_payment ?? 0),
      paidOn: Number(loan.paid_on ?? 1),
      remainingBalance: Number(loan.remaining_balance ?? 0),
      interestRate: Number(loan.interest_rate ?? 0),
      payoffDate: String(loan.payoff_date ?? ""),
      hasBonusPayment: Boolean(loan.has_bonus_payment),
      memo: String(loan.memo ?? "")
    })),
    expenses: (expensesResult.data ?? []).map((expense: Record<string, unknown>) => ({
      id: String(expense.id),
      amount: Number(expense.amount ?? 0),
      date: String(expense.spent_on ?? ""),
      categoryId: String(expense.category_id ?? ""),
      payer: String(expense.payer_name ?? ""),
      target: mapExpenseTarget(String(expense.target ?? "shared")),
      memo: String(expense.memo ?? "")
    })),
    monthlySummaries: (summariesResult.data ?? []).map((summary: Record<string, unknown>) => ({
      id: String(summary.id),
      month: String(summary.target_month ?? ""),
      incomeTotal: Number(summary.income_total ?? 0),
      fixedCostTotal: Number(summary.fixed_cost_total ?? 0),
      loanTotal: Number(summary.loan_total ?? 0),
      variableExpenseTotal: Number(summary.variable_expense_total ?? 0),
      savingTotal: Number(summary.saving_total ?? 0),
      remainingBudget: Number(summary.remaining_budget ?? 0),
      landingResult: Number(summary.landing_result ?? 0),
      categoryExpenses: (summary.category_expenses ?? {}) as Record<string, number>,
      memo: String(summary.memo ?? ""),
      closedAt: String(summary.closed_at ?? "")
    })),
    notificationRules: []
  };
}

function mapBurdenRule(value: string): BurdenRule {
  if (value === "custom") return "任意割合";
  if (value === "income_ratio") return "収入比率";
  return "50:50";
}

function mapExpenseTarget(value: string): ExpenseTarget {
  if (value === "self_only") return "自分のみ";
  if (value === "partner_only") return "パートナーのみ";
  return "共有";
}
