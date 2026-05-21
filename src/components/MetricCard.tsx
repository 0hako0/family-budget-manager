import { clsx } from "clsx";

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "accent" | "warning";
};

export function MetricCard({ label, value, helper, tone = "default" }: MetricCardProps) {
  return (
    <div
      className={clsx(
        "rounded-lg border bg-white p-4 shadow-sm",
        tone === "accent" && "border-leaf/25 bg-emerald-50",
        tone === "warning" && "border-warn/30 bg-red-50",
        tone === "default" && "border-emerald-900/10"
      )}
    >
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className={clsx("mt-2 text-2xl font-bold tracking-normal", tone === "warning" ? "text-warn" : "text-ink")}>{value}</p>
      {helper ? <p className="mt-2 text-sm text-ink/60">{helper}</p> : null}
    </div>
  );
}
