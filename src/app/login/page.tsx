import Link from "next/link";
import { signIn } from "@/app/actions";
import { FormSubmitButton } from "@/components/FormSubmitButton";

export default async function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md content-center gap-6 bg-cream px-5 py-10">
      <section>
        <p className="text-sm font-black text-leaf">KakeiCanvas</p>
        <h1 className="mt-2 text-3xl font-black text-ink">ログイン</h1>
        <p className="mt-2 text-sm leading-6 text-ink/60">メールアドレスとパスワードでログインします。</p>
      </section>
      <form action={signIn} className="grid gap-3 rounded-[22px] bg-white p-5 shadow-soft">
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="email" type="email" placeholder="メールアドレス" required />
        <input className="min-h-14 rounded-2xl border border-emerald-900/10 bg-cream/70 px-4 text-base outline-none focus:border-leaf" name="password" type="password" placeholder="パスワード" required />
        {searchParams?.error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-warn">{searchParams.error}</p> : null}
        <FormSubmitButton idleLabel="ログイン" pendingLabel="ログイン中..." className="min-h-14 rounded-2xl bg-leaf px-4 py-3 text-base font-black text-white transition active:scale-[0.98] disabled:bg-ink/20" />
      </form>
      <Link className="text-center text-sm font-bold text-leaf" href="/signup">
        新規登録はこちら
      </Link>
    </main>
  );
}
