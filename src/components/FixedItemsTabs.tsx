"use client";

import React, { useState } from "react";
import { createFixedCost, createIncome, createLoan, createSaving, deleteFixedCost, deleteIncome, deleteLoan, deleteSaving } from "@/app/actions";
import { getCategory } from "@/lib/budget";
import { yen } from "@/lib/format";
import type { BudgetData, FixedCost, Income, Loan, Saving } from "@/lib/types";
import { FormSubmitButton } from "./FormSubmitButton";

const inputClass = "mobile-input";
const tabs = ["固定費", "収入", "貯金・投資", "ローン"] as const;

export function FixedItemsTabs({ data, initialTab = "固定費", errorMessage }: { data: BudgetData; initialTab?: (typeof tabs)[number]; errorMessage?: string }) {
  const [tab, setTab] = useStateSafe(initialTab);
  const fixedCategories = data.categories.filter((category) => category.kind === "fixed_cost" && !category.archived);
  const incomeCategories = data.categories.filter((category) => category.kind === "income" && !category.archived);
  const savingCategories = data.categories.filter((category) => category.kind === "saving" && !category.archived);

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">固定項目</h1>
        <p className="mt-1 text-sm text-ink/60">収入、固定費、貯金・投資、ローンをまとめて管理します。</p>
      </section>
      <div className="grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {tabs.map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={tab === item ? "min-h-11 rounded-xl bg-leaf text-[11px] font-black text-white" : "min-h-11 rounded-xl text-[11px] font-bold text-ink/60"}>
            {item}
          </button>
        ))}
      </div>
      {errorMessage ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{errorMessage}</p> : null}
      {tab === "固定費" ? <FixedCostPanel data={data} categories={fixedCategories} /> : null}
      {tab === "収入" ? <IncomePanel data={data} categories={incomeCategories} /> : null}
      {tab === "貯金・投資" ? <SavingPanel data={data} categories={savingCategories} /> : null}
      {tab === "ローン" ? <LoanPanel data={data} /> : null}
    </div>
  );
}

function useStateSafe<T>(initialValue: T) {
  return useState(initialValue);
}

function PanelSummary({ items }: { items: Array<{ label: string; value: string; tone?: "warn" | "accent" }> }) {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[18px] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-ink/55">{item.label}</p>
          <p className={item.tone === "warn" ? "mt-1 text-xl font-black text-warn" : item.tone === "accent" ? "mt-1 text-xl font-black text-leaf" : "mt-1 text-xl font-black text-ink"}>{item.value}</p>
        </div>
      ))}
    </section>
  );
}

function FixedCostPanel({ data, categories }: { data: BudgetData; categories: Array<{ id: string; name: string }> }) {
  const total = data.fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const reviewTargets = data.fixedCosts.filter((cost) => cost.reviewTarget);
  return (
    <section className="grid gap-4">
      <PanelSummary items={[{ label: "月額合計", value: yen(total) }, { label: "年間換算", value: yen(total * 12) }, { label: "見直し候補", value: `${reviewTargets.length}件`, tone: "accent" }]} />
      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">固定費を登録</summary>
        <div className="mt-3">
          <FixedCostForm data={data} categories={categories} />
        </div>
      </details>
      <ItemList empty="まだ固定費がありません">
        {data.fixedCosts.map((cost) => (
          <ItemCard key={cost.id} title={cost.name} amount={yen(cost.amount)} meta={`${getCategory(data, cost.categoryId)?.name ?? "未分類"} / ${cost.paidOn}日 / ${cost.payer || "支払者未設定"}`}>
            {cost.reviewMemo ? <p>{cost.reviewMemo}</p> : null}
            <details className="mt-3 rounded-2xl bg-white p-3">
              <summary className="min-h-10 cursor-pointer list-none text-sm font-black text-leaf">編集</summary>
              <div className="mt-3">
                <FixedCostForm data={data} categories={categories} cost={cost} />
              </div>
            </details>
            <DeleteForm action={deleteFixedCost} id={cost.id} label="固定費" />
          </ItemCard>
        ))}
      </ItemList>
    </section>
  );
}

