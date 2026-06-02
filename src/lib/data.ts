import { cache } from "react";
import { createServerSupabaseClient } from "./supabase/server";
import type {
  BudgetData,
  BurdenRule,
  CategoryKind,
  ExpenseTarget,
  HomeWidgetSettings,
  HouseholdMember,
  PaymentMethodType,
  ReceiptRetentionPolicy,
  SharedWalletTransactionType
} from "./types";

export const defaultHomeWidgets: HomeWidgetSettings = {
  monthEnd: true,
  payerBreakdown: true,
  categoryBudget: true,
  sharedWallet: true,
  incomeSchedule: true,
  burdenRatio: false
};

const defaultSettings = {
  groupName: "未設定",
  inviteCode: undefined,
  iconUrl: undefined,
  saveReceiptImages: false,
  receiptRetentionPolicy: "none" as ReceiptRetentionPolicy,
  improvementNotes: "",
  burdenRule: "fifty_fifty" as BurdenRule,
  customShares: {},
  homeWidgets: defaultHomeWidgets
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
  commonPaymentMethods: [],
  sharedWalletTransactions: [],
  savingGoals: [],
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
    paymentMethodsResult,
    walletResult,
    savingGoalsResult,
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
    supabase.from("common_payment_methods").select("*").eq("household_group_id", groupId).order("created_at", { ascending: true }),
    supabase.from("shared_wallet_transactions").select("*").eq("household_group_id", groupId).order("occurred_on", { ascending: false }),
    supabase.from("saving_goals").select("*").eq("household_group_id", groupId).order("created_at", { ascending: true }),
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
      iconUrl: groupResult.data?.icon_url ? String(groupResult.data.icon_url) : undefined,
      saveReceiptImages: Boolean(groupResult.data?.save_receipt_images),
      receiptRetentionPolicy: mapReceiptRetentionPolicy(String(groupResult.data?.receipt_retention_policy ?? "none")),
      improvementNotes: String(groupResult.data?.improvement_notes ?? ""),
      burdenRule: mapBurdenRule(String(groupResult.data?.burden_rule ?? "fifty_fifty")),
      customShares: Object.fromEntries(members.map((member) => [member.id, member.shareRatio])),
      homeWidgets: mapHomeWidgets(groupResult.data?.home_widgets)
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
      paidByType: expense.paid_by_type === "shared_wallet" ? "shared_wallet" : "member",
      paidByUserId: expense.paid_by_user_id ? String(expense.paid_by_user_id) : undefined,
      paymentMethodType: mapPaymentMethodType(String(expense.payment_method_type ?? (expense.paid_by_type === "shared_wallet" ? "shared_wallet" : "personal"))),
      paymentMethodId: expense.payment_method_id ? String(expense.payment_method_id) : undefined,
      target: mapExpenseTarget(String(expense.target ?? "shared")),
      location: expense.location ? String(expense.location) : "",
      memo: String(expense.memo ?? ""),
      receiptImageUrl: expense.receipt_image_url ? String(expense.receipt_image_url) : undefined,
      receiptOcrText: expense.receipt_ocr_text ? String(expense.receipt_ocr_text) : undefined,
      receiptConfidence: expense.receipt_confidence == null ? undefined : Number(expense.receipt_confidence),
      receiptExpiresAt: expense.receipt_expires_at ? String(expense.receipt_expires_at) : undefined,
      receiptCompressedSize: expense.receipt_compressed_size == null ? undefined : Number(expense.receipt_compressed_size)
    })),
    commonPaymentMethods: (paymentMethodsResult.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      type: mapPaymentMethodType(String(row.type ?? "shared_credit_card")),
      name: String(row.name ?? ""),
      closingDay: row.closing_day == null ? undefined : Number(row.closing_day),
      withdrawalDay: row.withdrawal_day == null ? undefined : Number(row.withdrawal_day),
      withdrawalAccount: row.withdrawal_account ? String(row.withdrawal_account) : undefined,
      archived: Boolean(row.archived)
    })),
    sharedWalletTransactions: (walletResult.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      type: mapSharedWalletTransactionType(String(row.type ?? "deposit")),
      amount: Number(row.amount ?? 0),
      occurredOn: String(row.occurred_on ?? ""),
      memo: String(row.memo ?? ""),
      memberId: row.member_id ? String(row.member_id) : undefined
    })),
    savingGoals: (savingGoalsResult.data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      targetAmount: Number(row.target_amount ?? 0),
      currentAmount: Number(row.current_amount ?? 0),
      dueDate: row.due_date ? String(row.due_date) : undefined,
      memo: row.memo ? String(row.memo) : undefined,
      archived: Boolean(row.archived)
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

function mapBurdenRule(value: string): BurdenRule {
  if (value === "custom") return "custom";
  if (value === "income_ratio") return "income_ratio";
  return "fifty_fifty";
}

function mapExpenseTarget(value: string): ExpenseTarget {
  if (value === "self_only") return "self_only";
  if (value === "partner_only") return "partner_only";
  return "shared";
}

function mapSharedWalletTransactionType(value: string): SharedWalletTransactionType {
  if (value === "withdrawal") return "withdrawal";
  if (value === "adjustment") return "adjustment";
  return "deposit";
}

function mapPaymentMethodType(value: string): PaymentMethodType {
  if (value === "shared_wallet") return "shared_wallet";
  if (value === "shared_credit_card") return "shared_credit_card";
  if (value === "household_account") return "household_account";
  return "personal";
}

function mapReceiptRetentionPolicy(value: string): ReceiptRetentionPolicy {
  if (value === "30_days") return "30_days";
  if (value === "90_days") return "90_days";
  if (value === "forever") return "forever";
  return "none";
}

function mapHomeWidgets(value: unknown): HomeWidgetSettings {
  if (!value || typeof value !== "object") return defaultHomeWidgets;
  const record = value as Partial<HomeWidgetSettings>;
  return {
    monthEnd: record.monthEnd ?? true,
    payerBreakdown: record.payerBreakdown ?? true,
    categoryBudget: record.categoryBudget ?? true,
    sharedWallet: record.sharedWallet ?? true,
    incomeSchedule: record.incomeSchedule ?? true,
    burdenRatio: record.burdenRatio ?? false
  };
}
