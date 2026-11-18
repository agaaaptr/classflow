import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/Badge";
import ActionButton from "@/components/ActionButton";
import { approveLogbook } from "@/lib/actions/logbooks";
import { formatRupiah, formatDateTimeWIB, formatMinutes } from "@/lib/utils";

export default async function AdminLogbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: logbook } = await supabase
    .from("logbooks")
    .select("id, class_id, period, status")
    .eq("id", id)
    .single();
  if (!logbook) notFound();

  const [{ data: cls }, { data: entries }] = await Promise.all([
    supabase.from("classes").select("name").eq("id", logbook.class_id).single(),
    supabase
      .from("logbook_entries")
      .select("id, lesson_id, topic, activities, observation, recommendation")
      .eq("logbook_id", id),
  ]);

  const lessonIds = (entries ?? []).map((e) => e.lesson_id);
  const [{ data: lessons }, { data: preview }] = await Promise.all([
    lessonIds.length
      ? supabase.from("lessons").select("id, starts_at, ends_at").in("id", lessonIds)
      : Promise.resolve({ data: [] }),
    supabase.rpc("logbook_earnings", { p_logbook_id: id }),
  ]);

  const lessonById = new Map((lessons ?? []).map((l) => [l.id, l]));
  const earningsPreview = preview ?? [];
  const minutesById = new Map(earningsPreview.map((p) => [p.lesson_id, p.minutes]));
  const total = earningsPreview.reduce((sum, p) => sum + p.amount_rp, 0);

  const card = "rounded-card border border-cloud bg-white";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            Logbook {cls?.name ?? "-"} · {logbook.period}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Preview earnings tutor sebelum menyetujui. Approve bersifat idempoten.
          </p>
        </div>
        <Badge status={logbook.status} />
      </header>

      {/* Earnings preview (same expression the approve RPC persists) */}
      <section className={card} aria-labelledby="preview-heading">
        <h2 id="preview-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Preview earnings tutor
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cloud text-left text-muted">
                <th className="px-5 py-2 font-medium">Lesson</th>
                <th className="px-5 py-2 font-medium">Durasi</th>
                <th className="px-5 py-2 font-medium">Rate</th>
                <th className="px-5 py-2 font-medium">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {earningsPreview.map((row) => {
                const lesson = lessonById.get(row.lesson_id);
                return (
                  <tr key={row.lesson_id} className="border-b border-cloud last:border-0">
                    <td className="px-5 py-2">
                      {lesson ? formatDateTimeWIB(lesson.starts_at) : "-"}
                    </td>
                    <td className="px-5 py-2">{formatMinutes(row.minutes)}</td>
                    <td className="px-5 py-2">{formatRupiah(row.rate_rp)}/jam</td>
                    <td className="px-5 py-2 font-medium">{formatRupiah(row.amount_rp)}</td>
                  </tr>
                );
              })}
              {earningsPreview.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-4 text-muted">Belum ada entry.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cloud px-5 py-3">
          <div className="text-sm font-semibold">
            Total: {formatRupiah(total)}
          </div>
          {logbook.status === "submitted" && (
            <ActionButton
              action={approveLogbook}
              args={[logbook.id]}
              confirmText={`Setujui logbook dan catat earnings ${formatRupiah(total)}?`}
              className="rounded-card bg-success px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Setujui logbook
            </ActionButton>
          )}
        </div>
      </section>

      {/* Entries */}
      <section className={card} aria-labelledby="entries-heading">
        <h2 id="entries-heading" className="border-b border-cloud px-5 py-3 text-sm font-semibold">
          Entri logbook
        </h2>
        <div className="divide-y divide-cloud">
          {(entries ?? []).map((entry) => {
            const lesson = lessonById.get(entry.lesson_id);
            return (
              <article key={entry.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium">{entry.topic}</h3>
                  <div className="text-xs text-muted">
                    {lesson ? formatDateTimeWIB(lesson.starts_at) : ""}
                  </div>
                </div>
                <dl className="mt-2 space-y-1 text-sm">
                  <div>
                    <dt className="inline font-medium">Aktivitas: </dt>
                    <dd className="inline">{entry.activities}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Observasi: </dt>
                    <dd className="inline">{entry.observation}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">Rekomendasi: </dt>
                    <dd className="inline">{entry.recommendation}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
          {(entries ?? []).length === 0 && (
            <p className="px-5 py-4 text-sm text-muted">Belum ada entry.</p>
          )}
        </div>
      </section>
    </div>
  );
}
