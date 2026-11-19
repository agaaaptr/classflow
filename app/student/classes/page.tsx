import { createClient } from "@/lib/supabase/server";
import BackLink from "@/components/BackLink";
import ActionButton from "@/components/ActionButton";
import EmptyState from "@/components/ui/EmptyState";
import { enrollStudent } from "@/lib/actions/enrollments";
import { formatMinutes } from "@/lib/utils";

export default async function StudentClassesPage() {
  const supabase = await createClient();
  const [classesR, enrollmentsR] = await Promise.all([
    supabase.from("classes").select("id, name, capacity, package_minutes"),
    supabase.from("enrollments").select("class_id, status"),
  ]);
  const classes = classesR.data ?? [];
  const enrollments = enrollmentsR.data ?? [];
  const enrolledClassIds = new Set(
    enrollments.filter((e) => e.status === "active").map((e) => e.class_id),
  );
  const available = classes.filter((c) => !enrolledClassIds.has(c.id));

  return (
    <div className="space-y-section">
      <BackLink href="/student" label="Dashboard" />
      <header>
        <h1 className="text-2xl font-semibold">Kelas tersedia</h1>
        <p className="mt-1 text-sm text-muted">Daftar untuk menerima invoice, lalu bayar untuk membuka akses.</p>
      </header>

      <section className="rounded-card border border-cloud bg-white" aria-labelledby="available-heading">
        <h2 id="available-heading" className="border-b border-cloud px-5 py-3 text-base font-semibold">
          Semua kelas
        </h2>
        <div className="divide-y divide-cloud/70">
          {available.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted">
                  Paket {formatMinutes(c.package_minutes)} · Kapasitas {c.capacity}
                </div>
              </div>
              <ActionButton
                action={enrollStudent}
                args={[c.id]}
                confirmText="Daftar di kelas ini? Anda akan menerima invoice."
                successMessage="Berhasil mendaftar"
              >
                Daftar
              </ActionButton>
            </div>
          ))}
          {available.length === 0 && <EmptyState title="Tidak ada kelas lain" />}
        </div>
      </section>
    </div>
  );
}
