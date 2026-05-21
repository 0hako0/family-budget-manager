import Link from "next/link";
import { signUp } from "@/app/actions";

export default function SignupPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md content-center gap-6 bg-cream px-5 py-10">
      <section>
        <p className="text-sm font-black text-leaf">Family Budget Manager</p>
        <h1 className="mt-2 text-3xl font-black text-ink">新規登録</h1>
        <p className="mt-2 text-sm leading-6 text-ink/60">メールとパスワードでアカウントを作成します。</p>
      </section>
      <form action={signUp} className="grid gap-3 rounded-[22px] bg-white p-5 shadow-soft">
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="displayName" placeholder="表示名" required />
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="email" type="email" placeholder="メールアドレス" required />
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="password" type="password" placeholder="パスワード" required />
        {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
        <button className="min-h-14 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white" type="submit">
          登録して始める
        </button>
      </form>
      <Link className="text-center text-sm font-bold text-leaf" href="/login">
        ログインに戻る
      </Link>
    </main>
  );
}
