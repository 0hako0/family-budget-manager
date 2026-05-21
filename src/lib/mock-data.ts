import type { BudgetData } from "./types";

export const budgetData: BudgetData = {
  members: [
    { id: "member-1", name: "夫", role: "自分", shareRatio: 0.55 },
    { id: "member-2", name: "妻", role: "パートナー", shareRatio: 0.45 }
  ],
  settings: {
    groupName: "わが家の家計",
    burdenRule: "収入比率",
    customShares: {
      "member-1": 0.6,
      "member-2": 0.4
    }
  },
  categories: [
    { id: "exp-food", kind: "expense", name: "食費", color: "#2f8f6b", icon: "🍚", sortOrder: 1, hidden: false, archived: false, monthlyBudget: 70000, favorite: true },
    { id: "exp-dining", kind: "expense", name: "外食", color: "#f0b85a", icon: "🍽", sortOrder: 2, hidden: false, archived: false, monthlyBudget: 20000, favorite: true },
    { id: "exp-daily", kind: "expense", name: "日用品", color: "#2d7dd2", icon: "🧴", sortOrder: 3, hidden: false, archived: false, monthlyBudget: 15000, favorite: true },
    { id: "exp-transport", kind: "expense", name: "交通費", color: "#7e6bd8", icon: "🚃", sortOrder: 4, hidden: false, archived: false, monthlyBudget: 18000 },
    { id: "exp-hobby", kind: "expense", name: "趣味", color: "#79a97b", icon: "🎧", sortOrder: 5, hidden: false, archived: false, monthlyBudget: 18000 },
    { id: "exp-clothing", kind: "expense", name: "服", color: "#e18a5a", icon: "👕", sortOrder: 6, hidden: false, archived: false, monthlyBudget: 15000 },
    { id: "exp-medical", kind: "expense", name: "医療", color: "#d94a45", icon: "🏥", sortOrder: 7, hidden: false, archived: false, monthlyBudget: 12000 },
    { id: "exp-social", kind: "expense", name: "交際費", color: "#5e9fa3", icon: "🎁", sortOrder: 8, hidden: false, archived: false, monthlyBudget: 12000 },
    { id: "exp-pet", kind: "expense", name: "ペット", color: "#9a7b4f", icon: "🐾", sortOrder: 9, hidden: false, archived: false, monthlyBudget: 12000 },
    { id: "exp-other", kind: "expense", name: "その他", color: "#6b7280", icon: "＋", sortOrder: 10, hidden: false, archived: false, monthlyBudget: 10000 },
    { id: "fix-rent", kind: "fixed_cost", name: "家賃", color: "#2f8f6b", icon: "🏠", sortOrder: 1, hidden: false, archived: false },
    { id: "fix-utilities", kind: "fixed_cost", name: "光熱費", color: "#f0b85a", icon: "💡", sortOrder: 2, hidden: false, archived: false },
    { id: "fix-telecom", kind: "fixed_cost", name: "通信費", color: "#2d7dd2", icon: "📱", sortOrder: 3, hidden: false, archived: false },
    { id: "fix-insurance", kind: "fixed_cost", name: "保険", color: "#79a97b", icon: "🛡", sortOrder: 4, hidden: false, archived: false },
    { id: "fix-subscription", kind: "fixed_cost", name: "サブスク", color: "#7e6bd8", icon: "▶", sortOrder: 5, hidden: false, archived: false },
    { id: "fix-car", kind: "fixed_cost", name: "車関連", color: "#e18a5a", icon: "🚗", sortOrder: 6, hidden: false, archived: false },
    { id: "fix-tax", kind: "fixed_cost", name: "税金", color: "#5e9fa3", icon: "¥", sortOrder: 7, hidden: false, archived: false },
    { id: "fix-other", kind: "fixed_cost", name: "その他", color: "#6b7280", icon: "＋", sortOrder: 8, hidden: false, archived: false },
    { id: "inc-salary", kind: "income", name: "給与", color: "#2f8f6b", icon: "💼", sortOrder: 1, hidden: false, archived: false },
    { id: "inc-side", kind: "income", name: "副収入", color: "#2d7dd2", icon: "＋", sortOrder: 2, hidden: false, archived: false },
    { id: "inc-bonus", kind: "income", name: "ボーナス", color: "#f0b85a", icon: "★", sortOrder: 3, hidden: false, archived: false },
    { id: "inc-temp", kind: "income", name: "臨時収入", color: "#79a97b", icon: "🎁", sortOrder: 4, hidden: false, archived: false },
    { id: "inc-other", kind: "income", name: "その他", color: "#6b7280", icon: "＋", sortOrder: 5, hidden: false, archived: false },
    { id: "sav-cash", kind: "saving", name: "貯金", color: "#2f8f6b", icon: "🏦", sortOrder: 1, hidden: false, archived: false },
    { id: "sav-nisa", kind: "saving", name: "NISA", color: "#2d7dd2", icon: "📈", sortOrder: 2, hidden: false, archived: false },
    { id: "sav-fund", kind: "saving", name: "投資信託", color: "#79a97b", icon: "📊", sortOrder: 3, hidden: false, archived: false },
    { id: "sav-travel", kind: "saving", name: "旅行積立", color: "#f0b85a", icon: "✈", sortOrder: 4, hidden: false, archived: false },
    { id: "sav-car", kind: "saving", name: "車費用", color: "#e18a5a", icon: "🚗", sortOrder: 5, hidden: false, archived: false },
    { id: "sav-special", kind: "saving", name: "特別費積立", color: "#7e6bd8", icon: "★", sortOrder: 6, hidden: false, archived: false },
    { id: "sav-other", kind: "saving", name: "その他", color: "#6b7280", icon: "＋", sortOrder: 7, hidden: false, archived: false }
  ],
  incomes: [
    { id: "income-1", name: "夫の給与", amount: 360000, paidOn: "2026-05-25", earner: "夫", categoryId: "inc-salary", recurring: true },
    { id: "income-2", name: "妻の給与", amount: 280000, paidOn: "2026-05-25", earner: "妻", categoryId: "inc-salary", recurring: true },
    { id: "income-3", name: "副業収入", amount: 32000, paidOn: "2026-05-12", earner: "夫", categoryId: "inc-side", recurring: false }
  ],
  savings: [
    { id: "saving-1", name: "NISA積立", amount: 70000, categoryId: "sav-nisa", recurring: true },
    { id: "saving-2", name: "旅行積立", amount: 25000, categoryId: "sav-travel", recurring: true },
    { id: "saving-3", name: "特別費積立", amount: 30000, categoryId: "sav-special", recurring: true }
  ],
  fixedCosts: [
    { id: "fixed-1", name: "家賃", amount: 128000, paidOn: 27, payer: "夫", categoryId: "fix-rent", recurring: true, reviewTarget: false },
    { id: "fixed-2", name: "電気・ガス・水道", amount: 32000, paidOn: 20, payer: "妻", categoryId: "fix-utilities", recurring: true, reviewTarget: true, reviewMemo: "季節変動を見つつ、契約アンペアを確認" },
    { id: "fixed-3", name: "スマホ・ネット", amount: 18500, paidOn: 15, payer: "夫", categoryId: "fix-telecom", recurring: true, reviewTarget: true, reviewMemo: "通信費：高いかも。格安SIM候補を比較" },
    { id: "fixed-4", name: "動画・音楽サブスク", amount: 8500, paidOn: 10, payer: "妻", categoryId: "fix-subscription", recurring: true, reviewTarget: true, reviewMemo: "サブスク：解約検討。重複サービスを整理" },
    { id: "fixed-5", name: "生命保険", amount: 21000, paidOn: 8, payer: "夫", categoryId: "fix-insurance", recurring: true, reviewTarget: true, reviewMemo: "保険：見直し候補。保障内容と掛金を確認" }
  ],
  loans: [
    {
      id: "loan-1",
      name: "車ローン",
      monthlyPayment: 42000,
      paidOn: 26,
      remainingBalance: 1340000,
      interestRate: 2.1,
      payoffDate: "2028-09-26",
      hasBonusPayment: true,
      memo: "夏冬に各80,000円のボーナス払い"
    }
  ],
  expenses: [
    { id: "expense-1", amount: 9200, date: "2026-05-02", categoryId: "exp-food", payer: "妻", target: "共有", memo: "週末まとめ買い" },
    { id: "expense-2", amount: 4800, date: "2026-05-04", categoryId: "exp-dining", payer: "夫", target: "共有", memo: "ランチ" },
    { id: "expense-3", amount: 3100, date: "2026-05-06", categoryId: "exp-daily", payer: "妻", target: "共有", memo: "洗剤など" },
    { id: "expense-4", amount: 7600, date: "2026-05-09", categoryId: "exp-food", payer: "夫", target: "共有", memo: "スーパー" },
    { id: "expense-5", amount: 12800, date: "2026-05-12", categoryId: "exp-clothing", payer: "妻", target: "自分のみ", memo: "仕事用" },
    { id: "expense-6", amount: 5400, date: "2026-05-14", categoryId: "exp-transport", payer: "夫", target: "自分のみ", memo: "ガソリン" },
    { id: "expense-7", amount: 9800, date: "2026-05-16", categoryId: "exp-pet", payer: "妻", target: "共有", memo: "フード" },
    { id: "expense-8", amount: 6200, date: "2026-05-18", categoryId: "exp-medical", payer: "夫", target: "共有", memo: "薬" },
    { id: "expense-9", amount: 11200, date: "2026-05-20", categoryId: "exp-dining", payer: "夫", target: "共有", memo: "家族外食" },
    { id: "expense-10", amount: 35100, date: "2026-05-21", categoryId: "exp-food", payer: "妻", target: "共有", memo: "食材・米" }
  ],
  monthlySummaries: [
    {
      id: "summary-2026-04",
      month: "2026-04",
      incomeTotal: 640000,
      fixedCostTotal: 205000,
      loanTotal: 42000,
      variableExpenseTotal: 132000,
      savingTotal: 120000,
      remainingBudget: 141000,
      landingResult: 141000,
      categoryExpenses: { "exp-food": 63500, "exp-dining": 16500, "exp-daily": 14200, "exp-transport": 11800, "exp-hobby": 12000, "exp-pet": 14000 },
      memo: "外食を抑えられて良い月。通信費は見直し候補。"
    , closedAt: "2026-04-30T23:00:00+09:00" },
    {
      id: "summary-2026-03",
      month: "2026-03",
      incomeTotal: 672000,
      fixedCostTotal: 207000,
      loanTotal: 42000,
      variableExpenseTotal: 151000,
      savingTotal: 125000,
      remainingBudget: 147000,
      landingResult: 147000,
      categoryExpenses: { "exp-food": 69000, "exp-dining": 22000, "exp-daily": 16500, "exp-transport": 14200, "exp-hobby": 16000, "exp-medical": 13300 },
      memo: "医療費が多め。保険の保障範囲も確認する。"
    , closedAt: "2026-03-31T23:00:00+09:00" },
    {
      id: "summary-2026-02",
      month: "2026-02",
      incomeTotal: 640000,
      fixedCostTotal: 202000,
      loanTotal: 42000,
      variableExpenseTotal: 146000,
      savingTotal: 120000,
      remainingBudget: 130000,
      landingResult: 130000,
      categoryExpenses: { "exp-food": 66000, "exp-dining": 24800, "exp-daily": 13200, "exp-transport": 12000, "exp-clothing": 18500, "exp-social": 11500 },
      memo: "服と外食が増えた月。"
    , closedAt: "2026-02-28T23:00:00+09:00" },
    {
      id: "summary-2025-11",
      month: "2025-11",
      incomeTotal: 640000,
      fixedCostTotal: 198000,
      loanTotal: 42000,
      variableExpenseTotal: 139000,
      savingTotal: 115000,
      remainingBudget: 146000,
      landingResult: 146000,
      categoryExpenses: { "exp-food": 61000, "exp-dining": 18000, "exp-daily": 15000, "exp-transport": 13000, "exp-hobby": 15000, "exp-pet": 17000 },
      memo: "サブスクを一部整理。"
    , closedAt: "2025-11-30T23:00:00+09:00" },
    {
      id: "summary-2025-05",
      month: "2025-05",
      incomeTotal: 610000,
      fixedCostTotal: 196000,
      loanTotal: 42000,
      variableExpenseTotal: 158000,
      savingTotal: 105000,
      remainingBudget: 109000,
      landingResult: 109000,
      categoryExpenses: { "exp-food": 74000, "exp-dining": 26000, "exp-daily": 16000, "exp-transport": 15000, "exp-social": 12000, "exp-pet": 15000 },
      memo: "前年同月。食費が高め。"
    , closedAt: "2025-05-31T23:00:00+09:00" }
  ],
  notificationRules: [
    { id: "notice-1", type: "category_80", enabled: true, threshold: 0.8 },
    { id: "notice-2", type: "category_over", enabled: true, threshold: 1 },
    { id: "notice-3", type: "monthly_pace_over", enabled: true },
    { id: "notice-4", type: "fixed_cost_review", enabled: true }
  ]
};
