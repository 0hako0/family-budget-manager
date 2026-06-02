import Link from "next/link";
import { getMonthlyPayerBreakdown, getSubscriptionCandidates, getUpcomingPayments } from "@/lib/budget";
import { getBudgetData } from "@/lib/data";
import { yen } from "@/lib/format";

export default async function SchedulePage() {
  const data = await getBudgetData();
  const referenceDate = new Date();
  const upcomingPayments = getUpcomingPayments(data, referenceDate);
  const payerBreakdown = getMonthlyPayerBreakdown(data, referenceDate);
  const subscriptionCandidates = getSubscriptionCandidates(data);

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">支払予定</h1>
        <p className="mt-1 text-sm text-ink/60">給与、固定費、ローン、クレカ引落、貯金積立を日付順に確認します。</p>
      </section>

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-ink">今後の支払予定</h2>
        {upcomingPayments.length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">直近の予定はありません</p> : null}
        <div className="mt-3 grid gap-2">
          {upcomingPayments.map((item) => (
            <div key={`${item.type}-${item.date}-${item.label}`} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/60 px-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-black text-ink">{item.label}</p>
                <p className="text-xs font-bold text-ink/50">{item.date.replaceAll("-", "/")}</p>
              </div>
              <strong className={item.tone === "income" ? "shrink-0 text-leaf" : "shrink-0 text-warn"}>
                {item.tone === "income" ? "+" : "-"}
                {yen(item.amount)}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <h2 className="text-base font-black text-ink">支払内訳</h2>
        <div className="mt-3 grid gap-2">
          {payerBreakdown.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-2xl bg-cream/60 px-3 py-3 text-sm">
              <span className="font-bold text-ink">{row.label}</span>
              <strong className="text-leaf">{yen(row.amount)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-ink">サブスク候補</h2>
          <Link href="/fixed-costs" prefetch className="text-sm font-bold text-leaf">固定費へ</Link>
        </div>
        {subscriptionCandidates.length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">候補はまだありません</p> : null}
        <div className="mt-3 grid gap-2">
          {subscriptionCandidates.map((item) => (
            <div key={`${item.latest.amount}-${item.latest.location}-${item.latest.memo}`} className="rounded-2xl bg-cream/60 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-ink">{item.latest.location || item.latest.memo || "未分類"}</p>
                <strong className="text-leaf">{yen(item.latest.amount)}</strong>
              </div>
              <p className="mt-1 text-xs font-bold text-ink/55">{item.count}か月で検出</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
