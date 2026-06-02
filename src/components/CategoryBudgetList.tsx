import { yen } from "@/lib/format";
import type { Category } from "@/lib/types";

type Item = {
  category: Category;
  used: number;
  budget: number;
  rate: number;
  remaining: number;
};

export function CategoryBudgetList({ items, compact = false }: { items: Item[]; compact?: boolean }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-cream/60 p-4 text-sm font-bold text-ink/60">
        <p>カテゴリ予算がまだ登録されていません</p>
        <p className="mt-1 text-xs">設定のカテゴリ編集から、食費や外食などの月予算を追加できます。</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => {
        const rate = Math.round(item.rate * 100);
        const over = item.rate >= 1;
        return (
          <div key={item.category.id} className="rounded-lg bg-cream/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-base" style={{ backgroundColor: `${item.category.color}22` }}>
                  {item.category.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{item.category.name}</p>
                  <p className="text-xs text-ink/55">
                    {yen(item.used)} / {yen(item.budget)}
                  </p>
                </div>
              </div>
              <strong className={over ? "text-warn" : "text-leaf"}>{rate}%</strong>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className={over ? "h-full rounded-full bg-warn" : "h-full rounded-full bg-leaf"} style={{ width: `${Math.min(100, rate)}%` }} />
            </div>
            {!compact ? <p className="mt-2 text-xs text-ink/55">残り {yen(item.remaining)}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
