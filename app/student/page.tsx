import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import ActionButton from "@/components/ActionButton";
import { enrollStudent } from "@/lib/actions/enrollments";
import { payInvoice } from "@/lib/actions/invoices";
import {
  formatRupiah,
  formatMinutes,
  formatDateTimeWIB,
  hoursLeft,
} from "@/lib/utils";

export default async function StudentDashboard() {
  const supabase = await createClient();

  const [classesR, enrollmentsR, invoicesR, lessonsR, logbooksR] = await Promise.all([
    supabase.from("classes").select("id, name, capacity, package_minutes"),
    supabase.from("enrollments").select("id, class_id, student_id, package_minutes, status"),
    supabase.from("invoices").select("id, enrollment_id, amount_rp, status, paid_at"),
    supabase.from("lessons").select("class_id, starts_at, ends_at").order("starts_at"),
    supabase.from("logbooks").select("id, class_id, period, status").eq("status", "approved"),
  ]);

  const classes = classesR.data ?? [];
  const enrollments = enrollmentsR.data ?? [];
  const invoices = invoicesR.data ?? [];
  const lessons = lessonsR.data ?? [];
  const logbooks = logbooksR.data ?? [];

  const classById = new Map(classes.map((c) => [c.id, c]));
  const invoiceByEnrollment = new Map(invoices.map((i) => [i.enrollment_id, i]));
  const lessonsByClass = new Map<string, { starts_at: string; ends_at: string }[]>();
  for (const l of lessons) {
    const list = lessonsByClass.get(l.class_id) ?? [];
    list.push(l);
    lessonsByClass.set(l.class_id, list);
  }
  const logbooksByClass = new Map<string, typeof logbooks>();
  for (const lb of logbooks) {
    const list = logbooksByClass.get(lb.class_id) ?? [];
    list.push(lb);
    logbooksByClass.set(lb.class_id, list);
  }

  const logbookIds = logbooks.map((l) => l.id);
  let entries: { id: string; logbook_id: string; topic: string; observation: string }[] = [];
  if (logbookIds.length) {
    const { data } = await supabase
      .from("logbook_entries")
      .select("id, logbook_id, topic, observation")
      .in("logbook_id", logbookIds);
    entries = data ?? [];
  }
  const entriesByLogbook = new Map<string, typeof entries>();
  for (const e of entries ?? []) {
    const list = entriesByLogbook.get(e.logbook_id) ?? [];
    list.push(e);
    entriesByLogbook.set(e.logbook_id, list);
  }

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const enrolledClassIds = new Set(activeEnrollments.map((e) => e.class_id));
  const available = classes.filter((c) => !enrolledClassIds.has(c.id));

  // "now" is the request time; the page is dynamic (cookies), so this is a
  // per-request snapshot, not a render-time side effect.
  const now = Date.now(); // eslint-disable-line react-hooks/purity
  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold">Dashboard Siswa</h1>
        <p className="mt-1 text-sm text-muted">
          Kelas saya, sisa jam, jadwal, dan logbook yang sudah disetujui.
        </p>
      </header>

      {/* My classes */}
      <section className={card} aria-labelledby="mine-heading">
        <h2 id="mine-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Kelas saya
        </h2>
        <div className="divide-y divide-cloud">
          {activeEnrollments.map((enr) => {
            const cls = classById.get(enr.class_id);
            const inv = invoiceByEnrollment.get(enr.id);
            const paid = inv?.status === "paid";
            const left = paid
              ? hoursLeft(enr.package_minutes, lessonsByClass.get(enr.class_id) ?? [], inv!.paid_at)
              : null;
            const classLessons = lessonsByClass.get(enr.class_id) ?? [];
            const upcoming = classLessons.filter((l) => new Date(l.ends_at).getTime() > now);
            const classLogbooks = logbooksByClass.get(enr.class_id) ?? [];

            return (
              <div key={enr.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cls?.name ?? "-"}</span>
                    <Badge status={inv?.status ?? "unpaid"} />
                  </div>
                  {paid && left !== null && (
                    <div className="text-sm">
                      Sisa jam: <span className="font-semibold">{formatMinutes(left)}</span>
                    </div>
                  )}
                </div>

                {!paid && inv && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-card border border-cloud bg-surface px-4 py-3">
                    <div className="text-sm">
                      Invoice: <span className="font-semibold">{formatRupiah(inv.amount_rp)}</span>
                      <span className="ml-2 text-muted">belum dibayar</span>
                    </div>
                    <ActionButton
                      action={payInvoice}
                      args={[inv.id]}
                      className="rounded-card bg-success px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Bayar
                    </ActionButton>
                  </div>
                )}

                {paid && (
                  <div className="mt-3 space-y-3">
                    {upcoming.length > 0 && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted">Jadwal berikutnya</div>
                        <ul className="mt-1 space-y-1 text-sm">
                          {upcoming.slice(0, 5).map((l) => (
                            <li key={l.starts_at}>{formatDateTimeWIB(l.starts_at)}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {classLogbooks.length > 0 && (
                      <div>
                        <div className="text-xs font-medium uppercase tracking-wide text-muted">Logbook disetujui</div>
                        <div className="mt-1 space-y-2">
                          {classLogbooks.map((lb) => (
                            <div key={lb.id} className="rounded-card border border-cloud bg-surface px-3 py-2">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Periode {lb.period}</span>
                                <Badge status="approved" />
                              </div>
                              <ul className="mt-1 space-y-0.5 text-sm">
                                {(entriesByLogbook.get(lb.id) ?? []).map((e) => (
                                  <li key={e.id}>
                                    <span className="font-medium">{e.topic}</span>
                                    {e.observation ? ` — ${e.observation}` : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {activeEnrollments.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted">Belum terdaftar di kelas mana pun.</p>
          )}
        </div>
      </section>

      {/* Available classes */}
      <section className={card} aria-labelledby="available-heading">
        <h2 id="available-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Kelas tersedia
        </h2>
        <div className="divide-y divide-cloud">
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
                className="rounded-card bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Daftar
              </ActionButton>
            </div>
          ))}
          {available.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted">Tidak ada kelas lain yang tersedia.</p>
          )}
        </div>
      </section>
    </div>
  );
}
