import Link from "next/link";
import { redirect } from "next/navigation";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { signOut } from "@/app/actions";
import { getCurrentSession } from "@/lib/auth";

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/expenses", label: "入力" },
  { href: "/fixed-costs", label: "固定費" },
  { href: "/reports", label: "レポート" },
  { href: "/settings", label: "設定" }
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const { user, membership, group } = await getCurrentSession();

  if (!user) redirect("/login");
  if (!membership) redirect("/setup");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-[calc(10px+env(safe-area-inset-top))] sm:px-6">
      <RealtimeRefresh householdGroupId={String(membership.household_group_id)} />
      <header className="sticky top-0 z-40 -mx-4 bg-cream/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex min-h-10 items-center justify-between gap-3">
          <Link href="/" className="min-w-0 text-base font-black tracking-normal text-ink">
            <span className="block truncate">{group?.name ?? "Family Budget"}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/expenses" className="min-h-10 rounded-full bg-leaf px-4 py-2 text-sm font-black text-white shadow-sm">
              入力
            </Link>
            <form action={signOut}>
              <button className="min-h-10 rounded-full bg-white px-3 py-2 text-xs font-black text-ink/65 shadow-sm" type="submit">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 py-4">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-900/10 bg-white/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(34,49,47,0.10)] backdrop-blur"
        aria-label="下部タブ"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-1 text-xs font-black text-ink/65 transition hover:bg-emerald-50 hover:text-leaf"
            >
              <span className="mb-1 h-1.5 w-1.5 rounded-full bg-leaf/45" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
