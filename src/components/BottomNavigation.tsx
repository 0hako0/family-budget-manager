"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/expenses", label: "入力" },
  { href: "/fixed-costs", label: "固定費" },
  { href: "/reports", label: "レポート" },
  { href: "/settings", label: "設定" }
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeHref, setActiveHref] = useState(pathname || "/");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActiveHref(pathname || "/");
  }, [pathname]);

  useEffect(() => {
    navItems.forEach((item) => router.prefetch(item.href));
  }, [router]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-emerald-900/10 bg-white/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(34,49,47,0.10)] backdrop-blur"
      aria-label="下部タブ"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => {
          const isActive = activeHref === item.href || (item.href !== "/" && activeHref.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onClick={() => {
                setActiveHref(item.href);
                startTransition(() => router.prefetch(item.href));
              }}
              className={
                isActive
                  ? "flex min-h-14 flex-col items-center justify-center rounded-2xl bg-emerald-50 px-2 py-1 text-xs font-black text-leaf transition active:scale-[0.98]"
                  : "flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-1 text-xs font-black text-ink/60 transition active:scale-[0.98] hover:bg-emerald-50 hover:text-leaf"
              }
            >
              <span className={isActive || isPending ? "mb-1 h-1.5 w-1.5 rounded-full bg-leaf" : "mb-1 h-1.5 w-1.5 rounded-full bg-leaf/35"} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
