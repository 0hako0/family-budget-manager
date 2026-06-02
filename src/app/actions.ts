"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCurrentMonthlySummary } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { getCurrentMonthPeriodJST, getReferenceDateFromMonthKey, getTodayJSTDateString, shiftMonthKey } from "@/lib/date";
import { toJapaneseError } from "@/lib/error-messages";
import { normalizeInviteCode } from "@/lib/invite-code";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CategoryKind } from "@/lib/types";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const parsed = Number(value(formData, key));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

async function requireUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!session || !user) redirect(`/login?error=${encodeURIComponent(toJapaneseError("not authenticated"))}`);
  return { supabase, user };
}

function revalidateCore() {
  ["/", "/expenses", "/fixed-costs", "/incomes", "/savings", "/loans", "/reports", "/settings"].forEach((path) => revalidatePath(path));
}

export async function signIn(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email: value(formData, "email"), password: value(formData, "password") });
  if (error) redirect(`/login?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const email = value(formData, "email");
  const password = value(formData, "password");
  const displayName = value(formData, "displayName") || email;
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
  if (error) redirect(`/signup?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) redirect(`/signup?error=${encodeURIComponent(toJapaneseError(signInError.message))}`);
  }
  redirect("/setup");
}

export async function signOut() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function setupHousehold(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.rpc("create_household_group", {
    group_name: value(formData, "groupName") || "わが家の家計",
    display_name: value(formData, "displayName") || user.email || "自分",
    burden_rule_value: value(formData, "burdenRule") || "fifty_fifty",
    share_ratio_value: Math.min(1, Math.max(0, numberValue(formData, "shareRatio", 50) / 100))
  });
  if (error) redirect(`/setup?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  redirect("/");
}

export async function createInvitation(formData: FormData) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("household_groups").select("invite_code").eq("id", value(formData, "householdGroupId")).maybeSingle();
  if (error) redirect(`/settings?inviteError=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidatePath("/settings");
  redirect(`/settings?invite=${encodeURIComponent(String(data?.invite_code ?? ""))}`);
}

export async function joinInvitation(formData: FormData) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.rpc("join_household_by_invite_code", {
    code: normalizeInviteCode(value(formData, "code")),
    display_name: value(formData, "displayName") || user.email || "パートナー",
    share_ratio_value: Math.min(1, Math.max(0, numberValue(formData, "shareRatio", 50) / 100))
  });
  if (error) redirect(`/setup?joinError=${encodeURIComponent(toJapaneseError(error.message))}`);
  redirect("/");
}

