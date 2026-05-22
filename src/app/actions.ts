"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CategoryKind } from "@/lib/types";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const parsed = Number(value(formData, key));
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function requireUser() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!session || !user) redirect("/login?error=ログイン状態を確認できませんでした。もう一度ログインしてください");
  return { supabase, user };
}

export async function signIn(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: value(formData, "email"),
    password: value(formData, "password")
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const email = value(formData, "email");
  const displayName = value(formData, "displayName") || email;
  const { error } = await supabase.auth.signUp({
    email,
    password: value(formData, "password"),
    options: { data: { display_name: displayName } }
  });

  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  redirect("/setup");
}

export async function signOut() {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function setupHousehold(formData: FormData) {
  const { supabase, user } = await requireUser();
  const groupName = value(formData, "groupName") || "わが家の家計";
  const displayName = value(formData, "displayName") || user.email || "自分";
  const burdenRule = value(formData, "burdenRule") || "fifty_fifty";
  const shareRatio = Math.min(1, Math.max(0, numberValue(formData, "shareRatio", 50) / 100));

  const { error } = await supabase.rpc("create_household_group", {
    group_name: groupName,
    display_name: displayName,
    burden_rule_value: burdenRule,
    share_ratio_value: shareRatio
  });

  if (error) redirect(`/setup?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function createInvitation(formData: FormData) {
  const { supabase } = await requireUser();
  const groupId = value(formData, "householdGroupId");
  const { data, error } = await supabase
    .from("household_groups")
    .select("invite_code")
    .eq("id", groupId)
    .maybeSingle();

  if (error) redirect(`/settings?inviteError=${encodeURIComponent(error.message)}`);
  const code = String(data?.invite_code ?? "");
  revalidatePath("/settings");
  redirect(`/settings?invite=${code}`);
}

export async function joinInvitation(formData: FormData) {
  const { supabase, user } = await requireUser();
  const code = value(formData, "code").toUpperCase();
  const displayName = value(formData, "displayName") || user.email || "パートナー";
  const shareRatio = Math.min(1, Math.max(0, numberValue(formData, "shareRatio", 50) / 100));

  const { error } = await supabase.rpc("join_household_by_invite_code", {
    code,
    display_name: displayName,
    share_ratio_value: shareRatio
  });

  if (error) redirect(`/join?error=${encodeURIComponent(error.message)}`);
  redirect("/");
}

export async function createExpense(formData: FormData) {
  const { supabase } = await requireUser();
  const amount = numberValue(formData, "amount");
  const householdGroupId = value(formData, "householdGroupId");
  const categoryId = value(formData, "categoryId");

  if (!amount || !categoryId || !householdGroupId) {
    redirect("/expenses?error=支出の金額とカテゴリを入力してください");
  }

  const { error } = await supabase.from("expenses").insert({
    household_group_id: householdGroupId,
    member_id: value(formData, "memberId") || null,
    amount,
    spent_on: value(formData, "date") || new Date().toISOString().slice(0, 10),
    category_id: categoryId,
    payer_name: value(formData, "payer"),
    target: value(formData, "target") || "shared",
    memo: value(formData, "memo")
  });

  if (error) redirect(`/expenses?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/");
  revalidatePath("/expenses");
}

export async function createIncome(formData: FormData) {
  const { supabase } = await requireUser();
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  const amount = numberValue(formData, "amount");

  if (!householdGroupId || !name || !amount) redirect("/incomes?error=収入名と金額を入力してください");

  const { error } = await supabase.from("incomes").insert({
    household_group_id: householdGroupId,
    member_id: value(formData, "memberId") || null,
    name,
    amount,
    paid_on: value(formData, "paidOn") || new Date().toISOString().slice(0, 10),
    earner_name: value(formData, "earner"),
    category_id: value(formData, "categoryId") || null,
    recurring: value(formData, "recurring") !== "false"
  });

  if (error) redirect(`/incomes?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/");
  revalidatePath("/incomes");
}

export async function createSaving(formData: FormData) {
  const { supabase } = await requireUser();
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  const amount = numberValue(formData, "amount");

  if (!householdGroupId || !name || !amount) redirect("/savings?error=名称と金額を入力してください");

  const { error } = await supabase.from("savings").insert({
    household_group_id: householdGroupId,
    name,
    amount,
    category_id: value(formData, "categoryId") || null,
    recurring: value(formData, "recurring") !== "false"
  });

  if (error) redirect(`/savings?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/");
  revalidatePath("/savings");
}

export async function createFixedCost(formData: FormData) {
  const { supabase } = await requireUser();
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  const amount = numberValue(formData, "amount");

  if (!householdGroupId || !name || !amount) redirect("/fixed-costs?error=固定費名と金額を入力してください");

  const { error } = await supabase.from("fixed_costs").insert({
    household_group_id: householdGroupId,
    member_id: value(formData, "memberId") || null,
    name,
    amount,
    paid_on: numberValue(formData, "paidOn", 1),
    payer_name: value(formData, "payer"),
    category_id: value(formData, "categoryId") || null,
    recurring: true,
    review_target: value(formData, "reviewTarget") === "on",
    review_memo: value(formData, "reviewMemo")
  });

  if (error) redirect(`/fixed-costs?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/");
  revalidatePath("/fixed-costs");
}

export async function createLoan(formData: FormData) {
  const { supabase } = await requireUser();
  const householdGroupId = value(formData, "householdGroupId");
  const name = value(formData, "name");
  const monthlyPayment = numberValue(formData, "monthlyPayment");

  if (!householdGroupId || !name || !monthlyPayment) redirect("/loans?error=ローン名と毎月返済額を入力してください");

  const { error } = await supabase.from("loans").insert({
    household_group_id: householdGroupId,
    name,
    monthly_payment: monthlyPayment,
    paid_on: numberValue(formData, "paidOn", 1),
    remaining_balance: numberValue(formData, "remainingBalance"),
    interest_rate: numberValue(formData, "interestRate"),
    payoff_date: value(formData, "payoffDate") || null,
    has_bonus_payment: value(formData, "hasBonusPayment") === "true",
    memo: value(formData, "memo")
  });

  if (error) redirect(`/loans?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/");
  revalidatePath("/loans");
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
    hidden: value(formData, "hidden") === "on",
    favorite: value(formData, "favorite") === "on",
    sort_order: numberValue(formData, "sortOrder", 1)
  };

  if (!payload.name || !householdGroupId) redirect("/settings?categoryError=カテゴリ名を入力してください");

  const { error } = id
    ? await supabase.from("categories").update(payload).eq("id", id).eq("household_group_id", householdGroupId)
    : await supabase.from("categories").insert(payload);

  if (error) redirect(`/settings?categoryError=${encodeURIComponent(error.message)}`);
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function archiveCategory(formData: FormData) {
  const { supabase } = await requireUser();
  await supabase.from("categories").update({ archived: true }).eq("id", value(formData, "id"));
  revalidatePath("/");
  revalidatePath("/settings");
}
