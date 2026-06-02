import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const checks = [];

function check(name, condition, detail = "") {
  checks.push({ name, passed: Boolean(condition), detail });
}

function includes(file, text) {
  return read(file).includes(text);
}

function matches(file, pattern) {
  return pattern.test(read(file));
}

const actions = read("src/app/actions.ts");
const schema = read("supabase/schema.sql");
const budget = read("src/lib/budget.ts");
const expenseEntry = read("src/components/ExpenseQuickEntry.tsx");
const fixedTabs = read("src/components/FixedItemsTabs.tsx");
const exportTools = read("src/components/DataExportTools.tsx");
const setupPage = read("src/app/setup/page.tsx");
const formButton = read("src/components/FormSubmitButton.tsx");

[
  ["新規登録", "signUp"],
  ["家計グループ作成", "setupHousehold"],
  ["招待コード参加", "joinInvitation"],
  ["支出登録", "createExpense"],
  ["収入登録", "createIncome"],
  ["固定費登録", "createFixedCost"],
  ["ローン登録", "createLoan"],
  ["貯金目標登録", "saveSavingGoal"]
].forEach(([label, fn]) => check(`${label} action`, actions.includes(`function ${fn}`) || actions.includes(`async function ${fn}`)));

check("招待コードRPCを使用", actions.includes("join_household_by_invite_code") && schema.includes("join_household_by_invite_code"));
check("家計作成RPCを使用", actions.includes("create_household_group") && schema.includes("create_household_group"));
check("同じ家計グループのみ扱うRLS", schema.includes("is_household_member") && schema.includes("household_group_id"));
check("家計メンバー重複防止", schema.includes("unique (household_group_id, user_id)") || schema.includes("household_members_group_user_unique"));

check("共通クレカ支払いを保存", actions.includes("payment_method_type") && actions.includes("shared_credit_card"));
check("共通財布支払いを保存", actions.includes("shared_wallet") && actions.includes("paid_by_type"));
check("共通クレカ請求計算", budget.includes("getCreditCardBillingSummaries"));
check("今後の支払予定計算", budget.includes("getUpcomingPayments"));
check("サブスク候補検出", budget.includes("getSubscriptionCandidates"));

check("CSVエクスポート", exportTools.includes("downloadCsv") && exportTools.includes("text/csv"));
check("JSONバックアップ", exportTools.includes("downloadJson") && exportTools.includes("family-budget-backup"));

check("保存中表示の共通ボタン", formButton.includes("useFormStatus") && formButton.includes("aria-busy") && formButton.includes("disabled || pending"));
check("ログイン・セットアップの二重送信防止", includes("src/app/login/page.tsx", "FormSubmitButton") && setupPage.includes("FormSubmitButton"));
check("支出フォームの二重送信防止", expenseEntry.includes("FormSubmitButton") && expenseEntry.includes("pendingLabel"));
check("固定項目フォームの二重送信防止", fixedTabs.includes("FormSubmitButton") && fixedTabs.includes("pendingLabel"));

check("DBエラーを日本語化", actions.includes("toJapaneseError") && !actions.includes("encodeURIComponent(error.message)"));
check("英語Authエラーの日本語化", includes("src/lib/error-messages.ts", "Email not confirmed") || includes("src/lib/error-messages.ts", "確認待ち状態"));
check("空データの次アクション表示", fixedTabs.includes("登録フォームを開いて") && includes("src/components/CategoryBudgetList.tsx", "月予算を追加"));

check("支出カテゴリ未選択を防止", expenseEntry.includes("カテゴリを選択してください") && expenseEntry.includes("event.preventDefault()"));
check("金額入力は数字キーボード", expenseEntry.includes('inputMode="numeric"') || expenseEntry.includes("inputMode=\"numeric\""));
check("iPhone向け固定ボタン", expenseEntry.includes("safe-area-inset-bottom") || expenseEntry.includes("bottom-[calc(72px+env(safe-area-inset-bottom))]"));

const failed = checks.filter((item) => !item.passed);

for (const item of checks) {
  console.log(`${item.passed ? "✓" : "✗"} ${item.name}${item.detail ? `: ${item.detail}` : ""}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} quality checks failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} quality checks passed.`);
