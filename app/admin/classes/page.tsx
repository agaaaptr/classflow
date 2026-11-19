import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/ui/EmptyState";
import { formatRupiah, formatMinutes } from "@/lib/utils";

export default async function AdminClassesPage() {
  const supabase = await createClient();

  const [classesR, ratesR, profilesR, enrollmentsR] = await Promise.all([
    supabase.from("classes").select("id, name, tutor_id, capacity, package_minutes"),
    supabase.from("class_rates").select("class_id, student_rate_rp, tutor_rate_rp"),
    supabase.from("profiles").select("id, full_name"),
    supabase.from("enrollments").select("class_id, status"),
  ]);

  const classes = classesR.data ?? [];
  const rates = new Map((ratesR.data ?? []).map((r) => [r.class_id, r]));
  const nameById = new Map((profilesR.data ?? []).map((p) => [p.id, p.full_name]));
  const enrollments = enrollmentsR.data ?? [];

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-section">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Kelas</h1>
          <p className="mt-1 text-sm text-muted">Atur rate, kapasitas, dan paket jam.</p>
        </div>
        <Link
          href="/admin/classes/new"
          className="inline-flex h-11 items-center rounded-card bg-navy px-4 text-sm font-semibold text-white"
        >
          Buat kelas
        </Link>
      </header>

      <section className={card} aria-labelledby="classes-heading">
        <h2 id="classes-heading" className="border-b border-cloud px-5 py-3 text-base font-semibold">
          Daftar kelas
        </h2>
        <div className="divide-y divide-cloud/70">
          {classes.map((c) => {
            const rate = rates.get(c.id);
            const active = enrollments.filter((e) => e.class_id === c.id && e.status === "active").length;
            return (
              <div key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-muted">{active}/{c.capacity} siswa</div>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                  <div><dt className="text-muted">Tutor</dt><dd>{nameById.get(c.tutor_id) ?? "-"}</dd></div>
                  <div><dt className="text-muted">Paket</dt><dd>{formatMinutes(c.package_minutes)}</dd></div>
                  <div><dt className="text-muted">Student rate</dt><dd>{rate ? `${formatRupiah(rate.student_rate_rp)}/jam` : "-"}</dd></div>
                  <div><dt className="text-muted">Tutor rate</dt><dd>{rate ? `${formatRupiah(rate.tutor_rate_rp)}/jam` : "-"}</dd></div>
                </dl>
              </div>
            );
          })}
          {classes.length === 0 && (
            <EmptyState
              title="Belum ada kelas"
              description="Buat kelas pertama Anda untuk mulai."
              action={
                <Link href="/admin/classes/new" className="rounded-card bg-navy px-4 py-2 text-sm font-semibold text-white">
                  Buat kelas
                </Link>
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
