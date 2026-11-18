import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types";

export type Role = Database["public"]["Enums"]["app_role"];

export async function getCurrentRole(): Promise<Role | null> {
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
}

export async function requireRole(role: Role): Promise<void> {
  const current = await getCurrentRole();
  if (current !== role) redirect("/login");
}
