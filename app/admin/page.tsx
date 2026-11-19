import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import ActionButton from "@/components/ActionButton";
import { cancelInvoice } from "@/lib/actions/invoices";
import { formatRupiah, formatMinutes, hoursLeft } from "@/lib/utils";

const sectionHeader =
  "flex items-baseline justify-between gap-3 border-b border-cloud px-5 py-3";
const sectionTitle = "text-xs font-semibold uppercase tracking-wider text-muted";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [classesR, enrollmentsR, invoicesR, earningsR, lessonsR, logbooksR, profilesR] =
    await Promise.all([
      supabase.from("classes").select("id, name, tutor_id, capacity, package_minutes"),
      supabase.from("enrollments").select("id, class_id, student_id, package_minutes, status"),
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
  const pendingLogbooks = logbooks.filter((lb) => lb.status === "submitted");

  const studentBalances = enrollments
    .filter((e) => e.status === "active")
    .flatMap((e) => {
      const inv = invoiceByEnrollment.get(e.id);
      if (!inv || inv.status !== "paid") return [];
      const left = hoursLeft(e.package_minutes, lessonsByClass.get(e.class_id) ?? [], inv.paid_at);
      return [{ enrollment: e, left }];
    });

  const totalMargin = classes.reduce(
    (sum, c) => sum + (revenueByClass.get(c.id) ?? 0) - (costByClass.get(c.id) ?? 0),
    0,
  );
  const unpaidTotal = unpaid.reduce((sum, i) => sum + i.amount_rp, 0);
  const lowBalance = studentBalances.filter((s) => s.left < 60).length;

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-section">
      <header>
        <h1 className="text-fluid-lg font-semibold">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-muted">
          Pantau margin, invoice, dan logbook yang perlu tindakan.
        </p>
      </header>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Margin total", value: formatRupiah(totalMargin), tone: totalMargin < 0 ? "text-danger" : "text-navy" },
          { label: "Belum dibayar", value: `${unpaid.length} · ${formatRupiah(unpaidTotal)}`, tone: "text-navy" },
          { label: "Logbook menunggu", value: String(pendingLogbooks.length), tone: "text-navy" },
          { label: "Siswa sisa < 1 jam", value: String(lowBalance), tone: lowBalance > 0 ? "text-danger" : "text-navy" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-card border border-cloud bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">{stat.label}</div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${stat.tone}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Action queue: unpaid invoices */}
      <section className={card} aria-labelledby="unpaid-heading">
        <div className={sectionHeader}>
          <h2 id="unpaid-heading" className={sectionTitle}>
            Invoice belum dibayar · {unpaid.length}
          </h2>
        </div>
        <div className="divide-y divide-cloud/70">
          {unpaid.map((inv) => {
            const enr = enrollmentById.get(inv.enrollment_id);
            const cls = enr ? classById.get(enr.class_id) : null;
            return (
              <div key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{nameById.get(inv.student_id) ?? "-"}</div>
                  <div className="truncate text-sm text-muted">
                    {cls?.name ?? "-"} · {formatRupiah(inv.amount_rp)}
                  </div>
                </div>
                <ActionButton
                  action={cancelInvoice}
                  args={[inv.id]}
                  confirmText="Batalkan invoice ini? Kursinya akan dilepas."
                  confirmTone="danger"
                  className="ml-auto shrink-0 rounded-card border border-danger px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
                >
                  Batalkan
                </ActionButton>
              </div>
            );
          })}
          {unpaid.length === 0 && (
            <p className="px-5 py-4 text-sm text-success">Semua invoice sudah dibayar.</p>
          )}
        </div>
      </section>

      {/* Action queue: logbooks awaiting approval */}
      <section className={card} aria-labelledby="logbook-heading">
        <div className={sectionHeader}>
          <h2 id="logbook-heading" className={sectionTitle}>
            Logbook · {pendingLogbooks.length} menunggu
          </h2>
        </div>
        <div className="divide-y divide-cloud/70">
          {logbooks.map((lb) => {
            const cls = classById.get(lb.class_id);
            return (
              <div key={lb.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{cls?.name ?? "-"}</div>
                  <div className="text-sm text-muted">Periode {lb.period}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge status={lb.status} />
                  {lb.status === "submitted" ? (
                    <Link
                      href={`/admin/logbooks/${lb.id}`}
                      className="rounded-card bg-navy px-3 py-1.5 text-sm font-medium text-white"
                    >
                      Tinjau &amp; setujui
                    </Link>
                  ) : (
                    <Link href={`/admin/logbooks/${lb.id}`} className="text-sm font-medium text-navy underline">
                      Lihat
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {logbooks.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted">Belum ada logbook.</p>
          )}
        </div>
      </section>

      {/* Report: margin per class */}
      <section className={card} aria-labelledby="margin-heading">
        <div className={sectionHeader}>
          <h2 id="margin-heading" className={sectionTitle}>Margin per kelas</h2>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b border-cloud text-left">
                <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Kelas</th>
                <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Tutor</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Pendapatan</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Biaya tutor</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Jam diajar</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Margin</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const revenue = revenueByClass.get(c.id) ?? 0;
                const cost = costByClass.get(c.id) ?? 0;
                const taught = taughtByClass.get(c.id) ?? 0;
                const margin = revenue - cost;
                return (
                  <tr key={c.id} className="border-b border-cloud/70 last:border-0">
                    <td className="px-5 py-2.5 font-medium">{c.name}</td>
                    <td className="px-5 py-2.5">{nameById.get(c.tutor_id) ?? "-"}</td>
                    <td className="px-5 py-2.5 text-right">{formatRupiah(revenue)}</td>
                    <td className="px-5 py-2.5 text-right">{formatRupiah(cost)}</td>
                    <td className="px-5 py-2.5 text-right">{taught > 0 ? formatMinutes(taught) : "-"}</td>
                    <td className={`px-5 py-2.5 text-right font-semibold ${margin < 0 ? "text-danger" : "text-navy"}`}>
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

        {/* Mobile cards */}
        <div className="divide-y divide-cloud/70 md:hidden">
          {classes.map((c) => {
            const revenue = revenueByClass.get(c.id) ?? 0;
            const cost = costByClass.get(c.id) ?? 0;
            const margin = revenue - cost;
            return (
              <div key={c.id} className="px-5 py-3">
                <div className="font-medium">{c.name}</div>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div><dt className="text-muted">Pendapatan</dt><dd className="tabular-nums">{formatRupiah(revenue)}</dd></div>
                  <div><dt className="text-muted">Biaya tutor</dt><dd className="tabular-nums">{formatRupiah(cost)}</dd></div>
                  <div><dt className="text-muted">Margin</dt><dd className={`font-semibold tabular-nums ${margin < 0 ? "text-danger" : "text-navy"}`}>{formatRupiah(margin)}</dd></div>
                  <div><dt className="text-muted">Tutor</dt><dd>{nameById.get(c.tutor_id) ?? "-"}</dd></div>
                </dl>
              </div>
            );
          })}
          {classes.length === 0 && <p className="px-5 py-4 text-sm text-muted">Belum ada kelas.</p>}
        </div>
      </section>

      {/* Report: hours left */}
      <section className={card} aria-labelledby="balance-heading">
        <div className={sectionHeader}>
          <h2 id="balance-heading" className={sectionTitle}>Sisa jam siswa</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b border-cloud text-left">
                <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Siswa</th>
                <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted">Kelas</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Paket</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Terpakai</th>
                <th className="px-5 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted">Sisa</th>
              </tr>
            </thead>
            <tbody>
              {studentBalances.map(({ enrollment, left }) => {
                const cls = classById.get(enrollment.class_id);
                return (
                  <tr key={enrollment.id} className="border-b border-cloud/70 last:border-0">
                    <td className="px-5 py-2.5 font-medium">{nameById.get(enrollment.student_id) ?? "-"}</td>
                    <td className="px-5 py-2.5">{cls?.name ?? "-"}</td>
                    <td className="px-5 py-2.5 text-right">{formatMinutes(enrollment.package_minutes)}</td>
                    <td className="px-5 py-2.5 text-right">{formatMinutes(enrollment.package_minutes - left)}</td>
                    <td className={`px-5 py-2.5 text-right font-semibold ${left < 60 ? "text-danger" : "text-navy"}`}>
                      {formatMinutes(left)}
                    </td>
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
    </div>
  );
}
