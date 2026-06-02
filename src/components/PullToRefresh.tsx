"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const refreshEventName = "family-budget-refreshed";

export function PullToRefresh() {
  const router = useRouter();
  const startY = useRef(0);
  const dragging = useRef(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function touchStart(event: TouchEvent) {
      if (window.scrollY > 0) return;
      dragging.current = true;
      startY.current = event.touches[0]?.clientY ?? 0;
    }

    function touchMove(event: TouchEvent) {
      if (!dragging.current || window.scrollY > 0) return;
      const distance = Math.max(0, (event.touches[0]?.clientY ?? 0) - startY.current);
      setPullDistance(Math.min(96, distance));
    }

    function touchEnd() {
      if (!dragging.current) return;
      const shouldRefresh = pullDistance >= 72;
      dragging.current = false;
      setPullDistance(0);
      if (shouldRefresh) {
        window.localStorage.setItem("family-budget:last-refresh", new Date().toISOString());
        window.dispatchEvent(new CustomEvent(refreshEventName));
        startTransition(() => router.refresh());
      }
    }

    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: true });
    window.addEventListener("touchend", touchEnd);
    return () => {
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", touchEnd);
    };
  }, [pullDistance, router]);

  if (pullDistance === 0 && !isPending) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(8px+env(safe-area-inset-top))] z-50 mx-auto flex max-w-md justify-center">
      <div className="rounded-full bg-white px-4 py-2 text-xs font-black text-leaf shadow-soft">
        {isPending ? "更新中..." : pullDistance >= 72 ? "離して更新" : "下に引いて更新"}
      </div>
    </div>
  );
}
