import Link from "next/link";
import { CategoryManager } from "@/components/CategoryManager";
import { Field, inputClass } from "@/components/FormCard";
import { ListSection } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { budgetData } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">設定</h1>
        <p className="mt-1 text-sm text-ink/60">必要な設定だけ開いて編集します。</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="家計グループ" value={budgetData.settings.groupName} />
        <MetricCard label="負担割合" value={budgetData.settings.burdenRule} tone="accent" />
      </section>

      <details className="rounded-[22px] bg-white p-4 shadow-sm" open>
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">基本設定</summary>
        <div className="mt-3 grid gap-4">
          <Field label="家計グループ名"><input className={inputClass} defaultValue={budgetData.settings.groupName} /></Field>
          <Field label="負担割合"><select className={inputClass} defaultValue={budgetData.settings.burdenRule}><option>50:50</option><option>任意割合</option><option>収入比率</option></select></Field>
          <Field label="パートナー招待"><input className={inputClass} type="email" placeholder="partner@example.com" /></Field>
          <button className="min-h-12 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-sm">保存する</button>
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">カテゴリ編集</summary>
        <div className="mt-3"><CategoryManager initialCategories={budgetData.categories} /></div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">メンバー管理</summary>
        <div className="mt-3 grid gap-2">
          {budgetData.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-2xl bg-cream/60 px-3 py-3 text-sm">
              <span>{member.name}</span><strong>{Math.round(member.shareRatio * 100)}%</strong>
            </div>
          ))}
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">詳細管理</summary>
        <div className="mt-3 grid gap-2">
          <Link className="min-h-11 rounded-2xl bg-cream/60 px-3 py-3 text-sm font-bold text-leaf" href="/incomes">収入管理</Link>
          <Link className="min-h-11 rounded-2xl bg-cream/60 px-3 py-3 text-sm font-bold text-leaf" href="/savings">先取り貯金・投資管理</Link>
          <Link className="min-h-11 rounded-2xl bg-cream/60 px-3 py-3 text-sm font-bold text-leaf" href="/loans">ローン管理</Link>
        </div>
      </details>

      <ListSection title="将来用通知設計">
        <div className="grid gap-2">
          {["食費80%超え", "カテゴリ予算超過", "今月ペース超過", "固定費見直し通知"].map((label) => (
            <div key={label} className="rounded-2xl bg-cream/60 px-3 py-3 text-sm font-bold text-ink">{label}</div>
          ))}
        </div>
      </ListSection>
    </div>
  );
}
