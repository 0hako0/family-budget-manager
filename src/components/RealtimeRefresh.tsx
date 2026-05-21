"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const tables = ["incomes", "expenses", "fixed_costs", "savings", "loans", "categories", "monthly_summaries"];

export function RealtimeRefresh({ householdGroupId }: { householdGroupId?: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!householdGroupId) return;

    const supabase = createClient();
    const channel = supabase.channel(`household-${householdGroupId}`);
    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `household_group_id=eq.${householdGroupId}` },
        () => router.refresh()
      );
    });
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [householdGroupId, router]);

  return null;
}
