"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

const refreshEventName = "family-budget-refreshed";

export function ManualRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      className="min-h-10 rounded-full bg-white px-3 py-2 text-xs font-black text-leaf shadow-sm transition active:scale-[0.98] disabled:opacity-50"
      type="button"
      disabled={isPending}
      aria-busy={isPending}
      onClick={() => {
        window.localStorage.setItem("family-budget:last-refresh", new Date().toISOString());
        window.dispatchEvent(new CustomEvent(refreshEventName));
        startTransition(() => router.refresh());
      }}
    >
      {isPending ? "更新中..." : "↻ 更新"}
    </button>
  );
}
