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
const realtime = read("src/components/RealtimeRefresh.tsx");
const home = read("src/app/(mobile)/page.tsx");
const settings = read("src/app/(mobile)/settings/page.tsx");

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
check("Realtimeはhousehold単位で購読", realtime.includes("household_group_id=eq.") && realtime.includes("shared_wallet_transactions") && realtime.includes("saving_goals"));
check("Realtimeはdebounce更新", realtime.includes("setTimeout") && realtime.includes("700"));
check("手動更新ボタン", includes("src/components/ManualRefreshButton.tsx", "↻ 更新"));
check("Pull To Refresh", includes("src/components/PullToRefresh.tsx", "離して更新"));
check("最終更新時刻", home.includes("LastUpdated"));
check("支出入力の前回値記憶", expenseEntry.includes("family-budget:expense-quick-entry"));
check("OCR画像圧縮", includes("src/lib/receipt-image.ts", "image/jpeg") && includes("src/lib/receipt-image.ts", "1280"));
check("レシート保存期間設定", settings.includes("receiptRetentionPolicy") && schema.includes("receipt_retention_policy"));
check("改善要望メモ", settings.includes("improvementNotes") && schema.includes("improvement_notes"));
check("Realtime publication SQL", includes("supabase/migrations/014_realtime_publication.sql", "supabase_realtime"));
check("共通クレカ固定選択肢を出さない", !expenseEntry.includes('<option value="shared_credit_card:">共通クレジットカード</option>'));
check("ホームから詳細画面へ導線", home.includes('href="/payments"') && home.includes('href="/goals"') && home.includes('href="/schedule"'));
check("支払い詳細画面", includes("src/app/(mobile)/payments/page.tsx", "クレカ請求管理"));
check("貯金目標詳細画面", includes("src/app/(mobile)/goals/page.tsx", "貯金目標"));
check("支払予定詳細画面", includes("src/app/(mobile)/schedule/page.tsx", "サブスク候補"));
check("共通支払者は個人IDを保存しない", actions.includes("isCommonPayer") && actions.includes('paid_by_user_id: isCommonPayer || isSharedWallet ? null'));
check("共有支出の負担割合を正規化", budget.includes("normalizeShares") && budget.includes("expense.target !== \"shared\""));
check("共通支払者表示の共通関数", budget.includes("getExpensePayerLabel") && expenseEntry.includes("getExpensePayerLabel"));
check("設定の詳細管理リンクを削除", !settings.includes("詳細管理") && !settings.includes('href="/incomes"') && !settings.includes('href="/savings"') && !settings.includes('href="/loans"'));
check("貯金目標金額欄はスマホ縦並び", settings.includes("grid gap-3 sm:grid-cols-2") && settings.includes("目標金額") && settings.includes("現在額"));

const failed = checks.filter((item) => !item.passed);

for (const item of checks) {
  console.log(`${item.passed ? "✓" : "✗"} ${item.name}${item.detail ? `: ${item.detail}` : ""}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} quality checks failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} quality checks passed.`);