function FixedCostForm({ data, categories, cost }: { data: BudgetData; categories: Array<{ id: string; name: string }>; cost?: FixedCost }) {
  return (
    <form action={createFixedCost} className="grid gap-3 sm:grid-cols-2">
      <HiddenBase data={data} id={cost?.id} />
      <Field label="名称"><input className={inputClass} name="name" defaultValue={cost?.name ?? ""} required /></Field>
      <Field label="金額"><input className={inputClass} name="amount" type="number" inputMode="numeric" defaultValue={cost?.amount ?? ""} required /></Field>
      <Field label="支払日"><input className={inputClass} name="paidOn" type="number" inputMode="numeric" min={1} max={31} defaultValue={cost?.paidOn ?? 1} /></Field>
      <Field label="支払者"><PayerSelect data={data} name="payer" defaultValue={cost?.payer} /></Field>
      <Field label="カテゴリ"><CategorySelect categories={categories} defaultValue={cost?.categoryId} /></Field>
      <Field label="見直しメモ"><input className={inputClass} name="reviewMemo" defaultValue={cost?.reviewMemo ?? ""} /></Field>
      <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3 text-sm font-bold text-ink">
        <input name="reviewTarget" type="checkbox" defaultChecked={cost?.reviewTarget ?? false} />
        見直し候補にする
      </label>
      <FormSubmitButton idleLabel={cost ? "更新する" : "登録する"} pendingLabel="保存中..." />
    </form>
  );
}

function IncomePanel({ data, categories }: { data: BudgetData; categories: Array<{ id: string; name: string }> }) {
  const total = data.incomes.reduce((sum, income) => sum + income.amount, 0);
  return (
    <section className="grid gap-4">
      <PanelSummary items={[{ label: "今月の収入予定", value: yen(total), tone: "accent" }]} />
      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">収入を登録</summary>
        <div className="mt-3"><IncomeForm data={data} categories={categories} /></div>
      </details>
      <ItemList empty="まだ収入がありません">
        {data.incomes.map((income) => (
          <ItemCard key={income.id} title={income.name} amount={yen(income.amount)} meta={`${income.paidOn} / ${income.earner || "収入者未設定"} / ${getCategory(data, income.categoryId)?.name ?? "未分類"}`}>
            <details className="mt-3 rounded-2xl bg-white p-3">
              <summary className="min-h-10 cursor-pointer list-none text-sm font-black text-leaf">編集</summary>
              <div className="mt-3"><IncomeForm data={data} categories={categories} income={income} /></div>
            </details>
            <DeleteForm action={deleteIncome} id={income.id} label="収入" />
          </ItemCard>
        ))}
      </ItemList>
    </section>
  );
}

function IncomeForm({ data, categories, income }: { data: BudgetData; categories: Array<{ id: string; name: string }>; income?: Income }) {
  return (
    <form action={createIncome} className="grid gap-3 sm:grid-cols-2">
      <HiddenBase data={data} id={income?.id} />
      <Field label="収入名"><input className={inputClass} name="name" defaultValue={income?.name ?? ""} required /></Field>
      <Field label="金額"><input className={inputClass} name="amount" type="number" inputMode="numeric" defaultValue={income?.amount ?? ""} required /></Field>
      <Field label="入金日"><input className={inputClass} name="paidOn" type="date" defaultValue={income?.paidOn ?? new Date().toISOString().slice(0, 10)} /></Field>
      <Field label="収入者"><PayerSelect data={data} name="earner" defaultValue={income?.earner} includeSharedWallet={false} /></Field>
      <Field label="カテゴリ"><CategorySelect categories={categories} defaultValue={income?.categoryId} /></Field>
      <Field label="毎月繰り返し"><RecurringSelect defaultValue={income?.recurring} /></Field>
      <FormSubmitButton idleLabel={income ? "更新する" : "登録する"} pendingLabel="保存中..." />
    </form>
  );
}

