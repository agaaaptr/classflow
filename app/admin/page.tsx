import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import ActionButton from "@/components/ActionButton";
import { cancelInvoice } from "@/lib/actions/invoices";
import { formatRupiah, formatMinutes, hoursLeft } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [classesR, enrollmentsR, invoicesR, earningsR, lessonsR, logbooksR, profilesR] =
    await Promise.all([
      supabase.from("classes").select("id, name, tutor_id, capacity, package_minutes"),
      supabase.from("enrollments").select("id, class_id, student_id, package_minutes, amount_rp, status"),
      supabase.from("invoices").select("id, enrollment_id, student_id, amount_rp, status, paid_at"),
      supabase.from("tutor_earnings").select("class_id, amount_rp, minutes"),
      supabase.from("lessons").select("class_id, starts_at, ends_at"),
      supabase.from("logbooks").select("id, class_id, period, status"),
      supabase.from("profiles").select("id, full_name"),
    ]);

  const classes = classesR.data ?? [];
  const enrollments = enrollmentsR.data ?? [];
  const invoices = invoicesR.data ?? [];
  const earnings = earningsR.data ?? [];
  const lessons = lessonsR.data ?? [];
  const logbooks = logbooksR.data ?? [];
  const profiles = profilesR.data ?? [];

  const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));
  const classById = new Map(classes.map((c) => [c.id, c]));
  const enrollmentById = new Map(enrollments.map((e) => [e.id, e]));
  const invoiceByEnrollment = new Map(invoices.map((i) => [i.enrollment_id, i]));
  const lessonsByClass = new Map<string, { starts_at: string; ends_at: string }[]>();
  for (const l of lessons) {
    const list = lessonsByClass.get(l.class_id) ?? [];
    list.push(l);
    lessonsByClass.set(l.class_id, list);
  }

  const revenueByClass = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.status !== "paid") continue;
    const enr = enrollmentById.get(inv.enrollment_id);
    if (!enr || enr.status !== "active") continue;
    revenueByClass.set(enr.class_id, (revenueByClass.get(enr.class_id) ?? 0) + inv.amount_rp);
  }

  const costByClass = new Map<string, number>();
  const taughtByClass = new Map<string, number>();
  for (const e of earnings) {
    costByClass.set(e.class_id, (costByClass.get(e.class_id) ?? 0) + e.amount_rp);
    taughtByClass.set(e.class_id, (taughtByClass.get(e.class_id) ?? 0) + e.minutes);
  }

  const unpaid = invoices.filter((i) => i.status === "unpaid");

  const studentBalances = enrollments
    .filter((e) => e.status === "active")
    .flatMap((e) => {
      const inv = invoiceByEnrollment.get(e.id);
      if (!inv || inv.status !== "paid") return [];
      const left = hoursLeft(
        e.package_minutes,
        lessonsByClass.get(e.class_id) ?? [],
        inv.paid_at,
      );
      return [{ enrollment: e, left }];
    });

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Margin per kelas, invoice belum dibayar, sisa jam siswa, dan status logbook.
        </p>
      </header>

      {/* A — Margin per kelas */}
      <section className={card} aria-labelledby="margin-heading">
        <h2 id="margin-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Margin per kelas
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cloud text-left text-muted">
                <th className="px-5 py-2 font-medium">Kelas</th>
                <th className="px-5 py-2 font-medium">Tutor</th>
                <th className="px-5 py-2 font-medium">Pendapatan</th>
                <th className="px-5 py-2 font-medium">Biaya tutor</th>
                <th className="px-5 py-2 font-medium">Jam diajar</th>
                <th className="px-5 py-2 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const revenue = revenueByClass.get(c.id) ?? 0;
                const cost = costByClass.get(c.id) ?? 0;
                const taught = taughtByClass.get(c.id) ?? 0;
                const margin = revenue - cost;
                return (
                  <tr key={c.id} className="border-b border-cloud last:border-0">
                    <td className="px-5 py-2 font-medium">{c.name}</td>
                    <td className="px-5 py-2">{nameById.get(c.tutor_id) ?? "-"}</td>
                    <td className="px-5 py-2">{formatRupiah(revenue)}</td>
                    <td className="px-5 py-2">{formatRupiah(cost)}</td>
                    <td className="px-5 py-2">{taught > 0 ? formatMinutes(taught) : "-"}</td>
                    <td className={`px-5 py-2 font-semibold ${margin < 0 ? "text-danger" : "text-success"}`}>
                      {formatRupiah(margin)}
                    </td>
                  </tr>
                );
              })}
              {classes.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-4 text-muted">Belum ada kelas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* B1 — Invoice belum bayar */}
      <section className={card} aria-labelledby="unpaid-heading">
        <h2 id="unpaid-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Invoice belum dibayar ({unpaid.length})
        </h2>
        <div className="divide-y divide-cloud">
          {unpaid.map((inv) => {
            const enr = enrollmentById.get(inv.enrollment_id);
            const cls = enr ? classById.get(enr.class_id) : null;
            return (
              <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <div className="font-medium">{nameById.get(inv.student_id) ?? "-"}</div>
                  <div className="text-sm text-muted">
                    {cls?.name ?? "-"} · {formatRupiah(inv.amount_rp)}
                  </div>
                </div>
                <ActionButton
                  action={cancelInvoice}
                  args={[inv.id]}
                  confirmText="Batalkan invoice ini? Kursinya akan dilepas."
                  className="rounded-card border border-danger px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
                >
                  Batalkan
                </ActionButton>
              </div>
            );
          })}
          {unpaid.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted">Semua invoice sudah dibayar.</p>
          )}
        </div>
      </section>

      {/* B2 — Sisa jam per siswa */}
      <section className={card} aria-labelledby="balance-heading">
        <h2 id="balance-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Sisa jam siswa
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cloud text-left text-muted">
                <th className="px-5 py-2 font-medium">Siswa</th>
                <th className="px-5 py-2 font-medium">Kelas</th>
                <th className="px-5 py-2 font-medium">Paket</th>
                <th className="px-5 py-2 font-medium">Terpakai</th>
                <th className="px-5 py-2 font-medium">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {studentBalances.map(({ enrollment, left }) => {
                const cls = classById.get(enrollment.class_id);
                return (
                  <tr key={enrollment.id} className="border-b border-cloud last:border-0">
                    <td className="px-5 py-2 font-medium">{nameById.get(enrollment.student_id) ?? "-"}</td>
                    <td className="px-5 py-2">{cls?.name ?? "-"}</td>
                    <td className="px-5 py-2">{formatMinutes(enrollment.package_minutes)}</td>
                    <td className="px-5 py-2">{formatMinutes(enrollment.package_minutes - left)}</td>
                    <td className="px-5 py-2 font-semibold">{formatMinutes(left)}</td>
                  </tr>
                );
              })}
              {studentBalances.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-4 text-muted">Belum ada siswa yang membayar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* B3 — Status logbook */}
      <section className={card} aria-labelledby="logbook-heading">
        <h2 id="logbook-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Status logbook
        </h2>
        <div className="divide-y divide-cloud">
          {logbooks.map((lb) => {
            const cls = classById.get(lb.class_id);
            return (
              <div key={lb.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{cls?.name ?? "-"}</div>
                    <div className="text-sm text-muted">Periode {lb.period}</div>
                  </div>
                  <Badge status={lb.status} />
                </div>
                {lb.status === "submitted" && (
                  <Link
                    href={`/admin/logbooks/${lb.id}`}
                    className="rounded-card bg-navy px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Tinjau &amp; setujui
                  </Link>
                )}
                {lb.status === "approved" && (
                  <Link href={`/admin/logbooks/${lb.id}`} className="text-sm font-medium text-navy underline">
                    Lihat
                  </Link>
                )}
              </div>
            );
          })}
          {logbooks.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted">Belum ada logbook.</p>
          )}
        </div>
      </section>
    </div>
  );
}
