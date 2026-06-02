"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createExpense, deleteExpense } from "@/app/actions";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { calculateSharedBurden, getCategoriesByKind, getCategory, getExpensePaymentMethodType, getMonthScopedData, getPaymentMethodLabel } from "@/lib/budget";
import { getTodayJSTDateString } from "@/lib/date";
import { yen } from "@/lib/format";
import { compressReceiptImage } from "@/lib/receipt-image";
import type { BudgetData, Expense, ExpenseTarget, PaymentMethodType } from "@/lib/types";
import { ListSection, Table, Td } from "./ListSection";
import { MetricCard } from "./MetricCard";
import { MobileCard, MobileCards } from "./MobileCards";

const targetLabels: Record<ExpenseTarget, string> = {
  shared: "共有",
  self_only: "自分のみ",
  partner_only: "パートナーのみ"
};
const quickEntryStorageKey = "family-budget:expense-quick-entry";

function DeleteExpenseButton() {
  const { pending } = useFormStatus();
  return (
    <button className="min-h-11 rounded-xl bg-red-50 px-4 text-sm font-bold text-warn transition active:scale-[0.98] disabled:opacity-50" type="submit" disabled={pending}>
      {pending ? "削除中..." : "削除"}
    </button>
  );
}

function ExpenseDeleteForm({ id }: { id: string }) {
  return (
    <form action={deleteExpense} onSubmit={(event) => { if (!window.confirm("この支出を削除しますか？")) event.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <DeleteExpenseButton />
    </form>
  );
}

function ExpenseEditForm({ data, expense, categories, onCancel }: { data: BudgetData; expense: Expense; categories: ReturnType<typeof getCategoriesByKind>; onCancel: () => void }) {
  const initialPaymentType = getExpensePaymentMethodType(expense);
  const [categoryId, setCategoryId] = useState(expense.categoryId);
  const [payer, setPayer] = useState(expense.payer);
  const [paymentMethodValue, setPaymentMethodValue] = useState(`${initialPaymentType}:${expense.paymentMethodId ?? ""}`);
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
        }
      }}
      className="mt-3 grid gap-3 rounded-2xl bg-white p-3"
    >
      <input type="hidden" name="id" value={expense.id} />
      <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
      <input type="hidden" name="memberId" value={data.currentMemberId ?? ""} />
      <Field label="金額"><input name="amount" type="number" inputMode="numeric" defaultValue={expense.amount} className="mobile-input" /></Field>
      <Field label="カテゴリ">
        <select name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mobile-input">
          <option value="">選択してください</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
        </select>
      </Field>
      <Field label="日付"><input name="date" type="date" defaultValue={expense.date || getTodayJSTDateString()} className="mobile-input" /></Field>
      <Field label="支払者"><PayerSelect data={data} value={payer} onChange={setPayer} /></Field>
      <PaymentMethodFields data={data} value={paymentMethodValue} onChange={setPaymentMethodValue} />
      <Field label="対象">
        <select name="target" defaultValue={expense.target} className="mobile-input">
          {Object.entries(targetLabels).map(([targetValue, label]) => <option key={targetValue} value={targetValue}>{label}</option>)}
        </select>
      </Field>
      <Field label="お店・場所"><input name="location" defaultValue={expense.location ?? ""} className="mobile-input" placeholder="スーパー、Amazon など" /></Field>
      <Field label="メモ"><input name="memo" defaultValue={expense.memo} className="mobile-input" placeholder="週末まとめ買い など" /></Field>
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
  const [date, setDate] = useState(getTodayJSTDateString());
  const [payer, setPayer] = useState(data.members[0]?.name ?? "共通");
  const [paymentMethodValue, setPaymentMethodValue] = useState("personal:");
  const [target, setTarget] = useState<ExpenseTarget>("shared");
  const [location, setLocation] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [ocrMessage, setOcrMessage] = useState("");
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [compressedReceiptSize, setCompressedReceiptSize] = useState<number | null>(null);

  const currentMonthExpenses = useMemo(() => getMonthScopedData(data).expenses, [data]);
  const recentExpenses = useMemo(() => currentMonthExpenses.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3), [currentMonthExpenses]);
  const total = useMemo(() => currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0), [currentMonthExpenses]);
  const displayError = error || errorMessage;

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(quickEntryStorageKey) ?? "{}") as Partial<{
        categoryId: string;
        payer: string;
        paymentMethodValue: string;
        target: ExpenseTarget;
      }>;
      if (saved.categoryId && categories.some((category) => category.id === saved.categoryId)) setCategoryId(saved.categoryId);
      if (saved.payer) setPayer(saved.payer);
      if (saved.paymentMethodValue) setPaymentMethodValue(saved.paymentMethodValue);
      if (saved.target) setTarget(saved.target);
    } catch {
      window.localStorage.removeItem(quickEntryStorageKey);
    }
  }, [categories]);

  function rememberQuickEntryDefaults() {
    window.localStorage.setItem(
      quickEntryStorageKey,
      JSON.stringify({
        categoryId,
        payer,
        paymentMethodValue,
        target
      })
    );
  }

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
          rememberQuickEntryDefaults();
          await createExpense(formData);
          setAmount("");
          setLocation("");
          setMemo("");
          setReceiptPreview("");
          setOcrMessage("");
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
                    className={selected ? "min-h-16 rounded-2xl border-2 border-leaf bg-emerald-50 px-2 py-2 text-center text-xs font-black text-leaf transition active:scale-[0.98]" : "min-h-16 rounded-2xl border border-emerald-900/10 bg-cream/60 px-2 py-2 text-center text-xs font-bold text-ink transition active:scale-[0.98]"}
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

        <Field label="カテゴリ" className="mt-4">
          <select className="mobile-input" name="categoryId" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">選択してください</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
          </select>
        </Field>

        <details className="mt-3 rounded-2xl bg-cream/55 p-3">
          <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-bold text-ink">日付・支払者・支払い方法・メモ</summary>
          <div className="grid gap-3 pt-2">
            <Field label="日付"><input className="mobile-input" name="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
            <Field label="支払者"><PayerSelect data={data} value={payer} onChange={setPayer} /></Field>
            <PaymentMethodFields data={data} value={paymentMethodValue} onChange={setPaymentMethodValue} />
            <Field label="対象">
              <select className="mobile-input" name="target" value={target} onChange={(event) => setTarget(event.target.value as ExpenseTarget)}>
                {Object.entries(targetLabels).map(([targetValue, label]) => <option key={targetValue} value={targetValue}>{label}</option>)}
              </select>
            </Field>
            <Field label="お店・場所"><input className="mobile-input" name="location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="イオン、Amazon など" /></Field>
            <Field label="メモ"><input className="mobile-input" name="memo" value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="週末まとめ買い など" /></Field>
          </div>
        </details>

        <details className="mt-3 rounded-2xl bg-cream/55 p-3">
          <summary className="min-h-11 cursor-pointer list-none py-2 text-sm font-bold text-ink">レシートを撮影・読み取る</summary>
          <div className="grid gap-3 pt-2">
            <input className="mobile-input" type="file" accept="image/*" capture="environment" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (receiptPreview) URL.revokeObjectURL(receiptPreview);
              setReceiptPreview("");
              setCompressedReceiptSize(null);
              setOcrMessage("");
              if (!file) return;
              setIsCompressingReceipt(true);
              try {
                const compressed = await compressReceiptImage(file);
                setReceiptPreview(compressed.previewUrl);
                setCompressedReceiptSize(compressed.size);
                setOcrMessage(`画像を圧縮しました。${compressed.width}x${compressed.height} / 約${Math.round(compressed.size / 1024)}KB`);
              } catch {
                setOcrMessage("画像の圧縮に失敗しました。別の写真でお試しください。");
              } finally {
                setIsCompressingReceipt(false);
              }
            }} />
            {/* eslint-disable-next-line @next/next/no-img-element -- blob preview for an unsaved local receipt image */}
            {receiptPreview ? <img src={receiptPreview} alt="レシートのプレビュー" className="max-h-56 w-full rounded-2xl object-cover" /> : null}
            <button className="min-h-11 rounded-2xl border border-leaf/30 bg-white px-4 py-3 text-sm font-black text-leaf transition active:scale-[0.98] disabled:opacity-50" type="button" disabled={isCompressingReceipt} onClick={() => setOcrMessage("OCRは次フェーズの確認画面付き実装として残しています。読み取り結果は必ず確認してから登録する設計です。")}>
              写真から読み取る
            </button>
            {compressedReceiptSize ? <p className="text-xs font-bold text-ink/50">保存・OCRに使う場合は圧縮後画像を利用します。</p> : null}
            {ocrMessage ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-bold text-ink/70">{ocrMessage}</p> : null}
          </div>
        </details>

        {displayError ? <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-warn">{displayError}</p> : null}
        {categories.length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 px-4 py-3 text-sm font-bold text-ink/60">支出カテゴリがまだありません。設定でカテゴリを追加してください。</p> : null}
        <div className="mt-5 hidden sm:block"><FormSubmitButton className="min-h-14 w-full rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-soft transition active:scale-[0.98] disabled:bg-ink/20" /></div>
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
                  <span>{expense.date} / {expense.payer || "支払者未設定"} / {getPaymentMethodLabel(data, expense)}</span>
                  <span>{targetLabels[expense.target]}</span>
                  {expense.location ? <span>場所: {expense.location}</span> : null}
                  {expense.memo ? <span>{expense.memo}</span> : null}
                  {data.members.map((member) => <span key={member.id}>{member.name}: {yen(burden[member.id] ?? 0)}</span>)}
                </button>
                {isEditing ? (
                  <ExpenseEditForm data={data} expense={expense} categories={categories} onCancel={() => setEditingExpenseId(null)} />
                ) : (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button className="min-h-11 rounded-xl border border-emerald-900/10 bg-white px-4 text-sm font-bold text-leaf transition active:scale-[0.98]" type="button" onClick={() => setEditingExpenseId(expense.id)}>編集</button>
                    <ExpenseDeleteForm id={expense.id} />
                  </div>
                )}
              </MobileCard>
            );
          })}
        </MobileCards>
        <Table headers={["日付", "カテゴリ", "金額", "支払者", "支払い方法", "対象", "メモ"]}>
          {recentExpenses.map((expense) => {
            const category = getCategory(data, expense.categoryId);
            return (
              <tr key={expense.id}>
                <Td>{expense.date}</Td>
                <Td>{category?.name ?? "未分類"}</Td>
                <Td>{yen(expense.amount)}</Td>
                <Td>{expense.payer}</Td>
                <Td>{getPaymentMethodLabel(data, expense)}</Td>
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

function PayerSelect({ data, value, onChange }: { data: BudgetData; value: string; onChange: (value: string) => void }) {
  return (
    <select className="mobile-input" name="payer" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="共通">共通</option>
      {data.members.map((member) => <option key={member.id}>{member.name}</option>)}
    </select>
  );
}

function PaymentMethodFields({ data, value, onChange }: { data: BudgetData; value: string; onChange: (value: string) => void }) {
  const [type, methodId = ""] = value.split(":") as [PaymentMethodType, string?];
  const creditCards = data.commonPaymentMethods.filter((method) => method.type === "shared_credit_card" && !method.archived);
  const hasSelectedCard = type === "shared_credit_card" && creditCards.some((method) => method.id === methodId);
  const normalizedValue = type === "shared_credit_card" && !hasSelectedCard ? "personal:" : value;
  const [normalizedType, normalizedMethodId = ""] = normalizedValue.split(":") as [PaymentMethodType, string?];
  return (
    <Field label="支払い方法">
      <select className="mobile-input" value={normalizedValue} onChange={(event) => onChange(event.target.value)}>
        <option value="personal:">個人支払い</option>
        <option value="shared_wallet:">共通財布</option>
        <option value="household_account:">家計口座</option>
        {creditCards.map((method) => (
          <option key={method.id} value={`shared_credit_card:${method.id}`}>{method.name}</option>
        ))}
        {creditCards.length === 0 ? <option value="personal:" disabled>共通クレジットカードを設定してください</option> : null}
      </select>
      <input type="hidden" name="paymentMethodType" value={normalizedType || "personal"} />
      <input type="hidden" name="paymentMethodId" value={normalizedMethodId ?? ""} />
      <input type="hidden" name="paidByType" value={normalizedType === "shared_wallet" ? "shared_wallet" : "member"} />
    </Field>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`grid gap-1 text-sm font-bold text-ink/65 ${className}`}>
      {label}
      {children}
    </label>
  );
}
