import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import ActionButton from "@/components/ActionButton";
import EmptyState from "@/components/ui/EmptyState";
import { cancelInvoice } from "@/lib/actions/invoices";
import { formatRupiah, hoursLeft } from "@/lib/utils";

const sectionTitle = "text-base font-semibold";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [classesR, enrollmentsR, invoicesR, earningsR, lessonsR, logbooksR, profilesR] =
    await Promise.all([
      supabase.from("classes").select("id, name, tutor_id"),
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
  for (const e of earnings) {
    costByClass.set(e.class_id, (costByClass.get(e.class_id) ?? 0) + e.amount_rp);
  }

  const unpaid = invoices.filter((i) => i.status === "unpaid");
  const pendingLogbooks = logbooks.filter((lb) => lb.status === "submitted");

  const lowBalance = enrollments
    .filter((e) => e.status === "active")
    .filter((e) => {
      const inv = invoiceByEnrollment.get(e.id);
      if (!inv || inv.status !== "paid") return false;
      const left = hoursLeft(e.package_minutes, lessonsByClass.get(e.class_id) ?? [], inv.paid_at);
      return left < 60;
    }).length;

  const totalMargin = classes.reduce(
    (sum, c) => sum + (revenueByClass.get(c.id) ?? 0) - (costByClass.get(c.id) ?? 0),
    0,
  );
  const unpaidTotal = unpaid.reduce((sum, i) => sum + i.amount_rp, 0);

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-section">
      <header>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Yang butuh tindakan Anda hari ini.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Margin total", value: formatRupiah(totalMargin), tone: totalMargin < 0 ? "text-danger" : "text-navy", href: "/admin/classes" },
          { label: "Belum dibayar", value: `${unpaid.length} · ${formatRupiah(unpaidTotal)}`, tone: "text-navy", href: "/admin/invoices" },
          { label: "Logbook menunggu", value: String(pendingLogbooks.length), tone: "text-navy", href: "/admin/logbooks" },
          { label: "Siswa sisa < 1 jam", value: String(lowBalance), tone: lowBalance > 0 ? "text-danger" : "text-navy", href: "/admin/students" },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="min-w-0 overflow-hidden rounded-card border border-cloud bg-white px-4 py-3 transition hover:bg-surface"
          >
            <div className="truncate text-xs font-medium text-muted">{stat.label}</div>
            <div className={`mt-1 truncate text-xl font-semibold sm:text-2xl ${stat.tone}`}>{stat.value}</div>
          </Link>
        ))}
      </div>

      <section className={card} aria-labelledby="unpaid-heading">
        <div className="flex items-center justify-between gap-3 border-b border-cloud px-5 py-3">
          <h2 id="unpaid-heading" className={sectionTitle}>Invoice belum dibayar</h2>
          <Link href="/admin/invoices" className="text-sm font-medium text-navy underline">Lihat semua</Link>
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
                  variant="danger"
                  confirmText="Batalkan invoice ini? Kursinya akan dilepas."
                  confirmTone="danger"
                  successMessage="Invoice dibatalkan"
                  className="shrink-0"
                >
                  Batalkan
                </ActionButton>
              </div>
            );
          })}
          {unpaid.length === 0 && (
            <EmptyState title="Semua invoice sudah dibayar" description="Tidak ada yang perlu ditagih." />
          )}
        </div>
      </section>

      <section className={card} aria-labelledby="logbook-heading">
        <div className="flex items-center justify-between gap-3 border-b border-cloud px-5 py-3">
          <h2 id="logbook-heading" className={sectionTitle}>Logbook menunggu persetujuan</h2>
          <Link href="/admin/logbooks" className="text-sm font-medium text-navy underline">Lihat semua</Link>
        </div>
        <div className="divide-y divide-cloud/70">
          {pendingLogbooks.map((lb) => {
            const cls = classById.get(lb.class_id);
            return (
              <div key={lb.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{cls?.name ?? "-"}</span>
                  <span className="text-sm text-muted">Periode {lb.period}</span>
                  <Badge status={lb.status} />
                </div>
                <Link
                  href={`/admin/logbooks/${lb.id}`}
                  className="shrink-0 rounded-card bg-navy px-3 py-1.5 text-sm font-medium text-white"
                >
                  Tinjau &amp; setujui
                </Link>
              </div>
            );
          })}
          {pendingLogbooks.length === 0 && (
            <EmptyState title="Tidak ada logbook menunggu" description="Semua logbook sudah diproses." />
          )}
        </div>
      </section>
    </div>
  );
}
