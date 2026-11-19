import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import { formatRupiah, formatMinutes, formatDateTimeWIB } from "@/lib/utils";

export default async function TutorDashboard() {
  const supabase = await createClient();

  const [classesR, earningsR, logbooksR, lessonsR] = await Promise.all([
    supabase.from("classes").select("id, name, capacity, package_minutes"),
    supabase.from("tutor_earnings").select("id, class_id, logbook_id, lesson_id, minutes, rate_rp, amount_rp"),
    supabase.from("logbooks").select("id, period, class_id, status"),
    supabase.from("lessons").select("id, starts_at"),
  ]);

  const classes = classesR.data ?? [];
  const earnings = earningsR.data ?? [];
  const logbooks = logbooksR.data ?? [];
  const lessons = lessonsR.data ?? [];

  const classById = new Map(classes.map((c) => [c.id, c]));
  const logbookById = new Map(logbooks.map((l) => [l.id, l]));
  const lessonById = new Map(lessons.map((l) => [l.id, l]));

  const byLogbook = new Map<string, typeof earnings>();
  for (const e of earnings) {
    const list = byLogbook.get(e.logbook_id) ?? [];
    list.push(e);
    byLogbook.set(e.logbook_id, list);
  }
  const groups = [...byLogbook.entries()].sort((a, b) =>
    (logbookById.get(b[0])?.period ?? "").localeCompare(logbookById.get(a[0])?.period ?? ""),
  );

  const classTotals = new Map<string, number>();
  for (const e of earnings) {
    classTotals.set(e.class_id, (classTotals.get(e.class_id) ?? 0) + e.amount_rp);
  }
  const grandTotal = [...classTotals.values()].reduce((a, b) => a + b, 0);

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold">Dashboard Tutor</h1>
        <p className="mt-1 text-sm text-muted">
          Kelas yang Anda ajar dan slip earnings per bulan.
        </p>
      </header>

      <section className={card} aria-labelledby="classes-heading">
        <h2 id="classes-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Kelas saya
        </h2>
        <div className="divide-y divide-cloud">
          {classes.map((c) => (
            <Link
              key={c.id}
              href={`/tutor/classes/${c.id}`}
              className="flex items-center justify-between px-5 py-4 transition hover:bg-surface"
            >
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted">
                  Kapasitas {c.capacity} · Paket {formatMinutes(c.package_minutes)}
                </div>
              </div>
              <span className="text-sm font-medium text-navy underline">Kelola</span>
            </Link>
          ))}
          {classes.length === 0 && (
            <p className="px-5 py-4 text-sm text-muted">Belum ada kelas yang ditugaskan.</p>
          )}
        </div>
      </section>

      <section className={card} aria-labelledby="earnings-heading">
        <h2 id="earnings-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Slip earnings
        </h2>

        <div className="space-y-6 p-5">
          {groups.map(([logbookId, rows]) => {
            const lb = logbookById.get(logbookId);
            const total = rows.reduce((s, r) => s + r.amount_rp, 0);
            return (
              <div key={logbookId} className="overflow-x-auto">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-medium">{classById.get(lb?.class_id ?? "")?.name ?? "-"}</span>
                  <span className="text-sm text-muted">Periode {lb?.period}</span>
                  <Badge status={lb?.status ?? ""} />
                </div>
                <table className="w-full text-sm tabular-nums">
                  <thead>
                    <tr className="border-b border-cloud text-left">
                      <th className="py-1.5 pr-4 text-xs font-semibold uppercase tracking-wider text-muted">Lesson</th>
                      <th className="py-1.5 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">Durasi</th>
                      <th className="py-1.5 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">Rate</th>
                      <th className="py-1.5 text-right text-xs font-semibold uppercase tracking-wider text-muted">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-cloud last:border-0">
                        <td className="py-1.5 pr-4">
                          {lessonById.get(r.lesson_id) ? formatDateTimeWIB(lessonById.get(r.lesson_id)!.starts_at) : "-"}
                        </td>
                        <td className="py-1.5 pr-4 text-right">{formatMinutes(r.minutes)}</td>
                        <td className="py-1.5 pr-4 text-right">{formatRupiah(r.rate_rp)}/jam</td>
                        <td className="py-1.5 text-right font-medium">{formatRupiah(r.amount_rp)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="py-2 pr-4 text-right text-muted">Subtotal</td>
                      <td className="py-2 text-right font-semibold">{formatRupiah(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
          {groups.length === 0 && (
            <p className="text-sm text-muted">Belum ada earnings.</p>
          )}
        </div>

        {classTotals.size > 0 && (
          <div className="border-t border-cloud px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                {[...classTotals.entries()].map(([cid, total]) => (
                  <div key={cid} className="text-muted">
                    {classById.get(cid)?.name ?? "-"}: <span className="font-medium text-navy">{formatRupiah(total)}</span>
                  </div>
                ))}
              </div>
              <div className="font-semibold">Total: {formatRupiah(grandTotal)}</div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