function SavingPanel({ data, categories }: { data: BudgetData; categories: Array<{ id: string; name: string }> }) {
  const total = data.savings.reduce((sum, saving) => sum + saving.amount, 0);
  return (
    <section className="grid gap-4">
      <PanelSummary items={[{ label: "貯金・投資合計", value: yen(total), tone: "accent" }]} />
      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">貯金・投資を登録</summary>
        <div className="mt-3"><SavingForm data={data} categories={categories} /></div>
      </details>
      <ItemList empty="まだ貯金・投資がありません">
        {data.savings.map((saving) => (
          <ItemCard key={saving.id} title={saving.name} amount={yen(saving.amount)} meta={getCategory(data, saving.categoryId)?.name ?? "未分類"}>
            <details className="mt-3 rounded-2xl bg-white p-3">
              <summary className="min-h-10 cursor-pointer list-none text-sm font-black text-leaf">編集</summary>
              <div className="mt-3"><SavingForm data={data} categories={categories} saving={saving} /></div>
            </details>
            <DeleteForm action={deleteSaving} id={saving.id} label="貯金・投資" />
          </ItemCard>
        ))}
      </ItemList>
    </section>
  );
}

function SavingForm({ data, categories, saving }: { data: BudgetData; categories: Array<{ id: string; name: string }>; saving?: Saving }) {
  return (
    <form action={createSaving} className="grid gap-3 sm:grid-cols-2">
      <HiddenBase data={data} id={saving?.id} />
      <Field label="名称"><input className={inputClass} name="name" defaultValue={saving?.name ?? ""} required /></Field>
      <Field label="金額"><input className={inputClass} name="amount" type="number" inputMode="numeric" defaultValue={saving?.amount ?? ""} required /></Field>
      <Field label="カテゴリ"><CategorySelect categories={categories} defaultValue={saving?.categoryId} /></Field>
      <Field label="毎月繰り返し"><RecurringSelect defaultValue={saving?.recurring} /></Field>
      <FormSubmitButton idleLabel={saving ? "更新する" : "登録する"} pendingLabel="保存中..." />
    </form>
  );
}

function LoanPanel({ data }: { data: BudgetData }) {
  const monthlyTotal = data.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  const balanceTotal = data.loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  return (
    <section className="grid gap-4">
      <PanelSummary items={[{ label: "毎月返済額", value: yen(monthlyTotal) }, { label: "残債合計", value: yen(balanceTotal), tone: "accent" }]} />
      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">ローンを登録</summary>
        <div className="mt-3"><LoanForm data={data} /></div>
      </details>
      <ItemList empty="まだローンがありません">
        {data.loans.map((loan) => (
          <ItemCard key={loan.id} title={loan.name} amount={yen(loan.monthlyPayment)} meta={`支払日 ${loan.paidOn}日 / 残債 ${yen(loan.remainingBalance)} / 金利 ${loan.interestRate}%`}>
            {loan.memo ? <p>{loan.memo}</p> : null}
            <details className="mt-3 rounded-2xl bg-white p-3">
              <summary className="min-h-10 cursor-pointer list-none text-sm font-black text-leaf">編集</summary>
              <div className="mt-3"><LoanForm data={data} loan={loan} /></div>
            </details>
            <DeleteForm action={deleteLoan} id={loan.id} label="ローン" />
          </ItemCard>
        ))}
      </ItemList>
    </section>
  );
}

