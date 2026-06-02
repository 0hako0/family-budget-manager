import { saveCommonPaymentMethod, saveSavingGoal, updateHouseholdMember, updateHouseholdSettings } from "@/app/actions";
import { CategoryManager } from "@/components/CategoryManager";
import { DataExportTools } from "@/components/DataExportTools";
import { inputClass } from "@/components/FormCard";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import { InviteCodeCard } from "@/components/InviteCodeCard";
import { MetricCard } from "@/components/MetricCard";
import { getBudgetData } from "@/lib/data";
import type { BurdenRule } from "@/lib/types";

const burdenLabels: Record<BurdenRule, string> = {
  fifty_fifty: "50:50",
  custom: "任意割合",
  income_ratio: "収入比率"
};

const successMessages: Record<string, string> = {
  household: "設定を保存しました",
  member: "メンバー設定を保存しました"
};

const widgetLabels = [
  ["widgetMonthEnd", "月末見込み", "monthEnd"],
  ["widgetPayerBreakdown", "支払内訳", "payerBreakdown"],
  ["widgetCategoryBudget", "カテゴリ予算", "categoryBudget"],
  ["widgetSharedWallet", "共通支払い方法", "sharedWallet"],
  ["widgetIncomeSchedule", "収入予定", "incomeSchedule"],
  ["widgetBurdenRatio", "負担割合", "burdenRatio"]
] as const;

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: { categoryError?: string; settingsError?: string; memberError?: string; saved?: string };
}) {
  const data = await getBudgetData();
  const savedMessage = searchParams?.saved ? successMessages[searchParams.saved] : undefined;
  const creditCards = data.commonPaymentMethods.filter((method) => method.type === "shared_credit_card");

  return (
    <div className="grid gap-5">
      <section>
        <h1 className="text-xl font-black text-ink">設定</h1>
        <p className="mt-1 text-sm text-ink/60">家計グループ、メンバー、支払い方法、カテゴリを管理します。</p>
      </section>

      {savedMessage ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-leaf">{savedMessage}</p> : null}
      {searchParams?.settingsError ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.settingsError}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="家計グループ" value={data.settings.groupName} />
        <MetricCard label="負担割合ルール" value={burdenLabels[data.settings.burdenRule]} tone="accent" />
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
            <input className={inputClass} name="iconUrl" defaultValue={data.settings.iconUrl ?? ""} placeholder="将来用。空欄でOK" />
          </label>
          <label className="grid gap-1 text-sm font-bold text-ink/65">
            負担割合ルール
            <select className={inputClass} name="burdenRule" defaultValue={data.settings.burdenRule}>
              <option value="fifty_fifty">50:50</option>
              <option value="custom">任意割合</option>
              <option value="income_ratio">収入比率で自動計算</option>
            </select>
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-cream/60 px-4 py-3 text-sm font-bold text-ink">
            <input name="saveReceiptImages" type="checkbox" defaultChecked={data.settings.saveReceiptImages} />
            レシート画像を保存する
          </label>
          <label className="grid gap-1 text-sm font-bold text-ink/65">
            レシート画像の保存期間
            <select className={inputClass} name="receiptRetentionPolicy" defaultValue={data.settings.receiptRetentionPolicy}>
              <option value="none">保存しない</option>
              <option value="30_days">30日保存</option>
              <option value="90_days">90日保存</option>
              <option value="forever">永久保存</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-ink/65">
            改善要望メモ
            <textarea
              className={`${inputClass} min-h-28 resize-none`}
              name="improvementNotes"
              defaultValue={data.settings.improvementNotes}
              placeholder="使っていて気づいた改善点を残せます"
            />
          </label>
          <div className="rounded-2xl bg-cream/60 p-3">
            <p className="text-sm font-black text-ink">ホーム表示</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {widgetLabels.map(([name, label, key]) => (
                <label key={name} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-ink">
                  <input name={name} type="checkbox" defaultChecked={data.settings.homeWidgets[key]} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <FormSubmitButton idleLabel="保存する" pendingLabel="保存中..." className="min-h-14 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white shadow-sm transition active:scale-[0.98] disabled:bg-ink/20" />
        </form>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">共通クレジットカード</summary>
        <form action={saveCommonPaymentMethod} className="mt-3 grid gap-3 rounded-2xl bg-cream/60 p-3">
          <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
          <input type="hidden" name="type" value="shared_credit_card" />
          <label className="grid gap-1 text-sm font-bold text-ink/65">カード名<input className={inputClass} name="name" placeholder="家計カード" required /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm font-bold text-ink/65">締め日<input className={inputClass} name="closingDay" type="number" inputMode="numeric" min={1} max={31} placeholder="15" /></label>
            <label className="grid gap-1 text-sm font-bold text-ink/65">引き落とし日<input className={inputClass} name="withdrawalDay" type="number" inputMode="numeric" min={1} max={31} placeholder="27" /></label>
          </div>
          <label className="grid gap-1 text-sm font-bold text-ink/65">引き落とし口座<input className={inputClass} name="withdrawalAccount" placeholder="家計口座" /></label>
          <FormSubmitButton idleLabel="カードを登録" pendingLabel="保存中..." />
        </form>
        <div className="mt-3 grid gap-3">
          {creditCards.length === 0 ? <p className="rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">まだ共通クレカが登録されていません</p> : null}
          {creditCards.map((card) => (
            <form key={card.id} action={saveCommonPaymentMethod} className="grid gap-3 rounded-2xl bg-cream/60 p-3">
              <input type="hidden" name="id" value={card.id} />
              <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
              <input type="hidden" name="type" value="shared_credit_card" />
              <input className={inputClass} name="name" defaultValue={card.name} required />
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} name="closingDay" type="number" inputMode="numeric" min={1} max={31} defaultValue={card.closingDay ?? ""} placeholder="締め日" />
                <input className={inputClass} name="withdrawalDay" type="number" inputMode="numeric" min={1} max={31} defaultValue={card.withdrawalDay ?? ""} placeholder="引き落とし日" />
              </div>
              <input className={inputClass} name="withdrawalAccount" defaultValue={card.withdrawalAccount ?? ""} placeholder="引き落とし口座" />
              <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-ink">
                <input name="archived" type="checkbox" defaultChecked={card.archived} />
                非表示にする
              </label>
              <FormSubmitButton idleLabel="更新する" pendingLabel="保存中..." />
            </form>
          ))}
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">貯金目標</summary>
        <form action={saveSavingGoal} className="mt-3 grid gap-3 rounded-2xl bg-cream/60 p-3">
          <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
          <label className="grid gap-1 text-sm font-bold text-ink/65">目標名<input className={inputClass} name="name" placeholder="住宅購入" required /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-bold text-ink/65">目標金額<input className={inputClass} name="targetAmount" type="number" inputMode="numeric" placeholder="5000000" required /></label>
            <label className="grid gap-1 text-sm font-bold text-ink/65">現在額<input className={inputClass} name="currentAmount" type="number" inputMode="numeric" placeholder="1820000" /></label>
          </div>
          <label className="grid gap-1 text-sm font-bold text-ink/65">期限<input className={inputClass} name="dueDate" type="date" /></label>
          <label className="grid gap-1 text-sm font-bold text-ink/65">メモ<input className={inputClass} name="memo" placeholder="頭金、教育費など" /></label>
          <FormSubmitButton idleLabel="目標を登録" pendingLabel="保存中..." />
        </form>
        <div className="mt-3 grid gap-3">
          {data.savingGoals.length === 0 ? <p className="rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/60">まだ貯金目標がありません</p> : null}
          {data.savingGoals.map((goal) => (
            <form key={goal.id} action={saveSavingGoal} className="grid gap-3 rounded-2xl bg-cream/60 p-3">
              <input type="hidden" name="id" value={goal.id} />
              <input type="hidden" name="householdGroupId" value={data.householdGroupId ?? ""} />
              <input className={inputClass} name="name" defaultValue={goal.name} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold text-ink/65">目標金額<input className={inputClass} name="targetAmount" type="number" inputMode="numeric" defaultValue={goal.targetAmount} required /></label>
                <label className="grid gap-1 text-sm font-bold text-ink/65">現在額<input className={inputClass} name="currentAmount" type="number" inputMode="numeric" defaultValue={goal.currentAmount} /></label>
              </div>
              <input className={inputClass} name="dueDate" type="date" defaultValue={goal.dueDate ?? ""} />
              <input className={inputClass} name="memo" defaultValue={goal.memo ?? ""} />
              <label className="flex min-h-12 items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-ink">
                <input name="archived" type="checkbox" defaultChecked={goal.archived} />
                非表示にする
              </label>
              <FormSubmitButton idleLabel="更新する" pendingLabel="保存中..." />
            </form>
          ))}
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">メンバー設定</summary>
        <div className="mt-3 grid gap-3">
          {searchParams?.memberError ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.memberError}</p> : null}
          {data.members.map((member) => (
            <form key={member.id} action={updateHouseholdMember} className="grid gap-3 rounded-2xl bg-cream/60 p-3">
              <input type="hidden" name="id" value={member.id} />
              <label className="grid gap-1 text-sm font-bold text-ink/65">表示名<input className={inputClass} name="displayName" defaultValue={member.name} required /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm font-bold text-ink/65">負担割合<input className={inputClass} name="shareRatio" type="number" inputMode="numeric" min={0} max={100} defaultValue={Math.round(member.shareRatio * 100)} /></label>
                <label className="grid gap-1 text-sm font-bold text-ink/65">role<select className={inputClass} name="role" defaultValue={member.role}><option value="owner">owner</option><option value="member">member</option></select></label>
              </div>
              <FormSubmitButton idleLabel="メンバーを保存" pendingLabel="保存中..." />
            </form>
          ))}
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">家計コード</summary>
        <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-sm font-bold text-ink/70">このコードをパートナーに共有すると、同じ家計に参加できます。招待メールは送信しません。</p>
        <div className="mt-3"><InviteCodeCard code={data.settings.inviteCode} /></div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">CSV出力・バックアップ</summary>
        <div className="mt-3"><DataExportTools data={data} /></div>
        <p className="mt-3 rounded-2xl bg-cream/60 p-3 text-xs font-bold text-ink/55">JSONは手元バックアップ用の書き出しです。インポートは安全な復元チェックを追加してから有効化します。</p>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">カテゴリ設定</summary>
        <div className="mt-3">
          {searchParams?.categoryError ? <p className="mb-3 rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.categoryError}</p> : null}
          <CategoryManager initialCategories={data.categories} householdGroupId={data.householdGroupId} />
        </div>
      </details>

      <details className="rounded-[22px] bg-white p-4 shadow-sm">
        <summary className="min-h-11 cursor-pointer list-none py-2 text-base font-black text-ink">通知設定</summary>
        <div className="mt-3 grid gap-2">
          {["食費80%超え", "カテゴリ予算超過", "今月ペース超過", "固定費見直し通知"].map((label) => (
            <div key={label} className="rounded-2xl bg-cream/60 px-3 py-3 text-sm font-bold text-ink">{label}</div>
          ))}
        </div>
      </details>
    </div>
  );
}
