"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { archiveCategory, saveCategory } from "@/app/actions";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import type { Category, CategoryKind } from "@/lib/types";
import { inputClass } from "./FormCard";

const kindLabels: Record<CategoryKind, string> = {
  expense: "支出",
  fixed_cost: "固定費",
  income: "収入",
  saving: "貯金・投資"
};

function ArchiveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="min-h-10 w-full rounded-xl bg-red-50 text-xs font-bold text-warn transition active:scale-[0.98] disabled:opacity-50"
      type="submit"
      disabled={pending}
    >
      {pending ? "アーカイブ中..." : "アーカイブ"}
    </button>
  );
}

export function CategoryManager({ initialCategories, householdGroupId }: { initialCategories: Category[]; householdGroupId?: string }) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("・");
  const [color, setColor] = useState("#2f8f6b");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [sortOrder, setSortOrder] = useState("1");
  const [hidden, setHidden] = useState(false);
  const [favorite, setFavorite] = useState(false);

  const visibleCategories = useMemo(
    () => initialCategories.filter((category) => !category.archived).sort((a, b) => a.kind.localeCompare(b.kind) || a.sortOrder - b.sortOrder),
    [initialCategories]
  );
  const nextSortOrder = Math.max(0, ...initialCategories.filter((category) => category.kind === kind).map((category) => category.sortOrder)) + 1;

  function resetForm() {
    setEditing(null);
    setKind("expense");
    setName("");
    setIcon("・");
    setColor("#2f8f6b");
    setMonthlyBudget("");
    setSortOrder(String(nextSortOrder));
    setHidden(false);
    setFavorite(false);
  }

  function editCategory(category: Category) {
    setEditing(category);
    setKind(category.kind);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setMonthlyBudget(category.monthlyBudget ? String(category.monthlyBudget) : "");
    setSortOrder(String(category.sortOrder));
    setHidden(category.hidden);
    setFavorite(Boolean(category.favorite));
  }

  return (
    <div className="grid gap-4">
      <form action={saveCategory} className="grid gap-3 rounded-2xl bg-cream/60 p-3">
        <input type="hidden" name="householdGroupId" value={householdGroupId ?? ""} />
        <input type="hidden" name="id" value={editing?.id ?? ""} />
        <h2 className="font-black text-ink">{editing ? "カテゴリ編集" : "カテゴリ追加"}</h2>
        <select className={inputClass} name="kind" value={kind} onChange={(event) => setKind(event.target.value as CategoryKind)}>
          {Object.entries(kindLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input className={inputClass} name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="カテゴリ名" required />
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} name="icon" value={icon} onChange={(event) => setIcon(event.target.value)} placeholder="アイコン" />
          <input className={inputClass} name="color" type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label="カテゴリ色" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className={inputClass} name="monthlyBudget" type="number" inputMode="numeric" value={monthlyBudget} onChange={(event) => setMonthlyBudget(event.target.value)} placeholder="月予算" />
          <input className={inputClass} name="sortOrder" type="number" inputMode="numeric" value={sortOrder || String(nextSortOrder)} onChange={(event) => setSortOrder(event.target.value)} placeholder="並び順" />
        </div>
        <label className="flex min-h-11 items-center gap-3 rounded-2xl bg-white px-3 text-sm font-bold text-ink">
          <input name="favorite" type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} />
          よく使うカテゴリに表示
        </label>
        <label className="flex min-h-11 items-center gap-3 rounded-2xl bg-white px-3 text-sm font-bold text-ink">
          <input name="hidden" type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} />
          非表示にする
        </label>
        <div className="grid grid-cols-2 gap-2">
          <FormSubmitButton idleLabel={editing ? "更新する" : "追加する"} pendingLabel="保存中..." />
          <button className="min-h-12 rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 text-base font-black text-ink transition active:scale-[0.98]" type="button" onClick={resetForm}>
            クリア
          </button>
        </div>
      </form>

      <div className="grid gap-2">
        {visibleCategories.length === 0 ? <p className="rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">カテゴリがまだありません</p> : null}
        {visibleCategories.slice(0, 16).map((category) => (
          <div key={category.id} className="rounded-2xl bg-cream/60 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: `${category.color}22` }}>
                  {category.icon}
                </span>
                <div>
                  <p className="font-bold text-ink">{category.name}</p>
                  <p className="text-xs text-ink/55">
                    {kindLabels[category.kind]} / 並び順 {category.sortOrder} / {category.hidden ? "非表示" : "表示中"}
                  </p>
                </div>
              </div>
              <button className="min-h-11 rounded-full border border-emerald-900/10 px-3 text-xs font-bold text-leaf transition active:scale-[0.98]" type="button" onClick={() => editCategory(category)}>
                編集
              </button>
            </div>
            <form
              action={archiveCategory}
              className="mt-3"
              onSubmit={(event) => {
                if (!window.confirm("このカテゴリをアーカイブしますか？過去データの集計には残ります。")) event.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={category.id} />
              <ArchiveButton />
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