function LoanForm({ data, loan }: { data: BudgetData; loan?: Loan }) {
  return (
    <form action={createLoan} className="grid gap-3 sm:grid-cols-2">
      <HiddenBase data={data} id={loan?.id} />
      <Field label="ローン名"><input className={inputClass} name="name" defaultValue={loan?.name ?? ""} required /></Field>
      <Field label="毎月返済額"><input className={inputClass} name="monthlyPayment" type="number" inputMode="numeric" defaultValue={loan?.monthlyPayment ?? ""} required /></Field>
      <Field label="支払日"><input className={inputClass} name="paidOn" type="number" inputMode="numeric" min={1} max={31} defaultValue={loan?.paidOn ?? 1} /></Field>
      <Field label="残債"><input className={inputClass} name="remainingBalance" type="number" inputMode="numeric" defaultValue={loan?.remainingBalance ?? 0} /></Field>
      <Field label="金利"><input className={inputClass} name="interestRate" type="number" step="0.1" defaultValue={loan?.interestRate ?? 0} /></Field>
      <Field label="完済予定日"><input className={inputClass} name="payoffDate" type="date" defaultValue={loan?.payoffDate ?? ""} /></Field>
      <Field label="ボーナス払い"><select className={inputClass} name="hasBonusPayment" defaultValue={String(loan?.hasBonusPayment ?? false)}><option value="false">なし</option><option value="true">あり</option></select></Field>
      <Field label="メモ"><input className={inputClass} name="memo" defaultValue={loan?.memo ?? ""} /></Field>
      <FormSubmitButton idleLabel={loan ? "更新する" : "登録する"} pendingLabel="保存中..." />
    </form>
  );
}

function HiddenBase({ data, id }: { data: BudgetData; id?: string }) {
  return (
    <>
      <input type="hidden" name="id" value={id ?? ""} />
      <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
      <input type="hidden" name="memberId" value={data.currentMemberId ?? ""} />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1 text-sm font-bold text-ink/65">{label}{children}</label>;
}

function CategorySelect({ categories, defaultValue = "" }: { categories: Array<{ id: string; name: string }>; defaultValue?: string }) {
  return <select className={inputClass} name="categoryId" defaultValue={defaultValue}><option value="">未選択</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>;
}

function RecurringSelect({ defaultValue = true }: { defaultValue?: boolean }) {
  return <select className={inputClass} name="recurring" defaultValue={String(defaultValue)}><option value="true">あり</option><option value="false">なし</option></select>;
}

function PayerSelect({ data, name, defaultValue, includeSharedWallet = true }: { data: BudgetData; name: string; defaultValue?: string; includeSharedWallet?: boolean }) {
  return (
    <select className={inputClass} name={name} defaultValue={defaultValue ?? data.members[0]?.name ?? ""}>
      <option value="">未選択</option>
      {data.members.map((member) => <option key={member.id}>{member.name}</option>)}
      {includeSharedWallet ? <option value="共通財布">共通財布</option> : null}
    </select>
  );
}

function ItemList({ empty, children }: { empty: string; children: React.ReactNode }) {
  return <section className="rounded-[22px] bg-white p-4 shadow-sm">{React.Children.count(children) === 0 ? <p className="text-sm font-bold text-ink/60">{empty}</p> : <div className="grid gap-3">{children}</div>}</section>;
}

function ItemCard({ title, amount, meta, children }: { title: string; amount: string; meta: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl bg-cream/60 p-4">
      <button type="button" className="w-full text-left transition active:scale-[0.99]" onClick={(event) => event.currentTarget.parentElement?.querySelector("details")?.setAttribute("open", "true")}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-black text-ink">{title}</h3>
          <p className="shrink-0 text-lg font-black text-ink">{amount}</p>
        </div>
        <p className="mt-2 text-sm font-bold text-ink/60">{meta}</p>
      </button>
      <div className="mt-2 grid gap-2 text-sm text-ink/65">{children}</div>
    </article>
  );
}

function DeleteForm({ action, id, label }: { action: (formData: FormData) => void; id: string; label: string }) {
  return (
    <form action={action} onSubmit={(event) => { if (!window.confirm(`${label}を削除しますか？`)) event.preventDefault(); }}>
      <input type="hidden" name="id" value={id} />
      <FormSubmitButton idleLabel="削除" pendingLabel="削除中..." className="min-h-11 rounded-xl bg-red-50 px-4 text-sm font-bold text-warn transition active:scale-[0.98] disabled:opacity-50" />
    </form>
  );
}
