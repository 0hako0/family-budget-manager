import Link from "next/link";
import { updateHouseholdMember, updateHouseholdSettings } from "@/app/actions";
import { CategoryManager } from "@/components/CategoryManager";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { inputClass } from "@/components/FormCard";
import { InviteCodeCard } from "@/components/InviteCodeCard";
import { ListSection } from "@/components/ListSection";
import { MetricCard } from "@/components/MetricCard";
import { getBudgetData } from "@/lib/data";
import type { BurdenRule } from "@/lib/types";

const burdenLabels: Record<BurdenRule, string> = {
  fifty_fifty: "50:50",
  custom: "任意割合",
  income_ratio: "収入比率"
};

const successMessages: Record<string, string> = {
  household: "家計グループ設定を保存しました",
  member: "メンバー設定を保存しました"
};

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: {
    categoryError?: string;
    settingsError?: string;
    memberError?: string;
    saved?: string;
  };
}) {
  const data = await getBudgetData();
  const savedMessage = searchParams?.saved ? successMessages[searchParams.saved] : undefined;

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">設定</h1>
        <p className="mt-1 text-sm text-ink/60">家計グループ、メンバー、カテゴリを管理します。</p>
      </section>

      {savedMessage ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-leaf">{savedMessage}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="家計グループ" value={data.settings.groupName} />
        <MetricCard label="負担割合" value={burdenLabels[data.settings.burdenRule]} tone="accent" />
      </section>

      <details className="rounded-[22px] bg-white p-4 shadow-sm" open>
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">家計グループ設定</summary>
        <form action={updateHouseholdSettings} className="mt-3 grid gap-3">
          <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
          <label className="grid gap-1 text-sm font-bold text-ink/65">
            家計グループ名
            <input className={inputClass} name="groupName" defaultValue={data.settings.groupName} required placeholder="わが家の家計" />
          </label>
          <label className="grid gap-1 text-sm font-bold text-ink/65">
            家計アイコンURL
            <input className={inputClass} name="iconUrl" defaultValue={data.settings.iconUrl ?? ""} placeholder="将来用。空欄でもOK" />
          </label>
          <label className="grid gap-1 text-sm font-bold text-ink/65">
            負担割合ルール
            <select className={inputClass} name="burdenRule" defaultValue={data.settings.burdenRule}>
              <option value="fifty_fifty">50:50</option>
              <option value="custom">任意割合</option>
              <option value="income_ratio">収入比率で自動計算</option>
            </select>
          </label>
          {searchParams?.settingsError ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.settingsError}</p> : null}
          <FormSubmitButton idleLabel="保存する" pendingLabel="保存中..." className="min-h-14 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-sm transition active:scale-[0.98] disabled:bg-ink/20" />
        </form>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">メンバー設定</summary>
        <div className="mt-3 grid gap-3">
          {searchParams?.memberError ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.memberError}</p> : null}
          {data.members.length === 0 ? <p className="rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">まだメンバーがいません</p> : null}
          {data.members.map((member) => (
            <form key={member.id} action={updateHouseholdMember} className="grid gap-3 rounded-2xl bg-cream/60 p-3">
              <input type="hidden" name="id" value={member.id} />
              <label className="grid gap-1 text-sm font-bold text-ink/65">
                表示名
                <input className={inputClass} name="displayName" defaultValue={member.name} required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm font-bold text-ink/65">
                  負担割合
                  <input className={inputClass} name="shareRatio" type="number" inputMode="numeric" min={0} max={100} defaultValue={Math.round(member.shareRatio * 100)} />
                </label>
                <label className="grid gap-1 text-sm font-bold text-ink/65">
                  role
                  <select className={inputClass} name="role" defaultValue={member.role}>
                    <option value="owner">owner</option>
                    <option value="member">member</option>
                  </select>
                </label>
              </div>
              <FormSubmitButton idleLabel="メンバーを保存" pendingLabel="保存中..." />
            </form>
          ))}
          <p className="rounded-2xl bg-cream/60 p-3 text-xs font-bold text-ink/55">
            負担割合の変更は、今後入力する支出や現在の集計表示に反映されます。月締め済みの過去サマリーは再計算しません。
          </p>
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm" open>
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">家計コード</summary>
        <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/70">
          このコードをパートナーに共有すると、同じ家計に参加できます。招待メールは送信しません。
        </p>
        <div className="mt-3">
          <InviteCodeCard code={data.settings.inviteCode} />
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">カテゴリ設定</summary>
        <div className="mt-3">
          {searchParams?.categoryError ? <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.categoryError}</p> : null}
          <CategoryManager initialCategories={data.categories} householdGroupId={data.householdGroupId} />
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

      <ListSection title="将来用通知設定">
        <div className="grid gap-2">
          {["食費80%超え", "カテゴリ予算超過", "今月ペース超過", "固定費見直し通知"].map((label) => (
            <div key={label} className="rounded-2xl bg-cream/60 px-3 py-3 text-sm font-bold text-ink">{label}</div>
          ))}
        </div>
      </ListSection>
    </div>
  );
}
