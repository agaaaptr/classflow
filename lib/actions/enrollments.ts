"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = { ok: boolean; error: string | null };

export async function enrollStudent(classId: string): Promise<ActionResult> {
  await requireRole("student");

  const supabase = await createClient();
  const { error } = await supabase.rpc("enroll_student", { p_class_id: classId });
  if (error) {
    const msg =
      error.code === "23505"
        ? "Anda sudah terdaftar di kelas ini."
        : error.code === "P0001"
          ? "Kelas sudah penuh."
          : "Gagal mendaftar.";
    return { ok: false, error: msg };
  }

  revalidatePath("/student");
  return { ok: true, error: null };
}
