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
  const groupId = crypto.randomUUID();
  const groupName = value(formData, "groupName") || "わが家の家計";
  const displayName = value(formData, "displayName") || user.email || "自分";
  const burdenRule = value(formData, "burdenRule") || "fifty_fifty";
  const shareRatio = Math.min(1, Math.max(0, numberValue(formData, "shareRatio", 50) / 100));

  const { error: profileError } = await supabase
    .from("users")
    .upsert({ id: user.id, email: user.email ?? "", display_name: displayName });
  if (profileError) redirect(`/setup?error=${encodeURIComponent(profileError.message)}`);

  const { error: groupError } = await supabase
    .from("household_groups")
    .insert({ id: groupId, name: groupName, burden_rule: burdenRule, created_by: user.id });

  if (groupError) redirect(`/setup?error=${encodeURIComponent(groupError.message)}`);

  const { error: memberError } = await supabase.from("household_members").insert({
    household_group_id: groupId,
    user_id: user.id,
    display_name: displayName,
    role: "owner",
    custom_share_ratio: shareRatio
  });

  if (memberError) redirect(`/setup?error=${encodeURIComponent(memberError.message)}`);
  redirect("/");
}

export async function createInvitation(formData: FormData) {
  const { supabase, user } = await requireUser();
  const groupId = value(formData, "householdGroupId");
  const code = crypto.randomUUID().slice(0, 8).toUpperCase();

  const { error } = await supabase.from("household_invitations").insert({
    household_group_id: groupId,
    code,
    invited_email: value(formData, "email") || null,
    created_by: user.id,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
  });

  if (error) redirect(`/settings?inviteError=${encodeURIComponent(error.message)}`);
  revalidatePath("/settings");
  redirect(`/settings?invite=${code}`);
}

export async function joinInvitation(formData: FormData) {
  const { supabase, user } = await requireUser();
  const code = value(formData, "code").toUpperCase();
  const displayName = value(formData, "displayName") || user.email || "パートナー";
  const shareRatio = Math.min(1, Math.max(0, numberValue(formData, "shareRatio", 50) / 100));

  const { data: invitation, error: invitationError } = await supabase
    .from("household_invitations")
    .select("*")
    .eq("code", code)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (invitationError || !invitation) redirect(`/join?error=${encodeURIComponent("招待コードが無効、または期限切れです")}`);

  await supabase.from("users").upsert({ id: user.id, email: user.email ?? "", display_name: displayName });

  const { error: memberError } = await supabase.from("household_members").insert({
    household_group_id: invitation.household_group_id,
    user_id: user.id,
    display_name: displayName,
    role: "member",
    custom_share_ratio: shareRatio
  });

  if (memberError) redirect(`/join?error=${encodeURIComponent(memberError.message)}`);
  await supabase.from("household_invitations").update({ used_at: new Date().toISOString() }).eq("id", invitation.id);
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
