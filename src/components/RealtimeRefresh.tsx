"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const tables = ["expenses", "incomes", "fixed_costs", "loans", "savings", "shared_wallet_transactions", "saving_goals"];
const refreshEventName = "family-budget-refreshed";

export function RealtimeRefresh({ householdGroupId }: { householdGroupId?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!householdGroupId) return;

    const supabase = createClient();
    const channel = supabase.channel(`household-${householdGroupId}`);
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    function refreshWithDebounce() {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        window.localStorage.setItem("family-budget:last-refresh", new Date().toISOString());
        window.dispatchEvent(new CustomEvent(refreshEventName));
        router.refresh();
      }, 700);
    }

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `household_group_id=eq.${householdGroupId}` },
        refreshWithDebounce
      );
    });
    channel.subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [householdGroupId, router]);

  return null;
}
