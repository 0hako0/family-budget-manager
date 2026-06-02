import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ManualRefreshButton } from "@/components/ManualRefreshButton";
import { PullToRefresh } from "@/components/PullToRefresh";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { signOut } from "@/app/actions";
import { getCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const { user, membership, group } = await getCurrentSession();

  if (!user) redirect("/login");
  if (!membership) redirect("/setup");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-[calc(10px+env(safe-area-inset-top))] sm:px-6">
      <RealtimeRefresh householdGroupId={String(membership.household_group_id)} />
      <PullToRefresh />
      <header className="sticky top-0 z-40 -mx-4 bg-cream/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex min-h-10 items-center justify-between gap-3">
          <Link href="/" prefetch className="min-w-0 text-base font-black tracking-normal text-ink transition active:scale-[0.98]">
            <span className="block truncate">{group?.name ?? "KakeiCanvas"}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <ManualRefreshButton />
            <Link href="/expenses" prefetch className="min-h-10 rounded-full bg-leaf px-4 py-2 text-sm font-black text-white shadow-sm transition active:scale-[0.98]">
              入力
            </Link>
            <form action={signOut}>
              <button className="min-h-10 rounded-full bg-white px-3 py-2 text-xs font-black text-ink/65 shadow-sm transition active:scale-[0.98]" type="submit">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 py-4">{children}</main>
      <BottomNavigation />
    </div>
  );
}
