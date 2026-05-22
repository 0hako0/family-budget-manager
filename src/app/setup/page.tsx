import Link from "next/link";
import { redirect } from "next/navigation";
import { setupHousehold } from "@/app/actions";
import { getCurrentSession } from "@/lib/auth";

export default async function SetupPage({ searchParams }: { searchParams?: { error?: string } }) {
  const { user, membership } = await getCurrentSession();
  if (membership) redirect("/");

  const canCreate = Boolean(user);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md content-center gap-6 bg-cream px-5 py-10">
      <section>
        <p className="text-sm font-black text-leaf">初回セットアップ</p>
        <h1 className="mt-2 text-3xl font-black text-ink">家計グループを作成</h1>
        <p className="mt-2 text-sm leading-6 text-ink/60">ログイン中のSupabase Authセッションを確認してから、共有する家計を作成します。</p>
      </section>
      <form action={setupHousehold} className="grid gap-3 rounded-[22px] bg-white p-5 shadow-soft">
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="groupName" placeholder="家計グループ名" defaultValue="わが家の家計" required disabled={!canCreate} />
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="displayName" placeholder="自分の名前" required disabled={!canCreate} />
        <select className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="burdenRule" defaultValue="fifty_fifty" disabled={!canCreate}>
          <option value="fifty_fifty">50:50</option>
          <option value="custom">任意割合</option>
          <option value="income_ratio">収入比率</option>
        </select>
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="shareRatio" type="number" inputMode="numeric" min="0" max="100" defaultValue="50" placeholder="自分の負担割合 %" disabled={!canCreate} />
        {!canCreate ? (
          <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">
            ログイン状態を確認できませんでした。もう一度ログインしてください。
            <Link className="mt-2 block text-leaf" href="/login">ログインへ戻る</Link>
          </div>
        ) : null}
        {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
        <button className="min-h-14 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white disabled:bg-ink/20" type="submit" disabled={!canCreate}>
          家計を作成
        </button>
      </form>
    </main>
  );
}
