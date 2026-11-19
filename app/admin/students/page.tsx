import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatMinutes, hoursLeft } from "@/lib/utils";

export default async function AdminStudentsPage() {
  const supabase = await createClient();

  const [enrollmentsR, invoicesR, lessonsR, classesR, profilesR] = await Promise.all([
    supabase.from("enrollments").select("id, class_id, student_id, package_minutes, status"),
    supabase.from("invoices").select("id, enrollment_id, amount_rp, status, paid_at"),
    supabase.from("lessons").select("class_id, starts_at, ends_at"),
    supabase.from("classes").select("id, name"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const enrollments = enrollmentsR.data ?? [];
  const invoiceByEnrollment = new Map((invoicesR.data ?? []).map((i) => [i.enrollment_id, i]));
  const classById = new Map((classesR.data ?? []).map((c) => [c.id, c]));
  const nameById = new Map((profilesR.data ?? []).map((p) => [p.id, p.full_name]));
  const lessonsByClass = new Map<string, { starts_at: string; ends_at: string }[]>();
  for (const l of lessonsR.data ?? []) {
    const list = lessonsByClass.get(l.class_id) ?? [];
    list.push(l);
    lessonsByClass.set(l.class_id, list);
  }

  const rows = enrollments
    .filter((e) => e.status === "active")
    .map((e) => {
      const inv = invoiceByEnrollment.get(e.id);
      const paid = inv?.status === "paid";
      const left = paid
        ? hoursLeft(e.package_minutes, lessonsByClass.get(e.class_id) ?? [], inv!.paid_at)
        : null;
      return { enrollment: e, paid, left };
    })
    .sort((a, b) => (a.left ?? 0) - (b.left ?? 0));

  return (
    <div className="space-y-section">
      <header>
        <h1 className="text-2xl font-semibold">Siswa</h1>
        <p className="mt-1 text-sm text-muted">Sisa jam per siswa, diurutkan dari yang paling sedikit.</p>
      </header>

      <section className="rounded-card border border-cloud bg-white" aria-labelledby="students-heading">
        <h2 id="students-heading" className="border-b border-cloud px-5 py-3 text-base font-semibold">
          Sisa jam siswa
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cloud text-left">
                <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Siswa</th>
                <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Kelas</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Paket</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ enrollment, paid, left }) => (
                <tr key={enrollment.id} className="border-b border-cloud/70 last:border-0">
                  <td className="px-5 py-2.5 font-medium">{nameById.get(enrollment.student_id) ?? "-"}</td>
                  <td className="px-5 py-2.5">{classById.get(enrollment.class_id)?.name ?? "-"}</td>
                  <td className="px-5 py-2.5 text-right">{formatMinutes(enrollment.package_minutes)}</td>
                  <td className="px-5 py-2.5 text-right"><Badge status={paid ? "paid" : "unpaid"} /></td>
                  <td className={`px-5 py-2.5 text-right font-semibold ${paid && left !== null && left < 60 ? "text-danger-ink" : "text-navy"}`}>
                    {paid && left !== null ? formatMinutes(left) : "-"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-4"><EmptyState title="Belum ada siswa" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
