"use client";

import { useEffect } from "react";
import { ensurePreviousMonthSnapshot } from "@/app/actions";

export function MonthlySnapshotRunner({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const key = `monthly-snapshot-${new Date().toISOString().slice(0, 7)}`;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "done");
    void ensurePreviousMonthSnapshot();
  }, [enabled]);

  return null;
}
