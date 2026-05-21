import Link from "next/link";
import { redirect } from "next/navigation";
import { joinInvitation } from "@/app/actions";
import { getCurrentSession } from "@/lib/auth";

export default async function JoinPage({ searchParams }: { searchParams?: { code?: string; error?: string } }) {
  const { user } = await getCurrentSession();
  if (!user) redirect(`/login?error=${encodeURIComponent("招待に参加するにはログインしてください")}`);

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md content-center gap-6 bg-cream px-5 py-10">
      <section>
        <p className="text-sm font-black text-leaf">招待参加</p>
        <h1 className="mt-2 text-3xl font-black text-ink">家計グループに参加</h1>
        <p className="mt-2 text-sm leading-6 text-ink/60">パートナーから共有された招待コードを入力します。</p>
      </section>
      <form action={joinInvitation} className="grid gap-3 rounded-[22px] bg-white p-5 shadow-soft">
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base uppercase outline-none focus:border-leaf" name="code" placeholder="招待コード" defaultValue={searchParams?.code ?? ""} required />
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="displayName" placeholder="自分の名前" required />
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="shareRatio" type="number" inputMode="numeric" min="0" max="100" defaultValue="50" placeholder="自分の負担割合 %" />
        {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
        <button className="min-h-14 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white" type="submit">
          参加する
        </button>
      </form>
      <Link className="text-center text-sm font-bold text-leaf" href="/">
        アプリに戻る
      </Link>
    </main>
  );
}
