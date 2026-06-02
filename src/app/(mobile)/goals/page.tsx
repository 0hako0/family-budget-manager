import Link from "next/link";
import { yen } from "@/lib/format";
import { getBudgetData } from "@/lib/data";

export default async function GoalsPage() {
  const data = await getBudgetData();
  const goals = data.savingGoals.filter((goal) => !goal.archived);

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">貯金目標</h1>
        <p className="mt-1 text-sm text-ink/60">住宅購入、旅行、車費用などの進捗を確認します。</p>
      </section>

      <section className="rounded-[22px] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-black text-ink">目標一覧</h2>
          <Link href="/settings" prefetch className="text-sm font-bold text-leaf">編集</Link>
        </div>
        {goals.length === 0 ? <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">まだ貯金目標がありません。設定から追加できます。</p> : null}
        <div className="mt-3 grid gap-3">
          {goals.map((goal) => {
            const rate = goal.targetAmount === 0 ? 0 : goal.currentAmount / goal.targetAmount;
            return (
              <div key={goal.id} className="rounded-2xl bg-cream/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-black text-ink">{goal.name}</p>
                  <p className="font-black text-leaf">{Math.round(rate * 100)}%</p>
                </div>
                <p className="mt-1 text-xs font-bold text-ink/55">現在 {yen(goal.currentAmount)} / 目標 {yen(goal.targetAmount)}</p>
                {goal.dueDate ? <p className="mt-1 text-xs font-bold text-ink/45">目標日 {goal.dueDate.replaceAll("-", "/")}</p> : null}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-leaf" style={{ width: `${Math.min(100, Math.round(rate * 100))}%` }} />
                </div>
                {goal.memo ? <p className="mt-2 text-xs font-bold text-ink/55">{goal.memo}</p> : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
