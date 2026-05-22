import { cache } from "react";
import { createServerSupabaseClient } from "./supabase/server";
import type { BudgetData, CategoryKind, ExpenseTarget, HouseholdMember } from "./types";

const defaultSettings = {
  groupName: "未設定",
  burdenRule: "fifty_fifty" as const,
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

export const getBudgetData = cache(async (): Promise<BudgetData> => {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return emptyBudgetData;

  const { data: membership } = await supabase
    .from("household_members")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return { ...emptyBudgetData, currentUserId: user.id };

  const groupId = String(membership.household_group_id);
  const [
    groupResult,
    membersResult,
    categoriesResult,
    incomesResult,
    savingsResult,
    fixedCostsResult,
    loansResult,
    expensesResult,
    summariesResult
  ] = await Promise.all([
    supabase.from("household_groups").select("*").eq("id", groupId).maybeSingle(),
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
    userId: member.user_id ? String(member.user_id) : undefined,
    name: String(member.display_name ?? ""),
    role: member.role === "owner" ? "owner" : "member",
    shareRatio: Number(member.custom_share_ratio ?? 0.5)
  }));

  return {
    householdGroupId: groupId,
    currentUserId: user.id,
    currentMemberId: String(membership.id),
    members,
    settings: {
      groupName: String(groupResult.data?.name ?? "未設定"),
      inviteCode: groupResult.data?.invite_code ? String(groupResult.data.invite_code) : undefined,
      burdenRule: mapBurdenRule(String(groupResult.data?.burden_rule ?? "fifty_fifty")),
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
});

function mapBurdenRule(value: string) {
  if (value === "custom") return "custom" as const;
  if (value === "income_ratio") return "income_ratio" as const;
  return "fifty_fifty" as const;
}

function mapExpenseTarget(value: string): ExpenseTarget {
  if (value === "self_only") return "self_only";
  if (value === "partner_only") return "partner_only";
  return "shared";
}
