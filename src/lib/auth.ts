import { createServerSupabaseClient } from "./supabase/server";
import { cache } from "react";

export const getCurrentSession = cache(async () => {
  const supabase = createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, membership: null, group: null };
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const groupId = membership?.household_group_id as string | undefined;
  const { data: group } = groupId
    ? await supabase.from("household_groups").select("*").eq("id", groupId).maybeSingle()
    : { data: null };

  return { supabase, user, membership, group };
});
