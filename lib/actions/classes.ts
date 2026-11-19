"use server";
import "server-only";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const createClassSchema = z.object({
  name: z.string().trim().min(1, "Nama kelas wajib diisi"),
  tutorId: z.string().uuid(),
  studentRate: z.coerce.number().int().positive("Student rate harus positif"),
  tutorRate: z.coerce.number().int().positive("Tutor rate harus positif"),
  capacity: z.coerce.number().int().positive("Kapasitas harus positif"),
  packageHours: z.coerce.number().int().positive("Paket jam harus positif"),
});

export type ClassActionState = { ok: boolean; error: string | null };

export async function createClass(
  _prev: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  await requireRole("admin");

  const parsed = createClassSchema.safeParse({
    name: formData.get("name"),
    tutorId: formData.get("tutorId"),
    studentRate: formData.get("studentRate"),
    tutorRate: formData.get("tutorRate"),
    capacity: formData.get("capacity"),
    packageHours: formData.get("packageHours"),
  });
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
  if (error) return { ok: false, error: "Gagal membuat kelas." };

  revalidatePath("/admin/classes");
  revalidatePath("/admin");
  return { ok: true, error: null };
}
