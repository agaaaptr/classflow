import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types";

export type Role = Database["public"]["Enums"]["app_role"];

// cache() dedupes the profiles lookup within a single request, so repeated
// requireRole()/getCurrentRole() calls hit the DB once.
export const getCurrentRole = cache(async (): Promise<Role | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return (data?.role as Role) ?? null;
});

export async function requireRole(role: Role): Promise<void> {
  const current = await getCurrentRole();
  if (current !== role) redirect("/login");
}
