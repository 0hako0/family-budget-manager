"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createExpense, deleteExpense } from "@/app/actions";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { calculateSharedBurden, getCategoriesByKind, getCategory } from "@/lib/budget";
import { yen } from "@/lib/format";
import type { BudgetData, Expense, ExpenseTarget } from "@/lib/types";
import { ListSection, Table, Td } from "./ListSection";
import { MetricCard } from "./MetricCard";
import { MobileCard, MobileCards } from "./MobileCards";

const targetLabels: Record<ExpenseTarget, string> = {
  shared: "共有",
  self_only: "自分のみ",
  partner_only: "パートナーのみ"
};

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function DeleteExpenseButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="min-h-11 rounded-xl bg-red-50 px-4 text-sm font-bold text-warn transition active:scale-[0.98] disabled:opacity-50"
      type="submit"
      disabled={pending}
    >
      {pending ? "削除中..." : "削除"}
    </button>
  );
}

function ExpenseDeleteForm({ id }: { id: string }) {
  return (
    <form
      action={deleteExpense}
      onSubmit={(event) => {
        if (!window.confirm("この支出を削除しますか？")) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteExpenseButton />
    </form>
  );
}

function ExpenseEditForm({
  data,
  expense,
  categories,
  onCancel
}: {
  data: BudgetData;
  expense: Expense;
  categories: ReturnType<typeof getCategoriesByKind>;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(String(expense.amount));
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [date, setDate] = useState(expense.date || todayValue());
  const [payer, setPayer] = useState(expense.payer);
  const [target, setTarget] = useState<ExpenseTarget>(expense.target);
  const [memo, setMemo] = useState(expense.memo);
  const [error, setError] = useState("");

  return (
    <form
      action={async (formData) => {
        await createExpense(formData);
        onCancel();
      }}
      onSubmit={(event) => {
        if (!categoryId) {
          event.preventDefault();
          setError("カテゴリを選択してください");
          return;
        }
        if (!amount || Number(amount) <= 0) {
          event.preventDefault();
          setError("金額を入力してください");
        }
      }}
      className="mt-3 grid gap-3 rounded-2xl bg-white p-3"
    >
      <input type="hidden" name="id" value={expense.id} />
      <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
      <input type="hidden" name="memberId" value={data.currentMemberId ?? ""} />
      <label className="grid gap-1 text-sm font-bold text-ink/65">
        金額
        <input className="min-h-12 rounded-2xl border border-emerald-900/10 bg-cream/60 px-4 py-3 text-base text-ink outline-none focus:border-leaf" name="amount" type="number" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm font-bold text-ink/65">
        カテゴリ
        <select className="min-h-12 rounded-2xl border border-emerald-900/10 bg-cream/60 px-4 py-3 text-base text-ink outline-none focus:border-leaf" name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">選択してください</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold text-ink/65">
        日付
        <input className="min-h-12 rounded-2xl border border-emerald-900/10 bg-cream/60 px-4 py-3 text-base text-ink outline-none focus:border-leaf" name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm font-bold text-ink/65">
        支払者
        <select className="min-h-12 rounded-2xl border border-emerald-900/10 bg-cream/60 px-4 py-3 text-base text-ink outline-none focus:border-leaf" name="payer" value={payer} onChange={(event) => setPayer(event.target.value)}>
          <option value="">未選択</option>
          {data.members.map((member) => (
            <option key={member.id}>{member.name}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold text-ink/65">
        対象
        <select className="min-h-12 rounded-2xl border border-emerald-900/10 bg-cream/60 px-4 py-3 text-base text-ink outline-none focus:border-leaf" name="target" value={target} onChange={(event) => setTarget(event.target.value as ExpenseTarget)}>
          {Object.entries(targetLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <input className="min-h-12 rounded-2xl border border-emerald-900/10 bg-cream/60 px-4 py-3 text-base text-ink outline-none focus:border-leaf" name="memo" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="メモ" />
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-warn">{error}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <button className="min-h-12 rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 text-base font-black text-ink transition active:scale-[0.98]" type="button" onClick={onCancel}>
          キャンセル
        </button>
        <FormSubmitButton idleLabel="保存する" pendingLabel="保存中..." />
      </div>
    </form>
  );
}

export function ExpenseQuickEntry({ data, errorMessage }: { data: BudgetData; errorMessage?: string }) {
  const categories = useMemo(() => getCategoriesByKind(data, "expense"), [data]);
  const favoriteCategories = useMemo(() => categories.filter((category) => category.favorite).slice(0, 6), [categories]);
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [date, setDate] = useState(todayValue());
  const [payer, setPayer] = useState(data.members[0]?.name ?? "");
  const [target, setTarget] = useState<ExpenseTarget>("shared");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const recentExpenses = useMemo(() => data.expenses.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3), [data.expenses]);
  const total = useMemo(() => data.expenses.reduce((sum, expense) => sum + expense.amount, 0), [data.expenses]);
  const displayError = error || errorMessage;

  function validateForm() {
    if (!categoryId) {
      setError("カテゴリを選択してください");
      return false;
    }
    if (!amount || Number(amount) <= 0) {
      setError("金額を入力してください");
      return false;
    }
    setError("");
    return true;
  }

  return (
    <div className="grid gap-5">
      <form
        id="expense-entry-form"
        action={async (formData) => {
          await createExpense(formData);
          setAmount("");
          setMemo("");
        }}
        onSubmit={(event) => {
          if (!validateForm()) event.preventDefault();
        }}
        className="rounded-[18px] border border-leaf/15 bg-white p-5 shadow-soft"
      >
        <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
        <input type="hidden" name="memberId" value={data.currentMemberId ?? ""} />
        <p className="text-sm font-bold text-leaf">支出入力</p>
        <label className="mt-3 grid gap-2">
          <span className="text-sm font-bold text-ink/65">金額</span>
          <input
            className="min-h-16 w-full rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-4xl font-black text-ink outline-none transition focus:border-leaf focus:bg-white focus:ring-2 focus:ring-leaf/15"
            name="amount"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            aria-label="金額"
          />
        </label>

        <div className="mt-5">
          <p className="text-sm font-bold text-ink/65">よく使うカテゴリ</p>
          {favoriteCategories.length === 0 ? (
            <p className="mt-2 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">よく使うカテゴリはまだありません</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {favoriteCategories.map((category) => {
                const selected = category.id === categoryId;
                return (
                  <button
                    key={category.id}
                    className={
                      selected
                        ? "min-h-16 rounded-2xl border-2 border-leaf bg-emerald-50 px-2 py-2 text-center text-xs font-black text-leaf transition active:scale-[0.98]"
                        : "min-h-16 rounded-2xl border border-emerald-900/10 bg-cream/60 px-2 py-2 text-center text-xs font-bold text-ink transition active:scale-[0.98]"
                    }
                    type="button"
                    onClick={() => {
                      setCategoryId(category.id);
                      setError("");
                    }}
                  >
                    <span className="block text-2xl">{category.icon}</span>
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <label className="mt-4 grid gap-1 text-sm font-bold text-ink/65">
          カテゴリ
          <select
            className="min-h-12 rounded-2xl border border-emerald-900/10 bg-cream/60 px-4 py-3 text-base text-ink outline-none transition focus:border-leaf"
            name="categoryId"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setError("");
            }}
          >
            <option value="">選択してください</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </label>

        <details className="mt-3 rounded-2xl bg-cream/55 p-3">
          <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-bold text-ink">日付・支払者・メモ</summary>
          <div className="grid gap-3 pt-2">
            <label className="grid gap-1 text-sm font-bold text-ink/65">
              日付
              <input className="min-h-12 rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-leaf" name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-bold text-ink/65">
              支払者
              <select className="min-h-12 rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-leaf" name="payer" value={payer} onChange={(event) => setPayer(event.target.value)}>
                <option value="">未選択</option>
                {data.members.map((member) => (
                  <option key={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-bold text-ink/65">
              対象
              <select className="min-h-12 rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-leaf" name="target" value={target} onChange={(event) => setTarget(event.target.value as ExpenseTarget)}>
                {Object.entries(targetLabels).map(([targetValue, label]) => (
                  <option key={targetValue} value={targetValue}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <input className="min-h-12 rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-leaf" name="memo" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="メモ" />
          </div>
        </details>

        {displayError ? <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-warn">{displayError}</p> : null}
        {categories.length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 px-4 py-3 text-sm font-bold text-ink/60">支出カテゴリがまだありません。設定でカテゴリを追加してください。</p> : null}
        <div className="mt-5 hidden sm:block">
          <FormSubmitButton className="min-h-14 w-full rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-soft transition active:scale-[0.98] disabled:bg-ink/20" />
        </div>
        <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 mx-auto max-w-md px-4 sm:hidden">
          <FormSubmitButton className="min-h-14 w-full rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-soft transition active:scale-[0.98] disabled:bg-ink/20" />
        </div>
      </form>

      <MetricCard label="今月の変動費" value={yen(total)} tone="accent" />

      <ListSection title="直近の支出">
        {recentExpenses.length === 0 ? (
          <div className="rounded-2xl bg-cream/60 p-4 text-sm font-bold text-ink/60">
            <p>まだ支出がありません</p>
            <p className="mt-1">まずは支出を入力してみましょう</p>
          </div>
        ) : null}
        <MobileCards>
          {recentExpenses.map((expense) => {
            const burden = calculateSharedBurden(expense, data);
            const category = getCategory(data, expense.categoryId);
            const isEditing = editingExpenseId === expense.id;
            return (
              <MobileCard key={expense.id} title={`${category?.icon ?? ""} ${category?.name ?? "未分類"}`} amount={yen(expense.amount)}>
                <button className="grid gap-1 text-left transition active:scale-[0.99]" type="button" onClick={() => setEditingExpenseId(isEditing ? null : expense.id)}>
                  <span>{expense.date} / {expense.payer || "支払者未設定"} / {targetLabels[expense.target]}</span>
                  {expense.memo ? <span>{expense.memo}</span> : null}
                  {data.members.map((member) => (
                    <span key={member.id}>{member.name}: {yen(burden[member.id] ?? 0)}</span>
                  ))}
                </button>
                {isEditing ? (
                  <ExpenseEditForm data={data} expense={expense} categories={categories} onCancel={() => setEditingExpenseId(null)} />
                ) : (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button className="min-h-11 rounded-xl border border-emerald-900/10 bg-white px-4 text-sm font-bold text-leaf transition active:scale-[0.98]" type="button" onClick={() => setEditingExpenseId(expense.id)}>
                      編集
                    </button>
                    <ExpenseDeleteForm id={expense.id} />
                  </div>
                )}
              </MobileCard>
            );
          })}
        </MobileCards>
        <Table headers={["日付", "カテゴリ", "金額", "支払者", "対象", "メモ"]}>
          {recentExpenses.map((expense) => {
            const category = getCategory(data, expense.categoryId);
            return (
              <tr key={expense.id}>
                <Td>{expense.date}</Td>
                <Td>{category?.name ?? "未分類"}</Td>
                <Td>{yen(expense.amount)}</Td>
                <Td>{expense.payer}</Td>
                <Td>{targetLabels[expense.target]}</Td>
                <Td>{expense.memo}</Td>
              </tr>
            );
          })}
        </Table>
      </ListSection>
    </div>
  );
}
