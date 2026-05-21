import type { ReactNode } from "react";

export function MobileCards({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:hidden">{children}</div>;
}

export function MobileCard({ title, amount, children }: { title: string; amount?: string; children: ReactNode }) {
  return (
    <article className="rounded-lg border border-emerald-900/10 bg-cream/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        {amount ? <p className="shrink-0 text-lg font-black text-ink">{amount}</p> : null}
      </div>
      <div className="mt-3 grid gap-1 text-sm text-ink/65">{children}</div>
    </article>
  );
}
