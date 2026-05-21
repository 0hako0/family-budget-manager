"use client";

import { useMemo, useState } from "react";
import type { Category, CategoryKind } from "@/lib/types";
import { inputClass } from "./FormCard";

const kindLabels: Record<CategoryKind, string> = {
  expense: "支出",
  fixed_cost: "固定費",
  income: "収入",
  saving: "貯金・投資"
};

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("＋");
  const [color, setColor] = useState("#2f8f6b");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [hidden, setHidden] = useState(false);

  const visibleCategories = useMemo(
    () => categories.filter((category) => !category.archived).sort((a, b) => a.kind.localeCompare(b.kind) || a.sortOrder - b.sortOrder),
    [categories]
  );

  function resetForm() {
    setEditingId(null);
    setKind("expense");
    setName("");
    setIcon("＋");
    setColor("#2f8f6b");
    setMonthlyBudget("");
    setHidden(false);
  }

  function saveCategory() {
    if (!name.trim()) return;
    if (editingId) {
      setCategories((current) =>
        current.map((category) =>
          category.id === editingId
            ? {
                ...category,
                kind,
                name: name.trim(),
                icon,
                color,
                hidden,
                monthlyBudget: monthlyBudget ? Number(monthlyBudget) : undefined
              }
            : category
        )
      );
      resetForm();
      return;
    }

    const nextOrder = Math.max(0, ...categories.filter((category) => category.kind === kind).map((category) => category.sortOrder)) + 1;
    setCategories((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        kind,
        name: name.trim(),
        icon,
        color,
        sortOrder: nextOrder,
        hidden,
        archived: false,
        monthlyBudget: monthlyBudget ? Number(monthlyBudget) : undefined
      }
    ]);
    resetForm();
  }

  function editCategory(category: Category) {
    setEditingId(category.id);
    setKind(category.kind);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setMonthlyBudget(category.monthlyBudget ? String(category.monthlyBudget) : "");
    setHidden(category.hidden);
  }

  function moveCategory(categoryId: string, direction: -1 | 1) {
    setCategories((current) => current.map((category) => category.id === categoryId ? { ...category, sortOrder: Math.max(1, category.sortOrder + direction) } : category));
  }

  function archiveCategory(categoryId: string) {
    setCategories((current) => current.map((category) => category.id === categoryId ? { ...category, archived: true } : category));
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl bg-cream/60 p-3">
        <h2 className="font-black text-ink">{editingId ? "カテゴリ編集" : "カテゴリ追加"}</h2>
        <div className="mt-3 grid gap-3">
          <select className={inputClass} value={kind} onChange={(event) => setKind(event.target.value as CategoryKind)}>
            {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="カテゴリ名 例: 子ども費" />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputClass} value={icon} onChange={(event) => setIcon(event.target.value)} placeholder="アイコン" />
            <input className={inputClass} type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label="カテゴリ色" />
          </div>
          <input className={inputClass} type="number" inputMode="numeric" value={monthlyBudget} onChange={(event) => setMonthlyBudget(event.target.value)} placeholder="月予算 支出カテゴリ用" />
          <label className="flex min-h-11 items-center gap-3 rounded-2xl bg-white px-3 text-sm font-bold text-ink">
            <input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} />
            非表示にする
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button className="min-h-12 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white" onClick={saveCategory}>
              {editingId ? "更新する" : "追加する"}
            </button>
            <button className="min-h-12 rounded-2xl border border-emerald-900/10 bg-white px-4 py-3 text-base font-black text-ink" onClick={resetForm}>
              クリア
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-2">
        {visibleCategories.slice(0, 10).map((category) => (
          <div key={category.id} className="rounded-2xl bg-cream/60 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: `${category.color}22` }}>{category.icon}</span>
                <div>
                  <p className="font-bold text-ink">{category.name}</p>
                  <p className="text-xs text-ink/55">{kindLabels[category.kind]} / 順番 {category.sortOrder} / {category.hidden ? "非表示" : "表示中"}</p>
                </div>
              </div>
              <button className="min-h-11 rounded-full border border-emerald-900/10 px-3 text-xs font-bold text-leaf" onClick={() => editCategory(category)}>編集</button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button className="min-h-10 rounded-xl bg-white text-xs font-bold text-ink" onClick={() => moveCategory(category.id, -1)}>上へ</button>
              <button className="min-h-10 rounded-xl bg-white text-xs font-bold text-ink" onClick={() => moveCategory(category.id, 1)}>下へ</button>
              <button className="min-h-10 rounded-xl bg-red-50 text-xs font-bold text-warn" onClick={() => archiveCategory(category.id)}>アーカイブ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