export async function closeCurrentMonth(formData: FormData) {
  const { supabase } = await requireUser();
  const householdGroupId = value(formData, "householdGroupId");
  const data = await getBudgetData();
  const summary = createCurrentMonthlySummary(data);
  if (!householdGroupId) redirect("/reports?error=家計グループを確認できませんでした");

  const { error } = await supabase.from("monthly_summaries").upsert(
    {
      household_group_id: householdGroupId,
      target_month: summary.month,
      income_total: Math.round(summary.incomeTotal),
      fixed_cost_total: Math.round(summary.fixedCostTotal),
      loan_total: Math.round(summary.loanTotal),
      variable_expense_total: Math.round(summary.variableExpenseTotal),
      saving_total: Math.round(summary.savingTotal),
      remaining_budget: Math.round(summary.remainingBudget),
      landing_result: Math.round(summary.landingResult),
      category_expenses: summary.categoryExpenses,
      memo: value(formData, "memo"),
      closed_at: new Date().toISOString()
    },
    { onConflict: "household_group_id,target_month" }
  );
  if (error) redirect(`/reports?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function ensurePreviousMonthSnapshot() {
  const { supabase } = await requireUser();
  const data = await getBudgetData();
  if (!data.householdGroupId) return;
  const previousMonthKey = shiftMonthKey(getCurrentMonthPeriodJST().monthKey, -1);
  if (data.monthlySummaries.some((summary) => summary.month === previousMonthKey)) return;
  const summary = createCurrentMonthlySummary(data, getReferenceDateFromMonthKey(previousMonthKey));
  const { error } = await supabase.from("monthly_summaries").upsert(
    {
      household_group_id: data.householdGroupId,
      target_month: summary.month,
      income_total: Math.round(summary.incomeTotal),
      fixed_cost_total: Math.round(summary.fixedCostTotal),
      loan_total: Math.round(summary.loanTotal),
      variable_expense_total: Math.round(summary.variableExpenseTotal),
      saving_total: Math.round(summary.savingTotal),
      remaining_budget: Math.round(summary.remainingBudget),
      landing_result: Math.round(summary.landingResult),
      category_expenses: summary.categoryExpenses,
      memo: "月初に自動保存",
      closed_at: new Date().toISOString()
    },
    { onConflict: "household_group_id,target_month" }
  );
  if (!error) revalidateCore();
}

export async function updateHouseholdSettings(formData: FormData) {
  const { supabase } = await requireUser();
  const householdGroupId = value(formData, "householdGroupId");
  const groupName = value(formData, "groupName");
  const burdenRule = value(formData, "burdenRule") || "fifty_fifty";
  if (!householdGroupId || !groupName) redirect("/settings?settingsError=家計グループ名を入力してください");

  const { error } = await supabase
    .from("household_groups")
    .update({
      name: groupName,
      icon_url: value(formData, "iconUrl") || null,
      burden_rule: ["fifty_fifty", "custom", "income_ratio"].includes(burdenRule) ? burdenRule : "fifty_fifty",
      save_receipt_images: checked(formData, "saveReceiptImages"),
      receipt_retention_policy: ["none", "30_days", "90_days", "forever"].includes(value(formData, "receiptRetentionPolicy"))
        ? value(formData, "receiptRetentionPolicy")
        : "none",
      improvement_notes: value(formData, "improvementNotes"),
      home_widgets: {
        monthEnd: checked(formData, "widgetMonthEnd"),
        payerBreakdown: checked(formData, "widgetPayerBreakdown"),
        categoryBudget: checked(formData, "widgetCategoryBudget"),
        sharedWallet: checked(formData, "widgetSharedWallet"),
        incomeSchedule: checked(formData, "widgetIncomeSchedule"),
        burdenRatio: checked(formData, "widgetBurdenRatio")
      }
    })
    .eq("id", householdGroupId);
  if (error) redirect(`/settings?settingsError=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
  redirect("/settings?saved=household");
}

export async function updateHouseholdMember(formData: FormData) {
  const { supabase } = await requireUser();
  const id = value(formData, "id");
  const displayName = value(formData, "displayName");
  if (!id || !displayName) redirect("/settings?memberError=表示名を入力してください");
  const { error } = await supabase
    .from("household_members")
    .update({
      display_name: displayName,
      custom_share_ratio: Math.min(1, Math.max(0, numberValue(formData, "shareRatio", 50) / 100)),
      role: value(formData, "role") === "owner" ? "owner" : "member"
    })
    .eq("id", id);
  if (error) redirect(`/settings?memberError=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
  redirect("/settings?saved=member");
}

export async function saveCommonPaymentMethod(formData: FormData) {
  const { supabase } = await requireUser();
  const id = value(formData, "id");
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  if (!householdGroupId || !name) redirect("/settings?settingsError=支払い方法名を入力してください");
  const payload = {
    household_group_id: householdGroupId,
    type: value(formData, "type") || "shared_credit_card",
    name,
    closing_day: value(formData, "closingDay") ? numberValue(formData, "closingDay") : null,
    withdrawal_day: value(formData, "withdrawalDay") ? numberValue(formData, "withdrawalDay") : null,
    withdrawal_account: value(formData, "withdrawalAccount") || null,
    archived: checked(formData, "archived")
  };
  const { error } = id
    ? await supabase.from("common_payment_methods").update(payload).eq("id", id).eq("household_group_id", householdGroupId)
    : await supabase.from("common_payment_methods").insert(payload);
  if (error) redirect(`/settings?settingsError=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
  redirect("/settings?saved=household");
}

export async function saveSavingGoal(formData: FormData) {
  const { supabase } = await requireUser();
  const id = value(formData, "id");
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  const targetAmount = numberValue(formData, "targetAmount");

  if (!householdGroupId || !name || !targetAmount) redirect("/settings?settingsError=貯金目標名と目標金額を入力してください");

  const payload = {
    household_group_id: householdGroupId,
    name,
    target_amount: targetAmount,
    current_amount: numberValue(formData, "currentAmount"),
    due_date: value(formData, "dueDate") || null,
    memo: value(formData, "memo"),
    archived: checked(formData, "archived")
  };

  const { error } = id
    ? await supabase.from("saving_goals").update(payload).eq("id", id).eq("household_group_id", householdGroupId)
    : await supabase.from("saving_goals").insert(payload);

  if (error) redirect(`/settings?settingsError=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
  redirect("/settings?saved=household");
}

export async function createSharedWalletTransaction(formData: FormData) {
  const { supabase } = await requireUser();
  const householdGroupId = value(formData, "householdGroupId");
  const amount = numberValue(formData, "amount");
  if (!householdGroupId || !amount) redirect("/?error=共通財布の金額を入力してください");
  const { error } = await supabase.from("shared_wallet_transactions").insert({
    household_group_id: householdGroupId,
    member_id: value(formData, "memberId") || null,
    type: value(formData, "type") || "deposit",
    amount,
    occurred_on: value(formData, "occurredOn") || getTodayJSTDateString(),
    memo: value(formData, "memo")
  });
  if (error) redirect(`/?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function createExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const id = value(formData, "id");
  const amount = numberValue(formData, "amount");
  const householdGroupId = value(formData, "householdGroupId");
  const categoryId = value(formData, "categoryId");
  if (!amount || !categoryId || !householdGroupId) redirect("/expenses?error=支出の金額とカテゴリを入力してください");

  const paymentMethodType = value(formData, "paymentMethodType") || value(formData, "paidByType") || "personal";
  const payerName = value(formData, "payer");
  const isCommonPayer = payerName === "共通";
  const isSharedWallet = paymentMethodType === "shared_wallet";
  const payload = {
    household_group_id: householdGroupId,
    member_id: value(formData, "memberId") || null,
    amount,
    spent_on: value(formData, "date") || getTodayJSTDateString(),
    category: "other",
    category_id: categoryId,
    payer_name: payerName || (paymentMethodType === "personal" ? "" : "共通"),
    paid_by_type: isCommonPayer || isSharedWallet ? "shared_wallet" : "member",
    paid_by_user_id: isCommonPayer || isSharedWallet ? null : value(formData, "paidByUserId") || null,
    payment_method_type: paymentMethodType,
    payment_method_id: value(formData, "paymentMethodId") || null,
    target: value(formData, "target") || "shared",
    location: value(formData, "location") || null,
    memo: value(formData, "memo"),
    receipt_image_url: value(formData, "receiptImageUrl") || null,
    receipt_ocr_text: value(formData, "receiptOcrText") || null,
    receipt_confidence: value(formData, "receiptConfidence") ? numberValue(formData, "receiptConfidence") : null
  };
  const { error } = id
    ? await supabase.from("expenses").update(payload).eq("id", id).eq("household_group_id", householdGroupId)
    : await supabase.from("expenses").insert(payload);
  if (error) redirect(`/expenses?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function createIncome(formData: FormData) {
  const { supabase } = await requireUser();
  const id = value(formData, "id");
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  const amount = numberValue(formData, "amount");
  if (!householdGroupId || !name || !amount) redirect("/incomes?error=収入名と金額を入力してください");
  const payload = {
    household_group_id: householdGroupId,
    member_id: value(formData, "memberId") || null,
    name,
    amount,
    paid_on: value(formData, "paidOn") || getTodayJSTDateString(),
    earner_name: value(formData, "earner"),
    income_type: "other",
    category_id: value(formData, "categoryId") || null,
    recurring: value(formData, "recurring") !== "false"
  };
  const { error } = id ? await supabase.from("incomes").update(payload).eq("id", id).eq("household_group_id", householdGroupId) : await supabase.from("incomes").insert(payload);
  if (error) redirect(`/incomes?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function createSaving(formData: FormData) {
  const { supabase } = await requireUser();
  const id = value(formData, "id");
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  const amount = numberValue(formData, "amount");
  if (!householdGroupId || !name || !amount) redirect("/savings?error=名称と金額を入力してください");
  const payload = { household_group_id: householdGroupId, name, amount, saving_type: "other", category_id: value(formData, "categoryId") || null, recurring: value(formData, "recurring") !== "false" };
  const { error } = id ? await supabase.from("savings").update(payload).eq("id", id).eq("household_group_id", householdGroupId) : await supabase.from("savings").insert(payload);
  if (error) redirect(`/savings?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function createFixedCost(formData: FormData) {
  const { supabase } = await requireUser();
  const id = value(formData, "id");
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  const amount = numberValue(formData, "amount");
  if (!householdGroupId || !name || !amount) redirect("/fixed-costs?error=固定費名と金額を入力してください");
  const payload = {
    household_group_id: householdGroupId,
    member_id: value(formData, "memberId") || null,
    name,
    amount,
    paid_on: numberValue(formData, "paidOn", 1),
    payer_name: value(formData, "payer"),
    category: "other",
    category_id: value(formData, "categoryId") || null,
    recurring: true,
    review_target: checked(formData, "reviewTarget"),
    review_memo: value(formData, "reviewMemo")
  };
  const { error } = id ? await supabase.from("fixed_costs").update(payload).eq("id", id).eq("household_group_id", householdGroupId) : await supabase.from("fixed_costs").insert(payload);
  if (error) redirect(`/fixed-costs?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function createLoan(formData: FormData) {
  const { supabase } = await requireUser();
  const id = value(formData, "id");
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  const monthlyPayment = numberValue(formData, "monthlyPayment");
  if (!householdGroupId || !name || !monthlyPayment) redirect("/loans?error=ローン名と毎月返済額を入力してください");
  const payload = {
    household_group_id: householdGroupId,
    name,
    monthly_payment: monthlyPayment,
    paid_on: numberValue(formData, "paidOn", 1),
    remaining_balance: numberValue(formData, "remainingBalance"),
    interest_rate: numberValue(formData, "interestRate"),
    payoff_date: value(formData, "payoffDate") || null,
    has_bonus_payment: value(formData, "hasBonusPayment") === "true",
    memo: value(formData, "memo")
  };
  const { error } = id ? await supabase.from("loans").update(payload).eq("id", id).eq("household_group_id", householdGroupId) : await supabase.from("loans").insert(payload);
  if (error) redirect(`/loans?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function saveCategory(formData: FormData) {
  const { supabase } = await requireUser();
  const id = value(formData, "id");
  const householdGroupId = value(formData, "householdGroupId");
  const payload = {
    household_group_id: householdGroupId,
    kind: value(formData, "kind") as CategoryKind,
    name: value(formData, "name"),
    icon: value(formData, "icon") || "・",
    color: value(formData, "color") || "#2f8f6b",
    monthly_budget: value(formData, "monthlyBudget") ? numberValue(formData, "monthlyBudget") : null,
    hidden: checked(formData, "hidden"),
    favorite: checked(formData, "favorite"),
    sort_order: numberValue(formData, "sortOrder", 1)
  };
  if (!payload.name || !householdGroupId) redirect("/settings?categoryError=カテゴリ名を入力してください");
  const { error } = id ? await supabase.from("categories").update(payload).eq("id", id).eq("household_group_id", householdGroupId) : await supabase.from("categories").insert(payload);
  if (error) redirect(`/settings?categoryError=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function createExpenseCategoryFromInput(formData: FormData) {
  const { supabase } = await requireUser();
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name").replace(/\s+/g, " ");

  if (!householdGroupId) return { error: "家計グループを確認できませんでした。画面を更新してください。" };
  if (!name) return { error: "カテゴリ名を入力してください。" };
  if (name.length > 20) return { error: "カテゴリ名は20文字以内で入力してください。" };

  const { data: existing, error: existingError } = await supabase
    .from("categories")
    .select("id")
    .eq("household_group_id", householdGroupId)
    .eq("kind", "expense")
    .eq("name", name)
    .maybeSingle();

  if (existingError) return { error: toJapaneseError(existingError.message) };
  if (existing) return { error: "同じ名前のカテゴリがすでにあります。" };

  const { data, error } = await supabase
    .from("categories")
    .insert({
      household_group_id: householdGroupId,
      kind: "expense",
      name,
      icon: value(formData, "icon") || "📦",
      color: value(formData, "color") || "#2f8f6b",
      monthly_budget: value(formData, "monthlyBudget") ? numberValue(formData, "monthlyBudget") : null,
      favorite: checked(formData, "favorite"),
      hidden: false,
      archived: false,
      sort_order: numberValue(formData, "sortOrder", 999)
    })
    .select("id, kind, name, color, icon, sort_order, hidden, archived, monthly_budget, favorite")
    .single();

  if (error) return { error: toJapaneseError(error.message) };
  revalidateCore();
  return {
    category: {
      id: String(data.id),
      kind: "expense" as CategoryKind,
      name: String(data.name ?? ""),
      color: String(data.color ?? "#2f8f6b"),
      icon: String(data.icon ?? "📦"),
      sortOrder: Number(data.sort_order ?? 999),
      hidden: Boolean(data.hidden),
      archived: Boolean(data.archived),
      monthlyBudget: data.monthly_budget == null ? undefined : Number(data.monthly_budget),
      favorite: Boolean(data.favorite)
    }
  };
}

export async function archiveCategory(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").update({ archived: true }).eq("id", value(formData, "id"));
  if (error) redirect(`/settings?categoryError=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function deleteExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("expenses").delete().eq("id", value(formData, "id"));
  if (error) redirect(`/expenses?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function deleteIncome(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("incomes").delete().eq("id", value(formData, "id"));
  if (error) redirect(`/incomes?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function deleteSaving(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("savings").delete().eq("id", value(formData, "id"));
  if (error) redirect(`/savings?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function deleteFixedCost(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("fixed_costs").delete().eq("id", value(formData, "id"));
  if (error) redirect(`/fixed-costs?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}

export async function deleteLoan(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("loans").delete().eq("id", value(formData, "id"));
  if (error) redirect(`/loans?error=${encodeURIComponent(toJapaneseError(error.message))}`);
  revalidateCore();
}
