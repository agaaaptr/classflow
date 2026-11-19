"use server";
import "server-only";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const createClassSchema = z.object({
  name: z.string().trim().min(1, "Nama kelas wajib diisi"),
  // Non-empty only: Postgres accepts the seeded all-zero UUIDs, but zod's
  // strict RFC 4122 `uuid()` regex rejects them. The DB uuid type + 22P02 are
  // the real validator.
  tutorId: z.string().min(1, "Pilih tutor terlebih dahulu."),
  studentRate: z.number().int().positive("Student rate harus positif"),
  tutorRate: z.number().int().positive("Tutor rate harus positif"),
  capacity: z.number().int().positive("Kapasitas harus positif"),
  packageHours: z.number().int().positive("Paket jam harus positif"),
});

export type ClassActionState = { ok: boolean; error: string | null };

export async function createClass(input: {
  name: string;
  tutorId: string;
  studentRate: number;
  tutorRate: number;
  capacity: number;
  packageHours: number;
}): Promise<ClassActionState> {
  await requireRole("admin");

  const parsed = createClassSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_class", {
    p_name: parsed.data.name,
    p_tutor_id: parsed.data.tutorId,
    p_student_rate_rp: parsed.data.studentRate,
    p_tutor_rate_rp: parsed.data.tutorRate,
    p_capacity: parsed.data.capacity,
    p_package_minutes: parsed.data.packageHours * 60,
  });
  if (error) {
    if (error.code === "22P02") return { ok: false, error: "Pilih tutor terlebih dahulu." };
    return { ok: false, error: error.message || "Gagal membuat kelas." };
  }

  revalidatePath("/admin/classes");
  revalidatePath("/admin");
  redirect("/admin/classes");
}
