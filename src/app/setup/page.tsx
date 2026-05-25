import Link from "next/link";
import { redirect } from "next/navigation";
import { joinInvitation, setupHousehold } from "@/app/actions";
import { getCurrentSession } from "@/lib/auth";

export default async function SetupPage({ searchParams }: { searchParams?: { error?: string; joinError?: string } }) {
  const { user, membership } = await getCurrentSession();
  if (membership) redirect("/");

  const canUseSetup = Boolean(user);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md content-center gap-5 bg-cream px-5 py-10">
      <section>
        <p className="text-sm font-black text-leaf">初回セットアップ</p>
        <h1 className="mt-2 text-3xl font-black text-ink">共有する家計を選ぶ</h1>
        <p className="mt-2 text-sm leading-6 text-ink/60">新しく作るか、パートナーから聞いた家計コードで参加します。</p>
      </section>

      {!canUseSetup ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-warn">
          ログイン状態を確認できませんでした。もう一度ログインしてください。
          <Link className="mt-2 block text-leaf" href="/login">
            ログインへ戻る
          </Link>
        </div>
      ) : null}

      <form action={setupHousehold} className="grid gap-3 rounded-[22px] bg-white p-5 shadow-soft">
        <div>
          <h2 className="text-lg font-black text-ink">1. 新しく家計グループを作る</h2>
          <p className="mt-1 text-sm text-ink/60">作成後、設定画面にパートナー共有用の家計コードが表示されます。</p>
        </div>
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="groupName" placeholder="家計グループ名" defaultValue="わが家の家計" required disabled={!canUseSetup} />
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="displayName" placeholder="自分の表示名" required disabled={!canUseSetup} />
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="shareRatio" type="number" inputMode="numeric" min="0" max="100" defaultValue="50" placeholder="自分の負担割合%" disabled={!canUseSetup} />
        <input type="hidden" name="burdenRule" value="custom" />
        {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
        <button className="min-h-14 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white transition active:scale-[0.98] disabled:bg-ink/20" type="submit" disabled={!canUseSetup}>
          家計を作成
        </button>
      </form>

      <form action={joinInvitation} className="grid gap-3 rounded-[22px] bg-white p-5 shadow-soft">
        <div>
          <h2 className="text-lg font-black text-ink">2. 家計コードで参加する</h2>
          <p className="mt-1 text-sm text-ink/60">パートナーの設定画面に表示されているコードを入力します。</p>
        </div>
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base uppercase outline-none focus:border-leaf" name="code" placeholder="XXXX-XXXX" required disabled={!canUseSetup} />
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="displayName" placeholder="自分の表示名" required disabled={!canUseSetup} />
        {searchParams?.joinError ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.joinError}</p> : null}
        <button className="min-h-14 rounded-2xl border border-leaf bg-white px-4 py-3 text-base font-black text-leaf transition active:scale-[0.98] disabled:border-ink/20 disabled:text-ink/30" type="submit" disabled={!canUseSetup}>
          参加する
        </button>
      </form>
    </main>
  );
}
