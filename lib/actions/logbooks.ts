"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./enrollments";

export async function ensureLogbook(
  classId: string,
  period: string,
): Promise<{ ok: boolean; error: string | null; id?: string }> {
  await requireRole("tutor");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("logbooks")
    .insert({ class_id: classId, period, status: "draft" })
    .select("id")
    .single();

  if (!error) return { ok: true, error: null, id: data.id };

  if (error.code === "23505") {
    const { data: existing } = await supabase
      .from("logbooks")
      .select("id")
      .eq("class_id", classId)
      .eq("period", period)
      .single();
    return { ok: true, error: null, id: existing?.id };
  }
  return { ok: false, error: "Gagal membuat logbook." };
}

export async function addLogbookEntry(input: {
  logbookId: string;
  lessonId: string;
  topic: string;
  activities: string;
  observation: string;
  recommendation: string;
}): Promise<ActionResult> {
  await requireRole("tutor");

  const supabase = await createClient();
  const { error } = await supabase.from("logbook_entries").insert({
    logbook_id: input.logbookId,
    lesson_id: input.lessonId,
    topic: input.topic,
    activities: input.activities,
    observation: input.observation,
    recommendation: input.recommendation,
  });
  if (error) {
    const msg =
      error.code === "23505"
        ? "Lesson ini sudah punya entry."
        : error.code === "P0001"
          ? "Lesson belum berakhir atau bukan milik kelas ini."
          : "Gagal menyimpan entry.";
    return { ok: false, error: msg };
  }

  revalidatePath(`/tutor/logbooks/${input.logbookId}`);
  return { ok: true, error: null };
}

export async function submitLogbook(logbookId: string): Promise<ActionResult> {
  await requireRole("tutor");

  const supabase = await createClient();
  const { error } = await supabase
    .from("logbooks")
    .update({ status: "submitted" })
    .eq("id", logbookId);
  if (error) {
    const msg =
      error.code === "P0001" && error.message.includes("without an entry")
        ? "Masih ada lesson yang belum diisi entry-nya."
        : "Logbook tidak bisa disubmit.";
    return { ok: false, error: msg };
  }

  revalidatePath(`/tutor/logbooks/${logbookId}`);
  revalidatePath("/tutor");
  return { ok: true, error: null };
}

export async function approveLogbook(
  logbookId: string,
): Promise<{ ok: boolean; error: string | null; total?: number }> {
  await requireRole("admin");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_logbook", {
    p_logbook_id: logbookId,
  });
  if (error) return { ok: false, error: "Gagal approve logbook." };

  revalidatePath(`/admin/logbooks/${logbookId}`);
  revalidatePath("/admin");
  return { ok: true, error: null, total: data };
}
