import Link from "next/link";
import { CategoryManager } from "@/components/CategoryManager";
import { Field, inputClass } from "@/components/FormCard";
import { ListSection } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { createInvitation } from "@/app/actions";
import { getBudgetData } from "@/lib/data";

const burdenLabels = {
  fifty_fifty: "50:50",
  custom: "任意割合",
  income_ratio: "収入比率"
};

export default async function SettingsPage({ searchParams }: { searchParams?: { invite?: string; inviteError?: string; categoryError?: string } }) {
  const data = await getBudgetData();
  const inviteUrl = searchParams?.invite ? `/join?code=${searchParams.invite}` : "";

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">設定</h1>
        <p className="mt-1 text-sm text-ink/60">共有メンバー、招待、カテゴリを管理します。</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="家計グループ" value={data.settings.groupName} />
        <MetricCard label="負担割合" value={burdenLabels[data.settings.burdenRule]} tone="accent" />
      </section>

      <details className="rounded-[22px] bg-white p-4 shadow-sm" open>
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">パートナー招待</summary>
        <form action={createInvitation} className="mt-3 grid gap-3">
          <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
          <Field label="パートナーのメール（任意）">
            <input className={inputClass} type="email" name="email" placeholder="partner@example.com" />
          </Field>
          <button className="min-h-12 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-sm" type="submit">
            招待コードを作成
          </button>
          {searchParams?.invite ? (
            <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-ink">
              <p>招待コード: <span className="text-leaf">{searchParams.invite}</span></p>
              <p className="mt-1">招待URL: {inviteUrl}</p>
            </div>
          ) : null}
          {searchParams?.inviteError ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.inviteError}</p> : null}
        </form>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">カテゴリ編集</summary>
        <div className="mt-3">
          {searchParams?.categoryError ? <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.categoryError}</p> : null}
          <CategoryManager initialCategories={data.categories} householdGroupId={data.householdGroupId} />
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">メンバー管理</summary>
        <div className="mt-3 grid gap-2">
          {data.members.length === 0 ? <p className="text-sm font-bold text-ink/60">まだ登録されていません</p> : null}
          {data.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-2xl bg-cream/60 px-3 py-3 text-sm">
              <span>{member.name}</span>
              <strong>{member.role === "owner" ? "owner" : "member"} / {Math.round(member.shareRatio * 100)}%</strong>
            </div>
          ))}
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">詳細管理</summary>
        <div className="mt-3 grid gap-2">
          <Link className="min-h-11 rounded-2xl bg-cream/60 px-3 py-3 text-sm font-bold text-leaf" href="/incomes">収入管理</Link>
          <Link className="min-h-11 rounded-2xl bg-cream/60 px-3 py-3 text-sm font-bold text-leaf" href="/savings">貯金・投資管理</Link>
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
