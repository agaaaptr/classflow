"use server";
import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./enrollments";

export async function scheduleLesson(
  classId: string,
  startsAt: string,
  endsAt: string,
): Promise<ActionResult> {
  await requireRole("tutor");

  const supabase = await createClient();
  const { error } = await supabase.rpc("schedule_lesson", {
    p_class_id: classId,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
  });
  if (error) {
    const msg =
      error.code === "23P01"
        ? "Waktu bentrok dengan lesson lain."
        : error.code === "22007"
          ? "Waktu selesai harus setelah waktu mulai."
          : "Gagal menjadwalkan lesson.";
    return { ok: false, error: msg };
  }

  revalidatePath("/tutor/schedule");
  return { ok: true, error: null };
}
