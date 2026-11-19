import { createClient } from "@/lib/supabase/server";
import CreateClassForm from "@/components/forms/CreateClassForm";
import { formatRupiah, formatMinutes } from "@/lib/utils";

export default async function AdminClassesPage() {
  const supabase = await createClient();

  const [classesR, ratesR, profilesR, enrollmentsR] = await Promise.all([
    supabase.from("classes").select("id, name, tutor_id, capacity, package_minutes"),
    supabase.from("class_rates").select("class_id, student_rate_rp, tutor_rate_rp"),
    supabase.from("profiles").select("id, full_name, role"),
    supabase.from("enrollments").select("class_id, status"),
  ]);

  const classes = classesR.data ?? [];
  const rates = new Map((ratesR.data ?? []).map((r) => [r.class_id, r]));
  const nameById = new Map((profilesR.data ?? []).map((p) => [p.id, p.full_name]));
  const tutors = (profilesR.data ?? []).filter((p) => p.role === "tutor");
  const enrollments = enrollmentsR.data ?? [];

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-section">
      <header>
        <h1 className="text-fluid-lg font-semibold">Kelas</h1>
        <p className="mt-1 text-sm text-muted">Buat kelas dan atur rate, kapasitas, serta paket jam.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className={card} aria-labelledby="class-list-heading">
          <h2 id="class-list-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
            Daftar kelas
          </h2>
          <div className="divide-y divide-cloud">
            {classes.map((c) => {
              const rate = rates.get(c.id);
              const active = enrollments.filter((e) => e.class_id === c.id && e.status === "active").length;
              return (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted">
                      {active}/{c.capacity} siswa
                    </div>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-muted">Tutor</dt>
                      <dd>{nameById.get(c.tutor_id) ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Paket</dt>
                      <dd>{formatMinutes(c.package_minutes)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Student rate</dt>
                      <dd>{rate ? `${formatRupiah(rate.student_rate_rp)}/jam` : "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Tutor rate</dt>
                      <dd>{rate ? `${formatRupiah(rate.tutor_rate_rp)}/jam` : "-"}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
            {classes.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted">Belum ada kelas.</p>
            )}
          </div>
        </section>

        <CreateClassForm tutors={tutors.map((t) => ({ id: t.id, full_name: t.full_name }))} />
      </div>
    </div>
  );
}
