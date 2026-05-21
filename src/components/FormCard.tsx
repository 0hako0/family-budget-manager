import type { ReactNode } from "react";

type FormCardProps = {
  title: string;
  children: ReactNode;
};

export function FormCard({ title, children }: FormCardProps) {
  return (
    <section className="rounded-lg border border-emerald-900/10 bg-white p-4 shadow-soft sm:p-5">
      <h2 className="text-lg font-bold tracking-normal text-ink">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-ink/70">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-12 rounded-lg border border-emerald-900/10 bg-cream/60 px-4 py-3 text-base text-ink outline-none transition focus:border-leaf focus:bg-white focus:ring-2 focus:ring-leaf/15";
